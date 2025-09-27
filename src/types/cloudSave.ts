/**
 * Cloud Save Types
 * Type definitions for cloud save functionality
 */

import { ReactGameState } from './game';
import { User } from 'firebase/auth';
import type { CloudSaveListItem } from '../services/cloudStorage';

// Re-export cloud storage types for convenience
export type {
  CloudSaveMetadata,
  CloudSaveData,
  CloudSaveListItem,
  CloudStorageConfig,
  CloudStorageResult
} from '../services/cloudStorage';

// Additional cloud save types
export interface CloudSyncStatus {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncInProgress: boolean;
  pendingOperations: number;
  lastSyncError: string | null;
  totalUploads: number;
  totalDownloads: number;
  conflictCount: number;
}

export interface CloudSaveConflict {
  slotNumber: number;
  saveName: string;
  localVersion: {
    lastModified: Date;
    checksum: string;
    playtime: number;
    playerLevel: number;
  };
  cloudVersion: {
    lastModified: Date;
    checksum: string;
    playtime: number;
    playerLevel: number;
  };
  conflictType: 'timestamp' | 'checksum' | 'both';
  resolution?: 'local' | 'cloud' | 'manual';
}

export interface CloudAuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  lastLoginTime: Date | null;
  loginMethod: 'email' | 'anonymous' | null;
}

export interface CloudStorageQuota {
  used: number;
  total: number;
  percentage: number;
  remaining: number;
  savesCount: number;
  maxSaves: number;
  averageSaveSize: number;
}

export interface CloudOperationProgress {
  operationType: 'upload' | 'download' | 'delete' | 'sync';
  slotNumber: number;
  saveName: string;
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  bytesTransferred?: number;
  totalBytes?: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface CloudSavePreferences {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncOnGameStart: boolean;
  syncOnGameClose: boolean;
  conflictResolution: 'ask' | 'local_wins' | 'cloud_wins' | 'newer_wins';
  compressUploads: boolean;
  includeScreenshots: boolean;
  maxCloudSaves: number;
  deleteOldSaves: boolean;
  oldSaveThreshold: number; // days
}

export interface CloudBackupOptions {
  includeScreenshots: boolean;
  compressData: boolean;
  verifyIntegrity: boolean;
  overwriteExisting: boolean;
  createBackup: boolean;
  notifyOnCompletion: boolean;
}

export interface CloudRestoreOptions {
  slotNumber: number;
  overwriteLocal: boolean;
  createLocalBackup: boolean;
  verifyIntegrity: boolean;
  restoreScreenshot: boolean;
}

export interface CloudSyncReport {
  syncId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  success: boolean;
  operations: {
    uploaded: CloudSaveListItem[];
    downloaded: CloudSaveListItem[];
    conflicts: CloudSaveConflict[];
    errors: string[];
  };
  statistics: {
    totalSaves: number;
    totalSize: number;
    bandwidth: number; // bytes
    operationCount: number;
  };
}

// Event types for cloud save operations
export type CloudSaveEventType =
  | 'auth_state_changed'
  | 'sync_started'
  | 'sync_progress'
  | 'sync_completed'
  | 'sync_error'
  | 'upload_started'
  | 'upload_progress'
  | 'upload_completed'
  | 'upload_error'
  | 'download_started'
  | 'download_progress'
  | 'download_completed'
  | 'download_error'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'quota_warning'
  | 'quota_exceeded';

export interface CloudSaveEvent {
  type: CloudSaveEventType;
  timestamp: Date;
  data?: any;
  error?: string;
}

// Hook result types
export interface UseCloudSaveResult {
  // Authentication state
  authState: CloudAuthState;

  // Cloud saves
  cloudSaves: CloudSaveListItem[];
  isLoadingCloudSaves: boolean;

  // Sync status
  syncStatus: CloudSyncStatus;
  conflicts: CloudSaveConflict[];

  // Storage info
  storageQuota: CloudStorageQuota;

  // Operations
  saveToCloud: (slotNumber: number, saveName: string, gameState: ReactGameState, screenshot?: string) => Promise<boolean>;
  loadFromCloud: (slotNumber: number) => Promise<ReactGameState | null>;
  deleteFromCloud: (slotNumber: number) => Promise<boolean>;
  syncWithCloud: () => Promise<boolean>;

  // Conflict resolution
  resolveConflict: (conflict: CloudSaveConflict, resolution: 'local' | 'cloud') => Promise<boolean>;
  resolveAllConflicts: (resolution: 'local' | 'cloud' | 'ask') => Promise<boolean>;

  // Utilities
  refreshCloudSaves: () => Promise<void>;
  getStorageStats: () => Promise<void>;
  clearCloudData: () => Promise<boolean>;
}

export interface UseCloudAuthResult {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth operations
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInAnonymously: () => Promise<boolean>;
  signOut: () => Promise<boolean>;

  // User management
  updateProfile: (displayName?: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;

  // Utilities
  isEmailVerified: () => boolean;
  sendEmailVerification: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}