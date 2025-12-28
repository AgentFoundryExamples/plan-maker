import React, { useState, useMemo } from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';

interface SpecAccordionProps {
  planId: string;
  specs: SpecItem[];
}

interface AnswerState {
  [key: string]: string; // key format: `${planId}-${specIndex}-${questionIndex}`
}

/**
 * SpecAccordion Component
 * 
 * Displays plan specifications as expandable accordions with question indicators
 * and local answer entry.
 * 
 * State Management:
 * - Answer state is keyed by `${planId}-${specIndex}-${questionIndex}`
 * - Uses array indices for specIndex and questionIndex
 * 
 * LIMITATION: Array indices are used as part of the state key. If specs are reordered
 * or filtered in the future, this could cause answers to be associated with the wrong
 * questions. For future versions, consider using stable identifiers from the spec data
 * (e.g., spec.id, question.id) if available in the API response.
 * 
 * Performance:
 * - Unanswered counts are memoized per spec to avoid O(n²) recalculations
 * - Total unanswered count is derived from memoized per-spec counts
 */
const SpecAccordion: React.FC<SpecAccordionProps> = ({ planId, specs }) => {
  const [expandedSpecs, setExpandedSpecs] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<AnswerState>({});

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

  // Handle answer change
  const handleAnswerChange = (
    specIndex: number,
    questionIndex: number,
    value: string
  ) => {
    const key = `${planId}-${specIndex}-${questionIndex}`;
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Check if a question is answered
  const isQuestionAnswered = (specIndex: number, questionIndex: number): boolean => {
    const key = `${planId}-${specIndex}-${questionIndex}`;
    return (answers[key] || '').trim().length > 0;
  };

  // Get answer for a question
  const getAnswer = (specIndex: number, questionIndex: number): string => {
    const key = `${planId}-${specIndex}-${questionIndex}`;
    return answers[key] || '';
  };

  // Memoize unanswered counts for each spec to avoid recalculation on every render
  const unansweredCounts = useMemo(() => {
    return specs.map((spec, specIndex) => {
      const questions = spec.open_questions || [];
      if (questions.length === 0) return 0;
      return questions.filter((_, qIndex) => {
        const key = `${planId}-${specIndex}-${qIndex}`;
        return (answers[key] || '').trim().length === 0;
      }).length;
    });
  }, [specs, answers, planId]);

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

  return (
    <div className="spec-accordion-container">
      {/* Summary Section */}
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

      {/* Specs List */}
      <div className="accordion-list">
        {specs.map((spec, specIndex) => {
          const isExpanded = expandedSpecs.has(specIndex);
          const questions = spec.open_questions || [];
          const unansweredCount = getUnansweredCount(spec, specIndex);
          const hasQuestions = questions.length > 0;

          return (
            <div key={specIndex} className="accordion-item">
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
                        ? 'No questions'
                        : unansweredCount === 0
                        ? 'All questions answered'
                        : `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} remaining`
                    }
                  >
                    {!hasQuestions
                      ? 'No questions'
                      : unansweredCount === 0
                      ? '✓ All answered'
                      : `${unansweredCount} unanswered`}
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
                    <h4>Questions</h4>
                    {!hasQuestions ? (
                      <p className="no-questions-message">No questions for this spec</p>
                    ) : (
                      <div className="questions-list">
                        {questions.map((question, qIndex) => {
                          const answered = isQuestionAnswered(specIndex, qIndex);
                          const answer = getAnswer(specIndex, qIndex);
                          
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
                                className="answer-textarea"
                                value={answer}
                                onChange={(e) =>
                                  handleAnswerChange(specIndex, qIndex, e.target.value)
                                }
                                placeholder="Enter your answer here..."
                                rows={3}
                                aria-describedby={`answer-status-${specIndex}-${qIndex}`}
                              />
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
};

export default SpecAccordion;
