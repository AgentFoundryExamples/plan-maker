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
 *
 * **OpenAPI Contract Reference (spec-clarifier.openapi.json):**
 *
 * ## Async Clarification Endpoint
 * - **Endpoint**: POST /v1/clarifications
 * - **Description**: Creates an async clarification job and returns immediately with job ID
 * - **Response Status**: 202 Accepted
 *
 * ## Request Schema: ClarificationRequestWithConfig
 * - `plan` (required): PlanInput object containing:
 *   - `specs` (required): Array of SpecInput objects with:
 *     - `purpose` (required): String - purpose of the specification
 *     - `vision` (required): String - vision statement
 *     - `must`: Array of strings - must-have requirements
 *     - `dont`: Array of strings - don't requirements (things to avoid)
 *     - `nice`: Array of strings - nice-to-have features
 *     - `open_questions`: Array of strings - questions needing clarification
 *     - `assumptions`: Array of strings - assumptions made
 *
 * - `answers`: Array of QuestionAnswer objects (optional, currently ignored):
 *   - `spec_index` (required): Number (minimum 0) - index of spec containing question
 *   - `question_index` (required): Number (minimum 0) - index of question within spec
 *   - `question` (required): String - the question text
 *   - `answer` (required): String - the answer provided
 *
 * - `config`: Optional ClarificationConfig to override defaults:
 *   - `provider`: 'openai' | 'anthropic' | 'dummy' | null
 *   - `model`: String (min length 1) | null
 *   - `system_prompt_id`: String (min length 1) | null
 *   - `temperature`: Number (0.0-2.0) | null
 *   - `max_tokens`: Integer (> 0) | null
 *
 * ## Response Schema: JobSummaryResponse (202 Accepted)
 * - `id` (required): String (UUID format) - unique job identifier
 * - `status` (required): JobStatus enum - current job status (PENDING, RUNNING, SUCCESS, FAILED)
 * - `created_at` (required): String (ISO 8601 datetime) - UTC timestamp when job was created
 * - `updated_at` (required): String (ISO 8601 datetime) - UTC timestamp when job was last updated
 * - `last_error`: String | null - optional error message if job failed
 *
 * ## Error Responses
 * - **400 Bad Request**: Invalid configuration (provider/model combination not allowed)
 *   - Example: `{ "detail": "Model 'invalid-model' is not allowed for provider 'openai'..." }`
 *
 * - **422 Unprocessable Entity**: Validation error (missing required fields or wrong types)
 *   - Example: `{ "detail": [{ "type": "missing", "loc": ["body", "plan", "specs", 0, "vision"], "msg": "Field required" }] }`
 *
 * ## Important Notes
 * - Spec objects are sent **unmodified** - no mutations are applied by the client
 * - Missing or invalid `VITE_SPEC_CLARIFIER_BASE_URL` throws error before POST attempt
 * - Job processing is asynchronous - use GET /v1/clarifications/{job_id} to poll status
 * - Empty answers array or omitted sections are allowed per API contract
 */

import { getSpecClarifierConfig, createHeaders } from './clientConfig';
import type {
  ClarificationRequestWithConfig,
  JobSummaryResponse,
  JobStatusResponse,
} from './specClarifier';
import { JobStatus } from './specClarifier';
import { validateUUID } from '../utils/validators';

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
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.detail && typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    }
    throw new Error(`Failed to create clarification job: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Get the status and result of a clarification job
 * @param jobId - The job ID to check (must be valid UUID format)
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Job status with optional result
 * @throws Error if jobId is not a valid UUID or request fails
 */
export async function getClarifierStatus(
  jobId: string,
  fetchImpl?: typeof fetch
): Promise<JobStatusResponse> {
  // Validate UUID format before making request
  validateUUID(jobId);
  
  const config = getSpecClarifierConfig(fetchImpl);

  const response = await config.fetchImpl(
    `${config.baseUrl}/v1/clarifications/${jobId}`,
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
      if (errorBody.detail && typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
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
  if (
    typeof maxAttempts !== 'number' ||
    !Number.isFinite(maxAttempts) ||
    maxAttempts <= 0
  ) {
    throw new Error('maxAttempts must be a positive number');
  }
  if (
    typeof intervalMs !== 'number' ||
    !Number.isFinite(intervalMs) ||
    intervalMs <= 0
  ) {
    throw new Error('intervalMs must be a positive number');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await getClarifierStatus(jobId, fetchImpl);

      if (
        status.status === JobStatus.SUCCESS ||
        status.status === JobStatus.FAILED
      ) {
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

/**
 * Debug information response structure
 */
export interface ClarifierDebugResponse {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Get debug information for a clarification job
 * 
 * This endpoint provides detailed debug information for development and troubleshooting.
 * It is disabled by default in production environments.
 * 
 * @param jobId - The job ID to get debug info for (must be valid UUID format)
 * @param fetchImpl - Optional custom fetch implementation
 * @returns Debug information for the job
 * @throws Error with message "Debug endpoint is disabled" when endpoint returns 403
 * @throws Error if jobId is not a valid UUID
 * @throws Error for other failures (404, 422, network errors)
 */
export async function getClarifierDebug(
  jobId: string,
  fetchImpl?: typeof fetch
): Promise<ClarifierDebugResponse> {
  // Validate UUID format before making request
  validateUUID(jobId);
  
  const config = getSpecClarifierConfig(fetchImpl);

  const response = await config.fetchImpl(
    `${config.baseUrl}/v1/clarifications/${jobId}/debug`,
    {
      method: 'GET',
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    // Handle 403 specially - this means debug endpoint is disabled
    if (response.status === 403) {
      throw new Error('Debug endpoint is disabled');
    }

    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = JSON.parse(errorText);
      if (errorBody.detail && typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      } else {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    } catch {
      // JSON parsing failed, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
      }
    }
    throw new Error(`Failed to get clarification debug info: ${errorMessage}`);
  }

  return response.json();
}
