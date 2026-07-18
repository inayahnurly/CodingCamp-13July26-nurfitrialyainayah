# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page web application (SPA) delivered as a static `index.html` file. It runs entirely in the browser with no build step, no server, and no external dependencies. All persistence is handled through the browser's `localStorage` API. The application is structured as a self-contained module pattern in Vanilla JavaScript, a single CSS file using custom properties for theming, and a semantic HTML skeleton.

The five primary functional areas are:

1. **Greeting Widget** — time-aware greeting with editable user name
2. **Focus Timer** — Pomodoro-style 25-minute countdown
3. **To-Do Manager** — add, edit, complete, delete, and sort tasks
4. **Quick Links** — user-defined shortcut buttons to favorite URLs
5. **Theme Manager** — light/dark mode toggle with persistence

---

## Architecture

The application follows a **module-per-concern** pattern implemented inside a single `js/app.js` file using an IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope. Each concern is an object literal (module) with clearly defined public methods. Modules communicate by calling each other's public API; there is no event bus or shared mutable state outside each module.

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│  Provides DOM skeleton, loads css/style.css,        │
│  loads js/app.js at end of <body>                   │
└─────────────────────────┬───────────────────────────┘
                          │ DOM ready
                          ▼
┌─────────────────────────────────────────────────────┐
│                  js/app.js  (IIFE)                   │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Storage  │  │  Theme   │  │  GreetingWidget  │  │
│  │ (layer)  │  │ Manager  │  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│  ┌────┴─────┐  ┌─────┴────┐  ┌────────┴─────────┐  │
│  │  Todo    │  │  Focus   │  │   QuickLinks     │  │
│  │ Manager  │  │  Timer   │  │                  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Data flow:** User interaction → DOM event handler → Module method → Storage (read/write) → DOM update

**Initialization sequence:**
1. `ThemeManager.init()` — apply persisted theme before any render (prevents FOUC)
2. `GreetingWidget.init()` — render time/date/greeting, start clock interval
3. `FocusTimer.init()` — render initial 25:00 state
4. `TodoManager.init()` — load tasks from storage, render list
5. `QuickLinks.init()` — load links from storage, render buttons

---

## Components and Interfaces

### Storage Module

Thin wrapper around `localStorage`. All other modules interact with storage exclusively through this module, so that error handling and serialization are centralized.

```javascript
Storage = {
  load(key)         → any | null   // JSON.parse, returns null on error
  save(key, value)  → void         // JSON.stringify
  remove(key)       → void
  KEYS: { THEME, NAME, TASKS, SORT, LINKS }  // string constants
}
```

### ThemeManager

Reads the persisted theme on init and writes the `data-theme` attribute to `<html>`. Provides a toggle method wired to the theme button.

```javascript
ThemeManager = {
  init()    → void  // apply stored theme or default "light"
  toggle()  → void  // flip theme, persist, update data-theme
  current() → "light" | "dark"
}
```

### GreetingWidget

Manages the clock display, greeting text, and name editing. Uses `setInterval` with a 60-second tick for the time display. The name field uses `contenteditable` or an inline `<input>` that swaps to display mode on blur/enter.

```javascript
GreetingWidget = {
  init()        → void  // render, start interval
  _tick()       → void  // update time/date/greeting DOM
  _getGreeting(hour) → string  // pure function: hour → greeting phrase
  _saveName(name)    → void
  _loadName()        → string | null
}
```

### FocusTimer

Manages the countdown state machine. Uses `setInterval` for one-second ticks. Controls are enabled/disabled based on state.

```javascript
FocusTimer = {
  init()    → void  // render 25:00, wire buttons
  start()   → void  // transition to "running"
  stop()    → void  // transition to "paused"
  reset()   → void  // transition to "idle"
  _tick()   → void  // decrement, check for 00:00
  _render() → void  // update DOM from internal state
  // Internal state: { status: "idle"|"running"|"paused", remaining: number (seconds) }
}
```

Timer state machine:

```
         reset()           reset()
  ┌──────────┐  start()  ┌─────────┐  stop()  ┌──────────┐
  │   idle   │──────────▶│ running │──────────▶│  paused  │
  │ (25:00)  │◀──────────│         │◀──────────│          │
  └──────────┘  reset()  └────┬────┘  start()  └──────────┘
                              │ reaches 00:00
                              ▼
                         auto-stop → idle (notification)
```

### TodoManager

Manages the task array in memory and syncs to storage on every mutation. Rendering is a pure function of the current (sorted) task array.

```javascript
TodoManager = {
  init()               → void
  addTask(text)        → void   // creates Task, persists
  editTask(id, text)   → void   // mutates, persists
  deleteTask(id)       → void   // removes, persists
  toggleTask(id)       → void   // flips completed, persists
  setSort(criterion)   → void   // persists preference, re-renders
  _render()            → void   // sorts + builds DOM from tasks[]
  _sortTasks(tasks, criterion) → Task[]  // pure function
  _persist()           → void   // Storage.save(KEYS.TASKS, tasks)
}
```

### QuickLinks

Manages the links array. Same pattern as TodoManager — in-memory array, persist on mutation, render is pure function of array.

