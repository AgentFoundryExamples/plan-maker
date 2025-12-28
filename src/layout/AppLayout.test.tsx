import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

describe('AppLayout', () => {
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
});
