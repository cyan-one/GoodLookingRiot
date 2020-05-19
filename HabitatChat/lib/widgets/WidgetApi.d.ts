export declare enum Capability {
    Screenshot = "m.capability.screenshot",
    Sticker = "m.sticker",
    AlwaysOnScreen = "m.always_on_screen"
}
export declare enum KnownWidgetActions {
    GetSupportedApiVersions = "supported_api_versions",
    TakeScreenshot = "screenshot",
    GetCapabilities = "capabilities",
    SendEvent = "send_event",
    UpdateVisibility = "visibility",
    ReceiveOpenIDCredentials = "openid_credentials",
    SetAlwaysOnScreen = "set_always_on_screen",
    ClientReady = "im.vector.ready"
}
export declare type WidgetAction = KnownWidgetActions | string;
export declare enum WidgetApiType {
    ToWidget = "toWidget",
    FromWidget = "fromWidget"
}
export interface WidgetRequest {
    api: WidgetApiType;
    widgetId: string;
    requestId: string;
    data: any;
    action: WidgetAction;
}
export interface ToWidgetRequest extends WidgetRequest {
    api: WidgetApiType.ToWidget;
}
export interface FromWidgetRequest extends WidgetRequest {
    api: WidgetApiType.FromWidget;
    response: any;
}
/**
 * Handles Riot <--> Widget interactions for embedded/standalone widgets.
 */
export declare class WidgetApi {
    private widgetId;
    private requestedCapabilities;
    private origin;
    private inFlightRequests;
    private readyPromise;
    private readyPromiseResolve;
    /**
     * Set this to true if your widget is expecting a ready message from the client. False otherwise (default).
     */
    expectingExplicitReady: boolean;
    constructor(currentUrl: string, widgetId: string, requestedCapabilities: string[]);
    waitReady(): Promise<any>;
    private replyToRequest;
    private onCapabilitiesRequest;
    callAction(action: WidgetAction, payload: any, callback: (reply: FromWidgetRequest) => void): void;
    setAlwaysOnScreen(onScreen: boolean): Promise<any>;
}
