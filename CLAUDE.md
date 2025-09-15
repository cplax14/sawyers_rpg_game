# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sawyer's RPG Game is a browser-based RPG built with vanilla JavaScript, HTML, and CSS. The codebase has been refactored into a modular UI architecture under `js/ui/` with headless test automation. The game can be run via `index.html` and validated using a Puppeteer-driven headless test suite.

## Project Structure

Key paths and modules:

- `index.html` — Main entry point and script loader for the modular UI stack.
- `js/game.js` — Game bootstrap, main loop, and system initialization.
- `js/gameState.js` — Core game state (player, world, inventory, combat, story).
- `js/ui/` — Modular UI system:
  - `UIManager.js` — Module lifecycle, events, scenes, coordination.
  - `BaseUIModule.js` — Standard lifecycle and helpers for UI modules.
  - `MenuUI.js`, `GameWorldUI.js`, `CombatUI.js`, `MonsterUI.js`, `InventoryUI.js`, `SettingsUI.js`, `StoryUI.js` — Feature UIs.
  - `UIHelpers.js`, `UIModuleLoader.js`, `TransitionController.js`, `NotificationBridge.js`, `SceneManager.js` — Shared UI infrastructure.
- `data/*.js` — Game data (areas, monsters, items, characters, story).
- `tests/` — In-browser tests run via a custom harness (`tests/test-runner.html`) and Puppeteer automation.
- `docs/ui-module-conventions.md` — Module patterns and migration guidance.
- `tasks/` — Project planning and refactoring checklists.

## Development Setup

Prerequisites:

- Node.js LTS (for running headless tests with Puppeteer)
- Any static HTTP server (optional, only needed for manual browser testing)

Recommended flow:

1) Open `index.html` in a browser to run the game locally.
2) Use the headless test suite for regressions:

```
npm run test:headless
```

This will serve the project and execute `tests/test-runner.html` in headless Chromium.

## Current Status

- Modular UI architecture completed and wired into `index.html`.
- Full `SettingsUI` implemented: category switching, data binding, validation, keybinding capture, import/export.
- `StoryUI` implemented: dialogue nodes, choices, `GameState.processStoryChoice()` integration.
- Legacy `js/ui.js` removed; migration documented in `docs/ui-module-conventions.md`.
- Headless tests pass (see `tests/` and `npm run test:headless`).

## Notes

- UI module conventions, lifecycle, and migration: see `docs/ui-module-conventions.md`.
- When adding a new UI feature, create a module in `js/ui/` extending `BaseUIModule`, preload it in `index.html`, and add/adjust tests under `tests/`.
- Keep minimal-DOM resilience for tests (modules should guard missing elements or create minimal nodes where appropriate).

## Coding Conventions

- Vanilla JS, ES5/ES6 compatible for broad browser support.
- Keep modules focused (generally 200–500 lines). Use helpers in `UIHelpers.js`.
- Never place imports mid-file; scripts are loaded via script tags in `index.html`.
- Add descriptive logging only where helpful; prefer tests for behavior guarantees.

## Testing

- Tests live under `tests/` and run in the browser via `tests/test-runner.html`.
- Headless automation uses Puppeteer: `npm run test:headless`.
- When fixing bugs or adding features, add or update tests accordingly.

## PR/Change Guidelines

- Maintain behavior parity when refactoring; validate with headless tests.
- Prefer small, incremental commits with clear messages.
- Update `tasks/` checklists and `docs/*` when workflows or architecture changes.
- Development tooling and dependencies will need to be established as the project grows