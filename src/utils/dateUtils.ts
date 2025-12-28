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
 * Date and time utility functions for formatting and display
 */

/**
 * Format a timestamp string into a localized, human-readable format
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string, or 'N/A' if timestamp is invalid
 */
export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
