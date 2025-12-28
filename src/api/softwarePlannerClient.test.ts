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
import {
  createPlan,
  createPlanAsync,
  getPlanById,
  listPlans,
} from './softwarePlannerClient';
import { clearEnvCache } from './env';
import type { PlanResponse } from './softwarePlanner';

describe('Software Planner Client', () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    clearEnvCache();
    Object.keys(import.meta.env).forEach(key => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  function setupEnv() {
    (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL =
      'http://localhost:8080';
    (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL =
      'http://localhost:8081';
  }

  describe('createPlan', () => {
    it('successfully creates a plan', async () => {
      setupEnv();

      const mockResponse: PlanResponse = {
        specs: [
          {
            purpose: 'Test purpose',
            vision: 'Test vision',
            must: ['Requirement 1'],
            dont: ['Anti-pattern 1'],
            nice: ['Nice feature 1'],
          },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createPlan(
        { description: 'Test project' },
        { fetchImpl: mockFetch as any }
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plan',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ description: 'Test project' }),
        })
      );
    });

    it('includes API key in headers when provided', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ specs: [] }),
      });

      await createPlan(
        { description: 'Test' },
        { apiKey: 'test-key', fetchImpl: mockFetch as any }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
          }),
        })
      );
    });

    it('throws error on failed request', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid request' }),
      });

      await expect(
        createPlan({ description: 'Test' }, { fetchImpl: mockFetch as any })
      ).rejects.toThrow(/Failed to create plan/);
    });
  });

  describe('createPlanAsync', () => {
    it('successfully creates an async plan job', async () => {
      setupEnv();

      const mockResponse = {
        job_id: 'test-job-id',
        status: 'QUEUED' as const,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createPlanAsync(
        { description: 'Test project' },
        { fetchImpl: mockFetch as any }
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws error on failed request', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid request' }),
      });

      await expect(
        createPlanAsync(
          { description: 'Test' },
          { fetchImpl: mockFetch as any }
        )
      ).rejects.toThrow(/Failed to create async plan/);
    });
  });

  describe('getPlanById', () => {
    it('successfully retrieves plan status', async () => {
      setupEnv();

      const mockResponse = {
        job_id: 'test-job-id',
        status: 'SUCCEEDED' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:05Z',
        result: {
          specs: [
            {
              purpose: 'Test',
              vision: 'Test vision',
            },
          ],
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPlanById('test-job-id', mockFetch as any);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans/test-job-id',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('throws error when job not found', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Job not found' }),
      });

      await expect(getPlanById('invalid-id', mockFetch as any)).rejects.toThrow(
        /Failed to get plan status/
      );
    });
  });

  describe('listPlans', () => {
    it('successfully lists plans without limit', async () => {
      setupEnv();

      const mockResponse = {
        jobs: [],
        total: 0,
        limit: 100,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listPlans(undefined, mockFetch as any);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('includes limit parameter when provided', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0, limit: 50 }),
      });

      await listPlans(50, mockFetch as any);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=50',
        expect.any(Object)
      );
    });

    it('throws error on failed request', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(listPlans(undefined, mockFetch as any)).rejects.toThrow(
        /Failed to list plans/
      );
    });
  });
});
