/**
 * LocalStorage utility for managing form drafts with automatic expiration.
 * Provides safe access to localStorage with error handling for browsers
 * that have storage disabled or unavailable.
 */

const STORAGE_PREFIX = 'plan-maker';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredDraft<T> {
  data: T;
  timestamp: number;
}

/**
 * Check if localStorage is available and accessible.
 * Some browsers block localStorage in private/incognito mode.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}_test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('localStorage is not available:', e);
    }
    return false;
  }
}

/**
 * Get a draft from localStorage. Returns null if:
 * - localStorage is not available
 * - The key doesn't exist
 * - The draft has expired
 * - The stored data is invalid JSON
 */
export function getDraft<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const fullKey = `${STORAGE_PREFIX}_${key}`;
    const stored = localStorage.getItem(fullKey);
    
    if (!stored) {
      return null;
    }

    const draft: StoredDraft<T> = JSON.parse(stored);
    const now = Date.now();
    
    // Check if draft has expired
    if (now - draft.timestamp > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return draft.data;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to get draft for key "${key}":`, e);
    }
    return null;
  }
}

/**
 * Save a draft to localStorage with a timestamp.
 * Silently fails if localStorage is not available.
 */
export function saveDraft<T>(key: string, data: T): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const fullKey = `${STORAGE_PREFIX}_${key}`;
    const draft: StoredDraft<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(fullKey, JSON.stringify(draft));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to save draft for key "${key}":`, e);
    }
  }
}

/**
 * Remove a draft from localStorage.
 * Silently fails if localStorage is not available.
 */
export function removeDraft(key: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const fullKey = `${STORAGE_PREFIX}_${key}`;
    localStorage.removeItem(fullKey);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to remove draft for key "${key}":`, e);
    }
  }
}
