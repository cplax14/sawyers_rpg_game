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
  SaveSyncStatus
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
          reject({
            success: false,
            error: new Error(`Failed to open IndexedDB: ${request.error?.message}`)
          });
        };

        request.onsuccess = () => {
          this.db = request.result;

          // Set up error handling
          this.db.onerror = (event) => {
            console.error('IndexedDB error:', event);
          };

          resolve({
            success: true,
            data: undefined
          });
        };

        request.onupgradeneeded = (event) => {
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
        error: error instanceof Error ? error : new Error('Unknown initialization error')
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
        error: new Error('Database not initialized')
      };
    }

    try {
      onProgress?.(0, 'Preparing save data...');

      // Validate slot number
      if (slotNumber < 0 || slotNumber >= this.config.maxSaveSlots) {
        return {
          success: false,
          error: new Error(`Invalid slot number: ${slotNumber}`)
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
          error: new Error(`Save data too large: ${(dataSize / 1024 / 1024).toFixed(2)}MB (max: ${this.config.maxSaveFileSizeMB}MB)`)
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

      // Save full data
      const saveId = `slot_${slotNumber}`;
      await this.promisifyRequest(saveStore.put({
        id: saveId,
        slotNumber,
        ...processedData
      }));

      // Save metadata separately for quick access
      await this.promisifyRequest(metadataStore.put({
        id: saveId,
        slotNumber,
        ...processedData.metadata,
        playerSummary: processedData.playerSummary,
        progressSummary: processedData.progressSummary
      }));

      onProgress?.(100, 'Save completed');

      return {
        success: true,
        data: processedData
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown save error')
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
        error: new Error('Database not initialized')
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
          error: new Error(`No save data found in slot ${slotNumber}`)
        };
      }

      onProgress?.(60, 'Validating save data...');

      // Validate save data
      const validationResult = await this.validateSaveData(saveData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: new Error(`Save data validation failed: ${validationResult.errors.join(', ')}`)
        };
      }

      onProgress?.(80, 'Decompressing data...');

      // Decompress if necessary
      let processedData = saveData;
      if (saveData.isCompressed) {
        processedData = await this.decompressGameData(saveData);
      }

      onProgress?.(90, 'Updating access time...');

      // Update last accessed time
      processedData.metadata.lastAccessed = new Date();
      await this.promisifyRequest(metadataStore.put({
        id: saveId,
        slotNumber,
        ...processedData.metadata,
        playerSummary: processedData.playerSummary,
        progressSummary: processedData.progressSummary
      }));

      onProgress?.(100, 'Load completed');

      return {
        success: true,
        data: processedData,
        warnings: validationResult.warnings
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown load error')
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
        error: new Error('Database not initialized')
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
        this.promisifyRequest(syncStateStore.delete(slotNumber))
      ]);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown delete error')
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
        error: new Error('Database not initialized')
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
          lastError: null
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
            lastError: null
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
        data: slotInfo
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error getting slot info')
      };
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(): Promise<SaveOperationResult<{used: number, available: number, total: number}>> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          success: true,
          data: {
            used: estimate.usage || 0,
            total: estimate.quota || 0,
            available: (estimate.quota || 0) - (estimate.usage || 0)
          }
        };
      } else {
        // Fallback estimation
        return {
          success: true,
          data: {
            used: 0,
            total: this.config.localStorageQuotaMB * 1024 * 1024,
            available: this.config.localStorageQuotaMB * 1024 * 1024
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Could not get storage quota')
      };
    }
  }

  /**
   * Cleanup old saves and optimize database
   */
  async cleanup(): Promise<SaveOperationResult<{deletedCount: number, reclaimedBytes: number}>> {
    if (!this.db) {
      return {
        success: false,
        error: new Error('Database not initialized')
      };
    }

    try {
      // This would implement cleanup logic like:
      // - Remove corrupted saves
      // - Clean up orphaned metadata
      // - Compress old saves
      // - Remove temporary files

      return {
        success: true,
        data: { deletedCount: 0, reclaimedBytes: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Cleanup failed')
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
      request.onerror = () => reject(request.error);
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
      isCompressed: true
    };
  }

  private async decompressGameData(gameData: SaveGameData): Promise<SaveGameData> {
    if (!gameData.isCompressed) return gameData;

    const decompressed = this.simpleDecompress(gameData.gameState as any);
    const parsedState = JSON.parse(decompressed);

    return {
      ...gameData,
      gameState: parsedState,
      isCompressed: false
    };
  }

  private simpleCompress(data: string): string {
    // Placeholder compression - in production use a real compression library
    return btoa(data);
  }

  private simpleDecompress(data: string): string {
    // Placeholder decompression
    return atob(data);
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
      dataIntegrityValid: errors.length === 0
    };
  }

  private isVersionCompatible(saveVersion: string): boolean {
    // Simple version compatibility check
    return true; // For now, accept all versions
  }
}