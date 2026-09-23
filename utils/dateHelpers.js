/**
 * Returns a short human-readable relative time string for a given timestamp.
 * Examples: 'Just now', '5m ago', '2h ago', '3d ago'.
 */
export function getTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Formats a date value into a locale date/time string.
 * Returns 'Date unavailable' for missing or invalid values.
 */
export function formatDateLabel(dateValue) {
  if (!dateValue) return 'Date unavailable';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString();
}
