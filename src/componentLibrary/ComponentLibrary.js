import { ComponentCategory } from './ComponentCategory.js';
import { ComponentTemplate } from './ComponentTemplate.js';
import { ComponentVersion } from './ComponentVersion.js';
import { ComponentMetadata } from './ComponentMetadata.js';

/**
 * ComponentLibrary - Core library management system
 * Handles component organization, versioning, and persistence
 */
export class ComponentLibrary {
    constructor(stateStore) {
        this.stateStore = stateStore;
        this.libraries = new Map(); // Map<libraryId, LibraryData>
        this.activeLibraryId = null;
        this.componentCache = new Map(); // Performance cache
        this.searchIndex = new Map(); // Search optimization
        this.favoriteComponents = new Set();
        
        // Initialize default library
        this.initializeDefaultLibrary();
        
        // Load user libraries
        this.loadLibraries();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    initializeDefaultLibrary() {
        const defaultLibrary = {
            id: 'default',
            name: 'System Components',
            description: 'Built-in system components',
            version: '1.0.0',
            author: 'System',
            isSystemLibrary: true,
            isEditable: false,
            categories: this.createDefaultCategories(),
            metadata: {
                created: Date.now(),
                modified: Date.now(),
                tags: ['system', 'default'],
                icon: 'assets/library-icon.svg'
            }
        };
        
        this.libraries.set('default', defaultLibrary);
        this.activeLibraryId = 'default';
    }

    createDefaultCategories() {
        const categories = new Map();
        
        // Access Control
        const accessControl = new ComponentCategory('access-control', 'Access Control', 'Components for access control systems');
        accessControl.addComponent(this.createSystemComponent('ACM', 'Access Control Module', 'access-control'));
        accessControl.addComponent(this.createSystemComponent('iSTAR', 'iSTAR Controller', 'access-control'));
        
        // Input Devices
        const inputDevices = new ComponentCategory('input-devices', 'Input Devices', 'Readers and input components');
        inputDevices.addComponent(this.createSystemComponent('READER', 'Card Reader', 'input-devices'));
        inputDevices.addComponent(this.createSystemComponent('WOR', 'Wireless Reader', 'input-devices'));
        inputDevices.addComponent(this.createSystemComponent('RM4', 'Reader Module', 'input-devices'));
        inputDevices.addComponent(this.createSystemComponent('REX', 'Request to Exit', 'input-devices'));
        
        // Output Devices
        const outputDevices = new ComponentCategory('output-devices', 'Output Devices', 'Locks and output components');
        outputDevices.addComponent(this.createSystemComponent('OUTPUT', 'Output Module', 'output-devices'));
        outputDevices.addComponent(this.createSystemComponent('STRIKE', 'Electric Strike', 'output-devices'));
        outputDevices.addComponent(this.createSystemComponent('PAM', 'Power Access Module', 'output-devices'));
        
        // Power Components
        const powerComponents = new ComponentCategory('power', 'Power Components', 'Power supplies and distribution');
        powerComponents.addComponent(this.createSystemComponent('PSU', 'Power Supply Unit', 'power'));
        
        categories.set('access-control', accessControl);
        categories.set('input-devices', inputDevices);
        categories.set('output-devices', outputDevices);
        categories.set('power', powerComponents);
        
        return categories;
    }

    createSystemComponent(type, name, category) {
        return new ComponentTemplate({
            id: `system-${type}`,
            type: type,
            name: name,
            category: category,
            version: new ComponentVersion('1.0.0'),
            metadata: new ComponentMetadata({
                description: `${name} system component`,
                tags: [category, type.toLowerCase(), 'system'],
                author: 'System',
                created: Date.now(),
                modified: Date.now(),
                icon: `assets/${type}.png`
            }),
            properties: this.getDefaultProperties(type),
            terminals: this.getDefaultTerminals(type),
            dimensions: this.getDefaultDimensions(type),
            isSystemComponent: true
        });
    }

    getDefaultProperties(type) {
        // Default properties based on component type
        const properties = {
            ACM: {
                inputs: { type: 'number', value: 8, min: 1, max: 16 },
                outputs: { type: 'number', value: 8, min: 1, max: 16 },
                voltage: { type: 'select', value: '12V', options: ['12V', '24V'] }
            },
            iSTAR: {
                readers: { type: 'number', value: 2, min: 1, max: 4 },
                doors: { type: 'number', value: 2, min: 1, max: 4 },
                networkType: { type: 'select', value: 'Ethernet', options: ['Ethernet', 'RS485'] }
            },
            PSU: {
                inputVoltage: { type: 'select', value: '120VAC', options: ['120VAC', '240VAC'] },
                outputVoltage: { type: 'select', value: '12VDC', options: ['12VDC', '24VDC'] },
                outputCurrent: { type: 'number', value: 10, min: 1, max: 50, unit: 'A' }
            },
            READER: {
                technology: { type: 'select', value: 'HID', options: ['HID', 'MIFARE', 'DESFire'] },
                interface: { type: 'select', value: 'Wiegand', options: ['Wiegand', 'OSDP', 'Clock/Data'] }
            }
        };
        
        return properties[type] || {};
    }

    getDefaultTerminals(type) {
        // Default terminal configurations
        const terminals = {
            ACM: [
                { id: 'power-in', type: 'power', position: 'top', label: 'PWR IN' },
                { id: 'power-out', type: 'power', position: 'bottom', label: 'PWR OUT' },
                { id: 'data-1', type: 'data', position: 'left', label: 'DATA 1' },
                { id: 'data-2', type: 'data', position: 'right', label: 'DATA 2' }
            ],
            PSU: [
                { id: 'ac-in-l', type: 'ac', position: 'top', label: 'L' },
                { id: 'ac-in-n', type: 'ac', position: 'top', label: 'N' },
                { id: 'dc-out-pos', type: 'dc', position: 'bottom', label: '+' },
                { id: 'dc-out-neg', type: 'dc', position: 'bottom', label: '-' }
            ],
            READER: [
                { id: 'power', type: 'power', position: 'top', label: 'PWR' },
                { id: 'data', type: 'data', position: 'bottom', label: 'DATA' }
            ]
        };
        
        return terminals[type] || [
            { id: 'default-1', type: 'universal', position: 'top', label: '1' },
            { id: 'default-2', type: 'universal', position: 'right', label: '2' },
            { id: 'default-3', type: 'universal', position: 'bottom', label: '3' },
            { id: 'default-4', type: 'universal', position: 'left', label: '4' }
        ];
    }

    getDefaultDimensions(type) {
        const dimensions = {
            ACM: { width: 400, height: 150 },
            iSTAR: { width: 350, height: 200 },
            OUTPUT: { width: 300, height: 150 },
            READER: { width: 100, height: 150 },
            WOR: { width: 120, height: 100 },
            RM4: { width: 250, height: 100 },
            PSU: { width: 200, height: 200 },
            PAM: { width: 100, height: 100 },
            STRIKE: { width: 80, height: 120 },
            REX: { width: 80, height: 80 }
        };
        
        return dimensions[type] || { width: 200, height: 100 };
    }

    // Create custom library
    createLibrary(name, description = '', metadata = {}) {
        const libraryId = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const library = {
            id: libraryId,
            name: name,
            description: description,
            version: '1.0.0',
            author: metadata.author || 'User',
            isSystemLibrary: false,
            isEditable: true,
            categories: new Map(),
            metadata: {
                created: Date.now(),
                modified: Date.now(),
                tags: metadata.tags || [],
                icon: metadata.icon || 'assets/custom-library-icon.svg',
                ...metadata
            }
        };
        
        this.libraries.set(libraryId, library);
        this.saveLibraries();
        
        return libraryId;
    }

    // Add category to library
    addCategory(libraryId, categoryName, description = '') {
        const library = this.libraries.get(libraryId);
        if (!library || !library.isEditable) {
            throw new Error('Cannot add category to this library');
        }
        
        const categoryId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const category = new ComponentCategory(categoryId, categoryName, description);
        
        library.categories.set(categoryId, category);
        library.metadata.modified = Date.now();
        
        this.saveLibraries();
        return categoryId;
    }

    // Create custom component from existing elements
    createComponentFromElements(libraryId, categoryId, componentData) {
        const library = this.libraries.get(libraryId);
        const category = library?.categories.get(categoryId);
        
        if (!category) {
            throw new Error('Invalid library or category');
        }
        
        const component = new ComponentTemplate({
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'CUSTOM',
            name: componentData.name,
            category: categoryId,
            version: new ComponentVersion('1.0.0'),
            metadata: new ComponentMetadata(componentData.metadata),
            properties: componentData.properties || {},
            terminals: componentData.terminals || [],
            dimensions: componentData.dimensions,
            elements: componentData.elements, // Store the constituent elements
            isSystemComponent: false
        });
        
        category.addComponent(component);
        library.metadata.modified = Date.now();
        
        // Update search index
        this.updateSearchIndex(component);
        
        this.saveLibraries();
        return component.id;
    }

    // Search components
    searchComponents(query, filters = {}) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [libraryId, library] of this.libraries) {
            // Apply library filter if specified
            if (filters.libraryId && libraryId !== filters.libraryId) continue;
            
            for (const [categoryId, category] of library.categories) {
                // Apply category filter if specified
                if (filters.categoryId && categoryId !== filters.categoryId) continue;
                
                for (const component of category.components.values()) {
                    // Search in name, description, tags
                    const searchText = `${component.name} ${component.metadata.description} ${component.metadata.tags.join(' ')}`.toLowerCase();
                    
                    if (searchText.includes(lowerQuery)) {
                        // Apply additional filters
                        if (filters.tags && filters.tags.length > 0) {
                            const hasAllTags = filters.tags.every(tag => 
                                component.metadata.tags.includes(tag)
                            );
                            if (!hasAllTags) continue;
                        }
                        
                        results.push({
                            component: component,
                            library: library,
                            category: category,
                            relevance: this.calculateRelevance(component, lowerQuery)
                        });
                    }
                }
            }
        }
        
