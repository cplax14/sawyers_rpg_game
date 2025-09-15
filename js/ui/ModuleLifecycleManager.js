/**
 * Module Lifecycle Manager
 * Comprehensive system for managing UI module lifecycles including loading, initialization, and cleanup
 */

/**
 * Module State Tracker
 * Tracks and manages the state of individual modules throughout their lifecycle
 */
class ModuleStateTracker {
    constructor() {
        this.moduleStates = new Map();
        this.stateHistory = new Map();
        this.maxHistorySize = 50;
        
        // Define possible module states
        this.states = {
            UNLOADED: 'unloaded',
            LOADING: 'loading',
            LOADED: 'loaded',
            INITIALIZING: 'initializing',
            READY: 'ready',
            ACTIVE: 'active',
            INACTIVE: 'inactive',
            SUSPENDING: 'suspending',
            SUSPENDED: 'suspended',
            RESUMING: 'resuming',
            CLEANING_UP: 'cleaning_up',
            ERROR: 'error',
            DESTROYED: 'destroyed'
        };
        
        console.log('✅ ModuleStateTracker initialized');
    }

    /**
     * Initialize module state tracking
     */
    initializeModule(moduleId, initialState = this.states.UNLOADED) {
        const state = {
            id: moduleId,
            currentState: initialState,
            previousState: null,
            lastTransition: Date.now(),
            errorCount: 0,
            lastError: null,
            metadata: {},
            dependencies: new Set(),
            dependents: new Set()
        };
        
        this.moduleStates.set(moduleId, state);
        this.stateHistory.set(moduleId, []);
        
        this.recordStateChange(moduleId, null, initialState, 'Module initialized');
        
        return state;
    }

    /**
     * Transition module to new state
     */
    transitionState(moduleId, newState, reason = '', metadata = {}) {
        const moduleState = this.moduleStates.get(moduleId);
        if (!moduleState) {
            console.error(`Cannot transition unknown module: ${moduleId}`);
            return false;
        }

        const oldState = moduleState.currentState;
        
        // Validate state transition
        if (!this.isValidTransition(oldState, newState)) {
            console.error(`Invalid state transition for ${moduleId}: ${oldState} → ${newState}`);
            return false;
        }

        // Update state
        moduleState.previousState = oldState;
        moduleState.currentState = newState;
        moduleState.lastTransition = Date.now();
        moduleState.metadata = { ...moduleState.metadata, ...metadata };

        // Record state change
        this.recordStateChange(moduleId, oldState, newState, reason, metadata);

        console.log(`🔄 Module ${moduleId}: ${oldState} → ${newState} (${reason})`);
        
        return true;
    }

    /**
     * Record state change in history
     */
    recordStateChange(moduleId, fromState, toState, reason, metadata = {}) {
        const history = this.stateHistory.get(moduleId) || [];
        
        const entry = {
            timestamp: Date.now(),
            fromState,
            toState,
            reason,
            metadata
        };
        
        history.push(entry);
        
        // Limit history size
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
        
        this.stateHistory.set(moduleId, history);
    }

    /**
     * Validate state transition
     */
    isValidTransition(fromState, toState) {
        const validTransitions = {
            [this.states.UNLOADED]: [this.states.LOADING, this.states.ERROR],
            [this.states.LOADING]: [this.states.LOADED, this.states.ERROR],
            [this.states.LOADED]: [this.states.INITIALIZING, this.states.ERROR, this.states.CLEANING_UP],
            [this.states.INITIALIZING]: [this.states.READY, this.states.ERROR],
            [this.states.READY]: [this.states.ACTIVE, this.states.INACTIVE, this.states.ERROR, this.states.CLEANING_UP],
            [this.states.ACTIVE]: [this.states.INACTIVE, this.states.SUSPENDING, this.states.ERROR, this.states.CLEANING_UP],
            [this.states.INACTIVE]: [this.states.ACTIVE, this.states.SUSPENDING, this.states.ERROR, this.states.CLEANING_UP],
            [this.states.SUSPENDING]: [this.states.SUSPENDED, this.states.ERROR],
            [this.states.SUSPENDED]: [this.states.RESUMING, this.states.ERROR, this.states.CLEANING_UP],
            [this.states.RESUMING]: [this.states.ACTIVE, this.states.INACTIVE, this.states.ERROR],
            [this.states.CLEANING_UP]: [this.states.DESTROYED, this.states.ERROR],
            [this.states.ERROR]: [this.states.LOADING, this.states.INITIALIZING, this.states.CLEANING_UP, this.states.DESTROYED],
            [this.states.DESTROYED]: [] // Terminal state
        };

        return validTransitions[fromState]?.includes(toState) || false;
    }

