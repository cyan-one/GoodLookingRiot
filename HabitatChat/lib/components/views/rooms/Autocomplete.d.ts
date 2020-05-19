/// <reference types="node" />
import React from 'react';
import { ICompletion, ISelectionRange, IProviderCompletions } from '../../../autocomplete/Autocompleter';
import { Room } from 'matrix-js-sdk/src/models/room';
import Autocompleter from '../../../autocomplete/Autocompleter';
export declare const generateCompletionDomId: (number: any) => string;
interface IProps {
    query: string;
    onConfirm: (ICompletion: any) => void;
    onSelectionChange?: (ICompletion: any, number: any) => void;
    selection: ISelectionRange;
    room: Room;
}
interface IState {
    completions: IProviderCompletions[];
    completionList: ICompletion[];
    selectionOffset: number;
    shouldShowCompletions: boolean;
    hide: boolean;
    forceComplete: boolean;
}
export default class Autocomplete extends React.PureComponent<IProps, IState> {
    autocompleter: Autocompleter;
    queryRequested: string;
    debounceCompletionsRequest: NodeJS.Timeout;
    containerRef: React.RefObject<HTMLDivElement>;
    constructor(props: any);
    componentDidMount(): void;
    private applyNewProps;
    componentWillUnmount(): void;
    complete(query: string, selection: ISelectionRange): Promise<any>;
    processQuery(query: string, selection: ISelectionRange): Promise<void>;
    processCompletions(completions: IProviderCompletions[]): void;
    hasSelection(): boolean;
    countCompletions(): number;
    moveSelection(delta: number): void;
    onEscape(e: KeyboardEvent): boolean;
    hide: () => void;
    forceComplete(): Promise<unknown>;
    onCompletionClicked: (selectionOffset: number) => boolean;
    setSelection(selectionOffset: number): void;
    componentDidUpdate(prevProps: IProps): void;
    render(): JSX.Element;
}
export {};
