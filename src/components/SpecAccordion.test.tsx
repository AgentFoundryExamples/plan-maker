import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpecAccordion from './SpecAccordion';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';
import { PlanAnswersProvider } from '@/state/planAnswersStore';
import React from 'react';

describe('SpecAccordion', () => {
  const mockSpecs: SpecItem[] = [
    {
      purpose: 'Build REST API',
      vision: 'Create a scalable REST API',
      must: ['Authentication', 'CRUD operations'],
      nice: ['Caching', 'Rate limiting'],
      dont: ['Complex frontend'],
      open_questions: ['Which database?', 'Authentication method?'],
      assumptions: ['PostgreSQL available'],
    },
    {
      purpose: 'Frontend Dashboard',
      vision: 'Build responsive dashboard',
      must: ['Charts', 'Tables'],
      open_questions: ['Which chart library?'],
    },
    {
      purpose: 'No Questions Spec',
      vision: 'Simple spec without questions',
      must: ['Basic feature'],
    },
  ];

  const planId = 'test-plan-123';

  // Helper to render with provider
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <PlanAnswersProvider config={{ enableSessionStorage: false }}>
        {ui}
      </PlanAnswersProvider>
    );
  };

  beforeEach(() => {
    // Reset any persisted state if needed
  });

  describe('Summary Section', () => {
    it('shows total unanswered questions when there are questions', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      expect(screen.getByText('Questions Summary')).toBeInTheDocument();
      // Both inline and sticky summary show this text
      expect(screen.getAllByText(/3 of 3 questions remaining/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows all answered when all questions are answered', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      // Expand first spec and answer questions
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'PostgreSQL');
      await user.type(textareas[1], 'JWT tokens');

      // Expand second spec and answer question
      const secondAccordion = screen.getByRole('button', { name: /spec #2/i });
      await user.click(secondAccordion);

      // Now we have 3 textareas (2 from spec 1, 1 from spec 2)
      const allTextareas = screen.getAllByPlaceholderText(/enter your answer/i);
      const secondTextarea = allTextareas[allTextareas.length - 1];
      await user.type(secondTextarea, 'Chart.js');

      await waitFor(() => {
        expect(screen.getAllByText(/✓ all questions answered/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('does not show summary when there are no questions', () => {
      const noQuestionsSpecs: SpecItem[] = [
        {
          purpose: 'Simple spec',
          vision: 'No questions',
        },
      ];

      renderWithProvider(<SpecAccordion planId={planId} specs={noQuestionsSpecs} />);

      expect(screen.queryByText('Questions Summary')).not.toBeInTheDocument();
    });

    it('updates summary in real-time as answers are typed', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      expect(screen.getAllByText(/3 of 3 questions remaining/i).length).toBeGreaterThanOrEqual(1);

      // Expand first spec and answer one question
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'PostgreSQL');

      await waitFor(() => {
        expect(screen.getAllByText(/2 of 3 questions remaining/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Accordion Behavior', () => {
    it('renders all specs as collapsed by default', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const accordions = screen.getAllByRole('button', { name: /spec #/i });
      expect(accordions).toHaveLength(3);

      accordions.forEach((accordion) => {
        expect(accordion).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('expands spec when header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Create a scalable REST API')).toBeInTheDocument();
    });

    it('collapses spec when header is clicked again', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      
      // Expand
      await user.click(firstAccordion);
      expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      await user.click(firstAccordion);
      expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');
    });

    it('allows multiple specs to be expanded simultaneously', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      const secondAccordion = screen.getByRole('button', { name: /spec #2/i });

      await user.click(firstAccordion);
      await user.click(secondAccordion);

      expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      expect(secondAccordion).toHaveAttribute('aria-expanded', 'true');
    });

    it('preserves answer state when collapsing and re-expanding', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      
      // Expand and type answer
      await user.click(firstAccordion);
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'PostgreSQL database');

      // Collapse
      await user.click(firstAccordion);
      expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');

      // Re-expand
      await user.click(firstAccordion);
      const textareaAfter = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(textareaAfter).toHaveValue('PostgreSQL database');
    });

    it('handles rapid toggling without losing state', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      
      // Expand and type answer
      await user.click(firstAccordion);
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'Test answer');

      // Rapid toggling
      await user.click(firstAccordion);
      await user.click(firstAccordion);
      await user.click(firstAccordion);
      await user.click(firstAccordion);

      // Should still have the answer
      const textareaAfter = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(textareaAfter).toHaveValue('Test answer');
    });
  });

  describe('Question Indicators', () => {
    it('shows unanswered count badge in header', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      expect(screen.getByText(/2 unanswered/i)).toBeInTheDocument();
      expect(screen.getByText(/1 unanswered/i)).toBeInTheDocument();
    });

    it('shows "No questions" badge for specs without questions', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      expect(screen.getByLabelText(/no questions/i)).toBeInTheDocument();
    });

    it('updates badge to "All answered" when all questions are answered', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'Answer 1');
      await user.type(textareas[1], 'Answer 2');

      await waitFor(() => {
        const badge = within(firstAccordion).getByText(/✓ all answered/i);
        expect(badge).toBeInTheDocument();
      });
    });

    it('shows answered/unanswered indicator for each question', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      // Initially all unanswered
      const unansweredIndicators = screen.getAllByText(/○ unanswered/i);
      expect(unansweredIndicators.length).toBeGreaterThanOrEqual(2);

      // Answer one question
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'My answer');

      // Should have one answered
      await waitFor(() => {
        expect(screen.getByText(/✓ answered/i)).toBeInTheDocument();
      });
    });

    it('updates indicator immediately as user types', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      
      // Type a single character
      await user.type(textarea, 'A');

      // Should immediately show as answered
      await waitFor(() => {
        expect(screen.getByText(/✓ answered/i)).toBeInTheDocument();
      });
    });

    it('reverts to unanswered when answer is cleared', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      
      // Type answer
      await user.type(textarea, 'Answer');
      await waitFor(() => {
        expect(screen.getByText(/✓ answered/i)).toBeInTheDocument();
      });

      // Clear answer
      await user.clear(textarea);
      await waitFor(() => {
        expect(screen.queryByText(/✓ answered/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Spec Details Display', () => {
    it('displays all spec sections when expanded', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      expect(screen.getByText('Vision:')).toBeInTheDocument();
      expect(screen.getByText('Create a scalable REST API')).toBeInTheDocument();
      expect(screen.getByText('Must Have:')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Nice to Have:')).toBeInTheDocument();
      expect(screen.getByText('Caching')).toBeInTheDocument();
      expect(screen.getByText("Don't:")).toBeInTheDocument();
      expect(screen.getByText('Complex frontend')).toBeInTheDocument();
      expect(screen.getByText('Assumptions:')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL available')).toBeInTheDocument();
    });

    it('handles specs with missing optional fields', async () => {
      const user = userEvent.setup();
      const minimalSpecs: SpecItem[] = [
        {
          purpose: 'Minimal spec',
          vision: 'Simple vision',
          open_questions: ['Question?'],
        },
      ];

      renderWithProvider(<SpecAccordion planId={planId} specs={minimalSpecs} />);

      const accordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(accordion);

      expect(screen.getByText('Simple vision')).toBeInTheDocument();
      expect(screen.queryByText('Must Have:')).not.toBeInTheDocument();
      expect(screen.queryByText('Nice to Have:')).not.toBeInTheDocument();
    });

    it('shows "No questions for this spec" message when no questions', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const thirdAccordion = screen.getByRole('button', { name: /spec #3/i });
      await user.click(thirdAccordion);

      expect(screen.getByText('No questions for this spec')).toBeInTheDocument();
    });
  });

  describe('Question and Answer Interaction', () => {
    it('renders textarea for each question', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      expect(textareas).toHaveLength(2);
    });

    it('displays question text correctly', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      expect(screen.getByText('Which database?')).toBeInTheDocument();
      expect(screen.getByText('Authentication method?')).toBeInTheDocument();
    });

    it('allows typing in textarea', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'PostgreSQL with replication');

      expect(textarea).toHaveValue('PostgreSQL with replication');
    });

    it('preserves answers across different specs', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      // Answer question in first spec
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);
      const firstTextarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(firstTextarea, 'First answer');

      // Answer question in second spec
      const secondAccordion = screen.getByRole('button', { name: /spec #2/i });
      await user.click(secondAccordion);
      // Now we have 3 textareas (2 from spec 1, 1 from spec 2)
      const allTextareas = screen.getAllByPlaceholderText(/enter your answer/i);
      const secondTextarea = allTextareas[allTextareas.length - 1];
      await user.type(secondTextarea, 'Second answer');

      // Verify first spec still has its answer
      const firstTextareaAfter = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(firstTextareaAfter).toHaveValue('First answer');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty specs array', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={[]} />);

      expect(screen.queryByRole('button', { name: /spec #/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Questions Summary')).not.toBeInTheDocument();
    });

    it('handles very long question text without breaking layout', async () => {
      const user = userEvent.setup();
      const longQuestionSpecs: SpecItem[] = [
        {
          purpose: 'Test',
          vision: 'Test',
          open_questions: [
            'This is a very long question that should wrap properly without breaking the layout and should remain readable even when it extends to multiple lines and contains lots of text',
          ],
        },
      ];

      renderWithProvider(<SpecAccordion planId={planId} specs={longQuestionSpecs} />);

      const accordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(accordion);

      const question = screen.getByText(/this is a very long question/i);
      expect(question).toBeInTheDocument();
    });

    it('handles large number of specs (50+)', () => {
      const manySpecs: SpecItem[] = Array.from({ length: 60 }, (_, i) => ({
        purpose: `Spec ${i + 1}`,
        vision: `Vision ${i + 1}`,
        open_questions: [`Question ${i + 1}?`],
      }));

      renderWithProvider(<SpecAccordion planId={planId} specs={manySpecs} />);

      const accordions = screen.getAllByRole('button', { name: /spec #/i });
      expect(accordions).toHaveLength(60);
    });

    it('uses unique keys for answer state', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      // Answer same question index in different specs
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);
      const firstTextarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(firstTextarea, 'First spec answer');

      const secondAccordion = screen.getByRole('button', { name: /spec #2/i });
      await user.click(secondAccordion);
      // Now we have 3 textareas total (2 from spec 1, 1 from spec 2)
      const allTextareas = screen.getAllByPlaceholderText(/enter your answer/i);
      const secondTextarea = allTextareas[allTextareas.length - 1]; // Get the last one
      await user.type(secondTextarea, 'Second spec answer');

      // Verify answers are not mixed
      const firstTextareaAfter = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(firstTextareaAfter).toHaveValue('First spec answer');
      expect(secondTextarea).toHaveValue('Second spec answer');
    });

    it('handles whitespace-only answers as unanswered', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, '   ');

      // Should still be unanswered
      const unansweredIndicators = screen.getAllByText(/○ unanswered/i);
      expect(unansweredIndicators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('uses proper ARIA attributes for accordion', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const accordions = screen.getAllByRole('button', { name: /spec #/i });
      accordions.forEach((accordion, index) => {
        expect(accordion).toHaveAttribute('aria-expanded', 'false');
        expect(accordion).toHaveAttribute('aria-controls', `spec-content-${index}`);
        expect(accordion).toHaveAttribute('id', `spec-header-${index}`);
      });
    });

    it('associates labels with textarea inputs', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      textareas.forEach((textarea) => {
        expect(textarea).toHaveAttribute('id');
      });
      
      // Verify labels exist for the questions
      expect(screen.getByLabelText('Which database?')).toBeInTheDocument();
      expect(screen.getByLabelText('Authentication method?')).toBeInTheDocument();
    });

    it('uses aria-live for summary updates', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const summary = screen.getByRole('status');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });

    it('provides visually hidden status text for screen readers', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      // Check for visually hidden status text
      const hiddenStatuses = document.querySelectorAll('.visually-hidden');
      expect(hiddenStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Answer Persistence', () => {
    it('persists answers when accordion is collapsed and re-expanded', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      
      // Expand and type answer
      await user.click(firstAccordion);
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'PostgreSQL database');

      // Collapse
      await user.click(firstAccordion);
      expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');

      // Re-expand
      await user.click(firstAccordion);
      const textareaAfter = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(textareaAfter).toHaveValue('PostgreSQL database');
    });

    it('maintains separate answers for different plans', async () => {
      const user = userEvent.setup();
      
      // Render with plan-1
      const { unmount } = renderWithProvider(<SpecAccordion planId="plan-1" specs={mockSpecs} />);

      // Answer question in plan-1
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'Plan 1 answer');

      unmount();

      // Render with plan-2
      renderWithProvider(<SpecAccordion planId="plan-2" specs={mockSpecs} />);

      // Answer should be empty for plan-2
      const firstAccordionPlan2 = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordionPlan2);
      const textareaPlan2 = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      expect(textareaPlan2).toHaveValue('');
    });
  });

  describe('Sticky Summary', () => {
    // Mock scrollIntoView for all tests in this suite
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });

    it('shows sticky summary bar with progress', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const stickyBar = screen.getByRole('region', { name: /questions progress summary/i });
      expect(stickyBar).toBeInTheDocument();
      expect(stickyBar).toHaveAttribute('data-position', 'bottom');
    });

    it('shows quick links to unanswered specs', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      const spec1Link = screen.getByRole('button', { name: /go to spec 1/i });
      const spec2Link = screen.getByRole('button', { name: /go to spec 2/i });
      
      expect(spec1Link).toBeInTheDocument();
      expect(spec2Link).toBeInTheDocument();
    });

    it('can hide sticky summary via prop', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} showStickySummary={false} />);

      const stickyBar = screen.queryByRole('region', { name: /questions progress summary/i });
      expect(stickyBar).not.toBeInTheDocument();
    });

    it('can change sticky position via prop', () => {
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} stickyPosition="top" />);

      const stickyBar = screen.getByRole('region', { name: /questions progress summary/i });
      expect(stickyBar).toHaveAttribute('data-position', 'top');
    });

    it('expands spec when clicking quick link', async () => {
      const user = userEvent.setup();
      
      renderWithProvider(<SpecAccordion planId={planId} specs={mockSpecs} />);

      // Check that spec 1 is not expanded initially
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');

      // Click the quick link
      const spec1Link = screen.getByRole('button', { name: /go to spec 1/i });
      await user.click(spec1Link);

      // Check that spec 1 accordion is now expanded
      await waitFor(() => {
        expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Validation Integration', () => {
    // Mock scrollIntoView for tests that trigger auto-scroll
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
      HTMLElement.prototype.focus = vi.fn();
    });

    it('auto-expands and scrolls to first error when showValidationErrors is true', async () => {
      const scrollMock = vi.fn();
      Element.prototype.scrollIntoView = scrollMock;

      const validationResult = {
        isValid: false,
        totalQuestions: 2,
        unansweredCount: 2,
        errors: [
          {
            specIndex: 0,
            questionIndex: 0,
            question: 'Which database?',
            error: 'This question requires an answer',
          },
          {
            specIndex: 0,
            questionIndex: 1,
            question: 'Authentication method?',
            error: 'This question requires an answer',
          },
        ],
        unansweredBySpec: new Map([[0, [0, 1]]]),
      };

      renderWithProvider(
        <SpecAccordion 
          planId={planId} 
          specs={mockSpecs}
          validationResult={validationResult}
          showValidationErrors={true}
        />
      );

      // Should auto-expand first spec with errors and scroll to first question
      await waitFor(() => {
        const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
        expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 500 });

      // Should see validation error messages
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/this question requires an answer/i);
        expect(errorMessages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('applies invalid class to textarea with validation error', async () => {
      const validationResult = {
        isValid: false,
        totalQuestions: 2,
        unansweredCount: 1,
        errors: [
          {
            specIndex: 0,
            questionIndex: 0,
            question: 'Which database?',
            error: 'This question requires an answer',
          },
        ],
        unansweredBySpec: new Map([[0, [0]]]),
      };

      renderWithProvider(
        <SpecAccordion 
          planId={planId} 
          specs={mockSpecs}
          validationResult={validationResult}
          showValidationErrors={true}
        />
      );

      // Wait for auto-expand
      await waitFor(() => {
        const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
        expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 500 });

      // First textarea should have invalid class
      await waitFor(() => {
        const textareas = screen.queryAllByPlaceholderText(/enter your answer/i);
        expect(textareas.length).toBeGreaterThan(0);
        if (textareas[0]) {
          expect(textareas[0]).toHaveClass('invalid');
          expect(textareas[0]).toHaveAttribute('aria-invalid', 'true');
        }
      });
    });

    it('does not show validation errors when showValidationErrors is false', async () => {
      const user = userEvent.setup();
      const validationResult = {
        isValid: false,
        totalQuestions: 2,
        unansweredCount: 2,
        errors: [
          {
            specIndex: 0,
            questionIndex: 0,
            question: 'Which database?',
            error: 'This question requires an answer',
          },
        ],
        unansweredBySpec: new Map([[0, [0]]]),
      };

      renderWithProvider(
        <SpecAccordion 
          planId={planId} 
          specs={mockSpecs}
          validationResult={validationResult}
          showValidationErrors={false}
        />
      );

      // Manually expand first spec
      const firstAccordion = screen.getByRole('button', { name: /spec #1/i });
      await user.click(firstAccordion);

      await waitFor(() => {
        expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
      });

      // Should not see validation error messages
      const errorMessages = screen.queryAllByText(/this question requires an answer/i);
      expect(errorMessages.length).toBe(0);
    });
  });
});
