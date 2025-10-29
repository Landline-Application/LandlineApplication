/**
 * Storage utilities index
 * Provides centralized exports for all storage-related functionality
 */

export { StorageManager } from './storage-manager';
export type { DeletionResult, ExportedData } from './storage-manager';

export { STORAGE_KEYS, NATIVE_STORAGE, getAllLandlineStorageKeys, isLandlineStorageKey } from './storage-keys';
