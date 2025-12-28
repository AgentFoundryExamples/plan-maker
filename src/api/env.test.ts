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
