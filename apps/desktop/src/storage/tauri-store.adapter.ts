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
        if (val !== undefined && val !== null) {
          return val;
        }
      }
    } catch {
      // Graceful fallback for non-Tauri browser preview environments
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
      return;
    }
    this.memoryFallback.clear();
  }
}

export const tauriStoreAdapter = new TauriStoreAdapter();
