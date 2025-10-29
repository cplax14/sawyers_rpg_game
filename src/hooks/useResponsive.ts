import { useState, useEffect } from 'react';

/**
 * Responsive Breakpoints Hook
 * Provides reactive breakpoint detection and utilities for responsive components
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface BreakpointValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isTouchDevice: boolean;
  pixelRatio: number;
}

const breakpointValues: BreakpointValues = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1200,
  xxl: 1440,
};

/**
 * Get current breakpoint based on screen width
 */
const getCurrentBreakpoint = (width: number): Breakpoint => {
  if (width >= breakpointValues.xxl) return 'xxl';
  if (width >= breakpointValues.xl) return 'xl';
  if (width >= breakpointValues.lg) return 'lg';
  if (width >= breakpointValues.md) return 'md';
  if (width >= breakpointValues.sm) return 'sm';
  return 'xs';
};

/**
 * Check if device has touch capability
 */
const getIsTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy support
    (window.DocumentTouch && document instanceof window.DocumentTouch)
  );
};

/**
 * Get initial responsive state
 */
const getInitialState = (): ResponsiveState => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      width: 0,
      height: 0,
      breakpoint: 'md',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLandscape: false,
      isPortrait: true,
      isTouchDevice: false,
      pixelRatio: 1,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getCurrentBreakpoint(width);

  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl',
    isLandscape: width > height,
    isPortrait: height >= width,
    isTouchDevice: getIsTouchDevice(),
    pixelRatio: window.devicePixelRatio || 1,
  };
};

/**
 * Main responsive hook
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(getInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getCurrentBreakpoint(width);

      setState({
        width,
        height,
        breakpoint,
        isMobile: breakpoint === 'xs' || breakpoint === 'sm',
        isTablet: breakpoint === 'md',
        isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl',
        isLandscape: width > height,
        isPortrait: height >= width,
        isTouchDevice: getIsTouchDevice(),
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    // Update on resize with debouncing
    let timeoutId: number;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(updateState, 150);
    };

    // Update on orientation change
    const handleOrientationChange = () => {
      // Small delay to allow for orientation change to complete
      setTimeout(updateState, 100);
    };

    // Initial state update
    updateState();

    // Event listeners
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
};

/**
 * Hook to check if current breakpoint matches given breakpoint(s)
 */
export const useBreakpoint = (breakpoints: Breakpoint | Breakpoint[]): boolean => {
  const { breakpoint } = useResponsive();

  if (Array.isArray(breakpoints)) {
    return breakpoints.includes(breakpoint);
  }

  return breakpoint === breakpoints;
};

/**
 * Hook to get responsive values based on current breakpoint
 */
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
  const { breakpoint } = useResponsive();

  // Try exact match first
  if (values[breakpoint] !== undefined) {
    return values[breakpoint]!;
  }

  // Find the largest breakpoint that's smaller than current
  const orderedBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = orderedBreakpoints.indexOf(breakpoint);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const bp = orderedBreakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return fallback;
};

/**
 * Hook to get media query-style responsive values
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

/**
 * Common media query hooks
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsTouchDevice = () => {
  const { isTouchDevice } = useResponsive();
  return isTouchDevice;
};

/**
 * Hook for orientation detection
 */
export const useOrientation = () => {
  const { isLandscape, isPortrait } = useResponsive();
  return { isLandscape, isPortrait };
};

/**
 * Export breakpoint values for use in calculations
 */
export { breakpointValues };
