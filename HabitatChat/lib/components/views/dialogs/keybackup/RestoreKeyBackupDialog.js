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

var sdk = _interopRequireWildcard3(require("../../../../index"));

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _matrixJsSdk = require("matrix-js-sdk");

var _Modal = _interopRequireDefault(require("../../../../Modal"));

var _languageHandler = require("../../../../languageHandler");

var _CrossSigningManager = require("../../../../CrossSigningManager");

var _SettingsStore = _interopRequireDefault(require("../../../../settings/SettingsStore"));

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
const RESTORE_TYPE_PASSPHRASE = 0;
const RESTORE_TYPE_RECOVERYKEY = 1;
const RESTORE_TYPE_SECRET_STORAGE = 2;
/*
 * Dialog for restoring e2e keys from a backup and the user's recovery key
 */

class RestoreKeyBackupDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onCancel", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onDone", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_onUseRecoveryKeyClick", () => {
      this.setState({
        forceRecoveryKey: true
      });
    });
    (0, _defineProperty2.default)(this, "_progressCallback", data => {
      this.setState({
        progress: data
      });
    });
    (0, _defineProperty2.default)(this, "_onResetRecoveryClick", () => {
      this.props.onFinished(false);

      if (_SettingsStore.default.getValue("feature_cross_signing")) {
        // If cross-signing is enabled, we reset the SSSS recovery passphrase (and cross-signing keys)
        this.props.onFinished(false);
        (0, _CrossSigningManager.accessSecretStorage)(() => {},
        /* forceReset = */
        true);
      } else {
        _Modal.default.createTrackedDialogAsync('Key Backup', 'Key Backup', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../../async-components/views/dialogs/keybackup/CreateKeyBackupDialog'))), {
          onFinished: () => {
            this._loadBackupStatus();
          }
        }, null,
        /* priority = */
        false,
        /* static = */
        true);
      }
    });
    (0, _defineProperty2.default)(this, "_onRecoveryKeyChange", e => {
      this.setState({
        recoveryKey: e.target.value,
        recoveryKeyValid: _MatrixClientPeg.MatrixClientPeg.get().isValidRecoveryKey(e.target.value)
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseNext", async () => {
      this.setState({
        loading: true,
        restoreError: null,
        restoreType: RESTORE_TYPE_PASSPHRASE
      });

      try {
        // We do still restore the key backup: we must ensure that the key backup key
        // is the right one and restoring it is currently the only way we can do this.
        const recoverInfo = await _MatrixClientPeg.MatrixClientPeg.get().restoreKeyBackupWithPassword(this.state.passPhrase, undefined, undefined, this.state.backupInfo, {
          progressCallback: this._progressCallback
        });

        if (this.props.keyCallback) {
          const key = await _MatrixClientPeg.MatrixClientPeg.get().keyBackupKeyFromPassword(this.state.passPhrase, this.state.backupInfo);
          this.props.keyCallback(key);
        }

        if (!this.props.showSummary) {
          this.props.onFinished(true);
          return;
        }

        this.setState({
          loading: false,
          recoverInfo
        });
      } catch (e) {
        console.log("Error restoring backup", e);
        this.setState({
          loading: false,
          restoreError: e
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onRecoveryKeyNext", async () => {
      if (!this.state.recoveryKeyValid) return;
      this.setState({
        loading: true,
        restoreError: null,
        restoreType: RESTORE_TYPE_RECOVERYKEY
      });

      try {
        const recoverInfo = await _MatrixClientPeg.MatrixClientPeg.get().restoreKeyBackupWithRecoveryKey(this.state.recoveryKey, undefined, undefined, this.state.backupInfo, {
          progressCallback: this._progressCallback
        });

        if (this.props.keyCallback) {
          const key = _MatrixClientPeg.MatrixClientPeg.get().keyBackupKeyFromRecoveryKey(this.state.recoveryKey);

          this.props.keyCallback(key);
        }

        if (!this.props.showSummary) {
          this.props.onFinished(true);
          return;
        }

        this.setState({
          loading: false,
          recoverInfo
        });
      } catch (e) {
        console.log("Error restoring backup", e);
        this.setState({
          loading: false,
          restoreError: e
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseChange", e => {
      this.setState({
        passPhrase: e.target.value
      });
    });
    this.state = {
      backupInfo: null,
      backupKeyStored: null,
      loading: false,
      loadError: null,
      restoreError: null,
      recoveryKey: "",
      recoverInfo: null,
      recoveryKeyValid: false,
      forceRecoveryKey: false,
      passPhrase: '',
      restoreType: null,
      progress: {
        stage: "prefetch"
      }
    };
  }

  componentDidMount() {
    this._loadBackupStatus();
  }

  async _restoreWithSecretStorage() {
    this.setState({
      loading: true,
      restoreError: null,
      restoreType: RESTORE_TYPE_SECRET_STORAGE
    });

    try {
      // `accessSecretStorage` may prompt for storage access as needed.
      const recoverInfo = await (0, _CrossSigningManager.accessSecretStorage)(async () => {
        return _MatrixClientPeg.MatrixClientPeg.get().restoreKeyBackupWithSecretStorage(this.state.backupInfo, {
          progressCallback: this._progressCallback
        });
      });
      this.setState({
        loading: false,
        recoverInfo
      });
    } catch (e) {
      console.log("Error restoring backup", e);
      this.setState({
        restoreError: e,
        loading: false
      });
    }
  }

  async _restoreWithCachedKey(backupInfo) {
    if (!backupInfo) return false;

    try {
      const recoverInfo = await _MatrixClientPeg.MatrixClientPeg.get().restoreKeyBackupWithCache(undefined,
      /* targetRoomId */
      undefined,
      /* targetSessionId */
      backupInfo, {
        progressCallback: this._progressCallback
      });
      this.setState({
        recoverInfo
      });
      return true;
    } catch (e) {
      console.log("restoreWithCachedKey failed:", e);
      return false;
    }
  }

  async _loadBackupStatus() {
    this.setState({
      loading: true,
      loadError: null
    });

    try {
      const backupInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
      const backupKeyStored = await _MatrixClientPeg.MatrixClientPeg.get().isKeyBackupKeyStored();
      this.setState({
        backupInfo,
        backupKeyStored
      });
      const gotCache = await this._restoreWithCachedKey(backupInfo);

      if (gotCache) {
        console.log("RestoreKeyBackupDialog: found cached backup key");
        this.setState({
          loading: false
        });
        return;
      } // If the backup key is stored, we can proceed directly to restore.


      if (backupKeyStored) {
        return this._restoreWithSecretStorage();
      }

      this.setState({
        loadError: null,
        loading: false
      });
    } catch (e) {
      console.log("Error loading backup status", e);
      this.setState({
        loadError: e,
        loading: false
      });
    }
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const Spinner = sdk.getComponent("elements.Spinner");
    const backupHasPassphrase = this.state.backupInfo && this.state.backupInfo.auth_data && this.state.backupInfo.auth_data.private_key_salt && this.state.backupInfo.auth_data.private_key_iterations;
    let content;
    let title;

    if (this.state.loading) {
      title = (0, _languageHandler._t)("Restoring keys from backup");
      let details;

      if (this.state.progress.stage === "fetch") {
        details = (0, _languageHandler._t)("Fetching keys from server...");
      } else if (this.state.progress.stage === "load_keys") {
        const {
          total,
          successes,
          failures
        } = this.state.progress;
        details = (0, _languageHandler._t)("%(completed)s of %(total)s keys restored", {
          total,
          completed: successes + failures
        });
      } else if (this.state.progress.stage === "prefetch") {
        details = (0, _languageHandler._t)("Fetching keys from server...");
      }

      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, details), /*#__PURE__*/_react.default.createElement(Spinner, null));
    } else if (this.state.loadError) {
      title = (0, _languageHandler._t)("Error");
      content = (0, _languageHandler._t)("Unable to load backup status");
    } else if (this.state.restoreError) {
      if (this.state.restoreError.errcode === _matrixJsSdk.MatrixClient.RESTORE_BACKUP_ERROR_BAD_KEY) {
        if (this.state.restoreType === RESTORE_TYPE_RECOVERYKEY) {
          title = (0, _languageHandler._t)("Recovery key mismatch");
          content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Backup could not be decrypted with this recovery key: " + "please verify that you entered the correct recovery key.")));
        } else {
          title = (0, _languageHandler._t)("Incorrect recovery passphrase");
          content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Backup could not be decrypted with this recovery passphrase: " + "please verify that you entered the correct recovery passphrase.")));
        }
      } else {
        title = (0, _languageHandler._t)("Error");
        content = (0, _languageHandler._t)("Unable to restore backup");
      }
    } else if (this.state.backupInfo === null) {
      title = (0, _languageHandler._t)("Error");
      content = (0, _languageHandler._t)("No backup found!");
    } else if (this.state.recoverInfo) {
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      title = (0, _languageHandler._t)("Keys restored");
      let failedToDecrypt;

      if (this.state.recoverInfo.total > this.state.recoverInfo.imported) {
        failedToDecrypt = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Failed to decrypt %(failedCount)s sessions!", {
          failedCount: this.state.recoverInfo.total - this.state.recoverInfo.imported
        }));
      }

      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Successfully restored %(sessionCount)s keys", {
        sessionCount: this.state.recoverInfo.imported
      })), failedToDecrypt, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('OK'),
        onPrimaryButtonClick: this._onDone,
        hasCancel: false,
        focus: true
      }));
    } else if (backupHasPassphrase && !this.state.forceRecoveryKey) {
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
      title = (0, _languageHandler._t)("Enter recovery passphrase");
      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("<b>Warning</b>: you should only set up key backup " + "from a trusted computer.", {}, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Access your secure message history and set up secure " + "messaging by entering your recovery passphrase.")), /*#__PURE__*/_react.default.createElement("form", {
        className: "mx_RestoreKeyBackupDialog_primaryContainer"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "password",
        className: "mx_RestoreKeyBackupDialog_passPhraseInput",
        onChange: this._onPassPhraseChange,
        value: this.state.passPhrase,
        autoFocus: true
      }), /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Next'),
        onPrimaryButtonClick: this._onPassPhraseNext,
        primaryIsSubmit: true,
        hasCancel: true,
        onCancel: this._onCancel,
        focus: false
      })), (0, _languageHandler._t)("If you've forgotten your recovery passphrase you can " + "<button1>use your recovery key</button1> or " + "<button2>set up new recovery options</button2>", {}, {
        button1: s => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          className: "mx_linkButton",
          element: "span",
          onClick: this._onUseRecoveryKeyClick
        }, s),
        button2: s => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          className: "mx_linkButton",
          element: "span",
          onClick: this._onResetRecoveryClick
        }, s)
      }));
    } else {
      title = (0, _languageHandler._t)("Enter recovery key");
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
      let keyStatus;

      if (this.state.recoveryKey.length === 0) {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RestoreKeyBackupDialog_keyStatus"
        });
      } else if (this.state.recoveryKeyValid) {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RestoreKeyBackupDialog_keyStatus"
        }, "\uD83D\uDC4D ", (0, _languageHandler._t)("This looks like a valid recovery key!"));
      } else {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_RestoreKeyBackupDialog_keyStatus"
        }, "\uD83D\uDC4E ", (0, _languageHandler._t)("Not a valid recovery key"));
      }

      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("<b>Warning</b>: You should only set up key backup " + "from a trusted computer.", {}, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Access your secure message history and set up secure " + "messaging by entering your recovery key.")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RestoreKeyBackupDialog_primaryContainer"
      }, /*#__PURE__*/_react.default.createElement("input", {
        className: "mx_RestoreKeyBackupDialog_recoveryKeyInput",
        onChange: this._onRecoveryKeyChange,
        value: this.state.recoveryKey,
        autoFocus: true
      }), keyStatus, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Next'),
        onPrimaryButtonClick: this._onRecoveryKeyNext,
        hasCancel: true,
        onCancel: this._onCancel,
        focus: false,
        primaryDisabled: !this.state.recoveryKeyValid
      })), (0, _languageHandler._t)("If you've forgotten your recovery key you can " + "<button>set up new recovery options</button>", {}, {
        button: s => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          className: "mx_linkButton",
          element: "span",
          onClick: this._onResetRecoveryClick
        }, s)
      }));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_RestoreKeyBackupDialog",
      onFinished: this.props.onFinished,
      title: title
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RestoreKeyBackupDialog_content"
    }, content));
  }

}

