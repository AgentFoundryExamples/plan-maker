import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlanDetail, useSubmitClarifications } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import { formatTimestamp } from '@/utils/dateUtils';
import SpecAccordion from '@/components/SpecAccordion';
import { usePlanAnswers } from '@/state/planAnswersStore';
import type { QuestionAnswer } from '@/api/specClarifier/models/QuestionAnswer';
import '@/styles/PlansListPage.css';
import '@/styles/PlanDetailPage.css';

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = usePlanDetail(id);
  const { validateAnswers, getAnswer } = usePlanAnswers();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [submissionBanner, setSubmissionBanner] = useState<{
    type: 'error' | 'success';
    title: string;
    message: string;
  } | null>(null);

  // Submission mutation
  const submitClarifications = useSubmitClarifications({
    onSuccess: (response) => {
      setSubmissionBanner({
        type: 'success',
        title: 'Submission Successful',
        message: `Your clarifications have been submitted successfully. Job ID: ${response.id}`,
      });
      setShowValidationErrors(false);
    },
    onError: (error) => {
      setSubmissionBanner({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit clarifications. Please try again.',
      });
    },
  });

  // Calculate validation state
  const validationResult = useMemo(() => {
    if (!data?.result?.specs) return null;
    return validateAnswers(data.job_id, data.result.specs);
  }, [data, validateAnswers]);

  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!data?.result?.specs || !validationResult) return;

    // Check validation
    if (!validationResult.isValid) {
      setShowValidationErrors(true);
      setSubmissionBanner({
        type: 'error',
        title: 'Incomplete Answers',
        message: `Please answer all ${validationResult.unansweredCount} remaining question${validationResult.unansweredCount !== 1 ? 's' : ''} before submitting.`,
      });
      return;
    }

    // Clear any previous error banner
    setSubmissionBanner(null);
    setShowValidationErrors(false);

    // Build the answers array
    const answers: QuestionAnswer[] = [];
    data.result.specs.forEach((spec, specIndex) => {
      const questions = spec.open_questions || [];
      questions.forEach((question, questionIndex) => {
        const answer = getAnswer(data.job_id, specIndex, questionIndex);
        answers.push({
          spec_index: specIndex,
          question_index: questionIndex,
          question,
          answer: answer.trim(),
        });
      });
    });

    // Submit the clarifications
    submitClarifications.mutate({
      plan: {
        specs: data.result.specs.map(spec => ({
          purpose: spec.purpose,
          vision: spec.vision,
          must: spec.must,
          nice: spec.nice,
          dont: spec.dont,
          open_questions: spec.open_questions,
          assumptions: spec.assumptions,
        })),
      },
      answers,
    });
  }, [data, validationResult, getAnswer, submitClarifications]);

  // Clear banner when user starts fixing issues
  const dismissBanner = useCallback(() => {
    setSubmissionBanner(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="container">
        <Link to="/plans" className="back-link">
          ← Back to Plans List
        </Link>
        <h1>Plan Details</h1>
        <div className="plans-skeleton" role="status" aria-label="Loading plan details">
          <div className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-id" />
              <div className="skeleton-status" />
            </div>
            <div className="skeleton-text" />
            <div className="skeleton-text" />
            <div className="skeleton-text" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <Link to="/plans" className="back-link">
          ← Back to Plans List
        </Link>
        <h1>Plan Details</h1>
        <div className="error-state" role="alert">
          <h2>Failed to Load Plan</h2>
          <p>{error.message || 'Unable to fetch plan details. The plan may not exist or there was a network error.'}</p>
          <Link to="/plans" className="btn btn-primary">
            Back to Plans
          </Link>
        </div>
      </div>
    );
  }

  // Handle case where query is disabled (no planId) or data hasn't loaded yet
  if (!data) {
    return (
      <div className="container">
        <Link to="/plans" className="back-link">
          ← Back to Plans List
        </Link>
        <h1>Plan Details</h1>
        <div className="error-state" role="alert">
          <h2>Invalid Plan</h2>
          <p>No plan ID provided. Please select a plan from the list.</p>
          <Link to="/plans" className="btn btn-primary">
            Back to Plans
          </Link>
        </div>
      </div>
    );
  }

  // Get plan metadata
  const statusMeta = getStatusMetadata(data.status);
  const planResult = data.result;
  const specs = planResult?.specs || [];
  const hasQuestions = specs.some(spec => (spec.open_questions?.length || 0) > 0);

  return (
    <div className="container">
      <Link to="/plans" className="back-link">
        ← Back to Plans List
      </Link>
      <h1>Plan Details</h1>
      
      {/* Plan Metadata Card */}
      <div className="card mt-lg">
        <div className="plan-card-header plan-header">
          <h2>Plan #{data.job_id}</h2>
          <span
            className="status-badge"
            style={{
              backgroundColor: statusMeta.color,
              color: 'var(--color-background)',
            }}
            aria-label={`Status: ${statusMeta.label}`}
          >
            {statusMeta.label}
          </span>
        </div>
        
        <div className="plan-card-metadata">
          <div className="metadata-row">
            <span className="metadata-label">Plan ID:</span>
            <span>{data.job_id}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Status:</span>
            <span>{statusMeta.label}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Created:</span>
            <time dateTime={data.created_at}>
              {formatTimestamp(data.created_at)}
            </time>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Updated:</span>
            <time dateTime={data.updated_at}>
              {formatTimestamp(data.updated_at)}
            </time>
          </div>
        </div>

        {/* Error message if job failed */}
        {data.status === 'FAILED' && data.error && (
          <div className="plan-error-container">
            <h3>Error</h3>
            <p><strong>Type:</strong> {data.error.type}</p>
            <p><strong>Message:</strong> {data.error.error}</p>
          </div>
        )}
      </div>

      {/* Specs Section */}
      <div className="card mt-lg">
        <h2>Specifications</h2>
        {specs.length === 0 ? (
          <div className="empty-state">
            <p>No specs available yet</p>
          </div>
        ) : (
          <>
            <SpecAccordion 
              planId={data.job_id} 
              specs={specs}
              validationResult={validationResult || undefined}
              showValidationErrors={showValidationErrors}
            />

            {/* Submission Section - Only show if there are questions */}
            {hasQuestions && (
              <div className="submission-section">
                {/* Submission Banner */}
                {submissionBanner && (
                  <div 
                    className={`submission-banner ${submissionBanner.type}`}
                    role="alert"
                  >
                    <span className="submission-banner-icon">
                      {submissionBanner.type === 'error' ? '⚠️' : '✓'}
                    </span>
                    <div className="submission-banner-content">
                      <h3 className="submission-banner-title">
                        {submissionBanner.title}
                      </h3>
                      <p className="submission-banner-message">
                        {submissionBanner.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-text"
                      onClick={dismissBanner}
                      aria-label="Dismiss message"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Submission Controls */}
                <div className="submission-controls">
                  {validationResult && (
                    <span className="submission-status">
                      {validationResult.isValid ? (
                        <span style={{ color: 'var(--color-success)' }}>
                          ✓ All questions answered
                        </span>
                      ) : (
                        <span>
                          {validationResult.unansweredCount} question{validationResult.unansweredCount !== 1 ? 's' : ''} remaining
                        </span>
                      )}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-submit"
                    onClick={handleSubmit}
                    disabled={submitClarifications.isPending || (!!validationResult && !validationResult.isValid)}
                    aria-busy={submitClarifications.isPending}
                  >
                    {submitClarifications.isPending ? (
                      <span className="submission-loading">
                        <span className="submission-spinner" aria-hidden="true" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Clarifications'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanDetailPage;
