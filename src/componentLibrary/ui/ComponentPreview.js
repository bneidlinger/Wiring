/**
 * ComponentPreview - Shows detailed preview and information about a component
 */
export class ComponentPreview {
    constructor(componentLibrary) {
        this.componentLibrary = componentLibrary;
        this.element = null;
        this.currentComponent = null;
        
        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'component-preview';
        this.element.innerHTML = this.getTemplate();
        
        this.setupEventListeners();
    }

    getTemplate() {
        return `
            <div class="preview-header">
                <h3>Component Details</h3>
                <button class="btn-close" id="btn-close-preview">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="preview-content" id="preview-content">
                <div class="preview-empty">
                    <svg width="48" height="48" viewBox="0 0 48 48" opacity="0.3">
                        <rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                        <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>Select a component to view details</p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close button
        this.element.querySelector('#btn-close-preview').addEventListener('click', () => {
            this.clear();
            this.element.parentElement?.classList.remove('visible');
        });
    }

    showComponent(component, category, library) {
        this.currentComponent = component;
        
        const content = this.element.querySelector('#preview-content');
        content.innerHTML = `
            <div class="preview-visual">
                <svg class="preview-svg" viewBox="0 0 ${component.dimensions.width + 40} ${component.dimensions.height + 40}">
                    ${this.renderComponent(component)}
                </svg>
            </div>
            
            <div class="preview-info">
                <div class="info-section">
                    <h4>${component.name}</h4>
                    <div class="info-badges">
                        ${component.isSystemComponent ? '<span class="badge badge-system">System</span>' : ''}
                        ${component.version.isPrerelease() ? '<span class="badge badge-prerelease">Pre-release</span>' : ''}
                        ${component.isDeprecated ? '<span class="badge badge-deprecated">Deprecated</span>' : ''}
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${component.type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Category:</span>
                        <span class="info-value">${category.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Library:</span>
                        <span class="info-value">${library.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Version:</span>
                        <span class="info-value">${component.version}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>Description</h5>
                    <p class="info-description">${component.metadata.description || 'No description available'}</p>
                </div>
                
                <div class="info-section">
                    <h5>Author</h5>
                    <div class="info-author">
                        <span>${component.metadata.author}</span>
                        ${component.metadata.license ? `<span class="info-license">${component.metadata.license}</span>` : ''}
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>Tags</h5>
                    <div class="info-tags">
                        ${component.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>Terminals (${component.terminals.length})</h5>
                    <div class="terminal-info">
                        ${component.terminals.map(terminal => `
                            <div class="terminal-info-item">
                                <span class="terminal-dot" style="background-color: ${this.getTerminalColor(terminal.type)}"></span>
                                <span class="terminal-label">${terminal.label || terminal.id}</span>
                                <span class="terminal-type">${terminal.type}</span>
                                <span class="terminal-position">${terminal.position}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${Object.keys(component.properties).length > 0 ? `
                    <div class="info-section">
                        <h5>Properties</h5>
                        <div class="property-info">
                            ${Object.entries(component.properties).map(([key, prop]) => `
                                <div class="property-info-item">
                                    <span class="property-name">${key}:</span>
                                    <span class="property-type">${prop.type}</span>
                                    ${prop.value !== undefined ? `<span class="property-default">= ${prop.value}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${component.metadata.dependencies.length > 0 ? `
                    <div class="info-section">
                        <h5>Dependencies</h5>
                        <div class="dependency-list">
                            ${component.metadata.dependencies.map(dep => `
                                <div class="dependency-item">
                                    <span>${dep.componentId}</span>
                                    <span class="dependency-version">${dep.version}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="info-section">
                    <h5>Statistics</h5>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Usage Count</span>
                            <span class="stat-value">${component.metadata.usage.count}</span>
                        </div>
                        ${component.metadata.usage.lastUsed ? `
                            <div class="stat-item">
                                <span class="stat-label">Last Used</span>
                                <span class="stat-value">${new Date(component.metadata.usage.lastUsed).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                        ${component.metadata.ratings.count > 0 ? `
                            <div class="stat-item">
                                <span class="stat-label">Rating</span>
                                <span class="stat-value">★ ${component.metadata.ratings.average.toFixed(1)} (${component.metadata.ratings.count})</span>
                            </div>
                        ` : ''}
                        <div class="stat-item">
                            <span class="stat-label">Size</span>
                            <span class="stat-value">${component.dimensions.width} × ${component.dimensions.height}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>Dates</h5>
                    <div class="date-info">
                        <div class="date-item">
                            <span class="date-label">Created:</span>
                            <span class="date-value">${new Date(component.metadata.created).toLocaleString()}</span>
                        </div>
                        <div class="date-item">
                            <span class="date-label">Modified:</span>
                            <span class="date-value">${new Date(component.metadata.modified).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                ${component.metadata.documentation ? `
                    <div class="info-section">
                        <h5>Documentation</h5>
                        <div class="documentation">
                            ${this.renderDocumentation(component.metadata.documentation)}
                        </div>
                    </div>
                ` : ''}
                
                ${component.metadata.examples.length > 0 ? `
                    <div class="info-section">
                        <h5>Examples</h5>
                        <div class="examples-list">
                            ${component.metadata.examples.map(example => `
                                <div class="example-item">
                                    <h6>${example.title}</h6>
                                    ${example.description ? `<p>${example.description}</p>` : ''}
                                    ${example.code ? `<pre class="example-code">${this.escapeHtml(example.code)}</pre>` : ''}
                                    ${example.image ? `<img src="${example.image}" alt="${example.title}" class="example-image" />` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="preview-actions">
                    <button class="btn-primary" id="btn-use-component">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Use Component
                    </button>
                    <button class="btn-secondary" id="btn-rate-component">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="none" stroke="currentColor" stroke-width="1"/>
                        </svg>
                        Rate
                    </button>
                    ${!component.isSystemComponent ? `
                        <button class="btn-secondary" id="btn-edit-component">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M12 2l2 2-8 8-3 1 1-3 8-8z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                            </svg>
                            Edit
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add action handlers
        content.querySelector('#btn-use-component')?.addEventListener('click', () => {
            this.useComponent();
        });
        
        content.querySelector('#btn-rate-component')?.addEventListener('click', () => {
            this.showRatingDialog();
        });
        
        content.querySelector('#btn-edit-component')?.addEventListener('click', () => {
            this.editComponent();
        });
    }

    renderComponent(component) {
        const offset = 20;
        
        // Main component rectangle
        let svg = `
            <rect x="${offset}" y="${offset}" 
                  width="${component.dimensions.width}" 
                  height="${component.dimensions.height}"
                  fill="${component.appearance.backgroundColor}"
                  stroke="${component.appearance.borderColor}"
                  stroke-width="${component.appearance.borderWidth}"
                  rx="${component.appearance.borderRadius}" />
        `;
        
        // Component icon or label
        if (component.appearance.iconPath) {
            svg += `
                <image href="${component.appearance.iconPath}"
                       x="${offset + component.dimensions.width * 0.1}"
                       y="${offset + component.dimensions.height * 0.1}"
                       width="${component.dimensions.width * 0.8}"
                       height="${component.dimensions.height * 0.8}"
                       preserveAspectRatio="xMidYMid meet" />
            `;
        } else {
            svg += `
                <text x="${offset + component.dimensions.width / 2}"
                      y="${offset + component.dimensions.height / 2}"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      font-size="${Math.min(component.dimensions.width, component.dimensions.height) * 0.2}"
                      fill="${component.appearance.borderColor}">${component.type}</text>
            `;
        }
        
        // Terminals
        component.terminals.forEach(terminal => {
            const pos = this.getTerminalPosition(terminal, component.dimensions, { x: offset, y: offset });
            svg += `
                <circle cx="${pos.x}" cy="${pos.y}" r="6"
                        fill="${this.getTerminalColor(terminal.type)}"
                        stroke="#333"
                        stroke-width="2">
                    <title>${terminal.label || terminal.id} (${terminal.type})</title>
                </circle>
            `;
        });
        
        // If custom component, render constituent elements
        if (component.elements) {
            // TODO: Render custom elements
        }
        
        return svg;
    }

    getTerminalPosition(terminal, dimensions, offset = { x: 0, y: 0 }) {
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
        
        const pos = positions[terminal.position] || { x: terminal.x || 0, y: terminal.y || 0 };
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

    renderDocumentation(documentation) {
        // Simple markdown-like rendering
        return documentation
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    useComponent() {
        if (!this.currentComponent) return;
        
        // Emit use event
        const event = new CustomEvent('component-use', {
            detail: { componentId: this.currentComponent.id }
        });
        document.dispatchEvent(event);
    }

    editComponent() {
        if (!this.currentComponent) return;
        
        // Emit edit event
        const event = new CustomEvent('component-edit', {
            detail: { componentId: this.currentComponent.id }
        });
        document.dispatchEvent(event);
    }

    showRatingDialog() {
        if (!this.currentComponent) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog rating-dialog';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>Rate Component</h3>
                <p>How would you rate "${this.currentComponent.name}"?</p>
                <div class="rating-stars">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <button class="star-btn" data-rating="${star}">
                            <svg width="32" height="32" viewBox="0 0 32 32">
                                <path d="M16 4l4 12h12l-10 8 4 12-10-8-10 8 4-12-10-8h12z" 
                                      fill="none" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    `).join('')}
                </div>
                <div class="rating-feedback" style="display: none;">
                    <textarea id="rating-comment" rows="3" placeholder="Optional: Add a comment about this component..."></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-dialog').remove()">Cancel</button>
                    <button class="btn-primary" id="btn-submit-rating" disabled>Submit Rating</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        let selectedRating = 0;
        
        // Handle star selection
        dialog.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedRating = parseInt(btn.dataset.rating);
                
                // Update star display
                dialog.querySelectorAll('.star-btn').forEach((star, index) => {
                    const filled = index < selectedRating;
                    star.querySelector('path').setAttribute('fill', filled ? '#ffd700' : 'none');
                });
                
                // Show feedback area and enable submit
                dialog.querySelector('.rating-feedback').style.display = 'block';
                dialog.querySelector('#btn-submit-rating').disabled = false;
            });
        });
        
        // Handle submission
        dialog.querySelector('#btn-submit-rating').addEventListener('click', () => {
            try {
                this.currentComponent.metadata.addRating(selectedRating);
                this.componentLibrary.saveLibraries();
                
                // Refresh preview
                const result = this.componentLibrary.findComponent(this.currentComponent.id);
                if (result) {
                    this.showComponent(result.component, result.category, result.library);
                }
                
                dialog.remove();
                
                // Show success message
                this.showMessage('Thank you for rating this component!');
            } catch (error) {
                alert(`Failed to submit rating: ${error.message}`);
            }
        });
    }

    showMessage(message) {
        const msg = document.createElement('div');
        msg.className = 'preview-message';
        msg.textContent = message;
        
        this.element.appendChild(msg);
        
        setTimeout(() => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    }

    clear() {
        this.currentComponent = null;
        const content = this.element.querySelector('#preview-content');
        content.innerHTML = `
            <div class="preview-empty">
                <svg width="48" height="48" viewBox="0 0 48 48" opacity="0.3">
                    <rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>Select a component to view details</p>
            </div>
        `;
    }

    getElement() {
        return this.element;
    }
}