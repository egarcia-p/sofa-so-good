// src/utils/date.js
// Safe date parsing and formatting utilities to prevent timezone rollback issues

/**
 * Safely parses a date string, timestamp, or Date object into a Date in local time.
 * If the input is a date-only string (e.g., 'YYYY-MM-DD'), it is parsed using the year,
 * month, and day components directly so it is never offset by UTC timezone shifts.
 *
 * @param {string | number | Date | { toDate: Function } | null} dateInput
 * @returns {Date | null}
 */
export function parseDateString(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput.toDate === 'function') {
    const d = dateInput.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Match 'YYYY-MM-DD' format specifically
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a date safely using Intl.DateTimeFormat in en-US.
 *
 * @param {string | number | Date | { toDate: Function } | null} dateInput
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string | null}
 */
export function formatDate(dateInput, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = parseDateString(dateInput);
  if (!d) return null;
  return d.toLocaleDateString('en-US', options);
}

/**
 * Standard air date formatter: e.g. "Aug 20, 2026"
 */
export function formatAirDate(dateInput) {
  return formatDate(dateInput, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Next episode air date formatter with weekday: e.g. "Thu, Aug 20"
 */
export function formatNextAirDate(dateInput) {
  return formatDate(dateInput, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Safely extracts the 4-digit release year from a date string without timezone shifting.
 *
 * @param {string | number | Date | { toDate: Function } | null} dateInput
 * @returns {number | null}
 */
export function getReleaseYear(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const match = dateInput.trim().match(/^(\d{4})/);
    if (match) return Number(match[1]);
  }
  const d = parseDateString(dateInput);
  return d ? d.getFullYear() : null;
}
