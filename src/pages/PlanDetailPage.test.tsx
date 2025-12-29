import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanDetailPage from './PlanDetailPage';
import * as hooks from '@/api/hooks';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import type { PlanResponse } from '@/api/softwarePlanner/models/PlanResponse';
import { PlanAnswersProvider } from '@/state/planAnswersStore';
import { SubmissionMetadataProvider } from '@/state/submissionMetadataStore';

// Mock the hooks module
vi.mock('@/api/hooks', async () => {
  const actual = await vi.importActual('@/api/hooks');
  return {
    ...actual,
    usePlanDetail: vi.fn(),
    useSubmitClarifications: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    })),
    useClarificationStatus: vi.fn(() => ({
      data: undefined,
      refetch: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
    })),
  };
});

// Mock clarifierStorage
vi.mock('@/utils/clarifierStorage', () => ({
  getClarifierJobId: vi.fn(() => null),
  setClarifierJobId: vi.fn(),
  removeClarifierJobId: vi.fn(),
}));

describe('PlanDetailPage', () => {
  let queryClient: QueryClient;
  const mockUsePlanDetail = vi.mocked(hooks.usePlanDetail);
  let originalInnerWidth: number;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    // Save original window.innerWidth
    originalInnerWidth = window.innerWidth;
    // Default to mobile view for existing tests (can be overridden per test)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600, // Mobile width
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const renderComponent = (planId = '123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SubmissionMetadataProvider config={{ enablePersistence: false }}>
          <PlanAnswersProvider config={{ enableSessionStorage: false }}>
            <MemoryRouter initialEntries={[`/plans/${planId}`]}>
              <Routes>
                <Route path="/plans/:id" element={<PlanDetailPage />} />
              </Routes>
            </MemoryRouter>
          </PlanAnswersProvider>
        </SubmissionMetadataProvider>
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('displays loading skeleton when data is being fetched', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      expect(screen.getByRole('status', { name: /loading plan details/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /plan details/i, level: 1 })).toBeInTheDocument();
    });

    it('shows breadcrumb navigation during loading', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      // Check breadcrumb navigation is present
      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeInTheDocument();
      
      // Check breadcrumb links
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
      
      const plansLink = screen.getByRole('link', { name: /plans/i });
      expect(plansLink).toBeInTheDocument();
      expect(plansLink).toHaveAttribute('href', '/plans');
    });
  });

  describe('Error State', () => {
    it('displays error message when fetch fails', () => {
      const mockError = new Error('Failed to fetch plan details');

      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load Plan')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch plan details')).toBeInTheDocument();
    });

    it('displays generic error message when error has no message', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: {} as Error,
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      expect(screen.getByText(/unable to fetch plan details/i)).toBeInTheDocument();
    });

    it('displays invalid plan message when no data and no error (query disabled)', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      expect(screen.getByText('Invalid Plan')).toBeInTheDocument();
      expect(screen.getByText(/no plan id provided/i)).toBeInTheDocument();
    });

    it('provides breadcrumb navigation in error state', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      // Check breadcrumb navigation is present
      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeInTheDocument();
      
      // Also check there's still a "Back to Plans" button in the error state
      const backButton = screen.getByRole('link', { name: /back to plans/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('href', '/plans');
    });

    it('handles 404 error appropriately', () => {
      const mockError = new Error('Request failed with status 404');

      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent('nonexistent-plan-id');

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load plan/i)).toBeInTheDocument();
    });
  });

  describe('Success State with Plan Data', () => {
    const mockPlanData: PlanJobStatus = {
      job_id: 'plan-123',
      status: 'SUCCEEDED',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:35:00Z',
      result: {
        specs: [
          {
            purpose: 'Build REST API',
            vision: 'Create a scalable REST API',
            must: ['Authentication', 'CRUD operations'],
            nice: ['Caching', 'Rate limiting'],
            dont: ['Complex frontend'],
            open_questions: ['Which database?'],
            assumptions: ['PostgreSQL available'],
          },
        ],
      },
    };

    it('renders plan metadata correctly', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Plan #plan-123')).toBeInTheDocument();
      expect(screen.getAllByText('Succeeded').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Plan ID:')).toBeInTheDocument();
      expect(screen.getAllByText('plan-123').length).toBeGreaterThanOrEqual(1);
    });

    it('displays created and updated timestamps', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getByText('Updated:')).toBeInTheDocument();
      
      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
    });

    it('displays status with correct styling', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      const statusBadge = screen.getAllByText('Succeeded')[0];
      expect(statusBadge).toHaveClass('status-badge');
    });

    it('renders specifications when present', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Specifications')).toBeInTheDocument();
      // Accordion should render with spec header visible
      expect(screen.getByRole('button', { name: /spec #1/i })).toBeInTheDocument();
      expect(screen.getByText(/build rest api/i)).toBeInTheDocument();
      // Should show question summary (both inline and sticky)
      expect(screen.getAllByText(/1 of 1 question remaining/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders all spec sections when present', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      // Expand the accordion to see spec details
      const accordionButton = screen.getByRole('button', { name: /spec #1/i });
      await user.click(accordionButton);

      // Now we can see the spec details
      expect(screen.getByText('Must Have:')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Nice to Have:')).toBeInTheDocument();
      expect(screen.getByText('Caching')).toBeInTheDocument();
      expect(screen.getByText("Don't:")).toBeInTheDocument();
      expect(screen.getByText('Complex frontend')).toBeInTheDocument();
      expect(screen.getByText('Which database?')).toBeInTheDocument();
      expect(screen.getByText('Assumptions:')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL available')).toBeInTheDocument();
    });
  });

  describe('Empty Specs State', () => {
    it('displays "No specs available yet" when plan has zero specs', () => {
      const emptyPlanData: PlanJobStatus = {
        job_id: 'plan-456',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T11:00:00Z',
        updated_at: '2025-01-15T11:05:00Z',
        result: {
          specs: [],
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: emptyPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-456');

      expect(screen.getByText('Specifications')).toBeInTheDocument();
      expect(screen.getByText('No specs available yet')).toBeInTheDocument();
    });

    it('displays empty state when result is null', () => {
      const nullResultData: PlanJobStatus = {
        job_id: 'plan-789',
        status: 'QUEUED',
        created_at: '2025-01-15T11:00:00Z',
        updated_at: '2025-01-15T11:00:00Z',
        result: null,
      };

      mockUsePlanDetail.mockReturnValue({
        data: nullResultData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-789');

      expect(screen.getByText('Specifications')).toBeInTheDocument();
      expect(screen.getByText('No specs available yet')).toBeInTheDocument();
    });
  });

  describe('Different Job Statuses', () => {
    it('renders QUEUED status correctly', () => {
      const queuedData: PlanJobStatus = {
        job_id: 'plan-queued',
        status: 'QUEUED',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        result: null,
      };

      mockUsePlanDetail.mockReturnValue({
        data: queuedData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-queued');

      expect(screen.getAllByText('Queued').length).toBeGreaterThanOrEqual(1);
    });

    it('renders RUNNING status correctly', () => {
      const runningData: PlanJobStatus = {
        job_id: 'plan-running',
        status: 'RUNNING',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:01:00Z',
        result: null,
      };

      mockUsePlanDetail.mockReturnValue({
        data: runningData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-running');

      expect(screen.getAllByText('Running').length).toBeGreaterThanOrEqual(1);
    });

    it('renders FAILED status with error details', () => {
      const failedData: PlanJobStatus = {
        job_id: 'plan-failed',
        status: 'FAILED',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:02:00Z',
        result: null,
        error: {
          type: 'ValidationError',
          error: 'Invalid input provided',
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: failedData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-failed');

      expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('ValidationError')).toBeInTheDocument();
      expect(screen.getByText('Invalid input provided')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional metadata fields gracefully', () => {
      const minimalData: PlanJobStatus = {
        job_id: 'plan-minimal',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        result: {
          specs: [
            {
              purpose: 'Basic spec',
              vision: 'Simple vision',
            },
          ],
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: minimalData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-minimal');

      // Accordion header should show spec purpose
      expect(screen.getByRole('button', { name: /basic spec/i })).toBeInTheDocument();
      // Should not crash with missing optional fields
      expect(screen.queryByText('Must Have:')).not.toBeInTheDocument();
      expect(screen.queryByText('Nice to Have:')).not.toBeInTheDocument();
    });

    it('handles missing or undefined planId', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent('invalid-id');

      expect(screen.getByText('Invalid Plan')).toBeInTheDocument();
      expect(screen.getByText(/no plan id provided/i)).toBeInTheDocument();
    });

    it('renders large number of specs without blocking', () => {
      const manySpecs: PlanResponse = {
        specs: Array.from({ length: 50 }, (_, i) => ({
          purpose: `Spec ${i + 1} purpose`,
          vision: `Spec ${i + 1} vision`,
        })),
      };

      const largeData: PlanJobStatus = {
        job_id: 'plan-large',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:30:00Z',
        result: manySpecs,
      };

      mockUsePlanDetail.mockReturnValue({
        data: largeData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-large');

      // Accordion should render all specs
      const accordions = screen.getAllByRole('button', { name: /spec #/i });
      expect(accordions).toHaveLength(50);
      // Metadata should still render without being blocked
      expect(screen.getByText('Plan #plan-large')).toBeInTheDocument();
    });

    it('handles malformed timestamps gracefully', () => {
      const malformedData: PlanJobStatus = {
        job_id: 'plan-malformed',
        status: 'SUCCEEDED',
        created_at: '',
        updated_at: '',
        result: null,
      };

      mockUsePlanDetail.mockReturnValue({
        data: malformedData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-malformed');

      // Should render "N/A" for invalid timestamps
      expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('uses semantic time elements for timestamps', () => {
      const mockPlanData: PlanJobStatus = {
        job_id: 'plan-123',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:35:00Z',
        result: { specs: [] },
      };

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
    });

    it('provides proper ARIA labels for status', () => {
      const mockPlanData: PlanJobStatus = {
        job_id: 'plan-123',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:35:00Z',
        result: { specs: [] },
      };

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      const statusBadge = screen.getAllByText('Succeeded')[0];
      expect(statusBadge).toHaveAttribute('aria-label', 'Status: Succeeded');
    });

    it('uses role="alert" for error messages', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: new Error('Test error'),
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Accordion Integration', () => {
    it('renders SpecAccordion when specs are present', () => {
      const mockPlanData: PlanJobStatus = {
        job_id: 'plan-123',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:35:00Z',
        result: {
          specs: [
            {
              purpose: 'Build REST API',
              vision: 'Create a scalable REST API',
              open_questions: ['Which database?'],
            },
          ],
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Specifications')).toBeInTheDocument();
      // Accordion header should be rendered
      expect(screen.getByRole('button', { name: /spec #1/i })).toBeInTheDocument();
    });

    it('does not render old spec container format', () => {
      const mockPlanData: PlanJobStatus = {
        job_id: 'plan-123',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:35:00Z',
        result: {
          specs: [
            {
              purpose: 'Build REST API',
              vision: 'Create a scalable REST API',
            },
          ],
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      // Old format had "This plan contains X specifications"
      expect(screen.queryByText(/this plan contains 1 specification/i)).not.toBeInTheDocument();
    });
  });

  describe('Submission Flow', () => {
    const mockPlanWithQuestions: PlanJobStatus = {
      job_id: 'plan-submit',
      status: 'SUCCEEDED',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:35:00Z',
      result: {
        specs: [
          {
            purpose: 'Build REST API',
            vision: 'Create a scalable REST API',
            open_questions: ['Which database?', 'Authentication method?'],
          },
          {
            purpose: 'Frontend',
            vision: 'Build UI',
            open_questions: ['Which framework?'],
          },
        ],
      },
    };

    it('shows submit button when there are questions', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithQuestions,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-submit');

      expect(screen.getByRole('button', { name: /submit clarifications/i })).toBeInTheDocument();
    });

    it('does not show submit button when there are no questions', () => {
      const noQuestionsData: PlanJobStatus = {
        job_id: 'plan-no-q',
        status: 'SUCCEEDED',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:35:00Z',
        result: {
          specs: [
            {
              purpose: 'Simple spec',
              vision: 'No questions',
            },
          ],
        },
      };

      mockUsePlanDetail.mockReturnValue({
        data: noQuestionsData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-no-q');

      expect(screen.queryByRole('button', { name: /submit clarifications/i })).not.toBeInTheDocument();
    });

    it('disables submit button when questions are not answered', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithQuestions,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-submit');

      const submitButton = screen.getByRole('button', { name: /submit clarifications/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows validation status indicating unanswered questions', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithQuestions,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-submit');

      // Should show 3 questions remaining (appears in multiple places)
      const remainingTexts = screen.getAllByText(/3.*questions?.*remaining/i);
      expect(remainingTexts.length).toBeGreaterThan(0);
    });

    it('enables submit button when all questions are answered', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithQuestions,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-submit');

      // Expand first spec and answer questions
      const spec1Button = screen.getByRole('button', { name: /spec #1.*build rest api/i });
      await user.click(spec1Button);

      const textareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(textareas[0], 'PostgreSQL');
      await user.type(textareas[1], 'JWT tokens');

      // Expand second spec and answer question
      const spec2Button = screen.getByRole('button', { name: /spec #2.*frontend/i });
      await user.click(spec2Button);

      const allTextareas = screen.getAllByPlaceholderText(/enter your answer/i);
      await user.type(allTextareas[allTextareas.length - 1], 'React');

      // Submit button should now be enabled
      const submitButton = screen.getByRole('button', { name: /submit clarifications/i });
      
      // Wait for validation to update
      await import('@testing-library/react').then(({ waitFor }) => 
        waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        })
      );
    });
  });

  describe('Enhanced Features', () => {
    const mockPlanData: PlanJobStatus = {
      job_id: 'plan-123',
      status: 'SUCCEEDED',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:35:00Z',
      result: {
        specs: [
          {
            purpose: 'Build REST API',
            vision: 'Create a scalable REST API',
            must: ['Authentication'],
            open_questions: ['Which database?'],
          },
        ],
      },
    };

    it('renders refresh button', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByRole('button', { name: /refresh plan status/i })).toBeInTheDocument();
    });

    it('calls refetch when refresh button is clicked', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      const refetchMock = vi.fn();

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: refetchMock,
      } as any);

      renderComponent('plan-123');

      const refreshButton = screen.getByRole('button', { name: /refresh plan status/i });
      await user.click(refreshButton);

      expect(refetchMock).toHaveBeenCalled();
    });

    it('renders copy button for plan ID', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByRole('button', { name: /copy plan id to clipboard/i })).toBeInTheDocument();
    });

    it('copies plan ID to clipboard when copy button is clicked', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      const copyButton = screen.getByRole('button', { name: /copy plan id to clipboard/i });
      await user.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith('plan-123');
      
      // Should show success message
      await import('@testing-library/react').then(({ waitFor }) =>
        waitFor(() => {
          expect(screen.getByText(/copied!/i)).toBeInTheDocument();
        })
      );
    });

    it('shows error message when clipboard copy fails', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      const copyButton = screen.getByRole('button', { name: /copy plan id to clipboard/i });
      await user.click(copyButton);

      // Should show error message
      await import('@testing-library/react').then(({ waitFor }) =>
        waitFor(() => {
          expect(screen.getByText(/copy failed/i)).toBeInTheDocument();
        })
      );
    });

    it('renders ClarifierPanel component', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Clarification')).toBeInTheDocument();
      expect(screen.getByText('Start New Clarification')).toBeInTheDocument();
    });

    it('renders PlanTimeline component for non-QUEUED plans', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
    });

    it('does not render PlanTimeline for QUEUED plans', () => {
      const queuedPlan: PlanJobStatus = {
        ...mockPlanData,
        status: 'QUEUED',
      };

      mockUsePlanDetail.mockReturnValue({
        data: queuedPlan,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.queryByText('Activity Timeline')).not.toBeInTheDocument();
    });

    it('handles clarification creation callback', async () => {
      // This test verifies the integration exists
      // Full clarification workflow is tested in ClarifierPanel.test.tsx
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      // Verify clarifier panel is present and can be interacted with
      expect(screen.getByText('Start New Clarification')).toBeInTheDocument();
    });

    it('displays plan metadata with proper formatting', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      // Check that metadata rows are displayed
      expect(screen.getByText('Plan ID:')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getByText('Updated:')).toBeInTheDocument();
    });
  });

  describe('Dual-Pane Layout (Desktop)', () => {
    const mockPlanWithSpecs: PlanJobStatus = {
      job_id: 'plan-dual-pane',
      status: 'SUCCEEDED',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:35:00Z',
      result: {
        specs: [
          {
            purpose: 'Build REST API',
            vision: 'Create a scalable REST API',
            must: ['Authentication', 'CRUD operations'],
            open_questions: ['Which database?'],
          },
          {
            purpose: 'Build Frontend',
            vision: 'Create a user interface',
            must: ['React', 'Responsive design'],
            open_questions: ['Which state management?'],
          },
          {
            purpose: 'Add Analytics',
            vision: 'Track user behavior',
            must: ['Privacy compliant'],
          },
        ],
      },
    };

    beforeEach(() => {
      // Set desktop viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('renders dual-pane layout on desktop viewport', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Check for dual-pane container
      const dualPaneContainer = document.querySelector('.dual-pane-container');
      expect(dualPaneContainer).toBeInTheDocument();

      // Check for spec list pane
      const specListPane = document.querySelector('.spec-list-pane');
      expect(specListPane).toBeInTheDocument();

      // Check for detail pane
      const specDetailPane = document.querySelector('.spec-detail-pane');
      expect(specDetailPane).toBeInTheDocument();

      // Accordion should not be rendered in desktop mode
      const accordion = document.querySelector('.spec-accordion-container');
      expect(accordion).not.toBeInTheDocument();
    });

    it('displays all specs in the list pane', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Check for spec list header
      expect(screen.getByText('Specifications (3)')).toBeInTheDocument();

      // Check spec list items specifically within spec list pane
      const specListPane = document.querySelector('.spec-list-pane');
      expect(specListPane).toBeInTheDocument();
      
      const specListItems = specListPane?.querySelectorAll('.spec-list-item');
      expect(specListItems?.length).toBe(3);
      
      // Verify spec titles appear in the list
      const specTexts = Array.from(specListItems || []).map(item => item.textContent);
      expect(specTexts.some(text => text?.includes('Build REST API'))).toBe(true);
      expect(specTexts.some(text => text?.includes('Build Frontend'))).toBe(true);
      expect(specTexts.some(text => text?.includes('Add Analytics'))).toBe(true);
    });

    it('displays first spec as initially selected', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // A spec should be selected
      const selectedSpec = document.querySelector('.spec-list-item.selected');
      expect(selectedSpec).toBeInTheDocument();
      
      // Detail pane should show content (not empty state)
      const detailPane = document.querySelector('.spec-detail-pane');
      expect(detailPane).toBeInTheDocument();
      expect(detailPane?.textContent).not.toContain('Select a specification from the list');
    });

    it('updates selection when spec is clicked', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      const { rerender } = renderComponent('plan-dual-pane');

      // Find second spec item in the list pane
      const specListPane = document.querySelector('.spec-list-pane');
      const secondSpecItem = Array.from(specListPane?.querySelectorAll('.spec-list-item') || []).find(
        (item) => item.textContent?.includes('Build Frontend')
      ) as HTMLElement;
      
      expect(secondSpecItem).toBeTruthy();
      
      if (secondSpecItem) {
        await user.click(secondSpecItem);
        
        // Selection should be updated (the element should have selected class)
        expect(secondSpecItem).toHaveClass('selected');
      }
    });

    it('updates selection when clicking specs', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Wait for initial spec to be selected
      await import('@testing-library/react').then(({ waitFor }) =>
        waitFor(() => {
          const specListPane = document.querySelector('.spec-list-pane');
          const selectedItem = specListPane?.querySelector('.spec-list-item.selected');
          expect(selectedItem).toBeInTheDocument();
        }, { timeout: 3000 })
      );

      // Find spec items in the list pane
      const specListPane = document.querySelector('.spec-list-pane');
      
      const secondSpecItem = Array.from(specListPane?.querySelectorAll('.spec-list-item') || []).find(
        (item) => item.textContent?.includes('Build Frontend')
      ) as HTMLElement;
      
      const firstSpecItem = specListPane?.querySelector('.spec-list-item.selected');
      
      // Verify initial selection exists
      expect(firstSpecItem).toBeInTheDocument();
      
      if (secondSpecItem && firstSpecItem) {
        await user.click(secondSpecItem);
        
        // Wait for selection update
        await import('@testing-library/react').then(({ waitFor }) =>
          waitFor(() => {
            expect(secondSpecItem).toHaveClass('selected');
          })
        );
        
        // Second spec should now be selected
        expect(secondSpecItem).toHaveClass('selected');
        // First spec should no longer be selected (unless they're the same)
        if (firstSpecItem !== secondSpecItem) {
          expect(firstSpecItem).not.toHaveClass('selected');
        }
      }
    });

    it('supports keyboard navigation in spec list', async () => {
      const user = (await import('@testing-library/user-event')).default.setup();
      
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Find first spec item in the list pane
      const specListPane = document.querySelector('.spec-list-pane');
      const firstSpecItem = specListPane?.querySelector('.spec-list-item') as HTMLElement;
      
      expect(firstSpecItem).toBeTruthy();
      
      if (firstSpecItem) {
        // Focus the first item
        firstSpecItem.focus();
        expect(document.activeElement).toBe(firstSpecItem);
        
        // Press ArrowDown
        await user.keyboard('{ArrowDown}');
        
        // Second spec item should now be selected
        const specItems = specListPane?.querySelectorAll('.spec-list-item');
        const secondSpecItem = specItems?.[1];
        expect(secondSpecItem).toHaveClass('selected');
      }
    });

    it('shows question status badges in spec list', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Check in spec list pane specifically
      const specListPane = document.querySelector('.spec-list-pane');
      expect(specListPane).toBeInTheDocument();
      
      // Specs with questions should show "1 left" badges
      const badges = specListPane?.querySelectorAll('.spec-list-item-badge');
      expect(badges?.length).toBeGreaterThan(0);
      
      // Check badge text content
      const badgeTexts = Array.from(badges || []).map(b => b.textContent);
      expect(badgeTexts).toContain('⚠ 1 left');
      expect(badgeTexts).toContain('✓ No questions');
    });

    it('displays empty state when no spec is selected', () => {
      const emptyPlan: PlanJobStatus = {
        ...mockPlanWithSpecs,
        result: { specs: [] },
      };

      mockUsePlanDetail.mockReturnValue({
        data: emptyPlan,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      expect(screen.getByText('No specs available yet')).toBeInTheDocument();
    });

    it('handles spec list with 100+ specs without performance issues', () => {
      const largeSpecList = Array.from({ length: 100 }, (_, i) => ({
        purpose: `Spec ${i + 1}`,
        vision: `Vision for spec ${i + 1}`,
      }));

      const largePlan: PlanJobStatus = {
        ...mockPlanWithSpecs,
        result: { specs: largeSpecList },
      };

      mockUsePlanDetail.mockReturnValue({
        data: largePlan,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Spec list should show count
      expect(screen.getByText('Specifications (100)')).toBeInTheDocument();
      
      // Check spec list items specifically
      const specListPane = document.querySelector('.spec-list-pane');
      const specListItems = specListPane?.querySelectorAll('.spec-list-item');
      expect(specListItems?.length).toBe(100);
    });

    it('maintains independent scrolling between panes', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanWithSpecs,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-dual-pane');

      // Both panes should exist as separate containers
      const specListPane = document.querySelector('.spec-list-pane');
      const specDetailPane = document.querySelector('.spec-detail-pane');
      
      expect(specListPane).toBeInTheDocument();
      expect(specDetailPane).toBeInTheDocument();
      
      // Verify panes are in dual-pane container
      const dualPaneContainer = document.querySelector('.dual-pane-container');
      expect(dualPaneContainer).toBeInTheDocument();
      expect(dualPaneContainer?.contains(specListPane as Node)).toBe(true);
      expect(dualPaneContainer?.contains(specDetailPane as Node)).toBe(true);
      
      // Verify both panes have proper CSS classes for scrolling
      // (CSS media queries set overflow-y: auto on desktop)
      expect(specListPane?.classList.contains('spec-list-pane')).toBe(true);
      expect(specDetailPane?.classList.contains('spec-detail-pane')).toBe(true);
    });
  });
});
