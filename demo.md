# Wiring Diagram Application - Advanced Wire Routing Features

## Overview
This wiring diagram application now includes sophisticated orthogonal wire routing with A* pathfinding, collision detection, wire editing, and auto-routing capabilities.

## Key Features Implemented

### 1. A* Pathfinding Algorithm
- **Orthogonal routing**: All wires follow Manhattan-style paths (horizontal and vertical segments only)
- **Collision detection**: Wires automatically avoid components and optionally other wires
- **Optimal path calculation**: Uses A* algorithm to find the shortest valid path
- **Configurable grid size**: Default 10px grid for precise routing

### 2. Wire Editing System
- **Select and edit wires**: Click on any wire to select it for editing
- **Drag waypoints**: Blue handles appear on selected wires - drag to reroute segments
- **Add waypoints**: Click on green midpoint handles to add new waypoints
- **Delete wires**: Press Delete/Backspace to remove selected wire
- **Reroute wires**: Press 'R' to recalculate the route for selected wire

### 3. Junction Support
- **Create junctions**: Click on any wire to create a junction point
- **Branch from junctions**: Start new wires from junction points
- **Multiple connections**: Junctions can connect multiple wires together

### 4. Auto-Routing
- **Component movement**: When components are moved, connected wires automatically reroute
- **Maintains connections**: Wire endpoints stay attached to terminals
- **Optimal rerouting**: Uses A* to find new optimal paths

### 5. Wire Bundling
- **Automatic bundling**: Wires following similar paths are grouped together
- **Parallel routing**: Maintains consistent spacing between bundled wires
- **Visual grouping**: Bundled wires are routed close together for cleaner diagrams

### 6. Professional Appearance
- **Rounded corners**: Configurable corner radius (0-10px) for smooth turns
- **Wire colors**: Multiple color options for different signal types
- **Wire gauges**: Support for different AWG sizes
- **Visual feedback**: Hover effects, selection highlights, and edit handles

## Usage Instructions

### Creating Wires
1. Click the "Wire" button in the toolbar or press 'W'
2. Click on a source terminal (it will highlight in green)
3. Move mouse to see preview path (uses A* routing)
4. Click on destination terminal to complete the wire

### Editing Wires
1. Switch to "Select" mode (press Escape or click Select button)
2. Click on any wire to select it
3. Drag blue waypoint handles to adjust routing
4. Click green midpoint handles to add new waypoints
5. Press 'R' to recalculate optimal route
6. Press Delete to remove the wire

### Creating Junctions
1. In "Wire" mode, click on any existing wire
2. A junction point will be created
3. The junction will appear as a black dot with white outline
4. Click the junction to start a new wire from that point

### Auto-Routing Options
- **Auto-route on component move**: Automatically reroutes wires when components are dragged
- **Enable wire bundling**: Groups parallel wires together
- **Corner radius**: Adjust smoothness of wire turns (0 = sharp corners, 10 = very rounded)

## Technical Implementation

### A* Router (`aStarRouter.js`)
- Grid-based pathfinding with configurable resolution
- Manhattan distance heuristic for orthogonal routing
- Obstacle avoidance with clearance buffers
- Wire crossing detection and avoidance
- Path optimization to reduce unnecessary bends

### Wire Editor (`wireEditor.js`)
- Interactive handle system for wire manipulation
- Segment-based editing with real-time preview
- SVG path parsing and reconstruction
- Integration with A* router for rerouting

### Wire Tool (`wireTool.js`)
- Enhanced with router integration
- Junction creation and management
- Auto-routing event handling
- UI control bindings

## Performance Optimizations
- Spatial indexing for efficient collision detection
- Priority queue implementation for A* algorithm
- Path caching for repeated routes
- Incremental updates for wire movements

## Future Enhancements
- Wire labels and annotations
- Multi-layer routing for complex diagrams
- Wire grouping and bus creation
- Import/export of routing constraints
- Undo/redo for wire operations