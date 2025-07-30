/**
 * ComponentSearch - Search interface for component library
 */
export class ComponentSearch {
    constructor(componentLibrary) {
        this.componentLibrary = componentLibrary;
        this.element = null;
        this.searchInput = null;
        this.filters = {
            libraryId: null,
            categoryId: null,
            tags: [],
            type: null,
            author: null
        };
        this.callbacks = new Map();
        
        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'component-search';
        this.element.innerHTML = this.getTemplate();
        
        this.searchInput = this.element.querySelector('#search-input');
        this.setupEventListeners();
    }

    getTemplate() {
        return `
            <div class="search-container">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
                        <path d="M10 10l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <input type="text" id="search-input" placeholder="Search components..." autocomplete="off" />
                    <button class="btn-clear" id="btn-clear-search" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.2"/>
                            <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <button class="btn-filters" id="btn-toggle-filters">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Filters
                </button>
            </div>
            
            <div class="search-filters" id="search-filters" style="display: none;">
                <div class="filter-group">
                    <label>Type:</label>
                    <select id="filter-type">
                        <option value="">All Types</option>
                        <option value="ACM">ACM</option>
                        <option value="iSTAR">iSTAR</option>
                        <option value="READER">Reader</option>
                        <option value="PSU">Power Supply</option>
                        <option value="CUSTOM">Custom</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Author:</label>
                    <input type="text" id="filter-author" placeholder="Filter by author" />
                </div>
                
                <div class="filter-group">
                    <label>Tags:</label>
                    <div class="tag-input-container">
                        <input type="text" id="tag-input" placeholder="Add tag..." />
                        <div class="selected-tags" id="selected-tags"></div>
                    </div>
                </div>
                
                <div class="filter-actions">
                    <button class="btn-secondary" id="btn-clear-filters">Clear Filters</button>
                    <button class="btn-primary" id="btn-apply-filters">Apply</button>
                </div>
            </div>
            
            <div class="search-suggestions" id="search-suggestions" style="display: none;">
                <!-- Suggestions will be populated here -->
            </div>
        `;
    }

