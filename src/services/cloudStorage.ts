/**
 * Cloud Storage Service
 * Handles all cloud storage operations using Firebase Firestore and Storage
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
  listAll
} from 'firebase/storage';
import { User } from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseStorage } from '../config/firebase';
import { ReactGameState } from '../types/game';
import { DataCompressor, CompressionResult, CompressionConfig } from '../utils/compression';
import { convertFirebaseError, CloudError, logCloudError } from '../utils/cloudErrors';
import { retry, RetryConfig, RETRY_CONFIGS } from '../utils/retryManager';

// Cloud save data types
export interface CloudSaveMetadata {
  id: string;
  userId: string;
  slotNumber: number;
  saveName: string;
  gameVersion: string;
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
  playtime: number;
  playerLevel: number;
  currentArea: string;
  dataSize: number;
  compressedSize: number;
  checksum: string;
  compressionRatio: number;
  compressionAlgorithm: string;
  isCompressed: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  deviceInfo?: {
    platform: string;
    userAgent: string;
    timestamp: number;
  };
}

export interface CloudSaveData {
  metadata: CloudSaveMetadata;
  gameState: ReactGameState | CompressionResult;
  screenshot?: string; // Base64 encoded screenshot
  compressionMetadata?: {
    originalSize: number;
    compressedSize: number;
    algorithm: string;
    isCompressed: boolean;
  };
}

export interface CloudSaveListItem {
  id: string;
  slotNumber: number;
  saveName: string;
  createdAt: Date;
  updatedAt: Date;
  playtime: number;
  playerLevel: number;
  currentArea: string;
  dataSize: number;
  compressedSize: number;
  compressionRatio: number;
  isCompressed: boolean;
  syncStatus: CloudSaveMetadata['syncStatus'];
  hasScreenshot: boolean;
}

export interface CloudStorageConfig {
  maxSaves: number;
  maxSaveSize: number; // bytes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  checksumValidation: boolean;
  compressionConfig?: CompressionConfig;
}

export interface CloudStorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    operationId: string;
    timestamp: number;
    executionTime: number;
  };
}

/**
 * Cloud Storage Service Class
 */
export class CloudStorageService {
  private firestore;
  private storage;
  private config: CloudStorageConfig;
  private compressor: DataCompressor;

  constructor(config: Partial<CloudStorageConfig> = {}) {
    this.firestore = getFirebaseFirestore();
    this.storage = getFirebaseStorage();
    this.config = {
      maxSaves: 10,
      maxSaveSize: 50 * 1024 * 1024, // 50MB
      compressionEnabled: true,
      encryptionEnabled: false, // TODO: Implement encryption
      checksumValidation: true,
      compressionConfig: {
        algorithm: 'lz-string',
        level: 'balanced',
        enableBase64: true,
        chunkSize: 64 * 1024,
        minimumCompressionRatio: 0.1
      },
      ...config
    };

    // Initialize compressor with configuration
    this.compressor = new DataCompressor(this.config.compressionConfig, {
      includeMetadata: true,
      stripFunctions: true,
      preserveUndefined: false
    });
  }

