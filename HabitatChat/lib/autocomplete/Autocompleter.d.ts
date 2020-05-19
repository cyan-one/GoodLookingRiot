import { ReactElement } from 'react';
import Room from 'matrix-js-sdk/src/models/room';
import AutocompleteProvider, { ICommand } from "./AutocompleteProvider";
export interface ISelectionRange {
    beginning?: boolean;
    start: number;
    end: number;
}
export interface ICompletion {
    type: "at-room" | "command" | "community" | "room" | "user";
    completion: string;
    completionId?: string;
    component?: ReactElement;
    range: ISelectionRange;
    command?: string;
    suffix?: string;
    href?: string;
}
export interface IProviderCompletions {
    completions: ICompletion[];
    provider: AutocompleteProvider;
    command: ICommand;
}
export default class Autocompleter {
    room: Room;
    providers: AutocompleteProvider[];
    constructor(room: Room);
    destroy(): void;
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<IProviderCompletions[]>;
}
