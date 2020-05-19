"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _ContextMenu = require("../../structures/ContextMenu");

var RoomNotifs = _interopRequireWildcard(require("../../../RoomNotifs"));

var FormattingUtils = _interopRequireWildcard(require("../../../utils/FormattingUtils"));

var _ActiveRoomObserver = _interopRequireDefault(require("../../../ActiveRoomObserver"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _languageHandler = require("../../../languageHandler");

var _RovingTabIndex = require("../../../accessibility/RovingTabIndex");

var _E2EIcon = _interopRequireDefault(require("./E2EIcon"));

var _InviteOnlyIcon = _interopRequireDefault(require("./InviteOnlyIcon"));

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

var _ShieldUtils = require("../../../utils/ShieldUtils");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
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
// eslint-disable-next-line camelcase
var _default = (0, _createReactClass.default)({
  displayName: 'RoomTile',
  propTypes: {
    onClick: _propTypes.default.func,
    room: _propTypes.default.object.isRequired,
    collapsed: _propTypes.default.bool.isRequired,
    unread: _propTypes.default.bool.isRequired,
    highlight: _propTypes.default.bool.isRequired,
    // If true, apply mx_RoomTile_transparent class
    transparent: _propTypes.default.bool,
    isInvite: _propTypes.default.bool.isRequired,
    incomingCall: _propTypes.default.object
  },
  getDefaultProps: function () {
    return {
      isDragging: false
    };
  },
  getInitialState: function () {
    const joinRules = this.props.room.currentState.getStateEvents("m.room.join_rules", "");
    const joinRule = joinRules && joinRules.getContent().join_rule;
    return {
      joinRule,
      hover: false,
      badgeHover: false,
      contextMenuPosition: null,
      // DOM bounding box, null if non-shown
      roomName: this.props.room.name,
      notifState: RoomNotifs.getRoomNotifsState(this.props.room.roomId),
      notificationCount: this.props.room.getUnreadNotificationCount(),
      selected: this.props.room.roomId === _RoomViewStore.default.getRoomId(),
      statusMessage: this._getStatusMessage(),
      e2eStatus: null
    };
  },

  _shouldShowStatusMessage() {
    if (!_SettingsStore.default.isFeatureEnabled("feature_custom_status")) {
      return false;
    }

    const isInvite = this.props.room.getMyMembership() === "invite";
    const isJoined = this.props.room.getMyMembership() === "join";
    const looksLikeDm = this.props.room.getInvitedAndJoinedMemberCount() === 2;
    return !isInvite && isJoined && looksLikeDm;
  },

  _getStatusMessageUser() {
    if (!_MatrixClientPeg.MatrixClientPeg.get()) return null; // We've probably been logged out

    const selfId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

    const otherMember = this.props.room.currentState.getMembersExcept([selfId])[0];

    if (!otherMember) {
      return null;
    }

    return otherMember.user;
  },

  _getStatusMessage() {
    const statusUser = this._getStatusMessageUser();

    if (!statusUser) {
      return "";
    }

    return statusUser._unstable_statusMessage;
  },

  onRoomStateMember: function (ev, state, member) {
    // we only care about leaving users
    // because trust state will change if someone joins a megolm session anyway
    if (member.membership !== "leave") {
      return;
    } // ignore members in other rooms


    if (member.roomId !== this.props.room.roomId) {
      return;
    }

    this._updateE2eStatus();
  },
  onUserVerificationChanged: function (userId, _trustStatus) {
    if (!this.props.room.getMember(userId)) {
      // Not in this room
      return;
    }

    this._updateE2eStatus();
  },
  onCrossSigningKeysChanged: function () {
    this._updateE2eStatus();
  },
  onRoomTimeline: function (ev, room) {
    if (!room) return;
    if (room.roomId != this.props.room.roomId) return;
    if (ev.getType() !== "m.room.encryption") return;

    _MatrixClientPeg.MatrixClientPeg.get().removeListener("Room.timeline", this.onRoomTimeline);

    this.onFindingRoomToBeEncrypted();
  },
  onFindingRoomToBeEncrypted: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("RoomState.members", this.onRoomStateMember);
    cli.on("userTrustStatusChanged", this.onUserVerificationChanged);
    cli.on("crossSigning.keysChanged", this.onCrossSigningKeysChanged);

    this._updateE2eStatus();
  },
  _updateE2eStatus: async function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (!cli.isRoomEncrypted(this.props.room.roomId)) {
      return;
    }

    if (!_SettingsStore.default.getValue("feature_cross_signing")) {
      return;
    }
    /* At this point, the user has encryption on and cross-signing on */


    this.setState({
      e2eStatus: await (0, _ShieldUtils.shieldStatusForRoom)(cli, this.props.room)
    });
  },
  onRoomName: function (room) {
    if (room !== this.props.room) return;
    this.setState({
      roomName: this.props.room.name
    });
  },
  onJoinRule: function (ev) {
    if (ev.getType() !== "m.room.join_rules") return;
    if (ev.getRoomId() !== this.props.room.roomId) return;
    this.setState({
      joinRule: ev.getContent().join_rule
    });
  },
  onAccountData: function (accountDataEvent) {
    if (accountDataEvent.getType() === 'm.push_rules') {
      this.setState({
        notifState: RoomNotifs.getRoomNotifsState(this.props.room.roomId)
      });
    }
  },
  onAction: function (payload) {
    switch (payload.action) {
      // XXX: slight hack in order to zero the notification count when a room
      // is read. Ideally this state would be given to this via props (as we
      // do with `unread`). This is still better than forceUpdating the entire
      // RoomList when a room is read.
      case 'on_room_read':
        if (payload.roomId !== this.props.room.roomId) break;
        this.setState({
          notificationCount: this.props.room.getUnreadNotificationCount()
        });
        break;
      // RoomTiles are one of the few components that may show custom status and
      // also remain on screen while in Settings toggling the feature.  This ensures
      // you can clearly see the status hide and show when toggling the feature.

      case 'feature_custom_status_changed':
        this.forceUpdate();
        break;

      case 'view_room':
        // when the room is selected make sure its tile is visible, for breadcrumbs/keyboard shortcut access
        if (payload.room_id === this.props.room.roomId && payload.show_room_tile) {
          this._scrollIntoView();
        }

        break;
    }
  },
  _scrollIntoView: function () {
    if (!this._roomTile.current) return;

    this._roomTile.current.scrollIntoView({
      block: "nearest",
      behavior: "auto"
    });
  },
  _onActiveRoomChange: function () {
    this.setState({
      selected: this.props.room.roomId === _RoomViewStore.default.getRoomId()
    });
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._roomTile = (0, _react.createRef)();
  },
  componentDidMount: function () {
    /* We bind here rather than in the definition because otherwise we wind up with the
       method only being callable once every 500ms across all instances, which would be wrong */
    this._updateE2eStatus = (0, _ratelimitedfunc.default)(this._updateE2eStatus, 500);

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("accountData", this.onAccountData);
    cli.on("Room.name", this.onRoomName);
    cli.on("RoomState.events", this.onJoinRule);

    if (cli.isRoomEncrypted(this.props.room.roomId)) {
      this.onFindingRoomToBeEncrypted();
    } else {
      cli.on("Room.timeline", this.onRoomTimeline);
    }

    _ActiveRoomObserver.default.addListener(this.props.room.roomId, this._onActiveRoomChange);

    this.dispatcherRef = _dispatcher.default.register(this.onAction);

    if (this._shouldShowStatusMessage()) {
      const statusUser = this._getStatusMessageUser();

      if (statusUser) {
        statusUser.on("User._unstable_statusMessage", this._onStatusMessageCommitted);
      }
    } // when we're first rendered (or our sublist is expanded) make sure we are visible if we're active


    if (this.state.selected) {
      this._scrollIntoView();
    }
  },
  componentWillUnmount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("accountData", this.onAccountData);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Room.name", this.onRoomName);

      cli.removeListener("RoomState.events", this.onJoinRule);
      cli.removeListener("RoomState.members", this.onRoomStateMember);
      cli.removeListener("userTrustStatusChanged", this.onUserVerificationChanged);
      cli.removeListener("crossSigning.keysChanged", this.onCrossSigningKeysChanged);
      cli.removeListener("Room.timeline", this.onRoomTimeline);
    }

    _ActiveRoomObserver.default.removeListener(this.props.room.roomId, this._onActiveRoomChange);

    _dispatcher.default.unregister(this.dispatcherRef);

    if (this._shouldShowStatusMessage()) {
      const statusUser = this._getStatusMessageUser();

      if (statusUser) {
        statusUser.removeListener("User._unstable_statusMessage", this._onStatusMessageCommitted);
      }
    }
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (props) {
    // XXX: This could be a lot better - this makes the assumption that
    // the notification count may have changed when the properties of
    // the room tile change.
    this.setState({
      notificationCount: this.props.room.getUnreadNotificationCount()
    });
  },
  // Do a simple shallow comparison of props and state to avoid unnecessary
  // renders. The assumption made here is that only state and props are used
  // in rendering this component and children.
  //
  // RoomList is frequently made to forceUpdate, so this decreases number of
  // RoomTile renderings.
  shouldComponentUpdate: function (newProps, newState) {
    if (Object.keys(newProps).some(k => newProps[k] !== this.props[k])) {
      return true;
    }

    if (Object.keys(newState).some(k => newState[k] !== this.state[k])) {
      return true;
    }

    return false;
  },

  _onStatusMessageCommitted() {
    // The status message `User` object has observed a message change.
    this.setState({
      statusMessage: this._getStatusMessage()
    });
  },

  onClick: function (ev) {
    if (this.props.onClick) {
      this.props.onClick(this.props.room.roomId, ev);
    }
  },
  onMouseEnter: function () {
    this.setState({
      hover: true
    });
    this.badgeOnMouseEnter();
  },
  onMouseLeave: function () {
    this.setState({
      hover: false
    });
    this.badgeOnMouseLeave();
  },
  badgeOnMouseEnter: function () {
    // Only allow non-guests to access the context menu
    // and only change it if it needs to change
    if (!_MatrixClientPeg.MatrixClientPeg.get().isGuest() && !this.state.badgeHover) {
      this.setState({
        badgeHover: true
      });
    }
  },
  badgeOnMouseLeave: function () {
    this.setState({
      badgeHover: false
    });
  },
  _showContextMenu: function (boundingClientRect) {
    // Only allow non-guests to access the context menu
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) return;
    const state = {
      contextMenuPosition: boundingClientRect
    }; // If the badge is clicked, then no longer show tooltip

    if (this.props.collapsed) {
      state.hover = false;
    }

    this.setState(state);
  },
  onContextMenuButtonClick: function (e) {
    // Prevent the RoomTile onClick event firing as well
    e.stopPropagation();
    e.preventDefault();

    this._showContextMenu(e.target.getBoundingClientRect());
  },
  onContextMenu: function (e) {
    // Prevent the native context menu
    e.preventDefault();

    this._showContextMenu({
      right: e.clientX,
      top: e.clientY,
      height: 0
    });
  },
  closeMenu: function () {
    this.setState({
      contextMenuPosition: null
    });
    this.props.refreshSubList();
  },
  render: function () {
    const isInvite = this.props.room.getMyMembership() === "invite";
    const notificationCount = this.props.notificationCount; // var highlightCount = this.props.room.getUnreadNotificationCount("highlight");

    const notifBadges = notificationCount > 0 && RoomNotifs.shouldShowNotifBadge(this.state.notifState);
    const mentionBadges = this.props.highlight && RoomNotifs.shouldShowMentionBadge(this.state.notifState);
    const badges = notifBadges || mentionBadges;
    let subtext = null;

    if (this._shouldShowStatusMessage()) {
      subtext = this.state.statusMessage;
    }

    const isMenuDisplayed = Boolean(this.state.contextMenuPosition);

    const dmUserId = _DMRoomMap.default.shared().getUserIdForRoomId(this.props.room.roomId);

    const classes = (0, _classnames.default)({
      'mx_RoomTile': true,
      'mx_RoomTile_selected': this.state.selected,
      'mx_RoomTile_unread': this.props.unread,
      'mx_RoomTile_unreadNotify': notifBadges,
      'mx_RoomTile_highlight': mentionBadges,
      'mx_RoomTile_invited': isInvite,
      'mx_RoomTile_menuDisplayed': isMenuDisplayed,
      'mx_RoomTile_noBadges': !badges,
      'mx_RoomTile_transparent': this.props.transparent,
      'mx_RoomTile_hasSubtext': subtext && !this.props.collapsed
    });
    const avatarClasses = (0, _classnames.default)({
      'mx_RoomTile_avatar': true
    });
    const badgeClasses = (0, _classnames.default)({
      'mx_RoomTile_badge': true,
      'mx_RoomTile_badgeButton': this.state.badgeHover || isMenuDisplayed
    });
    let name = this.state.roomName;
    if (typeof name !== 'string') name = '';
    name = name.replace(":", ":\u200b"); // add a zero-width space to allow linewrapping after the colon

    let badge;

    if (badges) {
      const limitedCount = FormattingUtils.formatCount(notificationCount);
      const badgeContent = notificationCount ? limitedCount : '!';
      badge = /*#__PURE__*/_react.default.createElement("div", {
        className: badgeClasses
      }, badgeContent);
    }

    let label;
    let subtextLabel;
    let tooltip;

    if (!this.props.collapsed) {
      const nameClasses = (0, _classnames.default)({
        'mx_RoomTile_name': true,
        'mx_RoomTile_invite': this.props.isInvite,
        'mx_RoomTile_badgeShown': badges || this.state.badgeHover || isMenuDisplayed
      });
      subtextLabel = subtext ? /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_RoomTile_subtext"
      }, subtext) : null; // XXX: this is a workaround for Firefox giving this div a tabstop :( [tabIndex]

      label = /*#__PURE__*/_react.default.createElement("div", {
        title: name,
        className: nameClasses,
        tabIndex: -1,
        dir: "auto"
      }, name);
    } else if (this.state.hover) {
      const Tooltip = sdk.getComponent("elements.Tooltip");
      tooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        className: "mx_RoomTile_tooltip",
        label: this.props.room.name,
        dir: "auto"
      });
    } //var incomingCallBox;
    //if (this.props.incomingCall) {
    //    var IncomingCallBox = sdk.getComponent("voip.IncomingCallBox");
    //    incomingCallBox = <IncomingCallBox incomingCall={ this.props.incomingCall }/>;
    //}


    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let contextMenuButton;

    if (!_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      contextMenuButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenuButton, {
        className: "mx_RoomTile_menuButton",
        label: (0, _languageHandler._t)("Options"),
        isExpanded: isMenuDisplayed,
        onClick: this.onContextMenuButtonClick
      });
    }

    const RoomAvatar = sdk.getComponent('avatars.RoomAvatar');
    let ariaLabel = name;
    let dmOnline;
    const {
      room
    } = this.props;
    const member = room.getMember(dmUserId);

    if (member && member.membership === "join" && room.getJoinedMemberCount() === 2) {
      const UserOnlineDot = sdk.getComponent('rooms.UserOnlineDot');
      dmOnline = /*#__PURE__*/_react.default.createElement(UserOnlineDot, {
        userId: dmUserId
      });
    } // The following labels are written in such a fashion to increase screen reader efficiency (speed).


    if (notifBadges && mentionBadges && !isInvite) {
      ariaLabel += " " + (0, _languageHandler._t)("%(count)s unread messages including mentions.", {
        count: notificationCount
      });
    } else if (notifBadges) {
      ariaLabel += " " + (0, _languageHandler._t)("%(count)s unread messages.", {
        count: notificationCount
      });
    } else if (mentionBadges && !isInvite) {
      ariaLabel += " " + (0, _languageHandler._t)("Unread mentions.");
    } else if (this.props.unread) {
      ariaLabel += " " + (0, _languageHandler._t)("Unread messages.");
    }

    let contextMenu;

    if (isMenuDisplayed) {
      const RoomTileContextMenu = sdk.getComponent('context_menus.RoomTileContextMenu');
      contextMenu = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenu, (0, _extends2.default)({}, (0, _ContextMenu.toRightOf)(this.state.contextMenuPosition), {
        onFinished: this.closeMenu
      }), /*#__PURE__*/_react.default.createElement(RoomTileContextMenu, {
        room: this.props.room,
        onFinished: this.closeMenu
      }));
    }

    let privateIcon = null;

    if (_SettingsStore.default.getValue("feature_cross_signing")) {
      if (this.state.joinRule == "invite" && !dmUserId) {
        privateIcon = /*#__PURE__*/_react.default.createElement(_InviteOnlyIcon.default, {
          collapsedPanel: this.props.collapsed
        });
      }
    }

    let e2eIcon = null;

    if (this.state.e2eStatus) {
      e2eIcon = /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
        status: this.state.e2eStatus,
        className: "mx_RoomTile_e2eIcon"
      });
    }

    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_RovingTabIndex.RovingTabIndexWrapper, {
      inputRef: this._roomTile
    }, ({
      onFocus,
      isActive,
      ref
    }) => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      onFocus: onFocus,
      tabIndex: isActive ? 0 : -1,
      inputRef: ref,
      className: classes,
      onClick: this.onClick,
      onMouseEnter: this.onMouseEnter,
      onMouseLeave: this.onMouseLeave,
      onContextMenu: this.onContextMenu,
      "aria-label": ariaLabel,
      "aria-selected": this.state.selected,
      role: "treeitem"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: avatarClasses
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomTile_avatar_container"
    }, /*#__PURE__*/_react.default.createElement(RoomAvatar, {
      room: this.props.room,
      width: 24,
      height: 24
    }), e2eIcon)), privateIcon, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomTile_nameContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomTile_labelContainer"
    }, label, subtextLabel), dmOnline, contextMenuButton, badge), tooltip)), contextMenu);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21UaWxlLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwib25DbGljayIsIlByb3BUeXBlcyIsImZ1bmMiLCJyb29tIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImNvbGxhcHNlZCIsImJvb2wiLCJ1bnJlYWQiLCJoaWdobGlnaHQiLCJ0cmFuc3BhcmVudCIsImlzSW52aXRlIiwiaW5jb21pbmdDYWxsIiwiZ2V0RGVmYXVsdFByb3BzIiwiaXNEcmFnZ2luZyIsImdldEluaXRpYWxTdGF0ZSIsImpvaW5SdWxlcyIsInByb3BzIiwiY3VycmVudFN0YXRlIiwiZ2V0U3RhdGVFdmVudHMiLCJqb2luUnVsZSIsImdldENvbnRlbnQiLCJqb2luX3J1bGUiLCJob3ZlciIsImJhZGdlSG92ZXIiLCJjb250ZXh0TWVudVBvc2l0aW9uIiwicm9vbU5hbWUiLCJuYW1lIiwibm90aWZTdGF0ZSIsIlJvb21Ob3RpZnMiLCJnZXRSb29tTm90aWZzU3RhdGUiLCJyb29tSWQiLCJub3RpZmljYXRpb25Db3VudCIsImdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50Iiwic2VsZWN0ZWQiLCJSb29tVmlld1N0b3JlIiwiZ2V0Um9vbUlkIiwic3RhdHVzTWVzc2FnZSIsIl9nZXRTdGF0dXNNZXNzYWdlIiwiZTJlU3RhdHVzIiwiX3Nob3VsZFNob3dTdGF0dXNNZXNzYWdlIiwiU2V0dGluZ3NTdG9yZSIsImlzRmVhdHVyZUVuYWJsZWQiLCJnZXRNeU1lbWJlcnNoaXAiLCJpc0pvaW5lZCIsImxvb2tzTGlrZURtIiwiZ2V0SW52aXRlZEFuZEpvaW5lZE1lbWJlckNvdW50IiwiX2dldFN0YXR1c01lc3NhZ2VVc2VyIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwic2VsZklkIiwiZ2V0VXNlcklkIiwib3RoZXJNZW1iZXIiLCJnZXRNZW1iZXJzRXhjZXB0IiwidXNlciIsInN0YXR1c1VzZXIiLCJfdW5zdGFibGVfc3RhdHVzTWVzc2FnZSIsIm9uUm9vbVN0YXRlTWVtYmVyIiwiZXYiLCJzdGF0ZSIsIm1lbWJlciIsIm1lbWJlcnNoaXAiLCJfdXBkYXRlRTJlU3RhdHVzIiwib25Vc2VyVmVyaWZpY2F0aW9uQ2hhbmdlZCIsInVzZXJJZCIsIl90cnVzdFN0YXR1cyIsImdldE1lbWJlciIsIm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQiLCJvblJvb21UaW1lbGluZSIsImdldFR5cGUiLCJyZW1vdmVMaXN0ZW5lciIsIm9uRmluZGluZ1Jvb21Ub0JlRW5jcnlwdGVkIiwiY2xpIiwib24iLCJpc1Jvb21FbmNyeXB0ZWQiLCJnZXRWYWx1ZSIsInNldFN0YXRlIiwib25Sb29tTmFtZSIsIm9uSm9pblJ1bGUiLCJvbkFjY291bnREYXRhIiwiYWNjb3VudERhdGFFdmVudCIsIm9uQWN0aW9uIiwicGF5bG9hZCIsImFjdGlvbiIsImZvcmNlVXBkYXRlIiwicm9vbV9pZCIsInNob3dfcm9vbV90aWxlIiwiX3Njcm9sbEludG9WaWV3IiwiX3Jvb21UaWxlIiwiY3VycmVudCIsInNjcm9sbEludG9WaWV3IiwiYmxvY2siLCJiZWhhdmlvciIsIl9vbkFjdGl2ZVJvb21DaGFuZ2UiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiY29tcG9uZW50RGlkTW91bnQiLCJBY3RpdmVSb29tT2JzZXJ2ZXIiLCJhZGRMaXN0ZW5lciIsImRpc3BhdGNoZXJSZWYiLCJkaXMiLCJyZWdpc3RlciIsIl9vblN0YXR1c01lc3NhZ2VDb21taXR0ZWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5ld1Byb3BzIiwibmV3U3RhdGUiLCJPYmplY3QiLCJrZXlzIiwic29tZSIsImsiLCJvbk1vdXNlRW50ZXIiLCJiYWRnZU9uTW91c2VFbnRlciIsIm9uTW91c2VMZWF2ZSIsImJhZGdlT25Nb3VzZUxlYXZlIiwiaXNHdWVzdCIsIl9zaG93Q29udGV4dE1lbnUiLCJib3VuZGluZ0NsaWVudFJlY3QiLCJvbkNvbnRleHRNZW51QnV0dG9uQ2xpY2siLCJlIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJvbkNvbnRleHRNZW51IiwicmlnaHQiLCJjbGllbnRYIiwidG9wIiwiY2xpZW50WSIsImhlaWdodCIsImNsb3NlTWVudSIsInJlZnJlc2hTdWJMaXN0IiwicmVuZGVyIiwibm90aWZCYWRnZXMiLCJzaG91bGRTaG93Tm90aWZCYWRnZSIsIm1lbnRpb25CYWRnZXMiLCJzaG91bGRTaG93TWVudGlvbkJhZGdlIiwiYmFkZ2VzIiwic3VidGV4dCIsImlzTWVudURpc3BsYXllZCIsIkJvb2xlYW4iLCJkbVVzZXJJZCIsIkRNUm9vbU1hcCIsInNoYXJlZCIsImdldFVzZXJJZEZvclJvb21JZCIsImNsYXNzZXMiLCJhdmF0YXJDbGFzc2VzIiwiYmFkZ2VDbGFzc2VzIiwicmVwbGFjZSIsImJhZGdlIiwibGltaXRlZENvdW50IiwiRm9ybWF0dGluZ1V0aWxzIiwiZm9ybWF0Q291bnQiLCJiYWRnZUNvbnRlbnQiLCJsYWJlbCIsInN1YnRleHRMYWJlbCIsInRvb2x0aXAiLCJuYW1lQ2xhc3NlcyIsIlRvb2x0aXAiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJBY2Nlc3NpYmxlQnV0dG9uIiwiY29udGV4dE1lbnVCdXR0b24iLCJSb29tQXZhdGFyIiwiYXJpYUxhYmVsIiwiZG1PbmxpbmUiLCJnZXRKb2luZWRNZW1iZXJDb3VudCIsIlVzZXJPbmxpbmVEb3QiLCJjb3VudCIsImNvbnRleHRNZW51IiwiUm9vbVRpbGVDb250ZXh0TWVudSIsInByaXZhdGVJY29uIiwiZTJlSWNvbiIsIm9uRm9jdXMiLCJpc0FjdGl2ZSIsInJlZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7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QUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNNakIsS0FETixFQUVNQyxZQUZOLENBREosRUFLTVUsUUFMTixFQU1NSCxpQkFOTixFQU9NYixLQVBOLENBcEJKLEVBOEJNTyxPQTlCTixDQUZSLENBREcsRUFzQ0RhLFdBdENDLENBQVA7QUF3Q0g7QUEvZ0IyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi8uLi8uLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7Q29udGV4dE1lbnUsIENvbnRleHRNZW51QnV0dG9uLCB0b1JpZ2h0T2Z9IGZyb20gJy4uLy4uL3N0cnVjdHVyZXMvQ29udGV4dE1lbnUnO1xuaW1wb3J0ICogYXMgUm9vbU5vdGlmcyBmcm9tICcuLi8uLi8uLi9Sb29tTm90aWZzJztcbmltcG9ydCAqIGFzIEZvcm1hdHRpbmdVdGlscyBmcm9tICcuLi8uLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuaW1wb3J0IEFjdGl2ZVJvb21PYnNlcnZlciBmcm9tICcuLi8uLi8uLi9BY3RpdmVSb29tT2JzZXJ2ZXInO1xuaW1wb3J0IFJvb21WaWV3U3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL1Jvb21WaWV3U3RvcmUnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCB7Um92aW5nVGFiSW5kZXhXcmFwcGVyfSBmcm9tIFwiLi4vLi4vLi4vYWNjZXNzaWJpbGl0eS9Sb3ZpbmdUYWJJbmRleFwiO1xuaW1wb3J0IEUyRUljb24gZnJvbSAnLi9FMkVJY29uJztcbmltcG9ydCBJbnZpdGVPbmx5SWNvbiBmcm9tICcuL0ludml0ZU9ubHlJY29uJztcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjYW1lbGNhc2VcbmltcG9ydCByYXRlX2xpbWl0ZWRfZnVuYyBmcm9tICcuLi8uLi8uLi9yYXRlbGltaXRlZGZ1bmMnO1xuaW1wb3J0IHsgc2hpZWxkU3RhdHVzRm9yUm9vbSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL1NoaWVsZFV0aWxzJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSb29tVGlsZScsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgb25DbGljazogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgcm9vbTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBjb2xsYXBzZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgICAgIHVucmVhZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgaGlnaGxpZ2h0OiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBJZiB0cnVlLCBhcHBseSBteF9Sb29tVGlsZV90cmFuc3BhcmVudCBjbGFzc1xuICAgICAgICB0cmFuc3BhcmVudDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIGlzSW52aXRlOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgICAgICBpbmNvbWluZ0NhbGw6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc0RyYWdnaW5nOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgam9pblJ1bGVzID0gdGhpcy5wcm9wcy5yb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5qb2luX3J1bGVzXCIsIFwiXCIpO1xuICAgICAgICBjb25zdCBqb2luUnVsZSA9IGpvaW5SdWxlcyAmJiBqb2luUnVsZXMuZ2V0Q29udGVudCgpLmpvaW5fcnVsZTtcblxuICAgICAgICByZXR1cm4gKHtcbiAgICAgICAgICAgIGpvaW5SdWxlLFxuICAgICAgICAgICAgaG92ZXI6IGZhbHNlLFxuICAgICAgICAgICAgYmFkZ2VIb3ZlcjogZmFsc2UsXG4gICAgICAgICAgICBjb250ZXh0TWVudVBvc2l0aW9uOiBudWxsLCAvLyBET00gYm91bmRpbmcgYm94LCBudWxsIGlmIG5vbi1zaG93blxuICAgICAgICAgICAgcm9vbU5hbWU6IHRoaXMucHJvcHMucm9vbS5uYW1lLFxuICAgICAgICAgICAgbm90aWZTdGF0ZTogUm9vbU5vdGlmcy5nZXRSb29tTm90aWZzU3RhdGUodGhpcy5wcm9wcy5yb29tLnJvb21JZCksXG4gICAgICAgICAgICBub3RpZmljYXRpb25Db3VudDogdGhpcy5wcm9wcy5yb29tLmdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50KCksXG4gICAgICAgICAgICBzZWxlY3RlZDogdGhpcy5wcm9wcy5yb29tLnJvb21JZCA9PT0gUm9vbVZpZXdTdG9yZS5nZXRSb29tSWQoKSxcbiAgICAgICAgICAgIHN0YXR1c01lc3NhZ2U6IHRoaXMuX2dldFN0YXR1c01lc3NhZ2UoKSxcbiAgICAgICAgICAgIGUyZVN0YXR1czogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9zaG91bGRTaG93U3RhdHVzTWVzc2FnZSgpIHtcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZUVuYWJsZWQoXCJmZWF0dXJlX2N1c3RvbV9zdGF0dXNcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc0ludml0ZSA9IHRoaXMucHJvcHMucm9vbS5nZXRNeU1lbWJlcnNoaXAoKSA9PT0gXCJpbnZpdGVcIjtcbiAgICAgICAgY29uc3QgaXNKb2luZWQgPSB0aGlzLnByb3BzLnJvb20uZ2V0TXlNZW1iZXJzaGlwKCkgPT09IFwiam9pblwiO1xuICAgICAgICBjb25zdCBsb29rc0xpa2VEbSA9IHRoaXMucHJvcHMucm9vbS5nZXRJbnZpdGVkQW5kSm9pbmVkTWVtYmVyQ291bnQoKSA9PT0gMjtcbiAgICAgICAgcmV0dXJuICFpc0ludml0ZSAmJiBpc0pvaW5lZCAmJiBsb29rc0xpa2VEbTtcbiAgICB9LFxuXG4gICAgX2dldFN0YXR1c01lc3NhZ2VVc2VyKCkge1xuICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKSkgcmV0dXJuIG51bGw7IC8vIFdlJ3ZlIHByb2JhYmx5IGJlZW4gbG9nZ2VkIG91dFxuXG4gICAgICAgIGNvbnN0IHNlbGZJZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3Qgb3RoZXJNZW1iZXIgPSB0aGlzLnByb3BzLnJvb20uY3VycmVudFN0YXRlLmdldE1lbWJlcnNFeGNlcHQoW3NlbGZJZF0pWzBdO1xuICAgICAgICBpZiAoIW90aGVyTWVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3RoZXJNZW1iZXIudXNlcjtcbiAgICB9LFxuXG4gICAgX2dldFN0YXR1c01lc3NhZ2UoKSB7XG4gICAgICAgIGNvbnN0IHN0YXR1c1VzZXIgPSB0aGlzLl9nZXRTdGF0dXNNZXNzYWdlVXNlcigpO1xuICAgICAgICBpZiAoIXN0YXR1c1VzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGF0dXNVc2VyLl91bnN0YWJsZV9zdGF0dXNNZXNzYWdlO1xuICAgIH0sXG5cbiAgICBvblJvb21TdGF0ZU1lbWJlcjogZnVuY3Rpb24oZXYsIHN0YXRlLCBtZW1iZXIpIHtcbiAgICAgICAgLy8gd2Ugb25seSBjYXJlIGFib3V0IGxlYXZpbmcgdXNlcnNcbiAgICAgICAgLy8gYmVjYXVzZSB0cnVzdCBzdGF0ZSB3aWxsIGNoYW5nZSBpZiBzb21lb25lIGpvaW5zIGEgbWVnb2xtIHNlc3Npb24gYW55d2F5XG4gICAgICAgIGlmIChtZW1iZXIubWVtYmVyc2hpcCAhPT0gXCJsZWF2ZVwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWdub3JlIG1lbWJlcnMgaW4gb3RoZXIgcm9vbXNcbiAgICAgICAgaWYgKG1lbWJlci5yb29tSWQgIT09IHRoaXMucHJvcHMucm9vbS5yb29tSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUUyZVN0YXR1cygpO1xuICAgIH0sXG5cbiAgICBvblVzZXJWZXJpZmljYXRpb25DaGFuZ2VkOiBmdW5jdGlvbih1c2VySWQsIF90cnVzdFN0YXR1cykge1xuICAgICAgICBpZiAoIXRoaXMucHJvcHMucm9vbS5nZXRNZW1iZXIodXNlcklkKSkge1xuICAgICAgICAgICAgLy8gTm90IGluIHRoaXMgcm9vbVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZUUyZVN0YXR1cygpO1xuICAgIH0sXG5cbiAgICBvbkNyb3NzU2lnbmluZ0tleXNDaGFuZ2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlRTJlU3RhdHVzKCk7XG4gICAgfSxcblxuICAgIG9uUm9vbVRpbWVsaW5lOiBmdW5jdGlvbihldiwgcm9vbSkge1xuICAgICAgICBpZiAoIXJvb20pIHJldHVybjtcbiAgICAgICAgaWYgKHJvb20ucm9vbUlkICE9IHRoaXMucHJvcHMucm9vbS5yb29tSWQpIHJldHVybjtcbiAgICAgICAgaWYgKGV2LmdldFR5cGUoKSAhPT0gXCJtLnJvb20uZW5jcnlwdGlvblwiKSByZXR1cm47XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgIHRoaXMub25GaW5kaW5nUm9vbVRvQmVFbmNyeXB0ZWQoKTtcbiAgICB9LFxuXG4gICAgb25GaW5kaW5nUm9vbVRvQmVFbmNyeXB0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNsaS5vbihcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHRoaXMub25Sb29tU3RhdGVNZW1iZXIpO1xuICAgICAgICBjbGkub24oXCJ1c2VyVHJ1c3RTdGF0dXNDaGFuZ2VkXCIsIHRoaXMub25Vc2VyVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgIGNsaS5vbihcImNyb3NzU2lnbmluZy5rZXlzQ2hhbmdlZFwiLCB0aGlzLm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQpO1xuICAgICAgICB0aGlzLl91cGRhdGVFMmVTdGF0dXMoKTtcbiAgICB9LFxuXG4gICAgX3VwZGF0ZUUyZVN0YXR1czogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKCFjbGkuaXNSb29tRW5jcnlwdGVkKHRoaXMucHJvcHMucm9vbS5yb29tSWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBBdCB0aGlzIHBvaW50LCB0aGUgdXNlciBoYXMgZW5jcnlwdGlvbiBvbiBhbmQgY3Jvc3Mtc2lnbmluZyBvbiAqL1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGUyZVN0YXR1czogYXdhaXQgc2hpZWxkU3RhdHVzRm9yUm9vbShjbGksIHRoaXMucHJvcHMucm9vbSksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJvb21OYW1lOiBmdW5jdGlvbihyb29tKSB7XG4gICAgICAgIGlmIChyb29tICE9PSB0aGlzLnByb3BzLnJvb20pIHJldHVybjtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByb29tTmFtZTogdGhpcy5wcm9wcy5yb29tLm5hbWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkpvaW5SdWxlOiBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpICE9PSBcIm0ucm9vbS5qb2luX3J1bGVzXCIpIHJldHVybjtcbiAgICAgICAgaWYgKGV2LmdldFJvb21JZCgpICE9PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSByZXR1cm47XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBqb2luUnVsZTogZXYuZ2V0Q29udGVudCgpLmpvaW5fcnVsZSB9KTtcbiAgICB9LFxuXG4gICAgb25BY2NvdW50RGF0YTogZnVuY3Rpb24oYWNjb3VudERhdGFFdmVudCkge1xuICAgICAgICBpZiAoYWNjb3VudERhdGFFdmVudC5nZXRUeXBlKCkgPT09ICdtLnB1c2hfcnVsZXMnKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBub3RpZlN0YXRlOiBSb29tTm90aWZzLmdldFJvb21Ob3RpZnNTdGF0ZSh0aGlzLnByb3BzLnJvb20ucm9vbUlkKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uQWN0aW9uOiBmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIFhYWDogc2xpZ2h0IGhhY2sgaW4gb3JkZXIgdG8gemVybyB0aGUgbm90aWZpY2F0aW9uIGNvdW50IHdoZW4gYSByb29tXG4gICAgICAgICAgICAvLyBpcyByZWFkLiBJZGVhbGx5IHRoaXMgc3RhdGUgd291bGQgYmUgZ2l2ZW4gdG8gdGhpcyB2aWEgcHJvcHMgKGFzIHdlXG4gICAgICAgICAgICAvLyBkbyB3aXRoIGB1bnJlYWRgKS4gVGhpcyBpcyBzdGlsbCBiZXR0ZXIgdGhhbiBmb3JjZVVwZGF0aW5nIHRoZSBlbnRpcmVcbiAgICAgICAgICAgIC8vIFJvb21MaXN0IHdoZW4gYSByb29tIGlzIHJlYWQuXG4gICAgICAgICAgICBjYXNlICdvbl9yb29tX3JlYWQnOlxuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLnJvb21JZCAhPT0gdGhpcy5wcm9wcy5yb29tLnJvb21JZCkgYnJlYWs7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbkNvdW50OiB0aGlzLnByb3BzLnJvb20uZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQoKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFJvb21UaWxlcyBhcmUgb25lIG9mIHRoZSBmZXcgY29tcG9uZW50cyB0aGF0IG1heSBzaG93IGN1c3RvbSBzdGF0dXMgYW5kXG4gICAgICAgICAgICAvLyBhbHNvIHJlbWFpbiBvbiBzY3JlZW4gd2hpbGUgaW4gU2V0dGluZ3MgdG9nZ2xpbmcgdGhlIGZlYXR1cmUuICBUaGlzIGVuc3VyZXNcbiAgICAgICAgICAgIC8vIHlvdSBjYW4gY2xlYXJseSBzZWUgdGhlIHN0YXR1cyBoaWRlIGFuZCBzaG93IHdoZW4gdG9nZ2xpbmcgdGhlIGZlYXR1cmUuXG4gICAgICAgICAgICBjYXNlICdmZWF0dXJlX2N1c3RvbV9zdGF0dXNfY2hhbmdlZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd2aWV3X3Jvb20nOlxuICAgICAgICAgICAgICAgIC8vIHdoZW4gdGhlIHJvb20gaXMgc2VsZWN0ZWQgbWFrZSBzdXJlIGl0cyB0aWxlIGlzIHZpc2libGUsIGZvciBicmVhZGNydW1icy9rZXlib2FyZCBzaG9ydGN1dCBhY2Nlc3NcbiAgICAgICAgICAgICAgICBpZiAocGF5bG9hZC5yb29tX2lkID09PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkICYmIHBheWxvYWQuc2hvd19yb29tX3RpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Njcm9sbEludG9WaWV3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9yb29tVGlsZS5jdXJyZW50KSByZXR1cm47XG4gICAgICAgIHRoaXMuX3Jvb21UaWxlLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoe1xuICAgICAgICAgICAgYmxvY2s6IFwibmVhcmVzdFwiLFxuICAgICAgICAgICAgYmVoYXZpb3I6IFwiYXV0b1wiLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uQWN0aXZlUm9vbUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2VsZWN0ZWQ6IHRoaXMucHJvcHMucm9vbS5yb29tSWQgPT09IFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcm9vbVRpbGUgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvKiBXZSBiaW5kIGhlcmUgcmF0aGVyIHRoYW4gaW4gdGhlIGRlZmluaXRpb24gYmVjYXVzZSBvdGhlcndpc2Ugd2Ugd2luZCB1cCB3aXRoIHRoZVxuICAgICAgICAgICBtZXRob2Qgb25seSBiZWluZyBjYWxsYWJsZSBvbmNlIGV2ZXJ5IDUwMG1zIGFjcm9zcyBhbGwgaW5zdGFuY2VzLCB3aGljaCB3b3VsZCBiZSB3cm9uZyAqL1xuICAgICAgICB0aGlzLl91cGRhdGVFMmVTdGF0dXMgPSByYXRlX2xpbWl0ZWRfZnVuYyh0aGlzLl91cGRhdGVFMmVTdGF0dXMsIDUwMCk7XG5cbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjbGkub24oXCJhY2NvdW50RGF0YVwiLCB0aGlzLm9uQWNjb3VudERhdGEpO1xuICAgICAgICBjbGkub24oXCJSb29tLm5hbWVcIiwgdGhpcy5vblJvb21OYW1lKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uSm9pblJ1bGUpO1xuICAgICAgICBpZiAoY2xpLmlzUm9vbUVuY3J5cHRlZCh0aGlzLnByb3BzLnJvb20ucm9vbUlkKSkge1xuICAgICAgICAgICAgdGhpcy5vbkZpbmRpbmdSb29tVG9CZUVuY3J5cHRlZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xpLm9uKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBBY3RpdmVSb29tT2JzZXJ2ZXIuYWRkTGlzdGVuZXIodGhpcy5wcm9wcy5yb29tLnJvb21JZCwgdGhpcy5fb25BY3RpdmVSb29tQ2hhbmdlKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMub25BY3Rpb24pO1xuXG4gICAgICAgIGlmICh0aGlzLl9zaG91bGRTaG93U3RhdHVzTWVzc2FnZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXNVc2VyID0gdGhpcy5fZ2V0U3RhdHVzTWVzc2FnZVVzZXIoKTtcbiAgICAgICAgICAgIGlmIChzdGF0dXNVc2VyKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzVXNlci5vbihcIlVzZXIuX3Vuc3RhYmxlX3N0YXR1c01lc3NhZ2VcIiwgdGhpcy5fb25TdGF0dXNNZXNzYWdlQ29tbWl0dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgZmlyc3QgcmVuZGVyZWQgKG9yIG91ciBzdWJsaXN0IGlzIGV4cGFuZGVkKSBtYWtlIHN1cmUgd2UgYXJlIHZpc2libGUgaWYgd2UncmUgYWN0aXZlXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpKSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJhY2NvdW50RGF0YVwiLCB0aGlzLm9uQWNjb3VudERhdGEpO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5uYW1lXCIsIHRoaXMub25Sb29tTmFtZSk7XG4gICAgICAgICAgICBjbGkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Kb2luUnVsZSk7XG4gICAgICAgICAgICBjbGkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUubWVtYmVyc1wiLCB0aGlzLm9uUm9vbVN0YXRlTWVtYmVyKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgdGhpcy5vblVzZXJWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcImNyb3NzU2lnbmluZy5rZXlzQ2hhbmdlZFwiLCB0aGlzLm9uQ3Jvc3NTaWduaW5nS2V5c0NoYW5nZWQpO1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBBY3RpdmVSb29tT2JzZXJ2ZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5wcm9wcy5yb29tLnJvb21JZCwgdGhpcy5fb25BY3RpdmVSb29tQ2hhbmdlKTtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcblxuICAgICAgICBpZiAodGhpcy5fc2hvdWxkU2hvd1N0YXR1c01lc3NhZ2UoKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzVXNlciA9IHRoaXMuX2dldFN0YXR1c01lc3NhZ2VVc2VyKCk7XG4gICAgICAgICAgICBpZiAoc3RhdHVzVXNlcikge1xuICAgICAgICAgICAgICAgIHN0YXR1c1VzZXIucmVtb3ZlTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIFwiVXNlci5fdW5zdGFibGVfc3RhdHVzTWVzc2FnZVwiLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vblN0YXR1c01lc3NhZ2VDb21taXR0ZWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICAvLyBYWFg6IFRoaXMgY291bGQgYmUgYSBsb3QgYmV0dGVyIC0gdGhpcyBtYWtlcyB0aGUgYXNzdW1wdGlvbiB0aGF0XG4gICAgICAgIC8vIHRoZSBub3RpZmljYXRpb24gY291bnQgbWF5IGhhdmUgY2hhbmdlZCB3aGVuIHRoZSBwcm9wZXJ0aWVzIG9mXG4gICAgICAgIC8vIHRoZSByb29tIHRpbGUgY2hhbmdlLlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbkNvdW50OiB0aGlzLnByb3BzLnJvb20uZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQoKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIERvIGEgc2ltcGxlIHNoYWxsb3cgY29tcGFyaXNvbiBvZiBwcm9wcyBhbmQgc3RhdGUgdG8gYXZvaWQgdW5uZWNlc3NhcnlcbiAgICAvLyByZW5kZXJzLiBUaGUgYXNzdW1wdGlvbiBtYWRlIGhlcmUgaXMgdGhhdCBvbmx5IHN0YXRlIGFuZCBwcm9wcyBhcmUgdXNlZFxuICAgIC8vIGluIHJlbmRlcmluZyB0aGlzIGNvbXBvbmVudCBhbmQgY2hpbGRyZW4uXG4gICAgLy9cbiAgICAvLyBSb29tTGlzdCBpcyBmcmVxdWVudGx5IG1hZGUgdG8gZm9yY2VVcGRhdGUsIHNvIHRoaXMgZGVjcmVhc2VzIG51bWJlciBvZlxuICAgIC8vIFJvb21UaWxlIHJlbmRlcmluZ3MuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXdQcm9wcywgbmV3U3RhdGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld1Byb3BzKS5zb21lKChrKSA9PiBuZXdQcm9wc1trXSAhPT0gdGhpcy5wcm9wc1trXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdTdGF0ZSkuc29tZSgoaykgPT4gbmV3U3RhdGVba10gIT09IHRoaXMuc3RhdGVba10pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIF9vblN0YXR1c01lc3NhZ2VDb21taXR0ZWQoKSB7XG4gICAgICAgIC8vIFRoZSBzdGF0dXMgbWVzc2FnZSBgVXNlcmAgb2JqZWN0IGhhcyBvYnNlcnZlZCBhIG1lc3NhZ2UgY2hhbmdlLlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1c01lc3NhZ2U6IHRoaXMuX2dldFN0YXR1c01lc3NhZ2UoKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DbGljayh0aGlzLnByb3BzLnJvb20ucm9vbUlkLCBldik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Nb3VzZUVudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSggeyBob3ZlcjogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5iYWRnZU9uTW91c2VFbnRlcigpO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlTGVhdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKCB7IGhvdmVyOiBmYWxzZSB9KTtcbiAgICAgICAgdGhpcy5iYWRnZU9uTW91c2VMZWF2ZSgpO1xuICAgIH0sXG5cbiAgICBiYWRnZU9uTW91c2VFbnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIE9ubHkgYWxsb3cgbm9uLWd1ZXN0cyB0byBhY2Nlc3MgdGhlIGNvbnRleHQgbWVudVxuICAgICAgICAvLyBhbmQgb25seSBjaGFuZ2UgaXQgaWYgaXQgbmVlZHMgdG8gY2hhbmdlXG4gICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzR3Vlc3QoKSAmJiAhdGhpcy5zdGF0ZS5iYWRnZUhvdmVyKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKCB7IGJhZGdlSG92ZXI6IHRydWUgfSApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGJhZGdlT25Nb3VzZUxlYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSggeyBiYWRnZUhvdmVyOiBmYWxzZSB9ICk7XG4gICAgfSxcblxuICAgIF9zaG93Q29udGV4dE1lbnU6IGZ1bmN0aW9uKGJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgICAvLyBPbmx5IGFsbG93IG5vbi1ndWVzdHMgdG8gYWNjZXNzIHRoZSBjb250ZXh0IG1lbnVcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHJldHVybjtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IHtcbiAgICAgICAgICAgIGNvbnRleHRNZW51UG9zaXRpb246IGJvdW5kaW5nQ2xpZW50UmVjdCxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGUgYmFkZ2UgaXMgY2xpY2tlZCwgdGhlbiBubyBsb25nZXIgc2hvdyB0b29sdGlwXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmNvbGxhcHNlZCkge1xuICAgICAgICAgICAgc3RhdGUuaG92ZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuICAgIH0sXG5cbiAgICBvbkNvbnRleHRNZW51QnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gUHJldmVudCB0aGUgUm9vbVRpbGUgb25DbGljayBldmVudCBmaXJpbmcgYXMgd2VsbFxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy5fc2hvd0NvbnRleHRNZW51KGUudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcbiAgICB9LFxuXG4gICAgb25Db250ZXh0TWVudTogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBQcmV2ZW50IHRoZSBuYXRpdmUgY29udGV4dCBtZW51XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLl9zaG93Q29udGV4dE1lbnUoe1xuICAgICAgICAgICAgcmlnaHQ6IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHRvcDogZS5jbGllbnRZLFxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2xvc2VNZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjb250ZXh0TWVudVBvc2l0aW9uOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5yZWZyZXNoU3ViTGlzdCgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBpc0ludml0ZSA9IHRoaXMucHJvcHMucm9vbS5nZXRNeU1lbWJlcnNoaXAoKSA9PT0gXCJpbnZpdGVcIjtcbiAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uQ291bnQgPSB0aGlzLnByb3BzLm5vdGlmaWNhdGlvbkNvdW50O1xuICAgICAgICAvLyB2YXIgaGlnaGxpZ2h0Q291bnQgPSB0aGlzLnByb3BzLnJvb20uZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQoXCJoaWdobGlnaHRcIik7XG5cbiAgICAgICAgY29uc3Qgbm90aWZCYWRnZXMgPSBub3RpZmljYXRpb25Db3VudCA+IDAgJiYgUm9vbU5vdGlmcy5zaG91bGRTaG93Tm90aWZCYWRnZSh0aGlzLnN0YXRlLm5vdGlmU3RhdGUpO1xuICAgICAgICBjb25zdCBtZW50aW9uQmFkZ2VzID0gdGhpcy5wcm9wcy5oaWdobGlnaHQgJiYgUm9vbU5vdGlmcy5zaG91bGRTaG93TWVudGlvbkJhZGdlKHRoaXMuc3RhdGUubm90aWZTdGF0ZSk7XG4gICAgICAgIGNvbnN0IGJhZGdlcyA9IG5vdGlmQmFkZ2VzIHx8IG1lbnRpb25CYWRnZXM7XG5cbiAgICAgICAgbGV0IHN1YnRleHQgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5fc2hvdWxkU2hvd1N0YXR1c01lc3NhZ2UoKSkge1xuICAgICAgICAgICAgc3VidGV4dCA9IHRoaXMuc3RhdGUuc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzTWVudURpc3BsYXllZCA9IEJvb2xlYW4odGhpcy5zdGF0ZS5jb250ZXh0TWVudVBvc2l0aW9uKTtcblxuICAgICAgICBjb25zdCBkbVVzZXJJZCA9IERNUm9vbU1hcC5zaGFyZWQoKS5nZXRVc2VySWRGb3JSb29tSWQodGhpcy5wcm9wcy5yb29tLnJvb21JZCk7XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgJ214X1Jvb21UaWxlJzogdHJ1ZSxcbiAgICAgICAgICAgICdteF9Sb29tVGlsZV9zZWxlY3RlZCc6IHRoaXMuc3RhdGUuc2VsZWN0ZWQsXG4gICAgICAgICAgICAnbXhfUm9vbVRpbGVfdW5yZWFkJzogdGhpcy5wcm9wcy51bnJlYWQsXG4gICAgICAgICAgICAnbXhfUm9vbVRpbGVfdW5yZWFkTm90aWZ5Jzogbm90aWZCYWRnZXMsXG4gICAgICAgICAgICAnbXhfUm9vbVRpbGVfaGlnaGxpZ2h0JzogbWVudGlvbkJhZGdlcyxcbiAgICAgICAgICAgICdteF9Sb29tVGlsZV9pbnZpdGVkJzogaXNJbnZpdGUsXG4gICAgICAgICAgICAnbXhfUm9vbVRpbGVfbWVudURpc3BsYXllZCc6IGlzTWVudURpc3BsYXllZCxcbiAgICAgICAgICAgICdteF9Sb29tVGlsZV9ub0JhZGdlcyc6ICFiYWRnZXMsXG4gICAgICAgICAgICAnbXhfUm9vbVRpbGVfdHJhbnNwYXJlbnQnOiB0aGlzLnByb3BzLnRyYW5zcGFyZW50LFxuICAgICAgICAgICAgJ214X1Jvb21UaWxlX2hhc1N1YnRleHQnOiBzdWJ0ZXh0ICYmICF0aGlzLnByb3BzLmNvbGxhcHNlZCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYXZhdGFyQ2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgJ214X1Jvb21UaWxlX2F2YXRhcic6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGJhZGdlQ2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgJ214X1Jvb21UaWxlX2JhZGdlJzogdHJ1ZSxcbiAgICAgICAgICAgICdteF9Sb29tVGlsZV9iYWRnZUJ1dHRvbic6IHRoaXMuc3RhdGUuYmFkZ2VIb3ZlciB8fCBpc01lbnVEaXNwbGF5ZWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBuYW1lID0gdGhpcy5zdGF0ZS5yb29tTmFtZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykgbmFtZSA9ICcnO1xuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKFwiOlwiLCBcIjpcXHUyMDBiXCIpOyAvLyBhZGQgYSB6ZXJvLXdpZHRoIHNwYWNlIHRvIGFsbG93IGxpbmV3cmFwcGluZyBhZnRlciB0aGUgY29sb25cblxuICAgICAgICBsZXQgYmFkZ2U7XG4gICAgICAgIGlmIChiYWRnZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ZWRDb3VudCA9IEZvcm1hdHRpbmdVdGlscy5mb3JtYXRDb3VudChub3RpZmljYXRpb25Db3VudCk7XG4gICAgICAgICAgICBjb25zdCBiYWRnZUNvbnRlbnQgPSBub3RpZmljYXRpb25Db3VudCA/IGxpbWl0ZWRDb3VudCA6ICchJztcbiAgICAgICAgICAgIGJhZGdlID0gPGRpdiBjbGFzc05hbWU9e2JhZGdlQ2xhc3Nlc30+eyBiYWRnZUNvbnRlbnQgfTwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsYWJlbDtcbiAgICAgICAgbGV0IHN1YnRleHRMYWJlbDtcbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5jb2xsYXBzZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAgICAgJ214X1Jvb21UaWxlX25hbWUnOiB0cnVlLFxuICAgICAgICAgICAgICAgICdteF9Sb29tVGlsZV9pbnZpdGUnOiB0aGlzLnByb3BzLmlzSW52aXRlLFxuICAgICAgICAgICAgICAgICdteF9Sb29tVGlsZV9iYWRnZVNob3duJzogYmFkZ2VzIHx8IHRoaXMuc3RhdGUuYmFkZ2VIb3ZlciB8fCBpc01lbnVEaXNwbGF5ZWQsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc3VidGV4dExhYmVsID0gc3VidGV4dCA/IDxzcGFuIGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlX3N1YnRleHRcIj57IHN1YnRleHQgfTwvc3Bhbj4gOiBudWxsO1xuICAgICAgICAgICAgLy8gWFhYOiB0aGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgRmlyZWZveCBnaXZpbmcgdGhpcyBkaXYgYSB0YWJzdG9wIDooIFt0YWJJbmRleF1cbiAgICAgICAgICAgIGxhYmVsID0gPGRpdiB0aXRsZT17bmFtZX0gY2xhc3NOYW1lPXtuYW1lQ2xhc3Nlc30gdGFiSW5kZXg9ey0xfSBkaXI9XCJhdXRvXCI+eyBuYW1lIH08L2Rpdj47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5ob3Zlcikge1xuICAgICAgICAgICAgY29uc3QgVG9vbHRpcCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5Ub29sdGlwXCIpO1xuICAgICAgICAgICAgdG9vbHRpcCA9IDxUb29sdGlwIGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlX3Rvb2x0aXBcIiBsYWJlbD17dGhpcy5wcm9wcy5yb29tLm5hbWV9IGRpcj1cImF1dG9cIiAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vdmFyIGluY29taW5nQ2FsbEJveDtcbiAgICAgICAgLy9pZiAodGhpcy5wcm9wcy5pbmNvbWluZ0NhbGwpIHtcbiAgICAgICAgLy8gICAgdmFyIEluY29taW5nQ2FsbEJveCA9IHNkay5nZXRDb21wb25lbnQoXCJ2b2lwLkluY29taW5nQ2FsbEJveFwiKTtcbiAgICAgICAgLy8gICAgaW5jb21pbmdDYWxsQm94ID0gPEluY29taW5nQ2FsbEJveCBpbmNvbWluZ0NhbGw9eyB0aGlzLnByb3BzLmluY29taW5nQ2FsbCB9Lz47XG4gICAgICAgIC8vfVxuXG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG5cbiAgICAgICAgbGV0IGNvbnRleHRNZW51QnV0dG9uO1xuICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHtcbiAgICAgICAgICAgIGNvbnRleHRNZW51QnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxDb250ZXh0TWVudUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Sb29tVGlsZV9tZW51QnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiT3B0aW9uc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgaXNFeHBhbmRlZD17aXNNZW51RGlzcGxheWVkfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uQ29udGV4dE1lbnVCdXR0b25DbGlja30gLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBSb29tQXZhdGFyID0gc2RrLmdldENvbXBvbmVudCgnYXZhdGFycy5Sb29tQXZhdGFyJyk7XG5cbiAgICAgICAgbGV0IGFyaWFMYWJlbCA9IG5hbWU7XG5cbiAgICAgICAgbGV0IGRtT25saW5lO1xuICAgICAgICBjb25zdCB7IHJvb20gfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IG1lbWJlciA9IHJvb20uZ2V0TWVtYmVyKGRtVXNlcklkKTtcbiAgICAgICAgaWYgKG1lbWJlciAmJiBtZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJqb2luXCIgJiYgcm9vbS5nZXRKb2luZWRNZW1iZXJDb3VudCgpID09PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBVc2VyT25saW5lRG90ID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuVXNlck9ubGluZURvdCcpO1xuICAgICAgICAgICAgZG1PbmxpbmUgPSA8VXNlck9ubGluZURvdCB1c2VySWQ9e2RtVXNlcklkfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgbGFiZWxzIGFyZSB3cml0dGVuIGluIHN1Y2ggYSBmYXNoaW9uIHRvIGluY3JlYXNlIHNjcmVlbiByZWFkZXIgZWZmaWNpZW5jeSAoc3BlZWQpLlxuICAgICAgICBpZiAobm90aWZCYWRnZXMgJiYgbWVudGlvbkJhZGdlcyAmJiAhaXNJbnZpdGUpIHtcbiAgICAgICAgICAgIGFyaWFMYWJlbCArPSBcIiBcIiArIF90KFwiJShjb3VudClzIHVucmVhZCBtZXNzYWdlcyBpbmNsdWRpbmcgbWVudGlvbnMuXCIsIHtcbiAgICAgICAgICAgICAgICBjb3VudDogbm90aWZpY2F0aW9uQ291bnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChub3RpZkJhZGdlcykge1xuICAgICAgICAgICAgYXJpYUxhYmVsICs9IFwiIFwiICsgX3QoXCIlKGNvdW50KXMgdW5yZWFkIG1lc3NhZ2VzLlwiLCB7IGNvdW50OiBub3RpZmljYXRpb25Db3VudCB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChtZW50aW9uQmFkZ2VzICYmICFpc0ludml0ZSkge1xuICAgICAgICAgICAgYXJpYUxhYmVsICs9IFwiIFwiICsgX3QoXCJVbnJlYWQgbWVudGlvbnMuXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMudW5yZWFkKSB7XG4gICAgICAgICAgICBhcmlhTGFiZWwgKz0gXCIgXCIgKyBfdChcIlVucmVhZCBtZXNzYWdlcy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29udGV4dE1lbnU7XG4gICAgICAgIGlmIChpc01lbnVEaXNwbGF5ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IFJvb21UaWxlQ29udGV4dE1lbnUgPSBzZGsuZ2V0Q29tcG9uZW50KCdjb250ZXh0X21lbnVzLlJvb21UaWxlQ29udGV4dE1lbnUnKTtcbiAgICAgICAgICAgIGNvbnRleHRNZW51ID0gKFxuICAgICAgICAgICAgICAgIDxDb250ZXh0TWVudSB7Li4udG9SaWdodE9mKHRoaXMuc3RhdGUuY29udGV4dE1lbnVQb3NpdGlvbil9IG9uRmluaXNoZWQ9e3RoaXMuY2xvc2VNZW51fT5cbiAgICAgICAgICAgICAgICAgICAgPFJvb21UaWxlQ29udGV4dE1lbnUgcm9vbT17dGhpcy5wcm9wcy5yb29tfSBvbkZpbmlzaGVkPXt0aGlzLmNsb3NlTWVudX0gLz5cbiAgICAgICAgICAgICAgICA8L0NvbnRleHRNZW51PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcml2YXRlSWNvbiA9IG51bGw7XG4gICAgICAgIGlmIChTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5qb2luUnVsZSA9PSBcImludml0ZVwiICYmICFkbVVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHByaXZhdGVJY29uID0gPEludml0ZU9ubHlJY29uIGNvbGxhcHNlZFBhbmVsPXt0aGlzLnByb3BzLmNvbGxhcHNlZH0gLz47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZTJlSWNvbiA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmUyZVN0YXR1cykge1xuICAgICAgICAgICAgZTJlSWNvbiA9IDxFMkVJY29uIHN0YXR1cz17dGhpcy5zdGF0ZS5lMmVTdGF0dXN9IGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlX2UyZUljb25cIiAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICA8Um92aW5nVGFiSW5kZXhXcmFwcGVyIGlucHV0UmVmPXt0aGlzLl9yb29tVGlsZX0+XG4gICAgICAgICAgICAgICAgeyh7b25Gb2N1cywgaXNBY3RpdmUsIHJlZn0pID0+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZvY3VzPXtvbkZvY3VzfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9e2lzQWN0aXZlID8gMCA6IC0xfVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRSZWY9e3JlZn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlc31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5vbk1vdXNlRW50ZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMub25Nb3VzZUxlYXZlfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Db250ZXh0TWVudT17dGhpcy5vbkNvbnRleHRNZW51fVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17YXJpYUxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1zZWxlY3RlZD17dGhpcy5zdGF0ZS5zZWxlY3RlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU9XCJ0cmVlaXRlbVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXthdmF0YXJDbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlX2F2YXRhcl9jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJvb21BdmF0YXIgcm9vbT17dGhpcy5wcm9wcy5yb29tfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZTJlSWNvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgcHJpdmF0ZUljb24gfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tVGlsZV9uYW1lQ29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tVGlsZV9sYWJlbENvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzdWJ0ZXh0TGFiZWwgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZG1PbmxpbmUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgY29udGV4dE1lbnVCdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYmFkZ2UgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IC8qIHsgaW5jb21pbmdDYWxsQm94IH0gKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0b29sdGlwIH1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDwvUm92aW5nVGFiSW5kZXhXcmFwcGVyPlxuXG4gICAgICAgICAgICB7IGNvbnRleHRNZW51IH1cbiAgICAgICAgPC9SZWFjdC5GcmFnbWVudD47XG4gICAgfSxcbn0pO1xuIl19