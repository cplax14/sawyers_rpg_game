# UI Module Conventions and Guidelines

This document outlines the patterns, conventions, and guidelines for implementing UI modules in Sawyer's RPG Game.

## Overview

The UI system has been refactored from a monolithic `ui.js` file into a modular architecture that promotes:

- **Separation of concerns**: Each module handles a specific UI domain
- **Maintainability**: Smaller, focused modules are easier to maintain
- **Testability**: Individual modules can be tested in isolation
- **Reusability**: Common patterns are shared through the base class
- **Consistency**: Standardized lifecycle and interface patterns

## Module Architecture

### Base Module Structure

All UI modules must extend `BaseUIModule` and follow these conventions:

```javascript
class ExampleUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('example', uiManager, options);
    }

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            // Module-specific defaults
        };
    }

    cacheElements() {
        this.elements = {
            container: document.getElementById('example-container'),
            button: document.getElementById('example-btn')
        };
        
        // Validate required elements
        this.validateElements(['example-container', 'example-btn']);
    }

    attachEvents() {
        this.addEventListener(this.elements.button, 'click', () => {
            this.handleButtonClick();
        });
    }

    setupState() {
        this.state = {
            isActive: false,
            selectedItem: null
        };
    }

    onShow(data) {
        // Module-specific show logic
        this.refreshUI();
    }

    onHide() {
        // Module-specific hide logic
        this.resetState();
    }

    onUpdate(deltaTime) {
        // Update logic if needed
    }

    onCleanup() {
        // Module-specific cleanup
    }
}
```

## Lifecycle Methods

### Required Lifecycle Methods

1. **`init()`** - Initialize the module (called automatically)
   - Cache DOM elements
   - Attach event listeners
   - Set up initial state
   - Only called once per module instance

2. **`show(data)`** - Display/activate the module
   - Called when module becomes visible
   - Receives optional data parameter
   - Should refresh UI state if needed

3. **`hide()`** - Hide/deactivate the module
   - Called when module is hidden
   - Should save any temporary state
   - Clean up temporary UI elements

4. **`cleanup()`** - Clean up resources
   - Remove event listeners
   - Clear references
   - Free memory

### Optional Lifecycle Methods

1. **`onShow(data)`** - Override for show-specific logic
2. **`onHide()`** - Override for hide-specific logic
3. **`onUpdate(deltaTime)`** - Override for update logic
4. **`onCleanup()`** - Override for cleanup-specific logic

## Naming Conventions

### Module Files
- Use PascalCase for module file names: `MenuUI.js`, `CombatUI.js`
- Module class names should match file names
- Place all modules in `js/ui/` directory

### Element IDs
- Use kebab-case for HTML element IDs: `main-menu`, `combat-actions`
- Prefix module-specific IDs with module name: `menu-start-btn`, `combat-spell-list`

### Event Names
- Use camelCase for custom events: `moduleLoaded`, `combatStarted`
- Prefix with module name for module-specific events: `menu:itemSelected`, `combat:actionChosen`

### CSS Classes
- Use kebab-case for CSS classes: `.ui-module`, `.combat-active`
- Use BEM methodology for complex components: `.combat-ui__action-bar--disabled`

## Module Communication

### Event System
Use the module event system for communication between modules:

```javascript
// Emit events
this.emit('combat:started', { enemy: enemyData });

// Listen for events
this.on('inventory:itemUsed', (data) => {
    this.handleItemUsed(data.item);
});
```

### Direct Communication
For simple communication, modules can access each other through the UIManager:

```javascript
// Get another module
const inventoryModule = this.uiManager.getModule('inventory');
if (inventoryModule) {
    inventoryModule.refreshItems();
}

// Call UIManager methods
this.uiManager.showScene('game_world');
this.showNotification('Action completed', 'success');
```

## State Management

### Module State
Each module should maintain its own state in the `this.state` object:

```javascript
setupState() {
    this.state = {
        selectedTab: 'party',
        filters: {
            type: 'all',
            level: null
        },
        sortOrder: 'name'
    };
}
```

### Game State Access
Access global game state through the provided helper:

```javascript
const gameState = this.getGameState();
if (gameState?.player?.level > 5) {
    // Show advanced options
}
```

## Error Handling

### Element Validation
Always validate required DOM elements exist:

```javascript
cacheElements() {
    this.elements = {
        container: document.getElementById('my-container')
    };
    
    this.validateElements(['my-container']);
}
```

### Error Reporting
Handle errors gracefully and provide meaningful messages:

```javascript
try {
    this.performComplexOperation();
} catch (error) {
    console.error(`Error in ${this.name} module:`, error);
    this.showNotification('Operation failed', 'error');
}
```

## Testing Guidelines

### Module Testing
Each module should have corresponding tests:

```javascript
// tests/ui/MenuUI.test.js
describe('MenuUI Module', () => {
    let menuUI, mockUIManager;
    
    beforeEach(() => {
        mockUIManager = createMockUIManager();
        menuUI = new MenuUI(mockUIManager);
    });
    
    test('should initialize correctly', () => {
        expect(menuUI.isInitialized).toBe(false);
        menuUI.init();
        expect(menuUI.isInitialized).toBe(true);
    });
});
```

### Integration Testing
Test module interactions through the UIManager:

```javascript
test('should communicate between modules', () => {
    const combat = uiManager.getModule('combat');
    const inventory = uiManager.getModule('inventory');
    
    combat.emit('itemNeeded', { type: 'potion' });
    expect(inventory.state.highlightedType).toBe('potion');
});
```

## Performance Guidelines

### Memory Management
- Clean up event listeners in `cleanup()`
- Avoid memory leaks by removing references
- Use `removeAllEventListeners()` helper

