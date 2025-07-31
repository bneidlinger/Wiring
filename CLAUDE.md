# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive Wiring Diagram Builder - A professional-grade, browser-based tool for creating technical wiring diagrams for access control systems with real-time wire routing and comprehensive component libraries.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), no framework
- **Canvas**: SVG DOM with svg-pan-zoom library for viewport control
- **Drag/Drop**: interact.js for component placement
- **Wire Routing**: Custom A* pathfinding for orthogonal (Manhattan) paths
- **State Management**: Custom implementation with Command pattern for undo/redo
- **Export**: canvg for SVG→PNG, jspdf and svg2pdf.js for PDF export
- **Build Tool**: Vite
- **Testing**: Jest (unit), Playwright (E2E/visual), WebdriverIO (cross-browser)

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Testing commands
npm test                    # Run all tests (unit + visual + e2e)
npm run test:unit          # Jest unit tests only
npm run test:e2e           # Playwright E2E tests
npm run test:visual        # Visual regression tests
npm run test:visual:update # Update visual snapshots
npm run test:a11y          # Accessibility tests
npm run test:perf          # Performance tests
npm run coverage           # Generate coverage report

# Run specific test file
npm run test:unit -- src/svgCanvas.test.js
npx playwright test tests/e2e/complete-workflow.spec.js
```

## Architecture Overview

### Core Application Flow
1. **main.js** - Entry point, initializes all modules and coordinates between them
2. **svgCanvas.js** - Manages SVG viewport, rendering, and viewport culling for performance
3. **stateStore.js** - Central state management with Command pattern, auto-save, and persistence
4. **elementFactory.js** - Creates SVG representations of components (boards, readers, etc.)
5. **wireTool.js** - Handles wire drawing, connects to routers (A* or simple)

### Command Pattern Implementation
All user actions are implemented as Commands (src/commands/) enabling full undo/redo:
- `AddElementCommand` / `RemoveElementCommand` - Component operations
- `AddWireCommand` / `RemoveWireCommand` - Wire operations  
- `UpdateElementCommand` / `UpdateWireCommand` - Property changes
- `BatchCommand` - Groups multiple commands as one undoable action

### Component System
- **ComponentLibrary** (src/componentLibrary/) - Manages component templates and versions
- Components have metadata: dimensions, terminal positions, properties
- Terminal blocks are child elements with pin arrays for wire connections

### Wire Routing System
- **aStarRouter.js** - A* pathfinding for optimal orthogonal paths avoiding obstacles
- **simpleWireRouter.js** - Basic L-shaped routing for performance
- Wires connect between terminal pins, store color/gauge/label metadata

### State Persistence
- JSON state saved to localStorage with compression
- Auto-save on every change with debouncing
- State validation before save/load
- Export/import project files

### UI Architecture
- **UIManager** - Coordinates UI state and tool switching
- **Palette** - Drag-and-drop component library
- **SaveIndicator** - Shows auto-save status
- Context menus and property panels for element editing

## Key Implementation Details

### Canvas Performance
- Viewport culling: Only render elements within view bounds
- Level-of-detail: Simplified rendering when zoomed out
- Batch DOM updates for wire routing
- Maximum canvas: 10,000 × 6,000 SVG units

### Wire Routing Rules
- Orthogonal (90° angles only) paths
- Collision detection with existing elements
- Wire bundling when paths overlap
- Color coding by function (power, data, etc.)

### Component Properties
- Each component type has specific metadata
- Terminal blocks define pin layouts and functions
- Labels support multi-line text with word wrap
- Cabinet location tracking for installation

### Accessibility
- Full keyboard navigation (see UI_FEATURES.md for shortcuts)
- ARIA labels and live regions
- Focus management in modals
- WCAG AA compliant contrast ratios

## Testing Strategy

### Unit Tests (Jest)
- Test pure functions and class methods
- Mock DOM and external dependencies
- Coverage threshold: 80% for all metrics

### E2E Tests (Playwright)
- Complete workflows: create diagram, add components, route wires, export
- Cross-browser testing on Chrome, Firefox, Safari, Edge
- Mobile device testing

### Visual Tests
- Playwright visual regression for UI components
- Canvas rendering consistency
- Export quality verification

### Performance Tests
- Large diagram handling (1000+ components)
- Memory leak detection
- Render performance benchmarks

## Common Development Tasks

### Adding New Component Types
1. Define SVG generation in `elementFactory.js`
2. Add metadata to component library
3. Create icon in assets/
4. Update palette categories
5. Add terminal pin definitions

### Implementing New Wire Routing Algorithm
1. Create new router class implementing base interface
2. Add to wireTool.js routing options
3. Update UI to allow algorithm selection
4. Add performance tests

### Adding Export Format
1. Create new exporter in src/export/
2. Implement conversion from SVG
3. Add to ExportManager
4. Update export dialog UI

## Project Conventions

- ES6+ modules, no transpilation needed
- CSS variables for theming
- BEM naming for CSS classes
- JSDoc comments for public APIs
- Descriptive git commits focusing on "why"