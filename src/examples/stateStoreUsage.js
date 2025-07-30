// Example usage of the enhanced StateStore with undo/redo functionality

import { StateStore } from '../stateStore.js';
import { AddElementCommand } from '../commands/AddElementCommand.js';
import { UpdateElementCommand } from '../commands/UpdateElementCommand.js';
import { RemoveElementCommand } from '../commands/RemoveElementCommand.js';
import { BatchCommand } from '../commands/BatchCommand.js';

// Initialize state store
const stateStore = new StateStore();

// Example 1: Add an element with undo support
function addComponent(type, x, y) {
    const element = {
        id: `element_${Date.now()}`,
        type: type,
        x: x,
        y: y,
        width: 100,
        height: 60,
        rotation: 0,
        label: `${type} ${Date.now()}`,
        config: {}
    };
    
    // This will automatically create and execute an AddElementCommand
    stateStore.addElement(element);
}

// Example 2: Update an element with undo support
function moveComponent(elementId, newX, newY) {
    const element = stateStore.getElement(elementId);
    if (element) {
        // This will automatically create and execute an UpdateElementCommand
        stateStore.updateElement(elementId, { x: newX, y: newY });
    }
}

// Example 3: Batch operations
function addMultipleComponents(components) {
    const batch = new BatchCommand('Add multiple components');
    
    components.forEach(comp => {
        const element = {
            id: `element_${Date.now()}_${Math.random()}`,
            type: comp.type,
            x: comp.x,
            y: comp.y,
            width: 100,
            height: 60,
            rotation: 0,
            label: comp.label || comp.type,
            config: {}
        };
        
        batch.addCommand(new AddElementCommand(element));
    });
    
    // Execute the batch command
    stateStore.executeCommand(batch);
}

// Example 4: Listen to state changes
stateStore.addListener((event, data) => {
    switch (event) {
        case 'element-added':
            console.log('Element added:', data);
            break;
            
        case 'element-updated':
            console.log('Element updated:', data);
            break;
            
        case 'element-removed':
            console.log('Element removed:', data);
            break;
            
        case 'auto-save-complete':
            console.log('Auto-save completed at:', new Date(data.timestamp));
            break;
            
        case 'undo':
            console.log('Undone:', data.description);
            break;
            
        case 'redo':
            console.log('Redone:', data.description);
            break;
            
        case 'storage-quota-exceeded':
            console.warn('Storage quota exceeded! Consider exporting your work.');
            break;
    }
});

// Example 5: Export/Import functionality
async function exportProject() {
    // Export as JSON
    await stateStore.exportAsJSON();
    
    // Or export as compressed format
    await stateStore.exportAsCompressed();
}

async function importProject(file) {
    try {
        await stateStore.importFromFile(file);
        console.log('Project imported successfully');
    } catch (error) {
        console.error('Import failed:', error);
    }
}

// Example 6: Manual save with status
async function saveProject() {
    const success = await stateStore.save();
    if (success) {
        console.log('Project saved successfully');
    } else {
        console.error('Save failed');
    }
}

// Example 7: Check and display history status
function displayHistoryStatus() {
    const historyInfo = stateStore.getHistoryInfo();
    
    console.log('History Status:');
    console.log(`Can Undo: ${historyInfo.canUndo}`);
    console.log(`Can Redo: ${historyInfo.canRedo}`);
    
    if (historyInfo.canUndo) {
        console.log(`Next Undo: ${historyInfo.undoDescription}`);
    }
    
    if (historyInfo.canRedo) {
        console.log(`Next Redo: ${historyInfo.redoDescription}`);
    }
    
    console.log(`History Size: ${historyInfo.historySize}`);
    console.log(`Current Index: ${historyInfo.currentIndex}`);
}

// Example 8: Configure auto-save
function configureAutoSave() {
    // Enable/disable auto-save
    stateStore.setAutoSaveEnabled(true);
    
    // Set auto-save delay (in milliseconds)
    stateStore.setAutoSaveDelay(3000); // 3 seconds
    
    // Set conflict resolution strategy
    stateStore.setConflictResolutionStrategy('last-write-wins');
}

// Example 9: Complex operation with custom command
class MoveAndResizeCommand extends Command {
    constructor(elementId, oldBounds, newBounds) {
        super('Move and resize element');
        this.elementId = elementId;
        this.oldBounds = oldBounds;
        this.newBounds = newBounds;
    }
    
    execute(stateStore) {
        stateStore.updateElement(this.elementId, this.newBounds);
    }
    
    undo(stateStore) {
        stateStore.updateElement(this.elementId, this.oldBounds);
    }
}

// Usage
function moveAndResize(elementId, newBounds) {
    const element = stateStore.getElement(elementId);
    if (element) {
        const oldBounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        };
        
        stateStore.executeCommand(
            new MoveAndResizeCommand(elementId, oldBounds, newBounds)
        );
    }
}

// Export for use in other modules
export {
    addComponent,
    moveComponent,
    addMultipleComponents,
    exportProject,
    importProject,
    saveProject,
    displayHistoryStatus,
    configureAutoSave,
    moveAndResize
};