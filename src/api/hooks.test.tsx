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
import {
  useCreatePlanAsync,
  usePlansList,
  useSubmitClarifications,
  useClarificationStatus,
} from './hooks';
import { clearEnvCache } from './env';
import type { AsyncPlanJob } from './softwarePlannerClient';
import { JobStatus } from './specClarifier';
import * as specClarifierClient from './specClarifierClient';

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

describe('usePlansList', () => {
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

  it('successfully fetches plans list with default limit', async () => {
    setupEnv();

    const mockResponse = {
      jobs: [
        {
          job_id: 'job-1',
          status: 'SUCCEEDED' as const,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:05Z',
        },
      ],
      total: 1,
      limit: 100,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    let queryData: any;

    function TestComponent() {
      const query = usePlansList({ fetchImpl: mockFetch as any });

      React.useEffect(() => {
        if (query.isSuccess) {
          queryData = query.data;
        }
      }, [query.isSuccess, query.data]);

      return (
        <div>
          {query.isLoading && <div>Loading...</div>}
          {query.isError && <div>Error: {query.error?.message}</div>}
          {query.isSuccess && <div>Success: {query.data?.total}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success: 1')).toBeInTheDocument();
    });

    expect(queryData).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/plans?limit=100',
      expect.any(Object)
    );
  });

  it('respects custom limit parameter', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [], total: 0, limit: 10 }),
    });

    function TestComponent() {
      const query = usePlansList({ limit: 10, fetchImpl: mockFetch as any });

      return <div>{query.isSuccess && <div>Success</div>}</div>;
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
      'http://localhost:8080/api/v1/plans?limit=10',
      expect.any(Object)
    );
  });

  it('includes cursor in request when provided', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [], total: 0, limit: 100 }),
    });

    function TestComponent() {
      const query = usePlansList({
        cursor: 'next-page',
        fetchImpl: mockFetch as any,
      });

      return <div>{query.isSuccess && <div>Success</div>}</div>;
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
      'http://localhost:8080/api/v1/plans?limit=100&cursor=next-page',
      expect.any(Object)
    );
  });

  it('respects enabled option and does not fetch when disabled', async () => {
    setupEnv();

    const mockFetch = vi.fn();

    function TestComponent() {
      const query = usePlansList({
        enabled: false,
        fetchImpl: mockFetch as any,
      });

      return (
        <div>
          {query.isLoading && <div>Loading...</div>}
          {!query.isLoading && !query.isSuccess && <div>Not fetched</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not fetched')).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles errors properly', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    function TestComponent() {
      const query = usePlansList({ fetchImpl: mockFetch as any });

      return (
        <div>
          {query.isError && <div>Error: {query.error?.message}</div>}
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

  it('provides lastUpdated timestamp', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [], total: 0, limit: 25 }),
    });

    let lastUpdated: number | undefined;

    function TestComponent() {
      const query = usePlansList({ fetchImpl: mockFetch as any });

      React.useEffect(() => {
        if (query.isSuccess) {
          lastUpdated = query.lastUpdated;
        }
      }, [query.isSuccess, query.lastUpdated]);

      return <div>{query.isSuccess && <div>Success</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    expect(lastUpdated).toBeGreaterThan(0);
  });

  it('allows manual refetch', async () => {
    setupEnv();

    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => ({ jobs: [], total: callCount, limit: 25 }),
      });
    });

    function TestComponent() {
      const query = usePlansList({ fetchImpl: mockFetch as any });

      return (
        <div>
          <button onClick={() => query.refetch()}>Refetch</button>
          {query.isSuccess && <div>Count: {query.data?.total}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('useSubmitClarifications', () => {
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

  it('successfully submits a clarification request', async () => {
    setupEnv();

    const mockResponse = {
      id: 'test-job-123',
      status: JobStatus.PENDING,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    let mutateResult: typeof mockResponse | undefined;

    function TestComponent() {
      const mutation = useSubmitClarifications({
        onSuccess: data => {
          mutateResult = data;
        },
      });

      React.useEffect(() => {
        mutation.mutate({
          plan: {
            specs: [
              {
                purpose: 'Build user authentication',
                vision: 'Secure auth system',
                open_questions: ['Which OAuth providers?'],
              },
            ],
          },
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isPending && <div>Loading...</div>}
          {mutation.isError && <div>Error: {mutation.error?.message}</div>}
          {mutation.isSuccess && <div>Success: {mutation.data?.id}</div>}
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
      'http://localhost:8081/v1/clarifications',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('submits clarification with answers and config', async () => {
    setupEnv();

    const mockResponse = {
      id: 'test-job-456',
      status: JobStatus.PENDING,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    function TestComponent() {
      const mutation = useSubmitClarifications();

      React.useEffect(() => {
        mutation.mutate({
          plan: {
            specs: [
              {
                purpose: 'Test',
                vision: 'Test vision',
                open_questions: ['Question 1?'],
              },
            ],
          },
          answers: [
            {
              spec_index: 0,
              question_index: 0,
              question: 'Question 1?',
              answer: 'Answer 1',
            },
          ],
          config: {
            provider: 'openai',
            model: 'gpt-5.1',
            temperature: 0.1,
          },
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          {mutation.isSuccess && <div>Success: {mutation.data?.id}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success: test-job-456')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8081/v1/clarifications',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"provider":"openai"'),
      })
    );
  });

  it('handles API errors correctly', async () => {
    setupEnv();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ detail: 'Invalid request payload' }),
    });

    let errorResult: Error | null = null;

    function TestComponent() {
      const mutation = useSubmitClarifications({
        onError: error => {
          errorResult = error;
        },
      });

      React.useEffect(() => {
        mutation.mutate({
          plan: {
            specs: [
              {
                purpose: 'Test',
                vision: 'Test vision',
              },
            ],
          },
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
        screen.getByText(/Failed to create clarification job/)
      ).toBeInTheDocument();
    });

    expect(errorResult?.message).toContain(
      'Failed to create clarification job'
    );
  });

  it('sends specs unmodified without mutations', async () => {
    setupEnv();

    const mockResponse = {
      id: 'test-job-789',
      status: JobStatus.PENDING,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    let capturedBody: any;
    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => mockResponse,
      };
    });

    const originalSpecs = [
      {
        purpose: 'Test Purpose',
        vision: 'Test Vision',
        must: ['Requirement 1', 'Requirement 2'],
        dont: ['Anti-pattern 1'],
        nice: ['Nice feature'],
        open_questions: ['Question 1?', 'Question 2?'],
        assumptions: ['Assumption 1'],
      },
    ];

    function TestComponent() {
      const mutation = useSubmitClarifications();

      React.useEffect(() => {
        mutation.mutate({
          plan: { specs: originalSpecs },
          fetchImpl: mockFetch as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>{mutation.isSuccess && <div>Success: {mutation.data?.id}</div>}</div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success: test-job-789')).toBeInTheDocument();
    });

    // Verify specs were sent unmodified
    expect(capturedBody.plan.specs).toEqual(originalSpecs);
    expect(capturedBody.plan.specs[0].purpose).toBe('Test Purpose');
    expect(capturedBody.plan.specs[0].must).toEqual([
      'Requirement 1',
      'Requirement 2',
    ]);
  });
});

describe('useClarificationStatus', () => {
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

  it('successfully fetches job status', async () => {
    setupEnv();

    const mockResponse = {
      id: 'test-job-123',
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

    // Mock the client function directly
    const getClarifierStatusSpy = vi
      .spyOn(specClarifierClient, 'getClarifierStatus')
      .mockResolvedValue(mockResponse);

    function TestComponent() {
      const { data, isLoading, isSuccess } = useClarificationStatus(
        'test-job-123'
      );

      return (
        <div>
          {isLoading && <div>Loading...</div>}
          {isSuccess && <div>Status: {data?.status}</div>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Status: SUCCESS')).toBeInTheDocument();
    });

    expect(getClarifierStatusSpy).toHaveBeenCalledWith('test-job-123');
  });

  it('does not fetch when jobId is undefined', async () => {
    setupEnv();

    const mockFetch = vi.fn();

    function TestComponent() {
      const { isLoading } = useClarificationStatus(undefined);

      return <div>{isLoading ? <div>Loading...</div> : <div>Not Loaded</div>}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not Loaded')).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
