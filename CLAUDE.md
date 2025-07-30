# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Interactive Wiring-Diagram Builder - a browser-based tool for technicians to create oversized cabinet diagrams with boards, readers, power supplies, and color-coded wire routing.

## Tech Stack

- **Canvas**: Plain SVG in the DOM for inspectable elements
- **Pan/Zoom**: svg-pan-zoom library (1kB gzipped)
- **Drag/Drop**: interact.js
- **Wire Routing**: Orthogonal (Manhattan) paths with A* pathfinding
- **State Storage**: JSON in localStorage
- **Export**: canvg for SVG to PNG conversion
- **UI Framework**: Vanilla JS + lit-html or React
- **Build Tool**: Vite (implied from development plan)

## Project Structure

```
/public
  index.html
/src
  main.js          # Application entry point
  svgCanvas.js     # SVG viewport and pan/zoom handling
  elementFactory.js # Creates boards, readers, PSUs, terminal blocks
  wireTool.js      # Wire drawing and routing logic
  stateStore.js    # JSON state management and persistence
  ui/
    palette.js     # Component palette sidebar
    modalEditor.js # Label and property editors
/assets
  textures/steel.jpg # Background texture
  icons/*.svg        # Component icons
```

## Domain Model

- **Project**: Root container with canvas settings and elements
- **Board**: Type can be 'GCM', 'ACM', or 'PSU' with position and configuration
- **Reader**: Has position and facing direction
- **TerminalBlock**: Attached to parent elements with pin connections
- **Wire**: Connects pins between elements with color, gauge, and label properties

## Key Implementation Notes

1. **Canvas Size**: Support up to 10,000 × 6,000 SVG units for large cabinet diagrams
2. **Grid Snapping**: Elements should snap to grid for alignment
3. **Wire Routing**: Implement Manhattan-style routing with collision avoidance
4. **Performance**: Consider virtual rendering for large diagrams to prevent lag
5. **Export Requirements**: Support PNG export at 300 DPI for printing

## Development Commands

Since this project is in planning phase, typical commands would be:

```bash
# Install dependencies (once package.json exists)
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Run linting (when configured)
npm run lint
```

## Current Status

Project is in planning phase. Implementation follows this sequence:
1. Bootstrap with build tools and basic HTML structure
2. Core canvas with pan/zoom functionality
3. Drag-and-drop palette for components
4. Wire drawing tools
5. Metadata/label editing
6. Save/load and export features
7. Advanced routing and polish