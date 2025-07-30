// Save indicator UI component
export class SaveIndicator {
    constructor(container) {
        this.container = container || document.body;
        this.element = null;
        this.statusTimeout = null;
        this.createIndicator();
    }

    createIndicator() {
        // Create save indicator element
        this.element = document.createElement('div');
        this.element.id = 'save-indicator';
        this.element.className = 'save-indicator';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .save-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 8px 16px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 4px;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                pointer-events: none;
                z-index: 10000;
            }
            
            .save-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .save-indicator.error {
                background: rgba(220, 38, 38, 0.9);
            }
            
            .save-indicator.success {
                background: rgba(34, 197, 94, 0.9);
            }
            
            .save-indicator.warning {
                background: rgba(251, 146, 60, 0.9);
            }
            
            .save-indicator-icon {
                width: 16px;
                height: 16px;
                display: inline-block;
            }
            
            .save-indicator-spinner {
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .save-indicator-history {
                position: fixed;
                top: 60px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 4px;
                padding: 12px;
                font-size: 12px;
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                max-width: 250px;
                z-index: 9999;
            }
            
            .save-indicator-history.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .history-item {
                padding: 4px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .history-item + .history-item {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .keyboard-hint {
                font-size: 11px;
                opacity: 0.7;
                margin-left: 8px;
            }
        `;
        
        if (!document.getElementById('save-indicator-styles')) {
            style.id = 'save-indicator-styles';
            document.head.appendChild(style);
        }
        
        this.container.appendChild(this.element);
        
        // Create history panel
        this.historyElement = document.createElement('div');
        this.historyElement.className = 'save-indicator-history';
        this.container.appendChild(this.historyElement);
    }

    show(message, type = 'info', duration = 3000) {
        // Clear existing timeout
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        // Update content
        this.element.className = `save-indicator visible ${type}`;
        this.element.innerHTML = `
            ${this.getIcon(type)}
            <span>${message}</span>
        `;
        
        // Auto-hide after duration
        if (duration > 0) {
            this.statusTimeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    showSaving() {
        this.show('<span class="save-indicator-icon save-indicator-spinner"></span>Saving...', 'info', 0);
    }

    showSaved() {
        this.show('Saved', 'success', 2000);
    }

    showAutoSaved() {
        this.show('Auto-saved', 'success', 1500);
    }

    showError(message = 'Save failed') {
        this.show(message, 'error', 5000);
    }

    showWarning(message) {
        this.show(message, 'warning', 4000);
    }

    hide() {
        this.element.classList.remove('visible');
        this.hideHistory();
    }

    showHistory(historyInfo) {
        const { canUndo, canRedo, undoDescription, redoDescription } = historyInfo;
        
        let content = '<div class="history-items">';
        
        if (canUndo) {
            content += `
                <div class="history-item">
                    <span>Undo: ${undoDescription}</span>
                    <span class="keyboard-hint">Ctrl+Z</span>
                </div>
            `;
        }
        
        if (canRedo) {
            content += `
                <div class="history-item">
                    <span>Redo: ${redoDescription}</span>
                    <span class="keyboard-hint">Ctrl+Y</span>
                </div>
            `;
        }
        
        if (!canUndo && !canRedo) {
            content += '<div class="history-item">No history available</div>';
        }
        
        content += '</div>';
        
        this.historyElement.innerHTML = content;
        this.historyElement.classList.add('visible');
        
        // Auto-hide after 3 seconds
        setTimeout(() => this.hideHistory(), 3000);
    }

    hideHistory() {
        this.historyElement.classList.remove('visible');
    }

    getIcon(type) {
        const icons = {
            success: `<svg class="save-indicator-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>`,
            error: `<svg class="save-indicator-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>`,
            warning: `<svg class="save-indicator-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>`,
            info: ''
        };
        
        return icons[type] || '';
    }

    // Update save status based on state events
    attachToStateStore(stateStore) {
        stateStore.addListener((event, data) => {
            switch (event) {
                case 'auto-save-complete':
                    this.showAutoSaved();
                    break;
                    
                case 'save-complete':
                    this.showSaved();
                    break;
                    
                case 'auto-save-failed':
                case 'save-failed':
                    this.showError('Save failed');
                    break;
                    
                case 'storage-quota-exceeded':
                    this.showWarning('Storage quota exceeded');
                    break;
                    
                case 'state-recovered':
                    this.show('State recovered from backup', 'success', 3000);
                    break;
                    
                case 'export-complete':
                    this.show(`Exported as ${data.format.toUpperCase()}`, 'success', 2000);
                    break;
                    
                case 'import-complete':
                    this.show('Import successful', 'success', 2000);
                    break;
                    
                case 'import-failed':
                    this.showError('Import failed');
                    break;
                    
                case 'undo':
                    this.show(`Undone: ${data.description}`, 'info', 1500);
                    break;
                    
                case 'redo':
                    this.show(`Redone: ${data.description}`, 'info', 1500);
                    break;
            }
        });
    }
}