import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  describe('Planner Statuses', () => {
    it('renders QUEUED status correctly', () => {
      render(<StatusBadge status="QUEUED" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Queued');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Queued - Job is waiting to be processed'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-info)' });
    });

    it('renders RUNNING status correctly', () => {
      render(<StatusBadge status="RUNNING" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Running');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Running - Job is currently being processed'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-warning)' });
    });

    it('renders SUCCEEDED status correctly', () => {
      render(<StatusBadge status="SUCCEEDED" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Succeeded');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Succeeded - Job completed successfully'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-success)' });
    });

    it('renders FAILED status correctly', () => {
      render(<StatusBadge status="FAILED" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Failed');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Failed - Job failed to complete'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-error)' });
    });
  });

  describe('Clarifier Statuses', () => {
    it('renders PENDING status correctly', () => {
      render(<StatusBadge status="PENDING" type="clarifier" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Pending');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Pending - Job is queued and waiting to start'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-info)' });
    });

    it('renders RUNNING status for clarifier correctly', () => {
      render(<StatusBadge status="RUNNING" type="clarifier" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Running');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Running - Job is currently being clarified'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-warning)' });
    });

    it('renders SUCCESS status correctly', () => {
      render(<StatusBadge status="SUCCESS" type="clarifier" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Success');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Success - Clarification completed successfully'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-success)' });
    });

    it('renders FAILED status for clarifier correctly', () => {
      render(<StatusBadge status="FAILED" type="clarifier" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Failed');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Failed - Clarification failed with an error'
      );
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-error)' });
    });
  });

  describe('Fallback Behavior', () => {
    it('handles unknown status gracefully', () => {
      render(<StatusBadge status="UNKNOWN_STATUS" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Unknown');
      expect(badge).toHaveAttribute('aria-label', 'Status: Unknown - Status: UNKNOWN_STATUS');
      expect(badge).toHaveStyle({ backgroundColor: 'var(--color-neutral)' });
    });

    it('handles empty status string', () => {
      render(<StatusBadge status="" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Unknown');
    });

    it('handles malformed status input', () => {
      render(<StatusBadge status="random-value-123" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Unknown');
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<StatusBadge status="SUCCEEDED" type="planner" size="sm" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge-sm');
    });

    it('renders medium size by default', () => {
      render(<StatusBadge status="SUCCEEDED" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge-md');
    });

    it('renders large size correctly', () => {
      render(<StatusBadge status="SUCCEEDED" type="planner" size="lg" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge-lg');
    });
  });

  describe('Custom Styling', () => {
    it('applies additional className when provided', () => {
      render(
        <StatusBadge
          status="RUNNING"
          type="planner"
          className="custom-class"
        />
      );
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('applies base status-badge class', () => {
      render(<StatusBadge status="QUEUED" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge');
    });
  });

  describe('Type Defaults', () => {
    it('defaults to planner type when type is not specified', () => {
      render(<StatusBadge status="SUCCEEDED" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Succeeded');
      expect(badge).toHaveAttribute(
        'aria-label',
        'Status: Succeeded - Job completed successfully'
      );
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<StatusBadge status="RUNNING" type="planner" />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('provides descriptive aria-label', () => {
      render(<StatusBadge status="FAILED" type="planner" />);
      
      const badge = screen.getByRole('status');
      const ariaLabel = badge.getAttribute('aria-label');
      expect(ariaLabel).toContain('Status:');
      expect(ariaLabel).toContain('Failed');
      expect(ariaLabel).toContain('Job failed to complete');
    });

    it('maintains accessibility for unknown statuses', () => {
      render(<StatusBadge status="INVALID" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label');
      expect(badge.getAttribute('aria-label')).toContain('Unknown');
    });
  });

  describe('Edge Cases', () => {
    it('handles case-sensitive status values', () => {
      // Status should be uppercase as per API spec
      render(<StatusBadge status="succeeded" type="planner" />);
      
      const badge = screen.getByRole('status');
      // Should fall back to Unknown for lowercase
      expect(badge).toHaveTextContent('Unknown');
    });

    it('renders without crashing with special characters', () => {
      render(<StatusBadge status="@#$%^&*()" type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Unknown');
    });

    it('handles very long status strings', () => {
      const longStatus = 'A'.repeat(100);
      render(<StatusBadge status={longStatus} type="planner" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Unknown');
    });
  });
});
