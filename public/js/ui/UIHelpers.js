/**
 * UI Helpers
 * Shared utilities for UI modules - notifications, DOM helpers, and common functions
 */
class UIHelpers {
    constructor() {
        // Initialize notification system
        this.notifications = {
            container: null,
            queue: [],
            maxVisible: 5,
            defaultDuration: 3000
        };
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
        
        // Initialize helpers
        this.init();
    }

    /**
     * Initialize UI helpers
     */
    init() {
        this.createNotificationContainer();
        console.log('✅ UIHelpers initialized');
    }

    // ===================================
    // NOTIFICATION SYSTEM
    // ===================================

    /**
     * Create notification container in DOM
     */
    createNotificationContainer() {
        // Check if container already exists
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        this.notifications.container = container;
    }

    /**
     * Show a notification message
     * @param {string} message - The notification message
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     */
    showNotification(message, type = 'info', duration = null) {
        if (!message) return;

        // Use default duration if not specified
        const notificationDuration = duration !== null ? duration : this.notifications.defaultDuration;

        // Create notification element
        const notification = this.createNotificationElement(message, type, notificationDuration);
        
        // Add to queue and container
        this.notifications.queue.push(notification);
        this.notifications.container.appendChild(notification.element);

        // Trigger entrance animation
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 10);

