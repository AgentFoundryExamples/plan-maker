import React, { useState, useCallback, useEffect } from 'react';
import { useClarificationStatus } from '@/api/hooks';
import { getClarifierDebug, type ClarifierDebugResponse } from '@/api/specClarifierClient';
import { formatTimestamp } from '@/utils/dateUtils';
import StatusBadge from './StatusBadge';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import type { PlanValidationResult } from '@/state/planAnswersStore';
import { getClarifierJobId, setClarifierJobId } from '@/utils/clarifierStorage';

/**
 * Props for ClarifierPanel component
 */
export interface ClarifierPanelProps {
  /** The plan job to clarify */
  planJob: PlanJobStatus;
  /** Optional CSS class name */
  className?: string;
  /**
   * @deprecated No longer used - submission controls moved to PlanStatusBar.
   * Kept for backward compatibility with existing code.
   */
  onClarificationCreated?: (jobId: string) => void;
  /**
   * @deprecated No longer used - validation UI moved to PlanStatusBar.
   * Kept for backward compatibility with existing code.
   */
  validationResult?: PlanValidationResult | null;
}

/**
 * ClarifierPanel Component
 * 
 * Manages the clarification job tracking workflow for a plan:
 * - Manual job ID entry
 * - Check clarification status
 * - View debug information (when available)
 * 
 * Note: Submission controls have been moved to PlanStatusBar component.
 * 
 * Features:
 * - Stores last clarification job ID per plan
 * - On-demand status checking (no auto-polling)
 * - Graceful 403 handling for disabled debug endpoint
 * - Accessible with keyboard navigation
 * 
 * Usage:
 * ```tsx
 * <ClarifierPanel
 *   planJob={planData}
 *   onClarificationCreated={(jobId) => console.log('Created:', jobId)}
 * />
 * ```
 */
