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
 * Spec Clarifier API Client Wrapper
 * Provides typed helper functions for interacting with the Spec Clarifier API
 */

import { getSpecClarifierConfig, createHeaders } from './clientConfig';
import type {
  ClarificationRequestWithConfig,
  JobSummaryResponse,
  JobStatusResponse,
} from './specClarifier';
import { JobStatus } from './specClarifier';

/**
 * Options for clarification operations
 */
export interface ClarifyOptions {
  fetchImpl?: typeof fetch;
}

/**
 * Create an asynchronous clarification job
 * @param request - Clarification request with plan and optional config
 * @param options - Optional fetch implementation
 * @returns Job summary with ID and initial status
 */
export async function clarifySpecs(
  request: ClarificationRequestWithConfig,
  options: ClarifyOptions = {}
): Promise<JobSummaryResponse> {
  const config = getSpecClarifierConfig(options.fetchImpl);
  const headers = createHeaders();

  const response = await config.fetchImpl(
    `${config.baseUrl}/v1/clarifications`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Failed to create clarification job: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get the status and result of a clarification job
 * @param jobId - The job ID to check
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Job status with optional result
 */
export async function getClarifierStatus(
  jobId: string,
  fetchImpl?: typeof fetch
): Promise<JobStatusResponse> {
  const config = getSpecClarifierConfig(fetchImpl);

  const response = await config.fetchImpl(
    `${config.baseUrl}/v1/clarifications/${jobId}`,
    {
      method: 'GET',
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Failed to get clarification status: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Poll for clarification job completion
 * @param jobId - The job ID to poll
 * @param options - Polling options
 * @returns Completed job status
 */
export async function waitForClarification(
  jobId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<JobStatusResponse> {
  const { maxAttempts = 60, intervalMs = 2000, fetchImpl } = options;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getClarifierStatus(jobId, fetchImpl);
    
    if (status.status === JobStatus.SUCCESS || status.status === JobStatus.FAILED) {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Clarification job ${jobId} did not complete within ${maxAttempts} attempts`);
}
