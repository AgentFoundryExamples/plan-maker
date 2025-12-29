import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';
import { usePlanAnswers, type PlanValidationResult } from '@/state/planAnswersStore';

interface SpecAccordionProps {
  planId: string;
  specs: SpecItem[];
  stickyPosition?: 'top' | 'bottom';
  showStickySummary?: boolean;
  maxUnansweredSpecLinks?: number;
  validationResult?: PlanValidationResult | null;
  showValidationErrors?: boolean;
}

/**
 * SpecAccordion Component
 * 
 * Displays plan specifications as expandable accordions with question indicators
 * and answer entry with persistence.
 * 
 * State Management:
 * - Answer state is managed by the PlanAnswersStore context
 * - Answers are keyed by `${planId}-${specIndex}-${questionIndex}`
 * - Uses array indices for specIndex and questionIndex
 * - Answers persist across accordion toggling, navigation, and page reloads
 * 
 * LIMITATION: Array indices are used as part of the state key. If specs are reordered
 * or filtered in the future, this could cause answers to be associated with the wrong
 * questions. For future versions, consider using stable identifiers from the spec data
 * (e.g., spec.id, question.id) if available in the API response.
 * 
 * Performance:
 * - Unanswered counts are memoized per spec to avoid O(n²) recalculations
 * - Total unanswered count is derived from memoized per-spec counts
 * - Component is wrapped with React.memo to prevent unnecessary re-renders
 */