exports.default = RestoreKeyBackupDialog;
(0, _defineProperty2.default)(RestoreKeyBackupDialog, "propTypes", {
  // if false, will close the dialog as soon as the restore completes succesfully
  // default: true
  showSummary: _propTypes.default.bool,
  // If specified, gather the key from the user but then call the function with the backup
  // key rather than actually (necessarily) restoring the backup.
  keyCallback: _propTypes.default.func
});
(0, _defineProperty2.default)(RestoreKeyBackupDialog, "defaultProps", {
  showSummary: true
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL1Jlc3RvcmVLZXlCYWNrdXBEaWFsb2cuanMiXSwibmFtZXMiOlsiUkVTVE9SRV9UWVBFX1BBU1NQSFJBU0UiLCJSRVNUT1JFX1RZUEVfUkVDT1ZFUllLRVkiLCJSRVNUT1JFX1RZUEVfU0VDUkVUX1NUT1JBR0UiLCJSZXN0b3JlS2V5QmFja3VwRGlhbG9nIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIm9uRmluaXNoZWQiLCJzZXRTdGF0ZSIsImZvcmNlUmVjb3ZlcnlLZXkiLCJkYXRhIiwicHJvZ3Jlc3MiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYyIsIl9sb2FkQmFja3VwU3RhdHVzIiwiZSIsInJlY292ZXJ5S2V5IiwidGFyZ2V0IiwidmFsdWUiLCJyZWNvdmVyeUtleVZhbGlkIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiaXNWYWxpZFJlY292ZXJ5S2V5IiwibG9hZGluZyIsInJlc3RvcmVFcnJvciIsInJlc3RvcmVUeXBlIiwicmVjb3ZlckluZm8iLCJyZXN0b3JlS2V5QmFja3VwV2l0aFBhc3N3b3JkIiwic3RhdGUiLCJwYXNzUGhyYXNlIiwidW5kZWZpbmVkIiwiYmFja3VwSW5mbyIsInByb2dyZXNzQ2FsbGJhY2siLCJfcHJvZ3Jlc3NDYWxsYmFjayIsImtleUNhbGxiYWNrIiwia2V5Iiwia2V5QmFja3VwS2V5RnJvbVBhc3N3b3JkIiwic2hvd1N1bW1hcnkiLCJjb25zb2xlIiwibG9nIiwicmVzdG9yZUtleUJhY2t1cFdpdGhSZWNvdmVyeUtleSIsImtleUJhY2t1cEtleUZyb21SZWNvdmVyeUtleSIsImJhY2t1cEtleVN0b3JlZCIsImxvYWRFcnJvciIsInN0YWdlIiwiY29tcG9uZW50RGlkTW91bnQiLCJfcmVzdG9yZVdpdGhTZWNyZXRTdG9yYWdlIiwicmVzdG9yZUtleUJhY2t1cFdpdGhTZWNyZXRTdG9yYWdlIiwiX3Jlc3RvcmVXaXRoQ2FjaGVkS2V5IiwicmVzdG9yZUtleUJhY2t1cFdpdGhDYWNoZSIsImdldEtleUJhY2t1cFZlcnNpb24iLCJpc0tleUJhY2t1cEtleVN0b3JlZCIsImdvdENhY2hlIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIlNwaW5uZXIiLCJiYWNrdXBIYXNQYXNzcGhyYXNlIiwiYXV0aF9kYXRhIiwicHJpdmF0ZV9rZXlfc2FsdCIsInByaXZhdGVfa2V5X2l0ZXJhdGlvbnMiLCJjb250ZW50IiwidGl0bGUiLCJkZXRhaWxzIiwidG90YWwiLCJzdWNjZXNzZXMiLCJmYWlsdXJlcyIsImNvbXBsZXRlZCIsImVycmNvZGUiLCJNYXRyaXhDbGllbnQiLCJSRVNUT1JFX0JBQ0tVUF9FUlJPUl9CQURfS0VZIiwiRGlhbG9nQnV0dG9ucyIsImZhaWxlZFRvRGVjcnlwdCIsImltcG9ydGVkIiwiZmFpbGVkQ291bnQiLCJzZXNzaW9uQ291bnQiLCJfb25Eb25lIiwiQWNjZXNzaWJsZUJ1dHRvbiIsImIiLCJzdWIiLCJfb25QYXNzUGhyYXNlQ2hhbmdlIiwiX29uUGFzc1BocmFzZU5leHQiLCJfb25DYW5jZWwiLCJidXR0b24xIiwicyIsIl9vblVzZVJlY292ZXJ5S2V5Q2xpY2siLCJidXR0b24yIiwiX29uUmVzZXRSZWNvdmVyeUNsaWNrIiwia2V5U3RhdHVzIiwibGVuZ3RoIiwiX29uUmVjb3ZlcnlLZXlDaGFuZ2UiLCJfb25SZWNvdmVyeUtleU5leHQiLCJidXR0b24iLCJQcm9wVHlwZXMiLCJib29sIiwiZnVuYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXpCQTs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxNQUFNQSx1QkFBdUIsR0FBRyxDQUFoQztBQUNBLE1BQU1DLHdCQUF3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UUFBQSxhQUFhLEVBQUUseUJBQUcsTUFBSCxDQUE5QjtBQUNJLFFBQUEsb0JBQW9CLEVBQUUsS0FBS0csa0JBRC9CO0FBRUksUUFBQSxTQUFTLEVBQUUsSUFGZjtBQUdJLFFBQUEsUUFBUSxFQUFFLEtBQUtULFNBSG5CO0FBSUksUUFBQSxLQUFLLEVBQUUsS0FKWDtBQUtJLFFBQUEsZUFBZSxFQUFFLENBQUMsS0FBS3ZELEtBQUwsQ0FBV1Q7QUFMakMsUUFQSixDQVhNLEVBMEJMLHlCQUNHLG1EQUNBLDhDQUZILEVBR0MsRUFIRCxFQUdLO0FBQ0YwRSxRQUFBQSxNQUFNLEVBQUVSLENBQUMsaUJBQUksNkJBQUMsZ0JBQUQ7QUFBa0IsVUFBQSxTQUFTLEVBQUMsZUFBNUI7QUFDVCxVQUFBLE9BQU8sRUFBQyxNQURDO0FBRVQsVUFBQSxPQUFPLEVBQUUsS0FBS0c7QUFGTCxXQUlSSCxDQUpRO0FBRFgsT0FITCxDQTFCSyxDQUFWO0FBc0NIOztBQUVELHdCQUNJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLFNBQVMsRUFBQywyQkFBdEI7QUFDSSxNQUFBLFVBQVUsRUFBRSxLQUFLakYsS0FBTCxDQUFXQyxVQUQzQjtBQUVJLE1BQUEsS0FBSyxFQUFFMEQ7QUFGWCxvQkFJQTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDS0QsT0FETCxDQUpBLENBREo7QUFVSDs7QUF2Ym1FOzs7OEJBQW5EOUQsc0IsZUFDRTtBQUNmO0FBQ0E7QUFDQXFDLEVBQUFBLFdBQVcsRUFBRXlELG1CQUFVQyxJQUhSO0FBSWY7QUFDQTtBQUNBN0QsRUFBQUEsV0FBVyxFQUFFNEQsbUJBQVVFO0FBTlIsQzs4QkFERmhHLHNCLGtCQVVLO0FBQ2xCcUMsRUFBQUEsV0FBVyxFQUFFO0FBREssQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCB7IE1hdHJpeENsaWVudCB9IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7IGFjY2Vzc1NlY3JldFN0b3JhZ2UgfSBmcm9tICcuLi8uLi8uLi8uLi9Dcm9zc1NpZ25pbmdNYW5hZ2VyJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5cbmNvbnN0IFJFU1RPUkVfVFlQRV9QQVNTUEhSQVNFID0gMDtcbmNvbnN0IFJFU1RPUkVfVFlQRV9SRUNPVkVSWUtFWSA9IDE7XG5jb25zdCBSRVNUT1JFX1RZUEVfU0VDUkVUX1NUT1JBR0UgPSAyO1xuXG4vKlxuICogRGlhbG9nIGZvciByZXN0b3JpbmcgZTJlIGtleXMgZnJvbSBhIGJhY2t1cCBhbmQgdGhlIHVzZXIncyByZWNvdmVyeSBrZXlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVzdG9yZUtleUJhY2t1cERpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIGlmIGZhbHNlLCB3aWxsIGNsb3NlIHRoZSBkaWFsb2cgYXMgc29vbiBhcyB0aGUgcmVzdG9yZSBjb21wbGV0ZXMgc3VjY2VzZnVsbHlcbiAgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuICAgICAgICBzaG93U3VtbWFyeTogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIC8vIElmIHNwZWNpZmllZCwgZ2F0aGVyIHRoZSBrZXkgZnJvbSB0aGUgdXNlciBidXQgdGhlbiBjYWxsIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBiYWNrdXBcbiAgICAgICAgLy8ga2V5IHJhdGhlciB0aGFuIGFjdHVhbGx5IChuZWNlc3NhcmlseSkgcmVzdG9yaW5nIHRoZSBiYWNrdXAuXG4gICAgICAgIGtleUNhbGxiYWNrOiBQcm9wVHlwZXMuZnVuYyxcbiAgICB9O1xuXG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgc2hvd1N1bW1hcnk6IHRydWUsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGJhY2t1cEluZm86IG51bGwsXG4gICAgICAgICAgICBiYWNrdXBLZXlTdG9yZWQ6IG51bGwsXG4gICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGxvYWRFcnJvcjogbnVsbCxcbiAgICAgICAgICAgIHJlc3RvcmVFcnJvcjogbnVsbCxcbiAgICAgICAgICAgIHJlY292ZXJ5S2V5OiBcIlwiLFxuICAgICAgICAgICAgcmVjb3ZlckluZm86IG51bGwsXG4gICAgICAgICAgICByZWNvdmVyeUtleVZhbGlkOiBmYWxzZSxcbiAgICAgICAgICAgIGZvcmNlUmVjb3ZlcnlLZXk6IGZhbHNlLFxuICAgICAgICAgICAgcGFzc1BocmFzZTogJycsXG4gICAgICAgICAgICByZXN0b3JlVHlwZTogbnVsbCxcbiAgICAgICAgICAgIHByb2dyZXNzOiB7IHN0YWdlOiBcInByZWZldGNoXCIgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5fbG9hZEJhY2t1cFN0YXR1cygpO1xuICAgIH1cblxuICAgIF9vbkNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICB9XG5cbiAgICBfb25Eb25lID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgfVxuXG4gICAgX29uVXNlUmVjb3ZlcnlLZXlDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmb3JjZVJlY292ZXJ5S2V5OiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfcHJvZ3Jlc3NDYWxsYmFjayA9IChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcHJvZ3Jlc3M6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblJlc2V0UmVjb3ZlcnlDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcblxuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSkge1xuICAgICAgICAgICAgLy8gSWYgY3Jvc3Mtc2lnbmluZyBpcyBlbmFibGVkLCB3ZSByZXNldCB0aGUgU1NTUyByZWNvdmVyeSBwYXNzcGhyYXNlIChhbmQgY3Jvc3Mtc2lnbmluZyBrZXlzKVxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICAgICAgICAgIGFjY2Vzc1NlY3JldFN0b3JhZ2UoKCkgPT4ge30sIC8qIGZvcmNlUmVzZXQgPSAqLyB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYygnS2V5IEJhY2t1cCcsICdLZXkgQmFja3VwJyxcbiAgICAgICAgICAgICAgICBpbXBvcnQoJy4uLy4uLy4uLy4uL2FzeW5jLWNvbXBvbmVudHMvdmlld3MvZGlhbG9ncy9rZXliYWNrdXAvQ3JlYXRlS2V5QmFja3VwRGlhbG9nJyksXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkQmFja3VwU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSwgbnVsbCwgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25SZWNvdmVyeUtleUNoYW5nZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcmVjb3ZlcnlLZXk6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICAgICAgcmVjb3ZlcnlLZXlWYWxpZDogTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzVmFsaWRSZWNvdmVyeUtleShlLnRhcmdldC52YWx1ZSksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblBhc3NQaHJhc2VOZXh0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICByZXN0b3JlRXJyb3I6IG51bGwsXG4gICAgICAgICAgICByZXN0b3JlVHlwZTogUkVTVE9SRV9UWVBFX1BBU1NQSFJBU0UsXG4gICAgICAgIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2UgZG8gc3RpbGwgcmVzdG9yZSB0aGUga2V5IGJhY2t1cDogd2UgbXVzdCBlbnN1cmUgdGhhdCB0aGUga2V5IGJhY2t1cCBrZXlcbiAgICAgICAgICAgIC8vIGlzIHRoZSByaWdodCBvbmUgYW5kIHJlc3RvcmluZyBpdCBpcyBjdXJyZW50bHkgdGhlIG9ubHkgd2F5IHdlIGNhbiBkbyB0aGlzLlxuICAgICAgICAgICAgY29uc3QgcmVjb3ZlckluZm8gPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVzdG9yZUtleUJhY2t1cFdpdGhQYXNzd29yZChcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnBhc3NQaHJhc2UsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0aGlzLnN0YXRlLmJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgeyBwcm9ncmVzc0NhbGxiYWNrOiB0aGlzLl9wcm9ncmVzc0NhbGxiYWNrIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMua2V5Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkua2V5QmFja3VwS2V5RnJvbVBhc3N3b3JkKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnBhc3NQaHJhc2UsIHRoaXMuc3RhdGUuYmFja3VwSW5mbyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMua2V5Q2FsbGJhY2soa2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLnByb3BzLnNob3dTdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlY292ZXJJbmZvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgcmVzdG9yaW5nIGJhY2t1cFwiLCBlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlc3RvcmVFcnJvcjogZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUmVjb3ZlcnlLZXlOZXh0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUucmVjb3ZlcnlLZXlWYWxpZCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIHJlc3RvcmVFcnJvcjogbnVsbCxcbiAgICAgICAgICAgIHJlc3RvcmVUeXBlOiBSRVNUT1JFX1RZUEVfUkVDT1ZFUllLRVksXG4gICAgICAgIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVjb3ZlckluZm8gPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVzdG9yZUtleUJhY2t1cFdpdGhSZWNvdmVyeUtleShcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnJlY292ZXJ5S2V5LCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGhpcy5zdGF0ZS5iYWNrdXBJbmZvLFxuICAgICAgICAgICAgICAgIHsgcHJvZ3Jlc3NDYWxsYmFjazogdGhpcy5fcHJvZ3Jlc3NDYWxsYmFjayB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmtleUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmtleUJhY2t1cEtleUZyb21SZWNvdmVyeUtleSh0aGlzLnN0YXRlLnJlY292ZXJ5S2V5KTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmtleUNhbGxiYWNrKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMucHJvcHMuc2hvd1N1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVjb3ZlckluZm8sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciByZXN0b3JpbmcgYmFja3VwXCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVzdG9yZUVycm9yOiBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25QYXNzUGhyYXNlQ2hhbmdlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwYXNzUGhyYXNlOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3Jlc3RvcmVXaXRoU2VjcmV0U3RvcmFnZSgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgICAgICAgcmVzdG9yZUVycm9yOiBudWxsLFxuICAgICAgICAgICAgcmVzdG9yZVR5cGU6IFJFU1RPUkVfVFlQRV9TRUNSRVRfU1RPUkFHRSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBgYWNjZXNzU2VjcmV0U3RvcmFnZWAgbWF5IHByb21wdCBmb3Igc3RvcmFnZSBhY2Nlc3MgYXMgbmVlZGVkLlxuICAgICAgICAgICAgY29uc3QgcmVjb3ZlckluZm8gPSBhd2FpdCBhY2Nlc3NTZWNyZXRTdG9yYWdlKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlc3RvcmVLZXlCYWNrdXBXaXRoU2VjcmV0U3RvcmFnZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5iYWNrdXBJbmZvLFxuICAgICAgICAgICAgICAgICAgICB7IHByb2dyZXNzQ2FsbGJhY2s6IHRoaXMuX3Byb2dyZXNzQ2FsbGJhY2sgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZWNvdmVySW5mbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIHJlc3RvcmluZyBiYWNrdXBcIiwgZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZXN0b3JlRXJyb3I6IGUsXG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9yZXN0b3JlV2l0aENhY2hlZEtleShiYWNrdXBJbmZvKSB7XG4gICAgICAgIGlmICghYmFja3VwSW5mbykgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVjb3ZlckluZm8gPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVzdG9yZUtleUJhY2t1cFdpdGhDYWNoZShcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsIC8qIHRhcmdldFJvb21JZCAqL1xuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgLyogdGFyZ2V0U2Vzc2lvbklkICovXG4gICAgICAgICAgICAgICAgYmFja3VwSW5mbyxcbiAgICAgICAgICAgICAgICB7IHByb2dyZXNzQ2FsbGJhY2s6IHRoaXMuX3Byb2dyZXNzQ2FsbGJhY2sgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZWNvdmVySW5mbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVzdG9yZVdpdGhDYWNoZWRLZXkgZmFpbGVkOlwiLCBlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9sb2FkQmFja3VwU3RhdHVzKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICBsb2FkRXJyb3I6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYmFja3VwSW5mbyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRLZXlCYWNrdXBWZXJzaW9uKCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBLZXlTdG9yZWQgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNLZXlCYWNrdXBLZXlTdG9yZWQoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgYmFja3VwS2V5U3RvcmVkLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGdvdENhY2hlID0gYXdhaXQgdGhpcy5fcmVzdG9yZVdpdGhDYWNoZWRLZXkoYmFja3VwSW5mbyk7XG4gICAgICAgICAgICBpZiAoZ290Q2FjaGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3RvcmVLZXlCYWNrdXBEaWFsb2c6IGZvdW5kIGNhY2hlZCBiYWNrdXAga2V5XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBiYWNrdXAga2V5IGlzIHN0b3JlZCwgd2UgY2FuIHByb2NlZWQgZGlyZWN0bHkgdG8gcmVzdG9yZS5cbiAgICAgICAgICAgIGlmIChiYWNrdXBLZXlTdG9yZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzdG9yZVdpdGhTZWNyZXRTdG9yYWdlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvYWRFcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGxvYWRpbmcgYmFja3VwIHN0YXR1c1wiLCBlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvYWRFcnJvcjogZSxcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcblxuICAgICAgICBjb25zdCBiYWNrdXBIYXNQYXNzcGhyYXNlID0gKFxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5iYWNrdXBJbmZvICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmJhY2t1cEluZm8uYXV0aF9kYXRhICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmJhY2t1cEluZm8uYXV0aF9kYXRhLnByaXZhdGVfa2V5X3NhbHQgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuYmFja3VwSW5mby5hdXRoX2RhdGEucHJpdmF0ZV9rZXlfaXRlcmF0aW9uc1xuICAgICAgICApO1xuXG4gICAgICAgIGxldCBjb250ZW50O1xuICAgICAgICBsZXQgdGl0bGU7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJSZXN0b3Jpbmcga2V5cyBmcm9tIGJhY2t1cFwiKTtcbiAgICAgICAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucHJvZ3Jlc3Muc3RhZ2UgPT09IFwiZmV0Y2hcIikge1xuICAgICAgICAgICAgICAgIGRldGFpbHMgPSBfdChcIkZldGNoaW5nIGtleXMgZnJvbSBzZXJ2ZXIuLi5cIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUucHJvZ3Jlc3Muc3RhZ2UgPT09IFwibG9hZF9rZXlzXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHRvdGFsLCBzdWNjZXNzZXMsIGZhaWx1cmVzIH0gPSB0aGlzLnN0YXRlLnByb2dyZXNzO1xuICAgICAgICAgICAgICAgIGRldGFpbHMgPSBfdChcIiUoY29tcGxldGVkKXMgb2YgJSh0b3RhbClzIGtleXMgcmVzdG9yZWRcIiwgeyB0b3RhbCwgY29tcGxldGVkOiBzdWNjZXNzZXMgKyBmYWlsdXJlcyB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5wcm9ncmVzcy5zdGFnZSA9PT0gXCJwcmVmZXRjaFwiKSB7XG4gICAgICAgICAgICAgICAgZGV0YWlscyA9IF90KFwiRmV0Y2hpbmcga2V5cyBmcm9tIHNlcnZlci4uLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+e2RldGFpbHN9PC9kaXY+XG4gICAgICAgICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmxvYWRFcnJvcikge1xuICAgICAgICAgICAgdGl0bGUgPSBfdChcIkVycm9yXCIpO1xuICAgICAgICAgICAgY29udGVudCA9IF90KFwiVW5hYmxlIHRvIGxvYWQgYmFja3VwIHN0YXR1c1wiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnJlc3RvcmVFcnJvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVzdG9yZUVycm9yLmVycmNvZGUgPT09IE1hdHJpeENsaWVudC5SRVNUT1JFX0JBQ0tVUF9FUlJPUl9CQURfS0VZKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVzdG9yZVR5cGUgPT09IFJFU1RPUkVfVFlQRV9SRUNPVkVSWUtFWSkge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiUmVjb3Zlcnkga2V5IG1pc21hdGNoXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkJhY2t1cCBjb3VsZCBub3QgYmUgZGVjcnlwdGVkIHdpdGggdGhpcyByZWNvdmVyeSBrZXk6IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBsZWFzZSB2ZXJpZnkgdGhhdCB5b3UgZW50ZXJlZCB0aGUgY29ycmVjdCByZWNvdmVyeSBrZXkuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlID0gX3QoXCJJbmNvcnJlY3QgcmVjb3ZlcnkgcGFzc3BocmFzZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJCYWNrdXAgY291bGQgbm90IGJlIGRlY3J5cHRlZCB3aXRoIHRoaXMgcmVjb3ZlcnkgcGFzc3BocmFzZTogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGxlYXNlIHZlcmlmeSB0aGF0IHlvdSBlbnRlcmVkIHRoZSBjb3JyZWN0IHJlY292ZXJ5IHBhc3NwaHJhc2UuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcIkVycm9yXCIpO1xuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBfdChcIlVuYWJsZSB0byByZXN0b3JlIGJhY2t1cFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmJhY2t1cEluZm8gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJFcnJvclwiKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBfdChcIk5vIGJhY2t1cCBmb3VuZCFcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5yZWNvdmVySW5mbykge1xuICAgICAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJLZXlzIHJlc3RvcmVkXCIpO1xuICAgICAgICAgICAgbGV0IGZhaWxlZFRvRGVjcnlwdDtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnJlY292ZXJJbmZvLnRvdGFsID4gdGhpcy5zdGF0ZS5yZWNvdmVySW5mby5pbXBvcnRlZCkge1xuICAgICAgICAgICAgICAgIGZhaWxlZFRvRGVjcnlwdCA9IDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gZGVjcnlwdCAlKGZhaWxlZENvdW50KXMgc2Vzc2lvbnMhXCIsXG4gICAgICAgICAgICAgICAgICAgIHtmYWlsZWRDb3VudDogdGhpcy5zdGF0ZS5yZWNvdmVySW5mby50b3RhbCAtIHRoaXMuc3RhdGUucmVjb3ZlckluZm8uaW1wb3J0ZWR9LFxuICAgICAgICAgICAgICAgICl9PC9wPjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcIlN1Y2Nlc3NmdWxseSByZXN0b3JlZCAlKHNlc3Npb25Db3VudClzIGtleXNcIiwge3Nlc3Npb25Db3VudDogdGhpcy5zdGF0ZS5yZWNvdmVySW5mby5pbXBvcnRlZH0pfTwvcD5cbiAgICAgICAgICAgICAgICB7ZmFpbGVkVG9EZWNyeXB0fVxuICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdPSycpfVxuICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25Eb25lfVxuICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2UgaWYgKGJhY2t1cEhhc1Bhc3NwaHJhc2UgJiYgIXRoaXMuc3RhdGUuZm9yY2VSZWNvdmVyeUtleSkge1xuICAgICAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgICAgICB0aXRsZSA9IF90KFwiRW50ZXIgcmVjb3ZlcnkgcGFzc3BocmFzZVwiKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCI8Yj5XYXJuaW5nPC9iPjogeW91IHNob3VsZCBvbmx5IHNldCB1cCBrZXkgYmFja3VwIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJmcm9tIGEgdHJ1c3RlZCBjb21wdXRlci5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHsgYjogc3ViID0+IDxiPntzdWJ9PC9iPiB9LFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJBY2Nlc3MgeW91ciBzZWN1cmUgbWVzc2FnZSBoaXN0b3J5IGFuZCBzZXQgdXAgc2VjdXJlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdpbmcgYnkgZW50ZXJpbmcgeW91ciByZWNvdmVyeSBwYXNzcGhyYXNlLlwiLFxuICAgICAgICAgICAgICAgICl9PC9wPlxuXG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwibXhfUmVzdG9yZUtleUJhY2t1cERpYWxvZ19wcmltYXJ5Q29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUmVzdG9yZUtleUJhY2t1cERpYWxvZ19wYXNzUGhyYXNlSW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUGFzc1BocmFzZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBhc3NQaHJhc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdCgnTmV4dCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uUGFzc1BocmFzZU5leHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5SXNTdWJtaXQ9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1cz17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCJJZiB5b3UndmUgZm9yZ290dGVuIHlvdXIgcmVjb3ZlcnkgcGFzc3BocmFzZSB5b3UgY2FuIFwiK1xuICAgICAgICAgICAgICAgICAgICBcIjxidXR0b24xPnVzZSB5b3VyIHJlY292ZXJ5IGtleTwvYnV0dG9uMT4gb3IgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxidXR0b24yPnNldCB1cCBuZXcgcmVjb3Zlcnkgb3B0aW9uczwvYnV0dG9uMj5cIlxuICAgICAgICAgICAgICAgICwge30sIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uMTogcyA9PiA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9saW5rQnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9XCJzcGFuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uVXNlUmVjb3ZlcnlLZXlDbGlja31cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3N9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4sXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbjI6IHMgPT4gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblJlc2V0UmVjb3ZlcnlDbGlja31cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3N9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4sXG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aXRsZSA9IF90KFwiRW50ZXIgcmVjb3Zlcnkga2V5XCIpO1xuICAgICAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG5cbiAgICAgICAgICAgIGxldCBrZXlTdGF0dXM7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5yZWNvdmVyeUtleS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBrZXlTdGF0dXMgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jlc3RvcmVLZXlCYWNrdXBEaWFsb2dfa2V5U3RhdHVzXCI+PC9kaXY+O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnJlY292ZXJ5S2V5VmFsaWQpIHtcbiAgICAgICAgICAgICAgICBrZXlTdGF0dXMgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jlc3RvcmVLZXlCYWNrdXBEaWFsb2dfa2V5U3RhdHVzXCI+XG4gICAgICAgICAgICAgICAgICAgIHtcIlxcdUQ4M0RcXHVEQzREIFwifXtfdChcIlRoaXMgbG9va3MgbGlrZSBhIHZhbGlkIHJlY292ZXJ5IGtleSFcIil9XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZXlTdGF0dXMgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jlc3RvcmVLZXlCYWNrdXBEaWFsb2dfa2V5U3RhdHVzXCI+XG4gICAgICAgICAgICAgICAgICAgIHtcIlxcdUQ4M0RcXHVEQzRFIFwifXtfdChcIk5vdCBhIHZhbGlkIHJlY292ZXJ5IGtleVwiKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCI8Yj5XYXJuaW5nPC9iPjogWW91IHNob3VsZCBvbmx5IHNldCB1cCBrZXkgYmFja3VwIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJmcm9tIGEgdHJ1c3RlZCBjb21wdXRlci5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHsgYjogc3ViID0+IDxiPntzdWJ9PC9iPiB9LFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJBY2Nlc3MgeW91ciBzZWN1cmUgbWVzc2FnZSBoaXN0b3J5IGFuZCBzZXQgdXAgc2VjdXJlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdpbmcgYnkgZW50ZXJpbmcgeW91ciByZWNvdmVyeSBrZXkuXCIsXG4gICAgICAgICAgICAgICAgKX08L3A+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jlc3RvcmVLZXlCYWNrdXBEaWFsb2dfcHJpbWFyeUNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibXhfUmVzdG9yZUtleUJhY2t1cERpYWxvZ19yZWNvdmVyeUtleUlucHV0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vblJlY292ZXJ5S2V5Q2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucmVjb3ZlcnlLZXl9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIHtrZXlTdGF0dXN9XG4gICAgICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdOZXh0Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25SZWNvdmVyeUtleU5leHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1cz17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5RGlzYWJsZWQ9eyF0aGlzLnN0YXRlLnJlY292ZXJ5S2V5VmFsaWR9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSd2ZSBmb3Jnb3R0ZW4geW91ciByZWNvdmVyeSBrZXkgeW91IGNhbiBcIitcbiAgICAgICAgICAgICAgICAgICAgXCI8YnV0dG9uPnNldCB1cCBuZXcgcmVjb3Zlcnkgb3B0aW9uczwvYnV0dG9uPlwiXG4gICAgICAgICAgICAgICAgLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b246IHMgPT4gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblJlc2V0UmVjb3ZlcnlDbGlja31cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3N9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4sXG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2cgY2xhc3NOYW1lPSdteF9SZXN0b3JlS2V5QmFja3VwRGlhbG9nJ1xuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGl0bGV9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfUmVzdG9yZUtleUJhY2t1cERpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICB7Y29udGVudH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==