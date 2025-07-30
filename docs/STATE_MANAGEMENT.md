# State Management System Documentation

## Overview

The wiring diagram application now features a robust state management system with the following capabilities:

- **Undo/Redo** - Full command pattern implementation
- **Auto-save** - Automatic saving with debouncing
- **State Compression** - Efficient storage using LZ compression
- **Version Migration** - Support for schema evolution
- **Conflict Resolution** - Handle concurrent edits across tabs
- **Multiple Export Formats** - JSON, compressed (.wdz), and SVG
- **Keyboard Shortcuts** - Standard shortcuts for all operations
- **Save Indicator UI** - Visual feedback for all operations

## Key Features

### 1. Command Pattern for Undo/Redo

All state modifications are wrapped in command objects:

```javascript
// Instead of direct modification:
// stateStore.state.project.elements.push(element);

// Use the state store methods which create commands:
stateStore.addElement(element);
stateStore.updateElement(id, updates);
stateStore.removeElement(id);
```

### 2. Auto-Save with Debouncing

Auto-save triggers 2 seconds after the last modification:

```javascript
// Configure auto-save
stateStore.setAutoSaveEnabled(true);
stateStore.setAutoSaveDelay(2000); // milliseconds
```

### 3. State Compression

Large diagrams are automatically compressed using LZ compression:

- Automatic compression for localStorage
- `.wdz` format for compressed exports
- Fallback to simple compression if pako is unavailable

### 4. Keyboard Shortcuts

- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** - Redo
- **Ctrl/Cmd + Shift + Z** - Redo (alternative)
- **Ctrl/Cmd + S** - Save
- **Ctrl/Cmd + O** - Open file
- **Ctrl/Cmd + E** - Export menu

### 5. State Validation and Recovery

- JSON Schema validation for state integrity
- Automatic repair of corrupted states
- Backup storage for recovery
- Cross-tab synchronization

### 6. Export/Import Formats

- **JSON** - Human-readable, uncompressed
- **WDZ** - Compressed binary format
- **SVG** - Vector graphics export

## Architecture

### State Store Structure

```javascript
{
    version: "2.0.0",
    project: {
        name: "Project Name",
        lastModified: 1234567890,
        canvasSettings: {
            width: 5000,
            height: 3000,
            backgroundImage: null
        },
        elements: [...],
        wires: [...]
    }
}
```

### Command Classes

- `Command` - Base class for all commands
- `AddElementCommand` - Add new elements
- `UpdateElementCommand` - Modify elements
- `RemoveElementCommand` - Delete elements
- `AddWireCommand` - Add wires
- `UpdateWireCommand` - Modify wires
- `RemoveWireCommand` - Delete wires
- `BatchCommand` - Group multiple operations

### Storage Management

- Primary: localStorage with compression
- Fallback: IndexedDB for larger storage
- Emergency: In-memory storage
- Automatic quota management and cleanup

## Usage Examples

### Basic Operations

```javascript
// Add element with undo support
stateStore.addElement({
    id: 'element_1',
    type: 'ACM',
    x: 100,
    y: 100,
    width: 120,
    height: 80
});

// Undo last operation
stateStore.undo();

// Redo
stateStore.redo();
```

### Batch Operations

```javascript
const batch = new BatchCommand('Add multiple components');

components.forEach(comp => {
    batch.addCommand(new AddElementCommand(comp));
});

stateStore.executeCommand(batch);
```

### Custom Commands

```javascript
class CustomCommand extends Command {
    constructor(data) {
        super('Custom operation');
        this.data = data;
    }
    
    execute(stateStore) {
        // Implementation
    }
    
    undo(stateStore) {
        // Reverse implementation
    }
}
```

## Event System

Listen to state changes:

```javascript
stateStore.addListener((event, data) => {
    switch (event) {
        case 'element-added':
        case 'element-updated':
        case 'element-removed':
        case 'wire-added':
        case 'wire-updated':
        case 'wire-removed':
        case 'auto-save-complete':
        case 'save-complete':
        case 'undo':
        case 'redo':
            // Handle events
            break;
    }
});
```

## Save Indicator

The save indicator provides visual feedback:

- **Saving...** - During save operation
- **Saved** - Successful manual save
- **Auto-saved** - Successful auto-save
- **Save failed** - Error during save
- **Storage quota exceeded** - Storage limit reached

## Performance Considerations

1. **Command History Limit** - Maximum 100 commands
2. **Debounced Auto-save** - Prevents excessive saves
3. **Compression** - Reduces storage usage by ~60-80%
4. **Selective Updates** - Only modified data is saved
5. **Viewport Culling** - Only visible elements are rendered

## Migration Support

The system supports schema migration:

```javascript
// Automatic migration from old versions
if (state.version === '1.0.0') {
    // Transform to 2.0.0 format
}
```

## Error Handling

- Validation before operations
- Automatic recovery attempts
- Fallback storage options
- User notifications for failures

## Best Practices

1. Always use state store methods instead of direct modification
2. Group related operations using BatchCommand
3. Implement proper cleanup in undo methods
4. Test undo/redo for all new commands
5. Monitor storage quota usage
6. Export important work regularly