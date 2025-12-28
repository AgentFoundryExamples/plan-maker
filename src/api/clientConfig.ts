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
 * Shared client configuration for API calls
 */

import { getEnvConfig } from './env';

/**
 * Configuration for API clients
 */
export interface ApiClientConfig {
  baseUrl: string;
  fetchImpl: typeof fetch;
}

/**
 * Get configuration for Software Planner API client
 * @param fetchImpl - Optional custom fetch implementation for testing
 * @throws Error if VITE_SOFTWARE_PLANNER_BASE_URL is not configured
 */
export function getSoftwarePlannerConfig(fetchImpl?: typeof fetch): ApiClientConfig {
  const env = getEnvConfig();
  return {
    baseUrl: env.softwarePlannerBaseUrl,
    fetchImpl: fetchImpl || fetch,
  };
}

/**
 * Get configuration for Spec Clarifier API client
 * @param fetchImpl - Optional custom fetch implementation for testing
 * @throws Error if VITE_SPEC_CLARIFIER_BASE_URL is not configured
 */
export function getSpecClarifierConfig(fetchImpl?: typeof fetch): ApiClientConfig {
  const env = getEnvConfig();
  return {
    baseUrl: env.specClarifierBaseUrl,
    fetchImpl: fetchImpl || fetch,
  };
}

/**
 * Sanitize header value to prevent injection attacks
 * @param value - Header value to sanitize
 * @returns Sanitized header value
 */
function sanitizeHeaderValue(value: string): string {
  // Remove control characters (including newlines, carriage returns, tabs, null bytes)
  // that could enable header injection or other attacks
  return value.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Create headers for API requests
 * @param additionalHeaders - Optional additional headers to include
 */
export function createHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Sanitize additional headers to prevent injection
  if (additionalHeaders) {
    for (const [key, value] of Object.entries(additionalHeaders)) {
      headers[key] = sanitizeHeaderValue(value);
    }
  }
  
  return headers;
}
