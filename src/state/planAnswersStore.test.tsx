import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanAnswersProvider, usePlanAnswers } from './planAnswersStore';
import React from 'react';

// Test component that uses the store
function TestComponent({ planId }: { planId: string }) {
  const {
    setAnswer,
    getAnswer,
    isAnswered,
    validateAnswers,
    clearAnswers,
  } = usePlanAnswers();

  const [validationResult, setValidationResult] = React.useState<any>(null);

  const mockSpecs = [
    {
      open_questions: ['Question 1?', 'Question 2?'],
    },
    {
      open_questions: ['Question 3?'],
    },
    {
      // No questions
    },
  ];

  return (
    <div>
      <div data-testid="answer-0-0">{getAnswer(planId, 0, 0)}</div>
      <div data-testid="answer-0-1">{getAnswer(planId, 0, 1)}</div>
      <div data-testid="answer-1-0">{getAnswer(planId, 1, 0)}</div>
      
      <div data-testid="answered-0-0">{isAnswered(planId, 0, 0) ? 'yes' : 'no'}</div>
      <div data-testid="answered-0-1">{isAnswered(planId, 0, 1) ? 'yes' : 'no'}</div>
      <div data-testid="answered-1-0">{isAnswered(planId, 1, 0) ? 'yes' : 'no'}</div>

      <button onClick={() => setAnswer(planId, 0, 0, 'Answer 1')}>
        Set Answer 0-0
      </button>
      <button onClick={() => setAnswer(planId, 0, 1, 'Answer 2')}>
        Set Answer 0-1
      </button>
      <button onClick={() => setAnswer(planId, 1, 0, 'Answer 3')}>
        Set Answer 1-0
      </button>
      <button onClick={() => setAnswer(planId, 0, 0, '   ')}>
        Set Whitespace 0-0
      </button>
      <button onClick={() => clearAnswers(planId)}>Clear All</button>
      <button onClick={() => {
        const result = validateAnswers(planId, mockSpecs);
        setValidationResult(result);
      }}>
        Validate
      </button>

      {validationResult && (
        <div data-testid="validation-result">
          <div data-testid="is-valid">{validationResult.isValid ? 'valid' : 'invalid'}</div>
          <div data-testid="total-questions">{validationResult.totalQuestions}</div>
          <div data-testid="unanswered-count">{validationResult.unansweredCount}</div>
          <div data-testid="errors-count">{validationResult.errors.length}</div>
        </div>
      )}
    </div>
  );
}

