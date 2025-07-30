# Wiring Diagram Professional UI - Feature Documentation

## Overview

The wiring diagram application has been redesigned with a modern, professional UI that prioritizes accessibility, usability, and visual appeal. The new interface is inspired by industry-leading tools like Figma and draw.io.

## Key Features

### 1. Modern Visual Design
- **Clean Interface**: Minimalist design with proper spacing and typography
- **Professional Color Scheme**: Carefully selected colors with proper contrast ratios
- **Smooth Transitions**: All interactions have subtle animations for better user feedback
- **Responsive Layout**: Adapts to different screen sizes automatically

### 2. Dark Mode Support
- **Toggle Button**: Click the sun/moon icon in the toolbar
- **System Preference**: Automatically detects system dark mode preference
- **Persistent Setting**: Theme choice is saved in localStorage
- **Optimized Colors**: Both themes meet WCAG AA contrast requirements

### 3. Collapsible Sidebar
- **Toggle Methods**:
  - Click the arrow button on the sidebar edge
  - Press `Ctrl+B` keyboard shortcut
  - Auto-collapses on mobile devices
- **Smooth Animation**: Slides in/out with CSS transitions
- **State Persistence**: Remembers collapsed state between sessions

### 4. Component Search & Filtering
- **Real-time Search**: Type to filter components instantly
- **Smart Matching**: Searches both component names and types
- **Category Auto-Expand**: Expands categories with matching components
- **Keyboard Support**: Press `Escape` to clear search

### 5. Contextual Property Panels
- **Auto-Show**: Appears when selecting components
- **Draggable**: Click and drag the header to reposition
- **Context-Aware**: Shows relevant properties for selected element
- **Fields Include**:
  - Component name
  - Unique ID
  - Cabinet location
  - Notes/description

### 6. Advanced Toolbar
- **Grouped Actions**:
  - File operations (New, Open, Save)
  - Edit operations (Undo, Redo, Cut, Copy, Paste)
  - Drawing tools (Select, Wire, Label, Terminal)
  - View controls (Zoom In/Out, Fit to Screen)
- **Visual Feedback**: Active tool is highlighted
- **Keyboard Shortcuts**: All actions have keyboard shortcuts

### 7. Keyboard Navigation
- **Full Keyboard Access**: Navigate entire UI without mouse
- **Logical Tab Order**: Tab through elements in intuitive sequence
- **Arrow Key Navigation**: Use arrows in component palette
- **Focus Indicators**: Clear visual feedback for focused elements
- **Shortcut Panel**: Press `?` to view all keyboard shortcuts

### 8. Accessibility Features
- **ARIA Labels**: All interactive elements properly labeled
- **Screen Reader Support**: Live regions for important announcements
- **Skip Links**: Skip to main content for keyboard users
- **Focus Management**: Proper focus trapping in modals
- **High Contrast**: Works with system high contrast modes

### 9. Wire Settings Panel
- **Wire Properties**:
  - Color selection (Red, Black, Green, White, etc.)
  - Gauge selection (18-24 AWG)
  - Auto-routing toggle
  - Wire bundling option
- **Live Updates**: Changes apply immediately to active wire tool

### 10. Tooltips & Help System
- **Hover Tooltips**: Helpful hints on hover/focus
- **Keyboard Accessible**: Tooltips show on keyboard focus
- **Smart Positioning**: Automatically adjusts to stay in viewport
- **Contextual Help**: Different help for different tools/modes

### 11. Context Menu
- **Right-Click Menu**: Quick actions on canvas right-click
- **Common Actions**:
  - Add Component
  - Add Wire
  - Copy/Paste
  - Delete
- **Keyboard Navigation**: Navigate menu with arrow keys

### 12. Status Bar
- **Live Information**:
  - Current status/mode
  - Save status
  - Component count
  - Wire count
  - Zoom level
- **Unobtrusive**: Minimal height, maximum information

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl+N` - New diagram
- `Ctrl+O` - Open file
- `Ctrl+S` - Save diagram
- `Ctrl+E` - Export options
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+X` - Cut
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Ctrl+B` - Toggle sidebar
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Fit to screen

### Tool Shortcuts
- `V` - Select tool
- `W` - Wire tool
- `T` - Label tool
- `P` - Terminal tool
- `Delete` - Delete selected
- `?` - Show shortcuts
- `Escape` - Cancel/close

## Accessibility Compliance

The UI meets WCAG 2.1 AA standards:
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Access**: All functionality available via keyboard
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Focus Management**: Clear focus indicators and logical tab order
- **Error Prevention**: Confirmation dialogs for destructive actions

## Responsive Design

The UI adapts to different screen sizes:
- **Desktop (>1024px)**: Full interface with all panels
- **Tablet (768-1024px)**: Collapsible sidebar, adjusted spacing
- **Mobile (<768px)**: Auto-collapsed sidebar, simplified toolbar

## Performance Optimizations

- **CSS Variables**: Theme switching without re-rendering
- **Transition Control**: Smooth animations that can be disabled
- **Event Delegation**: Efficient event handling for dynamic content
- **Lazy Loading**: Components load as needed

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All browsers must have JavaScript enabled

## Future Enhancements

Planned features for future releases:
- Component preview on hover
- Customizable toolbar layouts
- Multiple theme presets
- Advanced search with filters
- Collaborative features
- Touch gesture support
- Voice commands
- AI-assisted wire routing