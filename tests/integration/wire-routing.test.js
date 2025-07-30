import { WireTool } from '../../src/wireTool';
import { AStarRouter } from '../../src/aStarRouter';
import { SvgCanvas } from '../../src/svgCanvas';
import { StateStore } from '../../src/stateStore';

describe('Wire Routing Accuracy Tests', () => {
  let canvas;
  let wireTool;
  let stateStore;
  let svgElement;
  let router;

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
    wireTool = new WireTool(canvas, stateStore);
    router = new AStarRouter();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Basic Wire Routing', () => {
    test('should create straight horizontal wire', () => {
      const start = { x: 100, y: 200 };
      const end = { x: 300, y: 200 };
      
      const path = wireTool.createWirePath(start, end);
      
      expect(path).toBeDefined();
      expect(path.tagName).toBe('path');
      expect(path.classList.contains('wire')).toBe(true);
      
      const d = path.getAttribute('d');
      expect(d).toContain(`M ${start.x} ${start.y}`);
      expect(d).toContain(`L ${end.x} ${end.y}`);
    });

    test('should create straight vertical wire', () => {
      const start = { x: 200, y: 100 };
      const end = { x: 200, y: 400 };
      
      const path = wireTool.createWirePath(start, end);
      const d = path.getAttribute('d');
      
      expect(d).toContain(`M ${start.x} ${start.y}`);
      expect(d).toContain(`L ${end.x} ${end.y}`);
    });

    test('should create L-shaped wire', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 300, y: 300 };
      
      const path = wireTool.createWirePath(start, end);
      const d = path.getAttribute('d');
      
      // Should have at least one turn
      const segments = d.split(/[ML]/).filter(s => s.trim());
      expect(segments.length).toBeGreaterThan(2);
    });
  });

  describe('Obstacle Avoidance', () => {
    beforeEach(() => {
      // Add obstacles (components)
      const obstacles = [
        { x: 200, y: 200, width: 100, height: 100 },
        { x: 400, y: 300, width: 80, height: 80 },
        { x: 300, y: 100, width: 60, height: 60 }
      ];
      
      obstacles.forEach((obs, i) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', obs.x);
        rect.setAttribute('y', obs.y);
        rect.setAttribute('width', obs.width);
        rect.setAttribute('height', obs.height);
        rect.setAttribute('data-type', 'component');
        rect.id = `obstacle-${i}`;
        canvas.addElement(rect);
      });
    });

    test('should route around single obstacle', () => {
      const start = { x: 100, y: 250 };
      const end = { x: 350, y: 250 };
      
      // Direct path would go through obstacle at (200, 200)
      const obstacles = canvas.getElements().map(el => ({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        width: parseFloat(el.getAttribute('width')),
        height: parseFloat(el.getAttribute('height'))
      }));
      
      const route = router.findPath(start, end, obstacles);
      
      // Should not intersect with obstacle
      const intersectsObstacle = route.some(point => 
        point.x >= 200 && point.x <= 300 &&
        point.y >= 200 && point.y <= 300
      );
      
      expect(intersectsObstacle).toBe(false);
      expect(route.length).toBeGreaterThan(2); // Not a straight line
    });

    test('should route around multiple obstacles', () => {
      const start = { x: 50, y: 150 };
      const end = { x: 550, y: 350 };
      
      const obstacles = canvas.getElements().map(el => ({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        width: parseFloat(el.getAttribute('width')),
        height: parseFloat(el.getAttribute('height'))
      }));
      
      const route = router.findPath(start, end, obstacles);
      
      // Verify no intersections with any obstacle
      obstacles.forEach(obs => {
        const intersects = route.some(point =>
          point.x >= obs.x && point.x <= obs.x + obs.width &&
          point.y >= obs.y && point.y <= obs.y + obs.height
        );
        expect(intersects).toBe(false);
      });
    });

    test('should find shortest path around obstacles', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 500, y: 400 };
      
      const obstacles = canvas.getElements().map(el => ({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        width: parseFloat(el.getAttribute('width')),
        height: parseFloat(el.getAttribute('height'))
      }));
      
      const route = router.findPath(start, end, obstacles);
      
      // Calculate total path length
      let totalLength = 0;
      for (let i = 1; i < route.length; i++) {
        const dx = route[i].x - route[i-1].x;
        const dy = route[i].y - route[i-1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
      
      // Should be reasonably close to direct distance
      const directDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      
      expect(totalLength).toBeLessThan(directDistance * 2); // Max 2x direct distance
    });
  });

  describe('Wire Style and Appearance', () => {
    test('should apply correct wire styles', () => {
      const wire = wireTool.createWirePath({ x: 100, y: 100 }, { x: 300, y: 300 });
      
      expect(wire.getAttribute('stroke')).toBeDefined();
      expect(wire.getAttribute('stroke-width')).toBeDefined();
      expect(wire.getAttribute('fill')).toBe('none');
      expect(parseFloat(wire.getAttribute('stroke-width'))).toBeGreaterThan(0);
    });

    test('should create different wire types', () => {
      const wireTypes = ['power', 'data', 'ground', 'signal'];
      
      wireTypes.forEach(type => {
        wireTool.setWireType(type);
        const wire = wireTool.createWirePath({ x: 0, y: 0 }, { x: 100, y: 0 });
        
        expect(wire.classList.contains(`wire-${type}`)).toBe(true);
        expect(wire.getAttribute('data-wire-type')).toBe(type);
      });
    });

    test('should support different wire colors', () => {
      const colorMap = {
        'power': '#ff0000',
        'ground': '#000000',
        'data': '#0000ff',
        'signal': '#00ff00'
      };
      
      Object.entries(colorMap).forEach(([type, color]) => {
        wireTool.setWireType(type);
        const wire = wireTool.createWirePath({ x: 0, y: 0 }, { x: 100, y: 0 });
        
        expect(wire.getAttribute('stroke')).toBe(color);
      });
    });
  });

  describe('Wire Connection Points', () => {
    test('should snap to terminal points', () => {
      // Create component with terminals
      const component = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      component.setAttribute('transform', 'translate(300, 300)');
      
      const terminal1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      terminal1.classList.add('terminal');
      terminal1.setAttribute('cx', '-50');
      terminal1.setAttribute('cy', '0');
      terminal1.setAttribute('r', '5');
      
      const terminal2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      terminal2.classList.add('terminal');
      terminal2.setAttribute('cx', '50');
      terminal2.setAttribute('cy', '0');
      terminal2.setAttribute('r', '5');
      
      component.appendChild(terminal1);
      component.appendChild(terminal2);
      canvas.addElement(component);
      
      // Test snapping
      const nearPoint = { x: 248, y: 302 }; // Close to terminal1
      const snapped = wireTool.snapToTerminal(nearPoint);
      
      expect(snapped.x).toBe(250); // 300 - 50
      expect(snapped.y).toBe(300); // 300 + 0
      expect(snapped.terminal).toBe(terminal1);
    });

    test('should track wire connections', () => {
      const wire = wireTool.createWirePath({ x: 100, y: 100 }, { x: 300, y: 300 });
      wire.setAttribute('data-start-element', 'comp-1');
      wire.setAttribute('data-start-terminal', 'term-1');
      wire.setAttribute('data-end-element', 'comp-2');
      wire.setAttribute('data-end-terminal', 'term-2');
      
      canvas.addWire(wire);
      
      const connections = wireTool.getWireConnections(wire);
      
      expect(connections.start.element).toBe('comp-1');
      expect(connections.start.terminal).toBe('term-1');
      expect(connections.end.element).toBe('comp-2');
      expect(connections.end.terminal).toBe('term-2');
    });
  });

  describe('Complex Routing Scenarios', () => {
    test('should handle maze-like obstacles', () => {
      // Create maze of obstacles
      const maze = [
        { x: 100, y: 100, width: 20, height: 200 },
        { x: 100, y: 100, width: 200, height: 20 },
        { x: 280, y: 100, width: 20, height: 200 },
        { x: 200, y: 200, width: 100, height: 20 },
        { x: 200, y: 200, width: 20, height: 100 }
      ];
      
      maze.forEach((obs, i) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', obs.x);
        rect.setAttribute('y', obs.y);
        rect.setAttribute('width', obs.width);
        rect.setAttribute('height', obs.height);
        rect.id = `maze-${i}`;
        canvas.addElement(rect);
      });
      
      const start = { x: 150, y: 150 };
      const end = { x: 250, y: 250 };
      
      const obstacles = maze;
      const route = router.findPath(start, end, obstacles);
      
      expect(route).toBeDefined();
      expect(route.length).toBeGreaterThan(2);
      
      // Verify path doesn't intersect obstacles
      maze.forEach(obs => {
        const intersects = route.some(point =>
          point.x >= obs.x && point.x <= obs.x + obs.width &&
          point.y >= obs.y && point.y <= obs.y + obs.height
        );
        expect(intersects).toBe(false);
      });
    });

    test('should handle no valid path scenario', () => {
      // Create enclosed area
      const walls = [
        { x: 100, y: 100, width: 200, height: 10 },
        { x: 100, y: 100, width: 10, height: 200 },
        { x: 100, y: 290, width: 200, height: 10 },
        { x: 290, y: 100, width: 10, height: 200 }
      ];
      
      walls.forEach((wall, i) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', wall.x);
        rect.setAttribute('y', wall.y);
        rect.setAttribute('width', wall.width);
        rect.setAttribute('height', wall.height);
        rect.id = `wall-${i}`;
        canvas.addElement(rect);
      });
      
      const start = { x: 50, y: 200 };  // Outside
      const end = { x: 200, y: 200 };   // Inside enclosed area
      
      const route = router.findPath(start, end, walls);
      
      // Should return empty or partial path
      expect(route).toBeDefined();
      if (route.length > 0) {
        // Last point should not reach the end
        const lastPoint = route[route.length - 1];
        expect(lastPoint.x).not.toBe(end.x);
        expect(lastPoint.y).not.toBe(end.y);
      }
    });
  });

  describe('Wire Editing', () => {
    test('should support wire rerouting', () => {
      const wire = wireTool.createWirePath({ x: 100, y: 100 }, { x: 300, y: 300 });
      canvas.addWire(wire);
      
      // Add obstacle in the way
      const obstacle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      obstacle.setAttribute('x', '150');
      obstacle.setAttribute('y', '150');
      obstacle.setAttribute('width', '100');
      obstacle.setAttribute('height', '100');
      canvas.addElement(obstacle);
      
      // Reroute wire
      wireTool.rerouteWire(wire);
      
      const newPath = wire.getAttribute('d');
      const segments = newPath.split(/[ML]/).filter(s => s.trim());
      
      // Should have more segments to avoid obstacle
      expect(segments.length).toBeGreaterThan(2);
    });

    test('should delete wire segments', () => {
      const wire = wireTool.createWirePath({ x: 100, y: 100 }, { x: 300, y: 300 });
      canvas.addWire(wire);
      
      wireTool.deleteWire(wire);
      
      expect(canvas.wires).not.toContain(wire);
      expect(wire.parentNode).toBeNull();
    });
  });

  describe('Performance', () => {
    test('should route efficiently for long distances', () => {
      const start = { x: 50, y: 50 };
      const end = { x: 950, y: 750 };
      
      const startTime = performance.now();
      const route = router.findPath(start, end, []);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in 100ms
      expect(route).toBeDefined();
    });

    test('should handle many obstacles efficiently', () => {
      // Create 100 random obstacles
      const obstacles = [];
      for (let i = 0; i < 100; i++) {
        obstacles.push({
          x: Math.random() * 900 + 50,
          y: Math.random() * 700 + 50,
          width: 20 + Math.random() * 30,
          height: 20 + Math.random() * 30
        });
      }
      
      const start = { x: 50, y: 400 };
      const end = { x: 950, y: 400 };
      
      const startTime = performance.now();
      const route = router.findPath(start, end, obstacles);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete in 500ms
      expect(route).toBeDefined();
    });
  });
});