# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sawyer's RPG Game is a browser-based RPG that has been **fully migrated from vanilla JavaScript to React + TypeScript**. The game features a component-based architecture with Context API for state management, comprehensive cloud save functionality with Firebase, and headless test automation using Puppeteer.

## Current Architecture

The project uses a **pure React architecture** with the following key characteristics:

- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Context API** (`ReactGameContext`) for centralized game state management
- **Atomic Design Pattern**: Components organized as atoms, molecules, and organisms
- **Firebase** integration for cloud saves and authentication
- **localStorage** for local save persistence
- **Lazy loading** for performance optimization

## Project Structure

### Core Application Files

- **`index.html`** — Main entry point that loads the React app
- **`src/main.tsx`** — React bootstrap with error handling and initialization
- **`src/ReactApp.tsx`** — Main React application component with game loop
- **`vite.config.ts`** — Vite configuration for development and build

### React Architecture (`src/`)

#### Contexts
- **`contexts/ReactGameContext.tsx`** — Central game state management with useReducer
  - Player state (HP, MP, experience, gold, stats, equipment)
  - World state (current area, unlocked areas, quests)
  - Combat state (current enemy, battle status)
  - Inventory management
  - Save/load functionality
  - Combat rewards system with loot generation

#### Components (Atomic Design)

**Atoms** (`components/atoms/`)
- `Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx`, `Tooltip.tsx`
- `LoadingSpinner/` — Loading indicators
- `EmailVerificationBadge.tsx`, `HelpTooltip.tsx`

**Molecules** (`components/molecules/`)
- `CharacterClassCard.tsx` — Character selection cards
- `AreaCard.tsx` — Area display with unlock requirements
- `SaveSlotCard.tsx` — Save game slots
- `ItemCard.tsx`, `CreatureCard.tsx` — Inventory/creature display
- `AutoSaveIndicator.tsx` — Save status display
- `NetworkStatusIndicator.tsx`, `QuotaStatusIndicator.tsx`

**Organisms** (`components/organisms/`)
- `MainMenu.tsx` — Main menu with save/load/settings
- `CharacterSelection.tsx` — Class selection screen
- `WorldMap.tsx` — Area navigation and exploration
- `AreaExploration.tsx` — Area exploration with encounter system (70-75% monster rate)
- `Combat.tsx` — Turn-based combat system with victory modal
- `InventoryScreen.tsx`, `InventoryManager.tsx` — Inventory management
- `CreatureScreen.tsx` — Monster collection and breeding
- `StatsScreen.tsx`, `EquipmentScreen.tsx` — Character management
- `SaveLoadManager.tsx` — Local and cloud save management
- `CloudSaveManager.tsx` — Firebase cloud save integration

#### Custom Hooks (`hooks/`)
- `useGameState.ts` — Game state accessor
- `useAutoSave.ts`, `useSaveSystem.ts` — Save management
- `useCloudSave.ts`, `useSaveRecovery.ts` — Cloud functionality
- `usePerformanceMonitor.ts` — Performance tracking
- `useResponsive.ts`, `useSwipeGestures.ts` — UI interactions

#### Types (`types/`)
- Type definitions for game entities (Player, Area, Monster, Item, etc.)
- `inventory.ts`, `creatures.ts`, `experience.ts`, `saveSystem.ts`

#### Utilities (`utils/`)
- `autoSave.ts` — Auto-save manager
- `performanceMonitor.ts` — Performance tracking
- `indexedDbManager.ts` — IndexedDB for local storage
- `dataLoader.ts` — Game data loading
- `validation.ts` — Data validation utilities

### Legacy Files (Maintained for Compatibility)

- **`public/data/*.js`** — Game data files (areas, monsters, items, characters, story)
  - Still used by the React app through data loaders
  - Contains vanilla JS data structures loaded at runtime
- **`js/`** — Legacy vanilla JS modules (mostly deprecated)
- **`tests/`** — Legacy in-browser test harness (still functional)

### Documentation

