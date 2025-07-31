import svgPanZoom from 'svg-pan-zoom';
import { SvgCanvas } from './svgCanvas.js';
import { ElementFactory } from './elementFactory.js';
import { WireTool } from './wireTool.js';
import { StateStore } from './stateStore.js';
import { Palette } from './ui/palette.js';
import { SaveIndicator } from './ui/SaveIndicator.js';
import { ExportManager } from './export/ExportManager.js';
import { UIManager } from './ui/UIManager.js';
import { ComponentLibrary } from './componentLibrary/ComponentLibrary.js';
import { ComponentLibraryPanel } from './componentLibrary/ui/ComponentLibraryPanel.js';

// Import debug module in development
if (import.meta.env.DEV) {
    import('./debug/dragDebug.js').then(module => {
        console.log('Drag debugger loaded');
    });
}

class WiringDiagramApp {
    constructor() {
        this.canvas = null;
        this.elementFactory = null;
        this.wireTool = null;
        this.stateStore = null;
        this.palette = null;
        this.saveIndicator = null;
        this.exportManager = null;
        this.uiManager = null;
        this.componentLibrary = null;
        this.componentLibraryPanel = null;
        this.currentTool = 'select';
        this.panZoomInstance = null;
    }

    init() {
        // Initialize state store
        this.stateStore = new StateStore();
        
        // Initialize save indicator
        this.saveIndicator = new SaveIndicator();
        this.saveIndicator.attachToStateStore(this.stateStore);
        
        // Initialize SVG canvas
        const svgElement = document.getElementById('canvas-svg');
        this.canvas = new SvgCanvas(svgElement, this.stateStore);
        
        // Initialize pan-zoom
        this.panZoomInstance = svgPanZoom(svgElement, {
            viewportSelector: '#viewport',
            fit: true,
            contain: false,
            center: true,
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.5,
            dblClickZoomEnabled: false,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: false, // Allow mouse events to propagate to components
            panEnabled: true,
            controlIconsEnabled: false,
            onPan: () => {
                this.canvas.updateViewportBounds();
            },
            onZoom: (newZoom) => {
                this.canvas.zoomLevel = newZoom;
                this.canvas.updateViewportBounds();
            },
            beforePan: (oldPan, newPan) => {
                // Don't pan if we're dragging a component
                if (document.querySelector('.component.dragging')) {
                    return false;
                }
                return true;
            }
        });
        
        // Initialize component library
        this.componentLibrary = new ComponentLibrary(this.stateStore);
        
        // Initialize other components
        this.elementFactory = new ElementFactory(this.canvas, this.stateStore, this.panZoomInstance, this.componentLibrary);
        this.wireTool = new WireTool(this.canvas, this.stateStore);
        this.palette = new Palette(this.elementFactory);
        this.exportManager = new ExportManager(this.canvas, this.stateStore);
        
        // Initialize component library panel
        this.componentLibraryPanel = new ComponentLibraryPanel(this.componentLibrary, this.elementFactory);
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize performance monitor
        this.setupPerformanceMonitor();
        
        // Initialize viewport observer after pan-zoom is ready
        this.canvas.initializeViewportObserver();
        
        // Load any saved state
        this.stateStore.load();
        
        // Setup state store event handlers
        this.setupStateStoreHandlers();
        
        // Initial update of UI buttons
        this.updateUndoRedoButtons();
        
        // Set global reference for pan-zoom access
        window.wiringDiagramApp = this;
        
        // Initialize with select tool
        this.selectTool('select');
        
        console.log('Wiring Diagram App initialized');
    }

