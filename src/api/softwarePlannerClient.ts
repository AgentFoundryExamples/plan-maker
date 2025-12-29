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
import { getPlannerStatusMetadata, type StatusMetadata } from '../utils/statusMappings';
import { validateUUID, validateLimit } from '../utils/validators';

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
 * Re-export StatusMetadata type for backward compatibility
 */
export type { StatusMetadata };

/**
 * Get status metadata for a given planner status, with fallback for unknown statuses
 * @param status - The status string to look up
 * @returns Status metadata with label, description, color, icon, and progress
 * @deprecated Use getPlannerStatusMetadata from utils/statusMappings.ts instead
 */
export function getStatusMetadata(status: string): StatusMetadata {
  return getPlannerStatusMetadata(status);
}

/**
 * Legacy export for backward compatibility
 * @deprecated Import from utils/statusMappings.ts instead
 */
export { getPlannerStatusMetadata as PLANNER_STATUS_MAP };

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
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
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
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    }
    throw new Error(`Failed to create async plan: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Get the status and result of a planning job
 * @param jobId - The job ID to check (must be valid UUID format)
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Job status with optional result
 * @throws Error if jobId is not a valid UUID or request fails
 */
export async function getPlanById(
  jobId: string,
  fetchImpl?: typeof fetch
): Promise<PlanJobStatus> {
  // Validate UUID format before making request
  validateUUID(jobId);
  
  const config = getSoftwarePlannerConfig(fetchImpl);

  const response = await config.fetchImpl(
    `${config.baseUrl}/api/v1/plans/${jobId}`,
    {
      method: 'GET',
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    }
    throw new Error(`Failed to get plan status: ${errorMessage}`);
  }

  return response.json();
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
 * @param options - Optional parameters including limit (1-1000, default 25) and cursor for pagination
 * @returns List of recent jobs
 * @throws Error if limit is outside valid range (1-1000)
 */
export async function listPlans(
  options: ListPlansOptions = {}
): Promise<PlanJobsList> {
  const { limit, cursor, fetchImpl } = options;
  
  // Validate limit if provided
  if (limit !== undefined) {
    validateLimit(limit);
  }
  
  const config = getSoftwarePlannerConfig(fetchImpl);
  const url = new URL(`${config.baseUrl}/api/v1/plans`);

  // Use provided limit or default to 100 (as shown in API example)
  const effectiveLimit = limit ?? 100;
  url.searchParams.set('limit', effectiveLimit.toString());

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await config.fetchImpl(url.toString(), {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.error && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    }
    throw new Error(`Failed to list plans: ${errorMessage}`);
  }

  return response.json();
}
