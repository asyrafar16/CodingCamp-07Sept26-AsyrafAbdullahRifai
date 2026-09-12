# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub that combines a time-aware greeting, a Pomodoro-style focus timer, a task manager, and a customizable quick links panel — all without a backend server. All user data is persisted in the browser's Local Storage so the dashboard is ready to use on page load with no sign-in or setup required.

The application is delivered as a single HTML page referencing exactly one CSS file and one JavaScript file, and must run correctly in modern versions of Chrome, Firefox, Edge, and Safari.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current date, time, and a contextual greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer.
- **Task_Manager**: The UI component that manages the user's to-do list.
- **Task**: A single to-do item with a text description and a completion status.
- **Quick_Links_Panel**: The UI component that displays and manages user-defined shortcut links.
- **Link**: A user-defined shortcut entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used as the sole persistence mechanism.
- **Storage_Key_Tasks**: The Local Storage key `"dashboard_tasks"` used to persist tasks.
- **Storage_Key_Links**: The Local Storage key `"dashboard_links"` used to persist links.
- **Time_of_Day**: One of three named periods — Morning (05:00–11:59), Afternoon (12:00–17:59), Evening/Night (18:00–04:59).

---

## Requirements

### Requirement 1: Application Structure and Compatibility

**User Story:** As a user, I want the dashboard to load instantly in any modern browser without installation, so that I can start using it immediately from any device.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as a single HTML file that references exactly one CSS file located in `css/` and exactly one JavaScript file located in `js/`.
2. THE Dashboard SHALL operate without a backend server, relying solely on browser-native APIs.
3. THE Dashboard SHALL render and function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
4. WHEN the Dashboard is opened for the first time, THE Dashboard SHALL display all widgets in a usable default state without requiring any user configuration.
5. THE Dashboard SHALL display all content within the browser viewport without requiring horizontal scrolling on screen widths of 320 px or wider.
6. WHEN the Dashboard page finishes loading, THE Dashboard SHALL be interactive within 3 seconds on a network connection with a download speed of at least 10 Mbps.
7. IF a required browser-native API (e.g., localStorage, setTimeout) is unavailable, THEN THE Dashboard SHALL display an informative error message identifying the unavailable capability and SHALL continue to operate all unaffected features without throwing an unhandled error.

---

### Requirement 2: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a greeting suited to the time of day, so that the dashboard feels personal and contextually relevant every time I open it.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM format, where HH is a zero-padded hour in the range 00–23 and MM is a zero-padded minute in the range 00–59.
2. WHEN 60 seconds have elapsed since the last time display update, THE Greeting_Widget SHALL update the displayed time to reflect the current local time.
3. THE Greeting_Widget SHALL display the current date in a human-readable format that includes the full weekday name, day (without a leading zero), full month name, and four-digit year (e.g., "Monday, 7 September 2026").
4. WHEN the current local time is between 05:00 inclusive and 11:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning".
5. WHEN the current local time is between 12:00 inclusive and 17:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the current local time is between 18:00 inclusive and 23:59 inclusive, or between 00:00 inclusive and 04:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening".
7. WHEN the page is loaded, THE Greeting_Widget SHALL immediately reflect the correct time, date, and greeting without waiting for the first 60-second tick.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN the Focus_Timer is first displayed, THE Focus_Timer SHALL show a countdown value of 25:00.
2. WHEN the user activates the Start control and the Focus_Timer is in a stopped or paused state, THE Focus_Timer SHALL begin counting down in one-second intervals, decrementing the displayed time each second.
3. WHILE the Focus_Timer is running, THE Focus_Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control while the timer is running, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the user activates the Start control after the timer has been paused, THE Focus_Timer SHALL resume the countdown from the retained remaining time.
6. WHEN the user activates the Reset control while the timer is running or paused, THE Focus_Timer SHALL stop the countdown and reset the displayed time to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display 00:00.
8. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL emit an audible alert of between 1 and 3 seconds duration using the browser's audio API to signal the end of the session.
9. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL display a visible end-of-session indicator; WHEN the user subsequently activates the Reset control, THE Focus_Timer SHALL remove that indicator.
10. WHEN the user activates the Start control while the Focus_Timer is already running, THE Focus_Timer SHALL take no action.

---

### Requirement 4: To-Do List — Adding and Displaying Tasks

**User Story:** As a user, I want to add tasks to my to-do list and see them displayed, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input field and an Add control for creating new tasks.
2. WHEN the user submits a task description containing at least one non-whitespace character via the Add control or by pressing the Enter key, THE Task_Manager SHALL trim leading and trailing whitespace from the description, append a new Task with the trimmed description (maximum 200 characters) and a completion status of incomplete to the task list, and clear the input field.
3. IF the user attempts to submit an empty or whitespace-only task description, THEN THE Task_Manager SHALL not create a Task and SHALL clear the input field.
4. THE Task_Manager SHALL display all Tasks in the order they were added, each showing its description and a visual indicator of its current completion status (distinct display for incomplete versus complete).
5. WHEN the page is loaded, THE Task_Manager SHALL retrieve and display all previously saved Tasks from Local_Storage using Storage_Key_Tasks.
6. IF Local_Storage is unavailable or the data stored under Storage_Key_Tasks cannot be parsed, THEN THE Task_Manager SHALL display an empty task list and SHALL display an error message indicating that saved tasks could not be loaded.

---

