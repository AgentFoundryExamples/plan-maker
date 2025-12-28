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
 * Environment variable configuration with validation
 */

interface EnvConfig {
  softwarePlannerBaseUrl: string;
  specClarifierBaseUrl: string;
}

let envConfig: EnvConfig | undefined;

/**
 * Validates that a required environment variable is set
 * @param key - The environment variable key
 * @param value - The environment variable value
 * @throws Error if the value is undefined or empty
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please ensure ${key} is set in your .env file.\n` +
        `Refer to .env.example for configuration examples.`
    );
  }
  return value.trim();
}

/**
 * Clears the cached environment configuration (primarily for testing)
 */
export function clearEnvCache(): void {
  envConfig = undefined;
}

/**
 * Loads and validates environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  if (envConfig) {
    return envConfig;
  }

  envConfig = {
    softwarePlannerBaseUrl: requireEnv(
      'VITE_SOFTWARE_PLANNER_BASE_URL',
      import.meta.env.VITE_SOFTWARE_PLANNER_BASE_URL
    ),
    specClarifierBaseUrl: requireEnv(
      'VITE_SPEC_CLARIFIER_BASE_URL',
      import.meta.env.VITE_SPEC_CLARIFIER_BASE_URL
    ),
  };

  return envConfig;
}

/**
 * Get the environment configuration with error handling for display
 */
export function getSafeEnvConfig(): EnvConfig | null {
  try {
    return getEnvConfig();
  } catch (error) {
    console.error('Failed to load environment configuration:', error);
    return null;
  }
}

export default getEnvConfig;
