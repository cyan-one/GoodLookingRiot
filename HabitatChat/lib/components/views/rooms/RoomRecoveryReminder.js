"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard3(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _SettingsStore = _interopRequireWildcard3(require("../../../settings/SettingsStore"));

/*
Copyright 2018, 2019 New Vector Ltd
Copyright 2020 The Matrix.org Foundation C.I.C.

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
class RoomRecoveryReminder extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "showSetupDialog", () => {
      if (this.state.backupInfo) {
        // A key backup exists for this account, but the creating device is not
        // verified, so restore the backup which will give us the keys from it and
        // allow us to trust it (ie. upload keys to it)
        const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');

        _Modal.default.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, null, null,
        /* priority = */
        false,
        /* static = */
        true);
      } else {
        _Modal.default.createTrackedDialogAsync("Key Backup", "Key Backup", Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require("../../../async-components/views/dialogs/keybackup/CreateKeyBackupDialog"))), null, null,
        /* priority = */
        false,
        /* static = */
        true);
      }
    });
    (0, _defineProperty2.default)(this, "onOnNotNowClick", () => {
      this.setState({
        notNowClicked: true
      });
    });
    (0, _defineProperty2.default)(this, "onDontAskAgainClick", () => {
      // When you choose "Don't ask again" from the room reminder, we show a
      // dialog to confirm the choice.
      _Modal.default.createTrackedDialogAsync("Ignore Recovery Reminder", "Ignore Recovery Reminder", Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require("../../../async-components/views/dialogs/keybackup/IgnoreRecoveryReminderDialog"))), {
        onDontAskAgain: async () => {
          await _SettingsStore.default.setValue("showRoomRecoveryReminder", null, _SettingsStore.SettingLevel.ACCOUNT, false);
          this.props.onDontAskAgainSet();
        },
        onSetup: () => {
          this.showSetupDialog();
        }
      });
    });
    (0, _defineProperty2.default)(this, "onSetupClick", () => {
      this.showSetupDialog();
    });
    this.state = {
      loading: true,
      error: null,
      backupInfo: null,
      notNowClicked: false
    };
  }

  componentDidMount() {
    this._loadBackupStatus();
  }

  async _loadBackupStatus() {
    try {
      const backupInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
      this.setState({
        loading: false,
        backupInfo
      });
    } catch (e) {
      console.log("Unable to fetch key backup status", e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  render() {
    // If there was an error loading just don't display the banner: we'll try again
    // next time the user switchs to the room.
    if (this.state.error || this.state.loading || this.state.notNowClicked) {
      return null;
    }

    const AccessibleButton = sdk.getComponent("views.elements.AccessibleButton");
    let setupCaption;

    if (this.state.backupInfo) {
      setupCaption = (0, _languageHandler._t)("Connect this session to Key Backup");
    } else {
      setupCaption = (0, _languageHandler._t)("Start using Key Backup");
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomRecoveryReminder"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomRecoveryReminder_header"
    }, (0, _languageHandler._t)("Never lose encrypted messages")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomRecoveryReminder_body"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Messages in this room are secured with end-to-end " + "encryption. Only you and the recipient(s) have the " + "keys to read these messages.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Securely back up your keys to avoid losing them. " + "<a>Learn more.</a>", {}, {
      // TODO: We don't have this link yet: this will prevent the translators
      // having to re-translate the string when we do.
      a: sub => ''
    }))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomRecoveryReminder_buttons"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      onClick: this.onSetupClick
    }, setupCaption), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_RoomRecoveryReminder_secondary mx_linkButton",
      onClick: this.onOnNotNowClick
    }, (0, _languageHandler._t)("Not now")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_RoomRecoveryReminder_secondary mx_linkButton",
      onClick: this.onDontAskAgainClick
    }, (0, _languageHandler._t)("Don't ask me again"))));
  }

}

