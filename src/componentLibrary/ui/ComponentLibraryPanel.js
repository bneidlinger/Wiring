import { ComponentSearch } from './ComponentSearch.js';
import { ComponentTree } from './ComponentTree.js';
import { ComponentEditor } from './ComponentEditor.js';
import { ComponentPreview } from './ComponentPreview.js';

/**
 * ComponentLibraryPanel - Main UI panel for component library management
 */
export class ComponentLibraryPanel {
    constructor(componentLibrary, elementFactory) {
        this.componentLibrary = componentLibrary;
        this.elementFactory = elementFactory;
        this.container = null;
        this.isVisible = false;
        
        // Sub-components
        this.search = null;
        this.tree = null;
        this.editor = null;
        this.preview = null;
        
        // State
        this.selectedComponent = null;
        this.selectedLibrary = null;
        this.editMode = false;
        
        // Initialize
        this.init();
    }

    init() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'component-library-panel';
        this.container.innerHTML = this.getTemplate();
        
        // Initialize sub-components
        this.initializeSubComponents();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add to DOM
        document.body.appendChild(this.container);
        
        // Load initial data
        this.loadLibraries();
    }

    getTemplate() {
        return `
            <div class="library-panel-header">
                <h2>Component Library</h2>
                <div class="library-panel-controls">
                    <button class="btn-icon" id="library-panel-close" title="Close">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="library-panel-toolbar">
                <select id="library-selector" class="library-select">
                    <option value="">Select Library...</option>
                </select>
                <div class="toolbar-buttons">
                    <button id="btn-new-library" class="btn-secondary" title="Create New Library">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        New Library
                    </button>
                    <button id="btn-import-library" class="btn-secondary" title="Import Library">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 2v8m0 0l3-3m-3 3L5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M2 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Import
                    </button>
                    <button id="btn-export-library" class="btn-secondary" title="Export Library" disabled>
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 14V6m0 0l3 3m-3-3L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M2 2h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Export
                    </button>
                </div>
            </div>
            
            <div class="library-panel-search" id="library-search-container">
                <!-- Search component will be inserted here -->
            </div>
            
            <div class="library-panel-content">
                <div class="library-sidebar">
                    <div class="sidebar-section">
                        <h3>Categories</h3>
                        <div id="library-tree-container">
                            <!-- Component tree will be inserted here -->
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>Favorites</h3>
                        <div id="library-favorites" class="favorites-list">
                            <!-- Favorite components will be listed here -->
                        </div>
                    </div>
                </div>
                
                <div class="library-main">
                    <div class="library-view-tabs">
                        <button class="tab-button active" data-tab="grid">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
                                <rect x="9" y="2" width="5" height="5" fill="currentColor"/>
                                <rect x="2" y="9" width="5" height="5" fill="currentColor"/>
                                <rect x="9" y="9" width="5" height="5" fill="currentColor"/>
                            </svg>
                            Grid View
                        </button>
                        <button class="tab-button" data-tab="list">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            List View
                        </button>
                        <button class="tab-button" data-tab="editor">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M12 2l2 2-8 8-3 1 1-3 8-8z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                            </svg>
                            Editor
                        </button>
                    </div>
                    
                    <div class="library-view-content">
                        <div id="library-grid-view" class="view-panel active">
                            <div class="component-grid" id="component-grid">
                                <!-- Component grid will be populated here -->
                            </div>
                        </div>
                        
                        <div id="library-list-view" class="view-panel">
                            <table class="component-list">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Category</th>
                                        <th>Version</th>
                                        <th>Author</th>
                                        <th>Modified</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="component-list-body">
                                    <!-- Component list will be populated here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div id="library-editor-view" class="view-panel">
                            <div id="component-editor-container">
                                <!-- Component editor will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="library-details" id="library-details">
                    <div id="component-preview-container">
                        <!-- Component preview will be inserted here -->
                    </div>
                </div>
            </div>
            
            <div class="library-panel-footer">
                <div class="footer-info">
                    <span id="library-stats">0 components in 0 categories</span>
                </div>
                <div class="footer-actions">
                    <button id="btn-create-component" class="btn-primary" disabled>
                        Create Component from Selection
                    </button>
                </div>
            </div>
        `;
    }

    initializeSubComponents() {
        // Initialize search
        this.search = new ComponentSearch(this.componentLibrary);
        const searchContainer = this.container.querySelector('#library-search-container');
        searchContainer.appendChild(this.search.getElement());
        
        // Initialize component tree
        this.tree = new ComponentTree(this.componentLibrary);
        const treeContainer = this.container.querySelector('#library-tree-container');
        treeContainer.appendChild(this.tree.getElement());
        
        // Initialize component editor
        this.editor = new ComponentEditor(this.componentLibrary);
        const editorContainer = this.container.querySelector('#component-editor-container');
        editorContainer.appendChild(this.editor.getElement());
        
        // Initialize component preview
        this.preview = new ComponentPreview(this.componentLibrary);
        const previewContainer = this.container.querySelector('#component-preview-container');
        previewContainer.appendChild(this.preview.getElement());
    }

    setupEventListeners() {
        // Close button
        this.container.querySelector('#library-panel-close').addEventListener('click', () => {
            this.hide();
        });
        
        // Library selector
        this.container.querySelector('#library-selector').addEventListener('change', (e) => {
            this.selectLibrary(e.target.value);
        });
        
        // Toolbar buttons
        this.container.querySelector('#btn-new-library').addEventListener('click', () => {
            this.showNewLibraryDialog();
        });
        
        this.container.querySelector('#btn-import-library').addEventListener('click', () => {
            this.importLibrary();
        });
        
        this.container.querySelector('#btn-export-library').addEventListener('click', () => {
            this.exportLibrary();
        });
        
        // View tabs
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.currentTarget.dataset.tab);
            });
        });
        
        // Create component button
        this.container.querySelector('#btn-create-component').addEventListener('click', () => {
            this.createComponentFromSelection();
        });
        
        // Search events
        this.search.on('search', (results) => {
            this.displaySearchResults(results);
        });
        
        // Tree events
        this.tree.on('select', (item) => {
            this.handleTreeSelection(item);
        });
        
        this.tree.on('category-create', (parentId) => {
            this.showNewCategoryDialog(parentId);
        });
        
        // Component events
        document.addEventListener('component-select', (e) => {
            this.selectComponent(e.detail.componentId);
        });
        
        document.addEventListener('component-favorite', (e) => {
            this.toggleFavorite(e.detail.componentId);
        });
        
        document.addEventListener('component-delete', (e) => {
            this.deleteComponent(e.detail.componentId);
        });
        
        document.addEventListener('component-edit', (e) => {
            this.editComponent(e.detail.componentId);
        });
        
        document.addEventListener('component-clone', (e) => {
            this.cloneComponent(e.detail.componentId);
        });
        
        // Canvas selection events
        document.addEventListener('canvas-selection-changed', (e) => {
            const hasSelection = e.detail.elements && e.detail.elements.length > 0;
            this.container.querySelector('#btn-create-component').disabled = !hasSelection;
        });
        
        // Library change events
        document.addEventListener('active-library-changed', (e) => {
            this.onLibraryChanged(e.detail.libraryId);
        });
        
        // Drag and drop for components
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Make component items draggable
        this.container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('component-item')) {
                const componentId = e.target.dataset.componentId;
                const component = this.componentLibrary.findComponent(componentId);
                
                if (component) {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('application/x-component', JSON.stringify({
                        componentId: componentId,
                        component: component.component.toJSON()
                    }));
                    
                    // Create drag image
                    const dragImage = this.createDragImage(component.component);
                    e.dataTransfer.setDragImage(dragImage, 50, 50);
                }
            }
        });
    }

    createDragImage(component) {
        const div = document.createElement('div');
        div.className = 'component-drag-image';
        div.innerHTML = `
            <img src="${component.getThumbnail()}" alt="${component.name}" />
            <span>${component.name}</span>
        `;
        document.body.appendChild(div);
        
        // Remove after drag
        setTimeout(() => div.remove(), 0);
        
        return div;
    }

    loadLibraries() {
        const libraries = this.componentLibrary.getAllLibraries();
        const selector = this.container.querySelector('#library-selector');
        
        // Clear existing options
        selector.innerHTML = '<option value="">Select Library...</option>';
        
        // Add library options
        libraries.forEach(library => {
            const option = document.createElement('option');
            option.value = library.id;
            option.textContent = library.name;
            if (library.isSystemLibrary) {
                option.textContent += ' (System)';
            }
            selector.appendChild(option);
        });
        
        // Select active library
        const activeLibrary = this.componentLibrary.getActiveLibrary();
        if (activeLibrary) {
            selector.value = activeLibrary.id;
            this.selectLibrary(activeLibrary.id);
        }
    }

    selectLibrary(libraryId) {
        if (!libraryId) return;
        
        this.selectedLibrary = libraryId;
        this.componentLibrary.setActiveLibrary(libraryId);
        
        const library = this.componentLibrary.libraries.get(libraryId);
        if (!library) return;
        
        // Update export button
        this.container.querySelector('#btn-export-library').disabled = library.isSystemLibrary;
        
        // Update tree
        this.tree.loadLibrary(library);
        
        // Update grid/list views
        this.displayAllComponents();
        
        // Update statistics
        this.updateStatistics();
        
        // Update favorites
        this.updateFavorites();
    }

    displayAllComponents() {
        const library = this.componentLibrary.libraries.get(this.selectedLibrary);
        if (!library) return;
        
        const components = [];
        for (const category of library.categories.values()) {
            components.push(...category.getAllComponents().map(comp => ({
                component: comp,
                category: category
            })));
        }
        
        this.displayComponents(components);
    }

    displayComponents(componentData) {
        // Update grid view
        const grid = this.container.querySelector('#component-grid');
        grid.innerHTML = '';
        
        componentData.forEach(({ component, category }) => {
            const item = this.createComponentGridItem(component, category);
            grid.appendChild(item);
        });
        
        // Update list view
        const listBody = this.container.querySelector('#component-list-body');
        listBody.innerHTML = '';
        
        componentData.forEach(({ component, category }) => {
            const row = this.createComponentListRow(component, category);
            listBody.appendChild(row);
        });
    }

    createComponentGridItem(component, category) {
        const div = document.createElement('div');
        div.className = 'component-item';
        div.dataset.componentId = component.id;
        div.draggable = true;
        
        const isFavorite = this.componentLibrary.favoriteComponents.has(component.id);
        
        div.innerHTML = `
            <div class="component-thumbnail">
                <img src="${component.getThumbnail()}" alt="${component.name}" />
                ${component.isSystemComponent ? '<span class="badge-system">System</span>' : ''}
                ${component.version.isPrerelease() ? '<span class="badge-prerelease">Pre-release</span>' : ''}
            </div>
            <div class="component-info">
                <h4>${component.name}</h4>
                <p class="component-type">${component.type}</p>
                <p class="component-category">${category.name}</p>
                <div class="component-meta">
                    <span class="version">v${component.version}</span>
                    ${component.metadata.ratings.count > 0 ? 
                        `<span class="rating">★ ${component.metadata.ratings.average.toFixed(1)}</span>` : 
                        ''}
                </div>
            </div>
            <div class="component-actions">
                <button class="btn-icon btn-favorite ${isFavorite ? 'active' : ''}" title="Favorite">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" 
                              fill="${isFavorite ? 'currentColor' : 'none'}" 
                              stroke="currentColor" stroke-width="1"/>
                    </svg>
                </button>
                <button class="btn-icon btn-more" title="More options">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Event listeners
        div.addEventListener('click', () => this.selectComponent(component.id));
        div.addEventListener('dblclick', () => this.useComponent(component.id));
        
        const favoriteBtn = div.querySelector('.btn-favorite');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(component.id);
        });
        
        const moreBtn = div.querySelector('.btn-more');
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showComponentMenu(component.id, e.currentTarget);
        });
        
        return div;
    }

    createComponentListRow(component, category) {
        const tr = document.createElement('tr');
        tr.className = 'component-row';
        tr.dataset.componentId = component.id;
        
        const isFavorite = this.componentLibrary.favoriteComponents.has(component.id);
        
        tr.innerHTML = `
            <td class="component-name">
                <img src="${component.getThumbnail()}" alt="${component.name}" class="component-thumb-small" />
                <span>${component.name}</span>
                ${isFavorite ? '<span class="icon-favorite">★</span>' : ''}
            </td>
            <td>${component.type}</td>
            <td>${category.name}</td>
            <td>${component.version}</td>
            <td>${component.metadata.author}</td>
            <td>${new Date(component.metadata.modified).toLocaleDateString()}</td>
            <td class="component-actions">
                <button class="btn-icon btn-use" title="Use Component">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="btn-icon btn-edit" title="Edit" ${component.isSystemComponent ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M12 2l2 2-8 8-3 1 1-3 8-8z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-clone" title="Clone">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="6" y="6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" title="Delete" ${component.isSystemComponent ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        `;
        
        // Event listeners
        tr.addEventListener('click', () => this.selectComponent(component.id));
        
        tr.querySelector('.btn-use').addEventListener('click', (e) => {
            e.stopPropagation();
            this.useComponent(component.id);
        });
        
        tr.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editComponent(component.id);
        });
        
        tr.querySelector('.btn-clone').addEventListener('click', (e) => {
            e.stopPropagation();
            this.cloneComponent(component.id);
        });
        
        tr.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteComponent(component.id);
        });
        
        return tr;
    }

    selectComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result) return;
        
        this.selectedComponent = componentId;
        
        // Update selection state
        this.container.querySelectorAll('.component-item, .component-row').forEach(el => {
            el.classList.toggle('selected', el.dataset.componentId === componentId);
        });
        
        // Update preview
        this.preview.showComponent(result.component, result.category, result.library);
        
        // Show details panel if hidden
        const detailsPanel = this.container.querySelector('#library-details');
        if (!detailsPanel.classList.contains('visible')) {
            detailsPanel.classList.add('visible');
        }
    }

    useComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result) return;
        
        // Track usage
        result.component.metadata.trackUsage();
        
        // Create instance and add to canvas
        const instance = result.component.createInstance();
        
        // Emit event for canvas to handle
        const event = new CustomEvent('component-use', {
            detail: {
                template: result.component,
                instance: instance
            }
        });
        document.dispatchEvent(event);
        
        // Hide panel after use (optional)
        // this.hide();
    }

    editComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result || result.component.isSystemComponent) return;
        
        // Switch to editor view
        this.switchView('editor');
        
        // Load component in editor
        this.editor.loadComponent(result.component, result.category, result.library);
    }

    cloneComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result) return;
        
        // Show clone dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>Clone Component</h3>
                <div class="form-group">
                    <label for="clone-name">New Component Name:</label>
                    <input type="text" id="clone-name" value="${result.component.name} (Copy)" />
                </div>
                <div class="form-group">
                    <label for="clone-library">Target Library:</label>
                    <select id="clone-library">
                        ${this.componentLibrary.getAllLibraries()
                            .filter(lib => !lib.isSystemLibrary)
                            .map(lib => `<option value="${lib.id}" ${lib.id === this.selectedLibrary ? 'selected' : ''}>${lib.name}</option>`)
                            .join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="clone-category">Target Category:</label>
                    <select id="clone-category">
                        <!-- Will be populated based on selected library -->
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-dialog').remove()">Cancel</button>
                    <button class="btn-primary" id="btn-confirm-clone">Clone</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Update categories when library changes
        const librarySelect = dialog.querySelector('#clone-library');
        const categorySelect = dialog.querySelector('#clone-category');
        
        const updateCategories = () => {
            const library = this.componentLibrary.libraries.get(librarySelect.value);
            if (library) {
                categorySelect.innerHTML = Array.from(library.categories.entries())
                    .map(([id, cat]) => `<option value="${id}">${cat.name}</option>`)
                    .join('');
            }
        };
        
        librarySelect.addEventListener('change', updateCategories);
        updateCategories();
        
        // Handle clone
        dialog.querySelector('#btn-confirm-clone').addEventListener('click', () => {
            const newName = dialog.querySelector('#clone-name').value;
            const targetLibraryId = dialog.querySelector('#clone-library').value;
            const targetCategoryId = dialog.querySelector('#clone-category').value;
            
            try {
                const clonedId = this.componentLibrary.cloneComponent(
                    componentId,
                    targetLibraryId,
                    targetCategoryId,
                    newName
                );
                
                // Refresh display
                this.displayAllComponents();
                this.updateStatistics();
                
                // Select cloned component
                this.selectComponent(clonedId);
                
                dialog.remove();
            } catch (error) {
                alert(`Failed to clone component: ${error.message}`);
            }
        });
    }

    deleteComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result || result.component.isSystemComponent) return;
        
        if (confirm(`Are you sure you want to delete "${result.component.name}"?`)) {
            try {
                this.componentLibrary.deleteComponent(componentId);
                
                // Refresh display
                this.displayAllComponents();
                this.updateStatistics();
                this.updateFavorites();
                
                // Clear selection
                this.selectedComponent = null;
                this.preview.clear();
            } catch (error) {
                alert(`Failed to delete component: ${error.message}`);
            }
        }
    }

    toggleFavorite(componentId) {
        this.componentLibrary.toggleFavorite(componentId);
        
        // Update UI
        const isFavorite = this.componentLibrary.favoriteComponents.has(componentId);
        
        // Update grid item
        const gridItem = this.container.querySelector(`.component-item[data-component-id="${componentId}"]`);
        if (gridItem) {
            const btn = gridItem.querySelector('.btn-favorite');
            btn.classList.toggle('active', isFavorite);
            const svg = btn.querySelector('path');
            svg.setAttribute('fill', isFavorite ? 'currentColor' : 'none');
        }
        
        // Update list row
        const listRow = this.container.querySelector(`.component-row[data-component-id="${componentId}"]`);
        if (listRow) {
            const nameCell = listRow.querySelector('.component-name');
            const favIcon = nameCell.querySelector('.icon-favorite');
            if (isFavorite && !favIcon) {
                nameCell.innerHTML += '<span class="icon-favorite">★</span>';
            } else if (!isFavorite && favIcon) {
                favIcon.remove();
            }
        }
        
        // Update favorites list
        this.updateFavorites();
    }

    updateFavorites() {
        const favoritesContainer = this.container.querySelector('#library-favorites');
        const favorites = this.componentLibrary.getFavoriteComponents();
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p class="no-favorites">No favorite components</p>';
            return;
        }
        
        favoritesContainer.innerHTML = favorites.map(({ component, category }) => `
            <div class="favorite-item" data-component-id="${component.id}">
                <img src="${component.getThumbnail()}" alt="${component.name}" />
                <div class="favorite-info">
                    <span class="favorite-name">${component.name}</span>
                    <span class="favorite-category">${category.name}</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        favoritesContainer.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectComponent(item.dataset.componentId);
            });
        });
    }

    showComponentMenu(componentId, anchor) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result) return;
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="use">
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Use Component
            </div>
            <div class="menu-item" data-action="edit" ${result.component.isSystemComponent ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M12 2l2 2-8 8-3 1 1-3 8-8z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                </svg>
                Edit
            </div>
            <div class="menu-item" data-action="clone">
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="6" y="6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Clone
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="export">
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 14V6m0 0l3 3m-3-3L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M2 2h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Export Component
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="delete" ${result.component.isSystemComponent ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Delete
            </div>
        `;
        
        // Position menu
        const rect = anchor.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        
        // Handle menu items
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.menu-item');
            if (!item || item.hasAttribute('disabled')) return;
            
            const action = item.dataset.action;
            switch (action) {
                case 'use':
                    this.useComponent(componentId);
                    break;
                case 'edit':
                    this.editComponent(componentId);
                    break;
                case 'clone':
                    this.cloneComponent(componentId);
                    break;
                case 'export':
                    this.exportComponent(componentId);
                    break;
                case 'delete':
                    this.deleteComponent(componentId);
                    break;
            }
            
            menu.remove();
        });
        
        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
        
        document.body.appendChild(menu);
    }

    exportComponent(componentId) {
        const result = this.componentLibrary.findComponent(componentId);
        if (!result) return;
        
        const exportData = {
            component: result.component.toJSON(),
            category: {
                id: result.category.id,
                name: result.category.name
            },
            library: {
                name: result.library.name,
                version: result.library.version
            },
            exported: new Date().toISOString()
        };
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.component.name.replace(/\s+/g, '_')}.component.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    switchView(viewName) {
        // Update tab buttons
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === viewName);
        });
        
        // Update view panels
        this.container.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `library-${viewName}-view`);
        });
    }

    displaySearchResults(results) {
        const components = results.map(r => ({
            component: r.component,
            category: r.category
        }));
        
        this.displayComponents(components);
    }

    handleTreeSelection(item) {
        if (item.type === 'category') {
            // Display components in this category
            const library = this.componentLibrary.libraries.get(this.selectedLibrary);
            const category = library?.categories.get(item.id);
            
            if (category) {
                const components = category.getAllComponents(false).map(comp => ({
                    component: comp,
                    category: category
                }));
                
                this.displayComponents(components);
            }
        } else if (item.type === 'component') {
            this.selectComponent(item.id);
        }
    }

    showNewLibraryDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>Create New Library</h3>
                <div class="form-group">
                    <label for="library-name">Library Name:</label>
                    <input type="text" id="library-name" placeholder="My Component Library" />
                </div>
                <div class="form-group">
                    <label for="library-description">Description:</label>
                    <textarea id="library-description" rows="3" placeholder="Description of your library..."></textarea>
                </div>
                <div class="form-group">
                    <label for="library-author">Author:</label>
                    <input type="text" id="library-author" placeholder="Your name" />
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-dialog').remove()">Cancel</button>
                    <button class="btn-primary" id="btn-create-library">Create Library</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('#btn-create-library').addEventListener('click', () => {
            const name = dialog.querySelector('#library-name').value.trim();
            const description = dialog.querySelector('#library-description').value.trim();
            const author = dialog.querySelector('#library-author').value.trim();
            
            if (!name) {
                alert('Library name is required');
                return;
            }
            
            try {
                const libraryId = this.componentLibrary.createLibrary(name, description, {
                    author: author || 'Unknown'
                });
                
                // Reload libraries and select new one
                this.loadLibraries();
                this.selectLibrary(libraryId);
                
                dialog.remove();
            } catch (error) {
                alert(`Failed to create library: ${error.message}`);
            }
        });
    }

    showNewCategoryDialog(parentId = null) {
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>Create New Category</h3>
                <div class="form-group">
                    <label for="category-name">Category Name:</label>
                    <input type="text" id="category-name" placeholder="Category name" />
                </div>
                <div class="form-group">
                    <label for="category-description">Description:</label>
                    <textarea id="category-description" rows="3" placeholder="Category description..."></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-dialog').remove()">Cancel</button>
                    <button class="btn-primary" id="btn-create-category">Create Category</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('#btn-create-category').addEventListener('click', () => {
            const name = dialog.querySelector('#category-name').value.trim();
            const description = dialog.querySelector('#category-description').value.trim();
            
            if (!name) {
                alert('Category name is required');
                return;
            }
            
            try {
                const categoryId = this.componentLibrary.addCategory(this.selectedLibrary, name, description);
                
                // Refresh tree
                const library = this.componentLibrary.libraries.get(this.selectedLibrary);
                this.tree.loadLibrary(library);
                
                dialog.remove();
            } catch (error) {
                alert(`Failed to create category: ${error.message}`);
            }
        });
    }

    importLibrary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const libraryId = this.componentLibrary.importLibrary(e.target.result);
                    
                    // Reload libraries and select imported one
                    this.loadLibraries();
                    this.selectLibrary(libraryId);
                    
                    alert('Library imported successfully');
                } catch (error) {
                    alert(`Failed to import library: ${error.message}`);
                }
            };
            
            reader.readAsText(file);
        });
        
        input.click();
    }

    exportLibrary() {
        if (!this.selectedLibrary) return;
        
        const library = this.componentLibrary.libraries.get(this.selectedLibrary);
        if (!library || library.isSystemLibrary) return;
        
        try {
            const json = this.componentLibrary.exportLibrary(this.selectedLibrary);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${library.name.replace(/\s+/g, '_')}.library.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Failed to export library: ${error.message}`);
        }
    }

    createComponentFromSelection() {
        // Get selected elements from canvas
        const event = new CustomEvent('get-canvas-selection');
        document.dispatchEvent(event);
        
        // The canvas will respond with the selection data
        // This is handled in the event listener setup
    }

    updateStatistics() {
        const library = this.componentLibrary.libraries.get(this.selectedLibrary);
        if (!library) return;
        
        let componentCount = 0;
        let categoryCount = library.categories.size;
        
        for (const category of library.categories.values()) {
            componentCount += category.getAllComponents(true).length;
        }
        
        const statsElement = this.container.querySelector('#library-stats');
        statsElement.textContent = `${componentCount} components in ${categoryCount} categories`;
    }

    onLibraryChanged(libraryId) {
        if (this.selectedLibrary !== libraryId) {
            const selector = this.container.querySelector('#library-selector');
            selector.value = libraryId;
            this.selectLibrary(libraryId);
        }
    }

    show() {
        this.container.classList.add('visible');
        this.isVisible = true;
        
        // Refresh content
        this.loadLibraries();
    }

    hide() {
        this.container.classList.remove('visible');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}