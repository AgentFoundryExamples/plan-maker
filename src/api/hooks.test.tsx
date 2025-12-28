import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

describe('React Query Setup', () => {
  it('should render children within QueryClientProvider', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const TestComponent = () => <div>Test Content</div>;

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should create QueryClient with correct default options', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });

    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(
      5 * 60 * 1000
    );
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(
      false
    );
  });
});
