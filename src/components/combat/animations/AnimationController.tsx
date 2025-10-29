/**
 * Animation Controller
 *
 * Smart component selector and lifecycle manager for combat animations.
 * Handles animation selection, sequencing, queueing, and lifecycle management.
 *
 * Tasks 4.4-4.8: AnimationController Implementation
 * Tasks 5.1-5.5: Error Handling & Validation
 * Task 5.9: Performance Instrumentation
 */

import React, { useState, useEffect, useCallback, useRef, Component, ErrorInfo } from 'react';
import {
  getAnimationMetadata,
  DEFAULT_ANIMATION,
  type AnimationMetadata,
} from './animationRegistry';
import { getEnemyAnimationMetadata, type EnemyAnimationMetadata } from './enemyAnimationRegistry';
import type { AnimationComponentProps } from './animationRegistry';
import { DamageNumber } from './DamageNumber';
import { MissIndicator } from './MissIndicator';

// ================================================================
// PERFORMANCE INSTRUMENTATION
// Task 5.9: Measure component render times and animation performance
// ================================================================

/**
 * Performance measurement utility for development mode
 * Measures execution time and warns if it exceeds thresholds
 */
const measurePerformance = (name: string, callback: () => void): void => {
  if (process.env.NODE_ENV !== 'production') {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;

    try {
      performance.mark(startMark);
      callback();
      performance.mark(endMark);

      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];

      if (measure.duration > 5) {
        console.warn(
          `⚠️ [Performance] ${name} took ${measure.duration.toFixed(2)}ms (target: <5ms)`
        );
      } else if (measure.duration > 2) {
        console.log(
          `📊 [Performance] ${name} took ${measure.duration.toFixed(2)}ms (within target)`
        );
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch (e) {
      // Silently fail if performance API not available
      callback();
    }
  } else {
    callback();
  }
};

/**
 * Log animation phase timing for debugging
 * Tracks total animation duration from start to complete
 */
const logAnimationTiming = (
  attackType: string,
  phase: 'start' | 'complete',
  timestamp: number
): void => {
  if (process.env.NODE_ENV !== 'production') {
    const key = `animation-${attackType}`;

    if (phase === 'start') {
      // Store start time
      (window as any)[key] = timestamp;
      console.log(`🎬 [Animation Timing] ${attackType} started at ${timestamp}ms`);
    } else if (phase === 'complete') {
      // Calculate duration
      const startTime = (window as any)[key];
      if (startTime) {
        const duration = timestamp - startTime;
        console.log(`✅ [Animation Timing] ${attackType} completed in ${duration.toFixed(2)}ms`);

        // Warn if animation took unusually long
        if (duration > 2000) {
          console.warn(
            `⚠️ [Animation Timing] ${attackType} took longer than expected (${duration.toFixed(2)}ms > 2000ms)`
          );
        }

        delete (window as any)[key];
      }
    }
  }
};

// ================================================================
// ERROR BOUNDARY COMPONENT
// Task 5.1-5.3: Error boundaries to prevent animation crashes
// ================================================================

/**
 * Error boundary wrapper for animation components
 * Catches errors during animation rendering and gracefully degrades
 */
class AnimationErrorBoundary extends Component<
  {
    children: React.ReactNode;
    attackType: string;
    onError: (error: Error, attackType: string) => void;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { attackType, onError } = this.props;

    // Task 5.3: Development/Test - detailed error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error(`🚨 [AnimationController] Animation error for "${attackType}":`, error);
      console.error('Component stack:', errorInfo.componentStack);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    } else {
      // Task 5.2: Production - minimal warning
      console.warn(`⚠️ Animation failed for "${attackType}", continuing combat`);
    }

    // Notify parent to skip animation and continue
    onError(error, attackType);
  }

  render() {
    if (this.state.hasError) {
      // Don't render anything on error - skip directly to result
      return null;
    }
    return this.props.children;
  }
}

/**
 * Props for AnimationController
 * Task 4.4: Component structure and props interface
 */
interface AnimationControllerProps {
  /** Spell/attack ID to look up in registry */
  attackType: string;

