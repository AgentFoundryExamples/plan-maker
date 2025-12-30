import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';
import { usePlanAnswers } from '@/state/planAnswersStore';

export interface SpecDetailPaneProps {
  spec: SpecItem | null;
  specIndex: number | null;
  planId: string;
  // hasValidationError and getValidationError callbacks use showValidationErrors internally
  // to determine when to display validation messages. These are passed as callbacks to
  // centralize validation logic in the parent component.
  hasValidationError?: (specIndex: number, questionIndex: number) => boolean;
  getValidationError?: (specIndex: number, questionIndex: number) => string;
  // Total number of specs for navigation
  totalSpecs?: number;
  // Callback to navigate to different spec
  onNavigateSpec?: (specIndex: number) => void;
  // Callback to return to spec list (mobile only)
  onBackToList?: () => void;
}

/**
 * SpecDetailPane Component
 * 
 * Displays the full details of a single specification in the right pane
 * of the dual-pane layout. Shows vision, requirements, questions, and answers.
 * 
 * Features:
 * - Sticky header with spec title
 * - Scrollable content area
 * - Question answering with validation
 * - Focus management for accessibility
 */
export const SpecDetailPane: React.FC<SpecDetailPaneProps> = ({
  spec,
  specIndex,
  planId,
  hasValidationError,
  getValidationError,
  totalSpecs = 0,
  onNavigateSpec,
  onBackToList,
}) => {
  const { getAnswer, setAnswer } = usePlanAnswers();
  const questionRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // Detect mobile breakpoint for conditional UI
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionIndex: number, value: string) => {
      if (specIndex === null) return;
      setAnswer(planId, specIndex, questionIndex, value);
      
      // Show save indicator with optimistic UI feedback
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 2000);
    },
    [planId, specIndex, setAnswer]
  );

  // Get answer value
  const getAnswerValue = useCallback(
    (questionIndex: number): string => {
      if (specIndex === null) return '';
      return getAnswer(planId, specIndex, questionIndex);
    },
    [planId, specIndex, getAnswer]
  );

  // Check if question is answered
  const isQuestionAnswered = useCallback(
    (questionIndex: number): boolean => {
      return getAnswerValue(questionIndex).trim().length > 0;
    },
    [getAnswerValue]
  );

  // Navigation: Move to next question or spec
  const handleNext = useCallback(() => {
    if (!spec || specIndex === null) return;
    const questions = spec.open_questions || [];
    
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question in current spec
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Focus the next question
      const refKey = `${specIndex}-${nextIndex}`;
      const element = questionRefs.current.get(refKey);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (onNavigateSpec && specIndex < totalSpecs - 1) {
      // Validate before navigating
      const nextSpecIndex = specIndex + 1;
      if (nextSpecIndex >= 0 && nextSpecIndex < totalSpecs) {
        // Move to next spec
        onNavigateSpec(nextSpecIndex);
        setCurrentQuestionIndex(0);
      }
    }
  }, [spec, specIndex, currentQuestionIndex, onNavigateSpec, totalSpecs]);

  // Navigation: Move to previous question or spec
  const handlePrevious = useCallback(() => {
    if (!spec || specIndex === null) return;
    
    if (currentQuestionIndex > 0) {
      // Move to previous question in current spec
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      
      // Focus the previous question
      const refKey = `${specIndex}-${prevIndex}`;
      const element = questionRefs.current.get(refKey);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (onNavigateSpec && specIndex > 0) {
      // Validate before navigating
      const prevSpecIndex = specIndex - 1;
      if (prevSpecIndex >= 0) {
        // Move to previous spec
        onNavigateSpec(prevSpecIndex);
        // Set to last question of previous spec (will be handled by useEffect)
        setCurrentQuestionIndex(-1); // Special value to indicate "go to last"
      }
    }
  }, [spec, specIndex, currentQuestionIndex, onNavigateSpec]);

  // Navigation: Jump to specific question
  const handleJumpToQuestion = useCallback((questionIndex: number) => {
    if (!spec || specIndex === null) return;
    const questions = spec.open_questions || [];
    
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
      
      // Focus the target question
      const refKey = `${specIndex}-${questionIndex}`;
      const element = questionRefs.current.get(refKey);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [spec, specIndex]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to advance to next question
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  }, [handleNext]);

  // Reset current question index when spec changes
  useEffect(() => {
    if (!spec || specIndex === null) return;
    const questions = spec.open_questions || [];
    
    setCurrentQuestionIndex(prevIndex => {
      if (prevIndex === -1 && questions.length > 0) {
        // Special case from handlePrevious: go to last question
        return questions.length - 1;
      }
      if (prevIndex >= questions.length) {
        // Reset to first question if index is out of bounds (e.g. new spec has fewer questions)
        return 0;
      }
      // No change needed
      return prevIndex;
    });
  }, [spec, specIndex]);

  // Empty state
  if (!spec || specIndex === null) {
    return (
      <div className="spec-detail-pane">
        <div className="spec-detail-empty">
          <div className="spec-detail-empty-icon" aria-hidden="true">
            📋
          </div>
          <p className="spec-detail-empty-message">
            Select a specification from the list to view its details.
          </p>
        </div>
      </div>
    );
  }

  const questions = spec.open_questions || [];
  const hasQuestions = questions.length > 0;
  const canNavigatePrevious = currentQuestionIndex > 0 || (specIndex !== null && specIndex > 0);
  const canNavigateNext = currentQuestionIndex < questions.length - 1 || (specIndex !== null && specIndex < totalSpecs - 1);

  return (
    <div className="spec-detail-pane">
      {/* Sticky Header */}
      <div className="spec-detail-header">
        {/* Mobile: Show back button */}
        {isMobile && onBackToList && (
          <button
            type="button"
            className="btn btn-text spec-detail-back-button"
            onClick={onBackToList}
            aria-label="Back to specifications list"
          >
            ← Back
          </button>
        )}
        
        <div className="spec-detail-title">
          <span className="spec-detail-number">Spec #{specIndex + 1}</span>
          <h3>{spec.purpose}</h3>
        </div>
        {/* Autosave indicator */}
        {showSaveIndicator && (
          <div className="autosave-indicator" role="status" aria-live="polite">
            <span className="autosave-icon">💾</span>
            <span className="autosave-text">Saved</span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="spec-detail-content">
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
                  Question {currentQuestionIndex + 1} of {questions.length}
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
                    onClick={handlePrevious}
                    disabled={!canNavigatePrevious}
                    aria-label="Previous question"
                    title="Previous question (or previous spec)"
                  >
                    ← Previous
                  </button>
                  
                  <select
                    className="qa-jump-select"
                    value={currentQuestionIndex}
                    onChange={(e) => handleJumpToQuestion(parseInt(e.target.value, 10))}
                    aria-label="Jump to question"
                  >
                    {questions.map((question, idx) => {
                      const answered = isQuestionAnswered(idx);
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
                    onClick={handleNext}
                    disabled={!canNavigateNext}
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
              </div>

              <div className="questions-list">
              {questions.map((question, qIndex) => {
                const answered = isQuestionAnswered(qIndex);
                const answer = getAnswerValue(qIndex);
                const hasError = hasValidationError?.(specIndex, qIndex) || false;
                const errorMessage = getValidationError?.(specIndex, qIndex) || '';
                const refKey = `${specIndex}-${qIndex}`;

                return (
                  <div key={qIndex} className="question-item">
                    <div className="question-header">
                      <label htmlFor={`answer-${specIndex}-${qIndex}`} className="question-text">
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
                      onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                      onKeyDown={handleKeyDown}
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
                    <span id={`answer-status-${specIndex}-${qIndex}`} className="visually-hidden">
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
    </div>
  );
};

export default SpecDetailPane;
