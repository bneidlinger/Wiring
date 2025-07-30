/**
 * A* pathfinding algorithm for orthogonal wire routing with collision detection
 */
export class AStarRouter {
    constructor(gridSize = 10) {
        this.gridSize = gridSize;
        this.obstacles = new Set();
        this.wires = new Map();
        this.componentBounds = new Map();
        this.routingChannels = new Map();
        
        // A* algorithm settings
        this.diagonalMovement = false; // Manhattan routing only
        this.clearanceBuffer = 2; // Grid units of clearance around obstacles
        this.bendPenalty = 5; // Additional cost for direction changes
        this.wireCrossPenalty = 10; // Penalty for crossing other wires
    }

    /**
     * Main routing function using A* algorithm
     */
    findPath(start, end, wireId = null, options = {}) {
        const startGrid = this.worldToGrid(start);
        const endGrid = this.worldToGrid(end);
        
        // Path options
        const {
            avoidWires = true,
            bundleWithWires = true,
            preferredDirection = null,
            priority = 'normal'
        } = options;
        
        // Initialize A* data structures
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();
        const directionFrom = new Map();
        
        // Start node
        const startKey = this.getNodeKey(startGrid);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startGrid, endGrid));
        openSet.enqueue(startGrid, fScore.get(startKey));
        directionFrom.set(startKey, null);
        
        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            const currentKey = this.getNodeKey(current);
            
            // Check if we reached the goal
            if (current.x === endGrid.x && current.y === endGrid.y) {
                return this.reconstructPath(cameFrom, current, start, end);
            }
            
            closedSet.add(currentKey);
            
            // Check all orthogonal neighbors
            const neighbors = this.getOrthogonalNeighbors(current);
            
            for (const neighbor of neighbors) {
                const neighborKey = this.getNodeKey(neighbor);
                
                if (closedSet.has(neighborKey)) continue;
                
                // Check if neighbor is blocked
                if (this.isBlocked(neighbor, wireId, options)) continue;
                
                // Calculate costs
                const tentativeGScore = gScore.get(currentKey) + 
                    this.calculateMoveCost(current, neighbor, directionFrom.get(currentKey), options);
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    // Update path
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endGrid));
                    directionFrom.set(neighborKey, this.getDirection(current, neighbor));
                    
                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, fScore.get(neighborKey));
                    }
                }
            }
        }
        
        // No path found - try with relaxed constraints
        if (options.allowRelaxedConstraints) {
            return this.findPath(start, end, wireId, {
                ...options,
                avoidWires: false,
                clearanceBuffer: 1
            });
        }
        
        return null;
    }

    /**
     * Calculate movement cost including penalties
     */
    calculateMoveCost(from, to, previousDirection, options) {
        let cost = 1; // Base movement cost
        
        const currentDirection = this.getDirection(from, to);
        
        // Bend penalty
        if (previousDirection && previousDirection !== currentDirection) {
            cost += this.bendPenalty;
        }
        
        // Wire crossing penalty
        if (options.avoidWires && this.crossesWire(from, to)) {
            cost += this.wireCrossPenalty;
        }
        
        // Prefer bundling with existing wires
        if (options.bundleWithWires) {
            const bundleBonus = this.getBundleBonus(from, to);
            cost -= bundleBonus;
        }
        
        return cost;
    }

    /**
     * Manhattan distance heuristic
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Get orthogonal neighbors
     */
    getOrthogonalNeighbors(node) {
        return [
            { x: node.x + 1, y: node.y },
            { x: node.x - 1, y: node.y },
            { x: node.x, y: node.y + 1 },
            { x: node.x, y: node.y - 1 }
        ];
    }

    /**
     * Check if a grid position is blocked
     */
    isBlocked(gridPos, wireId, options) {
        const key = this.getNodeKey(gridPos);
        
        // Check component obstacles with clearance
        for (const [componentId, bounds] of this.componentBounds) {
            if (this.isInsideBounds(gridPos, bounds, this.clearanceBuffer)) {
                return true;
            }
        }
        
        // Check wire obstacles if avoiding them
        if (options.avoidWires) {
            for (const [id, wireData] of this.wires) {
                if (id !== wireId && this.isOnWire(gridPos, wireData)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Reconstruct path from A* result
     */
    reconstructPath(cameFrom, current, worldStart, worldEnd) {
        const path = [];
        let node = current;
        
        while (cameFrom.has(this.getNodeKey(node))) {
            path.unshift(node);
            node = cameFrom.get(this.getNodeKey(node));
        }
        path.unshift(node); // Add start node
        
        // Convert to world coordinates and optimize
        const worldPath = this.gridPathToWorld(path);
        const optimizedPath = this.optimizePath(worldPath, worldStart, worldEnd);
        
        return {
            path: optimizedPath,
            segments: this.pathToSegments(optimizedPath),
            length: this.calculatePathLength(optimizedPath),
            bends: this.countBends(optimizedPath)
        };
    }

    /**
     * Optimize path by removing unnecessary waypoints
     */
    optimizePath(path, start, end) {
        if (path.length <= 2) return [start, end];
        
        const optimized = [start];
        let i = 0;
        
        while (i < path.length - 1) {
            let j = path.length - 1;
            
            // Try to connect to furthest point possible
            while (j > i + 1) {
                if (this.canConnectDirect(path[i], path[j])) {
                    break;
                }
                j--;
            }
            
            if (j > i) {
                optimized.push(path[j]);
                i = j;
            } else {
                i++;
            }
        }
        
        // Ensure we end at the exact end point
        if (optimized[optimized.length - 1].x !== end.x || 
            optimized[optimized.length - 1].y !== end.y) {
            optimized.push(end);
        }
        
        return optimized;
    }

    /**
     * Convert path to SVG path segments
     */
    pathToSegments(path) {
        if (path.length < 2) return [];
        
        const segments = [];
        for (let i = 0; i < path.length - 1; i++) {
            segments.push({
                start: path[i],
                end: path[i + 1],
                direction: this.getSegmentDirection(path[i], path[i + 1])
            });
        }
        
        return segments;
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
        this.componentBounds.set(componentId, {
            x: Math.floor(bounds.x / this.gridSize),
            y: Math.floor(bounds.y / this.gridSize),
            width: Math.ceil(bounds.width / this.gridSize),
            height: Math.ceil(bounds.height / this.gridSize)
        });
    }

    /**
     * Register a wire for collision detection
     */
    registerWire(wireId, segments) {
        const gridSegments = segments.map(seg => ({
            start: this.worldToGrid(seg.start),
            end: this.worldToGrid(seg.end)
        }));
        
        this.wires.set(wireId, {
            segments: gridSegments,
            bundleGroup: this.identifyBundleGroup(gridSegments)
        });
    }

    /**
     * Remove a wire from tracking
     */
    unregisterWire(wireId) {
        this.wires.delete(wireId);
    }

    /**
     * Find bundle opportunities with existing wires
     */
    identifyBundleGroup(segments) {
        // Logic to identify which wire bundle this wire should join
        let bestGroup = null;
        let bestScore = 0;
        
        for (const [wireId, wireData] of this.wires) {
            const score = this.calculateBundleScore(segments, wireData.segments);
            if (score > bestScore) {
                bestScore = score;
                bestGroup = wireData.bundleGroup || wireId;
            }
        }
        
        return bestGroup;
    }

    /**
     * Calculate bundle score between two wire paths
     */
    calculateBundleScore(segments1, segments2) {
        let score = 0;
        
        for (const seg1 of segments1) {
            for (const seg2 of segments2) {
                if (this.areParallel(seg1, seg2)) {
                    const distance = this.segmentDistance(seg1, seg2);
                    if (distance <= 3) { // Within bundling distance
                        score += (4 - distance) * 10;
                    }
                }
            }
        }
        
        return score;
    }

    // Utility methods
    worldToGrid(point) {
        return {
            x: Math.round(point.x / this.gridSize),
            y: Math.round(point.y / this.gridSize)
        };
    }

    gridToWorld(gridPoint) {
        return {
            x: gridPoint.x * this.gridSize,
            y: gridPoint.y * this.gridSize
        };
    }

    gridPathToWorld(gridPath) {
        return gridPath.map(p => this.gridToWorld(p));
    }

    getNodeKey(node) {
        return `${node.x},${node.y}`;
    }

    getDirection(from, to) {
        if (to.x > from.x) return 'right';
        if (to.x < from.x) return 'left';
        if (to.y > from.y) return 'down';
        if (to.y < from.y) return 'up';
        return null;
    }

    getSegmentDirection(start, end) {
        if (end.x !== start.x) return 'horizontal';
        if (end.y !== start.y) return 'vertical';
        return null;
    }

    isInsideBounds(point, bounds, buffer = 0) {
        return point.x >= bounds.x - buffer &&
               point.x <= bounds.x + bounds.width + buffer &&
               point.y >= bounds.y - buffer &&
               point.y <= bounds.y + bounds.height + buffer;
    }

    isOnWire(gridPos, wireData) {
        for (const segment of wireData.segments) {
            if (this.isPointOnSegment(gridPos, segment)) {
                return true;
            }
        }
        return false;
    }

    isPointOnSegment(point, segment) {
        const minX = Math.min(segment.start.x, segment.end.x);
        const maxX = Math.max(segment.start.x, segment.end.x);
        const minY = Math.min(segment.start.y, segment.end.y);
        const maxY = Math.max(segment.start.y, segment.end.y);
        
        return point.x >= minX && point.x <= maxX &&
               point.y >= minY && point.y <= maxY;
    }

    canConnectDirect(from, to) {
        // Check if we can connect two points directly without collision
        if (from.x !== to.x && from.y !== to.y) return false; // Not orthogonal
        
        const step = {
            x: from.x === to.x ? 0 : (to.x > from.x ? 1 : -1),
            y: from.y === to.y ? 0 : (to.y > from.y ? 1 : -1)
        };
        
        let current = { x: from.x, y: from.y };
        
        while (current.x !== to.x || current.y !== to.y) {
            current.x += step.x;
            current.y += step.y;
            
            if (this.isBlocked(this.worldToGrid(current), null, { avoidWires: true })) {
                return false;
            }
        }
        
        return true;
    }

    areParallel(seg1, seg2) {
        return this.getSegmentDirection(seg1.start, seg1.end) === 
               this.getSegmentDirection(seg2.start, seg2.end);
    }

    segmentDistance(seg1, seg2) {
        // Calculate minimum distance between parallel segments
        if (seg1.start.x === seg1.end.x && seg2.start.x === seg2.end.x) {
            // Both vertical
            return Math.abs(seg1.start.x - seg2.start.x);
        } else if (seg1.start.y === seg1.end.y && seg2.start.y === seg2.end.y) {
            // Both horizontal
            return Math.abs(seg1.start.y - seg2.start.y);
        }
        return Infinity;
    }

    calculatePathLength(path) {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    countBends(path) {
        let bends = 0;
        for (let i = 1; i < path.length - 1; i++) {
            const dir1 = this.getDirection(path[i - 1], path[i]);
            const dir2 = this.getDirection(path[i], path[i + 1]);
            if (dir1 !== dir2) bends++;
        }
        return bends;
    }
}

/**
 * Priority queue implementation for A*
 */
class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift().val;
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return this.values.length === 0;
    }

    contains(val) {
        return this.values.some(item => 
            item.val.x === val.x && item.val.y === val.y
        );
    }
}

/**
 * Spatial index for efficient collision detection
 */
class SpatialIndex {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    add(bounds, id) {
        const cells = this.getCellsForBounds(bounds);
        cells.forEach(cell => {
            if (!this.grid.has(cell)) {
                this.grid.set(cell, new Set());
            }
            this.grid.get(cell).add(id);
        });
    }

    remove(bounds, id) {
        const cells = this.getCellsForBounds(bounds);
        cells.forEach(cell => {
            if (this.grid.has(cell)) {
                this.grid.get(cell).delete(id);
                if (this.grid.get(cell).size === 0) {
                    this.grid.delete(cell);
                }
            }
        });
    }

    query(bounds) {
        const cells = this.getCellsForBounds(bounds);
        const results = new Set();
        
        cells.forEach(cell => {
            if (this.grid.has(cell)) {
                this.grid.get(cell).forEach(id => results.add(id));
            }
        });
        
        return Array.from(results);
    }

    getCellsForBounds(bounds) {
        const cells = [];
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                cells.push(`${x},${y}`);
            }
        }
        
        return cells;
    }
}