import type { IStorageAdapter } from '@jrs/client-core';
import * as SecureStore from 'expo-secure-store';

class MobileSecureStoreAdapter implements IStorageAdapter {
  private memoryFallback: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        return await SecureStore.getItemAsync(key);
      }
    } catch {
      // Fallback for mock/preview/test environments
    }
    return this.memoryFallback.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryFallback.clear();
    // Expo SecureStore does not have a global clear(), remove known keys
    const knownKeys = [
      'jrs_access_token',
      'jrs_user',
      'jrs_active_town_id',
      'jrs_language',
    ];
    for (const key of knownKeys) {
      await this.removeItem(key);
    }
  }
}

export const mobileSecureStoreAdapter = new MobileSecureStoreAdapter();
