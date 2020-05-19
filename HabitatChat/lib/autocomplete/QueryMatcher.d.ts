interface IOptions<T extends {}> {
    keys: Array<string | keyof T>;
    funcs?: Array<(T: any) => string>;
    shouldMatchWordsOnly?: boolean;
    shouldMatchPrefix?: boolean;
}
/**
 * Simple search matcher that matches any results with the query string anywhere
 * in the search string. Returns matches in the order the query string appears
 * in the search key, earliest first, then in the order the items appeared in
 * the source array.
 *
 * @param {Object[]} objects Initial list of objects. Equivalent to calling
 *     setObjects() after construction
 * @param {Object} options Options object
 * @param {string[]} options.keys List of keys to use as indexes on the objects
 * @param {function[]} options.funcs List of functions that when called with the
 *     object as an arg will return a string to use as an index
 */
export default class QueryMatcher<T> {
    private _options;
    private _keys;
    private _funcs;
    private _items;
    constructor(objects: T[], options?: IOptions<T>);
    setObjects(objects: T[]): void;
    match(query: string): T[];
}
export {};