### Requirement 5: To-Do List — Editing Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update what I need to do.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an Edit control for each Task in the list.
2. WHEN the user activates the Edit control for a Task, THE Task_Manager SHALL replace the Task's display text with an editable input field pre-populated with the Task's current description and SHALL move focus to that input field.
3. WHEN the user confirms the edit by pressing the Enter key and the new value is non-empty, non-whitespace-only, and does not exceed 256 characters, THE Task_Manager SHALL update the Task's description to the trimmed new value and return to display mode.
4. WHEN the user activates a Save control and the new value is non-empty, non-whitespace-only, and does not exceed 256 characters, THE Task_Manager SHALL update the Task's description to the trimmed new value and return to display mode.
5. IF the user confirms an edit with an empty or whitespace-only value, THEN THE Task_Manager SHALL not update the Task's description and SHALL restore the original description in display mode.
6. IF the user confirms an edit with a value exceeding 256 characters, THEN THE Task_Manager SHALL not update the Task's description and SHALL display an error message indicating the character limit.
7. WHEN the user cancels an edit by pressing the Escape key, THE Task_Manager SHALL discard the change and return the Task to display mode with its original description.
8. WHILE one Task is in edit mode, THE Task_Manager SHALL prevent any other Task from entering edit mode.

---

### Requirement 6: To-Do List — Completing and Deleting Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can keep my list accurate and clutter-free.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle control (e.g., a checkbox) for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Task_Manager SHALL update the Task's completion status to complete in Local_Storage and apply a visual treatment to the Task's text (at minimum strikethrough) that makes it visually distinguishable from incomplete Tasks.
3. WHEN the user activates the completion toggle for a complete Task, THE Task_Manager SHALL update the Task's completion status to incomplete in Local_Storage and remove the complete visual treatment from the Task's text.
4. THE Task_Manager SHALL provide a Delete control for each Task.
5. WHEN the user activates the Delete control for a Task, THE Task_Manager SHALL permanently remove that Task from the list and from Local_Storage.

---

### Requirement 7: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my list is still there when I return to the dashboard.

#### Acceptance Criteria

1. WHEN any Task is added, edited, marked complete, or deleted, THE Task_Manager SHALL write the full updated task list to Local_Storage under Storage_Key_Tasks as a JSON-serialised array.
2. WHEN the page is loaded, THE Task_Manager SHALL deserialise the value stored under Storage_Key_Tasks and restore all Tasks with their original descriptions and completion statuses.
3. IF Local_Storage is unavailable, or the value stored under Storage_Key_Tasks is not valid JSON, or the deserialised value is not an array, THEN THE Task_Manager SHALL initialise with an empty task list, preserve any previously stored data unchanged, and SHALL not throw an unhandled error.

---

### Requirement 8: Quick Links Panel — Adding and Displaying Links

**User Story:** As a user, I want to save shortcut buttons to my favourite websites, so that I can open them with a single click from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a label input field, a URL input field, and an Add control for creating new links.
2. WHEN the user submits a label of 1–100 characters and a URL beginning with `http://` or `https://` via the Add control, THE Quick_Links_Panel SHALL append a new Link button to the panel and persist the updated link list to Local_Storage under Storage_Key_Links.
3. IF the user attempts to add a Link with an empty label, a label exceeding 100 characters, an empty URL, or a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links_Panel SHALL not create the Link and SHALL display an error message identifying which field failed validation.
4. WHEN the user activates a Link button, THE Quick_Links_Panel SHALL open the associated URL in a new browser tab.
5. THE Quick_Links_Panel SHALL display all saved Links as buttons labelled with their user-defined label text.
6. WHEN the page is loaded, THE Quick_Links_Panel SHALL retrieve and display all previously saved Links from Local_Storage using Storage_Key_Links.
7. THE Quick_Links_Panel SHALL limit the label input field to a maximum of 100 characters.

---

### Requirement 9: Quick Links Panel — Deleting Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a Delete control for each Link.
2. WHEN the user activates the Delete control for a Link, THE Quick_Links_Panel SHALL permanently remove that Link from the panel and from Local_Storage.

---

### Requirement 10: Quick Links Panel — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that my shortcuts are available every time I open the dashboard.

#### Acceptance Criteria

1. WHEN any Link is added or deleted, THE Quick_Links_Panel SHALL write the full updated link list to Local_Storage under Storage_Key_Links as a JSON-serialised array.
2. WHEN the page is loaded, THE Quick_Links_Panel SHALL deserialise the value stored under Storage_Key_Links and restore all Links with their original labels and URLs.
3. IF Local_Storage is unavailable, or the stored value under Storage_Key_Links is not valid JSON, or the deserialised value is not an array, THEN THE Quick_Links_Panel SHALL initialise with an empty link list and SHALL not throw an unhandled error.

---

### Requirement 11: Visual Design and Performance

**User Story:** As a user, I want the dashboard to be visually clean, easy to read, and fast to interact with, so that it does not slow me down or cause distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL define all visual styles in the single CSS file, using heading elements h1–h3 to express hierarchy and a consistent spacing unit throughout all widgets.
2. THE Dashboard SHALL reflect any user interaction (add, edit, delete, toggle, timer tick) within 100 ms of the triggering event.
3. THE Dashboard SHALL load all styles and scripts and render the initial view within 2 seconds on a network connection with a download speed of at least 10 Mbps.
4. WHERE a dark colour scheme is preferred by the user's OS, THE Dashboard SHALL apply a dark-mode palette automatically via the `prefers-color-scheme` CSS media query.
