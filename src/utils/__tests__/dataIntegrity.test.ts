/**
 * Data Integrity Validation Tests
 * Tests for comprehensive data integrity validation system
 */

import {
  generateChecksum,
  verifyChecksum,
  validateDataIntegrity,
  validateGameStateStructure,
  attemptDataRecovery,
  sanitizeGameStateForCloud,
  DEFAULT_GAME_STATE_SCHEMA
} from '../dataIntegrity';
import { ReactGameState } from '../../types/game';

// Mock crypto.subtle for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(() => {
        // Return a mock hash buffer
        const hash = new ArrayBuffer(32);
        const view = new Uint8Array(hash);
        for (let i = 0; i < 32; i++) {
          view[i] = i;
        }
        return Promise.resolve(hash);
      })
    }
  }
});

describe('Data Integrity Validation', () => {
  let mockGameState: ReactGameState;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 10,
        experience: 5000,
        currentArea: 'forest',
        stats: {
          health: 100,
          mana: 50,
          strength: 15,
          agility: 12,
          intelligence: 8,
          defense: 10
        },
        equipment: {
          weapon: { id: 'sword', enchantments: [] },
          armor: { id: 'leather_armor', enchantments: [] },
          accessories: []
        }
      },
      inventory: {
        items: [
          { id: 'potion', quantity: 5 },
          { id: 'gold', quantity: 100 }
        ]
      },
      story: {
        currentChapter: 2,
        completedQuests: ['tutorial', 'first_quest'],
        activeQuests: [
          {
            id: 'main_quest',
            progress: 50,
            objectives: [
              { id: 'obj1', completed: true },
              { id: 'obj2', completed: false }
            ]
          }
        ]
      },
      gameFlags: {
        tutorial_completed: true,
        has_sword: true,
        level_5_reached: true
      },
      worldState: {
        areas: {
          forest: {
            explored: true,
            completion: 75,
            secrets: [
              { id: 'secret1', discovered: true },
              { id: 'secret2', discovered: false }
            ]
          }
        }
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } as ReactGameState;
  });

  describe('Checksum Generation and Verification', () => {
    it('should generate consistent checksums for same data', async () => {
      const data = { test: 'value', number: 42 };

      const checksum1 = await generateChecksum(data);
      const checksum2 = await generateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[0-9a-f]+$/); // Hex string
    });

    it('should generate different checksums for different data', async () => {
      const data1 = { test: 'value1' };
      const data2 = { test: 'value2' };

      const checksum1 = await generateChecksum(data1);
      const checksum2 = await generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should verify checksums correctly', async () => {
      const data = { test: 'value', array: [1, 2, 3] };
      const checksum = await generateChecksum(data);

      const isValid = await verifyChecksum(data, checksum);
      expect(isValid).toBe(true);

      const invalidChecksum = 'invalid_checksum';
      const isInvalid = await verifyChecksum(data, invalidChecksum);
      expect(isInvalid).toBe(false);
    });

    it('should handle string and object data consistently', async () => {
      const data = { test: 'value' };
      const dataString = JSON.stringify(data);

      const checksum1 = await generateChecksum(data);
      const checksum2 = await generateChecksum(dataString);

      expect(checksum1).toBe(checksum2);
    });
  });

  describe('Game State Structure Validation', () => {
    it('should validate correct game state structure', () => {
      const result = validateGameStateStructure(mockGameState);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.corruptedFields).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidState = { ...mockGameState };
      delete invalidState.player;

      const result = validateGameStateStructure(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: player');
      expect(result.corruptedFields).toContain('player');
    });

    it('should validate field types correctly', () => {
      const invalidState = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          level: 'not_a_number' // Should be number
        }
      };

      const result = validateGameStateStructure(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid type for field player.level'))).toBe(true);
      expect(result.corruptedFields).toContain('player.level');
    });

    it('should validate field constraints', () => {
      const invalidState = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          level: -5 // Below minimum
        }
      };

      const result = validateGameStateStructure(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('below minimum'))).toBe(true);
      expect(result.corruptedFields).toContain('player.level');
    });

    it('should detect deprecated fields', () => {
      const stateWithDeprecated = {
        ...mockGameState,
        oldPlayerData: 'deprecated_data'
      };

      const result = validateGameStateStructure(stateWithDeprecated);

      expect(result.warnings).toContain('Deprecated field found: oldPlayerData');
    });

    it('should perform deep validation when enabled', () => {
      const invalidState = {
        ...mockGameState,
        inventory: {
          items: [
            { id: 'valid_item', quantity: 5 },
            { quantity: 3 }, // Missing id
            'invalid_item' // Not an object
          ]
        }
      };

      const result = validateGameStateStructure(invalidState, DEFAULT_GAME_STATE_SCHEMA, {
        deepValidation: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Missing or invalid item ID'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid item at inventory.items'))).toBe(true);
    });

    it('should respect strict mode settings', () => {
      const stateWithWarnings = {
        ...mockGameState,
        oldPlayerData: 'deprecated_data'
      };

      const result = validateGameStateStructure(stateWithWarnings, DEFAULT_GAME_STATE_SCHEMA, {
        strictMode: true
      });

      expect(result.isValid).toBe(false); // Should fail in strict mode due to warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Data Integrity Validation', () => {
    it('should validate data integrity with correct checksum', async () => {
      const checksum = await generateChecksum(mockGameState);
      const result = await validateDataIntegrity(mockGameState, checksum);

      expect(result.isValid).toBe(true);
      expect(result.checksum).toBe(checksum);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect checksum mismatches', async () => {
      const wrongChecksum = 'wrong_checksum';
      const result = await validateDataIntegrity(mockGameState, wrongChecksum);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data checksum mismatch - possible corruption detected');
      expect(result.corruptedFields).toContain('_checksum');
    });

    it('should combine structure and checksum validation', async () => {
      const invalidState = { ...mockGameState };
      delete invalidState.player;

      const result = await validateDataIntegrity(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Missing required field: player'))).toBe(true);
    });

    it('should attempt data recovery when enabled', async () => {
      const corruptedState = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          level: 'corrupted_level' // Invalid type
        }
      };

      const result = await validateDataIntegrity(corruptedState, undefined, undefined, {
        enableRecovery: true
      });

      expect(result.recoveredData).toBeDefined();
      expect(result.warnings.some(warning => warning.includes('recovery attempted'))).toBe(true);
    });
  });

  describe('Data Recovery System', () => {
    it('should recover missing required fields', async () => {
      const corruptedState = { ...mockGameState };
      delete corruptedState.player;

      const validationResult = validateGameStateStructure(corruptedState);
      const recoveryResult = attemptDataRecovery(corruptedState, validationResult);

      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.data.player).toBeDefined();
      expect(recoveryResult.data.player.name).toBe('Unknown Player');
    });

    it('should fix invalid field types', async () => {
      const corruptedState = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          level: 'invalid_level',
          experience: -100
        }
      };

      const validationResult = validateGameStateStructure(corruptedState);
      const recoveryResult = attemptDataRecovery(corruptedState, validationResult);

      expect(recoveryResult.recovered).toBe(true);
      expect(typeof recoveryResult.data.player.level).toBe('number');
      expect(recoveryResult.data.player.level).toBe(1);
      expect(recoveryResult.data.player.experience).toBe(0);
    });

    it('should restore corrupted arrays', async () => {
      const corruptedState = {
        ...mockGameState,
        inventory: {
          items: 'not_an_array'
        },
        story: {
          ...mockGameState.story,
          completedQuests: null
        }
      };

      const validationResult = validateGameStateStructure(corruptedState);
      const recoveryResult = attemptDataRecovery(corruptedState, validationResult);

      expect(recoveryResult.recovered).toBe(true);
      expect(Array.isArray(recoveryResult.data.inventory.items)).toBe(true);
      expect(Array.isArray(recoveryResult.data.story.completedQuests)).toBe(true);
    });

    it('should handle recovery failures gracefully', async () => {
      const validationResult = {
        isValid: false,
        checksum: '',
        errors: ['Unknown error'],
        warnings: [],
        corruptedFields: ['unknown_field']
      };

      const recoveryResult = attemptDataRecovery(mockGameState, validationResult);

      expect(recoveryResult.recovered).toBe(false);
      expect(recoveryResult.data).toBe(mockGameState);
    });
  });

  describe('Data Sanitization', () => {
    it('should remove temporary data', () => {
      const stateWithTemp = {
        ...mockGameState,
        temporaryData: { temp: 'value' },
        sessionData: { session: 'data' }
      } as any;

      const sanitized = sanitizeGameStateForCloud(stateWithTemp);

      expect(sanitized.temporaryData).toBeUndefined();
      expect(sanitized.sessionData).toBeUndefined();
      expect(sanitized.player).toBeDefined();
    });

    it('should update timestamp', () => {
      const oldTimestamp = '2023-01-01T00:00:00.000Z';
      const stateWithOldTimestamp = {
        ...mockGameState,
        timestamp: oldTimestamp
      };

      const sanitized = sanitizeGameStateForCloud(stateWithOldTimestamp);

      expect(sanitized.timestamp).not.toBe(oldTimestamp);
      expect(new Date(sanitized.timestamp).getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should limit large arrays', () => {
      const largeItems = Array.from({ length: 1500 }, (_, i) => ({ id: `item_${i}`, quantity: 1 }));
      const stateWithLargeInventory = {
        ...mockGameState,
        inventory: { items: largeItems }
      };

      const sanitized = sanitizeGameStateForCloud(stateWithLargeInventory);

      expect(sanitized.inventory.items.length).toBe(1000);
    });

    it('should preserve valid data structure', () => {
      const sanitized = sanitizeGameStateForCloud(mockGameState);

      expect(sanitized.player.name).toBe(mockGameState.player.name);
      expect(sanitized.player.level).toBe(mockGameState.player.level);
      expect(sanitized.inventory.items).toEqual(mockGameState.inventory.items);
      expect(sanitized.story.currentChapter).toBe(mockGameState.story.currentChapter);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large game states efficiently', async () => {
      const largeState = {
        ...mockGameState,
        inventory: {
          items: Array.from({ length: 500 }, (_, i) => ({ id: `item_${i}`, quantity: Math.floor(Math.random() * 10) + 1 }))
        },
        gameFlags: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`flag_${i}`, Math.random() > 0.5])
        )
      };

      const startTime = performance.now();
      const result = await validateDataIntegrity(largeState);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle circular references gracefully', async () => {
      const circularState: any = { ...mockGameState };
      circularState.self = circularState; // Create circular reference

      try {
        await generateChecksum(circularState);
        // If we get here, JSON.stringify handled it (it should throw)
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError); // Expected for circular reference
      }
    });

    it('should handle null and undefined values', () => {
      const stateWithNulls = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          equipment: null
        },
        optionalField: undefined
      } as any;

      const result = validateGameStateStructure(stateWithNulls);

      // Should handle nulls gracefully in validation
      expect(result).toBeDefined();
    });

    it('should validate empty game states', () => {
      const emptyState = {} as any;

      const result = validateGameStateStructure(emptyState);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.corruptedFields.length).toBeGreaterThan(0);
    });
  });
});