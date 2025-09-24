# Sawyer's RPG Game - React Port

## 🚀 Project Overview

This is a React port of Sawyer's RPG Game, originally built in vanilla JavaScript. The React version maintains full backward compatibility with the existing vanilla JS game engine while providing a modern development experience with React, TypeScript, and Vite.

## 🏗️ Architecture

### Hybrid Architecture Design

The React port uses a **hybrid architecture** that combines:

- **React Frontend**: Modern UI components, state management, and development tools
- **Vanilla JS Game Engine**: Preserved game logic, physics, and core systems
- **Communication Bridge**: Seamless integration between React and vanilla JS

```
┌─────────────────────────────────────────┐
│              React Layer                │
│  ┌─────────────┐  ┌─────────────────────┐│
│  │ UI Components│  │ Game Context/Hooks  ││
│  │ - MainMenu   │  │ - useGame()         ││
│  │ - GameHUD    │  │ - usePlayer()       ││
│  │ - Settings   │  │ - useUI()           ││
│  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────┘
           │ Communication Bridge │
┌─────────────────────────────────────────┐
│            Vanilla JS Engine            │
│  ┌─────────────┐  ┌─────────────────────┐│
│  │ Game Logic  │  │ Original Systems    ││
│  │ - GameState │  │ - Combat            ││
│  │ - UIManager │  │ - Inventory         ││
│  │ - Canvas    │  │ - Save System       ││
│  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────┘
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Modern browser with ES2020+ support

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   This starts Vite dev server at http://localhost:3001

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   # React port tests (new)
   npm run test:react

   # Original vanilla JS tests
   npm run test:headless
   ```

5. **Code Quality**
   ```bash
   npm run lint          # Check code quality
   npm run lint:fix      # Auto-fix issues
   npm run format        # Format with Prettier
   ```

## 📁 Project Structure

### New React Architecture

```
src/
├── components/          # React UI components
│   ├── ui/             # Game-specific UI components
│   │   ├── MainMenu.tsx
│   │   ├── GameHUD.tsx
│   │   └── ...
│   ├── GameCanvas.tsx  # Canvas integration
│   ├── ReactUI.tsx     # Main UI coordinator
│   └── LoadingScreen.tsx
├── contexts/           # React Context API
│   └── GameContext.tsx # Game state management
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
│   └── game.ts         # Game type interfaces
├── utils/              # Utility functions
│   ├── gameLoader.ts   # Module loading
│   └── vanillaBridge.ts # React-Vanilla bridge
├── App.tsx             # Main React app
└── main.tsx            # Entry point
```

### Preserved Vanilla Structure

```
js/                     # Original game engine (preserved)
├── ui/                 # Original UI modules
├── game.js            # Main game class
├── gameState.js       # Game state manager
├── combat.js          # Combat system
└── ...                # Other game systems

data/                   # Game data (preserved)
├── areas.js
├── monsters.js
├── items.js
└── ...

tests/                  # Original tests (preserved)
├── test-framework.js
└── *.test.js
```

## 🔗 React-Vanilla Integration

### Game Context API

The `GameContext` provides React components with access to vanilla game state:

```typescript
import { useGame, usePlayer, useUI } from './contexts/GameContext';

function MyComponent() {
  const { gameInstance, gameState, isGameLoaded } = useGame();
  const player = usePlayer();
  const { currentScreen, showScreen } = useUI();

  // Use game data in React components
  return <div>Level: {player?.level}</div>;
}
```

### Communication Bridge

The `vanillaBridge` enables safe bidirectional communication:

```typescript
import { vanillaBridge } from './utils/vanillaBridge';

// Listen to game events
vanillaBridge.on('player:levelup', (level) => {
  console.log('Player reached level', level);
});

// Call game methods safely
const gameState = await vanillaBridge.getGameState();
await vanillaBridge.callGameMethod('saveGame');
```

### Canvas Integration

React manages the canvas element while preserving vanilla rendering:

```typescript
// React component wraps canvas
<GameCanvas />

// Vanilla JS renders to the same canvas
gameInstance.ctx.fillRect(0, 0, 800, 600);
```

