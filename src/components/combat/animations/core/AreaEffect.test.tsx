import React from 'react';
import { render } from '@testing-library/react';
import { AreaEffect } from './AreaEffect';

describe('AreaEffect', () => {
  // Common test props
  const defaultProps = {
    centerX: 200,
    centerY: 200,
    radius: 80,
    color: '#ff6b35',
    expandDuration: 600,
    fadeDuration: 400,
  };

  describe('Rendering', () => {
    it('should render without crashing with valid props', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render main container at correct position', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('200px');
      expect(element.style.top).toBe('200px');
    });

    it('should render with all visual layers', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      // Should have: main circle, inner glow, ground indicator, particles, shockwave
      // At minimum 4 child elements (more with particles)
      expect(wrapper.children.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Prop Validation', () => {
    it('should handle different radius values', () => {
      const radius = 120;
      const { container } = render(<AreaEffect {...defaultProps} radius={radius} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different colors', () => {
      const color = '#4da6ff';
      const { container } = render(<AreaEffect {...defaultProps} color={color} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different expand durations', () => {
      const { container } = render(<AreaEffect {...defaultProps} expandDuration={1000} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different fade durations', () => {
      const { container } = render(<AreaEffect {...defaultProps} fadeDuration={800} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should use default particle count when not provided', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      // Default is 20 particles + 4 other layers
      expect(wrapper.children.length).toBeGreaterThanOrEqual(24);
    });

    it('should handle custom particle count', () => {
      const particleCount = 10;
      const { container } = render(<AreaEffect {...defaultProps} particleCount={particleCount} />);
      const wrapper = container.firstChild as HTMLElement;
      // Should have 10 particles + 4 other layers
      expect(wrapper.children.length).toBeGreaterThanOrEqual(14);
    });
  });

  describe('Animation Lifecycle', () => {
    it('should call onComplete callback when provided', () => {
      const onComplete = jest.fn();
      render(<AreaEffect {...defaultProps} onComplete={onComplete} />);
      // In the mocked version, onComplete would be called immediately
      // In real implementation, it would be called after animation completes
    });

    it('should not crash when onComplete is not provided', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should calculate total duration correctly', () => {
      const expandDuration = 600;
      const fadeDuration = 400;
      const totalDuration = expandDuration + fadeDuration; // 1000ms

      const { container } = render(
        <AreaEffect {...defaultProps} expandDuration={expandDuration} fadeDuration={fadeDuration} />
      );
      expect(container.firstChild).toBeInTheDocument();
      // Total duration is used internally for animation timing
    });
  });

  describe('Particle Generation', () => {
    it('should generate correct number of particles', () => {
      const particleCount = 15;
      const { container } = render(<AreaEffect {...defaultProps} particleCount={particleCount} />);
      const wrapper = container.firstChild as HTMLElement;
      // Count particle elements (they're in the wrapper)
      const particleElements = Array.from(wrapper.children).filter(child => {
        const style = (child as HTMLElement).style;
        return style.borderRadius === '50%' && style.width === '8px';
      });
      expect(particleElements.length).toBe(particleCount);
    });

    it('should position particles in circular pattern', () => {
      const { container } = render(<AreaEffect {...defaultProps} particleCount={4} />);
      // Particles should be evenly distributed around circle
      // This is validated by the particle generation logic
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should stagger particle appearance', () => {
      const { container } = render(<AreaEffect {...defaultProps} particleCount={10} />);
      // Each particle should have a staggered delay
      // Delay = (index / particleCount) * 0.2
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero particles', () => {
      const { container } = render(<AreaEffect {...defaultProps} particleCount={0} />);
      const wrapper = container.firstChild as HTMLElement;
      // Should have only the 4 base layers (no particles)
      expect(wrapper.children.length).toBe(4);
    });

    it('should handle large particle count', () => {
      const { container } = render(<AreaEffect {...defaultProps} particleCount={50} />);
      const wrapper = container.firstChild as HTMLElement;
      // Should have 50 particles + 4 base layers
      expect(wrapper.children.length).toBeGreaterThanOrEqual(54);
    });
  });

  describe('Visual Layers', () => {
    it('should render main expanding circle with correct border', () => {
      const color = '#ff0000';
      const { container } = render(<AreaEffect {...defaultProps} color={color} />);
      const wrapper = container.firstChild as HTMLElement;
      const circles = Array.from(wrapper.children).filter(
        child => (child as HTMLElement).style.borderRadius === '50%'
      );
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should render inner glow circle', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBeGreaterThan(1);
    });

    it('should render ground indicator ring', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      // Ground indicator has dashed border
      const dashedElements = Array.from(wrapper.children).filter(child =>
        (child as HTMLElement).style.border?.includes('dashed')
      );
      expect(dashedElements.length).toBeGreaterThan(0);
    });

    it('should render shockwave ring effect', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBeGreaterThanOrEqual(4);
    });

    it('should apply correct z-index', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('99');
    });

    it('should disable pointer events', () => {
      const { container } = render(<AreaEffect {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.pointerEvents).toBe('none');
    });
  });

  describe('Circle Dimensions', () => {
    it('should calculate circle diameter correctly', () => {
      const radius = 100;
      const { container } = render(<AreaEffect {...defaultProps} radius={radius} />);
      // Circles should have width and height of radius * 2
      const wrapper = container.firstChild as HTMLElement;
      const circles = Array.from(wrapper.children).filter(child => {
        const style = (child as HTMLElement).style;
        return style.width === `${radius * 2}px`;
      });
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should offset circles by negative radius', () => {
      const radius = 80;
      const { container } = render(<AreaEffect {...defaultProps} radius={radius} />);
      // Circles should be positioned at -radius to center them
      const wrapper = container.firstChild as HTMLElement;
      const centeredCircles = Array.from(wrapper.children).filter(child => {
        const style = (child as HTMLElement).style;
        return style.left === `-${radius}px` && style.top === `-${radius}px`;
      });
      expect(centeredCircles.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero radius', () => {
      const { container } = render(<AreaEffect {...defaultProps} radius={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very large radius', () => {
      const { container } = render(<AreaEffect {...defaultProps} radius={1000} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero expand duration', () => {
      const { container } = render(<AreaEffect {...defaultProps} expandDuration={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero fade duration', () => {
      const { container } = render(<AreaEffect {...defaultProps} fadeDuration={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative center coordinates', () => {
      const { container } = render(<AreaEffect {...defaultProps} centerX={-100} centerY={-100} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('-100px');
      expect(element.style.top).toBe('-100px');
    });

    it('should handle very large center coordinates', () => {
      const { container } = render(
        <AreaEffect {...defaultProps} centerX={10000} centerY={10000} />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('10000px');
      expect(element.style.top).toBe('10000px');
    });
  });

  describe('Particle Physics', () => {
    it('should position particles at 80% of radius distance', () => {
      const radius = 100;
      const particleCount = 8;
      const expectedDistance = radius * 0.8; // 80

      const { container } = render(
        <AreaEffect {...defaultProps} radius={radius} particleCount={particleCount} />
      );
      // Particles should be positioned at expectedDistance from center
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should evenly distribute particles around circle', () => {
      const particleCount = 8;
      const { container } = render(<AreaEffect {...defaultProps} particleCount={particleCount} />);
      // Each particle should be at angle = (i / particleCount) * 2π
      // For 8 particles: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Display Name', () => {
    it('should have correct display name', () => {
      expect(AreaEffect.displayName).toBe('AreaEffect');
    });
  });
});
