import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { BreedingRecipe } from '../../types/breeding';
import { useResponsive } from '../../hooks/useResponsive';

interface BreedingRecipeBookProps {
  discoveredRecipes: string[];
  playerLevel: number;
}

const recipeBookStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  progressBar: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    height: '24px',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  progressFill: {
    background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
    height: '100%',
    borderRadius: '12px',
    transition: 'width 0.5s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.9rem',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  filterSection: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  filterButton: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
  },
  filterButtonActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37',
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  recipeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    transition: 'all 0.3s ease',
  },
  recipeCardLocked: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  recipeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  recipeName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#d4af37',
  },
  recipeStatus: {
    fontSize: '0.8rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  statusDiscovered: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.5)',
  },
  statusLocked: {
    background: 'rgba(156, 163, 175, 0.2)',
    color: '#9ca3af',
    border: '1px solid rgba(156, 163, 175, 0.5)',
  },
  recipeDescription: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  recipeSection: {
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.5rem',
  },
  parentCombo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#f4f4f4',
  },
  parentIcon: {
    fontSize: '1.2rem',
  },
  arrow: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  materialsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  materialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  materialName: {
    color: '#f4f4f4',
  },
  materialQuantity: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  bonusesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    fontSize: '0.85rem',
  },
  bonusItem: {
    color: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  bonusIcon: {
    fontSize: '1rem',
  },
  hintText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '1rem',
  },
};

