/**
 * ComponentTree - Hierarchical tree view for component categories
 */
export class ComponentTree {
    constructor(componentLibrary) {
        this.componentLibrary = componentLibrary;
        this.element = null;
        this.selectedItem = null;
        this.expandedNodes = new Set();
        this.callbacks = new Map();
        
        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'component-tree';
        this.element.innerHTML = '<div class="tree-container"></div>';
    }

    loadLibrary(library) {
        const container = this.element.querySelector('.tree-container');
        container.innerHTML = '';
        
        if (!library) {
            container.innerHTML = '<p class="no-library">No library selected</p>';
            return;
        }
        
        // Create tree structure
        const treeRoot = document.createElement('ul');
        treeRoot.className = 'tree-root';
        
        // Add categories
        for (const [categoryId, category] of library.categories) {
            const categoryNode = this.createCategoryNode(categoryId, category, library.isEditable);
            treeRoot.appendChild(categoryNode);
        }
        
        // Add "Add Category" button if library is editable
        if (library.isEditable) {
            const addButton = document.createElement('li');
            addButton.className = 'tree-add-category';
            addButton.innerHTML = `
                <div class="tree-item add-item">
                    <svg width="14" height="14" viewBox="0 0 16 16">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>Add Category</span>
                </div>
            `;
            
            addButton.querySelector('.tree-item').addEventListener('click', () => {
                this.emit('category-create', null);
            });
            
            treeRoot.appendChild(addButton);
        }
        
        container.appendChild(treeRoot);
    }

