"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var Rooms = _interopRequireWildcard(require("../../../Rooms"));

var RoomNotifs = _interopRequireWildcard(require("../../../RoomNotifs"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _RoomListActions = _interopRequireDefault(require("../../../actions/RoomListActions"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _promise = require("../../../utils/promise");

var _ContextMenu = require("../../structures/ContextMenu");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
const RoomTagOption = ({
  active,
  onClick,
  src,
  srcSet,
  label
}) => {
  const classes = (0, _classnames.default)('mx_RoomTileContextMenu_tag_field', {
    'mx_RoomTileContextMenu_tag_fieldSet': active,
    'mx_RoomTileContextMenu_tag_fieldDisabled': false
  });
  return /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItemCheckbox, {
    className: classes,
    onClick: onClick,
    active: active,
    label: label
  }, /*#__PURE__*/_react.default.createElement("img", {
    className: "mx_RoomTileContextMenu_tag_icon",
    src: src,
    width: "15",
    height: "15",
    alt: ""
  }), /*#__PURE__*/_react.default.createElement("img", {
    className: "mx_RoomTileContextMenu_tag_icon_set",
    src: srcSet,
    width: "15",
    height: "15",
    alt: ""
  }), label);
};

const NotifOption = ({
  active,
  onClick,
  src,
  label
}) => {
  const classes = (0, _classnames.default)('mx_RoomTileContextMenu_notif_field', {
    'mx_RoomTileContextMenu_notif_fieldSet': active
  });
  return /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItemRadio, {
    className: classes,
    onClick: onClick,
    active: active,
    label: label
  }, /*#__PURE__*/_react.default.createElement("img", {
    className: "mx_RoomTileContextMenu_notif_activeIcon",
    src: require("../../../../res/img/notif-active.svg"),
    width: "12",
    height: "12",
    alt: ""
  }), /*#__PURE__*/_react.default.createElement("img", {
    className: "mx_RoomTileContextMenu_notif_icon mx_filterFlipColor",
    src: src,
    width: "16",
    height: "12",
    alt: ""
  }), label);
};

var _default = (0, _createReactClass.default)({
  displayName: 'RoomTileContextMenu',
  propTypes: {
    room: _propTypes.default.object.isRequired,

    /* callback called when the menu is dismissed */
    onFinished: _propTypes.default.func
  },

  getInitialState() {
    const dmRoomMap = new _DMRoomMap.default(_MatrixClientPeg.MatrixClientPeg.get());
    return {
      roomNotifState: RoomNotifs.getRoomNotifsState(this.props.room.roomId),
      isFavourite: this.props.room.tags.hasOwnProperty("m.favourite"),
      isLowPriority: this.props.room.tags.hasOwnProperty("m.lowpriority"),
      isDirectMessage: Boolean(dmRoomMap.getUserIdForRoomId(this.props.room.roomId))
    };
  },

  componentDidMount: function () {
    this._unmounted = false;
  },
  componentWillUnmount: function () {
    this._unmounted = true;
  },
  _toggleTag: function (tagNameOn, tagNameOff) {
    if (!_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      (0, _promise.sleep)(500).then(() => {
        _dispatcher.default.dispatch(_RoomListActions.default.tagRoom(_MatrixClientPeg.MatrixClientPeg.get(), this.props.room, tagNameOff, tagNameOn, undefined, 0), true);

        this.props.onFinished();
      });
    }
  },
  _onClickFavourite: function () {
    // Tag room as 'Favourite'
    if (!this.state.isFavourite && this.state.isLowPriority) {
      this.setState({
        isFavourite: true,
        isLowPriority: false
      });

      this._toggleTag("m.favourite", "m.lowpriority");
    } else if (this.state.isFavourite) {
      this.setState({
        isFavourite: false
      });

      this._toggleTag(null, "m.favourite");
    } else if (!this.state.isFavourite) {
      this.setState({
        isFavourite: true
      });

      this._toggleTag("m.favourite");
    }
  },
  _onClickLowPriority: function () {
    // Tag room as 'Low Priority'
    if (!this.state.isLowPriority && this.state.isFavourite) {
      this.setState({
        isFavourite: false,
        isLowPriority: true
      });

      this._toggleTag("m.lowpriority", "m.favourite");
    } else if (this.state.isLowPriority) {
      this.setState({
        isLowPriority: false
      });

      this._toggleTag(null, "m.lowpriority");
    } else if (!this.state.isLowPriority) {
      this.setState({
        isLowPriority: true
      });

      this._toggleTag("m.lowpriority");
    }
  },
  _onClickDM: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) return;
    const newIsDirectMessage = !this.state.isDirectMessage;
    this.setState({
      isDirectMessage: newIsDirectMessage
    });
    Rooms.guessAndSetDMRoom(this.props.room, newIsDirectMessage).then((0, _promise.sleep)(500)).finally(() => {
      // Close the context menu
      if (this.props.onFinished) {
        this.props.onFinished();
      }
    }, err => {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to set Direct Message status of room', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Failed to set Direct Message status of room'),
        description: err && err.message ? err.message : (0, _languageHandler._t)('Operation failed')
      });
    });
  },
  _onClickLeave: function () {
    // Leave room
    _dispatcher.default.dispatch({
      action: 'leave_room',
      room_id: this.props.room.roomId
    }); // Close the context menu


    if (this.props.onFinished) {
      this.props.onFinished();
    }
  },
  _onClickReject: function () {
    _dispatcher.default.dispatch({
      action: 'reject_invite',
      room_id: this.props.room.roomId
    }); // Close the context menu


    if (this.props.onFinished) {
      this.props.onFinished();
    }
  },
  _onClickForget: function () {
    // FIXME: duplicated with RoomSettings (and dead code in RoomView)
    _MatrixClientPeg.MatrixClientPeg.get().forget(this.props.room.roomId).then(() => {
      // Switch to another room view if we're currently viewing the
      // historical room
      if (_RoomViewStore.default.getRoomId() === this.props.room.roomId) {
        _dispatcher.default.dispatch({
          action: 'view_next_room'
        });
      }
    }, function (err) {
      const errCode = err.errcode || (0, _languageHandler._td)("unknown error code");
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to forget room', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Failed to forget room %(errCode)s', {
          errCode: errCode
        }),
        description: err && err.message ? err.message : (0, _languageHandler._t)('Operation failed')
      });
    }); // Close the context menu


    if (this.props.onFinished) {
      this.props.onFinished();
    }
  },
  _saveNotifState: function (newState) {
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) return;
    const oldState = this.state.roomNotifState;
    const roomId = this.props.room.roomId;
    this.setState({
      roomNotifState: newState
    });
    RoomNotifs.setRoomNotifsState(roomId, newState).then(() => {
      // delay slightly so that the user can see their state change
      // before closing the menu
      return (0, _promise.sleep)(500).then(() => {
        if (this._unmounted) return; // Close the context menu

        if (this.props.onFinished) {
          this.props.onFinished();
        }
      });
    }, error => {
      // TODO: some form of error notification to the user
      // to inform them that their state change failed.
      // For now we at least set the state back
      if (this._unmounted) return;
      this.setState({
        roomNotifState: oldState
      });
    });
  },
  _onClickAlertMe: function () {
    this._saveNotifState(RoomNotifs.ALL_MESSAGES_LOUD);
  },
  _onClickAllNotifs: function () {
    this._saveNotifState(RoomNotifs.ALL_MESSAGES);
  },
  _onClickMentions: function () {
    this._saveNotifState(RoomNotifs.MENTIONS_ONLY);
  },
  _onClickMute: function () {
    this._saveNotifState(RoomNotifs.MUTE);
  },
  _renderNotifMenu: function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomTileContextMenu",
      role: "group",
      "aria-label": (0, _languageHandler._t)("Notification settings")
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomTileContextMenu_notif_picker",
      role: "presentation"
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/notif-slider.svg"),
      width: "20",
      height: "107",
      alt: ""
    })), /*#__PURE__*/_react.default.createElement(NotifOption, {
      active: this.state.roomNotifState === RoomNotifs.ALL_MESSAGES_LOUD,
      label: (0, _languageHandler._t)('All messages (noisy)'),
      onClick: this._onClickAlertMe,
      src: require("../../../../res/img/icon-context-mute-off-copy.svg")
    }), /*#__PURE__*/_react.default.createElement(NotifOption, {
      active: this.state.roomNotifState === RoomNotifs.ALL_MESSAGES,
      label: (0, _languageHandler._t)('All messages'),
      onClick: this._onClickAllNotifs,
      src: require("../../../../res/img/icon-context-mute-off.svg")
    }), /*#__PURE__*/_react.default.createElement(NotifOption, {
      active: this.state.roomNotifState === RoomNotifs.MENTIONS_ONLY,
      label: (0, _languageHandler._t)('Mentions only'),
      onClick: this._onClickMentions,
      src: require("../../../../res/img/icon-context-mute-mentions.svg")
    }), /*#__PURE__*/_react.default.createElement(NotifOption, {
      active: this.state.roomNotifState === RoomNotifs.MUTE,
      label: (0, _languageHandler._t)('Mute'),
      onClick: this._onClickMute,
      src: require("../../../../res/img/icon-context-mute.svg")
    }));
  },
  _onClickSettings: function () {
    _dispatcher.default.dispatch({
      action: 'open_room_settings',
      room_id: this.props.room.roomId
    });

    if (this.props.onFinished) {
      this.props.onFinished();
    }
  },
  _renderSettingsMenu: function () {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_RoomTileContextMenu_tag_field",
      onClick: this._onClickSettings
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_RoomTileContextMenu_tag_icon",
      src: require("../../../../res/img/feather-customised/settings.svg"),
      width: "15",
      height: "15",
      alt: ""
    }), (0, _languageHandler._t)('Settings')));
  },
  _renderLeaveMenu: function (membership) {
    if (!membership) {
      return null;
    }

    let leaveClickHandler = null;
    let leaveText = null;

    switch (membership) {
      case "join":
        leaveClickHandler = this._onClickLeave;
        leaveText = (0, _languageHandler._t)('Leave');
        break;

      case "leave":
      case "ban":
        leaveClickHandler = this._onClickForget;
        leaveText = (0, _languageHandler._t)('Forget');
        break;

      case "invite":
        leaveClickHandler = this._onClickReject;
        leaveText = (0, _languageHandler._t)('Reject');
        break;
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_RoomTileContextMenu_leave",
      onClick: leaveClickHandler
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_RoomTileContextMenu_tag_icon",
      src: require("../../../../res/img/icon_context_delete.svg"),
      width: "15",
      height: "15",
      alt: ""
    }), leaveText));
  },
  _renderRoomTagMenu: function () {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(RoomTagOption, {
      active: this.state.isFavourite,
      label: (0, _languageHandler._t)('Favourite'),
      onClick: this._onClickFavourite,
      src: require("../../../../res/img/icon_context_fave.svg"),
      srcSet: require("../../../../res/img/icon_context_fave_on.svg")
    }), /*#__PURE__*/_react.default.createElement(RoomTagOption, {
      active: this.state.isLowPriority,
      label: (0, _languageHandler._t)('Low Priority'),
      onClick: this._onClickLowPriority,
      src: require("../../../../res/img/icon_context_low.svg"),
      srcSet: require("../../../../res/img/icon_context_low_on.svg")
    }), /*#__PURE__*/_react.default.createElement(RoomTagOption, {
      active: this.state.isDirectMessage,
      label: (0, _languageHandler._t)('Direct Chat'),
      onClick: this._onClickDM,
      src: require("../../../../res/img/icon_context_person.svg"),
      srcSet: require("../../../../res/img/icon_context_person_on.svg")
    }));
  },
  render: function () {
    const myMembership = this.props.room.getMyMembership();

    switch (myMembership) {
      case 'join':
        return /*#__PURE__*/_react.default.createElement("div", null, this._renderNotifMenu(), /*#__PURE__*/_react.default.createElement("hr", {
          className: "mx_RoomTileContextMenu_separator",
          role: "separator"
        }), this._renderLeaveMenu(myMembership), /*#__PURE__*/_react.default.createElement("hr", {
          className: "mx_RoomTileContextMenu_separator",
          role: "separator"
        }), this._renderRoomTagMenu(), /*#__PURE__*/_react.default.createElement("hr", {
          className: "mx_RoomTileContextMenu_separator",
          role: "separator"
        }), this._renderSettingsMenu());

      case 'invite':
        return /*#__PURE__*/_react.default.createElement("div", null, this._renderLeaveMenu(myMembership));

      default:
        return /*#__PURE__*/_react.default.createElement("div", null, this._renderLeaveMenu(myMembership), /*#__PURE__*/_react.default.createElement("hr", {
          className: "mx_RoomTileContextMenu_separator",
          role: "separator"
        }), this._renderSettingsMenu());
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvUm9vbVRpbGVDb250ZXh0TWVudS5qcyJdLCJuYW1lcyI6WyJSb29tVGFnT3B0aW9uIiwiYWN0aXZlIiwib25DbGljayIsInNyYyIsInNyY1NldCIsImxhYmVsIiwiY2xhc3NlcyIsIk5vdGlmT3B0aW9uIiwicmVxdWlyZSIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJvbkZpbmlzaGVkIiwiZnVuYyIsImdldEluaXRpYWxTdGF0ZSIsImRtUm9vbU1hcCIsIkRNUm9vbU1hcCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInJvb21Ob3RpZlN0YXRlIiwiUm9vbU5vdGlmcyIsImdldFJvb21Ob3RpZnNTdGF0ZSIsInByb3BzIiwicm9vbUlkIiwiaXNGYXZvdXJpdGUiLCJ0YWdzIiwiaGFzT3duUHJvcGVydHkiLCJpc0xvd1ByaW9yaXR5IiwiaXNEaXJlY3RNZXNzYWdlIiwiQm9vbGVhbiIsImdldFVzZXJJZEZvclJvb21JZCIsImNvbXBvbmVudERpZE1vdW50IiwiX3VubW91bnRlZCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiX3RvZ2dsZVRhZyIsInRhZ05hbWVPbiIsInRhZ05hbWVPZmYiLCJpc0d1ZXN0IiwidGhlbiIsImRpcyIsImRpc3BhdGNoIiwiUm9vbUxpc3RBY3Rpb25zIiwidGFnUm9vbSIsInVuZGVmaW5lZCIsIl9vbkNsaWNrRmF2b3VyaXRlIiwic3RhdGUiLCJzZXRTdGF0ZSIsIl9vbkNsaWNrTG93UHJpb3JpdHkiLCJfb25DbGlja0RNIiwibmV3SXNEaXJlY3RNZXNzYWdlIiwiUm9vbXMiLCJndWVzc0FuZFNldERNUm9vbSIsImZpbmFsbHkiLCJlcnIiLCJFcnJvckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJtZXNzYWdlIiwiX29uQ2xpY2tMZWF2ZSIsImFjdGlvbiIsInJvb21faWQiLCJfb25DbGlja1JlamVjdCIsIl9vbkNsaWNrRm9yZ2V0IiwiZm9yZ2V0IiwiUm9vbVZpZXdTdG9yZSIsImdldFJvb21JZCIsImVyckNvZGUiLCJlcnJjb2RlIiwiX3NhdmVOb3RpZlN0YXRlIiwibmV3U3RhdGUiLCJvbGRTdGF0ZSIsInNldFJvb21Ob3RpZnNTdGF0ZSIsImVycm9yIiwiX29uQ2xpY2tBbGVydE1lIiwiQUxMX01FU1NBR0VTX0xPVUQiLCJfb25DbGlja0FsbE5vdGlmcyIsIkFMTF9NRVNTQUdFUyIsIl9vbkNsaWNrTWVudGlvbnMiLCJNRU5USU9OU19PTkxZIiwiX29uQ2xpY2tNdXRlIiwiTVVURSIsIl9yZW5kZXJOb3RpZk1lbnUiLCJfb25DbGlja1NldHRpbmdzIiwiX3JlbmRlclNldHRpbmdzTWVudSIsIl9yZW5kZXJMZWF2ZU1lbnUiLCJtZW1iZXJzaGlwIiwibGVhdmVDbGlja0hhbmRsZXIiLCJsZWF2ZVRleHQiLCJfcmVuZGVyUm9vbVRhZ01lbnUiLCJyZW5kZXIiLCJteU1lbWJlcnNoaXAiLCJnZXRNeU1lbWJlcnNoaXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWxDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0NBLE1BQU1BLGFBQWEsR0FBRyxDQUFDO0FBQUNDLEVBQUFBLE1BQUQ7QUFBU0MsRUFBQUEsT0FBVDtBQUFrQkMsRUFBQUEsR0FBbEI7QUFBdUJDLEVBQUFBLE1BQXZCO0FBQStCQyxFQUFBQTtBQUEvQixDQUFELEtBQTJDO0FBQzdELFFBQU1DLE9BQU8sR0FBRyx5QkFBVyxrQ0FBWCxFQUErQztBQUMzRCwyQ0FBdUNMLE1BRG9CO0FBRTNELGdEQUE0QztBQUZlLEdBQS9DLENBQWhC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LFNBQVMsRUFBQyxrQ0FBZDtBQUFpRCxVQUFBLElBQUksRUFBQztBQUF0RCxVQU5HLEVBT0QsS0FBS0wsbUJBQUwsRUFQQyxDQUFQOztBQVNKLFdBQUssUUFBTDtBQUNJLDRCQUFPLDBDQUNELEtBQUtDLGdCQUFMLENBQXNCTSxZQUF0QixDQURDLENBQVA7O0FBR0o7QUFDSSw0QkFBTywwQ0FDRCxLQUFLTixnQkFBTCxDQUFzQk0sWUFBdEIsQ0FEQyxlQUVIO0FBQUksVUFBQSxTQUFTLEVBQUMsa0NBQWQ7QUFBaUQsVUFBQSxJQUFJLEVBQUM7QUFBdEQsVUFGRyxFQUdELEtBQUtQLG1CQUFMLEVBSEMsQ0FBUDtBQWhCUjtBQXNCSDtBQWpWMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCwgX3RkIH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi8uLi8uLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0ICogYXMgUm9vbXMgZnJvbSAnLi4vLi4vLi4vUm9vbXMnO1xuaW1wb3J0ICogYXMgUm9vbU5vdGlmcyBmcm9tICcuLi8uLi8uLi9Sb29tTm90aWZzJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgUm9vbUxpc3RBY3Rpb25zIGZyb20gJy4uLy4uLy4uL2FjdGlvbnMvUm9vbUxpc3RBY3Rpb25zJztcbmltcG9ydCBSb29tVmlld1N0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9Sb29tVmlld1N0b3JlJztcbmltcG9ydCB7c2xlZXB9IGZyb20gXCIuLi8uLi8uLi91dGlscy9wcm9taXNlXCI7XG5pbXBvcnQge01lbnVJdGVtLCBNZW51SXRlbUNoZWNrYm94LCBNZW51SXRlbVJhZGlvfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuXG5jb25zdCBSb29tVGFnT3B0aW9uID0gKHthY3RpdmUsIG9uQ2xpY2ssIHNyYywgc3JjU2V0LCBsYWJlbH0pID0+IHtcbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcygnbXhfUm9vbVRpbGVDb250ZXh0TWVudV90YWdfZmllbGQnLCB7XG4gICAgICAgICdteF9Sb29tVGlsZUNvbnRleHRNZW51X3RhZ19maWVsZFNldCc6IGFjdGl2ZSxcbiAgICAgICAgJ214X1Jvb21UaWxlQ29udGV4dE1lbnVfdGFnX2ZpZWxkRGlzYWJsZWQnOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxNZW51SXRlbUNoZWNrYm94IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17b25DbGlja30gYWN0aXZlPXthY3RpdmV9IGxhYmVsPXtsYWJlbH0+XG4gICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlQ29udGV4dE1lbnVfdGFnX2ljb25cIiBzcmM9e3NyY30gd2lkdGg9XCIxNVwiIGhlaWdodD1cIjE1XCIgYWx0PVwiXCIgLz5cbiAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfUm9vbVRpbGVDb250ZXh0TWVudV90YWdfaWNvbl9zZXRcIiBzcmM9e3NyY1NldH0gd2lkdGg9XCIxNVwiIGhlaWdodD1cIjE1XCIgYWx0PVwiXCIgLz5cbiAgICAgICAgICAgIHsgbGFiZWwgfVxuICAgICAgICA8L01lbnVJdGVtQ2hlY2tib3g+XG4gICAgKTtcbn07XG5cbmNvbnN0IE5vdGlmT3B0aW9uID0gKHthY3RpdmUsIG9uQ2xpY2ssIHNyYywgbGFiZWx9KSA9PiB7XG4gICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoJ214X1Jvb21UaWxlQ29udGV4dE1lbnVfbm90aWZfZmllbGQnLCB7XG4gICAgICAgICdteF9Sb29tVGlsZUNvbnRleHRNZW51X25vdGlmX2ZpZWxkU2V0JzogYWN0aXZlLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPE1lbnVJdGVtUmFkaW8gY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXtvbkNsaWNrfSBhY3RpdmU9e2FjdGl2ZX0gbGFiZWw9e2xhYmVsfT5cbiAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfUm9vbVRpbGVDb250ZXh0TWVudV9ub3RpZl9hY3RpdmVJY29uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9ub3RpZi1hY3RpdmUuc3ZnXCIpfSB3aWR0aD1cIjEyXCIgaGVpZ2h0PVwiMTJcIiBhbHQ9XCJcIiAvPlxuICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X25vdGlmX2ljb24gbXhfZmlsdGVyRmxpcENvbG9yXCIgc3JjPXtzcmN9IHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxMlwiIGFsdD1cIlwiIC8+XG4gICAgICAgICAgICB7IGxhYmVsIH1cbiAgICAgICAgPC9NZW51SXRlbVJhZGlvPlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1Jvb21UaWxlQ29udGV4dE1lbnUnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgLyogY2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIG1lbnUgaXMgZGlzbWlzc2VkICovXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGRtUm9vbU1hcCA9IG5ldyBETVJvb21NYXAoTWF0cml4Q2xpZW50UGVnLmdldCgpKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb21Ob3RpZlN0YXRlOiBSb29tTm90aWZzLmdldFJvb21Ob3RpZnNTdGF0ZSh0aGlzLnByb3BzLnJvb20ucm9vbUlkKSxcbiAgICAgICAgICAgIGlzRmF2b3VyaXRlOiB0aGlzLnByb3BzLnJvb20udGFncy5oYXNPd25Qcm9wZXJ0eShcIm0uZmF2b3VyaXRlXCIpLFxuICAgICAgICAgICAgaXNMb3dQcmlvcml0eTogdGhpcy5wcm9wcy5yb29tLnRhZ3MuaGFzT3duUHJvcGVydHkoXCJtLmxvd3ByaW9yaXR5XCIpLFxuICAgICAgICAgICAgaXNEaXJlY3RNZXNzYWdlOiBCb29sZWFuKGRtUm9vbU1hcC5nZXRVc2VySWRGb3JSb29tSWQodGhpcy5wcm9wcy5yb29tLnJvb21JZCkpLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIF90b2dnbGVUYWc6IGZ1bmN0aW9uKHRhZ05hbWVPbiwgdGFnTmFtZU9mZikge1xuICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHtcbiAgICAgICAgICAgIHNsZWVwKDUwMCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKFJvb21MaXN0QWN0aW9ucy50YWdSb29tKFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMucm9vbSxcbiAgICAgICAgICAgICAgICAgICAgdGFnTmFtZU9mZiwgdGFnTmFtZU9uLFxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIDAsXG4gICAgICAgICAgICAgICAgKSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkNsaWNrRmF2b3VyaXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVGFnIHJvb20gYXMgJ0Zhdm91cml0ZSdcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmlzRmF2b3VyaXRlICYmIHRoaXMuc3RhdGUuaXNMb3dQcmlvcml0eSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgaXNGYXZvdXJpdGU6IHRydWUsXG4gICAgICAgICAgICAgICAgaXNMb3dQcmlvcml0eTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3RvZ2dsZVRhZyhcIm0uZmF2b3VyaXRlXCIsIFwibS5sb3dwcmlvcml0eVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmlzRmF2b3VyaXRlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0Zhdm91cml0ZTogZmFsc2V9KTtcbiAgICAgICAgICAgIHRoaXMuX3RvZ2dsZVRhZyhudWxsLCBcIm0uZmF2b3VyaXRlXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLmlzRmF2b3VyaXRlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0Zhdm91cml0ZTogdHJ1ZX0pO1xuICAgICAgICAgICAgdGhpcy5fdG9nZ2xlVGFnKFwibS5mYXZvdXJpdGVcIik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uQ2xpY2tMb3dQcmlvcml0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRhZyByb29tIGFzICdMb3cgUHJpb3JpdHknXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pc0xvd1ByaW9yaXR5ICYmIHRoaXMuc3RhdGUuaXNGYXZvdXJpdGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGlzRmF2b3VyaXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc0xvd1ByaW9yaXR5OiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl90b2dnbGVUYWcoXCJtLmxvd3ByaW9yaXR5XCIsIFwibS5mYXZvdXJpdGVcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5pc0xvd1ByaW9yaXR5KSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0xvd1ByaW9yaXR5OiBmYWxzZX0pO1xuICAgICAgICAgICAgdGhpcy5fdG9nZ2xlVGFnKG51bGwsIFwibS5sb3dwcmlvcml0eVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5pc0xvd1ByaW9yaXR5KSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0xvd1ByaW9yaXR5OiB0cnVlfSk7XG4gICAgICAgICAgICB0aGlzLl90b2dnbGVUYWcoXCJtLmxvd3ByaW9yaXR5XCIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkNsaWNrRE06IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzR3Vlc3QoKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG5ld0lzRGlyZWN0TWVzc2FnZSA9ICF0aGlzLnN0YXRlLmlzRGlyZWN0TWVzc2FnZTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBpc0RpcmVjdE1lc3NhZ2U6IG5ld0lzRGlyZWN0TWVzc2FnZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgUm9vbXMuZ3Vlc3NBbmRTZXRETVJvb20oXG4gICAgICAgICAgICB0aGlzLnByb3BzLnJvb20sIG5ld0lzRGlyZWN0TWVzc2FnZSxcbiAgICAgICAgKS50aGVuKHNsZWVwKDUwMCkpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ2xvc2UgdGhlIGNvbnRleHQgbWVudVxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25GaW5pc2hlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHNldCBEaXJlY3QgTWVzc2FnZSBzdGF0dXMgb2Ygcm9vbScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRmFpbGVkIHRvIHNldCBEaXJlY3QgTWVzc2FnZSBzdGF0dXMgb2Ygcm9vbScpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KCdPcGVyYXRpb24gZmFpbGVkJykpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25DbGlja0xlYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gTGVhdmUgcm9vbVxuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAnbGVhdmVfcm9vbScsXG4gICAgICAgICAgICByb29tX2lkOiB0aGlzLnByb3BzLnJvb20ucm9vbUlkLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDbG9zZSB0aGUgY29udGV4dCBtZW51XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkNsaWNrUmVqZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3JlamVjdF9pbnZpdGUnLFxuICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5wcm9wcy5yb29tLnJvb21JZCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2xvc2UgdGhlIGNvbnRleHQgbWVudVxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkZpbmlzaGVkKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25DbGlja0ZvcmdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEZJWE1FOiBkdXBsaWNhdGVkIHdpdGggUm9vbVNldHRpbmdzIChhbmQgZGVhZCBjb2RlIGluIFJvb21WaWV3KVxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZm9yZ2V0KHRoaXMucHJvcHMucm9vbS5yb29tSWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gU3dpdGNoIHRvIGFub3RoZXIgcm9vbSB2aWV3IGlmIHdlJ3JlIGN1cnJlbnRseSB2aWV3aW5nIHRoZVxuICAgICAgICAgICAgLy8gaGlzdG9yaWNhbCByb29tXG4gICAgICAgICAgICBpZiAoUm9vbVZpZXdTdG9yZS5nZXRSb29tSWQoKSA9PT0gdGhpcy5wcm9wcy5yb29tLnJvb21JZCkge1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7IGFjdGlvbjogJ3ZpZXdfbmV4dF9yb29tJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJDb2RlID0gZXJyLmVycmNvZGUgfHwgX3RkKFwidW5rbm93biBlcnJvciBjb2RlXCIpO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBmb3JnZXQgcm9vbScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRmFpbGVkIHRvIGZvcmdldCByb29tICUoZXJyQ29kZSlzJywge2VyckNvZGU6IGVyckNvZGV9KSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdCgnT3BlcmF0aW9uIGZhaWxlZCcpKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDbG9zZSB0aGUgY29udGV4dCBtZW51XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9zYXZlTm90aWZTdGF0ZTogZnVuY3Rpb24obmV3U3RhdGUpIHtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHJldHVybjtcblxuICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuc3RhdGUucm9vbU5vdGlmU3RhdGU7XG4gICAgICAgIGNvbnN0IHJvb21JZCA9IHRoaXMucHJvcHMucm9vbS5yb29tSWQ7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByb29tTm90aWZTdGF0ZTogbmV3U3RhdGUsXG4gICAgICAgIH0pO1xuICAgICAgICBSb29tTm90aWZzLnNldFJvb21Ob3RpZnNTdGF0ZShyb29tSWQsIG5ld1N0YXRlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGRlbGF5IHNsaWdodGx5IHNvIHRoYXQgdGhlIHVzZXIgY2FuIHNlZSB0aGVpciBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgICAgIC8vIGJlZm9yZSBjbG9zaW5nIHRoZSBtZW51XG4gICAgICAgICAgICByZXR1cm4gc2xlZXAoNTAwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgLy8gQ2xvc2UgdGhlIGNvbnRleHQgbWVudVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgLy8gVE9ETzogc29tZSBmb3JtIG9mIGVycm9yIG5vdGlmaWNhdGlvbiB0byB0aGUgdXNlclxuICAgICAgICAgICAgLy8gdG8gaW5mb3JtIHRoZW0gdGhhdCB0aGVpciBzdGF0ZSBjaGFuZ2UgZmFpbGVkLlxuICAgICAgICAgICAgLy8gRm9yIG5vdyB3ZSBhdCBsZWFzdCBzZXQgdGhlIHN0YXRlIGJhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHJvb21Ob3RpZlN0YXRlOiBvbGRTdGF0ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uQ2xpY2tBbGVydE1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2F2ZU5vdGlmU3RhdGUoUm9vbU5vdGlmcy5BTExfTUVTU0FHRVNfTE9VRCk7XG4gICAgfSxcblxuICAgIF9vbkNsaWNrQWxsTm90aWZzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2F2ZU5vdGlmU3RhdGUoUm9vbU5vdGlmcy5BTExfTUVTU0FHRVMpO1xuICAgIH0sXG5cbiAgICBfb25DbGlja01lbnRpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2F2ZU5vdGlmU3RhdGUoUm9vbU5vdGlmcy5NRU5USU9OU19PTkxZKTtcbiAgICB9LFxuXG4gICAgX29uQ2xpY2tNdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2F2ZU5vdGlmU3RhdGUoUm9vbU5vdGlmcy5NVVRFKTtcbiAgICB9LFxuXG4gICAgX3JlbmRlck5vdGlmTWVudTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlQ29udGV4dE1lbnVcIiByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPXtfdChcIk5vdGlmaWNhdGlvbiBzZXR0aW5nc1wiKX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X25vdGlmX3BpY2tlclwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL25vdGlmLXNsaWRlci5zdmdcIil9IHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIxMDdcIiBhbHQ9XCJcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPE5vdGlmT3B0aW9uXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZT17dGhpcy5zdGF0ZS5yb29tTm90aWZTdGF0ZSA9PT0gUm9vbU5vdGlmcy5BTExfTUVTU0FHRVNfTE9VRH1cbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdBbGwgbWVzc2FnZXMgKG5vaXN5KScpfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrQWxlcnRNZX1cbiAgICAgICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uLWNvbnRleHQtbXV0ZS1vZmYtY29weS5zdmdcIil9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8Tm90aWZPcHRpb25cbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlPXt0aGlzLnN0YXRlLnJvb21Ob3RpZlN0YXRlID09PSBSb29tTm90aWZzLkFMTF9NRVNTQUdFU31cbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdBbGwgbWVzc2FnZXMnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25DbGlja0FsbE5vdGlmc31cbiAgICAgICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uLWNvbnRleHQtbXV0ZS1vZmYuc3ZnXCIpfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPE5vdGlmT3B0aW9uXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZT17dGhpcy5zdGF0ZS5yb29tTm90aWZTdGF0ZSA9PT0gUm9vbU5vdGlmcy5NRU5USU9OU19PTkxZfVxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoJ01lbnRpb25zIG9ubHknKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25DbGlja01lbnRpb25zfVxuICAgICAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb24tY29udGV4dC1tdXRlLW1lbnRpb25zLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxOb3RpZk9wdGlvblxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e3RoaXMuc3RhdGUucm9vbU5vdGlmU3RhdGUgPT09IFJvb21Ob3RpZnMuTVVURX1cbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdNdXRlJyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2tNdXRlfVxuICAgICAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb24tY29udGV4dC1tdXRlLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNsaWNrU2V0dGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAnb3Blbl9yb29tX3NldHRpbmdzJyxcbiAgICAgICAgICAgIHJvb21faWQ6IHRoaXMucHJvcHMucm9vbS5yb29tSWQsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkZpbmlzaGVkKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfcmVuZGVyU2V0dGluZ3NNZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlQ29udGV4dE1lbnVfdGFnX2ZpZWxkXCIgb25DbGljaz17dGhpcy5fb25DbGlja1NldHRpbmdzfT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X3RhZ19pY29uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9mZWF0aGVyLWN1c3RvbWlzZWQvc2V0dGluZ3Muc3ZnXCIpfSB3aWR0aD1cIjE1XCIgaGVpZ2h0PVwiMTVcIiBhbHQ9XCJcIiAvPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdTZXR0aW5ncycpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9yZW5kZXJMZWF2ZU1lbnU6IGZ1bmN0aW9uKG1lbWJlcnNoaXApIHtcbiAgICAgICAgaWYgKCFtZW1iZXJzaGlwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsZWF2ZUNsaWNrSGFuZGxlciA9IG51bGw7XG4gICAgICAgIGxldCBsZWF2ZVRleHQgPSBudWxsO1xuXG4gICAgICAgIHN3aXRjaCAobWVtYmVyc2hpcCkge1xuICAgICAgICAgICAgY2FzZSBcImpvaW5cIjpcbiAgICAgICAgICAgICAgICBsZWF2ZUNsaWNrSGFuZGxlciA9IHRoaXMuX29uQ2xpY2tMZWF2ZTtcbiAgICAgICAgICAgICAgICBsZWF2ZVRleHQgPSBfdCgnTGVhdmUnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJsZWF2ZVwiOlxuICAgICAgICAgICAgY2FzZSBcImJhblwiOlxuICAgICAgICAgICAgICAgIGxlYXZlQ2xpY2tIYW5kbGVyID0gdGhpcy5fb25DbGlja0ZvcmdldDtcbiAgICAgICAgICAgICAgICBsZWF2ZVRleHQgPSBfdCgnRm9yZ2V0Jyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW52aXRlXCI6XG4gICAgICAgICAgICAgICAgbGVhdmVDbGlja0hhbmRsZXIgPSB0aGlzLl9vbkNsaWNrUmVqZWN0O1xuICAgICAgICAgICAgICAgIGxlYXZlVGV4dCA9IF90KCdSZWplY3QnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X2xlYXZlXCIgb25DbGljaz17bGVhdmVDbGlja0hhbmRsZXJ9PlxuICAgICAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlQ29udGV4dE1lbnVfdGFnX2ljb25cIiBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb25fY29udGV4dF9kZWxldGUuc3ZnXCIpfSB3aWR0aD1cIjE1XCIgaGVpZ2h0PVwiMTVcIiBhbHQ9XCJcIiAvPlxuICAgICAgICAgICAgICAgICAgICB7IGxlYXZlVGV4dCB9XG4gICAgICAgICAgICAgICAgPC9NZW51SXRlbT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUm9vbVRhZ01lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8Um9vbVRhZ09wdGlvblxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e3RoaXMuc3RhdGUuaXNGYXZvdXJpdGV9XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdCgnRmF2b3VyaXRlJyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2tGYXZvdXJpdGV9XG4gICAgICAgICAgICAgICAgICAgIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbl9jb250ZXh0X2ZhdmUuc3ZnXCIpfVxuICAgICAgICAgICAgICAgICAgICBzcmNTZXQ9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb25fY29udGV4dF9mYXZlX29uLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxSb29tVGFnT3B0aW9uXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZT17dGhpcy5zdGF0ZS5pc0xvd1ByaW9yaXR5fVxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoJ0xvdyBQcmlvcml0eScpfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrTG93UHJpb3JpdHl9XG4gICAgICAgICAgICAgICAgICAgIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbl9jb250ZXh0X2xvdy5zdmdcIil9XG4gICAgICAgICAgICAgICAgICAgIHNyY1NldD17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbl9jb250ZXh0X2xvd19vbi5zdmdcIil9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8Um9vbVRhZ09wdGlvblxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e3RoaXMuc3RhdGUuaXNEaXJlY3RNZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoJ0RpcmVjdCBDaGF0Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2tETX1cbiAgICAgICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uX2NvbnRleHRfcGVyc29uLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAgICAgc3JjU2V0PXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uX2NvbnRleHRfcGVyc29uX29uLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG15TWVtYmVyc2hpcCA9IHRoaXMucHJvcHMucm9vbS5nZXRNeU1lbWJlcnNoaXAoKTtcblxuICAgICAgICBzd2l0Y2ggKG15TWVtYmVyc2hpcCkge1xuICAgICAgICAgICAgY2FzZSAnam9pbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5fcmVuZGVyTm90aWZNZW51KCkgfVxuICAgICAgICAgICAgICAgICAgICA8aHIgY2xhc3NOYW1lPVwibXhfUm9vbVRpbGVDb250ZXh0TWVudV9zZXBhcmF0b3JcIiByb2xlPVwic2VwYXJhdG9yXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9yZW5kZXJMZWF2ZU1lbnUobXlNZW1iZXJzaGlwKSB9XG4gICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X3NlcGFyYXRvclwiIHJvbGU9XCJzZXBhcmF0b3JcIiAvPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX3JlbmRlclJvb21UYWdNZW51KCkgfVxuICAgICAgICAgICAgICAgICAgICA8aHIgY2xhc3NOYW1lPVwibXhfUm9vbVRpbGVDb250ZXh0TWVudV9zZXBhcmF0b3JcIiByb2xlPVwic2VwYXJhdG9yXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9yZW5kZXJTZXR0aW5nc01lbnUoKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgY2FzZSAnaW52aXRlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9yZW5kZXJMZWF2ZU1lbnUobXlNZW1iZXJzaGlwKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9yZW5kZXJMZWF2ZU1lbnUobXlNZW1iZXJzaGlwKSB9XG4gICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X3NlcGFyYXRvclwiIHJvbGU9XCJzZXBhcmF0b3JcIiAvPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX3JlbmRlclNldHRpbmdzTWVudSgpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=