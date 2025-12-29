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
 * Clarifier Storage Utility
 * 
 * Manages persistent storage of clarifier job IDs associated with plan jobs.
 * Provides safe localStorage access with automatic fallback to in-memory storage
 * when localStorage is unavailable (e.g., private browsing mode).
 * 
 * Storage Schema:
 * - Key: `plan-maker_clarifier_${planId}`
 * - Value: JSON object with { jobId: string, timestamp: number }
 * 
 * Features:
 * - Automatic expiration (7 days default)
 * - In-memory fallback when localStorage unavailable
 * - Safe error handling
 * - Type-safe API
 */

import { isLocalStorageAvailable } from './localStorage';

const STORAGE_PREFIX = 'plan-maker_clarifier';
const CLARIFIER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ClarifierJobMetadata {
  jobId: string;
  timestamp: number;
}

// In-memory fallback storage
const memoryStore = new Map<string, ClarifierJobMetadata>();

/**
 * Get the stored clarifier job ID for a plan.
 * Returns null if:
 * - No job ID is stored
 * - The stored data has expired
 * - The stored data is invalid
 * 
 * @param planId - The plan ID to look up
 * @returns The clarifier job metadata or null
 */
export function getClarifierJobId(planId: string): ClarifierJobMetadata | null {
  if (!planId) return null;

  // Try localStorage first
  if (isLocalStorageAvailable()) {
    try {
      const key = `${STORAGE_PREFIX}_${planId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;

      const metadata: ClarifierJobMetadata = JSON.parse(stored);
      
      // Validate structure
      if (typeof metadata.jobId !== 'string' || typeof metadata.timestamp !== 'number') {
        localStorage.removeItem(key);
        return null;
      }

      // Check expiration
      const now = Date.now();
      if (now - metadata.timestamp > CLARIFIER_EXPIRY_MS) {
        localStorage.removeItem(key);
        return null;
      }

      return metadata;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn(`Failed to get clarifier job ID for plan "${planId}":`, e);
      }
      return null;
    }
  }

  // Fallback to memory store
  const metadata = memoryStore.get(planId);
  if (!metadata) return null;

  // Check expiration
  const now = Date.now();
  if (now - metadata.timestamp > CLARIFIER_EXPIRY_MS) {
    memoryStore.delete(planId);
    return null;
  }

  return metadata;
}

/**
 * Store a clarifier job ID associated with a plan.
 * Uses localStorage when available, falls back to in-memory storage.
 * 
 * @param planId - The plan ID
 * @param jobId - The clarifier job ID to store
 */
export function setClarifierJobId(planId: string, jobId: string): void {
  if (!planId || !jobId) return;

  const metadata: ClarifierJobMetadata = {
    jobId,
    timestamp: Date.now(),
  };

  // Try localStorage first
  if (isLocalStorageAvailable()) {
    try {
      const key = `${STORAGE_PREFIX}_${planId}`;
      localStorage.setItem(key, JSON.stringify(metadata));
      return;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn(`Failed to save clarifier job ID for plan "${planId}":`, e);
      }
      // Fall through to memory store
    }
  }

  // Fallback to memory store
  memoryStore.set(planId, metadata);
}

/**
 * Remove the stored clarifier job ID for a plan.
 * 
 * @param planId - The plan ID
 */
export function removeClarifierJobId(planId: string): void {
  if (!planId) return;

  // Try localStorage
  if (isLocalStorageAvailable()) {
    try {
      const key = `${STORAGE_PREFIX}_${planId}`;
      localStorage.removeItem(key);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn(`Failed to remove clarifier job ID for plan "${planId}":`, e);
      }
    }
  }

  // Also clear from memory store
  memoryStore.delete(planId);
}

/**
 * Clear all stored clarifier job IDs.
 * Useful for cleanup or testing.
 */
export function clearAllClarifierJobIds(): void {
  // Clear localStorage entries
  if (isLocalStorageAvailable()) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to clear clarifier job IDs from localStorage:', e);
      }
    }
  }

  // Clear memory store
  memoryStore.clear();
}
