# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a zero-dependency, single-page web application delivered as three files (`index.html`, `css/style.css`, `js/app.js`). The implementation proceeds layer by layer: project scaffold → shared utilities → each widget → styling → tests. Every task builds on the previous and ends with all pieces wired together.

---

## Tasks

- [x] 1. Scaffold project structure and set up testing framework
  - Create `index.html` with semantic sections for each widget (greeting, timer, task manager, quick links), referencing `css/style.css` and `js/app.js`
  - Create empty `css/style.css` and `js/app.js` files
  - Initialise `package.json` with `vitest` and `fast-check` as dev dependencies
  - Create `vitest.config.js` configured with `jsdom` as the test environment
  - Create `tests/` directory with placeholder test files for each module
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement `StorageService` module
  - [x] 2.1 Write `StorageService` with `isAvailable()`, `load(key)`, `save(key, value)`, and `KEYS` constant object
    - `isAvailable()` writes and reads a sentinel value to detect `SecurityError`
    - `load` wraps `JSON.parse` in `try/catch` and returns `null` on any failure
    - `save` wraps `JSON.stringify` + `setItem` in `try/catch` and returns `false` on `QuotaExceededError`
    - Export `KEYS.TASKS = "dashboard_tasks"` and `KEYS.LINKS = "dashboard_links"`
    - _Requirements: 1.7, 7.1, 7.2, 7.3, 10.1, 10.2, 10.3_

  - [x]* 2.2 Write property test for task persistence round-trip (Property 13)
    - **Property 13: Task persistence round-trip**
    - **Validates: Requirements 7.1, 7.2**
    - Use `fc.array(fc.record({ id: fc.string(), description: fc.string({ minLength: 1 }), completed: fc.boolean() }))`
    - Assert `load(KEYS.TASKS)` deeply equals saved array

  - [x]* 2.3 Write property test for link persistence round-trip (Property 17)
    - **Property 17: Link persistence round-trip**
    - **Validates: Requirements 10.1, 10.2**
    - Use `fc.array(fc.record({ id: fc.string(), label: fc.string({ minLength: 1 }), url: fc.webUrl() }))`
    - Assert `load(KEYS.LINKS)` deeply equals saved array

  - [x]* 2.4 Write unit tests for `StorageService`
    - Test `isAvailable()` returns `false` when `localStorage` is mocked as inaccessible
    - Test `load` returns `null` for missing key, invalid JSON, and non-array value
    - Test `save` returns `false` on `QuotaExceededError`
    - _Requirements: 1.7, 7.3, 10.3_

- [x] 3. Implement `ErrorBanner` module
  - [x] 3.1 Write `ErrorBanner` with `show(message)` and `clear()` methods
    - `show` appends a `<p>` to `<div id="error-banner">` and makes the banner visible
    - `clear` empties the banner and hides it
    - _Requirements: 1.7, 4.6, 7.3, 10.3_

  - [x]* 3.2 Write unit tests for `ErrorBanner`
    - Test that `show` adds a visible `<p>` with the correct message text
    - Test that `clear` empties and hides the banner
    - _Requirements: 1.7_

- [x] 4. Implement `GreetingWidget` module
  - [x] 4.1 Write pure formatting functions: `formatTime(date)`, `formatDate(date)`, `getGreeting(date)`
    - `formatTime` returns zero-padded `HH:MM` string
    - `formatDate` returns `"Weekday, D Month YYYY"` (e.g. `"Monday, 7 September 2026"`)
    - `getGreeting` returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 0–4 and 18–23
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [x]* 4.2 Write property test for `formatTime` (Property 1)
    - **Property 1: Time formatting is always valid HH:MM**
    - **Validates: Requirements 2.1**
    - Use `fc.date()` and assert result matches `/^\d{2}:\d{2}$/` with HH in [00–23] and MM in [00–59]

  - [x]* 4.3 Write property test for `formatDate` (Property 2)
    - **Property 2: Date formatting always contains required components**
    - **Validates: Requirements 2.3**
    - Use `fc.date()` and assert result contains a full weekday name, numeric day without leading zero, full month name, and four-digit year

  - [x]* 4.4 Write property test for `getGreeting` (Property 3)
    - **Property 3: Greeting is correct for any time of day**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Use `fc.date()` and assert the return value matches the expected greeting for the given hour

  - [x] 4.5 Write `GreetingWidget.init()` that wires `formatTime`, `formatDate`, and `getGreeting` to the DOM
    - On `init`, immediately update `#greeting-time`, `#greeting-date`, and `#greeting-message` elements
    - Start a `setInterval` of 60 000 ms to refresh the display each minute
    - _Requirements: 2.2, 2.7_

