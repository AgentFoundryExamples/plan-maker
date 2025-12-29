import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlansListPage from './PlansListPage';
import * as hooks from '@/api/hooks';
import type { PlanJobsList } from '@/api/softwarePlannerClient';

// Mock the hooks module
vi.mock('@/api/hooks', async () => {
  const actual = await vi.importActual('@/api/hooks');
  return {
    ...actual,
    usePlansList: vi.fn(),
  };
});

describe('PlansListPage', () => {
  let queryClient: QueryClient;
  const mockUsePlansList = vi.mocked(hooks.usePlansList);

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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PlansListPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('displays loading skeleton when data is being fetched', () => {
      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        lastUpdated: 0,
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByRole('status', { name: /loading plans/i })).toBeInTheDocument();
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });

    it('disables refresh button during loading', () => {
      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        lastUpdated: 0,
        refetch: vi.fn(),
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /refresh plans list/i });
      expect(refreshButton).toBeDisabled();
      expect(refreshButton).toHaveTextContent('Refreshing...');
    });
  });

  describe('Success State with Plans', () => {
    const mockPlansData: PlanJobsList = {
      jobs: [
        {
          job_id: 'job-123',
          status: 'SUCCEEDED',
          created_at: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-15T10:35:00Z',
        },
        {
          job_id: 'job-456',
          status: 'RUNNING',
          created_at: '2025-01-15T11:00:00Z',
          updated_at: '2025-01-15T11:05:00Z',
        },
        {
          job_id: 'job-789',
          status: 'QUEUED',
          created_at: '2025-01-15T11:30:00Z',
          updated_at: '2025-01-15T11:30:00Z',
        },
      ],
      total: 3,
      limit: 50,
    };

    it('renders plan cards with all required information', () => {
      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Check that all plans are rendered (they appear in both timeline and cards)
      expect(screen.getAllByText('job-123').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('job-456').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('job-789').length).toBeGreaterThanOrEqual(1);

      // Check status badges (they appear in both timeline and cards)
      expect(screen.getAllByText('Succeeded').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Running').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Queued').length).toBeGreaterThanOrEqual(1);
    });

    it('displays created and updated timestamps in human-readable format', () => {
      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Check for timestamp metadata labels
      const createdLabels = screen.getAllByText('Created:');
      expect(createdLabels.length).toBe(3);

      const updatedLabels = screen.getAllByText('Updated:');
      expect(updatedLabels.length).toBe(3);
    });

    it('makes plan cards clickable with correct navigation links', () => {
      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      const planLink1 = screen.getByRole('link', { name: /view plan job-123/i });
      expect(planLink1).toHaveAttribute('href', '/plans/job-123');

      const planLink2 = screen.getByRole('link', { name: /view plan job-456/i });
      expect(planLink2).toHaveAttribute('href', '/plans/job-456');

      const planLink3 = screen.getByRole('link', { name: /view plan job-789/i });
      expect(planLink3).toHaveAttribute('href', '/plans/job-789');
    });

    it('displays status with correct styling', () => {
      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      const succeededBadges = screen.getAllByText('Succeeded');
      // Check at least one badge has the right classes and styles
      expect(succeededBadges[0]).toHaveClass('status-badge');
      expect(succeededBadges[0]).toHaveStyle({ color: 'var(--color-background)' });
    });

    it('handles missing updated_at gracefully', () => {
      const dataWithoutUpdated: PlanJobsList = {
        jobs: [
          {
            job_id: 'job-no-update',
            status: 'QUEUED',
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '',
          },
        ],
        total: 1,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: dataWithoutUpdated,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Job ID appears in both timeline and card
      const jobIdElements = screen.getAllByText('job-no-update');
      expect(jobIdElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Created:')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no plans exist', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByText('No Plans Yet')).toBeInTheDocument();
      expect(screen.getByText(/haven't created any plans yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create your first plan/i })).toHaveAttribute(
        'href',
        '/'
      );
    });

    it('displays empty state icon', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      const emptyIcon = screen.getByText('📋');
      expect(emptyIcon).toHaveClass('empty-state-icon');
    });
  });

  describe('Error State', () => {
    it('displays error message when fetch fails', () => {
      const mockError = new Error('Failed to fetch plans');

      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        isError: true,
        isSuccess: false,
        lastUpdated: 0,
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load Plans')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch plans')).toBeInTheDocument();
    });

    it('displays generic error message when error has no message', () => {
      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: {} as Error,
        isLoading: false,
        isError: true,
        isSuccess: false,
        lastUpdated: 0,
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });

    it('provides retry button in error state', async () => {
      const mockRefetch = vi.fn();
      const user = userEvent.setup();

      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
        isError: true,
        isSuccess: false,
        lastUpdated: 0,
        refetch: mockRefetch,
      });

      renderComponent();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Refresh', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const mockRefetch = vi.fn();
      const user = userEvent.setup();

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: mockRefetch,
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /refresh plans list/i });
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('displays last updated timestamp', () => {
      const lastUpdated = Date.now() - 120000; // 2 minutes ago

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated,
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
      expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument();
    });

    it('displays "Just now" for very recent updates', () => {
      const lastUpdated = Date.now() - 5000; // 5 seconds ago

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated,
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });
  });

  describe('Visibility-based Polling', () => {
    it('sets up visibility change listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('cleans up visibility listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      const { unmount } = renderComponent();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('passes refetchInterval when page is visible', () => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(mockUsePlansList).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchInterval: 60000,
        })
      );
    });

    it('handles rapid visibility toggles', () => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        writable: true,
        value: false,
      });

      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Simulate rapid visibility changes
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Component should remain stable
      expect(screen.getByRole('heading', { name: /^plans$/i, level: 1 })).toBeInTheDocument();
    });
  });

  describe('Status Badge Rendering', () => {
    it('displays correct status for FAILED status', () => {
      const failedData: PlanJobsList = {
        jobs: [
          {
            job_id: 'job-failed',
            status: 'FAILED',
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '2025-01-15T10:35:00Z',
          },
        ],
        total: 1,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: failedData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Now we have multiple "Failed" badges (timeline + card), so check for at least one
      const failedBadges = screen.getAllByText('Failed');
      expect(failedBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('falls back gracefully for unknown status values', () => {
      const unknownStatusData: PlanJobsList = {
        jobs: [
          {
            job_id: 'job-unknown',
            status: 'UNKNOWN_STATUS' as any,
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '2025-01-15T10:35:00Z',
          },
        ],
        total: 1,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: unknownStatusData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Now we have multiple "Unknown" badges (timeline + card), so check for at least one
      const unknownBadges = screen.getAllByText('Unknown');
      expect(unknownBadges.length).toBeGreaterThanOrEqual(1);
      // Job ID appears in both timeline and card
      const jobIdElements = screen.getAllByText('job-unknown');
      expect(jobIdElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByRole('button', { name: /refresh plans list/i })).toBeInTheDocument();
    });

    it('uses semantic time elements for timestamps', () => {
      const mockPlansData: PlanJobsList = {
        jobs: [
          {
            job_id: 'job-123',
            status: 'SUCCEEDED',
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '2025-01-15T10:35:00Z',
          },
        ],
        total: 1,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('provides aria-live region for last updated', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      const lastUpdatedElement = screen.getByText(/last updated:/i);
      expect(lastUpdatedElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined or null data gracefully', () => {
      mockUsePlansList.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
        lastUpdated: 0,
        refetch: vi.fn(),
      });

      renderComponent();

      // Should not crash, and should show nothing or appropriate fallback
      expect(screen.queryByText('No Plans Yet')).not.toBeInTheDocument();
    });

    it('handles rapid navigation away and back', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      const { unmount } = renderComponent();
      unmount();
      
      // Remount component
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <PlansListPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByRole('heading', { name: /^plans$/i, level: 1 })).toBeInTheDocument();
    });

    it('displays page title', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByRole('heading', { name: /^plans$/i, level: 1 })).toBeInTheDocument();
    });
  });

  describe('Recent Activity Timeline', () => {
    it('displays recent activity section when plans exist', () => {
      const mockPlansData: PlanJobsList = {
        jobs: [
          {
            job_id: 'job-1',
            status: 'SUCCEEDED',
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '2025-01-15T10:35:00Z',
          },
          {
            job_id: 'job-2',
            status: 'RUNNING',
            created_at: '2025-01-15T11:00:00Z',
            updated_at: '2025-01-15T11:05:00Z',
          },
        ],
        total: 2,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    });

    it('displays up to 5 most recent jobs in timeline', () => {
      const mockPlansData: PlanJobsList = {
        jobs: Array.from({ length: 10 }, (_, i) => ({
          job_id: `job-${i}`,
          status: 'SUCCEEDED',
          created_at: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-15T10:35:00Z',
        })),
        total: 10,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Check that exactly 5 timeline items are rendered
      const timelineItems = screen.getAllByRole('link').filter(link => 
        link.className.includes('timeline-link')
      );
      expect(timelineItems.length).toBe(5);
    });

    it('timeline items show job_id, status, and timestamp', () => {
      const mockPlansData: PlanJobsList = {
        jobs: [
          {
            job_id: 'test-job-123',
            status: 'RUNNING',
            created_at: '2025-01-15T10:30:00Z',
            updated_at: '2025-01-15T10:35:00Z',
          },
        ],
        total: 1,
        limit: 50,
      };

      mockUsePlansList.mockReturnValue({
        data: mockPlansData,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      // Check for job_id in timeline
      const timelineJobId = screen.getAllByText('test-job-123')[0];
      expect(timelineJobId).toBeInTheDocument();

      // Check for status badge (should be multiple - one in timeline, one in card)
      const statusBadges = screen.getAllByText('Running');
      expect(statusBadges.length).toBeGreaterThanOrEqual(1);

      // Check for timestamp
      const timestamps = screen.getAllByRole('time');
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('does not render timeline when no plans exist', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(screen.queryByRole('heading', { name: /recent activity/i })).not.toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('uses limit of 50 by default', () => {
      mockUsePlansList.mockReturnValue({
        data: { jobs: [], total: 0, limit: 50 },
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        refetch: vi.fn(),
      });

      renderComponent();

      expect(mockUsePlansList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });
  });
});
