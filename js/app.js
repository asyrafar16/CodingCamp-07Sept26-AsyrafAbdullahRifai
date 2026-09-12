/* To-Do Life Dashboard — app.js
 *
 * Structure:
 *   - StorageService
 *   - ErrorBanner        (task 3)
 *   - GreetingWidget     (task 4)
 *   - FocusTimer         (task 5)
 *   - TaskManager        (task 7)
 *   - QuickLinksPanel    (task 8)
 *   - init()             (task 10)
 *
 * NOTE: Runs on file:// — no build step, no ES module imports.
 * The testable pure logic for each module is mirrored in a corresponding
 * js/<module>.js ES-module file that Vitest imports directly.
 */

// ---------------------------------------------------------------------------
// StorageService
// Mirrors js/storage-service.js — kept in sync manually.
// Requirements: 1.7, 7.1, 7.2, 7.3, 10.1, 10.2, 10.3
// ---------------------------------------------------------------------------
const StorageService = {
  KEYS: {
    TASKS: 'dashboard_tasks',
    LINKS: 'dashboard_links',
  },

  /**
   * Returns true when localStorage is readable and writable.
   * Catches SecurityError (Safari private browsing) and any other access failure.
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
   * Serialises `value` to JSON and writes it to localStorage under `key`.
   * Returns true on success, false on QuotaExceededError or any other write failure.
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

// ---------------------------------------------------------------------------
// ErrorBanner
// Singleton that accumulates human-readable error messages in a persistent
// <div id="error-banner"> element. Hidden when empty, visible when non-empty.
// Requirements: 1.7, 4.6, 7.3, 10.3
// ---------------------------------------------------------------------------
const ErrorBanner = (function () {
  /** Lazily resolved reference to the #error-banner element. */
  function _getEl() {
    return document.getElementById('error-banner');
  }

  return {
    /**
     * Appends a <p> containing `message` to the banner and makes the banner
     * visible (removes the `hidden` attribute).
     * @param {string} message
     */
    show(message) {
      const banner = _getEl();
      if (!banner) return;
      const p = document.createElement('p');
      p.textContent = message;
      banner.appendChild(p);
      banner.removeAttribute('hidden');
    },

    /**
     * Removes all child content from the banner and hides it (sets `hidden`).
     */
    clear() {
      const banner = _getEl();
      if (!banner) return;
      banner.innerHTML = '';
      banner.setAttribute('hidden', '');
    },
  };
})();

// ---------------------------------------------------------------------------
// GreetingWidget
 // Displays current time, date, and time-aware greeting.
 // Pure formatting functions are mirrored in js/greeting-widget.js for tests.
 // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
