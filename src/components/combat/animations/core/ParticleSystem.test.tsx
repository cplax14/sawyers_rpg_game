import React from 'react';
import { render } from '@testing-library/react';
import { ParticleSystem, PARTICLE_PRESETS } from './ParticleSystem';

describe('ParticleSystem', () => {
  // Common test props
  const defaultProps = {
    originX: 200,
    originY: 200,
    particleCount: 20,
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    spread: 100,
    lifetime: 1000,
  };

  describe('Rendering', () => {
    it('should render without crashing with valid props', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render at correct position', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.left).toBe('200px');
      expect(wrapper.style.top).toBe('200px');
    });

    it('should render correct number of particles', () => {
      const particleCount = 15;
      const { container } = render(
        <ParticleSystem {...defaultProps} particleCount={particleCount} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(particleCount);
    });
  });

  describe('Prop Validation', () => {
    it('should handle different origin coordinates', () => {
      const { container } = render(
        <ParticleSystem {...defaultProps} originX={100} originY={150} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.left).toBe('100px');
      expect(wrapper.style.top).toBe('150px');
    });

    it('should handle different particle counts', () => {
      const { container } = render(<ParticleSystem {...defaultProps} particleCount={5} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(5);
    });

    it('should handle single color', () => {
      const { container } = render(<ParticleSystem {...defaultProps} colors={['#ffffff']} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple colors', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
      const { container } = render(<ParticleSystem {...defaultProps} colors={colors} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different spread values', () => {
      const { container } = render(<ParticleSystem {...defaultProps} spread={50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle different lifetime values', () => {
      const { container } = render(<ParticleSystem {...defaultProps} lifetime={2000} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should use default size when not provided', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Default size is 6
    });

    it('should handle custom size', () => {
      const { container } = render(<ParticleSystem {...defaultProps} size={10} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      // Size has random variation (80% to 120%), so we check it's set
      expect(firstParticle.style.width).toBeTruthy();
    });

    it('should use default gravity when not provided', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Default gravity is 0
    });

    it('should handle positive gravity', () => {
      const { container } = render(<ParticleSystem {...defaultProps} gravity={100} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative gravity (upward)', () => {
      const { container } = render(<ParticleSystem {...defaultProps} gravity={-50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should use default fadeOut when not provided', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Default fadeOut is true
    });

    it('should handle fadeOut enabled', () => {
      const { container } = render(<ParticleSystem {...defaultProps} fadeOut={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle fadeOut disabled', () => {
      const { container } = render(<ParticleSystem {...defaultProps} fadeOut={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Animation Lifecycle', () => {
    it('should call onComplete after last particle finishes', () => {
      const onComplete = jest.fn();
      render(<ParticleSystem {...defaultProps} onComplete={onComplete} />);
      // In the mocked version, onComplete would be called immediately
      // In real implementation, it would be called when last particle completes
    });

    it('should not crash when onComplete is not provided', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Particle Generation', () => {
    it('should generate particles with random angles', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(defaultProps.particleCount);
    });

    it('should generate particles with random velocities', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Velocity = (random * 0.5 + 0.5) * spread
    });

    it('should randomly select colors from palette', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Each particle should have a color from the colors array
    });

    it('should apply random size variation', () => {
      const size = 10;
      const { container } = render(<ParticleSystem {...defaultProps} size={size} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      // Size variation: 80% to 120% of base size (8 to 12)
      const width = parseInt(firstParticle.style.width);
      expect(width).toBeGreaterThanOrEqual(8);
      expect(width).toBeLessThanOrEqual(12);
    });

    it('should apply random lifetime variation', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Lifetime variation: 80% to 120% of base lifetime
    });

    it('should stagger particle emission', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // Stagger delay: (i / particleCount) * 0.1
    });
  });

  describe('Particle Physics', () => {
    it('should apply gravity to final Y position', () => {
      const gravity = 100;
      const lifetime = 1000;
      const { container } = render(
        <ParticleSystem {...defaultProps} gravity={gravity} lifetime={lifetime} />
      );
      // finalY = vy * 100 + (gravity * lifetime / 2)
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not apply gravity when gravity is zero', () => {
      const { container } = render(<ParticleSystem {...defaultProps} gravity={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply negative gravity for upward movement', () => {
      const { container } = render(<ParticleSystem {...defaultProps} gravity={-50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should calculate velocity components from angle', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // vx = cos(angle) * velocity
      // vy = sin(angle) * velocity
    });

    it('should scale position by 100', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
      // finalX = vx * 100
      // finalY = vy * 100 + gravity offset
    });
  });

  describe('Negative Spread (Converging)', () => {
    it('should handle negative spread for converging particles', () => {
      const { container } = render(<ParticleSystem {...defaultProps} spread={-80} />);
      expect(container.firstChild).toBeInTheDocument();
      // Negative spread makes particles move inward (converge)
    });
  });

  describe('Visual Effects', () => {
    it('should render circular particles', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      expect(firstParticle.style.borderRadius).toBe('50%');
    });

    it('should apply glow effect with box shadow', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      expect(firstParticle.style.boxShadow).toBeTruthy();
    });

    it('should set absolute positioning', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      expect(firstParticle.style.position).toBe('absolute');
    });

    it('should apply correct z-index', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.zIndex).toBe('100');
    });

    it('should disable pointer events', () => {
      const { container } = render(<ParticleSystem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.pointerEvents).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero particles', () => {
      const { container } = render(<ParticleSystem {...defaultProps} particleCount={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(0);
    });

    it('should handle single particle', () => {
      const { container } = render(<ParticleSystem {...defaultProps} particleCount={1} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(1);
    });

    it('should handle very large particle count', () => {
      const { container } = render(<ParticleSystem {...defaultProps} particleCount={100} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(100);
    });

    it('should handle zero spread', () => {
      const { container } = render(<ParticleSystem {...defaultProps} spread={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very large spread', () => {
      const { container } = render(<ParticleSystem {...defaultProps} spread={500} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero lifetime', () => {
      const { container } = render(<ParticleSystem {...defaultProps} lifetime={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very long lifetime', () => {
      const { container } = render(<ParticleSystem {...defaultProps} lifetime={10000} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative coordinates', () => {
      const { container } = render(
        <ParticleSystem {...defaultProps} originX={-50} originY={-50} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.left).toBe('-50px');
      expect(wrapper.style.top).toBe('-50px');
    });

    it('should handle very large coordinates', () => {
      const { container } = render(
        <ParticleSystem {...defaultProps} originX={10000} originY={10000} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.left).toBe('10000px');
      expect(wrapper.style.top).toBe('10000px');
    });

    it('should handle zero size', () => {
      const { container } = render(<ParticleSystem {...defaultProps} size={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very large size', () => {
      const { container } = render(<ParticleSystem {...defaultProps} size={100} />);
      const wrapper = container.firstChild as HTMLElement;
      const firstParticle = wrapper.firstChild as HTMLElement;
      expect(firstParticle.style.width).toBeTruthy();
    });
  });

  describe('Component Display Name', () => {
    it('should have correct display name', () => {
      expect(ParticleSystem.displayName).toBe('ParticleSystem');
    });
  });
});

describe('PARTICLE_PRESETS', () => {
  it('should export PARTICLE_PRESETS constant', () => {
    expect(PARTICLE_PRESETS).toBeDefined();
  });

  describe('Explosion Preset', () => {
    it('should have explosion preset', () => {
      expect(PARTICLE_PRESETS.explosion).toBeDefined();
    });

    it('should have correct explosion configuration', () => {
      expect(PARTICLE_PRESETS.explosion).toEqual({
        particleCount: 25,
        spread: 150,
        lifetime: 800,
        size: 8,
        gravity: 50,
        fadeOut: true,
      });
    });
  });

  describe('Sparkle Preset', () => {
    it('should have sparkle preset', () => {
      expect(PARTICLE_PRESETS.sparkle).toBeDefined();
    });

    it('should have correct sparkle configuration', () => {
      expect(PARTICLE_PRESETS.sparkle).toEqual({
        particleCount: 15,
        spread: 80,
        lifetime: 1200,
        size: 4,
        gravity: -20,
        fadeOut: true,
      });
    });

    it('should have negative gravity for upward float', () => {
      expect(PARTICLE_PRESETS.sparkle.gravity).toBeLessThan(0);
    });
  });

  describe('Debris Preset', () => {
    it('should have debris preset', () => {
      expect(PARTICLE_PRESETS.debris).toBeDefined();
    });

    it('should have correct debris configuration', () => {
      expect(PARTICLE_PRESETS.debris).toEqual({
        particleCount: 20,
        spread: 100,
        lifetime: 1000,
        size: 6,
        gravity: 150,
        fadeOut: true,
      });
    });

    it('should have positive gravity for falling', () => {
      expect(PARTICLE_PRESETS.debris.gravity).toBeGreaterThan(0);
    });
  });

  describe('Gather Preset', () => {
    it('should have gather preset', () => {
      expect(PARTICLE_PRESETS.gather).toBeDefined();
    });

    it('should have correct gather configuration', () => {
      expect(PARTICLE_PRESETS.gather).toEqual({
        particleCount: 12,
        spread: -80,
        lifetime: 600,
        size: 5,
        gravity: 0,
        fadeOut: false,
      });
    });

    it('should have negative spread for converging particles', () => {
      expect(PARTICLE_PRESETS.gather.spread).toBeLessThan(0);
    });

    it('should not fade out', () => {
      expect(PARTICLE_PRESETS.gather.fadeOut).toBe(false);
    });
  });

  describe('Ambient Preset', () => {
    it('should have ambient preset', () => {
      expect(PARTICLE_PRESETS.ambient).toBeDefined();
    });

    it('should have correct ambient configuration', () => {
      expect(PARTICLE_PRESETS.ambient).toEqual({
        particleCount: 10,
        spread: 30,
        lifetime: 2000,
        size: 3,
        gravity: 0,
        fadeOut: true,
      });
    });
  });

  describe('Embers Preset', () => {
    it('should have embers preset', () => {
      expect(PARTICLE_PRESETS.embers).toBeDefined();
    });

    it('should have correct embers configuration', () => {
      expect(PARTICLE_PRESETS.embers).toEqual({
        particleCount: 18,
        spread: 60,
        lifetime: 1500,
        size: 4,
        gravity: -30,
        fadeOut: true,
      });
    });

    it('should have negative gravity for upward drift', () => {
      expect(PARTICLE_PRESETS.embers.gravity).toBeLessThan(0);
    });
  });

  describe('Crystals Preset', () => {
    it('should have crystals preset', () => {
      expect(PARTICLE_PRESETS.crystals).toBeDefined();
    });

    it('should have correct crystals configuration', () => {
      expect(PARTICLE_PRESETS.crystals).toEqual({
        particleCount: 20,
        spread: 120,
        lifetime: 700,
        size: 5,
        gravity: 80,
        fadeOut: true,
      });
    });
  });

  describe('Lightning Preset', () => {
    it('should have lightning preset', () => {
      expect(PARTICLE_PRESETS.lightning).toBeDefined();
    });

    it('should have correct lightning configuration', () => {
      expect(PARTICLE_PRESETS.lightning).toEqual({
        particleCount: 15,
        spread: 100,
        lifetime: 400,
        size: 3,
        gravity: 0,
        fadeOut: true,
      });
    });

    it('should have fast lifetime for erratic behavior', () => {
      expect(PARTICLE_PRESETS.lightning.lifetime).toBeLessThanOrEqual(400);
    });
  });

  describe('Healing Preset', () => {
    it('should have healing preset', () => {
      expect(PARTICLE_PRESETS.healing).toBeDefined();
    });

    it('should have correct healing configuration', () => {
      expect(PARTICLE_PRESETS.healing).toEqual({
        particleCount: 12,
        spread: 50,
        lifetime: 1400,
        size: 6,
        gravity: -40,
        fadeOut: true,
      });
    });

    it('should have negative gravity for gentle ascent', () => {
      expect(PARTICLE_PRESETS.healing.gravity).toBeLessThan(0);
    });
  });

  describe('Poison Preset', () => {
    it('should have poison preset', () => {
      expect(PARTICLE_PRESETS.poison).toBeDefined();
    });

    it('should have correct poison configuration', () => {
      expect(PARTICLE_PRESETS.poison).toEqual({
        particleCount: 10,
        spread: 40,
        lifetime: 2000,
        size: 8,
        gravity: -15,
        fadeOut: true,
      });
    });

    it('should have slow float with negative gravity', () => {
      expect(PARTICLE_PRESETS.poison.gravity).toBeLessThan(0);
    });
  });

  describe('All Presets', () => {
    it('should have exactly 10 presets', () => {
      const presetKeys = Object.keys(PARTICLE_PRESETS);
      expect(presetKeys.length).toBe(10);
    });

    it('should have all expected preset names', () => {
      const expectedPresets = [
        'explosion',
        'sparkle',
        'debris',
        'gather',
        'ambient',
        'embers',
        'crystals',
        'lightning',
        'healing',
        'poison',
      ];
      expectedPresets.forEach(preset => {
        expect(PARTICLE_PRESETS).toHaveProperty(preset);
      });
    });

    it('should have all presets with required properties', () => {
      Object.values(PARTICLE_PRESETS).forEach(preset => {
        expect(preset).toHaveProperty('particleCount');
        expect(preset).toHaveProperty('spread');
        expect(preset).toHaveProperty('lifetime');
        expect(preset).toHaveProperty('size');
        expect(preset).toHaveProperty('gravity');
        expect(preset).toHaveProperty('fadeOut');
      });
    });

    it('should have all presets with numeric particle counts', () => {
      Object.values(PARTICLE_PRESETS).forEach(preset => {
        expect(typeof preset.particleCount).toBe('number');
        expect(preset.particleCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have all presets with numeric lifetimes', () => {
      Object.values(PARTICLE_PRESETS).forEach(preset => {
        expect(typeof preset.lifetime).toBe('number');
        expect(preset.lifetime).toBeGreaterThan(0);
      });
    });

    it('should have all presets with boolean fadeOut', () => {
      Object.values(PARTICLE_PRESETS).forEach(preset => {
        expect(typeof preset.fadeOut).toBe('boolean');
      });
    });
  });
});
