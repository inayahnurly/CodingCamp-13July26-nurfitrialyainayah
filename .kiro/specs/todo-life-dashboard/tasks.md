# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a single-page personal productivity dashboard using Vanilla JS, HTML, and CSS — no build step, no frameworks. The app is structured as a module-per-concern IIFE in `js/app.js`, with all persistence via `localStorage`. Implementation proceeds module by module, wiring everything together at the end, followed by property-based tests via fast-check (CDN).

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at project root with the full semantic HTML skeleton as specified in the design
  - Create `css/style.css` (empty placeholder) inside a `css/` directory
  - Create `js/app.js` (empty IIFE wrapper) inside a `js/` directory
  - Add `<link>` to `css/style.css` in `<head>` and `<script src="js/app.js">` at end of `<body>`
  - Include all widget sections: `#greeting`, `#focus-timer`, `#todo`, `#quick-links`
  - Include theme toggle button `#theme-toggle` in the `<header>`
  - Set initial `data-theme="light"` on `<html>`
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 2. Implement the Storage module
  - [x] 2.1 Write the Storage module inside the IIFE in `js/app.js`
    - Implement `Storage.load(key)` — `JSON.parse` wrapped in `try/catch`, returns `null` on any error
    - Implement `Storage.save(key, value)` — `JSON.stringify` wrapped in `try/catch`, silently fails, emits a one-time `console.warn` on first failure
    - Implement `Storage.remove(key)` — calls `localStorage.removeItem`
    - Define `Storage.KEYS` constant object: `{ THEME, NAME, TASKS, SORT, LINKS }`
    - _Requirements: 8.2, 8.3, 11.3_

  - [ ]* 2.2 Write property test for Task serialization round-trip
    - Create `js/tests.js` with fast-check loaded via CDN script tag in a `test.html` file at project root
    - **Property 1: Task serialization round-trip** — for any array of Task objects, `JSON.parse(JSON.stringify(tasks))` produces structurally equivalent tasks
    - Use `fc.array(fc.record({ id: fc.string(), text: fc.string({minLength:1}), completed: fc.boolean(), createdAt: fc.integer() }))`
    - Include comment: `// Feature: todo-life-dashboard, Property 1: Task serialization round-trip`
    - **Validates: Requirements 8.2, 8.4**

  - [ ]* 2.3 Write property test for QuickLink serialization round-trip
    - **Property 2: QuickLink serialization round-trip** — for any array of QuickLink objects, `JSON.parse(JSON.stringify(links))` produces structurally equivalent links
    - Use `fc.array(fc.record({ id: fc.string(), label: fc.string({minLength:1}), url: fc.string({minLength:1}) }))`
    - Include comment: `// Feature: todo-life-dashboard, Property 2: QuickLink serialization round-trip`
    - **Validates: Requirements 10.3, 10.6**

- [x] 3. Implement ThemeManager
  - [x] 3.1 Write the ThemeManager module in `js/app.js`
    - Implement `ThemeManager.init()` — reads persisted theme via `Storage.load(KEYS.THEME)`, falls back to `"light"`, sets `document.documentElement.setAttribute("data-theme", theme)` immediately (prevents FOUC)
    - Implement `ThemeManager.toggle()` — flips current theme between `"light"` and `"dark"`, updates `data-theme` attribute, persists via `Storage.save`
    - Implement `ThemeManager.current()` — returns current `data-theme` value
    - Wire `#theme-toggle` button click to `ThemeManager.toggle()`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 4. Implement GreetingWidget
  - [x] 4.1 Write the GreetingWidget module in `js/app.js`
    - Implement `_getGreeting(hour)` as a pure function returning `"Good Morning"` (05–11), `"Good Afternoon"` (12–17), `"Good Evening"` (18–21), or `"Good Night"` (22–04)
    - Implement `_tick()` — updates `#greeting-time` (HH:MM), `#greeting-date` (e.g., "Monday, 13 July 2026"), and `#greeting-text` with greeting + name
    - Implement `_loadName()` — reads from `Storage.load(KEYS.NAME)`
    - Implement `_saveName(name)` — trims the value; if non-empty, saves and updates greeting; if empty/whitespace, clears storage key and reverts to name-free greeting
    - Implement `GreetingWidget.init()` — calls `_tick()` once, starts `setInterval(_tick, 60000)`, wires `#greeting-name` input to `_saveName` on blur and Enter keypress, restores name from storage
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.2 Write property test for greeting hour classification
    - **Property 8: Greeting hour classification** — for any integer in [0, 23], `_getGreeting(hour)` returns exactly one of the four valid greeting strings
    - Use `fc.integer({min:0, max:23})`
    - Include comment: `// Feature: todo-life-dashboard, Property 8: Greeting hour classification`
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [ ]* 4.3 Write property test for empty-name fallback
    - **Property 7: Empty-name fallback** — for any string composed entirely of whitespace (including empty string), `_saveName` clears stored name and reverts greeting to name-free form
    - Use `fc.string().filter(s => s.trim() === "")`
    - Include comment: `// Feature: todo-life-dashboard, Property 7: Empty-name fallback`
    - **Validates: Requirements 2.5**

