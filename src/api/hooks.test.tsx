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
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreatePlanAsync } from './hooks';
import { clearEnvCache } from './env';
import type { AsyncPlanJob } from './softwarePlannerClient';

describe('React Query Setup', () => {
  it('should render children within QueryClientProvider', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const TestComponent = () => <div>Test Content</div>;

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should create QueryClient with correct default options', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });

    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(
      5 * 60 * 1000
    );
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(
      false
    );
  });
});

describe('useCreatePlanAsync', () => {
  const originalEnv = { ...import.meta.env };
  let queryClient: QueryClient;

  function setupEnv() {
    (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL =
      'http://localhost:8080';
    (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL =
      'http://localhost:8081';
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    clearEnvCache();
    Object.keys(import.meta.env).forEach(key => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
    vi.restoreAllMocks();
  });

  it('successfully creates an async plan job', async () => {
    setupEnv();

    const mockResponse: AsyncPlanJob = {
      job_id: 'test-job-123',
      status: 'QUEUED',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    let mutateResult: AsyncPlanJob | undefined;

    function TestComponent() {
      const mutation = useCreatePlanAsync({
        onSuccess: data => {
          mutateResult = data;
        },
      });

      React.useEffect(() => {
        mutation.mutate({
          description: 'Build a REST API',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isPending && <div>Loading...</div>}
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
          {mutation.isSuccess && <div>Success: {mutation.data?.job_id}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success: test-job-123')).toBeInTheDocument();
    });

    expect(mutateResult).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/plans',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ description: 'Build a REST API' }),
      })
    );
  });

  it('validates empty description before making request', async () => {
    setupEnv();

    const mockFetch = vi.fn();

    let errorResult: Error | null = null;

    function TestComponent() {
      const mutation = useCreatePlanAsync({
        onError: error => {
          errorResult = error;
        },
      });

      React.useEffect(() => {
        mutation.mutate({
          description: '',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Description is required/)
      ).toBeInTheDocument();
    });

    expect(errorResult?.message).toContain('Description is required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('validates whitespace-only description', async () => {
    setupEnv();

    const mockFetch = vi.fn();

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: '   ',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Description is required/)
      ).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles HTTP 422 validation errors', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: 'Validation error',
        status_code: 422,
        details: [
          {
            loc: ['body', 'description'],
            msg: 'Field required',
            type: 'missing',
          },
        ],
      }),
    });

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('handles network failures', async () => {
    setupEnv();

    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error('Network request failed'));

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network request failed/)).toBeInTheDocument();
    });
  });

  it('prevents duplicate submissions while mutation is pending', async () => {
    setupEnv();

    let resolvePromise: (value: any) => void;
    const mockFetch = vi.fn().mockReturnValue(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                description: 'Test',
                fetchImpl: mockFetch as any,
              })
            }
            disabled={mutation.isPending}
          >
            Submit
          </button>
          {mutation.isPending && <div>Pending</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    const button = screen.getByRole('button');

    // First click
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    // Verify only one call was made
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ job_id: 'test', status: 'QUEUED' }),
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('logs request and response in development mode', async () => {
    setupEnv();
    vi.stubEnv('DEV', true);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockResponse: AsyncPlanJob = {
      job_id: 'test-job',
      status: 'QUEUED',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test project',
          model: 'gpt-4',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <div>{mutation.isSuccess && <div>Success</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Verify request was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      '[REQUEST]',
      expect.objectContaining({
        description: 'Test project',
        model: 'gpt-4',
      })
    );

    // Verify response was logged
    expect(consoleSpy).toHaveBeenCalledWith('[RESPONSE]', mockResponse);
  });

  it('does not log in production mode', async () => {
    setupEnv();
    vi.stubEnv('DEV', false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockResponse: AsyncPlanJob = {
      job_id: 'test-job',
      status: 'QUEUED',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test project',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <div>{mutation.isSuccess && <div>Success</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Verify no logging occurred
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('throws descriptive error when environment variable is missing', async () => {
    // Don't set up environment variables
    delete (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL;

    const mockFetch = vi.fn();

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const errorText = screen.getByText(/Error:/);
      expect(errorText).toBeInTheDocument();
      expect(errorText.textContent).toContain('VITE_SOFTWARE_PLANNER_BASE_URL');
    });
  });

  it('includes API key in request when provided', async () => {
    setupEnv();

    const mockResponse: AsyncPlanJob = {
      job_id: 'test-job',
      status: 'QUEUED',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test project',
          apiKey: 'test-api-key',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <div>{mutation.isSuccess && <div>Success</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
      })
    );
  });

  it('passes optional model and system_prompt parameters', async () => {
    setupEnv();

    const mockResponse: AsyncPlanJob = {
      job_id: 'test-job',
      status: 'QUEUED',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    function TestComponent() {
      const mutation = useCreatePlanAsync();

      React.useEffect(() => {
        mutation.mutate({
          description: 'Test project',
          model: 'gpt-4-turbo',
          system_prompt: 'Custom system prompt',
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <div>{mutation.isSuccess && <div>Success</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          description: 'Test project',
          model: 'gpt-4-turbo',
          system_prompt: 'Custom system prompt',
        }),
      })
    );
  });

  it('preserves all status values from response untouched', async () => {
    setupEnv();

    const statusValues: Array<'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'> = [
      'QUEUED',
      'RUNNING',
      'SUCCEEDED',
      'FAILED',
    ];

    for (const status of statusValues) {
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job',
        status: status,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      let capturedResponse: AsyncPlanJob | undefined;

      function TestComponent() {
        const mutation = useCreatePlanAsync({
          onSuccess: data => {
            capturedResponse = data;
          },
        });

        React.useEffect(() => {
          mutation.mutate({
            description: 'Test project',
            fetchImpl: mockFetch as any,
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <div>{mutation.isSuccess && <div>Success</div>}</div>;
      }

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });

      // Verify status value is preserved exactly as received
      expect(capturedResponse).toBeDefined();
      expect(capturedResponse?.status).toBe(status);

      unmount();

      // Reset query client for next iteration
      queryClient.clear();
    }
  });
});
