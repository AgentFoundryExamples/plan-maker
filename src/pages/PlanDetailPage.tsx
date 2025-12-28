import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlanDetail } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import { formatTimestamp } from '@/utils/dateUtils';
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
  if (error || !data) {
    return (
      <div className="container">
        <Link to="/plans" className="back-link">
          ← Back to Plans List
        </Link>
        <h1>Plan Details</h1>
        <div className="error-state" role="alert">
          <h2>Failed to Load Plan</h2>
          <p>{error?.message || 'Unable to fetch plan details. The plan may not exist or there was a network error.'}</p>
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
          <div>
            <p className="spec-count">
              This plan contains {specs.length} specification{specs.length !== 1 ? 's' : ''}.
            </p>
            {specs.map((spec, index) => (
              <div key={index} className="spec-container">
                <h3>Spec #{index + 1}</h3>
                <div className="spec-section">
                  <strong>Purpose:</strong> {spec.purpose}
                </div>
                <div className="spec-section">
                  <strong>Vision:</strong> {spec.vision}
                </div>
                {spec.must && spec.must.length > 0 && (
                  <div className="spec-section">
                    <strong>Must Have:</strong>
                    <ul>
                      {spec.must.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.nice && spec.nice.length > 0 && (
                  <div className="spec-section">
                    <strong>Nice to Have:</strong>
                    <ul>
                      {spec.nice.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.dont && spec.dont.length > 0 && (
                  <div className="spec-section">
                    <strong>Don't:</strong>
                    <ul>
                      {spec.dont.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.open_questions && spec.open_questions.length > 0 && (
                  <div className="spec-section">
                    <strong>Open Questions:</strong>
                    <ul>
                      {spec.open_questions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.assumptions && spec.assumptions.length > 0 && (
                  <div className="spec-section">
                    <strong>Assumptions:</strong>
                    <ul>
                      {spec.assumptions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanDetailPage;
