import React from 'react';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';

/**
 * Props for ThemeToggle component
 */
export interface ThemeToggleProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether to show label text */
  showLabel?: boolean;
}

/**
 * ThemeToggle Component
 * 
 * A toggle button for switching between light, dark, and auto theme modes.
 * 
 * Features:
 * - Cycles through light → dark → auto modes
 * - Visual icons for each mode (☀️ sun, 🌙 moon, 🔄 auto)
 * - Persists preference to localStorage
 * - Respects OS preference in auto mode
 * - Fully accessible with ARIA labels
 * - Keyboard navigable
 * 
 * Usage:
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle showLabel />
 * ```
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Cycle through: light → dark → auto → light
    const nextTheme: ThemeMode = 
      theme === 'light' ? 'dark' :
      theme === 'dark' ? 'auto' :
      'light';
    
    setTheme(nextTheme);
  };

  // Get icon and label based on current theme mode
  const getThemeIcon = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🔄';
    }
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
    }
  };

  const getAriaLabel = (): string => {
    return `Current theme: ${getThemeLabel(theme)}${theme === 'auto' ? ` (using ${resolvedTheme})` : ''}. Click to change theme.`;
  };

  return (
    <button
      type="button"
      className={`btn btn-text theme-toggle ${className}`.trim()}
      onClick={handleToggle}
      aria-label={getAriaLabel()}
      title={`Theme: ${getThemeLabel(theme)}${theme === 'auto' ? ` (${resolvedTheme})` : ''}`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {getThemeIcon(theme)}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {getThemeLabel(theme)}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
