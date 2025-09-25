/**
 * UI Module Loader
 * Manages loading and initialization of UI modules compatible with existing script loading
 */
class UIModuleLoader {
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
        this.loadingModules = new Set();
        this.dependencyGraph = new Map();
        this.initializationQueue = [];
        this.isLoaded = false;
        
        // Track loading status
        this.loadingStatus = {
            total: 0,
            loaded: 0,
            failed: []
        };
        
        // Event callbacks
        this.callbacks = {
            onProgress: null,
            onComplete: null,
            onError: null
        };
    }

    /**
     * Register a module definition
     * @param {string} name - Module name
     * @param {Object} config - Module configuration
     */
    registerModule(name, config) {
        const moduleConfig = {
            name,
            path: config.path || `js/ui/${name}.js`,
            dependencies: config.dependencies || [],
            className: config.className || name,
            options: config.options || {},
            autoInit: config.autoInit !== false,
            priority: config.priority || 0
        };

        this.modules.set(name, moduleConfig);
        
        // Build dependency graph
        this.dependencyGraph.set(name, moduleConfig.dependencies);
        
        console.log(`📋 Registered module: ${name}`);
        return this;
    }

    /**
     * Register multiple modules at once
     * @param {Object} moduleConfigs - Object mapping module names to configs
     */
    registerModules(moduleConfigs) {
        Object.entries(moduleConfigs).forEach(([name, config]) => {
            this.registerModule(name, config);
        });
        return this;
    }

    /**
     * Load modules using script tag injection (compatible with existing approach)
     * @param {Array} moduleNames - Names of modules to load, or all if not specified
     */
    async loadModules(moduleNames = null) {
        const modulesToLoad = moduleNames || Array.from(this.modules.keys());
        
        // Sort modules by dependency order and priority
        const sortedModules = this.resolveDependencyOrder(modulesToLoad);
        
        this.loadingStatus.total = sortedModules.length;
        this.loadingStatus.loaded = 0;
        this.loadingStatus.failed = [];

        console.log(`🚀 Loading ${sortedModules.length} UI modules...`);

        try {
            // Load modules sequentially to maintain dependency order
            for (const moduleName of sortedModules) {
                await this.loadModule(moduleName);
            }

            this.isLoaded = true;
            console.log('✅ All UI modules loaded successfully');
            
            if (this.callbacks.onComplete) {
                this.callbacks.onComplete(this.loadingStatus);
            }

        } catch (error) {
            console.error('❌ Failed to load UI modules:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error, this.loadingStatus);
            }
            throw error;
        }
    }

    /**
     * Load a single module via script injection
     * @param {string} moduleName - Name of the module to load
     */
    loadModule(moduleName) {
        return new Promise((resolve, reject) => {
            if (this.loadedModules.has(moduleName)) {
                resolve();
                return;
            }

            if (this.loadingModules.has(moduleName)) {
                // Module is already loading, wait for it
                const checkLoading = () => {
                    if (this.loadedModules.has(moduleName)) {
                        resolve();
                    } else if (!this.loadingModules.has(moduleName)) {
                        reject(new Error(`Module ${moduleName} failed to load`));
                    } else {
                        setTimeout(checkLoading, 10);
                    }
                };
                checkLoading();
                return;
            }

            const moduleConfig = this.modules.get(moduleName);
            if (!moduleConfig) {
                reject(new Error(`Module ${moduleName} not registered`));
                return;
            }

            this.loadingModules.add(moduleName);

            // Create script element
            const script = document.createElement('script');
            script.src = moduleConfig.path;
            script.async = false; // Maintain loading order

            script.onload = () => {
                this.loadingModules.delete(moduleName);
                this.loadedModules.add(moduleName);
                this.loadingStatus.loaded++;

                console.log(`✅ Loaded module: ${moduleName} (${this.loadingStatus.loaded}/${this.loadingStatus.total})`);
                
                if (this.callbacks.onProgress) {
                    this.callbacks.onProgress(moduleName, this.loadingStatus);
                }

                resolve();
            };

            script.onerror = () => {
                this.loadingModules.delete(moduleName);
                this.loadingStatus.failed.push(moduleName);
                
                const error = new Error(`Failed to load module: ${moduleName} from ${moduleConfig.path}`);
                console.error('❌', error.message);
                
                reject(error);
            };

            // Add to document head
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize loaded modules with the UIManager
     * @param {UIManager} uiManager - The UI manager instance
     */
    initializeModules(uiManager) {
        const moduleNames = Array.from(this.loadedModules);
        const sortedModules = this.resolveDependencyOrder(moduleNames);

        console.log(`🔧 Initializing ${sortedModules.length} UI modules...`);

        for (const moduleName of sortedModules) {
            try {
                this.initializeModule(moduleName, uiManager);
            } catch (error) {
                console.error(`❌ Failed to initialize module ${moduleName}:`, error);
                throw error;
            }
        }

        console.log('✅ All UI modules initialized');
    }

    /**
     * Initialize a single module
     * @param {string} moduleName - Name of the module to initialize
     * @param {UIManager} uiManager - The UI manager instance
     */
    initializeModule(moduleName, uiManager) {
        const moduleConfig = this.modules.get(moduleName);
        if (!moduleConfig) {
            throw new Error(`Module ${moduleName} not registered`);
        }

        // Get the module class from global scope
        const ModuleClass = window[moduleConfig.className];
        if (!ModuleClass) {
            throw new Error(`Module class ${moduleConfig.className} not found in global scope`);
        }

        // Create module instance
        const moduleInstance = new ModuleClass(uiManager, moduleConfig.options);
        
        // Register with UIManager
        if (uiManager && typeof uiManager.registerModule === 'function') {
            uiManager.registerModule(moduleName, moduleInstance);
        }

        // Auto-initialize if configured
        if (moduleConfig.autoInit && moduleInstance.init) {
            moduleInstance.init();
        }

        console.log(`🔧 Initialized module: ${moduleName}`);
        return moduleInstance;
    }

    /**
     * Resolve dependency order using topological sort
     * @param {Array} moduleNames - Names of modules to sort
     */
    resolveDependencyOrder(moduleNames) {
        const visited = new Set();
        const visiting = new Set();
        const result = [];

        const visit = (moduleName) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected involving module: ${moduleName}`);
            }
            
            if (visited.has(moduleName)) {
                return;
            }

            visiting.add(moduleName);

            // Visit dependencies first
            const dependencies = this.dependencyGraph.get(moduleName) || [];
            for (const dep of dependencies) {
                if (moduleNames.includes(dep)) {
                    visit(dep);
                }
            }

            visiting.delete(moduleName);
            visited.add(moduleName);
            result.push(moduleName);
        };

        // Sort by priority first, then apply topological sort
        const sortedByPriority = moduleNames.slice().sort((a, b) => {
            const priorityA = this.modules.get(a)?.priority || 0;
            const priorityB = this.modules.get(b)?.priority || 0;
            return priorityB - priorityA; // Higher priority first
        });

        for (const moduleName of sortedByPriority) {
            visit(moduleName);
        }

        return result;
    }

    /**
     * Check if a module is loaded
     * @param {string} moduleName - Name of the module
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Check if all registered modules are loaded
     */
    areAllModulesLoaded() {
        const registeredModules = Array.from(this.modules.keys());
        return registeredModules.every(name => this.loadedModules.has(name));
    }

    /**
     * Get loading progress information
     */
    getLoadingProgress() {
        return {
            ...this.loadingStatus,
            percentage: this.loadingStatus.total > 0 
                ? Math.round((this.loadingStatus.loaded / this.loadingStatus.total) * 100)
                : 0
        };
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Event callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        return this;
    }

    /**
     * Create a default module configuration for the RPG game
     */
    static createDefaultConfiguration() {
        return {
            'UIHelpers': {
                path: 'js/ui/UIHelpers.js',
                className: 'UIHelpers',
                dependencies: [],
                priority: 100, // Load first
                autoInit: true
            },
            'MenuUI': {
                path: 'js/ui/MenuUI.js',
                className: 'MenuUI',
                dependencies: ['UIHelpers'],
                priority: 90
            },
            'GameWorldUI': {
                path: 'js/ui/GameWorldUI.js',
                className: 'GameWorldUI',
                dependencies: ['UIHelpers'],
                priority: 80
            },
            'CombatUI': {
                path: 'js/ui/CombatUI.js',
                className: 'CombatUI',
                dependencies: ['UIHelpers'],
                priority: 80
            },
            'MonsterUI': {
                path: 'js/ui/MonsterUI.js',
                className: 'MonsterUI',
                dependencies: ['UIHelpers'],
                priority: 70
            },
            'InventoryUI': {
                path: 'js/ui/InventoryUI.js',
                className: 'InventoryUI',
                dependencies: ['UIHelpers'],
                priority: 70
            },
            'SettingsUI': {
                path: 'js/ui/SettingsUI.js',
                className: 'SettingsUI',
                dependencies: ['UIHelpers'],
                priority: 60
            },
            'StoryUI': {
                path: 'js/ui/StoryUI.js',
                className: 'StoryUI',
                dependencies: ['UIHelpers'],
                priority: 50
            }
        };
    }

    /**
     * Fallback loading strategy for environments that don't support dynamic script loading
     */
    static createFallbackStrategy() {
        return {
            checkPreloaded: () => {
                // Check if modules were preloaded via script tags in HTML
                const requiredClasses = [
                    'UIHelpers', 'MenuUI', 'GameWorldUI', 'CombatUI',
                    'MonsterUI', 'InventoryUI', 'SettingsUI', 'StoryUI'
                ];
                
                const missing = requiredClasses.filter(className => !window[className]);
                
                if (missing.length > 0) {
                    console.warn('⚠️ Missing preloaded UI modules:', missing);
                    return false;
                }
                
                console.log('✅ All UI modules preloaded via script tags');
                return true;
            },
            
            initializeFromPreloaded: (uiManager) => {
                const loader = new UIModuleLoader();
                const config = UIModuleLoader.createDefaultConfiguration();
                
                // Register modules without loading (already loaded)
                loader.registerModules(config);
                
                // Mark only present modules as loaded
                Object.entries(config).forEach(([name, cfg]) => {
                    const cls = window[cfg.className];
                    if (cls) {
                        loader.loadedModules.add(name);
                    } else {
                        console.warn(`⚠️ Skipping preloaded init for ${name}: class ${cfg.className} not found`);
                    }
                });
                
                // Initialize modules
                loader.initializeModules(uiManager);
                
                return loader;
            }
        };
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIModuleLoader;
} else if (typeof window !== 'undefined') {
    window.UIModuleLoader = UIModuleLoader;
}