  /** Position and context data for the animation */
  attackData: {
    casterX: number;
    casterY: number;
    targetX: number;
    targetY: number;
    damage?: number;
    isCritical?: boolean;
    element?: string;
    missed?: boolean;
    /** Enemy species ID (for enemy attacks) */
    enemySpecies?: string;
  };

  /** Callback when animation completes */
  onComplete: () => void;

  /** Whether animation should be playing */
  isActive: boolean;

  /** Animation type: 'spell' for player spells, 'enemy-attack' for enemy attacks */
  animationType?: 'spell' | 'enemy-attack';
}

/**
 * Queued animation item
 * Task 4.8: Animation queueing system
 */
interface QueuedAnimation {
  attackType: string;
  attackData: AnimationControllerProps['attackData'];
  onComplete: () => void;
  timestamp: number;
  animationType?: 'spell' | 'enemy-attack';
}

/**
 * Animation lifecycle states
 * Task 4.7: Lifecycle management
 */
type AnimationState = 'idle' | 'playing' | 'complete';

/**
 * Maximum number of animations to queue
 * Prevents memory buildup during rapid attack sequences
 * Task 4.8: Queue limit
 */
const MAX_QUEUE_SIZE = 5;

// ================================================================
// POSITION VALIDATION
// Task 5.5: Validate position data before rendering animations
// ================================================================

/**
 * Validate that position data is valid and renderable
 * Returns false if positions are NaN, undefined, or out of reasonable bounds
 */
const validatePositions = (
  attackData: AnimationControllerProps['attackData'],
  attackType: string
): boolean => {
  const { casterX, casterY, targetX, targetY } = attackData;

  // Check for NaN or undefined
  if (
    typeof casterX !== 'number' ||
    isNaN(casterX) ||
    typeof casterY !== 'number' ||
    isNaN(casterY) ||
    typeof targetX !== 'number' ||
    isNaN(targetX) ||
    typeof targetY !== 'number' ||
    isNaN(targetY)
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ [AnimationController] Invalid position data for "${attackType}":`, {
        casterX: casterX ?? 'undefined',
        casterY: casterY ?? 'undefined',
        targetX: targetX ?? 'undefined',
        targetY: targetY ?? 'undefined',
      });
    }
    return false;
  }

  // Optional: Check if positions are within reasonable bounds
  // Typical screen coordinates: 0-2000 for modern displays
  const MAX_COORDINATE = 10000; // Very generous upper bound
  const MIN_COORDINATE = -1000; // Allow some negative for off-screen effects

  if (
    casterX < MIN_COORDINATE ||
    casterX > MAX_COORDINATE ||
    casterY < MIN_COORDINATE ||
    casterY > MAX_COORDINATE ||
    targetX < MIN_COORDINATE ||
    targetX > MAX_COORDINATE ||
    targetY < MIN_COORDINATE ||
    targetY > MAX_COORDINATE
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ [AnimationController] Position out of bounds for "${attackType}":`, {
        casterX,
        casterY,
        targetX,
        targetY,
        bounds: { min: MIN_COORDINATE, max: MAX_COORDINATE },
      });
    }
    return false;
  }

  return true;
};

/**
 * AnimationController Component
 *
 * Responsibilities:
 * - Look up animation components from registry (Task 4.5)
 * - Fallback to default animation for unmapped attacks (Task 4.6)
 * - Manage animation lifecycle (Task 4.7)
 * - Queue animations during rapid sequences (Task 4.8)
 * - Notify combat system when complete (Task 4.7)
 */
