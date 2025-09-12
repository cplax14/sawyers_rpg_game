# Audio Assets Directory

This directory will contain all audio assets for Sawyer's RPG Game.

## Planned Structure:

### Background Music
- `music/village_theme.ogg` - Peaceful village background music
- `music/forest_theme.ogg` - Forest exploration music
- `music/cave_theme.ogg` - Dungeon/cave atmosphere
- `music/combat_theme.ogg` - Battle music
- `music/boss_theme.ogg` - Epic boss battle music
- `music/victory_theme.ogg` - Victory fanfare

### Sound Effects
- `sfx/menu_select.ogg` - Menu selection sound
- `sfx/menu_confirm.ogg` - Menu confirmation sound
- `sfx/attack_sword.ogg` - Sword attack sound
- `sfx/attack_magic.ogg` - Magic spell sound
- `sfx/monster_capture.ogg` - Monster capture success
- `sfx/level_up.ogg` - Level up notification
- `sfx/footsteps.ogg` - Walking sound effects
- `sfx/monster_roar.ogg` - Monster battle cries

### Monster Sounds
- `monsters/slime_bounce.ogg` - Slime movement sound
- `monsters/goblin_screech.ogg` - Goblin attack sound
- `monsters/wolf_howl.ogg` - Wolf howling
- `monsters/dragon_roar.ogg` - Dragon roar

### Ambient Sounds
- `ambient/forest_birds.ogg` - Forest bird sounds
- `ambient/cave_drips.ogg` - Cave water dripping
- `ambient/wind_mountain.ogg` - Mountain wind
- `ambient/fire_crackling.ogg` - Fire/lava sounds

## Audio Requirements:
- Format: OGG Vorbis (primary) with MP3 fallback for compatibility
- Quality: 44.1kHz, 16-bit for music; compressed for SFX
- Volume: Normalized levels for consistent playback
- Looping: Seamless loops for background music
- Compression: Optimized file sizes for web delivery

## Volume Categories:
- Master Volume: Overall game audio control
- Music Volume: Background music and themes
- SFX Volume: Sound effects and UI sounds
- Ambient Volume: Environmental and atmosphere sounds

## Placeholder System:
Until actual audio is created, the game will use:
- Simple synthesized tones for UI feedback
- Basic drum samples for combat
- Optional Web Audio API generated sounds
- Silent fallbacks with visual-only feedback

## Implementation Notes:
- HTML5 Audio API with fallbacks
- Audio sprite sheets for efficient loading
- Preloading system for smooth transitions
- Mobile device audio handling considerations