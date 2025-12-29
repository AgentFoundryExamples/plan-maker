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
 * Shared validation utilities for API clients
 */

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @throws Error if UUID format is invalid
 */
export function validateUUID(uuid: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Invalid UUID format: "${uuid}". Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
  }
}

/**
 * Validate limit parameter for list operations
 * @param limit - Limit value to validate
 * @throws Error if limit is outside acceptable range
 */
export function validateLimit(limit: number): void {
  if (!Number.isFinite(limit) || limit < 1 || limit > 1000) {
    throw new Error(`Invalid limit: ${limit}. Limit must be between 1 and 1000.`);
  }
}
