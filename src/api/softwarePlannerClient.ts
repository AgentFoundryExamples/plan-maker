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
 * Software Planner API Client Wrapper
 * Provides typed helper functions for interacting with the Software Planner API
 */

import { getSoftwarePlannerConfig, createHeaders } from './clientConfig';
import type { PlanRequest, PlanResponse } from './softwarePlanner';

/**
 * Job metadata returned from async plan creation
 */
export interface AsyncPlanJob {
  job_id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
}

/**
 * Job status response from GET /api/v1/plans/{job_id}
 */
export interface PlanJobStatus {
  job_id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  created_at: string;
  updated_at: string;
  result?: PlanResponse | null;
  error?: {
    error: string;
    type: string;
  } | null;
}

/**
 * List of recent planning jobs
 */
export interface PlanJobsList {
  jobs: PlanJobStatus[];
  total: number;
  limit: number;
}

/**
 * Metadata for status display
 */
export interface StatusMetadata {
  label: string;
  description: string;
  color: string;
  icon?: string;
}

/**
 * Status mapping for planner job statuses
 * Maps each status to display metadata for UI components
 */
export const PLANNER_STATUS_MAP: Record<
  'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED',
  StatusMetadata
> = {
  QUEUED: {
    label: 'Queued',
    description: 'Job is waiting to be processed',
    color: 'var(--color-info)',
    icon: 'clock',
  },
  RUNNING: {
    label: 'Running',
    description: 'Job is currently being processed',
    color: 'var(--color-warning)',
    icon: 'spinner',
  },
  SUCCEEDED: {
    label: 'Succeeded',
    description: 'Job completed successfully',
    color: 'var(--color-success)',
    icon: 'check',
  },
  FAILED: {
    label: 'Failed',
    description: 'Job failed to complete',
    color: 'var(--color-danger)',
    icon: 'error',
  },
} as const;

/**
 * Get status metadata for a given status, with fallback for unknown statuses
 * @param status - The status string to look up
 * @returns Status metadata with label, description, color, and optional icon
 */
export function getStatusMetadata(status: string): StatusMetadata {
  if (status in PLANNER_STATUS_MAP) {
    return PLANNER_STATUS_MAP[status as keyof typeof PLANNER_STATUS_MAP];
  }
  // Fallback for unknown statuses
  return {
    label: 'Unknown',
    description: `Status: ${status}`,
    color: 'var(--color-text-secondary)',
    icon: 'question',
  };
}

/**
 * Options for creating a plan
 */
export interface CreatePlanOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Create a synchronous software plan
 * @param request - Plan request with project description
 * @param options - Optional API key and fetch implementation
 * @returns Plan response with specifications
 */
export async function createPlan(
  request: PlanRequest,
  options: CreatePlanOptions = {}
): Promise<PlanResponse> {
  const config = getSoftwarePlannerConfig(options.fetchImpl);
  const headers = createHeaders(
    options.apiKey ? { 'x-api-key': options.apiKey } : undefined
  );

  const response = await config.fetchImpl(`${config.baseUrl}/api/v1/plan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
        }
      } catch {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Failed to create plan: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Create an asynchronous software planning job
 * @param request - Plan request with project description
 * @param options - Optional API key and fetch implementation
 * @returns Job ID and initial status
 */
export async function createPlanAsync(
  request: PlanRequest,
  options: CreatePlanOptions = {}
): Promise<AsyncPlanJob> {
  const config = getSoftwarePlannerConfig(options.fetchImpl);
  const headers = createHeaders(
    options.apiKey ? { 'x-api-key': options.apiKey } : undefined
  );

  const response = await config.fetchImpl(`${config.baseUrl}/api/v1/plans`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
        }
      } catch {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Failed to create async plan: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Get the status and result of a planning job
 * @param jobId - The job ID to check
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Job status with optional result
 */
export async function getPlanById(
  jobId: string,
  fetchImpl?: typeof fetch
): Promise<PlanJobStatus> {
  const config = getSoftwarePlannerConfig(fetchImpl);

  const response = await config.fetchImpl(
    `${config.baseUrl}/api/v1/plans/${jobId}`,
    {
      method: 'GET',
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
        }
      } catch {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Failed to get plan status: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Get detailed information about a specific plan
 * 
 * This is a semantic alias for getPlanById that makes the intent clearer when
 * fetching plan details in UI components. Both functions call the same API endpoint
 * GET /api/v1/plans/{id}, but this name better reflects the purpose of fetching
 * complete plan data including metadata and specs.
 * 
 * @param planId - The plan ID to fetch
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Job status with result containing plan response and specs
 */
export async function getPlanDetail(
  planId: string,
  fetchImpl?: typeof fetch
): Promise<PlanJobStatus> {
  return getPlanById(planId, fetchImpl);
}

/**
 * Options for listing plans
 */
export interface ListPlansOptions {
  limit?: number;
  cursor?: string;
  fetchImpl?: typeof fetch;
}

/**
 * List recent planning jobs
 * @param options - Optional parameters including limit (default 25, max 25) and cursor for pagination
 * @returns List of recent jobs
 */
export async function listPlans(
  options: ListPlansOptions = {}
): Promise<PlanJobsList> {
  const { limit, cursor, fetchImpl } = options;
  const config = getSoftwarePlannerConfig(fetchImpl);
  const url = new URL(`${config.baseUrl}/api/v1/plans`);

  // Default limit to 25 and clamp to max 25
  const effectiveLimit = Math.min(limit ?? 25, 25);
  url.searchParams.set('limit', effectiveLimit.toString());

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await config.fetchImpl(url.toString(), {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
        }
      } catch {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Failed to list plans: ${errorMessage}`);
  }

  return response.json();
}