export const ClarifierPanel: React.FC<ClarifierPanelProps> = ({
  planJob,
  className = '',
  // Deprecated props kept for backward compatibility
  onClarificationCreated: _onClarificationCreated,
  validationResult: _validationResult,
}) => {
  // Local state
  const [manualJobId, setManualJobId] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const [debugData, setDebugData] = useState<ClarifierDebugResponse | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  // Load stored job ID on mount
  useEffect(() => {
    const stored = getClarifierJobId(planJob.job_id);
    if (stored) {
      setCurrentJobId(stored.jobId);
    }
  }, [planJob.job_id]);

  // Clarification status query (only enabled when we want to check)
  const { data: clarificationStatus, refetch: refetchStatus, isLoading: statusLoading } = useClarificationStatus(
    statusChecked ? currentJobId || undefined : undefined,
    {
      enabled: false, // Manual trigger only
    }
  );

  // Handle manual job ID submission
  const handleManualJobIdSubmit = useCallback(() => {
    const trimmedId = manualJobId.trim();
    
    if (!trimmedId) {
      setBannerMessage({
        type: 'error',
        message: 'Please enter a valid job ID',
      });
      return;
    }

    // UUID validation - accepts both uppercase and lowercase with proper hex digit ranges
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(trimmedId)) {
      setBannerMessage({
        type: 'error',
        message: 'Invalid job ID format. Expected UUID format.',
      });
      return;
    }

    setCurrentJobId(trimmedId);
    setClarifierJobId(planJob.job_id, trimmedId);
    setManualJobId('');
    setStatusChecked(false);
    setDebugData(null);
    setDebugError(null);
    setBannerMessage({
      type: 'success',
      message: `Tracking clarification job: ${trimmedId}`,
    });
  }, [manualJobId, planJob.job_id]);

  // Handle checking clarification status
  const handleCheckStatus = useCallback(async () => {
    if (!currentJobId) return;

    setBannerMessage(null);
    setDebugData(null);
    setDebugError(null);
    setStatusChecked(true);
    
    try {
      await refetchStatus();
    } catch (error) {
      setBannerMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch clarification status',
      });
    }
  }, [currentJobId, refetchStatus]);

  // Handle viewing debug information
  const handleViewDebug = useCallback(async () => {
    if (!currentJobId) return;

    setDebugLoading(true);
    setDebugError(null);
    setDebugData(null);
    setBannerMessage(null);

    try {
      const data = await getClarifierDebug(currentJobId);
      setDebugData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch debug information';
      
      // Handle 403 specially
      if (errorMessage.includes('Debug endpoint is disabled')) {
        setDebugError('Debug information is not available. The debug endpoint is disabled on this server.');
      } else {
        setDebugError(errorMessage);
      }
    } finally {
      setDebugLoading(false);
    }
  }, [currentJobId]);

  // Clear banner
  const dismissBanner = useCallback(() => {
    setBannerMessage(null);
  }, []);

  return (
    <div className={`clarifier-panel ${className}`.trim()}>
      <h3 className="clarifier-panel-heading">Clarification</h3>

      {/* Banner Messages */}
      {bannerMessage && (
        <div 
          className={`clarifier-banner clarifier-banner-${bannerMessage.type}`}
          role="alert"
        >
          <span className="clarifier-banner-icon">
            {bannerMessage.type === 'error' ? '⚠️' : bannerMessage.type === 'success' ? '✓' : 'ℹ️'}
          </span>
          <p className="clarifier-banner-message">{bannerMessage.message}</p>
          <button
            type="button"
            className="btn btn-text clarifier-banner-dismiss"
            onClick={dismissBanner}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Manual Job ID Entry */}
      <div className="clarifier-section">
        <h4 className="clarifier-section-heading">Track Existing Job</h4>
        <p className="clarifier-help-text">
          Enter a clarification job ID to monitor its status:
        </p>
        <div className="clarifier-input-group">
          <input
            type="text"
            className="clarifier-input"
            placeholder="Enter job ID (UUID format, e.g., 123e4567-e89b-...)"
            value={manualJobId}
            onChange={(e) => setManualJobId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualJobIdSubmit();
              }
            }}
            aria-label="Clarification job ID"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleManualJobIdSubmit}
            disabled={!manualJobId.trim()}
          >
            Track
          </button>
        </div>
      </div>

      {/* Current Job Status */}
      {currentJobId && (
        <div className="clarifier-section clarifier-status-section">
          <h4 className="clarifier-section-heading">Current Job</h4>
          <div className="clarifier-job-info">
            <div className="clarifier-job-id">
              <span className="clarifier-label">Job ID:</span>
              <code className="clarifier-code">{currentJobId}</code>
              <button
                type="button"
                className="btn btn-text btn-copy"
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(currentJobId)
                      .then(() => {
                        setBannerMessage({
                          type: 'info',
                          message: 'Job ID copied to clipboard',
                        });
                      })
                      .catch(() => {
                        setBannerMessage({
                          type: 'error',
                          message: 'Failed to copy Job ID to clipboard',
                        });
                      });
                  }
                }}
                aria-label="Copy job ID to clipboard"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>

            {/* Status Display */}
            {clarificationStatus && (
              <div className="clarifier-status-display">
                <div className="clarifier-status-row">
                  <span className="clarifier-label">Status:</span>
                  <StatusBadge status={clarificationStatus.status} type="clarifier" size="sm" />
                </div>
                <div className="clarifier-status-row">
                  <span className="clarifier-label">Created:</span>
                  <time dateTime={clarificationStatus.created_at}>
                    {formatTimestamp(clarificationStatus.created_at)}
                  </time>
                </div>
                <div className="clarifier-status-row">
                  <span className="clarifier-label">Updated:</span>
                  <time dateTime={clarificationStatus.updated_at}>
                    {formatTimestamp(clarificationStatus.updated_at)}
                  </time>
                </div>
                {clarificationStatus.status === 'FAILED' && clarificationStatus.last_error && (
                  <div className="clarifier-error-display">
                    <span className="clarifier-label">Error:</span>
                    <p className="clarifier-error-text">{clarificationStatus.last_error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="clarifier-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCheckStatus}
                disabled={statusLoading}
                aria-busy={statusLoading}
              >
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>
              <button
                type="button"
                className="btn btn-text"
                onClick={handleViewDebug}
                disabled={debugLoading}
                aria-busy={debugLoading}
              >
                {debugLoading ? 'Loading...' : 'View Debug'}
              </button>
            </div>
          </div>

          {/* Debug Information */}
          {debugData && (
            <div className="clarifier-debug-section">
              <h5 className="clarifier-debug-heading">Debug Information</h5>
              <pre className="clarifier-debug-output" role="region" aria-label="Debug information">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}

          {/* Debug Error */}
          {debugError && (
            <div className="clarifier-debug-error" role="alert">
              <span className="clarifier-debug-error-icon">⚠️</span>
              <p className="clarifier-debug-error-text">{debugError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClarifierPanel;
