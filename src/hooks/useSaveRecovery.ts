/**
 * Save Recovery Hook
 * Provides save recovery functionality for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SaveRecoveryManager,
  SaveOperation,
  RecoveryInfo,
  SaveRecoveryConfig,
  createSaveRecoveryManager,
  SaveRecoveryUtils,
} from '../utils/saveRecovery';
import { ReactGameState } from '../types/game';

interface UseSaveRecoveryOptions {
  config?: Partial<SaveRecoveryConfig>;
  autoCheck?: boolean; // Automatically check for recovery on mount
  checkInterval?: number; // How often to check for interrupted operations
}

interface UseSaveRecoveryResult {
  // Recovery state
  recoveryInfo: RecoveryInfo;
  isCheckingRecovery: boolean;
  hasRecoveryData: boolean;

  // Recovery operations
  checkForRecovery: () => Promise<RecoveryInfo>;
  retryOperation: (operationId: string) => Promise<SaveOperation | null>;
  clearRecoveryData: () => void;
  dismissRecovery: () => void;

  // Save operation tracking
  startTrackingSave: (
    slotNumber: number,
    saveName: string,
    gameState: ReactGameState
  ) => SaveOperation;
  completeSaveTracking: (operationId: string) => void;
  failSaveTracking: (operationId: string, error: string) => void;

  // Statistics and debugging
  getOperationStats: () => ReturnType<SaveRecoveryManager['getOperationStats']>;
  getAllOperations: () => SaveOperation[];

  // UI utilities
  formatOperationDuration: (operation: SaveOperation) => string;
  getOperationStatusColor: (status: SaveOperation['status']) => string;
  getOperationStatusText: (status: SaveOperation['status']) => string;
}

export const useSaveRecovery = (options: UseSaveRecoveryOptions = {}): UseSaveRecoveryResult => {
  const {
    config = {},
    autoCheck = true,
    checkInterval = 30000, // 30 seconds
  } = options;

  const recoveryManagerRef = useRef<SaveRecoveryManager | null>(null);
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo>({
    hasRecoverableData: false,
    interruptedOperations: [],
    recommendedAction: 'none',
  });
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(false);
  const [hasRecoveryData, setHasRecoveryData] = useState(false);

  // Initialize recovery manager
  useEffect(() => {
    if (!recoveryManagerRef.current) {
      recoveryManagerRef.current = createSaveRecoveryManager(config);
    }

    return () => {
      if (recoveryManagerRef.current) {
        recoveryManagerRef.current.destroy();
        recoveryManagerRef.current = null;
      }
    };
  }, [config]);

  // Auto-check for recovery on mount
  useEffect(() => {
    if (autoCheck && recoveryManagerRef.current) {
      checkForRecovery();
    }
  }, [autoCheck]);

  // Periodic recovery checks
  useEffect(() => {
    if (!checkInterval || !recoveryManagerRef.current) return;

    const interval = setInterval(() => {
      checkForRecovery();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  // Check for recovery data
  const checkForRecovery = useCallback(async (): Promise<RecoveryInfo> => {
    if (!recoveryManagerRef.current) {
      return {
        hasRecoverableData: false,
        interruptedOperations: [],
        recommendedAction: 'none',
      };
    }

    setIsCheckingRecovery(true);

    try {
      // Add a small delay to simulate checking
      await new Promise(resolve => setTimeout(resolve, 100));

      const info = recoveryManagerRef.current.getRecoveryInfo();
      setRecoveryInfo(info);
      setHasRecoveryData(info.hasRecoverableData);

      return info;
    } catch (error) {
      console.error('Recovery check failed:', error);
      return recoveryInfo;
    } finally {
      setIsCheckingRecovery(false);
    }
  }, [recoveryInfo]);

  // Retry a failed operation
  const retryOperation = useCallback(
    async (operationId: string): Promise<SaveOperation | null> => {
      if (!recoveryManagerRef.current) return null;

      try {
        const retriedOperation = recoveryManagerRef.current.retrySaveOperation(operationId);

        if (retriedOperation) {
          // Refresh recovery info after retry
          await checkForRecovery();
        }

        return retriedOperation;
      } catch (error) {
        console.error('Failed to retry operation:', error);
        return null;
      }
    },
    [checkForRecovery]
  );

  // Clear all recovery data
  const clearRecoveryData = useCallback(() => {
    if (recoveryManagerRef.current) {
      recoveryManagerRef.current.clearRecoveryData();
      setRecoveryInfo({
        hasRecoverableData: false,
        interruptedOperations: [],
        recommendedAction: 'none',
      });
      setHasRecoveryData(false);
    }
  }, []);

  // Dismiss recovery without clearing data
  const dismissRecovery = useCallback(() => {
    setHasRecoveryData(false);
  }, []);

  // Start tracking a save operation
  const startTrackingSave = useCallback(
    (slotNumber: number, saveName: string, gameState: ReactGameState): SaveOperation => {
      if (!recoveryManagerRef.current) {
        throw new Error('Recovery manager not initialized');
      }

      const operation = recoveryManagerRef.current.startSaveOperation(
        slotNumber,
        saveName,
        gameState
      );
      return operation;
    },
    []
  );

  // Complete save tracking
  const completeSaveTracking = useCallback(
    (operationId: string) => {
      if (recoveryManagerRef.current) {
        recoveryManagerRef.current.completeSaveOperation(operationId);
        // Refresh recovery info after completion
        setTimeout(() => checkForRecovery(), 100);
      }
    },
    [checkForRecovery]
  );

  // Fail save tracking
  const failSaveTracking = useCallback(
    (operationId: string, error: string) => {
      if (recoveryManagerRef.current) {
        recoveryManagerRef.current.failSaveOperation(operationId, error);
        // Refresh recovery info after failure
        setTimeout(() => checkForRecovery(), 100);
      }
    },
    [checkForRecovery]
  );

  // Get operation statistics
  const getOperationStats = useCallback(() => {
    if (!recoveryManagerRef.current) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        interrupted: 0,
        pending: 0,
        successRate: 100,
      };
    }

    return recoveryManagerRef.current.getOperationStats();
  }, []);

  // Get all operations for debugging
  const getAllOperations = useCallback(() => {
    if (!recoveryManagerRef.current) return [];
    return recoveryManagerRef.current.getAllOperations();
  }, []);

  // UI utility functions
  const formatOperationDuration = useCallback((operation: SaveOperation): string => {
    return SaveRecoveryUtils.formatDuration(operation.startTime, operation.endTime);
  }, []);

  const getOperationStatusColor = useCallback((status: SaveOperation['status']): string => {
    return SaveRecoveryUtils.getStatusColor(status);
  }, []);

  const getOperationStatusText = useCallback((status: SaveOperation['status']): string => {
    return SaveRecoveryUtils.getStatusText(status);
  }, []);

  return {
    // Recovery state
    recoveryInfo,
    isCheckingRecovery,
    hasRecoveryData,

    // Recovery operations
    checkForRecovery,
    retryOperation,
    clearRecoveryData,
    dismissRecovery,

    // Save operation tracking
    startTrackingSave,
    completeSaveTracking,
    failSaveTracking,

    // Statistics and debugging
    getOperationStats,
    getAllOperations,

    // UI utilities
    formatOperationDuration,
    getOperationStatusColor,
    getOperationStatusText,
  };
};

export default useSaveRecovery;
