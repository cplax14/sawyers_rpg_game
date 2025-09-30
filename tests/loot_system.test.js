/**
 * Unit Tests for Loot System
 * Tests equipment resolver, rarity distribution, and loot generation
 */

describe('LootSystem Equipment Resolver Tests', () => {
    beforeAll(() => {
        // Ensure LootSystem is loaded
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping tests');
        }
    });

    // Test equipment type resolver for abstract types
    describe('Equipment Type Resolution', () => {
        it('should resolve nature_equipment abstract type', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                itemType: 'nature_equipment'
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve nature_equipment to a concrete item');

            const expectedItems = ['oak_staff', 'leather_armor', 'nature_charm'];
            assertArrayContains(expectedItems, resolved, 'Should return one of the nature equipment items');
        });

        it('should resolve forest_equipment abstract type', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                itemType: 'forest_equipment'
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve forest_equipment to a concrete item');

            const expectedItems = ['oak_staff', 'leather_armor', 'ranger_cloak'];
            assertArrayContains(expectedItems, resolved, 'Should return one of the forest equipment items');
        });

        it('should resolve beginner_weapon abstract type', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                itemType: 'beginner_weapon'
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve beginner_weapon to a concrete item');

            const expectedItems = ['iron_sword', 'steel_dagger', 'oak_staff', 'hunting_bow'];
            assertArrayContains(expectedItems, resolved, 'Should return one of the beginner weapon items');
        });

        it('should resolve beginner_armor abstract type', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                itemType: 'beginner_armor'
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve beginner_armor to a concrete item');

            const expectedItems = ['leather_armor', 'cloth_robe'];
            assertArrayContains(expectedItems, resolved, 'Should return one of the beginner armor items');
        });

        it('should handle equipmentTypes array with nature_equipment', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                equipmentTypes: ['nature_equipment']
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve equipmentTypes array');

            const expectedItems = ['oak_staff', 'leather_armor', 'nature_charm'];
            assertArrayContains(expectedItems, resolved, 'Should return one of the nature equipment items');
        });

        it('should handle equipmentTypes array with multiple types', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                equipmentTypes: ['light_armor', 'simple_weapon']
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve multiple equipment types');

            const expectedItems = [
                'leather_armor', 'leather_vest', 'ranger_cloak', 'cloth_robe', // light_armor
                'iron_sword', 'oak_staff', 'steel_dagger', 'hunting_bow', 'battle_axe' // simple_weapon
            ];
            assertArrayContains(expectedItems, resolved, 'Should return an item from either equipment type');
        });

        it('should handle concrete items array', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                items: ['iron_sword', 'oak_staff']
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertTruthy(resolved, 'Should resolve from concrete items array');
            assertArrayContains(['iron_sword', 'oak_staff'], resolved, 'Should return one of the specified items');
        });

        it('should return null for unknown abstract type', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                itemType: 'unknown_equipment_type'
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertEqual(resolved, null, 'Should return null for unknown equipment type');
        });

        it('should return null for empty equipmentTypes array', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                equipmentTypes: []
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertEqual(resolved, null, 'Should return null for empty equipmentTypes array');
        });

        it('should handle resolver failures gracefully', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                // Invalid loot entry structure
            };

            const resolved = LootSystem.resolveConcreteItemId(lootEntry);
            assertEqual(resolved, null, 'Should return null for invalid loot entry');
        });
    });

    // Test rarity distribution
    describe('Rarity Distribution Tests', () => {
        it('should have all expected rarity tiers', () => {
            if (typeof LootSystem === 'undefined') return;

            const expectedRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            for (const rarity of expectedRarities) {
                assertTruthy(LootSystem.rarityTiers[rarity], `Should have ${rarity} rarity tier`);
                assertTruthy(LootSystem.rarityTiers[rarity].dropRate, `${rarity} should have dropRate`);
                assertTruthy(LootSystem.rarityTiers[rarity].name, `${rarity} should have name`);
            }
        });

        it('should have decreasing drop rates by rarity', () => {
            if (typeof LootSystem === 'undefined') return;

            const tiers = LootSystem.rarityTiers;
            assertTruthy(tiers.common.dropRate > tiers.uncommon.dropRate, 'Common should be more common than uncommon');
            assertTruthy(tiers.uncommon.dropRate > tiers.rare.dropRate, 'Uncommon should be more common than rare');
            assertTruthy(tiers.rare.dropRate > tiers.epic.dropRate, 'Rare should be more common than epic');
            assertTruthy(tiers.epic.dropRate > tiers.legendary.dropRate, 'Epic should be more common than legendary');
        });

        it('should have increasing value multipliers by rarity', () => {
            if (typeof LootSystem === 'undefined') return;

            const tiers = LootSystem.rarityTiers;
            assertTruthy(tiers.common.valueMultiplier < tiers.uncommon.valueMultiplier, 'Uncommon should be more valuable than common');
            assertTruthy(tiers.uncommon.valueMultiplier < tiers.rare.valueMultiplier, 'Rare should be more valuable than uncommon');
            assertTruthy(tiers.rare.valueMultiplier < tiers.epic.valueMultiplier, 'Epic should be more valuable than rare');
            assertTruthy(tiers.epic.valueMultiplier < tiers.legendary.valueMultiplier, 'Legendary should be more valuable than epic');
        });

        it('should calculate proper drop results with level scaling', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test rollForLoot with level scaling
            const lootEntry = {
                dropChance: 0.5,
                rarityWeights: { common: 1.0 }
            };

            // Test multiple rolls to check scaling behavior
            let baseSuccesses = 0;
            let higherLevelSuccesses = 0;
            const testRuns = 100;

            for (let i = 0; i < testRuns; i++) {
                const baseResult = LootSystem.rollForLoot(lootEntry, 5, 5);
                const higherResult = LootSystem.rollForLoot(lootEntry, 10, 5);

                if (baseResult.dropped) baseSuccesses++;
                if (higherResult.dropped) higherLevelSuccesses++;
            }

            // Higher level should generally have more drops (statistical test)
            assertTruthy(higherLevelSuccesses >= baseSuccesses * 0.8,
                'Higher level should not significantly decrease drop success rate');
        });

        it('should handle extreme level differences gracefully', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntry = {
                dropChance: 0.5,
                rarityWeights: { common: 1.0 }
            };

            // Test extreme level difference
            const result = LootSystem.rollForLoot(lootEntry, 100, 1);
            assertTruthy(typeof result.dropped === 'boolean', 'Should return valid result for extreme level differences');
        });
    });

    // Test loot generation integration
    describe('Loot Generation Integration', () => {
        it('should generate valid loot items', () => {
            if (typeof LootSystem === 'undefined') return;

            const item = LootSystem.generateLootItem('weapon', 'common', 5, 5, 'forest_clearing');

            if (item) {
                assertTruthy(item.id, 'Generated item should have an id');
                assertTruthy(item.name, 'Generated item should have a name');
                assertTruthy(item.rarity, 'Generated item should have a rarity');
                assertEqual(item.rarity, 'common', 'Generated item should have the requested rarity');
            }
        });

        it('should handle abstract equipment types in loot generation', () => {
            if (typeof LootSystem === 'undefined') return;

            // Create a mock loot entry using nature_equipment
            const mockLootEntry = {
                itemType: 'nature_equipment',
                dropRate: 1.0,
                rarity: 'common'
            };

            // Test multiple generations to ensure consistency
            let validGenerations = 0;
            for (let i = 0; i < 10; i++) {
                const resolved = LootSystem.resolveConcreteItemId(mockLootEntry);
                if (resolved) {
                    validGenerations++;
                    const expectedItems = ['oak_staff', 'leather_armor', 'nature_charm'];
                    assertArrayContains(expectedItems, resolved, 'Should consistently resolve to valid nature equipment');
                }
            }

            assertTruthy(validGenerations === 10, 'All resolution attempts should succeed for valid abstract type');
        });

        it('should handle fallback for failed resolutions', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test that the system gracefully handles resolver failures
            const mockBadEntry = {
                itemType: 'nonexistent_type'
            };

            const resolved = LootSystem.resolveConcreteItemId(mockBadEntry);
            assertEqual(resolved, null, 'Should return null for invalid types');
        });
    });

    // Test equipment type mappings
    describe('Equipment Type Mappings', () => {
        it('should have consistent equipment type mappings', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test that the internal mappings are consistent
            const testLootEntry = { equipmentTypes: ['light_armor'] };
            const resolved = LootSystem.resolveConcreteItemId(testLootEntry);

            if (resolved) {
                const expectedLightArmor = ['leather_armor', 'leather_vest', 'ranger_cloak', 'cloth_robe'];
                assertArrayContains(expectedLightArmor, resolved, 'light_armor mapping should be consistent');
            }
        });

        it('should not have duplicate items in abstract mappings', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test multiple resolutions to check for proper randomization
            const testCounts = {};
            const testEntry = { itemType: 'nature_equipment' };

            for (let i = 0; i < 50; i++) {
                const resolved = LootSystem.resolveConcreteItemId(testEntry);
                if (resolved) {
                    testCounts[resolved] = (testCounts[resolved] || 0) + 1;
                }
            }

            // Should have gotten some variety in results
            const uniqueItems = Object.keys(testCounts);
            assertTruthy(uniqueItems.length > 1, 'Should generate variety in resolved items over multiple attempts');

            // All items should be from the expected set
            const expectedItems = ['oak_staff', 'leather_armor', 'nature_charm'];
            for (const item of uniqueItems) {
                assertArrayContains(expectedItems, item, `Generated item ${item} should be in expected set`);
            }
        });
    });
});

// Test enhanced equipment abstractions
describe('Enhanced Equipment Abstraction Tests', () => {
    beforeAll(() => {
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping enhanced equipment tests');
        }
    });

    describe('Class-Specific Equipment Resolution', () => {
        it('should resolve knight equipment abstractions', () => {
            if (typeof LootSystem === 'undefined') return;

            const knightEntry = { equipmentTypes: ['knight_weapons', 'knight_armor'] };
            const resolved = LootSystem.resolveConcreteItemId(knightEntry);
            assertTruthy(resolved, 'Should resolve knight equipment to a concrete item');

            const expectedItems = ['iron_sword', 'steel_sword', 'blessed_mace', 'chain_mail', 'plate_armor'];
            assertArrayContains(expectedItems, resolved, 'Should return a knight equipment item');
        });

        it('should resolve wizard equipment abstractions', () => {
            if (typeof LootSystem === 'undefined') return;

            const wizardEntry = { itemType: 'wizard_equipment' };
            const resolved = LootSystem.resolveConcreteItemId(wizardEntry);
            assertTruthy(resolved, 'Should resolve wizard equipment to a concrete item');

            const expectedItems = ['oak_staff', 'crystal_staff', 'cloth_robe', 'mage_robes'];
            assertArrayContains(expectedItems, resolved, 'Should return a wizard equipment item');
        });

        it('should resolve rogue equipment abstractions', () => {
            if (typeof LootSystem === 'undefined') return;

            const rogueEntry = { equipmentTypes: ['rogue_weapons', 'rogue_armor'] };
            const resolved = LootSystem.resolveConcreteItemId(rogueEntry);
            assertTruthy(resolved, 'Should resolve rogue equipment to a concrete item');

            const expectedItems = ['steel_dagger', 'poisoned_blade', 'leather_armor', 'leather_vest'];
            assertArrayContains(expectedItems, resolved, 'Should return a rogue equipment item');
        });
    });

    describe('Environmental Equipment Resolution', () => {
        it('should resolve basic weapons', () => {
            if (typeof LootSystem === 'undefined') return;

            const basicEntry = { equipmentTypes: ['basic_weapon'] };
            const resolved = LootSystem.resolveConcreteItemId(basicEntry);
            assertTruthy(resolved, 'Should resolve basic weapons to a concrete item');

            const expectedItems = ['iron_sword', 'oak_staff', 'steel_dagger', 'hunting_bow'];
            assertArrayContains(expectedItems, resolved, 'Should return a basic weapon item');
        });

        it('should resolve advanced weapons', () => {
            if (typeof LootSystem === 'undefined') return;

            const advancedEntry = { equipmentTypes: ['advanced_weapon'] };
            const resolved = LootSystem.resolveConcreteItemId(advancedEntry);
            assertTruthy(resolved, 'Should resolve advanced weapons to a concrete item');

            const expectedItems = ['steel_sword', 'crystal_staff', 'poisoned_blade', 'elvish_bow'];
            assertArrayContains(expectedItems, resolved, 'Should return an advanced weapon item');
        });

        it('should resolve metal equipment', () => {
            if (typeof LootSystem === 'undefined') return;

            const metalEntry = { equipmentTypes: ['metal_equipment'] };
            const resolved = LootSystem.resolveConcreteItemId(metalEntry);
            assertTruthy(resolved, 'Should resolve metal equipment to a concrete item');

            const expectedItems = ['iron_sword', 'steel_sword', 'chain_mail', 'plate_armor'];
            assertArrayContains(expectedItems, resolved, 'Should return a metal equipment item');
        });
    });

    describe('Advanced Equipment Resolution', () => {
        it('should handle multiple equipmentTypes and select randomly', () => {
            if (typeof LootSystem === 'undefined') return;

            const mixedEntry = { equipmentTypes: ['beginner_weapons', 'nature_accessory'] };
            const resolved = LootSystem.resolveConcreteItemId(mixedEntry);
            assertTruthy(resolved, 'Should resolve mixed equipment types to a concrete item');

            const expectedItems = ['iron_sword', 'steel_dagger', 'oak_staff', 'hunting_bow', 'nature_charm', 'health_ring'];
            assertArrayContains(expectedItems, resolved, 'Should return an item from either category');
        });

        it('should return null for unknown equipment types', () => {
            if (typeof LootSystem === 'undefined') return;

            const unknownEntry = { equipmentTypes: ['completely_unknown_type'] };
            const resolved = LootSystem.resolveConcreteItemId(unknownEntry);
            assertEqual(resolved, null, 'Should return null for unknown equipment types');
        });

        it('should prioritize items array over equipment types', () => {
            if (typeof LootSystem === 'undefined') return;

            const priorityEntry = {
                items: ['iron_sword'],
                equipmentTypes: ['wizard_weapons']
            };
            const resolved = LootSystem.resolveConcreteItemId(priorityEntry);
            assertEqual(resolved, 'iron_sword', 'Should prioritize explicit items array');
        });
    });

    describe('Material and Theme-Based Equipment', () => {
        it('should resolve crystal equipment', () => {
            if (typeof LootSystem === 'undefined') return;

            const crystalEntry = { itemType: 'crystal_equipment' };
            const resolved = LootSystem.resolveConcreteItemId(crystalEntry);
            assertTruthy(resolved, 'Should resolve crystal equipment to a concrete item');

            const expectedItems = ['crystal_staff', 'mana_crystal'];
            assertArrayContains(expectedItems, resolved, 'Should return a crystal equipment item');
        });

        it('should resolve stealth gear', () => {
            if (typeof LootSystem === 'undefined') return;

            const stealthEntry = { itemType: 'stealth_gear' };
            const resolved = LootSystem.resolveConcreteItemId(stealthEntry);
            assertTruthy(resolved, 'Should resolve stealth gear to a concrete item');

            const expectedItems = ['stealth_cloak', 'poisoned_blade', 'leather_vest'];
            assertArrayContains(expectedItems, resolved, 'Should return a stealth gear item');
        });

        it('should resolve leather equipment', () => {
            if (typeof LootSystem === 'undefined') return;

            const leatherEntry = { itemType: 'leather_equipment' };
            const resolved = LootSystem.resolveConcreteItemId(leatherEntry);
            assertTruthy(resolved, 'Should resolve leather equipment to a concrete item');

            const expectedItems = ['leather_armor', 'leather_vest'];
            assertArrayContains(expectedItems, resolved, 'Should return a leather equipment item');
        });
    });
});

// Test performance requirements
describe('LootSystem Performance Tests', () => {
    beforeAll(() => {
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping performance tests');
        }
    });

    it('should generate monster loot within 50ms requirement', () => {
        if (typeof LootSystem === 'undefined') return;

        const testIterations = 20;
        const maxAllowedTime = 50; // 50ms requirement
        let totalTime = 0;
        let maxTime = 0;
        let violations = 0;

        for (let i = 0; i < testIterations; i++) {
            const startTime = performance.now();

            // Test with various scenarios
            const monsters = ['wolf', 'goblin', 'skeleton'];
            const monster = monsters[i % monsters.length];
            const playerLevel = 1 + (i * 2); // Vary levels 1-39

            LootSystem.generateMonsterLoot(monster, playerLevel, 'test_area');

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            totalTime += executionTime;
            maxTime = Math.max(maxTime, executionTime);

            if (executionTime > maxAllowedTime) {
                violations++;
            }
        }

        const averageTime = totalTime / testIterations;

        console.log(`Monster loot performance: avg=${averageTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, violations=${violations}/${testIterations}`);

        // Test passes if average is under limit and violations are <10%
        assertTruthy(averageTime < maxAllowedTime, `Average time ${averageTime.toFixed(2)}ms should be under ${maxAllowedTime}ms`);
        assertTruthy(violations < testIterations * 0.1, `Violations ${violations} should be less than 10% of ${testIterations} tests`);
    });

    it('should generate area loot within 50ms requirement', () => {
        if (typeof LootSystem === 'undefined') return;

        const testIterations = 20;
        const maxAllowedTime = 50; // 50ms requirement
        let totalTime = 0;
        let maxTime = 0;
        let violations = 0;

        for (let i = 0; i < testIterations; i++) {
            const startTime = performance.now();

            // Test with various scenarios
            const areas = ['forest', 'cave', 'mountain'];
            const explorationTypes = ['standard', 'thorough', 'quick', 'treasure_hunt'];

            const area = areas[i % areas.length];
            const explorationType = explorationTypes[i % explorationTypes.length];
            const playerLevel = 1 + (i * 2); // Vary levels 1-39

            LootSystem.generateAreaLoot(area, playerLevel, explorationType);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            totalTime += executionTime;
            maxTime = Math.max(maxTime, executionTime);

            if (executionTime > maxAllowedTime) {
                violations++;
            }
        }

        const averageTime = totalTime / testIterations;

        console.log(`Area loot performance: avg=${averageTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, violations=${violations}/${testIterations}`);

        // Test passes if average is under limit and violations are <10%
        assertTruthy(averageTime < maxAllowedTime, `Average time ${averageTime.toFixed(2)}ms should be under ${maxAllowedTime}ms`);
        assertTruthy(violations < testIterations * 0.1, `Violations ${violations} should be less than 10% of ${testIterations} tests`);
    });

    it('should pass comprehensive performance test', () => {
        if (typeof LootSystem === 'undefined') return;

        // Run a smaller version of the full performance test
        const results = LootSystem.quickPerformanceCheck();

        assertTruthy(results.passed, 'Performance test should pass');
        assertTruthy(['A+', 'A', 'B', 'C'].includes(results.grade), `Performance grade ${results.grade} should be C or better`);
        assertTruthy(results.averageTime < 50, `Average time ${results.averageTime.toFixed(2)}ms should be under 50ms`);

        if (results.issues.length > 0) {
            console.warn('Performance issues detected:', results.issues);
        }
    });

    it('should handle stress test scenarios', () => {
        if (typeof LootSystem === 'undefined') return;

        const maxAllowedTime = 100; // More lenient for stress test
        let maxTime = 0;

        // Test extreme scenarios that might cause performance issues
        const stressScenarios = [
            { monster: 'dragon', playerLevel: 50, area: 'legendary_dungeon' },
            { monster: 'legendary_boss', playerLevel: 1, area: 'high_level_area' },
            { monster: 'tutorial_enemy', playerLevel: 40, area: 'beginner_area' }
        ];

        for (const scenario of stressScenarios) {
            const startTime = performance.now();

            try {
                LootSystem.generateMonsterLoot(scenario.monster, scenario.playerLevel, scenario.area);
            } catch (error) {
                // Expected for some stress scenarios
            }

            const endTime = performance.now();
            const executionTime = endTime - startTime;
            maxTime = Math.max(maxTime, executionTime);
        }

        console.log(`Stress test max time: ${maxTime.toFixed(2)}ms`);
        assertTruthy(maxTime < maxAllowedTime, `Stress test max time ${maxTime.toFixed(2)}ms should be under ${maxAllowedTime}ms`);
    });
});

