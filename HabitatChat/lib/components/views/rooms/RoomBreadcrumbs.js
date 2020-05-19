"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _SettingsStore = _interopRequireWildcard(require("../../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _RoomAvatar = _interopRequireDefault(require("../avatars/RoomAvatar"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Analytics = _interopRequireDefault(require("../../../Analytics"));

var RoomNotifs = _interopRequireWildcard(require("../../../RoomNotifs"));

var FormattingUtils = _interopRequireWildcard(require("../../../utils/FormattingUtils"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var _languageHandler = require("../../../languageHandler");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const MAX_ROOMS = 20;
const MIN_ROOMS_BEFORE_ENABLED = 10; // The threshold time in milliseconds to wait for an autojoined room to show up.

const AUTOJOIN_WAIT_THRESHOLD_MS = 90000; // 90 seconds

class RoomBreadcrumbs extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onMyMembership", (room, membership) => {
      if (membership === "leave" || membership === "ban") {
        const rooms = this.state.rooms.slice();
        const roomState = rooms.find(r => r.room.roomId === room.roomId);

        if (roomState) {
          roomState.left = true;
          this.setState({
            rooms
          });
        }
      }

      this.onRoomMembershipChanged();
    });
    (0, _defineProperty2.default)(this, "onRoomReceipt", (event, room) => {
      if (this.state.rooms.map(r => r.room.roomId).includes(room.roomId)) {
        this._calculateRoomBadges(room);
      }
    });
    (0, _defineProperty2.default)(this, "onRoomTimeline", (event, room) => {
      if (!room) return; // Can be null for the notification timeline, etc.

      if (this.state.rooms.map(r => r.room.roomId).includes(room.roomId)) {
        this._calculateRoomBadges(room);
      }
    });
    (0, _defineProperty2.default)(this, "onEventDecrypted", event => {
      if (this.state.rooms.map(r => r.room.roomId).includes(event.getRoomId())) {
        this._calculateRoomBadges(_MatrixClientPeg.MatrixClientPeg.get().getRoom(event.getRoomId()));
      }
    });
    (0, _defineProperty2.default)(this, "onBreadcrumbsChanged", (settingName, roomId, level, valueAtLevel, value) => {
      if (!value) return;
      const currentState = this.state.rooms.map(r => r.room.roomId);

      if (currentState.length === value.length) {
        let changed = false;

        for (let i = 0; i < currentState.length; i++) {
          if (currentState[i] !== value[i]) {
            changed = true;
            break;
          }
        }

        if (!changed) return;
      }

      this._loadRoomIds(value);
    });
    (0, _defineProperty2.default)(this, "onRoomMembershipChanged", () => {
      if (!this.state.enabled && this._shouldEnable()) {
        this.setState({
          enabled: true
        });
      }
    });
    (0, _defineProperty2.default)(this, "onRoom", room => {
      // Always check for membership changes when we see new rooms
      this.onRoomMembershipChanged();

      const waitingRoom = this._waitingRoomQueue.find(r => r.roomId === room.roomId);

      if (!waitingRoom) return;

      this._waitingRoomQueue.splice(this._waitingRoomQueue.indexOf(waitingRoom), 1);

      const now = new Date().getTime();
      if (now - waitingRoom.addedTs > AUTOJOIN_WAIT_THRESHOLD_MS) return; // Too long ago.

      this._appendRoomId(room.roomId); // add the room we've been waiting for

    });
    this.state = {
      rooms: [],
      enabled: false
    };
    this.onAction = this.onAction.bind(this);
    this._dispatcherRef = null; // The room IDs we're waiting to come down the Room handler and when we
    // started waiting for them. Used to track a room over an upgrade/autojoin.

    this._waitingRoomQueue = [
      /* { roomId, addedTs } */
    ];
    this._scroller = (0, _react.createRef)();
  } // TODO: [REACT-WARNING] Move this to constructor


  UNSAFE_componentWillMount() {
    // eslint-disable-line camelcase
    this._dispatcherRef = _dispatcher.default.register(this.onAction);

    const storedRooms = _SettingsStore.default.getValue("breadcrumb_rooms");

    this._loadRoomIds(storedRooms || []);

    this._settingWatchRef = _SettingsStore.default.watchSetting("breadcrumb_rooms", null, this.onBreadcrumbsChanged);
    this.setState({
      enabled: this._shouldEnable()
    });

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.myMembership", this.onMyMembership);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.receipt", this.onRoomReceipt);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.timeline", this.onRoomTimeline);

    _MatrixClientPeg.MatrixClientPeg.get().on("Event.decrypted", this.onEventDecrypted);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room", this.onRoom);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this._dispatcherRef);

    _SettingsStore.default.unwatchSetting(this._settingWatchRef);

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("Room.myMembership", this.onMyMembership);
      client.removeListener("Room.receipt", this.onRoomReceipt);
      client.removeListener("Room.timeline", this.onRoomTimeline);
      client.removeListener("Event.decrypted", this.onEventDecrypted);
      client.removeListener("Room", this.onRoom);
    }
  }

  componentDidUpdate() {
    const rooms = this.state.rooms.slice();

    if (rooms.length) {
      const roomModel = rooms[0];

      if (!roomModel.animated) {
        roomModel.animated = true;
        setTimeout(() => this.setState({
          rooms
        }), 0);
      }
    }
  }

  onAction(payload) {
    switch (payload.action) {
      case 'view_room':
        if (payload.auto_join && !_MatrixClientPeg.MatrixClientPeg.get().getRoom(payload.room_id)) {
          // Queue the room instead of pushing it immediately - we're probably just waiting
          // for a join to complete (ie: joining the upgraded room).
          this._waitingRoomQueue.push({
            roomId: payload.room_id,
            addedTs: new Date().getTime()
          });

          break;
        }

        this._appendRoomId(payload.room_id);

        break;
      // XXX: slight hack in order to zero the notification count when a room
      // is read. Copied from RoomTile

      case 'on_room_read':
        {
          const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(payload.roomId);

          this._calculateRoomBadges(room,
          /*zero=*/
          true);

          break;
        }
    }
  }

  _shouldEnable() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const joinedRoomCount = client.getRooms().reduce((count, r) => {
      return count + (r.getMyMembership() === "join" ? 1 : 0);
    }, 0);
    return joinedRoomCount >= MIN_ROOMS_BEFORE_ENABLED;
  }

  _loadRoomIds(roomIds) {
    if (!roomIds || roomIds.length <= 0) return; // Skip updates with no rooms
    // If we're here, the list changed.

    const rooms = roomIds.map(r => _MatrixClientPeg.MatrixClientPeg.get().getRoom(r)).filter(r => r).map(r => {
      const badges = this._calculateBadgesForRoom(r) || {};
      return _objectSpread({
        room: r,
        animated: false
      }, badges);
    });
    this.setState({
      rooms: rooms
    });
  }

  _calculateBadgesForRoom(room, zero = false) {
    if (!room) return null; // Reset the notification variables for simplicity

    const roomModel = {
      redBadge: false,
      formattedCount: "0",
      showCount: false
    };
    if (zero) return roomModel;
    const notifState = RoomNotifs.getRoomNotifsState(room.roomId);

    if (RoomNotifs.MENTION_BADGE_STATES.includes(notifState)) {
      const highlightNotifs = RoomNotifs.getUnreadNotificationCount(room, 'highlight');
      const unreadNotifs = RoomNotifs.getUnreadNotificationCount(room);
      const redBadge = highlightNotifs > 0;
      const greyBadge = redBadge || unreadNotifs > 0 && RoomNotifs.BADGE_STATES.includes(notifState);

      if (redBadge || greyBadge) {
        const notifCount = redBadge ? highlightNotifs : unreadNotifs;
        const limitedCount = FormattingUtils.formatCount(notifCount);
        roomModel.redBadge = redBadge;
        roomModel.formattedCount = limitedCount;
        roomModel.showCount = true;
      }
    }

    return roomModel;
  }

  _calculateRoomBadges(room, zero = false) {
    if (!room) return;
    const rooms = this.state.rooms.slice();
    const roomModel = rooms.find(r => r.room.roomId === room.roomId);
    if (!roomModel) return; // No applicable room, so don't do math on it

    const badges = this._calculateBadgesForRoom(room, zero);

    if (!badges) return; // No badges for some reason

    Object.assign(roomModel, badges);
    this.setState({
      rooms
    });
  }

  _appendRoomId(roomId) {
    let room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId);

    if (!room) return;
    const rooms = this.state.rooms.slice(); // If the room is upgraded, use that room instead. We'll also splice out
    // any children of the room.

    const history = _MatrixClientPeg.MatrixClientPeg.get().getRoomUpgradeHistory(roomId);

    if (history.length > 1) {
      room = history[history.length - 1]; // Last room is most recent
      // Take out any room that isn't the most recent room

      for (let i = 0; i < history.length - 1; i++) {
        const idx = rooms.findIndex(r => r.room.roomId === history[i].roomId);
        if (idx !== -1) rooms.splice(idx, 1);
      }
    }

    const existingIdx = rooms.findIndex(r => r.room.roomId === room.roomId);

    if (existingIdx !== -1) {
      rooms.splice(existingIdx, 1);
    }

    rooms.splice(0, 0, {
      room,
      animated: false
    });

    if (rooms.length > MAX_ROOMS) {
      rooms.splice(MAX_ROOMS, rooms.length - MAX_ROOMS);
    }

    this.setState({
      rooms
    });

    if (this._scroller.current) {
      this._scroller.current.moveToOrigin();
    } // We don't track room aesthetics (badges, membership, etc) over the wire so we
    // don't need to do this elsewhere in the file. Just where we alter the room IDs
    // and their order.


    const roomIds = rooms.map(r => r.room.roomId);

    if (roomIds.length > 0) {
      _SettingsStore.default.setValue("breadcrumb_rooms", null, _SettingsStore.SettingLevel.ACCOUNT, roomIds);
    }
  }

  _viewRoom(room, index) {
    _Analytics.default.trackEvent("Breadcrumbs", "click_node", index);

    _dispatcher.default.dispatch({
      action: "view_room",
      room_id: room.roomId
    });
  }

  _onMouseEnter(room) {
    this._onHover(room);
  }

  _onMouseLeave(room) {
    this._onHover(null); // clear hover states

  }

  _onHover(room) {
    const rooms = this.state.rooms.slice();

    for (const r of rooms) {
      r.hover = room && r.room.roomId === room.roomId;
    }

    this.setState({
      rooms
    });
  }

  _isDmRoom(room) {
    const dmRooms = _DMRoomMap.default.shared().getUserIdForRoomId(room.roomId);

    return Boolean(dmRooms);
  }

  render() {
    const Tooltip = sdk.getComponent('elements.Tooltip');
    const IndicatorScrollbar = sdk.getComponent('structures.IndicatorScrollbar'); // check for collapsed here and not at parent so we keep rooms in our state
    // when collapsing and expanding

    if (this.props.collapsed || !this.state.enabled) {
      return null;
    }

    const rooms = this.state.rooms;
    const avatars = rooms.map((r, i) => {
      const isFirst = i === 0;
      const classes = (0, _classnames.default)({
        "mx_RoomBreadcrumbs_crumb": true,
        "mx_RoomBreadcrumbs_preAnimate": isFirst && !r.animated,
        "mx_RoomBreadcrumbs_animate": isFirst,
        "mx_RoomBreadcrumbs_left": r.left
      });
      let tooltip = null;

      if (r.hover) {
        tooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
          label: r.room.name
        });
      }

      let badge;

      if (r.showCount) {
        const badgeClasses = (0, _classnames.default)({
          'mx_RoomTile_badge': true,
          'mx_RoomTile_badgeButton': true,
          'mx_RoomTile_badgeRed': r.redBadge,
          'mx_RoomTile_badgeUnread': !r.redBadge
        });
        badge = /*#__PURE__*/_react.default.createElement("div", {
          className: badgeClasses
        }, r.formattedCount);
      }

      return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: classes,
        key: r.room.roomId,
        onClick: () => this._viewRoom(r.room, i),
        onMouseEnter: () => this._onMouseEnter(r.room),
        onMouseLeave: () => this._onMouseLeave(r.room),
        "aria-label": (0, _languageHandler._t)("Room %(name)s", {
          name: r.room.name
        })
      }, /*#__PURE__*/_react.default.createElement(_RoomAvatar.default, {
        room: r.room,
        width: 32,
        height: 32
      }), badge, tooltip);
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      role: "toolbar",
      "aria-label": (0, _languageHandler._t)("Recent rooms")
    }, /*#__PURE__*/_react.default.createElement(IndicatorScrollbar, {
      ref: this._scroller,
      className: "mx_RoomBreadcrumbs",
      trackHorizontalOverflow: true,
      verticalScrollsHorizontally: true
    }, avatars));
  }

}

