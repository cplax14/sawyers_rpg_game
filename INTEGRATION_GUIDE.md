# Combat Animation Integration Guide

## Overview

The Magic Bolt animation system has been split into modular, reusable components for better maintainability and organization.

## File Structure

```
src/components/combat/animations/
├── index.ts                    # Barrel export for all animations
├── types.ts                    # Shared types and constants
├── ChargeParticles.tsx         # Charge-up particle effects
├── Projectile.tsx              # Spell projectile component
├── ImpactEffects.tsx           # Hit impact and damage numbers
└── MagicBoltAnimation.tsx      # Main orchestrator component
```

## Integration with Combat.tsx

### Step 1: Add Import

Add this import at the top of `Combat.tsx`:

```typescript
import { MagicBoltAnimation } from '../combat/animations';
```

### Step 2: Add Animation State

Add animation state to your combat component:

```typescript
const [activeAnimation, setActiveAnimation] = useState<{
  type: 'magic-bolt' | null;
  damage: number;
  isCritical: boolean;
  element: 'arcane' | 'fire' | 'ice' | 'lightning';
} | null>(null);
```

### Step 3: Trigger Animation in executeMagic

Modify the `executeMagic` function to trigger the animation:

```typescript
const executeMagic = useCallback(async (spell: any) => {
  if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

  setCombatState(prev => ({ ...prev, isAnimating: true }));

  if (combatState.playerMp < spell.mpCost) {
    addBattleLog('Not enough MP!', 'system');
    setCombatState(prev => ({ ...prev, isAnimating: false }));
    return;
  }

  if (spell.type === 'offensive') {
    const accuracy = 85 + (player?.baseStats.accuracy || 85) - 85;
    const accuracyRoll = Math.random() * 100;

    if (accuracyRoll <= accuracy) {
      const baseDamage = spell.damage + Math.floor(Math.random() * 8);
      const damage = calculateDamage(baseDamage, playerLevel, enemy?.currentStats.magicDefense || 3);
      const isCritical = Math.random() < 0.15; // 15% crit chance
      const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

      // Trigger animation
      setActiveAnimation({
        type: 'magic-bolt',
        damage: finalDamage,
        isCritical,
        element: spell.element || 'arcane'
      });

      // Wait for animation to complete before logging
      await new Promise(resolve => setTimeout(resolve, 1400)); // MAGIC_BOLT_TIMINGS.total

      addBattleLog(
        `You cast ${spell.name} for ${finalDamage} magic damage!${isCritical ? ' CRITICAL!' : ''}`,
        'action'
      );

      setCombatState(prev => ({
        ...prev,
        enemyHp: Math.max(0, prev.enemyHp - finalDamage),
        playerMp: Math.max(0, prev.playerMp - spell.mpCost),
        phase: prev.enemyHp - finalDamage <= 0 ? 'victory' : 'enemy-turn'
      }));

      // Clear animation
      setActiveAnimation(null);
    } else {
      addBattleLog(`${spell.name} missed!`, 'action');
      setCombatState(prev => ({
        ...prev,
        playerMp: Math.max(0, prev.playerMp - spell.mpCost),
        phase: 'enemy-turn'
      }));
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  setCombatState(prev => ({ ...prev, isAnimating: false }));
}, [/* deps */]);
```

### Step 4: Add Animation Component to Render

Add the animation component to your JSX, typically near the bottom before closing tags:

```typescript
return (
  <div className="combat-container">
    {/* ... existing combat UI ... */}

    {/* Animation Layer */}
    {activeAnimation?.type === 'magic-bolt' && (
      <MagicBoltAnimation
        casterPosition={{ x: 200, y: 300 }}  // Player position
        targetPosition={{ x: 600, y: 200 }}  // Enemy position
        damage={activeAnimation.damage}
        isCritical={activeAnimation.isCritical}
        element={activeAnimation.element}
        onComplete={() => setActiveAnimation(null)}
        isActive={true}
      />
    )}
  </div>
);
```

## Position Calculation

You'll need to calculate actual screen positions for caster and target. Example:

```typescript
// Get DOM element positions
const playerRef = useRef<HTMLDivElement>(null);
const enemyRef = useRef<HTMLDivElement>(null);

const getAnimationPositions = useCallback(() => {
  const playerEl = playerRef.current;
  const enemyEl = enemyRef.current;

  if (!playerEl || !enemyEl) {
    return {
      casterPosition: { x: 200, y: 300 },
      targetPosition: { x: 600, y: 200 }
    };
  }

  const playerRect = playerEl.getBoundingClientRect();
  const enemyRect = enemyEl.getBoundingClientRect();

  return {
    casterPosition: {
      x: playerRect.left + playerRect.width / 2,
      y: playerRect.top + playerRect.height / 2
    },
    targetPosition: {
      x: enemyRect.left + enemyRect.width / 2,
      y: enemyRect.top + enemyRect.height / 2
    }
  };
}, []);
```

## Adding Custom Spells

To add more spell animations:

1. Create a new animation component (e.g., `FireballAnimation.tsx`)
2. Follow the same pattern as `MagicBoltAnimation.tsx`
3. Reuse sub-components: `ChargeParticles`, `Projectile`, `ImpactEffects`
4. Export from `index.ts`
5. Add to animation state type union

## Performance Notes

- All animations use GPU-accelerated properties (transform, opacity)
- Components automatically clean up when unmounted
- Screen shake is minimal to avoid motion sickness
- Particle counts are optimized for 60fps performance

## Customization

Edit `types.ts` to adjust:
- `MAGIC_BOLT_TIMINGS` - Animation phase durations
- `ELEMENT_COLORS` - Color schemes for different elements
- `SPRING_CONFIG` - Spring physics for motion

## Future Enhancements

- Physical attack animations (sword slash, bow arrow)
- Enemy attack animations
- Hit reactions for player/enemies
- Victory/defeat animations
- Status effect particles (poison, burn, freeze)
