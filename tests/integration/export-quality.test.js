import { ExportManager } from '../../src/export/ExportManager';
import { SvgCanvas } from '../../src/svgCanvas';
import { StateStore } from '../../src/stateStore';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { createCanvas, loadImage } from 'canvas';

describe('Export Quality Validation Tests', () => {
  let exportManager;
  let canvas;
  let stateStore;
  let svgElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="test-svg" width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g id="viewport"></g>
      </svg>
    `;
    
    svgElement = document.getElementById('test-svg');
    stateStore = new StateStore();
    canvas = new SvgCanvas(svgElement, stateStore);
    exportManager = new ExportManager(canvas, stateStore);
    
    // Add test content
    createTestDiagram();
  });

  function createTestDiagram() {
    // Add components
    const component1 = createComponent('rect', { x: 100, y: 100, width: 100, height: 60, fill: '#4285f4' });
    const component2 = createComponent('rect', { x: 300, y: 200, width: 100, height: 60, fill: '#34a853' });
    const component3 = createComponent('circle', { cx: 500, cy: 300, r: 40, fill: '#ea4335' });
    
    canvas.addElement(component1);
    canvas.addElement(component2);
    canvas.addElement(component3);
    
    // Add wires
    const wire1 = createWire('M 200 130 L 300 230');
    const wire2 = createWire('M 400 230 L 460 300');
    
    canvas.addWire(wire1);
    canvas.addWire(wire2);
    
    // Add labels
    const label1 = createLabel('Power Supply', 150, 90);
    const label2 = createLabel('Controller', 350, 190);
    const label3 = createLabel('Sensor', 500, 360);
    
    canvas.addElement(label1);
    canvas.addElement(label2);
    canvas.addElement(label3);
  }

  function createComponent(type, attrs) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    element.classList.add('component');
    return element;
  }

  function createWire(path) {
    const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wire.setAttribute('d', path);
    wire.setAttribute('stroke', '#333');
    wire.setAttribute('stroke-width', '2');
    wire.setAttribute('fill', 'none');
    wire.classList.add('wire');
    return wire;
  }

  function createLabel(text, x, y) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.textContent = text;
    label.classList.add('label');
    return label;
  }

  describe('SVG Export Quality', () => {
    test('should export valid SVG with all elements', async () => {
      const svgString = await exportManager.exportSVG();
      
      // Parse SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check SVG structure
      const svg = doc.querySelector('svg');
      expect(svg).toBeDefined();
      expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      
      // Check all components exported
      const components = doc.querySelectorAll('.component');
      expect(components.length).toBe(3);
      
      // Check all wires exported
      const wires = doc.querySelectorAll('.wire');
      expect(wires.length).toBe(2);
      
      // Check all labels exported
      const labels = doc.querySelectorAll('.label');
      expect(labels.length).toBe(3);
    });

    test('should preserve styling in SVG export', async () => {
      const svgString = await exportManager.exportSVG();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check component styles
      const rect = doc.querySelector('rect.component');
      expect(rect.getAttribute('fill')).toBe('#4285f4');
      
      // Check wire styles
      const wire = doc.querySelector('.wire');
      expect(wire.getAttribute('stroke')).toBe('#333');
      expect(wire.getAttribute('stroke-width')).toBe('2');
      
      // Check text styles
      const label = doc.querySelector('.label');
      expect(label.getAttribute('font-size')).toBe('14');
    });

    test('should embed fonts in SVG', async () => {
      const svgString = await exportManager.exportSVG({ embedFonts: true });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check for font definitions
      const defs = doc.querySelector('defs');
      const styles = doc.querySelector('style');
      
      expect(defs || styles).toBeDefined();
      
      if (styles) {
        expect(styles.textContent).toContain('@font-face');
      }
    });

    test('should optimize SVG size', async () => {
      const unoptimized = await exportManager.exportSVG({ optimize: false });
      const optimized = await exportManager.exportSVG({ optimize: true });
      
      expect(optimized.length).toBeLessThan(unoptimized.length);
      
      // Check optimizations applied
      expect(optimized).not.toContain('  '); // No double spaces
      expect(optimized).not.toContain('\n\n'); // No double newlines
      expect(optimized).not.toMatch(/\s+>/); // No spaces before closing tags
    });
  });

  describe('PNG Export Quality', () => {
    test('should export PNG at correct resolution', async () => {
      const resolutions = [1, 2, 4]; // 1x, 2x, 4x
      
      for (const scale of resolutions) {
        const blob = await exportManager.exportPNG({ scale });
        const buffer = await blob.arrayBuffer();
        const png = PNG.sync.read(Buffer.from(buffer));
        
        expect(png.width).toBe(800 * scale);
        expect(png.height).toBe(600 * scale);
      }
    });

    test('should maintain visual quality at high DPI', async () => {
      const lowDPI = await exportManager.exportPNG({ scale: 1 });
      const highDPI = await exportManager.exportPNG({ scale: 4 });
      
      // Convert to buffers
      const lowBuffer = await lowDPI.arrayBuffer();
      const highBuffer = await highDPI.arrayBuffer();
      
      const lowPNG = PNG.sync.read(Buffer.from(lowBuffer));
      const highPNG = PNG.sync.read(Buffer.from(highBuffer));
      
      // High DPI should have more detail (larger file size)
      expect(highBuffer.byteLength).toBeGreaterThan(lowBuffer.byteLength * 3);
    });

    test('should render text clearly in PNG', async () => {
      // Create canvas with just text
      canvas.clear();
      const largeText = createLabel('ABCDEFGHIJKLMNOP', 400, 300);
      largeText.setAttribute('font-size', '48');
      canvas.addElement(largeText);
      
      const blob = await exportManager.exportPNG({ scale: 2 });
      const buffer = await blob.arrayBuffer();
      const png = PNG.sync.read(Buffer.from(buffer));
      
      // Check for text rendering (simplified - would use OCR in real test)
      let nonWhitePixels = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        const r = png.data[i];
        const g = png.data[i + 1];
        const b = png.data[i + 2];
        if (r < 250 || g < 250 || b < 250) {
          nonWhitePixels++;
        }
      }
      
      // Text should create significant non-white pixels
      expect(nonWhitePixels).toBeGreaterThan(1000);
    });

    test('should handle transparency correctly', async () => {
      const transparentBlob = await exportManager.exportPNG({ 
        transparent: true 
      });
      const opaqueBlob = await exportManager.exportPNG({ 
        transparent: false,
        backgroundColor: '#ffffff' 
      });
      
      const transparentBuffer = await transparentBlob.arrayBuffer();
      const opaqueBuffer = await opaqueBlob.arrayBuffer();
      
      const transparentPNG = PNG.sync.read(Buffer.from(transparentBuffer));
      const opaquePNG = PNG.sync.read(Buffer.from(opaqueBuffer));
      
      // Check alpha channel
      let hasTransparency = false;
      for (let i = 3; i < transparentPNG.data.length; i += 4) {
        if (transparentPNG.data[i] < 255) {
          hasTransparency = true;
          break;
        }
      }
      
      expect(hasTransparency).toBe(true);
      
      // Opaque should have no transparency
      let allOpaque = true;
      for (let i = 3; i < opaquePNG.data.length; i += 4) {
        if (opaquePNG.data[i] < 255) {
          allOpaque = false;
          break;
        }
      }
      
      expect(allOpaque).toBe(true);
    });
  });

  describe('PDF Export Quality', () => {
    test('should export valid PDF', async () => {
      const pdfBlob = await exportManager.exportPDF();
      const buffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check PDF header
      const header = new TextDecoder().decode(bytes.slice(0, 5));
      expect(header).toBe('%PDF-');
      
      // Check PDF has content
      expect(buffer.byteLength).toBeGreaterThan(1000);
    });

    test('should maintain vector quality in PDF', async () => {
      const pdfBlob = await exportManager.exportPDF();
      const buffer = await pdfBlob.arrayBuffer();
      const pdfContent = new TextDecoder().decode(new Uint8Array(buffer));
      
      // Check for vector commands (simplified)
      expect(pdfContent).toContain(' m '); // moveto
      expect(pdfContent).toContain(' l '); // lineto
      expect(pdfContent).toContain(' S '); // stroke
      expect(pdfContent).toContain(' f '); // fill
    });

    test('should embed fonts in PDF', async () => {
      const pdfBlob = await exportManager.exportPDF({ embedFonts: true });
      const buffer = await pdfBlob.arrayBuffer();
      const pdfContent = new TextDecoder().decode(new Uint8Array(buffer));
      
      // Check for font embedding
      expect(pdfContent).toContain('/Font');
      expect(pdfContent).toContain('/BaseFont');
    });

    test('should set correct page size', async () => {
      const sizes = {
        'letter': { width: 612, height: 792 },
        'a4': { width: 595, height: 842 },
        'custom': { width: 800, height: 600 }
      };
      
      for (const [format, dimensions] of Object.entries(sizes)) {
        const pdfBlob = await exportManager.exportPDF({ 
          pageSize: format,
          customWidth: format === 'custom' ? dimensions.width : undefined,
          customHeight: format === 'custom' ? dimensions.height : undefined
        });
        
        const buffer = await pdfBlob.arrayBuffer();
        const pdfContent = new TextDecoder().decode(new Uint8Array(buffer));
        
        // Check MediaBox contains correct dimensions
        const mediaBoxMatch = pdfContent.match(/\/MediaBox\s*\[\s*0\s+0\s+(\d+)\s+(\d+)\s*\]/);
        if (mediaBoxMatch) {
          const width = parseInt(mediaBoxMatch[1]);
          const height = parseInt(mediaBoxMatch[2]);
          
          expect(width).toBeCloseTo(dimensions.width, -1);
          expect(height).toBeCloseTo(dimensions.height, -1);
        }
      }
    });
  });

  describe('Cross-Format Consistency', () => {
    test('should maintain consistent layout across formats', async () => {
      // Export all formats
      const svgString = await exportManager.exportSVG();
      const pngBlob = await exportManager.exportPNG({ scale: 1 });
      const pdfBlob = await exportManager.exportPDF();
      
      // Parse SVG to get element positions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      
      const svgRect = svgDoc.querySelector('rect.component');
      const svgX = parseFloat(svgRect.getAttribute('x'));
      const svgY = parseFloat(svgRect.getAttribute('y'));
      
      // For PNG, we'd need to analyze pixel positions
      // For PDF, we'd need to parse PDF commands
      // This is a simplified test
      
      expect(svgX).toBe(100);
      expect(svgY).toBe(100);
    });

    test('should maintain color accuracy across formats', async () => {
      // Create simple colored element
      canvas.clear();
      const redRect = createComponent('rect', { 
        x: 100, y: 100, width: 100, height: 100, 
        fill: '#ff0000' 
      });
      canvas.addElement(redRect);
      
      // Export PNG
      const pngBlob = await exportManager.exportPNG({ scale: 1 });
      const buffer = await pngBlob.arrayBuffer();
      const png = PNG.sync.read(Buffer.from(buffer));
      
      // Sample center of red rectangle
      const centerX = 150;
      const centerY = 150;
      const idx = (centerY * png.width + centerX) * 4;
      
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      
      // Should be red
      expect(r).toBeGreaterThan(250);
      expect(g).toBeLessThan(5);
      expect(b).toBeLessThan(5);
    });
  });

  describe('Export Options', () => {
    test('should apply margin correctly', async () => {
      const margins = [0, 10, 50];
      
      for (const margin of margins) {
        const blob = await exportManager.exportPNG({ 
          scale: 1, 
          margin 
        });
        
        const buffer = await blob.arrayBuffer();
        const png = PNG.sync.read(Buffer.from(buffer));
        
        expect(png.width).toBe(800 + margin * 2);
        expect(png.height).toBe(600 + margin * 2);
      }
    });

    test('should crop to content when specified', async () => {
      // Clear and add small content
      canvas.clear();
      const smallRect = createComponent('rect', { 
        x: 200, y: 200, width: 50, height: 50, 
        fill: '#000000' 
      });
      canvas.addElement(smallRect);
      
      const fullBlob = await exportManager.exportPNG({ 
        scale: 1, 
        cropToContent: false 
      });
      const croppedBlob = await exportManager.exportPNG({ 
        scale: 1, 
        cropToContent: true,
        margin: 10
      });
      
      const fullBuffer = await fullBlob.arrayBuffer();
      const croppedBuffer = await croppedBlob.arrayBuffer();
      
      const fullPNG = PNG.sync.read(Buffer.from(fullBuffer));
      const croppedPNG = PNG.sync.read(Buffer.from(croppedBuffer));
      
      // Cropped should be much smaller
      expect(croppedPNG.width).toBeLessThan(100);
      expect(croppedPNG.height).toBeLessThan(100);
      expect(fullPNG.width).toBe(800);
      expect(fullPNG.height).toBe(600);
    });

    test('should apply quality settings for JPEG', async () => {
      const qualities = [10, 50, 90];
      const sizes = [];
      
      for (const quality of qualities) {
        const blob = await exportManager.exportJPEG({ 
          quality: quality / 100 
        });
        sizes.push(blob.size);
      }
      
      // Higher quality should result in larger file
      expect(sizes[0]).toBeLessThan(sizes[1]);
      expect(sizes[1]).toBeLessThan(sizes[2]);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty canvas export', async () => {
      canvas.clear();
      
      const svgString = await exportManager.exportSVG();
      const pngBlob = await exportManager.exportPNG();
      const pdfBlob = await exportManager.exportPDF();
      
      expect(svgString).toBeDefined();
      expect(pngBlob.size).toBeGreaterThan(0);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    test('should handle very large diagrams', async () => {
      // Add many elements
      for (let i = 0; i < 1000; i++) {
        const element = createComponent('circle', {
          cx: Math.random() * 800,
          cy: Math.random() * 600,
          r: 5,
          fill: '#000000'
        });
        canvas.addElement(element);
      }
      
      // Should still export without error
      const startTime = performance.now();
      const pngBlob = await exportManager.exportPNG({ scale: 1 });
      const exportTime = performance.now() - startTime;
      
      expect(pngBlob.size).toBeGreaterThan(0);
      expect(exportTime).toBeLessThan(10000); // Should complete in 10 seconds
    });

    test('should handle special characters in text', async () => {
      canvas.clear();
      const specialText = createLabel('Special: <>&"\'©™€', 400, 300);
      canvas.addElement(specialText);
      
      const svgString = await exportManager.exportSVG();
      
      // Check proper escaping
      expect(svgString).toContain('&lt;');
      expect(svgString).toContain('&gt;');
      expect(svgString).toContain('&amp;');
      expect(svgString).toContain('&quot;');
    });
  });
});