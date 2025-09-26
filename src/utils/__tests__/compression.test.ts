/**
 * Compression utility tests
 */

import { DataCompressor, GameStateSerializer } from '../compression';

// Mock game state for testing
const mockGameState = {
  player: {
    id: 'test-player',
    name: 'Test Player',
    level: 10,
    experience: 1500,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    stats: {
      strength: 15,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 8,
      charisma: 6
    },
    inventory: [],
    equipment: {},
    gold: 500
  },
  currentArea: 'town',
  areas: {},
  isLoading: false,
  lastSaved: new Date(),
  totalPlayTime: 3600000, // 1 hour in ms
  gameVersion: '1.0.0'
} as any; // Using any to avoid needing full ReactGameState type

describe('GameStateSerializer', () => {
  let serializer: GameStateSerializer;

  beforeEach(() => {
    serializer = new GameStateSerializer();
  });

  test('should serialize and deserialize game state', () => {
    const serialized = serializer.serialize(mockGameState);
    expect(serialized).toContain('Test Player');

    const deserialized = serializer.deserialize(serialized);
    expect(deserialized.player.name).toBe('Test Player');
    expect(deserialized.player.level).toBe(10);
  });

  test('should handle Date objects', () => {
    const stateWithDate = {
      ...mockGameState,
      lastSaved: new Date('2023-01-01T00:00:00Z')
    };

    const serialized = serializer.serialize(stateWithDate);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.lastSaved).toBeInstanceOf(Date);
    expect(deserialized.lastSaved.toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });

  test('should handle Map objects', () => {
    const stateWithMap = {
      ...mockGameState,
      customMap: new Map([['key1', 'value1'], ['key2', 'value2']])
    };

    const serialized = serializer.serialize(stateWithMap as any);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.customMap).toBeInstanceOf(Map);
    expect(deserialized.customMap.get('key1')).toBe('value1');
  });
});

describe('DataCompressor', () => {
  let compressor: DataCompressor;

  beforeEach(() => {
    compressor = new DataCompressor();
  });

  test('should compress and decompress game state', async () => {
    const compressionResult = await compressor.compressGameState(mockGameState);

    expect(compressionResult.originalSize).toBeGreaterThan(0);
    expect(compressionResult.metadata.checksum).toBeDefined();

    const decompressed = await compressor.decompressGameState(compressionResult);
    expect(decompressed.player.name).toBe('Test Player');
  });

  test('should handle compression with different algorithms', async () => {
    const lzCompressor = new DataCompressor({ algorithm: 'lz-string' });
    const noCompressor = new DataCompressor({ algorithm: 'none' });

    const lzResult = await lzCompressor.compressGameState(mockGameState);
    const noResult = await noCompressor.compressGameState(mockGameState);

    expect(lzResult.algorithm).toBe('lz-string');
    expect(noResult.algorithm).toBe('none');
    expect(noResult.compressionRatio).toBe(0);
  });

  test('should handle compression ratio threshold', async () => {
    // Small data that won't benefit from compression
    const smallState = { simple: 'data' };
    const compressor = new DataCompressor({ minimumCompressionRatio: 0.5 });

    const result = await compressor.compressGameState(smallState as any);
    // Should fall back to uncompressed due to poor compression ratio
    expect(result.isCompressed).toBe(false);
  });

  test('should calculate compression statistics', () => {
    const results = [
      {
        data: 'test1',
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 0.5,
        algorithm: 'lz-string',
        isCompressed: true,
        metadata: { timestamp: new Date(), checksum: 'abc', version: '1.0.0' }
      },
      {
        data: 'test2',
        originalSize: 800,
        compressedSize: 800,
        compressionRatio: 0,
        algorithm: 'none',
        isCompressed: false,
        metadata: { timestamp: new Date(), checksum: 'def', version: '1.0.0' }
      }
    ];

    const stats = compressor.getCompressionStats(results);

    expect(stats.totalOriginalSize).toBe(1800);
    expect(stats.totalCompressedSize).toBe(1300);
    expect(stats.compressionCount).toBe(1);
    expect(stats.algorithmUsage['lz-string']).toBe(1);
    expect(stats.algorithmUsage['none']).toBe(1);
  });

  test('should handle chunked data', async () => {
    // Create large mock state to trigger chunking
    const largeState = {
      ...mockGameState,
      largeData: 'x'.repeat(100000) // 100KB of data
    };

    const compressor = new DataCompressor({ chunkSize: 1000 });
    const result = await compressor.compressGameState(largeState as any);

    if (result.chunks) {
      expect(result.chunks.length).toBeGreaterThan(1);
    }

    const decompressed = await compressor.decompressGameState(result);
    expect(decompressed.largeData).toBe('x'.repeat(100000));
  });

  test('should validate data integrity with checksums', async () => {
    const result = await compressor.compressGameState(mockGameState);

    // Corrupt the checksum
    const corruptedResult = {
      ...result,
      metadata: {
        ...result.metadata,
        checksum: 'invalid-checksum'
      }
    };

    await expect(compressor.decompressGameState(corruptedResult))
      .rejects.toThrow(/integrity check failed/i);
  });
});

describe('Compression Utilities Integration', () => {
  test('should work with cloud storage service pattern', async () => {
    const compressor = new DataCompressor({
      algorithm: 'lz-string',
      level: 'balanced',
      enableBase64: true
    });

    // Simulate cloud storage save operation
    const compressionResult = await compressor.compressGameState(mockGameState);

    // Simulate storage metadata
    const metadata = {
      checksum: compressionResult.metadata.checksum,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      compressionRatio: compressionResult.compressionRatio,
      algorithm: compressionResult.algorithm,
      isCompressed: compressionResult.isCompressed
    };

    // Simulate cloud storage load operation
    const reconstructedResult = {
      data: compressionResult.data,
      originalSize: metadata.originalSize,
      compressedSize: metadata.compressedSize,
      compressionRatio: metadata.compressionRatio,
      algorithm: metadata.algorithm,
      isCompressed: metadata.isCompressed,
      chunks: compressionResult.chunks,
      metadata: {
        timestamp: new Date(),
        checksum: metadata.checksum,
        version: '1.0.0'
      }
    };

    const decompressed = await compressor.decompressGameState(reconstructedResult);
    expect(decompressed.player.name).toBe('Test Player');
    expect(decompressed.totalPlayTime).toBe(3600000);
  });
});