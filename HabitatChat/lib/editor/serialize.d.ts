import EditorModel from "./model";
export declare function mdSerialize(model: EditorModel): any;
export declare function htmlSerializeIfNeeded(model: EditorModel, { forceHTML }?: {
    forceHTML?: boolean;
}): any;
export declare function textSerialize(model: EditorModel): any;
export declare function containsEmote(model: EditorModel): any;
export declare function startsWith(model: EditorModel, prefix: string): any;
export declare function stripEmoteCommand(model: EditorModel): any;
export declare function stripPrefix(model: EditorModel, prefix: string): any;
export declare function unescapeMessage(model: EditorModel): any;
