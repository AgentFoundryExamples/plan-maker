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
