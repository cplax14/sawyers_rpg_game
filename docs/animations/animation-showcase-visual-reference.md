# Animation Showcase - Visual Reference

This document provides a visual reference for the Animation Showcase UI/UX.

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    Wizard Animation Showcase                            │
│          Interactive demonstration of all wizard spell animations       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────────────────┐
│                  │                                                      │
│  Controls        │  Fireball ⭐ CRITICAL HIT                           │
│  ┌────────────┐  │  ┌─────────────────────────────────────────────────┐│
│  │ ▶  Play    │  │  │ [Playing...] [Critical Hit ⭐] ████░░░░ 450/950ms││
│  └────────────┘  │  └─────────────────────────────────────────────────┘│
│  ┌────────────┐  │                                                      │
│  │ ⏸  Pause   │  │                                                      │
│  └────────────┘  │                  🧙‍♂️              👹               │
│  ┌─────┬──────┐  │                 Wizard           Enemy              │
│  │◀ Prev│Next▶│  │                                                      │
│  └─────┴──────┘  │                                                      │
│  ┌────────────┐  │        [Animation plays here in overlay]            │
│  │▶️ Play All │  │                                                      │
│  └────────────┘  │                                                      │
│                  │                                                      │
│  ☑️ Critical Hit │                                                      │
│     Mode ⭐      │                                                      │
│                  │                                                      │
│  Offensive Spells│                                                      │
│  ┌────────────┐  │                                                      │
│  │Magic Bolt  │  │                                                      │
│  │Arcane Proj.│  │                                                      │
│  └────────────┘  │                                                      │
│  ┌────────────┐  │                                                      │
│  │Fireball   ⭐│←─Current                                              │
│  │Fire Proj.  │  │                                                      │
│  └────────────┘  │                                                      │
│  ┌────────────┐  │                                                      │
│  │Ice Shard  ✓│  │                                                      │
│  │Ice Proj.   │  │                                                      │
│  └────────────┘  │                                                      │
│  ...more spells  │                                                      │
│                  │                                                      │
│  Support Spells  │                                                      │
│  ┌────────────┐  │                                                      │
│  │Heal        │  │                                                      │
│  │Restoration │  │                                                      │
│  └────────────┘  │                                                      │
│  ...more spells  │                                                      │
│                  │                                                      │
│  How to Use:     │                                                      │
│  → Click spell   │                                                      │
│  → Play All mode │                                                      │
│  → Toggle Crit   │                                                      │
│                  │                                                      │
└──────────────────┴──────────────────────────────────────────────────────┘

                Sawyer's RPG Game - Animation System Demo
```

## Color Scheme

### Background Gradient
- **Primary**: `#1a1a2e` (Dark blue-gray)
- **Secondary**: `#16213e` (Darker blue)
- **Style**: Linear gradient 135deg

### UI Elements

**Cards & Panels:**
- Background: `rgba(255, 255, 255, 0.05)` (Subtle transparency)
- Border: `rgba(255, 255, 255, 0.1)` (Light outline)
- Radius: `12px` (Rounded corners)

**Text:**
- Primary: `#ffffff` (White)
- Secondary: `#e0e0e0` (Light gray)
- Tertiary: `#a0a0a0` (Medium gray)
- Muted: `#808080` (Dark gray)

**Accent Colors:**
- Primary Gradient: `#667eea → #764ba2` (Purple gradient)
- Category Headers: `#9c27b0` (Purple)
- Success: `#4caf50` (Green)
- Warning: `#ffc107` (Yellow/Gold)
- Playing: `#4caf50` (Green)
- Idle: `#9e9e9e` (Gray)

**Character Colors:**
- Wizard Border: `#9c27b0` (Purple)
- Wizard Glow: `rgba(156, 39, 176, 0.3)`
- Enemy Border: `#f44336` (Red)
- Enemy Glow: `rgba(244, 67, 54, 0.3)`

## Component Breakdown

### Header Section

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           Wizard Animation Showcase                     │
│   Interactive demonstration of all wizard spells        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Title**: 2.5rem, purple gradient text
- **Subtitle**: 1.1rem, gray
- **Background**: Glass morphism effect
- **Padding**: 20px all sides

### Control Panel (Sidebar)