```javascript
QuickLinks = {
  init()               → void
  addLink(label, url)  → void
  deleteLink(id)       → void
  _render()            → void
  _persist()           → void
}
```

---

## Data Models

### Task

```javascript
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  text:      string,   // non-empty task description
  completed: boolean,  // false on creation
  createdAt: number    // Date.now() timestamp, used for "Default" sort
}
```

### QuickLink

```javascript
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty display label
  url:   string   // non-empty URL string
}
```

### Storage Keys

```javascript
KEYS = {
  THEME: "dashboard_theme",   // "light" | "dark"
  NAME:  "dashboard_name",    // string
  TASKS: "dashboard_tasks",   // Task[]
  SORT:  "dashboard_sort",    // "default" | "alpha" | "completed-last"
  LINKS: "dashboard_links"    // QuickLink[]
}
```

### Sort Criteria Enum

```javascript
SORT = {
  DEFAULT:        "default",        // insertion order (createdAt ascending)
  ALPHA:          "alpha",          // text ascending, case-insensitive
  COMPLETED_LAST: "completed-last"  // incomplete first, then complete
}
```

---

## File Structure

```
project-root/
├── index.html        ← single HTML entry point
├── css/
│   └── style.css     ← all styles, CSS custom properties for theming
└── js/
    └── app.js        ← all JavaScript, module pattern in IIFE
```

### index.html structure (skeleton)

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <header class="header">
    <button id="theme-toggle" aria-label="Toggle theme">🌙</button>
  </header>

  <main class="dashboard">
    <!-- Greeting Widget -->
    <section id="greeting" class="widget greeting-widget">
      <div id="greeting-time"></div>
      <div id="greeting-date"></div>
      <div id="greeting-text"></div>
      <input id="greeting-name" type="text" placeholder="Enter your name" />
    </section>

    <!-- Focus Timer -->
    <section id="focus-timer" class="widget timer-widget">
      <div id="timer-display">25:00</div>
      <button id="timer-start">Start</button>
      <button id="timer-stop" disabled>Stop</button>
      <button id="timer-reset">Reset</button>
    </section>

    <!-- To-Do List -->
    <section id="todo" class="widget todo-widget">
      <div class="todo-input-row">
        <input id="todo-input" type="text" placeholder="Add a task..." />
        <button id="todo-add">Add</button>
      </div>
      <div class="todo-sort-row">
        <select id="todo-sort">
          <option value="default">Default</option>
          <option value="alpha">Alphabetical</option>
          <option value="completed-last">Completed Last</option>
        </select>
      </div>
      <ul id="todo-list"></ul>
    </section>

    <!-- Quick Links -->
    <section id="quick-links" class="widget links-widget">
      <div id="links-list"></div>
      <div class="link-input-row">
        <input id="link-label" type="text" placeholder="Label" />
        <input id="link-url"   type="url"  placeholder="https://..." />
        <button id="link-add">Add Link</button>
      </div>
    </section>
  </main>

  <script src="js/app.js"></script>
</body>
</html>
```

### css/style.css structure

```css
/* 1. CSS custom properties (design tokens) */
:root { --bg: ...; --surface: ...; --text: ...; --accent: ...; }
[data-theme="dark"] { --bg: ...; --surface: ...; --text: ...; --accent: ...; }

