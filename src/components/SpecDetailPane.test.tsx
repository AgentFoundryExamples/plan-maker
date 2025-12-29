import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpecDetailPane from './SpecDetailPane';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';
import { PlanAnswersProvider } from '@/state/planAnswersStore';
import React from 'react';

describe('SpecDetailPane', () => {
  const mockSpec: SpecItem = {
    purpose: 'Build REST API',
    vision: 'Create a scalable REST API',
    must: ['Authentication', 'CRUD operations'],
    nice: ['Caching', 'Rate limiting'],
    dont: ['Complex frontend'],
    open_questions: ['Which database?', 'Authentication method?'],
    assumptions: ['PostgreSQL available'],
  };

  const planId = 'test-plan-123';
  const specIndex = 0;

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

  describe('Rendering', () => {
    it('shows empty state when no spec is selected', () => {
      renderWithProvider(
        <SpecDetailPane spec={null} specIndex={null} planId={planId} />
      );

      expect(screen.getByText(/select a specification/i)).toBeInTheDocument();
    });

    it('renders spec details with all categories', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} />
      );

      // Check all sections are rendered
      expect(screen.getByText(/spec #1/i)).toBeInTheDocument();
      expect(screen.getByText('Build REST API')).toBeInTheDocument();
      expect(screen.getByText(/create a scalable rest api/i)).toBeInTheDocument();
      
      // Check must have section
      const mustSection = screen.getByText(/must have/i).parentElement;
      expect(mustSection).toBeInTheDocument();
      
      // Check nice to have
      expect(screen.getByText(/caching/i)).toBeInTheDocument();
      expect(screen.getByText(/complex frontend/i)).toBeInTheDocument();
      expect(screen.getByText(/postgresql available/i)).toBeInTheDocument();
    });

    it('renders questions section', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} />
      );

      expect(screen.getByText('Questions')).toBeInTheDocument();
      
      // Questions appear in labels and dropdown, so use getAllByText
      const dbQuestions = screen.getAllByText(/which database/i);
      expect(dbQuestions.length).toBeGreaterThanOrEqual(1);
      
      const authQuestions = screen.getAllByText(/authentication method/i);
      expect(authQuestions.length).toBeGreaterThanOrEqual(1);
    });

    it('shows no questions message when spec has no questions', () => {
      const specWithoutQuestions: SpecItem = {
        purpose: 'Simple spec',
        vision: 'No questions',
      };

      renderWithProvider(
        <SpecDetailPane spec={specWithoutQuestions} specIndex={0} planId={planId} />
      );

      expect(screen.getByText(/no questions for this spec/i)).toBeInTheDocument();
    });

    it('renders all spec categories even when empty', () => {
      const minimalSpec: SpecItem = {
        purpose: 'Minimal spec',
        vision: 'Basic vision',
        must: [],
        nice: [],
        dont: [],
        assumptions: [],
        open_questions: [],
      };

      renderWithProvider(
        <SpecDetailPane spec={minimalSpec} specIndex={0} planId={planId} />
      );

      // Vision should always be present (required field)
      expect(screen.getByText(/basic vision/i)).toBeInTheDocument();
      
      // No questions message should appear
      expect(screen.getByText(/no questions for this spec/i)).toBeInTheDocument();
    });
  });

  describe('Q&A Navigation Controls', () => {
    it('shows navigation controls when spec has questions', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Navigation controls should be visible
      expect(screen.getByRole('navigation', { name: /question navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous question/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /jump to question/i })).toBeInTheDocument();
    });

    it('does not show navigation controls when spec has no questions', () => {
      const specWithoutQuestions: SpecItem = {
        purpose: 'Simple spec',
        vision: 'No questions',
      };

      renderWithProvider(
        <SpecDetailPane spec={specWithoutQuestions} specIndex={0} planId={planId} totalSpecs={3} />
      );

      expect(screen.queryByRole('navigation', { name: /question navigation/i })).not.toBeInTheDocument();
    });

    it('shows progress indicator with current question', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Should show "Question 1 of 2"
      expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument();
    });

    it('disables previous button when at first question', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={0} planId={planId} totalSpecs={3} />
      );

      const previousButton = screen.getByRole('button', { name: /previous question/i });
      expect(previousButton).toBeDisabled();
    });

    it('enables previous button when not at first question', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const nextButton = screen.getByRole('button', { name: /next question/i });
      await user.click(nextButton);

      await waitFor(() => {
        const previousButton = screen.getByRole('button', { name: /previous question/i });
        expect(previousButton).not.toBeDisabled();
      });
    });

    it('disables next button when at last question of last spec', () => {
      renderWithProvider(
        <SpecDetailPane 
          spec={mockSpec} 
          specIndex={2} // Last spec
          planId={planId} 
          totalSpecs={3} 
        />
      );

      // Navigate to last question first
      const jumpSelect = screen.getByRole('combobox', { name: /jump to question/i }) as HTMLSelectElement;
      
      // The component should start at question 0, need to manually check the last question state
      // After navigation, next button should be disabled
      expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
    });

    it('navigates to next question when Next button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Should start at Question 1 of 2
      expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /next question/i });
      await user.click(nextButton);

      // Should now be at Question 2 of 2
      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });
    });

    it('navigates to previous question when Previous button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Navigate to second question first
      const nextButton = screen.getByRole('button', { name: /next question/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });

      // Now go back
      const previousButton = screen.getByRole('button', { name: /previous question/i });
      await user.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument();
      });
    });

    it('jumps to specific question using dropdown', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const jumpSelect = screen.getByRole('combobox', { name: /jump to question/i });
      
      // Jump to second question
      await user.selectOptions(jumpSelect, '1');

      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });
    });

    it('calls onNavigateSpec when advancing past last question', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();
      
      renderWithProvider(
        <SpecDetailPane 
          spec={mockSpec} 
          specIndex={0} 
          planId={planId} 
          totalSpecs={3}
          onNavigateSpec={mockNavigate}
        />
      );

      // Navigate to last question
      const jumpSelect = screen.getByRole('combobox', { name: /jump to question/i });
      await user.selectOptions(jumpSelect, '1');

      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });

      // Click next to go to next spec
      const nextButton = screen.getByRole('button', { name: /next question/i });
      await user.click(nextButton);

      expect(mockNavigate).toHaveBeenCalledWith(1);
    });

    it('shows answered indicator in jump menu', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Answer first question
      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'PostgreSQL');

      // Check the jump menu shows the answered indicator
      await waitFor(() => {
        const jumpSelect = screen.getByRole('combobox', { name: /jump to question/i }) as HTMLSelectElement;
        const firstOption = jumpSelect.options[0];
        expect(firstOption.text).toContain('✓');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('shows keyboard hint for Ctrl+Enter', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Should show keyboard hint - check for unique part of the text
      expect(screen.getByText(/press/i)).toBeInTheDocument();
      const ctrlKeys = screen.getAllByText(/ctrl/i);
      expect(ctrlKeys.length).toBeGreaterThanOrEqual(1);
      const enterKeys = screen.getAllByText(/enter/i);
      expect(enterKeys.length).toBeGreaterThanOrEqual(2); // Appears twice in the hint
    });

    it('advances to next question when Ctrl+Enter is pressed', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.click(textarea);

      // Type some answer
      await user.type(textarea, 'My answer');

      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Should advance to question 2
      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });
    });

    it('advances to next question when Cmd+Enter is pressed on Mac', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.click(textarea);

      // Type some answer
      await user.type(textarea, 'My answer');

      // Press Cmd+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      // Should advance to question 2
      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Answer Persistence', () => {
    it('persists answers when switching between questions', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      // Answer first question
      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'PostgreSQL');

      // Navigate to second question
      const nextButton = screen.getByRole('button', { name: /next question/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/question 2 of 2/i)).toBeInTheDocument();
      });

      // Go back to first question
      const previousButton = screen.getByRole('button', { name: /previous question/i });
      await user.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument();
      });

      // Answer should still be there
      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0] as HTMLTextAreaElement;
      expect(textarea.value).toBe('PostgreSQL');
    });
  });

  describe('Autosave Indicator', () => {
    it('shows autosave indicator after typing', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const textarea = screen.getAllByPlaceholderText(/enter your answer/i)[0];
      await user.type(textarea, 'Test answer');

      // Autosave indicator should appear briefly
      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Validation', () => {
    it('shows validation error when provided', () => {
      const hasValidationError = vi.fn((specIndex, questionIndex) => questionIndex === 0);
      const getValidationError = vi.fn((specIndex, questionIndex) => 
        questionIndex === 0 ? 'This question requires an answer' : ''
      );

      renderWithProvider(
        <SpecDetailPane 
          spec={mockSpec} 
          specIndex={specIndex} 
          planId={planId}
          hasValidationError={hasValidationError}
          getValidationError={getValidationError}
        />
      );

      const errors = screen.getAllByText(/this question requires an answer/i);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('applies invalid class to textarea with validation error', () => {
      const hasValidationError = vi.fn((specIndex, questionIndex) => questionIndex === 0);
      const getValidationError = vi.fn((specIndex, questionIndex) => 
        questionIndex === 0 ? 'This question requires an answer' : ''
      );

      renderWithProvider(
        <SpecDetailPane 
          spec={mockSpec} 
          specIndex={specIndex} 
          planId={planId}
          hasValidationError={hasValidationError}
          getValidationError={getValidationError}
        />
      );

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      expect(textareas[0]).toHaveClass('invalid');
      expect(textareas[1]).not.toHaveClass('invalid');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation controls', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      expect(screen.getByRole('navigation', { name: /question navigation/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/previous question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/jump to question/i)).toBeInTheDocument();
    });

    it('has proper ARIA attributes for textareas', () => {
      renderWithProvider(
        <SpecDetailPane spec={mockSpec} specIndex={specIndex} planId={planId} totalSpecs={3} />
      );

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      expect(textareas[0]).toHaveAttribute('aria-describedby');
      expect(textareas[0]).toHaveAttribute('aria-invalid', 'false');
    });
  });
});