    createCategoryNode(categoryId, category, isEditable) {
        const li = document.createElement('li');
        li.className = 'tree-node';
        li.dataset.categoryId = categoryId;
        
        const isExpanded = this.expandedNodes.has(categoryId);
        const hasComponents = category.components.size > 0;
        const hasSubcategories = category.subcategories.size > 0;
        const hasChildren = hasComponents || hasSubcategories;
        
        // Category header
        const header = document.createElement('div');
        header.className = 'tree-item tree-category';
        header.innerHTML = `
            ${hasChildren ? `
                <span class="tree-toggle ${isExpanded ? 'expanded' : ''}">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M2 3l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </span>
            ` : '<span class="tree-spacer"></span>'}
            <svg class="tree-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M2 4h12v10H2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 4l6-2 6 2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span class="tree-label">${category.name}</span>
            <span class="tree-count">${category.components.size}</span>
            ${isEditable ? `
                <div class="tree-actions">
                    <button class="btn-tree-action" data-action="add-component" title="Add Component">
                        <svg width="12" height="12" viewBox="0 0 16 16">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="btn-tree-action" data-action="edit" title="Edit Category">
                        <svg width="12" height="12" viewBox="0 0 16 16">
                            <path d="M12 2l2 2-8 8-3 1 1-3 8-8z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                        </svg>
                    </button>
                    <button class="btn-tree-action" data-action="delete" title="Delete Category">
                        <svg width="12" height="12" viewBox="0 0 16 16">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
        `;
        
        li.appendChild(header);
        
        // Event listeners
        header.addEventListener('click', (e) => {
            if (e.target.closest('.tree-toggle')) {
                this.toggleNode(categoryId);
                return;
            }
            
            if (e.target.closest('.tree-actions')) {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action) {
                    this.handleCategoryAction(categoryId, action);
                }
                return;
            }
            
            this.selectItem({ type: 'category', id: categoryId });
        });
        
        // Children container
        if (hasChildren) {
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = isExpanded ? 'block' : 'none';
            
            // Add subcategories
            for (const [subId, subcategory] of category.subcategories) {
                const subNode = this.createCategoryNode(subId, subcategory, isEditable);
                childrenContainer.appendChild(subNode);
            }
            
            // Add components
            for (const [compId, component] of category.components) {
                const compNode = this.createComponentNode(compId, component, isEditable);
                childrenContainer.appendChild(compNode);
            }
            
            li.appendChild(childrenContainer);
        }
        
        return li;
    }

    createComponentNode(componentId, component, isEditable) {
        const li = document.createElement('li');
        li.className = 'tree-node tree-leaf';
        li.dataset.componentId = componentId;
        
        const item = document.createElement('div');
        item.className = 'tree-item tree-component';
        
        const iconClass = component.isSystemComponent ? 'system' : 
                         component.version.isPrerelease() ? 'prerelease' : 
                         'custom';
        
        item.innerHTML = `
            <span class="tree-spacer"></span>
            <svg class="tree-icon ${iconClass}" width="16" height="16" viewBox="0 0 16 16">
                <rect x="3" y="3" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
                ${component.isSystemComponent ? 
                    '<path d="M6 8h4M8 6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' :
                    '<circle cx="8" cy="8" r="2" fill="currentColor"/>'}
            </svg>
            <span class="tree-label">${component.name}</span>
            <span class="tree-version">v${component.version}</span>
        `;
        
        li.appendChild(item);
        
        // Event listener
        item.addEventListener('click', () => {
            this.selectItem({ type: 'component', id: componentId });
        });
        
        return li;
    }

    toggleNode(categoryId) {
        const node = this.element.querySelector(`[data-category-id="${categoryId}"]`);
        if (!node) return;
        
        const toggle = node.querySelector('.tree-toggle');
        const children = node.querySelector('.tree-children');
        
        if (!toggle || !children) return;
        
        if (this.expandedNodes.has(categoryId)) {
            this.expandedNodes.delete(categoryId);
            toggle.classList.remove('expanded');
            children.style.display = 'none';
        } else {
            this.expandedNodes.add(categoryId);
            toggle.classList.add('expanded');
            children.style.display = 'block';
        }
    }

    selectItem(item) {
        // Update selection state
        this.element.querySelectorAll('.tree-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        let selector;
        if (item.type === 'category') {
            selector = `[data-category-id="${item.id}"] > .tree-item`;
        } else {
            selector = `[data-component-id="${item.id}"] > .tree-item`;
        }
        
        const selected = this.element.querySelector(selector);
        if (selected) {
            selected.classList.add('selected');
        }
        
        this.selectedItem = item;
        this.emit('select', item);
    }

    handleCategoryAction(categoryId, action) {
        switch (action) {
            case 'add-component':
                this.emit('component-create', categoryId);
                break;
            case 'edit':
                this.emit('category-edit', categoryId);
                break;
            case 'delete':
                this.emit('category-delete', categoryId);
                break;
        }
    }

    expandAll() {
        this.element.querySelectorAll('.tree-node[data-category-id]').forEach(node => {
            const categoryId = node.dataset.categoryId;
            const children = node.querySelector('.tree-children');
            const toggle = node.querySelector('.tree-toggle');
            
            if (children && toggle) {
                this.expandedNodes.add(categoryId);
                toggle.classList.add('expanded');
                children.style.display = 'block';
            }
        });
    }

    collapseAll() {
        this.element.querySelectorAll('.tree-node[data-category-id]').forEach(node => {
            const categoryId = node.dataset.categoryId;
            const children = node.querySelector('.tree-children');
            const toggle = node.querySelector('.tree-toggle');
            
            if (children && toggle) {
                this.expandedNodes.delete(categoryId);
                toggle.classList.remove('expanded');
                children.style.display = 'none';
            }
        });
    }

    findAndSelectComponent(componentId) {
        // Find the component in the tree
        const componentNode = this.element.querySelector(`[data-component-id="${componentId}"]`);
        if (!componentNode) return false;
        
        // Expand parent categories
        let parent = componentNode.parentElement;
        while (parent) {
            if (parent.classList.contains('tree-node') && parent.dataset.categoryId) {
                this.expandedNodes.add(parent.dataset.categoryId);
                const toggle = parent.querySelector('.tree-toggle');
                const children = parent.querySelector('.tree-children');
                if (toggle && children) {
                    toggle.classList.add('expanded');
                    children.style.display = 'block';
                }
            }
            parent = parent.parentElement;
        }
        
        // Select the component
        this.selectItem({ type: 'component', id: componentId });
        
        // Scroll into view
        componentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        return true;
    }

    refresh() {
        // Re-render the tree while preserving expanded state
        const library = this.componentLibrary.getActiveLibrary();
        if (library) {
            this.loadLibrary(library);
        }
    }

    // Event handling
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => callback(data));
        }
    }

    getElement() {
        return this.element;
    }
}