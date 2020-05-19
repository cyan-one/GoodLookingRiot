"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHandlerTile = getHandlerTile;
exports.haveTileForEvent = haveTileForEvent;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _ReplyThread = _interopRequireDefault(require("../elements/ReplyThread"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var TextForEvent = _interopRequireWildcard(require("../../../TextForEvent"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _matrixJsSdk = require("matrix-js-sdk");

var _DateUtils = require("../../../DateUtils");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _BanList = require("../../../mjolnir/BanList");

var ObjectUtils = _interopRequireWildcard(require("../../../ObjectUtils"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _E2EIcon = require("./E2EIcon");

var _rem = _interopRequireDefault(require("../../../utils/rem"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
const eventTileTypes = {
  'm.room.message': 'messages.MessageEvent',
  'm.sticker': 'messages.MessageEvent',
  'm.key.verification.cancel': 'messages.MKeyVerificationConclusion',
  'm.key.verification.done': 'messages.MKeyVerificationConclusion',
  'm.room.encryption': 'messages.EncryptionEvent',
  'm.call.invite': 'messages.TextualEvent',
  'm.call.answer': 'messages.TextualEvent',
  'm.call.hangup': 'messages.TextualEvent'
};
const stateEventTileTypes = {
  'm.room.encryption': 'messages.EncryptionEvent',
  'm.room.canonical_alias': 'messages.TextualEvent',
  'm.room.create': 'messages.RoomCreate',
  'm.room.member': 'messages.TextualEvent',
  'm.room.name': 'messages.TextualEvent',
  'm.room.avatar': 'messages.RoomAvatarEvent',
  'm.room.third_party_invite': 'messages.TextualEvent',
  'm.room.history_visibility': 'messages.TextualEvent',
  'm.room.topic': 'messages.TextualEvent',
  'm.room.power_levels': 'messages.TextualEvent',
  'm.room.pinned_events': 'messages.TextualEvent',
  'm.room.server_acl': 'messages.TextualEvent',
  // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
  'im.vector.modular.widgets': 'messages.TextualEvent',
  'm.room.tombstone': 'messages.TextualEvent',
  'm.room.join_rules': 'messages.TextualEvent',
  'm.room.guest_access': 'messages.TextualEvent',
  'm.room.related_groups': 'messages.TextualEvent'
}; // Add all the Mjolnir stuff to the renderer

for (const evType of _BanList.ALL_RULE_TYPES) {
  stateEventTileTypes[evType] = 'messages.TextualEvent';
}

function getHandlerTile(ev) {
  const type = ev.getType(); // don't show verification requests we're not involved in,
  // not even when showing hidden events

  if (type === "m.room.message") {
    const content = ev.getContent();

    if (content && content.msgtype === "m.key.verification.request") {
      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const me = client && client.getUserId();

      if (ev.getSender() !== me && content.to !== me) {
        return undefined;
      } else {
        return "messages.MKeyVerificationRequest";
      }
    }
  } // these events are sent by both parties during verification, but we only want to render one
  // tile once the verification concludes, so filter out the one from the other party.


  if (type === "m.key.verification.done") {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const me = client && client.getUserId();

    if (ev.getSender() !== me) {
      return undefined;
    }
  } // sometimes MKeyVerificationConclusion declines to render.  Jankily decline to render and
  // fall back to showing hidden events, if we're viewing hidden events
  // XXX: This is extremely a hack. Possibly these components should have an interface for
  // declining to render?


  if (type === "m.key.verification.cancel" && _SettingsStore.default.getValue("showHiddenEventsInTimeline")) {
    const MKeyVerificationConclusion = sdk.getComponent("messages.MKeyVerificationConclusion");

    if (!MKeyVerificationConclusion.prototype._shouldRender.call(null, ev, ev.request)) {
      return;
    }
  }

  return ev.isState() ? stateEventTileTypes[type] : eventTileTypes[type];
}

const MAX_READ_AVATARS = 5; // Our component structure for EventTiles on the timeline is:
//
// .-EventTile------------------------------------------------.
// | MemberAvatar (SenderProfile)                   TimeStamp |
// |    .-{Message,Textual}Event---------------. Read Avatars |
// |    |   .-MFooBody-------------------.     |              |
// |    |   |  (only if MessageEvent)    |     |              |
// |    |   '----------------------------'     |              |
// |    '--------------------------------------'              |
// '----------------------------------------------------------'

var _default = (0, _createReactClass.default)({
  displayName: 'EventTile',
  propTypes: {
    /* the MatrixEvent to show */
    mxEvent: _propTypes.default.object.isRequired,

    /* true if mxEvent is redacted. This is a prop because using mxEvent.isRedacted()
     * might not be enough when deciding shouldComponentUpdate - prevProps.mxEvent
     * references the same this.props.mxEvent.
     */
    isRedacted: _propTypes.default.bool,

    /* true if this is a continuation of the previous event (which has the
     * effect of not showing another avatar/displayname
     */
    continuation: _propTypes.default.bool,

    /* true if this is the last event in the timeline (which has the effect
     * of always showing the timestamp)
     */
    last: _propTypes.default.bool,

    /* true if this is search context (which has the effect of greying out
     * the text
     */
    contextual: _propTypes.default.bool,

    /* a list of words to highlight, ordered by longest first */
    highlights: _propTypes.default.array,

    /* link URL for the highlights */
    highlightLink: _propTypes.default.string,

    /* should show URL previews for this event */
    showUrlPreview: _propTypes.default.bool,

    /* is this the focused event */
    isSelectedEvent: _propTypes.default.bool,

    /* callback called when dynamic content in events are loaded */
    onHeightChanged: _propTypes.default.func,

    /* a list of read-receipts we should show. Each object has a 'roomMember' and 'ts'. */
    readReceipts: _propTypes.default.arrayOf(_propTypes.default.object),

    /* opaque readreceipt info for each userId; used by ReadReceiptMarker
     * to manage its animations. Should be an empty object when the room
     * first loads
     */
    readReceiptMap: _propTypes.default.object,

    /* A function which is used to check if the parent panel is being
     * unmounted, to avoid unnecessary work. Should return true if we
     * are being unmounted.
     */
    checkUnmounting: _propTypes.default.func,

    /* the status of this event - ie, mxEvent.status. Denormalised to here so
     * that we can tell when it changes. */
    eventSendStatus: _propTypes.default.string,

    /* the shape of the tile. by default, the layout is intended for the
     * normal room timeline.  alternative values are: "file_list", "file_grid"
     * and "notif".  This could be done by CSS, but it'd be horribly inefficient.
     * It could also be done by subclassing EventTile, but that'd be quite
     * boiilerplatey.  So just make the necessary render decisions conditional
     * for now.
     */
    tileShape: _propTypes.default.string,
    // show twelve hour timestamps
    isTwelveHour: _propTypes.default.bool,
    // helper function to access relations for this event
    getRelationsForEvent: _propTypes.default.func,
    // whether to show reactions for this event
    showReactions: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      // no-op function because onHeightChanged is optional yet some sub-components assume its existence
      onHeightChanged: function () {}
    };
  },
  getInitialState: function () {
    return {
      // Whether the action bar is focused.
      actionBarFocused: false,
      // Whether all read receipts are being displayed. If not, only display
      // a truncation of them.
      allReadAvatars: false,
      // Whether the event's sender has been verified.
      verified: null,
      // Whether onRequestKeysClick has been called since mounting.
      previouslyRequestedKeys: false,
      // The Relations model from the JS SDK for reactions to `mxEvent`
      reactions: this.getReactions()
    };
  },
  statics: {
    contextType: _MatrixClientContext.default
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    // don't do RR animations until we are mounted
    this._suppressReadReceiptAnimation = true;

    this._verifyEvent(this.props.mxEvent);

    this._tile = (0, _react.createRef)();
    this._replyThread = (0, _react.createRef)();
  },
  componentDidMount: function () {
    this._suppressReadReceiptAnimation = false;
    const client = this.context;
    client.on("deviceVerificationChanged", this.onDeviceVerificationChanged);
    client.on("userTrustStatusChanged", this.onUserVerificationChanged);
    this.props.mxEvent.on("Event.decrypted", this._onDecrypted);

    if (this.props.showReactions) {
      this.props.mxEvent.on("Event.relationsCreated", this._onReactionsCreated);
    }
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (nextProps) {
    // re-check the sender verification as outgoing events progress through
    // the send process.
    if (nextProps.eventSendStatus !== this.props.eventSendStatus) {
      this._verifyEvent(nextProps.mxEvent);
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (!ObjectUtils.shallowEqual(this.state, nextState)) {
      return true;
    }

    return !this._propsEqual(this.props, nextProps);
  },
  componentWillUnmount: function () {
    const client = this.context;
    client.removeListener("deviceVerificationChanged", this.onDeviceVerificationChanged);
    client.removeListener("userTrustStatusChanged", this.onUserVerificationChanged);
    this.props.mxEvent.removeListener("Event.decrypted", this._onDecrypted);

    if (this.props.showReactions) {
      this.props.mxEvent.removeListener("Event.relationsCreated", this._onReactionsCreated);
    }
  },

  /** called when the event is decrypted after we show it.
   */
  _onDecrypted: function () {
    // we need to re-verify the sending device.
    // (we call onHeightChanged in _verifyEvent to handle the case where decryption
    // has caused a change in size of the event tile)
    this._verifyEvent(this.props.mxEvent);

    this.forceUpdate();
  },
  onDeviceVerificationChanged: function (userId, device) {
    if (userId === this.props.mxEvent.getSender()) {
      this._verifyEvent(this.props.mxEvent);
    }
  },
  onUserVerificationChanged: function (userId, _trustStatus) {
    if (userId === this.props.mxEvent.getSender()) {
      this._verifyEvent(this.props.mxEvent);
    }
  },
  _verifyEvent: async function (mxEvent) {
    if (!mxEvent.isEncrypted()) {
      return;
    } // If we directly trust the device, short-circuit here


    const verified = await this.context.isEventSenderVerified(mxEvent);

    if (verified) {
      this.setState({
        verified: _E2EIcon.E2E_STATE.VERIFIED
      }, () => {
        // Decryption may have caused a change in size
        this.props.onHeightChanged();
      });
      return;
    } // If cross-signing is off, the old behaviour is to scream at the user
    // as if they've done something wrong, which they haven't


    if (!_SettingsStore.default.getValue("feature_cross_signing")) {
      this.setState({
        verified: _E2EIcon.E2E_STATE.WARNING
      }, this.props.onHeightChanged);
      return;
    }

    if (!this.context.checkUserTrust(mxEvent.getSender()).isCrossSigningVerified()) {
      this.setState({
        verified: _E2EIcon.E2E_STATE.NORMAL
      }, this.props.onHeightChanged);
      return;
    }

    const eventSenderTrust = await this.context.checkEventSenderTrust(mxEvent);

    if (!eventSenderTrust) {
      this.setState({
        verified: _E2EIcon.E2E_STATE.UNKNOWN
      }, this.props.onHeightChanged); // Decryption may have cause a change in size

      return;
    }

    this.setState({
      verified: eventSenderTrust.isVerified() ? _E2EIcon.E2E_STATE.VERIFIED : _E2EIcon.E2E_STATE.WARNING
    }, this.props.onHeightChanged); // Decryption may have caused a change in size
  },
  _propsEqual: function (objA, objB) {
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (let i = 0; i < keysA.length; i++) {
      const key = keysA[i];

      if (!objB.hasOwnProperty(key)) {
        return false;
      } // need to deep-compare readReceipts


      if (key === 'readReceipts') {
        const rA = objA[key];
        const rB = objB[key];

        if (rA === rB) {
          continue;
        }

        if (!rA || !rB) {
          return false;
        }

        if (rA.length !== rB.length) {
          return false;
        }

        for (let j = 0; j < rA.length; j++) {
          if (rA[j].userId !== rB[j].userId) {
            return false;
          } // one has a member set and the other doesn't?


          if (rA[j].roomMember !== rB[j].roomMember) {
            return false;
          }
        }
      } else {
        if (objA[key] !== objB[key]) {
          return false;
        }
      }
    }

    return true;
  },
  shouldHighlight: function () {
    const actions = this.context.getPushActionsForEvent(this.props.mxEvent);

    if (!actions || !actions.tweaks) {
      return false;
    } // don't show self-highlights from another of our clients


    if (this.props.mxEvent.getSender() === this.context.credentials.userId) {
      return false;
    }

    return actions.tweaks.highlight;
  },
  toggleAllReadAvatars: function () {
    this.setState({
      allReadAvatars: !this.state.allReadAvatars
    });
  },
  getReadAvatars: function () {
    // return early if there are no read receipts
    if (!this.props.readReceipts || this.props.readReceipts.length === 0) {
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_EventTile_readAvatars"
      });
    }

    const ReadReceiptMarker = sdk.getComponent('rooms.ReadReceiptMarker');
    const avatars = [];
    const receiptOffset = 15;
    let left = 0;
    const receipts = this.props.readReceipts || [];

    for (let i = 0; i < receipts.length; ++i) {
      const receipt = receipts[i];
      let hidden = true;

      if (i < MAX_READ_AVATARS || this.state.allReadAvatars) {
        hidden = false;
      } // TODO: we keep the extra read avatars in the dom to make animation simpler
      // we could optimise this to reduce the dom size.
      // If hidden, set offset equal to the offset of the final visible avatar or
      // else set it proportional to index


      left = (hidden ? MAX_READ_AVATARS - 1 : i) * -receiptOffset;
      const userId = receipt.userId;
      let readReceiptInfo;

      if (this.props.readReceiptMap) {
        readReceiptInfo = this.props.readReceiptMap[userId];

        if (!readReceiptInfo) {
          readReceiptInfo = {};
          this.props.readReceiptMap[userId] = readReceiptInfo;
        }
      } // add to the start so the most recent is on the end (ie. ends up rightmost)


      avatars.unshift( /*#__PURE__*/_react.default.createElement(ReadReceiptMarker, {
        key: userId,
        member: receipt.roomMember,
        fallbackUserId: userId,
        leftOffset: left,
        hidden: hidden,
        readReceiptInfo: readReceiptInfo,
        checkUnmounting: this.props.checkUnmounting,
        suppressAnimation: this._suppressReadReceiptAnimation,
        onClick: this.toggleAllReadAvatars,
        timestamp: receipt.ts,
        showTwelveHour: this.props.isTwelveHour
      }));
    }

    let remText;

    if (!this.state.allReadAvatars) {
      const remainder = receipts.length - MAX_READ_AVATARS;

      if (remainder > 0) {
        remText = /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_EventTile_readAvatarRemainder",
          onClick: this.toggleAllReadAvatars,
          style: {
            right: "calc(" + (0, _rem.default)(-left) + " + " + receiptOffset + "px)"
          }
        }, remainder, "+");
      }
    }

    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EventTile_readAvatars"
    }, remText, avatars);
  },
  onSenderProfileClick: function (event) {
    const mxEvent = this.props.mxEvent;

    _dispatcher.default.dispatch({
      action: 'insert_mention',
      user_id: mxEvent.getSender()
    });
  },
  onRequestKeysClick: function () {
    this.setState({
      // Indicate in the UI that the keys have been requested (this is expected to
      // be reset if the component is mounted in the future).
      previouslyRequestedKeys: true
    }); // Cancel any outgoing key request for this event and resend it. If a response
    // is received for the request with the required keys, the event could be
    // decrypted successfully.

    this.context.cancelAndResendEventRoomKeyRequest(this.props.mxEvent);
  },
  onPermalinkClicked: function (e) {
    // This allows the permalink to be opened in a new tab/window or copied as
    // matrix.to, but also for it to enable routing within Riot when clicked.
    e.preventDefault();

    _dispatcher.default.dispatch({
      action: 'view_room',
      event_id: this.props.mxEvent.getId(),
      highlighted: true,
      room_id: this.props.mxEvent.getRoomId()
    });
  },
  _renderE2EPadlock: function () {
    const ev = this.props.mxEvent; // event could not be decrypted

    if (ev.getContent().msgtype === 'm.bad.encrypted') {
      return /*#__PURE__*/_react.default.createElement(E2ePadlockUndecryptable, null);
    } // event is encrypted, display padlock corresponding to whether or not it is verified


    if (ev.isEncrypted()) {
      if (this.state.verified === _E2EIcon.E2E_STATE.NORMAL) {
        return; // no icon if we've not even cross-signed the user
      } else if (this.state.verified === _E2EIcon.E2E_STATE.VERIFIED) {
        return; // no icon for verified
      } else if (this.state.verified === _E2EIcon.E2E_STATE.UNKNOWN) {
        return /*#__PURE__*/_react.default.createElement(E2ePadlockUnknown, null);
      } else {
        return /*#__PURE__*/_react.default.createElement(E2ePadlockUnverified, null);
      }
    }

    if (this.context.isRoomEncrypted(ev.getRoomId())) {
      // else if room is encrypted
      // and event is being encrypted or is not_sent (Unknown Devices/Network Error)
      if (ev.status === _matrixJsSdk.EventStatus.ENCRYPTING) {
        return;
      }

      if (ev.status === _matrixJsSdk.EventStatus.NOT_SENT) {
        return;
      }

      if (ev.isState()) {
        return; // we expect this to be unencrypted
      } // if the event is not encrypted, but it's an e2e room, show the open padlock


      return /*#__PURE__*/_react.default.createElement(E2ePadlockUnencrypted, null);
    } // no padlock needed


    return null;
  },

  onActionBarFocusChange(focused) {
    this.setState({
      actionBarFocused: focused
    });
  },

  getTile() {
    return this._tile.current;
  },

  getReplyThread() {
    return this._replyThread.current;
  },

  getReactions() {
    if (!this.props.showReactions || !this.props.getRelationsForEvent) {
      return null;
    }

    const eventId = this.props.mxEvent.getId();

    if (!eventId) {
      // XXX: Temporary diagnostic logging for https://github.com/vector-im/riot-web/issues/11120
      console.error("EventTile attempted to get relations for an event without an ID"); // Use event's special `toJSON` method to log key data.

      console.log(JSON.stringify(this.props.mxEvent, null, 4));
      console.trace("Stacktrace for https://github.com/vector-im/riot-web/issues/11120");
    }

    return this.props.getRelationsForEvent(eventId, "m.annotation", "m.reaction");
  },

  _onReactionsCreated(relationType, eventType) {
    if (relationType !== "m.annotation" || eventType !== "m.reaction") {
      return;
    }

    this.props.mxEvent.removeListener("Event.relationsCreated", this._onReactionsCreated);
    this.setState({
      reactions: this.getReactions()
    });
  },

  render: function () {
    const MessageTimestamp = sdk.getComponent('messages.MessageTimestamp');
    const SenderProfile = sdk.getComponent('messages.SenderProfile');
    const MemberAvatar = sdk.getComponent('avatars.MemberAvatar'); //console.info("EventTile showUrlPreview for %s is %s", this.props.mxEvent.getId(), this.props.showUrlPreview);

    const content = this.props.mxEvent.getContent();
    const msgtype = content.msgtype;
    const eventType = this.props.mxEvent.getType(); // Info messages are basically information about commands processed on a room

    const isBubbleMessage = eventType.startsWith("m.key.verification") || eventType === "m.room.message" && msgtype && msgtype.startsWith("m.key.verification") || eventType === "m.room.encryption";
    let isInfoMessage = !isBubbleMessage && eventType !== 'm.room.message' && eventType !== 'm.sticker' && eventType !== 'm.room.create';
    let tileHandler = getHandlerTile(this.props.mxEvent); // If we're showing hidden events in the timeline, we should use the
    // source tile when there's no regular tile for an event and also for
    // replace relations (which otherwise would display as a confusing
    // duplicate of the thing they are replacing).

    const useSource = !tileHandler || this.props.mxEvent.isRelation("m.replace");

    if (useSource && _SettingsStore.default.getValue("showHiddenEventsInTimeline")) {
      tileHandler = "messages.ViewSourceEvent"; // Reuse info message avatar and sender profile styling

      isInfoMessage = true;
    } // This shouldn't happen: the caller should check we support this type
    // before trying to instantiate us


    if (!tileHandler) {
      const {
        mxEvent
      } = this.props;
      console.warn("Event type not supported: type:".concat(mxEvent.getType(), " isState:").concat(mxEvent.isState()));
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EventTile mx_EventTile_info mx_MNoticeBody"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EventTile_line"
      }, (0, _languageHandler._t)('This event could not be displayed')));
    }

    const EventTileType = sdk.getComponent(tileHandler);
    const isSending = ['sending', 'queued', 'encrypting'].indexOf(this.props.eventSendStatus) !== -1;
    const isRedacted = isMessageEvent(this.props.mxEvent) && this.props.isRedacted;
    const isEncryptionFailure = this.props.mxEvent.isDecryptionFailure();
    const isEditing = !!this.props.editState;
    const classes = (0, _classnames.default)({
      mx_EventTile_bubbleContainer: isBubbleMessage,
      mx_EventTile: true,
      mx_EventTile_isEditing: isEditing,
      mx_EventTile_info: isInfoMessage,
      mx_EventTile_12hr: this.props.isTwelveHour,
      mx_EventTile_encrypting: this.props.eventSendStatus === 'encrypting',
      mx_EventTile_sending: !isEditing && isSending,
      mx_EventTile_notSent: this.props.eventSendStatus === 'not_sent',
      mx_EventTile_highlight: this.props.tileShape === 'notif' ? false : this.shouldHighlight(),
      mx_EventTile_selected: this.props.isSelectedEvent,
      mx_EventTile_continuation: this.props.tileShape ? '' : this.props.continuation,
      mx_EventTile_last: this.props.last,
      mx_EventTile_contextual: this.props.contextual,
      mx_EventTile_actionBarFocused: this.state.actionBarFocused,
      mx_EventTile_verified: !isBubbleMessage && this.state.verified === _E2EIcon.E2E_STATE.VERIFIED,
      mx_EventTile_unverified: !isBubbleMessage && this.state.verified === _E2EIcon.E2E_STATE.WARNING,
      mx_EventTile_unknown: !isBubbleMessage && this.state.verified === _E2EIcon.E2E_STATE.UNKNOWN,
      mx_EventTile_bad: isEncryptionFailure,
      mx_EventTile_emote: msgtype === 'm.emote'
    });
    let permalink = "#";

    if (this.props.permalinkCreator) {
      permalink = this.props.permalinkCreator.forEvent(this.props.mxEvent.getId());
    }

    const readAvatars = this.getReadAvatars();
    let avatar;
    let sender;
    let avatarSize;
    let needsSenderProfile;

    if (this.props.tileShape === "notif") {
      avatarSize = 24;
      needsSenderProfile = true;
    } else if (tileHandler === 'messages.RoomCreate' || isBubbleMessage) {
      avatarSize = 0;
      needsSenderProfile = false;
    } else if (isInfoMessage) {
      // a small avatar, with no sender profile, for
      // joins/parts/etc
      avatarSize = 14;
      needsSenderProfile = false;
    } else if (this.props.continuation && this.props.tileShape !== "file_grid") {
      // no avatar or sender profile for continuation messages
      avatarSize = 0;
      needsSenderProfile = false;
    } else {
      avatarSize = 30;
      needsSenderProfile = true;
    }

    if (this.props.mxEvent.sender && avatarSize) {
      avatar = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EventTile_avatar"
      }, /*#__PURE__*/_react.default.createElement(MemberAvatar, {
        member: this.props.mxEvent.sender,
        width: avatarSize,
        height: avatarSize,
        viewUserOnClick: true
      }));
    }

    if (needsSenderProfile) {
      let text = null;

      if (!this.props.tileShape || this.props.tileShape === 'reply' || this.props.tileShape === 'reply_preview') {
        if (msgtype === 'm.image') text = (0, _languageHandler._td)('%(senderName)s sent an image');else if (msgtype === 'm.video') text = (0, _languageHandler._td)('%(senderName)s sent a video');else if (msgtype === 'm.file') text = (0, _languageHandler._td)('%(senderName)s uploaded a file');
        sender = /*#__PURE__*/_react.default.createElement(SenderProfile, {
          onClick: this.onSenderProfileClick,
          mxEvent: this.props.mxEvent,
          enableFlair: !text,
          text: text
        });
      } else {
        sender = /*#__PURE__*/_react.default.createElement(SenderProfile, {
          mxEvent: this.props.mxEvent,
          enableFlair: true
        });
      }
    }

    const MessageActionBar = sdk.getComponent('messages.MessageActionBar');
    const actionBar = !isEditing ? /*#__PURE__*/_react.default.createElement(MessageActionBar, {
      mxEvent: this.props.mxEvent,
      reactions: this.state.reactions,
      permalinkCreator: this.props.permalinkCreator,
      getTile: this.getTile,
      getReplyThread: this.getReplyThread,
      onFocusChange: this.onActionBarFocusChange
    }) : undefined;
    const timestamp = this.props.mxEvent.getTs() ? /*#__PURE__*/_react.default.createElement(MessageTimestamp, {
      showTwelveHour: this.props.isTwelveHour,
      ts: this.props.mxEvent.getTs()
    }) : null;

    const keyRequestHelpText = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EventTile_keyRequestInfo_tooltip_contents"
    }, /*#__PURE__*/_react.default.createElement("p", null, this.state.previouslyRequestedKeys ? (0, _languageHandler._t)('Your key share request has been sent - please check your other sessions ' + 'for key share requests.') : (0, _languageHandler._t)('Key share requests are sent to your other sessions automatically. If you ' + 'rejected or dismissed the key share request on your other sessions, click ' + 'here to request the keys for this session again.')), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('If your other sessions do not have the key for this message you will not ' + 'be able to decrypt them.')));

    const keyRequestInfoContent = this.state.previouslyRequestedKeys ? (0, _languageHandler._t)('Key request sent.') : (0, _languageHandler._t)('<requestLink>Re-request encryption keys</requestLink> from your other sessions.', {}, {
      'requestLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        onClick: this.onRequestKeysClick
      }, sub)
    });
    const TooltipButton = sdk.getComponent('elements.TooltipButton');
    const keyRequestInfo = isEncryptionFailure ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EventTile_keyRequestInfo"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EventTile_keyRequestInfo_text"
    }, keyRequestInfoContent), /*#__PURE__*/_react.default.createElement(TooltipButton, {
      helpText: keyRequestHelpText
    })) : null;
    let reactionsRow;

    if (!isRedacted) {
      const ReactionsRow = sdk.getComponent('messages.ReactionsRow');
      reactionsRow = /*#__PURE__*/_react.default.createElement(ReactionsRow, {
        mxEvent: this.props.mxEvent,
        reactions: this.state.reactions
      });
    }

    switch (this.props.tileShape) {
      case 'notif':
        {
          const room = this.context.getRoom(this.props.mxEvent.getRoomId());
          return /*#__PURE__*/_react.default.createElement("div", {
            className: classes
          }, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_roomName"
          }, /*#__PURE__*/_react.default.createElement("a", {
            href: permalink,
            onClick: this.onPermalinkClicked
          }, room ? room.name : '')), /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_senderDetails"
          }, avatar, /*#__PURE__*/_react.default.createElement("a", {
            href: permalink,
            onClick: this.onPermalinkClicked
          }, sender, timestamp)), /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_line"
          }, /*#__PURE__*/_react.default.createElement(EventTileType, {
            ref: this._tile,
            mxEvent: this.props.mxEvent,
            highlights: this.props.highlights,
            highlightLink: this.props.highlightLink,
            showUrlPreview: this.props.showUrlPreview,
            onHeightChanged: this.props.onHeightChanged
          })));
        }

      case 'file_grid':
        {
          return /*#__PURE__*/_react.default.createElement("div", {
            className: classes
          }, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_line"
          }, /*#__PURE__*/_react.default.createElement(EventTileType, {
            ref: this._tile,
            mxEvent: this.props.mxEvent,
            highlights: this.props.highlights,
            highlightLink: this.props.highlightLink,
            showUrlPreview: this.props.showUrlPreview,
            tileShape: this.props.tileShape,
            onHeightChanged: this.props.onHeightChanged
          })), /*#__PURE__*/_react.default.createElement("a", {
            className: "mx_EventTile_senderDetailsLink",
            href: permalink,
            onClick: this.onPermalinkClicked
          }, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_senderDetails"
          }, sender, timestamp)));
        }

      case 'reply':
      case 'reply_preview':
        {
          let thread;

          if (this.props.tileShape === 'reply_preview') {
            thread = _ReplyThread.default.makeThread(this.props.mxEvent, this.props.onHeightChanged, this.props.permalinkCreator, this._replyThread);
          }

          return /*#__PURE__*/_react.default.createElement("div", {
            className: classes
          }, avatar, sender, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_reply"
          }, /*#__PURE__*/_react.default.createElement("a", {
            href: permalink,
            onClick: this.onPermalinkClicked
          }, timestamp), !isBubbleMessage && this._renderE2EPadlock(), thread, /*#__PURE__*/_react.default.createElement(EventTileType, {
            ref: this._tile,
            mxEvent: this.props.mxEvent,
            highlights: this.props.highlights,
            highlightLink: this.props.highlightLink,
            onHeightChanged: this.props.onHeightChanged,
            showUrlPreview: false
          })));
        }

      default:
        {
          const thread = _ReplyThread.default.makeThread(this.props.mxEvent, this.props.onHeightChanged, this.props.permalinkCreator, this._replyThread); // tab-index=-1 to allow it to be focusable but do not add tab stop for it, primarily for screen readers


          return /*#__PURE__*/_react.default.createElement("div", {
            className: classes,
            tabIndex: -1
          }, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_msgOption"
          }, readAvatars), sender, /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_EventTile_line"
          }, /*#__PURE__*/_react.default.createElement("a", {
            href: permalink,
            onClick: this.onPermalinkClicked,
            "aria-label": (0, _DateUtils.formatTime)(new Date(this.props.mxEvent.getTs()), this.props.isTwelveHour)
          }, timestamp), !isBubbleMessage && this._renderE2EPadlock(), thread, /*#__PURE__*/_react.default.createElement(EventTileType, {
            ref: this._tile,
            mxEvent: this.props.mxEvent,
            replacingEventId: this.props.replacingEventId,
            editState: this.props.editState,
            highlights: this.props.highlights,
            highlightLink: this.props.highlightLink,
            showUrlPreview: this.props.showUrlPreview,
            onHeightChanged: this.props.onHeightChanged
          }), keyRequestInfo, reactionsRow, actionBar), avatar);
        }
    }
  }
}); // XXX this'll eventually be dynamic based on the fields once we have extensible event types


