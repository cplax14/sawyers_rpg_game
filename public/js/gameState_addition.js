    /**
     * Track monster defeat in current area for progression
     */
    trackMonsterDefeat(monsterSpecies, areaName = null) {
        const currentArea = areaName || this.world.currentArea;

        // Initialize area tracking if not exists
        if (!this.world.areaMonsterDefeats[currentArea]) {
            this.world.areaMonsterDefeats[currentArea] = {
                totalDefeats: 0,
                speciesDefeated: {},
                firstDefeatTime: Date.now()
            };
        }

        // Track the defeat
        this.world.areaMonsterDefeats[currentArea].totalDefeats++;
        if (!this.world.areaMonsterDefeats[currentArea].speciesDefeated[monsterSpecies]) {
            this.world.areaMonsterDefeats[currentArea].speciesDefeated[monsterSpecies] = 0;
        }
        this.world.areaMonsterDefeats[currentArea].speciesDefeated[monsterSpecies]++;

        // Check if area is "cleared" (5+ monsters defeated)
        const totalDefeats = this.world.areaMonsterDefeats[currentArea].totalDefeats;
        if (totalDefeats >= 5 && currentArea === 'forest_path') {
            if (!this.world.storyFlags.includes('forest_path_cleared')) {
                this.addStoryFlag('forest_path_cleared');
                this.addNotification('Forest Path area cleared! New areas unlocked.', 'success');
            }
        }

        console.log(`Monster defeat tracked: ${monsterSpecies} in ${currentArea} (${totalDefeats} total)`);
    }

    /**
     * Get monster defeat progress for an area
     */
    getAreaProgressInfo(areaName = null) {
        const area = areaName || this.world.currentArea;
        const progress = this.world.areaMonsterDefeats[area];

        if (!progress) {
            return { totalDefeats: 0, required: 5, percentage: 0 };
        }

        const required = 5; // Default requirement for area clearing
        const percentage = Math.min(100, Math.floor((progress.totalDefeats / required) * 100));

        return {
            totalDefeats: progress.totalDefeats,
            required: required,
            percentage: percentage,
            speciesDefeated: progress.speciesDefeated || {}
        };
    }