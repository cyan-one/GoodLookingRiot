import * as React from 'react';
import * as PropTypes from 'prop-types';
import { MatrixClient } from 'matrix-js-sdk/src/client';
import { MatrixEvent } from 'matrix-js-sdk/src/models/event';
import sessionStore from '../../stores/SessionStore';
import { MatrixClientCreds } from '../../MatrixClientPeg';
import ResizeHandle from '../views/elements/ResizeHandle';
import { Resizer } from '../../resizer';
import ResizeNotifier from "../../utils/ResizeNotifier";
interface IProps {
    matrixClient: MatrixClient;
    onRegistered: (credentials: MatrixClientCreds) => Promise<MatrixClient>;
    viaServers?: string[];
    hideToSRUsers: boolean;
    resizeNotifier: ResizeNotifier;
    middleDisabled: boolean;
    initialEventPixelOffset: number;
    leftDisabled: boolean;
    rightDisabled: boolean;
    showCookieBar: boolean;
    hasNewVersion: boolean;
    userHasGeneratedPassword: boolean;
    showNotifierToolbar: boolean;
    page_type: string;
    autoJoin: boolean;
    thirdPartyInvite?: object;
    roomOobData?: object;
    currentRoomId: string;
    ConferenceHandler?: object;
    collapseLhs: boolean;
    checkingForUpdate: boolean;
    config: {
        piwik: {
            policyUrl: string;
        };
        [key: string]: any;
    };
    currentUserId?: string;
    currentGroupId?: string;
    currentGroupIsNew?: boolean;
    version?: string;
    newVersion?: string;
    newVersionReleaseNotes?: string;
}
interface IState {
    mouseDown?: {
        x: number;
        y: number;
    };
    syncErrorData: any;
    useCompactLayout: boolean;
    serverNoticeEvents: MatrixEvent[];
    userHasGeneratedPassword: boolean;
}
/**
 * This is what our MatrixChat shows when we are logged in. The precise view is
 * determined by the page_type property.
 *
 * Currently it's very tightly coupled with MatrixChat. We should try to do
 * something about that.
 *
 * Components mounted below us can access the matrix client via the react context.
 */
declare class LoggedInView extends React.PureComponent<IProps, IState> {
    static displayName: string;
    static propTypes: {
        matrixClient: PropTypes.Validator<unknown>;
        page_type: PropTypes.Validator<string>;
        onRoomCreated: PropTypes.Requireable<(...args: any[]) => any>;
        onRegistered: PropTypes.Requireable<(...args: any[]) => any>;
        viaServers: PropTypes.Requireable<string[]>;
    };
    protected readonly _matrixClient: MatrixClient;
    protected readonly _roomView: React.RefObject<any>;
    protected readonly _resizeContainer: React.RefObject<ResizeHandle>;
    protected readonly _sessionStore: sessionStore;
    protected readonly _sessionStoreToken: {
        remove: () => void;
    };
    protected resizer: Resizer;
    constructor(props: any, context: any);
    componentDidMount(): void;
    componentDidUpdate(prevProps: any, prevState: any): void;
    componentWillUnmount(): void;
    shouldComponentUpdate(): boolean;
    canResetTimelineInRoom: (roomId: any) => any;
    _setStateFromSessionStore: () => void;
    _createResizer(): any;
    _loadResizerPreferences(): void;
    onAccountData: (event: any) => void;
    onSync: (syncState: any, oldSyncState: any, data: any) => void;
    onRoomStateEvents: (ev: any, state: any) => void;
    _updateServerNoticeEvents: () => Promise<any[]>;
    _onPaste: (ev: any) => void;
    _onReactKeyDown: (ev: any) => void;
    _onNativeKeyDown: (ev: any) => void;
    _onKeyDown: (ev: any) => void;
    /**
     * dispatch a page-up/page-down/etc to the appropriate component
     * @param {Object} ev The key event
     */
    _onScrollKeyPressed: (ev: any) => void;
    _onDragEnd: (result: any) => void;
    _onRoomTileEndDrag: (result: any) => void;
    _onMouseDown: (ev: any) => void;
    _onMouseUp: (ev: any) => void;
    render(): JSX.Element;
}
export default LoggedInView;
