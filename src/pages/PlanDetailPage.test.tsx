import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanDetailPage from './PlanDetailPage';
import * as hooks from '@/api/hooks';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import type { PlanResponse } from '@/api/softwarePlanner/models/PlanResponse';

// Mock the hooks module
vi.mock('@/api/hooks', async () => {
  const actual = await vi.importActual('@/api/hooks');
  return {
    ...actual,
    usePlanDetail: vi.fn(),
  };
});

describe('PlanDetailPage', () => {
  let queryClient: QueryClient;
  const mockUsePlanDetail = vi.mocked(hooks.usePlanDetail);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (planId = '123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/plans/${planId}`]}>
          <Routes>
            <Route path="/plans/:id" element={<PlanDetailPage />} />
          </Routes>
        </MemoryRouter>
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

    it('shows back to plans link during loading', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      const backLink = screen.getByRole('link', { name: /back to plans list/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/plans');
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

    it('provides back to plans link in error state', () => {
      mockUsePlanDetail.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderComponent();

      const backLinks = screen.getAllByRole('link', { name: /back to plans/i });
      expect(backLinks.length).toBeGreaterThanOrEqual(1);
      expect(backLinks[0]).toHaveAttribute('href', '/plans');
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
      expect(screen.getByText(/this plan contains 1 specification/i)).toBeInTheDocument();
      expect(screen.getByText('Spec #1')).toBeInTheDocument();
      expect(screen.getByText('Build REST API')).toBeInTheDocument();
      expect(screen.getByText('Create a scalable REST API')).toBeInTheDocument();
    });

    it('renders all spec sections when present', () => {
      mockUsePlanDetail.mockReturnValue({
        data: mockPlanData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      renderComponent('plan-123');

      expect(screen.getByText('Must Have:')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Nice to Have:')).toBeInTheDocument();
      expect(screen.getByText('Caching')).toBeInTheDocument();
      expect(screen.getByText("Don't:")).toBeInTheDocument();
      expect(screen.getByText('Complex frontend')).toBeInTheDocument();
      expect(screen.getByText('Open Questions:')).toBeInTheDocument();
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

      expect(screen.getByText('Basic spec')).toBeInTheDocument();
      expect(screen.getByText('Simple vision')).toBeInTheDocument();
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

      expect(screen.getByText(/this plan contains 50 specifications/i)).toBeInTheDocument();
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
});
