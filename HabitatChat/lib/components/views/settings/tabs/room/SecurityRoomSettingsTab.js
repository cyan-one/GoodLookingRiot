"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../../languageHandler");

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../../.."));

var _LabelledToggleSwitch = _interopRequireDefault(require("../../../elements/LabelledToggleSwitch"));

var _SettingsStore = require("../../../../../settings/SettingsStore");

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

var _QuestionDialog = _interopRequireDefault(require("../../../dialogs/QuestionDialog"));

/*
Copyright 2019 New Vector Ltd

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
class SecurityRoomSettingsTab extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onStateEvent", e => {
      const refreshWhenTypes = ['m.room.join_rules', 'm.room.guest_access', 'm.room.history_visibility', 'm.room.encryption'];
      if (refreshWhenTypes.includes(e.getType())) this.forceUpdate();
    });
    (0, _defineProperty2.default)(this, "_onEncryptionChange", e => {
      _Modal.default.createTrackedDialog('Enable encryption', '', _QuestionDialog.default, {
        title: (0, _languageHandler._t)('Enable encryption?'),
        description: (0, _languageHandler._t)("Once enabled, encryption for a room cannot be disabled. Messages sent in an encrypted " + "room cannot be seen by the server, only by the participants of the room. Enabling encryption " + "may prevent many bots and bridges from working correctly. <a>Learn more about encryption.</a>", {}, {
          'a': sub => {
            return /*#__PURE__*/_react.default.createElement("a", {
              rel: "noreferrer noopener",
              target: "_blank",
              href: "https://about.riot.im/help#end-to-end-encryption"
            }, sub);
          }
        }),
        onFinished: confirm => {
          if (!confirm) {
            this.setState({
              encrypted: false
            });
            return;
          }

          const beforeEncrypted = this.state.encrypted;
          this.setState({
            encrypted: true
          });

          _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(this.props.roomId, "m.room.encryption", {
            algorithm: "m.megolm.v1.aes-sha2"
          }).catch(e => {
            console.error(e);
            this.setState({
              encrypted: beforeEncrypted
            });
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "_fixGuestAccess", e => {
      e.preventDefault();
      e.stopPropagation();
      const joinRule = "invite";
      const guestAccess = "can_join";
      const beforeJoinRule = this.state.joinRule;
      const beforeGuestAccess = this.state.guestAccess;
      this.setState({
        joinRule,
        guestAccess
      });

      const client = _MatrixClientPeg.MatrixClientPeg.get();

      client.sendStateEvent(this.props.roomId, "m.room.join_rules", {
        join_rule: joinRule
      }, "").catch(e => {
        console.error(e);
        this.setState({
          joinRule: beforeJoinRule
        });
      });
      client.sendStateEvent(this.props.roomId, "m.room.guest_access", {
        guest_access: guestAccess
      }, "").catch(e => {
        console.error(e);
        this.setState({
          guestAccess: beforeGuestAccess
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onRoomAccessRadioToggle", ev => {
      //                         join_rule
      //                      INVITE  |  PUBLIC
      //        ----------------------+----------------
      // guest  CAN_JOIN   | inv_only | pub_with_guest
      // access ----------------------+----------------
      //        FORBIDDEN  | inv_only | pub_no_guest
      //        ----------------------+----------------
      // we always set guests can_join here as it makes no sense to have
      // an invite-only room that guests can't join.  If you explicitly
      // invite them, you clearly want them to join, whether they're a
      // guest or not.  In practice, guest_access should probably have
      // been implemented as part of the join_rules enum.
      let joinRule = "invite";
      let guestAccess = "can_join";

      switch (ev.target.value) {
        case "invite_only":
          // no change - use defaults above
          break;

        case "public_no_guests":
          joinRule = "public";
          guestAccess = "forbidden";
          break;

        case "public_with_guests":
          joinRule = "public";
          guestAccess = "can_join";
          break;
      }

      const beforeJoinRule = this.state.joinRule;
      const beforeGuestAccess = this.state.guestAccess;
      this.setState({
        joinRule,
        guestAccess
      });

      const client = _MatrixClientPeg.MatrixClientPeg.get();

      client.sendStateEvent(this.props.roomId, "m.room.join_rules", {
        join_rule: joinRule
      }, "").catch(e => {
        console.error(e);
        this.setState({
          joinRule: beforeJoinRule
        });
      });
      client.sendStateEvent(this.props.roomId, "m.room.guest_access", {
        guest_access: guestAccess
      }, "").catch(e => {
        console.error(e);
        this.setState({
          guestAccess: beforeGuestAccess
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onHistoryRadioToggle", ev => {
      const beforeHistory = this.state.history;
      this.setState({
        history: ev.target.value
      });

      _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(this.props.roomId, "m.room.history_visibility", {
        history_visibility: ev.target.value
      }, "").catch(e => {
        console.error(e);
        this.setState({
          history: beforeHistory
        });
      });
    });
    (0, _defineProperty2.default)(this, "_updateBlacklistDevicesFlag", checked => {
      _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.roomId).setBlacklistUnverifiedDevices(checked);
    });
    this.state = {
      joinRule: "invite",
      guestAccess: "can_join",
      history: "shared",
      hasAliases: false,
      encrypted: false
    };
  } // TODO: [REACT-WARNING] Move this to constructor


  async UNSAFE_componentWillMount()
  /*: void*/
  {
    // eslint-disable-line camelcase
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this._onStateEvent);

    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.roomId);

    const state = room.currentState;

    const joinRule = this._pullContentPropertyFromEvent(state.getStateEvents("m.room.join_rules", ""), 'join_rule', 'invite');

    const guestAccess = this._pullContentPropertyFromEvent(state.getStateEvents("m.room.guest_access", ""), 'guest_access', 'forbidden');

    const history = this._pullContentPropertyFromEvent(state.getStateEvents("m.room.history_visibility", ""), 'history_visibility', 'shared');

    const encrypted = _MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(this.props.roomId);

    this.setState({
      joinRule,
      guestAccess,
      history,
      encrypted
    });
    const hasAliases = await this._hasAliases();
    this.setState({
      hasAliases
    });
  }

  _pullContentPropertyFromEvent(event, key, defaultValue) {
    if (!event || !event.getContent()) return defaultValue;
    return event.getContent()[key] || defaultValue;
  }

  componentWillUnmount()
  /*: void*/
  {
    _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.events", this._onStateEvent);
  }

  async _hasAliases() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (await cli.doesServerSupportUnstableFeature("org.matrix.msc2432")) {
      const response = await cli.unstableGetLocalAliases(this.props.roomId);
      const localAliases = response.aliases;
      return Array.isArray(localAliases) && localAliases.length !== 0;
    } else {
      const room = cli.getRoom(this.props.roomId);
      const aliasEvents = room.currentState.getStateEvents("m.room.aliases") || [];
      const hasAliases = !!aliasEvents.find(ev => (ev.getContent().aliases || []).length > 0);
      return hasAliases;
    }
  }

  _renderRoomAccess() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const room = client.getRoom(this.props.roomId);
    const joinRule = this.state.joinRule;
    const guestAccess = this.state.guestAccess;
    const canChangeAccess = room.currentState.mayClientSendStateEvent("m.room.join_rules", client) && room.currentState.mayClientSendStateEvent("m.room.guest_access", client);
    let guestWarning = null;

    if (joinRule !== 'public' && guestAccess === 'forbidden') {
      guestWarning = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SecurityRoomSettingsTab_warning"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../../../res/img/warning.svg"),
        width: 15,
        height: 15
      }), /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Guests cannot join this room even if explicitly invited."), "\xA0", /*#__PURE__*/_react.default.createElement("a", {
        href: "",
        onClick: this._fixGuestAccess
      }, (0, _languageHandler._t)("Click here to fix"))));
    }

    let aliasWarning = null;

    if (joinRule === 'public' && !this.state.hasAliases) {
      aliasWarning = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SecurityRoomSettingsTab_warning"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../../../res/img/warning.svg"),
        width: 15,
        height: 15
      }), /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("To link to this room, please add an alias.")));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, guestWarning, aliasWarning, /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "roomVis",
      value: "invite_only",
      disabled: !canChangeAccess,
      onChange: this._onRoomAccessRadioToggle,
      checked: joinRule !== "public"
    }), (0, _languageHandler._t)('Only people who have been invited')), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "roomVis",
      value: "public_no_guests",
      disabled: !canChangeAccess,
      onChange: this._onRoomAccessRadioToggle,
      checked: joinRule === "public" && guestAccess !== "can_join"
    }), (0, _languageHandler._t)('Anyone who knows the room\'s link, apart from guests')), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "roomVis",
      value: "public_with_guests",
      disabled: !canChangeAccess,
      onChange: this._onRoomAccessRadioToggle,
      checked: joinRule === "public" && guestAccess === "can_join"
    }), (0, _languageHandler._t)("Anyone who knows the room's link, including guests")));
  }

  _renderHistory() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const history = this.state.history;
    const state = client.getRoom(this.props.roomId).currentState;
    const canChangeHistory = state.mayClientSendStateEvent('m.room.history_visibility', client);
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('Changes to who can read history will only apply to future messages in this room. ' + 'The visibility of existing history will be unchanged.')), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "historyVis",
      value: "world_readable",
      disabled: !canChangeHistory,
      checked: history === "world_readable",
      onChange: this._onHistoryRadioToggle
    }), (0, _languageHandler._t)("Anyone")), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "historyVis",
      value: "shared",
      disabled: !canChangeHistory,
      checked: history === "shared",
      onChange: this._onHistoryRadioToggle
    }), (0, _languageHandler._t)('Members only (since the point in time of selecting this option)')), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "historyVis",
      value: "invited",
      disabled: !canChangeHistory,
      checked: history === "invited",
      onChange: this._onHistoryRadioToggle
    }), (0, _languageHandler._t)('Members only (since they were invited)')), /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      name: "historyVis",
      value: "joined",
      disabled: !canChangeHistory,
      checked: history === "joined",
      onChange: this._onHistoryRadioToggle
    }), (0, _languageHandler._t)('Members only (since they joined)')));
  }

  render() {
    const SettingsFlag = sdk.getComponent("elements.SettingsFlag");

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const room = client.getRoom(this.props.roomId);
    const isEncrypted = this.state.encrypted;
    const hasEncryptionPermission = room.currentState.mayClientSendStateEvent("m.room.encryption", client);
    const canEnableEncryption = !isEncrypted && hasEncryptionPermission;
    let encryptionSettings = null;

    if (isEncrypted) {
      encryptionSettings = /*#__PURE__*/_react.default.createElement(SettingsFlag, {
        name: "blacklistUnverifiedDevices",
        level: _SettingsStore.SettingLevel.ROOM_DEVICE,
        onChange: this._updateBlacklistDevicesFlag,
        roomId: this.props.roomId
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab mx_SecurityRoomSettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Security & Privacy")), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Encryption")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SecurityRoomSettingsTab_encryptionSection"
    }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Once enabled, encryption cannot be disabled."))), /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: isEncrypted,
      onChange: this._onEncryptionChange,
      label: (0, _languageHandler._t)("Encrypted"),
      disabled: !canEnableEncryption
    })), encryptionSettings), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Who can access this room?")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
    }, this._renderRoomAccess()), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Who can read history?")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
    }, this._renderHistory()));
  }

}

