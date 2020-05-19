"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _shouldHideEvent = _interopRequireDefault(require("../../shouldHideEvent"));

var _DateUtils = require("../../DateUtils");

var sdk = _interopRequireWildcard(require("../../index"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _SettingsStore = _interopRequireDefault(require("../../settings/SettingsStore"));

var _languageHandler = require("../../languageHandler");

var _EventTile = require("../views/rooms/EventTile");

var _TextForEvent = require("../../TextForEvent");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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
const CONTINUATION_MAX_INTERVAL = 5 * 60 * 1000; // 5 minutes

const continuedTypes = ['m.sticker', 'm.room.message'];

const isMembershipChange = e => e.getType() === 'm.room.member' || e.getType() === 'm.room.third_party_invite';
/* (almost) stateless UI component which builds the event tiles in the room timeline.
 */


class MessagePanel extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onShowTypingNotificationsChange", () => {
      this.setState({
        showTypingNotifications: _SettingsStore.default.getValue("showTypingNotifications")
      });
    });
    (0, _defineProperty2.default)(this, "_collectGhostReadMarker", node => {
      if (node) {
        // now the element has appeared, change the style which will trigger the CSS transition
        requestAnimationFrame(() => {
          node.style.width = '10%';
          node.style.opacity = '0';
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onGhostTransitionEnd", ev => {
      // we can now clean up the ghost element
      const finishedEventId = ev.target.dataset.eventid;
      this.setState({
        ghostReadMarkers: this.state.ghostReadMarkers.filter(eid => eid !== finishedEventId)
      });
    });
    (0, _defineProperty2.default)(this, "_collectEventNode", (eventId, node) => {
      this.eventNodes[eventId] = node;
    });
    (0, _defineProperty2.default)(this, "_onHeightChanged", () => {
      const scrollPanel = this._scrollPanel.current;

      if (scrollPanel) {
        scrollPanel.checkScroll();
      }
    });
    (0, _defineProperty2.default)(this, "_onTypingShown", () => {
      const scrollPanel = this._scrollPanel.current; // this will make the timeline grow, so checkScroll

      scrollPanel.checkScroll();

      if (scrollPanel && scrollPanel.getScrollState().stuckAtBottom) {
        scrollPanel.preventShrinking();
      }
    });
    (0, _defineProperty2.default)(this, "_onTypingHidden", () => {
      const scrollPanel = this._scrollPanel.current;

      if (scrollPanel) {
        // as hiding the typing notifications doesn't
        // update the scrollPanel, we tell it to apply
        // the shrinking prevention once the typing notifs are hidden
        scrollPanel.updatePreventShrinking(); // order is important here as checkScroll will scroll down to
        // reveal added padding to balance the notifs disappearing.

        scrollPanel.checkScroll();
      }
    });
    this.state = {
      // previous positions the read marker has been in, so we can
      // display 'ghost' read markers that are animating away
      ghostReadMarkers: [],
      showTypingNotifications: _SettingsStore.default.getValue("showTypingNotifications")
    }; // opaque readreceipt info for each userId; used by ReadReceiptMarker
    // to manage its animations

    this._readReceiptMap = {}; // Track read receipts by event ID. For each _shown_ event ID, we store
    // the list of read receipts to display:
    //   [
    //       {
    //           userId: string,
    //           member: RoomMember,
    //           ts: number,
    //       },
    //   ]
    // This is recomputed on each render. It's only stored on the component
    // for ease of passing the data around since it's computed in one pass
    // over all events.

    this._readReceiptsByEvent = {}; // Track read receipts by user ID. For each user ID we've ever shown a
    // a read receipt for, we store an object:
    //   {
    //       lastShownEventId: string,
    //       receipt: {
    //           userId: string,
    //           member: RoomMember,
    //           ts: number,
    //       },
    //   }
    // so that we can always keep receipts displayed by reverting back to
    // the last shown event for that user ID when needed. This may feel like
    // it duplicates the receipt storage in the room, but at this layer, we
    // are tracking _shown_ event IDs, which the JS SDK knows nothing about.
    // This is recomputed on each render, using the data from the previous
    // render as our fallback for any user IDs we can't match a receipt to a
    // displayed event in the current render cycle.

    this._readReceiptsByUserId = {}; // Cache hidden events setting on mount since Settings is expensive to
    // query, and we check this in a hot code path.

    this._showHiddenEventsInTimeline = _SettingsStore.default.getValue("showHiddenEventsInTimeline");
    this._isMounted = false;
    this._readMarkerNode = (0, _react.createRef)();
    this._whoIsTyping = (0, _react.createRef)();
    this._scrollPanel = (0, _react.createRef)();
    this._showTypingNotificationsWatcherRef = _SettingsStore.default.watchSetting("showTypingNotifications", null, this.onShowTypingNotificationsChange);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;

    _SettingsStore.default.unwatchSetting(this._showTypingNotificationsWatcherRef);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.readMarkerVisible && this.props.readMarkerEventId !== prevProps.readMarkerEventId) {
      const ghostReadMarkers = this.state.ghostReadMarkers;
      ghostReadMarkers.push(prevProps.readMarkerEventId);
      this.setState({
        ghostReadMarkers
      });
    }
  }

  /* get the DOM node representing the given event */
  getNodeForEventId(eventId) {
    if (!this.eventNodes) {
      return undefined;
    }

    return this.eventNodes[eventId];
  }
  /* return true if the content is fully scrolled down right now; else false.
   */


  isAtBottom() {
    return this._scrollPanel.current && this._scrollPanel.current.isAtBottom();
  }
  /* get the current scroll state. See ScrollPanel.getScrollState for
   * details.
   *
   * returns null if we are not mounted.
   */


  getScrollState() {
    return this._scrollPanel.current ? this._scrollPanel.current.getScrollState() : null;
  } // returns one of:
  //
  //  null: there is no read marker
  //  -1: read marker is above the window
  //   0: read marker is within the window
  //  +1: read marker is below the window


  getReadMarkerPosition() {
    const readMarker = this._readMarkerNode.current;
    const messageWrapper = this._scrollPanel.current;

    if (!readMarker || !messageWrapper) {
      return null;
    }

    const wrapperRect = _reactDom.default.findDOMNode(messageWrapper).getBoundingClientRect();

    const readMarkerRect = readMarker.getBoundingClientRect(); // the read-marker pretends to have zero height when it is actually
    // two pixels high; +2 here to account for that.

    if (readMarkerRect.bottom + 2 < wrapperRect.top) {
      return -1;
    } else if (readMarkerRect.top < wrapperRect.bottom) {
      return 0;
    } else {
      return 1;
    }
  }
  /* jump to the top of the content.
   */


  scrollToTop() {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.scrollToTop();
    }
  }
  /* jump to the bottom of the content.
   */


  scrollToBottom() {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.scrollToBottom();
    }
  }
  /**
   * Page up/down.
   *
   * @param {number} mult: -1 to page up, +1 to page down
   */


  scrollRelative(mult) {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.scrollRelative(mult);
    }
  }
  /**
   * Scroll up/down in response to a scroll key
   *
   * @param {KeyboardEvent} ev: the keyboard event to handle
   */


  handleScrollKey(ev) {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.handleScrollKey(ev);
    }
  }
  /* jump to the given event id.
   *
   * offsetBase gives the reference point for the pixelOffset. 0 means the
   * top of the container, 1 means the bottom, and fractional values mean
   * somewhere in the middle. If omitted, it defaults to 0.
   *
   * pixelOffset gives the number of pixels *above* the offsetBase that the
   * node (specifically, the bottom of it) will be positioned. If omitted, it
   * defaults to 0.
   */


  scrollToEvent(eventId, pixelOffset, offsetBase) {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.scrollToToken(eventId, pixelOffset, offsetBase);
    }
  }

  scrollToEventIfNeeded(eventId) {
    const node = this.eventNodes[eventId];

    if (node) {
      node.scrollIntoView({
        block: "nearest",
        behavior: "instant"
      });
    }
  }
  /* check the scroll state and send out pagination requests if necessary.
   */


  checkFillState() {
    if (this._scrollPanel.current) {
      this._scrollPanel.current.checkFillState();
    }
  }

  _isUnmounting() {
    return !this._isMounted;
  } // TODO: Implement granular (per-room) hide options


  _shouldShowEvent(mxEv) {
    if (mxEv.sender && _MatrixClientPeg.MatrixClientPeg.get().isUserIgnored(mxEv.sender.userId)) {
      return false; // ignored = no show (only happens if the ignore happens after an event was received)
    }

    if (this._showHiddenEventsInTimeline) {
      return true;
    }

    if (!(0, _EventTile.haveTileForEvent)(mxEv)) {
      return false; // no tile = no show
    } // Always show highlighted event


    if (this.props.highlightedEventId === mxEv.getId()) return true;
    return !(0, _shouldHideEvent.default)(mxEv);
  }

  _readMarkerForEvent(eventId, isLastEvent) {
    const visible = !isLastEvent && this.props.readMarkerVisible;

    if (this.props.readMarkerEventId === eventId) {
      let hr; // if the read marker comes at the end of the timeline (except
      // for local echoes, which are excluded from RMs, because they
      // don't have useful event ids), we don't want to show it, but
      // we still want to create the <li/> for it so that the
      // algorithms which depend on its position on the screen aren't
      // confused.

      if (visible) {
        hr = /*#__PURE__*/_react.default.createElement("hr", {
          className: "mx_RoomView_myReadMarker",
          style: {
            opacity: 1,
            width: '99%'
          }
        });
      }

      return /*#__PURE__*/_react.default.createElement("li", {
        key: "readMarker_" + eventId,
        ref: this._readMarkerNode,
        className: "mx_RoomView_myReadMarker_container"
      }, hr);
    } else if (this.state.ghostReadMarkers.includes(eventId)) {
      // We render 'ghost' read markers in the DOM while they
      // transition away. This allows the actual read marker
      // to be in the right place straight away without having
      // to wait for the transition to finish.
      // There are probably much simpler ways to do this transition,
      // possibly using react-transition-group which handles keeping
      // elements in the DOM whilst they transition out, although our
      // case is a little more complex because only some of the items
      // transition (ie. the read markers do but the event tiles do not)
      // and TransitionGroup requires that all its children are Transitions.
      const hr = /*#__PURE__*/_react.default.createElement("hr", {
        className: "mx_RoomView_myReadMarker",
        ref: this._collectGhostReadMarker,
        onTransitionEnd: this._onGhostTransitionEnd,
        "data-eventid": eventId
      }); // give it a key which depends on the event id. That will ensure that
      // we get a new DOM node (restarting the animation) when the ghost
      // moves to a different event.


      return /*#__PURE__*/_react.default.createElement("li", {
        key: "_readuptoghost_" + eventId,
        className: "mx_RoomView_myReadMarker_container"
      }, hr);
    }

    return null;
  }

  _getEventTiles() {
    this.eventNodes = {};
    let i; // first figure out which is the last event in the list which we're
    // actually going to show; this allows us to behave slightly
    // differently for the last event in the list. (eg show timestamp)
    //
    // we also need to figure out which is the last event we show which isn't
    // a local echo, to manage the read-marker.

    let lastShownEvent;
    let lastShownNonLocalEchoIndex = -1;

    for (i = this.props.events.length - 1; i >= 0; i--) {
      const mxEv = this.props.events[i];

      if (!this._shouldShowEvent(mxEv)) {
        continue;
      }

      if (lastShownEvent === undefined) {
        lastShownEvent = mxEv;
      }

      if (mxEv.status) {
        // this is a local echo
        continue;
      }

      lastShownNonLocalEchoIndex = i;
      break;
    }

    const ret = [];
    let prevEvent = null; // the last event we showed

    this._readReceiptsByEvent = {};

    if (this.props.showReadReceipts) {
      this._readReceiptsByEvent = this._getReadReceiptsByShownEvent();
    }

    let grouper = null;

    for (i = 0; i < this.props.events.length; i++) {
      const mxEv = this.props.events[i];
      const eventId = mxEv.getId();
      const last = mxEv === lastShownEvent;

      if (grouper) {
        if (grouper.shouldGroup(mxEv)) {
          grouper.add(mxEv);
          continue;
        } else {
          // not part of group, so get the group tiles, close the
          // group, and continue like a normal event
          ret.push(...grouper.getTiles());
          prevEvent = grouper.getNewPrevEvent();
          grouper = null;
        }
      }

      for (const Grouper of groupers) {
        if (Grouper.canStartGroup(this, mxEv)) {
          grouper = new Grouper(this, mxEv, prevEvent, lastShownEvent);
        }
      }

      if (!grouper) {
        const wantTile = this._shouldShowEvent(mxEv);

        if (wantTile) {
          // make sure we unpack the array returned by _getTilesForEvent,
          // otherwise react will auto-generate keys and we will end up
          // replacing all of the DOM elements every time we paginate.
          ret.push(...this._getTilesForEvent(prevEvent, mxEv, last));
          prevEvent = mxEv;
        }

        const readMarker = this._readMarkerForEvent(eventId, i >= lastShownNonLocalEchoIndex);

        if (readMarker) ret.push(readMarker);
      }
    }

    if (grouper) {
      ret.push(...grouper.getTiles());
    }

    return ret;
  }

  _getTilesForEvent(prevEvent, mxEv, last) {
    const TileErrorBoundary = sdk.getComponent('messages.TileErrorBoundary');
    const EventTile = sdk.getComponent('rooms.EventTile');
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const ret = [];
    const isEditing = this.props.editState && this.props.editState.getEvent().getId() === mxEv.getId(); // is this a continuation of the previous message?

    let continuation = false; // Some events should appear as continuations from previous events of
    // different types.

    const eventTypeContinues = prevEvent !== null && continuedTypes.includes(mxEv.getType()) && continuedTypes.includes(prevEvent.getType()); // if there is a previous event and it has the same sender as this event
    // and the types are the same/is in continuedTypes and the time between them is <= CONTINUATION_MAX_INTERVAL

    if (prevEvent !== null && prevEvent.sender && mxEv.sender && mxEv.sender.userId === prevEvent.sender.userId && // if we don't have tile for previous event then it was shown by showHiddenEvents and has no SenderProfile
    (0, _EventTile.haveTileForEvent)(prevEvent) && (mxEv.getType() === prevEvent.getType() || eventTypeContinues) && mxEv.getTs() - prevEvent.getTs() <= CONTINUATION_MAX_INTERVAL) {
      continuation = true;
    }
    /*
            // Work out if this is still a continuation, as we are now showing commands
            // and /me messages with their own little avatar. The case of a change of
            // event type (commands) is handled above, but we need to handle the /me
            // messages seperately as they have a msgtype of 'm.emote' but are classed
            // as normal messages
            if (prevEvent !== null && prevEvent.sender && mxEv.sender
                    && mxEv.sender.userId === prevEvent.sender.userId
                    && mxEv.getType() == prevEvent.getType()
                    && prevEvent.getContent().msgtype === 'm.emote') {
                continuation = false;
            }
    */
    // local echoes have a fake date, which could even be yesterday. Treat them
    // as 'today' for the date separators.


    let ts1 = mxEv.getTs();
    let eventDate = mxEv.getDate();

    if (mxEv.status) {
      eventDate = new Date();
      ts1 = eventDate.getTime();
    } // do we need a date separator since the last event?


    if (this._wantsDateSeparator(prevEvent, eventDate)) {
      const dateSeparator = /*#__PURE__*/_react.default.createElement("li", {
        key: ts1
      }, /*#__PURE__*/_react.default.createElement(DateSeparator, {
        key: ts1,
        ts: ts1
      }));

      ret.push(dateSeparator);
      continuation = false;
    }

    const eventId = mxEv.getId();
    const highlight = eventId === this.props.highlightedEventId; // we can't use local echoes as scroll tokens, because their event IDs change.
    // Local echos have a send "status".

    const scrollToken = mxEv.status ? undefined : eventId;
    const readReceipts = this._readReceiptsByEvent[eventId]; // Dev note: `this._isUnmounting.bind(this)` is important - it ensures that
    // the function is run in the context of this class and not EventTile, therefore
    // ensuring the right `this._mounted` variable is used by read receipts (which
    // don't update their position if we, the MessagePanel, is unmounting).

    ret.push( /*#__PURE__*/_react.default.createElement("li", {
      key: eventId,
      ref: this._collectEventNode.bind(this, eventId),
      "data-scroll-tokens": scrollToken
    }, /*#__PURE__*/_react.default.createElement(TileErrorBoundary, {
      mxEvent: mxEv
    }, /*#__PURE__*/_react.default.createElement(EventTile, {
      mxEvent: mxEv,
      continuation: continuation,
      isRedacted: mxEv.isRedacted(),
      replacingEventId: mxEv.replacingEventId(),
      editState: isEditing && this.props.editState,
      onHeightChanged: this._onHeightChanged,
      readReceipts: readReceipts,
      readReceiptMap: this._readReceiptMap,
      showUrlPreview: this.props.showUrlPreview,
      checkUnmounting: this._isUnmounting.bind(this),
      eventSendStatus: mxEv.getAssociatedStatus(),
      tileShape: this.props.tileShape,
      isTwelveHour: this.props.isTwelveHour,
      permalinkCreator: this.props.permalinkCreator,
      last: last,
      isSelectedEvent: highlight,
      getRelationsForEvent: this.props.getRelationsForEvent,
      showReactions: this.props.showReactions
    }))));
    return ret;
  }

  _wantsDateSeparator(prevEvent, nextEventDate) {
    if (prevEvent == null) {
      // first event in the panel: depends if we could back-paginate from
      // here.
      return !this.props.suppressFirstDateSeparator;
    }

    return (0, _DateUtils.wantsDateSeparator)(prevEvent.getDate(), nextEventDate);
  } // Get a list of read receipts that should be shown next to this event
  // Receipts are objects which have a 'userId', 'roomMember' and 'ts'.


  _getReadReceiptsForEvent(event) {
    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId; // get list of read receipts, sorted most recent first


    const {
      room
    } = this.props;

    if (!room) {
      return null;
    }

    const receipts = [];
    room.getReceiptsForEvent(event).forEach(r => {
      if (!r.userId || r.type !== "m.read" || r.userId === myUserId) {
        return; // ignore non-read receipts and receipts from self.
      }

      if (_MatrixClientPeg.MatrixClientPeg.get().isUserIgnored(r.userId)) {
        return; // ignore ignored users
      }

      const member = room.getMember(r.userId);
      receipts.push({
        userId: r.userId,
        roomMember: member,
        ts: r.data ? r.data.ts : 0
      });
    });
    return receipts;
  } // Get an object that maps from event ID to a list of read receipts that
  // should be shown next to that event. If a hidden event has read receipts,
  // they are folded into the receipts of the last shown event.


  _getReadReceiptsByShownEvent() {
    const receiptsByEvent = {};
    const receiptsByUserId = {};
    let lastShownEventId;

    for (const event of this.props.events) {
      if (this._shouldShowEvent(event)) {
        lastShownEventId = event.getId();
      }

      if (!lastShownEventId) {
        continue;
      }

      const existingReceipts = receiptsByEvent[lastShownEventId] || [];

      const newReceipts = this._getReadReceiptsForEvent(event);

      receiptsByEvent[lastShownEventId] = existingReceipts.concat(newReceipts); // Record these receipts along with their last shown event ID for
      // each associated user ID.

      for (const receipt of newReceipts) {
        receiptsByUserId[receipt.userId] = {
          lastShownEventId,
          receipt
        };
      }
    } // It's possible in some cases (for example, when a read receipt
    // advances before we have paginated in the new event that it's marking
    // received) that we can temporarily not have a matching event for
    // someone which had one in the last. By looking through our previous
    // mapping of receipts by user ID, we can cover recover any receipts
    // that would have been lost by using the same event ID from last time.


    for (const userId in this._readReceiptsByUserId) {
      if (receiptsByUserId[userId]) {
        continue;
      }

      const {
        lastShownEventId,
        receipt
      } = this._readReceiptsByUserId[userId];
      const existingReceipts = receiptsByEvent[lastShownEventId] || [];
      receiptsByEvent[lastShownEventId] = existingReceipts.concat(receipt);
      receiptsByUserId[userId] = {
        lastShownEventId,
        receipt
      };
    }

    this._readReceiptsByUserId = receiptsByUserId; // After grouping receipts by shown events, do another pass to sort each
    // receipt list.

    for (const eventId in receiptsByEvent) {
      receiptsByEvent[eventId].sort((r1, r2) => {
        return r2.ts - r1.ts;
      });
    }

    return receiptsByEvent;
  }

  updateTimelineMinHeight() {
    const scrollPanel = this._scrollPanel.current;

    if (scrollPanel) {
      const isAtBottom = scrollPanel.isAtBottom();
      const whoIsTyping = this._whoIsTyping.current;
      const isTypingVisible = whoIsTyping && whoIsTyping.isVisible(); // when messages get added to the timeline,
      // but somebody else is still typing,
      // update the min-height, so once the last
      // person stops typing, no jumping occurs

      if (isAtBottom && isTypingVisible) {
        scrollPanel.preventShrinking();
      }
    }
  }

  onTimelineReset() {
    const scrollPanel = this._scrollPanel.current;

    if (scrollPanel) {
      scrollPanel.clearPreventShrinking();
    }
  }

  render() {
    const ErrorBoundary = sdk.getComponent('elements.ErrorBoundary');
    const ScrollPanel = sdk.getComponent("structures.ScrollPanel");
    const WhoIsTypingTile = sdk.getComponent("rooms.WhoIsTypingTile");
    const Spinner = sdk.getComponent("elements.Spinner");
    let topSpinner;
    let bottomSpinner;

    if (this.props.backPaginating) {
      topSpinner = /*#__PURE__*/_react.default.createElement("li", {
        key: "_topSpinner"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null));
    }

    if (this.props.forwardPaginating) {
      bottomSpinner = /*#__PURE__*/_react.default.createElement("li", {
        key: "_bottomSpinner"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null));
    }

    const style = this.props.hidden ? {
      display: 'none'
    } : {};
    const className = (0, _classnames.default)(this.props.className, {
      "mx_MessagePanel_alwaysShowTimestamps": this.props.alwaysShowTimestamps
    });
    let whoIsTyping;

    if (this.props.room && !this.props.tileShape && this.state.showTypingNotifications) {
      whoIsTyping = /*#__PURE__*/_react.default.createElement(WhoIsTypingTile, {
        room: this.props.room,
        onShown: this._onTypingShown,
        onHidden: this._onTypingHidden,
        ref: this._whoIsTyping
      });
    }

    return /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(ScrollPanel, {
      ref: this._scrollPanel,
      className: className,
      onScroll: this.props.onScroll,
      onResize: this.onResize,
      onFillRequest: this.props.onFillRequest,
      onUnfillRequest: this.props.onUnfillRequest,
      style: style,
      stickyBottom: this.props.stickyBottom,
      resizeNotifier: this.props.resizeNotifier
    }, topSpinner, this._getEventTiles(), whoIsTyping, bottomSpinner));
  }

}
/* Grouper classes determine when events can be grouped together in a summary.
 * Groupers should have the following methods:
 * - canStartGroup (static): determines if a new group should be started with the
 *   given event
 * - shouldGroup: determines if the given event should be added to an existing group
 * - add: adds an event to an existing group (should only be called if shouldGroup
 *   return true)
 * - getTiles: returns the tiles that represent the group
 * - getNewPrevEvent: returns the event that should be used as the new prevEvent
 *   when determining things such as whether a date separator is necessary
 */
