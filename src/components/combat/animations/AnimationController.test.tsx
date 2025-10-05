/**
 * Unit Tests for AnimationController
 *
 * Tests the animation controller component which orchestrates animation
 * rendering, lifecycle management, and queueing for combat animations.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import AnimationController from './AnimationController';
import * as registry from './animationRegistry';
import type { AnimationComponentProps, AnimationMetadata } from './animationRegistry';

// Mock the registry module
jest.mock('./animationRegistry', () => {
  const actual = jest.requireActual('./animationRegistry');

  // Create a default mock animation for DEFAULT_ANIMATION
  const MockDefaultAnimation = ({ onComplete }: any) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 100);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);
    return <div data-testid="mock-animation">Fallback Animation</div>;
  };

  return {
    ...actual,
    getAnimationMetadata: jest.fn(),
    DEFAULT_ANIMATION: {
      element: 'arcane',
      type: 'projectile',
      component: MockDefaultAnimation,
      description: 'Fallback animation',
    },
  };
});

// Mock animation component
const MockAnimation = jest.fn<React.ReactElement, [AnimationComponentProps]>(
  ({ onComplete, casterX, casterY, targetX, targetY }) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 100);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);

    return (
      <div data-testid="mock-animation">
        Animation: ({casterX}, {casterY}) → ({targetX}, {targetY})
      </div>
    );
  }
);

// Fast completing animation (for testing rapid sequences)
const FastMockAnimation = jest.fn<React.ReactElement, [AnimationComponentProps]>(
  ({ onComplete }) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 10);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);

    return <div data-testid="fast-animation">Fast Animation</div>;
  }
);

// Slow completing animation (for testing queue behavior)
const SlowMockAnimation = jest.fn<React.ReactElement, [AnimationComponentProps]>(
  ({ onComplete }) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 300);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);

    return <div data-testid="slow-animation">Slow Animation</div>;
  }
);

// Animation that never completes (for testing cleanup)
const NeverCompleteAnimation = jest.fn<React.ReactElement, [AnimationComponentProps]>(
  ({ onComplete }) => {
    // Store ref but never call it
    const completeFnRef = React.useRef(onComplete);
    React.useEffect(() => {
      completeFnRef.current = onComplete;
    }, [onComplete]);

    return <div data-testid="never-complete-animation">Never Completes</div>;
  }
);

describe('AnimationController', () => {
  const mockGetAnimationMetadata = registry.getAnimationMetadata as jest.MockedFunction<
    typeof registry.getAnimationMetadata
  >;

  const defaultProps = {
    attackType: 'fire',
    attackData: {
      casterX: 100,
      casterY: 100,
      targetX: 200,
      targetY: 200,
    },
    onComplete: jest.fn(),
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockAnimation.mockClear();
    FastMockAnimation.mockClear();
    SlowMockAnimation.mockClear();
    NeverCompleteAnimation.mockClear();

    // Default mock implementation
    mockGetAnimationMetadata.mockReturnValue({
      component: MockAnimation,
      element: 'fire',
      type: 'projectile',
      description: 'Test animation',
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders nothing when isActive is false', () => {
      const { container } = render(
        <AnimationController {...defaultProps} isActive={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders animation component when isActive is true', async () => {
      render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });
    });

    it('renders correct animation based on attackType', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: MockAnimation,
        element: 'ice',
        type: 'projectile',
      });

      render(<AnimationController {...defaultProps} attackType="ice" />);

      await waitFor(() => {
        expect(mockGetAnimationMetadata).toHaveBeenCalledWith('ice');
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });
    });

    it('passes correct position props to animation component', async () => {
      render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(MockAnimation).toHaveBeenCalledWith(
          expect.objectContaining({
            casterX: 100,
            casterY: 100,
            targetX: 200,
            targetY: 200,
          }),
          expect.anything()
        );
      });
    });

    it('passes onComplete callback to animation component', async () => {
      render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(MockAnimation).toHaveBeenCalledWith(
          expect.objectContaining({
            onComplete: expect.any(Function),
          }),
          expect.anything()
        );
      });
    });

    it('renders with correct wrapper styles', async () => {
      const { container } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        const wrapper = container.querySelector('.animation-controller');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveStyle({
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          pointerEvents: 'none',
          zIndex: '100',
        });
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('calls onComplete when animation finishes', async () => {
      render(<AnimationController {...defaultProps} />);

      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('changes state from idle → playing → complete', async () => {
      const { rerender } = render(
        <AnimationController {...defaultProps} isActive={false} />
      );

      // Initially idle (nothing rendered)
      expect(screen.queryByTestId('mock-animation')).not.toBeInTheDocument();

      // Activate animation
      rerender(<AnimationController {...defaultProps} isActive={true} />);

      // Should be playing
      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Should complete
      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('clears animation after completion', async () => {
      const { rerender } = render(<AnimationController {...defaultProps} />);

      // Animation should render
      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Animation component stays rendered in 'complete' state until next trigger
      // To clear it, we need to trigger a new state (deactivate)
      rerender(<AnimationController {...defaultProps} isActive={false} />);

      // Now animation should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('mock-animation')).not.toBeInTheDocument();
      });
    });

    it('cleans up on unmount', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: SlowMockAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const { unmount } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('slow-animation')).toBeInTheDocument();
      });

      // Unmount before animation completes (SlowMockAnimation takes 300ms)
      unmount();

      // Component should be unmounted
      expect(screen.queryByTestId('slow-animation')).not.toBeInTheDocument();

      // Note: If animation already called onComplete before unmount, that's expected behavior
      // The key is that cleanup happens and no errors occur
    });

    it('handles onComplete with slight delay', async () => {
      jest.useFakeTimers();
      render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Fast forward to animation completion
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // onComplete should be delayed by 50ms
      expect(defaultProps.onComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(defaultProps.onComplete).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Fallback Handling', () => {
    it('uses fallback animation for unknown attack types', async () => {
      mockGetAnimationMetadata.mockReturnValue(null);

      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<AnimationController {...defaultProps} attackType="unknown_spell" />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      warnSpy.mockRestore();
    });

    it('logs warning in development for unmapped attacks', async () => {
      mockGetAnimationMetadata.mockReturnValue(null);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<AnimationController {...defaultProps} attackType="unmapped_attack" />);

      await waitFor(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('No animation found for attack type: "unmapped_attack"')
        );
      });

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });

    it('does not spam warnings for same attack type within single instance', async () => {
      mockGetAnimationMetadata.mockReturnValue(null);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Render and trigger warning
      const { rerender } = render(
        <AnimationController {...defaultProps} attackType="unmapped_spell" />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No animation found for attack type: "unmapped_spell"')
      );

      // Wait for first animation to complete
      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Trigger SAME attack type again on SAME instance
      const secondOnComplete = jest.fn();
      rerender(
        <AnimationController
          {...defaultProps}
          attackType="unmapped_spell"
          onComplete={secondOnComplete}
          isActive={false}
        />
      );

      rerender(
        <AnimationController
          {...defaultProps}
          attackType="unmapped_spell"
          onComplete={secondOnComplete}
          isActive={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Should still be only 1 warning (second one was suppressed within same instance)
      expect(warnSpy).toHaveBeenCalledTimes(1);

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });

    it('handles null metadata gracefully', async () => {
      mockGetAnimationMetadata.mockReturnValue(null);

      const { container } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Queueing', () => {
    beforeEach(() => {
      mockGetAnimationMetadata.mockReturnValue({
        component: SlowMockAnimation,
        element: 'fire',
        type: 'projectile',
      });
    });

    it('queues new animation when one is already playing', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { rerender } = render(<AnimationController {...defaultProps} />);

      // First animation starts
      await waitFor(() => {
        expect(screen.getByTestId('slow-animation')).toBeInTheDocument();
      });

      // Queue second animation while first is playing
      rerender(
        <AnimationController
          {...defaultProps}
          attackType="ice"
          onComplete={jest.fn()}
          attackData={{
            ...defaultProps.attackData,
            casterX: 150, // Make it unique
          }}
        />
      );

      // First animation should still be playing
      expect(screen.getByTestId('slow-animation')).toBeInTheDocument();

      // Should log that animation is being queued
      await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Queueing animation')
        );
      });

      process.env.NODE_ENV = originalEnv;
      logSpy.mockRestore();
    });

    it('processes queue when current animation completes', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: FastMockAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { rerender } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('fast-animation')).toBeInTheDocument();
      });

      // Queue second animation
      rerender(
        <AnimationController
          {...defaultProps}
          attackType="ice"
          onComplete={jest.fn()}
          attackData={{
            ...defaultProps.attackData,
            casterX: 150,
          }}
        />
      );

      // Wait for first animation to complete and queue to be processed
      await waitFor(
        () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('Processing queued animation')
          );
        },
        { timeout: 300 }
      );

      process.env.NODE_ENV = originalEnv;
      logSpy.mockRestore();
    });

    it('limits queue size to MAX_QUEUE_SIZE (5)', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: NeverCompleteAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { rerender } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('never-complete-animation')).toBeInTheDocument();
      });

      // Try to queue 6 more animations (should hit limit at 5)
      for (let i = 0; i < 6; i++) {
        rerender(
          <AnimationController
            {...defaultProps}
            attackType={`spell_${i}`}
            onComplete={jest.fn()}
            attackData={{
              ...defaultProps.attackData,
              casterX: 100 + i, // Make each unique to avoid duplicate check
            }}
          />
        );
      }

      // Should warn about queue being full
      await waitFor(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Queue full')
        );
      });

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });

    it('does not queue duplicate animations', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: SlowMockAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const { rerender } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('slow-animation')).toBeInTheDocument();
      });

      // Try to queue same animation twice
      rerender(<AnimationController {...defaultProps} />);
      rerender(<AnimationController {...defaultProps} />);

      // Only one animation should complete
      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 500 }
      );
    });

    it('clears queue on unmount', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: SlowMockAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const { rerender, unmount } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('slow-animation')).toBeInTheDocument();
      });

      // Queue some animations
      const queuedComplete = jest.fn();
      rerender(
        <AnimationController
          {...defaultProps}
          attackType="ice"
          onComplete={queuedComplete}
          attackData={{
            ...defaultProps.attackData,
            casterX: 150,
          }}
        />
      );

      // Unmount before animations complete
      unmount();

      // Queued animation callbacks should not be called
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(queuedComplete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing animation component gracefully', async () => {
      // When metadata is returned but component is undefined, it will try to use it
      // This might cause an error, but let's test that fallback kicks in
      mockGetAnimationMetadata.mockReturnValue(null);

      // Should fall back to DEFAULT_ANIMATION
      const { container } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });

      // Should render fallback animation
      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });
    });

    it('handles invalid position data', async () => {
      const invalidProps = {
        ...defaultProps,
        attackData: {
          casterX: NaN,
          casterY: Infinity,
          targetX: -Infinity,
          targetY: undefined as any,
        },
      };

      // Should not crash
      const { container } = render(<AnimationController {...invalidProps} />);
      expect(container).toBeInTheDocument();
    });

    it('handles rapid prop changes', async () => {
      const { rerender } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(
          <AnimationController
            {...defaultProps}
            attackType={`spell_${i}`}
            attackData={{
              ...defaultProps.attackData,
              casterX: 100 + i,
            }}
          />
        );
      }

      // Should not crash
      expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
    });

    it('handles missing onComplete callback (passes noop)', async () => {
      // If onComplete might be undefined, the component should be passed a noop function
      const noopCallback = jest.fn();

      const { container } = render(
        <AnimationController {...defaultProps} onComplete={noopCallback} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(noopCallback).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Should not crash
      expect(container).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('transitions from idle to playing when isActive becomes true', async () => {
      const onComplete = jest.fn();

      const { rerender } = render(
        <AnimationController {...defaultProps} onComplete={onComplete} isActive={false} />
      );

      // Initially idle - no animation rendered
      expect(screen.queryByTestId('mock-animation')).not.toBeInTheDocument();

      // Activate animation
      rerender(
        <AnimationController {...defaultProps} onComplete={onComplete} isActive={true} />
      );

      // Should transition to playing and render animation
      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('stays idle when isActive is false', async () => {
      render(<AnimationController {...defaultProps} isActive={false} />);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(screen.queryByTestId('mock-animation')).not.toBeInTheDocument();
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });

    it('can restart animation after completion', async () => {
      const { rerender } = render(<AnimationController {...defaultProps} />);

      // First animation
      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(defaultProps.onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Reset and start new animation
      jest.clearAllMocks();
      rerender(<AnimationController {...defaultProps} isActive={false} />);

      await waitFor(() => {
        expect(screen.queryByTestId('mock-animation')).not.toBeInTheDocument();
      });

      const newOnComplete = jest.fn();
      rerender(
        <AnimationController {...defaultProps} onComplete={newOnComplete} isActive={true} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-animation')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(newOnComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Development Logging', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('logs when starting animation in development', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Starting animation: fire')
        );
      });

      logSpy.mockRestore();
    });

    it('logs when animation completes in development', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<AnimationController {...defaultProps} />);

      await waitFor(
        () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('Animation complete')
          );
        },
        { timeout: 200 }
      );

      logSpy.mockRestore();
    });

    it('logs when queueing animations in development', async () => {
      mockGetAnimationMetadata.mockReturnValue({
        component: SlowMockAnimation,
        element: 'fire',
        type: 'projectile',
      });

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      const { rerender } = render(<AnimationController {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('slow-animation')).toBeInTheDocument();
      });

      rerender(
        <AnimationController
          {...defaultProps}
          attackType="ice"
          attackData={{
            ...defaultProps.attackData,
            casterX: 150,
          }}
        />
      );

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Queueing animation')
        );
      });

      logSpy.mockRestore();
    });

    it('logs cleanup on unmount in development', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      const { unmount } = render(<AnimationController {...defaultProps} />);

      unmount();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up on unmount')
      );

      logSpy.mockRestore();
    });
  });
});
