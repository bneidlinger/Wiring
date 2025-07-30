export class ExportDialog {
    constructor(defaultSettings) {
        this.defaultSettings = defaultSettings;
        this.selectedFormats = new Set(['svg']);
        this.exportArea = 'all'; // all, visible, selection
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
        this.resolve = null;
    }
    
    /**
     * Show export dialog and return promise with user selection
     */
    show() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.createDialog();
        });
    }
    
    /**
     * Create and display the dialog
     */
    createDialog() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'export-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: 600px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        dialog.innerHTML = this.getDialogHTML();
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Setup event listeners
        this.setupEventListeners(overlay, dialog);
        
        // Focus first input
        dialog.querySelector('input[type="checkbox"]').focus();
    }
    
    /**
     * Get dialog HTML content
     */
    getDialogHTML() {
        return `
            <div class="export-dialog-header" style="padding: 20px; border-bottom: 1px solid #e0e0e0;">
                <h2 style="margin: 0; font-size: 24px; color: #333;">Export Diagram</h2>
            </div>
            
            <div class="export-dialog-body" style="padding: 20px; overflow-y: auto; flex: 1;">
                <!-- Export Area Selection -->
                <div class="export-section" style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Export Area</h3>
                    <div class="export-area-options" style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="export-area" value="all" checked style="margin-right: 8px;">
                            <span>Entire Diagram</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="export-area" value="visible" style="margin-right: 8px;">
                            <span>Current View</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="export-area" value="selection" style="margin-right: 8px;">
                            <span>Selected Elements</span>
                        </label>
                    </div>
                </div>
                
                <!-- Format Selection -->
                <div class="export-section" style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Export Formats</h3>
                    <div class="format-options" style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" value="svg" checked style="margin-right: 8px;">
                            <span>SVG (Vector)</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" value="png" style="margin-right: 8px;">
                            <span>PNG (Raster)</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" value="pdf" style="margin-right: 8px;">
                            <span>PDF (Document)</span>
                        </label>
                    </div>
                </div>
                
                <!-- Format-specific settings -->
                <div class="export-section">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Format Settings</h3>
                    
                    <!-- SVG Settings -->
                    <div class="format-settings" data-format="svg" style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">SVG Settings</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; padding-left: 16px;">
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" id="svg-embed-images" checked style="margin-right: 8px;">
                                <span>Embed images as base64</span>
                            </label>
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" id="svg-embed-styles" checked style="margin-right: 8px;">
                                <span>Embed CSS styles</span>
                            </label>
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" id="svg-optimize-print" style="margin-right: 8px;">
                                <span>Optimize for print</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- PNG Settings -->
                    <div class="format-settings" data-format="png" style="margin-bottom: 16px; display: none;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">PNG Settings</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px; padding-left: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">DPI:</span>
                                    <select id="png-dpi" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="72">72 (Screen)</option>
                                        <option value="150">150 (Draft)</option>
                                        <option value="300" selected>300 (Print)</option>
                                        <option value="600">600 (High Quality)</option>
                                    </select>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">Background:</span>
                                    <input type="color" id="png-background" value="#ffffff" style="width: 50px; height: 30px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                                </label>
                                <label style="display: flex; align-items: center;">
                                    <input type="checkbox" id="png-transparent" style="margin-right: 8px;">
                                    <span>Transparent</span>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">Quality:</span>
                                    <input type="range" id="png-quality" min="0.1" max="1" step="0.1" value="0.92" style="width: 150px;">
                                    <span id="png-quality-value" style="margin-left: 8px; min-width: 30px;">92%</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- PDF Settings -->
                    <div class="format-settings" data-format="pdf" style="margin-bottom: 16px; display: none;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">PDF Settings</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px; padding-left: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">Paper Size:</span>
                                    <select id="pdf-format" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="letter">Letter (8.5" × 11")</option>
                                        <option value="legal">Legal (8.5" × 14")</option>
                                        <option value="a4">A4 (210mm × 297mm)</option>
                                        <option value="a3">A3 (297mm × 420mm)</option>
                                        <option value="tabloid">Tabloid (11" × 17")</option>
                                        <option value="ledger">Ledger (17" × 11")</option>
                                    </select>
                                </label>
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">Orientation:</span>
                                    <select id="pdf-orientation" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="landscape">Landscape</option>
                                        <option value="portrait">Portrait</option>
                                    </select>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <label style="display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">Margins (mm):</span>
                                    <input type="number" id="pdf-margins" value="10" min="0" max="50" style="width: 60px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </label>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label style="display: flex; align-items: center;">
                                    <input type="checkbox" id="pdf-autofit" checked style="margin-right: 8px;">
                                    <span>Auto-fit to page</span>
                                </label>
                                <label style="display: flex; align-items: center;">
                                    <input type="checkbox" id="pdf-blackwhite" style="margin-right: 8px;">
                                    <span>Black & White</span>
                                </label>
                                <label style="display: flex; align-items: center;">
                                    <input type="checkbox" id="pdf-metadata" checked style="margin-right: 8px;">
                                    <span>Include metadata</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Presets -->
                <div class="export-section" style="margin-top: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Quick Presets</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="preset-btn" data-preset="web" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
                            Web (Low Res)
                        </button>
                        <button class="preset-btn" data-preset="print" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
                            Print (High Res)
                        </button>
                        <button class="preset-btn" data-preset="archive" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
                            Archive (All Formats)
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="export-dialog-footer" style="padding: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 12px;">
                <button class="export-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
                <button class="export-confirm-btn" style="padding: 8px 16px; border: none; background: #3498db; color: white; border-radius: 4px; cursor: pointer;">
                    Export
                </button>
            </div>
        `;
    }
    
    /**
     * Setup event listeners for dialog
     */
    setupEventListeners(overlay, dialog) {
        // Format checkboxes
        dialog.querySelectorAll('input[type="checkbox"][value]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const format = e.target.value;
                const settingsDiv = dialog.querySelector(`.format-settings[data-format="${format}"]`);
                
                if (e.target.checked) {
                    this.selectedFormats.add(format);
                    if (settingsDiv) settingsDiv.style.display = 'block';
                } else {
                    this.selectedFormats.delete(format);
                    if (settingsDiv) settingsDiv.style.display = 'none';
                }
            });
        });
        
        // Export area radio buttons
        dialog.querySelectorAll('input[name="export-area"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.exportArea = e.target.value;
            });
        });
        
        // PNG quality slider
        const qualitySlider = dialog.querySelector('#png-quality');
        const qualityValue = dialog.querySelector('#png-quality-value');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValue.textContent = Math.round(e.target.value * 100) + '%';
            });
        }
        
        // PNG transparent checkbox
        const transparentCheckbox = dialog.querySelector('#png-transparent');
        const backgroundInput = dialog.querySelector('#png-background');
        if (transparentCheckbox) {
            transparentCheckbox.addEventListener('change', (e) => {
                backgroundInput.disabled = e.target.checked;
            });
        }
        
        // Preset buttons
        dialog.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.target.dataset.preset, dialog);
            });
        });
        
        // Cancel button
        dialog.querySelector('.export-cancel-btn').addEventListener('click', () => {
            this.close(overlay);
        });
        
        // Export button
        dialog.querySelector('.export-confirm-btn').addEventListener('click', () => {
            this.confirm(dialog, overlay);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close(overlay);
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close(overlay);
            }
        });
    }
    
    /**
     * Apply preset settings
     */
    applyPreset(preset, dialog) {
        switch (preset) {
            case 'web':
                // Low resolution for web
                dialog.querySelector('input[value="png"]').checked = true;
                dialog.querySelector('input[value="svg"]').checked = false;
                dialog.querySelector('input[value="pdf"]').checked = false;
                dialog.querySelector('#png-dpi').value = '72';
                dialog.querySelector('#png-quality').value = '0.8';
                dialog.querySelector('#png-quality').dispatchEvent(new Event('input'));
                this.selectedFormats = new Set(['png']);
                break;
                
            case 'print':
                // High resolution for print
                dialog.querySelector('input[value="pdf"]').checked = true;
                dialog.querySelector('input[value="png"]').checked = true;
                dialog.querySelector('input[value="svg"]').checked = false;
                dialog.querySelector('#png-dpi').value = '300';
                dialog.querySelector('#png-quality').value = '1';
                dialog.querySelector('#pdf-blackwhite').checked = false;
                this.selectedFormats = new Set(['pdf', 'png']);
                break;
                
            case 'archive':
                // All formats for archival
                dialog.querySelector('input[value="svg"]').checked = true;
                dialog.querySelector('input[value="png"]').checked = true;
                dialog.querySelector('input[value="pdf"]').checked = true;
                dialog.querySelector('#png-dpi').value = '300';
                dialog.querySelector('#svg-embed-images').checked = true;
                dialog.querySelector('#svg-embed-styles').checked = true;
                this.selectedFormats = new Set(['svg', 'png', 'pdf']);
                break;
        }
        
        // Update visibility of settings panels
        dialog.querySelectorAll('.format-settings').forEach(panel => {
            const format = panel.dataset.format;
            panel.style.display = this.selectedFormats.has(format) ? 'block' : 'none';
        });
    }
    
    /**
     * Confirm export with current settings
     */
    confirm(dialog, overlay) {
        // Collect settings
        const settings = {
            svg: {
                embedImages: dialog.querySelector('#svg-embed-images')?.checked || false,
                embedStyles: dialog.querySelector('#svg-embed-styles')?.checked || false,
                optimizeForPrint: dialog.querySelector('#svg-optimize-print')?.checked || false
            },
            png: {
                dpi: parseInt(dialog.querySelector('#png-dpi')?.value || '300'),
                quality: parseFloat(dialog.querySelector('#png-quality')?.value || '0.92'),
                backgroundColor: dialog.querySelector('#png-background')?.value || '#ffffff',
                transparent: dialog.querySelector('#png-transparent')?.checked || false
            },
            pdf: {
                orientation: dialog.querySelector('#pdf-orientation')?.value || 'landscape',
                format: dialog.querySelector('#pdf-format')?.value || 'letter',
                margins: {
                    top: parseInt(dialog.querySelector('#pdf-margins')?.value || '10'),
                    right: parseInt(dialog.querySelector('#pdf-margins')?.value || '10'),
                    bottom: parseInt(dialog.querySelector('#pdf-margins')?.value || '10'),
                    left: parseInt(dialog.querySelector('#pdf-margins')?.value || '10')
                },
                autoFit: dialog.querySelector('#pdf-autofit')?.checked || true,
                blackAndWhite: dialog.querySelector('#pdf-blackwhite')?.checked || false,
                includeMetadata: dialog.querySelector('#pdf-metadata')?.checked || true
            }
        };
        
        // Validate selection
        if (this.selectedFormats.size === 0) {
            alert('Please select at least one export format.');
            return;
        }
        
        // Close dialog and resolve promise
        this.close(overlay);
        this.resolve({
            formats: Array.from(this.selectedFormats),
            exportArea: this.exportArea,
            settings
        });
    }
    
    /**
     * Close dialog
     */
    close(overlay) {
        overlay.remove();
        document.removeEventListener('keydown', this.escapeHandler);
        
        if (this.resolve) {
            this.resolve(null);
        }
    }
}