// Wrap initial room creation events into an EventListSummary
// Grouping only events sent by the same user that sent the `m.room.create` and only until
// the first non-state event or membership event which is not regarding the sender of the `m.room.create` event


exports.default = MessagePanel;
(0, _defineProperty2.default)(MessagePanel, "propTypes", {
  // true to give the component a 'display: none' style.
  hidden: _propTypes.default.bool,
  // true to show a spinner at the top of the timeline to indicate
  // back-pagination in progress
  backPaginating: _propTypes.default.bool,
  // true to show a spinner at the end of the timeline to indicate
  // forward-pagination in progress
  forwardPaginating: _propTypes.default.bool,
  // the list of MatrixEvents to display
  events: _propTypes.default.array.isRequired,
  // ID of an event to highlight. If undefined, no event will be highlighted.
  highlightedEventId: _propTypes.default.string,
  // The room these events are all in together, if any.
  // (The notification panel won't have a room here, for example.)
  room: _propTypes.default.object,
  // Should we show URL Previews
  showUrlPreview: _propTypes.default.bool,
  // event after which we should show a read marker
  readMarkerEventId: _propTypes.default.string,
  // whether the read marker should be visible
  readMarkerVisible: _propTypes.default.bool,
  // the userid of our user. This is used to suppress the read marker
  // for pending messages.
  ourUserId: _propTypes.default.string,
  // true to suppress the date at the start of the timeline
  suppressFirstDateSeparator: _propTypes.default.bool,
  // whether to show read receipts
  showReadReceipts: _propTypes.default.bool,
  // true if updates to the event list should cause the scroll panel to
  // scroll down when we are at the bottom of the window. See ScrollPanel
  // for more details.
  stickyBottom: _propTypes.default.bool,
  // callback which is called when the panel is scrolled.
  onScroll: _propTypes.default.func,
  // callback which is called when more content is needed.
  onFillRequest: _propTypes.default.func,
  // className for the panel
  className: _propTypes.default.string.isRequired,
  // shape parameter to be passed to EventTiles
  tileShape: _propTypes.default.string,
  // show twelve hour timestamps
  isTwelveHour: _propTypes.default.bool,
  // show timestamps always
  alwaysShowTimestamps: _propTypes.default.bool,
  // helper function to access relations for an event
  getRelationsForEvent: _propTypes.default.func,
  // whether to show reactions for an event
  showReactions: _propTypes.default.bool
});

class CreationGrouper {
  constructor(panel, createEvent, prevEvent, lastShownEvent) {
    this.panel = panel;
    this.createEvent = createEvent;
    this.prevEvent = prevEvent;
    this.lastShownEvent = lastShownEvent;
    this.events = []; // events that we include in the group but then eject out and place
    // above the group.

    this.ejectedEvents = [];
    this.readMarker = panel._readMarkerForEvent(createEvent.getId(), createEvent === lastShownEvent);
  }

  shouldGroup(ev) {
    const panel = this.panel;
    const createEvent = this.createEvent;

    if (!panel._shouldShowEvent(ev)) {
      return true;
    }

    if (panel._wantsDateSeparator(this.createEvent, ev.getDate())) {
      return false;
    }

    if (ev.getType() === "m.room.member" && (ev.getStateKey() !== createEvent.getSender() || ev.getContent()["membership"] !== "join")) {
      return false;
    }

    if (ev.isState() && ev.getSender() === createEvent.getSender()) {
      return true;
    }

    return false;
  }

  add(ev) {
    const panel = this.panel;
    this.readMarker = this.readMarker || panel._readMarkerForEvent(ev.getId(), ev === this.lastShownEvent);

    if (!panel._shouldShowEvent(ev)) {
      return;
    }

    if (ev.getType() === "m.room.encryption") {
      this.ejectedEvents.push(ev);
    } else {
      this.events.push(ev);
    }
  }

  getTiles() {
    // If we don't have any events to group, don't even try to group them. The logic
    // below assumes that we have a group of events to deal with, but we might not if
    // the events we were supposed to group were redacted.
    if (!this.events || !this.events.length) return [];
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const EventListSummary = sdk.getComponent('views.elements.EventListSummary');
    const panel = this.panel;
    const ret = [];
    const createEvent = this.createEvent;
    const lastShownEvent = this.lastShownEvent;

    if (panel._wantsDateSeparator(this.prevEvent, createEvent.getDate())) {
      const ts = createEvent.getTs();
      ret.push( /*#__PURE__*/_react.default.createElement("li", {
        key: ts + '~'
      }, /*#__PURE__*/_react.default.createElement(DateSeparator, {
        key: ts + '~',
        ts: ts
      })));
    } // If this m.room.create event should be shown (room upgrade) then show it before the summary


    if (panel._shouldShowEvent(createEvent)) {
      // pass in the createEvent as prevEvent as well so no extra DateSeparator is rendered
      ret.push(...panel._getTilesForEvent(createEvent, createEvent, false));
    }

    for (const ejected of this.ejectedEvents) {
      ret.push(...panel._getTilesForEvent(createEvent, ejected, createEvent === lastShownEvent));
    }

    const eventTiles = this.events.map(e => {
      // In order to prevent DateSeparators from appearing in the expanded form
      // of EventListSummary, render each member event as if the previous
      // one was itself. This way, the timestamp of the previous event === the
      // timestamp of the current event, and no DateSeparator is inserted.
      return panel._getTilesForEvent(e, e, e === lastShownEvent);
    }).reduce((a, b) => a.concat(b), []); // Get sender profile from the latest event in the summary as the m.room.create doesn't contain one

    const ev = this.events[this.events.length - 1];
    ret.push( /*#__PURE__*/_react.default.createElement(EventListSummary, {
      key: "roomcreationsummary",
      events: this.events,
      onToggle: panel._onHeightChanged // Update scroll state
      ,
      summaryMembers: [ev.sender],
      summaryText: (0, _languageHandler._t)("%(creator)s created and configured the room.", {
        creator: ev.sender ? ev.sender.name : ev.getSender()
      })
    }, eventTiles));

    if (this.readMarker) {
      ret.push(this.readMarker);
    }

    return ret;
  }

  getNewPrevEvent() {
    return this.createEvent;
  }

} // Wrap consecutive member events in a ListSummary, ignore if redacted


(0, _defineProperty2.default)(CreationGrouper, "canStartGroup", function (panel, ev) {
  return ev.getType() === "m.room.create";
});

class MemberGrouper {
  constructor(panel, ev, prevEvent, lastShownEvent) {
    this.panel = panel;
    this.readMarker = panel._readMarkerForEvent(ev.getId(), ev === lastShownEvent);
    this.events = [ev];
    this.prevEvent = prevEvent;
    this.lastShownEvent = lastShownEvent;
  }

  shouldGroup(ev) {
    if (this.panel._wantsDateSeparator(this.events[0], ev.getDate())) {
      return false;
    }

    return isMembershipChange(ev);
  }

  add(ev) {
    if (ev.getType() === 'm.room.member') {
      // We'll just double check that it's worth our time to do so, through an
      // ugly hack. If textForEvent returns something, we should group it for
      // rendering but if it doesn't then we'll exclude it.
      const renderText = (0, _TextForEvent.textForEvent)(ev);
      if (!renderText || renderText.trim().length === 0) return; // quietly ignore
    }

    this.readMarker = this.readMarker || this.panel._readMarkerForEvent(ev.getId(), ev === this.lastShownEvent);
    this.events.push(ev);
  }

  getTiles() {
    // If we don't have any events to group, don't even try to group them. The logic
    // below assumes that we have a group of events to deal with, but we might not if
    // the events we were supposed to group were redacted.
    if (!this.events || !this.events.length) return [];
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const MemberEventListSummary = sdk.getComponent('views.elements.MemberEventListSummary');
    const panel = this.panel;
    const lastShownEvent = this.lastShownEvent;
    const ret = [];

    if (panel._wantsDateSeparator(this.prevEvent, this.events[0].getDate())) {
      const ts = this.events[0].getTs();
      ret.push( /*#__PURE__*/_react.default.createElement("li", {
        key: ts + '~'
      }, /*#__PURE__*/_react.default.createElement(DateSeparator, {
        key: ts + '~',
        ts: ts
      })));
    } // Ensure that the key of the MemberEventListSummary does not change with new
    // member events. This will prevent it from being re-created unnecessarily, and
    // instead will allow new props to be provided. In turn, the shouldComponentUpdate
    // method on MELS can be used to prevent unnecessary renderings.
    //
    // Whilst back-paginating with a MELS at the top of the panel, prevEvent will be null,
    // so use the key "membereventlistsummary-initial". Otherwise, use the ID of the first
    // membership event, which will not change during forward pagination.


    const key = "membereventlistsummary-" + (this.prevEvent ? this.events[0].getId() : "initial");
    let highlightInMels;
    let eventTiles = this.events.map(e => {
      if (e.getId() === panel.props.highlightedEventId) {
        highlightInMels = true;
      } // In order to prevent DateSeparators from appearing in the expanded form
      // of MemberEventListSummary, render each member event as if the previous
      // one was itself. This way, the timestamp of the previous event === the
      // timestamp of the current event, and no DateSeparator is inserted.


      return panel._getTilesForEvent(e, e, e === lastShownEvent);
    }).reduce((a, b) => a.concat(b), []);

    if (eventTiles.length === 0) {
      eventTiles = null;
    }

    ret.push( /*#__PURE__*/_react.default.createElement(MemberEventListSummary, {
      key: key,
      events: this.events,
      onToggle: panel._onHeightChanged // Update scroll state
      ,
      startExpanded: highlightInMels
    }, eventTiles));

    if (this.readMarker) {
      ret.push(this.readMarker);
    }

    return ret;
  }

  getNewPrevEvent() {
    return this.events[0];
  }

} // all the grouper classes that we use


