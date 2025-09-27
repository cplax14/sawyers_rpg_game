/**
 * Data Integrity Hook
 * React hook for managing data integrity validation in cloud save operations
 */

import { useCallback, useState, useRef } from 'react';
import {
  validateDataIntegrity,
  generateChecksum,
  verifyChecksum,
  sanitizeGameStateForCloud,
  DataIntegrityResult,
  IntegrityValidationOptions,
  DEFAULT_GAME_STATE_SCHEMA,
  GameStateSchema
} from '../utils/dataIntegrity';
import { ReactGameState } from '../types/game';
import { CloudError, CloudErrorCode, createCloudError, ErrorSeverity } from '../utils/cloudErrors';

interface DataIntegrityState {
  isValidating: boolean;
  lastValidationResult: DataIntegrityResult | null;
  validationErrors: string[];
  recoveredDataAvailable: boolean;
}

interface ValidationMetrics {
  totalValidations: number;
  successfulValidations: number;
  corruptionDetected: number;
  dataRecoveries: number;
  averageValidationTime: number;
}

interface UseDataIntegrityOptions {
  /** Custom validation schema */
  schema?: GameStateSchema;
  /** Default validation options */
  defaultOptions?: IntegrityValidationOptions;
  /** Enable automatic data recovery */
  enableAutoRecovery?: boolean;
  /** Enable validation metrics tracking */
  trackMetrics?: boolean;
}

interface UseDataIntegrityResult {
  // State
  state: DataIntegrityState;
  metrics: ValidationMetrics;

  // Validation functions
  validateGameState: (
    gameState: ReactGameState,
    options?: IntegrityValidationOptions
  ) => Promise<DataIntegrityResult>;

  validateWithChecksum: (
    gameState: ReactGameState,
    expectedChecksum: string,
    options?: IntegrityValidationOptions
  ) => Promise<DataIntegrityResult>;

  // Checksum utilities
  generateDataChecksum: (data: any) => Promise<string>;
  verifyDataChecksum: (data: any, expectedChecksum: string) => Promise<boolean>;

  // Data preparation
  prepareForCloudUpload: (gameState: ReactGameState) => Promise<{
    data: ReactGameState;
    checksum: string;
    validationResult: DataIntegrityResult;
  }>;

  validateCloudDownload: (
    data: any,
    expectedChecksum?: string
  ) => Promise<DataIntegrityResult>;

  // Recovery functions
  recoverCorruptedData: (
    corruptedData: any,
    validationResult: DataIntegrityResult
  ) => Promise<{ success: boolean; recoveredData?: ReactGameState }>;

  // Utilities
  clearValidationState: () => void;
  resetMetrics: () => void;
}

