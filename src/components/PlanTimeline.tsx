import React, { useMemo } from 'react';
import { formatTimestamp } from '@/utils/dateUtils';
import { getPlannerStatusMetadata, getClarifierStatusMetadata } from '@/utils/statusMappings';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import type { JobStatusResponse } from '@/api/specClarifier';

/**
 * Event type for timeline entries
 */
export type TimelineEventType =
  | 'plan_created'
  | 'plan_queued'
  | 'plan_running'
  | 'plan_succeeded'
  | 'plan_failed'
  | 'clarifier_created'
  | 'clarifier_pending'
  | 'clarifier_running'
  | 'clarifier_success'
  | 'clarifier_failed';

/**
 * Timeline event data structure
 */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  label: string;
  description: string;
  color: string;
  icon?: string;
}

/**
 * Props for PlanTimeline component
 */
export interface PlanTimelineProps {
  /** Plan job status data */
  planJob: PlanJobStatus;
  /** Optional clarifier job status data */
  clarifierJob?: JobStatusResponse | null;
  /** Optional clarifier job creation timestamp */
  clarifierCreatedAt?: string | null;
  /** Whether to show compact view */
  compact?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Build timeline events from plan and clarifier data
 */
function buildTimelineEvents(
  planJob: PlanJobStatus,
  clarifierJob?: JobStatusResponse | null,
  clarifierCreatedAt?: string | null
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Add plan creation event
  const planCreatedMeta = getPlannerStatusMetadata('QUEUED');
  events.push({
    id: `plan-created-${planJob.job_id}`,
    type: 'plan_created',
    timestamp: planJob.created_at,
    label: 'Plan Created',
    description: `Plan job ${planJob.job_id} was submitted`,
    color: planCreatedMeta.color,
    icon: planCreatedMeta.icon,
  });

  // Add plan status transition events
  // We only add the current status, as we don't have historical transitions
  const planStatusMeta = getPlannerStatusMetadata(planJob.status);
  const planEventType = `plan_${planJob.status.toLowerCase()}` as TimelineEventType;
  
  // Only add status event if it's different from creation (QUEUED)
  if (planJob.status !== 'QUEUED') {
    events.push({
      id: `plan-status-${planJob.job_id}-${planJob.status}`,
      type: planEventType,
      timestamp: planJob.updated_at,
      label: `Plan ${planStatusMeta.label}`,
      description: planStatusMeta.description,
      color: planStatusMeta.color,
      icon: planStatusMeta.icon,
    });
  }

  // Add clarifier events if available
  if (clarifierCreatedAt) {
    events.push({
      id: `clarifier-created-${clarifierJob?.id || 'unknown'}`,
      type: 'clarifier_created',
      timestamp: clarifierCreatedAt,
      label: 'Clarification Started',
      description: `Clarification job was submitted`,
      color: 'var(--color-info)',
      icon: 'clock',
    });
  }

  if (clarifierJob) {
    const clarifierStatusMeta = getClarifierStatusMetadata(clarifierJob.status);
    const clarifierEventType = `clarifier_${clarifierJob.status.toLowerCase()}` as TimelineEventType;
    
    // Only add status event if it's different from creation (PENDING)
    if (clarifierJob.status !== 'PENDING') {
      events.push({
        id: `clarifier-status-${clarifierJob.id}-${clarifierJob.status}`,
        type: clarifierEventType,
        timestamp: clarifierJob.updated_at,
        label: `Clarification ${clarifierStatusMeta.label}`,
        description: clarifierStatusMeta.description,
        color: clarifierStatusMeta.color,
        icon: clarifierStatusMeta.icon,
      });
    }
  }

  // Sort events chronologically (most recent first)
  // Handle invalid timestamps by treating them as earliest possible time
  events.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    
    // If either timestamp is invalid (NaN), push it to the end
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    
    return timeB - timeA;
  });

  return events;
}

/**
 * PlanTimeline Component
 * 
 * Displays a chronological activity timeline for plan and clarifier events.
 * 
 * Features:
 * - Merges planner and clarifier events
 * - Chronological ordering (most recent first)
 * - Keyboard navigation support
 * - Mobile-friendly and responsive
 * - Accessible with ARIA labels
 * 
 * Usage:
 * ```tsx
 * <PlanTimeline 
 *   planJob={planData}
 *   clarifierJob={clarifierData}
 *   clarifierCreatedAt={clarifierCreatedTimestamp}
 * />
 * ```
 */
export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  planJob,
  clarifierJob,
  clarifierCreatedAt,
  compact = false,
  className = '',
}) => {
  // Memoize timeline events to avoid recalculation on every render
  const events = useMemo(
    () => buildTimelineEvents(planJob, clarifierJob, clarifierCreatedAt),
    [planJob, clarifierJob, clarifierCreatedAt]
  );

  if (events.length === 0) {
    return null;
  }

  return (
    <div 
      className={`timeline-container ${compact ? 'timeline-compact' : ''} ${className}`.trim()}
      role="region"
      aria-label="Activity Timeline"
    >
      <h3 className="timeline-heading">Activity Timeline</h3>
      <ol className="timeline-list" role="list">
        {events.map((event, index) => (
          <li
            key={event.id}
            className="timeline-item"
            role="listitem"
            tabIndex={0}
            aria-label={`${event.label} at ${formatTimestamp(event.timestamp)}`}
          >
            <div className="timeline-marker" style={{ backgroundColor: event.color }} aria-hidden="true" />
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-label">{event.label}</span>
                <time className="timeline-timestamp" dateTime={event.timestamp}>
                  {formatTimestamp(event.timestamp)}
                </time>
              </div>
              {!compact && (
                <p className="timeline-description">{event.description}</p>
              )}
            </div>
            {index < events.length - 1 && (
              <div className="timeline-connector" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PlanTimeline;
