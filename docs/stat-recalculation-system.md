# Automatic Stat Recalculation System

## Overview

The equipment system implements automatic stat recalculation whenever equipment changes. This ensures player stats always reflect their current equipment configuration without requiring manual updates.

## Architecture

### Three-Layer Update System

1. **Equipment State Update** → 2. **Stat Calculation Update** → 3. **Game State Update**

## Implementation Details

### 1. Memoized Equipment Tracking

**Location**: `src/hooks/useEquipment.ts` (lines 722-735)

```typescript
const equippedItems = useMemo(() => equipmentState.equipped, [
  equipmentState.equipped.weapon?.id,
  equipmentState.equipped.armor?.id,
  equipmentState.equipped.accessory?.id,
  equipmentState.equipped.helmet?.id,
  equipmentState.equipped.chestplate?.id,
  equipmentState.equipped.boots?.id,
  equipmentState.equipped.gloves?.id,
  equipmentState.equipped.ring1?.id,
  equipmentState.equipped.ring2?.id,
  equipmentState.equipped.necklace?.id,
  equipmentState.equipped.charm?.id
]);
```

**Purpose**:
- Tracks changes to equipped items by monitoring item IDs only
- Prevents infinite loops by only triggering when actual item IDs change
- Ignores object reference changes that don't affect equipped items

**Why Item IDs Only?**
- Object references can change on every render even if the items are the same
- Tracking IDs ensures we only recalculate when equipment actually changes
- Prevents unnecessary calculations and game state updates

### 2. Stat Calculation Trigger

**Location**: `src/hooks/useEquipment.ts` (lines 737-744)

```typescript
useEffect(() => {
  const newStats = calculateFinalStats();
  setEquipmentState(prev => ({
    ...prev,
    statCalculations: newStats
  }));
}, [equippedItems, calculateFinalStats]);
```

