/**
 * Cloud Save Hook
 * Provides React components with cloud save operations and sync status management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineQueue } from './useOfflineQueue';
import {
  CloudStorageService,
  CloudSaveMetadata,
  CloudSaveData,
  SyncStatus,
  UploadProgress,
  DownloadProgress
} from '../services/cloudStorage';
import { ReactGameState } from '../types/game';
import { SaveSlotInfo } from '../types/saveSystem';
import { CloudError } from '../utils/cloudErrors';

/**
 * Cloud save sync states
 */
export type CloudSyncState =
  | 'idle'           // No sync operation in progress
  | 'uploading'      // Uploading save to cloud
  | 'downloading'    // Downloading save from cloud
  | 'syncing'        // Synchronizing local and cloud saves
  | 'resolving'      // Resolving conflicts between local and cloud
  | 'error';         // Sync operation failed

/**
 * Cloud save conflict resolution strategy
 */
export type ConflictResolution =
  | 'keep-local'     // Keep the local save
  | 'keep-cloud'     // Keep the cloud save
  | 'keep-newest'    // Keep the save with the latest timestamp
  | 'manual';        // Manual resolution required

/**
 * Sync progress information
 */
export interface CloudSyncProgress {
  state: CloudSyncState;
  progress: number;        // 0-100 percentage
  status: string;         // Human-readable status message
  error: CloudError | null;
  currentOperation?: string;
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

/**
 * Cloud save conflict information
 */
export interface SaveConflict {
  slotNumber: number;
  localSave: SaveSlotInfo;
  cloudSave: CloudSaveMetadata;
  localTimestamp: Date;
  cloudTimestamp: Date;
  sizeDifference: number;
  conflictDetails: string[];
}

/**
 * Cloud save operations result
 */
export interface CloudSaveResult {
  success: boolean;
  error?: CloudError;
  metadata?: CloudSaveMetadata;
  conflictResolution?: ConflictResolution;
}

/**
 * Batch sync operation configuration
 */
export interface BatchSyncConfig {
  slotNumbers?: number[];  // Specific slots to sync, or all if undefined
  conflictResolution: ConflictResolution;
  maxConcurrent: number;   // Maximum concurrent operations
  skipLargeFiles?: boolean; // Skip files over a certain size
  maxFileSize?: number;    // Maximum file size in bytes
  syncDirection?: 'auto' | 'backup' | 'restore' | 'bidirectional';
  prioritySlots?: number[]; // Slots to sync first
  skipConflicted?: boolean; // Skip slots with existing conflicts
  retryFailures?: boolean;  // Retry failed operations
  maxRetries?: number;      // Maximum retry attempts
  progressCallback?: (progress: BatchSyncProgress) => void;
}

/**
 * Batch sync progress information
 */
export interface BatchSyncProgress {
  totalSlots: number;
  completedSlots: number;
  currentSlot: number | null;
  currentOperation: string;
  overallProgress: number; // 0-100
  slotsInProgress: number[];
  successfulSlots: number[];
  failedSlots: number[];
  skippedSlots: number[];
  estimatedTimeRemaining: number; // milliseconds
  averageTimePerSlot: number; // milliseconds
  startTime: Date;
  errors: Array<{ slotNumber: number; error: CloudError }>;
}

/**
 * Batch sync result for individual slot
 */
export interface BatchSlotResult {
  slotNumber: number;
  operation: 'backup' | 'restore' | 'sync' | 'skipped' | 'failed';
  success: boolean;
  duration: number; // milliseconds
  dataSize?: number;
  error?: CloudError;
  conflictResolution?: ConflictResolution;
  retryCount?: number;
}

/**
 * Device information for save tracking
 */
export interface DeviceInfo {
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  timezone: string;
  language: string;
  timestamp: number;
}

/**
 * Enhanced sync metadata tracking
 */
export interface SyncMetadata {
  lastSyncTime: Date | null;
  lastSuccessfulSync: Date | null;
  lastSyncAttempt: Date | null;
  syncCount: number;
  failureCount: number;
  lastSyncDuration: number; // milliseconds
  averageSyncDuration: number; // milliseconds
  syncHistory: SyncHistoryEntry[];
  deviceHistory: DeviceInfo[];
  saveVersion: string;
  cloudSaveVersion: string;
  localSaveVersion: string;
  versionConflicts: number;
}

/**
 * Sync history entry for detailed tracking
 */
export interface SyncHistoryEntry {
  timestamp: Date;
  operation: 'backup' | 'restore' | 'sync' | 'conflict-resolution';
  slotNumber: number;
  success: boolean;
  duration: number; // milliseconds
  dataSize: number; // bytes
  compressionRatio?: number;
  errorCode?: string;
  errorMessage?: string;
  deviceInfo: DeviceInfo;
  networkCondition: 'fast' | 'slow' | 'offline';
  conflictResolution?: ConflictResolution;
}

/**
 * Manual sync trigger types
 */
export type ManualSyncTrigger =
  | 'user-initiated'      // User clicked sync button
  | 'save-operation'      // After saving a game
  | 'load-operation'      // After loading a game
  | 'game-milestone'      // After reaching game milestone
  | 'periodic-timer'      // Periodic timer trigger
  | 'network-reconnect'   // When network reconnects
  | 'focus-regained'      // When app regains focus
  | 'before-close'        // Before app closes
  | 'startup'             // On app startup
  | 'conflict-detected'   // When conflict is detected
  | 'error-recovery';     // After error recovery

/**
 * Auto-sync configuration
 */
export interface AutoSyncConfig {
  enabled: boolean;
  triggers: ManualSyncTrigger[];
  frequency: number; // minutes
  onlyWhenIdle: boolean; // Only sync when user is idle
  idleThreshold: number; // seconds of inactivity before considered idle
  maxConcurrentAutoSyncs: number;
  skipOnSlowNetwork: boolean;
  skipOnBattery: boolean; // Skip on battery power (mobile)
  retryOnFailure: boolean;
  maxRetryAttempts: number;
}

/**
 * Cloud save preferences
 */
export interface CloudSavePreferences {
  autoSync: boolean;
  syncOnAppStart: boolean;
  syncOnAppClose: boolean;
  conflictResolution: ConflictResolution;
  maxStorageUsage: number; // Maximum cloud storage usage in MB
  compressionLevel: number; // 0-9 compression level
  syncFrequency: number;   // Auto-sync frequency in minutes
  trackingEnabled: boolean; // Enable detailed metadata tracking
  maxHistoryEntries: number; // Maximum sync history entries to keep
  performanceMonitoring: boolean; // Enable performance tracking
  autoSyncConfig: AutoSyncConfig; // Enhanced auto-sync configuration
  manualSyncNotifications: boolean; // Show notifications for manual sync results
}

/**
 * Hook result interface
 */
export interface UseCloudSaveReturn {
  // Authentication and connection state
  isAuthenticated: boolean;
  isOnline: boolean;
  cloudStorageAvailable: boolean;

  // Cloud save data
  cloudSaves: CloudSaveMetadata[];
  isLoading: boolean;
  lastSyncTime: Date | null;

  // Metadata tracking
  syncMetadata: SyncMetadata;
  deviceInfo: DeviceInfo;

  // Sync status and progress
  syncProgress: CloudSyncProgress;
  conflicts: SaveConflict[];
  pendingOperations: number;

  // Batch sync status
  batchSyncActive: boolean;
  batchSyncProgress: BatchSyncProgress | null;

  // Storage usage
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;

  // Core cloud operations
  uploadSave: (gameState: ReactGameState, slotNumber: number, saveName?: string) => Promise<CloudSaveResult>;
  downloadSave: (cloudSaveId: string) => Promise<ReactGameState | null>;
  deleteSave: (cloudSaveId: string) => Promise<boolean>;

  // Backup operations
  backupSave: (slotNumber: number, options?: { saveName?: string; overwrite?: boolean }) => Promise<CloudSaveResult>;
  backupAllSaves: (config?: Partial<BatchSyncConfig>) => Promise<CloudSaveResult[]>;

  // Restore operations
  restoreSave: (cloudSaveId: string, targetSlotNumber: number, options?: { overwrite?: boolean; saveName?: string }) => Promise<CloudSaveResult>;
  restoreAllSaves: (cloudSaveIds: string[], config?: Partial<BatchSyncConfig & { startingSlot?: number; autoSlotAssignment?: boolean }>) => Promise<CloudSaveResult[]>;

  // Sync operations
  syncSave: (slotNumber: number, conflictResolution?: ConflictResolution) => Promise<CloudSaveResult>;
  syncAllSaves: (config: Partial<BatchSyncConfig>) => Promise<CloudSaveResult[]>;
  resolveSaveConflict: (conflict: SaveConflict, resolution: ConflictResolution) => Promise<CloudSaveResult>;

  // Batch sync operations
  batchSync: (config: Partial<BatchSyncConfig>) => Promise<BatchSlotResult[]>;
  smartSync: (slotNumbers?: number[]) => Promise<BatchSlotResult[]>;
  prioritySync: (prioritySlots: number[], otherSlots?: number[]) => Promise<BatchSlotResult[]>;
  cancelBatchSync: () => void;

  // Manual sync triggers
  triggerManualSync: (trigger: ManualSyncTrigger, slotNumbers?: number[]) => Promise<void>;
  triggerFullSync: () => Promise<void>;
  triggerQuickSync: () => Promise<void>;
  scheduleAutoSync: (delayMs?: number) => void;
  cancelAutoSync: () => void;

  // Metadata operations
  refreshCloudSaves: () => Promise<void>;
  getCloudSaveMetadata: (cloudSaveId: string) => Promise<CloudSaveMetadata | null>;
  updateSaveMetadata: (cloudSaveId: string, updates: Partial<CloudSaveMetadata>) => Promise<boolean>;

  // Conflict resolution functions
  resolveAllConflicts: (conflictResolution: ConflictResolution) => Promise<CloudSaveResult[]>;
  analyzeConflict: (slotNumber: number) => Promise<SaveConflict | null>;
  autoResolveConflicts: () => Promise<CloudSaveResult[]>;

  // Metadata tracking functions
  getCurrentDeviceInfo: () => DeviceInfo;
  getSyncHistory: (slotNumber?: number, limit?: number) => SyncHistoryEntry[];
  clearSyncHistory: () => void;
  exportSyncMetadata: () => string;
  importSyncMetadata: (data: string) => boolean;
  getVersionInfo: (slotNumber: number) => Promise<{ local: string; cloud: string; conflicts: number }>;

  // Utility functions
  checkForConflicts: (slotNumber: number) => Promise<SaveConflict | null>;
  estimateSyncTime: (slotNumbers: number[]) => Promise<number>;

  // Preferences
  preferences: CloudSavePreferences;
  updatePreferences: (updates: Partial<CloudSavePreferences>) => Promise<void>;

