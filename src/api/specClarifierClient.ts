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
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.detail && typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
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
    throw new Error(`Failed to create clarification job: ${errorMessage}`);
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
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      // Only include sanitized error information
      if (errorBody.detail && typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
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
    throw new Error(`Failed to get clarification status: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Poll for clarification job completion
 * @param jobId - The job ID to poll
 * @param options - Polling options
 * @returns Completed job status
 * @throws Error if polling parameters are invalid or job doesn't complete in time
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
  
  // Validate polling parameters
  if (typeof maxAttempts !== 'number' || !Number.isFinite(maxAttempts) || maxAttempts <= 0) {
    throw new Error('maxAttempts must be a positive number');
  }
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error('intervalMs must be a positive number');
  }
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await getClarifierStatus(jobId, fetchImpl);
      
      if (status.status === JobStatus.SUCCESS || status.status === JobStatus.FAILED) {
        return status;
      }
    } catch (error) {
      // Log error but continue polling unless it's the last attempt
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // Continue to next attempt for transient errors
    }
    
    // Don't wait on the last attempt
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error(
    `Clarification job did not complete within ${maxAttempts} attempts. ` +
    `Please check the job status or increase maxAttempts if needed.`
  );
}