```
┌──────────────────┐
│ Controls         │
│                  │
│ ┌──────────────┐ │
│ │ ▶ Play       │ │  ← Primary button (purple gradient)
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ ⏸ Pause      │ │  ← Secondary button (translucent)
│ └──────────────┘ │
│ ┌──────┬───────┐ │
│ │◀ Prev│Next ▶ │ │  ← Button group (2 columns)
│ └──────┴───────┘ │
│ ┌──────────────┐ │
│ │▶️ Play All   │ │  ← Action button
│ └──────────────┘ │
│                  │
│ ☑️ Critical Hit  │  ← Toggle switch
│    Mode ⭐       │
│                  │
└──────────────────┘
```

- **Width**: 350px
- **Position**: Sticky, top: 20px
- **Buttons**: 12px padding, 8px border radius
- **Hover**: translateY(-2px), shadow effect

### Spell List

```
┌──────────────────┐
│ OFFENSIVE SPELLS │  ← Category header (purple, uppercase)
│                  │
│ ┌──────────────┐ │
│ │ Magic Bolt   │ │
│ │ Arcane Proj. │ │  ← Spell item (hover: translateX(5px))
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Fireball    ⭐│ │  ← Active spell (blue border, highlighted)
│ │ Fire Proj.   │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Ice Shard   ✓│ │  ← Completed spell (checkmark, 60% opacity)
│ │ Ice Proj.    │ │
│ └──────────────┘ │
│                  │
│ SUPPORT SPELLS   │
│ ...              │
└──────────────────┘
```

- **Items**: 12px padding, 8px margin
- **Active**: Blue background `rgba(102, 126, 234, 0.2)`
- **Completed**: Opacity 0.6, green checkmark
- **Hover**: Background lighten, slide right

### Battle Stage

```
┌─────────────────────────────────────────────────────┐
│ Fireball ⭐ CRITICAL HIT                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │[Playing] [Critical⭐] ████████░░░░  450ms/950ms │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│                                                     │
│     🧙‍♂️                              👹           │
│    Wizard                          Enemy           │
│                                                     │
│           [Fireball animation overlay]             │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Stage**: 500px height, dark background
- **Characters**: 120px × 120px, emoji centered
- **Spacing**: 100px padding left/right
- **Animation**: Absolute positioned overlay, z-index 100

### Status Info Bar

```
┌──────────────────────────────────────────────────────┐
│ Fireball ⭐ CRITICAL HIT                             │
│ ┌────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Playing │ │Critical⭐│ │████████░░░░ │ │450/950ms│ │
│ └────────┘ └─────────┘ └─────────────┘ └─────────┘ │
└──────────────────────────────────────────────────────┘
```

**Badges:**
- **Playing**: Green background, green border
- **Idle**: Gray background, gray border
- **Critical**: Yellow background, yellow border

**Progress Bar:**
- Background: `rgba(255, 255, 255, 0.1)`
- Fill: Purple gradient
- Height: 8px, border-radius: 4px
- Transition: width 0.1s linear

### Instructions Panel

```
┌──────────────────┐
│ How to Use       │  ← Blue header
│ → Click spell    │
│ → Play All mode  │  ← Blue arrow bullets
│ → Toggle Crit    │
│ → Navigation     │
└──────────────────┘
```

- **Background**: `rgba(33, 150, 243, 0.1)` (Blue tint)
- **Border**: `rgba(33, 150, 243, 0.3)`
- **Header**: `#2196f3` (Blue)
- **Bullets**: Blue arrows

## Animation States

### Idle State
```
┌──────────────────────────────────────┐
│ Select a spell to begin              │
│ ┌────────┐                           │
│ │ Idle   │ ░░░░░░░░░░  0ms / 0ms    │
│ └────────┘                           │
└──────────────────────────────────────┘

    🧙‍♂️                    👹
   Wizard                Enemy
```

### Playing State
```
┌──────────────────────────────────────┐
│ Fireball                             │
│ ┌────────┐                           │
│ │Playing │ ████████░░  850ms/950ms  │
│ └────────┘                           │
└──────────────────────────────────────┐

    🧙‍♂️  ~~🔥→→→→→→→   👹
   Wizard                Enemy

   [Fireball projectile traveling]
```

### Critical Hit State
```
┌──────────────────────────────────────┐
│ Fireball ⭐ CRITICAL HIT              │
│ ┌────────┐ ┌─────────┐               │
│ │Playing │ │Critical⭐│ ████  400ms  │
│ └────────┘ └─────────┘               │
└──────────────────────────────────────┘

    🧙‍♂️  ~~🔥💥→→→→   👹
   Wizard                Enemy

   [Enhanced fireball with glow]
```

