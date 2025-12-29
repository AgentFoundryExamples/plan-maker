import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlansList } from '@/api/hooks';
import { formatTimestamp } from '@/utils/dateUtils';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import { StatusBadge } from '@/components/StatusBadge';
import '@/styles/PlansListPage.css';

// Configuration constants - adjustable for fine-tuning
const PLANS_LIMIT = 50;
const REFETCH_INTERVAL_MS = 60000; // 60 seconds
const SKELETON_COUNT = 3;
const RECENT_ACTIVITY_COUNT = 5;

const PlansListPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState<string>('');

  const {
    data,
    error,
    isLoading,
    isError,
    lastUpdated,
    refetch,
  } = usePlansList({
    limit: PLANS_LIMIT,
    // Only poll when page is visible
    refetchInterval: isVisible ? REFETCH_INTERVAL_MS : false,
    enabled: true,
  });

  // Format last updated timestamp
  useEffect(() => {
    const updateDisplay = () => {
      if (!lastUpdated) {
        setLastUpdatedDisplay('');
        return;
      }

      const date = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      let display: string;
      if (diffSec < 60) {
        display = 'Just now';
      } else if (diffSec < 3600) {
        const minutes = Math.floor(diffSec / 60);
        display = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        display = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      }
      setLastUpdatedDisplay(display);
    };

    updateDisplay();
    const intervalId = setInterval(updateDisplay, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Handle page visibility changes for polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Set the initial state
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container">
      <div className="plans-list-container">
        <div className="plans-list-header">
          <h1>Plans</h1>
          <div className="plans-list-actions">
            {lastUpdatedDisplay && (
              <span className="last-updated" aria-live="polite">
                Last updated: {lastUpdatedDisplay}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="btn btn-primary"
              disabled={isLoading}
              aria-label="Refresh plans list"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && !data && (
          <div className="plans-skeleton" role="status" aria-label="Loading plans">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-id" />
                  <div className="skeleton-status" />
                </div>
                <div className="skeleton-text" />
                <div className="skeleton-text" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="error-state" role="alert">
            <h2>Failed to Load Plans</h2>
            <p>{error?.message || 'An unexpected error occurred. Please try again.'}</p>
            <button onClick={handleRefresh} className="btn btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && data && data.jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">📋</div>
            <h2>No Plans Yet</h2>
            <p>
              You haven&apos;t created any plans yet. Get started by creating your first
              software development plan.
            </p>
            <Link to="/" className="btn btn-primary">
              Create Your First Plan
            </Link>
          </div>
        )}

        {/* Success state with plans */}
        {!isLoading && !isError && data && data.jobs.length > 0 && (
          <>
            {/* Recent Activity Timeline */}
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="timeline">
                {data.jobs
                  .filter((job: PlanJobStatus) => job.job_id)
                  .slice(0, RECENT_ACTIVITY_COUNT)
                  .map((job: PlanJobStatus) => (
                    <div key={`timeline-${job.job_id}`} className="timeline-item">
                      <div className="timeline-marker" aria-hidden="true" />
                      <div className="timeline-content">
                        <Link
                          to={`/plans/${job.job_id}`}
                          className="timeline-link"
                        >
                          <span className="timeline-job-id" title={job.job_id}>
                            {job.job_id}
                          </span>
                        </Link>
                        <StatusBadge status={job.status} type="planner" size="sm" />
                        <time
                          dateTime={job.updated_at || job.created_at}
                          className="timeline-timestamp"
                        >
                          {formatTimestamp(job.updated_at || job.created_at)}
                        </time>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Plans Grid */}
            <div className="plans-grid">
              {data.jobs
                .filter((job: PlanJobStatus) => job.job_id)
                .map((job: PlanJobStatus) => {
                  return (
                    <Link
                      key={job.job_id}
                      to={`/plans/${job.job_id}`}
                      className="plan-card"
                      aria-label={`View plan ${job.job_id}`}
                    >
                      <div className="plan-card-header">
                        <span className="plan-id" title={job.job_id}>
                          {job.job_id}
                        </span>
                        <StatusBadge status={job.status} type="planner" />
                      </div>
                      <div className="plan-card-metadata">
                        <div className="metadata-row">
                          <span className="metadata-label">Created:</span>
                          <time dateTime={job.created_at}>
                            {formatTimestamp(job.created_at)}
                          </time>
                        </div>
                        {job.updated_at && (
                          <div className="metadata-row">
                            <span className="metadata-label">Updated:</span>
                            <time dateTime={job.updated_at}>
                              {formatTimestamp(job.updated_at)}
                            </time>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlansListPage;
