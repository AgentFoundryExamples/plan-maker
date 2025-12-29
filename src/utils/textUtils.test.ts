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
import { countWords, truncateJobId } from './textUtils';

describe('textUtils', () => {
  describe('countWords', () => {
    it('counts words in a simple sentence', () => {
      expect(countWords('This is a test')).toBe(4);
    });

    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('returns 0 for string with only whitespace', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\t  ')).toBe(0);
    });

    it('handles multiple spaces between words', () => {
      expect(countWords('one  two   three')).toBe(3);
    });

    it('handles leading and trailing whitespace', () => {
      expect(countWords('  hello world  ')).toBe(2);
    });

    it('handles newlines and tabs', () => {
      expect(countWords('hello\nworld\ttest')).toBe(3);
    });

    it('counts single word', () => {
      expect(countWords('word')).toBe(1);
    });

    it('handles long text with many words', () => {
      const text = 'This is a longer text with many words to count and verify the function works correctly';
      expect(countWords(text)).toBe(16);
    });

    it('handles text with punctuation', () => {
      expect(countWords('Hello, world! How are you?')).toBe(5);
    });

    it('handles text with special characters', () => {
      expect(countWords('user@example.com test@test.com')).toBe(2);
    });
  });

  describe('truncateJobId', () => {
    it('truncates long job IDs to default length', () => {
      const jobId = 'abc123def456ghi789';
      expect(truncateJobId(jobId)).toBe('abc123de...');
    });

    it('returns full job ID if shorter than truncate length', () => {
      const jobId = 'short';
      expect(truncateJobId(jobId)).toBe('short');
    });

    it('returns full job ID if equal to truncate length', () => {
      const jobId = 'exactly8';
      expect(truncateJobId(jobId, 8)).toBe('exactly8');
    });

    it('respects custom length parameter', () => {
      const jobId = 'abc123def456';
      expect(truncateJobId(jobId, 6)).toBe('abc123...');
    });

    it('respects custom suffix parameter', () => {
      const jobId = 'abc123def456';
      expect(truncateJobId(jobId, 6, '…')).toBe('abc123…');
    });

    it('handles empty string', () => {
      expect(truncateJobId('')).toBe('');
    });

    it('handles very long UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(truncateJobId(uuid)).toBe('550e8400...');
    });
  });
});
