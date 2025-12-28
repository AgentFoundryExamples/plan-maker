/**
 * Environment variable configuration with validation
 */

interface EnvConfig {
  softwarePlannerBaseUrl: string;
  specClarifierBaseUrl: string;
}

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
 * Loads and validates environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  try {
    return {
      softwarePlannerBaseUrl: requireEnv(
        'VITE_SOFTWARE_PLANNER_BASE_URL',
        import.meta.env.VITE_SOFTWARE_PLANNER_BASE_URL
      ),
      specClarifierBaseUrl: requireEnv(
        'VITE_SPEC_CLARIFIER_BASE_URL',
        import.meta.env.VITE_SPEC_CLARIFIER_BASE_URL
      ),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Environment Configuration Error:', error.message);
      throw error;
    }
    throw new Error('Unknown environment configuration error');
  }
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
