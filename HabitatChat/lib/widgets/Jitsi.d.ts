export interface JitsiWidgetData {
    conferenceId: string;
    isAudioOnly: boolean;
    domain: string;
}
export declare class Jitsi {
    private static instance;
    private domain;
    get preferredDomain(): string;
    constructor();
    update(): Promise<any>;
    /**
     * Parses the given URL into the data needed for a Jitsi widget, if the widget
     * URL matches the preferredDomain for the app.
     * @param {string} url The URL to parse.
     * @returns {JitsiWidgetData} The widget data if eligible, otherwise null.
     */
    parsePreferredConferenceUrl(url: string): JitsiWidgetData;
    static getInstance(): Jitsi;
}
