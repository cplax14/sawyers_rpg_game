import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BreedingRecipe } from '../../types/breeding';

interface RecipeDiscoveryNotificationProps {
  recipes: BreedingRecipe[];
  onDismiss: () => void;
  autoHideDelay?: number;
}

const notificationStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(74, 58, 255, 0.9))',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    border: '3px solid #d4af37',
    boxShadow: '0 20px 60px rgba(212, 175, 55, 0.4), 0 0 100px rgba(212, 175, 55, 0.2)',
    position: 'relative' as const,
  },
  sparkle: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    borderRadius: '16px',
    overflow: 'hidden',
    pointerEvents: 'none' as const,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '0.5rem',
    animation: 'bounce 1s infinite',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.5rem',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#e2e8f0',
    opacity: 0.9,
  },
  recipeList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  recipeCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
  },
  recipeName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.5rem',
  },
  recipeDescription: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginBottom: '0.75rem',
    lineHeight: '1.4',
  },
  parents: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#f1f5f9',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  parentIcon: {
    fontSize: '1.1rem',
  },
  arrow: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
    color: '#1e1b4b',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
  },
};

export const RecipeDiscoveryNotification: React.FC<RecipeDiscoveryNotificationProps> = ({
  recipes,
  onDismiss,
  autoHideDelay = 0,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHideDelay]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (recipes.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={notificationStyles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            style={notificationStyles.container}
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sparkle effect */}
            <div style={notificationStyles.sparkle}>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '4px',
                    height: '4px',
                    background: '#d4af37',
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Header */}
            <div style={notificationStyles.header}>
              <motion.div
                style={notificationStyles.icon}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                📜✨
              </motion.div>
              <h2 style={notificationStyles.title}>
                {recipes.length === 1
                  ? 'Recipe Discovered!'
                  : `${recipes.length} Recipes Discovered!`}
              </h2>
              <p style={notificationStyles.subtitle}>You've unlocked new breeding combinations!</p>
            </div>

            {/* Recipe List */}
            <div style={notificationStyles.recipeList}>
              {recipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  style={notificationStyles.recipeCard}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div style={notificationStyles.recipeName}>{recipe.name}</div>
                  <div style={notificationStyles.recipeDescription}>{recipe.description}</div>
                  <div style={notificationStyles.parents}>
                    <span style={notificationStyles.parentIcon}>🐾</span>
                    <span>{recipe.parentSpecies1}</span>
                    <span style={notificationStyles.arrow}>+</span>
                    <span style={notificationStyles.parentIcon}>🐾</span>
                    <span>{recipe.parentSpecies2}</span>
                    <span style={notificationStyles.arrow}>→</span>
                    <span style={notificationStyles.parentIcon}>⭐</span>
                    <span>{recipe.offspringSpecies}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Dismiss Button */}
            <motion.button
              style={notificationStyles.button}
              onClick={handleDismiss}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check Breeding Guide
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecipeDiscoveryNotification;
