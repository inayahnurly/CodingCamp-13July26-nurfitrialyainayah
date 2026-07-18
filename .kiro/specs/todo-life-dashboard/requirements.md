# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript (no frameworks, no backend). It provides users with a personal productivity hub that combines a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and quick-access links to favorite websites. All data is stored client-side via the browser's Local Storage API. The app can run as a standalone web page or as a browser extension, and supports light/dark mode toggling, custom user name, and task sorting.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person interacting with the Dashboard in a browser.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI component that implements the 25-minute Pomodoro-style countdown timer.
- **Todo_Manager**: The UI component and associated logic that handles task creation, editing, completion, and deletion.
- **Task**: A single to-do item managed by the Todo_Manager, consisting of at least a text description and a completion state.
- **Quick_Links**: The UI component that displays shortcut buttons to user-defined favorite URLs.
- **Storage**: The browser Local Storage API used to persist all user data.
- **Theme**: The visual color scheme of the Dashboard, either "light" or "dark".
- **Session**: A single continuous browser session from page load to page close or refresh.

---

## Requirements

### Requirement 1: Time-Aware Greeting

**User Story:** As a User, I want to see the current time, date, and a greeting appropriate to the time of day, so that I feel welcomed and immediately oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM format, updated every 60 seconds.
2. THE Greeting_Widget SHALL display the current local date in a human-readable format (e.g., "Monday, 13 July 2026").
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a User, I want to set a custom name that appears in the greeting, so that the Dashboard feels personalized to me.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display an editable name field within the greeting message.
2. WHEN the User submits a non-empty name, THE Greeting_Widget SHALL incorporate the name into the greeting (e.g., "Good Morning, Alex").
3. WHEN the User submits a name, THE Storage SHALL persist the name so that it is restored on the next page load.
4. WHEN the Dashboard loads and a persisted name exists in Storage, THE Greeting_Widget SHALL restore and display that name automatically.
5. IF the User submits an empty name, THEN THE Greeting_Widget SHALL revert the greeting to the name-free form (e.g., "Good Morning").

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize at 25:00 (twenty-five minutes, zero seconds) on page load.
2. WHEN the User activates the Start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the User activates the Stop control, THE Focus_Timer SHALL pause the countdown, preserving the remaining time.
5. WHEN the User activates the Reset control, THE Focus_Timer SHALL stop any active countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual or audible notification to the User.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control to prevent duplicate timers.
8. WHILE the Focus_Timer is paused or reset, THE Focus_Timer SHALL disable the Stop control.

---

### Requirement 4: To-Do List — Add Tasks

**User Story:** As a User, I want to add new tasks to my to-do list, so that I can track things I need to do.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a text input field and an "Add" control for creating new tasks.
2. WHEN the User submits a non-empty task description via the Add control or the Enter key, THE Todo_Manager SHALL append the new Task to the list.
3. WHEN a new Task is added, THE Todo_Manager SHALL persist all tasks to Storage immediately.
4. IF the User attempts to submit an empty task description, THEN THE Todo_Manager SHALL reject the submission and leave the list unchanged.
5. WHEN a new Task is added, THE Todo_Manager SHALL clear the text input field.

---

### Requirement 5: To-Do List — Edit Tasks

**User Story:** As a User, I want to edit the text of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide an edit control for each Task in the list.
2. WHEN the User activates the edit control for a Task, THE Todo_Manager SHALL present the existing task text in an editable state.
3. WHEN the User confirms the edit with a non-empty value, THE Todo_Manager SHALL update the Task text and persist all tasks to Storage.
4. IF the User confirms the edit with an empty value, THEN THE Todo_Manager SHALL reject the update and restore the original task text.
5. WHEN the User cancels the edit action, THE Todo_Manager SHALL discard changes and restore the original task text.

---

### Requirement 6: To-Do List — Mark Tasks as Done

**User Story:** As a User, I want to mark tasks as complete, so that I can track my progress and see what I have accomplished.

#### Acceptance Criteria

1. THE Todo_Manager SHALL display a completion toggle (e.g., checkbox) for each Task.
2. WHEN the User activates the completion toggle for an incomplete Task, THE Todo_Manager SHALL mark the Task as complete and apply a visual distinction (e.g., strikethrough text).
3. WHEN the User activates the completion toggle for a complete Task, THE Todo_Manager SHALL mark the Task as incomplete and remove the visual distinction.
4. WHEN a Task's completion state changes, THE Todo_Manager SHALL persist the updated state to Storage immediately.

---

