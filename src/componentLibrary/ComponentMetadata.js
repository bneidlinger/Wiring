/**
 * ComponentMetadata - Manages component metadata including description, tags, and author info
 */
export class ComponentMetadata {
    constructor(data = {}) {
        this.description = data.description || '';
        this.tags = data.tags || [];
        this.author = data.author || 'Unknown';
        this.license = data.license || '';
        this.created = data.created || Date.now();
        this.modified = data.modified || Date.now();
        this.icon = data.icon || null;
        this.thumbnail = data.thumbnail || null;
        this.documentation = data.documentation || '';
        this.examples = data.examples || [];
        this.dependencies = data.dependencies || [];
        this.keywords = data.keywords || [];
        this.ratings = data.ratings || { average: 0, count: 0 };
        this.usage = data.usage || { count: 0, lastUsed: null };
        this.customFields = data.customFields || {};
    }

    // Update metadata
    update(updates) {
        if (updates.description !== undefined) this.description = updates.description;
        if (updates.author !== undefined) this.author = updates.author;
        if (updates.license !== undefined) this.license = updates.license;
        if (updates.icon !== undefined) this.icon = updates.icon;
        if (updates.thumbnail !== undefined) this.thumbnail = updates.thumbnail;
        if (updates.documentation !== undefined) this.documentation = updates.documentation;
        
        // Update arrays
        if (updates.tags) {
            if (updates.mergeTags) {
                this.tags = [...new Set([...this.tags, ...updates.tags])];
            } else {
                this.tags = updates.tags;
            }
        }
        
        if (updates.keywords) {
            if (updates.mergeKeywords) {
                this.keywords = [...new Set([...this.keywords, ...updates.keywords])];
            } else {
                this.keywords = updates.keywords;
            }
        }
        
        if (updates.examples) {
            if (updates.mergeExamples) {
                this.examples = [...this.examples, ...updates.examples];
            } else {
                this.examples = updates.examples;
            }
        }
        
        if (updates.dependencies) {
            if (updates.mergeDependencies) {
                this.dependencies = [...new Set([...this.dependencies, ...updates.dependencies])];
            } else {
                this.dependencies = updates.dependencies;
            }
        }
        
        // Update custom fields
        if (updates.customFields) {
            this.customFields = { ...this.customFields, ...updates.customFields };
        }
        
        this.modified = Date.now();
    }

