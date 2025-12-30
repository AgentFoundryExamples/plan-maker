import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { usePlanDetail, useSubmitClarifications, useClarificationStatus } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import { formatTimestamp } from '@/utils/dateUtils';
import { truncateJobId, formatQuestionCount } from '@/utils/textUtils';
import SpecListPane from '@/components/SpecListPane';
import SpecDetailPane from '@/components/SpecDetailPane';
import ClarifierPanel from '@/components/ClarifierPanel';
import PlanTimeline from '@/components/PlanTimeline';
import PlanStatusBar from '@/components/PlanStatusBar';
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb';
import { usePlanAnswers } from '@/state/planAnswersStore';
import { useSubmissionMetadata } from '@/state/submissionMetadataStore';
import { getClarifierJobId } from '@/utils/clarifierStorage';
import type { QuestionAnswer } from '@/api/specClarifier/models/QuestionAnswer';
import '@/styles/PlansListPage.css';
import '@/styles/PlanDetailPage.css';

// Shared breakpoint constant - must match CSS --dual-pane-breakpoint
const MOBILE_BREAKPOINT = 768;

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error, refetch } = usePlanDetail(id);
  const { validateAnswers, getAnswer } = usePlanAnswers();
  const { getSubmission, setSubmission } = useSubmissionMetadata();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [submissionBanner, setSubmissionBanner] = useState<{
    type: 'error' | 'success';
    title: string;
    message: string;
  } | null>(null);
  const [clarifierJobIdForTimeline, setClarifierJobIdForTimeline] = useState<string | null>(null);
  
  // Dual-pane layout: Track viewport size to determine layout mode
  // Initialize in useEffect to avoid hydration issues with SSR
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Dual-pane layout: Selected spec index (synced with URL)
  const [selectedSpecIndex, setSelectedSpecIndex] = useState<number | null>(null);
  
  // Track if spec selection has been initialized to prevent race conditions
  const [isSpecInitialized, setIsSpecInitialized] = useState(false);
  
  // Mobile navigation: Track which view is active (spec-list, spec-detail, or null for default)
  // On mobile: spec-list shows full-screen spec list, spec-detail shows selected spec detail
  // On desktop: always null (dual-pane layout always visible)
  const [mobileView, setMobileView] = useState<'spec-list' | 'spec-detail' | null>(null);

  // Handle viewport resize with debouncing (consolidated with initial check)
  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
      setIsDesktop(newIsDesktop);
      
      // Reset mobile view when switching to desktop
      if (newIsDesktop) {
        setMobileView(null);
      } else if (mobileView === null && selectedSpecIndex !== null) {
        // Initialize mobile view when switching to mobile with a spec selected
        setMobileView('spec-detail');
      }
    };

    handleResize(); // Initial check

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [mobileView, selectedSpecIndex]);

  // Initialize selected spec from URL or default
  useEffect(() => {
    if (!data?.result?.specs || isSpecInitialized) return;
    
    const specs = data.result.specs;
    if (specs.length === 0) return;

    // Try to get spec index from URL
    const specParam = searchParams.get('spec');
    if (specParam !== null) {
      const paramIndex = parseInt(specParam, 10);
      if (!isNaN(paramIndex) && paramIndex >= 0 && paramIndex < specs.length) {
        setSelectedSpecIndex(paramIndex);
        setIsSpecInitialized(true);
        // On mobile, transition to spec detail view when spec is auto-selected
        if (!isDesktop) {
          setMobileView('spec-detail');
        }
        return;
      }
    }

    // Default: Select first spec with unanswered questions, or first spec
    const validationResult = validateAnswers(data.job_id, specs);
    if (validationResult.errors.length > 0) {
      // Find first spec with unanswered questions
      const firstErrorSpecIndex = validationResult.errors[0].specIndex;
      setSelectedSpecIndex(firstErrorSpecIndex);
      setSearchParams({ spec: firstErrorSpecIndex.toString() }, { replace: true });
    } else {
      // No errors, select first spec
      setSelectedSpecIndex(0);
      setSearchParams({ spec: '0' }, { replace: true });
    }
    // On mobile, transition to spec detail view when spec is auto-selected
    if (!isDesktop) {
      setMobileView('spec-detail');
    }
    setIsSpecInitialized(true);
  }, [data, searchParams, setSearchParams, validateAnswers, isSpecInitialized, isDesktop]);

  // Handle spec selection
  const handleSelectSpec = useCallback((index: number) => {
    setSelectedSpecIndex(index);
    setSearchParams({ spec: index.toString() }, { replace: false });
    
    // On mobile, transition to spec detail view when a spec is selected
    if (!isDesktop) {
      setMobileView('spec-detail');
    }
  }, [setSearchParams, isDesktop]);
  
  // Handle back navigation from spec detail to spec list on mobile
  const handleBackToList = useCallback(() => {
    if (!isDesktop) {
      setMobileView('spec-list');
    }
  }, [isDesktop]);

  // Load stored clarifier job ID for timeline
  React.useEffect(() => {
    if (id) {
      const stored = getClarifierJobId(id);
      if (stored) {
        setClarifierJobIdForTimeline(stored.jobId);
      }
    }
  }, [id]);

  // Fetch clarifier status for timeline (only if we have a job ID)
  const { data: clarifierStatus } = useClarificationStatus(
    clarifierJobIdForTimeline || undefined,
    {
      enabled: !!clarifierJobIdForTimeline,
      refetchInterval: false, // No auto-polling
    }
  );

  // Get submission metadata for current plan
  const submissionMetadata = id ? getSubmission(id) : null;

  // Submission mutation
  const submitClarifications = useSubmitClarifications({
    onSuccess: (response) => {
      // Save submission metadata using plan ID from route
      if (id) {
        setSubmission(id, {
          jobId: response.id,
          submittedAt: new Date().toISOString(),
        });
      }

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
    if (!data?.result?.specs) return;

    // Revalidate immediately before submission to ensure current state
    const currentValidation = validateAnswers(data.job_id, data.result.specs);
    
    // Check validation
    if (!currentValidation.isValid) {
      setShowValidationErrors(true);
      setSubmissionBanner({
        type: 'error',
        title: 'Incomplete Answers',
        message: `Please answer all ${formatQuestionCount(currentValidation.unansweredCount, ' remaining')} before submitting.`,
      });
      return;
    }

    // Clear any previous error banner
    setSubmissionBanner(null);
    setShowValidationErrors(false);

    // Build the answers array - only send answers, not the full plan
    const answers: QuestionAnswer[] = [];
    data.result.specs.forEach((spec, specIndex) => {
      const questions = spec.open_questions || [];
      questions.forEach((question, questionIndex) => {
        const answer = getAnswer(data.job_id, specIndex, questionIndex);
        // Sanitize answer by trimming whitespace
        answers.push({
          spec_index: specIndex,
          question_index: questionIndex,
          question,
          answer: answer.trim(),
        });
      });
    });

    // Submit the clarifications with simplified payload
    submitClarifications.mutate({
      plan: {
        specs: data.result.specs,
      },
      answers,
    });
  }, [data, validateAnswers, getAnswer, submitClarifications]);

  // Clear banner when user starts fixing issues
  const dismissBanner = useCallback(() => {
    setSubmissionBanner(null);
  }, []);

  // Handle refresh plan status
  const handleRefreshPlan = useCallback(async () => {
    try {
      await refetch();
    } catch {
      // Error is already handled by query
    }
  }, [refetch]);

  // Handle copy job ID to clipboard
  const handleCopyJobId = useCallback((jobId: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jobId)
        .then(() => {
          setSubmissionBanner({
            type: 'success',
            title: 'Copied!',
            message: 'Plan ID copied to clipboard.',
          });
        })
        .catch(() => {
          setSubmissionBanner({
            type: 'error',
            title: 'Copy Failed',
            message: 'Could not copy Plan ID to clipboard.',
          });
        });
    }
  }, [setSubmissionBanner]);

  // Handle clarification created callback
  const handleClarificationCreated = useCallback((jobId: string) => {
    setClarifierJobIdForTimeline(jobId);
  }, []);

  // Compute breadcrumb items based on state
  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Plans', href: '/plans' },
    ];

    if (isLoading) {
      items.push({ label: 'Loading...' });
    } else if (error) {
      items.push({ label: 'Error' });
    } else if (!data) {
      items.push({ label: 'Invalid' });
    } else {
      items.push({ label: truncateJobId(data.job_id) });
    }

    return items;
  }, [isLoading, error, data]);

  // Render page content based on state
  const renderPageContent = () => {
    // Loading state
    if (isLoading) {
      return (
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
      );
    }

    // Error state
    if (error) {
      return (
        <div className="error-state" role="alert">
          <h2>Failed to Load Plan</h2>
          <p>{error.message || 'Unable to fetch plan details. The plan may not exist or there was a network error.'}</p>
          <Link to="/plans" className="btn btn-primary">
            Back to Plans
          </Link>
        </div>
      );
    }

    // Invalid state
    if (!data) {
      return (
        <div className="error-state" role="alert">
          <h2>Invalid Plan</h2>
          <p>No plan ID provided. Please select a plan from the list.</p>
          <Link to="/plans" className="btn btn-primary">
            Back to Plans
          </Link>
        </div>
      );
    }

    // Success state - render main content
    const statusMeta = getStatusMetadata(data.status);
    const planResult = data.result;
    const specs = planResult?.specs || [];
    const hasQuestions = specs.some(spec => (spec.open_questions?.length || 0) > 0);

    return (
      <>
        {/* Plan Metadata Card */}
        <div className="card mt-lg">
          <div className="plan-card-header plan-header">
            <h2>Plan #{data.job_id}</h2>
            <div className="plan-header-actions">
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
              <button
                type="button"
                className="btn btn-secondary btn-refresh"
                onClick={handleRefreshPlan}
                aria-label="Refresh plan status"
                title="Refresh plan status"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          <div className="plan-card-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Plan ID:</span>
              <div className="metadata-value-with-action">
                <span>{data.job_id}</span>
                <button
                  type="button"
                  className="btn btn-text btn-copy-inline"
                  onClick={() => handleCopyJobId(data.job_id)}
                  aria-label="Copy plan ID to clipboard"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
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
              {/* PlanStatusBar - Shows clarification progress and submission controls */}
              {hasQuestions && (
                <>
                  <PlanStatusBar
                    validationResult={validationResult}
                    submissionMetadata={submissionMetadata}
                    isSubmitting={submitClarifications.isPending}
                    onSubmit={handleSubmit}
                    hasQuestions={hasQuestions}
                  />

                  {/* Submission Banner - Show validation/submission errors close to status bar */}
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
                </>
              )}

              {/* Dual-pane layout for desktop, stacked workflow for mobile */}
              {isDesktop ? (
                <div className="dual-pane-container">
                  <SpecListPane
                    specs={specs}
                    selectedIndex={selectedSpecIndex}
                    onSelectSpec={handleSelectSpec}
                    getUnansweredCount={(spec, index) => {
                      if (!validationResult) return 0;
                      const questions = spec.open_questions || [];
                      if (questions.length === 0) return 0;
                      return validationResult.errors.filter(
                        (err) => err.specIndex === index
                      ).length;
                    }}
                  />
                  <SpecDetailPane
                    spec={selectedSpecIndex !== null ? specs[selectedSpecIndex] : null}
                    specIndex={selectedSpecIndex}
                    planId={data.job_id}
                    totalSpecs={specs.length}
                    onNavigateSpec={handleSelectSpec}
                    hasValidationError={(specIndex, questionIndex) => {
                      if (!showValidationErrors || !validationResult) return false;
                      return validationResult.errors.some(
                        (err) =>
                          err.specIndex === specIndex && err.questionIndex === questionIndex
                      );
                    }}
                    getValidationError={(specIndex, questionIndex) => {
                      if (!showValidationErrors || !validationResult) return '';
                      const error = validationResult.errors.find(
                        (err) =>
                          err.specIndex === specIndex && err.questionIndex === questionIndex
                      );
                      return error?.error || '';
                    }}
                  />
                </div>
              ) : (
                /* Mobile: Stacked workflow with distinct views */
                <div className="mobile-stacked-container">
                  {/* View 1: Spec List (default mobile view or when explicitly selected) */}
                  {(mobileView === 'spec-list' || mobileView === null) && (
                    <SpecListPane
                      specs={specs}
                      selectedIndex={selectedSpecIndex}
                      onSelectSpec={handleSelectSpec}
                      getUnansweredCount={(spec, index) => {
                        if (!validationResult) return 0;
                        const questions = spec.open_questions || [];
                        if (questions.length === 0) return 0;
                        return validationResult.errors.filter(
                          (err) => err.specIndex === index
                        ).length;
                      }}
                    />
                  )}
                  
                  {/* View 2: Spec Detail (shown when a spec is selected) */}
                  {mobileView === 'spec-detail' && selectedSpecIndex !== null && (
                    <SpecDetailPane
                      spec={specs[selectedSpecIndex]}
                      specIndex={selectedSpecIndex}
                      planId={data.job_id}
                      totalSpecs={specs.length}
                      onNavigateSpec={handleSelectSpec}
                      onBackToList={handleBackToList}
                      hasValidationError={(specIndex, questionIndex) => {
                        if (!showValidationErrors || !validationResult) return false;
                        return validationResult.errors.some(
                          (err) =>
                            err.specIndex === specIndex && err.questionIndex === questionIndex
                        );
                      }}
                      getValidationError={(specIndex, questionIndex) => {
                        if (!showValidationErrors || !validationResult) return '';
                        const error = validationResult.errors.find(
                          (err) =>
                            err.specIndex === specIndex && err.questionIndex === questionIndex
                        );
                        return error?.error || '';
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Activity Timeline */}
        {data.status !== 'QUEUED' && (
          <div className="card mt-lg">
            <PlanTimeline
              planJob={data}
              clarifierJob={clarifierStatus || undefined}
              clarifierCreatedAt={clarifierStatus?.created_at || null}
            />
          </div>
        )}

        {/* Clarification Panel */}
        <div className="card mt-lg">
          <ClarifierPanel
            planJob={data}
            onClarificationCreated={handleClarificationCreated}
            validationResult={hasQuestions ? (validationResult || null) : null}
          />
        </div>
      </>
    );
  };

  return (
    <div className="container">
      <Breadcrumb items={breadcrumbItems} />
      <div className="page-header">
        <h1 className="page-title">Plan Details</h1>
      </div>
      {renderPageContent()}
    </div>
  );
};

export default PlanDetailPage;
