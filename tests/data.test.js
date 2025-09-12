/**
 * Unit Tests for Game Data Modules
 * Tests the character, monster, area, and story data systems
 */

describe('Character Data Tests', () => {
    beforeAll(() => {
        // Ensure CharacterData is loaded
        if (typeof CharacterData === 'undefined') {
            console.warn('CharacterData not loaded - skipping tests');
        }
    });
    
    it('should have all 6 character classes', () => {
        if (typeof CharacterData === 'undefined') return;
        
        const classes = CharacterData.getClassNames();
        assertArrayLength(classes, 6, 'Should have exactly 6 character classes');
        
        const expectedClasses = ['knight', 'wizard', 'rogue', 'paladin', 'ranger', 'warrior'];
        for (const className of expectedClasses) {
            assertArrayContains(classes, className, `Should contain ${className} class`);
        }
    });
    
    it('should provide complete class data', () => {
        if (typeof CharacterData === 'undefined') return;
        
        const knightData = CharacterData.getClass('knight');
        assertTruthy(knightData, 'Knight class data should exist');
        
        assertObjectHasProperty(knightData, 'name', 'Class should have name');
        assertObjectHasProperty(knightData, 'description', 'Class should have description');
        assertObjectHasProperty(knightData, 'baseStats', 'Class should have base stats');
        assertObjectHasProperty(knightData, 'statGrowth', 'Class should have stat growth');
        assertObjectHasProperty(knightData, 'weaponTypes', 'Class should have weapon types');
        assertObjectHasProperty(knightData, 'startingSpells', 'Class should have starting spells');
        assertObjectHasProperty(knightData, 'learnableSpells', 'Class should have learnable spells');
        assertObjectHasProperty(knightData, 'monsterAffinities', 'Class should have monster affinities');
        assertObjectHasProperty(knightData, 'classBonus', 'Class should have class bonus');
    });
    
    it('should calculate stats at different levels', () => {
        if (typeof CharacterData === 'undefined') return;
        
        const level1Stats = CharacterData.getStatsAtLevel('knight', 1);
        const level10Stats = CharacterData.getStatsAtLevel('knight', 10);
        
        assertTruthy(level1Stats, 'Should calculate level 1 stats');
        assertTruthy(level10Stats, 'Should calculate level 10 stats');
        
        // Level 10 should have higher stats than level 1
        assertTruthy(level10Stats.hp > level1Stats.hp, 'HP should increase with level');
        assertTruthy(level10Stats.attack > level1Stats.attack, 'Attack should increase with level');
    });
    
    it('should return spells available at level', () => {
        if (typeof CharacterData === 'undefined') return;
        
        const level1Spells = CharacterData.getSpellsAtLevel('wizard', 1);
        const level10Spells = CharacterData.getSpellsAtLevel('wizard', 10);
        
        assertTruthy(Array.isArray(level1Spells), 'Should return array of spells');
        assertTruthy(Array.isArray(level10Spells), 'Should return array of spells');
        assertTruthy(level10Spells.length >= level1Spells.length, 'Higher level should have more spells');
    });
});

