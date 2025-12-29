import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  SubmissionMetadataProvider,
  useSubmissionMetadata,
  type SubmissionMetadata,
} from './submissionMetadataStore';
import * as localStorage from '@/utils/localStorage';

// Mock localStorage utilities
vi.mock('@/utils/localStorage', () => ({
  saveDraft: vi.fn(),
  getDraft: vi.fn(),
  removeDraft: vi.fn(),
  isLocalStorageAvailable: vi.fn(() => true),
}));

describe('SubmissionMetadataStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getDraft).mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SubmissionMetadataProvider config={{ enablePersistence: false }}>
      {children}
    </SubmissionMetadataProvider>
  );

  describe('useSubmissionMetadata hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useSubmissionMetadata());
      }).toThrow('useSubmissionMetadata must be used within a SubmissionMetadataProvider');

      consoleError.mockRestore();
    });

    it('provides context value when used within provider', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      expect(result.current).toHaveProperty('getSubmission');
      expect(result.current).toHaveProperty('setSubmission');
      expect(result.current).toHaveProperty('clearSubmission');
      expect(result.current).toHaveProperty('clearAll');
      expect(result.current).toHaveProperty('config');
    });
  });

  describe('setSubmission and getSubmission', () => {
    it('stores and retrieves submission metadata for a plan', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata: SubmissionMetadata = {
        jobId: 'job-123',
        submittedAt: '2025-01-15T10:30:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', metadata);
      });

      const retrieved = result.current.getSubmission('plan-1');
      expect(retrieved).toEqual(metadata);
    });

    it('returns null for non-existent plan', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const retrieved = result.current.getSubmission('non-existent');
      expect(retrieved).toBeNull();
    });

    it('stores submission metadata with optional answersHash', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata: SubmissionMetadata = {
        jobId: 'job-456',
        submittedAt: '2025-01-15T11:00:00Z',
        answersHash: 'abc123',
      };

      act(() => {
        result.current.setSubmission('plan-2', metadata);
      });

      const retrieved = result.current.getSubmission('plan-2');
      expect(retrieved).toEqual(metadata);
      expect(retrieved?.answersHash).toBe('abc123');
    });

    it('overwrites existing submission metadata for same plan', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const firstMetadata: SubmissionMetadata = {
        jobId: 'job-old',
        submittedAt: '2025-01-15T10:00:00Z',
      };

      const secondMetadata: SubmissionMetadata = {
        jobId: 'job-new',
        submittedAt: '2025-01-15T11:00:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', firstMetadata);
      });

      act(() => {
        result.current.setSubmission('plan-1', secondMetadata);
      });

      const retrieved = result.current.getSubmission('plan-1');
      expect(retrieved).toEqual(secondMetadata);
    });

    it('maintains separate metadata for different plans', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata1: SubmissionMetadata = {
        jobId: 'job-plan1',
        submittedAt: '2025-01-15T10:00:00Z',
      };

      const metadata2: SubmissionMetadata = {
        jobId: 'job-plan2',
        submittedAt: '2025-01-15T11:00:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', metadata1);
        result.current.setSubmission('plan-2', metadata2);
      });

      expect(result.current.getSubmission('plan-1')).toEqual(metadata1);
      expect(result.current.getSubmission('plan-2')).toEqual(metadata2);
    });
  });

  describe('clearSubmission', () => {
    it('removes submission metadata for a specific plan', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata: SubmissionMetadata = {
        jobId: 'job-123',
        submittedAt: '2025-01-15T10:30:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', metadata);
      });

      act(() => {
        result.current.clearSubmission('plan-1');
      });

      expect(result.current.getSubmission('plan-1')).toBeNull();
    });

    it('does not affect other plans when clearing one', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata1: SubmissionMetadata = {
        jobId: 'job-plan1',
        submittedAt: '2025-01-15T10:00:00Z',
      };

      const metadata2: SubmissionMetadata = {
        jobId: 'job-plan2',
        submittedAt: '2025-01-15T11:00:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', metadata1);
        result.current.setSubmission('plan-2', metadata2);
      });

      act(() => {
        result.current.clearSubmission('plan-1');
      });

      expect(result.current.getSubmission('plan-1')).toBeNull();
      expect(result.current.getSubmission('plan-2')).toEqual(metadata2);
    });
  });

  describe('clearAll', () => {
    it('removes all submission metadata', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      const metadata1: SubmissionMetadata = {
        jobId: 'job-plan1',
        submittedAt: '2025-01-15T10:00:00Z',
      };

      const metadata2: SubmissionMetadata = {
        jobId: 'job-plan2',
        submittedAt: '2025-01-15T11:00:00Z',
      };

      act(() => {
        result.current.setSubmission('plan-1', metadata1);
        result.current.setSubmission('plan-2', metadata2);
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.getSubmission('plan-1')).toBeNull();
      expect(result.current.getSubmission('plan-2')).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('hydrates from localStorage on mount when persistence enabled', () => {
      const storedData = {
        'plan-1': {
          jobId: 'job-stored',
          submittedAt: '2025-01-15T09:00:00Z',
        },
      };

      vi.mocked(localStorage.getDraft).mockReturnValueOnce(storedData);

      const wrapperWithPersistence = ({ children }: { children: React.ReactNode }) => (
        <SubmissionMetadataProvider config={{ enablePersistence: true }}>
          {children}
        </SubmissionMetadataProvider>
      );

      const { result } = renderHook(() => useSubmissionMetadata(), {
        wrapper: wrapperWithPersistence,
      });

      expect(result.current.getSubmission('plan-1')).toEqual(storedData['plan-1']);
    });

    it('validates stored data on hydration', () => {
      const malformedData = {
        'plan-1': {
          // Missing submittedAt
          jobId: 'job-stored',
        },
        'plan-2': {
          // Valid
          jobId: 'job-valid',
          submittedAt: '2025-01-15T09:00:00Z',
        },
      };

      vi.mocked(localStorage.getDraft).mockReturnValueOnce(malformedData);

      const wrapperWithPersistence = ({ children }: { children: React.ReactNode }) => (
        <SubmissionMetadataProvider config={{ enablePersistence: true }}>
          {children}
        </SubmissionMetadataProvider>
      );

      const { result } = renderHook(() => useSubmissionMetadata(), {
        wrapper: wrapperWithPersistence,
      });

      // Malformed entry should be filtered out
      expect(result.current.getSubmission('plan-1')).toBeNull();
      // Valid entry should be preserved
      expect(result.current.getSubmission('plan-2')).toEqual(malformedData['plan-2']);
    });

    it('handles invalid data types gracefully', () => {
      const invalidData = 'not an object';

      vi.mocked(localStorage.getDraft).mockReturnValueOnce(invalidData as any);

      const wrapperWithPersistence = ({ children }: { children: React.ReactNode }) => (
        <SubmissionMetadataProvider config={{ enablePersistence: true }}>
          {children}
        </SubmissionMetadataProvider>
      );

      const { result } = renderHook(() => useSubmissionMetadata(), {
        wrapper: wrapperWithPersistence,
      });

      // Should start with empty state
      expect(result.current.getSubmission('plan-1')).toBeNull();
    });
  });

  describe('config', () => {
    it('provides default config when no overrides given', () => {
      const { result } = renderHook(() => useSubmissionMetadata(), { wrapper });

      expect(result.current.config.storageKey).toBe('submission-metadata');
      expect(result.current.config.enablePersistence).toBe(false); // Our wrapper overrides this
      expect(result.current.config.storageDebounceMs).toBe(500);
    });

    it('allows config overrides', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <SubmissionMetadataProvider
          config={{
            storageKey: 'custom-key',
            enablePersistence: true,
            storageDebounceMs: 1000,
          }}
        >
          {children}
        </SubmissionMetadataProvider>
      );

      const { result } = renderHook(() => useSubmissionMetadata(), {
        wrapper: customWrapper,
      });

      expect(result.current.config.storageKey).toBe('custom-key');
      expect(result.current.config.enablePersistence).toBe(true);
      expect(result.current.config.storageDebounceMs).toBe(1000);
    });
  });
});
