/**
 * Tests for CreatureCard Component
 *
 * Tests rendering and display features for Task 8.0-10.0:
 * - Exhaustion display (badge, overlay, stat penalties)
 * - Generation badges and bred indicator
 * - Mythical aura effect
 * - Passive trait display
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CreatureCard } from './CreatureCard';
import { EnhancedCreature } from '../../types/creatures';
import { ReactGameProvider } from '../../contexts/ReactGameContext';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockCreature = (overrides: Partial<EnhancedCreature> = {}): EnhancedCreature => ({
  creatureId: 'test_creature_1',
  id: 'test_creature_1',
  name: 'Test Creature',
  species: 'test_species',
  level: 10,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  baseStats: {
    attack: 20,
    defense: 18,
    magicAttack: 15,
    magicDefense: 14,
    speed: 16,
    accuracy: 85
  },
  currentStats: {
    attack: 20,
    defense: 18,
    magicAttack: 15,
    magicDefense: 14,
    speed: 16,
    accuracy: 85
  },
  stats: {
    attack: 20,
    defense: 18,
    magicAttack: 15,
    magicDefense: 14,
    speed: 16,
    accuracy: 85
  },
  types: ['beast'],
  rarity: 'common',
  abilities: [],
  captureRate: 0.5,
  experience: 0,
  gold: 10,
  drops: [],
  areas: [],
  evolvesTo: [],
  isWild: true,
  element: 'neutral',
  creatureType: 'beast',
  size: 'medium',
  habitat: ['forest'],
  personality: {
    traits: ['docile'],
    mood: 'content',
    loyalty: 50,
    happiness: 50,
    energy: 50,
    sociability: 50
  },
  nature: {
    name: 'Neutral',
    statModifiers: {},
    behaviorModifiers: {
      aggression: 0,
      defensiveness: 0,
      cooperation: 0
    }
  },
  individualStats: {
    hpIV: 15,
    attackIV: 15,
    defenseIV: 15,
    magicAttackIV: 15,
    magicDefenseIV: 15,
    speedIV: 15,
    hpEV: 0,
    attackEV: 0,
    defenseEV: 0,
    magicAttackEV: 0,
    magicDefenseEV: 0,
    speedEV: 0
  },
  genetics: {
    parentIds: [],
    generation: 0,
    inheritedTraits: [],
    mutations: [],
    breedingPotential: 1
  },
  breedingGroup: ['test'],
  fertility: 1,
  generation: 0,
  breedingCount: 0,
  exhaustionLevel: 0,
  inheritedAbilities: [],
  parentIds: [],
  statCaps: {},
  collectionStatus: {
    discovered: true,
    captured: true,
    timesCaptures: 1,
    favorite: false,
    tags: [],
    notes: '',
    completionLevel: 'captured'
  },
  sprite: 'test.png',
  description: 'A test creature for unit testing',
  loreText: 'Test lore',
  discoveryLocation: 'Test Area',
  discoveredAt: new Date(),
  timesEncountered: 1,
  attack: 20,
  defense: 18,
  ...overrides
});

// Wrapper to provide context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

// =============================================================================
// EXHAUSTION DISPLAY TESTS (Task 8.0)
// =============================================================================

describe('CreatureCard - Exhaustion Display', () => {
  it('should not show exhaustion badge for non-exhausted creature', () => {
    const creature = createMockCreature({ exhaustionLevel: 0 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const exhaustionBadge = screen.queryByText(/×/);
    expect(exhaustionBadge).not.toBeInTheDocument();
  });

  it('should display exhaustion badge with level for exhausted creature', () => {
    const creature = createMockCreature({ exhaustionLevel: 2 });

    render(<CreatureCard creature={creature} />, { wrapper });

    // Check for exhaustion indicator (emoji and multiplier)
    const exhaustionBadge = screen.getByText(/×2/);
    expect(exhaustionBadge).toBeInTheDocument();
  });

  it('should show correct exhaustion level in badge', () => {
    const creature = createMockCreature({ exhaustionLevel: 3 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const exhaustionBadge = screen.getByText(/×3/);
    expect(exhaustionBadge).toBeInTheDocument();
  });

  it('should display stat penalty percentage in exhaustion warning', () => {
    const creature = createMockCreature({ exhaustionLevel: 2 });

    render(<CreatureCard creature={creature} />, { wrapper });

    // 2 exhaustion levels = -40% stats
    const warningText = screen.getByText(/All stats reduced by 40%/);
    expect(warningText).toBeInTheDocument();
  });

  it('should show exhaustion warning message', () => {
    const creature = createMockCreature({ exhaustionLevel: 1 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const recoveryText = screen.getByText(/Use recovery items or rest to restore/);
    expect(recoveryText).toBeInTheDocument();
  });

  it('should display stat penalties inline with stats', () => {
    const creature = createMockCreature({
      exhaustionLevel: 1,
      attack: 20,
      defense: 18
    });

    render(<CreatureCard creature={creature} />, { wrapper });

    // Check for -20% penalty indicators (one for attack, one for defense)
    const statPenalties = screen.getAllByText(/\(-20%\)/);
    expect(statPenalties.length).toBeGreaterThanOrEqual(2);
  });

  it('should calculate correct penalty for high exhaustion levels', () => {
    const creature = createMockCreature({ exhaustionLevel: 4 });

    render(<CreatureCard creature={creature} />, { wrapper });

    // 4 exhaustion levels = -80% stats
    const warningText = screen.getByText(/All stats reduced by 80%/);
    expect(warningText).toBeInTheDocument();
  });
});

// =============================================================================
// GENERATION BADGE TESTS (Task 9.0)
// =============================================================================

describe('CreatureCard - Generation Badge', () => {
  it('should not show generation badge for wild creatures (Gen 0)', () => {
    const creature = createMockCreature({ generation: 0 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.queryByText(/G\d/);
    expect(genBadge).not.toBeInTheDocument();
  });

  it('should show generation badge for Gen 1 creature', () => {
    const creature = createMockCreature({ generation: 1 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.getByText('G1');
    expect(genBadge).toBeInTheDocument();
  });

  it('should show correct generation number for Gen 3 creature', () => {
    const creature = createMockCreature({ generation: 3 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.getByText('G3');
    expect(genBadge).toBeInTheDocument();
  });

  it('should show generation badge for Gen 5 creature', () => {
    const creature = createMockCreature({ generation: 5 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.getByText('G5');
    expect(genBadge).toBeInTheDocument();
  });

  it('should show bred indicator for Gen 1+ creatures', () => {
    const creature = createMockCreature({ generation: 2 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const bredText = screen.getByText('Bred');
    expect(bredText).toBeInTheDocument();
  });

  it('should not show bred indicator for wild creatures', () => {
    const creature = createMockCreature({ generation: 0 });

    render(<CreatureCard creature={creature} />, { wrapper });

    const bredText = screen.queryByText('Bred');
    expect(bredText).not.toBeInTheDocument();
  });
});

// =============================================================================
// MYTHICAL AURA TESTS (Task 10.0)
// =============================================================================

describe('CreatureCard - Mythical Aura', () => {
  it('should not show mythical aura for common rarity', () => {
    const creature = createMockCreature({ rarity: 'common' });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    // Mythical aura has specific animation style
    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');
    expect(auraElements.length).toBe(0);
  });

  it('should not show mythical aura for rare rarity', () => {
    const creature = createMockCreature({ rarity: 'rare' });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');
    expect(auraElements.length).toBe(0);
  });

  it('should not show mythical aura for legendary rarity', () => {
    const creature = createMockCreature({ rarity: 'legendary' });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');
    expect(auraElements.length).toBe(0);
  });

  it('should show mythical aura for mythical rarity', () => {
    const creature = createMockCreature({ rarity: 'mythical' });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    // Mythical aura has specific animation
    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');
    expect(auraElements.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// COMBINED FEATURES TESTS
// =============================================================================

describe('CreatureCard - Combined Features', () => {
  it('should show both generation badge and exhaustion for bred exhausted creature', () => {
    const creature = createMockCreature({
      generation: 2,
      exhaustionLevel: 1
    });

    render(<CreatureCard creature={creature} />, { wrapper });

    // Both badges should be present
    const genBadge = screen.getByText('G2');
    const exhaustionBadge = screen.getByText(/×1/);

    expect(genBadge).toBeInTheDocument();
    expect(exhaustionBadge).toBeInTheDocument();
  });

  it('should show generation badge, exhaustion, and bred indicator together', () => {
    const creature = createMockCreature({
      generation: 3,
      exhaustionLevel: 2
    });

    render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.getByText('G3');
    const bredText = screen.getByText('Bred');
    const exhaustionBadge = screen.getByText(/×2/);

    expect(genBadge).toBeInTheDocument();
    expect(bredText).toBeInTheDocument();
    expect(exhaustionBadge).toBeInTheDocument();
  });

  it('should show mythical aura with generation badge for bred mythical creature', () => {
    const creature = createMockCreature({
      generation: 4,
      rarity: 'mythical'
    });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    const genBadge = screen.getByText('G4');
    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');

    expect(genBadge).toBeInTheDocument();
    expect(auraElements.length).toBeGreaterThan(0);
  });

  it('should render all features for exhausted mythical Gen 5 creature', () => {
    const creature = createMockCreature({
      generation: 5,
      exhaustionLevel: 3,
      rarity: 'mythical'
    });

    const { container } = render(<CreatureCard creature={creature} />, { wrapper });

    // Check all features
    const genBadge = screen.getByText('G5');
    const bredText = screen.getByText('Bred');
    const exhaustionBadge = screen.getByText(/×3/);
    const exhaustionWarning = screen.getByText(/All stats reduced by 60%/);
    const auraElements = container.querySelectorAll('[style*="mythicalPulse"]');

    expect(genBadge).toBeInTheDocument();
    expect(bredText).toBeInTheDocument();
    expect(exhaustionBadge).toBeInTheDocument();
    expect(exhaustionWarning).toBeInTheDocument();
    expect(auraElements.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// RARITY BADGE TESTS
// =============================================================================

describe('CreatureCard - Rarity Display', () => {
  it('should display common rarity', () => {
    const creature = createMockCreature({ rarity: 'common' });

    render(<CreatureCard creature={creature} />, { wrapper });

    const rarityText = screen.getByText(/common/i);
    expect(rarityText).toBeInTheDocument();
  });

  it('should display mythical rarity', () => {
    const creature = createMockCreature({ rarity: 'mythical' });

    render(<CreatureCard creature={creature} />, { wrapper });

    const rarityText = screen.getByText(/mythical/i);
    expect(rarityText).toBeInTheDocument();
  });
});