export const useDataIntegrity = (
  options: UseDataIntegrityOptions = {}
): UseDataIntegrityResult => {
  const {
    schema = DEFAULT_GAME_STATE_SCHEMA,
    defaultOptions = {},
    enableAutoRecovery = true,
    trackMetrics = true
  } = options;

  // State
  const [state, setState] = useState<DataIntegrityState>({
    isValidating: false,
    lastValidationResult: null,
    validationErrors: [],
    recoveredDataAvailable: false
  });

  const [metrics, setMetrics] = useState<ValidationMetrics>({
    totalValidations: 0,
    successfulValidations: 0,
    corruptionDetected: 0,
    dataRecoveries: 0,
    averageValidationTime: 0
  });

  // Refs for performance tracking
  const validationTimesRef = useRef<number[]>([]);

  /**
   * Update validation metrics
   */
  const updateMetrics = useCallback((
    isSuccessful: boolean,
    isCorrupted: boolean,
    isRecovered: boolean,
    validationTime: number
  ) => {
    if (!trackMetrics) return;

    setMetrics(prev => {
      const newTotal = prev.totalValidations + 1;
      const newSuccessful = prev.successfulValidations + (isSuccessful ? 1 : 0);
      const newCorrupted = prev.corruptionDetected + (isCorrupted ? 1 : 0);
      const newRecoveries = prev.dataRecoveries + (isRecovered ? 1 : 0);

      // Update average validation time
      validationTimesRef.current.push(validationTime);
      if (validationTimesRef.current.length > 100) {
        validationTimesRef.current = validationTimesRef.current.slice(-100);
      }

      const averageTime = validationTimesRef.current.reduce((sum, time) => sum + time, 0) /
                         validationTimesRef.current.length;

      return {
        totalValidations: newTotal,
        successfulValidations: newSuccessful,
        corruptionDetected: newCorrupted,
        dataRecoveries: newRecoveries,
        averageValidationTime: averageTime
      };
    });
  }, [trackMetrics]);

  /**
   * Validate game state with full integrity checking
   */
  const validateGameState = useCallback(async (
    gameState: ReactGameState,
    options: IntegrityValidationOptions = {}
  ): Promise<DataIntegrityResult> => {
    const startTime = performance.now();

    setState(prev => ({
      ...prev,
      isValidating: true,
      validationErrors: []
    }));

    try {
      const validationOptions = { ...defaultOptions, ...options };
      const result = await validateDataIntegrity(gameState, undefined, schema, validationOptions);

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Update state
      setState(prev => ({
        ...prev,
        isValidating: false,
        lastValidationResult: result,
        validationErrors: result.errors,
        recoveredDataAvailable: !!result.recoveredData
      }));

      // Update metrics
      updateMetrics(
        result.isValid,
        result.corruptedFields.length > 0,
        !!result.recoveredData,
        validationTime
      );

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

      setState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: [errorMessage]
      }));

      throw createCloudError(
        CloudErrorCode.SAVE_VALIDATION_FAILED,
        'Game state validation failed',
        {
          severity: ErrorSeverity.HIGH,
          retryable: false,
          debugInfo: { originalError: error }
        }
      );
    }
  }, [defaultOptions, schema, updateMetrics]);

  /**
   * Validate game state with checksum verification
   */
  const validateWithChecksum = useCallback(async (
    gameState: ReactGameState,
    expectedChecksum: string,
    options: IntegrityValidationOptions = {}
  ): Promise<DataIntegrityResult> => {
    const startTime = performance.now();

    setState(prev => ({
      ...prev,
      isValidating: true,
      validationErrors: []
    }));

    try {
      const validationOptions = { ...defaultOptions, ...options };
      const result = await validateDataIntegrity(gameState, expectedChecksum, schema, validationOptions);

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      setState(prev => ({
        ...prev,
        isValidating: false,
        lastValidationResult: result,
        validationErrors: result.errors,
        recoveredDataAvailable: !!result.recoveredData
      }));

      updateMetrics(
        result.isValid,
        result.corruptedFields.length > 0,
        !!result.recoveredData,
        validationTime
      );

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

      setState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: [errorMessage]
      }));

      throw error;
    }
  }, [defaultOptions, schema, updateMetrics]);

  /**
   * Generate checksum for data
   */
  const generateDataChecksum = useCallback(async (data: any): Promise<string> => {
    try {
      return await generateChecksum(data);
    } catch (error) {
      throw createCloudError(
        CloudErrorCode.SAVE_VALIDATION_FAILED,
        'Failed to generate data checksum',
        {
          severity: ErrorSeverity.HIGH,
          retryable: false,
          debugInfo: { originalError: error }
        }
      );
    }
  }, []);

  /**
   * Verify data checksum
   */
  const verifyDataChecksum = useCallback(async (
    data: any,
    expectedChecksum: string
  ): Promise<boolean> => {
    try {
      return await verifyChecksum(data, expectedChecksum);
    } catch (error) {
      console.warn('Checksum verification failed:', error);
      return false;
    }
  }, []);

  /**
   * Prepare game state for cloud upload with full validation
   */
  const prepareForCloudUpload = useCallback(async (
    gameState: ReactGameState
  ): Promise<{
    data: ReactGameState;
    checksum: string;
    validationResult: DataIntegrityResult;
  }> => {
    try {
      // Sanitize data for cloud storage
      const sanitizedData = sanitizeGameStateForCloud(gameState);

      // Validate the sanitized data
      const validationResult = await validateGameState(sanitizedData, {
        deepValidation: true,
        enableRecovery: enableAutoRecovery,
        strictMode: false
      });

      // Use recovered data if available and valid
      const finalData = validationResult.recoveredData || sanitizedData;

      // Generate checksum for the final data
      const checksum = await generateDataChecksum(finalData);

      if (!validationResult.isValid && !validationResult.recoveredData) {
        throw createCloudError(
          CloudErrorCode.SAVE_VALIDATION_FAILED,
          'Cannot upload corrupted data to cloud',
          {
            severity: ErrorSeverity.HIGH,
            retryable: false,
            debugInfo: {
              validationErrors: validationResult.errors,
              corruptedFields: validationResult.corruptedFields
            }
          }
        );
      }

      return {
        data: finalData,
        checksum,
        validationResult
      };

    } catch (error) {
      // Check if error is already a CloudError object
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        throw error;
      }

      throw createCloudError(
        CloudErrorCode.SAVE_VALIDATION_FAILED,
        'Failed to prepare data for cloud upload',
        {
          severity: ErrorSeverity.HIGH,
          retryable: false,
          debugInfo: { originalError: error }
        }
      );
    }
  }, [validateGameState, enableAutoRecovery, generateDataChecksum]);

  /**
   * Validate data downloaded from cloud
   */
  const validateCloudDownload = useCallback(async (
    data: any,
    expectedChecksum?: string
  ): Promise<DataIntegrityResult> => {
    try {
      const validationOptions: IntegrityValidationOptions = {
        deepValidation: true,
        enableRecovery: enableAutoRecovery,
        strictMode: false
      };

      let result: DataIntegrityResult;

      if (expectedChecksum) {
        result = await validateWithChecksum(data, expectedChecksum, validationOptions);
      } else {
        result = await validateGameState(data, validationOptions);
      }

      // If data is corrupted but recovery was successful, warn user
      if (!result.isValid && result.recoveredData) {
        console.warn('Cloud data corruption detected, but recovery was successful', {
          errors: result.errors,
          corruptedFields: result.corruptedFields
        });
      }

      return result;

    } catch (error) {
      throw createCloudError(
        CloudErrorCode.SAVE_VALIDATION_FAILED,
        'Failed to validate downloaded cloud data',
        {
          severity: ErrorSeverity.HIGH,
          retryable: false,
          debugInfo: { originalError: error }
        }
      );
    }
  }, [validateGameState, validateWithChecksum, enableAutoRecovery]);

  /**
   * Attempt to recover corrupted data
   */
  const recoverCorruptedData = useCallback(async (
    corruptedData: any,
    validationResult: DataIntegrityResult
  ): Promise<{ success: boolean; recoveredData?: ReactGameState }> => {
    try {
      if (!validationResult.recoveredData) {
        // Attempt recovery with aggressive options
        const recoveryResult = await validateDataIntegrity(corruptedData, undefined, schema, {
          deepValidation: true,
          enableRecovery: true,
          strictMode: false
        });

        if (recoveryResult.recoveredData) {
          setState(prev => ({
            ...prev,
            recoveredDataAvailable: true
          }));

          updateMetrics(false, true, true, 0);

          return {
            success: true,
            recoveredData: recoveryResult.recoveredData as ReactGameState
          };
        }
      } else {
        return {
          success: true,
          recoveredData: validationResult.recoveredData as ReactGameState
        };
      }

      return { success: false };

    } catch (error) {
      console.error('Data recovery failed:', error);
      return { success: false };
    }
  }, [schema, updateMetrics]);

  /**
   * Clear validation state
   */
  const clearValidationState = useCallback(() => {
    setState({
      isValidating: false,
      lastValidationResult: null,
      validationErrors: [],
      recoveredDataAvailable: false
    });
  }, []);

  /**
   * Reset metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      totalValidations: 0,
      successfulValidations: 0,
      corruptionDetected: 0,
      dataRecoveries: 0,
      averageValidationTime: 0
    });
    validationTimesRef.current = [];
  }, []);

  return {
    // State
    state,
    metrics,

    // Validation functions
    validateGameState,
    validateWithChecksum,

    // Checksum utilities
    generateDataChecksum,
    verifyDataChecksum,

    // Data preparation
    prepareForCloudUpload,
    validateCloudDownload,

    // Recovery functions
    recoverCorruptedData,

    // Utilities
    clearValidationState,
    resetMetrics
  };
};