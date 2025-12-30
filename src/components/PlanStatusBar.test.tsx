import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanStatusBar } from './PlanStatusBar';
import type { PlanValidationResult } from '@/state/planAnswersStore';
import type { SubmissionMetadata } from '@/state/submissionMetadataStore';

describe('PlanStatusBar', () => {
  const mockValidationResultValid: PlanValidationResult = {
    isValid: true,
    totalQuestions: 5,
    unansweredCount: 0,
    errors: [],
    unansweredBySpec: new Map(),
  };

  const mockValidationResultInvalid: PlanValidationResult = {
    isValid: false,
    totalQuestions: 5,
    unansweredCount: 2,
    errors: [
      { specIndex: 0, questionIndex: 0, question: 'Question 1?', error: 'Required' },
      { specIndex: 1, questionIndex: 1, question: 'Question 2?', error: 'Required' },
    ],
    unansweredBySpec: new Map([[0, [0]], [1, [1]]]),
  };

  const mockSubmissionMetadata: SubmissionMetadata = {
    jobId: '550e8400-e29b-41d4-a716-446655440000',
    submittedAt: '2025-01-01T12:00:00Z',
  };

  describe('Rendering', () => {
    it('renders correctly with valid answers', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('region', { name: /clarification status/i })).toBeInTheDocument();
      expect(screen.getByText(/✓ All 5 questions answered/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit for clarification/i })).toBeInTheDocument();
    });

    it('renders correctly with invalid answers', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultInvalid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByText(/⚠ 2 questions remaining/i)).toBeInTheDocument();
      expect(screen.getByText(/Please answer all questions before submitting/i)).toBeInTheDocument();
    });

    it('does not render when hasQuestions is false', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('displays submission metadata when available', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={mockSubmissionMetadata}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByText(/Last submitted:/i)).toBeInTheDocument();
      expect(screen.getByText(/Job: 550e8400-e29b-41d4-a716-446655440000/i)).toBeInTheDocument();
    });
  });

  describe('Submit Button States', () => {
    it('enables submit button when all answers are valid', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /submit for clarification/i });
      expect(button).not.toBeDisabled();
    });

    it('disables submit button when answers are invalid', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultInvalid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'Please answer 2 questions remaining');
    });

    it('disables submit button when submitting', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={true}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { busy: true });
      expect(button).toBeDisabled();
      expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
    });

    it('calls onSubmit when button is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /submit for clarification/i });
      await user.click(button);

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Display', () => {
    it('shows correct status for all questions answered', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('✓ All 5 questions answered');
      expect(status).toHaveClass('status-complete');
    });

    it('shows correct status for remaining questions', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultInvalid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('⚠ 2 questions remaining');
      expect(status).toHaveClass('status-pending');
    });

    it('shows loading state when validation result is null', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={null}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero questions gracefully', () => {
      const onSubmit = vi.fn();
      const zeroQuestionsResult: PlanValidationResult = {
        isValid: true,
        totalQuestions: 0,
        unansweredCount: 0,
        errors: [],
        unansweredBySpec: new Map(),
      };

      const { container } = render(
        <PlanStatusBar
          validationResult={zeroQuestionsResult}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={false}
        />
      );

      // Should not render when hasQuestions is false
      expect(container.firstChild).toBeNull();
    });

    it('handles single question correctly', () => {
      const onSubmit = vi.fn();
      const singleQuestionResult: PlanValidationResult = {
        isValid: false,
        totalQuestions: 1,
        unansweredCount: 1,
        errors: [{ specIndex: 0, questionIndex: 0, question: 'Question?', error: 'Required' }],
        unansweredBySpec: new Map([[0, [0]]]),
      };

      render(
        <PlanStatusBar
          validationResult={singleQuestionResult}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByText(/⚠ 1 question remaining/i)).toBeInTheDocument();
      expect(screen.getByText(/Please answer all question before submitting/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies sticky positioning by default', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(container.firstChild).toHaveClass('plan-status-bar-sticky');
    });

    it('respects custom config for sticky positioning', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
          config={{ sticky: false }}
        />
      );

      expect(container.firstChild).not.toHaveClass('plan-status-bar-sticky');
    });

    it('respects custom config for position', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
          config={{ position: 'bottom' }}
        />
      );

      expect(container.firstChild).toHaveAttribute('data-position', 'bottom');
    });

    it('applies maxHeight from config', () => {
      const onSubmit = vi.fn();
      const { container } = render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
          config={{ maxHeight: 150 }}
        />
      );

      expect(container.firstChild).toHaveStyle({ maxHeight: '150px' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('region', { name: /clarification status and submission controls/i })).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('uses aria-live for status updates', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('uses aria-busy during submission', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultValid}
          submissionMetadata={null}
          isSubmitting={true}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('provides descriptive title for disabled button', () => {
      const onSubmit = vi.fn();
      render(
        <PlanStatusBar
          validationResult={mockValidationResultInvalid}
          submissionMetadata={null}
          isSubmitting={false}
          onSubmit={onSubmit}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Please answer 2 questions remaining');
    });
  });
});