  // Error handling
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

/**
 * Default auto-sync configuration
 */
const DEFAULT_AUTO_SYNC_CONFIG: AutoSyncConfig = {
  enabled: true,
  triggers: ['user-initiated', 'save-operation', 'startup', 'focus-regained', 'network-reconnect'],
  frequency: 5, // 5 minutes
  onlyWhenIdle: false,
  idleThreshold: 60, // 60 seconds
  maxConcurrentAutoSyncs: 1,
  skipOnSlowNetwork: true,
  skipOnBattery: false,
  retryOnFailure: true,
  maxRetryAttempts: 3
};

/**
 * Default cloud save preferences
 */
const DEFAULT_PREFERENCES: CloudSavePreferences = {
  autoSync: true,
  syncOnAppStart: true,
  syncOnAppClose: true,
  conflictResolution: 'keep-newest',
  maxStorageUsage: 100, // 100 MB
  compressionLevel: 6,
  syncFrequency: 5, // 5 minutes
  trackingEnabled: true,
  maxHistoryEntries: 100,
  performanceMonitoring: true,
  autoSyncConfig: DEFAULT_AUTO_SYNC_CONFIG,
  manualSyncNotifications: true
};

/**
 * Hook for managing cloud save operations and sync status
 *
 * @example
 * ```tsx
 * function CloudSaveManager() {
 *   const {
 *     cloudSaves,
 *     syncProgress,
 *     uploadSave,
 *     syncAllSaves,
 *     conflicts,
 *     resolveSaveConflict
 *   } = useCloudSave();
 *
 *   // Upload current game state
 *   const handleUpload = async () => {
 *     const result = await uploadSave(gameState, 1, "My Save");
 *     if (result.success) {
 *       console.log("Save uploaded successfully");
 *     }
 *   };
 *
 *   // Handle sync conflicts
 *   if (conflicts.length > 0) {
 *     return <ConflictResolutionDialog conflicts={conflicts} />;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleUpload}>Upload Save</button>
 *       <SyncProgressBar progress={syncProgress} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCloudSave(): UseCloudSaveReturn {
  const { user, isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { addOperation, removeOperation } = useOfflineQueue();

  // State management
  const [cloudSaves, setCloudSaves] = useState<CloudSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [conflicts, setConflicts] = useState<SaveConflict[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(100 * 1024 * 1024); // 100 MB default
  const [preferences, setPreferences] = useState<CloudSavePreferences>(DEFAULT_PREFERENCES);
  const [pendingOperations, setPendingOperations] = useState(0);

  // Metadata tracking state
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata>({
    lastSyncTime: null,
    lastSuccessfulSync: null,
    lastSyncAttempt: null,
    syncCount: 0,
    failureCount: 0,
    lastSyncDuration: 0,
    averageSyncDuration: 0,
    syncHistory: [],
    deviceHistory: [],
    saveVersion: '1.0.0',
    cloudSaveVersion: '1.0.0',
    localSaveVersion: '1.0.0',
    versionConflicts: 0
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getCurrentDeviceInfo());

  // Batch sync state
  const [batchSyncActive, setBatchSyncActive] = useState(false);
  const [batchSyncProgress, setBatchSyncProgress] = useState<BatchSyncProgress | null>(null);
  const [batchSyncCancelled, setBatchSyncCancelled] = useState(false);

  // Auto-sync state
  const [autoSyncActive, setAutoSyncActive] = useState(false);
  const [lastAutoSyncTrigger, setLastAutoSyncTrigger] = useState<ManualSyncTrigger | null>(null);
  const [userIdleTime, setUserIdleTime] = useState(0);
  const [isUserIdle, setIsUserIdle] = useState(false);

  // Auto-sync timers and refs
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userActivityRef = useRef<Date>(new Date());

  // Device info detection function
  function getCurrentDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    // Detect browser
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browserName = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Edg')) {
      browserName = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // Detect OS
    let osName = 'Unknown';
    let osVersion = 'Unknown';

    if (platform.includes('Win')) {
      osName = 'Windows';
      if (ua.includes('Windows NT 10.0')) osVersion = '10';
      else if (ua.includes('Windows NT 6.3')) osVersion = '8.1';
      else if (ua.includes('Windows NT 6.2')) osVersion = '8';
      else if (ua.includes('Windows NT 6.1')) osVersion = '7';
    } else if (platform.includes('Mac')) {
      osName = 'macOS';
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : 'Unknown';
    } else if (platform.includes('Linux')) {
      osName = 'Linux';
    } else if (ua.includes('Android')) {
      osName = 'Android';
      const match = ua.match(/Android (\d+\.?\d*)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      osName = 'iOS';
      const match = ua.match(/OS (\d+[._]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : 'Unknown';
    }

    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (ua.includes('Mobile') && !ua.includes('Tablet')) {
      deviceType = 'mobile';
    } else if (ua.includes('Tablet') || ua.includes('iPad')) {
      deviceType = 'tablet';
    }

    // Get screen resolution
    const screenResolution = `${screen.width}x${screen.height}`;

    // Get timezone and language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    return {
      platform,
      userAgent: ua,
      browserName,
      browserVersion,
      osName,
      osVersion,
      deviceType,
      screenResolution,
      timezone,
      language,
      timestamp: Date.now()
    };
  }

  // Network condition detection
  function detectNetworkCondition(): 'fast' | 'slow' | 'offline' {
    if (!isOnline) return 'offline';

    // Use Connection API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      if (connection.effectiveType === '4g' || connection.downlink > 10) {
        return 'fast';
      } else if (connection.effectiveType === '3g' || connection.downlink > 1) {
        return 'fast';
      } else {
        return 'slow';
      }
    }

    // Fallback to basic online/offline detection
    return 'fast'; // Assume fast if we can't detect
  }

  // Add sync history entry
  const addSyncHistoryEntry = useCallback((entry: Omit<SyncHistoryEntry, 'deviceInfo' | 'networkCondition'>) => {
    if (!preferences.trackingEnabled) return;

    const fullEntry: SyncHistoryEntry = {
      ...entry,
      deviceInfo: getCurrentDeviceInfo(),
      networkCondition: detectNetworkCondition()
    };

    setSyncMetadata(prev => {
      const newHistory = [fullEntry, ...prev.syncHistory];

      // Limit history size
      const trimmedHistory = newHistory.slice(0, preferences.maxHistoryEntries);

      // Update averages
      const successfulEntries = trimmedHistory.filter(e => e.success);
      const averageDuration = successfulEntries.length > 0
        ? successfulEntries.reduce((sum, e) => sum + e.duration, 0) / successfulEntries.length
        : prev.averageSyncDuration;

      return {
        ...prev,
        syncHistory: trimmedHistory,
        syncCount: prev.syncCount + (entry.success ? 1 : 0),
        failureCount: prev.failureCount + (entry.success ? 0 : 1),
        lastSyncDuration: entry.duration,
        averageSyncDuration: averageDuration,
        lastSyncTime: new Date(entry.timestamp),
        lastSuccessfulSync: entry.success ? new Date(entry.timestamp) : prev.lastSuccessfulSync,
        lastSyncAttempt: new Date(entry.timestamp)
      };
    });
  }, [preferences.trackingEnabled, preferences.maxHistoryEntries, isOnline]);

  // Sync progress state
  const [syncProgress, setSyncProgress] = useState<CloudSyncProgress>({
    state: 'idle',
    progress: 0,
    status: 'Ready',
    error: null
  });

  // Service instances
  const cloudStorageRef = useRef<CloudStorageService | null>(null);
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);

  // Initialize cloud storage service
  useEffect(() => {
    if (isAuthenticated && user) {
      cloudStorageRef.current = new CloudStorageService();
    } else {
      cloudStorageRef.current = null;
    }
  }, [isAuthenticated, user]);

  // Computed values
  const cloudStorageAvailable = isAuthenticated && isOnline && cloudStorageRef.current !== null;
  const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  // Refresh cloud saves when authenticated
  const refreshCloudSaves = useCallback(async () => {
    if (!cloudStorageRef.current || !user) {
      setCloudSaves([]);
      return;
    }

    setIsLoading(true);
    try {
      const saves = await cloudStorageRef.current.listSaves(user.uid);
      setCloudSaves(saves);

      // Calculate storage usage
      const totalSize = saves.reduce((sum, save) => sum + save.compressedSize, 0);
      setStorageUsed(totalSize);
    } catch (error) {
      console.error('Failed to refresh cloud saves:', error);
      setSyncProgress(prev => ({
        ...prev,
        state: 'error',
        error: error as CloudError
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-refresh on authentication changes
  useEffect(() => {
    if (cloudStorageAvailable) {
      refreshCloudSaves();
    }
  }, [cloudStorageAvailable, refreshCloudSaves]);

  // Upload save to cloud
  const uploadSave = useCallback(async (
    gameState: ReactGameState,
    slotNumber: number,
    saveName?: string
  ): Promise<CloudSaveResult> => {
    if (!cloudStorageRef.current || !user) {
      return {
        success: false,
        error: { code: 'not-authenticated', message: 'User not authenticated' } as CloudError
      };
    }

    setSyncProgress({
      state: 'uploading',
      progress: 0,
      status: 'Preparing upload...',
      error: null,
      currentOperation: 'upload',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);

    try {
      // Add to offline queue if not online
      if (!isOnline) {
        await addOperation({
          type: 'cloud-upload',
          data: { gameState, slotNumber, saveName },
          timestamp: new Date()
        });
        return { success: true };
      }

      // Progress callback
      const onProgress = (progress: UploadProgress) => {
        setSyncProgress(prev => ({
          ...prev,
          progress: progress.percentage,
          status: progress.status,
          estimatedTimeRemaining: progress.estimatedTimeRemaining
        }));
      };

      const result = await cloudStorageRef.current.uploadSave(
        user.uid,
        slotNumber,
        gameState,
        saveName || `Save ${slotNumber}`,
        { onProgress }
      );

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: 'Upload completed',
        error: null
      });

      // Refresh cloud saves list
      await refreshCloudSaves();
      setLastSyncTime(new Date());

      return { success: true, metadata: result };

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: 'Upload failed',
        error: cloudError
      });

      return { success: false, error: cloudError };
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [user, isOnline, addOperation, refreshCloudSaves]);

  // Download save from cloud
  const downloadSave = useCallback(async (cloudSaveId: string): Promise<ReactGameState | null> => {
    if (!cloudStorageRef.current || !user) {
      return null;
    }

    setSyncProgress({
      state: 'downloading',
      progress: 0,
      status: 'Preparing download...',
      error: null,
      currentOperation: 'download',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);

    try {
      const onProgress = (progress: DownloadProgress) => {
        setSyncProgress(prev => ({
          ...prev,
          progress: progress.percentage,
          status: progress.status,
          estimatedTimeRemaining: progress.estimatedTimeRemaining
        }));
      };

      const gameState = await cloudStorageRef.current.downloadSave(
        user.uid,
        cloudSaveId,
        { onProgress }
      );

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: 'Download completed',
        error: null
      });

      setLastSyncTime(new Date());
      return gameState;

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: 'Download failed',
        error: cloudError
      });

      return null;
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [user]);

  // Delete save from cloud
  const deleteSave = useCallback(async (cloudSaveId: string): Promise<boolean> => {
    if (!cloudStorageRef.current || !user) {
      return false;
    }

    try {
      await cloudStorageRef.current.deleteSave(user.uid, cloudSaveId);
      await refreshCloudSaves();
      return true;
    } catch (error) {
      console.error('Failed to delete cloud save:', error);
      return false;
    }
  }, [user, refreshCloudSaves]);

  // Check for conflicts between local and cloud saves
  const checkForConflicts = useCallback(async (slotNumber: number): Promise<SaveConflict | null> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return null;
    }

    try {
      // Get local save metadata
      const localSaveResult = await saveSystemManager.getSaveInfo(slotNumber);
      if (!localSaveResult.success || !localSaveResult.data?.hasData) {
        return null; // No local save to conflict with
      }

      const localMetadata = localSaveResult.data.metadata;
      if (!localMetadata) {
        return null;
      }

      // Find corresponding cloud save
      const cloudSave = cloudSaves.find(save => save.slotNumber === slotNumber);
      if (!cloudSave) {
        return null; // No cloud save to conflict with
      }

      // Compare timestamps to detect conflicts
      const localTimestamp = new Date(localMetadata.lastModified);
      const cloudTimestamp = new Date(cloudSave.updatedAt);

      // Enhanced timestamp-based conflict detection
      const timeDifferenceMs = Math.abs(localTimestamp.getTime() - cloudTimestamp.getTime());

      // Adaptive time threshold based on save frequency
      const baseThreshold = 60000; // 1 minute base threshold
      const adaptiveThreshold = Math.max(baseThreshold, timeDifferenceMs * 0.1); // Allow 10% tolerance
      const significantTimeDifference = timeDifferenceMs > adaptiveThreshold;

      // Check size differences with improved logic
      const localSize = localMetadata.fileSizeBytes || 0;
      const cloudSize = cloudSave.compressedSize || 0;
      const sizeDifference = Math.abs(localSize - cloudSize);

      // Use relative size difference for better accuracy
      const maxSize = Math.max(localSize, cloudSize);
      const relativeThreshold = maxSize < 1024 ? 0.5 : 0.1; // 50% for small files, 10% for larger files
      const significantSizeDifference = maxSize > 0 && (sizeDifference / maxSize) > relativeThreshold;

      // Check for metadata inconsistencies
      const hasMetadataDifferences = localMetadata.name !== cloudSave.saveName ||
                                   Math.abs((localMetadata.totalPlayTime || 0) - (cloudSave.playtime || 0)) > 30000; // 30 seconds playtime difference

      // Advanced conflict detection logic
      const hasConflict = significantTimeDifference || significantSizeDifference || hasMetadataDifferences;

      if (!hasConflict) {
        return null;
      }

      // Create conflict details
      const conflictDetails: string[] = [];

      if (significantTimeDifference) {
        const timeDiffMinutes = Math.round(timeDifferenceMs / 60000);
        conflictDetails.push(
          `Time difference: ${timeDiffMinutes} minutes (local: ${localTimestamp.toLocaleString()}, cloud: ${cloudTimestamp.toLocaleString()})`
        );
      }

      if (significantSizeDifference) {
        const sizeDiffKB = Math.round(sizeDifference / 1024);
        conflictDetails.push(`Size difference: ${sizeDiffKB} KB`);
      }

      // Check for metadata differences
      if (localMetadata.name !== cloudSave.saveName) {
        conflictDetails.push(`Name difference: "${localMetadata.name}" vs "${cloudSave.saveName}"`);
      }

      const localSaveInfo: SaveSlotInfo = {
        slotNumber,
        hasData: true,
        metadata: localMetadata,
        isCorrupted: localMetadata.isCorrupted || false,
        lastAccessed: localMetadata.lastAccessed,
        playerSummary: {
          name: localMetadata.name || 'Unknown',
          class: 'Unknown', // Would need to extract from save data
          level: 1, // Would need to extract from save data
          currentHP: 100, // Would need to extract from save data
          maxHP: 100, // Would need to extract from save data
          currentArea: 'Unknown' // Would need to extract from save data
        },
        progressSummary: {
          completionPercentage: 0, // Would calculate from save data
          mainQuestsCompleted: 0,
          sideQuestsCompleted: 0,
          areasExplored: 0,
          totalAreas: 1,
          achievements: []
        }
      };

      const conflict: SaveConflict = {
        slotNumber,
        localSave: localSaveInfo,
        cloudSave,
        localTimestamp,
        cloudTimestamp,
        sizeDifference,
        conflictDetails
      };

      return conflict;

    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  }, [saveSystemManager, user, cloudSaves]);

  // Import local save system manager
  const [saveSystemManager, setSaveSystemManager] = useState<any>(null);

  // Initialize save system manager
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../utils/saveSystemManager').then(({ SaveSystemManager, createDefaultSaveSystemConfig }) => {
        const config = createDefaultSaveSystemConfig();
        const manager = new SaveSystemManager(config);
        manager.initialize().then(() => {
          setSaveSystemManager(manager);
        });
      });
    }
  }, []);

  // Backup a specific save slot to cloud
  const backupSave = useCallback(async (
    slotNumber: number,
    options: { saveName?: string; overwrite?: boolean } = {}
  ): Promise<CloudSaveResult> => {
    if (!cloudStorageRef.current || !user || !saveSystemManager) {
      return {
        success: false,
        error: { code: 'not-ready', message: 'Cloud storage or save system not available' } as CloudError
      };
    }

    setSyncProgress({
      state: 'uploading',
      progress: 0,
      status: 'Loading local save...',
      error: null,
      currentOperation: 'backup',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => backupSave(slotNumber, options);

    const startTime = Date.now();

    try {
      // Load local save data
      setSyncProgress(prev => ({ ...prev, progress: 10, status: 'Reading local save data...' }));

      const loadResult = await saveSystemManager.loadGame({ slotNumber });
      if (!loadResult.success || !loadResult.data) {
        throw new Error(`Failed to load local save from slot ${slotNumber}`);
      }

      const gameState = loadResult.data.gameState;
      const localMetadata = loadResult.data.metadata;

      // Check if cloud save already exists
      setSyncProgress(prev => ({ ...prev, progress: 20, status: 'Checking for existing cloud save...' }));

      const existingCloudSave = cloudSaves.find(save => save.slotNumber === slotNumber);

      if (existingCloudSave && !options.overwrite) {
        // Check for conflicts
        const conflict = await checkForConflicts(slotNumber);
        if (conflict) {
          setSyncProgress(prev => ({
            ...prev,
            state: 'resolving',
            status: 'Conflict detected - manual resolution required'
          }));

          setConflicts(prev => [...prev, conflict]);
          return {
            success: false,
            error: { code: 'conflict-detected', message: 'Save conflict requires resolution' } as CloudError
          };
        }
      }

      // Prepare save name
      const saveName = options.saveName ||
                      localMetadata?.name ||
                      `${gameState.player?.name || 'Player'} - Level ${gameState.player?.level || 1}`;

      // Upload to cloud with progress tracking
      setSyncProgress(prev => ({ ...prev, progress: 30, status: 'Uploading to cloud...' }));

      const onProgress = (progress: UploadProgress) => {
        const baseProgress = 30;
        const uploadProgress = (progress.percentage * 0.6); // 60% of total for upload
        setSyncProgress(prev => ({
          ...prev,
          progress: baseProgress + uploadProgress,
          status: progress.status,
          estimatedTimeRemaining: progress.estimatedTimeRemaining
        }));
      };

      const cloudMetadata = await cloudStorageRef.current.uploadSave(
        user.uid,
        slotNumber,
        gameState,
        saveName,
        { onProgress }
      );

      // Update local save with cloud sync information
      setSyncProgress(prev => ({ ...prev, progress: 95, status: 'Updating local sync status...' }));

      if (localMetadata) {
        await saveSystemManager.updateSaveMetadata(slotNumber, {
          ...localMetadata,
          cloudSyncStatus: 'synced',
          lastCloudSync: new Date(),
          cloudSaveId: cloudMetadata.id
        });
      }

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: 'Backup completed successfully',
        error: null
      });

      // Refresh cloud saves list
      await refreshCloudSaves();
      setLastSyncTime(new Date());

      // Add tracking entry
      const duration = Date.now() - startTime;
      addSyncHistoryEntry({
        timestamp: new Date(),
        operation: 'backup',
        slotNumber,
        success: true,
        duration,
        dataSize: localMetadata?.fileSizeBytes || 0,
        compressionRatio: cloudMetadata.compressionRatio
      });

      return {
        success: true,
        metadata: cloudMetadata,
        conflictResolution: options.overwrite ? 'keep-local' : undefined
      };

    } catch (error) {
      const cloudError = error as CloudError;
      const duration = Date.now() - startTime;

      // Add failed tracking entry
      addSyncHistoryEntry({
        timestamp: new Date(),
        operation: 'backup',
        slotNumber,
        success: false,
        duration,
        dataSize: 0,
        errorCode: cloudError.code,
        errorMessage: cloudError.message
      });

      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Backup failed: ${cloudError.message}`,
        error: cloudError
      });

      return { success: false, error: cloudError };
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [user, saveSystemManager, cloudSaves, checkForConflicts, refreshCloudSaves, addSyncHistoryEntry]);

  // Backup multiple saves with batch processing
  const backupAllSaves = useCallback(async (config: Partial<BatchSyncConfig> = {}): Promise<CloudSaveResult[]> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return [];
    }

    const {
      slotNumbers,
      conflictResolution = preferences.conflictResolution,
      maxConcurrent = 3,
      skipLargeFiles = false,
      maxFileSize = 50 * 1024 * 1024 // 50MB default
    } = config;

    setSyncProgress({
      state: 'syncing',
      progress: 0,
      status: 'Starting batch backup...',
      error: null,
      currentOperation: 'batch-backup',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => backupAllSaves(config);

    try {
      // Get all local saves
      setSyncProgress(prev => ({ ...prev, progress: 5, status: 'Scanning local saves...' }));

      const slotsResult = await saveSystemManager.getAllSaveSlots();
      if (!slotsResult.success) {
        throw new Error('Failed to get local save slots');
      }

      // Determine which slots to backup
      const localSlots = slotsResult.data || [];
      const slotsToBackup = slotNumbers ?
        localSlots.filter(slot => slotNumbers.includes(slot.slotNumber)) :
        localSlots.filter(slot => slot.hasData);

      if (slotsToBackup.length === 0) {
        setSyncProgress({
          state: 'idle',
          progress: 100,
          status: 'No saves to backup',
          error: null
        });
        return [];
      }

      // Filter out large files if requested
      let filteredSlots = slotsToBackup;
      if (skipLargeFiles && maxFileSize) {
        filteredSlots = slotsToBackup.filter(slot =>
          !slot.metadata?.fileSizeBytes || slot.metadata.fileSizeBytes <= maxFileSize
        );
      }

      setSyncProgress(prev => ({
        ...prev,
        progress: 10,
        status: `Backing up ${filteredSlots.length} saves...`
      }));

      // Process saves in batches
      const results: CloudSaveResult[] = [];
      const batchSize = maxConcurrent;

      for (let i = 0; i < filteredSlots.length; i += batchSize) {
        const batch = filteredSlots.slice(i, i + batchSize);
        const batchProgress = ((i / filteredSlots.length) * 80) + 10; // 10-90% for batches

        setSyncProgress(prev => ({
          ...prev,
          progress: batchProgress,
          status: `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filteredSlots.length / batchSize)}...`
        }));

        // Process batch concurrently
        const batchPromises = batch.map(async (slot) => {
          try {
            return await backupSave(slot.slotNumber, {
              overwrite: conflictResolution === 'keep-local'
            });
          } catch (error) {
            return {
              success: false,
              error: error as CloudError
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Collect results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              success: false,
              error: {
                code: 'batch-error',
                message: `Failed to backup slot ${batch[index].slotNumber}: ${result.reason}`
              } as CloudError
            });
          }
        });

        // Small delay between batches to prevent overwhelming the service
        if (i + batchSize < filteredSlots.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate final statistics
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: `Batch backup completed: ${successCount} successful, ${failureCount} failed`,
        error: failureCount > 0 ? {
          code: 'partial-failure',
          message: `${failureCount} saves failed to backup`
        } as CloudError : null
      });

      await refreshCloudSaves();
      setLastSyncTime(new Date());

      return results;

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Batch backup failed: ${cloudError.message}`,
        error: cloudError
      });

      return [];
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [saveSystemManager, user, preferences.conflictResolution, backupSave, refreshCloudSaves]);

  // Restore a specific save from cloud to local slot
  const restoreSave = useCallback(async (
    cloudSaveId: string,
    targetSlotNumber: number,
    options: { overwrite?: boolean; saveName?: string } = {}
  ): Promise<CloudSaveResult> => {
    if (!cloudStorageRef.current || !user || !saveSystemManager) {
      return {
        success: false,
        error: { code: 'not-ready', message: 'Cloud storage or save system not available' } as CloudError
      };
    }

    setSyncProgress({
      state: 'downloading',
      progress: 0,
      status: 'Preparing restore...',
      error: null,
      currentOperation: 'restore',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => restoreSave(cloudSaveId, targetSlotNumber, options);

    try {
      // Get cloud save metadata
      setSyncProgress(prev => ({ ...prev, progress: 5, status: 'Loading cloud save metadata...' }));

      const cloudMetadata = await cloudStorageRef.current.getSaveMetadata(user.uid, cloudSaveId);
      if (!cloudMetadata) {
        throw new Error(`Cloud save not found: ${cloudSaveId}`);
      }

      // Check if target slot is occupied and handle conflicts
      setSyncProgress(prev => ({ ...prev, progress: 10, status: 'Checking target slot...' }));

      const targetSlotResult = await saveSystemManager.getSaveInfo(targetSlotNumber);
      if (targetSlotResult.success && targetSlotResult.data?.hasData && !options.overwrite) {
        // Check for conflicts
        const conflict = await checkForConflicts(targetSlotNumber);
        if (conflict) {
          setSyncProgress(prev => ({
            ...prev,
            state: 'resolving',
            status: 'Conflict detected - manual resolution required'
          }));

          setConflicts(prev => [...prev, conflict]);
          return {
            success: false,
            error: { code: 'conflict-detected', message: 'Target slot conflict requires resolution' } as CloudError
          };
        }
      }

      // Download game state from cloud
      setSyncProgress(prev => ({ ...prev, progress: 20, status: 'Downloading save data...' }));

      const onProgress = (progress: DownloadProgress) => {
        const baseProgress = 20;
        const downloadProgress = (progress.percentage * 0.5); // 50% of total for download
        setSyncProgress(prev => ({
          ...prev,
          progress: baseProgress + downloadProgress,
          status: progress.status,
          estimatedTimeRemaining: progress.estimatedTimeRemaining
        }));
      };

      const gameState = await cloudStorageRef.current.downloadSave(
        user.uid,
        cloudSaveId,
        { onProgress }
      );

      if (!gameState) {
        throw new Error('Failed to download game state from cloud');
      }

      // Prepare save metadata for local storage
      setSyncProgress(prev => ({ ...prev, progress: 70, status: 'Preparing local save...' }));

      const saveName = options.saveName ||
                      cloudMetadata.saveName ||
                      `Restored - ${gameState.player?.name || 'Player'} Level ${gameState.player?.level || 1}`;

      const saveMetadata: SaveMetadata = {
        id: `restored_${cloudSaveId}_${Date.now()}`,
        slotNumber: targetSlotNumber,
        name: saveName,
        createdAt: new Date(cloudMetadata.createdAt),
        lastModified: new Date(cloudMetadata.updatedAt),
        lastAccessed: new Date(),
        gameVersion: cloudMetadata.gameVersion,
        saveVersion: '1.0.0', // Current save system version
        totalPlayTime: cloudMetadata.playtime,
        fileSizeBytes: cloudMetadata.dataSize,
        tags: ['restored', 'cloud'],
        notes: `Restored from cloud on ${new Date().toLocaleDateString()}`,
        isFavorite: false,
        isCorrupted: false,
        // Cloud sync information
        cloudSyncStatus: 'synced' as any,
        lastCloudSync: new Date(),
        cloudSaveId: cloudSaveId
      };

      // Save to local storage
      setSyncProgress(prev => ({ ...prev, progress: 80, status: 'Saving to local storage...' }));

      const saveOptions: SaveOperationOptions = {
        slotNumber: targetSlotNumber,
        saveName,
        overwrite: options.overwrite || false,
        createThumbnail: true,
        validateData: true,
        compressData: true,
        metadata: saveMetadata
      };

      const saveResult = await saveSystemManager.saveGame(gameState, saveOptions);
      if (!saveResult.success) {
        throw new Error(`Failed to save to local slot: ${saveResult.error}`);
      }

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: 'Restore completed successfully',
        error: null
      });

      setLastSyncTime(new Date());

      return {
        success: true,
        metadata: cloudMetadata,
        conflictResolution: options.overwrite ? 'keep-cloud' : undefined
      };

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Restore failed: ${cloudError.message}`,
        error: cloudError
      });

      return { success: false, error: cloudError };
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [user, saveSystemManager, checkForConflicts]);

  // Restore multiple saves with batch processing
  const restoreAllSaves = useCallback(async (
    cloudSaveIds: string[],
    config: Partial<BatchSyncConfig & { startingSlot?: number; autoSlotAssignment?: boolean }> = {}
  ): Promise<CloudSaveResult[]> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return [];
    }

    const {
      conflictResolution = preferences.conflictResolution,
      maxConcurrent = 2, // Lower concurrency for restores to avoid overwhelming local storage
      startingSlot = 0,
      autoSlotAssignment = true
    } = config;

    setSyncProgress({
      state: 'syncing',
      progress: 0,
      status: 'Starting batch restore...',
      error: null,
      currentOperation: 'batch-restore',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => restoreAllSaves(cloudSaveIds, config);

    try {
      // Validate cloud save IDs
      setSyncProgress(prev => ({ ...prev, progress: 5, status: 'Validating cloud saves...' }));

      const validCloudSaves: CloudSaveMetadata[] = [];
      for (const cloudSaveId of cloudSaveIds) {
        const metadata = await cloudStorageRef.current.getSaveMetadata(user.uid, cloudSaveId);
        if (metadata) {
          validCloudSaves.push(metadata);
        }
      }

      if (validCloudSaves.length === 0) {
        setSyncProgress({
          state: 'idle',
          progress: 100,
          status: 'No valid cloud saves to restore',
          error: null
        });
        return [];
      }

      // Determine target slots
      setSyncProgress(prev => ({ ...prev, progress: 10, status: 'Determining target slots...' }));

      const slotAssignments: Array<{ cloudSave: CloudSaveMetadata; targetSlot: number }> = [];

      if (autoSlotAssignment) {
        // Get all local save slots to find available slots
        const slotsResult = await saveSystemManager.getAllSaveSlots();
        const localSlots = slotsResult.success ? slotsResult.data || [] : [];
        const occupiedSlots = new Set(localSlots.filter(slot => slot.hasData).map(slot => slot.slotNumber));

        let currentSlot = startingSlot;
        for (const cloudSave of validCloudSaves) {
          // Try to use the original slot number first
          if (!occupiedSlots.has(cloudSave.slotNumber)) {
            slotAssignments.push({ cloudSave, targetSlot: cloudSave.slotNumber });
            occupiedSlots.add(cloudSave.slotNumber);
          } else {
            // Find next available slot
            while (occupiedSlots.has(currentSlot) && currentSlot < 100) {
              currentSlot++;
            }
            if (currentSlot >= 100) {
              throw new Error('No available save slots for restore');
            }
            slotAssignments.push({ cloudSave, targetSlot: currentSlot });
            occupiedSlots.add(currentSlot);
            currentSlot++;
          }
        }
      } else {
        // Use sequential slot assignment starting from startingSlot
        validCloudSaves.forEach((cloudSave, index) => {
          slotAssignments.push({ cloudSave, targetSlot: startingSlot + index });
        });
      }

      setSyncProgress(prev => ({
        ...prev,
        progress: 15,
        status: `Restoring ${slotAssignments.length} saves...`
      }));

      // Process restores in batches
      const results: CloudSaveResult[] = [];
      const batchSize = maxConcurrent;

      for (let i = 0; i < slotAssignments.length; i += batchSize) {
        const batch = slotAssignments.slice(i, i + batchSize);
        const batchProgress = ((i / slotAssignments.length) * 80) + 15; // 15-95% for batches

        setSyncProgress(prev => ({
          ...prev,
          progress: batchProgress,
          status: `Processing restore batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(slotAssignments.length / batchSize)}...`
        }));

        // Process batch concurrently
        const batchPromises = batch.map(async ({ cloudSave, targetSlot }) => {
          try {
            return await restoreSave(cloudSave.id, targetSlot, {
              overwrite: conflictResolution === 'keep-cloud',
              saveName: cloudSave.saveName
            });
          } catch (error) {
            return {
              success: false,
              error: error as CloudError
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Collect results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              success: false,
              error: {
                code: 'batch-error',
                message: `Failed to restore ${batch[index].cloudSave.saveName}: ${result.reason}`
              } as CloudError
            });
          }
        });

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < slotAssignments.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Calculate final statistics
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: `Batch restore completed: ${successCount} successful, ${failureCount} failed`,
        error: failureCount > 0 ? {
          code: 'partial-failure',
          message: `${failureCount} saves failed to restore`
        } as CloudError : null
      });

      setLastSyncTime(new Date());

      return results;

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Batch restore failed: ${cloudError.message}`,
        error: cloudError
      });

      return [];
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [saveSystemManager, user, preferences.conflictResolution, restoreSave]);

  // Sync a specific save slot (combines backup and restore logic)
  const syncSave = useCallback(async (
    slotNumber: number,
    conflictResolution: ConflictResolution = preferences.conflictResolution
  ): Promise<CloudSaveResult> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return {
        success: false,
        error: { code: 'not-ready', message: 'Services not available' } as CloudError
      };
    }

    setSyncProgress({
      state: 'syncing',
      progress: 0,
      status: 'Analyzing sync requirements...',
      error: null,
      currentOperation: 'sync',
      startTime: new Date()
    });

    try {
      // Check for conflicts
      const conflict = await checkForConflicts(slotNumber);

      if (conflict && conflictResolution === 'manual') {
        setConflicts(prev => [...prev, conflict]);
        setSyncProgress(prev => ({
          ...prev,
          state: 'resolving',
          status: 'Manual conflict resolution required'
        }));
        return {
          success: false,
          error: { code: 'manual-resolution-required', message: 'Conflict requires manual resolution' } as CloudError
        };
      }

      // Determine sync direction based on conflict resolution
      if (conflict) {
        switch (conflictResolution) {
          case 'keep-local':
            return await backupSave(slotNumber, { overwrite: true });
          case 'keep-cloud':
            // Find the cloud save for this slot and restore it
            const cloudSaveForSlot = cloudSaves.find(save => save.slotNumber === slotNumber);
            if (cloudSaveForSlot) {
              return await restoreSave(cloudSaveForSlot.id, slotNumber, { overwrite: true });
            } else {
              return { success: false, error: { code: 'cloud-save-not-found', message: 'Cloud save not found for slot' } as CloudError };
            }
          case 'keep-newest':
            if (conflict.localTimestamp > conflict.cloudTimestamp) {
              return await backupSave(slotNumber, { overwrite: true });
            } else {
              const cloudSaveForSlot = cloudSaves.find(save => save.slotNumber === slotNumber);
              if (cloudSaveForSlot) {
                return await restoreSave(cloudSaveForSlot.id, slotNumber, { overwrite: true });
              } else {
                return { success: false, error: { code: 'cloud-save-not-found', message: 'Cloud save not found for slot' } as CloudError };
              }
            }
        }
      } else {
        // No conflict, just backup
        return await backupSave(slotNumber);
      }

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Sync failed: ${cloudError.message}`,
        error: cloudError
      });
      return { success: false, error: cloudError };
    }
  }, [saveSystemManager, user, preferences.conflictResolution, checkForConflicts, backupSave, restoreSave, cloudSaves]);

  // Sync all saves (alias for backupAllSaves)
  const syncAllSaves = useCallback(async (config: Partial<BatchSyncConfig>): Promise<CloudSaveResult[]> => {
    return await backupAllSaves(config);
  }, [backupAllSaves]);

  // Resolve save conflict with comprehensive resolution strategies
  const resolveSaveConflict = useCallback(async (
    conflict: SaveConflict,
    resolution: ConflictResolution
  ): Promise<CloudSaveResult> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return {
        success: false,
        error: { code: 'not-ready', message: 'Services not available' } as CloudError
      };
    }

    setSyncProgress({
      state: 'resolving',
      progress: 0,
      status: `Resolving conflict using ${resolution} strategy...`,
      error: null,
      currentOperation: 'conflict-resolution',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => resolveSaveConflict(conflict, resolution);

    try {
      let result: CloudSaveResult;

      switch (resolution) {
        case 'keep-local':
          setSyncProgress(prev => ({ ...prev, progress: 25, status: 'Keeping local save, backing up to cloud...' }));
          result = await backupSave(conflict.slotNumber, {
            overwrite: true,
            saveName: conflict.localSave.metadata?.name
          });
          break;

        case 'keep-cloud':
          setSyncProgress(prev => ({ ...prev, progress: 25, status: 'Keeping cloud save, restoring to local...' }));
          result = await restoreSave(conflict.cloudSave.id, conflict.slotNumber, {
            overwrite: true,
            saveName: conflict.cloudSave.saveName
          });
          break;

        case 'keep-newest':
          setSyncProgress(prev => ({ ...prev, progress: 15, status: 'Analyzing timestamps...' }));

          // Enhanced timestamp comparison with tolerance
          const timeDifference = conflict.localTimestamp.getTime() - conflict.cloudTimestamp.getTime();
          const timeTolerance = 30000; // 30 seconds tolerance for network delays

          if (Math.abs(timeDifference) <= timeTolerance) {
            // Timestamps are very close, use other criteria
            setSyncProgress(prev => ({ ...prev, progress: 35, status: 'Timestamps similar, using size comparison...' }));

            // Use file size as tiebreaker (larger = more recent content)
            const localSize = conflict.localSave.metadata?.fileSizeBytes || 0;
            const cloudSize = conflict.cloudSave.compressedSize || 0;

            if (localSize >= cloudSize) {
              setSyncProgress(prev => ({ ...prev, progress: 50, status: 'Local save is larger, keeping local...' }));
              result = await backupSave(conflict.slotNumber, {
                overwrite: true,
                saveName: conflict.localSave.metadata?.name
              });
            } else {
              setSyncProgress(prev => ({ ...prev, progress: 50, status: 'Cloud save is larger, keeping cloud...' }));
              result = await restoreSave(conflict.cloudSave.id, conflict.slotNumber, {
                overwrite: true,
                saveName: conflict.cloudSave.saveName
              });
            }
          } else if (timeDifference > 0) {
            // Local is newer
            setSyncProgress(prev => ({ ...prev, progress: 50, status: 'Local save is newer, keeping local...' }));
            result = await backupSave(conflict.slotNumber, {
              overwrite: true,
              saveName: conflict.localSave.metadata?.name
            });
          } else {
            // Cloud is newer
            setSyncProgress(prev => ({ ...prev, progress: 50, status: 'Cloud save is newer, keeping cloud...' }));
            result = await restoreSave(conflict.cloudSave.id, conflict.slotNumber, {
              overwrite: true,
              saveName: conflict.cloudSave.saveName
            });
          }
          break;

        case 'manual':
          // For manual resolution, we don't automatically resolve
          // Instead, we keep the conflict in the queue for user decision
          setSyncProgress({
            state: 'resolving',
            progress: 0,
            status: 'Manual resolution required - conflict remains in queue',
            error: null
          });

          return {
            success: false,
            error: {
              code: 'manual-resolution-required',
              message: 'Manual resolution selected - user must choose resolution strategy'
            } as CloudError
          };

        default:
          throw new Error(`Unknown conflict resolution strategy: ${resolution}`);
      }

      // Remove the resolved conflict from the conflicts list
      if (result.success) {
        setConflicts(prev => prev.filter(c =>
          c.slotNumber !== conflict.slotNumber ||
          c.cloudSave.id !== conflict.cloudSave.id
        ));

        setSyncProgress({
          state: 'idle',
          progress: 100,
          status: `Conflict resolved using ${resolution} strategy`,
          error: null
        });

        setLastSyncTime(new Date());
      } else {
        setSyncProgress({
          state: 'error',
          progress: 0,
          status: `Failed to resolve conflict: ${result.error?.message}`,
          error: result.error || null
        });
      }

      return {
        ...result,
        conflictResolution: resolution
      };

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Conflict resolution failed: ${cloudError.message}`,
        error: cloudError
      });

      return {
        success: false,
        error: cloudError,
        conflictResolution: resolution
      };
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [saveSystemManager, user, backupSave, restoreSave]);

  // Batch conflict resolution for multiple conflicts
  const resolveAllConflicts = useCallback(async (
    conflictResolution: ConflictResolution
  ): Promise<CloudSaveResult[]> => {
    if (conflicts.length === 0) {
      return [];
    }

    setSyncProgress({
      state: 'resolving',
      progress: 0,
      status: `Resolving ${conflicts.length} conflicts...`,
      error: null,
      currentOperation: 'batch-conflict-resolution',
      startTime: new Date()
    });

    setPendingOperations(prev => prev + 1);
    lastOperationRef.current = () => resolveAllConflicts(conflictResolution);

    try {
      const results: CloudSaveResult[] = [];
      const totalConflicts = conflicts.length;

      // Process conflicts sequentially to avoid overwhelming the system
      for (let i = 0; i < conflicts.length; i++) {
        const conflict = conflicts[i];
        const progress = ((i / totalConflicts) * 90) + 5; // 5-95%

        setSyncProgress(prev => ({
          ...prev,
          progress,
          status: `Resolving conflict ${i + 1}/${totalConflicts} for slot ${conflict.slotNumber}...`
        }));

        try {
          const result = await resolveSaveConflict(conflict, conflictResolution);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            error: error as CloudError,
            conflictResolution
          });
        }

        // Small delay between resolutions
        if (i < conflicts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Calculate statistics
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      setSyncProgress({
        state: 'idle',
        progress: 100,
        status: `Batch conflict resolution completed: ${successCount} resolved, ${failureCount} failed`,
        error: failureCount > 0 ? {
          code: 'partial-failure',
          message: `${failureCount} conflicts failed to resolve`
        } as CloudError : null
      });

      setLastSyncTime(new Date());
      return results;

    } catch (error) {
      const cloudError = error as CloudError;
      setSyncProgress({
        state: 'error',
        progress: 0,
        status: `Batch conflict resolution failed: ${cloudError.message}`,
        error: cloudError
      });

      return [];
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  }, [conflicts, resolveSaveConflict]);

  // Advanced conflict analysis with detailed comparison
  const analyzeConflict = useCallback(async (slotNumber: number): Promise<SaveConflict | null> => {
    if (!saveSystemManager || !user) {
      return null;
    }

    try {
      const baseConflict = await checkForConflicts(slotNumber);
      if (!baseConflict) {
        return null;
      }

      // Enhanced conflict analysis
      const enhancedConflict: SaveConflict = {
        ...baseConflict,
        conflictDetails: [...baseConflict.conflictDetails]
      };

      // Load actual game state for detailed comparison
      try {
        const localLoadResult = await saveSystemManager.loadGame({ slotNumber });
        if (localLoadResult.success && localLoadResult.data) {
          const localGameState = localLoadResult.data.gameState;

          // Add gameplay-specific conflict details
          if (localGameState.player && baseConflict.cloudSave) {
            enhancedConflict.conflictDetails.push(
              `Player level: Local ${localGameState.player.level || 'Unknown'} vs Cloud ${baseConflict.cloudSave.playerLevel || 'Unknown'}`
            );

            enhancedConflict.conflictDetails.push(
              `Current area: Local "${localGameState.currentArea || 'Unknown'}" vs Cloud "${baseConflict.cloudSave.currentArea || 'Unknown'}"`
            );

            const localPlaytime = localGameState.totalPlayTime || 0;
            const cloudPlaytime = baseConflict.cloudSave.playtime || 0;
            const playtimeDiff = Math.abs(localPlaytime - cloudPlaytime);

            if (playtimeDiff > 60000) { // More than 1 minute difference
              const diffMinutes = Math.round(playtimeDiff / 60000);
              enhancedConflict.conflictDetails.push(
                `Playtime difference: ${diffMinutes} minutes`
              );
            }
          }
        }
      } catch (error) {
        enhancedConflict.conflictDetails.push(
          'Unable to load local save for detailed comparison'
        );
      }

      // Add recommendation based on analysis
      const timeDiff = enhancedConflict.localTimestamp.getTime() - enhancedConflict.cloudTimestamp.getTime();
      const recommendation = Math.abs(timeDiff) <= 30000
        ? 'keep-newest' // Very close timestamps, let algorithm decide
        : timeDiff > 0
          ? 'keep-local' // Local is significantly newer
          : 'keep-cloud'; // Cloud is significantly newer

      enhancedConflict.conflictDetails.push(
        `Recommended resolution: ${recommendation}`
      );

      return enhancedConflict;

    } catch (error) {
      console.error('Error analyzing conflict:', error);
      return baseConflict; // Return basic conflict if analysis fails
    }
  }, [saveSystemManager, user, checkForConflicts]);

  // Automatic conflict resolution based on preferences
  const autoResolveConflicts = useCallback(async (): Promise<CloudSaveResult[]> => {
    if (preferences.conflictResolution === 'manual') {
      return []; // Don't auto-resolve if user prefers manual resolution
    }

    return await resolveAllConflicts(preferences.conflictResolution);
  }, [preferences.conflictResolution, resolveAllConflicts]);

  // Comprehensive batch sync operation
  const batchSync = useCallback(async (config: Partial<BatchSyncConfig> = {}): Promise<BatchSlotResult[]> => {
    if (!saveSystemManager || !cloudStorageRef.current || !user) {
      return [];
    }

    const {
      slotNumbers,
      conflictResolution = preferences.conflictResolution,
      maxConcurrent = 3,
      skipLargeFiles = false,
      maxFileSize = 50 * 1024 * 1024,
      syncDirection = 'auto',
      prioritySlots = [],
      skipConflicted = false,
      retryFailures = true,
      maxRetries = 3,
      progressCallback
    } = config;

    setBatchSyncActive(true);
    setBatchSyncCancelled(false);
    setPendingOperations(prev => prev + 1);

    const startTime = new Date();
    const results: BatchSlotResult[] = [];

    try {
      // Determine which slots to sync
      const slotsResult = await saveSystemManager.getAllSaveSlots();
      const localSlots = slotsResult.success ? slotsResult.data || [] : [];

      let slotsToSync = slotNumbers
        ? localSlots.filter(slot => slotNumbers.includes(slot.slotNumber))
        : localSlots.filter(slot => slot.hasData);

      // Filter out large files if requested
      if (skipLargeFiles && maxFileSize) {
        slotsToSync = slotsToSync.filter(slot =>
          !slot.metadata?.fileSizeBytes || slot.metadata.fileSizeBytes <= maxFileSize
        );
      }

      // Filter out conflicted slots if requested
      if (skipConflicted) {
        const conflictedSlots = new Set(conflicts.map(c => c.slotNumber));
        slotsToSync = slotsToSync.filter(slot => !conflictedSlots.has(slot.slotNumber));
      }

      // Sort slots by priority
      const prioritySlotsSet = new Set(prioritySlots);
      const sortedSlots = [
        ...slotsToSync.filter(slot => prioritySlotsSet.has(slot.slotNumber)),
        ...slotsToSync.filter(slot => !prioritySlotsSet.has(slot.slotNumber))
      ];

      if (sortedSlots.length === 0) {
        setBatchSyncProgress(null);
        setBatchSyncActive(false);
        return [];
      }

      // Initialize progress tracking
      const progressState: BatchSyncProgress = {
        totalSlots: sortedSlots.length,
        completedSlots: 0,
        currentSlot: null,
        currentOperation: 'Preparing batch sync...',
        overallProgress: 0,
        slotsInProgress: [],
        successfulSlots: [],
        failedSlots: [],
        skippedSlots: [],
        estimatedTimeRemaining: 0,
        averageTimePerSlot: 0,
        startTime,
        errors: []
      };

      setBatchSyncProgress(progressState);
      progressCallback?.(progressState);

      // Process slots in batches with concurrency control
      const batchSize = maxConcurrent;
      const slotTimes: number[] = [];

      for (let i = 0; i < sortedSlots.length; i += batchSize) {
        if (batchSyncCancelled) break;

        const batch = sortedSlots.slice(i, i + batchSize);
        const batchStartTime = Date.now();

        // Update progress
        const currentProgress = Math.floor((i / sortedSlots.length) * 100);
        const avgTime = slotTimes.length > 0 ? slotTimes.reduce((a, b) => a + b, 0) / slotTimes.length : 0;
        const remainingSlots = sortedSlots.length - i;
        const estimatedTime = avgTime * remainingSlots;

        setBatchSyncProgress(prev => prev ? {
          ...prev,
          overallProgress: currentProgress,
          currentOperation: `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sortedSlots.length / batchSize)}`,
          estimatedTimeRemaining: estimatedTime,
          averageTimePerSlot: avgTime,
          slotsInProgress: batch.map(slot => slot.slotNumber)
        } : null);

        progressCallback?.(progressState);

        // Process batch concurrently
        const batchPromises = batch.map(async (slot) => {
          const slotStartTime = Date.now();
          let retryCount = 0;

          while (retryCount <= (retryFailures ? maxRetries : 0)) {
            if (batchSyncCancelled) {
              return {
                slotNumber: slot.slotNumber,
                operation: 'skipped' as const,
                success: false,
                duration: Date.now() - slotStartTime
              };
            }

            try {
              setBatchSyncProgress(prev => prev ? {
                ...prev,
                currentSlot: slot.slotNumber,
                currentOperation: `Syncing slot ${slot.slotNumber}...`
              } : null);

              let result: CloudSaveResult;

              // Determine sync operation based on direction
              switch (syncDirection) {
                case 'backup':
                  result = await backupSave(slot.slotNumber);
                  break;
                case 'restore':
                  const cloudSave = cloudSaves.find(cs => cs.slotNumber === slot.slotNumber);
                  if (cloudSave) {
                    result = await restoreSave(cloudSave.id, slot.slotNumber);
                  } else {
                    result = { success: false, error: { code: 'no-cloud-save', message: 'No cloud save found' } as CloudError };
                  }
                  break;
                case 'auto':
                default:
                  result = await syncSave(slot.slotNumber, conflictResolution);
                  break;
              }

              const duration = Date.now() - slotStartTime;
              slotTimes.push(duration);

              const slotResult: BatchSlotResult = {
                slotNumber: slot.slotNumber,
                operation: syncDirection === 'backup' ? 'backup' : syncDirection === 'restore' ? 'restore' : 'sync',
                success: result.success,
                duration,
                dataSize: slot.metadata?.fileSizeBytes,
                error: result.error,
                conflictResolution: result.conflictResolution,
                retryCount
              };

              // Update progress
              setBatchSyncProgress(prev => prev ? {
                ...prev,
                completedSlots: prev.completedSlots + 1,
                successfulSlots: result.success ? [...prev.successfulSlots, slot.slotNumber] : prev.successfulSlots,
                failedSlots: result.success ? prev.failedSlots : [...prev.failedSlots, slot.slotNumber],
                slotsInProgress: prev.slotsInProgress.filter(s => s !== slot.slotNumber),
                errors: result.error ? [...prev.errors, { slotNumber: slot.slotNumber, error: result.error }] : prev.errors
              } : null);

              return slotResult;

            } catch (error) {
              retryCount++;
              if (retryCount > maxRetries || !retryFailures) {
                const duration = Date.now() - slotStartTime;
                const slotResult: BatchSlotResult = {
                  slotNumber: slot.slotNumber,
                  operation: 'failed',
                  success: false,
                  duration,
                  error: error as CloudError,
                  retryCount
                };

                setBatchSyncProgress(prev => prev ? {
                  ...prev,
                  completedSlots: prev.completedSlots + 1,
                  failedSlots: [...prev.failedSlots, slot.slotNumber],
                  slotsInProgress: prev.slotsInProgress.filter(s => s !== slot.slotNumber),
                  errors: [...prev.errors, { slotNumber: slot.slotNumber, error: error as CloudError }]
                } : null);

                return slotResult;
              }

              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 10000)));
            }
          }

          // Should never reach here, but return a failed result as fallback
          return {
            slotNumber: slot.slotNumber,
            operation: 'failed' as const,
            success: false,
            duration: Date.now() - slotStartTime,
            retryCount
          };
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Collect results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              slotNumber: batch[index].slotNumber,
              operation: 'failed',
              success: false,
              duration: 0,
              error: { code: 'promise-rejected', message: result.reason } as CloudError
            });
          }
        });

        // Small delay between batches
        if (i + batchSize < sortedSlots.length && !batchSyncCancelled) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Final progress update
      const successCount = results.filter(r => r.success).length;
      const totalDuration = Date.now() - startTime.getTime();

      setBatchSyncProgress(prev => prev ? {
        ...prev,
        overallProgress: 100,
        currentOperation: `Completed: ${successCount}/${results.length} successful`,
        estimatedTimeRemaining: 0,
        currentSlot: null,
        slotsInProgress: []
      } : null);

      // Add batch sync entry to history
      addSyncHistoryEntry({
        timestamp: new Date(),
        operation: 'sync',
        slotNumber: -1, // Special value for batch operations
        success: successCount === results.length,
        duration: totalDuration,
        dataSize: results.reduce((sum, r) => sum + (r.dataSize || 0), 0)
      });

      await refreshCloudSaves();
      setLastSyncTime(new Date());

      return results;

    } catch (error) {
      console.error('Batch sync failed:', error);
      setBatchSyncProgress(prev => prev ? {
        ...prev,
        currentOperation: 'Batch sync failed',
        errors: [...prev.errors, { slotNumber: -1, error: error as CloudError }]
      } : null);

      return results;
    } finally {
      setBatchSyncActive(false);
      setPendingOperations(prev => prev - 1);

      // Clear progress after a delay
      setTimeout(() => {
        setBatchSyncProgress(null);
      }, 5000);
    }
  }, [
    saveSystemManager, user, preferences.conflictResolution, conflicts,
    batchSyncCancelled, backupSave, restoreSave, syncSave, cloudSaves,
    refreshCloudSaves, addSyncHistoryEntry
  ]);

  // Smart sync - automatically determines best sync strategy
  const smartSync = useCallback(async (slotNumbers?: number[]): Promise<BatchSlotResult[]> => {
    if (!saveSystemManager || !cloudStorageRef.current) {
      return [];
    }

    try {
      // Analyze all slots to determine optimal sync strategy
      const slotsResult = await saveSystemManager.getAllSaveSlots();
      const localSlots = slotsResult.success ? slotsResult.data || [] : [];

      const slotsToAnalyze = slotNumbers
        ? localSlots.filter(slot => slotNumbers.includes(slot.slotNumber))
        : localSlots.filter(slot => slot.hasData);

      // Categorize slots by sync needs
      const needsBackup: number[] = [];
      const needsRestore: number[] = [];
      const needsConflictResolution: number[] = [];
      const upToDate: number[] = [];

      for (const slot of slotsToAnalyze) {
        const cloudSave = cloudSaves.find(cs => cs.slotNumber === slot.slotNumber);
        const hasConflict = conflicts.some(c => c.slotNumber === slot.slotNumber);

        if (hasConflict) {
          needsConflictResolution.push(slot.slotNumber);
        } else if (!cloudSave) {
          needsBackup.push(slot.slotNumber);
        } else if (slot.metadata) {
          // Compare timestamps to determine if sync is needed
          const localTime = new Date(slot.metadata.lastModified).getTime();
          const cloudTime = new Date(cloudSave.updatedAt).getTime();
          const timeDiff = Math.abs(localTime - cloudTime);

          if (timeDiff > 60000) { // More than 1 minute difference
            if (localTime > cloudTime) {
              needsBackup.push(slot.slotNumber);
            } else {
              needsRestore.push(slot.slotNumber);
            }
          } else {
            upToDate.push(slot.slotNumber);
          }
        }
      }

      // Create optimized batch config
      const batchConfig: Partial<BatchSyncConfig> = {
        slotNumbers: [...needsBackup, ...needsRestore, ...needsConflictResolution],
        conflictResolution: 'keep-newest',
        maxConcurrent: 2, // Conservative for smart sync
        syncDirection: 'auto',
        prioritySlots: needsConflictResolution, // Resolve conflicts first
        retryFailures: true,
        maxRetries: 2
      };

      return await batchSync(batchConfig);

    } catch (error) {
      console.error('Smart sync analysis failed:', error);
      return await batchSync({ slotNumbers });
    }
  }, [saveSystemManager, cloudStorageRef, cloudSaves, conflicts, batchSync]);

  // Priority sync - syncs priority slots first, then others
  const prioritySync = useCallback(async (
    prioritySlots: number[],
    otherSlots?: number[]
  ): Promise<BatchSlotResult[]> => {
    const allSlots = otherSlots ? [...prioritySlots, ...otherSlots] : prioritySlots;

    return await batchSync({
      slotNumbers: allSlots,
      prioritySlots,
      maxConcurrent: 1, // Sequential for priority slots
      conflictResolution: 'manual', // Be cautious with priority saves
      retryFailures: true,
      maxRetries: 3
    });
  }, [batchSync]);

  // Cancel batch sync operation
  const cancelBatchSync = useCallback(() => {
    setBatchSyncCancelled(true);
    setBatchSyncProgress(prev => prev ? {
      ...prev,
      currentOperation: 'Cancelling batch sync...'
    } : null);
  }, []);

  // User activity tracking for idle detection
  const updateUserActivity = useCallback(() => {
    userActivityRef.current = new Date();
    setUserIdleTime(0);
    setIsUserIdle(false);
  }, []);

  // Check if sync should be skipped based on conditions
  const shouldSkipAutoSync = useCallback((trigger: ManualSyncTrigger): boolean => {
    const config = preferences.autoSyncConfig;

    // Check if auto-sync is enabled for this trigger
    if (!config.enabled || !config.triggers.includes(trigger)) {
      return true;
    }

    // Check if we should only sync when idle
    if (config.onlyWhenIdle && !isUserIdle) {
      return true;
    }

    // Check network conditions
    if (config.skipOnSlowNetwork && detectNetworkCondition() === 'slow') {
      return true;
    }

    // Check battery status (if available)
    if (config.skipOnBattery && 'getBattery' in navigator) {
      // Battery API check would go here
      // For now, we'll skip this check as it's not widely supported
    }

    // Check if we're already syncing
    if (autoSyncActive || batchSyncActive || pendingOperations > config.maxConcurrentAutoSyncs) {
      return true;
    }

    return false;
  }, [preferences.autoSyncConfig, isUserIdle, autoSyncActive, batchSyncActive, pendingOperations]);

  // Manual sync trigger function
  const triggerManualSync = useCallback(async (
    trigger: ManualSyncTrigger,
    slotNumbers?: number[]
  ): Promise<void> => {
    if (!cloudStorageAvailable) {
      return;
    }

    // Skip if conditions aren't met for auto-triggers
    if (trigger !== 'user-initiated' && shouldSkipAutoSync(trigger)) {
      return;
    }

    setAutoSyncActive(true);
    setLastAutoSyncTrigger(trigger);

    try {
      // Add trigger tracking to history
      addSyncHistoryEntry({
        timestamp: new Date(),
        operation: 'sync',
        slotNumber: -2, // Special value for trigger operations
        success: true,
        duration: 0,
        dataSize: 0
      });

      // Determine sync strategy based on trigger
      let syncResults: BatchSlotResult[] = [];

      switch (trigger) {
        case 'user-initiated':
          // Full smart sync for user-initiated actions
          syncResults = await smartSync(slotNumbers);
          break;

        case 'save-operation':
        case 'load-operation':
          // Quick sync for specific slots after save/load
          if (slotNumbers && slotNumbers.length > 0) {
            syncResults = await batchSync({
              slotNumbers,
              maxConcurrent: 1,
              conflictResolution: 'keep-local',
              syncDirection: 'backup'
            });
          }
          break;

        case 'game-milestone':
          // Comprehensive sync for important game events
          syncResults = await batchSync({
            slotNumbers,
            maxConcurrent: 2,
            conflictResolution: 'keep-newest',
            syncDirection: 'auto',
            retryFailures: true
          });
          break;

        case 'startup':
        case 'focus-regained':
        case 'network-reconnect':
          // Conservative sync for startup/focus events
          syncResults = await smartSync(slotNumbers);
          break;

        case 'periodic-timer':
          // Background periodic sync
          syncResults = await batchSync({
            slotNumbers,
            maxConcurrent: 1,
            conflictResolution: preferences.conflictResolution,
            syncDirection: 'auto',
            skipConflicted: true, // Skip conflicted saves in background
            skipLargeFiles: true
          });
          break;

        case 'before-close':
          // Quick backup before closing
          syncResults = await batchSync({
            slotNumbers,
            maxConcurrent: 3,
            conflictResolution: 'keep-local',
            syncDirection: 'backup',
            skipLargeFiles: true
          });
          break;

        case 'conflict-detected':
          // Focus on resolving conflicts
          if (conflicts.length > 0) {
            const conflictSlots = conflicts.map(c => c.slotNumber);
            syncResults = await batchSync({
              slotNumbers: slotNumbers ? slotNumbers.filter(s => conflictSlots.includes(s)) : conflictSlots,
              maxConcurrent: 1,
              conflictResolution: preferences.conflictResolution,
              syncDirection: 'auto'
            });
          }
          break;

        case 'error-recovery':
          // Retry failed operations
          syncResults = await batchSync({
            slotNumbers,
            maxConcurrent: 1,
            conflictResolution: preferences.conflictResolution,
            syncDirection: 'auto',
            retryFailures: true,
            maxRetries: preferences.autoSyncConfig.maxRetryAttempts
          });
          break;

        default:
          // Default to smart sync
          syncResults = await smartSync(slotNumbers);
          break;
      }

      // Show notifications for manual triggers if enabled
      if (preferences.manualSyncNotifications && trigger === 'user-initiated') {
        const successCount = syncResults.filter(r => r.success).length;
        const totalCount = syncResults.length;

        if (totalCount > 0) {
          console.log(`Sync completed: ${successCount}/${totalCount} slots synced successfully`);
        }
      }

    } catch (error) {
      console.error(`Manual sync trigger ${trigger} failed:`, error);

      // Add failed trigger to history
      addSyncHistoryEntry({
        timestamp: new Date(),
        operation: 'sync',
        slotNumber: -2,
        success: false,
        duration: 0,
        dataSize: 0,
        errorCode: (error as CloudError).code,
        errorMessage: (error as CloudError).message
      });
    } finally {
      setAutoSyncActive(false);
    }
  }, [
    cloudStorageAvailable, shouldSkipAutoSync, addSyncHistoryEntry, smartSync,
    batchSync, conflicts, preferences.conflictResolution, preferences.manualSyncNotifications,
    preferences.autoSyncConfig.maxRetryAttempts
  ]);

  // Full sync - comprehensive sync of all saves
  const triggerFullSync = useCallback(async (): Promise<void> => {
    await triggerManualSync('user-initiated');
  }, [triggerManualSync]);

  // Quick sync - fast sync of recently modified saves
  const triggerQuickSync = useCallback(async (): Promise<void> => {
    if (!saveSystemManager) return;

    try {
      // Get recently modified saves (within last hour)
      const slotsResult = await saveSystemManager.getAllSaveSlots();
      if (slotsResult.success && slotsResult.data) {
        const recentThreshold = Date.now() - (60 * 60 * 1000); // 1 hour ago
        const recentSlots = slotsResult.data
          .filter(slot =>
            slot.hasData &&
            slot.metadata?.lastModified &&
            new Date(slot.metadata.lastModified).getTime() > recentThreshold
          )
          .map(slot => slot.slotNumber);

        if (recentSlots.length > 0) {
          await triggerManualSync('user-initiated', recentSlots);
        } else {
          // If no recent saves, do a minimal smart sync
          await triggerManualSync('user-initiated');
        }
      }
    } catch (error) {
      console.error('Quick sync failed:', error);
      // Fallback to full sync
      await triggerFullSync();
    }
  }, [saveSystemManager, triggerManualSync, triggerFullSync]);

  // Schedule auto-sync with delay
  const scheduleAutoSync = useCallback((delayMs: number = preferences.syncFrequency * 60 * 1000) => {
    // Clear existing timer
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    // Schedule new auto-sync
    autoSyncTimerRef.current = setTimeout(() => {
      triggerManualSync('periodic-timer');

      // Reschedule next auto-sync
      if (preferences.autoSync && preferences.autoSyncConfig.enabled) {
        scheduleAutoSync();
      }
    }, delayMs);
  }, [preferences.syncFrequency, preferences.autoSync, preferences.autoSyncConfig.enabled, triggerManualSync]);

  // Cancel auto-sync
  const cancelAutoSync = useCallback(() => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
  }, []);

  // User idle detection
  useEffect(() => {
    const config = preferences.autoSyncConfig;

    if (!config.onlyWhenIdle) return;

    const updateIdleTime = () => {
      const now = Date.now();
      const lastActivity = userActivityRef.current.getTime();
      const idleTime = now - lastActivity;
      const idleSeconds = Math.floor(idleTime / 1000);

      setUserIdleTime(idleSeconds);
      setIsUserIdle(idleSeconds >= config.idleThreshold);
    };

    // Update idle time every second
    const interval = setInterval(updateIdleTime, 1000);

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      document.addEventListener(event, updateUserActivity, true);
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateUserActivity, true);
      });
    };
  }, [preferences.autoSyncConfig, updateUserActivity]);

  // Auto-sync scheduling based on preferences
  useEffect(() => {
    if (preferences.autoSync && preferences.autoSyncConfig.enabled && cloudStorageAvailable) {
      scheduleAutoSync();
    } else {
      cancelAutoSync();
    }

    return () => {
      cancelAutoSync();
    };
  }, [preferences.autoSync, preferences.autoSyncConfig.enabled, cloudStorageAvailable, scheduleAutoSync, cancelAutoSync]);

  // Enhanced startup sync
  useEffect(() => {
    if (!cloudStorageAvailable || !preferences.syncOnAppStart) {
      return;
    }

    const performStartupSync = async () => {
      try {
        // Wait a bit for app to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        await triggerManualSync('startup');
      } catch (error) {
        console.error('Startup sync failed:', error);
      }
    };

    performStartupSync();
  }, [cloudStorageAvailable, preferences.syncOnAppStart, triggerManualSync]);

  // Enhanced app close sync
  useEffect(() => {
    if (!preferences.syncOnAppClose) {
      return;
    }

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (cloudStorageAvailable && pendingOperations === 0) {
        // Trigger quick sync before close
        try {
          await triggerManualSync('before-close');
        } catch (error) {
          console.error('Before-close sync failed:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && cloudStorageAvailable) {
        // App is being hidden/minimized
        triggerManualSync('before-close').catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preferences.syncOnAppClose, cloudStorageAvailable, pendingOperations, triggerManualSync]);

  // Network reconnect sync
  useEffect(() => {
    if (!preferences.autoSyncConfig.triggers.includes('network-reconnect')) {
      return;
    }

    const handleOnline = () => {
      if (cloudStorageAvailable) {
        // Delay a bit to let network stabilize
        setTimeout(() => {
          triggerManualSync('network-reconnect');
        }, 3000);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [preferences.autoSyncConfig.triggers, cloudStorageAvailable, triggerManualSync]);

  // Focus regained sync
  useEffect(() => {
    if (!preferences.autoSyncConfig.triggers.includes('focus-regained')) {
      return;
    }

    const handleFocus = () => {
      if (cloudStorageAvailable) {
        // Only sync if it's been a while since last activity
        const timeSinceActivity = Date.now() - userActivityRef.current.getTime();
        if (timeSinceActivity > 30000) { // 30 seconds
          triggerManualSync('focus-regained');
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [preferences.autoSyncConfig.triggers, cloudStorageAvailable, triggerManualSync]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cancelAutoSync();
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [cancelAutoSync]);

  // Get cloud save metadata
  const getCloudSaveMetadata = useCallback(async (cloudSaveId: string): Promise<CloudSaveMetadata | null> => {
    if (!cloudStorageRef.current || !user) {
      return null;
    }

    try {
      return await cloudStorageRef.current.getSaveMetadata(user.uid, cloudSaveId);
    } catch (error) {
      console.error('Failed to get cloud save metadata:', error);
      return null;
    }
  }, [user]);

  // Update save metadata
  const updateSaveMetadata = useCallback(async (
    cloudSaveId: string,
    updates: Partial<CloudSaveMetadata>
  ): Promise<boolean> => {
    if (!cloudStorageRef.current || !user) {
      return false;
    }

    try {
      await cloudStorageRef.current.updateSaveMetadata(user.uid, cloudSaveId, updates);
      await refreshCloudSaves();
      return true;
    } catch (error) {
      console.error('Failed to update save metadata:', error);
      return false;
    }
  }, [user, refreshCloudSaves]);

  // Estimate sync time
  const estimateSyncTime = useCallback(async (slotNumbers: number[]): Promise<number> => {
    // Implementation would estimate based on file sizes and network speed
    return 0; // Placeholder
  }, []);

  // Clear sync history
  const clearSyncHistory = useCallback(() => {
    setLastSyncTime(null);
    setConflicts([]);
    setSyncProgress({
      state: 'idle',
      progress: 0,
      status: 'Ready',
      error: null
    });
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<CloudSavePreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    // Persist preferences to local storage
    localStorage.setItem('cloudSavePreferences', JSON.stringify(newPreferences));
  }, [preferences]);

  // Load preferences from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cloudSavePreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.error('Failed to parse cloud save preferences:', error);
      }
    }
  }, []);

  // Background conflict monitoring
  useEffect(() => {
    if (!cloudStorageAvailable || !preferences.autoSync) {
      return;
    }

    const monitorConflicts = async () => {
      try {
        // Check for conflicts in all local saves
        if (saveSystemManager) {
          const slotsResult = await saveSystemManager.getAllSaveSlots();
          if (slotsResult.success && slotsResult.data) {
            const localSlots = slotsResult.data.filter(slot => slot.hasData);

            for (const slot of localSlots) {
              const conflict = await checkForConflicts(slot.slotNumber);
              if (conflict) {
                // Add conflict to the list if not already present
                setConflicts(prev => {
                  const exists = prev.some(c =>
                    c.slotNumber === conflict.slotNumber &&
                    c.cloudSave.id === conflict.cloudSave.id
                  );
                  return exists ? prev : [...prev, conflict];
                });

                // Auto-resolve if enabled
                if (preferences.conflictResolution !== 'manual') {
                  setTimeout(() => {
                    autoResolveConflicts();
                  }, 1000); // Small delay to allow user to see the conflict
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring conflicts:', error);
      }
    };

    // Monitor conflicts periodically
    const interval = setInterval(monitorConflicts, 5 * 60 * 1000); // Every 5 minutes

    // Also monitor on app focus
    const handleFocus = () => {
      monitorConflicts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cloudStorageAvailable, preferences.autoSync, preferences.conflictResolution, saveSystemManager, checkForConflicts, autoResolveConflicts]);

  // Auto-sync on app startup/close based on preferences
  useEffect(() => {
    if (!cloudStorageAvailable || !preferences.syncOnAppStart) {
      return;
    }

    // Auto-sync on startup
    const performStartupSync = async () => {
      try {
        await refreshCloudSaves();

        // Check for conflicts and auto-resolve if enabled
        if (preferences.conflictResolution !== 'manual') {
          setTimeout(autoResolveConflicts, 2000);
        }
      } catch (error) {
        console.error('Error during startup sync:', error);
      }
    };

    performStartupSync();

    // Auto-sync on app close
    const handleBeforeUnload = () => {
      if (preferences.syncOnAppClose && preferences.conflictResolution !== 'manual') {
        // Quick sync attempt (fire and forget)
        autoResolveConflicts().catch(console.error);
      }
    };

    if (preferences.syncOnAppClose) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cloudStorageAvailable, preferences.syncOnAppStart, preferences.syncOnAppClose, preferences.conflictResolution, refreshCloudSaves, autoResolveConflicts]);

  // Clear error
  const clearError = useCallback(() => {
    setSyncProgress(prev => ({ ...prev, error: null }));
  }, []);

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current) {
      await lastOperationRef.current();
    }
  }, []);

  // Metadata tracking utility functions
  const getSyncHistory = useCallback((slotNumber?: number, limit?: number): SyncHistoryEntry[] => {
    let history = syncMetadata.syncHistory;

    if (slotNumber !== undefined) {
      history = history.filter(entry => entry.slotNumber === slotNumber);
    }

    if (limit && limit > 0) {
      history = history.slice(0, limit);
    }

    return history;
  }, [syncMetadata.syncHistory]);

  const clearSyncHistory = useCallback(() => {
    setSyncMetadata(prev => ({
      ...prev,
      syncHistory: [],
      syncCount: 0,
      failureCount: 0,
      lastSyncDuration: 0,
      averageSyncDuration: 0
    }));
  }, []);

  const exportSyncMetadata = useCallback((): string => {
    const exportData = {
      syncMetadata,
      deviceInfo,
      exportTimestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [syncMetadata, deviceInfo]);

  const importSyncMetadata = useCallback((data: string): boolean => {
    try {
      const importData = JSON.parse(data);

      if (importData.syncMetadata && importData.version === '1.0.0') {
        setSyncMetadata(prev => ({
          ...prev,
          ...importData.syncMetadata,
          // Preserve current session data
          lastSyncAttempt: prev.lastSyncAttempt
        }));

        if (importData.deviceInfo) {
          // Add imported device to device history
          setSyncMetadata(prev => ({
            ...prev,
            deviceHistory: [
              ...prev.deviceHistory.filter(d => d.timestamp !== importData.deviceInfo.timestamp),
              importData.deviceInfo
            ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10) // Keep last 10 devices
          }));
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to import sync metadata:', error);
      return false;
    }
  }, []);

  const getVersionInfo = useCallback(async (slotNumber: number): Promise<{ local: string; cloud: string; conflicts: number }> => {
    try {
      // Get local version
      let localVersion = syncMetadata.localSaveVersion;
      if (saveSystemManager) {
        const localSaveResult = await saveSystemManager.getSaveInfo(slotNumber);
        if (localSaveResult.success && localSaveResult.data?.metadata) {
          localVersion = localSaveResult.data.metadata.saveVersion || localVersion;
        }
      }

      // Get cloud version
      let cloudVersion = syncMetadata.cloudSaveVersion;
      const cloudSave = cloudSaves.find(save => save.slotNumber === slotNumber);
      if (cloudSave) {
        cloudVersion = cloudSave.gameVersion || cloudVersion;
      }

      // Count version-related conflicts in history
      const versionConflicts = syncMetadata.syncHistory.filter(entry =>
        entry.slotNumber === slotNumber &&
        !entry.success &&
        (entry.errorCode?.includes('version') || entry.errorMessage?.includes('version'))
      ).length;

      return {
        local: localVersion,
        cloud: cloudVersion,
        conflicts: versionConflicts
      };
    } catch (error) {
      console.error('Failed to get version info:', error);
      return {
        local: syncMetadata.localSaveVersion,
        cloud: syncMetadata.cloudSaveVersion,
        conflicts: syncMetadata.versionConflicts
      };
    }
  }, [syncMetadata, saveSystemManager, cloudSaves]);

  // Load and save metadata from localStorage
  useEffect(() => {
    const savedMetadata = localStorage.getItem('cloudSaveSyncMetadata');
    if (savedMetadata && preferences.trackingEnabled) {
      try {
        const parsed = JSON.parse(savedMetadata);
        setSyncMetadata(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load sync metadata:', error);
      }
    }
  }, [preferences.trackingEnabled]);

  // Save metadata to localStorage when it changes
  useEffect(() => {
    if (preferences.trackingEnabled) {
      localStorage.setItem('cloudSaveSyncMetadata', JSON.stringify(syncMetadata));
    }
  }, [syncMetadata, preferences.trackingEnabled]);

  // Update device info periodically
  useEffect(() => {
    const updateDeviceInfo = () => {
      const newDeviceInfo = getCurrentDeviceInfo();
      setDeviceInfo(newDeviceInfo);

      // Add to device history if significantly different
      setSyncMetadata(prev => {
        const lastDevice = prev.deviceHistory[0];
        const isDifferent = !lastDevice ||
          lastDevice.browserVersion !== newDeviceInfo.browserVersion ||
          lastDevice.osVersion !== newDeviceInfo.osVersion ||
          lastDevice.screenResolution !== newDeviceInfo.screenResolution;

        if (isDifferent) {
          return {
            ...prev,
            deviceHistory: [newDeviceInfo, ...prev.deviceHistory].slice(0, 10)
          };
        }

        return prev;
      });
    };

    // Update on focus and periodically
    const interval = setInterval(updateDeviceInfo, 10 * 60 * 1000); // Every 10 minutes
    window.addEventListener('focus', updateDeviceInfo);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateDeviceInfo);
    };
  }, []);

  return {
    // Authentication and connection state
    isAuthenticated,
    isOnline,
    cloudStorageAvailable,

    // Cloud save data
    cloudSaves,
    isLoading,
    lastSyncTime,

    // Metadata tracking
    syncMetadata,
    deviceInfo,

    // Sync status and progress
    syncProgress,
    conflicts,
    pendingOperations,

    // Batch sync status
    batchSyncActive,
    batchSyncProgress,

    // Storage usage
    storageUsed,
    storageLimit,
    storagePercentage,

    // Core cloud operations
    uploadSave,
    downloadSave,
    deleteSave,

    // Backup operations
    backupSave,
    backupAllSaves,

    // Restore operations
    restoreSave,
    restoreAllSaves,

    // Sync operations
    syncSave,
    syncAllSaves,
    resolveSaveConflict,

    // Batch sync operations
    batchSync,
    smartSync,
    prioritySync,
    cancelBatchSync,

    // Manual sync triggers
    triggerManualSync,
    triggerFullSync,
    triggerQuickSync,
    scheduleAutoSync,
    cancelAutoSync,

    // Metadata operations
    refreshCloudSaves,
    getCloudSaveMetadata,
    updateSaveMetadata,

    // Conflict resolution functions
    resolveAllConflicts,
    analyzeConflict,
    autoResolveConflicts,

    // Metadata tracking functions
    getCurrentDeviceInfo,
    getSyncHistory,
    clearSyncHistory,
    exportSyncMetadata,
    importSyncMetadata,
    getVersionInfo,

    // Utility functions
    checkForConflicts,
    estimateSyncTime,

    // Preferences
    preferences,
    updatePreferences,

    // Error handling
    clearError,
    retryLastOperation
  };
}

export default useCloudSave;