const SpecAccordion: React.FC<SpecAccordionProps> = React.memo(({ 
  planId, 
  specs, 
  stickyPosition = 'bottom',
  showStickySummary = true,
  maxUnansweredSpecLinks = 5,
  validationResult = null,
  showValidationErrors = false,
}) => {
  const [expandedSpecs, setExpandedSpecs] = useState<Set<number>>(new Set());
  const { getAnswer, setAnswer, getAnswersForPlan } = usePlanAnswers();
  const questionRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const [currentQuestionsBySpec, setCurrentQuestionsBySpec] = useState<Map<number, number>>(new Map());
  const [showSaveIndicator, setShowSaveIndicator] = useState<string | null>(null);

  // Get all answers for current plan to use in memoization
  const planAnswers = getAnswersForPlan(planId);

  // Toggle spec expansion
  const toggleSpec = (index: number) => {
    setExpandedSpecs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Handle answer change - delegate to store
  const handleAnswerChange = (
    specIndex: number,
    questionIndex: number,
    value: string
  ) => {
    setAnswer(planId, specIndex, questionIndex, value);
    
    // Show save indicator with optimistic UI feedback
    const key = `${specIndex}-${questionIndex}`;
    setShowSaveIndicator(key);
    setTimeout(() => setShowSaveIndicator(null), 2000);
  };

  // Check if a question is answered
  const isQuestionAnswered = useCallback((specIndex: number, questionIndex: number): boolean => {
    const key = `${planId}-${specIndex}-${questionIndex}`;
    return (planAnswers[key] || '').trim().length > 0;
  }, [planId, planAnswers]);

  // Get answer for a question - delegate to store
  const getAnswerValue = (specIndex: number, questionIndex: number): string => {
    return getAnswer(planId, specIndex, questionIndex);
  };

  // Memoize unanswered counts for each spec to avoid recalculation on every render
  const unansweredCounts = useMemo(() => {
    return specs.map((spec, specIndex) => {
      const questions = spec.open_questions || [];
      if (questions.length === 0) return 0;
      return questions.filter((_, qIndex) => {
        const key = `${planId}-${specIndex}-${qIndex}`;
        return (planAnswers[key] || '').trim().length === 0;
      }).length;
    });
  }, [specs, planId, planAnswers]);

  // Calculate unanswered questions for a spec using memoized counts
  const getUnansweredCount = (_spec: SpecItem, specIndex: number): number => {
    return unansweredCounts[specIndex];
  };

  // Calculate total unanswered questions from the memoized counts
  const totalUnanswered = useMemo(() => {
    return unansweredCounts.reduce((sum, count) => sum + count, 0);
  }, [unansweredCounts]);

  // Calculate total questions across all specs
  const totalQuestions = useMemo(() => {
    return specs.reduce((total, spec) => {
      return total + (spec.open_questions?.length || 0);
    }, 0);
  }, [specs]);

  // Get list of spec indices with unanswered questions
  const specsWithUnanswered = useMemo(() => {
    return specs
      .map((spec, idx) => ({ spec, idx, count: unansweredCounts[idx] }))
      .filter(item => item.count > 0);
  }, [specs, unansweredCounts]);

  // Get current question index for a spec
  const getCurrentQuestion = useCallback((specIndex: number): number => {
    return currentQuestionsBySpec.get(specIndex) || 0;
  }, [currentQuestionsBySpec]);

  // Set current question index for a spec
  const setCurrentQuestion = useCallback((specIndex: number, questionIndex: number) => {
    setCurrentQuestionsBySpec((prev) => {
      const next = new Map(prev);
      next.set(specIndex, questionIndex);
      return next;
    });
  }, []);

  // Scroll to a specific spec
  const scrollToSpec = useCallback((specIndex: number) => {
    const element = document.getElementById(`spec-${specIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Expand the spec
      setExpandedSpecs((prev) => {
        const next = new Set(prev);
        next.add(specIndex);
        return next;
      });
    }
  }, [setExpandedSpecs]);

  // Navigate to next question or spec
  const handleNext = useCallback((specIndex: number) => {
    const spec = specs[specIndex];
    const questions = spec.open_questions || [];
    const currentQ = getCurrentQuestion(specIndex);
    
    if (currentQ < questions.length - 1) {
      // Move to next question in current spec
      const nextQ = currentQ + 1;
      setCurrentQuestion(specIndex, nextQ);
      
      // Focus the next question
      const refKey = `${specIndex}-${nextQ}`;
      const element = questionRefs.current.get(refKey);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (specIndex < specs.length - 1) {
      // Validate next spec index
      const nextSpecIndex = specIndex + 1;
      if (nextSpecIndex >= 0 && nextSpecIndex < specs.length) {
        // Move to next spec
        scrollToSpec(nextSpecIndex);
        setCurrentQuestion(nextSpecIndex, 0);
      }
    }
  }, [specs, getCurrentQuestion, setCurrentQuestion, scrollToSpec]);

  // Navigate to previous question or spec
  const handlePrevious = useCallback((specIndex: number) => {
    const currentQ = getCurrentQuestion(specIndex);
    
    if (currentQ > 0) {
      // Move to previous question in current spec
      const prevQ = currentQ - 1;
      setCurrentQuestion(specIndex, prevQ);
      
      // Focus the previous question
      const refKey = `${specIndex}-${prevQ}`;
      const element = questionRefs.current.get(refKey);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (specIndex > 0) {
      // Move to previous spec
      const prevSpecIndex = specIndex - 1;
      const prevSpec = specs[prevSpecIndex];
      const prevQuestions = prevSpec.open_questions || [];
      
      // Ensure the previous spec is expanded and then scroll to it
      scrollToSpec(prevSpecIndex);
      setCurrentQuestion(prevSpecIndex, Math.max(0, prevQuestions.length - 1));
    }
  }, [specs, getCurrentQuestion, setCurrentQuestion, scrollToSpec]);

  // Jump to specific question within a spec
  const handleJumpToQuestion = useCallback((specIndex: number, questionIndex: number) => {
    setCurrentQuestion(specIndex, questionIndex);
    
    // Focus the target question
    const refKey = `${specIndex}-${questionIndex}`;
    const element = questionRefs.current.get(refKey);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [setCurrentQuestion]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>, specIndex: number) => {
    // Ctrl/Cmd + Enter to advance to next question
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleNext(specIndex);
    }
  }, [handleNext]);

  /**
   * Check if a specific question has a validation error
   */
  const hasValidationError = useCallback((specIndex: number, questionIndex: number): boolean => {
    if (!showValidationErrors || !validationResult) return false;
    return validationResult.errors.some(
      err => err.specIndex === specIndex && err.questionIndex === questionIndex
    );
  }, [showValidationErrors, validationResult]);

  /**
   * Get validation error message for a specific question
   */
  const getValidationError = useCallback((specIndex: number, questionIndex: number): string => {
    if (!showValidationErrors || !validationResult) return '';
    const error = validationResult.errors.find(
      err => err.specIndex === specIndex && err.questionIndex === questionIndex
    );
    return error?.error || '';
  }, [showValidationErrors, validationResult]);

  /**
   * Scroll to and focus the first invalid question
   * This is called when submission is attempted with validation errors
   */
  const scrollToFirstError = useCallback(() => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const firstError = validationResult.errors[0];
    const { specIndex } = firstError;

    // Expand the spec containing the first error
    setExpandedSpecs((prev) => {
      if (prev.has(specIndex)) return prev; // Already expanded
      const next = new Set(prev);
      next.add(specIndex);
      return next;
    });
  }, [validationResult]);

  // Expose scrollToFirstError to parent via imperative handle if needed
  // For now, we'll call it internally when validationResult changes
  React.useEffect(() => {
    if (showValidationErrors && validationResult && !validationResult.isValid) {
      scrollToFirstError();
    }
  }, [showValidationErrors, validationResult, scrollToFirstError]);

  // Effect to handle scrolling after an accordion is expanded due to validation
  React.useEffect(() => {
    if (!showValidationErrors || !validationResult || validationResult.isValid) return;

    const firstError = validationResult.errors[0];
    if (!firstError) return;

    const { specIndex, questionIndex } = firstError;

    // Only scroll if this spec was just expanded
    if (expandedSpecs.has(specIndex)) {
      // Use requestAnimationFrame to wait for the DOM to be ready after expansion
      requestAnimationFrame(() => {
        const key = `${specIndex}-${questionIndex}`;
        const element = questionRefs.current.get(key);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true }); // preventScroll as scrollIntoView handles it
        }
      });
    }
  }, [expandedSpecs, showValidationErrors, validationResult]);

  return (
    <div className="spec-accordion-container">
      {/* Inline Summary Section */}
      {totalQuestions > 0 && (
        <div className="accordion-summary" role="status" aria-live="polite">
          <h3>Questions Summary</h3>
          <p>
            {totalUnanswered === 0 ? (
              <span className="summary-complete">✓ All questions answered</span>
            ) : (
              <span className="summary-pending">
                {totalUnanswered} of {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} remaining
              </span>
            )}
          </p>
        </div>
      )}

      {/* Sticky Summary Bar */}
      {showStickySummary && totalQuestions > 0 && (
        <div 
          className="sticky-summary-bar" 
          data-position={stickyPosition}
          role="region" 
          aria-label="Questions progress summary"
        >
          <div className="sticky-summary-content">
            <p className={`sticky-summary-text ${totalUnanswered === 0 ? 'all-complete' : 'pending'}`}>
              {totalUnanswered === 0 ? (
                <span>✓ All {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} answered</span>
              ) : (
                <span>{totalUnanswered} of {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} remaining</span>
              )}
            </p>
            {specsWithUnanswered.length > 0 && (
              <div className="unanswered-specs-list">
                {specsWithUnanswered.slice(0, maxUnansweredSpecLinks).map(({ idx }) => (
                  <button
                    key={idx}
                    className="unanswered-spec-link"
                    onClick={() => scrollToSpec(idx)}
                    aria-label={`Go to spec ${idx + 1}`}
                  >
                    Spec #{idx + 1}
                  </button>
                ))}
                {specsWithUnanswered.length > maxUnansweredSpecLinks && (
                  <span className="sticky-summary-text">+{specsWithUnanswered.length - maxUnansweredSpecLinks} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specs List */}
      <div className="accordion-list">
        {specs.map((spec, specIndex) => {
          const isExpanded = expandedSpecs.has(specIndex);
          const questions = spec.open_questions || [];
          const unansweredCount = getUnansweredCount(spec, specIndex);
          const hasQuestions = questions.length > 0;

          return (
            <div 
              key={specIndex} 
              className={`accordion-item ${hasQuestions && unansweredCount > 0 ? 'has-unanswered' : ''}`}
              id={`spec-${specIndex}`}
            >
              {/* Accordion Header */}
              <button
                className="accordion-header"
                onClick={() => toggleSpec(specIndex)}
                aria-expanded={isExpanded}
                aria-controls={`spec-content-${specIndex}`}
                id={`spec-header-${specIndex}`}
              >
                <div className="accordion-header-content">
                  <h3 className="accordion-title">
                    Spec #{specIndex + 1}: {spec.purpose}
                  </h3>
                  <span
                    className={`question-badge ${!hasQuestions ? 'badge-complete' : unansweredCount === 0 ? 'badge-complete' : 'badge-pending'}`}
                    aria-label={
                      !hasQuestions
                        ? 'Checkmark: No questions'
                        : unansweredCount === 0
                        ? 'Checkmark: All questions answered'
                        : `Warning: ${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} remaining`
                    }
                  >
                    {!hasQuestions
                      ? '✓ No questions'
                      : unansweredCount === 0
                      ? '✓ All answered'
                      : `⚠ ${unansweredCount} unanswered`}
                  </span>
                </div>
                <span className="accordion-icon" aria-hidden="true">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div
                  className="accordion-content"
                  id={`spec-content-${specIndex}`}
                  role="region"
                  aria-labelledby={`spec-header-${specIndex}`}
                >
                  {/* Spec Details */}
                  <div className="spec-details">
                    {spec.vision && (
                      <div className="spec-section">
                        <strong>Vision:</strong>
                        <p>{spec.vision}</p>
                      </div>
                    )}
                    {spec.must && spec.must.length > 0 && (
                      <div className="spec-section">
                        <strong>Must Have:</strong>
                        <ul>
                          {spec.must.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {spec.nice && spec.nice.length > 0 && (
                      <div className="spec-section">
                        <strong>Nice to Have:</strong>
                        <ul>
                          {spec.nice.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {spec.dont && spec.dont.length > 0 && (
                      <div className="spec-section">
                        <strong>Don&apos;t:</strong>
                        <ul>
                          {spec.dont.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {spec.assumptions && spec.assumptions.length > 0 && (
                      <div className="spec-section">
                        <strong>Assumptions:</strong>
                        <ul>
                          {spec.assumptions.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Questions Section */}
                  <div className="questions-section">
                    <div className="questions-header">
                      <h4>Questions</h4>
                      {hasQuestions && (
                        <div className="question-progress">
                          <span className="question-progress-text">
                            Question {getCurrentQuestion(specIndex) + 1} of {questions.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {!hasQuestions ? (
                      <p className="no-questions-message">No questions for this spec</p>
                    ) : (
                      <>
                        {/* Q&A Navigation Controls */}
                        <div className="qa-navigation-controls" role="navigation" aria-label="Question navigation">
                          <div className="qa-nav-buttons">
                            <button
                              type="button"
                              className="btn btn-secondary btn-qa-nav"
                              onClick={() => handlePrevious(specIndex)}
                              disabled={getCurrentQuestion(specIndex) === 0 && specIndex === 0}
                              aria-label="Previous question"
                              title="Previous question (or previous spec)"
                            >
                              ← Previous
                            </button>
                            
                            <select
                              className="qa-jump-select"
                              value={getCurrentQuestion(specIndex)}
                              onChange={(e) => handleJumpToQuestion(specIndex, parseInt(e.target.value, 10))}
                              aria-label="Jump to question"
                            >
                              {questions.map((question, idx) => {
                                const answered = isQuestionAnswered(specIndex, idx);
                                return (
                                  <option key={idx} value={idx}>
                                    Q{idx + 1}: {question.substring(0, 40)}{question.length > 40 ? '...' : ''} {answered ? '✓' : '○'}
                                  </option>
                                );
                              })}
                            </select>
                            
                            <button
                              type="button"
                              className="btn btn-secondary btn-qa-nav"
                              onClick={() => handleNext(specIndex)}
                              disabled={getCurrentQuestion(specIndex) === questions.length - 1 && specIndex === specs.length - 1}
                              aria-label="Next question"
                              title="Next question (or next spec) - Ctrl/Cmd + Enter"
                            >
                              Next →
                            </button>
                          </div>
                          <p className="qa-keyboard-hint">
                            <span className="qa-hint-icon">⌨️</span>
                            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> (or <kbd>Cmd</kbd>+<kbd>Enter</kbd>) to advance to next question
                          </p>
                          {/* Autosave indicator */}
                          {showSaveIndicator && showSaveIndicator.startsWith(`${specIndex}-`) && (
                            <div className="autosave-indicator" role="status" aria-live="polite">
                              <span className="autosave-icon">💾</span>
                              <span className="autosave-text">Saved</span>
                            </div>
                          )}
                        </div>

                        <div className="questions-list">
                        {questions.map((question, qIndex) => {
                          const answered = isQuestionAnswered(specIndex, qIndex);
                          const answer = getAnswerValue(specIndex, qIndex);
                          const hasError = hasValidationError(specIndex, qIndex);
                          const errorMessage = getValidationError(specIndex, qIndex);
                          const refKey = `${specIndex}-${qIndex}`;
                          
                          return (
                            <div key={qIndex} className="question-item">
                              <div className="question-header">
                                <label
                                  htmlFor={`answer-${specIndex}-${qIndex}`}
                                  className="question-text"
                                >
                                  {question}
                                </label>
                                <span
                                  className={`answer-indicator ${answered ? 'answered' : 'unanswered'}`}
                                  aria-label={answered ? 'Answered' : 'Unanswered'}
                                >
                                  {answered ? '✓ Answered' : '○ Unanswered'}
                                </span>
                              </div>
                              <textarea
                                id={`answer-${specIndex}-${qIndex}`}
                                className={`answer-textarea ${hasError ? 'invalid' : ''}`}
                                value={answer}
                                onChange={(e) =>
                                  handleAnswerChange(specIndex, qIndex, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(e, specIndex)}
                                placeholder="Enter your answer here..."
                                rows={3}
                                aria-describedby={`answer-status-${specIndex}-${qIndex}`}
                                aria-invalid={hasError}
                                ref={(el) => {
                                  if (el) {
                                    questionRefs.current.set(refKey, el);
                                  } else {
                                    questionRefs.current.delete(refKey);
                                  }
                                }}
                              />
                              {hasError && errorMessage && (
                                <div className="validation-error-message" role="alert">
                                  {errorMessage}
                                </div>
                              )}
                              <span
                                id={`answer-status-${specIndex}-${qIndex}`}
                                className="visually-hidden"
                              >
                                {answered ? 'This question is answered' : 'This question needs an answer'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these props actually change
  return (
    prevProps.planId === nextProps.planId &&
    prevProps.specs === nextProps.specs && // Reference equality check
    prevProps.stickyPosition === nextProps.stickyPosition &&
    prevProps.showStickySummary === nextProps.showStickySummary &&
    prevProps.maxUnansweredSpecLinks === nextProps.maxUnansweredSpecLinks &&
    prevProps.validationResult === nextProps.validationResult &&
    prevProps.showValidationErrors === nextProps.showValidationErrors
  );
});

// Display name for debugging
SpecAccordion.displayName = 'SpecAccordion';

export default SpecAccordion;
