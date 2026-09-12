/**
 * Tests for StorageService
 *
 * Smoke / interface tests live here (task 2.1).
 * Property and unit tests are added in tasks 2.2 – 2.4.
 */

import { StorageService } from '../js/storage-service.js';
import * as fc from 'fast-check';

describe('StorageService — interface', () => {
  it('exposes the expected methods', () => {
    expect(typeof StorageService.isAvailable).toBe('function');
    expect(typeof StorageService.load).toBe('function');
    expect(typeof StorageService.save).toBe('function');
  });

  it('exposes the correct KEYS constants', () => {
    expect(StorageService.KEYS.TASKS).toBe('dashboard_tasks');
    expect(StorageService.KEYS.LINKS).toBe('dashboard_links');
  });
});

// Task 2.4 — Unit tests for StorageService
// Requirements: 1.7, 7.3, 10.3
describe('StorageService — unit tests', () => {
  afterEach(() => vi.restoreAllMocks());

  // isAvailable()
  describe('isAvailable()', () => {
    it('returns false when localStorage.setItem throws a SecurityError', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(StorageService.isAvailable()).toBe(false);
    });

    it('returns false when localStorage.setItem throws a DOMException', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });
      expect(StorageService.isAvailable()).toBe(false);
    });

    it('returns true when localStorage is accessible', () => {
      // jsdom provides a functional localStorage — no mock needed
      expect(StorageService.isAvailable()).toBe(true);
    });
  });

  // load()
  describe('load()', () => {
    it('returns null for a missing key', () => {
      localStorage.clear();
      expect(StorageService.load('non_existent_key')).toBeNull();
    });

    it('returns null for invalid JSON stored under a key', () => {
      localStorage.setItem('bad_json_key', '{this is not valid JSON}');
      expect(StorageService.load('bad_json_key')).toBeNull();
    });

    it('returns null when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(StorageService.load('any_key')).toBeNull();
    });

    it('returns the parsed value (non-array) for a valid JSON string', () => {
      localStorage.setItem('string_key', JSON.stringify('hello'));
      expect(StorageService.load('string_key')).toBe('hello');
    });

    it('returns null when the raw value is null (missing key)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      expect(StorageService.load('any_key')).toBeNull();
    });
  });

  // save()
  describe('save()', () => {
    it('returns false on QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      expect(StorageService.save('some_key', [1, 2, 3])).toBe(false);
    });

    it('returns true and persists data on a successful save', () => {
      const data = [{ id: '1', description: 'Test task', completed: false }];
      const result = StorageService.save(StorageService.KEYS.TASKS, data);
      expect(result).toBe(true);
      expect(JSON.parse(localStorage.getItem(StorageService.KEYS.TASKS))).toEqual(data);
    });

    it('returns false when setItem throws any error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Unknown write error');
      });
      expect(StorageService.save('some_key', { foo: 'bar' })).toBe(false);
    });
  });
});

// Feature: todo-life-dashboard, Property 13: Task persistence round-trip
describe('StorageService — Property 13: Task persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('load(KEYS.TASKS) deeply equals the saved array for any valid task array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            description: fc.string({ minLength: 1 }),
            completed: fc.boolean(),
          })
        ),
        (tasks) => {
          StorageService.save(StorageService.KEYS.TASKS, tasks);
          const loaded = StorageService.load(StorageService.KEYS.TASKS);
          expect(loaded).toEqual(tasks);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: todo-life-dashboard, Property 17: Link persistence round-trip
describe('StorageService — Property 17: Link persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save then load returns a deeply equal link array (min 100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            label: fc.string({ minLength: 1 }),
            url: fc.webUrl(),
          })
        ),
        (links) => {
          StorageService.save(StorageService.KEYS.LINKS, links);
          const loaded = StorageService.load(StorageService.KEYS.LINKS);
          expect(loaded).toEqual(links);
        }
      ),
      { numRuns: 100 }
    );
  });
});
