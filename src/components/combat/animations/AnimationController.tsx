/**
 * Animation Controller
 *
 * Smart component selector and lifecycle manager for combat animations.
 * Handles animation selection, sequencing, queueing, and lifecycle management.
 *
 * Tasks 4.4-4.8: AnimationController Implementation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAnimationMetadata, DEFAULT_ANIMATION, type AnimationMetadata } from './animationRegistry';
import type { AnimationComponentProps } from './animationRegistry';

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
  };

  /** Callback when animation completes */
  onComplete: () => void;

  /** Whether animation should be playing */
  isActive: boolean;
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
  isActive
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
    metadata: AnimationMetadata;
  } | null>(null);

  // Track if we've logged a warning for this attack type (prevent spam)
  const warnedTypesRef = useRef<Set<string>>(new Set());

  // ================================================================
  // ANIMATION SELECTION LOGIC
  // Task 4.5: Look up and render appropriate component
  // Task 4.6: Fallback handling
  // ================================================================

  /**
   * Get animation metadata with fallback
   * Returns the animation component and metadata for the given attack type
   */
  const getAnimationWithFallback = useCallback((type: string): AnimationMetadata => {
    const metadata = getAnimationMetadata(type);

    if (metadata) {
      return metadata;
    }

    // Task 4.6: Log warning in development when using fallback
    if (process.env.NODE_ENV === 'development' && !warnedTypesRef.current.has(type)) {
      console.warn(
        `⚠️ [AnimationController] No animation found for attack type: "${type}". Using fallback (Magic Bolt).`
      );
      warnedTypesRef.current.add(type);
    }

    return DEFAULT_ANIMATION;
  }, []);

  // ================================================================
  // LIFECYCLE MANAGEMENT
  // Task 4.7: Animation lifecycle (start → play → complete → notify)
  // ================================================================

  /**
   * Handle animation completion
   * Calls the onComplete callback and processes queue if needed
   */
  const handleAnimationComplete = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [AnimationController] Animation complete: ${currentAnimation?.type || 'unknown'}`);
    }

    // Update state to complete
    setAnimationState('complete');

    // Notify combat system
    if (currentAnimation) {
      // Use a slight delay to ensure animation visuals complete before callback
      setTimeout(() => {
        onComplete();
      }, 50);
    }

    // Clear current animation
    setCurrentAnimation(null);

    // Task 4.8: Process queue after completion
    setAnimationQueue(prevQueue => {
      if (prevQueue.length > 0) {
        const [nextAnimation, ...remainingQueue] = prevQueue;

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🎬 [AnimationController] Processing queued animation: ${nextAnimation.attackType} (${remainingQueue.length} remaining)`
          );
        }

        // Start the next queued animation
        const metadata = getAnimationWithFallback(nextAnimation.attackType);
        setCurrentAnimation({
          type: nextAnimation.attackType,
          data: nextAnimation.attackData,
          metadata
        });
        setAnimationState('playing');

        return remainingQueue;
      }

      // No more queued animations
      setAnimationState('idle');
      return [];
    });
  }, [currentAnimation, onComplete, getAnimationWithFallback]);

  // ================================================================
  // ANIMATION TRIGGERING & QUEUEING
  // Task 4.8: Queue animations for rapid sequential attacks
  // ================================================================

  /**
   * Effect to handle new animation requests
   * Decides whether to play immediately or queue
   */
  useEffect(() => {
    if (!isActive) {
      // Not an active animation request
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

          if (process.env.NODE_ENV === 'development') {
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
              timestamp: Date.now()
            }
          ];
        });
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ [AnimationController] Queue full (${MAX_QUEUE_SIZE}). Dropping animation: ${attackType}`
        );
      }

      return;
    }

    // No animation playing, start this one immediately
    if (animationState === 'idle' || animationState === 'complete') {
      const metadata = getAnimationWithFallback(attackType);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `🎬 [AnimationController] Starting animation: ${attackType} (element: ${metadata.element}, type: ${metadata.type})`
        );
      }

      setCurrentAnimation({
        type: attackType,
        data: attackData,
        metadata
      });
      setAnimationState('playing');
    }
  }, [isActive, attackType, attackData, onComplete, animationState, animationQueue, getAnimationWithFallback]);

  // ================================================================
  // CLEANUP
  // Task 4.7: Clean up resources when component unmounts
  // ================================================================

  useEffect(() => {
    return () => {
      // Clear queue on unmount to prevent memory leaks
      setAnimationQueue([]);
      setCurrentAnimation(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [AnimationController] Cleaned up on unmount');
      }
    };
  }, []);

  // ================================================================
  // RENDERING
  // Task 4.5: Render the selected animation component
  // ================================================================

  // Don't render anything if no current animation
  if (!currentAnimation || animationState === 'idle') {
    return null;
  }

  // Get the component from metadata
  const AnimationComponent = currentAnimation.metadata.component;

  // Build props for the animation component
  const animationProps: AnimationComponentProps = {
    casterX: currentAnimation.data.casterX,
    casterY: currentAnimation.data.casterY,
    targetX: currentAnimation.data.targetX,
    targetY: currentAnimation.data.targetY,
    onComplete: handleAnimationComplete
  };

  // Render the animation
  return (
    <div
      className="animation-controller"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none', // Don't interfere with UI interactions
        zIndex: 100 // Ensure animations appear above combat UI
      }}
    >
      <AnimationComponent {...animationProps} />
    </div>
  );
};

export default AnimationController;
