import type { IStorageAdapter } from '@jrs/client-core';
import { LazyStore } from '@tauri-apps/plugin-store';

class TauriStoreAdapter implements IStorageAdapter {
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
          // Keep localStorage synchronously aligned
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem(key, val);
            } catch {
              // ignore
            }
          }
          return val;
        }
      }
    } catch {
      // Graceful fallback for non-Tauri browser preview environments
    }

    // Fall back to localStorage immediately if Tauri store returned null/failed
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = window.localStorage.getItem(key);
      if (localVal !== null) {
        // Re-sync back to Tauri lazy store in background
        if (this.store) {
          this.store
            .set(key, localVal)
            .then(() => this.store?.save())
            .catch(() => {});
        }
        return localVal;
      }
    }

    return this.memoryFallback.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    // 1. Immediately persist in localStorage for synchronous survival
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
    this.memoryFallback.set(key, value);

    // 2. Persist in Tauri LazyStore
    try {
      if (this.store) {
        await this.store.set(key, value);
        await this.store.save();
      }
    } catch {
      // ignore
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    this.memoryFallback.delete(key);

    try {
      if (this.store) {
        await this.store.delete(key);
        await this.store.save();
      }
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    }
    this.memoryFallback.clear();

    try {
      if (this.store) {
        await this.store.clear();
        await this.store.save();
      }
    } catch {
      // ignore
    }
  }
}

export const tauriStoreAdapter = new TauriStoreAdapter();