// ---------------------------------------------------------------------------
const GreetingWidget = (function () {
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
   * @returns {string}
   */
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * Formats a Date as "Weekday, D Month YYYY" with no leading zero on day.
   * Requirement 2.3
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const weekday = WEEKDAYS[date.getDay()];
    const day     = date.getDate();
    const month   = MONTHS[date.getMonth()];
    const year    = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  /**
   * Returns a time-of-day greeting for the given Date.
   *   Hour  5–11  → "Good Morning"
   *   Hour 12–17  → "Good Afternoon"
   *   Hour  0–4 and 18–23 → "Good Evening"
   * Requirements: 2.4, 2.5, 2.6
   * @param {Date} date
   * @returns {string}
   */
  function getGreeting(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /** Updates the three greeting DOM elements to reflect `now`. */
  function _render(now) {
    const timeEl     = document.getElementById('greeting-time');
    const dateEl     = document.getElementById('greeting-date');
    const messageEl  = document.getElementById('greeting-message');
    if (timeEl)    timeEl.textContent    = formatTime(now);
    if (dateEl)    dateEl.textContent    = formatDate(now);
    if (messageEl) messageEl.textContent = getGreeting(now);
  }

  return {
    /**
     * Renders the greeting immediately, then refreshes every 60 seconds.
     * Requirement 2.7
     */
    init() {
      _render(new Date());
      setInterval(() => _render(new Date()), 60_000);
    },
  };
})();

// ---------------------------------------------------------------------------
// FocusTimer
// 25-minute Pomodoro countdown timer.
// Pure formatting function is mirrored in js/focus-timer.js for tests.
// Requirements: 3.1–3.10
// ---------------------------------------------------------------------------
const FocusTimer = (function () {
  // --------------- pure helper ------------------------------------------- //

  /**
   * Formats a whole-second count as a zero-padded "MM:SS" string.
   * Valid input range: [0, 1500]  (1500 s → "25:00", 0 s → "00:00")
   * Requirement 3.3
   * @param {number} seconds
   * @returns {string}
   */
  function formatTimer(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // --------------- audio alert ------------------------------------------- //

  /**
   * Emits a 440 Hz sine-wave beep for ~1.5 s using the Web Audio API.
   * Fails silently when AudioContext is unavailable.
   * Requirements: 3.8
   */
  function playEndAlert() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 440;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch {
      // Audio not available — fail silently
    }
  }

  // --------------- in-memory state --------------------------------------- //

  /** @type {number} Seconds remaining on the countdown. Range: 0–1500. */
  let secondsRemaining = 1500;

  /** @type {boolean} Whether the interval is currently ticking. */
  let isRunning = false;

  /** @type {number|null} Return value of setInterval while running. */
  let intervalId = null;

  /** @type {boolean} Whether the end-of-session indicator is visible. */
  let sessionEndDisplayed = false;

  // --------------- DOM helpers ------------------------------------------- //

  function _getDisplay()     { return document.getElementById('timer-display'); }
  function _getEndIndicator() { return document.getElementById('timer-end-indicator'); }
  function _getStartBtn()    { return document.getElementById('timer-start'); }
  function _getStopBtn()     { return document.getElementById('timer-stop'); }
  function _getResetBtn()    { return document.getElementById('timer-reset'); }

  /** Writes the current secondsRemaining into the display element. */
  function _render() {
    const el = _getDisplay();
    if (el) el.textContent = formatTimer(secondsRemaining);
  }

  /** Shows or hides the end-of-session indicator. */
  function _setEndIndicator(visible) {
    const el = _getEndIndicator();
    if (!el) return;
    if (visible) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
    sessionEndDisplayed = visible;
  }

  // --------------- state-machine operations ------------------------------ //

  /**
   * Clears the running interval and marks the timer as not running.
   * Does NOT reset secondsRemaining.
   */
  function _clearInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  }

  /**
   * Called on every interval tick: decrements counter, updates display,
   * and handles session-end when counter reaches 0.
   * Requirements: 3.7, 3.8, 3.9
   */
  function _tick() {
    secondsRemaining -= 1;
    _render();

    if (secondsRemaining <= 0) {
      secondsRemaining = 0;
      _clearInterval();
      _setEndIndicator(true);
      playEndAlert();
    }
  }

  // --------------- public interface -------------------------------------- //

  return {
    formatTimer, // exposed so js/focus-timer.js tests can import from app for smoke checks

    /**
     * Sets initial state (25:00), renders the display, and binds the three
     * control buttons.
     * Requirements: 3.1, 3.2
     */
    init() {
      secondsRemaining = 1500;
      isRunning = false;
      intervalId = null;
      sessionEndDisplayed = false;

      _render();
      _setEndIndicator(false);

      const startBtn = _getStartBtn();
      const stopBtn  = _getStopBtn();
      const resetBtn = _getResetBtn();

      if (startBtn) startBtn.addEventListener('click', () => FocusTimer.start());
      if (stopBtn)  stopBtn.addEventListener('click',  () => FocusTimer.stop());
      if (resetBtn) resetBtn.addEventListener('click', () => FocusTimer.reset());
    },

    /**
     * Starts a 1-second countdown from the current secondsRemaining.
     * No-op when already running (Req 3.10).
     * Resumes from retained time when paused (Req 3.5).
     * Requirements: 3.2, 3.5, 3.10
     */
    start() {
      if (isRunning) return; // no-op — Req 3.10
      if (secondsRemaining <= 0) return; // session already ended
      isRunning = true;
      intervalId = setInterval(_tick, 1000);
    },

    /**
     * Pauses the countdown and retains secondsRemaining.
     * Requirements: 3.4
     */
    stop() {
      _clearInterval();
    },

    /**
     * Stops the countdown, resets secondsRemaining to 1500, renders 25:00,
     * and removes the end-of-session indicator.
     * Requirements: 3.6, 3.9
     */
    reset() {
      _clearInterval();
      secondsRemaining = 1500;
      _render();
      _setEndIndicator(false);
    },

    // Expose internal state getters for unit-testing purposes (task 5.5).
    _getState() {
      return { secondsRemaining, isRunning, intervalId, sessionEndDisplayed };
    },
  };
})();

