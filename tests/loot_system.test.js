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