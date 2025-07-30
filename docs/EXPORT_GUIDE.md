# Export Functionality Guide

The Wiring Diagram Builder now includes comprehensive export functionality with support for SVG, PNG, and PDF formats.

## Features

### 1. Multiple Export Formats

- **SVG (Vector)**: Scalable vector graphics with embedded styles and images
- **PNG (Raster)**: High-resolution bitmap images with configurable DPI
- **PDF (Document)**: Professional PDF documents with print optimization

### 2. Export Options

#### Export Area Selection
- **Entire Diagram**: Export the complete diagram including all elements
- **Current View**: Export only what's visible in the current viewport
- **Selected Elements**: Export only the currently selected components and wires

#### SVG Export Options
- Embed images as base64 data URIs
- Embed CSS styles inline
- Optimize for print output (darker colors, thicker lines)

#### PNG Export Options
- DPI settings: 72 (screen), 150 (draft), 300 (print), 600 (high quality)
- Background color selection or transparent background
- Quality setting (0.1 to 1.0)
- Memory-efficient tiled rendering for large exports

#### PDF Export Options
- Paper sizes: Letter, Legal, A4, A3, Tabloid, Ledger
- Orientation: Portrait or Landscape
- Configurable margins
- Auto-fit to page
- Black & white conversion for better printing
- Metadata inclusion (author, date, element count)

### 3. Advanced Features

#### Memory Optimization
- Large PNG exports are automatically tiled to prevent memory overflow
- Progressive rendering with cleanup between tiles
- Configurable maximum dimension limits

#### Print Optimization
- Automatic color darkening for light colors
- Increased line weights for better visibility
- Removal of transparency for reliable printing
- CMYK-friendly color adjustments

#### Batch Export
- Export to multiple formats simultaneously
- Progress tracking for long operations
- Sequential downloads with proper timing

#### Progress Indication
- Real-time progress updates
- Time remaining estimates
- Cancelable operations
- Error handling with detailed messages

## Usage

### Basic Export

1. Click the Export button (📤) in the toolbar
2. Select export area (entire diagram, current view, or selection)
3. Choose format(s) to export
4. Configure format-specific settings
5. Click Export

### Quick Presets

- **Web (Low Res)**: PNG at 72 DPI for web use
- **Print (High Res)**: PDF and PNG at 300 DPI
- **Archive (All Formats)**: SVG, PNG, and PDF with embedded resources

### Programmatic Usage

```javascript
// Get the export manager
const exportManager = wiringApp.exportManager;

// Show export dialog
await exportManager.showExportDialog();

// Direct export with options
await exportManager.export({
    formats: ['png', 'pdf'],
    exportArea: 'all',
    settings: {
        png: {
            dpi: 300,
            quality: 0.92,
            backgroundColor: '#ffffff',
            transparent: false
        },
        pdf: {
            orientation: 'landscape',
            format: 'letter',
            autoFit: true
        }
    }
});
```

## Implementation Details

### File Structure

```
src/export/
├── ExportManager.js      # Main export coordinator
├── SVGExporter.js        # SVG export with style embedding
├── PNGExporter.js        # PNG export with tiling support
├── PDFExporter.js        # PDF export with multi-page support
├── ExportDialog.js       # User interface for export options
└── ProgressIndicator.js  # Progress tracking and display
```

### Memory Management

The PNG exporter includes automatic tiling for large exports:
- Calculates optimal tile size based on available memory
- Renders tiles sequentially to avoid memory spikes
- Cleans up resources between tiles
- Provides progress updates during tiling

### Quality Settings

#### DPI Guidelines
- 72 DPI: Screen display, web graphics
- 150 DPI: Draft printing, internal documentation
- 300 DPI: Professional printing, publications
- 600 DPI: High-quality archival, detailed prints

#### PNG Quality
- 0.7-0.8: Good for web, smaller file size
- 0.9-0.92: Balanced quality and size
- 0.95-1.0: Maximum quality, larger files

## Troubleshooting

### Common Issues

1. **Large exports failing**: Reduce DPI or export area
2. **Text not rendering correctly in PDF**: Fonts are embedded, ensure they're web-safe
3. **Colors look different in print**: Use print optimization option
4. **Memory errors**: Enable tiling for PNG exports above 4096x4096

### Performance Tips

- For large diagrams, export current view instead of entire diagram
- Use appropriate DPI for intended use (don't use 600 DPI for web)
- Enable black & white for better laser printer results
- Close other applications when exporting very large files

## Future Enhancements

- DXF/DWG export for CAD software
- Excel/CSV export of component lists
- Batch export with custom naming patterns
- Cloud storage integration
- Export templates and presets saving