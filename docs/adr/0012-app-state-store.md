# 0012. Centralize Reactive Global State and Event Bus into AppStateStore

## Status
Accepted

## Context
Global application states (such as active language `currentLang`, dark/light theme `currentTheme`, active tab `activeTab`, environment baseline preset, and parameter dirty status) were managed directly as mutable public properties on `window.app` in `app.js` and partially in `app-ui.js` and `preset-state-manager.js`. Controllers directly accessed `this.app.currentLang` and manually invoked methods across controllers (e.g., `this.builderTab.previewUI.updateEquationPreview()`, `this.lookupTab.render()`, `this.equationsTab.render()`). This created a tightly coupled, circular mesh where controllers could not be tested or isolated without instantiating the entire UI shell.

## Decision
1. Extract a pure, singleton deep module `AppStateStore` in `js/app-state-store.js`.
2. Encapsulate all global application state (`lang`, `theme`, `activeTab`, `activeEnvironment`, `isDirty`) as private variables within `AppStateStore`.
3. Provide single-source-of-truth mutation methods: `setLanguage()`, `toggleLanguage()`, `setTheme()`, `toggleTheme()`, `setActiveTab()`, `setEnvironment()`, and `setDirty()`.
4. Provide fine-grained reactive subscriptions (`subscribe(listener)` and `subscribeKey(key, listener)`) and an integrated event bus (`on()`, `off()`, `emit()`).
5. Encapsulate automatic persistence to `localStorage` safely with headless fallbacks.
6. Demote `app.js` and `app-ui.js` to pure store subscribers, eliminating circular inter-controller render calls.
7. Establish an automated headless unit test suite (`tests/test-app-state-store.js`) verifying state transitions, subscription notifications, event bus dispatch, and snapshot immutability.
