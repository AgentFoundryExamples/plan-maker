import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveDraft, getDraft } from '@/utils/localStorage';

/**
 * Configuration for submission metadata storage
 */
export interface SubmissionMetadataConfig {
  /** Storage key for submission metadata */
  storageKey: string;
  /** Whether to persist to localStorage */
  enablePersistence: boolean;
  /** Debounce delay for storage writes (ms) */
  storageDebounceMs: number;
}

/**
 * Default configuration
 */
export const DEFAULT_SUBMISSION_METADATA_CONFIG: SubmissionMetadataConfig = {
  storageKey: 'submission-metadata',
  enablePersistence: true,
  storageDebounceMs: 500,
};

/**
 * Metadata for a single submission
 */
export interface SubmissionMetadata {
  /** Job ID returned from the clarifier API */
  jobId: string;
  /** Timestamp when submission was made (ISO 8601) */
  submittedAt: string;
  /** Hash of answers at submission time (optional, for change detection) */
  answersHash?: string;
}

/**
 * Storage structure - keyed by plan ID
 */
export interface SubmissionMetadataState {
  [planId: string]: SubmissionMetadata;
}

/**
 * Context value
 */
export interface SubmissionMetadataContextValue {
  /** Get submission metadata for a plan */
  getSubmission: (planId: string) => SubmissionMetadata | null;
  /** Save submission metadata for a plan */
  setSubmission: (planId: string, metadata: SubmissionMetadata) => void;
  /** Clear submission metadata for a plan */
  clearSubmission: (planId: string) => void;
  /** Clear all submission metadata */
  clearAll: () => void;
  /** Current configuration */
  config: SubmissionMetadataConfig;
}

const SubmissionMetadataContext = createContext<SubmissionMetadataContextValue | undefined>(undefined);

/**
 * Hook to access submission metadata store
 */
export function useSubmissionMetadata(): SubmissionMetadataContextValue {
  const context = useContext(SubmissionMetadataContext);
  if (!context) {
    throw new Error('useSubmissionMetadata must be used within a SubmissionMetadataProvider');
  }
  return context;
}

/**
 * Props for SubmissionMetadataProvider
 */
export interface SubmissionMetadataProviderProps {
  children: React.ReactNode;
  config?: Partial<SubmissionMetadataConfig>;
}

/**
 * Provider for submission metadata store
 */
export const SubmissionMetadataProvider: React.FC<SubmissionMetadataProviderProps> = ({
  children,
  config: configOverride,
}) => {
  const config = useMemo(
    () => ({ ...DEFAULT_SUBMISSION_METADATA_CONFIG, ...configOverride }),
    [configOverride]
  );

  /**
   * Validate loaded submission metadata
   */
  const validateState = useCallback((data: unknown): SubmissionMetadataState => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    const validated: SubmissionMetadataState = {};
    const entries = Object.entries(data as Record<string, unknown>);

    for (const [planId, value] of entries) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue;
      }

      const metadata = value as Record<string, unknown>;
      
      // Validate required fields
      if (
        typeof metadata.jobId !== 'string' ||
        typeof metadata.submittedAt !== 'string'
      ) {
        continue;
      }

      validated[planId] = {
        jobId: metadata.jobId,
        submittedAt: metadata.submittedAt,
        answersHash: typeof metadata.answersHash === 'string' ? metadata.answersHash : undefined,
      };
    }

    return validated;
  }, []);

  const [metadata, setMetadata] = useState<SubmissionMetadataState>(() => {
    if (config.enablePersistence) {
      const stored = getDraft<SubmissionMetadataState>(config.storageKey);
      if (stored) {
        return validateState(stored);
      }
    }
    return {};
  });

  const saveTimeoutRef = useRef<number | null>(null);

  /**
   * Debounced save to localStorage
   */
  const saveToStorage = useCallback((state: SubmissionMetadataState) => {
    if (!config.enablePersistence) return;

    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveDraft(config.storageKey, state);
      saveTimeoutRef.current = null;
    }, config.storageDebounceMs);
  }, [config.enablePersistence, config.storageKey, config.storageDebounceMs]);

  // Save to storage whenever metadata changes
  useEffect(() => {
    if (Object.keys(metadata).length > 0) {
      saveToStorage(metadata);
    }
  }, [metadata, saveToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Get submission metadata for a plan
   */
  const getSubmission = useCallback((planId: string): SubmissionMetadata | null => {
    return metadata[planId] || null;
  }, [metadata]);

  /**
   * Save submission metadata for a plan
   */
  const setSubmission = useCallback((planId: string, submissionMetadata: SubmissionMetadata) => {
    setMetadata((prev) => ({
      ...prev,
      [planId]: submissionMetadata,
    }));
  }, []);

  /**
   * Clear submission metadata for a plan
   */
  const clearSubmission = useCallback((planId: string) => {
    setMetadata((prev) => {
      const next = { ...prev };
      delete next[planId];
      return next;
    });
  }, []);

  /**
   * Clear all submission metadata
   */
  const clearAll = useCallback(() => {
    setMetadata({});
  }, []);

  const value: SubmissionMetadataContextValue = useMemo(
    () => ({
      getSubmission,
      setSubmission,
      clearSubmission,
      clearAll,
      config,
    }),
    [getSubmission, setSubmission, clearSubmission, clearAll, config]
  );

  return (
    <SubmissionMetadataContext.Provider value={value}>
      {children}
    </SubmissionMetadataContext.Provider>
  );
};