- [x] 5. Implement `FocusTimer` module
  - [x] 5.1 Write pure `formatTimer(seconds)` function
    - Returns zero-padded `MM:SS` for any integer in [0, 1500]
    - _Requirements: 3.3_

  - [ ]* 5.2 Write property test for `formatTimer` (Property 4)
    - **Property 4: Timer display is always valid MM:SS**
    - **Validates: Requirements 3.3**
    - Use `fc.integer({ min: 0, max: 1500 })` and assert result matches `/^\d{2}:\d{2}$/` with SS in [00–59]

  - [x] 5.3 Write `FocusTimer` state machine: `init()`, `start()`, `stop()`, `reset()`
    - Maintain in-memory state: `secondsRemaining`, `isRunning`, `intervalId`, `sessionEndDisplayed`
    - `init` sets `secondsRemaining = 1500`, renders `25:00`, binds Start/Stop/Reset buttons
    - `start` is a no-op when already running (Req 3.10); resumes from retained time when paused
    - `stop` clears `intervalId` and retains `secondsRemaining`
    - `reset` stops countdown and restores `25:00`, removes end-of-session indicator
    - On each tick, decrement `secondsRemaining` and update display; stop and fire alerts when it reaches 0
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10_

  - [x] 5.4 Implement `playEndAlert()` using `AudioContext` + `OscillatorNode`
    - 440 Hz sine wave, ~1.5 s duration
    - Wrap entire implementation in `try/catch`; fail silently if `AudioContext` unavailable
    - Show visible end-of-session indicator in the DOM when timer reaches 00:00
    - _Requirements: 3.8, 3.9_

  - [ ]* 5.5 Write unit tests for `FocusTimer` state machine
    - Test each state transition: Stopped→Running, Running→Paused, Paused→Running, Running→Ended, Ended→Stopped
    - Test that `start()` while running is a no-op
    - Test that `reset()` from Running, Paused, and Ended all return to Stopped/25:00
    - Test that end-of-session indicator appears at 00:00 and is removed by `reset()`
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10_

- [x] 6. Checkpoint — Ensure all tests pass so far
  - Run `vitest --run` and confirm StorageService, ErrorBanner, GreetingWidget, and FocusTimer tests pass. Ask the user if any questions arise.

