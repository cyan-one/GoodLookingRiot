"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

var _HtmlUtils = require("../../../HtmlUtils");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _ManageIntegsButton = _interopRequireDefault(require("../elements/ManageIntegsButton"));

var _SimpleRoomHeader = require("./SimpleRoomHeader");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _RoomHeaderButtons = _interopRequireDefault(require("../right_panel/RoomHeaderButtons"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var _E2EIcon = _interopRequireDefault(require("./E2EIcon"));

var _InviteOnlyIcon = _interopRequireDefault(require("./InviteOnlyIcon"));

/*
Copyright 2015, 2016 OpenMarket Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'RoomHeader',
  propTypes: {
    room: _propTypes.default.object,
    oobData: _propTypes.default.object,
    inRoom: _propTypes.default.bool,
    onSettingsClick: _propTypes.default.func,
    onPinnedClick: _propTypes.default.func,
    onSearchClick: _propTypes.default.func,
    onLeaveClick: _propTypes.default.func,
    onCancelClick: _propTypes.default.func,
    e2eStatus: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      editing: false,
      inRoom: false,
      onCancelClick: null
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._topic = (0, _react.createRef)();
  },
  componentDidMount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("RoomState.events", this._onRoomStateEvents);
    cli.on("Room.accountData", this._onRoomAccountData); // When a room name occurs, RoomState.events is fired *before*
    // room.name is updated. So we have to listen to Room.name as well as
    // RoomState.events.

    if (this.props.room) {
      this.props.room.on("Room.name", this._onRoomNameChange);
    }
  },
  componentDidUpdate: function () {
    if (this._topic.current) {
      (0, _HtmlUtils.linkifyElement)(this._topic.current);
    }
  },
  componentWillUnmount: function () {
    if (this.props.room) {
      this.props.room.removeListener("Room.name", this._onRoomNameChange);
    }

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener("RoomState.events", this._onRoomStateEvents);
      cli.removeListener("Room.accountData", this._onRoomAccountData);
    }
  },
  _onRoomStateEvents: function (event, state) {
    if (!this.props.room || event.getRoomId() !== this.props.room.roomId) {
      return;
    } // redisplay the room name, topic, etc.


    this._rateLimitedUpdate();
  },
  _onRoomAccountData: function (event, room) {
    if (!this.props.room || room.roomId !== this.props.room.roomId) return;
    if (event.getType() !== "im.vector.room.read_pins") return;

    this._rateLimitedUpdate();
  },
  _rateLimitedUpdate: new _ratelimitedfunc.default(function () {
    /* eslint-disable babel/no-invalid-this */
    this.forceUpdate();
  }, 500),
  _onRoomNameChange: function (room) {
    this.forceUpdate();
  },
  onShareRoomClick: function (ev) {
    const ShareDialog = sdk.getComponent("dialogs.ShareDialog");

    _Modal.default.createTrackedDialog('share room dialog', '', ShareDialog, {
      target: this.props.room
    });
  },
  _hasUnreadPins: function () {
    const currentPinEvent = this.props.room.currentState.getStateEvents("m.room.pinned_events", '');
    if (!currentPinEvent) return false;

    if (currentPinEvent.getContent().pinned && currentPinEvent.getContent().pinned.length <= 0) {
      return false; // no pins == nothing to read
    }

    const readPinsEvent = this.props.room.getAccountData("im.vector.room.read_pins");

    if (readPinsEvent && readPinsEvent.getContent()) {
      const readStateEvents = readPinsEvent.getContent().event_ids || [];

      if (readStateEvents) {
        return !readStateEvents.includes(currentPinEvent.getId());
      }
    } // There's pins, and we haven't read any of them


    return true;
  },
  _hasPins: function () {
    const currentPinEvent = this.props.room.currentState.getStateEvents("m.room.pinned_events", '');
    if (!currentPinEvent) return false;
    return !(currentPinEvent.getContent().pinned && currentPinEvent.getContent().pinned.length <= 0);
  },
  render: function () {
    const RoomAvatar = sdk.getComponent("avatars.RoomAvatar");
    let searchStatus = null;
    let cancelButton = null;
    let settingsButton = null;
    let pinnedEventsButton = null;
    const e2eIcon = this.props.e2eStatus ? /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
      status: this.props.e2eStatus
    }) : undefined;

    const dmUserId = _DMRoomMap.default.shared().getUserIdForRoomId(this.props.room.roomId);

    const joinRules = this.props.room && this.props.room.currentState.getStateEvents("m.room.join_rules", "");
    const joinRule = joinRules && joinRules.getContent().join_rule;
    let privateIcon; // Don't show an invite-only icon for DMs. Users know they're invite-only.

    if (!dmUserId && _SettingsStore.default.getValue("feature_cross_signing")) {
      if (joinRule == "invite") {
        privateIcon = /*#__PURE__*/_react.default.createElement(_InviteOnlyIcon.default, null);
      }
    }

    if (this.props.onCancelClick) {
      cancelButton = /*#__PURE__*/_react.default.createElement(_SimpleRoomHeader.CancelButton, {
        onClick: this.props.onCancelClick
      });
    } // don't display the search count until the search completes and
    // gives us a valid (possibly zero) searchCount.


    if (this.props.searchInfo && this.props.searchInfo.searchCount !== undefined && this.props.searchInfo.searchCount !== null) {
      searchStatus = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomHeader_searchStatus"
      }, "\xA0", (0, _languageHandler._t)("(~%(count)s results)", {
        count: this.props.searchInfo.searchCount
      }));
    } // XXX: this is a bit inefficient - we could just compare room.name for 'Empty room'...


    let settingsHint = false;
    const members = this.props.room ? this.props.room.getJoinedMembers() : undefined;

    if (members) {
      if (members.length === 1 && members[0].userId === _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) {
        const nameEvent = this.props.room.currentState.getStateEvents('m.room.name', '');

        if (!nameEvent || !nameEvent.getContent().name) {
          settingsHint = true;
        }
      }
    }

    let roomName = (0, _languageHandler._t)("Join Room");

    if (this.props.oobData && this.props.oobData.name) {
      roomName = this.props.oobData.name;
    } else if (this.props.room) {
      roomName = this.props.room.name;
    }

    const textClasses = (0, _classnames.default)('mx_RoomHeader_nametext', {
      mx_RoomHeader_settingsHint: settingsHint
    });

    const name = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_name",
      onClick: this.props.onSettingsClick
    }, /*#__PURE__*/_react.default.createElement("div", {
      dir: "auto",
      className: textClasses,
      title: roomName
    }, roomName), searchStatus);

    let topic;

    if (this.props.room) {
      const ev = this.props.room.currentState.getStateEvents('m.room.topic', '');

      if (ev) {
        topic = ev.getContent().topic;
      }
    }

    const topicElement = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_topic",
      ref: this._topic,
      title: topic,
      dir: "auto"
    }, topic);

    const avatarSize = 28;
    let roomAvatar;

    if (this.props.room) {
      roomAvatar = /*#__PURE__*/_react.default.createElement(RoomAvatar, {
        room: this.props.room,
        width: avatarSize,
        height: avatarSize,
        oobData: this.props.oobData,
        viewAvatarOnClick: true
      });
    }

    if (this.props.onSettingsClick) {
      settingsButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_RoomHeader_button mx_RoomHeader_settingsButton",
        onClick: this.props.onSettingsClick,
        title: (0, _languageHandler._t)("Settings")
      });
    }

    if (this.props.onPinnedClick && _SettingsStore.default.isFeatureEnabled('feature_pinning')) {
      let pinsIndicator = null;

      if (this._hasUnreadPins()) {
        pinsIndicator = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomHeader_pinsIndicator mx_RoomHeader_pinsIndicatorUnread"
        });
      } else if (this._hasPins()) {
        pinsIndicator = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RoomHeader_pinsIndicator"
        });
      }

      pinnedEventsButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_RoomHeader_button mx_RoomHeader_pinnedButton",
        onClick: this.props.onPinnedClick,
        title: (0, _languageHandler._t)("Pinned Messages")
      }, pinsIndicator);
    } //        var leave_button;
    //        if (this.props.onLeaveClick) {
    //            leave_button =
    //                <div className="mx_RoomHeader_button" onClick={this.props.onLeaveClick} title="Leave room">
    //                    <TintableSvg src={require("../../../../res/img/leave.svg")} width="26" height="20"/>
    //                </div>;
    //        }


    let forgetButton;

    if (this.props.onForgetClick) {
      forgetButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_RoomHeader_button mx_RoomHeader_forgetButton",
        onClick: this.props.onForgetClick,
        title: (0, _languageHandler._t)("Forget room")
      });
    }

    let searchButton;

    if (this.props.onSearchClick && this.props.inRoom) {
      searchButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_RoomHeader_button mx_RoomHeader_searchButton",
        onClick: this.props.onSearchClick,
        title: (0, _languageHandler._t)("Search")
      });
    }

    let shareRoomButton;

    if (this.props.inRoom) {
      shareRoomButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_RoomHeader_button mx_RoomHeader_shareButton",
        onClick: this.onShareRoomClick,
        title: (0, _languageHandler._t)('Share room')
      });
    }

    let manageIntegsButton;

    if (this.props.room && this.props.room.roomId && this.props.inRoom) {
      manageIntegsButton = /*#__PURE__*/_react.default.createElement(_ManageIntegsButton.default, {
        room: this.props.room
      });
    }

    const rightRow = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_buttons"
    }, settingsButton, pinnedEventsButton, shareRoomButton, manageIntegsButton, forgetButton, searchButton);

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader light-panel"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_wrapper",
      "aria-owns": "mx_RightPanel"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_avatar"
    }, roomAvatar, e2eIcon), privateIcon, name, topicElement, cancelButton, rightRow, /*#__PURE__*/_react.default.createElement(_RoomHeaderButtons.default, null)));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21IZWFkZXIuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJyb29tIiwiUHJvcFR5cGVzIiwib2JqZWN0Iiwib29iRGF0YSIsImluUm9vbSIsImJvb2wiLCJvblNldHRpbmdzQ2xpY2siLCJmdW5jIiwib25QaW5uZWRDbGljayIsIm9uU2VhcmNoQ2xpY2siLCJvbkxlYXZlQ2xpY2siLCJvbkNhbmNlbENsaWNrIiwiZTJlU3RhdHVzIiwic3RyaW5nIiwiZ2V0RGVmYXVsdFByb3BzIiwiZWRpdGluZyIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJfdG9waWMiLCJjb21wb25lbnREaWRNb3VudCIsImNsaSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm9uIiwiX29uUm9vbVN0YXRlRXZlbnRzIiwiX29uUm9vbUFjY291bnREYXRhIiwicHJvcHMiLCJfb25Sb29tTmFtZUNoYW5nZSIsImNvbXBvbmVudERpZFVwZGF0ZSIsImN1cnJlbnQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiZXZlbnQiLCJzdGF0ZSIsImdldFJvb21JZCIsInJvb21JZCIsIl9yYXRlTGltaXRlZFVwZGF0ZSIsImdldFR5cGUiLCJSYXRlTGltaXRlZEZ1bmMiLCJmb3JjZVVwZGF0ZSIsIm9uU2hhcmVSb29tQ2xpY2siLCJldiIsIlNoYXJlRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGFyZ2V0IiwiX2hhc1VucmVhZFBpbnMiLCJjdXJyZW50UGluRXZlbnQiLCJjdXJyZW50U3RhdGUiLCJnZXRTdGF0ZUV2ZW50cyIsImdldENvbnRlbnQiLCJwaW5uZWQiLCJsZW5ndGgiLCJyZWFkUGluc0V2ZW50IiwiZ2V0QWNjb3VudERhdGEiLCJyZWFkU3RhdGVFdmVudHMiLCJldmVudF9pZHMiLCJpbmNsdWRlcyIsImdldElkIiwiX2hhc1BpbnMiLCJyZW5kZXIiLCJSb29tQXZhdGFyIiwic2VhcmNoU3RhdHVzIiwiY2FuY2VsQnV0dG9uIiwic2V0dGluZ3NCdXR0b24iLCJwaW5uZWRFdmVudHNCdXR0b24iLCJlMmVJY29uIiwidW5kZWZpbmVkIiwiZG1Vc2VySWQiLCJETVJvb21NYXAiLCJzaGFyZWQiLCJnZXRVc2VySWRGb3JSb29tSWQiLCJqb2luUnVsZXMiLCJqb2luUnVsZSIsImpvaW5fcnVsZSIsInByaXZhdGVJY29uIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwic2VhcmNoSW5mbyIsInNlYXJjaENvdW50IiwiY291bnQiLCJzZXR0aW5nc0hpbnQiLCJtZW1iZXJzIiwiZ2V0Sm9pbmVkTWVtYmVycyIsInVzZXJJZCIsImNyZWRlbnRpYWxzIiwibmFtZUV2ZW50IiwibmFtZSIsInJvb21OYW1lIiwidGV4dENsYXNzZXMiLCJteF9Sb29tSGVhZGVyX3NldHRpbmdzSGludCIsInRvcGljIiwidG9waWNFbGVtZW50IiwiYXZhdGFyU2l6ZSIsInJvb21BdmF0YXIiLCJpc0ZlYXR1cmVFbmFibGVkIiwicGluc0luZGljYXRvciIsImZvcmdldEJ1dHRvbiIsIm9uRm9yZ2V0Q2xpY2siLCJzZWFyY2hCdXR0b24iLCJzaGFyZVJvb21CdXR0b24iLCJtYW5hZ2VJbnRlZ3NCdXR0b24iLCJyaWdodFJvdyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBbkNBOzs7Ozs7Ozs7Ozs7Ozs7O2VBcUNlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLFlBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxJQUFJLEVBQUVDLG1CQUFVQyxNQURUO0FBRVBDLElBQUFBLE9BQU8sRUFBRUYs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WSxJQUhOLEVBSU1LLFlBSk4sRUFLTTdCLFlBTE4sRUFNTXVDLFFBTk4sZUFPSSw2QkFBQywwQkFBRCxPQVBKLENBREosQ0FESjtBQWFIO0FBblMyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCBSYXRlTGltaXRlZEZ1bmMgZnJvbSAnLi4vLi4vLi4vcmF0ZWxpbWl0ZWRmdW5jJztcblxuaW1wb3J0IHsgbGlua2lmeUVsZW1lbnQgfSBmcm9tICcuLi8uLi8uLi9IdG1sVXRpbHMnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgTWFuYWdlSW50ZWdzQnV0dG9uIGZyb20gJy4uL2VsZW1lbnRzL01hbmFnZUludGVnc0J1dHRvbic7XG5pbXBvcnQge0NhbmNlbEJ1dHRvbn0gZnJvbSAnLi9TaW1wbGVSb29tSGVhZGVyJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgUm9vbUhlYWRlckJ1dHRvbnMgZnJvbSAnLi4vcmlnaHRfcGFuZWwvUm9vbUhlYWRlckJ1dHRvbnMnO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi8uLi8uLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0IEUyRUljb24gZnJvbSAnLi9FMkVJY29uJztcbmltcG9ydCBJbnZpdGVPbmx5SWNvbiBmcm9tICcuL0ludml0ZU9ubHlJY29uJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSb29tSGVhZGVyJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICBvb2JEYXRhOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICBpblJvb206IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBvblNldHRpbmdzQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvblBpbm5lZENsaWNrOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgb25TZWFyY2hDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uTGVhdmVDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uQ2FuY2VsQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBlMmVTdGF0dXM6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlZGl0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGluUm9vbTogZmFsc2UsXG4gICAgICAgICAgICBvbkNhbmNlbENsaWNrOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdG9waWMgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNsaS5vbihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5fb25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICBjbGkub24oXCJSb29tLmFjY291bnREYXRhXCIsIHRoaXMuX29uUm9vbUFjY291bnREYXRhKTtcblxuICAgICAgICAvLyBXaGVuIGEgcm9vbSBuYW1lIG9jY3VycywgUm9vbVN0YXRlLmV2ZW50cyBpcyBmaXJlZCAqYmVmb3JlKlxuICAgICAgICAvLyByb29tLm5hbWUgaXMgdXBkYXRlZC4gU28gd2UgaGF2ZSB0byBsaXN0ZW4gdG8gUm9vbS5uYW1lIGFzIHdlbGwgYXNcbiAgICAgICAgLy8gUm9vbVN0YXRlLmV2ZW50cy5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMucm9vbSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tLm9uKFwiUm9vbS5uYW1lXCIsIHRoaXMuX29uUm9vbU5hbWVDaGFuZ2UpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl90b3BpYy5jdXJyZW50KSB7XG4gICAgICAgICAgICBsaW5raWZ5RWxlbWVudCh0aGlzLl90b3BpYy5jdXJyZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJvb20pIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMucm9vbS5yZW1vdmVMaXN0ZW5lcihcIlJvb20ubmFtZVwiLCB0aGlzLl9vblJvb21OYW1lQ2hhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGkpIHtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5fb25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5hY2NvdW50RGF0YVwiLCB0aGlzLl9vblJvb21BY2NvdW50RGF0YSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uUm9vbVN0YXRlRXZlbnRzOiBmdW5jdGlvbihldmVudCwgc3RhdGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLnJvb20gfHwgZXZlbnQuZ2V0Um9vbUlkKCkgIT09IHRoaXMucHJvcHMucm9vbS5yb29tSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlZGlzcGxheSB0aGUgcm9vbSBuYW1lLCB0b3BpYywgZXRjLlxuICAgICAgICB0aGlzLl9yYXRlTGltaXRlZFVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfb25Sb29tQWNjb3VudERhdGE6IGZ1bmN0aW9uKGV2ZW50LCByb29tKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5yb29tIHx8IHJvb20ucm9vbUlkICE9PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSByZXR1cm47XG4gICAgICAgIGlmIChldmVudC5nZXRUeXBlKCkgIT09IFwiaW0udmVjdG9yLnJvb20ucmVhZF9waW5zXCIpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9yYXRlTGltaXRlZFVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfcmF0ZUxpbWl0ZWRVcGRhdGU6IG5ldyBSYXRlTGltaXRlZEZ1bmMoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGJhYmVsL25vLWludmFsaWQtdGhpcyAqL1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSwgNTAwKSxcblxuICAgIF9vblJvb21OYW1lQ2hhbmdlOiBmdW5jdGlvbihyb29tKSB7XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25TaGFyZVJvb21DbGljazogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgY29uc3QgU2hhcmVEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5TaGFyZURpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnc2hhcmUgcm9vbSBkaWFsb2cnLCAnJywgU2hhcmVEaWFsb2csIHtcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy5wcm9wcy5yb29tLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2hhc1VucmVhZFBpbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50UGluRXZlbnQgPSB0aGlzLnByb3BzLnJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLnBpbm5lZF9ldmVudHNcIiwgJycpO1xuICAgICAgICBpZiAoIWN1cnJlbnRQaW5FdmVudCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoY3VycmVudFBpbkV2ZW50LmdldENvbnRlbnQoKS5waW5uZWQgJiYgY3VycmVudFBpbkV2ZW50LmdldENvbnRlbnQoKS5waW5uZWQubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gcGlucyA9PSBub3RoaW5nIHRvIHJlYWRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlYWRQaW5zRXZlbnQgPSB0aGlzLnByb3BzLnJvb20uZ2V0QWNjb3VudERhdGEoXCJpbS52ZWN0b3Iucm9vbS5yZWFkX3BpbnNcIik7XG4gICAgICAgIGlmIChyZWFkUGluc0V2ZW50ICYmIHJlYWRQaW5zRXZlbnQuZ2V0Q29udGVudCgpKSB7XG4gICAgICAgICAgICBjb25zdCByZWFkU3RhdGVFdmVudHMgPSByZWFkUGluc0V2ZW50LmdldENvbnRlbnQoKS5ldmVudF9pZHMgfHwgW107XG4gICAgICAgICAgICBpZiAocmVhZFN0YXRlRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFyZWFkU3RhdGVFdmVudHMuaW5jbHVkZXMoY3VycmVudFBpbkV2ZW50LmdldElkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlcmUncyBwaW5zLCBhbmQgd2UgaGF2ZW4ndCByZWFkIGFueSBvZiB0aGVtXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBfaGFzUGluczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRQaW5FdmVudCA9IHRoaXMucHJvcHMucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucGlubmVkX2V2ZW50c1wiLCAnJyk7XG4gICAgICAgIGlmICghY3VycmVudFBpbkV2ZW50KSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuICEoY3VycmVudFBpbkV2ZW50LmdldENvbnRlbnQoKS5waW5uZWQgJiYgY3VycmVudFBpbkV2ZW50LmdldENvbnRlbnQoKS5waW5uZWQubGVuZ3RoIDw9IDApO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBSb29tQXZhdGFyID0gc2RrLmdldENvbXBvbmVudChcImF2YXRhcnMuUm9vbUF2YXRhclwiKTtcblxuICAgICAgICBsZXQgc2VhcmNoU3RhdHVzID0gbnVsbDtcbiAgICAgICAgbGV0IGNhbmNlbEJ1dHRvbiA9IG51bGw7XG4gICAgICAgIGxldCBzZXR0aW5nc0J1dHRvbiA9IG51bGw7XG4gICAgICAgIGxldCBwaW5uZWRFdmVudHNCdXR0b24gPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IGUyZUljb24gPSB0aGlzLnByb3BzLmUyZVN0YXR1cyA/XG4gICAgICAgICAgICA8RTJFSWNvbiBzdGF0dXM9e3RoaXMucHJvcHMuZTJlU3RhdHVzfSAvPiA6XG4gICAgICAgICAgICB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgZG1Vc2VySWQgPSBETVJvb21NYXAuc2hhcmVkKCkuZ2V0VXNlcklkRm9yUm9vbUlkKHRoaXMucHJvcHMucm9vbS5yb29tSWQpO1xuICAgICAgICBjb25zdCBqb2luUnVsZXMgPSB0aGlzLnByb3BzLnJvb20gJiYgdGhpcy5wcm9wcy5yb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5qb2luX3J1bGVzXCIsIFwiXCIpO1xuICAgICAgICBjb25zdCBqb2luUnVsZSA9IGpvaW5SdWxlcyAmJiBqb2luUnVsZXMuZ2V0Q29udGVudCgpLmpvaW5fcnVsZTtcbiAgICAgICAgbGV0IHByaXZhdGVJY29uO1xuICAgICAgICAvLyBEb24ndCBzaG93IGFuIGludml0ZS1vbmx5IGljb24gZm9yIERNcy4gVXNlcnMga25vdyB0aGV5J3JlIGludml0ZS1vbmx5LlxuICAgICAgICBpZiAoIWRtVXNlcklkICYmIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpIHtcbiAgICAgICAgICAgIGlmIChqb2luUnVsZSA9PSBcImludml0ZVwiKSB7XG4gICAgICAgICAgICAgICAgcHJpdmF0ZUljb24gPSA8SW52aXRlT25seUljb24gLz47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkNhbmNlbENsaWNrKSB7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24gPSA8Q2FuY2VsQnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25DYW5jZWxDbGlja30gLz47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkb24ndCBkaXNwbGF5IHRoZSBzZWFyY2ggY291bnQgdW50aWwgdGhlIHNlYXJjaCBjb21wbGV0ZXMgYW5kXG4gICAgICAgIC8vIGdpdmVzIHVzIGEgdmFsaWQgKHBvc3NpYmx5IHplcm8pIHNlYXJjaENvdW50LlxuICAgICAgICBpZiAodGhpcy5wcm9wcy5zZWFyY2hJbmZvICYmXG4gICAgICAgICAgICB0aGlzLnByb3BzLnNlYXJjaEluZm8uc2VhcmNoQ291bnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5zZWFyY2hJbmZvLnNlYXJjaENvdW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZWFyY2hTdGF0dXMgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfc2VhcmNoU3RhdHVzXCI+Jm5ic3A7XG4gICAgICAgICAgICAgICAgeyBfdChcIih+JShjb3VudClzIHJlc3VsdHMpXCIsIHsgY291bnQ6IHRoaXMucHJvcHMuc2VhcmNoSW5mby5zZWFyY2hDb3VudCB9KSB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBYWFg6IHRoaXMgaXMgYSBiaXQgaW5lZmZpY2llbnQgLSB3ZSBjb3VsZCBqdXN0IGNvbXBhcmUgcm9vbS5uYW1lIGZvciAnRW1wdHkgcm9vbScuLi5cbiAgICAgICAgbGV0IHNldHRpbmdzSGludCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBtZW1iZXJzID0gdGhpcy5wcm9wcy5yb29tID8gdGhpcy5wcm9wcy5yb29tLmdldEpvaW5lZE1lbWJlcnMoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG1lbWJlcnMpIHtcbiAgICAgICAgICAgIGlmIChtZW1iZXJzLmxlbmd0aCA9PT0gMSAmJiBtZW1iZXJzWzBdLnVzZXJJZCA9PT0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWRlbnRpYWxzLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVFdmVudCA9IHRoaXMucHJvcHMucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5uYW1lJywgJycpO1xuICAgICAgICAgICAgICAgIGlmICghbmFtZUV2ZW50IHx8ICFuYW1lRXZlbnQuZ2V0Q29udGVudCgpLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NIaW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vbU5hbWUgPSBfdChcIkpvaW4gUm9vbVwiKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub29iRGF0YSAmJiB0aGlzLnByb3BzLm9vYkRhdGEubmFtZSkge1xuICAgICAgICAgICAgcm9vbU5hbWUgPSB0aGlzLnByb3BzLm9vYkRhdGEubmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnJvb20pIHtcbiAgICAgICAgICAgIHJvb21OYW1lID0gdGhpcy5wcm9wcy5yb29tLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZXh0Q2xhc3NlcyA9IGNsYXNzTmFtZXMoJ214X1Jvb21IZWFkZXJfbmFtZXRleHQnLCB7IG14X1Jvb21IZWFkZXJfc2V0dGluZ3NIaW50OiBzZXR0aW5nc0hpbnQgfSk7XG4gICAgICAgIGNvbnN0IG5hbWUgPVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tSGVhZGVyX25hbWVcIiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uU2V0dGluZ3NDbGlja30+XG4gICAgICAgICAgICAgICAgPGRpdiBkaXI9XCJhdXRvXCIgY2xhc3NOYW1lPXt0ZXh0Q2xhc3Nlc30gdGl0bGU9e3Jvb21OYW1lfT57IHJvb21OYW1lIH08L2Rpdj5cbiAgICAgICAgICAgICAgICB7IHNlYXJjaFN0YXR1cyB9XG4gICAgICAgICAgICA8L2Rpdj47XG5cbiAgICAgICAgbGV0IHRvcGljO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5yb29tKSB7XG4gICAgICAgICAgICBjb25zdCBldiA9IHRoaXMucHJvcHMucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS50b3BpYycsICcnKTtcbiAgICAgICAgICAgIGlmIChldikge1xuICAgICAgICAgICAgICAgIHRvcGljID0gZXYuZ2V0Q29udGVudCgpLnRvcGljO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRvcGljRWxlbWVudCA9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfdG9waWNcIiByZWY9e3RoaXMuX3RvcGljfSB0aXRsZT17dG9waWN9IGRpcj1cImF1dG9cIj57IHRvcGljIH08L2Rpdj47XG4gICAgICAgIGNvbnN0IGF2YXRhclNpemUgPSAyODtcbiAgICAgICAgbGV0IHJvb21BdmF0YXI7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJvb20pIHtcbiAgICAgICAgICAgIHJvb21BdmF0YXIgPSAoPFJvb21BdmF0YXJcbiAgICAgICAgICAgICAgICByb29tPXt0aGlzLnByb3BzLnJvb219XG4gICAgICAgICAgICAgICAgd2lkdGg9e2F2YXRhclNpemV9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXthdmF0YXJTaXplfVxuICAgICAgICAgICAgICAgIG9vYkRhdGE9e3RoaXMucHJvcHMub29iRGF0YX1cbiAgICAgICAgICAgICAgICB2aWV3QXZhdGFyT25DbGljaz17dHJ1ZX0gLz4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25TZXR0aW5nc0NsaWNrKSB7XG4gICAgICAgICAgICBzZXR0aW5nc0J1dHRvbiA9XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9idXR0b24gbXhfUm9vbUhlYWRlcl9zZXR0aW5nc0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMub25TZXR0aW5nc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJTZXR0aW5nc1wiKX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uUGlubmVkQ2xpY2sgJiYgU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKCdmZWF0dXJlX3Bpbm5pbmcnKSkge1xuICAgICAgICAgICAgbGV0IHBpbnNJbmRpY2F0b3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2hhc1VucmVhZFBpbnMoKSkge1xuICAgICAgICAgICAgICAgIHBpbnNJbmRpY2F0b3IgPSAoPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tSGVhZGVyX3BpbnNJbmRpY2F0b3IgbXhfUm9vbUhlYWRlcl9waW5zSW5kaWNhdG9yVW5yZWFkXCIgLz4pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9oYXNQaW5zKCkpIHtcbiAgICAgICAgICAgICAgICBwaW5zSW5kaWNhdG9yID0gKDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9waW5zSW5kaWNhdG9yXCIgLz4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwaW5uZWRFdmVudHNCdXR0b24gPVxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfYnV0dG9uIG14X1Jvb21IZWFkZXJfcGlubmVkQnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLm9uUGlubmVkQ2xpY2t9IHRpdGxlPXtfdChcIlBpbm5lZCBNZXNzYWdlc1wiKX0+XG4gICAgICAgICAgICAgICAgICAgIHsgcGluc0luZGljYXRvciB9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICAgICAgfVxuXG4vLyAgICAgICAgdmFyIGxlYXZlX2J1dHRvbjtcbi8vICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkxlYXZlQ2xpY2spIHtcbi8vICAgICAgICAgICAgbGVhdmVfYnV0dG9uID1cbi8vICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9idXR0b25cIiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uTGVhdmVDbGlja30gdGl0bGU9XCJMZWF2ZSByb29tXCI+XG4vLyAgICAgICAgICAgICAgICAgICAgPFRpbnRhYmxlU3ZnIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvbGVhdmUuc3ZnXCIpfSB3aWR0aD1cIjI2XCIgaGVpZ2h0PVwiMjBcIi8+XG4vLyAgICAgICAgICAgICAgICA8L2Rpdj47XG4vLyAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3JnZXRCdXR0b247XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRm9yZ2V0Q2xpY2spIHtcbiAgICAgICAgICAgIGZvcmdldEJ1dHRvbiA9XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9idXR0b24gbXhfUm9vbUhlYWRlcl9mb3JnZXRCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLm9uRm9yZ2V0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkZvcmdldCByb29tXCIpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNlYXJjaEJ1dHRvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25TZWFyY2hDbGljayAmJiB0aGlzLnByb3BzLmluUm9vbSkge1xuICAgICAgICAgICAgc2VhcmNoQnV0dG9uID1cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Sb29tSGVhZGVyX2J1dHRvbiBteF9Sb29tSGVhZGVyX3NlYXJjaEJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMub25TZWFyY2hDbGlja31cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KFwiU2VhcmNoXCIpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNoYXJlUm9vbUJ1dHRvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaW5Sb29tKSB7XG4gICAgICAgICAgICBzaGFyZVJvb21CdXR0b24gPVxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfYnV0dG9uIG14X1Jvb21IZWFkZXJfc2hhcmVCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU2hhcmVSb29tQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnU2hhcmUgcm9vbScpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hbmFnZUludGVnc0J1dHRvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucm9vbSAmJiB0aGlzLnByb3BzLnJvb20ucm9vbUlkICYmIHRoaXMucHJvcHMuaW5Sb29tKSB7XG4gICAgICAgICAgICBtYW5hZ2VJbnRlZ3NCdXR0b24gPSA8TWFuYWdlSW50ZWdzQnV0dG9uXG4gICAgICAgICAgICAgICAgcm9vbT17dGhpcy5wcm9wcy5yb29tfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByaWdodFJvdyA9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIHsgc2V0dGluZ3NCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgcGlubmVkRXZlbnRzQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHNoYXJlUm9vbUJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgeyBtYW5hZ2VJbnRlZ3NCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgZm9yZ2V0QnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHNlYXJjaEJ1dHRvbiB9XG4gICAgICAgICAgICA8L2Rpdj47XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlciBsaWdodC1wYW5lbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl93cmFwcGVyXCIgYXJpYS1vd25zPVwibXhfUmlnaHRQYW5lbFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21IZWFkZXJfYXZhdGFyXCI+eyByb29tQXZhdGFyIH17IGUyZUljb24gfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7IHByaXZhdGVJY29uIH1cbiAgICAgICAgICAgICAgICAgICAgeyBuYW1lIH1cbiAgICAgICAgICAgICAgICAgICAgeyB0b3BpY0VsZW1lbnQgfVxuICAgICAgICAgICAgICAgICAgICB7IGNhbmNlbEJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgcmlnaHRSb3cgfVxuICAgICAgICAgICAgICAgICAgICA8Um9vbUhlYWRlckJ1dHRvbnMgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==