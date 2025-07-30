import { Canvg } from 'canvg';

export class PNGExporter {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * Export SVG to PNG with high quality settings
     */
    async export(svgElement, options = {}) {
        const {
            width,
            height,
            dpi = 300,
            quality = 0.92,
            backgroundColor = '#ffffff',
            transparent = false,
            projectName = 'diagram'
        } = options;
        
        try {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx = this.canvas.getContext('2d', {
                alpha: transparent,
                willReadFrequently: false
            });
            
            // Enable high quality rendering
            this.setupHighQualityRendering();
            
            // Set background if not transparent
            if (!transparent) {
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(0, 0, width, height);
            }
            
            // Convert SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            
            // Render SVG to canvas using Canvg
            const v = await Canvg.from(this.ctx, svgString, {
                enableRedraw: false,
                ignoreMouse: true,
                ignoreAnimation: true,
                ignoreDimensions: false,
                scaleWidth: width,
                scaleHeight: height,
                offsetX: 0,
                offsetY: 0
            });
            
            await v.render();
            
            // Convert to blob
            const blob = await this.canvasToBlob(quality);
            
            // Clean up
            this.cleanup();
            
            return {
                blob,
                filename: `${projectName}_${dpi}dpi_${Date.now()}.png`,
                format: 'png',
                dimensions: { width, height },
                dpi
            };
            
        } catch (error) {
            this.cleanup();
            throw new Error(`PNG export failed: ${error.message}`);
        }
    }
    
    /**
     * Setup high quality rendering settings
     */
    setupHighQualityRendering() {
        // Enable image smoothing for better quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set composite operation for better blending
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Enable anti-aliasing (browser dependent)
        if (this.ctx.webkitImageSmoothingEnabled !== undefined) {
            this.ctx.webkitImageSmoothingEnabled = true;
        }
        if (this.ctx.mozImageSmoothingEnabled !== undefined) {
            this.ctx.mozImageSmoothingEnabled = true;
        }
        if (this.ctx.msImageSmoothingEnabled !== undefined) {
            this.ctx.msImageSmoothingEnabled = true;
        }
    }
    
    /**
     * Convert canvas to blob with quality settings
     */
    async canvasToBlob(quality) {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create PNG blob'));
                    }
                },
                'image/png',
                quality
            );
        });
    }
    
    /**
     * Export with print-specific optimizations
     */
    async exportForPrint(svgElement, options = {}) {
        const printOptions = {
            ...options,
            dpi: options.dpi || 300,
            quality: 1.0, // Maximum quality for print
            transparent: false,
            backgroundColor: '#ffffff'
        };
        
        // Apply print optimizations to SVG before export
        const printSvg = this.optimizeSvgForPrint(svgElement.cloneNode(true));
        
        return this.export(printSvg, printOptions);
    }
    
    /**
     * Optimize SVG for print output
     */
    optimizeSvgForPrint(svg) {
        // Increase line weights for better print visibility
        const strokes = svg.querySelectorAll('[stroke-width]');
        strokes.forEach(element => {
            const width = parseFloat(element.getAttribute('stroke-width'));
            if (width < 1) {
                element.setAttribute('stroke-width', Math.max(0.5, width * 1.5));
            }
        });
        
        // Convert light colors to darker ones
        const elements = svg.querySelectorAll('[fill], [stroke]');
        elements.forEach(element => {
            ['fill', 'stroke'].forEach(attr => {
                const color = element.getAttribute(attr);
                if (color && this.isLightColor(color)) {
                    element.setAttribute(attr, this.darkenColor(color));
                }
            });
        });
        
        // Remove semi-transparent elements
        const transparentElements = svg.querySelectorAll('[opacity]');
        transparentElements.forEach(element => {
            const opacity = parseFloat(element.getAttribute('opacity'));
            if (opacity < 0.8) {
                element.setAttribute('opacity', '1');
            }
        });
        
        return svg;
    }
    
    /**
     * Check if color is too light for print
     */
    isLightColor(color) {
        if (!color || color === 'none') return false;
        
        let r, g, b;
        
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                [r, g, b] = match.map(Number);
            }
        } else {
            return false;
        }
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.8;
    }
    
    /**
     * Darken a color for better print visibility
     */
    darkenColor(color) {
        if (!color || color === 'none') return color;
        
        let r, g, b;
        
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                [r, g, b] = match.map(Number);
            }
        } else {
            return color;
        }
        
        // Darken by 20%
        r = Math.floor(r * 0.8);
        g = Math.floor(g * 0.8);
        b = Math.floor(b * 0.8);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Export PNG with black and white conversion
     */
    async exportBlackAndWhite(svgElement, options = {}) {
        // First export as normal
        const result = await this.export(svgElement, options);
        
        // Convert to black and white
        const bwCanvas = document.createElement('canvas');
        bwCanvas.width = options.width;
        bwCanvas.height = options.height;
        const bwCtx = bwCanvas.getContext('2d');
        
        // Create image from original export
        const img = new Image();
        const url = URL.createObjectURL(result.blob);
        
        return new Promise((resolve, reject) => {
            img.onload = async () => {
                // Draw original image
                bwCtx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
                const data = imageData.data;
                
                // Convert to grayscale with high contrast
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    const bw = gray > 128 ? 255 : 0; // Simple threshold
                    data[i] = bw;     // Red
                    data[i + 1] = bw; // Green
                    data[i + 2] = bw; // Blue
                    // Alpha unchanged
                }
                
                // Put modified data back
                bwCtx.putImageData(imageData, 0, 0);
                
                // Convert to blob
                const bwBlob = await this.canvasToBlob(options.quality || 0.92);
                
                // Clean up
                URL.revokeObjectURL(url);
                bwCanvas.remove();
                
                resolve({
                    ...result,
                    blob: bwBlob,
                    filename: result.filename.replace('.png', '_bw.png')
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to convert to black and white'));
            };
            
            img.src = url;
        });
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
    }
}