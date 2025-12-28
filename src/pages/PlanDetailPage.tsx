import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlanDetail } from '@/api/hooks';
import { getStatusMetadata } from '@/api/softwarePlannerClient';
import '@/styles/PlansListPage.css';

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = usePlanDetail(id);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container">
        <Link
          to="/plans"
          style={{ display: 'inline-block', marginBottom: 'var(--spacing-md)' }}
        >
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
        <Link
          to="/plans"
          style={{ display: 'inline-block', marginBottom: 'var(--spacing-md)' }}
        >
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
      <Link
        to="/plans"
        style={{ display: 'inline-block', marginBottom: 'var(--spacing-md)' }}
      >
        ← Back to Plans List
      </Link>
      <h1>Plan Details</h1>
      
      {/* Plan Metadata Card */}
      <div className="card mt-lg">
        <div className="plan-card-header" style={{ marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ margin: 0 }}>Plan #{data.job_id}</h2>
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
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-danger-bg, #fee)', borderRadius: 'var(--border-radius)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-danger)' }}>Error</h3>
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
            <p style={{ marginBottom: 'var(--spacing-md)' }}>
              This plan contains {specs.length} specification{specs.length !== 1 ? 's' : ''}.
            </p>
            {specs.map((spec, index) => (
              <div 
                key={index}
                style={{
                  marginBottom: 'var(--spacing-lg)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                <h3>Spec #{index + 1}</h3>
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <strong>Purpose:</strong> {spec.purpose}
                </div>
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <strong>Vision:</strong> {spec.vision}
                </div>
                {spec.must && spec.must.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>Must Have:</strong>
                    <ul>
                      {spec.must.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.nice && spec.nice.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>Nice to Have:</strong>
                    <ul>
                      {spec.nice.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.dont && spec.dont.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>Don't:</strong>
                    <ul>
                      {spec.dont.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.open_questions && spec.open_questions.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>Open Questions:</strong>
                    <ul>
                      {spec.open_questions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.assumptions && spec.assumptions.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
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
