import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { CreatureCard } from '../molecules/CreatureCard';
import { VirtualizedGrid } from '../atoms/VirtualizedGrid';
import { LazyVirtualizedGrid } from './LazyVirtualizedGrid';
import { useCreatures } from '../../hooks/useCreatures';
import { useVirtualizedGrid } from '../../hooks/useVirtualizedGrid';
import { useLazyCreatureLoading } from '../../hooks/useLazyLoading';
import { useGameState } from '../../hooks';
import { useResponsive } from '../../hooks';
import { EnhancedCreature, CreatureType, CreatureElement, CreatureRarity } from '../../types/creatures';
import { checkBreedingCompatibility, breedCreatures, generateNPCTraders, canMakeTrade, executeNPCTrade } from '../../utils/creatureUtils';

interface CreatureScreenProps {
  className?: string;
  onClose?: () => void;
}

// View modes for the creature screen
type ViewMode = 'bestiary' | 'collection' | 'team' | 'breeding' | 'trading';

// Creature categories for filtering
const CREATURE_TYPES: Array<{ id: CreatureType | 'all'; name: string; icon: string }> = [
  { id: 'all', name: 'All Types', icon: '🌟' },
  { id: 'beast', name: 'Beast', icon: '🐺' },
  { id: 'elemental', name: 'Elemental', icon: '⚡' },
  { id: 'undead', name: 'Undead', icon: '💀' },
  { id: 'dragon', name: 'Dragon', icon: '🐉' },
  { id: 'spirit', name: 'Spirit', icon: '👻' },
  { id: 'construct', name: 'Construct', icon: '🤖' },
  { id: 'fey', name: 'Fey', icon: '🧚' },
  { id: 'demon', name: 'Demon', icon: '😈' },
  { id: 'angel', name: 'Angel', icon: '😇' },
  { id: 'plant', name: 'Plant', icon: '🌿' },
  { id: 'insect', name: 'Insect', icon: '🐛' }
];

// Sort options
const SORT_OPTIONS: Array<{ id: string; name: string; icon: string }> = [
  { id: 'name', name: 'Name', icon: '🔤' },
  { id: 'level', name: 'Level', icon: '📊' },
  { id: 'rarity', name: 'Rarity', icon: '⭐' },
  { id: 'type', name: 'Type', icon: '📂' },
  { id: 'capturedAt', name: 'Capture Date', icon: '📅' },
  { id: 'discoveredAt', name: 'Discovery Date', icon: '🔍' }
];

// Temporary styles since PostCSS is disabled
const creatureStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    padding: '1rem',
    boxSizing: 'border-box' as const,
    overflow: 'hidden'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#d4af37'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: '0'
  },
  navigation: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const
  },
  navButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  navButtonActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37'
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  searchContainer: {
    flex: '1 1 300px',
    position: 'relative' as const
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.3s ease'
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '1.2rem'
  },
  clearSearch: {
    position: 'absolute' as const,
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem'
  },
  filterTabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const
  },
  filterTab: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  filterTabActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sortLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  sortSelect: {
    padding: '0.5rem',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.8rem',
    outline: 'none'
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  progressBarContainer: {
    width: '200px',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #d4af37)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  creatureGrid: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '0.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    alignContent: 'start'
  },
  mobileCreatureGrid: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '0.75rem'
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1rem',
    padding: '3rem 1rem',
    fontStyle: 'italic'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  errorContainer: {
    textAlign: 'center' as const,
    padding: '2rem'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 10
  }
};

