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
  getStatusMetadata,
  PLANNER_STATUS_MAP,
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
        job_id: '550e8400-e29b-41d4-a716-446655440000',
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

      const result = await getPlanById('550e8400-e29b-41d4-a716-446655440000', mockFetch as any);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans/550e8400-e29b-41d4-a716-446655440000',
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

      await expect(
        getPlanById('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Failed to get plan status/);
    });

    it('throws error when UUID format is invalid', async () => {
      setupEnv();

      await expect(
        getPlanById('invalid-id', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);

      await expect(
        getPlanById('not-a-uuid', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);

      await expect(
        getPlanById('', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);
    });
  });

  describe('listPlans', () => {
    it('successfully lists plans without limit (defaults to 100)', async () => {
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

      const result = await listPlans({ fetchImpl: mockFetch as any });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=100',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('respects custom limit parameter', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0, limit: 50 }),
      });

      await listPlans({ limit: 50, fetchImpl: mockFetch as any });

      // Should pass through without clamping (up to 1000)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=50',
        expect.any(Object)
      );
    });

    it('respects limit when less than default', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0, limit: 10 }),
      });

      await listPlans({ limit: 10, fetchImpl: mockFetch as any });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=10',
        expect.any(Object)
      );
    });

    it('includes cursor parameter when provided', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0, limit: 100 }),
      });

      await listPlans({
        cursor: 'next-page-token',
        fetchImpl: mockFetch as any,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=100&cursor=next-page-token',
        expect.any(Object)
      );
    });

    it('does not include cursor parameter when empty string', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0, limit: 100 }),
      });

      await listPlans({
        cursor: '',
        fetchImpl: mockFetch as any,
      });

      // Empty cursor should not be sent
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/plans?limit=100',
        expect.any(Object)
      );
    });

    it('throws error on failed request', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(listPlans({ fetchImpl: mockFetch as any })).rejects.toThrow(
        /Failed to list plans/
      );
    });

    it('throws error when limit is less than 1', async () => {
      setupEnv();

      await expect(
        listPlans({ limit: 0, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit: 0/);

      await expect(
        listPlans({ limit: -5, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit: -5/);
    });

    it('throws error when limit is greater than 1000', async () => {
      setupEnv();

      await expect(
        listPlans({ limit: 1001, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit: 1001/);

      await expect(
        listPlans({ limit: 5000, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit: 5000/);
    });

    it('throws error when limit is not a valid number', async () => {
      setupEnv();

      await expect(
        listPlans({ limit: NaN, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit/);

      await expect(
        listPlans({ limit: Infinity, fetchImpl: vi.fn() as any })
      ).rejects.toThrow(/Invalid limit/);
    });
  });

  describe('Status Mapping', () => {
    it('returns correct metadata for QUEUED status', () => {
      const metadata = getStatusMetadata('QUEUED');

      expect(metadata).toEqual({
        label: 'Queued',
        description: 'Job is waiting to be processed',
        color: 'var(--color-info)',
        icon: 'clock',
        progress: 0,
      });
    });

    it('returns correct metadata for RUNNING status', () => {
      const metadata = getStatusMetadata('RUNNING');

      expect(metadata).toEqual({
        label: 'Running',
        description: 'Job is currently being processed',
        color: 'var(--color-warning)',
        icon: 'spinner',
        progress: 50,
      });
    });

    it('returns correct metadata for SUCCEEDED status', () => {
      const metadata = getStatusMetadata('SUCCEEDED');

      expect(metadata).toEqual({
        label: 'Succeeded',
        description: 'Job completed successfully',
        color: 'var(--color-success)',
        icon: 'check',
        progress: 100,
      });
    });

    it('returns correct metadata for FAILED status', () => {
      const metadata = getStatusMetadata('FAILED');

      expect(metadata).toEqual({
        label: 'Failed',
        description: 'Job failed to complete',
        color: 'var(--color-danger)',
        icon: 'error',
        progress: 100,
      });
    });

    it('returns Unknown metadata for unrecognized status', () => {
      const metadata = getStatusMetadata('UNKNOWN_STATUS');

      expect(metadata).toEqual({
        label: 'Unknown',
        description: 'Status: UNKNOWN_STATUS',
        color: 'var(--color-text-secondary)',
        icon: 'question',
        progress: 0,
      });
    });
  });
});
