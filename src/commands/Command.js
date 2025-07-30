// Base class for all commands (Command Pattern)
export class Command {
    constructor(description = '') {
        this.description = description;
        this.timestamp = Date.now();
    }

    // Execute the command
    execute(stateStore) {
        throw new Error('Execute method must be implemented by subclass');
    }

    // Undo the command
    undo(stateStore) {
        throw new Error('Undo method must be implemented by subclass');
    }

    // Optional: Check if the command can be executed
    canExecute(stateStore) {
        return true;
    }

    // Optional: Merge with another command (for optimization)
    canMergeWith(otherCommand) {
        return false;
    }

    mergeWith(otherCommand) {
        throw new Error('MergeWith method must be implemented if canMergeWith returns true');
    }
}