exports.default = _default;
const messageTypes = ['m.room.message', 'm.sticker'];

function isMessageEvent(ev) {
  return messageTypes.includes(ev.getType());
}

function haveTileForEvent(e) {
  // Only messages have a tile (black-rectangle) if redacted
  if (e.isRedacted() && !isMessageEvent(e)) return false; // No tile for replacement events since they update the original tile

  if (e.isRelation("m.replace")) return false;
  const handler = getHandlerTile(e);
  if (handler === undefined) return false;

  if (handler === 'messages.TextualEvent') {
    return TextForEvent.textForEvent(e) !== '';
  } else if (handler === 'messages.RoomCreate') {
    return Boolean(e.getContent()['predecessor']);
  } else {
    return true;
  }
}

function E2ePadlockUndecryptable(props) {
  return /*#__PURE__*/_react.default.createElement(E2ePadlock, (0, _extends2.default)({
    title: (0, _languageHandler._t)("This message cannot be decrypted"),
    icon: "undecryptable"
  }, props));
}

function E2ePadlockUnverified(props) {
  return /*#__PURE__*/_react.default.createElement(E2ePadlock, (0, _extends2.default)({
    title: (0, _languageHandler._t)("Encrypted by an unverified session"),
    icon: "unverified"
  }, props));
}

