import React from 'react';
import AutocompleteProvider from './AutocompleteProvider';
import QueryMatcher from './QueryMatcher';
import { ICompletion, ISelectionRange } from "./Autocompleter";
import { Command } from '../SlashCommands';
export default class CommandProvider extends AutocompleteProvider {
    matcher: QueryMatcher<Command>;
    constructor();
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
