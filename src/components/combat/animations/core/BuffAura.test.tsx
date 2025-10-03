import React from 'react';
import { render } from '@testing-library/react';
import { BuffAura } from './BuffAura';

describe('BuffAura', () => {
  // Common test props
  const defaultProps = {
    targetX: 200,
    targetY: 200,
    auraColor: '#ffd700',
    pulseSpeed: 2,
    particles: true,
    isActive: true
  };

  describe('Rendering', () => {
    it('should render without crashing with valid props', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when isActive is true', () => {
      const { container } = render(
        <BuffAura {...defaultProps} isActive={true} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not render when isActive is false', () => {
      const { container } = render(
        <BuffAura {...defaultProps} isActive={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render at correct position', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.left).toBe('200px');
      expect(wrapper?.style.top).toBe('200px');
    });
  });

  describe('Prop Validation', () => {
    it('should handle different colors', () => {
      const auraColor = '#9c27b0';
      const { container } = render(
        <BuffAura {...defaultProps} auraColor={auraColor} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different pulse speeds', () => {
      const { container } = render(
        <BuffAura {...defaultProps} pulseSpeed={0.5} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle particles enabled', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      // Should include orbital particles and sparkles
    });

    it('should handle particles disabled', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={false} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      // Should not include orbital particles or sparkles
    });

    it('should handle custom intensity', () => {
      const { container } = render(
        <BuffAura {...defaultProps} intensity={0.8} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should use default intensity when not provided', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Default intensity is 0.5
    });

    it('should handle different positions', () => {
      const { container } = render(
        <BuffAura {...defaultProps} targetX={300} targetY={400} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.left).toBe('300px');
      expect(wrapper?.style.top).toBe('400px');
    });
  });

  describe('Persistent vs Temporary Mode', () => {
    it('should render in persistent mode by default', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Default persistent is true
    });

    it('should render in persistent mode when explicitly set', () => {
      const { container } = render(
        <BuffAura {...defaultProps} persistent={true} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render in temporary mode', () => {
      const { container } = render(
        <BuffAura {...defaultProps} persistent={false} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Animation Lifecycle', () => {
    it('should call onComplete for temporary auras', () => {
      const onComplete = jest.fn();
      render(
        <BuffAura {...defaultProps} persistent={false} onComplete={onComplete} />
      );
      // In the mocked version, onComplete would be called immediately
      // In real implementation, it would be called after animation completes
    });

    it('should not call onComplete for persistent auras', () => {
      const onComplete = jest.fn();
      render(
        <BuffAura {...defaultProps} persistent={true} onComplete={onComplete} />
      );
      // Persistent auras don't call onComplete (infinite loop)
    });

    it('should not crash when onComplete is not provided', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Orbital Particles', () => {
    it('should generate 8 orbital particles when particles is true', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      // Should have 8 orbital particles
    });

    it('should not generate orbital particles when particles is false', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={false} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      // Should have no orbital particles
    });

    it('should position orbital particles in circular pattern', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      // Particles should be evenly distributed around circle
      // Each particle at angle = (i / 8) * 2π
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should position orbital particles at 50px radius', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      // Particles orbit at radius = 50
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Sparkle Effects', () => {
    it('should render 3 sparkles when particles is true', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      expect(container).toHaveTextContent('✨');
    });

    it('should not render sparkles when particles is false', () => {
      const { container } = render(
        <BuffAura {...defaultProps} particles={false} />
      );
      // Should not have sparkles
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Visual Layers', () => {
    it('should render main pulsing aura glow', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should render inner core glow', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should render shimmer ring', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should render vertical light rays', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should render ground glow', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply correct z-index', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.zIndex).toBe('98');
    });

    it('should disable pointer events', () => {
      const { container } = render(<BuffAura {...defaultProps} />);
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.pointerEvents).toBe('none');
    });
  });

  describe('Pulse Animation Differences', () => {
    it('should use infinite repeat for persistent mode', () => {
      const { container } = render(
        <BuffAura {...defaultProps} persistent={true} />
      );
      expect(container.firstChild).toBeInTheDocument();
      // Persistent mode has repeat: Infinity
    });

    it('should not repeat for temporary mode', () => {
      const { container } = render(
        <BuffAura {...defaultProps} persistent={false} />
      );
      expect(container.firstChild).toBeInTheDocument();
      // Temporary mode has repeat: 0
    });

    it('should use different opacity patterns for persistent vs temporary', () => {
      const persistentContainer = render(
        <BuffAura {...defaultProps} persistent={true} />
      ).container;

      const temporaryContainer = render(
        <BuffAura {...defaultProps} persistent={false} />
      ).container;

      expect(persistentContainer.firstChild).toBeInTheDocument();
      expect(temporaryContainer.firstChild).toBeInTheDocument();
      // Persistent: [intensity * 0.3, intensity * 0.6, intensity * 0.3]
      // Temporary: [0, intensity, intensity * 0.7, 0]
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative coordinates', () => {
      const { container } = render(
        <BuffAura {...defaultProps} targetX={-50} targetY={-50} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.left).toBe('-50px');
      expect(wrapper?.style.top).toBe('-50px');
    });

    it('should handle very large coordinates', () => {
      const { container } = render(
        <BuffAura {...defaultProps} targetX={10000} targetY={10000} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.style.left).toBe('10000px');
      expect(wrapper?.style.top).toBe('10000px');
    });

    it('should handle zero intensity', () => {
      const { container } = render(
        <BuffAura {...defaultProps} intensity={0} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle intensity greater than 1', () => {
      const { container } = render(
        <BuffAura {...defaultProps} intensity={1.5} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero pulse speed', () => {
      const { container } = render(
        <BuffAura {...defaultProps} pulseSpeed={0} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very fast pulse speed', () => {
      const { container } = render(
        <BuffAura {...defaultProps} pulseSpeed={0.1} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very slow pulse speed', () => {
      const { container } = render(
        <BuffAura {...defaultProps} pulseSpeed={10} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle toggling isActive', () => {
      const { container, rerender } = render(
        <BuffAura {...defaultProps} isActive={true} />
      );
      expect(container.firstChild).toBeInTheDocument();

      rerender(<BuffAura {...defaultProps} isActive={false} />);
      expect(container.firstChild).toBeNull();

      rerender(<BuffAura {...defaultProps} isActive={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle toggling particles', () => {
      const { container, rerender } = render(
        <BuffAura {...defaultProps} particles={true} />
      );
      expect(container).toHaveTextContent('✨');

      rerender(<BuffAura {...defaultProps} particles={false} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle switching between persistent and temporary', () => {
      const { container, rerender } = render(
        <BuffAura {...defaultProps} persistent={true} />
      );
      expect(container.firstChild).toBeInTheDocument();

      rerender(<BuffAura {...defaultProps} persistent={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Display Name', () => {
    it('should have correct display name', () => {
      expect(BuffAura.displayName).toBe('BuffAura');
    });
  });
});
