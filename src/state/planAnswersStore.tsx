import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_PLAN_ANSWERS_CONFIG: PlanAnswersConfig = {
  storageKeyPrefix: 'plan-answers',
  enableSessionStorage: true,
  storageDebounceMs: 500,
  maxUnansweredSpecLinks: 5,
};

/**
 * Structure for storing answers
 * Key format: `${planId}-${specIndex}-${questionIndex}`
 * 
 * Storage Strategy:
 * All plan answers are stored together in a single localStorage entry under the configured
 * storageKeyPrefix (default: 'plan-answers'). This approach:
 * - Simplifies storage management with a single key
 * - Relies on plan ID prefix in answer keys for isolation
 * - Keeps related data together for atomic read/write operations
 * 
 * Alternative approaches considered:
 * - Per-plan keys: Would require managing multiple storage keys and cleanup
 * - Nested structure: Would increase complexity without significant benefit
 * 
 * Data Validation:
 * - Validates structure on load (must be object with string values)
 * - Filters out invalid entries (non-string values, malformed keys)
 * - Falls back to empty state if validation fails
 */
export interface AnswerState {
  [key: string]: string;
}

/**
 * Validation error for a specific question
 */
export interface QuestionValidationError {
  specIndex: number;
  questionIndex: number;
  question: string;
  error: string;
}

/**
 * Validation result for the entire plan
 */
export interface PlanValidationResult {
  /** Whether all required questions are answered */
  isValid: boolean;
  /** Total number of questions */
  totalQuestions: number;
  /** Number of unanswered questions */
  unansweredCount: number;
  /** List of validation errors (one per unanswered question) */
  errors: QuestionValidationError[];
  /** Map of spec index to list of unanswered question indices */
  unansweredBySpec: Map<number, number[]>;
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
  /** Validate all answers against a plan's questions */
  validateAnswers: (planId: string, specs: Array<{ open_questions?: string[] }>) => PlanValidationResult;
  /** Current configuration */
  config: PlanAnswersConfig;
}

const PlanAnswersContext = createContext<PlanAnswersContextValue | undefined>(undefined);

/**
 * Hook to access the plan answers store
 * @throws Error if used outside of PlanAnswersProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
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

  /**
   * Validate and sanitize loaded answer state
   */
  const validateAnswerState = useCallback((data: unknown): AnswerState => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    const validated: AnswerState = {};
    const entries = Object.entries(data as Record<string, unknown>);

    for (const [key, value] of entries) {
      // Validate key format: should be `planId-specIndex-questionIndex`
      const keyParts = key.split('-');
      if (keyParts.length < 3) {
        continue; // Skip malformed keys
      }

      // Validate value is a string
      if (typeof value !== 'string') {
        continue; // Skip non-string values
      }

      validated[key] = value;
    }

    return validated;
  }, []);

  const [answers, setAnswers] = useState<AnswerState>(() => {
    // Try to hydrate from localStorage on mount (via existing localStorage utility)
    if (config.enableSessionStorage) {
      const stored = getDraft<AnswerState>(config.storageKeyPrefix);
      if (stored) {
        // Validate and sanitize the loaded data
        return validateAnswerState(stored);
      }
    }
    return {};
  });

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Debounced save to localStorage - uses ref to avoid state updates in effect
  const saveToStorage = useCallback((state: AnswerState) => {
    if (!config.enableSessionStorage) return;

    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveDraft(config.storageKeyPrefix, state);
      saveTimeoutRef.current = null;
    }, config.storageDebounceMs);
  }, [config.enableSessionStorage, config.storageKeyPrefix, config.storageDebounceMs]);

  // Save to storage whenever answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveToStorage(answers);
    }
    
    // Cleanup timeout on unmount or before next save
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [answers, saveToStorage]);

  /**
   * Generate a storage key for a specific question
   */
  const makeKey = useCallback((planId: string, specIndex: number, questionIndex: number): string => {
    return `${planId}-${specIndex}-${questionIndex}`;
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
    if (currentPlanId !== planId) {
      setCurrentPlanId(planId);
    }

    const key = makeKey(planId, specIndex, questionIndex);
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, [currentPlanId, makeKey]);

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

  /**
   * Validate all answers for a specific plan against its questions
   * 
   * This function enumerates all questions in the provided specs and checks
   * if each has a non-empty, non-whitespace answer. It returns a comprehensive
   * validation result including:
   * - Overall validity (all questions answered)
   * - List of validation errors for unanswered questions
   * - Statistics (total questions, unanswered count)
   * - Map of unanswered questions grouped by spec
   * 
   * Performance optimized: Only iterates over answers for the current plan
   * instead of depending on getAnswer which triggers on any answer change.
   * 
   * @param planId - The plan ID to validate
   * @param specs - Array of spec items containing open_questions
   * @returns PlanValidationResult with validation state
   */
  const validateAnswers = useCallback((
    planId: string,
    specs: Array<{ open_questions?: string[] }>
  ): PlanValidationResult => {
    const errors: QuestionValidationError[] = [];
    const unansweredBySpec = new Map<number, number[]>();
    let totalQuestions = 0;

    // Get answers for this plan only (performance optimization)
    const planAnswers = getAnswersForPlan(planId);

    // Enumerate all questions and check if they are answered
    specs.forEach((spec, specIndex) => {
      const questions = spec.open_questions || [];
      totalQuestions += questions.length;

      questions.forEach((question, questionIndex) => {
        const key = `${planId}-${specIndex}-${questionIndex}`;
        const answer = planAnswers[key] || '';
        // Check if answer is empty or contains only whitespace
        if (!answer.trim()) {
          errors.push({
            specIndex,
            questionIndex,
            question,
            error: 'This question requires an answer',
          });

          // Track unanswered questions by spec
          const specUnanswered = unansweredBySpec.get(specIndex) || [];
          specUnanswered.push(questionIndex);
          unansweredBySpec.set(specIndex, specUnanswered);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      totalQuestions,
      unansweredCount: errors.length,
      errors,
      unansweredBySpec,
    };
  }, [getAnswersForPlan]);

  const value: PlanAnswersContextValue = useMemo(
    () => ({
      answers,
      setAnswer,
      getAnswer,
      isAnswered,
      clearAnswers,
      getAnswersForPlan,
      validateAnswers,
      config,
    }),
    [answers, setAnswer, getAnswer, isAnswered, clearAnswers, getAnswersForPlan, validateAnswers, config]
  );

  return (
    <PlanAnswersContext.Provider value={value}>
      {children}
    </PlanAnswersContext.Provider>
  );
};