        // Sort by relevance
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(component, query) {
        let relevance = 0;
        
        // Exact name match
        if (component.name.toLowerCase() === query) relevance += 10;
        // Name contains query
        else if (component.name.toLowerCase().includes(query)) relevance += 5;
        
        // Tag matches
        component.metadata.tags.forEach(tag => {
            if (tag.toLowerCase() === query) relevance += 3;
            else if (tag.toLowerCase().includes(query)) relevance += 1;
        });
        
        // Favorite components get a boost
        if (this.favoriteComponents.has(component.id)) relevance += 2;
        
        return relevance;
    }

    // Toggle favorite status
    toggleFavorite(componentId) {
        if (this.favoriteComponents.has(componentId)) {
            this.favoriteComponents.delete(componentId);
        } else {
            this.favoriteComponents.add(componentId);
        }
        
        this.saveLibraries();
    }

    // Get favorite components
    getFavoriteComponents() {
        const favorites = [];
        
        for (const [libraryId, library] of this.libraries) {
            for (const [categoryId, category] of library.categories) {
                for (const component of category.components.values()) {
                    if (this.favoriteComponents.has(component.id)) {
                        favorites.push({
                            component: component,
                            library: library,
                            category: category
                        });
                    }
                }
            }
        }
        
        return favorites;
    }

