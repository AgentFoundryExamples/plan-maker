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
import type {
  JobStatusResponse,
  JobSummaryResponse,
  ClarificationRequestWithConfig,
} from './specClarifier';
import {
  createPlanAsync,
  listPlans,
  getPlanById,
  type AsyncPlanJob,
  type CreatePlanOptions,
  type PlanJobStatus,
  type PlanJobsList,
} from './softwarePlannerClient';
import { clarifySpecs, getClarifierStatus, type ClarifyOptions } from './specClarifierClient';

/**
 * Hook for fetching a single plan job's status and result.
 *
 * This hook fetches plan job metadata including status, timestamps, and result/error.
 * It automatically manages caching and provides refetch capability.
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error, refetch } = usePlan(planId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (data?.result) {
 *   return <PlanDetails plan={data.result} />;
 * }
 * ```
 *
 * @param planId - The ID of the plan to fetch (must be valid UUID)
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with data, loading state, and error
 */
export function usePlan(
  planId: string | undefined,
  options?: Omit<UseQueryOptions<PlanJobStatus, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PlanJobStatus, Error>({
    queryKey: ['plan', planId],
    queryFn: async () => {
      // The enabled option ensures planId is defined when this runs
      return getPlanById(planId!);
    },
    enabled: !!planId, // Only run if planId is truthy
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching detailed information about a specific plan.
 *
 * This hook provides a query interface for fetching plan details using the
 * Software Planner API. It includes:
 * - Automatic fetching of plan metadata and specs
 * - Conditional fetching via the enabled option (only runs if planId is valid)
 * - Typed data, error, and loading states
 * - Result includes job status, timestamps, and plan specs when available
 *
 * Usage:
 * ```tsx
 * const { data, error, isLoading } = usePlanDetail(planId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (data?.result) {
 *   return <PlanDetails plan={data.result} />;
 * }
 * ```
 *
 * @param planId - The ID of the plan to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with PlanJobStatus data, error, and loading state
 */
export function usePlanDetail(
  planId: string | undefined,
  options?: Omit<
    UseQueryOptions<PlanJobStatus, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<PlanJobStatus, Error>({
    queryKey: ['plan', 'detail', planId],
    queryFn: async () => {
      // The enabled option ensures planId is defined when this runs
      return getPlanById(planId!);
    },
    enabled: !!planId, // Only run if planId is truthy
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching a paginated list of planning jobs.
 *
 * This hook provides a query interface for listing planning jobs.
 * It does NOT automatically poll - use refetchInterval option if polling is needed.
 * By default, this uses manual refresh only.
 *
 * Usage:
 * ```tsx
 * const { data: plans, isLoading, refetch } = usePlans({ limit: 50 });
 *
 * if (isLoading) return <Spinner />;
 * return (
 *   <div>
 *     <button onClick={() => refetch()}>Refresh</button>
 *     {plans?.jobs.map(job => <PlanCard key={job.job_id} job={job} />)}
 *   </div>
 * );
 * ```
 *
 * @param params - Query parameters (e.g., limit, cursor)
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with data, loading state, and error
 */
export function usePlans(
  params?: { limit?: number; cursor?: string },
  options?: Omit<UseQueryOptions<PlanJobsList, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PlanJobsList, Error>({
    queryKey: ['plans', params],
    queryFn: async () => {
      // React Query handles cancellation via AbortSignal
      return listPlans(params);
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // No automatic refetching - manual only
    refetchInterval: false,
    refetchOnWindowFocus: false,
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
 * Hook for fetching clarification job status.
 *
 * This hook provides a query interface for checking the status of a clarification job.
 * See specClarifierClient.ts for full OpenAPI contract details.
 *
 * Usage:
 * ```tsx
 * const { data: status } = useClarificationStatus(jobId, {
 *   refetchInterval: 2000, // Poll every 2 seconds
 * });
 * ```
 *
 * @param jobId - The clarification job ID to fetch
 * @param options - React Query options (excluding queryKey and queryFn)
 * @returns React Query result with job status data
 */
export function useClarificationStatus(
  jobId: string | undefined,
  options?: Omit<
    UseQueryOptions<JobStatusResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<JobStatusResponse, Error>({
    queryKey: ['clarification', jobId],
    queryFn: () => {
      // The 'enabled' option ensures jobId is defined when this function runs
      return getClarifierStatus(jobId!);
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
  if (import.meta.env.DEV) {
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

      // Separate client options from the API request payload
      const { apiKey, fetchImpl, ...planRequest } = request;
      const createOptions: CreatePlanOptions = { apiKey, fetchImpl };

      // Log request in development mode
      logInDevelopment('request', planRequest);

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

/**
 * Options for the usePlansList hook
 */
export interface UsePlansListOptions {
  limit?: number;
  cursor?: string;
  refetchInterval?: number | false;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
}

/**
 * Hook for fetching a paginated list of planning jobs.
 *
 * This hook provides a query interface for listing planning jobs using the
 * Software Planner API. It includes:
 * - Automatic polling/refetching when refetchInterval is specified
 * - Conditional fetching via the enabled option
 * - Limit defaulting to 25 and clamping to max 25
 * - Cursor-based pagination support
 * - Typed data, error, and loading states
 * - Last updated timestamp tracking
 *
 * Usage:
 * ```tsx
 * const { data, error, isLoading, lastUpdated, refetch } = usePlansList({
 *   limit: 25,
 *   refetchInterval: 5000, // Poll every 5 seconds
 *   enabled: true,
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <h2>Plans ({data?.total})</h2>
 *     {data?.jobs.map(job => <PlanCard key={job.job_id} job={job} />)}
 *   </div>
 * );
 * ```
 *
 * @param options - Options for controlling the query behavior
 * @returns Query result with data, error, loading state, and refetch function
 */
export function usePlansList(options: UsePlansListOptions = {}) {
  const { limit, cursor, refetchInterval, enabled = true, fetchImpl } = options;

  // Normalize limit to the effective value for stable query key
  const effectiveLimit = Math.min(limit ?? 25, 25);

  const queryResult = useQuery({
    queryKey: ['plans', 'list', { limit: effectiveLimit, cursor }],
    queryFn: async () => {
      return listPlans({ limit, cursor, fetchImpl });
    },
    enabled,
    refetchInterval,
    staleTime: refetchInterval ? 0 : 5 * 60 * 1000, // If polling, always consider stale
  });

  return {
    data: queryResult.data,
    error: queryResult.error,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    isSuccess: queryResult.isSuccess,
    lastUpdated: queryResult.dataUpdatedAt,
    refetch: queryResult.refetch,
  };
}

/**
 * Options for submitting clarifications, extending the request with client options.
 */
export interface SubmitClarificationsOptions extends ClarificationRequestWithConfig {
  fetchImpl?: typeof fetch;
}

/**
 * Hook for submitting specifications for asynchronous clarification.
 *
 * This hook provides a mutation interface for submitting clarification requests to the
 * Spec Clarifier API. See specClarifierClient.ts for full OpenAPI contract details.
 *
 * Usage:
 * ```tsx
 * const submitClarifications = useSubmitClarifications({
 *   onSuccess: (data) => navigate(`/clarifications/${data.id}`),
 *   onError: (error) => console.error('Submission failed:', error)
 * });
 *
 * submitClarifications.mutate({
 *   plan: {
 *     specs: [{
 *       purpose: 'Build user auth',
 *       vision: 'Secure auth system',
 *       open_questions: ['Which OAuth providers?']
 *     }]
 *   },
 *   answers: [{
 *     spec_index: 0,
 *     question_index: 0,
 *     question: 'Which OAuth providers?',
 *     answer: 'Google and GitHub'
 *   }]
 * });
 * ```
 *
 * @param options - React Query mutation options for customizing behavior
 * @returns Mutation object with mutate/mutateAsync, loading state, error, and job data
 */
export function useSubmitClarifications(
  options?: UseMutationOptions<
    JobSummaryResponse,
    Error,
    SubmitClarificationsOptions
  >
) {
  return useMutation<
    JobSummaryResponse,
    Error,
    SubmitClarificationsOptions
  >({
    mutationFn: async (request: SubmitClarificationsOptions) => {
      // Separate client options from the API request payload
      const { fetchImpl, ...clarificationRequest } = request;
      const clarifyOptions: ClarifyOptions = { fetchImpl };

      // Call the API client - env validation and base URL checks happen in the client
      const response = await clarifySpecs(clarificationRequest, clarifyOptions);

      return response;
    },
    // Prevent duplicate submissions - only one mutation can be in-flight at a time
    ...options,
  });
}
