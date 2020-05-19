"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.BannedUser = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../../languageHandler");

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../../.."));

var _AccessibleButton = _interopRequireDefault(require("../../../elements/AccessibleButton"));

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

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
const plEventsToLabels = {
  // These will be translated for us later.
  "m.room.avatar": (0, _languageHandler._td)("Change room avatar"),
  "m.room.name": (0, _languageHandler._td)("Change room name"),
  "m.room.canonical_alias": (0, _languageHandler._td)("Change main address for the room"),
  "m.room.history_visibility": (0, _languageHandler._td)("Change history visibility"),
  "m.room.power_levels": (0, _languageHandler._td)("Change permissions"),
  "m.room.topic": (0, _languageHandler._td)("Change topic"),
  "m.room.tombstone": (0, _languageHandler._td)("Upgrade the room"),
  "m.room.encryption": (0, _languageHandler._td)("Enable room encryption"),
  // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
  "im.vector.modular.widgets": (0, _languageHandler._td)("Modify widgets")
};
const plEventsToShow = {
  // If an event is listed here, it will be shown in the PL settings. Defaults will be calculated.
  "m.room.avatar": {
    isState: true
  },
  "m.room.name": {
    isState: true
  },
  "m.room.canonical_alias": {
    isState: true
  },
  "m.room.history_visibility": {
    isState: true
  },
  "m.room.power_levels": {
    isState: true
  },
  "m.room.topic": {
    isState: true
  },
  "m.room.tombstone": {
    isState: true
  },
  "m.room.encryption": {
    isState: true
  },
  // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
  "im.vector.modular.widgets": {
    isState: true
  }
}; // parse a string as an integer; if the input is undefined, or cannot be parsed
// as an integer, return a default.

function parseIntWithDefault(val, def) {
  const res = parseInt(val);
  return isNaN(res) ? def : res;
}

class BannedUser extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onUnbanClick", e => {
      _MatrixClientPeg.MatrixClientPeg.get().unban(this.props.member.roomId, this.props.member.userId).catch(err => {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
        console.error("Failed to unban: " + err);

        _Modal.default.createTrackedDialog('Failed to unban', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Error'),
          description: (0, _languageHandler._t)('Failed to unban')
        });
      });
    });
  }

  render() {
    let unbanButton;

    if (this.props.canUnban) {
      unbanButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "danger_sm",
        onClick: this._onUnbanClick,
        className: "mx_RolesRoomSettingsTab_unbanBtn"
      }, (0, _languageHandler._t)('Unban'));
    }

    const userId = this.props.member.name === this.props.member.userId ? null : this.props.member.userId;
    return /*#__PURE__*/_react.default.createElement("li", null, unbanButton, /*#__PURE__*/_react.default.createElement("span", {
      title: (0, _languageHandler._t)("Banned by %(displayName)s", {
        displayName: this.props.by
      })
    }, /*#__PURE__*/_react.default.createElement("strong", null, this.props.member.name), " ", userId, this.props.reason ? " " + (0, _languageHandler._t)('Reason') + ": " + this.props.reason : ""));
  }

}

exports.BannedUser = BannedUser;
(0, _defineProperty2.default)(BannedUser, "propTypes", {
  canUnban: _propTypes.default.bool,
  member: _propTypes.default.object.isRequired,
  // js-sdk RoomMember
  by: _propTypes.default.string.isRequired,
  reason: _propTypes.default.string
});

class RolesRoomSettingsTab extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onRoomMembership", (event, state, member) => {
      if (state.roomId !== this.props.roomId) return;
      this.forceUpdate();
    });
    (0, _defineProperty2.default)(this, "_onPowerLevelsChanged", (value, powerLevelKey) => {
      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const room = client.getRoom(this.props.roomId);
      const plEvent = room.currentState.getStateEvents('m.room.power_levels', '');
      let plContent = plEvent ? plEvent.getContent() || {} : {}; // Clone the power levels just in case

      plContent = Object.assign({}, plContent);
      const eventsLevelPrefix = "event_levels_";
      value = parseInt(value);

      if (powerLevelKey.startsWith(eventsLevelPrefix)) {
        // deep copy "events" object, Object.assign itself won't deep copy
        plContent["events"] = Object.assign({}, plContent["events"] || {});
        plContent["events"][powerLevelKey.slice(eventsLevelPrefix.length)] = value;
      } else {
        const keyPath = powerLevelKey.split('.');
        let parentObj;
        let currentObj = plContent;

        for (const key of keyPath) {
          if (!currentObj[key]) {
            currentObj[key] = {};
          }

          parentObj = currentObj;
          currentObj = currentObj[key];
        }

        parentObj[keyPath[keyPath.length - 1]] = value;
      }

      client.sendStateEvent(this.props.roomId, "m.room.power_levels", plContent).catch(e => {
        console.error(e);
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Power level requirement change failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Error changing power level requirement'),
          description: (0, _languageHandler._t)("An error occurred changing the room's power level requirements. Ensure you have sufficient " + "permissions and try again.")
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onUserPowerLevelChanged", (value, powerLevelKey) => {
      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const room = client.getRoom(this.props.roomId);
      const plEvent = room.currentState.getStateEvents('m.room.power_levels', '');
      let plContent = plEvent ? plEvent.getContent() || {} : {}; // Clone the power levels just in case

      plContent = Object.assign({}, plContent); // powerLevelKey should be a user ID

      if (!plContent['users']) plContent['users'] = {};
      plContent['users'][powerLevelKey] = value;
      client.sendStateEvent(this.props.roomId, "m.room.power_levels", plContent).catch(e => {
        console.error(e);
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Power level change failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Error changing power level'),
          description: (0, _languageHandler._t)("An error occurred changing the user's power level. Ensure you have sufficient " + "permissions and try again.")
        });
      });
    });
  }

  componentDidMount()
  /*: void*/
  {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.members", this._onRoomMembership);
  }

  componentWillUnmount()
  /*: void*/
  {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("RoomState.members", this._onRoomMembership);
    }
  }

  _populateDefaultPlEvents(eventsSection, stateLevel, eventsLevel) {
    for (const desiredEvent of Object.keys(plEventsToShow)) {
      if (!(desiredEvent in eventsSection)) {
        eventsSection[desiredEvent] = plEventsToShow[desiredEvent].isState ? stateLevel : eventsLevel;
      }
    }
  }

  render() {
    const PowerSelector = sdk.getComponent('elements.PowerSelector');

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const room = client.getRoom(this.props.roomId);
    const plEvent = room.currentState.getStateEvents('m.room.power_levels', '');
    const plContent = plEvent ? plEvent.getContent() || {} : {};
    const canChangeLevels = room.currentState.mayClientSendStateEvent('m.room.power_levels', client);
    const powerLevelDescriptors = {
      "users_default": {
        desc: (0, _languageHandler._t)('Default role'),
        defaultValue: 0
      },
      "events_default": {
        desc: (0, _languageHandler._t)('Send messages'),
        defaultValue: 0
      },
      "invite": {
        desc: (0, _languageHandler._t)('Invite users'),
        defaultValue: 50
      },
      "state_default": {
        desc: (0, _languageHandler._t)('Change settings'),
        defaultValue: 50
      },
      "kick": {
        desc: (0, _languageHandler._t)('Kick users'),
        defaultValue: 50
      },
      "ban": {
        desc: (0, _languageHandler._t)('Ban users'),
        defaultValue: 50
      },
      "redact": {
        desc: (0, _languageHandler._t)('Remove messages'),
        defaultValue: 50
      },
      "notifications.room": {
        desc: (0, _languageHandler._t)('Notify everyone'),
        defaultValue: 50
      }
    };
    const eventsLevels = plContent.events || {};
    const userLevels = plContent.users || {};
    const banLevel = parseIntWithDefault(plContent.ban, powerLevelDescriptors.ban.defaultValue);
    const defaultUserLevel = parseIntWithDefault(plContent.users_default, powerLevelDescriptors.users_default.defaultValue);
    let currentUserLevel = userLevels[client.getUserId()];

    if (currentUserLevel === undefined) {
      currentUserLevel = defaultUserLevel;
    }

    this._populateDefaultPlEvents(eventsLevels, parseIntWithDefault(plContent.state_default, powerLevelDescriptors.state_default.defaultValue), parseIntWithDefault(plContent.events_default, powerLevelDescriptors.events_default.defaultValue));

    let privilegedUsersSection = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('No users have specific privileges in this room'));

    let mutedUsersSection;

    if (Object.keys(userLevels).length) {
      const privilegedUsers = [];
      const mutedUsers = [];
      Object.keys(userLevels).forEach(user => {
        const canChange = userLevels[user] < currentUserLevel && canChangeLevels;

        if (userLevels[user] > defaultUserLevel) {
          // privileged
          privilegedUsers.push( /*#__PURE__*/_react.default.createElement(PowerSelector, {
            value: userLevels[user],
            disabled: !canChange,
            label: user,
            key: user,
            powerLevelKey: user // Will be sent as the second parameter to `onChange`
            ,
            onChange: this._onUserPowerLevelChanged
          }));
        } else if (userLevels[user] < defaultUserLevel) {
          // muted
          mutedUsers.push( /*#__PURE__*/_react.default.createElement(PowerSelector, {
            value: userLevels[user],
            disabled: !canChange,
            label: user,
            key: user,
            powerLevelKey: user // Will be sent as the second parameter to `onChange`
            ,
            onChange: this._onUserPowerLevelChanged
          }));
        }
      }); // comparator for sorting PL users lexicographically on PL descending, MXID ascending. (case-insensitive)

      const comparator = (a, b) => {
        const plDiff = userLevels[b.key] - userLevels[a.key];
        return plDiff !== 0 ? plDiff : a.key.toLocaleLowerCase().localeCompare(b.key.toLocaleLowerCase());
      };

      privilegedUsers.sort(comparator);
      mutedUsers.sort(comparator);

      if (privilegedUsers.length) {
        privilegedUsersSection = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
        }, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_SettingsTab_subheading"
        }, (0, _languageHandler._t)('Privileged Users')), privilegedUsers);
      }

      if (mutedUsers.length) {
        mutedUsersSection = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
        }, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_SettingsTab_subheading"
        }, (0, _languageHandler._t)('Muted Users')), mutedUsers);
      }
    }

    const banned = room.getMembersWithMembership("ban");
    let bannedUsersSection;

    if (banned.length) {
      const canBanUsers = currentUserLevel >= banLevel;
      bannedUsersSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subheading"
      }, (0, _languageHandler._t)('Banned users')), /*#__PURE__*/_react.default.createElement("ul", null, banned.map(member => {
        const banEvent = member.events.member.getContent();
        const sender = room.getMember(member.events.member.getSender());
        let bannedBy = member.events.member.getSender(); // start by falling back to mxid

        if (sender) bannedBy = sender.name;
        return /*#__PURE__*/_react.default.createElement(BannedUser, {
          key: member.userId,
          canUnban: canBanUsers,
          member: member,
          reason: banEvent.reason,
          by: bannedBy
        });
      })));
    }

    const powerSelectors = Object.keys(powerLevelDescriptors).map((key, index) => {
      const descriptor = powerLevelDescriptors[key];
      const keyPath = key.split('.');
      let currentObj = plContent;

      for (const prop of keyPath) {
        if (currentObj === undefined) {
          break;
        }

        currentObj = currentObj[prop];
      }

      const value = parseIntWithDefault(currentObj, descriptor.defaultValue);
      return /*#__PURE__*/_react.default.createElement("div", {
        key: index,
        className: ""
      }, /*#__PURE__*/_react.default.createElement(PowerSelector, {
        label: descriptor.desc,
        value: value,
        usersDefault: defaultUserLevel,
        disabled: !canChangeLevels || currentUserLevel < value,
        powerLevelKey: key // Will be sent as the second parameter to `onChange`
        ,
        onChange: this._onPowerLevelsChanged
      }));
    }); // hide the power level selector for enabling E2EE if it the room is already encrypted

    if (client.isRoomEncrypted(this.props.roomId)) {
      delete eventsLevels["m.room.encryption"];
    }

    const eventPowerSelectors = Object.keys(eventsLevels).map((eventType, i) => {
      let label = plEventsToLabels[eventType];

      if (label) {
        label = (0, _languageHandler._t)(label);
      } else {
        label = (0, _languageHandler._t)("Send %(eventType)s events", {
          eventType
        });
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        className: "",
        key: eventType
      }, /*#__PURE__*/_react.default.createElement(PowerSelector, {
        label: label,
        value: eventsLevels[eventType],
        usersDefault: defaultUserLevel,
        disabled: !canChangeLevels || currentUserLevel < eventsLevels[eventType],
        powerLevelKey: "event_levels_" + eventType,
        onChange: this._onPowerLevelsChanged
      }));
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab mx_RolesRoomSettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Roles & Permissions")), privilegedUsersSection, mutedUsersSection, bannedUsersSection, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Permissions")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('Select the roles required to change various parts of the room')), powerSelectors, eventPowerSelectors));
  }

}

