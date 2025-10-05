# sawyers_rpg_game
An RPG game for Sawyer

## Animation System

The game features a comprehensive combat animation system with 10 wizard spell animations, including both normal and critical hit variants.

### Animation Showcase

View and test all animations in the interactive Animation Showcase:

**Quick Access (Standalone):**
```bash
# Open the standalone HTML demo
open animation-showcase.html

# Or serve locally
python3 -m http.server 8000
# Then visit: http://localhost:8000/animation-showcase.html
```

**Full React Component:**
```bash
# Start dev server
npm run dev

# Navigate to: http://localhost:3000/animation-showcase
```

**Features:**
- 10 wizard spell animations (6 offensive, 4 support)
- Normal and critical hit variants
- Interactive playback controls
- Performance monitoring
- Sequential "Play All" mode

**Documentation:**
- Full guide: `docs/animations/animation-showcase-guide.md`
- Animation system: `docs/animations/README.md`
- Design principles: `docs/animations/design-principles.md`
