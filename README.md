# 🔌 Interactive Wiring Diagram Builder

A professional-grade, browser-based tool for creating technical wiring diagrams with real-time wire routing and comprehensive component libraries.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![SVG](https://img.shields.io/badge/SVG-2.0-ff69b4.svg)

## ✨ Features

### 🎯 Core Functionality
- **Drag-and-Drop Interface** - Intuitive component placement with visual feedback
- **Smart Wire Routing** - Automatic orthogonal wire paths with collision avoidance
- **Real-time Collaboration Ready** - State management architecture supports future multi-user features
- **Professional Export Options** - SVG, PNG, and PDF export with print-quality output

### 🛠️ Technical Highlights
- **Pure Client-Side** - No server required, runs entirely in the browser
- **Component Library System** - Extensible architecture for custom component creation
- **Undo/Redo Support** - Full command pattern implementation
- **Auto-Save** - Automatic state persistence to browser storage
- **Performance Optimized** - Viewport culling and level-of-detail rendering for large diagrams

### 📦 Built-in Components
- **Access Control** - ACM, iSTAR G2 controllers
- **Readers** - Card readers, wireless readers, RM-4 modules  
- **Power & Control** - Power supplies, PAM relays, door strikes
- **Interface** - REX buttons, output modules

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wiring-diagram-builder.git
cd wiring-diagram-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Basic Workflow

1. **Select Components** - Choose from the component palette on the left
2. **Place on Canvas** - Drag components onto the drawing area
3. **Connect with Wires** - Select the wire tool and click-drag between terminals
4. **Customize** - Adjust wire colors, gauges, and add labels
5. **Export** - Save your diagram in various formats

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Select tool / Cancel operation |
| `W` | Wire tool |
| `L` | Label tool |
| `Delete` | Delete selected element |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save project |
| `Shift+P` | Toggle performance monitor |

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Graphics**: SVG with svg-pan-zoom library
- **State Management**: Custom implementation with Command pattern
- **Styling**: CSS3 with CSS Variables

### Project Structure

```
wiring-diagram-builder/
├── src/
│   ├── main.js              # Application entry point
│   ├── svgCanvas.js         # Canvas management and rendering
│   ├── elementFactory.js    # Component creation and SVG generation
│   ├── wireTool.js          # Wire drawing and routing logic
│   ├── stateStore.js        # State management and persistence
│   ├── ui/                  # UI components
│   │   ├── palette.js       # Component palette
│   │   ├── UIManager.js     # UI state and interactions
│   │   └── SaveIndicator.js # Auto-save status
│   ├── export/              # Export functionality
│   └── utils/               # Utility functions
├── assets/                  # Component images and icons
├── index.html              # Main application HTML
└── package.json            # Project configuration
```

## 🎨 Customization

### Adding Custom Components

Components are defined as SVG graphics with metadata. To add a new component:

1. Create SVG graphics in `elementFactory.js`
2. Add component metadata to the palette
3. Define terminal connection points
4. Register with the component library

Example:
```javascript
createCustomComponent(dimensions) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // Add your SVG elements here
    return group;
}
```

### Styling

The application uses CSS variables for theming. Customize the look by modifying:

```css
:root {
    --primary-color: #3498db;
    --bg-primary: #1a1a1a;
    --text-primary: #e0e0e0;
    /* ... more variables */
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ES6+ JavaScript standards
- Maintain the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test across different browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Pan/zoom functionality by [svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom)
- Icons and design inspiration from modern CAD applications

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Refer to the wiki for detailed documentation

---

<p align="center">Made with ❤️ for electrical engineers and system designers</p>