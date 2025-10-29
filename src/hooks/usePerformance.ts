import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from './useResponsive';

/**
 * Performance Optimization Hooks
 * Provides utilities for optimizing performance on mobile devices
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  isLowPerformance: boolean;
}

/**
 * Hook to monitor and optimize performance on mobile devices
 */
export const usePerformanceOptimization = () => {
  const isMobile = useIsMobile();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    isLowPerformance: false,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // Monitor FPS and performance
  useEffect(() => {
    if (!isMobile) return;

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        // Update every second
        const fps = Math.round((frameCountRef.current * 1000) / delta);

        // Get memory usage if available
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        }

        // Determine if performance is low
        const isLowPerformance = fps < 30 || memoryUsage > 0.8;

        setPerformanceMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage,
          isLowPerformance,
        }));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      frameCountRef.current++;
      animationFrameRef.current = requestAnimationFrame(measurePerformance);
    };

    animationFrameRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (performanceMetrics.fps < 30) {
      suggestions.push('Low FPS detected - consider reducing animations');
    }

    if (performanceMetrics.memoryUsage > 0.8) {
      suggestions.push('High memory usage - consider reducing cached data');
    }

    if (isMobile && performanceMetrics.isLowPerformance) {
      suggestions.push('Enable performance mode for better mobile experience');
    }

    return suggestions;
  }, [performanceMetrics, isMobile]);

  return {
    performanceMetrics,
    optimizationSuggestions: getOptimizationSuggestions(),
    isMobile,
  };
};

/**
 * Hook for debouncing expensive operations on mobile
 */
export const useMobileDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  const isMobile = useIsMobile();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // On mobile, use debouncing; on desktop, call immediately
      if (!isMobile) {
        return callbackRef.current(...args);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [isMobile, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
};

/**
 * Hook for throttling frequent operations on mobile
 */
export const useMobileThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 100
): T => {
  const isMobile = useIsMobile();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      // On desktop, call immediately
      if (!isMobile) {
        return callbackRef.current(...args);
      }

      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= limit) {
        lastCallRef.current = now;
        return callbackRef.current(...args);
      }

      // Schedule the call for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callbackRef.current(...args);
      }, limit - timeSinceLastCall);
    },
    [isMobile, limit]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
};

/**
 * Hook for lazy loading components on mobile
 */
export const useLazyLoad = (threshold: number = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isMobile) {
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isMobile, hasLoaded, threshold]);

  return {
    elementRef,
    isIntersecting: isMobile ? isIntersecting : true,
    hasLoaded: isMobile ? hasLoaded : true,
  };
};

/**
 * Hook for reducing animations on low-performance devices
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { isLowPerformance } = usePerformanceOptimization();

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Reduce motion if user prefers it OR if performance is low
  const shouldReduceMotion = prefersReducedMotion || isLowPerformance;

  return {
    prefersReducedMotion,
    isLowPerformance,
    shouldReduceMotion,
    // Provide alternative animation configurations
    animationConfig: {
      duration: shouldReduceMotion ? 0.1 : 0.3,
      ease: shouldReduceMotion ? 'linear' : 'easeOut',
      disabled: shouldReduceMotion,
    },
  };
};

/**
 * Hook for managing image loading on mobile
 */
export const useOptimizedImages = () => {
  const isMobile = useIsMobile();
  const [imageFormat, setImageFormat] = useState<'webp' | 'jpeg' | 'png'>('jpeg');

  useEffect(() => {
    // Check for WebP support
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      return dataURL.startsWith('data:image/webp');
    };

    if (checkWebPSupport()) {
      setImageFormat('webp');
    } else {
      setImageFormat('jpeg');
    }
  }, []);

  const getOptimizedImageUrl = useCallback(
    (baseUrl: string, width?: number, height?: number) => {
      if (!isMobile) return baseUrl;

      // Add mobile-specific optimizations
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      params.set('format', imageFormat);
      params.set('quality', '80'); // Lower quality for mobile

      return `${baseUrl}?${params.toString()}`;
    },
    [isMobile, imageFormat]
  );

  return {
    getOptimizedImageUrl,
    preferredFormat: imageFormat,
    isMobile,
  };
};