function E2ePadlockUnencrypted(props) {
  return /*#__PURE__*/_react.default.createElement(E2ePadlock, (0, _extends2.default)({
    title: (0, _languageHandler._t)("Unencrypted"),
    icon: "unencrypted"
  }, props));
}

function E2ePadlockUnknown(props) {
  return /*#__PURE__*/_react.default.createElement(E2ePadlock, (0, _extends2.default)({
    title: (0, _languageHandler._t)("Encrypted by a deleted session"),
    icon: "unknown"
  }, props));
}

class E2ePadlock extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onHoverStart", () => {
      this.setState({
        hover: true
      });
    });
    (0, _defineProperty2.default)(this, "onHoverEnd", () => {
      this.setState({
        hover: false
      });
    });
    this.state = {
      hover: false
    };
  }

  render() {
    let tooltip = null;

    if (this.state.hover) {
      const Tooltip = sdk.getComponent("elements.Tooltip");
      tooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        className: "mx_EventTile_e2eIcon_tooltip",
        label: this.props.title,
        dir: "auto"
      });
    }

    let classes = "mx_EventTile_e2eIcon mx_EventTile_e2eIcon_".concat(this.props.icon);

    if (!_SettingsStore.default.getValue("alwaysShowEncryptionIcons")) {
      classes += ' mx_EventTile_e2eIcon_hidden';
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes,
      onClick: this.onClick,
      onMouseEnter: this.onHoverStart,
      onMouseLeave: this.onHoverEnd
    }, tooltip);
  }

}