- [x] 7. Implement `TaskManager` module
  - [x] 7.1 Write `TaskManager.init(storage)` — load tasks from `StorageService` and render the initial list
    - Deserialise `dashboard_tasks`; drop invalid elements silently
    - If `load` returns `null` or a non-array, show `ErrorBanner` with appropriate message and render empty list
    - Attach event delegation listener to `<ul id="task-list">` for click and keydown events
    - _Requirements: 4.5, 4.6, 7.2, 7.3_

  - [x] 7.2 Implement `addTask(description)` with validation and persistence
    - Trim input; reject empty/whitespace-only strings (return `false`, clear input field)
    - Truncate at 200 characters, generate unique `id` via `crypto.randomUUID()` or `Date.now().toString()`
    - Append task to in-memory array, re-render list, persist to `localStorage`
    - Support submission via Add button click and Enter key
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 7.3 Write property test for `addTask` with valid input (Property 5)
    - **Property 5: Adding a valid task grows the task list by exactly one**
    - **Validates: Requirements 4.2**
    - Use `fc.string().filter(s => s.trim().length > 0)` and assert list length increases by 1 and description equals trimmed input

  - [ ]* 7.4 Write property test for `addTask` with whitespace-only input (Property 6)
    - **Property 6: Whitespace-only input is always rejected**
    - **Validates: Requirements 4.3**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` and assert list is unchanged and return value is falsy

  - [ ]* 7.5 Write property test for insertion order (Property 7)
    - **Property 7: Task list order is always insertion order**
    - **Validates: Requirements 4.4**
    - Use `fc.array(fc.string().filter(s => s.trim().length > 0))` and assert order matches insertion sequence after any toggles or edits

  - [x] 7.6 Implement `editTask(id, newDescription)` with validation, single-edit-mode enforcement, and persistence
    - Edit control replaces `<span>` with pre-populated `<input>` and moves focus to it
    - Set module-level `editingId` to prevent concurrent edits (Req 5.8)
    - Confirm on Enter/Save: trim value; if empty/whitespace-only, restore original and exit (Req 5.5); if >256 chars, show inline error (Req 5.6)
    - Cancel on Escape: restore original description (Req 5.7)
    - Persist on successful save
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 7.7 Write property test for valid edit updates description (Property 8)
    - **Property 8: Valid task edit always updates description**
    - **Validates: Requirements 5.3, 5.4**
    - Use `fc.string({ minLength: 1, maxLength: 256 }).filter(s => s.trim().length > 0)` and assert description equals trimmed new value

  - [ ]* 7.8 Write property test for whitespace edit is rejected (Property 9)
    - **Property 9: Whitespace-only edit never updates description**
    - **Validates: Requirements 5.5**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` and assert description is unchanged

  - [ ]* 7.9 Write property test for single edit mode (Property 10)
    - **Property 10: At most one task is in edit mode at any time**
    - **Validates: Requirements 5.8**
    - Use `fc.array(fc.record({ id: fc.uuid(), description: fc.string({ minLength: 1 }) }), { minLength: 2 })` and assert only one task can be in edit mode simultaneously

  - [x] 7.10 Implement `toggleTask(id)` and `deleteTask(id)` with persistence
    - `toggleTask` flips `completed` boolean, persists full array, re-renders list applying `task--complete` class and strikethrough
    - `deleteTask` removes task by id, persists updated array, re-renders list
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.11 Write property test for completion toggle round-trip (Property 11)
    - **Property 11: Completion toggle is a round-trip**
    - **Validates: Requirements 6.2, 6.3**
    - Use `fc.boolean()` as initial status; assert double-toggle restores original status and both states are reflected in `localStorage`

  - [ ]* 7.12 Write property test for delete removes task (Property 12)
    - **Property 12: Deleting a task removes it from list and localStorage**
    - **Validates: Requirements 6.5**
    - Use `fc.array(fc.record({ id: fc.uuid(), description: fc.string({ minLength: 1 }), completed: fc.boolean() }))` and assert task id absent from list and `localStorage` after deletion

- [x] 8. Implement `QuickLinksPanel` module
  - [x] 8.1 Write `QuickLinksPanel.init(storage)` — load links from `StorageService` and render the initial panel
    - Deserialise `dashboard_links`; drop invalid elements silently
    - If `load` returns `null` or a non-array, show `ErrorBanner` with appropriate message and render empty panel
    - Bind Add button click handler; attach event delegation listener to the links container for Delete buttons
    - _Requirements: 8.6, 10.2, 10.3_

  - [x] 8.2 Implement `addLink(label, url)` with validation and persistence
    - Reject empty label, label >100 chars, empty URL, URL not starting with `http://` or `https://` — show field-specific inline error messages
    - Limit label input to 100 characters via `maxlength` attribute
    - Append link to in-memory array, re-render panel, persist to `localStorage`
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [ ]* 8.3 Write property test for valid link addition (Property 14)
    - **Property 14: Valid link addition persists label and URL**
    - **Validates: Requirements 8.2, 8.5**
    - Use `fc.string({ minLength: 1, maxLength: 100 })` and `fc.webUrl()` and assert button with correct label appears in panel and link persists to `localStorage`

  - [ ]* 8.4 Write property test for invalid link rejection (Property 15)
    - **Property 15: Invalid link input is always rejected**
    - **Validates: Requirements 8.3**
    - Cover each invalid case: empty label, label >100 chars, empty URL, URL without http/https prefix; assert list unchanged and return value falsy

  - [x] 8.5 Implement link button rendering and `deleteLink(id)`
    - Each link renders as a `<button>` labelled with user-defined label text
    - Button click calls `window.open(url, '_blank', 'noopener,noreferrer')`
    - Delete control removes link from in-memory array, persists updated array, re-renders panel
    - _Requirements: 8.4, 8.5, 9.1, 9.2_

  - [ ]* 8.6 Write property test for delete link (Property 16)
    - **Property 16: Deleting a link removes it from panel and localStorage**
    - **Validates: Requirements 9.2**
    - Use `fc.array(fc.record({ id: fc.uuid(), label: fc.string({ minLength: 1 }), url: fc.webUrl() }))` and assert link id absent from panel and `localStorage` after deletion

  - [ ]* 8.7 Write unit tests for `QuickLinksPanel`
    - Test `window.open` called with correct URL, `'_blank'`, and `'noopener,noreferrer'` on link button click
    - Test inline error messages for each validation failure case
    - _Requirements: 8.3, 8.4_

