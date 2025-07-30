import { Command } from './commands/Command.js';
import { StateValidator } from './utils/StateValidator.js';
import { StateCompressor } from './utils/StateCompressor.js';
import { StorageManager } from './utils/StorageManager.js';
import { debounce } from './utils/debounce.js';

// State schema version for migration support
const CURRENT_SCHEMA_VERSION = '2.0.0';

export class StateStore {
    constructor() {
        // Initialize state with schema version
        this.state = {
            version: CURRENT_SCHEMA_VERSION,
            project: {
                name: 'Untitled Project',
                lastModified: Date.now(),
                canvasSettings: {
                    width: 5000,
                    height: 3000,
                    backgroundImage: null
                },
                elements: [],
                wires: []
            }
        };
        
        // Command history for undo/redo
        this.commandHistory = [];
        this.currentCommandIndex = -1;
        this.maxHistorySize = 100;
        
        // State management
        this.listeners = [];
        this.isDirty = false;
        this.isExecutingCommand = false;
        
        // Storage and validation
        this.storageManager = new StorageManager();
        this.validator = new StateValidator();
        this.compressor = new StateCompressor();
        
        // Auto-save configuration
        this.autoSaveEnabled = true;
        this.autoSaveDelay = 2000; // 2 seconds
        this.debouncedAutoSave = debounce(() => this.autoSave(), this.autoSaveDelay);
        
        // Conflict resolution
        this.lastSyncTimestamp = Date.now();
        this.conflictResolutionStrategy = 'last-write-wins';
        
        // Initialize
        this.initialize();
    }

    initialize() {
        // Load state from storage
        this.load();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Set up storage event listener for cross-tab sync
        window.addEventListener('storage', (e) => {
            if (e.key === 'wiringDiagramState') {
                this.handleStorageChange(e);
            }
        });
        
        // Set up beforeunload handler
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    // Command execution for undo/redo support
    executeCommand(command) {
        if (!(command instanceof Command)) {
            throw new Error('Invalid command');
        }

        try {
            this.isExecutingCommand = true;
            
            // Execute the command
            command.execute(this);
            
            // Clear any commands after current index
            this.commandHistory.splice(this.currentCommandIndex + 1);
            
            // Add command to history
            this.commandHistory.push(command);
            this.currentCommandIndex++;
            
            // Limit history size
            if (this.commandHistory.length > this.maxHistorySize) {
                this.commandHistory.shift();
                this.currentCommandIndex--;
            }
            
            // Mark as dirty and trigger auto-save
            this.isDirty = true;
            this.notifyListeners('command-executed', command);
            
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }
            
        } catch (error) {
            console.error('Command execution failed:', error);
            this.notifyListeners('command-failed', { command, error });
            throw error;
        } finally {
            this.isExecutingCommand = false;
        }
    }

