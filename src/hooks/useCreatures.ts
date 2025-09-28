/**
 * useCreatures Hook
 *
 * Comprehensive creature collection management and combat integration.
 * Handles creature discovery, capture, breeding, companion management,
 * and bestiary tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { useGameState } from '@/contexts/ReactGameContext';
import { useInventory } from './useInventory';
import {
  EnhancedCreature,
  CreatureCollection,
  CreatureFilter,
  BestiaryEntry,
  CreatureOperationResult,
  CreatureCaptureAttempt,
  BreedingPair,
  BreedingProcess,
  CreatureTrade,
  CreatureEvent,
  CreatureEventCallback,
  CreatureError,
  CreatureException,
  CreatureOperation,
  CreatureCompletionLevel,
  CreatureRarity,
  CreatureType,
  CreatureElement,
  CreatureCombatRole,
  SpeciesRequest
} from '@/types/creatures';
import { Monster, PlayerStats } from '@/types/game';

interface UseCreaturesReturn {
  // Core state
  collection: CreatureCollection;
  filteredCreatures: EnhancedCreature[];
  filteredBestiary: BestiaryEntry[];
  activeTeam: EnhancedCreature[];

  // Creature operations
  captureCreature: (monster: Monster, itemUsed?: string) => Promise<CreatureCaptureAttempt>;
  releaseCreature: (creatureId: string) => Promise<CreatureOperationResult>;
  renameCreature: (creatureId: string, newName: string) => Promise<CreatureOperationResult>;
  favoriteCreature: (creatureId: string, favorite: boolean) => Promise<CreatureOperationResult>;

  // Team management
  addToTeam: (creatureId: string) => Promise<CreatureOperationResult>;
  removeFromTeam: (creatureId: string) => Promise<CreatureOperationResult>;
  reorderTeam: (fromIndex: number, toIndex: number) => Promise<CreatureOperationResult>;

  // Companion system
  setAsCompanion: (creatureId: string, combatRole: CreatureCombatRole) => Promise<CreatureOperationResult>;
  trainCompanion: (creatureId: string, trainingType: string) => Promise<CreatureOperationResult>;
  feedCompanion: (creatureId: string, itemId: string) => Promise<CreatureOperationResult>;

  // Breeding system
  checkBreedingCompatibility: (parent1Id: string, parent2Id: string) => BreedingPair | null;
  startBreeding: (parent1Id: string, parent2Id: string) => Promise<CreatureOperationResult>;
  checkBreedingProgress: () => BreedingProcess[];
  collectBreedingResult: (breedingId: string) => Promise<CreatureOperationResult>;

  // Trading system
  createTrade: (offeredCreatures: string[], requestedSpecies: SpeciesRequest[]) => Promise<CreatureTrade>;
  acceptTrade: (tradeId: string) => Promise<CreatureOperationResult>;
  declineTrade: (tradeId: string) => Promise<CreatureOperationResult>;

  // Discovery and bestiary
  discoverCreature: (monster: Monster, location: string) => Promise<BestiaryEntry>;
  updateBestiaryEntry: (species: string, completionLevel: CreatureCompletionLevel) => Promise<BestiaryEntry>;
  getBestiaryProgress: () => { discovered: number; total: number; percentage: number };

  // Filtering and search
  updateFilter: (newFilter: Partial<CreatureFilter>) => void;
  searchCreatures: (query: string) => EnhancedCreature[];
  getCreaturesBySpecies: (species: string) => EnhancedCreature[];
  getCreaturesByType: (type: CreatureType) => EnhancedCreature[];

  // Statistics and analytics
  getCollectionStats: () => {
    totalCreatures: number;
    byRarity: Record<CreatureRarity, number>;
    byType: Record<CreatureType, number>;
    byElement: Record<CreatureElement, number>;
    companions: number;
    breeding: number;
  };

  // Events
  addEventListener: (callback: CreatureEventCallback) => () => void;

  // Utility
  isCreatureCaptured: (species: string) => boolean;
  getCreature: (creatureId: string) => EnhancedCreature | null;
  canCaptureMore: () => boolean;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useCreatures(): UseCreaturesReturn {
  const { gameState, updateGameState } = useGameState();
  const { addItem, removeItem } = useInventory();

  // Local state
  const [collection, setCollection] = useState<CreatureCollection>({
    creatures: {},
    bestiary: {},
    activeTeam: [],
    reserves: [],
    totalDiscovered: 0,
    totalCaptured: 0,
    completionPercentage: 0,
    favoriteSpecies: [],
    activeBreeding: [],
    breedingHistory: [],
    activeTrades: [],
    tradeHistory: [],
    autoSort: true,
    showStats: true,
    groupBy: 'species',
    filter: {
      types: [],
      elements: [],
      rarities: [],
      completionLevels: [],
      favorites: false,
      companions: false,
      breedable: false,
      searchText: '',
    }
  });

  const [filteredCreatures, setFilteredCreatures] = useState<EnhancedCreature[]>([]);
  const [filteredBestiary, setFilteredBestiary] = useState<BestiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventListeners, setEventListeners] = useState<CreatureEventCallback[]>([]);

  // Initialize from game state
  useEffect(() => {
    if (gameState.creatures) {
      setCollection(prev => ({
        ...prev,
        ...gameState.creatures
      }));
    }
  }, [gameState.creatures]);

  // Filter creatures based on current filter
  useEffect(() => {
    const filtered = Object.values(collection.creatures).filter(creature => {
      const filter = collection.filter;

      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(creature.creatureType)) {
        return false;
      }

      // Element filter
      if (filter.elements.length > 0 && !filter.elements.includes(creature.element)) {
        return false;
      }

      // Rarity filter
      if (filter.rarities.length > 0 && !filter.rarities.includes(creature.rarity as CreatureRarity)) {
        return false;
      }

      // Completion level filter
      if (filter.completionLevels.length > 0 &&
          !filter.completionLevels.includes(creature.collectionStatus.completionLevel)) {
        return false;
      }

      // Favorites filter
      if (filter.favorites && !creature.collectionStatus.favorite) {
        return false;
      }

      // Companions filter
      if (filter.companions && !creature.companionData?.isCompanion) {
        return false;
      }

      // Breedable filter
      if (filter.breedable && creature.genetics.breedingPotential <= 0) {
        return false;
      }

      // Level range filter
      if (filter.minLevel && creature.level < filter.minLevel) {
        return false;
      }
      if (filter.maxLevel && creature.level > filter.maxLevel) {
        return false;
      }

      // Text search
      if (filter.searchText) {
        const searchTerm = filter.searchText.toLowerCase();
        const searchableText = [
          creature.name,
          creature.species,
          creature.creatureType,
          creature.element,
          creature.description,
          ...creature.collectionStatus.tags
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    setFilteredCreatures(filtered);
  }, [collection.creatures, collection.filter]);

  // Filter bestiary based on current filter
  useEffect(() => {
    const filtered = Object.values(collection.bestiary).filter(entry => {
      const filter = collection.filter;

      // Text search
      if (filter.searchText) {
        const searchTerm = filter.searchText.toLowerCase();
        const searchableText = [
          entry.name || '',
          entry.species,
          entry.type || '',
          entry.element || '',
          entry.behavior || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    setFilteredBestiary(filtered);
  }, [collection.bestiary, collection.filter]);

  // Get active team creatures
  const activeTeam = collection.activeTeam
    .map(id => collection.creatures[id])
    .filter(Boolean);

  // Emit event to listeners
  const emitEvent = useCallback((event: CreatureEvent) => {
    eventListeners.forEach(callback => callback(event));
  }, [eventListeners]);

  // Save collection to game state
  const saveCollection = useCallback(async (newCollection: CreatureCollection) => {
    setCollection(newCollection);
    await updateGameState({
      creatures: newCollection
    });
  }, [updateGameState]);

  // Generate unique creature ID
  const generateCreatureId = useCallback(() => {
    return `creature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Calculate capture rate based on various factors
  const calculateCaptureRate = useCallback((monster: Monster, itemUsed?: string): number => {
    let baseRate = 0.3; // 30% base capture rate

    // Adjust for creature level vs player level
    const levelDifference = (gameState.player?.level || 1) - monster.level;
    if (levelDifference > 0) {
      baseRate += levelDifference * 0.05; // +5% per level advantage
    } else {
      baseRate += levelDifference * 0.1; // -10% per level disadvantage
    }

    // Adjust for creature health
    const healthPercentage = monster.currentHealth / monster.maxHealth;
    baseRate += (1 - healthPercentage) * 0.4; // Up to +40% for low health

    // Item bonuses
    if (itemUsed) {
      switch (itemUsed) {
        case 'basic_trap': baseRate += 0.1; break;
        case 'advanced_trap': baseRate += 0.2; break;
        case 'master_trap': baseRate += 0.3; break;
        case 'legendary_trap': baseRate += 0.5; break;
      }
    }

    // Rarity penalty
    switch (monster.rarity) {
      case 'uncommon': baseRate -= 0.1; break;
      case 'rare': baseRate -= 0.2; break;
      case 'epic': baseRate -= 0.3; break;
      case 'legendary': baseRate -= 0.4; break;
      case 'mythical': baseRate -= 0.5; break;
    }

    return Math.max(0.01, Math.min(0.95, baseRate)); // Clamp between 1% and 95%
  }, [gameState.player?.level]);

  // Convert Monster to EnhancedCreature
  const enhanceCreature = useCallback((monster: Monster, location: string): EnhancedCreature => {
    const creatureId = generateCreatureId();
    const now = new Date();

    // Generate random individual stats (IVs)
    const generateIV = () => Math.floor(Math.random() * 32);

    // Determine creature type and element based on monster properties
    const creatureType: CreatureType = monster.type as CreatureType || 'beast';
    const element: CreatureElement = monster.element as CreatureElement || 'neutral';

    return {
      ...monster,
      creatureId,
      species: monster.name.toLowerCase().replace(/\s+/g, '_'),
      discoveredAt: now,
      capturedAt: now,
      timesEncountered: 1,
      element,
      creatureType,
      size: 'medium',
      habitat: [location],
      personality: {
        traits: [],
        mood: 'neutral',
        loyalty: 50,
        happiness: 50,
        energy: 100,
        sociability: 50
      },
      nature: {
        name: 'neutral',
        statModifiers: {},
        behaviorModifiers: {
          aggression: 0,
          defensiveness: 0,
          cooperation: 0
        }
      },
      individualStats: {
        hpIV: generateIV(),
        attackIV: generateIV(),
        defenseIV: generateIV(),
        magicAttackIV: generateIV(),
        magicDefenseIV: generateIV(),
        speedIV: generateIV(),
        hpEV: 0,
        attackEV: 0,
        defenseEV: 0,
        magicAttackEV: 0,
        magicDefenseEV: 0,
        speedEV: 0
      },
      genetics: {
        parentIds: [],
        generation: 1,
        inheritedTraits: [],
        mutations: [],
        breedingPotential: 100
      },
      breedingGroup: [creatureType],
      fertility: 100,
      collectionStatus: {
        discovered: true,
        captured: true,
        timesCaptures: 1,
        favorite: false,
        tags: [],
        notes: '',
        completionLevel: 'captured'
      },
      sprite: monster.sprite || '',
      model: monster.model,
      description: monster.description || `A ${creatureType} creature discovered in ${location}.`,
      loreText: `This ${monster.name} was first encountered in ${location}.`,
      discoveryLocation: location
    };
  }, [generateCreatureId]);

  // Capture creature
  const captureCreature = useCallback(async (monster: Monster, itemUsed?: string): Promise<CreatureCaptureAttempt> => {
    try {
      setIsLoading(true);
      setError(null);

      const captureRate = calculateCaptureRate(monster, itemUsed);
      const success = Math.random() < captureRate;

      const attempt: CreatureCaptureAttempt = {
        creature: monster,
        captureRate,
        playerLevel: gameState.player?.level || 1,
        itemUsed,
        success,
        message: success ? `Successfully captured ${monster.name}!` : `${monster.name} broke free!`
      };

      if (success) {
        const enhancedCreature = enhanceCreature(monster, gameState.currentLocation || 'unknown');
        attempt.result = enhancedCreature;

        const newCollection = {
          ...collection,
          creatures: {
            ...collection.creatures,
            [enhancedCreature.creatureId]: enhancedCreature
          },
          totalCaptured: collection.totalCaptured + 1
        };

        // Update bestiary
        const species = enhancedCreature.species;
        if (newCollection.bestiary[species]) {
          newCollection.bestiary[species] = {
            ...newCollection.bestiary[species],
            totalCaptures: newCollection.bestiary[species].totalCaptures + 1,
            specimens: [...newCollection.bestiary[species].specimens, enhancedCreature.creatureId],
            firstCaptured: newCollection.bestiary[species].firstCaptured || new Date()
          };
        }

        await saveCollection(newCollection);

        // Consume capture item if used
        if (itemUsed) {
          await removeItem(itemUsed, 1);
        }

        emitEvent({
          type: 'creature_captured',
          timestamp: new Date(),
          creature: enhancedCreature,
          important: true,
          message: `Captured ${enhancedCreature.name}!`
        });
      }

      return attempt;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to capture creature';
      setError(error);
      throw new CreatureException(CreatureError.CAPTURE_FAILED, error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateCaptureRate, gameState.player?.level, gameState.currentLocation, collection, enhanceCreature, saveCollection, removeItem, emitEvent]);

  // Release creature
  const releaseCreature = useCallback(async (creatureId: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      // Check if creature is in active team
      if (collection.activeTeam.includes(creatureId)) {
        throw new CreatureException(CreatureError.CREATURE_IN_USE, 'Cannot release creature in active team');
      }

      const newCreatures = { ...collection.creatures };
      delete newCreatures[creatureId];

      const newCollection = {
        ...collection,
        creatures: newCreatures,
        reserves: collection.reserves.filter(id => id !== creatureId),
        totalCaptured: collection.totalCaptured - 1
      };

      await saveCollection(newCollection);

      emitEvent({
        type: 'creature_released',
        timestamp: new Date(),
        creature,
        important: false,
        message: `Released ${creature.name} back to the wild.`
      });

      return {
        success: true,
        operation: 'release',
        creature,
        message: `${creature.name} was released back to the wild.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to release creature';
      setError(error);
      return {
        success: false,
        operation: 'release',
        message: error,
        error
      };
    }
  }, [collection, saveCollection, emitEvent]);

  // Rename creature
  const renameCreature = useCallback(async (creatureId: string, newName: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      const updatedCreature = { ...creature, name: newName };
      const newCollection = {
        ...collection,
        creatures: {
          ...collection.creatures,
          [creatureId]: updatedCreature
        }
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'rename',
        creature: updatedCreature,
        message: `Renamed creature to ${newName}.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to rename creature';
      setError(error);
      return {
        success: false,
        operation: 'rename',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Favorite creature
  const favoriteCreature = useCallback(async (creatureId: string, favorite: boolean): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      const updatedCreature = {
        ...creature,
        collectionStatus: {
          ...creature.collectionStatus,
          favorite
        }
      };

      const newCollection = {
        ...collection,
        creatures: {
          ...collection.creatures,
          [creatureId]: updatedCreature
        }
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'favorite',
        creature: updatedCreature,
        message: favorite ? `Added ${creature.name} to favorites.` : `Removed ${creature.name} from favorites.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update favorite status';
      setError(error);
      return {
        success: false,
        operation: 'favorite',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Add to team
  const addToTeam = useCallback(async (creatureId: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      if (collection.activeTeam.length >= 6) {
        throw new CreatureException(CreatureError.TEAM_FULL, 'Active team is full (maximum 6 creatures)');
      }

      if (collection.activeTeam.includes(creatureId)) {
        return {
          success: false,
          operation: 'train',
          message: 'Creature is already in the active team.',
          error: 'Already in team'
        };
      }

      const newCollection = {
        ...collection,
        activeTeam: [...collection.activeTeam, creatureId],
        reserves: collection.reserves.filter(id => id !== creatureId)
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'train',
        creature,
        message: `Added ${creature.name} to active team.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add creature to team';
      setError(error);
      return {
        success: false,
        operation: 'train',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Remove from team
  const removeFromTeam = useCallback(async (creatureId: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      const newCollection = {
        ...collection,
        activeTeam: collection.activeTeam.filter(id => id !== creatureId),
        reserves: collection.reserves.includes(creatureId) ? collection.reserves : [...collection.reserves, creatureId]
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'train',
        creature,
        message: `Removed ${creature.name} from active team.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove creature from team';
      setError(error);
      return {
        success: false,
        operation: 'train',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Reorder team
  const reorderTeam = useCallback(async (fromIndex: number, toIndex: number): Promise<CreatureOperationResult> => {
    try {
      const newActiveTeam = [...collection.activeTeam];
      const [moved] = newActiveTeam.splice(fromIndex, 1);
      newActiveTeam.splice(toIndex, 0, moved);

      const newCollection = {
        ...collection,
        activeTeam: newActiveTeam
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'train',
        message: 'Team order updated.'
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to reorder team';
      setError(error);
      return {
        success: false,
        operation: 'train',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Set as companion
  const setAsCompanion = useCallback(async (creatureId: string, combatRole: CreatureCombatRole): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      if (creature.personality.loyalty < 50) {
        throw new CreatureException(CreatureError.INSUFFICIENT_BOND, 'Creature loyalty too low to become companion');
      }

      const updatedCreature = {
        ...creature,
        companionData: {
          isCompanion: true,
          companionLevel: 1,
          experience: 0,
          experienceToNext: 100,
          combatRole,
          aiPersonality: {
            aggression: creature.personality.traits.includes('aggressive') ? 80 : 30,
            caution: creature.personality.traits.includes('docile') ? 70 : 40,
            supportiveness: creature.personality.traits.includes('protective') ? 80 : 50,
            independence: creature.personality.traits.includes('independent') ? 90 : 30
          },
          learnedMoves: creature.abilities || [],
          availableMoves: creature.abilities || [],
          bondLevel: 1,
          synergy: 60
        }
      };

      const newCollection = {
        ...collection,
        creatures: {
          ...collection.creatures,
          [creatureId]: updatedCreature
        }
      };

      await saveCollection(newCollection);

      emitEvent({
        type: 'companion_leveled',
        timestamp: new Date(),
        creature: updatedCreature,
        important: true,
        message: `${creature.name} became your ${combatRole} companion!`
      });

      return {
        success: true,
        operation: 'train',
        creature: updatedCreature,
        message: `${creature.name} is now your ${combatRole} companion!`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to set companion';
      setError(error);
      return {
        success: false,
        operation: 'train',
        message: error,
        error
      };
    }
  }, [collection, saveCollection, emitEvent]);

  // Train companion
  const trainCompanion = useCallback(async (creatureId: string, trainingType: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature?.companionData?.isCompanion) {
        throw new Error('Creature is not a companion');
      }

      // Simple training implementation
      const expGain = 25;
      const newExp = creature.companionData.experience + expGain;
      const levelUp = newExp >= creature.companionData.experienceToNext;

      const updatedCompanionData = {
        ...creature.companionData,
        experience: levelUp ? newExp - creature.companionData.experienceToNext : newExp,
        companionLevel: levelUp ? creature.companionData.companionLevel + 1 : creature.companionData.companionLevel,
        experienceToNext: levelUp ? creature.companionData.experienceToNext + 50 : creature.companionData.experienceToNext
      };

      const updatedCreature = {
        ...creature,
        companionData: updatedCompanionData
      };

      const newCollection = {
        ...collection,
        creatures: {
          ...collection.creatures,
          [creatureId]: updatedCreature
        }
      };

      await saveCollection(newCollection);

      if (levelUp) {
        emitEvent({
          type: 'companion_leveled',
          timestamp: new Date(),
          creature: updatedCreature,
          important: true,
          message: `${creature.name} reached companion level ${updatedCompanionData.companionLevel}!`
        });
      }

      return {
        success: true,
        operation: 'train',
        creature: updatedCreature,
        message: levelUp
          ? `${creature.name} gained experience and leveled up!`
          : `${creature.name} gained ${expGain} experience.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to train companion';
      setError(error);
      return {
        success: false,
        operation: 'train',
        message: error,
        error
      };
    }
  }, [collection, saveCollection, emitEvent]);

  // Feed companion
  const feedCompanion = useCallback(async (creatureId: string, itemId: string): Promise<CreatureOperationResult> => {
    try {
      const creature = collection.creatures[creatureId];
      if (!creature) {
        throw new CreatureException(CreatureError.CREATURE_NOT_FOUND, 'Creature not found');
      }

      // Remove item from inventory
      await removeItem(itemId, 1);

      // Increase happiness and loyalty
      const updatedCreature = {
        ...creature,
        personality: {
          ...creature.personality,
          happiness: Math.min(100, creature.personality.happiness + 10),
          loyalty: Math.min(100, creature.personality.loyalty + 5)
        }
      };

      const newCollection = {
        ...collection,
        creatures: {
          ...collection.creatures,
          [creatureId]: updatedCreature
        }
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'feed',
        creature: updatedCreature,
        message: `Fed ${creature.name}. Happiness and loyalty increased!`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to feed companion';
      setError(error);
      return {
        success: false,
        operation: 'feed',
        message: error,
        error
      };
    }
  }, [collection, saveCollection, removeItem]);

  // Check breeding compatibility
  const checkBreedingCompatibility = useCallback((parent1Id: string, parent2Id: string): BreedingPair | null => {
    const parent1 = collection.creatures[parent1Id];
    const parent2 = collection.creatures[parent2Id];

    if (!parent1 || !parent2) return null;

    // Check if creatures share breeding groups
    const sharedGroups = parent1.breedingGroup.filter(group =>
      parent2.breedingGroup.includes(group)
    );

    if (sharedGroups.length === 0) return null;

    // Calculate compatibility based on various factors
    let compatibility = 50; // Base compatibility

    // Same species bonus
    if (parent1.species === parent2.species) {
      compatibility += 20;
    }

    // Level compatibility
    const levelDiff = Math.abs(parent1.level - parent2.level);
    compatibility -= levelDiff * 2;

    // Fertility factor
    const avgFertility = (parent1.fertility + parent2.fertility) / 2;
    compatibility = (compatibility * avgFertility) / 100;

    compatibility = Math.max(0, Math.min(100, compatibility));

    const successRate = compatibility * 0.8; // 80% of compatibility
    const timeRequired = Math.max(30, 120 - compatibility); // 30-120 minutes

    return {
      parent1,
      parent2,
      compatibility,
      successRate,
      timeRequired,
      possibleOffspring: [
        {
          species: parent1.species,
          probability: 0.6,
          traits: [],
          estimatedStats: {}
        },
        {
          species: parent2.species,
          probability: 0.4,
          traits: [],
          estimatedStats: {}
        }
      ]
    };
  }, [collection.creatures]);

  // Start breeding
  const startBreeding = useCallback(async (parent1Id: string, parent2Id: string): Promise<CreatureOperationResult> => {
    try {
      const breedingPair = checkBreedingCompatibility(parent1Id, parent2Id);
      if (!breedingPair) {
        throw new CreatureException(CreatureError.BREEDING_INCOMPATIBLE, 'Creatures are not compatible for breeding');
      }

      const breedingProcess: BreedingProcess = {
        id: `breeding_${Date.now()}`,
        pair: breedingPair,
        startTime: new Date(),
        duration: breedingPair.timeRequired * 60 * 1000, // Convert to milliseconds
        progress: 0,
        status: 'in_progress'
      };

      const newCollection = {
        ...collection,
        activeBreeding: [...collection.activeBreeding, breedingProcess]
      };

      await saveCollection(newCollection);

      emitEvent({
        type: 'breeding_started',
        timestamp: new Date(),
        data: { breedingId: breedingProcess.id },
        important: false,
        message: `Started breeding ${breedingPair.parent1.name} and ${breedingPair.parent2.name}.`
      });

      return {
        success: true,
        operation: 'breed',
        message: `Breeding started! Estimated time: ${breedingPair.timeRequired} minutes.`
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start breeding';
      setError(error);
      return {
        success: false,
        operation: 'breed',
        message: error,
        error
      };
    }
  }, [checkBreedingCompatibility, collection, saveCollection, emitEvent]);

  // Check breeding progress
  const checkBreedingProgress = useCallback((): BreedingProcess[] => {
    const now = Date.now();

    return collection.activeBreeding.map(breeding => {
      const elapsed = now - breeding.startTime.getTime();
      const progress = Math.min(100, (elapsed / breeding.duration) * 100);

      return {
        ...breeding,
        progress,
        status: progress >= 100 ? 'completed' : 'in_progress'
      };
    });
  }, [collection.activeBreeding]);

  // Collect breeding result
  const collectBreedingResult = useCallback(async (breedingId: string): Promise<CreatureOperationResult> => {
    try {
      const breeding = collection.activeBreeding.find(b => b.id === breedingId);
      if (!breeding) {
        throw new Error('Breeding process not found');
      }

      const progress = checkBreedingProgress().find(b => b.id === breedingId);
      if (!progress || progress.status !== 'completed') {
        throw new Error('Breeding not yet completed');
      }

      // Simple offspring generation
      const success = Math.random() < (breeding.pair.successRate / 100);

      if (success && breeding.pair.possibleOffspring.length > 0) {
        const offspring = breeding.pair.possibleOffspring[0];
        const parentCreature = Math.random() < 0.5 ? breeding.pair.parent1 : breeding.pair.parent2;

        // Create offspring based on parent
        const offspringCreature = enhanceCreature(parentCreature, 'breeding_grounds');
        offspringCreature.name = `${parentCreature.name} Jr.`;
        offspringCreature.genetics = {
          parentIds: [breeding.pair.parent1.creatureId, breeding.pair.parent2.creatureId],
          generation: Math.max(breeding.pair.parent1.genetics.generation, breeding.pair.parent2.genetics.generation) + 1,
          inheritedTraits: [],
          mutations: [],
          breedingPotential: 90
        };

        const newCollection = {
          ...collection,
          creatures: {
            ...collection.creatures,
            [offspringCreature.creatureId]: offspringCreature
          },
          activeBreeding: collection.activeBreeding.filter(b => b.id !== breedingId),
          breedingHistory: [...collection.breedingHistory, { ...breeding, status: 'completed' as const, result: offspringCreature }],
          totalCaptured: collection.totalCaptured + 1
        };

        await saveCollection(newCollection);

        emitEvent({
          type: 'breeding_completed',
          timestamp: new Date(),
          creature: offspringCreature,
          important: true,
          message: `Breeding successful! Welcome ${offspringCreature.name}!`
        });

        return {
          success: true,
          operation: 'breed',
          creature: offspringCreature,
          message: `Breeding successful! A new ${offspringCreature.species} was born!`
        };
      } else {
        const newCollection = {
          ...collection,
          activeBreeding: collection.activeBreeding.filter(b => b.id !== breedingId),
          breedingHistory: [...collection.breedingHistory, { ...breeding, status: 'failed' as const }]
        };

        await saveCollection(newCollection);

        return {
          success: false,
          operation: 'breed',
          message: 'Breeding was unsuccessful. The creatures were not compatible.'
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to collect breeding result';
      setError(error);
      return {
        success: false,
        operation: 'breed',
        message: error,
        error
      };
    }
  }, [collection, checkBreedingProgress, enhanceCreature, saveCollection, emitEvent]);

  // Create trade (simplified implementation)
  const createTrade = useCallback(async (offeredCreatures: string[], requestedSpecies: SpeciesRequest[]): Promise<CreatureTrade> => {
    const trade: CreatureTrade = {
      id: `trade_${Date.now()}`,
      trader: 'player',
      traderId: 'player',
      offered: {
        creatures: offeredCreatures
      },
      requested: {
        speciesRequests: requestedSpecies
      },
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    const newCollection = {
      ...collection,
      activeTrades: [...collection.activeTrades, trade]
    };

    await saveCollection(newCollection);

    return trade;
  }, [collection, saveCollection]);

  // Accept trade
  const acceptTrade = useCallback(async (tradeId: string): Promise<CreatureOperationResult> => {
    try {
      const trade = collection.activeTrades.find(t => t.id === tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      // For NPC trades, execute the trade
      if (trade.trader === 'npc') {
        // This would be connected to the NPC trading system
        // For now, we'll mark it as completed
        const newCollection = {
          ...collection,
          activeTrades: collection.activeTrades.filter(t => t.id !== tradeId),
          tradeHistory: [...collection.tradeHistory, { ...trade, status: 'completed' as const, completedAt: new Date() }]
        };

        await saveCollection(newCollection);

        emitEvent({
          type: 'trade_completed',
          timestamp: new Date(),
          data: { tradeId },
          important: true,
          message: `Trade completed successfully!`
        });

        return {
          success: true,
          operation: 'trade',
          message: 'Trade completed successfully!'
        };
      }

      return {
        success: false,
        operation: 'trade',
        message: 'Player-to-player trading not implemented yet.'
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to accept trade';
      setError(error);
      return {
        success: false,
        operation: 'trade',
        message: error,
        error
      };
    }
  }, [collection, saveCollection, emitEvent]);

  // Decline trade
  const declineTrade = useCallback(async (tradeId: string): Promise<CreatureOperationResult> => {
    try {
      const newCollection = {
        ...collection,
        activeTrades: collection.activeTrades.filter(t => t.id !== tradeId)
      };

      await saveCollection(newCollection);

      return {
        success: true,
        operation: 'trade',
        message: 'Trade declined.'
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to decline trade';
      setError(error);
      return {
        success: false,
        operation: 'trade',
        message: error,
        error
      };
    }
  }, [collection, saveCollection]);

  // Discover creature
  const discoverCreature = useCallback(async (monster: Monster, location: string): Promise<BestiaryEntry> => {
    const species = monster.name.toLowerCase().replace(/\s+/g, '_');

    let entry = collection.bestiary[species];
    if (!entry) {
      entry = {
        species,
        discoveryStatus: 'spotted',
        totalEncounters: 0,
        totalCaptures: 0,
        specimens: [],
        loreEntries: []
      };
    }

    const updatedEntry: BestiaryEntry = {
      ...entry,
      name: monster.name,
      type: monster.type as CreatureType,
      element: monster.element as CreatureElement,
      rarity: monster.rarity as CreatureRarity,
      firstSeen: entry.firstSeen || new Date(),
      totalEncounters: entry.totalEncounters + 1,
      discoveryStatus: entry.discoveryStatus === 'unknown' ? 'spotted' : entry.discoveryStatus
    };

    const newCollection = {
      ...collection,
      bestiary: {
        ...collection.bestiary,
        [species]: updatedEntry
      },
      totalDiscovered: collection.totalDiscovered + (entry.discoveryStatus === 'unknown' ? 1 : 0)
    };

    await saveCollection(newCollection);

    if (entry.discoveryStatus === 'unknown') {
      emitEvent({
        type: 'creature_discovered',
        timestamp: new Date(),
        data: { species, location },
        important: false,
        message: `Discovered new creature: ${monster.name}!`
      });
    }

    return updatedEntry;
  }, [collection, saveCollection, emitEvent]);

  // Update bestiary entry
  const updateBestiaryEntry = useCallback(async (species: string, completionLevel: CreatureCompletionLevel): Promise<BestiaryEntry> => {
    const entry = collection.bestiary[species];
    if (!entry) {
      throw new Error('Bestiary entry not found');
    }

    const updatedEntry = {
      ...entry,
      discoveryStatus: completionLevel
    };

    const newCollection = {
      ...collection,
      bestiary: {
        ...collection.bestiary,
        [species]: updatedEntry
      }
    };

    await saveCollection(newCollection);

    return updatedEntry;
  }, [collection, saveCollection]);

  // Get bestiary progress
  const getBestiaryProgress = useCallback(() => {
    const discovered = Object.values(collection.bestiary).length;
    const total = discovered + 50; // Assuming 50 more undiscovered species for now
    const percentage = total > 0 ? (discovered / total) * 100 : 0;

    return { discovered, total, percentage };
  }, [collection.bestiary]);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<CreatureFilter>) => {
    const updatedCollection = {
      ...collection,
      filter: {
        ...collection.filter,
        ...newFilter
      }
    };
    setCollection(updatedCollection);
  }, [collection]);

  // Search creatures
  const searchCreatures = useCallback((query: string): EnhancedCreature[] => {
    const searchTerm = query.toLowerCase();
    return Object.values(collection.creatures).filter(creature => {
      const searchableText = [
        creature.name,
        creature.species,
        creature.creatureType,
        creature.element,
        creature.description,
        ...creature.collectionStatus.tags
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [collection.creatures]);

  // Get creatures by species
  const getCreaturesBySpecies = useCallback((species: string): EnhancedCreature[] => {
    return Object.values(collection.creatures).filter(creature => creature.species === species);
  }, [collection.creatures]);

  // Get creatures by type
  const getCreaturesByType = useCallback((type: CreatureType): EnhancedCreature[] => {
    return Object.values(collection.creatures).filter(creature => creature.creatureType === type);
  }, [collection.creatures]);

  // Get collection statistics
  const getCollectionStats = useCallback(() => {
    const creatures = Object.values(collection.creatures);

    const byRarity = creatures.reduce((acc, creature) => {
      const rarity = creature.rarity as CreatureRarity;
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {} as Record<CreatureRarity, number>);

    const byType = creatures.reduce((acc, creature) => {
      acc[creature.creatureType] = (acc[creature.creatureType] || 0) + 1;
      return acc;
    }, {} as Record<CreatureType, number>);

    const byElement = creatures.reduce((acc, creature) => {
      acc[creature.element] = (acc[creature.element] || 0) + 1;
      return acc;
    }, {} as Record<CreatureElement, number>);

    return {
      totalCreatures: creatures.length,
      byRarity,
      byType,
      byElement,
      companions: creatures.filter(c => c.companionData?.isCompanion).length,
      breeding: collection.activeBreeding.length
    };
  }, [collection.creatures, collection.activeBreeding]);

  // Add event listener
  const addEventListener = useCallback((callback: CreatureEventCallback): (() => void) => {
    setEventListeners(prev => [...prev, callback]);

    return () => {
      setEventListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Utility functions
  const isCreatureCaptured = useCallback((species: string): boolean => {
    return Object.values(collection.creatures).some(creature => creature.species === species);
  }, [collection.creatures]);

  const getCreature = useCallback((creatureId: string): EnhancedCreature | null => {
    return collection.creatures[creatureId] || null;
  }, [collection.creatures]);

  const canCaptureMore = useCallback((): boolean => {
    return Object.keys(collection.creatures).length < 1000; // Arbitrary limit
  }, [collection.creatures]);

  return {
    // Core state
    collection,
    filteredCreatures,
    filteredBestiary,
    activeTeam,

    // Creature operations
    captureCreature,
    releaseCreature,
    renameCreature,
    favoriteCreature,

    // Team management
    addToTeam,
    removeFromTeam,
    reorderTeam,

    // Companion system
    setAsCompanion,
    trainCompanion,
    feedCompanion,

    // Breeding system
    checkBreedingCompatibility,
    startBreeding,
    checkBreedingProgress,
    collectBreedingResult,

    // Trading system
    createTrade,
    acceptTrade,
    declineTrade,

    // Discovery and bestiary
    discoverCreature,
    updateBestiaryEntry,
    getBestiaryProgress,

    // Filtering and search
    updateFilter,
    searchCreatures,
    getCreaturesBySpecies,
    getCreaturesByType,

    // Statistics and analytics
    getCollectionStats,

    // Events
    addEventListener,

    // Utility
    isCreatureCaptured,
    getCreature,
    canCaptureMore,

    // Loading and error states
    isLoading,
    error
  };
}