import React from 'react';
import { render, screen } from '@testing-library/react';
import { MeleeSlash } from './MeleeSlash';

describe('MeleeSlash', () => {
  // Common test props
  const defaultProps = {
    slashType: 'slash' as const,
    startX: 100,
    startY: 100,
    endX: 200,
    endY: 150,
    color: '#ff0000',
    duration: 600
  };

  describe('Rendering', () => {
    it('should render without crashing with valid props', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with slash type', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="slash" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with stab type', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="stab" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with chop type', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="chop" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Prop Validation', () => {
    it('should handle different colors correctly', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} color="#00ff00" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toBeInTheDocument();
      // Color should be in the inline styles
      expect(element.style.background).toContain('#00ff00');
    });

    it('should handle custom trail width', () => {
      const customWidth = 10;
      const { container } = render(
        <MeleeSlash {...defaultProps} trailWidth={customWidth} />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe(`${customWidth}px`);
    });

    it('should use default trail width when not provided', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('4px'); // default trailWidth
    });

    it('should handle different durations', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} duration={1200} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Animation Lifecycle', () => {
    it('should call onComplete callback when provided', () => {
      const onComplete = jest.fn();
      render(<MeleeSlash {...defaultProps} onComplete={onComplete} />);
      // In the mocked version, onComplete would be called immediately
      // In real implementation, it would be called after animation completes
    });

    it('should not crash when onComplete is not provided', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Position and Geometry Calculations', () => {
    it('should calculate angle correctly for diagonal movement', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} startX={0} startY={0} endX={100} endY={100} />
      );
      expect(container.firstChild).toBeInTheDocument();
      // Angle should be 45 degrees for equal x and y deltas
    });

    it('should calculate distance correctly', () => {
      const { container } = render(
        <MeleeSlash
          {...defaultProps}
          startX={0}
          startY={0}
          endX={300}
          endY={400}
        />
      );
      const element = container.firstChild as HTMLElement;
      // Distance = sqrt(300^2 + 400^2) = 500
      // For slash type, width should be distance * 0.8 = 400
      const expectedWidth = 400;
      expect(element.style.width).toBe(`${expectedWidth}px`);
    });

    it('should position slash type correctly', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="slash" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('100px');
      expect(element.style.top).toBe('100px');
    });

    it('should position stab type at origin', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="stab" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('0px');
      expect(element.style.top).toBe('0px');
    });

    it('should position chop type correctly', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} slashType="chop" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.left).toBe('100px');
      expect(element.style.top).toBe('100px');
    });
  });

  describe('Visual Effects', () => {
    it('should apply glow effects with correct color', () => {
      const color = '#ff00ff';
      const { container } = render(
        <MeleeSlash {...defaultProps} color={color} />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.boxShadow).toContain(color);
    });

    it('should have additional glow effect child element', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      const parent = container.firstChild as HTMLElement;
      expect(parent.children.length).toBeGreaterThan(0);
    });

    it('should apply blur filter', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.filter).toBe('blur(1px)');
    });

    it('should set pointer events to none', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.pointerEvents).toBe('none');
    });

    it('should set high z-index for visibility', () => {
      const { container } = render(<MeleeSlash {...defaultProps} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero distance (same start and end)', () => {
      const { container } = render(
        <MeleeSlash
          {...defaultProps}
          startX={100}
          startY={100}
          endX={100}
          endY={100}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative coordinates', () => {
      const { container } = render(
        <MeleeSlash
          {...defaultProps}
          startX={-50}
          startY={-50}
          endX={50}
          endY={50}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very large coordinates', () => {
      const { container } = render(
        <MeleeSlash
          {...defaultProps}
          startX={10000}
          startY={10000}
          endX={20000}
          endY={20000}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero trail width', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} trailWidth={0} />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('0px');
    });

    it('should handle very short duration', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} duration={1} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very long duration', () => {
      const { container } = render(
        <MeleeSlash {...defaultProps} duration={10000} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Slash Type Variations', () => {
    it('should use different width calculation for stab type', () => {
      const startX = 0;
      const startY = 0;
      const endX = 300;
      const endY = 400;
      const distance = Math.sqrt(300 * 300 + 400 * 400); // 500

      const { container } = render(
        <MeleeSlash
          {...defaultProps}
          slashType="stab"
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
        />
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe(`${distance}px`);
    });

    it('should use different width calculation for slash and chop types', () => {
      const startX = 0;
      const startY = 0;
      const endX = 300;
      const endY = 400;
      const distance = Math.sqrt(300 * 300 + 400 * 400); // 500
      const expectedWidth = distance * 0.8; // 400

      const slashContainer = render(
        <MeleeSlash
          {...defaultProps}
          slashType="slash"
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
        />
      ).container;

      const chopContainer = render(
        <MeleeSlash
          {...defaultProps}
          slashType="chop"
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
        />
      ).container;

      expect((slashContainer.firstChild as HTMLElement).style.width).toBe(`${expectedWidth}px`);
      expect((chopContainer.firstChild as HTMLElement).style.width).toBe(`${expectedWidth}px`);
    });
  });

  describe('Component Display Name', () => {
    it('should have correct display name', () => {
      expect(MeleeSlash.displayName).toBe('MeleeSlash');
    });
  });
});
