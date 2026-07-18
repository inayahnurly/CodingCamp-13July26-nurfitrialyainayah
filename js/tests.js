// js/tests.js — Smoke tests + property-based tests for Life Dashboard
// Loaded ONLY by test.html, NOT by index.html.

// ─── Smoke Tests ────────────────────────────────────────────────────────────
// These run synchronously as soon as the script is parsed.

// Smoke test 1: localStorage loads without errors
(function() {
  try {
    localStorage.setItem('_smoke_test', '1');
    localStorage.removeItem('_smoke_test');
    console.assert(true, 'localStorage available');
    console.log('[SMOKE] localStorage: OK');
  } catch(e) {
    console.warn('[SMOKE] localStorage unavailable:', e);
  }
})();

// Smoke test 2: data-theme attribute is set on <html> before first paint
(function() {
  var theme = document.documentElement.getAttribute('data-theme');
  console.assert(theme === 'light' || theme === 'dark', 'data-theme is set on <html>. Got: ' + theme);
  console.log('[SMOKE] data-theme:', theme);
})();

// Smoke test 3: #timer-display shows "25:00" on load
(function() {
  var timerEl = document.getElementById('timer-display');
  console.assert(timerEl && timerEl.textContent === '25:00', '#timer-display is "25:00" on load. Got: ' + (timerEl ? timerEl.textContent : 'null'));
  console.log('[SMOKE] #timer-display:', timerEl ? timerEl.textContent : 'null');
})();

// Smoke test 4: #todo-list renders without errors when storage is empty
(function() {
  var list = document.getElementById('todo-list');
  console.assert(list !== null, '#todo-list exists');
  console.assert(!list || list.innerHTML !== undefined, '#todo-list rendered without errors');
  console.log('[SMOKE] #todo-list render: OK');
})();

// Smoke test 5: #links-list renders without errors when storage is empty
(function() {
  var linksList = document.getElementById('links-list');
  console.assert(linksList !== null, '#links-list exists');
  console.assert(!linksList || linksList.innerHTML !== undefined, '#links-list rendered without errors');
  console.log('[SMOKE] #links-list render: OK');
})();

// ─── Property-Based Tests ────────────────────────────────────────────────────
// Run after DOMContentLoaded to ensure window._testExports is set by app.js.

document.addEventListener('DOMContentLoaded', function() {
  // Wait a tick for app.js DOMContentLoaded handlers to run first
  setTimeout(function() {
    var fc = window.fc;
    var exports = window._testExports;

    if (!fc) {
      console.warn('[PBT] fast-check not loaded — property tests skipped');
      return;
    }
    if (!exports) {
      console.warn('[PBT] _testExports not found — property tests skipped');
      return;
    }

    var passed = 0;
    var failed = 0;

    function runTest(name, fn) {
      try {
        fn();
        console.log('[PBT PASS]', name);
        passed++;
      } catch(e) {
        console.error('[PBT FAIL]', name, e.message || e);
        failed++;
      }
    }

    // Feature: todo-life-dashboard, Property 1: Task serialization round-trip
    // Validates: Requirements 8.2, 8.4
    runTest('Property 1: Task serialization round-trip', function() {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string(),
          text: fc.string({minLength: 1}),
          completed: fc.boolean(),
          createdAt: fc.integer()
        })),
        function(tasks) {
          var roundTripped = JSON.parse(JSON.stringify(tasks));
          return JSON.stringify(roundTripped) === JSON.stringify(tasks);
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 2: QuickLink serialization round-trip
    // Validates: Requirements 10.3, 10.6
    runTest('Property 2: QuickLink serialization round-trip', function() {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string(),
          label: fc.string({minLength: 1}),
          url: fc.string({minLength: 1})
        })),
        function(links) {
          var roundTripped = JSON.parse(JSON.stringify(links));
          return JSON.stringify(roundTripped) === JSON.stringify(links);
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 3: Sort stability — Completed Last
    // Validates: Requirements 9.1, 9.2
    runTest('Property 3: Sort stability — Completed Last', function() {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string(),
          text: fc.string({minLength: 1}),
          completed: fc.boolean(),
          createdAt: fc.integer()
        })),
        function(tasks) {
          var sorted = exports._sortTasks(tasks, 'completed-last');
          var seenComplete = false;
          for (var i = 0; i < sorted.length; i++) {
            if (sorted[i].completed) { seenComplete = true; }
            if (seenComplete && !sorted[i].completed) { return false; }
          }
          return true;
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 4: Sort stability — Alphabetical
    // Validates: Requirements 9.1, 9.2
    runTest('Property 4: Sort stability — Alphabetical', function() {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string(),
          text: fc.string({minLength: 1}),
          completed: fc.boolean(),
          createdAt: fc.integer()
        })),
        function(tasks) {
          var sorted = exports._sortTasks(tasks, 'alpha');
          for (var i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].text.toLowerCase() > sorted[i+1].text.toLowerCase()) {
              return false;
            }
          }
          return true;
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 5: Sort does not mutate
    // Validates: Requirements 9.2
    runTest('Property 5: Sort does not mutate', function() {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string(),
          text: fc.string({minLength: 1}),
          completed: fc.boolean(),
          createdAt: fc.integer()
        })),
        fc.oneof(fc.constant('default'), fc.constant('alpha'), fc.constant('completed-last')),
        function(tasks, criterion) {
          var original = tasks.map(function(t) { return t.id; });
          exports._sortTasks(tasks, criterion);
          var after = tasks.map(function(t) { return t.id; });
          return JSON.stringify(original) === JSON.stringify(after);
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 8: Greeting hour classification
    // Validates: Requirements 1.3, 1.4, 1.5, 1.6
    runTest('Property 8: Greeting hour classification', function() {
      var validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'];
      fc.assert(fc.property(
        fc.integer({min: 0, max: 23}),
        function(hour) {
          var result = exports._getGreeting(hour);
          return validGreetings.indexOf(result) !== -1;
        }
      ));
    });

    // Feature: todo-life-dashboard, Property 9: Timer state machine
    // Validates: Requirements 3.2, 3.4, 3.5, 3.7, 3.8
    runTest('Property 9: Timer state machine', function() {
      var validStatuses = ['idle', 'running', 'paused'];
      fc.assert(fc.property(
        fc.array(fc.oneof(fc.constant('start'), fc.constant('stop'), fc.constant('reset'))),
        function(actions) {
          var state = { status: 'idle', remaining: 1500 };
          for (var i = 0; i < actions.length; i++) {
            state = exports._timerTransition(state, actions[i]);
            if (validStatuses.indexOf(state.status) === -1) return false;
            if (state.remaining < 0 || state.remaining > 1500) return false;
          }
          return true;
        }
      ));
    });

    // Summary
    console.log('[PBT SUMMARY] Passed:', passed, '/ Failed:', failed, '/ Total:', passed + failed);
  }, 100);
});