exports.default = RoomRecoveryReminder;
(0, _defineProperty2.default)(RoomRecoveryReminder, "propTypes", {
  // called if the user sets the option to suppress this reminder in the future
  onDontAskAgainSet: _propTypes.default.func
});
(0, _defineProperty2.default)(RoomRecoveryReminder, "defaultProps", {
  onDontAskAgainSet: function () {}
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21SZWNvdmVyeVJlbWluZGVyLmpzIl0sIm5hbWVzIjpbIlJvb21SZWNvdmVyeVJlbWluZGVyIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInN0YXRlIiwiYmFja3VwSW5mbyIsIlJlc3RvcmVLZXlCYWNrdXBEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJjcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMiLCJzZXRTdGF0ZSIsIm5vdE5vd0NsaWNrZWQiLCJvbkRvbnRBc2tBZ2FpbiIsIlNldHRpbmdzU3RvcmUiLCJzZXRWYWx1ZSIsIlNldHRpbmdMZXZlbCIsIkFDQ09VTlQiLCJvbkRvbnRBc2tBZ2FpblNldCIsIm9uU2V0dXAiLCJzaG93U2V0dXBEaWFsb2ciLCJsb2FkaW5nIiwiZXJyb3IiLCJjb21wb25lbnREaWRNb3VudCIsIl9sb2FkQmFja3VwU3RhdHVzIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0S2V5QmFja3VwVmVyc2lvbiIsImUiLCJjb25zb2xlIiwibG9nIiwicmVuZGVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNldHVwQ2FwdGlvbiIsImEiLCJzdWIiLCJvblNldHVwQ2xpY2siLCJvbk9uTm90Tm93Q2xpY2siLCJvbkRvbnRBc2tBZ2FpbkNsaWNrIiwiUHJvcFR5cGVzIiwiZnVuYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7OztBQXlCZSxNQUFNQSxvQkFBTixTQUFtQ0MsZUFBTUMsYUFBekMsQ0FBdUQ7QUFVbEVDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLDJEQStCRCxNQUFNO0FBQ3BCLFVBQUksS0FBS0MsS0FBTCxDQUFXQyxVQUFmLEVBQTJCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBLGNBQU1DLHNCQUFzQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMENBQWpCLENBQS9COztBQUNBQyx1QkFBTUMsbUJBQU4sQ0FDSSxnQkFESixFQUNzQixFQUR0QixFQUMwQkosc0JBRDFCLEVBQ2tELElBRGxELEVBQ3dELElBRHhEO0FBRUk7QUFBaUIsYUFGckI7QUFFNEI7QUFBZSxZQUYzQztBQUlILE9BVEQsTUFTTztBQUNIRyx1QkFBTUUsd0JBQU4sQ0FBK0IsWUFBL0IsRUFBNkMsWUFBN0MsNkVBQ1cseUVBRFgsS0FFSSxJQUZKLEVBRVUsSUFGVjtBQUVnQjtBQUFpQixhQUZqQztBQUV3QztBQUFlLFlBRnZEO0FBSUg7QUFDSixLQS9Da0I7QUFBQSwyREFpREQsTUFBTTtBQUNwQixXQUFLQyxRQUFMLENBQWM7QUFBQ0MsUUFBQUEsYUFBYSxFQUFFO0FBQWhCLE9BQWQ7QUFDSCxLQW5Ea0I7QUFBQSwrREFxREcsTUFBTTtBQUN4QjtBQUNBO0FBQ0FKLHFCQUFNRSx3QkFBTixDQUErQiwwQkFBL0IsRUFBMkQsMEJBQTNELDZFQUNXLGdGQURYLEtBRUk7QUFDSUcsUUFBQUEsY0FBYyxFQUFFLFlBQVk7QUFDeEIsZ0JBQU1DLHVCQUFjQyxRQUFkLENBQ0YsMEJBREUsRUFFRixJQUZFLEVBR0ZDLDRCQUFhQyxPQUhYLEVBSUYsS0FKRSxDQUFOO0FBTUEsZUFBS2YsS0FBTCxDQUFXZ0IsaUJBQVg7QUFDSCxTQVRMO0FBVUlDLFFBQUFBLE9BQU8sRUFBRSxNQUFNO0FBQ1gsZUFBS0MsZUFBTDtBQUNIO0FBWkwsT0FGSjtBQWlCSCxLQXpFa0I7QUFBQSx3REEyRUosTUFBTTtBQUNqQixXQUFLQSxlQUFMO0FBQ0gsS0E3RWtCO0FBR2YsU0FBS2pCLEtBQUwsR0FBYTtBQUNUa0IsTUFBQUEsT0FBTyxFQUFFLElBREE7QUFFVEMsTUFBQUEsS0FBSyxFQUFFLElBRkU7QUFHVGxCLE1BQUFBLFVBQVUsRUFBRSxJQUhIO0FBSVRRLE1BQUFBLGFBQWEsRUFBRTtBQUpOLEtBQWI7QUFNSDs7QUFFRFcsRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEIsU0FBS0MsaUJBQUw7QUFDSDs7QUFFRCxRQUFNQSxpQkFBTixHQUEwQjtBQUN0QixRQUFJO0FBQ0EsWUFBTXBCLFVBQVUsR0FBRyxNQUFNcUIsaUNBQWdCQyxHQUFoQixHQUFzQkMsbUJBQXRCLEVBQXpCO0FBQ0EsV0FBS2hCLFFBQUwsQ0FBYztBQUNWVSxRQUFBQSxPQUFPLEVBQUUsS0FEQztBQUVWakIsUUFBQUE7QUFGVSxPQUFkO0FBSUgsS0FORCxDQU1FLE9BQU93QixDQUFQLEVBQVU7QUFDUkMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksbUNBQVosRUFBaURGLENBQWpEO0FBQ0EsV0FBS2pCLFFBQUwsQ0FBYztBQUNWVSxRQUFBQSxPQUFPLEVBQUUsS0FEQztBQUVWQyxRQUFBQSxLQUFLLEVBQUVNO0FBRkcsT0FBZDtBQUlIO0FBQ0o7O0FBa0RERyxFQUFBQSxNQUFNLEdBQUc7QUFDTDtBQUNBO0FBQ0EsUUFBSSxLQUFLNUIsS0FBTCxDQUFXbUIsS0FBWCxJQUFvQixLQUFLbkIsS0FBTCxDQUFXa0IsT0FBL0IsSUFBMEMsS0FBS2xCLEtBQUwsQ0FBV1MsYUFBekQsRUFBd0U7QUFDcEUsYUFBTyxJQUFQO0FBQ0g7O0FBRUQsVUFBTW9CLGdCQUFnQixHQUFHMUIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGlDQUFqQixDQUF6QjtBQUVBLFFBQUkwQixZQUFKOztBQUNBLFFBQUksS0FBSzlCLEtBQUwsQ0FBV0MsVUFBZixFQUEyQjtBQUN2QjZCLE1BQUFBLFlBQVksR0FBRyx5QkFBRyxvQ0FBSCxDQUFmO0FBQ0gsS0FGRCxNQUVPO0FBQ0hBLE1BQUFBLFlBQVksR0FBRyx5QkFBRyx3QkFBSCxDQUFmO0FBQ0g7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUFpRCx5QkFDN0MsK0JBRDZDLENBQWpELENBREosZUFJSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksd0NBQUkseUJBQ0EsdURBQ0EscURBREEsR0FFQSw4QkFIQSxDQUFKLENBREosZUFNSSx3Q0FBSSx5QkFDQSxzREFDQSxvQkFGQSxFQUVzQixFQUZ0QixFQUdBO0FBQ0k7QUFDQTtBQUNBQyxNQUFBQSxDQUFDLEVBQUVDLEdBQUcsSUFBSTtBQUhkLEtBSEEsQ0FBSixDQU5KLENBSkosZUFvQkk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsSUFBSSxFQUFDLFNBQXZCO0FBQ0ksTUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFEbEIsT0FFS0gsWUFGTCxDQURKLGVBS0ksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxTQUFTLEVBQUMsaURBQTVCO0FBQ0ksTUFBQSxPQUFPLEVBQUUsS0FBS0k7QUFEbEIsT0FFTSx5QkFBRyxTQUFILENBRk4sQ0FMSixlQVNJLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsU0FBUyxFQUFDLGlEQUE1QjtBQUNJLE1BQUEsT0FBTyxFQUFFLEtBQUtDO0FBRGxCLE9BRU0seUJBQUcsb0JBQUgsQ0FGTixDQVRKLENBcEJKLENBREo7QUFxQ0g7O0FBOUlpRTs7OzhCQUFqRHhDLG9CLGVBQ0U7QUFDZjtBQUNBb0IsRUFBQUEsaUJBQWlCLEVBQUVxQixtQkFBVUM7QUFGZCxDOzhCQURGMUMsb0Isa0JBTUs7QUFDbEJvQixFQUFBQSxpQkFBaUIsRUFBRSxZQUFXLENBQUU7QUFEZCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7IF90IH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi9Nb2RhbFwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlLCB7U2V0dGluZ0xldmVsfSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSb29tUmVjb3ZlcnlSZW1pbmRlciBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIGNhbGxlZCBpZiB0aGUgdXNlciBzZXRzIHRoZSBvcHRpb24gdG8gc3VwcHJlc3MgdGhpcyByZW1pbmRlciBpbiB0aGUgZnV0dXJlXG4gICAgICAgIG9uRG9udEFza0FnYWluU2V0OiBQcm9wVHlwZXMuZnVuYyxcbiAgICB9XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBvbkRvbnRBc2tBZ2FpblNldDogZnVuY3Rpb24oKSB7fSxcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIGJhY2t1cEluZm86IG51bGwsXG4gICAgICAgICAgICBub3ROb3dDbGlja2VkOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5fbG9hZEJhY2t1cFN0YXR1cygpO1xuICAgIH1cblxuICAgIGFzeW5jIF9sb2FkQmFja3VwU3RhdHVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYmFja3VwSW5mbyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRLZXlCYWNrdXBWZXJzaW9uKCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBiYWNrdXBJbmZvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5hYmxlIHRvIGZldGNoIGtleSBiYWNrdXAgc3RhdHVzXCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNob3dTZXR1cERpYWxvZyA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwSW5mbykge1xuICAgICAgICAgICAgLy8gQSBrZXkgYmFja3VwIGV4aXN0cyBmb3IgdGhpcyBhY2NvdW50LCBidXQgdGhlIGNyZWF0aW5nIGRldmljZSBpcyBub3RcbiAgICAgICAgICAgIC8vIHZlcmlmaWVkLCBzbyByZXN0b3JlIHRoZSBiYWNrdXAgd2hpY2ggd2lsbCBnaXZlIHVzIHRoZSBrZXlzIGZyb20gaXQgYW5kXG4gICAgICAgICAgICAvLyBhbGxvdyB1cyB0byB0cnVzdCBpdCAoaWUuIHVwbG9hZCBrZXlzIHRvIGl0KVxuICAgICAgICAgICAgY29uc3QgUmVzdG9yZUtleUJhY2t1cERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3Mua2V5YmFja3VwLlJlc3RvcmVLZXlCYWNrdXBEaWFsb2cnKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXG4gICAgICAgICAgICAgICAgJ1Jlc3RvcmUgQmFja3VwJywgJycsIFJlc3RvcmVLZXlCYWNrdXBEaWFsb2csIG51bGwsIG51bGwsXG4gICAgICAgICAgICAgICAgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMoXCJLZXkgQmFja3VwXCIsIFwiS2V5IEJhY2t1cFwiLFxuICAgICAgICAgICAgICAgIGltcG9ydChcIi4uLy4uLy4uL2FzeW5jLWNvbXBvbmVudHMvdmlld3MvZGlhbG9ncy9rZXliYWNrdXAvQ3JlYXRlS2V5QmFja3VwRGlhbG9nXCIpLFxuICAgICAgICAgICAgICAgIG51bGwsIG51bGwsIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIHRydWUsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Pbk5vdE5vd0NsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtub3ROb3dDbGlja2VkOiB0cnVlfSk7XG4gICAgfVxuXG4gICAgb25Eb250QXNrQWdhaW5DbGljayA9ICgpID0+IHtcbiAgICAgICAgLy8gV2hlbiB5b3UgY2hvb3NlIFwiRG9uJ3QgYXNrIGFnYWluXCIgZnJvbSB0aGUgcm9vbSByZW1pbmRlciwgd2Ugc2hvdyBhXG4gICAgICAgIC8vIGRpYWxvZyB0byBjb25maXJtIHRoZSBjaG9pY2UuXG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYyhcIklnbm9yZSBSZWNvdmVyeSBSZW1pbmRlclwiLCBcIklnbm9yZSBSZWNvdmVyeSBSZW1pbmRlclwiLFxuICAgICAgICAgICAgaW1wb3J0KFwiLi4vLi4vLi4vYXN5bmMtY29tcG9uZW50cy92aWV3cy9kaWFsb2dzL2tleWJhY2t1cC9JZ25vcmVSZWNvdmVyeVJlbWluZGVyRGlhbG9nXCIpLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9uRG9udEFza0FnYWluOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNob3dSb29tUmVjb3ZlcnlSZW1pbmRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFNldHRpbmdMZXZlbC5BQ0NPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25Eb250QXNrQWdhaW5TZXQoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uU2V0dXA6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93U2V0dXBEaWFsb2coKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBvblNldHVwQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd1NldHVwRGlhbG9nKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyBJZiB0aGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBqdXN0IGRvbid0IGRpc3BsYXkgdGhlIGJhbm5lcjogd2UnbGwgdHJ5IGFnYWluXG4gICAgICAgIC8vIG5leHQgdGltZSB0aGUgdXNlciBzd2l0Y2hzIHRvIHRoZSByb29tLlxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvciB8fCB0aGlzLnN0YXRlLmxvYWRpbmcgfHwgdGhpcy5zdGF0ZS5ub3ROb3dDbGlja2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcblxuICAgICAgICBsZXQgc2V0dXBDYXB0aW9uO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5iYWNrdXBJbmZvKSB7XG4gICAgICAgICAgICBzZXR1cENhcHRpb24gPSBfdChcIkNvbm5lY3QgdGhpcyBzZXNzaW9uIHRvIEtleSBCYWNrdXBcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXR1cENhcHRpb24gPSBfdChcIlN0YXJ0IHVzaW5nIEtleSBCYWNrdXBcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tUmVjb3ZlcnlSZW1pbmRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVJlY292ZXJ5UmVtaW5kZXJfaGVhZGVyXCI+e190KFxuICAgICAgICAgICAgICAgICAgICBcIk5ldmVyIGxvc2UgZW5jcnlwdGVkIG1lc3NhZ2VzXCIsXG4gICAgICAgICAgICAgICAgKX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21SZWNvdmVyeVJlbWluZGVyX2JvZHlcIj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNZXNzYWdlcyBpbiB0aGlzIHJvb20gYXJlIHNlY3VyZWQgd2l0aCBlbmQtdG8tZW5kIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZW5jcnlwdGlvbi4gT25seSB5b3UgYW5kIHRoZSByZWNpcGllbnQocykgaGF2ZSB0aGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJrZXlzIHRvIHJlYWQgdGhlc2UgbWVzc2FnZXMuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNlY3VyZWx5IGJhY2sgdXAgeW91ciBrZXlzIHRvIGF2b2lkIGxvc2luZyB0aGVtLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxhPkxlYXJuIG1vcmUuPC9hPlwiLCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBkb24ndCBoYXZlIHRoaXMgbGluayB5ZXQ6IHRoaXMgd2lsbCBwcmV2ZW50IHRoZSB0cmFuc2xhdG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmluZyB0byByZS10cmFuc2xhdGUgdGhlIHN0cmluZyB3aGVuIHdlIGRvLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGE6IHN1YiA9PiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVJlY292ZXJ5UmVtaW5kZXJfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU2V0dXBDbGlja30+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2V0dXBDYXB0aW9ufVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X1Jvb21SZWNvdmVyeVJlbWluZGVyX3NlY29uZGFyeSBteF9saW5rQnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25Pbk5vdE5vd0NsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJOb3Qgbm93XCIpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Sb29tUmVjb3ZlcnlSZW1pbmRlcl9zZWNvbmRhcnkgbXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uRG9udEFza0FnYWluQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkRvbid0IGFzayBtZSBhZ2FpblwiKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==