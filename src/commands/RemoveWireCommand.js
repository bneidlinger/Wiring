import { Command } from './Command.js';

export class RemoveWireCommand extends Command {
    constructor(wire) {
        super('Remove wire');
        this.wire = JSON.parse(JSON.stringify(wire)); // Deep clone
    }

    execute(stateStore) {
        stateStore.removeWire(this.wire.id);
    }

    undo(stateStore) {
        stateStore.state.project.wires.push(this.wire);
        stateStore.state.project.lastModified = Date.now();
        stateStore.notifyListeners('wire-added', this.wire);
    }
}