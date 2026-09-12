/**
 * Tests for TaskManager — task 7.2: addTask() validation, persistence, and form wiring.
 *
 * Later tasks (7.3–7.12) will add property tests and tests for editTask,
 * toggleTask, deleteTask, etc.
 */

import { createTaskManager, isValidTask } from '../js/task-manager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal in-memory storage mock that behaves like StorageService
 * but never touches a real localStorage.
 */
function makeStorage() {
  const store = {};
  return {
    KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
    load(key) {
      return key in store ? JSON.parse(JSON.stringify(store[key])) : null;
    },
    save(key, value) {
      store[key] = JSON.parse(JSON.stringify(value));
      return true;
    },
    // Expose raw store for assertions
    _store: store,
  };
}

/**
 * Creates a minimal ErrorBanner mock that records messages.
 */
function makeErrorBanner() {
  const messages = [];
  return {
    show(msg) { messages.push(msg); },
    clear() { messages.length = 0; },
    _messages: messages,
  };
}

/**
 * Creates a minimal DOM environment for TaskManager:
 * - <ul id="task-list">
 * - <form id="task-form">
 * - <input id="task-input">
 *
 * Returns references to each element plus a wired-up TaskManager instance.
 */
function makeTaskManager(preloadedTasks = null) {
  const storage = makeStorage();
  if (preloadedTasks !== null) {
    storage.save(storage.KEYS.TASKS, preloadedTasks);
  }

  const errorBanner = makeErrorBanner();

  const listEl  = document.createElement('ul');
  const formEl  = document.createElement('form');
  const inputEl = document.createElement('input');
  inputEl.type  = 'text';
  formEl.appendChild(inputEl);
  document.body.appendChild(listEl);
  document.body.appendChild(formEl);

  const tm = createTaskManager(storage, listEl, errorBanner, formEl, inputEl);
  tm.init();

  return { tm, storage, errorBanner, listEl, formEl, inputEl };
}

// Clean up DOM between tests
afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// addTask — unit tests
// ---------------------------------------------------------------------------

