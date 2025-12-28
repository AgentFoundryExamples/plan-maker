import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { saveDraft, getDraft } from '@/utils/localStorage';

/**
 * Configuration for the plan answers store behavior
 * All settings are adjustable via this interface
 */
export interface PlanAnswersConfig {
  /** Storage key prefix for answers */
  storageKeyPrefix: string;
  /** Whether to sync to localStorage (via existing localStorage utility) */
  enableSessionStorage: boolean;
  /** Debounce delay for storage writes (ms) */
  storageDebounceMs: number;
  /** Maximum number of unanswered spec links to show in sticky summary */
  maxUnansweredSpecLinks: number;
}

/**
 * Default configuration for plan answers store
 * Can be overridden when creating the provider
 */
export const DEFAULT_PLAN_ANSWERS_CONFIG: PlanAnswersConfig = {
  storageKeyPrefix: 'plan-answers',
  enableSessionStorage: true,
  storageDebounceMs: 500,
  maxUnansweredSpecLinks: 5,
};

/**
 * Structure for storing answers
 * Key format: `${planId}-${specIndex}-${questionIndex}`
 */
export interface AnswerState {
  [key: string]: string;
}

/**
 * Context value provided to consumers
 */
export interface PlanAnswersContextValue {
  /** All answers for the current plan */
  answers: AnswerState;
  /** Set an answer for a specific question */
  setAnswer: (planId: string, specIndex: number, questionIndex: number, value: string) => void;
  /** Get an answer for a specific question */
  getAnswer: (planId: string, specIndex: number, questionIndex: number) => string;
  /** Check if a question is answered (non-empty after trimming) */
  isAnswered: (planId: string, specIndex: number, questionIndex: number) => boolean;
  /** Clear all answers for the current plan */
  clearAnswers: (planId: string) => void;
  /** Get all answers for the current plan */
  getAnswersForPlan: (planId: string) => AnswerState;
  /** Current configuration */
  config: PlanAnswersConfig;
}

const PlanAnswersContext = createContext<PlanAnswersContextValue | undefined>(undefined);

/**
 * Hook to access the plan answers store
 * @throws Error if used outside of PlanAnswersProvider
 */
export function usePlanAnswers(): PlanAnswersContextValue {
  const context = useContext(PlanAnswersContext);
  if (!context) {
    throw new Error('usePlanAnswers must be used within a PlanAnswersProvider');
  }
  return context;
}

/**
 * Props for PlanAnswersProvider
 */
export interface PlanAnswersProviderProps {
  children: React.ReactNode;
  config?: Partial<PlanAnswersConfig>;
}

/**
 * Provider component for plan answers store
 * Manages answer state with optional sessionStorage persistence
 * 
 * Features:
 * - Stores answers per plan/spec/question
 * - Syncs to sessionStorage when enabled
 * - Falls back to in-memory storage if sessionStorage unavailable
 * - Debounces storage writes for performance
 * - Cleans up answers when plan ID changes
 */
export const PlanAnswersProvider: React.FC<PlanAnswersProviderProps> = ({ 
  children, 
  config: configOverride 
}) => {
  const config = useMemo(
    () => ({ ...DEFAULT_PLAN_ANSWERS_CONFIG, ...configOverride }),
    [configOverride]
  );

  const [answers, setAnswers] = useState<AnswerState>(() => {
    // Try to hydrate from localStorage on mount (via existing localStorage utility)
    if (config.enableSessionStorage) {
      const stored = getDraft<AnswerState>(config.storageKeyPrefix);
      return stored || {};
    }
    return {};
  });

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);

  // Debounced save to localStorage
  const saveToStorage = useCallback((state: AnswerState) => {
    if (!config.enableSessionStorage) return;

    setSaveTimeout((prev) => {
      if (prev !== null) {
        clearTimeout(prev);
      }

      const timeout = window.setTimeout(() => {
        saveDraft(config.storageKeyPrefix, state);
        setSaveTimeout(null);
      }, config.storageDebounceMs);

      return timeout;
    });
  }, [config.enableSessionStorage, config.storageKeyPrefix, config.storageDebounceMs]);

  // Save to storage whenever answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveToStorage(answers);
    }
  }, [answers, saveToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  /**
   * Generate a storage key for a specific question
   */
  const makeKey = useCallback((planId: string, specIndex: number, questionIndex: number): string => {
    return `${planId}-${specIndex}-${questionIndex}`;
  }, []);

  /**
   * Clean up answers for a different plan when switching plans
   */
  const cleanupOldPlanAnswers = useCallback((newPlanId: string) => {
    setAnswers((prev) => {
      const next: AnswerState = {};
      // Keep only answers for the new plan
      Object.keys(prev).forEach((key) => {
        if (key.startsWith(`${newPlanId}-`)) {
          next[key] = prev[key];
        }
      });
      return next;
    });
  }, []);

  /**
   * Set an answer for a specific question
   */
  const setAnswer = useCallback((
    planId: string,
    specIndex: number,
    questionIndex: number,
    value: string
  ) => {
    // Clean up old plan's answers if switching to a new plan
    if (currentPlanId !== null && currentPlanId !== planId) {
      cleanupOldPlanAnswers(planId);
    }
    
    if (currentPlanId !== planId) {
      setCurrentPlanId(planId);
    }

    const key = makeKey(planId, specIndex, questionIndex);
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, [currentPlanId, makeKey, cleanupOldPlanAnswers]);

  /**
   * Get an answer for a specific question
   */
  const getAnswer = useCallback((
    planId: string,
    specIndex: number,
    questionIndex: number
  ): string => {
    const key = makeKey(planId, specIndex, questionIndex);
    return answers[key] || '';
  }, [answers, makeKey]);

  /**
   * Check if a question is answered (non-empty after trimming)
   */
  const isAnswered = useCallback((
    planId: string,
    specIndex: number,
    questionIndex: number
  ): boolean => {
    const answer = getAnswer(planId, specIndex, questionIndex);
    return answer.trim().length > 0;
  }, [getAnswer]);

  /**
   * Clear all answers for a specific plan
   */
  const clearAnswers = useCallback((planId: string) => {
    setAnswers((prev) => {
      const next: AnswerState = {};
      // Keep only answers for other plans
      Object.keys(prev).forEach((key) => {
        if (!key.startsWith(`${planId}-`)) {
          next[key] = prev[key];
        }
      });
      return next;
    });
    if (currentPlanId === planId) {
      setCurrentPlanId(null);
    }
  }, [currentPlanId]);

  /**
   * Get all answers for a specific plan
   */
  const getAnswersForPlan = useCallback((planId: string): AnswerState => {
    const planAnswers: AnswerState = {};
    Object.keys(answers).forEach((key) => {
      if (key.startsWith(`${planId}-`)) {
        planAnswers[key] = answers[key];
      }
    });
    return planAnswers;
  }, [answers]);

  const value: PlanAnswersContextValue = useMemo(
    () => ({
      answers,
      setAnswer,
      getAnswer,
      isAnswered,
      clearAnswers,
      getAnswersForPlan,
      config,
    }),
    [answers, setAnswer, getAnswer, isAnswered, clearAnswers, getAnswersForPlan, config]
  );

  return (
    <PlanAnswersContext.Provider value={value}>
      {children}
    </PlanAnswersContext.Provider>
  );
};
