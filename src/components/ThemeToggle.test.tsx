import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import * as useThemeModule from '@/hooks/useTheme';

// Mock the useTheme hook
vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    mockSetTheme.mockClear();
    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('theme-toggle');
  });

  it('should display correct icon for light theme', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('☀️');
  });

  it('should display correct icon for dark theme', () => {
    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('🌙');
  });

  it('should display correct icon for auto theme', () => {
    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'auto',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('🔄');
  });

  it('should show label when showLabel prop is true', () => {
    render(<ThemeToggle showLabel />);

    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('should not show label by default', () => {
    render(<ThemeToggle />);

    expect(screen.queryByText('Light')).not.toBeInTheDocument();
  });

  it('should cycle from light to dark when clicked', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should cycle from dark to auto when clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('auto');
  });

  it('should cycle from auto to light when clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'auto',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should have proper ARIA label', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Current theme: Light. Click to change theme.');
  });

  it('should show resolved theme in ARIA label for auto mode', () => {
    vi.mocked(useThemeModule.useTheme).mockReturnValue({
      theme: 'auto',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Current theme: Auto (using dark). Click to change theme.');
  });

  it('should accept custom className', () => {
    render(<ThemeToggle className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    
    // Tab to focus
    await user.tab();
    expect(button).toHaveFocus();

    // Press Enter to activate
    await user.keyboard('{Enter}');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
