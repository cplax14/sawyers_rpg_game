/**
 * Module Communication System
 * Establishes patterns for UI module interaction, error handling, and event coordination
 */

/**
 * Communication Bus
 * Central event bus for module-to-module communication
 */
class CommunicationBus extends EventTarget {
    constructor() {
        super();
        this.channels = new Map();
        this.subscribers = new Map();
        this.messageHistory = [];
        this.maxHistorySize = 100;
        this.debugMode = false;
        
        console.log('✅ CommunicationBus initialized');
    }

    /**
     * Create a communication channel
     * @param {string} channelName - Name of the channel
     * @param {Object} options - Channel options
     */
    createChannel(channelName, options = {}) {
        if (this.channels.has(channelName)) {
            console.warn(`Channel ${channelName} already exists`);
            return this.channels.get(channelName);
        }

        const channel = {
            name: channelName,
            subscribers: new Set(),
            messageQueue: [],
            options: {
                persistent: options.persistent || false,
                maxQueueSize: options.maxQueueSize || 50,
                filterDuplicates: options.filterDuplicates || false,
                ...options
            }
        };

        this.channels.set(channelName, channel);
        console.log(`📡 Created communication channel: ${channelName}`);
        
        return channel;
    }

    /**
     * Subscribe to a channel
     * @param {string} channelName - Name of the channel
     * @param {string} subscriberId - ID of the subscriber (usually module name)
     * @param {Function} handler - Message handler function
     */
    subscribe(channelName, subscriberId, handler) {
        let channel = this.channels.get(channelName);
        if (!channel) {
            channel = this.createChannel(channelName);
        }

        const subscription = {
            id: subscriberId,
            handler,
            timestamp: Date.now()
        };

        channel.subscribers.add(subscription);
        
        // Track subscriber globally
        if (!this.subscribers.has(subscriberId)) {
            this.subscribers.set(subscriberId, new Set());
        }
        this.subscribers.get(subscriberId).add(channelName);

        if (this.debugMode) {
            console.log(`📥 ${subscriberId} subscribed to channel: ${channelName}`);
        }

        return () => this.unsubscribe(channelName, subscriberId);
    }