describe('TaskManager — addTask (task 7.2)', () => {

  describe('valid input', () => {
    it('returns true for a non-empty description', () => {
      const { tm } = makeTaskManager();
      expect(tm.addTask('Buy milk')).toBe(true);
    });

    it('appends a task to the in-memory list', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Buy milk');
      expect(tm.getTasks()).toHaveLength(1);
      expect(tm.getTasks()[0].description).toBe('Buy milk');
    });

    it('new task starts with completed = false', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Write tests');
      expect(tm.getTasks()[0].completed).toBe(false);
    });

    it('new task has a non-empty string id', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Write tests');
      const id = tm.getTasks()[0].id;
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('trims leading and trailing whitespace from the description', () => {
      const { tm } = makeTaskManager();
      tm.addTask('  Buy milk  ');
      expect(tm.getTasks()[0].description).toBe('Buy milk');
    });

    it('truncates descriptions longer than 200 characters', () => {
      const { tm } = makeTaskManager();
      const longDesc = 'a'.repeat(250);
      tm.addTask(longDesc);
      expect(tm.getTasks()[0].description).toHaveLength(200);
    });

    it('persists the task to storage after adding', () => {
      const { tm, storage } = makeTaskManager();
      tm.addTask('Learn Vitest');
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved).toHaveLength(1);
      expect(saved[0].description).toBe('Learn Vitest');
    });

    it('re-renders the list element after adding', () => {
      const { tm, listEl } = makeTaskManager();
      tm.addTask('Render me');
      expect(listEl.querySelectorAll('li').length).toBe(1);
    });

    it('multiple tasks are all appended and persisted', () => {
      const { tm, storage } = makeTaskManager();
      tm.addTask('Task one');
      tm.addTask('Task two');
      tm.addTask('Task three');
      expect(tm.getTasks()).toHaveLength(3);
      expect(storage.load(storage.KEYS.TASKS)).toHaveLength(3);
    });
  });

  describe('invalid input — empty / whitespace-only', () => {
    it('returns false for an empty string', () => {
      const { tm } = makeTaskManager();
      expect(tm.addTask('')).toBe(false);
    });

    it('returns false for a whitespace-only string (spaces)', () => {
      const { tm } = makeTaskManager();
      expect(tm.addTask('   ')).toBe(false);
    });

    it('returns false for a whitespace-only string (tabs and newlines)', () => {
      const { tm } = makeTaskManager();
      expect(tm.addTask('\t\n  ')).toBe(false);
    });

    it('does not add any task to the list when input is empty', () => {
      const { tm } = makeTaskManager();
      tm.addTask('');
      expect(tm.getTasks()).toHaveLength(0);
    });

    it('does not persist anything when input is whitespace-only', () => {
      const { tm, storage } = makeTaskManager();
      tm.addTask('   ');
      expect(storage.load(storage.KEYS.TASKS)).toBeNull();
    });
  });

  describe('form wiring — submit event', () => {
    it('submits via form submit event and adds the task', () => {
      const { tm, formEl, inputEl } = makeTaskManager();
      inputEl.value = 'From form submit';
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(tm.getTasks()).toHaveLength(1);
      expect(tm.getTasks()[0].description).toBe('From form submit');
    });

    it('clears the input field after a successful submission', () => {
      const { formEl, inputEl } = makeTaskManager();
      inputEl.value = 'Will be cleared';
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(inputEl.value).toBe('');
    });

    it('clears the input field even when input is empty/invalid', () => {
      const { formEl, inputEl } = makeTaskManager();
      inputEl.value = '   ';
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(inputEl.value).toBe('');
    });

    it('does not add task when form submitted with whitespace-only input', () => {
      const { tm, formEl, inputEl } = makeTaskManager();
      inputEl.value = '   ';
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(tm.getTasks()).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// editTask — unit tests (task 7.6)
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
// ---------------------------------------------------------------------------

describe('TaskManager — editTask (task 7.6)', () => {

  // ---- helper: get the task's <li> from the list element ----
  function getLi(listEl, id) {
    return listEl.querySelector(`li[data-id="${id}"]`);
  }

  describe('editTask() API — direct call', () => {
    it('returns true and updates the description for a valid non-empty string', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      const result = tm.editTask(id, 'Updated');
      expect(result).toBe(true);
      expect(tm.getTasks()[0].description).toBe('Updated');
    });

    it('trims leading and trailing whitespace from the new description', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      tm.editTask(id, '  Trimmed  ');
      expect(tm.getTasks()[0].description).toBe('Trimmed');
    });

    it('returns false and leaves description unchanged for empty string (Req 5.5)', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      const result = tm.editTask(id, '');
      expect(result).toBe(false);
      expect(tm.getTasks()[0].description).toBe('Original');
    });

    it('returns false and leaves description unchanged for whitespace-only input (Req 5.5)', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      const result = tm.editTask(id, '   \t\n  ');
      expect(result).toBe(false);
      expect(tm.getTasks()[0].description).toBe('Original');
    });

    it('returns false and leaves description unchanged for input >256 chars (Req 5.6)', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      const result = tm.editTask(id, 'a'.repeat(257));
      expect(result).toBe(false);
      expect(tm.getTasks()[0].description).toBe('Original');
    });

    it('accepts exactly 256 characters', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      const desc256 = 'a'.repeat(256);
      const result = tm.editTask(id, desc256);
      expect(result).toBe(true);
      expect(tm.getTasks()[0].description).toBe(desc256);
    });

    it('returns false for unknown id', () => {
      const { tm } = makeTaskManager();
      const result = tm.editTask('nonexistent-id', 'New value');
      expect(result).toBe(false);
    });

    it('persists the updated description to storage on success', () => {
      const { tm, storage } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      tm.editTask(id, 'Updated');
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved[0].description).toBe('Updated');
    });

    it('does not persist when edit is rejected (empty input)', () => {
      const { tm, storage } = makeTaskManager();
      tm.addTask('Original');
      const id = tm.getTasks()[0].id;
      tm.editTask(id, '');
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved[0].description).toBe('Original');
    });
  });

  describe('edit mode UI — Edit button click (Req 5.1, 5.2, 5.8)', () => {
    it('clicking Edit replaces span with an input pre-populated with current description (Req 5.1, 5.2)', () => {
      const { listEl } = makeTaskManager();
      // add a task so we have something to click
      const storage2 = (() => {
        const store = {};
        return {
          KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
          load(key) { return key in store ? JSON.parse(JSON.stringify(store[key])) : null; },
          save(key, value) { store[key] = JSON.parse(JSON.stringify(value)); return true; },
        };
      })();
      const banner2 = { show() {}, clear() {} };
      const list2 = document.createElement('ul');
      document.body.appendChild(list2);
      const tm2 = createTaskManager(storage2, list2, banner2);
      tm2.init();
      tm2.addTask('Hello World');

      const id = tm2.getTasks()[0].id;
      const li = list2.querySelector(`li[data-id="${id}"]`);

      // Before clicking Edit, span should be present
      expect(li.querySelector('.task__description')).not.toBeNull();
      expect(li.querySelector('.task__edit-input')).toBeNull();

      // Click Edit
      li.querySelector('.btn-edit').click();

      // Re-query li after click — full re-render replaces DOM nodes
      const liAfter = list2.querySelector(`li[data-id="${id}"]`);

      // After clicking Edit, input should appear pre-populated
      const editInput = liAfter.querySelector('.task__edit-input');
      expect(editInput).not.toBeNull();
      expect(editInput.value).toBe('Hello World');
      // Span should be gone
      expect(liAfter.querySelector('.task__description')).toBeNull();
    });

    it('while one task is in edit mode, other tasks cannot enter edit mode (Req 5.8)', () => {
      const storage2 = (() => {
        const store = {};
        return {
          KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
          load(key) { return key in store ? JSON.parse(JSON.stringify(store[key])) : null; },
          save(key, value) { store[key] = JSON.parse(JSON.stringify(value)); return true; },
        };
      })();
      const banner2 = { show() {}, clear() {} };
      const list2 = document.createElement('ul');
      document.body.appendChild(list2);
      const tm2 = createTaskManager(storage2, list2, banner2);
      tm2.init();
      tm2.addTask('Task A');
      tm2.addTask('Task B');

      const [idA, idB] = tm2.getTasks().map(t => t.id);
      const liA = list2.querySelector(`li[data-id="${idA}"]`);
      const liB = list2.querySelector(`li[data-id="${idB}"]`);

      // Put Task A into edit mode
      liA.querySelector('.btn-edit').click();
      expect(list2.querySelector(`li[data-id="${idA}"] .task__edit-input`)).not.toBeNull();

      // Task B's Edit button should be disabled (Req 5.8)
      const editBtnB = list2.querySelector(`li[data-id="${idB}"] .btn-edit`);
      expect(editBtnB.disabled).toBe(true);

      // Clicking disabled Task B Edit should not enter edit mode
      editBtnB.click();
      expect(list2.querySelector(`li[data-id="${idB}"] .task__edit-input`)).toBeNull();
    });
  });

  describe('edit confirmation — Save button and Enter key (Req 5.3, 5.4)', () => {
    function makeEditableTask(description = 'Original') {
      const storage2 = (() => {
        const store = {};
        return {
          KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
          load(key) { return key in store ? JSON.parse(JSON.stringify(store[key])) : null; },
          save(key, value) { store[key] = JSON.parse(JSON.stringify(value)); return true; },
          _store: store,
        };
      })();
      const banner2 = { show() {}, clear() {} };
      const list2 = document.createElement('ul');
      document.body.appendChild(list2);
      const tm2 = createTaskManager(storage2, list2, banner2);
      tm2.init();
      tm2.addTask(description);
      const id = tm2.getTasks()[0].id;
      // Enter edit mode
      list2.querySelector(`li[data-id="${id}"] .btn-edit`).click();
      return { tm2, list2, storage2, id };
    }

    it('Save button with valid value updates description and exits edit mode (Req 5.4)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      li.querySelector('.task__edit-input').value = 'Updated via Save';
      li.querySelector('.btn-save').click();

      expect(tm2.getTasks()[0].description).toBe('Updated via Save');
      // Should be back in display mode — no edit input
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
      expect(list2.querySelector(`li[data-id="${id}"] .task__description`)).not.toBeNull();
    });

    it('Enter key with valid value updates description and exits edit mode (Req 5.3)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      const input = li.querySelector('.task__edit-input');
      input.value = 'Updated via Enter';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(tm2.getTasks()[0].description).toBe('Updated via Enter');
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
    });

    it('Save button persists the new description to storage', () => {
      const { tm2, list2, storage2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      li.querySelector('.task__edit-input').value = 'Persisted';
      li.querySelector('.btn-save').click();

      const saved = storage2.load(storage2.KEYS.TASKS);
      expect(saved[0].description).toBe('Persisted');
    });

    it('trims whitespace when confirming via Save (Req 5.3)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      li.querySelector('.task__edit-input').value = '  Trimmed  ';
      li.querySelector('.btn-save').click();

      expect(tm2.getTasks()[0].description).toBe('Trimmed');
    });
  });

  describe('edit cancellation — Escape key and Cancel button (Req 5.5, 5.7)', () => {
    function makeEditableTask(description = 'Original') {
      const storage2 = (() => {
        const store = {};
        return {
          KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
          load(key) { return key in store ? JSON.parse(JSON.stringify(store[key])) : null; },
          save(key, value) { store[key] = JSON.parse(JSON.stringify(value)); return true; },
        };
      })();
      const banner2 = { show() {}, clear() {} };
      const list2 = document.createElement('ul');
      document.body.appendChild(list2);
      const tm2 = createTaskManager(storage2, list2, banner2);
      tm2.init();
      tm2.addTask(description);
      const id = tm2.getTasks()[0].id;
      list2.querySelector(`li[data-id="${id}"] .btn-edit`).click();
      return { tm2, list2, id };
    }

    it('Escape key discards changes and restores original description (Req 5.7)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const input = list2.querySelector(`li[data-id="${id}"] .task__edit-input`);
      input.value = 'Discarded';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(tm2.getTasks()[0].description).toBe('Original');
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
      expect(list2.querySelector(`li[data-id="${id}"] .task__description`).textContent).toBe('Original');
    });

    it('Cancel button discards changes and restores original description (Req 5.7)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      li.querySelector('.task__edit-input').value = 'Discarded';
      li.querySelector('.btn-cancel').click();

      expect(tm2.getTasks()[0].description).toBe('Original');
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
    });

    it('whitespace-only Save restores original description and exits edit mode (Req 5.5)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const li = list2.querySelector(`li[data-id="${id}"]`);
      li.querySelector('.task__edit-input').value = '   ';
      li.querySelector('.btn-save').click();

      expect(tm2.getTasks()[0].description).toBe('Original');
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
      expect(list2.querySelector(`li[data-id="${id}"] .task__description`).textContent).toBe('Original');
    });

    it('whitespace-only Enter restores original description and exits edit mode (Req 5.5)', () => {
      const { tm2, list2, id } = makeEditableTask('Original');
      const input = list2.querySelector(`li[data-id="${id}"] .task__edit-input`);
      input.value = '\t\n  ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(tm2.getTasks()[0].description).toBe('Original');
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).toBeNull();
    });
  });

  describe('inline error for >256 char input (Req 5.6)', () => {
    it('shows inline error and stays in edit mode when Save is clicked with >256 chars', () => {
      const storage2 = (() => {
        const store = {};
        return {
          KEYS: { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' },
          load(key) { return key in store ? JSON.parse(JSON.stringify(store[key])) : null; },
          save(key, value) { store[key] = JSON.parse(JSON.stringify(value)); return true; },
        };
      })();
      const banner2 = { show() {}, clear() {} };
      const list2 = document.createElement('ul');
      document.body.appendChild(list2);
      const tm2 = createTaskManager(storage2, list2, banner2);
      tm2.init();
      tm2.addTask('Original');
      const id = tm2.getTasks()[0].id;

      // Enter edit mode
      list2.querySelector(`li[data-id="${id}"] .btn-edit`).click();
      const li = list2.querySelector(`li[data-id="${id}"]`);

      // Type >256 chars (bypass maxLength via JS since jsdom doesn't enforce it)
      li.querySelector('.task__edit-input').value = 'a'.repeat(257);
      li.querySelector('.btn-save').click();

      // Should still be in edit mode
      expect(list2.querySelector(`li[data-id="${id}"] .task__edit-input`)).not.toBeNull();

      // Inline error should be visible with the correct message
      const errorEl = li.querySelector('.task__edit-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.hasAttribute('hidden')).toBe(false);
      expect(errorEl.textContent).toBe('Task description cannot exceed 256 characters.');

      // Description should be unchanged
      expect(tm2.getTasks()[0].description).toBe('Original');
    });
  });
});

