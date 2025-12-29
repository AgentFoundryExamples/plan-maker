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
 * Text analysis utilities for form inputs.
 */

/**
 * Count words in a text string.
 * Words are separated by whitespace. Empty strings return 0.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Split by whitespace - no need to filter as trimmed non-empty text won't produce empty strings
  return text.trim().split(/\s+/).length;
}

/**
 * Truncate a job ID for display purposes.
 * Useful for showing shortened IDs in breadcrumbs or UI elements.
 * 
 * @param jobId - The full job ID to truncate
 * @param length - Number of characters to show (default: 8)
 * @param suffix - Suffix to append (default: '...')
 * @returns The truncated job ID
 */
export function truncateJobId(jobId: string, length: number = 8, suffix: string = '...'): string {
  if (!jobId || jobId.length <= length) {
    return jobId;
  }
  if (length <= 0) {
    return '';
  }
  
  return jobId.slice(0, length) + suffix;
}

/**
 * Pluralizes "question" based on count
 * @param count - Number of questions
 * @param suffix - Optional suffix to add (e.g., " remaining")
 * @returns Formatted string with proper pluralization
 * 
 * @example
 * getQuestionText(1) // "question"
 * getQuestionText(2) // "questions"
 * getQuestionText(1, " remaining") // "question remaining"
 * getQuestionText(5, " remaining") // "questions remaining"
 */
export function getQuestionText(count: number, suffix = ''): string {
  return `question${count !== 1 ? 's' : ''}${suffix}`;
}

/**
 * Formats a count with question text and optional suffix
 * @param count - Number of questions
 * @param suffix - Optional suffix to add
 * @returns Formatted string like "5 questions remaining"
 * 
 * @example
 * formatQuestionCount(1) // "1 question"
 * formatQuestionCount(5, " remaining") // "5 questions remaining"
 */
export function formatQuestionCount(count: number, suffix = ''): string {
  return `${count} ${getQuestionText(count, suffix)}`;
}

