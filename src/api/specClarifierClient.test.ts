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
  clarifySpecs,
  getClarifierStatus,
  waitForClarification,
  getClarifierDebug,
} from './specClarifierClient';
import { clearEnvCache } from './env';
import { JobStatus } from './specClarifier';

describe('Spec Clarifier Client', () => {
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

  describe('clarifySpecs', () => {
    it('successfully creates a clarification job', async () => {
      setupEnv();

      const mockResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: JobStatus.PENDING,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        plan: {
          specs: [
            {
              purpose: 'Test',
              vision: 'Test vision',
              open_questions: ['What language?'],
            },
          ],
        },
      };

      const result = await clarifySpecs(request, {
        fetchImpl: mockFetch as any,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/v1/clarifications',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(request),
        })
      );
    });

    it('throws error on failed request', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ detail: 'Invalid request' }),
      });

      const request = {
        plan: {
          specs: [
            {
              purpose: 'Test',
              vision: 'Test vision',
            },
          ],
        },
      };

      await expect(
        clarifySpecs(request, { fetchImpl: mockFetch as any })
      ).rejects.toThrow(/Failed to create clarification job/);
    });
  });

  describe('getClarifierStatus', () => {
    it('successfully retrieves job status', async () => {
      setupEnv();

      const mockResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: JobStatus.SUCCESS,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:05Z',
        result: {
          specs: [
            {
              purpose: 'Test',
              vision: 'Test vision',
              must: ['Requirement 1'],
              dont: ['Anti-pattern 1'],
              nice: ['Nice feature 1'],
              assumptions: ['Assumption 1'],
            },
          ],
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getClarifierStatus('550e8400-e29b-41d4-a716-446655440000', mockFetch as any);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/v1/clarifications/550e8400-e29b-41d4-a716-446655440000',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('throws error when job not found', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ detail: 'Job not found' }),
      });

      await expect(
        getClarifierStatus('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Failed to get clarification status/);
    });

    it('throws error when UUID format is invalid', async () => {
      setupEnv();

      await expect(
        getClarifierStatus('invalid-id', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);

      await expect(
        getClarifierStatus('not-a-uuid', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);

      await expect(
        getClarifierStatus('', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);
    });
  });

  describe('waitForClarification', () => {
    it('returns immediately when job is already completed', async () => {
      setupEnv();

      const mockResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: JobStatus.SUCCESS,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:05Z',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
        fetchImpl: mockFetch as any,
        maxAttempts: 10,
        intervalMs: 100,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('polls until job completes', async () => {
      setupEnv();

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        const status = callCount < 3 ? JobStatus.RUNNING : JobStatus.SUCCESS;
        return {
          ok: true,
          json: async () => ({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:05Z',
          }),
        };
      });

      const result = await waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
        fetchImpl: mockFetch as any,
        maxAttempts: 10,
        intervalMs: 10,
      });

      expect(result.status).toBe(JobStatus.SUCCESS);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('returns when job fails', async () => {
      setupEnv();

      const mockResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: JobStatus.FAILED,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:05Z',
        last_error: 'Processing error',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
        fetchImpl: mockFetch as any,
        maxAttempts: 10,
        intervalMs: 10,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws error when max attempts reached', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: JobStatus.RUNNING,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:05Z',
        }),
      });

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          fetchImpl: mockFetch as any,
          maxAttempts: 3,
          intervalMs: 10,
        })
      ).rejects.toThrow(/did not complete within 3 attempts/);
    });

    it('validates maxAttempts is positive', async () => {
      setupEnv();

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          maxAttempts: 0,
        })
      ).rejects.toThrow(/maxAttempts must be a positive number/);

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          maxAttempts: -1,
        })
      ).rejects.toThrow(/maxAttempts must be a positive number/);
    });

    it('validates maxAttempts is a valid number', async () => {
      setupEnv();

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          maxAttempts: NaN,
        })
      ).rejects.toThrow(/maxAttempts must be a positive number/);

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          maxAttempts: Infinity,
        })
      ).rejects.toThrow(/maxAttempts must be a positive number/);
    });

    it('validates intervalMs is positive', async () => {
      setupEnv();

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          intervalMs: 0,
        })
      ).rejects.toThrow(/intervalMs must be a positive number/);

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          intervalMs: -1,
        })
      ).rejects.toThrow(/intervalMs must be a positive number/);
    });

    it('validates intervalMs is a valid number', async () => {
      setupEnv();

      await expect(
        waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
          intervalMs: NaN,
        })
      ).rejects.toThrow(/intervalMs must be a positive number/);
    });

    it('handles transient errors during polling', async () => {
      setupEnv();

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Server error' }),
            text: async () => 'Server error',
          };
        }
        // Second call succeeds
        return {
          ok: true,
          json: async () => ({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: JobStatus.SUCCESS,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:05Z',
          }),
        };
      });

      const result = await waitForClarification('550e8400-e29b-41d4-a716-446655440000', {
        fetchImpl: mockFetch as any,
        maxAttempts: 10,
        intervalMs: 10,
      });

      expect(result.status).toBe(JobStatus.SUCCESS);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClarifierDebug', () => {
    it('successfully retrieves debug information', async () => {
      setupEnv();

      const mockResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'SUCCESS',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:05Z',
        config: {
          provider: 'openai',
          model: 'gpt-5.1',
          temperature: 0.1,
        },
        metadata: {
          tokens_used: 1500,
          duration_ms: 2500,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getClarifierDebug('550e8400-e29b-41d4-a716-446655440000', mockFetch as any);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/v1/clarifications/550e8400-e29b-41d4-a716-446655440000/debug',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('throws "Debug endpoint is disabled" error when 403 returned', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Debug endpoint is disabled' }),
      });

      await expect(
        getClarifierDebug('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Debug endpoint is disabled/);
    });

    it('throws error when job not found (404)', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ detail: 'Job not found' }),
      });

      await expect(
        getClarifierDebug('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Failed to get clarification debug info/);
    });

    it('throws error when UUID format is invalid', async () => {
      setupEnv();

      await expect(
        getClarifierDebug('invalid-id', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);

      await expect(
        getClarifierDebug('not-a-uuid', vi.fn() as any)
      ).rejects.toThrow(/Invalid UUID format/);
    });

    it('handles network errors gracefully', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        getClarifierDebug('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Network error/);
    });

    it('handles 422 validation errors', async () => {
      setupEnv();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => JSON.stringify({
          detail: [
            {
              loc: ['path', 'job_id'],
              msg: 'Input should be a valid UUID',
              type: 'uuid_parsing',
            },
          ],
        }),
      });

      await expect(
        getClarifierDebug('550e8400-e29b-41d4-a716-446655440000', mockFetch as any)
      ).rejects.toThrow(/Failed to get clarification debug info/);
    });
  });
});
