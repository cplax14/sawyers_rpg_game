import {
  AnimationTimings,
  ProjectileConfig,
  ImpactConfig,
  ParticleConfig,
  MeleeAnimationConfig,
  AoeAnimationConfig,
  BuffAnimationConfig,
  DebuffAnimationConfig,
  FAST_ATTACK_DURATION,
  MEDIUM_ATTACK_DURATION,
  HEAVY_ATTACK_DURATION,
  MAGIC_BOLT_TIMINGS,
  SPRING_CONFIG,
  FIRE_COLORS,
  ICE_COLORS,
  LIGHTNING_COLORS,
  HOLY_COLORS,
  ARCANE_COLORS,
  POISON_COLORS,
  ELEMENT_COLORS,
} from './types';

describe('Animation Types', () => {
  describe('Type Definitions', () => {
    it('should define AnimationTimings interface', () => {
      const timings: AnimationTimings = {
        charge: 400,
        cast: 200,
        travel: 600,
        impact: 200,
        total: 1400,
      };
      expect(timings).toBeDefined();
      expect(timings.total).toBe(1400);
    });

    it('should define ProjectileConfig interface', () => {
      const config: ProjectileConfig = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        color: '#8b5cf6',
        glowColor: '#a78bfa',
      };
      expect(config).toBeDefined();
      expect(config.startX).toBe(100);
    });

    it('should define ProjectileConfig with optional size', () => {
      const config: ProjectileConfig = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        color: '#8b5cf6',
        glowColor: '#a78bfa',
        size: 20,
      };
      expect(config.size).toBe(20);
    });

    it('should define ImpactConfig interface', () => {
      const config: ImpactConfig = {
        x: 200,
        y: 200,
        damage: 50,
      };
      expect(config).toBeDefined();
      expect(config.damage).toBe(50);
    });

    it('should define ImpactConfig with optional fields', () => {
      const config: ImpactConfig = {
        x: 200,
        y: 200,
        damage: 75,
        isCritical: true,
        element: 'fire',
      };
      expect(config.isCritical).toBe(true);
      expect(config.element).toBe('fire');
    });

    it('should define ParticleConfig interface', () => {
      const config: ParticleConfig = {
        count: 20,
        color: '#ff0000',
        size: 6,
        spread: 100,
      };
      expect(config).toBeDefined();
      expect(config.count).toBe(20);
    });

    it('should define MeleeAnimationConfig interface', () => {
      const config: MeleeAnimationConfig = {
        slashType: 'slash',
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 150,
        color: '#ff0000',
        duration: 600,
      };
      expect(config).toBeDefined();
      expect(config.slashType).toBe('slash');
    });

    it('should define MeleeAnimationConfig with all slash types', () => {
      const slashTypes: Array<'slash' | 'stab' | 'chop'> = ['slash', 'stab', 'chop'];
      slashTypes.forEach(type => {
        const config: MeleeAnimationConfig = {
          slashType: type,
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 150,
          color: '#ff0000',
          duration: 600,
        };
        expect(config.slashType).toBe(type);
      });
    });

    it('should define MeleeAnimationConfig with optional trailWidth', () => {
      const config: MeleeAnimationConfig = {
        slashType: 'slash',
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 150,
        color: '#ff0000',
        duration: 600,
        trailWidth: 8,
      };
      expect(config.trailWidth).toBe(8);
    });

    it('should define AoeAnimationConfig interface', () => {
      const config: AoeAnimationConfig = {
        centerX: 200,
        centerY: 200,
        radius: 80,
        color: '#ff6b35',
        expandDuration: 600,
        fadeDuration: 400,
      };
      expect(config).toBeDefined();
      expect(config.radius).toBe(80);
    });

    it('should define AoeAnimationConfig with optional particleCount', () => {
      const config: AoeAnimationConfig = {
        centerX: 200,
        centerY: 200,
        radius: 80,
        color: '#ff6b35',
        expandDuration: 600,
        fadeDuration: 400,
        particleCount: 30,
      };
      expect(config.particleCount).toBe(30);
    });

    it('should define BuffAnimationConfig interface', () => {
      const config: BuffAnimationConfig = {
        targetX: 150,
        targetY: 150,
        auraColor: '#ffd700',
        pulseSpeed: 2,
        particles: true,
      };
      expect(config).toBeDefined();
      expect(config.particles).toBe(true);
    });

    it('should define BuffAnimationConfig with optional fields', () => {
      const config: BuffAnimationConfig = {
        targetX: 150,
        targetY: 150,
        auraColor: '#ffd700',
        pulseSpeed: 2,
        particles: true,
        intensity: 0.8,
        persistent: false,
      };
      expect(config.intensity).toBe(0.8);
      expect(config.persistent).toBe(false);
    });

    it('should define DebuffAnimationConfig interface', () => {
      const config: DebuffAnimationConfig = {
        targetX: 150,
        targetY: 150,
        statusType: 'poison',
        color: '#8bc34a',
        duration: 2000,
      };
      expect(config).toBeDefined();
      expect(config.statusType).toBe('poison');
    });

    it('should define DebuffAnimationConfig with all status types', () => {
      const statusTypes: Array<'poison' | 'sleep' | 'silence' | 'slow' | 'stun'> = [
        'poison',
        'sleep',
        'silence',
        'slow',
        'stun',
      ];
      statusTypes.forEach(type => {
        const config: DebuffAnimationConfig = {
          targetX: 150,
          targetY: 150,
          statusType: type,
          color: '#8bc34a',
          duration: 2000,
        };
        expect(config.statusType).toBe(type);
      });
    });

    it('should define DebuffAnimationConfig with optional intensity', () => {
      const config: DebuffAnimationConfig = {
        targetX: 150,
        targetY: 150,
        statusType: 'poison',
        color: '#8bc34a',
        duration: 2000,
        intensity: 0.7,
      };
      expect(config.intensity).toBe(0.7);
    });
  });

  describe('Timing Constants', () => {
    it('should export FAST_ATTACK_DURATION', () => {
      expect(FAST_ATTACK_DURATION).toBeDefined();
      expect(typeof FAST_ATTACK_DURATION).toBe('number');
    });

    it('should have correct FAST_ATTACK_DURATION value', () => {
      expect(FAST_ATTACK_DURATION).toBe(600);
    });

    it('should export MEDIUM_ATTACK_DURATION', () => {
      expect(MEDIUM_ATTACK_DURATION).toBeDefined();
      expect(typeof MEDIUM_ATTACK_DURATION).toBe('number');
    });

    it('should have correct MEDIUM_ATTACK_DURATION value', () => {
      expect(MEDIUM_ATTACK_DURATION).toBe(900);
    });

    it('should export HEAVY_ATTACK_DURATION', () => {
      expect(HEAVY_ATTACK_DURATION).toBeDefined();
      expect(typeof HEAVY_ATTACK_DURATION).toBe('number');
    });

    it('should have correct HEAVY_ATTACK_DURATION value', () => {
      expect(HEAVY_ATTACK_DURATION).toBe(1400);
    });

    it('should have increasing duration from fast to heavy', () => {
      expect(FAST_ATTACK_DURATION).toBeLessThan(MEDIUM_ATTACK_DURATION);
      expect(MEDIUM_ATTACK_DURATION).toBeLessThan(HEAVY_ATTACK_DURATION);
    });

    it('should export MAGIC_BOLT_TIMINGS', () => {
      expect(MAGIC_BOLT_TIMINGS).toBeDefined();
    });

    it('should have correct MAGIC_BOLT_TIMINGS structure', () => {
      expect(MAGIC_BOLT_TIMINGS).toEqual({
        charge: 400,
        cast: 200,
        travel: 600,
        impact: 200,
        total: 1400,
      });
    });

    it('should have MAGIC_BOLT_TIMINGS total equal to sum of phases', () => {
      const sum =
        MAGIC_BOLT_TIMINGS.charge +
        MAGIC_BOLT_TIMINGS.cast +
        MAGIC_BOLT_TIMINGS.travel +
        MAGIC_BOLT_TIMINGS.impact;
      expect(MAGIC_BOLT_TIMINGS.total).toBe(sum);
    });
  });

  describe('Spring Configuration Constants', () => {
    it('should export SPRING_CONFIG', () => {
      expect(SPRING_CONFIG).toBeDefined();
    });

    it('should have smooth spring configuration', () => {
      expect(SPRING_CONFIG.smooth).toEqual({
        type: 'spring',
        stiffness: 100,
        damping: 15,
      });
    });

    it('should have bouncy spring configuration', () => {
      expect(SPRING_CONFIG.bouncy).toEqual({
        type: 'spring',
        stiffness: 300,
        damping: 20,
      });
    });

    it('should have stiff spring configuration', () => {
      expect(SPRING_CONFIG.stiff).toEqual({
        type: 'spring',
        stiffness: 400,
        damping: 25,
      });
    });

    it('should have increasing stiffness from smooth to stiff', () => {
      expect(SPRING_CONFIG.smooth.stiffness).toBeLessThan(SPRING_CONFIG.bouncy.stiffness);
      expect(SPRING_CONFIG.bouncy.stiffness).toBeLessThan(SPRING_CONFIG.stiff.stiffness);
    });

    it('should have increasing damping from smooth to stiff', () => {
      expect(SPRING_CONFIG.smooth.damping).toBeLessThan(SPRING_CONFIG.bouncy.damping);
      expect(SPRING_CONFIG.bouncy.damping).toBeLessThan(SPRING_CONFIG.stiff.damping);
    });
  });

  describe('Color Palette Constants', () => {
    describe('FIRE_COLORS', () => {
      it('should export FIRE_COLORS', () => {
        expect(FIRE_COLORS).toBeDefined();
      });

      it('should have primary fire color', () => {
        expect(FIRE_COLORS.primary).toBe('#ff6b35');
      });

      it('should have secondary fire color', () => {
        expect(FIRE_COLORS.secondary).toBe('#ff4444');
      });

      it('should have accent fire color', () => {
        expect(FIRE_COLORS.accent).toBe('#ffaa00');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(FIRE_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });

    describe('ICE_COLORS', () => {
      it('should export ICE_COLORS', () => {
        expect(ICE_COLORS).toBeDefined();
      });

      it('should have primary ice color', () => {
        expect(ICE_COLORS.primary).toBe('#4da6ff');
      });

      it('should have secondary ice color', () => {
        expect(ICE_COLORS.secondary).toBe('#b3e0ff');
      });

      it('should have accent ice color', () => {
        expect(ICE_COLORS.accent).toBe('#ffffff');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(ICE_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });

    describe('LIGHTNING_COLORS', () => {
      it('should export LIGHTNING_COLORS', () => {
        expect(LIGHTNING_COLORS).toBeDefined();
      });

      it('should have primary lightning color', () => {
        expect(LIGHTNING_COLORS.primary).toBe('#ffeb3b');
      });

      it('should have secondary lightning color', () => {
        expect(LIGHTNING_COLORS.secondary).toBe('#fff176');
      });

      it('should have accent lightning color', () => {
        expect(LIGHTNING_COLORS.accent).toBe('#ffffff');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(LIGHTNING_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });

    describe('HOLY_COLORS', () => {
      it('should export HOLY_COLORS', () => {
        expect(HOLY_COLORS).toBeDefined();
      });

      it('should have primary holy color', () => {
        expect(HOLY_COLORS.primary).toBe('#ffd700');
      });

      it('should have secondary holy color', () => {
        expect(HOLY_COLORS.secondary).toBe('#ffffcc');
      });

      it('should have accent holy color', () => {
        expect(HOLY_COLORS.accent).toBe('#ffffff');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(HOLY_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });

    describe('ARCANE_COLORS', () => {
      it('should export ARCANE_COLORS', () => {
        expect(ARCANE_COLORS).toBeDefined();
      });

      it('should have primary arcane color', () => {
        expect(ARCANE_COLORS.primary).toBe('#9c27b0');
      });

      it('should have secondary arcane color', () => {
        expect(ARCANE_COLORS.secondary).toBe('#ba68c8');
      });

      it('should have accent arcane color', () => {
        expect(ARCANE_COLORS.accent).toBe('#4a148c');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(ARCANE_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });

    describe('POISON_COLORS', () => {
      it('should export POISON_COLORS', () => {
        expect(POISON_COLORS).toBeDefined();
      });

      it('should have primary poison color', () => {
        expect(POISON_COLORS.primary).toBe('#8bc34a');
      });

      it('should have secondary poison color', () => {
        expect(POISON_COLORS.secondary).toBe('#33691e');
      });

      it('should have accent poison color', () => {
        expect(POISON_COLORS.accent).toBe('#7b1fa2');
      });

      it('should have all three color properties', () => {
        expect(Object.keys(POISON_COLORS)).toEqual(['primary', 'secondary', 'accent']);
      });
    });
  });

  describe('Legacy ELEMENT_COLORS', () => {
    it('should export ELEMENT_COLORS', () => {
      expect(ELEMENT_COLORS).toBeDefined();
    });

    it('should have arcane element colors', () => {
      expect(ELEMENT_COLORS.arcane).toEqual({
        primary: '#8b5cf6',
        glow: '#a78bfa',
        particles: '#c4b5fd',
      });
    });

    it('should have fire element colors', () => {
      expect(ELEMENT_COLORS.fire).toEqual({
        primary: '#f59e0b',
        glow: '#fbbf24',
        particles: '#fcd34d',
      });
    });

    it('should have ice element colors', () => {
      expect(ELEMENT_COLORS.ice).toEqual({
        primary: '#3b82f6',
        glow: '#60a5fa',
        particles: '#93c5fd',
      });
    });

    it('should have lightning element colors', () => {
      expect(ELEMENT_COLORS.lightning).toEqual({
        primary: '#eab308',
        glow: '#facc15',
        particles: '#fde047',
      });
    });

    it('should have all four element types', () => {
      expect(Object.keys(ELEMENT_COLORS)).toEqual(['arcane', 'fire', 'ice', 'lightning']);
    });

    it('should have all legacy colors with primary, glow, and particles', () => {
      Object.values(ELEMENT_COLORS).forEach(colors => {
        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('glow');
        expect(colors).toHaveProperty('particles');
      });
    });
  });

  describe('All Color Palettes', () => {
    it('should have all color values as valid hex colors', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

      [
        FIRE_COLORS,
        ICE_COLORS,
        LIGHTNING_COLORS,
        HOLY_COLORS,
        ARCANE_COLORS,
        POISON_COLORS,
      ].forEach(palette => {
        expect(palette.primary).toMatch(hexColorPattern);
        expect(palette.secondary).toMatch(hexColorPattern);
        expect(palette.accent).toMatch(hexColorPattern);
      });
    });

    it('should have all legacy element colors as valid hex colors', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

      Object.values(ELEMENT_COLORS).forEach(colors => {
        expect(colors.primary).toMatch(hexColorPattern);
        expect(colors.glow).toMatch(hexColorPattern);
        expect(colors.particles).toMatch(hexColorPattern);
      });
    });
  });

  describe('Constant Values', () => {
    it('should have MAGIC_BOLT_TIMINGS values remain consistent', () => {
      expect(MAGIC_BOLT_TIMINGS.total).toBe(1400);
      expect(MAGIC_BOLT_TIMINGS.charge).toBe(400);
    });

    it('should have SPRING_CONFIG values remain consistent', () => {
      expect(SPRING_CONFIG.smooth.stiffness).toBe(100);
      expect(SPRING_CONFIG.bouncy.stiffness).toBe(300);
    });

    it('should have all color palettes defined', () => {
      expect(FIRE_COLORS).toBeDefined();
      expect(ICE_COLORS).toBeDefined();
      expect(LIGHTNING_COLORS).toBeDefined();
      expect(HOLY_COLORS).toBeDefined();
      expect(ARCANE_COLORS).toBeDefined();
      expect(POISON_COLORS).toBeDefined();
    });
  });
});
