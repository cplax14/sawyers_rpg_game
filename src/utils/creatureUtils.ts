/**
 * Creature Utilities
 * Comprehensive utility functions for creature breeding, combat calculations, and management
 */

import {
  EnhancedCreature,
  CreatureType,
  CreatureElement,
  CreatureRarity,
  CreatureGenetics,
  CreatureNature,
  CreaturePersonality,
  CreatureIndividualStats,
  BreedingPair,
  BreedingResult,
  CreatureCompatibility,
  CreatureCombatStats,
  CreatureEvolution,
  CreatureFilter,
  BestiaryEntry,
  CreatureCompanionData
} from '../types/creatures';
import { PlayerStats } from '../types/game';

// ================================
// CREATURE FILTERING AND SEARCH
// ================================

/**
 * Filter creatures based on various criteria
 */
export const filterCreatures = (
  creatures: EnhancedCreature[],
  filter: CreatureFilter
): EnhancedCreature[] => {
  return creatures.filter(creature => {
    // Type filter
    if (filter.types && filter.types.length > 0 && !filter.types.includes(creature.creatureType)) {
      return false;
    }

    // Element filter
    if (filter.elements && filter.elements.length > 0 && !filter.elements.includes(creature.element)) {
      return false;
    }

    // Rarity filter
    if (filter.rarities && filter.rarities.length > 0 && !filter.rarities.includes(creature.rarity as CreatureRarity)) {
      return false;
    }

    // Level range filter
    if (filter.minLevel !== undefined && creature.level < filter.minLevel) {
      return false;
    }
    if (filter.maxLevel !== undefined && creature.level > filter.maxLevel) {
      return false;
    }

    // Capture status filter
    if (filter.capturedOnly !== undefined) {
      const isCaptured = !!creature.capturedAt;
      if (filter.capturedOnly !== isCaptured) {
        return false;
      }
    }

    // Team status filter
    if (filter.inTeamOnly !== undefined) {
      const inTeam = !!creature.companionData?.isActive;
      if (filter.inTeamOnly !== inTeam) {
        return false;
      }
    }

    // Favorite status filter
    if (filter.favoritesOnly !== undefined) {
      const isFavorite = !!creature.companionData?.isFavorite;
      if (filter.favoritesOnly !== isFavorite) {
        return false;
      }
    }

    // Breeding eligibility filter
    if (filter.breedingEligible !== undefined) {
      const isEligible = isBreedingEligible(creature);
      if (filter.breedingEligible !== isEligible) {
        return false;
      }
    }

    // Habitat filter
    if (filter.habitats && filter.habitats.length > 0) {
      const hasMatchingHabitat = filter.habitats.some(habitat =>
        creature.habitat.includes(habitat)
      );
      if (!hasMatchingHabitat) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Search creatures by name or description
 */
export const searchCreatures = (
  creatures: EnhancedCreature[],
  query: string,
  searchFields: ('name' | 'description' | 'species' | 'creatureType' | 'element')[] = ['name', 'description', 'species']
): EnhancedCreature[] => {
  if (!query.trim()) {
    return creatures;
  }

  const searchTerm = query.toLowerCase().trim();

  return creatures.filter(creature => {
    return searchFields.some(field => {
      const value = creature[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm);
      }
      return false;
    });
  });
};

/**
 * Get creatures by type
 */
export const getCreaturesByType = (
  creatures: EnhancedCreature[],
  type: CreatureType
): EnhancedCreature[] => {
  return creatures.filter(creature => creature.creatureType === type);
};

/**
 * Get creatures by element
 */
export const getCreaturesByElement = (
  creatures: EnhancedCreature[],
  element: CreatureElement
): EnhancedCreature[] => {
  return creatures.filter(creature => creature.element === element);
};

// ================================
// CREATURE SORTING
// ================================

export type CreatureSortField = 'name' | 'level' | 'rarity' | 'type' | 'element' | 'capturedAt' | 'discoveredAt' | 'hp' | 'attack' | 'defense';
export type SortOrder = 'asc' | 'desc';

/**
 * Sort creatures by specified field and order
 */
export const sortCreatures = (
  creatures: EnhancedCreature[],
  field: CreatureSortField,
  order: SortOrder = 'asc'
): EnhancedCreature[] => {
  const sorted = [...creatures].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;

      case 'level':
        comparison = a.level - b.level;
        break;

      case 'rarity':
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        const aRarityIndex = rarityOrder.indexOf(a.rarity || 'common');
        const bRarityIndex = rarityOrder.indexOf(b.rarity || 'common');
        comparison = aRarityIndex - bRarityIndex;
        break;

      case 'type':
        comparison = a.creatureType.localeCompare(b.creatureType);
        break;

      case 'element':
        comparison = a.element.localeCompare(b.element);
        break;

      case 'capturedAt':
        const aDate = a.capturedAt?.getTime() || 0;
        const bDate = b.capturedAt?.getTime() || 0;
        comparison = aDate - bDate;
        break;

      case 'discoveredAt':
        comparison = a.discoveredAt.getTime() - b.discoveredAt.getTime();
        break;

      case 'hp':
        comparison = a.hp - b.hp;
        break;

      case 'attack':
        comparison = a.attack - b.attack;
        break;

      case 'defense':
        comparison = a.defense - b.defense;
        break;

      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
};

// ================================
// CREATURE BREEDING SYSTEM
// ================================

/**
 * Check if a creature is eligible for breeding
 */
export const isBreedingEligible = (creature: EnhancedCreature): boolean => {
  // Must be captured
  if (!creature.capturedAt) return false;

  // Must be above minimum level (usually 10)
  if (creature.level < 10) return false;

  // Must have fertility above 0
  if (creature.fertility <= 0) return false;

  // Must not be exhausted (could check mood/energy)
  if (creature.personality && creature.personality.energy < 30) return false;

  return true;
};

/**
 * Check breeding compatibility between two creatures
 */
export const checkBreedingCompatibility = (
  creature1: EnhancedCreature,
  creature2: EnhancedCreature
): CreatureCompatibility => {
  const compatibility: CreatureCompatibility = {
    compatible: false,
    compatibilityScore: 0,
    reasons: [],
    successChance: 0,
    estimatedTime: 0,
    offspringPredictions: []
  };

  // Cannot breed with self
  if (creature1.creatureId === creature2.creatureId) {
    compatibility.reasons.push('Cannot breed creature with itself');
    return compatibility;
  }

  // Both must be breeding eligible
  if (!isBreedingEligible(creature1)) {
    compatibility.reasons.push(`${creature1.name} is not breeding eligible`);
  }
  if (!isBreedingEligible(creature2)) {
    compatibility.reasons.push(`${creature2.name} is not breeding eligible`);
  }

  if (compatibility.reasons.length > 0) {
    return compatibility;
  }

  // Check breeding group compatibility
  const sharedGroups = creature1.breedingGroup.filter(group =>
    creature2.breedingGroup.includes(group)
  );

  if (sharedGroups.length === 0) {
    compatibility.reasons.push('No shared breeding groups');
    return compatibility;
  }

  // Calculate compatibility score
  let score = 50; // Base score

  // Same species bonus
  if (creature1.species === creature2.species) {
    score += 30;
  }

  // Same type bonus
  if (creature1.creatureType === creature2.creatureType) {
    score += 20;
  }

  // Complementary elements bonus
  const elementPairs = [
    ['fire', 'water'],
    ['earth', 'air'],
    ['light', 'dark'],
    ['ice', 'lightning']
  ];

  const hasComplementaryElements = elementPairs.some(pair =>
    (pair.includes(creature1.element) && pair.includes(creature2.element)) &&
    creature1.element !== creature2.element
  );

  if (hasComplementaryElements) {
    score += 15;
  }

  // Level difference penalty
  const levelDiff = Math.abs(creature1.level - creature2.level);
  score -= Math.min(levelDiff * 2, 30);

  // Personality compatibility
  if (creature1.personality && creature2.personality) {
    const personalityScore = calculatePersonalityCompatibility(
      creature1.personality,
      creature2.personality
    );
    score += personalityScore;
  }

  compatibility.compatibilityScore = Math.max(0, Math.min(100, score));
  compatibility.compatible = compatibility.compatibilityScore >= 30;
  compatibility.successChance = Math.min(95, compatibility.compatibilityScore * 0.8);
  compatibility.estimatedTime = Math.max(1, 10 - Math.floor(compatibility.compatibilityScore / 20));

  // Generate offspring predictions
  if (compatibility.compatible) {
    compatibility.offspringPredictions = generateOffspringPredictions(creature1, creature2);
  }

  return compatibility;
};

/**
 * Calculate personality compatibility between two creatures
 */
export const calculatePersonalityCompatibility = (
  personality1: CreaturePersonality,
  personality2: CreaturePersonality
): number => {
  let score = 0;

  // Mood compatibility
  const moodCompatibility = {
    happy: ['happy', 'excited', 'content'],
    content: ['content', 'happy', 'neutral'],
    neutral: ['neutral', 'content', 'sad'],
    sad: ['sad', 'neutral', 'tired'],
    angry: ['angry', 'excited'],
    excited: ['excited', 'happy', 'angry'],
    tired: ['tired', 'content', 'sad']
  };

  if (moodCompatibility[personality1.mood]?.includes(personality2.mood)) {
    score += 10;
  }

  // Trait compatibility
  const compatibleTraits = [
    ['aggressive', 'protective'],
    ['docile', 'playful'],
    ['serious', 'protective'],
    ['curious', 'playful'],
    ['energetic', 'playful'],
    ['independent', 'serious'],
    ['clingy', 'protective']
  ];

  const hasCompatibleTraits = personality1.traits && personality2.traits && compatibleTraits.some(pair =>
    (personality1.traits.includes(pair[0] as any) && personality2.traits.includes(pair[1] as any)) ||
    (personality1.traits.includes(pair[1] as any) && personality2.traits.includes(pair[0] as any))
  );

  if (hasCompatibleTraits) {
    score += 15;
  }

  // Loyalty and happiness balance
  const loyaltyDiff = Math.abs(personality1.loyalty - personality2.loyalty);
  const happinessDiff = Math.abs(personality1.happiness - personality2.happiness);

  score -= Math.floor((loyaltyDiff + happinessDiff) / 20);

  return Math.max(-10, Math.min(25, score));
};

/**
 * Generate offspring predictions for breeding pair
 */
export const generateOffspringPredictions = (
  parent1: EnhancedCreature,
  parent2: EnhancedCreature
): any[] => {
  const predictions = [];

  // Primary species outcome (75% chance of parent species)
  predictions.push({
    type: 'primary',
    chance: 75,
    species: Math.random() > 0.5 ? parent1.species : parent2.species,
    element: getInheritedElement(parent1.element, parent2.element),
    rarity: getInheritedRarity(parent1.rarity as CreatureRarity, parent2.rarity as CreatureRarity),
    traits: mixTraits(parent1.personality?.traits || [], parent2.personality?.traits || [])
  });

  // Hybrid outcome (20% chance)
  predictions.push({
    type: 'hybrid',
    chance: 20,
    species: `${parent1.species}-${parent2.species} Hybrid`,
    element: parent1.element !== parent2.element ?
      ['fire', 'water'].includes(parent1.element) && ['fire', 'water'].includes(parent2.element) ? 'steam' :
      ['earth', 'air'].includes(parent1.element) && ['earth', 'air'].includes(parent2.element) ? 'dust' :
      'neutral' : parent1.element,
    rarity: upgradeRarity(getInheritedRarity(parent1.rarity as CreatureRarity, parent2.rarity as CreatureRarity)),
    traits: mixTraits(parent1.personality?.traits || [], parent2.personality?.traits || [], true)
  });

  // Rare mutation (5% chance)
  predictions.push({
    type: 'mutation',
    chance: 5,
    species: `Rare ${parent1.species} Variant`,
    element: getRandomElement(),
    rarity: 'legendary',
    traits: generateRandomTraits()
  });

  return predictions;
};

/**
 * Determine inherited element from parents
 */
export const getInheritedElement = (element1: CreatureElement, element2: CreatureElement): CreatureElement => {
  if (element1 === element2) return element1;

  // Elemental combinations
  const combinations: Record<string, CreatureElement> = {
    'fire-water': 'neutral',
    'fire-ice': 'water',
    'fire-earth': 'lightning',
    'water-earth': 'nature',
    'water-air': 'ice',
    'earth-air': 'neutral',
    'light-dark': 'neutral',
    'lightning-water': 'ice',
    'nature-fire': 'earth'
  };

  const key1 = `${element1}-${element2}`;
  const key2 = `${element2}-${element1}`;

  return combinations[key1] || combinations[key2] || (Math.random() > 0.5 ? element1 : element2);
};

/**
 * Determine inherited rarity from parents
 */
export const getInheritedRarity = (rarity1: CreatureRarity, rarity2: CreatureRarity): CreatureRarity => {
  const rarityValues = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythical: 6
  };

  const rarityNames = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'] as CreatureRarity[];

  const avg = (rarityValues[rarity1] + rarityValues[rarity2]) / 2;
  const baseIndex = Math.floor(avg) - 1;

  // Small chance to upgrade or downgrade
  const roll = Math.random();
  if (roll < 0.1 && baseIndex > 0) {
    return rarityNames[baseIndex - 1]; // Downgrade
  } else if (roll > 0.9 && baseIndex < rarityNames.length - 1) {
    return rarityNames[baseIndex + 1]; // Upgrade
  }

  return rarityNames[Math.max(0, Math.min(rarityNames.length - 1, baseIndex))];
};

/**
 * Upgrade rarity by one tier
 */
export const upgradeRarity = (rarity: CreatureRarity): CreatureRarity => {
  const rarityOrder: CreatureRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
  const currentIndex = rarityOrder.indexOf(rarity);
  return rarityOrder[Math.min(currentIndex + 1, rarityOrder.length - 1)];
};

/**
 * Mix personality traits from parents
 */
export const mixTraits = (traits1: any[], traits2: any[], enhanced = false): any[] => {
  const allTraits = [...new Set([...traits1, ...traits2])];
  const mixedTraits = [];

  // Inherit some traits from each parent
  mixedTraits.push(...traits1.slice(0, Math.floor(traits1.length / 2)));
  mixedTraits.push(...traits2.slice(0, Math.floor(traits2.length / 2)));

  // Chance for new trait
  if (enhanced || Math.random() > 0.7) {
    const possibleTraits = ['aggressive', 'docile', 'playful', 'serious', 'curious', 'lazy', 'energetic', 'protective', 'independent', 'clingy'];
    const newTrait = possibleTraits[Math.floor(Math.random() * possibleTraits.length)];
    if (!mixedTraits.includes(newTrait)) {
      mixedTraits.push(newTrait);
    }
  }

  return [...new Set(mixedTraits)].slice(0, 3); // Max 3 traits
};

/**
 * Generate random traits for mutations
 */
export const generateRandomTraits = (): any[] => {
  const allTraits = ['aggressive', 'docile', 'playful', 'serious', 'curious', 'lazy', 'energetic', 'protective', 'independent', 'clingy'];
  const numTraits = Math.floor(Math.random() * 3) + 1;
  const traits = [];

  for (let i = 0; i < numTraits; i++) {
    const trait = allTraits[Math.floor(Math.random() * allTraits.length)];
    if (!traits.includes(trait)) {
      traits.push(trait);
    }
  }

  return traits;
};

/**
 * Get random element for mutations
 */
export const getRandomElement = (): CreatureElement => {
  const elements: CreatureElement[] = ['fire', 'water', 'earth', 'air', 'light', 'dark', 'ice', 'lightning', 'nature', 'neutral'];
  return elements[Math.floor(Math.random() * elements.length)];
};

/**
 * Execute breeding between two creatures
 */
export const breedCreatures = (
  parent1: EnhancedCreature,
  parent2: EnhancedCreature
): EnhancedCreature => {
  // Check compatibility first
  const compatibility = checkBreedingCompatibility(parent1, parent2);
  if (!compatibility.compatible) {
    throw new Error(`Breeding failed: ${compatibility.reasons.join(', ')}`);
  }

  // Get offspring predictions and select outcome based on chance
  const predictions = generateOffspringPredictions(parent1, parent2);
  const roll = Math.random() * 100;

  let selectedPrediction = predictions[0]; // Default to primary
  let currentChance = 0;

  for (const prediction of predictions) {
    currentChance += prediction.chance;
    if (roll <= currentChance) {
      selectedPrediction = prediction;
      break;
    }
  }

  // Create offspring creature based on selected prediction
  const offspring: EnhancedCreature = {
    id: `offspring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    creatureId: `${parent1.creatureId}_${parent2.creatureId}_offspring`,
    name: selectedPrediction.species.includes('Hybrid') || selectedPrediction.species.includes('Variant')
      ? selectedPrediction.species
      : `${selectedPrediction.species} Jr.`,
    species: selectedPrediction.species,
    level: 1,

    // Base stats inherited from parents with some variance
    hp: Math.floor((parent1.hp + parent2.hp) / 2 * (0.8 + Math.random() * 0.4)),
    attack: Math.floor((parent1.attack + parent2.attack) / 2 * (0.8 + Math.random() * 0.4)),
    defense: Math.floor((parent1.defense + parent2.defense) / 2 * (0.8 + Math.random() * 0.4)),
    magicAttack: Math.floor(((parent1.magicAttack || parent1.attack) + (parent2.magicAttack || parent2.attack)) / 2 * (0.8 + Math.random() * 0.4)),
    magicDefense: Math.floor(((parent1.magicDefense || parent1.defense) + (parent2.magicDefense || parent2.defense)) / 2 * (0.8 + Math.random() * 0.4)),
    speed: Math.floor(((parent1.speed || 50) + (parent2.speed || 50)) / 2 * (0.8 + Math.random() * 0.4)),

    // Inherited properties
    element: selectedPrediction.element,
    creatureType: parent1.creatureType, // Inherit from primary parent
    rarity: selectedPrediction.rarity,

    // Breeding-specific properties
    breedingGroup: [...new Set([...parent1.breedingGroup, ...parent2.breedingGroup])],
    fertility: 100,

    // Genetics tracking
    genetics: {
      parentIds: [parent1.creatureId, parent2.creatureId],
      generation: Math.max(parent1.genetics?.generation || 0, parent2.genetics?.generation || 0) + 1,
      inheritedTraits: selectedPrediction.traits,
      mutations: selectedPrediction.type === 'mutation' ? ['rare_variant'] : [],
      breedingPotential: selectedPrediction.type === 'hybrid' ? 120 : 100
    },

    // Enhanced properties
    personality: {
      traits: selectedPrediction.traits,
      dominantTrait: selectedPrediction.traits[0] || 'balanced',
      compatibility: calculatePersonalityCompatibility(parent1, parent2)
    },

    // Collection status
    collectionStatus: {
      discovered: true,
      captured: true,
      seen: true,
      timesEncountered: 1
    },

    capturedAt: new Date(),
    captureLocation: 'breeding_grounds',

    // Individual Values (genetics)
    individualStats: {
      hpIV: Math.floor(Math.random() * 32),
      attackIV: Math.floor(Math.random() * 32),
      defenseIV: Math.floor(Math.random() * 32),
      magicAttackIV: Math.floor(Math.random() * 32),
      magicDefenseIV: Math.floor(Math.random() * 32),
      speedIV: Math.floor(Math.random() * 32)
    },

    // Random nature
    nature: {
      name: ['Hardy', 'Bold', 'Modest', 'Timid', 'Jolly', 'Adamant', 'Careful', 'Calm'][Math.floor(Math.random() * 8)],
      statModifiers: {
        // Simple stat modifiers for different natures
        attack: Math.random() > 0.5 ? (Math.random() > 0.5 ? 2 : -2) : 0,
        defense: Math.random() > 0.5 ? (Math.random() > 0.5 ? 2 : -2) : 0,
      }
    },

    // Start with basic companion status
    companionData: {
      isCompanion: false,
      isActiveTeamMember: false,
      bond: 10, // Start with low bond
      experience: 0,
      lastInteraction: new Date()
    }
  };

  return offspring;
};

// ================================
// NPC TRADING SYSTEM
// ================================

export interface NPCTrader {
  id: string;
  name: string;
  location: string;
  specialty: CreatureType | 'all';
  reputation: number; // 0-100, affects trade quality
  trades: NPCTradeOffer[];
  description: string;
  icon: string;
}

export interface NPCTradeOffer {
  id: string;
  wants: {
    species?: string;
    type?: CreatureType;
    minLevel?: number;
    maxLevel?: number;
    rarity?: CreatureRarity;
    traits?: string[];
  };
  offers: {
    species: string;
    level: number;
    rarity?: CreatureRarity;
    guaranteedTraits?: string[];
    currency?: number;
  };
  availability: number; // How many times this trade can be used
  requirements?: {
    minReputation?: number;
    questCompleted?: string;
    locationAccess?: string;
  };
}

/**
 * Generate NPC traders for different locations
 */
export const generateNPCTraders = (): NPCTrader[] => {
  return [
    {
      id: 'trader_beast_master',
      name: 'Beast Master Koryn',
      location: 'forest_clearing',
      specialty: 'beast',
      reputation: 75,
      description: 'A grizzled veteran who specializes in beast-type creatures. Knows the wilderness like the back of his hand.',
      icon: '🐺',
      trades: [
        {
          id: 'beast_trade_1',
          wants: { type: 'beast', minLevel: 5 },
          offers: { species: 'forest_wolf', level: 8, guaranteedTraits: ['loyal', 'protective'] },
          availability: 3
        },
        {
          id: 'beast_trade_2',
          wants: { species: 'goblin', minLevel: 10 },
          offers: { species: 'dire_wolf', level: 12, rarity: 'uncommon' },
          availability: 1
        }
      ]
    },
    {
      id: 'trader_mystic',
      name: 'Mystic Zara',
      location: 'magic_tower',
      specialty: 'spirit',
      reputation: 90,
      description: 'An ethereal being who trades in spirits and magical creatures. Her wisdom spans centuries.',
      icon: '🔮',
      trades: [
        {
          id: 'spirit_trade_1',
          wants: { type: 'spirit', rarity: 'common' },
          offers: { species: 'wisp', level: 6, guaranteedTraits: ['magical', 'curious'] },
          availability: 5
        },
        {
          id: 'spirit_trade_2',
          wants: { rarity: 'rare' },
          offers: { species: 'phantom', level: 15, rarity: 'epic', currency: 100 },
          availability: 1,
          requirements: { minReputation: 50 }
        }
      ]
    },
    {
      id: 'trader_dragon_keeper',
      name: 'Dragon Keeper Thane',
      location: 'mountain_peak',
      specialty: 'dragon',
      reputation: 95,
      description: 'The legendary dragon keeper who has formed bonds with the most powerful creatures in the realm.',
      icon: '🐉',
      trades: [
        {
          id: 'dragon_trade_1',
          wants: { type: 'dragon', minLevel: 20 },
          offers: { species: 'ancient_dragon', level: 25, rarity: 'legendary' },
          availability: 1,
          requirements: { minReputation: 80 }
        },
        {
          id: 'dragon_trade_2',
          wants: { rarity: 'epic', minLevel: 15 },
          offers: { species: 'drake', level: 18, currency: 500 },
          availability: 2,
          requirements: { minReputation: 60 }
        }
      ]
    },
    {
      id: 'trader_collector',
      name: 'Collector Mira',
      location: 'trading_post',
      specialty: 'all',
      reputation: 60,
      description: 'A traveling collector who deals in all types of creatures. Always looking for rare specimens.',
      icon: '🎒',
      trades: [
        {
          id: 'collector_trade_1',
          wants: { rarity: 'uncommon' },
          offers: { currency: 200 },
          availability: 10
        },
        {
          id: 'collector_trade_2',
          wants: { rarity: 'rare' },
          offers: { currency: 800 },
          availability: 5
        },
        {
          id: 'collector_trade_3',
          wants: { minLevel: 25 },
          offers: { species: 'mystery_egg', level: 1, rarity: 'rare' },
          availability: 2,
          requirements: { minReputation: 40 }
        }
      ]
    }
  ];
};

/**
 * Check if player can make a trade with NPC
 */
export const canMakeTrade = (
  trader: NPCTrader,
  tradeOffer: NPCTradeOffer,
  playerCreature: EnhancedCreature,
  playerReputation: number = 50
): { canTrade: boolean; reason?: string } => {
  // Check availability
  if (tradeOffer.availability <= 0) {
    return { canTrade: false, reason: 'Trade no longer available' };
  }

  // Check reputation requirements
  if (tradeOffer.requirements?.minReputation && playerReputation < tradeOffer.requirements.minReputation) {
    return { canTrade: false, reason: `Requires ${tradeOffer.requirements.minReputation} reputation` };
  }

  // Check creature requirements
  const wants = tradeOffer.wants;

  if (wants.species && playerCreature.species !== wants.species) {
    return { canTrade: false, reason: `Wants ${wants.species}, offered ${playerCreature.species}` };
  }

  if (wants.type && playerCreature.creatureType !== wants.type) {
    return { canTrade: false, reason: `Wants ${wants.type} type, offered ${playerCreature.creatureType}` };
  }

  if (wants.minLevel && playerCreature.level < wants.minLevel) {
    return { canTrade: false, reason: `Wants level ${wants.minLevel}+, offered level ${playerCreature.level}` };
  }

  if (wants.maxLevel && playerCreature.level > wants.maxLevel) {
    return { canTrade: false, reason: `Wants level ${wants.maxLevel} or lower, offered level ${playerCreature.level}` };
  }

  if (wants.rarity && playerCreature.rarity !== wants.rarity) {
    return { canTrade: false, reason: `Wants ${wants.rarity} rarity, offered ${playerCreature.rarity}` };
  }

  if (wants.traits && wants.traits.length > 0) {
    const playerTraits = playerCreature.personality?.traits || [];
    const hasRequiredTraits = wants.traits.every(trait => playerTraits.includes(trait));
    if (!hasRequiredTraits) {
      return { canTrade: false, reason: `Missing required traits: ${wants.traits.join(', ')}` };
    }
  }

  return { canTrade: true };
};

/**
 * Execute trade with NPC
 */
export const executeNPCTrade = (
  trader: NPCTrader,
  tradeOffer: NPCTradeOffer,
  offeredCreature: EnhancedCreature
): { success: boolean; receivedCreature?: EnhancedCreature; receivedCurrency?: number; error?: string } => {
  try {
    // Validate trade can be made
    const validation = canMakeTrade(trader, tradeOffer, offeredCreature);
    if (!validation.canTrade) {
      return { success: false, error: validation.reason };
    }

    // Create the creature being offered by NPC
    let receivedCreature: EnhancedCreature | undefined;
    let receivedCurrency: number | undefined;

    if (tradeOffer.offers.species) {
      receivedCreature = {
        id: `npc_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatureId: `npc_${tradeOffer.offers.species}_${Date.now()}`,
        name: tradeOffer.offers.species.replace(/_/g, ' '),
        species: tradeOffer.offers.species,
        level: tradeOffer.offers.level,

        // Base stats for NPC creatures (simplified)
        hp: 50 + tradeOffer.offers.level * 8,
        attack: 10 + tradeOffer.offers.level * 2,
        defense: 8 + tradeOffer.offers.level * 1.5,
        magicAttack: 12 + tradeOffer.offers.level * 1.8,
        magicDefense: 9 + tradeOffer.offers.level * 1.3,
        speed: 15 + tradeOffer.offers.level * 1.2,

        // Default properties
        element: 'neutral' as const,
        creatureType: trader.specialty === 'all' ? 'beast' : trader.specialty,
        rarity: tradeOffer.offers.rarity || 'common',

        // Breeding properties
        breedingGroup: [trader.specialty === 'all' ? 'beast' : trader.specialty],
        fertility: 100,

        // Collection status
        collectionStatus: {
          discovered: true,
          captured: true,
          seen: true,
          timesEncountered: 1
        },

        capturedAt: new Date(),
        captureLocation: trader.location,

        // Personality with guaranteed traits
        personality: {
          traits: tradeOffer.offers.guaranteedTraits || ['friendly'],
          dominantTrait: tradeOffer.offers.guaranteedTraits?.[0] || 'friendly',
          compatibility: 50
        },

        // Random IVs
        individualStats: {
          hpIV: Math.floor(Math.random() * 32),
          attackIV: Math.floor(Math.random() * 32),
          defenseIV: Math.floor(Math.random() * 32),
          magicAttackIV: Math.floor(Math.random() * 32),
          magicDefenseIV: Math.floor(Math.random() * 32),
          speedIV: Math.floor(Math.random() * 32)
        },

        // Random nature
        nature: {
          name: ['Hardy', 'Bold', 'Modest', 'Timid', 'Jolly', 'Adamant'][Math.floor(Math.random() * 6)],
          statModifiers: {}
        },

        // Companion data
        companionData: {
          isCompanion: false,
          isActiveTeamMember: false,
          bond: 20, // NPC traded creatures start with higher bond
          experience: 0,
          lastInteraction: new Date()
        },

        // Genetics for NPC creatures
        genetics: {
          parentIds: [],
          generation: 0,
          inheritedTraits: tradeOffer.offers.guaranteedTraits || [],
          mutations: [],
          breedingPotential: 100
        }
      };
    }

    if (tradeOffer.offers.currency) {
      receivedCurrency = tradeOffer.offers.currency;
    }

    return {
      success: true,
      receivedCreature,
      receivedCurrency
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Trade execution failed'
    };
  }
};

