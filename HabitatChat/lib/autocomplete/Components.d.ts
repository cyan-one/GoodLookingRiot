import React from 'react';
interface ITextualCompletionProps {
    title?: string;
    subtitle?: string;
    description?: string;
    className?: string;
}
export declare class TextualCompletion extends React.PureComponent<ITextualCompletionProps> {
    render(): JSX.Element;
}
interface IPillCompletionProps {
    title?: string;
    subtitle?: string;
    description?: string;
    initialComponent?: React.ReactNode;
    className?: string;
}
export declare class PillCompletion extends React.PureComponent<IPillCompletionProps> {
    render(): JSX.Element;
}
export {};
