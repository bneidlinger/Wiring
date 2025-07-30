/**
 * Simple orthogonal wire router for basic wire routing
 * This replaces the complex A* algorithm with a straightforward approach
 */
export class SimpleWireRouter {
    constructor(gridSize = 10) {
        this.gridSize = gridSize;
        this.wires = new Map();
        this.componentBounds = new Map();
    }

    /**
     * Find a simple orthogonal path between two points
     */
    findPath(start, end, wireId = null, options = {}) {
        // Snap points to grid
        const startSnapped = this.snapToGrid(start);
        const endSnapped = this.snapToGrid(end);
        
        // Create simple L-shaped or Z-shaped path
        const path = this.createOrthogonalPath(startSnapped, endSnapped);
        
        return {
            path: path,
            segments: this.pathToSegments(path),
            length: this.calculatePathLength(path),
            bends: this.countBends(path)
        };
    }

    /**
     * Create a simple orthogonal path between two points
     */
    createOrthogonalPath(start, end) {
        const path = [start];
        
        // If points are aligned horizontally or vertically, create straight line
        if (start.x === end.x || start.y === end.y) {
            path.push(end);
            return path;
        }
        
        // Otherwise create L-shaped path
        // Prefer horizontal-then-vertical routing
        const midPoint = {
            x: end.x,
            y: start.y
        };
        
        path.push(midPoint);
        path.push(end);
        
        return path;
    }

    /**
     * Generate SVG path string with optional corner rounding
     */
    generateSVGPath(pathData, cornerRadius = 5) {
        const { path } = pathData;
        if (path.length < 2) return '';
        
        let svgPath = `M ${path[0].x} ${path[0].y}`;
        
        if (cornerRadius > 0 && path.length > 2) {
            // Path with rounded corners
            for (let i = 1; i < path.length - 1; i++) {
                const prev = path[i - 1];
                const curr = path[i];
                const next = path[i + 1];
                
                // Calculate corner points
                const corner = this.calculateRoundedCorner(prev, curr, next, cornerRadius);
                
                svgPath += ` L ${corner.start.x} ${corner.start.y}`;
                svgPath += ` Q ${curr.x} ${curr.y} ${corner.end.x} ${corner.end.y}`;
            }
            
            // Final segment
            svgPath += ` L ${path[path.length - 1].x} ${path[path.length - 1].y}`;
        } else {
            // Simple path without rounding
            for (let i = 1; i < path.length; i++) {
                svgPath += ` L ${path[i].x} ${path[i].y}`;
            }
        }
        
        return svgPath;
    }

    /**
     * Calculate rounded corner points
     */
    calculateRoundedCorner(prev, curr, next, radius) {
        const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const d2 = { x: next.x - curr.x, y: next.y - curr.y };
        
        const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
        const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
        
        const actualRadius = Math.min(radius, len1 / 2, len2 / 2);
        
        return {
            start: {
                x: curr.x - (d1.x / len1) * actualRadius,
                y: curr.y - (d1.y / len1) * actualRadius
            },
            end: {
                x: curr.x + (d2.x / len2) * actualRadius,
                y: curr.y + (d2.y / len2) * actualRadius
            }
        };
    }

    /**
     * Update component bounds for collision detection
     */
    updateComponentBounds(componentId, bounds) {
        this.componentBounds.set(componentId, bounds);
    }

    /**
     * Register a wire for collision detection
     */
    registerWire(wireId, segments) {
        this.wires.set(wireId, { segments });
    }

    /**
     * Remove a wire from tracking
     */
    unregisterWire(wireId) {
        this.wires.delete(wireId);
    }

    /**
     * Convert path to segments
     */
    pathToSegments(path) {
        if (path.length < 2) return [];
        
        const segments = [];
        for (let i = 0; i < path.length - 1; i++) {
            segments.push({
                start: path[i],
                end: path[i + 1]
            });
        }
        
        return segments;
    }

    /**
     * Snap point to grid
     */
    snapToGrid(point) {
        return {
            x: Math.round(point.x / this.gridSize) * this.gridSize,
            y: Math.round(point.y / this.gridSize) * this.gridSize
        };
    }

    /**
     * Calculate path length
     */
    calculatePathLength(path) {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    /**
     * Count bends in path
     */
    countBends(path) {
        return Math.max(0, path.length - 2);
    }
}