- **`docs/firebase-setup.md`** — Firebase configuration guide
- **`docs/ui-module-conventions.md`** — Legacy UI module patterns (historical reference)
- **`docs/playtest_analysis.md`** — Game balance and testing notes
- **`ARCHITECTURE-CHANGE.md`** — Migration notes from vanilla JS to React

## Development Setup

### Prerequisites

- **Node.js** LTS (v18+ recommended)
- **npm** (comes with Node.js)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Runs Vite dev server at `http://localhost:3000/` with hot module reload

3. **Build for production:**
   ```bash
   npm run build
   ```
   Creates optimized production build in `dist/`

4. **Run tests:**
   ```bash
   npm run test:headless    # Puppeteer headless tests
   npm test                  # Jest unit tests
   npm run test:watch        # Jest watch mode
   ```

5. **Code quality:**
   ```bash
   npm run lint             # ESLint check
   npm run lint:fix         # Auto-fix lint issues
   npm run format           # Prettier formatting
   ```

## Current Status & Features

### ✅ Implemented Features

- **Full React Migration**: Complete port from vanilla JS to React + TypeScript
- **State Management**: Centralized game state with Context API and useReducer
- **Combat System**: Turn-based combat with victory modal and rewards
  - Equipment drops (15% chance): weapons, armor, accessories
  - Consumable drops (40% chance): potions, materials
  - Rare items (5% chance): high-tier equipment for level 5+ enemies
  - Monster-specific drops (30% chance): slime gel, goblin teeth, wolf pelts
- **Area Progression**: Clear unlock requirements display (level, story, completion)
- **High Encounter Rates**: 70-75% monster encounter rate for engaging gameplay
- **Save System**:
  - Local saves with localStorage (5 save slots)
  - Auto-save with configurable intervals
  - Cloud saves with Firebase integration
  - Save recovery and conflict resolution
- **Inventory System**: Complete item management with equipment, consumables, materials
- **Monster Collection**: Creature capture and breeding mechanics
- **Character Classes**: Multiple playable classes with unique stats and abilities
- **World Exploration**: Multiple areas with unlock progression
- **Responsive Design**: Works on desktop and mobile devices

### 🚧 In Progress

- Quest system integration
- Story progression implementation
- Advanced monster breeding mechanics
- Performance optimizations for large inventories

## Coding Conventions

### React & TypeScript

- **Functional components** with hooks (no class components)
- **TypeScript** for all new code with strict type checking
- **Props interfaces** defined inline or at the top of component files
- **Hooks organization**:
  - Custom hooks in `src/hooks/`
  - Keep hooks focused and single-purpose
  - Use `useCallback` and `useMemo` for performance optimization

### Component Structure

- Follow **Atomic Design** pattern:
  - **Atoms**: Basic building blocks (buttons, inputs, cards)
  - **Molecules**: Simple combinations of atoms (character cards, item cards)
  - **Organisms**: Complex UI sections (menus, combat, inventory)
- Keep components **focused** (generally 100-300 lines)
- Extract complex logic into custom hooks
- Use **composition** over inheritance

### State Management

- **Context API** for global state (game state, auth state)
- **useState** for local component state
- **useReducer** for complex state logic
- Avoid prop drilling by using contexts appropriately

### Styling

- CSS modules preferred (when PostCSS is configured)
- Inline styles for dynamic/conditional styling
- Theme variables in `src/styles/theme.css`
- Global styles in `src/styles/global.css`

### File Naming

- Components: `PascalCase.tsx` (e.g., `MainMenu.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useGameState.ts`)
- Types: `camelCase.ts` (e.g., `inventory.ts`)
- Utilities: `camelCase.ts` (e.g., `autoSave.ts`)
- Tests: `*.test.tsx` or `*.test.ts`

## Testing

### Headless Tests

- **Puppeteer** tests for end-to-end scenarios
- Run with `npm run test:headless`
- Test file: `scripts/headless-test.js`
- Tests both vanilla JS (legacy) and React implementations

### Unit Tests

- **Jest** with React Testing Library
- Run with `npm test`
- Test files located next to components: `*.test.tsx`
- Focus on component behavior and user interactions

