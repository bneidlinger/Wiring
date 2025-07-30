import { Command } from './Command.js';

export class AddElementCommand extends Command {
    constructor(element) {
        super(`Add ${element.type || 'element'}`);
        this.element = JSON.parse(JSON.stringify(element)); // Deep clone
    }

    execute(stateStore) {
        stateStore.addElement(this.element);
    }

    undo(stateStore) {
        const index = stateStore.state.project.elements.findIndex(el => el.id === this.element.id);
        if (index !== -1) {
            stateStore.state.project.elements.splice(index, 1);
            stateStore.state.project.lastModified = Date.now();
            stateStore.notifyListeners('element-removed', this.element);
        }
    }
}