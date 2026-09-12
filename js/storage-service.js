/**
 * StorageService — ES module version for testing.
 * The same logic is mirrored in js/app.js as a plain object for browser (file://) use.
 *
 * Requirements: 1.7, 7.1, 7.2, 7.3, 10.1, 10.2, 10.3
 */

export const StorageService = {
  /**
   * Named keys used to read/write from localStorage.
   */
  KEYS: {
    TASKS: 'dashboard_tasks',
    LINKS: 'dashboard_links',
  },

  /**
   * Checks whether localStorage is accessible in the current environment.
   * Writes and reads a sentinel value so that SecurityError (Safari private browsing)
   * and any other access failure are caught.
   *
   * @returns {boolean}
   */
  isAvailable() {
    const SENTINEL_KEY = '__dashboard_storage_test__';
    try {
      localStorage.setItem(SENTINEL_KEY, '1');
      const readBack = localStorage.getItem(SENTINEL_KEY);
      localStorage.removeItem(SENTINEL_KEY);
      return readBack === '1';
    } catch {
      return false;
    }
  },

  /**
   * Loads and JSON-parses a value from localStorage.
   * Returns null on any failure: missing key, invalid JSON, or inaccessible storage.
   *
   * @param {string} key
   * @returns {any|null}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * JSON-serialises `value` and writes it to localStorage under `key`.
   * Returns true on success, false if the storage quota is exceeded or any other
   * error occurs.
   *
   * @param {string} key
   * @param {any} value
   * @returns {boolean}
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      // QuotaExceededError (and its legacy alias) as well as any other write failure
      return false;
    }
  },
};