(0, _defineProperty2.default)(MemberGrouper, "canStartGroup", function (panel, ev) {
  return panel._shouldShowEvent(ev) && isMembershipChange(ev);
});
const groupers = [CreationGrouper, MemberGrouper];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvTWVzc2FnZVBhbmVsLmpzIl0sIm5hbWVzIjpbIkNPTlRJTlVBVElPTl9NQVhfSU5URVJWQUwiLCJjb250aW51ZWRUeXBlcyIsImlzTWVtYmVyc2hpcENoYW5nZSIsImUiLCJnZXRUeXBlIiwiTWVzc2FnZVBhbmVsIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInNldFN0YXRlIiwic2hvd1R5cGluZ05vdGlmaWNhdGlvbnMiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJub2RlIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwic3R5bGUiLCJ3aWR0aCIsIm9wYWNpdHkiLCJldiIsImZpbmlzaGVkRXZlbnRJZCIsInRhcmdldCIsImRhdGFzZXQiLCJldmVudGlkIiwiZ2hvc3RSZWFkTWFya2VycyIsInN0YXRlIiwiZmlsdGVyIiwiZWlkIiwiZXZlbnRJZCIsImV2ZW50Tm9kZXMiLCJzY3JvbGxQYW5lbCIsIl9zY3JvbGxQYW5lbCIsImN1cnJlbnQiLCJjaGVja1Njcm9sbCIsImdldFNjcm9sbFN0YXRlIiwic3R1Y2tBdEJvdHRvbSIsInByZXZlbnRTaHJpbmtpbmciLCJ1cGRhdGVQcmV2ZW50U2hyaW5raW5nIiwiX3JlYWRSZWNlaXB0TWFwIiwiX3JlYWRSZWNlaXB0c0J5RXZlbnQiLCJfcmVhZFJlY2VpcHRzQnlVc2VySWQiLCJfc2hvd0hpZGRlbkV2ZW50c0luVGltZWxpbmUiLCJfaXNNb3VudGVkIiwiX3JlYWRNYXJrZXJOb2RlIiwiX3dob0lzVHlwaW5nIiwiX3Nob3dUeXBpbmdOb3RpZmljYXRpb25zV2F0Y2hlclJlZiIsIndhdGNoU2V0dGluZyIsIm9uU2hvd1R5cGluZ05vdGlmaWNhdGlvbnNDaGFuZ2UiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwidW53YXRjaFNldHRpbmciLCJjb21wb25lbnREaWRVcGRhdGUiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJyZWFkTWFya2VyVmlzaWJsZSIsInByb3BzIiwicmVhZE1hcmtlckV2ZW50SWQiLCJwdXNoIiwiZ2V0Tm9kZUZvckV2ZW50SWQiLCJ1bmRlZmluZWQiLCJpc0F0Qm90dG9tIiwiZ2V0UmVhZE1hcmtlclBvc2l0aW9uIiwicmVhZE1hcmtlciIsIm1lc3NhZ2VXcmFwcGVyIiwid3JhcHBlclJlY3QiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicmVhZE1hcmtlclJlY3QiLCJib3R0b20iLCJ0b3AiLCJzY3JvbGxUb1RvcCIsInNjcm9sbFRvQm90dG9tIiwic2Nyb2xsUmVsYXRpdmUiLCJtdWx0IiwiaGFuZGxlU2Nyb2xsS2V5Iiwic2Nyb2xsVG9FdmVudCIsInBpeGVsT2Zmc2V0Iiwib2Zmc2V0QmFzZSIsInNjcm9sbFRvVG9rZW4iLCJzY3JvbGxUb0V2ZW50SWZOZWVkZWQiLCJzY3JvbGxJbnRvVmlldyIsImJsb2NrIiwiYmVoYXZpb3IiLCJjaGVja0ZpbGxTdGF0ZSIsIl9pc1VubW91bnRpbmciLCJfc2hvdWxkU2hvd0V2ZW50IiwibXhFdiIsInNlbmRlciIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzVXNlcklnbm9yZWQiLCJ1c2VySWQiLCJoaWdobGlnaHRlZEV2ZW50SWQiLCJnZXRJZCIsIl9yZWFkTWFya2VyRm9yRXZlbnQiLCJpc0xhc3RFdmVudCIsInZpc2libGUiLCJociIsImluY2x1ZGVzIiwiX2NvbGxlY3RHaG9zdFJlYWRNYXJrZXIiLCJfb25HaG9zdFRyYW5zaXRpb25FbmQiLCJfZ2V0RXZlbnRUaWxlcyIsImkiLCJsYXN0U2hvd25FdmVudCIsImxhc3RTaG93bk5vbkxvY2FsRWNob0luZGV4IiwiZXZlbnRzIiwibGVuZ3RoIiwic3RhdHVzIiwicmV0IiwicHJldkV2ZW50Iiwic2hvd1JlYWRSZWNlaXB0cyIsIl9nZXRSZWFkUmVjZWlwdHNCeVNob3duRXZlbnQiLCJncm91cGVyIiwibGFzdCIsInNob3VsZEdyb3VwIiwiYWRkIiwiZ2V0VGlsZXMiLCJnZXROZXdQcmV2RXZlbnQiLCJHcm91cGVyIiwiZ3JvdXBlcnMiLCJjYW5TdGFydEdyb3VwIiwid2FudFRpbGUiLCJfZ2V0VGlsZXNGb3JFdmVudCIsIlRpbGVFcnJvckJvdW5kYXJ5Iiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRXZlbnRUaWxlIiwiRGF0ZVNlcGFyYXRvciIsImlzRWRpdGluZyIsImVkaXRTdGF0ZSIsImdldEV2ZW50IiwiY29udGludWF0aW9uIiwiZXZlbnRUeXBlQ29udGludWVzIiwiZ2V0VHMiLCJ0czEiLCJldmVudERhdGUiLCJnZXREYXRlIiwiRGF0ZSIsImdldFRpbWUiLCJfd2FudHNEYXRlU2VwYXJhdG9yIiwiZGF0ZVNlcGFyYXRvciIsImhpZ2hsaWdodCIsInNjcm9sbFRva2VuIiwicmVhZFJlY2VpcHRzIiwiX2NvbGxlY3RFdmVudE5vZGUiLCJiaW5kIiwiaXNSZWRhY3RlZCIsInJlcGxhY2luZ0V2ZW50SWQiLCJfb25IZWlnaHRDaGFuZ2VkIiwic2hvd1VybFByZXZpZXciLCJnZXRBc3NvY2lhdGVkU3RhdHVzIiwidGlsZVNoYXBlIiwiaXNUd2VsdmVIb3VyIiwicGVybWFsaW5rQ3JlYXRvciIsImdldFJlbGF0aW9uc0ZvckV2ZW50Iiwic2hvd1JlYWN0aW9ucyIsIm5leHRFdmVudERhdGUiLCJzdXBwcmVzc0ZpcnN0RGF0ZVNlcGFyYXRvciIsIl9nZXRSZWFkUmVjZWlwdHNGb3JFdmVudCIsImV2ZW50IiwibXlVc2VySWQiLCJjcmVkZW50aWFscyIsInJvb20iLCJyZWNlaXB0cyIsImdldFJlY2VpcHRzRm9yRXZlbnQiLCJmb3JFYWNoIiwiciIsInR5cGUiLCJtZW1iZXIiLCJnZXRNZW1iZXIiLCJyb29tTWVtYmVyIiwidHMiLCJkYXRhIiwicmVjZWlwdHNCeUV2ZW50IiwicmVjZWlwdHNCeVVzZXJJZCIsImxhc3RTaG93bkV2ZW50SWQiLCJleGlzdGluZ1JlY2VpcHRzIiwibmV3UmVjZWlwdHMiLCJjb25jYXQiLCJyZWNlaXB0Iiwic29ydCIsInIxIiwicjIiLCJ1cGRhdGVUaW1lbGluZU1pbkhlaWdodCIsIndob0lzVHlwaW5nIiwiaXNUeXBpbmdWaXNpYmxlIiwiaXNWaXNpYmxlIiwib25UaW1lbGluZVJlc2V0IiwiY2xlYXJQcmV2ZW50U2hyaW5raW5nIiwicmVuZGVyIiwiRXJyb3JCb3VuZGFyeSIsIlNjcm9sbFBhbmVsIiwiV2hvSXNUeXBpbmdUaWxlIiwiU3Bpbm5lciIsInRvcFNwaW5uZXIiLCJib3R0b21TcGlubmVyIiwiYmFja1BhZ2luYXRpbmciLCJmb3J3YXJkUGFnaW5hdGluZyIsImhpZGRlbiIsImRpc3BsYXkiLCJjbGFzc05hbWUiLCJhbHdheXNTaG93VGltZXN0YW1wcyIsIl9vblR5cGluZ1Nob3duIiwiX29uVHlwaW5nSGlkZGVuIiwib25TY3JvbGwiLCJvblJlc2l6ZSIsIm9uRmlsbFJlcXVlc3QiLCJvblVuZmlsbFJlcXVlc3QiLCJzdGlja3lCb3R0b20iLCJyZXNpemVOb3RpZmllciIsIlByb3BUeXBlcyIsImJvb2wiLCJhcnJheSIsImlzUmVxdWlyZWQiLCJzdHJpbmciLCJvYmplY3QiLCJvdXJVc2VySWQiLCJmdW5jIiwiQ3JlYXRpb25Hcm91cGVyIiwicGFuZWwiLCJjcmVhdGVFdmVudCIsImVqZWN0ZWRFdmVudHMiLCJnZXRTdGF0ZUtleSIsImdldFNlbmRlciIsImdldENvbnRlbnQiLCJpc1N0YXRlIiwiRXZlbnRMaXN0U3VtbWFyeSIsImVqZWN0ZWQiLCJldmVudFRpbGVzIiwibWFwIiwicmVkdWNlIiwiYSIsImIiLCJjcmVhdG9yIiwibmFtZSIsIk1lbWJlckdyb3VwZXIiLCJyZW5kZXJUZXh0IiwidHJpbSIsIk1lbWJlckV2ZW50TGlzdFN1bW1hcnkiLCJrZXkiLCJoaWdobGlnaHRJbk1lbHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBOUJBOzs7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S0ssVUFBZDtBQUNIOztBQUVELFdBQU8rQyxHQUFQO0FBQ0g7O0FBRURTLEVBQUFBLGVBQWUsR0FBRztBQUNkLFdBQU8sS0FBS1osTUFBTCxDQUFZLENBQVosQ0FBUDtBQUNIOztBQXpHZSxDLENBNEdwQjs7OzhCQTVHTWtJLGEsbUJBQ3FCLFVBQVNoQixLQUFULEVBQWdCek0sRUFBaEIsRUFBb0I7QUFDdkMsU0FBT3lNLEtBQUssQ0FBQ3RJLGdCQUFOLENBQXVCbkUsRUFBdkIsS0FBOEJoQixrQkFBa0IsQ0FBQ2dCLEVBQUQsQ0FBdkQ7QUFDSCxDO0FBMEdMLE1BQU1xRyxRQUFRLEdBQUcsQ0FBQ21HLGVBQUQsRUFBa0JpQixhQUFsQixDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBzaG91bGRIaWRlRXZlbnQgZnJvbSAnLi4vLi4vc2hvdWxkSGlkZUV2ZW50JztcbmltcG9ydCB7d2FudHNEYXRlU2VwYXJhdG9yfSBmcm9tICcuLi8uLi9EYXRlVXRpbHMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uL2luZGV4JztcblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tICcuLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCB7aGF2ZVRpbGVGb3JFdmVudH0gZnJvbSBcIi4uL3ZpZXdzL3Jvb21zL0V2ZW50VGlsZVwiO1xuaW1wb3J0IHt0ZXh0Rm9yRXZlbnR9IGZyb20gXCIuLi8uLi9UZXh0Rm9yRXZlbnRcIjtcblxuY29uc3QgQ09OVElOVUFUSU9OX01BWF9JTlRFUlZBTCA9IDUgKiA2MCAqIDEwMDA7IC8vIDUgbWludXRlc1xuY29uc3QgY29udGludWVkVHlwZXMgPSBbJ20uc3RpY2tlcicsICdtLnJvb20ubWVzc2FnZSddO1xuXG5jb25zdCBpc01lbWJlcnNoaXBDaGFuZ2UgPSAoZSkgPT4gZS5nZXRUeXBlKCkgPT09ICdtLnJvb20ubWVtYmVyJyB8fCBlLmdldFR5cGUoKSA9PT0gJ20ucm9vbS50aGlyZF9wYXJ0eV9pbnZpdGUnO1xuXG4vKiAoYWxtb3N0KSBzdGF0ZWxlc3MgVUkgY29tcG9uZW50IHdoaWNoIGJ1aWxkcyB0aGUgZXZlbnQgdGlsZXMgaW4gdGhlIHJvb20gdGltZWxpbmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lc3NhZ2VQYW5lbCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gdHJ1ZSB0byBnaXZlIHRoZSBjb21wb25lbnQgYSAnZGlzcGxheTogbm9uZScgc3R5bGUuXG4gICAgICAgIGhpZGRlbjogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gdHJ1ZSB0byBzaG93IGEgc3Bpbm5lciBhdCB0aGUgdG9wIG9mIHRoZSB0aW1lbGluZSB0byBpbmRpY2F0ZVxuICAgICAgICAvLyBiYWNrLXBhZ2luYXRpb24gaW4gcHJvZ3Jlc3NcbiAgICAgICAgYmFja1BhZ2luYXRpbmc6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8vIHRydWUgdG8gc2hvdyBhIHNwaW5uZXIgYXQgdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUgdG8gaW5kaWNhdGVcbiAgICAgICAgLy8gZm9yd2FyZC1wYWdpbmF0aW9uIGluIHByb2dyZXNzXG4gICAgICAgIGZvcndhcmRQYWdpbmF0aW5nOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyB0aGUgbGlzdCBvZiBNYXRyaXhFdmVudHMgdG8gZGlzcGxheVxuICAgICAgICBldmVudHM6IFByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIElEIG9mIGFuIGV2ZW50IHRvIGhpZ2hsaWdodC4gSWYgdW5kZWZpbmVkLCBubyBldmVudCB3aWxsIGJlIGhpZ2hsaWdodGVkLlxuICAgICAgICBoaWdobGlnaHRlZEV2ZW50SWQ6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gVGhlIHJvb20gdGhlc2UgZXZlbnRzIGFyZSBhbGwgaW4gdG9nZXRoZXIsIGlmIGFueS5cbiAgICAgICAgLy8gKFRoZSBub3RpZmljYXRpb24gcGFuZWwgd29uJ3QgaGF2ZSBhIHJvb20gaGVyZSwgZm9yIGV4YW1wbGUuKVxuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LFxuXG4gICAgICAgIC8vIFNob3VsZCB3ZSBzaG93IFVSTCBQcmV2aWV3c1xuICAgICAgICBzaG93VXJsUHJldmlldzogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gZXZlbnQgYWZ0ZXIgd2hpY2ggd2Ugc2hvdWxkIHNob3cgYSByZWFkIG1hcmtlclxuICAgICAgICByZWFkTWFya2VyRXZlbnRJZDogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyB3aGV0aGVyIHRoZSByZWFkIG1hcmtlciBzaG91bGQgYmUgdmlzaWJsZVxuICAgICAgICByZWFkTWFya2VyVmlzaWJsZTogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gdGhlIHVzZXJpZCBvZiBvdXIgdXNlci4gVGhpcyBpcyB1c2VkIHRvIHN1cHByZXNzIHRoZSByZWFkIG1hcmtlclxuICAgICAgICAvLyBmb3IgcGVuZGluZyBtZXNzYWdlcy5cbiAgICAgICAgb3VyVXNlcklkOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIHRydWUgdG8gc3VwcHJlc3MgdGhlIGRhdGUgYXQgdGhlIHN0YXJ0IG9mIHRoZSB0aW1lbGluZVxuICAgICAgICBzdXBwcmVzc0ZpcnN0RGF0ZVNlcGFyYXRvcjogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gd2hldGhlciB0byBzaG93IHJlYWQgcmVjZWlwdHNcbiAgICAgICAgc2hvd1JlYWRSZWNlaXB0czogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gdHJ1ZSBpZiB1cGRhdGVzIHRvIHRoZSBldmVudCBsaXN0IHNob3VsZCBjYXVzZSB0aGUgc2Nyb2xsIHBhbmVsIHRvXG4gICAgICAgIC8vIHNjcm9sbCBkb3duIHdoZW4gd2UgYXJlIGF0IHRoZSBib3R0b20gb2YgdGhlIHdpbmRvdy4gU2VlIFNjcm9sbFBhbmVsXG4gICAgICAgIC8vIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICAgIHN0aWNreUJvdHRvbTogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIHBhbmVsIGlzIHNjcm9sbGVkLlxuICAgICAgICBvblNjcm9sbDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgd2hpY2ggaXMgY2FsbGVkIHdoZW4gbW9yZSBjb250ZW50IGlzIG5lZWRlZC5cbiAgICAgICAgb25GaWxsUmVxdWVzdDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gY2xhc3NOYW1lIGZvciB0aGUgcGFuZWxcbiAgICAgICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gc2hhcGUgcGFyYW1ldGVyIHRvIGJlIHBhc3NlZCB0byBFdmVudFRpbGVzXG4gICAgICAgIHRpbGVTaGFwZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBzaG93IHR3ZWx2ZSBob3VyIHRpbWVzdGFtcHNcbiAgICAgICAgaXNUd2VsdmVIb3VyOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBzaG93IHRpbWVzdGFtcHMgYWx3YXlzXG4gICAgICAgIGFsd2F5c1Nob3dUaW1lc3RhbXBzOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBoZWxwZXIgZnVuY3Rpb24gdG8gYWNjZXNzIHJlbGF0aW9ucyBmb3IgYW4gZXZlbnRcbiAgICAgICAgZ2V0UmVsYXRpb25zRm9yRXZlbnQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIHdoZXRoZXIgdG8gc2hvdyByZWFjdGlvbnMgZm9yIGFuIGV2ZW50XG4gICAgICAgIHNob3dSZWFjdGlvbnM6IFByb3BUeXBlcy5ib29sLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgLy8gcHJldmlvdXMgcG9zaXRpb25zIHRoZSByZWFkIG1hcmtlciBoYXMgYmVlbiBpbiwgc28gd2UgY2FuXG4gICAgICAgICAgICAvLyBkaXNwbGF5ICdnaG9zdCcgcmVhZCBtYXJrZXJzIHRoYXQgYXJlIGFuaW1hdGluZyBhd2F5XG4gICAgICAgICAgICBnaG9zdFJlYWRNYXJrZXJzOiBbXSxcbiAgICAgICAgICAgIHNob3dUeXBpbmdOb3RpZmljYXRpb25zOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd1R5cGluZ05vdGlmaWNhdGlvbnNcIiksXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gb3BhcXVlIHJlYWRyZWNlaXB0IGluZm8gZm9yIGVhY2ggdXNlcklkOyB1c2VkIGJ5IFJlYWRSZWNlaXB0TWFya2VyXG4gICAgICAgIC8vIHRvIG1hbmFnZSBpdHMgYW5pbWF0aW9uc1xuICAgICAgICB0aGlzLl9yZWFkUmVjZWlwdE1hcCA9IHt9O1xuXG4gICAgICAgIC8vIFRyYWNrIHJlYWQgcmVjZWlwdHMgYnkgZXZlbnQgSUQuIEZvciBlYWNoIF9zaG93bl8gZXZlbnQgSUQsIHdlIHN0b3JlXG4gICAgICAgIC8vIHRoZSBsaXN0IG9mIHJlYWQgcmVjZWlwdHMgdG8gZGlzcGxheTpcbiAgICAgICAgLy8gICBbXG4gICAgICAgIC8vICAgICAgIHtcbiAgICAgICAgLy8gICAgICAgICAgIHVzZXJJZDogc3RyaW5nLFxuICAgICAgICAvLyAgICAgICAgICAgbWVtYmVyOiBSb29tTWVtYmVyLFxuICAgICAgICAvLyAgICAgICAgICAgdHM6IG51bWJlcixcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICBdXG4gICAgICAgIC8vIFRoaXMgaXMgcmVjb21wdXRlZCBvbiBlYWNoIHJlbmRlci4gSXQncyBvbmx5IHN0b3JlZCBvbiB0aGUgY29tcG9uZW50XG4gICAgICAgIC8vIGZvciBlYXNlIG9mIHBhc3NpbmcgdGhlIGRhdGEgYXJvdW5kIHNpbmNlIGl0J3MgY29tcHV0ZWQgaW4gb25lIHBhc3NcbiAgICAgICAgLy8gb3ZlciBhbGwgZXZlbnRzLlxuICAgICAgICB0aGlzLl9yZWFkUmVjZWlwdHNCeUV2ZW50ID0ge307XG5cbiAgICAgICAgLy8gVHJhY2sgcmVhZCByZWNlaXB0cyBieSB1c2VyIElELiBGb3IgZWFjaCB1c2VyIElEIHdlJ3ZlIGV2ZXIgc2hvd24gYVxuICAgICAgICAvLyBhIHJlYWQgcmVjZWlwdCBmb3IsIHdlIHN0b3JlIGFuIG9iamVjdDpcbiAgICAgICAgLy8gICB7XG4gICAgICAgIC8vICAgICAgIGxhc3RTaG93bkV2ZW50SWQ6IHN0cmluZyxcbiAgICAgICAgLy8gICAgICAgcmVjZWlwdDoge1xuICAgICAgICAvLyAgICAgICAgICAgdXNlcklkOiBzdHJpbmcsXG4gICAgICAgIC8vICAgICAgICAgICBtZW1iZXI6IFJvb21NZW1iZXIsXG4gICAgICAgIC8vICAgICAgICAgICB0czogbnVtYmVyLFxuICAgICAgICAvLyAgICAgICB9LFxuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gc28gdGhhdCB3ZSBjYW4gYWx3YXlzIGtlZXAgcmVjZWlwdHMgZGlzcGxheWVkIGJ5IHJldmVydGluZyBiYWNrIHRvXG4gICAgICAgIC8vIHRoZSBsYXN0IHNob3duIGV2ZW50IGZvciB0aGF0IHVzZXIgSUQgd2hlbiBuZWVkZWQuIFRoaXMgbWF5IGZlZWwgbGlrZVxuICAgICAgICAvLyBpdCBkdXBsaWNhdGVzIHRoZSByZWNlaXB0IHN0b3JhZ2UgaW4gdGhlIHJvb20sIGJ1dCBhdCB0aGlzIGxheWVyLCB3ZVxuICAgICAgICAvLyBhcmUgdHJhY2tpbmcgX3Nob3duXyBldmVudCBJRHMsIHdoaWNoIHRoZSBKUyBTREsga25vd3Mgbm90aGluZyBhYm91dC5cbiAgICAgICAgLy8gVGhpcyBpcyByZWNvbXB1dGVkIG9uIGVhY2ggcmVuZGVyLCB1c2luZyB0aGUgZGF0YSBmcm9tIHRoZSBwcmV2aW91c1xuICAgICAgICAvLyByZW5kZXIgYXMgb3VyIGZhbGxiYWNrIGZvciBhbnkgdXNlciBJRHMgd2UgY2FuJ3QgbWF0Y2ggYSByZWNlaXB0IHRvIGFcbiAgICAgICAgLy8gZGlzcGxheWVkIGV2ZW50IGluIHRoZSBjdXJyZW50IHJlbmRlciBjeWNsZS5cbiAgICAgICAgdGhpcy5fcmVhZFJlY2VpcHRzQnlVc2VySWQgPSB7fTtcblxuICAgICAgICAvLyBDYWNoZSBoaWRkZW4gZXZlbnRzIHNldHRpbmcgb24gbW91bnQgc2luY2UgU2V0dGluZ3MgaXMgZXhwZW5zaXZlIHRvXG4gICAgICAgIC8vIHF1ZXJ5LCBhbmQgd2UgY2hlY2sgdGhpcyBpbiBhIGhvdCBjb2RlIHBhdGguXG4gICAgICAgIHRoaXMuX3Nob3dIaWRkZW5FdmVudHNJblRpbWVsaW5lID1cbiAgICAgICAgICAgIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93SGlkZGVuRXZlbnRzSW5UaW1lbGluZVwiKTtcblxuICAgICAgICB0aGlzLl9pc01vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9yZWFkTWFya2VyTm9kZSA9IGNyZWF0ZVJlZigpO1xuICAgICAgICB0aGlzLl93aG9Jc1R5cGluZyA9IGNyZWF0ZVJlZigpO1xuICAgICAgICB0aGlzLl9zY3JvbGxQYW5lbCA9IGNyZWF0ZVJlZigpO1xuXG4gICAgICAgIHRoaXMuX3Nob3dUeXBpbmdOb3RpZmljYXRpb25zV2F0Y2hlclJlZiA9XG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLndhdGNoU2V0dGluZyhcInNob3dUeXBpbmdOb3RpZmljYXRpb25zXCIsIG51bGwsIHRoaXMub25TaG93VHlwaW5nTm90aWZpY2F0aW9uc0NoYW5nZSk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMuX2lzTW91bnRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMuX2lzTW91bnRlZCA9IGZhbHNlO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnVud2F0Y2hTZXR0aW5nKHRoaXMuX3Nob3dUeXBpbmdOb3RpZmljYXRpb25zV2F0Y2hlclJlZik7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgICAgIGlmIChwcmV2UHJvcHMucmVhZE1hcmtlclZpc2libGUgJiYgdGhpcy5wcm9wcy5yZWFkTWFya2VyRXZlbnRJZCAhPT0gcHJldlByb3BzLnJlYWRNYXJrZXJFdmVudElkKSB7XG4gICAgICAgICAgICBjb25zdCBnaG9zdFJlYWRNYXJrZXJzID0gdGhpcy5zdGF0ZS5naG9zdFJlYWRNYXJrZXJzO1xuICAgICAgICAgICAgZ2hvc3RSZWFkTWFya2Vycy5wdXNoKHByZXZQcm9wcy5yZWFkTWFya2VyRXZlbnRJZCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBnaG9zdFJlYWRNYXJrZXJzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblNob3dUeXBpbmdOb3RpZmljYXRpb25zQ2hhbmdlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNob3dUeXBpbmdOb3RpZmljYXRpb25zOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd1R5cGluZ05vdGlmaWNhdGlvbnNcIiksXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKiBnZXQgdGhlIERPTSBub2RlIHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gZXZlbnQgKi9cbiAgICBnZXROb2RlRm9yRXZlbnRJZChldmVudElkKSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudE5vZGVzKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnROb2Rlc1tldmVudElkXTtcbiAgICB9XG5cbiAgICAvKiByZXR1cm4gdHJ1ZSBpZiB0aGUgY29udGVudCBpcyBmdWxseSBzY3JvbGxlZCBkb3duIHJpZ2h0IG5vdzsgZWxzZSBmYWxzZS5cbiAgICAgKi9cbiAgICBpc0F0Qm90dG9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudCAmJiB0aGlzLl9zY3JvbGxQYW5lbC5jdXJyZW50LmlzQXRCb3R0b20oKTtcbiAgICB9XG5cbiAgICAvKiBnZXQgdGhlIGN1cnJlbnQgc2Nyb2xsIHN0YXRlLiBTZWUgU2Nyb2xsUGFuZWwuZ2V0U2Nyb2xsU3RhdGUgZm9yXG4gICAgICogZGV0YWlscy5cbiAgICAgKlxuICAgICAqIHJldHVybnMgbnVsbCBpZiB3ZSBhcmUgbm90IG1vdW50ZWQuXG4gICAgICovXG4gICAgZ2V0U2Nyb2xsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY3JvbGxQYW5lbC5jdXJyZW50ID8gdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudC5nZXRTY3JvbGxTdGF0ZSgpIDogbnVsbDtcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIG9uZSBvZjpcbiAgICAvL1xuICAgIC8vICBudWxsOiB0aGVyZSBpcyBubyByZWFkIG1hcmtlclxuICAgIC8vICAtMTogcmVhZCBtYXJrZXIgaXMgYWJvdmUgdGhlIHdpbmRvd1xuICAgIC8vICAgMDogcmVhZCBtYXJrZXIgaXMgd2l0aGluIHRoZSB3aW5kb3dcbiAgICAvLyAgKzE6IHJlYWQgbWFya2VyIGlzIGJlbG93IHRoZSB3aW5kb3dcbiAgICBnZXRSZWFkTWFya2VyUG9zaXRpb24oKSB7XG4gICAgICAgIGNvbnN0IHJlYWRNYXJrZXIgPSB0aGlzLl9yZWFkTWFya2VyTm9kZS5jdXJyZW50O1xuICAgICAgICBjb25zdCBtZXNzYWdlV3JhcHBlciA9IHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQ7XG5cbiAgICAgICAgaWYgKCFyZWFkTWFya2VyIHx8ICFtZXNzYWdlV3JhcHBlcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3cmFwcGVyUmVjdCA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKG1lc3NhZ2VXcmFwcGVyKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgcmVhZE1hcmtlclJlY3QgPSByZWFkTWFya2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIC8vIHRoZSByZWFkLW1hcmtlciBwcmV0ZW5kcyB0byBoYXZlIHplcm8gaGVpZ2h0IHdoZW4gaXQgaXMgYWN0dWFsbHlcbiAgICAgICAgLy8gdHdvIHBpeGVscyBoaWdoOyArMiBoZXJlIHRvIGFjY291bnQgZm9yIHRoYXQuXG4gICAgICAgIGlmIChyZWFkTWFya2VyUmVjdC5ib3R0b20gKyAyIDwgd3JhcHBlclJlY3QudG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAocmVhZE1hcmtlclJlY3QudG9wIDwgd3JhcHBlclJlY3QuYm90dG9tKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoganVtcCB0byB0aGUgdG9wIG9mIHRoZSBjb250ZW50LlxuICAgICAqL1xuICAgIHNjcm9sbFRvVG9wKCkge1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudC5zY3JvbGxUb1RvcCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoganVtcCB0byB0aGUgYm90dG9tIG9mIHRoZSBjb250ZW50LlxuICAgICAqL1xuICAgIHNjcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudC5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFnZSB1cC9kb3duLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG11bHQ6IC0xIHRvIHBhZ2UgdXAsICsxIHRvIHBhZ2UgZG93blxuICAgICAqL1xuICAgIHNjcm9sbFJlbGF0aXZlKG11bHQpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQuc2Nyb2xsUmVsYXRpdmUobXVsdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGwgdXAvZG93biBpbiByZXNwb25zZSB0byBhIHNjcm9sbCBrZXlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXY6IHRoZSBrZXlib2FyZCBldmVudCB0byBoYW5kbGVcbiAgICAgKi9cbiAgICBoYW5kbGVTY3JvbGxLZXkoZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQuaGFuZGxlU2Nyb2xsS2V5KGV2KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qIGp1bXAgdG8gdGhlIGdpdmVuIGV2ZW50IGlkLlxuICAgICAqXG4gICAgICogb2Zmc2V0QmFzZSBnaXZlcyB0aGUgcmVmZXJlbmNlIHBvaW50IGZvciB0aGUgcGl4ZWxPZmZzZXQuIDAgbWVhbnMgdGhlXG4gICAgICogdG9wIG9mIHRoZSBjb250YWluZXIsIDEgbWVhbnMgdGhlIGJvdHRvbSwgYW5kIGZyYWN0aW9uYWwgdmFsdWVzIG1lYW5cbiAgICAgKiBzb21ld2hlcmUgaW4gdGhlIG1pZGRsZS4gSWYgb21pdHRlZCwgaXQgZGVmYXVsdHMgdG8gMC5cbiAgICAgKlxuICAgICAqIHBpeGVsT2Zmc2V0IGdpdmVzIHRoZSBudW1iZXIgb2YgcGl4ZWxzICphYm92ZSogdGhlIG9mZnNldEJhc2UgdGhhdCB0aGVcbiAgICAgKiBub2RlIChzcGVjaWZpY2FsbHksIHRoZSBib3R0b20gb2YgaXQpIHdpbGwgYmUgcG9zaXRpb25lZC4gSWYgb21pdHRlZCwgaXRcbiAgICAgKiBkZWZhdWx0cyB0byAwLlxuICAgICAqL1xuICAgIHNjcm9sbFRvRXZlbnQoZXZlbnRJZCwgcGl4ZWxPZmZzZXQsIG9mZnNldEJhc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQuc2Nyb2xsVG9Ub2tlbihldmVudElkLCBwaXhlbE9mZnNldCwgb2Zmc2V0QmFzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzY3JvbGxUb0V2ZW50SWZOZWVkZWQoZXZlbnRJZCkge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ldmVudE5vZGVzW2V2ZW50SWRdO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbm9kZS5zY3JvbGxJbnRvVmlldyh7YmxvY2s6IFwibmVhcmVzdFwiLCBiZWhhdmlvcjogXCJpbnN0YW50XCJ9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qIGNoZWNrIHRoZSBzY3JvbGwgc3RhdGUgYW5kIHNlbmQgb3V0IHBhZ2luYXRpb24gcmVxdWVzdHMgaWYgbmVjZXNzYXJ5LlxuICAgICAqL1xuICAgIGNoZWNrRmlsbFN0YXRlKCkge1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudC5jaGVja0ZpbGxTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2lzVW5tb3VudGluZygpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLl9pc01vdW50ZWQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogSW1wbGVtZW50IGdyYW51bGFyIChwZXItcm9vbSkgaGlkZSBvcHRpb25zXG4gICAgX3Nob3VsZFNob3dFdmVudChteEV2KSB7XG4gICAgICAgIGlmIChteEV2LnNlbmRlciAmJiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNVc2VySWdub3JlZChteEV2LnNlbmRlci51c2VySWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGlnbm9yZWQgPSBubyBzaG93IChvbmx5IGhhcHBlbnMgaWYgdGhlIGlnbm9yZSBoYXBwZW5zIGFmdGVyIGFuIGV2ZW50IHdhcyByZWNlaXZlZClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9zaG93SGlkZGVuRXZlbnRzSW5UaW1lbGluZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhhdmVUaWxlRm9yRXZlbnQobXhFdikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gdGlsZSA9IG5vIHNob3dcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsd2F5cyBzaG93IGhpZ2hsaWdodGVkIGV2ZW50XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmhpZ2hsaWdodGVkRXZlbnRJZCA9PT0gbXhFdi5nZXRJZCgpKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gIXNob3VsZEhpZGVFdmVudChteEV2KTtcbiAgICB9XG5cbiAgICBfcmVhZE1hcmtlckZvckV2ZW50KGV2ZW50SWQsIGlzTGFzdEV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHZpc2libGUgPSAhaXNMYXN0RXZlbnQgJiYgdGhpcy5wcm9wcy5yZWFkTWFya2VyVmlzaWJsZTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5yZWFkTWFya2VyRXZlbnRJZCA9PT0gZXZlbnRJZCkge1xuICAgICAgICAgICAgbGV0IGhyO1xuICAgICAgICAgICAgLy8gaWYgdGhlIHJlYWQgbWFya2VyIGNvbWVzIGF0IHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lIChleGNlcHRcbiAgICAgICAgICAgIC8vIGZvciBsb2NhbCBlY2hvZXMsIHdoaWNoIGFyZSBleGNsdWRlZCBmcm9tIFJNcywgYmVjYXVzZSB0aGV5XG4gICAgICAgICAgICAvLyBkb24ndCBoYXZlIHVzZWZ1bCBldmVudCBpZHMpLCB3ZSBkb24ndCB3YW50IHRvIHNob3cgaXQsIGJ1dFxuICAgICAgICAgICAgLy8gd2Ugc3RpbGwgd2FudCB0byBjcmVhdGUgdGhlIDxsaS8+IGZvciBpdCBzbyB0aGF0IHRoZVxuICAgICAgICAgICAgLy8gYWxnb3JpdGhtcyB3aGljaCBkZXBlbmQgb24gaXRzIHBvc2l0aW9uIG9uIHRoZSBzY3JlZW4gYXJlbid0XG4gICAgICAgICAgICAvLyBjb25mdXNlZC5cbiAgICAgICAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgaHIgPSA8aHIgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfbXlSZWFkTWFya2VyXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tvcGFjaXR5OiAxLCB3aWR0aDogJzk5JSd9fVxuICAgICAgICAgICAgICAgIC8+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxsaSBrZXk9e1wicmVhZE1hcmtlcl9cIitldmVudElkfSByZWY9e3RoaXMuX3JlYWRNYXJrZXJOb2RlfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X215UmVhZE1hcmtlcl9jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBociB9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5naG9zdFJlYWRNYXJrZXJzLmluY2x1ZGVzKGV2ZW50SWQpKSB7XG4gICAgICAgICAgICAvLyBXZSByZW5kZXIgJ2dob3N0JyByZWFkIG1hcmtlcnMgaW4gdGhlIERPTSB3aGlsZSB0aGV5XG4gICAgICAgICAgICAvLyB0cmFuc2l0aW9uIGF3YXkuIFRoaXMgYWxsb3dzIHRoZSBhY3R1YWwgcmVhZCBtYXJrZXJcbiAgICAgICAgICAgIC8vIHRvIGJlIGluIHRoZSByaWdodCBwbGFjZSBzdHJhaWdodCBhd2F5IHdpdGhvdXQgaGF2aW5nXG4gICAgICAgICAgICAvLyB0byB3YWl0IGZvciB0aGUgdHJhbnNpdGlvbiB0byBmaW5pc2guXG4gICAgICAgICAgICAvLyBUaGVyZSBhcmUgcHJvYmFibHkgbXVjaCBzaW1wbGVyIHdheXMgdG8gZG8gdGhpcyB0cmFuc2l0aW9uLFxuICAgICAgICAgICAgLy8gcG9zc2libHkgdXNpbmcgcmVhY3QtdHJhbnNpdGlvbi1ncm91cCB3aGljaCBoYW5kbGVzIGtlZXBpbmdcbiAgICAgICAgICAgIC8vIGVsZW1lbnRzIGluIHRoZSBET00gd2hpbHN0IHRoZXkgdHJhbnNpdGlvbiBvdXQsIGFsdGhvdWdoIG91clxuICAgICAgICAgICAgLy8gY2FzZSBpcyBhIGxpdHRsZSBtb3JlIGNvbXBsZXggYmVjYXVzZSBvbmx5IHNvbWUgb2YgdGhlIGl0ZW1zXG4gICAgICAgICAgICAvLyB0cmFuc2l0aW9uIChpZS4gdGhlIHJlYWQgbWFya2VycyBkbyBidXQgdGhlIGV2ZW50IHRpbGVzIGRvIG5vdClcbiAgICAgICAgICAgIC8vIGFuZCBUcmFuc2l0aW9uR3JvdXAgcmVxdWlyZXMgdGhhdCBhbGwgaXRzIGNoaWxkcmVuIGFyZSBUcmFuc2l0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IGhyID0gPGhyIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X215UmVhZE1hcmtlclwiXG4gICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9jb2xsZWN0R2hvc3RSZWFkTWFya2VyfVxuICAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD17dGhpcy5fb25HaG9zdFRyYW5zaXRpb25FbmR9XG4gICAgICAgICAgICAgICAgZGF0YS1ldmVudGlkPXtldmVudElkfVxuICAgICAgICAgICAgLz47XG5cbiAgICAgICAgICAgIC8vIGdpdmUgaXQgYSBrZXkgd2hpY2ggZGVwZW5kcyBvbiB0aGUgZXZlbnQgaWQuIFRoYXQgd2lsbCBlbnN1cmUgdGhhdFxuICAgICAgICAgICAgLy8gd2UgZ2V0IGEgbmV3IERPTSBub2RlIChyZXN0YXJ0aW5nIHRoZSBhbmltYXRpb24pIHdoZW4gdGhlIGdob3N0XG4gICAgICAgICAgICAvLyBtb3ZlcyB0byBhIGRpZmZlcmVudCBldmVudC5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGxpIGtleT17XCJfcmVhZHVwdG9naG9zdF9cIitldmVudElkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X215UmVhZE1hcmtlcl9jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBociB9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBfY29sbGVjdEdob3N0UmVhZE1hcmtlciA9IChub2RlKSA9PiB7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAvLyBub3cgdGhlIGVsZW1lbnQgaGFzIGFwcGVhcmVkLCBjaGFuZ2UgdGhlIHN0eWxlIHdoaWNoIHdpbGwgdHJpZ2dlciB0aGUgQ1NTIHRyYW5zaXRpb25cbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9ICcxMCUnO1xuICAgICAgICAgICAgICAgIG5vZGUuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vbkdob3N0VHJhbnNpdGlvbkVuZCA9IChldikgPT4ge1xuICAgICAgICAvLyB3ZSBjYW4gbm93IGNsZWFuIHVwIHRoZSBnaG9zdCBlbGVtZW50XG4gICAgICAgIGNvbnN0IGZpbmlzaGVkRXZlbnRJZCA9IGV2LnRhcmdldC5kYXRhc2V0LmV2ZW50aWQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZ2hvc3RSZWFkTWFya2VyczogdGhpcy5zdGF0ZS5naG9zdFJlYWRNYXJrZXJzLmZpbHRlcihlaWQgPT4gZWlkICE9PSBmaW5pc2hlZEV2ZW50SWQpLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX2dldEV2ZW50VGlsZXMoKSB7XG4gICAgICAgIHRoaXMuZXZlbnROb2RlcyA9IHt9O1xuXG4gICAgICAgIGxldCBpO1xuXG4gICAgICAgIC8vIGZpcnN0IGZpZ3VyZSBvdXQgd2hpY2ggaXMgdGhlIGxhc3QgZXZlbnQgaW4gdGhlIGxpc3Qgd2hpY2ggd2UncmVcbiAgICAgICAgLy8gYWN0dWFsbHkgZ29pbmcgdG8gc2hvdzsgdGhpcyBhbGxvd3MgdXMgdG8gYmVoYXZlIHNsaWdodGx5XG4gICAgICAgIC8vIGRpZmZlcmVudGx5IGZvciB0aGUgbGFzdCBldmVudCBpbiB0aGUgbGlzdC4gKGVnIHNob3cgdGltZXN0YW1wKVxuICAgICAgICAvL1xuICAgICAgICAvLyB3ZSBhbHNvIG5lZWQgdG8gZmlndXJlIG91dCB3aGljaCBpcyB0aGUgbGFzdCBldmVudCB3ZSBzaG93IHdoaWNoIGlzbid0XG4gICAgICAgIC8vIGEgbG9jYWwgZWNobywgdG8gbWFuYWdlIHRoZSByZWFkLW1hcmtlci5cbiAgICAgICAgbGV0IGxhc3RTaG93bkV2ZW50O1xuXG4gICAgICAgIGxldCBsYXN0U2hvd25Ob25Mb2NhbEVjaG9JbmRleCA9IC0xO1xuICAgICAgICBmb3IgKGkgPSB0aGlzLnByb3BzLmV2ZW50cy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IG14RXYgPSB0aGlzLnByb3BzLmV2ZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fc2hvdWxkU2hvd0V2ZW50KG14RXYpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsYXN0U2hvd25FdmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNob3duRXZlbnQgPSBteEV2O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobXhFdi5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGEgbG9jYWwgZWNob1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsYXN0U2hvd25Ob25Mb2NhbEVjaG9JbmRleCA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJldCA9IFtdO1xuXG4gICAgICAgIGxldCBwcmV2RXZlbnQgPSBudWxsOyAvLyB0aGUgbGFzdCBldmVudCB3ZSBzaG93ZWRcblxuICAgICAgICB0aGlzLl9yZWFkUmVjZWlwdHNCeUV2ZW50ID0ge307XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNob3dSZWFkUmVjZWlwdHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWRSZWNlaXB0c0J5RXZlbnQgPSB0aGlzLl9nZXRSZWFkUmVjZWlwdHNCeVNob3duRXZlbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBncm91cGVyID0gbnVsbDtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5wcm9wcy5ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG14RXYgPSB0aGlzLnByb3BzLmV2ZW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50SWQgPSBteEV2LmdldElkKCk7XG4gICAgICAgICAgICBjb25zdCBsYXN0ID0gKG14RXYgPT09IGxhc3RTaG93bkV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKGdyb3VwZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXBlci5zaG91bGRHcm91cChteEV2KSkge1xuICAgICAgICAgICAgICAgICAgICBncm91cGVyLmFkZChteEV2KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90IHBhcnQgb2YgZ3JvdXAsIHNvIGdldCB0aGUgZ3JvdXAgdGlsZXMsIGNsb3NlIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBncm91cCwgYW5kIGNvbnRpbnVlIGxpa2UgYSBub3JtYWwgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goLi4uZ3JvdXBlci5nZXRUaWxlcygpKTtcbiAgICAgICAgICAgICAgICAgICAgcHJldkV2ZW50ID0gZ3JvdXBlci5nZXROZXdQcmV2RXZlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IEdyb3VwZXIgb2YgZ3JvdXBlcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoR3JvdXBlci5jYW5TdGFydEdyb3VwKHRoaXMsIG14RXYpKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwZXIgPSBuZXcgR3JvdXBlcih0aGlzLCBteEV2LCBwcmV2RXZlbnQsIGxhc3RTaG93bkV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWdyb3VwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YW50VGlsZSA9IHRoaXMuX3Nob3VsZFNob3dFdmVudChteEV2KTtcbiAgICAgICAgICAgICAgICBpZiAod2FudFRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIHVucGFjayB0aGUgYXJyYXkgcmV0dXJuZWQgYnkgX2dldFRpbGVzRm9yRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSByZWFjdCB3aWxsIGF1dG8tZ2VuZXJhdGUga2V5cyBhbmQgd2Ugd2lsbCBlbmQgdXBcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjaW5nIGFsbCBvZiB0aGUgRE9NIGVsZW1lbnRzIGV2ZXJ5IHRpbWUgd2UgcGFnaW5hdGUuXG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKC4uLnRoaXMuX2dldFRpbGVzRm9yRXZlbnQocHJldkV2ZW50LCBteEV2LCBsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgIHByZXZFdmVudCA9IG14RXY7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZE1hcmtlciA9IHRoaXMuX3JlYWRNYXJrZXJGb3JFdmVudChldmVudElkLCBpID49IGxhc3RTaG93bk5vbkxvY2FsRWNob0luZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZE1hcmtlcikgcmV0LnB1c2gocmVhZE1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ3JvdXBlcikge1xuICAgICAgICAgICAgcmV0LnB1c2goLi4uZ3JvdXBlci5nZXRUaWxlcygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgX2dldFRpbGVzRm9yRXZlbnQocHJldkV2ZW50LCBteEV2LCBsYXN0KSB7XG4gICAgICAgIGNvbnN0IFRpbGVFcnJvckJvdW5kYXJ5ID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuVGlsZUVycm9yQm91bmRhcnknKTtcbiAgICAgICAgY29uc3QgRXZlbnRUaWxlID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuRXZlbnRUaWxlJyk7XG4gICAgICAgIGNvbnN0IERhdGVTZXBhcmF0b3IgPSBzZGsuZ2V0Q29tcG9uZW50KCdtZXNzYWdlcy5EYXRlU2VwYXJhdG9yJyk7XG4gICAgICAgIGNvbnN0IHJldCA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGlzRWRpdGluZyA9IHRoaXMucHJvcHMuZWRpdFN0YXRlICYmXG4gICAgICAgICAgICB0aGlzLnByb3BzLmVkaXRTdGF0ZS5nZXRFdmVudCgpLmdldElkKCkgPT09IG14RXYuZ2V0SWQoKTtcbiAgICAgICAgLy8gaXMgdGhpcyBhIGNvbnRpbnVhdGlvbiBvZiB0aGUgcHJldmlvdXMgbWVzc2FnZT9cbiAgICAgICAgbGV0IGNvbnRpbnVhdGlvbiA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFNvbWUgZXZlbnRzIHNob3VsZCBhcHBlYXIgYXMgY29udGludWF0aW9ucyBmcm9tIHByZXZpb3VzIGV2ZW50cyBvZlxuICAgICAgICAvLyBkaWZmZXJlbnQgdHlwZXMuXG5cbiAgICAgICAgY29uc3QgZXZlbnRUeXBlQ29udGludWVzID1cbiAgICAgICAgICAgIHByZXZFdmVudCAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgY29udGludWVkVHlwZXMuaW5jbHVkZXMobXhFdi5nZXRUeXBlKCkpICYmXG4gICAgICAgICAgICBjb250aW51ZWRUeXBlcy5pbmNsdWRlcyhwcmV2RXZlbnQuZ2V0VHlwZSgpKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHByZXZpb3VzIGV2ZW50IGFuZCBpdCBoYXMgdGhlIHNhbWUgc2VuZGVyIGFzIHRoaXMgZXZlbnRcbiAgICAgICAgLy8gYW5kIHRoZSB0eXBlcyBhcmUgdGhlIHNhbWUvaXMgaW4gY29udGludWVkVHlwZXMgYW5kIHRoZSB0aW1lIGJldHdlZW4gdGhlbSBpcyA8PSBDT05USU5VQVRJT05fTUFYX0lOVEVSVkFMXG4gICAgICAgIGlmIChwcmV2RXZlbnQgIT09IG51bGwgJiYgcHJldkV2ZW50LnNlbmRlciAmJiBteEV2LnNlbmRlciAmJiBteEV2LnNlbmRlci51c2VySWQgPT09IHByZXZFdmVudC5zZW5kZXIudXNlcklkICYmXG4gICAgICAgICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIHRpbGUgZm9yIHByZXZpb3VzIGV2ZW50IHRoZW4gaXQgd2FzIHNob3duIGJ5IHNob3dIaWRkZW5FdmVudHMgYW5kIGhhcyBubyBTZW5kZXJQcm9maWxlXG4gICAgICAgICAgICBoYXZlVGlsZUZvckV2ZW50KHByZXZFdmVudCkgJiYgKG14RXYuZ2V0VHlwZSgpID09PSBwcmV2RXZlbnQuZ2V0VHlwZSgpIHx8IGV2ZW50VHlwZUNvbnRpbnVlcykgJiZcbiAgICAgICAgICAgIChteEV2LmdldFRzKCkgLSBwcmV2RXZlbnQuZ2V0VHMoKSA8PSBDT05USU5VQVRJT05fTUFYX0lOVEVSVkFMKSkge1xuICAgICAgICAgICAgY29udGludWF0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4vKlxuICAgICAgICAvLyBXb3JrIG91dCBpZiB0aGlzIGlzIHN0aWxsIGEgY29udGludWF0aW9uLCBhcyB3ZSBhcmUgbm93IHNob3dpbmcgY29tbWFuZHNcbiAgICAgICAgLy8gYW5kIC9tZSBtZXNzYWdlcyB3aXRoIHRoZWlyIG93biBsaXR0bGUgYXZhdGFyLiBUaGUgY2FzZSBvZiBhIGNoYW5nZSBvZlxuICAgICAgICAvLyBldmVudCB0eXBlIChjb21tYW5kcykgaXMgaGFuZGxlZCBhYm92ZSwgYnV0IHdlIG5lZWQgdG8gaGFuZGxlIHRoZSAvbWVcbiAgICAgICAgLy8gbWVzc2FnZXMgc2VwZXJhdGVseSBhcyB0aGV5IGhhdmUgYSBtc2d0eXBlIG9mICdtLmVtb3RlJyBidXQgYXJlIGNsYXNzZWRcbiAgICAgICAgLy8gYXMgbm9ybWFsIG1lc3NhZ2VzXG4gICAgICAgIGlmIChwcmV2RXZlbnQgIT09IG51bGwgJiYgcHJldkV2ZW50LnNlbmRlciAmJiBteEV2LnNlbmRlclxuICAgICAgICAgICAgICAgICYmIG14RXYuc2VuZGVyLnVzZXJJZCA9PT0gcHJldkV2ZW50LnNlbmRlci51c2VySWRcbiAgICAgICAgICAgICAgICAmJiBteEV2LmdldFR5cGUoKSA9PSBwcmV2RXZlbnQuZ2V0VHlwZSgpXG4gICAgICAgICAgICAgICAgJiYgcHJldkV2ZW50LmdldENvbnRlbnQoKS5tc2d0eXBlID09PSAnbS5lbW90ZScpIHtcbiAgICAgICAgICAgIGNvbnRpbnVhdGlvbiA9IGZhbHNlO1xuICAgICAgICB9XG4qL1xuXG4gICAgICAgIC8vIGxvY2FsIGVjaG9lcyBoYXZlIGEgZmFrZSBkYXRlLCB3aGljaCBjb3VsZCBldmVuIGJlIHllc3RlcmRheS4gVHJlYXQgdGhlbVxuICAgICAgICAvLyBhcyAndG9kYXknIGZvciB0aGUgZGF0ZSBzZXBhcmF0b3JzLlxuICAgICAgICBsZXQgdHMxID0gbXhFdi5nZXRUcygpO1xuICAgICAgICBsZXQgZXZlbnREYXRlID0gbXhFdi5nZXREYXRlKCk7XG4gICAgICAgIGlmIChteEV2LnN0YXR1cykge1xuICAgICAgICAgICAgZXZlbnREYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHRzMSA9IGV2ZW50RGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkbyB3ZSBuZWVkIGEgZGF0ZSBzZXBhcmF0b3Igc2luY2UgdGhlIGxhc3QgZXZlbnQ/XG4gICAgICAgIGlmICh0aGlzLl93YW50c0RhdGVTZXBhcmF0b3IocHJldkV2ZW50LCBldmVudERhdGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRlU2VwYXJhdG9yID0gPGxpIGtleT17dHMxfT48RGF0ZVNlcGFyYXRvciBrZXk9e3RzMX0gdHM9e3RzMX0gLz48L2xpPjtcbiAgICAgICAgICAgIHJldC5wdXNoKGRhdGVTZXBhcmF0b3IpO1xuICAgICAgICAgICAgY29udGludWF0aW9uID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBldmVudElkID0gbXhFdi5nZXRJZCgpO1xuICAgICAgICBjb25zdCBoaWdobGlnaHQgPSAoZXZlbnRJZCA9PT0gdGhpcy5wcm9wcy5oaWdobGlnaHRlZEV2ZW50SWQpO1xuXG4gICAgICAgIC8vIHdlIGNhbid0IHVzZSBsb2NhbCBlY2hvZXMgYXMgc2Nyb2xsIHRva2VucywgYmVjYXVzZSB0aGVpciBldmVudCBJRHMgY2hhbmdlLlxuICAgICAgICAvLyBMb2NhbCBlY2hvcyBoYXZlIGEgc2VuZCBcInN0YXR1c1wiLlxuICAgICAgICBjb25zdCBzY3JvbGxUb2tlbiA9IG14RXYuc3RhdHVzID8gdW5kZWZpbmVkIDogZXZlbnRJZDtcblxuICAgICAgICBjb25zdCByZWFkUmVjZWlwdHMgPSB0aGlzLl9yZWFkUmVjZWlwdHNCeUV2ZW50W2V2ZW50SWRdO1xuXG4gICAgICAgIC8vIERldiBub3RlOiBgdGhpcy5faXNVbm1vdW50aW5nLmJpbmQodGhpcylgIGlzIGltcG9ydGFudCAtIGl0IGVuc3VyZXMgdGhhdFxuICAgICAgICAvLyB0aGUgZnVuY3Rpb24gaXMgcnVuIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgY2xhc3MgYW5kIG5vdCBFdmVudFRpbGUsIHRoZXJlZm9yZVxuICAgICAgICAvLyBlbnN1cmluZyB0aGUgcmlnaHQgYHRoaXMuX21vdW50ZWRgIHZhcmlhYmxlIGlzIHVzZWQgYnkgcmVhZCByZWNlaXB0cyAod2hpY2hcbiAgICAgICAgLy8gZG9uJ3QgdXBkYXRlIHRoZWlyIHBvc2l0aW9uIGlmIHdlLCB0aGUgTWVzc2FnZVBhbmVsLCBpcyB1bm1vdW50aW5nKS5cbiAgICAgICAgcmV0LnB1c2goXG4gICAgICAgICAgICA8bGkga2V5PXtldmVudElkfVxuICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fY29sbGVjdEV2ZW50Tm9kZS5iaW5kKHRoaXMsIGV2ZW50SWQpfVxuICAgICAgICAgICAgICAgIGRhdGEtc2Nyb2xsLXRva2Vucz17c2Nyb2xsVG9rZW59XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFRpbGVFcnJvckJvdW5kYXJ5IG14RXZlbnQ9e214RXZ9PlxuICAgICAgICAgICAgICAgICAgICA8RXZlbnRUaWxlIG14RXZlbnQ9e214RXZ9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51YXRpb249e2NvbnRpbnVhdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUmVkYWN0ZWQ9e214RXYuaXNSZWRhY3RlZCgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGFjaW5nRXZlbnRJZD17bXhFdi5yZXBsYWNpbmdFdmVudElkKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGU9e2lzRWRpdGluZyAmJiB0aGlzLnByb3BzLmVkaXRTdGF0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uSGVpZ2h0Q2hhbmdlZD17dGhpcy5fb25IZWlnaHRDaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVhZFJlY2VpcHRzPXtyZWFkUmVjZWlwdHN9XG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkUmVjZWlwdE1hcD17dGhpcy5fcmVhZFJlY2VpcHRNYXB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93VXJsUHJldmlldz17dGhpcy5wcm9wcy5zaG93VXJsUHJldmlld31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVW5tb3VudGluZz17dGhpcy5faXNVbm1vdW50aW5nLmJpbmQodGhpcyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudFNlbmRTdGF0dXM9e214RXYuZ2V0QXNzb2NpYXRlZFN0YXR1cygpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGlsZVNoYXBlPXt0aGlzLnByb3BzLnRpbGVTaGFwZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVHdlbHZlSG91cj17dGhpcy5wcm9wcy5pc1R3ZWx2ZUhvdXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3J9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0PXtsYXN0fVxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTZWxlY3RlZEV2ZW50PXtoaWdobGlnaHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRSZWxhdGlvbnNGb3JFdmVudD17dGhpcy5wcm9wcy5nZXRSZWxhdGlvbnNGb3JFdmVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3dSZWFjdGlvbnM9e3RoaXMucHJvcHMuc2hvd1JlYWN0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L1RpbGVFcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgPC9saT4sXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBfd2FudHNEYXRlU2VwYXJhdG9yKHByZXZFdmVudCwgbmV4dEV2ZW50RGF0ZSkge1xuICAgICAgICBpZiAocHJldkV2ZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIGZpcnN0IGV2ZW50IGluIHRoZSBwYW5lbDogZGVwZW5kcyBpZiB3ZSBjb3VsZCBiYWNrLXBhZ2luYXRlIGZyb21cbiAgICAgICAgICAgIC8vIGhlcmUuXG4gICAgICAgICAgICByZXR1cm4gIXRoaXMucHJvcHMuc3VwcHJlc3NGaXJzdERhdGVTZXBhcmF0b3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdhbnRzRGF0ZVNlcGFyYXRvcihwcmV2RXZlbnQuZ2V0RGF0ZSgpLCBuZXh0RXZlbnREYXRlKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgYSBsaXN0IG9mIHJlYWQgcmVjZWlwdHMgdGhhdCBzaG91bGQgYmUgc2hvd24gbmV4dCB0byB0aGlzIGV2ZW50XG4gICAgLy8gUmVjZWlwdHMgYXJlIG9iamVjdHMgd2hpY2ggaGF2ZSBhICd1c2VySWQnLCAncm9vbU1lbWJlcicgYW5kICd0cycuXG4gICAgX2dldFJlYWRSZWNlaXB0c0ZvckV2ZW50KGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IG15VXNlcklkID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWRlbnRpYWxzLnVzZXJJZDtcblxuICAgICAgICAvLyBnZXQgbGlzdCBvZiByZWFkIHJlY2VpcHRzLCBzb3J0ZWQgbW9zdCByZWNlbnQgZmlyc3RcbiAgICAgICAgY29uc3QgeyByb29tIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlY2VpcHRzID0gW107XG4gICAgICAgIHJvb20uZ2V0UmVjZWlwdHNGb3JFdmVudChldmVudCkuZm9yRWFjaCgocikgPT4ge1xuICAgICAgICAgICAgaWYgKCFyLnVzZXJJZCB8fCByLnR5cGUgIT09IFwibS5yZWFkXCIgfHwgci51c2VySWQgPT09IG15VXNlcklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBpZ25vcmUgbm9uLXJlYWQgcmVjZWlwdHMgYW5kIHJlY2VpcHRzIGZyb20gc2VsZi5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNVc2VySWdub3JlZChyLnVzZXJJZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIGlnbm9yZSBpZ25vcmVkIHVzZXJzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtZW1iZXIgPSByb29tLmdldE1lbWJlcihyLnVzZXJJZCk7XG4gICAgICAgICAgICByZWNlaXB0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHIudXNlcklkLFxuICAgICAgICAgICAgICAgIHJvb21NZW1iZXI6IG1lbWJlcixcbiAgICAgICAgICAgICAgICB0czogci5kYXRhID8gci5kYXRhLnRzIDogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlY2VpcHRzO1xuICAgIH1cblxuICAgIC8vIEdldCBhbiBvYmplY3QgdGhhdCBtYXBzIGZyb20gZXZlbnQgSUQgdG8gYSBsaXN0IG9mIHJlYWQgcmVjZWlwdHMgdGhhdFxuICAgIC8vIHNob3VsZCBiZSBzaG93biBuZXh0IHRvIHRoYXQgZXZlbnQuIElmIGEgaGlkZGVuIGV2ZW50IGhhcyByZWFkIHJlY2VpcHRzLFxuICAgIC8vIHRoZXkgYXJlIGZvbGRlZCBpbnRvIHRoZSByZWNlaXB0cyBvZiB0aGUgbGFzdCBzaG93biBldmVudC5cbiAgICBfZ2V0UmVhZFJlY2VpcHRzQnlTaG93bkV2ZW50KCkge1xuICAgICAgICBjb25zdCByZWNlaXB0c0J5RXZlbnQgPSB7fTtcbiAgICAgICAgY29uc3QgcmVjZWlwdHNCeVVzZXJJZCA9IHt9O1xuXG4gICAgICAgIGxldCBsYXN0U2hvd25FdmVudElkO1xuICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMucHJvcHMuZXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2hvdWxkU2hvd0V2ZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGxhc3RTaG93bkV2ZW50SWQgPSBldmVudC5nZXRJZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFsYXN0U2hvd25FdmVudElkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nUmVjZWlwdHMgPSByZWNlaXB0c0J5RXZlbnRbbGFzdFNob3duRXZlbnRJZF0gfHwgW107XG4gICAgICAgICAgICBjb25zdCBuZXdSZWNlaXB0cyA9IHRoaXMuX2dldFJlYWRSZWNlaXB0c0ZvckV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgIHJlY2VpcHRzQnlFdmVudFtsYXN0U2hvd25FdmVudElkXSA9IGV4aXN0aW5nUmVjZWlwdHMuY29uY2F0KG5ld1JlY2VpcHRzKTtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZXNlIHJlY2VpcHRzIGFsb25nIHdpdGggdGhlaXIgbGFzdCBzaG93biBldmVudCBJRCBmb3JcbiAgICAgICAgICAgIC8vIGVhY2ggYXNzb2NpYXRlZCB1c2VyIElELlxuICAgICAgICAgICAgZm9yIChjb25zdCByZWNlaXB0IG9mIG5ld1JlY2VpcHRzKSB7XG4gICAgICAgICAgICAgICAgcmVjZWlwdHNCeVVzZXJJZFtyZWNlaXB0LnVzZXJJZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaG93bkV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgIHJlY2VpcHQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0J3MgcG9zc2libGUgaW4gc29tZSBjYXNlcyAoZm9yIGV4YW1wbGUsIHdoZW4gYSByZWFkIHJlY2VpcHRcbiAgICAgICAgLy8gYWR2YW5jZXMgYmVmb3JlIHdlIGhhdmUgcGFnaW5hdGVkIGluIHRoZSBuZXcgZXZlbnQgdGhhdCBpdCdzIG1hcmtpbmdcbiAgICAgICAgLy8gcmVjZWl2ZWQpIHRoYXQgd2UgY2FuIHRlbXBvcmFyaWx5IG5vdCBoYXZlIGEgbWF0Y2hpbmcgZXZlbnQgZm9yXG4gICAgICAgIC8vIHNvbWVvbmUgd2hpY2ggaGFkIG9uZSBpbiB0aGUgbGFzdC4gQnkgbG9va2luZyB0aHJvdWdoIG91ciBwcmV2aW91c1xuICAgICAgICAvLyBtYXBwaW5nIG9mIHJlY2VpcHRzIGJ5IHVzZXIgSUQsIHdlIGNhbiBjb3ZlciByZWNvdmVyIGFueSByZWNlaXB0c1xuICAgICAgICAvLyB0aGF0IHdvdWxkIGhhdmUgYmVlbiBsb3N0IGJ5IHVzaW5nIHRoZSBzYW1lIGV2ZW50IElEIGZyb20gbGFzdCB0aW1lLlxuICAgICAgICBmb3IgKGNvbnN0IHVzZXJJZCBpbiB0aGlzLl9yZWFkUmVjZWlwdHNCeVVzZXJJZCkge1xuICAgICAgICAgICAgaWYgKHJlY2VpcHRzQnlVc2VySWRbdXNlcklkXSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBsYXN0U2hvd25FdmVudElkLCByZWNlaXB0IH0gPSB0aGlzLl9yZWFkUmVjZWlwdHNCeVVzZXJJZFt1c2VySWRdO1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdSZWNlaXB0cyA9IHJlY2VpcHRzQnlFdmVudFtsYXN0U2hvd25FdmVudElkXSB8fCBbXTtcbiAgICAgICAgICAgIHJlY2VpcHRzQnlFdmVudFtsYXN0U2hvd25FdmVudElkXSA9IGV4aXN0aW5nUmVjZWlwdHMuY29uY2F0KHJlY2VpcHQpO1xuICAgICAgICAgICAgcmVjZWlwdHNCeVVzZXJJZFt1c2VySWRdID0geyBsYXN0U2hvd25FdmVudElkLCByZWNlaXB0IH07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVhZFJlY2VpcHRzQnlVc2VySWQgPSByZWNlaXB0c0J5VXNlcklkO1xuXG4gICAgICAgIC8vIEFmdGVyIGdyb3VwaW5nIHJlY2VpcHRzIGJ5IHNob3duIGV2ZW50cywgZG8gYW5vdGhlciBwYXNzIHRvIHNvcnQgZWFjaFxuICAgICAgICAvLyByZWNlaXB0IGxpc3QuXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnRJZCBpbiByZWNlaXB0c0J5RXZlbnQpIHtcbiAgICAgICAgICAgIHJlY2VpcHRzQnlFdmVudFtldmVudElkXS5zb3J0KChyMSwgcjIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcjIudHMgLSByMS50cztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlY2VpcHRzQnlFdmVudDtcbiAgICB9XG5cbiAgICBfY29sbGVjdEV2ZW50Tm9kZSA9IChldmVudElkLCBub2RlKSA9PiB7XG4gICAgICAgIHRoaXMuZXZlbnROb2Rlc1tldmVudElkXSA9IG5vZGU7XG4gICAgfVxuXG4gICAgLy8gb25jZSBkeW5hbWljIGNvbnRlbnQgaW4gdGhlIGV2ZW50cyBsb2FkLCBtYWtlIHRoZSBzY3JvbGxQYW5lbCBjaGVjayB0aGVcbiAgICAvLyBzY3JvbGwgb2Zmc2V0cy5cbiAgICBfb25IZWlnaHRDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzY3JvbGxQYW5lbCA9IHRoaXMuX3Njcm9sbFBhbmVsLmN1cnJlbnQ7XG4gICAgICAgIGlmIChzY3JvbGxQYW5lbCkge1xuICAgICAgICAgICAgc2Nyb2xsUGFuZWwuY2hlY2tTY3JvbGwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBfb25UeXBpbmdTaG93biA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsUGFuZWwgPSB0aGlzLl9zY3JvbGxQYW5lbC5jdXJyZW50O1xuICAgICAgICAvLyB0aGlzIHdpbGwgbWFrZSB0aGUgdGltZWxpbmUgZ3Jvdywgc28gY2hlY2tTY3JvbGxcbiAgICAgICAgc2Nyb2xsUGFuZWwuY2hlY2tTY3JvbGwoKTtcbiAgICAgICAgaWYgKHNjcm9sbFBhbmVsICYmIHNjcm9sbFBhbmVsLmdldFNjcm9sbFN0YXRlKCkuc3R1Y2tBdEJvdHRvbSkge1xuICAgICAgICAgICAgc2Nyb2xsUGFuZWwucHJldmVudFNocmlua2luZygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vblR5cGluZ0hpZGRlbiA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsUGFuZWwgPSB0aGlzLl9zY3JvbGxQYW5lbC5jdXJyZW50O1xuICAgICAgICBpZiAoc2Nyb2xsUGFuZWwpIHtcbiAgICAgICAgICAgIC8vIGFzIGhpZGluZyB0aGUgdHlwaW5nIG5vdGlmaWNhdGlvbnMgZG9lc24ndFxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzY3JvbGxQYW5lbCwgd2UgdGVsbCBpdCB0byBhcHBseVxuICAgICAgICAgICAgLy8gdGhlIHNocmlua2luZyBwcmV2ZW50aW9uIG9uY2UgdGhlIHR5cGluZyBub3RpZnMgYXJlIGhpZGRlblxuICAgICAgICAgICAgc2Nyb2xsUGFuZWwudXBkYXRlUHJldmVudFNocmlua2luZygpO1xuICAgICAgICAgICAgLy8gb3JkZXIgaXMgaW1wb3J0YW50IGhlcmUgYXMgY2hlY2tTY3JvbGwgd2lsbCBzY3JvbGwgZG93biB0b1xuICAgICAgICAgICAgLy8gcmV2ZWFsIGFkZGVkIHBhZGRpbmcgdG8gYmFsYW5jZSB0aGUgbm90aWZzIGRpc2FwcGVhcmluZy5cbiAgICAgICAgICAgIHNjcm9sbFBhbmVsLmNoZWNrU2Nyb2xsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdXBkYXRlVGltZWxpbmVNaW5IZWlnaHQoKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbFBhbmVsID0gdGhpcy5fc2Nyb2xsUGFuZWwuY3VycmVudDtcblxuICAgICAgICBpZiAoc2Nyb2xsUGFuZWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzQXRCb3R0b20gPSBzY3JvbGxQYW5lbC5pc0F0Qm90dG9tKCk7XG4gICAgICAgICAgICBjb25zdCB3aG9Jc1R5cGluZyA9IHRoaXMuX3dob0lzVHlwaW5nLmN1cnJlbnQ7XG4gICAgICAgICAgICBjb25zdCBpc1R5cGluZ1Zpc2libGUgPSB3aG9Jc1R5cGluZyAmJiB3aG9Jc1R5cGluZy5pc1Zpc2libGUoKTtcbiAgICAgICAgICAgIC8vIHdoZW4gbWVzc2FnZXMgZ2V0IGFkZGVkIHRvIHRoZSB0aW1lbGluZSxcbiAgICAgICAgICAgIC8vIGJ1dCBzb21lYm9keSBlbHNlIGlzIHN0aWxsIHR5cGluZyxcbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgbWluLWhlaWdodCwgc28gb25jZSB0aGUgbGFzdFxuICAgICAgICAgICAgLy8gcGVyc29uIHN0b3BzIHR5cGluZywgbm8ganVtcGluZyBvY2N1cnNcbiAgICAgICAgICAgIGlmIChpc0F0Qm90dG9tICYmIGlzVHlwaW5nVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIHNjcm9sbFBhbmVsLnByZXZlbnRTaHJpbmtpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uVGltZWxpbmVSZXNldCgpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsUGFuZWwgPSB0aGlzLl9zY3JvbGxQYW5lbC5jdXJyZW50O1xuICAgICAgICBpZiAoc2Nyb2xsUGFuZWwpIHtcbiAgICAgICAgICAgIHNjcm9sbFBhbmVsLmNsZWFyUHJldmVudFNocmlua2luZygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBFcnJvckJvdW5kYXJ5ID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRXJyb3JCb3VuZGFyeScpO1xuICAgICAgICBjb25zdCBTY3JvbGxQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoXCJzdHJ1Y3R1cmVzLlNjcm9sbFBhbmVsXCIpO1xuICAgICAgICBjb25zdCBXaG9Jc1R5cGluZ1RpbGUgPSBzZGsuZ2V0Q29tcG9uZW50KFwicm9vbXMuV2hvSXNUeXBpbmdUaWxlXCIpO1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgIGxldCB0b3BTcGlubmVyO1xuICAgICAgICBsZXQgYm90dG9tU3Bpbm5lcjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuYmFja1BhZ2luYXRpbmcpIHtcbiAgICAgICAgICAgIHRvcFNwaW5uZXIgPSA8bGkga2V5PVwiX3RvcFNwaW5uZXJcIj48U3Bpbm5lciAvPjwvbGk+O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmZvcndhcmRQYWdpbmF0aW5nKSB7XG4gICAgICAgICAgICBib3R0b21TcGlubmVyID0gPGxpIGtleT1cIl9ib3R0b21TcGlubmVyXCI+PFNwaW5uZXIgLz48L2xpPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gdGhpcy5wcm9wcy5oaWRkZW4gPyB7IGRpc3BsYXk6ICdub25lJyB9IDoge307XG5cbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lcyhcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2xhc3NOYW1lLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibXhfTWVzc2FnZVBhbmVsX2Fsd2F5c1Nob3dUaW1lc3RhbXBzXCI6IHRoaXMucHJvcHMuYWx3YXlzU2hvd1RpbWVzdGFtcHMsXG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIGxldCB3aG9Jc1R5cGluZztcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucm9vbSAmJiAhdGhpcy5wcm9wcy50aWxlU2hhcGUgJiYgdGhpcy5zdGF0ZS5zaG93VHlwaW5nTm90aWZpY2F0aW9ucykge1xuICAgICAgICAgICAgd2hvSXNUeXBpbmcgPSAoPFdob0lzVHlwaW5nVGlsZVxuICAgICAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgICAgICBvblNob3duPXt0aGlzLl9vblR5cGluZ1Nob3dufVxuICAgICAgICAgICAgICAgIG9uSGlkZGVuPXt0aGlzLl9vblR5cGluZ0hpZGRlbn1cbiAgICAgICAgICAgICAgICByZWY9e3RoaXMuX3dob0lzVHlwaW5nfSAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgICAgICA8U2Nyb2xsUGFuZWxcbiAgICAgICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9zY3JvbGxQYW5lbH1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWV9XG4gICAgICAgICAgICAgICAgICAgIG9uU2Nyb2xsPXt0aGlzLnByb3BzLm9uU2Nyb2xsfVxuICAgICAgICAgICAgICAgICAgICBvblJlc2l6ZT17dGhpcy5vblJlc2l6ZX1cbiAgICAgICAgICAgICAgICAgICAgb25GaWxsUmVxdWVzdD17dGhpcy5wcm9wcy5vbkZpbGxSZXF1ZXN0fVxuICAgICAgICAgICAgICAgICAgICBvblVuZmlsbFJlcXVlc3Q9e3RoaXMucHJvcHMub25VbmZpbGxSZXF1ZXN0fVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgICAgICAgICAgICAgIHN0aWNreUJvdHRvbT17dGhpcy5wcm9wcy5zdGlja3lCb3R0b219XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZU5vdGlmaWVyPXt0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgeyB0b3BTcGlubmVyIH1cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9nZXRFdmVudFRpbGVzKCkgfVxuICAgICAgICAgICAgICAgICAgICB7IHdob0lzVHlwaW5nIH1cbiAgICAgICAgICAgICAgICAgICAgeyBib3R0b21TcGlubmVyIH1cbiAgICAgICAgICAgICAgICA8L1Njcm9sbFBhbmVsPlxuICAgICAgICAgICAgPC9FcnJvckJvdW5kYXJ5PlxuICAgICAgICApO1xuICAgIH1cbn1cblxuLyogR3JvdXBlciBjbGFzc2VzIGRldGVybWluZSB3aGVuIGV2ZW50cyBjYW4gYmUgZ3JvdXBlZCB0b2dldGhlciBpbiBhIHN1bW1hcnkuXG4gKiBHcm91cGVycyBzaG91bGQgaGF2ZSB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4gKiAtIGNhblN0YXJ0R3JvdXAgKHN0YXRpYyk6IGRldGVybWluZXMgaWYgYSBuZXcgZ3JvdXAgc2hvdWxkIGJlIHN0YXJ0ZWQgd2l0aCB0aGVcbiAqICAgZ2l2ZW4gZXZlbnRcbiAqIC0gc2hvdWxkR3JvdXA6IGRldGVybWluZXMgaWYgdGhlIGdpdmVuIGV2ZW50IHNob3VsZCBiZSBhZGRlZCB0byBhbiBleGlzdGluZyBncm91cFxuICogLSBhZGQ6IGFkZHMgYW4gZXZlbnQgdG8gYW4gZXhpc3RpbmcgZ3JvdXAgKHNob3VsZCBvbmx5IGJlIGNhbGxlZCBpZiBzaG91bGRHcm91cFxuICogICByZXR1cm4gdHJ1ZSlcbiAqIC0gZ2V0VGlsZXM6IHJldHVybnMgdGhlIHRpbGVzIHRoYXQgcmVwcmVzZW50IHRoZSBncm91cFxuICogLSBnZXROZXdQcmV2RXZlbnQ6IHJldHVybnMgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgYXMgdGhlIG5ldyBwcmV2RXZlbnRcbiAqICAgd2hlbiBkZXRlcm1pbmluZyB0aGluZ3Mgc3VjaCBhcyB3aGV0aGVyIGEgZGF0ZSBzZXBhcmF0b3IgaXMgbmVjZXNzYXJ5XG4gKi9cblxuLy8gV3JhcCBpbml0aWFsIHJvb20gY3JlYXRpb24gZXZlbnRzIGludG8gYW4gRXZlbnRMaXN0U3VtbWFyeVxuLy8gR3JvdXBpbmcgb25seSBldmVudHMgc2VudCBieSB0aGUgc2FtZSB1c2VyIHRoYXQgc2VudCB0aGUgYG0ucm9vbS5jcmVhdGVgIGFuZCBvbmx5IHVudGlsXG4vLyB0aGUgZmlyc3Qgbm9uLXN0YXRlIGV2ZW50IG9yIG1lbWJlcnNoaXAgZXZlbnQgd2hpY2ggaXMgbm90IHJlZ2FyZGluZyB0aGUgc2VuZGVyIG9mIHRoZSBgbS5yb29tLmNyZWF0ZWAgZXZlbnRcbmNsYXNzIENyZWF0aW9uR3JvdXBlciB7XG4gICAgc3RhdGljIGNhblN0YXJ0R3JvdXAgPSBmdW5jdGlvbihwYW5lbCwgZXYpIHtcbiAgICAgICAgcmV0dXJuIGV2LmdldFR5cGUoKSA9PT0gXCJtLnJvb20uY3JlYXRlXCI7XG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHBhbmVsLCBjcmVhdGVFdmVudCwgcHJldkV2ZW50LCBsYXN0U2hvd25FdmVudCkge1xuICAgICAgICB0aGlzLnBhbmVsID0gcGFuZWw7XG4gICAgICAgIHRoaXMuY3JlYXRlRXZlbnQgPSBjcmVhdGVFdmVudDtcbiAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSBwcmV2RXZlbnQ7XG4gICAgICAgIHRoaXMubGFzdFNob3duRXZlbnQgPSBsYXN0U2hvd25FdmVudDtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBbXTtcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgaW5jbHVkZSBpbiB0aGUgZ3JvdXAgYnV0IHRoZW4gZWplY3Qgb3V0IGFuZCBwbGFjZVxuICAgICAgICAvLyBhYm92ZSB0aGUgZ3JvdXAuXG4gICAgICAgIHRoaXMuZWplY3RlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnJlYWRNYXJrZXIgPSBwYW5lbC5fcmVhZE1hcmtlckZvckV2ZW50KFxuICAgICAgICAgICAgY3JlYXRlRXZlbnQuZ2V0SWQoKSxcbiAgICAgICAgICAgIGNyZWF0ZUV2ZW50ID09PSBsYXN0U2hvd25FdmVudCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzaG91bGRHcm91cChldikge1xuICAgICAgICBjb25zdCBwYW5lbCA9IHRoaXMucGFuZWw7XG4gICAgICAgIGNvbnN0IGNyZWF0ZUV2ZW50ID0gdGhpcy5jcmVhdGVFdmVudDtcbiAgICAgICAgaWYgKCFwYW5lbC5fc2hvdWxkU2hvd0V2ZW50KGV2KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhbmVsLl93YW50c0RhdGVTZXBhcmF0b3IodGhpcy5jcmVhdGVFdmVudCwgZXYuZ2V0RGF0ZSgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLm1lbWJlclwiXG4gICAgICAgICAgICAmJiAoZXYuZ2V0U3RhdGVLZXkoKSAhPT0gY3JlYXRlRXZlbnQuZ2V0U2VuZGVyKCkgfHwgZXYuZ2V0Q29udGVudCgpW1wibWVtYmVyc2hpcFwiXSAhPT0gXCJqb2luXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2LmlzU3RhdGUoKSAmJiBldi5nZXRTZW5kZXIoKSA9PT0gY3JlYXRlRXZlbnQuZ2V0U2VuZGVyKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhZGQoZXYpIHtcbiAgICAgICAgY29uc3QgcGFuZWwgPSB0aGlzLnBhbmVsO1xuICAgICAgICB0aGlzLnJlYWRNYXJrZXIgPSB0aGlzLnJlYWRNYXJrZXIgfHwgcGFuZWwuX3JlYWRNYXJrZXJGb3JFdmVudChcbiAgICAgICAgICAgIGV2LmdldElkKCksXG4gICAgICAgICAgICBldiA9PT0gdGhpcy5sYXN0U2hvd25FdmVudCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFwYW5lbC5fc2hvdWxkU2hvd0V2ZW50KGV2KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLmVuY3J5cHRpb25cIikge1xuICAgICAgICAgICAgdGhpcy5lamVjdGVkRXZlbnRzLnB1c2goZXYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMucHVzaChldik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRUaWxlcygpIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbnkgZXZlbnRzIHRvIGdyb3VwLCBkb24ndCBldmVuIHRyeSB0byBncm91cCB0aGVtLiBUaGUgbG9naWNcbiAgICAgICAgLy8gYmVsb3cgYXNzdW1lcyB0aGF0IHdlIGhhdmUgYSBncm91cCBvZiBldmVudHMgdG8gZGVhbCB3aXRoLCBidXQgd2UgbWlnaHQgbm90IGlmXG4gICAgICAgIC8vIHRoZSBldmVudHMgd2Ugd2VyZSBzdXBwb3NlZCB0byBncm91cCB3ZXJlIHJlZGFjdGVkLlxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzIHx8ICF0aGlzLmV2ZW50cy5sZW5ndGgpIHJldHVybiBbXTtcblxuICAgICAgICBjb25zdCBEYXRlU2VwYXJhdG9yID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuRGF0ZVNlcGFyYXRvcicpO1xuICAgICAgICBjb25zdCBFdmVudExpc3RTdW1tYXJ5ID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRXZlbnRMaXN0U3VtbWFyeScpO1xuXG4gICAgICAgIGNvbnN0IHBhbmVsID0gdGhpcy5wYW5lbDtcbiAgICAgICAgY29uc3QgcmV0ID0gW107XG4gICAgICAgIGNvbnN0IGNyZWF0ZUV2ZW50ID0gdGhpcy5jcmVhdGVFdmVudDtcbiAgICAgICAgY29uc3QgbGFzdFNob3duRXZlbnQgPSB0aGlzLmxhc3RTaG93bkV2ZW50O1xuXG4gICAgICAgIGlmIChwYW5lbC5fd2FudHNEYXRlU2VwYXJhdG9yKHRoaXMucHJldkV2ZW50LCBjcmVhdGVFdmVudC5nZXREYXRlKCkpKSB7XG4gICAgICAgICAgICBjb25zdCB0cyA9IGNyZWF0ZUV2ZW50LmdldFRzKCk7XG4gICAgICAgICAgICByZXQucHVzaChcbiAgICAgICAgICAgICAgICA8bGkga2V5PXt0cysnfid9PjxEYXRlU2VwYXJhdG9yIGtleT17dHMrJ34nfSB0cz17dHN9IC8+PC9saT4sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhpcyBtLnJvb20uY3JlYXRlIGV2ZW50IHNob3VsZCBiZSBzaG93biAocm9vbSB1cGdyYWRlKSB0aGVuIHNob3cgaXQgYmVmb3JlIHRoZSBzdW1tYXJ5XG4gICAgICAgIGlmIChwYW5lbC5fc2hvdWxkU2hvd0V2ZW50KGNyZWF0ZUV2ZW50KSkge1xuICAgICAgICAgICAgLy8gcGFzcyBpbiB0aGUgY3JlYXRlRXZlbnQgYXMgcHJldkV2ZW50IGFzIHdlbGwgc28gbm8gZXh0cmEgRGF0ZVNlcGFyYXRvciBpcyByZW5kZXJlZFxuICAgICAgICAgICAgcmV0LnB1c2goLi4ucGFuZWwuX2dldFRpbGVzRm9yRXZlbnQoY3JlYXRlRXZlbnQsIGNyZWF0ZUV2ZW50LCBmYWxzZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBlamVjdGVkIG9mIHRoaXMuZWplY3RlZEV2ZW50cykge1xuICAgICAgICAgICAgcmV0LnB1c2goLi4ucGFuZWwuX2dldFRpbGVzRm9yRXZlbnQoXG4gICAgICAgICAgICAgICAgY3JlYXRlRXZlbnQsIGVqZWN0ZWQsIGNyZWF0ZUV2ZW50ID09PSBsYXN0U2hvd25FdmVudCxcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXZlbnRUaWxlcyA9IHRoaXMuZXZlbnRzLm1hcCgoZSkgPT4ge1xuICAgICAgICAgICAgLy8gSW4gb3JkZXIgdG8gcHJldmVudCBEYXRlU2VwYXJhdG9ycyBmcm9tIGFwcGVhcmluZyBpbiB0aGUgZXhwYW5kZWQgZm9ybVxuICAgICAgICAgICAgLy8gb2YgRXZlbnRMaXN0U3VtbWFyeSwgcmVuZGVyIGVhY2ggbWVtYmVyIGV2ZW50IGFzIGlmIHRoZSBwcmV2aW91c1xuICAgICAgICAgICAgLy8gb25lIHdhcyBpdHNlbGYuIFRoaXMgd2F5LCB0aGUgdGltZXN0YW1wIG9mIHRoZSBwcmV2aW91cyBldmVudCA9PT0gdGhlXG4gICAgICAgICAgICAvLyB0aW1lc3RhbXAgb2YgdGhlIGN1cnJlbnQgZXZlbnQsIGFuZCBubyBEYXRlU2VwYXJhdG9yIGlzIGluc2VydGVkLlxuICAgICAgICAgICAgcmV0dXJuIHBhbmVsLl9nZXRUaWxlc0ZvckV2ZW50KGUsIGUsIGUgPT09IGxhc3RTaG93bkV2ZW50KTtcbiAgICAgICAgfSkucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiKSwgW10pO1xuICAgICAgICAvLyBHZXQgc2VuZGVyIHByb2ZpbGUgZnJvbSB0aGUgbGF0ZXN0IGV2ZW50IGluIHRoZSBzdW1tYXJ5IGFzIHRoZSBtLnJvb20uY3JlYXRlIGRvZXNuJ3QgY29udGFpbiBvbmVcbiAgICAgICAgY29uc3QgZXYgPSB0aGlzLmV2ZW50c1t0aGlzLmV2ZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0LnB1c2goXG4gICAgICAgICAgICA8RXZlbnRMaXN0U3VtbWFyeVxuICAgICAgICAgICAgICAgICBrZXk9XCJyb29tY3JlYXRpb25zdW1tYXJ5XCJcbiAgICAgICAgICAgICAgICAgZXZlbnRzPXt0aGlzLmV2ZW50c31cbiAgICAgICAgICAgICAgICAgb25Ub2dnbGU9e3BhbmVsLl9vbkhlaWdodENoYW5nZWR9IC8vIFVwZGF0ZSBzY3JvbGwgc3RhdGVcbiAgICAgICAgICAgICAgICAgc3VtbWFyeU1lbWJlcnM9e1tldi5zZW5kZXJdfVxuICAgICAgICAgICAgICAgICBzdW1tYXJ5VGV4dD17X3QoXCIlKGNyZWF0b3IpcyBjcmVhdGVkIGFuZCBjb25maWd1cmVkIHRoZSByb29tLlwiLCB7XG4gICAgICAgICAgICAgICAgICAgICBjcmVhdG9yOiBldi5zZW5kZXIgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpLFxuICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgeyBldmVudFRpbGVzIH1cbiAgICAgICAgICAgIDwvRXZlbnRMaXN0U3VtbWFyeT4sXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHRoaXMucmVhZE1hcmtlcikge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy5yZWFkTWFya2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2V0TmV3UHJldkV2ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFdmVudDtcbiAgICB9XG59XG5cbi8vIFdyYXAgY29uc2VjdXRpdmUgbWVtYmVyIGV2ZW50cyBpbiBhIExpc3RTdW1tYXJ5LCBpZ25vcmUgaWYgcmVkYWN0ZWRcbmNsYXNzIE1lbWJlckdyb3VwZXIge1xuICAgIHN0YXRpYyBjYW5TdGFydEdyb3VwID0gZnVuY3Rpb24ocGFuZWwsIGV2KSB7XG4gICAgICAgIHJldHVybiBwYW5lbC5fc2hvdWxkU2hvd0V2ZW50KGV2KSAmJiBpc01lbWJlcnNoaXBDaGFuZ2UoZXYpO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHBhbmVsLCBldiwgcHJldkV2ZW50LCBsYXN0U2hvd25FdmVudCkge1xuICAgICAgICB0aGlzLnBhbmVsID0gcGFuZWw7XG4gICAgICAgIHRoaXMucmVhZE1hcmtlciA9IHBhbmVsLl9yZWFkTWFya2VyRm9yRXZlbnQoXG4gICAgICAgICAgICBldi5nZXRJZCgpLFxuICAgICAgICAgICAgZXYgPT09IGxhc3RTaG93bkV2ZW50LFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IFtldl07XG4gICAgICAgIHRoaXMucHJldkV2ZW50ID0gcHJldkV2ZW50O1xuICAgICAgICB0aGlzLmxhc3RTaG93bkV2ZW50ID0gbGFzdFNob3duRXZlbnQ7XG4gICAgfVxuXG4gICAgc2hvdWxkR3JvdXAoZXYpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwuX3dhbnRzRGF0ZVNlcGFyYXRvcih0aGlzLmV2ZW50c1swXSwgZXYuZ2V0RGF0ZSgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc01lbWJlcnNoaXBDaGFuZ2UoZXYpO1xuICAgIH1cblxuICAgIGFkZChldikge1xuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpID09PSAnbS5yb29tLm1lbWJlcicpIHtcbiAgICAgICAgICAgIC8vIFdlJ2xsIGp1c3QgZG91YmxlIGNoZWNrIHRoYXQgaXQncyB3b3J0aCBvdXIgdGltZSB0byBkbyBzbywgdGhyb3VnaCBhblxuICAgICAgICAgICAgLy8gdWdseSBoYWNrLiBJZiB0ZXh0Rm9yRXZlbnQgcmV0dXJucyBzb21ldGhpbmcsIHdlIHNob3VsZCBncm91cCBpdCBmb3JcbiAgICAgICAgICAgIC8vIHJlbmRlcmluZyBidXQgaWYgaXQgZG9lc24ndCB0aGVuIHdlJ2xsIGV4Y2x1ZGUgaXQuXG4gICAgICAgICAgICBjb25zdCByZW5kZXJUZXh0ID0gdGV4dEZvckV2ZW50KGV2KTtcbiAgICAgICAgICAgIGlmICghcmVuZGVyVGV4dCB8fCByZW5kZXJUZXh0LnRyaW0oKS5sZW5ndGggPT09IDApIHJldHVybjsgLy8gcXVpZXRseSBpZ25vcmVcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlYWRNYXJrZXIgPSB0aGlzLnJlYWRNYXJrZXIgfHwgdGhpcy5wYW5lbC5fcmVhZE1hcmtlckZvckV2ZW50KFxuICAgICAgICAgICAgZXYuZ2V0SWQoKSxcbiAgICAgICAgICAgIGV2ID09PSB0aGlzLmxhc3RTaG93bkV2ZW50LFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmV2ZW50cy5wdXNoKGV2KTtcbiAgICB9XG5cbiAgICBnZXRUaWxlcygpIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbnkgZXZlbnRzIHRvIGdyb3VwLCBkb24ndCBldmVuIHRyeSB0byBncm91cCB0aGVtLiBUaGUgbG9naWNcbiAgICAgICAgLy8gYmVsb3cgYXNzdW1lcyB0aGF0IHdlIGhhdmUgYSBncm91cCBvZiBldmVudHMgdG8gZGVhbCB3aXRoLCBidXQgd2UgbWlnaHQgbm90IGlmXG4gICAgICAgIC8vIHRoZSBldmVudHMgd2Ugd2VyZSBzdXBwb3NlZCB0byBncm91cCB3ZXJlIHJlZGFjdGVkLlxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzIHx8ICF0aGlzLmV2ZW50cy5sZW5ndGgpIHJldHVybiBbXTtcblxuICAgICAgICBjb25zdCBEYXRlU2VwYXJhdG9yID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuRGF0ZVNlcGFyYXRvcicpO1xuICAgICAgICBjb25zdCBNZW1iZXJFdmVudExpc3RTdW1tYXJ5ID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuTWVtYmVyRXZlbnRMaXN0U3VtbWFyeScpO1xuXG4gICAgICAgIGNvbnN0IHBhbmVsID0gdGhpcy5wYW5lbDtcbiAgICAgICAgY29uc3QgbGFzdFNob3duRXZlbnQgPSB0aGlzLmxhc3RTaG93bkV2ZW50O1xuICAgICAgICBjb25zdCByZXQgPSBbXTtcblxuICAgICAgICBpZiAocGFuZWwuX3dhbnRzRGF0ZVNlcGFyYXRvcih0aGlzLnByZXZFdmVudCwgdGhpcy5ldmVudHNbMF0uZ2V0RGF0ZSgpKSkge1xuICAgICAgICAgICAgY29uc3QgdHMgPSB0aGlzLmV2ZW50c1swXS5nZXRUcygpO1xuICAgICAgICAgICAgcmV0LnB1c2goXG4gICAgICAgICAgICAgICAgPGxpIGtleT17dHMrJ34nfT48RGF0ZVNlcGFyYXRvciBrZXk9e3RzKyd+J30gdHM9e3RzfSAvPjwvbGk+LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBrZXkgb2YgdGhlIE1lbWJlckV2ZW50TGlzdFN1bW1hcnkgZG9lcyBub3QgY2hhbmdlIHdpdGggbmV3XG4gICAgICAgIC8vIG1lbWJlciBldmVudHMuIFRoaXMgd2lsbCBwcmV2ZW50IGl0IGZyb20gYmVpbmcgcmUtY3JlYXRlZCB1bm5lY2Vzc2FyaWx5LCBhbmRcbiAgICAgICAgLy8gaW5zdGVhZCB3aWxsIGFsbG93IG5ldyBwcm9wcyB0byBiZSBwcm92aWRlZC4gSW4gdHVybiwgdGhlIHNob3VsZENvbXBvbmVudFVwZGF0ZVxuICAgICAgICAvLyBtZXRob2Qgb24gTUVMUyBjYW4gYmUgdXNlZCB0byBwcmV2ZW50IHVubmVjZXNzYXJ5IHJlbmRlcmluZ3MuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdoaWxzdCBiYWNrLXBhZ2luYXRpbmcgd2l0aCBhIE1FTFMgYXQgdGhlIHRvcCBvZiB0aGUgcGFuZWwsIHByZXZFdmVudCB3aWxsIGJlIG51bGwsXG4gICAgICAgIC8vIHNvIHVzZSB0aGUga2V5IFwibWVtYmVyZXZlbnRsaXN0c3VtbWFyeS1pbml0aWFsXCIuIE90aGVyd2lzZSwgdXNlIHRoZSBJRCBvZiB0aGUgZmlyc3RcbiAgICAgICAgLy8gbWVtYmVyc2hpcCBldmVudCwgd2hpY2ggd2lsbCBub3QgY2hhbmdlIGR1cmluZyBmb3J3YXJkIHBhZ2luYXRpb24uXG4gICAgICAgIGNvbnN0IGtleSA9IFwibWVtYmVyZXZlbnRsaXN0c3VtbWFyeS1cIiArIChcbiAgICAgICAgICAgIHRoaXMucHJldkV2ZW50ID8gdGhpcy5ldmVudHNbMF0uZ2V0SWQoKSA6IFwiaW5pdGlhbFwiXG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IGhpZ2hsaWdodEluTWVscztcbiAgICAgICAgbGV0IGV2ZW50VGlsZXMgPSB0aGlzLmV2ZW50cy5tYXAoKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLmdldElkKCkgPT09IHBhbmVsLnByb3BzLmhpZ2hsaWdodGVkRXZlbnRJZCkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodEluTWVscyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJbiBvcmRlciB0byBwcmV2ZW50IERhdGVTZXBhcmF0b3JzIGZyb20gYXBwZWFyaW5nIGluIHRoZSBleHBhbmRlZCBmb3JtXG4gICAgICAgICAgICAvLyBvZiBNZW1iZXJFdmVudExpc3RTdW1tYXJ5LCByZW5kZXIgZWFjaCBtZW1iZXIgZXZlbnQgYXMgaWYgdGhlIHByZXZpb3VzXG4gICAgICAgICAgICAvLyBvbmUgd2FzIGl0c2VsZi4gVGhpcyB3YXksIHRoZSB0aW1lc3RhbXAgb2YgdGhlIHByZXZpb3VzIGV2ZW50ID09PSB0aGVcbiAgICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB0aGUgY3VycmVudCBldmVudCwgYW5kIG5vIERhdGVTZXBhcmF0b3IgaXMgaW5zZXJ0ZWQuXG4gICAgICAgICAgICByZXR1cm4gcGFuZWwuX2dldFRpbGVzRm9yRXZlbnQoZSwgZSwgZSA9PT0gbGFzdFNob3duRXZlbnQpO1xuICAgICAgICB9KS5yZWR1Y2UoKGEsIGIpID0+IGEuY29uY2F0KGIpLCBbXSk7XG5cbiAgICAgICAgaWYgKGV2ZW50VGlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudFRpbGVzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldC5wdXNoKFxuICAgICAgICAgICAgPE1lbWJlckV2ZW50TGlzdFN1bW1hcnkga2V5PXtrZXl9XG4gICAgICAgICAgICAgICAgIGV2ZW50cz17dGhpcy5ldmVudHN9XG4gICAgICAgICAgICAgICAgIG9uVG9nZ2xlPXtwYW5lbC5fb25IZWlnaHRDaGFuZ2VkfSAvLyBVcGRhdGUgc2Nyb2xsIHN0YXRlXG4gICAgICAgICAgICAgICAgIHN0YXJ0RXhwYW5kZWQ9e2hpZ2hsaWdodEluTWVsc31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgeyBldmVudFRpbGVzIH1cbiAgICAgICAgICAgIDwvTWVtYmVyRXZlbnRMaXN0U3VtbWFyeT4sXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHRoaXMucmVhZE1hcmtlcikge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy5yZWFkTWFya2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2V0TmV3UHJldkV2ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudHNbMF07XG4gICAgfVxufVxuXG4vLyBhbGwgdGhlIGdyb3VwZXIgY2xhc3NlcyB0aGF0IHdlIHVzZVxuY29uc3QgZ3JvdXBlcnMgPSBbQ3JlYXRpb25Hcm91cGVyLCBNZW1iZXJHcm91cGVyXTtcbiJdfQ==