    /**
     * Unsubscribe from a channel
     * @param {string} channelName - Name of the channel
     * @param {string} subscriberId - ID of the subscriber
     */
    unsubscribe(channelName, subscriberId) {
        const channel = this.channels.get(channelName);
        if (!channel) return false;

        // Find and remove subscription
        for (const subscription of channel.subscribers) {
            if (subscription.id === subscriberId) {
                channel.subscribers.delete(subscription);
                
                // Update global subscriber tracking
                const subscriberChannels = this.subscribers.get(subscriberId);
                if (subscriberChannels) {
                    subscriberChannels.delete(channelName);
                    if (subscriberChannels.size === 0) {
                        this.subscribers.delete(subscriberId);
                    }
                }
                
                if (this.debugMode) {
                    console.log(`📤 ${subscriberId} unsubscribed from channel: ${channelName}`);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Publish a message to a channel
     * @param {string} channelName - Name of the channel
     * @param {Object} message - Message to publish
     * @param {string} senderId - ID of the sender
     */
    publish(channelName, message, senderId = 'system') {
        const channel = this.channels.get(channelName);
        if (!channel) {
            console.warn(`Cannot publish to non-existent channel: ${channelName}`);
            return false;
        }

        const messageEnvelope = {
            channel: channelName,
            sender: senderId,
            timestamp: Date.now(),
            id: this.generateMessageId(),
            data: message
        };

        // Filter duplicates if enabled
        if (channel.options.filterDuplicates) {
            const isDuplicate = channel.messageQueue.some(msg => 
                msg.sender === senderId && 
                JSON.stringify(msg.data) === JSON.stringify(message)
            );
            if (isDuplicate) {
                if (this.debugMode) {
                    console.log(`🔄 Filtered duplicate message on channel: ${channelName}`);
                }
                return false;
            }
        }

        // Add to channel queue
        channel.messageQueue.push(messageEnvelope);
        if (channel.messageQueue.length > channel.options.maxQueueSize) {
            channel.messageQueue.shift();
        }

        // Add to global history
        this.messageHistory.push(messageEnvelope);
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory.shift();
        }

        // Deliver to subscribers
        this.deliverMessage(channel, messageEnvelope);

        if (this.debugMode) {
            console.log(`📡 Published message on ${channelName}:`, message);
        }

        return true;
    }

    /**
     * Deliver message to channel subscribers
     * @param {Object} channel - Channel object
     * @param {Object} messageEnvelope - Message envelope
     */
    deliverMessage(channel, messageEnvelope) {
        const failedDeliveries = [];

        for (const subscription of channel.subscribers) {
            try {
                subscription.handler(messageEnvelope.data, messageEnvelope);
            } catch (error) {
                console.error(`Error delivering message to ${subscription.id}:`, error);
                failedDeliveries.push({
                    subscriber: subscription.id,
                    error,
                    message: messageEnvelope
                });
            }
        }

        // Emit delivery failures for error handling
        if (failedDeliveries.length > 0) {
            this.emit('deliveryFailures', { 
                channel: channel.name, 
                failures: failedDeliveries 
            });
        }
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get channel information
     * @param {string} channelName - Name of the channel
     */
    getChannelInfo(channelName) {
        const channel = this.channels.get(channelName);
        if (!channel) return null;

        return {
            name: channel.name,
            subscriberCount: channel.subscribers.size,
            messageCount: channel.messageQueue.length,
            options: channel.options,
            subscribers: Array.from(channel.subscribers).map(sub => sub.id)
        };
    }

    /**
     * Get all channels
     */
    getAllChannels() {
        return Array.from(this.channels.keys());
    }

    /**
     * Clear channel message queue
     * @param {string} channelName - Name of the channel
     */
    clearChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.messageQueue = [];
            return true;
        }
        return false;
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 CommunicationBus debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.channels.clear();
        this.subscribers.clear();
        this.messageHistory = [];
        console.log('🧹 CommunicationBus cleaned up');
    }
}

/**
 * Module Communication Patterns
 * Standardized patterns for module-to-module communication
 */
class ModuleCommunicationPatterns {
    constructor(communicationBus) {
        this.bus = communicationBus;
        this.patterns = new Map();
        this.setupStandardPatterns();
    }

    /**
     * Set up standard communication patterns
     */
    setupStandardPatterns() {
        // Request-Response Pattern
        this.addPattern('request-response', {
            description: 'Request data from another module and get a response',
            channels: ['requests', 'responses'],
            setup: (patternConfig) => {
                this.bus.createChannel('requests', { maxQueueSize: 20 });
                this.bus.createChannel('responses', { maxQueueSize: 20 });
            }
        });

        // Publish-Subscribe Pattern
        this.addPattern('pub-sub', {
            description: 'Publish events that multiple modules can subscribe to',
            channels: ['events'],
            setup: (patternConfig) => {
                this.bus.createChannel('events', { 
                    persistent: true,
                    filterDuplicates: true 
                });
            }
        });

        // Command Pattern
        this.addPattern('command', {
            description: 'Send commands to specific modules',
            channels: ['commands'],
            setup: (patternConfig) => {
                this.bus.createChannel('commands', { maxQueueSize: 30 });
            }
        });

        // State Synchronization Pattern
        this.addPattern('state-sync', {
            description: 'Synchronize state changes across modules',
            channels: ['state-changes'],
            setup: (patternConfig) => {
                this.bus.createChannel('state-changes', { 
                    persistent: true,
                    filterDuplicates: true 
                });
            }
        });

        // Notification Pattern
        this.addPattern('notification', {
            description: 'Send notifications and alerts between modules',
            channels: ['notifications'],
            setup: (patternConfig) => {
                this.bus.createChannel('notifications', { maxQueueSize: 50 });
            }
        });
    }

    /**
     * Add a communication pattern
     * @param {string} name - Pattern name
     * @param {Object} config - Pattern configuration
     */
    addPattern(name, config) {
        this.patterns.set(name, config);
        
        if (config.setup && typeof config.setup === 'function') {
            config.setup(config);
        }
        
        console.log(`📋 Registered communication pattern: ${name}`);
    }

    /**
     * Get pattern information
     * @param {string} name - Pattern name
     */
    getPattern(name) {
        return this.patterns.get(name);
    }

    /**
     * Request-Response helper
     * @param {string} requesterId - ID of the requesting module
     * @param {string} targetModule - Target module ID
     * @param {Object} request - Request data
     * @param {number} timeout - Request timeout in ms
     */
    async requestResponse(requesterId, targetModule, request, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Set up response listener
            const unsubscribe = this.bus.subscribe('responses', requesterId, (response) => {
                if (response.requestId === requestId) {
                    unsubscribe();
                    clearTimeout(timeoutId);
                    resolve(response.data);
                }
            });

            // Set up timeout
            const timeoutId = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Request timeout: ${requestId}`));
            }, timeout);

            // Send request
            this.bus.publish('requests', {
                requestId,
                requester: requesterId,
                target: targetModule,
                data: request
            }, requesterId);
        });
    }

    /**
     * Command helper
     * @param {string} senderId - ID of the sending module
     * @param {string} targetModule - Target module ID
     * @param {string} command - Command name
     * @param {Object} data - Command data
     */
    sendCommand(senderId, targetModule, command, data = {}) {
        this.bus.publish('commands', {
            target: targetModule,
            command,
            data,
            timestamp: Date.now()
        }, senderId);
    }

    /**
     * State change notification helper
     * @param {string} moduleId - ID of the module reporting state change
     * @param {string} stateKey - Key of the state that changed
     * @param {*} newValue - New state value
     * @param {*} oldValue - Previous state value
     */
    notifyStateChange(moduleId, stateKey, newValue, oldValue = null) {
        this.bus.publish('state-changes', {
            module: moduleId,
            key: stateKey,
            newValue,
            oldValue,
            timestamp: Date.now()
        }, moduleId);
    }

    /**
     * Event notification helper
     * @param {string} moduleId - ID of the module emitting the event
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event data
     */
    emitEvent(moduleId, eventName, eventData = {}) {
        this.bus.publish('events', {
            event: eventName,
            module: moduleId,
            data: eventData,
            timestamp: Date.now()
        }, moduleId);
    }

    /**
     * Notification helper
     * @param {string} moduleId - ID of the sending module
     * @param {string} type - Notification type
     * @param {string} message - Notification message
     * @param {Object} metadata - Additional metadata
     */
    sendNotification(moduleId, type, message, metadata = {}) {
        this.bus.publish('notifications', {
            type,
            message,
            metadata,
            timestamp: Date.now()
        }, moduleId);
    }
}

/**
 * Error Handling System
 * Centralized error handling and recovery for module communication
 */
class CommunicationErrorHandler {
    constructor(communicationBus) {
        this.bus = communicationBus;
        this.errorHandlers = new Map();
        this.errorHistory = [];
        this.maxErrorHistory = 100;
        this.retryStrategies = new Map();
        
        this.setupDefaultHandlers();
        this.setupDefaultRetryStrategies();
        
        console.log('✅ CommunicationErrorHandler initialized');
    }

    /**
     * Set up default error handlers
     */
    setupDefaultHandlers() {
        // Module not found errors
        this.addErrorHandler('MODULE_NOT_FOUND', (error, context) => {
            console.warn(`Module not found: ${error.moduleId}`, context);
            return { handled: true, retry: false };
        });

        // Communication timeout errors
        this.addErrorHandler('COMMUNICATION_TIMEOUT', (error, context) => {
            console.warn(`Communication timeout with ${error.moduleId}`, context);
            return { handled: true, retry: true, delay: 1000 };
        });

        // Message delivery failures
        this.addErrorHandler('DELIVERY_FAILURE', (error, context) => {
            console.error(`Message delivery failed:`, error, context);
            return { handled: true, retry: true, maxRetries: 3 };
        });

        // Module initialization errors
        this.addErrorHandler('MODULE_INIT_ERROR', (error, context) => {
            console.error(`Module initialization error:`, error, context);
            return { handled: true, retry: false };
        });
    }

    /**
     * Set up default retry strategies
     */
    setupDefaultRetryStrategies() {
        // Exponential backoff
        this.addRetryStrategy('exponential', (attempt) => {
            return Math.min(1000 * Math.pow(2, attempt), 10000);
        });

        // Linear backoff
        this.addRetryStrategy('linear', (attempt) => {
            return 1000 * attempt;
        });

        // Fixed delay
        this.addRetryStrategy('fixed', () => {
            return 1000;
        });
    }

    /**
     * Add error handler
     * @param {string} errorType - Type of error
     * @param {Function} handler - Error handler function
     */
    addErrorHandler(errorType, handler) {
        this.errorHandlers.set(errorType, handler);
    }

    /**
     * Add retry strategy
     * @param {string} name - Strategy name
     * @param {Function} strategy - Strategy function
     */
    addRetryStrategy(name, strategy) {
        this.retryStrategies.set(name, strategy);
    }

    /**
     * Handle an error
     * @param {Object} error - Error object
     * @param {Object} context - Error context
     */
    handleError(error, context = {}) {
        const errorRecord = {
            error,
            context,
            timestamp: Date.now(),
            id: this.generateErrorId()
        };

        this.errorHistory.push(errorRecord);
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.shift();
        }

        const handler = this.errorHandlers.get(error.type);
        if (handler) {
            try {
                const result = handler(error, context);
                
                if (result.retry) {
                    this.scheduleRetry(error, context, result);
                }
                
                return result;
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
                return { handled: false, retry: false };
            }
        }

        // Default error handling
        console.error('Unhandled communication error:', error, context);
        return { handled: false, retry: false };
    }

    /**
     * Schedule retry for failed operation
     * @param {Object} error - Original error
     * @param {Object} context - Error context
     * @param {Object} retryConfig - Retry configuration
     */
    scheduleRetry(error, context, retryConfig) {
        const {
            delay = 1000,
            maxRetries = 3,
            strategy = 'exponential',
            onRetry
        } = retryConfig;

        const attempt = (context.retryAttempt || 0) + 1;
        
        if (attempt > maxRetries) {
            console.error(`Max retries exceeded for error: ${error.type}`);
            return;
        }

        const retryStrategy = this.retryStrategies.get(strategy);
        const retryDelay = retryStrategy ? retryStrategy(attempt) : delay;

        setTimeout(() => {
            console.log(`Retrying operation (attempt ${attempt}/${maxRetries})`);
            
            if (onRetry && typeof onRetry === 'function') {
                try {
                    onRetry(error, { ...context, retryAttempt: attempt });
                } catch (retryError) {
                    console.error('Error during retry:', retryError);
                    this.handleError({
                        type: 'RETRY_FAILURE',
                        originalError: error,
                        retryError
                    }, context);
                }
            }
        }, retryDelay);
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const errorsByType = {};
        const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        
        this.errorHistory
            .filter(record => record.timestamp > last24Hours)
            .forEach(record => {
                const type = record.error.type || 'UNKNOWN';
                errorsByType[type] = (errorsByType[type] || 0) + 1;
            });

        return {
            totalErrors: this.errorHistory.length,
            last24Hours: Object.keys(errorsByType).length,
            errorsByType,
            recentErrors: this.errorHistory.slice(-10)
        };
    }

    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.errorHandlers.clear();
        this.retryStrategies.clear();
        this.errorHistory = [];
        console.log('🧹 CommunicationErrorHandler cleaned up');
    }
}

/**
 * Module Communication Manager
 * High-level manager that coordinates all communication systems
 */
class ModuleCommunicationManager {
    constructor(options = {}) {
        this.bus = new CommunicationBus();
        this.patterns = new ModuleCommunicationPatterns(this.bus);
        this.errorHandler = new CommunicationErrorHandler(this.bus);
        
        this.options = {
            debugMode: options.debugMode || false,
            enableErrorRecovery: options.enableErrorRecovery !== false,
            ...options
        };
        
        if (this.options.debugMode) {
            this.bus.setDebugMode(true);
        }
        
        this.setupErrorHandling();
        
        console.log('✅ ModuleCommunicationManager initialized');
    }

    /**
     * Set up error handling integration
     */
    setupErrorHandling() {
        if (this.options.enableErrorRecovery) {
            this.bus.addEventListener('deliveryFailures', (event) => {
                event.detail.failures.forEach(failure => {
                    this.errorHandler.handleError({
                        type: 'DELIVERY_FAILURE',
                        moduleId: failure.subscriber,
                        originalError: failure.error
                    }, {
                        message: failure.message,
                        channel: event.detail.channel
                    });
                });
            });
        }
    }

    /**
     * Get communication bus
     */
    getBus() {
        return this.bus;
    }

    /**
     * Get patterns manager
     */
    getPatterns() {
        return this.patterns;
    }

    /**
     * Get error handler
     */
    getErrorHandler() {
        return this.errorHandler;
    }

    /**
     * Create module communication interface
     * @param {string} moduleId - ID of the module
     */
    createModuleInterface(moduleId) {
        return new ModuleCommunicationInterface(moduleId, this);
    }

    /**
     * Get communication statistics
     */
    getStats() {
        return {
            channels: this.bus.getAllChannels().map(name => 
                this.bus.getChannelInfo(name)
            ),
            errors: this.errorHandler.getErrorStats(),
            patterns: Array.from(this.patterns.patterns.keys())
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.bus.cleanup();
        this.errorHandler.cleanup();
        console.log('🧹 ModuleCommunicationManager cleaned up');
    }
}

/**
 * Module Communication Interface
 * Interface provided to individual modules for communication
 */
class ModuleCommunicationInterface {
    constructor(moduleId, communicationManager) {
        this.moduleId = moduleId;
        this.manager = communicationManager;
        this.bus = communicationManager.getBus();
        this.patterns = communicationManager.getPatterns();
        this.subscriptions = new Set();
        
        console.log(`📡 Created communication interface for module: ${moduleId}`);
    }

    /**
     * Subscribe to a channel
     * @param {string} channel - Channel name
     * @param {Function} handler - Message handler
     */
    subscribe(channel, handler) {
        const unsubscribe = this.bus.subscribe(channel, this.moduleId, handler);
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
    }

    /**
     * Publish to a channel
     * @param {string} channel - Channel name
     * @param {Object} message - Message to publish
     */
    publish(channel, message) {
        return this.bus.publish(channel, message, this.moduleId);
    }

    /**
     * Send request and wait for response
     * @param {string} targetModule - Target module ID
     * @param {Object} request - Request data
     * @param {number} timeout - Request timeout
     */
    async request(targetModule, request, timeout) {
        return this.patterns.requestResponse(this.moduleId, targetModule, request, timeout);
    }

    /**
     * Send command to another module
     * @param {string} targetModule - Target module ID
     * @param {string} command - Command name
     * @param {Object} data - Command data
     */
    sendCommand(targetModule, command, data) {
        return this.patterns.sendCommand(this.moduleId, targetModule, command, data);
    }

    /**
     * Emit an event
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    emitEvent(eventName, data) {
        return this.patterns.emitEvent(this.moduleId, eventName, data);
    }

    /**
     * Notify state change
     * @param {string} stateKey - State key
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    notifyStateChange(stateKey, newValue, oldValue) {
        return this.patterns.notifyStateChange(this.moduleId, stateKey, newValue, oldValue);
    }

    /**
     * Send notification
     * @param {string} type - Notification type
     * @param {string} message - Message
     * @param {Object} metadata - Additional metadata
     */
    sendNotification(type, message, metadata) {
        return this.patterns.sendNotification(this.moduleId, type, message, metadata);
    }

    /**
     * Cleanup subscriptions
     */
    cleanup() {
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error('Error during subscription cleanup:', error);
            }
        });
        this.subscriptions.clear();
        
        console.log(`🧹 Communication interface cleaned up for module: ${this.moduleId}`);
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        CommunicationBus, 
        ModuleCommunicationPatterns, 
        CommunicationErrorHandler,
        ModuleCommunicationManager,
        ModuleCommunicationInterface
    };
} else if (typeof window !== 'undefined') {
    window.CommunicationBus = CommunicationBus;
    window.ModuleCommunicationPatterns = ModuleCommunicationPatterns;
    window.CommunicationErrorHandler = CommunicationErrorHandler;
    window.ModuleCommunicationManager = ModuleCommunicationManager;
    window.ModuleCommunicationInterface = ModuleCommunicationInterface;
}