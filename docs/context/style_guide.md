# Sawyer's RPG Game - Style Guide

## Overview

This style guide establishes the visual language and design patterns for Sawyer's RPG Game. It ensures consistency across all UI components while maintaining the fantasy RPG aesthetic.

## Design Philosophy

- **Fantasy Medieval Aesthetic**: Rich textures, warm metallics, and parchment-inspired backgrounds
- **High Readability**: Clear typography and sufficient contrast for extended gameplay
- **Touch-Friendly**: Minimum 44px interactive targets for mobile support
- **Performance-First**: Efficient CSS animations and optimized asset loading
- **Accessibility**: WCAG 2.1 AA compliant color contrasts and keyboard navigation

---

## Color System

### Primary Palette

```css
/* Gold Tones - Primary Actions & Highlights */
--primary-gold: #d4af37       /* Primary gold for highlights */
--secondary-gold: #b8860b     /* Darker gold for hover states */
--dark-gold: #8b7355          /* Subdued gold for borders */
--aged-bronze: #cd7f32        /* Bronze accents */

/* Earth Tones - Backgrounds & Containers */
--parchment: #f4e6d0          /* Light backgrounds, cards */
--parchment-light: #f9f2e7    /* Lighter parchment variant */
--dark-parchment: #e8dcc4     /* Darker parchment variant */
--leather-brown: #4a3426      /* Dark leather backgrounds */
--medium-brown: #3d2a1f       /* Mid-tone leather */
--deep-brown: #2d1b0e         /* Deep shadows, borders */

/* Accent Colors - Status & Feedback */
--dragon-red: #c73e1d         /* Danger, HP, critical alerts */
--blood-red: #8b0000          /* Damage indicators */
--emerald-green: #2e8b57      /* Success, stamina */
--forest-green: #228b22       /* Nature elements */
--mystical-purple: #6a4c93    /* Magic, MP, rare items */
--sapphire-blue: #0f52ba      /* Water, ice elements */
```

### Semantic Colors

```css
/* Health & Status */
--color-hp: var(--dragon-red)
--color-mp: var(--mystical-purple)
--color-stamina: var(--emerald-green)
--color-exp: var(--primary-gold)

/* Item Rarity */
--rarity-common: #9e9e9e      /* Gray */
--rarity-uncommon: #4caf50    /* Green */
--rarity-rare: #2196f3        /* Blue */
--rarity-epic: #9c27b0        /* Purple */
--rarity-legendary: #ff9800   /* Orange */
--rarity-mythic: #ff5722      /* Deep Orange */

/* UI Feedback */
--color-success: var(--emerald-green)
--color-warning: #ffa726      /* Amber */
--color-error: var(--dragon-red)
--color-info: var(--sapphire-blue)
```

### Gradient Systems

```css
/* Background Gradients */
--gradient-parchment: linear-gradient(135deg,
  var(--parchment-light) 0%,
  var(--parchment) 50%,
  var(--dark-parchment) 100%)

--gradient-leather: linear-gradient(145deg,
  var(--leather-brown) 0%,
  var(--medium-brown) 50%,
  var(--deep-brown) 100%)

--gradient-gold: linear-gradient(135deg,
  var(--primary-gold) 0%,
  var(--secondary-gold) 50%,
  var(--dark-gold) 100%)

--gradient-metal: linear-gradient(180deg,
  #b8b8b8 0%,
  #808080 50%,
  #5a5a5a 100%)

/* Game-Specific Gradients */
--gradient-game-bg: linear-gradient(135deg,
  #1a1a2e 0%,
  #16213e 50%,
  #0f3460 100%)
```

### Color Usage Guidelines

**Do:**
- Use gold tones for primary actions (Start Game, Attack, Confirm)
- Use red tones for destructive actions (Delete Save, Flee)
- Use parchment backgrounds for text-heavy content
- Use leather backgrounds for darker UI sections
- Apply gradients to large containers for visual depth