- [x] 9. Checkpoint — Ensure all tests pass so far
  - Run `vitest --run` and confirm TaskManager and QuickLinksPanel tests pass. Ask the user if any questions arise.

- [x] 10. Write `init()` and wire all modules together in `js/app.js`
  - [ ] 10.1 Write the top-level `init()` function invoked on `DOMContentLoaded`
    - Call `StorageService.isAvailable()`; if `false`, call `ErrorBanner.show(...)` with a descriptive message
    - Call `GreetingWidget.init()`, `FocusTimer.init()`, `TaskManager.init(StorageService)`, `QuickLinksPanel.init(StorageService)` in sequence
    - Wrap `init` in a global `try/catch` so no unhandled error surfaces to the user
    - _Requirements: 1.2, 1.4, 1.7_

  - [ ]* 10.2 Write integration / smoke tests
    - Load page with cleared localStorage → all four widgets visible, no errors
    - Load page with pre-populated valid localStorage → tasks and links restored correctly
    - Load page with corrupted localStorage values → error banner shown, empty lists rendered
    - Mock `localStorage` as unavailable → error banner shown, all widgets functional
    - Mock `AudioContext` and assert it is created when timer reaches 00:00
    - _Requirements: 1.4, 1.7, 4.5, 4.6, 7.2, 7.3, 10.2, 10.3_

- [x] 11. Implement CSS styling in `css/style.css`
  - [x] 11.1 Write base layout and typography styles
    - Use `h1`–`h3` heading elements to express widget hierarchy
    - Define a single spacing unit (CSS custom property) used consistently across all widgets
    - Ensure all content fits within viewport at 320 px width without horizontal scrolling
    - _Requirements: 1.5, 11.1_

  - [x] 11.2 Style each widget section (greeting, timer, task list, quick links)
    - Apply distinct visual treatment for completed tasks (strikethrough and muted colour)
    - Style edit mode inputs, inline error messages, and the error banner
    - Style link buttons and the end-of-session timer indicator
    - _Requirements: 6.2, 11.1_

  - [x] 11.3 Implement dark mode via `prefers-color-scheme: dark` media query
    - Define a dark-mode colour palette using CSS custom properties
    - Apply the palette automatically when OS dark mode is active
    - _Requirements: 11.4_

- [x] 12. Final checkpoint — Ensure all tests pass and run a full smoke test
  - Run `vitest --run` and confirm the entire test suite passes (all unit, property, and integration tests). Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each property-based test MUST run a minimum of 100 iterations and include a comment in the format `// Feature: todo-life-dashboard, Property N: <property text>`
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major module
- Pure functions (`formatTime`, `formatDate`, `getGreeting`, `formatTimer`) are designed for testability in isolation — implement and test them before wiring to the DOM
- All `localStorage` access must be wrapped in `try/catch`; the app must never throw an unhandled error

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["5.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.2", "8.2"] },
    { "id": 6, "tasks": ["5.4", "5.5", "7.3", "7.4", "7.5", "8.3", "8.4"] },
    { "id": 7, "tasks": ["7.6", "8.5"] },
    { "id": 8, "tasks": ["7.7", "7.8", "7.9", "7.10", "8.6", "8.7"] },
    { "id": 9, "tasks": ["7.11", "7.12", "10.1"] },
    { "id": 10, "tasks": ["10.2", "11.1"] },
    { "id": 11, "tasks": ["11.2"] },
    { "id": 12, "tasks": ["11.3"] }
  ]
}
```
