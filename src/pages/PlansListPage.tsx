import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlansList } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import '@/styles/PlansListPage.css';

// Configuration constants - adjustable for fine-tuning
const PLANS_LIMIT = 25;
const REFETCH_INTERVAL_MS = 60000; // 60 seconds
const SKELETON_COUNT = 3;

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
    if (!lastUpdated) return;

    const updateDisplay = () => {
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
  }, [lastUpdated]);

  // Handle page visibility changes for polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    refetch();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
          <div className="plans-grid">
            {data.jobs.map((job: PlanJobStatus) => {
              const statusMeta = getStatusMetadata(job.status);
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
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusMeta.color,
                        color: '#ffffff',
                      }}
                      aria-label={`Status: ${statusMeta.label}`}
                    >
                      {statusMeta.label}
                    </span>
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
        )}
      </div>
    </div>
  );
};

export default PlansListPage;