describe('Monster Data Tests', () => {
    beforeAll(() => {
        if (typeof MonsterData === 'undefined') {
            console.warn('MonsterData not loaded - skipping tests');
        }
    });
    
    it('should have monster species data', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const slime = MonsterData.getSpecies('slime');
        assertTruthy(slime, 'Should have slime species data');
        
        assertObjectHasProperty(slime, 'name', 'Monster should have name');
        assertObjectHasProperty(slime, 'type', 'Monster should have type array');
        assertObjectHasProperty(slime, 'rarity', 'Monster should have rarity');
        assertObjectHasProperty(slime, 'baseStats', 'Monster should have base stats');
        assertObjectHasProperty(slime, 'abilities', 'Monster should have abilities');
        assertObjectHasProperty(slime, 'captureRate', 'Monster should have capture rate');
    });
    
    it('should filter monsters by rarity', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const commonMonsters = MonsterData.getSpeciesByRarity('common');
        const rareMonsters = MonsterData.getSpeciesByRarity('rare');
        
        assertTruthy(Array.isArray(commonMonsters), 'Should return array of common monsters');
        assertTruthy(Array.isArray(rareMonsters), 'Should return array of rare monsters');
        assertTruthy(commonMonsters.length > 0, 'Should have at least one common monster');
    });
    
    it('should filter monsters by type', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const fireMonsters = MonsterData.getSpeciesByType('fire');
        const beastMonsters = MonsterData.getSpeciesByType('beast');
        
        assertTruthy(Array.isArray(fireMonsters), 'Should return array of fire monsters');
        assertTruthy(Array.isArray(beastMonsters), 'Should return array of beast monsters');
    });
    
    it('should calculate monster stats at level', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const level1Stats = MonsterData.getStatsAtLevel('slime', 1);
        const level10Stats = MonsterData.getStatsAtLevel('slime', 10);
        
        assertTruthy(level1Stats, 'Should calculate level 1 stats');
        assertTruthy(level10Stats, 'Should calculate level 10 stats');
        assertTruthy(level10Stats.hp > level1Stats.hp, 'HP should increase with level');
    });
    
    it('should handle breeding compatibility', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const canBreed = MonsterData.canBreed('slime', 'goblin');
        assertTruthy(typeof canBreed === 'boolean', 'Should return boolean for breeding compatibility');
        
        const outcomes = MonsterData.getBreedingOutcomes('slime', 'goblin');
        assertTruthy(Array.isArray(outcomes), 'Should return array of breeding outcomes');
    });
    
    it('should generate encounters', () => {
        if (typeof MonsterData === 'undefined') return;
        
        const encounter = MonsterData.generateEncounter('forest', 5);
        // Encounter might be null if no monsters available, so we just test it doesn't throw
        assertDoesNotThrow(() => {
            MonsterData.generateEncounter('forest', 5);
        }, 'Should generate encounter without throwing');
    });
});

describe('Area Data Tests', () => {
    beforeAll(() => {
        if (typeof AreaData === 'undefined') {
            console.warn('AreaData not loaded - skipping tests');
        }
    });
    
    it('should have starting village area', () => {
        if (typeof AreaData === 'undefined') return;
        
        const village = AreaData.getArea('starting_village');
        assertTruthy(village, 'Should have starting village area');
        assertTruthy(village.unlocked, 'Starting village should be unlocked');
        assertEqual(village.encounterRate, 0, 'Village should have no encounters');
    });
    
    it('should provide area connections', () => {
        if (typeof AreaData === 'undefined') return;
        
        const connections = AreaData.getConnectedAreas('starting_village');
        assertTruthy(Array.isArray(connections), 'Should return array of connections');
        assertArrayContains(connections, 'forest_path', 'Village should connect to forest path');
    });
    
    it('should check area unlock requirements', () => {
        if (typeof AreaData === 'undefined') return;
        
        const isUnlocked = AreaData.isAreaUnlocked('starting_village', [], 1, []);
        assertTruthy(isUnlocked, 'Starting village should always be unlocked');
        
        const forestUnlocked = AreaData.isAreaUnlocked('deep_forest', ['tutorial_complete'], 1, []);
        assertFalsy(forestUnlocked, 'Deep forest should require higher level');
    });
    
    it('should get area services', () => {
        if (typeof AreaData === 'undefined') return;
        
        const services = AreaData.getAreaServices('starting_village');
        assertTruthy(Array.isArray(services), 'Should return array of services');
        assertArrayContains(services, 'shop', 'Village should have shop service');
    });
    
    it('should get area monsters', () => {
        if (typeof AreaData === 'undefined') return;
        
        const monsters = AreaData.getAreaMonsters('forest_path');
        assertTruthy(Array.isArray(monsters), 'Should return array of monsters');
    });
    
    it('should handle boss areas', () => {
        if (typeof AreaData === 'undefined') return;
        
        const boss = AreaData.getAreaBoss('wolf_den');
        if (boss) {
            assertObjectHasProperty(boss, 'name', 'Boss should have name');
            assertObjectHasProperty(boss, 'species', 'Boss should have species');
            assertObjectHasProperty(boss, 'level', 'Boss should have level');
            assertObjectHasProperty(boss, 'reward', 'Boss should have reward');
        }
    });
});

