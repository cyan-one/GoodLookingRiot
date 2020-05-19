import React from 'react';
import AutocompleteProvider from './AutocompleteProvider';
import QueryMatcher from './QueryMatcher';
import { ICompletion, ISelectionRange } from './Autocompleter';
import { IEmoji } from '../emoji';
interface IEmojiShort {
    emoji: IEmoji;
    shortname: string;
    _orderBy: number;
}
export default class EmojiProvider extends AutocompleteProvider {
    matcher: QueryMatcher<IEmojiShort>;
    nameMatcher: QueryMatcher<IEmojiShort>;
    constructor();
    getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]>;
    getName(): string;
    renderCompletions(completions: React.ReactNode[]): React.ReactNode;
}
export {};
