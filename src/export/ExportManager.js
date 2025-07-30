import { Canvg } from 'canvg';
import { jsPDF } from 'jspdf';
import { PDFExporter } from './PDFExporter.js';
import { PNGExporter } from './PNGExporter.js';
import { SVGExporter } from './SVGExporter.js';
import { ExportDialog } from './ExportDialog.js';
import { ProgressIndicator } from './ProgressIndicator.js';

export class ExportManager {
    constructor(canvas, stateStore) {
        this.canvas = canvas;
        this.stateStore = stateStore;
        
        // Initialize exporters
        this.svgExporter = new SVGExporter();
        this.pngExporter = new PNGExporter();
        this.pdfExporter = new PDFExporter();
        
        // Export settings
        this.defaultSettings = {
            svg: {
                embedImages: true,
                embedStyles: true,
                optimizeForPrint: false
            },
            png: {
                dpi: 300,
                quality: 0.92,
                backgroundColor: '#ffffff',
                transparent: false,
                maxDimension: 8192 // Maximum dimension for memory safety
            },
            pdf: {
                orientation: 'landscape',
                format: 'letter', // letter, a4, a3, etc.
                margins: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                },
                autoFit: true,
                blackAndWhite: false,
                includeMetadata: true
            }
        };
        
        this.progressIndicator = new ProgressIndicator();
    }
    
    /**
     * Show export dialog to user
     */
    async showExportDialog() {
        const dialog = new ExportDialog(this.defaultSettings);
        const result = await dialog.show();
        
        if (result) {
            await this.export(result);
        }
    }
    
    /**
     * Export with given settings
     * @param {Object} options - Export options
     */
    async export(options) {
        const { formats, settings, exportArea } = options;
        
        try {
            this.progressIndicator.show('Preparing export...');
            
            // Get SVG content based on export area
            const svgContent = await this.prepareSVGContent(exportArea);
            
            // Export to each selected format
            const results = [];
            let completed = 0;
            
            for (const format of formats) {
                this.progressIndicator.update(
                    `Exporting ${format.toUpperCase()}...`,
                    (completed / formats.length) * 100
                );
                
                switch (format) {
                    case 'svg':
                        results.push(await this.exportSVG(svgContent, settings.svg));
                        break;
                    case 'png':
                        results.push(await this.exportPNG(svgContent, settings.png));
                        break;
                    case 'pdf':
                        results.push(await this.exportPDF(svgContent, settings.pdf));
                        break;
                }
                
                completed++;
            }
            
            this.progressIndicator.complete('Export completed successfully!');
            
            // Handle batch download if multiple formats
            if (results.length > 1) {
                await this.downloadBatch(results);
            }
            
            return results;
            
        } catch (error) {
            this.progressIndicator.error(`Export failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Prepare SVG content for export
     */
    async prepareSVGContent(exportArea) {
        const svgElement = document.getElementById('canvas-svg');
        let content;
        
        if (exportArea === 'selection') {
            // Export only selected elements
            content = await this.getSelectionSVG();
        } else if (exportArea === 'visible') {
            // Export current viewport
            content = await this.getViewportSVG();
        } else {
            // Export entire diagram
            content = svgElement.cloneNode(true);
        }
        
        // Clean up SVG for export
        return this.cleanupSVG(content);
    }
    
    /**
     * Export as SVG
     */
    async exportSVG(svgContent, settings) {
        this.progressIndicator.update('Processing SVG...', 10);
        
        const result = await this.svgExporter.export(svgContent, {
            ...settings,
            projectName: this.stateStore.state.project.name
        });
        
        this.progressIndicator.update('SVG export complete', 100);
        return result;
    }
    
    /**
     * Export as PNG with memory optimization
     */
    async exportPNG(svgContent, settings) {
        this.progressIndicator.update('Rendering PNG...', 10);
        
        // Calculate dimensions
        const bbox = svgContent.getBBox();
        const scale = settings.dpi / 96; // Convert DPI to scale factor
        const width = bbox.width * scale;
        const height = bbox.height * scale;
        
        // Check if we need to tile for memory optimization
        if (width > settings.maxDimension || height > settings.maxDimension) {
            return await this.exportTiledPNG(svgContent, settings);
        }
        
        const result = await this.pngExporter.export(svgContent, {
            ...settings,
            width,
            height,
            projectName: this.stateStore.state.project.name
        });
        
        this.progressIndicator.update('PNG export complete', 100);
        return result;
    }
    
    /**
     * Export large PNG using tiling for memory efficiency
     */
    async exportTiledPNG(svgContent, settings) {
        this.progressIndicator.update('Preparing tiled export...', 5);
        
        const bbox = svgContent.getBBox();
        const scale = settings.dpi / 96;
        const totalWidth = bbox.width * scale;
        const totalHeight = bbox.height * scale;
        
        // Calculate tile size
        const tileSize = Math.min(settings.maxDimension, 2048);
        const tilesX = Math.ceil(totalWidth / tileSize);
        const tilesY = Math.ceil(totalHeight / tileSize);
        const totalTiles = tilesX * tilesY;
        
        console.log(`Exporting ${tilesX}x${tilesY} tiles (${totalTiles} total)`);
        
        // Create main canvas for final image
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = totalWidth;
        mainCanvas.height = totalHeight;
        const mainCtx = mainCanvas.getContext('2d');
        
        if (!settings.transparent) {
            mainCtx.fillStyle = settings.backgroundColor;
            mainCtx.fillRect(0, 0, totalWidth, totalHeight);
        }
        
        // Export each tile
        let processedTiles = 0;
        
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const progress = (processedTiles / totalTiles) * 90 + 5;
                this.progressIndicator.update(
                    `Rendering tile ${processedTiles + 1}/${totalTiles}...`,
                    progress
                );
                
                // Create tile canvas
                const tileCanvas = document.createElement('canvas');
                const tileWidth = Math.min(tileSize, totalWidth - x * tileSize);
                const tileHeight = Math.min(tileSize, totalHeight - y * tileSize);
                
                tileCanvas.width = tileWidth;
                tileCanvas.height = tileHeight;
                
                // Render tile
                await this.renderTile(
                    svgContent,
                    tileCanvas,
                    x * tileSize / scale,
                    y * tileSize / scale,
                    tileWidth / scale,
                    tileHeight / scale,
                    scale,
                    settings
                );
                
                // Draw tile to main canvas
                mainCtx.drawImage(tileCanvas, x * tileSize, y * tileSize);
                
                // Clean up tile canvas
                tileCanvas.remove();
                
                processedTiles++;
                
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.progressIndicator.update('Finalizing PNG...', 95);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            mainCanvas.toBlob(resolve, 'image/png', settings.quality);
        });
        
        // Clean up
        mainCanvas.remove();
        
        this.progressIndicator.update('PNG export complete', 100);
        
        return {
            blob,
            filename: `${this.stateStore.state.project.name}_${Date.now()}.png`,
            format: 'png'
        };
    }
    
    /**
     * Render a single tile
     */
    async renderTile(svgContent, canvas, x, y, width, height, scale, settings) {
        const ctx = canvas.getContext('2d');
        
        // Set background if not transparent
        if (!settings.transparent) {
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Create SVG with viewport for this tile
        const tileSvg = svgContent.cloneNode(true);
        tileSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
        tileSvg.setAttribute('width', canvas.width);
        tileSvg.setAttribute('height', canvas.height);
        
        // Use Canvg to render SVG to canvas
        const v = await Canvg.from(ctx, tileSvg.outerHTML);
        await v.render();
    }
    
    /**
     * Export as PDF
     */
    async exportPDF(svgContent, settings) {
        this.progressIndicator.update('Generating PDF...', 10);
        
        const result = await this.pdfExporter.export(svgContent, {
            ...settings,
            projectName: this.stateStore.state.project.name,
            metadata: this.getExportMetadata()
        });
        
        this.progressIndicator.update('PDF export complete', 100);
        return result;
    }
    
    /**
     * Get SVG for selected elements only
     */
    async getSelectionSVG() {
        const selectedElements = this.canvas.getSelectedElements();
        if (selectedElements.length === 0) {
            throw new Error('No elements selected for export');
        }
        
        // Create new SVG with only selected elements
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Copy selected elements
        selectedElements.forEach(el => {
            g.appendChild(el.cloneNode(true));
        });
        
        svg.appendChild(g);
        
        // Calculate bounding box
        const bbox = g.getBBox();
        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        svg.setAttribute('width', bbox.width);
        svg.setAttribute('height', bbox.height);
        
        return svg;
    }
    
    /**
     * Get SVG for current viewport
     */
    async getViewportSVG() {
        const svgElement = document.getElementById('canvas-svg');
        const svg = svgElement.cloneNode(true);
        
        // Get current viewport bounds
        const viewport = this.canvas.getViewportBounds();
        svg.setAttribute('viewBox', 
            `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`
        );
        svg.setAttribute('width', viewport.width);
        svg.setAttribute('height', viewport.height);
        
        return svg;
    }
    
    /**
     * Clean up SVG for export
     */
    cleanupSVG(svg) {
        // Remove interactive elements
        svg.querySelectorAll('.handle, .selection-box, .wire-handle').forEach(el => {
            el.remove();
        });
        
        // Remove pan-zoom artifacts
        const viewport = svg.querySelector('#viewport');
        if (viewport) {
            viewport.removeAttribute('transform');
        }
        
        // Embed external images as base64
        const images = svg.querySelectorAll('image');
        images.forEach(img => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            if (href && !href.startsWith('data:')) {
                // Convert to base64 if needed
                // This would require loading the image and converting it
            }
        });
        
        return svg;
    }
    
    /**
     * Get metadata for export
     */
    getExportMetadata() {
        return {
            title: this.stateStore.state.project.name,
            author: this.stateStore.state.project.author || 'Unknown',
            created: new Date(this.stateStore.state.project.created).toISOString(),
            exported: new Date().toISOString(),
            version: this.stateStore.state.project.version,
            elementCount: this.stateStore.state.elements.length,
            wireCount: this.stateStore.state.wires.length
        };
    }
    
    /**
     * Download multiple files as batch
     */
    async downloadBatch(results) {
        // If browser supports it, create a zip
        // Otherwise download files sequentially
        for (const result of results) {
            this.downloadFile(result);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    /**
     * Download a single file
     */
    downloadFile(result) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(result.blob);
        link.download = result.filename;
        link.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
}