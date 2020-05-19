export interface ConfigOptions {
    [key: string]: any;
}
export declare const DEFAULTS: ConfigOptions;
export default class SdkConfig {
    private static instance;
    private static setInstance;
    static get(): ConfigOptions;
    static put(cfg: ConfigOptions): void;
    static unset(): void;
    static add(cfg: ConfigOptions): void;
}
