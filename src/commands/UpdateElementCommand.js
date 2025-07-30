import { Command } from './Command.js';

export class UpdateElementCommand extends Command {
    constructor(id, oldState, updates) {
        super(`Update element`);
        this.id = id;
        this.oldState = JSON.parse(JSON.stringify(oldState)); // Deep clone
        this.updates = JSON.parse(JSON.stringify(updates)); // Deep clone
    }

    execute(stateStore) {
        stateStore.updateElement(this.id, this.updates);
    }

    undo(stateStore) {
        const element = stateStore.state.project.elements.find(el => el.id === this.id);
        if (element) {
            // Restore only the properties that were changed
            Object.keys(this.updates).forEach(key => {
                element[key] = this.oldState[key];
            });
            stateStore.state.project.lastModified = Date.now();
            stateStore.notifyListeners('element-updated', element);
        }
    }

    canMergeWith(otherCommand) {
        // Merge consecutive updates to the same element
        return otherCommand instanceof UpdateElementCommand && 
               otherCommand.id === this.id &&
               (otherCommand.timestamp - this.timestamp) < 1000; // Within 1 second
    }

    mergeWith(otherCommand) {
        // Keep the original oldState but update with new changes
        Object.assign(this.updates, otherCommand.updates);
        this.timestamp = otherCommand.timestamp;
    }
}