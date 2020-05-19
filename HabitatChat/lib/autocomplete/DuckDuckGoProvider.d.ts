import React from 'react';
import AutocompleteProvider from './AutocompleteProvider';
import { ICompletion, ISelectionRange } from "./Autocompleter";
export default class DuckDuckGoProvider extends AutocompleteProvider {
    constructor();
    static getQueryUri(query: string): string;
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
