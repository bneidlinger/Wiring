// Helper module for drag functionality that works with svg-pan-zoom
export class DragHelper {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            onStart: options.onStart || (() => {}),
            onMove: options.onMove || (() => {}),
            onEnd: options.onEnd || (() => {}),
            handle: options.handle || element,
            constrainToParent: options.constrainToParent || false,
            snapToGrid: options.snapToGrid || false,
            gridSize: options.gridSize || 50
        };
        
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        // Add event listeners
        this.options.handle.addEventListener('mousedown', this.handleMouseDown);
        this.options.handle.style.cursor = 'move';
    }
    
    handleMouseDown(e) {
        // Prevent default to stop svg-pan-zoom from panning
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        
        // Get starting mouse position in SVG coordinates
        const svgPoint = this.getSVGPoint(e);
        this.startPos = { x: svgPoint.x, y: svgPoint.y };
        
        // Get current element position
        const transform = this.getElementTransform();
        this.currentPos = { x: transform.x, y: transform.y };
        
        // Calculate offset
        this.offset = {
            x: this.startPos.x - this.currentPos.x,
            y: this.startPos.y - this.currentPos.y
        };
        
        // Add document-level listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Add dragging class
        this.element.classList.add('dragging');
        
        // Disable pan-zoom if available
        if (window.wiringApp?.panZoomInstance) {
            window.wiringApp.panZoomInstance.disablePan();
        }
        
        // Call start callback
        this.options.onStart(e, this.currentPos);
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        // Get current mouse position in SVG coordinates
        const svgPoint = this.getSVGPoint(e);
        
        // Calculate new position
        let newX = svgPoint.x - this.offset.x;
        let newY = svgPoint.y - this.offset.y;
        
        // Apply grid snapping if enabled
        if (this.options.snapToGrid) {
            newX = Math.round(newX / this.options.gridSize) * this.options.gridSize;
            newY = Math.round(newY / this.options.gridSize) * this.options.gridSize;
        }
        
        // Update position
        this.currentPos = { x: newX, y: newY };
        this.updateElementPosition();
        
        // Call move callback
        this.options.onMove(e, this.currentPos);
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Remove document-level listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // Remove dragging class
        this.element.classList.remove('dragging');
        
        // Re-enable pan-zoom if available
        if (window.wiringApp?.panZoomInstance) {
            window.wiringApp.panZoomInstance.enablePan();
        }
        
        // Call end callback
        this.options.onEnd(e, this.currentPos);
    }
    
    getSVGPoint(event) {
        const svg = this.element.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        
        // Get the viewport element (what svg-pan-zoom transforms)
        const viewport = svg.querySelector('#viewport');
        if (viewport) {
            const ctm = viewport.getScreenCTM();
            return pt.matrixTransform(ctm.inverse());
        }
        
        // Fallback to SVG element
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    
    getElementTransform() {
        const transform = this.element.getAttribute('transform');
        if (!transform) return { x: 0, y: 0 };
        
        const match = transform.match(/translate\(([-\d.]+),?\s*([-\d.]+)?\)/);
        if (match) {
            return {
                x: parseFloat(match[1]) || 0,
                y: parseFloat(match[2]) || 0
            };
        }
        
        return { x: 0, y: 0 };
    }
    
    updateElementPosition() {
        this.element.setAttribute('transform', `translate(${this.currentPos.x}, ${this.currentPos.y})`);
    }
    
    destroy() {
        this.options.handle.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}