### DOM Operations
- Cache frequently accessed elements
- Batch DOM updates when possible
- Use document fragments for multiple insertions

### Event Handling
- Use event delegation for dynamic content
- Throttle or debounce high-frequency events
- Remove unused event listeners

## Module-Specific Guidelines

### MenuUI
- Handle character selection and class cards
- Manage new game flow and save/load operations
- Coordinate with settings for configuration

### CombatUI
- Manage turn-based combat interface
- Handle action selection and targeting
- Update battle log and status displays

### MonsterUI
- Handle party management and monster storage
- Manage breeding interface and selection
- Filter and sort monster lists

### InventoryUI
- Manage equipment slots and item usage
- Handle item filtering and categorization
- Update stat calculations from equipment

### GameWorldUI
- Handle world map navigation
- Manage area selection and travel
- Integrate with story system

### SettingsUI
- Manage settings categories and controls
- Handle key binding capture and validation
- Provide import/export functionality

## Migration Guidelines

### From Monolithic UI
When extracting code from the original `ui.js`:

1. Identify the code section responsible for specific functionality
2. Create new module class extending `BaseUIModule`
3. Move relevant code to appropriate lifecycle methods
4. Update references to use module pattern
5. Test functionality preservation
6. Update calling code to use new module interface

### Backward Compatibility
During migration phase:
- Maintain existing function signatures where possible
- Provide adapter methods if needed
- Keep original `ui.js` until all modules are complete
- Test thoroughly before removing legacy code

### Migration from `ui.js` (Quick Guide)

The monolithic `js/ui.js` has been replaced by the modular UI under `js/ui/`.

Follow these steps when migrating or adding new UI features:

1. Create a new module extending `BaseUIModule` in `js/ui/` (for example, `SettingsUI.js`).
2. Implement `init()`, `cacheElements()`, `attachEvents()`, and `setupState()`; add `onShow()`/`onHide()` as needed.
3. Register modules via `UIModuleLoader` (already handled by `UIManager.init()`), and ensure scripts are preloaded in `index.html`.
4. Replace any direct calls to legacy `UIManager` (from `ui.js`) with either:
   - `UIManager` methods in `js/ui/UIManager.js`, or
   - Direct module access: `uiManager.getModule('<name>')`.
5. Update `index.html` to include the modular scripts and remove `js/ui.js`.
6. Keep behavior parity: run headless tests (`npm run test:headless`) and update or add tests under `tests/` when extracting features.
7. Once parity is verified, remove any remaining references to `js/ui.js` (the file has been deleted) and update docs/tasks.

Notes:
- For minimal DOM environments (tests), modules should guard against missing elements and create bare-bones nodes if necessary.
- Use `UIHelpers` for common DOM and notification utilities rather than re-implementing them in each module.

## Common Patterns

### Modal Management
```javascript
showModal(modalId, data = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return false;
    
    this.populateModal(modal, data);
    modal.classList.remove('hidden');
    return true;
}

hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}
```

### List Management
```javascript
populateList(containerId, items, renderFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    items.forEach(item => {
        const element = renderFunction(item);
        container.appendChild(element);
    });
}
```

### Form Handling
```javascript
collectFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;
    
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
}
```

## Development Workflow

1. **Design**: Plan module responsibilities and interfaces
2. **Implement**: Create module class with required methods
3. **Test**: Write unit tests for module functionality
4. **Integrate**: Connect module to UIManager and other modules
5. **Validate**: Ensure original functionality is preserved
6. **Document**: Update this document with any new patterns

## Best Practices

### Do's
- ✅ Always extend `BaseUIModule`
- ✅ Use lifecycle methods appropriately
- ✅ Validate required elements exist
- ✅ Handle errors gracefully
- ✅ Write tests for your modules
- ✅ Use meaningful event names
- ✅ Document complex functionality

### Don'ts
- ❌ Don't access DOM elements directly without caching
- ❌ Don't create memory leaks with unremoved listeners
- ❌ Don't modify other modules' state directly
- ❌ Don't skip error handling
- ❌ Don't forget to clean up resources
- ❌ Don't break existing functionality during refactoring

## Tools and Utilities

### Available Helpers
- `this.showNotification(message, type)` - Show user notifications
- `this.getGameState()` - Access current game state
- `this.getGameReference(property)` - Access a property from the game object (e.g., `gameState`)
- `this.attachButton(buttonId, callback)` - Attach click with UIManager/UIHelpers fallback
- `this.validateElements(ids)` - Validate DOM elements exist
- `this.addEventListener(element, event, handler)` - Tracked event listeners
- `this.emit(event, data)` - Emit module events
- `this.on(event, handler)` - Listen for module events

### UIManager Methods
- `uiManager.registerModule(name, instance)` - Register new module
- `uiManager.getModule(name)` - Get module instance
- `uiManager.getAllModules()` - Map of all modules
- `uiManager.showScene(scene)` - Change current scene
- `uiManager.getCurrentScene()` - Get current scene
- `uiManager.returnToPrevious()` - Return to previous scene
- `uiManager.render(ctx)` / `uiManager.renderCanvas(ctx)` - Render entrypoints
- `uiManager.update(deltaTime)` - Update entrypoint
- `uiManager.emit(event, data)` / `uiManager.on(event, handler)` - Event bus
- `uiManager.showNotification(message, type)` - Notifications
- World map overlay helpers used by tests and validators:
  - `ensureWorldMapOverlay()`, `openWorldMapOverlay()`, `closeWorldMapOverlay()`, `showWorldMap()`
  - `populateWorldMapAreas()`, `focusWorldMapIndex()`, `handleWorldMapKeys(event)`

This document will be updated as the module system evolves and new patterns emerge.