exports.default = RoomBreadcrumbs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21CcmVhZGNydW1icy5qcyJdLCJuYW1lcyI6WyJNQVhfUk9PTVMiLCJNSU5fUk9PTVNfQkVGT1JFX0VOQUJMRUQiLCJBVVRPSk9JTl9XQUlUX1RIUkVTSE9MRF9NUyIsIlJvb21CcmVhZGNydW1icyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInJvb20iLCJtZW1iZXJzaGlwIiwicm9vbXMiLCJzdGF0ZSIsInNsaWNlIiwicm9vbVN0YXRlIiwiZmluZCIsInIiLCJyb29tSWQiLCJsZWZ0Iiwic2V0U3RhdGUiLCJvblJvb21NZW1iZXJzaGlwQ2hhbmdlZCIsImV2ZW50IiwibWFwIiwiaW5jbHVkZXMiLCJfY2FsY3VsYXRlUm9vbUJhZGdlcyIsImdldFJvb21JZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFJvb20iLCJzZXR0aW5nTmFtZSIsImxldmVsIiwidmFsdWVBdExldmVsIiwidmFsdWUiLCJjdXJyZW50U3RhdGUiLCJsZW5ndGgiLCJjaGFuZ2VkIiwiaSIsIl9sb2FkUm9vbUlkcyIsImVuYWJsZWQiLCJfc2hvdWxkRW5hYmxlIiwid2FpdGluZ1Jvb20iLCJfd2FpdGluZ1Jvb21RdWV1ZSIsInNwbGljZSIsImluZGV4T2YiLCJub3ciLCJEYXRlIiwiZ2V0VGltZSIsImFkZGVkVHMiLCJfYXBwZW5kUm9vbUlkIiwib25BY3Rpb24iLCJiaW5kIiwiX2Rpc3BhdGNoZXJSZWYiLCJfc2Nyb2xsZXIiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiZGlzIiwicmVnaXN0ZXIiLCJzdG9yZWRSb29tcyIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsIl9zZXR0aW5nV2F0Y2hSZWYiLCJ3YXRjaFNldHRpbmciLCJvbkJyZWFkY3J1bWJzQ2hhbmdlZCIsIm9uIiwib25NeU1lbWJlcnNoaXAiLCJvblJvb21SZWNlaXB0Iiwib25Sb29tVGltZWxpbmUiLCJvbkV2ZW50RGVjcnlwdGVkIiwib25Sb29tIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwidW53YXRjaFNldHRpbmciLCJjbGllbnQiLCJyZW1vdmVMaXN0ZW5lciIsImNvbXBvbmVudERpZFVwZGF0ZSIsInJvb21Nb2RlbCIsImFuaW1hdGVkIiwic2V0VGltZW91dCIsInBheWxvYWQiLCJhY3Rpb24iLCJhdXRvX2pvaW4iLCJyb29tX2lkIiwicHVzaCIsImpvaW5lZFJvb21Db3VudCIsImdldFJvb21zIiwicmVkdWNlIiwiY291bnQiLCJnZXRNeU1lbWJlcnNoaXAiLCJyb29tSWRzIiwiZmlsdGVyIiwiYmFkZ2VzIiwiX2NhbGN1bGF0ZUJhZGdlc0ZvclJvb20iLCJ6ZXJvIiwicmVkQmFkZ2UiLCJmb3JtYXR0ZWRDb3VudCIsInNob3dDb3VudCIsIm5vdGlmU3RhdGUiLCJSb29tTm90aWZzIiwiZ2V0Um9vbU5vdGlmc1N0YXRlIiwiTUVOVElPTl9CQURHRV9TVEFURVMiLCJoaWdobGlnaHROb3RpZnMiLCJnZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCIsInVucmVhZE5vdGlmcyIsImdyZXlCYWRnZSIsIkJBREdFX1NUQVRFUyIsIm5vdGlmQ291bnQiLCJsaW1pdGVkQ291bnQiLCJGb3JtYXR0aW5nVXRpbHMiLCJmb3JtYXRDb3VudCIsIk9iamVjdCIsImFzc2lnbiIsImhpc3RvcnkiLCJnZXRSb29tVXBncmFkZUhpc3RvcnkiLCJpZHgiLCJmaW5kSW5kZXgiLCJleGlzdGluZ0lkeCIsImN1cnJlbnQiLCJtb3ZlVG9PcmlnaW4iLCJzZXRWYWx1ZSIsIlNldHRpbmdMZXZlbCIsIkFDQ09VTlQiLCJfdmlld1Jvb20iLCJpbmRleCIsIkFuYWx5dGljcyIsInRyYWNrRXZlbnQiLCJkaXNwYXRjaCIsIl9vbk1vdXNlRW50ZXIiLCJfb25Ib3ZlciIsIl9vbk1vdXNlTGVhdmUiLCJob3ZlciIsIl9pc0RtUm9vbSIsImRtUm9vbXMiLCJETVJvb21NYXAiLCJzaGFyZWQiLCJnZXRVc2VySWRGb3JSb29tSWQiLCJCb29sZWFuIiwicmVuZGVyIiwiVG9vbHRpcCIsInNkayIsImdldENvbXBvbmVudCIsIkluZGljYXRvclNjcm9sbGJhciIsImNvbGxhcHNlZCIsImF2YXRhcnMiLCJpc0ZpcnN0IiwiY2xhc3NlcyIsInRvb2x0aXAiLCJuYW1lIiwiYmFkZ2UiLCJiYWRnZUNsYXNzZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBRyxFQUFsQjtBQUNBLE1BQU1DLHdCQUF3QixHQUFHLEVBQWpDLEMsQ0FFQTs7QUFDQSxNQUFNQywwQkFBMEIsR0FBRyxLQUFuQyxDLENBQTBDOztBQUUzQixNQUFNQyxlQUFOLFNBQThCQyxlQUFNQyxTQUFwQyxDQUE4QztBQUN6REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsMERBaUZGLENBQUNDLElBQUQsRUFBT0MsVUFBUCxLQUFzQjtBQUNuQyxVQUFJQSxVQUFVLEtBQUssT0FBZixJQUEwQkEsVUFBVSxLQUFLLEtBQTdDLEVBQW9EO0FBQ2hELGNBQU1DLEtBQUssR0FBRyxLQUFLQyxLQUFMLENBQVdELEtBQVgsQ0FBaUJFLEtBQWpCLEVBQWQ7QUFDQSxjQUFNQyxTQUFTLEdBQUdILEtBQUssQ0FBQ0ksSUFBTixDQUFZQyxDQUFELElBQU9BLENBQUMsQ0FBQ1AsSUFBRixDQUFPUSxNQUFQLEtBQWtCUixJQUFJLENBQUNRLE1BQXpDLENBQWxCOztBQUNBLFlBQUlILFNBQUosRUFBZTtBQUNYQSxVQUFBQSxTQUFTLENBQUNJLElBQVYsR0FBaUIsSUFBakI7QUFDQSxlQUFLQyxRQUFMLENBQWM7QUFBQ1IsWUFBQUE7QUFBRCxXQUFkO0FBQ0g7QUFDSjs7QUFDRCxXQUFLUyx1QkFBTDtBQUNILEtBM0ZrQjtBQUFBLHlEQTZG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RTtBQUpqQyxPQU1NeUYsT0FOTixDQURKLENBREo7QUFZSDs7QUFwV3dEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlLCB7U2V0dGluZ0xldmVsfSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgUm9vbUF2YXRhciBmcm9tICcuLi9hdmF0YXJzL1Jvb21BdmF0YXInO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQgQW5hbHl0aWNzIGZyb20gXCIuLi8uLi8uLi9BbmFseXRpY3NcIjtcbmltcG9ydCAqIGFzIFJvb21Ob3RpZnMgZnJvbSAnLi4vLi4vLi4vUm9vbU5vdGlmcyc7XG5pbXBvcnQgKiBhcyBGb3JtYXR0aW5nVXRpbHMgZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0Zvcm1hdHRpbmdVdGlsc1wiO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvRE1Sb29tTWFwXCI7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5cbmNvbnN0IE1BWF9ST09NUyA9IDIwO1xuY29uc3QgTUlOX1JPT01TX0JFRk9SRV9FTkFCTEVEID0gMTA7XG5cbi8vIFRoZSB0aHJlc2hvbGQgdGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBmb3IgYW4gYXV0b2pvaW5lZCByb29tIHRvIHNob3cgdXAuXG5jb25zdCBBVVRPSk9JTl9XQUlUX1RIUkVTSE9MRF9NUyA9IDkwMDAwOyAvLyA5MCBzZWNvbmRzXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJvb21CcmVhZGNydW1icyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge3Jvb21zOiBbXSwgZW5hYmxlZDogZmFsc2V9O1xuXG4gICAgICAgIHRoaXMub25BY3Rpb24gPSB0aGlzLm9uQWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXJSZWYgPSBudWxsO1xuXG4gICAgICAgIC8vIFRoZSByb29tIElEcyB3ZSdyZSB3YWl0aW5nIHRvIGNvbWUgZG93biB0aGUgUm9vbSBoYW5kbGVyIGFuZCB3aGVuIHdlXG4gICAgICAgIC8vIHN0YXJ0ZWQgd2FpdGluZyBmb3IgdGhlbS4gVXNlZCB0byB0cmFjayBhIHJvb20gb3ZlciBhbiB1cGdyYWRlL2F1dG9qb2luLlxuICAgICAgICB0aGlzLl93YWl0aW5nUm9vbVF1ZXVlID0gWy8qIHsgcm9vbUlkLCBhZGRlZFRzIH0gKi9dO1xuXG4gICAgICAgIHRoaXMuX3Njcm9sbGVyID0gY3JlYXRlUmVmKCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG5cbiAgICAgICAgY29uc3Qgc3RvcmVkUm9vbXMgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiYnJlYWRjcnVtYl9yb29tc1wiKTtcbiAgICAgICAgdGhpcy5fbG9hZFJvb21JZHMoc3RvcmVkUm9vbXMgfHwgW10pO1xuXG4gICAgICAgIHRoaXMuX3NldHRpbmdXYXRjaFJlZiA9IFNldHRpbmdzU3RvcmUud2F0Y2hTZXR0aW5nKFwiYnJlYWRjcnVtYl9yb29tc1wiLCBudWxsLCB0aGlzLm9uQnJlYWRjcnVtYnNDaGFuZ2VkKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtlbmFibGVkOiB0aGlzLl9zaG91bGRFbmFibGUoKX0pO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20ubXlNZW1iZXJzaGlwXCIsIHRoaXMub25NeU1lbWJlcnNoaXApO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oXCJSb29tLnJlY2VpcHRcIiwgdGhpcy5vblJvb21SZWNlaXB0KTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiRXZlbnQuZGVjcnlwdGVkXCIsIHRoaXMub25FdmVudERlY3J5cHRlZCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb21cIiwgdGhpcy5vblJvb20pO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLl9kaXNwYXRjaGVyUmVmKTtcblxuICAgICAgICBTZXR0aW5nc1N0b3JlLnVud2F0Y2hTZXR0aW5nKHRoaXMuX3NldHRpbmdXYXRjaFJlZik7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpZW50KSB7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tLm15TWVtYmVyc2hpcFwiLCB0aGlzLm9uTXlNZW1iZXJzaGlwKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ucmVjZWlwdFwiLCB0aGlzLm9uUm9vbVJlY2VpcHQpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIkV2ZW50LmRlY3J5cHRlZFwiLCB0aGlzLm9uRXZlbnREZWNyeXB0ZWQpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbVwiLCB0aGlzLm9uUm9vbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHJvb21zID0gdGhpcy5zdGF0ZS5yb29tcy5zbGljZSgpO1xuXG4gICAgICAgIGlmIChyb29tcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb21Nb2RlbCA9IHJvb21zWzBdO1xuICAgICAgICAgICAgaWYgKCFyb29tTW9kZWwuYW5pbWF0ZWQpIHtcbiAgICAgICAgICAgICAgICByb29tTW9kZWwuYW5pbWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zZXRTdGF0ZSh7cm9vbXN9KSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkFjdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfcm9vbSc6XG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuYXV0b19qb2luICYmICFNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShwYXlsb2FkLnJvb21faWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFF1ZXVlIHRoZSByb29tIGluc3RlYWQgb2YgcHVzaGluZyBpdCBpbW1lZGlhdGVseSAtIHdlJ3JlIHByb2JhYmx5IGp1c3Qgd2FpdGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgYSBqb2luIHRvIGNvbXBsZXRlIChpZTogam9pbmluZyB0aGUgdXBncmFkZWQgcm9vbSkuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dhaXRpbmdSb29tUXVldWUucHVzaCh7cm9vbUlkOiBwYXlsb2FkLnJvb21faWQsIGFkZGVkVHM6IChuZXcgRGF0ZSkuZ2V0VGltZSgpfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRSb29tSWQocGF5bG9hZC5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgLy8gWFhYOiBzbGlnaHQgaGFjayBpbiBvcmRlciB0byB6ZXJvIHRoZSBub3RpZmljYXRpb24gY291bnQgd2hlbiBhIHJvb21cbiAgICAgICAgICAgIC8vIGlzIHJlYWQuIENvcGllZCBmcm9tIFJvb21UaWxlXG4gICAgICAgICAgICBjYXNlICdvbl9yb29tX3JlYWQnOiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHBheWxvYWQucm9vbUlkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVSb29tQmFkZ2VzKHJvb20sIC8qemVybz0qL3RydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25NeU1lbWJlcnNoaXAgPSAocm9vbSwgbWVtYmVyc2hpcCkgPT4ge1xuICAgICAgICBpZiAobWVtYmVyc2hpcCA9PT0gXCJsZWF2ZVwiIHx8IG1lbWJlcnNoaXAgPT09IFwiYmFuXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb21zID0gdGhpcy5zdGF0ZS5yb29tcy5zbGljZSgpO1xuICAgICAgICAgICAgY29uc3Qgcm9vbVN0YXRlID0gcm9vbXMuZmluZCgocikgPT4gci5yb29tLnJvb21JZCA9PT0gcm9vbS5yb29tSWQpO1xuICAgICAgICAgICAgaWYgKHJvb21TdGF0ZSkge1xuICAgICAgICAgICAgICAgIHJvb21TdGF0ZS5sZWZ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtyb29tc30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub25Sb29tTWVtYmVyc2hpcENoYW5nZWQoKTtcbiAgICB9O1xuXG4gICAgb25Sb29tUmVjZWlwdCA9IChldmVudCwgcm9vbSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5yb29tcy5tYXAociA9PiByLnJvb20ucm9vbUlkKS5pbmNsdWRlcyhyb29tLnJvb21JZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZVJvb21CYWRnZXMocm9vbSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Sb29tVGltZWxpbmUgPSAoZXZlbnQsIHJvb20pID0+IHtcbiAgICAgICAgaWYgKCFyb29tKSByZXR1cm47IC8vIENhbiBiZSBudWxsIGZvciB0aGUgbm90aWZpY2F0aW9uIHRpbWVsaW5lLCBldGMuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnJvb21zLm1hcChyID0+IHIucm9vbS5yb29tSWQpLmluY2x1ZGVzKHJvb20ucm9vbUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlUm9vbUJhZGdlcyhyb29tKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBvbkV2ZW50RGVjcnlwdGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnJvb21zLm1hcChyID0+IHIucm9vbS5yb29tSWQpLmluY2x1ZGVzKGV2ZW50LmdldFJvb21JZCgpKSkge1xuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlUm9vbUJhZGdlcyhNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShldmVudC5nZXRSb29tSWQoKSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uQnJlYWRjcnVtYnNDaGFuZ2VkID0gKHNldHRpbmdOYW1lLCByb29tSWQsIGxldmVsLCB2YWx1ZUF0TGV2ZWwsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSB0aGlzLnN0YXRlLnJvb21zLm1hcCgocikgPT4gci5yb29tLnJvb21JZCk7XG4gICAgICAgIGlmIChjdXJyZW50U3RhdGUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnRTdGF0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U3RhdGVbaV0gIT09IHZhbHVlW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNoYW5nZWQpIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xvYWRSb29tSWRzKHZhbHVlKTtcbiAgICB9O1xuXG4gICAgb25Sb29tTWVtYmVyc2hpcENoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5lbmFibGVkICYmIHRoaXMuX3Nob3VsZEVuYWJsZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtlbmFibGVkOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Sb29tID0gKHJvb20pID0+IHtcbiAgICAgICAgLy8gQWx3YXlzIGNoZWNrIGZvciBtZW1iZXJzaGlwIGNoYW5nZXMgd2hlbiB3ZSBzZWUgbmV3IHJvb21zXG4gICAgICAgIHRoaXMub25Sb29tTWVtYmVyc2hpcENoYW5nZWQoKTtcblxuICAgICAgICBjb25zdCB3YWl0aW5nUm9vbSA9IHRoaXMuX3dhaXRpbmdSb29tUXVldWUuZmluZChyID0+IHIucm9vbUlkID09PSByb29tLnJvb21JZCk7XG4gICAgICAgIGlmICghd2FpdGluZ1Jvb20pIHJldHVybjtcbiAgICAgICAgdGhpcy5fd2FpdGluZ1Jvb21RdWV1ZS5zcGxpY2UodGhpcy5fd2FpdGluZ1Jvb21RdWV1ZS5pbmRleE9mKHdhaXRpbmdSb29tKSwgMSk7XG5cbiAgICAgICAgY29uc3Qgbm93ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgaWYgKChub3cgLSB3YWl0aW5nUm9vbS5hZGRlZFRzKSA+IEFVVE9KT0lOX1dBSVRfVEhSRVNIT0xEX01TKSByZXR1cm47IC8vIFRvbyBsb25nIGFnby5cbiAgICAgICAgdGhpcy5fYXBwZW5kUm9vbUlkKHJvb20ucm9vbUlkKTsgLy8gYWRkIHRoZSByb29tIHdlJ3ZlIGJlZW4gd2FpdGluZyBmb3JcbiAgICB9O1xuXG4gICAgX3Nob3VsZEVuYWJsZSgpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBqb2luZWRSb29tQ291bnQgPSBjbGllbnQuZ2V0Um9vbXMoKS5yZWR1Y2UoKGNvdW50LCByKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY291bnQgKyAoci5nZXRNeU1lbWJlcnNoaXAoKSA9PT0gXCJqb2luXCIgPyAxIDogMCk7XG4gICAgICAgIH0sIDApO1xuICAgICAgICByZXR1cm4gam9pbmVkUm9vbUNvdW50ID49IE1JTl9ST09NU19CRUZPUkVfRU5BQkxFRDtcbiAgICB9XG5cbiAgICBfbG9hZFJvb21JZHMocm9vbUlkcykge1xuICAgICAgICBpZiAoIXJvb21JZHMgfHwgcm9vbUlkcy5sZW5ndGggPD0gMCkgcmV0dXJuOyAvLyBTa2lwIHVwZGF0ZXMgd2l0aCBubyByb29tc1xuXG4gICAgICAgIC8vIElmIHdlJ3JlIGhlcmUsIHRoZSBsaXN0IGNoYW5nZWQuXG4gICAgICAgIGNvbnN0IHJvb21zID0gcm9vbUlkcy5tYXAoKHIpID0+IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHIpKS5maWx0ZXIoKHIpID0+IHIpLm1hcCgocikgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmFkZ2VzID0gdGhpcy5fY2FsY3VsYXRlQmFkZ2VzRm9yUm9vbShyKSB8fCB7fTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcm9vbTogcixcbiAgICAgICAgICAgICAgICBhbmltYXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgLi4uYmFkZ2VzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcm9vbXM6IHJvb21zLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfY2FsY3VsYXRlQmFkZ2VzRm9yUm9vbShyb29tLCB6ZXJvPWZhbHNlKSB7XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5vdGlmaWNhdGlvbiB2YXJpYWJsZXMgZm9yIHNpbXBsaWNpdHlcbiAgICAgICAgY29uc3Qgcm9vbU1vZGVsID0ge1xuICAgICAgICAgICAgcmVkQmFkZ2U6IGZhbHNlLFxuICAgICAgICAgICAgZm9ybWF0dGVkQ291bnQ6IFwiMFwiLFxuICAgICAgICAgICAgc2hvd0NvdW50OiBmYWxzZSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoemVybykgcmV0dXJuIHJvb21Nb2RlbDtcblxuICAgICAgICBjb25zdCBub3RpZlN0YXRlID0gUm9vbU5vdGlmcy5nZXRSb29tTm90aWZzU3RhdGUocm9vbS5yb29tSWQpO1xuICAgICAgICBpZiAoUm9vbU5vdGlmcy5NRU5USU9OX0JBREdFX1NUQVRFUy5pbmNsdWRlcyhub3RpZlN0YXRlKSkge1xuICAgICAgICAgICAgY29uc3QgaGlnaGxpZ2h0Tm90aWZzID0gUm9vbU5vdGlmcy5nZXRVbnJlYWROb3RpZmljYXRpb25Db3VudChyb29tLCAnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICBjb25zdCB1bnJlYWROb3RpZnMgPSBSb29tTm90aWZzLmdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50KHJvb20pO1xuXG4gICAgICAgICAgICBjb25zdCByZWRCYWRnZSA9IGhpZ2hsaWdodE5vdGlmcyA+IDA7XG4gICAgICAgICAgICBjb25zdCBncmV5QmFkZ2UgPSByZWRCYWRnZSB8fCAodW5yZWFkTm90aWZzID4gMCAmJiBSb29tTm90aWZzLkJBREdFX1NUQVRFUy5pbmNsdWRlcyhub3RpZlN0YXRlKSk7XG5cbiAgICAgICAgICAgIGlmIChyZWRCYWRnZSB8fCBncmV5QmFkZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub3RpZkNvdW50ID0gcmVkQmFkZ2UgPyBoaWdobGlnaHROb3RpZnMgOiB1bnJlYWROb3RpZnM7XG4gICAgICAgICAgICAgICAgY29uc3QgbGltaXRlZENvdW50ID0gRm9ybWF0dGluZ1V0aWxzLmZvcm1hdENvdW50KG5vdGlmQ291bnQpO1xuXG4gICAgICAgICAgICAgICAgcm9vbU1vZGVsLnJlZEJhZGdlID0gcmVkQmFkZ2U7XG4gICAgICAgICAgICAgICAgcm9vbU1vZGVsLmZvcm1hdHRlZENvdW50ID0gbGltaXRlZENvdW50O1xuICAgICAgICAgICAgICAgIHJvb21Nb2RlbC5zaG93Q291bnQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJvb21Nb2RlbDtcbiAgICB9XG5cbiAgICBfY2FsY3VsYXRlUm9vbUJhZGdlcyhyb29tLCB6ZXJvPWZhbHNlKSB7XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHJvb21zID0gdGhpcy5zdGF0ZS5yb29tcy5zbGljZSgpO1xuICAgICAgICBjb25zdCByb29tTW9kZWwgPSByb29tcy5maW5kKChyKSA9PiByLnJvb20ucm9vbUlkID09PSByb29tLnJvb21JZCk7XG4gICAgICAgIGlmICghcm9vbU1vZGVsKSByZXR1cm47IC8vIE5vIGFwcGxpY2FibGUgcm9vbSwgc28gZG9uJ3QgZG8gbWF0aCBvbiBpdFxuXG4gICAgICAgIGNvbnN0IGJhZGdlcyA9IHRoaXMuX2NhbGN1bGF0ZUJhZGdlc0ZvclJvb20ocm9vbSwgemVybyk7XG4gICAgICAgIGlmICghYmFkZ2VzKSByZXR1cm47IC8vIE5vIGJhZGdlcyBmb3Igc29tZSByZWFzb25cblxuICAgICAgICBPYmplY3QuYXNzaWduKHJvb21Nb2RlbCwgYmFkZ2VzKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cm9vbXN9KTtcbiAgICB9XG5cbiAgICBfYXBwZW5kUm9vbUlkKHJvb21JZCkge1xuICAgICAgICBsZXQgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHJvb21JZCk7XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHJvb21zID0gdGhpcy5zdGF0ZS5yb29tcy5zbGljZSgpO1xuXG4gICAgICAgIC8vIElmIHRoZSByb29tIGlzIHVwZ3JhZGVkLCB1c2UgdGhhdCByb29tIGluc3RlYWQuIFdlJ2xsIGFsc28gc3BsaWNlIG91dFxuICAgICAgICAvLyBhbnkgY2hpbGRyZW4gb2YgdGhlIHJvb20uXG4gICAgICAgIGNvbnN0IGhpc3RvcnkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbVVwZ3JhZGVIaXN0b3J5KHJvb21JZCk7XG4gICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHJvb20gPSBoaXN0b3J5W2hpc3RvcnkubGVuZ3RoIC0gMV07IC8vIExhc3Qgcm9vbSBpcyBtb3N0IHJlY2VudFxuXG4gICAgICAgICAgICAvLyBUYWtlIG91dCBhbnkgcm9vbSB0aGF0IGlzbid0IHRoZSBtb3N0IHJlY2VudCByb29tXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpc3RvcnkubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gcm9vbXMuZmluZEluZGV4KChyKSA9PiByLnJvb20ucm9vbUlkID09PSBoaXN0b3J5W2ldLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHJvb21zLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhpc3RpbmdJZHggPSByb29tcy5maW5kSW5kZXgoKHIpID0+IHIucm9vbS5yb29tSWQgPT09IHJvb20ucm9vbUlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nSWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgcm9vbXMuc3BsaWNlKGV4aXN0aW5nSWR4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJvb21zLnNwbGljZSgwLCAwLCB7cm9vbSwgYW5pbWF0ZWQ6IGZhbHNlfSk7XG5cbiAgICAgICAgaWYgKHJvb21zLmxlbmd0aCA+IE1BWF9ST09NUykge1xuICAgICAgICAgICAgcm9vbXMuc3BsaWNlKE1BWF9ST09NUywgcm9vbXMubGVuZ3RoIC0gTUFYX1JPT01TKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtyb29tc30pO1xuXG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGxlci5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxlci5jdXJyZW50Lm1vdmVUb09yaWdpbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgZG9uJ3QgdHJhY2sgcm9vbSBhZXN0aGV0aWNzIChiYWRnZXMsIG1lbWJlcnNoaXAsIGV0Yykgb3ZlciB0aGUgd2lyZSBzbyB3ZVxuICAgICAgICAvLyBkb24ndCBuZWVkIHRvIGRvIHRoaXMgZWxzZXdoZXJlIGluIHRoZSBmaWxlLiBKdXN0IHdoZXJlIHdlIGFsdGVyIHRoZSByb29tIElEc1xuICAgICAgICAvLyBhbmQgdGhlaXIgb3JkZXIuXG4gICAgICAgIGNvbnN0IHJvb21JZHMgPSByb29tcy5tYXAoKHIpID0+IHIucm9vbS5yb29tSWQpO1xuICAgICAgICBpZiAocm9vbUlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiYnJlYWRjcnVtYl9yb29tc1wiLCBudWxsLCBTZXR0aW5nTGV2ZWwuQUNDT1VOVCwgcm9vbUlkcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfdmlld1Jvb20ocm9vbSwgaW5kZXgpIHtcbiAgICAgICAgQW5hbHl0aWNzLnRyYWNrRXZlbnQoXCJCcmVhZGNydW1ic1wiLCBcImNsaWNrX25vZGVcIiwgaW5kZXgpO1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogXCJ2aWV3X3Jvb21cIiwgcm9vbV9pZDogcm9vbS5yb29tSWR9KTtcbiAgICB9XG5cbiAgICBfb25Nb3VzZUVudGVyKHJvb20pIHtcbiAgICAgICAgdGhpcy5fb25Ib3Zlcihyb29tKTtcbiAgICB9XG5cbiAgICBfb25Nb3VzZUxlYXZlKHJvb20pIHtcbiAgICAgICAgdGhpcy5fb25Ib3ZlcihudWxsKTsgLy8gY2xlYXIgaG92ZXIgc3RhdGVzXG4gICAgfVxuXG4gICAgX29uSG92ZXIocm9vbSkge1xuICAgICAgICBjb25zdCByb29tcyA9IHRoaXMuc3RhdGUucm9vbXMuc2xpY2UoKTtcbiAgICAgICAgZm9yIChjb25zdCByIG9mIHJvb21zKSB7XG4gICAgICAgICAgICByLmhvdmVyID0gcm9vbSAmJiByLnJvb20ucm9vbUlkID09PSByb29tLnJvb21JZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtyb29tc30pO1xuICAgIH1cblxuICAgIF9pc0RtUm9vbShyb29tKSB7XG4gICAgICAgIGNvbnN0IGRtUm9vbXMgPSBETVJvb21NYXAuc2hhcmVkKCkuZ2V0VXNlcklkRm9yUm9vbUlkKHJvb20ucm9vbUlkKTtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oZG1Sb29tcyk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBUb29sdGlwID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuVG9vbHRpcCcpO1xuICAgICAgICBjb25zdCBJbmRpY2F0b3JTY3JvbGxiYXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLkluZGljYXRvclNjcm9sbGJhcicpO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBjb2xsYXBzZWQgaGVyZSBhbmQgbm90IGF0IHBhcmVudCBzbyB3ZSBrZWVwIHJvb21zIGluIG91ciBzdGF0ZVxuICAgICAgICAvLyB3aGVuIGNvbGxhcHNpbmcgYW5kIGV4cGFuZGluZ1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5jb2xsYXBzZWQgfHwgIXRoaXMuc3RhdGUuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb29tcyA9IHRoaXMuc3RhdGUucm9vbXM7XG4gICAgICAgIGNvbnN0IGF2YXRhcnMgPSByb29tcy5tYXAoKHIsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzRmlyc3QgPSBpID09PSAwO1xuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgIFwibXhfUm9vbUJyZWFkY3J1bWJzX2NydW1iXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9Sb29tQnJlYWRjcnVtYnNfcHJlQW5pbWF0ZVwiOiBpc0ZpcnN0ICYmICFyLmFuaW1hdGVkLFxuICAgICAgICAgICAgICAgIFwibXhfUm9vbUJyZWFkY3J1bWJzX2FuaW1hdGVcIjogaXNGaXJzdCxcbiAgICAgICAgICAgICAgICBcIm14X1Jvb21CcmVhZGNydW1ic19sZWZ0XCI6IHIubGVmdCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdG9vbHRpcCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoci5ob3Zlcikge1xuICAgICAgICAgICAgICAgIHRvb2x0aXAgPSA8VG9vbHRpcCBsYWJlbD17ci5yb29tLm5hbWV9IC8+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgYmFkZ2U7XG4gICAgICAgICAgICBpZiAoci5zaG93Q291bnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiYWRnZUNsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgJ214X1Jvb21UaWxlX2JhZGdlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ214X1Jvb21UaWxlX2JhZGdlQnV0dG9uJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ214X1Jvb21UaWxlX2JhZGdlUmVkJzogci5yZWRCYWRnZSxcbiAgICAgICAgICAgICAgICAgICAgJ214X1Jvb21UaWxlX2JhZGdlVW5yZWFkJzogIXIucmVkQmFkZ2UsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBiYWRnZSA9IDxkaXYgY2xhc3NOYW1lPXtiYWRnZUNsYXNzZXN9PntyLmZvcm1hdHRlZENvdW50fTwvZGl2PjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXN9XG4gICAgICAgICAgICAgICAgICAgIGtleT17ci5yb29tLnJvb21JZH1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5fdmlld1Jvb20oci5yb29tLCBpKX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiB0aGlzLl9vbk1vdXNlRW50ZXIoci5yb29tKX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoKSA9PiB0aGlzLl9vbk1vdXNlTGVhdmUoci5yb29tKX1cbiAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17X3QoXCJSb29tICUobmFtZSlzXCIsIHtuYW1lOiByLnJvb20ubmFtZX0pfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFJvb21BdmF0YXIgcm9vbT17ci5yb29tfSB3aWR0aD17MzJ9IGhlaWdodD17MzJ9IC8+XG4gICAgICAgICAgICAgICAgICAgIHtiYWRnZX1cbiAgICAgICAgICAgICAgICAgICAge3Rvb2x0aXB9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IHJvbGU9XCJ0b29sYmFyXCIgYXJpYS1sYWJlbD17X3QoXCJSZWNlbnQgcm9vbXNcIil9PlxuICAgICAgICAgICAgICAgIDxJbmRpY2F0b3JTY3JvbGxiYXJcbiAgICAgICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9zY3JvbGxlcn1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUm9vbUJyZWFkY3J1bWJzXCJcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tIb3Jpem9udGFsT3ZlcmZsb3c9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsU2Nyb2xsc0hvcml6b250YWxseT17dHJ1ZX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHsgYXZhdGFycyB9XG4gICAgICAgICAgICAgICAgPC9JbmRpY2F0b3JTY3JvbGxiYXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=