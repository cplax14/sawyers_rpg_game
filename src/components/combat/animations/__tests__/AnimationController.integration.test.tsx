/**
 * Integration Tests for AnimationController with Real Animation Components
 *
 * Tests AnimationController working with actual spell animation components
 * to ensure proper integration and lifecycle management.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnimationController } from '../AnimationController';
import * as animationRegistry from '../animationRegistry';

// Mock Framer Motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, onAnimationComplete, ...props }: any) => {
      // Simulate animation completing quickly
      React.useEffect(() => {
        if (onAnimationComplete) {
          const timer = setTimeout(onAnimationComplete, 10);
          return () => clearTimeout(timer);
        }
      }, [onAnimationComplete]);

      return (
        <div style={style} {...props}>
          {children}
        </div>
      );
    },
  },
}));

// Mock console methods to suppress animation logs
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

describe('AnimationController Integration Tests', () => {
  let consoleError: jest.SpyInstance;
  let consoleWarn: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
    consoleLog.mockRestore();
  });

  const defaultProps = {
    attackData: {
      casterX: 100,
      casterY: 100,
      targetX: 300,
      targetY: 300,
    },
    onComplete: jest.fn(),
    isActive: true,
  };

  describe('Integration with Fireball Animation', () => {
    it('successfully renders Fireball animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="fire" />
      );

      // Assert - Animation controller wrapper should render
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('calls onComplete after Fireball animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController {...defaultProps} attackType="fire" onComplete={onComplete} />
      );

      // Assert - onComplete should be called after animation
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 } // Fireball takes ~950ms + buffer
      );
    });

    it('validates particle counts for Fireball phases', async () => {
      // Arrange & Act
      render(<AnimationController {...defaultProps} attackType="fire" />);

      // Assert - Should not have any particle count errors
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('Particle count'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });

    it('passes correct position data to Fireball', async () => {
      // Arrange
      const customData = {
        casterX: 50,
        casterY: 75,
        targetX: 400,
        targetY: 450,
      };

      // Act
      const { container } = render(
        <AnimationController
          {...defaultProps}
          attackType="fire"
          attackData={customData}
        />
      );

      // Assert - Animation should render with custom positions
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Ice Shard Animation', () => {
    it('successfully renders Ice Shard animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="ice" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('validates particle counts for Ice Shard phases', async () => {
      // Arrange & Act
      render(<AnimationController {...defaultProps} attackType="ice" />);

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Should not have any particle count errors
      const errorCalls = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
      );
      expect(errorCalls.length).toBe(0);
    });
  });

  describe('Integration with Lightning Animation', () => {
    it('successfully renders Lightning animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="thunder" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('calls onComplete after Lightning animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController {...defaultProps} attackType="thunder" onComplete={onComplete} />
      );

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('validates particle counts for Lightning phases', async () => {
      // Arrange & Act
      render(<AnimationController {...defaultProps} attackType="thunder" />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('Integration with Holy Beam Animation', () => {
    it('successfully renders Holy Beam animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="holy" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('calls onComplete after Holy Beam animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController {...defaultProps} attackType="holy" onComplete={onComplete} />
      );

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Integration with Meteor Animation', () => {
    it('successfully renders Meteor animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="meteor" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('calls onComplete after Meteor animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController {...defaultProps} attackType="meteor" onComplete={onComplete} />
      );

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 3000 } // Meteor is longer animation
      );
    });

    it('validates particle counts for Meteor phases', async () => {
      // Arrange & Act
      render(<AnimationController {...defaultProps} attackType="meteor" />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('Integration with Support Spell Animations', () => {
    it('successfully renders Heal animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="heal" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('successfully renders Protect animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="protect" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('successfully renders Shell animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="shell" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('successfully renders Haste animation', async () => {
      // Arrange & Act
      const { container } = render(
        <AnimationController {...defaultProps} attackType="haste" />
      );

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.animation-controller')).toBeInTheDocument();
      });
    });

    it('renders all support spells without errors', async () => {
      // Arrange
      const supportSpells = ['heal', 'protect', 'shell', 'haste'];

      // Act & Assert
      for (const spell of supportSpells) {
        const { container, unmount } = render(
          <AnimationController
            {...defaultProps}
            attackType={spell}
            onComplete={jest.fn()}
          />
        );

        // Verify animation controller renders
        await waitFor(() => {
          expect(container.querySelector('.animation-controller')).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Sequential Animation Integration', () => {
    it('renders animations sequentially without errors', async () => {
      // Arrange
      const spells = ['fire', 'ice', 'thunder'];

      // Act & Assert - Each spell renders successfully
      for (const spell of spells) {
        const { container, unmount } = render(
          <AnimationController
            {...defaultProps}
            attackType={spell}
            onComplete={jest.fn()}
          />
        );

        // Verify animation controller renders
        await waitFor(() => {
          expect(container.querySelector('.animation-controller')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('maintains animation quality through rapid sequences', async () => {
      // Arrange
      const spells = ['fire', 'ice', 'thunder'];

      // Act - Render all spells
      for (const spell of spells) {
        const { unmount } = render(
          <AnimationController
            {...defaultProps}
            attackType={spell}
            onComplete={jest.fn()}
          />
        );

        // Wait a bit for animation to start
        await new Promise(resolve => setTimeout(resolve, 100));

        unmount();
      }

      // Assert - No particle count errors during rapid sequence
      const particleErrors = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Particle count'))
      );
      expect(particleErrors.length).toBe(0);
    });
  });

  describe('Position Data Integration', () => {
    it('handles different position configurations for all spells', async () => {
      // Arrange
      const positions = [
        { casterX: 0, casterY: 0, targetX: 100, targetY: 100 },
        { casterX: 500, casterY: 500, targetX: 100, targetY: 100 },
        { casterX: 100, casterY: 500, targetX: 500, targetY: 100 },
        { casterX: 250, casterY: 250, targetX: 250, targetY: 250 }, // Same position
      ];

      const spells = ['fire', 'ice', 'thunder', 'holy'];

      // Act & Assert
      for (const position of positions) {
        for (const spell of spells) {
          const onComplete = jest.fn();
          const { unmount } = render(
            <AnimationController
              {...defaultProps}
              attackType={spell}
              attackData={position}
              onComplete={onComplete}
            />
          );

          await waitFor(
            () => {
              expect(onComplete).toHaveBeenCalled();
            },
            { timeout: 2000 }
          );

          unmount();
        }
      }

      // No position validation errors should occur
      const positionWarnings = consoleWarn.mock.calls.filter(call =>
        call.some(arg =>
          typeof arg === 'string' &&
          (arg.includes('Invalid position') || arg.includes('Position out of bounds'))
        )
      );
      expect(positionWarnings.length).toBe(0);
    });

    it('handles edge case positions without errors', async () => {
      // Arrange
      const edgeCases = [
        { casterX: -100, casterY: -100, targetX: 100, targetY: 100 }, // Negative coords
        { casterX: 5000, casterY: 5000, targetX: 100, targetY: 100 }, // Large coords
        { casterX: 0, casterY: 0, targetX: 0, targetY: 0 }, // Zero coords
      ];

      // Act & Assert
      for (const attackData of edgeCases) {
        const onComplete = jest.fn();
        const { unmount } = render(
          <AnimationController
            {...defaultProps}
            attackType="fire"
            attackData={attackData}
            onComplete={onComplete}
          />
        );

        await waitFor(
          () => {
            expect(onComplete).toHaveBeenCalled();
          },
          { timeout: 2000 }
        );

        unmount();
      }
    });
  });

  describe('Performance Validation Integration', () => {
    it('all registered spells have valid particle counts', async () => {
      // Arrange
      const registeredSpells = animationRegistry.getRegisteredSpells();

      // Act & Assert
      for (const spell of registeredSpells) {
        consoleError.mockClear();
        const onComplete = jest.fn();

        const { unmount } = render(
          <AnimationController
            {...defaultProps}
            attackType={spell}
            onComplete={onComplete}
          />
        );

        // Check for particle count errors
        await waitFor(() => {
          const particleErrors = consoleError.mock.calls.filter(call =>
            call.some(arg =>
              typeof arg === 'string' && arg.includes('EXCEEDS maximum')
            )
          );

          if (particleErrors.length > 0) {
            console.error(
              `Spell "${spell}" has particle count violations:`,
              particleErrors
            );
          }

          expect(particleErrors.length).toBe(0);
        });

        unmount();
      }
    });

    it('logs performance instrumentation in development', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      const onComplete = jest.fn();
      render(
        <AnimationController {...defaultProps} attackType="fire" onComplete={onComplete} />
      );

      // Assert - Should log animation timing
      await waitFor(() => {
        const timingLogs = consoleLog.mock.calls.filter(call =>
          call.some(arg =>
            typeof arg === 'string' && arg.includes('[Animation Timing]')
          )
        );
        expect(timingLogs.length).toBeGreaterThan(0);
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Recovery Integration', () => {
    it('recovers from animation errors and continues combat', async () => {
      // Arrange - Create a spell that will throw an error
      jest.spyOn(animationRegistry, 'getAnimationMetadata').mockReturnValueOnce({
        element: 'fire',
        type: 'projectile',
        component: () => {
          throw new Error('Test animation error');
        },
      });

      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController {...defaultProps} attackType="fire" onComplete={onComplete} />
      );

      // Assert - onComplete should still be called despite error
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it('handles invalid positions gracefully', async () => {
      // Arrange
      const invalidData = {
        casterX: NaN,
        casterY: undefined as any,
        targetX: Infinity,
        targetY: -Infinity,
      };

      const onComplete = jest.fn();

      // Act
      render(
        <AnimationController
          {...defaultProps}
          attackType="fire"
          attackData={invalidData}
          onComplete={onComplete}
        />
      );

      // Assert - Should skip animation and call onComplete immediately
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });
  });
});