**Don't:**
- Use pure black (#000000) - always use deep-brown or leather-brown
- Use pure white (#ffffff) - use parchment or parchment-light
- Mix warm and cool tones in the same component
- Use more than 3 colors in a single component

---

## Typography

### Font Families

```css
/* Display Fonts - Headings & Titles */
--font-fantasy: 'Cinzel', 'Georgia', serif
--font-decorative: 'Almendra', 'Palatino', serif

/* Body Fonts - Content & UI */
--font-body: 'Crimson Text', 'Times New Roman', serif
--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif

/* Monospace - Stats & Numbers */
--font-mono: 'Courier New', 'Courier', monospace
```

### Font Scales

```css
/* Type Scale (1.25 ratio) */
--font-size-xs: 0.75rem     /* 12px - Small labels */
--font-size-sm: 0.875rem    /* 14px - Secondary text */
--font-size-base: 1rem      /* 16px - Body text */
--font-size-md: 1.125rem    /* 18px - Large body */
--font-size-lg: 1.25rem     /* 20px - H4 */
--font-size-xl: 1.5rem      /* 24px - H3 */
--font-size-2xl: 2rem       /* 32px - H2 */
--font-size-3xl: 2.5rem     /* 40px - H1 */
--font-size-4xl: 3rem       /* 48px - Hero text */

/* Line Heights */
--line-height-tight: 1.25
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

### Typography Patterns

**Headings:**
```css
h1, .heading-primary {
  font-family: var(--font-fantasy);
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: var(--line-height-tight);
  color: var(--primary-gold);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05em;
}

h2, .heading-secondary {
  font-family: var(--font-fantasy);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  line-height: var(--line-height-tight);
  color: var(--secondary-gold);
}

h3, .heading-tertiary {
  font-family: var(--font-fantasy);
  font-size: var(--font-size-xl);
  font-weight: 600;
  line-height: var(--line-height-normal);
  color: var(--dark-gold);
}
```

**Body Text:**
```css
body, .text-body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
}

.text-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--text-secondary);
}

.text-label {
  font-family: var(--font-ui);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}
```

**Stats & Numbers:**
```css
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary-gold);
}
```

---

## Spacing & Layout

### Spacing Scale

```css
/* Spacing System (4px base unit) */
--space-0: 0
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
```

### Component Sizing

```css
/* Atomic Design Scale */
--size-atom-sm: 32px        /* Small buttons, icons */
--size-atom-md: 48px        /* Standard buttons */
--size-atom-lg: 64px        /* Large buttons */

--size-molecule-sm: 200px   /* Small cards */
--size-molecule-md: 280px   /* Standard cards */
--size-molecule-lg: 360px   /* Large cards */

--size-organism-sm: 400px   /* Small panels */
--size-organism-md: 600px   /* Standard panels */
--size-organism-lg: 800px   /* Large panels */
--size-organism-xl: 1000px  /* Extra large panels */
```

### Layout Grid

```css
/* Container Max Widths */
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1440px

/* Grid System */
--grid-columns: 12
--grid-gap: var(--space-4)
--grid-gap-sm: var(--space-2)
--grid-gap-lg: var(--space-6)
```

### Responsive Breakpoints

```css
--breakpoint-xs: 320px    /* Small phones */
--breakpoint-sm: 480px    /* Large phones */
--breakpoint-md: 768px    /* Tablets */
--breakpoint-lg: 1024px   /* Small laptops */
--breakpoint-xl: 1200px   /* Desktops */
--breakpoint-2xl: 1440px  /* Large desktops */
```

---

## Component Patterns

### Buttons

**Primary Button:**
```css
.btn-primary {
  background: var(--gradient-gold);
  color: var(--deep-brown);
  font-family: var(--font-fantasy);
  font-size: var(--font-size-base);
  font-weight: 600;
  padding: var(--space-3) var(--space-6);
  border: 2px solid var(--dark-gold);
  border-radius: 8px;
  min-height: var(--touch-target-min);
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  background: var(--secondary-gold);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-primary:disabled {
  background: linear-gradient(135deg, #9e9e9e, #757575);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}
```

**Danger Button:**
```css
.btn-danger {
  background: linear-gradient(135deg, var(--dragon-red), var(--blood-red));
  color: var(--parchment);
  border-color: var(--blood-red);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: var(--gradient-leather);
  color: var(--parchment);
  border-color: var(--deep-brown);
}
```

### Cards

**Standard Card:**
```css
.card {
  background: var(--gradient-parchment);
  border: 3px solid var(--dark-gold);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.card-header {
  font-family: var(--font-fantasy);
  font-size: var(--font-size-xl);
  color: var(--primary-gold);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--dark-gold);
}

.card-body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
}
```

**Item Card (Rarity-Based):**
```css
.item-card {
  position: relative;
  border-width: 3px;
  border-style: solid;
}

.item-card[data-rarity="common"] {
  border-color: var(--rarity-common);
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
}

.item-card[data-rarity="rare"] {
  border-color: var(--rarity-rare);
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.4);
}

.item-card[data-rarity="legendary"] {
  border-color: var(--rarity-legendary);
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.6);
  animation: legendary-pulse 2s ease-in-out infinite;
}