    // Export library
    exportLibrary(libraryId) {
        const library = this.libraries.get(libraryId);
        if (!library) {
            throw new Error('Library not found');
        }
        
        // Convert Maps to objects for JSON serialization
        const exportData = {
            ...library,
            categories: Array.from(library.categories.entries()).map(([id, category]) => ({
                id: id,
                ...category.toJSON()
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Import library
    importLibrary(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // Validate import data
            if (!importData.name || !importData.categories) {
                throw new Error('Invalid library format');
            }
            
            // Generate new ID to avoid conflicts
            const newLibraryId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Convert categories back to Map
            const categories = new Map();
            importData.categories.forEach(categoryData => {
                const category = ComponentCategory.fromJSON(categoryData);
                categories.set(category.id, category);
            });
            
            const library = {
                ...importData,
                id: newLibraryId,
                categories: categories,
                isSystemLibrary: false,
                isEditable: true,
                metadata: {
                    ...importData.metadata,
                    imported: Date.now()
                }
            };
            
            this.libraries.set(newLibraryId, library);
            this.saveLibraries();
            
            // Update search index for imported components
            for (const category of categories.values()) {
                for (const component of category.components.values()) {
                    this.updateSearchIndex(component);
                }
            }
            
            return newLibraryId;
        } catch (error) {
            throw new Error(`Failed to import library: ${error.message}`);
        }
    }

    // Update component
    updateComponent(componentId, updates) {
        let component = null;
        let library = null;
        let category = null;
        
        // Find component
        for (const [libId, lib] of this.libraries) {
            for (const [catId, cat] of lib.categories) {
                if (cat.components.has(componentId)) {
                    component = cat.components.get(componentId);
                    library = lib;
                    category = cat;
                    break;
                }
            }
            if (component) break;
        }
        
        if (!component || component.isSystemComponent) {
            throw new Error('Cannot update this component');
        }
        
        // Update component
        component.update(updates);
        library.metadata.modified = Date.now();
        
        // Update search index
        this.updateSearchIndex(component);
        
        this.saveLibraries();
    }

    // Clone component
    cloneComponent(componentId, targetLibraryId, targetCategoryId, newName) {
        const sourceComponent = this.findComponent(componentId);
        if (!sourceComponent) {
            throw new Error('Component not found');
        }
        
        const clonedData = {
            name: newName || `${sourceComponent.component.name} (Copy)`,
            metadata: {
                ...sourceComponent.component.metadata,
                clonedFrom: componentId,
                created: Date.now()
            },
            properties: { ...sourceComponent.component.properties },
            terminals: [...sourceComponent.component.terminals],
            dimensions: { ...sourceComponent.component.dimensions },
            elements: sourceComponent.component.elements ? [...sourceComponent.component.elements] : undefined
        };
        
        return this.createComponentFromElements(targetLibraryId, targetCategoryId, clonedData);
    }

    // Find component by ID
    findComponent(componentId) {
        for (const [libraryId, library] of this.libraries) {
            for (const [categoryId, category] of library.categories) {
                if (category.components.has(componentId)) {
                    return {
                        component: category.components.get(componentId),
                        library: library,
                        category: category
                    };
                }
            }
        }
        return null;
    }

    // Update search index
    updateSearchIndex(component) {
        // Create search tokens
        const tokens = new Set();
        
        // Add name tokens
        component.name.toLowerCase().split(/\s+/).forEach(token => tokens.add(token));
        
        // Add tag tokens
        component.metadata.tags.forEach(tag => tokens.add(tag.toLowerCase()));
        
        // Add description tokens
        if (component.metadata.description) {
            component.metadata.description.toLowerCase().split(/\s+/).forEach(token => {
                if (token.length > 2) tokens.add(token);
            });
        }
        
        // Store in search index
        this.searchIndex.set(component.id, tokens);
    }

    // Save libraries to storage
    saveLibraries() {
        const librariesData = {};
        
        for (const [id, library] of this.libraries) {
            if (!library.isSystemLibrary) {
                librariesData[id] = {
                    ...library,
                    categories: Array.from(library.categories.entries()).map(([catId, category]) => ({
                        id: catId,
                        ...category.toJSON()
                    }))
                };
            }
        }
        
        // Save to localStorage
        localStorage.setItem('componentLibraries', JSON.stringify(librariesData));
        
        // Save favorites
        localStorage.setItem('favoriteComponents', JSON.stringify([...this.favoriteComponents]));
        
        // Notify state store
        if (this.stateStore) {
            this.stateStore.setDirty(true);
        }
    }

    // Load libraries from storage
    loadLibraries() {
        try {
            // Load custom libraries
            const librariesData = localStorage.getItem('componentLibraries');
            if (librariesData) {
                const libraries = JSON.parse(librariesData);
                
                for (const [id, libraryData] of Object.entries(libraries)) {
                    // Convert categories back to Map
                    const categories = new Map();
                    if (libraryData.categories) {
                        libraryData.categories.forEach(categoryData => {
                            const category = ComponentCategory.fromJSON(categoryData);
                            categories.set(category.id, category);
                        });
                    }
                    
                    this.libraries.set(id, {
                        ...libraryData,
                        categories: categories
                    });
                }
            }
            
            // Load favorites
            const favoritesData = localStorage.getItem('favoriteComponents');
            if (favoritesData) {
                const favorites = JSON.parse(favoritesData);
                this.favoriteComponents = new Set(favorites);
            }
            
            // Rebuild search index
            for (const library of this.libraries.values()) {
                for (const category of library.categories.values()) {
                    for (const component of category.components.values()) {
                        this.updateSearchIndex(component);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load libraries:', error);
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Listen for component creation from canvas
        document.addEventListener('component-created', (event) => {
            const { elements, name, metadata } = event.detail;
            if (this.activeLibraryId && elements && elements.length > 0) {
                // Prompt user to save as custom component
                this.promptSaveAsComponent(elements, name, metadata);
            }
        });
        
        // Listen for library changes
        document.addEventListener('library-changed', (event) => {
            this.activeLibraryId = event.detail.libraryId;
        });
    }

    // Prompt to save selection as component
    promptSaveAsComponent(elements, suggestedName, metadata) {
        // This will be handled by the UI manager
        const event = new CustomEvent('prompt-save-component', {
            detail: {
                elements: elements,
                suggestedName: suggestedName,
                metadata: metadata,
                libraryId: this.activeLibraryId
            }
        });
        document.dispatchEvent(event);
    }

    // Get all libraries
    getAllLibraries() {
        return Array.from(this.libraries.values());
    }

    // Get active library
    getActiveLibrary() {
        return this.libraries.get(this.activeLibraryId);
    }

    // Set active library
    setActiveLibrary(libraryId) {
        if (this.libraries.has(libraryId)) {
            this.activeLibraryId = libraryId;
            
            // Notify UI
            const event = new CustomEvent('active-library-changed', {
                detail: { libraryId: libraryId }
            });
            document.dispatchEvent(event);
        }
    }

    // Delete library
    deleteLibrary(libraryId) {
        const library = this.libraries.get(libraryId);
        if (!library || library.isSystemLibrary) {
            throw new Error('Cannot delete this library');
        }
        
        this.libraries.delete(libraryId);
        
        // If this was the active library, switch to default
        if (this.activeLibraryId === libraryId) {
            this.setActiveLibrary('default');
        }
        
        this.saveLibraries();
    }

    // Delete component
    deleteComponent(componentId) {
        const result = this.findComponent(componentId);
        if (!result || result.component.isSystemComponent) {
            throw new Error('Cannot delete this component');
        }
        
        result.category.removeComponent(componentId);
        result.library.metadata.modified = Date.now();
        
        // Remove from favorites if present
        this.favoriteComponents.delete(componentId);
        
        // Remove from search index
        this.searchIndex.delete(componentId);
        
        this.saveLibraries();
    }
}