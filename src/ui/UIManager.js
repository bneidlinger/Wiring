/**
 * UIManager - Handles all UI interactions, accessibility, and user experience enhancements
 */
export class UIManager {
    constructor(app) {
        this.app = app;
        this.theme = 'light';
        this.sidebarCollapsed = false;
        this.activePanel = null;
        this.tooltipTimeout = null;
        this.contextMenuOpen = false;
        
        // Focus trap management
        this.focusTrapElements = new Map();
        this.lastFocusedElement = null;
        
        // Initialize UI components
        this.init();
    }
    
    init() {
        // Load saved theme preference
        this.loadTheme();
        
        // Initialize all UI components
        this.initializeToolbar();
        this.initializeSidebar();
        this.initializePanels();
        this.initializeTooltips();
        this.initializeContextMenu();
        this.initializeKeyboardShortcuts();
        this.initializeAccessibility();
        this.initializeStatusBar();
        
        // Set up resize observer for responsive behavior
        this.setupResizeObserver();
        
        // Initialize component search
        this.initializeComponentSearch();
    }
    
    // Theme management
    loadTheme() {
        const savedTheme = localStorage.getItem('wiringDiagramTheme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('wiringDiagramTheme', theme);
        
        // Update theme icon
        const themeIcon = document.getElementById('theme-icon');
        if (theme === 'dark') {
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        } else {
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
        }
        
        // Announce theme change to screen readers
        this.announceToScreenReader(`Theme changed to ${theme} mode`);
    }
    
    // Toolbar initialization
    initializeToolbar() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.setTheme(this.theme === 'light' ? 'dark' : 'light');
        });
        
        // Tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.currentTarget.dataset.tool);
            });
        });
        
        // File operations
        document.getElementById('new-btn').addEventListener('click', () => this.newDiagram());
        
        // Edit operations
        document.getElementById('cut-btn').addEventListener('click', () => this.cut());
        document.getElementById('copy-btn').addEventListener('click', () => this.copy());
        document.getElementById('paste-btn').addEventListener('click', () => this.paste());
        
        // View controls
        document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit-btn').addEventListener('click', () => this.zoomFit());
        
        // Shortcuts button
        document.getElementById('shortcuts-btn').addEventListener('click', () => {
            this.showPanel('shortcuts-panel');
        });
    }
    
    // Sidebar management
    initializeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Category collapse/expand
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                this.toggleCategory(header.parentElement);
            });
            
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleCategory(header.parentElement);
                }
            });
        });
        
        // Component drag and drop
        this.initializeComponentDragDrop();
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const toggleIcon = toggleBtn.querySelector('.icon');
        
        this.sidebarCollapsed = !this.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
        
        // Update toggle button
        toggleBtn.setAttribute('aria-expanded', !this.sidebarCollapsed);
        toggleIcon.innerHTML = this.sidebarCollapsed 
            ? '<path d="M9 18l6-6-6-6"/>' 
            : '<path d="M15 18l-6-6 6-6"/>';
        
        // Announce to screen readers
        this.announceToScreenReader(`Sidebar ${this.sidebarCollapsed ? 'collapsed' : 'expanded'}`);
    }
    
    toggleCategory(category) {
        const isCollapsed = category.classList.contains('category-collapsed');
        category.classList.toggle('category-collapsed');
        
        const header = category.querySelector('.category-header');
        header.setAttribute('aria-expanded', isCollapsed);
        
        // Animate the grid
        const grid = category.querySelector('.component-grid');
        if (isCollapsed) {
            grid.style.display = 'grid';
            // Force reflow
            grid.offsetHeight;
            grid.style.opacity = '1';
        } else {
            grid.style.opacity = '0';
            setTimeout(() => {
                grid.style.display = 'none';
            }, 200);
        }
    }
    
    // Component search
    initializeComponentSearch() {
        const searchInput = document.getElementById('component-search');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterComponents(e.target.value);
            }, 200);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.filterComponents('');
                e.target.blur();
            }
        });
    }
    
    filterComponents(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const components = document.querySelectorAll('.component-item');
        const categories = document.querySelectorAll('.component-category');
        
        if (!normalizedQuery) {
            // Show all components
            components.forEach(comp => comp.style.display = '');
            categories.forEach(cat => cat.style.display = '');
            return;
        }
        
        // Filter components
        categories.forEach(category => {
            let hasVisibleComponents = false;
            
            category.querySelectorAll('.component-item').forEach(comp => {
                const name = comp.querySelector('.component-name').textContent.toLowerCase();
                const type = comp.dataset.type.toLowerCase();
                const matches = name.includes(normalizedQuery) || type.includes(normalizedQuery);
                
                comp.style.display = matches ? '' : 'none';
                if (matches) hasVisibleComponents = true;
            });
            
            // Hide category if no components match
            category.style.display = hasVisibleComponents ? '' : 'none';
            
            // Expand category if it has matches and is collapsed
            if (hasVisibleComponents && category.classList.contains('category-collapsed')) {
                this.toggleCategory(category);
            }
        });
        
        // Announce results to screen readers
        const visibleCount = Array.from(components).filter(c => c.style.display !== 'none').length;
        this.announceToScreenReader(`${visibleCount} components found`);
    }
    
    // Component drag and drop
    initializeComponentDragDrop() {
        const components = document.querySelectorAll('.component-item');
        
        components.forEach(comp => {
            // Keyboard support for drag and drop
            comp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.startComponentPlacement(comp.dataset.type);
                }
            });
            
            // Mouse hover preview
            comp.addEventListener('mouseenter', (e) => {
                this.showComponentPreview(e.currentTarget);
            });
            
            comp.addEventListener('mouseleave', () => {
                this.hideComponentPreview();
            });
        });
    }
    
    showComponentPreview(component) {
        // TODO: Implement component preview on hover
        const tooltip = document.getElementById('tooltip');
        const rect = component.getBoundingClientRect();
        
        tooltip.textContent = `${component.querySelector('.component-name').textContent} - Click to place or drag to canvas`;
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.classList.add('active');
    }
    
    hideComponentPreview() {
        document.getElementById('tooltip').classList.remove('active');
    }
    
    // Panel management
    initializePanels() {
        // Close buttons
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.floating-panel');
                this.hidePanel(panel.id);
            });
        });
        
        // Make panels draggable
        this.initializeDraggablePanels();
        
        // Wire settings panel
        this.initializeWireSettings();
    }
    
    initializeDraggablePanels() {
        document.querySelectorAll('.floating-panel').forEach(panel => {
            const header = panel.querySelector('.panel-header');
            
            // Skip panels without headers (like performance monitor)
            if (!header) return;
            
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;
            
            const dragStart = (e) => {
                if (e.target.classList.contains('panel-close')) return;
                
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                
                if (e.target === header || header.contains(e.target)) {
                    isDragging = true;
                    panel.style.transition = 'none';
                }
            };
            
            const dragEnd = () => {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                panel.style.transition = '';
            };
            
            const drag = (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            };
            
            header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);
        });
    }
    
    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        // Hide other panels if needed
        if (this.activePanel && this.activePanel !== panel) {
            this.hidePanel(this.activePanel.id);
        }
        
        // Show panel
        panel.classList.add('active');
        this.activePanel = panel;
        
        // Focus management
        this.lastFocusedElement = document.activeElement;
        this.createFocusTrap(panel);
        
        // Focus first focusable element
        const firstFocusable = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Add escape key handler
        this.addEscapeHandler(panel);
    }
    
    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        panel.classList.remove('active');
        
        if (this.activePanel === panel) {
            this.activePanel = null;
        }
        
        // Restore focus
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
        
        // Remove focus trap
        this.removeFocusTrap(panel);
    }
    
    // Wire settings
    initializeWireSettings() {
        const wireColorSelect = document.getElementById('wire-color');
        const wireGaugeSelect = document.getElementById('wire-gauge');
        const autoRouteCheckbox = document.getElementById('auto-route');
        const bundlingCheckbox = document.getElementById('wire-bundling');
        
        // Apply settings when changed
        wireColorSelect.addEventListener('change', (e) => {
            if (this.app.wireTool) {
                this.app.wireTool.setColor(e.target.value);
            }
        });
        
        wireGaugeSelect.addEventListener('change', (e) => {
            if (this.app.wireTool) {
                this.app.wireTool.setGauge(e.target.value);
            }
        });
        
        autoRouteCheckbox.addEventListener('change', (e) => {
            if (this.app.wireTool) {
                this.app.wireTool.setAutoRoute(e.target.checked);
            }
        });
        
        bundlingCheckbox.addEventListener('change', (e) => {
            if (this.app.wireTool) {
                this.app.wireTool.setBundling(e.target.checked);
            }
        });
    }
    
    // Tooltips
    initializeTooltips() {
        const tooltip = document.getElementById('tooltip');
        
        // Add tooltips to all elements with title attribute
        document.querySelectorAll('[title]').forEach(element => {
            const originalTitle = element.getAttribute('title');
            element.removeAttribute('title'); // Prevent browser tooltip
            
            element.addEventListener('mouseenter', (e) => {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = setTimeout(() => {
                    this.showTooltip(e.target, originalTitle);
                }, 500);
            });
            
            element.addEventListener('mouseleave', () => {
                clearTimeout(this.tooltipTimeout);
                this.hideTooltip();
            });
            
            element.addEventListener('focus', (e) => {
                this.showTooltip(e.target, originalTitle);
            });
            
            element.addEventListener('blur', () => {
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(element, text) {
        const tooltip = document.getElementById('tooltip');
        const rect = element.getBoundingClientRect();
        
        tooltip.textContent = text;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 8}px`;
        tooltip.classList.add('active');
        
        // Ensure tooltip is within viewport
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
        }
        if (tooltipRect.left < 0) {
            tooltip.style.left = '10px';
        }
    }
    
    hideTooltip() {
        document.getElementById('tooltip').classList.remove('active');
    }
    
    // Context menu
    initializeContextMenu() {
        const canvas = document.getElementById('canvas-svg');
        const contextMenu = document.getElementById('context-menu');
        
        // Right-click handler
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // Context menu items
        contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleContextMenuAction(e.currentTarget.textContent.trim());
                this.hideContextMenu();
            });
        });
    }
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('context-menu');
        
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.add('active');
        this.contextMenuOpen = true;
        
        // Ensure menu is within viewport
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
        
        // Focus first item
        const firstItem = contextMenu.querySelector('.context-menu-item');
        if (firstItem) {
            firstItem.focus();
        }
    }
    
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.classList.remove('active');
        this.contextMenuOpen = false;
    }
    
    handleContextMenuAction(action) {
        switch (action) {
            case 'Add Component':
                // Show component palette or quick add menu
                break;
            case 'Add Wire':
                this.selectTool('wire');
                break;
            case 'Copy':
                this.copy();
                break;
            case 'Paste':
                this.paste();
                break;
            case 'Delete':
                this.deleteSelected();
                break;
        }
    }
    
    // Keyboard shortcuts
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when typing in inputs
            if (e.target.matches('input, textarea, select')) {
                return;
            }
            
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.newDiagram();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.app.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        this.app.save();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.app.showExportMenu();
                        break;
                    case 'z':
                        if (!e.shiftKey) {
                            e.preventDefault();
                            this.app.stateStore.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.app.stateStore.redo();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.cut();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copy();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.toggleSidebar();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.zoomFit();
                        break;
                }
            } else {
                // Tool shortcuts
                switch (e.key.toLowerCase()) {
                    case 'v':
                        this.selectTool('select');
                        break;
                    case 'w':
                        this.selectTool('wire');
                        break;
                    case 't':
                        this.selectTool('label');
                        break;
                    case 'p':
                        this.selectTool('terminal');
                        break;
                    case 'delete':
                    case 'backspace':
                        e.preventDefault();
                        this.deleteSelected();
                        break;
                    case '?':
                        e.preventDefault();
                        this.showPanel('shortcuts-panel');
                        break;
                    case 'escape':
                        if (this.activePanel) {
                            this.hidePanel(this.activePanel.id);
                        } else if (this.contextMenuOpen) {
                            this.hideContextMenu();
                        } else {
                            this.selectTool('select');
                        }
                        break;
                }
            }
        });
    }
    
    // Tool selection
    selectTool(toolName) {
        // Update UI
        document.querySelectorAll('[data-tool]').forEach(btn => {
            const isActive = btn.dataset.tool === toolName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
        
        // Show/hide wire settings
        if (toolName === 'wire') {
            this.showPanel('wire-settings-panel');
        } else {
            this.hidePanel('wire-settings-panel');
        }
        
        // Update app tool
        this.app.selectTool(toolName);
        
        // Announce tool change
        this.announceToScreenReader(`${toolName} tool selected`);
    }
    
    // Edit operations
    cut() {
        this.copy();
        this.deleteSelected();
    }
    
    copy() {
        // TODO: Implement copy functionality
        console.log('Copy selected elements');
    }
    
    paste() {
        // TODO: Implement paste functionality
        console.log('Paste elements');
    }
    
    deleteSelected() {
        // TODO: Implement delete functionality
        console.log('Delete selected elements');
    }
    
    // View operations
    zoomIn() {
        if (this.app.panZoomInstance) {
            this.app.panZoomInstance.zoomIn();
            this.updateZoomLevel();
        }
    }
    
    zoomOut() {
        if (this.app.panZoomInstance) {
            this.app.panZoomInstance.zoomOut();
            this.updateZoomLevel();
        }
    }
    
    zoomFit() {
        if (this.app.panZoomInstance) {
            this.app.panZoomInstance.fit();
            this.app.panZoomInstance.center();
            this.updateZoomLevel();
        }
    }
    
    updateZoomLevel() {
        if (this.app.panZoomInstance) {
            const zoom = Math.round(this.app.panZoomInstance.getZoom() * 100);
            document.getElementById('zoom-level').textContent = `${zoom}%`;
        }
    }
    
    // File operations
    newDiagram() {
        if (confirm('Create a new diagram? Any unsaved changes will be lost.')) {
            // TODO: Clear canvas and reset state
            console.log('Creating new diagram');
        }
    }
    
    // Status bar
    initializeStatusBar() {
        // Update component and wire counts periodically
        setInterval(() => {
            this.updateStatusBar();
        }, 1000);
    }
    
    updateStatusBar() {
        const componentCount = document.querySelectorAll('#components > *').length;
        const wireCount = document.querySelectorAll('#wires > *').length;
        
        document.getElementById('component-count').textContent = componentCount;
        document.getElementById('wire-count').textContent = wireCount;
    }
    
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('save-status');
        saveStatus.textContent = status;
    }
    
    // Accessibility
    initializeAccessibility() {
        // Set up focus trap for modals
        this.setupFocusTraps();
        
        // Arrow key navigation for component palette
        this.setupArrowKeyNavigation();
        
        // Announce important changes to screen readers
        this.setupLiveRegions();
    }
    
    setupFocusTraps() {
        // Focus trap is created dynamically when panels are shown
    }
    
    createFocusTrap(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        };
        
        container.addEventListener('keydown', trapFocus);
        this.focusTrapElements.set(container, trapFocus);
    }
    
    removeFocusTrap(container) {
        const trapHandler = this.focusTrapElements.get(container);
        if (trapHandler) {
            container.removeEventListener('keydown', trapHandler);
            this.focusTrapElements.delete(container);
        }
    }
    
    addEscapeHandler(container) {
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hidePanel(container.id);
            }
        };
        container.addEventListener('keydown', escapeHandler);
    }
    
    setupArrowKeyNavigation() {
        const palette = document.querySelector('.component-palette');
        
        palette.addEventListener('keydown', (e) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                return;
            }
            
            e.preventDefault();
            
            const focusedItem = document.activeElement;
            if (!focusedItem.classList.contains('component-item')) return;
            
            const grid = focusedItem.parentElement;
            const items = Array.from(grid.querySelectorAll('.component-item:not([style*="display: none"])'));
            const currentIndex = items.indexOf(focusedItem);
            
            let newIndex;
            const columns = 2; // Grid has 2 columns
            
            switch (e.key) {
                case 'ArrowUp':
                    newIndex = currentIndex - columns;
                    break;
                case 'ArrowDown':
                    newIndex = currentIndex + columns;
                    break;
                case 'ArrowLeft':
                    newIndex = currentIndex - 1;
                    break;
                case 'ArrowRight':
                    newIndex = currentIndex + 1;
                    break;
            }
            
            if (newIndex >= 0 && newIndex < items.length) {
                items[newIndex].focus();
            }
        });
    }
    
    setupLiveRegions() {
        // Live region is already in HTML
    }
    
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live');
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    // Responsive behavior
    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        
        resizeObserver.observe(document.body);
    }
    
    handleResize() {
        const width = window.innerWidth;
        
        // Auto-collapse sidebar on mobile
        if (width < 768 && !this.sidebarCollapsed) {
            this.toggleSidebar();
        }
        
        // Reposition floating panels if needed
        document.querySelectorAll('.floating-panel.active').forEach(panel => {
            const rect = panel.getBoundingClientRect();
            if (rect.right > width) {
                panel.style.left = `${width - rect.width - 20}px`;
            }
            if (rect.bottom > window.innerHeight) {
                panel.style.top = `${window.innerHeight - rect.height - 20}px`;
            }
        });
    }
}