### Complete State
```
┌──────────────────────────────────────┐
│ Fireball                             │
│ ┌────────┐                           │
│ │Complete│ ░░░░░░░░░░  0ms / 0ms    │
│ └────────┘                           │
└──────────────────────────────────────┘

    🧙‍♂️                    👹💥
   Wizard                Enemy

   [Impact completed]
```

## Responsive Breakpoints

### Desktop (> 1200px)
```
┌────────┬─────────────────┐
│Sidebar │  Battle Stage   │
│ 350px  │    Flexible     │
└────────┴─────────────────┘
```

### Tablet (768px - 1200px)
```
┌──────────────────────────┐
│       Sidebar            │
└──────────────────────────┘
┌──────────────────────────┐
│     Battle Stage         │
└──────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────┐
│   Sidebar      │
└────────────────┘
┌────────────────┐
│ Battle (small) │
│  🧙‍♂️      👹  │
└────────────────┘
```

## Interaction Flows

### Flow 1: Single Spell Test

```
User clicks "Fireball"
        ↓
Spell item highlights (blue border)
        ↓
Status shows "Playing..."
        ↓
Progress bar animates 0% → 100%
        ↓
Animation plays on stage
        ↓
Status shows "Complete"
        ↓
Spell marked with ✓
        ↓
Progress resets to 0%
```

### Flow 2: Play All Sequence

```
User clicks "Play All Spells"
        ↓
First spell (Magic Bolt) starts
        ↓
Animation plays to completion
        ↓
Spell marked ✓, 500ms pause
        ↓
Second spell (Fireball) starts
        ↓
... repeats for all 10 spells
        ↓
All spells marked ✓
        ↓
Status returns to "Idle"
```

### Flow 3: Critical Hit Toggle

```
User checks "Critical Hit Mode ⭐"
        ↓
Critical badge appears
        ↓
User clicks spell
        ↓
Status shows "Playing... Critical Hit ⭐"
        ↓
Animation plays with enhancements:
  - 1.4x larger effects
  - 1.5x more particles
  - Golden glow overlay
  - Screen shake
        ↓
Animation completes
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
- **Page Title**: 2.5rem (40px)
- **Section Headers**: 1.3rem (20.8px)
- **Category Headers**: 1rem (16px)
- **Spell Names**: 0.9-1rem (14.4-16px)
- **Buttons**: 1rem (16px)
- **Labels**: 0.9rem (14.4px)
- **Small Text**: 0.85rem (13.6px)

### Font Weights
- **Headers**: 600-700 (Semibold-Bold)
- **Body**: 400 (Regular)
- **Labels**: 500 (Medium)

## Motion & Timing

### Transitions
- **Hover Effects**: 200ms ease
- **Progress Bar**: 100ms linear (16ms updates)
- **Page Animations**: 300ms ease-out
- **Button Press**: 150ms ease-in-out

### Hover Effects
```css
/* Buttons */
transform: translateY(-2px);
box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);

/* Spell Items */
transform: translateX(5px);
background: rgba(255, 255, 255, 0.1);
```

### Animation Keyframes

**Progress Bar Fill:**
```css
width: 0% → width: 100%
transition: width 0.1s linear
```

**Spell Selection:**
```css
opacity: 0.6 → opacity: 1
border-color: transparent → #667eea
```

## Accessibility Features

### Keyboard Navigation
- Tab through all controls
- Enter to activate buttons
- Space to toggle checkbox
- Arrow keys for spell list

### Screen Reader Support
- Semantic HTML elements
- ARIA labels on controls
- Status announcements
- Progress updates

### Visual Indicators
- High contrast text (WCAG AA)
- Clear focus states
- Color + text status (not color alone)
- Large touch targets (44px+)

## Summary

The Animation Showcase provides a polished, professional interface for testing and demonstrating all wizard spell animations. Key design principles:

1. **Dark Theme**: Matches RPG aesthetic
2. **Clear Hierarchy**: Easy to navigate
3. **Rich Feedback**: Multiple status indicators
4. **Smooth Interactions**: Subtle animations
5. **Responsive**: Works on all screen sizes
6. **Accessible**: Keyboard and screen reader support

The design balances aesthetics with functionality, creating an effective tool for developers, designers, and QA while also serving as an impressive demonstration of the animation system's capabilities.
