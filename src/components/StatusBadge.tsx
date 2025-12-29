import React from 'react';
import {
  getPlannerStatusMetadata,
  getClarifierStatusMetadata,
  type StatusMetadata,
  type PlannerStatus,
  type ClarifierStatus,
} from '@/utils/statusMappings';

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  /** The status value to display - must be a valid planner or clarifier status */
  status: PlannerStatus | ClarifierStatus | string;
  /** The type of status - 'planner' or 'clarifier' */
  type?: 'planner' | 'clarifier';
  /** Optional additional CSS classes */
  className?: string;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusBadge Component
 *
 * A reusable status badge that displays consistent labels, colors, and ARIA text
 * for both planner and clarifier job statuses.
 *
 * Features:
 * - Automatic color coding based on status
 * - Accessible ARIA labels
 * - Graceful fallback for unknown statuses
 * - Support for both planner (QUEUED/RUNNING/SUCCEEDED/FAILED) and
 *   clarifier (PENDING/RUNNING/SUCCESS/FAILED) statuses
 *
 * Usage:
 * ```tsx
 * <StatusBadge status="RUNNING" type="planner" />
 * <StatusBadge status="SUCCESS" type="clarifier" size="sm" />
 * ```
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'planner',
  className = '',
  size = 'md',
}) => {
  // Get metadata based on status type
  const metadata: StatusMetadata =
    type === 'clarifier'
      ? getClarifierStatusMetadata(status)
      : getPlannerStatusMetadata(status);

  // Determine size classes
  const sizeClasses = {
    sm: 'status-badge-sm',
    md: 'status-badge-md',
    lg: 'status-badge-lg',
  };

  return (
    <span
      className={`status-badge ${sizeClasses[size]} ${className}`.trim()}
      style={{
        backgroundColor: metadata.color,
        color: 'var(--color-background)',
      }}
      aria-label={`Status: ${metadata.label} - ${metadata.description}`}
      role="status"
    >
      {metadata.label}
    </span>
  );
};

export default StatusBadge;
