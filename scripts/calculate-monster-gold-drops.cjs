#!/usr/bin/env node

/**
 * Calculate Optimal Monster Gold Drops
 *
 * This script calculates the optimal gold drop ranges for each monster
 * to achieve the target earning rate of 1000-2000 gold per hour.
 *
 * Assumptions from CLAUDE.md and PRD:
 * - Encounter rate: 70-75% (we'll use 72.5% average)
 * - Combat duration: ~30-60 seconds (we'll use 45 seconds average)
 * - Explorations per hour: ~60-80 (we'll use 70)
 * - Effective combats per hour: 70 * 0.725 = ~51 combats/hour
 *
 * Target: 1000-2000 gold per hour
 * Gold per combat: 1000-2000 / 51 = ~20-40 gold per combat average
 */

const TARGET_GOLD_PER_HOUR = [1000, 2000];
const ENCOUNTER_RATE = 0.725; // 72.5% from CLAUDE.md (70-75%)
const EXPLORATIONS_PER_HOUR = 70; // Reasonable estimate
const COMBATS_PER_HOUR = Math.floor(EXPLORATIONS_PER_HOUR * ENCOUNTER_RATE); // ~51

const MIN_GOLD_PER_COMBAT = Math.floor(TARGET_GOLD_PER_HOUR[0] / COMBATS_PER_HOUR); // ~20
const MAX_GOLD_PER_COMBAT = Math.floor(TARGET_GOLD_PER_HOUR[1] / COMBATS_PER_HOUR); // ~40

console.log('='.repeat(80));
console.log('MONSTER GOLD DROP CALCULATOR');
console.log('='.repeat(80));
console.log();
console.log('Combat Assumptions:');
console.log(`  - Encounter Rate: ${(ENCOUNTER_RATE * 100).toFixed(1)}%`);
console.log(`  - Explorations per Hour: ${EXPLORATIONS_PER_HOUR}`);
console.log(`  - Combats per Hour: ${COMBATS_PER_HOUR}`);
console.log();
console.log('Gold Targets:');
console.log(`  - Target Gold/Hour: ${TARGET_GOLD_PER_HOUR[0]}-${TARGET_GOLD_PER_HOUR[1]}`);
console.log(`  - Average Gold per Combat: ${MIN_GOLD_PER_COMBAT}-${MAX_GOLD_PER_COMBAT}`);
console.log();
console.log('='.repeat(80));
console.log();

/**
 * Calculate gold drop range for a monster based on its level
 *
 * Formula:
 * - Base gold scales linearly to maintain consistent earning rates
 * - Target: 20-40 gold average per combat for common monsters
 * - Scales with player progression but maintains earning rate
 */
function calculateGoldDrops(monsterLevel, rarity = 'common') {
  // Linear formula to maintain consistent earning rate
  // Level 1: ~20 gold, Level 10: ~30 gold, Level 20: ~35 gold, Level 30: ~40 gold
  // This creates gentle progression while keeping earning rates in target range

  let baseGold;

  if (monsterLevel <= 10) {
    // Early to mid game: 20-30 gold average
    baseGold = 18 + (monsterLevel - 1) * 1.2; // Level 1: 18, Level 10: ~29
  } else if (monsterLevel <= 20) {
    // Mid to late game: 30-35 gold average
    baseGold = 29 + (monsterLevel - 10) * 0.6; // Level 11: ~30, Level 20: ~35
  } else {
    // End game: 35-40 gold average
    baseGold = 35 + (monsterLevel - 20) * 0.5; // Level 21: ~36, Level 30: ~40
  }

  // Rarity multipliers
  const rarityMultipliers = {
    'common': 1.0,
    'uncommon': 1.3,
    'rare': 1.7,
    'epic': 2.5,
    'legendary': 4.0
  };

  const multiplier = rarityMultipliers[rarity] || 1.0;
  baseGold = Math.floor(baseGold * multiplier);

  // Calculate min/max with ~25% variance
  const minGold = Math.max(1, Math.floor(baseGold * 0.875));
  const maxGold = Math.ceil(baseGold * 1.125);

  return {
    level: monsterLevel,
    rarity,
    goldDropMin: minGold,
    goldDropMax: maxGold,
    average: Math.floor((minGold + maxGold) / 2)
  };
}

/**
 * Generate gold drop recommendations for all monster levels
 */