  /**
   * Generate a simple checksum for data integrity
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create device info for tracking saves
   */
  private createDeviceInfo(): CloudSaveMetadata['deviceInfo'] {
    return {
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent || 'unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Compress game state data using advanced compression
   */
  private async compressGameStateData(gameState: ReactGameState): Promise<CompressionResult> {
    if (!this.config.compressionEnabled) {
      const serialized = JSON.stringify(gameState);
      return {
        data: serialized,
        originalSize: new Blob([serialized]).size,
        compressedSize: new Blob([serialized]).size,
        compressionRatio: 0,
        algorithm: 'none',
        isCompressed: false,
        metadata: {
          timestamp: new Date(),
          checksum: this.generateChecksum(serialized),
          version: '1.0.0'
        }
      };
    }

    try {
      return await this.compressor.compressGameState(gameState);
    } catch (error) {
      logCloudError(convertFirebaseError(error), 'compressGameStateData');
      // Fallback to uncompressed
      const serialized = JSON.stringify(gameState);
      return {
        data: serialized,
        originalSize: new Blob([serialized]).size,
        compressedSize: new Blob([serialized]).size,
        compressionRatio: 0,
        algorithm: 'none',
        isCompressed: false,
        metadata: {
          timestamp: new Date(),
          checksum: this.generateChecksum(serialized),
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Decompress game state data using advanced decompression
   */
  private async decompressGameStateData(compressionResult: CompressionResult | string): Promise<ReactGameState> {
    if (!this.config.compressionEnabled || typeof compressionResult === 'string') {
      const data = typeof compressionResult === 'string' ? compressionResult : compressionResult.data;
      return JSON.parse(data);
    }

    try {
      return await this.compressor.decompressGameState(compressionResult);
    } catch (error) {
      logCloudError(convertFirebaseError(error), 'decompressGameStateData');
      throw error;
    }
  }

  /**
   * Save game state to cloud
   */
  async saveToCloud(
    user: User,
    slotNumber: number,
    saveName: string,
    gameState: ReactGameState,
    screenshot?: string
  ): Promise<CloudStorageResult<CloudSaveMetadata>> {
    const operationId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Validate input
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      if (slotNumber < 0 || slotNumber >= this.config.maxSaves) {
        throw new Error(`Invalid slot number: ${slotNumber}`);
      }

      // Compress game state using advanced compression
      const compressionResult = await this.compressGameStateData(gameState);

      // Check size limits (use compressed size)
      if (compressionResult.compressedSize > this.config.maxSaveSize) {
        throw new Error(`Save data too large: ${compressionResult.compressedSize} bytes (max: ${this.config.maxSaveSize})`);
      }

      // Create metadata with compression information
      const saveId = `${user.uid}_slot_${slotNumber}`;
      const metadata: CloudSaveMetadata = {
        id: saveId,
        userId: user.uid,
        slotNumber,
        saveName,
        gameVersion: '1.0.0', // TODO: Get from config
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPlayedAt: new Date(),
        playtime: gameState.totalPlayTime || 0,
        playerLevel: gameState.player?.level || 1,
        currentArea: gameState.currentArea || 'unknown',
        dataSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        checksum: compressionResult.metadata.checksum,
        compressionRatio: compressionResult.compressionRatio,
        compressionAlgorithm: compressionResult.algorithm,
        isCompressed: compressionResult.isCompressed,
        syncStatus: 'pending',
        deviceInfo: this.createDeviceInfo()
      };

      // Use batch write for atomic operation
      const batch = writeBatch(this.firestore);

      // Save metadata to Firestore
      const metadataRef = doc(this.firestore, 'users', user.uid, 'saves', saveId);
      batch.set(metadataRef, {
        ...metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Save game state data to Firestore with compression metadata
      const gameStateRef = doc(this.firestore, 'users', user.uid, 'saveData', saveId);
      batch.set(gameStateRef, {
        id: saveId,
        gameState: compressionResult.data,
        compressionMetadata: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          algorithm: compressionResult.algorithm,
          isCompressed: compressionResult.isCompressed,
          compressionRatio: compressionResult.compressionRatio,
          checksum: compressionResult.metadata.checksum,
          timestamp: compressionResult.metadata.timestamp,
          version: compressionResult.metadata.version
        },
        chunks: compressionResult.chunks, // For large data handling
        updatedAt: serverTimestamp()
      });

      // Execute batch write with retry logic
      await retry.critical(() => batch.commit(), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying save operation, attempt ${attempt}, delay ${delay}ms:`, error);
        },
        onMaxRetriesExceeded: (error, totalAttempts) => {
          console.error(`Save operation failed after ${totalAttempts} attempts:`, error);
        }
      });

      // Upload screenshot to Storage if provided
      if (screenshot) {
        try {
          const screenshotRef = ref(this.storage, `users/${user.uid}/screenshots/${saveId}.png`);
          const screenshotBlob = new Blob([atob(screenshot.split(',')[1])], { type: 'image/png' });

          await retry.network(() => uploadBytes(screenshotRef, screenshotBlob), {
            onRetry: (error, attempt, delay) => {
              console.log(`Retrying screenshot upload, attempt ${attempt}, delay ${delay}ms:`, error);
            }
          });
        } catch (error) {
          console.warn('Failed to upload screenshot after retries:', error);
          // Continue without screenshot - not critical
        }
      }

      // Update sync status to synced with retry
      await retry.network(() => updateDoc(metadataRef, { syncStatus: 'synced' }));
      metadata.syncStatus = 'synced';

      return {
        success: true,
        data: metadata,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Cloud save failed:', error);

      return {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Load game state from cloud
   */
  async loadFromCloud(
    user: User,
    slotNumber: number
  ): Promise<CloudStorageResult<CloudSaveData>> {
    const operationId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const saveId = `${user.uid}_slot_${slotNumber}`;

      // Load metadata with retry
      const metadataRef = doc(this.firestore, 'users', user.uid, 'saves', saveId);
      const metadataSnap = await retry.critical(() => getDoc(metadataRef), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying metadata load, attempt ${attempt}, delay ${delay}ms:`, error);
        }
      });

      if (!metadataSnap.exists()) {
        throw new Error('Save not found');
      }

      const rawMetadata = metadataSnap.data();
      const metadata: CloudSaveMetadata = {
        ...rawMetadata,
        createdAt: rawMetadata.createdAt?.toDate() || new Date(),
        updatedAt: rawMetadata.updatedAt?.toDate() || new Date(),
        lastPlayedAt: rawMetadata.lastPlayedAt?.toDate()
      } as CloudSaveMetadata;

      // Load game state data with retry
      const gameStateRef = doc(this.firestore, 'users', user.uid, 'saveData', saveId);
      const gameStateSnap = await retry.critical(() => getDoc(gameStateRef), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying game state load, attempt ${attempt}, delay ${delay}ms:`, error);
        }
      });

      if (!gameStateSnap.exists()) {
        throw new Error('Save data not found');
      }

      const gameStateDoc = gameStateSnap.data();
      const compressionMetadata = gameStateDoc.compressionMetadata;
      const chunks = gameStateDoc.chunks;

      let gameState: ReactGameState;

      // Handle new compression format
      if (compressionMetadata) {
        const compressionResult: CompressionResult = {
          data: chunks ? chunks.join('') : gameStateDoc.gameState,
          originalSize: compressionMetadata.originalSize,
          compressedSize: compressionMetadata.compressedSize,
          compressionRatio: compressionMetadata.compressionRatio || 0,
          algorithm: compressionMetadata.algorithm,
          isCompressed: compressionMetadata.isCompressed,
          chunks,
          metadata: {
            timestamp: compressionMetadata.timestamp ? new Date(compressionMetadata.timestamp) : new Date(),
            checksum: compressionMetadata.checksum,
            version: compressionMetadata.version || '1.0.0'
          }
        };

        gameState = await this.decompressGameStateData(compressionResult);

        // Validate checksum if enabled
        if (this.config.checksumValidation && compressionResult.metadata.checksum) {
          const serialized = JSON.stringify(gameState);
          const calculatedChecksum = this.generateChecksum(serialized);
          if (calculatedChecksum !== compressionResult.metadata.checksum) {
            throw new Error(`Data integrity check failed: expected ${compressionResult.metadata.checksum}, got ${calculatedChecksum}`);
          }
        }
      } else {
        // Handle legacy format (backward compatibility)
        const compressedState = gameStateDoc.gameState;
        const storedChecksum = gameStateDoc.checksum;

        // Try new decompression first, fallback to legacy
        try {
          gameState = await this.decompressGameStateData(compressedState);
        } catch {
          // Legacy fallback
          const decompressedState = compressedState; // Assume uncompressed for legacy
          gameState = JSON.parse(decompressedState);
        }

        // Legacy checksum validation
        if (this.config.checksumValidation && storedChecksum) {
          const serialized = JSON.stringify(gameState);
          const calculatedChecksum = this.generateChecksum(serialized);
          if (calculatedChecksum !== storedChecksum) {
            throw new Error('Data integrity check failed (legacy format)');
          }
        }
      }

      // Try to load screenshot
      let screenshot: string | undefined;
      try {
        const screenshotRef = ref(this.storage, `users/${user.uid}/screenshots/${saveId}.png`);
        const screenshotUrl = await retry.network(() => getDownloadURL(screenshotRef));
        // Note: In a full implementation, you'd fetch and convert to base64
        screenshot = screenshotUrl; // Using URL for now
      } catch {
        // Screenshot not available - not critical
      }

      // Update last played timestamp
      await updateDoc(metadataRef, {
        lastPlayedAt: serverTimestamp()
      });

      return {
        success: true,
        data: {
          metadata,
          gameState,
          screenshot
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Cloud load failed:', error);

      return {
        success: false,
        error: {
          code: 'LOAD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * List all cloud saves for a user
   */
  async listCloudSaves(user: User): Promise<CloudStorageResult<CloudSaveListItem[]>> {
    const operationId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const savesRef = collection(this.firestore, 'users', user.uid, 'saves');
      const q = query(savesRef, orderBy('updatedAt', 'desc'), limit(this.config.maxSaves));
      const querySnapshot = await retry.network(() => getDocs(q), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying saves list, attempt ${attempt}, delay ${delay}ms:`, error);
        }
      });

      const saves: CloudSaveListItem[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        // Check if screenshot exists
        let hasScreenshot = false;
        try {
          const screenshotRef = ref(this.storage, `users/${user.uid}/screenshots/${doc.id}.png`);
          await retry.quick(() => getMetadata(screenshotRef));
          hasScreenshot = true;
        } catch {
          hasScreenshot = false;
        }

        saves.push({
          id: doc.id,
          slotNumber: data.slotNumber,
          saveName: data.saveName,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          playtime: data.playtime || 0,
          playerLevel: data.playerLevel || 1,
          currentArea: data.currentArea || 'unknown',
          dataSize: data.dataSize || 0,
          compressedSize: data.compressedSize || data.dataSize || 0,
          compressionRatio: data.compressionRatio || 0,
          isCompressed: data.isCompressed || false,
          syncStatus: data.syncStatus || 'synced',
          hasScreenshot
        });
      }

      return {
        success: true,
        data: saves,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to list cloud saves:', error);

      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Delete a cloud save
   */
  async deleteCloudSave(
    user: User,
    slotNumber: number
  ): Promise<CloudStorageResult<void>> {
    const operationId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const saveId = `${user.uid}_slot_${slotNumber}`;

      // Use batch delete for atomic operation
      const batch = writeBatch(this.firestore);

      // Delete metadata
      const metadataRef = doc(this.firestore, 'users', user.uid, 'saves', saveId);
      batch.delete(metadataRef);

      // Delete game state data
      const gameStateRef = doc(this.firestore, 'users', user.uid, 'saveData', saveId);
      batch.delete(gameStateRef);

      // Execute batch delete with retry
      await retry.critical(() => batch.commit(), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying delete operation, attempt ${attempt}, delay ${delay}ms:`, error);
        },
        onMaxRetriesExceeded: (error, totalAttempts) => {
          console.error(`Delete operation failed after ${totalAttempts} attempts:`, error);
        }
      });

      // Delete screenshot from Storage
      try {
        const screenshotRef = ref(this.storage, `users/${user.uid}/screenshots/${saveId}.png`);
        await retry.network(() => deleteObject(screenshotRef));
      } catch {
        // Screenshot might not exist or failed to delete - not critical
      }

      return {
        success: true,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to delete cloud save:', error);

      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get cloud storage usage statistics
   */
  async getStorageStats(user: User): Promise<CloudStorageResult<{
    totalSaves: number;
    totalSize: number;
    quota: number;
    usagePercentage: number;
    oldestSave?: Date;
    newestSave?: Date;
  }>> {
    const operationId = `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const savesRef = collection(this.firestore, 'users', user.uid, 'saves');
      const querySnapshot = await retry.network(() => getDocs(savesRef), {
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying storage stats, attempt ${attempt}, delay ${delay}ms:`, error);
        }
      });

      let totalSize = 0;
      let oldestSave: Date | undefined;
      let newestSave: Date | undefined;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        totalSize += data.dataSize || 0;

        const createdAt = data.createdAt?.toDate();
        if (createdAt) {
          if (!oldestSave || createdAt < oldestSave) {
            oldestSave = createdAt;
          }
          if (!newestSave || createdAt > newestSave) {
            newestSave = createdAt;
          }
        }
      });

      const quota = this.config.maxSaves * this.config.maxSaveSize;
      const usagePercentage = quota > 0 ? (totalSize / quota) * 100 : 0;

      return {
        success: true,
        data: {
          totalSaves: querySnapshot.size,
          totalSize,
          quota,
          usagePercentage,
          oldestSave,
          newestSave
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to get storage stats:', error);

      return {
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Sync local saves with cloud (compare and resolve conflicts)
   */
  async syncWithCloud(
    user: User,
    localSaves: { slotNumber: number; lastModified: Date; checksum: string }[]
  ): Promise<CloudStorageResult<{
    conflicts: number;
    uploaded: number;
    downloaded: number;
    skipped: number;
  }>> {
    const operationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const cloudSaves = await this.listCloudSaves(user);
      if (!cloudSaves.success || !cloudSaves.data) {
        throw new Error('Failed to retrieve cloud saves');
      }

      let conflicts = 0;
      let uploaded = 0;
      let downloaded = 0;
      let skipped = 0;

      // Compare each local save with cloud saves
      for (const localSave of localSaves) {
        const cloudSave = cloudSaves.data.find(cs => cs.slotNumber === localSave.slotNumber);

        if (!cloudSave) {
          // Local save doesn't exist in cloud - needs upload
          // Note: This would require the actual game state data to upload
          uploaded++;
        } else {
          // Compare timestamps and checksums
          if (localSave.lastModified > cloudSave.updatedAt) {
            if (localSave.checksum !== cloudSave.id) { // Using ID as placeholder for checksum
              // Local is newer and different - upload
              uploaded++;
            } else {
              // Same data, skip
              skipped++;
            }
          } else if (localSave.lastModified < cloudSave.updatedAt) {
            // Cloud is newer - download
            downloaded++;
          } else {
            // Same timestamp - check checksum
            if (localSave.checksum !== cloudSave.id) { // Using ID as placeholder for checksum
              // Conflict: same timestamp but different data
              conflicts++;
            } else {
              // Same data, skip
              skipped++;
            }
          }
        }
      }

      return {
        success: true,
        data: {
          conflicts,
          uploaded,
          downloaded,
          skipped
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Sync failed:', error);

      return {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get compression statistics for user's saves
   */
  async getCompressionStats(user: User): Promise<CloudStorageResult<{
    totalSaves: number;
    compressedSaves: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSpaceSaved: number;
    averageCompressionRatio: number;
    algorithmUsage: Record<string, number>;
  }>> {
    const operationId = `compression_stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const savesRef = collection(this.firestore, 'users', user.uid, 'saves');
      const querySnapshot = await getDocs(savesRef);

      let totalSaves = 0;
      let compressedSaves = 0;
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      let totalCompressionRatio = 0;
      const algorithmUsage: Record<string, number> = {};

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        totalSaves++;

        const originalSize = data.dataSize || 0;
        const compressedSize = data.compressedSize || originalSize;
        const isCompressed = data.isCompressed || false;
        const algorithm = data.compressionAlgorithm || 'none';
        const compressionRatio = data.compressionRatio || 0;

        totalOriginalSize += originalSize;
        totalCompressedSize += compressedSize;
        totalCompressionRatio += compressionRatio;

        if (isCompressed) {
          compressedSaves++;
        }

        algorithmUsage[algorithm] = (algorithmUsage[algorithm] || 0) + 1;
      }

      const totalSpaceSaved = totalOriginalSize - totalCompressedSize;
      const averageCompressionRatio = totalSaves > 0 ? totalCompressionRatio / totalSaves : 0;

      return {
        success: true,
        data: {
          totalSaves,
          compressedSaves,
          totalOriginalSize,
          totalCompressedSize,
          totalSpaceSaved,
          averageCompressionRatio,
          algorithmUsage
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to get compression stats:', error);

      return {
        success: false,
        error: {
          code: 'COMPRESSION_STATS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Create default cloud storage service instance
 */
export const createCloudStorageService = (config?: Partial<CloudStorageConfig>): CloudStorageService => {
  return new CloudStorageService(config);
};

/**
 * Default cloud storage service instance
 */
export const cloudStorageService = createCloudStorageService();