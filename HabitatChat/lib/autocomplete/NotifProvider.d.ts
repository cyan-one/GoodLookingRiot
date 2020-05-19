import React from 'react';
import Room from "matrix-js-sdk/src/models/room";
import AutocompleteProvider from './AutocompleteProvider';
import { ICompletion, ISelectionRange } from "./Autocompleter";
export default class NotifProvider extends AutocompleteProvider {
    room: Room;
    constructor(room: any);
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
