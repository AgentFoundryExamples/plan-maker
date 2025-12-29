import React, { useCallback, useRef } from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';
import { usePlanAnswers } from '@/state/planAnswersStore';

export interface SpecDetailPaneProps {
  spec: SpecItem | null;
  specIndex: number | null;
  planId: string;
  showValidationErrors?: boolean;
  hasValidationError?: (specIndex: number, questionIndex: number) => boolean;
  getValidationError?: (specIndex: number, questionIndex: number) => string;
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
  // showValidationErrors is used indirectly via hasValidationError and getValidationError callbacks
  hasValidationError,
  getValidationError,
}) => {
  const { getAnswer, setAnswer } = usePlanAnswers();
  const questionRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionIndex: number, value: string) => {
      if (specIndex === null) return;
      setAnswer(planId, specIndex, questionIndex, value);
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

  return (
    <div className="spec-detail-pane">
      {/* Sticky Header */}
      <div className="spec-detail-header">
        <div className="spec-detail-title">
          <span className="spec-detail-number">Spec #{specIndex + 1}</span>
          <h3>{spec.purpose}</h3>
        </div>
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
          <h4>Questions</h4>
          {!hasQuestions ? (
            <p className="no-questions-message">No questions for this spec</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecDetailPane;
