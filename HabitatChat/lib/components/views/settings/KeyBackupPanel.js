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

var sdk = _interopRequireWildcard3(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

/*
Copyright 2018 New Vector Ltd
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
class KeyBackupPanel extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onKeyBackupSessionsRemaining", sessionsRemaining => {
      this.setState({
        sessionsRemaining
      });
    });
    (0, _defineProperty2.default)(this, "_onKeyBackupStatus", () => {
      // This just loads the current backup status rather than forcing
      // a re-check otherwise we risk causing infinite loops
      this._loadBackupStatus();
    });
    (0, _defineProperty2.default)(this, "_startNewBackup", () => {
      _Modal.default.createTrackedDialogAsync('Key Backup', 'Key Backup', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../async-components/views/dialogs/keybackup/CreateKeyBackupDialog'))), {
        onFinished: () => {
          this._loadBackupStatus();
        }
      }, null,
      /* priority = */
      false,
      /* static = */
      true);
    });
    (0, _defineProperty2.default)(this, "_deleteBackup", () => {
      const QuestionDialog = sdk.getComponent('dialogs.QuestionDialog');

      _Modal.default.createTrackedDialog('Delete Backup', '', QuestionDialog, {
        title: (0, _languageHandler._t)('Delete Backup'),
        description: (0, _languageHandler._t)("Are you sure? You will lose your encrypted messages if your " + "keys are not backed up properly."),
        button: (0, _languageHandler._t)('Delete Backup'),
        danger: true,
        onFinished: proceed => {
          if (!proceed) return;
          this.setState({
            loading: true
          });

          _MatrixClientPeg.MatrixClientPeg.get().deleteKeyBackupVersion(this.state.backupInfo.version).then(() => {
            this._loadBackupStatus();
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "_restoreBackup", async () => {
      const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');

      _Modal.default.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, null, null,
      /* priority = */
      false,
      /* static = */
      true);
    });
    this._unmounted = false;
    this.state = {
      loading: true,
      error: null,
      backupInfo: null,
      backupSigStatus: null,
      backupKeyStored: null,
      sessionsRemaining: 0
    };
  }

  componentDidMount() {
    this._checkKeyBackupStatus();

    _MatrixClientPeg.MatrixClientPeg.get().on('crypto.keyBackupStatus', this._onKeyBackupStatus);

    _MatrixClientPeg.MatrixClientPeg.get().on('crypto.keyBackupSessionsRemaining', this._onKeyBackupSessionsRemaining);
  }

  componentWillUnmount() {
    this._unmounted = true;

    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener('crypto.keyBackupStatus', this._onKeyBackupStatus);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener('crypto.keyBackupSessionsRemaining', this._onKeyBackupSessionsRemaining);
    }
  }

  async _checkKeyBackupStatus() {
    try {
      const {
        backupInfo,
        trustInfo
      } = await _MatrixClientPeg.MatrixClientPeg.get().checkKeyBackup();
      const backupKeyStored = Boolean((await _MatrixClientPeg.MatrixClientPeg.get().isKeyBackupKeyStored()));
      this.setState({
        backupInfo,
        backupSigStatus: trustInfo,
        backupKeyStored,
        error: null,
        loading: false
      });
    } catch (e) {
      console.log("Unable to fetch check backup status", e);
      if (this._unmounted) return;
      this.setState({
        error: e,
        backupInfo: null,
        backupSigStatus: null,
        backupKeyStored: null,
        loading: false
      });
    }
  }

  async _loadBackupStatus() {
    this.setState({
      loading: true
    });

    try {
      const backupInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
      const backupSigStatus = await _MatrixClientPeg.MatrixClientPeg.get().isKeyBackupTrusted(backupInfo);
      const backupKeyStored = await _MatrixClientPeg.MatrixClientPeg.get().isKeyBackupKeyStored();
      if (this._unmounted) return;
      this.setState({
        error: null,
        backupInfo,
        backupSigStatus,
        backupKeyStored,
        loading: false
      });
    } catch (e) {
      console.log("Unable to fetch key backup status", e);
      if (this._unmounted) return;
      this.setState({
        error: e,
        backupInfo: null,
        backupSigStatus: null,
        backupKeyStored: null,
        loading: false
      });
    }
  }

  render() {
    const Spinner = sdk.getComponent("elements.Spinner");
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const encryptedMessageAreEncrypted = (0, _languageHandler._t)("Encrypted messages are secured with end-to-end encryption. " + "Only you and the recipient(s) have the keys to read these messages.");

    if (this.state.error) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "error"
      }, (0, _languageHandler._t)("Unable to load key backup status"));
    } else if (this.state.loading) {
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else if (this.state.backupInfo) {
      let clientBackupStatus;
      let restoreButtonCaption = (0, _languageHandler._t)("Restore from Backup");

      if (_MatrixClientPeg.MatrixClientPeg.get().getKeyBackupEnabled()) {
        clientBackupStatus = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, encryptedMessageAreEncrypted), /*#__PURE__*/_react.default.createElement("p", null, "\u2705 ", (0, _languageHandler._t)("This session is backing up your keys. ")));
      } else {
        clientBackupStatus = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, encryptedMessageAreEncrypted), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This session is <b>not backing up your keys</b>, " + "but you do have an existing backup you can restore from " + "and add to going forward.", {}, {
          b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
        })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Connect this session to key backup before signing out to avoid " + "losing any keys that may only be on this session.")));
        restoreButtonCaption = (0, _languageHandler._t)("Connect this session to Key Backup");
      }

      let keyStatus;

      if (this.state.backupKeyStored === true) {
        keyStatus = (0, _languageHandler._t)("in secret storage");
      } else {
        keyStatus = (0, _languageHandler._t)("not stored");
      }

      let uploadStatus;
      const {
        sessionsRemaining
      } = this.state;

      if (!_MatrixClientPeg.MatrixClientPeg.get().getKeyBackupEnabled()) {
        // No upload status to show when backup disabled.
        uploadStatus = "";
      } else if (sessionsRemaining > 0) {
        uploadStatus = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Backing up %(sessionsRemaining)s keys...", {
          sessionsRemaining
        }), " ", /*#__PURE__*/_react.default.createElement("br", null));
      } else {
        uploadStatus = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("All keys backed up"), " ", /*#__PURE__*/_react.default.createElement("br", null));
      }

      let backupSigStatuses = this.state.backupSigStatus.sigs.map((sig, i) => {
        const deviceName = sig.device ? sig.device.getDisplayName() || sig.device.deviceId : null;

        const validity = sub => /*#__PURE__*/_react.default.createElement("span", {
          className: sig.valid ? 'mx_KeyBackupPanel_sigValid' : 'mx_KeyBackupPanel_sigInvalid'
        }, sub);

        const verify = sub => /*#__PURE__*/_react.default.createElement("span", {
          className: sig.device && sig.deviceTrust.isVerified() ? 'mx_KeyBackupPanel_deviceVerified' : 'mx_KeyBackupPanel_deviceNotVerified'
        }, sub);

        const device = sub => /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_KeyBackupPanel_deviceName"
        }, deviceName);

        const fromThisDevice = sig.device && sig.device.getFingerprint() === _MatrixClientPeg.MatrixClientPeg.get().getDeviceEd25519Key();

        const fromThisUser = sig.crossSigningId && sig.deviceId === _MatrixClientPeg.MatrixClientPeg.get().getCrossSigningId();

        let sigStatus;

        if (sig.valid && fromThisUser) {
          sigStatus = (0, _languageHandler._t)("Backup has a <validity>valid</validity> signature from this user", {}, {
            validity
          });
        } else if (!sig.valid && fromThisUser) {
          sigStatus = (0, _languageHandler._t)("Backup has a <validity>invalid</validity> signature from this user", {}, {
            validity
          });
        } else if (sig.crossSigningId) {
          sigStatus = (0, _languageHandler._t)("Backup has a signature from <verify>unknown</verify> user with ID %(deviceId)s", {
            deviceId: sig.deviceId
          }, {
            verify
          });
        } else if (!sig.device) {
          sigStatus = (0, _languageHandler._t)("Backup has a signature from <verify>unknown</verify> session with ID %(deviceId)s", {
            deviceId: sig.deviceId
          }, {
            verify
          });
        } else if (sig.valid && fromThisDevice) {
          sigStatus = (0, _languageHandler._t)("Backup has a <validity>valid</validity> signature from this session", {}, {
            validity
          });
        } else if (!sig.valid && fromThisDevice) {
          // it can happen...
          sigStatus = (0, _languageHandler._t)("Backup has an <validity>invalid</validity> signature from this session", {}, {
            validity
          });
        } else if (sig.valid && sig.deviceTrust.isVerified()) {
          sigStatus = (0, _languageHandler._t)("Backup has a <validity>valid</validity> signature from " + "<verify>verified</verify> session <device></device>", {}, {
            validity,
            verify,
            device
          });
        } else if (sig.valid && !sig.deviceTrust.isVerified()) {
          sigStatus = (0, _languageHandler._t)("Backup has a <validity>valid</validity> signature from " + "<verify>unverified</verify> session <device></device>", {}, {
            validity,
            verify,
            device
          });
        } else if (!sig.valid && sig.deviceTrust.isVerified()) {
          sigStatus = (0, _languageHandler._t)("Backup has an <validity>invalid</validity> signature from " + "<verify>verified</verify> session <device></device>", {}, {
            validity,
            verify,
            device
          });
        } else if (!sig.valid && !sig.deviceTrust.isVerified()) {
          sigStatus = (0, _languageHandler._t)("Backup has an <validity>invalid</validity> signature from " + "<verify>unverified</verify> session <device></device>", {}, {
            validity,
            verify,
            device
          });
        }

        return /*#__PURE__*/_react.default.createElement("div", {
          key: i
        }, sigStatus);
      });

      if (this.state.backupSigStatus.sigs.length === 0) {
        backupSigStatuses = (0, _languageHandler._t)("Backup is not signed by any of your sessions");
      }

      let trustedLocally;

      if (this.state.backupSigStatus.trusted_locally) {
        trustedLocally = (0, _languageHandler._t)("This backup is trusted because it has been restored on this session");
      }

      let buttonRow = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_KeyBackupPanel_buttonRow"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "primary",
        onClick: this._restoreBackup
      }, restoreButtonCaption), "\xA0\xA0\xA0", /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "danger",
        onClick: this._deleteBackup
      }, (0, _languageHandler._t)("Delete Backup")));

      if (this.state.backupKeyStored && !_SettingsStore.default.getValue("feature_cross_signing")) {
        buttonRow = /*#__PURE__*/_react.default.createElement("p", null, "\u26A0\uFE0F ", (0, _languageHandler._t)("Backup key stored in secret storage, but this feature is not " + "enabled on this session. Please enable cross-signing in Labs to " + "modify key backup state."));
      }

      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, clientBackupStatus), /*#__PURE__*/_react.default.createElement("details", null, /*#__PURE__*/_react.default.createElement("summary", null, (0, _languageHandler._t)("Advanced")), /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Backup version: "), this.state.backupInfo.version), /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Algorithm: "), this.state.backupInfo.algorithm), /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Backup key stored: "), keyStatus), uploadStatus, /*#__PURE__*/_react.default.createElement("div", null, backupSigStatuses), /*#__PURE__*/_react.default.createElement("div", null, trustedLocally)), buttonRow);
    } else {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your keys are <b>not being backed up from this session</b>.", {}, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      })), /*#__PURE__*/_react.default.createElement("p", null, encryptedMessageAreEncrypted), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Back up your keys before signing out to avoid losing them."))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_KeyBackupPanel_buttonRow"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "primary",
        onClick: this._startNewBackup
      }, (0, _languageHandler._t)("Start using Key Backup"))));
    }
  }

}

