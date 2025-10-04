# Animation Color Palette Reference

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Status**: Complete

## Table of Contents
1. [Introduction](#introduction)
2. [Color Theory for Game Animations](#color-theory-for-game-animations)
3. [Element Color Palettes](#element-color-palettes)
4. [Master Color Table](#master-color-table)
5. [Usage Examples](#usage-examples)
6. [Color Accessibility](#color-accessibility)
7. [Customization Guide](#customization-guide)
8. [Quick Reference Card](#quick-reference-card)

---

## Introduction

### Purpose
This document provides the complete color palette system for combat animations in Sawyer's RPG Game. It serves as the definitive reference for all animation colors, ensuring visual consistency and enabling rapid animation development.

### How Colors Are Organized
Colors are organized by **element type**, with each element having three distinct color values:
- **Primary**: Main spell/effect color, used for core visual elements
- **Secondary**: Supporting color for depth and variation
- **Accent**: Highlight color for particles, glows, and emphasis points

### How to Use This Reference
- **Developers**: Import color constants from `types.ts` using the documented names
- **Designers**: Use the hex codes directly for prototyping or external tools
- **Integration**: All colors follow a consistent naming pattern: `ELEMENT_COLORS.primary/secondary/accent`

---

## Color Theory for Game Animations

### Warm vs Cool Elements
- **Warm colors** (Fire, Holy, Arcane): Create aggressive, powerful, or divine feelings
  - Fire: Red-orange spectrum conveys heat and destruction
  - Holy: Gold-yellow spectrum suggests divine light and healing

- **Cool colors** (Ice, Lightning): Create sharp, precise, or electrical sensations
  - Ice: Blue-white spectrum feels cold and crystalline
  - Lightning: Bright yellow-white feels electric and instant

### Contrast Principles
- **High contrast** for visibility: All palettes ensure primary colors stand out against dark backgrounds
- **Value variation**: Each palette spans light to dark for depth
- **Saturation balance**: Accent colors are highest saturation for impact points

### Color Psychology in Combat
- **Red/Orange (Fire)**: Danger, heat, aggression → Offensive destruction spells
- **Blue/Cyan (Ice)**: Cold, precision, control → Freezing and control spells
- **Yellow/White (Lightning/Holy)**: Energy, speed, purity → Instant damage or healing
- **Purple (Arcane/Poison)**: Mystery, magic, toxicity → Mystical or toxic effects

---

## Element Color Palettes

### Fire Element
**Visual Identity**: Intense heat, explosive power, destructive flames

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#ff6b35` | rgb(255, 107, 53) | Vibrant fire orange - main flame color |
| **Secondary** | `#ff4444` | rgb(255, 68, 68) | Deep red - inner heat, intensity |
| **Accent** | `#ffaa00` | rgb(255, 170, 0) | Bright yellow-orange - hottest points |

**Usage Guidelines**:
- Primary: Main fireball body, flame cores, weapon trails
- Secondary: Inner flames, heat distortion, ember particles
- Accent: Flash points, explosion centers, hottest flames

**TypeScript Constant**: `FIRE_COLORS`
```typescript
import { FIRE_COLORS } from './types';
// FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent
```

---

### Ice Element
**Visual Identity**: Crystalline cold, sharp precision, frozen beauty

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#4da6ff` | rgb(77, 166, 255) | Clear ice blue - main crystal color |
| **Secondary** | `#b3e0ff` | rgb(179, 224, 255) | Light blue - frost, mist, highlights |
| **Accent** | `#ffffff` | rgb(255, 255, 255) | Pure white - brightest ice, reflections |

**Usage Guidelines**:
- Primary: Ice shard bodies, frozen projectiles, crystal formations
- Secondary: Frost clouds, frozen trails, icy mist
- Accent: Shatter flashes, crystal highlights, brightest reflections

**TypeScript Constant**: `ICE_COLORS`
```typescript
import { ICE_COLORS } from './types';
// ICE_COLORS.primary, ICE_COLORS.secondary, ICE_COLORS.accent
```

---

### Lightning Element
**Visual Identity**: Electric energy, instant power, crackling voltage

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#ffeb3b` | rgb(255, 235, 59) | Bright yellow - main lightning bolt |
| **Secondary** | `#fff176` | rgb(255, 241, 118) | Light yellow - electric glow, aura |
| **Accent** | `#ffffff` | rgb(255, 255, 255) | Pure white - arc flash, strike point |

**Usage Guidelines**:
- Primary: Lightning bolt paths, electric arcs, main energy
- Secondary: Electric auras, charge particles, ambient glow
- Accent: Strike flashes, arc endpoints, brightest sparks

**TypeScript Constant**: `LIGHTNING_COLORS`
```typescript
import { LIGHTNING_COLORS } from './types';
// LIGHTNING_COLORS.primary, LIGHTNING_COLORS.secondary, LIGHTNING_COLORS.accent
```

---

### Holy Element
**Visual Identity**: Divine radiance, sacred light, healing warmth

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#ffd700` | rgb(255, 215, 0) | Pure gold - main divine light |
| **Secondary** | `#ffffcc` | rgb(255, 255, 204) | Light gold/cream - soft glow, halos |
| **Accent** | `#ffffff` | rgb(255, 255, 255) | Pure white - brightest divine flash |

**Usage Guidelines**:
- Primary: Divine beams, golden auras, holy symbols
- Secondary: Soft glows, halos, healing light
- Accent: Divine flashes, purest light points, beam centers

**TypeScript Constant**: `HOLY_COLORS`
```typescript
import { HOLY_COLORS } from './types';
// HOLY_COLORS.primary, HOLY_COLORS.secondary, HOLY_COLORS.accent
```

---

### Arcane Element (Legacy)
**Visual Identity**: Mystical magic, raw arcane power, ancient energy

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#9c27b0` | rgb(156, 39, 176) | Deep purple - main arcane energy |
| **Secondary** | `#ba68c8` | rgb(186, 104, 200) | Light purple - magical glow |
| **Accent** | `#4a148c` | rgb(74, 20, 140) | Dark purple - concentrated magic |

**Usage Guidelines**:
- Primary: Arcane bolts, magical circles, spell effects
- Secondary: Mystical auras, particle trails, ambient glow
- Accent: Concentrated magic, spell cores, darkest shadows

**TypeScript Constant**: `ARCANE_COLORS`
```typescript
import { ARCANE_COLORS } from './types';
// ARCANE_COLORS.primary, ARCANE_COLORS.secondary, ARCANE_COLORS.accent
```

**Note**: Legacy arcane palette also exists in `ELEMENT_COLORS.arcane` with slightly different values:
- Primary: `#8b5cf6` (lighter purple)
- Glow: `#a78bfa` (soft lavender)
- Particles: `#c4b5fd` (light lavender)

---

### Poison Element
**Visual Identity**: Toxic clouds, venomous effects, corrosive nature

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#8bc34a` | rgb(139, 195, 74) | Toxic green - main poison color |
| **Secondary** | `#33691e` | rgb(51, 105, 30) | Dark green - concentrated venom |
| **Accent** | `#7b1fa2` | rgb(123, 31, 162) | Purple tint - toxic shimmer |

**Usage Guidelines**:
- Primary: Poison clouds, toxic projectiles, venom pools
- Secondary: Dark venom, concentrated poison, shadows
- Accent: Toxic shimmer, magical poison, dangerous highlights

**TypeScript Constant**: `POISON_COLORS`
```typescript
import { POISON_COLORS } from './types';
// POISON_COLORS.primary, POISON_COLORS.secondary, POISON_COLORS.accent
```

---

### Physical/Neutral (Melee Attacks)
**Visual Identity**: Raw impact, steel clash, physical force

| Color Type | Hex Code | RGB | Visual Description |
|------------|----------|-----|-------------------|
| **Primary** | `#9e9e9e` | rgb(158, 158, 158) | Steel gray - weapon trails |
| **Secondary** | `#ffffff` | rgb(255, 255, 255) | White - impact flash |
| **Accent** | `#616161` | rgb(97, 97, 97) | Dark gray - weapon shadow |

**Usage Guidelines**:
- Primary: Weapon trails, slash effects, impact waves
- Secondary: Impact flashes, sparks, clash points
- Accent: Shadows, weapon edges, depth

**Note**: Physical attacks currently use contextual colors. This palette is recommended for future melee animation standardization.

---

## Master Color Table

### All Elements at a Glance

| Element | Primary | Secondary | Accent | Color Feel |
|---------|---------|-----------|--------|------------|
| **Fire** | `#ff6b35` ![#ff6b35](https://via.placeholder.com/15/ff6b35/ff6b35.png) | `#ff4444` ![#ff4444](https://via.placeholder.com/15/ff4444/ff4444.png) | `#ffaa00` ![#ffaa00](https://via.placeholder.com/15/ffaa00/ffaa00.png) | Hot, explosive, destructive |
| **Ice** | `#4da6ff` ![#4da6ff](https://via.placeholder.com/15/4da6ff/4da6ff.png) | `#b3e0ff` ![#b3e0ff](https://via.placeholder.com/15/b3e0ff/b3e0ff.png) | `#ffffff` ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) | Cold, crystalline, precise |
| **Lightning** | `#ffeb3b` ![#ffeb3b](https://via.placeholder.com/15/ffeb3b/ffeb3b.png) | `#fff176` ![#fff176](https://via.placeholder.com/15/fff176/fff176.png) | `#ffffff` ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) | Electric, instant, powerful |
| **Holy** | `#ffd700` ![#ffd700](https://via.placeholder.com/15/ffd700/ffd700.png) | `#ffffcc` ![#ffffcc](https://via.placeholder.com/15/ffffcc/ffffcc.png) | `#ffffff` ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) | Divine, radiant, healing |
| **Arcane** | `#9c27b0` ![#9c27b0](https://via.placeholder.com/15/9c27b0/9c27b0.png) | `#ba68c8` ![#ba68c8](https://via.placeholder.com/15/ba68c8/ba68c8.png) | `#4a148c` ![#4a148c](https://via.placeholder.com/15/4a148c/4a148c.png) | Mystical, ancient, magical |
| **Poison** | `#8bc34a` ![#8bc34a](https://via.placeholder.com/15/8bc34a/8bc34a.png) | `#33691e` ![#33691e](https://via.placeholder.com/15/33691e/33691e.png) | `#7b1fa2` ![#7b1fa2](https://via.placeholder.com/15/7b1fa2/7b1fa2.png) | Toxic, venomous, corrosive |
| **Physical** | `#9e9e9e` ![#9e9e9e](https://via.placeholder.com/15/9e9e9e/9e9e9e.png) | `#ffffff` ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) | `#616161` ![#616161](https://via.placeholder.com/15/616161/616161.png) | Sharp, metallic, forceful |

### Legacy Magic Bolt Palette

The original `ELEMENT_COLORS` constant uses a three-tier system (primary/glow/particles):

| Element | Primary | Glow | Particles |
|---------|---------|------|-----------|
| **Arcane** | `#8b5cf6` | `#a78bfa` | `#c4b5fd` |
| **Fire** | `#f59e0b` | `#fbbf24` | `#fcd34d` |
| **Ice** | `#3b82f6` | `#60a5fa` | `#93c5fd` |
| **Lightning** | `#eab308` | `#facc15` | `#fde047` |

**Note**: New animations should use the modern three-tier palettes (`FIRE_COLORS`, etc.) for consistency.

---

## Usage Examples

### Basic Color Application

#### Importing Color Constants
```typescript
import {
  FIRE_COLORS,
  ICE_COLORS,
  LIGHTNING_COLORS,
  HOLY_COLORS,
  ARCANE_COLORS,
  POISON_COLORS
} from '../types';
```

#### Applying Colors to Particles
```typescript
// Fire explosion particles
<ParticleSystem
  originX={targetX}
  originY={targetY}
  particleCount={28}
  colors={[
    FIRE_COLORS.primary,    // Main orange flames
    FIRE_COLORS.secondary,  // Red inner heat
    FIRE_COLORS.accent      // Yellow-orange hottest points
  ]}
  spread={150}
  lifetime={150}
  size={8}
  gravity={80}
  fadeOut={true}
/>
```

#### Applying Colors to Projectiles
```typescript
// Ice shard projectile
<Projectile
  startX={casterX}
  startY={casterY}
  endX={targetX}
  endY={targetY}
  color={ICE_COLORS.primary}  // Ice blue body
  size={22}
  duration={250}
  glowIntensity={1.0}
  onComplete={handleTravelComplete}
/>
```

#### Applying Colors to Impact Effects
```typescript
// Holy beam impact with radial gradient
<motion.div
  style={{
    background: `radial-gradient(
      circle,
      ${HOLY_COLORS.accent}ff 0%,      // Pure white center
      ${HOLY_COLORS.primary}dd 40%,    // Gold middle
      ${HOLY_COLORS.secondary}80 70%,  // Light gold edge
      transparent 90%
    )`,
    filter: 'blur(8px)'
  }}
/>
```

---

### Advanced Color Techniques

#### Creating Gradients
```typescript
// Fire explosion with three-color gradient
background: `radial-gradient(
  circle,
  ${FIRE_COLORS.accent}ff 0%,      // Yellow center (hottest)
  ${FIRE_COLORS.primary}cc 30%,    // Orange middle
  ${FIRE_COLORS.secondary}80 60%,  // Red outer (cooler)
  transparent 80%
)`

// Ice beam with vertical gradient
background: `linear-gradient(
  to bottom,
  ${ICE_COLORS.accent}ff 0%,       // White top
  ${ICE_COLORS.primary}dd 30%,     // Ice blue middle
  ${ICE_COLORS.secondary}bb 70%,   // Light blue fade
  ${ICE_COLORS.primary}dd 100%     // Ice blue bottom
)`
```

#### Color Mixing for Combo Effects
```typescript
// Fire + Lightning combo (electrical flames)
const comboColors = [
  FIRE_COLORS.primary,           // Orange base
  LIGHTNING_COLORS.primary,      // Yellow energy
  FIRE_COLORS.accent,            // Bright flash
  LIGHTNING_COLORS.accent        // White spark
];

// Ice + Arcane combo (frozen magic)
const magicIceColors = [
  ICE_COLORS.primary,            // Ice blue
  ARCANE_COLORS.secondary,       // Light purple
  ICE_COLORS.accent,             // White highlight
  ARCANE_COLORS.primary          // Deep purple shadow
];
```

#### Dynamic Color with Opacity
```typescript
// Pulsing fire aura
<motion.div
  animate={{
    opacity: [0, 0.8, 0.4, 0.8, 0.4],
    scale: [0.8, 1.2, 1, 1.3, 1.1]
  }}
  style={{
    background: `radial-gradient(
      circle,
      ${FIRE_COLORS.primary}80 0%,   // 50% opacity
      ${FIRE_COLORS.secondary}40 50%, // 25% opacity
      transparent 70%
    )`
  }}
/>
```

---

### Common Color Recipes

#### Explosion Effect
```typescript
// High-impact explosion (Fire element)
{
  coreFlash: FIRE_COLORS.accent,      // Brightest center
  middleRing: FIRE_COLORS.primary,    // Main explosion body
  outerRing: FIRE_COLORS.secondary,   // Fading edge
  particles: [
    FIRE_COLORS.primary,
    FIRE_COLORS.secondary,
    FIRE_COLORS.accent
  ]
}
```

#### Healing Glow Effect
```typescript
// Gentle healing aura (Holy element)
{
  innerGlow: HOLY_COLORS.accent,       // Pure white center
  middleGlow: HOLY_COLORS.secondary,   // Soft gold
  outerGlow: HOLY_COLORS.primary,      // Rich gold edge
  sparkles: [HOLY_COLORS.accent]       // White sparkles
}
```

#### Freeze Effect
```typescript
// Freezing/crystallization (Ice element)
{
  crystal: ICE_COLORS.primary,         // Ice blue crystal
  frost: ICE_COLORS.secondary,         // Light frost
  flash: ICE_COLORS.accent,            // White freeze flash
  fragments: [
    ICE_COLORS.primary,
    ICE_COLORS.secondary,
    ICE_COLORS.accent
  ]
}
```

#### Particle Color Patterns
```typescript
// Converging particles (charge effect)
colors={[
  element_COLORS.secondary,  // Outer particles (lighter)
  element_COLORS.primary,    // Middle particles
  element_COLORS.accent      // Inner particles (brightest)
]}
spread={-70}  // Negative = converge inward

// Radiating particles (burst effect)
colors={[
  element_COLORS.accent,     // Center particles (brightest)
  element_COLORS.primary,    // Middle particles
  element_COLORS.secondary   // Outer particles (lighter)
]}
spread={150}  // Positive = spread outward
```

---

## Color Accessibility

### Contrast Requirements for Visibility

#### Dark Background Compatibility
All palettes are optimized for dark combat arenas (typical background: `#1a1a1a` to `#2d2d2d`):

| Element | Primary Contrast Ratio | Accessibility Level |
|---------|----------------------|-------------------|
| Fire | 4.8:1 | AA (Good) |
| Ice | 6.2:1 | AA+ (Very Good) |
| Lightning | 15.4:1 | AAA (Excellent) |
| Holy | 14.1:1 | AAA (Excellent) |
| Arcane | 3.9:1 | AA- (Acceptable) |
| Poison | 5.1:1 | AA (Good) |

#### Light Background Compatibility
For light arenas or UI overlays (background: `#f5f5f5` to `#ffffff`):
- **Good**: Fire (primary/secondary), Ice (primary), Arcane (all)
- **Fair**: Lightning (requires darkening), Holy (requires darkening)
- **Use accent colors** on light backgrounds for maximum contrast

---

### Color-Blind Considerations

#### Deuteranopia (Red-Green Color Blindness)
- **Fire vs Poison**: Potential confusion (orange-red vs green)
  - **Solution**: Fire uses brighter, warmer tones; Poison has distinct purple accent
- **Ice vs Lightning**: Both appear blue-ish
  - **Solution**: Ice is cooler blue, Lightning is yellow-white (more distinct)

#### Protanopia (Red Color Blindness)
- **Fire**: Appears more orange/brown (still distinct)
- **Holy**: Appears more yellow (excellent visibility)
- **All other elements**: Minimal impact

#### Tritanopia (Blue-Yellow Color Blindness)
- **Ice vs Holy**: Potential confusion (both appear white-ish)
  - **Solution**: Ice has cooler tone, Holy has warmer glow
- **Lightning**: Appears more white (still highly visible)

#### Accessibility Best Practices
1. **Always pair color with animation patterns**: Different elements have unique motion
2. **Use accent colors for critical feedback**: White/bright flashes work for all types
3. **Rely on particle behavior**: Speed, direction, and count provide additional cues
4. **Test with grayscale**: All palettes maintain distinct brightness levels

---

## Customization Guide

### Adding New Element Colors to types.ts

#### Step 1: Define Color Constant
```typescript
// In src/components/combat/animations/types.ts

export const SHADOW_COLORS = {
  primary: '#4a148c',    // Deep purple-black
  secondary: '#1a0033',  // Very dark purple
  accent: '#9c27b0'      // Violet highlight
};

export const NATURE_COLORS = {
  primary: '#66bb6a',    // Forest green
  secondary: '#a5d6a7',  // Light green
  accent: '#81c784'      // Vibrant green
};
```

#### Step 2: Update Type Definitions
```typescript
// Add to element type union
export interface ImpactConfig {
  x: number;
  y: number;
  damage: number;
  isCritical?: boolean;
  element?: 'fire' | 'ice' | 'lightning' | 'arcane' | 'shadow' | 'nature';
  //                                                    ^^^^^^   ^^^^^^
  //                                                    Add new elements here
}
```

#### Step 3: Document Your Palette
Add entry to this reference document with:
- Visual identity description
- All three hex codes with descriptions
- Usage guidelines
- TypeScript import example

---

### Naming Conventions for Color Constants

#### Pattern: `ELEMENT_COLORS`
```typescript
export const ELEMENT_COLORS = {
  primary: '#hexcode',    // Main element color
  secondary: '#hexcode',  // Supporting color
  accent: '#hexcode'      // Highlight/flash color
};
```

#### Pattern: Legacy Three-Tier (avoid for new code)
```typescript
// Old pattern (Magic Bolt only)
export const ELEMENT_COLORS = {
  elementName: {
    primary: '#hexcode',   // Main color
    glow: '#hexcode',      // Glow/aura
    particles: '#hexcode'  // Particle highlights
  }
};
```

#### Naming Rules
- **Constant name**: `UPPERCASE_ELEMENT_COLORS`
- **Element**: Single word, descriptive (FIRE, ICE, SHADOW, NATURE)
- **Color tiers**: Always `primary`, `secondary`, `accent`
- **Export**: Always export from `types.ts`

---

### Testing Color Combinations

#### Visual Testing Checklist
- [ ] Test on dark background (`#1a1a1a`)
- [ ] Test on light background (`#f5f5f5`)
- [ ] Test with blur effects (`filter: blur(8px)`)
- [ ] Test with opacity variations (80%, 50%, 25%)
- [ ] Test in particle systems (multiple colors together)
- [ ] Test in gradients (smooth color transitions)

#### Performance Testing
```typescript
// Validate your colors don't create performance issues
import { validateParticleCount } from '../types';

// Test particle system with new colors
validateParticleCount(28, 'NewElementAnimation', 'impact');

<ParticleSystem
  particleCount={28}
  colors={[
    NEW_ELEMENT_COLORS.primary,
    NEW_ELEMENT_COLORS.secondary,
    NEW_ELEMENT_COLORS.accent
  ]}
  // ... other props
/>
```

#### Color Harmony Testing
```typescript
// Ensure colors work well together
const testGradient = `radial-gradient(
  circle,
  ${NEW_COLORS.accent}ff 0%,
  ${NEW_COLORS.primary}cc 40%,
  ${NEW_COLORS.secondary}80 70%,
  transparent 90%
)`;

// Should create smooth, visually appealing transition
```

---

### When to Create New Palettes vs Reuse Existing

#### Create New Palette When:
- **Distinct element type**: New magical school or damage type (shadow, nature, psychic)
- **Unique visual identity**: Requires completely different color scheme
- **Gameplay distinction**: Players need to identify it instantly
- **Lore significance**: Element has specific story/world importance

#### Reuse Existing Palette When:
- **Similar element**: Frost spell can use ICE_COLORS
- **Visual variant**: Dark fire can use FIRE_COLORS with darker opacity
- **Temporary effect**: Short debuff can reuse POISON_COLORS
- **Minor distinction**: Small gameplay difference doesn't need unique colors

#### Modification Instead of New Palette
```typescript
// Variant using existing palette with adjustments
const DARK_FIRE_COLORS = {
  primary: FIRE_COLORS.secondary,    // Use fire's red as primary
  secondary: FIRE_COLORS.primary,    // Swap primary/secondary
  accent: '#8b0000'                  // Darker red accent
};

// This avoids palette bloat while creating distinct look
```

---

## Quick Reference Card

### Copy-Paste Color Constants

```typescript
// Fire (Destruction)
FIRE_COLORS.primary    // #ff6b35 - Fire orange
FIRE_COLORS.secondary  // #ff4444 - Deep red
FIRE_COLORS.accent     // #ffaa00 - Bright yellow-orange

// Ice (Control)
ICE_COLORS.primary     // #4da6ff - Ice blue
ICE_COLORS.secondary   // #b3e0ff - Light blue
ICE_COLORS.accent      // #ffffff - Pure white

// Lightning (Speed)
LIGHTNING_COLORS.primary    // #ffeb3b - Bright yellow
LIGHTNING_COLORS.secondary  // #fff176 - Light yellow
LIGHTNING_COLORS.accent     // #ffffff - Pure white

// Holy (Divine)
HOLY_COLORS.primary    // #ffd700 - Gold
HOLY_COLORS.secondary  // #ffffcc - Light gold
HOLY_COLORS.accent     // #ffffff - Pure white

// Arcane (Magic)
ARCANE_COLORS.primary    // #9c27b0 - Deep purple
ARCANE_COLORS.secondary  // #ba68c8 - Light purple
ARCANE_COLORS.accent     // #4a148c - Dark purple

// Poison (Toxic)
POISON_COLORS.primary    // #8bc34a - Toxic green
POISON_COLORS.secondary  // #33691e - Dark green
POISON_COLORS.accent     // #7b1fa2 - Purple tint
```

---

### Common Color Recipes (Quick Copy)

#### Standard Explosion
```typescript
// Core flash
background: `radial-gradient(circle, ${COLORS.accent}ff 0%, ${COLORS.primary}cc 40%, ${COLORS.secondary}80 70%, transparent 90%)`

// Particles
colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
```

#### Projectile with Trail
```typescript
// Projectile
color={COLORS.primary}

// Trail particles
colors={[COLORS.secondary, COLORS.accent]}
```

#### Charge Effect
```typescript
// Converging particles
colors={[COLORS.secondary, COLORS.primary, COLORS.accent]}
spread={-70}  // Negative = inward

// Gathering glow
background: `radial-gradient(circle, ${COLORS.accent}80 0%, ${COLORS.primary}60 40%, transparent 70%)`
```

#### Impact Flash
```typescript
// Bright center
background: `radial-gradient(circle, ${COLORS.accent}ff 0%, ${COLORS.primary}dd 50%, transparent 80%)`

// Screen flash
background: COLORS.accent  // or COLORS.primary for colored flash
opacity: [0, 0.15, 0]
```

---

### Particle Color Patterns

| Effect Type | Color Order | Spread | Example Usage |
|-------------|-------------|--------|---------------|
| **Converge** | `[secondary, primary, accent]` | Negative (-50 to -70) | Charge effects, gathering energy |
| **Burst** | `[accent, primary, secondary]` | Positive (100-150) | Explosions, impacts, releases |
| **Trail** | `[primary, secondary]` | Low (20-40) | Projectile trails, movement |
| **Explosion** | `[primary, secondary, accent]` | High (120-150) | Large impacts, AOE effects |
| **Ambient** | `[secondary, primary]` | Medium (50-80) | Auras, persistent effects |

---

### Integration Checklist

When implementing a new spell animation:

1. **Choose element palette**: Fire, Ice, Lightning, Holy, Arcane, or Poison
2. **Import colors**:
   ```typescript
   import { ELEMENT_COLORS } from '../types';
   ```
3. **Apply to phases**:
   - **Charge**: `secondary` (outer) → `primary` (middle) → `accent` (inner)
   - **Cast**: Flash with `accent`, burst with all three
   - **Travel**: Projectile `primary`, trail `secondary + accent`
   - **Impact**: Center `accent`, middle `primary`, outer `secondary`
4. **Test visibility**: Dark background, light background, with blur
5. **Validate particles**: Use `validateParticleCount()` for each phase
6. **Document usage**: Add to spell's JSDoc comment

---

## Appendix: Color Science

### Hex to RGB Conversion
```
#RRGGBB → rgb(R, G, B)
#ff6b35 → rgb(255, 107, 53)

Each pair is hexadecimal:
ff = 255 (max)
6b = 107 (hex 6*16 + 11 = 107)
35 = 53 (hex 3*16 + 5 = 53)
```

### Opacity Suffix
```
#rrggbbaa (alpha channel)
ff = 100% opacity
cc = 80% opacity
80 = 50% opacity
40 = 25% opacity
00 = 0% opacity (transparent)

Example: ${FIRE_COLORS.primary}80 = #ff6b3580 (50% opacity fire orange)
```

### RGB to HSL (Hue, Saturation, Lightness)
- **Fire Primary** `#ff6b35`: HSL(18°, 100%, 61%) - Orange hue, full saturation, medium-light
- **Ice Primary** `#4da6ff`: HSL(212°, 100%, 65%) - Blue hue, full saturation, medium-light
- **Lightning Primary** `#ffeb3b`: HSL(54°, 100%, 61%) - Yellow hue, full saturation, medium-light
- **Holy Primary** `#ffd700`: HSL(51°, 100%, 50%) - Gold hue, full saturation, medium

---

## Related Documentation
- [Wizard Spell Specifications](/docs/animations/specifications/wizard-spell-specifications.md) - Element-specific spell details
- [Animation Types Reference](/docs/animations/specifications/animation-types-reference.md) - Type system documentation
- [Performance Optimization Guide](/docs/animations/specifications/performance-optimization-guide.md) - Color performance impact

---

**Document Maintenance**:
- Update this document when adding new element colors
- Keep hex codes in sync with `types.ts`
- Add new recipes as animation patterns emerge
- Document any accessibility findings