@keyframes legendary-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.6); }
  50% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.9); }
}
```

### Modals

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(13, 13, 13, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: var(--gradient-parchment);
  border: 4px solid var(--primary-gold);
  border-radius: 16px;
  max-width: var(--size-organism-lg);
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-8);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Input Fields

```css
.input-field {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  background: rgba(244, 230, 208, 0.3);
  border: 2px solid var(--dark-gold);
  border-radius: 8px;
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  transition: all 0.3s ease;
  min-height: var(--touch-target-min);
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-gold);
  background: rgba(244, 230, 208, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
}

.input-field::placeholder {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.input-field:disabled {
  background: rgba(244, 230, 208, 0.1);
  cursor: not-allowed;
  opacity: 0.5;
}
```

### Progress Bars

```css
.progress-bar {
  width: 100%;
  height: 24px;
  background: var(--deep-brown);
  border: 2px solid var(--dark-gold);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease, background 0.3s ease;
  position: relative;
  border-radius: 10px;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  border-radius: 10px 10px 0 0;
}

/* HP Bar */
.progress-fill[data-type="hp"] {
  background: linear-gradient(90deg, var(--blood-red), var(--dragon-red));
}

/* MP Bar */
.progress-fill[data-type="mp"] {
  background: linear-gradient(90deg, #4a148c, var(--mystical-purple));
}

/* XP Bar */
.progress-fill[data-type="xp"] {
  background: var(--gradient-gold);
}
```

---

## RPG-Specific Patterns

### Character Cards

```css
.character-card {
  background: var(--gradient-leather);
  border: 4px solid var(--primary-gold);
  border-radius: 16px;
  padding: var(--space-6);
  min-width: var(--size-molecule-md);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.4),
    inset 0 2px 0 rgba(255, 255, 255, 0.1);
}

.character-portrait {
  width: 120px;
  height: 120px;
  border: 3px solid var(--primary-gold);
  border-radius: 50%;
  margin: 0 auto var(--space-4);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.character-name {
  font-family: var(--font-fantasy);
  font-size: var(--font-size-xl);
  color: var(--primary-gold);
  text-align: center;
  margin-bottom: var(--space-2);
}

.character-class {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  color: var(--parchment);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.character-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2);
  background: rgba(45, 27, 14, 0.4);
  border-radius: 6px;
}
```

### Inventory Grid

```css
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--gradient-leather);
  border: 3px solid var(--dark-gold);
  border-radius: 12px;
}

.inventory-slot {
  aspect-ratio: 1;
  background: rgba(244, 230, 208, 0.2);
  border: 2px solid var(--dark-gold);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.inventory-slot:hover {
  background: rgba(244, 230, 208, 0.3);
  border-color: var(--primary-gold);
  transform: scale(1.05);
}

.inventory-slot.filled {
  background: rgba(212, 175, 55, 0.2);
}

.inventory-slot.empty {
  opacity: 0.4;
}

.item-quantity {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--parchment);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
```

### Combat UI

```css
.combat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
}

.combat-battlefield {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-8);
  position: relative;
}

.combat-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--gradient-leather);
  border-top: 4px solid var(--primary-gold);
}

.action-button {
  min-height: 80px;
  font-size: var(--font-size-lg);
  background: var(--gradient-gold);
  border: 3px solid var(--dark-gold);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
}

.damage-number {
  position: absolute;
  font-family: var(--font-fantasy);
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--dragon-red);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  animation: damage-float 1.5s ease-out forwards;
}

@keyframes damage-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1.5);
  }
}
```

### Skill Trees

```css
.skill-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8);
  background: var(--gradient-parchment);
}

.skill-tier {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  position: relative;
}

.skill-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid var(--dark-gold);
  background: var(--gradient-leather);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.skill-node.unlocked {
  border-color: var(--primary-gold);
  background: var(--gradient-gold);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
}

.skill-node.available {
  border-color: var(--emerald-green);
  animation: pulse-available 2s ease-in-out infinite;
}

@keyframes pulse-available {
  0%, 100% { box-shadow: 0 0 10px rgba(46, 139, 87, 0.4); }
  50% { box-shadow: 0 0 20px rgba(46, 139, 87, 0.8); }
}

.skill-node.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-connection {
  position: absolute;
  height: 4px;
  background: var(--dark-gold);
  transform-origin: left center;
}

.skill-connection.unlocked {
  background: var(--primary-gold);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}
