/**
 * greeting-widget.js — ES module
 *
 * Pure formatting functions for the GreetingWidget.
 * Exported here so Vitest can import and test them in isolation.
 * The runtime copy lives inside GreetingWidget in js/app.js.
 *
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6
 */

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Formats a Date as a zero-padded 24-hour "HH:MM" string.
 * Requirement 2.1
 * @param {Date} date
 * @returns {string} e.g. "09:05" or "23:59"
 */
export function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats a Date as a human-readable date string with NO leading zero on the day.
 * Pattern: "Weekday, D Month YYYY"  e.g. "Monday, 7 September 2026"
 * Requirement 2.3
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const weekday = WEEKDAYS[date.getDay()];
  const day     = date.getDate();          // no leading zero by design
  const month   = MONTHS[date.getMonth()];
  const year    = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Returns a time-of-day greeting based on the hour component of the given Date.
 *   Hour  5–11  → "Good Morning"
 *   Hour 12–17  → "Good Afternoon"
 *   Hour  0–4 and 18–23 → "Good Evening"
 * Requirements: 2.4, 2.5, 2.6
 * @param {Date} date
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"}
 */
export function getGreeting(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  return 'Good Evening';
}
