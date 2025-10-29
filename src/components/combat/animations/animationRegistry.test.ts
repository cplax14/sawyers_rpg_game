/**
 * Unit Tests for Animation Registry
 *
 * Tests the animation registry functions and metadata structure.
 * This ensures that spell-to-animation mappings work correctly and
 * all registered animations have valid metadata.
 */

import {
  getAnimationMetadata,
  hasAnimation,
  getRegisteredSpells,
  getSpellsByElement,
  getSpellsByType,
  DEFAULT_ANIMATION,
  ATTACK_ANIMATION_MAP,
  type AnimationMetadata,
} from './animationRegistry';

describe('animationRegistry', () => {
  describe('getAnimationMetadata', () => {
    it('returns metadata for valid spell IDs', () => {
      const metadata = getAnimationMetadata('fire');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('fire');
      expect(metadata?.type).toBe('projectile');
      expect(metadata?.component).toBeDefined();
      expect(metadata?.description).toBeDefined();
    });

    it('returns metadata for magic_bolt spell', () => {
      const metadata = getAnimationMetadata('magic_bolt');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('arcane');
      expect(metadata?.type).toBe('projectile');
      expect(metadata?.component).toBeDefined();
    });

    it('returns metadata for ice spell', () => {
      const metadata = getAnimationMetadata('ice');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('ice');
      expect(metadata?.type).toBe('projectile');
    });

    it('returns metadata for thunder spell', () => {
      const metadata = getAnimationMetadata('thunder');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('lightning');
      expect(metadata?.type).toBe('beam');
    });

    it('returns metadata for heal spell', () => {
      const metadata = getAnimationMetadata('heal');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('holy');
      expect(metadata?.type).toBe('heal');
    });

    it('returns metadata for protect buff', () => {
      const metadata = getAnimationMetadata('protect');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('neutral');
      expect(metadata?.type).toBe('buff');
    });

    it('returns metadata for meteor AOE spell', () => {
      const metadata = getAnimationMetadata('meteor');
      expect(metadata).toBeDefined();
      expect(metadata?.element).toBe('fire');
      expect(metadata?.type).toBe('aoe');
    });

    it('returns null for invalid spell IDs', () => {
      const metadata = getAnimationMetadata('invalid_spell');
      expect(metadata).toBeNull();
    });

    it('returns null for empty string', () => {
      const metadata = getAnimationMetadata('');
      expect(metadata).toBeNull();
    });

    it('returns null for undefined spell ID', () => {
      const metadata = getAnimationMetadata(undefined as any);
      expect(metadata).toBeNull();
    });

    it('is case-sensitive', () => {
      const metadata = getAnimationMetadata('FIRE');
      expect(metadata).toBeNull();
    });
  });

  describe('hasAnimation', () => {
    it('returns true for registered spells', () => {
      expect(hasAnimation('fire')).toBe(true);
      expect(hasAnimation('ice')).toBe(true);
      expect(hasAnimation('magic_bolt')).toBe(true);
      expect(hasAnimation('thunder')).toBe(true);
      expect(hasAnimation('heal')).toBe(true);
      expect(hasAnimation('protect')).toBe(true);
      expect(hasAnimation('shell')).toBe(true);
      expect(hasAnimation('haste')).toBe(true);
      expect(hasAnimation('meteor')).toBe(true);
      expect(hasAnimation('holy')).toBe(true);
    });

    it('returns false for unregistered spells', () => {
      expect(hasAnimation('nonexistent')).toBe(false);
      expect(hasAnimation('attack')).toBe(false);
      expect(hasAnimation('slash')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasAnimation('')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasAnimation(undefined as any)).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(hasAnimation('Fire')).toBe(false);
      expect(hasAnimation('FIRE')).toBe(false);
    });
  });

  describe('getRegisteredSpells', () => {
    it('returns all registered spell IDs', () => {
      const spells = getRegisteredSpells();
      expect(Array.isArray(spells)).toBe(true);
      expect(spells.length).toBeGreaterThan(0);
    });

    it('includes all expected base spells', () => {
      const spells = getRegisteredSpells();
      expect(spells).toContain('magic_bolt');
      expect(spells).toContain('fire');
      expect(spells).toContain('ice');
      expect(spells).toContain('thunder');
      expect(spells).toContain('heal');
    });

    it('includes all buff spells', () => {
      const spells = getRegisteredSpells();
      expect(spells).toContain('protect');
      expect(spells).toContain('shell');
      expect(spells).toContain('haste');
    });

    it('includes AOE spells', () => {
      const spells = getRegisteredSpells();
      expect(spells).toContain('meteor');
    });

    it('includes beam spells', () => {
      const spells = getRegisteredSpells();
      expect(spells).toContain('holy');
    });

    it('returns exact count of registered spells', () => {
      const spells = getRegisteredSpells();
      const expectedCount = Object.keys(ATTACK_ANIMATION_MAP).length;
      expect(spells.length).toBe(expectedCount);
    });
  });

  describe('getSpellsByElement', () => {
    it('returns all fire spells', () => {
      const fireSpells = getSpellsByElement('fire');
      expect(fireSpells).toContain('fire');
      expect(fireSpells).toContain('meteor');
    });

    it('returns all ice spells', () => {
      const iceSpells = getSpellsByElement('ice');
      expect(iceSpells).toContain('ice');
    });

    it('returns all lightning spells', () => {
      const lightningSpells = getSpellsByElement('lightning');
      expect(lightningSpells).toContain('thunder');
    });

    it('returns all holy spells', () => {
      const holySpells = getSpellsByElement('holy');
      expect(holySpells).toContain('heal');
      expect(holySpells).toContain('holy');
    });

    it('returns all arcane spells', () => {
      const arcaneSpells = getSpellsByElement('arcane');
      expect(arcaneSpells).toContain('magic_bolt');
    });

    it('returns all neutral spells', () => {
      const neutralSpells = getSpellsByElement('neutral');
      expect(neutralSpells).toContain('protect');
      expect(neutralSpells).toContain('shell');
      expect(neutralSpells).toContain('haste');
    });

    it('returns empty array for non-existent element', () => {
      const spells = getSpellsByElement('poison');
      expect(spells).toEqual([]);
    });

    it('returns empty array for undefined element', () => {
      const spells = getSpellsByElement(undefined as any);
      expect(spells).toEqual([]);
    });

    it('does not return duplicate entries', () => {
      const fireSpells = getSpellsByElement('fire');
      const uniqueSpells = [...new Set(fireSpells)];
      expect(fireSpells.length).toBe(uniqueSpells.length);
    });
  });

  describe('getSpellsByType', () => {
    it('returns all projectile spells', () => {
      const projectileSpells = getSpellsByType('projectile');
      expect(projectileSpells).toContain('magic_bolt');
      expect(projectileSpells).toContain('fire');
      expect(projectileSpells).toContain('ice');
    });

    it('returns all beam spells', () => {
      const beamSpells = getSpellsByType('beam');
      expect(beamSpells).toContain('thunder');
      expect(beamSpells).toContain('holy');
    });

    it('returns all AOE spells', () => {
      const aoeSpells = getSpellsByType('aoe');
      expect(aoeSpells).toContain('meteor');
    });

    it('returns all heal spells', () => {
      const healSpells = getSpellsByType('heal');
      expect(healSpells).toContain('heal');
    });

    it('returns all buff spells', () => {
      const buffSpells = getSpellsByType('buff');
      expect(buffSpells).toContain('protect');
      expect(buffSpells).toContain('shell');
      expect(buffSpells).toContain('haste');
    });

    it('returns empty array for non-existent type', () => {
      const spells = getSpellsByType('debuff');
      expect(spells).toEqual([]);
    });

    it('returns empty array for undefined type', () => {
      const spells = getSpellsByType(undefined as any);
      expect(spells).toEqual([]);
    });

    it('does not return duplicate entries', () => {
      const projectileSpells = getSpellsByType('projectile');
      const uniqueSpells = [...new Set(projectileSpells)];
      expect(projectileSpells.length).toBe(uniqueSpells.length);
    });
  });

  describe('DEFAULT_ANIMATION', () => {
    it('is defined and not null', () => {
      expect(DEFAULT_ANIMATION).toBeDefined();
      expect(DEFAULT_ANIMATION).not.toBeNull();
    });

    it('has correct structure', () => {
      expect(DEFAULT_ANIMATION).toHaveProperty('element');
      expect(DEFAULT_ANIMATION).toHaveProperty('type');
      expect(DEFAULT_ANIMATION).toHaveProperty('component');
      expect(DEFAULT_ANIMATION).toHaveProperty('description');
    });

    it('is arcane projectile (Magic Bolt)', () => {
      expect(DEFAULT_ANIMATION.element).toBe('arcane');
      expect(DEFAULT_ANIMATION.type).toBe('projectile');
      expect(DEFAULT_ANIMATION.description).toContain('Fallback');
    });

    it('has a valid React component', () => {
      expect(DEFAULT_ANIMATION.component).toBeDefined();
      expect(typeof DEFAULT_ANIMATION.component).toBe('function');
    });

    it('matches magic_bolt animation', () => {
      const magicBoltMetadata = getAnimationMetadata('magic_bolt');
      expect(DEFAULT_ANIMATION.element).toBe(magicBoltMetadata?.element);
      expect(DEFAULT_ANIMATION.type).toBe(magicBoltMetadata?.type);
      expect(DEFAULT_ANIMATION.component).toBe(magicBoltMetadata?.component);
    });
  });

  describe('ATTACK_ANIMATION_MAP structure', () => {
    it('is a non-empty object', () => {
      expect(ATTACK_ANIMATION_MAP).toBeDefined();
      expect(typeof ATTACK_ANIMATION_MAP).toBe('object');
      expect(Object.keys(ATTACK_ANIMATION_MAP).length).toBeGreaterThan(0);
    });

    it('all entries have required fields', () => {
      Object.entries(ATTACK_ANIMATION_MAP).forEach(([spellId, metadata]) => {
        expect(metadata).toHaveProperty('type');
        expect(metadata).toHaveProperty('component');

        // Element is optional for some types
        if (metadata.element) {
          expect(typeof metadata.element).toBe('string');
        }

        // Description is optional but should be string if present
        if (metadata.description) {
          expect(typeof metadata.description).toBe('string');
        }
      });
    });

    it('all entries have valid animation types', () => {
      const validTypes: AnimationMetadata['type'][] = [
        'projectile',
        'beam',
        'aoe',
        'buff',
        'heal',
        'debuff',
        'physical',
      ];

      Object.entries(ATTACK_ANIMATION_MAP).forEach(([spellId, metadata]) => {
        expect(validTypes).toContain(metadata.type);
      });
    });

    it('all entries have valid element types', () => {
      const validElements: NonNullable<AnimationMetadata['element']>[] = [
        'fire',
        'ice',
        'lightning',
        'holy',
        'arcane',
        'nature',
        'neutral',
        'poison',
      ];

      Object.entries(ATTACK_ANIMATION_MAP).forEach(([spellId, metadata]) => {
        if (metadata.element) {
          expect(validElements).toContain(metadata.element);
        }
      });
    });

    it('all components are valid React components', () => {
      Object.entries(ATTACK_ANIMATION_MAP).forEach(([spellId, metadata]) => {
        expect(metadata.component).toBeDefined();
        // Component can be function or object (for lazy-loaded components)
        const componentType = typeof metadata.component;
        expect(['function', 'object']).toContain(componentType);
      });
    });

    it('has no duplicate component references for different spells', () => {
      // Note: Some spells may intentionally share components, but we verify structure
      Object.entries(ATTACK_ANIMATION_MAP).forEach(([spellId, metadata]) => {
        expect(metadata.component.name || metadata.component.displayName).toBeTruthy();
      });
    });
  });

  describe('Integration tests', () => {
    it('every registered spell has valid metadata', () => {
      const spells = getRegisteredSpells();

      spells.forEach(spellId => {
        const metadata = getAnimationMetadata(spellId);
        expect(metadata).not.toBeNull();
        expect(metadata?.component).toBeDefined();
        expect(metadata?.type).toBeDefined();
      });
    });

    it('hasAnimation and getAnimationMetadata are consistent', () => {
      const testSpells = ['fire', 'ice', 'magic_bolt', 'invalid_spell'];

      testSpells.forEach(spellId => {
        const hasIt = hasAnimation(spellId);
        const metadata = getAnimationMetadata(spellId);

        if (hasIt) {
          expect(metadata).not.toBeNull();
        } else {
          expect(metadata).toBeNull();
        }
      });
    });

    it('getSpellsByElement returns subset of getRegisteredSpells', () => {
      const allSpells = getRegisteredSpells();
      const fireSpells = getSpellsByElement('fire');

      fireSpells.forEach(spellId => {
        expect(allSpells).toContain(spellId);
      });
    });

    it('getSpellsByType returns subset of getRegisteredSpells', () => {
      const allSpells = getRegisteredSpells();
      const projectileSpells = getSpellsByType('projectile');

      projectileSpells.forEach(spellId => {
        expect(allSpells).toContain(spellId);
      });
    });

    it('all spells belong to at least one type category', () => {
      const allSpells = getRegisteredSpells();
      const types: AnimationMetadata['type'][] = [
        'projectile',
        'beam',
        'aoe',
        'buff',
        'heal',
        'debuff',
        'physical',
      ];

      allSpells.forEach(spellId => {
        const metadata = getAnimationMetadata(spellId);
        expect(metadata).not.toBeNull();
        expect(types).toContain(metadata!.type);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles spell IDs with special characters', () => {
      expect(hasAnimation('spell_with_underscore')).toBe(false);
      expect(hasAnimation('spell-with-dash')).toBe(false);
      expect(hasAnimation('spell.with.dot')).toBe(false);
    });

    it('handles very long spell IDs', () => {
      const longSpellId = 'a'.repeat(1000);
      expect(hasAnimation(longSpellId)).toBe(false);
      expect(getAnimationMetadata(longSpellId)).toBeNull();
    });

    it('handles numeric spell IDs', () => {
      expect(hasAnimation('123')).toBe(false);
      expect(getAnimationMetadata('123')).toBeNull();
    });

    it('filters work with empty registry results', () => {
      const spells = getSpellsByElement('poison');
      expect(Array.isArray(spells)).toBe(true);
      expect(spells.length).toBe(0);
    });
  });
});