// ---------------------------------------------------------------------------
// TaskManager
// Full CRUD to-do list with localStorage persistence.
// Pure logic is mirrored in js/task-manager.js for tests.
// Requirements: 4.1–4.6, 5.1–5.8, 6.1–6.5, 7.1–7.3
// ---------------------------------------------------------------------------
const TaskManager = (function () {

  // --------------- task validation --------------------------------------- //

  /**
   * Returns true when `item` is a well-formed Task object.
   * @param {unknown} item
   * @returns {boolean}
   */
  function _isValidTask(item) {
    return (
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.description === 'string' &&
      item.description.length > 0 &&
      typeof item.completed === 'boolean'
    );
  }

  // --------------- in-memory state --------------------------------------- //

  /** @type {Array<{ id: string, description: string, completed: boolean }>} */
  let _tasks = [];

  /**
   * Id of the task currently in edit mode, or null.
   * Enforces single-edit-mode (Req 5.8).
   * @type {string | null}
   */
  let _editingId = null;

  /** Reference to the StorageService passed into init(). */
  let _storage = null;

  // --------------- DOM helpers ------------------------------------------- //

  function _getListEl() { return document.getElementById('task-list'); }

  // --------------- rendering --------------------------------------------- //

  /**
   * Full re-render of <ul id="task-list"> from current _tasks state.
   */
  function _render() {
    const listEl = _getListEl();
    if (!listEl) return;

    listEl.innerHTML = '';

    _tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task__item' + (task.completed ? ' task--complete' : '');
      li.dataset.id = task.id;

      if (_editingId === task.id) {
        // ---- Edit mode ----
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'input task__edit-input';
        editInput.value = task.description;
        editInput.maxLength = 256;
        editInput.setAttribute('aria-label', 'Edit task description');

        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-msg task__edit-error';
        errorMsg.setAttribute('hidden', '');

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn--primary btn-save';
        saveBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn--secondary btn-cancel';
        cancelBtn.textContent = 'Cancel';

        li.appendChild(editInput);
        li.appendChild(errorMsg);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);

        // Move focus to input immediately (Req 5.2)
        Promise.resolve().then(() => editInput.focus());
      } else {
        // ---- Display mode ----
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task__checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute(
          'aria-label',
          `Mark "${task.description}" as ${task.completed ? 'incomplete' : 'complete'}`
        );

        const span = document.createElement('span');
        span.className = 'task__description';
        span.textContent = task.description;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn--secondary btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
        if (_editingId !== null) editBtn.disabled = true;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn--danger btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
      }

      listEl.appendChild(li);
    });
  }

  // --------------- persistence helper ------------------------------------ //

  function _persist() {
    if (_storage) _storage.save(_storage.KEYS.TASKS, _tasks);
  }

  // --------------- edit helpers ------------------------------------------ //

  /**
   * Attempts to confirm an edit.
   * Returns true on success, false when validation fails.
   * @param {string} id
   * @param {string} newValue
   * @param {HTMLElement|null} editErrorEl
   * @returns {boolean}
   */
  function _confirmEdit(id, newValue, editErrorEl) {
    const trimmed = newValue.trim();

    if (trimmed.length === 0) {
      // Req 5.5: restore original, exit edit mode
      _editingId = null;
      _render();
      return false;
    }

    if (trimmed.length > 256) {
      // Req 5.6: show inline error, stay in edit mode
      if (editErrorEl) {
        editErrorEl.textContent = 'Task description cannot exceed 256 characters.';
        editErrorEl.removeAttribute('hidden');
      }
      return false;
    }

    const idx = _tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      _tasks[idx].description = trimmed;
      _persist();
    }
    _editingId = null;
    _render();
    return true;
  }

  // --------------- event delegation handler ------------------------------ //

  /**
   * Handles all click and keydown events bubbling up from the task list.
   * @param {Event} event
   */
  function _handleListEvent(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const li = target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;

    if (event.type === 'click') {
      if (target.classList.contains('task__checkbox')) {
        TaskManager.toggleTask(id);
        return;
      }
      if (target.classList.contains('btn-edit')) {
        if (_editingId !== null) return; // Req 5.8
        _editingId = id;
        _render();
        return;
      }
      if (target.classList.contains('btn-delete')) {
        TaskManager.deleteTask(id);
        return;
      }
      if (target.classList.contains('btn-save')) {
        const editInput = li.querySelector('.task__edit-input');
        const editErrorEl = li.querySelector('.task__edit-error');
        if (editInput) _confirmEdit(id, editInput.value, editErrorEl);
        return;
      }
      if (target.classList.contains('btn-cancel')) {
        // Req 5.7
        _editingId = null;
        _render();
        return;
      }
    }

    if (event.type === 'keydown' && target.classList.contains('task__edit-input')) {
      if (event.key === 'Enter') {
        const editErrorEl = li.querySelector('.task__edit-error');
        _confirmEdit(id, target.value, editErrorEl);
      } else if (event.key === 'Escape') {
        // Req 5.7
        _editingId = null;
        _render();
      }
    }
  }

  // --------------- public interface -------------------------------------- //

  return {
    /**
     * Loads tasks from storage, renders the list, binds the add form, and
     * attaches event delegation on the task list.
     * Requirements: 4.1, 4.5, 4.6, 7.2, 7.3
     * @param {typeof StorageService} storage
     */
    init(storage) {
      _storage = storage;
      const raw = storage.load(storage.KEYS.TASKS);

      if (raw === null) {
        // Key absent (first run) — silent empty list
        _tasks = [];
      } else if (!Array.isArray(raw)) {
        // Corrupted data — show error, use empty list (Req 4.6, 7.3)
        _tasks = [];
        ErrorBanner.show('Saved tasks could not be loaded. Starting with an empty list.');
      } else {
        // Drop any element that doesn't match the Task schema (Req 7.3)
        _tasks = raw.filter(_isValidTask);
        if (_tasks.length < raw.length) {
          ErrorBanner.show('Some saved tasks were invalid and could not be loaded.');
        }
      }

      _render();

      // Bind the add-task form — covers both the Add button click and Enter key
      // in the input field because the button is type="submit" inside the form.
      // Requirements: 4.1, 4.2, 4.3
      const formEl  = document.getElementById('task-form');
      const inputEl = document.getElementById('task-input');
      if (formEl) {
        formEl.addEventListener('submit', (event) => {
          event.preventDefault();
          const description = inputEl ? inputEl.value : '';
          const added = TaskManager.addTask(description);
          // Always clear the input after a submission attempt (Req 4.2, 4.3)
          if (inputEl) inputEl.value = '';
          return added;
        });
      }

      // Attach ONE delegated listener pair (not re-bound on re-render)
      const listEl = _getListEl();
      if (listEl) {
        listEl.addEventListener('click', _handleListEvent);
        listEl.addEventListener('keydown', _handleListEvent);
      }
    },

    /**
     * Adds a new task.
     * Trims and rejects empty/whitespace-only descriptions.
     * Requirements: 4.1, 4.2, 4.3
     * @param {string} description
     * @returns {boolean}
     */
    addTask(description) {
      const trimmed = description.trim().slice(0, 200);
      if (trimmed.length === 0) return false;

      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : String(Date.now());

      _tasks.push({ id, description: trimmed, completed: false });
      _persist();
      _render();
      return true;
    },

    /**
     * Updates an existing task's description.
     * Requirements: 5.3, 5.4, 5.5, 5.6
     * @param {string} id
     * @param {string} newDescription
     * @returns {boolean}
     */
    editTask(id, newDescription) {
      const trimmed = newDescription.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.length > 256) return false;

      const idx = _tasks.findIndex((t) => t.id === id);
      if (idx === -1) return false;

      _tasks[idx].description = trimmed;
      _persist();
      _render();
      return true;
    },

    /**
     * Toggles a task's completion status.
     * Requirements: 6.2, 6.3
     * @param {string} id
     */
    toggleTask(id) {
      const idx = _tasks.findIndex((t) => t.id === id);
      if (idx === -1) return;
      _tasks[idx].completed = !_tasks[idx].completed;
      _persist();
      _render();
    },

    /**
     * Deletes a task by id.
     * Requirements: 6.4, 6.5
     * @param {string} id
     */
    deleteTask(id) {
      _tasks = _tasks.filter((t) => t.id !== id);
      _persist();
      _render();
    },

    // Expose internal state for testing purposes.
    _getState() {
      return { tasks: _tasks.slice(), editingId: _editingId };
    },
  };
})();