    // Add tag
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.modified = Date.now();
        }
    }

    // Remove tag
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.modified = Date.now();
        }
    }

    // Add example
    addExample(example) {
        this.examples.push({
            id: `example-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: example.title || 'Untitled Example',
            description: example.description || '',
            code: example.code || '',
            image: example.image || null,
            created: Date.now()
        });
        this.modified = Date.now();
    }

    // Remove example
    removeExample(exampleId) {
        const index = this.examples.findIndex(ex => ex.id === exampleId);
        if (index > -1) {
            this.examples.splice(index, 1);
            this.modified = Date.now();
        }
    }

    // Add dependency
    addDependency(componentId, version = '*') {
        const dep = { componentId, version };
        const exists = this.dependencies.find(d => d.componentId === componentId);
        
        if (!exists) {
            this.dependencies.push(dep);
            this.modified = Date.now();
        }
    }

    // Remove dependency
    removeDependency(componentId) {
        const index = this.dependencies.findIndex(d => d.componentId === componentId);
        if (index > -1) {
            this.dependencies.splice(index, 1);
            this.modified = Date.now();
        }
    }

    // Update rating
    addRating(rating) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        
        const totalRating = this.ratings.average * this.ratings.count;
        this.ratings.count++;
        this.ratings.average = (totalRating + rating) / this.ratings.count;
        this.modified = Date.now();
    }

    // Track usage
    trackUsage() {
        this.usage.count++;
        this.usage.lastUsed = Date.now();
        // Don't update modified timestamp for usage tracking
    }

    // Get custom field
    getCustomField(key) {
        return this.customFields[key];
    }

    // Set custom field
    setCustomField(key, value) {
        this.customFields[key] = value;
        this.modified = Date.now();
    }

    // Delete custom field
    deleteCustomField(key) {
        delete this.customFields[key];
        this.modified = Date.now();
    }

    // Search within metadata
    matchesSearch(query) {
        const lowerQuery = query.toLowerCase();
        const searchText = `${this.description} ${this.tags.join(' ')} ${this.keywords.join(' ')} ${this.author}`.toLowerCase();
        return searchText.includes(lowerQuery);
    }

    // Get all searchable text
    getSearchableText() {
        return [
            this.description,
            ...this.tags,
            ...this.keywords,
            this.author,
            this.documentation,
            ...this.examples.map(ex => `${ex.title} ${ex.description}`)
        ].join(' ');
    }

    // Validate metadata
    validate() {
        const errors = [];
        
        if (!this.description || this.description.trim().length === 0) {
            errors.push('Description is required');
        }
        
        if (!this.author || this.author.trim().length === 0) {
            errors.push('Author is required');
        }
        
        if (this.tags.length === 0) {
            errors.push('At least one tag is required');
        }
        
        // Validate dependencies
        for (const dep of this.dependencies) {
            if (!dep.componentId) {
                errors.push('Invalid dependency: missing component ID');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Generate summary
    getSummary() {
        return {
            description: this.description.substring(0, 100) + (this.description.length > 100 ? '...' : ''),
            tags: this.tags.slice(0, 5),
            author: this.author,
            created: new Date(this.created).toLocaleDateString(),
            modified: new Date(this.modified).toLocaleDateString(),
            rating: this.ratings.average.toFixed(1),
            usageCount: this.usage.count
        };
    }

    // Clone metadata
    clone() {
        return new ComponentMetadata({
            description: this.description,
            tags: [...this.tags],
            author: this.author,
            license: this.license,
            created: this.created,
            modified: Date.now(),
            icon: this.icon,
            thumbnail: this.thumbnail,
            documentation: this.documentation,
            examples: this.examples.map(ex => ({ ...ex })),
            dependencies: this.dependencies.map(dep => ({ ...dep })),
            keywords: [...this.keywords],
            ratings: { ...this.ratings },
            usage: { ...this.usage },
            customFields: { ...this.customFields }
        });
    }

    // Convert to JSON
    toJSON() {
        return {
            description: this.description,
            tags: this.tags,
            author: this.author,
            license: this.license,
            created: this.created,
            modified: this.modified,
            icon: this.icon,
            thumbnail: this.thumbnail,
            documentation: this.documentation,
            examples: this.examples,
            dependencies: this.dependencies,
            keywords: this.keywords,
            ratings: this.ratings,
            usage: this.usage,
            customFields: this.customFields
        };
    }

    // Create from JSON
    static fromJSON(data) {
        return new ComponentMetadata(data);
    }

    // Merge with another metadata object
    mergeWith(other) {
        if (!(other instanceof ComponentMetadata)) {
            other = new ComponentMetadata(other);
        }
        
        return new ComponentMetadata({
            description: this.description || other.description,
            tags: [...new Set([...this.tags, ...other.tags])],
            author: this.author,
            license: this.license || other.license,
            created: Math.min(this.created, other.created),
            modified: Date.now(),
            icon: this.icon || other.icon,
            thumbnail: this.thumbnail || other.thumbnail,
            documentation: this.documentation || other.documentation,
            examples: [...this.examples, ...other.examples],
            dependencies: [...new Set([...this.dependencies, ...other.dependencies])],
            keywords: [...new Set([...this.keywords, ...other.keywords])],
            ratings: {
                average: (this.ratings.average * this.ratings.count + other.ratings.average * other.ratings.count) / 
                        (this.ratings.count + other.ratings.count) || 0,
                count: this.ratings.count + other.ratings.count
            },
            usage: {
                count: this.usage.count + other.usage.count,
                lastUsed: Math.max(this.usage.lastUsed || 0, other.usage.lastUsed || 0)
            },
            customFields: { ...other.customFields, ...this.customFields }
        });
    }
}