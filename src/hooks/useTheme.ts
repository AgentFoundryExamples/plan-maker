// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { useState, useEffect, useCallback } from 'react';

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Resolved theme (actual theme being displayed)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = 'plan-maker-theme';

/**
 * Custom event name for theme changes
 */
const THEME_CHANGE_EVENT = 'plan-maker-theme-change';

/**
 * Get system color scheme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Get stored theme preference from localStorage
 * Returns null if no preference is stored or localStorage is unavailable
 */
function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch (error) {
    // localStorage is unavailable or disabled
    console.warn('Failed to read theme from localStorage:', error);
  }
  
  return null;
}

/**
 * Save theme preference to localStorage
 */
function setStoredTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // localStorage is unavailable or disabled
    console.warn('Failed to save theme to localStorage:', error);
  }
}

/**
 * Resolve theme mode to actual theme
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'auto') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

/**
 * Dispatch custom event to notify all hook instances of theme change
 */
function dispatchThemeChangeEvent(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } })
  );
}

/**
 * Initialize theme before first paint to prevent flash
 * This is called in index.html script tag before React renders
 */
export function initializeTheme(): void {
  const storedTheme = getStoredTheme() || 'auto';
  const resolvedTheme = resolveTheme(storedTheme);
  applyTheme(resolvedTheme);
}

/**
 * Hook for managing theme state
 * 
 * Features:
 * - Persists theme preference to localStorage
 * - Respects OS color scheme preference when set to 'auto'
 * - Listens for OS theme changes
 * - Gracefully handles localStorage being unavailable
 * 
 * Usage:
 * ```tsx
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * 
 * // Current theme mode (light/dark/auto)
 * console.log(theme);
 * 
 * // Actual resolved theme being displayed
 * console.log(resolvedTheme);
 * 
 * // Change theme
 * setTheme('dark');
 * setTheme('auto'); // Follows OS preference
 * ```
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return getStoredTheme() || 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveTheme(theme);
  });

  // Update resolved theme when theme mode changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for theme changes from other hook instances
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme: ThemeMode }>;
      const newTheme = customEvent.detail.theme;
      
      // Update state to sync with other instances
      setThemeState(newTheme);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  }, []);

  // Listen for OS theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
    // Notify all other hook instances of the theme change
    dispatchThemeChangeEvent(newTheme);
  }, []);

  return {
    /** Current theme mode (light/dark/auto) */
    theme,
    /** Actual resolved theme being displayed (light/dark) */
    resolvedTheme,
    /** Set theme mode */
    setTheme,
  };
}
