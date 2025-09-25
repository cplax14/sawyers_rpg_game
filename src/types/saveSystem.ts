/**
 * Comprehensive Save System Types
 * Enhanced save system with metadata, versioning, validation, and cloud sync support
 */

import { ReactGameState, ReactPlayer } from './game';

export interface SaveMetadata {
  /** Unique save identifier */
  id: string;
  /** Save slot number (0-9) */
  slotNumber: number;
  /** User-defined save name */
  name: string;
  /** When the save was created */
  createdAt: Date;
  /** When the save was last modified */
  lastModified: Date;
  /** When the save was last accessed */
  lastAccessed: Date;
  /** Game version when save was created */
  gameVersion: string;
  /** Save system version for compatibility */
  saveVersion: string;
  /** Total play time in milliseconds */
  totalPlayTime: number;
  /** Save file size in bytes */
  fileSizeBytes: number;
  /** Screenshot thumbnail (base64 or URL) */
  thumbnail?: string;
  /** Save tags/categories */
  tags: string[];
  /** User notes about this save */
  notes?: string;
  /** Difficulty level at time of save */
  difficulty?: string;
  /** Whether save is marked as favorite */
  isFavorite: boolean;
  /** Whether save is corrupted */
  isCorrupted: boolean;
}

export interface SavePlayerSummary {
  /** Player name */
  name: string;
  /** Player class */
  class: string;
  /** Player level */
  level: number;
  /** Current HP */
  hp: number;
  /** Max HP */
  maxHp: number;
  /** Player experience */
  experience: number;
  /** Player gold */
  gold: number;
  /** Current area name */
  currentAreaName: string;
  /** Quest progress summary */
  questsCompleted: number;
  /** Monsters captured count */
  monstersCaptured: number;
  /** Achievement count */
  achievementsUnlocked: number;
}

export interface SaveProgressSummary {
  /** Overall completion percentage (0-100) */
  overallCompletion: number;
  /** Story completion percentage */
  storyCompletion: number;
  /** Areas discovered count */
  areasDiscovered: number;
  /** Total areas available */
  totalAreas: number;
  /** Unique monsters encountered */
  uniqueMonstersEncountered: number;
  /** Items collected */
  itemsCollected: number;
  /** Total deaths count */
  deathCount: number;
  /** Save count (how many times saved) */
  saveCount: number;
}

export interface SaveGameData {
  /** Complete game state */
  gameState: ReactGameState;
  /** Save metadata */
  metadata: SaveMetadata;
  /** Player summary for quick access */
  playerSummary: SavePlayerSummary;
  /** Progress summary */
  progressSummary: SaveProgressSummary;
  /** Validation checksum */
  checksum: string;
  /** Compressed data flag */
  isCompressed: boolean;
}

export interface SaveSlotInfo {
  /** Slot number (0-9) */
  slotNumber: number;
  /** Whether slot is empty */
  isEmpty: boolean;
  /** Save metadata (null if empty) */
  metadata: SaveMetadata | null;
  /** Player summary (null if empty) */
  playerSummary: SavePlayerSummary | null;
  /** Progress summary (null if empty) */
  progressSummary: SaveProgressSummary | null;
  /** Local storage availability */
  isLocalAvailable: boolean;
  /** Cloud storage availability */
  isCloudAvailable: boolean;
  /** Sync status */
  syncStatus: SaveSyncStatus;
  /** Last error if any */
  lastError: string | null;
}

export enum SaveSyncStatus {
  /** Save is synced between local and cloud */
  SYNCED = 'synced',
  /** Save exists only locally */
  LOCAL_ONLY = 'local_only',
  /** Save exists only in cloud */
  CLOUD_ONLY = 'cloud_only',
  /** Local version is newer than cloud */
  LOCAL_NEWER = 'local_newer',
  /** Cloud version is newer than local */
  CLOUD_NEWER = 'cloud_newer',
  /** Sync is in progress */
  SYNCING = 'syncing',
  /** Sync failed */
  SYNC_FAILED = 'sync_failed',
  /** Conflict requires user resolution */
  CONFLICT = 'conflict'
}