// ================================
// COMBAT CALCULATIONS
// ================================

/**
 * Calculate creature's combat stats
 */
export const calculateCombatStats = (creature: EnhancedCreature): CreatureCombatStats => {
  const baseStats = {
    hp: creature.hp,
    attack: creature.attack,
    defense: creature.defense,
    magicAttack: creature.magicAttack || creature.attack,
    magicDefense: creature.magicDefense || creature.defense,
    speed: creature.speed || 50
  };

  // Apply individual values (genetics)
  if (creature.individualStats) {
    const ivs = creature.individualStats;
    baseStats.hp += Math.floor(ivs.hpIV * creature.level / 100);
    baseStats.attack += Math.floor(ivs.attackIV * creature.level / 100);
    baseStats.defense += Math.floor(ivs.defenseIV * creature.level / 100);
    baseStats.magicAttack += Math.floor(ivs.magicAttackIV * creature.level / 100);
    baseStats.magicDefense += Math.floor(ivs.magicDefenseIV * creature.level / 100);
    baseStats.speed += Math.floor(ivs.speedIV * creature.level / 100);
  }

  // Apply nature modifiers
  if (creature.nature && creature.nature.statModifiers) {
    Object.entries(creature.nature.statModifiers).forEach(([stat, modifier]) => {
      if (baseStats[stat as keyof typeof baseStats] !== undefined) {
        baseStats[stat as keyof typeof baseStats] += modifier;
      }
    });
  }

  // Apply level scaling
  const levelMultiplier = 1 + (creature.level - 1) * 0.1;

  return {
    hp: Math.floor(baseStats.hp * levelMultiplier),
    attack: Math.floor(baseStats.attack * levelMultiplier),
    defense: Math.floor(baseStats.defense * levelMultiplier),
    magicAttack: Math.floor(baseStats.magicAttack * levelMultiplier),
    magicDefense: Math.floor(baseStats.magicDefense * levelMultiplier),
    speed: Math.floor(baseStats.speed * levelMultiplier),
    accuracy: 85 + creature.level,
    evasion: 10 + Math.floor(creature.level / 5),
    criticalRate: 5 + Math.floor(creature.level / 10)
  };
};

