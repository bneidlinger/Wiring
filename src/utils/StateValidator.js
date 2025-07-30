// State validation using JSON Schema-like validation
export class StateValidator {
    constructor() {
        this.schema = {
            type: 'object',
            required: ['version', 'project'],
            properties: {
                version: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+\\.\\d+$'
                },
                project: {
                    type: 'object',
                    required: ['name', 'canvasSettings', 'elements', 'wires'],
                    properties: {
                        name: { type: 'string' },
                        lastModified: { type: 'number' },
                        canvasSettings: {
                            type: 'object',
                            required: ['width', 'height'],
                            properties: {
                                width: { type: 'number', minimum: 100, maximum: 10000 },
                                height: { type: 'number', minimum: 100, maximum: 10000 },
                                backgroundImage: { type: ['string', 'null'] }
                            }
                        },
                        elements: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['id', 'type', 'x', 'y'],
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                    x: { type: 'number' },
                                    y: { type: 'number' },
                                    width: { type: 'number' },
                                    height: { type: 'number' },
                                    rotation: { type: 'number' },
                                    label: { type: 'string' },
                                    config: { type: 'object' }
                                }
                            }
                        },
                        wires: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['id', 'from', 'to'],
                                properties: {
                                    id: { type: 'string' },
                                    from: {
                                        type: 'object',
                                        required: ['elementId', 'connectionPoint'],
                                        properties: {
                                            elementId: { type: 'string' },
                                            connectionPoint: { type: 'string' }
                                        }
                                    },
                                    to: {
                                        type: 'object',
                                        required: ['elementId', 'connectionPoint'],
                                        properties: {
                                            elementId: { type: 'string' },
                                            connectionPoint: { type: 'string' }
                                        }
                                    },
                                    path: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['x', 'y'],
                                            properties: {
                                                x: { type: 'number' },
                                                y: { type: 'number' }
                                            }
                                        }
                                    },
                                    label: { type: 'string' },
                                    color: { type: 'string' },
                                    width: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    validate(state) {
        try {
            return this.validateValue(state, this.schema);
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    validateValue(value, schema, path = '') {
        // Check type
        if (schema.type) {
            const types = Array.isArray(schema.type) ? schema.type : [schema.type];
            const valueType = this.getType(value);
            
            if (!types.includes(valueType)) {
                throw new Error(`Invalid type at ${path}: expected ${types.join(' or ')}, got ${valueType}`);
            }
        }

        // Check required properties
        if (schema.required && schema.type === 'object') {
            for (const prop of schema.required) {
                if (!(prop in value)) {
                    throw new Error(`Missing required property at ${path}.${prop}`);
                }
            }
        }

        // Validate properties
        if (schema.properties && schema.type === 'object') {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in value) {
                    this.validateValue(value[key], propSchema, `${path}.${key}`);
                }
            }
        }

        // Validate array items
        if (schema.items && schema.type === 'array') {
            value.forEach((item, index) => {
                this.validateValue(item, schema.items, `${path}[${index}]`);
            });
        }

        // Check pattern
        if (schema.pattern && typeof value === 'string') {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                throw new Error(`Value at ${path} does not match pattern ${schema.pattern}`);
            }
        }

        // Check numeric constraints
        if (typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                throw new Error(`Value at ${path} is below minimum ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                throw new Error(`Value at ${path} exceeds maximum ${schema.maximum}`);
            }
        }

        return true;
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    // Attempt to repair common issues in state
    repair(state) {
        const repaired = JSON.parse(JSON.stringify(state));

        // Ensure version exists
        if (!repaired.version) {
            repaired.version = '2.0.0';
        }

        // Ensure project structure
        if (!repaired.project) {
            repaired.project = {
                name: 'Recovered Project',
                lastModified: Date.now(),
                canvasSettings: {
                    width: 5000,
                    height: 3000,
                    backgroundImage: null
                },
                elements: [],
                wires: []
            };
        }

        // Ensure arrays exist
        repaired.project.elements = repaired.project.elements || [];
        repaired.project.wires = repaired.project.wires || [];

        // Ensure lastModified
        repaired.project.lastModified = repaired.project.lastModified || Date.now();

        // Clean up invalid elements
        repaired.project.elements = repaired.project.elements.filter(el => {
            return el && el.id && el.type && 
                   typeof el.x === 'number' && 
                   typeof el.y === 'number';
        });

        // Clean up invalid wires
        repaired.project.wires = repaired.project.wires.filter(wire => {
            return wire && wire.id && wire.from && wire.to &&
                   wire.from.elementId && wire.from.connectionPoint &&
                   wire.to.elementId && wire.to.connectionPoint;
        });

        return repaired;
    }
}