export interface SaveOperationOptions {
  /** Which slot to save to (0-9) */
  slotNumber: number;
  /** Custom save name */
  saveName?: string;
  /** Whether to include screenshot */
  includeScreenshot?: boolean;
  /** Whether to compress save data */
  compress?: boolean;
  /** Whether to sync to cloud */
  syncToCloud?: boolean;
  /** Custom metadata */
  customMetadata?: Record<string, any>;
  /** Progress callback for UI updates */
  onProgress?: (progress: number, status: string) => void;
}

export interface LoadOperationOptions {
  /** Which slot to load from */
  slotNumber: number;
  /** Whether to validate save data */
  validate?: boolean;
  /** Whether to update last accessed time */
  updateAccessTime?: boolean;
  /** Fallback to cloud if local fails */
  fallbackToCloud?: boolean;
  /** Progress callback */
  onProgress?: (progress: number, status: string) => void;
}

export interface SaveValidationResult {
  /** Whether save is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Checksum match */
  checksumValid: boolean;
  /** Version compatibility */
  versionCompatible: boolean;
  /** Data integrity check */
  dataIntegrityValid: boolean;
}

export interface SaveImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Save data that was imported */
  saveData?: SaveGameData;
  /** Errors during import */
  errors: string[];
  /** Warnings during import */
  warnings: string[];
  /** Source format detected */
  sourceFormat: 'json' | 'binary' | 'legacy' | 'unknown';
}

export interface SaveExportOptions {
  /** Export format */
  format: 'json' | 'binary' | 'legacy';
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Whether to compress exported data */
  compress?: boolean;
  /** Custom filename */
  filename?: string;
}

export interface CloudSaveProvider {
  /** Provider name */
  name: string;
  /** Whether provider is available */
  isAvailable: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User info */
  userInfo?: {
    id: string;
    name: string;
    email?: string;
  };
  /** Storage quota info */
  quotaInfo?: {
    used: number;
    total: number;
    remaining: number;
  };
}

export interface CloudSyncOptions {
  /** Whether to enable automatic sync */
  autoSync?: boolean;
  /** Sync interval in minutes */
  syncInterval?: number;
  /** Whether to sync on app start */
  syncOnStart?: boolean;
  /** Whether to sync on save */
  syncOnSave?: boolean;
  /** Conflict resolution strategy */
  conflictResolution?: 'ask_user' | 'prefer_local' | 'prefer_cloud' | 'prefer_newer';
}

export interface SaveSystemConfig {
  /** Maximum number of save slots */
  maxSaveSlots: number;
  /** Maximum save file size in MB */
  maxSaveFileSizeMB: number;
  /** Whether to enable auto-save */
  autoSaveEnabled: boolean;
  /** Auto-save interval in minutes */
  autoSaveIntervalMinutes: number;
  /** Whether to enable cloud sync */
  cloudSyncEnabled: boolean;
  /** Cloud sync options */
  cloudSyncOptions: CloudSyncOptions;
  /** Whether to compress saves by default */
  compressionEnabled: boolean;
  /** Whether to include screenshots by default */
  screenshotsEnabled: boolean;
  /** Local storage quota limit in MB */
  localStorageQuotaMB: number;
}

// Events for save system operations
export interface SaveSystemEvents {
  onSaveStarted?: (slotNumber: number, saveName: string) => void;
  onSaveProgress?: (progress: number, status: string) => void;
  onSaveCompleted?: (slotNumber: number, saveData: SaveGameData) => void;
  onSaveError?: (error: Error, slotNumber: number) => void;

  onLoadStarted?: (slotNumber: number) => void;
  onLoadProgress?: (progress: number, status: string) => void;
  onLoadCompleted?: (slotNumber: number, saveData: SaveGameData) => void;
  onLoadError?: (error: Error, slotNumber: number) => void;

  onSyncStarted?: (slotNumber: number) => void;
  onSyncCompleted?: (slotNumber: number, syncStatus: SaveSyncStatus) => void;
  onSyncConflict?: (slotNumber: number, localData: SaveGameData, cloudData: SaveGameData) => void;
  onSyncError?: (error: Error, slotNumber: number) => void;

  onQuotaWarning?: (usedPercentage: number) => void;
  onQuotaExceeded?: () => void;
}

// Utility types
export type SaveOperationResult<T = any> = {
  success: boolean;
  data?: T;
  error?: Error;
  warnings?: string[];
};

export type AsyncSaveOperation<T = any> = Promise<SaveOperationResult<T>>;