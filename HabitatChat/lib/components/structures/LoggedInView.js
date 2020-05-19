"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var React = _interopRequireWildcard(require("react"));

var PropTypes = _interopRequireWildcard(require("prop-types"));

var _client = require("matrix-js-sdk/src/client");

var _reactBeautifulDnd = require("react-beautiful-dnd");

var _Keyboard = require("../../Keyboard");

var _PageTypes = _interopRequireDefault(require("../../PageTypes"));

var _CallMediaHandler = _interopRequireDefault(require("../../CallMediaHandler"));

var _FontManager = require("../../utils/FontManager");

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _SessionStore = _interopRequireDefault(require("../../stores/SessionStore"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _SettingsStore = _interopRequireDefault(require("../../settings/SettingsStore"));

var _RoomListStore = _interopRequireDefault(require("../../stores/RoomListStore"));

var _TagOrderActions = _interopRequireDefault(require("../../actions/TagOrderActions"));

var _RoomListActions = _interopRequireDefault(require("../../actions/RoomListActions"));

var _ResizeHandle = _interopRequireDefault(require("../views/elements/ResizeHandle"));

var _resizer = require("../../resizer");

var _MatrixClientContext = _interopRequireDefault(require("../../contexts/MatrixClientContext"));

var KeyboardShortcuts = _interopRequireWildcard(require("../../accessibility/KeyboardShortcuts"));

var _HomePage = _interopRequireDefault(require("./HomePage"));

var _PlatformPeg = _interopRequireDefault(require("../../PlatformPeg"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017, 2018, 2020 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// We need to fetch each pinned message individually (if we don't already have it)
// so each pinned message may trigger a request. Limit the number per room for sanity.
// NB. this is just for server notices rather than pinned messages in general.
const MAX_PINNED_NOTICES_PER_ROOM = 2;

function canElementReceiveInput(el) {
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || !!el.getAttribute("contenteditable");
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
class LoggedInView extends React.PureComponent
/*:: <IProps, IState>*/
{
  constructor(props, context) {
    super(props, context);
    (0, _defineProperty2.default)(this, "_matrixClient", void 0);
    (0, _defineProperty2.default)(this, "_roomView", void 0);
    (0, _defineProperty2.default)(this, "_resizeContainer", void 0);
    (0, _defineProperty2.default)(this, "_sessionStore", void 0);
    (0, _defineProperty2.default)(this, "_sessionStoreToken", void 0);
    (0, _defineProperty2.default)(this, "resizer", void 0);
    (0, _defineProperty2.default)(this, "canResetTimelineInRoom", roomId => {
      if (!this._roomView.current) {
        return true;
      }

      return this._roomView.current.canResetTimeline();
    });
    (0, _defineProperty2.default)(this, "_setStateFromSessionStore", () => {
      this.setState({
        userHasGeneratedPassword: Boolean(this._sessionStore.getCachedPassword())
      });
    });
    (0, _defineProperty2.default)(this, "onAccountData", event => {
      if (event.getType() === "im.vector.web.settings") {
        this.setState({
          useCompactLayout: event.getContent().useCompactLayout
        });
      }

      if (event.getType() === "m.ignored_user_list") {
        _dispatcher.default.dispatch({
          action: "ignore_state_changed"
        });
      }
    });
    (0, _defineProperty2.default)(this, "onSync", (syncState, oldSyncState, data) => {
      const oldErrCode = this.state.syncErrorData && this.state.syncErrorData.error && this.state.syncErrorData.error.errcode;
      const newErrCode = data && data.error && data.error.errcode;
      if (syncState === oldSyncState && oldErrCode === newErrCode) return;

      if (syncState === 'ERROR') {
        this.setState({
          syncErrorData: data
        });
      } else {
        this.setState({
          syncErrorData: null
        });
      }

      if (oldSyncState === 'PREPARED' && syncState === 'SYNCING') {
        this._updateServerNoticeEvents();
      }
    });
    (0, _defineProperty2.default)(this, "onRoomStateEvents", (ev, state) => {
      const roomLists = _RoomListStore.default.getRoomLists();

      if (roomLists['m.server_notice'] && roomLists['m.server_notice'].some(r => r.roomId === ev.getRoomId())) {
        this._updateServerNoticeEvents();
      }
    });
    (0, _defineProperty2.default)(this, "_updateServerNoticeEvents", async () => {
      const roomLists = _RoomListStore.default.getRoomLists();

      if (!roomLists['m.server_notice']) return [];
      const pinnedEvents = [];

      for (const room of roomLists['m.server_notice']) {
        const pinStateEvent = room.currentState.getStateEvents("m.room.pinned_events", "");
        if (!pinStateEvent || !pinStateEvent.getContent().pinned) continue;
        const pinnedEventIds = pinStateEvent.getContent().pinned.slice(0, MAX_PINNED_NOTICES_PER_ROOM);

        for (const eventId of pinnedEventIds) {
          const timeline = await this._matrixClient.getEventTimeline(room.getUnfilteredTimelineSet(), eventId, 0);
          const event = timeline.getEvents().find(ev => ev.getId() === eventId);
          if (event) pinnedEvents.push(event);
        }
      }

      this.setState({
        serverNoticeEvents: pinnedEvents
      });
    });
    (0, _defineProperty2.default)(this, "_onPaste", ev => {
      let canReceiveInput = false;
      let element = ev.target; // test for all parents because the target can be a child of a contenteditable element

      while (!canReceiveInput && element) {
        canReceiveInput = canElementReceiveInput(element);
        element = element.parentElement;
      }

      if (!canReceiveInput) {
        // refocusing during a paste event will make the
        // paste end up in the newly focused element,
        // so dispatch synchronously before paste happens
        _dispatcher.default.dispatch({
          action: 'focus_composer'
        }, true);
      }
    });
    (0, _defineProperty2.default)(this, "_onReactKeyDown", ev => {
      // events caught while bubbling up on the root element
      // of this component, so something must be focused.
      this._onKeyDown(ev);
    });
    (0, _defineProperty2.default)(this, "_onNativeKeyDown", ev => {
      // only pass this if there is no focused element.
      // if there is, _onKeyDown will be called by the
      // react keydown handler that respects the react bubbling order.
      if (ev.target === document.body) {
        this._onKeyDown(ev);
      }
    });
    (0, _defineProperty2.default)(this, "_onKeyDown", ev => {
      /*
      // Remove this for now as ctrl+alt = alt-gr so this breaks keyboards which rely on alt-gr for numbers
      // Will need to find a better meta key if anyone actually cares about using this.
      if (ev.altKey && ev.ctrlKey && ev.keyCode > 48 && ev.keyCode < 58) {
          dis.dispatch({
              action: 'view_indexed_room',
              roomIndex: ev.keyCode - 49,
          });
          ev.stopPropagation();
          ev.preventDefault();
          return;
      }
      */
      let handled = false;
      const ctrlCmdOnly = (0, _Keyboard.isOnlyCtrlOrCmdKeyEvent)(ev);
      const hasModifier = ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey;
      const isModifier = ev.key === _Keyboard.Key.ALT || ev.key === _Keyboard.Key.CONTROL || ev.key === _Keyboard.Key.META || ev.key === _Keyboard.Key.SHIFT;

      switch (ev.key) {
        case _Keyboard.Key.PAGE_UP:
        case _Keyboard.Key.PAGE_DOWN:
          if (!hasModifier && !isModifier) {
            this._onScrollKeyPressed(ev);

            handled = true;
          }

          break;

        case _Keyboard.Key.HOME:
        case _Keyboard.Key.END:
          if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
            this._onScrollKeyPressed(ev);

            handled = true;
          }

          break;

        case _Keyboard.Key.K:
          if (ctrlCmdOnly) {
            _dispatcher.default.dispatch({
              action: 'focus_room_filter'
            });

            handled = true;
          }

          break;

        case _Keyboard.Key.BACKTICK:
          // Ideally this would be CTRL+P for "Profile", but that's
          // taken by the print dialog. CTRL+I for "Information"
          // was previously chosen but conflicted with italics in
          // composer, so CTRL+` it is
          if (ctrlCmdOnly) {
            _dispatcher.default.dispatch({
              action: 'toggle_top_left_menu'
            });

            handled = true;
          }

          break;

        case _Keyboard.Key.SLASH:
          if ((0, _Keyboard.isOnlyCtrlOrCmdIgnoreShiftKeyEvent)(ev)) {
            KeyboardShortcuts.toggleDialog();
            handled = true;
          }

          break;

        case _Keyboard.Key.ARROW_UP:
        case _Keyboard.Key.ARROW_DOWN:
          if (ev.altKey && !ev.ctrlKey && !ev.metaKey) {
            _dispatcher.default.dispatch({
              action: 'view_room_delta',
              delta: ev.key === _Keyboard.Key.ARROW_UP ? -1 : 1,
              unread: ev.shiftKey
            });

            handled = true;
          }

          break;

        case _Keyboard.Key.PERIOD:
          if (ctrlCmdOnly && (this.props.page_type === "room_view" || this.props.page_type === "group_view")) {
            _dispatcher.default.dispatch({
              action: 'toggle_right_panel',
              type: this.props.page_type === "room_view" ? "room" : "group"
            });

            handled = true;
          }

          break;

        default:
          // if we do not have a handler for it, pass it to the platform which might
          handled = _PlatformPeg.default.get().onKeyDown(ev);
      }

      if (handled) {
        ev.stopPropagation();
        ev.preventDefault();
      } else if (!isModifier && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
        // The above condition is crafted to _allow_ characters with Shift
        // already pressed (but not the Shift key down itself).
        const isClickShortcut = ev.target !== document.body && (ev.key === _Keyboard.Key.SPACE || ev.key === _Keyboard.Key.ENTER); // Do not capture the context menu key to improve keyboard accessibility

        if (ev.key === _Keyboard.Key.CONTEXT_MENU) {
          return;
        }

        if (!isClickShortcut && ev.key !== _Keyboard.Key.TAB && !canElementReceiveInput(ev.target)) {
          // synchronous dispatch so we focus before key generates input
          _dispatcher.default.dispatch({
            action: 'focus_composer'
          }, true);

          ev.stopPropagation(); // we should *not* preventDefault() here as
          // that would prevent typing in the now-focussed composer
        }
      }
    });
    (0, _defineProperty2.default)(this, "_onScrollKeyPressed", ev => {
      if (this._roomView.current) {
        this._roomView.current.handleScrollKey(ev);
      }
    });
    (0, _defineProperty2.default)(this, "_onDragEnd", result => {
      // Dragged to an invalid destination, not onto a droppable
      if (!result.destination) {
        return;
      }

      const dest = result.destination.droppableId;

      if (dest === 'tag-panel-droppable') {
        // Could be "GroupTile +groupId:domain"
        const draggableId = result.draggableId.split(' ').pop(); // Dispatch synchronously so that the TagPanel receives an
        // optimistic update from TagOrderStore before the previous
        // state is shown.

        _dispatcher.default.dispatch(_TagOrderActions.default.moveTag(this._matrixClient, draggableId, result.destination.index), true);
      } else if (dest.startsWith('room-sub-list-droppable_')) {
        this._onRoomTileEndDrag(result);
      }
    });
    (0, _defineProperty2.default)(this, "_onRoomTileEndDrag", result => {
      let newTag = result.destination.droppableId.split('_')[1];
      let prevTag = result.source.droppableId.split('_')[1];
      if (newTag === 'undefined') newTag = undefined;
      if (prevTag === 'undefined') prevTag = undefined;
      const roomId = result.draggableId.split('_')[1];
      const oldIndex = result.source.index;
      const newIndex = result.destination.index;

      _dispatcher.default.dispatch(_RoomListActions.default.tagRoom(this._matrixClient, this._matrixClient.getRoom(roomId), prevTag, newTag, oldIndex, newIndex), true);
    });
    (0, _defineProperty2.default)(this, "_onMouseDown", ev => {
      // When the panels are disabled, clicking on them results in a mouse event
      // which bubbles to certain elements in the tree. When this happens, close
      // any settings page that is currently open (user/room/group).
      if (this.props.leftDisabled && this.props.rightDisabled) {
        const targetClasses = new Set(ev.target.className.split(' '));

        if (targetClasses.has('mx_MatrixChat') || targetClasses.has('mx_MatrixChat_middlePanel') || targetClasses.has('mx_RoomView')) {
          this.setState({
            mouseDown: {
              x: ev.pageX,
              y: ev.pageY
            }
          });
        }
      }
    });
    (0, _defineProperty2.default)(this, "_onMouseUp", ev => {
      if (!this.state.mouseDown) return;
      const deltaX = ev.pageX - this.state.mouseDown.x;
      const deltaY = ev.pageY - this.state.mouseDown.y;
      const distance = Math.sqrt(deltaX * deltaX + (deltaY + deltaY));
      const maxRadius = 5; // People shouldn't be straying too far, hopefully
      // Note: we track how far the user moved their mouse to help
      // combat against https://github.com/vector-im/riot-web/issues/7158

      if (distance < maxRadius) {
        // This is probably a real click, and not a drag
        _dispatcher.default.dispatch({
          action: 'close_settings'
        });
      } // Always clear the mouseDown state to ensure we don't accidentally
      // use stale values due to the mouseDown checks.


      this.setState({
        mouseDown: null
      });
    });
    this.state = {
      mouseDown: undefined,
      syncErrorData: undefined,
      userHasGeneratedPassword: false,
      // use compact timeline view
      useCompactLayout: _SettingsStore.default.getValue('useCompactLayout'),
      // any currently active server notice events
      serverNoticeEvents: []
    }; // stash the MatrixClient in case we log out before we are unmounted

    this._matrixClient = this.props.matrixClient;

    _CallMediaHandler.default.loadDevices();

    document.addEventListener('keydown', this._onNativeKeyDown, false);
    this._sessionStore = _SessionStore.default;
    this._sessionStoreToken = this._sessionStore.addListener(this._setStateFromSessionStore);

    this._setStateFromSessionStore();

    this._updateServerNoticeEvents();

    this._matrixClient.on("accountData", this.onAccountData);

    this._matrixClient.on("sync", this.onSync);

    this._matrixClient.on("RoomState.events", this.onRoomStateEvents);

    (0, _FontManager.fixupColorFonts)();
    this._roomView = React.createRef();
    this._resizeContainer = React.createRef();
  }

  componentDidMount() {
    this.resizer = this._createResizer();
    this.resizer.attach();

    this._loadResizerPreferences();
  }

  componentDidUpdate(prevProps, prevState) {
    // attempt to guess when a banner was opened or closed
    if (prevProps.showCookieBar !== this.props.showCookieBar || prevProps.hasNewVersion !== this.props.hasNewVersion || prevState.userHasGeneratedPassword !== this.state.userHasGeneratedPassword || prevProps.showNotifierToolbar !== this.props.showNotifierToolbar) {
      this.props.resizeNotifier.notifyBannersChanged();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._onNativeKeyDown, false);

    this._matrixClient.removeListener("accountData", this.onAccountData);

    this._matrixClient.removeListener("sync", this.onSync);

    this._matrixClient.removeListener("RoomState.events", this.onRoomStateEvents);

    if (this._sessionStoreToken) {
      this._sessionStoreToken.remove();
    }

    this.resizer.detach();
  } // Child components assume that the client peg will not be null, so give them some
  // sort of assurance here by only allowing a re-render if the client is truthy.
  //
  // This is required because `LoggedInView` maintains its own state and if this state
  // updates after the client peg has been made null (during logout), then it will
  // attempt to re-render and the children will throw errors.


  shouldComponentUpdate() {
    return Boolean(_MatrixClientPeg.MatrixClientPeg.get());
  }

  _createResizer() {
    const classNames = {
      handle: "mx_ResizeHandle",
      vertical: "mx_ResizeHandle_vertical",
      reverse: "mx_ResizeHandle_reverse"
    };
    const collapseConfig = {
      toggleSize: 260 - 50,
      onCollapsed: collapsed => {
        if (collapsed) {
          _dispatcher.default.dispatch({
            action: "hide_left_panel"
          }, true);

          window.localStorage.setItem("mx_lhs_size", '0');
        } else {
          _dispatcher.default.dispatch({
            action: "show_left_panel"
          }, true);
        }
      },
      onResized: size => {
        window.localStorage.setItem("mx_lhs_size", '' + size);
        this.props.resizeNotifier.notifyLeftHandleResized();
      }
    };
    const resizer = new _resizer.Resizer(this._resizeContainer.current, _resizer.CollapseDistributor, collapseConfig);
    resizer.setClassNames(classNames);
    return resizer;
  }

  _loadResizerPreferences() {
    let lhsSize = parseInt(window.localStorage.getItem("mx_lhs_size"), 10);

    if (isNaN(lhsSize)) {
      lhsSize = 350;
    }

    this.resizer.forHandleAt(0).resize(lhsSize);
  }

  render() {
    const LeftPanel = sdk.getComponent('structures.LeftPanel');
    const RoomView = sdk.getComponent('structures.RoomView');
    const UserView = sdk.getComponent('structures.UserView');
    const GroupView = sdk.getComponent('structures.GroupView');
    const MyGroups = sdk.getComponent('structures.MyGroups');
    const ToastContainer = sdk.getComponent('structures.ToastContainer');
    const MatrixToolbar = sdk.getComponent('globals.MatrixToolbar');
    const CookieBar = sdk.getComponent('globals.CookieBar');
    const NewVersionBar = sdk.getComponent('globals.NewVersionBar');
    const UpdateCheckBar = sdk.getComponent('globals.UpdateCheckBar');
    const PasswordNagBar = sdk.getComponent('globals.PasswordNagBar');
    const ServerLimitBar = sdk.getComponent('globals.ServerLimitBar');
    const NavBar = sdk.getComponent('views.NavBar');
    let pageElement;

    switch (this.props.page_type) {
      case _PageTypes.default.RoomView:
        pageElement = /*#__PURE__*/React.createElement(RoomView, {
          ref: this._roomView,
          autoJoin: this.props.autoJoin,
          onRegistered: this.props.onRegistered,
          thirdPartyInvite: this.props.thirdPartyInvite,
          oobData: this.props.roomOobData,
          viaServers: this.props.viaServers,
          eventPixelOffset: this.props.initialEventPixelOffset,
          key: this.props.currentRoomId || 'roomview',
          disabled: this.props.middleDisabled,
          ConferenceHandler: this.props.ConferenceHandler,
          resizeNotifier: this.props.resizeNotifier
        });
        break;

      case _PageTypes.default.MyGroups:
        pageElement = /*#__PURE__*/React.createElement(MyGroups, null);
        break;

      case _PageTypes.default.RoomDirectory:
        // handled by MatrixChat for now
        break;

      case _PageTypes.default.NavBar:
        pageElement = /*#__PURE__*/React.createElement(NavBar, null);
        break;

      case _PageTypes.default.HomePage:
        pageElement = /*#__PURE__*/React.createElement(_HomePage.default, null);
        break;

      case _PageTypes.default.UserView:
        pageElement = /*#__PURE__*/React.createElement(UserView, {
          userId: this.props.currentUserId
        });
        break;

      case _PageTypes.default.GroupView:
        pageElement = /*#__PURE__*/React.createElement(GroupView, {
          groupId: this.props.currentGroupId,
          isNew: this.props.currentGroupIsNew
        });
        break;
    }

    const usageLimitEvent = this.state.serverNoticeEvents.find(e => {
      return e && e.getType() === 'm.room.message' && e.getContent()['server_notice_type'] === 'm.server_notice.usage_limit_reached';
    });
    let topBar;

    if (this.state.syncErrorData && this.state.syncErrorData.error.errcode === 'M_RESOURCE_LIMIT_EXCEEDED') {
      topBar = /*#__PURE__*/React.createElement(ServerLimitBar, {
        kind: "hard",
        adminContact: this.state.syncErrorData.error.data.admin_contact,
        limitType: this.state.syncErrorData.error.data.limit_type
      });
    } else if (usageLimitEvent) {
      topBar = /*#__PURE__*/React.createElement(ServerLimitBar, {
        kind: "soft",
        adminContact: usageLimitEvent.getContent().admin_contact,
        limitType: usageLimitEvent.getContent().limit_type
      });
    } else if (this.props.showCookieBar && this.props.config.piwik && navigator.doNotTrack !== "1") {
      const policyUrl = this.props.config.piwik.policyUrl || null;
      topBar = /*#__PURE__*/React.createElement(CookieBar, {
        policyUrl: policyUrl
      });
    } else if (this.props.hasNewVersion) {
      topBar = /*#__PURE__*/React.createElement(NewVersionBar, {
        version: this.props.version,
        newVersion: this.props.newVersion,
        releaseNotes: this.props.newVersionReleaseNotes
      });
    } else if (this.props.checkingForUpdate) {
      topBar = /*#__PURE__*/React.createElement(UpdateCheckBar, this.props.checkingForUpdate);
    } else if (this.state.userHasGeneratedPassword) {
      topBar = /*#__PURE__*/React.createElement(PasswordNagBar, null);
    } else if (this.props.showNotifierToolbar) {
      topBar = /*#__PURE__*/React.createElement(MatrixToolbar, null);
    }

    let bodyClasses = 'mx_MatrixChat';

    if (topBar) {
      bodyClasses += ' mx_MatrixChat_toolbarShowing';
    }

    if (this.state.useCompactLayout) {
      bodyClasses += ' mx_MatrixChat_useCompactLayout';
    }

    return /*#__PURE__*/React.createElement(_MatrixClientContext.default.Provider, {
      value: this._matrixClient
    }, /*#__PURE__*/React.createElement("div", {
      onPaste: this._onPaste,
      onKeyDown: this._onReactKeyDown,
      className: "mx_MatrixChat_wrapper",
      "aria-hidden": this.props.hideToSRUsers,
      onMouseDown: this._onMouseDown,
      onMouseUp: this._onMouseUp
    }, /*#__PURE__*/React.createElement(NavBar, null), topBar, /*#__PURE__*/React.createElement(ToastContainer, null), /*#__PURE__*/React.createElement(_reactBeautifulDnd.DragDropContext, {
      onDragEnd: this._onDragEnd
    }, /*#__PURE__*/React.createElement("div", {
      ref: this._resizeContainer,
      className: bodyClasses
    }, /*#__PURE__*/React.createElement(LeftPanel, {
      resizeNotifier: this.props.resizeNotifier,
      collapsed: this.props.collapseLhs || false,
      disabled: this.props.leftDisabled
    }), /*#__PURE__*/React.createElement(_ResizeHandle.default, null), pageElement))));
  }

}

(0, _defineProperty2.default)(LoggedInView, "displayName", 'LoggedInView');
(0, _defineProperty2.default)(LoggedInView, "propTypes", {
  matrixClient: PropTypes.instanceOf(_client.MatrixClient).isRequired,
  page_type: PropTypes.string.isRequired,
  onRoomCreated: PropTypes.func,
  // Called with the credentials of a registered user (if they were a ROU that
  // transitioned to PWLU)
  onRegistered: PropTypes.func,
  // Used by the RoomView to handle joining rooms
  viaServers: PropTypes.arrayOf(PropTypes.string) // and lots and lots of other stuff.

});
var _default = LoggedInView;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvTG9nZ2VkSW5WaWV3LnRzeCJdLCJuYW1lcyI6WyJNQVhfUElOTkVEX05PVElDRVNfUEVSX1JPT00iLCJjYW5FbGVtZW50UmVjZWl2ZUlucHV0IiwiZWwiLCJ0YWdOYW1lIiwiZ2V0QXR0cmlidXRlIiwiTG9nZ2VkSW5WaWV3IiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsImNvbnRleHQiLCJyb29tSWQiLCJfcm9vbVZpZXciLCJjdXJyZW50IiwiY2FuUmVzZXRUaW1lbGluZSIsInNldFN0YXRlIiwidXNlckhhc0dlbmVyYXRlZFBhc3N3b3JkIiwiQm9vbGVhbiIsIl9zZXNzaW9uU3RvcmUiLCJnZXRDYWNoZWRQYXNzd29yZCIsImV2ZW50IiwiZ2V0VHlwZSIsInVzZUNvbXBhY3RMYXlvdXQiLCJnZXRDb250ZW50IiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJzeW5jU3RhdGUiLCJvbGRTeW5jU3RhdGUiLCJkYXRhIiwib2xkRXJyQ29kZSIsInN0YXRlIiwic3luY0Vycm9yRGF0YSIsImVycm9yIiwiZXJyY29kZSIsIm5ld0VyckNvZGUiLCJfdXBkYXRlU2VydmVyTm90aWNlRXZlbnRzIiwiZXYiLCJyb29tTGlzdHMiLCJSb29tTGlzdFN0b3JlIiwiZ2V0Um9vbUxpc3RzIiwic29tZSIsInIiLCJnZXRSb29tSWQiLCJwaW5uZWRFdmVudHMiLCJyb29tIiwicGluU3RhdGVFdmVudCIsImN1cnJlbnRTdGF0ZSIsImdldFN0YXRlRXZlbnRzIiwicGlubmVkIiwicGlubmVkRXZlbnRJZHMiLCJzbGljZSIsImV2ZW50SWQiLCJ0aW1lbGluZSIsIl9tYXRyaXhDbGllbnQiLCJnZXRFdmVudFRpbWVsaW5lIiwiZ2V0VW5maWx0ZXJlZFRpbWVsaW5lU2V0IiwiZ2V0RXZlbnRzIiwiZmluZCIsImdldElkIiwicHVzaCIsInNlcnZlck5vdGljZUV2ZW50cyIsImNhblJlY2VpdmVJbnB1dCIsImVsZW1lbnQiLCJ0YXJnZXQiLCJwYXJlbnRFbGVtZW50IiwiX29uS2V5RG93biIsImRvY3VtZW50IiwiYm9keSIsImhhbmRsZWQiLCJjdHJsQ21kT25seSIsImhhc01vZGlmaWVyIiwiYWx0S2V5IiwiY3RybEtleSIsIm1ldGFLZXkiLCJzaGlmdEtleSIsImlzTW9kaWZpZXIiLCJrZXkiLCJLZXkiLCJBTFQiLCJDT05UUk9MIiwiTUVUQSIsIlNISUZUIiwiUEFHRV9VUCIsIlBBR0VfRE9XTiIsIl9vblNjcm9sbEtleVByZXNzZWQiLCJIT01FIiwiRU5EIiwiSyIsIkJBQ0tUSUNLIiwiU0xBU0giLCJLZXlib2FyZFNob3J0Y3V0cyIsInRvZ2dsZURpYWxvZyIsIkFSUk9XX1VQIiwiQVJST1dfRE9XTiIsImRlbHRhIiwidW5yZWFkIiwiUEVSSU9EIiwicGFnZV90eXBlIiwidHlwZSIsIlBsYXRmb3JtUGVnIiwiZ2V0Iiwib25LZXlEb3duIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJpc0NsaWNrU2hvcnRjdXQiLCJTUEFDRSIsIkVOVEVSIiwiQ09OVEVYVF9NRU5VIiwiVEFCIiwiaGFuZGxlU2Nyb2xsS2V5IiwicmVzdWx0IiwiZGVzdGluYXRpb24iLCJkZXN0IiwiZHJvcHBhYmxlSWQiLCJkcmFnZ2FibGVJZCIsInNwbGl0IiwicG9wIiwiVGFnT3JkZXJBY3Rpb25zIiwibW92ZVRhZyIsImluZGV4Iiwic3RhcnRzV2l0aCIsIl9vblJvb21UaWxlRW5kRHJhZyIsIm5ld1RhZyIsInByZXZUYWciLCJzb3VyY2UiLCJ1bmRlZmluZWQiLCJvbGRJbmRleCIsIm5ld0luZGV4IiwiUm9vbUxpc3RBY3Rpb25zIiwidGFnUm9vbSIsImdldFJvb20iLCJsZWZ0RGlzYWJsZWQiLCJyaWdodERpc2FibGVkIiwidGFyZ2V0Q2xhc3NlcyIsIlNldCIsImNsYXNzTmFtZSIsImhhcyIsIm1vdXNlRG93biIsIngiLCJwYWdlWCIsInkiLCJwYWdlWSIsImRlbHRhWCIsImRlbHRhWSIsImRpc3RhbmNlIiwiTWF0aCIsInNxcnQiLCJtYXhSYWRpdXMiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJtYXRyaXhDbGllbnQiLCJDYWxsTWVkaWFIYW5kbGVyIiwibG9hZERldmljZXMiLCJhZGRFdmVudExpc3RlbmVyIiwiX29uTmF0aXZlS2V5RG93biIsInNlc3Npb25TdG9yZSIsIl9zZXNzaW9uU3RvcmVUb2tlbiIsImFkZExpc3RlbmVyIiwiX3NldFN0YXRlRnJvbVNlc3Npb25TdG9yZSIsIm9uIiwib25BY2NvdW50RGF0YSIsIm9uU3luYyIsIm9uUm9vbVN0YXRlRXZlbnRzIiwiY3JlYXRlUmVmIiwiX3Jlc2l6ZUNvbnRhaW5lciIsImNvbXBvbmVudERpZE1vdW50IiwicmVzaXplciIsIl9jcmVhdGVSZXNpemVyIiwiYXR0YWNoIiwiX2xvYWRSZXNpemVyUHJlZmVyZW5jZXMiLCJjb21wb25lbnREaWRVcGRhdGUiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJzaG93Q29va2llQmFyIiwiaGFzTmV3VmVyc2lvbiIsInNob3dOb3RpZmllclRvb2xiYXIiLCJyZXNpemVOb3RpZmllciIsIm5vdGlmeUJhbm5lcnNDaGFuZ2VkIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJyZW1vdmUiLCJkZXRhY2giLCJzaG91bGRDb21wb25lbnRVcGRhdGUiLCJNYXRyaXhDbGllbnRQZWciLCJjbGFzc05hbWVzIiwiaGFuZGxlIiwidmVydGljYWwiLCJyZXZlcnNlIiwiY29sbGFwc2VDb25maWciLCJ0b2dnbGVTaXplIiwib25Db2xsYXBzZWQiLCJjb2xsYXBzZWQiLCJ3aW5kb3ciLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwib25SZXNpemVkIiwic2l6ZSIsIm5vdGlmeUxlZnRIYW5kbGVSZXNpemVkIiwiUmVzaXplciIsIkNvbGxhcHNlRGlzdHJpYnV0b3IiLCJzZXRDbGFzc05hbWVzIiwibGhzU2l6ZSIsInBhcnNlSW50IiwiZ2V0SXRlbSIsImlzTmFOIiwiZm9ySGFuZGxlQXQiLCJyZXNpemUiLCJyZW5kZXIiLCJMZWZ0UGFuZWwiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJSb29tVmlldyIsIlVzZXJWaWV3IiwiR3JvdXBWaWV3IiwiTXlHcm91cHMiLCJUb2FzdENvbnRhaW5lciIsIk1hdHJpeFRvb2xiYXIiLCJDb29raWVCYXIiLCJOZXdWZXJzaW9uQmFyIiwiVXBkYXRlQ2hlY2tCYXIiLCJQYXNzd29yZE5hZ0JhciIsIlNlcnZlckxpbWl0QmFyIiwiTmF2QmFyIiwicGFnZUVsZW1lbnQiLCJQYWdlVHlwZXMiLCJhdXRvSm9pbiIsIm9uUmVnaXN0ZXJlZCIsInRoaXJkUGFydHlJbnZpdGUiLCJyb29tT29iRGF0YSIsInZpYVNlcnZlcnMiLCJpbml0aWFsRXZlbnRQaXhlbE9mZnNldCIsImN1cnJlbnRSb29tSWQiLCJtaWRkbGVEaXNhYmxlZCIsIkNvbmZlcmVuY2VIYW5kbGVyIiwiUm9vbURpcmVjdG9yeSIsIkhvbWVQYWdlIiwiY3VycmVudFVzZXJJZCIsImN1cnJlbnRHcm91cElkIiwiY3VycmVudEdyb3VwSXNOZXciLCJ1c2FnZUxpbWl0RXZlbnQiLCJlIiwidG9wQmFyIiwiYWRtaW5fY29udGFjdCIsImxpbWl0X3R5cGUiLCJjb25maWciLCJwaXdpayIsIm5hdmlnYXRvciIsImRvTm90VHJhY2siLCJwb2xpY3lVcmwiLCJ2ZXJzaW9uIiwibmV3VmVyc2lvbiIsIm5ld1ZlcnNpb25SZWxlYXNlTm90ZXMiLCJjaGVja2luZ0ZvclVwZGF0ZSIsImJvZHlDbGFzc2VzIiwiX29uUGFzdGUiLCJfb25SZWFjdEtleURvd24iLCJoaWRlVG9TUlVzZXJzIiwiX29uTW91c2VEb3duIiwiX29uTW91c2VVcCIsIl9vbkRyYWdFbmQiLCJjb2xsYXBzZUxocyIsIlByb3BUeXBlcyIsImluc3RhbmNlT2YiLCJNYXRyaXhDbGllbnQiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwib25Sb29tQ3JlYXRlZCIsImZ1bmMiLCJhcnJheU9m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O0FBTUksTUFBQSxTQUFTLEVBQUUsS0FBS0M7QUFOcEIsb0JBUUksb0JBQUMsTUFBRCxPQVJKLEVBU01qQixNQVROLGVBVUksb0JBQUMsY0FBRCxPQVZKLGVBV0ksb0JBQUMsa0NBQUQ7QUFBaUIsTUFBQSxTQUFTLEVBQUUsS0FBS2tCO0FBQWpDLG9CQUNJO0FBQUssTUFBQSxHQUFHLEVBQUUsS0FBS2hHLGdCQUFmO0FBQWlDLE1BQUEsU0FBUyxFQUFFMEY7QUFBNUMsb0JBQ0ksb0JBQUMsU0FBRDtBQUNJLE1BQUEsY0FBYyxFQUFFLEtBQUt0UCxLQUFMLENBQVd3SyxjQUQvQjtBQUVJLE1BQUEsU0FBUyxFQUFFLEtBQUt4SyxLQUFMLENBQVc2UCxXQUFYLElBQTBCLEtBRnpDO0FBR0ksTUFBQSxRQUFRLEVBQUUsS0FBSzdQLEtBQUwsQ0FBVzJIO0FBSHpCLE1BREosZUFNSSxvQkFBQyxxQkFBRCxPQU5KLEVBT002RixXQVBOLENBREosQ0FYSixDQURKLENBREo7QUEyQkg7O0FBdG1CMEQ7OzhCQUF6RDVOLFksaUJBQ21CLGM7OEJBRG5CQSxZLGVBR2lCO0FBQ2ZrSixFQUFBQSxZQUFZLEVBQUVnSCxTQUFTLENBQUNDLFVBQVYsQ0FBcUJDLG9CQUFyQixFQUFtQ0MsVUFEbEM7QUFFZnhLLEVBQUFBLFNBQVMsRUFBRXFLLFNBQVMsQ0FBQ0ksTUFBVixDQUFpQkQsVUFGYjtBQUdmRSxFQUFBQSxhQUFhLEVBQUVMLFNBQVMsQ0FBQ00sSUFIVjtBQUtmO0FBQ0E7QUFDQXpDLEVBQUFBLFlBQVksRUFBRW1DLFNBQVMsQ0FBQ00sSUFQVDtBQVNmO0FBQ0F0QyxFQUFBQSxVQUFVLEVBQUVnQyxTQUFTLENBQUNPLE9BQVYsQ0FBa0JQLFNBQVMsQ0FBQ0ksTUFBNUIsQ0FWRyxDQVlmOztBQVplLEM7ZUFzbUJSdFEsWSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4LCAyMDIwIE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHsgTWF0cml4Q2xpZW50IH0gZnJvbSAnbWF0cml4LWpzLXNkay9zcmMvY2xpZW50JztcbmltcG9ydCB7IE1hdHJpeEV2ZW50IH0gZnJvbSAnbWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL2V2ZW50JztcbmltcG9ydCB7IERyYWdEcm9wQ29udGV4dCB9IGZyb20gJ3JlYWN0LWJlYXV0aWZ1bC1kbmQnO1xuXG5pbXBvcnQge0tleSwgaXNPbmx5Q3RybE9yQ21kS2V5RXZlbnQsIGlzT25seUN0cmxPckNtZElnbm9yZVNoaWZ0S2V5RXZlbnR9IGZyb20gJy4uLy4uL0tleWJvYXJkJztcbmltcG9ydCBQYWdlVHlwZXMgZnJvbSAnLi4vLi4vUGFnZVR5cGVzJztcbmltcG9ydCBDYWxsTWVkaWFIYW5kbGVyIGZyb20gJy4uLy4uL0NhbGxNZWRpYUhhbmRsZXInO1xuaW1wb3J0IHsgZml4dXBDb2xvckZvbnRzIH0gZnJvbSAnLi4vLi4vdXRpbHMvRm9udE1hbmFnZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uL2luZGV4JztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCBzZXNzaW9uU3RvcmUgZnJvbSAnLi4vLi4vc3RvcmVzL1Nlc3Npb25TdG9yZSc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZywgTWF0cml4Q2xpZW50Q3JlZHN9IGZyb20gJy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IFJvb21MaXN0U3RvcmUgZnJvbSBcIi4uLy4uL3N0b3Jlcy9Sb29tTGlzdFN0b3JlXCI7XG5cbmltcG9ydCBUYWdPcmRlckFjdGlvbnMgZnJvbSAnLi4vLi4vYWN0aW9ucy9UYWdPcmRlckFjdGlvbnMnO1xuaW1wb3J0IFJvb21MaXN0QWN0aW9ucyBmcm9tICcuLi8uLi9hY3Rpb25zL1Jvb21MaXN0QWN0aW9ucyc7XG5pbXBvcnQgUmVzaXplSGFuZGxlIGZyb20gJy4uL3ZpZXdzL2VsZW1lbnRzL1Jlc2l6ZUhhbmRsZSc7XG5pbXBvcnQge1Jlc2l6ZXIsIENvbGxhcHNlRGlzdHJpYnV0b3J9IGZyb20gJy4uLy4uL3Jlc2l6ZXInO1xuaW1wb3J0IE1hdHJpeENsaWVudENvbnRleHQgZnJvbSBcIi4uLy4uL2NvbnRleHRzL01hdHJpeENsaWVudENvbnRleHRcIjtcbmltcG9ydCAqIGFzIEtleWJvYXJkU2hvcnRjdXRzIGZyb20gXCIuLi8uLi9hY2Nlc3NpYmlsaXR5L0tleWJvYXJkU2hvcnRjdXRzXCI7XG5pbXBvcnQgSG9tZVBhZ2UgZnJvbSBcIi4vSG9tZVBhZ2VcIjtcbmltcG9ydCBOYXZCYXIgZnJvbSBcIi4uL3ZpZXdzL2VsZW1lbnRzL05hdkJhclwiXG5pbXBvcnQgUmVzaXplTm90aWZpZXIgZnJvbSBcIi4uLy4uL3V0aWxzL1Jlc2l6ZU5vdGlmaWVyXCI7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSBcIi4uLy4uL1BsYXRmb3JtUGVnXCI7XG4vLyBXZSBuZWVkIHRvIGZldGNoIGVhY2ggcGlubmVkIG1lc3NhZ2UgaW5kaXZpZHVhbGx5IChpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgaXQpXG4vLyBzbyBlYWNoIHBpbm5lZCBtZXNzYWdlIG1heSB0cmlnZ2VyIGEgcmVxdWVzdC4gTGltaXQgdGhlIG51bWJlciBwZXIgcm9vbSBmb3Igc2FuaXR5LlxuLy8gTkIuIHRoaXMgaXMganVzdCBmb3Igc2VydmVyIG5vdGljZXMgcmF0aGVyIHRoYW4gcGlubmVkIG1lc3NhZ2VzIGluIGdlbmVyYWwuXG5jb25zdCBNQVhfUElOTkVEX05PVElDRVNfUEVSX1JPT00gPSAyO1xuXG5mdW5jdGlvbiBjYW5FbGVtZW50UmVjZWl2ZUlucHV0KGVsKSB7XG4gICAgcmV0dXJuIGVsLnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fFxuICAgICAgICBlbC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIgfHxcbiAgICAgICAgZWwudGFnTmFtZSA9PT0gXCJTRUxFQ1RcIiB8fFxuICAgICAgICAhIWVsLmdldEF0dHJpYnV0ZShcImNvbnRlbnRlZGl0YWJsZVwiKTtcbn1cblxuaW50ZXJmYWNlIElQcm9wcyB7XG4gICAgbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnQ7XG4gICAgb25SZWdpc3RlcmVkOiAoY3JlZGVudGlhbHM6IE1hdHJpeENsaWVudENyZWRzKSA9PiBQcm9taXNlPE1hdHJpeENsaWVudD47XG4gICAgdmlhU2VydmVycz86IHN0cmluZ1tdO1xuICAgIGhpZGVUb1NSVXNlcnM6IGJvb2xlYW47XG4gICAgcmVzaXplTm90aWZpZXI6IFJlc2l6ZU5vdGlmaWVyO1xuICAgIG1pZGRsZURpc2FibGVkOiBib29sZWFuO1xuICAgIGluaXRpYWxFdmVudFBpeGVsT2Zmc2V0OiBudW1iZXI7XG4gICAgbGVmdERpc2FibGVkOiBib29sZWFuO1xuICAgIHJpZ2h0RGlzYWJsZWQ6IGJvb2xlYW47XG4gICAgc2hvd0Nvb2tpZUJhcjogYm9vbGVhbjtcbiAgICBoYXNOZXdWZXJzaW9uOiBib29sZWFuO1xuICAgIHVzZXJIYXNHZW5lcmF0ZWRQYXNzd29yZDogYm9vbGVhbjtcbiAgICBzaG93Tm90aWZpZXJUb29sYmFyOiBib29sZWFuO1xuICAgIHBhZ2VfdHlwZTogc3RyaW5nO1xuICAgIGF1dG9Kb2luOiBib29sZWFuO1xuICAgIHRoaXJkUGFydHlJbnZpdGU/OiBvYmplY3Q7XG4gICAgcm9vbU9vYkRhdGE/OiBvYmplY3Q7XG4gICAgY3VycmVudFJvb21JZDogc3RyaW5nO1xuICAgIENvbmZlcmVuY2VIYW5kbGVyPzogb2JqZWN0O1xuICAgIGNvbGxhcHNlTGhzOiBib29sZWFuO1xuICAgIGNoZWNraW5nRm9yVXBkYXRlOiBib29sZWFuO1xuICAgIGNvbmZpZzoge1xuICAgICAgICBwaXdpazoge1xuICAgICAgICAgICAgcG9saWN5VXJsOiBzdHJpbmc7XG4gICAgICAgIH0sXG4gICAgICAgIFtrZXk6IHN0cmluZ106IGFueSxcbiAgICB9O1xuICAgIGN1cnJlbnRVc2VySWQ/OiBzdHJpbmc7XG4gICAgY3VycmVudEdyb3VwSWQ/OiBzdHJpbmc7XG4gICAgY3VycmVudEdyb3VwSXNOZXc/OiBib29sZWFuO1xuICAgIHZlcnNpb24/OiBzdHJpbmc7XG4gICAgbmV3VmVyc2lvbj86IHN0cmluZztcbiAgICBuZXdWZXJzaW9uUmVsZWFzZU5vdGVzPzogc3RyaW5nO1xufVxuaW50ZXJmYWNlIElTdGF0ZSB7XG4gICAgbW91c2VEb3duPzoge1xuICAgICAgICB4OiBudW1iZXI7XG4gICAgICAgIHk6IG51bWJlcjtcbiAgICB9O1xuICAgIHN5bmNFcnJvckRhdGE6IGFueTtcbiAgICB1c2VDb21wYWN0TGF5b3V0OiBib29sZWFuO1xuICAgIHNlcnZlck5vdGljZUV2ZW50czogTWF0cml4RXZlbnRbXTtcbiAgICB1c2VySGFzR2VuZXJhdGVkUGFzc3dvcmQ6IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGhpcyBpcyB3aGF0IG91ciBNYXRyaXhDaGF0IHNob3dzIHdoZW4gd2UgYXJlIGxvZ2dlZCBpbi4gVGhlIHByZWNpc2UgdmlldyBpc1xuICogZGV0ZXJtaW5lZCBieSB0aGUgcGFnZV90eXBlIHByb3BlcnR5LlxuICpcbiAqIEN1cnJlbnRseSBpdCdzIHZlcnkgdGlnaHRseSBjb3VwbGVkIHdpdGggTWF0cml4Q2hhdC4gV2Ugc2hvdWxkIHRyeSB0byBkb1xuICogc29tZXRoaW5nIGFib3V0IHRoYXQuXG4gKlxuICogQ29tcG9uZW50cyBtb3VudGVkIGJlbG93IHVzIGNhbiBhY2Nlc3MgdGhlIG1hdHJpeCBjbGllbnQgdmlhIHRoZSByZWFjdCBjb250ZXh0LlxuICovXG5jbGFzcyBMb2dnZWRJblZpZXcgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50PElQcm9wcywgSVN0YXRlPiB7XG4gICAgc3RhdGljIGRpc3BsYXlOYW1lID0gJ0xvZ2dlZEluVmlldyc7XG5cbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBtYXRyaXhDbGllbnQ6IFByb3BUeXBlcy5pbnN0YW5jZU9mKE1hdHJpeENsaWVudCkuaXNSZXF1aXJlZCxcbiAgICAgICAgcGFnZV90eXBlOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uUm9vbUNyZWF0ZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIENhbGxlZCB3aXRoIHRoZSBjcmVkZW50aWFscyBvZiBhIHJlZ2lzdGVyZWQgdXNlciAoaWYgdGhleSB3ZXJlIGEgUk9VIHRoYXRcbiAgICAgICAgLy8gdHJhbnNpdGlvbmVkIHRvIFBXTFUpXG4gICAgICAgIG9uUmVnaXN0ZXJlZDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gVXNlZCBieSB0aGUgUm9vbVZpZXcgdG8gaGFuZGxlIGpvaW5pbmcgcm9vbXNcbiAgICAgICAgdmlhU2VydmVyczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZyksXG5cbiAgICAgICAgLy8gYW5kIGxvdHMgYW5kIGxvdHMgb2Ygb3RoZXIgc3R1ZmYuXG4gICAgfTtcblxuICAgIHByb3RlY3RlZCByZWFkb25seSBfbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnQ7XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9yb29tVmlldzogUmVhY3QuUmVmT2JqZWN0PGFueT47XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9yZXNpemVDb250YWluZXI6IFJlYWN0LlJlZk9iamVjdDxSZXNpemVIYW5kbGU+O1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfc2Vzc2lvblN0b3JlOiBzZXNzaW9uU3RvcmU7XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9zZXNzaW9uU3RvcmVUb2tlbjogeyByZW1vdmU6ICgpID0+IHZvaWQgfTtcbiAgICBwcm90ZWN0ZWQgcmVzaXplcjogUmVzaXplcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzLCBjb250ZXh0KSB7XG4gICAgICAgIHN1cGVyKHByb3BzLCBjb250ZXh0KTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbW91c2VEb3duOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBzeW5jRXJyb3JEYXRhOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB1c2VySGFzR2VuZXJhdGVkUGFzc3dvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgLy8gdXNlIGNvbXBhY3QgdGltZWxpbmUgdmlld1xuICAgICAgICAgICAgdXNlQ29tcGFjdExheW91dDogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZSgndXNlQ29tcGFjdExheW91dCcpLFxuICAgICAgICAgICAgLy8gYW55IGN1cnJlbnRseSBhY3RpdmUgc2VydmVyIG5vdGljZSBldmVudHNcbiAgICAgICAgICAgIHNlcnZlck5vdGljZUV2ZW50czogW10sXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3Rhc2ggdGhlIE1hdHJpeENsaWVudCBpbiBjYXNlIHdlIGxvZyBvdXQgYmVmb3JlIHdlIGFyZSB1bm1vdW50ZWRcbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50ID0gdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQ7XG5cbiAgICAgICAgQ2FsbE1lZGlhSGFuZGxlci5sb2FkRGV2aWNlcygpO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbk5hdGl2ZUtleURvd24sIGZhbHNlKTtcblxuICAgICAgICB0aGlzLl9zZXNzaW9uU3RvcmUgPSBzZXNzaW9uU3RvcmU7XG4gICAgICAgIHRoaXMuX3Nlc3Npb25TdG9yZVRva2VuID0gdGhpcy5fc2Vzc2lvblN0b3JlLmFkZExpc3RlbmVyKFxuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGVGcm9tU2Vzc2lvblN0b3JlLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLl9zZXRTdGF0ZUZyb21TZXNzaW9uU3RvcmUoKTtcblxuICAgICAgICB0aGlzLl91cGRhdGVTZXJ2ZXJOb3RpY2VFdmVudHMoKTtcblxuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQub24oXCJhY2NvdW50RGF0YVwiLCB0aGlzLm9uQWNjb3VudERhdGEpO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQub24oXCJzeW5jXCIsIHRoaXMub25TeW5jKTtcbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50Lm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcblxuICAgICAgICBmaXh1cENvbG9yRm9udHMoKTtcblxuICAgICAgICB0aGlzLl9yb29tVmlldyA9IFJlYWN0LmNyZWF0ZVJlZigpO1xuICAgICAgICB0aGlzLl9yZXNpemVDb250YWluZXIgPSBSZWFjdC5jcmVhdGVSZWYoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVyID0gdGhpcy5fY3JlYXRlUmVzaXplcigpO1xuICAgICAgICB0aGlzLnJlc2l6ZXIuYXR0YWNoKCk7XG4gICAgICAgIHRoaXMuX2xvYWRSZXNpemVyUHJlZmVyZW5jZXMoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgLy8gYXR0ZW1wdCB0byBndWVzcyB3aGVuIGEgYmFubmVyIHdhcyBvcGVuZWQgb3IgY2xvc2VkXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIChwcmV2UHJvcHMuc2hvd0Nvb2tpZUJhciAhPT0gdGhpcy5wcm9wcy5zaG93Q29va2llQmFyKSB8fFxuICAgICAgICAgICAgKHByZXZQcm9wcy5oYXNOZXdWZXJzaW9uICE9PSB0aGlzLnByb3BzLmhhc05ld1ZlcnNpb24pIHx8XG4gICAgICAgICAgICAocHJldlN0YXRlLnVzZXJIYXNHZW5lcmF0ZWRQYXNzd29yZCAhPT0gdGhpcy5zdGF0ZS51c2VySGFzR2VuZXJhdGVkUGFzc3dvcmQpIHx8XG4gICAgICAgICAgICAocHJldlByb3BzLnNob3dOb3RpZmllclRvb2xiYXIgIT09IHRoaXMucHJvcHMuc2hvd05vdGlmaWVyVG9vbGJhcilcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyLm5vdGlmeUJhbm5lcnNDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uTmF0aXZlS2V5RG93biwgZmFsc2UpO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJhY2NvdW50RGF0YVwiLCB0aGlzLm9uQWNjb3VudERhdGEpO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJzeW5jXCIsIHRoaXMub25TeW5jKTtcbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICAgICAgaWYgKHRoaXMuX3Nlc3Npb25TdG9yZVRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXNzaW9uU3RvcmVUb2tlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlc2l6ZXIuZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgLy8gQ2hpbGQgY29tcG9uZW50cyBhc3N1bWUgdGhhdCB0aGUgY2xpZW50IHBlZyB3aWxsIG5vdCBiZSBudWxsLCBzbyBnaXZlIHRoZW0gc29tZVxuICAgIC8vIHNvcnQgb2YgYXNzdXJhbmNlIGhlcmUgYnkgb25seSBhbGxvd2luZyBhIHJlLXJlbmRlciBpZiB0aGUgY2xpZW50IGlzIHRydXRoeS5cbiAgICAvL1xuICAgIC8vIFRoaXMgaXMgcmVxdWlyZWQgYmVjYXVzZSBgTG9nZ2VkSW5WaWV3YCBtYWludGFpbnMgaXRzIG93biBzdGF0ZSBhbmQgaWYgdGhpcyBzdGF0ZVxuICAgIC8vIHVwZGF0ZXMgYWZ0ZXIgdGhlIGNsaWVudCBwZWcgaGFzIGJlZW4gbWFkZSBudWxsIChkdXJpbmcgbG9nb3V0KSwgdGhlbiBpdCB3aWxsXG4gICAgLy8gYXR0ZW1wdCB0byByZS1yZW5kZXIgYW5kIHRoZSBjaGlsZHJlbiB3aWxsIHRocm93IGVycm9ycy5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUoKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKE1hdHJpeENsaWVudFBlZy5nZXQoKSk7XG4gICAgfVxuXG4gICAgY2FuUmVzZXRUaW1lbGluZUluUm9vbSA9IChyb29tSWQpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLl9yb29tVmlldy5jdXJyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcm9vbVZpZXcuY3VycmVudC5jYW5SZXNldFRpbWVsaW5lKCk7XG4gICAgfTtcblxuICAgIF9zZXRTdGF0ZUZyb21TZXNzaW9uU3RvcmUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdXNlckhhc0dlbmVyYXRlZFBhc3N3b3JkOiBCb29sZWFuKHRoaXMuX3Nlc3Npb25TdG9yZS5nZXRDYWNoZWRQYXNzd29yZCgpKSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9jcmVhdGVSZXNpemVyKCkge1xuICAgICAgICBjb25zdCBjbGFzc05hbWVzID0ge1xuICAgICAgICAgICAgaGFuZGxlOiBcIm14X1Jlc2l6ZUhhbmRsZVwiLFxuICAgICAgICAgICAgdmVydGljYWw6IFwibXhfUmVzaXplSGFuZGxlX3ZlcnRpY2FsXCIsXG4gICAgICAgICAgICByZXZlcnNlOiBcIm14X1Jlc2l6ZUhhbmRsZV9yZXZlcnNlXCIsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGNvbGxhcHNlQ29uZmlnID0ge1xuICAgICAgICAgICAgdG9nZ2xlU2l6ZTogMjYwIC0gNTAsXG4gICAgICAgICAgICBvbkNvbGxhcHNlZDogKGNvbGxhcHNlZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2xsYXBzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246IFwiaGlkZV9sZWZ0X3BhbmVsXCJ9LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfbGhzX3NpemVcIiwgJzAnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogXCJzaG93X2xlZnRfcGFuZWxcIn0sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJlc2l6ZWQ6IChzaXplKSA9PiB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfbGhzX3NpemVcIiwgJycgKyBzaXplKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyLm5vdGlmeUxlZnRIYW5kbGVSZXNpemVkKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZXNpemVyID0gbmV3IFJlc2l6ZXIoXG4gICAgICAgICAgICB0aGlzLl9yZXNpemVDb250YWluZXIuY3VycmVudCxcbiAgICAgICAgICAgIENvbGxhcHNlRGlzdHJpYnV0b3IsXG4gICAgICAgICAgICBjb2xsYXBzZUNvbmZpZyk7XG4gICAgICAgIHJlc2l6ZXIuc2V0Q2xhc3NOYW1lcyhjbGFzc05hbWVzKTtcbiAgICAgICAgcmV0dXJuIHJlc2l6ZXI7XG4gICAgfVxuXG4gICAgX2xvYWRSZXNpemVyUHJlZmVyZW5jZXMoKSB7XG4gICAgICAgIGxldCBsaHNTaXplID0gcGFyc2VJbnQod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibXhfbGhzX3NpemVcIiksIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKGxoc1NpemUpKSB7XG4gICAgICAgICAgICBsaHNTaXplID0gMzUwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVzaXplci5mb3JIYW5kbGVBdCgwKS5yZXNpemUobGhzU2l6ZSk7XG4gICAgfVxuXG4gICAgb25BY2NvdW50RGF0YSA9IChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuZ2V0VHlwZSgpID09PSBcImltLnZlY3Rvci53ZWIuc2V0dGluZ3NcIikge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdXNlQ29tcGFjdExheW91dDogZXZlbnQuZ2V0Q29udGVudCgpLnVzZUNvbXBhY3RMYXlvdXQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuZ2V0VHlwZSgpID09PSBcIm0uaWdub3JlZF91c2VyX2xpc3RcIikge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246IFwiaWdub3JlX3N0YXRlX2NoYW5nZWRcIn0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uU3luYyA9IChzeW5jU3RhdGUsIG9sZFN5bmNTdGF0ZSwgZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBvbGRFcnJDb2RlID0gKFxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zeW5jRXJyb3JEYXRhICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN5bmNFcnJvckRhdGEuZXJyb3IgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc3luY0Vycm9yRGF0YS5lcnJvci5lcnJjb2RlXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IG5ld0VyckNvZGUgPSBkYXRhICYmIGRhdGEuZXJyb3IgJiYgZGF0YS5lcnJvci5lcnJjb2RlO1xuICAgICAgICBpZiAoc3luY1N0YXRlID09PSBvbGRTeW5jU3RhdGUgJiYgb2xkRXJyQ29kZSA9PT0gbmV3RXJyQ29kZSkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChzeW5jU3RhdGUgPT09ICdFUlJPUicpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHN5bmNFcnJvckRhdGE6IGRhdGEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHN5bmNFcnJvckRhdGE6IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvbGRTeW5jU3RhdGUgPT09ICdQUkVQQVJFRCcgJiYgc3luY1N0YXRlID09PSAnU1lOQ0lORycpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlcnZlck5vdGljZUV2ZW50cygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uUm9vbVN0YXRlRXZlbnRzID0gKGV2LCBzdGF0ZSkgPT4ge1xuICAgICAgICBjb25zdCByb29tTGlzdHMgPSBSb29tTGlzdFN0b3JlLmdldFJvb21MaXN0cygpO1xuICAgICAgICBpZiAocm9vbUxpc3RzWydtLnNlcnZlcl9ub3RpY2UnXSAmJiByb29tTGlzdHNbJ20uc2VydmVyX25vdGljZSddLnNvbWUociA9PiByLnJvb21JZCA9PT0gZXYuZ2V0Um9vbUlkKCkpKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVTZXJ2ZXJOb3RpY2VFdmVudHMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBfdXBkYXRlU2VydmVyTm90aWNlRXZlbnRzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByb29tTGlzdHMgPSBSb29tTGlzdFN0b3JlLmdldFJvb21MaXN0cygpO1xuICAgICAgICBpZiAoIXJvb21MaXN0c1snbS5zZXJ2ZXJfbm90aWNlJ10pIHJldHVybiBbXTtcblxuICAgICAgICBjb25zdCBwaW5uZWRFdmVudHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCByb29tIG9mIHJvb21MaXN0c1snbS5zZXJ2ZXJfbm90aWNlJ10pIHtcbiAgICAgICAgICAgIGNvbnN0IHBpblN0YXRlRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5waW5uZWRfZXZlbnRzXCIsIFwiXCIpO1xuXG4gICAgICAgICAgICBpZiAoIXBpblN0YXRlRXZlbnQgfHwgIXBpblN0YXRlRXZlbnQuZ2V0Q29udGVudCgpLnBpbm5lZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHBpbm5lZEV2ZW50SWRzID0gcGluU3RhdGVFdmVudC5nZXRDb250ZW50KCkucGlubmVkLnNsaWNlKDAsIE1BWF9QSU5ORURfTk9USUNFU19QRVJfUk9PTSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGV2ZW50SWQgb2YgcGlubmVkRXZlbnRJZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lbGluZSA9IGF3YWl0IHRoaXMuX21hdHJpeENsaWVudC5nZXRFdmVudFRpbWVsaW5lKHJvb20uZ2V0VW5maWx0ZXJlZFRpbWVsaW5lU2V0KCksIGV2ZW50SWQsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGltZWxpbmUuZ2V0RXZlbnRzKCkuZmluZChldiA9PiBldi5nZXRJZCgpID09PSBldmVudElkKTtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQpIHBpbm5lZEV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlcnZlck5vdGljZUV2ZW50czogcGlubmVkRXZlbnRzLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uUGFzdGUgPSAoZXYpID0+IHtcbiAgICAgICAgbGV0IGNhblJlY2VpdmVJbnB1dCA9IGZhbHNlO1xuICAgICAgICBsZXQgZWxlbWVudCA9IGV2LnRhcmdldDtcbiAgICAgICAgLy8gdGVzdCBmb3IgYWxsIHBhcmVudHMgYmVjYXVzZSB0aGUgdGFyZ2V0IGNhbiBiZSBhIGNoaWxkIG9mIGEgY29udGVudGVkaXRhYmxlIGVsZW1lbnRcbiAgICAgICAgd2hpbGUgKCFjYW5SZWNlaXZlSW5wdXQgJiYgZWxlbWVudCkge1xuICAgICAgICAgICAgY2FuUmVjZWl2ZUlucHV0ID0gY2FuRWxlbWVudFJlY2VpdmVJbnB1dChlbGVtZW50KTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjYW5SZWNlaXZlSW5wdXQpIHtcbiAgICAgICAgICAgIC8vIHJlZm9jdXNpbmcgZHVyaW5nIGEgcGFzdGUgZXZlbnQgd2lsbCBtYWtlIHRoZVxuICAgICAgICAgICAgLy8gcGFzdGUgZW5kIHVwIGluIHRoZSBuZXdseSBmb2N1c2VkIGVsZW1lbnQsXG4gICAgICAgICAgICAvLyBzbyBkaXNwYXRjaCBzeW5jaHJvbm91c2x5IGJlZm9yZSBwYXN0ZSBoYXBwZW5zXG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2ZvY3VzX2NvbXBvc2VyJ30sIHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qXG4gICAgU09NRSBIQUNLRVJZIEJFTE9XOlxuICAgIFJlYWN0IG9wdGltaXplcyBldmVudCBoYW5kbGVycywgYnkgYWx3YXlzIGF0dGFjaGluZyBvbmx5IDEgaGFuZGxlciB0byB0aGUgZG9jdW1lbnQgZm9yIGEgZ2l2ZW4gdHlwZS5cbiAgICBJdCB0aGVuIGludGVybmFsbHkgZGV0ZXJtaW5lcyB0aGUgb3JkZXIgaW4gd2hpY2ggUmVhY3QgZXZlbnQgaGFuZGxlcnMgc2hvdWxkIGJlIGNhbGxlZCxcbiAgICBlbXVsYXRpbmcgdGhlIGNhcHR1cmUgYW5kIGJ1YmJsaW5nIHBoYXNlcyB0aGUgRE9NIGFsc28gaGFzLlxuXG4gICAgQnV0LCBhcyB0aGUgbmF0aXZlIGhhbmRsZXIgZm9yIFJlYWN0IGlzIGFsd2F5cyBhdHRhY2hlZCBvbiB0aGUgZG9jdW1lbnQsXG4gICAgaXQgd2lsbCBhbHdheXMgcnVuIGxhc3QgZm9yIGJ1YmJsaW5nIChmaXJzdCBmb3IgY2FwdHVyaW5nKSBoYW5kbGVycyxcbiAgICBhbmQgdGh1cyBSZWFjdCBiYXNpY2FsbHkgaGFzIGl0cyBvd24gZXZlbnQgcGhhc2VzLCBhbmQgd2lsbCBhbHdheXMgcnVuXG4gICAgYWZ0ZXIgKGJlZm9yZSBmb3IgY2FwdHVyaW5nKSBhbnkgbmF0aXZlIG90aGVyIGV2ZW50IGhhbmRsZXJzIChhcyB0aGV5IHRlbmQgdG8gYmUgYXR0YWNoZWQgbGFzdCkuXG5cbiAgICBTbyBpZGVhbGx5IG9uZSB3b3VsZG4ndCBtaXggUmVhY3QgYW5kIG5hdGl2ZSBldmVudCBoYW5kbGVycyB0byBoYXZlIGJ1YmJsaW5nIHdvcmtpbmcgYXMgZXhwZWN0ZWQsXG4gICAgYnV0IHdlIGRvIG5lZWQgYSBuYXRpdmUgZXZlbnQgaGFuZGxlciBoZXJlIG9uIHRoZSBkb2N1bWVudCxcbiAgICB0byBnZXQga2V5ZG93biBldmVudHMgd2hlbiB0aGVyZSBpcyBubyBmb2N1c2VkIGVsZW1lbnQgKHRhcmdldD1ib2R5KS5cblxuICAgIFdlIGFsc28gZG8gbmVlZCBidWJibGluZyBoZXJlIHRvIGdpdmUgY2hpbGQgY29tcG9uZW50cyBhIGNoYW5jZSB0byBjYWxsIGBzdG9wUHJvcGFnYXRpb24oKWAsXG4gICAgZm9yIGtleWRvd24gZXZlbnRzIGl0IGNhbiBoYW5kbGUgaXRzZWxmLCBhbmQgc2hvdWxkbid0IGJlIHJlZGlyZWN0ZWQgdG8gdGhlIGNvbXBvc2VyLlxuXG4gICAgU28gd2UgbGlzdGVuIHdpdGggUmVhY3Qgb24gdGhpcyBjb21wb25lbnQgdG8gZ2V0IGFueSBldmVudHMgb24gZm9jdXNlZCBlbGVtZW50cywgYW5kIGdldCBidWJibGluZyB3b3JraW5nIGFzIGV4cGVjdGVkLlxuICAgIFdlIGFsc28gbGlzdGVuIHdpdGggYSBuYXRpdmUgbGlzdGVuZXIgb24gdGhlIGRvY3VtZW50IHRvIGdldCBrZXlkb3duIGV2ZW50cyB3aGVuIG5vIGVsZW1lbnQgaXMgZm9jdXNlZC5cbiAgICBCdWJibGluZyBpcyBpcnJlbGV2YW50IGhlcmUgYXMgdGhlIHRhcmdldCBpcyB0aGUgYm9keSBlbGVtZW50LlxuICAgICovXG4gICAgX29uUmVhY3RLZXlEb3duID0gKGV2KSA9PiB7XG4gICAgICAgIC8vIGV2ZW50cyBjYXVnaHQgd2hpbGUgYnViYmxpbmcgdXAgb24gdGhlIHJvb3QgZWxlbWVudFxuICAgICAgICAvLyBvZiB0aGlzIGNvbXBvbmVudCwgc28gc29tZXRoaW5nIG11c3QgYmUgZm9jdXNlZC5cbiAgICAgICAgdGhpcy5fb25LZXlEb3duKGV2KTtcbiAgICB9O1xuXG4gICAgX29uTmF0aXZlS2V5RG93biA9IChldikgPT4ge1xuICAgICAgICAvLyBvbmx5IHBhc3MgdGhpcyBpZiB0aGVyZSBpcyBubyBmb2N1c2VkIGVsZW1lbnQuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzLCBfb25LZXlEb3duIHdpbGwgYmUgY2FsbGVkIGJ5IHRoZVxuICAgICAgICAvLyByZWFjdCBrZXlkb3duIGhhbmRsZXIgdGhhdCByZXNwZWN0cyB0aGUgcmVhY3QgYnViYmxpbmcgb3JkZXIuXG4gICAgICAgIGlmIChldi50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMuX29uS2V5RG93bihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uS2V5RG93biA9IChldikgPT4ge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGlzIGZvciBub3cgYXMgY3RybCthbHQgPSBhbHQtZ3Igc28gdGhpcyBicmVha3Mga2V5Ym9hcmRzIHdoaWNoIHJlbHkgb24gYWx0LWdyIGZvciBudW1iZXJzXG4gICAgICAgICAgICAvLyBXaWxsIG5lZWQgdG8gZmluZCBhIGJldHRlciBtZXRhIGtleSBpZiBhbnlvbmUgYWN0dWFsbHkgY2FyZXMgYWJvdXQgdXNpbmcgdGhpcy5cbiAgICAgICAgICAgIGlmIChldi5hbHRLZXkgJiYgZXYuY3RybEtleSAmJiBldi5rZXlDb2RlID4gNDggJiYgZXYua2V5Q29kZSA8IDU4KSB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19pbmRleGVkX3Jvb20nLFxuICAgICAgICAgICAgICAgICAgICByb29tSW5kZXg6IGV2LmtleUNvZGUgLSA0OSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG5cbiAgICAgICAgbGV0IGhhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY3RybENtZE9ubHkgPSBpc09ubHlDdHJsT3JDbWRLZXlFdmVudChldik7XG4gICAgICAgIGNvbnN0IGhhc01vZGlmaWVyID0gZXYuYWx0S2V5IHx8IGV2LmN0cmxLZXkgfHwgZXYubWV0YUtleSB8fCBldi5zaGlmdEtleTtcbiAgICAgICAgY29uc3QgaXNNb2RpZmllciA9IGV2LmtleSA9PT0gS2V5LkFMVCB8fCBldi5rZXkgPT09IEtleS5DT05UUk9MIHx8IGV2LmtleSA9PT0gS2V5Lk1FVEEgfHwgZXYua2V5ID09PSBLZXkuU0hJRlQ7XG5cbiAgICAgICAgc3dpdGNoIChldi5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgS2V5LlBBR0VfVVA6XG4gICAgICAgICAgICBjYXNlIEtleS5QQUdFX0RPV046XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNNb2RpZmllciAmJiAhaXNNb2RpZmllcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vblNjcm9sbEtleVByZXNzZWQoZXYpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgS2V5LkhPTUU6XG4gICAgICAgICAgICBjYXNlIEtleS5FTkQ6XG4gICAgICAgICAgICAgICAgaWYgKGV2LmN0cmxLZXkgJiYgIWV2LnNoaWZ0S2V5ICYmICFldi5hbHRLZXkgJiYgIWV2Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25TY3JvbGxLZXlQcmVzc2VkKGV2KTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBLZXkuSzpcbiAgICAgICAgICAgICAgICBpZiAoY3RybENtZE9ubHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2ZvY3VzX3Jvb21fZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgS2V5LkJBQ0tUSUNLOlxuICAgICAgICAgICAgICAgIC8vIElkZWFsbHkgdGhpcyB3b3VsZCBiZSBDVFJMK1AgZm9yIFwiUHJvZmlsZVwiLCBidXQgdGhhdCdzXG4gICAgICAgICAgICAgICAgLy8gdGFrZW4gYnkgdGhlIHByaW50IGRpYWxvZy4gQ1RSTCtJIGZvciBcIkluZm9ybWF0aW9uXCJcbiAgICAgICAgICAgICAgICAvLyB3YXMgcHJldmlvdXNseSBjaG9zZW4gYnV0IGNvbmZsaWN0ZWQgd2l0aCBpdGFsaWNzIGluXG4gICAgICAgICAgICAgICAgLy8gY29tcG9zZXIsIHNvIENUUkwrYCBpdCBpc1xuXG4gICAgICAgICAgICAgICAgaWYgKGN0cmxDbWRPbmx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0b2dnbGVfdG9wX2xlZnRfbWVudScsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgS2V5LlNMQVNIOlxuICAgICAgICAgICAgICAgIGlmIChpc09ubHlDdHJsT3JDbWRJZ25vcmVTaGlmdEtleUV2ZW50KGV2KSkge1xuICAgICAgICAgICAgICAgICAgICBLZXlib2FyZFNob3J0Y3V0cy50b2dnbGVEaWFsb2coKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEtleS5BUlJPV19VUDpcbiAgICAgICAgICAgIGNhc2UgS2V5LkFSUk9XX0RPV046XG4gICAgICAgICAgICAgICAgaWYgKGV2LmFsdEtleSAmJiAhZXYuY3RybEtleSAmJiAhZXYubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tX2RlbHRhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhOiBldi5rZXkgPT09IEtleS5BUlJPV19VUCA/IC0xIDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVucmVhZDogZXYuc2hpZnRLZXksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgS2V5LlBFUklPRDpcbiAgICAgICAgICAgICAgICBpZiAoY3RybENtZE9ubHkgJiYgKHRoaXMucHJvcHMucGFnZV90eXBlID09PSBcInJvb21fdmlld1wiIHx8IHRoaXMucHJvcHMucGFnZV90eXBlID09PSBcImdyb3VwX3ZpZXdcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RvZ2dsZV9yaWdodF9wYW5lbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLnByb3BzLnBhZ2VfdHlwZSA9PT0gXCJyb29tX3ZpZXdcIiA/IFwicm9vbVwiIDogXCJncm91cFwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgaGFuZGxlciBmb3IgaXQsIHBhc3MgaXQgdG8gdGhlIHBsYXRmb3JtIHdoaWNoIG1pZ2h0XG4gICAgICAgICAgICAgICAgaGFuZGxlZCA9IFBsYXRmb3JtUGVnLmdldCgpLm9uS2V5RG93bihldik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFuZGxlZCkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFpc01vZGlmaWVyICYmICFldi5hbHRLZXkgJiYgIWV2LmN0cmxLZXkgJiYgIWV2Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBhYm92ZSBjb25kaXRpb24gaXMgY3JhZnRlZCB0byBfYWxsb3dfIGNoYXJhY3RlcnMgd2l0aCBTaGlmdFxuICAgICAgICAgICAgLy8gYWxyZWFkeSBwcmVzc2VkIChidXQgbm90IHRoZSBTaGlmdCBrZXkgZG93biBpdHNlbGYpLlxuXG4gICAgICAgICAgICBjb25zdCBpc0NsaWNrU2hvcnRjdXQgPSBldi50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkgJiZcbiAgICAgICAgICAgICAgICAoZXYua2V5ID09PSBLZXkuU1BBQ0UgfHwgZXYua2V5ID09PSBLZXkuRU5URVIpO1xuXG4gICAgICAgICAgICAvLyBEbyBub3QgY2FwdHVyZSB0aGUgY29udGV4dCBtZW51IGtleSB0byBpbXByb3ZlIGtleWJvYXJkIGFjY2Vzc2liaWxpdHlcbiAgICAgICAgICAgIGlmIChldi5rZXkgPT09IEtleS5DT05URVhUX01FTlUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNDbGlja1Nob3J0Y3V0ICYmIGV2LmtleSAhPT0gS2V5LlRBQiAmJiAhY2FuRWxlbWVudFJlY2VpdmVJbnB1dChldi50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gc3luY2hyb25vdXMgZGlzcGF0Y2ggc28gd2UgZm9jdXMgYmVmb3JlIGtleSBnZW5lcmF0ZXMgaW5wdXRcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2ZvY3VzX2NvbXBvc2VyJ30sIHRydWUpO1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIC8vIHdlIHNob3VsZCAqbm90KiBwcmV2ZW50RGVmYXVsdCgpIGhlcmUgYXNcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHdvdWxkIHByZXZlbnQgdHlwaW5nIGluIHRoZSBub3ctZm9jdXNzZWQgY29tcG9zZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBkaXNwYXRjaCBhIHBhZ2UtdXAvcGFnZS1kb3duL2V0YyB0byB0aGUgYXBwcm9wcmlhdGUgY29tcG9uZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2IFRoZSBrZXkgZXZlbnRcbiAgICAgKi9cbiAgICBfb25TY3JvbGxLZXlQcmVzc2VkID0gKGV2KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9yb29tVmlldy5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9yb29tVmlldy5jdXJyZW50LmhhbmRsZVNjcm9sbEtleShldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uRHJhZ0VuZCA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgLy8gRHJhZ2dlZCB0byBhbiBpbnZhbGlkIGRlc3RpbmF0aW9uLCBub3Qgb250byBhIGRyb3BwYWJsZVxuICAgICAgICBpZiAoIXJlc3VsdC5kZXN0aW5hdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVzdCA9IHJlc3VsdC5kZXN0aW5hdGlvbi5kcm9wcGFibGVJZDtcblxuICAgICAgICBpZiAoZGVzdCA9PT0gJ3RhZy1wYW5lbC1kcm9wcGFibGUnKSB7XG4gICAgICAgICAgICAvLyBDb3VsZCBiZSBcIkdyb3VwVGlsZSArZ3JvdXBJZDpkb21haW5cIlxuICAgICAgICAgICAgY29uc3QgZHJhZ2dhYmxlSWQgPSByZXN1bHQuZHJhZ2dhYmxlSWQuc3BsaXQoJyAnKS5wb3AoKTtcblxuICAgICAgICAgICAgLy8gRGlzcGF0Y2ggc3luY2hyb25vdXNseSBzbyB0aGF0IHRoZSBUYWdQYW5lbCByZWNlaXZlcyBhblxuICAgICAgICAgICAgLy8gb3B0aW1pc3RpYyB1cGRhdGUgZnJvbSBUYWdPcmRlclN0b3JlIGJlZm9yZSB0aGUgcHJldmlvdXNcbiAgICAgICAgICAgIC8vIHN0YXRlIGlzIHNob3duLlxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKFRhZ09yZGVyQWN0aW9ucy5tb3ZlVGFnKFxuICAgICAgICAgICAgICAgIHRoaXMuX21hdHJpeENsaWVudCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGVJZCxcbiAgICAgICAgICAgICAgICByZXN1bHQuZGVzdGluYXRpb24uaW5kZXgsXG4gICAgICAgICAgICApLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZXN0LnN0YXJ0c1dpdGgoJ3Jvb20tc3ViLWxpc3QtZHJvcHBhYmxlXycpKSB7XG4gICAgICAgICAgICB0aGlzLl9vblJvb21UaWxlRW5kRHJhZyhyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vblJvb21UaWxlRW5kRHJhZyA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgbGV0IG5ld1RhZyA9IHJlc3VsdC5kZXN0aW5hdGlvbi5kcm9wcGFibGVJZC5zcGxpdCgnXycpWzFdO1xuICAgICAgICBsZXQgcHJldlRhZyA9IHJlc3VsdC5zb3VyY2UuZHJvcHBhYmxlSWQuc3BsaXQoJ18nKVsxXTtcbiAgICAgICAgaWYgKG5ld1RhZyA9PT0gJ3VuZGVmaW5lZCcpIG5ld1RhZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHByZXZUYWcgPT09ICd1bmRlZmluZWQnKSBwcmV2VGFnID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGNvbnN0IHJvb21JZCA9IHJlc3VsdC5kcmFnZ2FibGVJZC5zcGxpdCgnXycpWzFdO1xuXG4gICAgICAgIGNvbnN0IG9sZEluZGV4ID0gcmVzdWx0LnNvdXJjZS5pbmRleDtcbiAgICAgICAgY29uc3QgbmV3SW5kZXggPSByZXN1bHQuZGVzdGluYXRpb24uaW5kZXg7XG5cbiAgICAgICAgZGlzLmRpc3BhdGNoKFJvb21MaXN0QWN0aW9ucy50YWdSb29tKFxuICAgICAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50LFxuICAgICAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50LmdldFJvb20ocm9vbUlkKSxcbiAgICAgICAgICAgIHByZXZUYWcsIG5ld1RhZyxcbiAgICAgICAgICAgIG9sZEluZGV4LCBuZXdJbmRleCxcbiAgICAgICAgKSwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIF9vbk1vdXNlRG93biA9IChldikgPT4ge1xuICAgICAgICAvLyBXaGVuIHRoZSBwYW5lbHMgYXJlIGRpc2FibGVkLCBjbGlja2luZyBvbiB0aGVtIHJlc3VsdHMgaW4gYSBtb3VzZSBldmVudFxuICAgICAgICAvLyB3aGljaCBidWJibGVzIHRvIGNlcnRhaW4gZWxlbWVudHMgaW4gdGhlIHRyZWUuIFdoZW4gdGhpcyBoYXBwZW5zLCBjbG9zZVxuICAgICAgICAvLyBhbnkgc2V0dGluZ3MgcGFnZSB0aGF0IGlzIGN1cnJlbnRseSBvcGVuICh1c2VyL3Jvb20vZ3JvdXApLlxuICAgICAgICBpZiAodGhpcy5wcm9wcy5sZWZ0RGlzYWJsZWQgJiYgdGhpcy5wcm9wcy5yaWdodERpc2FibGVkKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRDbGFzc2VzID0gbmV3IFNldChldi50YXJnZXQuY2xhc3NOYW1lLnNwbGl0KCcgJykpO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRhcmdldENsYXNzZXMuaGFzKCdteF9NYXRyaXhDaGF0JykgfHxcbiAgICAgICAgICAgICAgICB0YXJnZXRDbGFzc2VzLmhhcygnbXhfTWF0cml4Q2hhdF9taWRkbGVQYW5lbCcpIHx8XG4gICAgICAgICAgICAgICAgdGFyZ2V0Q2xhc3Nlcy5oYXMoJ214X1Jvb21WaWV3JylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBtb3VzZURvd246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IGV2LnBhZ2VYLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogZXYucGFnZVksXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uTW91c2VVcCA9IChldikgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUubW91c2VEb3duKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZGVsdGFYID0gZXYucGFnZVggLSB0aGlzLnN0YXRlLm1vdXNlRG93bi54O1xuICAgICAgICBjb25zdCBkZWx0YVkgPSBldi5wYWdlWSAtIHRoaXMuc3RhdGUubW91c2VEb3duLnk7XG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KChkZWx0YVggKiBkZWx0YVgpICsgKGRlbHRhWSArIGRlbHRhWSkpO1xuICAgICAgICBjb25zdCBtYXhSYWRpdXMgPSA1OyAvLyBQZW9wbGUgc2hvdWxkbid0IGJlIHN0cmF5aW5nIHRvbyBmYXIsIGhvcGVmdWxseVxuXG4gICAgICAgIC8vIE5vdGU6IHdlIHRyYWNrIGhvdyBmYXIgdGhlIHVzZXIgbW92ZWQgdGhlaXIgbW91c2UgdG8gaGVscFxuICAgICAgICAvLyBjb21iYXQgYWdhaW5zdCBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy83MTU4XG5cbiAgICAgICAgaWYgKGRpc3RhbmNlIDwgbWF4UmFkaXVzKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGEgcmVhbCBjbGljaywgYW5kIG5vdCBhIGRyYWdcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7IGFjdGlvbjogJ2Nsb3NlX3NldHRpbmdzJyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsd2F5cyBjbGVhciB0aGUgbW91c2VEb3duIHN0YXRlIHRvIGVuc3VyZSB3ZSBkb24ndCBhY2NpZGVudGFsbHlcbiAgICAgICAgLy8gdXNlIHN0YWxlIHZhbHVlcyBkdWUgdG8gdGhlIG1vdXNlRG93biBjaGVja3MuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe21vdXNlRG93bjogbnVsbH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IExlZnRQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoJ3N0cnVjdHVyZXMuTGVmdFBhbmVsJyk7XG4gICAgICAgIGNvbnN0IFJvb21WaWV3ID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5Sb29tVmlldycpO1xuICAgICAgICBjb25zdCBVc2VyVmlldyA9IHNkay5nZXRDb21wb25lbnQoJ3N0cnVjdHVyZXMuVXNlclZpZXcnKTtcbiAgICAgICAgY29uc3QgR3JvdXBWaWV3ID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5Hcm91cFZpZXcnKTtcbiAgICAgICAgY29uc3QgTXlHcm91cHMgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLk15R3JvdXBzJyk7XG4gICAgICAgIGNvbnN0IFRvYXN0Q29udGFpbmVyID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5Ub2FzdENvbnRhaW5lcicpO1xuICAgICAgICBjb25zdCBNYXRyaXhUb29sYmFyID0gc2RrLmdldENvbXBvbmVudCgnZ2xvYmFscy5NYXRyaXhUb29sYmFyJyk7XG4gICAgICAgIGNvbnN0IENvb2tpZUJhciA9IHNkay5nZXRDb21wb25lbnQoJ2dsb2JhbHMuQ29va2llQmFyJyk7XG4gICAgICAgIGNvbnN0IE5ld1ZlcnNpb25CYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdnbG9iYWxzLk5ld1ZlcnNpb25CYXInKTtcbiAgICAgICAgY29uc3QgVXBkYXRlQ2hlY2tCYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdnbG9iYWxzLlVwZGF0ZUNoZWNrQmFyJyk7XG4gICAgICAgIGNvbnN0IFBhc3N3b3JkTmFnQmFyID0gc2RrLmdldENvbXBvbmVudCgnZ2xvYmFscy5QYXNzd29yZE5hZ0JhcicpO1xuICAgICAgICBjb25zdCBTZXJ2ZXJMaW1pdEJhciA9IHNkay5nZXRDb21wb25lbnQoJ2dsb2JhbHMuU2VydmVyTGltaXRCYXInKTtcbiAgICAgICAgY29uc3QgTmF2QmFyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuTmF2QmFyJyk7XG5cbiAgICAgICAgbGV0IHBhZ2VFbGVtZW50O1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5wYWdlX3R5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFnZVR5cGVzLlJvb21WaWV3OlxuICAgICAgICAgICAgICAgIHBhZ2VFbGVtZW50ID0gPFJvb21WaWV3XG4gICAgICAgICAgICAgICAgICAgICAgICByZWY9e3RoaXMuX3Jvb21WaWV3fVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0pvaW49e3RoaXMucHJvcHMuYXV0b0pvaW59XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlZ2lzdGVyZWQ9e3RoaXMucHJvcHMub25SZWdpc3RlcmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcmRQYXJ0eUludml0ZT17dGhpcy5wcm9wcy50aGlyZFBhcnR5SW52aXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgb29iRGF0YT17dGhpcy5wcm9wcy5yb29tT29iRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZpYVNlcnZlcnM9e3RoaXMucHJvcHMudmlhU2VydmVyc31cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50UGl4ZWxPZmZzZXQ9e3RoaXMucHJvcHMuaW5pdGlhbEV2ZW50UGl4ZWxPZmZzZXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3RoaXMucHJvcHMuY3VycmVudFJvb21JZCB8fCAncm9vbXZpZXcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMubWlkZGxlRGlzYWJsZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBDb25mZXJlbmNlSGFuZGxlcj17dGhpcy5wcm9wcy5Db25mZXJlbmNlSGFuZGxlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc2l6ZU5vdGlmaWVyPXt0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyfVxuICAgICAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBQYWdlVHlwZXMuTXlHcm91cHM6XG4gICAgICAgICAgICAgICAgcGFnZUVsZW1lbnQgPSA8TXlHcm91cHMgLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgUGFnZVR5cGVzLlJvb21EaXJlY3Rvcnk6XG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlZCBieSBNYXRyaXhDaGF0IGZvciBub3dcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBQYWdlVHlwZXMuTmF2QmFyOlxuICAgICAgICAgICAgICAgIHBhZ2VFbGVtZW50ID0gPE5hdkJhciAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBQYWdlVHlwZXMuSG9tZVBhZ2U6XG4gICAgICAgICAgICAgICAgcGFnZUVsZW1lbnQgPSA8SG9tZVBhZ2UgLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgUGFnZVR5cGVzLlVzZXJWaWV3OlxuICAgICAgICAgICAgICAgIHBhZ2VFbGVtZW50ID0gPFVzZXJWaWV3IHVzZXJJZD17dGhpcy5wcm9wcy5jdXJyZW50VXNlcklkfSAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFnZVR5cGVzLkdyb3VwVmlldzpcbiAgICAgICAgICAgICAgICBwYWdlRWxlbWVudCA9IDxHcm91cFZpZXdcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZD17dGhpcy5wcm9wcy5jdXJyZW50R3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgaXNOZXc9e3RoaXMucHJvcHMuY3VycmVudEdyb3VwSXNOZXd9XG4gICAgICAgICAgICAgICAgLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2FnZUxpbWl0RXZlbnQgPSB0aGlzLnN0YXRlLnNlcnZlck5vdGljZUV2ZW50cy5maW5kKChlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIGUgJiYgZS5nZXRUeXBlKCkgPT09ICdtLnJvb20ubWVzc2FnZScgJiZcbiAgICAgICAgICAgICAgICBlLmdldENvbnRlbnQoKVsnc2VydmVyX25vdGljZV90eXBlJ10gPT09ICdtLnNlcnZlcl9ub3RpY2UudXNhZ2VfbGltaXRfcmVhY2hlZCdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCB0b3BCYXI7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnN5bmNFcnJvckRhdGEgJiYgdGhpcy5zdGF0ZS5zeW5jRXJyb3JEYXRhLmVycm9yLmVycmNvZGUgPT09ICdNX1JFU09VUkNFX0xJTUlUX0VYQ0VFREVEJykge1xuICAgICAgICAgICAgdG9wQmFyID0gPFNlcnZlckxpbWl0QmFyIGtpbmQ9J2hhcmQnXG4gICAgICAgICAgICAgICAgYWRtaW5Db250YWN0PXt0aGlzLnN0YXRlLnN5bmNFcnJvckRhdGEuZXJyb3IuZGF0YS5hZG1pbl9jb250YWN0fVxuICAgICAgICAgICAgICAgIGxpbWl0VHlwZT17dGhpcy5zdGF0ZS5zeW5jRXJyb3JEYXRhLmVycm9yLmRhdGEubGltaXRfdHlwZX1cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHVzYWdlTGltaXRFdmVudCkge1xuICAgICAgICAgICAgdG9wQmFyID0gPFNlcnZlckxpbWl0QmFyIGtpbmQ9J3NvZnQnXG4gICAgICAgICAgICAgICAgYWRtaW5Db250YWN0PXt1c2FnZUxpbWl0RXZlbnQuZ2V0Q29udGVudCgpLmFkbWluX2NvbnRhY3R9XG4gICAgICAgICAgICAgICAgbGltaXRUeXBlPXt1c2FnZUxpbWl0RXZlbnQuZ2V0Q29udGVudCgpLmxpbWl0X3R5cGV9XG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnNob3dDb29raWVCYXIgJiZcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY29uZmlnLnBpd2lrICYmXG4gICAgICAgICAgICBuYXZpZ2F0b3IuZG9Ob3RUcmFjayAhPT0gXCIxXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBwb2xpY3lVcmwgPSB0aGlzLnByb3BzLmNvbmZpZy5waXdpay5wb2xpY3lVcmwgfHwgbnVsbDtcbiAgICAgICAgICAgIHRvcEJhciA9IDxDb29raWVCYXIgcG9saWN5VXJsPXtwb2xpY3lVcmx9IC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuaGFzTmV3VmVyc2lvbikge1xuICAgICAgICAgICAgdG9wQmFyID0gPE5ld1ZlcnNpb25CYXIgdmVyc2lvbj17dGhpcy5wcm9wcy52ZXJzaW9ufSBuZXdWZXJzaW9uPXt0aGlzLnByb3BzLm5ld1ZlcnNpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxlYXNlTm90ZXM9e3RoaXMucHJvcHMubmV3VmVyc2lvblJlbGVhc2VOb3Rlc31cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuY2hlY2tpbmdGb3JVcGRhdGUpIHtcbiAgICAgICAgICAgIHRvcEJhciA9IDxVcGRhdGVDaGVja0JhciB7Li4udGhpcy5wcm9wcy5jaGVja2luZ0ZvclVwZGF0ZX0gLz47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS51c2VySGFzR2VuZXJhdGVkUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIHRvcEJhciA9IDxQYXNzd29yZE5hZ0JhciAvPjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnNob3dOb3RpZmllclRvb2xiYXIpIHtcbiAgICAgICAgICAgIHRvcEJhciA9IDxNYXRyaXhUb29sYmFyIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJvZHlDbGFzc2VzID0gJ214X01hdHJpeENoYXQnO1xuICAgICAgICBpZiAodG9wQmFyKSB7XG4gICAgICAgICAgICBib2R5Q2xhc3NlcyArPSAnIG14X01hdHJpeENoYXRfdG9vbGJhclNob3dpbmcnO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnVzZUNvbXBhY3RMYXlvdXQpIHtcbiAgICAgICAgICAgIGJvZHlDbGFzc2VzICs9ICcgbXhfTWF0cml4Q2hhdF91c2VDb21wYWN0TGF5b3V0JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8TWF0cml4Q2xpZW50Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17dGhpcy5fbWF0cml4Q2xpZW50fT5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIG9uUGFzdGU9e3RoaXMuX29uUGFzdGV9XG4gICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17dGhpcy5fb25SZWFjdEtleURvd259XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0nbXhfTWF0cml4Q2hhdF93cmFwcGVyJ1xuICAgICAgICAgICAgICAgICAgICBhcmlhLWhpZGRlbj17dGhpcy5wcm9wcy5oaWRlVG9TUlVzZXJzfVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy5fb25Nb3VzZURvd259XG4gICAgICAgICAgICAgICAgICAgIG9uTW91c2VVcD17dGhpcy5fb25Nb3VzZVVwfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPE5hdkJhciAvPlxuICAgICAgICAgICAgICAgICAgICB7IHRvcEJhciB9XG4gICAgICAgICAgICAgICAgICAgIDxUb2FzdENvbnRhaW5lciAvPlxuICAgICAgICAgICAgICAgICAgICA8RHJhZ0Ryb3BDb250ZXh0IG9uRHJhZ0VuZD17dGhpcy5fb25EcmFnRW5kfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgcmVmPXt0aGlzLl9yZXNpemVDb250YWluZXJ9IGNsYXNzTmFtZT17Ym9keUNsYXNzZXN9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxMZWZ0UGFuZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplTm90aWZpZXI9e3RoaXMucHJvcHMucmVzaXplTm90aWZpZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxhcHNlZD17dGhpcy5wcm9wcy5jb2xsYXBzZUxocyB8fCBmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMubGVmdERpc2FibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJlc2l6ZUhhbmRsZSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcGFnZUVsZW1lbnQgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvRHJhZ0Ryb3BDb250ZXh0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9NYXRyaXhDbGllbnRDb250ZXh0LlByb3ZpZGVyPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTG9nZ2VkSW5WaWV3O1xuIl19