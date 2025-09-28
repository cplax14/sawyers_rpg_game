/**
 * Cloud Storage Service Tests
 * Comprehensive tests for Firebase cloud storage operations
 */

import { CloudStorageService } from '../cloudStorage';
import { DataCompressor } from '../../utils/compression';
import { ReactGameState } from '../../types/game';
import { User } from 'firebase/auth';
import { CloudError, CloudErrorCode } from '../../utils/cloudErrors';
import { validateDataIntegrity, generateChecksum, sanitizeGameStateForCloud } from '../../utils/dataIntegrity';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  where: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ serverTimestamp: true })),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn()
  }))
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  getMetadata: jest.fn(),
  listAll: jest.fn()
}));

jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(() => ({ mockFirestore: true })),
  getFirebaseStorage: jest.fn(() => ({ mockStorage: true }))
}));

jest.mock('../../utils/compression');
jest.mock('../../utils/retryManager', () => {
  const retryFn = jest.fn((fn) => fn());
  retryFn.critical = jest.fn((fn) => fn());
  retryFn.standard = jest.fn((fn) => fn());
  retryFn.light = jest.fn((fn) => fn());
  retryFn.network = jest.fn((fn) => fn());

  return {
    retry: retryFn,
    RETRY_CONFIGS: {
      CLOUD_STORAGE: { maxAttempts: 3 }
    }
  };
});
jest.mock('../../utils/dataIntegrity', () => ({
  validateDataIntegrity: jest.fn(),
  generateChecksum: jest.fn(),
  sanitizeGameStateForCloud: jest.fn((data) => data),
}));

// Import mocked modules
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

