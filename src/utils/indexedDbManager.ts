/**
 * IndexedDB Manager for Save System
 * Provides robust local storage with compression, validation, and metadata management
 */

import {
  SaveGameData,
  SaveSlotInfo,
  SaveMetadata,
  SaveValidationResult,
  SaveSystemConfig,
  SaveOperationResult,
  SaveSyncStatus,
} from '../types/saveSystem';

export class IndexedDbManager {
  private db: IDBDatabase | null = null;
  private dbName = 'SawyersRPGSaveSystem';
  private dbVersion = 1;
  private config: SaveSystemConfig;

  constructor(config: SaveSystemConfig) {
    this.config = config;
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<SaveOperationResult<void>> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          const errorMessage = request.error?.message || request.error?.name || 'Unknown error';
          console.error('❌ IndexedDB open failed:', {
            error: request.error,
            errorMessage,
            readyState: request.readyState,
          });
          reject({
            success: false,
            error: new Error(`Failed to open IndexedDB: ${errorMessage}`),
          });
        };

        request.onsuccess = () => {
          this.db = request.result;

          // Set up error handling
          this.db.onerror = event => {
            const target = event.target as IDBRequest;
            const errorMessage =
              target.error?.message || target.error?.name || 'Unknown database error';
            console.error('❌ IndexedDB error:', {
              error: target.error,
              errorMessage,
              errorCode: target.error?.name,
              transaction: (event.target as any).transaction?.mode,
            });
          };

          resolve({
            success: true,
            data: undefined,
          });
        };

        request.onupgradeneeded = event => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create save data store
          if (!db.objectStoreNames.contains('saves')) {
            const saveStore = db.createObjectStore('saves', { keyPath: 'id' });
            saveStore.createIndex('slotNumber', 'slotNumber', { unique: true });
            saveStore.createIndex('lastModified', 'metadata.lastModified');
            saveStore.createIndex('isFavorite', 'metadata.isFavorite');
          }

          // Create metadata store for quick access
          if (!db.objectStoreNames.contains('metadata')) {
            const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
            metadataStore.createIndex('slotNumber', 'slotNumber', { unique: true });
            metadataStore.createIndex('lastAccessed', 'lastAccessed');
          }

