import React from 'react';
import type { PlanValidationResult } from '@/state/planAnswersStore';
import type { SubmissionMetadata } from '@/state/submissionMetadataStore';
import { formatQuestionCount, getQuestionText } from '@/utils/textUtils';
import { formatTimestamp } from '@/utils/dateUtils';

/**
 * Configuration for PlanStatusBar behavior
 * All settings are adjustable via this interface
 */
export interface PlanStatusBarConfig {
  /** Position of the status bar */
  position: 'top' | 'bottom';
  /** Offset from edge in pixels */
  offset: number;
  /** Whether to use sticky positioning */
  sticky: boolean;
  /** Maximum height for the bar in pixels */
  maxHeight: number;
}

/**
 * Default configuration for PlanStatusBar
 */
export const DEFAULT_STATUS_BAR_CONFIG: PlanStatusBarConfig = {
  position: 'top',
  offset: 0,
  sticky: true,
  maxHeight: 120,
};

/**
 * Props for PlanStatusBar component
 */
export interface PlanStatusBarProps {
  /** Validation result from plan answers */
  validationResult: PlanValidationResult | null;
  /** Submission metadata for the current plan */
  submissionMetadata: SubmissionMetadata | null;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Callback when Submit for Clarification is clicked */
  onSubmit: () => void;
  /** Whether there are questions to answer */
  hasQuestions: boolean;
  /** Optional configuration override */
  config?: Partial<PlanStatusBarConfig>;
  /** Optional CSS class name */
  className?: string;
}

/**
 * PlanStatusBar Component
 * 
 * Displays clarification progress and submission controls in a compact bar
 * above the three-pane layout. Provides visibility for critical actions
 * without requiring scrolling.
 * 
 * Features:
 * - Shows remaining questions and answered counts
 * - Displays submission status badges
 * - Contains Submit for Clarification button with validation
 * - Sticky positioning option
 * - Configurable via props
 * - Theme-aligned styling
 * 
 * Edge Cases:
 * - Zero-question plans hide progress but show submission state
 * - Long status text wraps without excessive height increase
 * - Disabled state when answers incomplete or submitting
 * 
 * Usage:
 * ```tsx
 * <PlanStatusBar
 *   validationResult={validationResult}
 *   submissionMetadata={submissionMetadata}
 *   isSubmitting={isPending}
 *   onSubmit={handleSubmit}
 *   hasQuestions={hasQuestions}
 * />
 * ```
 */
export const PlanStatusBar: React.FC<PlanStatusBarProps> = ({
  validationResult,
  submissionMetadata,
  isSubmitting,
  onSubmit,
  hasQuestions,
  config: configOverride,
  className = '',
}) => {
  const config = { ...DEFAULT_STATUS_BAR_CONFIG, ...configOverride };

  // Don't render if there are no questions
  if (!hasQuestions) {
    return null;
  }

  // Determine if submission should be enabled
  const canSubmit = validationResult?.isValid && !isSubmitting;

  // Build status text
  const getStatusText = (): string => {
    if (!validationResult) {
      return 'Loading...';
    }

    if (validationResult.isValid) {
      return `✓ All ${formatQuestionCount(validationResult.totalQuestions)} answered`;
    }

    return `⚠ ${formatQuestionCount(validationResult.unansweredCount, ' remaining')}`;
  };

  // Build helper text
  const getHelperText = (): string | null => {
    if (!validationResult || validationResult.isValid) {
      return null;
    }

    return `Please answer all ${getQuestionText(validationResult.unansweredCount)} before submitting.`;
  };

  return (
    <div
      className={`plan-status-bar ${config.sticky ? 'plan-status-bar-sticky' : ''} ${className}`.trim()}
      data-position={config.position}
      style={{
        maxHeight: `${config.maxHeight}px`,
      }}
      role="region"
      aria-label="Clarification status and submission controls"
    >
      <div className="plan-status-bar-content">
        <div className="plan-status-bar-info">
          <div className="plan-status-bar-primary">
            <span 
              className={`plan-status-bar-status ${validationResult?.isValid ? 'status-complete' : 'status-pending'}`}
              role="status"
              aria-live="polite"
            >
              {getStatusText()}
            </span>
            {getHelperText() && (
              <span className="plan-status-bar-helper">
                {getHelperText()}
              </span>
            )}
          </div>
          {submissionMetadata && (
            <div className="plan-status-bar-secondary">
              <span className="plan-status-bar-last-submitted">
                Last submitted: <time dateTime={submissionMetadata.submittedAt}>
                  {formatTimestamp(submissionMetadata.submittedAt)}
                </time>
                {submissionMetadata.jobId && (
                  <span className="plan-status-bar-job-id"> (Job: {submissionMetadata.jobId})</span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="plan-status-bar-actions">
          <button
            type="button"
            className="btn btn-primary btn-submit-clarifications"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-busy={isSubmitting}
            title={
              !validationResult
                ? 'Loading...'
                : validationResult.isValid
                ? 'Submit your answers for clarification'
                : `Please answer ${formatQuestionCount(validationResult.unansweredCount, ' remaining')}`
            }
          >
            {isSubmitting ? (
              <span className="submission-loading">
                <span className="submission-spinner" aria-hidden="true" />
                Submitting...
              </span>
            ) : (
              'Submit for Clarification'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanStatusBar;