- [x] 5. Implement FocusTimer
  - [x] 5.1 Write the FocusTimer module in `js/app.js`
    - Define internal state: `{ status: "idle", remaining: 1500 }` (1500 seconds = 25:00)
    - Implement `FocusTimer.start()` — only transitions from `"idle"` or `"paused"` to `"running"`, starts `setInterval(_tick, 1000)`
    - Implement `FocusTimer.stop()` — only transitions from `"running"` to `"paused"`, clears interval
    - Implement `FocusTimer.reset()` — transitions any state to `"idle"`, clears interval, resets `remaining` to 1500
    - Implement `_tick()` — decrements `remaining`; when `remaining` reaches 0, auto-stops (sets status to `"idle"`, clears interval, triggers notification via `alert` or visual indicator)
    - Implement `_render()` — formats `remaining` as MM:SS, updates `#timer-display`; enables/disables `#timer-start`, `#timer-stop`, `#timer-reset` based on `status`
    - Implement `FocusTimer.init()` — sets initial state, calls `_render()`, wires `#timer-start`, `#timer-stop`, `#timer-reset` button clicks
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.2 Write property test for timer state machine legal transitions
    - **Property 9: Timer state machine — legal transitions only** — for any sequence of `"start"`, `"stop"`, `"reset"` calls, `status` is always one of `"idle"`, `"running"`, `"paused"` and `remaining` is always in [0, 1500]
    - Use `fc.array(fc.oneof(fc.constant("start"), fc.constant("stop"), fc.constant("reset")))`
    - Export the FocusTimer state machine logic as a pure function for testability (no DOM dependency)
    - Include comment: `// Feature: todo-life-dashboard, Property 9: Timer state machine`
    - **Validates: Requirements 3.2, 3.4, 3.5, 3.7, 3.8**

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TodoManager
  - [x] 7.1 Write the `_sortTasks(tasks, criterion)` pure function in `js/app.js`
    - `"default"` — sort by `createdAt` ascending
    - `"alpha"` — sort by `text.toLowerCase()` ascending
    - `"completed-last"` — incomplete tasks first, then complete tasks (stable within each group)
    - The function MUST return a new array and NOT mutate the input
    - _Requirements: 9.1, 9.2_

  - [ ]* 7.2 Write property tests for sort correctness and immutability
    - **Property 3: Sort stability — Completed Last** — every incomplete task appears before every complete task
    - **Property 4: Sort stability — Alphabetical** — every adjacent pair satisfies `task[i].text.toLowerCase() <= task[i+1].text.toLowerCase()`
    - **Property 5: Sort does not mutate** — after `_sortTasks(tasks, criterion)`, the original array reference is unchanged
    - Use `fc.array(fc.record({ id: fc.string(), text: fc.string({minLength:1}), completed: fc.boolean(), createdAt: fc.integer() }))`
    - Include comments: `// Feature: todo-life-dashboard, Property 3`, `// Property 4`, `// Property 5`
    - **Validates: Requirements 9.1, 9.2**

  - [x] 7.3 Write the TodoManager module in `js/app.js`
    - Define in-memory `tasks[]` array; load from `Storage.load(KEYS.TASKS)` on init (default `[]`)
    - Implement `addTask(text)` — trims input; rejects empty/whitespace; creates Task with `id` (UUID or `Date.now()`), `text`, `completed: false`, `createdAt: Date.now()`; pushes to array; calls `_persist()` and `_render()`
    - Implement `editTask(id, text)` — trims input; rejects empty; finds task by id; updates `text`; calls `_persist()` and `_render()`
    - Implement `deleteTask(id)` — filters out task by id; calls `_persist()` and `_render()`
    - Implement `toggleTask(id)` — flips `completed` on task by id; calls `_persist()` and `_render()`
    - Implement `setSort(criterion)` — persists via `Storage.save(KEYS.SORT, criterion)`; calls `_render()`
    - Implement `_persist()` — calls `Storage.save(KEYS.TASKS, tasks)`
    - Implement `_render()` — reads current sort from storage or memory; calls `_sortTasks`; clears `#todo-list`; builds `<li>` elements with checkbox, text, edit button, delete button; applies strikethrough class for completed tasks
    - Implement `TodoManager.init()` — loads tasks and sort preference; calls `_render()`; wires `#todo-add` button and Enter key on `#todo-input`; wires `#todo-sort` select change
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.3, 9.3, 9.4_

  - [ ]* 7.4 Write property test for empty-task rejection
    - **Property 6: Empty-task rejection** — for any string composed entirely of whitespace (including empty string), `addTask` leaves the task list unchanged
    - Use `fc.string().filter(s => s.trim() === "")`
    - Include comment: `// Feature: todo-life-dashboard, Property 6: Empty-task rejection`
    - **Validates: Requirements 4.4**

  - [ ]* 7.5 Write property test for toggle completion involution
    - **Property 10: Toggle completion is an involution** — calling `toggleTask(id)` twice returns task to its original `completed` state
    - Use `fc.record({ id: fc.string(), text: fc.string({minLength:1}), completed: fc.boolean(), createdAt: fc.integer() })`
    - Include comment: `// Feature: todo-life-dashboard, Property 10: Toggle completion involution`
    - **Validates: Requirements 6.2, 6.3**