export const CreatureScreen: React.FC<CreatureScreenProps> = ({
  className,
  onClose
}) => {
  const { gameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();

  const {
    collection = [],
    filteredCreatures = [],
    filteredBestiary = [],
    activeTeam = [],
    isLoading = false,
    error = null,
    getCollectionStats,
    searchCreatures,
    filterCreatures,
    sortCreatures
  } = useCreatures() || {};

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('bestiary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Breeding state
  const [selectedParent1, setSelectedParent1] = useState<EnhancedCreature | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<EnhancedCreature | null>(null);
  const [showBreedingModal, setShowBreedingModal] = useState(false);

  // Trading state
  const [selectedTradeCreature, setSelectedTradeCreature] = useState<EnhancedCreature | null>(null);
  const [npcTraders] = useState(() => generateNPCTraders());
  const [selectedTrader, setSelectedTrader] = useState<any>(null);
  const [selectedTradeOffer, setSelectedTradeOffer] = useState<any>(null);

  // Get the current data based on view mode
  const currentData = useMemo(() => {
    switch (viewMode) {
      case 'bestiary':
        return filteredBestiary.map(entry => entry.creature);
      case 'collection':
        return filteredCreatures;
      case 'team':
        return activeTeam;
      case 'breeding':
        return filteredCreatures; // Show all captured creatures for breeding selection
      case 'trading':
        return filteredCreatures; // Show all captured creatures for trading selection
      default:
        return [];
    }
  }, [viewMode, filteredBestiary, filteredCreatures, activeTeam]);

  // Apply local filters and sorting
  const filteredAndSortedData = useMemo(() => {
    let data = [...currentData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(creature =>
        creature.name.toLowerCase().includes(query) ||
        creature.description?.toLowerCase().includes(query) ||
        creature.creatureType.toLowerCase().includes(query) ||
        creature.element.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      data = data.filter(creature => creature.creatureType === selectedType);
    }

    // Apply sorting
    data.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
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
        case 'capturedAt':
          const aDate = a.capturedAt || new Date(0);
          const bDate = b.capturedAt || new Date(0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case 'discoveredAt':
          comparison = a.discoveredAt.getTime() - b.discoveredAt.getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return data;
  }, [currentData, searchQuery, selectedType, sortBy, sortOrder]);

  // Virtualized grid configuration for creatures
  const CREATURE_CARD_HEIGHT = isMobile ? 220 : 260;
  const CREATURE_MIN_WIDTH = isMobile ? 280 : 300;
  const CREATURE_GRID_CONTAINER_HEIGHT = 500;

  const creatureVirtualGridSettings = useVirtualizedGrid({
    itemCount: filteredAndSortedData.length,
    containerHeight: CREATURE_GRID_CONTAINER_HEIGHT,
    minItemWidth: CREATURE_MIN_WIDTH,
    itemHeight: CREATURE_CARD_HEIGHT,
    gap: isMobile ? 12 : 16,
    threshold: 50 // Enable virtualization for 50+ creatures
  });

  // Creature rendering function for virtualized grid
  const renderCreature = useCallback((creature: EnhancedCreature, index: number) => (
    <CreatureCard
      creature={creature}
      viewMode={viewMode}
      size={isMobile ? 'sm' : 'md'}
      showActions={viewMode !== 'breeding' && viewMode !== 'trading'}
      showDetails={true}
      onClick={viewMode === 'breeding' ? () => handleCreatureSelect(creature) :
              viewMode === 'trading' ? () => handleTradeCreatureSelect(creature) : undefined}
      className={viewMode === 'breeding' ?
        (selectedParent1?.id === creature.id || selectedParent2?.id === creature.id ?
          'breeding-selected' : 'breeding-selectable') :
        viewMode === 'trading' ?
          (selectedTradeCreature?.id === creature.id ? 'trading-selected' : 'trading-selectable') : ''}
      onRelease={(creature) => {
        console.log('Releasing creature:', creature.name);
      }}
      onAddToTeam={(creature) => {
        console.log('Adding to team:', creature.name);
      }}
      onRemoveFromTeam={(creature) => {
        console.log('Removing from team:', creature.name);
      }}
      onRename={(creature) => {
        console.log('Renaming creature:', creature.name);
      }}
      onInspect={(creature) => {
        console.log('Inspecting creature:', creature.name);
      }}
    />
  ), [viewMode, isMobile, selectedParent1?.id, selectedParent2?.id, selectedTradeCreature?.id, handleCreatureSelect, handleTradeCreatureSelect]);

  // Creature key function for virtualized grid
  const getCreatureKey = useCallback((creature: EnhancedCreature, index: number) => creature.creatureId, []);

  // Lazy loading setup for large creature collections
  const currentCreatureFilters = useMemo(() => ({
    viewMode,
    search: searchQuery,
    type: selectedType,
    sort: { field: sortBy, order: sortOrder }
  }), [viewMode, searchQuery, selectedType, sortBy, sortOrder]);

  // Mock lazy loading function for creatures
  const loadCreatureData = useCallback(async (page: number, pageSize: number, viewModeFilter: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // Get current data based on view mode
    let data: EnhancedCreature[] = [];
    switch (viewModeFilter) {
      case 'bestiary':
        data = [...(filteredBestiary || [])];
        break;
      case 'collection':
        data = [...(filteredCreatures || [])];
        break;
      case 'team':
        data = [...(activeTeam || [])];
        break;
      case 'breeding':
        data = [...(filteredCreatures || [])];
        break;
      case 'trading':
        data = [...(filteredCreatures || [])];
        break;
      default:
        data = [...(filteredBestiary || [])];
    }

    // Apply search filter
    if (currentCreatureFilters.search?.trim()) {
      const searchTerm = currentCreatureFilters.search.toLowerCase();
      data = data.filter(creature =>
        creature.name?.toLowerCase().includes(searchTerm) ||
        creature.species?.toLowerCase().includes(searchTerm) ||
        creature.creatureType?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply type filter
    if (currentCreatureFilters.type !== 'all') {
      data = data.filter(creature => creature.creatureType === currentCreatureFilters.type);
    }

    // Apply sorting
    data.sort((a, b) => {
      let comparison = 0;
      switch (currentCreatureFilters.sort.field) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'level':
          comparison = (a.level || 1) - (b.level || 1);
          break;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
          comparison = rarityOrder.indexOf(a.rarity || 'common') - rarityOrder.indexOf(b.rarity || 'common');
          break;
        case 'type':
          comparison = (a.creatureType || '').localeCompare(b.creatureType || '');
          break;
        default:
          comparison = 0;
      }
      return currentCreatureFilters.sort.order === 'desc' ? -comparison : comparison;
    });

    // Paginate
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = data.slice(startIndex, endIndex);

    return {
      items: pageItems,
      totalCount: data.length,
      hasMore: endIndex < data.length
    };
  }, [filteredBestiary, filteredCreatures, activeTeam, currentCreatureFilters]);

  // Enable lazy loading for creature collections with 50+ total creatures
  const totalCreatures = currentData?.length || 0;
  const shouldUseLazyCreatureLoading = totalCreatures >= 50;

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle type filter change
  const handleTypeChange = useCallback((type: CreatureType | 'all') => {
    setSelectedType(type);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(':');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // Reset breeding selection when changing view modes
    if (mode !== 'breeding') {
      setSelectedParent1(null);
      setSelectedParent2(null);
    }
    // Reset trading selection when changing view modes
    if (mode !== 'trading') {
      setSelectedTradeCreature(null);
      setSelectedTrader(null);
      setSelectedTradeOffer(null);
    }
  }, []);

  // Handle creature selection for breeding
  const handleCreatureSelect = useCallback((creature: EnhancedCreature) => {
    if (viewMode !== 'breeding') return;

    if (!selectedParent1) {
      setSelectedParent1(creature);
    } else if (!selectedParent2 && creature.id !== selectedParent1.id) {
      setSelectedParent2(creature);
    } else {
      // Reset selection if same creature or both are already selected
      setSelectedParent1(creature);
      setSelectedParent2(null);
    }
  }, [viewMode, selectedParent1]);

  // Handle breeding execution
  const handleBreed = useCallback(async () => {
    if (!selectedParent1 || !selectedParent2) return;

    try {
      // Check compatibility
      const compatibility = checkBreedingCompatibility(selectedParent1, selectedParent2);
      if (!compatibility.compatible) {
        alert(`Breeding failed: ${compatibility.reasons.join(', ')}`);
        return;
      }

      // Create offspring
      const offspring = breedCreatures(selectedParent1, selectedParent2);

      // For now, just show success message
      // In a real implementation, you'd add the offspring to the collection
      alert(`Breeding successful! Created: ${offspring.name}`);

      // Reset selection
      setSelectedParent1(null);
      setSelectedParent2(null);
    } catch (error) {
      alert(`Breeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedParent1, selectedParent2]);

  // Handle creature selection for trading
  const handleTradeCreatureSelect = useCallback((creature: EnhancedCreature) => {
    if (viewMode !== 'trading') return;
    setSelectedTradeCreature(creature);
  }, [viewMode]);

  // Handle trade execution
  const handleExecuteTrade = useCallback(async () => {
    if (!selectedTradeCreature || !selectedTrader || !selectedTradeOffer) return;

    try {
      const tradeResult = executeNPCTrade(selectedTrader, selectedTradeOffer, selectedTradeCreature);

      if (tradeResult.success) {
        let message = `Trade successful!`;
        if (tradeResult.receivedCreature) {
          message += ` Received: ${tradeResult.receivedCreature.name}`;
        }
        if (tradeResult.receivedCurrency) {
          message += ` Received: ${tradeResult.receivedCurrency} gold`;
        }
        alert(message);

        // Reset selections
        setSelectedTradeCreature(null);
        setSelectedTrader(null);
        setSelectedTradeOffer(null);
      } else {
        alert(`Trade failed: ${tradeResult.error}`);
      }
    } catch (error) {
      alert(`Trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedTradeCreature, selectedTrader, selectedTradeOffer]);

  // Get collection statistics
  const stats = useMemo(() => {
    if (getCollectionStats) {
      const collectionStats = getCollectionStats();
      // Ensure completionPercentage is always a number
      return {
        discovered: collectionStats.discovered || 0,
        captured: collectionStats.captured || 0,
        total: collectionStats.total || 100,
        completionPercentage: collectionStats.completionPercentage || 0,
        teamSize: activeTeam?.length || 0
      };
    }
    return {
      discovered: 0,
      captured: 0,
      total: 100, // Default total
      completionPercentage: 0,
      teamSize: activeTeam?.length || 0
    };
  }, [getCollectionStats, activeTeam?.length]);

  // Get view mode info
  const getViewModeInfo = (mode: ViewMode) => {
    switch (mode) {
      case 'bestiary':
        return {
          icon: '📖',
          name: 'Bestiary',
          description: 'All discovered creatures'
        };
      case 'collection':
        return {
          icon: '🏠',
          name: 'Collection',
          description: 'Your captured creatures'
        };
      case 'team':
        return {
          icon: '⚔️',
          name: 'Team',
          description: 'Active companion team'
        };
      case 'breeding':
        return {
          icon: '💕',
          name: 'Breeding',
          description: 'Breed your creatures'
        };
      case 'trading':
        return {
          icon: '🏪',
          name: 'Trading',
          description: 'Trade with NPCs'
        };
      default:
        return { icon: '❓', name: 'Unknown', description: '' };
    }
  };

  if (isLoading) {
    return (
      <div className={className} style={creatureStyles.container}>
        <div style={creatureStyles.loadingContainer}>
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={creatureStyles.container}>
        <div style={creatureStyles.errorContainer}>
          <h2>Creature System Error</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={creatureStyles.container}>
      {onClose && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          style={creatureStyles.closeButton}
        >
          ✕
        </Button>
      )}

      {/* Header */}
      <motion.div
        style={creatureStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{
          ...creatureStyles.title,
          fontSize: isMobile ? '1.5rem' : '2rem'
        }}>
          Creature Collection
        </h1>
        <p style={creatureStyles.subtitle}>
          Discover, capture, and manage your creature companions
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        style={creatureStyles.navigation}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {(['bestiary', 'collection', 'team', 'breeding', 'trading'] as ViewMode[]).map((mode, index) => {
          const modeInfo = getViewModeInfo(mode);
          return (
            <motion.button
              key={mode}
              style={{
                ...creatureStyles.navButton,
                ...(viewMode === mode ? creatureStyles.navButtonActive : {})
              }}
              onClick={() => handleViewModeChange(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <span>{modeInfo.icon}</span>
              <span>{modeInfo.name}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Controls */}
      <motion.div
        style={{
          ...creatureStyles.controls,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Search */}
        <div style={creatureStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search creatures..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={creatureStyles.searchInput}
          />
          {searchQuery ? (
            <button
              onClick={handleClearSearch}
              style={creatureStyles.clearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span style={creatureStyles.searchIcon}>🔍</span>
          )}
        </div>

        {/* Sort */}
        <div style={creatureStyles.sortContainer}>
          <span style={creatureStyles.sortLabel}>Sort by:</span>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={handleSortChange}
            style={creatureStyles.sortSelect}
          >
            {SORT_OPTIONS.map(option => (
              <React.Fragment key={option.id}>
                <option value={`${option.id}:asc`}>
                  {option.icon} {option.name} (A-Z)
                </option>
                <option value={`${option.id}:desc`}>
                  {option.icon} {option.name} (Z-A)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Type Filters */}
      <motion.div
        style={creatureStyles.filterTabs}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {CREATURE_TYPES.map((type, index) => (
          <motion.button
            key={type.id}
            style={{
              ...creatureStyles.filterTab,
              ...(selectedType === type.id ? creatureStyles.filterTabActive : {})
            }}
            onClick={() => handleTypeChange(type.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.02 }}
          >
            <span>{type.icon}</span>
            <span>{type.name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <div style={creatureStyles.content}>
        {/* Stats Bar */}
        <motion.div
          style={creatureStyles.statsBar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <span>
              {getViewModeInfo(viewMode).description}: {filteredAndSortedData.length}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>

          {viewMode === 'bestiary' && (
            <div style={creatureStyles.progressBar}>
              <span>Discovery: {stats.discovered}/{stats.total}</span>
              <div style={creatureStyles.progressBarContainer}>
                <div
                  style={{
                    ...creatureStyles.progressBarFill,
                    width: `${stats.completionPercentage || 0}%`
                  }}
                />
              </div>
              <span>{(stats.completionPercentage || 0).toFixed(1)}%</span>
            </div>
          )}

          {viewMode === 'collection' && (
            <span>Captured: {stats.captured} creatures</span>
          )}

          {viewMode === 'team' && (
            <span>Team: {stats.teamSize}/6 companions</span>
          )}
        </motion.div>

        {/* Creatures Grid - With Lazy Loading and Virtualization */}
        {shouldUseLazyCreatureLoading ? (
          // Use lazy loading + virtualization for large creature collections
          <LazyVirtualizedGrid
            loadFunction={(page, pageSize) => loadCreatureData(page, pageSize, viewMode)}
            renderItem={renderCreature}
            getItemKey={getCreatureKey}
            itemHeight={CREATURE_CARD_HEIGHT}
            minItemWidth={CREATURE_MIN_WIDTH}
            containerHeight={CREATURE_GRID_CONTAINER_HEIGHT}
            gap={isMobile ? 12 : 16}
            pageSize={30}
            preloadDistance={1}
            skeletonType="creature"
            style={{
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
            emptyState={
              <motion.div
                style={creatureStyles.emptyState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {searchQuery ?
                  `No creatures found matching "${searchQuery}"` :
                  viewMode === 'bestiary' ? 'No creatures discovered yet' :
                  viewMode === 'collection' ? 'No creatures captured yet' :
                  'No creatures in your team'
                }
              </motion.div>
            }
          />
        ) : filteredAndSortedData.length === 0 ? (
          <motion.div
            style={creatureStyles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {searchQuery ?
              `No creatures found matching "${searchQuery}"` :
              viewMode === 'bestiary' ? 'No creatures discovered yet' :
              viewMode === 'collection' ? 'No creatures captured yet' :
              'No creatures in your team'
            }
          </motion.div>
        ) : creatureVirtualGridSettings.shouldVirtualize ? (
          // Use virtualized grid for medium creature collections
          <VirtualizedGrid
            items={filteredAndSortedData}
            itemHeight={creatureVirtualGridSettings.itemHeight}
            itemsPerRow={creatureVirtualGridSettings.itemsPerRow}
            containerHeight={creatureVirtualGridSettings.containerHeight}
            renderItem={renderCreature}
            getItemKey={getCreatureKey}
            gap={creatureVirtualGridSettings.gap}
            overscan={creatureVirtualGridSettings.overscan}
            style={{
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          />
        ) : (
          // Use regular grid for small creature collections
          <div style={{
            ...creatureStyles.creatureGrid,
            ...(isMobile ? creatureStyles.mobileCreatureGrid : {}),
            height: CREATURE_GRID_CONTAINER_HEIGHT,
            maxHeight: CREATURE_GRID_CONTAINER_HEIGHT
          }}>
            <AnimatePresence>
              {filteredAndSortedData.map((creature, index) => (
                <motion.div
                  key={creature.creatureId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3
                  }}
                  layout
                >
                  {renderCreature(creature, index)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Breeding Panel */}
        {viewMode === 'breeding' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '2px solid #ff6b6b',
              borderRadius: '16px',
              padding: '1.5rem',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              maxWidth: '90vw',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {selectedParent1 ? '✅' : '👤'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>
                  Parent 1
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedParent1 ? selectedParent1.name : 'Select first parent'}
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: '#ff6b6b' }}>+</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {selectedParent2 ? '✅' : '👤'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>
                  Parent 2
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedParent2 ? selectedParent2.name : 'Select second parent'}
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: '#ff6b6b' }}>=</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🥚</div>
                <div style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>
                  Offspring
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedParent1 && selectedParent2 ? 'Ready to breed!' : 'Awaiting parents'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedParent1 || !selectedParent2}
                onClick={handleBreed}
                style={{
                  background: selectedParent1 && selectedParent2 ? '#ff6b6b' : '#666',
                  borderColor: selectedParent1 && selectedParent2 ? '#ff6b6b' : '#666'
                }}
              >
                🥚 Breed
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedParent1(null);
                  setSelectedParent2(null);
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        {/* Trading Panel */}
        {viewMode === 'trading' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '2px solid #4caf50',
              borderRadius: '16px',
              padding: '1.5rem',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxWidth: '90vw',
              minWidth: '300px'
            }}
          >
            {/* Step 1: Select Creature */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {selectedTradeCreature ? '✅' : '👤'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4caf50' }}>
                  Your Creature
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedTradeCreature ? selectedTradeCreature.name : 'Select creature to trade'}
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: '#4caf50' }}>→</div>

              {/* Step 2: Select Trader */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {selectedTrader ? '🏪' : '❓'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4caf50' }}>
                  NPC Trader
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedTrader ? selectedTrader.name : 'Select a trader'}
                </div>
              </div>

              <div style={{ fontSize: '2rem', color: '#4caf50' }}>→</div>

              {/* Step 3: Execute Trade */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
                <div style={{ fontSize: '0.9rem', color: '#4caf50' }}>
                  Reward
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedTradeOffer && selectedTradeCreature ? 'Ready to trade!' : 'Select creature & trader'}
                </div>
              </div>
            </div>

            {/* Trader Selection */}
            {selectedTradeCreature && !selectedTrader && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {npcTraders.map(trader => (
                  <Button
                    key={trader.id}
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedTrader(trader)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {trader.icon} {trader.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Trade Offer Selection */}
            {selectedTradeCreature && selectedTrader && !selectedTradeOffer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', textAlign: 'center', color: '#4caf50' }}>
                  {selectedTrader.name}'s Offers:
                </div>
                {selectedTrader.trades.map((offer: any) => {
                  const validation = canMakeTrade(selectedTrader, offer, selectedTradeCreature);
                  return (
                    <Button
                      key={offer.id}
                      variant={validation.canTrade ? "success" : "secondary"}
                      size="sm"
                      disabled={!validation.canTrade}
                      onClick={() => validation.canTrade && setSelectedTradeOffer(offer)}
                      style={{
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        padding: '0.5rem',
                        opacity: validation.canTrade ? 1 : 0.5
                      }}
                    >
                      <div>Wants: {offer.wants.type || offer.wants.species || 'Any'}</div>
                      <div>Offers: {offer.offers.species || `${offer.offers.currency} gold`}</div>
                      {!validation.canTrade && <div style={{ color: '#ff6b6b', fontSize: '0.7rem' }}>{validation.reason}</div>}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedTradeCreature || !selectedTrader || !selectedTradeOffer}
                onClick={handleExecuteTrade}
                style={{
                  background: selectedTradeCreature && selectedTrader && selectedTradeOffer ? '#4caf50' : '#666',
                  borderColor: selectedTradeCreature && selectedTrader && selectedTradeOffer ? '#4caf50' : '#666'
                }}
              >
                🤝 Execute Trade
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedTradeCreature(null);
                  setSelectedTrader(null);
                  setSelectedTradeOffer(null);
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreatureScreen;