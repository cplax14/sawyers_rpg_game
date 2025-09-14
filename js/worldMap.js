/**
 * World Map System
 * Handles world map rendering and area interactions
 */

class WorldMapSystem {
    constructor(game) {
        this.game = game;
        this.currentArea = 'village';
        this.visitedAreas = new Set(['village']);
        this.mapContainer = null;
        this.initialized = false;
    }
    
    init() {
        this.mapContainer = document.getElementById('world-map');
        if (!this.mapContainer) {
            console.warn('World map container not found');
            return;
        }
        
        this.initialized = true;
        console.log('✅ WorldMapSystem initialized');
    }
    
    renderMap() {
        if (!this.initialized || !window.AreaData) return;
        
        // Basic map rendering logic
        this.mapContainer.innerHTML = '';
        
        Object.keys(window.AreaData.areas).forEach(areaId => {
            const area = window.AreaData.areas[areaId];
            const areaElement = document.createElement('div');
            areaElement.className = 'map-area';
            areaElement.dataset.area = areaId;
            areaElement.innerHTML = `
                <div class="area-icon">${area.icon || '🏔️'}</div>
                <div class="area-name">${area.name}</div>
            `;
            
            if (this.currentArea === areaId) {
                areaElement.classList.add('current');
            }
            
            if (this.visitedAreas.has(areaId)) {
                areaElement.classList.add('visited');
            }
            
            this.mapContainer.appendChild(areaElement);
        });
    }
    
    travelToArea(areaId) {
        if (!window.AreaData?.areas[areaId]) {
            console.warn('Area not found:', areaId);
            return false;
        }
        
        this.currentArea = areaId;
        this.visitedAreas.add(areaId);
        this.renderMap();
        
        // Update game state
        if (this.game.gameState) {
            this.game.gameState.currentArea = areaId;
        }
        
        return true;
    }
    
    getCurrentArea() {
        return window.AreaData?.areas[this.currentArea] || null;
    }
    
    getVisitedAreas() {
        return Array.from(this.visitedAreas);
    }
}

// Make it available globally
window.WorldMapSystem = WorldMapSystem;