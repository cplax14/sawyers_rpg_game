/**
 * Utility Functions
 * Random number generation, calculations, and helper functions
 */

class GameUtils {
    /**
     * Initialize utility system
     */
    static init() {
        // Seed random number generator if needed
        this.randomSeed = Date.now();
        console.log('✅ GameUtils initialized');
    }
    
    // ================================================
    // RANDOM NUMBER GENERATION
    // ================================================
    
    /**
     * Generate random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Generate random float between min and max
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Generate random boolean with optional probability
     */
    static randomBool(probability = 0.5) {
        return Math.random() < probability;
    }
    
    /**
     * Pick random element from array
     */
    static randomChoice(array) {
        if (array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Pick multiple random elements from array (without replacement)
     */
    static randomSample(array, count) {
        if (count >= array.length) return [...array];
        
        const result = [];
        const indices = new Set();
        
        while (result.length < count) {
            const index = Math.floor(Math.random() * array.length);
            if (!indices.has(index)) {
                indices.add(index);
                result.push(array[index]);
            }
        }
        
        return result;
    }
    
    /**
     * Weighted random selection
     */
    static weightedChoice(items, weights) {
        if (items.length !== weights.length) {
            throw new Error('Items and weights arrays must have same length');
        }
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (totalWeight <= 0) return null;
        
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1]; // Fallback
    }
    
    /**
     * Roll dice (e.g., "3d6" = roll 3 six-sided dice)
     */
    static rollDice(notation) {
        const match = notation.match(/(\d+)d(\d+)([+\-]\d+)?/);
        if (!match) {
            throw new Error('Invalid dice notation. Use format like "3d6" or "2d10+5"');
        }
        
        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += this.randomInt(1, sides);
        }
        
        return total + modifier;
    }
    
    /**
     * Generate UUID (simplified version)
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // ================================================
    // MATHEMATICAL CALCULATIONS
    // ================================================
    
    /**
     * Clamp value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Inverse linear interpolation
     */
    static inverseLerp(start, end, value) {
        if (start === end) return 0;
        return (value - start) / (end - start);
    }
    
    /**
     * Smooth step interpolation
     */
    static smoothStep(start, end, t) {
        t = this.clamp(t, 0, 1);
        t = t * t * (3 - 2 * t);
        return this.lerp(start, end, t);
    }
    
    /**
     * Calculate distance between two points
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate angle between two points (in radians)
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * Convert degrees to radians
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Calculate percentage
     */
    static percentage(value, max) {
        if (max === 0) return 0;
        return (value / max) * 100;
    }
    
