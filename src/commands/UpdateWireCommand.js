import { Command } from './Command.js';

export class UpdateWireCommand extends Command {
    constructor(id, oldState, updates) {
        super('Update wire');
        this.id = id;
        this.oldState = JSON.parse(JSON.stringify(oldState)); // Deep clone
        this.updates = JSON.parse(JSON.stringify(updates)); // Deep clone
    }

    execute(stateStore) {
        stateStore.updateWire(this.id, this.updates);
    }

    undo(stateStore) {
        const wire = stateStore.state.project.wires.find(w => w.id === this.id);
        if (wire) {
            // Restore only the properties that were changed
            Object.keys(this.updates).forEach(key => {
                wire[key] = this.oldState[key];
            });
            stateStore.state.project.lastModified = Date.now();
            stateStore.notifyListeners('wire-updated', wire);
        }
    }

    canMergeWith(otherCommand) {
        // Merge consecutive updates to the same wire
        return otherCommand instanceof UpdateWireCommand && 
               otherCommand.id === this.id &&
               (otherCommand.timestamp - this.timestamp) < 1000; // Within 1 second
    }

    mergeWith(otherCommand) {
        // Keep the original oldState but update with new changes
        Object.assign(this.updates, otherCommand.updates);
        this.timestamp = otherCommand.timestamp;
    }
}