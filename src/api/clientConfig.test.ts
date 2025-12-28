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
import { describe, it, expect, afterEach } from 'vitest';
import { getSoftwarePlannerConfig, getSpecClarifierConfig, createHeaders } from './clientConfig';
import { clearEnvCache } from './env';

describe('Client Configuration', () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    clearEnvCache();
    Object.keys(import.meta.env).forEach(key => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  describe('getSoftwarePlannerConfig', () => {
    it('returns config with base URL from environment', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const config = getSoftwarePlannerConfig();

      expect(config.baseUrl).toBe('http://localhost:8080');
      expect(config.fetchImpl).toBe(fetch);
    });

    it('uses custom fetch implementation when provided', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const customFetch = (() => {}) as any;
      const config = getSoftwarePlannerConfig(customFetch);

      expect(config.fetchImpl).toBe(customFetch);
    });

    it('throws error when base URL is not configured', () => {
      delete (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL;

      expect(() => getSoftwarePlannerConfig()).toThrow(/VITE_SOFTWARE_PLANNER_BASE_URL/);
    });
  });

  describe('getSpecClarifierConfig', () => {
    it('returns config with base URL from environment', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const config = getSpecClarifierConfig();

      expect(config.baseUrl).toBe('http://localhost:8081');
      expect(config.fetchImpl).toBe(fetch);
    });

    it('uses custom fetch implementation when provided', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL = 'http://localhost:8081';

      const customFetch = (() => {}) as any;
      const config = getSpecClarifierConfig(customFetch);

      expect(config.fetchImpl).toBe(customFetch);
    });

    it('throws error when base URL is not configured', () => {
      (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL = 'http://localhost:8080';
      delete (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL;

      expect(() => getSpecClarifierConfig()).toThrow(/VITE_SPEC_CLARIFIER_BASE_URL/);
    });
  });

  describe('createHeaders', () => {
    it('returns default headers with Content-Type', () => {
      const headers = createHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('merges additional headers', () => {
      const headers = createHeaders({
        'x-api-key': 'test-key',
        'Custom-Header': 'value',
      });

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
        'Custom-Header': 'value',
      });
    });

    it('sanitizes header values to prevent injection', () => {
      const headers = createHeaders({
        'x-api-key': 'test-key\r\nInjected-Header: malicious',
      });

      expect(headers['x-api-key']).toBe('test-keyInjected-Header: malicious');
      expect(headers['x-api-key']).not.toContain('\r');
      expect(headers['x-api-key']).not.toContain('\n');
    });

    it('removes control characters from header values', () => {
      const headers = createHeaders({
        'x-test': 'value\x00with\x01control\x1Fchars',
      });

      expect(headers['x-test']).toBe('valuewithcontrolchars');
      expect(headers['x-test']).not.toMatch(/[\x00-\x1F\x7F]/);
    });
  });
});
