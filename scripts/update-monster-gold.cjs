#!/usr/bin/env node

/**
 * Update Monster Gold Drops Script
 *
 * This script updates all monster gold drops in public/data/monsters.js
 * using the calculated optimal values.
 */

const fs = require('fs');
const path = require('path');

// Gold calculation function (same as calculator script)
function calculateGoldDrops(monsterLevel, rarity = 'common') {
  let baseGold;

  if (monsterLevel <= 10) {
    baseGold = 18 + (monsterLevel - 1) * 1.2;
  } else if (monsterLevel <= 20) {
    baseGold = 29 + (monsterLevel - 10) * 0.6;
  } else {
    baseGold = 35 + (monsterLevel - 20) * 0.5;
  }

  const rarityMultipliers = {
    'common': 1.0,
    'uncommon': 1.3,
    'rare': 1.7,
    'epic': 2.5,
    'legendary': 4.0
  };

  const multiplier = rarityMultipliers[rarity] || 1.0;
  baseGold = Math.floor(baseGold * multiplier);

  const minGold = Math.max(1, Math.floor(baseGold * 0.875));
  const maxGold = Math.ceil(baseGold * 1.125);

  return {
    goldDropMin: minGold,
    goldDropMax: maxGold
  };
}

// Monster data with levels and rarities
// Extracted from monsters.js analysis
const monsterData = [
  { name: 'slime', level: 1, rarity: 'common' },
  { name: 'goblin', level: 2, rarity: 'common' },
  { name: 'wolf', level: 4, rarity: 'common' },
  { name: 'orc', level: 8, rarity: 'uncommon' },
  { name: 'dire_wolf', level: 6, rarity: 'uncommon' },
  { name: 'alpha_wolf', level: 25, rarity: 'rare' },
  { name: 'wild_horse', level: 4, rarity: 'common' },
  { name: 'hawk', level: 3, rarity: 'common' },
  { name: 'mountain_goat', level: 5, rarity: 'common' },
  { name: 'rock_lizard', level: 12, rarity: 'uncommon' },
  { name: 'bat', level: 4, rarity: 'common' },
  { name: 'crystal_spider', level: 13, rarity: 'uncommon' },
  { name: 'gem_slime', level: 14, rarity: 'uncommon' },
  { name: 'cave_troll', level: 28, rarity: 'rare' },
  { name: 'fire_sprite', level: 15, rarity: 'uncommon' },
  { name: 'fire_bat', level: 15, rarity: 'uncommon' },
  { name: 'salamander', level: 16, rarity: 'uncommon' },
  { name: 'lava_golem', level: 32, rarity: 'rare' },
  { name: 'dragon_whelp', level: 30, rarity: 'rare' },
  { name: 'wyvern', level: 30, rarity: 'rare' },
  { name: 'fire_drake', level: 35, rarity: 'rare' },
  { name: 'ancient_dragon', level: 50, rarity: 'legendary' },
  { name: 'nature_sprite', level: 20, rarity: 'uncommon' },
  { name: 'unicorn', level: 18, rarity: 'rare' },
  { name: 'treant', level: 22, rarity: 'rare' },
  { name: 'fairy', level: 10, rarity: 'uncommon' }
];

// Update monster gold drops
function updateMonsterGold() {
  const filePath = path.join(__dirname, '..', 'public', 'data', 'monsters.js');
  let content = fs.readFileSync(filePath, 'utf8');

  console.log('Updating monster gold drops...\n');
  console.log('Monster          | Level | Rarity    | Old Range  | New Range');
  console.log('-'.repeat(70));

  let updatedCount = 0;

  monsterData.forEach(monster => {
    const goldDrops = calculateGoldDrops(monster.level, monster.rarity);

    // Find and extract old values for reporting
    const goldMinRegex = new RegExp(
      `(${monster.name}:[\\s\\S]*?lootTable:[\\s\\S]*?)goldDropMin:\\s*\\d+,`,
      'm'
    );
    const goldMaxRegex = new RegExp(
      `(${monster.name}:[\\s\\S]*?lootTable:[\\s\\S]*?)goldDropMax:\\s*\\d+,`,
      'm'
    );

    const oldMinMatch = content.match(goldMinRegex);
    const oldMaxMatch = content.match(goldMaxRegex);

    let oldMin = 'N/A';
    let oldMax = 'N/A';

    if (oldMinMatch) {
      const minValue = oldMinMatch[0].match(/goldDropMin:\s*(\d+)/);
      if (minValue) oldMin = minValue[1];
    }

    if (oldMaxMatch) {
      const maxValue = oldMaxMatch[0].match(/goldDropMax:\s*(\d+)/);
      if (maxValue) oldMax = maxValue[1];
    }

    // Update goldDropMin
    content = content.replace(
      new RegExp(
        `(${monster.name}:[\\s\\S]*?lootTable:[\\s\\S]*?)goldDropMin:\\s*\\d+,`,
        'm'
      ),
      `$1goldDropMin: ${goldDrops.goldDropMin},`
    );

    // Update goldDropMax
    content = content.replace(
      new RegExp(
        `(${monster.name}:[\\s\\S]*?lootTable:[\\s\\S]*?)goldDropMax:\\s*\\d+,`,
        'm'
      ),
      `$1goldDropMax: ${goldDrops.goldDropMax},`
    );

    console.log(
      `${monster.name.padEnd(16)} | ${String(monster.level).padStart(5)} | ` +
      `${monster.rarity.padEnd(9)} | ${oldMin}-${oldMax} `.padEnd(11) +
      `| ${goldDrops.goldDropMin}-${goldDrops.goldDropMax}`
    );

    updatedCount++;
  });

  // Write back to file
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('-'.repeat(70));
  console.log(`\nSuccessfully updated ${updatedCount} monsters!`);
  console.log(`File updated: ${filePath}`);
}

// Run the update
updateMonsterGold();
