import React from 'react';
import type { ICompletion, ISelectionRange } from './Autocompleter';
export interface ICommand {
    command: string | null;
    range: {
        start: number;
        end: number;
    };
}
export default class AutocompleteProvider {
    commandRegex: RegExp;
    forcedCommandRegex: RegExp;
    constructor(commandRegex?: RegExp, forcedCommandRegex?: RegExp);
    destroy(): void;
    /**
     * Of the matched commands in the query, returns the first that contains or is contained by the selection, or null.
     * @param {string} query The query string
     * @param {ISelectionRange} selection Selection to search
     * @param {boolean} force True if the user is forcing completion
     * @return {object} { command, range } where both objects fields are null if no match
     */
    getCurrentCommand(query: string, selection: ISelectionRange, force?: boolean): {
        command: any;
        range: {
            start: any;
            end: any;
        };
    };
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode | null;
    shouldForceComplete(): boolean;
}