### Requirement 7: To-Do List — Delete Tasks

**User Story:** As a User, I want to delete tasks I no longer need, so that I can keep my list relevant and uncluttered.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a delete control for each Task in the list.
2. WHEN the User activates the delete control for a Task, THE Todo_Manager SHALL remove that Task from the list permanently.
3. WHEN a Task is deleted, THE Todo_Manager SHALL persist the updated task list to Storage immediately.

---

### Requirement 8: To-Do List — Persist Tasks via Local Storage

**User Story:** As a User, I want my tasks to survive page refreshes and browser restarts, so that I do not lose my to-do list between sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Todo_Manager SHALL read all persisted tasks from Storage and render them in the list.
2. THE Todo_Manager SHALL serialize task data (text and completion state) to Storage as a JSON string.
3. WHEN the Dashboard loads and no task data exists in Storage, THE Todo_Manager SHALL render an empty list without errors.
4. FOR ALL task lists, serializing the task list to Storage and then deserializing it on the next load SHALL produce an equivalent task list (round-trip property).

---

### Requirement 9: Sort Tasks

**User Story:** As a User, I want to sort my tasks, so that I can prioritize and view them in a useful order.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a sort control with at least the following options: "Default" (insertion order), "Alphabetical" (A–Z), and "Completed Last".
2. WHEN the User selects a sort option, THE Todo_Manager SHALL reorder the displayed task list according to the chosen criterion without modifying the underlying stored order.
3. WHEN the Dashboard loads, THE Todo_Manager SHALL apply the "Default" sort order unless a sort preference has been persisted to Storage.
4. WHEN the User selects a sort option, THE Todo_Manager SHALL persist the sort preference to Storage.

---

### Requirement 10: Quick Links

**User Story:** As a User, I want to save and access buttons that open my favorite websites, so that I can navigate to them quickly from the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL display each saved link as a labeled button that opens the corresponding URL in a new browser tab.
2. THE Quick_Links SHALL provide controls to add a new link by specifying a label and a valid URL.
3. WHEN the User adds a new link, THE Quick_Links SHALL append the new button to the link list and persist all links to Storage.
4. IF the User provides an empty label or an empty URL when adding a link, THEN THE Quick_Links SHALL reject the submission.
5. THE Quick_Links SHALL provide a delete control for each saved link.
6. WHEN the User deletes a link, THE Quick_Links SHALL remove the corresponding button and persist the updated link list to Storage.
7. WHEN the Dashboard loads, THE Quick_Links SHALL read all persisted links from Storage and render them as buttons.
8. WHEN the Dashboard loads and no link data exists in Storage, THE Quick_Links SHALL render an empty link area without errors.

---

### Requirement 11: Light / Dark Mode Toggle

**User Story:** As a User, I want to switch between light and dark color themes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control visible at all times.
2. WHEN the User activates the Theme toggle, THE Dashboard SHALL switch from the current Theme to the other Theme and apply the change immediately across all UI components.
3. WHEN the Theme changes, THE Storage SHALL persist the selected Theme so that it is restored on the next page load.
4. WHEN the Dashboard loads and a persisted Theme exists in Storage, THE Dashboard SHALL apply that Theme before rendering any visible content to prevent a flash of unstyled content.
5. WHEN the Dashboard loads and no persisted Theme exists in Storage, THE Dashboard SHALL apply the light Theme by default.

---

### Requirement 12: File and Code Structure

**User Story:** As a developer, I want the project to follow a strict file organization rule, so that the codebase stays maintainable and consistent.

#### Acceptance Criteria

1. THE Dashboard SHALL be structured with exactly one HTML file at the project root (e.g., `index.html`).
2. THE Dashboard SHALL contain exactly one CSS file located inside a `css/` directory.
3. THE Dashboard SHALL contain exactly one JavaScript file located inside a `js/` directory.
4. THE Dashboard SHALL require no build step, no package manager, and no external server to function — opening `index.html` in a modern browser SHALL be sufficient.

---

### Requirement 13: Browser Compatibility and Performance

**User Story:** As a User, I want the Dashboard to load quickly and respond without lag in any modern browser, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari without polyfills or transpilation.
2. THE Dashboard SHALL complete initial render within 2 seconds on a standard desktop or laptop computer with a local file open.
3. WHEN the User performs any UI interaction (adding a task, toggling theme, starting the timer), THE Dashboard SHALL reflect the change within 100 milliseconds.
4. THE Dashboard SHALL not produce JavaScript errors in the browser console during normal operation.
