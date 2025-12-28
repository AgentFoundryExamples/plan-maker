import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlanDetailPage from './PlanDetailPage';

describe('PlanDetailPage', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter initialEntries={['/plans/123']}>
        <Routes>
          <Route path="/plans/:id" element={<PlanDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /plan details/i, level: 1 })
    ).toBeInTheDocument();
  });

  it('displays the plan ID from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/plans/123']}>
        <Routes>
          <Route path="/plans/:id" element={<PlanDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/plan #123/i)).toBeInTheDocument();
    expect(screen.getByText(/plan id:/i)).toBeInTheDocument();
  });

  it('renders back to plans list link', () => {
    render(
      <MemoryRouter initialEntries={['/plans/123']}>
        <Routes>
          <Route path="/plans/:id" element={<PlanDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const backLink = screen.getByRole('link', { name: /back to plans list/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/plans');
  });

  it('renders placeholder content', () => {
    render(
      <MemoryRouter initialEntries={['/plans/456']}>
        <Routes>
          <Route path="/plans/:id" element={<PlanDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        /this placeholder page will display detailed information/i
      )
    ).toBeInTheDocument();
  });
});