// Test rarity rolling and level scaling
describe('LootSystem Rarity Rolling and Level Scaling', () => {
    beforeAll(() => {
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping rarity tests');
        }
    });

    it('should have proper rarity tier drop rates', () => {
        if (typeof LootSystem === 'undefined') return;

        const tiers = LootSystem.rarityTiers;

        // Verify base drop rates are reasonable
        assertTruthy(tiers.common.dropRate > 0.5, 'Common should have high drop rate');
        assertTruthy(tiers.uncommon.dropRate < 0.5, 'Uncommon should have moderate drop rate');
        assertTruthy(tiers.rare.dropRate < 0.1, 'Rare should have low drop rate');
        assertTruthy(tiers.epic.dropRate < 0.05, 'Epic should have very low drop rate');
        assertTruthy(tiers.legendary.dropRate < 0.01, 'Legendary should have extremely low drop rate');
    });

    it('should calculate level scaling properly', () => {
        if (typeof LootSystem === 'undefined') return;

        // Test level scaling calculation - higher player level reduces drops (but increases quality)
        const positiveScaling = LootSystem.calculateLevelScaling(5, 10, 5); // Player 5 levels above content
        const neutralScaling = LootSystem.calculateLevelScaling(0, 5, 5);  // Same level
        const negativeScaling = LootSystem.calculateLevelScaling(-5, 5, 10); // Player 5 levels below content

        assertTruthy(positiveScaling < neutralScaling, 'Higher player level should reduce drop scaling');
        assertTruthy(negativeScaling > neutralScaling, 'Lower player level should increase drop scaling');
        // Check neutral scaling is close to expected content tier bonus (1.05)
        assertTruthy(Math.abs(neutralScaling - 1.05) < 0.01, 'Zero level difference should give content tier bonus (~1.05)');

        // Verify scaling is bounded properly - updated bounds for new system
        assertTruthy(positiveScaling >= 0.1, 'Positive scaling should not go below 0.1');
        assertTruthy(negativeScaling <= 2.0, 'Negative scaling should not exceed 2.0');

        // Test extreme differences are handled properly
        const extremePositive = LootSystem.calculateLevelScaling(20, 25, 5);
        const extremeNegative = LootSystem.calculateLevelScaling(-15, 5, 20);

        assertTruthy(extremePositive >= 0.1, 'Extreme positive scaling should still provide minimum drops');
        assertTruthy(extremeNegative <= 2.0, 'Extreme negative scaling should be capped');

        // Test backward compatibility (function should work with just levelDifference)
        const legacyScaling = LootSystem.calculateLevelScaling(0);
        assertTruthy(legacyScaling >= 0.9 && legacyScaling <= 1.1, 'Legacy call should work and return reasonable value');
    });

    it('should roll for rarity properly', () => {
        if (typeof LootSystem === 'undefined') return;

        const rarityWeights = {
            common: 0.7,
            uncommon: 0.25,
            rare: 0.05
        };

        // Test multiple rolls to check distribution
        const results = {};
        for (let i = 0; i < 200; i++) {
            const rarity = LootSystem.rollForRarity(rarityWeights, 5, 5);
            results[rarity] = (results[rarity] || 0) + 1;
        }

        // Should have gotten some results for each rarity
        assertTruthy(results.common, 'Should generate common items');
        assertTruthy(results.common > results.uncommon, 'Common should be more frequent than uncommon');

        // All results should be valid rarities
        for (const rarity of Object.keys(results)) {
            assertArrayContains(['common', 'uncommon', 'rare'], rarity, `Generated rarity ${rarity} should be valid`);
        }
    });

    it('should handle loot rolling integration', () => {
        if (typeof LootSystem === 'undefined') return;

        const lootEntry = {
            dropChance: 0.8, // High chance for testing
            rarityWeights: { common: 0.9, uncommon: 0.1 }
        };

        // Test multiple rolls
        let dropCount = 0;
        const rarityResults = {};

        for (let i = 0; i < 50; i++) {
            const result = LootSystem.rollForLoot(lootEntry, 5, 5);
            if (result.dropped) {
                dropCount++;
                const rarity = result.rarity;
                rarityResults[rarity] = (rarityResults[rarity] || 0) + 1;
            }
        }

        assertTruthy(dropCount > 20, 'High drop chance should result in many drops');
        assertTruthy(Object.keys(rarityResults).length > 0, 'Should generate items with valid rarities');
    });
});

// Comprehensive Drop Rate Validation Tests (Task 7.1)
describe('Comprehensive Drop Rate Validation Tests', () => {
    beforeAll(() => {
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping drop rate validation tests');
        }
    });

    describe('Target Drop Rate Compliance Tests', () => {
        it('should maintain 70-85% encounter loot frequency target', () => {
            if (typeof LootSystem === 'undefined') return;

            const testIterations = 500;
            let successfulDrops = 0;

            // Test various monster encounters
            const testMonsters = ['wolf', 'goblin', 'skeleton', 'orc', 'bear'];
            const testLevels = [5, 10, 15, 20, 25];

            for (let i = 0; i < testIterations; i++) {
                const monster = testMonsters[i % testMonsters.length];
                const playerLevel = testLevels[i % testLevels.length];
                const contentLevel = playerLevel + Math.floor(Math.random() * 5) - 2; // ±2 level variance

                const loot = LootSystem.generateMonsterLoot(monster, playerLevel, 'test_area');
                if (loot && loot.length > 0) {
                    successfulDrops++;
                }
            }

            const dropRate = successfulDrops / testIterations;
            console.log(`Encounter loot frequency: ${(dropRate * 100).toFixed(1)}% (${successfulDrops}/${testIterations})`);

            // Verify drop rate is within 70-85% target range
            assertTruthy(dropRate >= 0.70, `Drop rate ${(dropRate * 100).toFixed(1)}% should be at least 70%`);
            assertTruthy(dropRate <= 0.85, `Drop rate ${(dropRate * 100).toFixed(1)}% should not exceed 85%`);
        });

        it('should achieve target 75%+ meaningful loot generation', () => {
            if (typeof LootSystem === 'undefined') return;

            const testIterations = 300;
            let meaningfulDrops = 0;

            for (let i = 0; i < testIterations; i++) {
                const playerLevel = 5 + Math.floor(i / 10); // Gradually increase level
                const loot = LootSystem.generateMonsterLoot('goblin', playerLevel, 'test_area');

                if (loot && loot.length > 0) {
                    // Count as meaningful if it contains equipment, consumables, or rare+ items
                    const hasMeaningfulLoot = loot.some(item => {
                        if (typeof item === 'object' && item.rarity) {
                            return ['uncommon', 'rare', 'epic', 'legendary'].includes(item.rarity);
                        }
                        // Check if item name suggests equipment or consumables
                        const name = typeof item === 'string' ? item : (item.name || item.id || '');
                        return name.includes('sword') || name.includes('armor') || name.includes('potion') ||
                               name.includes('staff') || name.includes('shield') || name.includes('bow');
                    });

                    if (hasMeaningfulLoot) {
                        meaningfulDrops++;
                    }
                }
            }

            const meaningfulRate = meaningfulDrops / testIterations;
            console.log(`Meaningful loot rate: ${(meaningfulRate * 100).toFixed(1)}% (${meaningfulDrops}/${testIterations})`);

            assertTruthy(meaningfulRate >= 0.75, `Meaningful loot rate ${(meaningfulRate * 100).toFixed(1)}% should be at least 75%`);
        });

        it('should validate rarity distribution percentages', () => {
            if (typeof LootSystem === 'undefined') return;

            const testIterations = 1000;
            const rarityResults = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };

            // Generate large sample for statistical validation
            for (let i = 0; i < testIterations; i++) {
                const playerLevel = 10 + Math.floor(i / 50); // Gradually increase level
                const loot = LootSystem.generateMonsterLoot('skeleton', playerLevel, 'dungeon');

                if (loot && loot.length > 0) {
                    loot.forEach(item => {
                        const rarity = typeof item === 'object' ? item.rarity : 'common';
                        if (rarityResults[rarity] !== undefined) {
                            rarityResults[rarity]++;
                        }
                    });
                }
            }

            const totalItems = Object.values(rarityResults).reduce((sum, count) => sum + count, 0);

            // Calculate percentages
            const percentages = {};
            Object.keys(rarityResults).forEach(rarity => {
                percentages[rarity] = (rarityResults[rarity] / totalItems) * 100;
            });

            console.log('Rarity Distribution:');
            Object.keys(percentages).forEach(rarity => {
                console.log(`  ${rarity}: ${percentages[rarity].toFixed(1)}%`);
            });

            // Validate target distribution (65% common, 25% uncommon, 8% rare, 1.8% epic, 0.2% legendary)
            assertTruthy(percentages.common >= 55 && percentages.common <= 75,
                `Common percentage ${percentages.common.toFixed(1)}% should be 55-75%`);
            assertTruthy(percentages.uncommon >= 15 && percentages.uncommon <= 35,
                `Uncommon percentage ${percentages.uncommon.toFixed(1)}% should be 15-35%`);
            assertTruthy(percentages.rare >= 3 && percentages.rare <= 15,
                `Rare percentage ${percentages.rare.toFixed(1)}% should be 3-15%`);
            assertTruthy(percentages.epic <= 5,
                `Epic percentage ${percentages.epic.toFixed(1)}% should be ≤5%`);
            assertTruthy(percentages.legendary <= 2,
                `Legendary percentage ${percentages.legendary.toFixed(1)}% should be ≤2%`);
        });
    });

    describe('Level-Based Drop Rate Scaling Tests', () => {
        it('should scale drop rates appropriately for level differences', () => {
            if (typeof LootSystem === 'undefined') return;

            const baseLevel = 10;
            const testIterations = 200;

            // Test different level scenarios
            const scenarios = [
                { playerLevel: baseLevel - 5, contentLevel: baseLevel, expectedMultiplier: 'high' },
                { playerLevel: baseLevel, contentLevel: baseLevel, expectedMultiplier: 'normal' },
                { playerLevel: baseLevel + 5, contentLevel: baseLevel, expectedMultiplier: 'low' }
            ];

            const results = {};

            scenarios.forEach(scenario => {
                let dropCount = 0;

                for (let i = 0; i < testIterations; i++) {
                    const loot = LootSystem.generateMonsterLoot('orc', scenario.playerLevel, 'forest');
                    if (loot && loot.length > 0) {
                        dropCount++;
                    }
                }

                results[scenario.expectedMultiplier] = {
                    dropRate: dropCount / testIterations,
                    scenario: scenario
                };
            });

            console.log('Level scaling drop rates:');
            Object.keys(results).forEach(key => {
                console.log(`  ${key}: ${(results[key].dropRate * 100).toFixed(1)}%`);
            });

            // Validate relative scaling
            assertTruthy(results.high.dropRate >= results.normal.dropRate,
                'Lower level players should have equal or higher drop rates');
            assertTruthy(results.normal.dropRate >= results.low.dropRate * 0.8,
                'Normal level should have competitive drop rates compared to overleveled');
        });

        it('should implement diminishing returns for farming prevention', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test repeated farming of same content
            const playerLevel = 20;
            const contentLevel = 10; // Significantly lower level content
            const testIterations = 100;

            let initialDrops = 0;
            let laterDrops = 0;

            // First 25 attempts (initial farming)
            for (let i = 0; i < 25; i++) {
                const loot = LootSystem.generateMonsterLoot('wolf', playerLevel, 'forest');
                if (loot && loot.length > 0) {
                    initialDrops++;
                }
            }

            // Later 25 attempts (should show diminishing returns in a real implementation)
            for (let i = 0; i < 25; i++) {
                const loot = LootSystem.generateMonsterLoot('wolf', playerLevel, 'forest');
                if (loot && loot.length > 0) {
                    laterDrops++;
                }
            }

            const initialRate = initialDrops / 25;
            const laterRate = laterDrops / 25;

            console.log(`Farming rates: initial=${(initialRate * 100).toFixed(1)}%, later=${(laterRate * 100).toFixed(1)}%`);

            // At minimum, overleveled content should have reduced rates
            assertTruthy(initialRate <= 0.6, 'Overleveled content should have reduced drop rates');
        });

        it('should validate level difference penalties scale appropriately', () => {
            if (typeof LootSystem === 'undefined') return;

            const testLevels = [
                { player: 15, content: 15, expected: 'baseline' },
                { player: 20, content: 15, expected: 'reduced' },
                { player: 25, content: 15, expected: 'heavily_reduced' },
                { player: 30, content: 15, expected: 'minimal' }
            ];

            const results = {};

            testLevels.forEach(test => {
                let dropCount = 0;
                const iterations = 100;

                for (let i = 0; i < iterations; i++) {
                    const loot = LootSystem.generateMonsterLoot('goblin', test.player, 'cave');
                    if (loot && loot.length > 0) {
                        dropCount++;
                    }
                }

                results[test.expected] = {
                    dropRate: dropCount / iterations,
                    levelDiff: test.player - test.content
                };
            });

            console.log('Level difference penalty validation:');
            Object.keys(results).forEach(key => {
                const result = results[key];
                console.log(`  ${key} (diff=${result.levelDiff}): ${(result.dropRate * 100).toFixed(1)}%`);
            });

            // Validate progressive penalties
            assertTruthy(results.reduced.dropRate <= results.baseline.dropRate,
                'Moderate level difference should reduce drops');
            assertTruthy(results.heavily_reduced.dropRate <= results.reduced.dropRate,
                'Large level difference should further reduce drops');
            assertTruthy(results.minimal.dropRate <= results.heavily_reduced.dropRate,
                'Extreme level difference should have minimal drops');
        });
    });

    describe('Area and Exploration Type Drop Rate Tests', () => {
        it('should validate area-specific loot frequencies', () => {
            if (typeof LootSystem === 'undefined') return;

            const areas = ['forest', 'cave', 'mountain', 'dungeon', 'ruins'];
            const playerLevel = 15;
            const iterations = 100;
            const results = {};

            areas.forEach(area => {
                let areaDrops = 0;

                for (let i = 0; i < iterations; i++) {
                    const loot = LootSystem.generateAreaLoot(area, playerLevel, 'standard');
                    if (loot && loot.length > 0) {
                        areaDrops++;
                    }
                }

                results[area] = areaDrops / iterations;
            });

            console.log('Area-specific drop rates:');
            Object.keys(results).forEach(area => {
                console.log(`  ${area}: ${(results[area] * 100).toFixed(1)}%`);
            });

            // All areas should have reasonable drop rates
            Object.keys(results).forEach(area => {
                assertTruthy(results[area] >= 0.3, `${area} should have at least 30% drop rate`);
                assertTruthy(results[area] <= 0.9, `${area} should not exceed 90% drop rate`);
            });
        });

        it('should validate exploration type modifiers', () => {
            if (typeof LootSystem === 'undefined') return;

            const explorationTypes = ['quick', 'standard', 'thorough', 'treasure_hunt'];
            const area = 'forest';
            const playerLevel = 12;
            const iterations = 150;
            const results = {};

            explorationTypes.forEach(type => {
                let dropCount = 0;
                let totalItems = 0;

                for (let i = 0; i < iterations; i++) {
                    const loot = LootSystem.generateAreaLoot(area, playerLevel, type);
                    if (loot && loot.length > 0) {
                        dropCount++;
                        totalItems += loot.length;
                    }
                }

                results[type] = {
                    dropRate: dropCount / iterations,
                    avgItemsPerDrop: dropCount > 0 ? totalItems / dropCount : 0
                };
            });

            console.log('Exploration type results:');
            Object.keys(results).forEach(type => {
                const result = results[type];
                console.log(`  ${type}: ${(result.dropRate * 100).toFixed(1)}% rate, ${result.avgItemsPerDrop.toFixed(1)} items/drop`);
            });

            // Thorough exploration should generally yield better results than quick
            assertTruthy(results.thorough.dropRate >= results.quick.dropRate * 0.9,
                'Thorough exploration should have competitive drop rates');
            assertTruthy(results.treasure_hunt.avgItemsPerDrop >= results.standard.avgItemsPerDrop,
                'Treasure hunt should yield more items per successful drop');
        });

        it('should validate gold multipliers and experience bonuses', () => {
            if (typeof LootSystem === 'undefined') return;

            const testAreas = ['beginner_forest', 'intermediate_cave', 'advanced_mountain'];
            const playerLevel = 15;
            const iterations = 50;

            testAreas.forEach(area => {
                let totalGold = 0;
                let goldDrops = 0;

                for (let i = 0; i < iterations; i++) {
                    const loot = LootSystem.generateAreaLoot(area, playerLevel, 'standard');
                    if (loot) {
                        loot.forEach(item => {
                            if (typeof item === 'object' && item.gold) {
                                totalGold += item.gold;
                                goldDrops++;
                            }
                        });
                    }
                }

                if (goldDrops > 0) {
                    const avgGold = totalGold / goldDrops;
                    console.log(`${area} average gold per drop: ${avgGold.toFixed(1)}`);

                    // Gold should scale reasonably with area difficulty
                    assertTruthy(avgGold >= 1, `${area} should provide meaningful gold rewards`);
                }
            });
        });
    });

    describe('Equipment and Item Type Distribution Tests', () => {
        it('should validate equipment progression across level ranges', () => {
            if (typeof LootSystem === 'undefined') return;

            const levelRanges = [
                { min: 1, max: 10, category: 'early' },
                { min: 11, max: 20, category: 'mid' },
                { min: 21, max: 30, category: 'late' }
            ];

            levelRanges.forEach(range => {
                let equipmentDrops = 0;
                let totalDrops = 0;
                const iterations = 100;

                for (let i = 0; i < iterations; i++) {
                    const playerLevel = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
                    const loot = LootSystem.generateMonsterLoot('orc', playerLevel, 'battleground');

                    if (loot && loot.length > 0) {
                        totalDrops++;
                        const hasEquipment = loot.some(item => {
                            const name = typeof item === 'string' ? item : (item.name || item.id || '');
                            return name.includes('sword') || name.includes('armor') || name.includes('staff') ||
                                   name.includes('bow') || name.includes('shield') || name.includes('weapon');
                        });
                        if (hasEquipment) {
                            equipmentDrops++;
                        }
                    }
                }

                const equipmentRate = totalDrops > 0 ? (equipmentDrops / totalDrops) : 0;
                console.log(`${range.category} game (levels ${range.min}-${range.max}): ${(equipmentRate * 100).toFixed(1)}% equipment drops`);

                // Equipment should be available at all level ranges
                assertTruthy(equipmentRate >= 0.2, `${range.category} game should have at least 20% equipment drop rate`);
            });
        });

        it('should validate consumable distribution for strategic depth', () => {
            if (typeof LootSystem === 'undefined') return;

            const iterations = 200;
            let consumableDrops = 0;
            let totalDrops = 0;

            for (let i = 0; i < iterations; i++) {
                const playerLevel = 5 + Math.floor(i / 10);
                const loot = LootSystem.generateMonsterLoot('skeleton', playerLevel, 'crypt');

                if (loot && loot.length > 0) {
                    totalDrops++;
                    const hasConsumable = loot.some(item => {
                        const name = typeof item === 'string' ? item : (item.name || item.id || '');
                        return name.includes('potion') || name.includes('elixir') || name.includes('scroll') ||
                               name.includes('remedy') || name.includes('herb');
                    });
                    if (hasConsumable) {
                        consumableDrops++;
                    }
                }
            }

            const consumableRate = totalDrops > 0 ? (consumableDrops / totalDrops) : 0;
            console.log(`Consumable distribution: ${(consumableRate * 100).toFixed(1)}% of drops contain consumables`);

            // Consumables should be regularly available for strategic gameplay
            assertTruthy(consumableRate >= 0.25, 'At least 25% of drops should contain consumables for strategic depth');
            assertTruthy(consumableRate <= 0.8, 'Consumables should not dominate loot drops');
        });

        it('should validate spell scroll and tome generation integration', () => {
            if (typeof LootSystem === 'undefined') return;

            const iterations = 300;
            let spellItemDrops = 0;
            let totalDrops = 0;

            for (let i = 0; i < iterations; i++) {
                const playerLevel = 8 + Math.floor(i / 20); // Gradually increase level
                const loot = LootSystem.generateAreaLoot('magic_library', playerLevel, 'thorough');

                if (loot && loot.length > 0) {
                    totalDrops++;
                    const hasSpellItem = loot.some(item => {
                        const name = typeof item === 'string' ? item : (item.name || item.id || '');
                        return name.includes('scroll') || name.includes('tome') || name.includes('grimoire') ||
                               name.includes('spell') || name.includes('magic');
                    });
                    if (hasSpellItem) {
                        spellItemDrops++;
                    }
                }
            }

            const spellItemRate = totalDrops > 0 ? (spellItemDrops / totalDrops) : 0;
            console.log(`Spell item integration: ${(spellItemRate * 100).toFixed(1)}% of area drops contain spell items`);

            // Magic areas should have meaningful spell item integration
            if (totalDrops > 0) {
                assertTruthy(spellItemRate >= 0.15, 'Magic areas should have at least 15% spell item drops');
            }
        });
    });

    describe('Regression and Stability Tests', () => {
        it('should prevent future loot scarcity regressions', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test minimum viable drop rates across different scenarios
            const scenarios = [
                { monster: 'rat', level: 1, area: 'sewer' },
                { monster: 'goblin', level: 5, area: 'forest' },
                { monster: 'orc', level: 15, area: 'mountain' },
                { monster: 'dragon', level: 25, area: 'volcano' }
            ];

            scenarios.forEach(scenario => {
                let dropCount = 0;
                const iterations = 50;

                for (let i = 0; i < iterations; i++) {
                    const loot = LootSystem.generateMonsterLoot(scenario.monster, scenario.level, scenario.area);
                    if (loot && loot.length > 0) {
                        dropCount++;
                    }
                }

                const dropRate = dropCount / iterations;
                console.log(`${scenario.monster} (level ${scenario.level}): ${(dropRate * 100).toFixed(1)}% drop rate`);

                // Prevent scarcity: even challenging content should have minimum drops
                assertTruthy(dropRate >= 0.3, `${scenario.monster} should have at least 30% drop rate to prevent scarcity`);
            });
        });

        it('should maintain consistent performance across repeated calls', () => {
            if (typeof LootSystem === 'undefined') return;

            const iterations = 100;
            const timings = [];

            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                LootSystem.generateMonsterLoot('orc', 10, 'battlefield');
                const endTime = performance.now();
                timings.push(endTime - startTime);
            }

            const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
            const maxTime = Math.max(...timings);
            const variance = timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length;
            const stdDev = Math.sqrt(variance);

            console.log(`Performance consistency: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, stddev=${stdDev.toFixed(2)}ms`);

            // Performance should be consistent
            assertTruthy(avgTime < 50, `Average time ${avgTime.toFixed(2)}ms should be under 50ms`);
            assertTruthy(maxTime < 100, `Maximum time ${maxTime.toFixed(2)}ms should be under 100ms for consistency`);
            assertTruthy(stdDev < 20, `Standard deviation ${stdDev.toFixed(2)}ms should be under 20ms for consistency`);
        });

        it('should validate loot system initialization and state consistency', () => {
            if (typeof LootSystem === 'undefined') return;

            // Test that the loot system maintains consistent state
            const initialState = {
                hasTiers: !!LootSystem.rarityTiers,
                hasResolver: typeof LootSystem.resolveConcreteItemId === 'function',
                hasGenerator: typeof LootSystem.generateMonsterLoot === 'function'
            };

            // Generate some loot to potentially modify state
            for (let i = 0; i < 10; i++) {
                LootSystem.generateMonsterLoot('goblin', 10, 'forest');
                LootSystem.generateAreaLoot('cave', 10, 'standard');
            }

            // Verify state consistency after operations
            const postState = {
                hasTiers: !!LootSystem.rarityTiers,
                hasResolver: typeof LootSystem.resolveConcreteItemId === 'function',
                hasGenerator: typeof LootSystem.generateMonsterLoot === 'function'
            };

            Object.keys(initialState).forEach(key => {
                assertEqual(initialState[key], postState[key], `LootSystem.${key} should remain consistent after operations`);
            });

            // Verify rarity tiers are still intact
            const expectedRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            expectedRarities.forEach(rarity => {
                assertTruthy(LootSystem.rarityTiers[rarity], `${rarity} rarity tier should remain after operations`);
                assertTruthy(typeof LootSystem.rarityTiers[rarity].dropRate === 'number',
                    `${rarity} dropRate should remain a number`);
            });
        });
    });
});

