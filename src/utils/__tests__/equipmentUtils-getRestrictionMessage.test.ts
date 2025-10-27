/**
 * Unit tests for getRestrictionMessage function
 *
 * This test suite validates that all restriction message types generate
 * kid-friendly, age-appropriate error messages for children ages 7-12.
 */

import { getRestrictionMessage, RestrictionMessageContext } from '../equipmentUtils';

describe('getRestrictionMessage', () => {
  describe('Level Restriction Messages', () => {
    it('should generate message with player level and required level', () => {
      const context: RestrictionMessageContext = {
        requiredLevel: 10,
        playerLevel: 5
      };

      const message = getRestrictionMessage('level', context);

      expect(message).toBe("You need to be level 10 to use this item! (You're level 5)");
      expect(message).toMatch(/level 10/i);
      expect(message).toMatch(/level 5/i);
    });

    it('should generate message without player level if not provided', () => {
      const context: RestrictionMessageContext = {
        requiredLevel: 15
      };

      const message = getRestrictionMessage('level', context);

      expect(message).toBe('You need to be level 15 to use this item!');
      expect(message).toMatch(/level 15/i);
      expect(message).not.toMatch(/you're/i);
    });

    it('should generate generic message if required level is not provided', () => {
      const context: RestrictionMessageContext = {
        playerLevel: 5
      };

      const message = getRestrictionMessage('level', context);

      expect(message).toBe('This item has a level requirement!');
    });

    it('should use kid-friendly language with exclamation marks', () => {
      const context: RestrictionMessageContext = {
        requiredLevel: 20,
        playerLevel: 10
      };

      const message = getRestrictionMessage('level', context);

      expect(message).toMatch(/!/); // Exclamation marks make it encouraging
      expect(message).toMatch(/you need/i); // Direct, clear language
    });
  });

  describe('Class Restriction Messages', () => {
    it('should format single class requirement', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: ['warrior'],
        itemType: 'sword'
      };

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('Only Warriors can use this sword!');
      expect(message).toMatch(/Warriors/); // Capitalized and plural
      expect(message).toMatch(/sword/);
    });

    it('should format two classes with "and"', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: ['warrior', 'knight'],
        itemType: 'shield'
      };

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('Only Warriors and Knights can use this shield!');
      expect(message).toMatch(/Warriors and Knights/);
    });

    it('should format three or more classes with commas and "and"', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: ['warrior', 'knight', 'paladin'],
        itemType: 'armor'
      };

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('Only Warriors, Knights, and Paladins can use this armor!');
      expect(message).toMatch(/Warriors, Knights, and Paladins/);
    });

    it('should default to "item" if itemType not provided', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: ['mage']
      };

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('Only Mages can use this item!');
      expect(message).toMatch(/item/);
    });

    it('should handle empty class array gracefully', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: [],
        itemType: 'weapon'
      };

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('This item has class restrictions!');
    });

    it('should use kid-friendly pluralization', () => {
      const context: RestrictionMessageContext = {
        requiredClasses: ['cleric'],
        itemType: 'staff'
      };

      const message = getRestrictionMessage('class', context);

      // formatClassList should pluralize "Cleric" to "Clerics"
      expect(message).toMatch(/Clerics/);
    });
  });

  describe('Stat Restriction Messages', () => {
    it('should generate message with stat name, required value, and player value', () => {
      const context: RestrictionMessageContext = {
        statName: 'attack',
        requiredStatValue: 20,
        playerStatValue: 15,
        itemType: 'greatsword'
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('You need 20 Attack to use this greatsword! (You have 15)');
      expect(message).toMatch(/20 Attack/);
      expect(message).toMatch(/you have 15/i);
    });

    it('should format camelCase stat names to Title Case', () => {
      const context: RestrictionMessageContext = {
        statName: 'magicAttack',
        requiredStatValue: 30,
        playerStatValue: 10,
        itemType: 'wand'
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('You need 30 Magic Attack to use this wand! (You have 10)');
      expect(message).toMatch(/Magic Attack/); // Properly formatted
    });

    it('should handle stat name with multiple capital letters', () => {
      const context: RestrictionMessageContext = {
        statName: 'magicDefense',
        requiredStatValue: 25,
        playerStatValue: 18,
        itemType: 'robe'
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('You need 25 Magic Defense to use this robe! (You have 18)');
      expect(message).toMatch(/Magic Defense/);
    });

    it('should generate message without player value if not provided', () => {
      const context: RestrictionMessageContext = {
        statName: 'speed',
        requiredStatValue: 40,
        itemType: 'boots'
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('You need 40 Speed to use this boots!');
      expect(message).toMatch(/40 Speed/);
      expect(message).not.toMatch(/you have/i);
    });

    it('should generate generic message if stat info is missing', () => {
      const context: RestrictionMessageContext = {
        itemType: 'weapon'
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('This item has stat requirements!');
    });

    it('should default to "item" if itemType not provided', () => {
      const context: RestrictionMessageContext = {
        statName: 'defense',
        requiredStatValue: 15,
        playerStatValue: 10
      };

      const message = getRestrictionMessage('stat', context);

      expect(message).toMatch(/item/);
    });
  });

  describe('Slot Restriction Messages', () => {
    it('should generate message for helmet in wrong slot', () => {
      const context: RestrictionMessageContext = {
        itemSlot: 'helmet',
        targetSlot: 'weapon'
      };

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This is a helmet! It goes in the helmet slot, not the weapon slot.');
      expect(message).toMatch(/helmet/);
      expect(message).toMatch(/weapon/);
    });

    it('should use "an" article for armor', () => {
      const context: RestrictionMessageContext = {
        itemSlot: 'armor',
        targetSlot: 'helmet'
      };

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This is an armor! It goes in the armor slot, not the helmet slot.');
      expect(message).toMatch(/an armor/); // "an" for vowel sound
    });

    it('should use "a" article for weapon', () => {
      const context: RestrictionMessageContext = {
        itemSlot: 'weapon',
        targetSlot: 'armor'
      };

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This is a weapon! It goes in the weapon slot, not the armor slot.');
      expect(message).toMatch(/a weapon/); // "a" for consonant sound
    });

    it('should handle ring1/ring2 normalization', () => {
      const context: RestrictionMessageContext = {
        itemSlot: 'ring',
        targetSlot: 'weapon'
      };

      const message = getRestrictionMessage('slot', context);

      // formatSlotNameForDisplay should keep "ring" as "ring"
      expect(message).toBe('This is a ring! It goes in the ring slot, not the weapon slot.');
      expect(message).toMatch(/ring slot/);
    });

    it('should generate generic message if slot info is missing', () => {
      const context: RestrictionMessageContext = {};

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This item cannot be equipped in this slot!');
    });

    it('should handle missing targetSlot', () => {
      const context: RestrictionMessageContext = {
        itemSlot: 'boots'
      };

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This item cannot be equipped in this slot!');
    });

    it('should handle missing itemSlot', () => {
      const context: RestrictionMessageContext = {
        targetSlot: 'gloves'
      };

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This item cannot be equipped in this slot!');
    });
  });

  describe('Fallback and Edge Cases', () => {
    it('should handle unknown restriction type gracefully', () => {
      const context: RestrictionMessageContext = {};

      // @ts-expect-error Testing invalid restriction type
      const message = getRestrictionMessage('unknown', context);

      expect(message).toBe('This item cannot be equipped right now!');
    });

    it('should handle empty context object for level', () => {
      const context: RestrictionMessageContext = {};

      const message = getRestrictionMessage('level', context);

      expect(message).toBe('This item has a level requirement!');
    });

    it('should handle empty context object for class', () => {
      const context: RestrictionMessageContext = {};

      const message = getRestrictionMessage('class', context);

      expect(message).toBe('This item has class restrictions!');
    });

    it('should handle empty context object for stat', () => {
      const context: RestrictionMessageContext = {};

      const message = getRestrictionMessage('stat', context);

      expect(message).toBe('This item has stat requirements!');
    });

    it('should handle empty context object for slot', () => {
      const context: RestrictionMessageContext = {};

      const message = getRestrictionMessage('slot', context);

      expect(message).toBe('This item cannot be equipped in this slot!');
    });
  });

  describe('Age-Appropriate Language (7-12 years)', () => {
    it('should use simple, clear language for level restrictions', () => {
      const context: RestrictionMessageContext = {
        requiredLevel: 10,
        playerLevel: 5
      };

      const message = getRestrictionMessage('level', context);

      // Should be elementary-school appropriate
      expect(message).not.toMatch(/insufficient|inadequate|prohibited/i);
      expect(message).toMatch(/need/i); // Simple word
      expect(message).toMatch(/level/i); // Clear concept
    });

    it('should use encouraging tone with exclamation marks', () => {
      const messages = [
        getRestrictionMessage('level', { requiredLevel: 10, playerLevel: 5 }),
        getRestrictionMessage('class', { requiredClasses: ['warrior'], itemType: 'sword' }),
        getRestrictionMessage('stat', { statName: 'attack', requiredStatValue: 20, playerStatValue: 10 }),
        getRestrictionMessage('slot', { itemSlot: 'helmet', targetSlot: 'weapon' })
      ];

      messages.forEach(message => {
        expect(message).toMatch(/!/); // Exclamation marks are kid-friendly and encouraging
      });
    });

    it('should avoid scary or negative language', () => {
      const messages = [
        getRestrictionMessage('level', { requiredLevel: 10 }),
        getRestrictionMessage('class', { requiredClasses: ['mage'] }),
        getRestrictionMessage('stat', { statName: 'attack', requiredStatValue: 20 }),
        getRestrictionMessage('slot', { itemSlot: 'boots', targetSlot: 'weapon' })
      ];

      messages.forEach(message => {
        expect(message).not.toMatch(/forbidden|denied|rejected|blocked|error/i);
      });
    });

    it('should use second-person "you" to be friendly and direct', () => {
      const levelMessage = getRestrictionMessage('level', {
        requiredLevel: 10,
        playerLevel: 5
      });

      const statMessage = getRestrictionMessage('stat', {
        statName: 'attack',
        requiredStatValue: 20,
        playerStatValue: 15
      });

      expect(levelMessage).toMatch(/you/i);
      expect(statMessage).toMatch(/you/i);
    });

    it('should keep messages concise and readable', () => {
      const messages = [
        getRestrictionMessage('level', { requiredLevel: 10, playerLevel: 5 }),
        getRestrictionMessage('class', { requiredClasses: ['warrior', 'knight'], itemType: 'sword' }),
        getRestrictionMessage('stat', { statName: 'magicAttack', requiredStatValue: 20, playerStatValue: 10, itemType: 'wand' }),
        getRestrictionMessage('slot', { itemSlot: 'helmet', targetSlot: 'weapon' })
      ];

      messages.forEach(message => {
        // Messages should be 1-2 sentences, not paragraphs
        expect(message.split('.').length).toBeLessThanOrEqual(2);

        // Messages should be easy to read (reasonable length)
        expect(message.length).toBeLessThan(150);
      });
    });
  });

  describe('Integration with Formatting Helper Functions', () => {
    it('should correctly use formatClassList for class formatting', () => {
      const singleClass = getRestrictionMessage('class', {
        requiredClasses: ['warrior'],
        itemType: 'sword'
      });

      const twoClasses = getRestrictionMessage('class', {
        requiredClasses: ['warrior', 'knight'],
        itemType: 'shield'
      });

      const threeClasses = getRestrictionMessage('class', {
        requiredClasses: ['warrior', 'knight', 'paladin'],
        itemType: 'armor'
      });

      expect(singleClass).toMatch(/Warriors/); // Plural
      expect(twoClasses).toMatch(/Warriors and Knights/); // Proper "and"
      expect(threeClasses).toMatch(/Warriors, Knights, and Paladins/); // Oxford comma
    });

    it('should correctly use formatStatName for stat formatting', () => {
      const attack = getRestrictionMessage('stat', {
        statName: 'attack',
        requiredStatValue: 10
      });

      const magicAttack = getRestrictionMessage('stat', {
        statName: 'magicAttack',
        requiredStatValue: 15
      });

      const magicDefense = getRestrictionMessage('stat', {
        statName: 'magicDefense',
        requiredStatValue: 20
      });

      expect(attack).toMatch(/Attack/); // Capitalized
      expect(magicAttack).toMatch(/Magic Attack/); // Spaced correctly
      expect(magicDefense).toMatch(/Magic Defense/); // Spaced correctly
    });

    it('should correctly use formatSlotNameForDisplay for slot formatting', () => {
      const message1 = getRestrictionMessage('slot', {
        itemSlot: 'ring1',
        targetSlot: 'weapon'
      });

      const message2 = getRestrictionMessage('slot', {
        itemSlot: 'ring2',
        targetSlot: 'armor'
      });

      // Both ring1 and ring2 should be formatted as "ring"
      expect(message1).toMatch(/ring slot/);
      expect(message2).toMatch(/ring slot/);
      expect(message1).not.toMatch(/ring1/);
      expect(message2).not.toMatch(/ring2/);
    });

    it('should correctly use getArticle for a/an determination', () => {
      const aMessage = getRestrictionMessage('slot', {
        itemSlot: 'helmet',
        targetSlot: 'weapon'
      });

      const anMessage = getRestrictionMessage('slot', {
        itemSlot: 'armor',
        targetSlot: 'helmet'
      });

      expect(aMessage).toMatch(/a helmet/);
      expect(anMessage).toMatch(/an armor/);
    });
  });
});
