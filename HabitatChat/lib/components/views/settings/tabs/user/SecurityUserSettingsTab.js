"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IgnoredUser = void 0;

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../../languageHandler");

var _SettingsStore = _interopRequireWildcard3(require("../../../../../settings/SettingsStore"));

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var FormattingUtils = _interopRequireWildcard3(require("../../../../../utils/FormattingUtils"));

var _AccessibleButton = _interopRequireDefault(require("../../../elements/AccessibleButton"));

var _Analytics = _interopRequireDefault(require("../../../../../Analytics"));

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

var sdk = _interopRequireWildcard3(require("../../../../.."));

var _promise = require("../../../../../utils/promise");

var _dispatcher = _interopRequireDefault(require("../../../../../dispatcher/dispatcher"));

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
class IgnoredUser extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onUnignoreClicked", e => {
      this.props.onUnignored(this.props.userId);
    });
  }

  render() {
    const id = "mx_SecurityUserSettingsTab_ignoredUser_".concat(this.props.userId);
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SecurityUserSettingsTab_ignoredUser"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onUnignoreClicked,
      kind: "primary_sm",
      "aria-describedby": id,
      disabled: this.props.inProgress
    }, (0, _languageHandler._t)('Unignore')), /*#__PURE__*/_react.default.createElement("span", {
      id: id
    }, this.props.userId));
  }

}

exports.IgnoredUser = IgnoredUser;
(0, _defineProperty2.default)(IgnoredUser, "propTypes", {
  userId: _propTypes.default.string.isRequired,
  onUnignored: _propTypes.default.func.isRequired,
  inProgress: _propTypes.default.bool.isRequired
});

