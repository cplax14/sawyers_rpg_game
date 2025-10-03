/**
 * Data Compression and Serialization Utilities
 * Efficient compression and serialization for cloud storage transfers
 */

import * as LZString from 'lz-string';
import { ReactGameState } from '../types/game';

// Compression configuration
export interface CompressionConfig {
  algorithm: 'lz-string' | 'gzip' | 'none';
  level: 'fast' | 'balanced' | 'maximum';
  enableBase64: boolean;
  chunkSize: number; // bytes
  minimumCompressionRatio: number; // 0.0 to 1.0
}

// Default compression settings
export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  algorithm: 'lz-string',
  level: 'balanced',
  enableBase64: true,
  chunkSize: 64 * 1024, // 64KB chunks
  minimumCompressionRatio: 0.1 // Only compress if at least 10% reduction
};

// Compression result metadata
export interface CompressionResult {
  data: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: string;
  isCompressed: boolean;
  chunks?: string[];
  metadata: {
    timestamp: Date;
    checksum: string;
    version: string;
  };
}

// Serialization options
export interface SerializationOptions {
  includeMetadata: boolean;
  stripFunctions: boolean;
  preserveUndefined: boolean;
  customReplacers?: Array<(key: string, value: any) => any>;
  customRevivers?: Array<(key: string, value: any) => any>;
}

const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
  includeMetadata: true,
  stripFunctions: true,
  preserveUndefined: false
};

/**
 * Calculate CRC32 checksum for data integrity
 */
function calculateCRC32(str: string): string {
  let crc = 0 ^ (-1);

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }

  return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
}

// CRC32 lookup table
const crc32Table = new Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crc32Table[i] = c;
}

/**
 * Custom JSON serializer with game state optimizations
 */
export class GameStateSerializer {
  private options: SerializationOptions;

  constructor(options: Partial<SerializationOptions> = {}) {
    this.options = { ...DEFAULT_SERIALIZATION_OPTIONS, ...options };
  }

  /**
   * Serialize game state to JSON string
   */
  serialize(gameState: ReactGameState): string {
    const replacer = (key: string, value: any): any => {
      // Strip functions if configured
      if (this.options.stripFunctions && typeof value === 'function') {
        return undefined;
      }

      // Handle undefined values
      if (value === undefined && !this.options.preserveUndefined) {
        return null;
      }

      // Handle Date objects
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }

      // Handle Map objects
      if (value instanceof Map) {
        return {
          __type: 'Map',
          value: Array.from(value.entries())
        };
      }

      // Handle Set objects
      if (value instanceof Set) {
        return {
          __type: 'Set',
          value: Array.from(value)
        };
      }

      // Apply custom replacers
      if (this.options.customReplacers) {
        for (const replacerFn of this.options.customReplacers) {
          value = replacerFn(key, value);
        }
      }

      return value;
    };

    const serializedState = {
      gameState,
      metadata: this.options.includeMetadata ? {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        serializer: 'GameStateSerializer',
        platform: navigator.userAgent
      } : undefined
    };

    return JSON.stringify(serializedState, replacer);
  }

  /**
   * Deserialize JSON string to game state
   */
  deserialize(jsonString: string): ReactGameState {
    const reviver = (key: string, value: any): any => {
      // Handle special type markers
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Date':
            return new Date(value.value);
          case 'Map':
            return new Map(value.value);
          case 'Set':
            return new Set(value.value);
          default:
            break;
        }
      }

      // Apply custom revivers
      if (this.options.customRevivers) {
        for (const reviverFn of this.options.customRevivers) {
          value = reviverFn(key, value);
        }
      }

      return value;
    };

    const parsed = JSON.parse(jsonString, reviver);
    return parsed.gameState;
  }
}

/**
 * Comprehensive compression utility
 */
export class DataCompressor {
  private config: CompressionConfig;
  private serializer: GameStateSerializer;

