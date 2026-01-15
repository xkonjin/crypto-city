/**
 * Shared formatting utilities
 * Consolidates duplicate formatNumber/formatTime functions across the codebase
 */

/**
 * Format a number with K/M/B suffixes for display
 * @param num The number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M", "1.0B")
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';
  if (isNaN(num) || !isFinite(num)) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e9) {
    return sign + (absNum / 1e9).toFixed(1) + 'B';
  }
  if (absNum >= 1e6) {
    return sign + (absNum / 1e6).toFixed(1) + 'M';
  }
  if (absNum >= 1e3) {
    return sign + (absNum / 1e3).toFixed(1) + 'K';
  }
  return sign + Math.round(absNum).toString();
}

/**
 * Format a number as currency with $ prefix
 * @param num The number to format
 * @returns Formatted string (e.g., "$1.5K", "$2.3M")
 */
export function formatCurrency(num: number): string {
  return '$' + formatNumber(num);
}

/**
 * Format a number with thousands separators
 * @param num The number to format  
 * @returns Formatted string with commas (e.g., "1,234,567")
 */
export function formatWithCommas(num: number): string {
  return num.toLocaleString();
}

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format seconds as MM:SS or HH:MM:SS
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a game time remaining (for disasters, events, etc.)
 * @param endTick End tick number
 * @param currentTick Current tick number
 * @param ticksPerDay Ticks per game day (default 24)
 * @returns Formatted time remaining string
 */
export function formatGameTimeRemaining(
  endTick: number, 
  currentTick: number, 
  ticksPerDay: number = 24
): string {
  const ticksRemaining = Math.max(0, endTick - currentTick);
  const daysRemaining = ticksRemaining / ticksPerDay;
  
  if (daysRemaining >= 1) {
    return `${daysRemaining.toFixed(1)} days`;
  }
  const hoursRemaining = (daysRemaining * 24);
  return `${hoursRemaining.toFixed(0)} hours`;
}