exports.default = RolesRoomSettingsTab;
(0, _defineProperty2.default)(RolesRoomSettingsTab, "propTypes", {
  roomId: _propTypes.default.string.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvcm9vbS9Sb2xlc1Jvb21TZXR0aW5nc1RhYi5qcyJdLCJuYW1lcyI6WyJwbEV2ZW50c1RvTGFiZWxzIiwicGxFdmVudHNUb1Nob3ciLCJpc1N0YXRlIiwicGFyc2VJbnRXaXRoRGVmYXVsdCIsInZhbCIsImRlZiIsInJlcyIsInBhcnNlSW50IiwiaXNOYU4iLCJCYW5uZWRVc2VyIiwiUmVhY3QiLCJDb21wb25lbnQiLCJlIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwidW5iYW4iLCJwcm9wcyIsIm1lbWJlciIsInJvb21JZCIsInVzZXJJZCIsImNhdGNoIiwiZXJyIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjb25zb2xlIiwiZXJyb3IiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwicmVuZGVyIiwidW5iYW5CdXR0b24iLCJjYW5VbmJhbiIsIl9vblVuYmFuQ2xpY2siLCJuYW1lIiwiZGlzcGxheU5hbWUiLCJieSIsInJlYXNvbiIsIlByb3BUeXBlcyIsImJvb2wiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiUm9sZXNSb29tU2V0dGluZ3NUYWIiLCJldmVudCIsInN0YXRlIiwiZm9yY2VVcGRhdGUiLCJ2YWx1ZSIsInBvd2VyTGV2ZWxLZXkiLCJjbGllbnQiLCJyb29tIiwiZ2V0Um9vbSIsInBsRXZlbnQiLCJjdXJyZW50U3RhdGUiLCJnZXRTdGF0ZUV2ZW50cyIsInBsQ29udGVudCIsImdldENvbnRlbnQiLCJPYmplY3QiLCJhc3NpZ24iLCJldmVudHNMZXZlbFByZWZpeCIsInN0YXJ0c1dpdGgiLCJzbGljZSIsImxlbmd0aCIsImtleVBhdGgiLCJzcGxpdCIsInBhcmVudE9iaiIsImN1cnJlbnRPYmoiLCJrZXkiLCJzZW5kU3RhdGVFdmVudCIsImNvbXBvbmVudERpZE1vdW50Iiwib24iLCJfb25Sb29tTWVtYmVyc2hpcCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJfcG9wdWxhdGVEZWZhdWx0UGxFdmVudHMiLCJldmVudHNTZWN0aW9uIiwic3RhdGVMZXZlbCIsImV2ZW50c0xldmVsIiwiZGVzaXJlZEV2ZW50Iiwia2V5cyIsIlBvd2VyU2VsZWN0b3IiLCJjYW5DaGFuZ2VMZXZlbHMiLCJtYXlDbGllbnRTZW5kU3RhdGVFdmVudCIsInBvd2VyTGV2ZWxEZXNjcmlwdG9ycyIsImRlc2MiLCJkZWZhdWx0VmFsdWUiLCJldmVudHNMZXZlbHMiLCJldmVudHMiLCJ1c2VyTGV2ZWxzIiwidXNlcnMiLCJiYW5MZXZlbCIsImJhbiIsImRlZmF1bHRVc2VyTGV2ZWwiLCJ1c2Vyc19kZWZhdWx0IiwiY3VycmVudFVzZXJMZXZlbCIsImdldFVzZXJJZCIsInVuZGVmaW5lZCIsInN0YXRlX2RlZmF1bHQiLCJldmVudHNfZGVmYXVsdCIsInByaXZpbGVnZWRVc2Vyc1NlY3Rpb24iLCJtdXRlZFVzZXJzU2VjdGlvbiIsInByaXZpbGVnZWRVc2VycyIsIm11dGVkVXNlcnMiLCJmb3JFYWNoIiwidXNlciIsImNhbkNoYW5nZSIsInB1c2giLCJfb25Vc2VyUG93ZXJMZXZlbENoYW5nZWQiLCJjb21wYXJhdG9yIiwiYSIsImIiLCJwbERpZmYiLCJ0b0xvY2FsZUxvd2VyQ2FzZSIsImxvY2FsZUNvbXBhcmUiLCJzb3J0IiwiYmFubmVkIiwiZ2V0TWVtYmVyc1dpdGhNZW1iZXJzaGlwIiwiYmFubmVkVXNlcnNTZWN0aW9uIiwiY2FuQmFuVXNlcnMiLCJtYXAiLCJiYW5FdmVudCIsInNlbmRlciIsImdldE1lbWJlciIsImdldFNlbmRlciIsImJhbm5lZEJ5IiwicG93ZXJTZWxlY3RvcnMiLCJpbmRleCIsImRlc2NyaXB0b3IiLCJwcm9wIiwiX29uUG93ZXJMZXZlbHNDaGFuZ2VkIiwiaXNSb29tRW5jcnlwdGVkIiwiZXZlbnRQb3dlclNlbGVjdG9ycyIsImV2ZW50VHlwZSIsImkiLCJsYWJlbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7OztBQXdCQSxNQUFNQSxnQkFBZ0IsR0FBRztBQUNyQjtBQUNBLG1CQUFpQiwwQkFBSSxvQkFBSixDQUZJO0FBR3JCLGlCQUFlLDBCQUFJLGtCQUFKLENBSE07QUFJckIsNEJBQTBCLDBCQUFJLGtDQUFKLENBSkw7QUFLckIsK0JBQTZCLDBCQUFJLDJCQUFKLENBTFI7QUFNckIseUJBQXVCLDBCQUFJLG9CQUFKLENBTkY7QUFPckIsa0JBQWdCLDBCQUFJLGNBQUosQ0FQSztBQVFyQixzQkFBb0IsMEJBQUksa0JBQUosQ0FSQztBQVNyQix1QkFBcUIsMEJBQUksd0JBQUosQ0FUQTtBQVdyQjtBQUNBLCtCQUE2QiwwQkFBSSxnQkFBSjtBQVpSLENBQXpCO0FBZUEsTUFBTUMsY0FBYyxHQUFHO0FBQ25CO0FBQ0EsbUJBQWlCO0FBQUNDLElBQUFBLE9BQU8sRUFBRTtBQUFWLEdBRkU7QUFHbkIsaUJBQWU7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FISTtBQUluQiw0QkFBMEI7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FKUDtBQUtuQiwrQkFBNkI7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FMVjtBQU1uQix5QkFBdUI7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FOSjtBQU9uQixrQkFBZ0I7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FQRztBQVFuQixzQkFBb0I7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FSRDtBQVNuQix1QkFBcUI7QUFBQ0EsSUFBQUEsT0FBTyxFQUFFO0FBQVYsR0FURjtBQVduQjtBQUNBLCtCQUE2QjtBQUFDQSxJQUFBQSxPQUFPLEVBQUU7QUFBVjtBQVpWLENBQXZCLEMsQ0FlQTtBQUNBOztBQUNBLFNBQVNDLG1CQUFULENBQTZCQyxHQUE3QixFQUFrQ0MsR0FBbEMsRUFBdUM7QUFDbkMsUUFBTUMsR0FBRyxHQUFHQyxRQUFRLENBQUNILEdBQUQsQ0FBcEI7QUFDQSxTQUFPSSxLQUFLLENBQUNGLEdBQUQsQ0FBTCxHQUFhRCxHQUFiLEdBQW1CQyxHQUExQjtBQUNIOztBQUVNLE1BQU1HLFVBQU4sU0FBeUJDLGVBQU1DLFNBQS9CLENBQXlDO0FBQUE7QUFBQTtBQUFBLHlEQVEzQkMsQ0FBRCxJQUFPO0FBQ25CQyx1Q0FBZ0JDLEdBQWhCLEdBQXNCQyxLQUF0QixDQUE0QixLQUFLQyxLQUFMLENBQVdDLE1BQVgsQ0FBa0JDLE1BQTlDLEVBQXNELEtBQUtGLEtBQUwsQ0FBV0MsTUFBWCxDQUFrQkUsTUFBeEUsRUFBZ0ZDLEtBQWhGLENBQXVGQyxHQUFELElBQVM7QUFDM0YsY0FBTUMsV0FBVyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIscUJBQWpCLENBQXBCO0FBQ0FDLFFBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLHNCQUFzQkwsR0FBcEM7O0FBQ0FNLHVCQUFNQyxtQkFBTixDQUEwQixpQkFBMUIsRUFBNkMsRUFBN0MsRUFBaUROLFdBQWpELEVBQThEO0FBQzFETyxVQUFBQSxLQUFLLEVBQUUseUJBQUcsT0FBSCxDQURtRDtBQUUxREMsVUFBQUEsV0FBVyxFQUFFLHlCQUFHLGlCQUFIO0FBRjZDLFNBQTlEO0FBSUgsT0FQRDtBQVFILEtBakIyQztBQUFBOztBQW1CNUNDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUlDLFdBQUo7O0FBRUEsUUFBSSxLQUFLaEIsS0FBTCxDQUFXaUIsUUFBZixFQUF5QjtBQUNyQkQsTUFBQUEsV0FBVyxnQkFDUCw2QkFBQyx5QkFBRDtBQUFrQixRQUFBLElBQUksRUFBQyxXQUF2QjtBQUFtQyxRQUFBLE9BQU8sRUFBRSxLQUFLRSxhQUFqRDtBQUNrQixRQUFBLFNBQVMsRUFBQztBQUQ1QixTQUVNLHlCQUFHLE9BQUgsQ0FGTixDQURKO0FBTUg7O0FBRUQsVUFBTWYsTUFBTSxHQUFHLEtBQUtILEtBQUwsQ0FBV0MsTUFBWCxDQUFrQmtCLElBQWxCLEtBQTJCLEtBQUtuQixLQUFMLENBQVdDLE1BQVgsQ0FBa0JFLE1BQTdDLEdBQXNELElBQXRELEdBQTZELEtBQUtILEtBQUwsQ0FBV0MsTUFBWCxDQUFrQkUsTUFBOUY7QUFDQSx3QkFDSSx5Q0FDS2EsV0FETCxlQUVJO0FBQU0sTUFBQSxLQUFLLEVBQUUseUJBQUcsMkJBQUgsRUFBZ0M7QUFBQ0ksUUFBQUEsV0FBVyxFQUFFLEtBQUtwQixLQUFMLENBQVdxQjtBQUF6QixPQUFoQztBQUFiLG9CQUNJLDZDQUFVLEtBQUtyQixLQUFMLENBQVdDLE1BQVgsQ0FBa0JrQixJQUE1QixDQURKLE9BQ2lEaEIsTUFEakQsRUFFSyxLQUFLSCxLQUFMLENBQVdzQixNQUFYLEdBQW9CLE1BQU0seUJBQUcsUUFBSCxDQUFOLEdBQXFCLElBQXJCLEdBQTRCLEtBQUt0QixLQUFMLENBQVdzQixNQUEzRCxHQUFvRSxFQUZ6RSxDQUZKLENBREo7QUFTSDs7QUF6QzJDOzs7OEJBQW5DN0IsVSxlQUNVO0FBQ2Z3QixFQUFBQSxRQUFRLEVBQUVNLG1CQUFVQyxJQURMO0FBRWZ2QixFQUFBQSxNQUFNLEVBQUVzQixtQkFBVUUsTUFBVixDQUFpQkMsVUFGVjtBQUVzQjtBQUNyQ0wsRUFBQUEsRUFBRSxFQUFFRSxtQkFBVUksTUFBVixDQUFpQkQsVUFITjtBQUlmSixFQUFBQSxNQUFNLEVBQUVDLG1CQUFVSTtBQUpILEM7O0FBMkNSLE1BQU1DLG9CQUFOLFNBQW1DbEMsZUFBTUMsU0FBekMsQ0FBbUQ7QUFBQTtBQUFBO0FBQUEsNkRBZ0IxQyxDQUFDa0MsS0FBRCxFQUFRQyxLQUFSLEVBQWU3QixNQUFmLEtBQTBCO0FBQzFDLFVBQUk2QixLQUFLLENBQUM1QixNQUFOLEtBQWlCLEtBQUtGLEtBQUwsQ0FBV0UsTUFBaEMsRUFBd0M7QUFDeEMsV0FBSzZCLFdBQUw7QUFDSCxLQW5CNkQ7QUFBQSxpRUE2QnRDLENBQUNDLEtBQUQsRUFBUUMsYUFBUixLQUEwQjtBQUM5QyxZQUFNQyxNQUFNLEdBQUdyQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsWUFBTXFDLElBQUksR0FBR0QsTUFBTSxDQUFDRSxPQUFQLENBQWUsS0FBS3BDLEtBQUwsQ0FBV0UsTUFBMUIsQ0FBYjtBQUNBLFlBQU1tQyxPQUFPLEdBQUdGLElBQUksQ0FBQ0csWUFBTCxDQUFrQkMsY0FBbEIsQ0FBaUMscUJBQWpDLEVBQXdELEVBQXhELENBQWhCO0FBQ0EsVUFBSUMsU0FBUyxHQUFHSCxPQUFPLEdBQUlBLE9BQU8sQ0FBQ0ksVUFBUixNQUF3QixFQUE1QixHQUFrQyxFQUF6RCxDQUo4QyxDQU05Qzs7QUFDQUQsTUFBQUEsU0FBUyxHQUFHRSxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSCxTQUFsQixDQUFaO0FBRUEsWUFBTUksaUJBQWlCLEdBQUcsZUFBMUI7QUFFQVosTUFBQUEsS0FBSyxHQUFHekMsUUFBUSxDQUFDeUMsS0FBRCxDQUFoQjs7QUFFQSxVQUFJQyxhQUFhLENBQUNZLFVBQWQsQ0FBeUJELGlCQUF6QixDQUFKLEVBQWlEO0FBQzdDO0FBQ0FKLFFBQUFBLFNBQVMsQ0FBQyxRQUFELENBQVQsR0FBc0JFLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JILFNBQVMsQ0FBQyxRQUFELENBQVQsSUFBdUIsRUFBekMsQ0FBdEI7QUFDQUEsUUFBQUEsU0FBUyxDQUFDLFFBQUQsQ0FBVCxDQUFvQlAsYUFBYSxDQUFDYSxLQUFkLENBQW9CRixpQkFBaUIsQ0FBQ0csTUFBdEMsQ0FBcEIsSUFBcUVmLEtBQXJFO0FBQ0gsT0FKRCxNQUlPO0FBQ0gsY0FBTWdCLE9BQU8sR0FBR2YsYUFBYSxDQUFDZ0IsS0FBZCxDQUFvQixHQUFwQixDQUFoQjtBQUNBLFlBQUlDLFNBQUo7QUFDQSxZQUFJQyxVQUFVLEdBQUdYLFNBQWpCOztBQUNBLGFBQUssTUFBTVksR0FBWCxJQUFrQkosT0FBbEIsRUFBMkI7QUFDdkIsY0FBSSxDQUFDRyxVQUFVLENBQUNDLEdBQUQsQ0FBZixFQUFzQjtBQUNsQkQsWUFBQUEsVUFBVSxDQUFDQyxHQUFELENBQVYsR0FBa0IsRUFBbEI7QUFDSDs7QUFDREYsVUFBQUEsU0FBUyxHQUFHQyxVQUFaO0FBQ0FBLFVBQUFBLFVBQVUsR0FBR0EsVUFBVSxDQUFDQyxHQUFELENBQXZCO0FBQ0g7O0FBQ0RGLFFBQUFBLFNBQVMsQ0FBQ0YsT0FBTyxDQUFDQSxPQUFPLENBQUNELE1BQVIsR0FBaUIsQ0FBbEIsQ0FBUixDQUFULEdBQXlDZixLQUF6QztBQUNIOztBQUVERSxNQUFBQSxNQUFNLENBQUNtQixjQUFQLENBQXNCLEtBQUtyRCxLQUFMLENBQVdFLE1BQWpDLEVBQXlDLHFCQUF6QyxFQUFnRXNDLFNBQWhFLEVBQTJFcEMsS0FBM0UsQ0FBaUZSLENBQUMsSUFBSTtBQUNsRmEsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNkLENBQWQ7QUFFQSxjQUFNVSxXQUFXLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBcEI7O0FBQ0FHLHVCQUFNQyxtQkFBTixDQUEwQix1Q0FBMUIsRUFBbUUsRUFBbkUsRUFBdUVOLFdBQXZFLEVBQW9GO0FBQ2hGTyxVQUFBQSxLQUFLLEVBQUUseUJBQUcsd0NBQUgsQ0FEeUU7QUFFaEZDLFVBQUFBLFdBQVcsRUFBRSx5QkFDVCxnR0FDQSw0QkFGUztBQUZtRSxTQUFwRjtBQU9ILE9BWEQ7QUFZSCxLQXhFNkQ7QUFBQSxvRUEwRW5DLENBQUNrQixLQUFELEVBQVFDLGFBQVIsS0FBMEI7QUFDakQsWUFBTUMsTUFBTSxHQUFHckMsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFlBQU1xQyxJQUFJLEdBQUdELE1BQU0sQ0FBQ0UsT0FBUCxDQUFlLEtBQUtwQyxLQUFMLENBQVdFLE1BQTFCLENBQWI7QUFDQSxZQUFNbUMsT0FBTyxHQUFHRixJQUFJLENBQUNHLFlBQUwsQ0FBa0JDLGNBQWxCLENBQWlDLHFCQUFqQyxFQUF3RCxFQUF4RCxDQUFoQjtBQUNBLFVBQUlDLFNBQVMsR0FBR0gsT0FBTyxHQUFJQSxPQUFPLENBQUNJLFVBQVIsTUFBd0IsRUFBNUIsR0FBa0MsRUFBekQsQ0FKaUQsQ0FNakQ7O0FBQ0FELE1BQUFBLFNBQVMsR0FBR0UsTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFrQkgsU0FBbEIsQ0FBWixDQVBpRCxDQVNqRDs7QUFDQSxVQUFJLENBQUNBLFNBQVMsQ0FBQyxPQUFELENBQWQsRUFBeUJBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsRUFBckI7QUFDekJBLE1BQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsQ0FBbUJQLGFBQW5CLElBQW9DRCxLQUFwQztBQUVBRSxNQUFBQSxNQUFNLENBQUNtQixjQUFQLENBQXNCLEtBQUtyRCxLQUFMLENBQVdFLE1BQWpDLEVBQXlDLHFCQUF6QyxFQUFnRXNDLFNBQWhFLEVBQTJFcEMsS0FBM0UsQ0FBaUZSLENBQUMsSUFBSTtBQUNsRmEsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNkLENBQWQ7QUFFQSxjQUFNVSxXQUFXLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBcEI7O0FBQ0FHLHVCQUFNQyxtQkFBTixDQUEwQiwyQkFBMUIsRUFBdUQsRUFBdkQsRUFBMkROLFdBQTNELEVBQXdFO0FBQ3BFTyxVQUFBQSxLQUFLLEVBQUUseUJBQUcsNEJBQUgsQ0FENkQ7QUFFcEVDLFVBQUFBLFdBQVcsRUFBRSx5QkFDVCxtRkFDQSw0QkFGUztBQUZ1RCxTQUF4RTtBQU9ILE9BWEQ7QUFZSCxLQW5HNkQ7QUFBQTs7QUFLOUR3QyxFQUFBQSxpQkFBaUI7QUFBQTtBQUFTO0FBQ3RCekQscUNBQWdCQyxHQUFoQixHQUFzQnlELEVBQXRCLENBQXlCLG1CQUF6QixFQUE4QyxLQUFLQyxpQkFBbkQ7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CO0FBQUE7QUFBUztBQUN6QixVQUFNdkIsTUFBTSxHQUFHckMsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFFBQUlvQyxNQUFKLEVBQVk7QUFDUkEsTUFBQUEsTUFBTSxDQUFDd0IsY0FBUCxDQUFzQixtQkFBdEIsRUFBMkMsS0FBS0YsaUJBQWhEO0FBQ0g7QUFDSjs7QUFPREcsRUFBQUEsd0JBQXdCLENBQUNDLGFBQUQsRUFBZ0JDLFVBQWhCLEVBQTRCQyxXQUE1QixFQUF5QztBQUM3RCxTQUFLLE1BQU1DLFlBQVgsSUFBMkJyQixNQUFNLENBQUNzQixJQUFQLENBQVkvRSxjQUFaLENBQTNCLEVBQXdEO0FBQ3BELFVBQUksRUFBRThFLFlBQVksSUFBSUgsYUFBbEIsQ0FBSixFQUFzQztBQUNsQ0EsUUFBQUEsYUFBYSxDQUFDRyxZQUFELENBQWIsR0FBK0I5RSxjQUFjLENBQUM4RSxZQUFELENBQWQsQ0FBNkI3RSxPQUE3QixHQUF1QzJFLFVBQXZDLEdBQW9EQyxXQUFuRjtBQUNIO0FBQ0o7QUFDSjs7QUEwRUQvQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNa0QsYUFBYSxHQUFHMUQsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHdCQUFqQixDQUF0Qjs7QUFFQSxVQUFNMEIsTUFBTSxHQUFHckMsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFVBQU1xQyxJQUFJLEdBQUdELE1BQU0sQ0FBQ0UsT0FBUCxDQUFlLEtBQUtwQyxLQUFMLENBQVdFLE1BQTFCLENBQWI7QUFDQSxVQUFNbUMsT0FBTyxHQUFHRixJQUFJLENBQUNHLFlBQUwsQ0FBa0JDLGNBQWxCLENBQWlDLHFCQUFqQyxFQUF3RCxFQUF4RCxDQUFoQjtBQUNBLFVBQU1DLFNBQVMsR0FBR0gsT0FBTyxHQUFJQSxPQUFPLENBQUNJLFVBQVIsTUFBd0IsRUFBNUIsR0FBa0MsRUFBM0Q7QUFDQSxVQUFNeUIsZUFBZSxHQUFHL0IsSUFBSSxDQUFDRyxZQUFMLENBQWtCNkIsdUJBQWxCLENBQTBDLHFCQUExQyxFQUFpRWpDLE1BQWpFLENBQXhCO0FBRUEsVUFBTWtDLHFCQUFxQixHQUFHO0FBQzFCLHVCQUFpQjtBQUNiQyxRQUFBQSxJQUFJLEVBQUUseUJBQUcsY0FBSCxDQURPO0FBRWJDLFFBQUFBLFlBQVksRUFBRTtBQUZELE9BRFM7QUFLMUIsd0JBQWtCO0FBQ2RELFFBQUFBLElBQUksRUFBRSx5QkFBRyxlQUFILENBRFE7QUFFZEMsUUFBQUEsWUFBWSxFQUFFO0FBRkEsT0FMUTtBQVMxQixnQkFBVTtBQUNORCxRQUFBQSxJQUFJLEVBQUUseUJBQUcsY0FBSCxDQURBO0FBRU5DLFFBQUFBLFlBQVksRUFBRTtBQUZSLE9BVGdCO0FBYTFCLHVCQUFpQjtBQUNiRCxRQUFBQSxJQUFJLEVBQUUseUJBQUcsaUJBQUgsQ0FETztBQUViQyxRQUFBQSxZQUFZLEVBQUU7QUFGRCxPQWJTO0FBaUIxQixjQUFRO0FBQ0pELFFBQUFBLElBQUksRUFBRSx5QkFBRyxZQUFILENBREY7QUFFSkMsUUFBQUEsWUFBWSxFQUFFO0FBRlYsT0FqQmtCO0FBcUIxQixhQUFPO0FBQ0hELFFBQUFBLElBQUksRUFBRSx5QkFBRyxXQUFILENBREg7QUFFSEMsUUFBQUEsWUFBWSxFQUFFO0FBRlgsT0FyQm1CO0FBeUIxQixnQkFBVTtBQUNORCxRQUFBQSxJQUFJLEVBQUUseUJBQUcsaUJBQUgsQ0FEQTtBQUVOQyxRQUFBQSxZQUFZLEVBQUU7QUFGUixPQXpCZ0I7QUE2QjFCLDRCQUFzQjtBQUNsQkQsUUFBQUEsSUFBSSxFQUFFLHlCQUFHLGlCQUFILENBRFk7QUFFbEJDLFFBQUFBLFlBQVksRUFBRTtBQUZJO0FBN0JJLEtBQTlCO0FBbUNBLFVBQU1DLFlBQVksR0FBRy9CLFNBQVMsQ0FBQ2dDLE1BQVYsSUFBb0IsRUFBekM7QUFDQSxVQUFNQyxVQUFVLEdBQUdqQyxTQUFTLENBQUNrQyxLQUFWLElBQW1CLEVBQXRDO0FBQ0EsVUFBTUMsUUFBUSxHQUFHeEYsbUJBQW1CLENBQUNxRCxTQUFTLENBQUNvQyxHQUFYLEVBQWdCUixxQkFBcUIsQ0FBQ1EsR0FBdEIsQ0FBMEJOLFlBQTFDLENBQXBDO0FBQ0EsVUFBTU8sZ0JBQWdCLEdBQUcxRixtQkFBbUIsQ0FDeENxRCxTQUFTLENBQUNzQyxhQUQ4QixFQUV4Q1YscUJBQXFCLENBQUNVLGFBQXRCLENBQW9DUixZQUZJLENBQTVDO0FBS0EsUUFBSVMsZ0JBQWdCLEdBQUdOLFVBQVUsQ0FBQ3ZDLE1BQU0sQ0FBQzhDLFNBQVAsRUFBRCxDQUFqQzs7QUFDQSxRQUFJRCxnQkFBZ0IsS0FBS0UsU0FBekIsRUFBb0M7QUFDaENGLE1BQUFBLGdCQUFnQixHQUFHRixnQkFBbkI7QUFDSDs7QUFFRCxTQUFLbEIsd0JBQUwsQ0FDSVksWUFESixFQUVJcEYsbUJBQW1CLENBQUNxRCxTQUFTLENBQUMwQyxhQUFYLEVBQTBCZCxxQkFBcUIsQ0FBQ2MsYUFBdEIsQ0FBb0NaLFlBQTlELENBRnZCLEVBR0luRixtQkFBbUIsQ0FBQ3FELFNBQVMsQ0FBQzJDLGNBQVgsRUFBMkJmLHFCQUFxQixDQUFDZSxjQUF0QixDQUFxQ2IsWUFBaEUsQ0FIdkI7O0FBTUEsUUFBSWMsc0JBQXNCLGdCQUFHLDBDQUFNLHlCQUFHLGdEQUFILENBQU4sQ0FBN0I7O0FBQ0EsUUFBSUMsaUJBQUo7O0FBQ0EsUUFBSTNDLE1BQU0sQ0FBQ3NCLElBQVAsQ0FBWVMsVUFBWixFQUF3QjFCLE1BQTVCLEVBQW9DO0FBQ2hDLFlBQU11QyxlQUFlLEdBQUcsRUFBeEI7QUFDQSxZQUFNQyxVQUFVLEdBQUcsRUFBbkI7QUFFQTdDLE1BQUFBLE1BQU0sQ0FBQ3NCLElBQVAsQ0FBWVMsVUFBWixFQUF3QmUsT0FBeEIsQ0FBaUNDLElBQUQsSUFBVTtBQUN0QyxjQUFNQyxTQUFTLEdBQUdqQixVQUFVLENBQUNnQixJQUFELENBQVYsR0FBbUJWLGdCQUFuQixJQUF1Q2IsZUFBekQ7O0FBQ0EsWUFBSU8sVUFBVSxDQUFDZ0IsSUFBRCxDQUFWLEdBQW1CWixnQkFBdkIsRUFBeUM7QUFBRTtBQUN2Q1MsVUFBQUEsZUFBZSxDQUFDSyxJQUFoQixlQUNJLDZCQUFDLGFBQUQ7QUFDSSxZQUFBLEtBQUssRUFBRWxCLFVBQVUsQ0FBQ2dCLElBQUQsQ0FEckI7QUFFSSxZQUFBLFFBQVEsRUFBRSxDQUFDQyxTQUZmO0FBR0ksWUFBQSxLQUFLLEVBQUVELElBSFg7QUFJSSxZQUFBLEdBQUcsRUFBRUEsSUFKVDtBQUtJLFlBQUEsYUFBYSxFQUFFQSxJQUxuQixDQUt5QjtBQUx6QjtBQU1JLFlBQUEsUUFBUSxFQUFFLEtBQUtHO0FBTm5CLFlBREo7QUFVSCxTQVhELE1BV08sSUFBSW5CLFVBQVUsQ0FBQ2dCLElBQUQsQ0FBVixHQUFtQlosZ0JBQXZCLEVBQXlDO0FBQUU7QUFDOUNVLFVBQUFBLFVBQVUsQ0FBQ0ksSUFBWCxlQUNJLDZCQUFDLGFBQUQ7QUFDSSxZQUFBLEtBQUssRUFBRWxCLFVBQVUsQ0FBQ2dCLElBQUQsQ0FEckI7QUFFSSxZQUFBLFFBQVEsRUFBRSxDQUFDQyxTQUZmO0FBR0ksWUFBQSxLQUFLLEVBQUVELElBSFg7QUFJSSxZQUFBLEdBQUcsRUFBRUEsSUFKVDtBQUtJLFlBQUEsYUFBYSxFQUFFQSxJQUxuQixDQUt5QjtBQUx6QjtBQU1JLFlBQUEsUUFBUSxFQUFFLEtBQUtHO0FBTm5CLFlBREo7QUFVSDtBQUNKLE9BekJELEVBSmdDLENBK0JoQzs7QUFDQSxZQUFNQyxVQUFVLEdBQUcsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLEtBQVU7QUFDekIsY0FBTUMsTUFBTSxHQUFHdkIsVUFBVSxDQUFDc0IsQ0FBQyxDQUFDM0MsR0FBSCxDQUFWLEdBQW9CcUIsVUFBVSxDQUFDcUIsQ0FBQyxDQUFDMUMsR0FBSCxDQUE3QztBQUNBLGVBQU80QyxNQUFNLEtBQUssQ0FBWCxHQUFlQSxNQUFmLEdBQXdCRixDQUFDLENBQUMxQyxHQUFGLENBQU02QyxpQkFBTixHQUEwQkMsYUFBMUIsQ0FBd0NILENBQUMsQ0FBQzNDLEdBQUYsQ0FBTTZDLGlCQUFOLEVBQXhDLENBQS9CO0FBQ0gsT0FIRDs7QUFLQVgsTUFBQUEsZUFBZSxDQUFDYSxJQUFoQixDQUFxQk4sVUFBckI7QUFDQU4sTUFBQUEsVUFBVSxDQUFDWSxJQUFYLENBQWdCTixVQUFoQjs7QUFFQSxVQUFJUCxlQUFlLENBQUN2QyxNQUFwQixFQUE0QjtBQUN4QnFDLFFBQUFBLHNCQUFzQixnQkFDbEI7QUFBSyxVQUFBLFNBQVMsRUFBQztBQUFmLHdCQUNJO0FBQUssVUFBQSxTQUFTLEVBQUM7QUFBZixXQUE2Qyx5QkFBRyxrQkFBSCxDQUE3QyxDQURKLEVBRUtFLGVBRkwsQ0FESjtBQUtIOztBQUNELFVBQUlDLFVBQVUsQ0FBQ3hDLE1BQWYsRUFBdUI7QUFDbkJzQyxRQUFBQSxpQkFBaUIsZ0JBQ2I7QUFBSyxVQUFBLFNBQVMsRUFBQztBQUFmLHdCQUNJO0FBQUssVUFBQSxTQUFTLEVBQUM7QUFBZixXQUE2Qyx5QkFBRyxhQUFILENBQTdDLENBREosRUFFS0UsVUFGTCxDQURKO0FBS0g7QUFDSjs7QUFFRCxVQUFNYSxNQUFNLEdBQUdqRSxJQUFJLENBQUNrRSx3QkFBTCxDQUE4QixLQUE5QixDQUFmO0FBQ0EsUUFBSUMsa0JBQUo7O0FBQ0EsUUFBSUYsTUFBTSxDQUFDckQsTUFBWCxFQUFtQjtBQUNmLFlBQU13RCxXQUFXLEdBQUd4QixnQkFBZ0IsSUFBSUosUUFBeEM7QUFDQTJCLE1BQUFBLGtCQUFrQixnQkFDZDtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0k7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLFNBQTZDLHlCQUFHLGNBQUgsQ0FBN0MsQ0FESixlQUVJLHlDQUNLRixNQUFNLENBQUNJLEdBQVAsQ0FBWXZHLE1BQUQsSUFBWTtBQUNwQixjQUFNd0csUUFBUSxHQUFHeEcsTUFBTSxDQUFDdUUsTUFBUCxDQUFjdkUsTUFBZCxDQUFxQndDLFVBQXJCLEVBQWpCO0FBQ0EsY0FBTWlFLE1BQU0sR0FBR3ZFLElBQUksQ0FBQ3dFLFNBQUwsQ0FBZTFHLE1BQU0sQ0FBQ3VFLE1BQVAsQ0FBY3ZFLE1BQWQsQ0FBcUIyRyxTQUFyQixFQUFmLENBQWY7QUFDQSxZQUFJQyxRQUFRLEdBQUc1RyxNQUFNLENBQUN1RSxNQUFQLENBQWN2RSxNQUFkLENBQXFCMkcsU0FBckIsRUFBZixDQUhvQixDQUc2Qjs7QUFDakQsWUFBSUYsTUFBSixFQUFZRyxRQUFRLEdBQUdILE1BQU0sQ0FBQ3ZGLElBQWxCO0FBQ1osNEJBQ0ksNkJBQUMsVUFBRDtBQUFZLFVBQUEsR0FBRyxFQUFFbEIsTUFBTSxDQUFDRSxNQUF4QjtBQUFnQyxVQUFBLFFBQVEsRUFBRW9HLFdBQTFDO0FBQ1ksVUFBQSxNQUFNLEVBQUV0RyxNQURwQjtBQUM0QixVQUFBLE1BQU0sRUFBRXdHLFFBQVEsQ0FBQ25GLE1BRDdDO0FBRVksVUFBQSxFQUFFLEVBQUV1RjtBQUZoQixVQURKO0FBS0gsT0FWQSxDQURMLENBRkosQ0FESjtBQWlCSDs7QUFFRCxVQUFNQyxjQUFjLEdBQUdwRSxNQUFNLENBQUNzQixJQUFQLENBQVlJLHFCQUFaLEVBQW1Db0MsR0FBbkMsQ0FBdUMsQ0FBQ3BELEdBQUQsRUFBTTJELEtBQU4sS0FBZ0I7QUFDMUUsWUFBTUMsVUFBVSxHQUFHNUMscUJBQXFCLENBQUNoQixHQUFELENBQXhDO0FBRUEsWUFBTUosT0FBTyxHQUFHSSxHQUFHLENBQUNILEtBQUosQ0FBVSxHQUFWLENBQWhCO0FBQ0EsVUFBSUUsVUFBVSxHQUFHWCxTQUFqQjs7QUFDQSxXQUFLLE1BQU15RSxJQUFYLElBQW1CakUsT0FBbkIsRUFBNEI7QUFDeEIsWUFBSUcsVUFBVSxLQUFLOEIsU0FBbkIsRUFBOEI7QUFDMUI7QUFDSDs7QUFDRDlCLFFBQUFBLFVBQVUsR0FBR0EsVUFBVSxDQUFDOEQsSUFBRCxDQUF2QjtBQUNIOztBQUVELFlBQU1qRixLQUFLLEdBQUc3QyxtQkFBbUIsQ0FBQ2dFLFVBQUQsRUFBYTZELFVBQVUsQ0FBQzFDLFlBQXhCLENBQWpDO0FBQ0EsMEJBQU87QUFBSyxRQUFBLEdBQUcsRUFBRXlDLEtBQVY7QUFBaUIsUUFBQSxTQUFTLEVBQUM7QUFBM0Isc0JBQ0gsNkJBQUMsYUFBRDtBQUNJLFFBQUEsS0FBSyxFQUFFQyxVQUFVLENBQUMzQyxJQUR0QjtBQUVJLFFBQUEsS0FBSyxFQUFFckMsS0FGWDtBQUdJLFFBQUEsWUFBWSxFQUFFNkMsZ0JBSGxCO0FBSUksUUFBQSxRQUFRLEVBQUUsQ0FBQ1gsZUFBRCxJQUFvQmEsZ0JBQWdCLEdBQUcvQyxLQUpyRDtBQUtJLFFBQUEsYUFBYSxFQUFFb0IsR0FMbkIsQ0FLd0I7QUFMeEI7QUFNSSxRQUFBLFFBQVEsRUFBRSxLQUFLOEQ7QUFObkIsUUFERyxDQUFQO0FBVUgsS0F2QnNCLENBQXZCLENBaEpLLENBeUtMOztBQUNBLFFBQUloRixNQUFNLENBQUNpRixlQUFQLENBQXVCLEtBQUtuSCxLQUFMLENBQVdFLE1BQWxDLENBQUosRUFBK0M7QUFDM0MsYUFBT3FFLFlBQVksQ0FBQyxtQkFBRCxDQUFuQjtBQUNIOztBQUVELFVBQU02QyxtQkFBbUIsR0FBRzFFLE1BQU0sQ0FBQ3NCLElBQVAsQ0FBWU8sWUFBWixFQUEwQmlDLEdBQTFCLENBQThCLENBQUNhLFNBQUQsRUFBWUMsQ0FBWixLQUFrQjtBQUN4RSxVQUFJQyxLQUFLLEdBQUd2SSxnQkFBZ0IsQ0FBQ3FJLFNBQUQsQ0FBNUI7O0FBQ0EsVUFBSUUsS0FBSixFQUFXO0FBQ1BBLFFBQUFBLEtBQUssR0FBRyx5QkFBR0EsS0FBSCxDQUFSO0FBQ0gsT0FGRCxNQUVPO0FBQ0hBLFFBQUFBLEtBQUssR0FBRyx5QkFBRywyQkFBSCxFQUFnQztBQUFDRixVQUFBQTtBQUFELFNBQWhDLENBQVI7QUFDSDs7QUFDRCwwQkFDSTtBQUFLLFFBQUEsU0FBUyxFQUFDLEVBQWY7QUFBa0IsUUFBQSxHQUFHLEVBQUVBO0FBQXZCLHNCQUNJLDZCQUFDLGFBQUQ7QUFDSSxRQUFBLEtBQUssRUFBRUUsS0FEWDtBQUVJLFFBQUEsS0FBSyxFQUFFaEQsWUFBWSxDQUFDOEMsU0FBRCxDQUZ2QjtBQUdJLFFBQUEsWUFBWSxFQUFFeEMsZ0JBSGxCO0FBSUksUUFBQSxRQUFRLEVBQUUsQ0FBQ1gsZUFBRCxJQUFvQmEsZ0JBQWdCLEdBQUdSLFlBQVksQ0FBQzhDLFNBQUQsQ0FKakU7QUFLSSxRQUFBLGFBQWEsRUFBRSxrQkFBa0JBLFNBTHJDO0FBTUksUUFBQSxRQUFRLEVBQUUsS0FBS0g7QUFObkIsUUFESixDQURKO0FBWUgsS0FuQjJCLENBQTVCO0FBcUJBLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBeUMseUJBQUcscUJBQUgsQ0FBekMsQ0FESixFQUVLOUIsc0JBRkwsRUFHS0MsaUJBSEwsRUFJS2lCLGtCQUpMLGVBS0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsT0FBNkMseUJBQUcsYUFBSCxDQUE3QyxDQURKLGVBRUksd0NBQUkseUJBQUcsK0RBQUgsQ0FBSixDQUZKLEVBR0tRLGNBSEwsRUFJS00sbUJBSkwsQ0FMSixDQURKO0FBY0g7O0FBdFQ2RDs7OzhCQUE3Q3hGLG9CLGVBQ0U7QUFDZjFCLEVBQUFBLE1BQU0sRUFBRXFCLG1CQUFVSSxNQUFWLENBQWlCRDtBQURWLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3QsIF90ZH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vLi4vLi5cIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi8uLi8uLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL01vZGFsXCI7XG5cbmNvbnN0IHBsRXZlbnRzVG9MYWJlbHMgPSB7XG4gICAgLy8gVGhlc2Ugd2lsbCBiZSB0cmFuc2xhdGVkIGZvciB1cyBsYXRlci5cbiAgICBcIm0ucm9vbS5hdmF0YXJcIjogX3RkKFwiQ2hhbmdlIHJvb20gYXZhdGFyXCIpLFxuICAgIFwibS5yb29tLm5hbWVcIjogX3RkKFwiQ2hhbmdlIHJvb20gbmFtZVwiKSxcbiAgICBcIm0ucm9vbS5jYW5vbmljYWxfYWxpYXNcIjogX3RkKFwiQ2hhbmdlIG1haW4gYWRkcmVzcyBmb3IgdGhlIHJvb21cIiksXG4gICAgXCJtLnJvb20uaGlzdG9yeV92aXNpYmlsaXR5XCI6IF90ZChcIkNoYW5nZSBoaXN0b3J5IHZpc2liaWxpdHlcIiksXG4gICAgXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCI6IF90ZChcIkNoYW5nZSBwZXJtaXNzaW9uc1wiKSxcbiAgICBcIm0ucm9vbS50b3BpY1wiOiBfdGQoXCJDaGFuZ2UgdG9waWNcIiksXG4gICAgXCJtLnJvb20udG9tYnN0b25lXCI6IF90ZChcIlVwZ3JhZGUgdGhlIHJvb21cIiksXG4gICAgXCJtLnJvb20uZW5jcnlwdGlvblwiOiBfdGQoXCJFbmFibGUgcm9vbSBlbmNyeXB0aW9uXCIpLFxuXG4gICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0ud2lkZ2V0IGV2ZW50IHR5cGUgKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzEzMTExKVxuICAgIFwiaW0udmVjdG9yLm1vZHVsYXIud2lkZ2V0c1wiOiBfdGQoXCJNb2RpZnkgd2lkZ2V0c1wiKSxcbn07XG5cbmNvbnN0IHBsRXZlbnRzVG9TaG93ID0ge1xuICAgIC8vIElmIGFuIGV2ZW50IGlzIGxpc3RlZCBoZXJlLCBpdCB3aWxsIGJlIHNob3duIGluIHRoZSBQTCBzZXR0aW5ncy4gRGVmYXVsdHMgd2lsbCBiZSBjYWxjdWxhdGVkLlxuICAgIFwibS5yb29tLmF2YXRhclwiOiB7aXNTdGF0ZTogdHJ1ZX0sXG4gICAgXCJtLnJvb20ubmFtZVwiOiB7aXNTdGF0ZTogdHJ1ZX0sXG4gICAgXCJtLnJvb20uY2Fub25pY2FsX2FsaWFzXCI6IHtpc1N0YXRlOiB0cnVlfSxcbiAgICBcIm0ucm9vbS5oaXN0b3J5X3Zpc2liaWxpdHlcIjoge2lzU3RhdGU6IHRydWV9LFxuICAgIFwibS5yb29tLnBvd2VyX2xldmVsc1wiOiB7aXNTdGF0ZTogdHJ1ZX0sXG4gICAgXCJtLnJvb20udG9waWNcIjoge2lzU3RhdGU6IHRydWV9LFxuICAgIFwibS5yb29tLnRvbWJzdG9uZVwiOiB7aXNTdGF0ZTogdHJ1ZX0sXG4gICAgXCJtLnJvb20uZW5jcnlwdGlvblwiOiB7aXNTdGF0ZTogdHJ1ZX0sXG5cbiAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS53aWRnZXQgZXZlbnQgdHlwZSAoaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTMxMTEpXG4gICAgXCJpbS52ZWN0b3IubW9kdWxhci53aWRnZXRzXCI6IHtpc1N0YXRlOiB0cnVlfSxcbn07XG5cbi8vIHBhcnNlIGEgc3RyaW5nIGFzIGFuIGludGVnZXI7IGlmIHRoZSBpbnB1dCBpcyB1bmRlZmluZWQsIG9yIGNhbm5vdCBiZSBwYXJzZWRcbi8vIGFzIGFuIGludGVnZXIsIHJldHVybiBhIGRlZmF1bHQuXG5mdW5jdGlvbiBwYXJzZUludFdpdGhEZWZhdWx0KHZhbCwgZGVmKSB7XG4gICAgY29uc3QgcmVzID0gcGFyc2VJbnQodmFsKTtcbiAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcbn1cblxuZXhwb3J0IGNsYXNzIEJhbm5lZFVzZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGNhblVuYmFuOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgbWVtYmVyOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsIC8vIGpzLXNkayBSb29tTWVtYmVyXG4gICAgICAgIGJ5OiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHJlYXNvbjogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9O1xuXG4gICAgX29uVW5iYW5DbGljayA9IChlKSA9PiB7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS51bmJhbih0aGlzLnByb3BzLm1lbWJlci5yb29tSWQsIHRoaXMucHJvcHMubWVtYmVyLnVzZXJJZCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gdW5iYW46IFwiICsgZXJyKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byB1bmJhbicsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXJyb3InKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0ZhaWxlZCB0byB1bmJhbicpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCB1bmJhbkJ1dHRvbjtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5jYW5VbmJhbikge1xuICAgICAgICAgICAgdW5iYW5CdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD0nZGFuZ2VyX3NtJyBvbkNsaWNrPXt0aGlzLl9vblVuYmFuQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPSdteF9Sb2xlc1Jvb21TZXR0aW5nc1RhYl91bmJhbkJ0bic+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1VuYmFuJykgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VySWQgPSB0aGlzLnByb3BzLm1lbWJlci5uYW1lID09PSB0aGlzLnByb3BzLm1lbWJlci51c2VySWQgPyBudWxsIDogdGhpcy5wcm9wcy5tZW1iZXIudXNlcklkO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIHt1bmJhbkJ1dHRvbn1cbiAgICAgICAgICAgICAgICA8c3BhbiB0aXRsZT17X3QoXCJCYW5uZWQgYnkgJShkaXNwbGF5TmFtZSlzXCIsIHtkaXNwbGF5TmFtZTogdGhpcy5wcm9wcy5ieX0pfT5cbiAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz57IHRoaXMucHJvcHMubWVtYmVyLm5hbWUgfTwvc3Ryb25nPiB7dXNlcklkfVxuICAgICAgICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5yZWFzb24gPyBcIiBcIiArIF90KCdSZWFzb24nKSArIFwiOiBcIiArIHRoaXMucHJvcHMucmVhc29uIDogXCJcIn1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUm9sZXNSb29tU2V0dGluZ3NUYWIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpOiB2b2lkIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbVN0YXRlLm1lbWJlcnNcIiwgdGhpcy5fb25Sb29tTWVtYmVyc2hpcCk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaWVudCkge1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLm1lbWJlcnNcIiwgdGhpcy5fb25Sb29tTWVtYmVyc2hpcCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Sb29tTWVtYmVyc2hpcCA9IChldmVudCwgc3RhdGUsIG1lbWJlcikgPT4ge1xuICAgICAgICBpZiAoc3RhdGUucm9vbUlkICE9PSB0aGlzLnByb3BzLnJvb21JZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfTtcblxuICAgIF9wb3B1bGF0ZURlZmF1bHRQbEV2ZW50cyhldmVudHNTZWN0aW9uLCBzdGF0ZUxldmVsLCBldmVudHNMZXZlbCkge1xuICAgICAgICBmb3IgKGNvbnN0IGRlc2lyZWRFdmVudCBvZiBPYmplY3Qua2V5cyhwbEV2ZW50c1RvU2hvdykpIHtcbiAgICAgICAgICAgIGlmICghKGRlc2lyZWRFdmVudCBpbiBldmVudHNTZWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50c1NlY3Rpb25bZGVzaXJlZEV2ZW50XSA9IChwbEV2ZW50c1RvU2hvd1tkZXNpcmVkRXZlbnRdLmlzU3RhdGUgPyBzdGF0ZUxldmVsIDogZXZlbnRzTGV2ZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUG93ZXJMZXZlbHNDaGFuZ2VkID0gKHZhbHVlLCBwb3dlckxldmVsS2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3Qgcm9vbSA9IGNsaWVudC5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgY29uc3QgcGxFdmVudCA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdtLnJvb20ucG93ZXJfbGV2ZWxzJywgJycpO1xuICAgICAgICBsZXQgcGxDb250ZW50ID0gcGxFdmVudCA/IChwbEV2ZW50LmdldENvbnRlbnQoKSB8fCB7fSkgOiB7fTtcblxuICAgICAgICAvLyBDbG9uZSB0aGUgcG93ZXIgbGV2ZWxzIGp1c3QgaW4gY2FzZVxuICAgICAgICBwbENvbnRlbnQgPSBPYmplY3QuYXNzaWduKHt9LCBwbENvbnRlbnQpO1xuXG4gICAgICAgIGNvbnN0IGV2ZW50c0xldmVsUHJlZml4ID0gXCJldmVudF9sZXZlbHNfXCI7XG5cbiAgICAgICAgdmFsdWUgPSBwYXJzZUludCh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKHBvd2VyTGV2ZWxLZXkuc3RhcnRzV2l0aChldmVudHNMZXZlbFByZWZpeCkpIHtcbiAgICAgICAgICAgIC8vIGRlZXAgY29weSBcImV2ZW50c1wiIG9iamVjdCwgT2JqZWN0LmFzc2lnbiBpdHNlbGYgd29uJ3QgZGVlcCBjb3B5XG4gICAgICAgICAgICBwbENvbnRlbnRbXCJldmVudHNcIl0gPSBPYmplY3QuYXNzaWduKHt9LCBwbENvbnRlbnRbXCJldmVudHNcIl0gfHwge30pO1xuICAgICAgICAgICAgcGxDb250ZW50W1wiZXZlbnRzXCJdW3Bvd2VyTGV2ZWxLZXkuc2xpY2UoZXZlbnRzTGV2ZWxQcmVmaXgubGVuZ3RoKV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGtleVBhdGggPSBwb3dlckxldmVsS2V5LnNwbGl0KCcuJyk7XG4gICAgICAgICAgICBsZXQgcGFyZW50T2JqO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRPYmogPSBwbENvbnRlbnQ7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlQYXRoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50T2JqW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE9ialtrZXldID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudE9iaiA9IGN1cnJlbnRPYmo7XG4gICAgICAgICAgICAgICAgY3VycmVudE9iaiA9IGN1cnJlbnRPYmpba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudE9ialtrZXlQYXRoW2tleVBhdGgubGVuZ3RoIC0gMV1dID0gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjbGllbnQuc2VuZFN0YXRlRXZlbnQodGhpcy5wcm9wcy5yb29tSWQsIFwibS5yb29tLnBvd2VyX2xldmVsc1wiLCBwbENvbnRlbnQpLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcblxuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1Bvd2VyIGxldmVsIHJlcXVpcmVtZW50IGNoYW5nZSBmYWlsZWQnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0Vycm9yIGNoYW5naW5nIHBvd2VyIGxldmVsIHJlcXVpcmVtZW50JyksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIkFuIGVycm9yIG9jY3VycmVkIGNoYW5naW5nIHRoZSByb29tJ3MgcG93ZXIgbGV2ZWwgcmVxdWlyZW1lbnRzLiBFbnN1cmUgeW91IGhhdmUgc3VmZmljaWVudCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwicGVybWlzc2lvbnMgYW5kIHRyeSBhZ2Fpbi5cIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25Vc2VyUG93ZXJMZXZlbENoYW5nZWQgPSAodmFsdWUsIHBvd2VyTGV2ZWxLZXkpID0+IHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICBjb25zdCBwbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5wb3dlcl9sZXZlbHMnLCAnJyk7XG4gICAgICAgIGxldCBwbENvbnRlbnQgPSBwbEV2ZW50ID8gKHBsRXZlbnQuZ2V0Q29udGVudCgpIHx8IHt9KSA6IHt9O1xuXG4gICAgICAgIC8vIENsb25lIHRoZSBwb3dlciBsZXZlbHMganVzdCBpbiBjYXNlXG4gICAgICAgIHBsQ29udGVudCA9IE9iamVjdC5hc3NpZ24oe30sIHBsQ29udGVudCk7XG5cbiAgICAgICAgLy8gcG93ZXJMZXZlbEtleSBzaG91bGQgYmUgYSB1c2VyIElEXG4gICAgICAgIGlmICghcGxDb250ZW50Wyd1c2VycyddKSBwbENvbnRlbnRbJ3VzZXJzJ10gPSB7fTtcbiAgICAgICAgcGxDb250ZW50Wyd1c2VycyddW3Bvd2VyTGV2ZWxLZXldID0gdmFsdWU7XG5cbiAgICAgICAgY2xpZW50LnNlbmRTdGF0ZUV2ZW50KHRoaXMucHJvcHMucm9vbUlkLCBcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgcGxDb250ZW50KS5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdQb3dlciBsZXZlbCBjaGFuZ2UgZmFpbGVkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KCdFcnJvciBjaGFuZ2luZyBwb3dlciBsZXZlbCcpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJBbiBlcnJvciBvY2N1cnJlZCBjaGFuZ2luZyB0aGUgdXNlcidzIHBvd2VyIGxldmVsLiBFbnN1cmUgeW91IGhhdmUgc3VmZmljaWVudCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwicGVybWlzc2lvbnMgYW5kIHRyeSBhZ2Fpbi5cIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IFBvd2VyU2VsZWN0b3IgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5Qb3dlclNlbGVjdG9yJyk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICBjb25zdCBwbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5wb3dlcl9sZXZlbHMnLCAnJyk7XG4gICAgICAgIGNvbnN0IHBsQ29udGVudCA9IHBsRXZlbnQgPyAocGxFdmVudC5nZXRDb250ZW50KCkgfHwge30pIDoge307XG4gICAgICAgIGNvbnN0IGNhbkNoYW5nZUxldmVscyA9IHJvb20uY3VycmVudFN0YXRlLm1heUNsaWVudFNlbmRTdGF0ZUV2ZW50KCdtLnJvb20ucG93ZXJfbGV2ZWxzJywgY2xpZW50KTtcblxuICAgICAgICBjb25zdCBwb3dlckxldmVsRGVzY3JpcHRvcnMgPSB7XG4gICAgICAgICAgICBcInVzZXJzX2RlZmF1bHRcIjoge1xuICAgICAgICAgICAgICAgIGRlc2M6IF90KCdEZWZhdWx0IHJvbGUnKSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJldmVudHNfZGVmYXVsdFwiOiB7XG4gICAgICAgICAgICAgICAgZGVzYzogX3QoJ1NlbmQgbWVzc2FnZXMnKSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJpbnZpdGVcIjoge1xuICAgICAgICAgICAgICAgIGRlc2M6IF90KCdJbnZpdGUgdXNlcnMnKSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IDUwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3RhdGVfZGVmYXVsdFwiOiB7XG4gICAgICAgICAgICAgICAgZGVzYzogX3QoJ0NoYW5nZSBzZXR0aW5ncycpLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogNTAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJraWNrXCI6IHtcbiAgICAgICAgICAgICAgICBkZXNjOiBfdCgnS2ljayB1c2VycycpLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogNTAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJiYW5cIjoge1xuICAgICAgICAgICAgICAgIGRlc2M6IF90KCdCYW4gdXNlcnMnKSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IDUwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicmVkYWN0XCI6IHtcbiAgICAgICAgICAgICAgICBkZXNjOiBfdCgnUmVtb3ZlIG1lc3NhZ2VzJyksXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiA1MCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm5vdGlmaWNhdGlvbnMucm9vbVwiOiB7XG4gICAgICAgICAgICAgICAgZGVzYzogX3QoJ05vdGlmeSBldmVyeW9uZScpLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogNTAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGV2ZW50c0xldmVscyA9IHBsQ29udGVudC5ldmVudHMgfHwge307XG4gICAgICAgIGNvbnN0IHVzZXJMZXZlbHMgPSBwbENvbnRlbnQudXNlcnMgfHwge307XG4gICAgICAgIGNvbnN0IGJhbkxldmVsID0gcGFyc2VJbnRXaXRoRGVmYXVsdChwbENvbnRlbnQuYmFuLCBwb3dlckxldmVsRGVzY3JpcHRvcnMuYmFuLmRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRVc2VyTGV2ZWwgPSBwYXJzZUludFdpdGhEZWZhdWx0KFxuICAgICAgICAgICAgcGxDb250ZW50LnVzZXJzX2RlZmF1bHQsXG4gICAgICAgICAgICBwb3dlckxldmVsRGVzY3JpcHRvcnMudXNlcnNfZGVmYXVsdC5kZWZhdWx0VmFsdWUsXG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IGN1cnJlbnRVc2VyTGV2ZWwgPSB1c2VyTGV2ZWxzW2NsaWVudC5nZXRVc2VySWQoKV07XG4gICAgICAgIGlmIChjdXJyZW50VXNlckxldmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN1cnJlbnRVc2VyTGV2ZWwgPSBkZWZhdWx0VXNlckxldmVsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcG9wdWxhdGVEZWZhdWx0UGxFdmVudHMoXG4gICAgICAgICAgICBldmVudHNMZXZlbHMsXG4gICAgICAgICAgICBwYXJzZUludFdpdGhEZWZhdWx0KHBsQ29udGVudC5zdGF0ZV9kZWZhdWx0LCBwb3dlckxldmVsRGVzY3JpcHRvcnMuc3RhdGVfZGVmYXVsdC5kZWZhdWx0VmFsdWUpLFxuICAgICAgICAgICAgcGFyc2VJbnRXaXRoRGVmYXVsdChwbENvbnRlbnQuZXZlbnRzX2RlZmF1bHQsIHBvd2VyTGV2ZWxEZXNjcmlwdG9ycy5ldmVudHNfZGVmYXVsdC5kZWZhdWx0VmFsdWUpLFxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBwcml2aWxlZ2VkVXNlcnNTZWN0aW9uID0gPGRpdj57X3QoJ05vIHVzZXJzIGhhdmUgc3BlY2lmaWMgcHJpdmlsZWdlcyBpbiB0aGlzIHJvb20nKX08L2Rpdj47XG4gICAgICAgIGxldCBtdXRlZFVzZXJzU2VjdGlvbjtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHVzZXJMZXZlbHMpLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcHJpdmlsZWdlZFVzZXJzID0gW107XG4gICAgICAgICAgICBjb25zdCBtdXRlZFVzZXJzID0gW107XG5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHVzZXJMZXZlbHMpLmZvckVhY2goKHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW5DaGFuZ2UgPSB1c2VyTGV2ZWxzW3VzZXJdIDwgY3VycmVudFVzZXJMZXZlbCAmJiBjYW5DaGFuZ2VMZXZlbHM7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJMZXZlbHNbdXNlcl0gPiBkZWZhdWx0VXNlckxldmVsKSB7IC8vIHByaXZpbGVnZWRcbiAgICAgICAgICAgICAgICAgICAgcHJpdmlsZWdlZFVzZXJzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICA8UG93ZXJTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt1c2VyTGV2ZWxzW3VzZXJdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2FuQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXt1c2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17dXNlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3dlckxldmVsS2V5PXt1c2VyfSAvLyBXaWxsIGJlIHNlbnQgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gYG9uQ2hhbmdlYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vblVzZXJQb3dlckxldmVsQ2hhbmdlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+LFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXNlckxldmVsc1t1c2VyXSA8IGRlZmF1bHRVc2VyTGV2ZWwpIHsgLy8gbXV0ZWRcbiAgICAgICAgICAgICAgICAgICAgbXV0ZWRVc2Vycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgPFBvd2VyU2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dXNlckxldmVsc1t1c2VyXX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17dXNlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3VzZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG93ZXJMZXZlbEtleT17dXNlcn0gLy8gV2lsbCBiZSBzZW50IGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHRvIGBvbkNoYW5nZWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Vc2VyUG93ZXJMZXZlbENoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gY29tcGFyYXRvciBmb3Igc29ydGluZyBQTCB1c2VycyBsZXhpY29ncmFwaGljYWxseSBvbiBQTCBkZXNjZW5kaW5nLCBNWElEIGFzY2VuZGluZy4gKGNhc2UtaW5zZW5zaXRpdmUpXG4gICAgICAgICAgICBjb25zdCBjb21wYXJhdG9yID0gKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbERpZmYgPSB1c2VyTGV2ZWxzW2Iua2V5XSAtIHVzZXJMZXZlbHNbYS5rZXldO1xuICAgICAgICAgICAgICAgIHJldHVybiBwbERpZmYgIT09IDAgPyBwbERpZmYgOiBhLmtleS50b0xvY2FsZUxvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi5rZXkudG9Mb2NhbGVMb3dlckNhc2UoKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBwcml2aWxlZ2VkVXNlcnMuc29ydChjb21wYXJhdG9yKTtcbiAgICAgICAgICAgIG11dGVkVXNlcnMuc29ydChjb21wYXJhdG9yKTtcblxuICAgICAgICAgICAgaWYgKHByaXZpbGVnZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwcml2aWxlZ2VkVXNlcnNTZWN0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcnPnsgX3QoJ1ByaXZpbGVnZWQgVXNlcnMnKSB9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJpdmlsZWdlZFVzZXJzfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobXV0ZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBtdXRlZFVzZXJzU2VjdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uIG14X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nJz57IF90KCdNdXRlZCBVc2VycycpIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttdXRlZFVzZXJzfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiYW5uZWQgPSByb29tLmdldE1lbWJlcnNXaXRoTWVtYmVyc2hpcChcImJhblwiKTtcbiAgICAgICAgbGV0IGJhbm5lZFVzZXJzU2VjdGlvbjtcbiAgICAgICAgaWYgKGJhbm5lZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbkJhblVzZXJzID0gY3VycmVudFVzZXJMZXZlbCA+PSBiYW5MZXZlbDtcbiAgICAgICAgICAgIGJhbm5lZFVzZXJzU2VjdGlvbiA9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+eyBfdCgnQmFubmVkIHVzZXJzJykgfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICB7YmFubmVkLm1hcCgobWVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFuRXZlbnQgPSBtZW1iZXIuZXZlbnRzLm1lbWJlci5nZXRDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VuZGVyID0gcm9vbS5nZXRNZW1iZXIobWVtYmVyLmV2ZW50cy5tZW1iZXIuZ2V0U2VuZGVyKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBiYW5uZWRCeSA9IG1lbWJlci5ldmVudHMubWVtYmVyLmdldFNlbmRlcigpOyAvLyBzdGFydCBieSBmYWxsaW5nIGJhY2sgdG8gbXhpZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZW5kZXIpIGJhbm5lZEJ5ID0gc2VuZGVyLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJhbm5lZFVzZXIga2V5PXttZW1iZXIudXNlcklkfSBjYW5VbmJhbj17Y2FuQmFuVXNlcnN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbWJlcj17bWVtYmVyfSByZWFzb249e2JhbkV2ZW50LnJlYXNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnk9e2Jhbm5lZEJ5fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwb3dlclNlbGVjdG9ycyA9IE9iamVjdC5rZXlzKHBvd2VyTGV2ZWxEZXNjcmlwdG9ycykubWFwKChrZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdG9yID0gcG93ZXJMZXZlbERlc2NyaXB0b3JzW2tleV07XG5cbiAgICAgICAgICAgIGNvbnN0IGtleVBhdGggPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50T2JqID0gcGxDb250ZW50O1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIG9mIGtleVBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE9iaiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJyZW50T2JqID0gY3VycmVudE9ialtwcm9wXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUludFdpdGhEZWZhdWx0KGN1cnJlbnRPYmosIGRlc2NyaXB0b3IuZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2IGtleT17aW5kZXh9IGNsYXNzTmFtZT1cIlwiPlxuICAgICAgICAgICAgICAgIDxQb3dlclNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPXtkZXNjcmlwdG9yLmRlc2N9XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZX1cbiAgICAgICAgICAgICAgICAgICAgdXNlcnNEZWZhdWx0PXtkZWZhdWx0VXNlckxldmVsfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbkNoYW5nZUxldmVscyB8fCBjdXJyZW50VXNlckxldmVsIDwgdmFsdWV9XG4gICAgICAgICAgICAgICAgICAgIHBvd2VyTGV2ZWxLZXk9e2tleX0gLy8gV2lsbCBiZSBzZW50IGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHRvIGBvbkNoYW5nZWBcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUG93ZXJMZXZlbHNDaGFuZ2VkfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGhpZGUgdGhlIHBvd2VyIGxldmVsIHNlbGVjdG9yIGZvciBlbmFibGluZyBFMkVFIGlmIGl0IHRoZSByb29tIGlzIGFscmVhZHkgZW5jcnlwdGVkXG4gICAgICAgIGlmIChjbGllbnQuaXNSb29tRW5jcnlwdGVkKHRoaXMucHJvcHMucm9vbUlkKSkge1xuICAgICAgICAgICAgZGVsZXRlIGV2ZW50c0xldmVsc1tcIm0ucm9vbS5lbmNyeXB0aW9uXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXZlbnRQb3dlclNlbGVjdG9ycyA9IE9iamVjdC5rZXlzKGV2ZW50c0xldmVscykubWFwKChldmVudFR5cGUsIGkpID0+IHtcbiAgICAgICAgICAgIGxldCBsYWJlbCA9IHBsRXZlbnRzVG9MYWJlbHNbZXZlbnRUeXBlXTtcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsID0gX3QobGFiZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYWJlbCA9IF90KFwiU2VuZCAlKGV2ZW50VHlwZSlzIGV2ZW50c1wiLCB7ZXZlbnRUeXBlfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiXCIga2V5PXtldmVudFR5cGV9PlxuICAgICAgICAgICAgICAgICAgICA8UG93ZXJTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e2xhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2V2ZW50c0xldmVsc1tldmVudFR5cGVdfVxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnNEZWZhdWx0PXtkZWZhdWx0VXNlckxldmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFjYW5DaGFuZ2VMZXZlbHMgfHwgY3VycmVudFVzZXJMZXZlbCA8IGV2ZW50c0xldmVsc1tldmVudFR5cGVdfVxuICAgICAgICAgICAgICAgICAgICAgICAgcG93ZXJMZXZlbEtleT17XCJldmVudF9sZXZlbHNfXCIgKyBldmVudFR5cGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Qb3dlckxldmVsc0NoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYiBteF9Sb2xlc1Jvb21TZXR0aW5nc1RhYlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfaGVhZGluZ1wiPntfdChcIlJvbGVzICYgUGVybWlzc2lvbnNcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAge3ByaXZpbGVnZWRVc2Vyc1NlY3Rpb259XG4gICAgICAgICAgICAgICAge211dGVkVXNlcnNTZWN0aW9ufVxuICAgICAgICAgICAgICAgIHtiYW5uZWRVc2Vyc1NlY3Rpb259XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcnPntfdChcIlBlcm1pc3Npb25zXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KCdTZWxlY3QgdGhlIHJvbGVzIHJlcXVpcmVkIHRvIGNoYW5nZSB2YXJpb3VzIHBhcnRzIG9mIHRoZSByb29tJyl9PC9wPlxuICAgICAgICAgICAgICAgICAgICB7cG93ZXJTZWxlY3RvcnN9XG4gICAgICAgICAgICAgICAgICAgIHtldmVudFBvd2VyU2VsZWN0b3JzfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19