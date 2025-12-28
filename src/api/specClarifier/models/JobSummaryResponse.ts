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
import type { JobStatus } from './JobStatus';
/**
 * Lightweight job summary for POST responses.
 *
 * Returns minimal job metadata without the full request or result payloads.
 * This keeps POST responses lightweight as required by the API specification.
 *
 * Attributes:
 * id: Unique identifier for the job
 * status: Current status of the job
 * created_at: UTC timestamp when job was created
 * updated_at: UTC timestamp when job was last updated
 * last_error: Optional error message if job failed
 */
export type JobSummaryResponse = {
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
    last_error?: (string | null);
};

