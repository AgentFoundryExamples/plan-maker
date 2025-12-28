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

  const response = await config.fetchImpl(
    `${config.baseUrl}/api/v1/plan`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to create plan: ${JSON.stringify(error)}`);
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

  const response = await config.fetchImpl(
    `${config.baseUrl}/api/v1/plans`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to create async plan: ${JSON.stringify(error)}`);
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to get plan status: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * List recent planning jobs
 * @param limit - Optional maximum number of jobs to return
 * @param fetchImpl - Optional custom fetch implementation
 * @returns List of recent jobs
 */
export async function listPlans(
  limit?: number,
  fetchImpl?: typeof fetch
): Promise<PlanJobsList> {
  const config = getSoftwarePlannerConfig(fetchImpl);
  const url = new URL(`${config.baseUrl}/api/v1/plans`);
  
  if (limit !== undefined) {
    url.searchParams.set('limit', limit.toString());
  }

  const response = await config.fetchImpl(
    url.toString(),
    {
      method: 'GET',
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to list plans: ${JSON.stringify(error)}`);
  }

  return response.json();
}