/**
 * Calculate type effectiveness multiplier
 */
export const getTypeEffectiveness = (
  attackerElement: CreatureElement,
  defenderElement: CreatureElement
): number => {
  const effectiveness: Record<string, Record<string, number>> = {
    fire: { water: 0.5, earth: 2.0, ice: 2.0, nature: 2.0 },
    water: { fire: 2.0, earth: 2.0, lightning: 0.5 },
    earth: { fire: 0.5, water: 0.5, air: 2.0, lightning: 2.0 },
    air: { earth: 0.5, lightning: 2.0 },
    light: { dark: 2.0 },
    dark: { light: 2.0 },
    ice: { fire: 0.5, water: 2.0, nature: 2.0 },
    lightning: { water: 2.0, earth: 0.5, air: 0.5 },
    nature: { water: 2.0, earth: 2.0, fire: 0.5, ice: 0.5 }
  };

  return effectiveness[attackerElement]?.[defenderElement] || 1.0;
};

/**
 * Calculate damage between two creatures
 */
export const calculateDamage = (
  attacker: EnhancedCreature,
  defender: EnhancedCreature,
  attackType: 'physical' | 'magical' | 'elemental' = 'physical'
): number => {
  const attackerStats = calculateCombatStats(attacker);
  const defenderStats = calculateCombatStats(defender);

  let baseDamage: number;
  let defense: number;

  switch (attackType) {
    case 'magical':
      baseDamage = attackerStats.magicAttack;
      defense = defenderStats.magicDefense;
      break;
    case 'elemental':
      baseDamage = attackerStats.magicAttack;
      defense = defenderStats.magicDefense;
      // Apply elemental effectiveness
      const effectiveness = getTypeEffectiveness(attacker.element, defender.element);
      baseDamage *= effectiveness;
      break;
    default:
      baseDamage = attackerStats.attack;
      defense = defenderStats.defense;
  }

  // Calculate raw damage
  const rawDamage = Math.max(1, baseDamage - defense * 0.5);

  // Apply random variance (85-115%)
  const variance = 0.85 + Math.random() * 0.3;
  const finalDamage = Math.floor(rawDamage * variance);

  return Math.max(1, finalDamage);
};