    setupEventListeners() {
        // Search input
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            
            // Show/hide clear button
            this.element.querySelector('#btn-clear-search').style.display = query ? 'block' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
            
            // Show suggestions for short queries
            if (query.length >= 2) {
                this.showSuggestions(query);
            } else {
                this.hideSuggestions();
            }
        });

        // Clear search
        this.element.querySelector('#btn-clear-search').addEventListener('click', () => {
            this.searchInput.value = '';
            this.element.querySelector('#btn-clear-search').style.display = 'none';
            this.hideSuggestions();
            this.performSearch('');
        });

        // Toggle filters
        this.element.querySelector('#btn-toggle-filters').addEventListener('click', () => {
            const filtersPanel = this.element.querySelector('#search-filters');
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.populateFilterOptions();
            }
        });

        // Tag input
        const tagInput = this.element.querySelector('#tag-input');
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });

        // Clear filters
        this.element.querySelector('#btn-clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Apply filters
        this.element.querySelector('#btn-apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Handle clicks outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    performSearch(query = '') {
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery && !this.hasActiveFilters()) {
            // Show all components if no search query and no filters
            this.emit('search', []);
            return;
        }
        
        const results = this.componentLibrary.searchComponents(trimmedQuery, this.filters);
        this.emit('search', results);
    }

    showSuggestions(query) {
        const suggestions = this.generateSuggestions(query);
        const container = this.element.querySelector('#search-suggestions');
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-value="${suggestion.value}" data-type="${suggestion.type}">
                <span class="suggestion-icon">${this.getSuggestionIcon(suggestion.type)}</span>
                <span class="suggestion-text">${this.highlightMatch(suggestion.text, query)}</span>
                ${suggestion.count ? `<span class="suggestion-count">(${suggestion.count})</span>` : ''}
            </div>
        `).join('');
        
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.applySuggestion(item.dataset.value, item.dataset.type);
            });
        });
    }

    generateSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // Get all components
        const allComponents = [];
        for (const library of this.componentLibrary.libraries.values()) {
            for (const category of library.categories.values()) {
                allComponents.push(...category.getAllComponents());
            }
        }
        
        // Component name suggestions
        const nameMatches = allComponents
            .filter(comp => comp.name.toLowerCase().includes(lowerQuery))
            .slice(0, 3)
            .map(comp => ({
                type: 'component',
                value: comp.name,
                text: comp.name,
                component: comp
            }));
        
        suggestions.push(...nameMatches);
        
        // Tag suggestions
        const tagCounts = new Map();
        allComponents.forEach(comp => {
            comp.metadata.tags.forEach(tag => {
                if (tag.toLowerCase().includes(lowerQuery)) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            });
        });
        
        const tagSuggestions = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag, count]) => ({
                type: 'tag',
                value: tag,
                text: `Tag: ${tag}`,
                count: count
            }));
        
        suggestions.push(...tagSuggestions);
        
        // Type suggestions
        const types = ['ACM', 'iSTAR', 'READER', 'PSU', 'CUSTOM'];
        const typeMatches = types
            .filter(type => type.toLowerCase().includes(lowerQuery))
            .map(type => ({
                type: 'type',
                value: type,
                text: `Type: ${type}`
            }));
        
        suggestions.push(...typeMatches);
        
        return suggestions;
    }

    getSuggestionIcon(type) {
        const icons = {
            component: '📦',
            tag: '🏷️',
            type: '🔧',
            author: '👤'
        };
        return icons[type] || '🔍';
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    applySuggestion(value, type) {
        switch (type) {
            case 'component':
                this.searchInput.value = value;
                break;
            case 'tag':
                this.addTag(value);
                this.searchInput.value = '';
                break;
            case 'type':
                this.element.querySelector('#filter-type').value = value;
                this.searchInput.value = '';
                break;
        }
        
        this.hideSuggestions();
        this.performSearch(this.searchInput.value);
    }

    hideSuggestions() {
        this.element.querySelector('#search-suggestions').style.display = 'none';
    }

    populateFilterOptions() {
        // This could be enhanced to dynamically populate filter options
        // based on available components
    }

    addTag(tag) {
        if (!this.filters.tags.includes(tag)) {
            this.filters.tags.push(tag);
            this.updateTagDisplay();
        }
    }

    removeTag(tag) {
        const index = this.filters.tags.indexOf(tag);
        if (index > -1) {
            this.filters.tags.splice(index, 1);
            this.updateTagDisplay();
        }
    }

    updateTagDisplay() {
        const container = this.element.querySelector('#selected-tags');
        container.innerHTML = this.filters.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button class="tag-remove" data-tag="${tag}">×</button>
            </span>
        `).join('');
        
        // Add remove handlers
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeTag(btn.dataset.tag);
            });
        });
    }

    clearFilters() {
        this.filters = {
            libraryId: null,
            categoryId: null,
            tags: [],
            type: null,
            author: null
        };
        
        // Clear UI
        this.element.querySelector('#filter-type').value = '';
        this.element.querySelector('#filter-author').value = '';
        this.updateTagDisplay();
    }

    applyFilters() {
        this.filters.type = this.element.querySelector('#filter-type').value || null;
        this.filters.author = this.element.querySelector('#filter-author').value || null;
        
        this.performSearch(this.searchInput.value);
        
        // Hide filters panel
        this.element.querySelector('#search-filters').style.display = 'none';
    }

    hasActiveFilters() {
        return this.filters.tags.length > 0 ||
               this.filters.type !== null ||
               this.filters.author !== null ||
               this.filters.libraryId !== null ||
               this.filters.categoryId !== null;
    }

    setLibraryFilter(libraryId) {
        this.filters.libraryId = libraryId;
        this.performSearch(this.searchInput.value);
    }

    setCategoryFilter(categoryId) {
        this.filters.categoryId = categoryId;
        this.performSearch(this.searchInput.value);
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

    focus() {
        this.searchInput.focus();
    }

    clear() {
        this.searchInput.value = '';
        this.clearFilters();
        this.hideSuggestions();
        this.element.querySelector('#btn-clear-search').style.display = 'none';
    }
}