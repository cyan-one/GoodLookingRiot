export interface IEmoji {
    annotation: string;
    group: number;
    hexcode: string;
    order: number;
    shortcodes: string[];
    tags: string[];
    unicode: string;
    emoticon?: string;
}
interface IEmojiWithFilterString extends IEmoji {
    filterString?: string;
}
export declare const EMOTICON_TO_EMOJI: Map<string, IEmojiWithFilterString>;
export declare const SHORTCODE_TO_EMOJI: Map<string, IEmojiWithFilterString>;
export declare const getEmojiFromUnicode: (unicode: any) => IEmojiWithFilterString;
export declare const DATA_BY_CATEGORY: {
    people: any[];
    nature: any[];
    foods: any[];
    places: any[];
    activity: any[];
    objects: any[];
    symbols: any[];
    flags: any[];
};
export declare const EMOJI: IEmoji[];
export {};
