import { ElementFactory } from '../../src/elementFactory';
import { SvgCanvas } from '../../src/svgCanvas';
import { StateStore } from '../../src/stateStore';
import { ComponentLibrary } from '../../src/componentLibrary/ComponentLibrary';

describe('Component Rendering Integration Tests', () => {
  let canvas;
  let elementFactory;
  let stateStore;
  let componentLibrary;
  let svgElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="test-svg" width="1000" height="800">
        <defs></defs>
        <g id="viewport"></g>
      </svg>
    `;
    
    svgElement = document.getElementById('test-svg');
    stateStore = new StateStore();
    canvas = new SvgCanvas(svgElement, stateStore);
    componentLibrary = new ComponentLibrary(stateStore);
    
    // Mock pan-zoom instance
    const mockPanZoom = {
      getZoom: () => 1,
      getPan: () => ({ x: 0, y: 0 }),
      zoomAtPoint: jest.fn(),
      pan: jest.fn()
    };
    
    elementFactory = new ElementFactory(canvas, stateStore, mockPanZoom, componentLibrary);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Basic Component Rendering', () => {
    test('should render power supply component correctly', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      expect(component).toBeDefined();
      expect(component.tagName).toBe('g');
      expect(component.getAttribute('data-type')).toBe('power-supply');
      expect(component.getAttribute('transform')).toContain('translate(400, 300)');
      
      // Check for required elements
      const image = component.querySelector('image');
      expect(image).toBeDefined();
      expect(image.getAttribute('href')).toContain('powersupply.png');
      
      // Check terminals
      const terminals = component.querySelectorAll('.terminal');
      expect(terminals.length).toBeGreaterThan(0);
    });

    test('should render card reader component correctly', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      
      expect(component).toBeDefined();
      expect(component.getAttribute('data-type')).toBe('card-reader');
      
      // Check for specific card reader elements
      const image = component.querySelector('image');
      expect(image.getAttribute('href')).toContain('card_reader.png');
      
      // Check for LED indicators
      const leds = component.querySelectorAll('.led-indicator');
      expect(leds.length).toBeGreaterThan(0);
    });

    test('should render strike component correctly', () => {
      const component = elementFactory.createElement('strike', 300, 200);
      
      expect(component).toBeDefined();
      expect(component.getAttribute('data-type')).toBe('strike');
      
      // Check strike-specific elements
      const image = component.querySelector('image');
      expect(image.getAttribute('href')).toContain('strike.png');
      
      // Check wiring terminals
      const terminals = component.querySelectorAll('.terminal');
      expect(terminals.length).toBe(2); // Positive and negative
    });
  });

  describe('Component Scaling and Positioning', () => {
    test('should scale components correctly', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      // Scale up
      elementFactory.scaleElement(component, 1.5);
      
      const transform = component.getAttribute('transform');
      expect(transform).toContain('scale(1.5)');
      
      // Scale down
      elementFactory.scaleElement(component, 0.5);
      const newTransform = component.getAttribute('transform');
      expect(newTransform).toContain('scale(0.5)');
    });

    test('should maintain aspect ratio when scaling', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      const originalBounds = component.getBBox();
      const originalAspect = originalBounds.width / originalBounds.height;
      
      elementFactory.scaleElement(component, 2);
      
      const scaledBounds = component.getBBox();
      const scaledAspect = scaledBounds.width / scaledBounds.height;
      
      expect(Math.abs(originalAspect - scaledAspect)).toBeLessThan(0.01);
    });

    test('should position components precisely', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 500.5, y: 300.25 },
        { x: 999, y: 799 }
      ];
      
      positions.forEach(pos => {
        const component = elementFactory.createElement('strike', pos.x, pos.y);
        const transform = component.getAttribute('transform');
        
        expect(transform).toContain(`translate(${pos.x}, ${pos.y})`);
      });
    });
  });

  describe('Component Visual States', () => {
    test('should render selected state correctly', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      // Select component
      canvas.selectElement(component);
      
      expect(component.classList.contains('selected')).toBe(true);
      
      // Check for selection outline
      const selectionOutline = component.querySelector('.selection-outline');
      expect(selectionOutline).toBeDefined();
      expect(selectionOutline.getAttribute('stroke')).toBe('#007bff');
      expect(selectionOutline.getAttribute('stroke-width')).toBe('2');
    });

    test('should render hover state correctly', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      
      // Simulate hover
      const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
      component.dispatchEvent(hoverEvent);
      
      expect(component.classList.contains('hover')).toBe(true);
      
      // Check hover effects
      const hoverOutline = component.querySelector('.hover-outline');
      expect(hoverOutline).toBeDefined();
      expect(parseFloat(hoverOutline.getAttribute('opacity'))).toBeGreaterThan(0);
    });

    test('should render error state correctly', () => {
      const component = elementFactory.createElement('strike', 300, 200);
      
      // Set error state
      component.classList.add('error');
      component.setAttribute('data-error', 'Connection failed');
      
      // Check error indicator
      const errorIcon = component.querySelector('.error-icon');
      expect(errorIcon).toBeDefined();
      
      // Check error styling
      const outline = component.querySelector('.component-outline');
      expect(outline.getAttribute('stroke')).toBe('#dc3545');
    });

    test('should render disabled state correctly', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      // Disable component
      component.classList.add('disabled');
      component.setAttribute('data-disabled', 'true');
      
      // Check opacity
      expect(parseFloat(component.style.opacity)).toBeLessThan(1);
      
      // Check interaction disabled
      const terminals = component.querySelectorAll('.terminal');
      terminals.forEach(terminal => {
        expect(terminal.style.pointerEvents).toBe('none');
      });
    });
  });

  describe('Terminal and Connection Points', () => {
    test('should render terminals at correct positions', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      const terminals = component.querySelectorAll('.terminal');
      
      terminals.forEach(terminal => {
        const cx = parseFloat(terminal.getAttribute('cx'));
        const cy = parseFloat(terminal.getAttribute('cy'));
        
        // Terminals should be within component bounds
        expect(cx).toBeGreaterThanOrEqual(-50);
        expect(cx).toBeLessThanOrEqual(50);
        expect(cy).toBeGreaterThanOrEqual(-50);
        expect(cy).toBeLessThanOrEqual(50);
      });
    });

    test('should highlight terminals on hover', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      const terminal = component.querySelector('.terminal');
      
      // Simulate hover on terminal
      const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
      terminal.dispatchEvent(hoverEvent);
      
      expect(terminal.classList.contains('terminal-hover')).toBe(true);
      expect(parseFloat(terminal.getAttribute('r'))).toBeGreaterThan(5);
    });

    test('should show terminal labels', () => {
      const component = elementFactory.createElement('strike', 300, 200);
      
      const terminals = component.querySelectorAll('.terminal');
      terminals.forEach(terminal => {
        const label = terminal.getAttribute('data-label');
        expect(label).toBeDefined();
        expect(['positive', 'negative', 'common', 'normally-open', 'normally-closed'])
          .toContain(label.toLowerCase());
      });
    });
  });

  describe('Component Rotation', () => {
    test('should rotate components correctly', () => {
      const component = elementFactory.createElement('power-supply', 400, 300);
      
      const rotations = [0, 90, 180, 270];
      
      rotations.forEach(angle => {
        elementFactory.rotateElement(component, angle);
        
        const transform = component.getAttribute('transform');
        expect(transform).toContain(`rotate(${angle})`);
      });
    });

    test('should maintain terminal positions after rotation', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      
      // Get original terminal positions
      const originalPositions = Array.from(component.querySelectorAll('.terminal'))
        .map(t => ({
          x: parseFloat(t.getAttribute('cx')),
          y: parseFloat(t.getAttribute('cy'))
        }));
      
      // Rotate 90 degrees
      elementFactory.rotateElement(component, 90);
      
      // Check terminals rotated correctly
      const rotatedPositions = Array.from(component.querySelectorAll('.terminal'))
        .map(t => ({
          x: parseFloat(t.getAttribute('cx')),
          y: parseFloat(t.getAttribute('cy'))
        }));
      
      originalPositions.forEach((orig, i) => {
        const rotated = rotatedPositions[i];
        // 90-degree rotation: (x,y) -> (-y,x)
        expect(Math.abs(rotated.x - (-orig.y))).toBeLessThan(0.1);
        expect(Math.abs(rotated.y - orig.x)).toBeLessThan(0.1);
      });
    });
  });

  describe('Custom Component Rendering', () => {
    test('should render custom components from library', () => {
      // Create custom component template
      const template = {
        id: 'custom-sensor',
        name: 'Custom Sensor',
        type: 'sensor',
        svg: `
          <g>
            <rect width="60" height="40" fill="#f0f0f0" stroke="#333"/>
            <circle cx="30" cy="20" r="10" fill="#00ff00"/>
            <text x="30" y="35" text-anchor="middle" font-size="10">SENSOR</text>
          </g>
        `,
        terminals: [
          { id: 'power', x: 0, y: 20, label: 'PWR' },
          { id: 'ground', x: 60, y: 20, label: 'GND' },
          { id: 'signal', x: 30, y: 0, label: 'SIG' }
        ]
      };
      
      componentLibrary.addComponent(template);
      
      const component = elementFactory.createFromTemplate(template, 600, 500);
      
      expect(component).toBeDefined();
      expect(component.getAttribute('data-type')).toBe('custom-sensor');
      
      // Check custom elements rendered
      const rect = component.querySelector('rect');
      expect(rect).toBeDefined();
      expect(rect.getAttribute('width')).toBe('60');
      
      const circle = component.querySelector('circle');
      expect(circle).toBeDefined();
      expect(circle.getAttribute('fill')).toBe('#00ff00');
      
      const text = component.querySelector('text');
      expect(text).toBeDefined();
      expect(text.textContent).toBe('SENSOR');
      
      // Check terminals
      const terminals = component.querySelectorAll('.terminal');
      expect(terminals.length).toBe(3);
    });
  });

  describe('Performance Optimization', () => {
    test('should use object pooling for repeated components', () => {
      const startTime = performance.now();
      
      // Create many components
      const components = [];
      for (let i = 0; i < 100; i++) {
        const component = elementFactory.createElement('power-supply', i * 10, i * 10);
        components.push(component);
      }
      
      const creationTime = performance.now() - startTime;
      console.log(`Created 100 components in ${creationTime}ms`);
      
      // Should be fast due to pooling
      expect(creationTime).toBeLessThan(1000);
      
      // Components should be unique instances
      const uniqueIds = new Set(components.map(c => c.id));
      expect(uniqueIds.size).toBe(100);
    });

    test('should efficiently update component properties', () => {
      const component = elementFactory.createElement('card-reader', 500, 400);
      
      const startTime = performance.now();
      
      // Perform many property updates
      for (let i = 0; i < 1000; i++) {
        component.setAttribute('data-status', i % 2 === 0 ? 'active' : 'inactive');
        component.style.opacity = 0.5 + (i % 50) / 100;
      }
      
      const updateTime = performance.now() - startTime;
      console.log(`1000 property updates in ${updateTime}ms`);
      
      expect(updateTime).toBeLessThan(100);
    });
  });

  describe('Complex Component Groups', () => {
    test('should render grouped components correctly', () => {
      // Create a complex component group (e.g., access control panel)
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('data-type', 'access-control-panel');
      
      // Add multiple sub-components
      const controller = elementFactory.createElement('controller', 0, 0);
      const reader1 = elementFactory.createElement('card-reader', 100, 0);
      const reader2 = elementFactory.createElement('card-reader', 100, 100);
      const strike1 = elementFactory.createElement('strike', 200, 0);
      const strike2 = elementFactory.createElement('strike', 200, 100);
      
      group.appendChild(controller);
      group.appendChild(reader1);
      group.appendChild(reader2);
      group.appendChild(strike1);
      group.appendChild(strike2);
      
      canvas.addElement(group);
      
      // Check group structure
      expect(group.children.length).toBe(5);
      
      // Check relative positioning maintained
      const reader1Pos = reader1.getAttribute('transform');
      expect(reader1Pos).toContain('translate(100, 0)');
      
      const strike2Pos = strike2.getAttribute('transform');
      expect(strike2Pos).toContain('translate(200, 100)');
    });
  });
});