(function() {
  'use strict';

  // ─── Storage Module ────────────────────────────────────────────────────────
  // Thin wrapper around localStorage. All other modules interact with storage
  // exclusively through this module so that error handling and serialization
  // are centralized. (Requirements 8.2, 8.3, 11.3)

  var _storageWarnEmitted = false;

  var Storage = {
    KEYS: {
      THEME: 'dashboard_theme',
      NAME:  'dashboard_name',
      TASKS: 'dashboard_tasks',
      SORT:  'dashboard_sort',
      LINKS: 'dashboard_links'
    },

    /**
     * Load and deserialize a value from localStorage.
     * Returns null on any error (missing key, malformed JSON, storage unavailable).
     * @param {string} key
     * @returns {*|null}
     */
    load: function(key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    /**
     * Serialize a value and write it to localStorage.
     * Silently fails on error; emits a one-time console.warn on first failure.
     * @param {string} key
     * @param {*} value
     */
    save: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        if (!_storageWarnEmitted) {
          console.warn('Dashboard: localStorage is unavailable. Data will not be persisted for this session.', e);
          _storageWarnEmitted = true;
        }
      }
    },

    /**
     * Remove a key from localStorage.
     * @param {string} key
     */
    remove: function(key) {
      localStorage.removeItem(key);
    }
  };

  // Alias for convenience inside modules
  var KEYS = Storage.KEYS;

  // ─── ThemeManager ─────────────────────────────────────────────────────────
  // Manages light/dark theme state. Reads the persisted theme on init and
  // writes data-theme to <html>. Provides toggle() wired to the theme button.
  // Requirements 11.1, 11.2, 11.3, 11.4, 11.5

  var ThemeManager = {
    /**
     * Apply the persisted theme (or the "light" default) to <html> immediately.
     * Called first in the init sequence to prevent flash of unstyled content.
     */
    init: function() {
      var theme = Storage.load(KEYS.THEME) || 'light';
      document.documentElement.setAttribute('data-theme', theme);

      // Wire the toggle button
      var btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function() {
          ThemeManager.toggle();
        });
      }
    },

    /**
     * Flip the current theme between "light" and "dark",
     * update the data-theme attribute, and persist the choice.
     */
    toggle: function() {
      var next = ThemeManager.current() === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      Storage.save(KEYS.THEME, next);
    },

    /**
     * Return the current value of the data-theme attribute on <html>.
     * @returns {"light"|"dark"}
     */
    current: function() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
  };

  // ─── GreetingWidget ────────────────────────────────────────────────────────
  // Manages the clock display, greeting text, and name editing.
  // Uses setInterval with a 60-second tick for the time display.
  // Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5

  var GreetingWidget = {
    /**
     * Pure function: maps a local hour (0–23) to a greeting phrase.
     * @param {number} hour - integer in [0, 23]
     * @returns {string}
     */
    _getGreeting: function(hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 21) return 'Good Evening';
      // 22–23 and 0–4
      return 'Good Night';
    },

    /**
     * Update #greeting-time, #greeting-date, and #greeting-text in the DOM.
     * Reads the current name from storage to compose the greeting.
     */
    _tick: function() {
      var now = new Date();
      var hour = now.getHours();
      var minutes = now.getMinutes();

      // HH:MM with leading zeros
      var hh = hour < 10 ? '0' + hour : String(hour);
      var mm = minutes < 10 ? '0' + minutes : String(minutes);

      // "Monday, 13 July 2026"
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
      var dateStr = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

      var greeting = GreetingWidget._getGreeting(hour);
      var name = GreetingWidget._loadName();
      var greetingText = name ? greeting + ', ' + name : greeting;

      var timeEl = document.getElementById('greeting-time');
      var dateEl = document.getElementById('greeting-date');
      var textEl = document.getElementById('greeting-text');

      if (timeEl) timeEl.textContent = hh + ':' + mm;
      if (dateEl) dateEl.textContent = dateStr;
      if (textEl) textEl.textContent = greetingText;
    },

    /**
     * Load the persisted name from storage.
     * @returns {string|null}
     */
    _loadName: function() {
      return Storage.load(KEYS.NAME);
    },

    /**
     * Save or clear the name, then refresh the greeting.
     * If name is empty/whitespace: clears storage and reverts to name-free greeting.
     * @param {string} name
     */
    _saveName: function(name) {
      var trimmed = name.trim();
      if (trimmed) {
        Storage.save(KEYS.NAME, trimmed);
      } else {
        Storage.remove(KEYS.NAME);
      }
      GreetingWidget._tick();
    },

    /**
     * Initialise the widget: tick once, start interval, wire name input, restore name.
     */
    init: function() {
      GreetingWidget._tick();
      setInterval(GreetingWidget._tick, 60000);

      // Restore saved name into the input field
      var nameInput = document.getElementById('greeting-name');
      if (nameInput) {
        var savedName = GreetingWidget._loadName();
        if (savedName) {
          nameInput.value = savedName;
        }

        // Save on blur
        nameInput.addEventListener('blur', function() {
          GreetingWidget._saveName(nameInput.value);
        });

        // Save on Enter key
        nameInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            nameInput.blur();
          }
        });
      }
    }
  };

  // ─── FocusTimer ────────────────────────────────────────────────────────────
  // Manages the countdown state machine. Uses setInterval for one-second ticks.
  // Controls are enabled/disabled based on state.
  // Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8

  /**
   * Pure state-transition function for the timer — no DOM dependency.
   * Used by FocusTimer internally and exported for property-based testing.
   *
   * @param {{ status: "idle"|"running"|"paused", remaining: number }} state
   * @param {"start"|"stop"|"reset"} action
   * @returns {{ status: "idle"|"running"|"paused", remaining: number }}
   */
  function _timerTransition(state, action) {
    switch (action) {
      case 'start':
        if (state.status === 'idle' || state.status === 'paused') {
          return { status: 'running', remaining: state.remaining };
        }
        return state;

      case 'stop':
        if (state.status === 'running') {
          return { status: 'paused', remaining: state.remaining };
        }
        return state;

      case 'reset':
        return { status: 'idle', remaining: 1500 };

      default:
        return state;
    }
  }

  var FocusTimer = (function() {
    var _state = { status: 'idle', remaining: 1500 };
    var _intervalId = null;

    /**
     * Format seconds as MM:SS.
     * @param {number} seconds
     * @returns {string}
     */
    function _format(seconds) {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
    }

    /**
     * Update the DOM to reflect current internal state.
     */
    function _render() {
      var display = document.getElementById('timer-display');
      var btnStart = document.getElementById('timer-start');
      var btnStop  = document.getElementById('timer-stop');
      var btnReset = document.getElementById('timer-reset');

      if (display) display.textContent = _format(_state.remaining);

      if (btnStart) btnStart.disabled = (_state.status === 'running');
      if (btnStop)  btnStop.disabled  = (_state.status !== 'running');
      if (btnReset) btnReset.disabled = false; // always available
    }

    /**
     * One-second tick: decrement remaining; auto-stop at 0.
     */
    function _tick() {
      _state.remaining -= 1;

      if (_state.remaining <= 0) {
        _state.remaining = 0;
        _state.status = 'idle';
        clearInterval(_intervalId);
        _intervalId = null;
        _render();
        // Notification when timer reaches 00:00 (Requirement 3.6)
        alert('Focus session complete! Time for a break.');
      } else {
        _render();
      }
    }

    return {
      /** Transition to "running". Only allowed from "idle" or "paused". */
      start: function() {
        var next = _timerTransition(_state, 'start');
        if (next.status === 'running' && _state.status !== 'running') {
          _state = next;
          _intervalId = setInterval(_tick, 1000);
          _render();
        }
      },

      /** Transition to "paused". Only allowed from "running". */
      stop: function() {
        var next = _timerTransition(_state, 'stop');
        if (next.status === 'paused') {
          _state = next;
          clearInterval(_intervalId);
          _intervalId = null;
          _render();
        }
      },

      /** Transition to "idle" and reset remaining to 1500 from any state. */
      reset: function() {
        _state = _timerTransition(_state, 'reset');
        clearInterval(_intervalId);
        _intervalId = null;
        _render();
      },

      /** Wire buttons and render initial state. */
      init: function() {
        _state = { status: 'idle', remaining: 1500 };
        _render();

        var btnStart = document.getElementById('timer-start');
        var btnStop  = document.getElementById('timer-stop');
        var btnReset = document.getElementById('timer-reset');

        if (btnStart) btnStart.addEventListener('click', function() { FocusTimer.start(); });
        if (btnStop)  btnStop.addEventListener('click',  function() { FocusTimer.stop(); });
        if (btnReset) btnReset.addEventListener('click', function() { FocusTimer.reset(); });
      }
    };
  })();

  // ─── _sortTasks ────────────────────────────────────────────────────────────
  // Pure sort function — returns a new array, never mutates the input.
  // Requirements 9.1, 9.2

  /**
   * Sort a task array by the given criterion without mutating the original.
   *
   * @param {Array<{id: string, text: string, completed: boolean, createdAt: number}>} tasks
   * @param {"default"|"alpha"|"completed-last"} criterion
   * @returns {Array} new sorted array
   */
  function _sortTasks(tasks, criterion) {
    var copy = tasks.slice(); // never mutate the original

    switch (criterion) {
      case 'alpha':
        copy.sort(function(a, b) {
          var aLow = a.text.toLowerCase();
          var bLow = b.text.toLowerCase();
          if (aLow < bLow) return -1;
          if (aLow > bLow) return  1;
          return 0;
        });
        break;

      case 'completed-last':
        copy.sort(function(a, b) {
          // false (0) before true (1) — incomplete tasks first
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
        break;

      case 'default':
      default:
        copy.sort(function(a, b) {
          return a.createdAt - b.createdAt;
        });
        break;
    }

    return copy;
  }

  // ─── TodoManager ───────────────────────────────────────────────────────────
  // Manages the task array in memory and syncs to storage on every mutation.
  // Rendering is a pure function of the current (sorted) task array.
  // Requirements 4.1–4.5, 5.1–5.5, 6.1–6.4, 7.1–7.3, 8.1, 8.3, 9.3, 9.4

  var TodoManager = (function() {
    var tasks = [];

    /**
     * Persist current tasks array to storage.
     */
    function _persist() {
      Storage.save(KEYS.TASKS, tasks);
    }

    /**
     * Re-render the #todo-list from the current (sorted) tasks array.
     */
    function _render() {
      var sortCriterion = Storage.load(KEYS.SORT) || 'default';
      var sorted = _sortTasks(tasks, sortCriterion);

      var list = document.getElementById('todo-list');
      if (!list) return;

      list.innerHTML = '';

      sorted.forEach(function(task) {
        var li = document.createElement('li');
        if (task.completed) {
          li.classList.add('completed');
        }

        // Checkbox
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', function() {
          TodoManager.toggleTask(task.id);
        });

        // Text span
        var span = document.createElement('span');
        span.textContent = task.text;

        // Edit button
        var editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', function() {
          // Inline edit: replace span with an input
          var input = document.createElement('input');
          input.type = 'text';
          input.value = task.text;
          li.replaceChild(input, span);
          input.focus();

          function commitEdit() {
            var newText = input.value;
            TodoManager.editTask(task.id, newText);
            // _render will be called by editTask, which rebuilds the DOM
          }

          input.addEventListener('blur', commitEdit);
          input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              input.removeEventListener('blur', commitEdit);
              commitEdit();
            }
          });
        });

        // Delete button
        var deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
          TodoManager.deleteTask(task.id);
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    }

    return {
      /**
       * Add a new task. Rejects empty/whitespace text.
       * @param {string} text
       */
      addTask: function(text) {
        var trimmed = text.trim();
        if (!trimmed) return;

        var task = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: trimmed,
          completed: false,
          createdAt: Date.now()
        };

        tasks.push(task);
        _persist();
        _render();

        var input = document.getElementById('todo-input');
        if (input) input.value = '';
      },

      /**
       * Edit an existing task's text. Rejects empty text (restores original).
       * @param {string} id
       * @param {string} text
       */
      editTask: function(id, text) {
        var trimmed = text.trim();
        if (!trimmed) {
          // Reject empty — re-render to restore original text
          _render();
          return;
        }

        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].id === id) {
            tasks[i].text = trimmed;
            break;
          }
        }

        _persist();
        _render();
      },

      /**
       * Delete a task by id.
       * @param {string} id
       */
      deleteTask: function(id) {
        tasks = tasks.filter(function(t) { return t.id !== id; });
        _persist();
        _render();
      },

      /**
       * Toggle the completed state of a task by id.
       * @param {string} id
       */
      toggleTask: function(id) {
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].id === id) {
            tasks[i].completed = !tasks[i].completed;
            break;
          }
        }
        _persist();
        _render();
      },

      /**
       * Set the sort criterion, persist it, and re-render.
       * @param {string} criterion
       */
      setSort: function(criterion) {
        Storage.save(KEYS.SORT, criterion);
        _render();
      },

      /**
       * Initialize: load tasks and sort preference, render, wire controls.
       */
      init: function() {
        tasks = Storage.load(KEYS.TASKS) || [];

        // Restore sort preference
        var savedSort = Storage.load(KEYS.SORT) || 'default';
        var sortSelect = document.getElementById('todo-sort');
        if (sortSelect) {
          sortSelect.value = savedSort;
          sortSelect.addEventListener('change', function() {
            TodoManager.setSort(sortSelect.value);
          });
        }

        _render();

        // Wire Add button
        var addBtn = document.getElementById('todo-add');
        if (addBtn) {
          addBtn.addEventListener('click', function() {
            var input = document.getElementById('todo-input');
            if (input) TodoManager.addTask(input.value);
          });
        }

        // Wire Enter key on input
        var todoInput = document.getElementById('todo-input');
        if (todoInput) {
          todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              TodoManager.addTask(todoInput.value);
            }
          });
        }
      }
    };
  })();

  // ─── QuickLinks ────────────────────────────────────────────────────────────
  // Manages the links array. Same pattern as TodoManager — in-memory array,
  // persist on mutation, render is pure function of array.
  // Requirements 10.1–10.8

  var QuickLinks = (function() {
    var links = [];

    /**
     * Persist current links array to storage.
     */
    function _persist() {
      Storage.save(KEYS.LINKS, links);
    }

    /**
     * Re-render the #links-list from the current links array.
     */
    function _render() {
      var container = document.getElementById('links-list');
      if (!container) return;

      container.innerHTML = '';

      links.forEach(function(link) {
        var wrapper = document.createElement('div');
        wrapper.className = 'link-item';

        var anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = link.label;

        var deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
          QuickLinks.deleteLink(link.id);
        });

        wrapper.appendChild(anchor);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
      });
    }

    return {
      /**
       * Add a new link. Rejects empty label, empty URL, or non-http(s) URLs.
       * @param {string} label
       * @param {string} url
       */
      addLink: function(label, url) {
        if (!label || !label.trim()) return;
        if (!url || !url.trim()) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) return;

        var link = {
          id: Date.now().toString(),
          label: label.trim(),
          url: url.trim()
        };

        links.push(link);
        _persist();
        _render();
      },

      /**
       * Delete a link by id.
       * @param {string} id
       */
      deleteLink: function(id) {
        links = links.filter(function(l) { return l.id !== id; });
        _persist();
        _render();
      },

      /**
       * Initialize: load links, render, wire controls.
       */
      init: function() {
        links = Storage.load(KEYS.LINKS) || [];
        _render();

        var addBtn = document.getElementById('link-add');
        if (addBtn) {
          addBtn.addEventListener('click', function() {
            var labelInput = document.getElementById('link-label');
            var urlInput   = document.getElementById('link-url');
            if (!labelInput || !urlInput) return;

            var label = labelInput.value;
            var url   = urlInput.value;

            // Validate before adding
            if (!label.trim()) return;
            if (!url.trim()) return;
            if (!url.startsWith('http://') && !url.startsWith('https://')) return;

            QuickLinks.addLink(label, url);

            // Clear inputs after successful add
            labelInput.value = '';
            urlInput.value   = '';
          });
        }
      }
    };
  })();

  // ─── Test Exports ──────────────────────────────────────────────────────────
  // Expose pure functions for property-based tests without polluting globals.
  // Only attached when running in a browser environment.
  if (typeof window !== 'undefined') {
    window._testExports = {
      _getGreeting:     GreetingWidget._getGreeting,
      _timerTransition: _timerTransition,
      _sortTasks:       _sortTasks,
      _saveName:        GreetingWidget._saveName,
      _loadName:        GreetingWidget._loadName,
      TodoManager:      TodoManager   // for property tests 6, 10
    };
  }

  // ─── Initialisation ────────────────────────────────────────────────────────
  // ThemeManager.init() is called immediately (before DOMContentLoaded) to
  // apply the persisted theme and prevent flash of unstyled content (FOUC).
  // All other module inits run after the DOM is ready.
  ThemeManager.init();

  document.addEventListener('DOMContentLoaded', function() {
    GreetingWidget.init();
    FocusTimer.init();
    TodoManager.init();
    QuickLinks.init();
  });

})();