## 🧪 Testing Strategy

### React Port Tests

New testing infrastructure specifically for the React version:

- **Smoke Tests**: Basic React app functionality
- **Integration Tests**: React-Vanilla communication
- **UI Tests**: Component rendering and interaction
- **Compatibility Tests**: Ensures vanilla game still works

```bash
npm run test:react
```

### Original Tests Preserved

All existing vanilla JS tests continue to work:

```bash
npm run test:headless
```

## 🎯 Benefits of React Port

### Developer Experience
- ✅ **TypeScript**: Full type safety for game development
- ✅ **Hot Reload**: Instant development feedback
- ✅ **Modern Tooling**: ESLint, Prettier, Vite bundling
- ✅ **Component Architecture**: Reusable, maintainable UI

### Maintainability
- ✅ **Modular Components**: UI broken into focused components
- ✅ **State Management**: Centralized with React Context
- ✅ **Type Safety**: Catch errors at compile time
- ✅ **Code Quality**: Automated linting and formatting

### Compatibility
- ✅ **Zero Breaking Changes**: Original game logic unchanged
- ✅ **Gradual Migration**: Can migrate UI pieces incrementally
- ✅ **Test Coverage**: Both old and new tests continue working
- ✅ **Asset Compatibility**: All existing game assets preserved

## 📈 Migration Progress

### ✅ Completed (Phase 1)

- [x] Vite + React + TypeScript setup
- [x] Game Context and state management
- [x] Canvas integration with React
- [x] Main Menu React component
- [x] Game HUD React component
- [x] Communication bridge infrastructure
- [x] Updated testing framework
- [x] ESLint + Prettier configuration

### 🚧 Phase 2 Opportunities

Future enhancements you could implement:

- [ ] **Settings UI**: Migrate complex settings screen to React
- [ ] **Inventory System**: Convert inventory management to React
- [ ] **Combat Interface**: Modernize battle UI with React
- [ ] **Monster Management**: Update monster screens
- [ ] **Story System**: Enhance dialogue with React components
- [ ] **World Map**: Interactive React-based world map
- [ ] **Save/Load**: Modern file management interface

## 🚀 Next Steps

### Immediate (Ready to Use)
1. Run `npm run dev` to start development
2. The game is fully playable in React
3. Begin migrating UI components as needed

### Short Term (1-2 weeks)
1. Convert Settings screen to React
2. Add React Testing Library for component tests
3. Implement error boundaries for stability

### Long Term (1-3 months)
1. Migrate all major UI screens to React
2. Add state management library (Redux Toolkit)
3. Implement React-based save system
4. Add accessibility features

## 💡 Best Practices

### When Adding New Features

1. **Start with React**: New UI should be built as React components
2. **Use Context**: Access game state through React Context
3. **Type Everything**: Leverage TypeScript for safety
4. **Test Both Sides**: Test React components and vanilla integration

### When Modifying Existing Code

1. **Preserve Vanilla**: Don't break existing game logic
2. **Bridge Carefully**: Use vanillaBridge for communication
3. **Test Thoroughly**: Run both test suites
4. **Migrate Gradually**: Convert UI piece by piece

## 🐛 Troubleshooting

### Game Not Loading
- Check browser console for errors
- Ensure all vanilla JS modules loaded correctly
- Verify Canvas element is present

### React-Vanilla Communication Issues
- Use vanillaBridge methods instead of direct window access
- Check that game initialization completed before calling methods
- Monitor browser console for bridge connection status

### Development Server Issues
- Try different port if 3001 is occupied
- Clear node_modules and reinstall if dependencies conflict
- Check that all required files exist

## 🤝 Contributing

The React port maintains the same contribution guidelines as the original game. When contributing:

1. Maintain backward compatibility
2. Add TypeScript types for new features
3. Include tests for both React and vanilla code
4. Follow the established code style

---

**🎮 Happy Coding!** The React port gives you the best of both worlds - modern development tools with a proven game engine. Start building amazing features for Sawyer! ⚔️✨