/* 2. Reset / base */
/* 3. Layout — dashboard grid */
/* 4. Header */
/* 5. Widget base */
/* 6. Greeting Widget */
/* 7. Focus Timer Widget */
/* 8. To-Do Widget */
/* 9. Quick Links Widget */
/* 10. Animations / transitions */
/* 11. Responsive breakpoints */
```

Light/dark theming is applied exclusively by toggling `data-theme` on `<html>`. No JavaScript manipulates individual element colors; all color changes happen through CSS variable resolution.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task serialization round-trip

*For any* array of Task objects, serializing the array to a JSON string and then deserializing it SHALL produce an array whose Tasks are structurally equivalent (same id, text, completed, createdAt) to the originals.

**Validates: Requirements 8.2, 8.4**

---

### Property 2: QuickLink serialization round-trip

*For any* array of QuickLink objects, serializing the array to a JSON string and then deserializing it SHALL produce an array whose QuickLinks are structurally equivalent (same id, label, url) to the originals.

**Validates: Requirements 10.3, 10.6**

---

### Property 3: Sort stability — Completed Last

*For any* task list sorted with the "Completed Last" criterion, every incomplete task SHALL appear before every complete task in the resulting array.

**Validates: Requirements 9.1, 9.2**

---

### Property 4: Sort stability — Alphabetical

*For any* task list sorted with the "Alphabetical" criterion, for every pair of adjacent tasks (task[i], task[i+1]), `task[i].text.toLowerCase()` SHALL be lexicographically ≤ `task[i+1].text.toLowerCase()`.

**Validates: Requirements 9.1, 9.2**

---

### Property 5: Sort does not mutate stored tasks

*For any* task list and any sort criterion, applying `_sortTasks(tasks, criterion)` SHALL return a new array without modifying the original `tasks` array (the underlying insertion order is preserved for "Default" re-sort and storage round-trips).

**Validates: Requirements 9.2**

---

### Property 6: Empty-task rejection

*For any* string composed entirely of whitespace characters (including the empty string), attempting to add it as a task description SHALL leave the task list unchanged.

**Validates: Requirements 4.4**

---

### Property 7: Empty-name fallback

*For any* submission of a name string composed entirely of whitespace (including the empty string), the greeting text SHALL revert to the name-free greeting form and the stored name SHALL be cleared.

**Validates: Requirements 2.5**

---

### Property 8: Greeting hour classification

*For any* integer hour value in [0, 23], `_getGreeting(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night", with no hour value unclassified.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 9: Timer state machine — legal transitions only

*For any* sequence of `start()`, `stop()`, and `reset()` calls on the FocusTimer, the internal `status` field SHALL always be one of `"idle"`, `"running"`, or `"paused"`, and the `remaining` seconds value SHALL always be in [0, 1500].

**Validates: Requirements 3.2, 3.4, 3.5, 3.7, 3.8**

---

### Property 10: Toggle completion is an involution

*For any* task, calling `toggleTask(id)` twice in succession SHALL return the task to its original `completed` state.

**Validates: Requirements 6.2, 6.3**

---

## Error Handling

### localStorage Unavailability

`localStorage` can throw in private/incognito mode or when storage quota is exceeded. The Storage module wraps all access in `try/catch`:

- `Storage.load(key)` — on any error, returns `null` (treated as "no data").
- `Storage.save(key, value)` — on any error, silently fails (the in-memory state remains correct; the user just loses persistence for that session).
- A one-time console warning is emitted when the first storage failure is detected so developers can diagnose the environment.

### Malformed JSON

`JSON.parse` on corrupted storage data throws a `SyntaxError`. `Storage.load` catches this and returns `null`. Downstream modules treat `null` the same as a missing key — they initialize to default state (empty task list, empty links list, "light" theme, no name).

### Invalid URL in Quick Links

`TodoManager` and `QuickLinks` validate inputs before accepting them. For URLs, the check is a loose prefix test (`url.startsWith("http://") || url.startsWith("https://")`) so that obviously invalid values (plain text, empty string) are rejected without requiring a full RFC-3986 parser.

### Timer edge case — tab hidden

When the browser tab is hidden, `setInterval` may fire inaccurately. The FocusTimer does not compensate for drift — this is acceptable for a personal productivity tool. A future enhancement could use `Date.now()` deltas to correct drift.

---

## Testing Strategy

### Unit Tests (example-based)

Test specific behaviors with concrete inputs using a lightweight test runner (e.g., the browser console or a simple `assert` harness in a separate `test.js` file):

- `_getGreeting(hour)` for each boundary hour (0, 5, 12, 18, 22)
- `Storage.load` returning `null` for missing key and for malformed JSON
- `TodoManager.addTask` with empty string → list unchanged
- `TodoManager.editTask` with empty string → original text restored
- `FocusTimer` button disabled states: Start disabled while running, Stop disabled while idle/paused
- Timer reaches 00:00 → status becomes "idle", notification triggered
- Theme toggle: data-theme flips between "light" and "dark"

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check) (can be loaded via CDN in a test HTML page, no build step required) to run each property with a minimum of **100 generated inputs**.

Each property test MUST include a comment tag in the format:
`// Feature: todo-life-dashboard, Property N: <property_text>`

| # | Property | fast-check arbitraries |
|---|----------|------------------------|
| 1 | Task serialization round-trip | `fc.array(fc.record({ id: fc.string(), text: fc.string({minLength:1}), completed: fc.boolean(), createdAt: fc.integer() }))` |
| 2 | QuickLink serialization round-trip | `fc.array(fc.record({ id: fc.string(), label: fc.string({minLength:1}), url: fc.string({minLength:1}) }))` |
| 3 | Sort stability — Completed Last | `fc.array(fc.record({ ...task fields... }))` |
| 4 | Sort stability — Alphabetical | same as above |
| 5 | Sort does not mutate | same as above, any sort criterion |
| 6 | Empty-task rejection | `fc.string().filter(s => s.trim() === "")` |
| 7 | Empty-name fallback | same as above |
| 8 | Greeting hour classification | `fc.integer({min:0, max:23})` |
| 9 | Timer state machine | `fc.array(fc.oneof(fc.constant("start"), fc.constant("stop"), fc.constant("reset")))` |
| 10 | Toggle completion involution | `fc.record({ id: fc.string(), completed: fc.boolean(), ... })` |

### Integration / Smoke Tests

Manual checklist to run in each target browser (Chrome, Firefox, Edge, Safari):

1. Open `index.html` — no console errors, correct theme applied before render.
2. Add 5 tasks → refresh → all 5 tasks present.
3. Theme toggle → refresh → correct theme restored.
4. Name entry → refresh → name restored.
5. Focus timer: Start → Stop → Reset → displays 25:00.
6. Focus timer: let run to 00:00 → notification fires.
7. Add 3 quick links → delete 1 → refresh → 2 links remain.
8. Sort: switch between all 3 options → order changes correctly.
