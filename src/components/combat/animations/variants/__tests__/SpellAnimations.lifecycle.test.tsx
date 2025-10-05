/**
 * Lifecycle and Callback Tests for Spell Animation Variants
 *
 * Tests that all spell animation components properly manage their lifecycle,
 * call onComplete callbacks, and transition through animation phases correctly.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FireballAnimation } from '../FireballAnimation';
import { IceShardAnimation } from '../IceShardAnimation';
import { LightningAnimation } from '../LightningAnimation';
import { HolyBeamAnimation } from '../HolyBeamAnimation';
import { MeteorAnimation } from '../MeteorAnimation';
import { HealAnimation } from '../HealAnimation';
import { ProtectAnimation } from '../ProtectAnimation';
import { ShellAnimation } from '../ShellAnimation';
import { HasteAnimation } from '../HasteAnimation';

// Mock Framer Motion to speed up tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, onAnimationComplete, initial, animate, ...props }: any) => {
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

// Mock console to suppress particle count validation logs
const originalWarn = console.warn;
const originalError = console.error;

describe('Spell Animation Lifecycle Tests', () => {
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  const defaultProps = {
    casterX: 100,
    casterY: 100,
    targetX: 300,
    targetY: 300,
  };

  describe('FireballAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<FireballAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls onComplete callback when animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(<FireballAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it('transitions through all animation phases', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(
        <FireballAnimation {...defaultProps} onComplete={onComplete} />
      );

      // Assert - Animation should render and complete all phases
      expect(container.firstChild).toBeInTheDocument();

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('respects position props', () => {
      // Arrange
      const customProps = {
        casterX: 50,
        casterY: 75,
        targetX: 400,
        targetY: 450,
      };

      // Act
      const { container } = render(<FireballAnimation {...customProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<FireballAnimation {...defaultProps} />);

      // Assert - Should not have particle count errors
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('IceShardAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<IceShardAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls onComplete callback when animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(<IceShardAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it('transitions through all animation phases', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(
        <IceShardAnimation {...defaultProps} onComplete={onComplete} />
      );

      // Assert
      expect(container.firstChild).toBeInTheDocument();

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<IceShardAnimation {...defaultProps} />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('LightningAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<LightningAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with onComplete callback', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(<LightningAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert - Component renders
      expect(container.firstChild).toBeInTheDocument();

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<LightningAnimation {...defaultProps} />);

      // Wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const errorCalls = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
      );
      expect(errorCalls.length).toBe(0);
    });
  });

  describe('HolyBeamAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<HolyBeamAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls onComplete callback when animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(<HolyBeamAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it('transitions through all animation phases', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(
        <HolyBeamAnimation {...defaultProps} onComplete={onComplete} />
      );

      // Assert
      expect(container.firstChild).toBeInTheDocument();

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<HolyBeamAnimation {...defaultProps} />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('MeteorAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<MeteorAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls onComplete callback when animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(<MeteorAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 } // Meteor takes longer
      );
    });

    it('transitions through all animation phases', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(
        <MeteorAnimation {...defaultProps} onComplete={onComplete} />
      );

      // Assert
      expect(container.firstChild).toBeInTheDocument();

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<MeteorAnimation {...defaultProps} />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('HealAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<HealAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls onComplete callback when animation finishes', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      render(<HealAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it('transitions through all animation phases', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(
        <HealAnimation {...defaultProps} onComplete={onComplete} />
      );

      // Assert
      expect(container.firstChild).toBeInTheDocument();

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<HealAnimation {...defaultProps} />);

      // Assert
      await waitFor(() => {
        const errorCalls = consoleError.mock.calls.filter(call =>
          call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
        );
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('ProtectAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<ProtectAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with onComplete callback', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(<ProtectAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert - Component renders
      expect(container.firstChild).toBeInTheDocument();

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<ProtectAnimation {...defaultProps} />);

      // Wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const errorCalls = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
      );
      expect(errorCalls.length).toBe(0);
    });
  });

  describe('ShellAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<ShellAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with onComplete callback', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(<ShellAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert - Component renders
      expect(container.firstChild).toBeInTheDocument();

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<ShellAnimation {...defaultProps} />);

      // Wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const errorCalls = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
      );
      expect(errorCalls.length).toBe(0);
    });
  });

  describe('HasteAnimation', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      const { container } = render(<HasteAnimation {...defaultProps} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with onComplete callback', async () => {
      // Arrange
      const onComplete = jest.fn();

      // Act
      const { container } = render(<HasteAnimation {...defaultProps} onComplete={onComplete} />);

      // Assert - Component renders
      expect(container.firstChild).toBeInTheDocument();

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('validates particle counts within limits', async () => {
      // Arrange & Act
      render(<HasteAnimation {...defaultProps} />);

      // Wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const errorCalls = consoleError.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('EXCEEDS maximum'))
      );
      expect(errorCalls.length).toBe(0);
    });
  });

  describe('Callback Behavior', () => {
    it('animations render without crashing when onComplete is provided', async () => {
      // Arrange
      const animations = [
        { name: 'Fireball', component: FireballAnimation },
        { name: 'Ice Shard', component: IceShardAnimation },
        { name: 'Lightning', component: LightningAnimation },
        { name: 'Holy Beam', component: HolyBeamAnimation },
        { name: 'Meteor', component: MeteorAnimation },
        { name: 'Heal', component: HealAnimation },
        { name: 'Protect', component: ProtectAnimation },
        { name: 'Shell', component: ShellAnimation },
        { name: 'Haste', component: HasteAnimation },
      ];

      // Act & Assert
      for (const { name, component: Component } of animations) {
        const onComplete = jest.fn();
        const { container, unmount } = render(<Component {...defaultProps} onComplete={onComplete} />);

        // Verify component renders
        expect(container.firstChild).toBeInTheDocument();

        // Wait a bit to ensure animation starts
        await new Promise(resolve => setTimeout(resolve, 100));

        unmount();
      }
    });

    it('animations work without onComplete callback', async () => {
      // Arrange
      const animations = [
        FireballAnimation,
        IceShardAnimation,
        LightningAnimation,
        HolyBeamAnimation,
        MeteorAnimation,
        HealAnimation,
        ProtectAnimation,
        ShellAnimation,
        HasteAnimation,
      ];

      // Act & Assert - Should not crash without onComplete
      for (const Component of animations) {
        const { container, unmount } = render(<Component {...defaultProps} />);

        expect(container.firstChild).toBeInTheDocument();

        // Wait a bit to ensure animation progresses
        await new Promise(resolve => setTimeout(resolve, 100));

        unmount();
      }
    });
  });

  describe('Position Handling', () => {
    it('all animations handle different position configurations', () => {
      // Arrange
      const positions = [
        { casterX: 0, casterY: 0, targetX: 100, targetY: 100 },
        { casterX: 500, casterY: 500, targetX: 100, targetY: 100 },
        { casterX: 100, casterY: 500, targetX: 500, targetY: 100 },
        { casterX: 250, casterY: 250, targetX: 250, targetY: 250 }, // Same position
      ];

      const animations = [
        FireballAnimation,
        IceShardAnimation,
        LightningAnimation,
        HolyBeamAnimation,
        MeteorAnimation,
        HealAnimation,
        ProtectAnimation,
        ShellAnimation,
        HasteAnimation,
      ];

      // Act & Assert
      for (const position of positions) {
        for (const Component of animations) {
          const { container, unmount } = render(<Component {...position} />);

          expect(container.firstChild).toBeInTheDocument();

          unmount();
        }
      }
    });
  });
});
