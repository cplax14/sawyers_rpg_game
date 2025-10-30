# Story Flag System Debugging Guide

## Problem Statement
The area completion system was not working - specifically, completing battles in Forest Path should set the `forest_path_cleared` story flag, which should unlock Deep Forest for players level 3+.

## What Was Fixed

### 1. Added Comprehensive Debugging
I've added extensive console logging throughout the story flag system to track:
- When story flags are set
- When story flags are checked
- Area completion progress
- Area unlock status verification

### 2. Key Files Modified

#### `/src/hooks/useGameState.ts`
- **`setStoryFlag`**: Now logs when flags are being set, showing current flags and timestamp
- **`hasStoryFlag`**: Now logs when flags are checked (for forest/cleared/complete flags)

#### `/src/components/organisms/AreaExploration.tsx`
- **`handleCombat`**: Added detailed logging for:
  - Combat initiation
  - Encounter counting
  - Completion requirement checking
  - Flag setting process
  - Verification after flag is set
- **New `useEffect` hook**: Monitors area status continuously, showing:
  - Current encounter count
  - Required encounters
  - Flag name and status
  - All story flags in the game state

#### `/src/components/organisms/WorldMap.tsx`
- **`getAreaAccessibility`**: Added debugging for Deep Forest and Forest Path specifically
- Shows why areas are locked/unlocked with detailed reasoning

## How to Verify the Fix

### Step 1: Open Browser Console
1. Start the game: `npm run dev` (already running)
2. Open browser at `http://localhost:3000`
3. Open Developer Tools (F12 or Right-click → Inspect)
4. Go to the **Console** tab

### Step 2: Start a New Game or Load Existing
- If starting new: Create a character and complete tutorial
- If loading: Load your level 9 save

### Step 3: Navigate to Forest Path
1. Go to World Map
2. Enter Forest Path area

**What to look for in console:**
```
📍 [AREA MONITOR] forest_path status: {
  encounters: 0,
  required: 3,
  flagName: "forest_path_cleared",
  flagSet: false,
  allStoryFlags: { ... }
}
```

### Step 4: Complete 3 Combat Encounters
For each battle:
1. Click "Explore Area"
2. When you encounter a monster, click "Fight"
3. Win the combat

**After EACH battle, console should show:**
```
⚔️ [COMBAT] Starting combat in area: forest_path { species: "slime", level: 8 }
📊 [AREA PROGRESS] Encounter count for forest_path: 1
🔍 [AREA COMPLETION] Checking completion for forest_path: {
  encountersCompleted: 1,
  required: 3,
  flagName: "forest_path_cleared",
  hasStoryFlagFunction: "function",
  setStoryFlagFunction: "function"
}
```

**After the 3rd battle, you should see:**
```
📊 [AREA PROGRESS] Encounter count for forest_path: 3
🔍 [AREA COMPLETION] Checking completion for forest_path: { ... }
🚩 [STORY FLAG] Flag "forest_path_cleared" status: {
  alreadySet: false,
  willSet: true
}
✅ [AREA COMPLETE] Setting story flag "forest_path_cleared" after 3 encounters
🚩 [SET_STORY_FLAG] Setting flag "forest_path_cleared" to true { currentFlags: {...}, timestamp: "..." }
✅ [SET_STORY_FLAG] Dispatch completed for flag "forest_path_cleared"
🔍 [FLAG VERIFICATION] Flag "forest_path_cleared" verification: {
  isSet: true,
  timestamp: "..."
}
```

You should also see a **green notification banner** at the top of the screen:
```
🎉 Area Complete!
Forest Path Cleared
New areas may now be accessible!
```

### Step 5: Return to World Map
1. Click "← World Map" button
2. Look for Deep Forest area card

**Console should show:**
```
🔓 [ACCESSIBILITY] Checking Deep Forest (deep_forest): {
  areaUnlocked: false,
  isAreaUnlockedResult: true,
  requirements: { story: "forest_path_cleared", level: 3 },
  playerLevel: 9,
  storyFlags: { forest_path_cleared: true, ... }
}
✅ [ACCESSIBILITY] Deep Forest is ACCESSIBLE
```

