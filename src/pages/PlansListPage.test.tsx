import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlansListPage from './PlansListPage';

describe('PlansListPage', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <PlansListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /plans list/i, level: 1 })).toBeInTheDocument();
  });

  it('renders placeholder content', () => {
    render(
      <MemoryRouter>
        <PlansListPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/view and manage your software development plans/i)).toBeInTheDocument();
  });

  it('renders example plan links', () => {
    render(
      <MemoryRouter>
        <PlansListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /view example plan #1/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view example plan #2/i })).toBeInTheDocument();
  });
});
