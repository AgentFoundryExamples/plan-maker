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
  
  // Split by whitespace and filter empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