describe('PlanAnswersStore', () => {
  const renderWithProvider = (planId: string = 'test-plan') => {
    return render(
      <PlanAnswersProvider config={{ enableSessionStorage: false }}>
        <TestComponent planId={planId} />
      </PlanAnswersProvider>
    );
  };

  beforeEach(() => {
    // Clear any state between tests
  });

  describe('Basic Answer Management', () => {
    it('starts with empty answers', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('answer-0-0')).toHaveTextContent('');
      expect(screen.getByTestId('answer-0-1')).toHaveTextContent('');
      expect(screen.getByTestId('answered-0-0')).toHaveTextContent('no');
    });

    it('sets and retrieves answers', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Set Answer 0-0'));

      await waitFor(() => {
        expect(screen.getByTestId('answer-0-0')).toHaveTextContent('Answer 1');
        expect(screen.getByTestId('answered-0-0')).toHaveTextContent('yes');
      });
    });

    it('handles multiple answers independently', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Set Answer 0-0'));
      await user.click(screen.getByText('Set Answer 0-1'));
      await user.click(screen.getByText('Set Answer 1-0'));

      await waitFor(() => {
        expect(screen.getByTestId('answer-0-0')).toHaveTextContent('Answer 1');
        expect(screen.getByTestId('answer-0-1')).toHaveTextContent('Answer 2');
        expect(screen.getByTestId('answer-1-0')).toHaveTextContent('Answer 3');
      });
    });

    it('treats whitespace-only answers as unanswered', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Set Whitespace 0-0'));

      await waitFor(() => {
        expect(screen.getByTestId('answered-0-0')).toHaveTextContent('no');
      });
    });

    it('clears all answers for a plan', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Set some answers
      await user.click(screen.getByText('Set Answer 0-0'));
      await user.click(screen.getByText('Set Answer 0-1'));

      await waitFor(() => {
        expect(screen.getByTestId('answered-0-0')).toHaveTextContent('yes');
      });

      // Clear all
      await user.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(screen.getByTestId('answer-0-0')).toHaveTextContent('');
        expect(screen.getByTestId('answer-0-1')).toHaveTextContent('');
        expect(screen.getByTestId('answered-0-0')).toHaveTextContent('no');
      });
    });
  });

  describe('Validation Logic', () => {
    it('reports invalid when no questions are answered', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Validate'));

      await waitFor(() => {
        expect(screen.getByTestId('is-valid')).toHaveTextContent('invalid');
        expect(screen.getByTestId('total-questions')).toHaveTextContent('3');
        expect(screen.getByTestId('unanswered-count')).toHaveTextContent('3');
        expect(screen.getByTestId('errors-count')).toHaveTextContent('3');
      });
    });

    it('reports valid when all questions are answered', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Answer all questions
      await user.click(screen.getByText('Set Answer 0-0'));
      await user.click(screen.getByText('Set Answer 0-1'));
      await user.click(screen.getByText('Set Answer 1-0'));

      await user.click(screen.getByText('Validate'));

      await waitFor(() => {
        expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');
        expect(screen.getByTestId('total-questions')).toHaveTextContent('3');
        expect(screen.getByTestId('unanswered-count')).toHaveTextContent('0');
        expect(screen.getByTestId('errors-count')).toHaveTextContent('0');
      });
    });

    it('reports invalid when some questions are unanswered', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Answer only one question
      await user.click(screen.getByText('Set Answer 0-0'));

      await user.click(screen.getByText('Validate'));

      await waitFor(() => {
        expect(screen.getByTestId('is-valid')).toHaveTextContent('invalid');
        expect(screen.getByTestId('unanswered-count')).toHaveTextContent('2');
      });
    });

    it('treats whitespace-only answers as invalid', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Set whitespace answer
      await user.click(screen.getByText('Set Whitespace 0-0'));
      await user.click(screen.getByText('Set Answer 0-1'));
      await user.click(screen.getByText('Set Answer 1-0'));

      await user.click(screen.getByText('Validate'));

      await waitFor(() => {
        expect(screen.getByTestId('is-valid')).toHaveTextContent('invalid');
        expect(screen.getByTestId('unanswered-count')).toHaveTextContent('1');
      });
    });

    it('handles plans with zero questions as valid', async () => {
      const user = userEvent.setup();
      
      // Custom component with no questions
      function NoQuestionsTest() {
        const { validateAnswers } = usePlanAnswers();
        const [result, setResult] = React.useState<any>(null);

        return (
          <div>
            <button onClick={() => {
              const validation = validateAnswers('test-plan', []);
              setResult(validation);
            }}>
              Validate Empty
            </button>
            {result && (
              <div data-testid="validation-result">
                <div data-testid="is-valid">{result.isValid ? 'valid' : 'invalid'}</div>
                <div data-testid="total-questions">{result.totalQuestions}</div>
              </div>
            )}
          </div>
        );
      }

      render(
        <PlanAnswersProvider config={{ enableSessionStorage: false }}>
          <NoQuestionsTest />
        </PlanAnswersProvider>
      );

      await user.click(screen.getByText('Validate Empty'));

      await waitFor(() => {
        expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');
        expect(screen.getByTestId('total-questions')).toHaveTextContent('0');
      });
    });
  });

  describe('Plan Isolation', () => {
    it('keeps answers separate for different plans', async () => {
      const user = userEvent.setup();
      
      // Custom component that switches between plans
      function MultiPlanTest() {
        const [currentPlan, setCurrentPlan] = React.useState('plan-1');
        const { setAnswer, getAnswer } = usePlanAnswers();

        return (
          <div>
            <button onClick={() => setCurrentPlan('plan-1')}>Plan 1</button>
            <button onClick={() => setCurrentPlan('plan-2')}>Plan 2</button>
            <button onClick={() => setAnswer(currentPlan, 0, 0, `Answer for ${currentPlan}`)}>
              Set Answer
            </button>
            <div data-testid="current-plan">{currentPlan}</div>
            <div data-testid="answer">{getAnswer(currentPlan, 0, 0)}</div>
          </div>
        );
      }

      render(
        <PlanAnswersProvider config={{ enableSessionStorage: false }}>
          <MultiPlanTest />
        </PlanAnswersProvider>
      );

      // Set answer for plan-1
      await user.click(screen.getByText('Plan 1'));
      await user.click(screen.getByText('Set Answer'));
      await waitFor(() => {
        expect(screen.getByTestId('answer')).toHaveTextContent('Answer for plan-1');
      });

      // Switch to plan-2 and set different answer
      await user.click(screen.getByText('Plan 2'));
      await user.click(screen.getByText('Set Answer'));
      await waitFor(() => {
        expect(screen.getByTestId('answer')).toHaveTextContent('Answer for plan-2');
      });

      // Switch back to plan-1, answer should still be there
      await user.click(screen.getByText('Plan 1'));
      await waitFor(() => {
        expect(screen.getByTestId('answer')).toHaveTextContent('Answer for plan-1');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles large numbers of questions efficiently', async () => {
      const user = userEvent.setup();
      
      function LargeTest() {
        const { validateAnswers } = usePlanAnswers();
        const [result, setResult] = React.useState<any>(null);

        // Create 100 specs with 10 questions each
        const largeSpecs = Array.from({ length: 100 }, () => ({
          open_questions: Array.from({ length: 10 }, (_, i) => `Question ${i}?`),
        }));

        return (
          <div>
            <button onClick={() => {
              const start = performance.now();
              const validation = validateAnswers('test-plan', largeSpecs);
              const duration = performance.now() - start;
              setResult({ ...validation, duration });
            }}>
              Validate Large
            </button>
            {result && (
              <div data-testid="validation-result">
                <div data-testid="total-questions">{result.totalQuestions}</div>
                <div data-testid="duration">{result.duration}</div>
              </div>
            )}
          </div>
        );
      }

      render(
        <PlanAnswersProvider config={{ enableSessionStorage: false }}>
          <LargeTest />
        </PlanAnswersProvider>
      );

      await user.click(screen.getByText('Validate Large'));

      await waitFor(() => {
        expect(screen.getByTestId('total-questions')).toHaveTextContent('1000');
        // Validation should complete in reasonable time (< 100ms)
        const duration = parseFloat(screen.getByTestId('duration').textContent || '0');
        expect(duration).toBeLessThan(100);
      });
    });

    it('handles specs without open_questions field', async () => {
      const user = userEvent.setup();
      
      function MissingFieldsTest() {
        const { validateAnswers } = usePlanAnswers();
        const [result, setResult] = React.useState<any>(null);

        const specs = [
          {}, // Missing open_questions
          { open_questions: undefined }, // Explicit undefined
          { open_questions: ['Question?'] }, // Normal
        ];

        return (
          <div>
            <button onClick={() => {
              const validation = validateAnswers('test-plan', specs);
              setResult(validation);
            }}>
              Validate
            </button>
            {result && (
              <div data-testid="validation-result">
                <div data-testid="total-questions">{result.totalQuestions}</div>
              </div>
            )}
          </div>
        );
      }

      render(
        <PlanAnswersProvider config={{ enableSessionStorage: false }}>
          <MissingFieldsTest />
        </PlanAnswersProvider>
      );

      await user.click(screen.getByText('Validate'));

      await waitFor(() => {
        // Should only count the one question from the third spec
        expect(screen.getByTestId('total-questions')).toHaveTextContent('1');
      });
    });
  });
});
