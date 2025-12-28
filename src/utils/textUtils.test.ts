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
