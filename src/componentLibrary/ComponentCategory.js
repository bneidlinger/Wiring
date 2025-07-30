/**
 * ComponentCategory - Organizes components into logical groups
 */
export class ComponentCategory {
    constructor(id, name, description = '') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.components = new Map(); // Map<componentId, ComponentTemplate>
        this.subcategories = new Map(); // Map<subcategoryId, ComponentCategory>
        this.metadata = {
            created: Date.now(),
            modified: Date.now(),
            componentCount: 0
        };
    }

    // Add component to category
    addComponent(component) {
        this.components.set(component.id, component);
        this.metadata.componentCount = this.components.size;
        this.metadata.modified = Date.now();
        return component.id;
    }

    // Remove component from category
    removeComponent(componentId) {
        const result = this.components.delete(componentId);
        if (result) {
            this.metadata.componentCount = this.components.size;
            this.metadata.modified = Date.now();
        }
        return result;
    }

    // Add subcategory
    addSubcategory(subcategory) {
        this.subcategories.set(subcategory.id, subcategory);
        this.metadata.modified = Date.now();
        return subcategory.id;
    }

    // Remove subcategory
    removeSubcategory(subcategoryId) {
        const result = this.subcategories.delete(subcategoryId);
        if (result) {
            this.metadata.modified = Date.now();
        }
        return result;
    }

    // Get component by ID
    getComponent(componentId) {
        // Check this category
        if (this.components.has(componentId)) {
            return this.components.get(componentId);
        }
        
        // Check subcategories
        for (const subcategory of this.subcategories.values()) {
            const component = subcategory.getComponent(componentId);
            if (component) return component;
        }
        
        return null;
    }

    // Get all components (including from subcategories)
    getAllComponents(includeSubcategories = true) {
        const components = Array.from(this.components.values());
        
        if (includeSubcategories) {
            for (const subcategory of this.subcategories.values()) {
                components.push(...subcategory.getAllComponents(true));
            }
        }
        
        return components;
    }

    // Search components in this category
    searchComponents(query, recursive = true) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search in this category
        for (const component of this.components.values()) {
            const searchText = `${component.name} ${component.metadata.description} ${component.metadata.tags.join(' ')}`.toLowerCase();
            if (searchText.includes(lowerQuery)) {
                results.push(component);
            }
        }
        
        // Search in subcategories if recursive
        if (recursive) {
            for (const subcategory of this.subcategories.values()) {
                results.push(...subcategory.searchComponents(query, true));
            }
        }
        
        return results;
    }

    // Get components by tag
    getComponentsByTag(tag, recursive = true) {
        const results = [];
        
        // Check this category
        for (const component of this.components.values()) {
            if (component.metadata.tags.includes(tag)) {
                results.push(component);
            }
        }
        
        // Check subcategories if recursive
        if (recursive) {
            for (const subcategory of this.subcategories.values()) {
                results.push(...subcategory.getComponentsByTag(tag, true));
            }
        }
        
        return results;
    }

    // Move component to another category
    moveComponent(componentId, targetCategory) {
        const component = this.components.get(componentId);
        if (!component) return false;
        
        this.removeComponent(componentId);
        targetCategory.addComponent(component);
        
        return true;
    }

    // Merge with another category
    mergeWith(otherCategory) {
        // Merge components
        for (const [id, component] of otherCategory.components) {
            this.addComponent(component);
        }
        
        // Merge subcategories
        for (const [id, subcategory] of otherCategory.subcategories) {
            this.addSubcategory(subcategory);
        }
        
        this.metadata.modified = Date.now();
    }

    // Get category statistics
    getStatistics() {
        const stats = {
            directComponents: this.components.size,
            totalComponents: this.getAllComponents(true).length,
            subcategories: this.subcategories.size,
            tags: new Set(),
            authors: new Set(),
            lastModified: this.metadata.modified
        };
        
        // Collect unique tags and authors
        for (const component of this.getAllComponents(true)) {
            component.metadata.tags.forEach(tag => stats.tags.add(tag));
            if (component.metadata.author) {
                stats.authors.add(component.metadata.author);
            }
        }
        
        stats.tags = Array.from(stats.tags);
        stats.authors = Array.from(stats.authors);
        
        return stats;
    }

    // Convert to JSON for export
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            components: Array.from(this.components.entries()).map(([id, component]) => ({
                id: id,
                ...component.toJSON()
            })),
            subcategories: Array.from(this.subcategories.entries()).map(([id, subcategory]) => ({
                id: id,
                ...subcategory.toJSON()
            })),
            metadata: this.metadata
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const category = new ComponentCategory(data.id, data.name, data.description);
        
        // Restore metadata
        if (data.metadata) {
            category.metadata = { ...category.metadata, ...data.metadata };
        }
        
        // Restore components
        if (data.components) {
            data.components.forEach(componentData => {
                const component = ComponentTemplate.fromJSON(componentData);
                category.components.set(component.id, component);
            });
        }
        
        // Restore subcategories
        if (data.subcategories) {
            data.subcategories.forEach(subcategoryData => {
                const subcategory = ComponentCategory.fromJSON(subcategoryData);
                category.subcategories.set(subcategory.id, subcategory);
            });
        }
        
        return category;
    }

    // Clone category
    clone(newId = null) {
        const clonedId = newId || `${this.id}-clone-${Date.now()}`;
        const cloned = new ComponentCategory(clonedId, `${this.name} (Copy)`, this.description);
        
        // Clone components
        for (const [id, component] of this.components) {
            const clonedComponent = component.clone();
            cloned.addComponent(clonedComponent);
        }
        
        // Clone subcategories
        for (const [id, subcategory] of this.subcategories) {
            const clonedSubcategory = subcategory.clone();
            cloned.addSubcategory(clonedSubcategory);
        }
        
        return cloned;
    }
}

// Import ComponentTemplate to avoid circular dependency
import { ComponentTemplate } from './ComponentTemplate.js';