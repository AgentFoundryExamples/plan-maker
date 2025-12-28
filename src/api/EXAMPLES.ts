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
 * Example usage of API clients
 * This file demonstrates how to use the generated API clients and wrapper utilities
 *
 * NOTE: This is for documentation purposes only and is not part of the application
 */

import {
  createPlan,
  createPlanAsync,
  getPlanById,
  listPlans,
  type PlanJobStatus,
} from './softwarePlannerClient';

import { clarifySpecs, waitForClarification } from './specClarifierClient';

// Example 1: Create a synchronous plan
async function exampleSyncPlan() {
  const plan = await createPlan({
    description: 'Build a REST API for managing tasks with authentication',
  });

  console.log('Plan created:', plan.specs);
  // plan.specs is an array of SpecItem objects with typed fields
}

// Example 2: Create an asynchronous plan and poll for results
async function exampleAsyncPlan() {
  // Start the job
  const job = await createPlanAsync({
    description: 'Build a REST API for managing tasks',
  });

  console.log('Job created:', job.job_id);

  // Poll for completion
  let status = await getPlanById(job.job_id);

  while (status.status === 'QUEUED' || status.status === 'RUNNING') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    status = await getPlanById(job.job_id);
  }

  if (status.status === 'SUCCEEDED' && status.result) {
    console.log('Plan generated:', status.result.specs);
  } else if (status.status === 'FAILED') {
    console.error('Plan failed:', status.error);
  }
}

// Example 3: List recent plans
async function exampleListPlans() {
  const plans = await listPlans(10);

  console.log(`Found ${plans.total} plans, showing ${plans.jobs.length}`);

  plans.jobs.forEach((job: PlanJobStatus) => {
    console.log(`Job ${job.job_id}: ${job.status}`);
    // Note: job.result.specs may be undefined in list responses
    if (job.result?.specs) {
      console.log(`  - ${job.result.specs.length} specs`);
    }
  });
}

// Example 4: Clarify specifications
async function exampleClarifySpecs() {
  // Create clarification job
  const job = await clarifySpecs({
    plan: {
      specs: [
        {
          purpose: 'User Authentication',
          vision: 'Secure authentication system',
          must: ['Support OAuth 2.0', 'JWT tokens'],
          dont: ['Store passwords in plain text'],
          nice: ['Biometric authentication'],
          open_questions: ['Which OAuth providers should be supported?'],
          assumptions: ['Users have valid email addresses'],
        },
      ],
    },
  });

  console.log('Clarification job created:', job.id);

  // Wait for completion (with automatic polling)
  const result = await waitForClarification(job.id, {
    maxAttempts: 60,
    intervalMs: 2000,
  });

  if (result.status === 'SUCCESS' && result.result) {
    console.log('Clarified specs:', result.result.specs);
    // open_questions field will be removed, answers integrated into other fields
  }
}

// Example 5: Using with API keys (for software planner)
async function exampleWithApiKey() {
  const plan = await createPlan(
    {
      description: 'Build a REST API',
      model: 'gpt-4-turbo', // Optional: specify model
    },
    {
      apiKey: 'your-api-key-here',
    }
  );

  console.log('Plan created with API key:', plan.specs);
}

// Example 6: Error handling
async function exampleErrorHandling() {
  try {
    await createPlan({
      description: '', // Invalid: empty description
    });
  } catch (error) {
    console.error('Failed to create plan:', error);
    // Error message will include descriptive information from the API
  }

  try {
    await getPlanById('invalid-job-id');
  } catch (error) {
    console.error('Failed to get plan status:', error);
    // Will throw descriptive error if job not found
  }
}

// Example 7: Using React Query hook (React components)
// In a React component, use the useCreatePlanAsync hook for better UX
/*
import { useCreatePlanAsync } from './hooks';

function PlanCreatorComponent() {
  const createPlan = useCreatePlanAsync({
    onSuccess: (data) => {
      console.log('Job created:', data.job_id);
      // Navigate to job status page or start polling
    },
    onError: (error) => {
      console.error('Failed to create plan:', error);
    }
  });

  const handleSubmit = (description: string) => {
    createPlan.mutate({ description });
  };

  return (
    <div>
      <button
        onClick={() => handleSubmit('Build a REST API')}
        disabled={createPlan.isPending}
      >
        {createPlan.isPending ? 'Creating...' : 'Create Plan'}
      </button>
      {createPlan.isError && (
        <div>Error: {createPlan.error.message}</div>
      )}
      {createPlan.isSuccess && (
        <div>Job ID: {createPlan.data.job_id}</div>
      )}
    </div>
  );
}
*/

// Example 8: Environment configuration
// The clients automatically use environment variables:
// - VITE_SOFTWARE_PLANNER_BASE_URL
// - VITE_SPEC_CLARIFIER_BASE_URL
//
// If these are not set, descriptive errors are thrown before making API calls

export {
  exampleSyncPlan,
  exampleAsyncPlan,
  exampleListPlans,
  exampleClarifySpecs,
  exampleWithApiKey,
  exampleErrorHandling,
};
