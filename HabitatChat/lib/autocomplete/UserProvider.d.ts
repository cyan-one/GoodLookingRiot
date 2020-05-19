import React from 'react';
import AutocompleteProvider from './AutocompleteProvider';
import QueryMatcher from './QueryMatcher';
import Room from "matrix-js-sdk/src/models/room";
import RoomMember from "matrix-js-sdk/src/models/room-member";
import { ICompletion, ISelectionRange } from "./Autocompleter";
export default class UserProvider extends AutocompleteProvider {
    matcher: QueryMatcher<RoomMember>;
    users: RoomMember[];
    room: Room;
    constructor(room: Room);
    destroy(): void;
    private onRoomTimeline;
    private onRoomStateMember;
    getCompletions(rawQuery: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    _makeUsers(): void;
    onUserSpoke(user: RoomMember): void;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
    shouldForceComplete(): boolean;
}
