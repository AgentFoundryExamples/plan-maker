import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTheme, initializeTheme, type ThemeMode } from './useTheme';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('useTheme', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Reset document data-theme attribute
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with auto theme by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('auto');
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('should load theme from localStorage if available', () => {
    localStorageMock.setItem('plan-maker-theme', 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should persist theme changes to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorageMock.getItem('plan-maker-theme')).toBe('dark');
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should apply theme attribute to document', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should resolve auto theme to system preference', () => {
    // Mock dark mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('auto');
    });

    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should handle localStorage being unavailable gracefully', () => {
    // Mock localStorage to throw errors
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('localStorage disabled');
        },
        setItem: () => {
          throw new Error('localStorage disabled');
        },
      },
      writable: true,
    });

    // Should not throw error
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('auto');

    // Should not throw when trying to set theme
    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should update resolved theme when system preference changes in auto mode', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.push(callback);
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('auto');
    });

    expect(result.current.resolvedTheme).toBe('light');

    // Simulate system preference change
    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent);
      });
    });

    expect(result.current.resolvedTheme).toBe('dark');
  });
});

describe('initializeTheme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
      })),
    });

    document.documentElement.removeAttribute('data-theme');
  });

  it('should initialize with auto theme if no preference is stored', () => {
    initializeTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should initialize with stored theme preference', () => {
    localStorageMock.setItem('plan-maker-theme', 'dark');

    initializeTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should resolve auto theme to system preference on initialization', () => {
    localStorageMock.setItem('plan-maker-theme', 'auto');
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      })),
    });

    initializeTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