    undo() {
        if (!this.canUndo()) {
            return false;
        }

        try {
            this.isExecutingCommand = true;
            const command = this.commandHistory[this.currentCommandIndex];
            
            command.undo(this);
            this.currentCommandIndex--;
            
            this.isDirty = true;
            this.notifyListeners('undo', command);
            
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }
            
            return true;
        } catch (error) {
            console.error('Undo failed:', error);
            this.notifyListeners('undo-failed', error);
            return false;
        } finally {
            this.isExecutingCommand = false;
        }
    }

    redo() {
        if (!this.canRedo()) {
            return false;
        }

        try {
            this.isExecutingCommand = true;
            this.currentCommandIndex++;
            const command = this.commandHistory[this.currentCommandIndex];
            
            command.execute(this);
            
            this.isDirty = true;
            this.notifyListeners('redo', command);
            
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }
            
            return true;
        } catch (error) {
            console.error('Redo failed:', error);
            this.currentCommandIndex--;
            this.notifyListeners('redo-failed', error);
            return false;
        } finally {
            this.isExecutingCommand = false;
        }
    }

    canUndo() {
        return this.currentCommandIndex >= 0;
    }

    canRedo() {
        return this.currentCommandIndex < this.commandHistory.length - 1;
    }

    getUndoDescription() {
        if (!this.canUndo()) return null;
        return this.commandHistory[this.currentCommandIndex].description;
    }

    getRedoDescription() {
        if (!this.canRedo()) return null;
        return this.commandHistory[this.currentCommandIndex + 1].description;
    }

    // Direct state modifications (create commands instead for undo/redo support)
    addElement(element) {
        if (this.isExecutingCommand) {
            this.state.project.elements.push(element);
            this.state.project.lastModified = Date.now();
            this.notifyListeners('element-added', element);
        } else {
            // Create and execute command for undo/redo support
            import('./commands/AddElementCommand.js').then(module => {
                this.executeCommand(new module.AddElementCommand(element));
            });
        }
    }

    updateElement(id, updates) {
        if (this.isExecutingCommand) {
            const element = this.state.project.elements.find(el => el.id === id);
            if (element) {
                Object.assign(element, updates);
                this.state.project.lastModified = Date.now();
                this.notifyListeners('element-updated', element);
            }
        } else {
            const element = this.getElement(id);
            if (element) {
                import('./commands/UpdateElementCommand.js').then(module => {
                    this.executeCommand(new module.UpdateElementCommand(id, element, updates));
                });
            }
        }
    }

    removeElement(id) {
        if (this.isExecutingCommand) {
            const index = this.state.project.elements.findIndex(el => el.id === id);
            if (index !== -1) {
                const removed = this.state.project.elements.splice(index, 1)[0];
                
                // Also remove any connected wires
                const removedWires = this.state.project.wires.filter(wire => 
                    wire.from.elementId === id || wire.to.elementId === id
                );
                
                this.state.project.wires = this.state.project.wires.filter(wire => 
                    wire.from.elementId !== id && wire.to.elementId !== id
                );
                
                this.state.project.lastModified = Date.now();
                this.notifyListeners('element-removed', { element: removed, wires: removedWires });
            }
        } else {
            const element = this.getElement(id);
            if (element) {
                import('./commands/RemoveElementCommand.js').then(module => {
                    this.executeCommand(new module.RemoveElementCommand(element));
                });
            }
        }
    }

    addWire(wire) {
        if (this.isExecutingCommand) {
            this.state.project.wires.push(wire);
            this.state.project.lastModified = Date.now();
            this.notifyListeners('wire-added', wire);
        } else {
            import('./commands/AddWireCommand.js').then(module => {
                this.executeCommand(new module.AddWireCommand(wire));
            });
        }
    }

    updateWire(id, updates) {
        if (this.isExecutingCommand) {
            const wire = this.state.project.wires.find(w => w.id === id);
            if (wire) {
                Object.assign(wire, updates);
                this.state.project.lastModified = Date.now();
                this.notifyListeners('wire-updated', wire);
            }
        } else {
            const wire = this.getWire(id);
            if (wire) {
                import('./commands/UpdateWireCommand.js').then(module => {
                    this.executeCommand(new module.UpdateWireCommand(id, wire, updates));
                });
            }
        }
    }

    removeWire(id) {
        if (this.isExecutingCommand) {
            const index = this.state.project.wires.findIndex(w => w.id === id);
            if (index !== -1) {
                const removed = this.state.project.wires.splice(index, 1)[0];
                this.state.project.lastModified = Date.now();
                this.notifyListeners('wire-removed', removed);
            }
        } else {
            const wire = this.getWire(id);
            if (wire) {
                import('./commands/RemoveWireCommand.js').then(module => {
                    this.executeCommand(new module.RemoveWireCommand(wire));
                });
            }
        }
    }

    // Getters
    getWire(id) {
        return this.state.project.wires.find(w => w.id === id);
    }
    
    getWires() {
        return this.state.project.wires;
    }
    
    getElements() {
        return this.state.project.elements;
    }
    
    getElement(id) {
        return this.state.project.elements.find(el => el.id === id);
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    setState(newState, skipValidation = false) {
        try {
            // Validate state if not skipped
            if (!skipValidation && !this.validator.validate(newState)) {
                throw new Error('Invalid state structure');
            }

            // Migrate state if needed
            const migratedState = this.migrateState(newState);
            
            // Deep clone to prevent external modifications
            this.state = JSON.parse(JSON.stringify(migratedState));
            this.state.project.lastModified = Date.now();
            
            // Clear command history when loading new state
            this.commandHistory = [];
            this.currentCommandIndex = -1;
            this.isDirty = false;
            
            this.notifyListeners('state-loaded', this.state);
        } catch (error) {
            console.error('Failed to set state:', error);
            this.notifyListeners('state-load-failed', error);
            throw error;
        }
    }

    // State migration
    migrateState(state) {
        if (!state.version) {
            // Legacy state without version
            return {
                version: CURRENT_SCHEMA_VERSION,
                project: state.project || state
            };
        }

        // Add migration logic here as schema evolves
        if (state.version === '1.0.0') {
            // Example migration from 1.0.0 to 2.0.0
            state.version = '2.0.0';
            // Add any necessary transformations
        }

        return state;
    }

    // Storage operations
    async autoSave() {
        if (!this.isDirty || !this.autoSaveEnabled) {
            return;
        }

        try {
            await this.saveToLocalStorage();
            this.isDirty = false;
            this.notifyListeners('auto-save-complete', { timestamp: Date.now() });
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.notifyListeners('auto-save-failed', error);
        }
    }

    async saveToLocalStorage() {
        try {
            // Compress state for storage
            const compressed = await this.compressor.compress(this.state);
            
            // Save with metadata
            const saveData = {
                compressed,
                timestamp: Date.now(),
                version: CURRENT_SCHEMA_VERSION
            };

            await this.storageManager.save('wiringDiagramState', saveData);
            this.lastSyncTimestamp = saveData.timestamp;
            
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            
            // Handle quota exceeded
            if (e.name === 'QuotaExceededError') {
                this.notifyListeners('storage-quota-exceeded', e);
            }
            
            throw e;
        }
    }

    async loadFromLocalStorage() {
        try {
            const saveData = await this.storageManager.load('wiringDiagramState');
            if (!saveData) {
                return false;
            }

            // Decompress state
            const state = await this.compressor.decompress(saveData.compressed);
            
            // Check for conflicts
            if (this.isDirty && saveData.timestamp > this.lastSyncTimestamp) {
                const resolved = await this.resolveConflict(this.state, state);
                this.setState(resolved);
            } else {
                this.setState(state);
            }
            
            this.lastSyncTimestamp = saveData.timestamp;
            return true;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            
            // Attempt recovery
            const recovered = await this.attemptRecovery();
            if (recovered) {
                this.setState(recovered);
                return true;
            }
            
            return false;
        }
    }

    async attemptRecovery() {
        try {
            // Try to load backup
            const backup = await this.storageManager.load('wiringDiagramState_backup');
            if (backup) {
                const state = await this.compressor.decompress(backup.compressed);
                this.notifyListeners('state-recovered', { from: 'backup' });
                return state;
            }
        } catch (e) {
            console.error('Recovery failed:', e);
        }
        return null;
    }

    async resolveConflict(localState, remoteState) {
        if (this.conflictResolutionStrategy === 'last-write-wins') {
            return remoteState.project.lastModified > localState.project.lastModified 
                ? remoteState 
                : localState;
        }
        
        // Implement more sophisticated conflict resolution strategies here
        // For now, default to last-write-wins
        return remoteState;
    }

    handleStorageChange(event) {
        if (event.newValue && !this.isDirty) {
            // Another tab updated the state
            this.loadFromLocalStorage();
        }
    }

    // Manual save
    async save() {
        try {
            await this.saveToLocalStorage();
            
            // Create backup
            await this.storageManager.save('wiringDiagramState_backup', 
                await this.storageManager.load('wiringDiagramState')
            );
            
            this.isDirty = false;
            this.notifyListeners('save-complete', { timestamp: Date.now() });
            
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            this.notifyListeners('save-failed', error);
            return false;
        }
    }

    // Load operations
    async load() {
        try {
            const loaded = await this.loadFromLocalStorage();
            if (!loaded) {
                console.log('No saved state found, starting fresh');
                this.notifyListeners('load-complete', { isNew: true });
            } else {
                this.notifyListeners('load-complete', { isNew: false });
            }
            return loaded;
        } catch (error) {
            console.error('Load failed:', error);
            this.notifyListeners('load-failed', error);
            return false;
        }
    }

    // Export operations
    async exportAsJSON() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.state.project.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        this.notifyListeners('export-complete', { format: 'json' });
    }

    async exportAsCompressed() {
        try {
            const compressed = await this.compressor.compress(this.state);
            const dataBlob = new Blob([compressed], { type: 'application/octet-stream' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.state.project.name.replace(/\s+/g, '_')}_${Date.now()}.wdz`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.notifyListeners('export-complete', { format: 'compressed' });
        } catch (error) {
            console.error('Export failed:', error);
            this.notifyListeners('export-failed', error);
        }
    }

    async exportAsSVG() {
        // This will be implemented in the canvas
        this.notifyListeners('export-requested', { format: 'svg' });
    }

    // Import operations
    async importFromFile(file) {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    let state;
                    
                    if (file.name.endsWith('.wdz')) {
                        // Compressed format
                        state = await this.compressor.decompress(e.target.result);
                    } else {
                        // JSON format
                        state = JSON.parse(e.target.result);
                    }
                    
                    // Validate imported state
                    if (!this.validator.validate(state)) {
                        throw new Error('Invalid file format');
                    }
                    
                    this.setState(state);
                    await this.save();
                    
                    this.notifyListeners('import-complete', { 
                        filename: file.name,
                        format: file.name.endsWith('.wdz') ? 'compressed' : 'json'
                    });
                    
                    resolve(true);
                } catch (error) {
                    console.error('Import failed:', error);
                    this.notifyListeners('import-failed', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                const error = new Error('Failed to read file');
                this.notifyListeners('import-failed', error);
                reject(error);
            };
            
            if (file.name.endsWith('.wdz')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
            
            // Ctrl/Cmd + S for save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }
            
            // Ctrl/Cmd + O for open
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.notifyListeners('open-requested');
            }
            
            // Ctrl/Cmd + E for export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.notifyListeners('export-menu-requested');
            }
        });
    }

    // Listener management
    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Settings
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        if (enabled && this.isDirty) {
            this.debouncedAutoSave();
        }
    }

    setAutoSaveDelay(delay) {
        this.autoSaveDelay = delay;
        this.debouncedAutoSave = debounce(() => this.autoSave(), this.autoSaveDelay);
    }

    setConflictResolutionStrategy(strategy) {
        this.conflictResolutionStrategy = strategy;
    }

    // Status getters
    getIsDirty() {
        return this.isDirty;
    }

    getHistoryInfo() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoDescription: this.getUndoDescription(),
            redoDescription: this.getRedoDescription(),
            historySize: this.commandHistory.length,
            currentIndex: this.currentCommandIndex
        };
    }
}