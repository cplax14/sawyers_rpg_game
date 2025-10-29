import { useRef, useEffect, useState } from 'react';

/**
 * Swipe Gestures Hook
 * Provides swipe gesture detection for mobile-friendly navigation
 */

export interface SwipeGestureConfig {
  /** Minimum distance in pixels to trigger swipe */
  minDistance?: number;
  /** Maximum duration in ms for a valid swipe */
  maxDuration?: number;
  /** Threshold for determining direction (prevents accidental triggers) */
  threshold?: number;
  /** Enable/disable specific directions */
  enabledDirections?: {
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
  };
}

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (e: TouchEvent) => void;
  onSwipeEnd?: (e: TouchEvent) => void;
}

export interface SwipeState {
  isActive: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  duration: number;
}

const defaultConfig: Required<SwipeGestureConfig> = {
  minDistance: 50,
  maxDuration: 500,
  threshold: 10,
  enabledDirections: {
    left: true,
    right: true,
    up: true,
    down: true,
  },
};

/**
 * Hook for detecting swipe gestures on touch devices
 */
export const useSwipeGestures = (handlers: SwipeHandlers, config: SwipeGestureConfig = {}) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    enabledDirections: { ...defaultConfig.enabledDirections, ...config.enabledDirections },
  };

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    direction: null,
    distance: 0,
    duration: 0,
  });

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchCurrent = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      setSwipeState(prev => ({
        ...prev,
        isActive: true,
        direction: null,
        distance: 0,
        duration: 0,
      }));

      handlers.onSwipeStart?.(e);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.touches[0];
    if (touch) {
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Determine direction based on dominant axis
      let direction: 'left' | 'right' | 'up' | 'down' | null = null;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > mergedConfig.threshold) {
          direction = deltaX > 0 ? 'right' : 'left';
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > mergedConfig.threshold) {
          direction = deltaY > 0 ? 'down' : 'up';
        }
      }

      setSwipeState(prev => ({
        ...prev,
        direction,
        distance,
        duration: Date.now() - touchStart.current!.time,
      }));
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current || !touchCurrent.current) return;

    const deltaX = touchCurrent.current.x - touchStart.current.x;
    const deltaY = touchCurrent.current.y - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - touchStart.current.time;

    // Check if swipe meets minimum requirements
    const isValidSwipe =
      distance >= mergedConfig.minDistance && duration <= mergedConfig.maxDuration;

    if (isValidSwipe) {
      // Determine direction
      let direction: 'left' | 'right' | 'up' | 'down';
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Trigger appropriate handler if direction is enabled
      const { enabledDirections } = mergedConfig;
      switch (direction) {
        case 'left':
          if (enabledDirections.left) handlers.onSwipeLeft?.();
          break;
        case 'right':
          if (enabledDirections.right) handlers.onSwipeRight?.();
          break;
        case 'up':
          if (enabledDirections.up) handlers.onSwipeUp?.();
          break;
        case 'down':
          if (enabledDirections.down) handlers.onSwipeDown?.();
          break;
      }

      setSwipeState(prev => ({
        ...prev,
        direction,
        distance,
        duration,
      }));
    }

    // Reset state
    setTimeout(() => {
      setSwipeState(prev => ({
        ...prev,
        isActive: false,
        direction: null,
        distance: 0,
        duration: 0,
      }));
    }, 100);

    touchStart.current = null;
    touchCurrent.current = null;
    handlers.onSwipeEnd?.(e);
  };

  // Return object with touch event handlers for binding to elements
  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    swipeHandlers,
    swipeState,
  };
};

/**
 * Hook for binding swipe gestures to a specific element ref
 */
export const useElementSwipeGestures = <T extends HTMLElement>(
  elementRef: React.RefObject<T>,
  handlers: SwipeHandlers,
  config: SwipeGestureConfig = {}
) => {
  const { swipeHandlers, swipeState } = useSwipeGestures(handlers, config);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add passive event listeners for better performance
    const options = { passive: true };

    element.addEventListener('touchstart', swipeHandlers.onTouchStart, options);
    element.addEventListener('touchmove', swipeHandlers.onTouchMove, options);
    element.addEventListener('touchend', swipeHandlers.onTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', swipeHandlers.onTouchStart);
      element.removeEventListener('touchmove', swipeHandlers.onTouchMove);
      element.removeEventListener('touchend', swipeHandlers.onTouchEnd);
    };
  }, [elementRef, swipeHandlers]);

  return { swipeState };
};

/**
 * Hook for horizontal swipe navigation (common pattern)
 */
export const useHorizontalSwipeNavigation = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  config: Omit<SwipeGestureConfig, 'enabledDirections'> = {}
) => {
  return useSwipeGestures(
    {
      onSwipeLeft,
      onSwipeRight,
    },
    {
      ...config,
      enabledDirections: {
        left: true,
        right: true,
        up: false,
        down: false,
      },
    }
  );
};

/**
 * Hook for vertical swipe navigation
 */
export const useVerticalSwipeNavigation = (
  onSwipeUp: () => void,
  onSwipeDown: () => void,
  config: Omit<SwipeGestureConfig, 'enabledDirections'> = {}
) => {
  return useSwipeGestures(
    {
      onSwipeUp,
      onSwipeDown,
    },
    {
      ...config,
      enabledDirections: {
        left: false,
        right: false,
        up: true,
        down: true,
      },
    }
  );
};
