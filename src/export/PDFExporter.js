import { jsPDF } from 'jspdf';

export class PDFExporter {
    constructor() {
        this.paperSizes = {
            'letter': { width: 8.5, height: 11 },
            'legal': { width: 8.5, height: 14 },
            'a4': { width: 8.27, height: 11.69 },
            'a3': { width: 11.69, height: 16.54 },
            'tabloid': { width: 11, height: 17 },
            'ledger': { width: 17, height: 11 }
        };
    }
    
    /**
     * Export SVG to PDF
     */
    async export(svgElement, options = {}) {
        const {
            orientation = 'landscape',
            format = 'letter',
            margins = { top: 10, right: 10, bottom: 10, left: 10 },
            autoFit = true,
            blackAndWhite = false,
            includeMetadata = true,
            projectName = 'diagram',
            metadata = {}
        } = options;
        
        try {
            // Get paper dimensions in points (1 inch = 72 points)
            const paperSize = this.paperSizes[format] || this.paperSizes.letter;
            const isLandscape = orientation === 'landscape';
            const pageWidth = (isLandscape ? paperSize.height : paperSize.width) * 72;
            const pageHeight = (isLandscape ? paperSize.width : paperSize.height) * 72;
            
            // Calculate drawable area
            const drawableWidth = pageWidth - (margins.left + margins.right);
            const drawableHeight = pageHeight - (margins.top + margins.bottom);
            
            // Create PDF
            const pdf = new jsPDF({
                orientation,
                unit: 'pt',
                format: [pageWidth, pageHeight]
            });
            
            // Add metadata
            if (includeMetadata) {
                this.addMetadata(pdf, projectName, metadata);
            }
            
            // Prepare SVG
            const svg = this.prepareSvgForPdf(svgElement.cloneNode(true), {
                blackAndWhite,
                width: drawableWidth,
                height: drawableHeight,
                autoFit
            });
            
            // Check if we need multiple pages
            const svgBBox = svg.getBBox();
            const scale = autoFit ? this.calculateFitScale(
                svgBBox.width,
                svgBBox.height,
                drawableWidth,
                drawableHeight
            ) : 1;
            
            const scaledWidth = svgBBox.width * scale;
            const scaledHeight = svgBBox.height * scale;
            
            if (scaledWidth <= drawableWidth && scaledHeight <= drawableHeight) {
                // Single page export
                await this.renderSinglePage(pdf, svg, {
                    x: margins.left,
                    y: margins.top,
                    width: drawableWidth,
                    height: drawableHeight,
                    scale
                });
            } else {
                // Multi-page export
                await this.renderMultiplePages(pdf, svg, {
                    margins,
                    drawableWidth,
                    drawableHeight,
                    scale,
                    pageWidth,
                    pageHeight
                });
            }
            
            // Save PDF
            const pdfBlob = pdf.output('blob');
            
            return {
                blob: pdfBlob,
                filename: `${projectName}_${Date.now()}.pdf`,
                format: 'pdf',
                pages: pdf.internal.getNumberOfPages()
            };
            
        } catch (error) {
            throw new Error(`PDF export failed: ${error.message}`);
        }
    }
    
    /**
     * Prepare SVG for PDF conversion
     */
    prepareSvgForPdf(svg, options) {
        const { blackAndWhite, width, height, autoFit } = options;
        
        // Remove interactive elements
        svg.querySelectorAll('.handle, .selection-box').forEach(el => el.remove());
        
        // Apply black and white conversion if needed
        if (blackAndWhite) {
            this.convertToBlackAndWhite(svg);
        }
        
        // Ensure SVG has proper dimensions
        const bbox = svg.getBBox();
        svg.setAttribute('width', bbox.width);
        svg.setAttribute('height', bbox.height);
        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        
        // Convert text to paths for better compatibility
        this.convertTextToPaths(svg);
        
        return svg;
    }
    