  constructor(config: Partial<CompressionConfig> = {}, serializerOptions: Partial<SerializationOptions> = {}) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
    this.serializer = new GameStateSerializer(serializerOptions);
  }

  /**
   * Compress game state data
   */
  async compressGameState(gameState: ReactGameState): Promise<CompressionResult> {
    const serialized = this.serializer.serialize(gameState);
    return this.compressString(serialized);
  }

  /**
   * Decompress game state data
   */
  async decompressGameState(compressedData: CompressionResult | string): Promise<ReactGameState> {
    const decompressed = await this.decompressString(compressedData);
    return this.serializer.deserialize(decompressed);
  }

  /**
   * Compress string data
   */
  async compressString(data: string): Promise<CompressionResult> {
    const originalSize = new Blob([data]).size;
    const checksum = calculateCRC32(data);

    let compressedData: string;
    let algorithm: string;
    let isCompressed = false;

    try {
      switch (this.config.algorithm) {
        case 'lz-string':
          compressedData = await this.compressWithLZString(data);
          algorithm = 'lz-string';
          break;
        case 'gzip':
          compressedData = await this.compressWithGzip(data);
          algorithm = 'gzip';
          break;
        case 'none':
        default:
          compressedData = data;
          algorithm = 'none';
          break;
      }

      const compressedSize = new Blob([compressedData]).size;
      const compressionRatio = (originalSize - compressedSize) / originalSize;

      // Only use compression if it meets minimum ratio and algorithm isn't 'none'
      if (compressionRatio >= this.config.minimumCompressionRatio && this.config.algorithm !== 'none') {
        isCompressed = true;
      } else {
        compressedData = data;
        algorithm = 'none';
        isCompressed = false;
      }

      // Handle large data with chunking
      let chunks: string[] | undefined;
      if (compressedData.length > this.config.chunkSize) {
        chunks = this.chunkData(compressedData, this.config.chunkSize);
      }

      const result: CompressionResult = {
        data: compressedData,
        originalSize,
        compressedSize: isCompressed ? new Blob([compressedData]).size : originalSize,
        compressionRatio: isCompressed ? compressionRatio : 0,
        algorithm,
        isCompressed,
        metadata: {
          timestamp: new Date(),
          checksum,
          version: '1.0.0'
        }
      };

      // Only add chunks property if it was actually created
      if (chunks !== undefined) {
        result.chunks = chunks;
      }

      return result;

    } catch (error) {
      console.warn('Compression failed, falling back to uncompressed:', error);
      return {
        data,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        algorithm: 'none',
        isCompressed: false,
        metadata: {
          timestamp: new Date(),
          checksum,
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Decompress string data
   */
  async decompressString(compressedResult: CompressionResult | string): Promise<string> {
    if (typeof compressedResult === 'string') {
      return compressedResult;
    }

    const { data, algorithm, isCompressed, chunks } = compressedResult;

    if (!isCompressed) {
      return data;
    }

    try {
      // Handle chunked data
      const dataToDecompress = chunks ? chunks.join('') : data;

      let decompressed: string;
      switch (algorithm) {
        case 'lz-string':
          decompressed = await this.decompressWithLZString(dataToDecompress);
          break;
        case 'gzip':
          decompressed = await this.decompressWithGzip(dataToDecompress);
          break;
        default:
          decompressed = dataToDecompress;
          break;
      }

      // Verify integrity by recompressing and checking original checksum
      if (compressedResult.metadata?.checksum && compressedResult.isCompressed) {
        // For integrity check, we need to serialize the decompressed state and check its checksum
        const recompressedResult = await this.compressString(JSON.stringify(this.serializer.deserialize(decompressed)));
        if (recompressedResult.metadata.checksum !== compressedResult.metadata.checksum) {
          throw new Error(`Data integrity check failed: expected ${compressedResult.metadata.checksum}, got ${recompressedResult.metadata.checksum}`);
        }
      }

      return decompressed;

    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error(`Failed to decompress data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * LZ-String compression
   */
  private async compressWithLZString(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Use different LZ-String methods based on configuration
        let compressed: string | null;
        switch (this.config.level) {
          case 'fast':
            compressed = LZString.compress(data);
            break;
          case 'maximum':
            compressed = this.config.enableBase64
              ? LZString.compressToBase64(data)
              : LZString.compressToUTF16(data);
            break;
          case 'balanced':
          default:
            compressed = this.config.enableBase64
              ? LZString.compressToEncodedURIComponent(data)
              : LZString.compress(data);
            break;
        }

        if (compressed === null || compressed === undefined) {
          reject(new Error('LZ-String compression returned null'));
        } else {
          resolve(compressed);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * LZ-String decompression
   */
  private async decompressWithLZString(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let decompressed: string | null;

        // Try different decompression methods
        if (this.config.enableBase64) {
          decompressed = LZString.decompressFromBase64(data) ||
                        LZString.decompressFromEncodedURIComponent(data) ||
                        LZString.decompress(data);
        } else {
          decompressed = LZString.decompressFromUTF16(data) ||
                        LZString.decompress(data);
        }

        if (decompressed === null) {
          reject(new Error('LZ-String decompression failed'));
        } else {
          resolve(decompressed);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * GZIP compression (browser-based using CompressionStream)
   */
  private async compressWithGzip(data: string): Promise<string> {
    if (!('CompressionStream' in window)) {
      throw new Error('GZIP compression not supported in this browser');
    }

    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(new TextEncoder().encode(data));
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Convert to base64 for JSON compatibility
    const uint8Array = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      uint8Array.set(chunk, offset);
      offset += chunk.length;
    }

    return btoa(String.fromCharCode(...uint8Array));
  }

  /**
   * GZIP decompression (browser-based using DecompressionStream)
   */
  private async decompressWithGzip(data: string): Promise<string> {
    if (!('DecompressionStream' in window)) {
      throw new Error('GZIP decompression not supported in this browser');
    }

    // Convert from base64
    const binaryString = atob(data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(uint8Array);
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        chunks.push(value);
      }
    }

    const uint8Result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      uint8Result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(uint8Result);
  }

  /**
   * Split data into chunks for large transfers
   */
  private chunkData(data: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(results: CompressionResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    compressionCount: number;
    algorithmUsage: Record<string, number>;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const compressionCount = results.filter(r => r.isCompressed).length;

    const algorithmUsage: Record<string, number> = {};
    results.forEach(r => {
      algorithmUsage[r.algorithm] = (algorithmUsage[r.algorithm] || 0) + 1;
    });

    return {
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio: results.length > 0
        ? results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
        : 0,
      compressionCount,
      algorithmUsage
    };
  }
}

// Export default instances
export const defaultCompressor = new DataCompressor();
export const defaultSerializer = new GameStateSerializer();

// Utility functions
export const compressGameState = (gameState: ReactGameState): Promise<CompressionResult> =>
  defaultCompressor.compressGameState(gameState);

export const decompressGameState = (compressedData: CompressionResult | string): Promise<ReactGameState> =>
  defaultCompressor.decompressGameState(compressedData);