describe('Story Data Tests', () => {
    beforeAll(() => {
        if (typeof StoryData === 'undefined') {
            console.warn('StoryData not loaded - skipping tests');
        }
    });
    
    it('should have story events', () => {
        if (typeof StoryData === 'undefined') return;
        
        const gameStart = StoryData.getEvent('game_start');
        assertTruthy(gameStart, 'Should have game start event');
        
        assertObjectHasProperty(gameStart, 'name', 'Event should have name');
        assertObjectHasProperty(gameStart, 'description', 'Event should have description');
        assertObjectHasProperty(gameStart, 'type', 'Event should have type');
        assertObjectHasProperty(gameStart, 'dialogue', 'Event should have dialogue');
        assertObjectHasProperty(gameStart, 'outcomes', 'Event should have outcomes');
    });
    
    it('should have multiple endings', () => {
        if (typeof StoryData === 'undefined') return;
        
        const guardianEnding = StoryData.getEnding('guardian_ending');
        assertTruthy(guardianEnding, 'Should have guardian ending');
        
        assertObjectHasProperty(guardianEnding, 'name', 'Ending should have name');
        assertObjectHasProperty(guardianEnding, 'description', 'Ending should have description');
        assertObjectHasProperty(guardianEnding, 'dialogue', 'Ending should have dialogue');
        assertObjectHasProperty(guardianEnding, 'requirements', 'Ending should have requirements');
        assertObjectHasProperty(guardianEnding, 'unlocks', 'Ending should have unlocks');
    });
    
    it('should check story requirements', () => {
        if (typeof StoryData === 'undefined') return;
        
        const hasRequirements = StoryData.checkRequirements(
            ['peaceful_approach', 'nature_affinity'], 
            ['peaceful_approach', 'nature_affinity', 'beast_speaker']
        );
        assertTruthy(hasRequirements, 'Should meet requirements when all flags present');
        
        const missingRequirements = StoryData.checkRequirements(
            ['missing_flag'], 
            ['peaceful_approach']
        );
        assertFalsy(missingRequirements, 'Should not meet requirements when flags missing');
    });
    
    it('should get available endings', () => {
        if (typeof StoryData === 'undefined') return;
        
        const endings = StoryData.getAvailableEndings(['peaceful_approach', 'nature_affinity', 'beast_speaker']);
        assertTruthy(Array.isArray(endings), 'Should return array of available endings');
    });
    
    it('should process story choices', () => {
        if (typeof StoryData === 'undefined') return;
        
        const outcome = StoryData.processChoice('first_monster_encounter', 'attempt_capture');
        if (outcome) {
            assertObjectHasProperty(outcome, 'storyFlags', 'Outcome should have story flags');
            assertObjectHasProperty(outcome, 'unlockAreas', 'Outcome should have unlock areas');
            assertObjectHasProperty(outcome, 'items', 'Outcome should have items');
        }
    });
    
    it('should calculate story branching', () => {
        if (typeof StoryData === 'undefined') return;
        
        const branch = StoryData.calculateStoryBranch(['dragon_challenge', 'warrior_path']);
        assertTruthy(typeof branch === 'string', 'Should return string for story branch');
        assertTruthy(branch.endsWith('_path'), 'Branch should end with _path');
    });
});

// Global test setup
if (typeof window !== 'undefined') {
    console.log('🧪 Data tests loaded. Run with runTests()');
}