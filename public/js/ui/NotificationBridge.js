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
            'story': 'info',
            'loot': 'success',
            'loot_common': 'info',
            'loot_uncommon': 'success',
            'loot_rare': 'success',
            'loot_epic': 'success',
            'loot_legendary': 'success'
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
            'info': { title: 'Notice', icon: 'ℹ️', class: 'info' },
            'loot': { title: 'Loot Found!', icon: '🎒', class: 'loot' },
            'loot_common': { title: 'Item Found', icon: '📦', class: 'loot-common' },
            'loot_uncommon': { title: 'Good Find!', icon: '🎁', class: 'loot-uncommon' },
            'loot_rare': { title: 'Rare Discovery!', icon: '💎', class: 'loot-rare' },
            'loot_epic': { title: 'Epic Loot!', icon: '⭐', class: 'loot-epic' },
            'loot_legendary': { title: 'LEGENDARY!', icon: '🌟', class: 'loot-legendary' }
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

            /* Loot-specific styling */
            .notification-modal.loot .notification-modal-content {
                border-color: var(--primary-gold, #d4af37);
                box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
            }

            .notification-modal.loot .notification-header {
                border-bottom-color: var(--primary-gold, #d4af37);
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
            }

            .notification-modal.loot-common .notification-modal-content {
                border-color: #9e9e9e;
            }

            .notification-modal.loot-common .notification-header {
                border-bottom-color: #9e9e9e;
            }

            .notification-modal.loot-uncommon .notification-modal-content {
                border-color: #4caf50;
                box-shadow: 0 4px 20px rgba(76, 175, 80, 0.2);
            }

            .notification-modal.loot-uncommon .notification-header {
                border-bottom-color: #4caf50;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
            }

            .notification-modal.loot-rare .notification-modal-content {
                border-color: #2196f3;
                box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3);
                animation: loot-rare-glow 2s ease-in-out infinite alternate;
            }

            .notification-modal.loot-rare .notification-header {
                border-bottom-color: #2196f3;
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.1));
            }

            .notification-modal.loot-epic .notification-modal-content {
                border-color: #9c27b0;
                box-shadow: 0 4px 20px rgba(156, 39, 176, 0.4);
                animation: loot-epic-glow 1.5s ease-in-out infinite alternate;
            }

            .notification-modal.loot-epic .notification-header {
                border-bottom-color: #9c27b0;
                background: linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0.1));
            }

            .notification-modal.loot-legendary .notification-modal-content {
                border-color: #ff9800;
                box-shadow: 0 4px 30px rgba(255, 152, 0, 0.6);
                animation: loot-legendary-glow 1s ease-in-out infinite alternate;
            }

            .notification-modal.loot-legendary .notification-header {
                border-bottom-color: #ff9800;
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.4), rgba(255, 152, 0, 0.2));
            }

            .notification-modal.loot-legendary .notification-title {
                text-shadow: 0 0 10px rgba(255, 152, 0, 0.8);
                animation: legendary-text-glow 1s ease-in-out infinite alternate;
            }

            /* Loot notification animations */
            @keyframes loot-rare-glow {
                0% { box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3); }
                100% { box-shadow: 0 4px 25px rgba(33, 150, 243, 0.5); }
            }

            @keyframes loot-epic-glow {
                0% { box-shadow: 0 4px 20px rgba(156, 39, 176, 0.4); }
                100% { box-shadow: 0 4px 30px rgba(156, 39, 176, 0.7); }
            }

            @keyframes loot-legendary-glow {
                0% {
                    box-shadow: 0 4px 30px rgba(255, 152, 0, 0.6);
                    border-color: #ff9800;
                }
                100% {
                    box-shadow: 0 4px 40px rgba(255, 152, 0, 0.9);
                    border-color: #ffb74d;
                }
            }

            @keyframes legendary-text-glow {
                0% { text-shadow: 0 0 10px rgba(255, 152, 0, 0.8); }
                100% { text-shadow: 0 0 20px rgba(255, 152, 0, 1); }
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

    // === Loot Notification Methods ===

    /**
     * Show loot acquisition notification with rarity-specific styling
     * @param {Object} item - The loot item object
     * @param {string} source - Where the loot was found (optional)
     */
    showLootNotification(item, source = null) {
        if (!item) return;

        const rarity = item.rarity || 'common';
        const rarityType = `loot_${rarity}`;

        // Format the loot message
        const message = this.formatLootMessage(item, source);

        // Show with rarity-specific styling
        this.showNotification(message, rarityType);
    }

    /**
     * Format loot message with item details
     * @param {Object} item - The loot item
     * @param {string} source - Source of the loot
     * @returns {string} Formatted message
     */
    formatLootMessage(item, source = null) {
        let message = `Found: ${item.name || item.type || 'Unknown Item'}`;

        // Add rarity information
        if (item.rarity && item.rarity !== 'common') {
            message += ` (${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)})`;
        }

        // Add level information
        if (item.level && item.level > 1) {
            message += ` [Level ${item.level}]`;
        }

        // Add value information
        if (item.value && item.value > 0) {
            message += ` - ${item.value} gold`;
        }

        // Add source information
        if (source) {
            message += ` from ${source}`;
        }

        // Add build diversity hints if available
        if (item.buildDiversityHints && item.buildDiversityHints.length > 0) {
            message += `\n💡 ${item.buildDiversityHints[0]}`;
        }

        return message;
    }

    /**
     * Show multiple loot items notification
     * @param {Array} items - Array of loot items
     * @param {string} source - Source of the loot
     */
    showMultipleLootNotification(items, source = null) {
        if (!items || items.length === 0) return;

        if (items.length === 1) {
            this.showLootNotification(items[0], source);
            return;
        }

        // Determine the highest rarity for notification styling
        const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
        let highestRarity = 'common';

        for (const rarity of rarities) {
            if (items.some(item => item.rarity === rarity)) {
                highestRarity = rarity;
                break;
            }
        }

        // Format message for multiple items
        const message = this.formatMultipleLootMessage(items, source);

        // Show with highest rarity styling
        this.showNotification(message, `loot_${highestRarity}`);
    }

    /**
     * Format message for multiple loot items
     * @param {Array} items - Array of loot items
     * @param {string} source - Source of the loot
     * @returns {string} Formatted message
     */
    formatMultipleLootMessage(items, source = null) {
        const itemCount = items.length;
        let message = `Found ${itemCount} items`;

        if (source) {
            message += ` from ${source}`;
        }

        message += ':\n';

        // List up to 5 items, then summarize
        const displayItems = items.slice(0, 5);
        displayItems.forEach(item => {
            let itemLine = `• ${item.name || item.type || 'Unknown'}`;
            if (item.rarity && item.rarity !== 'common') {
                itemLine += ` (${item.rarity})`;
            }
            if (item.level && item.level > 1) {
                itemLine += ` [Lv${item.level}]`;
            }
            message += itemLine + '\n';
        });

        if (items.length > 5) {
            message += `... and ${items.length - 5} more items`;
        }

        return message.trim();
    }

    /**
     * Show loot summary notification after combat or exploration
     * @param {Object} lootSummary - Summary of all loot acquired
     */
    showLootSummaryNotification(lootSummary) {
        if (!lootSummary || (!lootSummary.items && !lootSummary.gold)) return;

        let message = 'Loot Summary:\n';

        // Add item summary
        if (lootSummary.items && lootSummary.items.length > 0) {
            const rarityCount = this.countItemsByRarity(lootSummary.items);
            Object.keys(rarityCount).forEach(rarity => {
                if (rarityCount[rarity] > 0) {
                    message += `• ${rarityCount[rarity]} ${rarity} item${rarityCount[rarity] > 1 ? 's' : ''}\n`;
                }
            });
        }

        // Add gold summary
        if (lootSummary.gold && lootSummary.gold > 0) {
            message += `• ${lootSummary.gold} gold\n`;
        }

        // Add experience if provided
        if (lootSummary.experience && lootSummary.experience > 0) {
            message += `• ${lootSummary.experience} experience\n`;
        }

        this.showNotification(message.trim(), 'loot');
    }

    /**
     * Count items by rarity for summary display
     * @param {Array} items - Array of loot items
     * @returns {Object} Count by rarity
     */
    countItemsByRarity(items) {
        const count = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        items.forEach(item => {
            const rarity = item.rarity || 'common';
            if (count.hasOwnProperty(rarity)) {
                count[rarity]++;
            }
        });

        return count;
    }

    /**
     * Show special loot notifications for rare finds
     * @param {Object} item - Special loot item
     * @param {string} achievement - Type of achievement
     */
    showSpecialLootNotification(item, achievement = 'rare_find') {
        let message = '';
        let type = 'loot_rare';

        switch (achievement) {
            case 'first_legendary':
                message = `🌟 FIRST LEGENDARY ITEM! 🌟\n${item.name || item.type}\n\nYou've found your first legendary item! These are extremely rare and powerful.`;
                type = 'loot_legendary';
                break;

            case 'build_synergy':
                message = `⚡ SYNERGY DISCOVERED! ⚡\n${item.name || item.type}\n\nThis item completes a build synergy! Check your equipment for bonus effects.`;
                type = 'loot_epic';
                break;

            case 'progression_gate':
                message = `🗝️ PROGRESSION ITEM! 🗝️\n${item.name || item.type}\n\nThis item may be required for accessing new areas!`;
                type = 'loot_rare';
                break;

            default:
                message = `✨ SPECIAL FIND! ✨\n${item.name || item.type}\n\nYou've discovered something special!`;
                type = 'loot_rare';
        }

        this.showNotification(message, type);
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

    // From loot operations
    showLootAcquisitionNotification(item, source = null) {
        this.bridge.showLootNotification(item, source);
    }

    showBatchLootNotification(items, source = null) {
        this.bridge.showMultipleLootNotification(items, source);
    }

    showLootSummary(lootSummary) {
        this.bridge.showLootSummaryNotification(lootSummary);
    }

    showRareLootNotification(item, achievement = 'rare_find') {
        this.bridge.showSpecialLootNotification(item, achievement);
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