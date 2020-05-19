"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _SettingsStore = _interopRequireDefault(require("../../settings/SettingsStore"));

var _react = _interopRequireWildcard(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var Matrix = _interopRequireWildcard(require("matrix-js-sdk"));

var _languageHandler = require("../../languageHandler");

var _MatrixClientPeg = require("../../MatrixClientPeg");

var ObjectUtils = _interopRequireWildcard(require("../../ObjectUtils"));

var _UserActivity = _interopRequireDefault(require("../../UserActivity"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("../../index"));

var _Keyboard = require("../../Keyboard");

var _Timer = _interopRequireDefault(require("../../utils/Timer"));

var _shouldHideEvent = _interopRequireDefault(require("../../shouldHideEvent"));

var _EditorStateTransfer = _interopRequireDefault(require("../../utils/EditorStateTransfer"));

var _EventTile = require("../views/rooms/EventTile");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 New Vector Ltd
Copyright 2019-2020 The Matrix.org Foundation C.I.C.

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
const PAGINATE_SIZE = 20;
const INITIAL_SIZE = 20;
const READ_RECEIPT_INTERVAL_MS = 500;
const DEBUG = false;

let debuglog = function () {};

if (DEBUG) {
  // using bind means that we get to keep useful line numbers in the console
  debuglog = console.log.bind(console);
}
/*
 * Component which shows the event timeline in a room view.
 *
 * Also responsible for handling and sending read receipts.
 */


const TimelinePanel = (0, _createReactClass.default)({
  displayName: 'TimelinePanel',
  propTypes: {
    // The js-sdk EventTimelineSet object for the timeline sequence we are
    // representing.  This may or may not have a room, depending on what it's
    // a timeline representing.  If it has a room, we maintain RRs etc for
    // that room.
    timelineSet: _propTypes.default.object.isRequired,
    showReadReceipts: _propTypes.default.bool,
    // Enable managing RRs and RMs. These require the timelineSet to have a room.
    manageReadReceipts: _propTypes.default.bool,
    manageReadMarkers: _propTypes.default.bool,
    // true to give the component a 'display: none' style.
    hidden: _propTypes.default.bool,
    // ID of an event to highlight. If undefined, no event will be highlighted.
    // typically this will be either 'eventId' or undefined.
    highlightedEventId: _propTypes.default.string,
    // id of an event to jump to. If not given, will go to the end of the
    // live timeline.
    eventId: _propTypes.default.string,
    // where to position the event given by eventId, in pixels from the
    // bottom of the viewport. If not given, will try to put the event
    // half way down the viewport.
    eventPixelOffset: _propTypes.default.number,
    // Should we show URL Previews
    showUrlPreview: _propTypes.default.bool,
    // callback which is called when the panel is scrolled.
    onScroll: _propTypes.default.func,
    // callback which is called when the read-up-to mark is updated.
    onReadMarkerUpdated: _propTypes.default.func,
    // callback which is called when we wish to paginate the timeline
    // window.
    onPaginationRequest: _propTypes.default.func,
    // maximum number of events to show in a timeline
    timelineCap: _propTypes.default.number,
    // classname to use for the messagepanel
    className: _propTypes.default.string,
    // shape property to be passed to EventTiles
    tileShape: _propTypes.default.string,
    // placeholder text to use if the timeline is empty
    empty: _propTypes.default.string,
    // whether to show reactions for an event
    showReactions: _propTypes.default.bool
  },
  statics: {
    // a map from room id to read marker event timestamp
    roomReadMarkerTsMap: {}
  },
  getDefaultProps: function () {
    return {
      // By default, disable the timelineCap in favour of unpaginating based on
      // event tile heights. (See _unpaginateEvents)
      timelineCap: Number.MAX_VALUE,
      className: 'mx_RoomView_messagePanel'
    };
  },
  getInitialState: function () {
    // XXX: we could track RM per TimelineSet rather than per Room.
    // but for now we just do it per room for simplicity.
    let initialReadMarker = null;

    if (this.props.manageReadMarkers) {
      const readmarker = this.props.timelineSet.room.getAccountData('m.fully_read');

      if (readmarker) {
        initialReadMarker = readmarker.getContent().event_id;
      } else {
        initialReadMarker = this._getCurrentReadReceipt();
      }
    }

    return {
      events: [],
      liveEvents: [],
      timelineLoading: true,
      // track whether our room timeline is loading
      // the index of the first event that is to be shown
      firstVisibleEventIndex: 0,
      // canBackPaginate == false may mean:
      //
      // * we haven't (successfully) loaded the timeline yet, or:
      //
      // * we have got to the point where the room was created, or:
      //
      // * the server indicated that there were no more visible events
      //  (normally implying we got to the start of the room), or:
      //
      // * we gave up asking the server for more events
      canBackPaginate: false,
      // canForwardPaginate == false may mean:
      //
      // * we haven't (successfully) loaded the timeline yet
      //
      // * we have got to the end of time and are now tracking the live
      //   timeline, or:
      //
      // * the server indicated that there were no more visible events
      //   (not sure if this ever happens when we're not at the live
      //   timeline), or:
      //
      // * we are looking at some historical point, but gave up asking
      //   the server for more events
      canForwardPaginate: false,
      // start with the read-marker visible, so that we see its animated
      // disappearance when switching into the room.
      readMarkerVisible: true,
      readMarkerEventId: initialReadMarker,
      backPaginating: false,
      forwardPaginating: false,
      // cache of matrixClient.getSyncState() (but from the 'sync' event)
      clientSyncState: _MatrixClientPeg.MatrixClientPeg.get().getSyncState(),
      // should the event tiles have twelve hour times
      isTwelveHour: _SettingsStore.default.getValue("showTwelveHourTimestamps"),
      // always show timestamps on event tiles?
      alwaysShowTimestamps: _SettingsStore.default.getValue("alwaysShowTimestamps"),
      // how long to show the RM for when it's visible in the window
      readMarkerInViewThresholdMs: _SettingsStore.default.getValue("readMarkerInViewThresholdMs"),
      // how long to show the RM for when it's scrolled off-screen
      readMarkerOutOfViewThresholdMs: _SettingsStore.default.getValue("readMarkerOutOfViewThresholdMs")
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    debuglog("TimelinePanel: mounting");
    this.lastRRSentEventId = undefined;
    this.lastRMSentEventId = undefined;
    this._messagePanel = (0, _react.createRef)();

    if (this.props.manageReadReceipts) {
      this.updateReadReceiptOnUserActivity();
    }

    if (this.props.manageReadMarkers) {
      this.updateReadMarkerOnUserActivity();
    }

    this.dispatcherRef = _dispatcher.default.register(this.onAction);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.timeline", this.onRoomTimeline);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.timelineReset", this.onRoomTimelineReset);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.redaction", this.onRoomRedaction); // same event handler as Room.redaction as for both we just do forceUpdate


    _MatrixClientPeg.MatrixClientPeg.get().on("Room.redactionCancelled", this.onRoomRedaction);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.receipt", this.onRoomReceipt);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.localEchoUpdated", this.onLocalEchoUpdated);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.accountData", this.onAccountData);

    _MatrixClientPeg.MatrixClientPeg.get().on("Event.decrypted", this.onEventDecrypted);

    _MatrixClientPeg.MatrixClientPeg.get().on("Event.replaced", this.onEventReplaced);

    _MatrixClientPeg.MatrixClientPeg.get().on("sync", this.onSync);

    this._initTimeline(this.props);
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    if (newProps.timelineSet !== this.props.timelineSet) {
      // throw new Error("changing timelineSet on a TimelinePanel is not supported");
      // regrettably, this does happen; in particular, when joining a
      // room with /join. In that case, there are two Rooms in
      // circulation - one which is created by the MatrixClient.joinRoom
      // call and used to create the RoomView, and a second which is
      // created by the sync loop once the room comes back down the /sync
      // pipe. Once the latter happens, our room is replaced with the new one.
      //
      // for now, just warn about this. But we're going to end up paginating
      // both rooms separately, and it's all bad.
      console.warn("Replacing timelineSet on a TimelinePanel - confusion may ensue");
    }

    if (newProps.eventId != this.props.eventId) {
      console.log("TimelinePanel switching to eventId " + newProps.eventId + " (was " + this.props.eventId + ")");
      return this._initTimeline(newProps);
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (!ObjectUtils.shallowEqual(this.props, nextProps)) {
      if (DEBUG) {
        console.group("Timeline.shouldComponentUpdate: props change");
        console.log("props before:", this.props);
        console.log("props after:", nextProps);
        console.groupEnd();
      }

      return true;
    }

    if (!ObjectUtils.shallowEqual(this.state, nextState)) {
      if (DEBUG) {
        console.group("Timeline.shouldComponentUpdate: state change");
        console.log("state before:", this.state);
        console.log("state after:", nextState);
        console.groupEnd();
      }

      return true;
    }

    return false;
  },
  componentWillUnmount: function () {
    // set a boolean to say we've been unmounted, which any pending
    // promises can use to throw away their results.
    //
    // (We could use isMounted, but facebook have deprecated that.)
    this.unmounted = true;

    if (this._readReceiptActivityTimer) {
      this._readReceiptActivityTimer.abort();

      this._readReceiptActivityTimer = null;
    }

    if (this._readMarkerActivityTimer) {
      this._readMarkerActivityTimer.abort();

      this._readMarkerActivityTimer = null;
    }

    _dispatcher.default.unregister(this.dispatcherRef);

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("Room.timeline", this.onRoomTimeline);
      client.removeListener("Room.timelineReset", this.onRoomTimelineReset);
      client.removeListener("Room.redaction", this.onRoomRedaction);
      client.removeListener("Room.redactionCancelled", this.onRoomRedaction);
      client.removeListener("Room.receipt", this.onRoomReceipt);
      client.removeListener("Room.localEchoUpdated", this.onLocalEchoUpdated);
      client.removeListener("Room.accountData", this.onAccountData);
      client.removeListener("Event.decrypted", this.onEventDecrypted);
      client.removeListener("Event.replaced", this.onEventReplaced);
      client.removeListener("sync", this.onSync);
    }
  },
  onMessageListUnfillRequest: function (backwards, scrollToken) {
    // If backwards, unpaginate from the back (i.e. the start of the timeline)
    const dir = backwards ? Matrix.EventTimeline.BACKWARDS : Matrix.EventTimeline.FORWARDS;
    debuglog("TimelinePanel: unpaginating events in direction", dir); // All tiles are inserted by MessagePanel to have a scrollToken === eventId, and
    // this particular event should be the first or last to be unpaginated.

    const eventId = scrollToken;
    const marker = this.state.events.findIndex(ev => {
      return ev.getId() === eventId;
    });
    const count = backwards ? marker + 1 : this.state.events.length - marker;

    if (count > 0) {
      debuglog("TimelinePanel: Unpaginating", count, "in direction", dir);

      this._timelineWindow.unpaginate(count, backwards); // We can now paginate in the unpaginated direction


      const canPaginateKey = backwards ? 'canBackPaginate' : 'canForwardPaginate';

      const {
        events,
        liveEvents,
        firstVisibleEventIndex
      } = this._getEvents();

      this.setState({
        [canPaginateKey]: true,
        events,
        liveEvents,
        firstVisibleEventIndex
      });
    }
  },

  onPaginationRequest(timelineWindow, direction, size) {
    if (this.props.onPaginationRequest) {
      return this.props.onPaginationRequest(timelineWindow, direction, size);
    } else {
      return timelineWindow.paginate(direction, size);
    }
  },

  // set off a pagination request.
  onMessageListFillRequest: function (backwards) {
    if (!this._shouldPaginate()) return Promise.resolve(false);
    const dir = backwards ? Matrix.EventTimeline.BACKWARDS : Matrix.EventTimeline.FORWARDS;
    const canPaginateKey = backwards ? 'canBackPaginate' : 'canForwardPaginate';
    const paginatingKey = backwards ? 'backPaginating' : 'forwardPaginating';

    if (!this.state[canPaginateKey]) {
      debuglog("TimelinePanel: have given up", dir, "paginating this timeline");
      return Promise.resolve(false);
    }

    if (!this._timelineWindow.canPaginate(dir)) {
      debuglog("TimelinePanel: can't", dir, "paginate any further");
      this.setState({
        [canPaginateKey]: false
      });
      return Promise.resolve(false);
    }

    if (backwards && this.state.firstVisibleEventIndex !== 0) {
      debuglog("TimelinePanel: won't", dir, "paginate past first visible event");
      return Promise.resolve(false);
    }

    debuglog("TimelinePanel: Initiating paginate; backwards:" + backwards);
    this.setState({
      [paginatingKey]: true
    });
    return this.onPaginationRequest(this._timelineWindow, dir, PAGINATE_SIZE).then(r => {
      if (this.unmounted) {
        return;
      }

      debuglog("TimelinePanel: paginate complete backwards:" + backwards + "; success:" + r);

      const {
        events,
        liveEvents,
        firstVisibleEventIndex
      } = this._getEvents();

      const newState = {
        [paginatingKey]: false,
        [canPaginateKey]: r,
        events,
        liveEvents,
        firstVisibleEventIndex
      }; // moving the window in this direction may mean that we can now
      // paginate in the other where we previously could not.

      const otherDirection = backwards ? Matrix.EventTimeline.FORWARDS : Matrix.EventTimeline.BACKWARDS;
      const canPaginateOtherWayKey = backwards ? 'canForwardPaginate' : 'canBackPaginate';

      if (!this.state[canPaginateOtherWayKey] && this._timelineWindow.canPaginate(otherDirection)) {
        debuglog('TimelinePanel: can now', otherDirection, 'paginate again');
        newState[canPaginateOtherWayKey] = true;
      } // Don't resolve until the setState has completed: we need to let
      // the component update before we consider the pagination completed,
      // otherwise we'll end up paginating in all the history the js-sdk
      // has in memory because we never gave the component a chance to scroll
      // itself into the right place


      return new Promise(resolve => {
        this.setState(newState, () => {
          // we can continue paginating in the given direction if:
          // - _timelineWindow.paginate says we can
          // - we're paginating forwards, or we won't be trying to
          //   paginate backwards past the first visible event
          resolve(r && (!backwards || firstVisibleEventIndex === 0));
        });
      });
    });
  },
  onMessageListScroll: function (e) {
    if (this.props.onScroll) {
      this.props.onScroll(e);
    }

    if (this.props.manageReadMarkers) {
      const rmPosition = this.getReadMarkerPosition(); // we hide the read marker when it first comes onto the screen, but if
      // it goes back off the top of the screen (presumably because the user
      // clicks on the 'jump to bottom' button), we need to re-enable it.

      if (rmPosition < 0) {
        this.setState({
          readMarkerVisible: true
        });
      } // if read marker position goes between 0 and -1/1,
      // (and user is active), switch timeout


      const timeout = this._readMarkerTimeout(rmPosition); // NO-OP when timeout already has set to the given value


      this._readMarkerActivityTimer.changeTimeout(timeout);
    }
  },
  onAction: function (payload) {
    if (payload.action === 'ignore_state_changed') {
      this.forceUpdate();
    }

    if (payload.action === "edit_event") {
      const editState = payload.event ? new _EditorStateTransfer.default(payload.event) : null;
      this.setState({
        editState
      }, () => {
        if (payload.event && this._messagePanel.current) {
          this._messagePanel.current.scrollToEventIfNeeded(payload.event.getId());
        }
      });
    }
  },
  onRoomTimeline: function (ev, room, toStartOfTimeline, removed, data) {
    // ignore events for other timeline sets
    if (data.timeline.getTimelineSet() !== this.props.timelineSet) return; // ignore anything but real-time updates at the end of the room:
    // updates from pagination will happen when the paginate completes.

    if (toStartOfTimeline || !data || !data.liveEvent) return;
    if (!this._messagePanel.current) return;

    if (!this._messagePanel.current.getScrollState().stuckAtBottom) {
      // we won't load this event now, because we don't want to push any
      // events off the other end of the timeline. But we need to note
      // that we can now paginate.
      this.setState({
        canForwardPaginate: true
      });
      return;
    } // tell the timeline window to try to advance itself, but not to make
    // an http request to do so.
    //
    // we deliberately avoid going via the ScrollPanel for this call - the
    // ScrollPanel might already have an active pagination promise, which
    // will fail, but would stop us passing the pagination request to the
    // timeline window.
    //
    // see https://github.com/vector-im/vector-web/issues/1035


    this._timelineWindow.paginate(Matrix.EventTimeline.FORWARDS, 1, false).then(() => {
      if (this.unmounted) {
        return;
      }

      const {
        events,
        liveEvents,
        firstVisibleEventIndex
      } = this._getEvents();

      const lastLiveEvent = liveEvents[liveEvents.length - 1];
      const updatedState = {
        events,
        liveEvents,
        firstVisibleEventIndex
      };
      let callRMUpdated;

      if (this.props.manageReadMarkers) {
        // when a new event arrives when the user is not watching the
        // window, but the window is in its auto-scroll mode, make sure the
        // read marker is visible.
        //
        // We ignore events we have sent ourselves; we don't want to see the
        // read-marker when a remote echo of an event we have just sent takes
        // more than the timeout on userActiveRecently.
        //
        const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId;

        const sender = ev.sender ? ev.sender.userId : null;
        callRMUpdated = false;

        if (sender != myUserId && !_UserActivity.default.sharedInstance().userActiveRecently()) {
          updatedState.readMarkerVisible = true;
        } else if (lastLiveEvent && this.getReadMarkerPosition() === 0) {
          // we know we're stuckAtBottom, so we can advance the RM
          // immediately, to save a later render cycle
          this._setReadMarker(lastLiveEvent.getId(), lastLiveEvent.getTs(), true);

          updatedState.readMarkerVisible = false;
          updatedState.readMarkerEventId = lastLiveEvent.getId();
          callRMUpdated = true;
        }
      }

      this.setState(updatedState, () => {
        this._messagePanel.current.updateTimelineMinHeight();

        if (callRMUpdated) {
          this.props.onReadMarkerUpdated();
        }
      });
    });
  },
  onRoomTimelineReset: function (room, timelineSet) {
    if (timelineSet !== this.props.timelineSet) return;

    if (this._messagePanel.current && this._messagePanel.current.isAtBottom()) {
      this._loadTimeline();
    }
  },
  canResetTimeline: function () {
    return this._messagePanel.current && this._messagePanel.current.isAtBottom();
  },
  onRoomRedaction: function (ev, room) {
    if (this.unmounted) return; // ignore events for other rooms

    if (room !== this.props.timelineSet.room) return; // we could skip an update if the event isn't in our timeline,
    // but that's probably an early optimisation.

    this.forceUpdate();
  },
  onEventReplaced: function (replacedEvent, room) {
    if (this.unmounted) return; // ignore events for other rooms

    if (room !== this.props.timelineSet.room) return; // we could skip an update if the event isn't in our timeline,
    // but that's probably an early optimisation.

    this.forceUpdate();
  },
  onRoomReceipt: function (ev, room) {
    if (this.unmounted) return; // ignore events for other rooms

    if (room !== this.props.timelineSet.room) return;
    this.forceUpdate();
  },
  onLocalEchoUpdated: function (ev, room, oldEventId) {
    if (this.unmounted) return; // ignore events for other rooms

    if (room !== this.props.timelineSet.room) return;

    this._reloadEvents();
  },
  onAccountData: function (ev, room) {
    if (this.unmounted) return; // ignore events for other rooms

    if (room !== this.props.timelineSet.room) return;
    if (ev.getType() !== "m.fully_read") return; // XXX: roomReadMarkerTsMap not updated here so it is now inconsistent. Replace
    // this mechanism of determining where the RM is relative to the view-port with
    // one supported by the server (the client needs more than an event ID).

    this.setState({
      readMarkerEventId: ev.getContent().event_id
    }, this.props.onReadMarkerUpdated);
  },
  onEventDecrypted: function (ev) {
    // Can be null for the notification timeline, etc.
    if (!this.props.timelineSet.room) return; // Need to update as we don't display event tiles for events that
    // haven't yet been decrypted. The event will have just been updated
    // in place so we just need to re-render.
    // TODO: We should restrict this to only events in our timeline,
    // but possibly the event tile itself should just update when this
    // happens to save us re-rendering the whole timeline.

    if (ev.getRoomId() === this.props.timelineSet.room.roomId) {
      this.forceUpdate();
    }
  },
  onSync: function (state, prevState, data) {
    this.setState({
      clientSyncState: state
    });
  },

  _readMarkerTimeout(readMarkerPosition) {
    return readMarkerPosition === 0 ? this.state.readMarkerInViewThresholdMs : this.state.readMarkerOutOfViewThresholdMs;
  },

  updateReadMarkerOnUserActivity: async function () {
    const initialTimeout = this._readMarkerTimeout(this.getReadMarkerPosition());

    this._readMarkerActivityTimer = new _Timer.default(initialTimeout);

    while (this._readMarkerActivityTimer) {
      //unset on unmount
      _UserActivity.default.sharedInstance().timeWhileActiveRecently(this._readMarkerActivityTimer);

      try {
        await this._readMarkerActivityTimer.finished();
      } catch (e) {
        continue;
        /* aborted */
      } // outside of try/catch to not swallow errors


      this.updateReadMarker();
    }
  },
  updateReadReceiptOnUserActivity: async function () {
    this._readReceiptActivityTimer = new _Timer.default(READ_RECEIPT_INTERVAL_MS);

    while (this._readReceiptActivityTimer) {
      //unset on unmount
      _UserActivity.default.sharedInstance().timeWhileActiveNow(this._readReceiptActivityTimer);

      try {
        await this._readReceiptActivityTimer.finished();
      } catch (e) {
        continue;
        /* aborted */
      } // outside of try/catch to not swallow errors


      this.sendReadReceipt();
    }
  },
  sendReadReceipt: function () {
    if (_SettingsStore.default.getValue("lowBandwidth")) return;
    if (!this._messagePanel.current) return;
    if (!this.props.manageReadReceipts) return; // This happens on user_activity_end which is delayed, and it's
    // very possible have logged out within that timeframe, so check
    // we still have a client.

    const cli = _MatrixClientPeg.MatrixClientPeg.get(); // if no client or client is guest don't send RR or RM


    if (!cli || cli.isGuest()) return;
    let shouldSendRR = true;

    const currentRREventId = this._getCurrentReadReceipt(true);

    const currentRREventIndex = this._indexForEventId(currentRREventId); // We want to avoid sending out read receipts when we are looking at
    // events in the past which are before the latest RR.
    //
    // For now, let's apply a heuristic: if (a) the event corresponding to
    // the latest RR (either from the server, or sent by ourselves) doesn't
    // appear in our timeline, and (b) we could forward-paginate the event
    // timeline, then don't send any more RRs.
    //
    // This isn't watertight, as we could be looking at a section of
    // timeline which is *after* the latest RR (so we should actually send
    // RRs) - but that is a bit of a niche case. It will sort itself out when
    // the user eventually hits the live timeline.
    //


    if (currentRREventId && currentRREventIndex === null && this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS)) {
      shouldSendRR = false;
    }

    const lastReadEventIndex = this._getLastDisplayedEventIndex({
      ignoreOwn: true
    });

    if (lastReadEventIndex === null) {
      shouldSendRR = false;
    }

    let lastReadEvent = this.state.events[lastReadEventIndex];
    shouldSendRR = shouldSendRR && // Only send a RR if the last read event is ahead in the timeline relative to
    // the current RR event.
    lastReadEventIndex > currentRREventIndex && // Only send a RR if the last RR set != the one we would send
    this.lastRRSentEventId != lastReadEvent.getId(); // Only send a RM if the last RM sent != the one we would send

    const shouldSendRM = this.lastRMSentEventId != this.state.readMarkerEventId; // we also remember the last read receipt we sent to avoid spamming the
    // same one at the server repeatedly

    if (shouldSendRR || shouldSendRM) {
      if (shouldSendRR) {
        this.lastRRSentEventId = lastReadEvent.getId();
      } else {
        lastReadEvent = null;
      }

      this.lastRMSentEventId = this.state.readMarkerEventId;
      const roomId = this.props.timelineSet.room.roomId;
      const hiddenRR = !_SettingsStore.default.getValue("sendReadReceipts", roomId);
      debuglog('TimelinePanel: Sending Read Markers for ', this.props.timelineSet.room.roomId, 'rm', this.state.readMarkerEventId, lastReadEvent ? 'rr ' + lastReadEvent.getId() : '', ' hidden:' + hiddenRR);

      _MatrixClientPeg.MatrixClientPeg.get().setRoomReadMarkers(this.props.timelineSet.room.roomId, this.state.readMarkerEventId, lastReadEvent, // Could be null, in which case no RR is sent
      {
        hidden: hiddenRR
      }).catch(e => {
        // /read_markers API is not implemented on this HS, fallback to just RR
        if (e.errcode === 'M_UNRECOGNIZED' && lastReadEvent) {
          return _MatrixClientPeg.MatrixClientPeg.get().sendReadReceipt(lastReadEvent, {
            hidden: hiddenRR
          }).catch(e => {
            console.error(e);
            this.lastRRSentEventId = undefined;
          });
        } else {
          console.error(e);
        } // it failed, so allow retries next time the user is active


        this.lastRRSentEventId = undefined;
        this.lastRMSentEventId = undefined;
      }); // do a quick-reset of our unreadNotificationCount to avoid having
      // to wait from the remote echo from the homeserver.
      // we only do this if we're right at the end, because we're just assuming
      // that sending an RR for the latest message will set our notif counter
      // to zero: it may not do this if we send an RR for somewhere before the end.


      if (this.isAtEndOfLiveTimeline()) {
        this.props.timelineSet.room.setUnreadNotificationCount('total', 0);
        this.props.timelineSet.room.setUnreadNotificationCount('highlight', 0);

        _dispatcher.default.dispatch({
          action: 'on_room_read',
          roomId: this.props.timelineSet.room.roomId
        });
      }
    }
  },
  // if the read marker is on the screen, we can now assume we've caught up to the end
  // of the screen, so move the marker down to the bottom of the screen.
  updateReadMarker: function () {
    if (!this.props.manageReadMarkers) return;

    if (this.getReadMarkerPosition() === 1) {
      // the read marker is at an event below the viewport,
      // we don't want to rewind it.
      return;
    } // move the RM to *after* the message at the bottom of the screen. This
    // avoids a problem whereby we never advance the RM if there is a huge
    // message which doesn't fit on the screen.


    const lastDisplayedIndex = this._getLastDisplayedEventIndex({
      allowPartial: true
    });

    if (lastDisplayedIndex === null) {
      return;
    }

    const lastDisplayedEvent = this.state.events[lastDisplayedIndex];

    this._setReadMarker(lastDisplayedEvent.getId(), lastDisplayedEvent.getTs()); // the read-marker should become invisible, so that if the user scrolls
    // down, they don't see it.


    if (this.state.readMarkerVisible) {
      this.setState({
        readMarkerVisible: false
      });
    }
  },
  // advance the read marker past any events we sent ourselves.
  _advanceReadMarkerPastMyEvents: function () {
    if (!this.props.manageReadMarkers) return; // we call `_timelineWindow.getEvents()` rather than using
    // `this.state.liveEvents`, because React batches the update to the
    // latter, so it may not have been updated yet.

    const events = this._timelineWindow.getEvents(); // first find where the current RM is


    let i;

    for (i = 0; i < events.length; i++) {
      if (events[i].getId() == this.state.readMarkerEventId) {
        break;
      }
    }

    if (i >= events.length) {
      return;
    } // now think about advancing it


    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId;

    for (i++; i < events.length; i++) {
      const ev = events[i];

      if (!ev.sender || ev.sender.userId != myUserId) {
        break;
      }
    } // i is now the first unread message which we didn't send ourselves.


    i--;
    const ev = events[i];

    this._setReadMarker(ev.getId(), ev.getTs());
  },

  /* jump down to the bottom of this room, where new events are arriving
   */
  jumpToLiveTimeline: function () {
    // if we can't forward-paginate the existing timeline, then there
    // is no point reloading it - just jump straight to the bottom.
    //
    // Otherwise, reload the timeline rather than trying to paginate
    // through all of space-time.
    if (this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS)) {
      this._loadTimeline();
    } else {
      if (this._messagePanel.current) {
        this._messagePanel.current.scrollToBottom();
      }
    }
  },

  /* scroll to show the read-up-to marker. We put it 1/3 of the way down
   * the container.
   */
  jumpToReadMarker: function () {
    if (!this.props.manageReadMarkers) return;
    if (!this._messagePanel.current) return;
    if (!this.state.readMarkerEventId) return; // we may not have loaded the event corresponding to the read-marker
    // into the _timelineWindow. In that case, attempts to scroll to it
    // will fail.
    //
    // a quick way to figure out if we've loaded the relevant event is
    // simply to check if the messagepanel knows where the read-marker is.

    const ret = this._messagePanel.current.getReadMarkerPosition();

    if (ret !== null) {
      // The messagepanel knows where the RM is, so we must have loaded
      // the relevant event.
      this._messagePanel.current.scrollToEvent(this.state.readMarkerEventId, 0, 1 / 3);

      return;
    } // Looks like we haven't loaded the event corresponding to the read-marker.
    // As with jumpToLiveTimeline, we want to reload the timeline around the
    // read-marker.


    this._loadTimeline(this.state.readMarkerEventId, 0, 1 / 3);
  },

  /* update the read-up-to marker to match the read receipt
   */
  forgetReadMarker: function () {
    if (!this.props.manageReadMarkers) return;

    const rmId = this._getCurrentReadReceipt(); // see if we know the timestamp for the rr event


    const tl = this.props.timelineSet.getTimelineForEvent(rmId);
    let rmTs;

    if (tl) {
      const event = tl.getEvents().find(e => {
        return e.getId() == rmId;
      });

      if (event) {
        rmTs = event.getTs();
      }
    }

    this._setReadMarker(rmId, rmTs);
  },

  /* return true if the content is fully scrolled down and we are
   * at the end of the live timeline.
   */
  isAtEndOfLiveTimeline: function () {
    return this._messagePanel.current && this._messagePanel.current.isAtBottom() && this._timelineWindow && !this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS);
  },

  /* get the current scroll state. See ScrollPanel.getScrollState for
   * details.
   *
   * returns null if we are not mounted.
   */
  getScrollState: function () {
    if (!this._messagePanel.current) {
      return null;
    }

    return this._messagePanel.current.getScrollState();
  },
  // returns one of:
  //
  //  null: there is no read marker
  //  -1: read marker is above the window
  //   0: read marker is visible
  //  +1: read marker is below the window
  getReadMarkerPosition: function () {
    if (!this.props.manageReadMarkers) return null;
    if (!this._messagePanel.current) return null;

    const ret = this._messagePanel.current.getReadMarkerPosition();

    if (ret !== null) {
      return ret;
    } // the messagePanel doesn't know where the read marker is.
    // if we know the timestamp of the read marker, make a guess based on that.


    const rmTs = TimelinePanel.roomReadMarkerTsMap[this.props.timelineSet.room.roomId];

    if (rmTs && this.state.events.length > 0) {
      if (rmTs < this.state.events[0].getTs()) {
        return -1;
      } else {
        return 1;
      }
    }

    return null;
  },
  canJumpToReadMarker: function () {
    // 1. Do not show jump bar if neither the RM nor the RR are set.
    // 3. We want to show the bar if the read-marker is off the top of the screen.
    // 4. Also, if pos === null, the event might not be paginated - show the unread bar
    const pos = this.getReadMarkerPosition();
    const ret = this.state.readMarkerEventId !== null && ( // 1.
    pos < 0 || pos === null); // 3., 4.

    return ret;
  },

  /*
   * called by the parent component when PageUp/Down/etc is pressed.
   *
   * We pass it down to the scroll panel.
   */
  handleScrollKey: function (ev) {
    if (!this._messagePanel.current) {
      return;
    } // jump to the live timeline on ctrl-end, rather than the end of the
    // timeline window.


    if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey && ev.key === _Keyboard.Key.END) {
      this.jumpToLiveTimeline();
    } else {
      this._messagePanel.current.handleScrollKey(ev);
    }
  },
  _initTimeline: function (props) {
    const initialEvent = props.eventId;
    const pixelOffset = props.eventPixelOffset; // if a pixelOffset is given, it is relative to the bottom of the
    // container. If not, put the event in the middle of the container.

    let offsetBase = 1;

    if (pixelOffset == null) {
      offsetBase = 0.5;
    }

    return this._loadTimeline(initialEvent, pixelOffset, offsetBase);
  },

  /**
   * (re)-load the event timeline, and initialise the scroll state, centered
   * around the given event.
   *
   * @param {string?}  eventId the event to focus on. If undefined, will
   *    scroll to the bottom of the room.
   *
   * @param {number?} pixelOffset   offset to position the given event at
   *    (pixels from the offsetBase). If omitted, defaults to 0.
   *
   * @param {number?} offsetBase the reference point for the pixelOffset. 0
   *     means the top of the container, 1 means the bottom, and fractional
   *     values mean somewhere in the middle. If omitted, it defaults to 0.
   *
   * returns a promise which will resolve when the load completes.
   */
  _loadTimeline: function (eventId, pixelOffset, offsetBase) {
    this._timelineWindow = new Matrix.TimelineWindow(_MatrixClientPeg.MatrixClientPeg.get(), this.props.timelineSet, {
      windowLimit: this.props.timelineCap
    });

    const onLoaded = () => {
      // clear the timeline min-height when
      // (re)loading the timeline
      if (this._messagePanel.current) {
        this._messagePanel.current.onTimelineReset();
      }

      this._reloadEvents(); // If we switched away from the room while there were pending
      // outgoing events, the read-marker will be before those events.
      // We need to skip over any which have subsequently been sent.


      this._advanceReadMarkerPastMyEvents();

      this.setState({
        canBackPaginate: this._timelineWindow.canPaginate(Matrix.EventTimeline.BACKWARDS),
        canForwardPaginate: this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS),
        timelineLoading: false
      }, () => {
        // initialise the scroll state of the message panel
        if (!this._messagePanel.current) {
          // this shouldn't happen - we know we're mounted because
          // we're in a setState callback, and we know
          // timelineLoading is now false, so render() should have
          // mounted the message panel.
          console.log("can't initialise scroll state because " + "messagePanel didn't load");
          return;
        }

        if (eventId) {
          this._messagePanel.current.scrollToEvent(eventId, pixelOffset, offsetBase);
        } else {
          this._messagePanel.current.scrollToBottom();
        }

        this.sendReadReceipt();
      });
    };

    const onError = error => {
      this.setState({
        timelineLoading: false
      });
      console.error("Error loading timeline panel at ".concat(eventId, ": ").concat(error));
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      let onFinished; // if we were given an event ID, then when the user closes the
      // dialog, let's jump to the end of the timeline. If we weren't,
      // something has gone badly wrong and rather than causing a loop of
      // undismissable dialogs, let's just give up.

      if (eventId) {
        onFinished = () => {
          // go via the dispatcher so that the URL is updated
          _dispatcher.default.dispatch({
            action: 'view_room',
            room_id: this.props.timelineSet.room.roomId
          });
        };
      }

      let message;

      if (error.errcode == 'M_FORBIDDEN') {
        message = (0, _languageHandler._t)("Tried to load a specific point in this room's timeline, but you " + "do not have permission to view the message in question.");
      } else {
        message = (0, _languageHandler._t)("Tried to load a specific point in this room's timeline, but was " + "unable to find it.");
      }

      _Modal.default.createTrackedDialog('Failed to load timeline position', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to load timeline position"),
        description: message,
        onFinished: onFinished
      });
    }; // if we already have the event in question, TimelineWindow.load
    // returns a resolved promise.
    //
    // In this situation, we don't really want to defer the update of the
    // state to the next event loop, because it makes room-switching feel
    // quite slow. So we detect that situation and shortcut straight to
    // calling _reloadEvents and updating the state.


    const timeline = this.props.timelineSet.getTimelineForEvent(eventId);

    if (timeline) {
      // This is a hot-path optimization by skipping a promise tick
      // by repeating a no-op sync branch in TimelineSet.getTimelineForEvent & MatrixClient.getEventTimeline
      this._timelineWindow.load(eventId, INITIAL_SIZE); // in this branch this method will happen in sync time


      onLoaded();
    } else {
      const prom = this._timelineWindow.load(eventId, INITIAL_SIZE);

      this.setState({
        events: [],
        liveEvents: [],
        canBackPaginate: false,
        canForwardPaginate: false,
        timelineLoading: true
      });
      prom.then(onLoaded, onError);
    }
  },
  // handle the completion of a timeline load or localEchoUpdate, by
  // reloading the events from the timelinewindow and pending event list into
  // the state.
  _reloadEvents: function () {
    // we might have switched rooms since the load started - just bin
    // the results if so.
    if (this.unmounted) return;
    this.setState(this._getEvents());
  },
  // get the list of events from the timeline window and the pending event list
  _getEvents: function () {
    const events = this._timelineWindow.getEvents();

    const firstVisibleEventIndex = this._checkForPreJoinUISI(events); // Hold onto the live events separately. The read receipt and read marker
    // should use this list, so that they don't advance into pending events.


    const liveEvents = [...events]; // if we're at the end of the live timeline, append the pending events

    if (!this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS)) {
      events.push(...this.props.timelineSet.getPendingEvents());
    }

    return {
      events,
      liveEvents,
      firstVisibleEventIndex
    };
  },

  /**
   * Check for undecryptable messages that were sent while the user was not in
   * the room.
   *
   * @param {Array<MatrixEvent>} events The timeline events to check
   *
   * @return {Number} The index within `events` of the event after the most recent
   * undecryptable event that was sent while the user was not in the room.  If no
   * such events were found, then it returns 0.
   */
  _checkForPreJoinUISI: function (events) {
    const room = this.props.timelineSet.room;

    if (events.length === 0 || !room || !_MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(room.roomId)) {
      return 0;
    }

    const userId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId; // get the user's membership at the last event by getting the timeline
    // that the event belongs to, and traversing the timeline looking for
    // that event, while keeping track of the user's membership


    let i;
    let userMembership = "leave";

    for (i = events.length - 1; i >= 0; i--) {
      const timeline = room.getTimelineForEvent(events[i].getId());

      if (!timeline) {
        // Somehow, it seems to be possible for live events to not have
        // a timeline, even though that should not happen. :(
        // https://github.com/vector-im/riot-web/issues/12120
        console.warn("Event ".concat(events[i].getId(), " in room ").concat(room.roomId, " is live, ") + "but it does not have a timeline");
        continue;
      }

      const userMembershipEvent = timeline.getState(Matrix.EventTimeline.FORWARDS).getMember(userId);
      userMembership = userMembershipEvent ? userMembershipEvent.membership : "leave";
      const timelineEvents = timeline.getEvents();

      for (let j = timelineEvents.length - 1; j >= 0; j--) {
        const event = timelineEvents[j];

        if (event.getId() === events[i].getId()) {
          break;
        } else if (event.getStateKey() === userId && event.getType() === "m.room.member") {
          const prevContent = event.getPrevContent();
          userMembership = prevContent.membership || "leave";
        }
      }

      break;
    } // now go through the rest of the events and find the first undecryptable
    // one that was sent when the user wasn't in the room


    for (; i >= 0; i--) {
      const event = events[i];

      if (event.getStateKey() === userId && event.getType() === "m.room.member") {
        const prevContent = event.getPrevContent();
        userMembership = prevContent.membership || "leave";
      } else if (userMembership === "leave" && (event.isDecryptionFailure() || event.isBeingDecrypted())) {
        // reached an undecryptable message when the user wasn't in
        // the room -- don't try to load any more
        // Note: for now, we assume that events that are being decrypted are
        // not decryptable
        return i + 1;
      }
    }

    return 0;
  },
  _indexForEventId: function (evId) {
    for (let i = 0; i < this.state.events.length; ++i) {
      if (evId == this.state.events[i].getId()) {
        return i;
      }
    }

    return null;
  },
  _getLastDisplayedEventIndex: function (opts) {
    opts = opts || {};
    const ignoreOwn = opts.ignoreOwn || false;
    const allowPartial = opts.allowPartial || false;
    const messagePanel = this._messagePanel.current;
    if (!messagePanel) return null;

    const messagePanelNode = _reactDom.default.findDOMNode(messagePanel);

    if (!messagePanelNode) return null; // sometimes this happens for fresh rooms/post-sync

    const wrapperRect = messagePanelNode.getBoundingClientRect();

    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId;

    const isNodeInView = node => {
      if (node) {
        const boundingRect = node.getBoundingClientRect();

        if (allowPartial && boundingRect.top < wrapperRect.bottom || !allowPartial && boundingRect.bottom < wrapperRect.bottom) {
          return true;
        }
      }

      return false;
    }; // We keep track of how many of the adjacent events didn't have a tile
    // but should have the read receipt moved past them, so
    // we can include those once we find the last displayed (visible) event.
    // The counter is not started for events we don't want
    // to send a read receipt for (our own events, local echos).


    let adjacentInvisibleEventCount = 0; // Use `liveEvents` here because we don't want the read marker or read
    // receipt to advance into pending events.

    for (let i = this.state.liveEvents.length - 1; i >= 0; --i) {
      const ev = this.state.liveEvents[i];
      const node = messagePanel.getNodeForEventId(ev.getId());
      const isInView = isNodeInView(node); // when we've reached the first visible event, and the previous
      // events were all invisible (with the first one not being ignored),
      // return the index of the first invisible event.

      if (isInView && adjacentInvisibleEventCount !== 0) {
        return i + adjacentInvisibleEventCount;
      }

      if (node && !isInView) {
        // has node but not in view, so reset adjacent invisible events
        adjacentInvisibleEventCount = 0;
      }

      const shouldIgnore = !!ev.status || // local echo
      ignoreOwn && ev.sender && ev.sender.userId == myUserId; // own message

      const isWithoutTile = !(0, _EventTile.haveTileForEvent)(ev) || (0, _shouldHideEvent.default)(ev);

      if (isWithoutTile || !node) {
        // don't start counting if the event should be ignored,
        // but continue counting if we were already so the offset
        // to the previous invisble event that didn't need to be ignored
        // doesn't get messed up
        if (!shouldIgnore || shouldIgnore && adjacentInvisibleEventCount !== 0) {
          ++adjacentInvisibleEventCount;
        }

        continue;
      }

      if (shouldIgnore) {
        continue;
      }

      if (isInView) {
        return i;
      }
    }

    return null;
  },

  /**
   * Get the id of the event corresponding to our user's latest read-receipt.
   *
   * @param {Boolean} ignoreSynthesized If true, return only receipts that
   *                                    have been sent by the server, not
   *                                    implicit ones generated by the JS
   *                                    SDK.
   * @return {String} the event ID
   */
  _getCurrentReadReceipt: function (ignoreSynthesized) {
    const client = _MatrixClientPeg.MatrixClientPeg.get(); // the client can be null on logout


    if (client == null) {
      return null;
    }

    const myUserId = client.credentials.userId;
    return this.props.timelineSet.room.getEventReadUpTo(myUserId, ignoreSynthesized);
  },
  _setReadMarker: function (eventId, eventTs, inhibitSetState) {
    const roomId = this.props.timelineSet.room.roomId; // don't update the state (and cause a re-render) if there is
    // no change to the RM.

    if (eventId === this.state.readMarkerEventId) {
      return;
    } // in order to later figure out if the read marker is
    // above or below the visible timeline, we stash the timestamp.


    TimelinePanel.roomReadMarkerTsMap[roomId] = eventTs;

    if (inhibitSetState) {
      return;
    } // Do the local echo of the RM
    // run the render cycle before calling the callback, so that
    // getReadMarkerPosition() returns the right thing.


    this.setState({
      readMarkerEventId: eventId
    }, this.props.onReadMarkerUpdated);
  },
  _shouldPaginate: function () {
    // don't try to paginate while events in the timeline are
    // still being decrypted. We don't render events while they're
    // being decrypted, so they don't take up space in the timeline.
    // This means we can pull quite a lot of events into the timeline
    // and end up trying to render a lot of events.
    return !this.state.events.some(e => {
      return e.isBeingDecrypted();
    });
  },

  getRelationsForEvent(...args) {
    return this.props.timelineSet.getRelationsForEvent(...args);
  },

  render: function () {
    const MessagePanel = sdk.getComponent("structures.MessagePanel");
    const Loader = sdk.getComponent("elements.Spinner"); // just show a spinner while the timeline loads.
    //
    // put it in a div of the right class (mx_RoomView_messagePanel) so
    // that the order in the roomview flexbox is correct, and
    // mx_RoomView_messageListWrapper to position the inner div in the
    // right place.
    //
    // Note that the click-on-search-result functionality relies on the
    // fact that the messagePanel is hidden while the timeline reloads,
    // but that the RoomHeader (complete with search term) continues to
    // exist.

    if (this.state.timelineLoading) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_messagePanelSpinner"
      }, /*#__PURE__*/_react.default.createElement(Loader, null));
    }

    if (this.state.events.length == 0 && !this.state.canBackPaginate && this.props.empty) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: this.props.className + " mx_RoomView_messageListWrapper"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_empty"
      }, this.props.empty));
    } // give the messagepanel a stickybottom if we're at the end of the
    // live timeline, so that the arrival of new events triggers a
    // scroll.
    //
    // Make sure that stickyBottom is *false* if we can paginate
    // forwards, otherwise if somebody hits the bottom of the loaded
    // events when viewing historical messages, we get stuck in a loop
    // of paginating our way through the entire history of the room.


    const stickyBottom = !this._timelineWindow.canPaginate(Matrix.EventTimeline.FORWARDS); // If the state is PREPARED or CATCHUP, we're still waiting for the js-sdk to sync with
    // the HS and fetch the latest events, so we are effectively forward paginating.

    const forwardPaginating = this.state.forwardPaginating || ['PREPARED', 'CATCHUP'].includes(this.state.clientSyncState);
    const events = this.state.firstVisibleEventIndex ? this.state.events.slice(this.state.firstVisibleEventIndex) : this.state.events;
    return /*#__PURE__*/_react.default.createElement(MessagePanel, {
      ref: this._messagePanel,
      room: this.props.timelineSet.room,
      permalinkCreator: this.props.permalinkCreator,
      hidden: this.props.hidden,
      backPaginating: this.state.backPaginating,
      forwardPaginating: forwardPaginating,
      events: events,
      highlightedEventId: this.props.highlightedEventId,
      readMarkerEventId: this.state.readMarkerEventId,
      readMarkerVisible: this.state.readMarkerVisible,
      suppressFirstDateSeparator: this.state.canBackPaginate,
      showUrlPreview: this.props.showUrlPreview,
      showReadReceipts: this.props.showReadReceipts,
      ourUserId: _MatrixClientPeg.MatrixClientPeg.get().credentials.userId,
      stickyBottom: stickyBottom,
      onScroll: this.onMessageListScroll,
      onFillRequest: this.onMessageListFillRequest,
      onUnfillRequest: this.onMessageListUnfillRequest,
      isTwelveHour: this.state.isTwelveHour,
      alwaysShowTimestamps: this.state.alwaysShowTimestamps,
      className: this.props.className,
      tileShape: this.props.tileShape,
      resizeNotifier: this.props.resizeNotifier,
      getRelationsForEvent: this.getRelationsForEvent,
      editState: this.state.editState,
      showReactions: this.props.showReactions
    });
  }
});
var _default = TimelinePanel;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvVGltZWxpbmVQYW5lbC5qcyJdLCJuYW1lcyI6WyJQQUdJTkFURV9TSVpFIiwiSU5JVElBTF9TSVpFIiwiUkVBRF9SRUNFSVBUX0lOVEVSVkFMX01TIiwiREVCVUciLCJkZWJ1Z2xvZyIsImNvbnNvbGUiLCJsb2ciLCJiaW5kIiwiVGltZWxpbmVQYW5lbCIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwidGltZWxpbmVTZXQiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic2hvd1JlYWRSZWNlaXB0cyIsImJvb2wiLCJtYW5hZ2VSZWFkUmVjZWlwdHMiLCJtYW5hZ2VSZWFkTWFya2VycyIsImhpZGRlbiIsImhpZ2hsaWdodGVkRXZlbnRJZCIsInN0cmluZyIsImV2ZW50SWQiLCJldmVudFBpeGVsT2Zmc2V0IiwibnVtYmVyIiwic2hvd1VybFByZXZpZXciLCJvblNjcm9sbCIsImZ1bmMiLCJvblJlYWRNYXJrZXJVcGRhdGVkIiwib25QYWdpbmF0aW9uUmVxdWVzdCIsInRpbWVsaW5lQ2FwIiwiY2xhc3NOYW1lIiwidGlsZVNoYXBlIiwiZW1wdHkiLCJzaG93UmVhY3Rpb25zIiwic3RhdGljcyIsInJvb21SZWFkTWFya2VyVHNNYXAiLCJnZXREZWZhdWx0UHJvcHMiLCJOdW1iZXIiLCJNQVhfVkFMVUUiLCJnZXRJbml0aWFsU3RhdGUiLCJpbml0aWFsUmVhZE1hcmtlciIsInByb3BzIiwicmVhZG1hcmtlciIsInJvb20iLCJnZXRBY2NvdW50RGF0YSIsImdldENvbnRlbnQiLCJldmVudF9pZCIsIl9nZXRDdXJyZW50UmVhZFJlY2VpcHQiLCJldmVudHMiLCJsaXZlRXZlbnRzIiwidGltZWxpbmVMb2FkaW5nIiwiZmlyc3RWaXNpYmxlRXZlbnRJbmRleCIsImNhbkJhY2tQYWdpbmF0ZSIsImNhbkZvcndhcmRQYWdpbmF0ZSIsInJlYWRNYXJrZXJWaXNpYmxlIiwicmVhZE1hcmtlckV2ZW50SWQiLCJiYWNrUGFnaW5hdGluZyIsImZvcndhcmRQYWdpbmF0aW5nIiwiY2xpZW50U3luY1N0YXRlIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0U3luY1N0YXRlIiwiaXNUd2VsdmVIb3VyIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiYWx3YXlzU2hvd1RpbWVzdGFtcHMiLCJyZWFkTWFya2VySW5WaWV3VGhyZXNob2xkTXMiLCJyZWFkTWFya2VyT3V0T2ZWaWV3VGhyZXNob2xkTXMiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwibGFzdFJSU2VudEV2ZW50SWQiLCJ1bmRlZmluZWQiLCJsYXN0Uk1TZW50RXZlbnRJZCIsIl9tZXNzYWdlUGFuZWwiLCJ1cGRhdGVSZWFkUmVjZWlwdE9uVXNlckFjdGl2aXR5IiwidXBkYXRlUmVhZE1hcmtlck9uVXNlckFjdGl2aXR5IiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJvbiIsIm9uUm9vbVRpbWVsaW5lIiwib25Sb29tVGltZWxpbmVSZXNldCIsIm9uUm9vbVJlZGFjdGlvbiIsIm9uUm9vbVJlY2VpcHQiLCJvbkxvY2FsRWNob1VwZGF0ZWQiLCJvbkFjY291bnREYXRhIiwib25FdmVudERlY3J5cHRlZCIsIm9uRXZlbnRSZXBsYWNlZCIsIm9uU3luYyIsIl9pbml0VGltZWxpbmUiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5ld1Byb3BzIiwid2FybiIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5leHRQcm9wcyIsIm5leHRTdGF0ZSIsIk9iamVjdFV0aWxzIiwic2hhbGxvd0VxdWFsIiwiZ3JvdXAiLCJncm91cEVuZCIsInN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bm1vdW50ZWQiLCJfcmVhZFJlY2VpcHRBY3Rpdml0eVRpbWVyIiwiYWJvcnQiLCJfcmVhZE1hcmtlckFjdGl2aXR5VGltZXIiLCJ1bnJlZ2lzdGVyIiwiY2xpZW50IiwicmVtb3ZlTGlzdGVuZXIiLCJvbk1lc3NhZ2VMaXN0VW5maWxsUmVxdWVzdCIsImJhY2t3YXJkcyIsInNjcm9sbFRva2VuIiwiZGlyIiwiRXZlbnRUaW1lbGluZSIsIkJBQ0tXQVJEUyIsIkZPUldBUkRTIiwibWFya2VyIiwiZmluZEluZGV4IiwiZXYiLCJnZXRJZCIsImNvdW50IiwibGVuZ3RoIiwiX3RpbWVsaW5lV2luZG93IiwidW5wYWdpbmF0ZSIsImNhblBhZ2luYXRlS2V5IiwiX2dldEV2ZW50cyIsInNldFN0YXRlIiwidGltZWxpbmVXaW5kb3ciLCJkaXJlY3Rpb24iLCJzaXplIiwicGFnaW5hdGUiLCJvbk1lc3NhZ2VMaXN0RmlsbFJlcXVlc3QiLCJfc2hvdWxkUGFnaW5hdGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInBhZ2luYXRpbmdLZXkiLCJjYW5QYWdpbmF0ZSIsInRoZW4iLCJyIiwibmV3U3RhdGUiLCJvdGhlckRpcmVjdGlvbiIsImNhblBhZ2luYXRlT3RoZXJXYXlLZXkiLCJvbk1lc3NhZ2VMaXN0U2Nyb2xsIiwiZSIsInJtUG9zaXRpb24iLCJnZXRSZWFkTWFya2VyUG9zaXRpb24iLCJ0aW1lb3V0IiwiX3JlYWRNYXJrZXJUaW1lb3V0IiwiY2hhbmdlVGltZW91dCIsInBheWxvYWQiLCJhY3Rpb24iLCJmb3JjZVVwZGF0ZSIsImVkaXRTdGF0ZSIsImV2ZW50IiwiRWRpdG9yU3RhdGVUcmFuc2ZlciIsImN1cnJlbnQiLCJzY3JvbGxUb0V2ZW50SWZOZWVkZWQiLCJ0b1N0YXJ0T2ZUaW1lbGluZSIsInJlbW92ZWQiLCJkYXRhIiwidGltZWxpbmUiLCJnZXRUaW1lbGluZVNldCIsImxpdmVFdmVudCIsImdldFNjcm9sbFN0YXRlIiwic3R1Y2tBdEJvdHRvbSIsImxhc3RMaXZlRXZlbnQiLCJ1cGRhdGVkU3RhdGUiLCJjYWxsUk1VcGRhdGVkIiwibXlVc2VySWQiLCJjcmVkZW50aWFscyIsInVzZXJJZCIsInNlbmRlciIsIlVzZXJBY3Rpdml0eSIsInNoYXJlZEluc3RhbmNlIiwidXNlckFjdGl2ZVJlY2VudGx5IiwiX3NldFJlYWRNYXJrZXIiLCJnZXRUcyIsInVwZGF0ZVRpbWVsaW5lTWluSGVpZ2h0IiwiaXNBdEJvdHRvbSIsIl9sb2FkVGltZWxpbmUiLCJjYW5SZXNldFRpbWVsaW5lIiwicmVwbGFjZWRFdmVudCIsIm9sZEV2ZW50SWQiLCJfcmVsb2FkRXZlbnRzIiwiZ2V0VHlwZSIsImdldFJvb21JZCIsInJvb21JZCIsInByZXZTdGF0ZSIsInJlYWRNYXJrZXJQb3NpdGlvbiIsImluaXRpYWxUaW1lb3V0IiwiVGltZXIiLCJ0aW1lV2hpbGVBY3RpdmVSZWNlbnRseSIsImZpbmlzaGVkIiwidXBkYXRlUmVhZE1hcmtlciIsInRpbWVXaGlsZUFjdGl2ZU5vdyIsInNlbmRSZWFkUmVjZWlwdCIsImNsaSIsImlzR3Vlc3QiLCJzaG91bGRTZW5kUlIiLCJjdXJyZW50UlJFdmVudElkIiwiY3VycmVudFJSRXZlbnRJbmRleCIsIl9pbmRleEZvckV2ZW50SWQiLCJsYXN0UmVhZEV2ZW50SW5kZXgiLCJfZ2V0TGFzdERpc3BsYXllZEV2ZW50SW5kZXgiLCJpZ25vcmVPd24iLCJsYXN0UmVhZEV2ZW50Iiwic2hvdWxkU2VuZFJNIiwiaGlkZGVuUlIiLCJzZXRSb29tUmVhZE1hcmtlcnMiLCJjYXRjaCIsImVycmNvZGUiLCJlcnJvciIsImlzQXRFbmRPZkxpdmVUaW1lbGluZSIsInNldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50IiwiZGlzcGF0Y2giLCJsYXN0RGlzcGxheWVkSW5kZXgiLCJhbGxvd1BhcnRpYWwiLCJsYXN0RGlzcGxheWVkRXZlbnQiLCJfYWR2YW5jZVJlYWRNYXJrZXJQYXN0TXlFdmVudHMiLCJnZXRFdmVudHMiLCJpIiwianVtcFRvTGl2ZVRpbWVsaW5lIiwic2Nyb2xsVG9Cb3R0b20iLCJqdW1wVG9SZWFkTWFya2VyIiwicmV0Iiwic2Nyb2xsVG9FdmVudCIsImZvcmdldFJlYWRNYXJrZXIiLCJybUlkIiwidGwiLCJnZXRUaW1lbGluZUZvckV2ZW50Iiwicm1UcyIsImZpbmQiLCJjYW5KdW1wVG9SZWFkTWFya2VyIiwicG9zIiwiaGFuZGxlU2Nyb2xsS2V5IiwiY3RybEtleSIsInNoaWZ0S2V5IiwiYWx0S2V5IiwibWV0YUtleSIsImtleSIsIktleSIsIkVORCIsImluaXRpYWxFdmVudCIsInBpeGVsT2Zmc2V0Iiwib2Zmc2V0QmFzZSIsIk1hdHJpeCIsIlRpbWVsaW5lV2luZG93Iiwid2luZG93TGltaXQiLCJvbkxvYWRlZCIsIm9uVGltZWxpbmVSZXNldCIsIm9uRXJyb3IiLCJFcnJvckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIm9uRmluaXNoZWQiLCJyb29tX2lkIiwibWVzc2FnZSIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJsb2FkIiwicHJvbSIsIl9jaGVja0ZvclByZUpvaW5VSVNJIiwicHVzaCIsImdldFBlbmRpbmdFdmVudHMiLCJpc1Jvb21FbmNyeXB0ZWQiLCJ1c2VyTWVtYmVyc2hpcCIsInVzZXJNZW1iZXJzaGlwRXZlbnQiLCJnZXRTdGF0ZSIsImdldE1lbWJlciIsIm1lbWJlcnNoaXAiLCJ0aW1lbGluZUV2ZW50cyIsImoiLCJnZXRTdGF0ZUtleSIsInByZXZDb250ZW50IiwiZ2V0UHJldkNvbnRlbnQiLCJpc0RlY3J5cHRpb25GYWlsdXJlIiwiaXNCZWluZ0RlY3J5cHRlZCIsImV2SWQiLCJvcHRzIiwibWVzc2FnZVBhbmVsIiwibWVzc2FnZVBhbmVsTm9kZSIsIlJlYWN0RE9NIiwiZmluZERPTU5vZGUiLCJ3cmFwcGVyUmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImlzTm9kZUluVmlldyIsIm5vZGUiLCJib3VuZGluZ1JlY3QiLCJ0b3AiLCJib3R0b20iLCJhZGphY2VudEludmlzaWJsZUV2ZW50Q291bnQiLCJnZXROb2RlRm9yRXZlbnRJZCIsImlzSW5WaWV3Iiwic2hvdWxkSWdub3JlIiwic3RhdHVzIiwiaXNXaXRob3V0VGlsZSIsImlnbm9yZVN5bnRoZXNpemVkIiwiZ2V0RXZlbnRSZWFkVXBUbyIsImV2ZW50VHMiLCJpbmhpYml0U2V0U3RhdGUiLCJzb21lIiwiZ2V0UmVsYXRpb25zRm9yRXZlbnQiLCJhcmdzIiwicmVuZGVyIiwiTWVzc2FnZVBhbmVsIiwiTG9hZGVyIiwic3RpY2t5Qm90dG9tIiwiaW5jbHVkZXMiLCJzbGljZSIsInBlcm1hbGlua0NyZWF0b3IiLCJyZXNpemVOb3RpZmllciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1Q0EsTUFBTUEsYUFBYSxHQUFHLEVBQXRCO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLEVBQXJCO0FBQ0EsTUFBTUMsd0JBQXdCLEdBQUcsR0FBakM7QUFFQSxNQUFNQyxLQUFLLEdBQUcsS0FBZDs7QUFFQSxJQUFJQyxRQUFRLEdBQUcsWUFBVyxDQUFFLENBQTVCOztBQUNBLElBQUlELEtBQUosRUFBVztBQUNQO0FBQ0FDLEVBQUFBLFFBQVEsR0FBR0MsT0FBTyxDQUFDQyxHQUFSLENBQVlDLElBQVosQ0FBaUJGLE9BQWpCLENBQVg7QUFDSDtBQUVEOzs7Ozs7O0FBS0EsTUFBTUcsYUFBYSxHQUFHLCtCQUFpQjtBQUNuQ0MsRUFBQUEsV0FBVyxFQUFFLGVBRHNCO0FBR25DQyxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxJQUFBQSxXQUFXLEVBQUVDLG1CQUFVQyxNQUFWLENBQWlCQyxVQUx2QjtBQU9QQyxJQUFBQSxnQkFBZ0IsRUFBRUgsbUJBQVVJLElBUHJCO0FBUVA7QUFDQUMsSUFBQUEsa0JBQWtCLEVBQUVMLG1CQUFVSSxJQVR2QjtBQVVQRSxJQUFBQSxpQkFBaUIsRUFBRU4sbUJBQVVJLElBVnRCO0FBWVA7QUFDQUcsSUFBQUEsTUFBTSxFQUFFUCxtQkFBVUksSUFiWDtB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RDtBQWVJLE1BQUEsWUFBWSxFQUFFMEksWUFmbEI7QUFnQkksTUFBQSxRQUFRLEVBQUUsS0FBS3RLLG1CQWhCbkI7QUFpQkksTUFBQSxhQUFhLEVBQUUsS0FBS1gsd0JBakJ4QjtBQWtCSSxNQUFBLGVBQWUsRUFBRSxLQUFLdEIsMEJBbEIxQjtBQW1CSSxNQUFBLFlBQVksRUFBRSxLQUFLVCxLQUFMLENBQVd0QyxZQW5CN0I7QUFvQkksTUFBQSxvQkFBb0IsRUFBRSxLQUFLc0MsS0FBTCxDQUFXbkMsb0JBcEJyQztBQXFCSSxNQUFBLFNBQVMsRUFBRSxLQUFLeEIsS0FBTCxDQUFXWCxTQXJCMUI7QUFzQkksTUFBQSxTQUFTLEVBQUUsS0FBS1csS0FBTCxDQUFXVixTQXRCMUI7QUF1QkksTUFBQSxjQUFjLEVBQUUsS0FBS1UsS0FBTCxDQUFXK1EsY0F2Qi9CO0FBd0JJLE1BQUEsb0JBQW9CLEVBQUUsS0FBS1Qsb0JBeEIvQjtBQXlCSSxNQUFBLFNBQVMsRUFBRSxLQUFLM00sS0FBTCxDQUFXb0QsU0F6QjFCO0FBMEJJLE1BQUEsYUFBYSxFQUFFLEtBQUsvRyxLQUFMLENBQVdSO0FBMUI5QixNQURKO0FBOEJIO0FBbjNDa0MsQ0FBakIsQ0FBdEI7ZUFzM0NlMUIsYSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOS0yMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBSZWFjdERPTSBmcm9tIFwicmVhY3QtZG9tXCI7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtFdmVudFRpbWVsaW5lfSBmcm9tIFwibWF0cml4LWpzLXNka1wiO1xuaW1wb3J0ICogYXMgTWF0cml4IGZyb20gXCJtYXRyaXgtanMtc2RrXCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0ICogYXMgT2JqZWN0VXRpbHMgZnJvbSBcIi4uLy4uL09iamVjdFV0aWxzXCI7XG5pbXBvcnQgVXNlckFjdGl2aXR5IGZyb20gXCIuLi8uLi9Vc2VyQWN0aXZpdHlcIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vTW9kYWxcIjtcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi9pbmRleFwiO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSAnLi4vLi4vS2V5Ym9hcmQnO1xuaW1wb3J0IFRpbWVyIGZyb20gJy4uLy4uL3V0aWxzL1RpbWVyJztcbmltcG9ydCBzaG91bGRIaWRlRXZlbnQgZnJvbSAnLi4vLi4vc2hvdWxkSGlkZUV2ZW50JztcbmltcG9ydCBFZGl0b3JTdGF0ZVRyYW5zZmVyIGZyb20gJy4uLy4uL3V0aWxzL0VkaXRvclN0YXRlVHJhbnNmZXInO1xuaW1wb3J0IHtoYXZlVGlsZUZvckV2ZW50fSBmcm9tIFwiLi4vdmlld3Mvcm9vbXMvRXZlbnRUaWxlXCI7XG5cbmNvbnN0IFBBR0lOQVRFX1NJWkUgPSAyMDtcbmNvbnN0IElOSVRJQUxfU0laRSA9IDIwO1xuY29uc3QgUkVBRF9SRUNFSVBUX0lOVEVSVkFMX01TID0gNTAwO1xuXG5jb25zdCBERUJVRyA9IGZhbHNlO1xuXG5sZXQgZGVidWdsb2cgPSBmdW5jdGlvbigpIHt9O1xuaWYgKERFQlVHKSB7XG4gICAgLy8gdXNpbmcgYmluZCBtZWFucyB0aGF0IHdlIGdldCB0byBrZWVwIHVzZWZ1bCBsaW5lIG51bWJlcnMgaW4gdGhlIGNvbnNvbGVcbiAgICBkZWJ1Z2xvZyA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG59XG5cbi8qXG4gKiBDb21wb25lbnQgd2hpY2ggc2hvd3MgdGhlIGV2ZW50IHRpbWVsaW5lIGluIGEgcm9vbSB2aWV3LlxuICpcbiAqIEFsc28gcmVzcG9uc2libGUgZm9yIGhhbmRsaW5nIGFuZCBzZW5kaW5nIHJlYWQgcmVjZWlwdHMuXG4gKi9cbmNvbnN0IFRpbWVsaW5lUGFuZWwgPSBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1RpbWVsaW5lUGFuZWwnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIFRoZSBqcy1zZGsgRXZlbnRUaW1lbGluZVNldCBvYmplY3QgZm9yIHRoZSB0aW1lbGluZSBzZXF1ZW5jZSB3ZSBhcmVcbiAgICAgICAgLy8gcmVwcmVzZW50aW5nLiAgVGhpcyBtYXkgb3IgbWF5IG5vdCBoYXZlIGEgcm9vbSwgZGVwZW5kaW5nIG9uIHdoYXQgaXQnc1xuICAgICAgICAvLyBhIHRpbWVsaW5lIHJlcHJlc2VudGluZy4gIElmIGl0IGhhcyBhIHJvb20sIHdlIG1haW50YWluIFJScyBldGMgZm9yXG4gICAgICAgIC8vIHRoYXQgcm9vbS5cbiAgICAgICAgdGltZWxpbmVTZXQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgICAgICBzaG93UmVhZFJlY2VpcHRzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgLy8gRW5hYmxlIG1hbmFnaW5nIFJScyBhbmQgUk1zLiBUaGVzZSByZXF1aXJlIHRoZSB0aW1lbGluZVNldCB0byBoYXZlIGEgcm9vbS5cbiAgICAgICAgbWFuYWdlUmVhZFJlY2VpcHRzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgbWFuYWdlUmVhZE1hcmtlcnM6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8vIHRydWUgdG8gZ2l2ZSB0aGUgY29tcG9uZW50IGEgJ2Rpc3BsYXk6IG5vbmUnIHN0eWxlLlxuICAgICAgICBoaWRkZW46IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8vIElEIG9mIGFuIGV2ZW50IHRvIGhpZ2hsaWdodC4gSWYgdW5kZWZpbmVkLCBubyBldmVudCB3aWxsIGJlIGhpZ2hsaWdodGVkLlxuICAgICAgICAvLyB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlIGVpdGhlciAnZXZlbnRJZCcgb3IgdW5kZWZpbmVkLlxuICAgICAgICBoaWdobGlnaHRlZEV2ZW50SWQ6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gaWQgb2YgYW4gZXZlbnQgdG8ganVtcCB0by4gSWYgbm90IGdpdmVuLCB3aWxsIGdvIHRvIHRoZSBlbmQgb2YgdGhlXG4gICAgICAgIC8vIGxpdmUgdGltZWxpbmUuXG4gICAgICAgIGV2ZW50SWQ6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gd2hlcmUgdG8gcG9zaXRpb24gdGhlIGV2ZW50IGdpdmVuIGJ5IGV2ZW50SWQsIGluIHBpeGVscyBmcm9tIHRoZVxuICAgICAgICAvLyBib3R0b20gb2YgdGhlIHZpZXdwb3J0LiBJZiBub3QgZ2l2ZW4sIHdpbGwgdHJ5IHRvIHB1dCB0aGUgZXZlbnRcbiAgICAgICAgLy8gaGFsZiB3YXkgZG93biB0aGUgdmlld3BvcnQuXG4gICAgICAgIGV2ZW50UGl4ZWxPZmZzZXQ6IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgICAgICAgLy8gU2hvdWxkIHdlIHNob3cgVVJMIFByZXZpZXdzXG4gICAgICAgIHNob3dVcmxQcmV2aWV3OiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBjYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgcGFuZWwgaXMgc2Nyb2xsZWQuXG4gICAgICAgIG9uU2Nyb2xsOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvLyBjYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgcmVhZC11cC10byBtYXJrIGlzIHVwZGF0ZWQuXG4gICAgICAgIG9uUmVhZE1hcmtlclVwZGF0ZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIGNhbGxiYWNrIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHdlIHdpc2ggdG8gcGFnaW5hdGUgdGhlIHRpbWVsaW5lXG4gICAgICAgIC8vIHdpbmRvdy5cbiAgICAgICAgb25QYWdpbmF0aW9uUmVxdWVzdDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gbWF4aW11bSBudW1iZXIgb2YgZXZlbnRzIHRvIHNob3cgaW4gYSB0aW1lbGluZVxuICAgICAgICB0aW1lbGluZUNhcDogUHJvcFR5cGVzLm51bWJlcixcblxuICAgICAgICAvLyBjbGFzc25hbWUgdG8gdXNlIGZvciB0aGUgbWVzc2FnZXBhbmVsXG4gICAgICAgIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBzaGFwZSBwcm9wZXJ0eSB0byBiZSBwYXNzZWQgdG8gRXZlbnRUaWxlc1xuICAgICAgICB0aWxlU2hhcGU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gcGxhY2Vob2xkZXIgdGV4dCB0byB1c2UgaWYgdGhlIHRpbWVsaW5lIGlzIGVtcHR5XG4gICAgICAgIGVtcHR5OiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIHdoZXRoZXIgdG8gc2hvdyByZWFjdGlvbnMgZm9yIGFuIGV2ZW50XG4gICAgICAgIHNob3dSZWFjdGlvbnM6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBzdGF0aWNzOiB7XG4gICAgICAgIC8vIGEgbWFwIGZyb20gcm9vbSBpZCB0byByZWFkIG1hcmtlciBldmVudCB0aW1lc3RhbXBcbiAgICAgICAgcm9vbVJlYWRNYXJrZXJUc01hcDoge30sXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBCeSBkZWZhdWx0LCBkaXNhYmxlIHRoZSB0aW1lbGluZUNhcCBpbiBmYXZvdXIgb2YgdW5wYWdpbmF0aW5nIGJhc2VkIG9uXG4gICAgICAgICAgICAvLyBldmVudCB0aWxlIGhlaWdodHMuIChTZWUgX3VucGFnaW5hdGVFdmVudHMpXG4gICAgICAgICAgICB0aW1lbGluZUNhcDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ214X1Jvb21WaWV3X21lc3NhZ2VQYW5lbCcsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFhYWDogd2UgY291bGQgdHJhY2sgUk0gcGVyIFRpbWVsaW5lU2V0IHJhdGhlciB0aGFuIHBlciBSb29tLlxuICAgICAgICAvLyBidXQgZm9yIG5vdyB3ZSBqdXN0IGRvIGl0IHBlciByb29tIGZvciBzaW1wbGljaXR5LlxuICAgICAgICBsZXQgaW5pdGlhbFJlYWRNYXJrZXIgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5tYW5hZ2VSZWFkTWFya2Vycykge1xuICAgICAgICAgICAgY29uc3QgcmVhZG1hcmtlciA9IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbS5nZXRBY2NvdW50RGF0YSgnbS5mdWxseV9yZWFkJyk7XG4gICAgICAgICAgICBpZiAocmVhZG1hcmtlcikge1xuICAgICAgICAgICAgICAgIGluaXRpYWxSZWFkTWFya2VyID0gcmVhZG1hcmtlci5nZXRDb250ZW50KCkuZXZlbnRfaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluaXRpYWxSZWFkTWFya2VyID0gdGhpcy5fZ2V0Q3VycmVudFJlYWRSZWNlaXB0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXZlbnRzOiBbXSxcbiAgICAgICAgICAgIGxpdmVFdmVudHM6IFtdLFxuICAgICAgICAgICAgdGltZWxpbmVMb2FkaW5nOiB0cnVlLCAvLyB0cmFjayB3aGV0aGVyIG91ciByb29tIHRpbWVsaW5lIGlzIGxvYWRpbmdcblxuICAgICAgICAgICAgLy8gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBldmVudCB0aGF0IGlzIHRvIGJlIHNob3duXG4gICAgICAgICAgICBmaXJzdFZpc2libGVFdmVudEluZGV4OiAwLFxuXG4gICAgICAgICAgICAvLyBjYW5CYWNrUGFnaW5hdGUgPT0gZmFsc2UgbWF5IG1lYW46XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gKiB3ZSBoYXZlbid0IChzdWNjZXNzZnVsbHkpIGxvYWRlZCB0aGUgdGltZWxpbmUgeWV0LCBvcjpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAqIHdlIGhhdmUgZ290IHRvIHRoZSBwb2ludCB3aGVyZSB0aGUgcm9vbSB3YXMgY3JlYXRlZCwgb3I6XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gKiB0aGUgc2VydmVyIGluZGljYXRlZCB0aGF0IHRoZXJlIHdlcmUgbm8gbW9yZSB2aXNpYmxlIGV2ZW50c1xuICAgICAgICAgICAgLy8gIChub3JtYWxseSBpbXBseWluZyB3ZSBnb3QgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb29tKSwgb3I6XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gKiB3ZSBnYXZlIHVwIGFza2luZyB0aGUgc2VydmVyIGZvciBtb3JlIGV2ZW50c1xuICAgICAgICAgICAgY2FuQmFja1BhZ2luYXRlOiBmYWxzZSxcblxuICAgICAgICAgICAgLy8gY2FuRm9yd2FyZFBhZ2luYXRlID09IGZhbHNlIG1heSBtZWFuOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICogd2UgaGF2ZW4ndCAoc3VjY2Vzc2Z1bGx5KSBsb2FkZWQgdGhlIHRpbWVsaW5lIHlldFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICogd2UgaGF2ZSBnb3QgdG8gdGhlIGVuZCBvZiB0aW1lIGFuZCBhcmUgbm93IHRyYWNraW5nIHRoZSBsaXZlXG4gICAgICAgICAgICAvLyAgIHRpbWVsaW5lLCBvcjpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAqIHRoZSBzZXJ2ZXIgaW5kaWNhdGVkIHRoYXQgdGhlcmUgd2VyZSBubyBtb3JlIHZpc2libGUgZXZlbnRzXG4gICAgICAgICAgICAvLyAgIChub3Qgc3VyZSBpZiB0aGlzIGV2ZXIgaGFwcGVucyB3aGVuIHdlJ3JlIG5vdCBhdCB0aGUgbGl2ZVxuICAgICAgICAgICAgLy8gICB0aW1lbGluZSksIG9yOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICogd2UgYXJlIGxvb2tpbmcgYXQgc29tZSBoaXN0b3JpY2FsIHBvaW50LCBidXQgZ2F2ZSB1cCBhc2tpbmdcbiAgICAgICAgICAgIC8vICAgdGhlIHNlcnZlciBmb3IgbW9yZSBldmVudHNcbiAgICAgICAgICAgIGNhbkZvcndhcmRQYWdpbmF0ZTogZmFsc2UsXG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHdpdGggdGhlIHJlYWQtbWFya2VyIHZpc2libGUsIHNvIHRoYXQgd2Ugc2VlIGl0cyBhbmltYXRlZFxuICAgICAgICAgICAgLy8gZGlzYXBwZWFyYW5jZSB3aGVuIHN3aXRjaGluZyBpbnRvIHRoZSByb29tLlxuICAgICAgICAgICAgcmVhZE1hcmtlclZpc2libGU6IHRydWUsXG5cbiAgICAgICAgICAgIHJlYWRNYXJrZXJFdmVudElkOiBpbml0aWFsUmVhZE1hcmtlcixcblxuICAgICAgICAgICAgYmFja1BhZ2luYXRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgZm9yd2FyZFBhZ2luYXRpbmc6IGZhbHNlLFxuXG4gICAgICAgICAgICAvLyBjYWNoZSBvZiBtYXRyaXhDbGllbnQuZ2V0U3luY1N0YXRlKCkgKGJ1dCBmcm9tIHRoZSAnc3luYycgZXZlbnQpXG4gICAgICAgICAgICBjbGllbnRTeW5jU3RhdGU6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRTeW5jU3RhdGUoKSxcblxuICAgICAgICAgICAgLy8gc2hvdWxkIHRoZSBldmVudCB0aWxlcyBoYXZlIHR3ZWx2ZSBob3VyIHRpbWVzXG4gICAgICAgICAgICBpc1R3ZWx2ZUhvdXI6IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93VHdlbHZlSG91clRpbWVzdGFtcHNcIiksXG5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBzaG93IHRpbWVzdGFtcHMgb24gZXZlbnQgdGlsZXM/XG4gICAgICAgICAgICBhbHdheXNTaG93VGltZXN0YW1wczogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImFsd2F5c1Nob3dUaW1lc3RhbXBzXCIpLFxuXG4gICAgICAgICAgICAvLyBob3cgbG9uZyB0byBzaG93IHRoZSBSTSBmb3Igd2hlbiBpdCdzIHZpc2libGUgaW4gdGhlIHdpbmRvd1xuICAgICAgICAgICAgcmVhZE1hcmtlckluVmlld1RocmVzaG9sZE1zOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwicmVhZE1hcmtlckluVmlld1RocmVzaG9sZE1zXCIpLFxuXG4gICAgICAgICAgICAvLyBob3cgbG9uZyB0byBzaG93IHRoZSBSTSBmb3Igd2hlbiBpdCdzIHNjcm9sbGVkIG9mZi1zY3JlZW5cbiAgICAgICAgICAgIHJlYWRNYXJrZXJPdXRPZlZpZXdUaHJlc2hvbGRNczogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInJlYWRNYXJrZXJPdXRPZlZpZXdUaHJlc2hvbGRNc1wiKSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2UgY29tcG9uZW50IHdpdGggcmVhbCBjbGFzcywgdXNlIGNvbnN0cnVjdG9yIGZvciByZWZzXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlYnVnbG9nKFwiVGltZWxpbmVQYW5lbDogbW91bnRpbmdcIik7XG5cbiAgICAgICAgdGhpcy5sYXN0UlJTZW50RXZlbnRJZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sYXN0Uk1TZW50RXZlbnRJZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwgPSBjcmVhdGVSZWYoKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5tYW5hZ2VSZWFkUmVjZWlwdHMpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVhZFJlY2VpcHRPblVzZXJBY3Rpdml0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm1hbmFnZVJlYWRNYXJrZXJzKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlYWRNYXJrZXJPblVzZXJBY3Rpdml0eSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLmRpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20udGltZWxpbmVSZXNldFwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lUmVzZXQpO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oXCJSb29tLnJlZGFjdGlvblwiLCB0aGlzLm9uUm9vbVJlZGFjdGlvbik7XG4gICAgICAgIC8vIHNhbWUgZXZlbnQgaGFuZGxlciBhcyBSb29tLnJlZGFjdGlvbiBhcyBmb3IgYm90aCB3ZSBqdXN0IGRvIGZvcmNlVXBkYXRlXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20ucmVkYWN0aW9uQ2FuY2VsbGVkXCIsIHRoaXMub25Sb29tUmVkYWN0aW9uKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbS5yZWNlaXB0XCIsIHRoaXMub25Sb29tUmVjZWlwdCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20ubG9jYWxFY2hvVXBkYXRlZFwiLCB0aGlzLm9uTG9jYWxFY2hvVXBkYXRlZCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20uYWNjb3VudERhdGFcIiwgdGhpcy5vbkFjY291bnREYXRhKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiRXZlbnQuZGVjcnlwdGVkXCIsIHRoaXMub25FdmVudERlY3J5cHRlZCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIkV2ZW50LnJlcGxhY2VkXCIsIHRoaXMub25FdmVudFJlcGxhY2VkKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwic3luY1wiLCB0aGlzLm9uU3luYyk7XG5cbiAgICAgICAgdGhpcy5faW5pdFRpbWVsaW5lKHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xuICAgICAgICBpZiAobmV3UHJvcHMudGltZWxpbmVTZXQgIT09IHRoaXMucHJvcHMudGltZWxpbmVTZXQpIHtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihcImNoYW5naW5nIHRpbWVsaW5lU2V0IG9uIGEgVGltZWxpbmVQYW5lbCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuXG4gICAgICAgICAgICAvLyByZWdyZXR0YWJseSwgdGhpcyBkb2VzIGhhcHBlbjsgaW4gcGFydGljdWxhciwgd2hlbiBqb2luaW5nIGFcbiAgICAgICAgICAgIC8vIHJvb20gd2l0aCAvam9pbi4gSW4gdGhhdCBjYXNlLCB0aGVyZSBhcmUgdHdvIFJvb21zIGluXG4gICAgICAgICAgICAvLyBjaXJjdWxhdGlvbiAtIG9uZSB3aGljaCBpcyBjcmVhdGVkIGJ5IHRoZSBNYXRyaXhDbGllbnQuam9pblJvb21cbiAgICAgICAgICAgIC8vIGNhbGwgYW5kIHVzZWQgdG8gY3JlYXRlIHRoZSBSb29tVmlldywgYW5kIGEgc2Vjb25kIHdoaWNoIGlzXG4gICAgICAgICAgICAvLyBjcmVhdGVkIGJ5IHRoZSBzeW5jIGxvb3Agb25jZSB0aGUgcm9vbSBjb21lcyBiYWNrIGRvd24gdGhlIC9zeW5jXG4gICAgICAgICAgICAvLyBwaXBlLiBPbmNlIHRoZSBsYXR0ZXIgaGFwcGVucywgb3VyIHJvb20gaXMgcmVwbGFjZWQgd2l0aCB0aGUgbmV3IG9uZS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBmb3Igbm93LCBqdXN0IHdhcm4gYWJvdXQgdGhpcy4gQnV0IHdlJ3JlIGdvaW5nIHRvIGVuZCB1cCBwYWdpbmF0aW5nXG4gICAgICAgICAgICAvLyBib3RoIHJvb21zIHNlcGFyYXRlbHksIGFuZCBpdCdzIGFsbCBiYWQuXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJSZXBsYWNpbmcgdGltZWxpbmVTZXQgb24gYSBUaW1lbGluZVBhbmVsIC0gY29uZnVzaW9uIG1heSBlbnN1ZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdQcm9wcy5ldmVudElkICE9IHRoaXMucHJvcHMuZXZlbnRJZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lbGluZVBhbmVsIHN3aXRjaGluZyB0byBldmVudElkIFwiICsgbmV3UHJvcHMuZXZlbnRJZCArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiAod2FzIFwiICsgdGhpcy5wcm9wcy5ldmVudElkICsgXCIpXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luaXRUaW1lbGluZShuZXdQcm9wcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICBpZiAoIU9iamVjdFV0aWxzLnNoYWxsb3dFcXVhbCh0aGlzLnByb3BzLCBuZXh0UHJvcHMpKSB7XG4gICAgICAgICAgICBpZiAoREVCVUcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKFwiVGltZWxpbmUuc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBwcm9wcyBjaGFuZ2VcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwcm9wcyBiZWZvcmU6XCIsIHRoaXMucHJvcHMpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicHJvcHMgYWZ0ZXI6XCIsIG5leHRQcm9wcyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIU9iamVjdFV0aWxzLnNoYWxsb3dFcXVhbCh0aGlzLnN0YXRlLCBuZXh0U3RhdGUpKSB7XG4gICAgICAgICAgICBpZiAoREVCVUcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKFwiVGltZWxpbmUuc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBzdGF0ZSBjaGFuZ2VcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdGF0ZSBiZWZvcmU6XCIsIHRoaXMuc3RhdGUpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3RhdGUgYWZ0ZXI6XCIsIG5leHRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gc2V0IGEgYm9vbGVhbiB0byBzYXkgd2UndmUgYmVlbiB1bm1vdW50ZWQsIHdoaWNoIGFueSBwZW5kaW5nXG4gICAgICAgIC8vIHByb21pc2VzIGNhbiB1c2UgdG8gdGhyb3cgYXdheSB0aGVpciByZXN1bHRzLlxuICAgICAgICAvL1xuICAgICAgICAvLyAoV2UgY291bGQgdXNlIGlzTW91bnRlZCwgYnV0IGZhY2Vib29rIGhhdmUgZGVwcmVjYXRlZCB0aGF0LilcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5fcmVhZFJlY2VpcHRBY3Rpdml0eVRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkUmVjZWlwdEFjdGl2aXR5VGltZXIuYWJvcnQoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlYWRSZWNlaXB0QWN0aXZpdHlUaW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3JlYWRNYXJrZXJBY3Rpdml0eVRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkTWFya2VyQWN0aXZpdHlUaW1lci5hYm9ydCgpO1xuICAgICAgICAgICAgdGhpcy5fcmVhZE1hcmtlckFjdGl2aXR5VGltZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGllbnQpIHtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tLnRpbWVsaW5lUmVzZXRcIiwgdGhpcy5vblJvb21UaW1lbGluZVJlc2V0KTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ucmVkYWN0aW9uXCIsIHRoaXMub25Sb29tUmVkYWN0aW9uKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ucmVkYWN0aW9uQ2FuY2VsbGVkXCIsIHRoaXMub25Sb29tUmVkYWN0aW9uKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ucmVjZWlwdFwiLCB0aGlzLm9uUm9vbVJlY2VpcHQpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5sb2NhbEVjaG9VcGRhdGVkXCIsIHRoaXMub25Mb2NhbEVjaG9VcGRhdGVkKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20uYWNjb3VudERhdGFcIiwgdGhpcy5vbkFjY291bnREYXRhKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIkV2ZW50LmRlY3J5cHRlZFwiLCB0aGlzLm9uRXZlbnREZWNyeXB0ZWQpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiRXZlbnQucmVwbGFjZWRcIiwgdGhpcy5vbkV2ZW50UmVwbGFjZWQpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwic3luY1wiLCB0aGlzLm9uU3luYyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25NZXNzYWdlTGlzdFVuZmlsbFJlcXVlc3Q6IGZ1bmN0aW9uKGJhY2t3YXJkcywgc2Nyb2xsVG9rZW4pIHtcbiAgICAgICAgLy8gSWYgYmFja3dhcmRzLCB1bnBhZ2luYXRlIGZyb20gdGhlIGJhY2sgKGkuZS4gdGhlIHN0YXJ0IG9mIHRoZSB0aW1lbGluZSlcbiAgICAgICAgY29uc3QgZGlyID0gYmFja3dhcmRzID8gRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMgOiBFdmVudFRpbWVsaW5lLkZPUldBUkRTO1xuICAgICAgICBkZWJ1Z2xvZyhcIlRpbWVsaW5lUGFuZWw6IHVucGFnaW5hdGluZyBldmVudHMgaW4gZGlyZWN0aW9uXCIsIGRpcik7XG5cbiAgICAgICAgLy8gQWxsIHRpbGVzIGFyZSBpbnNlcnRlZCBieSBNZXNzYWdlUGFuZWwgdG8gaGF2ZSBhIHNjcm9sbFRva2VuID09PSBldmVudElkLCBhbmRcbiAgICAgICAgLy8gdGhpcyBwYXJ0aWN1bGFyIGV2ZW50IHNob3VsZCBiZSB0aGUgZmlyc3Qgb3IgbGFzdCB0byBiZSB1bnBhZ2luYXRlZC5cbiAgICAgICAgY29uc3QgZXZlbnRJZCA9IHNjcm9sbFRva2VuO1xuXG4gICAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuc3RhdGUuZXZlbnRzLmZpbmRJbmRleChcbiAgICAgICAgICAgIChldikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBldi5nZXRJZCgpID09PSBldmVudElkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBjb3VudCA9IGJhY2t3YXJkcyA/IG1hcmtlciArIDEgOiB0aGlzLnN0YXRlLmV2ZW50cy5sZW5ndGggLSBtYXJrZXI7XG5cbiAgICAgICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICAgICAgZGVidWdsb2coXCJUaW1lbGluZVBhbmVsOiBVbnBhZ2luYXRpbmdcIiwgY291bnQsIFwiaW4gZGlyZWN0aW9uXCIsIGRpcik7XG4gICAgICAgICAgICB0aGlzLl90aW1lbGluZVdpbmRvdy51bnBhZ2luYXRlKGNvdW50LCBiYWNrd2FyZHMpO1xuXG4gICAgICAgICAgICAvLyBXZSBjYW4gbm93IHBhZ2luYXRlIGluIHRoZSB1bnBhZ2luYXRlZCBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IGNhblBhZ2luYXRlS2V5ID0gKGJhY2t3YXJkcykgPyAnY2FuQmFja1BhZ2luYXRlJyA6ICdjYW5Gb3J3YXJkUGFnaW5hdGUnO1xuICAgICAgICAgICAgY29uc3QgeyBldmVudHMsIGxpdmVFdmVudHMsIGZpcnN0VmlzaWJsZUV2ZW50SW5kZXggfSA9IHRoaXMuX2dldEV2ZW50cygpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgW2NhblBhZ2luYXRlS2V5XTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBldmVudHMsXG4gICAgICAgICAgICAgICAgbGl2ZUV2ZW50cyxcbiAgICAgICAgICAgICAgICBmaXJzdFZpc2libGVFdmVudEluZGV4LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25QYWdpbmF0aW9uUmVxdWVzdCh0aW1lbGluZVdpbmRvdywgZGlyZWN0aW9uLCBzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uUGFnaW5hdGlvblJlcXVlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLm9uUGFnaW5hdGlvblJlcXVlc3QodGltZWxpbmVXaW5kb3csIGRpcmVjdGlvbiwgc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGltZWxpbmVXaW5kb3cucGFnaW5hdGUoZGlyZWN0aW9uLCBzaXplKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBzZXQgb2ZmIGEgcGFnaW5hdGlvbiByZXF1ZXN0LlxuICAgIG9uTWVzc2FnZUxpc3RGaWxsUmVxdWVzdDogZnVuY3Rpb24oYmFja3dhcmRzKSB7XG4gICAgICAgIGlmICghdGhpcy5fc2hvdWxkUGFnaW5hdGUoKSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG5cbiAgICAgICAgY29uc3QgZGlyID0gYmFja3dhcmRzID8gRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMgOiBFdmVudFRpbWVsaW5lLkZPUldBUkRTO1xuICAgICAgICBjb25zdCBjYW5QYWdpbmF0ZUtleSA9IGJhY2t3YXJkcyA/ICdjYW5CYWNrUGFnaW5hdGUnIDogJ2NhbkZvcndhcmRQYWdpbmF0ZSc7XG4gICAgICAgIGNvbnN0IHBhZ2luYXRpbmdLZXkgPSBiYWNrd2FyZHMgPyAnYmFja1BhZ2luYXRpbmcnIDogJ2ZvcndhcmRQYWdpbmF0aW5nJztcblxuICAgICAgICBpZiAoIXRoaXMuc3RhdGVbY2FuUGFnaW5hdGVLZXldKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIlRpbWVsaW5lUGFuZWw6IGhhdmUgZ2l2ZW4gdXBcIiwgZGlyLCBcInBhZ2luYXRpbmcgdGhpcyB0aW1lbGluZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl90aW1lbGluZVdpbmRvdy5jYW5QYWdpbmF0ZShkaXIpKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIlRpbWVsaW5lUGFuZWw6IGNhbid0XCIsIGRpciwgXCJwYWdpbmF0ZSBhbnkgZnVydGhlclwiKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1tjYW5QYWdpbmF0ZUtleV06IGZhbHNlfSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiYWNrd2FyZHMgJiYgdGhpcy5zdGF0ZS5maXJzdFZpc2libGVFdmVudEluZGV4ICE9PSAwKSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIlRpbWVsaW5lUGFuZWw6IHdvbid0XCIsIGRpciwgXCJwYWdpbmF0ZSBwYXN0IGZpcnN0IHZpc2libGUgZXZlbnRcIik7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnbG9nKFwiVGltZWxpbmVQYW5lbDogSW5pdGlhdGluZyBwYWdpbmF0ZTsgYmFja3dhcmRzOlwiK2JhY2t3YXJkcyk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1twYWdpbmF0aW5nS2V5XTogdHJ1ZX0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm9uUGFnaW5hdGlvblJlcXVlc3QodGhpcy5fdGltZWxpbmVXaW5kb3csIGRpciwgUEFHSU5BVEVfU0laRSkudGhlbigocikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIlRpbWVsaW5lUGFuZWw6IHBhZ2luYXRlIGNvbXBsZXRlIGJhY2t3YXJkczpcIitiYWNrd2FyZHMrXCI7IHN1Y2Nlc3M6XCIrcik7XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZXZlbnRzLCBsaXZlRXZlbnRzLCBmaXJzdFZpc2libGVFdmVudEluZGV4IH0gPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xuICAgICAgICAgICAgICAgIFtwYWdpbmF0aW5nS2V5XTogZmFsc2UsXG4gICAgICAgICAgICAgICAgW2NhblBhZ2luYXRlS2V5XTogcixcbiAgICAgICAgICAgICAgICBldmVudHMsXG4gICAgICAgICAgICAgICAgbGl2ZUV2ZW50cyxcbiAgICAgICAgICAgICAgICBmaXJzdFZpc2libGVFdmVudEluZGV4LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gbW92aW5nIHRoZSB3aW5kb3cgaW4gdGhpcyBkaXJlY3Rpb24gbWF5IG1lYW4gdGhhdCB3ZSBjYW4gbm93XG4gICAgICAgICAgICAvLyBwYWdpbmF0ZSBpbiB0aGUgb3RoZXIgd2hlcmUgd2UgcHJldmlvdXNseSBjb3VsZCBub3QuXG4gICAgICAgICAgICBjb25zdCBvdGhlckRpcmVjdGlvbiA9IGJhY2t3YXJkcyA/IEV2ZW50VGltZWxpbmUuRk9SV0FSRFMgOiBFdmVudFRpbWVsaW5lLkJBQ0tXQVJEUztcbiAgICAgICAgICAgIGNvbnN0IGNhblBhZ2luYXRlT3RoZXJXYXlLZXkgPSBiYWNrd2FyZHMgPyAnY2FuRm9yd2FyZFBhZ2luYXRlJyA6ICdjYW5CYWNrUGFnaW5hdGUnO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlW2NhblBhZ2luYXRlT3RoZXJXYXlLZXldICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVsaW5lV2luZG93LmNhblBhZ2luYXRlKG90aGVyRGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdUaW1lbGluZVBhbmVsOiBjYW4gbm93Jywgb3RoZXJEaXJlY3Rpb24sICdwYWdpbmF0ZSBhZ2FpbicpO1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlW2NhblBhZ2luYXRlT3RoZXJXYXlLZXldID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVzb2x2ZSB1bnRpbCB0aGUgc2V0U3RhdGUgaGFzIGNvbXBsZXRlZDogd2UgbmVlZCB0byBsZXRcbiAgICAgICAgICAgIC8vIHRoZSBjb21wb25lbnQgdXBkYXRlIGJlZm9yZSB3ZSBjb25zaWRlciB0aGUgcGFnaW5hdGlvbiBjb21wbGV0ZWQsXG4gICAgICAgICAgICAvLyBvdGhlcndpc2Ugd2UnbGwgZW5kIHVwIHBhZ2luYXRpbmcgaW4gYWxsIHRoZSBoaXN0b3J5IHRoZSBqcy1zZGtcbiAgICAgICAgICAgIC8vIGhhcyBpbiBtZW1vcnkgYmVjYXVzZSB3ZSBuZXZlciBnYXZlIHRoZSBjb21wb25lbnQgYSBjaGFuY2UgdG8gc2Nyb2xsXG4gICAgICAgICAgICAvLyBpdHNlbGYgaW50byB0aGUgcmlnaHQgcGxhY2VcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgY2FuIGNvbnRpbnVlIHBhZ2luYXRpbmcgaW4gdGhlIGdpdmVuIGRpcmVjdGlvbiBpZjpcbiAgICAgICAgICAgICAgICAgICAgLy8gLSBfdGltZWxpbmVXaW5kb3cucGFnaW5hdGUgc2F5cyB3ZSBjYW5cbiAgICAgICAgICAgICAgICAgICAgLy8gLSB3ZSdyZSBwYWdpbmF0aW5nIGZvcndhcmRzLCBvciB3ZSB3b24ndCBiZSB0cnlpbmcgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gICBwYWdpbmF0ZSBiYWNrd2FyZHMgcGFzdCB0aGUgZmlyc3QgdmlzaWJsZSBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHIgJiYgKCFiYWNrd2FyZHMgfHwgZmlyc3RWaXNpYmxlRXZlbnRJbmRleCA9PT0gMCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbk1lc3NhZ2VMaXN0U2Nyb2xsOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU2Nyb2xsKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2Nyb2xsKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubWFuYWdlUmVhZE1hcmtlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJtUG9zaXRpb24gPSB0aGlzLmdldFJlYWRNYXJrZXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgLy8gd2UgaGlkZSB0aGUgcmVhZCBtYXJrZXIgd2hlbiBpdCBmaXJzdCBjb21lcyBvbnRvIHRoZSBzY3JlZW4sIGJ1dCBpZlxuICAgICAgICAgICAgLy8gaXQgZ29lcyBiYWNrIG9mZiB0aGUgdG9wIG9mIHRoZSBzY3JlZW4gKHByZXN1bWFibHkgYmVjYXVzZSB0aGUgdXNlclxuICAgICAgICAgICAgLy8gY2xpY2tzIG9uIHRoZSAnanVtcCB0byBib3R0b20nIGJ1dHRvbiksIHdlIG5lZWQgdG8gcmUtZW5hYmxlIGl0LlxuICAgICAgICAgICAgaWYgKHJtUG9zaXRpb24gPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cmVhZE1hcmtlclZpc2libGU6IHRydWV9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgcmVhZCBtYXJrZXIgcG9zaXRpb24gZ29lcyBiZXR3ZWVuIDAgYW5kIC0xLzEsXG4gICAgICAgICAgICAvLyAoYW5kIHVzZXIgaXMgYWN0aXZlKSwgc3dpdGNoIHRpbWVvdXRcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLl9yZWFkTWFya2VyVGltZW91dChybVBvc2l0aW9uKTtcbiAgICAgICAgICAgIC8vIE5PLU9QIHdoZW4gdGltZW91dCBhbHJlYWR5IGhhcyBzZXQgdG8gdGhlIGdpdmVuIHZhbHVlXG4gICAgICAgICAgICB0aGlzLl9yZWFkTWFya2VyQWN0aXZpdHlUaW1lci5jaGFuZ2VUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uQWN0aW9uOiBmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gJ2lnbm9yZV9zdGF0ZV9jaGFuZ2VkJykge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gXCJlZGl0X2V2ZW50XCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRTdGF0ZSA9IHBheWxvYWQuZXZlbnQgPyBuZXcgRWRpdG9yU3RhdGVUcmFuc2ZlcihwYXlsb2FkLmV2ZW50KSA6IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtlZGl0U3RhdGV9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuZXZlbnQgJiYgdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQuc2Nyb2xsVG9FdmVudElmTmVlZGVkKFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZC5ldmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUm9vbVRpbWVsaW5lOiBmdW5jdGlvbihldiwgcm9vbSwgdG9TdGFydE9mVGltZWxpbmUsIHJlbW92ZWQsIGRhdGEpIHtcbiAgICAgICAgLy8gaWdub3JlIGV2ZW50cyBmb3Igb3RoZXIgdGltZWxpbmUgc2V0c1xuICAgICAgICBpZiAoZGF0YS50aW1lbGluZS5nZXRUaW1lbGluZVNldCgpICE9PSB0aGlzLnByb3BzLnRpbWVsaW5lU2V0KSByZXR1cm47XG5cbiAgICAgICAgLy8gaWdub3JlIGFueXRoaW5nIGJ1dCByZWFsLXRpbWUgdXBkYXRlcyBhdCB0aGUgZW5kIG9mIHRoZSByb29tOlxuICAgICAgICAvLyB1cGRhdGVzIGZyb20gcGFnaW5hdGlvbiB3aWxsIGhhcHBlbiB3aGVuIHRoZSBwYWdpbmF0ZSBjb21wbGV0ZXMuXG4gICAgICAgIGlmICh0b1N0YXJ0T2ZUaW1lbGluZSB8fCAhZGF0YSB8fCAhZGF0YS5saXZlRXZlbnQpIHJldHVybjtcblxuICAgICAgICBpZiAoIXRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50KSByZXR1cm47XG5cbiAgICAgICAgaWYgKCF0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5nZXRTY3JvbGxTdGF0ZSgpLnN0dWNrQXRCb3R0b20pIHtcbiAgICAgICAgICAgIC8vIHdlIHdvbid0IGxvYWQgdGhpcyBldmVudCBub3csIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCB0byBwdXNoIGFueVxuICAgICAgICAgICAgLy8gZXZlbnRzIG9mZiB0aGUgb3RoZXIgZW5kIG9mIHRoZSB0aW1lbGluZS4gQnV0IHdlIG5lZWQgdG8gbm90ZVxuICAgICAgICAgICAgLy8gdGhhdCB3ZSBjYW4gbm93IHBhZ2luYXRlLlxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y2FuRm9yd2FyZFBhZ2luYXRlOiB0cnVlfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0ZWxsIHRoZSB0aW1lbGluZSB3aW5kb3cgdG8gdHJ5IHRvIGFkdmFuY2UgaXRzZWxmLCBidXQgbm90IHRvIG1ha2VcbiAgICAgICAgLy8gYW4gaHR0cCByZXF1ZXN0IHRvIGRvIHNvLlxuICAgICAgICAvL1xuICAgICAgICAvLyB3ZSBkZWxpYmVyYXRlbHkgYXZvaWQgZ29pbmcgdmlhIHRoZSBTY3JvbGxQYW5lbCBmb3IgdGhpcyBjYWxsIC0gdGhlXG4gICAgICAgIC8vIFNjcm9sbFBhbmVsIG1pZ2h0IGFscmVhZHkgaGF2ZSBhbiBhY3RpdmUgcGFnaW5hdGlvbiBwcm9taXNlLCB3aGljaFxuICAgICAgICAvLyB3aWxsIGZhaWwsIGJ1dCB3b3VsZCBzdG9wIHVzIHBhc3NpbmcgdGhlIHBhZ2luYXRpb24gcmVxdWVzdCB0byB0aGVcbiAgICAgICAgLy8gdGltZWxpbmUgd2luZG93LlxuICAgICAgICAvL1xuICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS92ZWN0b3Itd2ViL2lzc3Vlcy8xMDM1XG4gICAgICAgIHRoaXMuX3RpbWVsaW5lV2luZG93LnBhZ2luYXRlKEV2ZW50VGltZWxpbmUuRk9SV0FSRFMsIDEsIGZhbHNlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgY29uc3QgeyBldmVudHMsIGxpdmVFdmVudHMsIGZpcnN0VmlzaWJsZUV2ZW50SW5kZXggfSA9IHRoaXMuX2dldEV2ZW50cygpO1xuICAgICAgICAgICAgY29uc3QgbGFzdExpdmVFdmVudCA9IGxpdmVFdmVudHNbbGl2ZUV2ZW50cy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgICAgY29uc3QgdXBkYXRlZFN0YXRlID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50cyxcbiAgICAgICAgICAgICAgICBsaXZlRXZlbnRzLFxuICAgICAgICAgICAgICAgIGZpcnN0VmlzaWJsZUV2ZW50SW5kZXgsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsZXQgY2FsbFJNVXBkYXRlZDtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm1hbmFnZVJlYWRNYXJrZXJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2hlbiBhIG5ldyBldmVudCBhcnJpdmVzIHdoZW4gdGhlIHVzZXIgaXMgbm90IHdhdGNoaW5nIHRoZVxuICAgICAgICAgICAgICAgIC8vIHdpbmRvdywgYnV0IHRoZSB3aW5kb3cgaXMgaW4gaXRzIGF1dG8tc2Nyb2xsIG1vZGUsIG1ha2Ugc3VyZSB0aGVcbiAgICAgICAgICAgICAgICAvLyByZWFkIG1hcmtlciBpcyB2aXNpYmxlLlxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gV2UgaWdub3JlIGV2ZW50cyB3ZSBoYXZlIHNlbnQgb3Vyc2VsdmVzOyB3ZSBkb24ndCB3YW50IHRvIHNlZSB0aGVcbiAgICAgICAgICAgICAgICAvLyByZWFkLW1hcmtlciB3aGVuIGEgcmVtb3RlIGVjaG8gb2YgYW4gZXZlbnQgd2UgaGF2ZSBqdXN0IHNlbnQgdGFrZXNcbiAgICAgICAgICAgICAgICAvLyBtb3JlIHRoYW4gdGhlIHRpbWVvdXQgb24gdXNlckFjdGl2ZVJlY2VudGx5LlxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IGV2LnNlbmRlciA/IGV2LnNlbmRlci51c2VySWQgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNhbGxSTVVwZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoc2VuZGVyICE9IG15VXNlcklkICYmICFVc2VyQWN0aXZpdHkuc2hhcmVkSW5zdGFuY2UoKS51c2VyQWN0aXZlUmVjZW50bHkoKSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkU3RhdGUucmVhZE1hcmtlclZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdExpdmVFdmVudCAmJiB0aGlzLmdldFJlYWRNYXJrZXJQb3NpdGlvbigpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGtub3cgd2UncmUgc3R1Y2tBdEJvdHRvbSwgc28gd2UgY2FuIGFkdmFuY2UgdGhlIFJNXG4gICAgICAgICAgICAgICAgICAgIC8vIGltbWVkaWF0ZWx5LCB0byBzYXZlIGEgbGF0ZXIgcmVuZGVyIGN5Y2xlXG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0UmVhZE1hcmtlcihsYXN0TGl2ZUV2ZW50LmdldElkKCksIGxhc3RMaXZlRXZlbnQuZ2V0VHMoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRTdGF0ZS5yZWFkTWFya2VyVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkU3RhdGUucmVhZE1hcmtlckV2ZW50SWQgPSBsYXN0TGl2ZUV2ZW50LmdldElkKCk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxSTVVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh1cGRhdGVkU3RhdGUsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC51cGRhdGVUaW1lbGluZU1pbkhlaWdodCgpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsUk1VcGRhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25SZWFkTWFya2VyVXBkYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25Sb29tVGltZWxpbmVSZXNldDogZnVuY3Rpb24ocm9vbSwgdGltZWxpbmVTZXQpIHtcbiAgICAgICAgaWYgKHRpbWVsaW5lU2V0ICE9PSB0aGlzLnByb3BzLnRpbWVsaW5lU2V0KSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50ICYmIHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LmlzQXRCb3R0b20oKSkge1xuICAgICAgICAgICAgdGhpcy5fbG9hZFRpbWVsaW5lKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2FuUmVzZXRUaW1lbGluZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudCAmJiB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5pc0F0Qm90dG9tKCk7XG4gICAgfSxcblxuICAgIG9uUm9vbVJlZGFjdGlvbjogZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gaWdub3JlIGV2ZW50cyBmb3Igb3RoZXIgcm9vbXNcbiAgICAgICAgaWYgKHJvb20gIT09IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHdlIGNvdWxkIHNraXAgYW4gdXBkYXRlIGlmIHRoZSBldmVudCBpc24ndCBpbiBvdXIgdGltZWxpbmUsXG4gICAgICAgIC8vIGJ1dCB0aGF0J3MgcHJvYmFibHkgYW4gZWFybHkgb3B0aW1pc2F0aW9uLlxuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIG9uRXZlbnRSZXBsYWNlZDogZnVuY3Rpb24ocmVwbGFjZWRFdmVudCwgcm9vbSkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBpZ25vcmUgZXZlbnRzIGZvciBvdGhlciByb29tc1xuICAgICAgICBpZiAocm9vbSAhPT0gdGhpcy5wcm9wcy50aW1lbGluZVNldC5yb29tKSByZXR1cm47XG5cbiAgICAgICAgLy8gd2UgY291bGQgc2tpcCBhbiB1cGRhdGUgaWYgdGhlIGV2ZW50IGlzbid0IGluIG91ciB0aW1lbGluZSxcbiAgICAgICAgLy8gYnV0IHRoYXQncyBwcm9iYWJseSBhbiBlYXJseSBvcHRpbWlzYXRpb24uXG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25Sb29tUmVjZWlwdDogZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gaWdub3JlIGV2ZW50cyBmb3Igb3RoZXIgcm9vbXNcbiAgICAgICAgaWYgKHJvb20gIT09IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25Mb2NhbEVjaG9VcGRhdGVkOiBmdW5jdGlvbihldiwgcm9vbSwgb2xkRXZlbnRJZCkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBpZ25vcmUgZXZlbnRzIGZvciBvdGhlciByb29tc1xuICAgICAgICBpZiAocm9vbSAhPT0gdGhpcy5wcm9wcy50aW1lbGluZVNldC5yb29tKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fcmVsb2FkRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIG9uQWNjb3VudERhdGE6IGZ1bmN0aW9uKGV2LCByb29tKSB7XG4gICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGlnbm9yZSBldmVudHMgZm9yIG90aGVyIHJvb21zXG4gICAgICAgIGlmIChyb29tICE9PSB0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20pIHJldHVybjtcblxuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpICE9PSBcIm0uZnVsbHlfcmVhZFwiKSByZXR1cm47XG5cbiAgICAgICAgLy8gWFhYOiByb29tUmVhZE1hcmtlclRzTWFwIG5vdCB1cGRhdGVkIGhlcmUgc28gaXQgaXMgbm93IGluY29uc2lzdGVudC4gUmVwbGFjZVxuICAgICAgICAvLyB0aGlzIG1lY2hhbmlzbSBvZiBkZXRlcm1pbmluZyB3aGVyZSB0aGUgUk0gaXMgcmVsYXRpdmUgdG8gdGhlIHZpZXctcG9ydCB3aXRoXG4gICAgICAgIC8vIG9uZSBzdXBwb3J0ZWQgYnkgdGhlIHNlcnZlciAodGhlIGNsaWVudCBuZWVkcyBtb3JlIHRoYW4gYW4gZXZlbnQgSUQpLlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHJlYWRNYXJrZXJFdmVudElkOiBldi5nZXRDb250ZW50KCkuZXZlbnRfaWQsXG4gICAgICAgIH0sIHRoaXMucHJvcHMub25SZWFkTWFya2VyVXBkYXRlZCk7XG4gICAgfSxcblxuICAgIG9uRXZlbnREZWNyeXB0ZWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIC8vIENhbiBiZSBudWxsIGZvciB0aGUgbm90aWZpY2F0aW9uIHRpbWVsaW5lLCBldGMuXG4gICAgICAgIGlmICghdGhpcy5wcm9wcy50aW1lbGluZVNldC5yb29tKSByZXR1cm47XG5cbiAgICAgICAgLy8gTmVlZCB0byB1cGRhdGUgYXMgd2UgZG9uJ3QgZGlzcGxheSBldmVudCB0aWxlcyBmb3IgZXZlbnRzIHRoYXRcbiAgICAgICAgLy8gaGF2ZW4ndCB5ZXQgYmVlbiBkZWNyeXB0ZWQuIFRoZSBldmVudCB3aWxsIGhhdmUganVzdCBiZWVuIHVwZGF0ZWRcbiAgICAgICAgLy8gaW4gcGxhY2Ugc28gd2UganVzdCBuZWVkIHRvIHJlLXJlbmRlci5cbiAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHJlc3RyaWN0IHRoaXMgdG8gb25seSBldmVudHMgaW4gb3VyIHRpbWVsaW5lLFxuICAgICAgICAvLyBidXQgcG9zc2libHkgdGhlIGV2ZW50IHRpbGUgaXRzZWxmIHNob3VsZCBqdXN0IHVwZGF0ZSB3aGVuIHRoaXNcbiAgICAgICAgLy8gaGFwcGVucyB0byBzYXZlIHVzIHJlLXJlbmRlcmluZyB0aGUgd2hvbGUgdGltZWxpbmUuXG4gICAgICAgIGlmIChldi5nZXRSb29tSWQoKSA9PT0gdGhpcy5wcm9wcy50aW1lbGluZVNldC5yb29tLnJvb21JZCkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uU3luYzogZnVuY3Rpb24oc3RhdGUsIHByZXZTdGF0ZSwgZGF0YSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtjbGllbnRTeW5jU3RhdGU6IHN0YXRlfSk7XG4gICAgfSxcblxuICAgIF9yZWFkTWFya2VyVGltZW91dChyZWFkTWFya2VyUG9zaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHJlYWRNYXJrZXJQb3NpdGlvbiA9PT0gMCA/XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnJlYWRNYXJrZXJJblZpZXdUaHJlc2hvbGRNcyA6XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnJlYWRNYXJrZXJPdXRPZlZpZXdUaHJlc2hvbGRNcztcbiAgICB9LFxuXG4gICAgdXBkYXRlUmVhZE1hcmtlck9uVXNlckFjdGl2aXR5OiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgaW5pdGlhbFRpbWVvdXQgPSB0aGlzLl9yZWFkTWFya2VyVGltZW91dCh0aGlzLmdldFJlYWRNYXJrZXJQb3NpdGlvbigpKTtcbiAgICAgICAgdGhpcy5fcmVhZE1hcmtlckFjdGl2aXR5VGltZXIgPSBuZXcgVGltZXIoaW5pdGlhbFRpbWVvdXQpO1xuXG4gICAgICAgIHdoaWxlICh0aGlzLl9yZWFkTWFya2VyQWN0aXZpdHlUaW1lcikgeyAvL3Vuc2V0IG9uIHVubW91bnRcbiAgICAgICAgICAgIFVzZXJBY3Rpdml0eS5zaGFyZWRJbnN0YW5jZSgpLnRpbWVXaGlsZUFjdGl2ZVJlY2VudGx5KHRoaXMuX3JlYWRNYXJrZXJBY3Rpdml0eVRpbWVyKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVhZE1hcmtlckFjdGl2aXR5VGltZXIuZmluaXNoZWQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgY29udGludWU7IC8qIGFib3J0ZWQgKi8gfVxuICAgICAgICAgICAgLy8gb3V0c2lkZSBvZiB0cnkvY2F0Y2ggdG8gbm90IHN3YWxsb3cgZXJyb3JzXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVJlYWRNYXJrZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGVSZWFkUmVjZWlwdE9uVXNlckFjdGl2aXR5OiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVhZFJlY2VpcHRBY3Rpdml0eVRpbWVyID0gbmV3IFRpbWVyKFJFQURfUkVDRUlQVF9JTlRFUlZBTF9NUyk7XG4gICAgICAgIHdoaWxlICh0aGlzLl9yZWFkUmVjZWlwdEFjdGl2aXR5VGltZXIpIHsgLy91bnNldCBvbiB1bm1vdW50XG4gICAgICAgICAgICBVc2VyQWN0aXZpdHkuc2hhcmVkSW5zdGFuY2UoKS50aW1lV2hpbGVBY3RpdmVOb3codGhpcy5fcmVhZFJlY2VpcHRBY3Rpdml0eVRpbWVyKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVhZFJlY2VpcHRBY3Rpdml0eVRpbWVyLmZpbmlzaGVkKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnRpbnVlOyAvKiBhYm9ydGVkICovIH1cbiAgICAgICAgICAgIC8vIG91dHNpZGUgb2YgdHJ5L2NhdGNoIHRvIG5vdCBzd2FsbG93IGVycm9yc1xuICAgICAgICAgICAgdGhpcy5zZW5kUmVhZFJlY2VpcHQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZW5kUmVhZFJlY2VpcHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImxvd0JhbmR3aWR0aFwiKSkgcmV0dXJuO1xuXG4gICAgICAgIGlmICghdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLm1hbmFnZVJlYWRSZWNlaXB0cykgcmV0dXJuO1xuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgb24gdXNlcl9hY3Rpdml0eV9lbmQgd2hpY2ggaXMgZGVsYXllZCwgYW5kIGl0J3NcbiAgICAgICAgLy8gdmVyeSBwb3NzaWJsZSBoYXZlIGxvZ2dlZCBvdXQgd2l0aGluIHRoYXQgdGltZWZyYW1lLCBzbyBjaGVja1xuICAgICAgICAvLyB3ZSBzdGlsbCBoYXZlIGEgY2xpZW50LlxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIC8vIGlmIG5vIGNsaWVudCBvciBjbGllbnQgaXMgZ3Vlc3QgZG9uJ3Qgc2VuZCBSUiBvciBSTVxuICAgICAgICBpZiAoIWNsaSB8fCBjbGkuaXNHdWVzdCgpKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHNob3VsZFNlbmRSUiA9IHRydWU7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFJSRXZlbnRJZCA9IHRoaXMuX2dldEN1cnJlbnRSZWFkUmVjZWlwdCh0cnVlKTtcbiAgICAgICAgY29uc3QgY3VycmVudFJSRXZlbnRJbmRleCA9IHRoaXMuX2luZGV4Rm9yRXZlbnRJZChjdXJyZW50UlJFdmVudElkKTtcbiAgICAgICAgLy8gV2Ugd2FudCB0byBhdm9pZCBzZW5kaW5nIG91dCByZWFkIHJlY2VpcHRzIHdoZW4gd2UgYXJlIGxvb2tpbmcgYXRcbiAgICAgICAgLy8gZXZlbnRzIGluIHRoZSBwYXN0IHdoaWNoIGFyZSBiZWZvcmUgdGhlIGxhdGVzdCBSUi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIG5vdywgbGV0J3MgYXBwbHkgYSBoZXVyaXN0aWM6IGlmIChhKSB0aGUgZXZlbnQgY29ycmVzcG9uZGluZyB0b1xuICAgICAgICAvLyB0aGUgbGF0ZXN0IFJSIChlaXRoZXIgZnJvbSB0aGUgc2VydmVyLCBvciBzZW50IGJ5IG91cnNlbHZlcykgZG9lc24ndFxuICAgICAgICAvLyBhcHBlYXIgaW4gb3VyIHRpbWVsaW5lLCBhbmQgKGIpIHdlIGNvdWxkIGZvcndhcmQtcGFnaW5hdGUgdGhlIGV2ZW50XG4gICAgICAgIC8vIHRpbWVsaW5lLCB0aGVuIGRvbid0IHNlbmQgYW55IG1vcmUgUlJzLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGlzIGlzbid0IHdhdGVydGlnaHQsIGFzIHdlIGNvdWxkIGJlIGxvb2tpbmcgYXQgYSBzZWN0aW9uIG9mXG4gICAgICAgIC8vIHRpbWVsaW5lIHdoaWNoIGlzICphZnRlciogdGhlIGxhdGVzdCBSUiAoc28gd2Ugc2hvdWxkIGFjdHVhbGx5IHNlbmRcbiAgICAgICAgLy8gUlJzKSAtIGJ1dCB0aGF0IGlzIGEgYml0IG9mIGEgbmljaGUgY2FzZS4gSXQgd2lsbCBzb3J0IGl0c2VsZiBvdXQgd2hlblxuICAgICAgICAvLyB0aGUgdXNlciBldmVudHVhbGx5IGhpdHMgdGhlIGxpdmUgdGltZWxpbmUuXG4gICAgICAgIC8vXG4gICAgICAgIGlmIChjdXJyZW50UlJFdmVudElkICYmIGN1cnJlbnRSUkV2ZW50SW5kZXggPT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lbGluZVdpbmRvdy5jYW5QYWdpbmF0ZShFdmVudFRpbWVsaW5lLkZPUldBUkRTKSkge1xuICAgICAgICAgICAgc2hvdWxkU2VuZFJSID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXN0UmVhZEV2ZW50SW5kZXggPSB0aGlzLl9nZXRMYXN0RGlzcGxheWVkRXZlbnRJbmRleCh7XG4gICAgICAgICAgICBpZ25vcmVPd246IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAobGFzdFJlYWRFdmVudEluZGV4ID09PSBudWxsKSB7XG4gICAgICAgICAgICBzaG91bGRTZW5kUlIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbGFzdFJlYWRFdmVudCA9IHRoaXMuc3RhdGUuZXZlbnRzW2xhc3RSZWFkRXZlbnRJbmRleF07XG4gICAgICAgIHNob3VsZFNlbmRSUiA9IHNob3VsZFNlbmRSUiAmJlxuICAgICAgICAgICAgLy8gT25seSBzZW5kIGEgUlIgaWYgdGhlIGxhc3QgcmVhZCBldmVudCBpcyBhaGVhZCBpbiB0aGUgdGltZWxpbmUgcmVsYXRpdmUgdG9cbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IFJSIGV2ZW50LlxuICAgICAgICAgICAgbGFzdFJlYWRFdmVudEluZGV4ID4gY3VycmVudFJSRXZlbnRJbmRleCAmJlxuICAgICAgICAgICAgLy8gT25seSBzZW5kIGEgUlIgaWYgdGhlIGxhc3QgUlIgc2V0ICE9IHRoZSBvbmUgd2Ugd291bGQgc2VuZFxuICAgICAgICAgICAgdGhpcy5sYXN0UlJTZW50RXZlbnRJZCAhPSBsYXN0UmVhZEV2ZW50LmdldElkKCk7XG5cbiAgICAgICAgLy8gT25seSBzZW5kIGEgUk0gaWYgdGhlIGxhc3QgUk0gc2VudCAhPSB0aGUgb25lIHdlIHdvdWxkIHNlbmRcbiAgICAgICAgY29uc3Qgc2hvdWxkU2VuZFJNID1cbiAgICAgICAgICAgIHRoaXMubGFzdFJNU2VudEV2ZW50SWQgIT0gdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZDtcblxuICAgICAgICAvLyB3ZSBhbHNvIHJlbWVtYmVyIHRoZSBsYXN0IHJlYWQgcmVjZWlwdCB3ZSBzZW50IHRvIGF2b2lkIHNwYW1taW5nIHRoZVxuICAgICAgICAvLyBzYW1lIG9uZSBhdCB0aGUgc2VydmVyIHJlcGVhdGVkbHlcbiAgICAgICAgaWYgKHNob3VsZFNlbmRSUiB8fCBzaG91bGRTZW5kUk0pIHtcbiAgICAgICAgICAgIGlmIChzaG91bGRTZW5kUlIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RSUlNlbnRFdmVudElkID0gbGFzdFJlYWRFdmVudC5nZXRJZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYXN0UmVhZEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGFzdFJNU2VudEV2ZW50SWQgPSB0aGlzLnN0YXRlLnJlYWRNYXJrZXJFdmVudElkO1xuXG4gICAgICAgICAgICBjb25zdCByb29tSWQgPSB0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20ucm9vbUlkO1xuICAgICAgICAgICAgY29uc3QgaGlkZGVuUlIgPSAhU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNlbmRSZWFkUmVjZWlwdHNcIiwgcm9vbUlkKTtcblxuICAgICAgICAgICAgZGVidWdsb2coJ1RpbWVsaW5lUGFuZWw6IFNlbmRpbmcgUmVhZCBNYXJrZXJzIGZvciAnLFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbS5yb29tSWQsXG4gICAgICAgICAgICAgICAgJ3JtJywgdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCxcbiAgICAgICAgICAgICAgICBsYXN0UmVhZEV2ZW50ID8gJ3JyICcgKyBsYXN0UmVhZEV2ZW50LmdldElkKCkgOiAnJyxcbiAgICAgICAgICAgICAgICAnIGhpZGRlbjonICsgaGlkZGVuUlIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldFJvb21SZWFkTWFya2VycyhcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20ucm9vbUlkLFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUucmVhZE1hcmtlckV2ZW50SWQsXG4gICAgICAgICAgICAgICAgbGFzdFJlYWRFdmVudCwgLy8gQ291bGQgYmUgbnVsbCwgaW4gd2hpY2ggY2FzZSBubyBSUiBpcyBzZW50XG4gICAgICAgICAgICAgICAge2hpZGRlbjogaGlkZGVuUlJ9LFxuICAgICAgICAgICAgKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIC9yZWFkX21hcmtlcnMgQVBJIGlzIG5vdCBpbXBsZW1lbnRlZCBvbiB0aGlzIEhTLCBmYWxsYmFjayB0byBqdXN0IFJSXG4gICAgICAgICAgICAgICAgaWYgKGUuZXJyY29kZSA9PT0gJ01fVU5SRUNPR05JWkVEJyAmJiBsYXN0UmVhZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VuZFJlYWRSZWNlaXB0KFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJlYWRFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtoaWRkZW46IGhpZGRlblJSfSxcbiAgICAgICAgICAgICAgICAgICAgKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdFJSU2VudEV2ZW50SWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGl0IGZhaWxlZCwgc28gYWxsb3cgcmV0cmllcyBuZXh0IHRpbWUgdGhlIHVzZXIgaXMgYWN0aXZlXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UlJTZW50RXZlbnRJZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RSTVNlbnRFdmVudElkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGRvIGEgcXVpY2stcmVzZXQgb2Ygb3VyIHVucmVhZE5vdGlmaWNhdGlvbkNvdW50IHRvIGF2b2lkIGhhdmluZ1xuICAgICAgICAgICAgLy8gdG8gd2FpdCBmcm9tIHRoZSByZW1vdGUgZWNobyBmcm9tIHRoZSBob21lc2VydmVyLlxuICAgICAgICAgICAgLy8gd2Ugb25seSBkbyB0aGlzIGlmIHdlJ3JlIHJpZ2h0IGF0IHRoZSBlbmQsIGJlY2F1c2Ugd2UncmUganVzdCBhc3N1bWluZ1xuICAgICAgICAgICAgLy8gdGhhdCBzZW5kaW5nIGFuIFJSIGZvciB0aGUgbGF0ZXN0IG1lc3NhZ2Ugd2lsbCBzZXQgb3VyIG5vdGlmIGNvdW50ZXJcbiAgICAgICAgICAgIC8vIHRvIHplcm86IGl0IG1heSBub3QgZG8gdGhpcyBpZiB3ZSBzZW5kIGFuIFJSIGZvciBzb21ld2hlcmUgYmVmb3JlIHRoZSBlbmQuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F0RW5kT2ZMaXZlVGltZWxpbmUoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbS5zZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCgndG90YWwnLCAwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20uc2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQoJ2hpZ2hsaWdodCcsIDApO1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ29uX3Jvb21fcmVhZCcsXG4gICAgICAgICAgICAgICAgICAgIHJvb21JZDogdGhpcy5wcm9wcy50aW1lbGluZVNldC5yb29tLnJvb21JZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBpZiB0aGUgcmVhZCBtYXJrZXIgaXMgb24gdGhlIHNjcmVlbiwgd2UgY2FuIG5vdyBhc3N1bWUgd2UndmUgY2F1Z2h0IHVwIHRvIHRoZSBlbmRcbiAgICAvLyBvZiB0aGUgc2NyZWVuLCBzbyBtb3ZlIHRoZSBtYXJrZXIgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgdXBkYXRlUmVhZE1hcmtlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5tYW5hZ2VSZWFkTWFya2VycykgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5nZXRSZWFkTWFya2VyUG9zaXRpb24oKSA9PT0gMSkge1xuICAgICAgICAgICAgLy8gdGhlIHJlYWQgbWFya2VyIGlzIGF0IGFuIGV2ZW50IGJlbG93IHRoZSB2aWV3cG9ydCxcbiAgICAgICAgICAgIC8vIHdlIGRvbid0IHdhbnQgdG8gcmV3aW5kIGl0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIG1vdmUgdGhlIFJNIHRvICphZnRlciogdGhlIG1lc3NhZ2UgYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLiBUaGlzXG4gICAgICAgIC8vIGF2b2lkcyBhIHByb2JsZW0gd2hlcmVieSB3ZSBuZXZlciBhZHZhbmNlIHRoZSBSTSBpZiB0aGVyZSBpcyBhIGh1Z2VcbiAgICAgICAgLy8gbWVzc2FnZSB3aGljaCBkb2Vzbid0IGZpdCBvbiB0aGUgc2NyZWVuLlxuICAgICAgICBjb25zdCBsYXN0RGlzcGxheWVkSW5kZXggPSB0aGlzLl9nZXRMYXN0RGlzcGxheWVkRXZlbnRJbmRleCh7XG4gICAgICAgICAgICBhbGxvd1BhcnRpYWw6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChsYXN0RGlzcGxheWVkSW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXN0RGlzcGxheWVkRXZlbnQgPSB0aGlzLnN0YXRlLmV2ZW50c1tsYXN0RGlzcGxheWVkSW5kZXhdO1xuICAgICAgICB0aGlzLl9zZXRSZWFkTWFya2VyKGxhc3REaXNwbGF5ZWRFdmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REaXNwbGF5ZWRFdmVudC5nZXRUcygpKTtcblxuICAgICAgICAvLyB0aGUgcmVhZC1tYXJrZXIgc2hvdWxkIGJlY29tZSBpbnZpc2libGUsIHNvIHRoYXQgaWYgdGhlIHVzZXIgc2Nyb2xsc1xuICAgICAgICAvLyBkb3duLCB0aGV5IGRvbid0IHNlZSBpdC5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVhZE1hcmtlclZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHJlYWRNYXJrZXJWaXNpYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gYWR2YW5jZSB0aGUgcmVhZCBtYXJrZXIgcGFzdCBhbnkgZXZlbnRzIHdlIHNlbnQgb3Vyc2VsdmVzLlxuICAgIF9hZHZhbmNlUmVhZE1hcmtlclBhc3RNeUV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5tYW5hZ2VSZWFkTWFya2VycykgcmV0dXJuO1xuXG4gICAgICAgIC8vIHdlIGNhbGwgYF90aW1lbGluZVdpbmRvdy5nZXRFdmVudHMoKWAgcmF0aGVyIHRoYW4gdXNpbmdcbiAgICAgICAgLy8gYHRoaXMuc3RhdGUubGl2ZUV2ZW50c2AsIGJlY2F1c2UgUmVhY3QgYmF0Y2hlcyB0aGUgdXBkYXRlIHRvIHRoZVxuICAgICAgICAvLyBsYXR0ZXIsIHNvIGl0IG1heSBub3QgaGF2ZSBiZWVuIHVwZGF0ZWQgeWV0LlxuICAgICAgICBjb25zdCBldmVudHMgPSB0aGlzLl90aW1lbGluZVdpbmRvdy5nZXRFdmVudHMoKTtcblxuICAgICAgICAvLyBmaXJzdCBmaW5kIHdoZXJlIHRoZSBjdXJyZW50IFJNIGlzXG4gICAgICAgIGxldCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnRzW2ldLmdldElkKCkgPT0gdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpID49IGV2ZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vdyB0aGluayBhYm91dCBhZHZhbmNpbmcgaXRcbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkO1xuICAgICAgICBmb3IgKGkrKzsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZXYgPSBldmVudHNbaV07XG4gICAgICAgICAgICBpZiAoIWV2LnNlbmRlciB8fCBldi5zZW5kZXIudXNlcklkICE9IG15VXNlcklkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaSBpcyBub3cgdGhlIGZpcnN0IHVucmVhZCBtZXNzYWdlIHdoaWNoIHdlIGRpZG4ndCBzZW5kIG91cnNlbHZlcy5cbiAgICAgICAgaS0tO1xuXG4gICAgICAgIGNvbnN0IGV2ID0gZXZlbnRzW2ldO1xuICAgICAgICB0aGlzLl9zZXRSZWFkTWFya2VyKGV2LmdldElkKCksIGV2LmdldFRzKCkpO1xuICAgIH0sXG5cbiAgICAvKiBqdW1wIGRvd24gdG8gdGhlIGJvdHRvbSBvZiB0aGlzIHJvb20sIHdoZXJlIG5ldyBldmVudHMgYXJlIGFycml2aW5nXG4gICAgICovXG4gICAganVtcFRvTGl2ZVRpbWVsaW5lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gaWYgd2UgY2FuJ3QgZm9yd2FyZC1wYWdpbmF0ZSB0aGUgZXhpc3RpbmcgdGltZWxpbmUsIHRoZW4gdGhlcmVcbiAgICAgICAgLy8gaXMgbm8gcG9pbnQgcmVsb2FkaW5nIGl0IC0ganVzdCBqdW1wIHN0cmFpZ2h0IHRvIHRoZSBib3R0b20uXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE90aGVyd2lzZSwgcmVsb2FkIHRoZSB0aW1lbGluZSByYXRoZXIgdGhhbiB0cnlpbmcgdG8gcGFnaW5hdGVcbiAgICAgICAgLy8gdGhyb3VnaCBhbGwgb2Ygc3BhY2UtdGltZS5cbiAgICAgICAgaWYgKHRoaXMuX3RpbWVsaW5lV2luZG93LmNhblBhZ2luYXRlKEV2ZW50VGltZWxpbmUuRk9SV0FSRFMpKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkVGltZWxpbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyogc2Nyb2xsIHRvIHNob3cgdGhlIHJlYWQtdXAtdG8gbWFya2VyLiBXZSBwdXQgaXQgMS8zIG9mIHRoZSB3YXkgZG93blxuICAgICAqIHRoZSBjb250YWluZXIuXG4gICAgICovXG4gICAganVtcFRvUmVhZE1hcmtlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5tYW5hZ2VSZWFkTWFya2VycykgcmV0dXJuO1xuICAgICAgICBpZiAoIXRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50KSByZXR1cm47XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHdlIG1heSBub3QgaGF2ZSBsb2FkZWQgdGhlIGV2ZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIHJlYWQtbWFya2VyXG4gICAgICAgIC8vIGludG8gdGhlIF90aW1lbGluZVdpbmRvdy4gSW4gdGhhdCBjYXNlLCBhdHRlbXB0cyB0byBzY3JvbGwgdG8gaXRcbiAgICAgICAgLy8gd2lsbCBmYWlsLlxuICAgICAgICAvL1xuICAgICAgICAvLyBhIHF1aWNrIHdheSB0byBmaWd1cmUgb3V0IGlmIHdlJ3ZlIGxvYWRlZCB0aGUgcmVsZXZhbnQgZXZlbnQgaXNcbiAgICAgICAgLy8gc2ltcGx5IHRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlcGFuZWwga25vd3Mgd2hlcmUgdGhlIHJlYWQtbWFya2VyIGlzLlxuICAgICAgICBjb25zdCByZXQgPSB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5nZXRSZWFkTWFya2VyUG9zaXRpb24oKTtcbiAgICAgICAgaWYgKHJldCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gVGhlIG1lc3NhZ2VwYW5lbCBrbm93cyB3aGVyZSB0aGUgUk0gaXMsIHNvIHdlIG11c3QgaGF2ZSBsb2FkZWRcbiAgICAgICAgICAgIC8vIHRoZSByZWxldmFudCBldmVudC5cbiAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LnNjcm9sbFRvRXZlbnQodGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLCAxLzMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9va3MgbGlrZSB3ZSBoYXZlbid0IGxvYWRlZCB0aGUgZXZlbnQgY29ycmVzcG9uZGluZyB0byB0aGUgcmVhZC1tYXJrZXIuXG4gICAgICAgIC8vIEFzIHdpdGgganVtcFRvTGl2ZVRpbWVsaW5lLCB3ZSB3YW50IHRvIHJlbG9hZCB0aGUgdGltZWxpbmUgYXJvdW5kIHRoZVxuICAgICAgICAvLyByZWFkLW1hcmtlci5cbiAgICAgICAgdGhpcy5fbG9hZFRpbWVsaW5lKHRoaXMuc3RhdGUucmVhZE1hcmtlckV2ZW50SWQsIDAsIDEvMyk7XG4gICAgfSxcblxuICAgIC8qIHVwZGF0ZSB0aGUgcmVhZC11cC10byBtYXJrZXIgdG8gbWF0Y2ggdGhlIHJlYWQgcmVjZWlwdFxuICAgICAqL1xuICAgIGZvcmdldFJlYWRNYXJrZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvcHMubWFuYWdlUmVhZE1hcmtlcnMpIHJldHVybjtcblxuICAgICAgICBjb25zdCBybUlkID0gdGhpcy5fZ2V0Q3VycmVudFJlYWRSZWNlaXB0KCk7XG5cbiAgICAgICAgLy8gc2VlIGlmIHdlIGtub3cgdGhlIHRpbWVzdGFtcCBmb3IgdGhlIHJyIGV2ZW50XG4gICAgICAgIGNvbnN0IHRsID0gdGhpcy5wcm9wcy50aW1lbGluZVNldC5nZXRUaW1lbGluZUZvckV2ZW50KHJtSWQpO1xuICAgICAgICBsZXQgcm1UcztcbiAgICAgICAgaWYgKHRsKSB7XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRsLmdldEV2ZW50cygpLmZpbmQoKGUpID0+IHsgcmV0dXJuIGUuZ2V0SWQoKSA9PSBybUlkOyB9KTtcbiAgICAgICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgICAgIHJtVHMgPSBldmVudC5nZXRUcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2V0UmVhZE1hcmtlcihybUlkLCBybVRzKTtcbiAgICB9LFxuXG4gICAgLyogcmV0dXJuIHRydWUgaWYgdGhlIGNvbnRlbnQgaXMgZnVsbHkgc2Nyb2xsZWQgZG93biBhbmQgd2UgYXJlXG4gICAgICogYXQgdGhlIGVuZCBvZiB0aGUgbGl2ZSB0aW1lbGluZS5cbiAgICAgKi9cbiAgICBpc0F0RW5kT2ZMaXZlVGltZWxpbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnRcbiAgICAgICAgICAgICYmIHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LmlzQXRCb3R0b20oKVxuICAgICAgICAgICAgJiYgdGhpcy5fdGltZWxpbmVXaW5kb3dcbiAgICAgICAgICAgICYmICF0aGlzLl90aW1lbGluZVdpbmRvdy5jYW5QYWdpbmF0ZShFdmVudFRpbWVsaW5lLkZPUldBUkRTKTtcbiAgICB9LFxuXG5cbiAgICAvKiBnZXQgdGhlIGN1cnJlbnQgc2Nyb2xsIHN0YXRlLiBTZWUgU2Nyb2xsUGFuZWwuZ2V0U2Nyb2xsU3RhdGUgZm9yXG4gICAgICogZGV0YWlscy5cbiAgICAgKlxuICAgICAqIHJldHVybnMgbnVsbCBpZiB3ZSBhcmUgbm90IG1vdW50ZWQuXG4gICAgICovXG4gICAgZ2V0U2Nyb2xsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50KSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5nZXRTY3JvbGxTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvLyByZXR1cm5zIG9uZSBvZjpcbiAgICAvL1xuICAgIC8vICBudWxsOiB0aGVyZSBpcyBubyByZWFkIG1hcmtlclxuICAgIC8vICAtMTogcmVhZCBtYXJrZXIgaXMgYWJvdmUgdGhlIHdpbmRvd1xuICAgIC8vICAgMDogcmVhZCBtYXJrZXIgaXMgdmlzaWJsZVxuICAgIC8vICArMTogcmVhZCBtYXJrZXIgaXMgYmVsb3cgdGhlIHdpbmRvd1xuICAgIGdldFJlYWRNYXJrZXJQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5tYW5hZ2VSZWFkTWFya2VycykgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmICghdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IHJldCA9IHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LmdldFJlYWRNYXJrZXJQb3NpdGlvbigpO1xuICAgICAgICBpZiAocmV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIG1lc3NhZ2VQYW5lbCBkb2Vzbid0IGtub3cgd2hlcmUgdGhlIHJlYWQgbWFya2VyIGlzLlxuICAgICAgICAvLyBpZiB3ZSBrbm93IHRoZSB0aW1lc3RhbXAgb2YgdGhlIHJlYWQgbWFya2VyLCBtYWtlIGEgZ3Vlc3MgYmFzZWQgb24gdGhhdC5cbiAgICAgICAgY29uc3Qgcm1UcyA9IFRpbWVsaW5lUGFuZWwucm9vbVJlYWRNYXJrZXJUc01hcFt0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20ucm9vbUlkXTtcbiAgICAgICAgaWYgKHJtVHMgJiYgdGhpcy5zdGF0ZS5ldmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKHJtVHMgPCB0aGlzLnN0YXRlLmV2ZW50c1swXS5nZXRUcygpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICBjYW5KdW1wVG9SZWFkTWFya2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gMS4gRG8gbm90IHNob3cganVtcCBiYXIgaWYgbmVpdGhlciB0aGUgUk0gbm9yIHRoZSBSUiBhcmUgc2V0LlxuICAgICAgICAvLyAzLiBXZSB3YW50IHRvIHNob3cgdGhlIGJhciBpZiB0aGUgcmVhZC1tYXJrZXIgaXMgb2ZmIHRoZSB0b3Agb2YgdGhlIHNjcmVlbi5cbiAgICAgICAgLy8gNC4gQWxzbywgaWYgcG9zID09PSBudWxsLCB0aGUgZXZlbnQgbWlnaHQgbm90IGJlIHBhZ2luYXRlZCAtIHNob3cgdGhlIHVucmVhZCBiYXJcbiAgICAgICAgY29uc3QgcG9zID0gdGhpcy5nZXRSZWFkTWFya2VyUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgcmV0ID0gdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCAhPT0gbnVsbCAmJiAvLyAxLlxuICAgICAgICAgICAgKHBvcyA8IDAgfHwgcG9zID09PSBudWxsKTsgLy8gMy4sIDQuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogY2FsbGVkIGJ5IHRoZSBwYXJlbnQgY29tcG9uZW50IHdoZW4gUGFnZVVwL0Rvd24vZXRjIGlzIHByZXNzZWQuXG4gICAgICpcbiAgICAgKiBXZSBwYXNzIGl0IGRvd24gdG8gdGhlIHNjcm9sbCBwYW5lbC5cbiAgICAgKi9cbiAgICBoYW5kbGVTY3JvbGxLZXk6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICghdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8ganVtcCB0byB0aGUgbGl2ZSB0aW1lbGluZSBvbiBjdHJsLWVuZCwgcmF0aGVyIHRoYW4gdGhlIGVuZCBvZiB0aGVcbiAgICAgICAgLy8gdGltZWxpbmUgd2luZG93LlxuICAgICAgICBpZiAoZXYuY3RybEtleSAmJiAhZXYuc2hpZnRLZXkgJiYgIWV2LmFsdEtleSAmJiAhZXYubWV0YUtleSAmJiBldi5rZXkgPT09IEtleS5FTkQpIHtcbiAgICAgICAgICAgIHRoaXMuanVtcFRvTGl2ZVRpbWVsaW5lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5oYW5kbGVTY3JvbGxLZXkoZXYpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pbml0VGltZWxpbmU6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIGNvbnN0IGluaXRpYWxFdmVudCA9IHByb3BzLmV2ZW50SWQ7XG4gICAgICAgIGNvbnN0IHBpeGVsT2Zmc2V0ID0gcHJvcHMuZXZlbnRQaXhlbE9mZnNldDtcblxuICAgICAgICAvLyBpZiBhIHBpeGVsT2Zmc2V0IGlzIGdpdmVuLCBpdCBpcyByZWxhdGl2ZSB0byB0aGUgYm90dG9tIG9mIHRoZVxuICAgICAgICAvLyBjb250YWluZXIuIElmIG5vdCwgcHV0IHRoZSBldmVudCBpbiB0aGUgbWlkZGxlIG9mIHRoZSBjb250YWluZXIuXG4gICAgICAgIGxldCBvZmZzZXRCYXNlID0gMTtcbiAgICAgICAgaWYgKHBpeGVsT2Zmc2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIG9mZnNldEJhc2UgPSAwLjU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRpbWVsaW5lKGluaXRpYWxFdmVudCwgcGl4ZWxPZmZzZXQsIG9mZnNldEJhc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAocmUpLWxvYWQgdGhlIGV2ZW50IHRpbWVsaW5lLCBhbmQgaW5pdGlhbGlzZSB0aGUgc2Nyb2xsIHN0YXRlLCBjZW50ZXJlZFxuICAgICAqIGFyb3VuZCB0aGUgZ2l2ZW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZz99ICBldmVudElkIHRoZSBldmVudCB0byBmb2N1cyBvbi4gSWYgdW5kZWZpbmVkLCB3aWxsXG4gICAgICogICAgc2Nyb2xsIHRvIHRoZSBib3R0b20gb2YgdGhlIHJvb20uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcj99IHBpeGVsT2Zmc2V0ICAgb2Zmc2V0IHRvIHBvc2l0aW9uIHRoZSBnaXZlbiBldmVudCBhdFxuICAgICAqICAgIChwaXhlbHMgZnJvbSB0aGUgb2Zmc2V0QmFzZSkuIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvIDAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcj99IG9mZnNldEJhc2UgdGhlIHJlZmVyZW5jZSBwb2ludCBmb3IgdGhlIHBpeGVsT2Zmc2V0LiAwXG4gICAgICogICAgIG1lYW5zIHRoZSB0b3Agb2YgdGhlIGNvbnRhaW5lciwgMSBtZWFucyB0aGUgYm90dG9tLCBhbmQgZnJhY3Rpb25hbFxuICAgICAqICAgICB2YWx1ZXMgbWVhbiBzb21ld2hlcmUgaW4gdGhlIG1pZGRsZS4gSWYgb21pdHRlZCwgaXQgZGVmYXVsdHMgdG8gMC5cbiAgICAgKlxuICAgICAqIHJldHVybnMgYSBwcm9taXNlIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIHRoZSBsb2FkIGNvbXBsZXRlcy5cbiAgICAgKi9cbiAgICBfbG9hZFRpbWVsaW5lOiBmdW5jdGlvbihldmVudElkLCBwaXhlbE9mZnNldCwgb2Zmc2V0QmFzZSkge1xuICAgICAgICB0aGlzLl90aW1lbGluZVdpbmRvdyA9IG5ldyBNYXRyaXguVGltZWxpbmVXaW5kb3coXG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCksIHRoaXMucHJvcHMudGltZWxpbmVTZXQsXG4gICAgICAgICAgICB7d2luZG93TGltaXQ6IHRoaXMucHJvcHMudGltZWxpbmVDYXB9KTtcblxuICAgICAgICBjb25zdCBvbkxvYWRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSB0aW1lbGluZSBtaW4taGVpZ2h0IHdoZW5cbiAgICAgICAgICAgIC8vIChyZSlsb2FkaW5nIHRoZSB0aW1lbGluZVxuICAgICAgICAgICAgaWYgKHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZVBhbmVsLmN1cnJlbnQub25UaW1lbGluZVJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9yZWxvYWRFdmVudHMoKTtcblxuICAgICAgICAgICAgLy8gSWYgd2Ugc3dpdGNoZWQgYXdheSBmcm9tIHRoZSByb29tIHdoaWxlIHRoZXJlIHdlcmUgcGVuZGluZ1xuICAgICAgICAgICAgLy8gb3V0Z29pbmcgZXZlbnRzLCB0aGUgcmVhZC1tYXJrZXIgd2lsbCBiZSBiZWZvcmUgdGhvc2UgZXZlbnRzLlxuICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBza2lwIG92ZXIgYW55IHdoaWNoIGhhdmUgc3Vic2VxdWVudGx5IGJlZW4gc2VudC5cbiAgICAgICAgICAgIHRoaXMuX2FkdmFuY2VSZWFkTWFya2VyUGFzdE15RXZlbnRzKCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGNhbkJhY2tQYWdpbmF0ZTogdGhpcy5fdGltZWxpbmVXaW5kb3cuY2FuUGFnaW5hdGUoRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMpLFxuICAgICAgICAgICAgICAgIGNhbkZvcndhcmRQYWdpbmF0ZTogdGhpcy5fdGltZWxpbmVXaW5kb3cuY2FuUGFnaW5hdGUoRXZlbnRUaW1lbGluZS5GT1JXQVJEUyksXG4gICAgICAgICAgICAgICAgdGltZWxpbmVMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXNlIHRoZSBzY3JvbGwgc3RhdGUgb2YgdGhlIG1lc3NhZ2UgcGFuZWxcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgc2hvdWxkbid0IGhhcHBlbiAtIHdlIGtub3cgd2UncmUgbW91bnRlZCBiZWNhdXNlXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGluIGEgc2V0U3RhdGUgY2FsbGJhY2ssIGFuZCB3ZSBrbm93XG4gICAgICAgICAgICAgICAgICAgIC8vIHRpbWVsaW5lTG9hZGluZyBpcyBub3cgZmFsc2UsIHNvIHJlbmRlcigpIHNob3VsZCBoYXZlXG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdW50ZWQgdGhlIG1lc3NhZ2UgcGFuZWwuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2FuJ3QgaW5pdGlhbGlzZSBzY3JvbGwgc3RhdGUgYmVjYXVzZSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZVBhbmVsIGRpZG4ndCBsb2FkXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VQYW5lbC5jdXJyZW50LnNjcm9sbFRvRXZlbnQoZXZlbnRJZCwgcGl4ZWxPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRCYXNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudC5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuc2VuZFJlYWRSZWNlaXB0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbkVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgdGltZWxpbmVMb2FkaW5nOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgYEVycm9yIGxvYWRpbmcgdGltZWxpbmUgcGFuZWwgYXQgJHtldmVudElkfTogJHtlcnJvcn1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG5cbiAgICAgICAgICAgIGxldCBvbkZpbmlzaGVkO1xuXG4gICAgICAgICAgICAvLyBpZiB3ZSB3ZXJlIGdpdmVuIGFuIGV2ZW50IElELCB0aGVuIHdoZW4gdGhlIHVzZXIgY2xvc2VzIHRoZVxuICAgICAgICAgICAgLy8gZGlhbG9nLCBsZXQncyBqdW1wIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiB3ZSB3ZXJlbid0LFxuICAgICAgICAgICAgLy8gc29tZXRoaW5nIGhhcyBnb25lIGJhZGx5IHdyb25nIGFuZCByYXRoZXIgdGhhbiBjYXVzaW5nIGEgbG9vcCBvZlxuICAgICAgICAgICAgLy8gdW5kaXNtaXNzYWJsZSBkaWFsb2dzLCBsZXQncyBqdXN0IGdpdmUgdXAuXG4gICAgICAgICAgICBpZiAoZXZlbnRJZCkge1xuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHZpYSB0aGUgZGlzcGF0Y2hlciBzbyB0aGF0IHRoZSBVUkwgaXMgdXBkYXRlZFxuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbS5yb29tSWQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJjb2RlID09ICdNX0ZPUkJJRERFTicpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVHJpZWQgdG8gbG9hZCBhIHNwZWNpZmljIHBvaW50IGluIHRoaXMgcm9vbSdzIHRpbWVsaW5lLCBidXQgeW91IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIHZpZXcgdGhlIG1lc3NhZ2UgaW4gcXVlc3Rpb24uXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRyaWVkIHRvIGxvYWQgYSBzcGVjaWZpYyBwb2ludCBpbiB0aGlzIHJvb20ncyB0aW1lbGluZSwgYnV0IHdhcyBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwidW5hYmxlIHRvIGZpbmQgaXQuXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBsb2FkIHRpbWVsaW5lIHBvc2l0aW9uJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRmFpbGVkIHRvIGxvYWQgdGltZWxpbmUgcG9zaXRpb25cIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogb25GaW5pc2hlZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSB0aGUgZXZlbnQgaW4gcXVlc3Rpb24sIFRpbWVsaW5lV2luZG93LmxvYWRcbiAgICAgICAgLy8gcmV0dXJucyBhIHJlc29sdmVkIHByb21pc2UuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEluIHRoaXMgc2l0dWF0aW9uLCB3ZSBkb24ndCByZWFsbHkgd2FudCB0byBkZWZlciB0aGUgdXBkYXRlIG9mIHRoZVxuICAgICAgICAvLyBzdGF0ZSB0byB0aGUgbmV4dCBldmVudCBsb29wLCBiZWNhdXNlIGl0IG1ha2VzIHJvb20tc3dpdGNoaW5nIGZlZWxcbiAgICAgICAgLy8gcXVpdGUgc2xvdy4gU28gd2UgZGV0ZWN0IHRoYXQgc2l0dWF0aW9uIGFuZCBzaG9ydGN1dCBzdHJhaWdodCB0b1xuICAgICAgICAvLyBjYWxsaW5nIF9yZWxvYWRFdmVudHMgYW5kIHVwZGF0aW5nIHRoZSBzdGF0ZS5cblxuICAgICAgICBjb25zdCB0aW1lbGluZSA9IHRoaXMucHJvcHMudGltZWxpbmVTZXQuZ2V0VGltZWxpbmVGb3JFdmVudChldmVudElkKTtcbiAgICAgICAgaWYgKHRpbWVsaW5lKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgaG90LXBhdGggb3B0aW1pemF0aW9uIGJ5IHNraXBwaW5nIGEgcHJvbWlzZSB0aWNrXG4gICAgICAgICAgICAvLyBieSByZXBlYXRpbmcgYSBuby1vcCBzeW5jIGJyYW5jaCBpbiBUaW1lbGluZVNldC5nZXRUaW1lbGluZUZvckV2ZW50ICYgTWF0cml4Q2xpZW50LmdldEV2ZW50VGltZWxpbmVcbiAgICAgICAgICAgIHRoaXMuX3RpbWVsaW5lV2luZG93LmxvYWQoZXZlbnRJZCwgSU5JVElBTF9TSVpFKTsgLy8gaW4gdGhpcyBicmFuY2ggdGhpcyBtZXRob2Qgd2lsbCBoYXBwZW4gaW4gc3luYyB0aW1lXG4gICAgICAgICAgICBvbkxvYWRlZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvbSA9IHRoaXMuX3RpbWVsaW5lV2luZG93LmxvYWQoZXZlbnRJZCwgSU5JVElBTF9TSVpFKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGV2ZW50czogW10sXG4gICAgICAgICAgICAgICAgbGl2ZUV2ZW50czogW10sXG4gICAgICAgICAgICAgICAgY2FuQmFja1BhZ2luYXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYW5Gb3J3YXJkUGFnaW5hdGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRpbWVsaW5lTG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcHJvbS50aGVuKG9uTG9hZGVkLCBvbkVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBoYW5kbGUgdGhlIGNvbXBsZXRpb24gb2YgYSB0aW1lbGluZSBsb2FkIG9yIGxvY2FsRWNob1VwZGF0ZSwgYnlcbiAgICAvLyByZWxvYWRpbmcgdGhlIGV2ZW50cyBmcm9tIHRoZSB0aW1lbGluZXdpbmRvdyBhbmQgcGVuZGluZyBldmVudCBsaXN0IGludG9cbiAgICAvLyB0aGUgc3RhdGUuXG4gICAgX3JlbG9hZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHdlIG1pZ2h0IGhhdmUgc3dpdGNoZWQgcm9vbXMgc2luY2UgdGhlIGxvYWQgc3RhcnRlZCAtIGp1c3QgYmluXG4gICAgICAgIC8vIHRoZSByZXN1bHRzIGlmIHNvLlxuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHRoaXMuX2dldEV2ZW50cygpKTtcbiAgICB9LFxuXG4gICAgLy8gZ2V0IHRoZSBsaXN0IG9mIGV2ZW50cyBmcm9tIHRoZSB0aW1lbGluZSB3aW5kb3cgYW5kIHRoZSBwZW5kaW5nIGV2ZW50IGxpc3RcbiAgICBfZ2V0RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgZXZlbnRzID0gdGhpcy5fdGltZWxpbmVXaW5kb3cuZ2V0RXZlbnRzKCk7XG4gICAgICAgIGNvbnN0IGZpcnN0VmlzaWJsZUV2ZW50SW5kZXggPSB0aGlzLl9jaGVja0ZvclByZUpvaW5VSVNJKGV2ZW50cyk7XG5cbiAgICAgICAgLy8gSG9sZCBvbnRvIHRoZSBsaXZlIGV2ZW50cyBzZXBhcmF0ZWx5LiBUaGUgcmVhZCByZWNlaXB0IGFuZCByZWFkIG1hcmtlclxuICAgICAgICAvLyBzaG91bGQgdXNlIHRoaXMgbGlzdCwgc28gdGhhdCB0aGV5IGRvbid0IGFkdmFuY2UgaW50byBwZW5kaW5nIGV2ZW50cy5cbiAgICAgICAgY29uc3QgbGl2ZUV2ZW50cyA9IFsuLi5ldmVudHNdO1xuXG4gICAgICAgIC8vIGlmIHdlJ3JlIGF0IHRoZSBlbmQgb2YgdGhlIGxpdmUgdGltZWxpbmUsIGFwcGVuZCB0aGUgcGVuZGluZyBldmVudHNcbiAgICAgICAgaWYgKCF0aGlzLl90aW1lbGluZVdpbmRvdy5jYW5QYWdpbmF0ZShFdmVudFRpbWVsaW5lLkZPUldBUkRTKSkge1xuICAgICAgICAgICAgZXZlbnRzLnB1c2goLi4udGhpcy5wcm9wcy50aW1lbGluZVNldC5nZXRQZW5kaW5nRXZlbnRzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGV2ZW50cyxcbiAgICAgICAgICAgIGxpdmVFdmVudHMsXG4gICAgICAgICAgICBmaXJzdFZpc2libGVFdmVudEluZGV4LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBmb3IgdW5kZWNyeXB0YWJsZSBtZXNzYWdlcyB0aGF0IHdlcmUgc2VudCB3aGlsZSB0aGUgdXNlciB3YXMgbm90IGluXG4gICAgICogdGhlIHJvb20uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5PE1hdHJpeEV2ZW50Pn0gZXZlbnRzIFRoZSB0aW1lbGluZSBldmVudHMgdG8gY2hlY2tcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIGluZGV4IHdpdGhpbiBgZXZlbnRzYCBvZiB0aGUgZXZlbnQgYWZ0ZXIgdGhlIG1vc3QgcmVjZW50XG4gICAgICogdW5kZWNyeXB0YWJsZSBldmVudCB0aGF0IHdhcyBzZW50IHdoaWxlIHRoZSB1c2VyIHdhcyBub3QgaW4gdGhlIHJvb20uICBJZiBub1xuICAgICAqIHN1Y2ggZXZlbnRzIHdlcmUgZm91bmQsIHRoZW4gaXQgcmV0dXJucyAwLlxuICAgICAqL1xuICAgIF9jaGVja0ZvclByZUpvaW5VSVNJOiBmdW5jdGlvbihldmVudHMpIHtcbiAgICAgICAgY29uc3Qgcm9vbSA9IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbTtcblxuICAgICAgICBpZiAoZXZlbnRzLmxlbmd0aCA9PT0gMCB8fCAhcm9vbSB8fFxuICAgICAgICAgICAgIU1hdHJpeENsaWVudFBlZy5nZXQoKS5pc1Jvb21FbmNyeXB0ZWQocm9vbS5yb29tSWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWQ7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSB1c2VyJ3MgbWVtYmVyc2hpcCBhdCB0aGUgbGFzdCBldmVudCBieSBnZXR0aW5nIHRoZSB0aW1lbGluZVxuICAgICAgICAvLyB0aGF0IHRoZSBldmVudCBiZWxvbmdzIHRvLCBhbmQgdHJhdmVyc2luZyB0aGUgdGltZWxpbmUgbG9va2luZyBmb3JcbiAgICAgICAgLy8gdGhhdCBldmVudCwgd2hpbGUga2VlcGluZyB0cmFjayBvZiB0aGUgdXNlcidzIG1lbWJlcnNoaXBcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGxldCB1c2VyTWVtYmVyc2hpcCA9IFwibGVhdmVcIjtcbiAgICAgICAgZm9yIChpID0gZXZlbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZSA9IHJvb20uZ2V0VGltZWxpbmVGb3JFdmVudChldmVudHNbaV0uZ2V0SWQoKSk7XG4gICAgICAgICAgICBpZiAoIXRpbWVsaW5lKSB7XG4gICAgICAgICAgICAgICAgLy8gU29tZWhvdywgaXQgc2VlbXMgdG8gYmUgcG9zc2libGUgZm9yIGxpdmUgZXZlbnRzIHRvIG5vdCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gYSB0aW1lbGluZSwgZXZlbiB0aG91Z2ggdGhhdCBzaG91bGQgbm90IGhhcHBlbi4gOihcbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMjEyMFxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgYEV2ZW50ICR7ZXZlbnRzW2ldLmdldElkKCl9IGluIHJvb20gJHtyb29tLnJvb21JZH0gaXMgbGl2ZSwgYCArXG4gICAgICAgICAgICAgICAgICAgIGBidXQgaXQgZG9lcyBub3QgaGF2ZSBhIHRpbWVsaW5lYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdXNlck1lbWJlcnNoaXBFdmVudCA9XG4gICAgICAgICAgICAgICAgICAgIHRpbWVsaW5lLmdldFN0YXRlKEV2ZW50VGltZWxpbmUuRk9SV0FSRFMpLmdldE1lbWJlcih1c2VySWQpO1xuICAgICAgICAgICAgdXNlck1lbWJlcnNoaXAgPSB1c2VyTWVtYmVyc2hpcEV2ZW50ID8gdXNlck1lbWJlcnNoaXBFdmVudC5tZW1iZXJzaGlwIDogXCJsZWF2ZVwiO1xuICAgICAgICAgICAgY29uc3QgdGltZWxpbmVFdmVudHMgPSB0aW1lbGluZS5nZXRFdmVudHMoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSB0aW1lbGluZUV2ZW50cy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGltZWxpbmVFdmVudHNbal07XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmdldElkKCkgPT09IGV2ZW50c1tpXS5nZXRJZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZ2V0U3RhdGVLZXkoKSA9PT0gdXNlcklkXG4gICAgICAgICAgICAgICAgICAgICYmIGV2ZW50LmdldFR5cGUoKSA9PT0gXCJtLnJvb20ubWVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldkNvbnRlbnQgPSBldmVudC5nZXRQcmV2Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICB1c2VyTWVtYmVyc2hpcCA9IHByZXZDb250ZW50Lm1lbWJlcnNoaXAgfHwgXCJsZWF2ZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IGdvIHRocm91Z2ggdGhlIHJlc3Qgb2YgdGhlIGV2ZW50cyBhbmQgZmluZCB0aGUgZmlyc3QgdW5kZWNyeXB0YWJsZVxuICAgICAgICAvLyBvbmUgdGhhdCB3YXMgc2VudCB3aGVuIHRoZSB1c2VyIHdhc24ndCBpbiB0aGUgcm9vbVxuICAgICAgICBmb3IgKDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gZXZlbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGV2ZW50LmdldFN0YXRlS2V5KCkgPT09IHVzZXJJZFxuICAgICAgICAgICAgICAgICYmIGV2ZW50LmdldFR5cGUoKSA9PT0gXCJtLnJvb20ubWVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2Q29udGVudCA9IGV2ZW50LmdldFByZXZDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgdXNlck1lbWJlcnNoaXAgPSBwcmV2Q29udGVudC5tZW1iZXJzaGlwIHx8IFwibGVhdmVcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodXNlck1lbWJlcnNoaXAgPT09IFwibGVhdmVcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAoZXZlbnQuaXNEZWNyeXB0aW9uRmFpbHVyZSgpIHx8IGV2ZW50LmlzQmVpbmdEZWNyeXB0ZWQoKSkpIHtcbiAgICAgICAgICAgICAgICAvLyByZWFjaGVkIGFuIHVuZGVjcnlwdGFibGUgbWVzc2FnZSB3aGVuIHRoZSB1c2VyIHdhc24ndCBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSByb29tIC0tIGRvbid0IHRyeSB0byBsb2FkIGFueSBtb3JlXG4gICAgICAgICAgICAgICAgLy8gTm90ZTogZm9yIG5vdywgd2UgYXNzdW1lIHRoYXQgZXZlbnRzIHRoYXQgYXJlIGJlaW5nIGRlY3J5cHRlZCBhcmVcbiAgICAgICAgICAgICAgICAvLyBub3QgZGVjcnlwdGFibGVcbiAgICAgICAgICAgICAgICByZXR1cm4gaSArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSxcblxuICAgIF9pbmRleEZvckV2ZW50SWQ6IGZ1bmN0aW9uKGV2SWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN0YXRlLmV2ZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGV2SWQgPT0gdGhpcy5zdGF0ZS5ldmVudHNbaV0uZ2V0SWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICBfZ2V0TGFzdERpc3BsYXllZEV2ZW50SW5kZXg6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIGNvbnN0IGlnbm9yZU93biA9IG9wdHMuaWdub3JlT3duIHx8IGZhbHNlO1xuICAgICAgICBjb25zdCBhbGxvd1BhcnRpYWwgPSBvcHRzLmFsbG93UGFydGlhbCB8fCBmYWxzZTtcblxuICAgICAgICBjb25zdCBtZXNzYWdlUGFuZWwgPSB0aGlzLl9tZXNzYWdlUGFuZWwuY3VycmVudDtcbiAgICAgICAgaWYgKCFtZXNzYWdlUGFuZWwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VQYW5lbE5vZGUgPSBSZWFjdERPTS5maW5kRE9NTm9kZShtZXNzYWdlUGFuZWwpO1xuICAgICAgICBpZiAoIW1lc3NhZ2VQYW5lbE5vZGUpIHJldHVybiBudWxsOyAvLyBzb21ldGltZXMgdGhpcyBoYXBwZW5zIGZvciBmcmVzaCByb29tcy9wb3N0LXN5bmNcbiAgICAgICAgY29uc3Qgd3JhcHBlclJlY3QgPSBtZXNzYWdlUGFuZWxOb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBteVVzZXJJZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWQ7XG5cbiAgICAgICAgY29uc3QgaXNOb2RlSW5WaWV3ID0gKG5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm91bmRpbmdSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoKGFsbG93UGFydGlhbCAmJiBib3VuZGluZ1JlY3QudG9wIDwgd3JhcHBlclJlY3QuYm90dG9tKSB8fFxuICAgICAgICAgICAgICAgICAgICAoIWFsbG93UGFydGlhbCAmJiBib3VuZGluZ1JlY3QuYm90dG9tIDwgd3JhcHBlclJlY3QuYm90dG9tKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gV2Uga2VlcCB0cmFjayBvZiBob3cgbWFueSBvZiB0aGUgYWRqYWNlbnQgZXZlbnRzIGRpZG4ndCBoYXZlIGEgdGlsZVxuICAgICAgICAvLyBidXQgc2hvdWxkIGhhdmUgdGhlIHJlYWQgcmVjZWlwdCBtb3ZlZCBwYXN0IHRoZW0sIHNvXG4gICAgICAgIC8vIHdlIGNhbiBpbmNsdWRlIHRob3NlIG9uY2Ugd2UgZmluZCB0aGUgbGFzdCBkaXNwbGF5ZWQgKHZpc2libGUpIGV2ZW50LlxuICAgICAgICAvLyBUaGUgY291bnRlciBpcyBub3Qgc3RhcnRlZCBmb3IgZXZlbnRzIHdlIGRvbid0IHdhbnRcbiAgICAgICAgLy8gdG8gc2VuZCBhIHJlYWQgcmVjZWlwdCBmb3IgKG91ciBvd24gZXZlbnRzLCBsb2NhbCBlY2hvcykuXG4gICAgICAgIGxldCBhZGphY2VudEludmlzaWJsZUV2ZW50Q291bnQgPSAwO1xuICAgICAgICAvLyBVc2UgYGxpdmVFdmVudHNgIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRoZSByZWFkIG1hcmtlciBvciByZWFkXG4gICAgICAgIC8vIHJlY2VpcHQgdG8gYWR2YW5jZSBpbnRvIHBlbmRpbmcgZXZlbnRzLlxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5zdGF0ZS5saXZlRXZlbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBjb25zdCBldiA9IHRoaXMuc3RhdGUubGl2ZUV2ZW50c1tpXTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG1lc3NhZ2VQYW5lbC5nZXROb2RlRm9yRXZlbnRJZChldi5nZXRJZCgpKTtcbiAgICAgICAgICAgIGNvbnN0IGlzSW5WaWV3ID0gaXNOb2RlSW5WaWV3KG5vZGUpO1xuXG4gICAgICAgICAgICAvLyB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGZpcnN0IHZpc2libGUgZXZlbnQsIGFuZCB0aGUgcHJldmlvdXNcbiAgICAgICAgICAgIC8vIGV2ZW50cyB3ZXJlIGFsbCBpbnZpc2libGUgKHdpdGggdGhlIGZpcnN0IG9uZSBub3QgYmVpbmcgaWdub3JlZCksXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBpbnZpc2libGUgZXZlbnQuXG4gICAgICAgICAgICBpZiAoaXNJblZpZXcgJiYgYWRqYWNlbnRJbnZpc2libGVFdmVudENvdW50ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgKyBhZGphY2VudEludmlzaWJsZUV2ZW50Q291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiAhaXNJblZpZXcpIHtcbiAgICAgICAgICAgICAgICAvLyBoYXMgbm9kZSBidXQgbm90IGluIHZpZXcsIHNvIHJlc2V0IGFkamFjZW50IGludmlzaWJsZSBldmVudHNcbiAgICAgICAgICAgICAgICBhZGphY2VudEludmlzaWJsZUV2ZW50Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzaG91bGRJZ25vcmUgPSAhIWV2LnN0YXR1cyB8fCAvLyBsb2NhbCBlY2hvXG4gICAgICAgICAgICAgICAgKGlnbm9yZU93biAmJiBldi5zZW5kZXIgJiYgZXYuc2VuZGVyLnVzZXJJZCA9PSBteVVzZXJJZCk7ICAgLy8gb3duIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IGlzV2l0aG91dFRpbGUgPSAhaGF2ZVRpbGVGb3JFdmVudChldikgfHwgc2hvdWxkSGlkZUV2ZW50KGV2KTtcblxuICAgICAgICAgICAgaWYgKGlzV2l0aG91dFRpbGUgfHwgIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBkb24ndCBzdGFydCBjb3VudGluZyBpZiB0aGUgZXZlbnQgc2hvdWxkIGJlIGlnbm9yZWQsXG4gICAgICAgICAgICAgICAgLy8gYnV0IGNvbnRpbnVlIGNvdW50aW5nIGlmIHdlIHdlcmUgYWxyZWFkeSBzbyB0aGUgb2Zmc2V0XG4gICAgICAgICAgICAgICAgLy8gdG8gdGhlIHByZXZpb3VzIGludmlzYmxlIGV2ZW50IHRoYXQgZGlkbid0IG5lZWQgdG8gYmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3QgZ2V0IG1lc3NlZCB1cFxuICAgICAgICAgICAgICAgIGlmICghc2hvdWxkSWdub3JlIHx8IChzaG91bGRJZ25vcmUgJiYgYWRqYWNlbnRJbnZpc2libGVFdmVudENvdW50ICE9PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICArK2FkamFjZW50SW52aXNpYmxlRXZlbnRDb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaG91bGRJZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzSW5WaWV3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBpZCBvZiB0aGUgZXZlbnQgY29ycmVzcG9uZGluZyB0byBvdXIgdXNlcidzIGxhdGVzdCByZWFkLXJlY2VpcHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlnbm9yZVN5bnRoZXNpemVkIElmIHRydWUsIHJldHVybiBvbmx5IHJlY2VpcHRzIHRoYXRcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhdmUgYmVlbiBzZW50IGJ5IHRoZSBzZXJ2ZXIsIG5vdFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wbGljaXQgb25lcyBnZW5lcmF0ZWQgYnkgdGhlIEpTXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTREsuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSB0aGUgZXZlbnQgSURcbiAgICAgKi9cbiAgICBfZ2V0Q3VycmVudFJlYWRSZWNlaXB0OiBmdW5jdGlvbihpZ25vcmVTeW50aGVzaXplZCkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIC8vIHRoZSBjbGllbnQgY2FuIGJlIG51bGwgb24gbG9nb3V0XG4gICAgICAgIGlmIChjbGllbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBteVVzZXJJZCA9IGNsaWVudC5jcmVkZW50aWFscy51c2VySWQ7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb20uZ2V0RXZlbnRSZWFkVXBUbyhteVVzZXJJZCwgaWdub3JlU3ludGhlc2l6ZWQpO1xuICAgIH0sXG5cbiAgICBfc2V0UmVhZE1hcmtlcjogZnVuY3Rpb24oZXZlbnRJZCwgZXZlbnRUcywgaW5oaWJpdFNldFN0YXRlKSB7XG4gICAgICAgIGNvbnN0IHJvb21JZCA9IHRoaXMucHJvcHMudGltZWxpbmVTZXQucm9vbS5yb29tSWQ7XG5cbiAgICAgICAgLy8gZG9uJ3QgdXBkYXRlIHRoZSBzdGF0ZSAoYW5kIGNhdXNlIGEgcmUtcmVuZGVyKSBpZiB0aGVyZSBpc1xuICAgICAgICAvLyBubyBjaGFuZ2UgdG8gdGhlIFJNLlxuICAgICAgICBpZiAoZXZlbnRJZCA9PT0gdGhpcy5zdGF0ZS5yZWFkTWFya2VyRXZlbnRJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW4gb3JkZXIgdG8gbGF0ZXIgZmlndXJlIG91dCBpZiB0aGUgcmVhZCBtYXJrZXIgaXNcbiAgICAgICAgLy8gYWJvdmUgb3IgYmVsb3cgdGhlIHZpc2libGUgdGltZWxpbmUsIHdlIHN0YXNoIHRoZSB0aW1lc3RhbXAuXG4gICAgICAgIFRpbWVsaW5lUGFuZWwucm9vbVJlYWRNYXJrZXJUc01hcFtyb29tSWRdID0gZXZlbnRUcztcblxuICAgICAgICBpZiAoaW5oaWJpdFNldFN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyB0aGUgbG9jYWwgZWNobyBvZiB0aGUgUk1cbiAgICAgICAgLy8gcnVuIHRoZSByZW5kZXIgY3ljbGUgYmVmb3JlIGNhbGxpbmcgdGhlIGNhbGxiYWNrLCBzbyB0aGF0XG4gICAgICAgIC8vIGdldFJlYWRNYXJrZXJQb3NpdGlvbigpIHJldHVybnMgdGhlIHJpZ2h0IHRoaW5nLlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHJlYWRNYXJrZXJFdmVudElkOiBldmVudElkLFxuICAgICAgICB9LCB0aGlzLnByb3BzLm9uUmVhZE1hcmtlclVwZGF0ZWQpO1xuICAgIH0sXG5cbiAgICBfc2hvdWxkUGFnaW5hdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBkb24ndCB0cnkgdG8gcGFnaW5hdGUgd2hpbGUgZXZlbnRzIGluIHRoZSB0aW1lbGluZSBhcmVcbiAgICAgICAgLy8gc3RpbGwgYmVpbmcgZGVjcnlwdGVkLiBXZSBkb24ndCByZW5kZXIgZXZlbnRzIHdoaWxlIHRoZXkncmVcbiAgICAgICAgLy8gYmVpbmcgZGVjcnlwdGVkLCBzbyB0aGV5IGRvbid0IHRha2UgdXAgc3BhY2UgaW4gdGhlIHRpbWVsaW5lLlxuICAgICAgICAvLyBUaGlzIG1lYW5zIHdlIGNhbiBwdWxsIHF1aXRlIGEgbG90IG9mIGV2ZW50cyBpbnRvIHRoZSB0aW1lbGluZVxuICAgICAgICAvLyBhbmQgZW5kIHVwIHRyeWluZyB0byByZW5kZXIgYSBsb3Qgb2YgZXZlbnRzLlxuICAgICAgICByZXR1cm4gIXRoaXMuc3RhdGUuZXZlbnRzLnNvbWUoKGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlLmlzQmVpbmdEZWNyeXB0ZWQoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJlbGF0aW9uc0ZvckV2ZW50KC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMudGltZWxpbmVTZXQuZ2V0UmVsYXRpb25zRm9yRXZlbnQoLi4uYXJncyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IE1lc3NhZ2VQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoXCJzdHJ1Y3R1cmVzLk1lc3NhZ2VQYW5lbFwiKTtcbiAgICAgICAgY29uc3QgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG5cbiAgICAgICAgLy8ganVzdCBzaG93IGEgc3Bpbm5lciB3aGlsZSB0aGUgdGltZWxpbmUgbG9hZHMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIHB1dCBpdCBpbiBhIGRpdiBvZiB0aGUgcmlnaHQgY2xhc3MgKG14X1Jvb21WaWV3X21lc3NhZ2VQYW5lbCkgc29cbiAgICAgICAgLy8gdGhhdCB0aGUgb3JkZXIgaW4gdGhlIHJvb212aWV3IGZsZXhib3ggaXMgY29ycmVjdCwgYW5kXG4gICAgICAgIC8vIG14X1Jvb21WaWV3X21lc3NhZ2VMaXN0V3JhcHBlciB0byBwb3NpdGlvbiB0aGUgaW5uZXIgZGl2IGluIHRoZVxuICAgICAgICAvLyByaWdodCBwbGFjZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoZSBjbGljay1vbi1zZWFyY2gtcmVzdWx0IGZ1bmN0aW9uYWxpdHkgcmVsaWVzIG9uIHRoZVxuICAgICAgICAvLyBmYWN0IHRoYXQgdGhlIG1lc3NhZ2VQYW5lbCBpcyBoaWRkZW4gd2hpbGUgdGhlIHRpbWVsaW5lIHJlbG9hZHMsXG4gICAgICAgIC8vIGJ1dCB0aGF0IHRoZSBSb29tSGVhZGVyIChjb21wbGV0ZSB3aXRoIHNlYXJjaCB0ZXJtKSBjb250aW51ZXMgdG9cbiAgICAgICAgLy8gZXhpc3QuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnRpbWVsaW5lTG9hZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X21lc3NhZ2VQYW5lbFNwaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPExvYWRlciAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmV2ZW50cy5sZW5ndGggPT0gMCAmJiAhdGhpcy5zdGF0ZS5jYW5CYWNrUGFnaW5hdGUgJiYgdGhpcy5wcm9wcy5lbXB0eSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17dGhpcy5wcm9wcy5jbGFzc05hbWUgKyBcIiBteF9Sb29tVmlld19tZXNzYWdlTGlzdFdyYXBwZXJcIn0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfZW1wdHlcIj57dGhpcy5wcm9wcy5lbXB0eX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnaXZlIHRoZSBtZXNzYWdlcGFuZWwgYSBzdGlja3lib3R0b20gaWYgd2UncmUgYXQgdGhlIGVuZCBvZiB0aGVcbiAgICAgICAgLy8gbGl2ZSB0aW1lbGluZSwgc28gdGhhdCB0aGUgYXJyaXZhbCBvZiBuZXcgZXZlbnRzIHRyaWdnZXJzIGFcbiAgICAgICAgLy8gc2Nyb2xsLlxuICAgICAgICAvL1xuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBzdGlja3lCb3R0b20gaXMgKmZhbHNlKiBpZiB3ZSBjYW4gcGFnaW5hdGVcbiAgICAgICAgLy8gZm9yd2FyZHMsIG90aGVyd2lzZSBpZiBzb21lYm9keSBoaXRzIHRoZSBib3R0b20gb2YgdGhlIGxvYWRlZFxuICAgICAgICAvLyBldmVudHMgd2hlbiB2aWV3aW5nIGhpc3RvcmljYWwgbWVzc2FnZXMsIHdlIGdldCBzdHVjayBpbiBhIGxvb3BcbiAgICAgICAgLy8gb2YgcGFnaW5hdGluZyBvdXIgd2F5IHRocm91Z2ggdGhlIGVudGlyZSBoaXN0b3J5IG9mIHRoZSByb29tLlxuICAgICAgICBjb25zdCBzdGlja3lCb3R0b20gPSAhdGhpcy5fdGltZWxpbmVXaW5kb3cuY2FuUGFnaW5hdGUoRXZlbnRUaW1lbGluZS5GT1JXQVJEUyk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHN0YXRlIGlzIFBSRVBBUkVEIG9yIENBVENIVVAsIHdlJ3JlIHN0aWxsIHdhaXRpbmcgZm9yIHRoZSBqcy1zZGsgdG8gc3luYyB3aXRoXG4gICAgICAgIC8vIHRoZSBIUyBhbmQgZmV0Y2ggdGhlIGxhdGVzdCBldmVudHMsIHNvIHdlIGFyZSBlZmZlY3RpdmVseSBmb3J3YXJkIHBhZ2luYXRpbmcuXG4gICAgICAgIGNvbnN0IGZvcndhcmRQYWdpbmF0aW5nID0gKFxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5mb3J3YXJkUGFnaW5hdGluZyB8fFxuICAgICAgICAgICAgWydQUkVQQVJFRCcsICdDQVRDSFVQJ10uaW5jbHVkZXModGhpcy5zdGF0ZS5jbGllbnRTeW5jU3RhdGUpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGV2ZW50cyA9IHRoaXMuc3RhdGUuZmlyc3RWaXNpYmxlRXZlbnRJbmRleFxuICAgICAgICAgICAgICA/IHRoaXMuc3RhdGUuZXZlbnRzLnNsaWNlKHRoaXMuc3RhdGUuZmlyc3RWaXNpYmxlRXZlbnRJbmRleClcbiAgICAgICAgICAgICAgOiB0aGlzLnN0YXRlLmV2ZW50cztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxNZXNzYWdlUGFuZWxcbiAgICAgICAgICAgICAgICByZWY9e3RoaXMuX21lc3NhZ2VQYW5lbH1cbiAgICAgICAgICAgICAgICByb29tPXt0aGlzLnByb3BzLnRpbWVsaW5lU2V0LnJvb219XG4gICAgICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvcj17dGhpcy5wcm9wcy5wZXJtYWxpbmtDcmVhdG9yfVxuICAgICAgICAgICAgICAgIGhpZGRlbj17dGhpcy5wcm9wcy5oaWRkZW59XG4gICAgICAgICAgICAgICAgYmFja1BhZ2luYXRpbmc9e3RoaXMuc3RhdGUuYmFja1BhZ2luYXRpbmd9XG4gICAgICAgICAgICAgICAgZm9yd2FyZFBhZ2luYXRpbmc9e2ZvcndhcmRQYWdpbmF0aW5nfVxuICAgICAgICAgICAgICAgIGV2ZW50cz17ZXZlbnRzfVxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkRXZlbnRJZD17dGhpcy5wcm9wcy5oaWdobGlnaHRlZEV2ZW50SWR9XG4gICAgICAgICAgICAgICAgcmVhZE1hcmtlckV2ZW50SWQ9e3RoaXMuc3RhdGUucmVhZE1hcmtlckV2ZW50SWR9XG4gICAgICAgICAgICAgICAgcmVhZE1hcmtlclZpc2libGU9e3RoaXMuc3RhdGUucmVhZE1hcmtlclZpc2libGV9XG4gICAgICAgICAgICAgICAgc3VwcHJlc3NGaXJzdERhdGVTZXBhcmF0b3I9e3RoaXMuc3RhdGUuY2FuQmFja1BhZ2luYXRlfVxuICAgICAgICAgICAgICAgIHNob3dVcmxQcmV2aWV3PXt0aGlzLnByb3BzLnNob3dVcmxQcmV2aWV3fVxuICAgICAgICAgICAgICAgIHNob3dSZWFkUmVjZWlwdHM9e3RoaXMucHJvcHMuc2hvd1JlYWRSZWNlaXB0c31cbiAgICAgICAgICAgICAgICBvdXJVc2VySWQ9e01hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWR9XG4gICAgICAgICAgICAgICAgc3RpY2t5Qm90dG9tPXtzdGlja3lCb3R0b219XG4gICAgICAgICAgICAgICAgb25TY3JvbGw9e3RoaXMub25NZXNzYWdlTGlzdFNjcm9sbH1cbiAgICAgICAgICAgICAgICBvbkZpbGxSZXF1ZXN0PXt0aGlzLm9uTWVzc2FnZUxpc3RGaWxsUmVxdWVzdH1cbiAgICAgICAgICAgICAgICBvblVuZmlsbFJlcXVlc3Q9e3RoaXMub25NZXNzYWdlTGlzdFVuZmlsbFJlcXVlc3R9XG4gICAgICAgICAgICAgICAgaXNUd2VsdmVIb3VyPXt0aGlzLnN0YXRlLmlzVHdlbHZlSG91cn1cbiAgICAgICAgICAgICAgICBhbHdheXNTaG93VGltZXN0YW1wcz17dGhpcy5zdGF0ZS5hbHdheXNTaG93VGltZXN0YW1wc31cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfVxuICAgICAgICAgICAgICAgIHRpbGVTaGFwZT17dGhpcy5wcm9wcy50aWxlU2hhcGV9XG4gICAgICAgICAgICAgICAgcmVzaXplTm90aWZpZXI9e3RoaXMucHJvcHMucmVzaXplTm90aWZpZXJ9XG4gICAgICAgICAgICAgICAgZ2V0UmVsYXRpb25zRm9yRXZlbnQ9e3RoaXMuZ2V0UmVsYXRpb25zRm9yRXZlbnR9XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlPXt0aGlzLnN0YXRlLmVkaXRTdGF0ZX1cbiAgICAgICAgICAgICAgICBzaG93UmVhY3Rpb25zPXt0aGlzLnByb3BzLnNob3dSZWFjdGlvbnN9XG4gICAgICAgICAgICAvPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgVGltZWxpbmVQYW5lbDtcbiJdfQ==