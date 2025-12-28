import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlannerInputPage from './PlannerInputPage';

describe('PlannerInputPage', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <PlannerInputPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /plan input/i, level: 1 })
    ).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <PlannerInputPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/welcome to the agent foundry plan maker/i)
    ).toBeInTheDocument();
  });

  it('renders placeholder content', () => {
    render(
      <MemoryRouter>
        <PlannerInputPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/getting started/i)).toBeInTheDocument();
  });
});
