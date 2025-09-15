/**
 * Notification Bridge
 * Bridges between the original notification system (via GameState) and the new UIHelpers notification system
 * Extracted from original ui.js showNotification method (line 1866)
 */

class NotificationBridge {
    constructor(uiHelpers, gameState = null) {
        this.uiHelpers = uiHelpers;
        this.gameState = gameState;
        this.fallbackToConsole = true;
        
        // Notification mapping from GameState types to UIHelpers types
        this.typeMapping = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'error': 'error',
            'achievement': 'success',
            'level_up': 'success',
            'combat': 'info',
            'story': 'info'
        };
        
        console.log('✅ NotificationBridge initialized');
    }

    /**
     * Show notification using the original pattern
     * Extracted from original showNotification method in ui.js line 1866-1870
     * @param {string} message - The notification message
     * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        // Try GameState notification first (original behavior)
        if (this.gameState && typeof this.gameState.addNotification === 'function') {
            this.gameState.addNotification(message, type);
        }
        
        // Also show in UI notification system
        if (this.uiHelpers && typeof this.uiHelpers.showNotification === 'function') {
            const mappedType = this.typeMapping[type] || type;
            this.uiHelpers.showNotification(message, mappedType);
        }
        
        // Fallback to console if both systems fail
        if (this.fallbackToConsole) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Set GameState reference
     * @param {Object} gameState - GameState instance
     */
    setGameState(gameState) {
        this.gameState = gameState;
    }

    /**
     * Set UIHelpers reference
     * @param {Object} uiHelpers - UIHelpers instance
     */
    setUIHelpers(uiHelpers) {
        this.uiHelpers = uiHelpers;
    }

    /**
     * Enable/disable console fallback
     * @param {boolean} enabled - Whether to use console fallback
     */
    setConsoleFallback(enabled) {
        this.fallbackToConsole = enabled;
    }

    /**
     * Add custom type mapping
     * @param {string} gameStateType - GameState notification type
     * @param {string} uiHelperType - UIHelpers notification type
     */
    addTypeMapping(gameStateType, uiHelperType) {
        this.typeMapping[gameStateType] = uiHelperType;
    }

    /**
     * Show success notification (convenience method)
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error notification (convenience method)
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show warning notification (convenience method)
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Show info notification (convenience method)
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }
}

/**
 * Legacy Notification Methods
 * These methods replicate the various showNotification implementations found in the original ui.js
 */
class LegacyNotificationMethods {
    constructor(notificationBridge) {
        this.bridge = notificationBridge;
    }

    /**
     * Original showNotification from UIManager (lines 1866-1870)
     * Delegates to GameState.addNotification
     */
    showNotification_UIManager(message, type = 'info') {
        this.bridge.showNotification(message, type);
    }

    /**
     * Simple showNotification from monster management (lines 2937-2941)
     * Originally just logged to console with TODO comment
     */
    showNotification_MonsterManagement(message) {
        // Enhanced version of the original simple notification
        this.bridge.showNotification(message, 'info');
    }

    /**
     * Batch notification methods extracted from various parts of ui.js
     */
    
    // From save/load operations
    showSaveNotification(success, operation = 'save') {
        if (success) {
            this.bridge.showSuccess(`Game ${operation}d successfully`);
        } else {
            this.bridge.showError(`Failed to ${operation} game`);
        }
    }

    // From settings operations
    showSettingsNotification(message, success = true) {
        this.bridge.showNotification(message, success ? 'success' : 'error');
    }

    // From travel operations
    showTravelNotification(areaName, success = true) {
        if (success) {
            this.bridge.showSuccess(`Traveled to ${areaName}`);
        } else {
            this.bridge.showError(`Cannot travel to ${areaName}`);
        }
    }

    // From combat operations
    showCombatNotification(message, type = 'info') {
        this.bridge.showNotification(message, type);
    }

    // From inventory operations
    showInventoryNotification(action, itemName, success = true) {
        const message = success 
            ? `${action} ${itemName}` 
            : `Failed to ${action.toLowerCase()} ${itemName}`;
        this.bridge.showNotification(message, success ? 'success' : 'error');
    }

    // From monster operations
    showMonsterNotification(action, monsterName, success = true) {
        const message = success
            ? `${monsterName} ${action}`
            : `Failed to ${action.toLowerCase()} ${monsterName}`;
        this.bridge.showNotification(message, success ? 'success' : 'error');
    }

    // From breeding operations
    showBreedingNotification(success, reason = null) {
        if (success) {
            this.bridge.showSuccess('Breeding successful! Offspring added to storage.');
        } else {
            this.bridge.showError(reason || 'Breeding failed');
        }
    }

    // From story operations
    showStoryNotification(message) {
        this.bridge.showInfo(`Story outcome → ${message}`);
    }
}

/**
 * Notification Manager
 * Coordinates between old and new notification systems during transition period
 */
class NotificationManager {
    constructor(uiHelpers, gameState = null) {
        this.bridge = new NotificationBridge(uiHelpers, gameState);
        this.legacy = new LegacyNotificationMethods(this.bridge);
        
        // Migration mode - supports both old and new patterns
        this.migrationMode = true;
        
        console.log('✅ NotificationManager initialized');
    }

    /**
     * Primary notification method - supports original ui.js pattern
     */
    showNotification(message, type = 'info') {
        return this.bridge.showNotification(message, type);
    }

    /**
     * Get legacy methods for specific modules
     */
    getLegacyMethods() {
        return this.legacy;
    }

    /**
     * Get bridge for direct access
     */
    getBridge() {
        return this.bridge;
    }

    /**
     * Update GameState reference
     */
    setGameState(gameState) {
        this.bridge.setGameState(gameState);
    }

    /**
     * Enable/disable migration mode
     */
    setMigrationMode(enabled) {
        this.migrationMode = enabled;
    }

    /**
     * Create adapter function for modules
     * Returns a function that matches original showNotification signature
     */
    createModuleAdapter(moduleName) {
        return (message, type = 'info') => {
            // Add module context if in migration mode
            if (this.migrationMode) {
                console.log(`[${moduleName}] Notification:`, message);
            }
            
            return this.showNotification(message, type);
        };
    }

    /**
     * Batch create adapters for multiple modules
     */
    createModuleAdapters(moduleNames) {
        const adapters = {};
        moduleNames.forEach(name => {
            adapters[name] = this.createModuleAdapter(name);
        });
        return adapters;
    }

    /**
     * Cleanup
     */
    cleanup() {
        // No specific cleanup needed for notification systems
        console.log('🧹 NotificationManager cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationBridge, LegacyNotificationMethods, NotificationManager };
} else if (typeof window !== 'undefined') {
    window.NotificationBridge = NotificationBridge;
    window.LegacyNotificationMethods = LegacyNotificationMethods;
    window.NotificationManager = NotificationManager;
}