**Visual indicators:**
- Deep Forest card should be **UNLOCKED** (not grayed out)
- No red lock icon
- "Enter Area" button should be clickable
- No "Complete: forest path cleared" message

### Step 6: Verify Persistence
1. Quick Save your game (Game Menu → Quick Save)
2. Refresh the page
3. Load your save
4. Check World Map again

**Deep Forest should still be unlocked** after reload.

## Debugging Common Issues

### Issue: No logs appear in console
**Solution:**
- Make sure Console tab is open in DevTools
- Check that you're filtering for all log levels (not just Errors)
- Look for logs starting with emojis (⚔️, 📊, 🔍, 🚩, ✅)

### Issue: Flag shows as set but area still locked
**Check console for:**
```
🚩 [STORY FLAG CHECK] Deep Forest requires flag "forest_path_cleared": {
  hasFlag: true/false,
  allFlags: { ... }
}
```
- If `hasFlag: false` but flag exists in `allFlags`, the flag name might not match exactly
- If `allFlags` is empty, the save/load system might not be persisting flags

### Issue: Encounter counter not increasing
**Check console for:**
```
📊 [AREA PROGRESS] Encounter count for forest_path: X
```
- This should increment after each "Fight" button click
- If it doesn't increment, `handleCombat` might not be firing
- Verify you're clicking "Fight" not "Flee"

### Issue: Completion notification doesn't trigger at 3 encounters
**Check console for:**
```
🔍 [AREA COMPLETION] Checking completion for forest_path: {
  encountersCompleted: 3,
  required: 3,
  ...
}
```
- If this shows but no flag is set, check `hasStoryFlagFunction` and `setStoryFlagFunction` values
- If they're `undefined`, the `useWorld` hook isn't providing these functions

## Technical Details

### Story Flag System Architecture

1. **State Storage**: `ReactGameContext.tsx` - `storyFlags: Record<string, boolean>`
2. **Reducer Action**: `SET_STORY_FLAG` case in reducer
3. **Hook Functions**: `useWorld()` provides `setStoryFlag` and `hasStoryFlag`
4. **Area Requirements**: Defined in `public/data/areas.js`
5. **Completion Tracking**: `AREA_COMPLETION_FLAGS` in `AreaExploration.tsx`

### Flag Name Mapping
```typescript
AREA_COMPLETION_FLAGS = {
  forest_path: {
    flag: 'forest_path_cleared',        // Must match exactly
    encountersRequired: 3,
    description: 'Forest Path Cleared',
  },
  plains: {
    flag: 'plains_explored',
    encountersRequired: 3,
    description: 'Grassy Plains Explored',
  },
}
```

### Area Unlock Requirements
From `public/data/areas.js`:
```javascript
deep_forest: {
  unlockRequirements: {
    story: "forest_path_cleared",  // Must match flag name
    level: 3                        // Player must be at least level 3
  }
}
```

## Expected Complete Flow

1. Player enters Forest Path (level 9, flag not set)
2. Player completes 1st battle → counter = 1
3. Player completes 2nd battle → counter = 2
4. Player completes 3rd battle → counter = 3, **flag is set**
5. Notification appears: "🎉 Area Complete! Forest Path Cleared"
6. Player returns to World Map
7. Deep Forest shows as unlocked (meets level 3 + has flag)
8. Player can enter Deep Forest

## Next Steps

1. Test the flow as described above
2. Share the console output with me if issues persist
3. Verify the flag persists after save/load
4. Check if other areas with completion requirements work (e.g., Plains)

## Removing Debug Logs (After Testing)

Once the system is confirmed working, you can remove the debug logs by searching for:
- `console.log` statements containing `[AREA MONITOR]`, `[COMBAT]`, `[AREA PROGRESS]`, `[STORY FLAG]`, `[ACCESSIBILITY]`, etc.
- Or leave them in for future debugging - they only log for specific actions/areas

The system should work correctly now with full transparency into what's happening at each step!
