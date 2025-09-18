# Combat Button Troubleshooting Documentation

## Issue Summary
**Problem**: Combat action buttons (Attack, Magic, Items, Capture, Flee) were becoming disabled/grayed-out intermittently during combat turns, preventing players from taking actions.

**User Report**: "During the first turn, the attack button works as intended. However, during the second turn, the buttons are still grayed out and I can't click them."

## Root Cause Analysis

### Initial Theories Investigated
1. **Scene-to-Module Communication**: Initially suspected that `CombatUI.show()` wasn't being called on second combat encounters
2. **Combat State Initialization**: Found that `currentTurn` was being set to numeric `0` instead of string `'player'`
3. **CSS Styling Conflicts**: Discovered CSS `:disabled` rules were overriding JavaScript styles
4. **Method Execution Order**: Conflicting methods were overriding button states
5. **Scene-to-Module Registration**: **ACTUAL ROOT CAUSE** - `UIManager.getModulesForScene()` was looking for the wrong property

### Key Diagnostic Findings

#### 1. Combat Initialization Issue (FIXED)
**Problem**: `gameState.js` was initializing combat with `currentTurn = 0` (numeric) instead of `'player'` (string)
**Location**: `/js/gameState.js` lines 1063 and 1077
**Fix Applied**:
```javascript
// Before
this.combat.currentTurn = 0;

// After
this.combat.currentTurn = 'player'; // Set to 'player' instead of numeric 0
```

#### 2. Scene-to-Module Registration (ACTUAL ROOT CAUSE - FIXED)
**Problem**: `UIManager.getModulesForScene()` was checking for `module.config.scenes` but modules store configuration in `module.options.scenes`
**Location**: `/js/ui/UIManager.js` line 232
**Diagnostic Evidence**:
- Console logs showed `🎯 Checking module CombatUI: config= undefined scenes= undefined`
- All modules returned `config= undefined` despite having proper `options.scenes` configuration
- This prevented `CombatUI.show()` from being called for subsequent encounters

**Fix Applied**:
```javascript
// Before (BROKEN)
if (module.config && module.config.scenes && module.config.scenes.includes(sceneName)) {

// After (FIXED)
if (module.options && module.options.scenes && module.options.scenes.includes(sceneName)) {
```

#### 3. Player HP Reset Enhancement (FIXED)
**Problem**: Player HP was not being reset between combat encounters
**Location**: `/js/gameState.js` initializeCombat() method
**Fix Applied**: Added `this.player.fullHeal()` to ensure player starts each combat with full HP

#### 4. Scene Transition Loop (INTRODUCED & FIXED)
**Problem**: MenuUI.show() was calling this.showScene() causing infinite loops
**Location**: `/js/ui/MenuUI.js` line 88
**Fix Applied**: Removed scene transition call from module show() method - modules should only update internal state, not trigger scene changes

## Files Modified

### 1. `/js/ui/UIManager.js` (PRIMARY FIX)
- **Line 232**: Fixed `getModulesForScene()` to check `module.options.scenes` instead of `module.config.scenes`
- This was the root cause - scene-to-module registration was completely broken

### 2. `/js/gameState.js`
- **Line 1061-1063**: Added `this.player.fullHeal()` to `initializeCombat()` for HP reset between encounters
- **Line 1068**: Ensured `this.combat.currentTurn = 'player'` (string, not numeric)

### 3. `/js/ui/MenuUI.js`
- **Line 87-88**: Removed `this.showScene(sceneName)` call from `show()` method to prevent infinite loops

### 4. `/js/ui/CombatUI.js`
- **Lines 896-900**: Maintained `updateActionButtonStates()` logic to respect turn-based flow
- **Lines 1105-1110**: Kept !important style overrides for button state management

## Testing and Validation

### Diagnostic Logging Added
- `🔍 updateTurnBasedUI: currentTurn=X, isPlayerTurn=Y, isProcessing=Z`
- `🔓 Enabled button: X - inline/computed states`
- `🔒 Disabled button: X` with reasoning
- `🔄 Skipping action button state update - not player turn`

### Test Results
**Before Fix**: Alternating pattern - buttons worked on turns 1,3,5 but failed on turns 2,4,6
**After Fix**: Consistent button behavior throughout all combat turns

### Verification Checklist
- [x] Combat buttons enable/disable properly during player/enemy turns
- [x] Game logic still prevents impossible actions (no enemies, no spells, etc.)
- [x] No more alternating working/broken pattern
- [x] Second combat encounters work correctly after defeat
- [x] CSS conflicts resolved with proper disabled attribute management

## Key Lessons Learned

1. **Method Execution Order Matters**: When multiple methods modify the same DOM elements, execution order is critical
2. **CSS Specificity**: `:disabled` pseudo-class rules can override inline styles in unexpected ways
3. **Diagnostic Logging**: Comprehensive logging of both JavaScript state and computed CSS styles was essential
4. **Turn-Based Logic Separation**: UI state management methods should respect higher-level game state (turn system)

## Future Maintenance

### Watch For
- Any new methods that modify button `disabled` states should check turn logic first
- CSS rules that use `:disabled` pseudo-class should be documented
- Changes to `updateCombatDisplay()` method call order

### Architecture Notes
- Combat UI uses two-layer button management: turn-based (always) + game-logic-based (player turn only)
- Scene system and UI module system should eventually be fully integrated
- Combat state uses string values ('player', 'processing', 'enemy') not numeric indices

## Status: Resolved
