// Tests for GreetingWidget pure functions
// Property tests implemented in tasks 4.2, 4.3, 4.4

import { formatTime, formatDate, getGreeting } from '../js/greeting-widget.js';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// formatTime — Requirement 2.1
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('zero-pads hours below 10', () => {
    expect(formatTime(new Date(2026, 8, 7, 9, 5))).toBe('09:05');
  });

  it('zero-pads minutes below 10', () => {
    expect(formatTime(new Date(2026, 8, 7, 14, 3))).toBe('14:03');
  });

  it('handles midnight (00:00)', () => {
    expect(formatTime(new Date(2026, 8, 7, 0, 0))).toBe('00:00');
  });

  it('handles end of day (23:59)', () => {
    expect(formatTime(new Date(2026, 8, 7, 23, 59))).toBe('23:59');
  });

  it('handles noon (12:00)', () => {
    expect(formatTime(new Date(2026, 8, 7, 12, 0))).toBe('12:00');
  });

  // Feature: todo-life-dashboard, Property 1: Time formatting is always valid HH:MM
  it('Property 1: result always matches HH:MM with valid hour and minute ranges', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = formatTime(date);
        // Must match the pattern DD:DD
        expect(result).toMatch(/^\d{2}:\d{2}$/);
        const [hh, mm] = result.split(':').map(Number);
        // HH must be in [00, 23]
        expect(hh).toBeGreaterThanOrEqual(0);
        expect(hh).toBeLessThanOrEqual(23);
        // MM must be in [00, 59]
        expect(mm).toBeGreaterThanOrEqual(0);
        expect(mm).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// formatDate — Requirement 2.3
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats a known date correctly', () => {
    // 7 September 2026 is a Monday
    expect(formatDate(new Date(2026, 8, 7))).toBe('Monday, 7 September 2026');
  });

  it('does NOT add a leading zero to single-digit days', () => {
    // 3 January 2026 is a Saturday
    expect(formatDate(new Date(2026, 0, 3))).toBe('Saturday, 3 January 2026');
  });

  it('formats two-digit days correctly', () => {
    // 25 December 2026 is a Friday
    expect(formatDate(new Date(2026, 11, 25))).toBe('Friday, 25 December 2026');
  });

  it('includes the full weekday name', () => {
    const result = formatDate(new Date(2026, 8, 7));
    expect(result).toMatch(/^Monday/);
  });

  it('includes a four-digit year', () => {
    expect(formatDate(new Date(2026, 0, 1))).toMatch(/2026$/);
  });

  // Feature: todo-life-dashboard, Property 2: Date formatting always contains required components
  it('Property 2: Date formatting always contains required components', () => {
    const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Constrain to years 1000–9999 so we always get a 4-digit year in the output
    const minDate = new Date(1000, 0, 1);
    const maxDate = new Date(9999, 11, 31);

    fc.assert(
      fc.property(fc.date({ min: minDate, max: maxDate }), (date) => {
        const result = formatDate(date);

        // Must contain the full weekday name
        const expectedWeekday = WEEKDAYS[date.getDay()];
        expect(result).toContain(expectedWeekday);

        // Must contain the numeric day WITHOUT a leading zero
        const expectedDay = String(date.getDate()); // no padStart — by design
        // Day should appear as a standalone number (not part of year or run-on digits)
        expect(result).toMatch(new RegExp(`(?<![\\d])${expectedDay}(?![\\d])`));

        // Must contain the full month name
        const expectedMonth = MONTHS[date.getMonth()];
        expect(result).toContain(expectedMonth);

        // Must contain the four-digit year
        const expectedYear = String(date.getFullYear());
        expect(result).toContain(expectedYear);

        // Overall pattern: "Weekday, D Month YYYY" (day 1–31, 4-digit year)
        expect(result).toMatch(/^[A-Z][a-z]+, \d{1,2} [A-Z][a-z]+ \d{4}$/);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// getGreeting — Requirements 2.4, 2.5, 2.6
// ---------------------------------------------------------------------------
describe('getGreeting', () => {
  // Morning boundary: hours 5–11
  it('returns "Good Morning" at 05:00', () => {
    expect(getGreeting(new Date(2026, 8, 7, 5, 0))).toBe('Good Morning');
  });

  it('returns "Good Morning" at 11:59', () => {
    expect(getGreeting(new Date(2026, 8, 7, 11, 59))).toBe('Good Morning');
  });

  // Afternoon boundary: hours 12–17
  it('returns "Good Afternoon" at 12:00', () => {
    expect(getGreeting(new Date(2026, 8, 7, 12, 0))).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" at 17:59', () => {
    expect(getGreeting(new Date(2026, 8, 7, 17, 59))).toBe('Good Afternoon');
  });

  // Evening: hours 18–23 and 0–4
  it('returns "Good Evening" at 18:00', () => {
    expect(getGreeting(new Date(2026, 8, 7, 18, 0))).toBe('Good Evening');
  });

  it('returns "Good Evening" at 23:59', () => {
    expect(getGreeting(new Date(2026, 8, 7, 23, 59))).toBe('Good Evening');
  });

  it('returns "Good Evening" at midnight (00:00)', () => {
    expect(getGreeting(new Date(2026, 8, 7, 0, 0))).toBe('Good Evening');
  });

  it('returns "Good Evening" at 04:59', () => {
    expect(getGreeting(new Date(2026, 8, 7, 4, 59))).toBe('Good Evening');
  });

  // Boundary edge: 4 → Evening, 5 → Morning
  it('transitions from Evening to Morning exactly at hour 5', () => {
    expect(getGreeting(new Date(2026, 8, 7, 4, 0))).toBe('Good Evening');
    expect(getGreeting(new Date(2026, 8, 7, 5, 0))).toBe('Good Morning');
  });

  // Feature: todo-life-dashboard, Property 3: Greeting is correct for any time of day
  it('Property 3: Greeting is correct for any time of day', () => {
    // Validates: Requirements 2.4, 2.5, 2.6
    fc.assert(
      fc.property(fc.date(), (date) => {
        const hour = date.getHours();
        const greeting = getGreeting(date);

        if (hour >= 5 && hour <= 11) {
          return greeting === 'Good Morning';
        }
        if (hour >= 12 && hour <= 17) {
          return greeting === 'Good Afternoon';
        }
        // hours 0–4 and 18–23
        return greeting === 'Good Evening';
      }),
      { numRuns: 100 }
    );
  });
});
