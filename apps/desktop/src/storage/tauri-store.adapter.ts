import type { IStorageAdapter } from '@jrs/client-core';
import { LazyStore } from '@tauri-apps/plugin-store';

export class TauriStoreAdapter implements IStorageAdapter {
  private store: LazyStore | null = null;
  private memoryFallback: Map<string, string> = new Map();

  constructor(storeFileName = 'jrs-desktop-store.json') {
    try {
      this.store = new LazyStore(storeFileName);
    } catch {
      this.store = null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.store) {
        const val = await this.store.get<string>(key);
        return val ?? null;
      }
    } catch {
      // Graceful fallback for non-Tauri browser preview environments
    }
    return this.memoryFallback.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.store) {
        await this.store.set(key, value);
        await this.store.save();
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.store) {
        await this.store.delete(key);
        await this.store.save();
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.delete(key);
  }

  async clear(): Promise<void> {
    try {
      if (this.store) {
        await this.store.clear();
        await this.store.save();
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.clear();
  }
}

export const tauriStoreAdapter = new TauriStoreAdapter();