    setupEventListeners() {
        // Tool selection - find buttons with data-tool attribute
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                console.log('Tool button clicked:', tool);
                this.selectTool(tool);
            });
        });
        
        // Wire tool visibility
        const wireToolsPanel = document.getElementById('wire-tools');
        
        // File operation buttons
        document.getElementById('save-btn').addEventListener('click', () => this.save());
        document.getElementById('open-btn').addEventListener('click', () => this.openFile());
        document.getElementById('export-btn').addEventListener('click', () => this.showExportMenu());
        
        // Component library button
        document.getElementById('library-btn')?.addEventListener('click', () => {
            this.componentLibraryPanel.toggle();
        });
        
        // Undo/Redo buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.stateStore.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.stateStore.redo());
        
        // Update undo/redo button states
        this.stateStore.addListener((event, data) => {
            if (event === 'command-executed' || event === 'undo' || event === 'redo' || 
                event === 'state-loaded') {
                this.updateUndoRedoButtons();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectTool('select');
            } else if (e.key === 'w' && !e.ctrlKey && !e.metaKey) {
                this.selectTool('wire');
            } else if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
                this.selectTool('label');
            } else if (e.key === 'p' && e.shiftKey) {
                // Toggle performance monitor with Shift+P
                e.preventDefault();
                this.togglePerformanceMonitor();
            }
        });
    }
    
    setupPerformanceMonitor() {
        const perfMonitor = document.getElementById('performance-monitor');
        const svgElement = document.getElementById('canvas-svg');
        
        // Listen for performance updates from canvas
        svgElement.addEventListener('performance-update', (e) => {
            const stats = e.detail;
            
            document.getElementById('perf-fps').textContent = stats.fps;
            document.getElementById('perf-render').textContent = stats.renderTime.toFixed(2) + 'ms';
            document.getElementById('perf-visible').textContent = stats.visibleCount;
            document.getElementById('perf-total').textContent = stats.totalCount;
            
            const culledPercent = stats.totalCount > 0 
                ? ((1 - stats.visibleCount / stats.totalCount) * 100).toFixed(1)
                : 0;
            document.getElementById('perf-culled').textContent = culledPercent + '%';
        });
        
        // Enable performance monitor by default in development
        perfMonitor.style.display = 'block';
    }
    
    togglePerformanceMonitor() {
        const perfMonitor = document.getElementById('performance-monitor');
        perfMonitor.style.display = perfMonitor.style.display === 'none' ? 'block' : 'none';
    }

    selectTool(toolName) {
        console.log('Selecting tool:', toolName);
        this.currentTool = toolName;
        
        // Update canvas mode
        this.canvas.setMode(toolName);
        
        // Enable/disable pan based on tool
        // Note: Wire tool handles its own pan enable/disable during drag operations
        if (toolName === 'wire') {
            // Don't disable pan here - let the wire tool handle it on mousedown
        } else {
            // Always ensure pan is enabled for non-wire tools
            this.panZoomInstance.enablePan();
        }
        
        // Update UI button states
        document.querySelectorAll('[data-tool]').forEach(btn => {
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
        
        // UI updates are handled by UIManager
    }

    save() {
        this.stateStore.save();
        console.log('Project saved');
    }
    
    setupStateStoreHandlers() {
        // Handle open file request
        this.stateStore.addListener((event, data) => {
            if (event === 'open-requested') {
                this.openFile();
            } else if (event === 'export-menu-requested') {
                this.showExportMenu();
            }
        });
    }
    
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.wdz';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.stateStore.importFromFile(file);
            }
        };
        
        input.click();
    }
    
    async showExportMenu() {
        // Show the new comprehensive export dialog
        await this.exportManager.showExportDialog();
    }
    
    
    updateUndoRedoButtons() {
        const historyInfo = this.stateStore.getHistoryInfo();
        
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        undoBtn.disabled = !historyInfo.canUndo;
        undoBtn.style.opacity = historyInfo.canUndo ? '1' : '0.5';
        undoBtn.title = historyInfo.canUndo 
            ? `Undo: ${historyInfo.undoDescription} (Ctrl+Z)` 
            : 'Nothing to undo (Ctrl+Z)';
        
        redoBtn.disabled = !historyInfo.canRedo;
        redoBtn.style.opacity = historyInfo.canRedo ? '1' : '0.5';
        redoBtn.title = historyInfo.canRedo 
            ? `Redo: ${historyInfo.redoDescription} (Ctrl+Y)` 
            : 'Nothing to redo (Ctrl+Y)';
    }
    
    setupComponentLibraryHandlers() {
        // Handle component use from library
        document.addEventListener('component-use', (event) => {
            const { template, instance } = event.detail;
            
            // Get mouse position for placement
            const rect = this.canvas.svg.getBoundingClientRect();
            const x = rect.width / 2;
            const y = rect.height / 2;
            
            // Create element from template
            if (template) {
                this.elementFactory.createFromTemplate(template, x, y);
            }
        });
        
        // Handle canvas selection for component creation
        document.addEventListener('get-canvas-selection', () => {
            const selectedElements = this.canvas.getSelectedElements();
            
            if (selectedElements.length > 0) {
                const event = new CustomEvent('canvas-selection-response', {
                    detail: {
                        elements: selectedElements,
                        bounds: this.canvas.getSelectionBounds(selectedElements)
                    }
                });
                document.dispatchEvent(event);
            }
        });
        
        // Handle component creation prompt
        document.addEventListener('prompt-save-component', (event) => {
            const { elements, suggestedName, metadata, libraryId } = event.detail;
            
            // Show dialog to create component from selection
            this.showCreateComponentDialog(elements, suggestedName, metadata, libraryId);
        });
        
        // Handle drag and drop from library
        this.canvas.svg.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.canvas.svg.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const componentData = e.dataTransfer.getData('application/x-component');
            if (componentData) {
                try {
                    const { componentId, component } = JSON.parse(componentData);
                    const template = this.componentLibrary.findComponent(componentId)?.component;
                    
                    if (template) {
                        const point = this.canvas.getMousePosition(e);
                        this.elementFactory.createFromTemplate(template, point.x, point.y);
                    }
                } catch (error) {
                    console.error('Failed to handle component drop:', error);
                }
            }
        });
    }
    
    showCreateComponentDialog(elements, suggestedName, metadata, libraryId) {
        // TODO: Implement dialog to create custom component from selected elements
        console.log('Create component from selection:', elements);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WiringDiagramApp();
    app.init();
    
    // Make app globally available for debugging
    window.wiringApp = app;
});