exports.default = SecurityRoomSettingsTab;
(0, _defineProperty2.default)(SecurityRoomSettingsTab, "propTypes", {
  roomId: _propTypes.default.string.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvcm9vbS9TZWN1cml0eVJvb21TZXR0aW5nc1RhYi5qcyJdLCJuYW1lcyI6WyJTZWN1cml0eVJvb21TZXR0aW5nc1RhYiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJlIiwicmVmcmVzaFdoZW5UeXBlcyIsImluY2x1ZGVzIiwiZ2V0VHlwZSIsImZvcmNlVXBkYXRlIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwiUXVlc3Rpb25EaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwic3ViIiwib25GaW5pc2hlZCIsImNvbmZpcm0iLCJzZXRTdGF0ZSIsImVuY3J5cHRlZCIsImJlZm9yZUVuY3J5cHRlZCIsInN0YXRlIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwic2VuZFN0YXRlRXZlbnQiLCJwcm9wcyIsInJvb21JZCIsImFsZ29yaXRobSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJqb2luUnVsZSIsImd1ZXN0QWNjZXNzIiwiYmVmb3JlSm9pblJ1bGUiLCJiZWZvcmVHdWVzdEFjY2VzcyIsImNsaWVudCIsImpvaW5fcnVsZSIsImd1ZXN0X2FjY2VzcyIsImV2IiwidGFyZ2V0IiwidmFsdWUiLCJiZWZvcmVIaXN0b3J5IiwiaGlzdG9yeSIsImhpc3RvcnlfdmlzaWJpbGl0eSIsImNoZWNrZWQiLCJnZXRSb29tIiwic2V0QmxhY2tsaXN0VW52ZXJpZmllZERldmljZXMiLCJoYXNBbGlhc2VzIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIm9uIiwiX29uU3RhdGVFdmVudCIsInJvb20iLCJjdXJyZW50U3RhdGUiLCJfcHVsbENvbnRlbnRQcm9wZXJ0eUZyb21FdmVudCIsImdldFN0YXRlRXZlbnRzIiwiaXNSb29tRW5jcnlwdGVkIiwiX2hhc0FsaWFzZXMiLCJldmVudCIsImtleSIsImRlZmF1bHRWYWx1ZSIsImdldENvbnRlbnQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiY2xpIiwiZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUiLCJyZXNwb25zZSIsInVuc3RhYmxlR2V0TG9jYWxBbGlhc2VzIiwibG9jYWxBbGlhc2VzIiwiYWxpYXNlcyIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsImFsaWFzRXZlbnRzIiwiZmluZCIsIl9yZW5kZXJSb29tQWNjZXNzIiwiY2FuQ2hhbmdlQWNjZXNzIiwibWF5Q2xpZW50U2VuZFN0YXRlRXZlbnQiLCJndWVzdFdhcm5pbmciLCJyZXF1aXJlIiwiX2ZpeEd1ZXN0QWNjZXNzIiwiYWxpYXNXYXJuaW5nIiwiX29uUm9vbUFjY2Vzc1JhZGlvVG9nZ2xlIiwiX3JlbmRlckhpc3RvcnkiLCJjYW5DaGFuZ2VIaXN0b3J5IiwiX29uSGlzdG9yeVJhZGlvVG9nZ2xlIiwicmVuZGVyIiwiU2V0dGluZ3NGbGFnIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiaXNFbmNyeXB0ZWQiLCJoYXNFbmNyeXB0aW9uUGVybWlzc2lvbiIsImNhbkVuYWJsZUVuY3J5cHRpb24iLCJlbmNyeXB0aW9uU2V0dGluZ3MiLCJTZXR0aW5nTGV2ZWwiLCJST09NX0RFVklDRSIsIl91cGRhdGVCbGFja2xpc3REZXZpY2VzRmxhZyIsIl9vbkVuY3J5cHRpb25DaGFuZ2UiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBMEJlLE1BQU1BLHVCQUFOLFNBQXNDQyxlQUFNQyxTQUE1QyxDQUFzRDtBQUtqRUMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSx5REFpREdDLENBQUQsSUFBTztBQUNuQixZQUFNQyxnQkFBZ0Is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Q0FESjtBQTJCSDs7QUF6VmdFOzs7OEJBQWhEbkYsdUIsZUFDRTtBQUNmeUIsRUFBQUEsTUFBTSxFQUFFeUUsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRFYsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vLi4vLi5cIjtcbmltcG9ydCBMYWJlbGxlZFRvZ2dsZVN3aXRjaCBmcm9tIFwiLi4vLi4vLi4vZWxlbWVudHMvTGFiZWxsZWRUb2dnbGVTd2l0Y2hcIjtcbmltcG9ydCB7U2V0dGluZ0xldmVsfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9Nb2RhbFwiO1xuaW1wb3J0IFF1ZXN0aW9uRGlhbG9nIGZyb20gXCIuLi8uLi8uLi9kaWFsb2dzL1F1ZXN0aW9uRGlhbG9nXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlY3VyaXR5Um9vbVNldHRpbmdzVGFiIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICByb29tSWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGpvaW5SdWxlOiBcImludml0ZVwiLFxuICAgICAgICAgICAgZ3Vlc3RBY2Nlc3M6IFwiY2FuX2pvaW5cIixcbiAgICAgICAgICAgIGhpc3Rvcnk6IFwic2hhcmVkXCIsXG4gICAgICAgICAgICBoYXNBbGlhc2VzOiBmYWxzZSxcbiAgICAgICAgICAgIGVuY3J5cHRlZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIGFzeW5jIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQoKTogdm9pZCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5fb25TdGF0ZUV2ZW50KTtcblxuICAgICAgICBjb25zdCByb29tID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHJvb20uY3VycmVudFN0YXRlO1xuXG4gICAgICAgIGNvbnN0IGpvaW5SdWxlID0gdGhpcy5fcHVsbENvbnRlbnRQcm9wZXJ0eUZyb21FdmVudChcbiAgICAgICAgICAgIHN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLmpvaW5fcnVsZXNcIiwgXCJcIiksXG4gICAgICAgICAgICAnam9pbl9ydWxlJyxcbiAgICAgICAgICAgICdpbnZpdGUnLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBndWVzdEFjY2VzcyA9IHRoaXMuX3B1bGxDb250ZW50UHJvcGVydHlGcm9tRXZlbnQoXG4gICAgICAgICAgICBzdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5ndWVzdF9hY2Nlc3NcIiwgXCJcIiksXG4gICAgICAgICAgICAnZ3Vlc3RfYWNjZXNzJyxcbiAgICAgICAgICAgICdmb3JiaWRkZW4nLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBoaXN0b3J5ID0gdGhpcy5fcHVsbENvbnRlbnRQcm9wZXJ0eUZyb21FdmVudChcbiAgICAgICAgICAgIHN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLmhpc3RvcnlfdmlzaWJpbGl0eVwiLCBcIlwiKSxcbiAgICAgICAgICAgICdoaXN0b3J5X3Zpc2liaWxpdHknLFxuICAgICAgICAgICAgJ3NoYXJlZCcsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGVuY3J5cHRlZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc1Jvb21FbmNyeXB0ZWQodGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtqb2luUnVsZSwgZ3Vlc3RBY2Nlc3MsIGhpc3RvcnksIGVuY3J5cHRlZH0pO1xuICAgICAgICBjb25zdCBoYXNBbGlhc2VzID0gYXdhaXQgdGhpcy5faGFzQWxpYXNlcygpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtoYXNBbGlhc2VzfSk7XG4gICAgfVxuXG4gICAgX3B1bGxDb250ZW50UHJvcGVydHlGcm9tRXZlbnQoZXZlbnQsIGtleSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIGlmICghZXZlbnQgfHwgIWV2ZW50LmdldENvbnRlbnQoKSkgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgcmV0dXJuIGV2ZW50LmdldENvbnRlbnQoKVtrZXldIHx8IGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLl9vblN0YXRlRXZlbnQpO1xuICAgIH1cblxuICAgIF9vblN0YXRlRXZlbnQgPSAoZSkgPT4ge1xuICAgICAgICBjb25zdCByZWZyZXNoV2hlblR5cGVzID0gW1xuICAgICAgICAgICAgJ20ucm9vbS5qb2luX3J1bGVzJyxcbiAgICAgICAgICAgICdtLnJvb20uZ3Vlc3RfYWNjZXNzJyxcbiAgICAgICAgICAgICdtLnJvb20uaGlzdG9yeV92aXNpYmlsaXR5JyxcbiAgICAgICAgICAgICdtLnJvb20uZW5jcnlwdGlvbicsXG4gICAgICAgIF07XG4gICAgICAgIGlmIChyZWZyZXNoV2hlblR5cGVzLmluY2x1ZGVzKGUuZ2V0VHlwZSgpKSkgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgIH07XG5cbiAgICBfb25FbmNyeXB0aW9uQ2hhbmdlID0gKGUpID0+IHtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRW5hYmxlIGVuY3J5cHRpb24nLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdCgnRW5hYmxlIGVuY3J5cHRpb24/JyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXG4gICAgICAgICAgICAgICAgXCJPbmNlIGVuYWJsZWQsIGVuY3J5cHRpb24gZm9yIGEgcm9vbSBjYW5ub3QgYmUgZGlzYWJsZWQuIE1lc3NhZ2VzIHNlbnQgaW4gYW4gZW5jcnlwdGVkIFwiICtcbiAgICAgICAgICAgICAgICBcInJvb20gY2Fubm90IGJlIHNlZW4gYnkgdGhlIHNlcnZlciwgb25seSBieSB0aGUgcGFydGljaXBhbnRzIG9mIHRoZSByb29tLiBFbmFibGluZyBlbmNyeXB0aW9uIFwiICtcbiAgICAgICAgICAgICAgICBcIm1heSBwcmV2ZW50IG1hbnkgYm90cyBhbmQgYnJpZGdlcyBmcm9tIHdvcmtpbmcgY29ycmVjdGx5LiA8YT5MZWFybiBtb3JlIGFib3V0IGVuY3J5cHRpb24uPC9hPlwiLFxuICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJ2EnOiAoc3ViKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGEgcmVsPSdub3JlZmVycmVyIG5vb3BlbmVyJyB0YXJnZXQ9J19ibGFuaydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBocmVmPSdodHRwczovL2Fib3V0LnJpb3QuaW0vaGVscCNlbmQtdG8tZW5kLWVuY3J5cHRpb24nPntzdWJ9PC9hPjtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IChjb25maXJtKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb25maXJtKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VuY3J5cHRlZDogZmFsc2V9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZUVuY3J5cHRlZCA9IHRoaXMuc3RhdGUuZW5jcnlwdGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VuY3J5cHRlZDogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kU3RhdGVFdmVudChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tSWQsIFwibS5yb29tLmVuY3J5cHRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgeyBhbGdvcml0aG06IFwibS5tZWdvbG0udjEuYWVzLXNoYTJcIiB9LFxuICAgICAgICAgICAgICAgICkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZW5jcnlwdGVkOiBiZWZvcmVFbmNyeXB0ZWR9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfZml4R3Vlc3RBY2Nlc3MgPSAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgY29uc3Qgam9pblJ1bGUgPSBcImludml0ZVwiO1xuICAgICAgICBjb25zdCBndWVzdEFjY2VzcyA9IFwiY2FuX2pvaW5cIjtcblxuICAgICAgICBjb25zdCBiZWZvcmVKb2luUnVsZSA9IHRoaXMuc3RhdGUuam9pblJ1bGU7XG4gICAgICAgIGNvbnN0IGJlZm9yZUd1ZXN0QWNjZXNzID0gdGhpcy5zdGF0ZS5ndWVzdEFjY2VzcztcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7am9pblJ1bGUsIGd1ZXN0QWNjZXNzfSk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjbGllbnQuc2VuZFN0YXRlRXZlbnQodGhpcy5wcm9wcy5yb29tSWQsIFwibS5yb29tLmpvaW5fcnVsZXNcIiwge2pvaW5fcnVsZTogam9pblJ1bGV9LCBcIlwiKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2pvaW5SdWxlOiBiZWZvcmVKb2luUnVsZX0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xpZW50LnNlbmRTdGF0ZUV2ZW50KHRoaXMucHJvcHMucm9vbUlkLCBcIm0ucm9vbS5ndWVzdF9hY2Nlc3NcIiwge2d1ZXN0X2FjY2VzczogZ3Vlc3RBY2Nlc3N9LCBcIlwiKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2d1ZXN0QWNjZXNzOiBiZWZvcmVHdWVzdEFjY2Vzc30pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uUm9vbUFjY2Vzc1JhZGlvVG9nZ2xlID0gKGV2KSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGpvaW5fcnVsZVxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICBJTlZJVEUgIHwgIFBVQkxJQ1xuICAgICAgICAvLyAgICAgICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vIGd1ZXN0ICBDQU5fSk9JTiAgIHwgaW52X29ubHkgfCBwdWJfd2l0aF9ndWVzdFxuICAgICAgICAvLyBhY2Nlc3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICAgICAgICBGT1JCSURERU4gIHwgaW52X29ubHkgfCBwdWJfbm9fZ3Vlc3RcbiAgICAgICAgLy8gICAgICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIC8vIHdlIGFsd2F5cyBzZXQgZ3Vlc3RzIGNhbl9qb2luIGhlcmUgYXMgaXQgbWFrZXMgbm8gc2Vuc2UgdG8gaGF2ZVxuICAgICAgICAvLyBhbiBpbnZpdGUtb25seSByb29tIHRoYXQgZ3Vlc3RzIGNhbid0IGpvaW4uICBJZiB5b3UgZXhwbGljaXRseVxuICAgICAgICAvLyBpbnZpdGUgdGhlbSwgeW91IGNsZWFybHkgd2FudCB0aGVtIHRvIGpvaW4sIHdoZXRoZXIgdGhleSdyZSBhXG4gICAgICAgIC8vIGd1ZXN0IG9yIG5vdC4gIEluIHByYWN0aWNlLCBndWVzdF9hY2Nlc3Mgc2hvdWxkIHByb2JhYmx5IGhhdmVcbiAgICAgICAgLy8gYmVlbiBpbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBqb2luX3J1bGVzIGVudW0uXG4gICAgICAgIGxldCBqb2luUnVsZSA9IFwiaW52aXRlXCI7XG4gICAgICAgIGxldCBndWVzdEFjY2VzcyA9IFwiY2FuX2pvaW5cIjtcblxuICAgICAgICBzd2l0Y2ggKGV2LnRhcmdldC52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcImludml0ZV9vbmx5XCI6XG4gICAgICAgICAgICAgICAgLy8gbm8gY2hhbmdlIC0gdXNlIGRlZmF1bHRzIGFib3ZlXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHVibGljX25vX2d1ZXN0c1wiOlxuICAgICAgICAgICAgICAgIGpvaW5SdWxlID0gXCJwdWJsaWNcIjtcbiAgICAgICAgICAgICAgICBndWVzdEFjY2VzcyA9IFwiZm9yYmlkZGVuXCI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHVibGljX3dpdGhfZ3Vlc3RzXCI6XG4gICAgICAgICAgICAgICAgam9pblJ1bGUgPSBcInB1YmxpY1wiO1xuICAgICAgICAgICAgICAgIGd1ZXN0QWNjZXNzID0gXCJjYW5fam9pblwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVmb3JlSm9pblJ1bGUgPSB0aGlzLnN0YXRlLmpvaW5SdWxlO1xuICAgICAgICBjb25zdCBiZWZvcmVHdWVzdEFjY2VzcyA9IHRoaXMuc3RhdGUuZ3Vlc3RBY2Nlc3M7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2pvaW5SdWxlLCBndWVzdEFjY2Vzc30pO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY2xpZW50LnNlbmRTdGF0ZUV2ZW50KHRoaXMucHJvcHMucm9vbUlkLCBcIm0ucm9vbS5qb2luX3J1bGVzXCIsIHtqb2luX3J1bGU6IGpvaW5SdWxlfSwgXCJcIikuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtqb2luUnVsZTogYmVmb3JlSm9pblJ1bGV9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNsaWVudC5zZW5kU3RhdGVFdmVudCh0aGlzLnByb3BzLnJvb21JZCwgXCJtLnJvb20uZ3Vlc3RfYWNjZXNzXCIsIHtndWVzdF9hY2Nlc3M6IGd1ZXN0QWNjZXNzfSwgXCJcIikuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtndWVzdEFjY2VzczogYmVmb3JlR3Vlc3RBY2Nlc3N9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkhpc3RvcnlSYWRpb1RvZ2dsZSA9IChldikgPT4ge1xuICAgICAgICBjb25zdCBiZWZvcmVIaXN0b3J5ID0gdGhpcy5zdGF0ZS5oaXN0b3J5O1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtoaXN0b3J5OiBldi50YXJnZXQudmFsdWV9KTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNlbmRTdGF0ZUV2ZW50KHRoaXMucHJvcHMucm9vbUlkLCBcIm0ucm9vbS5oaXN0b3J5X3Zpc2liaWxpdHlcIiwge1xuICAgICAgICAgICAgaGlzdG9yeV92aXNpYmlsaXR5OiBldi50YXJnZXQudmFsdWUsXG4gICAgICAgIH0sIFwiXCIpLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeTogYmVmb3JlSGlzdG9yeX0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX3VwZGF0ZUJsYWNrbGlzdERldmljZXNGbGFnID0gKGNoZWNrZWQpID0+IHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpLnNldEJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzKGNoZWNrZWQpO1xuICAgIH07XG5cbiAgICBhc3luYyBfaGFzQWxpYXNlcygpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoYXdhaXQgY2xpLmRvZXNTZXJ2ZXJTdXBwb3J0VW5zdGFibGVGZWF0dXJlKFwib3JnLm1hdHJpeC5tc2MyNDMyXCIpKSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaS51bnN0YWJsZUdldExvY2FsQWxpYXNlcyh0aGlzLnByb3BzLnJvb21JZCk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbEFsaWFzZXMgPSByZXNwb25zZS5hbGlhc2VzO1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkobG9jYWxBbGlhc2VzKSAmJiBsb2NhbEFsaWFzZXMubGVuZ3RoICE9PSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IGNsaS5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzRXZlbnRzID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20uYWxpYXNlc1wiKSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGhhc0FsaWFzZXMgPSAhIWFsaWFzRXZlbnRzLmZpbmQoKGV2KSA9PiAoZXYuZ2V0Q29udGVudCgpLmFsaWFzZXMgfHwgW10pLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgcmV0dXJuIGhhc0FsaWFzZXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVuZGVyUm9vbUFjY2VzcygpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICBjb25zdCBqb2luUnVsZSA9IHRoaXMuc3RhdGUuam9pblJ1bGU7XG4gICAgICAgIGNvbnN0IGd1ZXN0QWNjZXNzID0gdGhpcy5zdGF0ZS5ndWVzdEFjY2VzcztcblxuICAgICAgICBjb25zdCBjYW5DaGFuZ2VBY2Nlc3MgPSByb29tLmN1cnJlbnRTdGF0ZS5tYXlDbGllbnRTZW5kU3RhdGVFdmVudChcIm0ucm9vbS5qb2luX3J1bGVzXCIsIGNsaWVudClcbiAgICAgICAgICAgICYmIHJvb20uY3VycmVudFN0YXRlLm1heUNsaWVudFNlbmRTdGF0ZUV2ZW50KFwibS5yb29tLmd1ZXN0X2FjY2Vzc1wiLCBjbGllbnQpO1xuXG4gICAgICAgIGxldCBndWVzdFdhcm5pbmcgPSBudWxsO1xuICAgICAgICBpZiAoam9pblJ1bGUgIT09ICdwdWJsaWMnICYmIGd1ZXN0QWNjZXNzID09PSAnZm9yYmlkZGVuJykge1xuICAgICAgICAgICAgZ3Vlc3RXYXJuaW5nID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZWN1cml0eVJvb21TZXR0aW5nc1RhYl93YXJuaW5nJz5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9yZXMvaW1nL3dhcm5pbmcuc3ZnXCIpfSB3aWR0aD17MTV9IGhlaWdodD17MTV9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiR3Vlc3RzIGNhbm5vdCBqb2luIHRoaXMgcm9vbSBldmVuIGlmIGV4cGxpY2l0bHkgaW52aXRlZC5cIil9Jm5ic3A7XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiXCIgb25DbGljaz17dGhpcy5fZml4R3Vlc3RBY2Nlc3N9PntfdChcIkNsaWNrIGhlcmUgdG8gZml4XCIpfTwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhbGlhc1dhcm5pbmcgPSBudWxsO1xuICAgICAgICBpZiAoam9pblJ1bGUgPT09ICdwdWJsaWMnICYmICF0aGlzLnN0YXRlLmhhc0FsaWFzZXMpIHtcbiAgICAgICAgICAgIGFsaWFzV2FybmluZyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2VjdXJpdHlSb29tU2V0dGluZ3NUYWJfd2FybmluZyc+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vcmVzL2ltZy93YXJuaW5nLnN2Z1wiKX0gd2lkdGg9ezE1fSBoZWlnaHQ9ezE1fSAvPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlRvIGxpbmsgdG8gdGhpcyByb29tLCBwbGVhc2UgYWRkIGFuIGFsaWFzLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtndWVzdFdhcm5pbmd9XG4gICAgICAgICAgICAgICAge2FsaWFzV2FybmluZ31cbiAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwicm9vbVZpc1wiIHZhbHVlPVwiaW52aXRlX29ubHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5DaGFuZ2VBY2Nlc3N9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Sb29tQWNjZXNzUmFkaW9Ub2dnbGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtqb2luUnVsZSAhPT0gXCJwdWJsaWNcIn0gLz5cbiAgICAgICAgICAgICAgICAgICAge190KCdPbmx5IHBlb3BsZSB3aG8gaGF2ZSBiZWVuIGludml0ZWQnKX1cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJyb29tVmlzXCIgdmFsdWU9XCJwdWJsaWNfbm9fZ3Vlc3RzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ2hhbmdlQWNjZXNzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUm9vbUFjY2Vzc1JhZGlvVG9nZ2xlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17am9pblJ1bGUgPT09IFwicHVibGljXCIgJiYgZ3Vlc3RBY2Nlc3MgIT09IFwiY2FuX2pvaW5cIn0gLz5cbiAgICAgICAgICAgICAgICAgICAge190KCdBbnlvbmUgd2hvIGtub3dzIHRoZSByb29tXFwncyBsaW5rLCBhcGFydCBmcm9tIGd1ZXN0cycpfVxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInJvb21WaXNcIiB2YWx1ZT1cInB1YmxpY193aXRoX2d1ZXN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNoYW5nZUFjY2Vzc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vblJvb21BY2Nlc3NSYWRpb1RvZ2dsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2pvaW5SdWxlID09PSBcInB1YmxpY1wiICYmIGd1ZXN0QWNjZXNzID09PSBcImNhbl9qb2luXCJ9IC8+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkFueW9uZSB3aG8ga25vd3MgdGhlIHJvb20ncyBsaW5rLCBpbmNsdWRpbmcgZ3Vlc3RzXCIpfVxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfcmVuZGVySGlzdG9yeSgpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBoaXN0b3J5ID0gdGhpcy5zdGF0ZS5oaXN0b3J5O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGNsaWVudC5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKS5jdXJyZW50U3RhdGU7XG4gICAgICAgIGNvbnN0IGNhbkNoYW5nZUhpc3RvcnkgPSBzdGF0ZS5tYXlDbGllbnRTZW5kU3RhdGVFdmVudCgnbS5yb29tLmhpc3RvcnlfdmlzaWJpbGl0eScsIGNsaWVudCk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge190KCdDaGFuZ2VzIHRvIHdobyBjYW4gcmVhZCBoaXN0b3J5IHdpbGwgb25seSBhcHBseSB0byBmdXR1cmUgbWVzc2FnZXMgaW4gdGhpcyByb29tLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdUaGUgdmlzaWJpbGl0eSBvZiBleGlzdGluZyBoaXN0b3J5IHdpbGwgYmUgdW5jaGFuZ2VkLicpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJoaXN0b3J5VmlzXCIgdmFsdWU9XCJ3b3JsZF9yZWFkYWJsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNoYW5nZUhpc3Rvcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtoaXN0b3J5ID09PSBcIndvcmxkX3JlYWRhYmxlXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25IaXN0b3J5UmFkaW9Ub2dnbGV9IC8+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkFueW9uZVwiKX1cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJoaXN0b3J5VmlzXCIgdmFsdWU9XCJzaGFyZWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5DaGFuZ2VIaXN0b3J5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17aGlzdG9yeSA9PT0gXCJzaGFyZWRcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vbkhpc3RvcnlSYWRpb1RvZ2dsZX0gLz5cbiAgICAgICAgICAgICAgICAgICAge190KCdNZW1iZXJzIG9ubHkgKHNpbmNlIHRoZSBwb2ludCBpbiB0aW1lIG9mIHNlbGVjdGluZyB0aGlzIG9wdGlvbiknKX1cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJoaXN0b3J5VmlzXCIgdmFsdWU9XCJpbnZpdGVkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ2hhbmdlSGlzdG9yeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2hpc3RvcnkgPT09IFwiaW52aXRlZFwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uSGlzdG9yeVJhZGlvVG9nZ2xlfSAvPlxuICAgICAgICAgICAgICAgICAgICB7X3QoJ01lbWJlcnMgb25seSAoc2luY2UgdGhleSB3ZXJlIGludml0ZWQpJyl9XG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8bGFiZWwgPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cImhpc3RvcnlWaXNcIiB2YWx1ZT1cImpvaW5lZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNoYW5nZUhpc3Rvcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtoaXN0b3J5ID09PSBcImpvaW5lZFwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uSGlzdG9yeVJhZGlvVG9nZ2xlfSAvPlxuICAgICAgICAgICAgICAgICAgICB7X3QoJ01lbWJlcnMgb25seSAoc2luY2UgdGhleSBqb2luZWQpJyl9XG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgU2V0dGluZ3NGbGFnID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNldHRpbmdzRmxhZ1wiKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbSh0aGlzLnByb3BzLnJvb21JZCk7XG4gICAgICAgIGNvbnN0IGlzRW5jcnlwdGVkID0gdGhpcy5zdGF0ZS5lbmNyeXB0ZWQ7XG4gICAgICAgIGNvbnN0IGhhc0VuY3J5cHRpb25QZXJtaXNzaW9uID0gcm9vbS5jdXJyZW50U3RhdGUubWF5Q2xpZW50U2VuZFN0YXRlRXZlbnQoXCJtLnJvb20uZW5jcnlwdGlvblwiLCBjbGllbnQpO1xuICAgICAgICBjb25zdCBjYW5FbmFibGVFbmNyeXB0aW9uID0gIWlzRW5jcnlwdGVkICYmIGhhc0VuY3J5cHRpb25QZXJtaXNzaW9uO1xuXG4gICAgICAgIGxldCBlbmNyeXB0aW9uU2V0dGluZ3MgPSBudWxsO1xuICAgICAgICBpZiAoaXNFbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGVuY3J5cHRpb25TZXR0aW5ncyA9IDxTZXR0aW5nc0ZsYWcgbmFtZT1cImJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzXCIgbGV2ZWw9e1NldHRpbmdMZXZlbC5ST09NX0RFVklDRX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX3VwZGF0ZUJsYWNrbGlzdERldmljZXNGbGFnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb29tSWQ9e3RoaXMucHJvcHMucm9vbUlkfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiIG14X1NlY3VyaXR5Um9vbVNldHRpbmdzVGFiXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9oZWFkaW5nXCI+e190KFwiU2VjdXJpdHkgJiBQcml2YWN5XCIpfTwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nJz57X3QoXCJFbmNyeXB0aW9uXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbiBteF9TZWN1cml0eVJvb21TZXR0aW5nc1RhYl9lbmNyeXB0aW9uU2VjdGlvbic+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntfdChcIk9uY2UgZW5hYmxlZCwgZW5jcnlwdGlvbiBjYW5ub3QgYmUgZGlzYWJsZWQuXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPExhYmVsbGVkVG9nZ2xlU3dpdGNoIHZhbHVlPXtpc0VuY3J5cHRlZH0gb25DaGFuZ2U9e3RoaXMuX29uRW5jcnlwdGlvbkNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJFbmNyeXB0ZWRcIil9IGRpc2FibGVkPXshY2FuRW5hYmxlRW5jcnlwdGlvbn0gLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHtlbmNyeXB0aW9uU2V0dGluZ3N9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcnPntfdChcIldobyBjYW4gYWNjZXNzIHRoaXMgcm9vbT9cIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uIG14X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclJvb21BY2Nlc3MoKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KFwiV2hvIGNhbiByZWFkIGhpc3Rvcnk/XCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbiBteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJIaXN0b3J5KCl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=