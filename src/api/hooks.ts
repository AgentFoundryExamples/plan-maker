/**
 * Custom React Query hooks for data fetching.
 *
 * This module provides reusable hooks that wrap the generated API clients
 * with React Query for caching, automatic refetching, and optimistic updates.
 *
 * @warning These hooks are currently STUBS and will throw errors if used.
 * They must be connected to the actual API client functions before use in production.
 *
 * To implement:
 * 1. Import the corresponding function from softwarePlannerClient or specClarifierClient
 * 2. Replace the queryFn/mutationFn implementation with the actual API call
 * 3. Remove the warning from the JSDoc
 */

import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import type { PlanRequest } from './softwarePlanner/models/PlanRequest';
import type { PlanResponse } from './softwarePlanner/models/PlanResponse';
import type { JobStatusResponse } from './specClarifier/models/JobStatusResponse';

/**
 * Example hook stub for fetching a plan by ID.
 *
 * @warning NOT IMPLEMENTED - This hook will throw an error if called.
 * Connect to the actual API client before using in production.
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = usePlan(planId);
 * ```
 *
 * @param planId - The ID of the plan to fetch
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with data, loading state, and error
 */
export function usePlan(
  planId: string,
  options?: Omit<UseQueryOptions<PlanResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PlanResponse, Error>({
    queryKey: ['plan', planId],
    queryFn: async () => {
      // TODO: Replace with actual API call from softwarePlannerClient
      // Example: return await getPlanById(planId);
      throw new Error(
        'usePlan is not yet implemented. Connect to softwarePlannerClient before using.'
      );
    },
    enabled: !!planId, // Only run if planId is truthy
    ...options,
  });
}

/**
 * Example hook stub for fetching multiple plans.
 *
 * @warning NOT IMPLEMENTED - This hook will throw an error if called.
 * Connect to the actual API client before using in production.
 *
 * Usage:
 * ```tsx
 * const { data: plans, isLoading } = usePlans({ limit: 10 });
 * ```
 *
 * @param params - Query parameters (e.g., limit)
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with data, loading state, and error
 */
export function usePlans(
  params?: { limit?: number },
  options?: Omit<UseQueryOptions<PlanResponse[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PlanResponse[], Error>({
    queryKey: ['plans', params],
    queryFn: async () => {
      // TODO: Replace with actual API call from softwarePlannerClient
      // Example: return await listPlans(params?.limit);
      throw new Error(
        'usePlans is not yet implemented. Connect to softwarePlannerClient before using.'
      );
    },
    ...options,
  });
}

/**
 * Example mutation hook stub for creating a plan.
 *
 * @warning NOT IMPLEMENTED - This hook will throw an error if called.
 * Connect to the actual API client before using in production.
 *
 * Usage:
 * ```tsx
 * const createPlan = useCreatePlan();
 * createPlan.mutate({ description: 'Build a REST API' });
 * ```
 *
 * @param options - React Query mutation options
 * @returns React Query mutation result
 */
export function useCreatePlan(
  options?: UseMutationOptions<PlanResponse, Error, PlanRequest>
) {
  return useMutation<PlanResponse, Error, PlanRequest>({
    mutationFn: async (_request: PlanRequest) => {
      // TODO: Replace with actual API call from softwarePlannerClient
      // Example: return await createPlan(request);
      throw new Error(
        'useCreatePlan is not yet implemented. Connect to softwarePlannerClient before using.'
      );
    },
    ...options,
  });
}

/**
 * Example hook stub for fetching clarification job status.
 *
 * @warning NOT IMPLEMENTED - This hook will throw an error if called.
 * Connect to the actual API client before using in production.
 *
 * Usage:
 * ```tsx
 * const { data: status } = useClarificationStatus(jobId);
 * ```
 *
 * @param jobId - The clarification job ID to fetch
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with job status data
 */
export function useClarificationStatus(
  jobId: string,
  options?: Omit<
    UseQueryOptions<JobStatusResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<JobStatusResponse, Error>({
    queryKey: ['clarification', jobId],
    queryFn: async () => {
      // TODO: Replace with actual API call from specClarifierClient
      // Example: return await getClarifierStatus(jobId);
      throw new Error(
        'useClarificationStatus is not yet implemented. Connect to specClarifierClient before using.'
      );
    },
    enabled: !!jobId,
    ...options,
  });
}
