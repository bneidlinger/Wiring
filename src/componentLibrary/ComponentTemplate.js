import { ComponentVersion } from './ComponentVersion.js';
import { ComponentMetadata } from './ComponentMetadata.js';

/**
 * ComponentTemplate - Defines a reusable component with configurable properties
 */
export class ComponentTemplate {
    constructor(config) {
        this.id = config.id;
        this.type = config.type;
        this.name = config.name;
        this.category = config.category;
        this.version = config.version instanceof ComponentVersion ? config.version : new ComponentVersion(config.version);
        this.metadata = config.metadata instanceof ComponentMetadata ? config.metadata : new ComponentMetadata(config.metadata);
        
        // Component structure
        this.properties = config.properties || {};
        this.terminals = config.terminals || [];
        this.dimensions = config.dimensions || { width: 200, height: 100 };
        this.elements = config.elements || null; // For custom components made from multiple elements
        
        // Visual representation
        this.appearance = {
            backgroundColor: config.appearance?.backgroundColor || '#f8f8f8',
            borderColor: config.appearance?.borderColor || '#333',
            borderWidth: config.appearance?.borderWidth || 2,
            borderRadius: config.appearance?.borderRadius || 5,
            iconPath: config.appearance?.iconPath || this.metadata.icon,
            showLabel: config.appearance?.showLabel !== false,
            labelPosition: config.appearance?.labelPosition || 'bottom'
        };
        
        // Behavior
        this.behavior = {
            resizable: config.behavior?.resizable || false,
            rotatable: config.behavior?.rotatable !== false,
            connectRules: config.behavior?.connectRules || {},
            validationRules: config.behavior?.validationRules || []
        };
        
        // Flags
        this.isSystemComponent = config.isSystemComponent || false;
        this.isLocked = config.isLocked || false;
        this.isDeprecated = config.isDeprecated || false;
    }

