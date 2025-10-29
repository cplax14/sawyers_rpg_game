import React, { createContext, useContext, useState, useEffect } from 'react';
import { globalPerformanceMonitor } from '../../utils/performanceMonitor';
import PerformanceDashboard from '../PerformanceDashboard';

export interface AnimationSettings {
  enabled: boolean;
  quality: 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  showPerformanceStats: boolean;
  targetFps: number;
  enableAutoOptimization: boolean;
}

interface AnimationContextType {
  settings: AnimationSettings;
  updateSettings: (newSettings: Partial<AnimationSettings>) => void;
  isPerformanceGood: boolean;
  currentFps: number;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

interface AnimationProviderProps {
  children: React.ReactNode;
  defaultSettings?: Partial<AnimationSettings>;
}

export function AnimationProvider({ children, defaultSettings = {} }: AnimationProviderProps) {
  const [settings, setSettings] = useState<AnimationSettings>({
    enabled: true,
    quality: 'medium',
    reducedMotion: false,
    showPerformanceStats: false,
    targetFps: 60,
    enableAutoOptimization: true,
    ...defaultSettings,
  });

  const [isPerformanceGood, setIsPerformanceGood] = useState(true);
  const [currentFps, setCurrentFps] = useState(60);

  // Initialize performance monitoring
  useEffect(() => {
    globalPerformanceMonitor.startMonitoring(
      metrics => {
        setCurrentFps(metrics.fps);

        // Auto-adjust quality based on performance
        if (settings.enableAutoOptimization) {
          const performanceGood =
            metrics.fps >= globalPerformanceMonitor.thresholds.minAcceptableFps;
          setIsPerformanceGood(performanceGood);

          // Auto-adjust quality settings
          if (metrics.fps < 30 && settings.quality !== 'low') {
            updateSettings({ quality: 'low' });
          } else if (metrics.fps >= 55 && settings.quality === 'low') {
            updateSettings({ quality: 'medium' });
          } else if (metrics.fps >= 58 && settings.quality === 'medium') {
            updateSettings({ quality: 'high' });
          }
        }
      },
      warning => {
        console.warn(`Animation Performance Warning: ${warning}`);
      }
    );

    return () => {
      globalPerformanceMonitor.stopMonitoring();
    };
  }, [settings.enableAutoOptimization]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && !settings.reducedMotion) {
        updateSettings({ reducedMotion: true, quality: 'low' });
      }
    };

    // Set initial value
    if (mediaQuery.matches && !settings.reducedMotion) {
      updateSettings({ reducedMotion: true, quality: 'low' });
    }

    mediaQuery.addEventListener('change', handleReducedMotionChange);
    return () => mediaQuery.removeEventListener('change', handleReducedMotionChange);
  }, []);

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const contextValue: AnimationContextType = {
    settings,
    updateSettings,
    isPerformanceGood,
    currentFps,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
      {settings.showPerformanceStats && (
        <PerformanceDashboard visible={true} position='top-right' />
      )}
    </AnimationContext.Provider>
  );
}

export function useAnimationSettings(): AnimationContextType {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationSettings must be used within an AnimationProvider');
  }
  return context;
}

/**
 * Hook to get optimized animation props based on current settings
 */
export function useOptimizedAnimation() {
  const { settings, isPerformanceGood } = useAnimationSettings();

  const getAnimationProps = (baseProps: any = {}) => {
    if (!settings.enabled || settings.reducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.1 },
      };
    }

    const optimizedProps = { ...baseProps };

    // Adjust based on quality setting
    if (settings.quality === 'low' || !isPerformanceGood) {
      // Simplify animations
      if (optimizedProps.transition) {
        optimizedProps.transition.duration = Math.min(
          optimizedProps.transition.duration || 0.3,
          0.2
        );
      }

      // Remove complex effects
      ['filter', 'backdropFilter', 'boxShadow'].forEach(prop => {
        if (optimizedProps.initial) delete optimizedProps.initial[prop];
        if (optimizedProps.animate) delete optimizedProps.animate[prop];
        if (optimizedProps.exit) delete optimizedProps.exit[prop];
      });
    }

    return optimizedProps;
  };

  return {
    getAnimationProps,
    shouldAnimate: settings.enabled && !settings.reducedMotion,
    quality: settings.quality,
    isPerformanceGood,
  };
}

export default AnimationProvider;