export const AnimationController: React.FC<AnimationControllerProps> = ({
  attackType,
  attackData,
  onComplete,
  isActive,
  animationType = 'spell', // Default to spell for backward compatibility
}) => {
  // ================================================================
  // STATE MANAGEMENT
  // ================================================================

  // Current animation state (Task 4.7)
  const [animationState, setAnimationState] = useState<AnimationState>('idle');

  // Queue for pending animations (Task 4.8)
  const [animationQueue, setAnimationQueue] = useState<QueuedAnimation[]>([]);

  // Current animation being played
  const [currentAnimation, setCurrentAnimation] = useState<{
    type: string;
    data: AnimationControllerProps['attackData'];
    metadata: AnimationMetadata | EnemyAnimationMetadata;
    animationType: 'spell' | 'enemy-attack';
  } | null>(null);

  // Track if we've logged a warning for this attack type (prevent spam)
  const warnedTypesRef = useRef<Set<string>>(new Set());

  // Task 5.5: Check if positions are valid
  const positionsValid = useRef<boolean>(true);

  // Damage number display state
  const [showDamageNumber, setShowDamageNumber] = useState<boolean>(false);
  const damageNumberTimerRef = useRef<NodeJS.Timeout | null>(null);
  const impactTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Miss indicator display state
  const [showMissIndicator, setShowMissIndicator] = useState<boolean>(false);
  const missIndicatorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ================================================================
  // ERROR HANDLING
  // Task 5.1-5.2: Handle animation errors gracefully
  // ================================================================

  /**
   * Handle errors from the error boundary
   * Skip animation and immediately call onComplete to continue combat
   */
  const handleAnimationError = useCallback(
    (_error: Error, failedAttackType: string) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `🚨 [AnimationController] Animation failed for "${failedAttackType}", skipping to result`
        );
      }

      // Clear the failed animation
      setCurrentAnimation(null);
      setAnimationState('idle');

      // Immediately call onComplete to continue combat flow
      onComplete();

      // Process next queued animation if any
      setAnimationQueue(prevQueue => {
        if (prevQueue.length > 0) {
          const [nextAnimation, ...remainingQueue] = prevQueue;

          if (process.env.NODE_ENV !== 'production') {
            console.log(
              `🎬 [AnimationController] Processing queued animation after error: ${nextAnimation.attackType}`
            );
          }

          // Validate positions before starting next animation
          if (validatePositions(nextAnimation.attackData, nextAnimation.attackType)) {
            const metadata = getAnimationWithFallback(
              nextAnimation.attackType,
              nextAnimation.animationType || 'spell',
              nextAnimation.attackData.enemySpecies
            );
            setCurrentAnimation({
              type: nextAnimation.attackType,
              data: nextAnimation.attackData,
              metadata,
              animationType: nextAnimation.animationType || 'spell',
            });
            setAnimationState('playing');
          } else {
            // Invalid positions in queue - skip this one too
            nextAnimation.onComplete();
          }

          return remainingQueue;
        }
        return [];
      });
    },
    [onComplete]
  );

  // ================================================================
  // ANIMATION SELECTION LOGIC
  // Task 4.5: Look up and render appropriate component
  // Task 4.6: Fallback handling
  // ================================================================

  /**
   * Get animation metadata with fallback
   * Returns the animation component and metadata for the given attack type
   * Supports both player spells and enemy attacks
   */
  const getAnimationWithFallback = useCallback(
    (
      type: string,
      animType: 'spell' | 'enemy-attack',
      enemySpecies?: string
    ): AnimationMetadata | EnemyAnimationMetadata => {
      if (animType === 'enemy-attack' && enemySpecies) {
        // Enemy attack - use enemy animation registry
        const enemyMetadata = getEnemyAnimationMetadata(enemySpecies);

        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `🎬 [AnimationController] Enemy animation selected: ${enemySpecies} →`,
            enemyMetadata.description || 'no description'
          );
        }

        return enemyMetadata;
      }

      // Player spell - use spell animation registry
      const metadata = getAnimationMetadata(type);

      if (metadata) {
        return metadata;
      }

      // Task 4.6: Log warning in development when using fallback
      if (process.env.NODE_ENV !== 'production' && !warnedTypesRef.current.has(type)) {
        console.warn(
          `⚠️ [AnimationController] No animation found for attack type: "${type}". Using fallback (Magic Bolt).`
        );
        warnedTypesRef.current.add(type);
      }

      return DEFAULT_ANIMATION;
    },
    []
  );

  // ================================================================
  // LIFECYCLE MANAGEMENT
  // Task 4.7: Animation lifecycle (start → play → complete → notify)
  // ================================================================

  /**
   * Handle animation completion
   * Calls the onComplete callback and processes queue if needed
   *
   * The damage number is handled separately in its own useEffect that triggers
   * during the impact phase. Here we just wait for the damage number to finish
   * (if it's showing) before proceeding to the next step.
   */
  const handleAnimationComplete = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `✅ [AnimationController] Animation complete: ${currentAnimation?.type || 'unknown'}`
      );
    }

    // Task 5.9: Log animation completion time
    if (currentAnimation) {
      logAnimationTiming(currentAnimation.type, 'complete', performance.now());
    }

    // Brief delay before calling onComplete callback
    // Note: The parent (Combat.tsx) is responsible for keeping this component mounted
    // long enough for the full damage number animation (1250ms) to complete
    const DAMAGE_NUMBER_COMPLETION_DELAY = showDamageNumber ? 300 : 50;

    // Update state to complete
    setAnimationState('complete');

    // Notify combat system after brief delay (longer if damage number is showing)
    setTimeout(() => {
      onComplete();
    }, DAMAGE_NUMBER_COMPLETION_DELAY);

    // Clear current animation
    setCurrentAnimation(null);

    // Task 4.8: Process queue after completion
    setAnimationQueue(prevQueue => {
      if (prevQueue.length > 0) {
        const [nextAnimation, ...remainingQueue] = prevQueue;

        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `🎬 [AnimationController] Processing queued animation: ${nextAnimation.attackType} (${remainingQueue.length} remaining)`
          );
        }

        // Start the next queued animation after damage number completes
        setTimeout(() => {
          const metadata = getAnimationWithFallback(
            nextAnimation.attackType,
            nextAnimation.animationType || 'spell',
            nextAnimation.attackData.enemySpecies
          );
          setCurrentAnimation({
            type: nextAnimation.attackType,
            data: nextAnimation.attackData,
            metadata,
            animationType: nextAnimation.animationType || 'spell',
          });
          setAnimationState('playing');
        }, DAMAGE_NUMBER_COMPLETION_DELAY);

        return remainingQueue;
      }

      // No more queued animations
      setAnimationState('idle');
      return [];
    });
  }, [currentAnimation, showDamageNumber, onComplete, getAnimationWithFallback]);

  // ================================================================
  // DAMAGE NUMBER TIMING
  // Trigger damage numbers during impact phase (not after animation ends)
  // ================================================================

  /**
   * Effect to show damage numbers during the impact phase of the animation
   *
   * Typical spell structure:
   * - Charge phase: 700-800ms
   * - Cast phase: 150ms
   * - Travel phase: 300ms
   * - Impact: ~1150-1250ms from start
   *
   * We schedule the damage number to appear at impact time (1150ms),
   * stay visible for 1 full second, then hide it before cleaning up.
   */
  useEffect(() => {
    // Only trigger for animations with damage
    if (
      currentAnimation &&
      currentAnimation.data.damage &&
      currentAnimation.data.damage > 0 &&
      animationState === 'playing'
    ) {
      const IMPACT_TIME = 1150; // When impact phase starts (ms)
      const DAMAGE_NUMBER_DURATION = 1250; // How long damage number is visible (ms)

      if (process.env.NODE_ENV !== 'production') {
        console.log(`💥 [Damage Number] Scheduling damage number for ${currentAnimation.type}:`, {
          damage: currentAnimation.data.damage,
          isCritical: currentAnimation.data.isCritical,
          impactTime: `${IMPACT_TIME}ms`,
          duration: `${DAMAGE_NUMBER_DURATION}ms`,
          position: { x: currentAnimation.data.targetX, y: currentAnimation.data.targetY },
        });
      }

      // Schedule damage number to appear at impact time
      impactTimerRef.current = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`✨ [Damage Number] Displaying damage: ${currentAnimation.data.damage}`);
        }
        setShowDamageNumber(true);

        // Hide damage number after its full duration
        damageNumberTimerRef.current = setTimeout(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🔚 [Damage Number] Hiding damage number`);
          }
          setShowDamageNumber(false);
        }, DAMAGE_NUMBER_DURATION);
      }, IMPACT_TIME);
    }

    // Cleanup timers if animation changes or unmounts
    return () => {
      if (impactTimerRef.current) {
        clearTimeout(impactTimerRef.current);
        impactTimerRef.current = null;
      }
      if (damageNumberTimerRef.current) {
        clearTimeout(damageNumberTimerRef.current);
        damageNumberTimerRef.current = null;
      }
    };
  }, [currentAnimation, animationState]);

  // ================================================================
  // MISS INDICATOR TIMING
  // Trigger miss indicator during impact phase when attack misses
  // ================================================================

  /**
   * Effect to show miss indicator during the impact phase when attack misses
   *
   * Same timing as damage numbers - appears at impact time (1150ms),
   * stays visible for ~850ms, then swipes away diagonally.
   */
  useEffect(() => {
    // Only trigger for animations that missed
    if (currentAnimation && currentAnimation.data.missed && animationState === 'playing') {
      const IMPACT_TIME = 1150; // When impact phase starts (ms)
      const MISS_INDICATOR_DURATION = 1200; // How long miss indicator is visible (ms)

      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ [Miss Indicator] Scheduling miss indicator for ${currentAnimation.type}:`, {
          impactTime: `${IMPACT_TIME}ms`,
          duration: `${MISS_INDICATOR_DURATION}ms`,
          position: { x: currentAnimation.data.targetX, y: currentAnimation.data.targetY },
        });
      }

      // Schedule miss indicator to appear at impact time
      missIndicatorTimerRef.current = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`✨ [Miss Indicator] Displaying MISS indicator`);
        }
        setShowMissIndicator(true);

        // Miss indicator handles its own duration internally
        // Just reset state after it completes
        setTimeout(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🔚 [Miss Indicator] Hiding miss indicator`);
          }
          setShowMissIndicator(false);
        }, MISS_INDICATOR_DURATION);
      }, IMPACT_TIME);
    }

    // Cleanup timer if animation changes or unmounts
    return () => {
      if (missIndicatorTimerRef.current) {
        clearTimeout(missIndicatorTimerRef.current);
        missIndicatorTimerRef.current = null;
      }
    };
  }, [currentAnimation, animationState]);

  // ================================================================
  // ANIMATION TRIGGERING & QUEUEING
  // Task 4.8: Queue animations for rapid sequential attacks
  // ================================================================

  /**
   * Effect to handle new animation requests
   * Decides whether to play immediately or queue
   * Task 5.5: Validate positions before animating
   */
  useEffect(() => {
    if (!isActive) {
      // Not an active animation request
      return;
    }

    // Task 5.5: Validate positions first
    const isValid = validatePositions(attackData, attackType);
    positionsValid.current = isValid;

    if (!isValid) {
      // Invalid positions - skip animation and immediately show result
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `⚠️ [AnimationController] Skipping animation due to invalid positions: ${attackType}`
        );
      }
      onComplete();
      return;
    }

    // Check if an animation is currently playing
    if (animationState === 'playing') {
      // Task 4.8: Queue this animation if under limit
      if (animationQueue.length < MAX_QUEUE_SIZE) {
        setAnimationQueue(prevQueue => {
          // Check if this exact animation is already queued (prevent duplicates)
          const isDuplicate = prevQueue.some(
            queued =>
              queued.attackType === attackType &&
              queued.attackData.casterX === attackData.casterX &&
              queued.attackData.targetX === attackData.targetX
          );

          if (isDuplicate) {
            return prevQueue; // Don't queue duplicates
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log(
              `⏸️ [AnimationController] Queueing animation: ${attackType} (queue size: ${prevQueue.length + 1}/${MAX_QUEUE_SIZE})`
            );
          }

          return [
            ...prevQueue,
            {
              attackType,
              attackData,
              onComplete,
              timestamp: Date.now(),
              animationType,
            },
          ];
        });
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `⚠️ [AnimationController] Queue full (${MAX_QUEUE_SIZE}). Dropping animation: ${attackType}`
        );
      }

      return;
    }

    // No animation playing, start this one immediately
    if (animationState === 'idle' || animationState === 'complete') {
      const metadata = getAnimationWithFallback(attackType, animationType, attackData.enemySpecies);

      if (process.env.NODE_ENV !== 'production') {
        // Log different details based on animation type
        if (animationType === 'enemy-attack') {
          console.log(
            `🎬 [AnimationController] Starting enemy attack: ${attackData.enemySpecies || 'unknown'} (${attackType})`
          );
        } else {
          console.log(
            `🎬 [AnimationController] Starting spell: ${attackType} (element: ${(metadata as AnimationMetadata).element || 'unknown'}, type: ${(metadata as AnimationMetadata).type || 'unknown'})`
          );
        }
      }

      // Task 5.9: Log animation start time
      logAnimationTiming(attackType, 'start', performance.now());

      setCurrentAnimation({
        type: attackType,
        data: attackData,
        metadata,
        animationType,
      });
      setAnimationState('playing');
    }
  }, [
    isActive,
    attackType,
    attackData,
    onComplete,
    animationState,
    animationQueue,
    getAnimationWithFallback,
    animationType,
  ]);

  // ================================================================
  // CLEANUP
  // Task 4.7: Clean up resources when component unmounts
  // ================================================================

  useEffect(() => {
    return () => {
      // Clear queue on unmount to prevent memory leaks
      setAnimationQueue([]);
      setCurrentAnimation(null);

      // Clear damage number timers
      if (impactTimerRef.current) {
        clearTimeout(impactTimerRef.current);
        impactTimerRef.current = null;
      }
      if (damageNumberTimerRef.current) {
        clearTimeout(damageNumberTimerRef.current);
        damageNumberTimerRef.current = null;
      }

      // Clear miss indicator timer
      if (missIndicatorTimerRef.current) {
        clearTimeout(missIndicatorTimerRef.current);
        missIndicatorTimerRef.current = null;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('🧹 [AnimationController] Cleaned up on unmount');
      }
    };
  }, []);

  // ================================================================
  // RENDERING
  // Task 4.5: Render the selected animation component
  // Task 5.1: Wrap with error boundary for crash prevention
  // ================================================================

  // Don't render anything if no current animation
  if (!currentAnimation || animationState === 'idle') {
    return null;
  }

  // Task 5.5: Skip rendering if positions were invalid
  if (!positionsValid.current) {
    return null;
  }

  // Get the component from metadata
  const AnimationComponent = currentAnimation.metadata.component;

  // Build props for the animation component
  // For enemy animations, merge custom props from registry with animation data
  const baseProps: AnimationComponentProps = {
    casterX: currentAnimation.data.casterX,
    casterY: currentAnimation.data.casterY,
    targetX: currentAnimation.data.targetX,
    targetY: currentAnimation.data.targetY,
    onComplete: handleAnimationComplete,

    // Critical hit and damage data for visual customization
    isCritical: currentAnimation.data.isCritical,
    damage: currentAnimation.data.damage,
    element: currentAnimation.data.element,
  };

  // Merge custom props for enemy animations (variant, colors, etc.)
  const customProps = (currentAnimation.metadata as EnemyAnimationMetadata).props || {};
  const animationProps = { ...baseProps, ...customProps } as AnimationComponentProps;

  // Render the animation wrapped in error boundary
  // Task 5.1-5.3: Error boundary prevents crashes and provides graceful degradation
  return (
    <AnimationErrorBoundary attackType={currentAnimation.type} onError={handleAnimationError}>
      <div
        className='animation-controller'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none', // Don't interfere with UI interactions
          zIndex: 100, // Ensure animations appear above combat UI
        }}
      >
        {/* Main spell animation */}
        <AnimationComponent {...animationProps} />

        {/* Damage number overlay - appears during/after impact */}
        {showDamageNumber && currentAnimation.data.damage && (
          <DamageNumber
            damage={currentAnimation.data.damage}
            targetX={currentAnimation.data.targetX}
            targetY={currentAnimation.data.targetY}
            isCritical={currentAnimation.data.isCritical}
            onComplete={() => {
              // Damage number animation completed
              // (handled by timer in handleAnimationComplete)
            }}
          />
        )}

        {/* Miss indicator overlay - appears during/after impact when attack misses */}
        {showMissIndicator && currentAnimation.data.missed && (
          <MissIndicator
            targetX={currentAnimation.data.targetX}
            targetY={currentAnimation.data.targetY}
            onComplete={() => {
              // Miss indicator animation completed
              // (handled by timer in effect)
            }}
          />
        )}
      </div>
    </AnimationErrorBoundary>
  );
};

export default AnimationController;
