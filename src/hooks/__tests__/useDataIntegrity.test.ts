/**
 * Data Integrity Hook Tests
 * Tests for useDataIntegrity React hook
 */

import { renderHook, act } from '@testing-library/react';
import { useDataIntegrity } from '../useDataIntegrity';
import { ReactGameState } from '../../types/game';
import * as dataIntegrityUtils from '../../utils/dataIntegrity';

// Mock the data integrity utilities
jest.mock('../../utils/dataIntegrity');

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(() => {
        const hash = new ArrayBuffer(32);
        const view = new Uint8Array(hash);
        for (let i = 0; i < 32; i++) {
          view[i] = i;
        }
        return Promise.resolve(hash);
      })
    }
  }
});

describe('useDataIntegrity Hook', () => {
  let mockGameState: ReactGameState;

  const mockValidationResult = {
    isValid: true,
    checksum: 'mock_checksum',
    errors: [],
    warnings: [],
    corruptedFields: []
  };

  const mockCorruptionResult = {
    isValid: false,
    checksum: 'corrupted_checksum',
    errors: ['Data corruption detected'],
    warnings: ['Recovery attempted'],
    corruptedFields: ['player.level'],
    recoveredData: {} as ReactGameState
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 10,
        experience: 5000,
        currentArea: 'forest',
        stats: {
          health: 100,
          mana: 50,
          strength: 15,
          agility: 12,
          intelligence: 8,
          defense: 10
        }
      },
      inventory: {
        items: [
          { id: 'potion', quantity: 5 }
        ]
      },
      story: {
        currentChapter: 2,
        completedQuests: ['tutorial'],
        activeQuests: []
      },
      gameFlags: {
        tutorial_completed: true
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } as ReactGameState;

    // Setup default mocks
    (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue(mockValidationResult);
    (dataIntegrityUtils.generateChecksum as jest.Mock).mockResolvedValue('mock_checksum');
    (dataIntegrityUtils.verifyChecksum as jest.Mock).mockResolvedValue(true);
    (dataIntegrityUtils.sanitizeGameStateForCloud as jest.Mock).mockReturnValue(mockGameState);
    (dataIntegrityUtils.attemptDataRecovery as jest.Mock).mockReturnValue({
      success: true,
      recoveredData: mockGameState
    });
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDataIntegrity());

      expect(result.current.state.isValidating).toBe(false);
      expect(result.current.state.lastValidationResult).toBeNull();
      expect(result.current.state.validationErrors).toHaveLength(0);
      expect(result.current.state.recoveredDataAvailable).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useDataIntegrity());

      expect(typeof result.current.validateGameState).toBe('function');
      expect(typeof result.current.validateWithChecksum).toBe('function');
      expect(typeof result.current.generateDataChecksum).toBe('function');
      expect(typeof result.current.verifyDataChecksum).toBe('function');
      expect(typeof result.current.prepareForCloudUpload).toBe('function');
      expect(typeof result.current.validateCloudDownload).toBe('function');
      expect(typeof result.current.recoverCorruptedData).toBe('function');
      expect(typeof result.current.clearValidationState).toBe('function');
      expect(typeof result.current.resetMetrics).toBe('function');
    });

    it('should initialize with tracking metrics when enabled', () => {
      const { result } = renderHook(() =>
        useDataIntegrity({ trackMetrics: true })
      );

      expect(result.current.metrics.totalValidations).toBe(0);
      expect(result.current.metrics.successfulValidations).toBe(0);
      expect(result.current.metrics.corruptionDetected).toBe(0);
      expect(result.current.metrics.dataRecoveries).toBe(0);
      expect(result.current.metrics.averageValidationTime).toBe(0);
    });
  });

  describe('Game State Validation', () => {
    it('should validate game state successfully', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const validationResult = await result.current.validateGameState(mockGameState);
        expect(validationResult).toEqual(mockValidationResult);
      });

      expect(result.current.state.isValidating).toBe(false);
      expect(result.current.state.lastValidationResult).toEqual(mockValidationResult);
      expect(result.current.state.validationErrors).toHaveLength(0);
    });

    it('should handle validation errors', async () => {
      const errorResult = {
        ...mockValidationResult,
        isValid: false,
        errors: ['Invalid player data']
      };

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const validationResult = await result.current.validateGameState(mockGameState);
        expect(validationResult).toEqual(errorResult);
      });

      expect(result.current.state.validationErrors).toEqual(['Invalid player data']);
      expect(result.current.state.lastValidationResult).toEqual(errorResult);
    });

    it('should update metrics for successful validation', async () => {
      const { result } = renderHook(() =>
        useDataIntegrity({ trackMetrics: true })
      );

      await act(async () => {
        await result.current.validateGameState(mockGameState);
      });

      expect(result.current.metrics.totalValidations).toBe(1);
      expect(result.current.metrics.successfulValidations).toBe(1);
      expect(result.current.metrics.corruptionDetected).toBe(0);
    });

    it('should validate game state with checksum', async () => {
      const { result } = renderHook(() => useDataIntegrity());
      const expectedChecksum = 'expected_checksum';

      await act(async () => {
        await result.current.validateWithChecksum(mockGameState, expectedChecksum);
      });

      expect(dataIntegrityUtils.validateDataIntegrity).toHaveBeenCalledWith(
        mockGameState,
        expectedChecksum,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Checksum Operations', () => {
    it('should generate data checksum', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const checksum = await result.current.generateDataChecksum(mockGameState);
        expect(checksum).toBe('mock_checksum');
      });

      expect(dataIntegrityUtils.generateChecksum).toHaveBeenCalledWith(mockGameState);
    });

    it('should verify data checksum', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const isValid = await result.current.verifyDataChecksum(mockGameState, 'test_checksum');
        expect(isValid).toBe(true);
      });

      expect(dataIntegrityUtils.verifyChecksum).toHaveBeenCalledWith(mockGameState, 'test_checksum');
    });

    it('should handle checksum verification errors gracefully', async () => {
      (dataIntegrityUtils.verifyChecksum as jest.Mock).mockRejectedValue(new Error('Checksum error'));

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const isValid = await result.current.verifyDataChecksum(mockGameState, 'test_checksum');
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Cloud Upload Preparation', () => {
    it('should prepare data for cloud upload successfully', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const prepared = await result.current.prepareForCloudUpload(mockGameState);

        expect(prepared.data).toEqual(mockGameState);
        expect(prepared.checksum).toBe('mock_checksum');
        expect(prepared.validationResult).toEqual(mockValidationResult);
      });

      expect(dataIntegrityUtils.sanitizeGameStateForCloud).toHaveBeenCalledWith(mockGameState);
    });

    it('should handle corrupted data with recovery', async () => {
      const recoveredState = { ...mockGameState, player: { ...mockGameState.player, level: 1 } };
      const recoveryResult = {
        ...mockCorruptionResult,
        recoveredData: recoveredState
      };

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue(recoveryResult);

      const { result } = renderHook(() => useDataIntegrity({ enableAutoRecovery: true }));

      await act(async () => {
        const prepared = await result.current.prepareForCloudUpload(mockGameState);
        expect(prepared.data).toEqual(recoveredState);
      });
    });

    it('should reject corrupted data without recovery', async () => {
      const corruptionResult = {
        ...mockCorruptionResult,
        recoveredData: undefined
      };

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue(corruptionResult);

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        await expect(result.current.prepareForCloudUpload(mockGameState))
          .rejects.toThrow('Cannot upload corrupted data to cloud');
      });
    });
  });

  describe('Cloud Download Validation', () => {
    it('should validate cloud download without checksum', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const validationResult = await result.current.validateCloudDownload(mockGameState);
        expect(validationResult).toEqual(mockValidationResult);
      });
    });

    it('should validate cloud download with checksum', async () => {
      const { result } = renderHook(() => useDataIntegrity());
      const expectedChecksum = 'expected_checksum';

      await act(async () => {
        await result.current.validateCloudDownload(mockGameState, expectedChecksum);
      });

      expect(dataIntegrityUtils.validateDataIntegrity).toHaveBeenCalledWith(
        mockGameState,
        expectedChecksum,
        expect.any(Object),
        expect.objectContaining({
          deepValidation: true,
          enableRecovery: true,
          strictMode: false
        })
      );
    });

    it('should warn about corruption with successful recovery', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue(mockCorruptionResult);

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        await result.current.validateCloudDownload(mockGameState);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cloud data corruption detected, but recovery was successful',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Recovery', () => {
    it('should recover corrupted data successfully', async () => {
      const corruptedData = { ...mockGameState, player: { ...mockGameState.player, level: 'invalid' } };
      const validationResult = {
        isValid: false,
        checksum: '',
        errors: ['Invalid level'],
        warnings: [],
        corruptedFields: ['player.level']
      };

      const recoveryResult = {
        success: true,
        recoveredData: mockGameState
      };

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue({
        ...validationResult,
        recoveredData: mockGameState
      });

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const recovered = await result.current.recoverCorruptedData(corruptedData, validationResult);
        expect(recovered.success).toBe(true);
        expect(recovered.recoveredData).toEqual(mockGameState);
      });

      expect(result.current.state.recoveredDataAvailable).toBe(true);
    });

    it('should handle recovery failures', async () => {
      const corruptedData = { invalid: 'data' };
      const validationResult = {
        isValid: false,
        checksum: '',
        errors: ['Severe corruption'],
        warnings: [],
        corruptedFields: ['all']
      };

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockResolvedValue({
        ...validationResult,
        recoveredData: undefined
      });

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const recovered = await result.current.recoverCorruptedData(corruptedData, validationResult);
        expect(recovered.success).toBe(false);
        expect(recovered.recoveredData).toBeUndefined();
      });
    });
  });

  describe('State Management', () => {
    it('should clear validation state', async () => {
      const { result } = renderHook(() => useDataIntegrity());

      // First, set some state
      await act(async () => {
        await result.current.validateGameState(mockGameState);
      });

      expect(result.current.state.lastValidationResult).not.toBeNull();

      // Then clear it
      act(() => {
        result.current.clearValidationState();
      });

      expect(result.current.state.isValidating).toBe(false);
      expect(result.current.state.lastValidationResult).toBeNull();
      expect(result.current.state.validationErrors).toHaveLength(0);
      expect(result.current.state.recoveredDataAvailable).toBe(false);
    });

    it('should reset metrics', async () => {
      const { result } = renderHook(() =>
        useDataIntegrity({ trackMetrics: true })
      );

      // Generate some metrics
      await act(async () => {
        await result.current.validateGameState(mockGameState);
      });

      expect(result.current.metrics.totalValidations).toBe(1);

      // Reset metrics
      act(() => {
        result.current.resetMetrics();
      });

      expect(result.current.metrics.totalValidations).toBe(0);
      expect(result.current.metrics.successfulValidations).toBe(0);
      expect(result.current.metrics.corruptionDetected).toBe(0);
      expect(result.current.metrics.dataRecoveries).toBe(0);
      expect(result.current.metrics.averageValidationTime).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom schema configuration', () => {
      const customSchema = {
        version: '2.0.0',
        requiredFields: ['customField'],
        fieldTypes: {},
        fieldConstraints: {},
        deprecatedFields: []
      };

      const { result } = renderHook(() =>
        useDataIntegrity({ schema: customSchema })
      );

      expect(result.current).toBeDefined();
      // Schema is used internally, hard to test directly without exposing internals
    });

    it('should respect auto-recovery settings', async () => {
      const { result } = renderHook(() =>
        useDataIntegrity({ enableAutoRecovery: false })
      );

      await act(async () => {
        await result.current.validateGameState(mockGameState);
      });

      expect(dataIntegrityUtils.validateDataIntegrity).toHaveBeenCalledWith(
        mockGameState,
        undefined,
        expect.any(Object),
        expect.objectContaining({
          enableRecovery: false
        })
      );
    });

    it('should disable metrics tracking when requested', async () => {
      const { result } = renderHook(() =>
        useDataIntegrity({ trackMetrics: false })
      );

      await act(async () => {
        await result.current.validateGameState(mockGameState);
      });

      // Metrics should remain at zero when tracking is disabled
      expect(result.current.metrics.totalValidations).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation function errors', async () => {
      const error = new Error('Validation function error');
      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        await expect(result.current.validateGameState(mockGameState))
          .rejects.toThrow('Game state validation failed');
      });

      expect(result.current.state.validationErrors).toContain('Validation function error');
    });

    it('should handle checksum generation errors', async () => {
      const error = new Error('Checksum generation failed');
      (dataIntegrityUtils.generateChecksum as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        await expect(result.current.generateDataChecksum(mockGameState))
          .rejects.toThrow('Failed to generate data checksum');
      });
    });

    it('should handle data recovery errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (dataIntegrityUtils.validateDataIntegrity as jest.Mock).mockRejectedValue(new Error('Recovery error'));

      const { result } = renderHook(() => useDataIntegrity());

      await act(async () => {
        const recovered = await result.current.recoverCorruptedData({}, {
          isValid: false,
          checksum: '',
          errors: [],
          warnings: [],
          corruptedFields: []
        });

        expect(recovered.success).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Data recovery failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});