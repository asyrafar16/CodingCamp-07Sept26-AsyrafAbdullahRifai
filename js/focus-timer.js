/**
 * focus-timer.js — ES module
 *
 * Pure formatting function for the FocusTimer.
 * Exported here so Vitest can import and test it in isolation.
 * The runtime copy lives inside FocusTimer in js/app.js.
 *
 * Requirements: 3.3
 */

/**
 * Formats a whole-second count as a zero-padded "MM:SS" string.
 * Valid input range: any integer in [0, 1500] (0 s → "00:00", 1500 s → "25:00").
 *
 * @param {number} seconds - Elapsed or remaining seconds (integer ≥ 0)
 * @returns {string} e.g. "25:00", "01:30", "00:00"
 */
export function formatTimer(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