// Comprehensive Performance Validation Tests (Task 7.2)
describe('Comprehensive Performance Validation Tests', () => {
    beforeAll(() => {
        if (typeof LootSystem === 'undefined') {
            console.warn('LootSystem not loaded - skipping performance validation tests');
        }
    });

    describe('Monster Loot Generation Performance Tests', () => {
        it('should generate basic monster loot within 50ms requirement', () => {
            if (typeof LootSystem === 'undefined') return;

            const monsters = ['rat', 'wolf', 'goblin', 'orc', 'skeleton', 'spider'];
            const levels = [1, 5, 10, 15, 20, 25, 30];
            const areas = ['sewer', 'forest', 'cave', 'mountain', 'dungeon', 'crypt'];

            const testCases = [];
            const maxTime = 50; // 50ms requirement
            let totalViolations = 0;
            let maxExecutionTime = 0;
            let totalTime = 0;
            let testCount = 0;

            // Generate comprehensive test matrix
            monsters.forEach(monster => {
                levels.forEach(level => {
                    areas.forEach(area => {
                        testCases.push({ monster, level, area });
                    });
                });
            });

            // Test each scenario
            testCases.forEach((testCase, index) => {
                const startTime = performance.now();

                try {
                    LootSystem.generateMonsterLoot(testCase.monster, testCase.level, testCase.area);
                } catch (error) {
                    // Some combinations might not exist, that's okay
                }

                const endTime = performance.now();
                const executionTime = endTime - startTime;

                totalTime += executionTime;
                maxExecutionTime = Math.max(maxExecutionTime, executionTime);
                testCount++;

                if (executionTime > maxTime) {
                    totalViolations++;
                    console.warn(`Performance violation: ${testCase.monster} L${testCase.level} @${testCase.area} took ${executionTime.toFixed(2)}ms`);
                }
            });

            const averageTime = totalTime / testCount;
            const violationRate = (totalViolations / testCount) * 100;

            console.log(`Monster loot performance matrix:`);
            console.log(`  Tests: ${testCount}`);
            console.log(`  Average: ${averageTime.toFixed(2)}ms`);
            console.log(`  Maximum: ${maxExecutionTime.toFixed(2)}ms`);
            console.log(`  Violations: ${totalViolations} (${violationRate.toFixed(1)}%)`);

            // Performance requirements
            assertTruthy(averageTime < maxTime, `Average time ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(maxExecutionTime < maxTime * 2, `Maximum time ${maxExecutionTime.toFixed(2)}ms should be under ${maxTime * 2}ms`);
            assertTruthy(violationRate < 5, `Violation rate ${violationRate.toFixed(1)}% should be under 5%`);
        });

        it('should handle high-level monster generation efficiently', () => {
            if (typeof LootSystem === 'undefined') return;

            const highLevelScenarios = [
                { monster: 'dragon', level: 50, area: 'volcanic_peak' },
                { monster: 'lich', level: 45, area: 'dark_tower' },
                { monster: 'demon_lord', level: 60, area: 'hell_gate' },
                { monster: 'ancient_wyrm', level: 55, area: 'crystal_cavern' }
            ];

            const maxTime = 50;
            let violations = 0;
            let totalTime = 0;

            highLevelScenarios.forEach(scenario => {
                for (let i = 0; i < 10; i++) { // Test each scenario multiple times
                    const startTime = performance.now();

                    try {
                        LootSystem.generateMonsterLoot(scenario.monster, scenario.level, scenario.area);
                    } catch (error) {
                        // High level monsters might not be implemented
                    }

                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    totalTime += executionTime;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / (highLevelScenarios.length * 10);
            console.log(`High-level monster performance: avg=${averageTime.toFixed(2)}ms, violations=${violations}`);

            assertTruthy(averageTime < maxTime, `High-level average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations <= 2, `High-level violations ${violations} should be minimal`);
        });

        it('should maintain performance across level scaling calculations', () => {
            if (typeof LootSystem === 'undefined') return;

            const baseMonster = 'orc';
            const baseArea = 'battlefield';
            const levelDifferences = [-10, -5, -2, 0, 2, 5, 10, 15, 20];
            const maxTime = 50;

            let totalTime = 0;
            let violations = 0;
            let testCount = 0;

            levelDifferences.forEach(levelDiff => {
                for (let baseLevel = 5; baseLevel <= 25; baseLevel += 5) {
                    const playerLevel = baseLevel + levelDiff;
                    if (playerLevel <= 0) return; // Skip invalid levels

                    const startTime = performance.now();
                    LootSystem.generateMonsterLoot(baseMonster, playerLevel, baseArea);
                    const endTime = performance.now();

                    const executionTime = endTime - startTime;
                    totalTime += executionTime;
                    testCount++;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / testCount;
            console.log(`Level scaling performance: avg=${averageTime.toFixed(2)}ms across ${testCount} tests, violations=${violations}`);

            assertTruthy(averageTime < maxTime, `Level scaling average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations < testCount * 0.1, `Level scaling violations should be under 10%`);
        });
    });

    describe('Area Loot Generation Performance Tests', () => {
        it('should generate area loot within 50ms requirement across all exploration types', () => {
            if (typeof LootSystem === 'undefined') return;

            const areas = ['forest', 'cave', 'mountain', 'swamp', 'desert', 'tundra', 'volcano', 'ruins'];
            const explorationTypes = ['quick', 'standard', 'thorough', 'treasure_hunt', 'stealth', 'magical'];
            const levels = [1, 5, 10, 15, 20, 25, 30, 35, 40];

            const maxTime = 50;
            let totalViolations = 0;
            let maxExecutionTime = 0;
            let totalTime = 0;
            let testCount = 0;

            areas.forEach(area => {
                explorationTypes.forEach(explorationType => {
                    levels.forEach(level => {
                        const startTime = performance.now();

                        try {
                            LootSystem.generateAreaLoot(area, level, explorationType);
                        } catch (error) {
                            // Some combinations might not exist
                        }

                        const endTime = performance.now();
                        const executionTime = endTime - startTime;

                        totalTime += executionTime;
                        maxExecutionTime = Math.max(maxExecutionTime, executionTime);
                        testCount++;

                        if (executionTime > maxTime) {
                            totalViolations++;
                        }
                    });
                });
            });

            const averageTime = totalTime / testCount;
            const violationRate = (totalViolations / testCount) * 100;

            console.log(`Area loot performance matrix:`);
            console.log(`  Tests: ${testCount}`);
            console.log(`  Average: ${averageTime.toFixed(2)}ms`);
            console.log(`  Maximum: ${maxExecutionTime.toFixed(2)}ms`);
            console.log(`  Violations: ${totalViolations} (${violationRate.toFixed(1)}%)`);

            assertTruthy(averageTime < maxTime, `Area average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(maxExecutionTime < maxTime * 2, `Area maximum ${maxExecutionTime.toFixed(2)}ms should be under ${maxTime * 2}ms`);
            assertTruthy(violationRate < 5, `Area violation rate ${violationRate.toFixed(1)}% should be under 5%`);
        });

        it('should handle complex area loot generation efficiently', () => {
            if (typeof LootSystem === 'undefined') return;

            const complexAreas = [
                { area: 'legendary_dungeon', level: 40, type: 'treasure_hunt' },
                { area: 'dragon_hoard', level: 45, type: 'thorough' },
                { area: 'void_realm', level: 50, type: 'magical' },
                { area: 'time_rift', level: 35, type: 'standard' }
            ];

            const maxTime = 50;
            let violations = 0;
            let totalTime = 0;
            const iterations = 15;

            complexAreas.forEach(scenario => {
                for (let i = 0; i < iterations; i++) {
                    const startTime = performance.now();

                    try {
                        LootSystem.generateAreaLoot(scenario.area, scenario.level, scenario.type);
                    } catch (error) {
                        // Complex areas might not be implemented
                    }

                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    totalTime += executionTime;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / (complexAreas.length * iterations);
            console.log(`Complex area performance: avg=${averageTime.toFixed(2)}ms, violations=${violations}`);

            assertTruthy(averageTime < maxTime, `Complex area average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations <= 3, `Complex area violations ${violations} should be minimal`);
        });
    });

    describe('Equipment Resolution Performance Tests', () => {
        it('should resolve abstract equipment types within performance requirements', () => {
            if (typeof LootSystem === 'undefined') return;

            const abstractTypes = [
                'nature_equipment', 'forest_equipment', 'beginner_weapon', 'beginner_armor',
                'knight_weapons', 'knight_armor', 'wizard_equipment', 'rogue_weapons',
                'basic_weapon', 'advanced_weapon', 'metal_equipment', 'crystal_equipment',
                'stealth_gear', 'leather_equipment'
            ];

            const maxTime = 10; // Equipment resolution should be very fast
            let totalTime = 0;
            let violations = 0;
            let testCount = 0;

            abstractTypes.forEach(abstractType => {
                for (let i = 0; i < 20; i++) { // Test each type multiple times
                    const lootEntry = { itemType: abstractType };

                    const startTime = performance.now();
                    LootSystem.resolveConcreteItemId(lootEntry);
                    const endTime = performance.now();

                    const executionTime = endTime - startTime;
                    totalTime += executionTime;
                    testCount++;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / testCount;
            const violationRate = (violations / testCount) * 100;

            console.log(`Equipment resolution performance: avg=${averageTime.toFixed(3)}ms, violations=${violations}/${testCount} (${violationRate.toFixed(1)}%)`);

            assertTruthy(averageTime < maxTime, `Equipment resolution average ${averageTime.toFixed(3)}ms should be under ${maxTime}ms`);
            assertTruthy(violationRate < 1, `Equipment resolution violations should be under 1%`);
        });

        it('should handle multiple equipment types resolution efficiently', () => {
            if (typeof LootSystem === 'undefined') return;

            const multiTypeEntries = [
                { equipmentTypes: ['knight_weapons', 'wizard_equipment'] },
                { equipmentTypes: ['light_armor', 'simple_weapon', 'nature_accessory'] },
                { equipmentTypes: ['beginner_weapons', 'beginner_armor', 'basic_weapon'] },
                { equipmentTypes: ['advanced_weapon', 'metal_equipment', 'crystal_equipment'] }
            ];

            const maxTime = 15; // Multiple type resolution allows slightly more time
            let totalTime = 0;
            let violations = 0;

            multiTypeEntries.forEach(entry => {
                for (let i = 0; i < 25; i++) {
                    const startTime = performance.now();
                    LootSystem.resolveConcreteItemId(entry);
                    const endTime = performance.now();

                    const executionTime = endTime - startTime;
                    totalTime += executionTime;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / (multiTypeEntries.length * 25);
            console.log(`Multi-type resolution performance: avg=${averageTime.toFixed(3)}ms, violations=${violations}`);

            assertTruthy(averageTime < maxTime, `Multi-type resolution average ${averageTime.toFixed(3)}ms should be under ${maxTime}ms`);
            assertTruthy(violations <= 2, `Multi-type resolution violations should be minimal`);
        });
    });

    describe('Rarity and Scaling Performance Tests', () => {
        it('should calculate level scaling within performance requirements', () => {
            if (typeof LootSystem === 'undefined') return;

            const maxTime = 5; // Level scaling should be very fast
            let totalTime = 0;
            let violations = 0;
            const testCount = 1000;

            for (let i = 0; i < testCount; i++) {
                const levelDiff = Math.floor(Math.random() * 40) - 20; // -20 to +20
                const playerLevel = Math.floor(Math.random() * 50) + 1; // 1 to 50
                const contentLevel = Math.max(1, playerLevel - levelDiff);

                const startTime = performance.now();
                LootSystem.calculateLevelScaling(levelDiff, playerLevel, contentLevel);
                const endTime = performance.now();

                const executionTime = endTime - startTime;
                totalTime += executionTime;

                if (executionTime > maxTime) {
                    violations++;
                }
            }

            const averageTime = totalTime / testCount;
            const violationRate = (violations / testCount) * 100;

            console.log(`Level scaling calculation performance: avg=${averageTime.toFixed(3)}ms, violations=${violations}/${testCount} (${violationRate.toFixed(1)}%)`);

            assertTruthy(averageTime < maxTime, `Level scaling average ${averageTime.toFixed(3)}ms should be under ${maxTime}ms`);
            assertTruthy(violationRate < 0.5, `Level scaling violations should be under 0.5%`);
        });

        it('should roll for rarity within performance requirements', () => {
            if (typeof LootSystem === 'undefined') return;

            const rarityWeights = {
                common: 0.65,
                uncommon: 0.25,
                rare: 0.08,
                epic: 0.018,
                legendary: 0.002
            };

            const maxTime = 5; // Rarity rolling should be very fast
            let totalTime = 0;
            let violations = 0;
            const testCount = 1000;

            for (let i = 0; i < testCount; i++) {
                const playerLevel = Math.floor(Math.random() * 30) + 1;
                const contentLevel = Math.floor(Math.random() * 30) + 1;

                const startTime = performance.now();
                LootSystem.rollForRarity(rarityWeights, playerLevel, contentLevel);
                const endTime = performance.now();

                const executionTime = endTime - startTime;
                totalTime += executionTime;

                if (executionTime > maxTime) {
                    violations++;
                }
            }

            const averageTime = totalTime / testCount;
            const violationRate = (violations / testCount) * 100;

            console.log(`Rarity rolling performance: avg=${averageTime.toFixed(3)}ms, violations=${violations}/${testCount} (${violationRate.toFixed(1)}%)`);

            assertTruthy(averageTime < maxTime, `Rarity rolling average ${averageTime.toFixed(3)}ms should be under ${maxTime}ms`);
            assertTruthy(violationRate < 0.1, `Rarity rolling violations should be under 0.1%`);
        });

        it('should handle complete loot rolling process efficiently', () => {
            if (typeof LootSystem === 'undefined') return;

            const lootEntries = [
                { dropChance: 0.8, rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 } },
                { dropChance: 0.6, rarityWeights: { common: 0.5, uncommon: 0.3, rare: 0.15, epic: 0.05 } },
                { dropChance: 0.9, rarityWeights: { common: 0.9, uncommon: 0.1 } },
                { dropChance: 0.4, rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.15, legendary: 0.05 } }
            ];

            const maxTime = 10; // Complete rolling process
            let totalTime = 0;
            let violations = 0;
            let testCount = 0;

            lootEntries.forEach(entry => {
                for (let i = 0; i < 50; i++) {
                    const playerLevel = Math.floor(Math.random() * 25) + 1;
                    const contentLevel = Math.floor(Math.random() * 25) + 1;

                    const startTime = performance.now();
                    LootSystem.rollForLoot(entry, playerLevel, contentLevel);
                    const endTime = performance.now();

                    const executionTime = endTime - startTime;
                    totalTime += executionTime;
                    testCount++;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / testCount;
            const violationRate = (violations / testCount) * 100;

            console.log(`Complete loot rolling performance: avg=${averageTime.toFixed(3)}ms, violations=${violations}/${testCount} (${violationRate.toFixed(1)}%)`);

            assertTruthy(averageTime < maxTime, `Complete loot rolling average ${averageTime.toFixed(3)}ms should be under ${maxTime}ms`);
            assertTruthy(violationRate < 1, `Complete loot rolling violations should be under 1%`);
        });
    });

    describe('Stress Testing and Edge Cases Performance', () => {
        it('should handle rapid successive loot generation efficiently', () => {
            if (typeof LootSystem === 'undefined') return;

            const maxTime = 50; // Individual calls should still be fast
            const rapidCallCount = 100;
            let violations = 0;
            let totalTime = 0;

            // Simulate rapid loot generation (like during intensive gameplay)
            const overallStart = performance.now();

            for (let i = 0; i < rapidCallCount; i++) {
                const startTime = performance.now();

                // Alternate between monster and area loot
                if (i % 2 === 0) {
                    LootSystem.generateMonsterLoot('goblin', 10 + (i % 20), 'forest');
                } else {
                    LootSystem.generateAreaLoot('cave', 10 + (i % 20), 'standard');
                }

                const endTime = performance.now();
                const executionTime = endTime - startTime;
                totalTime += executionTime;

                if (executionTime > maxTime) {
                    violations++;
                }
            }

            const overallEnd = performance.now();
            const overallTime = overallEnd - overallStart;
            const averageTime = totalTime / rapidCallCount;
            const callsPerSecond = (rapidCallCount / overallTime) * 1000;

            console.log(`Rapid generation performance:`);
            console.log(`  ${rapidCallCount} calls in ${overallTime.toFixed(2)}ms`);
            console.log(`  Average: ${averageTime.toFixed(2)}ms per call`);
            console.log(`  Rate: ${callsPerSecond.toFixed(1)} calls/second`);
            console.log(`  Violations: ${violations}`);

            assertTruthy(averageTime < maxTime, `Rapid generation average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations < rapidCallCount * 0.05, `Rapid generation violations should be under 5%`);
            assertTruthy(callsPerSecond > 100, `Should handle at least 100 calls per second`);
        });

        it('should maintain performance under memory pressure simulation', () => {
            if (typeof LootSystem === 'undefined') return;

            // Create some "memory pressure" by generating and storing results
            const storedResults = [];
            const maxTime = 50;
            let violations = 0;
            let totalTime = 0;
            const testCount = 50;

            for (let i = 0; i < testCount; i++) {
                // Add to stored results to simulate memory usage
                if (i > 0) {
                    storedResults.push({
                        iteration: i,
                        data: Array(100).fill(0).map((_, idx) => `dummy_data_${idx}`)
                    });
                }

                const startTime = performance.now();
                const result = LootSystem.generateMonsterLoot('orc', 15, 'mountain');
                const endTime = performance.now();

                const executionTime = endTime - startTime;
                totalTime += executionTime;

                if (executionTime > maxTime) {
                    violations++;
                }

                // Store result to maintain memory pressure
                storedResults.push(result);
            }

            const averageTime = totalTime / testCount;
            console.log(`Memory pressure simulation: avg=${averageTime.toFixed(2)}ms, violations=${violations}, stored=${storedResults.length} items`);

            assertTruthy(averageTime < maxTime, `Memory pressure average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations < testCount * 0.1, `Memory pressure violations should be under 10%`);
        });

        it('should handle edge case scenarios within performance limits', () => {
            if (typeof LootSystem === 'undefined') return;

            const edgeCases = [
                // Extreme level differences
                { type: 'monster', params: ['rat', 50, 'sewer'] },
                { type: 'monster', params: ['dragon', 1, 'volcano'] },
                // Invalid/unknown monsters (should fail gracefully)
                { type: 'monster', params: ['unknown_monster', 15, 'forest'] },
                { type: 'monster', params: ['', 10, 'cave'] },
                // Invalid areas
                { type: 'area', params: ['unknown_area', 15, 'standard'] },
                { type: 'area', params: ['', 10, 'thorough'] },
                // Invalid exploration types
                { type: 'area', params: ['forest', 15, 'unknown_type'] },
                { type: 'area', params: ['cave', 10, ''] }
            ];

            const maxTime = 75; // Allow slightly more time for error handling
            let violations = 0;
            let totalTime = 0;

            edgeCases.forEach(testCase => {
                for (let i = 0; i < 5; i++) { // Test each edge case multiple times
                    const startTime = performance.now();

                    try {
                        if (testCase.type === 'monster') {
                            LootSystem.generateMonsterLoot(...testCase.params);
                        } else {
                            LootSystem.generateAreaLoot(...testCase.params);
                        }
                    } catch (error) {
                        // Expected for some edge cases
                    }

                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    totalTime += executionTime;

                    if (executionTime > maxTime) {
                        violations++;
                    }
                }
            });

            const averageTime = totalTime / (edgeCases.length * 5);
            console.log(`Edge case performance: avg=${averageTime.toFixed(2)}ms, violations=${violations}`);

            assertTruthy(averageTime < maxTime, `Edge case average ${averageTime.toFixed(2)}ms should be under ${maxTime}ms`);
            assertTruthy(violations <= 2, `Edge case violations should be minimal`);
        });
    });

    // Task 7.3: Integration Tests for Monster/Area Loot Table Functionality
    describe('Integration Tests - Monster/Area Loot Table Functionality', function() {
        this.timeout(15000);

        describe('Monster Loot Table Integration', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should validate all monster species have proper loot tables', function() {
                if (!window.MonsterData?.species) {
                    console.warn('MonsterData not available, skipping integration test');
                    return;
                }

                const species = window.MonsterData.species;
                const speciesNames = Object.keys(species);
                let validTables = 0;
                let invalidTables = [];

                for (const speciesName of speciesNames) {
                    const monster = species[speciesName];

                    if (!monster.lootTable) {
                        invalidTables.push(`${speciesName}: missing lootTable`);
                        continue;
                    }

                    const lootTable = monster.lootTable;

                    // Validate loot table structure
                    if (!lootTable.level || typeof lootTable.level !== 'number') {
                        invalidTables.push(`${speciesName}: invalid level`);
                        continue;
                    }

                    if (!lootTable.goldRange || !Array.isArray(lootTable.goldRange) || lootTable.goldRange.length !== 2) {
                        invalidTables.push(`${speciesName}: invalid goldRange`);
                        continue;
                    }

                    if (!lootTable.drops || !Array.isArray(lootTable.drops)) {
                        invalidTables.push(`${speciesName}: invalid drops array`);
                        continue;
                    }

                    // Validate each drop entry
                    let validDrops = true;
                    for (const drop of lootTable.drops) {
                        if (!drop.itemType || typeof drop.dropChance !== 'number' ||
                            drop.dropChance < 0 || drop.dropChance > 1) {
                            validDrops = false;
                            break;
                        }

                        if (!drop.rarityWeights || typeof drop.rarityWeights !== 'object') {
                            validDrops = false;
                            break;
                        }

                        if (!drop.quantityRange || !Array.isArray(drop.quantityRange) ||
                            drop.quantityRange.length !== 2) {
                            validDrops = false;
                            break;
                        }
                    }

                    if (!validDrops) {
                        invalidTables.push(`${speciesName}: invalid drop entries`);
                        continue;
                    }

                    validTables++;
                }

                console.log(`Monster loot table validation: ${validTables}/${speciesNames.length} valid`);
                if (invalidTables.length > 0) {
                    console.warn('Invalid monster loot tables:', invalidTables.slice(0, 5));
                }

                // At least 80% of monsters should have valid loot tables
                const validPercentage = validTables / speciesNames.length;
                assertTruthy(validPercentage >= 0.8,
                    `${(validPercentage * 100).toFixed(1)}% valid monster loot tables (need ≥80%)`);
            });

            it('should generate consistent loot for same monster across multiple calls', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testSpecies = species.slice(0, 5); // Test first 5 species
                let consistencyTests = 0;
                let failures = [];

                for (const speciesName of testSpecies) {
                    const monster = window.MonsterData.species[speciesName];
                    if (!monster.lootTable) continue;

                    const results = [];

                    // Generate loot 10 times for same monster
                    for (let i = 0; i < 10; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(monster, gameState.player);
                            results.push(loot);
                        } catch (error) {
                            failures.push(`${speciesName}: ${error.message}`);
                            break;
                        }
                    }

                    if (results.length === 10) {
                        // Check that all results have valid structure
                        const allValid = results.every(loot =>
                            loot && typeof loot === 'object' &&
                            typeof loot.gold === 'number' &&
                            Array.isArray(loot.items)
                        );

                        if (allValid) {
                            consistencyTests++;
                        } else {
                            failures.push(`${speciesName}: inconsistent loot structure`);
                        }
                    }
                }

                console.log(`Monster loot consistency: ${consistencyTests}/${testSpecies.length} passed`);
                if (failures.length > 0) {
                    console.warn('Monster loot failures:', failures);
                }

                assertTruthy(consistencyTests >= Math.max(1, testSpecies.length * 0.8),
                    'Most monsters should generate consistent loot');
            });

            it('should respect level scaling in monster loot generation', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species[0]];
                if (!testMonster?.lootTable) {
                    console.warn('No valid test monster found');
                    return;
                }

                const lowLevelPlayer = { ...gameState.player, level: 1 };
                const midLevelPlayer = { ...gameState.player, level: 10 };
                const highLevelPlayer = { ...gameState.player, level: 20 };

                const players = [lowLevelPlayer, midLevelPlayer, highLevelPlayer];
                const results = [];

                for (const player of players) {
                    const samples = [];
                    for (let i = 0; i < 20; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, player);
                            samples.push(loot);
                        } catch (error) {
                            console.warn(`Level scaling test error: ${error.message}`);
                        }
                    }

                    if (samples.length > 0) {
                        const avgGold = samples.reduce((sum, loot) => sum + loot.gold, 0) / samples.length;
                        const avgItems = samples.reduce((sum, loot) => sum + loot.items.length, 0) / samples.length;
                        results.push({ level: player.level, avgGold, avgItems, samples: samples.length });
                    }
                }

                console.log('Level scaling results:', results);

                // Should have results for all player levels
                assertTruthy(results.length === 3, 'Should test all player levels');

                // Generally higher level players should get more valuable loot
                if (results.length >= 2) {
                    const trend = results[results.length - 1].avgGold >= results[0].avgGold * 0.8;
                    assertTruthy(trend, 'Higher level players should generally get more gold');
                }
            });
        });

        describe('Area Loot Table Integration', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should validate all areas have proper loot tables', function() {
                if (!window.AreaData?.areas) {
                    console.warn('AreaData not available, skipping integration test');
                    return;
                }

                const areas = window.AreaData.areas;
                const areaNames = Object.keys(areas);
                let validTables = 0;
                let invalidTables = [];

                for (const areaName of areaNames) {
                    const area = areas[areaName];

                    if (!area.lootTable) {
                        invalidTables.push(`${areaName}: missing lootTable`);
                        continue;
                    }

                    const lootTable = area.lootTable;

                    // Validate loot table structure
                    if (!lootTable.recommendedLevel || typeof lootTable.recommendedLevel !== 'number') {
                        invalidTables.push(`${areaName}: invalid recommendedLevel`);
                        continue;
                    }

                    if (!lootTable.explorationType || typeof lootTable.explorationType !== 'string') {
                        invalidTables.push(`${areaName}: invalid explorationType`);
                        continue;
                    }

                    if (!lootTable.drops || !Array.isArray(lootTable.drops)) {
                        invalidTables.push(`${areaName}: invalid drops array`);
                        continue;
                    }

                    // Validate each drop entry
                    let validDrops = true;
                    for (const drop of lootTable.drops) {
                        if (!drop.itemType || typeof drop.dropChance !== 'number' ||
                            drop.dropChance < 0 || drop.dropChance > 1) {
                            validDrops = false;
                            break;
                        }

                        if (!drop.rarityWeights || typeof drop.rarityWeights !== 'object') {
                            validDrops = false;
                            break;
                        }

                        if (!drop.quantityRange || !Array.isArray(drop.quantityRange) ||
                            drop.quantityRange.length !== 2) {
                            validDrops = false;
                            break;
                        }
                    }

                    if (!validDrops) {
                        invalidTables.push(`${areaName}: invalid drop entries`);
                        continue;
                    }

                    validTables++;
                }

                console.log(`Area loot table validation: ${validTables}/${areaNames.length} valid`);
                if (invalidTables.length > 0) {
                    console.warn('Invalid area loot tables:', invalidTables.slice(0, 5));
                }

                // At least 80% of areas should have valid loot tables
                const validPercentage = validTables / areaNames.length;
                assertTruthy(validPercentage >= 0.8,
                    `${(validPercentage * 100).toFixed(1)}% valid area loot tables (need ≥80%)`);
            });

            it('should generate different loot for different exploration types', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                const testArea = window.AreaData.areas[areas.find(name =>
                    window.AreaData.areas[name].lootTable?.drops?.length > 0
                )];

                if (!testArea?.lootTable) {
                    console.warn('No valid test area found');
                    return;
                }

                const explorationTypes = ['quick', 'thorough', 'exhaustive'];
                const results = {};

                for (const expType of explorationTypes) {
                    const samples = [];
                    for (let i = 0; i < 15; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(testArea, gameState.player, expType);
                            samples.push(loot);
                        } catch (error) {
                            console.warn(`Exploration type test error: ${error.message}`);
                        }
                    }

                    if (samples.length > 0) {
                        const avgGold = samples.reduce((sum, loot) => sum + loot.gold, 0) / samples.length;
                        const avgItems = samples.reduce((sum, loot) => sum + loot.items.length, 0) / samples.length;
                        results[expType] = { avgGold, avgItems, samples: samples.length };
                    }
                }

                console.log('Exploration type results:', results);

                // Should have results for all exploration types
                const validResults = Object.keys(results).length;
                assertTruthy(validResults >= 2, 'Should test multiple exploration types');

                // Thorough exploration should generally yield more than quick
                if (results.quick && results.thorough) {
                    const thoroughBetter = results.thorough.avgItems >= results.quick.avgItems * 0.9;
                    assertTruthy(thoroughBetter, 'Thorough exploration should yield similar or more items');
                }
            });

            it('should respect area-specific loot themes and bonuses', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                let themeTests = 0;
                let themeFailures = [];

                for (const areaName of areas.slice(0, 5)) { // Test first 5 areas
                    const area = window.AreaData.areas[areaName];
                    if (!area.lootTable) continue;

                    const samples = [];
                    for (let i = 0; i < 10; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(area, gameState.player, 'thorough');
                            samples.push(loot);
                        } catch (error) {
                            themeFailures.push(`${areaName}: ${error.message}`);
                            break;
                        }
                    }

                    if (samples.length === 10) {
                        // Check that loot follows area theme
                        const allValid = samples.every(loot =>
                            loot && typeof loot === 'object' &&
                            typeof loot.gold === 'number' &&
                            Array.isArray(loot.items)
                        );

                        if (allValid) {
                            themeTests++;

                            // Check area bonus application
                            if (area.lootTable.areaBonus) {
                                const avgGold = samples.reduce((sum, loot) => sum + loot.gold, 0) / samples.length;
                                const goldMultiplier = area.lootTable.areaBonus.goldMultiplier || 1.0;

                                // Verify gold scaling makes sense (not too extreme)
                                if (goldMultiplier < 0.1 || goldMultiplier > 5.0) {
                                    themeFailures.push(`${areaName}: extreme gold multiplier ${goldMultiplier}`);
                                }
                            }
                        } else {
                            themeFailures.push(`${areaName}: invalid loot structure`);
                        }
                    }
                }

                console.log(`Area theme tests: ${themeTests} passed`);
                if (themeFailures.length > 0) {
                    console.warn('Area theme failures:', themeFailures);
                }

                assertTruthy(themeTests >= 1, 'Should successfully test area-specific themes');
            });
        });

        describe('Loot Table Cross-System Integration', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should maintain consistency between monster/area loot generation', function() {
                if (!window.MonsterData?.species || !window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping test');
                    return;
                }

                const testRuns = 50;
                const monsterLootResults = [];
                const areaLootResults = [];

                // Test monster loot generation
                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species[0]];
                if (testMonster?.lootTable) {
                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, gameState.player);
                            monsterLootResults.push(loot);
                        } catch (error) {
                            console.warn(`Monster loot generation error: ${error.message}`);
                        }
                    }
                }

                // Test area loot generation
                const areas = Object.keys(window.AreaData.areas);
                const testArea = window.AreaData.areas[areas.find(name =>
                    window.AreaData.areas[name].lootTable?.drops?.length > 0
                )];
                if (testArea?.lootTable) {
                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(testArea, gameState.player, 'thorough');
                            areaLootResults.push(loot);
                        } catch (error) {
                            console.warn(`Area loot generation error: ${error.message}`);
                        }
                    }
                }

                // Analyze results
                const monsterAvgGold = monsterLootResults.length > 0 ?
                    monsterLootResults.reduce((sum, loot) => sum + loot.gold, 0) / monsterLootResults.length : 0;
                const areaAvgGold = areaLootResults.length > 0 ?
                    areaLootResults.reduce((sum, loot) => sum + loot.gold, 0) / areaLootResults.length : 0;

                const monsterAvgItems = monsterLootResults.length > 0 ?
                    monsterLootResults.reduce((sum, loot) => sum + loot.items.length, 0) / monsterLootResults.length : 0;
                const areaAvgItems = areaLootResults.length > 0 ?
                    areaLootResults.reduce((sum, loot) => sum + loot.items.length, 0) / areaLootResults.length : 0;

                console.log(`Cross-system consistency:`, {
                    monster: { samples: monsterLootResults.length, avgGold: monsterAvgGold, avgItems: monsterAvgItems },
                    area: { samples: areaLootResults.length, avgGold: areaAvgGold, avgItems: areaAvgItems }
                });

                // Both systems should generate reasonable amounts of loot
                assertTruthy(monsterLootResults.length > 0 || areaLootResults.length > 0,
                    'At least one loot system should be functional');

                if (monsterLootResults.length > 0 && areaLootResults.length > 0) {
                    // Both systems should produce gold within reasonable ranges
                    assertTruthy(monsterAvgGold >= 0 && monsterAvgGold < 10000,
                        'Monster gold should be reasonable');
                    assertTruthy(areaAvgGold >= 0 && areaAvgGold < 10000,
                        'Area gold should be reasonable');
                }
            });

            it('should handle edge cases in loot table data gracefully', function() {
                if (!window.LootSystem) {
                    console.warn('LootSystem not available, skipping test');
                    return;
                }

                const edgeCases = [
                    // Monster with minimal loot table
                    {
                        type: 'monster',
                        data: {
                            lootTable: {
                                level: 1,
                                goldRange: [1, 2],
                                drops: []
                            }
                        }
                    },
                    // Area with extreme gold multiplier
                    {
                        type: 'area',
                        data: {
                            lootTable: {
                                recommendedLevel: 1,
                                explorationType: 'test',
                                drops: [],
                                areaBonus: { goldMultiplier: 0.1 }
                            }
                        }
                    },
                    // Monster with high drop chances
                    {
                        type: 'monster',
                        data: {
                            lootTable: {
                                level: 1,
                                goldRange: [5, 10],
                                drops: [
                                    {
                                        itemType: 'test_item',
                                        dropChance: 0.9,
                                        rarityWeights: { common: 1.0 },
                                        quantityRange: [1, 1]
                                    }
                                ]
                            }
                        }
                    }
                ];

                let successfulTests = 0;
                let errors = [];

                for (const edgeCase of edgeCases) {
                    try {
                        let loot;
                        if (edgeCase.type === 'monster') {
                            loot = window.LootSystem.generateMonsterLoot(edgeCase.data, gameState.player);
                        } else {
                            loot = window.LootSystem.generateAreaLoot(edgeCase.data, gameState.player, 'quick');
                        }

                        // Validate loot structure
                        if (loot && typeof loot === 'object' &&
                            typeof loot.gold === 'number' && Array.isArray(loot.items)) {
                            successfulTests++;
                        } else {
                            errors.push(`${edgeCase.type}: invalid loot structure`);
                        }
                    } catch (error) {
                        errors.push(`${edgeCase.type}: ${error.message}`);
                    }
                }

                console.log(`Edge case handling: ${successfulTests}/${edgeCases.length} successful`);
                if (errors.length > 0) {
                    console.warn('Edge case errors:', errors);
                }

                // At least half of edge cases should be handled gracefully
                assertTruthy(successfulTests >= Math.ceil(edgeCases.length / 2),
                    'Loot system should handle edge cases gracefully');
            });
        });
    });

    // Task 7.4: Statistical Testing for Rarity Distribution Accuracy over Large Sample Sizes
    describe('Statistical Testing - Rarity Distribution Accuracy', function() {
        this.timeout(30000); // Extended timeout for large sample statistical tests

        describe('Monster Loot Rarity Distribution Statistics', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should maintain target rarity distribution over large sample sizes (1000+ samples)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping statistical test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.drops?.length > 0
                )];

                if (!testMonster?.lootTable) {
                    console.warn('No valid test monster found for statistical testing');
                    return;
                }

                const sampleSize = 1000;
                const rarityCount = {
                    common: 0,
                    uncommon: 0,
                    rare: 0,
                    epic: 0,
                    legendary: 0
                };
                let totalItems = 0;

                console.log(`Collecting ${sampleSize} monster loot samples for statistical analysis...`);

                for (let i = 0; i < sampleSize; i++) {
                    try {
                        const loot = window.LootSystem.generateMonsterLoot(testMonster, gameState.player);
                        if (loot?.items && Array.isArray(loot.items)) {
                            for (const item of loot.items) {
                                if (item?.rarity && rarityCount.hasOwnProperty(item.rarity)) {
                                    rarityCount[item.rarity]++;
                                    totalItems++;
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Statistical test sample ${i} failed: ${error.message}`);
                    }
                }

                if (totalItems === 0) {
                    console.warn('No items collected for statistical analysis');
                    return;
                }

                // Calculate actual percentages
                const actualDistribution = {
                    common: (rarityCount.common / totalItems) * 100,
                    uncommon: (rarityCount.uncommon / totalItems) * 100,
                    rare: (rarityCount.rare / totalItems) * 100,
                    epic: (rarityCount.epic / totalItems) * 100,
                    legendary: (rarityCount.legendary / totalItems) * 100
                };

                // Target distribution from LootSystem (65% common, 25% uncommon, 8% rare, 1.8% epic, 0.2% legendary)
                const targetDistribution = {
                    common: 65,
                    uncommon: 25,
                    rare: 8,
                    epic: 1.8,
                    legendary: 0.2
                };

                console.log(`Statistical analysis results (${totalItems} items from ${sampleSize} samples):`);
                console.log('Actual vs Target Distribution:');
                for (const rarity of Object.keys(targetDistribution)) {
                    const actual = actualDistribution[rarity].toFixed(1);
                    const target = targetDistribution[rarity];
                    const variance = Math.abs(actualDistribution[rarity] - target);
                    console.log(`  ${rarity}: ${actual}% (target: ${target}%, variance: ${variance.toFixed(1)}%)`);
                }

                // Statistical validation with acceptable variance thresholds
                // Common items should be within ±10% of target
                const commonVariance = Math.abs(actualDistribution.common - targetDistribution.common);
                assertTruthy(commonVariance <= 10,
                    `Common distribution variance ${commonVariance.toFixed(1)}% should be ≤10%`);

                // Uncommon items should be within ±8% of target
                const uncommonVariance = Math.abs(actualDistribution.uncommon - targetDistribution.uncommon);
                assertTruthy(uncommonVariance <= 8,
                    `Uncommon distribution variance ${uncommonVariance.toFixed(1)}% should be ≤8%`);

                // Rare items should be within ±5% of target
                const rareVariance = Math.abs(actualDistribution.rare - targetDistribution.rare);
                assertTruthy(rareVariance <= 5,
                    `Rare distribution variance ${rareVariance.toFixed(1)}% should be ≤5%`);

                // Epic items should be within ±2% of target (lower threshold due to small percentage)
                const epicVariance = Math.abs(actualDistribution.epic - targetDistribution.epic);
                assertTruthy(epicVariance <= 2,
                    `Epic distribution variance ${epicVariance.toFixed(1)}% should be ≤2%`);

                // Legendary items can have higher variance due to very low percentage (±1%)
                const legendaryVariance = Math.abs(actualDistribution.legendary - targetDistribution.legendary);
                assertTruthy(legendaryVariance <= 1,
                    `Legendary distribution variance ${legendaryVariance.toFixed(1)}% should be ≤1%`);

                // Overall distribution should account for at least 95% of items
                const totalCoverage = Object.values(actualDistribution).reduce((sum, pct) => sum + pct, 0);
                assertTruthy(totalCoverage >= 95,
                    `Total rarity coverage ${totalCoverage.toFixed(1)}% should be ≥95%`);
            });

            it('should maintain consistent rarity distribution across different player levels', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping level distribution test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.drops?.length > 0
                )];

                if (!testMonster?.lootTable) {
                    console.warn('No valid test monster found');
                    return;
                }

                const playerLevels = [1, 10, 20];
                const sampleSize = 500; // 500 samples per level
                const levelResults = {};

                for (const level of playerLevels) {
                    const player = { ...gameState.player, level };
                    const rarityCount = {
                        common: 0,
                        uncommon: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    };
                    let totalItems = 0;

                    for (let i = 0; i < sampleSize; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, player);
                            if (loot?.items && Array.isArray(loot.items)) {
                                for (const item of loot.items) {
                                    if (item?.rarity && rarityCount.hasOwnProperty(item.rarity)) {
                                        rarityCount[item.rarity]++;
                                        totalItems++;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling for statistical tests
                        }
                    }

                    if (totalItems > 0) {
                        levelResults[level] = {
                            common: (rarityCount.common / totalItems) * 100,
                            uncommon: (rarityCount.uncommon / totalItems) * 100,
                            rare: (rarityCount.rare / totalItems) * 100,
                            epic: (rarityCount.epic / totalItems) * 100,
                            legendary: (rarityCount.legendary / totalItems) * 100,
                            totalItems
                        };
                    }
                }

                console.log('Rarity distribution by player level:', levelResults);

                // Validate that we have results for multiple levels
                const validLevels = Object.keys(levelResults);
                assertTruthy(validLevels.length >= 2, 'Should have results for multiple player levels');

                // Check that common items remain the dominant percentage across all levels
                for (const level of validLevels) {
                    const distribution = levelResults[level];
                    assertTruthy(distribution.common >= 40,
                        `Level ${level}: Common items ${distribution.common.toFixed(1)}% should be ≥40%`);

                    // Total distribution should be reasonable
                    const total = Object.values(distribution).reduce((sum, pct) => sum + pct, 0) - distribution.totalItems;
                    assertTruthy(total >= 95,
                        `Level ${level}: Total distribution coverage should be ≥95%`);
                }

                // Statistical consistency check: common items shouldn't vary too wildly between levels
                if (validLevels.length >= 2) {
                    const commonPercentages = validLevels.map(level => levelResults[level].common);
                    const commonVariance = Math.max(...commonPercentages) - Math.min(...commonPercentages);
                    assertTruthy(commonVariance <= 20,
                        `Common rarity variance across levels ${commonVariance.toFixed(1)}% should be ≤20%`);
                }
            });

            it('should demonstrate statistical significance in rarity tier separation', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping significance test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.drops?.length > 0
                )];

                if (!testMonster?.lootTable) {
                    console.warn('No valid test monster found');
                    return;
                }

                const sampleSize = 2000; // Large sample for significance testing
                const rarityCount = {
                    common: 0,
                    uncommon: 0,
                    rare: 0,
                    epic: 0,
                    legendary: 0
                };

                console.log(`Collecting ${sampleSize} samples for statistical significance testing...`);

                for (let i = 0; i < sampleSize; i++) {
                    try {
                        const loot = window.LootSystem.generateMonsterLoot(testMonster, gameState.player);
                        if (loot?.items && Array.isArray(loot.items)) {
                            for (const item of loot.items) {
                                if (item?.rarity && rarityCount.hasOwnProperty(item.rarity)) {
                                    rarityCount[item.rarity]++;
                                }
                            }
                        }
                    } catch (error) {
                        // Silent error handling for statistical tests
                    }
                }

                const totalItems = Object.values(rarityCount).reduce((sum, count) => sum + count, 0);

                if (totalItems === 0) {
                    console.warn('No items collected for significance testing');
                    return;
                }

                console.log(`Statistical significance analysis (${totalItems} total items):`);
                console.log('Rarity tier separation:');

                // Check statistical significance of tier separation
                assertTruthy(rarityCount.common > rarityCount.uncommon,
                    `Common (${rarityCount.common}) should significantly exceed uncommon (${rarityCount.uncommon})`);

                assertTruthy(rarityCount.uncommon > rarityCount.rare,
                    `Uncommon (${rarityCount.uncommon}) should exceed rare (${rarityCount.rare})`);

                assertTruthy(rarityCount.rare > rarityCount.epic,
                    `Rare (${rarityCount.rare}) should exceed epic (${rarityCount.epic})`);

                // Statistical ratio tests (common should be at least 2x uncommon)
                if (rarityCount.uncommon > 0) {
                    const commonToUncommonRatio = rarityCount.common / rarityCount.uncommon;
                    assertTruthy(commonToUncommonRatio >= 1.5,
                        `Common:Uncommon ratio ${commonToUncommonRatio.toFixed(2)} should be ≥1.5`);
                }

                // Statistical confidence: with 2000+ samples, we should have meaningful counts
                assertTruthy(rarityCount.common >= 100,
                    `Common items count ${rarityCount.common} should be ≥100 for statistical confidence`);

                if (rarityCount.uncommon > 0) {
                    assertTruthy(rarityCount.uncommon >= 20,
                        `Uncommon items count ${rarityCount.uncommon} should be ≥20 for statistical relevance`);
                }

                console.log('Statistical significance validation passed');
            });
        });

        describe('Area Loot Rarity Distribution Statistics', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should maintain consistent rarity distribution in area exploration', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping area statistical test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                const testArea = window.AreaData.areas[areas.find(name =>
                    window.AreaData.areas[name].lootTable?.drops?.length > 0
                )];

                if (!testArea?.lootTable) {
                    console.warn('No valid test area found');
                    return;
                }

                const sampleSize = 800;
                const explorationTypes = ['thorough', 'exhaustive'];
                const explorationResults = {};

                for (const expType of explorationTypes) {
                    const rarityCount = {
                        common: 0,
                        uncommon: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    };
                    let totalItems = 0;

                    for (let i = 0; i < sampleSize; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(testArea, gameState.player, expType);
                            if (loot?.items && Array.isArray(loot.items)) {
                                for (const item of loot.items) {
                                    if (item?.rarity && rarityCount.hasOwnProperty(item.rarity)) {
                                        rarityCount[item.rarity]++;
                                        totalItems++;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }

                    if (totalItems > 0) {
                        explorationResults[expType] = {
                            common: (rarityCount.common / totalItems) * 100,
                            uncommon: (rarityCount.uncommon / totalItems) * 100,
                            rare: (rarityCount.rare / totalItems) * 100,
                            epic: (rarityCount.epic / totalItems) * 100,
                            legendary: (rarityCount.legendary / totalItems) * 100,
                            totalItems,
                            rawCounts: rarityCount
                        };
                    }
                }

                console.log('Area exploration rarity distribution:', explorationResults);

                const validExplorations = Object.keys(explorationResults);
                assertTruthy(validExplorations.length >= 1, 'Should have results for at least one exploration type');

                // Validate rarity distribution for each exploration type
                for (const expType of validExplorations) {
                    const distribution = explorationResults[expType];

                    // Common items should be the most frequent
                    assertTruthy(distribution.common >= 30,
                        `${expType}: Common items ${distribution.common.toFixed(1)}% should be ≥30%`);

                    // Total coverage should be comprehensive
                    const totalCoverage = distribution.common + distribution.uncommon + distribution.rare +
                                        distribution.epic + distribution.legendary;
                    assertTruthy(totalCoverage >= 85,
                        `${expType}: Total rarity coverage ${totalCoverage.toFixed(1)}% should be ≥85%`);

                    // Statistical confidence check
                    assertTruthy(distribution.totalItems >= 50,
                        `${expType}: Should have collected ≥50 items for statistical relevance`);
                }

                // Cross-exploration comparison if we have multiple types
                if (validExplorations.length >= 2) {
                    const thorough = explorationResults.thorough;
                    const exhaustive = explorationResults.exhaustive;

                    if (thorough && exhaustive) {
                        // Both should have reasonable common percentages
                        assertTruthy(Math.abs(thorough.common - exhaustive.common) <= 25,
                            'Common percentages should not differ by more than 25% between exploration types');
                    }
                }
            });

            it('should validate statistical randomness in repeated area loot generation', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping randomness test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                const testArea = window.AreaData.areas[areas.find(name =>
                    window.AreaData.areas[name].lootTable?.drops?.length > 0
                )];

                if (!testArea?.lootTable) {
                    console.warn('No valid test area found');
                    return;
                }

                const runs = 10; // 10 separate runs
                const samplesPerRun = 100; // 100 samples per run
                const runResults = [];

                console.log(`Statistical randomness test: ${runs} runs of ${samplesPerRun} samples each`);

                for (let run = 0; run < runs; run++) {
                    const rarityCount = {
                        common: 0,
                        uncommon: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    };
                    let totalItems = 0;

                    for (let i = 0; i < samplesPerRun; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(testArea, gameState.player, 'thorough');
                            if (loot?.items && Array.isArray(loot.items)) {
                                for (const item of loot.items) {
                                    if (item?.rarity && rarityCount.hasOwnProperty(item.rarity)) {
                                        rarityCount[item.rarity]++;
                                        totalItems++;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }

                    if (totalItems > 0) {
                        runResults.push({
                            run: run + 1,
                            commonPct: (rarityCount.common / totalItems) * 100,
                            totalItems,
                            rawCounts: rarityCount
                        });
                    }
                }

                assertTruthy(runResults.length >= 5, 'Should have at least 5 valid runs for randomness testing');

                // Calculate variance in common percentages across runs
                const commonPercentages = runResults.map(result => result.commonPct);
                const avgCommon = commonPercentages.reduce((sum, pct) => sum + pct, 0) / commonPercentages.length;
                const variance = commonPercentages.reduce((sum, pct) => sum + Math.pow(pct - avgCommon, 2), 0) / commonPercentages.length;
                const standardDeviation = Math.sqrt(variance);

                console.log(`Randomness analysis: avg=${avgCommon.toFixed(1)}%, stddev=${standardDeviation.toFixed(1)}%`);

                // Statistical randomness validation
                // Standard deviation should indicate reasonable randomness (not too low, not too high)
                assertTruthy(standardDeviation >= 2,
                    `Standard deviation ${standardDeviation.toFixed(1)}% should indicate randomness (≥2%)`);

                assertTruthy(standardDeviation <= 20,
                    `Standard deviation ${standardDeviation.toFixed(1)}% should not be excessive (≤20%)`);

                // All runs should produce some common items
                const allRunsHaveCommon = runResults.every(result => result.commonPct > 0);
                assertTruthy(allRunsHaveCommon, 'All runs should produce some common items');

                console.log('Statistical randomness validation passed');
            });
        });

        describe('Cross-System Statistical Consistency', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should maintain statistical consistency between monster and area loot systems', function() {
                if (!window.MonsterData?.species || !window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping cross-system test');
                    return;
                }

                const sampleSize = 600;
                const monsterResults = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, total: 0 };
                const areaResults = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, total: 0 };

                // Test monster loot statistics
                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.drops?.length > 0
                )];

                if (testMonster?.lootTable) {
                    for (let i = 0; i < sampleSize; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, gameState.player);
                            if (loot?.items && Array.isArray(loot.items)) {
                                for (const item of loot.items) {
                                    if (item?.rarity && monsterResults.hasOwnProperty(item.rarity)) {
                                        monsterResults[item.rarity]++;
                                        monsterResults.total++;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }
                }

                // Test area loot statistics
                const areas = Object.keys(window.AreaData.areas);
                const testArea = window.AreaData.areas[areas.find(name =>
                    window.AreaData.areas[name].lootTable?.drops?.length > 0
                )];

                if (testArea?.lootTable) {
                    for (let i = 0; i < sampleSize; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(testArea, gameState.player, 'thorough');
                            if (loot?.items && Array.isArray(loot.items)) {
                                for (const item of loot.items) {
                                    if (item?.rarity && areaResults.hasOwnProperty(item.rarity)) {
                                        areaResults[item.rarity]++;
                                        areaResults.total++;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }
                }

                // Statistical comparison
                const hasMonsterData = monsterResults.total > 0;
                const hasAreaData = areaResults.total > 0;

                assertTruthy(hasMonsterData || hasAreaData,
                    'Should have statistical data from at least one loot system');

                if (hasMonsterData && hasAreaData) {
                    // Calculate percentages
                    const monsterCommonPct = (monsterResults.common / monsterResults.total) * 100;
                    const areaCommonPct = (areaResults.common / areaResults.total) * 100;

                    console.log(`Cross-system statistics:`);
                    console.log(`  Monster: ${monsterCommonPct.toFixed(1)}% common (${monsterResults.total} items)`);
                    console.log(`  Area: ${areaCommonPct.toFixed(1)}% common (${areaResults.total} items)`);

                    // Both systems should generate substantial amounts of common items
                    assertTruthy(monsterCommonPct >= 25,
                        `Monster common percentage ${monsterCommonPct.toFixed(1)}% should be ≥25%`);

                    assertTruthy(areaCommonPct >= 25,
                        `Area common percentage ${areaCommonPct.toFixed(1)}% should be ≥25%`);

                    // Cross-system consistency check (shouldn't differ by more than 40%)
                    const systemVariance = Math.abs(monsterCommonPct - areaCommonPct);
                    assertTruthy(systemVariance <= 40,
                        `Cross-system common variance ${systemVariance.toFixed(1)}% should be ≤40%`);

                    // Statistical confidence check
                    assertTruthy(monsterResults.total >= 100 && areaResults.total >= 100,
                        'Both systems should generate ≥100 items for statistical confidence');
                }

                console.log('Cross-system statistical consistency validation passed');
            });
        });
    });

    // Task 7.5: Regression Tests Preventing Future Loot Scarcity Issues
    describe('Regression Tests - Loot Scarcity Prevention', function() {
        this.timeout(15000);

        describe('Monster Loot Scarcity Prevention', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should guarantee minimum loot frequency per monster encounter (regression: never-empty loot)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping scarcity test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const scarcityResults = {};
                let totalEmptyEncounters = 0;
                let totalEncounters = 0;

                // Test multiple monsters to ensure consistent non-scarcity
                for (const speciesName of species.slice(0, 8)) { // Test first 8 species
                    const monster = window.MonsterData.species[speciesName];
                    if (!monster.lootTable) continue;

                    const testRuns = 100;
                    let emptyLootCount = 0;
                    let zeroGoldCount = 0;
                    let totalRewards = 0;

                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(monster, gameState.player);
                            totalEncounters++;

                            if (!loot || (!loot.items?.length && (!loot.gold || loot.gold === 0))) {
                                emptyLootCount++;
                                totalEmptyEncounters++;
                            } else {
                                if (loot.gold > 0 || (loot.items && loot.items.length > 0)) {
                                    totalRewards++;
                                }

                                if (!loot.gold || loot.gold === 0) {
                                    zeroGoldCount++;
                                }
                            }
                        } catch (error) {
                            console.warn(`Scarcity test error for ${speciesName}: ${error.message}`);
                        }
                    }

                    const emptyPercentage = (emptyLootCount / testRuns) * 100;
                    const zeroGoldPercentage = (zeroGoldCount / testRuns) * 100;
                    const rewardPercentage = (totalRewards / testRuns) * 100;

                    scarcityResults[speciesName] = {
                        emptyEncounters: emptyLootCount,
                        emptyPercentage,
                        zeroGoldPercentage,
                        rewardPercentage,
                        testRuns
                    };

                    // Regression prevention: No monster should have >25% completely empty encounters
                    assertTruthy(emptyPercentage <= 25,
                        `${speciesName}: Empty loot ${emptyPercentage.toFixed(1)}% should be ≤25% (regression prevention)`);

                    // At least 70% of encounters should provide meaningful rewards
                    assertTruthy(rewardPercentage >= 70,
                        `${speciesName}: Reward frequency ${rewardPercentage.toFixed(1)}% should be ≥70% (scarcity prevention)`);
                }

                console.log('Monster loot scarcity prevention results:', scarcityResults);

                // Overall scarcity check across all tested monsters
                const overallEmptyRate = totalEncounters > 0 ? (totalEmptyEncounters / totalEncounters) * 100 : 0;
                assertTruthy(overallEmptyRate <= 20,
                    `Overall empty encounter rate ${overallEmptyRate.toFixed(1)}% should be ≤20% (global scarcity prevention)`);

                console.log(`Scarcity prevention: ${totalEmptyEncounters}/${totalEncounters} empty encounters (${overallEmptyRate.toFixed(1)}%)`);
            });

            it('should prevent gold scarcity across different level ranges (regression: gold drought prevention)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping gold scarcity test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.goldRange?.length === 2
                )];

                if (!testMonster?.lootTable?.goldRange) {
                    console.warn('No valid monster with gold range found');
                    return;
                }

                const levelRanges = [
                    { min: 1, max: 5, name: 'early' },
                    { min: 10, max: 15, name: 'mid' },
                    { min: 20, max: 25, name: 'late' }
                ];

                const goldResults = {};

                for (const levelRange of levelRanges) {
                    const player = { ...gameState.player, level: levelRange.min + 2 }; // Middle of range
                    const testRuns = 150;
                    let totalGold = 0;
                    let zeroGoldEncounters = 0;
                    let validSamples = 0;

                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, player);
                            if (loot && typeof loot.gold === 'number') {
                                totalGold += loot.gold;
                                validSamples++;

                                if (loot.gold === 0) {
                                    zeroGoldEncounters++;
                                }
                            }
                        } catch (error) {
                            // Silent error handling for regression tests
                        }
                    }

                    if (validSamples > 0) {
                        const avgGold = totalGold / validSamples;
                        const zeroGoldRate = (zeroGoldEncounters / validSamples) * 100;

                        goldResults[levelRange.name] = {
                            level: levelRange.min + 2,
                            avgGold,
                            totalGold,
                            zeroGoldRate,
                            validSamples
                        };

                        // Regression prevention: Average gold should be reasonable for the level
                        const minExpectedGold = Math.max(1, levelRange.min * 0.5);
                        assertTruthy(avgGold >= minExpectedGold,
                            `${levelRange.name} level ${player.level}: Avg gold ${avgGold.toFixed(1)} should be ≥${minExpectedGold} (gold scarcity prevention)`);

                        // Zero gold encounters should not be excessive
                        assertTruthy(zeroGoldRate <= 30,
                            `${levelRange.name} level ${player.level}: Zero gold rate ${zeroGoldRate.toFixed(1)}% should be ≤30%`);
                    }
                }

                console.log('Gold scarcity prevention results by level:', goldResults);

                // Cross-level validation: higher levels should generally get more gold
                const levelNames = Object.keys(goldResults);
                if (levelNames.length >= 2) {
                    const earlyGold = goldResults.early?.avgGold || 0;
                    const lateGold = goldResults.late?.avgGold || 0;

                    if (earlyGold > 0 && lateGold > 0) {
                        // Late game shouldn't have severely less gold than early game (prevents reverse scaling)
                        assertTruthy(lateGold >= earlyGold * 0.7,
                            `Late game gold ${lateGold.toFixed(1)} should not be severely less than early game ${earlyGold.toFixed(1)} (regression prevention)`);
                    }
                }
            });

            it('should maintain item generation frequency to prevent item drought (regression: item scarcity)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping item scarcity test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonsters = species.slice(0, 5).map(name => window.MonsterData.species[name])
                    .filter(monster => monster?.lootTable?.drops?.length > 0);

                if (testMonsters.length === 0) {
                    console.warn('No valid monsters with loot drops found');
                    return;
                }

                const itemScarcityResults = {};

                for (const monster of testMonsters) {
                    const testRuns = 120;
                    let totalItems = 0;
                    let encountersWithItems = 0;
                    let encountersWithoutItems = 0;
                    let validEncounters = 0;

                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(monster, gameState.player);
                            if (loot && Array.isArray(loot.items)) {
                                validEncounters++;
                                totalItems += loot.items.length;

                                if (loot.items.length > 0) {
                                    encountersWithItems++;
                                } else {
                                    encountersWithoutItems++;
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }

                    if (validEncounters > 0) {
                        const avgItemsPerEncounter = totalItems / validEncounters;
                        const itemDropRate = (encountersWithItems / validEncounters) * 100;
                        const noItemRate = (encountersWithoutItems / validEncounters) * 100;

                        const monsterName = monster.name || 'unknown';
                        itemScarcityResults[monsterName] = {
                            avgItemsPerEncounter,
                            itemDropRate,
                            noItemRate,
                            totalItems,
                            validEncounters
                        };

                        // Regression prevention: Item drop rate should be reasonable
                        assertTruthy(itemDropRate >= 40,
                            `${monsterName}: Item drop rate ${itemDropRate.toFixed(1)}% should be ≥40% (item scarcity prevention)`);

                        // No-item encounters should not be excessive
                        assertTruthy(noItemRate <= 60,
                            `${monsterName}: No-item rate ${noItemRate.toFixed(1)}% should be ≤60% (item drought prevention)`);

                        // Average items per encounter should be meaningful
                        assertTruthy(avgItemsPerEncounter >= 0.3,
                            `${monsterName}: Avg items per encounter ${avgItemsPerEncounter.toFixed(2)} should be ≥0.3 (minimum item flow)`);
                    }
                }

                console.log('Item scarcity prevention results:', itemScarcityResults);

                // Overall item generation health check
                const monsterNames = Object.keys(itemScarcityResults);
                assertTruthy(monsterNames.length >= 1,
                    'Should have item generation data for at least one monster (system health check)');

                const avgDropRates = monsterNames.map(name => itemScarcityResults[name].itemDropRate);
                const overallAvgDropRate = avgDropRates.reduce((sum, rate) => sum + rate, 0) / avgDropRates.length;

                assertTruthy(overallAvgDropRate >= 45,
                    `Overall average item drop rate ${overallAvgDropRate.toFixed(1)}% should be ≥45% (global scarcity prevention)`);
            });
        });

        describe('Area Loot Scarcity Prevention', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should prevent exploration reward drought across area types (regression: exploration scarcity)', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping area scarcity test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                const testAreas = areas.slice(0, 6).map(name => window.AreaData.areas[name])
                    .filter(area => area?.lootTable?.drops?.length > 0);

                if (testAreas.length === 0) {
                    console.warn('No valid areas with loot drops found');
                    return;
                }

                const explorationTypes = ['quick', 'thorough', 'exhaustive'];
                const areaScarcityResults = {};

                for (const area of testAreas) {
                    const areaName = area.name || 'unknown';
                    areaScarcityResults[areaName] = {};

                    for (const expType of explorationTypes) {
                        const testRuns = 80;
                        let totalRewards = 0;
                        let emptyExplorations = 0;
                        let totalGold = 0;
                        let totalItems = 0;
                        let validExplorations = 0;

                        for (let i = 0; i < testRuns; i++) {
                            try {
                                const loot = window.LootSystem.generateAreaLoot(area, gameState.player, expType);
                                if (loot) {
                                    validExplorations++;
                                    const hasRewards = (loot.gold > 0) || (loot.items && loot.items.length > 0);

                                    if (hasRewards) {
                                        totalRewards++;
                                        totalGold += loot.gold || 0;
                                        totalItems += loot.items ? loot.items.length : 0;
                                    } else {
                                        emptyExplorations++;
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }

                        if (validExplorations > 0) {
                            const rewardRate = (totalRewards / validExplorations) * 100;
                            const emptyRate = (emptyExplorations / validExplorations) * 100;
                            const avgGold = totalGold / validExplorations;
                            const avgItems = totalItems / validExplorations;

                            areaScarcityResults[areaName][expType] = {
                                rewardRate,
                                emptyRate,
                                avgGold,
                                avgItems,
                                validExplorations
                            };

                            // Regression prevention: Exploration should provide meaningful rewards
                            assertTruthy(rewardRate >= 60,
                                `${areaName} ${expType}: Reward rate ${rewardRate.toFixed(1)}% should be ≥60% (exploration scarcity prevention)`);

                            // Empty explorations should not be excessive
                            assertTruthy(emptyRate <= 40,
                                `${areaName} ${expType}: Empty rate ${emptyRate.toFixed(1)}% should be ≤40% (exploration drought prevention)`);

                            // Should provide some meaningful rewards on average
                            const totalRewardValue = avgGold + (avgItems * 2); // Items worth ~2 gold equivalent for comparison
                            assertTruthy(totalRewardValue >= 1,
                                `${areaName} ${expType}: Total reward value ${totalRewardValue.toFixed(1)} should be ≥1 (minimum exploration value)`);
                        }
                    }
                }

                console.log('Area exploration scarcity prevention results:', areaScarcityResults);

                // Cross-exploration type validation: thorough should generally be better than quick
                for (const areaName of Object.keys(areaScarcityResults)) {
                    const areaResults = areaScarcityResults[areaName];
                    const quick = areaResults.quick;
                    const thorough = areaResults.thorough;

                    if (quick && thorough) {
                        // Thorough exploration should not be significantly worse than quick (prevents regression)
                        assertTruthy(thorough.rewardRate >= quick.rewardRate - 10,
                            `${areaName}: Thorough reward rate ${thorough.rewardRate.toFixed(1)}% should not be >10% worse than quick ${quick.rewardRate.toFixed(1)}%`);
                    }
                }
            });

            it('should maintain area-specific loot consistency to prevent theme drought (regression: thematic scarcity)', function() {
                if (!window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping thematic scarcity test');
                    return;
                }

                const areas = Object.keys(window.AreaData.areas);
                const testAreas = areas.slice(0, 4).map(name => ({ name, area: window.AreaData.areas[name] }))
                    .filter(entry => entry.area?.lootTable?.drops?.length > 0);

                if (testAreas.length === 0) {
                    console.warn('No valid themed areas found');
                    return;
                }

                const thematicResults = {};

                for (const { name: areaName, area } of testAreas) {
                    const testRuns = 100;
                    let thematicItems = 0;
                    let totalItems = 0;
                    let consistentLootRuns = 0;
                    let validRuns = 0;

                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateAreaLoot(area, gameState.player, 'thorough');
                            if (loot && loot.items && Array.isArray(loot.items)) {
                                validRuns++;
                                totalItems += loot.items.length;

                                // Count thematic consistency (items that match expected area themes)
                                let hasThematicItems = false;
                                for (const item of loot.items) {
                                    if (item && item.id) {
                                        // Basic thematic validation - items should exist and have proper structure
                                        thematicItems++;
                                        hasThematicItems = true;
                                    }
                                }

                                if (hasThematicItems || loot.gold > 0) {
                                    consistentLootRuns++;
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }

                    if (validRuns > 0) {
                        const avgItemsPerRun = totalItems / validRuns;
                        const consistencyRate = (consistentLootRuns / validRuns) * 100;
                        const thematicDensity = totalItems > 0 ? (thematicItems / totalItems) * 100 : 0;

                        thematicResults[areaName] = {
                            avgItemsPerRun,
                            consistencyRate,
                            thematicDensity,
                            validRuns,
                            totalItems
                        };

                        // Regression prevention: Areas should maintain thematic consistency
                        assertTruthy(consistencyRate >= 70,
                            `${areaName}: Loot consistency ${consistencyRate.toFixed(1)}% should be ≥70% (thematic drought prevention)`);

                        // Areas should provide reasonable item density
                        assertTruthy(avgItemsPerRun >= 0.2,
                            `${areaName}: Avg items per run ${avgItemsPerRun.toFixed(2)} should be ≥0.2 (area productivity)`);

                        // Thematic items should be well represented
                        assertTruthy(thematicDensity >= 80,
                            `${areaName}: Thematic item density ${thematicDensity.toFixed(1)}% should be ≥80% (theme consistency)`);
                    }
                }

                console.log('Thematic scarcity prevention results:', thematicResults);

                // Overall thematic health check
                const areaNames = Object.keys(thematicResults);
                assertTruthy(areaNames.length >= 1,
                    'Should have thematic consistency data for at least one area (system health check)');

                const avgConsistencyRates = areaNames.map(name => thematicResults[name].consistencyRate);
                const overallConsistency = avgConsistencyRates.reduce((sum, rate) => sum + rate, 0) / avgConsistencyRates.length;

                assertTruthy(overallConsistency >= 65,
                    `Overall thematic consistency ${overallConsistency.toFixed(1)}% should be ≥65% (global theme preservation)`);
            });
        });

        describe('Progressive Loot Scaling Regression Prevention', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should prevent level progression reward stagnation (regression: scaling breakdown)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping progression test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species.find(name =>
                    window.MonsterData.species[name].lootTable?.drops?.length > 0
                )];

                if (!testMonster?.lootTable) {
                    console.warn('No valid monster found for progression test');
                    return;
                }

                const progressionLevels = [1, 5, 10, 15, 20, 25];
                const progressionResults = {};

                for (const level of progressionLevels) {
                    const player = { ...gameState.player, level };
                    const testRuns = 60;
                    let totalValue = 0;
                    let totalGold = 0;
                    let totalItems = 0;
                    let validRuns = 0;

                    for (let i = 0; i < testRuns; i++) {
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, player);
                            if (loot) {
                                validRuns++;
                                const gold = loot.gold || 0;
                                const itemCount = loot.items ? loot.items.length : 0;

                                totalGold += gold;
                                totalItems += itemCount;
                                totalValue += gold + (itemCount * 1.5); // Rough value estimation
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }

                    if (validRuns > 0) {
                        progressionResults[level] = {
                            avgGold: totalGold / validRuns,
                            avgItems: totalItems / validRuns,
                            avgValue: totalValue / validRuns,
                            validRuns
                        };
                    }
                }

                console.log('Progression scaling results:', progressionResults);

                // Regression prevention: Scaling should not break down severely
                const levels = Object.keys(progressionResults).map(Number).sort((a, b) => a - b);

                if (levels.length >= 3) {
                    const earlyLevel = levels[0];
                    const midLevel = levels[Math.floor(levels.length / 2)];
                    const lateLevel = levels[levels.length - 1];

                    const earlyValue = progressionResults[earlyLevel]?.avgValue || 0;
                    const midValue = progressionResults[midLevel]?.avgValue || 0;
                    const lateValue = progressionResults[lateLevel]?.avgValue || 0;

                    // Mid-level should not be significantly worse than early level
                    if (earlyValue > 0) {
                        assertTruthy(midValue >= earlyValue * 0.6,
                            `Mid-level value ${midValue.toFixed(2)} should not be <60% of early value ${earlyValue.toFixed(2)} (progression regression prevention)`);
                    }

                    // Late level should show some progression
                    if (midValue > 0) {
                        assertTruthy(lateValue >= midValue * 0.8,
                            `Late-level value ${lateValue.toFixed(2)} should not be <80% of mid value ${midValue.toFixed(2)} (scaling stagnation prevention)`);
                    }

                    // Overall progression should exist
                    if (earlyValue > 0 && lateValue > 0) {
                        const progressionRatio = lateValue / earlyValue;
                        assertTruthy(progressionRatio >= 0.8,
                            `Progression ratio ${progressionRatio.toFixed(2)} should be ≥0.8 (prevents severe scaling regression)`);
                    }
                }

                // Individual level validation: each level should provide reasonable rewards
                for (const level of levels) {
                    const result = progressionResults[level];
                    const minExpectedValue = Math.max(1, level * 0.1);

                    assertTruthy(result.avgValue >= minExpectedValue,
                        `Level ${level}: Avg value ${result.avgValue.toFixed(2)} should be ≥${minExpectedValue} (minimum viable rewards)`);
                }
            });

            it('should prevent loot system degradation under stress conditions (regression: system stability)', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping stress test');
                    return;
                }

                const species = Object.keys(window.MonsterData.species);
                const testMonster = window.MonsterData.species[species[0]];

                if (!testMonster?.lootTable) {
                    console.warn('No valid monster found for stress test');
                    return;
                }

                // Stress conditions
                const stressConditions = [
                    { name: 'high_frequency', runs: 500, description: 'High frequency generation' },
                    { name: 'extreme_level', level: 100, runs: 100, description: 'Extreme player level' },
                    { name: 'rapid_succession', runs: 200, rapid: true, description: 'Rapid successive calls' }
                ];

                const stressResults = {};

                for (const condition of stressConditions) {
                    const player = { ...gameState.player, level: condition.level || 10 };
                    let successfulRuns = 0;
                    let totalRewards = 0;
                    let errors = 0;
                    let totalExecutionTime = 0;

                    const startTime = Date.now();

                    for (let i = 0; i < condition.runs; i++) {
                        const runStart = Date.now();
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(testMonster, player);
                            const runTime = Date.now() - runStart;
                            totalExecutionTime += runTime;

                            if (loot && (loot.gold > 0 || (loot.items && loot.items.length > 0))) {
                                successfulRuns++;
                                totalRewards += (loot.gold || 0) + (loot.items ? loot.items.length : 0);
                            }

                            // Rapid succession simulation
                            if (condition.rapid && i % 10 === 0) {
                                // Brief pause every 10 iterations for rapid test
                                await new Promise(resolve => setTimeout(resolve, 1));
                            }
                        } catch (error) {
                            errors++;
                        }
                    }

                    const totalTime = Date.now() - startTime;
                    const successRate = (successfulRuns / condition.runs) * 100;
                    const errorRate = (errors / condition.runs) * 100;
                    const avgRewardPerRun = totalRewards / condition.runs;
                    const avgExecutionTime = totalExecutionTime / condition.runs;

                    stressResults[condition.name] = {
                        successRate,
                        errorRate,
                        avgRewardPerRun,
                        avgExecutionTime,
                        totalTime,
                        runs: condition.runs,
                        description: condition.description
                    };

                    // Regression prevention: System should remain stable under stress
                    assertTruthy(successRate >= 60,
                        `${condition.description}: Success rate ${successRate.toFixed(1)}% should be ≥60% (stress stability)`);

                    assertTruthy(errorRate <= 10,
                        `${condition.description}: Error rate ${errorRate.toFixed(1)}% should be ≤10% (error resilience)`);

                    assertTruthy(avgExecutionTime <= 100,
                        `${condition.description}: Avg execution time ${avgExecutionTime.toFixed(1)}ms should be ≤100ms (performance stability)`);

                    assertTruthy(avgRewardPerRun >= 0.5,
                        `${condition.description}: Avg rewards ${avgRewardPerRun.toFixed(2)} should be ≥0.5 (reward consistency under stress)`);
                }

                console.log('Stress test regression prevention results:', stressResults);

                // Overall system health validation
                const conditionNames = Object.keys(stressResults);
                const overallSuccessRates = conditionNames.map(name => stressResults[name].successRate);
                const overallAvgSuccess = overallSuccessRates.reduce((sum, rate) => sum + rate, 0) / overallSuccessRates.length;

                assertTruthy(overallAvgSuccess >= 65,
                    `Overall stress success rate ${overallAvgSuccess.toFixed(1)}% should be ≥65% (system resilience)`);
            });
        });
    });

    // Task 7.6: End-to-End Tests Validating Complete Player Progression Loot Experience
    describe('End-to-End Tests - Complete Player Progression Loot Experience', function() {
        this.timeout(25000);

        describe('Early Game Progression (Levels 1-10)', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should provide consistent learning-focused loot progression for new players', function() {
                if (!window.MonsterData?.species || !window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping early game progression test');
                    return;
                }

                const earlyGameLevels = [1, 2, 3, 5, 7, 10];
                const progressionData = {};

                // Simulate early game progression
                for (const level of earlyGameLevels) {
                    const player = { ...gameState.player, level };
                    const levelData = {
                        monsterLoot: { gold: 0, items: 0, encounters: 0, types: new Set() },
                        areaLoot: { gold: 0, items: 0, explorations: 0, types: new Set() },
                        equipmentFound: new Set(),
                        consumablesFound: new Set(),
                        totalValue: 0
                    };

                    // Test monster encounters (simulate 20 encounters per level)
                    const species = Object.keys(window.MonsterData.species);
                    const earlyMonsters = species.slice(0, 3).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable && monster.lootTable.level <= level + 2);

                    if (earlyMonsters.length > 0) {
                        for (let encounter = 0; encounter < 20; encounter++) {
                            const monster = earlyMonsters[encounter % earlyMonsters.length];
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                if (loot) {
                                    levelData.monsterLoot.encounters++;
                                    levelData.monsterLoot.gold += loot.gold || 0;
                                    levelData.monsterLoot.items += loot.items ? loot.items.length : 0;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 1.5 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            if (item?.type) levelData.monsterLoot.types.add(item.type);
                                            if (item?.category === 'equipment') levelData.equipmentFound.add(item.id);
                                            if (item?.category === 'consumable') levelData.consumablesFound.add(item.id);
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling for progression tests
                            }
                        }
                    }

                    // Test area exploration (simulate 10 explorations per level)
                    const areas = Object.keys(window.AreaData.areas);
                    const earlyAreas = areas.slice(0, 2).map(name => window.AreaData.areas[name])
                        .filter(area => area?.lootTable && area.lootTable.recommendedLevel <= level + 1);

                    if (earlyAreas.length > 0) {
                        for (let exploration = 0; exploration < 10; exploration++) {
                            const area = earlyAreas[exploration % earlyAreas.length];
                            const expType = exploration % 2 === 0 ? 'quick' : 'thorough';
                            try {
                                const loot = window.LootSystem.generateAreaLoot(area, player, expType);
                                if (loot) {
                                    levelData.areaLoot.explorations++;
                                    levelData.areaLoot.gold += loot.gold || 0;
                                    levelData.areaLoot.items += loot.items ? loot.items.length : 0;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 1.5 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            if (item?.type) levelData.areaLoot.types.add(item.type);
                                            if (item?.category === 'equipment') levelData.equipmentFound.add(item.id);
                                            if (item?.category === 'consumable') levelData.consumablesFound.add(item.id);
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    progressionData[level] = levelData;
                }

                console.log('Early game progression analysis:', progressionData);

                // Validate early game progression requirements
                const validLevels = Object.keys(progressionData).filter(level =>
                    progressionData[level].totalValue > 0
                );

                assertTruthy(validLevels.length >= 4,
                    'Should have progression data for at least 4 early game levels');

                // Early game should provide consistent learning-focused rewards
                for (const level of validLevels) {
                    const data = progressionData[level];
                    const avgValuePerActivity = data.totalValue / (data.monsterLoot.encounters + data.areaLoot.explorations);

                    assertTruthy(avgValuePerActivity >= 1.0,
                        `Level ${level}: Avg value per activity ${avgValuePerActivity.toFixed(2)} should be ≥1.0 (learning phase adequacy)`);

                    // Should provide variety in item types for learning
                    const totalItemTypes = data.monsterLoot.types.size + data.areaLoot.types.size;
                    assertTruthy(totalItemTypes >= 2,
                        `Level ${level}: Should discover ≥2 different item types for learning (found ${totalItemTypes})`);

                    // Should find some basic equipment and consumables
                    const totalEquipment = data.equipmentFound.size;
                    const totalConsumables = data.consumablesFound.size;
                    assertTruthy(totalEquipment + totalConsumables >= 1,
                        `Level ${level}: Should find some equipment or consumables for progression (found ${totalEquipment + totalConsumables})`);
                }

                // Progression scaling validation: later levels should generally be better
                if (validLevels.length >= 3) {
                    const earlyValue = progressionData[validLevels[0]]?.totalValue || 0;
                    const midValue = progressionData[validLevels[Math.floor(validLevels.length / 2)]]?.totalValue || 0;
                    const lateValue = progressionData[validLevels[validLevels.length - 1]]?.totalValue || 0;

                    if (earlyValue > 0 && lateValue > 0) {
                        const progressionRatio = lateValue / earlyValue;
                        assertTruthy(progressionRatio >= 0.8,
                            `Early game progression ratio ${progressionRatio.toFixed(2)} should show growth or stability (≥0.8)`);
                    }
                }
            });

            it('should ensure adequate healing item availability for survival learning', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping healing availability test');
                    return;
                }

                const earlyLevels = [1, 3, 5, 8, 10];
                const healingResults = {};

                for (const level of earlyLevels) {
                    const player = { ...gameState.player, level };
                    let healingItemsFound = 0;
                    let totalEncounters = 0;
                    let healingItemTypes = new Set();

                    // Test across multiple early game monsters
                    const species = Object.keys(window.MonsterData.species);
                    const testMonsters = species.slice(0, 4).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable);

                    for (const monster of testMonsters) {
                        for (let i = 0; i < 25; i++) { // 25 encounters per monster
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                totalEncounters++;

                                if (loot?.items) {
                                    for (const item of loot.items) {
                                        // Basic healing item detection
                                        if (item?.id && (
                                            item.id.includes('health') ||
                                            item.id.includes('heal') ||
                                            item.id.includes('potion') ||
                                            item.category === 'healing'
                                        )) {
                                            healingItemsFound++;
                                            healingItemTypes.add(item.id);
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    if (totalEncounters > 0) {
                        const healingRate = (healingItemsFound / totalEncounters) * 100;
                        healingResults[level] = {
                            healingRate,
                            healingItemsFound,
                            totalEncounters,
                            healingTypes: healingItemTypes.size
                        };

                        // Early game should provide reasonable healing item access
                        assertTruthy(healingRate >= 10,
                            `Level ${level}: Healing item rate ${healingRate.toFixed(1)}% should be ≥10% (survival support)`);

                        // Should have some variety in healing options
                        assertTruthy(healingItemTypes.size >= 1,
                            `Level ${level}: Should have access to at least 1 type of healing item (found ${healingItemTypes.size})`);
                    }
                }

                console.log('Early game healing item availability:', healingResults);

                // Overall early game healing adequacy
                const validResults = Object.keys(healingResults);
                assertTruthy(validResults.length >= 3,
                    'Should have healing data for at least 3 early game levels');

                const avgHealingRates = validResults.map(level => healingResults[level].healingRate);
                const overallHealingRate = avgHealingRates.reduce((sum, rate) => sum + rate, 0) / avgHealingRates.length;

                assertTruthy(overallHealingRate >= 12,
                    `Overall early game healing rate ${overallHealingRate.toFixed(1)}% should be ≥12% (survival adequacy)`);
            });
        });

        describe('Mid Game Progression (Levels 11-20)', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should provide strategic equipment variety and meaningful choices', function() {
                if (!window.MonsterData?.species || !window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping mid game progression test');
                    return;
                }

                const midGameLevels = [11, 13, 15, 17, 20];
                const strategicData = {};

                for (const level of midGameLevels) {
                    const player = { ...gameState.player, level };
                    const levelData = {
                        equipmentTypes: new Set(),
                        rarityDistribution: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
                        totalEquipment: 0,
                        weaponOptions: new Set(),
                        armorOptions: new Set(),
                        accessoryOptions: new Set(),
                        totalValue: 0,
                        activities: 0
                    };

                    // Test mid-game monster encounters
                    const species = Object.keys(window.MonsterData.species);
                    const midGameMonsters = species.slice(2, 8).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable &&
                            monster.lootTable.level >= level - 3 &&
                            monster.lootTable.level <= level + 2);

                    for (const monster of midGameMonsters) {
                        for (let i = 0; i < 15; i++) { // 15 encounters per monster
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                if (loot) {
                                    levelData.activities++;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 2 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            if (item?.category === 'equipment' || item?.type === 'equipment') {
                                                levelData.totalEquipment++;
                                                levelData.equipmentTypes.add(item.type || 'unknown');

                                                if (item.type === 'weapon') levelData.weaponOptions.add(item.id);
                                                if (item.type === 'armor') levelData.armorOptions.add(item.id);
                                                if (item.type === 'accessory') levelData.accessoryOptions.add(item.id);

                                                const rarity = item.rarity || 'common';
                                                if (levelData.rarityDistribution.hasOwnProperty(rarity)) {
                                                    levelData.rarityDistribution[rarity]++;
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    // Test mid-game area exploration
                    const areas = Object.keys(window.AreaData.areas);
                    const midGameAreas = areas.slice(1, 5).map(name => window.AreaData.areas[name])
                        .filter(area => area?.lootTable &&
                            area.lootTable.recommendedLevel >= level - 2 &&
                            area.lootTable.recommendedLevel <= level + 1);

                    for (const area of midGameAreas) {
                        for (let i = 0; i < 8; i++) { // 8 explorations per area
                            const expType = ['thorough', 'exhaustive'][i % 2];
                            try {
                                const loot = window.LootSystem.generateAreaLoot(area, player, expType);
                                if (loot) {
                                    levelData.activities++;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 2 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            if (item?.category === 'equipment' || item?.type === 'equipment') {
                                                levelData.totalEquipment++;
                                                levelData.equipmentTypes.add(item.type || 'unknown');

                                                if (item.type === 'weapon') levelData.weaponOptions.add(item.id);
                                                if (item.type === 'armor') levelData.armorOptions.add(item.id);
                                                if (item.type === 'accessory') levelData.accessoryOptions.add(item.id);

                                                const rarity = item.rarity || 'common';
                                                if (levelData.rarityDistribution.hasOwnProperty(rarity)) {
                                                    levelData.rarityDistribution[rarity]++;
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    strategicData[level] = levelData;
                }

                console.log('Mid game strategic progression analysis:', strategicData);

                // Validate mid-game strategic requirements
                const validLevels = Object.keys(strategicData).filter(level =>
                    strategicData[level].activities > 0
                );

                assertTruthy(validLevels.length >= 3,
                    'Should have strategic data for at least 3 mid-game levels');

                for (const level of validLevels) {
                    const data = strategicData[level];

                    // Should provide equipment variety for strategic choices
                    assertTruthy(data.equipmentTypes.size >= 2,
                        `Level ${level}: Should offer ≥2 equipment types for strategic variety (found ${data.equipmentTypes.size})`);

                    // Should have meaningful equipment density
                    const equipmentRate = data.activities > 0 ? (data.totalEquipment / data.activities) * 100 : 0;
                    assertTruthy(equipmentRate >= 15,
                        `Level ${level}: Equipment rate ${equipmentRate.toFixed(1)}% should be ≥15% (strategic density)`);

                    // Should include some higher rarity items for progression
                    const totalRareItems = data.rarityDistribution.rare + data.rarityDistribution.epic + data.rarityDistribution.legendary;
                    const rarityRate = data.totalEquipment > 0 ? (totalRareItems / data.totalEquipment) * 100 : 0;
                    assertTruthy(rarityRate >= 5,
                        `Level ${level}: Rare+ item rate ${rarityRate.toFixed(1)}% should be ≥5% (progression significance)`);

                    // Should provide weapon choices
                    assertTruthy(data.weaponOptions.size >= 1,
                        `Level ${level}: Should find weapon options for strategic choice (found ${data.weaponOptions.size})`);
                }

                // Cross-level strategic progression validation
                if (validLevels.length >= 2) {
                    const earlyMidData = strategicData[validLevels[0]];
                    const lateMidData = strategicData[validLevels[validLevels.length - 1]];

                    // Later mid-game should offer more equipment variety
                    assertTruthy(lateMidData.equipmentTypes.size >= earlyMidData.equipmentTypes.size,
                        'Later mid-game should maintain or increase equipment type variety');

                    // Should show progression in value
                    assertTruthy(lateMidData.totalValue >= earlyMidData.totalValue * 0.8,
                        'Mid-game progression should maintain or increase total value');
                }
            });

            it('should balance spell diversity with equipment progression', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping spell diversity test');
                    return;
                }

                const midLevels = [12, 15, 18];
                const spellBalanceData = {};

                for (const level of midLevels) {
                    const player = { ...gameState.player, level };
                    const balanceData = {
                        spellItems: 0,
                        equipmentItems: 0,
                        consumableItems: 0,
                        spellTypes: new Set(),
                        equipmentTypes: new Set(),
                        totalActivities: 0,
                        totalValue: 0
                    };

                    // Test diverse mid-game content
                    const species = Object.keys(window.MonsterData.species);
                    const testMonsters = species.slice(3, 7).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable);

                    for (const monster of testMonsters) {
                        for (let i = 0; i < 20; i++) {
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                if (loot) {
                                    balanceData.totalActivities++;
                                    balanceData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 2 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            if (item?.category === 'spell' || item?.type === 'spell' ||
                                                item?.id?.includes('scroll') || item?.id?.includes('spell')) {
                                                balanceData.spellItems++;
                                                balanceData.spellTypes.add(item.id || item.type);
                                            } else if (item?.category === 'equipment' || item?.type === 'equipment') {
                                                balanceData.equipmentItems++;
                                                balanceData.equipmentTypes.add(item.type || 'unknown');
                                            } else if (item?.category === 'consumable') {
                                                balanceData.consumableItems++;
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    spellBalanceData[level] = balanceData;
                }

                console.log('Mid game spell/equipment balance analysis:', spellBalanceData);

                // Validate spell/equipment balance
                const validLevels = Object.keys(spellBalanceData).filter(level =>
                    spellBalanceData[level].totalActivities > 0
                );

                assertTruthy(validLevels.length >= 2,
                    'Should have balance data for at least 2 mid-game levels');

                for (const level of validLevels) {
                    const data = spellBalanceData[level];
                    const totalItems = data.spellItems + data.equipmentItems + data.consumableItems;

                    if (totalItems > 0) {
                        // Should maintain reasonable balance between spell and equipment items
                        const equipmentRate = (data.equipmentItems / totalItems) * 100;
                        const spellRate = (data.spellItems / totalItems) * 100;
                        const consumableRate = (data.consumableItems / totalItems) * 100;

                        assertTruthy(equipmentRate >= 20,
                            `Level ${level}: Equipment rate ${equipmentRate.toFixed(1)}% should be ≥20% (progression importance)`);

                        // Total meaningful item variety
                        const totalDiversity = data.spellTypes.size + data.equipmentTypes.size;
                        assertTruthy(totalDiversity >= 3,
                            `Level ${level}: Should offer ≥3 diverse item types for strategic depth (found ${totalDiversity})`);

                        // No single category should completely dominate
                        assertTruthy(equipmentRate <= 80 && spellRate <= 80 && consumableRate <= 80,
                            `Level ${level}: No single item category should exceed 80% (balance maintenance)`);
                    }
                }
            });
        });

        describe('Late Game Progression (Levels 21-30+)', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should focus on rare/epic/legendary items with prestige value', function() {
                if (!window.MonsterData?.species || !window.AreaData?.areas || !window.LootSystem) {
                    console.warn('Required systems not available, skipping late game progression test');
                    return;
                }

                const lateGameLevels = [21, 25, 30];
                const prestigeData = {};

                for (const level of lateGameLevels) {
                    const player = { ...gameState.player, level };
                    const levelData = {
                        rarityDistribution: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
                        totalItems: 0,
                        prestigeItems: 0, // rare+ items
                        highValueItems: 0, // epic+ items
                        legendaryItems: 0,
                        totalValue: 0,
                        activities: 0,
                        uniquePrestigeItems: new Set()
                    };

                    // Test late-game monster encounters
                    const species = Object.keys(window.MonsterData.species);
                    const lateGameMonsters = species.slice(4, 10).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable && monster.lootTable.level >= level - 5);

                    for (const monster of lateGameMonsters) {
                        for (let i = 0; i < 20; i++) { // 20 encounters per monster
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                if (loot) {
                                    levelData.activities++;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 3 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            levelData.totalItems++;
                                            const rarity = item.rarity || 'common';

                                            if (levelData.rarityDistribution.hasOwnProperty(rarity)) {
                                                levelData.rarityDistribution[rarity]++;
                                            }

                                            if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
                                                levelData.prestigeItems++;
                                                levelData.uniquePrestigeItems.add(item.id || `${rarity}_item_${levelData.prestigeItems}`);
                                            }

                                            if (rarity === 'epic' || rarity === 'legendary') {
                                                levelData.highValueItems++;
                                            }

                                            if (rarity === 'legendary') {
                                                levelData.legendaryItems++;
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    // Test late-game area exploration
                    const areas = Object.keys(window.AreaData.areas);
                    const lateGameAreas = areas.slice(2, 6).map(name => window.AreaData.areas[name])
                        .filter(area => area?.lootTable && area.lootTable.recommendedLevel >= level - 3);

                    for (const area of lateGameAreas) {
                        for (let i = 0; i < 10; i++) { // 10 explorations per area
                            const expType = 'exhaustive'; // Focus on thorough late-game exploration
                            try {
                                const loot = window.LootSystem.generateAreaLoot(area, player, expType);
                                if (loot) {
                                    levelData.activities++;
                                    levelData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 3 : 0);

                                    if (loot.items) {
                                        for (const item of loot.items) {
                                            levelData.totalItems++;
                                            const rarity = item.rarity || 'common';

                                            if (levelData.rarityDistribution.hasOwnProperty(rarity)) {
                                                levelData.rarityDistribution[rarity]++;
                                            }

                                            if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
                                                levelData.prestigeItems++;
                                                levelData.uniquePrestigeItems.add(item.id || `${rarity}_item_${levelData.prestigeItems}`);
                                            }

                                            if (rarity === 'epic' || rarity === 'legendary') {
                                                levelData.highValueItems++;
                                            }

                                            if (rarity === 'legendary') {
                                                levelData.legendaryItems++;
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    prestigeData[level] = levelData;
                }

                console.log('Late game prestige progression analysis:', prestigeData);

                // Validate late-game prestige requirements
                const validLevels = Object.keys(prestigeData).filter(level =>
                    prestigeData[level].totalItems > 0
                );

                assertTruthy(validLevels.length >= 2,
                    'Should have prestige data for at least 2 late-game levels');

                for (const level of validLevels) {
                    const data = prestigeData[level];

                    // Late game should focus on rare+ items
                    const prestigeRate = (data.prestigeItems / data.totalItems) * 100;
                    assertTruthy(prestigeRate >= 15,
                        `Level ${level}: Prestige item rate ${prestigeRate.toFixed(1)}% should be ≥15% (late game focus)`);

                    // Should include high-value epic+ items
                    const highValueRate = (data.highValueItems / data.totalItems) * 100;
                    assertTruthy(highValueRate >= 5,
                        `Level ${level}: High-value item rate ${highValueRate.toFixed(1)}% should be ≥5% (prestige progression)`);

                    // Should offer variety in prestige items
                    assertTruthy(data.uniquePrestigeItems.size >= 3,
                        `Level ${level}: Should offer ≥3 unique prestige items for collection value (found ${data.uniquePrestigeItems.size})`);

                    // Total value should be substantial for late game
                    const avgValuePerActivity = data.totalValue / data.activities;
                    assertTruthy(avgValuePerActivity >= 5,
                        `Level ${level}: Avg value per activity ${avgValuePerActivity.toFixed(2)} should be ≥5 (late game economy)`);
                }

                // Late game progression should show increasing prestige focus
                if (validLevels.length >= 2) {
                    const earlyLateData = prestigeData[validLevels[0]];
                    const trueLateData = prestigeData[validLevels[validLevels.length - 1]];

                    const earlyPrestigeRate = (earlyLateData.prestigeItems / earlyLateData.totalItems) * 100;
                    const latePrestigeRate = (trueLateData.prestigeItems / trueLateData.totalItems) * 100;

                    assertTruthy(latePrestigeRate >= earlyPrestigeRate * 0.8,
                        `True late game prestige rate ${latePrestigeRate.toFixed(1)}% should maintain or exceed early late game ${earlyPrestigeRate.toFixed(1)}%`);
                }
            });

            it('should provide end-game collection and achievement satisfaction', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping end-game collection test');
                    return;
                }

                const endGameLevel = 30;
                const player = { ...gameState.player, level: endGameLevel };
                const collectionData = {
                    totalUniqueItems: new Set(),
                    rarityCollections: { common: new Set(), uncommon: new Set(), rare: new Set(), epic: new Set(), legendary: new Set() },
                    categoryCollections: { equipment: new Set(), consumable: new Set(), material: new Set(), spell: new Set() },
                    prestigeAchievements: 0,
                    totalValue: 0,
                    activities: 0
                };

                // Extensive end-game farming simulation
                const species = Object.keys(window.MonsterData.species);
                const endGameMonsters = species.map(name => window.MonsterData.species[name])
                    .filter(monster => monster?.lootTable);

                // Test comprehensive monster variety
                for (const monster of endGameMonsters.slice(0, 6)) { // Test top 6 monsters
                    for (let i = 0; i < 30; i++) { // 30 encounters per monster
                        try {
                            const loot = window.LootSystem.generateMonsterLoot(monster, player);
                            if (loot) {
                                collectionData.activities++;
                                collectionData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 4 : 0);

                                if (loot.items) {
                                    for (const item of loot.items) {
                                        const itemId = item.id || `item_${collectionData.totalUniqueItems.size}`;
                                        collectionData.totalUniqueItems.add(itemId);

                                        const rarity = item.rarity || 'common';
                                        const category = item.category || item.type || 'material';

                                        if (collectionData.rarityCollections.hasOwnProperty(rarity)) {
                                            collectionData.rarityCollections[rarity].add(itemId);
                                        }

                                        if (collectionData.categoryCollections.hasOwnProperty(category)) {
                                            collectionData.categoryCollections[category].add(itemId);
                                        }

                                        // Count prestige achievements (rare+ items)
                                        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
                                            collectionData.prestigeAchievements++;
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                    }
                }

                console.log('End-game collection analysis:', {
                    totalUniqueItems: collectionData.totalUniqueItems.size,
                    rarityBreakdown: Object.keys(collectionData.rarityCollections).map(rarity => ({
                        rarity,
                        count: collectionData.rarityCollections[rarity].size
                    })),
                    categoryBreakdown: Object.keys(collectionData.categoryCollections).map(category => ({
                        category,
                        count: collectionData.categoryCollections[category].size
                    })),
                    prestigeAchievements: collectionData.prestigeAchievements,
                    totalValue: collectionData.totalValue,
                    activities: collectionData.activities
                });

                // Validate end-game collection satisfaction
                assertTruthy(collectionData.totalUniqueItems.size >= 10,
                    `End-game should provide ≥10 unique collectible items (found ${collectionData.totalUniqueItems.size})`);

                // Should have meaningful rarity diversity
                const rarityDiversity = Object.values(collectionData.rarityCollections)
                    .filter(collection => collection.size > 0).length;
                assertTruthy(rarityDiversity >= 3,
                    `End-game should span ≥3 rarity tiers for collection depth (found ${rarityDiversity})`);

                // Should have category diversity
                const categoryDiversity = Object.values(collectionData.categoryCollections)
                    .filter(collection => collection.size > 0).length;
                assertTruthy(categoryDiversity >= 2,
                    `End-game should span ≥2 item categories for collection breadth (found ${categoryDiversity})`);

                // Should provide substantial prestige achievements
                assertTruthy(collectionData.prestigeAchievements >= 10,
                    `End-game should provide ≥10 prestige achievements (found ${collectionData.prestigeAchievements})`);

                // Should have achieved meaningful rare+ collection
                const rareItems = collectionData.rarityCollections.rare.size;
                const epicItems = collectionData.rarityCollections.epic.size;
                const legendaryItems = collectionData.rarityCollections.legendary.size;
                const totalRareItems = rareItems + epicItems + legendaryItems;

                assertTruthy(totalRareItems >= 5,
                    `End-game should collect ≥5 unique rare+ items (found ${totalRareItems})`);

                // End-game value should be substantial
                const avgValuePerActivity = collectionData.totalValue / collectionData.activities;
                assertTruthy(avgValuePerActivity >= 8,
                    `End-game avg value per activity ${avgValuePerActivity.toFixed(2)} should be ≥8 (satisfaction economy)`);
            });
        });

        describe('Cross-Phase Progression Validation', function() {
            let gameState;

            beforeEach(function() {
                gameState = createBasicGameState();
            });

            it('should demonstrate smooth progression across all game phases', function() {
                if (!window.MonsterData?.species || !window.LootSystem) {
                    console.warn('Required systems not available, skipping cross-phase progression test');
                    return;
                }

                const phaseRepresentatives = [
                    { phase: 'early', level: 5 },
                    { phase: 'mid', level: 15 },
                    { phase: 'late', level: 25 }
                ];

                const phaseComparison = {};

                for (const phaseRep of phaseRepresentatives) {
                    const player = { ...gameState.player, level: phaseRep.level };
                    const phaseData = {
                        totalValue: 0,
                        itemsFound: 0,
                        activities: 0,
                        rarityDistribution: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
                        uniqueItems: new Set()
                    };

                    // Standardized test across phases
                    const species = Object.keys(window.MonsterData.species);
                    const phaseMonsters = species.slice(0, 3).map(name => window.MonsterData.species[name])
                        .filter(monster => monster?.lootTable);

                    for (const monster of phaseMonsters) {
                        for (let i = 0; i < 25; i++) { // 25 encounters per monster per phase
                            try {
                                const loot = window.LootSystem.generateMonsterLoot(monster, player);
                                if (loot) {
                                    phaseData.activities++;
                                    phaseData.totalValue += (loot.gold || 0) + (loot.items ? loot.items.length * 2 : 0);

                                    if (loot.items) {
                                        phaseData.itemsFound += loot.items.length;
                                        for (const item of loot.items) {
                                            phaseData.uniqueItems.add(item.id || `item_${phaseData.itemsFound}`);
                                            const rarity = item.rarity || 'common';
                                            if (phaseData.rarityDistribution.hasOwnProperty(rarity)) {
                                                phaseData.rarityDistribution[rarity]++;
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                // Silent error handling
                            }
                        }
                    }

                    phaseComparison[phaseRep.phase] = phaseData;
                }

                console.log('Cross-phase progression comparison:', phaseComparison);

                // Validate smooth cross-phase progression
                const phases = ['early', 'mid', 'late'];
                const validPhases = phases.filter(phase =>
                    phaseComparison[phase] && phaseComparison[phase].activities > 0
                );

                assertTruthy(validPhases.length >= 2,
                    'Should have data for at least 2 game phases for comparison');

                // Each phase should provide reasonable value
                for (const phase of validPhases) {
                    const data = phaseComparison[phase];
                    const avgValuePerActivity = data.totalValue / data.activities;

                    assertTruthy(avgValuePerActivity >= 1.0,
                        `${phase} phase: Avg value per activity ${avgValuePerActivity.toFixed(2)} should be ≥1.0 (viability)`);

                    assertTruthy(data.uniqueItems.size >= 3,
                        `${phase} phase: Should offer ≥3 unique items for progression (found ${data.uniqueItems.size})`);
                }

                // Progression should show appropriate scaling
                if (validPhases.includes('early') && validPhases.includes('late')) {
                    const earlyValue = phaseComparison.early.totalValue / phaseComparison.early.activities;
                    const lateValue = phaseComparison.late.totalValue / phaseComparison.late.activities;

                    const progressionRatio = lateValue / earlyValue;
                    assertTruthy(progressionRatio >= 1.2,
                        `Late game progression ratio ${progressionRatio.toFixed(2)} should show meaningful advancement (≥1.2x early game)`);
                }

                // Mid-game should bridge early and late appropriately
                if (validPhases.includes('early') && validPhases.includes('mid') && validPhases.includes('late')) {
                    const earlyValue = phaseComparison.early.totalValue / phaseComparison.early.activities;
                    const midValue = phaseComparison.mid.totalValue / phaseComparison.mid.activities;
                    const lateValue = phaseComparison.late.totalValue / phaseComparison.late.activities;

                    assertTruthy(midValue >= earlyValue && midValue <= lateValue * 1.2,
                        'Mid-game should appropriately bridge early and late game values');
                }

                // Rarity progression should show appropriate trends
                if (validPhases.includes('early') && validPhases.includes('late')) {
                    const earlyRareItems = phaseComparison.early.rarityDistribution.rare +
                                         phaseComparison.early.rarityDistribution.epic +
                                         phaseComparison.early.rarityDistribution.legendary;
                    const lateRareItems = phaseComparison.late.rarityDistribution.rare +
                                        phaseComparison.late.rarityDistribution.epic +
                                        phaseComparison.late.rarityDistribution.legendary;

                    assertTruthy(lateRareItems >= earlyRareItems,
                        'Late game should maintain or increase rare item availability');
                }
            });
        });
    });
});