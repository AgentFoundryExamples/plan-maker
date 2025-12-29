import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClarifierPanel from './ClarifierPanel';
import * as hooks from '@/api/hooks';
import * as specClarifierClient from '@/api/specClarifierClient';
import * as clarifierStorage from '@/utils/clarifierStorage';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import { JobStatus } from '@/api/specClarifier';

// Mock modules
vi.mock('@/api/hooks', async () => {
  const actual = await vi.importActual('@/api/hooks');
  return {
    ...actual,
    useSubmitClarifications: vi.fn(),
    useClarificationStatus: vi.fn(),
  };
});

vi.mock('@/api/specClarifierClient', async () => {
  const actual = await vi.importActual('@/api/specClarifierClient');
  return {
    ...actual,
    getClarifierDebug: vi.fn(),
  };
});

vi.mock('@/utils/clarifierStorage', async () => {
  const actual = await vi.importActual('@/utils/clarifierStorage');
  return {
    ...actual,
    getClarifierJobId: vi.fn(),
    setClarifierJobId: vi.fn(),
  };
});

describe('ClarifierPanel', () => {
  let queryClient: QueryClient;
  const mockUseSubmitClarifications = vi.mocked(hooks.useSubmitClarifications);
  const mockUseClarificationStatus = vi.mocked(hooks.useClarificationStatus);
  const mockGetClarifierDebug = vi.mocked(specClarifierClient.getClarifierDebug);
  const mockGetClarifierJobId = vi.mocked(clarifierStorage.getClarifierJobId);
  const mockSetClarifierJobId = vi.mocked(clarifierStorage.setClarifierJobId);

  const mockSucceededPlan: PlanJobStatus = {
    job_id: 'plan-123',
    status: 'SUCCEEDED',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:05:00Z',
    result: {
      specs: [
        {
          purpose: 'Test spec',
          vision: 'Test vision',
          open_questions: ['Question 1'],
        },
      ],
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Default mock implementations
    mockUseSubmitClarifications.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    } as any);

    mockUseClarificationStatus.mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any);

    mockGetClarifierJobId.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (planJob: PlanJobStatus = mockSucceededPlan) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClarifierPanel planJob={planJob} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders the clarification panel', () => {
      renderComponent();

      expect(screen.getByText('Clarification')).toBeInTheDocument();
      expect(screen.getByText('Start New Clarification')).toBeInTheDocument();
      expect(screen.getByText('Track Existing Job')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ClarifierPanel planJob={mockSucceededPlan} className="custom-class" />
        </QueryClientProvider>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Start Clarification', () => {
    it('enables start button when plan is SUCCEEDED with specs', () => {
      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      expect(startButton).not.toBeDisabled();
    });

    it('disables start button when plan is not SUCCEEDED', () => {
      const queuedPlan: PlanJobStatus = {
        ...mockSucceededPlan,
        status: 'QUEUED',
      };

      renderComponent(queuedPlan);

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      expect(startButton).toBeDisabled();
      expect(screen.getByText(/only available for successfully completed plans/i)).toBeInTheDocument();
    });

    it('disables start button when plan has no specs', () => {
      const noSpecsPlan: PlanJobStatus = {
        ...mockSucceededPlan,
        result: {
          specs: [],
        },
      };

      renderComponent(noSpecsPlan);

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      expect(startButton).toBeDisabled();
      expect(screen.getByText(/no specifications to clarify/i)).toBeInTheDocument();
    });

    it('calls mutation when start button is clicked', async () => {
      const user = userEvent.setup();
      const mutateFn = vi.fn();
      mockUseSubmitClarifications.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      } as any);

      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      expect(mutateFn).toHaveBeenCalledWith({
        plan: {
          specs: mockSucceededPlan.result!.specs,
        },
        answers: [],
        config: null,
      });
    });

    it('shows success banner when clarification is created', async () => {
      const user = userEvent.setup();
      let onSuccessCallback: ((response: any) => void) | undefined;

      mockUseSubmitClarifications.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: vi.fn(() => {
            if (onSuccessCallback) {
              onSuccessCallback({ id: 'new-job-123' });
            }
          }),
          isPending: false,
        } as any;
      });

      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/clarification job created successfully/i)).toBeInTheDocument();
        // Use getAllByText since the job ID appears multiple times (banner + current job section)
        expect(screen.getAllByText(/new-job-123/).length).toBeGreaterThan(0);
      });
    });

    it('calls onClarificationCreated callback', async () => {
      const user = userEvent.setup();
      const onClarificationCreated = vi.fn();
      let onSuccessCallback: ((response: any) => void) | undefined;

      mockUseSubmitClarifications.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: vi.fn(() => {
            if (onSuccessCallback) {
              onSuccessCallback({ id: 'new-job-123' });
            }
          }),
          isPending: false,
        } as any;
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ClarifierPanel 
            planJob={mockSucceededPlan}
            onClarificationCreated={onClarificationCreated}
          />
        </QueryClientProvider>
      );

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(onClarificationCreated).toHaveBeenCalledWith('new-job-123');
      });
    });

    it('shows error banner when clarification fails', async () => {
      const user = userEvent.setup();
      let onErrorCallback: ((error: Error) => void) | undefined;

      mockUseSubmitClarifications.mockImplementation((options) => {
        onErrorCallback = options?.onError;
        return {
          mutate: vi.fn(() => {
            if (onErrorCallback) {
              onErrorCallback(new Error('Network error'));
            }
          }),
          isPending: false,
        } as any;
      });

      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', () => {
      mockUseSubmitClarifications.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as any);

      renderComponent();

      const startButton = screen.getByRole('button', { name: /creating/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe('Manual Job ID Entry', () => {
    it('renders job ID input and track button', () => {
      renderComponent();

      expect(screen.getByPlaceholderText(/enter job id/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^track$/i })).toBeInTheDocument();
    });

    it('enables track button when job ID is entered', async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      const trackButton = screen.getByRole('button', { name: /^track$/i });

      expect(trackButton).toBeDisabled();

      await user.type(input, 'test-job-id');
      expect(trackButton).not.toBeDisabled();
    });

    it('validates UUID format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      const trackButton = screen.getByRole('button', { name: /^track$/i });

      await user.type(input, 'invalid-id');
      await user.click(trackButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid job id format/i)).toBeInTheDocument();
      });
    });

    it('accepts valid UUID', async () => {
      const user = userEvent.setup();
      renderComponent();

      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const input = screen.getByPlaceholderText(/enter job id/i);
      const trackButton = screen.getByRole('button', { name: /^track$/i });

      await user.type(input, validUUID);
      await user.click(trackButton);

      await waitFor(() => {
        expect(screen.getByText(/tracking clarification job/i)).toBeInTheDocument();
        expect(mockSetClarifierJobId).toHaveBeenCalledWith(mockSucceededPlan.job_id, validUUID);
      });
    });

    it('submits on Enter key', async () => {
      const user = userEvent.setup();
      renderComponent();

      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const input = screen.getByPlaceholderText(/enter job id/i);

      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/tracking clarification job/i)).toBeInTheDocument();
      });
    });

    it('clears input after successful submission', async () => {
      const user = userEvent.setup();
      renderComponent();

      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const input = screen.getByPlaceholderText(/enter job id/i) as HTMLInputElement;
      const trackButton = screen.getByRole('button', { name: /^track$/i });

      await user.type(input, validUUID);
      await user.click(trackButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Current Job Status', () => {
    it('does not show current job section initially', () => {
      renderComponent();

      expect(screen.queryByText('Current Job')).not.toBeInTheDocument();
    });

    it('loads stored job ID on mount', async () => {
      const storedJobId = '550e8400-e29b-41d4-a716-446655440000';
      mockGetClarifierJobId.mockReturnValue({
        jobId: storedJobId,
        timestamp: Date.now(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Current Job')).toBeInTheDocument();
        expect(screen.getByText(storedJobId)).toBeInTheDocument();
      });
    });

    it('displays current job section after creation', async () => {
      const user = userEvent.setup();
      let onSuccessCallback: ((response: any) => void) | undefined;

      mockUseSubmitClarifications.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: vi.fn(() => {
            if (onSuccessCallback) {
              onSuccessCallback({ id: 'new-job-123' });
            }
          }),
          isPending: false,
        } as any;
      });

      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Current Job')).toBeInTheDocument();
        expect(screen.getByText('new-job-123')).toBeInTheDocument();
      });
    });

    it('shows copy button for job ID', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      
      // Mock clipboard using defineProperty
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /copy job id/i });
        expect(copyButton).toBeInTheDocument();
      });
    });

    it('copies job ID to clipboard', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const writeTextMock = vi.fn();
      
      // Mock clipboard using defineProperty
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const copyButton = screen.getByRole('button', { name: /copy job id/i });
        await user.click(copyButton);
      });

      expect(writeTextMock).toHaveBeenCalledWith(validUUID);
    });
  });

  describe('Check Status', () => {
    it('shows check status button when job ID is set', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument();
      });
    });

    it('fetches and displays status when check button is clicked', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const refetchMock = vi.fn();

      mockUseClarificationStatus.mockReturnValue({
        data: {
          id: validUUID,
          status: JobStatus.SUCCESS,
          created_at: '2025-01-15T10:10:00Z',
          updated_at: '2025-01-15T10:15:00Z',
          last_error: null,
          result: null,
        },
        refetch: refetchMock,
        isLoading: false,
      } as any);

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const checkButton = screen.getByRole('button', { name: /check status/i });
        await user.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });

    it('displays error when status is FAILED', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      mockUseClarificationStatus.mockReturnValue({
        data: {
          id: validUUID,
          status: JobStatus.FAILED,
          created_at: '2025-01-15T10:10:00Z',
          updated_at: '2025-01-15T10:15:00Z',
          last_error: 'Clarification failed',
          result: null,
        },
        refetch: vi.fn(),
        isLoading: false,
      } as any);

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const checkButton = screen.getByRole('button', { name: /check status/i });
        await user.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Clarification failed')).toBeInTheDocument();
      });
    });
  });

  describe('View Debug', () => {
    it('shows view debug button when job ID is set', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view debug/i })).toBeInTheDocument();
      });
    });

    it('fetches and displays debug information', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const debugData = {
        id: validUUID,
        status: 'SUCCESS',
        created_at: '2025-01-15T10:10:00Z',
        updated_at: '2025-01-15T10:15:00Z',
        metadata: { test: 'data' },
      };

      mockGetClarifierDebug.mockResolvedValue(debugData);

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const debugButton = screen.getByRole('button', { name: /view debug/i });
        await user.click(debugButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Debug Information')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /debug information/i })).toBeInTheDocument();
      });
    });

    it('handles 403 error gracefully', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      mockGetClarifierDebug.mockRejectedValue(new Error('Debug endpoint is disabled'));

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const debugButton = screen.getByRole('button', { name: /view debug/i });
        await user.click(debugButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/debug endpoint is disabled/i)).toBeInTheDocument();
      });
    });

    it('handles other debug errors', async () => {
      const user = userEvent.setup();
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      mockGetClarifierDebug.mockRejectedValue(new Error('Network error'));

      renderComponent();

      const input = screen.getByPlaceholderText(/enter job id/i);
      await user.type(input, validUUID);
      await user.keyboard('{Enter}');

      await waitFor(async () => {
        const debugButton = screen.getByRole('button', { name: /view debug/i });
        await user.click(debugButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Banner Dismissal', () => {
    it('can dismiss banner messages', async () => {
      const user = userEvent.setup();
      let onErrorCallback: ((error: Error) => void) | undefined;

      mockUseSubmitClarifications.mockImplementation((options) => {
        onErrorCallback = options?.onError;
        return {
          mutate: vi.fn(() => {
            if (onErrorCallback) {
              onErrorCallback(new Error('Test error'));
            }
          }),
          isPending: false,
        } as any;
      });

      renderComponent();

      const startButton = screen.getByRole('button', { name: /start clarification/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss message/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
      });
    });
  });
});