    /**
     * Set module error
     */
    setModuleError(moduleId, error, context = {}) {
        const moduleState = this.moduleStates.get(moduleId);
        if (!moduleState) return false;

        moduleState.errorCount++;
        moduleState.lastError = {
            error: error.message || error,
            timestamp: Date.now(),
            context
        };

        this.transitionState(moduleId, this.states.ERROR, `Error: ${error.message || error}`, {
            errorCount: moduleState.errorCount,
            context
        });

        return true;
    }

    /**
     * Add dependency relationship
     */
    addDependency(moduleId, dependencyId) {
        const moduleState = this.moduleStates.get(moduleId);
        const dependencyState = this.moduleStates.get(dependencyId);
        
        if (moduleState && dependencyState) {
            moduleState.dependencies.add(dependencyId);
            dependencyState.dependents.add(moduleId);
            return true;
        }
        
        return false;
    }

    /**
     * Get module state
     */
    getModuleState(moduleId) {
        return this.moduleStates.get(moduleId);
    }

    /**
     * Get module history
     */
    getModuleHistory(moduleId) {
        return this.stateHistory.get(moduleId) || [];
    }

    /**
     * Get modules by state
     */
    getModulesByState(state) {
        const modules = [];
        for (const [id, moduleState] of this.moduleStates) {
            if (moduleState.currentState === state) {
                modules.push(id);
            }
        }
        return modules;
    }

    /**
     * Get all modules overview
     */
    getAllModulesOverview() {
        const overview = {};
        for (const [id, state] of this.moduleStates) {
            overview[id] = {
                state: state.currentState,
                lastTransition: state.lastTransition,
                errorCount: state.errorCount,
                dependencies: Array.from(state.dependencies),
                dependents: Array.from(state.dependents)
            };
        }
        return overview;
    }

    /**
     * Cleanup module tracking
     */
    removeModule(moduleId) {
        const moduleState = this.moduleStates.get(moduleId);
        if (!moduleState) return false;

        // Remove dependency relationships
        moduleState.dependencies.forEach(depId => {
            const depState = this.moduleStates.get(depId);
            if (depState) {
                depState.dependents.delete(moduleId);
            }
        });

        moduleState.dependents.forEach(depId => {
            const depState = this.moduleStates.get(depId);
            if (depState) {
                depState.dependencies.delete(moduleId);
            }
        });

        this.moduleStates.delete(moduleId);
        this.stateHistory.delete(moduleId);
        
        return true;
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.moduleStates.clear();
        this.stateHistory.clear();
        console.log('🧹 ModuleStateTracker cleaned up');
    }
}

/**
 * Module Dependency Manager
 * Manages module dependencies and loading order
 */
class ModuleDependencyManager {
    constructor(stateTracker) {
        this.stateTracker = stateTracker;
        this.dependencyGraph = new Map();
        this.loadingOrder = [];
        
        console.log('✅ ModuleDependencyManager initialized');
    }

    /**
     * Add module with dependencies
     */
    addModule(moduleId, dependencies = []) {
        this.dependencyGraph.set(moduleId, new Set(dependencies));
        
        // Update state tracker
        dependencies.forEach(depId => {
            this.stateTracker.addDependency(moduleId, depId);
        });
        
        // Recalculate loading order
        this.calculateLoadingOrder();
        
        return true;
    }

