export declare const CommandCategories: {
    messages: any;
    actions: any;
    admin: any;
    advanced: any;
    other: any;
};
declare type RunFn = ((roomId: string, args: string, cmd: string) => {
    error: any;
} | {
    promise: Promise<any>;
});
interface ICommandOpts {
    command: string;
    aliases?: string[];
    args?: string;
    description: string;
    runFn?: RunFn;
    category: string;
    hideCompletionAfterSpace?: boolean;
}
export declare class Command {
    command: string;
    aliases: string[];
    args: undefined | string;
    description: string;
    runFn: undefined | RunFn;
    category: string;
    hideCompletionAfterSpace: boolean;
    constructor(opts: ICommandOpts);
    getCommand(): string;
    getCommandWithArgs(): string;
    run(roomId: string, args: string, cmd: string): any;
    getUsage(): string;
}
export declare const Commands: Command[];
export declare const CommandMap: Map<any, any>;
export declare function parseCommandString(input: any): {
    cmd: any;
    args: any;
};
/**
 * Process the given text for /commands and return a bound method to perform them.
 * @param {string} roomId The room in which the command was performed.
 * @param {string} input The raw text input by the user.
 * @return {null|function(): Object} Function returning an object with the property 'error' if there was an error
 * processing the command, or 'promise' if a request was sent out.
 * Returns null if the input didn't match a command.
 */
export declare function getCommand(roomId: any, input: any): () => any;
export {};
