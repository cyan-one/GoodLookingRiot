import React from 'react';
import Group from "matrix-js-sdk/src/models/group";
import AutocompleteProvider from './AutocompleteProvider';
import QueryMatcher from './QueryMatcher';
import { ICompletion, ISelectionRange } from "./Autocompleter";
export default class CommunityProvider extends AutocompleteProvider {
    matcher: QueryMatcher<Group>;
    constructor();
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