    /**
     * Calculate optimal loading order using topological sort
     */
    calculateLoadingOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];

        const visit = (moduleId) => {
            if (visiting.has(moduleId)) {
                throw new Error(`Circular dependency detected involving module: ${moduleId}`);
            }
            
            if (visited.has(moduleId)) {
                return;
            }

            visiting.add(moduleId);

            const dependencies = this.dependencyGraph.get(moduleId) || new Set();
            for (const depId of dependencies) {
                visit(depId);
            }

            visiting.delete(moduleId);
            visited.add(moduleId);
            order.push(moduleId);
        };

        for (const moduleId of this.dependencyGraph.keys()) {
            visit(moduleId);
        }

        this.loadingOrder = order;
        return order;
    }

    /**
     * Get loading order
     */
    getLoadingOrder() {
        return [...this.loadingOrder];
    }

    /**
     * Check if module dependencies are satisfied
     */
    areDependenciesSatisfied(moduleId, targetState = 'ready') {
        const dependencies = this.dependencyGraph.get(moduleId);
        if (!dependencies) return true;

        for (const depId of dependencies) {
            const depState = this.stateTracker.getModuleState(depId);
            if (!depState || depState.currentState !== targetState) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get unsatisfied dependencies
     */
    getUnsatisfiedDependencies(moduleId, targetState = 'ready') {
        const dependencies = this.dependencyGraph.get(moduleId);
        if (!dependencies) return [];

        const unsatisfied = [];
        for (const depId of dependencies) {
            const depState = this.stateTracker.getModuleState(depId);
            if (!depState || depState.currentState !== targetState) {
                unsatisfied.push(depId);
            }
        }

        return unsatisfied;
    }

    /**
     * Get modules that depend on this module
     */
    getDependents(moduleId) {
        const dependents = [];
        for (const [id, deps] of this.dependencyGraph) {
            if (deps.has(moduleId)) {
                dependents.push(id);
            }
        }
        return dependents;
    }

    /**
     * Validate dependency graph
     */
    validateDependencyGraph() {
        try {
            this.calculateLoadingOrder();
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.dependencyGraph.clear();
        this.loadingOrder = [];
        console.log('🧹 ModuleDependencyManager cleaned up');
    }
}

/**
 * Module Lifecycle Coordinator
 * Coordinates the entire lifecycle of modules from loading to destruction
 */
class ModuleLifecycleCoordinator {
    constructor(options = {}) {
        this.stateTracker = new ModuleStateTracker();
        this.dependencyManager = new ModuleDependencyManager(this.stateTracker);
        
        this.options = {
            maxConcurrentLoads: options.maxConcurrentLoads || 3,
            loadTimeout: options.loadTimeout || 30000,
            initTimeout: options.initTimeout || 10000,
            enableSuspension: options.enableSuspension !== false,
            enableAutoCleanup: options.enableAutoCleanup !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.activeOperations = new Map();
        this.suspendedModules = new Set();
        this.cleanupScheduled = new Set();
        
        // Performance tracking
        this.performanceMetrics = {
            loadTimes: new Map(),
            initTimes: new Map(),
            errorCount: 0,
            totalModules: 0
        };
        
        console.log('✅ ModuleLifecycleCoordinator initialized');
    }

    /**
     * Register module for lifecycle management
     */
    registerModule(moduleId, config = {}) {
        const {
            dependencies = [],
            lazy = false,
            priority = 0,
            suspendable = true,
            cleanupOnInactive = false
        } = config;

        // Initialize state tracking
        this.stateTracker.initializeModule(moduleId);
        
        // Add to dependency manager
        this.dependencyManager.addModule(moduleId, dependencies);
        
        // Store module config
        const moduleState = this.stateTracker.getModuleState(moduleId);
        moduleState.metadata = {
            ...moduleState.metadata,
            lazy,
            priority,
            suspendable,
            cleanupOnInactive,
            registeredAt: Date.now()
        };
        
        this.performanceMetrics.totalModules++;
        
        if (this.options.debugMode) {
            console.log(`📋 Registered module: ${moduleId}`, config);
        }
        
        return true;
    }

    /**
     * Load a module
     */
    async loadModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState) {
            throw new Error(`Module ${moduleId} not registered`);
        }

        if (moduleState.currentState !== this.stateTracker.states.UNLOADED) {
            console.warn(`Module ${moduleId} already loaded or loading`);
            return moduleInstance;
        }

        // Check dependencies
        if (!this.dependencyManager.areDependenciesSatisfied(moduleId, 'loaded')) {
            const unsatisfied = this.dependencyManager.getUnsatisfiedDependencies(moduleId, 'loaded');
            throw new Error(`Module ${moduleId} has unsatisfied dependencies: ${unsatisfied.join(', ')}`);
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.LOADING, 'Load initiated');
        
        const loadStartTime = Date.now();
        
        try {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                this.stateTracker.setModuleError(moduleId, new Error('Load timeout'), { timeout: this.options.loadTimeout });
            }, this.options.loadTimeout);

            // Perform loading
            await this.performModuleLoad(moduleId, moduleInstance);
            
            clearTimeout(timeoutId);
            
            // Record performance
            const loadTime = Date.now() - loadStartTime;
            this.performanceMetrics.loadTimes.set(moduleId, loadTime);
            
            this.stateTracker.transitionState(moduleId, this.stateTracker.states.LOADED, 'Load completed', {
                loadTime
            });
            
            if (this.options.debugMode) {
                console.log(`📦 Module ${moduleId} loaded in ${loadTime}ms`);
            }
            
            return moduleInstance;
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            this.stateTracker.setModuleError(moduleId, error, { phase: 'loading' });
            throw error;
        }
    }

    /**
     * Initialize a module
     */
    async initializeModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState) {
            throw new Error(`Module ${moduleId} not registered`);
        }

        if (moduleState.currentState !== this.stateTracker.states.LOADED) {
            throw new Error(`Module ${moduleId} must be loaded before initialization`);
        }

        // Check dependencies
        if (!this.dependencyManager.areDependenciesSatisfied(moduleId, 'ready')) {
            const unsatisfied = this.dependencyManager.getUnsatisfiedDependencies(moduleId, 'ready');
            throw new Error(`Module ${moduleId} has uninitialized dependencies: ${unsatisfied.join(', ')}`);
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.INITIALIZING, 'Initialization started');
        
        const initStartTime = Date.now();
        
        try {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                this.stateTracker.setModuleError(moduleId, new Error('Initialization timeout'), { 
                    timeout: this.options.initTimeout 
                });
            }, this.options.initTimeout);

            // Perform initialization
            await this.performModuleInitialization(moduleId, moduleInstance);
            
            clearTimeout(timeoutId);
            
            // Record performance
            const initTime = Date.now() - initStartTime;
            this.performanceMetrics.initTimes.set(moduleId, initTime);
            
            this.stateTracker.transitionState(moduleId, this.stateTracker.states.READY, 'Initialization completed', {
                initTime
            });
            
            if (this.options.debugMode) {
                console.log(`🔧 Module ${moduleId} initialized in ${initTime}ms`);
            }
            
            return moduleInstance;
            
        } catch (error) {
            this.performanceMetrics.errorCount++;
            this.stateTracker.setModuleError(moduleId, error, { phase: 'initialization' });
            throw error;
        }
    }

    /**
     * Activate a module
     */
    async activateModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState) {
            throw new Error(`Module ${moduleId} not registered`);
        }

        const validStates = [this.stateTracker.states.READY, this.stateTracker.states.INACTIVE];
        if (!validStates.includes(moduleState.currentState)) {
            throw new Error(`Module ${moduleId} must be ready or inactive to activate`);
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.ACTIVE, 'Module activated');
        
        try {
            if (typeof moduleInstance.onActivate === 'function') {
                await moduleInstance.onActivate();
            }
            
            // Remove from suspended modules if present
            this.suspendedModules.delete(moduleId);
            
            if (this.options.debugMode) {
                console.log(`▶️ Module ${moduleId} activated`);
            }
            
            return true;
            
        } catch (error) {
            this.stateTracker.setModuleError(moduleId, error, { phase: 'activation' });
            throw error;
        }
    }

    /**
     * Deactivate a module
     */
    async deactivateModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState) {
            throw new Error(`Module ${moduleId} not registered`);
        }

        if (moduleState.currentState !== this.stateTracker.states.ACTIVE) {
            return false;
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.INACTIVE, 'Module deactivated');
        
        try {
            if (typeof moduleInstance.onDeactivate === 'function') {
                await moduleInstance.onDeactivate();
            }
            
            // Schedule cleanup if configured
            if (moduleState.metadata.cleanupOnInactive && this.options.enableAutoCleanup) {
                this.scheduleCleanup(moduleId);
            }
            
            if (this.options.debugMode) {
                console.log(`⏸️ Module ${moduleId} deactivated`);
            }
            
            return true;
            
        } catch (error) {
            this.stateTracker.setModuleError(moduleId, error, { phase: 'deactivation' });
            throw error;
        }
    }

    /**
     * Suspend a module
     */
    async suspendModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState || !moduleState.metadata.suspendable || !this.options.enableSuspension) {
            return false;
        }

        const validStates = [this.stateTracker.states.ACTIVE, this.stateTracker.states.INACTIVE];
        if (!validStates.includes(moduleState.currentState)) {
            return false;
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.SUSPENDING, 'Module suspending');
        
        try {
            if (typeof moduleInstance.onSuspend === 'function') {
                await moduleInstance.onSuspend();
            }
            
            this.stateTracker.transitionState(moduleId, this.stateTracker.states.SUSPENDED, 'Module suspended');
            this.suspendedModules.add(moduleId);
            
            if (this.options.debugMode) {
                console.log(`💤 Module ${moduleId} suspended`);
            }
            
            return true;
            
        } catch (error) {
            this.stateTracker.setModuleError(moduleId, error, { phase: 'suspension' });
            return false;
        }
    }

    /**
     * Resume a suspended module
     */
    async resumeModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState || moduleState.currentState !== this.stateTracker.states.SUSPENDED) {
            return false;
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.RESUMING, 'Module resuming');
        
        try {
            if (typeof moduleInstance.onResume === 'function') {
                await moduleInstance.onResume();
            }
            
            this.stateTracker.transitionState(moduleId, this.stateTracker.states.ACTIVE, 'Module resumed');
            this.suspendedModules.delete(moduleId);
            
            if (this.options.debugMode) {
                console.log(`🔄 Module ${moduleId} resumed`);
            }
            
            return true;
            
        } catch (error) {
            this.stateTracker.setModuleError(moduleId, error, { phase: 'resume' });
            return false;
        }
    }

    /**
     * Clean up a module
     */
    async cleanupModule(moduleId, moduleInstance) {
        const moduleState = this.stateTracker.getModuleState(moduleId);
        if (!moduleState) {
            return false;
        }

        const validStates = [
            this.stateTracker.states.READY,
            this.stateTracker.states.ACTIVE,
            this.stateTracker.states.INACTIVE,
            this.stateTracker.states.SUSPENDED,
            this.stateTracker.states.ERROR
        ];

        if (!validStates.includes(moduleState.currentState)) {
            return false;
        }

        this.stateTracker.transitionState(moduleId, this.stateTracker.states.CLEANING_UP, 'Cleanup initiated');
        
        try {
            // Clean up dependents first
            const dependents = this.dependencyManager.getDependents(moduleId);
            for (const dependentId of dependents) {
                const dependentState = this.stateTracker.getModuleState(dependentId);
                if (dependentState && dependentState.currentState !== this.stateTracker.states.DESTROYED) {
                    console.warn(`Cleaning up dependent module: ${dependentId}`);
                    // Would need access to dependent instance - this is a simplification
                }
            }
            
            // Perform module cleanup
            if (typeof moduleInstance.cleanup === 'function') {
                await moduleInstance.cleanup();
            }
            
            this.stateTracker.transitionState(moduleId, this.stateTracker.states.DESTROYED, 'Cleanup completed');
            
            // Remove from all tracking
            this.suspendedModules.delete(moduleId);
            this.cleanupScheduled.delete(moduleId);
            
            if (this.options.debugMode) {
                console.log(`🧹 Module ${moduleId} cleaned up`);
            }
            
            return true;
            
        } catch (error) {
            this.stateTracker.setModuleError(moduleId, error, { phase: 'cleanup' });
            return false;
        }
    }

    /**
     * Perform actual module loading
     */
    async performModuleLoad(moduleId, moduleInstance) {
        // This is where actual loading logic would go
        // For now, just validate the module instance
        if (!moduleInstance) {
            throw new Error(`No module instance provided for ${moduleId}`);
        }
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    /**
     * Perform actual module initialization
     */
    async performModuleInitialization(moduleId, moduleInstance) {
        if (typeof moduleInstance.init === 'function') {
            await moduleInstance.init();
        }
    }

    /**
     * Schedule cleanup for a module
     */
    scheduleCleanup(moduleId, delay = 30000) {
        if (this.cleanupScheduled.has(moduleId)) {
            return;
        }
        
        this.cleanupScheduled.add(moduleId);
        
        setTimeout(() => {
            const moduleState = this.stateTracker.getModuleState(moduleId);
            if (moduleState && moduleState.currentState === this.stateTracker.states.INACTIVE) {
                // Would need module instance to actually clean up
                console.log(`🕒 Scheduled cleanup triggered for module: ${moduleId}`);
            }
            this.cleanupScheduled.delete(moduleId);
        }, delay);
    }

    /**
     * Get lifecycle statistics
     */
    getStatistics() {
        const moduleStates = this.stateTracker.getAllModulesOverview();
        const stateCount = {};
        
        Object.values(moduleStates).forEach(module => {
            stateCount[module.state] = (stateCount[module.state] || 0) + 1;
        });
        
        return {
            totalModules: this.performanceMetrics.totalModules,
            stateDistribution: stateCount,
            suspendedModules: Array.from(this.suspendedModules),
            scheduledCleanups: Array.from(this.cleanupScheduled),
            averageLoadTime: this.calculateAverageTime(this.performanceMetrics.loadTimes),
            averageInitTime: this.calculateAverageTime(this.performanceMetrics.initTimes),
            errorCount: this.performanceMetrics.errorCount,
            loadingOrder: this.dependencyManager.getLoadingOrder()
        };
    }

    /**
     * Calculate average time from time map
     */
    calculateAverageTime(timeMap) {
        if (timeMap.size === 0) return 0;
        const times = Array.from(timeMap.values());
        return times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    /**
     * Get module state information
     */
    getModuleInfo(moduleId) {
        const state = this.stateTracker.getModuleState(moduleId);
        const history = this.stateTracker.getModuleHistory(moduleId);
        
        if (!state) return null;
        
        return {
            ...state,
            history: history.slice(-10), // Last 10 state changes
            loadTime: this.performanceMetrics.loadTimes.get(moduleId),
            initTime: this.performanceMetrics.initTimes.get(moduleId),
            isSuspended: this.suspendedModules.has(moduleId),
            cleanupScheduled: this.cleanupScheduled.has(moduleId)
        };
    }

    /**
     * Cleanup lifecycle coordinator
     */
    cleanup() {
        this.stateTracker.cleanup();
        this.dependencyManager.cleanup();
        this.activeOperations.clear();
        this.suspendedModules.clear();
        this.cleanupScheduled.clear();
        
        console.log('🧹 ModuleLifecycleCoordinator cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ModuleStateTracker, 
        ModuleDependencyManager, 
        ModuleLifecycleCoordinator 
    };
} else if (typeof window !== 'undefined') {
    window.ModuleStateTracker = ModuleStateTracker;
    window.ModuleDependencyManager = ModuleDependencyManager;
    window.ModuleLifecycleCoordinator = ModuleLifecycleCoordinator;
}