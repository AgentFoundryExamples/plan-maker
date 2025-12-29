// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Shared status mapping utilities for planner and clarifier services.
 * 
 * This module provides consistent status metadata (label, color, icon, progress)
 * for both the Software Planner API (QUEUED/RUNNING/SUCCEEDED/FAILED) and the
 * Spec Clarifier API (PENDING/RUNNING/SUCCESS/FAILED).
 * 
 * Usage:
 * ```ts
 * const metadata = getPlannerStatusMetadata('RUNNING');
 * console.log(metadata.label); // "Running"
 * console.log(metadata.progress); // 50
 * 
 * const clarifierMeta = getClarifierStatusMetadata('SUCCESS');
 * console.log(clarifierMeta.color); // "var(--color-success)"
 * ```
 */

/**
 * Status metadata for UI display
 */
export interface StatusMetadata {
  /** Human-readable label for the status */
  label: string;
  /** Description of what this status means */
  description: string;
  /** CSS color variable for styling (e.g., 'var(--color-success)') */
  color: string;
  /** Optional icon hint for UI components */
  icon?: string;
  /** Derived progress percentage (0-100) for progress bars */
  progress: number;
}

/**
 * Planner status values from Software Planner API
 */
export type PlannerStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

/**
 * Clarifier status values from Spec Clarifier API
 */
export type ClarifierStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

/**
 * Status mapping for Software Planner job statuses
 * All colors map to shared palette tokens from theme.css
 */
const PLANNER_STATUS_MAP: Record<PlannerStatus, Omit<StatusMetadata, 'progress'>> = {
  QUEUED: {
    label: 'Queued',
    description: 'Job is waiting to be processed',
    color: 'var(--color-info)',
    icon: '⏱️',
  },
  RUNNING: {
    label: 'Running',
    description: 'Job is currently being processed',
    color: 'var(--color-warning)',
    icon: '⚙️',
  },
  SUCCEEDED: {
    label: 'Succeeded',
    description: 'Job completed successfully',
    color: 'var(--color-success)',
    icon: '✓',
  },
  FAILED: {
    label: 'Failed',
    description: 'Job failed to complete',
    color: 'var(--color-error)',
    icon: '✗',
  },
};

/**
 * Status mapping for Spec Clarifier job statuses
 * All colors map to shared palette tokens from theme.css
 */
const CLARIFIER_STATUS_MAP: Record<ClarifierStatus, Omit<StatusMetadata, 'progress'>> = {
  PENDING: {
    label: 'Pending',
    description: 'Job is queued and waiting to start',
    color: 'var(--color-info)',
    icon: '⏱️',
  },
  RUNNING: {
    label: 'Running',
    description: 'Job is currently being clarified',
    color: 'var(--color-warning)',
    icon: '⚙️',
  },
  SUCCESS: {
    label: 'Success',
    description: 'Clarification completed successfully',
    color: 'var(--color-success)',
    icon: '✓',
  },
  FAILED: {
    label: 'Failed',
    description: 'Clarification failed with an error',
    color: 'var(--color-error)',
    icon: '✗',
  },
};

/**
 * Calculate progress percentage for planner statuses
 * @param status - Planner status value
 * @returns Progress percentage (0-100)
 */
function getPlannerProgress(status: string): number {
  switch (status) {
    case 'QUEUED':
      return 0;
    case 'RUNNING':
      return 50;
    case 'SUCCEEDED':
      return 100;
    case 'FAILED':
      return 100;
    default:
      return 0;
  }
}

/**
 * Calculate progress percentage for clarifier statuses
 * @param status - Clarifier status value
 * @returns Progress percentage (0-100)
 */
function getClarifierProgress(status: string): number {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'RUNNING':
      return 50;
    case 'SUCCESS':
      return 100;
    case 'FAILED':
      return 100;
    default:
      return 0;
  }
}

/**
 * Get status metadata for a planner job status
 * @param status - The planner status string to look up
 * @returns Status metadata with label, description, color, icon, and progress
 */
export function getPlannerStatusMetadata(status: string): StatusMetadata {
  if (status in PLANNER_STATUS_MAP) {
    const base = PLANNER_STATUS_MAP[status as PlannerStatus];
    return {
      ...base,
      progress: getPlannerProgress(status),
    };
  }
  
  // Fallback for unknown statuses
  return {
    label: 'Unknown',
    description: `Status: ${status}`,
    color: 'var(--color-neutral)',
    icon: '?',
    progress: 0,
  };
}

/**
 * Get status metadata for a clarifier job status
 * @param status - The clarifier status string to look up
 * @returns Status metadata with label, description, color, icon, and progress
 */
export function getClarifierStatusMetadata(status: string): StatusMetadata {
  if (status in CLARIFIER_STATUS_MAP) {
    const base = CLARIFIER_STATUS_MAP[status as ClarifierStatus];
    return {
      ...base,
      progress: getClarifierProgress(status),
    };
  }
  
  // Fallback for unknown statuses
  return {
    label: 'Unknown',
    description: `Status: ${status}`,
    color: 'var(--color-neutral)',
    icon: '?',
    progress: 0,
  };
}

/**
 * Question status types for UI components
 */
export type QuestionStatus = 'unanswered' | 'answered' | 'complete';

/**
 * Get status metadata for question answer states
 * Maps to shared palette tokens for consistency
 * @param status - The question status
 * @returns Status metadata with label, description, color, and icon
 */
export function getQuestionStatusMetadata(status: QuestionStatus): StatusMetadata {
  const questionStatusMap: Record<QuestionStatus, Omit<StatusMetadata, 'progress'>> = {
    unanswered: {
      label: 'Unanswered',
      description: 'This question needs an answer',
      color: 'var(--color-warning)',
      icon: '○',
    },
    answered: {
      label: 'Answered',
      description: 'This question has been answered',
      color: 'var(--color-success)',
      icon: '✓',
    },
    complete: {
      label: 'Complete',
      description: 'All questions answered',
      color: 'var(--color-success)',
      icon: '✓',
    },
  };

  const base = questionStatusMap[status];
  return {
    ...base,
    progress: status === 'complete' || status === 'answered' ? 100 : 0,
  };
}

/**
 * Export the raw status maps for reference (backward compatibility)
 */
export { PLANNER_STATUS_MAP, CLARIFIER_STATUS_MAP };