        // Auto-remove if duration is set
        if (notificationDuration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, notificationDuration);
        }

        // Limit visible notifications
        this.limitVisibleNotifications();

        return notification;
    }

    /**
     * Create notification DOM element
     */
    createNotificationElement(message, type, duration) {
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        
        // Notification styling
        element.style.cssText = `
            background: var(--notification-${type}-bg, #333);
            color: var(--notification-${type}-color, white);
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 4px solid var(--notification-${type}-border, #007bff);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
            pointer-events: auto;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
        `;

        // Set type-specific colors
        this.applyNotificationTypeStyles(element, type);

        // Create notification content
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        // Add icon based on type
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        icon.textContent = this.getNotificationIcon(type);
        icon.style.cssText = 'font-size: 16px; flex-shrink: 0;';

        // Add message
        const messageEl = document.createElement('span');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        messageEl.style.cssText = 'flex: 1;';

        // Add close button for persistent notifications
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            margin-left: 8px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';

        // Assemble notification
        content.appendChild(icon);
        content.appendChild(messageEl);
        if (duration === 0) {
            content.appendChild(closeBtn);
        }
        element.appendChild(content);

        // Create notification object
        const notification = {
            id: Date.now() + Math.random(),
            element,
            type,
            message,
            duration,
            timestamp: Date.now()
        };

        // Close button functionality
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Show class for animation
        element.classList.add('notification-enter');

        return notification;
    }

    /**
     * Apply type-specific styles to notification
     */
    applyNotificationTypeStyles(element, type) {
        const styles = {
            info: {
                background: '#2196F3',
                border: '#1976D2'
            },
            success: {
                background: '#4CAF50',
                border: '#388E3C'
            },
            warning: {
                background: '#FF9800',
                border: '#F57C00'
            },
            error: {
                background: '#F44336',
                border: '#D32F2F'
            }
        };

        const typeStyle = styles[type] || styles.info;
        element.style.background = typeStyle.background;
        element.style.borderLeftColor = typeStyle.border;
    }

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    /**
     * Hide a notification
     */
    hideNotification(notification) {
        if (!notification || !notification.element) return;

        // Remove from queue immediately to prevent infinite loops
        const index = this.notifications.queue.indexOf(notification);
        if (index > -1) {
            this.notifications.queue.splice(index, 1);
        }

        // Start exit animation
        notification.element.style.transform = 'translateX(100%)';
        notification.element.style.opacity = '0';

        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        }, 300);
    }

    /**
     * Limit number of visible notifications
     */
    limitVisibleNotifications() {
        while (this.notifications.queue.length > this.notifications.maxVisible) {
            const oldest = this.notifications.queue[0];
            this.hideNotification(oldest);
        }
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        this.notifications.queue.forEach(notification => {
            this.hideNotification(notification);
        });
    }

    // ===================================
    // DOM HELPER FUNCTIONS
    // ===================================

    /**
     * Attach button event listener with error handling
     * @param {string} buttonId - ID of the button element
     * @param {Function} callback - Click handler function
     * @param {Object} options - Additional options
     */
    attachButton(buttonId, callback, options = {}) {
        const button = document.getElementById(buttonId);
        if (button) {
            const wrappedCallback = (e) => {
                try {
                    callback(e);
                } catch (error) {
                    console.error(`Error in button ${buttonId} handler:`, error);
                    if (options.showErrors !== false) {
                        this.showNotification(`Action failed: ${error.message}`, 'error');
                    }
                }
            };
            
            button.addEventListener('click', wrappedCallback);
            
            if (options.disabled) {
                button.disabled = true;
            }
            
            return button;
        } else {
            // In React environments, buttons may not exist during initialization
            // Only warn if explicitly requested with required: true
            if (options.required === true) {
                console.warn(`Button ${buttonId} not found`);
            }
            return null;
        }
    }

    /**
     * Create a button element with consistent styling
     * @param {Object} config - Button configuration
     */
    createButton(config) {
        const button = document.createElement('button');
        button.className = `btn ${config.type || 'primary'} ${config.size || ''} ${config.className || ''}`.trim();
        
        if (config.id) button.id = config.id;
        if (config.disabled) button.disabled = true;
        
        // Create button content
        if (config.icon || config.text) {
            if (config.icon) {
                const icon = document.createElement('span');
                icon.className = 'btn-icon';
                icon.textContent = config.icon;
                button.appendChild(icon);
            }
            
            if (config.text) {
                const text = document.createElement('span');
                text.className = 'btn-text';
                text.textContent = config.text;
                button.appendChild(text);
            }
        } else {
            button.textContent = config.label || 'Button';
        }
        
        if (config.onClick) {
            this.attachButton(button.id || 'temp-btn', config.onClick);
        }
        
        return button;
    }

    /**
     * Show/hide element with animation
     * @param {HTMLElement|string} element - Element or ID
     * @param {boolean} show - Whether to show or hide
     * @param {string} animation - Animation type ('fade', 'slide', 'scale')
     */
    toggleElement(element, show, animation = 'fade') {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        if (show) {
            el.classList.remove('hidden');
            el.style.display = '';
            
            switch (animation) {
                case 'fade':
                    el.style.opacity = '0';
                    setTimeout(() => el.style.opacity = '1', 10);
                    break;
                case 'slide':
                    el.style.transform = 'translateY(-20px)';
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.style.transform = 'translateY(0)';
                        el.style.opacity = '1';
                    }, 10);
                    break;
                case 'scale':
                    el.style.transform = 'scale(0.8)';
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.style.transform = 'scale(1)';
                        el.style.opacity = '1';
                    }, 10);
                    break;
            }
        } else {
            switch (animation) {
                case 'fade':
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.style.display = 'none';
                    }, 300);
                    break;
                case 'slide':
                    el.style.transform = 'translateY(-20px)';
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.style.display = 'none';
                    }, 300);
                    break;
                case 'scale':
                    el.style.transform = 'scale(0.8)';
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.style.display = 'none';
                    }, 300);
                    break;
            }
        }
    }

    /**
     * Create and show a modal dialog
     * @param {Object} config - Modal configuration
     */
    showModal(config) {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.cssText = `
            background: var(--modal-bg, white);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 90vw;
            max-height: 90vh;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            overflow: hidden;
        `;

        // Modal header
        if (config.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.style.cssText = `
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color, #ddd);
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;

            const title = document.createElement('h3');
            title.textContent = config.title;
            title.style.margin = '0';
            header.appendChild(title);

            if (config.closeable !== false) {
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px 8px;
                `;
                closeBtn.addEventListener('click', () => this.hideModal(backdrop));
                header.appendChild(closeBtn);
            }

            modal.appendChild(header);
        }

        // Modal body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.cssText = 'padding: 20px;';
        
        if (config.content) {
            if (typeof config.content === 'string') {
                body.innerHTML = config.content;
            } else {
                body.appendChild(config.content);
            }
        }
        modal.appendChild(body);

        // Modal footer
        if (config.buttons && config.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.style.cssText = `
                padding: 16px 20px;
                border-top: 1px solid var(--border-color, #ddd);
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            `;

            config.buttons.forEach(buttonConfig => {
                const button = this.createButton(buttonConfig);
                if (buttonConfig.onClick) {
                    button.addEventListener('click', (e) => {
                        const result = buttonConfig.onClick(e);
                        if (result !== false) {
                            this.hideModal(backdrop);
                        }
                    });
                }
                footer.appendChild(button);
            });

            modal.appendChild(footer);
        }

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Close on backdrop click
        if (config.closeOnBackdrop !== false) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.hideModal(backdrop);
                }
            });
        }

        // Show with animation
        setTimeout(() => {
            backdrop.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);

        return {
            backdrop,
            modal,
            hide: () => this.hideModal(backdrop)
        };
    }

    /**
     * Hide a modal
     * @param {HTMLElement} backdrop - Modal backdrop element
     */
    hideModal(backdrop) {
        if (!backdrop) return;

        const modal = backdrop.querySelector('.modal-content');
        backdrop.style.opacity = '0';
        if (modal) {
            modal.style.transform = 'scale(0.8)';
        }

        setTimeout(() => {
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        }, 300);
    }

    // ===================================
    // UTILITY FUNCTIONS
    // ===================================

    /**
     * Format numbers with appropriate units
     * @param {number} value - Number to format
     * @param {Object} options - Formatting options
     */
    formatNumber(value, options = {}) {
        if (typeof value !== 'number' || isNaN(value)) {
            return options.fallback || '0';
        }

        const {
            decimals = 1,
            units = ['', 'K', 'M', 'B', 'T'],
            threshold = 1000,
            forceDecimals = false
        } = options;

        if (value < threshold) {
            return forceDecimals ? value.toFixed(decimals) : value.toString();
        }

        let unitIndex = 0;
        let scaledValue = value;

        while (scaledValue >= threshold && unitIndex < units.length - 1) {
            scaledValue /= threshold;
            unitIndex++;
        }

        const formatted = scaledValue.toFixed(decimals);
        const trimmed = forceDecimals ? formatted : parseFloat(formatted).toString();
        
        return trimmed + units[unitIndex];
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * Generate unique ID
     * @param {string} prefix - Optional prefix
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Safe element query with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     */
    safeQuery(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return null;
        }
    }

    /**
     * Safe element query all with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     */
    safeQueryAll(selector, parent = document) {
        try {
            return Array.from(parent.querySelectorAll(selector));
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return [];
        }
    }

    /**
     * Check if element is visible in viewport
     * @param {HTMLElement} element - Element to check
     */
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Scroll element into view smoothly
     * @param {HTMLElement|string} element - Element or selector
     * @param {Object} options - Scroll options
     */
    scrollIntoView(element, options = {}) {
        const el = typeof element === 'string' ? this.safeQuery(element) : element;
        if (!el) return;

        const {
            behavior = 'smooth',
            block = 'center',
            inline = 'nearest'
        } = options;

        el.scrollIntoView({ behavior, block, inline });
    }

    // ===================================
    // CLEANUP
    // ===================================

    /**
     * Clean up resources
     */
    cleanup() {
        this.clearAllNotifications();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('🧹 UIHelpers cleaned up');
    }
}

// Create singleton instance
const uiHelpers = new UIHelpers();

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIHelpers, uiHelpers };
} else if (typeof window !== 'undefined') {
    window.UIHelpers = UIHelpers;
    window.uiHelpers = uiHelpers;
}