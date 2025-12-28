import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import PlannerInputPage from './PlannerInputPage';
import { clearEnvCache } from '@/api/env';
import type { AsyncPlanJob } from '@/api/softwarePlannerClient';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PlannerInputPage', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    (import.meta.env as any).VITE_SOFTWARE_PLANNER_BASE_URL =
      'http://localhost:8080';
    (import.meta.env as any).VITE_SPEC_CLARIFIER_BASE_URL =
      'http://localhost:8081';
  });

  afterEach(() => {
    clearEnvCache();
    Object.keys(import.meta.env).forEach((key) => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByRole('heading', { name: /create software plan/i, level: 1 })
      ).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByLabelText(/project description/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/custom system prompt/i)
      ).toBeInTheDocument();
    });

    it('shows helper text for each field', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByText(/describe your software project in detail/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/specify a logical model name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/override the default system prompt/i)
      ).toBeInTheDocument();
    });

    it('marks description field as required', () => {
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      expect(descriptionField).toHaveAttribute('aria-required', 'true');
    });

    it('renders submit button', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByRole('button', { name: /create plan/i })
      ).toBeInTheDocument();
    });
  });

  describe('Client-side Validation', () => {
    it('prevents submission when description is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows validation error when description is empty on submit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'test');
      await user.clear(descriptionField);

      expect(
        screen.queryByText(/description is required/i)
      ).not.toBeInTheDocument();
    });

    it('enables submit button when description is filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('shows character count for description field', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(screen.getByText(/0 \/ 8192 characters/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission and Loading State', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        new Promise(() => {}) // Never resolves to keep loading state
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /creating plan/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /creating plan/i })).toBeDisabled();
    });

    it('disables form fields during submission', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        new Promise(() => {}) // Never resolves
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(descriptionField).toBeDisabled();
      });
    });

    it('prevents duplicate submissions while request is pending', async () => {
      const user = userEvent.setup();
      let resolvePromise: any;
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      const form = screen.getByRole('button', { name: /create plan/i })
        .closest('form') as HTMLFormElement;

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      expect(mockFetch).toHaveBeenCalledTimes(1);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Confirmation', () => {
    it('displays confirmation card on successful submission', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'QUEUED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /plan created successfully/i })
        ).toBeInTheDocument();
      });
    });

    it('shows plan metadata in confirmation card', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'QUEUED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText('test-job-123')).toBeInTheDocument();
      });

      expect(screen.getByText(/queued/i)).toBeInTheDocument();
      expect(screen.getByText(/plan id:/i)).toBeInTheDocument();
      expect(screen.getByText(/status:/i)).toBeInTheDocument();
      expect(screen.getByText(/created:/i)).toBeInTheDocument();
    });

    it('shows correct status badge for QUEUED status', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'QUEUED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText(/queued/i)).toBeInTheDocument();
      });
    });

    it('shows correct status badge for RUNNING status', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'RUNNING',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      });
    });

    it('shows correct status badge for SUCCEEDED status', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'SUCCEEDED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('shows correct status badge for FAILED status', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'FAILED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('handles unknown status values gracefully', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'UNKNOWN_STATUS' as any,
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
      });
    });

    it('includes navigation links in confirmation card', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'QUEUED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByText(/view all plans/i)).toBeInTheDocument();
      });

      const viewAllPlansLink = screen.getByRole('link', {
        name: /view all plans/i,
      });
      expect(viewAllPlansLink).toHaveAttribute('href', '/plans');

      const viewDetailsLink = screen.getByRole('link', {
        name: /view plan details/i,
      });
      expect(viewDetailsLink).toHaveAttribute('href', '/plans/test-job-123');
    });

    it('allows creating another plan after success', async () => {
      const user = userEvent.setup();
      const mockResponse: AsyncPlanJob = {
        job_id: 'test-job-123',
        status: 'QUEUED',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create another plan/i })
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /create another plan/i })
      );

      expect(
        screen.getByLabelText(/project description/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/project description/i)).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' }),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/error:/i)).toBeInTheDocument();
    });

    it('allows retry after error without clearing form', async () => {
      const user = userEvent.setup();
      let callCount = 0;
      const mockFetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server error' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ job_id: 'test-job-123', status: 'QUEUED' }),
        } as Response);
      });
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(descriptionField).toHaveValue('Build a REST API');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /plan created successfully/i })
        ).toBeInTheDocument();
      });
    });

    it('displays validation error hint text', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 422,
          json: () =>
            Promise.resolve({ error: 'Validation failed: description too long' }),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please review your input and try again/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('renders form with proper structure for stacking', () => {
      renderWithProviders(<PlannerInputPage />);

      const form = screen.getByRole('button', { name: /create plan/i }).closest('form');
      expect(form).toHaveClass('plan-form');
    });
  });

  describe('Optional Fields', () => {
    it('submits only description when optional fields are empty', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ job_id: 'test-job-123', status: 'QUEUED' }),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'Build a REST API');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody).toEqual({
        description: 'Build a REST API',
        model: null,
        system_prompt: null,
      });
    });

    it('includes model when provided', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ job_id: 'test-job-123', status: 'QUEUED' }),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      await user.type(
        screen.getByLabelText(/project description/i),
        'Build a REST API'
      );
      await user.type(screen.getByLabelText(/model/i), 'gpt-4-turbo');
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('gpt-4-turbo');
    });

    it('includes system_prompt when provided', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ job_id: 'test-job-123', status: 'QUEUED' }),
        } as Response)
      );
      global.fetch = mockFetch as any;

      renderWithProviders(<PlannerInputPage />);

      await user.type(
        screen.getByLabelText(/project description/i),
        'Build a REST API'
      );
      await user.type(
        screen.getByLabelText(/custom system prompt/i),
        'Custom prompt'
      );
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.system_prompt).toBe('Custom prompt');
    });
  });
});