(0, _defineProperty2.default)(E2ePadlock, "propTypes", {
  icon: _propTypes.default.string.isRequired,
  title: _propTypes.default.string.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0V2ZW50VGlsZS5qcyJdLCJuYW1lcyI6WyJldmVudFRpbGVUeXBlcyIsInN0YXRlRXZlbnRUaWxlVHlwZXMiLCJldlR5cGUiLCJBTExfUlVMRV9UWVBFUyIsImdldEhhbmRsZXJUaWxlIiwiZXYiLCJ0eXBlIiwiZ2V0VHlwZSIsImNvbnRlbnQiLCJnZXRDb250ZW50IiwibXNndHlwZSIsImNsaWVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm1lIiwiZ2V0VXNlcklkIiwiZ2V0U2VuZGVyIiwidG8iLCJ1bmRlZmluZWQiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJNS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvbiIsInNkayIsImdldENvbXBvbmVudCIsInByb3RvdHlwZSIsIl9zaG91bGRSZW5kZXIiLCJjYWxsIiwicmVxdWVzdCIsImlzU3RhdGUiLCJNQVhfUkVBRF9BVkFUQVJTIiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJteEV2ZW50IiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImlzUmVkYWN0ZWQiLCJib29sIiwiY29udGludWF0aW9uIiwibGFzdCIsImNvbnRleHR1YWwiLCJoaWdobGlnaHRzIiwiYXJyYXkiLCJoaWdobGlnaHRMaW5rIiwic3RyaW5nIiwic2hvd1VybFByZXZpZXciLCJpc1NlbGVjdGVkRXZlbnQiLCJvbkhlaWdodENoYW5nZWQiLCJmdW5jIiwicmVhZFJlY2VpcHRzIiwiYXJyYXlPZiIsInJlYWRSZWNlaXB0TWFwIiwiY2hlY2tVbm1vdW50aW5nIiwiZXZlbnRTZW5kU3RhdHVzIiwidGlsZVNoYXBlIiwiaXNUd2VsdmVIb3VyIiwiZ2V0UmVsYXRpb25zRm9yRXZlbnQiLCJzaG93UmVhY3Rpb25zIiwiZ2V0RGVmYXVsdFByb3BzIiwiZ2V0SW5pdGlhbFN0YXRlIiwiYWN0aW9uQmFyRm9jdXNlZCIsImFsbFJlYWRBdmF0YXJzIiwidmVyaWZpZWQiLCJwcmV2aW91c2x5UmVxdWVzdGVkS2V5cyIsInJlYWN0aW9ucyIsImdldFJlYWN0aW9ucyIsInN0YXRpY3MiLCJjb250ZXh0VHlwZSIsIk1hdHJpeENsaWVudENvbnRleHQiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiX3N1cHByZXNzUmVhZFJlY2VpcHRBbmltYXRpb24iLCJfdmVyaWZ5RXZlbnQiLCJwcm9wcyIsIl90aWxlIiwiX3JlcGx5VGhyZWFkIiwiY29tcG9uZW50RGlkTW91bnQiLCJjb250ZXh0Iiwib24iLCJvbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQiLCJvblVzZXJWZXJpZmljYXRpb25DaGFuZ2VkIiwiX29uRGVjcnlwdGVkIiwiX29uUmVhY3Rpb25zQ3JlYXRlZCIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV4dFByb3BzIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwibmV4dFN0YXRlIiwiT2JqZWN0VXRpbHMiLCJzaGFsbG93RXF1YWwiLCJzdGF0ZSIsIl9wcm9wc0VxdWFsIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVMaXN0ZW5lciIsImZvcmNlVXBkYXRlIiwidXNlcklkIiwiZGV2aWNlIiwiX3RydXN0U3RhdHVzIiwiaXNFbmNyeXB0ZWQiLCJpc0V2ZW50U2VuZGVyVmVyaWZpZWQiLCJzZXRTdGF0ZSIsIkUyRV9TVEFURSIsIlZFUklGSUVEIiwiV0FSTklORyIsImNoZWNrVXNlclRydXN0IiwiaXNDcm9zc1NpZ25pbmdWZXJpZmllZCIsIk5PUk1BTCIsImV2ZW50U2VuZGVyVHJ1c3QiLCJjaGVja0V2ZW50U2VuZGVyVHJ1c3QiLCJVTktOT1dOIiwiaXNWZXJpZmllZCIsIm9iakEiLCJvYmpCIiwia2V5c0EiLCJPYmplY3QiLCJrZXlzIiwia2V5c0IiLCJsZW5ndGgiLCJpIiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJyQSIsInJCIiwiaiIsInJvb21NZW1iZXIiLCJzaG91bGRIaWdobGlnaHQiLCJhY3Rpb25zIiwiZ2V0UHVzaEFjdGlvbnNGb3JFdmVudCIsInR3ZWFrcyIsImNyZWRlbnRpYWxzIiwiaGlnaGxpZ2h0IiwidG9nZ2xlQWxsUmVhZEF2YXRhcnMiLCJnZXRSZWFkQXZhdGFycyIsIlJlYWRSZWNlaXB0TWFya2VyIiwiYXZhdGFycyIsInJlY2VpcHRPZmZzZXQiLCJsZWZ0IiwicmVjZWlwdHMiLCJyZWNlaXB0IiwiaGlkZGVuIiwicmVhZFJlY2VpcHRJbmZvIiwidW5zaGlmdCIsInRzIiwicmVtVGV4dCIsInJlbWFpbmRlciIsInJpZ2h0Iiwib25TZW5kZXJQcm9maWxlQ2xpY2siLCJldmVudCIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwidXNlcl9pZCIsIm9uUmVxdWVzdEtleXNDbGljayIsImNhbmNlbEFuZFJlc2VuZEV2ZW50Um9vbUtleVJlcXVlc3QiLCJvblBlcm1hbGlua0NsaWNrZWQiLCJlIiwicHJldmVudERlZmF1bHQiLCJldmVudF9pZCIsImdldElkIiwiaGlnaGxpZ2h0ZWQiLCJyb29tX2lkIiwiZ2V0Um9vbUlkIiwiX3JlbmRlckUyRVBhZGxvY2siLCJpc1Jvb21FbmNyeXB0ZWQiLCJzdGF0dXMiLCJFdmVudFN0YXR1cyIsIkVOQ1JZUFRJTkciLCJOT1RfU0VOVCIsIm9uQWN0aW9uQmFyRm9jdXNDaGFuZ2UiLCJmb2N1c2VkIiwiZ2V0VGlsZSIsImN1cnJlbnQiLCJnZXRSZXBseVRocmVhZCIsImV2ZW50SWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwidHJhY2UiLCJyZWxhdGlvblR5cGUiLCJldmVudFR5cGUiLCJyZW5kZXIiLCJNZXNzYWdlVGltZXN0YW1wIiwiU2VuZGVyUHJvZmlsZSIsIk1lbWJlckF2YXRhciIsImlzQnViYmxlTWVzc2FnZSIsInN0YXJ0c1dpdGgiLCJpc0luZm9NZXNzYWdlIiwidGlsZUhhbmRsZXIiLCJ1c2VTb3VyY2UiLCJpc1JlbGF0aW9uIiwid2FybiIsIkV2ZW50VGlsZVR5cGUiLCJpc1NlbmRpbmciLCJpbmRleE9mIiwiaXNNZXNzYWdlRXZlbnQiLCJpc0VuY3J5cHRpb25GYWlsdXJlIiwiaXNEZWNyeXB0aW9uRmFpbHVyZSIsImlzRWRpdGluZyIsImVkaXRTdGF0ZSIsImNsYXNzZXMiLCJteF9FdmVudFRpbGVfYnViYmxlQ29udGFpbmVyIiwibXhfRXZlbnRUaWxlIiwibXhfRXZlbnRUaWxlX2lzRWRpdGluZyIsIm14X0V2ZW50VGlsZV9pbmZvIiwibXhfRXZlbnRUaWxlXzEyaHIiLCJteF9FdmVudFRpbGVfZW5jcnlwdGluZyIsIm14X0V2ZW50VGlsZV9zZW5kaW5nIiwibXhfRXZlbnRUaWxlX25vdFNlbnQiLCJteF9FdmVudFRpbGVfaGlnaGxpZ2h0IiwibXhfRXZlbnRUaWxlX3NlbGVjdGVkIiwibXhfRXZlbnRUaWxlX2NvbnRpbnVhdGlvbiIsIm14X0V2ZW50VGlsZV9sYXN0IiwibXhfRXZlbnRUaWxlX2NvbnRleHR1YWwiLCJteF9FdmVudFRpbGVfYWN0aW9uQmFyRm9jdXNlZCIsIm14X0V2ZW50VGlsZV92ZXJpZmllZCIsIm14X0V2ZW50VGlsZV91bnZlcmlmaWVkIiwibXhfRXZlbnRUaWxlX3Vua25vd24iLCJteF9FdmVudFRpbGVfYmFkIiwibXhfRXZlbnRUaWxlX2Vtb3RlIiwicGVybWFsaW5rIiwicGVybWFsaW5rQ3JlYXRvciIsImZvckV2ZW50IiwicmVhZEF2YXRhcnMiLCJhdmF0YXIiLCJzZW5kZXIiLCJhdmF0YXJTaXplIiwibmVlZHNTZW5kZXJQcm9maWxlIiwidGV4dCIsIk1lc3NhZ2VBY3Rpb25CYXIiLCJhY3Rpb25CYXIiLCJ0aW1lc3RhbXAiLCJnZXRUcyIsImtleVJlcXVlc3RIZWxwVGV4dCIsImtleVJlcXVlc3RJbmZvQ29udGVudCIsInN1YiIsIlRvb2x0aXBCdXR0b24iLCJrZXlSZXF1ZXN0SW5mbyIsInJlYWN0aW9uc1JvdyIsIlJlYWN0aW9uc1JvdyIsInJvb20iLCJnZXRSb29tIiwibmFtZSIsInRocmVhZCIsIlJlcGx5VGhyZWFkIiwibWFrZVRocmVhZCIsIkRhdGUiLCJyZXBsYWNpbmdFdmVudElkIiwibWVzc2FnZVR5cGVzIiwiaW5jbHVkZXMiLCJoYXZlVGlsZUZvckV2ZW50IiwiaGFuZGxlciIsIlRleHRGb3JFdmVudCIsInRleHRGb3JFdmVudCIsIkJvb2xlYW4iLCJFMmVQYWRsb2NrVW5kZWNyeXB0YWJsZSIsIkUyZVBhZGxvY2tVbnZlcmlmaWVkIiwiRTJlUGFkbG9ja1VuZW5jcnlwdGVkIiwiRTJlUGFkbG9ja1Vua25vd24iLCJFMmVQYWRsb2NrIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsImhvdmVyIiwidG9vbHRpcCIsIlRvb2x0aXAiLCJ0aXRsZSIsImljb24iLCJvbkNsaWNrIiwib25Ib3ZlclN0YXJ0Iiwib25Ib3ZlckVuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcENBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQ0EsTUFBTUEsY0FBYyxHQUFHO0FBQ25CLG9CQUFrQix1QkFEQztBQUVuQixlQUFhLHVCQUZNO0FBR25CLCtCQUE2QixxQ0FIVjtBQUluQiw2QkFBMkIscUNBSlI7QUFLbkIsdUJBQXFCLDBCQUxGO0FBTW5CLG1CQUFpQix1QkFORTtBQU9uQixtQkFBaUIsdUJBUEU7QUFRbkIsbUJBQWlCO0FBUkUsQ0FBdkI7QUFXQSxNQUFNQyxtQkFBbUIsR0FBRztBQUN4Qix1QkFBcUIsMEJBREc7QUFFeEIsNEJBQTBCLHVCQUZGO0FBR3hCLG1CQUFpQixxQkFITztBQUl4QixtQkFBaUIsdUJBSk87QUFLeEIsaUJBQWUsdUJBTFM7QUFNeEIsbUJBQWlCLDBCQU5PO0FBT3hCLCtCQUE2Qix1QkFQTDtBQVF4QiwrQkFBNkIsdUJBUkw7QUFTeEIsa0JBQWdCLHVCQVRRO0FBVXhCLHlCQUF1Qix1QkFWQztBQVd4QiwwQkFBd0Is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S0FBTCxDQUFXa00sSUFBM0QsQ0FBWDs7QUFDQSxRQUFJLENBQUN2UCx1QkFBY0MsUUFBZCxDQUF1QiwyQkFBdkIsQ0FBTCxFQUEwRDtBQUN0RG1MLE1BQUFBLE9BQU8sSUFBSSw4QkFBWDtBQUNIOztBQUVELHdCQUNJO0FBQ0ksTUFBQSxTQUFTLEVBQUVBLE9BRGY7QUFFSSxNQUFBLE9BQU8sRUFBRSxLQUFLb0UsT0FGbEI7QUFHSSxNQUFBLFlBQVksRUFBRSxLQUFLQyxZQUh2QjtBQUlJLE1BQUEsWUFBWSxFQUFFLEtBQUtDO0FBSnZCLE9BS0VOLE9BTEYsQ0FESjtBQVFIOztBQTFDb0M7OzhCQUFuQ0wsVSxlQUNpQjtBQUNmUSxFQUFBQSxJQUFJLEVBQUV6TyxtQkFBVVcsTUFBVixDQUFpQlQsVUFEUjtBQUVmc08sRUFBQUEsS0FBSyxFQUFFeE8sbUJBQVVXLE1BQVYsQ0FBaUJUO0FBRlQsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVwbHlUaHJlYWQgZnJvbSBcIi4uL2VsZW1lbnRzL1JlcGx5VGhyZWFkXCI7XG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IF90LCBfdGQgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgVGV4dEZvckV2ZW50IGZyb20gXCIuLi8uLi8uLi9UZXh0Rm9yRXZlbnRcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQge0V2ZW50U3RhdHVzfSBmcm9tICdtYXRyaXgtanMtc2RrJztcbmltcG9ydCB7Zm9ybWF0VGltZX0gZnJvbSBcIi4uLy4uLy4uL0RhdGVVdGlsc1wiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQge0FMTF9SVUxFX1RZUEVTfSBmcm9tIFwiLi4vLi4vLi4vbWpvbG5pci9CYW5MaXN0XCI7XG5pbXBvcnQgKiBhcyBPYmplY3RVdGlscyBmcm9tIFwiLi4vLi4vLi4vT2JqZWN0VXRpbHNcIjtcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5pbXBvcnQge0UyRV9TVEFURX0gZnJvbSBcIi4vRTJFSWNvblwiO1xuaW1wb3J0IHRvUmVtIGZyb20gXCIuLi8uLi8uLi91dGlscy9yZW1cIjtcblxuY29uc3QgZXZlbnRUaWxlVHlwZXMgPSB7XG4gICAgJ20ucm9vbS5tZXNzYWdlJzogJ21lc3NhZ2VzLk1lc3NhZ2VFdmVudCcsXG4gICAgJ20uc3RpY2tlcic6ICdtZXNzYWdlcy5NZXNzYWdlRXZlbnQnLFxuICAgICdtLmtleS52ZXJpZmljYXRpb24uY2FuY2VsJzogJ21lc3NhZ2VzLk1LZXlWZXJpZmljYXRpb25Db25jbHVzaW9uJyxcbiAgICAnbS5rZXkudmVyaWZpY2F0aW9uLmRvbmUnOiAnbWVzc2FnZXMuTUtleVZlcmlmaWNhdGlvbkNvbmNsdXNpb24nLFxuICAgICdtLnJvb20uZW5jcnlwdGlvbic6ICdtZXNzYWdlcy5FbmNyeXB0aW9uRXZlbnQnLFxuICAgICdtLmNhbGwuaW52aXRlJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20uY2FsbC5hbnN3ZXInOiAnbWVzc2FnZXMuVGV4dHVhbEV2ZW50JyxcbiAgICAnbS5jYWxsLmhhbmd1cCc6ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnLFxufTtcblxuY29uc3Qgc3RhdGVFdmVudFRpbGVUeXBlcyA9IHtcbiAgICAnbS5yb29tLmVuY3J5cHRpb24nOiAnbWVzc2FnZXMuRW5jcnlwdGlvbkV2ZW50JyxcbiAgICAnbS5yb29tLmNhbm9uaWNhbF9hbGlhcyc6ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnLFxuICAgICdtLnJvb20uY3JlYXRlJzogJ21lc3NhZ2VzLlJvb21DcmVhdGUnLFxuICAgICdtLnJvb20ubWVtYmVyJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS5uYW1lJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS5hdmF0YXInOiAnbWVzc2FnZXMuUm9vbUF2YXRhckV2ZW50JyxcbiAgICAnbS5yb29tLnRoaXJkX3BhcnR5X2ludml0ZSc6ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnLFxuICAgICdtLnJvb20uaGlzdG9yeV92aXNpYmlsaXR5JzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS50b3BpYyc6ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnLFxuICAgICdtLnJvb20ucG93ZXJfbGV2ZWxzJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS5waW5uZWRfZXZlbnRzJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS5zZXJ2ZXJfYWNsJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0ud2lkZ2V0IGV2ZW50IHR5cGUgKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzEzMTExKVxuICAgICdpbS52ZWN0b3IubW9kdWxhci53aWRnZXRzJzogJ21lc3NhZ2VzLlRleHR1YWxFdmVudCcsXG4gICAgJ20ucm9vbS50b21ic3RvbmUnOiAnbWVzc2FnZXMuVGV4dHVhbEV2ZW50JyxcbiAgICAnbS5yb29tLmpvaW5fcnVsZXMnOiAnbWVzc2FnZXMuVGV4dHVhbEV2ZW50JyxcbiAgICAnbS5yb29tLmd1ZXN0X2FjY2Vzcyc6ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnLFxuICAgICdtLnJvb20ucmVsYXRlZF9ncm91cHMnOiAnbWVzc2FnZXMuVGV4dHVhbEV2ZW50Jyxcbn07XG5cbi8vIEFkZCBhbGwgdGhlIE1qb2xuaXIgc3R1ZmYgdG8gdGhlIHJlbmRlcmVyXG5mb3IgKGNvbnN0IGV2VHlwZSBvZiBBTExfUlVMRV9UWVBFUykge1xuICAgIHN0YXRlRXZlbnRUaWxlVHlwZXNbZXZUeXBlXSA9ICdtZXNzYWdlcy5UZXh0dWFsRXZlbnQnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFuZGxlclRpbGUoZXYpIHtcbiAgICBjb25zdCB0eXBlID0gZXYuZ2V0VHlwZSgpO1xuXG4gICAgLy8gZG9uJ3Qgc2hvdyB2ZXJpZmljYXRpb24gcmVxdWVzdHMgd2UncmUgbm90IGludm9sdmVkIGluLFxuICAgIC8vIG5vdCBldmVuIHdoZW4gc2hvd2luZyBoaWRkZW4gZXZlbnRzXG4gICAgaWYgKHR5cGUgPT09IFwibS5yb29tLm1lc3NhZ2VcIikge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZXYuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoY29udGVudCAmJiBjb250ZW50Lm1zZ3R5cGUgPT09IFwibS5rZXkudmVyaWZpY2F0aW9uLnJlcXVlc3RcIikge1xuICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgY29uc3QgbWUgPSBjbGllbnQgJiYgY2xpZW50LmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgaWYgKGV2LmdldFNlbmRlcigpICE9PSBtZSAmJiBjb250ZW50LnRvICE9PSBtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm1lc3NhZ2VzLk1LZXlWZXJpZmljYXRpb25SZXF1ZXN0XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gdGhlc2UgZXZlbnRzIGFyZSBzZW50IGJ5IGJvdGggcGFydGllcyBkdXJpbmcgdmVyaWZpY2F0aW9uLCBidXQgd2Ugb25seSB3YW50IHRvIHJlbmRlciBvbmVcbiAgICAvLyB0aWxlIG9uY2UgdGhlIHZlcmlmaWNhdGlvbiBjb25jbHVkZXMsIHNvIGZpbHRlciBvdXQgdGhlIG9uZSBmcm9tIHRoZSBvdGhlciBwYXJ0eS5cbiAgICBpZiAodHlwZSA9PT0gXCJtLmtleS52ZXJpZmljYXRpb24uZG9uZVwiKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgbWUgPSBjbGllbnQgJiYgY2xpZW50LmdldFVzZXJJZCgpO1xuICAgICAgICBpZiAoZXYuZ2V0U2VuZGVyKCkgIT09IG1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc29tZXRpbWVzIE1LZXlWZXJpZmljYXRpb25Db25jbHVzaW9uIGRlY2xpbmVzIHRvIHJlbmRlci4gIEphbmtpbHkgZGVjbGluZSB0byByZW5kZXIgYW5kXG4gICAgLy8gZmFsbCBiYWNrIHRvIHNob3dpbmcgaGlkZGVuIGV2ZW50cywgaWYgd2UncmUgdmlld2luZyBoaWRkZW4gZXZlbnRzXG4gICAgLy8gWFhYOiBUaGlzIGlzIGV4dHJlbWVseSBhIGhhY2suIFBvc3NpYmx5IHRoZXNlIGNvbXBvbmVudHMgc2hvdWxkIGhhdmUgYW4gaW50ZXJmYWNlIGZvclxuICAgIC8vIGRlY2xpbmluZyB0byByZW5kZXI/XG4gICAgaWYgKHR5cGUgPT09IFwibS5rZXkudmVyaWZpY2F0aW9uLmNhbmNlbFwiICYmIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93SGlkZGVuRXZlbnRzSW5UaW1lbGluZVwiKSkge1xuICAgICAgICBjb25zdCBNS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvbiA9IHNkay5nZXRDb21wb25lbnQoXCJtZXNzYWdlcy5NS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvblwiKTtcbiAgICAgICAgaWYgKCFNS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvbi5wcm90b3R5cGUuX3Nob3VsZFJlbmRlci5jYWxsKG51bGwsIGV2LCBldi5yZXF1ZXN0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGV2LmlzU3RhdGUoKSA/IHN0YXRlRXZlbnRUaWxlVHlwZXNbdHlwZV0gOiBldmVudFRpbGVUeXBlc1t0eXBlXTtcbn1cblxuY29uc3QgTUFYX1JFQURfQVZBVEFSUyA9IDU7XG5cbi8vIE91ciBjb21wb25lbnQgc3RydWN0dXJlIGZvciBFdmVudFRpbGVzIG9uIHRoZSB0aW1lbGluZSBpczpcbi8vXG4vLyAuLUV2ZW50VGlsZS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS5cbi8vIHwgTWVtYmVyQXZhdGFyIChTZW5kZXJQcm9maWxlKSAgICAgICAgICAgICAgICAgICBUaW1lU3RhbXAgfFxuLy8gfCAgICAuLXtNZXNzYWdlLFRleHR1YWx9RXZlbnQtLS0tLS0tLS0tLS0tLS0uIFJlYWQgQXZhdGFycyB8XG4vLyB8ICAgIHwgICAuLU1Gb29Cb2R5LS0tLS0tLS0tLS0tLS0tLS0tLS4gICAgIHwgICAgICAgICAgICAgIHxcbi8vIHwgICAgfCAgIHwgIChvbmx5IGlmIE1lc3NhZ2VFdmVudCkgICAgfCAgICAgfCAgICAgICAgICAgICAgfFxuLy8gfCAgICB8ICAgJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nICAgICB8ICAgICAgICAgICAgICB8XG4vLyB8ICAgICctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScgICAgICAgICAgICAgIHxcbi8vICctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJ1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0V2ZW50VGlsZScsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLyogdGhlIE1hdHJpeEV2ZW50IHRvIHNob3cgKi9cbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8qIHRydWUgaWYgbXhFdmVudCBpcyByZWRhY3RlZC4gVGhpcyBpcyBhIHByb3AgYmVjYXVzZSB1c2luZyBteEV2ZW50LmlzUmVkYWN0ZWQoKVxuICAgICAgICAgKiBtaWdodCBub3QgYmUgZW5vdWdoIHdoZW4gZGVjaWRpbmcgc2hvdWxkQ29tcG9uZW50VXBkYXRlIC0gcHJldlByb3BzLm14RXZlbnRcbiAgICAgICAgICogcmVmZXJlbmNlcyB0aGUgc2FtZSB0aGlzLnByb3BzLm14RXZlbnQuXG4gICAgICAgICAqL1xuICAgICAgICBpc1JlZGFjdGVkOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvKiB0cnVlIGlmIHRoaXMgaXMgYSBjb250aW51YXRpb24gb2YgdGhlIHByZXZpb3VzIGV2ZW50ICh3aGljaCBoYXMgdGhlXG4gICAgICAgICAqIGVmZmVjdCBvZiBub3Qgc2hvd2luZyBhbm90aGVyIGF2YXRhci9kaXNwbGF5bmFtZVxuICAgICAgICAgKi9cbiAgICAgICAgY29udGludWF0aW9uOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvKiB0cnVlIGlmIHRoaXMgaXMgdGhlIGxhc3QgZXZlbnQgaW4gdGhlIHRpbWVsaW5lICh3aGljaCBoYXMgdGhlIGVmZmVjdFxuICAgICAgICAgKiBvZiBhbHdheXMgc2hvd2luZyB0aGUgdGltZXN0YW1wKVxuICAgICAgICAgKi9cbiAgICAgICAgbGFzdDogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLyogdHJ1ZSBpZiB0aGlzIGlzIHNlYXJjaCBjb250ZXh0ICh3aGljaCBoYXMgdGhlIGVmZmVjdCBvZiBncmV5aW5nIG91dFxuICAgICAgICAgKiB0aGUgdGV4dFxuICAgICAgICAgKi9cbiAgICAgICAgY29udGV4dHVhbDogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLyogYSBsaXN0IG9mIHdvcmRzIHRvIGhpZ2hsaWdodCwgb3JkZXJlZCBieSBsb25nZXN0IGZpcnN0ICovXG4gICAgICAgIGhpZ2hsaWdodHM6IFByb3BUeXBlcy5hcnJheSxcblxuICAgICAgICAvKiBsaW5rIFVSTCBmb3IgdGhlIGhpZ2hsaWdodHMgKi9cbiAgICAgICAgaGlnaGxpZ2h0TGluazogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvKiBzaG91bGQgc2hvdyBVUkwgcHJldmlld3MgZm9yIHRoaXMgZXZlbnQgKi9cbiAgICAgICAgc2hvd1VybFByZXZpZXc6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8qIGlzIHRoaXMgdGhlIGZvY3VzZWQgZXZlbnQgKi9cbiAgICAgICAgaXNTZWxlY3RlZEV2ZW50OiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvKiBjYWxsYmFjayBjYWxsZWQgd2hlbiBkeW5hbWljIGNvbnRlbnQgaW4gZXZlbnRzIGFyZSBsb2FkZWQgKi9cbiAgICAgICAgb25IZWlnaHRDaGFuZ2VkOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvKiBhIGxpc3Qgb2YgcmVhZC1yZWNlaXB0cyB3ZSBzaG91bGQgc2hvdy4gRWFjaCBvYmplY3QgaGFzIGEgJ3Jvb21NZW1iZXInIGFuZCAndHMnLiAqL1xuICAgICAgICByZWFkUmVjZWlwdHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5vYmplY3QpLFxuXG4gICAgICAgIC8qIG9wYXF1ZSByZWFkcmVjZWlwdCBpbmZvIGZvciBlYWNoIHVzZXJJZDsgdXNlZCBieSBSZWFkUmVjZWlwdE1hcmtlclxuICAgICAgICAgKiB0byBtYW5hZ2UgaXRzIGFuaW1hdGlvbnMuIFNob3VsZCBiZSBhbiBlbXB0eSBvYmplY3Qgd2hlbiB0aGUgcm9vbVxuICAgICAgICAgKiBmaXJzdCBsb2Fkc1xuICAgICAgICAgKi9cbiAgICAgICAgcmVhZFJlY2VpcHRNYXA6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLyogQSBmdW5jdGlvbiB3aGljaCBpcyB1c2VkIHRvIGNoZWNrIGlmIHRoZSBwYXJlbnQgcGFuZWwgaXMgYmVpbmdcbiAgICAgICAgICogdW5tb3VudGVkLCB0byBhdm9pZCB1bm5lY2Vzc2FyeSB3b3JrLiBTaG91bGQgcmV0dXJuIHRydWUgaWYgd2VcbiAgICAgICAgICogYXJlIGJlaW5nIHVubW91bnRlZC5cbiAgICAgICAgICovXG4gICAgICAgIGNoZWNrVW5tb3VudGluZzogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLyogdGhlIHN0YXR1cyBvZiB0aGlzIGV2ZW50IC0gaWUsIG14RXZlbnQuc3RhdHVzLiBEZW5vcm1hbGlzZWQgdG8gaGVyZSBzb1xuICAgICAgICAgKiB0aGF0IHdlIGNhbiB0ZWxsIHdoZW4gaXQgY2hhbmdlcy4gKi9cbiAgICAgICAgZXZlbnRTZW5kU3RhdHVzOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8qIHRoZSBzaGFwZSBvZiB0aGUgdGlsZS4gYnkgZGVmYXVsdCwgdGhlIGxheW91dCBpcyBpbnRlbmRlZCBmb3IgdGhlXG4gICAgICAgICAqIG5vcm1hbCByb29tIHRpbWVsaW5lLiAgYWx0ZXJuYXRpdmUgdmFsdWVzIGFyZTogXCJmaWxlX2xpc3RcIiwgXCJmaWxlX2dyaWRcIlxuICAgICAgICAgKiBhbmQgXCJub3RpZlwiLiAgVGhpcyBjb3VsZCBiZSBkb25lIGJ5IENTUywgYnV0IGl0J2QgYmUgaG9ycmlibHkgaW5lZmZpY2llbnQuXG4gICAgICAgICAqIEl0IGNvdWxkIGFsc28gYmUgZG9uZSBieSBzdWJjbGFzc2luZyBFdmVudFRpbGUsIGJ1dCB0aGF0J2QgYmUgcXVpdGVcbiAgICAgICAgICogYm9paWxlcnBsYXRleS4gIFNvIGp1c3QgbWFrZSB0aGUgbmVjZXNzYXJ5IHJlbmRlciBkZWNpc2lvbnMgY29uZGl0aW9uYWxcbiAgICAgICAgICogZm9yIG5vdy5cbiAgICAgICAgICovXG4gICAgICAgIHRpbGVTaGFwZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBzaG93IHR3ZWx2ZSBob3VyIHRpbWVzdGFtcHNcbiAgICAgICAgaXNUd2VsdmVIb3VyOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBoZWxwZXIgZnVuY3Rpb24gdG8gYWNjZXNzIHJlbGF0aW9ucyBmb3IgdGhpcyBldmVudFxuICAgICAgICBnZXRSZWxhdGlvbnNGb3JFdmVudDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gd2hldGhlciB0byBzaG93IHJlYWN0aW9ucyBmb3IgdGhpcyBldmVudFxuICAgICAgICBzaG93UmVhY3Rpb25zOiBQcm9wVHlwZXMuYm9vbCxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIG5vLW9wIGZ1bmN0aW9uIGJlY2F1c2Ugb25IZWlnaHRDaGFuZ2VkIGlzIG9wdGlvbmFsIHlldCBzb21lIHN1Yi1jb21wb25lbnRzIGFzc3VtZSBpdHMgZXhpc3RlbmNlXG4gICAgICAgICAgICBvbkhlaWdodENoYW5nZWQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBhY3Rpb24gYmFyIGlzIGZvY3VzZWQuXG4gICAgICAgICAgICBhY3Rpb25CYXJGb2N1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgYWxsIHJlYWQgcmVjZWlwdHMgYXJlIGJlaW5nIGRpc3BsYXllZC4gSWYgbm90LCBvbmx5IGRpc3BsYXlcbiAgICAgICAgICAgIC8vIGEgdHJ1bmNhdGlvbiBvZiB0aGVtLlxuICAgICAgICAgICAgYWxsUmVhZEF2YXRhcnM6IGZhbHNlLFxuICAgICAgICAgICAgLy8gV2hldGhlciB0aGUgZXZlbnQncyBzZW5kZXIgaGFzIGJlZW4gdmVyaWZpZWQuXG4gICAgICAgICAgICB2ZXJpZmllZDogbnVsbCxcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgb25SZXF1ZXN0S2V5c0NsaWNrIGhhcyBiZWVuIGNhbGxlZCBzaW5jZSBtb3VudGluZy5cbiAgICAgICAgICAgIHByZXZpb3VzbHlSZXF1ZXN0ZWRLZXlzOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIFRoZSBSZWxhdGlvbnMgbW9kZWwgZnJvbSB0aGUgSlMgU0RLIGZvciByZWFjdGlvbnMgdG8gYG14RXZlbnRgXG4gICAgICAgICAgICByZWFjdGlvbnM6IHRoaXMuZ2V0UmVhY3Rpb25zKCksXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgY29udGV4dFR5cGU6IE1hdHJpeENsaWVudENvbnRleHQsXG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIGNvbXBvbmVudCB3aXRoIHJlYWwgY2xhc3MsIHVzZSBjb25zdHJ1Y3RvciBmb3IgcmVmc1xuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBkb24ndCBkbyBSUiBhbmltYXRpb25zIHVudGlsIHdlIGFyZSBtb3VudGVkXG4gICAgICAgIHRoaXMuX3N1cHByZXNzUmVhZFJlY2VpcHRBbmltYXRpb24gPSB0cnVlO1xuICAgICAgICB0aGlzLl92ZXJpZnlFdmVudCh0aGlzLnByb3BzLm14RXZlbnQpO1xuXG4gICAgICAgIHRoaXMuX3RpbGUgPSBjcmVhdGVSZWYoKTtcbiAgICAgICAgdGhpcy5fcmVwbHlUaHJlYWQgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9zdXBwcmVzc1JlYWRSZWNlaXB0QW5pbWF0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY29udGV4dDtcbiAgICAgICAgY2xpZW50Lm9uKFwiZGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZFwiLCB0aGlzLm9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgIGNsaWVudC5vbihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgdGhpcy5vblVzZXJWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgdGhpcy5wcm9wcy5teEV2ZW50Lm9uKFwiRXZlbnQuZGVjcnlwdGVkXCIsIHRoaXMuX29uRGVjcnlwdGVkKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2hvd1JlYWN0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5teEV2ZW50Lm9uKFwiRXZlbnQucmVsYXRpb25zQ3JlYXRlZFwiLCB0aGlzLl9vblJlYWN0aW9uc0NyZWF0ZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIHdpdGggYXBwcm9wcmlhdGUgbGlmZWN5Y2xlIGV2ZW50XG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xuICAgICAgICAvLyByZS1jaGVjayB0aGUgc2VuZGVyIHZlcmlmaWNhdGlvbiBhcyBvdXRnb2luZyBldmVudHMgcHJvZ3Jlc3MgdGhyb3VnaFxuICAgICAgICAvLyB0aGUgc2VuZCBwcm9jZXNzLlxuICAgICAgICBpZiAobmV4dFByb3BzLmV2ZW50U2VuZFN0YXR1cyAhPT0gdGhpcy5wcm9wcy5ldmVudFNlbmRTdGF0dXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmeUV2ZW50KG5leHRQcm9wcy5teEV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIGlmICghT2JqZWN0VXRpbHMuc2hhbGxvd0VxdWFsKHRoaXMuc3RhdGUsIG5leHRTdGF0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICF0aGlzLl9wcm9wc0VxdWFsKHRoaXMucHJvcHMsIG5leHRQcm9wcyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJkZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkXCIsIHRoaXMub25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwidXNlclRydXN0U3RhdHVzQ2hhbmdlZFwiLCB0aGlzLm9uVXNlclZlcmlmaWNhdGlvbkNoYW5nZWQpO1xuICAgICAgICB0aGlzLnByb3BzLm14RXZlbnQucmVtb3ZlTGlzdGVuZXIoXCJFdmVudC5kZWNyeXB0ZWRcIiwgdGhpcy5fb25EZWNyeXB0ZWQpO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm14RXZlbnQucmVtb3ZlTGlzdGVuZXIoXCJFdmVudC5yZWxhdGlvbnNDcmVhdGVkXCIsIHRoaXMuX29uUmVhY3Rpb25zQ3JlYXRlZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBkZWNyeXB0ZWQgYWZ0ZXIgd2Ugc2hvdyBpdC5cbiAgICAgKi9cbiAgICBfb25EZWNyeXB0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIHJlLXZlcmlmeSB0aGUgc2VuZGluZyBkZXZpY2UuXG4gICAgICAgIC8vICh3ZSBjYWxsIG9uSGVpZ2h0Q2hhbmdlZCBpbiBfdmVyaWZ5RXZlbnQgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlIGRlY3J5cHRpb25cbiAgICAgICAgLy8gaGFzIGNhdXNlZCBhIGNoYW5nZSBpbiBzaXplIG9mIHRoZSBldmVudCB0aWxlKVxuICAgICAgICB0aGlzLl92ZXJpZnlFdmVudCh0aGlzLnByb3BzLm14RXZlbnQpO1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIG9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZDogZnVuY3Rpb24odXNlcklkLCBkZXZpY2UpIHtcbiAgICAgICAgaWYgKHVzZXJJZCA9PT0gdGhpcy5wcm9wcy5teEV2ZW50LmdldFNlbmRlcigpKSB7XG4gICAgICAgICAgICB0aGlzLl92ZXJpZnlFdmVudCh0aGlzLnByb3BzLm14RXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uVXNlclZlcmlmaWNhdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJJZCwgX3RydXN0U3RhdHVzKSB7XG4gICAgICAgIGlmICh1c2VySWQgPT09IHRoaXMucHJvcHMubXhFdmVudC5nZXRTZW5kZXIoKSkge1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZ5RXZlbnQodGhpcy5wcm9wcy5teEV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdmVyaWZ5RXZlbnQ6IGFzeW5jIGZ1bmN0aW9uKG14RXZlbnQpIHtcbiAgICAgICAgaWYgKCFteEV2ZW50LmlzRW5jcnlwdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGRpcmVjdGx5IHRydXN0IHRoZSBkZXZpY2UsIHNob3J0LWNpcmN1aXQgaGVyZVxuICAgICAgICBjb25zdCB2ZXJpZmllZCA9IGF3YWl0IHRoaXMuY29udGV4dC5pc0V2ZW50U2VuZGVyVmVyaWZpZWQobXhFdmVudCk7XG4gICAgICAgIGlmICh2ZXJpZmllZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdmVyaWZpZWQ6IEUyRV9TVEFURS5WRVJJRklFRCxcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBEZWNyeXB0aW9uIG1heSBoYXZlIGNhdXNlZCBhIGNoYW5nZSBpbiBzaXplXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgY3Jvc3Mtc2lnbmluZyBpcyBvZmYsIHRoZSBvbGQgYmVoYXZpb3VyIGlzIHRvIHNjcmVhbSBhdCB0aGUgdXNlclxuICAgICAgICAvLyBhcyBpZiB0aGV5J3ZlIGRvbmUgc29tZXRoaW5nIHdyb25nLCB3aGljaCB0aGV5IGhhdmVuJ3RcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB2ZXJpZmllZDogRTJFX1NUQVRFLldBUk5JTkcsXG4gICAgICAgICAgICB9LCB0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY29udGV4dC5jaGVja1VzZXJUcnVzdChteEV2ZW50LmdldFNlbmRlcigpKS5pc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHZlcmlmaWVkOiBFMkVfU1RBVEUuTk9STUFMLFxuICAgICAgICAgICAgfSwgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXZlbnRTZW5kZXJUcnVzdCA9IGF3YWl0IHRoaXMuY29udGV4dC5jaGVja0V2ZW50U2VuZGVyVHJ1c3QobXhFdmVudCk7XG4gICAgICAgIGlmICghZXZlbnRTZW5kZXJUcnVzdCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdmVyaWZpZWQ6IEUyRV9TVEFURS5VTktOT1dOLFxuICAgICAgICAgICAgfSwgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWQpOyAvLyBEZWNyeXB0aW9uIG1heSBoYXZlIGNhdXNlIGEgY2hhbmdlIGluIHNpemVcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdmVyaWZpZWQ6IGV2ZW50U2VuZGVyVHJ1c3QuaXNWZXJpZmllZCgpID8gRTJFX1NUQVRFLlZFUklGSUVEIDogRTJFX1NUQVRFLldBUk5JTkcsXG4gICAgICAgIH0sIHRoaXMucHJvcHMub25IZWlnaHRDaGFuZ2VkKTsgLy8gRGVjcnlwdGlvbiBtYXkgaGF2ZSBjYXVzZWQgYSBjaGFuZ2UgaW4gc2l6ZVxuICAgIH0sXG5cbiAgICBfcHJvcHNFcXVhbDogZnVuY3Rpb24ob2JqQSwgb2JqQikge1xuICAgICAgICBjb25zdCBrZXlzQSA9IE9iamVjdC5rZXlzKG9iakEpO1xuICAgICAgICBjb25zdCBrZXlzQiA9IE9iamVjdC5rZXlzKG9iakIpO1xuXG4gICAgICAgIGlmIChrZXlzQS5sZW5ndGggIT09IGtleXNCLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzQS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0ga2V5c0FbaV07XG5cbiAgICAgICAgICAgIGlmICghb2JqQi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBuZWVkIHRvIGRlZXAtY29tcGFyZSByZWFkUmVjZWlwdHNcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdyZWFkUmVjZWlwdHMnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgckEgPSBvYmpBW2tleV07XG4gICAgICAgICAgICAgICAgY29uc3QgckIgPSBvYmpCW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHJBID09PSByQikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJBIHx8ICFyQikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJBLmxlbmd0aCAhPT0gckIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByQS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAockFbal0udXNlcklkICE9PSByQltqXS51c2VySWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBvbmUgaGFzIGEgbWVtYmVyIHNldCBhbmQgdGhlIG90aGVyIGRvZXNuJ3Q/XG4gICAgICAgICAgICAgICAgICAgIGlmIChyQVtqXS5yb29tTWVtYmVyICE9PSByQltqXS5yb29tTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvYmpBW2tleV0gIT09IG9iakJba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBzaG91bGRIaWdobGlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZXh0LmdldFB1c2hBY3Rpb25zRm9yRXZlbnQodGhpcy5wcm9wcy5teEV2ZW50KTtcbiAgICAgICAgaWYgKCFhY3Rpb25zIHx8ICFhY3Rpb25zLnR3ZWFrcykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAvLyBkb24ndCBzaG93IHNlbGYtaGlnaGxpZ2h0cyBmcm9tIGFub3RoZXIgb2Ygb3VyIGNsaWVudHNcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubXhFdmVudC5nZXRTZW5kZXIoKSA9PT0gdGhpcy5jb250ZXh0LmNyZWRlbnRpYWxzLnVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFjdGlvbnMudHdlYWtzLmhpZ2hsaWdodDtcbiAgICB9LFxuXG4gICAgdG9nZ2xlQWxsUmVhZEF2YXRhcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGFsbFJlYWRBdmF0YXJzOiAhdGhpcy5zdGF0ZS5hbGxSZWFkQXZhdGFycyxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJlYWRBdmF0YXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gcmV0dXJuIGVhcmx5IGlmIHRoZXJlIGFyZSBubyByZWFkIHJlY2VpcHRzXG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5yZWFkUmVjZWlwdHMgfHwgdGhpcy5wcm9wcy5yZWFkUmVjZWlwdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxzcGFuIGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9yZWFkQXZhdGFyc1wiIC8+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IFJlYWRSZWNlaXB0TWFya2VyID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuUmVhZFJlY2VpcHRNYXJrZXInKTtcbiAgICAgICAgY29uc3QgYXZhdGFycyA9IFtdO1xuICAgICAgICBjb25zdCByZWNlaXB0T2Zmc2V0ID0gMTU7XG4gICAgICAgIGxldCBsZWZ0ID0gMDtcblxuICAgICAgICBjb25zdCByZWNlaXB0cyA9IHRoaXMucHJvcHMucmVhZFJlY2VpcHRzIHx8IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlY2VpcHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCByZWNlaXB0ID0gcmVjZWlwdHNbaV07XG5cbiAgICAgICAgICAgIGxldCBoaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKChpIDwgTUFYX1JFQURfQVZBVEFSUykgfHwgdGhpcy5zdGF0ZS5hbGxSZWFkQXZhdGFycykge1xuICAgICAgICAgICAgICAgIGhpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogd2Uga2VlcCB0aGUgZXh0cmEgcmVhZCBhdmF0YXJzIGluIHRoZSBkb20gdG8gbWFrZSBhbmltYXRpb24gc2ltcGxlclxuICAgICAgICAgICAgLy8gd2UgY291bGQgb3B0aW1pc2UgdGhpcyB0byByZWR1Y2UgdGhlIGRvbSBzaXplLlxuXG4gICAgICAgICAgICAvLyBJZiBoaWRkZW4sIHNldCBvZmZzZXQgZXF1YWwgdG8gdGhlIG9mZnNldCBvZiB0aGUgZmluYWwgdmlzaWJsZSBhdmF0YXIgb3JcbiAgICAgICAgICAgIC8vIGVsc2Ugc2V0IGl0IHByb3BvcnRpb25hbCB0byBpbmRleFxuICAgICAgICAgICAgbGVmdCA9IChoaWRkZW4gPyBNQVhfUkVBRF9BVkFUQVJTIC0gMSA6IGkpICogLXJlY2VpcHRPZmZzZXQ7XG5cbiAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IHJlY2VpcHQudXNlcklkO1xuICAgICAgICAgICAgbGV0IHJlYWRSZWNlaXB0SW5mbztcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMucmVhZFJlY2VpcHRNYXApIHtcbiAgICAgICAgICAgICAgICByZWFkUmVjZWlwdEluZm8gPSB0aGlzLnByb3BzLnJlYWRSZWNlaXB0TWFwW3VzZXJJZF07XG4gICAgICAgICAgICAgICAgaWYgKCFyZWFkUmVjZWlwdEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhZFJlY2VpcHRJbmZvID0ge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMucmVhZFJlY2VpcHRNYXBbdXNlcklkXSA9IHJlYWRSZWNlaXB0SW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFkZCB0byB0aGUgc3RhcnQgc28gdGhlIG1vc3QgcmVjZW50IGlzIG9uIHRoZSBlbmQgKGllLiBlbmRzIHVwIHJpZ2h0bW9zdClcbiAgICAgICAgICAgIGF2YXRhcnMudW5zaGlmdChcbiAgICAgICAgICAgICAgICA8UmVhZFJlY2VpcHRNYXJrZXIga2V5PXt1c2VySWR9IG1lbWJlcj17cmVjZWlwdC5yb29tTWVtYmVyfVxuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1VzZXJJZD17dXNlcklkfVxuICAgICAgICAgICAgICAgICAgICBsZWZ0T2Zmc2V0PXtsZWZ0fSBoaWRkZW49e2hpZGRlbn1cbiAgICAgICAgICAgICAgICAgICAgcmVhZFJlY2VpcHRJbmZvPXtyZWFkUmVjZWlwdEluZm99XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrVW5tb3VudGluZz17dGhpcy5wcm9wcy5jaGVja1VubW91bnRpbmd9XG4gICAgICAgICAgICAgICAgICAgIHN1cHByZXNzQW5pbWF0aW9uPXt0aGlzLl9zdXBwcmVzc1JlYWRSZWNlaXB0QW5pbWF0aW9ufVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnRvZ2dsZUFsbFJlYWRBdmF0YXJzfVxuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA9e3JlY2VpcHQudHN9XG4gICAgICAgICAgICAgICAgICAgIHNob3dUd2VsdmVIb3VyPXt0aGlzLnByb3BzLmlzVHdlbHZlSG91cn1cbiAgICAgICAgICAgICAgICAvPixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbVRleHQ7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5hbGxSZWFkQXZhdGFycykge1xuICAgICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gcmVjZWlwdHMubGVuZ3RoIC0gTUFYX1JFQURfQVZBVEFSUztcbiAgICAgICAgICAgIGlmIChyZW1haW5kZXIgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVtVGV4dCA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9yZWFkQXZhdGFyUmVtYWluZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVBbGxSZWFkQXZhdGFyc31cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgcmlnaHQ6IFwiY2FsYyhcIiArIHRvUmVtKC1sZWZ0KSArIFwiICsgXCIgKyByZWNlaXB0T2Zmc2V0ICsgXCJweClcIiB9fT57IHJlbWFpbmRlciB9K1xuICAgICAgICAgICAgICAgIDwvc3Bhbj47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX3JlYWRBdmF0YXJzXCI+XG4gICAgICAgICAgICB7IHJlbVRleHQgfVxuICAgICAgICAgICAgeyBhdmF0YXJzIH1cbiAgICAgICAgPC9zcGFuPjtcbiAgICB9LFxuXG4gICAgb25TZW5kZXJQcm9maWxlQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IG14RXZlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQ7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdpbnNlcnRfbWVudGlvbicsXG4gICAgICAgICAgICB1c2VyX2lkOiBteEV2ZW50LmdldFNlbmRlcigpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25SZXF1ZXN0S2V5c0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAvLyBJbmRpY2F0ZSBpbiB0aGUgVUkgdGhhdCB0aGUga2V5cyBoYXZlIGJlZW4gcmVxdWVzdGVkICh0aGlzIGlzIGV4cGVjdGVkIHRvXG4gICAgICAgICAgICAvLyBiZSByZXNldCBpZiB0aGUgY29tcG9uZW50IGlzIG1vdW50ZWQgaW4gdGhlIGZ1dHVyZSkuXG4gICAgICAgICAgICBwcmV2aW91c2x5UmVxdWVzdGVkS2V5czogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2FuY2VsIGFueSBvdXRnb2luZyBrZXkgcmVxdWVzdCBmb3IgdGhpcyBldmVudCBhbmQgcmVzZW5kIGl0LiBJZiBhIHJlc3BvbnNlXG4gICAgICAgIC8vIGlzIHJlY2VpdmVkIGZvciB0aGUgcmVxdWVzdCB3aXRoIHRoZSByZXF1aXJlZCBrZXlzLCB0aGUgZXZlbnQgY291bGQgYmVcbiAgICAgICAgLy8gZGVjcnlwdGVkIHN1Y2Nlc3NmdWxseS5cbiAgICAgICAgdGhpcy5jb250ZXh0LmNhbmNlbEFuZFJlc2VuZEV2ZW50Um9vbUtleVJlcXVlc3QodGhpcy5wcm9wcy5teEV2ZW50KTtcbiAgICB9LFxuXG4gICAgb25QZXJtYWxpbmtDbGlja2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBwZXJtYWxpbmsgdG8gYmUgb3BlbmVkIGluIGEgbmV3IHRhYi93aW5kb3cgb3IgY29waWVkIGFzXG4gICAgICAgIC8vIG1hdHJpeC50bywgYnV0IGFsc28gZm9yIGl0IHRvIGVuYWJsZSByb3V0aW5nIHdpdGhpbiBSaW90IHdoZW4gY2xpY2tlZC5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgIGV2ZW50X2lkOiB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSxcbiAgICAgICAgICAgIGhpZ2hsaWdodGVkOiB0cnVlLFxuICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3JlbmRlckUyRVBhZGxvY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBldiA9IHRoaXMucHJvcHMubXhFdmVudDtcblxuICAgICAgICAvLyBldmVudCBjb3VsZCBub3QgYmUgZGVjcnlwdGVkXG4gICAgICAgIGlmIChldi5nZXRDb250ZW50KCkubXNndHlwZSA9PT0gJ20uYmFkLmVuY3J5cHRlZCcpIHtcbiAgICAgICAgICAgIHJldHVybiA8RTJlUGFkbG9ja1VuZGVjcnlwdGFibGUgLz47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBldmVudCBpcyBlbmNyeXB0ZWQsIGRpc3BsYXkgcGFkbG9jayBjb3JyZXNwb25kaW5nIHRvIHdoZXRoZXIgb3Igbm90IGl0IGlzIHZlcmlmaWVkXG4gICAgICAgIGlmIChldi5pc0VuY3J5cHRlZCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZXJpZmllZCA9PT0gRTJFX1NUQVRFLk5PUk1BTCkge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gbm8gaWNvbiBpZiB3ZSd2ZSBub3QgZXZlbiBjcm9zcy1zaWduZWQgdGhlIHVzZXJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52ZXJpZmllZCA9PT0gRTJFX1NUQVRFLlZFUklGSUVEKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBubyBpY29uIGZvciB2ZXJpZmllZFxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnZlcmlmaWVkID09PSBFMkVfU1RBVEUuVU5LTk9XTikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoPEUyZVBhZGxvY2tVbmtub3duIC8+KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICg8RTJlUGFkbG9ja1VudmVyaWZpZWQgLz4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5pc1Jvb21FbmNyeXB0ZWQoZXYuZ2V0Um9vbUlkKCkpKSB7XG4gICAgICAgICAgICAvLyBlbHNlIGlmIHJvb20gaXMgZW5jcnlwdGVkXG4gICAgICAgICAgICAvLyBhbmQgZXZlbnQgaXMgYmVpbmcgZW5jcnlwdGVkIG9yIGlzIG5vdF9zZW50IChVbmtub3duIERldmljZXMvTmV0d29yayBFcnJvcilcbiAgICAgICAgICAgIGlmIChldi5zdGF0dXMgPT09IEV2ZW50U3RhdHVzLkVOQ1JZUFRJTkcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXYuc3RhdHVzID09PSBFdmVudFN0YXR1cy5OT1RfU0VOVCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldi5pc1N0YXRlKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIHdlIGV4cGVjdCB0aGlzIHRvIGJlIHVuZW5jcnlwdGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiB0aGUgZXZlbnQgaXMgbm90IGVuY3J5cHRlZCwgYnV0IGl0J3MgYW4gZTJlIHJvb20sIHNob3cgdGhlIG9wZW4gcGFkbG9ja1xuICAgICAgICAgICAgcmV0dXJuIDxFMmVQYWRsb2NrVW5lbmNyeXB0ZWQgLz47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBwYWRsb2NrIG5lZWRlZFxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgb25BY3Rpb25CYXJGb2N1c0NoYW5nZShmb2N1c2VkKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYWN0aW9uQmFyRm9jdXNlZDogZm9jdXNlZCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFRpbGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aWxlLmN1cnJlbnQ7XG4gICAgfSxcblxuICAgIGdldFJlcGx5VGhyZWFkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVwbHlUaHJlYWQuY3VycmVudDtcbiAgICB9LFxuXG4gICAgZ2V0UmVhY3Rpb25zKCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5wcm9wcy5zaG93UmVhY3Rpb25zIHx8XG4gICAgICAgICAgICAhdGhpcy5wcm9wcy5nZXRSZWxhdGlvbnNGb3JFdmVudFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV2ZW50SWQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKTtcbiAgICAgICAgaWYgKCFldmVudElkKSB7XG4gICAgICAgICAgICAvLyBYWFg6IFRlbXBvcmFyeSBkaWFnbm9zdGljIGxvZ2dpbmcgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzExMTIwXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXZlbnRUaWxlIGF0dGVtcHRlZCB0byBnZXQgcmVsYXRpb25zIGZvciBhbiBldmVudCB3aXRob3V0IGFuIElEXCIpO1xuICAgICAgICAgICAgLy8gVXNlIGV2ZW50J3Mgc3BlY2lhbCBgdG9KU09OYCBtZXRob2QgdG8gbG9nIGtleSBkYXRhLlxuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcy5teEV2ZW50LCBudWxsLCA0KSk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKFwiU3RhY2t0cmFjZSBmb3IgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTExMjBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZ2V0UmVsYXRpb25zRm9yRXZlbnQoZXZlbnRJZCwgXCJtLmFubm90YXRpb25cIiwgXCJtLnJlYWN0aW9uXCIpO1xuICAgIH0sXG5cbiAgICBfb25SZWFjdGlvbnNDcmVhdGVkKHJlbGF0aW9uVHlwZSwgZXZlbnRUeXBlKSB7XG4gICAgICAgIGlmIChyZWxhdGlvblR5cGUgIT09IFwibS5hbm5vdGF0aW9uXCIgfHwgZXZlbnRUeXBlICE9PSBcIm0ucmVhY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvcHMubXhFdmVudC5yZW1vdmVMaXN0ZW5lcihcIkV2ZW50LnJlbGF0aW9uc0NyZWF0ZWRcIiwgdGhpcy5fb25SZWFjdGlvbnNDcmVhdGVkKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHRoaXMuZ2V0UmVhY3Rpb25zKCksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBNZXNzYWdlVGltZXN0YW1wID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuTWVzc2FnZVRpbWVzdGFtcCcpO1xuICAgICAgICBjb25zdCBTZW5kZXJQcm9maWxlID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuU2VuZGVyUHJvZmlsZScpO1xuICAgICAgICBjb25zdCBNZW1iZXJBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLk1lbWJlckF2YXRhcicpO1xuXG4gICAgICAgIC8vY29uc29sZS5pbmZvKFwiRXZlbnRUaWxlIHNob3dVcmxQcmV2aWV3IGZvciAlcyBpcyAlc1wiLCB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSwgdGhpcy5wcm9wcy5zaG93VXJsUHJldmlldyk7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucHJvcHMubXhFdmVudC5nZXRDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IG1zZ3R5cGUgPSBjb250ZW50Lm1zZ3R5cGU7XG4gICAgICAgIGNvbnN0IGV2ZW50VHlwZSA9IHRoaXMucHJvcHMubXhFdmVudC5nZXRUeXBlKCk7XG5cbiAgICAgICAgLy8gSW5mbyBtZXNzYWdlcyBhcmUgYmFzaWNhbGx5IGluZm9ybWF0aW9uIGFib3V0IGNvbW1hbmRzIHByb2Nlc3NlZCBvbiBhIHJvb21cbiAgICAgICAgY29uc3QgaXNCdWJibGVNZXNzYWdlID0gZXZlbnRUeXBlLnN0YXJ0c1dpdGgoXCJtLmtleS52ZXJpZmljYXRpb25cIikgfHxcbiAgICAgICAgICAgIChldmVudFR5cGUgPT09IFwibS5yb29tLm1lc3NhZ2VcIiAmJiBtc2d0eXBlICYmIG1zZ3R5cGUuc3RhcnRzV2l0aChcIm0ua2V5LnZlcmlmaWNhdGlvblwiKSkgfHxcbiAgICAgICAgICAgIChldmVudFR5cGUgPT09IFwibS5yb29tLmVuY3J5cHRpb25cIik7XG4gICAgICAgIGxldCBpc0luZm9NZXNzYWdlID0gKFxuICAgICAgICAgICAgIWlzQnViYmxlTWVzc2FnZSAmJiBldmVudFR5cGUgIT09ICdtLnJvb20ubWVzc2FnZScgJiZcbiAgICAgICAgICAgIGV2ZW50VHlwZSAhPT0gJ20uc3RpY2tlcicgJiYgZXZlbnRUeXBlICE9PSAnbS5yb29tLmNyZWF0ZSdcbiAgICAgICAgKTtcblxuICAgICAgICBsZXQgdGlsZUhhbmRsZXIgPSBnZXRIYW5kbGVyVGlsZSh0aGlzLnByb3BzLm14RXZlbnQpO1xuICAgICAgICAvLyBJZiB3ZSdyZSBzaG93aW5nIGhpZGRlbiBldmVudHMgaW4gdGhlIHRpbWVsaW5lLCB3ZSBzaG91bGQgdXNlIHRoZVxuICAgICAgICAvLyBzb3VyY2UgdGlsZSB3aGVuIHRoZXJlJ3Mgbm8gcmVndWxhciB0aWxlIGZvciBhbiBldmVudCBhbmQgYWxzbyBmb3JcbiAgICAgICAgLy8gcmVwbGFjZSByZWxhdGlvbnMgKHdoaWNoIG90aGVyd2lzZSB3b3VsZCBkaXNwbGF5IGFzIGEgY29uZnVzaW5nXG4gICAgICAgIC8vIGR1cGxpY2F0ZSBvZiB0aGUgdGhpbmcgdGhleSBhcmUgcmVwbGFjaW5nKS5cbiAgICAgICAgY29uc3QgdXNlU291cmNlID0gIXRpbGVIYW5kbGVyIHx8IHRoaXMucHJvcHMubXhFdmVudC5pc1JlbGF0aW9uKFwibS5yZXBsYWNlXCIpO1xuICAgICAgICBpZiAodXNlU291cmNlICYmIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93SGlkZGVuRXZlbnRzSW5UaW1lbGluZVwiKSkge1xuICAgICAgICAgICAgdGlsZUhhbmRsZXIgPSBcIm1lc3NhZ2VzLlZpZXdTb3VyY2VFdmVudFwiO1xuICAgICAgICAgICAgLy8gUmV1c2UgaW5mbyBtZXNzYWdlIGF2YXRhciBhbmQgc2VuZGVyIHByb2ZpbGUgc3R5bGluZ1xuICAgICAgICAgICAgaXNJbmZvTWVzc2FnZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhpcyBzaG91bGRuJ3QgaGFwcGVuOiB0aGUgY2FsbGVyIHNob3VsZCBjaGVjayB3ZSBzdXBwb3J0IHRoaXMgdHlwZVxuICAgICAgICAvLyBiZWZvcmUgdHJ5aW5nIHRvIGluc3RhbnRpYXRlIHVzXG4gICAgICAgIGlmICghdGlsZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHtteEV2ZW50fSA9IHRoaXMucHJvcHM7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEV2ZW50IHR5cGUgbm90IHN1cHBvcnRlZDogdHlwZToke214RXZlbnQuZ2V0VHlwZSgpfSBpc1N0YXRlOiR7bXhFdmVudC5pc1N0YXRlKCl9YCk7XG4gICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9FdmVudFRpbGUgbXhfRXZlbnRUaWxlX2luZm8gbXhfTU5vdGljZUJvZHlcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9saW5lXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1RoaXMgZXZlbnQgY291bGQgbm90IGJlIGRpc3BsYXllZCcpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBFdmVudFRpbGVUeXBlID0gc2RrLmdldENvbXBvbmVudCh0aWxlSGFuZGxlcik7XG5cbiAgICAgICAgY29uc3QgaXNTZW5kaW5nID0gKFsnc2VuZGluZycsICdxdWV1ZWQnLCAnZW5jcnlwdGluZyddLmluZGV4T2YodGhpcy5wcm9wcy5ldmVudFNlbmRTdGF0dXMpICE9PSAtMSk7XG4gICAgICAgIGNvbnN0IGlzUmVkYWN0ZWQgPSBpc01lc3NhZ2VFdmVudCh0aGlzLnByb3BzLm14RXZlbnQpICYmIHRoaXMucHJvcHMuaXNSZWRhY3RlZDtcbiAgICAgICAgY29uc3QgaXNFbmNyeXB0aW9uRmFpbHVyZSA9IHRoaXMucHJvcHMubXhFdmVudC5pc0RlY3J5cHRpb25GYWlsdXJlKCk7XG5cbiAgICAgICAgY29uc3QgaXNFZGl0aW5nID0gISF0aGlzLnByb3BzLmVkaXRTdGF0ZTtcbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2J1YmJsZUNvbnRhaW5lcjogaXNCdWJibGVNZXNzYWdlLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlOiB0cnVlLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2lzRWRpdGluZzogaXNFZGl0aW5nLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2luZm86IGlzSW5mb01lc3NhZ2UsXG4gICAgICAgICAgICBteF9FdmVudFRpbGVfMTJocjogdGhpcy5wcm9wcy5pc1R3ZWx2ZUhvdXIsXG4gICAgICAgICAgICBteF9FdmVudFRpbGVfZW5jcnlwdGluZzogdGhpcy5wcm9wcy5ldmVudFNlbmRTdGF0dXMgPT09ICdlbmNyeXB0aW5nJyxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9zZW5kaW5nOiAhaXNFZGl0aW5nICYmIGlzU2VuZGluZyxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9ub3RTZW50OiB0aGlzLnByb3BzLmV2ZW50U2VuZFN0YXR1cyA9PT0gJ25vdF9zZW50JyxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9oaWdobGlnaHQ6IHRoaXMucHJvcHMudGlsZVNoYXBlID09PSAnbm90aWYnID8gZmFsc2UgOiB0aGlzLnNob3VsZEhpZ2hsaWdodCgpLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX3NlbGVjdGVkOiB0aGlzLnByb3BzLmlzU2VsZWN0ZWRFdmVudCxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9jb250aW51YXRpb246IHRoaXMucHJvcHMudGlsZVNoYXBlID8gJycgOiB0aGlzLnByb3BzLmNvbnRpbnVhdGlvbixcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9sYXN0OiB0aGlzLnByb3BzLmxhc3QsXG4gICAgICAgICAgICBteF9FdmVudFRpbGVfY29udGV4dHVhbDogdGhpcy5wcm9wcy5jb250ZXh0dWFsLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2FjdGlvbkJhckZvY3VzZWQ6IHRoaXMuc3RhdGUuYWN0aW9uQmFyRm9jdXNlZCxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV92ZXJpZmllZDogIWlzQnViYmxlTWVzc2FnZSAmJiB0aGlzLnN0YXRlLnZlcmlmaWVkID09PSBFMkVfU1RBVEUuVkVSSUZJRUQsXG4gICAgICAgICAgICBteF9FdmVudFRpbGVfdW52ZXJpZmllZDogIWlzQnViYmxlTWVzc2FnZSAmJiB0aGlzLnN0YXRlLnZlcmlmaWVkID09PSBFMkVfU1RBVEUuV0FSTklORyxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV91bmtub3duOiAhaXNCdWJibGVNZXNzYWdlICYmIHRoaXMuc3RhdGUudmVyaWZpZWQgPT09IEUyRV9TVEFURS5VTktOT1dOLFxuICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2JhZDogaXNFbmNyeXB0aW9uRmFpbHVyZSxcbiAgICAgICAgICAgIG14X0V2ZW50VGlsZV9lbW90ZTogbXNndHlwZSA9PT0gJ20uZW1vdGUnLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcGVybWFsaW5rID0gXCIjXCI7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3IpIHtcbiAgICAgICAgICAgIHBlcm1hbGluayA9IHRoaXMucHJvcHMucGVybWFsaW5rQ3JlYXRvci5mb3JFdmVudCh0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWFkQXZhdGFycyA9IHRoaXMuZ2V0UmVhZEF2YXRhcnMoKTtcblxuICAgICAgICBsZXQgYXZhdGFyO1xuICAgICAgICBsZXQgc2VuZGVyO1xuICAgICAgICBsZXQgYXZhdGFyU2l6ZTtcbiAgICAgICAgbGV0IG5lZWRzU2VuZGVyUHJvZmlsZTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy50aWxlU2hhcGUgPT09IFwibm90aWZcIikge1xuICAgICAgICAgICAgYXZhdGFyU2l6ZSA9IDI0O1xuICAgICAgICAgICAgbmVlZHNTZW5kZXJQcm9maWxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aWxlSGFuZGxlciA9PT0gJ21lc3NhZ2VzLlJvb21DcmVhdGUnIHx8IGlzQnViYmxlTWVzc2FnZSkge1xuICAgICAgICAgICAgYXZhdGFyU2l6ZSA9IDA7XG4gICAgICAgICAgICBuZWVkc1NlbmRlclByb2ZpbGUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0luZm9NZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBhIHNtYWxsIGF2YXRhciwgd2l0aCBubyBzZW5kZXIgcHJvZmlsZSwgZm9yXG4gICAgICAgICAgICAvLyBqb2lucy9wYXJ0cy9ldGNcbiAgICAgICAgICAgIGF2YXRhclNpemUgPSAxNDtcbiAgICAgICAgICAgIG5lZWRzU2VuZGVyUHJvZmlsZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuY29udGludWF0aW9uICYmIHRoaXMucHJvcHMudGlsZVNoYXBlICE9PSBcImZpbGVfZ3JpZFwiKSB7XG4gICAgICAgICAgICAvLyBubyBhdmF0YXIgb3Igc2VuZGVyIHByb2ZpbGUgZm9yIGNvbnRpbnVhdGlvbiBtZXNzYWdlc1xuICAgICAgICAgICAgYXZhdGFyU2l6ZSA9IDA7XG4gICAgICAgICAgICBuZWVkc1NlbmRlclByb2ZpbGUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF2YXRhclNpemUgPSAzMDtcbiAgICAgICAgICAgIG5lZWRzU2VuZGVyUHJvZmlsZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5teEV2ZW50LnNlbmRlciAmJiBhdmF0YXJTaXplKSB7XG4gICAgICAgICAgICBhdmF0YXIgPSAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2F2YXRhclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPE1lbWJlckF2YXRhciBtZW1iZXI9e3RoaXMucHJvcHMubXhFdmVudC5zZW5kZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9e2F2YXRhclNpemV9IGhlaWdodD17YXZhdGFyU2l6ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3VXNlck9uQ2xpY2s9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmVlZHNTZW5kZXJQcm9maWxlKSB7XG4gICAgICAgICAgICBsZXQgdGV4dCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIXRoaXMucHJvcHMudGlsZVNoYXBlIHx8IHRoaXMucHJvcHMudGlsZVNoYXBlID09PSAncmVwbHknIHx8IHRoaXMucHJvcHMudGlsZVNoYXBlID09PSAncmVwbHlfcHJldmlldycpIHtcbiAgICAgICAgICAgICAgICBpZiAobXNndHlwZSA9PT0gJ20uaW1hZ2UnKSB0ZXh0ID0gX3RkKCclKHNlbmRlck5hbWUpcyBzZW50IGFuIGltYWdlJyk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobXNndHlwZSA9PT0gJ20udmlkZW8nKSB0ZXh0ID0gX3RkKCclKHNlbmRlck5hbWUpcyBzZW50IGEgdmlkZW8nKTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtc2d0eXBlID09PSAnbS5maWxlJykgdGV4dCA9IF90ZCgnJShzZW5kZXJOYW1lKXMgdXBsb2FkZWQgYSBmaWxlJyk7XG4gICAgICAgICAgICAgICAgc2VuZGVyID0gPFNlbmRlclByb2ZpbGUgb25DbGljaz17dGhpcy5vblNlbmRlclByb2ZpbGVDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteEV2ZW50PXt0aGlzLnByb3BzLm14RXZlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRmxhaXI9eyF0ZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ9e3RleHR9IC8+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kZXIgPSA8U2VuZGVyUHJvZmlsZSBteEV2ZW50PXt0aGlzLnByb3BzLm14RXZlbnR9IGVuYWJsZUZsYWlyPXt0cnVlfSAvPjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IE1lc3NhZ2VBY3Rpb25CYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdtZXNzYWdlcy5NZXNzYWdlQWN0aW9uQmFyJyk7XG4gICAgICAgIGNvbnN0IGFjdGlvbkJhciA9ICFpc0VkaXRpbmcgPyA8TWVzc2FnZUFjdGlvbkJhclxuICAgICAgICAgICAgbXhFdmVudD17dGhpcy5wcm9wcy5teEV2ZW50fVxuICAgICAgICAgICAgcmVhY3Rpb25zPXt0aGlzLnN0YXRlLnJlYWN0aW9uc31cbiAgICAgICAgICAgIHBlcm1hbGlua0NyZWF0b3I9e3RoaXMucHJvcHMucGVybWFsaW5rQ3JlYXRvcn1cbiAgICAgICAgICAgIGdldFRpbGU9e3RoaXMuZ2V0VGlsZX1cbiAgICAgICAgICAgIGdldFJlcGx5VGhyZWFkPXt0aGlzLmdldFJlcGx5VGhyZWFkfVxuICAgICAgICAgICAgb25Gb2N1c0NoYW5nZT17dGhpcy5vbkFjdGlvbkJhckZvY3VzQ2hhbmdlfVxuICAgICAgICAvPiA6IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0VHMoKSA/XG4gICAgICAgICAgICA8TWVzc2FnZVRpbWVzdGFtcCBzaG93VHdlbHZlSG91cj17dGhpcy5wcm9wcy5pc1R3ZWx2ZUhvdXJ9IHRzPXt0aGlzLnByb3BzLm14RXZlbnQuZ2V0VHMoKX0gLz4gOiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGtleVJlcXVlc3RIZWxwVGV4dCA9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9rZXlSZXF1ZXN0SW5mb190b29sdGlwX2NvbnRlbnRzXCI+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS5wcmV2aW91c2x5UmVxdWVzdGVkS2V5cyA/XG4gICAgICAgICAgICAgICAgICAgICAgICBfdCggJ1lvdXIga2V5IHNoYXJlIHJlcXVlc3QgaGFzIGJlZW4gc2VudCAtIHBsZWFzZSBjaGVjayB5b3VyIG90aGVyIHNlc3Npb25zICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb3Iga2V5IHNoYXJlIHJlcXVlc3RzLicpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIF90KCAnS2V5IHNoYXJlIHJlcXVlc3RzIGFyZSBzZW50IHRvIHlvdXIgb3RoZXIgc2Vzc2lvbnMgYXV0b21hdGljYWxseS4gSWYgeW91ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZWplY3RlZCBvciBkaXNtaXNzZWQgdGhlIGtleSBzaGFyZSByZXF1ZXN0IG9uIHlvdXIgb3RoZXIgc2Vzc2lvbnMsIGNsaWNrICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdoZXJlIHRvIHJlcXVlc3QgdGhlIGtleXMgZm9yIHRoaXMgc2Vzc2lvbiBhZ2Fpbi4nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCAnSWYgeW91ciBvdGhlciBzZXNzaW9ucyBkbyBub3QgaGF2ZSB0aGUga2V5IGZvciB0aGlzIG1lc3NhZ2UgeW91IHdpbGwgbm90ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdiZSBhYmxlIHRvIGRlY3J5cHQgdGhlbS4nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICBjb25zdCBrZXlSZXF1ZXN0SW5mb0NvbnRlbnQgPSB0aGlzLnN0YXRlLnByZXZpb3VzbHlSZXF1ZXN0ZWRLZXlzID9cbiAgICAgICAgICAgIF90KCdLZXkgcmVxdWVzdCBzZW50LicpIDpcbiAgICAgICAgICAgIF90KFxuICAgICAgICAgICAgICAgICc8cmVxdWVzdExpbms+UmUtcmVxdWVzdCBlbmNyeXB0aW9uIGtleXM8L3JlcXVlc3RMaW5rPiBmcm9tIHlvdXIgb3RoZXIgc2Vzc2lvbnMuJyxcbiAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICB7J3JlcXVlc3RMaW5rJzogKHN1YikgPT4gPGEgb25DbGljaz17dGhpcy5vblJlcXVlc3RLZXlzQ2xpY2t9Pnsgc3ViIH08L2E+fSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgVG9vbHRpcEJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLlRvb2x0aXBCdXR0b24nKTtcbiAgICAgICAgY29uc3Qga2V5UmVxdWVzdEluZm8gPSBpc0VuY3J5cHRpb25GYWlsdXJlID9cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2tleVJlcXVlc3RJbmZvXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2tleVJlcXVlc3RJbmZvX3RleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBrZXlSZXF1ZXN0SW5mb0NvbnRlbnQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8VG9vbHRpcEJ1dHRvbiBoZWxwVGV4dD17a2V5UmVxdWVzdEhlbHBUZXh0fSAvPlxuICAgICAgICAgICAgPC9kaXY+IDogbnVsbDtcblxuICAgICAgICBsZXQgcmVhY3Rpb25zUm93O1xuICAgICAgICBpZiAoIWlzUmVkYWN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IFJlYWN0aW9uc1JvdyA9IHNkay5nZXRDb21wb25lbnQoJ21lc3NhZ2VzLlJlYWN0aW9uc1JvdycpO1xuICAgICAgICAgICAgcmVhY3Rpb25zUm93ID0gPFJlYWN0aW9uc1Jvd1xuICAgICAgICAgICAgICAgIG14RXZlbnQ9e3RoaXMucHJvcHMubXhFdmVudH1cbiAgICAgICAgICAgICAgICByZWFjdGlvbnM9e3RoaXMuc3RhdGUucmVhY3Rpb25zfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMucHJvcHMudGlsZVNoYXBlKSB7XG4gICAgICAgICAgICBjYXNlICdub3RpZic6IHtcbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20odGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9yb29tTmFtZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e3Blcm1hbGlua30gb25DbGljaz17dGhpcy5vblBlcm1hbGlua0NsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJvb20gPyByb29tLm5hbWUgOiAnJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9zZW5kZXJEZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBhdmF0YXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e3Blcm1hbGlua30gb25DbGljaz17dGhpcy5vblBlcm1hbGlua0NsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHNlbmRlciB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGltZXN0YW1wIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2xpbmVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RXZlbnRUaWxlVHlwZSByZWY9e3RoaXMuX3RpbGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhFdmVudD17dGhpcy5wcm9wcy5teEV2ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM9e3RoaXMucHJvcHMuaGlnaGxpZ2h0c31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRMaW5rPXt0aGlzLnByb3BzLmhpZ2hsaWdodExpbmt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1VybFByZXZpZXc9e3RoaXMucHJvcHMuc2hvd1VybFByZXZpZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25IZWlnaHRDaGFuZ2VkPXt0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnZmlsZV9ncmlkJzoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2xpbmVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RXZlbnRUaWxlVHlwZSByZWY9e3RoaXMuX3RpbGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhFdmVudD17dGhpcy5wcm9wcy5teEV2ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM9e3RoaXMucHJvcHMuaGlnaGxpZ2h0c31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRMaW5rPXt0aGlzLnByb3BzLmhpZ2hsaWdodExpbmt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1VybFByZXZpZXc9e3RoaXMucHJvcHMuc2hvd1VybFByZXZpZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGlsZVNoYXBlPXt0aGlzLnByb3BzLnRpbGVTaGFwZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkhlaWdodENoYW5nZWQ9e3RoaXMucHJvcHMub25IZWlnaHRDaGFuZ2VkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9zZW5kZXJEZXRhaWxzTGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHJlZj17cGVybWFsaW5rfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25QZXJtYWxpbmtDbGlja2VkfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX3NlbmRlckRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzZW5kZXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRpbWVzdGFtcCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ3JlcGx5JzpcbiAgICAgICAgICAgIGNhc2UgJ3JlcGx5X3ByZXZpZXcnOiB7XG4gICAgICAgICAgICAgICAgbGV0IHRocmVhZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy50aWxlU2hhcGUgPT09ICdyZXBseV9wcmV2aWV3Jykge1xuICAgICAgICAgICAgICAgICAgICB0aHJlYWQgPSBSZXBseVRocmVhZC5tYWtlVGhyZWFkKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5teEV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXBseVRocmVhZCxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBhdmF0YXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzZW5kZXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FdmVudFRpbGVfcmVwbHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXtwZXJtYWxpbmt9IG9uQ2xpY2s9e3RoaXMub25QZXJtYWxpbmtDbGlja2VkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aW1lc3RhbXAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ICFpc0J1YmJsZU1lc3NhZ2UgJiYgdGhpcy5fcmVuZGVyRTJFUGFkbG9jaygpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRocmVhZCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEV2ZW50VGlsZVR5cGUgcmVmPXt0aGlzLl90aWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14RXZlbnQ9e3RoaXMucHJvcHMubXhFdmVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRzPXt0aGlzLnByb3BzLmhpZ2hsaWdodHN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0TGluaz17dGhpcy5wcm9wcy5oaWdobGlnaHRMaW5rfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSGVpZ2h0Q2hhbmdlZD17dGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1VybFByZXZpZXc9e2ZhbHNlfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGhyZWFkID0gUmVwbHlUaHJlYWQubWFrZVRocmVhZChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5teEV2ZW50LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5wZXJtYWxpbmtDcmVhdG9yLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXBseVRocmVhZCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIHRhYi1pbmRleD0tMSB0byBhbGxvdyBpdCB0byBiZSBmb2N1c2FibGUgYnV0IGRvIG5vdCBhZGQgdGFiIHN0b3AgZm9yIGl0LCBwcmltYXJpbHkgZm9yIHNjcmVlbiByZWFkZXJzXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9IHRhYkluZGV4PXstMX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9tc2dPcHRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJlYWRBdmF0YXJzIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzZW5kZXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FdmVudFRpbGVfbGluZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e3Blcm1hbGlua31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblBlcm1hbGlua0NsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e2Zvcm1hdFRpbWUobmV3IERhdGUodGhpcy5wcm9wcy5teEV2ZW50LmdldFRzKCkpLCB0aGlzLnByb3BzLmlzVHdlbHZlSG91cil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRpbWVzdGFtcCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgIWlzQnViYmxlTWVzc2FnZSAmJiB0aGlzLl9yZW5kZXJFMkVQYWRsb2NrKCkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhyZWFkIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RXZlbnRUaWxlVHlwZSByZWY9e3RoaXMuX3RpbGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhFdmVudD17dGhpcy5wcm9wcy5teEV2ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2luZ0V2ZW50SWQ9e3RoaXMucHJvcHMucmVwbGFjaW5nRXZlbnRJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGU9e3RoaXMucHJvcHMuZWRpdFN0YXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM9e3RoaXMucHJvcHMuaGlnaGxpZ2h0c31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRMaW5rPXt0aGlzLnByb3BzLmhpZ2hsaWdodExpbmt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1VybFByZXZpZXc9e3RoaXMucHJvcHMuc2hvd1VybFByZXZpZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25IZWlnaHRDaGFuZ2VkPXt0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGtleVJlcXVlc3RJbmZvIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJlYWN0aW9uc1JvdyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBhY3Rpb25CYXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGF2YXRhciBnb2VzIGFmdGVyIHRoZSBldmVudCB0aWxlIGFzIGl0J3MgYWJzb2x1dGVseSBwb3NpdGlvbmVkIHRvIGJlIG92ZXIgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlbnQgdGlsZSBsaW5lLCBzbyBuZWVkcyB0byBiZSBsYXRlciBpbiB0aGUgRE9NIHNvIGl0IGFwcGVhcnMgb24gdG9wICh0aGlzIGF2b2lkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBuZWVkIGZvciBmdXJ0aGVyIHotaW5kZXhpbmcgY2hhb3MpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGF2YXRhciB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG5cbi8vIFhYWCB0aGlzJ2xsIGV2ZW50dWFsbHkgYmUgZHluYW1pYyBiYXNlZCBvbiB0aGUgZmllbGRzIG9uY2Ugd2UgaGF2ZSBleHRlbnNpYmxlIGV2ZW50IHR5cGVzXG5jb25zdCBtZXNzYWdlVHlwZXMgPSBbJ20ucm9vbS5tZXNzYWdlJywgJ20uc3RpY2tlciddO1xuZnVuY3Rpb24gaXNNZXNzYWdlRXZlbnQoZXYpIHtcbiAgICByZXR1cm4gKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhldi5nZXRUeXBlKCkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhdmVUaWxlRm9yRXZlbnQoZSkge1xuICAgIC8vIE9ubHkgbWVzc2FnZXMgaGF2ZSBhIHRpbGUgKGJsYWNrLXJlY3RhbmdsZSkgaWYgcmVkYWN0ZWRcbiAgICBpZiAoZS5pc1JlZGFjdGVkKCkgJiYgIWlzTWVzc2FnZUV2ZW50KGUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAvLyBObyB0aWxlIGZvciByZXBsYWNlbWVudCBldmVudHMgc2luY2UgdGhleSB1cGRhdGUgdGhlIG9yaWdpbmFsIHRpbGVcbiAgICBpZiAoZS5pc1JlbGF0aW9uKFwibS5yZXBsYWNlXCIpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBoYW5kbGVyID0gZ2V0SGFuZGxlclRpbGUoZSk7XG4gICAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChoYW5kbGVyID09PSAnbWVzc2FnZXMuVGV4dHVhbEV2ZW50Jykge1xuICAgICAgICByZXR1cm4gVGV4dEZvckV2ZW50LnRleHRGb3JFdmVudChlKSAhPT0gJyc7XG4gICAgfSBlbHNlIGlmIChoYW5kbGVyID09PSAnbWVzc2FnZXMuUm9vbUNyZWF0ZScpIHtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oZS5nZXRDb250ZW50KClbJ3ByZWRlY2Vzc29yJ10pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gRTJlUGFkbG9ja1VuZGVjcnlwdGFibGUocHJvcHMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8RTJlUGFkbG9jayB0aXRsZT17X3QoXCJUaGlzIG1lc3NhZ2UgY2Fubm90IGJlIGRlY3J5cHRlZFwiKX0gaWNvbj1cInVuZGVjcnlwdGFibGVcIiB7Li4ucHJvcHN9IC8+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gRTJlUGFkbG9ja1VudmVyaWZpZWQocHJvcHMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8RTJlUGFkbG9jayB0aXRsZT17X3QoXCJFbmNyeXB0ZWQgYnkgYW4gdW52ZXJpZmllZCBzZXNzaW9uXCIpfSBpY29uPVwidW52ZXJpZmllZFwiIHsuLi5wcm9wc30gLz5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBFMmVQYWRsb2NrVW5lbmNyeXB0ZWQocHJvcHMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8RTJlUGFkbG9jayB0aXRsZT17X3QoXCJVbmVuY3J5cHRlZFwiKX0gaWNvbj1cInVuZW5jcnlwdGVkXCIgey4uLnByb3BzfSAvPlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIEUyZVBhZGxvY2tVbmtub3duKHByb3BzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPEUyZVBhZGxvY2sgdGl0bGU9e190KFwiRW5jcnlwdGVkIGJ5IGEgZGVsZXRlZCBzZXNzaW9uXCIpfSBpY29uPVwidW5rbm93blwiIHsuLi5wcm9wc30gLz5cbiAgICApO1xufVxuXG5jbGFzcyBFMmVQYWRsb2NrIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBpY29uOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHRpdGxlOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25Ib3ZlclN0YXJ0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogdHJ1ZX0pO1xuICAgIH07XG5cbiAgICBvbkhvdmVyRW5kID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogZmFsc2V9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgdG9vbHRpcCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmhvdmVyKSB7XG4gICAgICAgICAgICBjb25zdCBUb29sdGlwID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlRvb2x0aXBcIik7XG4gICAgICAgICAgICB0b29sdGlwID0gPFRvb2x0aXAgY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2UyZUljb25fdG9vbHRpcFwiIGxhYmVsPXt0aGlzLnByb3BzLnRpdGxlfSBkaXI9XCJhdXRvXCIgLz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2xhc3NlcyA9IGBteF9FdmVudFRpbGVfZTJlSWNvbiBteF9FdmVudFRpbGVfZTJlSWNvbl8ke3RoaXMucHJvcHMuaWNvbn1gO1xuICAgICAgICBpZiAoIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJhbHdheXNTaG93RW5jcnlwdGlvbkljb25zXCIpKSB7XG4gICAgICAgICAgICBjbGFzc2VzICs9ICcgbXhfRXZlbnRUaWxlX2UyZUljb25faGlkZGVuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja31cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMub25Ib3ZlclN0YXJ0fVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17dGhpcy5vbkhvdmVyRW5kfVxuICAgICAgICAgICAgPnt0b29sdGlwfTwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==