**Trigger Conditions**:
- When `equippedItems` changes (any equipment slot's item ID changes)
- When `calculateFinalStats` function changes (rare, only if dependencies change)

**Process**:
1. Calls `calculateFinalStats()` to compute all player stats
2. Updates `equipmentState.statCalculations` with the new values
3. Includes base stats, equipment bonuses, and level bonuses

### 3. Game State Synchronization

**Location**: `src/hooks/useEquipment.ts` (lines 746-763)

```typescript
useEffect(() => {
  if (gameState.state.player) {
    const finalStats = {
      attack: equipmentState.statCalculations.attack?.finalValue || 0,
      defense: equipmentState.statCalculations.defense?.finalValue || 0,
      magicAttack: equipmentState.statCalculations.magicAttack?.finalValue || 0,
      magicDefense: equipmentState.statCalculations.magicDefense?.finalValue || 0,
      speed: equipmentState.statCalculations.speed?.finalValue || 0,
      accuracy: equipmentState.statCalculations.accuracy?.finalValue || 0
    };

    gameState.dispatch({
      type: 'UPDATE_PLAYER_STATS',
      payload: { playerId: gameState.state.player.id, stats: finalStats }
    });
  }
}, [equipmentState.statCalculations, gameState.dispatch, gameState.state.player?.id]);
```

**Trigger Conditions**:
- When `equipmentState.statCalculations` changes
- When player ID changes (rare, only on player change/load)

**Process**:
1. Extracts final stat values from calculated stats
2. Dispatches `UPDATE_PLAYER_STATS` action to global game state
3. Updates player's combat stats for use throughout the game

## Automatic Recalculation Flow

### When Equipping an Item

1. User calls `equipItem(itemId, slot)`
2. Function updates `equipmentState.equipped[slot] = newItem`
3. `equippedItems` memo detects item ID change in that slot
4. First `useEffect` triggers → `calculateFinalStats()` runs
5. `equipmentState.statCalculations` updates with new stats
6. Second `useEffect` triggers → `UPDATE_PLAYER_STATS` dispatched
7. Player's stats in game state reflect new equipment

### When Unequipping an Item

1. User calls `unequipItem(slot)`
2. Function updates `equipmentState.equipped[slot] = null`
3. `equippedItems` memo detects item ID change (now null)
4. First `useEffect` triggers → `calculateFinalStats()` runs
5. `equipmentState.statCalculations` updates (bonuses removed)
6. Second `useEffect` triggers → `UPDATE_PLAYER_STATS` dispatched
7. Player's stats in game state reflect removal of equipment

### When Loading a Saved Game

1. Game loads saved equipment data
2. `equipmentState.equipped` initialized with saved items
3. `equippedItems` memo initializes with item IDs
4. First `useEffect` triggers → `calculateFinalStats()` runs
5. `equipmentState.statCalculations` populated
6. Second `useEffect` triggers → `UPDATE_PLAYER_STATS` dispatched
7. Player's stats correctly reflect loaded equipment

## Performance Optimizations

### Memoization Strategy

1. **`equippedItems` (useMemo)**: Only recalculates when item IDs change
2. **`baseStats` (useMemo)**: Only recalculates when player level/class changes
3. **`equipmentStats` (useMemo)**: Only recalculates when equipped items change
4. **`finalStats` (useMemo)**: Only recalculates when calculation function changes

### Preventing Infinite Loops

**Problem Avoided**: Without proper memoization, the following infinite loop could occur:
1. Equipment changes
2. Stats recalculate
3. State updates
4. Re-render occurs
5. New object references created
6. Effect triggers again (loop back to step 2)

**Solution Applied**:
- Track item IDs instead of objects in `equippedItems` dependency
- Only trigger recalculation when IDs actually change
- Memoize expensive calculations to prevent unnecessary function recreation

### Update Batching

React automatically batches state updates within the same execution context, so:
- Multiple equipment changes in quick succession batch their updates
- Only one final recalculation and game state update occurs
- Prevents performance issues from rapid equipment swaps

## Stat Calculation Formula

**Location**: `src/hooks/useEquipment.ts` (lines 137-235)

```
finalStat = baseStat + equipmentBonus + levelBonus + temporaryBuffs
```

**Where**:
- `baseStat`: Calculated from player level and class modifiers
- `equipmentBonus`: Sum of all equipped item stat modifiers
- `levelBonus`: Additional percentage-based bonuses (currently 0)
- `temporaryBuffs`: Buffs/debuffs from abilities (to be implemented)

## Stats Calculated

### Core Combat Stats (from PlayerStats)
- **attack**: Physical damage dealing capability
- **defense**: Physical damage reduction
- **magicAttack**: Magical damage dealing capability
- **magicDefense**: Magical damage reduction
- **speed**: Turn order and evasion contribution
- **accuracy**: Hit chance and critical chance contribution

### Resource Stats
- **health**: Maximum HP (base: 100 + 10 per level + equipment)
- **mana**: Maximum MP (base: 50 + 5 per level + equipment)

### Derived Combat Stats
- **criticalChance**: Base 5% + equipment bonuses
- **criticalDamage**: Base 150% + equipment bonuses
- **evasion**: Base (speed / 2) + equipment bonuses
- **resistance**: Base (magicDefense / 2) + equipment bonuses

## Integration Points

### Components That Use Auto-Calculated Stats

1. **EquipmentScreen**: Displays current stats with equipment breakdowns
2. **Combat System**: Uses final stats for damage/defense calculations
3. **StatsScreen**: Shows detailed stat breakdowns
4. **Character Sheet**: Displays overall character power

### Game Systems That Trigger Recalculation

1. **Equipment changes**: Equip/unequip operations
2. **Level up**: Base stats change, triggering recalculation
3. **Class change**: Base stat modifiers change (if implemented)
4. **Load game**: Initial stat calculation on game load

## Testing Automatic Recalculation

### Unit Tests Required

```typescript
describe('Automatic Stat Recalculation', () => {
  test('Stats update when equipping item', () => {
    // 1. Get initial stats
    // 2. Equip item with +10 attack
    // 3. Verify attack increased by 10
  });

  test('Stats update when unequipping item', () => {
    // 1. Equip item with +10 defense
    // 2. Unequip the item
    // 3. Verify defense decreased by 10
  });

  test('Stats update when swapping items', () => {
    // 1. Equip item A (+5 speed)
    // 2. Equip item B (+10 speed) in same slot
    // 3. Verify net change is +5 speed
  });

  test('No infinite loops during equipment changes', () => {
    // 1. Set up render count tracker
    // 2. Equip multiple items rapidly
    // 3. Verify renders are bounded and complete
  });
});
```

### Manual Testing Checklist

- [ ] Equip weapon → attack stat increases immediately
- [ ] Unequip weapon → attack stat decreases immediately
- [ ] Swap armor → defense stat updates to reflect new armor
- [ ] Equip multiple items → all bonuses stack correctly
- [ ] Load saved game → stats match equipped items
- [ ] Level up with equipment → stats recalculate with new base
- [ ] Check stat breakdown → base and equipment bonuses shown separately

## Troubleshooting

### Issue: Stats Not Updating

**Possible Causes**:
1. `equippedItems` memo dependencies incorrect
2. Item IDs not changing when expected
3. `calculateFinalStats` not being called

**Debug Steps**:
```typescript
// Add console.logs to useEffect
useEffect(() => {
  console.log('Equipment changed:', equippedItems);
  const newStats = calculateFinalStats();
  console.log('New stats:', newStats);
  setEquipmentState(prev => ({...prev, statCalculations: newStats}));
}, [equippedItems, calculateFinalStats]);
```

### Issue: Infinite Loop Occurring

**Possible Causes**:
1. Memoization dependencies are objects instead of primitives
2. `calculateFinalStats` function recreating on every render
3. State updates inside effect without proper guards

**Debug Steps**:
```typescript
// Check if memo is working correctly
const equippedItems = useMemo(() => {
  console.log('equippedItems memo recalculating');
  return equipmentState.equipped;
}, [/* check dependencies */]);
```

### Issue: Game State Not Syncing

**Possible Causes**:
1. `UPDATE_PLAYER_STATS` action not dispatching
2. Player ID mismatch in payload
3. Reducer not handling action correctly

**Debug Steps**:
```typescript
// Add logging to game state sync effect
useEffect(() => {
  console.log('Syncing stats to game state:', equipmentState.statCalculations);
  if (gameState.state.player) {
    console.log('Dispatching UPDATE_PLAYER_STATS for player:', gameState.state.player.id);
    gameState.dispatch({type: 'UPDATE_PLAYER_STATS', payload: finalStats});
  }
}, [equipmentState.statCalculations]);
```

## Future Enhancements

1. **Temporary Buffs/Debuffs**: Add support for time-limited stat modifiers
2. **Percentage Modifiers**: Implement equipment that grants +X% to stats
3. **Conditional Bonuses**: "Set bonuses" when wearing multiple pieces of same set
4. **Stat Caps**: Implement maximum values for certain stats
5. **Stat Floors**: Ensure stats never go below minimum values
6. **Equipment Synergies**: Bonuses when specific items are equipped together

## Related Documentation

- `/home/josh/Documents/projects/personal/react_port_for_sawyers_rpg_game/docs/ai_dev_tasks/prd-equipment-system.md` - Equipment system PRD
- `/home/josh/Documents/projects/personal/react_port_for_sawyers_rpg_game/src/types/inventory.ts` - Equipment type definitions
- `/home/josh/Documents/projects/personal/react_port_for_sawyers_rpg_game/src/contexts/ReactGameContext.tsx` - Game state management

## Conclusion

The automatic stat recalculation system ensures player stats always reflect current equipment without manual intervention. The three-layer architecture (equipment → stat calculation → game state) with proper memoization provides:

- ✅ Real-time stat updates
- ✅ Performance optimization
- ✅ Infinite loop prevention
- ✅ Seamless game state integration

This system forms the foundation for equipment-based character progression throughout the game.
