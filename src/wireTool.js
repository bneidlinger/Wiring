import { SimpleWireRouter } from './simpleWireRouter.js';
import { WireEditor } from './wireEditor.js';

export class WireTool {
    constructor(canvas, stateStore) {
        this.canvas = canvas;
        this.stateStore = stateStore;
        this.wireIdCounter = 0;
        
        this.isDrawing = false;
        this.startTerminal = null;
        this.previewWire = null;
        
        // Initialize simple router
        this.router = new SimpleWireRouter(10); // 10px grid size
        
        // Initialize wire editor
        this.wireEditor = new WireEditor(canvas, stateStore, this.router);
        
        // Junction support
        this.junctions = new Map();
        this.junctionRadius = 4;
        
        // Auto-routing settings
        this.autoRouteEnabled = true;
        this.bundlingEnabled = true;
        this.cornerRadius = 5;
        
        this.setupEventListeners();
        this.initializeRouter();
    }

    setupEventListeners() {
        // Wire color and gauge selectors
        this.colorSelector = document.getElementById('wire-color');
        this.gaugeSelector = document.getElementById('wire-gauge');
        
        // Routing option controls
        this.autoRouteCheckbox = document.getElementById('auto-route');
        this.bundlingCheckbox = document.getElementById('wire-bundling');
        this.cornerRadiusSlider = document.getElementById('corner-radius');
        this.cornerRadiusValue = document.getElementById('corner-radius-value');
        
        // Update settings from UI
        this.autoRouteCheckbox.addEventListener('change', (e) => {
            this.autoRouteEnabled = e.target.checked;
        });
        
        this.bundlingCheckbox.addEventListener('change', (e) => {
            this.bundlingEnabled = e.target.checked;
        });
        
        this.cornerRadiusSlider.addEventListener('input', (e) => {
            this.cornerRadius = parseInt(e.target.value);
            this.cornerRadiusValue.textContent = this.cornerRadius;
        });
        
        // Terminal hover handling during wire drawing
        document.addEventListener('mouseover', (e) => {
            if (this.isDrawing && e.target.classList && e.target.classList.contains('terminal')) {
                if (e.target !== this.startTerminal) {
                    console.log('Hovering over terminal during wire drawing:', e.target);
                    e.target.setAttribute('fill', '#4CAF50'); // Green for valid target
                    e.target.setAttribute('r', '8'); // Make it bigger
                }
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (this.isDrawing && e.target.classList && e.target.classList.contains('terminal')) {
                if (e.target !== this.startTerminal) {
                    e.target.setAttribute('fill', '#666'); // Reset color
                    e.target.setAttribute('r', '6'); // Reset size
                }
            }
        });
        
        // Terminal mousedown handling for click-hold-drag-release
        document.addEventListener('mousedown', (e) => {
            if (this.canvas.mode !== 'wire') return;
            
            const terminal = e.target.closest('.terminal');
            const junction = e.target.closest('.wire-junction');
            
            if (terminal) {
                console.log('Terminal mousedown:', terminal);
                this.handleTerminalMouseDown(terminal, e);
            } else if (junction) {
                this.handleJunctionMouseDown(junction, e);
            }
        });
        
        // Mouse move for wire preview
        document.addEventListener('mousemove', (e) => {
            if (this.isDrawing && this.previewWire) {
                this.updateWirePreview(e);
            }
        });
        
        // Mouse up to complete wire
        document.addEventListener('mouseup', (e) => {
            if (this.isDrawing) {
                console.log('Wire mouseup on:', e.target, 'at', e.clientX, e.clientY);
                
                // Try multiple ways to find the terminal
                let terminal = e.target.closest('.terminal');
                
                // If no terminal found directly, check what's under the mouse
                if (!terminal) {
                    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
                    console.log('Elements at point:', elementsAtPoint.map(el => el.tagName + (el.className ? '.' + el.className : '')));
                    terminal = elementsAtPoint.find(el => el.classList && el.classList.contains('terminal'));
                    
                    // If still no terminal, search within nearby components
                    if (!terminal) {
                        const mousePos = this.canvas.getMousePosition(e);
                        terminal = this.findNearestTerminal(mousePos, 20); // 20px tolerance
                        console.log('Nearest terminal search result:', terminal);
                    }
                }
                
                const junction = e.target.closest('.wire-junction');
                
                if (terminal && terminal !== this.startTerminal) {
                    console.log('Completing wire to terminal:', terminal);
                    this.completeWireDrawing(terminal);
                } else if (junction) {
                    this.completeWireToJunction(junction.id);
                } else {
                    console.log('No terminal found, canceling wire');
                    this.cancelWireDrawing();
                }
            }
        });
        
        // Escape key to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDrawing) {
                this.cancelWireDrawing();
            }
        });
        
        // Component move detection for auto-routing
        document.addEventListener('component-moved', (e) => {
            if (this.autoRouteEnabled) {
                this.handleComponentMove(e.detail);
            }
        });
    }

    handleTerminalMouseDown(terminal, event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Always start wire drawing on mousedown
        this.startWireDrawing(terminal);
        
        // Disable pan while drawing wire
        const app = window.wiringDiagramApp;
        if (app && app.panZoomInstance) {
            app.panZoomInstance.disablePan();
        }
    }

    startWireDrawing(terminal) {
        this.isDrawing = true;
        this.startTerminal = terminal;
        
        // Add class to body for styling
        document.body.classList.add('wire-drawing');
        
        // Highlight the terminal
        terminal.setAttribute('fill', '#2ecc71');
        
        // Create preview wire
        this.previewWire = this.createWireElement(true);
        this.canvas.addWire(this.previewWire);
        
        // Get terminal position
        const startPos = this.getTerminalPosition(terminal);
        this.previewWire.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${startPos.x} ${startPos.y}`);
    }

    completeWireDrawing(endTerminal) {
        if (endTerminal === this.startTerminal) {
            // Can't connect to same terminal
            this.cancelWireDrawing();
            return;
        }
        
        // No validation - allow any connection
        
        // Create permanent wire
        const wireId = `wire_${++this.wireIdCounter}`;
        const wire = this.createWireElement(false);
        wire.setAttribute('id', wireId);
        
        // Calculate wire path
        const startPos = this.getTerminalPosition(this.startTerminal);
        const endPos = this.getTerminalPosition(endTerminal);
        const path = this.calculateWirePath(startPos, endPos);
        wire.setAttribute('d', path);
        
        // Set wire properties
        const color = this.colorSelector.value;
        const gauge = this.gaugeSelector.value;
        wire.setAttribute('stroke', color);
        wire.setAttribute('data-gauge', gauge);
        
        // Add to canvas
        this.canvas.addWire(wire);
        
        // Register wire with router
        const pathData = this.parseWirePath(wire);
        this.router.registerWire(wireId, pathData.segments);
        
        // Save to state
        this.stateStore.addWire({
            id: wireId,
            from: {
                elementId: this.getComponentId(this.startTerminal),
                connectionPoint: this.startTerminal.dataset.terminalLabel
            },
            to: {
                elementId: this.getComponentId(endTerminal),
                connectionPoint: endTerminal.dataset.terminalLabel
            },
            color: color,
            gauge: gauge,
            label: '',
            path: path
        });
        
        // Clean up
        this.cancelWireDrawing();
    }

    cancelWireDrawing() {
        if (this.previewWire) {
            this.canvas.removeElement(this.previewWire);
            this.previewWire = null;
        }
        
        if (this.startTerminal) {
            this.startTerminal.setAttribute('fill', '#666');
            this.startTerminal = null;
        }
        
        this.isDrawing = false;
        
        // Remove wire-drawing class
        document.body.classList.remove('wire-drawing');
        
        // Re-enable pan after wire drawing
        const app = window.wiringDiagramApp;
        if (app && app.panZoomInstance) {
            app.panZoomInstance.enablePan();
        }
    }

    updateWirePreview(event) {
        if (!this.previewWire || !this.startTerminal) return;
        
        const startPos = this.startTerminal.type === 'junction' ? 
            this.startTerminal.position : 
            this.getTerminalPosition(this.startTerminal);
        const mousePos = this.canvas.getMousePosition(event);
        
        // Use simple router for preview path
        const routeResult = this.router.findPath(startPos, mousePos, 'preview');
        const path = this.router.generateSVGPath(routeResult, 0); // No rounding for preview
        this.previewWire.setAttribute('d', path);
    }

    createWireElement(isPreview = false) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', isPreview ? '#999' : this.colorSelector.value);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        if (isPreview) {
            path.setAttribute('stroke-dasharray', '5,5');
            path.setAttribute('opacity', '0.6');
        }
        
        path.setAttribute('class', 'wire');
        
        return path;
    }

    calculateWirePath(start, end) {
        // Use simple router for wire path
        const routeResult = this.router.findPath(start, end);
        return this.router.generateSVGPath(routeResult, this.cornerRadius);
    }
    
    getTerminalSide(position) {
        // This is a simplified version - in reality, you'd check the terminal's
        // position relative to its parent component
        // For now, we'll estimate based on terminal label
        const terminal = document.elementFromPoint(position.x, position.y);
        if (!terminal || !terminal.dataset.terminalLabel) return 'right';
        
        const label = terminal.dataset.terminalLabel;
        switch(label) {
            case '1': return 'top';
            case '2': return 'right';
            case '3': return 'bottom';
            case '4': return 'left';
            default: return 'right';
        }
    }

    getTerminalPosition(terminal) {
        const component = terminal.closest('.component');
        const transform = component.transform.baseVal.getItem(0);
        const componentX = transform.matrix.e;
        const componentY = transform.matrix.f;
        
        const terminalX = parseFloat(terminal.getAttribute('cx'));
        const terminalY = parseFloat(terminal.getAttribute('cy'));
        
        return {
            x: componentX + terminalX,
            y: componentY + terminalY
        };
    }

    getComponentId(terminal) {
        const component = terminal.closest('.component');
        return component.id;
    }

    findNearestTerminal(mousePos, tolerance = 20) {
        const allTerminals = this.canvas.svg.querySelectorAll('.terminal');
        let nearestTerminal = null;
        let minDistance = tolerance;
        
        allTerminals.forEach(terminal => {
            const terminalPos = this.getTerminalPosition(terminal);
            const distance = Math.sqrt(
                Math.pow(mousePos.x - terminalPos.x, 2) + 
                Math.pow(mousePos.y - terminalPos.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestTerminal = terminal;
            }
        });
        
        return nearestTerminal;
    }

    isValidConnection(terminal1, terminal2) {
        const type1 = terminal1.dataset.terminalType;
        const type2 = terminal2.dataset.terminalType;
        
        // Define connection rules
        const validConnections = {
            'power': ['power', 'dc-out'],
            'input': ['output', 'relay', 'signal'],
            'output': ['input', 'control'],
            'ac-in': ['ac-out'],
            'dc-out': ['power'],
            'control': ['output'],
            'relay': ['input'],
            'signal': ['input']
        };
        
        return validConnections[type1]?.includes(type2) || 
               validConnections[type2]?.includes(type1);
    }
    
    /**
     * Initialize router with component bounds
     */
    initializeRouter() {
        // Will be called after components are loaded
        setTimeout(() => {
            this.updateAllComponentBounds();
        }, 100);
    }
    
    /**
     * Update component bounds in router
     */
    updateAllComponentBounds() {
        const components = this.canvas.svg.querySelectorAll('.component');
        components.forEach(component => {
            const rect = component.querySelector('rect');
            if (rect) {
                const transform = component.transform.baseVal.getItem(0);
                const bounds = {
                    x: transform.matrix.e,
                    y: transform.matrix.f,
                    width: parseFloat(rect.getAttribute('width')),
                    height: parseFloat(rect.getAttribute('height'))
                };
                this.router.updateComponentBounds(component.id, bounds);
            }
        });
    }
    
    /**
     * Handle component movement for auto-routing
     */
    handleComponentMove(detail) {
        const { componentId, newPosition } = detail;
        
        // Update router bounds
        const component = this.canvas.svg.getElementById(componentId);
        if (component) {
            const rect = component.querySelector('rect');
            if (rect) {
                const bounds = {
                    x: newPosition.x,
                    y: newPosition.y,
                    width: parseFloat(rect.getAttribute('width')),
                    height: parseFloat(rect.getAttribute('height'))
                };
                this.router.updateComponentBounds(componentId, bounds);
            }
        }
        
        // Find and reroute affected wires
        const affectedWires = this.findWiresConnectedToComponent(componentId);
        affectedWires.forEach(wireData => {
            this.rerouteWire(wireData.id);
        });
    }
    
    /**
     * Find wires connected to a component
     */
    findWiresConnectedToComponent(componentId) {
        return this.stateStore.getWires().filter(wire => 
            wire.from.elementId === componentId || 
            wire.to.elementId === componentId
        );
    }
    
    /**
     * Reroute an existing wire
     */
    rerouteWire(wireId) {
        const wireData = this.stateStore.getWire(wireId);
        if (!wireData) return;
        
        const wireElement = this.canvas.svg.getElementById(wireId);
        if (!wireElement) return;
        
        // Get terminal positions
        const fromTerminal = document.querySelector(`#${wireData.from.elementId} [data-terminal-label="${wireData.from.connectionPoint}"]`);
        const toTerminal = document.querySelector(`#${wireData.to.elementId} [data-terminal-label="${wireData.to.connectionPoint}"]`);
        
        if (!fromTerminal || !toTerminal) return;
        
        const startPos = this.getTerminalPosition(fromTerminal);
        const endPos = this.getTerminalPosition(toTerminal);
        
        // Calculate new path
        const newPath = this.calculateWirePath(startPos, endPos);
        wireElement.setAttribute('d', newPath);
        
        // Update router registration
        const pathData = this.parseWirePath(wireElement);
        this.router.unregisterWire(wireId);
        this.router.registerWire(wireId, pathData.segments);
        
        // Update state
        wireData.path = newPath;
        this.stateStore.updateWire(wireId, wireData);
    }
    
    /**
     * Create junction on existing wire
     */
    createJunctionOnWire(wire, event) {
        event.stopPropagation();
        
        const mousePos = this.canvas.getMousePosition(event);
        const wireId = wire.id;
        
        // Find closest point on wire
        const pathData = this.parseWirePath(wire);
        const closestPoint = this.findClosestPointOnPath(mousePos, pathData);
        
        // Create junction
        const junctionId = this.createJunction(closestPoint);
        
        // Split wire at junction
        this.splitWireAtJunction(wireId, junctionId, closestPoint);
        
        // Start new wire from junction
        this.startWireFromJunction(junctionId);
    }
    
    /**
     * Create a junction point
     */
    createJunction(position) {
        const junctionId = `junction_${Date.now()}`;
        
        const junction = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        junction.setAttribute('id', junctionId);
        junction.setAttribute('class', 'wire-junction');
        junction.setAttribute('cx', position.x);
        junction.setAttribute('cy', position.y);
        junction.setAttribute('r', this.junctionRadius);
        junction.setAttribute('fill', '#333');
        junction.setAttribute('stroke', '#fff');
        junction.setAttribute('stroke-width', '2');
        
        this.canvas.wiresGroup.appendChild(junction);
        
        this.junctions.set(junctionId, {
            position: position,
            connectedWires: new Set()
        });
        
        return junctionId;
    }
    
    /**
     * Handle junction click
     */
    handleJunctionClick(junction, event) {
        event.stopPropagation();
        
        if (!this.isDrawing) {
            this.startWireFromJunction(junction.id);
        } else {
            this.completeWireToJunction(junction.id);
        }
    }
    
    /**
     * Handle junction mousedown for click-hold-drag
     */
    handleJunctionMouseDown(junction, event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Start wire drawing from junction
        this.startWireFromJunction(junction.id);
        
        // Disable pan while drawing wire
        const app = window.wiringDiagramApp;
        if (app && app.panZoomInstance) {
            app.panZoomInstance.disablePan();
        }
    }
    
    /**
     * Start wire from junction
     */
    startWireFromJunction(junctionId) {
        const junctionData = this.junctions.get(junctionId);
        if (!junctionData) return;
        
        this.isDrawing = true;
        this.startTerminal = {
            type: 'junction',
            id: junctionId,
            position: junctionData.position
        };
        
        // Create preview wire
        this.previewWire = this.createWireElement(true);
        this.canvas.addWire(this.previewWire);
        
        const pos = junctionData.position;
        this.previewWire.setAttribute('d', `M ${pos.x} ${pos.y} L ${pos.x} ${pos.y}`);
    }
    
    /**
     * Complete wire to junction
     */
    completeWireToJunction(junctionId) {
        const junctionData = this.junctions.get(junctionId);
        if (!junctionData) return;
        
        // Create permanent wire
        const wireId = `wire_${++this.wireIdCounter}`;
        const wire = this.createWireElement(false);
        wire.setAttribute('id', wireId);
        
        // Calculate path
        const startPos = this.startTerminal.type === 'junction' ? 
            this.startTerminal.position : 
            this.getTerminalPosition(this.startTerminal);
        const endPos = junctionData.position;
        
        const path = this.calculateWirePath(startPos, endPos);
        wire.setAttribute('d', path);
        
        // Set wire properties
        const color = this.colorSelector.value;
        const gauge = this.gaugeSelector.value;
        wire.setAttribute('stroke', color);
        wire.setAttribute('data-gauge', gauge);
        
        // Add to canvas
        this.canvas.addWire(wire);
        
        // Update junction connections
        junctionData.connectedWires.add(wireId);
        if (this.startTerminal.type === 'junction') {
            const startJunction = this.junctions.get(this.startTerminal.id);
            startJunction.connectedWires.add(wireId);
        }
        
        // Register with router
        const pathData = this.parseWirePath(wire);
        this.router.registerWire(wireId, pathData.segments);
        
        // Save to state
        const fromData = this.startTerminal.type === 'junction' ? 
            { type: 'junction', id: this.startTerminal.id } :
            { elementId: this.getComponentId(this.startTerminal), connectionPoint: this.startTerminal.dataset.terminalLabel };
        
        this.stateStore.addWire({
            id: wireId,
            from: fromData,
            to: { type: 'junction', id: junctionId },
            color: color,
            gauge: gauge,
            label: '',
            path: path
        });
        
        // Clean up
        this.cancelWireDrawing();
    }
    
    /**
     * Parse wire path to segments
     */
    parseWirePath(wireElement) {
        const pathString = wireElement.getAttribute('d');
        const segments = [];
        const points = [];
        
        const commands = pathString.match(/[MLQ][^MLQ]*/g);
        let currentPoint = null;
        
        commands.forEach(cmd => {
            const type = cmd[0];
            const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
            
            if (type === 'M') {
                currentPoint = { x: coords[0], y: coords[1] };
                points.push(currentPoint);
            } else if (type === 'L') {
                const nextPoint = { x: coords[0], y: coords[1] };
                segments.push({
                    start: currentPoint,
                    end: nextPoint
                });
                points.push(nextPoint);
                currentPoint = nextPoint;
            } else if (type === 'Q') {
                const control = { x: coords[0], y: coords[1] };
                const end = { x: coords[2], y: coords[3] };
                segments.push({
                    start: currentPoint,
                    control: control,
                    end: end
                });
                points.push(end);
                currentPoint = end;
            }
        });
        
        return { segments, points };
    }
    
    /**
     * Find closest point on wire path
     */
    findClosestPointOnPath(point, pathData) {
        let closestPoint = null;
        let minDistance = Infinity;
        
        pathData.segments.forEach(segment => {
            const segPoint = this.getClosestPointOnSegment(point, segment);
            const distance = Math.sqrt(
                Math.pow(point.x - segPoint.x, 2) + 
                Math.pow(point.y - segPoint.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = segPoint;
            }
        });
        
        return closestPoint;
    }
    
    /**
     * Get closest point on segment
     */
    getClosestPointOnSegment(point, segment) {
        const dx = segment.end.x - segment.start.x;
        const dy = segment.end.y - segment.start.y;
        const t = Math.max(0, Math.min(1, 
            ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / 
            (dx * dx + dy * dy)
        ));
        
        return {
            x: segment.start.x + t * dx,
            y: segment.start.y + t * dy
        };
    }
    
    /**
     * Set the wire color
     */
    setColor(color) {
        if (this.colorSelector) {
            this.colorSelector.value = color;
        }
    }
    
    /**
     * Set the wire gauge
     */
    setGauge(gauge) {
        if (this.gaugeSelector) {
            this.gaugeSelector.value = gauge;
        }
    }
    
    /**
     * Set auto-route enabled/disabled
     */
    setAutoRoute(enabled) {
        this.autoRouteEnabled = enabled;
        if (this.autoRouteCheckbox) {
            this.autoRouteCheckbox.checked = enabled;
        }
    }
    
    /**
     * Set bundling enabled/disabled
     */
    setBundling(enabled) {
        this.bundlingEnabled = enabled;
        if (this.bundlingCheckbox) {
            this.bundlingCheckbox.checked = enabled;
        }
    }
}