describe('CloudStorageService', () => {
  let cloudStorage: CloudStorageService;
  let mockUser: User;
  let mockCompressor: jest.Mocked<DataCompressor>;
  let mockGameState: ReactGameState;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com'
    } as User;

    // Mock compressor
    mockCompressor = {
      compress: jest.fn(),
      decompress: jest.fn(),
      compressGameState: jest.fn(),
      decompressGameState: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn()
    };
    (DataCompressor as jest.MockedClass<typeof DataCompressor>).mockImplementation(
      () => mockCompressor
    );

    // Mock game state
    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 10,
        experience: 1000,
        currentArea: 'forest'
      },
      inventory: { items: [] },
      gameFlags: {},
      story: { currentChapter: 1 },
      version: '1.0.0'
    } as ReactGameState;

    cloudStorage = new CloudStorageService();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(cloudStorage).toBeInstanceOf(CloudStorageService);
      expect(DataCompressor).toHaveBeenCalledWith(
        expect.objectContaining({
          algorithm: 'lz-string',
          level: 'balanced'
        }),
        expect.objectContaining({
          includeMetadata: true,
          stripFunctions: true,
          preserveUndefined: false
        })
      );
    });

    it('should initialize with custom compression config', () => {
      const customConfig = {
        compressionConfig: {
          algorithm: 'gzip' as const,
          level: 'medium' as const
        }
      };
      new CloudStorageService(customConfig);

      expect(DataCompressor).toHaveBeenCalledWith(
        expect.objectContaining({
          algorithm: 'gzip',
          level: 'medium'
        }),
        expect.objectContaining({
          includeMetadata: true,
          stripFunctions: true,
          preserveUndefined: false
        })
      );
    });
  });

  describe('Save Operations', () => {
    beforeEach(() => {
      // Mock compression
      mockCompressor.compress.mockResolvedValue({
        compressedData: 'compressed-game-data',
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 0.5,
        metadata: { algorithm: 'lz-string' }
      });
      mockCompressor.compressGameState.mockResolvedValue({
        compressedData: 'compressed-game-data',
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 0.5,
        metadata: { algorithm: 'lz-string' }
      });
      mockCompressor.decompressGameState.mockResolvedValue(mockGameState);

      // Mock data integrity
      (validateDataIntegrity as jest.Mock).mockResolvedValue({
        isValid: true,
        checksum: 'mock-checksum-12345',
        errors: [],
        warnings: [],
        corruptedFields: []
      });
      (generateChecksum as jest.Mock).mockResolvedValue('mock-checksum-12345');
      (sanitizeGameStateForCloud as jest.Mock).mockImplementation((data) => data);

      // Mock Firestore operations
      (doc as jest.Mock).mockReturnValue({ id: 'mock-doc-ref' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (uploadBytes as jest.Mock).mockResolvedValue({ metadata: { size: 500 } });
      (getDownloadURL as jest.Mock).mockResolvedValue('https://storage.example.com/save1.json');
      (writeBatch as jest.Mock).mockImplementation(() => ({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }));
    });

    it('should save game data successfully', async () => {
      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(true);
      expect(result.metadata).toMatchObject({
        operationId: expect.any(String),
        timestamp: expect.any(Number),
        executionTime: expect.any(Number)
      });

      // Verify compression was called
      expect(mockCompressor.compressGameState).toHaveBeenCalledWith(mockGameState);

      // Verify Firestore document creation
      expect(setDoc).toHaveBeenCalled();

      // Verify Storage upload
      expect(uploadBytes).toHaveBeenCalled();
    });

    it('should handle save validation errors', async () => {
      // Mock validation failure
      (validateDataIntegrity as jest.Mock).mockResolvedValue({
        isValid: false,
        checksum: '',
        errors: ['Invalid game state structure'],
        warnings: [],
        corruptedFields: ['player']
      });

      const invalidGameState = {} as ReactGameState;

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Invalid Save',
        invalidGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SAVE_FAILED');
    });

    it('should handle compression errors', async () => {
      mockCompressor.compress.mockRejectedValue(new Error('Compression failed'));

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.OPERATION_FAILED);
    });

    it('should handle Firestore errors', async () => {
      (setDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle Storage upload errors', async () => {
      (uploadBytes as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Load Operations', () => {
    beforeEach(() => {
      // Mock decompression
      mockCompressor.decompress.mockResolvedValue({
        decompressedData: JSON.stringify(mockGameState),
        originalSize: 1000,
        metadata: { algorithm: 'lz-string' }
      });

      // Mock Firestore document
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({
          userId: 'test-user-123',
          slotNumber: 1,
          saveName: 'Test Save',
          storageUrl: 'https://storage.example.com/save1.json',
          dataSize: 1000,
          compressedSize: 500,
          createdAt: { toDate: () => new Date('2023-01-01') },
          updatedAt: { toDate: () => new Date('2023-01-02') }
        })
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

      // Mock Storage download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('compressed-game-data')
      });
    });

    it('should load game data successfully', async () => {
      const result = await cloudStorage.loadFromCloud(mockUser, 1);

      expect(result.success).toBe(true);
      expect(result.data?.gameState).toEqual(mockGameState);
      expect(result.data?.metadata.slotNumber).toBe(1);

      // Verify decompression was called
      expect(mockCompressor.decompress).toHaveBeenCalledWith('compressed-game-data');
    });

    it('should handle non-existent saves', async () => {
      const mockDocSnapshot = {
        exists: () => false
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

      const result = await cloudStorage.loadFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.STORAGE_NOT_FOUND);
    });

    it('should handle download errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await cloudStorage.loadFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.OPERATION_FAILED);
    });

    it('should handle decompression errors', async () => {
      mockCompressor.decompress.mockRejectedValue(new Error('Decompression failed'));

      const result = await cloudStorage.loadFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.OPERATION_FAILED);
    });

    it('should handle corrupted game data', async () => {
      mockCompressor.decompress.mockResolvedValue({
        decompressedData: 'invalid-json',
        originalSize: 100,
        metadata: { algorithm: 'lz-string' }
      });

      const result = await cloudStorage.loadFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.DATA_CORRUPTED);
    });
  });

  describe('List Operations', () => {
    beforeEach(() => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'save1',
            data: () => ({
              slotNumber: 1,
              saveName: 'Save 1',
              dataSize: 1000,
              compressedSize: 500,
              createdAt: { toDate: () => new Date('2023-01-01') },
              updatedAt: { toDate: () => new Date('2023-01-02') }
            })
          },
          {
            id: 'save2',
            data: () => ({
              slotNumber: 2,
              saveName: 'Save 2',
              dataSize: 800,
              compressedSize: 400,
              createdAt: { toDate: () => new Date('2023-01-03') },
              updatedAt: { toDate: () => new Date('2023-01-04') }
            })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
    });

    it('should list cloud saves successfully', async () => {
      const result = await cloudStorage.listCloudSaves(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].slotNumber).toBe(1);
      expect(result.data![1].slotNumber).toBe(2);

      // Verify query construction
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('userId', '==', 'test-user-123');
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    });

    it('should handle empty save list', async () => {
      const mockQuerySnapshot = { docs: [] };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await cloudStorage.listCloudSaves(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle query errors', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const result = await cloudStorage.listCloudSaves(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({
          storageUrl: 'https://storage.example.com/save1.json'
        })
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteObject as jest.Mock).mockResolvedValue(undefined);
    });

    it('should delete save successfully', async () => {
      const result = await cloudStorage.deleteFromCloud(mockUser, 1);

      expect(result.success).toBe(true);

      // Verify both Firestore and Storage deletion
      expect(deleteDoc).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
    });

    it('should handle non-existent saves during deletion', async () => {
      const mockDocSnapshot = {
        exists: () => false
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

      const result = await cloudStorage.deleteFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.STORAGE_NOT_FOUND);
    });

    it('should handle deletion errors', async () => {
      (deleteDoc as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await cloudStorage.deleteFromCloud(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);

      // Mock compression for batch operations
      mockCompressor.compress.mockResolvedValue({
        compressedData: 'compressed-data',
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 0.5,
        metadata: { algorithm: 'lz-string' }
      });

      (uploadBytes as jest.Mock).mockResolvedValue({ metadata: { size: 500 } });
      (getDownloadURL as jest.Mock).mockResolvedValue('https://storage.example.com/batch-save.json');
    });

    it('should perform batch save operations', async () => {
      const saves = [
        { slotNumber: 1, saveName: 'Save 1', gameState: mockGameState },
        { slotNumber: 2, saveName: 'Save 2', gameState: mockGameState }
      ];

      const result = await cloudStorage.batchSaveToCloud(mockUser, saves);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);

      // Verify batch operations
      const mockBatch = (writeBatch as jest.Mock).mock.results[0].value;
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle partial batch failures', async () => {
      mockCompressor.compress
        .mockResolvedValueOnce({
          compressedData: 'compressed-data-1',
          originalSize: 1000,
          compressedSize: 500,
          compressionRatio: 0.5,
          metadata: { algorithm: 'lz-string' }
        })
        .mockRejectedValueOnce(new Error('Compression failed'));

      const saves = [
        { slotNumber: 1, saveName: 'Save 1', gameState: mockGameState },
        { slotNumber: 2, saveName: 'Save 2', gameState: mockGameState }
      ];

      const result = await cloudStorage.batchSaveToCloud(mockUser, saves);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('Sync Operations', () => {
    it('should sync save slot successfully', async () => {
      // Mock local save exists
      const mockLocalSave = {
        gameState: mockGameState,
        saveName: 'Local Save',
        timestamp: new Date('2023-01-05')
      };

      // Mock cloud save exists
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({
          saveName: 'Cloud Save',
          updatedAt: { toDate: () => new Date('2023-01-01') }
        })
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

      // Mock compression for upload
      mockCompressor.compress.mockResolvedValue({
        compressedData: 'compressed-sync-data',
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 0.5,
        metadata: { algorithm: 'lz-string' }
      });
      (uploadBytes as jest.Mock).mockResolvedValue({ metadata: { size: 500 } });
      (getDownloadURL as jest.Mock).mockResolvedValue('https://storage.example.com/sync-save.json');
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await cloudStorage.syncSlot(mockUser, 1, mockLocalSave);

      expect(result.success).toBe(true);
      expect(result.action).toBe('upload');
    });
  });

  describe('Error Handling', () => {
    it('should convert Firebase errors to CloudErrors', async () => {
      const firebaseError = {
        code: 'permission-denied',
        message: 'Permission denied'
      };
      (setDoc as jest.Mock).mockRejectedValue(firebaseError);

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Object);
      expect(result.error?.message).toContain('Permission denied');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      (setDoc as jest.Mock).mockRejectedValue(timeoutError);

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.OPERATION_TIMEOUT);
    });
  });

  describe('Data Validation', () => {
    it('should validate game state structure', async () => {
      const invalidGameState = {
        // Missing required fields
        someField: 'value'
      } as any;

      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Invalid Save',
        invalidGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.DATA_INVALID);
    });

    it('should validate slot numbers', async () => {
      const result = await cloudStorage.saveToCloud(
        mockUser,
        -1, // Invalid slot number
        'Test Save',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.DATA_INVALID);
    });

    it('should validate save names', async () => {
      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        '', // Empty save name
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.DATA_INVALID);
    });
  });
});