/**
 * Shared, hydration-safe date formatters.
 * Next.js SSR executes on a server with an unknown or en-US locale, while client
 * browsers run with the user's local locale (e.g., en-GB or en-IN).
 * Passing explicit locale 'en-US' (or 'en-GB') prevents SSR/hydration text mismatches.
 */

export function formatDateShort(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateMonthYear(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