// ---------------------------------------------------------------------------
// QuickLinksPanel
// Shortcut URL buttons with localStorage persistence.
// Pure logic is mirrored in js/quick-links-panel.js for tests.
// Requirements: 8.1–8.7, 9.1–9.2, 10.1–10.3
// ---------------------------------------------------------------------------
const QuickLinksPanel = (function () {

  // --------------- link validation --------------------------------------- //

  /**
   * Returns true when `link` is a well-formed Link object.
   * @param {unknown} link
   * @returns {boolean}
   */
  function _isValidLink(link) {
    if (!link || typeof link !== 'object' || Array.isArray(link)) return false;
    if (typeof link.id !== 'string' || link.id.trim() === '') return false;
    if (typeof link.label !== 'string' || link.label.trim() === '') return false;
    if (typeof link.url !== 'string') return false;
    return link.url.startsWith('http://') || link.url.startsWith('https://');
  }

  // --------------- in-memory state --------------------------------------- //

  /** @type {Array<{ id: string, label: string, url: string }>} */
  let _links = [];

  /** Reference to the StorageService passed into init(). */
  let _storage = null;

  // --------------- DOM helpers ------------------------------------------- //

  function _getContainerEl()  { return document.getElementById('links-container'); }
  function _getLabelInputEl() { return document.getElementById('link-label-input'); }
  function _getUrlInputEl()   { return document.getElementById('link-url-input'); }
  function _getLabelErrorEl() { return document.getElementById('link-label-error'); }
  function _getUrlErrorEl()   { return document.getElementById('link-url-error'); }

  // --------------- rendering --------------------------------------------- //

  /**
   * Full re-render of #links-container from current _links state.
   * Each link renders as a wrapper div containing a launch button and a
   * delete button — mirrors the ES module render in js/quick-links-panel.js.
   */
  function _render() {
    const container = _getContainerEl();
    if (!container) return;

    container.innerHTML = '';

    _links.forEach(function (link) {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.dataset.id = link.id;

      // Link launch button
      const btn = document.createElement('button');
      btn.className = 'btn link__btn';
      btn.type = 'button';
      btn.textContent = link.label;
      btn.dataset.url = link.url;
      item.appendChild(btn);

      // Delete button
      const del = document.createElement('button');
      del.className = 'btn btn--danger link__delete';
      del.type = 'button';
      del.dataset.id = link.id;
      del.setAttribute('aria-label', `Delete ${link.label}`);
      del.textContent = 'Delete';
      item.appendChild(del);

      container.appendChild(item);
    });
  }

  // --------------- persistence helper ------------------------------------ //

  function _persist() {
    if (_storage) _storage.save(_storage.KEYS.LINKS, _links);
  }

  // --------------- public interface -------------------------------------- //

  return {
    /**
     * Loads links from storage, renders the panel, and attaches event
     * listeners (Add button + delegation on links container).
     * Requirements: 8.6, 10.2, 10.3
     * @param {typeof StorageService} storage
     */
    init(storage) {
      _storage = storage;
      const raw = storage.load(storage.KEYS.LINKS);

      if (raw === null) {
        // Key absent (first run) — silent empty list
        _links = [];
      } else if (!Array.isArray(raw)) {
        // Corrupted data — show error, use empty list (Req 10.3)
        _links = [];
        ErrorBanner.show('Saved links could not be loaded. Starting with an empty list.');
      } else {
        // Drop any element that doesn't match the Link schema (Req 10.3)
        const before = raw.length;
        _links = raw.filter(_isValidLink);
        if (_links.length < before) {
          ErrorBanner.show('Some saved links were invalid and could not be loaded.');
        }
      }

      _render();

      // Bind Add button (form submit wired in task 10 init(); this catches
      // direct button clicks for cases where the form is not present)
      const formEl      = document.getElementById('link-form');
      const labelInputEl = _getLabelInputEl();
      const urlInputEl   = _getUrlInputEl();

      if (formEl) {
        formEl.addEventListener('submit', function (event) {
          event.preventDefault();
          const label = labelInputEl ? labelInputEl.value : '';
          const url   = urlInputEl   ? urlInputEl.value   : '';
          QuickLinksPanel.addLink(label, url);
        });
      }

      // Attach event delegation on the links container for Delete and launch
      const container = _getContainerEl();
      if (container) {
        container.addEventListener('click', function (event) {
          const target = /** @type {HTMLElement} */ (event.target);

          // Delete button
          if (target.classList.contains('link__delete')) {
            const id = target.dataset.id;
            if (id) QuickLinksPanel.deleteLink(id);
            return;
          }

          // Link launch button
          if (target.classList.contains('link__btn')) {
            const url = target.dataset.url;
            if (url) {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        });
      }
    },

    /**
     * Validates inputs, appends a new link, persists, and re-renders.
     * Returns false (and shows inline errors) when validation fails.
     * Requirements: 8.1, 8.2, 8.3, 8.7
     * (Fully implemented in task 8.2 — stub here so delegation from init works)
     * @param {string} rawLabel
     * @param {string} rawUrl
     * @returns {boolean}
     */
    addLink(rawLabel, rawUrl) {
      const labelErrorEl = _getLabelErrorEl();
      const urlErrorEl   = _getUrlErrorEl();

      // Clear previous errors
      if (labelErrorEl) { labelErrorEl.textContent = ''; labelErrorEl.setAttribute('hidden', ''); }
      if (urlErrorEl)   { urlErrorEl.textContent   = ''; urlErrorEl.setAttribute('hidden', '');   }

      const label = (rawLabel || '').trim();
      const url   = (rawUrl   || '').trim();
      let valid = true;

      if (label === '') {
        if (labelErrorEl) { labelErrorEl.textContent = 'Label is required.'; labelErrorEl.removeAttribute('hidden'); }
        valid = false;
      } else if (label.length > 100) {
        if (labelErrorEl) { labelErrorEl.textContent = 'Label cannot exceed 100 characters.'; labelErrorEl.removeAttribute('hidden'); }
        valid = false;
      }

      if (url === '') {
        if (urlErrorEl) { urlErrorEl.textContent = 'URL is required.'; urlErrorEl.removeAttribute('hidden'); }
        valid = false;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (urlErrorEl) { urlErrorEl.textContent = 'URL must start with http:// or https://.'; urlErrorEl.removeAttribute('hidden'); }
        valid = false;
      }

      if (!valid) return false;

      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : String(Date.now());

      _links.push({ id, label, url });
      _persist();
      _render();

      // Clear inputs on success
      const labelInputEl = _getLabelInputEl();
      const urlInputEl   = _getUrlInputEl();
      if (labelInputEl) labelInputEl.value = '';
      if (urlInputEl)   urlInputEl.value   = '';

      return true;
    },

    /**
     * Removes the link with the given id, persists, and re-renders.
     * Requirements: 9.1, 9.2
     * (Fully implemented in task 8.5 — stub here so delegation from init works)
     * @param {string} id
     */
    deleteLink(id) {
      _links = _links.filter(function (l) { return l.id !== id; });
      _persist();
      _render();
    },

    // Expose internal state for testing purposes.
    _getState() {
      return { links: _links.slice() };
    },
  };
})();

// ---------------------------------------------------------------------------
// init — wires all widgets together on DOMContentLoaded
// Requirements: 1.2, 1.4, 1.7
// ---------------------------------------------------------------------------

/**
 * Top-level initialisation function.
 * Checks localStorage availability, then initialises each widget in order.
 * Wrapped in try/catch so no unhandled error ever surfaces to the user.
 */
function init() {
  try {
    if (!StorageService.isAvailable()) {
      ErrorBanner.show(
        'Local storage is not available in this browser. Your tasks and links will not be saved.'
      );
    }

    GreetingWidget.init();
    FocusTimer.init();
    TaskManager.init(StorageService);
    QuickLinksPanel.init(StorageService);
  } catch (err) {
    // Last-resort catch — surface a generic message so the user knows
    // something went wrong without seeing a raw JS error.
    ErrorBanner.show(
      'An unexpected error occurred while loading the dashboard. Please refresh the page.'
    );
    console.error('[Dashboard] init error:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);