// ---------------------------------------------------------------------------
// toggleTask — unit tests (task 7.10)
// Requirements: 6.1, 6.2, 6.3
// ---------------------------------------------------------------------------

describe('TaskManager — toggleTask (task 7.10)', () => {

  function makeTaskManagerWithTask(description = 'Test task') {
    const { tm, storage, listEl } = makeTaskManager();
    tm.addTask(description);
    const id = tm.getTasks()[0].id;
    return { tm, storage, listEl, id };
  }

  describe('toggling an incomplete task (Req 6.2)', () => {
    it('marks an incomplete task as complete', () => {
      const { tm, id } = makeTaskManagerWithTask();
      expect(tm.getTasks()[0].completed).toBe(false);
      tm.toggleTask(id);
      expect(tm.getTasks()[0].completed).toBe(true);
    });

    it('persists the completed status to localStorage after toggling (Req 6.2)', () => {
      const { tm, storage, id } = makeTaskManagerWithTask();
      tm.toggleTask(id);
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved[0].completed).toBe(true);
    });

    it('applies task--complete class to the <li> element after toggling (Req 6.2)', () => {
      const { tm, listEl, id } = makeTaskManagerWithTask();
      tm.toggleTask(id);
      const li = listEl.querySelector(`li[data-id="${id}"]`);
      expect(li.classList.contains('task--complete')).toBe(true);
    });

    it('checks the checkbox after toggling incomplete to complete (Req 6.2)', () => {
      const { tm, listEl, id } = makeTaskManagerWithTask();
      tm.toggleTask(id);
      const checkbox = listEl.querySelector(`li[data-id="${id}"] .task__checkbox`);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('toggling a complete task (Req 6.3)', () => {
    it('marks a complete task back to incomplete', () => {
      const { tm, id } = makeTaskManagerWithTask();
      tm.toggleTask(id); // incomplete → complete
      tm.toggleTask(id); // complete → incomplete
      expect(tm.getTasks()[0].completed).toBe(false);
    });

    it('persists the incomplete status to localStorage after toggling back (Req 6.3)', () => {
      const { tm, storage, id } = makeTaskManagerWithTask();
      tm.toggleTask(id); // mark complete
      tm.toggleTask(id); // mark incomplete
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved[0].completed).toBe(false);
    });

    it('removes task--complete class from the <li> when toggled back to incomplete (Req 6.3)', () => {
      const { tm, listEl, id } = makeTaskManagerWithTask();
      tm.toggleTask(id); // complete
      tm.toggleTask(id); // back to incomplete
      const li = listEl.querySelector(`li[data-id="${id}"]`);
      expect(li.classList.contains('task--complete')).toBe(false);
    });

    it('unchecks the checkbox when toggled back to incomplete (Req 6.3)', () => {
      const { tm, listEl, id } = makeTaskManagerWithTask();
      tm.toggleTask(id); // complete
      tm.toggleTask(id); // back to incomplete
      const checkbox = listEl.querySelector(`li[data-id="${id}"] .task__checkbox`);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('double-toggle round-trip', () => {
    it('toggling twice restores the original completion status', () => {
      const { tm, id } = makeTaskManagerWithTask();
      const original = tm.getTasks()[0].completed;
      tm.toggleTask(id);
      tm.toggleTask(id);
      expect(tm.getTasks()[0].completed).toBe(original);
    });

    it('double-toggle round-trip also works for a task that starts completed', () => {
      const storage = makeStorage();
      storage.save(storage.KEYS.TASKS, [
        { id: 'abc', description: 'Already done', completed: true },
      ]);
      const errorBanner = makeErrorBanner();
      const listEl = document.createElement('ul');
      document.body.appendChild(listEl);
      const tm = createTaskManager(storage, listEl, errorBanner);
      tm.init();

      tm.toggleTask('abc'); // complete → incomplete
      tm.toggleTask('abc'); // incomplete → complete
      expect(tm.getTasks()[0].completed).toBe(true);
    });
  });

  describe('checkbox click event delegation', () => {
    it('clicking the checkbox calls toggleTask via event delegation', () => {
      const { tm, listEl, id } = makeTaskManagerWithTask();
      const checkbox = listEl.querySelector(`li[data-id="${id}"] .task__checkbox`);
      checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(tm.getTasks()[0].completed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('is a no-op for an unknown id', () => {
      const { tm } = makeTaskManagerWithTask();
      const before = tm.getTasks().slice();
      tm.toggleTask('nonexistent-id');
      expect(tm.getTasks()).toEqual(before);
    });

    it('only toggles the targeted task, leaving others unchanged', () => {
      const { tm } = makeTaskManager();
      tm.addTask('Task A');
      tm.addTask('Task B');
      const [idA, idB] = tm.getTasks().map(t => t.id);
      tm.toggleTask(idA);
      expect(tm.getTasks().find(t => t.id === idA).completed).toBe(true);
      expect(tm.getTasks().find(t => t.id === idB).completed).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// deleteTask — unit tests (task 7.10)
// Requirements: 6.4, 6.5
// ---------------------------------------------------------------------------

describe('TaskManager — deleteTask (task 7.10)', () => {

  function makeTaskManagerWithTasks(...descriptions) {
    const { tm, storage, listEl } = makeTaskManager();
    descriptions.forEach(d => tm.addTask(d));
    return { tm, storage, listEl };
  }

  describe('removing a task (Req 6.5)', () => {
    it('removes the task from the in-memory list', () => {
      const { tm } = makeTaskManagerWithTasks('Task to delete');
      const id = tm.getTasks()[0].id;
      tm.deleteTask(id);
      expect(tm.getTasks()).toHaveLength(0);
    });

    it('removes the task from localStorage (Req 6.5)', () => {
      const { tm, storage } = makeTaskManagerWithTasks('Task to delete');
      const id = tm.getTasks()[0].id;
      tm.deleteTask(id);
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved).toHaveLength(0);
    });

    it('removes the <li> from the DOM after deletion', () => {
      const { tm, listEl } = makeTaskManagerWithTasks('Task to delete');
      const id = tm.getTasks()[0].id;
      tm.deleteTask(id);
      expect(listEl.querySelector(`li[data-id="${id}"]`)).toBeNull();
    });

    it('persists the updated list (without deleted task) to localStorage', () => {
      const { tm, storage } = makeTaskManagerWithTasks('Keep me', 'Delete me');
      const deleteId = tm.getTasks()[1].id;
      tm.deleteTask(deleteId);
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved).toHaveLength(1);
      expect(saved[0].description).toBe('Keep me');
      expect(saved.find(t => t.id === deleteId)).toBeUndefined();
    });
  });

  describe('provides a Delete control for each task (Req 6.4)', () => {
    it('each task <li> renders a Delete button', () => {
      const { tm, listEl } = makeTaskManagerWithTasks('Task A', 'Task B');
      const deleteBtns = listEl.querySelectorAll('.btn-delete');
      expect(deleteBtns).toHaveLength(2);
    });

    it('clicking the Delete button removes that task via event delegation', () => {
      const { tm, listEl } = makeTaskManagerWithTasks('Delete via click');
      const id = tm.getTasks()[0].id;
      listEl.querySelector(`li[data-id="${id}"] .btn-delete`).click();
      expect(tm.getTasks()).toHaveLength(0);
      expect(listEl.querySelector(`li[data-id="${id}"]`)).toBeNull();
    });
  });

  describe('multiple tasks — only targeted task is removed', () => {
    it('deleting the first task leaves remaining tasks intact', () => {
      const { tm, storage } = makeTaskManagerWithTasks('A', 'B', 'C');
      const idA = tm.getTasks()[0].id;
      tm.deleteTask(idA);
      const remaining = tm.getTasks();
      expect(remaining).toHaveLength(2);
      expect(remaining.map(t => t.description)).toEqual(['B', 'C']);
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved).toHaveLength(2);
    });

    it('deleting the last task leaves preceding tasks intact', () => {
      const { tm } = makeTaskManagerWithTasks('A', 'B', 'C');
      const idC = tm.getTasks()[2].id;
      tm.deleteTask(idC);
      expect(tm.getTasks()).toHaveLength(2);
      expect(tm.getTasks().map(t => t.description)).toEqual(['A', 'B']);
    });

    it('deleting a middle task preserves order of remaining tasks', () => {
      const { tm } = makeTaskManagerWithTasks('A', 'B', 'C');
      const idB = tm.getTasks()[1].id;
      tm.deleteTask(idB);
      expect(tm.getTasks().map(t => t.description)).toEqual(['A', 'C']);
    });
  });

  describe('edge cases', () => {
    it('is a no-op for an unknown id', () => {
      const { tm } = makeTaskManagerWithTasks('Survivor');
      tm.deleteTask('nonexistent-id');
      expect(tm.getTasks()).toHaveLength(1);
    });

    it('deleting the only task leaves an empty list and empty localStorage', () => {
      const { tm, storage } = makeTaskManagerWithTasks('Only one');
      const id = tm.getTasks()[0].id;
      tm.deleteTask(id);
      expect(tm.getTasks()).toHaveLength(0);
      const saved = storage.load(storage.KEYS.TASKS);
      expect(saved).toHaveLength(0);
    });
  });
});
