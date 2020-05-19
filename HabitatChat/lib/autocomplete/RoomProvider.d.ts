import React from 'react';
import Room from "matrix-js-sdk/src/models/room";
import AutocompleteProvider from './AutocompleteProvider';
import QueryMatcher from './QueryMatcher';
import { ICompletion, ISelectionRange } from "./Autocompleter";
export default class RoomProvider extends AutocompleteProvider {
    matcher: QueryMatcher<Room>;
    constructor();
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
