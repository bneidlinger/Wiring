import { Command } from './Command.js';

export class RemoveElementCommand extends Command {
    constructor(element) {
        super(`Remove ${element.type || 'element'}`);
        this.element = JSON.parse(JSON.stringify(element)); // Deep clone
        this.removedWires = [];
    }

    execute(stateStore) {
        // Store connected wires before removal
        this.removedWires = stateStore.state.project.wires.filter(wire => 
            wire.from.elementId === this.element.id || wire.to.elementId === this.element.id
        ).map(wire => JSON.parse(JSON.stringify(wire)));

        stateStore.removeElement(this.element.id);
    }

    undo(stateStore) {
        // Restore element
        stateStore.state.project.elements.push(this.element);
        
        // Restore connected wires
        this.removedWires.forEach(wire => {
            stateStore.state.project.wires.push(wire);
            stateStore.notifyListeners('wire-added', wire);
        });
        
        stateStore.state.project.lastModified = Date.now();
        stateStore.notifyListeners('element-added', this.element);
    }
}