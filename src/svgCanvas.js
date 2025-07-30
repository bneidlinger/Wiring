export class SvgCanvas {
    constructor(svgElement, stateStore) {
        this.svg = svgElement;
        this.stateStore = stateStore;
        this.viewport = this.svg.getElementById('viewport');
        this.componentsGroup = this.svg.getElementById('components');
        this.wiresGroup = this.svg.getElementById('wires');
        this.labelsGroup = this.svg.getElementById('labels');
        
        this.mode = 'select';
        this.selectedElement = null;
        this.gridSize = 50;
        
        // Performance optimization properties
        this.visibleBounds = { x: 0, y: 0, width: 0, height: 0 };
        this.renderQueue = new Set();
        this.frameId = null;
        this.lastRenderTime = 0;
        this.renderThrottle = 16; // ~60fps
        
        // Viewport culling properties
        this.viewportPadding = 100; // Extra padding for smooth scrolling
        this.elementsMap = new Map(); // Quick lookup for elements
        this.visibleElements = new Set();
        this.hiddenElements = new Set();
        
        // LOD (Level of Detail) settings
        this.zoomLevel = 1;
        this.lodThresholds = {
            high: 1.5,    // Full detail
            medium: 0.5,  // Simplified rendering
            low: 0.2      // Minimal detail
        };
        
        // Performance monitoring
        this.performanceMonitor = {
            frameCount: 0,
            lastFpsUpdate: performance.now(),
            fps: 0,
            renderTime: 0,
            visibleCount: 0,
            totalCount: 0
        };
        
        // Initialize spatial index for efficient culling
        this.spatialIndex = new SpatialIndex();
        
        this.setupEventListeners();
        
        // Initialize viewport bounds after setup
        setTimeout(() => {
            this.updateViewportBounds();
        }, 100);
    }

    setupEventListeners() {
        this.svg.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.svg.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    }

    handleCanvasClick(event) {
        if (this.mode === 'wire') {
            // Wire tool will handle this
            return;
        }
        
        if (this.mode === 'add-terminal') {
            // Check if clicking on a component
            const component = event.target.closest('.component');
            if (component) {
                const mousePos = this.getMousePosition(event);
                const transform = component.transform.baseVal.getItem(0);
                const componentX = transform.matrix.e;
                const componentY = transform.matrix.f;
                
                // Calculate position relative to component
                const relX = mousePos.x - componentX;
                const relY = mousePos.y - componentY;
                
                // Add terminal through element factory
                if (window.wiringDiagramApp && window.wiringDiagramApp.elementFactory) {
                    window.wiringDiagramApp.elementFactory.addTerminalToComponent(component, relX, relY);
                }
            }
            return;
        }
        
        // Check if clicking on empty space to deselect
        if (event.target === this.svg || event.target.closest('#viewport') === this.viewport) {
            this.clearSelection();
        }
    }

    handleCanvasMouseMove(event) {
        // Used for wire drawing preview, etc.
    }

    setMode(mode) {
        this.mode = mode;
        this.clearSelection();
    }

    addComponent(component) {
        this.componentsGroup.appendChild(component);
        this.registerElement(component, 'component');
    }

    addWire(wire) {
        this.wiresGroup.appendChild(wire);
        this.registerElement(wire, 'wire');
    }

    addLabel(label) {
        this.labelsGroup.appendChild(label);
        this.registerElement(label, 'label');
    }
    
    // Register element for spatial indexing and culling
    registerElement(element, type) {
        // Generate unique ID if not present
        const id = element.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        element.id = id;
        
        // Add class if not present
        if (!element.classList.contains(type)) {
            element.classList.add(type);
        }
        
        // Add to maps and index
        this.elementsMap.set(id, element);
        const bounds = this.getElementBounds(element);
        this.spatialIndex.insert(id, bounds);
        
        // Check initial visibility
        this.queueRender(() => {
            // Temporarily always show elements to debug visibility issue
            this.visibleElements.add(id);
            this.showElement(element);
            
            /* Original culling logic - will re-enable after debugging
            const isVisible = this.boundsIntersect(bounds, this.visibleBounds);
            if (isVisible) {
                this.visibleElements.add(id);
                this.showElement(element);
            } else {
                this.hiddenElements.add(id);
                this.hideElement(element);
            }
            */
        });
    }

    removeElement(element) {
        const id = element.id;
        if (id) {
            this.elementsMap.delete(id);
            this.visibleElements.delete(id);
            this.hiddenElements.delete(id);
            this.spatialIndex.remove(id);
        }
        element.remove();
    }

    selectElement(element) {
        this.clearSelection();
        this.selectedElement = element;
        element.classList.add('selected');
        
        // Add selection handles
        this.addSelectionHandles(element);
    }

    clearSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.removeSelectionHandles();
            this.selectedElement = null;
        }
    }
    
    getSelectedElements() {
        return this.selectedElement ? [this.selectedElement] : [];
    }
    
    getSelectionBounds(elements = null) {
        const els = elements || this.getSelectedElements();
        if (els.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        els.forEach(el => {
            const bbox = el.getBBox();
            const transform = el.getAttribute('transform');
            let x = bbox.x, y = bbox.y;
            
            // Parse transform if exists
            if (transform) {
                const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
                if (match) {
                    x = parseFloat(match[1]);
                    y = parseFloat(match[2]);
                }
            }
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + bbox.width);
            maxY = Math.max(maxY, y + bbox.height);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    /**
     * Get currently selected elements for export
     */
    getSelectedElements() {
        const selected = [];
        this.componentsGroup.querySelectorAll('.component.selected').forEach(el => {
            selected.push(el);
        });
        this.wiresGroup.querySelectorAll('.wire.selected').forEach(el => {
            selected.push(el);
        });
        return selected;
    }
    
    /**
     * Get current viewport bounds
     */
    getViewportBounds() {
        // Get the current pan and zoom from svg-pan-zoom if available
        const panZoom = window.wiringDiagramApp?.panZoomInstance;
        if (panZoom) {
            const sizes = panZoom.getSizes();
            const pan = panZoom.getPan();
            const zoom = panZoom.getZoom();
            
            return {
                x: -pan.x / zoom,
                y: -pan.y / zoom,
                width: sizes.width / zoom,
                height: sizes.height / zoom
            };
        }
        
        // Fallback to visible bounds
        return { ...this.visibleBounds };
    }
    
    /**
     * Get bounding box for all content
     */
    getContentBounds() {
        const bbox = this.viewport.getBBox();
        return {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height
        };
    }

    addSelectionHandles(element) {
        // TODO: Implement selection handles for resizing/rotating
    }

    removeSelectionHandles() {
        // TODO: Remove selection handles
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    getMousePosition(event) {
        const pt = this.svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        
        // Transform to SVG coordinates
        const screenCTM = this.svg.getScreenCTM();
        const svgPt = pt.matrixTransform(screenCTM.inverse());
        
        return {
            x: svgPt.x,
            y: svgPt.y,
            gridX: this.snapToGrid(svgPt.x),
            gridY: this.snapToGrid(svgPt.y)
        };
    }

    clear() {
        this.componentsGroup.innerHTML = '';
        this.wiresGroup.innerHTML = '';
        this.labelsGroup.innerHTML = '';
        this.clearSelection();
        this.elementsMap.clear();
        this.visibleElements.clear();
        this.hiddenElements.clear();
        this.spatialIndex.clear();
    }
    
    // Initialize viewport observer for efficient updates
    initializeViewportObserver() {
        // Set up pan/zoom change detection
        if (window.wiringDiagramApp && window.wiringDiagramApp.panZoomInstance) {
            const pz = window.wiringDiagramApp.panZoomInstance;
            
            // Override pan/zoom handlers for viewport updates
            const originalPan = pz.pan;
            const originalZoom = pz.zoom;
            
            pz.pan = (...args) => {
                const result = originalPan.apply(pz, args);
                this.updateViewport();
                return result;
            };
            
            pz.zoom = (...args) => {
                const result = originalZoom.apply(pz, args);
                this.zoomLevel = pz.getZoom();
                this.updateViewport();
                return result;
            };
        }
        
        // Initial viewport update
        requestAnimationFrame(() => this.updateViewport());
    }
    
    // Update visible viewport bounds
    updateViewport() {
        const svgRect = this.svg.getBoundingClientRect();
        const screenCTM = this.svg.getScreenCTM();
        
        if (!screenCTM) return;
        
        const inverse = screenCTM.inverse();
        
        // Calculate viewport corners in SVG coordinates
        const topLeft = this.transformPoint(0, 0, inverse);
        const bottomRight = this.transformPoint(svgRect.width, svgRect.height, inverse);
        
        // Update visible bounds with padding
        this.visibleBounds = {
            x: topLeft.x - this.viewportPadding,
            y: topLeft.y - this.viewportPadding,
            width: (bottomRight.x - topLeft.x) + (2 * this.viewportPadding),
            height: (bottomRight.y - topLeft.y) + (2 * this.viewportPadding)
        };
        
        // Update zoom level if panZoom is available
        if (window.wiringDiagramApp && window.wiringDiagramApp.panZoomInstance) {
            this.zoomLevel = window.wiringDiagramApp.panZoomInstance.getZoom();
        }
        
        // Queue viewport culling
        this.queueRender(() => this.performViewportCulling());
    }
    
    // Transform screen coordinates to SVG coordinates
    transformPoint(x, y, matrix) {
        const pt = this.svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(matrix);
    }
    
    // Perform viewport culling
    performViewportCulling() {
        const startTime = performance.now();
        
        // Get potentially visible elements from spatial index
        const candidates = this.spatialIndex.query(this.visibleBounds);
        
        // Update visibility for each candidate
        candidates.forEach(elementId => {
            const element = this.elementsMap.get(elementId);
            if (!element) return;
            
            const bounds = this.getElementBounds(element);
            const isVisible = this.boundsIntersect(bounds, this.visibleBounds);
            
            if (isVisible && this.hiddenElements.has(elementId)) {
                this.showElement(element);
                this.hiddenElements.delete(elementId);
                this.visibleElements.add(elementId);
            } else if (!isVisible && this.visibleElements.has(elementId)) {
                this.hideElement(element);
                this.visibleElements.delete(elementId);
                this.hiddenElements.add(elementId);
            }
        });
        
        // Update performance stats
        this.performanceMonitor.renderTime = performance.now() - startTime;
        this.performanceMonitor.visibleCount = this.visibleElements.size;
        this.performanceMonitor.totalCount = this.elementsMap.size;
    }
    
    // Check if two bounds intersect
    boundsIntersect(a, b) {
        return !(a.x + a.width < b.x || 
                b.x + b.width < a.x || 
                a.y + a.height < b.y || 
                b.y + b.height < a.y);
    }
    
    // Update viewport bounds based on current pan/zoom
    updateViewportBounds() {
        const rect = this.svg.getBoundingClientRect();
        const pt1 = this.getMousePosition({ clientX: rect.left, clientY: rect.top });
        const pt2 = this.getMousePosition({ clientX: rect.right, clientY: rect.bottom });
        
        this.visibleBounds = {
            x: Math.min(pt1.x, pt2.x) - this.viewportPadding,
            y: Math.min(pt1.y, pt2.y) - this.viewportPadding,
            width: Math.abs(pt2.x - pt1.x) + (this.viewportPadding * 2),
            height: Math.abs(pt2.y - pt1.y) + (this.viewportPadding * 2)
        };
        
        // Trigger viewport culling after bounds update
        this.queueRender(() => this.performViewportCulling());
    }
    
    // Get element bounds
    getElementBounds(element) {
        const bbox = element.getBBox();
        const transform = element.getCTM();
        
        if (transform) {
            // Apply transformation to bounds
            const topLeft = this.transformPoint(bbox.x, bbox.y, transform);
            const bottomRight = this.transformPoint(bbox.x + bbox.width, bbox.y + bbox.height, transform);
            
            return {
                x: Math.min(topLeft.x, bottomRight.x),
                y: Math.min(topLeft.y, bottomRight.y),
                width: Math.abs(bottomRight.x - topLeft.x),
                height: Math.abs(bottomRight.y - topLeft.y)
            };
        }
        
        return bbox;
    }
    
    // Show element with LOD consideration
    showElement(element) {
        const lod = this.getCurrentLOD();
        
        if (element.classList.contains('component')) {
            this.applyComponentLOD(element, lod);
        } else if (element.classList.contains('wire')) {
            this.applyWireLOD(element, lod);
        } else if (element.classList.contains('label')) {
            this.applyLabelLOD(element, lod);
        }
        
        element.style.display = '';
    }
    
    // Hide element
    hideElement(element) {
        element.style.display = 'none';
    }
    
    // Get current LOD based on zoom level
    getCurrentLOD() {
        if (this.zoomLevel >= this.lodThresholds.high) return 'high';
        if (this.zoomLevel >= this.lodThresholds.medium) return 'medium';
        return 'low';
    }
    
    // Apply LOD to component
    applyComponentLOD(component, lod) {
        const terminals = component.querySelectorAll('.terminal');
        const labels = component.querySelectorAll('text');
        
        switch (lod) {
            case 'high':
                // Show all details
                terminals.forEach(t => t.style.display = '');
                labels.forEach(l => l.style.display = '');
                break;
            case 'medium':
                // Show terminals but hide small text
                terminals.forEach(t => t.style.display = '');
                labels.forEach(l => {
                    const fontSize = parseFloat(window.getComputedStyle(l).fontSize);
                    l.style.display = fontSize < 10 ? 'none' : '';
                });
                break;
            case 'low':
                // Hide terminals and text
                terminals.forEach(t => t.style.display = 'none');
                labels.forEach(l => l.style.display = 'none');
                break;
        }
    }
    
    // Apply LOD to wire
    applyWireLOD(wire, lod) {
        switch (lod) {
            case 'high':
                wire.style.strokeWidth = '';
                break;
            case 'medium':
                wire.style.strokeWidth = '2';
                break;
            case 'low':
                wire.style.strokeWidth = '1';
                break;
        }
    }
    
    // Apply LOD to label
    applyLabelLOD(label, lod) {
        switch (lod) {
            case 'high':
                label.style.display = '';
                break;
            case 'medium':
            case 'low':
                label.style.display = 'none';
                break;
        }
    }
    
    // Queue render operation
    queueRender(callback) {
        this.renderQueue.add(callback);
        
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(() => this.processRenderQueue());
        }
    }
    
    // Process render queue
    processRenderQueue() {
        const now = performance.now();
        
        // Throttle rendering
        if (now - this.lastRenderTime < this.renderThrottle) {
            this.frameId = requestAnimationFrame(() => this.processRenderQueue());
            return;
        }
        
        // Process all queued operations
        this.renderQueue.forEach(callback => callback());
        this.renderQueue.clear();
        
        this.lastRenderTime = now;
        this.frameId = null;
        
        // Update FPS counter
        this.updatePerformanceMonitor();
    }
    
    // Update performance monitor
    updatePerformanceMonitor() {
        this.performanceMonitor.frameCount++;
        
        const now = performance.now();
        const elapsed = now - this.performanceMonitor.lastFpsUpdate;
        
        if (elapsed >= 1000) {
            this.performanceMonitor.fps = Math.round((this.performanceMonitor.frameCount * 1000) / elapsed);
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastFpsUpdate = now;
            
            // Dispatch performance event
            this.svg.dispatchEvent(new CustomEvent('performance-update', {
                detail: this.performanceMonitor
            }));
        }
    }
    
    
    // Update element position in spatial index
    updateElementPosition(element) {
        const id = element.id;
        if (!id || !this.elementsMap.has(id)) return;
        
        const bounds = this.getElementBounds(element);
        this.spatialIndex.update(id, bounds);
        
        // Check if visibility changed
        this.queueRender(() => {
            const isVisible = this.boundsIntersect(bounds, this.visibleBounds);
            const wasVisible = this.visibleElements.has(id);
            
            if (isVisible && !wasVisible) {
                this.hiddenElements.delete(id);
                this.visibleElements.add(id);
                this.showElement(element);
            } else if (!isVisible && wasVisible) {
                this.visibleElements.delete(id);
                this.hiddenElements.add(id);
                this.hideElement(element);
            }
        });
    }
}

// Simple spatial index implementation using a grid
class SpatialIndex {
    constructor(cellSize = 500) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.elementBounds = new Map();
    }
    
    insert(id, bounds) {
        this.elementBounds.set(id, bounds);
        const cells = this.getCellsForBounds(bounds);
        
        cells.forEach(cell => {
            if (!this.grid.has(cell)) {
                this.grid.set(cell, new Set());
            }
            this.grid.get(cell).add(id);
        });
    }
    
    remove(id) {
        const bounds = this.elementBounds.get(id);
        if (!bounds) return;
        
        const cells = this.getCellsForBounds(bounds);
        cells.forEach(cell => {
            const cellSet = this.grid.get(cell);
            if (cellSet) {
                cellSet.delete(id);
                if (cellSet.size === 0) {
                    this.grid.delete(cell);
                }
            }
        });
        
        this.elementBounds.delete(id);
    }
    
    update(id, newBounds) {
        this.remove(id);
        this.insert(id, newBounds);
    }
    
    query(bounds) {
        const results = new Set();
        const cells = this.getCellsForBounds(bounds);
        
        cells.forEach(cell => {
            const cellSet = this.grid.get(cell);
            if (cellSet) {
                cellSet.forEach(id => results.add(id));
            }
        });
        
        return Array.from(results);
    }
    
    clear() {
        this.grid.clear();
        this.elementBounds.clear();
    }
    
    getCellsForBounds(bounds) {
        const cells = [];
        const startX = Math.floor(bounds.x / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                cells.push(`${x},${y}`);
            }
        }
        
        return cells;
    }
}