import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isLocalStorageAvailable,
  getDraft,
  saveDraft,
  removeDraft,
} from './localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('getDraft', () => {
    it('retrieves a stored draft', () => {
      const data = { test: 'value' };
      const draft = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem('plan-maker_test-key', JSON.stringify(draft));

      const retrieved = getDraft<{ test: string }>('test-key');
      expect(retrieved).toEqual(data);
    });

    it('returns null if draft does not exist', () => {
      const retrieved = getDraft('non-existent');
      expect(retrieved).toBeNull();
    });

    it('returns null if draft has expired (older than 24 hours)', () => {
      const data = { test: 'value' };
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const draft = {
        data,
        timestamp: twentyFiveHoursAgo,
      };
      localStorage.setItem('plan-maker_expired-key', JSON.stringify(draft));

      const retrieved = getDraft('expired-key');
      expect(retrieved).toBeNull();
    });

    it('removes expired draft from localStorage', () => {
      const data = { test: 'value' };
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      const draft = {
        data,
        timestamp: twentyFiveHoursAgo,
      };
      localStorage.setItem('plan-maker_expired-key', JSON.stringify(draft));

      getDraft('expired-key');

      expect(localStorage.getItem('plan-maker_expired-key')).toBeNull();
    });

    it('returns null if draft data is invalid JSON', () => {
      localStorage.setItem('plan-maker_invalid-key', 'invalid json');

      const retrieved = getDraft('invalid-key');
      expect(retrieved).toBeNull();
    });

    it('returns null if localStorage is not available', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const retrieved = getDraft('test-key');
      expect(retrieved).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('saveDraft', () => {
    it('saves draft to localStorage with timestamp', () => {
      const data = { test: 'value' };
      saveDraft('test-key', data);

      const stored = localStorage.getItem('plan-maker_test-key');
      expect(stored).toBeTruthy();

      if (stored) {
        const draft = JSON.parse(stored);
        expect(draft.data).toEqual(data);
        expect(draft.timestamp).toBeCloseTo(Date.now(), -2);
      }
    });

    it('does not throw if localStorage is not available', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      expect(() => saveDraft('test-key', { test: 'value' })).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('removeDraft', () => {
    it('removes draft from localStorage', () => {
      const data = { test: 'value' };
      const draft = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem('plan-maker_test-key', JSON.stringify(draft));

      removeDraft('test-key');

      expect(localStorage.getItem('plan-maker_test-key')).toBeNull();
    });

    it('does not throw if localStorage is not available', () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      expect(() => removeDraft('test-key')).not.toThrow();

      Storage.prototype.removeItem = originalRemoveItem;
    });

    it('does not throw if draft does not exist', () => {
      expect(() => removeDraft('non-existent')).not.toThrow();
    });
  });

  describe('draft expiration', () => {
    it('retrieves draft within 24 hours', () => {
      const data = { test: 'value' };
      const twentyThreeHoursAgo = Date.now() - 23 * 60 * 60 * 1000;
      const draft = {
        data,
        timestamp: twentyThreeHoursAgo,
      };
      localStorage.setItem('plan-maker_recent-key', JSON.stringify(draft));

      const retrieved = getDraft<{ test: string }>('recent-key');
      expect(retrieved).toEqual(data);
    });

    it('does not retrieve draft older than 24 hours', () => {
      const data = { test: 'value' };
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
      const draft = {
        data,
        timestamp: fortyEightHoursAgo,
      };
      localStorage.setItem('plan-maker_old-key', JSON.stringify(draft));

      const retrieved = getDraft('old-key');
      expect(retrieved).toBeNull();
    });
  });
});