/**
 * Calculate experience gained from combat
 */
export const calculateExperienceGain = (
  victor: EnhancedCreature,
  defeated: EnhancedCreature,
  participationRate: number = 1.0
): number => {
  const baseExp = defeated.level * 100;
  const levelDifference = defeated.level - victor.level;

  // Level difference modifier
  let modifier = 1.0;
  if (levelDifference > 0) {
    modifier = 1.0 + (levelDifference * 0.1); // Bonus for defeating higher level
  } else if (levelDifference < 0) {
    modifier = Math.max(0.1, 1.0 + (levelDifference * 0.05)); // Penalty for defeating lower level
  }

  // Rarity bonus
  const rarityMultiplier = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0,
    mythical: 5.0
  };

  modifier *= rarityMultiplier[defeated.rarity as CreatureRarity] || 1.0;

  return Math.floor(baseExp * modifier * participationRate);
};

// ================================
// CREATURE ANALYSIS
// ================================

/**
 * Calculate creature's overall rating
 */
export const calculateCreatureRating = (creature: EnhancedCreature): number => {
  const stats = calculateCombatStats(creature);

  // Base stat total
  const statTotal = stats.hp + stats.attack + stats.defense + stats.magicAttack + stats.magicDefense + stats.speed;

  // Level scaling
  const levelBonus = creature.level * 10;

  // Rarity bonus
  const rarityBonus = {
    common: 0,
    uncommon: 50,
    rare: 150,
    epic: 300,
    legendary: 600,
    mythical: 1200
  };

  // Individual Values bonus
  let ivBonus = 0;
  if (creature.individualStats) {
    const ivTotal = creature.individualStats.hpIV + creature.individualStats.attackIV +
                   creature.individualStats.defenseIV + creature.individualStats.magicAttackIV +
                   creature.individualStats.magicDefenseIV + creature.individualStats.speedIV;
    ivBonus = ivTotal * 2; // Max of 372 (31*6*2)
  }

  return statTotal + levelBonus + (rarityBonus[creature.rarity as CreatureRarity] || 0) + ivBonus;
};

