import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

describe('AppLayout', () => {
  beforeEach(() => {
    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('renders the header with application title', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Agent Foundry Plan Maker')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('link', { name: /plan input/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /plans list/i })
    ).toBeInTheDocument();
  });

  it('renders skip link for accessibility', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('renders navigation with proper aria-label', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
  });

  it('marks Plan Input link as active when on home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    );

    const planInputLink = screen.getByRole('link', { name: /plan input/i });
    expect(planInputLink).toHaveClass('active');
    expect(planInputLink).toHaveAttribute('aria-current', 'page');

    const plansListLink = screen.getByRole('link', { name: /plans list/i });
    expect(plansListLink).not.toHaveClass('active');
    expect(plansListLink).not.toHaveAttribute('aria-current');
  });

  it('marks Plans List link as active when on /plans route', () => {
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <AppLayout />
      </MemoryRouter>
    );

    const plansListLink = screen.getByRole('link', { name: /plans list/i });
    expect(plansListLink).toHaveClass('active');
    expect(plansListLink).toHaveAttribute('aria-current', 'page');

    const planInputLink = screen.getByRole('link', { name: /plan input/i });
    expect(planInputLink).not.toHaveClass('active');
    expect(planInputLink).not.toHaveAttribute('aria-current');
  });

  it('marks Plans List link as active when on /plans/:id route', () => {
    render(
      <MemoryRouter initialEntries={['/plans/test-123']}>
        <AppLayout />
      </MemoryRouter>
    );

    const plansListLink = screen.getByRole('link', { name: /plans list/i });
    expect(plansListLink).toHaveClass('active');
    expect(plansListLink).toHaveAttribute('aria-current', 'page');

    const planInputLink = screen.getByRole('link', { name: /plan input/i });
    expect(planInputLink).not.toHaveClass('active');
    expect(planInputLink).not.toHaveAttribute('aria-current');
  });

  it('navigation links are keyboard accessible', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const planInputLink = screen.getByRole('link', { name: /plan input/i });
    const plansListLink = screen.getByRole('link', { name: /plans list/i });

    // Links should be in the tab order (no negative tabindex)
    expect(planInputLink).not.toHaveAttribute('tabindex', '-1');
    expect(plansListLink).not.toHaveAttribute('tabindex', '-1');
  });

  it('navigation links have correct hrefs', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const planInputLink = screen.getByRole('link', { name: /plan input/i });
    const plansListLink = screen.getByRole('link', { name: /plans list/i });

    expect(planInputLink).toHaveAttribute('href', '/');
    expect(plansListLink).toHaveAttribute('href', '/plans');
  });
});
