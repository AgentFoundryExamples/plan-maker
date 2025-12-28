import { describe, it, expect, afterEach, vi } from 'vitest';
import { getEnvConfig, getSafeEnvConfig, clearEnvCache } from './env';

describe('Environment Configuration', () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Clear the cache before restoring env
    clearEnvCache();
    // Restore original env
    Object.keys(import.meta.env).forEach(key => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  describe('getEnvConfig', () => {
    it('returns config when all required env vars are set', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const config = getEnvConfig();

      expect(config).toEqual({
        softwarePlannerBaseUrl: 'http://localhost:8080',
        specClarifierBaseUrl: 'http://localhost:8081',
      });
    });

    it('throws error when VITE_SOFTWARE_PLANNER_BASE_URL is missing', () => {
      delete (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL;
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      expect(() => getEnvConfig()).toThrow(/VITE_SOFTWARE_PLANNER_BASE_URL/);
    });

    it('throws error when VITE_SPEC_CLARIFIER_BASE_URL is missing', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      delete (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL;

      expect(() => getEnvConfig()).toThrow(/VITE_SPEC_CLARIFIER_BASE_URL/);
    });

    it('throws error when env var is empty string', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = '';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      expect(() => getEnvConfig()).toThrow(/VITE_SOFTWARE_PLANNER_BASE_URL/);
    });

    it('trims whitespace from env values', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = '  http://localhost:8080  ';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = '  http://localhost:8081  ';

      const config = getEnvConfig();

      expect(config.softwarePlannerBaseUrl).toBe('http://localhost:8080');
      expect(config.specClarifierBaseUrl).toBe('http://localhost:8081');
    });
  });

  describe('getSafeEnvConfig', () => {
    it('returns config when env vars are valid', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const config = getSafeEnvConfig();

      expect(config).toEqual({
        softwarePlannerBaseUrl: 'http://localhost:8080',
        specClarifierBaseUrl: 'http://localhost:8081',
      });
    });

    it('returns null when env vars are missing', () => {
      delete (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL;

      const consoleError = console.error;
      console.error = vi.fn();

      const config = getSafeEnvConfig();

      expect(config).toBeNull();
      expect(console.error).toHaveBeenCalled();

      console.error = consoleError;
    });
  });
});
