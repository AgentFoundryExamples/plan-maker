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
/**
 * Custom React Query hooks for data fetching.
 *
 * This module provides reusable hooks that wrap the generated API clients
 * with React Query for caching, automatic refetching, and optimistic updates.
 *
 * Implemented hooks:
 * - useCreatePlanAsync: Mutation hook for creating async software planning jobs
 *
 * @warning Some hooks are currently STUBS and will throw errors if used.
 * They must be connected to the actual API client functions before use in production.
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
import {
  createPlanAsync,
  type AsyncPlanJob,
  type CreatePlanOptions,
} from './softwarePlannerClient';

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

/**
 * Validates PlanRequest payload before submission
 * @param request - The plan request to validate
 * @throws Error if validation fails
 */
function validatePlanRequest(request: PlanRequest): void {
  if (!request.description || request.description.trim() === '') {
    throw new Error('Description is required and cannot be empty');
  }
}

/**
 * Logs request/response in development mode only
 * @param type - Type of log (request or response)
 * @param data - Data to log
 */
function logInDevelopment(type: 'request' | 'response', data: unknown): void {
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    console.log(`[${type.toUpperCase()}]`, data);
  }
}

/**
 * Hook for creating an asynchronous software planning job.
 *
 * This hook provides a mutation interface for creating async planning jobs using the
 * Software Planner API. It includes:
 * - Automatic base URL configuration from environment variables
 * - Payload validation before submission
 * - Prevention of duplicate in-flight submissions
 * - Development-only request/response logging
 * - Typed error handling
 *
 * Usage:
 * ```tsx
 * const createPlan = useCreatePlanAsync({
 *   onSuccess: (data) => {
 *     console.log('Job created:', data.job_id);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error);
 *   }
 * });
 *
 * // Submit a plan creation request
 * createPlan.mutate({
 *   description: 'Build a REST API for managing tasks',
 *   model: 'gpt-4-turbo', // optional
 * });
 *
 * // Access loading state
 * if (createPlan.isPending) {
 *   return <Spinner />;
 * }
 * ```
 *
 * @param options - React Query mutation options for customizing behavior
 * @returns Mutation object with mutate/mutateAsync, loading state, and error
 */
export function useCreatePlanAsync(
  options?: UseMutationOptions<
    AsyncPlanJob,
    Error,
    PlanRequest & CreatePlanOptions
  >
) {
  return useMutation<AsyncPlanJob, Error, PlanRequest & CreatePlanOptions>({
    mutationFn: async (request: PlanRequest & CreatePlanOptions) => {
      // Validate payload before making the request
      validatePlanRequest(request);

      // Log request in development mode
      logInDevelopment('request', {
        description: request.description,
        model: request.model,
        system_prompt: request.system_prompt,
      });

      // Extract options from request
      const { description, model, system_prompt, apiKey, fetchImpl } = request;
      const planRequest: PlanRequest = { description, model, system_prompt };
      const createOptions: CreatePlanOptions = { apiKey, fetchImpl };

      // Call the API client
      const response = await createPlanAsync(planRequest, createOptions);

      // Log response in development mode
      logInDevelopment('response', response);

      return response;
    },
    // Prevent duplicate submissions - only one mutation can be in-flight at a time
    ...options,
  });
}
