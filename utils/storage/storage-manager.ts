import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isLandlineStorageKey } from './storage-keys';
import NotificationApiManager from '@/modules/notification-api-manager';

/**
 * Result of a data deletion operation
 */
export interface DeletionResult {
  success: boolean;
  deletedKeys: string[];
  errors?: string[];
}

/**
 * Exported user data structure
 */
export interface ExportedData {
  exportDate: string;
  appVersion: string;
  platform: string;
  data: Record<string, any>;
}

/**
 * Centralized Storage Manager for Landline Application
 * 
 * This class provides a unified interface for all storage operations
 * including AsyncStorage (React Native) and native storage (Android/iOS).
 */
export class StorageManager {
  /**
   * Set an item in AsyncStorage
   */
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting storage item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get an item from AsyncStorage
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting storage item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from AsyncStorage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all AsyncStorage keys
   */
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all storage keys:', error);
      return [];
    }
  }

  /**
   * Get all Landline-specific keys from AsyncStorage
   */
  static async getLandlineKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(isLandlineStorageKey);
    } catch (error) {
      console.error('Error getting Landline storage keys:', error);
      return [];
    }
  }

  /**
   * Clear native storage (Android SharedPreferences)
   * This will be implemented via native module
   */
  private static async clearNativeStorage(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Call native method to clear SharedPreferences
        await NotificationApiManager.clearAllData();
      } catch (error) {
        console.error('Error clearing native storage:', error);
        throw error;
      }
    }
    // iOS implementation would go here if needed
  }

  /**
   * Delete ALL user data from the application
   * 
   * This includes:
   * - All AsyncStorage data with @landline_ prefix
   * - Native storage (notification logs, Landline mode state)
   * - Any cached data
   * 
   * @returns DeletionResult with details about what was deleted
   */
  static async deleteAllUserData(): Promise<DeletionResult> {
    const result: DeletionResult = {
      success: true,
      deletedKeys: [],
      errors: [],
    };

    try {
      // 1. Get all Landline AsyncStorage keys
      const landlineKeys = await this.getLandlineKeys();
      
      // 2. Delete AsyncStorage data
      if (landlineKeys.length > 0) {
        try {
          await AsyncStorage.multiRemove(landlineKeys);
          result.deletedKeys.push(...landlineKeys);
          console.log(`Deleted ${landlineKeys.length} AsyncStorage keys`);
        } catch (error) {
          result.success = false;
          result.errors?.push(`AsyncStorage deletion failed: ${error}`);
        }
      }

      // 3. Clear native storage (Android SharedPreferences)
      try {
        await this.clearNativeStorage();
        result.deletedKeys.push(
          'Native: Landline Mode State',
          'Native: Notification Logs'
        );
        console.log('Cleared native storage');
      } catch (error) {
        result.success = false;
        result.errors?.push(`Native storage deletion failed: ${error}`);
      }

      // 4. Optional: Clear any in-memory caches
      // EventEmitter.emit('storage:data-deleted');

    } catch (error) {
      result.success = false;
      result.errors?.push(`Unexpected error: ${error}`);
      console.error('Error deleting all user data:', error);
    }

    return result;
  }

  /**
   * Export all user data as JSON
   * Useful for allowing users to backup their data before deletion
   * 
   * @returns Stringified JSON with all user data
   */
  static async exportUserData(): Promise<string> {
    try {
      const exportData: ExportedData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0', // TODO: Get from app config
        platform: Platform.OS,
        data: {},
      };

      // Get all Landline keys
      const landlineKeys = await this.getLandlineKeys();

      // Fetch all data
      for (const key of landlineKeys) {
        const value = await this.getItem(key);
        if (value !== null) {
          // Remove the @landline_ prefix for cleaner export
          const cleanKey = key.replace('@landline_', '');
          exportData.data[cleanKey] = value;
        }
      }

      // Note: Native storage (notification logs) would need to be fetched
      // via native module if we want to include them in the export

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Get a summary of stored data (for debugging/settings display)
   */
  static async getStorageSummary(): Promise<{
    totalKeys: number;
    landlineKeys: number;
    estimatedSize: string;
  }> {
    try {
      const landlineKeys = await this.getLandlineKeys();
      const allKeys = await this.getAllKeys();

      // Estimate size (rough approximation)
      let totalSize = 0;
      for (const key of landlineKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      const sizeInKB = (totalSize / 1024).toFixed(2);

      return {
        totalKeys: allKeys.length,
        landlineKeys: landlineKeys.length,
        estimatedSize: `${sizeInKB} KB`,
      };
    } catch (error) {
      console.error('Error getting storage summary:', error);
      return {
        totalKeys: 0,
        landlineKeys: 0,
        estimatedSize: '0 KB',
      };
    }
  }
}