exports.default = KeyBackupPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0tleUJhY2t1cFBhbmVsLmpzIl0sIm5hbWVzIjpbIktleUJhY2t1cFBhbmVsIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInNlc3Npb25zUmVtYWluaW5nIiwic2V0U3RhdGUiLCJfbG9hZEJhY2t1cFN0YXR1cyIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jIiwib25GaW5pc2hlZCIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJidXR0b24iLCJkYW5nZXIiLCJwcm9jZWVkIiwibG9hZGluZyIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImRlbGV0ZUtleUJhY2t1cFZlcnNpb24iLCJzdGF0ZSIsImJhY2t1cEluZm8iLCJ2ZXJzaW9uIiwidGhlbiIsIlJlc3RvcmVLZXlCYWNrdXBEaWFsb2ciLCJfdW5tb3VudGVkIiwiZXJyb3IiLCJiYWNrdXBTaWdTdGF0dXMiLCJiYWNrdXBLZXlTdG9yZWQiLCJjb21wb25lbnREaWRNb3VudCIsIl9jaGVja0tleUJhY2t1cFN0YXR1cyIsIm9uIiwiX29uS2V5QmFja3VwU3RhdHVzIiwiX29uS2V5QmFja3VwU2Vzc2lvbnNSZW1haW5pbmciLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwidHJ1c3RJbmZvIiwiY2hlY2tLZXlCYWNrdXAiLCJCb29sZWFuIiwiaXNLZXlCYWNrdXBLZXlTdG9yZWQiLCJlIiwiY29uc29sZSIsImxvZyIsImdldEtleUJhY2t1cFZlcnNpb24iLCJpc0tleUJhY2t1cFRydXN0ZWQiLCJyZW5kZXIiLCJTcGlubmVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsImVuY3J5cHRlZE1lc3NhZ2VBcmVFbmNyeXB0ZWQiLCJjbGllbnRCYWNrdXBTdGF0dXMiLCJyZXN0b3JlQnV0dG9uQ2FwdGlvbiIsImdldEtleUJhY2t1cEVuYWJsZWQiLCJiIiwic3ViIiwia2V5U3RhdHVzIiwidXBsb2FkU3RhdHVzIiwiYmFja3VwU2lnU3RhdHVzZXMiLCJzaWdzIiwibWFwIiwic2lnIiwiaSIsImRldmljZU5hbWUiLCJkZXZpY2UiLCJnZXREaXNwbGF5TmFtZSIsImRldmljZUlkIiwidmFsaWRpdHkiLCJ2YWxpZCIsInZlcmlmeSIsImRldmljZVRydXN0IiwiaXNWZXJpZmllZCIsImZyb21UaGlzRGV2aWNlIiwiZ2V0RmluZ2VycHJpbnQiLCJnZXREZXZpY2VFZDI1NTE5S2V5IiwiZnJvbVRoaXNVc2VyIiwiY3Jvc3NTaWduaW5nSWQiLCJnZXRDcm9zc1NpZ25pbmdJZCIsInNpZ1N0YXR1cyIsImxlbmd0aCIsInRydXN0ZWRMb2NhbGx5IiwidHJ1c3RlZF9sb2NhbGx5IiwiYnV0dG9uUm93IiwiX3Jlc3RvcmVCYWNrdXAiLCJfZGVsZXRlQmFja3VwIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiYWxnb3JpdGhtIiwiX3N0YXJ0TmV3QmFja3VwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdkJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBeUJlLE1BQU1BLGNBQU4sU0FBNkJDLGVBQU1DLGFBQW5DLENBQWlEO0FBQzVEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSx5RUFvQ2NDLGlCQUFELElBQXVCO0FBQ25ELFdBQUtDLFFBQUwsQ0FBYztBQUNWRCxRQUFBQTtBQURVLE9BQWQ7QUFHSCxLQXhDa0I7QUFBQSw4REEwQ0UsTUFBTTtBQUN2QjtBQUNBO0FBQ0EsV0FBS0UsaUJBQUw7QUFDSCxLQTlDa0I7QUFBQSwyREFtR0QsTUFBTTtBQUNwQkMscUJBQU1DLHdCQUFOLENBQStCLFlBQS9CLEVBQTZDLFlBQTdDLDZFQUNXLHlFQURYLEtBRUk7QUFDSUMs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SixDQUxKLGVBTUksd0NBQUkseUJBQUcsNERBQUgsQ0FBSixDQU5KLENBREcsZUFTSDtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0ksNkJBQUMsZ0JBQUQ7QUFBa0IsUUFBQSxJQUFJLEVBQUMsU0FBdkI7QUFBaUMsUUFBQSxPQUFPLEVBQUUsS0FBS3NDO0FBQS9DLFNBQ0sseUJBQUcsd0JBQUgsQ0FETCxDQURKLENBVEcsQ0FBUDtBQWVIO0FBQ0o7O0FBclYyRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuXG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEtleUJhY2t1cFBhbmVsIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgYmFja3VwSW5mbzogbnVsbCxcbiAgICAgICAgICAgIGJhY2t1cFNpZ1N0YXR1czogbnVsbCxcbiAgICAgICAgICAgIGJhY2t1cEtleVN0b3JlZDogbnVsbCxcbiAgICAgICAgICAgIHNlc3Npb25zUmVtYWluaW5nOiAwLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLl9jaGVja0tleUJhY2t1cFN0YXR1cygpO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbignY3J5cHRvLmtleUJhY2t1cFN0YXR1cycsIHRoaXMuX29uS2V5QmFja3VwU3RhdHVzKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFxuICAgICAgICAgICAgJ2NyeXB0by5rZXlCYWNrdXBTZXNzaW9uc1JlbWFpbmluZycsXG4gICAgICAgICAgICB0aGlzLl9vbktleUJhY2t1cFNlc3Npb25zUmVtYWluaW5nLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkpIHtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignY3J5cHRvLmtleUJhY2t1cFN0YXR1cycsIHRoaXMuX29uS2V5QmFja3VwU3RhdHVzKTtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAnY3J5cHRvLmtleUJhY2t1cFNlc3Npb25zUmVtYWluaW5nJyxcbiAgICAgICAgICAgICAgICB0aGlzLl9vbktleUJhY2t1cFNlc3Npb25zUmVtYWluaW5nLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vbktleUJhY2t1cFNlc3Npb25zUmVtYWluaW5nID0gKHNlc3Npb25zUmVtYWluaW5nKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2Vzc2lvbnNSZW1haW5pbmcsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbktleUJhY2t1cFN0YXR1cyA9ICgpID0+IHtcbiAgICAgICAgLy8gVGhpcyBqdXN0IGxvYWRzIHRoZSBjdXJyZW50IGJhY2t1cCBzdGF0dXMgcmF0aGVyIHRoYW4gZm9yY2luZ1xuICAgICAgICAvLyBhIHJlLWNoZWNrIG90aGVyd2lzZSB3ZSByaXNrIGNhdXNpbmcgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgdGhpcy5fbG9hZEJhY2t1cFN0YXR1cygpO1xuICAgIH1cblxuICAgIGFzeW5jIF9jaGVja0tleUJhY2t1cFN0YXR1cygpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHtiYWNrdXBJbmZvLCB0cnVzdEluZm99ID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmNoZWNrS2V5QmFja3VwKCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBLZXlTdG9yZWQgPSBCb29sZWFuKGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0tleUJhY2t1cEtleVN0b3JlZCgpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgYmFja3VwU2lnU3RhdHVzOiB0cnVzdEluZm8sXG4gICAgICAgICAgICAgICAgYmFja3VwS2V5U3RvcmVkLFxuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5hYmxlIHRvIGZldGNoIGNoZWNrIGJhY2t1cCBzdGF0dXNcIiwgZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZSxcbiAgICAgICAgICAgICAgICBiYWNrdXBJbmZvOiBudWxsLFxuICAgICAgICAgICAgICAgIGJhY2t1cFNpZ1N0YXR1czogbnVsbCxcbiAgICAgICAgICAgICAgICBiYWNrdXBLZXlTdG9yZWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9sb2FkQmFja3VwU3RhdHVzKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBJbmZvID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEtleUJhY2t1cFZlcnNpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cFNpZ1N0YXR1cyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0tleUJhY2t1cFRydXN0ZWQoYmFja3VwSW5mbyk7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBLZXlTdG9yZWQgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNLZXlCYWNrdXBLZXlTdG9yZWQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIGJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgYmFja3VwU2lnU3RhdHVzLFxuICAgICAgICAgICAgICAgIGJhY2t1cEtleVN0b3JlZCxcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVuYWJsZSB0byBmZXRjaCBrZXkgYmFja3VwIHN0YXR1c1wiLCBlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBlLFxuICAgICAgICAgICAgICAgIGJhY2t1cEluZm86IG51bGwsXG4gICAgICAgICAgICAgICAgYmFja3VwU2lnU3RhdHVzOiBudWxsLFxuICAgICAgICAgICAgICAgIGJhY2t1cEtleVN0b3JlZDogbnVsbCxcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3N0YXJ0TmV3QmFja3VwID0gKCkgPT4ge1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMoJ0tleSBCYWNrdXAnLCAnS2V5IEJhY2t1cCcsXG4gICAgICAgICAgICBpbXBvcnQoJy4uLy4uLy4uL2FzeW5jLWNvbXBvbmVudHMvdmlld3MvZGlhbG9ncy9rZXliYWNrdXAvQ3JlYXRlS2V5QmFja3VwRGlhbG9nJyksXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkQmFja3VwU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sIG51bGwsIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIHRydWUsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX2RlbGV0ZUJhY2t1cCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nJyk7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0RlbGV0ZSBCYWNrdXAnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdCgnRGVsZXRlIEJhY2t1cCcpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgIFwiQXJlIHlvdSBzdXJlPyBZb3Ugd2lsbCBsb3NlIHlvdXIgZW5jcnlwdGVkIG1lc3NhZ2VzIGlmIHlvdXIgXCIgK1xuICAgICAgICAgICAgICAgIFwia2V5cyBhcmUgbm90IGJhY2tlZCB1cCBwcm9wZXJseS5cIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBidXR0b246IF90KCdEZWxldGUgQmFja3VwJyksXG4gICAgICAgICAgICBkYW5nZXI6IHRydWUsXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAocHJvY2VlZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcHJvY2VlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IHRydWV9KTtcbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZGVsZXRlS2V5QmFja3VwVmVyc2lvbih0aGlzLnN0YXRlLmJhY2t1cEluZm8udmVyc2lvbikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRCYWNrdXBTdGF0dXMoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZXN0b3JlQmFja3VwID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBSZXN0b3JlS2V5QmFja3VwRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5rZXliYWNrdXAuUmVzdG9yZUtleUJhY2t1cERpYWxvZycpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgJ1Jlc3RvcmUgQmFja3VwJywgJycsIFJlc3RvcmVLZXlCYWNrdXBEaWFsb2csIG51bGwsIG51bGwsXG4gICAgICAgICAgICAvKiBwcmlvcml0eSA9ICovIGZhbHNlLCAvKiBzdGF0aWMgPSAqLyB0cnVlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b25cIik7XG4gICAgICAgIGNvbnN0IGVuY3J5cHRlZE1lc3NhZ2VBcmVFbmNyeXB0ZWQgPSBfdChcbiAgICAgICAgICAgIFwiRW5jcnlwdGVkIG1lc3NhZ2VzIGFyZSBzZWN1cmVkIHdpdGggZW5kLXRvLWVuZCBlbmNyeXB0aW9uLiBcIiArXG4gICAgICAgICAgICBcIk9ubHkgeW91IGFuZCB0aGUgcmVjaXBpZW50KHMpIGhhdmUgdGhlIGtleXMgdG8gcmVhZCB0aGVzZSBtZXNzYWdlcy5cIixcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCI+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlVuYWJsZSB0byBsb2FkIGtleSBiYWNrdXAgc3RhdHVzXCIpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiA8U3Bpbm5lciAvPjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmJhY2t1cEluZm8pIHtcbiAgICAgICAgICAgIGxldCBjbGllbnRCYWNrdXBTdGF0dXM7XG4gICAgICAgICAgICBsZXQgcmVzdG9yZUJ1dHRvbkNhcHRpb24gPSBfdChcIlJlc3RvcmUgZnJvbSBCYWNrdXBcIik7XG5cbiAgICAgICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0S2V5QmFja3VwRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgY2xpZW50QmFja3VwU3RhdHVzID0gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e2VuY3J5cHRlZE1lc3NhZ2VBcmVFbmNyeXB0ZWR9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD7inIUge190KFwiVGhpcyBzZXNzaW9uIGlzIGJhY2tpbmcgdXAgeW91ciBrZXlzLiBcIil9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xpZW50QmFja3VwU3RhdHVzID0gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e2VuY3J5cHRlZE1lc3NhZ2VBcmVFbmNyeXB0ZWR9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgc2Vzc2lvbiBpcyA8Yj5ub3QgYmFja2luZyB1cCB5b3VyIGtleXM8L2I+LCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImJ1dCB5b3UgZG8gaGF2ZSBhbiBleGlzdGluZyBiYWNrdXAgeW91IGNhbiByZXN0b3JlIGZyb20gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJhbmQgYWRkIHRvIGdvaW5nIGZvcndhcmQuXCIsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAge2I6IHN1YiA9PiA8Yj57c3VifTwvYj59LFxuICAgICAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJDb25uZWN0IHRoaXMgc2Vzc2lvbiB0byBrZXkgYmFja3VwIGJlZm9yZSBzaWduaW5nIG91dCB0byBhdm9pZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvc2luZyBhbnkga2V5cyB0aGF0IG1heSBvbmx5IGJlIG9uIHRoaXMgc2Vzc2lvbi5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgIHJlc3RvcmVCdXR0b25DYXB0aW9uID0gX3QoXCJDb25uZWN0IHRoaXMgc2Vzc2lvbiB0byBLZXkgQmFja3VwXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQga2V5U3RhdHVzO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwS2V5U3RvcmVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAga2V5U3RhdHVzID0gX3QoXCJpbiBzZWNyZXQgc3RvcmFnZVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2V5U3RhdHVzID0gX3QoXCJub3Qgc3RvcmVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdXBsb2FkU3RhdHVzO1xuICAgICAgICAgICAgY29uc3QgeyBzZXNzaW9uc1JlbWFpbmluZyB9ID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEtleUJhY2t1cEVuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIC8vIE5vIHVwbG9hZCBzdGF0dXMgdG8gc2hvdyB3aGVuIGJhY2t1cCBkaXNhYmxlZC5cbiAgICAgICAgICAgICAgICB1cGxvYWRTdGF0dXMgPSBcIlwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzZXNzaW9uc1JlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICAgICAgICB1cGxvYWRTdGF0dXMgPSA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJCYWNraW5nIHVwICUoc2Vzc2lvbnNSZW1haW5pbmcpcyBrZXlzLi4uXCIsIHsgc2Vzc2lvbnNSZW1haW5pbmcgfSl9IDxiciAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXBsb2FkU3RhdHVzID0gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiQWxsIGtleXMgYmFja2VkIHVwXCIpfSA8YnIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBiYWNrdXBTaWdTdGF0dXNlcyA9IHRoaXMuc3RhdGUuYmFja3VwU2lnU3RhdHVzLnNpZ3MubWFwKChzaWcsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VOYW1lID0gc2lnLmRldmljZSA/IChzaWcuZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgfHwgc2lnLmRldmljZS5kZXZpY2VJZCkgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkaXR5ID0gc3ViID0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c2lnLnZhbGlkID8gJ214X0tleUJhY2t1cFBhbmVsX3NpZ1ZhbGlkJyA6ICdteF9LZXlCYWNrdXBQYW5lbF9zaWdJbnZhbGlkJ30+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c3VifVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+O1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcmlmeSA9IHN1YiA9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3NpZy5kZXZpY2UgJiYgc2lnLmRldmljZVRydXN0LmlzVmVyaWZpZWQoKSA/ICdteF9LZXlCYWNrdXBQYW5lbF9kZXZpY2VWZXJpZmllZCcgOiAnbXhfS2V5QmFja3VwUGFuZWxfZGV2aWNlTm90VmVyaWZpZWQnfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzdWJ9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj47XG4gICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlID0gc3ViID0+IDxzcGFuIGNsYXNzTmFtZT1cIm14X0tleUJhY2t1cFBhbmVsX2RldmljZU5hbWVcIj57ZGV2aWNlTmFtZX08L3NwYW4+O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21UaGlzRGV2aWNlID0gKFxuICAgICAgICAgICAgICAgICAgICBzaWcuZGV2aWNlICYmXG4gICAgICAgICAgICAgICAgICAgIHNpZy5kZXZpY2UuZ2V0RmluZ2VycHJpbnQoKSA9PT0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldERldmljZUVkMjU1MTlLZXkoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbVRoaXNVc2VyID0gKFxuICAgICAgICAgICAgICAgICAgICBzaWcuY3Jvc3NTaWduaW5nSWQgJiZcbiAgICAgICAgICAgICAgICAgICAgc2lnLmRldmljZUlkID09PSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Q3Jvc3NTaWduaW5nSWQoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgbGV0IHNpZ1N0YXR1cztcbiAgICAgICAgICAgICAgICBpZiAoc2lnLnZhbGlkICYmIGZyb21UaGlzVXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzaWdTdGF0dXMgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQmFja3VwIGhhcyBhIDx2YWxpZGl0eT52YWxpZDwvdmFsaWRpdHk+IHNpZ25hdHVyZSBmcm9tIHRoaXMgdXNlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHkgfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFzaWcudmFsaWQgJiYgZnJvbVRoaXNVc2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpZ1N0YXR1cyA9IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAgaGFzIGEgPHZhbGlkaXR5PmludmFsaWQ8L3ZhbGlkaXR5PiBzaWduYXR1cmUgZnJvbSB0aGlzIHVzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LCB7IHZhbGlkaXR5IH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaWcuY3Jvc3NTaWduaW5nSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lnU3RhdHVzID0gX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkJhY2t1cCBoYXMgYSBzaWduYXR1cmUgZnJvbSA8dmVyaWZ5PnVua25vd248L3ZlcmlmeT4gdXNlciB3aXRoIElEICUoZGV2aWNlSWQpc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBkZXZpY2VJZDogc2lnLmRldmljZUlkIH0sIHsgdmVyaWZ5IH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghc2lnLmRldmljZSkge1xuICAgICAgICAgICAgICAgICAgICBzaWdTdGF0dXMgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQmFja3VwIGhhcyBhIHNpZ25hdHVyZSBmcm9tIDx2ZXJpZnk+dW5rbm93bjwvdmVyaWZ5PiBzZXNzaW9uIHdpdGggSUQgJShkZXZpY2VJZClzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGRldmljZUlkOiBzaWcuZGV2aWNlSWQgfSwgeyB2ZXJpZnkgfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpZy52YWxpZCAmJiBmcm9tVGhpc0RldmljZSkge1xuICAgICAgICAgICAgICAgICAgICBzaWdTdGF0dXMgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQmFja3VwIGhhcyBhIDx2YWxpZGl0eT52YWxpZDwvdmFsaWRpdHk+IHNpZ25hdHVyZSBmcm9tIHRoaXMgc2Vzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHkgfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFzaWcudmFsaWQgJiYgZnJvbVRoaXNEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgY2FuIGhhcHBlbi4uLlxuICAgICAgICAgICAgICAgICAgICBzaWdTdGF0dXMgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQmFja3VwIGhhcyBhbiA8dmFsaWRpdHk+aW52YWxpZDwvdmFsaWRpdHk+IHNpZ25hdHVyZSBmcm9tIHRoaXMgc2Vzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHkgfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpZy52YWxpZCAmJiBzaWcuZGV2aWNlVHJ1c3QuaXNWZXJpZmllZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpZ1N0YXR1cyA9IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAgaGFzIGEgPHZhbGlkaXR5PnZhbGlkPC92YWxpZGl0eT4gc2lnbmF0dXJlIGZyb20gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCI8dmVyaWZ5PnZlcmlmaWVkPC92ZXJpZnk+IHNlc3Npb24gPGRldmljZT48L2RldmljZT5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LCB7IHZhbGlkaXR5LCB2ZXJpZnksIGRldmljZSB9LFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2lnLnZhbGlkICYmICFzaWcuZGV2aWNlVHJ1c3QuaXNWZXJpZmllZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpZ1N0YXR1cyA9IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAgaGFzIGEgPHZhbGlkaXR5PnZhbGlkPC92YWxpZGl0eT4gc2lnbmF0dXJlIGZyb20gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCI8dmVyaWZ5PnVudmVyaWZpZWQ8L3ZlcmlmeT4gc2Vzc2lvbiA8ZGV2aWNlPjwvZGV2aWNlPlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHksIHZlcmlmeSwgZGV2aWNlIH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghc2lnLnZhbGlkICYmIHNpZy5kZXZpY2VUcnVzdC5pc1ZlcmlmaWVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lnU3RhdHVzID0gX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkJhY2t1cCBoYXMgYW4gPHZhbGlkaXR5PmludmFsaWQ8L3ZhbGlkaXR5PiBzaWduYXR1cmUgZnJvbSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjx2ZXJpZnk+dmVyaWZpZWQ8L3ZlcmlmeT4gc2Vzc2lvbiA8ZGV2aWNlPjwvZGV2aWNlPlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHksIHZlcmlmeSwgZGV2aWNlIH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghc2lnLnZhbGlkICYmICFzaWcuZGV2aWNlVHJ1c3QuaXNWZXJpZmllZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpZ1N0YXR1cyA9IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAgaGFzIGFuIDx2YWxpZGl0eT5pbnZhbGlkPC92YWxpZGl0eT4gc2lnbmF0dXJlIGZyb20gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCI8dmVyaWZ5PnVudmVyaWZpZWQ8L3ZlcmlmeT4gc2Vzc2lvbiA8ZGV2aWNlPjwvZGV2aWNlPlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge30sIHsgdmFsaWRpdHksIHZlcmlmeSwgZGV2aWNlIH0sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXYga2V5PXtpfT5cbiAgICAgICAgICAgICAgICAgICAge3NpZ1N0YXR1c31cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmJhY2t1cFNpZ1N0YXR1cy5zaWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJhY2t1cFNpZ1N0YXR1c2VzID0gX3QoXCJCYWNrdXAgaXMgbm90IHNpZ25lZCBieSBhbnkgb2YgeW91ciBzZXNzaW9uc1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHRydXN0ZWRMb2NhbGx5O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwU2lnU3RhdHVzLnRydXN0ZWRfbG9jYWxseSkge1xuICAgICAgICAgICAgICAgIHRydXN0ZWRMb2NhbGx5ID0gX3QoXCJUaGlzIGJhY2t1cCBpcyB0cnVzdGVkIGJlY2F1c2UgaXQgaGFzIGJlZW4gcmVzdG9yZWQgb24gdGhpcyBzZXNzaW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgYnV0dG9uUm93ID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfS2V5QmFja3VwUGFuZWxfYnV0dG9uUm93XCI+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9XCJwcmltYXJ5XCIgb25DbGljaz17dGhpcy5fcmVzdG9yZUJhY2t1cH0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cmVzdG9yZUJ1dHRvbkNhcHRpb259XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4mbmJzcDsmbmJzcDsmbmJzcDtcbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD1cImRhbmdlclwiIG9uQ2xpY2s9e3RoaXMuX2RlbGV0ZUJhY2t1cH0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJEZWxldGUgQmFja3VwXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwS2V5U3RvcmVkICYmICFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uUm93ID0gPHA+4pqg77iPIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAga2V5IHN0b3JlZCBpbiBzZWNyZXQgc3RvcmFnZSwgYnV0IHRoaXMgZmVhdHVyZSBpcyBub3QgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImVuYWJsZWQgb24gdGhpcyBzZXNzaW9uLiBQbGVhc2UgZW5hYmxlIGNyb3NzLXNpZ25pbmcgaW4gTGFicyB0byBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwibW9kaWZ5IGtleSBiYWNrdXAgc3RhdGUuXCIsXG4gICAgICAgICAgICAgICAgKX08L3A+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PntjbGllbnRCYWNrdXBTdGF0dXN9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRldGFpbHM+XG4gICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5PntfdChcIkFkdmFuY2VkXCIpfTwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj57X3QoXCJCYWNrdXAgdmVyc2lvbjogXCIpfXt0aGlzLnN0YXRlLmJhY2t1cEluZm8udmVyc2lvbn08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj57X3QoXCJBbGdvcml0aG06IFwiKX17dGhpcy5zdGF0ZS5iYWNrdXBJbmZvLmFsZ29yaXRobX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj57X3QoXCJCYWNrdXAga2V5IHN0b3JlZDogXCIpfXtrZXlTdGF0dXN9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHt1cGxvYWRTdGF0dXN9XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+e2JhY2t1cFNpZ1N0YXR1c2VzfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0cnVzdGVkTG9jYWxseX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgICAgICAgICAge2J1dHRvblJvd31cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiWW91ciBrZXlzIGFyZSA8Yj5ub3QgYmVpbmcgYmFja2VkIHVwIGZyb20gdGhpcyBzZXNzaW9uPC9iPi5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7Yjogc3ViID0+IDxiPntzdWJ9PC9iPn0sXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57ZW5jcnlwdGVkTWVzc2FnZUFyZUVuY3J5cHRlZH08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcIkJhY2sgdXAgeW91ciBrZXlzIGJlZm9yZSBzaWduaW5nIG91dCB0byBhdm9pZCBsb3NpbmcgdGhlbS5cIil9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfS2V5QmFja3VwUGFuZWxfYnV0dG9uUm93XCI+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9XCJwcmltYXJ5XCIgb25DbGljaz17dGhpcy5fc3RhcnROZXdCYWNrdXB9PlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiU3RhcnQgdXNpbmcgS2V5IEJhY2t1cFwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19