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

import { describe, it, expect } from 'vitest';
import {
  getPlannerStatusMetadata,
  getClarifierStatusMetadata,
  PLANNER_STATUS_MAP,
  CLARIFIER_STATUS_MAP,
} from './statusMappings';

describe('Status Mappings', () => {
  describe('getPlannerStatusMetadata', () => {
    it('returns correct metadata for QUEUED status', () => {
      const metadata = getPlannerStatusMetadata('QUEUED');

      expect(metadata).toEqual({
        label: 'Queued',
        description: 'Job is waiting to be processed',
        color: 'var(--color-info)',
        icon: '⏱️',
        progress: 0,
      });
    });

    it('returns correct metadata for RUNNING status', () => {
      const metadata = getPlannerStatusMetadata('RUNNING');

      expect(metadata).toEqual({
        label: 'Running',
        description: 'Job is currently being processed',
        color: 'var(--color-warning)',
        icon: '⚙️',
        progress: 50,
      });
    });

    it('returns correct metadata for SUCCEEDED status', () => {
      const metadata = getPlannerStatusMetadata('SUCCEEDED');

      expect(metadata).toEqual({
        label: 'Succeeded',
        description: 'Job completed successfully',
        color: 'var(--color-success)',
        icon: '✓',
        progress: 100,
      });
    });

    it('returns correct metadata for FAILED status', () => {
      const metadata = getPlannerStatusMetadata('FAILED');

      expect(metadata).toEqual({
        label: 'Failed',
        description: 'Job failed to complete',
        color: 'var(--color-error)',
        icon: '✗',
        progress: 100,
      });
    });

    it('returns Unknown metadata for unrecognized planner status', () => {
      const metadata = getPlannerStatusMetadata('UNKNOWN_STATUS');

      expect(metadata).toEqual({
        label: 'Unknown',
        description: 'Status: UNKNOWN_STATUS',
        color: 'var(--color-neutral)',
        icon: '?',
        progress: 0,
      });
    });

    it('returns fallback for empty string status', () => {
      const metadata = getPlannerStatusMetadata('');

      expect(metadata.label).toBe('Unknown');
      expect(metadata.progress).toBe(0);
    });
  });

  describe('getClarifierStatusMetadata', () => {
    it('returns correct metadata for PENDING status', () => {
      const metadata = getClarifierStatusMetadata('PENDING');

      expect(metadata).toEqual({
        label: 'Pending',
        description: 'Job is queued and waiting to start',
        color: 'var(--color-info)',
        icon: '⏱️',
        progress: 0,
      });
    });

    it('returns correct metadata for RUNNING status', () => {
      const metadata = getClarifierStatusMetadata('RUNNING');

      expect(metadata).toEqual({
        label: 'Running',
        description: 'Job is currently being clarified',
        color: 'var(--color-warning)',
        icon: '⚙️',
        progress: 50,
      });
    });

    it('returns correct metadata for SUCCESS status', () => {
      const metadata = getClarifierStatusMetadata('SUCCESS');

      expect(metadata).toEqual({
        label: 'Success',
        description: 'Clarification completed successfully',
        color: 'var(--color-success)',
        icon: '✓',
        progress: 100,
      });
    });

    it('returns correct metadata for FAILED status', () => {
      const metadata = getClarifierStatusMetadata('FAILED');

      expect(metadata).toEqual({
        label: 'Failed',
        description: 'Clarification failed with an error',
        color: 'var(--color-error)',
        icon: '✗',
        progress: 100,
      });
    });

    it('returns Unknown metadata for unrecognized clarifier status', () => {
      const metadata = getClarifierStatusMetadata('INVALID');

      expect(metadata).toEqual({
        label: 'Unknown',
        description: 'Status: INVALID',
        color: 'var(--color-neutral)',
        icon: '?',
        progress: 0,
      });
    });
  });

  describe('Status Maps', () => {
    it('PLANNER_STATUS_MAP contains all planner statuses', () => {
      expect(PLANNER_STATUS_MAP).toHaveProperty('QUEUED');
      expect(PLANNER_STATUS_MAP).toHaveProperty('RUNNING');
      expect(PLANNER_STATUS_MAP).toHaveProperty('SUCCEEDED');
      expect(PLANNER_STATUS_MAP).toHaveProperty('FAILED');
    });

    it('CLARIFIER_STATUS_MAP contains all clarifier statuses', () => {
      expect(CLARIFIER_STATUS_MAP).toHaveProperty('PENDING');
      expect(CLARIFIER_STATUS_MAP).toHaveProperty('RUNNING');
      expect(CLARIFIER_STATUS_MAP).toHaveProperty('SUCCESS');
      expect(CLARIFIER_STATUS_MAP).toHaveProperty('FAILED');
    });

    it('all planner statuses have required fields', () => {
      const statuses: Array<'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'> = [
        'QUEUED',
        'RUNNING',
        'SUCCEEDED',
        'FAILED',
      ];

      statuses.forEach(status => {
        const data = PLANNER_STATUS_MAP[status];
        expect(data).toHaveProperty('label');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('color');
        expect(data).toHaveProperty('icon');
        expect(typeof data.label).toBe('string');
        expect(typeof data.description).toBe('string');
        expect(typeof data.color).toBe('string');
      });
    });

    it('all clarifier statuses have required fields', () => {
      const statuses: Array<'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'> = [
        'PENDING',
        'RUNNING',
        'SUCCESS',
        'FAILED',
      ];

      statuses.forEach(status => {
        const data = CLARIFIER_STATUS_MAP[status];
        expect(data).toHaveProperty('label');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('color');
        expect(data).toHaveProperty('icon');
        expect(typeof data.label).toBe('string');
        expect(typeof data.description).toBe('string');
        expect(typeof data.color).toBe('string');
      });
    });
  });

  describe('Progress Calculation', () => {
    it('returns 0 progress for queued/pending statuses', () => {
      expect(getPlannerStatusMetadata('QUEUED').progress).toBe(0);
      expect(getClarifierStatusMetadata('PENDING').progress).toBe(0);
    });

    it('returns 50 progress for running statuses', () => {
      expect(getPlannerStatusMetadata('RUNNING').progress).toBe(50);
      expect(getClarifierStatusMetadata('RUNNING').progress).toBe(50);
    });

    it('returns 100 progress for completed statuses', () => {
      expect(getPlannerStatusMetadata('SUCCEEDED').progress).toBe(100);
      expect(getPlannerStatusMetadata('FAILED').progress).toBe(100);
      expect(getClarifierStatusMetadata('SUCCESS').progress).toBe(100);
      expect(getClarifierStatusMetadata('FAILED').progress).toBe(100);
    });

    it('returns 0 progress for unknown statuses', () => {
      expect(getPlannerStatusMetadata('UNKNOWN').progress).toBe(0);
      expect(getClarifierStatusMetadata('INVALID').progress).toBe(0);
    });
  });
});
