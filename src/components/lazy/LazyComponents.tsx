/**
 * Lazy-Loaded Components
 * Implements code splitting with proper loading fallbacks for optimal bundle loading
 */

import React, { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '../atoms/LoadingSpinner';

// Loading fallback component
const ComponentLoadingFallback: React.FC<{
  message?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({
  message = 'Loading component...',
  size = 'large'
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '16px',
    padding: '2rem'
  }}>
    <LoadingSpinner size={size} />
    <p style={{
      color: 'var(--color-text-secondary, #cccccc)',
      margin: 0,
      fontSize: '0.9rem'
    }}>
      {message}
    </p>
  </div>
);

// HOC for wrapping lazy components with suspense and error boundaries
const withLazyLoading = <P extends {}>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  fallbackMessage?: string,
  fallbackSize?: 'small' | 'medium' | 'large'
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <Suspense
      fallback={
        <ComponentLoadingFallback
          message={fallbackMessage}
          size={fallbackSize}
        />
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `LazyLoaded(${LazyComponent.displayName || 'Component'})`;
  return WrappedComponent;
};

// Lazy-loaded organism components
export const LazyMainMenu = withLazyLoading(
  React.lazy(() => import('../organisms/MainMenu')),
  'Loading main menu...'
);

export const LazyCharacterSelection = withLazyLoading(
  React.lazy(() => import('../organisms/CharacterSelection')),
  'Loading character selection...'
);

export const LazyWorldMap = withLazyLoading(
  React.lazy(() => import('../organisms/WorldMap')),
  'Loading world map...'
);

export const LazySaveLoadManager = withLazyLoading(
  React.lazy(() => import('../organisms/SaveLoadManager')),
  'Loading save system...',
  'medium'
);

// Lazy-loaded molecule components (for heavy components)
export const LazySaveSlotCard = withLazyLoading(
  React.lazy(() => import('../molecules/SaveSlotCard')),
  'Loading save slot...',
  'small'
);

// Lazy-loaded utility components
export const LazyDevInfoPanel = withLazyLoading(
  React.lazy(() => Promise.resolve({ default: () => null })), // Placeholder for dev panel
  'Loading dev panel...',
  'small'
);

// Preload functions for critical components
export const preloadMainMenu = () => import('../organisms/MainMenu');
export const preloadCharacterSelection = () => import('../organisms/CharacterSelection');
export const preloadWorldMap = () => import('../organisms/WorldMap');
export const preloadSaveLoadManager = () => import('../organisms/SaveLoadManager');

// Bundle analysis helper
export const getComponentBundleInfo = () => ({
  mainMenu: 'organisms/MainMenu',
  characterSelection: 'organisms/CharacterSelection',
  worldMap: 'organisms/WorldMap',
  saveLoadManager: 'organisms/SaveLoadManager',
  saveSlotCard: 'molecules/SaveSlotCard'
});

export default {
  LazyMainMenu,
  LazyCharacterSelection,
  LazyWorldMap,
  LazySaveLoadManager,
  LazySaveSlotCard,
  withLazyLoading,
  preloadMainMenu,
  preloadCharacterSelection,
  preloadWorldMap,
  preloadSaveLoadManager
};