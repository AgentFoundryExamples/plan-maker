/**
 * Custom React Query hooks for data fetching.
 *
 * This module provides reusable hooks that wrap the generated API clients
 * with React Query for caching, automatic refetching, and optimistic updates.
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
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = usePlan(planId);
 * ```
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
      throw new Error('usePlan not yet implemented - connect to API client');
    },
    enabled: !!planId, // Only run if planId is truthy
    ...options,
  });
}

/**
 * Example hook stub for fetching multiple plans.
 *
 * Usage:
 * ```tsx
 * const { data: plans, isLoading } = usePlans({ limit: 10 });
 * ```
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
      throw new Error('usePlans not yet implemented - connect to API client');
    },
    ...options,
  });
}

/**
 * Example mutation hook stub for creating a plan.
 *
 * Usage:
 * ```tsx
 * const createPlan = useCreatePlan();
 * createPlan.mutate({ description: 'Build a REST API' });
 * ```
 */
export function useCreatePlan(
  options?: UseMutationOptions<PlanResponse, Error, PlanRequest>
) {
  return useMutation<PlanResponse, Error, PlanRequest>({
    mutationFn: async (_request: PlanRequest) => {
      // TODO: Replace with actual API call from softwarePlannerClient
      // Example: return await createPlan(request);
      throw new Error(
        'useCreatePlan not yet implemented - connect to API client'
      );
    },
    ...options,
  });
}

/**
 * Example hook stub for fetching clarification job status.
 *
 * Usage:
 * ```tsx
 * const { data: status } = useClarificationStatus(jobId);
 * ```
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
        'useClarificationStatus not yet implemented - connect to API client'
      );
    },
    enabled: !!jobId,
    ...options,
  });
}
