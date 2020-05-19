import React from 'react';
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import 'focus-visible';
import 'what-input';
import '../../stores/LifecycleStore';
import PageTypes from '../../PageTypes';
import ResizeNotifier from "../../utils/ResizeNotifier";
import { ValidatedServerConfig } from "../../utils/AutoDiscoveryUtils";
import { IDeferred } from "../../utils/promise";
/** constants for MatrixChat.state.view */
export declare enum Views {
    LOADING = 0,
    WELCOME = 1,
    LOGIN = 2,
    REGISTER = 3,
    POST_REGISTRATION = 4,
    FORGOT_PASSWORD = 5,
    COMPLETE_SECURITY = 6,
    E2E_SETUP = 7,
    LOGGED_IN = 8,
    SOFT_LOGOUT = 9
}
interface IScreen {
    screen: string;
    params?: object;
}
interface IProps {
    config: Record<string, any>;
    serverConfig?: ValidatedServerConfig;
    ConferenceHandler?: any;
    onNewScreen: (string: any) => void;
    enableGuest?: boolean;
    realQueryParams?: Record<string, string>;
    startingFragmentQueryParams?: Record<string, string>;
    onTokenLoginCompleted?: () => void;
    initialScreenAfterLogin?: IScreen;
    defaultDeviceDisplayName?: string;
    makeRegistrationUrl: (object: any) => string;
}
interface IState {
    view: Views;
    page_type?: PageTypes;
    currentRoomId?: string;
    currentGroupId?: string;
    currentGroupIsNew?: boolean;
    currentUserId?: string;
    collapseLhs: boolean;
    leftDisabled: boolean;
    middleDisabled: boolean;
    version?: string;
    newVersion?: string;
    hasNewVersion: boolean;
    newVersionReleaseNotes?: string;
    checkingForUpdate?: string;
    showCookieBar: boolean;
    register_client_secret?: string;
    register_session_id?: string;
    register_id_sid?: string;
    hideToSRUsers: boolean;
    syncError?: Error;
    resizeNotifier: ResizeNotifier;
    showNotifierToolbar: boolean;
    serverConfig?: ValidatedServerConfig;
    ready: boolean;
    thirdPartyInvite?: object;
    roomOobData?: object;
    viaServers?: string[];
    pendingInitialSync?: boolean;
}
export default class MatrixChat extends React.PureComponent<IProps, IState> {
    static displayName: string;
    static defaultProps: {
        realQueryParams: {};
        startingFragmentQueryParams: {};
        config: {};
        onTokenLoginCompleted: () => void;
    };
    firstSyncComplete: boolean;
    firstSyncPromise: IDeferred<void>;
    private screenAfterLogin?;
    private windowWidth;
    private pageChanging;
    private accountPassword?;
    private accountPasswordTimer?;
    private focusComposer;
    private subTitleStatus;
    private readonly loggedInView;
    private readonly dispatcherRef;
    private readonly themeWatcher;
    constructor(props: any, context: any);
    UNSAFE_componentWillUpdate(props: any, state: any): void;
    componentDidUpdate(prevProps: any, prevState: any): void;
    componentWillUnmount(): void;
    getFallbackHsUrl(): any;
    getServerProperties(): {
        serverConfig: any;
    };
    private loadSession;
    startPageChangeTimer(): any;
    stopPageChangeTimer(): number;
    shouldTrackPageChange(prevState: IState, state: IState): boolean;
    setStateForNewView(state: Partial<IState>): void;
    onAction: (payload: any) => void;
    private setPage;
    private startRegistration;
    private viewNextRoom;
    private viewIndexedRoom;
    private viewRoom;
    private viewGroup;
    private viewSomethingBehindModal;
    private viewWelcome;
    private viewHome;
    private viewUser;
    private setMxId;
    private createRoom;
    private chatCreateOrReuse;
    private leaveRoomWarnings;
    private leaveRoom;
    /**
     * Starts a chat with the welcome user, if the user doesn't already have one
     * @returns {string} The room ID of the new room, or null if no room was created
     */
    private startWelcomeUserChat;
    /**
     * Called when a new logged in session has started
     */
    private onLoggedIn;
    private showScreenAfterLogin;
    private viewLastRoom;
    /**
     * Called when the session is logged out
     */
    private onLoggedOut;
    /**
     * Called when the session is softly logged out
     */
    private onSoftLogout;
    /**
     * Called just before the matrix client is started
     * (useful for setting listeners)
     */
    private onWillStartClient;
    /**
     * Called shortly after the matrix client has started. Useful for
     * setting up anything that requires the client to be started.
     * @private
     */
    private onClientStarted;
    showScreen(screen: string, params?: {
        [key: string]: any;
    }): void;
    notifyNewScreen(screen: string): void;
    onAliasClick(event: MouseEvent, alias: string): void;
    onUserClick(event: MouseEvent, userId: string): void;
    onGroupClick(event: MouseEvent, groupId: string): void;
    onLogoutClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void;
    handleResize: () => void;
    private dispatchTimelineResize;
    onRoomCreated(roomId: string): void;
    onRegisterClick: () => void;
    onLoginClick: () => void;
    onForgotPasswordClick: () => void;
    onRegisterFlowComplete: (credentials: object, password: string) => Promise<any>;
    onRegistered(credentials: object): any;
    onFinishPostRegistration: () => void;
    onVersion(current: string, latest: string, releaseNotes?: string): void;
    onSendEvent(roomId: string, event: MatrixEvent): void;
    private setPageSubtitle;
    updateStatusIndicator(state: string, prevState: string): void;
    onCloseAllSettings(): void;
    onServerConfigChange: (serverConfig: any) => void;
    private makeRegistrationUrl;
    onUserCompletedLoginFlow: (credentials: object, password: string) => Promise<any>;
    onCompleteSecurityE2eSetupFinished: () => void;
    render(): JSX.Element;
}
export {};
