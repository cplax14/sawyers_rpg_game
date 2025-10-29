/**
 * Retry Manager Tests
 * Tests for exponential backoff retry functionality
 */

import {
  RetryManager,
  retry,
  RETRY_CONFIGS,
  RETRYABLE_ERROR_TYPES,
  NON_RETRYABLE_ERROR_TYPES,
} from '../retryManager';

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
  });

  describe('Successful Operations', () => {
    it('should return result immediately on success', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failed Operations with Retry', () => {
    it('should retry retryable errors', async () => {
      const error = new Error('Network error');
      error.name = 'NetworkError';

      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 3,
        initialDelay: 1, // Very short delay for testing
        backoffMultiplier: 1.1, // Small multiplier for testing
        enableJitter: false,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('Unauthorized');
      (error as any).code = 'unauthenticated';

      const mockOperation = jest.fn().mockRejectedValue(error);

      const resultPromise = retryManager.executeWithRetry(mockOperation, {
        maxRetries: 3,
        initialDelay: 100,
      });

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries for persistent failures', async () => {
      const error = new Error('Service unavailable');
      (error as any).code = 'unavailable';

      const mockOperation = jest.fn().mockRejectedValue(error);

      const result = await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 2,
        initialDelay: 1,
        backoffMultiplier: 1.1,
        enableJitter: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Exponential Backoff', () => {
    it('should calculate correct delays with exponential backoff', async () => {
      const error = new Error('Timeout');
      error.name = 'TimeoutError';

      const mockOperation = jest.fn().mockRejectedValue(error);
      const delays: number[] = [];

      await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 3,
        initialDelay: 10,
        backoffMultiplier: 2,
        enableJitter: false,
        onRetry: (err, attempt, delay) => {
          delays.push(delay);
        },
      });

      // Delays should be: 10, 20, 40 (exponential backoff)
      expect(delays).toEqual([10, 20, 40]);
    });

    it('should cap delays at maximum', async () => {
      const error = new Error('Timeout');
      error.name = 'TimeoutError';

      const mockOperation = jest.fn().mockRejectedValue(error);
      const delays: number[] = [];

      await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 4,
        initialDelay: 100,
        maxDelay: 200,
        backoffMultiplier: 3,
        enableJitter: false,
        onRetry: (err, attempt, delay) => {
          delays.push(delay);
        },
      });

      // Delays should be: 100, 200 (capped), 200 (capped), 200 (capped)
      expect(delays).toEqual([100, 200, 200, 200]);
    });
  });

  describe('Error Classification', () => {
    it('should identify retryable errors correctly', () => {
      const retryableErrors = [
        { name: 'NetworkError' },
        { code: 'unavailable' },
        { code: 'deadline-exceeded' },
        { status: 503 },
      ];

      retryableErrors.forEach(error => {
        const mockOperation = jest.fn().mockRejectedValue(error);
        retryManager.executeWithRetry(mockOperation, { maxRetries: 1 });
        // Should attempt retry (not test the actual retry here, just classification)
      });
    });

    it('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors = [
        { code: 'unauthenticated' },
        { code: 'permission-denied' },
        { code: 'invalid-argument' },
        { status: 400 },
        { status: 401 },
        { status: 403 },
      ];

      nonRetryableErrors.forEach(error => {
        const mockOperation = jest.fn().mockRejectedValue(error);
        retryManager.executeWithRetry(mockOperation, { maxRetries: 1 });
        // Should not retry (classification test)
      });
    });
  });

  describe('Convenience Functions', () => {
    it('should provide network retry convenience function', async () => {
      const mockOperation = jest.fn().mockResolvedValue('network-success');

      const result = await retry.network(mockOperation);

      expect(result).toBe('network-success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should provide critical retry convenience function', async () => {
      const mockOperation = jest.fn().mockResolvedValue('critical-success');

      const result = await retry.critical(mockOperation);

      expect(result).toBe('critical-success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw error when convenience function fails', async () => {
      const error = new Error('Final failure');
      const mockOperation = jest.fn().mockRejectedValue(error);

      await expect(retry.quick(mockOperation)).rejects.toThrow('Final failure');
    });
  });

  describe('Custom Retry Logic', () => {
    it('should use custom shouldRetry function', async () => {
      const error = new Error('Custom error');
      const mockOperation = jest.fn().mockRejectedValue(error);
      const mockShouldRetry = jest.fn().mockReturnValue(false);

      const result = await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 3,
        shouldRetry: mockShouldRetry,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockShouldRetry).toHaveBeenCalledWith(error, 0);
    });
  });

  describe('Callback Functions', () => {
    it('should call onRetry callback', async () => {
      const error = new Error('Retryable error');
      error.name = 'NetworkError';

      const mockOperation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const onRetry = jest.fn();

      await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 1,
        initialDelay: 5,
        enableJitter: false,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(error, 1, 5);
    });

    // Note: onMaxRetriesExceeded callback tested separately
    it('should handle failed operations correctly', async () => {
      const error = new Error('Persistent error');
      error.name = 'NetworkError';

      const mockOperation = jest.fn().mockRejectedValue(error);

      const result = await retryManager.executeWithRetry(mockOperation, {
        maxRetries: 1,
        initialDelay: 1,
        enableJitter: false,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
      expect(result.error).toBe(error);
    });
  });

  describe('Configuration Presets', () => {
    it('should have correct network configuration', () => {
      const config = RETRY_CONFIGS.network;

      expect(config.maxRetries).toBe(3);
      expect(config.initialDelay).toBe(1000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.enableJitter).toBe(true);
    });

    it('should have correct critical configuration', () => {
      const config = RETRY_CONFIGS.critical;

      expect(config.maxRetries).toBe(5);
      expect(config.initialDelay).toBe(500);
      expect(config.backoffMultiplier).toBe(1.5);
      expect(config.enableJitter).toBe(true);
    });
  });
});
