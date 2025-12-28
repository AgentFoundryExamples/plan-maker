import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlanDetail } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import { formatTimestamp } from '@/utils/dateUtils';
import SpecAccordion from '@/components/SpecAccordion';
import '@/styles/PlansListPage.css';
import '@/styles/PlanDetailPage.css';

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = usePlanDetail(id);

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
          <SpecAccordion planId={data.job_id} specs={specs} />
        )}
      </div>
    </div>
  );
};

export default PlanDetailPage;