class SecurityUserSettingsTab extends _react.default.Component {
  constructor() {
    super(); // Get number of rooms we're invited to

    (0, _defineProperty2.default)(this, "_updateBlacklistDevicesFlag", checked => {
      _MatrixClientPeg.MatrixClientPeg.get().setGlobalBlacklistUnverifiedDevices(checked);
    });
    (0, _defineProperty2.default)(this, "_updateAnalytics", checked => {
      checked ? _Analytics.default.enable() : _Analytics.default.disable();
    });
    (0, _defineProperty2.default)(this, "_onExportE2eKeysClicked", () => {
      _Modal.default.createTrackedDialogAsync('Export E2E Keys', '', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../../../async-components/views/dialogs/ExportE2eKeysDialog'))), {
        matrixClient: _MatrixClientPeg.MatrixClientPeg.get()
      });
    });
    (0, _defineProperty2.default)(this, "_onImportE2eKeysClicked", () => {
      _Modal.default.createTrackedDialogAsync('Import E2E Keys', '', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../../../async-components/views/dialogs/ImportE2eKeysDialog'))), {
        matrixClient: _MatrixClientPeg.MatrixClientPeg.get()
      });
    });
    (0, _defineProperty2.default)(this, "_onGoToUserProfileClick", () => {
      _dispatcher.default.dispatch({
        action: 'view_user_info',
        userId: _MatrixClientPeg.MatrixClientPeg.get().getUserId()
      });

      this.props.closeSettingsFn();
    });
    (0, _defineProperty2.default)(this, "_onUserUnignored", async userId => {
      const {
        ignoredUserIds,
        waitingUnignored
      } = this.state;
      const currentlyIgnoredUserIds = ignoredUserIds.filter(e => !waitingUnignored.includes(e));
      const index = currentlyIgnoredUserIds.indexOf(userId);

      if (index !== -1) {
        currentlyIgnoredUserIds.splice(index, 1);
        this.setState(({
          waitingUnignored
        }) => ({
          waitingUnignored: [...waitingUnignored, userId]
        }));

        _MatrixClientPeg.MatrixClientPeg.get().setIgnoredUsers(currentlyIgnoredUserIds);
      }
    });
    (0, _defineProperty2.default)(this, "_getInvitedRooms", () => {
      return _MatrixClientPeg.MatrixClientPeg.get().getRooms().filter(r => {
        return r.hasMembershipState(_MatrixClientPeg.MatrixClientPeg.get().getUserId(), "invite");
      });
    });
    (0, _defineProperty2.default)(this, "_manageInvites", async accept => {
      this.setState({
        managingInvites: true
      }); // Compile array of invitation room ids

      const invitedRoomIds = this._getInvitedRooms().map(room => {
        return room.roomId;
      }); // Execute all acceptances/rejections sequentially


      const self = this;

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const action = accept ? cli.joinRoom.bind(cli) : cli.leave.bind(cli);

      for (let i = 0; i < invitedRoomIds.length; i++) {
        const roomId = invitedRoomIds[i]; // Accept/reject invite

        await action(roomId).then(() => {
          // No error, update invited rooms button
          this.setState({
            invitedRoomAmt: self.state.invitedRoomAmt - 1
          });
        }, async e => {
          // Action failure
          if (e.errcode === "M_LIMIT_EXCEEDED") {
            // Add a delay between each invite change in order to avoid rate
            // limiting by the server.
            await (0, _promise.sleep)(e.retry_after_ms || 2500); // Redo last action

            i--;
          } else {
            // Print out error with joining/leaving room
            console.warn(e);
          }
        });
      }

      this.setState({
        managingInvites: false
      });
    });
    (0, _defineProperty2.default)(this, "_onAcceptAllInvitesClicked", ev => {
      this._manageInvites(true);
    });
    (0, _defineProperty2.default)(this, "_onRejectAllInvitesClicked", ev => {
      this._manageInvites(false);
    });

    const invitedRooms = this._getInvitedRooms();

    this.state = {
      ignoredUserIds: _MatrixClientPeg.MatrixClientPeg.get().getIgnoredUsers(),
      waitingUnignored: [],
      managingInvites: false,
      invitedRoomAmt: invitedRooms.length
    };
    this._onAction = this._onAction.bind(this);
  }

  _onAction({
    action
  }) {
    if (action === "ignore_state_changed") {
      const ignoredUserIds = _MatrixClientPeg.MatrixClientPeg.get().getIgnoredUsers();

      const newWaitingUnignored = this.state.waitingUnignored.filter(e => ignoredUserIds.includes(e));
      this.setState({
        ignoredUserIds,
        waitingUnignored: newWaitingUnignored
      });
    }
  }

  componentDidMount() {
    this.dispatcherRef = _dispatcher.default.register(this._onAction);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);
  }

  _renderCurrentDeviceInfo() {
    const SettingsFlag = sdk.getComponent('views.elements.SettingsFlag');

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const deviceId = client.deviceId;
    let identityKey = client.getDeviceEd25519Key();

    if (!identityKey) {
      identityKey = (0, _languageHandler._t)("<not supported>");
    } else {
      identityKey = FormattingUtils.formatCryptoKey(identityKey);
    }

    let importExportButtons = null;

    if (client.isCryptoEnabled()) {
      importExportButtons = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SecurityUserSettingsTab_importExportButtons"
      }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "primary",
        onClick: this._onExportE2eKeysClicked
      }, (0, _languageHandler._t)("Export E2E room keys")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "primary",
        onClick: this._onImportE2eKeysClicked
      }, (0, _languageHandler._t)("Import E2E room keys")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Cryptography")), /*#__PURE__*/_react.default.createElement("ul", {
      className: "mx_SettingsTab_subsectionText mx_SecurityUserSettingsTab_deviceInfo"
    }, /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session ID:")), /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, deviceId))), /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session key:")), /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, /*#__PURE__*/_react.default.createElement("b", null, identityKey))))), importExportButtons, /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "blacklistUnverifiedDevices",
      level: _SettingsStore.SettingLevel.DEVICE,
      onChange: this._updateBlacklistDevicesFlag
    }));
  }

  _renderIgnoredUsers() {
    const {
      waitingUnignored,
      ignoredUserIds
    } = this.state;
    if (!ignoredUserIds || ignoredUserIds.length === 0) return null;
    const userIds = ignoredUserIds.map(u => /*#__PURE__*/_react.default.createElement(IgnoredUser, {
      userId: u,
      onUnignored: this._onUserUnignored,
      key: u,
      inProgress: waitingUnignored.includes(u)
    }));
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)('Ignored users')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, userIds));
  }

  _renderManageInvites() {
    if (this.state.invitedRoomAmt === 0) {
      return null;
    }

    const invitedRooms = this._getInvitedRooms();

    const InlineSpinner = sdk.getComponent('elements.InlineSpinner');

    const onClickAccept = this._onAcceptAllInvitesClicked.bind(this, invitedRooms);

    const onClickReject = this._onRejectAllInvitesClicked.bind(this, invitedRooms);

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SecurityUserSettingsTab_bulkOptions"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)('Bulk options')), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: onClickAccept,
      kind: "primary",
      disabled: this.state.managingInvites
    }, (0, _languageHandler._t)("Accept all %(invitedRooms)s invites", {
      invitedRooms: this.state.invitedRoomAmt
    })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: onClickReject,
      kind: "danger",
      disabled: this.state.managingInvites
    }, (0, _languageHandler._t)("Reject all %(invitedRooms)s invites", {
      invitedRooms: this.state.invitedRoomAmt
    })), this.state.managingInvites ? /*#__PURE__*/_react.default.createElement(InlineSpinner, null) : /*#__PURE__*/_react.default.createElement("div", null));
  }

  render() {
    const DevicesPanel = sdk.getComponent('views.settings.DevicesPanel');
    const SettingsFlag = sdk.getComponent('views.elements.SettingsFlag');
    const EventIndexPanel = sdk.getComponent('views.settings.EventIndexPanel');
    const KeyBackupPanel = sdk.getComponent('views.settings.KeyBackupPanel');

    const keyBackup = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Key backup")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, /*#__PURE__*/_react.default.createElement(KeyBackupPanel, null)));

    const eventIndex = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Message search")), /*#__PURE__*/_react.default.createElement(EventIndexPanel, null)); // XXX: There's no such panel in the current cross-signing designs, but
    // it's useful to have for testing the feature. If there's no interest
    // in having advanced details here once all flows are implemented, we
    // can remove this.


    const CrossSigningPanel = sdk.getComponent('views.settings.CrossSigningPanel');
    let crossSigning;

    if (_SettingsStore.default.getValue("feature_cross_signing")) {
      crossSigning = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_section"
      }, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subheading"
      }, (0, _languageHandler._t)("Cross-signing")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subsectionText"
      }, /*#__PURE__*/_react.default.createElement(CrossSigningPanel, null)));
    }

    const E2eAdvancedPanel = sdk.getComponent('views.settings.E2eAdvancedPanel');
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab mx_SecurityUserSettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Security & Privacy")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Where you’re logged in")), /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Manage the names of and sign out of your sessions below or " + "<a>verify them in your User Profile</a>.", {}, {
      a: sub => /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "link",
        onClick: this._onGoToUserProfileClick
      }, sub)
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)("A session's public name is visible to people you communicate with"), /*#__PURE__*/_react.default.createElement(DevicesPanel, null))), keyBackup, eventIndex, crossSigning, this._renderCurrentDeviceInfo(), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Analytics")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)("Riot collects anonymous analytics to allow us to improve the application."), "\xA0", (0, _languageHandler._t)("Privacy is important to us, so we don't collect any personal or " + "identifiable data for our analytics."), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_SettingsTab_linkBtn",
      onClick: _Analytics.default.showDetailsModal
    }, (0, _languageHandler._t)("Learn more about how we use analytics."))), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "analyticsOptIn",
      level: _SettingsStore.SettingLevel.DEVICE,
      onChange: this._updateAnalytics
    })), this._renderIgnoredUsers(), this._renderManageInvites(), /*#__PURE__*/_react.default.createElement(E2eAdvancedPanel, null));
  }

}