- [x] 8. Implement QuickLinks
  - [x] 8.1 Write the QuickLinks module in `js/app.js`
    - Define in-memory `links[]` array; load from `Storage.load(KEYS.LINKS)` on init (default `[]`)
    - Implement `addLink(label, url)` — rejects empty label or empty URL; rejects URLs not starting with `http://` or `https://`; creates QuickLink with `id`, `label`, `url`; pushes to array; calls `_persist()` and `_render()`
    - Implement `deleteLink(id)` — filters out link by id; calls `_persist()` and `_render()`
    - Implement `_persist()` — calls `Storage.save(KEYS.LINKS, links)`
    - Implement `_render()` — clears `#links-list`; builds `<a>` buttons for each link (opens `target="_blank"`, `rel="noopener noreferrer"`); adds delete button per link
    - Implement `QuickLinks.init()` — loads links; calls `_render()`; wires `#link-add` button click; validates label and URL inputs
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 9. Wire initialization sequence in `js/app.js`
  - [x] 9.1 Add the IIFE init block that calls all modules in order
    - Call `ThemeManager.init()` first (prevents FOUC before DOM paint)
    - Call `GreetingWidget.init()`
    - Call `FocusTimer.init()`
    - Call `TodoManager.init()`
    - Call `QuickLinks.init()`
    - Wrap the entire call block in a `DOMContentLoaded` listener or place script at end of `<body>`
    - _Requirements: 11.4, 12.4, 13.4_

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement CSS styling in `css/style.css`
  - [x] 11.1 Write CSS custom properties and theming foundation
    - Define `:root` with light-theme tokens: `--bg`, `--surface`, `--text`, `--accent`, `--border`, `--shadow`
    - Define `[data-theme="dark"]` overrides for the same tokens
    - Add CSS reset/base styles (box-sizing, margin/padding reset, font-family)
    - _Requirements: 11.2, 11.4, 11.5_

  - [x] 11.2 Write layout and widget base styles
    - Style `.dashboard` as a CSS grid layout (responsive: single column on mobile, multi-column on desktop)
    - Style `.widget` base (background `var(--surface)`, border-radius, padding, box-shadow)
    - Style `.header` (flex row, space-between, sticky or fixed position)
    - Style `#theme-toggle` button
    - _Requirements: 12.1, 13.2_

  - [x] 11.3 Write widget-specific styles
    - Style `.greeting-widget` (large time display, date line, greeting line, name input)
    - Style `.timer-widget` (large `#timer-display`, button row with Start/Stop/Reset)
    - Style `.todo-widget` (input row, sort row, `#todo-list` items with checkbox, text, edit/delete buttons; `.completed` strikethrough)
    - Style `.links-widget` (link buttons grid, add-link input row)
    - _Requirements: 6.2, 13.3_

  - [x] 11.4 Write responsive breakpoints and transitions
    - Add `@media (max-width: 768px)` rules to collapse grid to single column
    - Add `transition` on color/background properties for smooth theme switching
    - _Requirements: 13.1, 13.3_

- [x] 12. Cross-browser smoke test checklist in code
  - [x] 12.1 Add smoke test assertions as automated `console.assert` checks in `js/tests.js`
    - Assert no `localStorage` errors on load (wrap in try/catch, log result)
    - Assert `data-theme` attribute is set on `<html>` before first paint (check in `ThemeManager.init`)
    - Assert `#timer-display` text is `"25:00"` on load
    - Assert `#todo-list` renders without errors when storage is empty
    - Assert `#links-list` renders without errors when storage is empty
    - _Requirements: 13.1, 13.4_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests run in `test.html` (loads `js/tests.js` + fast-check via CDN) — no build step needed
- `js/tests.js` must export pure functions (or receive them as parameters) to avoid DOM dependency in property tests
- The IIFE in `js/app.js` is the single JS artifact; `js/tests.js` is supplementary and not loaded by `index.html`
- Checkpoints ensure incremental validation at logical breaks
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "5.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.2", "7.2", "7.3", "8.1"] },
    { "id": 4, "tasks": ["7.4", "7.5", "9.1"] },
    { "id": 5, "tasks": ["11.1"] },
    { "id": 6, "tasks": ["11.2"] },
    { "id": 7, "tasks": ["11.3", "11.4"] },
    { "id": 8, "tasks": ["12.1"] }
  ]
}
```