/**
 * Get creature type advantages
 */
export const getTypeAdvantages = (creatureType: CreatureType): {
  strongAgainst: CreatureType[];
  weakAgainst: CreatureType[];
} => {
  const typeChart: Record<CreatureType, { strong: CreatureType[]; weak: CreatureType[] }> = {
    beast: { strong: ['plant', 'insect'], weak: ['construct', 'undead'] },
    elemental: { strong: ['construct', 'undead'], weak: ['spirit', 'fey'] },
    undead: { strong: ['beast', 'plant'], weak: ['angel', 'spirit'] },
    dragon: { strong: ['beast', 'elemental'], weak: ['angel', 'demon'] },
    spirit: { strong: ['undead', 'demon'], weak: ['construct', 'angel'] },
    construct: { strong: ['elemental', 'spirit'], weak: ['beast', 'plant'] },
    fey: { strong: ['beast', 'plant'], weak: ['construct', 'undead'] },
    demon: { strong: ['angel', 'spirit'], weak: ['angel', 'dragon'] },
    angel: { strong: ['demon', 'undead'], weak: ['demon', 'dragon'] },
    plant: { strong: ['construct', 'elemental'], weak: ['beast', 'insect'] },
    insect: { strong: ['plant', 'fey'], weak: ['beast', 'elemental'] }
  };

  const chart = typeChart[creatureType] || { strong: [], weak: [] };
  return {
    strongAgainst: chart.strong,
    weakAgainst: chart.weak
  };
};

