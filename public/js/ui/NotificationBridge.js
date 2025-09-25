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
        // Suppress Battle Rewards notifications (handled by victory modal)
        if (message.includes('Battle Rewards')) {
            console.log('Suppressing Battle Rewards notification (handled by victory modal)');
            return;
        }

        // Check if we're in active combat to determine notification behavior
        const isInCombat = this.isInActiveCombat();

        // Combat-related messages that should show as toasts during combat
        const isCombatMessage = message.includes('casts') || message.includes('takes') ||
                               message.includes('damage') || message.includes('healing') ||
                               message.includes('Attack deals') || message.includes('hits for') ||
                               type === 'combat' || type === 'info';

        // If it's a combat message and we're in combat, show as toast for immediate feedback
        if (isCombatMessage && isInCombat) {
            // Allow these to show as normal toasts during combat
        } else {
            // For important notifications outside combat, show as modal instead of small toast
            const importantTypes = ['success', 'warning', 'error', 'level_up', 'achievement'];
            const isImportantEquipment = message.includes('Equipped') || message.includes('Unequipped');
            const isImportantLoot = message.includes('Level Up');

            if (importantTypes.includes(type) || isImportantEquipment || isImportantLoot) {
                this.showNotificationModal(message, type);
                return;
            }
        }

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
     * Show important notifications as modal dialogs
     * @param {string} message - The notification message
     * @param {string} type - Notification type
     */
    showNotificationModal(message, type = 'info') {
        // Create modal if it doesn't exist
        let modal = document.getElementById('notification-modal');
        if (!modal) {
            modal = this.createNotificationModal();
        }

        // Set content and styling based on type
        const titleEl = modal.querySelector('.notification-title');
        const messageEl = modal.querySelector('.notification-message');
        const iconEl = modal.querySelector('.notification-icon');

        const config = this.getNotificationConfig(type);
        if (titleEl) titleEl.textContent = config.title;
        if (messageEl) messageEl.textContent = message;
        if (iconEl) iconEl.textContent = config.icon;

        // Apply type-specific styling
        modal.className = `notification-modal ${config.class}`;

        // Show modal
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        // Focus the modal for accessibility
        modal.focus();
    }

    /**
     * Create the notification modal DOM structure
     */
    createNotificationModal() {
        const modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.className = 'notification-modal hidden';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="notification-modal-backdrop"></div>
            <div class="notification-modal-content">
                <div class="notification-header">
                    <span class="notification-icon">ℹ️</span>
                    <h3 class="notification-title">Notification</h3>
                </div>
                <div class="notification-body">
                    <p class="notification-message">Message content</p>
                </div>
                <div class="notification-footer">
                    <button class="btn primary notification-ok-btn">OK</button>
                </div>
            </div>
        `;

        // Add event listeners
        const okBtn = modal.querySelector('.notification-ok-btn');
        const backdrop = modal.querySelector('.notification-modal-backdrop');

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        };

        if (okBtn) okBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        // Close on Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Add CSS styles
        this.addNotificationModalStyles();

        // Add to document
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Get configuration for different notification types
     */
    getNotificationConfig(type) {
        const configs = {
            'success': { title: 'Success!', icon: '✅', class: 'success' },
            'error': { title: 'Error', icon: '❌', class: 'error' },
            'warning': { title: 'Warning', icon: '⚠️', class: 'warning' },
            'level_up': { title: 'Level Up!', icon: '🎉', class: 'success' },
            'achievement': { title: 'Achievement!', icon: '🏆', class: 'success' },
            'info': { title: 'Notice', icon: 'ℹ️', class: 'info' }
        };
        return configs[type] || configs['info'];
    }

    /**
     * Add CSS styles for notification modal
     */
    addNotificationModalStyles() {
        if (document.getElementById('notification-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-modal-styles';
        styles.textContent = `
            .notification-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-modal.hidden {
                display: none !important;
            }

            .notification-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
            }

            .notification-modal-content {
                position: relative;
                background: var(--background-primary, #2c1810);
                border: 2px solid var(--primary-gold, #d4af37);
                border-radius: 8px;
                padding: 0;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                font-family: var(--font-primary, 'Georgia', serif);
            }

            .notification-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                border-bottom: 1px solid var(--primary-gold, #d4af37);
                background: linear-gradient(135deg, var(--background-secondary, #3d2415), var(--background-primary, #2c1810));
            }

            .notification-icon {
                font-size: 24px;
                line-height: 1;
            }

            .notification-title {
                margin: 0;
                color: var(--text-primary, #f4e4bc);
                font-size: 18px;
                font-weight: bold;
            }

            .notification-body {
                padding: 20px;
            }

            .notification-message {
                margin: 0;
                color: var(--text-primary, #f4e4bc);
                font-size: 16px;
                line-height: 1.4;
            }

            .notification-footer {
                padding: 16px 20px;
                border-top: 1px solid var(--primary-gold, #d4af37);
                display: flex;
                justify-content: center;
            }

            .notification-ok-btn {
                padding: 8px 24px;
                background: var(--primary-gold, #d4af37);
                color: var(--background-primary, #2c1810);
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s;
            }

            .notification-ok-btn:hover {
                background: var(--secondary-gold, #b8941f);
            }

            .notification-modal.success .notification-modal-content {
                border-color: #4caf50;
            }

            .notification-modal.success .notification-header {
                border-bottom-color: #4caf50;
            }

            .notification-modal.error .notification-modal-content {
                border-color: #f44336;
            }

            .notification-modal.error .notification-header {
                border-bottom-color: #f44336;
            }

            .notification-modal.warning .notification-modal-content {
                border-color: #ff9800;
            }

            .notification-modal.warning .notification-header {
                border-bottom-color: #ff9800;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Check if we're currently in active combat
     * @returns {boolean} True if combat is active
     */
    isInActiveCombat() {
        // Check multiple ways combat might be active
        if (this.gameState?.combat?.active) return true;
        if (window.GameState?.combat?.active) return true;

        // Check if combat UI is currently visible
        const combatElement = document.getElementById('combat');
        if (combatElement && !combatElement.classList.contains('hidden')) return true;

        // Check current scene
        const currentScene = window.ui?.sceneManager?.currentScene?.name;
        if (currentScene === 'combat') return true;

        return false;
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