### Test Guidelines

- **Write tests for**:
  - User interactions (clicks, form submissions)
  - State changes and side effects
  - Error handling and edge cases
  - Integration between components
- **Test file structure**:
  - Setup and teardown
  - Arrange, Act, Assert pattern
  - Descriptive test names

## Common Tasks

### Adding a New Feature

1. **Plan the component hierarchy**: Determine if it's an atom, molecule, or organism
2. **Create TypeScript interfaces**: Define types for props and state
3. **Implement the component**: Use functional components with hooks
4. **Connect to game state**: Use `useGameState()` hook for global state access
5. **Style the component**: Use CSS modules or inline styles
6. **Add tests**: Write unit tests for the component
7. **Update documentation**: Add notes to relevant docs

### Modifying Game State

1. **Update types**: Modify interfaces in `contexts/ReactGameContext.tsx`
2. **Add reducer action**: Define action type and handler in the reducer
3. **Create action creator**: Add function to dispatch the action
4. **Update context provider**: Export new action creators
5. **Test thoroughly**: Ensure state updates work correctly

### Adding a New Game Mechanic

1. **Define data structures**: Add types in `types/` directory
2. **Create game logic**: Add pure functions in `utils/`
3. **Update game state**: Add state and actions to `ReactGameContext`
4. **Build UI components**: Create necessary atoms/molecules/organisms
5. **Connect to state**: Use context hooks to wire everything together
6. **Add data**: Update `public/data/*.js` files if needed
7. **Test end-to-end**: Use Puppeteer tests for full workflow

## Firebase & Cloud Saves

- **Configuration**: See `docs/firebase-setup.md` for setup instructions
- **Environment variables**: Use `.env.local` for Firebase config (not committed)
- **Auth Context**: `contexts/AuthContext.tsx` manages authentication state
- **Cloud saves**: Implemented in `hooks/useCloudSave.ts` and related components

## Performance Considerations

- **Lazy loading**: Large components are lazy-loaded (see `components/lazy/`)
- **Memoization**: Use `React.memo()`, `useMemo()`, and `useCallback()` appropriately
- **Virtual scrolling**: Large lists use `LazyVirtualizedGrid` component
- **Performance monitoring**: Built-in performance tracker in `utils/performanceMonitor.ts`
- **Code splitting**: Vite handles automatic code splitting for production builds

## PR/Change Guidelines

- **Commit messages**: Clear, descriptive (e.g., "feat: add combat rewards system")
- **Small PRs**: Focus on one feature or fix per PR
- **Type safety**: Ensure TypeScript compiles without errors (`npm run build`)
- **Test coverage**: Add/update tests for changed functionality
- **Code quality**: Run `npm run lint:fix` and `npm run format` before committing
- **Documentation**: Update CLAUDE.md or relevant docs when architecture changes

## Migration Notes

This project was migrated from vanilla JavaScript to React. Some legacy code remains for compatibility:

- **Vanilla JS data files** (`public/data/`) are still used
- **Legacy tests** (`tests/`) provide validation for backwards compatibility
- **Hybrid entry point** (`index-hybrid-backup.html`) exists for reference

New features should be implemented in **React only**. The vanilla JS codebase is maintained but deprecated.

## Troubleshooting

### Common Issues

- **`useCallback is not defined`**: Ensure React imports include `useCallback`
- **TypeScript errors**: Run `npm run build` to catch type errors early
- **Hot reload not working**: Restart dev server with `npm run dev`
- **Firebase errors**: Check `.env.local` configuration and Firebase console settings
- **Test failures**: Ensure headless Chrome is installed: `npx puppeteer install`

### Debug Tools

- React DevTools browser extension recommended
- Performance monitor accessible in dev mode
- Console logs use emoji prefixes for easy filtering (🎮, ✅, ❌, 🔍, etc.)

## Contact & Support

For questions or issues:
- Check existing documentation in `docs/`
- Review recent commit history for context
- Create detailed issue reports with reproduction steps