    /**
     * Round to specified decimal places
     */
    static roundTo(value, decimals) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    }
    
    // ================================================
    // GAME-SPECIFIC CALCULATIONS
    // ================================================
    
    /**
     * Calculate combat damage with variance
     */
    static calculateDamage(baseDamage, variance = 0.1) {
        const minDamage = baseDamage * (1 - variance);
        const maxDamage = baseDamage * (1 + variance);
        return Math.floor(this.randomFloat(minDamage, maxDamage));
    }
    
    /**
     * Calculate critical hit chance
     */
    static isCriticalHit(criticalChance = 0.05) {
        return Math.random() < criticalChance;
    }
    
    /**
     * Calculate experience gain with level scaling
     */
    static calculateExpGain(baseExp, playerLevel, enemyLevel) {
        const levelDifference = enemyLevel - playerLevel;
        const multiplier = Math.max(0.1, 1 + (levelDifference * 0.1));
        return Math.floor(baseExp * multiplier);
    }
    
    /**
     * Calculate monster capture rate
     */
    static calculateCaptureRate(baseCaptureRate, monsterHP, maxHP, playerBonus = 0) {
        const healthMultiplier = 1 - (monsterHP / maxHP); // Lower health = higher capture rate
        const finalRate = (baseCaptureRate + playerBonus) * (1 + healthMultiplier);
        return this.clamp(finalRate, 0, 95); // Max 95% capture rate
    }
    
    /**
     * Calculate stat growth on level up
     */
    static calculateStatGrowth(baseStat, growth, level, variance = 0.2) {
        const expectedStat = baseStat + (growth * (level - 1));
        const varianceAmount = expectedStat * variance;
        return Math.floor(this.randomFloat(
            expectedStat - varianceAmount,
            expectedStat + varianceAmount
        ));
    }
    
    /**
     * Calculate breeding success rate
     */
    static calculateBreedingSuccess(species1Rarity, species2Rarity, playerLevel) {
        const rarityValues = { common: 1, uncommon: 2, rare: 3, legendary: 4 };
        const avgRarity = (rarityValues[species1Rarity] + rarityValues[species2Rarity]) / 2;
        const levelBonus = Math.min(playerLevel * 0.02, 0.3); // Max 30% bonus
        const baseRate = Math.max(0.1, 0.8 - (avgRarity * 0.15));
        
        return this.clamp(baseRate + levelBonus, 0.1, 0.9);
    }
    
    /**
     * Calculate evolution requirements met
     */
    static checkEvolutionRequirements(monster, requirements) {
        if (!requirements) return false;
        
        // Check level requirement
        if (requirements.level && monster.level < requirements.level) {
            return false;
        }
        
        // Check item requirements (would need to check player inventory)
        if (requirements.items && requirements.items.length > 0) {
            // This would need inventory check - placeholder
            return false;
        }
        
        return true;
    }
    
    // ================================================
    // ARRAY AND OBJECT UTILITIES
    // ================================================
    
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    static shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    /**
     * Merge objects deeply
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Group array by key
     */
    static groupBy(array, keyFn) {
        return array.reduce((groups, item) => {
            const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }
    
    // ================================================
    // STRING AND FORMATTING UTILITIES
    // ================================================
    
    /**
     * Capitalize first letter of string
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Format number with commas
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Format time duration (seconds to HH:MM:SS)
     */
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Pluralize word based on count
     */
    static pluralize(word, count, suffix = 's') {
        return count === 1 ? word : word + suffix;
    }
    
    /**
     * Generate random name (for monsters, etc.)
     */
    static generateRandomName(type = 'monster') {
        const prefixes = {
            monster: ['Shadow', 'Fire', 'Ice', 'Storm', 'Earth', 'Wind', 'Dark', 'Light'],
            character: ['Alex', 'Morgan', 'Jordan', 'Casey', 'Riley', 'Quinn', 'Sage', 'River']
        };
        
        const suffixes = {
            monster: ['claw', 'fang', 'wing', 'tail', 'eye', 'horn', 'scale', 'spike'],
            character: ['son', 'daughter', 'born', 'walker', 'rider', 'keeper', 'guard', 'heart']
        };
        
        const prefix = this.randomChoice(prefixes[type] || prefixes.monster);
        const suffix = this.randomChoice(suffixes[type] || suffixes.monster);
        
        return prefix + suffix;
    }
    
    // ================================================
    // COLOR AND VISUAL UTILITIES
    // ================================================
    
    /**
     * Convert HSV to RGB
     */
    static hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }
    
    /**
     * Generate random color
     */
    static randomColor(saturation = 1, value = 1) {
        const hue = this.randomFloat(0, 360);
        const [r, g, b] = this.hsvToRgb(hue, saturation, value);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Interpolate between colors (hex format)
     */
    static interpolateColor(color1, color2, t) {
        // Simple RGB interpolation - could be enhanced
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const r = Math.round(this.lerp(c1.r, c2.r, t));
        const g = Math.round(this.lerp(c1.g, c2.g, t));
        const b = Math.round(this.lerp(c1.b, c2.b, t));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Convert hex color to RGB object
     */
    static hexToRgb(hex) {
        const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        return match ? {
            r: parseInt(match[1], 16),
            g: parseInt(match[2], 16),
            b: parseInt(match[3], 16)
        } : null;
    }
    
    // ================================================
    // PERFORMANCE AND DEBUGGING UTILITIES
    // ================================================
    
    /**
     * Throttle function execution
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Debounce function execution
     */
    static debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    /**
     * Simple performance timing
     */
    static time(label) {
        console.time(label);
    }
    
    static timeEnd(label) {
        console.timeEnd(label);
    }
    
    /**
     * Log with timestamp
     */
    static log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            success: '✅'
        }[type] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

// Initialize on load
GameUtils.init();

// Make available globally
window.GameUtils = GameUtils;