import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlanTimeline from './PlanTimeline';
import type { PlanJobStatus } from '@/api/softwarePlannerClient';
import type { JobStatusResponse } from '@/api/specClarifier';
import { JobStatus } from '@/api/specClarifier';

describe('PlanTimeline', () => {
  const mockPlanJob: PlanJobStatus = {
    job_id: 'plan-123',
    status: 'SUCCEEDED',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:05:00Z',
    result: { specs: [] },
  };

  describe('Rendering', () => {
    it('renders timeline with plan events', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      expect(screen.getByRole('region', { name: /activity timeline/i })).toBeInTheDocument();
      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('displays plan creation event', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      expect(screen.getByText('Plan Created')).toBeInTheDocument();
    });

    it('displays plan status event', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      expect(screen.getByText('Plan Succeeded')).toBeInTheDocument();
    });

    it('formats timestamps correctly', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
      timeElements.forEach(element => {
        expect(element).toHaveAttribute('dateTime');
      });
    });

    it('renders compact view when compact prop is true', () => {
      const { container } = render(<PlanTimeline planJob={mockPlanJob} compact />);

      expect(container.querySelector('.timeline-compact')).toBeInTheDocument();
      // In compact view, descriptions should not be shown
      expect(screen.queryByText(/job completed successfully/i)).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PlanTimeline planJob={mockPlanJob} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Plan Status Events', () => {
    it('shows QUEUED status', () => {
      const queuedJob: PlanJobStatus = {
        ...mockPlanJob,
        status: 'QUEUED',
        updated_at: mockPlanJob.created_at,
      };

      render(<PlanTimeline planJob={queuedJob} />);

      // Should only show creation event, not separate QUEUED event
      expect(screen.getByText('Plan Created')).toBeInTheDocument();
      expect(screen.queryByText('Plan Queued')).not.toBeInTheDocument();
    });

    it('shows RUNNING status', () => {
      const runningJob: PlanJobStatus = {
        ...mockPlanJob,
        status: 'RUNNING',
        updated_at: '2025-01-15T10:02:00Z',
      };

      render(<PlanTimeline planJob={runningJob} />);

      expect(screen.getByText('Plan Created')).toBeInTheDocument();
      expect(screen.getByText('Plan Running')).toBeInTheDocument();
    });

    it('shows FAILED status', () => {
      const failedJob: PlanJobStatus = {
        ...mockPlanJob,
        status: 'FAILED',
        updated_at: '2025-01-15T10:03:00Z',
        error: {
          type: 'Error',
          error: 'Something went wrong',
        },
      };

      render(<PlanTimeline planJob={failedJob} />);

      expect(screen.getByText('Plan Created')).toBeInTheDocument();
      expect(screen.getByText('Plan Failed')).toBeInTheDocument();
    });
  });

  describe('Clarifier Events', () => {
    const mockClarifierJob: JobStatusResponse = {
      id: 'clarifier-456',
      status: JobStatus.SUCCESS,
      created_at: '2025-01-15T10:10:00Z',
      updated_at: '2025-01-15T10:15:00Z',
      last_error: null,
      result: null,
    };

    it('displays clarifier creation event', () => {
      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={mockClarifierJob}
          clarifierCreatedAt={mockClarifierJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Started')).toBeInTheDocument();
    });

    it('displays clarifier success event', () => {
      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={mockClarifierJob}
          clarifierCreatedAt={mockClarifierJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Success')).toBeInTheDocument();
    });

    it('shows clarifier PENDING status correctly', () => {
      const pendingJob: JobStatusResponse = {
        ...mockClarifierJob,
        status: JobStatus.PENDING,
        updated_at: mockClarifierJob.created_at,
      };

      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={pendingJob}
          clarifierCreatedAt={pendingJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Started')).toBeInTheDocument();
      // Should not show separate PENDING event
      expect(screen.queryByText('Clarification Pending')).not.toBeInTheDocument();
    });

    it('shows clarifier RUNNING status', () => {
      const runningJob: JobStatusResponse = {
        ...mockClarifierJob,
        status: JobStatus.RUNNING,
        updated_at: '2025-01-15T10:12:00Z',
      };

      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={runningJob}
          clarifierCreatedAt={runningJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Running')).toBeInTheDocument();
    });

    it('shows clarifier FAILED status', () => {
      const failedJob: JobStatusResponse = {
        ...mockClarifierJob,
        status: JobStatus.FAILED,
        updated_at: '2025-01-15T10:13:00Z',
        last_error: 'Clarification error',
      };

      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={failedJob}
          clarifierCreatedAt={failedJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Failed')).toBeInTheDocument();
    });

    it('handles clarifier without clarifierCreatedAt timestamp', () => {
      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={mockClarifierJob}
        />
      );

      // Should show status event but not creation event
      expect(screen.queryByText('Clarification Started')).not.toBeInTheDocument();
      expect(screen.getByText('Clarification Success')).toBeInTheDocument();
    });
  });

  describe('Chronological Ordering', () => {
    it('displays events in reverse chronological order (most recent first)', () => {
      const clarifierJob: JobStatusResponse = {
        id: 'clarifier-456',
        status: JobStatus.SUCCESS,
        created_at: '2025-01-15T10:10:00Z',
        updated_at: '2025-01-15T10:15:00Z',
        last_error: null,
        result: null,
      };

      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={clarifierJob}
          clarifierCreatedAt={clarifierJob.created_at}
        />
      );

      const listItems = screen.getAllByRole('listitem');
      
      // Most recent should be first (clarifier success at 10:15)
      expect(listItems[0]).toHaveTextContent('Clarification Success');
      
      // Clarifier creation (10:10) should be before plan succeeded (10:05)
      const labels = listItems.map(item => item.textContent);
      const clarifierStartIndex = labels.findIndex(text => text?.includes('Clarification Started'));
      const planSuccessIndex = labels.findIndex(text => text?.includes('Plan Succeeded'));
      
      expect(clarifierStartIndex).toBeLessThan(planSuccessIndex);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA region role', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      const region = screen.getByRole('region', { name: /activity timeline/i });
      expect(region).toBeInTheDocument();
    });

    it('timeline items are keyboard navigable', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('provides descriptive aria-labels for events', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
        const ariaLabel = item.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      });
    });

    it('uses semantic time elements', () => {
      render(<PlanTimeline planJob={mockPlanJob} />);

      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
      
      timeElements.forEach(element => {
        expect(element).toHaveAttribute('dateTime');
        const dateTime = element.getAttribute('dateTime');
        expect(dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty events gracefully', () => {
      const emptyJob: PlanJobStatus = {
        job_id: 'empty',
        status: 'QUEUED',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        result: null,
      };

      render(<PlanTimeline planJob={emptyJob} />);

      // Should still render with at least the creation event
      expect(screen.getByText('Plan Created')).toBeInTheDocument();
    });

    it('handles missing clarifier result', () => {
      const clarifierJob: JobStatusResponse = {
        id: 'clarifier-456',
        status: JobStatus.SUCCESS,
        created_at: '2025-01-15T10:10:00Z',
        updated_at: '2025-01-15T10:15:00Z',
        last_error: null,
        result: null,
      };

      render(
        <PlanTimeline
          planJob={mockPlanJob}
          clarifierJob={clarifierJob}
          clarifierCreatedAt={clarifierJob.created_at}
        />
      );

      expect(screen.getByText('Clarification Success')).toBeInTheDocument();
    });

    it('handles malformed timestamps gracefully', () => {
      const badJob: PlanJobStatus = {
        ...mockPlanJob,
        created_at: '',
        updated_at: '',
      };

      render(<PlanTimeline planJob={badJob} />);

      // Should still render even with bad timestamps
      expect(screen.getByText('Plan Created')).toBeInTheDocument();
    });
  });
});
