import { Command } from './Command.js';

export class AddWireCommand extends Command {
    constructor(wire) {
        super('Add wire');
        this.wire = JSON.parse(JSON.stringify(wire)); // Deep clone
    }

    execute(stateStore) {
        stateStore.addWire(this.wire);
    }

    undo(stateStore) {
        const index = stateStore.state.project.wires.findIndex(w => w.id === this.wire.id);
        if (index !== -1) {
            stateStore.state.project.wires.splice(index, 1);
            stateStore.state.project.lastModified = Date.now();
            stateStore.notifyListeners('wire-removed', this.wire);
        }
    }
}