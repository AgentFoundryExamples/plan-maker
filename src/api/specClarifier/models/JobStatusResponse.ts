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
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClarifiedPlan } from './ClarifiedPlan';
import type { JobStatus } from './JobStatus';
/**
 * Job status response with conditional result field.
 *
 * Returns job status and details. The result field is always present in the response
 * schema but is conditionally populated based on the APP_SHOW_JOB_RESULT flag and
 * job status. In production mode (flag=False), the result is always set to null to
 * keep responses lightweight and prevent clients from depending on embedded results.
 *
 * The result field behavior:
 * - Production mode (APP_SHOW_JOB_RESULT=false): result is always null
 * - Development mode (APP_SHOW_JOB_RESULT=true): result contains ClarifiedPlan when
 * job status is SUCCESS, otherwise null
 *
 * Attributes:
 * id: Unique identifier for the job
 * status: Current status of the job
 * created_at: UTC timestamp when job was created
 * updated_at: UTC timestamp when job was last updated
 * last_error: Optional error message if job failed
 * result: Optional clarified plan result (null in production, populated in
 * development mode only when status is SUCCESS)
 */
export type JobStatusResponse = {
  /**
   * Unique identifier for the job
   */
  id: string;
  /**
   * Current status of the job
   */
  status: JobStatus;
  /**
   * UTC timestamp when job was created
   */
  created_at: string;
  /**
   * UTC timestamp when job was last updated
   */
  updated_at: string;
  /**
   * Optional error message if job failed
   */
  last_error?: string | null;
  /**
   * Optional clarified plan result when job succeeds (development mode only)
   */
  result?: ClarifiedPlan | null;
};
