"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _shouldHideEvent = _interopRequireDefault(require("../../shouldHideEvent"));

var _react = _interopRequireWildcard(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../languageHandler");

var _Permalinks = require("../../utils/permalinks/Permalinks");

var _ContentMessages = _interopRequireDefault(require("../../ContentMessages"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var sdk = _interopRequireWildcard(require("../../index"));

var _CallHandler = _interopRequireDefault(require("../../CallHandler"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _Tinter = _interopRequireDefault(require("../../Tinter"));

var _ratelimitedfunc = _interopRequireDefault(require("../../ratelimitedfunc"));

var ObjectUtils = _interopRequireWildcard(require("../../ObjectUtils"));

var Rooms = _interopRequireWildcard(require("../../Rooms"));

var _Searching = _interopRequireDefault(require("../../Searching"));

var _Keyboard = require("../../Keyboard");

var _MainSplit = _interopRequireDefault(require("./MainSplit"));

var _RightPanel = _interopRequireDefault(require("./RightPanel"));

var _RoomViewStore = _interopRequireDefault(require("../../stores/RoomViewStore"));

var _RoomScrollStateStore = _interopRequireDefault(require("../../stores/RoomScrollStateStore"));

var _WidgetEchoStore = _interopRequireDefault(require("../../stores/WidgetEchoStore"));

var _SettingsStore = _interopRequireWildcard(require("../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../views/elements/AccessibleButton"));

var _RightPanelStore = _interopRequireDefault(require("../../stores/RightPanelStore"));

var _EventTile = require("../views/rooms/EventTile");

var _RoomContext = _interopRequireDefault(require("../../contexts/RoomContext"));

var _MatrixClientContext = _interopRequireDefault(require("../../contexts/MatrixClientContext"));

var _ShieldUtils = require("../../utils/ShieldUtils");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2018, 2019 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

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
// TODO: This component is enormous! There's several things which could stand-alone:
//  - Search results component
//  - Drag and drop
const DEBUG = false;

let debuglog = function () {};

const BROWSER_SUPPORTS_SANDBOX = ('sandbox' in document.createElement('iframe'));

if (DEBUG) {
  // using bind means that we get to keep useful line numbers in the console
  debuglog = console.log.bind(console);
}

var _default = (0, _createReactClass.default)({
  displayName: 'RoomView',
  propTypes: {
    ConferenceHandler: _propTypes.default.any,
    // Called with the credentials of a registered user (if they were a ROU that
    // transitioned to PWLU)
    onRegistered: _propTypes.default.func,
    // An object representing a third party invite to join this room
    // Fields:
    // * inviteSignUrl (string) The URL used to join this room from an email invite
    //                          (given as part of the link in the invite email)
    // * invitedEmail (string) The email address that was invited to this room
    thirdPartyInvite: _propTypes.default.object,
    // Any data about the room that would normally come from the homeserver
    // but has been passed out-of-band, eg. the room name and avatar URL
    // from an email invite (a workaround for the fact that we can't
    // get this information from the HS using an email invite).
    // Fields:
    //  * name (string) The room's name
    //  * avatarUrl (string) The mxc:// avatar URL for the room
    //  * inviterName (string) The display name of the person who
    //  *                      invited us to the room
    oobData: _propTypes.default.object,
    // Servers the RoomView can use to try and assist joins
    viaServers: _propTypes.default.arrayOf(_propTypes.default.string)
  },
  statics: {
    contextType: _MatrixClientContext.default
  },
  getInitialState: function () {
    const llMembers = this.context.hasLazyLoadMembersEnabled();
    return {
      room: null,
      roomId: null,
      roomLoading: true,
      peekLoading: false,
      shouldPeek: true,
      // Media limits for uploading.
      mediaConfig: undefined,
      // used to trigger a rerender in TimelinePanel once the members are loaded,
      // so RR are rendered again (now with the members available), ...
      membersLoaded: !llMembers,
      // The event to be scrolled to initially
      initialEventId: null,
      // The offset in pixels from the event with which to scroll vertically
      initialEventPixelOffset: null,
      // Whether to highlight the event scrolled to
      isInitialEventHighlighted: null,
      forwardingEvent: null,
      numUnreadMessages: 0,
      draggingFile: false,
      searching: false,
      searchResults: null,
      callState: null,
      guestsCanJoin: false,
      canPeek: false,
      showApps: false,
      isAlone: false,
      isPeeking: false,
      showingPinned: false,
      showReadReceipts: true,
      showRightPanel: _RightPanelStore.default.getSharedInstance().isOpenForRoom,
      // error object, as from the matrix client/server API
      // If we failed to load information about the room,
      // store the error here.
      roomLoadError: null,
      // Have we sent a request to join the room that we're waiting to complete?
      joining: false,
      // this is true if we are fully scrolled-down, and are looking at
      // the end of the live timeline. It has the effect of hiding the
      // 'scroll to bottom' knob, among a couple of other things.
      atEndOfLiveTimeline: true,
      atEndOfLiveTimelineInit: false,
      // used by componentDidUpdate to avoid unnecessary checks
      showTopUnreadMessagesBar: false,
      auxPanelMaxHeight: undefined,
      statusBarVisible: false,
      // We load this later by asking the js-sdk to suggest a version for us.
      // This object is the result of Room#getRecommendedVersion()
      upgradeRecommendation: null,
      canReact: false,
      canReply: false
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    this.context.on("Room", this.onRoom);
    this.context.on("Room.timeline", this.onRoomTimeline);
    this.context.on("Room.name", this.onRoomName);
    this.context.on("Room.accountData", this.onRoomAccountData);
    this.context.on("RoomState.events", this.onRoomStateEvents);
    this.context.on("RoomState.members", this.onRoomStateMember);
    this.context.on("Room.myMembership", this.onMyMembership);
    this.context.on("accountData", this.onAccountData);
    this.context.on("crypto.keyBackupStatus", this.onKeyBackupStatus);
    this.context.on("deviceVerificationChanged", this.onDeviceVerificationChanged);
    this.context.on("userTrustStatusChanged", this.onUserVerificationChanged);
    this.context.on("crossSigning.keysChanged", this.onCrossSigningKeysChanged); // Start listening for RoomViewStore updates

    this._roomStoreToken = _RoomViewStore.default.addListener(this._onRoomViewStoreUpdate);
    this._rightPanelStoreToken = _RightPanelStore.default.getSharedInstance().addListener(this._onRightPanelStoreUpdate);

    this._onRoomViewStoreUpdate(true);

    _WidgetEchoStore.default.on('update', this._onWidgetEchoStoreUpdate);

    this._showReadReceiptsWatchRef = _SettingsStore.default.watchSetting("showReadReceipts", null, this._onReadReceiptsChange);
    this._roomView = (0, _react.createRef)();
    this._searchResultsPanel = (0, _react.createRef)();
  },
  _onReadReceiptsChange: function () {
    this.setState({
      showReadReceipts: _SettingsStore.default.getValue("showReadReceipts", this.state.roomId)
    });
  },
  _onRoomViewStoreUpdate: function (initial) {
    if (this.unmounted) {
      return;
    }

    if (!initial && this.state.roomId !== _RoomViewStore.default.getRoomId()) {
      // RoomView explicitly does not support changing what room
      // is being viewed: instead it should just be re-mounted when
      // switching rooms. Therefore, if the room ID changes, we
      // ignore this. We either need to do this or add code to handle
      // saving the scroll position (otherwise we end up saving the
      // scroll position against the wrong room).
      // Given that doing the setState here would cause a bunch of
      // unnecessary work, we just ignore the change since we know
      // that if the current room ID has changed from what we thought
      // it was, it means we're about to be unmounted.
      return;
    }

    const roomId = _RoomViewStore.default.getRoomId();

    const newState = {
      roomId,
      roomAlias: _RoomViewStore.default.getRoomAlias(),
      roomLoading: _RoomViewStore.default.isRoomLoading(),
      roomLoadError: _RoomViewStore.default.getRoomLoadError(),
      joining: _RoomViewStore.default.isJoining(),
      initialEventId: _RoomViewStore.default.getInitialEventId(),
      isInitialEventHighlighted: _RoomViewStore.default.isInitialEventHighlighted(),
      forwardingEvent: _RoomViewStore.default.getForwardingEvent(),
      shouldPeek: _RoomViewStore.default.shouldPeek(),
      showingPinned: _SettingsStore.default.getValue("PinnedEvents.isOpen", roomId),
      showReadReceipts: _SettingsStore.default.getValue("showReadReceipts", roomId)
    };

    if (!initial && this.state.shouldPeek && !newState.shouldPeek) {
      // Stop peeking because we have joined this room now
      this.context.stopPeeking();
    } // Temporary logging to diagnose https://github.com/vector-im/riot-web/issues/4307


    console.log('RVS update:', newState.roomId, newState.roomAlias, 'loading?', newState.roomLoading, 'joining?', newState.joining, 'initial?', initial, 'shouldPeek?', newState.shouldPeek); // NB: This does assume that the roomID will not change for the lifetime of
    // the RoomView instance

    if (initial) {
      newState.room = this.context.getRoom(newState.roomId);

      if (newState.room) {
        newState.showApps = this._shouldShowApps(newState.room);

        this._onRoomLoaded(newState.room);
      }
    }

    if (this.state.roomId === null && newState.roomId !== null) {
      // Get the scroll state for the new room
      // If an event ID wasn't specified, default to the one saved for this room
      // in the scroll state store. Assume initialEventPixelOffset should be set.
      if (!newState.initialEventId) {
        const roomScrollState = _RoomScrollStateStore.default.getScrollState(newState.roomId);

        if (roomScrollState) {
          newState.initialEventId = roomScrollState.focussedEvent;
          newState.initialEventPixelOffset = roomScrollState.pixelOffset;
        }
      }
    } // Clear the search results when clicking a search result (which changes the
    // currently scrolled to event, this.state.initialEventId).


    if (this.state.initialEventId !== newState.initialEventId) {
      newState.searchResults = null;
    }

    this.setState(newState); // At this point, newState.roomId could be null (e.g. the alias might not
    // have been resolved yet) so anything called here must handle this case.
    // We pass the new state into this function for it to read: it needs to
    // observe the new state but we don't want to put it in the setState
    // callback because this would prevent the setStates from being batched,
    // ie. cause it to render RoomView twice rather than the once that is necessary.

    if (initial) {
      this._setupRoom(newState.room, newState.roomId, newState.joining, newState.shouldPeek);
    }
  },

  _getRoomId() {
    // According to `_onRoomViewStoreUpdate`, `state.roomId` can be null
    // if we have a room alias we haven't resolved yet. To work around this,
    // first we'll try the room object if it's there, and then fallback to
    // the bare room ID. (We may want to update `state.roomId` after
    // resolving aliases, so we could always trust it.)
    return this.state.room ? this.state.room.roomId : this.state.roomId;
  },

  _getPermalinkCreatorForRoom: function (room) {
    if (!this._permalinkCreators) this._permalinkCreators = {};
    if (this._permalinkCreators[room.roomId]) return this._permalinkCreators[room.roomId];
    this._permalinkCreators[room.roomId] = new _Permalinks.RoomPermalinkCreator(room);

    if (this.state.room && room.roomId === this.state.room.roomId) {
      // We want to watch for changes in the creator for the primary room in the view, but
      // don't need to do so for search results.
      this._permalinkCreators[room.roomId].start();
    } else {
      this._permalinkCreators[room.roomId].load();
    }

    return this._permalinkCreators[room.roomId];
  },
  _stopAllPermalinkCreators: function () {
    if (!this._permalinkCreators) return;

    for (const roomId of Object.keys(this._permalinkCreators)) {
      this._permalinkCreators[roomId].stop();
    }
  },
  _onWidgetEchoStoreUpdate: function () {
    this.setState({
      showApps: this._shouldShowApps(this.state.room)
    });
  },
  _setupRoom: function (room, roomId, joining, shouldPeek) {
    // if this is an unknown room then we're in one of three states:
    // - This is a room we can peek into (search engine) (we can /peek)
    // - This is a room we can publicly join or were invited to. (we can /join)
    // - This is a room we cannot join at all. (no action can help us)
    // We can't try to /join because this may implicitly accept invites (!)
    // We can /peek though. If it fails then we present the join UI. If it
    // succeeds then great, show the preview (but we still may be able to /join!).
    // Note that peeking works by room ID and room ID only, as opposed to joining
    // which must be by alias or invite wherever possible (peeking currently does
    // not work over federation).
    // NB. We peek if we have never seen the room before (i.e. js-sdk does not know
    // about it). We don't peek in the historical case where we were joined but are
    // now not joined because the js-sdk peeking API will clobber our historical room,
    // making it impossible to indicate a newly joined room.
    if (!joining && roomId) {
      if (this.props.autoJoin) {
        this.onJoinButtonClicked();
      } else if (!room && shouldPeek) {
        console.info("Attempting to peek into room %s", roomId);
        this.setState({
          peekLoading: true,
          isPeeking: true // this will change to false if peeking fails

        });
        this.context.peekInRoom(roomId).then(room => {
          if (this.unmounted) {
            return;
          }

          this.setState({
            room: room,
            peekLoading: false
          });

          this._onRoomLoaded(room);
        }).catch(err => {
          if (this.unmounted) {
            return;
          } // Stop peeking if anything went wrong


          this.setState({
            isPeeking: false
          }); // This won't necessarily be a MatrixError, but we duck-type
          // here and say if it's got an 'errcode' key with the right value,
          // it means we can't peek.

          if (err.errcode === "M_GUEST_ACCESS_FORBIDDEN" || err.errcode === 'M_FORBIDDEN') {
            // This is fine: the room just isn't peekable (we assume).
            this.setState({
              peekLoading: false
            });
          } else {
            throw err;
          }
        });
      } else if (room) {
        // Stop peeking because we have joined this room previously
        this.context.stopPeeking();
        this.setState({
          isPeeking: false
        });
      }
    }
  },
  _shouldShowApps: function (room) {
    if (!BROWSER_SUPPORTS_SANDBOX) return false; // Check if user has previously chosen to hide the app drawer for this
    // room. If so, do not show apps

    const hideWidgetDrawer = localStorage.getItem(room.roomId + "_hide_widget_drawer"); // This is confusing, but it means to say that we default to the tray being
    // hidden unless the user clicked to open it.

    return hideWidgetDrawer === "false";
  },
  componentDidMount: function () {
    const call = this._getCallForRoom();

    const callState = call ? call.call_state : "ended";
    this.setState({
      callState: callState
    });

    this._updateConfCallNotification();

    window.addEventListener('beforeunload', this.onPageUnload);

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.on("middlePanelResized", this.onResize);
    }

    this.onResize();
    document.addEventListener("keydown", this.onNativeKeyDown);
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return !ObjectUtils.shallowEqual(this.props, nextProps) || !ObjectUtils.shallowEqual(this.state, nextState);
  },
  componentDidUpdate: function () {
    if (this._roomView.current) {
      const roomView = this._roomView.current;

      if (!roomView.ondrop) {
        roomView.addEventListener('drop', this.onDrop);
        roomView.addEventListener('dragover', this.onDragOver);
        roomView.addEventListener('dragleave', this.onDragLeaveOrEnd);
        roomView.addEventListener('dragend', this.onDragLeaveOrEnd);
      }
    } // Note: We check the ref here with a flag because componentDidMount, despite
    // documentation, does not define our messagePanel ref. It looks like our spinner
    // in render() prevents the ref from being set on first mount, so we try and
    // catch the messagePanel when it does mount. Because we only want the ref once,
    // we use a boolean flag to avoid duplicate work.


    if (this._messagePanel && !this.state.atEndOfLiveTimelineInit) {
      this.setState({
        atEndOfLiveTimelineInit: true,
        atEndOfLiveTimeline: this._messagePanel.isAtEndOfLiveTimeline()
      });
    }
  },
  componentWillUnmount: function () {
    // set a boolean to say we've been unmounted, which any pending
    // promises can use to throw away their results.
    //
    // (We could use isMounted, but facebook have deprecated that.)
    this.unmounted = true; // update the scroll map before we get unmounted

    if (this.state.roomId) {
      _RoomScrollStateStore.default.setScrollState(this.state.roomId, this._getScrollState());
    }

    if (this.state.shouldPeek) {
      this.context.stopPeeking();
    } // stop tracking room changes to format permalinks


    this._stopAllPermalinkCreators();

    if (this._roomView.current) {
      // disconnect the D&D event listeners from the room view. This
      // is really just for hygiene - we're going to be
      // deleted anyway, so it doesn't matter if the event listeners
      // don't get cleaned up.
      const roomView = this._roomView.current;
      roomView.removeEventListener('drop', this.onDrop);
      roomView.removeEventListener('dragover', this.onDragOver);
      roomView.removeEventListener('dragleave', this.onDragLeaveOrEnd);
      roomView.removeEventListener('dragend', this.onDragLeaveOrEnd);
    }

    _dispatcher.default.unregister(this.dispatcherRef);

    if (this.context) {
      this.context.removeListener("Room", this.onRoom);
      this.context.removeListener("Room.timeline", this.onRoomTimeline);
      this.context.removeListener("Room.name", this.onRoomName);
      this.context.removeListener("Room.accountData", this.onRoomAccountData);
      this.context.removeListener("RoomState.events", this.onRoomStateEvents);
      this.context.removeListener("Room.myMembership", this.onMyMembership);
      this.context.removeListener("RoomState.members", this.onRoomStateMember);
      this.context.removeListener("accountData", this.onAccountData);
      this.context.removeListener("crypto.keyBackupStatus", this.onKeyBackupStatus);
      this.context.removeListener("deviceVerificationChanged", this.onDeviceVerificationChanged);
      this.context.removeListener("userTrustStatusChanged", this.onUserVerificationChanged);
      this.context.removeListener("crossSigning.keysChanged", this.onCrossSigningKeysChanged);
    }

    window.removeEventListener('beforeunload', this.onPageUnload);

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.removeListener("middlePanelResized", this.onResize);
    }

    document.removeEventListener("keydown", this.onNativeKeyDown); // Remove RoomStore listener

    if (this._roomStoreToken) {
      this._roomStoreToken.remove();
    } // Remove RightPanelStore listener


    if (this._rightPanelStoreToken) {
      this._rightPanelStoreToken.remove();
    }

    _WidgetEchoStore.default.removeListener('update', this._onWidgetEchoStoreUpdate);

    if (this._showReadReceiptsWatchRef) {
      _SettingsStore.default.unwatchSetting(this._showReadReceiptsWatchRef);

      this._showReadReceiptsWatchRef = null;
    } // cancel any pending calls to the rate_limited_funcs


    this._updateRoomMembers.cancelPendingCall(); // no need to do this as Dir & Settings are now overlays. It just burnt CPU.
    // console.log("Tinter.tint from RoomView.unmount");
    // Tinter.tint(); // reset colourscheme

  },
  _onRightPanelStoreUpdate: function () {
    this.setState({
      showRightPanel: _RightPanelStore.default.getSharedInstance().isOpenForRoom
    });
  },

  onPageUnload(event) {
    if (_ContentMessages.default.sharedInstance().getCurrentUploads().length > 0) {
      return event.returnValue = (0, _languageHandler._t)("You seem to be uploading files, are you sure you want to quit?");
    } else if (this._getCallForRoom() && this.state.callState !== 'ended') {
      return event.returnValue = (0, _languageHandler._t)("You seem to be in a call, are you sure you want to quit?");
    }
  },

  // we register global shortcuts here, they *must not conflict* with local shortcuts elsewhere or both will fire
  onNativeKeyDown: function (ev) {
    let handled = false;
    const ctrlCmdOnly = (0, _Keyboard.isOnlyCtrlOrCmdKeyEvent)(ev);

    switch (ev.key) {
      case _Keyboard.Key.D:
        if (ctrlCmdOnly) {
          this.onMuteAudioClick();
          handled = true;
        }

        break;

      case _Keyboard.Key.E:
        if (ctrlCmdOnly) {
          this.onMuteVideoClick();
          handled = true;
        }

        break;
    }

    if (handled) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  onReactKeyDown: function (ev) {
    let handled = false;

    switch (ev.key) {
      case _Keyboard.Key.ESCAPE:
        if (!ev.altKey && !ev.ctrlKey && !ev.shiftKey && !ev.metaKey) {
          this._messagePanel.forgetReadMarker();

          this.jumpToLiveTimeline();
          handled = true;
        }

        break;

      case _Keyboard.Key.PAGE_UP:
        if (!ev.altKey && !ev.ctrlKey && ev.shiftKey && !ev.metaKey) {
          this.jumpToReadMarker();
          handled = true;
        }

        break;

      case _Keyboard.Key.U.toUpperCase():
        if ((0, _Keyboard.isOnlyCtrlOrCmdIgnoreShiftKeyEvent)(ev) && ev.shiftKey) {
          _dispatcher.default.dispatch({
            action: "upload_file"
          });

          handled = true;
        }

        break;
    }

    if (handled) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  onAction: function (payload) {
    switch (payload.action) {
      case 'message_send_failed':
      case 'message_sent':
        this._checkIfAlone(this.state.room);

        break;

      case 'post_sticker_message':
        this.injectSticker(payload.data.content.url, payload.data.content.info, payload.data.description || payload.data.name);
        break;

      case 'picture_snapshot':
        _ContentMessages.default.sharedInstance().sendContentListToRoom([payload.file], this.state.room.roomId, this.context);

        break;

      case 'notifier_enabled':
      case 'upload_started':
      case 'upload_finished':
      case 'upload_canceled':
        this.forceUpdate();
        break;

      case 'call_state':
        // don't filter out payloads for room IDs other than props.room because
        // we may be interested in the conf 1:1 room
        if (!payload.room_id) {
          return;
        }

        var call = this._getCallForRoom();

        var callState;

        if (call) {
          callState = call.call_state;
        } else {
          callState = "ended";
        } // possibly remove the conf call notification if we're now in
        // the conf


        this._updateConfCallNotification();

        this.setState({
          callState: callState
        });
        break;

      case 'appsDrawer':
        this.setState({
          showApps: payload.show
        });
        break;

      case 'reply_to_event':
        if (this.state.searchResults && payload.event.getRoomId() === this.state.roomId && !this.unmounted) {
          this.onCancelSearchClick();
        }

        break;

      case 'quote':
        if (this.state.searchResults) {
          const roomId = payload.event.getRoomId();

          if (roomId === this.state.roomId) {
            this.onCancelSearchClick();
          }

          setImmediate(() => {
            _dispatcher.default.dispatch({
              action: 'view_room',
              room_id: roomId,
              deferred_action: payload
            });
          });
        }

        break;
    }
  },
  onRoomTimeline: function (ev, room, toStartOfTimeline, removed, data) {
    if (this.unmounted) return; // ignore events for other rooms

    if (!room) return;
    if (!this.state.room || room.roomId != this.state.room.roomId) return; // ignore events from filtered timelines

    if (data.timeline.getTimelineSet() !== room.getUnfilteredTimelineSet()) return;

    if (ev.getType() === "org.matrix.room.preview_urls") {
      this._updatePreviewUrlVisibility(room);
    }

    if (ev.getType() === "m.room.encryption") {
      this._updateE2EStatus(room);
    } // ignore anything but real-time updates at the end of the room:
    // updates from pagination will happen when the paginate completes.


    if (toStartOfTimeline || !data || !data.liveEvent) return; // no point handling anything while we're waiting for the join to finish:
    // we'll only be showing a spinner.

    if (this.state.joining) return;

    if (ev.getSender() !== this.context.credentials.userId) {
      // update unread count when scrolled up
      if (!this.state.searchResults && this.state.atEndOfLiveTimeline) {// no change
      } else if (!(0, _shouldHideEvent.default)(ev)) {
        this.setState((state, props) => {
          return {
            numUnreadMessages: state.numUnreadMessages + 1
          };
        });
      }
    }
  },
  onRoomName: function (room) {
    if (this.state.room && room.roomId == this.state.room.roomId) {
      this.forceUpdate();
    }
  },
  onRoomRecoveryReminderDontAskAgain: function () {
    // Called when the option to not ask again is set:
    // force an update to hide the recovery reminder
    this.forceUpdate();
  },

  onKeyBackupStatus() {
    // Key backup status changes affect whether the in-room recovery
    // reminder is displayed.
    this.forceUpdate();
  },

  canResetTimeline: function () {
    if (!this._messagePanel) {
      return true;
    }

    return this._messagePanel.canResetTimeline();
  },
  // called when state.room is first initialised (either at initial load,
  // after a successful peek, or after we join the room).
  _onRoomLoaded: function (room) {
    this._calculatePeekRules(room);

    this._updatePreviewUrlVisibility(room);

    this._loadMembersIfJoined(room);

    this._calculateRecommendedVersion(room);

    this._updateE2EStatus(room);

    this._updatePermissions(room);
  },
  _calculateRecommendedVersion: async function (room) {
    this.setState({
      upgradeRecommendation: await room.getRecommendedVersion()
    });
  },
  _loadMembersIfJoined: async function (room) {
    // lazy load members if enabled
    if (this.context.hasLazyLoadMembersEnabled()) {
      if (room && room.getMyMembership() === 'join') {
        try {
          await room.loadMembersIfNeeded();

          if (!this.unmounted) {
            this.setState({
              membersLoaded: true
            });
          }
        } catch (err) {
          const errorMessage = "Fetching room members for ".concat(room.roomId, " failed.") + " Room members will appear incomplete.";
          console.error(errorMessage);
          console.error(err);
        }
      }
    }
  },
  _calculatePeekRules: function (room) {
    const guestAccessEvent = room.currentState.getStateEvents("m.room.guest_access", "");

    if (guestAccessEvent && guestAccessEvent.getContent().guest_access === "can_join") {
      this.setState({
        guestsCanJoin: true
      });
    }

    const historyVisibility = room.currentState.getStateEvents("m.room.history_visibility", "");

    if (historyVisibility && historyVisibility.getContent().history_visibility === "world_readable") {
      this.setState({
        canPeek: true
      });
    }
  },
  _updatePreviewUrlVisibility: function ({
    roomId
  }) {
    // URL Previews in E2EE rooms can be a privacy leak so use a different setting which is per-room explicit
    const key = this.context.isRoomEncrypted(roomId) ? 'urlPreviewsEnabled_e2ee' : 'urlPreviewsEnabled';
    this.setState({
      showUrlPreview: _SettingsStore.default.getValue(key, roomId)
    });
  },
  onRoom: function (room) {
    if (!room || room.roomId !== this.state.roomId) {
      return;
    }

    this.setState({
      room: room
    }, () => {
      this._onRoomLoaded(room);
    });
  },
  onDeviceVerificationChanged: function (userId, device) {
    const room = this.state.room;

    if (!room.currentState.getMember(userId)) {
      return;
    }

    this._updateE2EStatus(room);
  },
  onUserVerificationChanged: function (userId, _trustStatus) {
    const room = this.state.room;

    if (!room || !room.currentState.getMember(userId)) {
      return;
    }

    this._updateE2EStatus(room);
  },
  onCrossSigningKeysChanged: function () {
    const room = this.state.room;

    if (room) {
      this._updateE2EStatus(room);
    }
  },
  _updateE2EStatus: async function (room) {
    if (!this.context.isRoomEncrypted(room.roomId)) {
      return;
    }

    if (!this.context.isCryptoEnabled()) {
      // If crypto is not currently enabled, we aren't tracking devices at all,
      // so we don't know what the answer is. Let's error on the safe side and show
      // a warning for this case.
      this.setState({
        e2eStatus: "warning"
      });
      return;
    }

    if (!_SettingsStore.default.getValue("feature_cross_signing")) {
      room.hasUnverifiedDevices().then(hasUnverifiedDevices => {
        this.setState({
          e2eStatus: hasUnverifiedDevices ? "warning" : "verified"
        });
      });
      debuglog("e2e check is warning/verified only as cross-signing is off");
      return;
    }
    /* At this point, the user has encryption on and cross-signing on */


    this.setState({
      e2eStatus: await (0, _ShieldUtils.shieldStatusForRoom)(this.context, room)
    });
  },
  updateTint: function () {
    const room = this.state.room;
    if (!room) return;
    console.log("Tinter.tint from updateTint");

    const colorScheme = _SettingsStore.default.getValue("roomColor", room.roomId);

    _Tinter.default.tint(colorScheme.primary_color, colorScheme.secondary_color);
  },
  onAccountData: function (event) {
    const type = event.getType();

    if ((type === "org.matrix.preview_urls" || type === "im.vector.web.settings") && this.state.room) {
      // non-e2ee url previews are stored in legacy event type `org.matrix.room.preview_urls`
      this._updatePreviewUrlVisibility(this.state.room);
    }
  },
  onRoomAccountData: function (event, room) {
    if (room.roomId == this.state.roomId) {
      const type = event.getType();

      if (type === "org.matrix.room.color_scheme") {
        const colorScheme = event.getContent(); // XXX: we should validate the event

        console.log("Tinter.tint from onRoomAccountData");

        _Tinter.default.tint(colorScheme.primary_color, colorScheme.secondary_color);
      } else if (type === "org.matrix.room.preview_urls" || type === "im.vector.web.settings") {
        // non-e2ee url previews are stored in legacy event type `org.matrix.room.preview_urls`
        this._updatePreviewUrlVisibility(room);
      }
    }
  },
  onRoomStateEvents: function (ev, state) {
    // ignore if we don't have a room yet
    if (!this.state.room || this.state.room.roomId !== state.roomId) {
      return;
    }

    this._updatePermissions(this.state.room);
  },
  onRoomStateMember: function (ev, state, member) {
    // ignore if we don't have a room yet
    if (!this.state.room) {
      return;
    } // ignore members in other rooms


    if (member.roomId !== this.state.room.roomId) {
      return;
    }

    this._updateRoomMembers(member);
  },
  onMyMembership: function (room, membership, oldMembership) {
    if (room.roomId === this.state.roomId) {
      this.forceUpdate();

      this._loadMembersIfJoined(room);

      this._updatePermissions(room);
    }
  },
  _updatePermissions: function (room) {
    if (room) {
      const me = this.context.getUserId();
      const canReact = room.getMyMembership() === "join" && room.currentState.maySendEvent("m.reaction", me);
      const canReply = room.maySendMessage();
      this.setState({
        canReact,
        canReply
      });
    }
  },
  // rate limited because a power level change will emit an event for every
  // member in the room.
  _updateRoomMembers: (0, _ratelimitedfunc.default)(function (dueToMember) {
    // a member state changed in this room
    // refresh the conf call notification state
    this._updateConfCallNotification();

    this._updateDMState();

    let memberCountInfluence = 0;

    if (dueToMember && dueToMember.membership === "invite" && this.state.room.getInvitedMemberCount() === 0) {
      // A member got invited, but the room hasn't detected that change yet. Influence the member
      // count by 1 to counteract this.
      memberCountInfluence = 1;
    }

    this._checkIfAlone(this.state.room, memberCountInfluence);

    this._updateE2EStatus(this.state.room);
  }, 500),
  _checkIfAlone: function (room, countInfluence) {
    let warnedAboutLonelyRoom = false;

    if (localStorage) {
      warnedAboutLonelyRoom = localStorage.getItem('mx_user_alone_warned_' + this.state.room.roomId);
    }

    if (warnedAboutLonelyRoom) {
      if (this.state.isAlone) this.setState({
        isAlone: false
      });
      return;
    }

    let joinedOrInvitedMemberCount = room.getJoinedMemberCount() + room.getInvitedMemberCount();
    if (countInfluence) joinedOrInvitedMemberCount += countInfluence;
    this.setState({
      isAlone: joinedOrInvitedMemberCount === 1
    });
  },
  _updateConfCallNotification: function () {
    const room = this.state.room;

    if (!room || !this.props.ConferenceHandler) {
      return;
    }

    const confMember = room.getMember(this.props.ConferenceHandler.getConferenceUserIdForRoom(room.roomId));

    if (!confMember) {
      return;
    }

    const confCall = this.props.ConferenceHandler.getConferenceCallForRoom(confMember.roomId); // A conf call notification should be displayed if there is an ongoing
    // conf call but this cilent isn't a part of it.

    this.setState({
      displayConfCallNotification: (!confCall || confCall.call_state === "ended") && confMember.membership === "join"
    });
  },

  _updateDMState() {
    const room = this.state.room;

    if (room.getMyMembership() != "join") {
      return;
    }

    const dmInviter = room.getDMInviter();

    if (dmInviter) {
      Rooms.setDMRoom(room.roomId, dmInviter);
    }
  },

  onSearchResultsFillRequest: function (backwards) {
    if (!backwards) {
      return Promise.resolve(false);
    }

    if (this.state.searchResults.next_batch) {
      debuglog("requesting more search results");
      const searchPromise = this.context.backPaginateRoomEventsSearch(this.state.searchResults);
      return this._handleSearchResult(searchPromise);
    } else {
      debuglog("no more search results");
      return Promise.resolve(false);
    }
  },
  onInviteButtonClick: function () {
    // call AddressPickerDialog
    _dispatcher.default.dispatch({
      action: 'view_invite',
      roomId: this.state.room.roomId
    });

    this.setState({
      isAlone: false
    }); // there's a good chance they'll invite someone
  },
  onStopAloneWarningClick: function () {
    if (localStorage) {
      localStorage.setItem('mx_user_alone_warned_' + this.state.room.roomId, true);
    }

    this.setState({
      isAlone: false
    });
  },
  onJoinButtonClicked: function (ev) {
    // If the user is a ROU, allow them to transition to a PWLU
    if (this.context && this.context.isGuest()) {
      // Join this room once the user has registered and logged in
      // (If we failed to peek, we may not have a valid room object.)
      _dispatcher.default.dispatch({
        action: 'do_after_sync_prepared',
        deferred_action: {
          action: 'view_room',
          room_id: this._getRoomId()
        }
      }); // Don't peek whilst registering otherwise getPendingEventList complains
      // Do this by indicating our intention to join
      // XXX: ILAG is disabled for now,
      // see https://github.com/vector-im/riot-web/issues/8222


      _dispatcher.default.dispatch({
        action: 'require_registration'
      }); // dis.dispatch({
      //     action: 'will_join',
      // });
      // const SetMxIdDialog = sdk.getComponent('views.dialogs.SetMxIdDialog');
      // const close = Modal.createTrackedDialog('Set MXID', '', SetMxIdDialog, {
      //     homeserverUrl: cli.getHomeserverUrl(),
      //     onFinished: (submitted, credentials) => {
      //         if (submitted) {
      //             this.props.onRegistered(credentials);
      //         } else {
      //             dis.dispatch({
      //                 action: 'cancel_after_sync_prepared',
      //             });
      //             dis.dispatch({
      //                 action: 'cancel_join',
      //             });
      //         }
      //     },
      //     onDifferentServerClicked: (ev) => {
      //         dis.dispatch({action: 'start_registration'});
      //         close();
      //     },
      //     onLoginClick: (ev) => {
      //         dis.dispatch({action: 'start_login'});
      //         close();
      //     },
      // }).close;
      // return;

    } else {
      Promise.resolve().then(() => {
        const signUrl = this.props.thirdPartyInvite ? this.props.thirdPartyInvite.inviteSignUrl : undefined;

        _dispatcher.default.dispatch({
          action: 'join_room',
          opts: {
            inviteSignUrl: signUrl,
            viaServers: this.props.viaServers
          }
        });

        return Promise.resolve();
      });
    }
  },
  onMessageListScroll: function (ev) {
    if (this._messagePanel.isAtEndOfLiveTimeline()) {
      this.setState({
        numUnreadMessages: 0,
        atEndOfLiveTimeline: true
      });
    } else {
      this.setState({
        atEndOfLiveTimeline: false
      });
    }

    this._updateTopUnreadMessagesBar();
  },
  onDragOver: function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'none';
    const items = [...ev.dataTransfer.items];

    if (items.length >= 1) {
      const isDraggingFiles = items.every(function (item) {
        return item.kind == 'file';
      });

      if (isDraggingFiles) {
        this.setState({
          draggingFile: true
        });
        ev.dataTransfer.dropEffect = 'copy';
      }
    }
  },
  onDrop: function (ev) {
    ev.stopPropagation();
    ev.preventDefault();

    _ContentMessages.default.sharedInstance().sendContentListToRoom(ev.dataTransfer.files, this.state.room.roomId, this.context);

    this.setState({
      draggingFile: false
    });

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  },
  onDragLeaveOrEnd: function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.setState({
      draggingFile: false
    });
  },
  injectSticker: function (url, info, text) {
    if (this.context.isGuest()) {
      _dispatcher.default.dispatch({
        action: 'require_registration'
      });

      return;
    }

    _ContentMessages.default.sharedInstance().sendStickerContentToRoom(url, this.state.room.roomId, info, text, this.context).then(undefined, error => {
      if (error.name === "UnknownDeviceError") {
        // Let the staus bar handle this
        return;
      }
    });
  },
  onSearch: function (term, scope) {
    this.setState({
      searchTerm: term,
      searchScope: scope,
      searchResults: {},
      searchHighlights: []
    }); // if we already have a search panel, we need to tell it to forget
    // about its scroll state.

    if (this._searchResultsPanel.current) {
      this._searchResultsPanel.current.resetScrollState();
    } // make sure that we don't end up showing results from
    // an aborted search by keeping a unique id.
    //
    // todo: should cancel any previous search requests.


    this.searchId = new Date().getTime();
    let roomId;
    if (scope === "Room") roomId = this.state.room.roomId;
    debuglog("sending search request");
    const searchPromise = (0, _Searching.default)(term, roomId);

    this._handleSearchResult(searchPromise);
  },
  _handleSearchResult: function (searchPromise) {
    const self = this; // keep a record of the current search id, so that if the search terms
    // change before we get a response, we can ignore the results.

    const localSearchId = this.searchId;
    this.setState({
      searchInProgress: true
    });
    return searchPromise.then(function (results) {
      debuglog("search complete");

      if (self.unmounted || !self.state.searching || self.searchId != localSearchId) {
        console.error("Discarding stale search results");
        return;
      } // postgres on synapse returns us precise details of the strings
      // which actually got matched for highlighting.
      //
      // In either case, we want to highlight the literal search term
      // whether it was used by the search engine or not.


      let highlights = results.highlights;

      if (highlights.indexOf(self.state.searchTerm) < 0) {
        highlights = highlights.concat(self.state.searchTerm);
      } // For overlapping highlights,
      // favour longer (more specific) terms first


      highlights = highlights.sort(function (a, b) {
        return b.length - a.length;
      });
      self.setState({
        searchHighlights: highlights,
        searchResults: results
      });
    }, function (error) {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Search failed", error);

      _Modal.default.createTrackedDialog('Search failed', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Search failed"),
        description: error && error.message ? error.message : (0, _languageHandler._t)("Server may be unavailable, overloaded, or search timed out :(")
      });
    }).finally(function () {
      self.setState({
        searchInProgress: false
      });
    });
  },
  getSearchResultTiles: function () {
    const SearchResultTile = sdk.getComponent('rooms.SearchResultTile');
    const Spinner = sdk.getComponent("elements.Spinner"); // XXX: todo: merge overlapping results somehow?
    // XXX: why doesn't searching on name work?

    const ret = [];

    if (this.state.searchInProgress) {
      ret.push( /*#__PURE__*/_react.default.createElement("li", {
        key: "search-spinner"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null)));
    }

    if (!this.state.searchResults.next_batch) {
      if (this.state.searchResults.results.length == 0) {
        ret.push( /*#__PURE__*/_react.default.createElement("li", {
          key: "search-top-marker"
        }, /*#__PURE__*/_react.default.createElement("h2", {
          className: "mx_RoomView_topMarker"
        }, (0, _languageHandler._t)("No results"))));
      } else {
        ret.push( /*#__PURE__*/_react.default.createElement("li", {
          key: "search-top-marker"
        }, /*#__PURE__*/_react.default.createElement("h2", {
          className: "mx_RoomView_topMarker"
        }, (0, _languageHandler._t)("No more results"))));
      }
    } // once dynamic content in the search results load, make the scrollPanel check
    // the scroll offsets.


    const onHeightChanged = () => {
      const scrollPanel = this._searchResultsPanel.current;

      if (scrollPanel) {
        scrollPanel.checkScroll();
      }
    };

    let lastRoomId;

    for (let i = this.state.searchResults.results.length - 1; i >= 0; i--) {
      const result = this.state.searchResults.results[i];
      const mxEv = result.context.getEvent();
      const roomId = mxEv.getRoomId();
      const room = this.context.getRoom(roomId);

      if (!(0, _EventTile.haveTileForEvent)(mxEv)) {
        // XXX: can this ever happen? It will make the result count
        // not match the displayed count.
        continue;
      }

      if (this.state.searchScope === 'All') {
        if (roomId != lastRoomId) {
          // XXX: if we've left the room, we might not know about
          // it. We should tell the js sdk to go and find out about
          // it. But that's not an issue currently, as synapse only
          // returns results for rooms we're joined to.
          const roomName = room ? room.name : (0, _languageHandler._t)("Unknown room %(roomId)s", {
            roomId: roomId
          });
          ret.push( /*#__PURE__*/_react.default.createElement("li", {
            key: mxEv.getId() + "-room"
          }, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("Room"), ": ", roomName)));
          lastRoomId = roomId;
        }
      }

      const resultLink = "#/room/" + roomId + "/" + mxEv.getId();
      ret.push( /*#__PURE__*/_react.default.createElement(SearchResultTile, {
        key: mxEv.getId(),
        searchResult: result,
        searchHighlights: this.state.searchHighlights,
        resultLink: resultLink,
        permalinkCreator: this._getPermalinkCreatorForRoom(room),
        onHeightChanged: onHeightChanged
      }));
    }

    return ret;
  },
  onPinnedClick: function () {
    const nowShowingPinned = !this.state.showingPinned;
    const roomId = this.state.room.roomId;
    this.setState({
      showingPinned: nowShowingPinned,
      searching: false
    });

    _SettingsStore.default.setValue("PinnedEvents.isOpen", roomId, _SettingsStore.SettingLevel.ROOM_DEVICE, nowShowingPinned);
  },
  onSettingsClick: function () {
    _dispatcher.default.dispatch({
      action: 'open_room_settings'
    });
  },
  onCancelClick: function () {
    console.log("updateTint from onCancelClick");
    this.updateTint();

    if (this.state.forwardingEvent) {
      _dispatcher.default.dispatch({
        action: 'forward_event',
        event: null
      });
    }

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  },
  onLeaveClick: function () {
    _dispatcher.default.dispatch({
      action: 'leave_room',
      room_id: this.state.room.roomId
    });
  },
  onForgetClick: function () {
    this.context.forget(this.state.room.roomId).then(function () {
      _dispatcher.default.dispatch({
        action: 'view_next_room'
      });
    }, function (err) {
      const errCode = err.errcode || (0, _languageHandler._t)("unknown error code");
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to forget room', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Error"),
        description: (0, _languageHandler._t)("Failed to forget room %(errCode)s", {
          errCode: errCode
        })
      });
    });
  },
  onRejectButtonClicked: function (ev) {
    const self = this;
    this.setState({
      rejecting: true
    });
    this.context.leave(this.state.roomId).then(function () {
      _dispatcher.default.dispatch({
        action: 'view_next_room'
      });

      self.setState({
        rejecting: false
      });
    }, function (error) {
      console.error("Failed to reject invite: %s", error);
      const msg = error.message ? error.message : JSON.stringify(error);
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to reject invite', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to reject invite"),
        description: msg
      });

      self.setState({
        rejecting: false,
        rejectError: error
      });
    });
  },
  onRejectAndIgnoreClick: async function () {
    this.setState({
      rejecting: true
    });

    try {
      const myMember = this.state.room.getMember(this.context.getUserId());
      const inviteEvent = myMember.events.member;
      const ignoredUsers = this.context.getIgnoredUsers();
      ignoredUsers.push(inviteEvent.getSender()); // de-duped internally in the js-sdk

      await this.context.setIgnoredUsers(ignoredUsers);
      await this.context.leave(this.state.roomId);

      _dispatcher.default.dispatch({
        action: 'view_next_room'
      });

      this.setState({
        rejecting: false
      });
    } catch (error) {
      console.error("Failed to reject invite: %s", error);
      const msg = error.message ? error.message : JSON.stringify(error);
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to reject invite', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to reject invite"),
        description: msg
      });

      self.setState({
        rejecting: false,
        rejectError: error
      });
    }
  },
  onRejectThreepidInviteButtonClicked: function (ev) {
    // We can reject 3pid invites in the same way that we accept them,
    // using /leave rather than /join. In the short term though, we
    // just ignore them.
    // https://github.com/vector-im/vector-web/issues/1134
    _dispatcher.default.dispatch({
      action: 'view_room_directory'
    });
  },
  onSearchClick: function () {
    this.setState({
      searching: !this.state.searching,
      showingPinned: false
    });
  },
  onCancelSearchClick: function () {
    this.setState({
      searching: false,
      searchResults: null
    });
  },
  // jump down to the bottom of this room, where new events are arriving
  jumpToLiveTimeline: function () {
    this._messagePanel.jumpToLiveTimeline();

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  },
  // jump up to wherever our read marker is
  jumpToReadMarker: function () {
    this._messagePanel.jumpToReadMarker();
  },
  // update the read marker to match the read-receipt
  forgetReadMarker: function (ev) {
    ev.stopPropagation();

    this._messagePanel.forgetReadMarker();
  },
  // decide whether or not the top 'unread messages' bar should be shown
  _updateTopUnreadMessagesBar: function () {
    if (!this._messagePanel) {
      return;
    }

    const showBar = this._messagePanel.canJumpToReadMarker();

    if (this.state.showTopUnreadMessagesBar != showBar) {
      this.setState({
        showTopUnreadMessagesBar: showBar
      });
    }
  },
  // get the current scroll position of the room, so that it can be
  // restored when we switch back to it.
  //
  _getScrollState: function () {
    const messagePanel = this._messagePanel;
    if (!messagePanel) return null; // if we're following the live timeline, we want to return null; that
    // means that, if we switch back, we will jump to the read-up-to mark.
    //
    // That should be more intuitive than slavishly preserving the current
    // scroll state, in the case where the room advances in the meantime
    // (particularly in the case that the user reads some stuff on another
    // device).
    //

    if (this.state.atEndOfLiveTimeline) {
      return null;
    }

    const scrollState = messagePanel.getScrollState(); // getScrollState on TimelinePanel *may* return null, so guard against that

    if (!scrollState || scrollState.stuckAtBottom) {
      // we don't really expect to be in this state, but it will
      // occasionally happen when no scroll state has been set on the
      // messagePanel (ie, we didn't have an initial event (so it's
      // probably a new room), there has been no user-initiated scroll, and
      // no read-receipts have arrived to update the scroll position).
      //
      // Return null, which will cause us to scroll to last unread on
      // reload.
      return null;
    }

    return {
      focussedEvent: scrollState.trackedScrollToken,
      pixelOffset: scrollState.pixelOffset
    };
  },
  onResize: function () {
    // It seems flexbox doesn't give us a way to constrain the auxPanel height to have
    // a minimum of the height of the video element, whilst also capping it from pushing out the page
    // so we have to do it via JS instead.  In this implementation we cap the height by putting
    // a maxHeight on the underlying remote video tag.
    // header + footer + status + give us at least 120px of scrollback at all times.
    let auxPanelMaxHeight = window.innerHeight - (83 + // height of RoomHeader
    36 + // height of the status area
    72 + // minimum height of the message compmoser
    120); // amount of desired scrollback
    // XXX: this is a bit of a hack and might possibly cause the video to push out the page anyway
    // but it's better than the video going missing entirely

    if (auxPanelMaxHeight < 50) auxPanelMaxHeight = 50;
    this.setState({
      auxPanelMaxHeight: auxPanelMaxHeight
    });
  },
  onFullscreenClick: function () {
    _dispatcher.default.dispatch({
      action: 'video_fullscreen',
      fullscreen: true
    }, true);
  },
  onMuteAudioClick: function () {
    const call = this._getCallForRoom();

    if (!call) {
      return;
    }

    const newState = !call.isMicrophoneMuted();
    call.setMicrophoneMuted(newState);
    this.forceUpdate(); // TODO: just update the voip buttons
  },
  onMuteVideoClick: function () {
    const call = this._getCallForRoom();

    if (!call) {
      return;
    }

    const newState = !call.isLocalVideoMuted();
    call.setLocalVideoMuted(newState);
    this.forceUpdate(); // TODO: just update the voip buttons
  },
  onStatusBarVisible: function () {
    if (this.unmounted) return;
    this.setState({
      statusBarVisible: true
    });
  },
  onStatusBarHidden: function () {
    // This is currently not desired as it is annoying if it keeps expanding and collapsing
    if (this.unmounted) return;
    this.setState({
      statusBarVisible: false
    });
  },

  /**
   * called by the parent component when PageUp/Down/etc is pressed.
   *
   * We pass it down to the scroll panel.
   */
  handleScrollKey: function (ev) {
    let panel;

    if (this._searchResultsPanel.current) {
      panel = this._searchResultsPanel.current;
    } else if (this._messagePanel) {
      panel = this._messagePanel;
    }

    if (panel) {
      panel.handleScrollKey(ev);
    }
  },

  /**
   * get any current call for this room
   */
  _getCallForRoom: function () {
    if (!this.state.room) {
      return null;
    }

    return _CallHandler.default.getCallForRoom(this.state.room.roomId);
  },
  // this has to be a proper method rather than an unnamed function,
  // otherwise react calls it with null on each update.
  _gatherTimelinePanelRef: function (r) {
    this._messagePanel = r;

    if (r) {
      console.log("updateTint from RoomView._gatherTimelinePanelRef");
      this.updateTint();
    }
  },
  _getOldRoom: function () {
    const createEvent = this.state.room.currentState.getStateEvents("m.room.create", "");
    if (!createEvent || !createEvent.getContent()['predecessor']) return null;
    return this.context.getRoom(createEvent.getContent()['predecessor']['room_id']);
  },
  _getHiddenHighlightCount: function () {
    const oldRoom = this._getOldRoom();

    if (!oldRoom) return 0;
    return oldRoom.getUnreadNotificationCount('highlight');
  },
  _onHiddenHighlightsClick: function () {
    const oldRoom = this._getOldRoom();

    if (!oldRoom) return;

    _dispatcher.default.dispatch({
      action: "view_room",
      room_id: oldRoom.roomId
    });
  },
  render: function () {
    const RoomHeader = sdk.getComponent('rooms.RoomHeader');
    const ForwardMessage = sdk.getComponent("rooms.ForwardMessage");
    const AuxPanel = sdk.getComponent("rooms.AuxPanel");
    const SearchBar = sdk.getComponent("rooms.SearchBar");
    const PinnedEventsPanel = sdk.getComponent("rooms.PinnedEventsPanel");
    const ScrollPanel = sdk.getComponent("structures.ScrollPanel");
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    const RoomPreviewBar = sdk.getComponent("rooms.RoomPreviewBar");
    const TimelinePanel = sdk.getComponent("structures.TimelinePanel");
    const RoomUpgradeWarningBar = sdk.getComponent("rooms.RoomUpgradeWarningBar");
    const RoomRecoveryReminder = sdk.getComponent("rooms.RoomRecoveryReminder");
    const ErrorBoundary = sdk.getComponent("elements.ErrorBoundary");

    if (!this.state.room) {
      const loading = this.state.roomLoading || this.state.peekLoading;

      if (loading) {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView"
        }, /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(RoomPreviewBar, {
          canPreview: false,
          previewLoading: this.state.peekLoading,
          error: this.state.roomLoadError,
          loading: loading,
          joining: this.state.joining,
          oobData: this.props.oobData
        })));
      } else {
        var inviterName = undefined;

        if (this.props.oobData) {
          inviterName = this.props.oobData.inviterName;
        }

        var invitedEmail = undefined;

        if (this.props.thirdPartyInvite) {
          invitedEmail = this.props.thirdPartyInvite.invitedEmail;
        } // We have no room object for this room, only the ID.
        // We've got to this room by following a link, possibly a third party invite.


        const roomAlias = this.state.roomAlias;
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView"
        }, /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(RoomPreviewBar, {
          onJoinClick: this.onJoinButtonClicked,
          onForgetClick: this.onForgetClick,
          onRejectClick: this.onRejectThreepidInviteButtonClicked,
          canPreview: false,
          error: this.state.roomLoadError,
          roomAlias: roomAlias,
          joining: this.state.joining,
          inviterName: inviterName,
          invitedEmail: invitedEmail,
          oobData: this.props.oobData,
          signUrl: this.props.thirdPartyInvite ? this.props.thirdPartyInvite.inviteSignUrl : null,
          room: this.state.room
        })));
      }
    }

    const myMembership = this.state.room.getMyMembership();

    if (myMembership == 'invite') {
      if (this.state.joining || this.state.rejecting) {
        return /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(RoomPreviewBar, {
          canPreview: false,
          error: this.state.roomLoadError,
          joining: this.state.joining,
          rejecting: this.state.rejecting
        }));
      } else {
        const myUserId = this.context.credentials.userId;
        const myMember = this.state.room.getMember(myUserId);
        const inviteEvent = myMember ? myMember.events.member : null;
        let inviterName = (0, _languageHandler._t)("Unknown");

        if (inviteEvent) {
          inviterName = inviteEvent.sender ? inviteEvent.sender.name : inviteEvent.getSender();
        } // We deliberately don't try to peek into invites, even if we have permission to peek
        // as they could be a spam vector.
        // XXX: in future we could give the option of a 'Preview' button which lets them view anyway.
        // We have a regular invite for this room.


        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView"
        }, /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(RoomPreviewBar, {
          onJoinClick: this.onJoinButtonClicked,
          onForgetClick: this.onForgetClick,
          onRejectClick: this.onRejectButtonClicked,
          onRejectAndIgnoreClick: this.onRejectAndIgnoreClick,
          inviterName: inviterName,
          canPreview: false,
          joining: this.state.joining,
          room: this.state.room
        })));
      }
    } // We have successfully loaded this room, and are not previewing.
    // Display the "normal" room view.


    const call = this._getCallForRoom();

    let inCall = false;

    if (call && this.state.callState !== 'ended' && this.state.callState !== 'ringing') {
      inCall = true;
    }

    const scrollheader_classes = (0, _classnames.default)({
      mx_RoomView_scrollheader: true
    });
    let statusBar;
    let isStatusAreaExpanded = true;

    if (_ContentMessages.default.sharedInstance().getCurrentUploads().length > 0) {
      const UploadBar = sdk.getComponent('structures.UploadBar');
      statusBar = /*#__PURE__*/_react.default.createElement(UploadBar, {
        room: this.state.room
      });
    } else if (!this.state.searchResults) {
      const RoomStatusBar = sdk.getComponent('structures.RoomStatusBar');
      isStatusAreaExpanded = this.state.statusBarVisible;
      statusBar = /*#__PURE__*/_react.default.createElement(RoomStatusBar, {
        room: this.state.room,
        sentMessageAndIsAlone: this.state.isAlone,
        hasActiveCall: inCall,
        isPeeking: myMembership !== "join",
        onInviteClick: this.onInviteButtonClick,
        onStopWarningClick: this.onStopAloneWarningClick,
        onVisible: this.onStatusBarVisible,
        onHidden: this.onStatusBarHidden
      });
    }

    const roomVersionRecommendation = this.state.upgradeRecommendation;
    const showRoomUpgradeBar = roomVersionRecommendation && roomVersionRecommendation.needsUpgrade && this.state.room.userMayUpgradeRoom(this.context.credentials.userId);
    const showRoomRecoveryReminder = _SettingsStore.default.getValue("showRoomRecoveryReminder") && this.context.isRoomEncrypted(this.state.room.roomId) && this.context.getKeyBackupEnabled() === false;

    const hiddenHighlightCount = this._getHiddenHighlightCount();

    let aux = null;
    let previewBar;
    let hideCancel = false;
    let forceHideRightPanel = false;

    if (this.state.forwardingEvent !== null) {
      aux = /*#__PURE__*/_react.default.createElement(ForwardMessage, {
        onCancelClick: this.onCancelClick
      });
    } else if (this.state.searching) {
      hideCancel = true; // has own cancel

      aux = /*#__PURE__*/_react.default.createElement(SearchBar, {
        searchInProgress: this.state.searchInProgress,
        onCancelClick: this.onCancelSearchClick,
        onSearch: this.onSearch
      });
    } else if (showRoomUpgradeBar) {
      aux = /*#__PURE__*/_react.default.createElement(RoomUpgradeWarningBar, {
        room: this.state.room,
        recommendation: roomVersionRecommendation
      });
      hideCancel = true;
    } else if (showRoomRecoveryReminder) {
      aux = /*#__PURE__*/_react.default.createElement(RoomRecoveryReminder, {
        onDontAskAgainSet: this.onRoomRecoveryReminderDontAskAgain
      });
      hideCancel = true;
    } else if (this.state.showingPinned) {
      hideCancel = true; // has own cancel

      aux = /*#__PURE__*/_react.default.createElement(PinnedEventsPanel, {
        room: this.state.room,
        onCancelClick: this.onPinnedClick
      });
    } else if (myMembership !== "join") {
      // We do have a room object for this room, but we're not currently in it.
      // We may have a 3rd party invite to it.
      var inviterName = undefined;

      if (this.props.oobData) {
        inviterName = this.props.oobData.inviterName;
      }

      var invitedEmail = undefined;

      if (this.props.thirdPartyInvite) {
        invitedEmail = this.props.thirdPartyInvite.invitedEmail;
      }

      hideCancel = true;
      previewBar = /*#__PURE__*/_react.default.createElement(RoomPreviewBar, {
        onJoinClick: this.onJoinButtonClicked,
        onForgetClick: this.onForgetClick,
        onRejectClick: this.onRejectThreepidInviteButtonClicked,
        joining: this.state.joining,
        inviterName: inviterName,
        invitedEmail: invitedEmail,
        oobData: this.props.oobData,
        canPreview: this.state.canPeek,
        room: this.state.room
      });

      if (!this.state.canPeek) {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView"
        }, previewBar);
      } else {
        forceHideRightPanel = true;
      }
    } else if (hiddenHighlightCount > 0) {
      aux = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        element: "div",
        className: "mx_RoomView_auxPanel_hiddenHighlights",
        onClick: this._onHiddenHighlightsClick
      }, (0, _languageHandler._t)("You have %(count)s unread notifications in a prior version of this room.", {
        count: hiddenHighlightCount
      }));
    }

    const auxPanel = /*#__PURE__*/_react.default.createElement(AuxPanel, {
      room: this.state.room,
      fullHeight: false,
      userId: this.context.credentials.userId,
      conferenceHandler: this.props.ConferenceHandler,
      draggingFile: this.state.draggingFile,
      displayConfCallNotification: this.state.displayConfCallNotification,
      maxHeight: this.state.auxPanelMaxHeight,
      showApps: this.state.showApps,
      hideAppsDrawer: false
    }, aux);

    let messageComposer;
    let searchInfo;
    const canSpeak = // joined and not showing search results
    myMembership === 'join' && !this.state.searchResults;

    if (canSpeak) {
      const MessageComposer = sdk.getComponent('rooms.MessageComposer');
      messageComposer = /*#__PURE__*/_react.default.createElement(MessageComposer, {
        room: this.state.room,
        callState: this.state.callState,
        disabled: this.props.disabled,
        showApps: this.state.showApps,
        e2eStatus: this.state.e2eStatus,
        permalinkCreator: this._getPermalinkCreatorForRoom(this.state.room)
      });
    } // TODO: Why aren't we storing the term/scope/count in this format
    // in this.state if this is what RoomHeader desires?


    if (this.state.searchResults) {
      searchInfo = {
        searchTerm: this.state.searchTerm,
        searchScope: this.state.searchScope,
        searchCount: this.state.searchResults.count
      };
    }

    if (inCall) {
      let zoomButton;
      let voiceMuteButton;
      let videoMuteButton;

      if (call.type === "video") {
        zoomButton = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView_voipButton",
          onClick: this.onFullscreenClick,
          title: (0, _languageHandler._t)("Fill screen")
        }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
          src: require("../../../res/img/fullscreen.svg"),
          width: "29",
          height: "22",
          style: {
            marginTop: 1,
            marginRight: 4
          }
        }));
        videoMuteButton = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView_voipButton",
          onClick: this.onMuteVideoClick
        }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
          src: call.isLocalVideoMuted() ? require("../../../res/img/video-unmute.svg") : require("../../../res/img/video-mute.svg"),
          alt: call.isLocalVideoMuted() ? (0, _languageHandler._t)("Click to unmute video") : (0, _languageHandler._t)("Click to mute video"),
          width: "31",
          height: "27"
        }));
      }

      voiceMuteButton = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_voipButton",
        onClick: this.onMuteAudioClick
      }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
        src: call.isMicrophoneMuted() ? require("../../../res/img/voice-unmute.svg") : require("../../../res/img/voice-mute.svg"),
        alt: call.isMicrophoneMuted() ? (0, _languageHandler._t)("Click to unmute audio") : (0, _languageHandler._t)("Click to mute audio"),
        width: "21",
        height: "26"
      })); // wrap the existing status bar into a 'callStatusBar' which adds more knobs.

      statusBar = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_callStatusBar"
      }, voiceMuteButton, videoMuteButton, zoomButton, statusBar, /*#__PURE__*/_react.default.createElement(TintableSvg, {
        className: "mx_RoomView_voipChevron",
        src: require("../../../res/img/voip-chevron.svg"),
        width: "22",
        height: "17"
      }));
    } // if we have search results, we keep the messagepanel (so that it preserves its
    // scroll state), but hide it.


    let searchResultsPanel;
    let hideMessagePanel = false;

    if (this.state.searchResults) {
      // show searching spinner
      if (this.state.searchResults.results === undefined) {
        searchResultsPanel = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomView_messagePanel mx_RoomView_messagePanelSearchSpinner"
        });
      } else {
        searchResultsPanel = /*#__PURE__*/_react.default.createElement(ScrollPanel, {
          ref: this._searchResultsPanel,
          className: "mx_RoomView_messagePanel mx_RoomView_searchResultsPanel",
          onFillRequest: this.onSearchResultsFillRequest,
          resizeNotifier: this.props.resizeNotifier
        }, /*#__PURE__*/_react.default.createElement("li", {
          className: scrollheader_classes
        }), this.getSearchResultTiles());
      }

      hideMessagePanel = true;
    }

    const shouldHighlight = this.state.isInitialEventHighlighted;
    let highlightedEventId = null;

    if (this.state.forwardingEvent) {
      highlightedEventId = this.state.forwardingEvent.getId();
    } else if (shouldHighlight) {
      highlightedEventId = this.state.initialEventId;
    } // console.info("ShowUrlPreview for %s is %s", this.state.room.roomId, this.state.showUrlPreview);


    const messagePanel = /*#__PURE__*/_react.default.createElement(TimelinePanel, {
      ref: this._gatherTimelinePanelRef,
      timelineSet: this.state.room.getUnfilteredTimelineSet(),
      showReadReceipts: this.state.showReadReceipts,
      manageReadReceipts: !this.state.isPeeking,
      manageReadMarkers: !this.state.isPeeking,
      hidden: hideMessagePanel,
      highlightedEventId: highlightedEventId,
      eventId: this.state.initialEventId,
      eventPixelOffset: this.state.initialEventPixelOffset,
      onScroll: this.onMessageListScroll,
      onReadMarkerUpdated: this._updateTopUnreadMessagesBar,
      showUrlPreview: this.state.showUrlPreview,
      className: "mx_RoomView_messagePanel",
      membersLoaded: this.state.membersLoaded,
      permalinkCreator: this._getPermalinkCreatorForRoom(this.state.room),
      resizeNotifier: this.props.resizeNotifier,
      showReactions: true
    });

    let topUnreadMessagesBar = null; // Do not show TopUnreadMessagesBar if we have search results showing, it makes no sense

    if (this.state.showTopUnreadMessagesBar && !this.state.searchResults) {
      const TopUnreadMessagesBar = sdk.getComponent('rooms.TopUnreadMessagesBar');
      topUnreadMessagesBar = /*#__PURE__*/_react.default.createElement(TopUnreadMessagesBar, {
        onScrollUpClick: this.jumpToReadMarker,
        onCloseClick: this.forgetReadMarker
      });
    }

    let jumpToBottom; // Do not show JumpToBottomButton if we have search results showing, it makes no sense

    if (!this.state.atEndOfLiveTimeline && !this.state.searchResults) {
      const JumpToBottomButton = sdk.getComponent('rooms.JumpToBottomButton');
      jumpToBottom = /*#__PURE__*/_react.default.createElement(JumpToBottomButton, {
        numUnreadMessages: this.state.numUnreadMessages,
        onScrollToBottomClick: this.jumpToLiveTimeline
      });
    }

    const statusBarAreaClass = (0, _classnames.default)("mx_RoomView_statusArea", {
      "mx_RoomView_statusArea_expanded": isStatusAreaExpanded
    });
    const fadableSectionClasses = (0, _classnames.default)("mx_RoomView_body", "mx_fadable", {
      "mx_fadable_faded": this.props.disabled
    });
    const showRightPanel = !forceHideRightPanel && this.state.room && this.state.showRightPanel;
    const rightPanel = showRightPanel ? /*#__PURE__*/_react.default.createElement(_RightPanel.default, {
      roomId: this.state.room.roomId,
      resizeNotifier: this.props.resizeNotifier
    }) : null;
    const timelineClasses = (0, _classnames.default)("mx_RoomView_timeline", {
      mx_RoomView_timeline_rr_enabled: this.state.showReadReceipts
    });
    const mainClasses = (0, _classnames.default)("mx_RoomView", {
      mx_RoomView_inCall: inCall
    });
    return /*#__PURE__*/_react.default.createElement(_RoomContext.default.Provider, {
      value: this.state
    }, /*#__PURE__*/_react.default.createElement("main", {
      className: mainClasses,
      ref: this._roomView,
      onKeyDown: this.onReactKeyDown
    }, /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(RoomHeader, {
      room: this.state.room,
      searchInfo: searchInfo,
      oobData: this.props.oobData,
      inRoom: myMembership === 'join',
      onSearchClick: this.onSearchClick,
      onSettingsClick: this.onSettingsClick,
      onPinnedClick: this.onPinnedClick,
      onCancelClick: aux && !hideCancel ? this.onCancelClick : null,
      onForgetClick: myMembership === "leave" ? this.onForgetClick : null,
      onLeaveClick: myMembership === "join" ? this.onLeaveClick : null,
      e2eStatus: this.state.e2eStatus
    }), /*#__PURE__*/_react.default.createElement(_MainSplit.default, {
      panel: rightPanel,
      resizeNotifier: this.props.resizeNotifier
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: fadableSectionClasses
    }, auxPanel, /*#__PURE__*/_react.default.createElement("div", {
      className: timelineClasses
    }, topUnreadMessagesBar, jumpToBottom, messagePanel, searchResultsPanel), /*#__PURE__*/_react.default.createElement("div", {
      className: statusBarAreaClass
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomView_statusAreaBox"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomView_statusAreaBox_line"
    }), statusBar)), previewBar, messageComposer)))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvUm9vbVZpZXcuanMiXSwibmFtZXMiOlsiREVCVUciLCJkZWJ1Z2xvZyIsIkJST1dTRVJfU1VQUE9SVFNfU0FOREJPWCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNvbnNvbGUiLCJsb2ciLCJiaW5kIiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJDb25mZXJlbmNlSGFuZGxlciIsIlByb3BUeXBlcyIsImFueSIsIm9uUmVnaXN0ZXJlZCIsImZ1bmMiLCJ0aGlyZFBhcnR5SW52aXRlIiwib2JqZWN0Iiwib29iRGF0YSIsInZpYVNlcnZlcnMiLCJhcnJheU9mIiwic3RyaW5nIiwic3RhdGljcyIsImNvbnRleHRUeXBlIiwiTWF0cml4Q2xpZW50Q29udGV4dCIsImdldEluaXRpYWxTdGF0ZSIsImxsTWVtYmVycyIsImNvbnRleHQiLCJoYXNMYXp5TG9hZE1lbWJlcnNFbmFibGVkIiwicm9vbSIsInJvb21JZCIsInJvb21Mb2FkaW5nIiwicGVla0xvYWRpbmciLCJzaG91bGRQZWVrIiwibWVkaWFDb25maWciLCJ1bmRlZmluZWQiLCJtZW1iZXJzTG9hZGVkIiwiaW5pdGlhbEV2ZW50SWQiLCJpbml0aWFsRXZlbnRQaXhlbE9mZnNldCIsImlzSW5pdGlhbEV2ZW50SGlnaGxpZ2h0ZWQiLCJmb3J3YXJkaW5nRXZlbnQiLCJudW1VbnJlYWRNZXNzYWdlcyIsImRyYWdnaW5nRmlsZSIsInNlYXJjaGluZyIsInNlYXJjaFJlc3VsdHMiLCJjYWxsU3RhdGUiLCJndWVzdHNDYW5Kb2luIiwiY2FuUGVlayIsInNob3dBcHBzIiwiaXNBbG9uZSIsImlzUGVla2luZyIsInNob3dpbmdQaW5uZWQiLCJzaG93UmVhZFJlY2VpcHRzIiwic2hvd1JpZ2h0UGFuZWwiLCJSaWdodFBhbmVsU3RvcmUiLCJnZXRTaGFyZWRJbnN0YW5jZSIsImlzT3BlbkZvclJvb20iLCJyb29tTG9hZEVycm9yIiwiam9pbmluZyIsImF0RW5kT2ZMaXZlVGltZWxpbmUiLCJhdEVuZE9mTGl2ZVRpbWVsaW5lSW5pdCIsInNob3dUb3BVbnJlYWRNZXNzYWdlc0JhciIsImF1eFBhbmVsTWF4SGVpZ2h0Iiwic3RhdHVzQmFyVmlzaWJsZSIsInVwZ3JhZGVSZWNvbW1lbmRhdGlvbiIsImNhblJlYWN0IiwiY2FuUmVwbHkiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJvbiIsIm9uUm9vbSIsIm9uUm9vbVRpbWVsaW5lIiwib25Sb29tTmFtZSIsIm9uUm9vbUFjY291bnREYXRhIiwib25Sb29tU3RhdGVFdmVudHMiLCJvblJvb21TdGF0ZU1lbWJlciIsIm9uTXlNZW1iZXJzaGlwIiwib25BY2NvdW50RGF0YSIsIm9uS2V5QmFja3VwU3RhdHVzIiwib25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkIiwib25Vc2VyVmVyaWZpY2F0aW9uQ2hhbmdlZCIsIm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQiLCJfcm9vbVN0b3JlVG9rZW4iLCJSb29tVmlld1N0b3JlIiwiYWRkTGlzdGVuZXIiLCJfb25Sb29tVmlld1N0b3JlVXBkYXRlIiwiX3JpZ2h0UGFuZWxTdG9yZVRva2VuIiwiX29uUmlnaHRQYW5lbFN0b3JlVXBkYXRlIiwiV2lkZ2V0RWNob1N0b3JlIiwiX29uV2lkZ2V0RWNob1N0b3JlVXBkYXRlIiwiX3Nob3dSZWFkUmVjZWlwdHNXYXRjaFJlZiIsIlNldHRpbmdzU3RvcmUiLCJ3YXRjaFNldHRpbmciLCJfb25SZWFkUmVjZWlwdHNDaGFuZ2UiLCJfcm9vbVZpZXciLCJfc2VhcmNoUmVzdWx0c1BhbmVsIiwic2V0U3RhdGUiLCJnZXRWYWx1ZSIsInN0YXRlIiwiaW5pdGlhbCIsInVubW91bnRlZCIsImdldFJvb21JZCIsIm5ld1N0YXRlIiwicm9vbUFsaWFzIiwiZ2V0Um9vbUFsaWFzIiwiaXNSb29tTG9hZGluZyIsImdldFJvb21Mb2FkRXJyb3IiLCJpc0pvaW5pbmciLCJnZXRJbml0aWFsRXZlbnRJZCIsImdldEZvcndhcmRpbmdFdmVudCIsInN0b3BQZWVraW5nIiwiZ2V0Um9vbSIsIl9zaG91bGRTaG93QXBwcyIsIl9vblJvb21Mb2FkZWQiLCJyb29tU2Nyb2xsU3RhdGUiLCJSb29tU2Nyb2xsU3RhdGVTdG9yZSIsImdldFNjcm9sbFN0YXRlIiwiZm9jdXNzZWRFdmVudCIsInBpeGVsT2Zmc2V0IiwiX3NldHVwUm9vbSIsIl9nZXRSb29tSWQiLCJfZ2V0UGVybWFsaW5rQ3JlYXRvckZvclJvb20iLCJfcGVybWFsaW5rQ3JlYXRvcnMiLCJSb29tUGVybWFsaW5rQ3JlYXRvciIsInN0YXJ0IiwibG9hZCIsIl9zdG9wQWxsUGVybWFsaW5rQ3JlYXRvcnMiLCJPYmplY3QiLCJrZXlzIiwic3RvcCIsInByb3BzIiwiYXV0b0pvaW4iLCJvbkpvaW5CdXR0b25DbGlja2VkIiwiaW5mbyIsInBlZWtJblJvb20iLCJ0aGVuIiwiY2F0Y2giLCJlcnIiLCJlcnJjb2RlIiwiaGlkZVdpZGdldERyYXdlciIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJjb21wb25lbnREaWRNb3VudCIsImNhbGwiLCJfZ2V0Q2FsbEZvclJvb20iLCJjYWxsX3N0YXRlIiwiX3VwZGF0ZUNvbmZDYWxsTm90aWZpY2F0aW9uIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9uUGFnZVVubG9hZCIsInJlc2l6ZU5vdGlmaWVyIiwib25SZXNpemUiLCJvbk5hdGl2ZUtleURvd24iLCJzaG91bGRDb21wb25lbnRVcGRhdGUiLCJuZXh0UHJvcHMiLCJuZXh0U3RhdGUiLCJPYmplY3RVdGlscyIsInNoYWxsb3dFcXVhbCIsImNvbXBvbmVudERpZFVwZGF0ZSIsImN1cnJlbnQiLCJyb29tVmlldyIsIm9uZHJvcCIsIm9uRHJvcCIsIm9uRHJhZ092ZXIiLCJvbkRyYWdMZWF2ZU9yRW5kIiwiX21lc3NhZ2VQYW5lbCIsImlzQXRFbmRPZkxpdmVUaW1lbGluZSIsImNvbXBvbmVudFdpbGxVbm1vdW50Iiwic2V0U2Nyb2xsU3RhdGUiLCJfZ2V0U2Nyb2xsU3RhdGUiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwidW5yZWdpc3RlciIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlIiwidW53YXRjaFNldHRpbmciLCJfdXBkYXRlUm9vbU1lbWJlcnMiLCJjYW5jZWxQZW5kaW5nQ2FsbCIsImV2ZW50IiwiQ29udGVudE1lc3NhZ2VzIiwic2hhcmVkSW5zdGFuY2UiLCJnZXRDdXJyZW50VXBsb2FkcyIsImxlbmd0aCIsInJldHVyblZhbHVlIiwiZXYiLCJoYW5kbGVkIiwiY3RybENtZE9ubHkiLCJrZXkiLCJLZXkiLCJEIiwib25NdXRlQXVkaW9DbGljayIsIkUiLCJvbk11dGVWaWRlb0NsaWNrIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJvblJlYWN0S2V5RG93biIsIkVTQ0FQRSIsImFsdEtleSIsImN0cmxLZXkiLCJzaGlmdEtleSIsIm1ldGFLZXkiLCJmb3JnZXRSZWFkTWFya2VyIiwianVtcFRvTGl2ZVRpbWVsaW5lIiwiUEFHRV9VUCIsImp1bXBUb1JlYWRNYXJrZXIiLCJVIiwidG9VcHBlckNhc2UiLCJkaXNwYXRjaCIsImFjdGlvbiIsInBheWxvYWQiLCJfY2hlY2tJZkFsb25lIiwiaW5qZWN0U3RpY2tlciIsImRhdGEiLCJjb250ZW50IiwidXJsIiwiZGVzY3JpcHRpb24iLCJuYW1lIiwic2VuZENvbnRlbnRMaXN0VG9Sb29tIiwiZmlsZSIsImZvcmNlVXBkYXRlIiwicm9vbV9pZCIsInNob3ciLCJvbkNhbmNlbFNlYXJjaENsaWNrIiwic2V0SW1tZWRpYXRlIiwiZGVmZXJyZWRfYWN0aW9uIiwidG9TdGFydE9mVGltZWxpbmUiLCJyZW1vdmVkIiwidGltZWxpbmUiLCJnZXRUaW1lbGluZVNldCIsImdldFVuZmlsdGVyZWRUaW1lbGluZVNldCIsImdldFR5cGUiLCJfdXBkYXRlUHJldmlld1VybFZpc2liaWxpdHkiLCJfdXBkYXRlRTJFU3RhdHVzIiwibGl2ZUV2ZW50IiwiZ2V0U2VuZGVyIiwiY3JlZGVudGlhbHMiLCJ1c2VySWQiLCJvblJvb21SZWNvdmVyeVJlbWluZGVyRG9udEFza0FnYWluIiwiY2FuUmVzZXRUaW1lbGluZSIsIl9jYWxjdWxhdGVQZWVrUnVsZXMiLCJfbG9hZE1lbWJlcnNJZkpvaW5lZCIsIl9jYWxjdWxhdGVSZWNvbW1lbmRlZFZlcnNpb24iLCJfdXBkYXRlUGVybWlzc2lvbnMiLCJnZXRSZWNvbW1lbmRlZFZlcnNpb24iLCJnZXRNeU1lbWJlcnNoaXAiLCJsb2FkTWVtYmVyc0lmTmVlZGVkIiwiZXJyb3JNZXNzYWdlIiwiZXJyb3IiLCJndWVzdEFjY2Vzc0V2ZW50IiwiY3VycmVudFN0YXRlIiwiZ2V0U3RhdGVFdmVudHMiLCJnZXRDb250ZW50IiwiZ3Vlc3RfYWNjZXNzIiwiaGlzdG9yeVZpc2liaWxpdHkiLCJoaXN0b3J5X3Zpc2liaWxpdHkiLCJpc1Jvb21FbmNyeXB0ZWQiLCJzaG93VXJsUHJldmlldyIsImRldmljZSIsImdldE1lbWJlciIsIl90cnVzdFN0YXR1cyIsImlzQ3J5cHRvRW5hYmxlZCIsImUyZVN0YXR1cyIsImhhc1VudmVyaWZpZWREZXZpY2VzIiwidXBkYXRlVGludCIsImNvbG9yU2NoZW1lIiwiVGludGVyIiwidGludCIsInByaW1hcnlfY29sb3IiLCJzZWNvbmRhcnlfY29sb3IiLCJ0eXBlIiwibWVtYmVyIiwibWVtYmVyc2hpcCIsIm9sZE1lbWJlcnNoaXAiLCJtZSIsImdldFVzZXJJZCIsIm1heVNlbmRFdmVudCIsIm1heVNlbmRNZXNzYWdlIiwiZHVlVG9NZW1iZXIiLCJfdXBkYXRlRE1TdGF0ZSIsIm1lbWJlckNvdW50SW5mbHVlbmNlIiwiZ2V0SW52aXRlZE1lbWJlckNvdW50IiwiY291bnRJbmZsdWVuY2UiLCJ3YXJuZWRBYm91dExvbmVseVJvb20iLCJqb2luZWRPckludml0ZWRNZW1iZXJDb3VudCIsImdldEpvaW5lZE1lbWJlckNvdW50IiwiY29uZk1lbWJlciIsImdldENvbmZlcmVuY2VVc2VySWRGb3JSb29tIiwiY29uZkNhbGwiLCJnZXRDb25mZXJlbmNlQ2FsbEZvclJvb20iLCJkaXNwbGF5Q29uZkNhbGxOb3RpZmljYXRpb24iLCJkbUludml0ZXIiLCJnZXRETUludml0ZXIiLCJSb29tcyIsInNldERNUm9vbSIsIm9uU2VhcmNoUmVzdWx0c0ZpbGxSZXF1ZXN0IiwiYmFja3dhcmRzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJuZXh0X2JhdGNoIiwic2VhcmNoUHJvbWlzZSIsImJhY2tQYWdpbmF0ZVJvb21FdmVudHNTZWFyY2giLCJfaGFuZGxlU2VhcmNoUmVzdWx0Iiwib25JbnZpdGVCdXR0b25DbGljayIsIm9uU3RvcEFsb25lV2FybmluZ0NsaWNrIiwic2V0SXRlbSIsImlzR3Vlc3QiLCJzaWduVXJsIiwiaW52aXRlU2lnblVybCIsIm9wdHMiLCJvbk1lc3NhZ2VMaXN0U2Nyb2xsIiwiX3VwZGF0ZVRvcFVucmVhZE1lc3NhZ2VzQmFyIiwiZGF0YVRyYW5zZmVyIiwiZHJvcEVmZmVjdCIsIml0ZW1zIiwiaXNEcmFnZ2luZ0ZpbGVzIiwiZXZlcnkiLCJpdGVtIiwia2luZCIsImZpbGVzIiwidGV4dCIsInNlbmRTdGlja2VyQ29udGVudFRvUm9vbSIsIm9uU2VhcmNoIiwidGVybSIsInNjb3BlIiwic2VhcmNoVGVybSIsInNlYXJjaFNjb3BlIiwic2VhcmNoSGlnaGxpZ2h0cyIsInJlc2V0U2Nyb2xsU3RhdGUiLCJzZWFyY2hJZCIsIkRhdGUiLCJnZXRUaW1lIiwic2VsZiIsImxvY2FsU2VhcmNoSWQiLCJzZWFyY2hJblByb2dyZXNzIiwicmVzdWx0cyIsImhpZ2hsaWdodHMiLCJpbmRleE9mIiwiY29uY2F0Iiwic29ydCIsImEiLCJiIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsIm1lc3NhZ2UiLCJmaW5hbGx5IiwiZ2V0U2VhcmNoUmVzdWx0VGlsZXMiLCJTZWFyY2hSZXN1bHRUaWxlIiwiU3Bpbm5lciIsInJldCIsInB1c2giLCJvbkhlaWdodENoYW5nZWQiLCJzY3JvbGxQYW5lbCIsImNoZWNrU2Nyb2xsIiwibGFzdFJvb21JZCIsImkiLCJyZXN1bHQiLCJteEV2IiwiZ2V0RXZlbnQiLCJyb29tTmFtZSIsImdldElkIiwicmVzdWx0TGluayIsIm9uUGlubmVkQ2xpY2siLCJub3dTaG93aW5nUGlubmVkIiwic2V0VmFsdWUiLCJTZXR0aW5nTGV2ZWwiLCJST09NX0RFVklDRSIsIm9uU2V0dGluZ3NDbGljayIsIm9uQ2FuY2VsQ2xpY2siLCJvbkxlYXZlQ2xpY2siLCJvbkZvcmdldENsaWNrIiwiZm9yZ2V0IiwiZXJyQ29kZSIsIm9uUmVqZWN0QnV0dG9uQ2xpY2tlZCIsInJlamVjdGluZyIsImxlYXZlIiwibXNnIiwiSlNPTiIsInN0cmluZ2lmeSIsInJlamVjdEVycm9yIiwib25SZWplY3RBbmRJZ25vcmVDbGljayIsIm15TWVtYmVyIiwiaW52aXRlRXZlbnQiLCJldmVudHMiLCJpZ25vcmVkVXNlcnMiLCJnZXRJZ25vcmVkVXNlcnMiLCJzZXRJZ25vcmVkVXNlcnMiLCJvblJlamVjdFRocmVlcGlkSW52aXRlQnV0dG9uQ2xpY2tlZCIsIm9uU2VhcmNoQ2xpY2siLCJzaG93QmFyIiwiY2FuSnVtcFRvUmVhZE1hcmtlciIsIm1lc3NhZ2VQYW5lbCIsInNjcm9sbFN0YXRlIiwic3R1Y2tBdEJvdHRvbSIsInRyYWNrZWRTY3JvbGxUb2tlbiIsImlubmVySGVpZ2h0Iiwib25GdWxsc2NyZWVuQ2xpY2siLCJmdWxsc2NyZWVuIiwiaXNNaWNyb3Bob25lTXV0ZWQiLCJzZXRNaWNyb3Bob25lTXV0ZWQiLCJpc0xvY2FsVmlkZW9NdXRlZCIsInNldExvY2FsVmlkZW9NdXRlZCIsIm9uU3RhdHVzQmFyVmlzaWJsZSIsIm9uU3RhdHVzQmFySGlkZGVuIiwiaGFuZGxlU2Nyb2xsS2V5IiwicGFuZWwiLCJDYWxsSGFuZGxlciIsImdldENhbGxGb3JSb29tIiwiX2dhdGhlclRpbWVsaW5lUGFuZWxSZWYiLCJyIiwiX2dldE9sZFJvb20iLCJjcmVhdGVFdmVudCIsIl9nZXRIaWRkZW5IaWdobGlnaHRDb3VudCIsIm9sZFJvb20iLCJnZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCIsIl9vbkhpZGRlbkhpZ2hsaWdodHNDbGljayIsInJlbmRlciIsIlJvb21IZWFkZXIiLCJGb3J3YXJkTWVzc2FnZSIsIkF1eFBhbmVsIiwiU2VhcmNoQmFyIiwiUGlubmVkRXZlbnRzUGFuZWwiLCJTY3JvbGxQYW5lbCIsIlRpbnRhYmxlU3ZnIiwiUm9vbVByZXZpZXdCYXIiLCJUaW1lbGluZVBhbmVsIiwiUm9vbVVwZ3JhZGVXYXJuaW5nQmFyIiwiUm9vbVJlY292ZXJ5UmVtaW5kZXIiLCJFcnJvckJvdW5kYXJ5IiwibG9hZGluZyIsImludml0ZXJOYW1lIiwiaW52aXRlZEVtYWlsIiwibXlNZW1iZXJzaGlwIiwibXlVc2VySWQiLCJzZW5kZXIiLCJpbkNhbGwiLCJzY3JvbGxoZWFkZXJfY2xhc3NlcyIsIm14X1Jvb21WaWV3X3Njcm9sbGhlYWRlciIsInN0YXR1c0JhciIsImlzU3RhdHVzQXJlYUV4cGFuZGVkIiwiVXBsb2FkQmFyIiwiUm9vbVN0YXR1c0JhciIsInJvb21WZXJzaW9uUmVjb21tZW5kYXRpb24iLCJzaG93Um9vbVVwZ3JhZGVCYXIiLCJuZWVkc1VwZ3JhZGUiLCJ1c2VyTWF5VXBncmFkZVJvb20iLCJzaG93Um9vbVJlY292ZXJ5UmVtaW5kZXIiLCJnZXRLZXlCYWNrdXBFbmFibGVkIiwiaGlkZGVuSGlnaGxpZ2h0Q291bnQiLCJhdXgiLCJwcmV2aWV3QmFyIiwiaGlkZUNhbmNlbCIsImZvcmNlSGlkZVJpZ2h0UGFuZWwiLCJjb3VudCIsImF1eFBhbmVsIiwibWVzc2FnZUNvbXBvc2VyIiwic2VhcmNoSW5mbyIsImNhblNwZWFrIiwiTWVzc2FnZUNvbXBvc2VyIiwiZGlzYWJsZWQiLCJzZWFyY2hDb3VudCIsInpvb21CdXR0b24iLCJ2b2ljZU11dGVCdXR0b24iLCJ2aWRlb011dGVCdXR0b24iLCJyZXF1aXJlIiwibWFyZ2luVG9wIiwibWFyZ2luUmlnaHQiLCJzZWFyY2hSZXN1bHRzUGFuZWwiLCJoaWRlTWVzc2FnZVBhbmVsIiwic2hvdWxkSGlnaGxpZ2h0IiwiaGlnaGxpZ2h0ZWRFdmVudElkIiwidG9wVW5yZWFkTWVzc2FnZXNCYXIiLCJUb3BVbnJlYWRNZXNzYWdlc0JhciIsImp1bXBUb0JvdHRvbSIsIkp1bXBUb0JvdHRvbUJ1dHRvbiIsInN0YXR1c0JhckFyZWFDbGFzcyIsImZhZGFibGVTZWN0aW9uQ2xhc3NlcyIsInJpZ2h0UGFuZWwiLCJ0aW1lbGluZUNsYXNzZXMiLCJteF9Sb29tVmlld190aW1lbGluZV9ycl9lbmFibGVkIiwibWFpbkNsYXNzZXMiLCJteF9Sb29tVmlld19pbkNhbGwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBdUJBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhEQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBO0FBQ0E7QUFDQTtBQXFDQSxNQUFNQSxLQUFLLEdBQUcsS0FBZDs7QUFDQSxJQUFJQyxRQUFRLEdBQUcsWUFBVyxDQUFFLENBQTVCOztBQUVBLE1BQU1DLHdCQUF3QixJQUFHLGFBQWFDLFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixRQUF2QixDQUFoQixDQUE5Qjs7QUFFQSxJQUFJSixLQUFKLEVBQVc7QUFDUDtBQUNBQyxFQUFBQSxRQUFRLEdBQUdJLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxJQUFaLENBQWlCRixPQUFqQixDQUFYO0FBQ0g7O2VBRWMsK0JBQWlCO0FBQzVCRyxFQUFBQSxXQUFXLEVBQUUsVUFEZTtBQUU1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLGlCQUFpQixFQUFFQyxtQkFBVUMs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LENBUkosRUFjS1ksVUFkTCxFQWVLSyxlQWZMLENBSkosQ0FkSixDQURKLENBREosQ0FESjtBQTJDSDtBQXgrRDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBUT0RPOiBUaGlzIGNvbXBvbmVudCBpcyBlbm9ybW91cyEgVGhlcmUncyBzZXZlcmFsIHRoaW5ncyB3aGljaCBjb3VsZCBzdGFuZC1hbG9uZTpcbi8vICAtIFNlYXJjaCByZXN1bHRzIGNvbXBvbmVudFxuLy8gIC0gRHJhZyBhbmQgZHJvcFxuXG5pbXBvcnQgc2hvdWxkSGlkZUV2ZW50IGZyb20gJy4uLy4uL3Nob3VsZEhpZGVFdmVudCc7XG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7Um9vbVBlcm1hbGlua0NyZWF0b3J9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rcyc7XG5cbmltcG9ydCBDb250ZW50TWVzc2FnZXMgZnJvbSAnLi4vLi4vQ29udGVudE1lc3NhZ2VzJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi9Nb2RhbCc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vaW5kZXgnO1xuaW1wb3J0IENhbGxIYW5kbGVyIGZyb20gJy4uLy4uL0NhbGxIYW5kbGVyJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCBUaW50ZXIgZnJvbSAnLi4vLi4vVGludGVyJztcbmltcG9ydCByYXRlX2xpbWl0ZWRfZnVuYyBmcm9tICcuLi8uLi9yYXRlbGltaXRlZGZ1bmMnO1xuaW1wb3J0ICogYXMgT2JqZWN0VXRpbHMgZnJvbSAnLi4vLi4vT2JqZWN0VXRpbHMnO1xuaW1wb3J0ICogYXMgUm9vbXMgZnJvbSAnLi4vLi4vUm9vbXMnO1xuaW1wb3J0IGV2ZW50U2VhcmNoIGZyb20gJy4uLy4uL1NlYXJjaGluZyc7XG5cbmltcG9ydCB7aXNPbmx5Q3RybE9yQ21kSWdub3JlU2hpZnRLZXlFdmVudCwgaXNPbmx5Q3RybE9yQ21kS2V5RXZlbnQsIEtleX0gZnJvbSAnLi4vLi4vS2V5Ym9hcmQnO1xuXG5pbXBvcnQgTWFpblNwbGl0IGZyb20gJy4vTWFpblNwbGl0JztcbmltcG9ydCBSaWdodFBhbmVsIGZyb20gJy4vUmlnaHRQYW5lbCc7XG5pbXBvcnQgUm9vbVZpZXdTdG9yZSBmcm9tICcuLi8uLi9zdG9yZXMvUm9vbVZpZXdTdG9yZSc7XG5pbXBvcnQgUm9vbVNjcm9sbFN0YXRlU3RvcmUgZnJvbSAnLi4vLi4vc3RvcmVzL1Jvb21TY3JvbGxTdGF0ZVN0b3JlJztcbmltcG9ydCBXaWRnZXRFY2hvU3RvcmUgZnJvbSAnLi4vLi4vc3RvcmVzL1dpZGdldEVjaG9TdG9yZSc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi92aWV3cy9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQgUmlnaHRQYW5lbFN0b3JlIGZyb20gXCIuLi8uLi9zdG9yZXMvUmlnaHRQYW5lbFN0b3JlXCI7XG5pbXBvcnQge2hhdmVUaWxlRm9yRXZlbnR9IGZyb20gXCIuLi92aWV3cy9yb29tcy9FdmVudFRpbGVcIjtcbmltcG9ydCBSb29tQ29udGV4dCBmcm9tIFwiLi4vLi4vY29udGV4dHMvUm9vbUNvbnRleHRcIjtcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5pbXBvcnQgeyBzaGllbGRTdGF0dXNGb3JSb29tIH0gZnJvbSAnLi4vLi4vdXRpbHMvU2hpZWxkVXRpbHMnO1xuXG5jb25zdCBERUJVRyA9IGZhbHNlO1xubGV0IGRlYnVnbG9nID0gZnVuY3Rpb24oKSB7fTtcblxuY29uc3QgQlJPV1NFUl9TVVBQT1JUU19TQU5EQk9YID0gJ3NhbmRib3gnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuXG5pZiAoREVCVUcpIHtcbiAgICAvLyB1c2luZyBiaW5kIG1lYW5zIHRoYXQgd2UgZ2V0IHRvIGtlZXAgdXNlZnVsIGxpbmUgbnVtYmVycyBpbiB0aGUgY29uc29sZVxuICAgIGRlYnVnbG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSb29tVmlldycsXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIENvbmZlcmVuY2VIYW5kbGVyOiBQcm9wVHlwZXMuYW55LFxuXG4gICAgICAgIC8vIENhbGxlZCB3aXRoIHRoZSBjcmVkZW50aWFscyBvZiBhIHJlZ2lzdGVyZWQgdXNlciAoaWYgdGhleSB3ZXJlIGEgUk9VIHRoYXRcbiAgICAgICAgLy8gdHJhbnNpdGlvbmVkIHRvIFBXTFUpXG4gICAgICAgIG9uUmVnaXN0ZXJlZDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIHRoaXJkIHBhcnR5IGludml0ZSB0byBqb2luIHRoaXMgcm9vbVxuICAgICAgICAvLyBGaWVsZHM6XG4gICAgICAgIC8vICogaW52aXRlU2lnblVybCAoc3RyaW5nKSBUaGUgVVJMIHVzZWQgdG8gam9pbiB0aGlzIHJvb20gZnJvbSBhbiBlbWFpbCBpbnZpdGVcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgIChnaXZlbiBhcyBwYXJ0IG9mIHRoZSBsaW5rIGluIHRoZSBpbnZpdGUgZW1haWwpXG4gICAgICAgIC8vICogaW52aXRlZEVtYWlsIChzdHJpbmcpIFRoZSBlbWFpbCBhZGRyZXNzIHRoYXQgd2FzIGludml0ZWQgdG8gdGhpcyByb29tXG4gICAgICAgIHRoaXJkUGFydHlJbnZpdGU6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLy8gQW55IGRhdGEgYWJvdXQgdGhlIHJvb20gdGhhdCB3b3VsZCBub3JtYWxseSBjb21lIGZyb20gdGhlIGhvbWVzZXJ2ZXJcbiAgICAgICAgLy8gYnV0IGhhcyBiZWVuIHBhc3NlZCBvdXQtb2YtYmFuZCwgZWcuIHRoZSByb29tIG5hbWUgYW5kIGF2YXRhciBVUkxcbiAgICAgICAgLy8gZnJvbSBhbiBlbWFpbCBpbnZpdGUgKGEgd29ya2Fyb3VuZCBmb3IgdGhlIGZhY3QgdGhhdCB3ZSBjYW4ndFxuICAgICAgICAvLyBnZXQgdGhpcyBpbmZvcm1hdGlvbiBmcm9tIHRoZSBIUyB1c2luZyBhbiBlbWFpbCBpbnZpdGUpLlxuICAgICAgICAvLyBGaWVsZHM6XG4gICAgICAgIC8vICAqIG5hbWUgKHN0cmluZykgVGhlIHJvb20ncyBuYW1lXG4gICAgICAgIC8vICAqIGF2YXRhclVybCAoc3RyaW5nKSBUaGUgbXhjOi8vIGF2YXRhciBVUkwgZm9yIHRoZSByb29tXG4gICAgICAgIC8vICAqIGludml0ZXJOYW1lIChzdHJpbmcpIFRoZSBkaXNwbGF5IG5hbWUgb2YgdGhlIHBlcnNvbiB3aG9cbiAgICAgICAgLy8gICogICAgICAgICAgICAgICAgICAgICAgaW52aXRlZCB1cyB0byB0aGUgcm9vbVxuICAgICAgICBvb2JEYXRhOiBQcm9wVHlwZXMub2JqZWN0LFxuXG4gICAgICAgIC8vIFNlcnZlcnMgdGhlIFJvb21WaWV3IGNhbiB1c2UgdG8gdHJ5IGFuZCBhc3Npc3Qgam9pbnNcbiAgICAgICAgdmlhU2VydmVyczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZyksXG4gICAgfSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgY29udGV4dFR5cGU6IE1hdHJpeENsaWVudENvbnRleHQsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGxsTWVtYmVycyA9IHRoaXMuY29udGV4dC5oYXNMYXp5TG9hZE1lbWJlcnNFbmFibGVkKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb29tOiBudWxsLFxuICAgICAgICAgICAgcm9vbUlkOiBudWxsLFxuICAgICAgICAgICAgcm9vbUxvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICBwZWVrTG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBzaG91bGRQZWVrOiB0cnVlLFxuXG4gICAgICAgICAgICAvLyBNZWRpYSBsaW1pdHMgZm9yIHVwbG9hZGluZy5cbiAgICAgICAgICAgIG1lZGlhQ29uZmlnOiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIC8vIHVzZWQgdG8gdHJpZ2dlciBhIHJlcmVuZGVyIGluIFRpbWVsaW5lUGFuZWwgb25jZSB0aGUgbWVtYmVycyBhcmUgbG9hZGVkLFxuICAgICAgICAgICAgLy8gc28gUlIgYXJlIHJlbmRlcmVkIGFnYWluIChub3cgd2l0aCB0aGUgbWVtYmVycyBhdmFpbGFibGUpLCAuLi5cbiAgICAgICAgICAgIG1lbWJlcnNMb2FkZWQ6ICFsbE1lbWJlcnMsXG4gICAgICAgICAgICAvLyBUaGUgZXZlbnQgdG8gYmUgc2Nyb2xsZWQgdG8gaW5pdGlhbGx5XG4gICAgICAgICAgICBpbml0aWFsRXZlbnRJZDogbnVsbCxcbiAgICAgICAgICAgIC8vIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZyb20gdGhlIGV2ZW50IHdpdGggd2hpY2ggdG8gc2Nyb2xsIHZlcnRpY2FsbHlcbiAgICAgICAgICAgIGluaXRpYWxFdmVudFBpeGVsT2Zmc2V0OiBudWxsLFxuICAgICAgICAgICAgLy8gV2hldGhlciB0byBoaWdobGlnaHQgdGhlIGV2ZW50IHNjcm9sbGVkIHRvXG4gICAgICAgICAgICBpc0luaXRpYWxFdmVudEhpZ2hsaWdodGVkOiBudWxsLFxuXG4gICAgICAgICAgICBmb3J3YXJkaW5nRXZlbnQ6IG51bGwsXG4gICAgICAgICAgICBudW1VbnJlYWRNZXNzYWdlczogMCxcbiAgICAgICAgICAgIGRyYWdnaW5nRmlsZTogZmFsc2UsXG4gICAgICAgICAgICBzZWFyY2hpbmc6IGZhbHNlLFxuICAgICAgICAgICAgc2VhcmNoUmVzdWx0czogbnVsbCxcbiAgICAgICAgICAgIGNhbGxTdGF0ZTogbnVsbCxcbiAgICAgICAgICAgIGd1ZXN0c0NhbkpvaW46IGZhbHNlLFxuICAgICAgICAgICAgY2FuUGVlazogZmFsc2UsXG4gICAgICAgICAgICBzaG93QXBwczogZmFsc2UsXG4gICAgICAgICAgICBpc0Fsb25lOiBmYWxzZSxcbiAgICAgICAgICAgIGlzUGVla2luZzogZmFsc2UsXG4gICAgICAgICAgICBzaG93aW5nUGlubmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dSZWFkUmVjZWlwdHM6IHRydWUsXG4gICAgICAgICAgICBzaG93UmlnaHRQYW5lbDogUmlnaHRQYW5lbFN0b3JlLmdldFNoYXJlZEluc3RhbmNlKCkuaXNPcGVuRm9yUm9vbSxcblxuICAgICAgICAgICAgLy8gZXJyb3Igb2JqZWN0LCBhcyBmcm9tIHRoZSBtYXRyaXggY2xpZW50L3NlcnZlciBBUElcbiAgICAgICAgICAgIC8vIElmIHdlIGZhaWxlZCB0byBsb2FkIGluZm9ybWF0aW9uIGFib3V0IHRoZSByb29tLFxuICAgICAgICAgICAgLy8gc3RvcmUgdGhlIGVycm9yIGhlcmUuXG4gICAgICAgICAgICByb29tTG9hZEVycm9yOiBudWxsLFxuXG4gICAgICAgICAgICAvLyBIYXZlIHdlIHNlbnQgYSByZXF1ZXN0IHRvIGpvaW4gdGhlIHJvb20gdGhhdCB3ZSdyZSB3YWl0aW5nIHRvIGNvbXBsZXRlP1xuICAgICAgICAgICAgam9pbmluZzogZmFsc2UsXG5cbiAgICAgICAgICAgIC8vIHRoaXMgaXMgdHJ1ZSBpZiB3ZSBhcmUgZnVsbHkgc2Nyb2xsZWQtZG93biwgYW5kIGFyZSBsb29raW5nIGF0XG4gICAgICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBsaXZlIHRpbWVsaW5lLiBJdCBoYXMgdGhlIGVmZmVjdCBvZiBoaWRpbmcgdGhlXG4gICAgICAgICAgICAvLyAnc2Nyb2xsIHRvIGJvdHRvbScga25vYiwgYW1vbmcgYSBjb3VwbGUgb2Ygb3RoZXIgdGhpbmdzLlxuICAgICAgICAgICAgYXRFbmRPZkxpdmVUaW1lbGluZTogdHJ1ZSxcbiAgICAgICAgICAgIGF0RW5kT2ZMaXZlVGltZWxpbmVJbml0OiBmYWxzZSwgLy8gdXNlZCBieSBjb21wb25lbnREaWRVcGRhdGUgdG8gYXZvaWQgdW5uZWNlc3NhcnkgY2hlY2tzXG5cbiAgICAgICAgICAgIHNob3dUb3BVbnJlYWRNZXNzYWdlc0JhcjogZmFsc2UsXG5cbiAgICAgICAgICAgIGF1eFBhbmVsTWF4SGVpZ2h0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIHN0YXR1c0JhclZpc2libGU6IGZhbHNlLFxuXG4gICAgICAgICAgICAvLyBXZSBsb2FkIHRoaXMgbGF0ZXIgYnkgYXNraW5nIHRoZSBqcy1zZGsgdG8gc3VnZ2VzdCBhIHZlcnNpb24gZm9yIHVzLlxuICAgICAgICAgICAgLy8gVGhpcyBvYmplY3QgaXMgdGhlIHJlc3VsdCBvZiBSb29tI2dldFJlY29tbWVuZGVkVmVyc2lvbigpXG4gICAgICAgICAgICB1cGdyYWRlUmVjb21tZW5kYXRpb246IG51bGwsXG5cbiAgICAgICAgICAgIGNhblJlYWN0OiBmYWxzZSxcbiAgICAgICAgICAgIGNhblJlcGx5OiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2UgY29tcG9uZW50IHdpdGggcmVhbCBjbGFzcywgdXNlIGNvbnN0cnVjdG9yIGZvciByZWZzXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICAgICAgdGhpcy5jb250ZXh0Lm9uKFwiUm9vbVwiLCB0aGlzLm9uUm9vbSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcIlJvb20ubmFtZVwiLCB0aGlzLm9uUm9vbU5hbWUpO1xuICAgICAgICB0aGlzLmNvbnRleHQub24oXCJSb29tLmFjY291bnREYXRhXCIsIHRoaXMub25Sb29tQWNjb3VudERhdGEpO1xuICAgICAgICB0aGlzLmNvbnRleHQub24oXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICB0aGlzLmNvbnRleHQub24oXCJSb29tU3RhdGUubWVtYmVyc1wiLCB0aGlzLm9uUm9vbVN0YXRlTWVtYmVyKTtcbiAgICAgICAgdGhpcy5jb250ZXh0Lm9uKFwiUm9vbS5teU1lbWJlcnNoaXBcIiwgdGhpcy5vbk15TWVtYmVyc2hpcCk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcImFjY291bnREYXRhXCIsIHRoaXMub25BY2NvdW50RGF0YSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcImNyeXB0by5rZXlCYWNrdXBTdGF0dXNcIiwgdGhpcy5vbktleUJhY2t1cFN0YXR1cyk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcImRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWRcIiwgdGhpcy5vbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQpO1xuICAgICAgICB0aGlzLmNvbnRleHQub24oXCJ1c2VyVHJ1c3RTdGF0dXNDaGFuZ2VkXCIsIHRoaXMub25Vc2VyVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbihcImNyb3NzU2lnbmluZy5rZXlzQ2hhbmdlZFwiLCB0aGlzLm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQpO1xuICAgICAgICAvLyBTdGFydCBsaXN0ZW5pbmcgZm9yIFJvb21WaWV3U3RvcmUgdXBkYXRlc1xuICAgICAgICB0aGlzLl9yb29tU3RvcmVUb2tlbiA9IFJvb21WaWV3U3RvcmUuYWRkTGlzdGVuZXIodGhpcy5fb25Sb29tVmlld1N0b3JlVXBkYXRlKTtcbiAgICAgICAgdGhpcy5fcmlnaHRQYW5lbFN0b3JlVG9rZW4gPSBSaWdodFBhbmVsU3RvcmUuZ2V0U2hhcmVkSW5zdGFuY2UoKS5hZGRMaXN0ZW5lcih0aGlzLl9vblJpZ2h0UGFuZWxTdG9yZVVwZGF0ZSk7XG4gICAgICAgIHRoaXMuX29uUm9vbVZpZXdTdG9yZVVwZGF0ZSh0cnVlKTtcblxuICAgICAgICBXaWRnZXRFY2hvU3RvcmUub24oJ3VwZGF0ZScsIHRoaXMuX29uV2lkZ2V0RWNob1N0b3JlVXBkYXRlKTtcbiAgICAgICAgdGhpcy5fc2hvd1JlYWRSZWNlaXB0c1dhdGNoUmVmID0gU2V0dGluZ3NTdG9yZS53YXRjaFNldHRpbmcoXCJzaG93UmVhZFJlY2VpcHRzXCIsIG51bGwsXG4gICAgICAgICAgICB0aGlzLl9vblJlYWRSZWNlaXB0c0NoYW5nZSk7XG5cbiAgICAgICAgdGhpcy5fcm9vbVZpZXcgPSBjcmVhdGVSZWYoKTtcbiAgICAgICAgdGhpcy5fc2VhcmNoUmVzdWx0c1BhbmVsID0gY3JlYXRlUmVmKCk7XG4gICAgfSxcblxuICAgIF9vblJlYWRSZWNlaXB0c0NoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2hvd1JlYWRSZWNlaXB0czogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dSZWFkUmVjZWlwdHNcIiwgdGhpcy5zdGF0ZS5yb29tSWQpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uUm9vbVZpZXdTdG9yZVVwZGF0ZTogZnVuY3Rpb24oaW5pdGlhbCkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaW5pdGlhbCAmJiB0aGlzLnN0YXRlLnJvb21JZCAhPT0gUm9vbVZpZXdTdG9yZS5nZXRSb29tSWQoKSkge1xuICAgICAgICAgICAgLy8gUm9vbVZpZXcgZXhwbGljaXRseSBkb2VzIG5vdCBzdXBwb3J0IGNoYW5naW5nIHdoYXQgcm9vbVxuICAgICAgICAgICAgLy8gaXMgYmVpbmcgdmlld2VkOiBpbnN0ZWFkIGl0IHNob3VsZCBqdXN0IGJlIHJlLW1vdW50ZWQgd2hlblxuICAgICAgICAgICAgLy8gc3dpdGNoaW5nIHJvb21zLiBUaGVyZWZvcmUsIGlmIHRoZSByb29tIElEIGNoYW5nZXMsIHdlXG4gICAgICAgICAgICAvLyBpZ25vcmUgdGhpcy4gV2UgZWl0aGVyIG5lZWQgdG8gZG8gdGhpcyBvciBhZGQgY29kZSB0byBoYW5kbGVcbiAgICAgICAgICAgIC8vIHNhdmluZyB0aGUgc2Nyb2xsIHBvc2l0aW9uIChvdGhlcndpc2Ugd2UgZW5kIHVwIHNhdmluZyB0aGVcbiAgICAgICAgICAgIC8vIHNjcm9sbCBwb3NpdGlvbiBhZ2FpbnN0IHRoZSB3cm9uZyByb29tKS5cblxuICAgICAgICAgICAgLy8gR2l2ZW4gdGhhdCBkb2luZyB0aGUgc2V0U3RhdGUgaGVyZSB3b3VsZCBjYXVzZSBhIGJ1bmNoIG9mXG4gICAgICAgICAgICAvLyB1bm5lY2Vzc2FyeSB3b3JrLCB3ZSBqdXN0IGlnbm9yZSB0aGUgY2hhbmdlIHNpbmNlIHdlIGtub3dcbiAgICAgICAgICAgIC8vIHRoYXQgaWYgdGhlIGN1cnJlbnQgcm9vbSBJRCBoYXMgY2hhbmdlZCBmcm9tIHdoYXQgd2UgdGhvdWdodFxuICAgICAgICAgICAgLy8gaXQgd2FzLCBpdCBtZWFucyB3ZSdyZSBhYm91dCB0byBiZSB1bm1vdW50ZWQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb29tSWQgPSBSb29tVmlld1N0b3JlLmdldFJvb21JZCgpO1xuXG4gICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xuICAgICAgICAgICAgcm9vbUlkLFxuICAgICAgICAgICAgcm9vbUFsaWFzOiBSb29tVmlld1N0b3JlLmdldFJvb21BbGlhcygpLFxuICAgICAgICAgICAgcm9vbUxvYWRpbmc6IFJvb21WaWV3U3RvcmUuaXNSb29tTG9hZGluZygpLFxuICAgICAgICAgICAgcm9vbUxvYWRFcnJvcjogUm9vbVZpZXdTdG9yZS5nZXRSb29tTG9hZEVycm9yKCksXG4gICAgICAgICAgICBqb2luaW5nOiBSb29tVmlld1N0b3JlLmlzSm9pbmluZygpLFxuICAgICAgICAgICAgaW5pdGlhbEV2ZW50SWQ6IFJvb21WaWV3U3RvcmUuZ2V0SW5pdGlhbEV2ZW50SWQoKSxcbiAgICAgICAgICAgIGlzSW5pdGlhbEV2ZW50SGlnaGxpZ2h0ZWQ6IFJvb21WaWV3U3RvcmUuaXNJbml0aWFsRXZlbnRIaWdobGlnaHRlZCgpLFxuICAgICAgICAgICAgZm9yd2FyZGluZ0V2ZW50OiBSb29tVmlld1N0b3JlLmdldEZvcndhcmRpbmdFdmVudCgpLFxuICAgICAgICAgICAgc2hvdWxkUGVlazogUm9vbVZpZXdTdG9yZS5zaG91bGRQZWVrKCksXG4gICAgICAgICAgICBzaG93aW5nUGlubmVkOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiUGlubmVkRXZlbnRzLmlzT3BlblwiLCByb29tSWQpLFxuICAgICAgICAgICAgc2hvd1JlYWRSZWNlaXB0czogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dSZWFkUmVjZWlwdHNcIiwgcm9vbUlkKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWluaXRpYWwgJiYgdGhpcy5zdGF0ZS5zaG91bGRQZWVrICYmICFuZXdTdGF0ZS5zaG91bGRQZWVrKSB7XG4gICAgICAgICAgICAvLyBTdG9wIHBlZWtpbmcgYmVjYXVzZSB3ZSBoYXZlIGpvaW5lZCB0aGlzIHJvb20gbm93XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc3RvcFBlZWtpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlbXBvcmFyeSBsb2dnaW5nIHRvIGRpYWdub3NlIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzQzMDdcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAnUlZTIHVwZGF0ZTonLFxuICAgICAgICAgICAgbmV3U3RhdGUucm9vbUlkLFxuICAgICAgICAgICAgbmV3U3RhdGUucm9vbUFsaWFzLFxuICAgICAgICAgICAgJ2xvYWRpbmc/JywgbmV3U3RhdGUucm9vbUxvYWRpbmcsXG4gICAgICAgICAgICAnam9pbmluZz8nLCBuZXdTdGF0ZS5qb2luaW5nLFxuICAgICAgICAgICAgJ2luaXRpYWw/JywgaW5pdGlhbCxcbiAgICAgICAgICAgICdzaG91bGRQZWVrPycsIG5ld1N0YXRlLnNob3VsZFBlZWssXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gTkI6IFRoaXMgZG9lcyBhc3N1bWUgdGhhdCB0aGUgcm9vbUlEIHdpbGwgbm90IGNoYW5nZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICAgIC8vIHRoZSBSb29tVmlldyBpbnN0YW5jZVxuICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgbmV3U3RhdGUucm9vbSA9IHRoaXMuY29udGV4dC5nZXRSb29tKG5ld1N0YXRlLnJvb21JZCk7XG4gICAgICAgICAgICBpZiAobmV3U3RhdGUucm9vbSkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnNob3dBcHBzID0gdGhpcy5fc2hvdWxkU2hvd0FwcHMobmV3U3RhdGUucm9vbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25Sb29tTG9hZGVkKG5ld1N0YXRlLnJvb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucm9vbUlkID09PSBudWxsICYmIG5ld1N0YXRlLnJvb21JZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBzY3JvbGwgc3RhdGUgZm9yIHRoZSBuZXcgcm9vbVxuXG4gICAgICAgICAgICAvLyBJZiBhbiBldmVudCBJRCB3YXNuJ3Qgc3BlY2lmaWVkLCBkZWZhdWx0IHRvIHRoZSBvbmUgc2F2ZWQgZm9yIHRoaXMgcm9vbVxuICAgICAgICAgICAgLy8gaW4gdGhlIHNjcm9sbCBzdGF0ZSBzdG9yZS4gQXNzdW1lIGluaXRpYWxFdmVudFBpeGVsT2Zmc2V0IHNob3VsZCBiZSBzZXQuXG4gICAgICAgICAgICBpZiAoIW5ld1N0YXRlLmluaXRpYWxFdmVudElkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbVNjcm9sbFN0YXRlID0gUm9vbVNjcm9sbFN0YXRlU3RvcmUuZ2V0U2Nyb2xsU3RhdGUobmV3U3RhdGUucm9vbUlkKTtcbiAgICAgICAgICAgICAgICBpZiAocm9vbVNjcm9sbFN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlLmluaXRpYWxFdmVudElkID0gcm9vbVNjcm9sbFN0YXRlLmZvY3Vzc2VkRXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlLmluaXRpYWxFdmVudFBpeGVsT2Zmc2V0ID0gcm9vbVNjcm9sbFN0YXRlLnBpeGVsT2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWFyIHRoZSBzZWFyY2ggcmVzdWx0cyB3aGVuIGNsaWNraW5nIGEgc2VhcmNoIHJlc3VsdCAod2hpY2ggY2hhbmdlcyB0aGVcbiAgICAgICAgLy8gY3VycmVudGx5IHNjcm9sbGVkIHRvIGV2ZW50LCB0aGlzLnN0YXRlLmluaXRpYWxFdmVudElkKS5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaW5pdGlhbEV2ZW50SWQgIT09IG5ld1N0YXRlLmluaXRpYWxFdmVudElkKSB7XG4gICAgICAgICAgICBuZXdTdGF0ZS5zZWFyY2hSZXN1bHRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpO1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCBuZXdTdGF0ZS5yb29tSWQgY291bGQgYmUgbnVsbCAoZS5nLiB0aGUgYWxpYXMgbWlnaHQgbm90XG4gICAgICAgIC8vIGhhdmUgYmVlbiByZXNvbHZlZCB5ZXQpIHNvIGFueXRoaW5nIGNhbGxlZCBoZXJlIG11c3QgaGFuZGxlIHRoaXMgY2FzZS5cblxuICAgICAgICAvLyBXZSBwYXNzIHRoZSBuZXcgc3RhdGUgaW50byB0aGlzIGZ1bmN0aW9uIGZvciBpdCB0byByZWFkOiBpdCBuZWVkcyB0b1xuICAgICAgICAvLyBvYnNlcnZlIHRoZSBuZXcgc3RhdGUgYnV0IHdlIGRvbid0IHdhbnQgdG8gcHV0IGl0IGluIHRoZSBzZXRTdGF0ZVxuICAgICAgICAvLyBjYWxsYmFjayBiZWNhdXNlIHRoaXMgd291bGQgcHJldmVudCB0aGUgc2V0U3RhdGVzIGZyb20gYmVpbmcgYmF0Y2hlZCxcbiAgICAgICAgLy8gaWUuIGNhdXNlIGl0IHRvIHJlbmRlciBSb29tVmlldyB0d2ljZSByYXRoZXIgdGhhbiB0aGUgb25jZSB0aGF0IGlzIG5lY2Vzc2FyeS5cbiAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldHVwUm9vbShuZXdTdGF0ZS5yb29tLCBuZXdTdGF0ZS5yb29tSWQsIG5ld1N0YXRlLmpvaW5pbmcsIG5ld1N0YXRlLnNob3VsZFBlZWspO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRSb29tSWQoKSB7XG4gICAgICAgIC8vIEFjY29yZGluZyB0byBgX29uUm9vbVZpZXdTdG9yZVVwZGF0ZWAsIGBzdGF0ZS5yb29tSWRgIGNhbiBiZSBudWxsXG4gICAgICAgIC8vIGlmIHdlIGhhdmUgYSByb29tIGFsaWFzIHdlIGhhdmVuJ3QgcmVzb2x2ZWQgeWV0LiBUbyB3b3JrIGFyb3VuZCB0aGlzLFxuICAgICAgICAvLyBmaXJzdCB3ZSdsbCB0cnkgdGhlIHJvb20gb2JqZWN0IGlmIGl0J3MgdGhlcmUsIGFuZCB0aGVuIGZhbGxiYWNrIHRvXG4gICAgICAgIC8vIHRoZSBiYXJlIHJvb20gSUQuIChXZSBtYXkgd2FudCB0byB1cGRhdGUgYHN0YXRlLnJvb21JZGAgYWZ0ZXJcbiAgICAgICAgLy8gcmVzb2x2aW5nIGFsaWFzZXMsIHNvIHdlIGNvdWxkIGFsd2F5cyB0cnVzdCBpdC4pXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnJvb20gPyB0aGlzLnN0YXRlLnJvb20ucm9vbUlkIDogdGhpcy5zdGF0ZS5yb29tSWQ7XG4gICAgfSxcblxuICAgIF9nZXRQZXJtYWxpbmtDcmVhdG9yRm9yUm9vbTogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICBpZiAoIXRoaXMuX3Blcm1hbGlua0NyZWF0b3JzKSB0aGlzLl9wZXJtYWxpbmtDcmVhdG9ycyA9IHt9O1xuICAgICAgICBpZiAodGhpcy5fcGVybWFsaW5rQ3JlYXRvcnNbcm9vbS5yb29tSWRdKSByZXR1cm4gdGhpcy5fcGVybWFsaW5rQ3JlYXRvcnNbcm9vbS5yb29tSWRdO1xuXG4gICAgICAgIHRoaXMuX3Blcm1hbGlua0NyZWF0b3JzW3Jvb20ucm9vbUlkXSA9IG5ldyBSb29tUGVybWFsaW5rQ3JlYXRvcihyb29tKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucm9vbSAmJiByb29tLnJvb21JZCA9PT0gdGhpcy5zdGF0ZS5yb29tLnJvb21JZCkge1xuICAgICAgICAgICAgLy8gV2Ugd2FudCB0byB3YXRjaCBmb3IgY2hhbmdlcyBpbiB0aGUgY3JlYXRvciBmb3IgdGhlIHByaW1hcnkgcm9vbSBpbiB0aGUgdmlldywgYnV0XG4gICAgICAgICAgICAvLyBkb24ndCBuZWVkIHRvIGRvIHNvIGZvciBzZWFyY2ggcmVzdWx0cy5cbiAgICAgICAgICAgIHRoaXMuX3Blcm1hbGlua0NyZWF0b3JzW3Jvb20ucm9vbUlkXS5zdGFydCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcGVybWFsaW5rQ3JlYXRvcnNbcm9vbS5yb29tSWRdLmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcGVybWFsaW5rQ3JlYXRvcnNbcm9vbS5yb29tSWRdO1xuICAgIH0sXG5cbiAgICBfc3RvcEFsbFBlcm1hbGlua0NyZWF0b3JzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9wZXJtYWxpbmtDcmVhdG9ycykgcmV0dXJuO1xuICAgICAgICBmb3IgKGNvbnN0IHJvb21JZCBvZiBPYmplY3Qua2V5cyh0aGlzLl9wZXJtYWxpbmtDcmVhdG9ycykpIHtcbiAgICAgICAgICAgIHRoaXMuX3Blcm1hbGlua0NyZWF0b3JzW3Jvb21JZF0uc3RvcCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbldpZGdldEVjaG9TdG9yZVVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2hvd0FwcHM6IHRoaXMuX3Nob3VsZFNob3dBcHBzKHRoaXMuc3RhdGUucm9vbSksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfc2V0dXBSb29tOiBmdW5jdGlvbihyb29tLCByb29tSWQsIGpvaW5pbmcsIHNob3VsZFBlZWspIHtcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiB1bmtub3duIHJvb20gdGhlbiB3ZSdyZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOlxuICAgICAgICAvLyAtIFRoaXMgaXMgYSByb29tIHdlIGNhbiBwZWVrIGludG8gKHNlYXJjaCBlbmdpbmUpICh3ZSBjYW4gL3BlZWspXG4gICAgICAgIC8vIC0gVGhpcyBpcyBhIHJvb20gd2UgY2FuIHB1YmxpY2x5IGpvaW4gb3Igd2VyZSBpbnZpdGVkIHRvLiAod2UgY2FuIC9qb2luKVxuICAgICAgICAvLyAtIFRoaXMgaXMgYSByb29tIHdlIGNhbm5vdCBqb2luIGF0IGFsbC4gKG5vIGFjdGlvbiBjYW4gaGVscCB1cylcbiAgICAgICAgLy8gV2UgY2FuJ3QgdHJ5IHRvIC9qb2luIGJlY2F1c2UgdGhpcyBtYXkgaW1wbGljaXRseSBhY2NlcHQgaW52aXRlcyAoISlcbiAgICAgICAgLy8gV2UgY2FuIC9wZWVrIHRob3VnaC4gSWYgaXQgZmFpbHMgdGhlbiB3ZSBwcmVzZW50IHRoZSBqb2luIFVJLiBJZiBpdFxuICAgICAgICAvLyBzdWNjZWVkcyB0aGVuIGdyZWF0LCBzaG93IHRoZSBwcmV2aWV3IChidXQgd2Ugc3RpbGwgbWF5IGJlIGFibGUgdG8gL2pvaW4hKS5cbiAgICAgICAgLy8gTm90ZSB0aGF0IHBlZWtpbmcgd29ya3MgYnkgcm9vbSBJRCBhbmQgcm9vbSBJRCBvbmx5LCBhcyBvcHBvc2VkIHRvIGpvaW5pbmdcbiAgICAgICAgLy8gd2hpY2ggbXVzdCBiZSBieSBhbGlhcyBvciBpbnZpdGUgd2hlcmV2ZXIgcG9zc2libGUgKHBlZWtpbmcgY3VycmVudGx5IGRvZXNcbiAgICAgICAgLy8gbm90IHdvcmsgb3ZlciBmZWRlcmF0aW9uKS5cblxuICAgICAgICAvLyBOQi4gV2UgcGVlayBpZiB3ZSBoYXZlIG5ldmVyIHNlZW4gdGhlIHJvb20gYmVmb3JlIChpLmUuIGpzLXNkayBkb2VzIG5vdCBrbm93XG4gICAgICAgIC8vIGFib3V0IGl0KS4gV2UgZG9uJ3QgcGVlayBpbiB0aGUgaGlzdG9yaWNhbCBjYXNlIHdoZXJlIHdlIHdlcmUgam9pbmVkIGJ1dCBhcmVcbiAgICAgICAgLy8gbm93IG5vdCBqb2luZWQgYmVjYXVzZSB0aGUganMtc2RrIHBlZWtpbmcgQVBJIHdpbGwgY2xvYmJlciBvdXIgaGlzdG9yaWNhbCByb29tLFxuICAgICAgICAvLyBtYWtpbmcgaXQgaW1wb3NzaWJsZSB0byBpbmRpY2F0ZSBhIG5ld2x5IGpvaW5lZCByb29tLlxuICAgICAgICBpZiAoIWpvaW5pbmcgJiYgcm9vbUlkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5hdXRvSm9pbikge1xuICAgICAgICAgICAgICAgIHRoaXMub25Kb2luQnV0dG9uQ2xpY2tlZCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghcm9vbSAmJiBzaG91bGRQZWVrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQXR0ZW1wdGluZyB0byBwZWVrIGludG8gcm9vbSAlc1wiLCByb29tSWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBwZWVrTG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNQZWVraW5nOiB0cnVlLCAvLyB0aGlzIHdpbGwgY2hhbmdlIHRvIGZhbHNlIGlmIHBlZWtpbmcgZmFpbHNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucGVla0luUm9vbShyb29tSWQpLnRoZW4oKHJvb20pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByb29tOiByb29tLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGVla0xvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25Sb29tTG9hZGVkKHJvb20pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHBlZWtpbmcgaWYgYW55dGhpbmcgd2VudCB3cm9uZ1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUGVla2luZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgd29uJ3QgbmVjZXNzYXJpbHkgYmUgYSBNYXRyaXhFcnJvciwgYnV0IHdlIGR1Y2stdHlwZVxuICAgICAgICAgICAgICAgICAgICAvLyBoZXJlIGFuZCBzYXkgaWYgaXQncyBnb3QgYW4gJ2VycmNvZGUnIGtleSB3aXRoIHRoZSByaWdodCB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgbWVhbnMgd2UgY2FuJ3QgcGVlay5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5lcnJjb2RlID09PSBcIk1fR1VFU1RfQUNDRVNTX0ZPUkJJRERFTlwiIHx8IGVyci5lcnJjb2RlID09PSAnTV9GT1JCSURERU4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZpbmU6IHRoZSByb29tIGp1c3QgaXNuJ3QgcGVla2FibGUgKHdlIGFzc3VtZSkuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWVrTG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb29tKSB7XG4gICAgICAgICAgICAgICAgLy8gU3RvcCBwZWVraW5nIGJlY2F1c2Ugd2UgaGF2ZSBqb2luZWQgdGhpcyByb29tIHByZXZpb3VzbHlcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3RvcFBlZWtpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc1BlZWtpbmc6IGZhbHNlfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Nob3VsZFNob3dBcHBzOiBmdW5jdGlvbihyb29tKSB7XG4gICAgICAgIGlmICghQlJPV1NFUl9TVVBQT1JUU19TQU5EQk9YKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgcHJldmlvdXNseSBjaG9zZW4gdG8gaGlkZSB0aGUgYXBwIGRyYXdlciBmb3IgdGhpc1xuICAgICAgICAvLyByb29tLiBJZiBzbywgZG8gbm90IHNob3cgYXBwc1xuICAgICAgICBjb25zdCBoaWRlV2lkZ2V0RHJhd2VyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXG4gICAgICAgICAgICByb29tLnJvb21JZCArIFwiX2hpZGVfd2lkZ2V0X2RyYXdlclwiKTtcblxuICAgICAgICAvLyBUaGlzIGlzIGNvbmZ1c2luZywgYnV0IGl0IG1lYW5zIHRvIHNheSB0aGF0IHdlIGRlZmF1bHQgdG8gdGhlIHRyYXkgYmVpbmdcbiAgICAgICAgLy8gaGlkZGVuIHVubGVzcyB0aGUgdXNlciBjbGlja2VkIHRvIG9wZW4gaXQuXG4gICAgICAgIHJldHVybiBoaWRlV2lkZ2V0RHJhd2VyID09PSBcImZhbHNlXCI7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2FsbCA9IHRoaXMuX2dldENhbGxGb3JSb29tKCk7XG4gICAgICAgIGNvbnN0IGNhbGxTdGF0ZSA9IGNhbGwgPyBjYWxsLmNhbGxfc3RhdGUgOiBcImVuZGVkXCI7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgY2FsbFN0YXRlOiBjYWxsU3RhdGUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbmZDYWxsTm90aWZpY2F0aW9uKCk7XG5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHRoaXMub25QYWdlVW5sb2FkKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIub24oXCJtaWRkbGVQYW5lbFJlc2l6ZWRcIiwgdGhpcy5vblJlc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25OYXRpdmVLZXlEb3duKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gKCFPYmplY3RVdGlscy5zaGFsbG93RXF1YWwodGhpcy5wcm9wcywgbmV4dFByb3BzKSB8fFxuICAgICAgICAgICAgICAgICFPYmplY3RVdGlscy5zaGFsbG93RXF1YWwodGhpcy5zdGF0ZSwgbmV4dFN0YXRlKSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9yb29tVmlldy5jdXJyZW50KSB7XG4gICAgICAgICAgICBjb25zdCByb29tVmlldyA9IHRoaXMuX3Jvb21WaWV3LmN1cnJlbnQ7XG4gICAgICAgICAgICBpZiAoIXJvb21WaWV3Lm9uZHJvcCkge1xuICAgICAgICAgICAgICAgIHJvb21WaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm9uRHJvcCk7XG4gICAgICAgICAgICAgICAgcm9vbVZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm9uRHJhZ092ZXIpO1xuICAgICAgICAgICAgICAgIHJvb21WaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIHRoaXMub25EcmFnTGVhdmVPckVuZCk7XG4gICAgICAgICAgICAgICAgcm9vbVZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMub25EcmFnTGVhdmVPckVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3RlOiBXZSBjaGVjayB0aGUgcmVmIGhlcmUgd2l0aCBhIGZsYWcgYmVjYXVzZSBjb21wb25lbnREaWRNb3VudCwgZGVzcGl0ZVxuICAgICAgICAvLyBkb2N1bWVudGF0aW9uLCBkb2VzIG5vdCBkZWZpbmUgb3VyIG1lc3NhZ2VQYW5lbCByZWYuIEl0IGxvb2tzIGxpa2Ugb3VyIHNwaW5uZXJcbiAgICAgICAgLy8gaW4gcmVuZGVyKCkgcHJldmVudHMgdGhlIHJlZiBmcm9tIGJlaW5nIHNldCBvbiBmaXJzdCBtb3VudCwgc28gd2UgdHJ5IGFuZFxuICAgICAgICAvLyBjYXRjaCB0aGUgbWVzc2FnZVBhbmVsIHdoZW4gaXQgZG9lcyBtb3VudC4gQmVjYXVzZSB3ZSBvbmx5IHdhbnQgdGhlIHJlZiBvbmNlLFxuICAgICAgICAvLyB3ZSB1c2UgYSBib29sZWFuIGZsYWcgdG8gYXZvaWQgZHVwbGljYXRlIHdvcmsuXG4gICAgICAgIGlmICh0aGlzLl9tZXNzYWdlUGFuZWwgJiYgIXRoaXMuc3RhdGUuYXRFbmRPZkxpdmVUaW1lbGluZUluaXQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGF0RW5kT2ZMaXZlVGltZWxpbmVJbml0OiB0cnVlLFxuICAgICAgICAgICAgICAgIGF0RW5kT2ZMaXZlVGltZWxpbmU6IHRoaXMuX21lc3NhZ2VQYW5lbC5pc0F0RW5kT2ZMaXZlVGltZWxpbmUoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gc2V0IGEgYm9vbGVhbiB0byBzYXkgd2UndmUgYmVlbiB1bm1vdW50ZWQsIHdoaWNoIGFueSBwZW5kaW5nXG4gICAgICAgIC8vIHByb21pc2VzIGNhbiB1c2UgdG8gdGhyb3cgYXdheSB0aGVpciByZXN1bHRzLlxuICAgICAgICAvL1xuICAgICAgICAvLyAoV2UgY291bGQgdXNlIGlzTW91bnRlZCwgYnV0IGZhY2Vib29rIGhhdmUgZGVwcmVjYXRlZCB0aGF0LilcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Nyb2xsIG1hcCBiZWZvcmUgd2UgZ2V0IHVubW91bnRlZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5yb29tSWQpIHtcbiAgICAgICAgICAgIFJvb21TY3JvbGxTdGF0ZVN0b3JlLnNldFNjcm9sbFN0YXRlKHRoaXMuc3RhdGUucm9vbUlkLCB0aGlzLl9nZXRTY3JvbGxTdGF0ZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3VsZFBlZWspIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdG9wUGVla2luZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RvcCB0cmFja2luZyByb29tIGNoYW5nZXMgdG8gZm9ybWF0IHBlcm1hbGlua3NcbiAgICAgICAgdGhpcy5fc3RvcEFsbFBlcm1hbGlua0NyZWF0b3JzKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX3Jvb21WaWV3LmN1cnJlbnQpIHtcbiAgICAgICAgICAgIC8vIGRpc2Nvbm5lY3QgdGhlIEQmRCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGUgcm9vbSB2aWV3LiBUaGlzXG4gICAgICAgICAgICAvLyBpcyByZWFsbHkganVzdCBmb3IgaHlnaWVuZSAtIHdlJ3JlIGdvaW5nIHRvIGJlXG4gICAgICAgICAgICAvLyBkZWxldGVkIGFueXdheSwgc28gaXQgZG9lc24ndCBtYXR0ZXIgaWYgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICAgICAgLy8gZG9uJ3QgZ2V0IGNsZWFuZWQgdXAuXG4gICAgICAgICAgICBjb25zdCByb29tVmlldyA9IHRoaXMuX3Jvb21WaWV3LmN1cnJlbnQ7XG4gICAgICAgICAgICByb29tVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbkRyb3ApO1xuICAgICAgICAgICAgcm9vbVZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm9uRHJhZ092ZXIpO1xuICAgICAgICAgICAgcm9vbVZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgdGhpcy5vbkRyYWdMZWF2ZU9yRW5kKTtcbiAgICAgICAgICAgIHJvb21WaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLm9uRHJhZ0xlYXZlT3JFbmQpO1xuICAgICAgICB9XG4gICAgICAgIGRpcy51bnJlZ2lzdGVyKHRoaXMuZGlzcGF0Y2hlclJlZik7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcIlJvb21cIiwgdGhpcy5vblJvb20pO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ubmFtZVwiLCB0aGlzLm9uUm9vbU5hbWUpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5hY2NvdW50RGF0YVwiLCB0aGlzLm9uUm9vbUFjY291bnREYXRhKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5vblJvb21TdGF0ZUV2ZW50cyk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVtb3ZlTGlzdGVuZXIoXCJSb29tLm15TWVtYmVyc2hpcFwiLCB0aGlzLm9uTXlNZW1iZXJzaGlwKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHRoaXMub25Sb29tU3RhdGVNZW1iZXIpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKFwiYWNjb3VudERhdGFcIiwgdGhpcy5vbkFjY291bnREYXRhKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcImNyeXB0by5rZXlCYWNrdXBTdGF0dXNcIiwgdGhpcy5vbktleUJhY2t1cFN0YXR1cyk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVtb3ZlTGlzdGVuZXIoXCJkZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkXCIsIHRoaXMub25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgdGhpcy5vblVzZXJWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcImNyb3NzU2lnbmluZy5rZXlzQ2hhbmdlZFwiLCB0aGlzLm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHRoaXMub25QYWdlVW5sb2FkKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIucmVtb3ZlTGlzdGVuZXIoXCJtaWRkbGVQYW5lbFJlc2l6ZWRcIiwgdGhpcy5vblJlc2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uTmF0aXZlS2V5RG93bik7XG5cbiAgICAgICAgLy8gUmVtb3ZlIFJvb21TdG9yZSBsaXN0ZW5lclxuICAgICAgICBpZiAodGhpcy5fcm9vbVN0b3JlVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb21TdG9yZVRva2VuLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJlbW92ZSBSaWdodFBhbmVsU3RvcmUgbGlzdGVuZXJcbiAgICAgICAgaWYgKHRoaXMuX3JpZ2h0UGFuZWxTdG9yZVRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLl9yaWdodFBhbmVsU3RvcmVUb2tlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFdpZGdldEVjaG9TdG9yZS5yZW1vdmVMaXN0ZW5lcigndXBkYXRlJywgdGhpcy5fb25XaWRnZXRFY2hvU3RvcmVVcGRhdGUpO1xuXG4gICAgICAgIGlmICh0aGlzLl9zaG93UmVhZFJlY2VpcHRzV2F0Y2hSZWYpIHtcbiAgICAgICAgICAgIFNldHRpbmdzU3RvcmUudW53YXRjaFNldHRpbmcodGhpcy5fc2hvd1JlYWRSZWNlaXB0c1dhdGNoUmVmKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dSZWFkUmVjZWlwdHNXYXRjaFJlZiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYW5jZWwgYW55IHBlbmRpbmcgY2FsbHMgdG8gdGhlIHJhdGVfbGltaXRlZF9mdW5jc1xuICAgICAgICB0aGlzLl91cGRhdGVSb29tTWVtYmVycy5jYW5jZWxQZW5kaW5nQ2FsbCgpO1xuXG4gICAgICAgIC8vIG5vIG5lZWQgdG8gZG8gdGhpcyBhcyBEaXIgJiBTZXR0aW5ncyBhcmUgbm93IG92ZXJsYXlzLiBJdCBqdXN0IGJ1cm50IENQVS5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJUaW50ZXIudGludCBmcm9tIFJvb21WaWV3LnVubW91bnRcIik7XG4gICAgICAgIC8vIFRpbnRlci50aW50KCk7IC8vIHJlc2V0IGNvbG91cnNjaGVtZVxuICAgIH0sXG5cbiAgICBfb25SaWdodFBhbmVsU3RvcmVVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNob3dSaWdodFBhbmVsOiBSaWdodFBhbmVsU3RvcmUuZ2V0U2hhcmVkSW5zdGFuY2UoKS5pc09wZW5Gb3JSb29tLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25QYWdlVW5sb2FkKGV2ZW50KSB7XG4gICAgICAgIGlmIChDb250ZW50TWVzc2FnZXMuc2hhcmVkSW5zdGFuY2UoKS5nZXRDdXJyZW50VXBsb2FkcygpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudC5yZXR1cm5WYWx1ZSA9XG4gICAgICAgICAgICAgICAgX3QoXCJZb3Ugc2VlbSB0byBiZSB1cGxvYWRpbmcgZmlsZXMsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBxdWl0P1wiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9nZXRDYWxsRm9yUm9vbSgpICYmIHRoaXMuc3RhdGUuY2FsbFN0YXRlICE9PSAnZW5kZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQucmV0dXJuVmFsdWUgPVxuICAgICAgICAgICAgICAgIF90KFwiWW91IHNlZW0gdG8gYmUgaW4gYSBjYWxsLCBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcXVpdD9cIik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gd2UgcmVnaXN0ZXIgZ2xvYmFsIHNob3J0Y3V0cyBoZXJlLCB0aGV5ICptdXN0IG5vdCBjb25mbGljdCogd2l0aCBsb2NhbCBzaG9ydGN1dHMgZWxzZXdoZXJlIG9yIGJvdGggd2lsbCBmaXJlXG4gICAgb25OYXRpdmVLZXlEb3duOiBmdW5jdGlvbihldikge1xuICAgICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBjdHJsQ21kT25seSA9IGlzT25seUN0cmxPckNtZEtleUV2ZW50KGV2KTtcblxuICAgICAgICBzd2l0Y2ggKGV2LmtleSkge1xuICAgICAgICAgICAgY2FzZSBLZXkuRDpcbiAgICAgICAgICAgICAgICBpZiAoY3RybENtZE9ubHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk11dGVBdWRpb0NsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBLZXkuRTpcbiAgICAgICAgICAgICAgICBpZiAoY3RybENtZE9ubHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk11dGVWaWRlb0NsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25SZWFjdEtleURvd246IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG5cbiAgICAgICAgc3dpdGNoIChldi5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgS2V5LkVTQ0FQRTpcbiAgICAgICAgICAgICAgICBpZiAoIWV2LmFsdEtleSAmJiAhZXYuY3RybEtleSAmJiAhZXYuc2hpZnRLZXkgJiYgIWV2Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZVBhbmVsLmZvcmdldFJlYWRNYXJrZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qdW1wVG9MaXZlVGltZWxpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBLZXkuUEFHRV9VUDpcbiAgICAgICAgICAgICAgICBpZiAoIWV2LmFsdEtleSAmJiAhZXYuY3RybEtleSAmJiBldi5zaGlmdEtleSAmJiAhZXYubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmp1bXBUb1JlYWRNYXJrZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBLZXkuVS50b1VwcGVyQ2FzZSgpOlxuICAgICAgICAgICAgICAgIGlmIChpc09ubHlDdHJsT3JDbWRJZ25vcmVTaGlmdEtleUV2ZW50KGV2KSAmJiBldi5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246IFwidXBsb2FkX2ZpbGVcIiB9KVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFuZGxlZCkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uQWN0aW9uOiBmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ21lc3NhZ2Vfc2VuZF9mYWlsZWQnOlxuICAgICAgICAgICAgY2FzZSAnbWVzc2FnZV9zZW50JzpcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGVja0lmQWxvbmUodGhpcy5zdGF0ZS5yb29tKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Bvc3Rfc3RpY2tlcl9tZXNzYWdlJzpcbiAgICAgICAgICAgICAgdGhpcy5pbmplY3RTdGlja2VyKFxuICAgICAgICAgICAgICAgICAgcGF5bG9hZC5kYXRhLmNvbnRlbnQudXJsLFxuICAgICAgICAgICAgICAgICAgcGF5bG9hZC5kYXRhLmNvbnRlbnQuaW5mbyxcbiAgICAgICAgICAgICAgICAgIHBheWxvYWQuZGF0YS5kZXNjcmlwdGlvbiB8fCBwYXlsb2FkLmRhdGEubmFtZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGljdHVyZV9zbmFwc2hvdCc6XG4gICAgICAgICAgICAgICAgQ29udGVudE1lc3NhZ2VzLnNoYXJlZEluc3RhbmNlKCkuc2VuZENvbnRlbnRMaXN0VG9Sb29tKFtwYXlsb2FkLmZpbGVdLCB0aGlzLnN0YXRlLnJvb20ucm9vbUlkLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbm90aWZpZXJfZW5hYmxlZCc6XG4gICAgICAgICAgICBjYXNlICd1cGxvYWRfc3RhcnRlZCc6XG4gICAgICAgICAgICBjYXNlICd1cGxvYWRfZmluaXNoZWQnOlxuICAgICAgICAgICAgY2FzZSAndXBsb2FkX2NhbmNlbGVkJzpcbiAgICAgICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjYWxsX3N0YXRlJzpcbiAgICAgICAgICAgICAgICAvLyBkb24ndCBmaWx0ZXIgb3V0IHBheWxvYWRzIGZvciByb29tIElEcyBvdGhlciB0aGFuIHByb3BzLnJvb20gYmVjYXVzZVxuICAgICAgICAgICAgICAgIC8vIHdlIG1heSBiZSBpbnRlcmVzdGVkIGluIHRoZSBjb25mIDE6MSByb29tXG5cbiAgICAgICAgICAgICAgICBpZiAoIXBheWxvYWQucm9vbV9pZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNhbGwgPSB0aGlzLl9nZXRDYWxsRm9yUm9vbSgpO1xuICAgICAgICAgICAgICAgIHZhciBjYWxsU3RhdGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsU3RhdGUgPSBjYWxsLmNhbGxfc3RhdGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbFN0YXRlID0gXCJlbmRlZFwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHBvc3NpYmx5IHJlbW92ZSB0aGUgY29uZiBjYWxsIG5vdGlmaWNhdGlvbiBpZiB3ZSdyZSBub3cgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29uZlxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUNvbmZDYWxsTm90aWZpY2F0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbFN0YXRlOiBjYWxsU3RhdGUsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2FwcHNEcmF3ZXInOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzaG93QXBwczogcGF5bG9hZC5zaG93LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncmVwbHlfdG9fZXZlbnQnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMgJiYgcGF5bG9hZC5ldmVudC5nZXRSb29tSWQoKSA9PT0gdGhpcy5zdGF0ZS5yb29tSWQgJiYgIXRoaXMudW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DYW5jZWxTZWFyY2hDbGljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3F1b3RlJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5zZWFyY2hSZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb21JZCA9IHBheWxvYWQuZXZlbnQuZ2V0Um9vbUlkKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb29tSWQgPT09IHRoaXMuc3RhdGUucm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2FuY2VsU2VhcmNoQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkX2FjdGlvbjogcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Sb29tVGltZWxpbmU6IGZ1bmN0aW9uKGV2LCByb29tLCB0b1N0YXJ0T2ZUaW1lbGluZSwgcmVtb3ZlZCwgZGF0YSkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBpZ25vcmUgZXZlbnRzIGZvciBvdGhlciByb29tc1xuICAgICAgICBpZiAoIXJvb20pIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnJvb20gfHwgcm9vbS5yb29tSWQgIT0gdGhpcy5zdGF0ZS5yb29tLnJvb21JZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGlnbm9yZSBldmVudHMgZnJvbSBmaWx0ZXJlZCB0aW1lbGluZXNcbiAgICAgICAgaWYgKGRhdGEudGltZWxpbmUuZ2V0VGltZWxpbmVTZXQoKSAhPT0gcm9vbS5nZXRVbmZpbHRlcmVkVGltZWxpbmVTZXQoKSkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChldi5nZXRUeXBlKCkgPT09IFwib3JnLm1hdHJpeC5yb29tLnByZXZpZXdfdXJsc1wiKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQcmV2aWV3VXJsVmlzaWJpbGl0eShyb29tKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLmVuY3J5cHRpb25cIikge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlRTJFU3RhdHVzKHJvb20pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWdub3JlIGFueXRoaW5nIGJ1dCByZWFsLXRpbWUgdXBkYXRlcyBhdCB0aGUgZW5kIG9mIHRoZSByb29tOlxuICAgICAgICAvLyB1cGRhdGVzIGZyb20gcGFnaW5hdGlvbiB3aWxsIGhhcHBlbiB3aGVuIHRoZSBwYWdpbmF0ZSBjb21wbGV0ZXMuXG4gICAgICAgIGlmICh0b1N0YXJ0T2ZUaW1lbGluZSB8fCAhZGF0YSB8fCAhZGF0YS5saXZlRXZlbnQpIHJldHVybjtcblxuICAgICAgICAvLyBubyBwb2ludCBoYW5kbGluZyBhbnl0aGluZyB3aGlsZSB3ZSdyZSB3YWl0aW5nIGZvciB0aGUgam9pbiB0byBmaW5pc2g6XG4gICAgICAgIC8vIHdlJ2xsIG9ubHkgYmUgc2hvd2luZyBhIHNwaW5uZXIuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmpvaW5pbmcpIHJldHVybjtcblxuICAgICAgICBpZiAoZXYuZ2V0U2VuZGVyKCkgIT09IHRoaXMuY29udGV4dC5jcmVkZW50aWFscy51c2VySWQpIHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSB1bnJlYWQgY291bnQgd2hlbiBzY3JvbGxlZCB1cFxuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMgJiYgdGhpcy5zdGF0ZS5hdEVuZE9mTGl2ZVRpbWVsaW5lKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gY2hhbmdlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRIaWRlRXZlbnQoZXYpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7bnVtVW5yZWFkTWVzc2FnZXM6IHN0YXRlLm51bVVucmVhZE1lc3NhZ2VzICsgMX07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Sb29tTmFtZTogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5yb29tICYmIHJvb20ucm9vbUlkID09IHRoaXMuc3RhdGUucm9vbS5yb29tSWQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb21SZWNvdmVyeVJlbWluZGVyRG9udEFza0FnYWluOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIG9wdGlvbiB0byBub3QgYXNrIGFnYWluIGlzIHNldDpcbiAgICAgICAgLy8gZm9yY2UgYW4gdXBkYXRlIHRvIGhpZGUgdGhlIHJlY292ZXJ5IHJlbWluZGVyXG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25LZXlCYWNrdXBTdGF0dXMoKSB7XG4gICAgICAgIC8vIEtleSBiYWNrdXAgc3RhdHVzIGNoYW5nZXMgYWZmZWN0IHdoZXRoZXIgdGhlIGluLXJvb20gcmVjb3ZlcnlcbiAgICAgICAgLy8gcmVtaW5kZXIgaXMgZGlzcGxheWVkLlxuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGNhblJlc2V0VGltZWxpbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX21lc3NhZ2VQYW5lbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VQYW5lbC5jYW5SZXNldFRpbWVsaW5lKCk7XG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCB3aGVuIHN0YXRlLnJvb20gaXMgZmlyc3QgaW5pdGlhbGlzZWQgKGVpdGhlciBhdCBpbml0aWFsIGxvYWQsXG4gICAgLy8gYWZ0ZXIgYSBzdWNjZXNzZnVsIHBlZWssIG9yIGFmdGVyIHdlIGpvaW4gdGhlIHJvb20pLlxuICAgIF9vblJvb21Mb2FkZWQ6IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlUGVla1J1bGVzKHJvb20pO1xuICAgICAgICB0aGlzLl91cGRhdGVQcmV2aWV3VXJsVmlzaWJpbGl0eShyb29tKTtcbiAgICAgICAgdGhpcy5fbG9hZE1lbWJlcnNJZkpvaW5lZChyb29tKTtcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlUmVjb21tZW5kZWRWZXJzaW9uKHJvb20pO1xuICAgICAgICB0aGlzLl91cGRhdGVFMkVTdGF0dXMocm9vbSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBlcm1pc3Npb25zKHJvb20pO1xuICAgIH0sXG5cbiAgICBfY2FsY3VsYXRlUmVjb21tZW5kZWRWZXJzaW9uOiBhc3luYyBmdW5jdGlvbihyb29tKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdXBncmFkZVJlY29tbWVuZGF0aW9uOiBhd2FpdCByb29tLmdldFJlY29tbWVuZGVkVmVyc2lvbigpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2xvYWRNZW1iZXJzSWZKb2luZWQ6IGFzeW5jIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgLy8gbGF6eSBsb2FkIG1lbWJlcnMgaWYgZW5hYmxlZFxuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lmhhc0xhenlMb2FkTWVtYmVyc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgaWYgKHJvb20gJiYgcm9vbS5nZXRNeU1lbWJlcnNoaXAoKSA9PT0gJ2pvaW4nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcm9vbS5sb2FkTWVtYmVyc0lmTmVlZGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNMb2FkZWQ6IHRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgRmV0Y2hpbmcgcm9vbSBtZW1iZXJzIGZvciAke3Jvb20ucm9vbUlkfSBmYWlsZWQuYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBSb29tIG1lbWJlcnMgd2lsbCBhcHBlYXIgaW5jb21wbGV0ZS5cIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jYWxjdWxhdGVQZWVrUnVsZXM6IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgY29uc3QgZ3Vlc3RBY2Nlc3NFdmVudCA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLmd1ZXN0X2FjY2Vzc1wiLCBcIlwiKTtcbiAgICAgICAgaWYgKGd1ZXN0QWNjZXNzRXZlbnQgJiYgZ3Vlc3RBY2Nlc3NFdmVudC5nZXRDb250ZW50KCkuZ3Vlc3RfYWNjZXNzID09PSBcImNhbl9qb2luXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGd1ZXN0c0NhbkpvaW46IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhpc3RvcnlWaXNpYmlsaXR5ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20uaGlzdG9yeV92aXNpYmlsaXR5XCIsIFwiXCIpO1xuICAgICAgICBpZiAoaGlzdG9yeVZpc2liaWxpdHkgJiYgaGlzdG9yeVZpc2liaWxpdHkuZ2V0Q29udGVudCgpLmhpc3RvcnlfdmlzaWJpbGl0eSA9PT0gXCJ3b3JsZF9yZWFkYWJsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBjYW5QZWVrOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVByZXZpZXdVcmxWaXNpYmlsaXR5OiBmdW5jdGlvbih7cm9vbUlkfSkge1xuICAgICAgICAvLyBVUkwgUHJldmlld3MgaW4gRTJFRSByb29tcyBjYW4gYmUgYSBwcml2YWN5IGxlYWsgc28gdXNlIGEgZGlmZmVyZW50IHNldHRpbmcgd2hpY2ggaXMgcGVyLXJvb20gZXhwbGljaXRcbiAgICAgICAgY29uc3Qga2V5ID0gdGhpcy5jb250ZXh0LmlzUm9vbUVuY3J5cHRlZChyb29tSWQpID8gJ3VybFByZXZpZXdzRW5hYmxlZF9lMmVlJyA6ICd1cmxQcmV2aWV3c0VuYWJsZWQnO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNob3dVcmxQcmV2aWV3OiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKGtleSwgcm9vbUlkKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uUm9vbTogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICBpZiAoIXJvb20gfHwgcm9vbS5yb29tSWQgIT09IHRoaXMuc3RhdGUucm9vbUlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByb29tOiByb29tLFxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9vblJvb21Mb2FkZWQocm9vbSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJJZCwgZGV2aWNlKSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLnN0YXRlLnJvb207XG4gICAgICAgIGlmICghcm9vbS5jdXJyZW50U3RhdGUuZ2V0TWVtYmVyKHVzZXJJZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVFMkVTdGF0dXMocm9vbSk7XG4gICAgfSxcblxuICAgIG9uVXNlclZlcmlmaWNhdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJJZCwgX3RydXN0U3RhdHVzKSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLnN0YXRlLnJvb207XG4gICAgICAgIGlmICghcm9vbSB8fCAhcm9vbS5jdXJyZW50U3RhdGUuZ2V0TWVtYmVyKHVzZXJJZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVFMkVTdGF0dXMocm9vbSk7XG4gICAgfSxcblxuICAgIG9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByb29tID0gdGhpcy5zdGF0ZS5yb29tO1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlRTJFU3RhdHVzKHJvb20pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVFMkVTdGF0dXM6IGFzeW5jIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuaXNSb29tRW5jcnlwdGVkKHJvb20ucm9vbUlkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LmlzQ3J5cHRvRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAvLyBJZiBjcnlwdG8gaXMgbm90IGN1cnJlbnRseSBlbmFibGVkLCB3ZSBhcmVuJ3QgdHJhY2tpbmcgZGV2aWNlcyBhdCBhbGwsXG4gICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBrbm93IHdoYXQgdGhlIGFuc3dlciBpcy4gTGV0J3MgZXJyb3Igb24gdGhlIHNhZmUgc2lkZSBhbmQgc2hvd1xuICAgICAgICAgICAgLy8gYSB3YXJuaW5nIGZvciB0aGlzIGNhc2UuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlMmVTdGF0dXM6IFwid2FybmluZ1wiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICByb29tLmhhc1VudmVyaWZpZWREZXZpY2VzKCkudGhlbigoaGFzVW52ZXJpZmllZERldmljZXMpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZTJlU3RhdHVzOiBoYXNVbnZlcmlmaWVkRGV2aWNlcyA/IFwid2FybmluZ1wiIDogXCJ2ZXJpZmllZFwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcImUyZSBjaGVjayBpcyB3YXJuaW5nL3ZlcmlmaWVkIG9ubHkgYXMgY3Jvc3Mtc2lnbmluZyBpcyBvZmZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBBdCB0aGlzIHBvaW50LCB0aGUgdXNlciBoYXMgZW5jcnlwdGlvbiBvbiBhbmQgY3Jvc3Mtc2lnbmluZyBvbiAqL1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGUyZVN0YXR1czogYXdhaXQgc2hpZWxkU3RhdHVzRm9yUm9vbSh0aGlzLmNvbnRleHQsIHJvb20pLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlVGludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLnN0YXRlLnJvb207XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGludGVyLnRpbnQgZnJvbSB1cGRhdGVUaW50XCIpO1xuICAgICAgICBjb25zdCBjb2xvclNjaGVtZSA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJyb29tQ29sb3JcIiwgcm9vbS5yb29tSWQpO1xuICAgICAgICBUaW50ZXIudGludChjb2xvclNjaGVtZS5wcmltYXJ5X2NvbG9yLCBjb2xvclNjaGVtZS5zZWNvbmRhcnlfY29sb3IpO1xuICAgIH0sXG5cbiAgICBvbkFjY291bnREYXRhOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb25zdCB0eXBlID0gZXZlbnQuZ2V0VHlwZSgpO1xuICAgICAgICBpZiAoKHR5cGUgPT09IFwib3JnLm1hdHJpeC5wcmV2aWV3X3VybHNcIiB8fCB0eXBlID09PSBcImltLnZlY3Rvci53ZWIuc2V0dGluZ3NcIikgJiYgdGhpcy5zdGF0ZS5yb29tKSB7XG4gICAgICAgICAgICAvLyBub24tZTJlZSB1cmwgcHJldmlld3MgYXJlIHN0b3JlZCBpbiBsZWdhY3kgZXZlbnQgdHlwZSBgb3JnLm1hdHJpeC5yb29tLnByZXZpZXdfdXJsc2BcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVByZXZpZXdVcmxWaXNpYmlsaXR5KHRoaXMuc3RhdGUucm9vbSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Sb29tQWNjb3VudERhdGE6IGZ1bmN0aW9uKGV2ZW50LCByb29tKSB7XG4gICAgICAgIGlmIChyb29tLnJvb21JZCA9PSB0aGlzLnN0YXRlLnJvb21JZCkge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IGV2ZW50LmdldFR5cGUoKTtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcIm9yZy5tYXRyaXgucm9vbS5jb2xvcl9zY2hlbWVcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yU2NoZW1lID0gZXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICAgICAgICAgIC8vIFhYWDogd2Ugc2hvdWxkIHZhbGlkYXRlIHRoZSBldmVudFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGludGVyLnRpbnQgZnJvbSBvblJvb21BY2NvdW50RGF0YVwiKTtcbiAgICAgICAgICAgICAgICBUaW50ZXIudGludChjb2xvclNjaGVtZS5wcmltYXJ5X2NvbG9yLCBjb2xvclNjaGVtZS5zZWNvbmRhcnlfY29sb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIm9yZy5tYXRyaXgucm9vbS5wcmV2aWV3X3VybHNcIiB8fCB0eXBlID09PSBcImltLnZlY3Rvci53ZWIuc2V0dGluZ3NcIikge1xuICAgICAgICAgICAgICAgIC8vIG5vbi1lMmVlIHVybCBwcmV2aWV3cyBhcmUgc3RvcmVkIGluIGxlZ2FjeSBldmVudCB0eXBlIGBvcmcubWF0cml4LnJvb20ucHJldmlld191cmxzYFxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVByZXZpZXdVcmxWaXNpYmlsaXR5KHJvb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUm9vbVN0YXRlRXZlbnRzOiBmdW5jdGlvbihldiwgc3RhdGUpIHtcbiAgICAgICAgLy8gaWdub3JlIGlmIHdlIGRvbid0IGhhdmUgYSByb29tIHlldFxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUucm9vbSB8fCB0aGlzLnN0YXRlLnJvb20ucm9vbUlkICE9PSBzdGF0ZS5yb29tSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBlcm1pc3Npb25zKHRoaXMuc3RhdGUucm9vbSk7XG4gICAgfSxcblxuICAgIG9uUm9vbVN0YXRlTWVtYmVyOiBmdW5jdGlvbihldiwgc3RhdGUsIG1lbWJlcikge1xuICAgICAgICAvLyBpZ25vcmUgaWYgd2UgZG9uJ3QgaGF2ZSBhIHJvb20geWV0XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yb29tKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZ25vcmUgbWVtYmVycyBpbiBvdGhlciByb29tc1xuICAgICAgICBpZiAobWVtYmVyLnJvb21JZCAhPT0gdGhpcy5zdGF0ZS5yb29tLnJvb21JZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vbU1lbWJlcnMobWVtYmVyKTtcbiAgICB9LFxuXG4gICAgb25NeU1lbWJlcnNoaXA6IGZ1bmN0aW9uKHJvb20sIG1lbWJlcnNoaXAsIG9sZE1lbWJlcnNoaXApIHtcbiAgICAgICAgaWYgKHJvb20ucm9vbUlkID09PSB0aGlzLnN0YXRlLnJvb21JZCkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5fbG9hZE1lbWJlcnNJZkpvaW5lZChyb29tKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBlcm1pc3Npb25zKHJvb20pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVQZXJtaXNzaW9uczogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgY29uc3QgbWUgPSB0aGlzLmNvbnRleHQuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICBjb25zdCBjYW5SZWFjdCA9IHJvb20uZ2V0TXlNZW1iZXJzaGlwKCkgPT09IFwiam9pblwiICYmIHJvb20uY3VycmVudFN0YXRlLm1heVNlbmRFdmVudChcIm0ucmVhY3Rpb25cIiwgbWUpO1xuICAgICAgICAgICAgY29uc3QgY2FuUmVwbHkgPSByb29tLm1heVNlbmRNZXNzYWdlKCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NhblJlYWN0LCBjYW5SZXBseX0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIHJhdGUgbGltaXRlZCBiZWNhdXNlIGEgcG93ZXIgbGV2ZWwgY2hhbmdlIHdpbGwgZW1pdCBhbiBldmVudCBmb3IgZXZlcnlcbiAgICAvLyBtZW1iZXIgaW4gdGhlIHJvb20uXG4gICAgX3VwZGF0ZVJvb21NZW1iZXJzOiByYXRlX2xpbWl0ZWRfZnVuYyhmdW5jdGlvbihkdWVUb01lbWJlcikge1xuICAgICAgICAvLyBhIG1lbWJlciBzdGF0ZSBjaGFuZ2VkIGluIHRoaXMgcm9vbVxuICAgICAgICAvLyByZWZyZXNoIHRoZSBjb25mIGNhbGwgbm90aWZpY2F0aW9uIHN0YXRlXG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbmZDYWxsTm90aWZpY2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZURNU3RhdGUoKTtcblxuICAgICAgICBsZXQgbWVtYmVyQ291bnRJbmZsdWVuY2UgPSAwO1xuICAgICAgICBpZiAoZHVlVG9NZW1iZXIgJiYgZHVlVG9NZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIiAmJiB0aGlzLnN0YXRlLnJvb20uZ2V0SW52aXRlZE1lbWJlckNvdW50KCkgPT09IDApIHtcbiAgICAgICAgICAgIC8vIEEgbWVtYmVyIGdvdCBpbnZpdGVkLCBidXQgdGhlIHJvb20gaGFzbid0IGRldGVjdGVkIHRoYXQgY2hhbmdlIHlldC4gSW5mbHVlbmNlIHRoZSBtZW1iZXJcbiAgICAgICAgICAgIC8vIGNvdW50IGJ5IDEgdG8gY291bnRlcmFjdCB0aGlzLlxuICAgICAgICAgICAgbWVtYmVyQ291bnRJbmZsdWVuY2UgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NoZWNrSWZBbG9uZSh0aGlzLnN0YXRlLnJvb20sIG1lbWJlckNvdW50SW5mbHVlbmNlKTtcblxuICAgICAgICB0aGlzLl91cGRhdGVFMkVTdGF0dXModGhpcy5zdGF0ZS5yb29tKTtcbiAgICB9LCA1MDApLFxuXG4gICAgX2NoZWNrSWZBbG9uZTogZnVuY3Rpb24ocm9vbSwgY291bnRJbmZsdWVuY2UpIHtcbiAgICAgICAgbGV0IHdhcm5lZEFib3V0TG9uZWx5Um9vbSA9IGZhbHNlO1xuICAgICAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICB3YXJuZWRBYm91dExvbmVseVJvb20gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbXhfdXNlcl9hbG9uZV93YXJuZWRfJyArIHRoaXMuc3RhdGUucm9vbS5yb29tSWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3YXJuZWRBYm91dExvbmVseVJvb20pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmlzQWxvbmUpIHRoaXMuc2V0U3RhdGUoe2lzQWxvbmU6IGZhbHNlfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgam9pbmVkT3JJbnZpdGVkTWVtYmVyQ291bnQgPSByb29tLmdldEpvaW5lZE1lbWJlckNvdW50KCkgKyByb29tLmdldEludml0ZWRNZW1iZXJDb3VudCgpO1xuICAgICAgICBpZiAoY291bnRJbmZsdWVuY2UpIGpvaW5lZE9ySW52aXRlZE1lbWJlckNvdW50ICs9IGNvdW50SW5mbHVlbmNlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0Fsb25lOiBqb2luZWRPckludml0ZWRNZW1iZXJDb3VudCA9PT0gMX0pO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlQ29uZkNhbGxOb3RpZmljYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByb29tID0gdGhpcy5zdGF0ZS5yb29tO1xuICAgICAgICBpZiAoIXJvb20gfHwgIXRoaXMucHJvcHMuQ29uZmVyZW5jZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25mTWVtYmVyID0gcm9vbS5nZXRNZW1iZXIoXG4gICAgICAgICAgICB0aGlzLnByb3BzLkNvbmZlcmVuY2VIYW5kbGVyLmdldENvbmZlcmVuY2VVc2VySWRGb3JSb29tKHJvb20ucm9vbUlkKSxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWNvbmZNZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25mQ2FsbCA9IHRoaXMucHJvcHMuQ29uZmVyZW5jZUhhbmRsZXIuZ2V0Q29uZmVyZW5jZUNhbGxGb3JSb29tKGNvbmZNZW1iZXIucm9vbUlkKTtcblxuICAgICAgICAvLyBBIGNvbmYgY2FsbCBub3RpZmljYXRpb24gc2hvdWxkIGJlIGRpc3BsYXllZCBpZiB0aGVyZSBpcyBhbiBvbmdvaW5nXG4gICAgICAgIC8vIGNvbmYgY2FsbCBidXQgdGhpcyBjaWxlbnQgaXNuJ3QgYSBwYXJ0IG9mIGl0LlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGRpc3BsYXlDb25mQ2FsbE5vdGlmaWNhdGlvbjogKFxuICAgICAgICAgICAgICAgICghY29uZkNhbGwgfHwgY29uZkNhbGwuY2FsbF9zdGF0ZSA9PT0gXCJlbmRlZFwiKSAmJlxuICAgICAgICAgICAgICAgIGNvbmZNZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJqb2luXCJcbiAgICAgICAgICAgICksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlRE1TdGF0ZSgpIHtcbiAgICAgICAgY29uc3Qgcm9vbSA9IHRoaXMuc3RhdGUucm9vbTtcbiAgICAgICAgaWYgKHJvb20uZ2V0TXlNZW1iZXJzaGlwKCkgIT0gXCJqb2luXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkbUludml0ZXIgPSByb29tLmdldERNSW52aXRlcigpO1xuICAgICAgICBpZiAoZG1JbnZpdGVyKSB7XG4gICAgICAgICAgICBSb29tcy5zZXRETVJvb20ocm9vbS5yb29tSWQsIGRtSW52aXRlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25TZWFyY2hSZXN1bHRzRmlsbFJlcXVlc3Q6IGZ1bmN0aW9uKGJhY2t3YXJkcykge1xuICAgICAgICBpZiAoIWJhY2t3YXJkcykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zZWFyY2hSZXN1bHRzLm5leHRfYmF0Y2gpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwicmVxdWVzdGluZyBtb3JlIHNlYXJjaCByZXN1bHRzXCIpO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoUHJvbWlzZSA9IHRoaXMuY29udGV4dC5iYWNrUGFnaW5hdGVSb29tRXZlbnRzU2VhcmNoKFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuc2VhcmNoUmVzdWx0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlU2VhcmNoUmVzdWx0KHNlYXJjaFByb21pc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVidWdsb2coXCJubyBtb3JlIHNlYXJjaCByZXN1bHRzXCIpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25JbnZpdGVCdXR0b25DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGNhbGwgQWRkcmVzc1BpY2tlckRpYWxvZ1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld19pbnZpdGUnLFxuICAgICAgICAgICAgcm9vbUlkOiB0aGlzLnN0YXRlLnJvb20ucm9vbUlkLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNBbG9uZTogZmFsc2V9KTsgLy8gdGhlcmUncyBhIGdvb2QgY2hhbmNlIHRoZXknbGwgaW52aXRlIHNvbWVvbmVcbiAgICB9LFxuXG4gICAgb25TdG9wQWxvbmVXYXJuaW5nQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnbXhfdXNlcl9hbG9uZV93YXJuZWRfJyArIHRoaXMuc3RhdGUucm9vbS5yb29tSWQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2lzQWxvbmU6IGZhbHNlfSk7XG4gICAgfSxcblxuICAgIG9uSm9pbkJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIGEgUk9VLCBhbGxvdyB0aGVtIHRvIHRyYW5zaXRpb24gdG8gYSBQV0xVXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQgJiYgdGhpcy5jb250ZXh0LmlzR3Vlc3QoKSkge1xuICAgICAgICAgICAgLy8gSm9pbiB0aGlzIHJvb20gb25jZSB0aGUgdXNlciBoYXMgcmVnaXN0ZXJlZCBhbmQgbG9nZ2VkIGluXG4gICAgICAgICAgICAvLyAoSWYgd2UgZmFpbGVkIHRvIHBlZWssIHdlIG1heSBub3QgaGF2ZSBhIHZhbGlkIHJvb20gb2JqZWN0LilcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9fYWZ0ZXJfc3luY19wcmVwYXJlZCcsXG4gICAgICAgICAgICAgICAgZGVmZXJyZWRfYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IHRoaXMuX2dldFJvb21JZCgpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gRG9uJ3QgcGVlayB3aGlsc3QgcmVnaXN0ZXJpbmcgb3RoZXJ3aXNlIGdldFBlbmRpbmdFdmVudExpc3QgY29tcGxhaW5zXG4gICAgICAgICAgICAvLyBEbyB0aGlzIGJ5IGluZGljYXRpbmcgb3VyIGludGVudGlvbiB0byBqb2luXG5cbiAgICAgICAgICAgIC8vIFhYWDogSUxBRyBpcyBkaXNhYmxlZCBmb3Igbm93LFxuICAgICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzgyMjJcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nfSk7XG4gICAgICAgICAgICAvLyBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgLy8gICAgIGFjdGlvbjogJ3dpbGxfam9pbicsXG4gICAgICAgICAgICAvLyB9KTtcblxuICAgICAgICAgICAgLy8gY29uc3QgU2V0TXhJZERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuU2V0TXhJZERpYWxvZycpO1xuICAgICAgICAgICAgLy8gY29uc3QgY2xvc2UgPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTZXQgTVhJRCcsICcnLCBTZXRNeElkRGlhbG9nLCB7XG4gICAgICAgICAgICAvLyAgICAgaG9tZXNlcnZlclVybDogY2xpLmdldEhvbWVzZXJ2ZXJVcmwoKSxcbiAgICAgICAgICAgIC8vICAgICBvbkZpbmlzaGVkOiAoc3VibWl0dGVkLCBjcmVkZW50aWFscykgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoc3VibWl0dGVkKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aGlzLnByb3BzLm9uUmVnaXN0ZXJlZChjcmVkZW50aWFscyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIGFjdGlvbjogJ2NhbmNlbF9hZnRlcl9zeW5jX3ByZXBhcmVkJyxcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICBhY3Rpb246ICdjYW5jZWxfam9pbicsXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH0sXG4gICAgICAgICAgICAvLyAgICAgb25EaWZmZXJlbnRTZXJ2ZXJDbGlja2VkOiAoZXYpID0+IHtcbiAgICAgICAgICAgIC8vICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzdGFydF9yZWdpc3RyYXRpb24nfSk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgICAgIC8vICAgICBvbkxvZ2luQ2xpY2s6IChldikgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3N0YXJ0X2xvZ2luJ30pO1xuICAgICAgICAgICAgLy8gICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgLy8gICAgIH0sXG4gICAgICAgICAgICAvLyB9KS5jbG9zZTtcbiAgICAgICAgICAgIC8vIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpZ25VcmwgPSB0aGlzLnByb3BzLnRoaXJkUGFydHlJbnZpdGUgP1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnRoaXJkUGFydHlJbnZpdGUuaW52aXRlU2lnblVybCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdqb2luX3Jvb20nLFxuICAgICAgICAgICAgICAgICAgICBvcHRzOiB7IGludml0ZVNpZ25Vcmw6IHNpZ25VcmwsIHZpYVNlcnZlcnM6IHRoaXMucHJvcHMudmlhU2VydmVycyB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgb25NZXNzYWdlTGlzdFNjcm9sbDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuX21lc3NhZ2VQYW5lbC5pc0F0RW5kT2ZMaXZlVGltZWxpbmUoKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbnVtVW5yZWFkTWVzc2FnZXM6IDAsXG4gICAgICAgICAgICAgICAgYXRFbmRPZkxpdmVUaW1lbGluZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYXRFbmRPZkxpdmVUaW1lbGluZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVUb3BVbnJlYWRNZXNzYWdlc0JhcigpO1xuICAgIH0sXG5cbiAgICBvbkRyYWdPdmVyOiBmdW5jdGlvbihldikge1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBldi5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdub25lJztcblxuICAgICAgICBjb25zdCBpdGVtcyA9IFsuLi5ldi5kYXRhVHJhbnNmZXIuaXRlbXNdO1xuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzRHJhZ2dpbmdGaWxlcyA9IGl0ZW1zLmV2ZXJ5KGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5raW5kID09ICdmaWxlJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoaXNEcmFnZ2luZ0ZpbGVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRyYWdnaW5nRmlsZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBldi5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdjb3B5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkRyb3A6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBDb250ZW50TWVzc2FnZXMuc2hhcmVkSW5zdGFuY2UoKS5zZW5kQ29udGVudExpc3RUb1Jvb20oXG4gICAgICAgICAgICBldi5kYXRhVHJhbnNmZXIuZmlsZXMsIHRoaXMuc3RhdGUucm9vbS5yb29tSWQsIHRoaXMuY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRyYWdnaW5nRmlsZTogZmFsc2UgfSk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG4gICAgfSxcblxuICAgIG9uRHJhZ0xlYXZlT3JFbmQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgZHJhZ2dpbmdGaWxlOiBmYWxzZSB9KTtcbiAgICB9LFxuXG4gICAgaW5qZWN0U3RpY2tlcjogZnVuY3Rpb24odXJsLCBpbmZvLCB0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuaXNHdWVzdCgpKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3JlcXVpcmVfcmVnaXN0cmF0aW9uJ30pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgQ29udGVudE1lc3NhZ2VzLnNoYXJlZEluc3RhbmNlKCkuc2VuZFN0aWNrZXJDb250ZW50VG9Sb29tKHVybCwgdGhpcy5zdGF0ZS5yb29tLnJvb21JZCwgaW5mbywgdGV4dCwgdGhpcy5jb250ZXh0KVxuICAgICAgICAgICAgLnRoZW4odW5kZWZpbmVkLCAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gXCJVbmtub3duRGV2aWNlRXJyb3JcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBMZXQgdGhlIHN0YXVzIGJhciBoYW5kbGUgdGhpc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uU2VhcmNoOiBmdW5jdGlvbih0ZXJtLCBzY29wZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlYXJjaFRlcm06IHRlcm0sXG4gICAgICAgICAgICBzZWFyY2hTY29wZTogc2NvcGUsXG4gICAgICAgICAgICBzZWFyY2hSZXN1bHRzOiB7fSxcbiAgICAgICAgICAgIHNlYXJjaEhpZ2hsaWdodHM6IFtdLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSBzZWFyY2ggcGFuZWwsIHdlIG5lZWQgdG8gdGVsbCBpdCB0byBmb3JnZXRcbiAgICAgICAgLy8gYWJvdXQgaXRzIHNjcm9sbCBzdGF0ZS5cbiAgICAgICAgaWYgKHRoaXMuX3NlYXJjaFJlc3VsdHNQYW5lbC5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9zZWFyY2hSZXN1bHRzUGFuZWwuY3VycmVudC5yZXNldFNjcm9sbFN0YXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBlbmQgdXAgc2hvd2luZyByZXN1bHRzIGZyb21cbiAgICAgICAgLy8gYW4gYWJvcnRlZCBzZWFyY2ggYnkga2VlcGluZyBhIHVuaXF1ZSBpZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gdG9kbzogc2hvdWxkIGNhbmNlbCBhbnkgcHJldmlvdXMgc2VhcmNoIHJlcXVlc3RzLlxuICAgICAgICB0aGlzLnNlYXJjaElkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgbGV0IHJvb21JZDtcbiAgICAgICAgaWYgKHNjb3BlID09PSBcIlJvb21cIikgcm9vbUlkID0gdGhpcy5zdGF0ZS5yb29tLnJvb21JZDtcblxuICAgICAgICBkZWJ1Z2xvZyhcInNlbmRpbmcgc2VhcmNoIHJlcXVlc3RcIik7XG4gICAgICAgIGNvbnN0IHNlYXJjaFByb21pc2UgPSBldmVudFNlYXJjaCh0ZXJtLCByb29tSWQpO1xuICAgICAgICB0aGlzLl9oYW5kbGVTZWFyY2hSZXN1bHQoc2VhcmNoUHJvbWlzZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVTZWFyY2hSZXN1bHQ6IGZ1bmN0aW9uKHNlYXJjaFByb21pc2UpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8ga2VlcCBhIHJlY29yZCBvZiB0aGUgY3VycmVudCBzZWFyY2ggaWQsIHNvIHRoYXQgaWYgdGhlIHNlYXJjaCB0ZXJtc1xuICAgICAgICAvLyBjaGFuZ2UgYmVmb3JlIHdlIGdldCBhIHJlc3BvbnNlLCB3ZSBjYW4gaWdub3JlIHRoZSByZXN1bHRzLlxuICAgICAgICBjb25zdCBsb2NhbFNlYXJjaElkID0gdGhpcy5zZWFyY2hJZDtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlYXJjaEluUHJvZ3Jlc3M6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWFyY2hQcm9taXNlLnRoZW4oZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgICAgICAgZGVidWdsb2coXCJzZWFyY2ggY29tcGxldGVcIik7XG4gICAgICAgICAgICBpZiAoc2VsZi51bm1vdW50ZWQgfHwgIXNlbGYuc3RhdGUuc2VhcmNoaW5nIHx8IHNlbGYuc2VhcmNoSWQgIT0gbG9jYWxTZWFyY2hJZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEaXNjYXJkaW5nIHN0YWxlIHNlYXJjaCByZXN1bHRzXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcG9zdGdyZXMgb24gc3luYXBzZSByZXR1cm5zIHVzIHByZWNpc2UgZGV0YWlscyBvZiB0aGUgc3RyaW5nc1xuICAgICAgICAgICAgLy8gd2hpY2ggYWN0dWFsbHkgZ290IG1hdGNoZWQgZm9yIGhpZ2hsaWdodGluZy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBJbiBlaXRoZXIgY2FzZSwgd2Ugd2FudCB0byBoaWdobGlnaHQgdGhlIGxpdGVyYWwgc2VhcmNoIHRlcm1cbiAgICAgICAgICAgIC8vIHdoZXRoZXIgaXQgd2FzIHVzZWQgYnkgdGhlIHNlYXJjaCBlbmdpbmUgb3Igbm90LlxuXG4gICAgICAgICAgICBsZXQgaGlnaGxpZ2h0cyA9IHJlc3VsdHMuaGlnaGxpZ2h0cztcbiAgICAgICAgICAgIGlmIChoaWdobGlnaHRzLmluZGV4T2Yoc2VsZi5zdGF0ZS5zZWFyY2hUZXJtKSA8IDApIHtcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRzID0gaGlnaGxpZ2h0cy5jb25jYXQoc2VsZi5zdGF0ZS5zZWFyY2hUZXJtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRm9yIG92ZXJsYXBwaW5nIGhpZ2hsaWdodHMsXG4gICAgICAgICAgICAvLyBmYXZvdXIgbG9uZ2VyIChtb3JlIHNwZWNpZmljKSB0ZXJtcyBmaXJzdFxuICAgICAgICAgICAgaGlnaGxpZ2h0cyA9IGhpZ2hsaWdodHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc2VhcmNoSGlnaGxpZ2h0czogaGlnaGxpZ2h0cyxcbiAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHRzOiByZXN1bHRzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlNlYXJjaCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2VhcmNoIGZhaWxlZCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlNlYXJjaCBmYWlsZWRcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICgoZXJyb3IgJiYgZXJyb3IubWVzc2FnZSkgPyBlcnJvci5tZXNzYWdlIDogX3QoXCJTZXJ2ZXIgbWF5IGJlIHVuYXZhaWxhYmxlLCBvdmVybG9hZGVkLCBvciBzZWFyY2ggdGltZWQgb3V0IDooXCIpKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc2VhcmNoSW5Qcm9ncmVzczogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFNlYXJjaFJlc3VsdFRpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgU2VhcmNoUmVzdWx0VGlsZSA9IHNkay5nZXRDb21wb25lbnQoJ3Jvb21zLlNlYXJjaFJlc3VsdFRpbGUnKTtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuXG4gICAgICAgIC8vIFhYWDogdG9kbzogbWVyZ2Ugb3ZlcmxhcHBpbmcgcmVzdWx0cyBzb21laG93P1xuICAgICAgICAvLyBYWFg6IHdoeSBkb2Vzbid0IHNlYXJjaGluZyBvbiBuYW1lIHdvcms/XG5cbiAgICAgICAgY29uc3QgcmV0ID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VhcmNoSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgcmV0LnB1c2goPGxpIGtleT1cInNlYXJjaC1zcGlubmVyXCI+XG4gICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgICAgPC9saT4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMubmV4dF9iYXRjaCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VhcmNoUmVzdWx0cy5yZXN1bHRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0LnB1c2goPGxpIGtleT1cInNlYXJjaC10b3AtbWFya2VyXCI+XG4gICAgICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfdG9wTWFya2VyXCI+eyBfdChcIk5vIHJlc3VsdHNcIikgfTwvaDI+XG4gICAgICAgICAgICAgICAgIDwvbGk+LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKDxsaSBrZXk9XCJzZWFyY2gtdG9wLW1hcmtlclwiPlxuICAgICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X3RvcE1hcmtlclwiPnsgX3QoXCJObyBtb3JlIHJlc3VsdHNcIikgfTwvaDI+XG4gICAgICAgICAgICAgICAgIDwvbGk+LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvbmNlIGR5bmFtaWMgY29udGVudCBpbiB0aGUgc2VhcmNoIHJlc3VsdHMgbG9hZCwgbWFrZSB0aGUgc2Nyb2xsUGFuZWwgY2hlY2tcbiAgICAgICAgLy8gdGhlIHNjcm9sbCBvZmZzZXRzLlxuICAgICAgICBjb25zdCBvbkhlaWdodENoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxQYW5lbCA9IHRoaXMuX3NlYXJjaFJlc3VsdHNQYW5lbC5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKHNjcm9sbFBhbmVsKSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsUGFuZWwuY2hlY2tTY3JvbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgbGFzdFJvb21JZDtcblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5zdGF0ZS5zZWFyY2hSZXN1bHRzLnJlc3VsdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc3RhdGUuc2VhcmNoUmVzdWx0cy5yZXN1bHRzW2ldO1xuXG4gICAgICAgICAgICBjb25zdCBteEV2ID0gcmVzdWx0LmNvbnRleHQuZ2V0RXZlbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb21JZCA9IG14RXYuZ2V0Um9vbUlkKCk7XG4gICAgICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20ocm9vbUlkKTtcblxuICAgICAgICAgICAgaWYgKCFoYXZlVGlsZUZvckV2ZW50KG14RXYpKSB7XG4gICAgICAgICAgICAgICAgLy8gWFhYOiBjYW4gdGhpcyBldmVyIGhhcHBlbj8gSXQgd2lsbCBtYWtlIHRoZSByZXN1bHQgY291bnRcbiAgICAgICAgICAgICAgICAvLyBub3QgbWF0Y2ggdGhlIGRpc3BsYXllZCBjb3VudC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VhcmNoU2NvcGUgPT09ICdBbGwnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvb21JZCAhPSBsYXN0Um9vbUlkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gWFhYOiBpZiB3ZSd2ZSBsZWZ0IHRoZSByb29tLCB3ZSBtaWdodCBub3Qga25vdyBhYm91dFxuICAgICAgICAgICAgICAgICAgICAvLyBpdC4gV2Ugc2hvdWxkIHRlbGwgdGhlIGpzIHNkayB0byBnbyBhbmQgZmluZCBvdXQgYWJvdXRcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQuIEJ1dCB0aGF0J3Mgbm90IGFuIGlzc3VlIGN1cnJlbnRseSwgYXMgc3luYXBzZSBvbmx5XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybnMgcmVzdWx0cyBmb3Igcm9vbXMgd2UncmUgam9pbmVkIHRvLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCByb29tTmFtZSA9IHJvb20gPyByb29tLm5hbWUgOiBfdChcIlVua25vd24gcm9vbSAlKHJvb21JZClzXCIsIHsgcm9vbUlkOiByb29tSWQgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goPGxpIGtleT17bXhFdi5nZXRJZCgpICsgXCItcm9vbVwifT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMj57IF90KFwiUm9vbVwiKSB9OiB7IHJvb21OYW1lIH08L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPik7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RSb29tSWQgPSByb29tSWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHRMaW5rID0gXCIjL3Jvb20vXCIrcm9vbUlkK1wiL1wiK214RXYuZ2V0SWQoKTtcblxuICAgICAgICAgICAgcmV0LnB1c2goPFNlYXJjaFJlc3VsdFRpbGUga2V5PXtteEV2LmdldElkKCl9XG4gICAgICAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHQ9e3Jlc3VsdH1cbiAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEhpZ2hsaWdodHM9e3RoaXMuc3RhdGUuc2VhcmNoSGlnaGxpZ2h0c31cbiAgICAgICAgICAgICAgICAgICAgIHJlc3VsdExpbms9e3Jlc3VsdExpbmt9XG4gICAgICAgICAgICAgICAgICAgICBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLl9nZXRQZXJtYWxpbmtDcmVhdG9yRm9yUm9vbShyb29tKX1cbiAgICAgICAgICAgICAgICAgICAgIG9uSGVpZ2h0Q2hhbmdlZD17b25IZWlnaHRDaGFuZ2VkfSAvPik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgb25QaW5uZWRDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG5vd1Nob3dpbmdQaW5uZWQgPSAhdGhpcy5zdGF0ZS5zaG93aW5nUGlubmVkO1xuICAgICAgICBjb25zdCByb29tSWQgPSB0aGlzLnN0YXRlLnJvb20ucm9vbUlkO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93aW5nUGlubmVkOiBub3dTaG93aW5nUGlubmVkLCBzZWFyY2hpbmc6IGZhbHNlfSk7XG4gICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJQaW5uZWRFdmVudHMuaXNPcGVuXCIsIHJvb21JZCwgU2V0dGluZ0xldmVsLlJPT01fREVWSUNFLCBub3dTaG93aW5nUGlubmVkKTtcbiAgICB9LFxuXG4gICAgb25TZXR0aW5nc0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiAnb3Blbl9yb29tX3NldHRpbmdzJyB9KTtcbiAgICB9LFxuXG4gICAgb25DYW5jZWxDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwidXBkYXRlVGludCBmcm9tIG9uQ2FuY2VsQ2xpY2tcIik7XG4gICAgICAgIHRoaXMudXBkYXRlVGludCgpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5mb3J3YXJkaW5nRXZlbnQpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZm9yd2FyZF9ldmVudCcsXG4gICAgICAgICAgICAgICAgZXZlbnQ6IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2ZvY3VzX2NvbXBvc2VyJ30pO1xuICAgIH0sXG5cbiAgICBvbkxlYXZlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAnbGVhdmVfcm9vbScsXG4gICAgICAgICAgICByb29tX2lkOiB0aGlzLnN0YXRlLnJvb20ucm9vbUlkLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25Gb3JnZXRDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5mb3JnZXQodGhpcy5zdGF0ZS5yb29tLnJvb21JZCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7IGFjdGlvbjogJ3ZpZXdfbmV4dF9yb29tJyB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJDb2RlID0gZXJyLmVycmNvZGUgfHwgX3QoXCJ1bmtub3duIGVycm9yIGNvZGVcIik7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGZvcmdldCByb29tJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRXJyb3JcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIGZvcmdldCByb29tICUoZXJyQ29kZSlzXCIsIHsgZXJyQ29kZTogZXJyQ29kZSB9KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25SZWplY3RCdXR0b25DbGlja2VkOiBmdW5jdGlvbihldikge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByZWplY3Rpbmc6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRleHQubGVhdmUodGhpcy5zdGF0ZS5yb29tSWQpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICd2aWV3X25leHRfcm9vbScgfSk7XG4gICAgICAgICAgICBzZWxmLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZWplY3Rpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlamVjdCBpbnZpdGU6ICVzXCIsIGVycm9yKTtcblxuICAgICAgICAgICAgY29uc3QgbXNnID0gZXJyb3IubWVzc2FnZSA/IGVycm9yLm1lc3NhZ2UgOiBKU09OLnN0cmluZ2lmeShlcnJvcik7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHJlamVjdCBpbnZpdGUnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJGYWlsZWQgdG8gcmVqZWN0IGludml0ZVwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogbXNnLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHJlamVjdGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVqZWN0RXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJlamVjdEFuZElnbm9yZUNsaWNrOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByZWplY3Rpbmc6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBteU1lbWJlciA9IHRoaXMuc3RhdGUucm9vbS5nZXRNZW1iZXIodGhpcy5jb250ZXh0LmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgIGNvbnN0IGludml0ZUV2ZW50ID0gbXlNZW1iZXIuZXZlbnRzLm1lbWJlcjtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWRVc2VycyA9IHRoaXMuY29udGV4dC5nZXRJZ25vcmVkVXNlcnMoKTtcbiAgICAgICAgICAgIGlnbm9yZWRVc2Vycy5wdXNoKGludml0ZUV2ZW50LmdldFNlbmRlcigpKTsgLy8gZGUtZHVwZWQgaW50ZXJuYWxseSBpbiB0aGUganMtc2RrXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuc2V0SWdub3JlZFVzZXJzKGlnbm9yZWRVc2Vycyk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5sZWF2ZSh0aGlzLnN0YXRlLnJvb21JZCk7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICd2aWV3X25leHRfcm9vbScgfSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZWplY3Rpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlamVjdCBpbnZpdGU6ICVzXCIsIGVycm9yKTtcblxuICAgICAgICAgICAgY29uc3QgbXNnID0gZXJyb3IubWVzc2FnZSA/IGVycm9yLm1lc3NhZ2UgOiBKU09OLnN0cmluZ2lmeShlcnJvcik7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHJlamVjdCBpbnZpdGUnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJGYWlsZWQgdG8gcmVqZWN0IGludml0ZVwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogbXNnLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHJlamVjdGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVqZWN0RXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25SZWplY3RUaHJlZXBpZEludml0ZUJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIC8vIFdlIGNhbiByZWplY3QgM3BpZCBpbnZpdGVzIGluIHRoZSBzYW1lIHdheSB0aGF0IHdlIGFjY2VwdCB0aGVtLFxuICAgICAgICAvLyB1c2luZyAvbGVhdmUgcmF0aGVyIHRoYW4gL2pvaW4uIEluIHRoZSBzaG9ydCB0ZXJtIHRob3VnaCwgd2VcbiAgICAgICAgLy8ganVzdCBpZ25vcmUgdGhlbS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS92ZWN0b3Itd2ViL2lzc3Vlcy8xMTM0XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb21fZGlyZWN0b3J5JyxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uU2VhcmNoQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlYXJjaGluZzogIXRoaXMuc3RhdGUuc2VhcmNoaW5nLFxuICAgICAgICAgICAgc2hvd2luZ1Bpbm5lZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkNhbmNlbFNlYXJjaENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzZWFyY2hpbmc6IGZhbHNlLFxuICAgICAgICAgICAgc2VhcmNoUmVzdWx0czogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIGp1bXAgZG93biB0byB0aGUgYm90dG9tIG9mIHRoaXMgcm9vbSwgd2hlcmUgbmV3IGV2ZW50cyBhcmUgYXJyaXZpbmdcbiAgICBqdW1wVG9MaXZlVGltZWxpbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwuanVtcFRvTGl2ZVRpbWVsaW5lKCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG4gICAgfSxcblxuICAgIC8vIGp1bXAgdXAgdG8gd2hlcmV2ZXIgb3VyIHJlYWQgbWFya2VyIGlzXG4gICAganVtcFRvUmVhZE1hcmtlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VQYW5lbC5qdW1wVG9SZWFkTWFya2VyKCk7XG4gICAgfSxcblxuICAgIC8vIHVwZGF0ZSB0aGUgcmVhZCBtYXJrZXIgdG8gbWF0Y2ggdGhlIHJlYWQtcmVjZWlwdFxuICAgIGZvcmdldFJlYWRNYXJrZXI6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwuZm9yZ2V0UmVhZE1hcmtlcigpO1xuICAgIH0sXG5cbiAgICAvLyBkZWNpZGUgd2hldGhlciBvciBub3QgdGhlIHRvcCAndW5yZWFkIG1lc3NhZ2VzJyBiYXIgc2hvdWxkIGJlIHNob3duXG4gICAgX3VwZGF0ZVRvcFVucmVhZE1lc3NhZ2VzQmFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tZXNzYWdlUGFuZWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNob3dCYXIgPSB0aGlzLl9tZXNzYWdlUGFuZWwuY2FuSnVtcFRvUmVhZE1hcmtlcigpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zaG93VG9wVW5yZWFkTWVzc2FnZXNCYXIgIT0gc2hvd0Jhcikge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd1RvcFVucmVhZE1lc3NhZ2VzQmFyOiBzaG93QmFyfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcm9vbSwgc28gdGhhdCBpdCBjYW4gYmVcbiAgICAvLyByZXN0b3JlZCB3aGVuIHdlIHN3aXRjaCBiYWNrIHRvIGl0LlxuICAgIC8vXG4gICAgX2dldFNjcm9sbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZVBhbmVsID0gdGhpcy5fbWVzc2FnZVBhbmVsO1xuICAgICAgICBpZiAoIW1lc3NhZ2VQYW5lbCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gaWYgd2UncmUgZm9sbG93aW5nIHRoZSBsaXZlIHRpbWVsaW5lLCB3ZSB3YW50IHRvIHJldHVybiBudWxsOyB0aGF0XG4gICAgICAgIC8vIG1lYW5zIHRoYXQsIGlmIHdlIHN3aXRjaCBiYWNrLCB3ZSB3aWxsIGp1bXAgdG8gdGhlIHJlYWQtdXAtdG8gbWFyay5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhhdCBzaG91bGQgYmUgbW9yZSBpbnR1aXRpdmUgdGhhbiBzbGF2aXNobHkgcHJlc2VydmluZyB0aGUgY3VycmVudFxuICAgICAgICAvLyBzY3JvbGwgc3RhdGUsIGluIHRoZSBjYXNlIHdoZXJlIHRoZSByb29tIGFkdmFuY2VzIGluIHRoZSBtZWFudGltZVxuICAgICAgICAvLyAocGFydGljdWxhcmx5IGluIHRoZSBjYXNlIHRoYXQgdGhlIHVzZXIgcmVhZHMgc29tZSBzdHVmZiBvbiBhbm90aGVyXG4gICAgICAgIC8vIGRldmljZSkuXG4gICAgICAgIC8vXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF0RW5kT2ZMaXZlVGltZWxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsU3RhdGUgPSBtZXNzYWdlUGFuZWwuZ2V0U2Nyb2xsU3RhdGUoKTtcblxuICAgICAgICAvLyBnZXRTY3JvbGxTdGF0ZSBvbiBUaW1lbGluZVBhbmVsICptYXkqIHJldHVybiBudWxsLCBzbyBndWFyZCBhZ2FpbnN0IHRoYXRcbiAgICAgICAgaWYgKCFzY3JvbGxTdGF0ZSB8fCBzY3JvbGxTdGF0ZS5zdHVja0F0Qm90dG9tKSB7XG4gICAgICAgICAgICAvLyB3ZSBkb24ndCByZWFsbHkgZXhwZWN0IHRvIGJlIGluIHRoaXMgc3RhdGUsIGJ1dCBpdCB3aWxsXG4gICAgICAgICAgICAvLyBvY2Nhc2lvbmFsbHkgaGFwcGVuIHdoZW4gbm8gc2Nyb2xsIHN0YXRlIGhhcyBiZWVuIHNldCBvbiB0aGVcbiAgICAgICAgICAgIC8vIG1lc3NhZ2VQYW5lbCAoaWUsIHdlIGRpZG4ndCBoYXZlIGFuIGluaXRpYWwgZXZlbnQgKHNvIGl0J3NcbiAgICAgICAgICAgIC8vIHByb2JhYmx5IGEgbmV3IHJvb20pLCB0aGVyZSBoYXMgYmVlbiBubyB1c2VyLWluaXRpYXRlZCBzY3JvbGwsIGFuZFxuICAgICAgICAgICAgLy8gbm8gcmVhZC1yZWNlaXB0cyBoYXZlIGFycml2ZWQgdG8gdXBkYXRlIHRoZSBzY3JvbGwgcG9zaXRpb24pLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFJldHVybiBudWxsLCB3aGljaCB3aWxsIGNhdXNlIHVzIHRvIHNjcm9sbCB0byBsYXN0IHVucmVhZCBvblxuICAgICAgICAgICAgLy8gcmVsb2FkLlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZm9jdXNzZWRFdmVudDogc2Nyb2xsU3RhdGUudHJhY2tlZFNjcm9sbFRva2VuLFxuICAgICAgICAgICAgcGl4ZWxPZmZzZXQ6IHNjcm9sbFN0YXRlLnBpeGVsT2Zmc2V0LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvblJlc2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEl0IHNlZW1zIGZsZXhib3ggZG9lc24ndCBnaXZlIHVzIGEgd2F5IHRvIGNvbnN0cmFpbiB0aGUgYXV4UGFuZWwgaGVpZ2h0IHRvIGhhdmVcbiAgICAgICAgLy8gYSBtaW5pbXVtIG9mIHRoZSBoZWlnaHQgb2YgdGhlIHZpZGVvIGVsZW1lbnQsIHdoaWxzdCBhbHNvIGNhcHBpbmcgaXQgZnJvbSBwdXNoaW5nIG91dCB0aGUgcGFnZVxuICAgICAgICAvLyBzbyB3ZSBoYXZlIHRvIGRvIGl0IHZpYSBKUyBpbnN0ZWFkLiAgSW4gdGhpcyBpbXBsZW1lbnRhdGlvbiB3ZSBjYXAgdGhlIGhlaWdodCBieSBwdXR0aW5nXG4gICAgICAgIC8vIGEgbWF4SGVpZ2h0IG9uIHRoZSB1bmRlcmx5aW5nIHJlbW90ZSB2aWRlbyB0YWcuXG5cbiAgICAgICAgLy8gaGVhZGVyICsgZm9vdGVyICsgc3RhdHVzICsgZ2l2ZSB1cyBhdCBsZWFzdCAxMjBweCBvZiBzY3JvbGxiYWNrIGF0IGFsbCB0aW1lcy5cbiAgICAgICAgbGV0IGF1eFBhbmVsTWF4SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IC1cbiAgICAgICAgICAgICAgICAoODMgKyAvLyBoZWlnaHQgb2YgUm9vbUhlYWRlclxuICAgICAgICAgICAgICAgICAzNiArIC8vIGhlaWdodCBvZiB0aGUgc3RhdHVzIGFyZWFcbiAgICAgICAgICAgICAgICAgNzIgKyAvLyBtaW5pbXVtIGhlaWdodCBvZiB0aGUgbWVzc2FnZSBjb21wbW9zZXJcbiAgICAgICAgICAgICAgICAgMTIwKTsgLy8gYW1vdW50IG9mIGRlc2lyZWQgc2Nyb2xsYmFja1xuXG4gICAgICAgIC8vIFhYWDogdGhpcyBpcyBhIGJpdCBvZiBhIGhhY2sgYW5kIG1pZ2h0IHBvc3NpYmx5IGNhdXNlIHRoZSB2aWRlbyB0byBwdXNoIG91dCB0aGUgcGFnZSBhbnl3YXlcbiAgICAgICAgLy8gYnV0IGl0J3MgYmV0dGVyIHRoYW4gdGhlIHZpZGVvIGdvaW5nIG1pc3NpbmcgZW50aXJlbHlcbiAgICAgICAgaWYgKGF1eFBhbmVsTWF4SGVpZ2h0IDwgNTApIGF1eFBhbmVsTWF4SGVpZ2h0ID0gNTA7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YXV4UGFuZWxNYXhIZWlnaHQ6IGF1eFBhbmVsTWF4SGVpZ2h0fSk7XG4gICAgfSxcblxuICAgIG9uRnVsbHNjcmVlbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZGVvX2Z1bGxzY3JlZW4nLFxuICAgICAgICAgICAgZnVsbHNjcmVlbjogdHJ1ZSxcbiAgICAgICAgfSwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIG9uTXV0ZUF1ZGlvQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjYWxsID0gdGhpcy5fZ2V0Q2FsbEZvclJvb20oKTtcbiAgICAgICAgaWYgKCFjYWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3U3RhdGUgPSAhY2FsbC5pc01pY3JvcGhvbmVNdXRlZCgpO1xuICAgICAgICBjYWxsLnNldE1pY3JvcGhvbmVNdXRlZChuZXdTdGF0ZSk7XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTsgLy8gVE9ETzoganVzdCB1cGRhdGUgdGhlIHZvaXAgYnV0dG9uc1xuICAgIH0sXG5cbiAgICBvbk11dGVWaWRlb0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2FsbCA9IHRoaXMuX2dldENhbGxGb3JSb29tKCk7XG4gICAgICAgIGlmICghY2FsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld1N0YXRlID0gIWNhbGwuaXNMb2NhbFZpZGVvTXV0ZWQoKTtcbiAgICAgICAgY2FsbC5zZXRMb2NhbFZpZGVvTXV0ZWQobmV3U3RhdGUpO1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7IC8vIFRPRE86IGp1c3QgdXBkYXRlIHRoZSB2b2lwIGJ1dHRvbnNcbiAgICB9LFxuXG4gICAgb25TdGF0dXNCYXJWaXNpYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzQmFyVmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uU3RhdHVzQmFySGlkZGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBjdXJyZW50bHkgbm90IGRlc2lyZWQgYXMgaXQgaXMgYW5ub3lpbmcgaWYgaXQga2VlcHMgZXhwYW5kaW5nIGFuZCBjb2xsYXBzaW5nXG4gICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1c0JhclZpc2libGU6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIGJ5IHRoZSBwYXJlbnQgY29tcG9uZW50IHdoZW4gUGFnZVVwL0Rvd24vZXRjIGlzIHByZXNzZWQuXG4gICAgICpcbiAgICAgKiBXZSBwYXNzIGl0IGRvd24gdG8gdGhlIHNjcm9sbCBwYW5lbC5cbiAgICAgKi9cbiAgICBoYW5kbGVTY3JvbGxLZXk6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGxldCBwYW5lbDtcbiAgICAgICAgaWYgKHRoaXMuX3NlYXJjaFJlc3VsdHNQYW5lbC5jdXJyZW50KSB7XG4gICAgICAgICAgICBwYW5lbCA9IHRoaXMuX3NlYXJjaFJlc3VsdHNQYW5lbC5jdXJyZW50O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX21lc3NhZ2VQYW5lbCkge1xuICAgICAgICAgICAgcGFuZWwgPSB0aGlzLl9tZXNzYWdlUGFuZWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFuZWwpIHtcbiAgICAgICAgICAgIHBhbmVsLmhhbmRsZVNjcm9sbEtleShldik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IGFueSBjdXJyZW50IGNhbGwgZm9yIHRoaXMgcm9vbVxuICAgICAqL1xuICAgIF9nZXRDYWxsRm9yUm9vbTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yb29tKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ2FsbEhhbmRsZXIuZ2V0Q2FsbEZvclJvb20odGhpcy5zdGF0ZS5yb29tLnJvb21JZCk7XG4gICAgfSxcblxuICAgIC8vIHRoaXMgaGFzIHRvIGJlIGEgcHJvcGVyIG1ldGhvZCByYXRoZXIgdGhhbiBhbiB1bm5hbWVkIGZ1bmN0aW9uLFxuICAgIC8vIG90aGVyd2lzZSByZWFjdCBjYWxscyBpdCB3aXRoIG51bGwgb24gZWFjaCB1cGRhdGUuXG4gICAgX2dhdGhlclRpbWVsaW5lUGFuZWxSZWY6IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZVBhbmVsID0gcjtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidXBkYXRlVGludCBmcm9tIFJvb21WaWV3Ll9nYXRoZXJUaW1lbGluZVBhbmVsUmVmXCIpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUaW50KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldE9sZFJvb206IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjcmVhdGVFdmVudCA9IHRoaXMuc3RhdGUucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20uY3JlYXRlXCIsIFwiXCIpO1xuICAgICAgICBpZiAoIWNyZWF0ZUV2ZW50IHx8ICFjcmVhdGVFdmVudC5nZXRDb250ZW50KClbJ3ByZWRlY2Vzc29yJ10pIHJldHVybiBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuZ2V0Um9vbShjcmVhdGVFdmVudC5nZXRDb250ZW50KClbJ3ByZWRlY2Vzc29yJ11bJ3Jvb21faWQnXSk7XG4gICAgfSxcblxuICAgIF9nZXRIaWRkZW5IaWdobGlnaHRDb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG9sZFJvb20gPSB0aGlzLl9nZXRPbGRSb29tKCk7XG4gICAgICAgIGlmICghb2xkUm9vbSkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiBvbGRSb29tLmdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50KCdoaWdobGlnaHQnKTtcbiAgICB9LFxuXG4gICAgX29uSGlkZGVuSGlnaGxpZ2h0c0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgb2xkUm9vbSA9IHRoaXMuX2dldE9sZFJvb20oKTtcbiAgICAgICAgaWYgKCFvbGRSb29tKSByZXR1cm47XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiBcInZpZXdfcm9vbVwiLCByb29tX2lkOiBvbGRSb29tLnJvb21JZH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBSb29tSGVhZGVyID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuUm9vbUhlYWRlcicpO1xuICAgICAgICBjb25zdCBGb3J3YXJkTWVzc2FnZSA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5Gb3J3YXJkTWVzc2FnZVwiKTtcbiAgICAgICAgY29uc3QgQXV4UGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KFwicm9vbXMuQXV4UGFuZWxcIik7XG4gICAgICAgIGNvbnN0IFNlYXJjaEJhciA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5TZWFyY2hCYXJcIik7XG4gICAgICAgIGNvbnN0IFBpbm5lZEV2ZW50c1BhbmVsID0gc2RrLmdldENvbXBvbmVudChcInJvb21zLlBpbm5lZEV2ZW50c1BhbmVsXCIpO1xuICAgICAgICBjb25zdCBTY3JvbGxQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoXCJzdHJ1Y3R1cmVzLlNjcm9sbFBhbmVsXCIpO1xuICAgICAgICBjb25zdCBUaW50YWJsZVN2ZyA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5UaW50YWJsZVN2Z1wiKTtcbiAgICAgICAgY29uc3QgUm9vbVByZXZpZXdCYXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwicm9vbXMuUm9vbVByZXZpZXdCYXJcIik7XG4gICAgICAgIGNvbnN0IFRpbWVsaW5lUGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KFwic3RydWN0dXJlcy5UaW1lbGluZVBhbmVsXCIpO1xuICAgICAgICBjb25zdCBSb29tVXBncmFkZVdhcm5pbmdCYXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwicm9vbXMuUm9vbVVwZ3JhZGVXYXJuaW5nQmFyXCIpO1xuICAgICAgICBjb25zdCBSb29tUmVjb3ZlcnlSZW1pbmRlciA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5Sb29tUmVjb3ZlcnlSZW1pbmRlclwiKTtcbiAgICAgICAgY29uc3QgRXJyb3JCb3VuZGFyeSA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5FcnJvckJvdW5kYXJ5XCIpO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yb29tKSB7XG4gICAgICAgICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5zdGF0ZS5yb29tTG9hZGluZyB8fCB0aGlzLnN0YXRlLnBlZWtMb2FkaW5nO1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Um9vbVByZXZpZXdCYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuUHJldmlldz17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdMb2FkaW5nPXt0aGlzLnN0YXRlLnBlZWtMb2FkaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcj17dGhpcy5zdGF0ZS5yb29tTG9hZEVycm9yfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nPXtsb2FkaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqb2luaW5nPXt0aGlzLnN0YXRlLmpvaW5pbmd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9vYkRhdGE9e3RoaXMucHJvcHMub29iRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9FcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgaW52aXRlck5hbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub29iRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbnZpdGVyTmFtZSA9IHRoaXMucHJvcHMub29iRGF0YS5pbnZpdGVyTmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGludml0ZWRFbWFpbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy50aGlyZFBhcnR5SW52aXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGludml0ZWRFbWFpbCA9IHRoaXMucHJvcHMudGhpcmRQYXJ0eUludml0ZS5pbnZpdGVkRW1haWw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBubyByb29tIG9iamVjdCBmb3IgdGhpcyByb29tLCBvbmx5IHRoZSBJRC5cbiAgICAgICAgICAgICAgICAvLyBXZSd2ZSBnb3QgdG8gdGhpcyByb29tIGJ5IGZvbGxvd2luZyBhIGxpbmssIHBvc3NpYmx5IGEgdGhpcmQgcGFydHkgaW52aXRlLlxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb21BbGlhcyA9IHRoaXMuc3RhdGUucm9vbUFsaWFzO1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxFcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSb29tUHJldmlld0JhciBvbkpvaW5DbGljaz17dGhpcy5vbkpvaW5CdXR0b25DbGlja2VkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvcmdldENsaWNrPXt0aGlzLm9uRm9yZ2V0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVqZWN0Q2xpY2s9e3RoaXMub25SZWplY3RUaHJlZXBpZEludml0ZUJ1dHRvbkNsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhblByZXZpZXc9e2ZhbHNlfSBlcnJvcj17dGhpcy5zdGF0ZS5yb29tTG9hZEVycm9yfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb29tQWxpYXM9e3Jvb21BbGlhc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgam9pbmluZz17dGhpcy5zdGF0ZS5qb2luaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZpdGVyTmFtZT17aW52aXRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludml0ZWRFbWFpbD17aW52aXRlZEVtYWlsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvb2JEYXRhPXt0aGlzLnByb3BzLm9vYkRhdGF9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25Vcmw9e3RoaXMucHJvcHMudGhpcmRQYXJ0eUludml0ZSA/IHRoaXMucHJvcHMudGhpcmRQYXJ0eUludml0ZS5pbnZpdGVTaWduVXJsIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbT17dGhpcy5zdGF0ZS5yb29tfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0Vycm9yQm91bmRhcnk+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBteU1lbWJlcnNoaXAgPSB0aGlzLnN0YXRlLnJvb20uZ2V0TXlNZW1iZXJzaGlwKCk7XG4gICAgICAgIGlmIChteU1lbWJlcnNoaXAgPT0gJ2ludml0ZScpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmpvaW5pbmcgfHwgdGhpcy5zdGF0ZS5yZWplY3RpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxSb29tUHJldmlld0JhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhblByZXZpZXc9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yPXt0aGlzLnN0YXRlLnJvb21Mb2FkRXJyb3J9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgam9pbmluZz17dGhpcy5zdGF0ZS5qb2luaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdGluZz17dGhpcy5zdGF0ZS5yZWplY3Rpbmd9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L0Vycm9yQm91bmRhcnk+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXlVc2VySWQgPSB0aGlzLmNvbnRleHQuY3JlZGVudGlhbHMudXNlcklkO1xuICAgICAgICAgICAgICAgIGNvbnN0IG15TWVtYmVyID0gdGhpcy5zdGF0ZS5yb29tLmdldE1lbWJlcihteVVzZXJJZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW52aXRlRXZlbnQgPSBteU1lbWJlciA/IG15TWVtYmVyLmV2ZW50cy5tZW1iZXIgOiBudWxsO1xuICAgICAgICAgICAgICAgIGxldCBpbnZpdGVyTmFtZSA9IF90KFwiVW5rbm93blwiKTtcbiAgICAgICAgICAgICAgICBpZiAoaW52aXRlRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52aXRlck5hbWUgPSBpbnZpdGVFdmVudC5zZW5kZXIgPyBpbnZpdGVFdmVudC5zZW5kZXIubmFtZSA6IGludml0ZUV2ZW50LmdldFNlbmRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdlIGRlbGliZXJhdGVseSBkb24ndCB0cnkgdG8gcGVlayBpbnRvIGludml0ZXMsIGV2ZW4gaWYgd2UgaGF2ZSBwZXJtaXNzaW9uIHRvIHBlZWtcbiAgICAgICAgICAgICAgICAvLyBhcyB0aGV5IGNvdWxkIGJlIGEgc3BhbSB2ZWN0b3IuXG4gICAgICAgICAgICAgICAgLy8gWFhYOiBpbiBmdXR1cmUgd2UgY291bGQgZ2l2ZSB0aGUgb3B0aW9uIG9mIGEgJ1ByZXZpZXcnIGJ1dHRvbiB3aGljaCBsZXRzIHRoZW0gdmlldyBhbnl3YXkuXG5cbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVndWxhciBpbnZpdGUgZm9yIHRoaXMgcm9vbS5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Um9vbVByZXZpZXdCYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Kb2luQ2xpY2s9e3RoaXMub25Kb2luQnV0dG9uQ2xpY2tlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Gb3JnZXRDbGljaz17dGhpcy5vbkZvcmdldENsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblJlamVjdENsaWNrPXt0aGlzLm9uUmVqZWN0QnV0dG9uQ2xpY2tlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25SZWplY3RBbmRJZ25vcmVDbGljaz17dGhpcy5vblJlamVjdEFuZElnbm9yZUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZpdGVyTmFtZT17aW52aXRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhblByZXZpZXc9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqb2luaW5nPXt0aGlzLnN0YXRlLmpvaW5pbmd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMuc3RhdGUucm9vbX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9FcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgaGF2ZSBzdWNjZXNzZnVsbHkgbG9hZGVkIHRoaXMgcm9vbSwgYW5kIGFyZSBub3QgcHJldmlld2luZy5cbiAgICAgICAgLy8gRGlzcGxheSB0aGUgXCJub3JtYWxcIiByb29tIHZpZXcuXG5cbiAgICAgICAgY29uc3QgY2FsbCA9IHRoaXMuX2dldENhbGxGb3JSb29tKCk7XG4gICAgICAgIGxldCBpbkNhbGwgPSBmYWxzZTtcbiAgICAgICAgaWYgKGNhbGwgJiYgKHRoaXMuc3RhdGUuY2FsbFN0YXRlICE9PSAnZW5kZWQnICYmIHRoaXMuc3RhdGUuY2FsbFN0YXRlICE9PSAncmluZ2luZycpKSB7XG4gICAgICAgICAgICBpbkNhbGwgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsaGVhZGVyX2NsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgIG14X1Jvb21WaWV3X3Njcm9sbGhlYWRlcjogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHN0YXR1c0JhcjtcbiAgICAgICAgbGV0IGlzU3RhdHVzQXJlYUV4cGFuZGVkID0gdHJ1ZTtcblxuICAgICAgICBpZiAoQ29udGVudE1lc3NhZ2VzLnNoYXJlZEluc3RhbmNlKCkuZ2V0Q3VycmVudFVwbG9hZHMoKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBVcGxvYWRCYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLlVwbG9hZEJhcicpO1xuICAgICAgICAgICAgc3RhdHVzQmFyID0gPFVwbG9hZEJhciByb29tPXt0aGlzLnN0YXRlLnJvb219IC8+O1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IFJvb21TdGF0dXNCYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLlJvb21TdGF0dXNCYXInKTtcbiAgICAgICAgICAgIGlzU3RhdHVzQXJlYUV4cGFuZGVkID0gdGhpcy5zdGF0ZS5zdGF0dXNCYXJWaXNpYmxlO1xuICAgICAgICAgICAgc3RhdHVzQmFyID0gPFJvb21TdGF0dXNCYXJcbiAgICAgICAgICAgICAgICByb29tPXt0aGlzLnN0YXRlLnJvb219XG4gICAgICAgICAgICAgICAgc2VudE1lc3NhZ2VBbmRJc0Fsb25lPXt0aGlzLnN0YXRlLmlzQWxvbmV9XG4gICAgICAgICAgICAgICAgaGFzQWN0aXZlQ2FsbD17aW5DYWxsfVxuICAgICAgICAgICAgICAgIGlzUGVla2luZz17bXlNZW1iZXJzaGlwICE9PSBcImpvaW5cIn1cbiAgICAgICAgICAgICAgICBvbkludml0ZUNsaWNrPXt0aGlzLm9uSW52aXRlQnV0dG9uQ2xpY2t9XG4gICAgICAgICAgICAgICAgb25TdG9wV2FybmluZ0NsaWNrPXt0aGlzLm9uU3RvcEFsb25lV2FybmluZ0NsaWNrfVxuICAgICAgICAgICAgICAgIG9uVmlzaWJsZT17dGhpcy5vblN0YXR1c0JhclZpc2libGV9XG4gICAgICAgICAgICAgICAgb25IaWRkZW49e3RoaXMub25TdGF0dXNCYXJIaWRkZW59XG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb21WZXJzaW9uUmVjb21tZW5kYXRpb24gPSB0aGlzLnN0YXRlLnVwZ3JhZGVSZWNvbW1lbmRhdGlvbjtcbiAgICAgICAgY29uc3Qgc2hvd1Jvb21VcGdyYWRlQmFyID0gKFxuICAgICAgICAgICAgcm9vbVZlcnNpb25SZWNvbW1lbmRhdGlvbiAmJlxuICAgICAgICAgICAgcm9vbVZlcnNpb25SZWNvbW1lbmRhdGlvbi5uZWVkc1VwZ3JhZGUgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUucm9vbS51c2VyTWF5VXBncmFkZVJvb20odGhpcy5jb250ZXh0LmNyZWRlbnRpYWxzLnVzZXJJZClcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBzaG93Um9vbVJlY292ZXJ5UmVtaW5kZXIgPSAoXG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd1Jvb21SZWNvdmVyeVJlbWluZGVyXCIpICYmXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuaXNSb29tRW5jcnlwdGVkKHRoaXMuc3RhdGUucm9vbS5yb29tSWQpICYmXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZ2V0S2V5QmFja3VwRW5hYmxlZCgpID09PSBmYWxzZVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGhpZGRlbkhpZ2hsaWdodENvdW50ID0gdGhpcy5fZ2V0SGlkZGVuSGlnaGxpZ2h0Q291bnQoKTtcblxuICAgICAgICBsZXQgYXV4ID0gbnVsbDtcbiAgICAgICAgbGV0IHByZXZpZXdCYXI7XG4gICAgICAgIGxldCBoaWRlQ2FuY2VsID0gZmFsc2U7XG4gICAgICAgIGxldCBmb3JjZUhpZGVSaWdodFBhbmVsID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmZvcndhcmRpbmdFdmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYXV4ID0gPEZvcndhcmRNZXNzYWdlIG9uQ2FuY2VsQ2xpY2s9e3RoaXMub25DYW5jZWxDbGlja30gLz47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5zZWFyY2hpbmcpIHtcbiAgICAgICAgICAgIGhpZGVDYW5jZWwgPSB0cnVlOyAvLyBoYXMgb3duIGNhbmNlbFxuICAgICAgICAgICAgYXV4ID0gPFNlYXJjaEJhciBzZWFyY2hJblByb2dyZXNzPXt0aGlzLnN0YXRlLnNlYXJjaEluUHJvZ3Jlc3N9IG9uQ2FuY2VsQ2xpY2s9e3RoaXMub25DYW5jZWxTZWFyY2hDbGlja30gb25TZWFyY2g9e3RoaXMub25TZWFyY2h9IC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHNob3dSb29tVXBncmFkZUJhcikge1xuICAgICAgICAgICAgYXV4ID0gPFJvb21VcGdyYWRlV2FybmluZ0JhciByb29tPXt0aGlzLnN0YXRlLnJvb219IHJlY29tbWVuZGF0aW9uPXtyb29tVmVyc2lvblJlY29tbWVuZGF0aW9ufSAvPjtcbiAgICAgICAgICAgIGhpZGVDYW5jZWwgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHNob3dSb29tUmVjb3ZlcnlSZW1pbmRlcikge1xuICAgICAgICAgICAgYXV4ID0gPFJvb21SZWNvdmVyeVJlbWluZGVyIG9uRG9udEFza0FnYWluU2V0PXt0aGlzLm9uUm9vbVJlY292ZXJ5UmVtaW5kZXJEb250QXNrQWdhaW59IC8+O1xuICAgICAgICAgICAgaGlkZUNhbmNlbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5zaG93aW5nUGlubmVkKSB7XG4gICAgICAgICAgICBoaWRlQ2FuY2VsID0gdHJ1ZTsgLy8gaGFzIG93biBjYW5jZWxcbiAgICAgICAgICAgIGF1eCA9IDxQaW5uZWRFdmVudHNQYW5lbCByb29tPXt0aGlzLnN0YXRlLnJvb219IG9uQ2FuY2VsQ2xpY2s9e3RoaXMub25QaW5uZWRDbGlja30gLz47XG4gICAgICAgIH0gZWxzZSBpZiAobXlNZW1iZXJzaGlwICE9PSBcImpvaW5cIikge1xuICAgICAgICAgICAgLy8gV2UgZG8gaGF2ZSBhIHJvb20gb2JqZWN0IGZvciB0aGlzIHJvb20sIGJ1dCB3ZSdyZSBub3QgY3VycmVudGx5IGluIGl0LlxuICAgICAgICAgICAgLy8gV2UgbWF5IGhhdmUgYSAzcmQgcGFydHkgaW52aXRlIHRvIGl0LlxuICAgICAgICAgICAgdmFyIGludml0ZXJOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub29iRGF0YSkge1xuICAgICAgICAgICAgICAgIGludml0ZXJOYW1lID0gdGhpcy5wcm9wcy5vb2JEYXRhLmludml0ZXJOYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGludml0ZWRFbWFpbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnRoaXJkUGFydHlJbnZpdGUpIHtcbiAgICAgICAgICAgICAgICBpbnZpdGVkRW1haWwgPSB0aGlzLnByb3BzLnRoaXJkUGFydHlJbnZpdGUuaW52aXRlZEVtYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGlkZUNhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICBwcmV2aWV3QmFyID0gKFxuICAgICAgICAgICAgICAgIDxSb29tUHJldmlld0JhciBvbkpvaW5DbGljaz17dGhpcy5vbkpvaW5CdXR0b25DbGlja2VkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZvcmdldENsaWNrPXt0aGlzLm9uRm9yZ2V0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVqZWN0Q2xpY2s9e3RoaXMub25SZWplY3RUaHJlZXBpZEludml0ZUJ1dHRvbkNsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpvaW5pbmc9e3RoaXMuc3RhdGUuam9pbmluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52aXRlck5hbWU9e2ludml0ZXJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZpdGVkRW1haWw9e2ludml0ZWRFbWFpbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb29iRGF0YT17dGhpcy5wcm9wcy5vb2JEYXRhfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5QcmV2aWV3PXt0aGlzLnN0YXRlLmNhblBlZWt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMuc3RhdGUucm9vbX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZS5jYW5QZWVrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tVmlld1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBwcmV2aWV3QmFyIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yY2VIaWRlUmlnaHRQYW5lbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaGlkZGVuSGlnaGxpZ2h0Q291bnQgPiAwKSB7XG4gICAgICAgICAgICBhdXggPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gZWxlbWVudD1cImRpdlwiIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X2F1eFBhbmVsX2hpZGRlbkhpZ2hsaWdodHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uSGlkZGVuSGlnaGxpZ2h0c0NsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJZb3UgaGF2ZSAlKGNvdW50KXMgdW5yZWFkIG5vdGlmaWNhdGlvbnMgaW4gYSBwcmlvciB2ZXJzaW9uIG9mIHRoaXMgcm9vbS5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHtjb3VudDogaGlkZGVuSGlnaGxpZ2h0Q291bnR9LFxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhdXhQYW5lbCA9IChcbiAgICAgICAgICAgIDxBdXhQYW5lbCByb29tPXt0aGlzLnN0YXRlLnJvb219XG4gICAgICAgICAgICAgIGZ1bGxIZWlnaHQ9e2ZhbHNlfVxuICAgICAgICAgICAgICB1c2VySWQ9e3RoaXMuY29udGV4dC5jcmVkZW50aWFscy51c2VySWR9XG4gICAgICAgICAgICAgIGNvbmZlcmVuY2VIYW5kbGVyPXt0aGlzLnByb3BzLkNvbmZlcmVuY2VIYW5kbGVyfVxuICAgICAgICAgICAgICBkcmFnZ2luZ0ZpbGU9e3RoaXMuc3RhdGUuZHJhZ2dpbmdGaWxlfVxuICAgICAgICAgICAgICBkaXNwbGF5Q29uZkNhbGxOb3RpZmljYXRpb249e3RoaXMuc3RhdGUuZGlzcGxheUNvbmZDYWxsTm90aWZpY2F0aW9ufVxuICAgICAgICAgICAgICBtYXhIZWlnaHQ9e3RoaXMuc3RhdGUuYXV4UGFuZWxNYXhIZWlnaHR9XG4gICAgICAgICAgICAgIHNob3dBcHBzPXt0aGlzLnN0YXRlLnNob3dBcHBzfVxuICAgICAgICAgICAgICBoaWRlQXBwc0RyYXdlcj17ZmFsc2V9ID5cbiAgICAgICAgICAgICAgICB7IGF1eCB9XG4gICAgICAgICAgICA8L0F1eFBhbmVsPlxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBtZXNzYWdlQ29tcG9zZXI7IGxldCBzZWFyY2hJbmZvO1xuICAgICAgICBjb25zdCBjYW5TcGVhayA9IChcbiAgICAgICAgICAgIC8vIGpvaW5lZCBhbmQgbm90IHNob3dpbmcgc2VhcmNoIHJlc3VsdHNcbiAgICAgICAgICAgIG15TWVtYmVyc2hpcCA9PT0gJ2pvaW4nICYmICF0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHNcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGNhblNwZWFrKSB7XG4gICAgICAgICAgICBjb25zdCBNZXNzYWdlQ29tcG9zZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5NZXNzYWdlQ29tcG9zZXInKTtcbiAgICAgICAgICAgIG1lc3NhZ2VDb21wb3NlciA9XG4gICAgICAgICAgICAgICAgPE1lc3NhZ2VDb21wb3NlclxuICAgICAgICAgICAgICAgICAgICByb29tPXt0aGlzLnN0YXRlLnJvb219XG4gICAgICAgICAgICAgICAgICAgIGNhbGxTdGF0ZT17dGhpcy5zdGF0ZS5jYWxsU3RhdGV9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkfVxuICAgICAgICAgICAgICAgICAgICBzaG93QXBwcz17dGhpcy5zdGF0ZS5zaG93QXBwc31cbiAgICAgICAgICAgICAgICAgICAgZTJlU3RhdHVzPXt0aGlzLnN0YXRlLmUyZVN0YXR1c31cbiAgICAgICAgICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvcj17dGhpcy5fZ2V0UGVybWFsaW5rQ3JlYXRvckZvclJvb20odGhpcy5zdGF0ZS5yb29tKX1cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IFdoeSBhcmVuJ3Qgd2Ugc3RvcmluZyB0aGUgdGVybS9zY29wZS9jb3VudCBpbiB0aGlzIGZvcm1hdFxuICAgICAgICAvLyBpbiB0aGlzLnN0YXRlIGlmIHRoaXMgaXMgd2hhdCBSb29tSGVhZGVyIGRlc2lyZXM/XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMpIHtcbiAgICAgICAgICAgIHNlYXJjaEluZm8gPSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoVGVybTogdGhpcy5zdGF0ZS5zZWFyY2hUZXJtLFxuICAgICAgICAgICAgICAgIHNlYXJjaFNjb3BlOiB0aGlzLnN0YXRlLnNlYXJjaFNjb3BlLFxuICAgICAgICAgICAgICAgIHNlYXJjaENvdW50OiB0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMuY291bnQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluQ2FsbCkge1xuICAgICAgICAgICAgbGV0IHpvb21CdXR0b247IGxldCB2b2ljZU11dGVCdXR0b247IGxldCB2aWRlb011dGVCdXR0b247XG5cbiAgICAgICAgICAgIGlmIChjYWxsLnR5cGUgPT09IFwidmlkZW9cIikge1xuICAgICAgICAgICAgICAgIHpvb21CdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfdm9pcEJ1dHRvblwiIG9uQ2xpY2s9e3RoaXMub25GdWxsc2NyZWVuQ2xpY2t9IHRpdGxlPXtfdChcIkZpbGwgc2NyZWVuXCIpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUaW50YWJsZVN2ZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL2Z1bGxzY3JlZW4uc3ZnXCIpfSB3aWR0aD1cIjI5XCIgaGVpZ2h0PVwiMjJcIiBzdHlsZT17eyBtYXJnaW5Ub3A6IDEsIG1hcmdpblJpZ2h0OiA0IH19IC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB2aWRlb011dGVCdXR0b24gPVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X3ZvaXBCdXR0b25cIiBvbkNsaWNrPXt0aGlzLm9uTXV0ZVZpZGVvQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRpbnRhYmxlU3ZnIHNyYz17Y2FsbC5pc0xvY2FsVmlkZW9NdXRlZCgpID8gcmVxdWlyZShcIi4uLy4uLy4uL3Jlcy9pbWcvdmlkZW8tdW5tdXRlLnN2Z1wiKSA6IHJlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL3ZpZGVvLW11dGUuc3ZnXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e2NhbGwuaXNMb2NhbFZpZGVvTXV0ZWQoKSA/IF90KFwiQ2xpY2sgdG8gdW5tdXRlIHZpZGVvXCIpIDogX3QoXCJDbGljayB0byBtdXRlIHZpZGVvXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD1cIjMxXCIgaGVpZ2h0PVwiMjdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2b2ljZU11dGVCdXR0b24gPVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfdm9pcEJ1dHRvblwiIG9uQ2xpY2s9e3RoaXMub25NdXRlQXVkaW9DbGlja30+XG4gICAgICAgICAgICAgICAgICAgIDxUaW50YWJsZVN2ZyBzcmM9e2NhbGwuaXNNaWNyb3Bob25lTXV0ZWQoKSA/IHJlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL3ZvaWNlLXVubXV0ZS5zdmdcIikgOiByZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy92b2ljZS1tdXRlLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e2NhbGwuaXNNaWNyb3Bob25lTXV0ZWQoKSA/IF90KFwiQ2xpY2sgdG8gdW5tdXRlIGF1ZGlvXCIpIDogX3QoXCJDbGljayB0byBtdXRlIGF1ZGlvXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPVwiMjFcIiBoZWlnaHQ9XCIyNlwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuXG4gICAgICAgICAgICAvLyB3cmFwIHRoZSBleGlzdGluZyBzdGF0dXMgYmFyIGludG8gYSAnY2FsbFN0YXR1c0Jhcicgd2hpY2ggYWRkcyBtb3JlIGtub2JzLlxuICAgICAgICAgICAgc3RhdHVzQmFyID1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X2NhbGxTdGF0dXNCYXJcIj5cbiAgICAgICAgICAgICAgICAgICAgeyB2b2ljZU11dGVCdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICB7IHZpZGVvTXV0ZUJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgem9vbUJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgc3RhdHVzQmFyIH1cbiAgICAgICAgICAgICAgICAgICAgPFRpbnRhYmxlU3ZnIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X3ZvaXBDaGV2cm9uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy92b2lwLWNoZXZyb24uc3ZnXCIpfSB3aWR0aD1cIjIyXCIgaGVpZ2h0PVwiMTdcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdlIGhhdmUgc2VhcmNoIHJlc3VsdHMsIHdlIGtlZXAgdGhlIG1lc3NhZ2VwYW5lbCAoc28gdGhhdCBpdCBwcmVzZXJ2ZXMgaXRzXG4gICAgICAgIC8vIHNjcm9sbCBzdGF0ZSksIGJ1dCBoaWRlIGl0LlxuICAgICAgICBsZXQgc2VhcmNoUmVzdWx0c1BhbmVsO1xuICAgICAgICBsZXQgaGlkZU1lc3NhZ2VQYW5lbCA9IGZhbHNlO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMpIHtcbiAgICAgICAgICAgIC8vIHNob3cgc2VhcmNoaW5nIHNwaW5uZXJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMucmVzdWx0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoUmVzdWx0c1BhbmVsID0gKDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfbWVzc2FnZVBhbmVsIG14X1Jvb21WaWV3X21lc3NhZ2VQYW5lbFNlYXJjaFNwaW5uZXJcIiAvPik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdHNQYW5lbCA9IChcbiAgICAgICAgICAgICAgICAgICAgPFNjcm9sbFBhbmVsIHJlZj17dGhpcy5fc2VhcmNoUmVzdWx0c1BhbmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfbWVzc2FnZVBhbmVsIG14X1Jvb21WaWV3X3NlYXJjaFJlc3VsdHNQYW5lbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbGxSZXF1ZXN0PXt0aGlzLm9uU2VhcmNoUmVzdWx0c0ZpbGxSZXF1ZXN0fVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplTm90aWZpZXI9e3RoaXMucHJvcHMucmVzaXplTm90aWZpZXJ9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9e3Njcm9sbGhlYWRlcl9jbGFzc2VzfT48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLmdldFNlYXJjaFJlc3VsdFRpbGVzKCkgfVxuICAgICAgICAgICAgICAgICAgICA8L1Njcm9sbFBhbmVsPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoaWRlTWVzc2FnZVBhbmVsID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNob3VsZEhpZ2hsaWdodCA9IHRoaXMuc3RhdGUuaXNJbml0aWFsRXZlbnRIaWdobGlnaHRlZDtcbiAgICAgICAgbGV0IGhpZ2hsaWdodGVkRXZlbnRJZCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmZvcndhcmRpbmdFdmVudCkge1xuICAgICAgICAgICAgaGlnaGxpZ2h0ZWRFdmVudElkID0gdGhpcy5zdGF0ZS5mb3J3YXJkaW5nRXZlbnQuZ2V0SWQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaG91bGRIaWdobGlnaHQpIHtcbiAgICAgICAgICAgIGhpZ2hsaWdodGVkRXZlbnRJZCA9IHRoaXMuc3RhdGUuaW5pdGlhbEV2ZW50SWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmluZm8oXCJTaG93VXJsUHJldmlldyBmb3IgJXMgaXMgJXNcIiwgdGhpcy5zdGF0ZS5yb29tLnJvb21JZCwgdGhpcy5zdGF0ZS5zaG93VXJsUHJldmlldyk7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VQYW5lbCA9IChcbiAgICAgICAgICAgIDxUaW1lbGluZVBhbmVsXG4gICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9nYXRoZXJUaW1lbGluZVBhbmVsUmVmfVxuICAgICAgICAgICAgICAgIHRpbWVsaW5lU2V0PXt0aGlzLnN0YXRlLnJvb20uZ2V0VW5maWx0ZXJlZFRpbWVsaW5lU2V0KCl9XG4gICAgICAgICAgICAgICAgc2hvd1JlYWRSZWNlaXB0cz17dGhpcy5zdGF0ZS5zaG93UmVhZFJlY2VpcHRzfVxuICAgICAgICAgICAgICAgIG1hbmFnZVJlYWRSZWNlaXB0cz17IXRoaXMuc3RhdGUuaXNQZWVraW5nfVxuICAgICAgICAgICAgICAgIG1hbmFnZVJlYWRNYXJrZXJzPXshdGhpcy5zdGF0ZS5pc1BlZWtpbmd9XG4gICAgICAgICAgICAgICAgaGlkZGVuPXtoaWRlTWVzc2FnZVBhbmVsfVxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkRXZlbnRJZD17aGlnaGxpZ2h0ZWRFdmVudElkfVxuICAgICAgICAgICAgICAgIGV2ZW50SWQ9e3RoaXMuc3RhdGUuaW5pdGlhbEV2ZW50SWR9XG4gICAgICAgICAgICAgICAgZXZlbnRQaXhlbE9mZnNldD17dGhpcy5zdGF0ZS5pbml0aWFsRXZlbnRQaXhlbE9mZnNldH1cbiAgICAgICAgICAgICAgICBvblNjcm9sbD17dGhpcy5vbk1lc3NhZ2VMaXN0U2Nyb2xsfVxuICAgICAgICAgICAgICAgIG9uUmVhZE1hcmtlclVwZGF0ZWQ9e3RoaXMuX3VwZGF0ZVRvcFVucmVhZE1lc3NhZ2VzQmFyfVxuICAgICAgICAgICAgICAgIHNob3dVcmxQcmV2aWV3ID0ge3RoaXMuc3RhdGUuc2hvd1VybFByZXZpZXd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfbWVzc2FnZVBhbmVsXCJcbiAgICAgICAgICAgICAgICBtZW1iZXJzTG9hZGVkPXt0aGlzLnN0YXRlLm1lbWJlcnNMb2FkZWR9XG4gICAgICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvcj17dGhpcy5fZ2V0UGVybWFsaW5rQ3JlYXRvckZvclJvb20odGhpcy5zdGF0ZS5yb29tKX1cbiAgICAgICAgICAgICAgICByZXNpemVOb3RpZmllcj17dGhpcy5wcm9wcy5yZXNpemVOb3RpZmllcn1cbiAgICAgICAgICAgICAgICBzaG93UmVhY3Rpb25zPXt0cnVlfVxuICAgICAgICAgICAgLz4pO1xuXG4gICAgICAgIGxldCB0b3BVbnJlYWRNZXNzYWdlc0JhciA9IG51bGw7XG4gICAgICAgIC8vIERvIG5vdCBzaG93IFRvcFVucmVhZE1lc3NhZ2VzQmFyIGlmIHdlIGhhdmUgc2VhcmNoIHJlc3VsdHMgc2hvd2luZywgaXQgbWFrZXMgbm8gc2Vuc2VcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2hvd1RvcFVucmVhZE1lc3NhZ2VzQmFyICYmICF0aGlzLnN0YXRlLnNlYXJjaFJlc3VsdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IFRvcFVucmVhZE1lc3NhZ2VzQmFyID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuVG9wVW5yZWFkTWVzc2FnZXNCYXInKTtcbiAgICAgICAgICAgIHRvcFVucmVhZE1lc3NhZ2VzQmFyID0gKDxUb3BVbnJlYWRNZXNzYWdlc0JhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TY3JvbGxVcENsaWNrPXt0aGlzLmp1bXBUb1JlYWRNYXJrZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsb3NlQ2xpY2s9e3RoaXMuZm9yZ2V0UmVhZE1hcmtlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQganVtcFRvQm90dG9tO1xuICAgICAgICAvLyBEbyBub3Qgc2hvdyBKdW1wVG9Cb3R0b21CdXR0b24gaWYgd2UgaGF2ZSBzZWFyY2ggcmVzdWx0cyBzaG93aW5nLCBpdCBtYWtlcyBubyBzZW5zZVxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuYXRFbmRPZkxpdmVUaW1lbGluZSAmJiAhdGhpcy5zdGF0ZS5zZWFyY2hSZXN1bHRzKSB7XG4gICAgICAgICAgICBjb25zdCBKdW1wVG9Cb3R0b21CdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5KdW1wVG9Cb3R0b21CdXR0b24nKTtcbiAgICAgICAgICAgIGp1bXBUb0JvdHRvbSA9ICg8SnVtcFRvQm90dG9tQnV0dG9uXG4gICAgICAgICAgICAgICAgbnVtVW5yZWFkTWVzc2FnZXM9e3RoaXMuc3RhdGUubnVtVW5yZWFkTWVzc2FnZXN9XG4gICAgICAgICAgICAgICAgb25TY3JvbGxUb0JvdHRvbUNsaWNrPXt0aGlzLmp1bXBUb0xpdmVUaW1lbGluZX1cbiAgICAgICAgICAgIC8+KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0dXNCYXJBcmVhQ2xhc3MgPSBjbGFzc05hbWVzKFxuICAgICAgICAgICAgXCJteF9Sb29tVmlld19zdGF0dXNBcmVhXCIsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJteF9Sb29tVmlld19zdGF0dXNBcmVhX2V4cGFuZGVkXCI6IGlzU3RhdHVzQXJlYUV4cGFuZGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBmYWRhYmxlU2VjdGlvbkNsYXNzZXMgPSBjbGFzc05hbWVzKFxuICAgICAgICAgICAgXCJteF9Sb29tVmlld19ib2R5XCIsIFwibXhfZmFkYWJsZVwiLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibXhfZmFkYWJsZV9mYWRlZFwiOiB0aGlzLnByb3BzLmRpc2FibGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBzaG93UmlnaHRQYW5lbCA9ICFmb3JjZUhpZGVSaWdodFBhbmVsICYmIHRoaXMuc3RhdGUucm9vbSAmJiB0aGlzLnN0YXRlLnNob3dSaWdodFBhbmVsO1xuICAgICAgICBjb25zdCByaWdodFBhbmVsID0gc2hvd1JpZ2h0UGFuZWxcbiAgICAgICAgICAgID8gPFJpZ2h0UGFuZWwgcm9vbUlkPXt0aGlzLnN0YXRlLnJvb20ucm9vbUlkfSByZXNpemVOb3RpZmllcj17dGhpcy5wcm9wcy5yZXNpemVOb3RpZmllcn0gLz5cbiAgICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICBjb25zdCB0aW1lbGluZUNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfUm9vbVZpZXdfdGltZWxpbmVcIiwge1xuICAgICAgICAgICAgbXhfUm9vbVZpZXdfdGltZWxpbmVfcnJfZW5hYmxlZDogdGhpcy5zdGF0ZS5zaG93UmVhZFJlY2VpcHRzLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYWluQ2xhc3NlcyA9IGNsYXNzTmFtZXMoXCJteF9Sb29tVmlld1wiLCB7XG4gICAgICAgICAgICBteF9Sb29tVmlld19pbkNhbGw6IGluQ2FsbCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxSb29tQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17dGhpcy5zdGF0ZX0+XG4gICAgICAgICAgICAgICAgPG1haW4gY2xhc3NOYW1lPXttYWluQ2xhc3Nlc30gcmVmPXt0aGlzLl9yb29tVmlld30gb25LZXlEb3duPXt0aGlzLm9uUmVhY3RLZXlEb3dufT5cbiAgICAgICAgICAgICAgICAgICAgPEVycm9yQm91bmRhcnk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Um9vbUhlYWRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMuc3RhdGUucm9vbX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hJbmZvPXtzZWFyY2hJbmZvfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9vYkRhdGE9e3RoaXMucHJvcHMub29iRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblJvb209e215TWVtYmVyc2hpcCA9PT0gJ2pvaW4nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VhcmNoQ2xpY2s9e3RoaXMub25TZWFyY2hDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNldHRpbmdzQ2xpY2s9e3RoaXMub25TZXR0aW5nc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUGlubmVkQ2xpY2s9e3RoaXMub25QaW5uZWRDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbENsaWNrPXsoYXV4ICYmICFoaWRlQ2FuY2VsKSA/IHRoaXMub25DYW5jZWxDbGljayA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Gb3JnZXRDbGljaz17KG15TWVtYmVyc2hpcCA9PT0gXCJsZWF2ZVwiKSA/IHRoaXMub25Gb3JnZXRDbGljayA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25MZWF2ZUNsaWNrPXsobXlNZW1iZXJzaGlwID09PSBcImpvaW5cIikgPyB0aGlzLm9uTGVhdmVDbGljayA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZTJlU3RhdHVzPXt0aGlzLnN0YXRlLmUyZVN0YXR1c31cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8TWFpblNwbGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWw9e3JpZ2h0UGFuZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplTm90aWZpZXI9e3RoaXMucHJvcHMucmVzaXplTm90aWZpZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2ZhZGFibGVTZWN0aW9uQ2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHthdXhQYW5lbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3RpbWVsaW5lQ2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dG9wVW5yZWFkTWVzc2FnZXNCYXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7anVtcFRvQm90dG9tfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21lc3NhZ2VQYW5lbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzZWFyY2hSZXN1bHRzUGFuZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3RhdHVzQmFyQXJlYUNsYXNzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfc3RhdHVzQXJlYUJveFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfc3RhdHVzQXJlYUJveF9saW5lXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3RhdHVzQmFyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cHJldmlld0Jhcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21lc3NhZ2VDb21wb3Nlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvTWFpblNwbGl0PlxuICAgICAgICAgICAgICAgICAgICA8L0Vycm9yQm91bmRhcnk+XG4gICAgICAgICAgICAgICAgPC9tYWluPlxuICAgICAgICAgICAgPC9Sb29tQ29udGV4dC5Qcm92aWRlcj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=