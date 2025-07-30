/**
 * ComponentEditor - Visual editor for creating and modifying components
 */
export class ComponentEditor {
    constructor(componentLibrary) {
        this.componentLibrary = componentLibrary;
        this.element = null;
        this.canvas = null;
        this.currentComponent = null;
        this.currentCategory = null;
        this.currentLibrary = null;
        this.isDirty = false;
        this.selectedElements = [];
        
        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'component-editor';
        this.element.innerHTML = this.getTemplate();
        
        this.canvas = this.element.querySelector('#editor-canvas');
        this.setupEventListeners();
    }

    getTemplate() {
        return `
            <div class="editor-header">
                <h3>Component Editor</h3>
                <div class="editor-actions">
                    <button id="btn-save-component" class="btn-primary" disabled>Save Component</button>
                    <button id="btn-cancel-edit" class="btn-secondary">Cancel</button>
                </div>
            </div>
            
            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <button class="tool-btn" data-tool="select" title="Select">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M5 5l10 5-4 2-2 4z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="tool-btn" data-tool="move" title="Move">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M10 5v10M5 10h10" stroke="currentColor" stroke-width="2"/>
                            <path d="M10 5l-2 2M10 5l2 2M10 15l-2-2M10 15l2-2" stroke="currentColor" stroke-width="2"/>
                            <path d="M5 10l2-2M5 10l2 2M15 10l-2-2M15 10l-2 2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="tool-btn" data-tool="terminal" title="Add Terminal">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="4" fill="currentColor"/>
                            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button class="tool-btn" data-action="group" title="Group Selected">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <rect x="4" y="4" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <rect x="11" y="4" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <rect x="4" y="11" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <rect x="11" y="11" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <rect x="2" y="2" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                        </svg>
                    </button>
                    <button class="tool-btn" data-action="ungroup" title="Ungroup">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <rect x="4" y="4" width="5" height="5" fill="currentColor" opacity="0.5"/>
                            <rect x="11" y="4" width="5" height="5" fill="currentColor" opacity="0.5"/>
                            <rect x="4" y="11" width="5" height="5" fill="currentColor" opacity="0.5"/>
                            <rect x="11" y="11" width="5" height="5" fill="currentColor" opacity="0.5"/>
                        </svg>
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button class="tool-btn" data-action="align-left" title="Align Left">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M4 4v12" stroke="currentColor" stroke-width="2"/>
                            <rect x="7" y="6" width="8" height="3" fill="currentColor"/>
                            <rect x="7" y="11" width="6" height="3" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="tool-btn" data-action="align-center" title="Align Center">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M10 4v12" stroke="currentColor" stroke-width="2"/>
                            <rect x="6" y="6" width="8" height="3" fill="currentColor"/>
                            <rect x="7" y="11" width="6" height="3" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="tool-btn" data-action="align-right" title="Align Right">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M16 4v12" stroke="currentColor" stroke-width="2"/>
                            <rect x="5" y="6" width="8" height="3" fill="currentColor"/>
                            <rect x="7" y="11" width="6" height="3" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button class="tool-btn" data-action="delete" title="Delete Selected">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M7 5V3h6v2m3 0v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5m4 0v9m4-9v9" 
                                  stroke="currentColor" stroke-width="1.5" fill="none"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="editor-content">
                <div class="editor-canvas-container">
                    <svg id="editor-canvas" class="editor-canvas" viewBox="0 0 800 600">
                        <defs>
                            <pattern id="editor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="#ddd"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#editor-grid)"/>
                        <g id="editor-components"></g>
                        <g id="editor-selection"></g>
                        <g id="editor-terminals"></g>
                    </svg>
                </div>
                
                <div class="editor-properties">
                    <h4>Component Properties</h4>
                    
                    <div class="property-section">
                        <h5>Basic Information</h5>
                        <div class="property-group">
                            <label for="comp-name">Name:</label>
                            <input type="text" id="comp-name" placeholder="Component name" />
                        </div>
                        <div class="property-group">
                            <label for="comp-type">Type:</label>
                            <input type="text" id="comp-type" placeholder="Component type" />
                        </div>
                        <div class="property-group">
                            <label for="comp-description">Description:</label>
                            <textarea id="comp-description" rows="3" placeholder="Component description"></textarea>
                        </div>
                    </div>
                    
                    <div class="property-section">
                        <h5>Dimensions</h5>
                        <div class="property-row">
                            <div class="property-group">
                                <label for="comp-width">Width:</label>
                                <input type="number" id="comp-width" min="50" max="1000" value="200" />
                            </div>
                            <div class="property-group">
                                <label for="comp-height">Height:</label>
                                <input type="number" id="comp-height" min="50" max="1000" value="100" />
                            </div>
                        </div>
                    </div>
                    
                    <div class="property-section">
                        <h5>Appearance</h5>
                        <div class="property-group">
                            <label for="comp-bg-color">Background Color:</label>
                            <input type="color" id="comp-bg-color" value="#f8f8f8" />
                        </div>
                        <div class="property-group">
                            <label for="comp-border-color">Border Color:</label>
                            <input type="color" id="comp-border-color" value="#333333" />
                        </div>
                        <div class="property-group">
                            <label for="comp-border-width">Border Width:</label>
                            <input type="range" id="comp-border-width" min="1" max="5" value="2" />
                            <span id="border-width-value">2</span>
                        </div>
                    </div>
                    
                    <div class="property-section">
                        <h5>Terminals</h5>
                        <div id="terminal-list" class="terminal-list">
                            <!-- Terminal list will be populated here -->
                        </div>
                        <button id="btn-add-terminal" class="btn-secondary">Add Terminal</button>
                    </div>
                    
                    <div class="property-section">
                        <h5>Custom Properties</h5>
                        <div id="custom-properties" class="custom-properties">
                            <!-- Custom properties will be populated here -->
                        </div>
                        <button id="btn-add-property" class="btn-secondary">Add Property</button>
                    </div>
                    
                    <div class="property-section">
                        <h5>Tags</h5>
                        <div class="tag-input-wrapper">
                            <input type="text" id="comp-tags" placeholder="Add tags (comma separated)" />
                            <div id="comp-tag-list" class="tag-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Tool selection
        this.element.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool);
            });
        });
        
        // Action buttons
        this.element.querySelectorAll('.tool-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.performAction(btn.dataset.action);
            });
        });
        
        // Save/Cancel
        this.element.querySelector('#btn-save-component').addEventListener('click', () => {
            this.saveComponent();
        });
        
        this.element.querySelector('#btn-cancel-edit').addEventListener('click', () => {
            this.cancelEdit();
        });
        
        // Property changes
        const propertyInputs = [
            '#comp-name', '#comp-type', '#comp-description',
            '#comp-width', '#comp-height',
            '#comp-bg-color', '#comp-border-color', '#comp-border-width'
        ];
        
        propertyInputs.forEach(selector => {
            this.element.querySelector(selector).addEventListener('input', () => {
                this.markDirty();
                this.updatePreview();
            });
        });
        
        // Border width display
        this.element.querySelector('#comp-border-width').addEventListener('input', (e) => {
            this.element.querySelector('#border-width-value').textContent = e.target.value;
        });
        
        // Add terminal button
        this.element.querySelector('#btn-add-terminal').addEventListener('click', () => {
            this.addTerminal();
        });
        
        // Add property button
        this.element.querySelector('#btn-add-property').addEventListener('click', () => {
            this.addCustomProperty();
        });
        
        // Tags input
        this.element.querySelector('#comp-tags').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addTags();
            }
        });
        
        // Canvas interactions
        this.setupCanvasInteractions();
    }

    setupCanvasInteractions() {
        let isSelecting = false;
        let isDragging = false;
        let startPoint = null;
        let selectedElement = null;
        
        this.canvas.addEventListener('mousedown', (e) => {
            const point = this.getCanvasPoint(e);
            const element = this.getElementAtPoint(point);
            
            if (element) {
                selectedElement = element;
                isDragging = true;
                startPoint = point;
                this.selectElement(element);
            } else {
                isSelecting = true;
                startPoint = point;
                this.startSelection(point);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const point = this.getCanvasPoint(e);
            
            if (isDragging && selectedElement) {
                const dx = point.x - startPoint.x;
                const dy = point.y - startPoint.y;
                this.moveElement(selectedElement, dx, dy);
                startPoint = point;
            } else if (isSelecting) {
                this.updateSelection(startPoint, point);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (isSelecting) {
                this.endSelection();
            }
            
            isSelecting = false;
            isDragging = false;
            selectedElement = null;
        });
    }

    loadComponent(component, category, library) {
        this.currentComponent = component;
        this.currentCategory = category;
        this.currentLibrary = library;
        this.isDirty = false;
        
        // Load basic properties
        this.element.querySelector('#comp-name').value = component.name;
        this.element.querySelector('#comp-type').value = component.type;
        this.element.querySelector('#comp-description').value = component.metadata.description;
        
        // Load dimensions
        this.element.querySelector('#comp-width').value = component.dimensions.width;
        this.element.querySelector('#comp-height').value = component.dimensions.height;
        
        // Load appearance
        this.element.querySelector('#comp-bg-color').value = component.appearance.backgroundColor;
        this.element.querySelector('#comp-border-color').value = component.appearance.borderColor;
        this.element.querySelector('#comp-border-width').value = component.appearance.borderWidth;
        this.element.querySelector('#border-width-value').textContent = component.appearance.borderWidth;
        
        // Load terminals
        this.loadTerminals(component.terminals);
        
        // Load custom properties
        this.loadCustomProperties(component.properties);
        
        // Load tags
        this.loadTags(component.metadata.tags);
        
        // Load visual elements
        this.loadVisualElements(component);
        
        // Enable save button
        this.element.querySelector('#btn-save-component').disabled = false;
    }

    loadTerminals(terminals) {
        const container = this.element.querySelector('#terminal-list');
        container.innerHTML = '';
        
        terminals.forEach((terminal, index) => {
            const div = document.createElement('div');
            div.className = 'terminal-item';
            div.dataset.terminalIndex = index;
            div.innerHTML = `
                <span class="terminal-label">${terminal.label || terminal.id}</span>
                <select class="terminal-type">
                    <option value="universal" ${terminal.type === 'universal' ? 'selected' : ''}>Universal</option>
                    <option value="power" ${terminal.type === 'power' ? 'selected' : ''}>Power</option>
                    <option value="data" ${terminal.type === 'data' ? 'selected' : ''}>Data</option>
                    <option value="ac" ${terminal.type === 'ac' ? 'selected' : ''}>AC</option>
                    <option value="dc" ${terminal.type === 'dc' ? 'selected' : ''}>DC</option>
                </select>
                <select class="terminal-position">
                    <option value="top" ${terminal.position === 'top' ? 'selected' : ''}>Top</option>
                    <option value="bottom" ${terminal.position === 'bottom' ? 'selected' : ''}>Bottom</option>
                    <option value="left" ${terminal.position === 'left' ? 'selected' : ''}>Left</option>
                    <option value="right" ${terminal.position === 'right' ? 'selected' : ''}>Right</option>
                </select>
                <button class="btn-remove-terminal" title="Remove Terminal">×</button>
            `;
            
            // Event listeners
            div.querySelector('.terminal-type').addEventListener('change', () => {
                this.markDirty();
                this.updatePreview();
            });
            
            div.querySelector('.terminal-position').addEventListener('change', () => {
                this.markDirty();
                this.updatePreview();
            });
            
            div.querySelector('.btn-remove-terminal').addEventListener('click', () => {
                this.removeTerminal(index);
            });
            
            container.appendChild(div);
        });
    }

    loadCustomProperties(properties) {
        const container = this.element.querySelector('#custom-properties');
        container.innerHTML = '';
        
        Object.entries(properties).forEach(([key, prop]) => {
            const div = document.createElement('div');
            div.className = 'property-item';
            div.dataset.propertyKey = key;
            div.innerHTML = `
                <input type="text" class="property-name" value="${key}" placeholder="Property name" />
                <select class="property-type">
                    <option value="string" ${prop.type === 'string' ? 'selected' : ''}>Text</option>
                    <option value="number" ${prop.type === 'number' ? 'selected' : ''}>Number</option>
                    <option value="boolean" ${prop.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                    <option value="select" ${prop.type === 'select' ? 'selected' : ''}>Select</option>
                    <option value="color" ${prop.type === 'color' ? 'selected' : ''}>Color</option>
                </select>
                <input type="text" class="property-default" value="${prop.value || ''}" placeholder="Default value" />
                <button class="btn-remove-property" title="Remove Property">×</button>
            `;
            
            // Event listeners
            div.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('change', () => {
                    this.markDirty();
                });
            });
            
            div.querySelector('.btn-remove-property').addEventListener('click', () => {
                this.removeCustomProperty(key);
            });
            
            container.appendChild(div);
        });
    }

    loadTags(tags) {
        const container = this.element.querySelector('#comp-tag-list');
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.innerHTML = `
                ${tag}
                <button class="tag-remove" data-tag="${tag}">×</button>
            `;
            
            span.querySelector('.tag-remove').addEventListener('click', () => {
                this.removeTag(tag);
            });
            
            container.appendChild(span);
        });
    }

    loadVisualElements(component) {
        const container = this.element.querySelector('#editor-components');
        container.innerHTML = '';
        
        // Create main component rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '100');
        rect.setAttribute('y', '100');
        rect.setAttribute('width', component.dimensions.width);
        rect.setAttribute('height', component.dimensions.height);
        rect.setAttribute('fill', component.appearance.backgroundColor);
        rect.setAttribute('stroke', component.appearance.borderColor);
        rect.setAttribute('stroke-width', component.appearance.borderWidth);
        rect.setAttribute('rx', component.appearance.borderRadius);
        
        container.appendChild(rect);
        
        // Add terminals
        const terminalsGroup = this.element.querySelector('#editor-terminals');
        terminalsGroup.innerHTML = '';
        
        component.terminals.forEach((terminal, index) => {
            const pos = this.getTerminalPosition(terminal, component.dimensions, { x: 100, y: 100 });
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', this.getTerminalColor(terminal.type));
            circle.setAttribute('stroke', '#333');
            circle.setAttribute('stroke-width', '2');
            circle.dataset.terminalIndex = index;
            
            terminalsGroup.appendChild(circle);
        });
        
        // If custom component with elements, render them
        if (component.elements) {
            // TODO: Render custom elements
        }
    }

    getTerminalPosition(terminal, dimensions, offset = { x: 0, y: 0 }) {
        const positions = {
            'top': { x: dimensions.width / 2, y: 0 },
            'bottom': { x: dimensions.width / 2, y: dimensions.height },
            'left': { x: 0, y: dimensions.height / 2 },
            'right': { x: dimensions.width, y: dimensions.height / 2 }
        };
        
        const pos = positions[terminal.position] || { x: 0, y: 0 };
        return {
            x: offset.x + pos.x,
            y: offset.y + pos.y
        };
    }

    getTerminalColor(type) {
        const colors = {
            'power': '#ff0000',
            'data': '#0066cc',
            'ac': '#ff6600',
            'dc': '#009900',
            'universal': '#666666'
        };
        return colors[type] || colors.universal;
    }

    selectTool(tool) {
        this.element.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        this.currentTool = tool;
    }

    performAction(action) {
        switch (action) {
            case 'group':
                this.groupSelected();
                break;
            case 'ungroup':
                this.ungroupSelected();
                break;
            case 'align-left':
            case 'align-center':
            case 'align-right':
                this.alignElements(action.replace('align-', ''));
                break;
            case 'delete':
                this.deleteSelected();
                break;
        }
    }

    addTerminal() {
        const terminals = this.getCurrentTerminals();
        terminals.push({
            id: `terminal-${terminals.length + 1}`,
            type: 'universal',
            position: 'right',
            label: `T${terminals.length + 1}`
        });
        
        this.loadTerminals(terminals);
        this.markDirty();
        this.updatePreview();
    }

    removeTerminal(index) {
        const terminals = this.getCurrentTerminals();
        terminals.splice(index, 1);
        
        this.loadTerminals(terminals);
        this.markDirty();
        this.updatePreview();
    }

    getCurrentTerminals() {
        const terminals = [];
        this.element.querySelectorAll('.terminal-item').forEach((item, index) => {
            terminals.push({
                id: `terminal-${index + 1}`,
                type: item.querySelector('.terminal-type').value,
                position: item.querySelector('.terminal-position').value,
                label: `T${index + 1}`
            });
        });
        return terminals;
    }

    addCustomProperty() {
        const container = this.element.querySelector('#custom-properties');
        const index = container.children.length;
        
        const div = document.createElement('div');
        div.className = 'property-item';
        div.innerHTML = `
            <input type="text" class="property-name" placeholder="Property name" />
            <select class="property-type">
                <option value="string">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="color">Color</option>
            </select>
            <input type="text" class="property-default" placeholder="Default value" />
            <button class="btn-remove-property" title="Remove Property">×</button>
        `;
        
        // Event listeners
        div.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                this.markDirty();
            });
        });
        
        div.querySelector('.btn-remove-property').addEventListener('click', () => {
            div.remove();
            this.markDirty();
        });
        
        container.appendChild(div);
        div.querySelector('.property-name').focus();
        
        this.markDirty();
    }

    removeCustomProperty(key) {
        const item = this.element.querySelector(`.property-item[data-property-key="${key}"]`);
        if (item) {
            item.remove();
            this.markDirty();
        }
    }

    addTags() {
        const input = this.element.querySelector('#comp-tags');
        const tags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (tags.length > 0) {
            const currentTags = this.getCurrentTags();
            const newTags = [...new Set([...currentTags, ...tags])];
            this.loadTags(newTags);
            input.value = '';
            this.markDirty();
        }
    }

    removeTag(tag) {
        const tags = this.getCurrentTags().filter(t => t !== tag);
        this.loadTags(tags);
        this.markDirty();
    }

    getCurrentTags() {
        const tags = [];
        this.element.querySelectorAll('#comp-tag-list .tag').forEach(tag => {
            const text = tag.textContent.replace('×', '').trim();
            if (text) tags.push(text);
        });
        return tags;
    }

    markDirty() {
        this.isDirty = true;
        this.element.querySelector('#btn-save-component').disabled = false;
    }

    updatePreview() {
        if (!this.currentComponent) return;
        
        // Update component rectangle
        const rect = this.element.querySelector('#editor-components rect');
        if (rect) {
            rect.setAttribute('width', this.element.querySelector('#comp-width').value);
            rect.setAttribute('height', this.element.querySelector('#comp-height').value);
            rect.setAttribute('fill', this.element.querySelector('#comp-bg-color').value);
            rect.setAttribute('stroke', this.element.querySelector('#comp-border-color').value);
            rect.setAttribute('stroke-width', this.element.querySelector('#comp-border-width').value);
        }
        
        // Update terminals
        this.loadVisualElements({
            ...this.currentComponent,
            dimensions: {
                width: parseInt(this.element.querySelector('#comp-width').value),
                height: parseInt(this.element.querySelector('#comp-height').value)
            },
            appearance: {
                ...this.currentComponent.appearance,
                backgroundColor: this.element.querySelector('#comp-bg-color').value,
                borderColor: this.element.querySelector('#comp-border-color').value,
                borderWidth: parseInt(this.element.querySelector('#comp-border-width').value)
            },
            terminals: this.getCurrentTerminals()
        });
    }

    saveComponent() {
        if (!this.currentComponent || !this.isDirty) return;
        
        // Gather updated data
        const updates = {
            name: this.element.querySelector('#comp-name').value,
            metadata: {
                description: this.element.querySelector('#comp-description').value,
                tags: this.getCurrentTags(),
                modified: Date.now()
            },
            dimensions: {
                width: parseInt(this.element.querySelector('#comp-width').value),
                height: parseInt(this.element.querySelector('#comp-height').value)
            },
            appearance: {
                backgroundColor: this.element.querySelector('#comp-bg-color').value,
                borderColor: this.element.querySelector('#comp-border-color').value,
                borderWidth: parseInt(this.element.querySelector('#comp-border-width').value)
            },
            terminals: this.getCurrentTerminals(),
            properties: this.getCurrentProperties()
        };
        
        try {
            // Update component
            this.componentLibrary.updateComponent(this.currentComponent.id, updates);
            
            this.isDirty = false;
            this.element.querySelector('#btn-save-component').disabled = true;
            
            // Notify success
            alert('Component saved successfully!');
            
            // Refresh library view
            const event = new CustomEvent('component-updated', {
                detail: { componentId: this.currentComponent.id }
            });
            document.dispatchEvent(event);
        } catch (error) {
            alert(`Failed to save component: ${error.message}`);
        }
    }

    getCurrentProperties() {
        const properties = {};
        
        this.element.querySelectorAll('.property-item').forEach(item => {
            const name = item.querySelector('.property-name').value.trim();
            if (name) {
                properties[name] = {
                    type: item.querySelector('.property-type').value,
                    value: item.querySelector('.property-default').value || ''
                };
            }
        });
        
        return properties;
    }

    cancelEdit() {
        if (this.isDirty) {
            if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
        }
        
        // Clear editor
        this.currentComponent = null;
        this.currentCategory = null;
        this.currentLibrary = null;
        this.isDirty = false;
        
        // Emit cancel event
        const event = new CustomEvent('editor-cancelled');
        document.dispatchEvent(event);
    }

    getCanvasPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        const viewBox = this.canvas.viewBox.baseVal;
        
        return {
            x: (event.clientX - rect.left) * viewBox.width / rect.width,
            y: (event.clientY - rect.top) * viewBox.height / rect.height
        };
    }

    getElementAtPoint(point) {
        // Simple hit testing - could be enhanced
        const elements = this.canvas.querySelectorAll('#editor-components *');
        
        for (const element of elements) {
            const bbox = element.getBBox();
            if (point.x >= bbox.x && point.x <= bbox.x + bbox.width &&
                point.y >= bbox.y && point.y <= bbox.y + bbox.height) {
                return element;
            }
        }
        
        return null;
    }

    selectElement(element) {
        this.selectedElements = [element];
        this.updateSelectionVisual();
    }

    startSelection(point) {
        const selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selectionRect.setAttribute('id', 'selection-rect');
        selectionRect.setAttribute('x', point.x);
        selectionRect.setAttribute('y', point.y);
        selectionRect.setAttribute('width', '0');
        selectionRect.setAttribute('height', '0');
        selectionRect.setAttribute('fill', 'rgba(0, 123, 255, 0.1)');
        selectionRect.setAttribute('stroke', '#007bff');
        selectionRect.setAttribute('stroke-width', '1');
        selectionRect.setAttribute('stroke-dasharray', '4 2');
        
        this.element.querySelector('#editor-selection').appendChild(selectionRect);
    }

    updateSelection(start, current) {
        const rect = this.element.querySelector('#selection-rect');
        if (!rect) return;
        
        const x = Math.min(start.x, current.x);
        const y = Math.min(start.y, current.y);
        const width = Math.abs(current.x - start.x);
        const height = Math.abs(current.y - start.y);
        
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
    }

    endSelection() {
        const rect = this.element.querySelector('#selection-rect');
        if (rect) {
            // TODO: Select elements within selection rectangle
            rect.remove();
        }
    }

    updateSelectionVisual() {
        const selectionGroup = this.element.querySelector('#editor-selection');
        selectionGroup.innerHTML = '';
        
        this.selectedElements.forEach(element => {
            const bbox = element.getBBox();
            const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            outline.setAttribute('x', bbox.x - 2);
            outline.setAttribute('y', bbox.y - 2);
            outline.setAttribute('width', bbox.width + 4);
            outline.setAttribute('height', bbox.height + 4);
            outline.setAttribute('fill', 'none');
            outline.setAttribute('stroke', '#007bff');
            outline.setAttribute('stroke-width', '2');
            outline.setAttribute('stroke-dasharray', '4 2');
            
            selectionGroup.appendChild(outline);
        });
    }

    moveElement(element, dx, dy) {
        // Simple translation - could be enhanced for different element types
        const transform = element.getAttribute('transform') || '';
        const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
        
        let x = 0, y = 0;
        if (match) {
            x = parseFloat(match[1]);
            y = parseFloat(match[2]);
        }
        
        element.setAttribute('transform', `translate(${x + dx}, ${y + dy})`);
        this.markDirty();
    }

    getElement() {
        return this.element;
    }
}