export const BreedingRecipeBook: React.FC<BreedingRecipeBookProps> = ({
  discoveredRecipes,
  playerLevel,
}) => {
  const { isMobile } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'discovered' | 'locked'>('all');
  const [recipes, setRecipes] = useState<BreedingRecipe[]>([]);

  // Load breeding recipes from data file
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        // Load breeding recipes from global window object
        if (typeof window !== 'undefined' && (window as any).BreedingRecipeData) {
          const recipeData = (window as any).BreedingRecipeData.recipes || [];
          setRecipes(recipeData);
        }
      } catch (error) {
        console.error('Failed to load breeding recipes:', error);
      }
    };

    loadRecipes();
  }, []);

  // Filter and search recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.offspringSpecies.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus === 'discovered') {
      filtered = filtered.filter(recipe => discoveredRecipes.includes(recipe.id));
    } else if (filterStatus === 'locked') {
      filtered = filtered.filter(recipe => !discoveredRecipes.includes(recipe.id));
    }

    return filtered;
  }, [recipes, searchQuery, filterStatus, discoveredRecipes]);

  // Calculate discovery progress
  const discoveryProgress = useMemo(() => {
    if (recipes.length === 0) return 0;
    return Math.round((discoveredRecipes.length / recipes.length) * 100);
  }, [recipes.length, discoveredRecipes.length]);

  // Check if recipe is unlocked
  const isRecipeUnlocked = useCallback((recipe: BreedingRecipe): boolean => {
    // Check if discovered
    if (!discoveredRecipes.includes(recipe.id)) return false;

    // Check unlock requirements
    if (recipe.unlockRequirements) {
      if (recipe.unlockRequirements.minPlayerLevel && playerLevel < recipe.unlockRequirements.minPlayerLevel) {
        return false;
      }
    }

    return true;
  }, [discoveredRecipes, playerLevel]);

  return (
    <div style={recipeBookStyles.container}>
      {/* Header */}
      <div style={recipeBookStyles.header}>
        <h2 style={recipeBookStyles.title}>Breeding Recipe Book</h2>
        <p style={recipeBookStyles.subtitle}>
          Discover special breeding combinations for powerful offspring
        </p>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={recipeBookStyles.progressBar}>
          <motion.div
            style={{
              ...recipeBookStyles.progressFill,
              width: `${discoveryProgress}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${discoveryProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {discoveryProgress > 15 && `${discoveryProgress}%`}
          </motion.div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          {discoveredRecipes.length} / {recipes.length} Recipes Discovered
        </p>
      </div>

      {/* Search */}
      <div style={recipeBookStyles.searchContainer}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={recipeBookStyles.searchInput}
        />
        <span style={recipeBookStyles.searchIcon}>🔍</span>
      </div>

      {/* Filters */}
      <div style={recipeBookStyles.filterSection}>
        <button
          style={{
            ...recipeBookStyles.filterButton,
            ...(filterStatus === 'all' ? recipeBookStyles.filterButtonActive : {}),
          }}
          onClick={() => setFilterStatus('all')}
        >
          All Recipes
        </button>
        <button
          style={{
            ...recipeBookStyles.filterButton,
            ...(filterStatus === 'discovered' ? recipeBookStyles.filterButtonActive : {}),
          }}
          onClick={() => setFilterStatus('discovered')}
        >
          Discovered
        </button>
        <button
          style={{
            ...recipeBookStyles.filterButton,
            ...(filterStatus === 'locked' ? recipeBookStyles.filterButtonActive : {}),
          }}
          onClick={() => setFilterStatus('locked')}
        >
          Locked
        </button>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div style={recipeBookStyles.emptyState}>
          <div style={recipeBookStyles.emptyIcon}>📖</div>
          <div style={recipeBookStyles.emptyText}>
            {searchQuery || filterStatus !== 'all'
              ? 'No recipes match your search'
              : 'No breeding recipes available yet'}
          </div>
        </div>
      ) : (
        <div style={{
          ...recipeBookStyles.recipeGrid,
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'repeat(auto-fill, minmax(300px, 1fr))',
        }}>
          <AnimatePresence>
            {filteredRecipes.map((recipe, index) => {
              const isUnlocked = isRecipeUnlocked(recipe);
              const isDiscovered = discoveredRecipes.includes(recipe.id);

              return (
                <motion.div
                  key={recipe.id}
                  style={{
                    ...recipeBookStyles.recipeCard,
                    ...(!isDiscovered ? recipeBookStyles.recipeCardLocked : {}),
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={isDiscovered ? { scale: 1.02 } : {}}
                >
                  {/* Header */}
                  <div style={recipeBookStyles.recipeHeader}>
                    <div style={recipeBookStyles.recipeName}>
                      {isDiscovered ? recipe.name : '???'}
                    </div>
                    <div
                      style={{
                        ...recipeBookStyles.recipeStatus,
                        ...(isDiscovered
                          ? recipeBookStyles.statusDiscovered
                          : recipeBookStyles.statusLocked),
                      }}
                    >
                      {isDiscovered ? 'Discovered' : 'Locked'}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={recipeBookStyles.recipeDescription}>
                    {isDiscovered ? recipe.description : 'Breed different creature combinations to discover this recipe.'}
                  </div>

                  {/* Parent Combination */}
                  {isDiscovered && (
                    <div style={recipeBookStyles.recipeSection}>
                      <div style={recipeBookStyles.sectionTitle}>Parents</div>
                      <div style={recipeBookStyles.parentCombo}>
                        <span style={recipeBookStyles.parentIcon}>🐾</span>
                        <span>{recipe.parentSpecies1 || 'Any'}</span>
                        <span style={recipeBookStyles.arrow}>+</span>
                        <span style={recipeBookStyles.parentIcon}>🐾</span>
                        <span>{recipe.parentSpecies2 || 'Any'}</span>
                        <span style={recipeBookStyles.arrow}>→</span>
                        <span style={recipeBookStyles.parentIcon}>⭐</span>
                        <span>{recipe.offspringSpecies}</span>
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {isDiscovered && recipe.materials.length > 0 && (
                    <div style={recipeBookStyles.recipeSection}>
                      <div style={recipeBookStyles.sectionTitle}>Required Materials</div>
                      <div style={recipeBookStyles.materialsList}>
                        {recipe.materials.map((material, idx) => (
                          <div key={idx} style={recipeBookStyles.materialItem}>
                            <span style={recipeBookStyles.materialName}>{material.name}</span>
                            <span style={recipeBookStyles.materialQuantity}>×{material.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bonuses */}
                  {isDiscovered && recipe.guaranteedBonuses && (
                    <div style={recipeBookStyles.recipeSection}>
                      <div style={recipeBookStyles.sectionTitle}>Guaranteed Bonuses</div>
                      <div style={recipeBookStyles.bonusesList}>
                        {recipe.guaranteedBonuses.statMultiplier && (
                          <div style={recipeBookStyles.bonusItem}>
                            <span style={recipeBookStyles.bonusIcon}>📈</span>
                            <span>+{((recipe.guaranteedBonuses.statMultiplier - 1) * 100).toFixed(0)}% Stats</span>
                          </div>
                        )}
                        {recipe.guaranteedBonuses.minRarity && (
                          <div style={recipeBookStyles.bonusItem}>
                            <span style={recipeBookStyles.bonusIcon}>⭐</span>
                            <span>Minimum {recipe.guaranteedBonuses.minRarity} Rarity</span>
                          </div>
                        )}
                        {recipe.guaranteedBonuses.guaranteedAbilities && recipe.guaranteedBonuses.guaranteedAbilities.length > 0 && (
                          <div style={recipeBookStyles.bonusItem}>
                            <span style={recipeBookStyles.bonusIcon}>⚡</span>
                            <span>{recipe.guaranteedBonuses.guaranteedAbilities.length} Special Abilities</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hint for locked recipes */}
                  {!isDiscovered && recipe.hint && (
                    <div style={recipeBookStyles.hintText}>
                      💡 {recipe.hint}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BreedingRecipeBook;
