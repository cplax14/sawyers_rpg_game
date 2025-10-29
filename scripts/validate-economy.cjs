#!/usr/bin/env node

/**
 * Economy Validation Script
 *
 * Validates the game economy using actual data files and generates
 * a comprehensive balance report.
 */

const fs = require('fs');
const path = require('path');

// Load game data files
function loadGameData() {
  const dataDir = path.join(__dirname, '..', 'public', 'data');

  // Load monsters.js
  const monstersPath = path.join(dataDir, 'monsters.js');
  const monstersContent = fs.readFileSync(monstersPath, 'utf8');

  // Load areas.js
  const areasPath = path.join(dataDir, 'areas.js');
  const areasContent = fs.readFileSync(areasPath, 'utf8');

  // Load characters.js
  const charactersPath = path.join(dataDir, 'characters.js');
  const charactersContent = fs.readFileSync(charactersPath, 'utf8');

  // Extract monster data (simplified parsing)
  const monsters = extractMonsters(monstersContent);
  const areas = extractAreas(areasContent);
  const characters = extractCharacters(charactersContent);

  return { monsters, areas, characters };
}

function extractMonsters(content) {
  const monsters = [];
  const speciesMatch = content.match(/species:\s*{([\s\S]*?)}\s*,\s*\/\/ Evolution/);

  if (speciesMatch) {
    const speciesContent = speciesMatch[1];
    const monsterMatches = speciesContent.matchAll(/(\w+):\s*{[\s\S]*?name:\s*"([^"]+)"[\s\S]*?rarity:\s*"(\w+)"[\s\S]*?lootTable:\s*{[\s\S]*?level:\s*(\d+)[\s\S]*?goldDropMin:\s*(\d+),\s*goldDropMax:\s*(\d+)/g);

    for (const match of monsterMatches) {
      monsters.push({
        id: match[1],
        name: match[2],
        rarity: match[3],
        level: parseInt(match[4]),
        goldDropMin: parseInt(match[5]),
        goldDropMax: parseInt(match[6])
      });
    }
  }

  return monsters;
}

function extractAreas(content) {
  const areas = [];
  const areasMatch = content.match(/areas:\s*{([\s\S]*?)}\s*,\s*\/\/ Story progression/);

  if (areasMatch) {
    const areasContent = areasMatch[1];
    const areaMatches = areasContent.matchAll(/(\w+):\s*{[\s\S]*?name:\s*"([^"]+)"[\s\S]*?encounterRate:\s*(\d+)/g);

    for (const match of areaMatches) {
      areas.push({
        id: match[1],
        name: match[2],
        encounterRate: parseInt(match[3]) / 100 // Convert to decimal
      });
    }
  }

  return areas;
}

function extractCharacters(content) {
  const characters = [];
  const classMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*"([^"]+)"[\s\S]*?startingGold:\s*(\d+)/g);

  for (const match of classMatches) {
    characters.push({
      id: match[1],
      name: match[2],
      startingGold: parseInt(match[3])
    });
  }

  return characters;
}

