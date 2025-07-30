import { SvgCanvas } from '../../src/svgCanvas';
import { StateStore } from '../../src/stateStore';

describe('SvgCanvas', () => {
  let svgElement;
  let stateStore;
  let canvas;

  beforeEach(() => {
    // Create mock SVG element
    document.body.innerHTML = `
      <svg id="test-svg" width="800" height="600">
        <defs></defs>
        <g id="viewport"></g>
      </svg>
    `;
    
    svgElement = document.getElementById('test-svg');
    stateStore = new StateStore();
    canvas = new SvgCanvas(svgElement, stateStore);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(canvas.svg).toBe(svgElement);
      expect(canvas.stateStore).toBe(stateStore);
      expect(canvas.viewport).toBeDefined();
      expect(canvas.mode).toBe('select');
      expect(canvas.elements).toEqual([]);
      expect(canvas.wires).toEqual([]);
    });

    test('should create viewport if not exists', () => {
      document.body.innerHTML = '<svg id="test-svg-2"></svg>';
      const svg2 = document.getElementById('test-svg-2');
      const canvas2 = new SvgCanvas(svg2, stateStore);
      
      expect(canvas2.viewport).toBeDefined();
      expect(canvas2.viewport.id).toBe('viewport');
    });
  });

  describe('Element Management', () => {
    test('should add element to canvas', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.id = 'test-element';
      
      canvas.addElement(element);
      
      expect(canvas.elements).toContain(element);
      expect(canvas.viewport.contains(element)).toBe(true);
    });

    test('should remove element from canvas', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.id = 'test-element';
      
      canvas.addElement(element);
      canvas.removeElement(element);
      
      expect(canvas.elements).not.toContain(element);
      expect(canvas.viewport.contains(element)).toBe(false);
    });

    test('should get element by ID', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.id = 'test-element';
      
      canvas.addElement(element);
      const found = canvas.getElementById('test-element');
      
      expect(found).toBe(element);
    });

    test('should return all elements', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      
      const elements = canvas.getElements();
      expect(elements).toHaveLength(2);
      expect(elements).toContain(elem1);
      expect(elements).toContain(elem2);
    });
  });

  describe('Wire Management', () => {
    test('should add wire to canvas', () => {
      const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wire.classList.add('wire');
      wire.id = 'wire-1';
      
      canvas.addWire(wire);
      
      expect(canvas.wires).toContain(wire);
      expect(canvas.viewport.contains(wire)).toBe(true);
    });

    test('should remove wire from canvas', () => {
      const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wire.classList.add('wire');
      
      canvas.addWire(wire);
      canvas.removeWire(wire);
      
      expect(canvas.wires).not.toContain(wire);
      expect(canvas.viewport.contains(wire)).toBe(false);
    });

    test('should get wires connected to element', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.id = 'elem-1';
      
      const wire1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wire1.setAttribute('data-start-element', 'elem-1');
      
      const wire2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wire2.setAttribute('data-end-element', 'elem-1');
      
      const wire3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wire3.setAttribute('data-start-element', 'other');
      
      canvas.addElement(element);
      canvas.addWire(wire1);
      canvas.addWire(wire2);
      canvas.addWire(wire3);
      
      const connectedWires = canvas.getWiresForElement('elem-1');
      
      expect(connectedWires).toHaveLength(2);
      expect(connectedWires).toContain(wire1);
      expect(connectedWires).toContain(wire2);
      expect(connectedWires).not.toContain(wire3);
    });
  });

  describe('Selection Management', () => {
    test('should select single element', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      canvas.addElement(element);
      
      canvas.selectElement(element);
      
      expect(canvas.selectedElements).toContain(element);
      expect(element.classList.contains('selected')).toBe(true);
    });

    test('should deselect element', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      canvas.addElement(element);
      canvas.selectElement(element);
      
      canvas.deselectElement(element);
      
      expect(canvas.selectedElements).not.toContain(element);
      expect(element.classList.contains('selected')).toBe(false);
    });

    test('should clear all selections', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      canvas.selectElement(elem1);
      canvas.selectElement(elem2);
      
      canvas.clearSelection();
      
      expect(canvas.selectedElements).toHaveLength(0);
      expect(elem1.classList.contains('selected')).toBe(false);
      expect(elem2.classList.contains('selected')).toBe(false);
    });

    test('should handle multi-selection', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      
      canvas.selectElement(elem1);
      canvas.selectElement(elem2, true); // Multi-select
      
      expect(canvas.selectedElements).toHaveLength(2);
      expect(canvas.selectedElements).toContain(elem1);
      expect(canvas.selectedElements).toContain(elem2);
    });
  });

  describe('Mode Management', () => {
    test('should set and get mode', () => {
      canvas.setMode('wire');
      expect(canvas.getMode()).toBe('wire');
      
      canvas.setMode('label');
      expect(canvas.getMode()).toBe('label');
    });

    test('should trigger mode change event', () => {
      const mockCallback = jest.fn();
      canvas.addEventListener('modechange', mockCallback);
      
      canvas.setMode('wire');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { mode: 'wire', previousMode: 'select' }
        })
      );
    });
  });

  describe('Coordinate Transformation', () => {
    test('should convert screen to SVG coordinates', () => {
      const screenPoint = { x: 100, y: 100 };
      const svgPoint = canvas.screenToSVG(screenPoint.x, screenPoint.y);
      
      expect(svgPoint).toHaveProperty('x');
      expect(svgPoint).toHaveProperty('y');
      expect(typeof svgPoint.x).toBe('number');
      expect(typeof svgPoint.y).toBe('number');
    });

    test('should get mouse position from event', () => {
      const mockEvent = {
        clientX: 150,
        clientY: 200,
        currentTarget: svgElement
      };
      
      const position = canvas.getMousePosition(mockEvent);
      
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
    });
  });

  describe('Bounds Calculation', () => {
    test('should calculate element bounds', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', '10');
      element.setAttribute('y', '20');
      element.setAttribute('width', '100');
      element.setAttribute('height', '50');
      
      canvas.addElement(element);
      
      const bounds = canvas.getElementBounds(element);
      
      expect(bounds).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50
      });
    });

    test('should calculate selection bounds', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem1.setAttribute('x', '10');
      elem1.setAttribute('y', '10');
      elem1.setAttribute('width', '50');
      elem1.setAttribute('height', '50');
      
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem2.setAttribute('x', '100');
      elem2.setAttribute('y', '100');
      elem2.setAttribute('width', '50');
      elem2.setAttribute('height', '50');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      canvas.selectElement(elem1);
      canvas.selectElement(elem2, true);
      
      const bounds = canvas.getSelectionBounds();
      
      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(10);
      expect(bounds.width).toBe(140);
      expect(bounds.height).toBe(140);
    });
  });

  describe('Clear Canvas', () => {
    test('should clear all elements and wires', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      canvas.addWire(wire);
      
      canvas.clear();
      
      expect(canvas.elements).toHaveLength(0);
      expect(canvas.wires).toHaveLength(0);
      expect(canvas.selectedElements).toHaveLength(0);
      expect(canvas.viewport.children.length).toBe(0);
    });
  });

  describe('Event Handling', () => {
    test('should handle click events in select mode', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      canvas.addElement(element);
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 100,
        clientY: 100
      });
      
      element.dispatchEvent(clickEvent);
      
      expect(canvas.selectedElements).toContain(element);
    });

    test('should handle drag operations', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', '100');
      element.setAttribute('y', '100');
      canvas.addElement(element);
      canvas.selectElement(element);
      
      // Simulate drag
      const mousedown = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100
      });
      element.dispatchEvent(mousedown);
      
      const mousemove = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 150,
        clientY: 150
      });
      document.dispatchEvent(mousemove);
      
      const mouseup = new MouseEvent('mouseup', {
        bubbles: true
      });
      document.dispatchEvent(mouseup);
      
      // Element position should have changed
      const newX = parseFloat(element.getAttribute('x'));
      const newY = parseFloat(element.getAttribute('y'));
      
      expect(newX).not.toBe(100);
      expect(newY).not.toBe(100);
    });
  });

  describe('Performance Features', () => {
    test('should implement viewport culling', () => {
      // Add many elements
      for (let i = 0; i < 100; i++) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        element.setAttribute('x', i * 100);
        element.setAttribute('y', i * 100);
        element.setAttribute('width', '50');
        element.setAttribute('height', '50');
        canvas.addElement(element);
      }
      
      // Mock viewport bounds
      canvas.viewportBounds = { x: 0, y: 0, width: 800, height: 600 };
      
      const visibleElements = canvas.getVisibleElements();
      
      // Only elements within viewport should be visible
      expect(visibleElements.length).toBeLessThan(100);
    });

    test('should batch DOM updates', () => {
      const updates = [];
      
      // Queue multiple updates
      for (let i = 0; i < 10; i++) {
        updates.push(() => {
          const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          canvas.addElement(element);
        });
      }
      
      // Execute batch update
      canvas.batchUpdate(() => {
        updates.forEach(update => update());
      });
      
      expect(canvas.elements).toHaveLength(10);
    });
  });

  describe('Export Functionality', () => {
    test('should serialize canvas to SVG string', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', '10');
      element.setAttribute('y', '20');
      element.setAttribute('width', '100');
      element.setAttribute('height', '50');
      canvas.addElement(element);
      
      const svgString = canvas.toSVGString();
      
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('<rect');
      expect(svgString).toContain('x="10"');
      expect(svgString).toContain('y="20"');
    });

    test('should calculate canvas bounds', () => {
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem1.setAttribute('x', '10');
      elem1.setAttribute('y', '10');
      elem1.setAttribute('width', '50');
      elem1.setAttribute('height', '50');
      
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem2.setAttribute('x', '100');
      elem2.setAttribute('y', '100');
      elem2.setAttribute('width', '50');
      elem2.setAttribute('height', '50');
      
      canvas.addElement(elem1);
      canvas.addElement(elem2);
      
      const bounds = canvas.getCanvasBounds();
      
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(10);
      expect(bounds.maxX).toBe(150);
      expect(bounds.maxY).toBe(150);
    });
  });
});