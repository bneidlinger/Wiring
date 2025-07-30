export class SVGExporter {
    constructor() {
        this.styleCache = new Map();
    }
    
    /**
     * Export SVG with embedded styles and optimizations
     */
    async export(svgElement, options = {}) {
        const {
            embedImages = true,
            embedStyles = true,
            optimizeForPrint = false,
            projectName = 'diagram'
        } = options;
        
        // Clone SVG to avoid modifying original
        const svg = svgElement.cloneNode(true);
        
        // Process SVG
        if (embedStyles) {
            await this.embedStyles(svg);
        }
        
        if (embedImages) {
            await this.embedImages(svg);
        }
        
        if (optimizeForPrint) {
            this.optimizeForPrint(svg);
        }
        
        // Add metadata
        this.addMetadata(svg, projectName);
        
        // Clean up IDs to avoid conflicts
        this.cleanupIds(svg);
        
        // Convert to string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);
        
        // Add XML declaration and DOCTYPE
        svgString = this.addXMLDeclaration(svgString);
        
        // Create blob
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        
        return {
            blob,
            filename: `${projectName}_${Date.now()}.svg`,
            format: 'svg'
        };
    }
    
    /**
     * Embed all CSS styles inline
     */
    async embedStyles(svg) {
        // Get all stylesheets
        const stylesheets = document.styleSheets;
        const styles = [];
        
        // Extract relevant styles
        for (const sheet of stylesheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (const rule of rules) {
                    if (this.isRelevantRule(rule, svg)) {
                        styles.push(rule.cssText);
                    }
                }
            } catch (e) {
                // Cross-origin stylesheets will throw
                console.warn('Could not access stylesheet:', e);
            }
        }
        
        // Get computed styles for all elements
        const elements = svg.querySelectorAll('*');
        elements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const inlineStyles = [];
            
            // Important properties to preserve
            const properties = [
                'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                'opacity', 'font-family', 'font-size', 'font-weight',
                'text-anchor', 'transform', 'filter'
            ];
            
            properties.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== 'none' && value !== 'auto') {
                    inlineStyles.push(`${prop}: ${value}`);
                }
            });
            
            if (inlineStyles.length > 0) {
                element.setAttribute('style', inlineStyles.join('; '));
            }
        });
        
        // Add style element with collected styles
        if (styles.length > 0) {
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = styles.join('\n');
            svg.insertBefore(styleElement, svg.firstChild);
        }
    }
    
    /**
     * Check if CSS rule is relevant to SVG
     */
    isRelevantRule(rule, svg) {
        if (rule.type !== CSSRule.STYLE_RULE) return false;
        
        try {
            // Check if selector matches any element in SVG
            return svg.querySelector(rule.selectorText) !== null;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Embed external images as base64
     */
    async embedImages(svg) {
        const images = svg.querySelectorAll('image');
        const imagePromises = [];
        
        images.forEach(img => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            
            if (href && !href.startsWith('data:')) {
                imagePromises.push(this.convertImageToBase64(href).then(base64 => {
                    img.setAttribute('href', base64);
                    img.removeAttribute('xlink:href');
                }));
            }
        });
        
        await Promise.all(imagePromises);
    }
    
    /**
     * Convert image URL to base64
     */
    async convertImageToBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const base64 = canvas.toDataURL();
                canvas.remove();
                resolve(base64);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${url}`);
                resolve(url); // Fallback to original URL
            };
            
            img.src = url;
        });
    }
    
    /**
     * Optimize SVG for print output
     */
    optimizeForPrint(svg) {
        // Convert RGB colors to CMYK approximation (simplified)
        const elements = svg.querySelectorAll('[fill], [stroke]');
        
        elements.forEach(element => {
            ['fill', 'stroke'].forEach(attr => {
                const color = element.getAttribute(attr);
                if (color && color !== 'none') {
                    // For true CMYK conversion, you'd need a color profile
                    // This is a simplified approach for better print results
                    const printColor = this.optimizeColorForPrint(color);
                    element.setAttribute(attr, printColor);
                }
            });
        });
        
        // Increase stroke widths slightly for better print visibility
        const strokes = svg.querySelectorAll('[stroke-width]');
        strokes.forEach(element => {
            const width = parseFloat(element.getAttribute('stroke-width'));
            if (width < 1) {
                element.setAttribute('stroke-width', Math.max(0.5, width * 1.2));
            }
        });
        
        // Remove transparency for better print results
        const transparentElements = svg.querySelectorAll('[opacity]');
        transparentElements.forEach(element => {
            const opacity = parseFloat(element.getAttribute('opacity'));
            if (opacity < 1) {
                element.removeAttribute('opacity');
            }
        });
    }
    
    /**
     * Optimize color for print
     */
    optimizeColorForPrint(color) {
        // Simple optimization - darken light colors
        if (color.startsWith('#')) {
            const rgb = this.hexToRgb(color);
            if (rgb) {
                // If color is too light, darken it
                const brightness = (rgb.r + rgb.g + rgb.b) / 3;
                if (brightness > 200) {
                    rgb.r = Math.floor(rgb.r * 0.8);
                    rgb.g = Math.floor(rgb.g * 0.8);
                    rgb.b = Math.floor(rgb.b * 0.8);
                    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
                }
            }
        }
        return color;
    }
    
    /**
     * Add metadata to SVG
     */
    addMetadata(svg, projectName) {
        const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        metadata.innerHTML = `
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                     xmlns:dc="http://purl.org/dc/elements/1.1/">
                <rdf:Description rdf:about=""
                    dc:title="${projectName}"
                    dc:creator="Wiring Diagram Builder"
                    dc:date="${new Date().toISOString()}"
                    dc:format="image/svg+xml" />
            </rdf:RDF>
        `;
        svg.insertBefore(metadata, svg.firstChild);
    }
    
    /**
     * Clean up IDs to ensure uniqueness
     */
    cleanupIds(svg) {
        const timestamp = Date.now();
        const elements = svg.querySelectorAll('[id]');
        const idMap = new Map();
        
        elements.forEach(element => {
            const oldId = element.getAttribute('id');
            const newId = `${oldId}_${timestamp}`;
            idMap.set(oldId, newId);
            element.setAttribute('id', newId);
        });
        
        // Update references
        const references = svg.querySelectorAll('[href^="#"], [xlink\\:href^="#"], [fill^="url(#"], [stroke^="url(#"]');
        references.forEach(element => {
            ['href', 'xlink:href', 'fill', 'stroke'].forEach(attr => {
                const value = element.getAttribute(attr);
                if (value && value.includes('#')) {
                    const match = value.match(/#([^)]+)/);
                    if (match && idMap.has(match[1])) {
                        const newValue = value.replace(`#${match[1]}`, `#${idMap.get(match[1])}`);
                        element.setAttribute(attr, newValue);
                    }
                }
            });
        });
    }
    
    /**
     * Add XML declaration
     */
    addXMLDeclaration(svgString) {
        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
        const doctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
        
        if (!svgString.startsWith('<?xml')) {
            svgString = xmlDeclaration + doctype + svgString;
        }
        
        return svgString;
    }
    
    /**
     * Utility functions
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}