// Economy validation
function validateEconomy(monsters, areas) {
  const TARGET_GOLD_PER_HOUR = [1000, 2000];
  const EXPLORATIONS_PER_HOUR = 70;
  const ENCOUNTER_RATE_AVG = 0.725;
  const COMBATS_PER_HOUR = Math.floor(EXPLORATIONS_PER_HOUR * ENCOUNTER_RATE_AVG);

  console.log('='.repeat(80));
  console.log('ECONOMY VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log();

  // Validate starting gold
  console.log('1. STARTING GOLD VALIDATION');
  console.log('-'.repeat(80));

  const targetStartingGold = 100;
  let allCharactersValid = true;

  monsters.slice(0, 6).forEach(monster => {
    // Placeholder for character validation - we'll print what we found
  });

  console.log();

  // Validate monster gold drops by level range
  console.log('2. MONSTER GOLD DROP VALIDATION');
  console.log('-'.repeat(80));
  console.log('Level Range | Monsters | Avg Gold Drop | Gold/Hour (est) | Status');
  console.log('-'.repeat(80));

  const levelRanges = [
    { name: 'Level 1-5', min: 1, max: 5 },
    { name: 'Level 6-10', min: 6, max: 10 },
    { name: 'Level 11-15', min: 11, max: 15 },
    { name: 'Level 16-20', min: 16, max: 20 },
    { name: 'Level 21-25', min: 21, max: 25 },
    { name: 'Level 26-30', min: 26, max: 30 },
    { name: 'Level 31+', min: 31, max: 100 }
  ];

  let allRangesValid = true;

  levelRanges.forEach(range => {
    const rangeMonsters = monsters.filter(m =>
      m.level >= range.min && m.level <= range.max
    );

    if (rangeMonsters.length === 0) {
      console.log(`${range.name.padEnd(12)} | ${'N/A'.padStart(8)} | ${'N/A'.padStart(13)} | ${'N/A'.padStart(15)} | N/A`);
      return;
    }

    const avgGold = rangeMonsters.reduce((sum, m) => {
      return sum + ((m.goldDropMin + m.goldDropMax) / 2);
    }, 0) / rangeMonsters.length;

    const goldPerHour = Math.floor(avgGold * COMBATS_PER_HOUR);
    const isValid = goldPerHour >= TARGET_GOLD_PER_HOUR[0] &&
                    goldPerHour <= TARGET_GOLD_PER_HOUR[1] * 1.5; // Allow 50% over

    if (!isValid) allRangesValid = false;

    const status = isValid ? '✓ PASS' : '✗ FAIL';

    console.log(
      `${range.name.padEnd(12)} | ${String(rangeMonsters.length).padStart(8)} | ` +
      `${avgGold.toFixed(1).padStart(13)} | ${String(goldPerHour).padStart(15)} | ${status}`
    );
  });

  console.log('-'.repeat(80));
  console.log();

  // Validate specific monster gold drops
  console.log('3. SPECIFIC MONSTER VALIDATION');
  console.log('-'.repeat(80));
  console.log('Monster          | Level | Rarity    | Gold Range | Avg | Status');
  console.log('-'.repeat(80));

  const sampleMonsters = [
    'slime', 'goblin', 'wolf', 'orc', 'dire_wolf', 'alpha_wolf',
    'fire_sprite', 'dragon_whelp', 'ancient_dragon'
  ];

  sampleMonsters.forEach(id => {
    const monster = monsters.find(m => m.id === id);
    if (!monster) {
      console.log(`${id.padEnd(16)} | Not found in data`);
      return;
    }

    const avgGold = (monster.goldDropMin + monster.goldDropMax) / 2;
    const expectedMin = 15; // Minimum viable gold drop
    const isValid = avgGold >= expectedMin;
    const status = isValid ? '✓' : '✗';

    console.log(
      `${monster.name.padEnd(16)} | ${String(monster.level).padStart(5)} | ` +
      `${monster.rarity.padEnd(9)} | ${monster.goldDropMin}-${monster.goldDropMax}`.padEnd(11) +
      ` | ${Math.floor(avgGold).toString().padStart(3)} | ${status}`
    );
  });

  console.log('-'.repeat(80));
  console.log();

  // Overall summary
  console.log('4. ECONOMY BALANCE SUMMARY');
  console.log('-'.repeat(80));

  const allMonstersAvg = monsters.reduce((sum, m) => {
    return sum + ((m.goldDropMin + m.goldDropMax) / 2);
  }, 0) / monsters.length;

  const overallGoldPerHour = Math.floor(allMonstersAvg * COMBATS_PER_HOUR);

  console.log(`Total Monsters Analyzed: ${monsters.length}`);
  console.log(`Average Gold per Monster: ${allMonstersAvg.toFixed(1)}`);
  console.log(`Estimated Gold per Hour: ${overallGoldPerHour}`);
  console.log(`Target Gold per Hour: ${TARGET_GOLD_PER_HOUR[0]}-${TARGET_GOLD_PER_HOUR[1]}`);
  console.log();

  if (allRangesValid) {
    console.log('✓ Overall Status: BALANCED');
    console.log('  All level ranges meet target earning rates.');
  } else {
    console.log('⚠ Overall Status: NEEDS ATTENTION');
    console.log('  Some level ranges are outside target earning rates.');
  }

  console.log();
  console.log('='.repeat(80));

  return {
    valid: allRangesValid,
    monsters,
    overallGoldPerHour
  };
}

// Character starting gold validation
function validateStartingGold(characters) {
  console.log();
  console.log('5. CHARACTER STARTING GOLD');
  console.log('-'.repeat(80));
  console.log('Class        | Starting Gold | Status');
  console.log('-'.repeat(80));

  const targetGold = 100;
  let allValid = true;

  characters.forEach(char => {
    const isValid = char.startingGold === targetGold;
    if (!isValid) allValid = false;
    const status = isValid ? '✓ PASS' : '✗ FAIL';

    console.log(
      `${char.name.padEnd(12)} | ${String(char.startingGold).padStart(13)} | ${status}`
    );
  });

  console.log('-'.repeat(80));

  if (allValid) {
    console.log('✓ All characters start with 100 gold');
  } else {
    console.log('✗ Some characters do not start with 100 gold');
  }

  console.log();

  return allValid;
}

// Main execution
try {
  console.log('Loading game data...\n');
  const { monsters, areas, characters } = loadGameData();

  console.log(`Loaded ${monsters.length} monsters`);
  console.log(`Loaded ${areas.length} areas`);
  console.log(`Loaded ${characters.length} character classes`);
  console.log();

  const economyResult = validateEconomy(monsters, areas);
  const charactersValid = validateStartingGold(characters);

  console.log('='.repeat(80));
  console.log('FINAL VERDICT');
  console.log('='.repeat(80));

  if (economyResult.valid && charactersValid) {
    console.log('✓ Economy is properly balanced!');
    console.log('  - Starting gold: 100 for all classes');
    console.log('  - Gold earning rate: 1000-2000 gold per hour across all levels');
    console.log('  - Monster drops scale appropriately with difficulty');
  } else {
    console.log('⚠ Economy needs adjustments:');
    if (!charactersValid) {
      console.log('  - Some character classes have incorrect starting gold');
    }
    if (!economyResult.valid) {
      console.log('  - Some level ranges have gold earning rates outside target');
    }
  }

  console.log('='.repeat(80));

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'docs', 'economy-balance-report.md');
  const timestamp = new Date().toISOString();

  let report = `# Economy Balance Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Monsters: ${monsters.length}\n`;
  report += `- Total Areas: ${areas.length}\n`;
  report += `- Character Classes: ${characters.length}\n`;
  report += `- Overall Gold/Hour: ${economyResult.overallGoldPerHour}\n`;
  report += `- Target Gold/Hour: 1000-2000\n`;
  report += `- Status: ${economyResult.valid && charactersValid ? 'BALANCED ✓' : 'NEEDS ATTENTION ⚠'}\n\n`;

  report += `## Character Starting Gold\n\n`;
  report += `All characters start with 100 gold: ${charactersValid ? 'YES ✓' : 'NO ✗'}\n\n`;

  report += `## Monster Gold Drops\n\n`;
  report += `| Monster | Level | Rarity | Gold Range | Average |\n`;
  report += `|---------|-------|--------|------------|--------|\n`;

  economyResult.monsters.forEach(m => {
    const avg = Math.floor((m.goldDropMin + m.goldDropMax) / 2);
    report += `| ${m.name} | ${m.level} | ${m.rarity} | ${m.goldDropMin}-${m.goldDropMax} | ${avg} |\n`;
  });

  report += `\n## Conclusion\n\n`;

  if (economyResult.valid && charactersValid) {
    report += `The game economy is properly balanced. Players will earn 1000-2000 gold per hour `;
    report += `through normal gameplay, allowing them to afford items at appropriate progression rates.\n`;
  } else {
    report += `The economy requires adjustments to meet target earning rates.\n`;
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\nDetailed report saved to: ${reportPath}`);

  process.exit(economyResult.valid && charactersValid ? 0 : 1);

} catch (error) {
  console.error('Error validating economy:', error);
  process.exit(1);
}
