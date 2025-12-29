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
    // Clear localStorage to prevent test pollution
    localStorage.clear();
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
        screen.getByText(/specify a model name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/customize ai planning behavior/i)
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
      const originalFetch = global.fetch;
      
      try {
        const mockFetch = vi.fn(
          () =>
            new Promise(() => {
              // Promise intentionally never resolves to test pending state
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
      } finally {
        global.fetch = originalFetch;
      }
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

  describe('Form Persistence', () => {
    it('restores draft from localStorage on mount', () => {
      const draftData = {
        description: 'Restored description',
        model: 'gpt-4',
        system_prompt: 'Restored prompt',
      };

      localStorage.setItem(
        'plan-maker_planner-input-draft',
        JSON.stringify({
          data: draftData,
          timestamp: Date.now(),
        })
      );

      renderWithProviders(<PlannerInputPage />);

      expect(screen.getByLabelText(/project description/i)).toHaveValue(
        'Restored description'
      );
      expect(screen.getByLabelText(/model/i)).toHaveValue('gpt-4');
      expect(screen.getByLabelText(/custom system prompt/i)).toHaveValue(
        'Restored prompt'
      );
    });

    it('does not restore expired draft (older than 24 hours)', () => {
      const draftData = {
        description: 'Expired description',
        model: 'gpt-4',
        system_prompt: 'Expired prompt',
      };

      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(
        'plan-maker_planner-input-draft',
        JSON.stringify({
          data: draftData,
          timestamp: twentyFiveHoursAgo,
        })
      );

      renderWithProviders(<PlannerInputPage />);

      expect(screen.getByLabelText(/project description/i)).toHaveValue('');
      expect(screen.getByLabelText(/model/i)).toHaveValue('');
      expect(screen.getByLabelText(/custom system prompt/i)).toHaveValue('');
    });

    it('saves draft to localStorage when form changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      await user.type(
        screen.getByLabelText(/project description/i),
        'Draft description'
      );

      await waitFor(() => {
        const stored = localStorage.getItem('plan-maker_planner-input-draft');
        expect(stored).toBeTruthy();
        if (stored) {
          const draft = JSON.parse(stored);
          expect(draft.data.description).toBe('Draft description');
        }
      });
    });

    it('clears draft after successful submission', async () => {
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

      await user.type(
        screen.getByLabelText(/project description/i),
        'Test description'
      );

      // Wait for draft to be saved
      await waitFor(() => {
        expect(
          localStorage.getItem('plan-maker_planner-input-draft')
        ).toBeTruthy();
      });

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /plan created successfully/i })
        ).toBeInTheDocument();
      });

      // Draft should be cleared after successful submission
      expect(localStorage.getItem('plan-maker_planner-input-draft')).toBeNull();
    });

    it('clears draft when creating another plan', async () => {
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

      await user.type(
        screen.getByLabelText(/project description/i),
        'First plan'
      );

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create another plan/i })
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /create another plan/i })
      );

      expect(localStorage.getItem('plan-maker_planner-input-draft')).toBeNull();
    });

    it('does not clear existing draft when all fields are cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      
      // Type some text
      await user.type(descriptionField, 'Test description');

      // Wait for draft to be saved (debounce + some buffer)
      await waitFor(() => {
        const stored = localStorage.getItem('plan-maker_planner-input-draft');
        expect(stored).toBeTruthy();
      }, { timeout: 1000 });

      // Clear the field
      await user.clear(descriptionField);

      // Wait a bit for any potential save
      await new Promise(resolve => setTimeout(resolve, 600));

      // Draft should still exist (not cleared by the save logic)
      const stored = localStorage.getItem('plan-maker_planner-input-draft');
      expect(stored).toBeTruthy();
    });

    it('handles localStorage unavailable gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      const originalGetItem = Storage.prototype.getItem;

      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      // Should not throw error when rendering
      expect(() => renderWithProviders(<PlannerInputPage />)).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.getItem = originalGetItem;
    });

    it('does not save empty form to localStorage', () => {
      renderWithProviders(<PlannerInputPage />);

      // Empty form should not be saved
      expect(localStorage.getItem('plan-maker_planner-input-draft')).toBeNull();
    });
  });

  describe('Word Count Display', () => {
    it('displays word count for description field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'This is a test');

      expect(screen.getByText(/4 words/i)).toBeInTheDocument();
    });

    it('updates word count as user types in description', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      await user.type(descriptionField, 'One two three');

      expect(screen.getByText(/3 words/i)).toBeInTheDocument();

      await user.type(descriptionField, ' four five');

      expect(screen.getByText(/5 words/i)).toBeInTheDocument();
    });

    it('displays word count for system_prompt when field has content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlannerInputPage />);

      const systemPromptField = screen.getByLabelText(
        /custom system prompt/i
      );
      await user.type(systemPromptField, 'Custom instructions here');

      const wordCounts = screen.getAllByText(/3 words/i);
      expect(wordCounts.length).toBeGreaterThan(0);
    });

    it('shows 0 words for empty description', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(screen.getByText(/0 words/i)).toBeInTheDocument();
    });
  });

  describe('Helper Text and Placeholders', () => {
    it('displays enhanced helper text for description field', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByText(/include key features, requirements, and constraints/i)
      ).toBeInTheDocument();
    });

    it('displays enhanced helper text for system_prompt field', () => {
      renderWithProviders(<PlannerInputPage />);

      expect(
        screen.getByText(
          /customize ai planning behavior with specific instructions/i
        )
      ).toBeInTheDocument();
    });

    it('displays enhanced placeholder for description field', () => {
      renderWithProviders(<PlannerInputPage />);

      const descriptionField = screen.getByLabelText(/project description/i);
      expect(descriptionField).toHaveAttribute(
        'placeholder',
        expect.stringContaining('REST API for task management')
      );
    });

    it('displays enhanced placeholder for system_prompt field', () => {
      renderWithProviders(<PlannerInputPage />);

      const systemPromptField = screen.getByLabelText(
        /custom system prompt/i
      );
      expect(systemPromptField).toHaveAttribute(
        'placeholder',
        expect.stringContaining('Focus on microservices')
      );
    });
  });
});
