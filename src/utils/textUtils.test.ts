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
import { countWords } from './textUtils';

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
});
