export declare function sleep<T>(ms: number, value: T): Promise<T>;
export declare function timeout<T>(promise: Promise<T>, timeoutValue: T, ms: number): Promise<T>;
export interface IDeferred<T> {
    resolve: (value: T) => void;
    reject: (any: any) => void;
    promise: Promise<T>;
}
export declare function defer<T>(): IDeferred<T>;
export declare function allSettled<T>(promises: Promise<T>[]): Promise<Array<ISettledFulfilled<T> | ISettledRejected>>;