/**
 * Get collection statistics
 */
export const getCollectionStats = (creatures: EnhancedCreature[], totalSpecies: number = 100) => {
  const captured = creatures.filter(c => c.capturedAt).length;
  const discovered = creatures.length;

  const byType = creatures.reduce((acc, creature) => {
    acc[creature.creatureType] = (acc[creature.creatureType] || 0) + 1;
    return acc;
  }, {} as Record<CreatureType, number>);

  const byElement = creatures.reduce((acc, creature) => {
    acc[creature.element] = (acc[creature.element] || 0) + 1;
    return acc;
  }, {} as Record<CreatureElement, number>);

  const byRarity = creatures.reduce((acc, creature) => {
    const rarity = creature.rarity as CreatureRarity;
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {} as Record<CreatureRarity, number>);

  return {
    discovered,
    captured,
    total: totalSpecies,
    discoveryPercentage: (discovered / totalSpecies) * 100,
    capturePercentage: captured > 0 ? (captured / discovered) * 100 : 0,
    completionPercentage: (captured / totalSpecies) * 100,
    byType,
    byElement,
    byRarity,
    averageLevel: creatures.reduce((sum, c) => sum + c.level, 0) / creatures.length || 0,
    highestLevel: Math.max(...creatures.map(c => c.level), 0),
    teamSize: creatures.filter(c => c.companionData?.isActive).length
  };
};

export default {
  // Filtering and search
  filterCreatures,
  searchCreatures,
  getCreaturesByType,
  getCreaturesByElement,

  // Sorting
  sortCreatures,

  // Breeding
  isBreedingEligible,
  checkBreedingCompatibility,
  calculatePersonalityCompatibility,
  generateOffspringPredictions,
  breedCreatures,
  getInheritedElement,
  getInheritedRarity,
  upgradeRarity,
  mixTraits,
  generateRandomTraits,

  // Trading
  generateNPCTraders,
  canMakeTrade,
  executeNPCTrade,

  // Combat
  calculateCombatStats,
  getTypeEffectiveness,
  calculateDamage,
  calculateExperienceGain,

  // Analysis
  calculateCreatureRating,
  getTypeAdvantages,
  getCollectionStats
};