    /**
     * Convert SVG to black and white
     */
    convertToBlackAndWhite(svg) {
        const elements = svg.querySelectorAll('*');
        
        elements.forEach(element => {
            // Convert fill colors
            const fill = element.getAttribute('fill');
            if (fill && fill !== 'none') {
                const gray = this.colorToGrayscale(fill);
                element.setAttribute('fill', gray < 128 ? '#000000' : '#ffffff');
            }
            
            // Convert stroke colors
            const stroke = element.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                const gray = this.colorToGrayscale(stroke);
                element.setAttribute('stroke', gray < 128 ? '#000000' : '#ffffff');
            }
            
            // Remove opacity
            element.removeAttribute('opacity');
            element.removeAttribute('fill-opacity');
            element.removeAttribute('stroke-opacity');
        });
    }
    
    /**
     * Convert color to grayscale value
     */
    colorToGrayscale(color) {
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
            // Default to black for unknown colors
            return 0;
        }
        
        // Calculate grayscale using luminance formula
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    /**
     * Convert text elements to paths for better PDF compatibility
     */
    convertTextToPaths(svg) {
        // Note: This is a simplified version. For production use,
        // you might want to use a library like opentype.js
        const textElements = svg.querySelectorAll('text');
        
        textElements.forEach(text => {
            // For now, we'll just ensure text has proper styling
            const computedStyle = window.getComputedStyle(text);
            text.style.fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
            text.style.fontSize = computedStyle.fontSize || '12pt';
            text.style.fontWeight = computedStyle.fontWeight || 'normal';
        });
    }
    
    /**
     * Calculate scale to fit content within bounds
     */
    calculateFitScale(contentWidth, contentHeight, maxWidth, maxHeight) {
        const scaleX = maxWidth / contentWidth;
        const scaleY = maxHeight / contentHeight;
        return Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    }
    
    /**
     * Render SVG on a single PDF page
     */
    async renderSinglePage(pdf, svg, options) {
        const { x, y, width, height, scale } = options;
        
        // Center content if smaller than page
        const bbox = svg.getBBox();
        const scaledWidth = bbox.width * scale;
        const scaledHeight = bbox.height * scale;
        
        const offsetX = x + (width - scaledWidth) / 2;
        const offsetY = y + (height - scaledHeight) / 2;
        
        // Convert SVG to image first, then add to PDF
        // This is more reliable than direct SVG rendering
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx = canvas.getContext('2d');
        
        // Use Canvg to render SVG to canvas
        const { Canvg } = await import('canvg');
        const v = await Canvg.from(ctx, svg.outerHTML, {
            enableRedraw: false,
            ignoreMouse: true,
            ignoreAnimation: true,
            ignoreDimensions: false,
            scaleWidth: scaledWidth,
            scaleHeight: scaledHeight
        });
        
        await v.render();
        
        // Add canvas as image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight);
        
        canvas.remove();
    }
    
    /**
     * Render SVG across multiple PDF pages
     */
    async renderMultiplePages(pdf, svg, options) {
        const {
            margins,
            drawableWidth,
            drawableHeight,
            scale,
            pageWidth,
            pageHeight
        } = options;
        
        const bbox = svg.getBBox();
        const totalWidth = bbox.width * scale;
        const totalHeight = bbox.height * scale;
        
        // Calculate number of pages needed
        const pagesX = Math.ceil(totalWidth / drawableWidth);
        const pagesY = Math.ceil(totalHeight / drawableHeight);
        
        // Add page numbers and guides
        let pageCount = 0;
        
        for (let row = 0; row < pagesY; row++) {
            for (let col = 0; col < pagesX; col++) {
                if (pageCount > 0) {
                    pdf.addPage();
                }
                
                // Calculate viewport for this page
                const viewX = (col * drawableWidth) / scale;
                const viewY = (row * drawableHeight) / scale;
                const viewWidth = Math.min(drawableWidth / scale, bbox.width - viewX);
                const viewHeight = Math.min(drawableHeight / scale, bbox.height - viewY);
                
                // Create clipped SVG for this page
                const pageSvg = svg.cloneNode(true);
                pageSvg.setAttribute('viewBox', 
                    `${bbox.x + viewX} ${bbox.y + viewY} ${viewWidth} ${viewHeight}`
                );
                pageSvg.setAttribute('width', viewWidth * scale);
                pageSvg.setAttribute('height', viewHeight * scale);
                
                // Render this page using canvas approach
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = viewWidth * scale;
                pageCanvas.height = viewHeight * scale;
                const pageCtx = pageCanvas.getContext('2d');
                
                const { Canvg } = await import('canvg');
                const v = await Canvg.from(pageCtx, pageSvg.outerHTML, {
                    enableRedraw: false,
                    ignoreMouse: true,
                    ignoreAnimation: true
                });
                
                await v.render();
                
                const pageImgData = pageCanvas.toDataURL('image/png');
                pdf.addImage(pageImgData, 'PNG', margins.left, margins.top, viewWidth * scale, viewHeight * scale);
                
                pageCanvas.remove();
                
                // Add page info
                this.addPageInfo(pdf, {
                    pageNumber: pageCount + 1,
                    totalPages: pagesX * pagesY,
                    row: row + 1,
                    col: col + 1,
                    pageWidth,
                    pageHeight,
                    margins
                });
                
                pageCount++;
            }
        }
    }
    
    /**
     * Add page information (numbers, cut marks, etc.)
     */
    addPageInfo(pdf, info) {
        const {
            pageNumber,
            totalPages,
            row,
            col,
            pageWidth,
            pageHeight,
            margins
        } = info;
        
        // Page number
        pdf.setFontSize(8);
        pdf.setTextColor(128);
        pdf.text(
            `Page ${pageNumber} of ${totalPages} (${row},${col})`,
            pageWidth / 2,
            pageHeight - margins.bottom / 2,
            { align: 'center' }
        );
        
        // Cut marks for multi-page assembly
        if (totalPages > 1) {
            pdf.setDrawColor(200);
            pdf.setLineWidth(0.5);
            
            // Top-left mark
            pdf.line(margins.left - 5, margins.top, margins.left - 2, margins.top);
            pdf.line(margins.left, margins.top - 5, margins.left, margins.top - 2);
            
            // Top-right mark
            pdf.line(pageWidth - margins.right + 2, margins.top, pageWidth - margins.right + 5, margins.top);
            pdf.line(pageWidth - margins.right, margins.top - 5, pageWidth - margins.right, margins.top - 2);
            
            // Bottom marks similar...
        }
    }
    
    /**
     * Add metadata to PDF
     */
    addMetadata(pdf, projectName, metadata) {
        pdf.setProperties({
            title: projectName,
            subject: 'Wiring Diagram Export',
            author: metadata.author || 'Wiring Diagram Builder',
            keywords: 'wiring, diagram, electrical',
            creator: 'Wiring Diagram Builder'
        });
        
        // Add custom metadata as PDF annotations
        if (metadata.created) {
            pdf.setCreationDate(new Date(metadata.created));
        }
        
        // Add diagram info on first page (will be drawn later)
        pdf.setFontSize(6);
        pdf.setTextColor(200);
        const info = [
            `Elements: ${metadata.elementCount || 0}`,
            `Wires: ${metadata.wireCount || 0}`,
            `Exported: ${new Date().toLocaleString()}`
        ].join(' | ');
        
        // This will be added after the content is rendered
        pdf.internal.events.subscribe('putPage', () => {
            if (pdf.internal.getCurrentPageInfo().pageNumber === 1) {
                pdf.text(info, 10, 10);
            }
        });
    }
    
}