    // Create instance of this template
    createInstance(instanceConfig = {}) {
        const instance = {
            id: instanceConfig.id || `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            templateId: this.id,
            type: this.type,
            name: instanceConfig.name || this.name,
            position: instanceConfig.position || { x: 0, y: 0 },
            rotation: instanceConfig.rotation || 0,
            properties: this.createPropertyInstances(instanceConfig.properties),
            terminals: this.createTerminalInstances(),
            dimensions: { ...this.dimensions, ...(instanceConfig.dimensions || {}) },
            appearance: { ...this.appearance, ...(instanceConfig.appearance || {}) },
            metadata: {
                created: Date.now(),
                modified: Date.now(),
                templateVersion: this.version.toString(),
                ...instanceConfig.metadata
            }
        };
        
        // If this is a custom component with elements, include them
        if (this.elements) {
            instance.elements = this.cloneElements(this.elements);
        }
        
        return instance;
    }

    // Create property instances with default values
    createPropertyInstances(overrides = {}) {
        const instances = {};
        
        for (const [key, propDef] of Object.entries(this.properties)) {
            instances[key] = {
                ...propDef,
                value: overrides[key] !== undefined ? overrides[key] : propDef.value
            };
        }
        
        return instances;
    }

    // Create terminal instances
    createTerminalInstances() {
        return this.terminals.map((terminal, index) => ({
            ...terminal,
            instanceId: `${terminal.id}_${Date.now()}_${index}`,
            connected: false,
            connectionId: null
        }));
    }

    // Clone elements for custom components
    cloneElements(elements) {
        return elements.map(element => ({
            ...element,
            id: `${element.id}_clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }

    // Update template
    update(updates) {
        if (this.isSystemComponent || this.isLocked) {
            throw new Error('Cannot update locked or system components');
        }
        
        // Update basic properties
        if (updates.name !== undefined) this.name = updates.name;
        if (updates.category !== undefined) this.category = updates.category;
        
        // Update metadata
        if (updates.metadata) {
            this.metadata.update(updates.metadata);
        }
        
        // Update properties
        if (updates.properties) {
            this.properties = { ...this.properties, ...updates.properties };
        }
        
        // Update terminals
        if (updates.terminals) {
            this.terminals = updates.terminals;
        }
        
        // Update dimensions
        if (updates.dimensions) {
            this.dimensions = { ...this.dimensions, ...updates.dimensions };
        }
        
        // Update appearance
        if (updates.appearance) {
            this.appearance = { ...this.appearance, ...updates.appearance };
        }
        
        // Update behavior
        if (updates.behavior) {
            this.behavior = { ...this.behavior, ...updates.behavior };
        }
        
        // Increment version for significant changes
        if (updates.incrementVersion) {
            this.version.increment(updates.versionType || 'patch');
        }
        
        this.metadata.modified = Date.now();
    }

    // Validate instance properties
    validateInstance(instance) {
        const errors = [];
        
        // Validate required properties
        for (const [key, propDef] of Object.entries(this.properties)) {
            if (propDef.required && !instance.properties[key]) {
                errors.push(`Missing required property: ${key}`);
            }
            
            // Type validation
            if (instance.properties[key] !== undefined) {
                const value = instance.properties[key].value || instance.properties[key];
                if (!this.validatePropertyType(value, propDef.type)) {
                    errors.push(`Invalid type for property ${key}: expected ${propDef.type}`);
                }
                
                // Range validation for numbers
                if (propDef.type === 'number') {
                    if (propDef.min !== undefined && value < propDef.min) {
                        errors.push(`Property ${key} is below minimum value ${propDef.min}`);
                    }
                    if (propDef.max !== undefined && value > propDef.max) {
                        errors.push(`Property ${key} exceeds maximum value ${propDef.max}`);
                    }
                }
                
                // Options validation for select
                if (propDef.type === 'select' && propDef.options) {
                    if (!propDef.options.includes(value)) {
                        errors.push(`Invalid option for property ${key}: ${value}`);
                    }
                }
            }
        }
        
        // Run custom validation rules
        for (const rule of this.behavior.validationRules) {
            const result = rule(instance);
            if (result !== true) {
                errors.push(result);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate property type
    validatePropertyType(value, type) {
        switch (type) {
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'string':
                return typeof value === 'string';
            case 'boolean':
                return typeof value === 'boolean';
            case 'select':
                return typeof value === 'string';
            case 'color':
                return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
            default:
                return true;
        }
    }

    // Get connection rules for terminals
    getConnectionRules(terminalType) {
        return this.behavior.connectRules[terminalType] || {
            allowMultiple: true,
            compatibleTypes: ['universal'],
            maxConnections: -1
        };
    }

    // Check if can connect to another component
    canConnectTo(sourceTerminal, targetComponent, targetTerminal) {
        const sourceRules = this.getConnectionRules(sourceTerminal.type);
        const targetRules = targetComponent.getConnectionRules(targetTerminal.type);
        
        // Check type compatibility
        const sourceAllows = sourceRules.compatibleTypes.includes(targetTerminal.type) || 
                           sourceRules.compatibleTypes.includes('universal');
        const targetAllows = targetRules.compatibleTypes.includes(sourceTerminal.type) || 
                           targetRules.compatibleTypes.includes('universal');
        
        return sourceAllows && targetAllows;
    }

    // Clone template
    clone(newId = null) {
        const clonedId = newId || `${this.id}-clone-${Date.now()}`;
        
        return new ComponentTemplate({
            id: clonedId,
            type: this.type,
            name: `${this.name} (Copy)`,
            category: this.category,
            version: this.version.clone(),
            metadata: this.metadata.clone(),
            properties: JSON.parse(JSON.stringify(this.properties)),
            terminals: JSON.parse(JSON.stringify(this.terminals)),
            dimensions: { ...this.dimensions },
            elements: this.elements ? JSON.parse(JSON.stringify(this.elements)) : null,
            appearance: { ...this.appearance },
            behavior: {
                ...this.behavior,
                connectRules: { ...this.behavior.connectRules },
                validationRules: [...this.behavior.validationRules]
            },
            isSystemComponent: false,
            isLocked: false,
            isDeprecated: this.isDeprecated
        });
    }

    // Convert to JSON for export
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            category: this.category,
            version: this.version.toString(),
            metadata: this.metadata.toJSON(),
            properties: this.properties,
            terminals: this.terminals,
            dimensions: this.dimensions,
            elements: this.elements,
            appearance: this.appearance,
            behavior: {
                ...this.behavior,
                validationRules: this.behavior.validationRules.map(rule => rule.toString())
            },
            isSystemComponent: this.isSystemComponent,
            isLocked: this.isLocked,
            isDeprecated: this.isDeprecated
        };
    }

    // Create from JSON
    static fromJSON(data) {
        // Convert validation rules from strings back to functions
        const validationRules = data.behavior?.validationRules?.map(ruleStr => {
            try {
                return new Function('instance', ruleStr);
            } catch (e) {
                console.warn('Failed to parse validation rule:', e);
                return () => true;
            }
        }) || [];
        
        return new ComponentTemplate({
            ...data,
            version: new ComponentVersion(data.version),
            metadata: new ComponentMetadata(data.metadata),
            behavior: {
                ...data.behavior,
                validationRules: validationRules
            }
        });
    }

    // Get thumbnail representation
    getThumbnail(size = 100) {
        // Generate SVG thumbnail
        const aspectRatio = this.dimensions.width / this.dimensions.height;
        const width = aspectRatio >= 1 ? size : size * aspectRatio;
        const height = aspectRatio >= 1 ? size / aspectRatio : size;
        
        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${this.dimensions.width} ${this.dimensions.height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${this.dimensions.width}" height="${this.dimensions.height}" 
                      fill="${this.appearance.backgroundColor}" 
                      stroke="${this.appearance.borderColor}" 
                      stroke-width="${this.appearance.borderWidth}"
                      rx="${this.appearance.borderRadius}" />
                ${this.appearance.iconPath ? 
                    `<image href="${this.appearance.iconPath}" 
                            x="${this.dimensions.width * 0.1}" 
                            y="${this.dimensions.height * 0.1}" 
                            width="${this.dimensions.width * 0.8}" 
                            height="${this.dimensions.height * 0.8}"
                            preserveAspectRatio="xMidYMid meet" />` : 
                    `<text x="${this.dimensions.width / 2}" 
                           y="${this.dimensions.height / 2}" 
                           text-anchor="middle" 
                           dominant-baseline="middle"
                           font-size="${Math.min(this.dimensions.width, this.dimensions.height) * 0.2}"
                           fill="${this.appearance.borderColor}">${this.type}</text>`
                }
                ${this.terminals.map(terminal => {
                    const pos = this.getTerminalPosition(terminal, this.dimensions);
                    return `<circle cx="${pos.x}" cy="${pos.y}" r="6" fill="#666" stroke="#333" stroke-width="2" />`;
                }).join('')}
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    // Get terminal position based on position string
    getTerminalPosition(terminal, dimensions) {
        const positions = {
            'top': { x: dimensions.width / 2, y: 0 },
            'bottom': { x: dimensions.width / 2, y: dimensions.height },
            'left': { x: 0, y: dimensions.height / 2 },
            'right': { x: dimensions.width, y: dimensions.height / 2 },
            'top-left': { x: 0, y: 0 },
            'top-right': { x: dimensions.width, y: 0 },
            'bottom-left': { x: 0, y: dimensions.height },
            'bottom-right': { x: dimensions.width, y: dimensions.height }
        };
        
        return positions[terminal.position] || { x: terminal.x || 0, y: terminal.y || 0 };
    }
}