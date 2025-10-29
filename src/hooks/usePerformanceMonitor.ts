import { useState, useEffect } from 'react';
import { globalPerformanceMonitor, PerformanceMetrics } from '../utils/performanceMonitor';

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    setIsMonitoring(true);

    globalPerformanceMonitor.startMonitoring(
      newMetrics => setMetrics(newMetrics),
      warning => setWarnings(prev => [...prev.slice(-4), warning]) // Keep last 5 warnings
    );

    return () => {
      setIsMonitoring(false);
      globalPerformanceMonitor.stopMonitoring();
    };
  }, []);

  return {
    metrics,
    warnings,
    isMonitoring,
    recommendations: metrics ? globalPerformanceMonitor.getRecommendations() : [],
    createSnapshot: () => globalPerformanceMonitor.createSnapshot(),
    startMonitoring: () => globalPerformanceMonitor.startMonitoring(),
    stopMonitoring: () => globalPerformanceMonitor.stopMonitoring(),
  };
}

/**
 * React hook for measuring animation performance
 */
export function useAnimationPerformance() {
  const startAnimation = (
    id: string,
    type: string,
    complexity: 'low' | 'medium' | 'high',
    elementCount: number
  ) => {
    globalPerformanceMonitor.startAnimation({
      id,
      type,
      duration: 0,
      complexity,
      elementCount,
    });
  };

  const endAnimation = (id: string) => {
    globalPerformanceMonitor.endAnimation(id);
  };

  return {
    startAnimation,
    endAnimation,
  };
}

/**
 * React hook for performance-aware animation control
 */
export function usePerformanceAwareAnimation() {
  const { metrics } = usePerformanceMonitor();

  const shouldReduceAnimations = () => {
    if (!metrics) return false;

    // Reduce animations if FPS is too low or frame time is too high
    return (
      metrics.fps < globalPerformanceMonitor.thresholds.minAcceptableFps ||
      metrics.frameTime > globalPerformanceMonitor.thresholds.maxFrameTime * 1.5
    );
  };

  const getOptimalAnimationDuration = (baseDuration: number) => {
    if (!metrics) return baseDuration;

    // Reduce animation duration if performance is poor
    if (shouldReduceAnimations()) {
      return baseDuration * 0.5; // Cut duration in half
    }

    return baseDuration;
  };

  const getOptimalAnimationQuality = (): 'low' | 'medium' | 'high' => {
    if (!metrics) return 'medium';

    if (metrics.fps >= 55) return 'high';
    if (metrics.fps >= 45) return 'medium';
    return 'low';
  };

  return {
    shouldReduceAnimations: shouldReduceAnimations(),
    getOptimalAnimationDuration,
    getOptimalAnimationQuality: getOptimalAnimationQuality(),
    performanceMetrics: metrics,
  };
}