```

---

## Animations & Transitions

### Transition Speeds

```css
--transition-fast: 0.15s ease
--transition-normal: 0.3s ease
--transition-slow: 0.5s ease
--transition-slowest: 0.8s ease
```

### Animation Presets

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.anim-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Scale Pop */
@keyframes scalePop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.anim-scale-pop {
  animation: scalePop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Shake (for errors) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.anim-shake {
  animation: shake 0.4s ease-in-out;
}

/* Glow Pulse */
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(212, 175, 55, 0.8);
  }
}

.anim-glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}
```

### Interactive States

```css
/* Hover Lift */
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

/* Hover Glow */
.hover-glow:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
}

/* Active Press */
.active-press:active {
  transform: scale(0.95);
}
```

---

## Accessibility

### Minimum Requirements

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- **Touch Targets**: Minimum 44x44px for mobile, 48x48px preferred
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Focus Indicators**: Visible focus states on all interactive elements
- **Alt Text**: Descriptive alternative text for all images and icons
- **ARIA Labels**: Appropriate ARIA labels for complex components

### Focus States

```css
*:focus-visible {
  outline: 3px solid var(--primary-gold);
  outline-offset: 2px;
}

button:focus-visible,
.btn:focus-visible {
  outline: 3px solid var(--primary-gold);
  outline-offset: 4px;
  box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.2);
}

input:focus-visible,
textarea:focus-visible {
  border-color: var(--primary-gold);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
}
```

### Screen Reader Support

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Responsive Design

### Mobile-First Approach

Design for mobile devices first, then enhance for larger screens.

### Breakpoint Strategy

```css
/* Base styles (mobile) - 320px+ */
.container {
  padding: var(--space-4);
}

/* Small phones and up - 480px+ */
@media (min-width: 480px) {
  .container {
    padding: var(--space-6);
  }
}

/* Tablets and up - 768px+ */
@media (min-width: 768px) {
  .container {
    padding: var(--space-8);
    max-width: var(--container-md);
  }
}

/* Laptops and up - 1024px+ */
@media (min-width: 1024px) {
  .container {
    max-width: var(--container-lg);
  }
}

/* Desktops and up - 1440px+ */
@media (min-width: 1440px) {
  .container {
    max-width: var(--container-2xl);
  }
}
```

### Touch Optimizations

```css
/* Increase interactive areas on touch devices */
@media (hover: none) and (pointer: coarse) {
  .btn,
  .action-button {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
  }

  .inventory-slot {
    min-width: 64px;
    min-height: 64px;
  }
}
```

---

## Performance Guidelines

### CSS Best Practices

1. **Use CSS Variables**: Define colors and sizing once, reference everywhere
2. **Minimize Repaints**: Animate `transform` and `opacity` instead of `width`, `height`, or `top`/`left`
3. **GPU Acceleration**: Use `will-change` sparingly for animated elements
4. **Avoid Expensive Properties**: Minimize use of `box-shadow`, `border-radius`, and `filter` on animated elements

### Animation Performance

```css
/* GPU-accelerated animations */
.animated-element {
  will-change: transform, opacity;
}

/* Clean up after animation completes */
@keyframes optimizedSlide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-in {
  animation: optimizedSlide 0.3s ease-out forwards;
}
```

### Loading States

```css
.skeleton-loader {
  background: linear-gradient(
    90deg,
    rgba(244, 230, 208, 0.1) 25%,
    rgba(244, 230, 208, 0.2) 50%,
    rgba(244, 230, 208, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Implementation Checklist

When implementing a new component, verify:

- [ ] Uses CSS variables from theme.css for all colors
- [ ] Follows naming conventions (.component-name, .component-name__element)
- [ ] Implements all interactive states (default, hover, active, focus, disabled)
- [ ] Meets minimum touch target sizes (44px+)
- [ ] Includes focus-visible styles for keyboard navigation
- [ ] Uses appropriate font families (fantasy for headers, body for content)
- [ ] Implements smooth transitions (0.3s ease)
- [ ] Follows mobile-first responsive design
- [ ] Includes loading and error states where applicable
- [ ] Maintains 4.5:1 color contrast minimum
- [ ] Uses semantic HTML elements
- [ ] Includes appropriate ARIA labels

---

## References

- **Theme Variables**: `/src/styles/theme.css`
- **Global Styles**: `/src/styles/global.css`
- **Legacy Styles**: `/public/css/styles.css`
- **Design Principles**: `/docs/context/rpg_design_principles.md`
- **Atomic Design Pattern**: https://atomicdesign.bradfrost.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/