          // Create configuration store
          if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config', { keyPath: 'key' });
          }

          // Create sync state store for cloud sync
          if (!db.objectStoreNames.contains('syncState')) {
            const syncStore = db.createObjectStore('syncState', { keyPath: 'slotNumber' });
            syncStore.createIndex('lastSyncAttempt', 'lastSyncAttempt');
          }
        };
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown initialization error'),
      };
    }
  }

  /**
   * Save game data to specific slot
   */
  async saveToSlot(
    slotNumber: number,
    gameData: SaveGameData,
    onProgress?: (progress: number, status: string) => void
  ): Promise<SaveOperationResult<SaveGameData>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      onProgress?.(0, 'Preparing save data...');

      // Validate slot number
      if (slotNumber < 0 || slotNumber >= this.config.maxSaveSlots) {
        return {
          success: false,
          error: new Error(`Invalid slot number: ${slotNumber}`),
        };
      }

      onProgress?.(20, 'Compressing data...');

      // Compress data if enabled
      let processedData = gameData;
      if (this.config.compressionEnabled) {
        processedData = await this.compressGameData(gameData);
      }

      onProgress?.(40, 'Validating data...');

      // Validate data size
      const dataSize = this.calculateDataSize(processedData);
      const maxSizeBytes = this.config.maxSaveFileSizeMB * 1024 * 1024;

      if (dataSize > maxSizeBytes) {
        return {
          success: false,
          error: new Error(
            `Save data too large: ${(dataSize / 1024 / 1024).toFixed(2)}MB (max: ${this.config.maxSaveFileSizeMB}MB)`
          ),
        };
      }

      onProgress?.(60, 'Updating metadata...');

      // Update metadata
      processedData.metadata.lastModified = new Date();
      processedData.metadata.fileSizeBytes = dataSize;
      processedData.metadata.slotNumber = slotNumber;

      // Generate checksum
      processedData.checksum = await this.generateChecksum(processedData);

      onProgress?.(80, 'Writing to database...');

      // Start transaction
      const transaction = this.db.transaction(['saves', 'metadata'], 'readwrite');
      const saveStore = transaction.objectStore('saves');
      const metadataStore = transaction.objectStore('metadata');

      // Add transaction error handler
      transaction.onerror = event => {
        const target = event.target as IDBRequest;
        console.error('❌ Transaction error:', {
          error: target.error,
          message: target.error?.message,
          name: target.error?.name,
        });
      };

      // Save full data
      const saveId = `slot_${slotNumber}`;

      // Delete any existing records for this slot to prevent constraint violations
      // This handles both the save data and metadata for the slot
      const slotNumberIndex = metadataStore.index('slotNumber');
      const existingMetadataRequest = slotNumberIndex.getAll(slotNumber);
      const existingMetadata = await this.promisifyRequest(existingMetadataRequest);

      // Delete all existing metadata records with this slotNumber
      for (const meta of existingMetadata) {
        await this.promisifyRequest(metadataStore.delete(meta.id));
      }

      // Now save the new data
      await this.promisifyRequest(
        saveStore.put({
          id: saveId,
          slotNumber,
          ...processedData,
        })
      );

      // Save metadata separately for quick access
      await this.promisifyRequest(
        metadataStore.put({
          id: saveId,
          slotNumber,
          ...processedData.metadata,
          playerSummary: processedData.playerSummary,
          progressSummary: processedData.progressSummary,
        })
      );

      onProgress?.(100, 'Save completed');

      return {
        success: true,
        data: processedData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown save error'),
      };
    }
  }

  /**
   * Load game data from specific slot
   */
  async loadFromSlot(
    slotNumber: number,
    onProgress?: (progress: number, status: string) => void
  ): Promise<SaveOperationResult<SaveGameData>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      onProgress?.(0, 'Loading save data...');

      const transaction = this.db.transaction(['saves', 'metadata'], 'readwrite');
      const saveStore = transaction.objectStore('saves');
      const metadataStore = transaction.objectStore('metadata');

      const saveId = `slot_${slotNumber}`;

      onProgress?.(30, 'Reading from database...');

      // Load full save data
      const saveData = await this.promisifyRequest(saveStore.get(saveId));

      if (!saveData) {
        return {
          success: false,
          error: new Error(`No save data found in slot ${slotNumber}`),
        };
      }

      // Update last accessed time BEFORE doing any async processing
      // This ensures the transaction doesn't complete before we update metadata
      saveData.metadata.lastAccessed = new Date();
      await this.promisifyRequest(
        metadataStore.put({
          id: saveId,
          slotNumber,
          ...saveData.metadata,
          playerSummary: saveData.playerSummary,
          progressSummary: saveData.progressSummary,
        })
      );

      onProgress?.(60, 'Validating save data...');

      // Validate save data (after transaction completes)
      const validationResult = await this.validateSaveData(saveData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: new Error(`Save data validation failed: ${validationResult.errors.join(', ')}`),
        };
      }

      onProgress?.(80, 'Decompressing data...');

      // Decompress if necessary (after transaction completes)
      let processedData = saveData;
      if (saveData.isCompressed) {
        processedData = await this.decompressGameData(saveData);
      }

      onProgress?.(100, 'Load completed');

      return {
        success: true,
        data: processedData,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown load error'),
      };
    }
  }

  /**
   * Delete save data from specific slot
   */
  async deleteSlot(slotNumber: number): Promise<SaveOperationResult<void>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      const transaction = this.db.transaction(['saves', 'metadata', 'syncState'], 'readwrite');
      const saveStore = transaction.objectStore('saves');
      const metadataStore = transaction.objectStore('metadata');
      const syncStateStore = transaction.objectStore('syncState');

      const saveId = `slot_${slotNumber}`;

      await Promise.all([
        this.promisifyRequest(saveStore.delete(saveId)),
        this.promisifyRequest(metadataStore.delete(saveId)),
        this.promisifyRequest(syncStateStore.delete(slotNumber)),
      ]);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown delete error'),
      };
    }
  }

  /**
   * Get information about all save slots
   */
  async getAllSlotInfo(): Promise<SaveOperationResult<SaveSlotInfo[]>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      const transaction = this.db.transaction(['metadata', 'syncState'], 'readonly');
      const metadataStore = transaction.objectStore('metadata');
      const syncStateStore = transaction.objectStore('syncState');

      const slotInfo: SaveSlotInfo[] = [];

      // Initialize all slots as empty
      for (let i = 0; i < this.config.maxSaveSlots; i++) {
        slotInfo.push({
          slotNumber: i,
          isEmpty: true,
          metadata: null,
          playerSummary: null,
          progressSummary: null,
          isLocalAvailable: false,
          isCloudAvailable: false,
          syncStatus: SaveSyncStatus.LOCAL_ONLY,
          lastError: null,
        });
      }

      // Get all metadata
      const metadataRequest = metadataStore.getAll();
      const metadataResults = await this.promisifyRequest(metadataRequest);

      // Get all sync states
      const syncStateRequest = syncStateStore.getAll();
      const syncStates = await this.promisifyRequest(syncStateRequest);

      // Process metadata results
      metadataResults.forEach((metadata: any) => {
        const slotNum = metadata.slotNumber;
        if (slotNum >= 0 && slotNum < this.config.maxSaveSlots) {
          slotInfo[slotNum] = {
            slotNumber: slotNum,
            isEmpty: false,
            metadata: metadata,
            playerSummary: metadata.playerSummary,
            progressSummary: metadata.progressSummary,
            isLocalAvailable: true,
            isCloudAvailable: false, // Will be updated by cloud sync manager
            syncStatus: SaveSyncStatus.LOCAL_ONLY,
            lastError: null,
          };
        }
      });

      // Update sync status
      syncStates.forEach((syncState: any) => {
        const slotNum = syncState.slotNumber;
        if (slotNum >= 0 && slotNum < this.config.maxSaveSlots) {
          slotInfo[slotNum].syncStatus = syncState.status;
          slotInfo[slotNum].lastError = syncState.lastError;
          slotInfo[slotNum].isCloudAvailable = syncState.isCloudAvailable;
        }
      });

      return {
        success: true,
        data: slotInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error getting slot info'),
      };
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(): Promise<
    SaveOperationResult<{ used: number; available: number; total: number }>
  > {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          success: true,
          data: {
            used: estimate.usage || 0,
            total: estimate.quota || 0,
            available: (estimate.quota || 0) - (estimate.usage || 0),
          },
        };
      } else {
        // Fallback estimation
        return {
          success: true,
          data: {
            used: 0,
            total: this.config.localStorageQuotaMB * 1024 * 1024,
            available: this.config.localStorageQuotaMB * 1024 * 1024,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Could not get storage quota'),
      };
    }
  }

  /**
   * Update sync status for a slot
   */
  async updateSyncStatus(
    slotNumber: number,
    status: SaveSyncStatus,
    isCloudAvailable: boolean = false,
    lastError: string | null = null
  ): Promise<SaveOperationResult<void>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      const transaction = this.db.transaction(['syncState'], 'readwrite');
      const syncStateStore = transaction.objectStore('syncState');

      const syncStateData = {
        slotNumber,
        status,
        isCloudAvailable,
        lastError,
        lastSyncAttempt: new Date().toISOString(),
      };

      await this.promisifyRequest(syncStateStore.put(syncStateData));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update sync status'),
      };
    }
  }

  /**
   * Cleanup old saves and optimize database
   */
  async cleanup(): Promise<SaveOperationResult<{ deletedCount: number; reclaimedBytes: number }>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized'),
      };
    }

    try {
      let deletedCount = 0;
      let reclaimedBytes = 0;

      const transaction = this.db.transaction(['saves', 'metadata'], 'readwrite');
      const saveStore = transaction.objectStore('saves');
      const metadataStore = transaction.objectStore('metadata');

      // Get all metadata records
      const allMetadata = await this.promisifyRequest(metadataStore.getAll());

      // Track valid slot numbers
      const slotRecords = new Map<number, any[]>();

      // Group metadata by slotNumber
      for (const meta of allMetadata) {
        if (meta.slotNumber !== undefined) {
          if (!slotRecords.has(meta.slotNumber)) {
            slotRecords.set(meta.slotNumber, []);
          }
          slotRecords.get(meta.slotNumber)!.push(meta);
        } else {
          // Delete corrupted metadata with no slotNumber
          console.warn('🧹 Cleaning up corrupted metadata:', meta.id, meta.name);
          await this.promisifyRequest(metadataStore.delete(meta.id));
          deletedCount++;
          reclaimedBytes += this.calculateDataSize(meta);
        }
      }

      // For each slot with multiple records, keep only the most recent
      for (const [slotNumber, records] of slotRecords) {
        if (records.length > 1) {
          // Sort by lastModified, newest first
          records.sort(
            (a, b) =>
              new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
          );

          // Keep the first (newest), delete the rest
          for (let i = 1; i < records.length; i++) {
            console.warn(
              '🧹 Cleaning up duplicate metadata for slot',
              slotNumber,
              ':',
              records[i].id
            );
            await this.promisifyRequest(metadataStore.delete(records[i].id));
            deletedCount++;
            reclaimedBytes += this.calculateDataSize(records[i]);
          }
        }
      }

      console.log(
        `✅ Cleanup completed: ${deletedCount} records removed, ${reclaimedBytes} bytes reclaimed`
      );

      return {
        success: true,
        data: { deletedCount, reclaimedBytes },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Cleanup failed'),
      };
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Private helper methods

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = request.error;
        const detailedError = new Error(
          `IndexedDB request failed: ${error?.message || error?.name || 'Unknown error'}`
        );
        // Preserve the original error for debugging
        (detailedError as any).originalError = error;
        (detailedError as any).errorCode = error?.name;
        console.error('❌ IndexedDB request error:', {
          message: error?.message,
          name: error?.name,
          code: error?.name,
          transaction: (request.transaction as any)?.mode,
          objectStore: (request.source as any)?.name,
        });
        reject(detailedError);
      };
    });
  }

  private async compressGameData(gameData: SaveGameData): Promise<SaveGameData> {
    // Simple compression implementation
    // In a real implementation, you'd use a compression library like pako
    const jsonString = JSON.stringify(gameData.gameState);
    const compressed = this.simpleCompress(jsonString);

    return {
      ...gameData,
      gameState: compressed as any,
      isCompressed: true,
    };
  }

  private async decompressGameData(gameData: SaveGameData): Promise<SaveGameData> {
    if (!gameData.isCompressed) return gameData;

    const decompressed = this.simpleDecompress(gameData.gameState as any);
    const parsedState = JSON.parse(decompressed);

    return {
      ...gameData,
      gameState: parsedState,
      isCompressed: false,
    };
  }

  private simpleCompress(data: string): string {
    // Placeholder compression - in production use a real compression library
    // Handle Unicode characters by encoding to UTF-8 first
    try {
      // Convert string to UTF-8 bytes, then to base64
      const utf8Bytes = new TextEncoder().encode(data);
      const binaryString = Array.from(utf8Bytes)
        .map(byte => String.fromCharCode(byte))
        .join('');
      return btoa(binaryString);
    } catch (error) {
      console.error('Compression failed:', error);
      // Fallback: return original data (no compression)
      return data;
    }
  }

  private simpleDecompress(data: string): string {
    // Placeholder decompression
    try {
      // Decode base64 to binary string, then to UTF-8
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (error) {
      console.error('Decompression failed:', error);
      // Fallback: return original data (no decompression)
      return data;
    }
  }

  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async generateChecksum(data: SaveGameData): Promise<string> {
    // Simple checksum generation
    const jsonString = JSON.stringify(data.gameState);
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async validateSaveData(saveData: any): Promise<SaveValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!saveData.metadata) errors.push('Missing metadata');
    if (!saveData.gameState) errors.push('Missing game state');
    if (!saveData.checksum) errors.push('Missing checksum');

    // Checksum validation
    let checksumValid = false;
    try {
      const expectedChecksum = await this.generateChecksum(saveData);
      checksumValid = expectedChecksum === saveData.checksum;
      if (!checksumValid) errors.push('Checksum validation failed');
    } catch (error) {
      errors.push('Could not validate checksum');
    }

    // Version compatibility
    const versionCompatible = this.isVersionCompatible(saveData.metadata?.saveVersion);
    if (!versionCompatible) warnings.push('Save version may be incompatible');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checksumValid,
      versionCompatible,
      dataIntegrityValid: errors.length === 0,
    };
  }

  private isVersionCompatible(saveVersion: string): boolean {
    // Simple version compatibility check
    return true; // For now, accept all versions
  }
}
