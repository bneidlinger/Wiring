/**
 * Wire editing functionality - drag segments, add/remove waypoints, etc.
 */
export class WireEditor {
    constructor(canvas, stateStore, router) {
        this.canvas = canvas;
        this.stateStore = stateStore;
        this.router = router;
        
        this.selectedWire = null;
        this.selectedSegment = null;
        this.dragHandle = null;
        this.isEditing = false;
        
        this.handleSize = 8;
        this.segmentHighlightWidth = 10;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Wire selection
        document.addEventListener('click', (e) => {
            if (this.canvas.mode !== 'select') return;
            
            const wire = e.target.closest('.wire');
            if (wire && !this.isEditing) {
                this.selectWire(wire);
            } else if (!wire && !e.target.closest('.wire-handle')) {
                this.deselectWire();
            }
        });
        
        // Handle dragging
        document.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('.wire-handle');
            if (handle) {
                this.startHandleDrag(handle, e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.dragHandle) {
                this.updateHandleDrag(e);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.dragHandle) {
                this.endHandleDrag(e);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.selectedWire) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    this.deleteSelectedWire();
                } else if (e.key === 'r' || e.key === 'R') {
                    this.rerouteSelectedWire();
                }
            }
        });
    }

    selectWire(wireElement) {
        this.deselectWire();
        
        this.selectedWire = wireElement;
        this.selectedWire.classList.add('selected');
        
        // Parse wire path
        const pathData = this.parseWirePath(wireElement);
        this.createEditHandles(pathData);
        
        // Highlight segments
        this.highlightSegments(pathData);
    }

    deselectWire() {
        if (this.selectedWire) {
            this.selectedWire.classList.remove('selected');
            this.selectedWire = null;
        }
        
        // Remove all handles and highlights
        this.removeEditHandles();
        this.removeSegmentHighlights();
    }

    parseWirePath(wireElement) {
        const pathString = wireElement.getAttribute('d');
        const segments = [];
        const points = [];
        
        // Parse SVG path - supports M, L, Q commands
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
                    end: nextPoint,
                    type: 'line'
                });
                points.push(nextPoint);
                currentPoint = nextPoint;
            } else if (type === 'Q') {
                // Quadratic bezier (for rounded corners)
                const control = { x: coords[0], y: coords[1] };
                const end = { x: coords[2], y: coords[3] };
                segments.push({
                    start: currentPoint,
                    control: control,
                    end: end,
                    type: 'curve'
                });
                points.push(end);
                currentPoint = end;
            }
        });
        
        return { segments, points };
    }

    createEditHandles(pathData) {
        const handlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        handlesGroup.classList.add('wire-handles');
        
        // Create handles for each waypoint
        pathData.points.forEach((point, index) => {
            const handle = this.createHandle(point, index, 'waypoint');
            handlesGroup.appendChild(handle);
        });
        
        // Create handles for segment midpoints (for adding new waypoints)
        pathData.segments.forEach((segment, index) => {
            if (segment.type === 'line') {
                const midpoint = {
                    x: (segment.start.x + segment.end.x) / 2,
                    y: (segment.start.y + segment.end.y) / 2
                };
                const handle = this.createHandle(midpoint, index, 'midpoint');
                handle.classList.add('midpoint-handle');
                handlesGroup.appendChild(handle);
            }
        });
        
        this.canvas.svg.appendChild(handlesGroup);
    }

    createHandle(point, index, type) {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        handle.setAttribute('x', point.x - this.handleSize / 2);
        handle.setAttribute('y', point.y - this.handleSize / 2);
        handle.setAttribute('width', this.handleSize);
        handle.setAttribute('height', this.handleSize);
        handle.setAttribute('fill', type === 'waypoint' ? '#2196F3' : '#4CAF50');
        handle.setAttribute('stroke', '#fff');
        handle.setAttribute('stroke-width', '2');
        handle.setAttribute('class', 'wire-handle');
        handle.setAttribute('data-index', index);
        handle.setAttribute('data-type', type);
        handle.style.cursor = 'move';
        
        // Add hover effect
        handle.addEventListener('mouseenter', () => {
            handle.setAttribute('transform', `scale(1.2) translate(${-this.handleSize * 0.1}, ${-this.handleSize * 0.1})`);
        });
        
        handle.addEventListener('mouseleave', () => {
            handle.removeAttribute('transform');
        });
        
        return handle;
    }

    highlightSegments(pathData) {
        const highlightsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        highlightsGroup.classList.add('segment-highlights');
        
        pathData.segments.forEach((segment, index) => {
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            if (segment.type === 'line') {
                highlight.setAttribute('d', `M ${segment.start.x} ${segment.start.y} L ${segment.end.x} ${segment.end.y}`);
            } else if (segment.type === 'curve') {
                highlight.setAttribute('d', `M ${segment.start.x} ${segment.start.y} Q ${segment.control.x} ${segment.control.y} ${segment.end.x} ${segment.end.y}`);
            }
            
            highlight.setAttribute('stroke', 'transparent');
            highlight.setAttribute('stroke-width', this.segmentHighlightWidth);
            highlight.setAttribute('fill', 'none');
            highlight.setAttribute('class', 'segment-highlight');
            highlight.setAttribute('data-index', index);
            highlight.style.cursor = 'pointer';
            
            // Segment click to add waypoint
            highlight.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addWaypoint(segment, index);
            });
            
            highlightsGroup.appendChild(highlight);
        });
        
        // Insert before the wire so it's behind
        this.selectedWire.parentNode.insertBefore(highlightsGroup, this.selectedWire);
    }

    removeEditHandles() {
        const handles = this.canvas.svg.querySelector('.wire-handles');
        if (handles) handles.remove();
    }

    removeSegmentHighlights() {
        const highlights = this.canvas.svg.querySelector('.segment-highlights');
        if (highlights) highlights.remove();
    }

    startHandleDrag(handle, event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.dragHandle = {
            element: handle,
            index: parseInt(handle.dataset.index),
            type: handle.dataset.type,
            startPos: this.canvas.getMousePosition(event),
            originalPath: this.parseWirePath(this.selectedWire)
        };
        
        this.isEditing = true;
        handle.style.cursor = 'grabbing';
    }

    updateHandleDrag(event) {
        if (!this.dragHandle) return;
        
        const currentPos = this.canvas.getMousePosition(event);
        const dx = currentPos.x - this.dragHandle.startPos.x;
        const dy = currentPos.y - this.dragHandle.startPos.y;
        
        if (this.dragHandle.type === 'waypoint') {
            this.updateWaypointPosition(this.dragHandle.index, dx, dy);
        } else if (this.dragHandle.type === 'midpoint') {
            // Convert midpoint to waypoint on drag
            this.convertMidpointToWaypoint(this.dragHandle.index, currentPos);
        }
    }

    updateWaypointPosition(index, dx, dy) {
        const pathData = this.dragHandle.originalPath;
        const newPoints = [...pathData.points];
        
        // Update the waypoint position
        newPoints[index] = {
            x: pathData.points[index].x + dx,
            y: pathData.points[index].y + dy
        };
        
        // Reroute affected segments with A*
        const segments = [];
        
        if (index > 0) {
            const routeResult = this.router.findPath(
                newPoints[index - 1],
                newPoints[index],
                this.selectedWire.id,
                { avoidWires: true, cornerRadius: 5 }
            );
            
            if (routeResult) {
                segments.push(...routeResult.segments);
            }
        }
        
        if (index < newPoints.length - 1) {
            const routeResult = this.router.findPath(
                newPoints[index],
                newPoints[index + 1],
                this.selectedWire.id,
                { avoidWires: true, cornerRadius: 5 }
            );
            
            if (routeResult) {
                segments.push(...routeResult.segments);
            }
        }
        
        // Update wire path
        this.updateWirePath(segments);
    }

    convertMidpointToWaypoint(segmentIndex, position) {
        const pathData = this.dragHandle.originalPath;
        const segment = pathData.segments[segmentIndex];
        
        // Insert new waypoint
        const newPoints = [...pathData.points];
        newPoints.splice(segmentIndex + 1, 0, position);
        
        // Reroute with new waypoint
        this.rerouteWithWaypoints(newPoints);
    }

    addWaypoint(segment, index) {
        const mousePos = this.canvas.getMousePosition(event);
        
        // Find closest point on segment
        const closestPoint = this.getClosestPointOnSegment(mousePos, segment);
        
        const pathData = this.parseWirePath(this.selectedWire);
        const newPoints = [...pathData.points];
        newPoints.splice(index + 1, 0, closestPoint);
        
        this.rerouteWithWaypoints(newPoints);
    }

    rerouteWithWaypoints(waypoints) {
        const segments = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const routeResult = this.router.findPath(
                waypoints[i],
                waypoints[i + 1],
                this.selectedWire.id,
                { avoidWires: true, cornerRadius: 5 }
            );
            
            if (routeResult) {
                segments.push(...routeResult.segments);
            }
        }
        
        this.updateWirePath(segments);
    }

    updateWirePath(segments) {
        const pathString = this.router.generateSVGPath({ path: segments.map(s => s.start).concat(segments[segments.length - 1].end) }, 5);
        this.selectedWire.setAttribute('d', pathString);
        
        // Update router's wire registration
        this.router.unregisterWire(this.selectedWire.id);
        this.router.registerWire(this.selectedWire.id, segments);
        
        // Refresh edit handles
        this.removeEditHandles();
        this.removeSegmentHighlights();
        
        const newPathData = this.parseWirePath(this.selectedWire);
        this.createEditHandles(newPathData);
        this.highlightSegments(newPathData);
    }

    endHandleDrag(event) {
        if (!this.dragHandle) return;
        
        this.dragHandle.element.style.cursor = 'move';
        
        // Save to state store
        const wireData = this.stateStore.getWire(this.selectedWire.id);
        if (wireData) {
            wireData.path = this.selectedWire.getAttribute('d');
            this.stateStore.updateWire(this.selectedWire.id, wireData);
        }
        
        this.dragHandle = null;
        this.isEditing = false;
    }

    deleteSelectedWire() {
        if (!this.selectedWire) return;
        
        const wireId = this.selectedWire.id;
        
        // Remove from router
        this.router.unregisterWire(wireId);
        
        // Remove from state
        this.stateStore.removeWire(wireId);
        
        // Remove from DOM
        this.selectedWire.remove();
        
        // Clean up
        this.removeEditHandles();
        this.removeSegmentHighlights();
        this.selectedWire = null;
    }

    rerouteSelectedWire() {
        if (!this.selectedWire) return;
        
        const wireData = this.stateStore.getWire(this.selectedWire.id);
        if (!wireData) return;
        
        // Get terminal positions
        const fromTerminal = document.querySelector(`#${wireData.from.elementId} [data-terminal-label="${wireData.from.connectionPoint}"]`);
        const toTerminal = document.querySelector(`#${wireData.to.elementId} [data-terminal-label="${wireData.to.connectionPoint}"]`);
        
        if (!fromTerminal || !toTerminal) return;
        
        const startPos = this.getTerminalPosition(fromTerminal);
        const endPos = this.getTerminalPosition(toTerminal);
        
        // Reroute with A*
        const routeResult = this.router.findPath(startPos, endPos, this.selectedWire.id, {
            avoidWires: true,
            bundleWithWires: true,
            cornerRadius: 5
        });
        
        if (routeResult) {
            const pathString = this.router.generateSVGPath(routeResult, 5);
            this.selectedWire.setAttribute('d', pathString);
            
            // Update registration
            this.router.unregisterWire(this.selectedWire.id);
            this.router.registerWire(this.selectedWire.id, routeResult.segments);
            
            // Update state
            wireData.path = pathString;
            this.stateStore.updateWire(this.selectedWire.id, wireData);
            
            // Refresh handles
            this.selectWire(this.selectedWire);
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

    getClosestPointOnSegment(point, segment) {
        if (segment.type === 'line') {
            // Project point onto line segment
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
        } else {
            // For curves, approximate with midpoint
            return {
                x: (segment.start.x + segment.end.x) / 2,
                y: (segment.start.y + segment.end.y) / 2
            };
        }
    }
}