exports.default = SecurityUserSettingsTab;
(0, _defineProperty2.default)(SecurityUserSettingsTab, "propTypes", {
  closeSettingsFn: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvdXNlci9TZWN1cml0eVVzZXJTZXR0aW5nc1RhYi5qcyJdLCJuYW1lcyI6WyJJZ25vcmVkVXNlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiZSIsInByb3BzIiwib25Vbmlnbm9yZWQiLCJ1c2VySWQiLCJyZW5kZXIiLCJpZCIsIl9vblVuaWdub3JlQ2xpY2tlZCIsImluUHJvZ3Jlc3MiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIiwiZnVuYyIsImJvb2wiLCJTZWN1cml0eVVzZXJTZXR0aW5nc1RhYiIsImNvbnN0cnVjdG9yIiwiY2hlY2tlZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInNldEdsb2JhbEJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzIiwiQW5hbHl0aWNzIiwiZW5hYmxlIiwiZGlzYWJsZSIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jIiwibWF0cml4Q2xpZW50IiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJnZXRVc2VySWQiLCJjbG9zZVNldHRpbmdzRm4iLCJpZ25vcmVkVXNlcklkcyIsIndhaXRpbmdVbmlnbm9yZWQiLCJzdGF0ZSIsImN1cnJlbnRseUlnbm9yZWRVc2VySWRzIiwiZmlsdGVyIiwiaW5jbHVkZXMiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJzZXRTdGF0ZSIsInNldElnbm9yZWRVc2VycyIsImdldFJvb21zIiwiciIsImhhc01lbWJlcnNoaXBTdGF0ZSIsImFjY2VwdCIsIm1hbmFnaW5nSW52aXRlcyIsImludml0ZWRSb29tSWRzIiwiX2dldEludml0ZWRSb29tcyIsIm1hcCIsInJvb20iLCJyb29tSWQiLCJzZWxmIiwiY2xpIiwiam9pblJvb20iLCJiaW5kIiwibGVhdmUiLCJpIiwibGVuZ3RoIiwidGhlbiIsImludml0ZWRSb29tQW10IiwiZXJyY29kZSIsInJldHJ5X2FmdGVyX21zIiwiY29uc29sZSIsIndhcm4iLCJldiIsIl9tYW5hZ2VJbnZpdGVzIiwiaW52aXRlZFJvb21zIiwiZ2V0SWdub3JlZFVzZXJzIiwiX29uQWN0aW9uIiwibmV3V2FpdGluZ1VuaWdub3JlZCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsInJlZ2lzdGVyIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwiX3JlbmRlckN1cnJlbnREZXZpY2VJbmZvIiwiU2V0dGluZ3NGbGFnIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY2xpZW50IiwiZGV2aWNlSWQiLCJpZGVudGl0eUtleSIsImdldERldmljZUVkMjU1MTlLZXkiLCJGb3JtYXR0aW5nVXRpbHMiLCJmb3JtYXRDcnlwdG9LZXkiLCJpbXBvcnRFeHBvcnRCdXR0b25zIiwiaXNDcnlwdG9FbmFibGVkIiwiX29uRXhwb3J0RTJlS2V5c0NsaWNrZWQiLCJfb25JbXBvcnRFMmVLZXlzQ2xpY2tlZCIsIlNldHRpbmdMZXZlbCIsIkRFVklDRSIsIl91cGRhdGVCbGFja2xpc3REZXZpY2VzRmxhZyIsIl9yZW5kZXJJZ25vcmVkVXNlcnMiLCJ1c2VySWRzIiwidSIsIl9vblVzZXJVbmlnbm9yZWQiLCJfcmVuZGVyTWFuYWdlSW52aXRlcyIsIklubGluZVNwaW5uZXIiLCJvbkNsaWNrQWNjZXB0IiwiX29uQWNjZXB0QWxsSW52aXRlc0NsaWNrZWQiLCJvbkNsaWNrUmVqZWN0IiwiX29uUmVqZWN0QWxsSW52aXRlc0NsaWNrZWQiLCJEZXZpY2VzUGFuZWwiLCJFdmVudEluZGV4UGFuZWwiLCJLZXlCYWNrdXBQYW5lbCIsImtleUJhY2t1cCIsImV2ZW50SW5kZXgiLCJDcm9zc1NpZ25pbmdQYW5lbCIsImNyb3NzU2lnbmluZyIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsIkUyZUFkdmFuY2VkUGFuZWwiLCJhIiwic3ViIiwiX29uR29Ub1VzZXJQcm9maWxlQ2xpY2siLCJzaG93RGV0YWlsc01vZGFsIiwiX3VwZGF0ZUFu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a0IsUUFBQSxJQUFJLEVBQUMsTUFBdkI7QUFBOEIsUUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFBNUMsU0FDTEQsR0FESztBQURkLEtBSEgsQ0FETCxDQUZKLGVBYUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0sseUJBQUcsbUVBQUgsQ0FETCxlQUVJLDZCQUFDLFlBQUQsT0FGSixDQWJKLENBRkosRUFvQktSLFNBcEJMLEVBcUJLQyxVQXJCTCxFQXNCS0UsWUF0QkwsRUF1QkssS0FBS2pDLHdCQUFMLEVBdkJMLGVBd0JJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQTZDLHlCQUFHLFdBQUgsQ0FBN0MsQ0FESixlQUVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLLHlCQUFHLDJFQUFILENBREwsVUFHSyx5QkFBRyxxRUFDQSxzQ0FESCxDQUhMLGVBS0ksNkJBQUMseUJBQUQ7QUFBa0IsTUFBQSxTQUFTLEVBQUMsd0JBQTVCO0FBQXFELE1BQUEsT0FBTyxFQUFFeEQsbUJBQVVnRztBQUF4RSxPQUNLLHlCQUFHLHdDQUFILENBREwsQ0FMSixDQUZKLGVBV0ksNkJBQUMsWUFBRDtBQUFjLE1BQUEsSUFBSSxFQUFDLGdCQUFuQjtBQUFvQyxNQUFBLEtBQUssRUFBRTFCLDRCQUFhQyxNQUF4RDtBQUNjLE1BQUEsUUFBUSxFQUFFLEtBQUswQjtBQUQ3QixNQVhKLENBeEJKLEVBc0NLLEtBQUt4QixtQkFBTCxFQXRDTCxFQXVDSyxLQUFLSSxvQkFBTCxFQXZDTCxlQXdDSSw2QkFBQyxnQkFBRCxPQXhDSixDQURKO0FBNENIOztBQXpUZ0U7Ozs4QkFBaERuRix1QixlQUNFO0FBQ2ZnQixFQUFBQSxlQUFlLEVBQUVyQixtQkFBVUcsSUFBVixDQUFlRDtBQURqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgKiBhcyBGb3JtYXR0aW5nVXRpbHMgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3V0aWxzL0Zvcm1hdHRpbmdVdGlsc1wiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uLy4uLy4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcbmltcG9ydCBBbmFseXRpY3MgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL0FuYWx5dGljc1wiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9Nb2RhbFwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi8uLi8uLlwiO1xuaW1wb3J0IHtzbGVlcH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3V0aWxzL3Byb21pc2VcIjtcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuXG5leHBvcnQgY2xhc3MgSWdub3JlZFVzZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBvblVuaWdub3JlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgX29uVW5pZ25vcmVDbGlja2VkID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblVuaWdub3JlZCh0aGlzLnByb3BzLnVzZXJJZCk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgaWQgPSBgbXhfU2VjdXJpdHlVc2VyU2V0dGluZ3NUYWJfaWdub3JlZFVzZXJfJHt0aGlzLnByb3BzLnVzZXJJZH1gO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NlY3VyaXR5VXNlclNldHRpbmdzVGFiX2lnbm9yZWRVc2VyJz5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vblVuaWdub3JlQ2xpY2tlZH0ga2luZD0ncHJpbWFyeV9zbScgYXJpYS1kZXNjcmliZWRieT17aWR9IGRpc2FibGVkPXt0aGlzLnByb3BzLmluUHJvZ3Jlc3N9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdVbmlnbm9yZScpIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPHNwYW4gaWQ9e2lkfT57IHRoaXMucHJvcHMudXNlcklkIH08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlY3VyaXR5VXNlclNldHRpbmdzVGFiIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBjbG9zZVNldHRpbmdzRm46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEdldCBudW1iZXIgb2Ygcm9vbXMgd2UncmUgaW52aXRlZCB0b1xuICAgICAgICBjb25zdCBpbnZpdGVkUm9vbXMgPSB0aGlzLl9nZXRJbnZpdGVkUm9vbXMoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgaWdub3JlZFVzZXJJZHM6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZ25vcmVkVXNlcnMoKSxcbiAgICAgICAgICAgIHdhaXRpbmdVbmlnbm9yZWQ6IFtdLFxuICAgICAgICAgICAgbWFuYWdpbmdJbnZpdGVzOiBmYWxzZSxcbiAgICAgICAgICAgIGludml0ZWRSb29tQW10OiBpbnZpdGVkUm9vbXMubGVuZ3RoLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX29uQWN0aW9uID0gdGhpcy5fb25BY3Rpb24uYmluZCh0aGlzKTtcbiAgICB9XG5cblxuICAgIF9vbkFjdGlvbih7YWN0aW9ufSkge1xuICAgICAgICBpZiAoYWN0aW9uID09PSBcImlnbm9yZV9zdGF0ZV9jaGFuZ2VkXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWRVc2VySWRzID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElnbm9yZWRVc2VycygpO1xuICAgICAgICAgICAgY29uc3QgbmV3V2FpdGluZ1VuaWdub3JlZCA9IHRoaXMuc3RhdGUud2FpdGluZ1VuaWdub3JlZC5maWx0ZXIoZT0+IGlnbm9yZWRVc2VySWRzLmluY2x1ZGVzKGUpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2lnbm9yZWRVc2VySWRzLCB3YWl0aW5nVW5pZ25vcmVkOiBuZXdXYWl0aW5nVW5pZ25vcmVkfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMuX29uQWN0aW9uKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICB9XG5cbiAgICBfdXBkYXRlQmxhY2tsaXN0RGV2aWNlc0ZsYWcgPSAoY2hlY2tlZCkgPT4ge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2V0R2xvYmFsQmxhY2tsaXN0VW52ZXJpZmllZERldmljZXMoY2hlY2tlZCk7XG4gICAgfTtcblxuICAgIF91cGRhdGVBbmFseXRpY3MgPSAoY2hlY2tlZCkgPT4ge1xuICAgICAgICBjaGVja2VkID8gQW5hbHl0aWNzLmVuYWJsZSgpIDogQW5hbHl0aWNzLmRpc2FibGUoKTtcbiAgICB9O1xuXG4gICAgX29uRXhwb3J0RTJlS2V5c0NsaWNrZWQgPSAoKSA9PiB7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYygnRXhwb3J0IEUyRSBLZXlzJywgJycsXG4gICAgICAgICAgICBpbXBvcnQoJy4uLy4uLy4uLy4uLy4uL2FzeW5jLWNvbXBvbmVudHMvdmlld3MvZGlhbG9ncy9FeHBvcnRFMmVLZXlzRGlhbG9nJyksXG4gICAgICAgICAgICB7bWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnRQZWcuZ2V0KCl9LFxuICAgICAgICApO1xuICAgIH07XG5cbiAgICBfb25JbXBvcnRFMmVLZXlzQ2xpY2tlZCA9ICgpID0+IHtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jKCdJbXBvcnQgRTJFIEtleXMnLCAnJyxcbiAgICAgICAgICAgIGltcG9ydCgnLi4vLi4vLi4vLi4vLi4vYXN5bmMtY29tcG9uZW50cy92aWV3cy9kaWFsb2dzL0ltcG9ydEUyZUtleXNEaWFsb2cnKSxcbiAgICAgICAgICAgIHttYXRyaXhDbGllbnQ6IE1hdHJpeENsaWVudFBlZy5nZXQoKX0sXG4gICAgICAgICk7XG4gICAgfTtcblxuICAgIF9vbkdvVG9Vc2VyUHJvZmlsZUNsaWNrID0gKCkgPT4ge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld191c2VyX2luZm8nLFxuICAgICAgICAgICAgdXNlcklkOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnByb3BzLmNsb3NlU2V0dGluZ3NGbigpO1xuICAgIH1cblxuICAgIF9vblVzZXJVbmlnbm9yZWQgPSBhc3luYyAodXNlcklkKSA9PiB7XG4gICAgICAgIGNvbnN0IHtpZ25vcmVkVXNlcklkcywgd2FpdGluZ1VuaWdub3JlZH0gPSB0aGlzLnN0YXRlO1xuICAgICAgICBjb25zdCBjdXJyZW50bHlJZ25vcmVkVXNlcklkcyA9IGlnbm9yZWRVc2VySWRzLmZpbHRlcihlID0+ICF3YWl0aW5nVW5pZ25vcmVkLmluY2x1ZGVzKGUpKTtcblxuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnRseUlnbm9yZWRVc2VySWRzLmluZGV4T2YodXNlcklkKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgY3VycmVudGx5SWdub3JlZFVzZXJJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoKHt3YWl0aW5nVW5pZ25vcmVkfSkgPT4gKHt3YWl0aW5nVW5pZ25vcmVkOiBbLi4ud2FpdGluZ1VuaWdub3JlZCwgdXNlcklkXX0pKTtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRJZ25vcmVkVXNlcnMoY3VycmVudGx5SWdub3JlZFVzZXJJZHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9nZXRJbnZpdGVkUm9vbXMgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbXMoKS5maWx0ZXIoKHIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiByLmhhc01lbWJlcnNoaXBTdGF0ZShNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCksIFwiaW52aXRlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX21hbmFnZUludml0ZXMgPSBhc3luYyAoYWNjZXB0KSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbWFuYWdpbmdJbnZpdGVzOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDb21waWxlIGFycmF5IG9mIGludml0YXRpb24gcm9vbSBpZHNcbiAgICAgICAgY29uc3QgaW52aXRlZFJvb21JZHMgPSB0aGlzLl9nZXRJbnZpdGVkUm9vbXMoKS5tYXAoKHJvb20pID0+IHtcbiAgICAgICAgICAgIHJldHVybiByb29tLnJvb21JZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRXhlY3V0ZSBhbGwgYWNjZXB0YW5jZXMvcmVqZWN0aW9ucyBzZXF1ZW50aWFsbHlcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gYWNjZXB0ID8gY2xpLmpvaW5Sb29tLmJpbmQoY2xpKSA6IGNsaS5sZWF2ZS5iaW5kKGNsaSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW52aXRlZFJvb21JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb21JZCA9IGludml0ZWRSb29tSWRzW2ldO1xuXG4gICAgICAgICAgICAvLyBBY2NlcHQvcmVqZWN0IGludml0ZVxuICAgICAgICAgICAgYXdhaXQgYWN0aW9uKHJvb21JZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTm8gZXJyb3IsIHVwZGF0ZSBpbnZpdGVkIHJvb21zIGJ1dHRvblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2ludml0ZWRSb29tQW10OiBzZWxmLnN0YXRlLmludml0ZWRSb29tQW10IC0gMX0pO1xuICAgICAgICAgICAgfSwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBBY3Rpb24gZmFpbHVyZVxuICAgICAgICAgICAgICAgIGlmIChlLmVycmNvZGUgPT09IFwiTV9MSU1JVF9FWENFRURFRFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhIGRlbGF5IGJldHdlZW4gZWFjaCBpbnZpdGUgY2hhbmdlIGluIG9yZGVyIHRvIGF2b2lkIHJhdGVcbiAgICAgICAgICAgICAgICAgICAgLy8gbGltaXRpbmcgYnkgdGhlIHNlcnZlci5cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2xlZXAoZS5yZXRyeV9hZnRlcl9tcyB8fCAyNTAwKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZWRvIGxhc3QgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBQcmludCBvdXQgZXJyb3Igd2l0aCBqb2luaW5nL2xlYXZpbmcgcm9vbVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1hbmFnaW5nSW52aXRlczogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25BY2NlcHRBbGxJbnZpdGVzQ2xpY2tlZCA9IChldikgPT4ge1xuICAgICAgICB0aGlzLl9tYW5hZ2VJbnZpdGVzKHRydWUpO1xuICAgIH07XG5cbiAgICBfb25SZWplY3RBbGxJbnZpdGVzQ2xpY2tlZCA9IChldikgPT4ge1xuICAgICAgICB0aGlzLl9tYW5hZ2VJbnZpdGVzKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgX3JlbmRlckN1cnJlbnREZXZpY2VJbmZvKCkge1xuICAgICAgICBjb25zdCBTZXR0aW5nc0ZsYWcgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5TZXR0aW5nc0ZsYWcnKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IGRldmljZUlkID0gY2xpZW50LmRldmljZUlkO1xuICAgICAgICBsZXQgaWRlbnRpdHlLZXkgPSBjbGllbnQuZ2V0RGV2aWNlRWQyNTUxOUtleSgpO1xuICAgICAgICBpZiAoIWlkZW50aXR5S2V5KSB7XG4gICAgICAgICAgICBpZGVudGl0eUtleSA9IF90KFwiPG5vdCBzdXBwb3J0ZWQ+XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWRlbnRpdHlLZXkgPSBGb3JtYXR0aW5nVXRpbHMuZm9ybWF0Q3J5cHRvS2V5KGlkZW50aXR5S2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbXBvcnRFeHBvcnRCdXR0b25zID0gbnVsbDtcbiAgICAgICAgaWYgKGNsaWVudC5pc0NyeXB0b0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgaW1wb3J0RXhwb3J0QnV0dG9ucyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2VjdXJpdHlVc2VyU2V0dGluZ3NUYWJfaW1wb3J0RXhwb3J0QnV0dG9ucyc+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9J3ByaW1hcnknIG9uQ2xpY2s9e3RoaXMuX29uRXhwb3J0RTJlS2V5c0NsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiRXhwb3J0IEUyRSByb29tIGtleXNcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD0ncHJpbWFyeScgb25DbGljaz17dGhpcy5fb25JbXBvcnRFMmVLZXlzQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJJbXBvcnQgRTJFIHJvb20ga2V5c1wiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbic+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nJz57X3QoXCJDcnlwdG9ncmFwaHlcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0IG14X1NlY3VyaXR5VXNlclNldHRpbmdzVGFiX2RldmljZUluZm8nPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+e190KFwiU2Vzc2lvbiBJRDpcIil9PC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjxjb2RlPntkZXZpY2VJZH08L2NvZGU+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+e190KFwiU2Vzc2lvbiBrZXk6XCIpfTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj48Y29kZT48Yj57aWRlbnRpdHlLZXl9PC9iPjwvY29kZT48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICB7aW1wb3J0RXhwb3J0QnV0dG9uc31cbiAgICAgICAgICAgICAgICA8U2V0dGluZ3NGbGFnIG5hbWU9J2JsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzJyBsZXZlbD17U2V0dGluZ0xldmVsLkRFVklDRX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl91cGRhdGVCbGFja2xpc3REZXZpY2VzRmxhZ30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJJZ25vcmVkVXNlcnMoKSB7XG4gICAgICAgIGNvbnN0IHt3YWl0aW5nVW5pZ25vcmVkLCBpZ25vcmVkVXNlcklkc30gPSB0aGlzLnN0YXRlO1xuXG4gICAgICAgIGlmICghaWdub3JlZFVzZXJJZHMgfHwgaWdub3JlZFVzZXJJZHMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCB1c2VySWRzID0gaWdub3JlZFVzZXJJZHNcbiAgICAgICAgICAgIC5tYXAoKHUpID0+IDxJZ25vcmVkVXNlclxuICAgICAgICAgICAgIHVzZXJJZD17dX1cbiAgICAgICAgICAgICBvblVuaWdub3JlZD17dGhpcy5fb25Vc2VyVW5pZ25vcmVkfVxuICAgICAgICAgICAgIGtleT17dX1cbiAgICAgICAgICAgICBpblByb2dyZXNzPXt3YWl0aW5nVW5pZ25vcmVkLmluY2x1ZGVzKHUpfVxuICAgICAgICAgICAgIC8+KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24nPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KCdJZ25vcmVkIHVzZXJzJyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHt1c2VySWRzfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX3JlbmRlck1hbmFnZUludml0ZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmludml0ZWRSb29tQW10ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGludml0ZWRSb29tcyA9IHRoaXMuX2dldEludml0ZWRSb29tcygpO1xuICAgICAgICBjb25zdCBJbmxpbmVTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuSW5saW5lU3Bpbm5lcicpO1xuICAgICAgICBjb25zdCBvbkNsaWNrQWNjZXB0ID0gdGhpcy5fb25BY2NlcHRBbGxJbnZpdGVzQ2xpY2tlZC5iaW5kKHRoaXMsIGludml0ZWRSb29tcyk7XG4gICAgICAgIGNvbnN0IG9uQ2xpY2tSZWplY3QgPSB0aGlzLl9vblJlamVjdEFsbEludml0ZXNDbGlja2VkLmJpbmQodGhpcywgaW52aXRlZFJvb21zKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uIG14X1NlY3VyaXR5VXNlclNldHRpbmdzVGFiX2J1bGtPcHRpb25zJz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcnPntfdCgnQnVsayBvcHRpb25zJyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e29uQ2xpY2tBY2NlcHR9IGtpbmQ9J3ByaW1hcnknIGRpc2FibGVkPXt0aGlzLnN0YXRlLm1hbmFnaW5nSW52aXRlc30+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkFjY2VwdCBhbGwgJShpbnZpdGVkUm9vbXMpcyBpbnZpdGVzXCIsIHtpbnZpdGVkUm9vbXM6IHRoaXMuc3RhdGUuaW52aXRlZFJvb21BbXR9KX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17b25DbGlja1JlamVjdH0ga2luZD0nZGFuZ2VyJyBkaXNhYmxlZD17dGhpcy5zdGF0ZS5tYW5hZ2luZ0ludml0ZXN9PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZWplY3QgYWxsICUoaW52aXRlZFJvb21zKXMgaW52aXRlc1wiLCB7aW52aXRlZFJvb21zOiB0aGlzLnN0YXRlLmludml0ZWRSb29tQW10fSl9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLm1hbmFnaW5nSW52aXRlcyA/IDxJbmxpbmVTcGlubmVyIC8+IDogPGRpdiAvPn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgRGV2aWNlc1BhbmVsID0gc2RrLmdldENvbXBvbmVudCgndmlld3Muc2V0dGluZ3MuRGV2aWNlc1BhbmVsJyk7XG4gICAgICAgIGNvbnN0IFNldHRpbmdzRmxhZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLlNldHRpbmdzRmxhZycpO1xuICAgICAgICBjb25zdCBFdmVudEluZGV4UGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5zZXR0aW5ncy5FdmVudEluZGV4UGFuZWwnKTtcblxuICAgICAgICBjb25zdCBLZXlCYWNrdXBQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLnNldHRpbmdzLktleUJhY2t1cFBhbmVsJyk7XG4gICAgICAgIGNvbnN0IGtleUJhY2t1cCA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uJz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nXCI+e190KFwiS2V5IGJhY2t1cFwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgPEtleUJhY2t1cFBhbmVsIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBldmVudEluZGV4ID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZ1wiPntfdChcIk1lc3NhZ2Ugc2VhcmNoXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8RXZlbnRJbmRleFBhbmVsIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBYWFg6IFRoZXJlJ3Mgbm8gc3VjaCBwYW5lbCBpbiB0aGUgY3VycmVudCBjcm9zcy1zaWduaW5nIGRlc2lnbnMsIGJ1dFxuICAgICAgICAvLyBpdCdzIHVzZWZ1bCB0byBoYXZlIGZvciB0ZXN0aW5nIHRoZSBmZWF0dXJlLiBJZiB0aGVyZSdzIG5vIGludGVyZXN0XG4gICAgICAgIC8vIGluIGhhdmluZyBhZHZhbmNlZCBkZXRhaWxzIGhlcmUgb25jZSBhbGwgZmxvd3MgYXJlIGltcGxlbWVudGVkLCB3ZVxuICAgICAgICAvLyBjYW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIGNvbnN0IENyb3NzU2lnbmluZ1BhbmVsID0gc2RrLmdldENvbXBvbmVudCgndmlld3Muc2V0dGluZ3MuQ3Jvc3NTaWduaW5nUGFuZWwnKTtcbiAgICAgICAgbGV0IGNyb3NzU2lnbmluZztcbiAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpIHtcbiAgICAgICAgICAgIGNyb3NzU2lnbmluZyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbic+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJDcm9zcy1zaWduaW5nXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxDcm9zc1NpZ25pbmdQYW5lbCAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBFMmVBZHZhbmNlZFBhbmVsID0gc2RrLmdldENvbXBvbmVudCgndmlld3Muc2V0dGluZ3MuRTJlQWR2YW5jZWRQYW5lbCcpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiIG14X1NlY3VyaXR5VXNlclNldHRpbmdzVGFiXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9oZWFkaW5nXCI+e190KFwiU2VjdXJpdHkgJiBQcml2YWN5XCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc2VjdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nXCI+e190KFwiV2hlcmUgeW914oCZcmUgbG9nZ2VkIGluXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJNYW5hZ2UgdGhlIG5hbWVzIG9mIGFuZCBzaWduIG91dCBvZiB5b3VyIHNlc3Npb25zIGJlbG93IG9yIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxhPnZlcmlmeSB0aGVtIGluIHlvdXIgVXNlciBQcm9maWxlPC9hPi5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhOiBzdWIgPT4gPEFjY2Vzc2libGVCdXR0b24ga2luZD1cImxpbmtcIiBvbkNsaWNrPXt0aGlzLl9vbkdvVG9Vc2VyUHJvZmlsZUNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzdWJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkEgc2Vzc2lvbidzIHB1YmxpYyBuYW1lIGlzIHZpc2libGUgdG8gcGVvcGxlIHlvdSBjb21tdW5pY2F0ZSB3aXRoXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPERldmljZXNQYW5lbCAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7a2V5QmFja3VwfVxuICAgICAgICAgICAgICAgIHtldmVudEluZGV4fVxuICAgICAgICAgICAgICAgIHtjcm9zc1NpZ25pbmd9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckN1cnJlbnREZXZpY2VJbmZvKCl9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24nPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nXCI+e190KFwiQW5hbHl0aWNzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlJpb3QgY29sbGVjdHMgYW5vbnltb3VzIGFuYWx5dGljcyB0byBhbGxvdyB1cyB0byBpbXByb3ZlIHRoZSBhcHBsaWNhdGlvbi5cIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAmbmJzcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlByaXZhY3kgaXMgaW1wb3J0YW50IHRvIHVzLCBzbyB3ZSBkb24ndCBjb2xsZWN0IGFueSBwZXJzb25hbCBvciBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZGVudGlmaWFibGUgZGF0YSBmb3Igb3VyIGFuYWx5dGljcy5cIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9saW5rQnRuXCIgb25DbGljaz17QW5hbHl0aWNzLnNob3dEZXRhaWxzTW9kYWx9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkxlYXJuIG1vcmUgYWJvdXQgaG93IHdlIHVzZSBhbmFseXRpY3MuXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPFNldHRpbmdzRmxhZyBuYW1lPSdhbmFseXRpY3NPcHRJbicgbGV2ZWw9e1NldHRpbmdMZXZlbC5ERVZJQ0V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX3VwZGF0ZUFuYWx5dGljc30gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVySWdub3JlZFVzZXJzKCl9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlck1hbmFnZUludml0ZXMoKX1cbiAgICAgICAgICAgICAgICA8RTJlQWR2YW5jZWRQYW5lbCAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19