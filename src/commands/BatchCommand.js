import { Command } from './Command.js';

// Batch command for grouping multiple operations into a single undoable action
export class BatchCommand extends Command {
    constructor(description, commands = []) {
        super(description);
        this.commands = commands;
    }

    addCommand(command) {
        this.commands.push(command);
    }

    execute(stateStore) {
        // Execute all commands in order
        this.commands.forEach(command => {
            command.execute(stateStore);
        });
    }

    undo(stateStore) {
        // Undo all commands in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo(stateStore);
        }
    }

    canExecute(stateStore) {
        // All commands must be executable
        return this.commands.every(command => 
            !command.canExecute || command.canExecute(stateStore)
        );
    }

    isEmpty() {
        return this.commands.length === 0;
    }
}