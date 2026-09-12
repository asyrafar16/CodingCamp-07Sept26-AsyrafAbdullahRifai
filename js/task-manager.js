/**
 * task-manager.js — Testable ES-module mirror of the TaskManager IIFE in app.js.
 *
 * Exports the TaskManager factory so Vitest can import it directly.
 * The app.js IIFE copies this logic and is kept in sync manually.
 *
 * Requirements: 4.1–4.6, 5.1–5.8, 6.1–6.5, 7.1–7.3
 */

// ---------------------------------------------------------------------------
// Task validation helper
// ---------------------------------------------------------------------------

/**
 * Returns true when `item` is a well-formed Task object.
 * A valid task has:
 *   - `id`          — a non-empty string
 *   - `description` — a non-empty string
 *   - `completed`   — a boolean
 *
 * Invalid elements are silently dropped by the caller.
 *
 * @param {unknown} item
 * @returns {boolean}
 */
export function isValidTask(item) {
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

// ---------------------------------------------------------------------------
// TaskManager factory
// ---------------------------------------------------------------------------

/**
 * Creates a TaskManager instance bound to a given storage service and
 * DOM container element.  This factory pattern makes the module testable
 * in jsdom without touching global `document`.
 *
 * @param {{
 *   load: (key: string) => any,
 *   save: (key: string, value: any) => boolean,
 *   KEYS: { TASKS: string }
 * }} storage  — StorageService (or compatible mock)
 *
 * @param {HTMLElement} listEl   — the <ul id="task-list"> element
 *
 * @param {{
 *   show: (message: string) => void,
 *   clear: () => void
 * }} errorBanner  — ErrorBanner (or compatible mock)
 *
 * @param {HTMLFormElement|null} [formEl]   — the <form id="task-form"> element (optional)
 * @param {HTMLInputElement|null} [inputEl] — the <input id="task-input"> element (optional)
 *
 * @returns {TaskManager}
 */
export function createTaskManager(storage, listEl, errorBanner, formEl = null, inputEl = null) {
  /** @type {Array<{ id: string, description: string, completed: boolean }>} */
  let tasks = [];

  /**
   * Id of the task currently in edit mode, or null when no task is being edited.
   * Enforces Requirement 5.8 (single-edit-mode).
   * @type {string | null}
   */
  let editingId = null;

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  /**
   * Full re-render: replaces the entire contents of `listEl` with current
   * task state.  Called after every mutation so the DOM is always in sync.
   *
   * Design note: full re-render is intentional (see design.md §TaskManager
   * Render strategy).  The task list is expected to be short enough that the
   * overhead is negligible and it keeps the rendering code simple.
   */
  function _render() {
    if (!listEl) return;

    listEl.innerHTML = '';

    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task__item' + (task.completed ? ' task--complete' : '');
      li.dataset.id = task.id;

      if (editingId === task.id) {
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
        // Use microtask so the element is in the DOM before focus() is called
        Promise.resolve().then(() => editInput.focus());
      } else {
        // ---- Display mode ----
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task__checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark "${task.description}" as ${task.completed ? 'incomplete' : 'complete'}`);

        const span = document.createElement('span');
        span.className = 'task__description';
        span.textContent = task.description;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn--secondary btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);

        // Disable Edit button when another task is already being edited (Req 5.8)
        if (editingId !== null) {
          editBtn.disabled = true;
        }

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

  // -------------------------------------------------------------------------
  // Persistence helper
  // -------------------------------------------------------------------------

  function _persist() {
    storage.save(storage.KEYS.TASKS, tasks);
  }

  // -------------------------------------------------------------------------
  // Edit helpers
  // -------------------------------------------------------------------------

  /**
   * Attempts to confirm an edit with `newValue` for the task with `id`.
   * Returns true on success, false when validation fails.
   *
   * @param {string} id
   * @param {string} newValue  — raw (untrimmed) value from the edit input
   * @param {HTMLElement} editErrorEl  — inline error <p> inside the <li>
   * @returns {boolean}
   */
  function _confirmEdit(id, newValue, editErrorEl) {
    const trimmed = newValue.trim();

    if (trimmed.length === 0) {
      // Req 5.5: empty/whitespace-only — restore original, exit edit mode
      editingId = null;
      _render();
      return false;
    }

    if (trimmed.length > 256) {
      // Req 5.6: too long — show inline error, stay in edit mode
      if (editErrorEl) {
        editErrorEl.textContent = 'Task description cannot exceed 256 characters.';
        editErrorEl.removeAttribute('hidden');
      }
      return false;
    }

    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx].description = trimmed;
      _persist();
    }
    editingId = null;
    _render();
    return true;
  }

  // -------------------------------------------------------------------------
  // Event delegation handler
  // -------------------------------------------------------------------------

  /**
   * Handles all click and keydown events bubbling up from `listEl`.
   * Dispatches to the appropriate action based on the event target's class.
   *
   * @param {Event} event
   */
  function _handleListEvent(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const li = target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;

    // ---- Clicks ----
    if (event.type === 'click') {
      if (target.classList.contains('task__checkbox')) {
        _toggleTask(id);
        return;
      }

      if (target.classList.contains('btn-edit')) {
        // Req 5.8: prevent entering edit mode if another task is already being edited
        if (editingId !== null) return;
        editingId = id;
        _render();
        return;
      }

      if (target.classList.contains('btn-delete')) {
        _deleteTask(id);
        return;
      }

      if (target.classList.contains('btn-save')) {
        const editInput = li.querySelector('.task__edit-input');
        const editErrorEl = li.querySelector('.task__edit-error');
        if (editInput) {
          _confirmEdit(id, editInput.value, editErrorEl);
        }
        return;
      }

      if (target.classList.contains('btn-cancel')) {
        // Req 5.7: discard changes, return to display mode
        editingId = null;
        _render();
        return;
      }
    }

    // ---- Keydown (Enter / Escape) inside an edit input ----
    if (event.type === 'keydown' && target.classList.contains('task__edit-input')) {
      if (event.key === 'Enter') {
        const editErrorEl = li.querySelector('.task__edit-error');
        _confirmEdit(id, target.value, editErrorEl);
      } else if (event.key === 'Escape') {
        // Req 5.7
        editingId = null;
        _render();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Loads tasks from `storage`, validates each entry, renders the list, and
   * attaches delegated event listeners to `listEl`.
   *
   * Also binds the add-task form (`formEl` + `inputEl`) when provided so
   * that both the Add button click and Enter key inside the input field
   * trigger `addTask()` and clear the input.
   *
   * - If `load` returns `null` or a non-array, `ErrorBanner.show` is called
   *   with an appropriate message and an empty list is rendered.
   * - Invalid individual task elements are dropped silently.
   *
   * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 7.2, 7.3
   */
  function init() {
    const raw = storage.load(storage.KEYS.TASKS);

    if (raw === null) {
      // null means key was absent (first run) — silently use empty list.
      tasks = [];
    } else if (!Array.isArray(raw)) {
      // Non-array stored value (corrupted data) — show error, empty list (Req 4.6, 7.3)
      tasks = [];
      errorBanner.show('Saved tasks could not be loaded. Starting with an empty list.');
    } else {
      // Filter out any elements that do not match the Task schema (Req 7.3)
      tasks = raw.filter(isValidTask);

      // If some elements were dropped due to corruption, warn the user
      if (tasks.length < raw.length) {
        errorBanner.show('Some saved tasks were invalid and could not be loaded.');
      }
    }

    _render();

    // Bind the add-task form so that both the Add button click (type="submit")
    // and pressing Enter inside the input field call addTask() and clear the input.
    // Requirements: 4.1, 4.2, 4.3
    if (formEl) {
      formEl.addEventListener('submit', (event) => {
        event.preventDefault();
        const description = inputEl ? inputEl.value : '';
        addTask(description);
        // Always clear the input after a submission attempt (Req 4.2, 4.3)
        if (inputEl) inputEl.value = '';
      });
    }

    // Attach event delegation — one listener each for clicks and keyboard
    // events; no rebinding needed on re-render because delegation handles
    // dynamically created children.
    if (listEl) {
      listEl.addEventListener('click', _handleListEvent);
      listEl.addEventListener('keydown', _handleListEvent);
    }
  }

  /**
   * Adds a new task.
   *
   * - Trims the description.
   * - Rejects empty / whitespace-only strings (returns false).
   * - Truncates at 200 characters.
   * - Generates a unique id.
   * - Appends the task, re-renders, and persists.
   *
   * Requirements: 4.1, 4.2, 4.3
   *
   * @param {string} description
   * @returns {boolean}  true when the task was added, false when rejected
   */
  function addTask(description) {
    const trimmed = description.trim().slice(0, 200);

    if (trimmed.length === 0) {
      return false;
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : String(Date.now());

    tasks.push({ id, description: trimmed, completed: false });
    _persist();
    _render();
    return true;
  }

  /**
   * Updates an existing task's description.
   *
   * - Trims the new description.
   * - Rejects empty/whitespace-only (returns false, does not change).
   * - Rejects strings exceeding 256 characters (returns false).
   * - Persists on success.
   *
   * Requirements: 5.3, 5.4, 5.5, 5.6
   *
   * @param {string} id
   * @param {string} newDescription
   * @returns {boolean}
   */
  function editTask(id, newDescription) {
    const trimmed = newDescription.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 256) return false;

    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;

    tasks[idx].description = trimmed;
    _persist();
    _render();
    return true;
  }

  /**
   * Toggles a task's completion status.
   * Persists the updated array and re-renders.
   *
   * Requirements: 6.2, 6.3
   *
   * @param {string} id
   */
  function _toggleTask(id) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    tasks[idx].completed = !tasks[idx].completed;
    _persist();
    _render();
  }

  /**
   * Deletes a task by id.
   * Persists the updated array and re-renders.
   *
   * Requirements: 6.4, 6.5
   *
   * @param {string} id
   */
  function _deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    _persist();
    _render();
  }

  /**
   * Returns a shallow copy of the current in-memory task array.
   * Intended for testing only — not part of the public production API.
   *
   * @returns {Array<{ id: string, description: string, completed: boolean }>}
   */
  function getTasks() {
    return tasks.slice();
  }

  return {
    init,
    addTask,
    editTask,
    toggleTask: _toggleTask,
    deleteTask: _deleteTask,
    // Testing helper — exposes in-memory state without touching localStorage
    getTasks,
  };
}