function generateGoldDropTable() {
  const results = [];
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  console.log('Recommended Gold Drops by Monster Level and Rarity:');
  console.log('-'.repeat(80));
  console.log('Level  | Common      | Uncommon    | Rare        | Epic        | Legendary');
  console.log('-'.repeat(80));

  for (let level = 1; level <= 30; level++) {
    const row = [level.toString().padStart(2)];

    rarities.forEach(rarity => {
      const drops = calculateGoldDrops(level, rarity);
      row.push(`${drops.goldDropMin}-${drops.goldDropMax}`.padStart(10));

      if (rarity === 'common') {
        results.push(drops);
      }
    });

    console.log(row.join(' | '));
  }

  console.log('-'.repeat(80));
  console.log();

  return results;
}

/**
 * Validate that the gold drops achieve the target earning rate
 */
function validateEarningRate(goldDrops) {
  console.log('Earning Rate Validation:');
  console.log('-'.repeat(80));
  console.log('Level Range | Avg Gold/Combat | Gold/Hour (est) | Meets Target?');
  console.log('-'.repeat(80));

  const levelRanges = [
    { name: 'Level 1-5', levels: [1, 5] },
    { name: 'Level 6-10', levels: [6, 10] },
    { name: 'Level 11-15', levels: [11, 15] },
    { name: 'Level 16-20', levels: [16, 20] },
    { name: 'Level 21-25', levels: [21, 25] },
    { name: 'Level 26-30', levels: [26, 30] }
  ];

  let allValid = true;

  levelRanges.forEach(range => {
    const relevantDrops = goldDrops.filter(d =>
      d.level >= range.levels[0] && d.level <= range.levels[1]
    );

    if (relevantDrops.length === 0) return;

    const avgGold = relevantDrops.reduce((sum, d) => sum + d.average, 0) / relevantDrops.length;
    const goldPerHour = Math.floor(avgGold * COMBATS_PER_HOUR);
    const meetsTarget = goldPerHour >= TARGET_GOLD_PER_HOUR[0] && goldPerHour <= TARGET_GOLD_PER_HOUR[1];

    const status = meetsTarget ? '✓ YES' : '✗ NO';
    if (!meetsTarget) allValid = false;

    console.log(
      `${range.name.padEnd(12)} | ${avgGold.toFixed(1).padStart(15)} | ` +
      `${goldPerHour.toString().padStart(14)} | ${status}`
    );
  });

  console.log('-'.repeat(80));
  console.log();

  if (allValid) {
    console.log('✓ All level ranges meet the target earning rate!');
  } else {
    console.log('✗ Some level ranges do not meet the target. Adjustments needed.');
  }

  console.log();
}

/**
 * Generate monster-specific recommendations
 */
function generateMonsterRecommendations() {
  console.log('Specific Monster Recommendations:');
  console.log('-'.repeat(80));

  const monsters = [
    { name: 'Slime', level: 1, rarity: 'common' },
    { name: 'Goblin', level: 2, rarity: 'common' },
    { name: 'Wolf', level: 4, rarity: 'common' },
    { name: 'Orc', level: 6, rarity: 'uncommon' },
    { name: 'Dire Wolf', level: 8, rarity: 'uncommon' },
    { name: 'Alpha Wolf', level: 15, rarity: 'rare' },
    { name: 'Fire Sprite', level: 20, rarity: 'uncommon' },
    { name: 'Dragon Whelp', level: 25, rarity: 'rare' },
    { name: 'Ancient Dragon', level: 35, rarity: 'legendary' }
  ];

  console.log('Monster        | Level | Rarity    | Gold Drop Range | Average');
  console.log('-'.repeat(80));

  monsters.forEach(monster => {
    const drops = calculateGoldDrops(monster.level, monster.rarity);
    console.log(
      `${monster.name.padEnd(14)} | ${monster.level.toString().padStart(5)} | ` +
      `${monster.rarity.padEnd(9)} | ${drops.goldDropMin}-${drops.goldDropMax}`.padEnd(16) +
      ` | ${drops.average}`
    );
  });

  console.log('-'.repeat(80));
  console.log();
}

// Run the calculations
const goldDrops = generateGoldDropTable();
console.log();
validateEarningRate(goldDrops);
console.log();
generateMonsterRecommendations();

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log();
console.log('Gold drop formulas have been calculated to achieve 1000-2000 gold per hour.');
console.log('Use these values to update public/data/monsters.js');
console.log();
console.log('Key Points:');
console.log('  - Common monsters at player level provide ~20-40 gold average');
console.log('  - Rare monsters provide 1.7x multiplier');
console.log('  - Boss monsters should use epic/legendary multipliers');
console.log('  - Early game (level 1-5) is slightly more generous to help players start');
console.log();
console.log('='.repeat(80));
