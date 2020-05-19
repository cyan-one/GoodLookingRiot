"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _fileSaver = _interopRequireDefault(require("file-saver"));

var sdk = _interopRequireWildcard(require("../../../../index"));

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../languageHandler");

var _CrossSigningManager = require("../../../../CrossSigningManager");

var _SettingsStore = _interopRequireDefault(require("../../../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../../../../components/views/elements/AccessibleButton"));

var _strings = require("../../../../utils/strings");

var _PassphraseField = _interopRequireDefault(require("../../../../components/views/auth/PassphraseField"));

/*
Copyright 2018, 2019 New Vector Ltd
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
const PHASE_PASSPHRASE = 0;
const PHASE_PASSPHRASE_CONFIRM = 1;
const PHASE_SHOWKEY = 2;
const PHASE_KEEPITSAFE = 3;
const PHASE_BACKINGUP = 4;
const PHASE_DONE = 5;
const PHASE_OPTOUT_CONFIRM = 6;
const PASSWORD_MIN_SCORE = 4; // So secure, many characters, much complex, wow, etc, etc.

/*
 * Walks the user through the process of creating an e2e key backup
 * on the server.
 */

class CreateKeyBackupDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_collectRecoveryKeyNode", n => {
      this._recoveryKeyNode = n;
    });
    (0, _defineProperty2.default)(this, "_onCopyClick", () => {
      const successful = (0, _strings.copyNode)(this._recoveryKeyNode);

      if (successful) {
        this.setState({
          copied: true,
          phase: PHASE_KEEPITSAFE
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onDownloadClick", () => {
      const blob = new Blob([this._keyBackupInfo.recovery_key], {
        type: 'text/plain;charset=us-ascii'
      });

      _fileSaver.default.saveAs(blob, 'recovery-key.txt');

      this.setState({
        downloaded: true,
        phase: PHASE_KEEPITSAFE
      });
    });
    (0, _defineProperty2.default)(this, "_createBackup", async () => {
      const {
        secureSecretStorage
      } = this.state;
      this.setState({
        phase: PHASE_BACKINGUP,
        error: null
      });
      let info;

      try {
        if (secureSecretStorage) {
          await (0, _CrossSigningManager.accessSecretStorage)(async () => {
            info = await _MatrixClientPeg.MatrixClientPeg.get().prepareKeyBackupVersion(null
            /* random key */
            , {
              secureSecretStorage: true
            });
            info = await _MatrixClientPeg.MatrixClientPeg.get().createKeyBackupVersion(info);
          });
        } else {
          info = await _MatrixClientPeg.MatrixClientPeg.get().createKeyBackupVersion(this._keyBackupInfo);
        }

        await _MatrixClientPeg.MatrixClientPeg.get().scheduleAllGroupSessionsForBackup();
        this.setState({
          phase: PHASE_DONE
        });
      } catch (e) {
        console.error("Error creating key backup", e); // TODO: If creating a version succeeds, but backup fails, should we
        // delete the version, disable backup, or do nothing?  If we just
        // disable without deleting, we'll enable on next app reload since
        // it is trusted.

        if (info) {
          _MatrixClientPeg.MatrixClientPeg.get().deleteKeyBackupVersion(info.version);
        }

        this.setState({
          error: e
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onCancel", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onDone", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_onOptOutClick", () => {
      this.setState({
        phase: PHASE_OPTOUT_CONFIRM
      });
    });
    (0, _defineProperty2.default)(this, "_onSetUpClick", () => {
      this.setState({
        phase: PHASE_PASSPHRASE
      });
    });
    (0, _defineProperty2.default)(this, "_onSkipPassPhraseClick", async () => {
      this._keyBackupInfo = await _MatrixClientPeg.MatrixClientPeg.get().prepareKeyBackupVersion();
      this.setState({
        copied: false,
        downloaded: false,
        phase: PHASE_SHOWKEY
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseNextClick", async e => {
      e.preventDefault();
      if (!this._passphraseField.current) return; // unmounting

      await this._passphraseField.current.validate({
        allowEmpty: false
      });

      if (!this._passphraseField.current.state.valid) {
        this._passphraseField.current.focus();

        this._passphraseField.current.validate({
          allowEmpty: false,
          focused: true
        });

        return;
      }

      this.setState({
        phase: PHASE_PASSPHRASE_CONFIRM
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseConfirmNextClick", async e => {
      e.preventDefault();
      if (this.state.passPhrase !== this.state.passPhraseConfirm) return;
      this._keyBackupInfo = await _MatrixClientPeg.MatrixClientPeg.get().prepareKeyBackupVersion(this.state.passPhrase);
      this.setState({
        copied: false,
        downloaded: false,
        phase: PHASE_SHOWKEY
      });
    });
    (0, _defineProperty2.default)(this, "_onSetAgainClick", () => {
      this.setState({
        passPhrase: '',
        passPhraseValid: false,
        passPhraseConfirm: '',
        phase: PHASE_PASSPHRASE
      });
    });
    (0, _defineProperty2.default)(this, "_onKeepItSafeBackClick", () => {
      this.setState({
        phase: PHASE_SHOWKEY
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseValidate", result => {
      this.setState({
        passPhraseValid: result.valid
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseChange", e => {
      this.setState({
        passPhrase: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseConfirmChange", e => {
      this.setState({
        passPhraseConfirm: e.target.value
      });
    });
    this._recoveryKeyNode = null;
    this._keyBackupInfo = null;
    this.state = {
      secureSecretStorage: null,
      phase: PHASE_PASSPHRASE,
      passPhrase: '',
      passPhraseValid: false,
      passPhraseConfirm: '',
      copied: false,
      downloaded: false
    };
    this._passphraseField = (0, _react.createRef)();
  }

  async componentDidMount() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const secureSecretStorage = _SettingsStore.default.getValue("feature_cross_signing") && (await cli.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing"));
    this.setState({
      secureSecretStorage
    }); // If we're using secret storage, skip ahead to the backing up step, as
    // `accessSecretStorage` will handle passphrases as needed.

    if (secureSecretStorage) {
      this.setState({
        phase: PHASE_BACKINGUP
      });

      this._createBackup();
    }
  }

  _renderPhasePassPhrase() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onPassPhraseNextClick
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("<b>Warning</b>: You should only set up key backup from a trusted computer.", {}, {
      b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
    })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("We'll store an encrypted copy of your keys on our server. " + "Secure your backup with a recovery passphrase.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("For maximum security, this should be different from your account password.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_primaryContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_passPhraseContainer"
    }, /*#__PURE__*/_react.default.createElement(_PassphraseField.default, {
      className: "mx_CreateKeyBackupDialog_passPhraseInput",
      onChange: this._onPassPhraseChange,
      minScore: PASSWORD_MIN_SCORE,
      value: this.state.passPhrase,
      onValidate: this._onPassPhraseValidate,
      fieldRef: this._passphraseField,
      autoFocus: true,
      label: (0, _languageHandler._td)("Enter a recovery passphrase"),
      labelEnterPassword: (0, _languageHandler._td)("Enter a recovery passphrase"),
      labelStrongPassword: (0, _languageHandler._td)("Great! This recovery passphrase looks strong enough."),
      labelAllowedButUnsafe: (0, _languageHandler._td)("Great! This recovery passphrase looks strong enough.")
    }))), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Next'),
      onPrimaryButtonClick: this._onPassPhraseNextClick,
      hasCancel: false,
      disabled: !this.state.passPhraseValid
    }), /*#__PURE__*/_react.default.createElement("details", null, /*#__PURE__*/_react.default.createElement("summary", null, (0, _languageHandler._t)("Advanced")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      kind: "primary",
      onClick: this._onSkipPassPhraseClick
    }, (0, _languageHandler._t)("Set up with a recovery key"))));
  }

  _renderPhasePassPhraseConfirm() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let matchText;

    if (this.state.passPhraseConfirm === this.state.passPhrase) {
      matchText = (0, _languageHandler._t)("That matches!");
    } else if (!this.state.passPhrase.startsWith(this.state.passPhraseConfirm)) {
      // only tell them they're wrong if they've actually gone wrong.
      // Security concious readers will note that if you left riot-web unattended
      // on this screen, this would make it easy for a malicious person to guess
      // your passphrase one letter at a time, but they could get this faster by
      // just opening the browser's developer tools and reading it.
      // Note that not having typed anything at all will not hit this clause and
      // fall through so empty box === no hint.
      matchText = (0, _languageHandler._t)("That doesn't match.");
    }

    let passPhraseMatch = null;

    if (matchText) {
      passPhraseMatch = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CreateKeyBackupDialog_passPhraseMatch"
      }, /*#__PURE__*/_react.default.createElement("div", null, matchText), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        element: "span",
        className: "mx_linkButton",
        onClick: this._onSetAgainClick
      }, (0, _languageHandler._t)("Go back to set it again."))));
    }

    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onPassPhraseConfirmNextClick
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Please enter your recovery passphrase a second time to confirm.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_primaryContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_passPhraseContainer"
    }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "password",
      onChange: this._onPassPhraseConfirmChange,
      value: this.state.passPhraseConfirm,
      className: "mx_CreateKeyBackupDialog_passPhraseInput",
      placeholder: (0, _languageHandler._t)("Repeat your recovery passphrase..."),
      autoFocus: true
    })), passPhraseMatch)), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Next'),
      onPrimaryButtonClick: this._onPassPhraseConfirmNextClick,
      hasCancel: false,
      disabled: this.state.passPhrase !== this.state.passPhraseConfirm
    }));
  }

  _renderPhaseShowKey() {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your recovery key is a safety net - you can use it to restore " + "access to your encrypted messages if you forget your recovery passphrase.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Keep a copy of it somewhere secure, like a password manager or even a safe.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_primaryContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_recoveryKeyHeader"
    }, (0, _languageHandler._t)("Your recovery key")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_recoveryKeyContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_recoveryKey"
    }, /*#__PURE__*/_react.default.createElement("code", {
      ref: this._collectRecoveryKeyNode
    }, this._keyBackupInfo.recovery_key)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateKeyBackupDialog_recoveryKeyButtons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_Dialog_primary",
      onClick: this._onCopyClick
    }, (0, _languageHandler._t)("Copy")), /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_Dialog_primary",
      onClick: this._onDownloadClick
    }, (0, _languageHandler._t)("Download"))))));
  }

  _renderPhaseKeepItSafe() {
    let introText;

    if (this.state.copied) {
      introText = (0, _languageHandler._t)("Your recovery key has been <b>copied to your clipboard</b>, paste it to:", {}, {
        b: s => /*#__PURE__*/_react.default.createElement("b", null, s)
      });
    } else if (this.state.downloaded) {
      introText = (0, _languageHandler._t)("Your recovery key is in your <b>Downloads</b> folder.", {}, {
        b: s => /*#__PURE__*/_react.default.createElement("b", null, s)
      });
    }

    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, introText, /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("<b>Print it</b> and store it somewhere safe", {}, {
      b: s => /*#__PURE__*/_react.default.createElement("b", null, s)
    })), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("<b>Save it</b> on a USB key or backup drive", {}, {
      b: s => /*#__PURE__*/_react.default.createElement("b", null, s)
    })), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("<b>Copy it</b> to your personal cloud storage", {}, {
      b: s => /*#__PURE__*/_react.default.createElement("b", null, s)
    }))), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Continue"),
      onPrimaryButtonClick: this._createBackup,
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onKeepItSafeBackClick
    }, (0, _languageHandler._t)("Back"))));
  }

  _renderBusyPhase(text) {
    const Spinner = sdk.getComponent('views.elements.Spinner');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Spinner, null));
  }

  _renderPhaseDone() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your keys are being backed up (the first backup could take a few minutes).")), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('OK'),
      onPrimaryButtonClick: this._onDone,
      hasCancel: false
    }));
  }

  _renderPhaseOptOutConfirm() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Without setting up Secure Message Recovery, you won't be able to restore your " + "encrypted message history if you log out or use another session."), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Set up Secure Message Recovery'),
      onPrimaryButtonClick: this._onSetUpClick,
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onCancel
    }, "I understand, continue without")));
  }

  _titleForPhase(phase) {
    switch (phase) {
      case PHASE_PASSPHRASE:
        return (0, _languageHandler._t)('Secure your backup with a recovery passphrase');

      case PHASE_PASSPHRASE_CONFIRM:
        return (0, _languageHandler._t)('Confirm your recovery passphrase');

      case PHASE_OPTOUT_CONFIRM:
        return (0, _languageHandler._t)('Warning!');

      case PHASE_SHOWKEY:
      case PHASE_KEEPITSAFE:
        return (0, _languageHandler._t)('Make a copy of your recovery key');

      case PHASE_BACKINGUP:
        return (0, _languageHandler._t)('Starting backup...');

      case PHASE_DONE:
        return (0, _languageHandler._t)('Success!');

      default:
        return (0, _languageHandler._t)("Create key backup");
    }
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    let content;

    if (this.state.error) {
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Unable to create key backup")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_buttons"
      }, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Retry'),
        onPrimaryButtonClick: this._createBackup,
        hasCancel: true,
        onCancel: this._onCancel
      })));
    } else {
      switch (this.state.phase) {
        case PHASE_PASSPHRASE:
          content = this._renderPhasePassPhrase();
          break;

        case PHASE_PASSPHRASE_CONFIRM:
          content = this._renderPhasePassPhraseConfirm();
          break;

        case PHASE_SHOWKEY:
          content = this._renderPhaseShowKey();
          break;

        case PHASE_KEEPITSAFE:
          content = this._renderPhaseKeepItSafe();
          break;

        case PHASE_BACKINGUP:
          content = this._renderBusyPhase();
          break;

        case PHASE_DONE:
          content = this._renderPhaseDone();
          break;

        case PHASE_OPTOUT_CONFIRM:
          content = this._renderPhaseOptOutConfirm();
          break;
      }
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_CreateKeyBackupDialog",
      onFinished: this.props.onFinished,
      title: this._titleForPhase(this.state.phase),
      hasCancel: [PHASE_PASSPHRASE, PHASE_DONE].includes(this.state.phase)
    }, /*#__PURE__*/_react.default.createElement("div", null, content));
  }

}

exports.default = CreateKeyBackupDialog;
(0, _defineProperty2.default)(CreateKeyBackupDialog, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL0NyZWF0ZUtleUJhY2t1cERpYWxvZy5qcyJdLCJuYW1lcyI6WyJQSEFTRV9QQVNTUEhSQVNFIiwiUEhBU0VfUEFTU1BIUkFTRV9DT05GSVJNIiwiUEhBU0VfU0hPV0tFWSIsIlBIQVNFX0tFRVBJVFNBRkUiLCJQSEFTRV9CQUNLSU5HVVAiLCJQSEFTRV9ET05FIiwiUEhBU0VfT1BUT1VUX0NPTkZJUk0iLCJQQVNTV09SRF9NSU5fU0NPUkUiLCJDcmVhdGVLZXlCYWNrdXBEaWFsb2ciLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwibiIsIl9yZWNvdmVyeUtleU5vZGUiLCJzdWNjZXNzZnVsIiwic2V0U3RhdGUiLCJjb3BpZWQiLCJwaGFzZSIsImJsb2IiLCJCbG9iIiwiX2tleUJhY2t1cEluZm8iLCJyZWNvdmVyeV9rZXkiLCJ0eXBlIiwiRmlsZVNhdmVyIiwic2F2ZUFzIiwiZG93bmxvYWRlZCIsInNlY3VyZVNlY3JldFN0b3JhZ2UiLCJzdGF0ZSIsImVycm9yIiwiaW5mbyIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInByZXBhcmVLZXlCYWNrdXBWZXJzaW9uIiwiY3JlYXRlS2V5QmFja3VwVmVyc2lvbiIsInNjaGVkdWxlQWxsR3JvdXBTZXNzaW9uc0ZvckJhY2t1cCIsImUiLCJjb25zb2xlIiwiZGVsZXRlS2V5QmFja3VwVmVyc2lvbiIsInZlcnNpb24iLCJvbkZpbmlzaGVkIiwicHJldmVudERlZmF1bHQiLCJfcGFzc3BocmFzZUZpZWxkIiwiY3VycmVudCIsInZhbGlkYXRlIiwiYWxsb3dFbXB0eSIsInZhbGlkIiwiZm9jdXMiLCJmb2N1c2VkIiwicGFzc1BocmFzZSIsInBhc3NQaHJhc2VDb25maXJtIiwicGFzc1BocmFzZVZhbGlkIiwicmVzdWx0IiwidGFyZ2V0IiwidmFsdWUiLCJjb21wb25lbnREaWRNb3VudCIsImNsaSIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsImRvZXNTZXJ2ZXJTdXBwb3J0VW5zdGFibGVGZWF0dXJlIiwiX2NyZWF0ZUJhY2t1cCIsIl9yZW5kZXJQaGFzZVBhc3NQaHJhc2UiLCJEaWFsb2dCdXR0b25zIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiX29uUGFzc1BocmFzZU5leHRDbGljayIsImIiLCJzdWIiLCJfb25QYXNzUGhyYXNlQ2hhbmdlIiwiX29uUGFzc1BocmFzZVZhbGlkYXRlIiwiX29uU2tpcFBhc3NQaHJhc2VDbGljayIsIl9yZW5kZXJQaGFzZVBhc3NQaHJhc2VDb25maXJtIiwiQWNjZXNzaWJsZUJ1dHRvbiIsIm1hdGNoVGV4dCIsInN0YXJ0c1dpdGgiLCJwYXNzUGhyYXNlTWF0Y2giLCJfb25TZXRBZ2FpbkNsaWNrIiwiX29uUGFzc1BocmFzZUNvbmZpcm1OZXh0Q2xpY2siLCJfb25QYXNzUGhyYXNlQ29uZmlybUNoYW5nZSIsIl9yZW5kZXJQaGFzZVNob3dLZXkiLCJfY29sbGVjdFJlY292ZXJ5S2V5Tm9kZSIsIl9vbkNvcHlDbGljayIsIl9vbkRvd25sb2FkQ2xpY2siLCJfcmVuZGVyUGhhc2VLZWVwSXRTYWZlIiwiaW50cm9UZXh0IiwicyIsIl9vbktlZXBJdFNhZmVCYWNrQ2xpY2siLCJfcmVuZGVyQnVzeVBoYXNlIiwidGV4dCIsIlNwaW5uZXIiLCJfcmVuZGVyUGhhc2VEb25lIiwiX29uRG9uZSIsIl9yZW5kZXJQaGFzZU9wdE91dENvbmZpcm0iLCJfb25TZXRVcENsaWNrIiwiX29uQ2FuY2VsIiwiX3RpdGxlRm9yUGhhc2UiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiY29udGVudCIsImluY2x1ZGVzIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBM0JBOzs7Ozs7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b3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBGaWxlU2F2ZXIgZnJvbSAnZmlsZS1zYXZlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtfdCwgX3RkfSBmcm9tICcuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgYWNjZXNzU2VjcmV0U3RvcmFnZSB9IGZyb20gJy4uLy4uLy4uLy4uL0Nyb3NzU2lnbmluZ01hbmFnZXInO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vLi4vLi4vLi4vY29tcG9uZW50cy92aWV3cy9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQge2NvcHlOb2RlfSBmcm9tIFwiLi4vLi4vLi4vLi4vdXRpbHMvc3RyaW5nc1wiO1xuaW1wb3J0IFBhc3NwaHJhc2VGaWVsZCBmcm9tIFwiLi4vLi4vLi4vLi4vY29tcG9uZW50cy92aWV3cy9hdXRoL1Bhc3NwaHJhc2VGaWVsZFwiO1xuXG5jb25zdCBQSEFTRV9QQVNTUEhSQVNFID0gMDtcbmNvbnN0IFBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTSA9IDE7XG5jb25zdCBQSEFTRV9TSE9XS0VZID0gMjtcbmNvbnN0IFBIQVNFX0tFRVBJVFNBRkUgPSAzO1xuY29uc3QgUEhBU0VfQkFDS0lOR1VQID0gNDtcbmNvbnN0IFBIQVNFX0RPTkUgPSA1O1xuY29uc3QgUEhBU0VfT1BUT1VUX0NPTkZJUk0gPSA2O1xuXG5jb25zdCBQQVNTV09SRF9NSU5fU0NPUkUgPSA0OyAvLyBTbyBzZWN1cmUsIG1hbnkgY2hhcmFjdGVycywgbXVjaCBjb21wbGV4LCB3b3csIGV0YywgZXRjLlxuXG4vKlxuICogV2Fsa3MgdGhlIHVzZXIgdGhyb3VnaCB0aGUgcHJvY2VzcyBvZiBjcmVhdGluZyBhbiBlMmUga2V5IGJhY2t1cFxuICogb24gdGhlIHNlcnZlci5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlS2V5QmFja3VwRGlhbG9nIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5fcmVjb3ZlcnlLZXlOb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fa2V5QmFja3VwSW5mbyA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHNlY3VyZVNlY3JldFN0b3JhZ2U6IG51bGwsXG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfUEFTU1BIUkFTRSxcbiAgICAgICAgICAgIHBhc3NQaHJhc2U6ICcnLFxuICAgICAgICAgICAgcGFzc1BocmFzZVZhbGlkOiBmYWxzZSxcbiAgICAgICAgICAgIHBhc3NQaHJhc2VDb25maXJtOiAnJyxcbiAgICAgICAgICAgIGNvcGllZDogZmFsc2UsXG4gICAgICAgICAgICBkb3dubG9hZGVkOiBmYWxzZSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9wYXNzcGhyYXNlRmllbGQgPSBjcmVhdGVSZWYoKTtcbiAgICB9XG5cbiAgICBhc3luYyBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBzZWN1cmVTZWNyZXRTdG9yYWdlID0gKFxuICAgICAgICAgICAgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSAmJlxuICAgICAgICAgICAgYXdhaXQgY2xpLmRvZXNTZXJ2ZXJTdXBwb3J0VW5zdGFibGVGZWF0dXJlKFwib3JnLm1hdHJpeC5lMmVfY3Jvc3Nfc2lnbmluZ1wiKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgc2VjdXJlU2VjcmV0U3RvcmFnZSB9KTtcblxuICAgICAgICAvLyBJZiB3ZSdyZSB1c2luZyBzZWNyZXQgc3RvcmFnZSwgc2tpcCBhaGVhZCB0byB0aGUgYmFja2luZyB1cCBzdGVwLCBhc1xuICAgICAgICAvLyBgYWNjZXNzU2VjcmV0U3RvcmFnZWAgd2lsbCBoYW5kbGUgcGFzc3BocmFzZXMgYXMgbmVlZGVkLlxuICAgICAgICBpZiAoc2VjdXJlU2VjcmV0U3RvcmFnZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHBoYXNlOiBQSEFTRV9CQUNLSU5HVVAgfSk7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVCYWNrdXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9jb2xsZWN0UmVjb3ZlcnlLZXlOb2RlID0gKG4pID0+IHtcbiAgICAgICAgdGhpcy5fcmVjb3ZlcnlLZXlOb2RlID0gbjtcbiAgICB9XG5cbiAgICBfb25Db3B5Q2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBjb3B5Tm9kZSh0aGlzLl9yZWNvdmVyeUtleU5vZGUpO1xuICAgICAgICBpZiAoc3VjY2Vzc2Z1bCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgY29waWVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9LRUVQSVRTQUZFLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Eb3dubG9hZENsaWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW3RoaXMuX2tleUJhY2t1cEluZm8ucmVjb3Zlcnlfa2V5XSwge1xuICAgICAgICAgICAgdHlwZTogJ3RleHQvcGxhaW47Y2hhcnNldD11cy1hc2NpaScsXG4gICAgICAgIH0pO1xuICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGJsb2IsICdyZWNvdmVyeS1rZXkudHh0Jyk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBkb3dubG9hZGVkOiB0cnVlLFxuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX0tFRVBJVFNBRkUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9jcmVhdGVCYWNrdXAgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgc2VjdXJlU2VjcmV0U3RvcmFnZSB9ID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfQkFDS0lOR1VQLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgaW5mbztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChzZWN1cmVTZWNyZXRTdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWNjZXNzU2VjcmV0U3RvcmFnZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8gPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucHJlcGFyZUtleUJhY2t1cFZlcnNpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsIC8qIHJhbmRvbSBrZXkgKi8sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHNlY3VyZVNlY3JldFN0b3JhZ2U6IHRydWUgfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVhdGVLZXlCYWNrdXBWZXJzaW9uKGluZm8pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWF0ZUtleUJhY2t1cFZlcnNpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleUJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5zY2hlZHVsZUFsbEdyb3VwU2Vzc2lvbnNGb3JCYWNrdXAoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9ET05FLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjcmVhdGluZyBrZXkgYmFja3VwXCIsIGUpO1xuICAgICAgICAgICAgLy8gVE9ETzogSWYgY3JlYXRpbmcgYSB2ZXJzaW9uIHN1Y2NlZWRzLCBidXQgYmFja3VwIGZhaWxzLCBzaG91bGQgd2VcbiAgICAgICAgICAgIC8vIGRlbGV0ZSB0aGUgdmVyc2lvbiwgZGlzYWJsZSBiYWNrdXAsIG9yIGRvIG5vdGhpbmc/ICBJZiB3ZSBqdXN0XG4gICAgICAgICAgICAvLyBkaXNhYmxlIHdpdGhvdXQgZGVsZXRpbmcsIHdlJ2xsIGVuYWJsZSBvbiBuZXh0IGFwcCByZWxvYWQgc2luY2VcbiAgICAgICAgICAgIC8vIGl0IGlzIHRydXN0ZWQuXG4gICAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5kZWxldGVLZXlCYWNrdXBWZXJzaW9uKGluZm8udmVyc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQ2FuY2VsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH1cblxuICAgIF9vbkRvbmUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9XG5cbiAgICBfb25PcHRPdXRDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFBIQVNFX09QVE9VVF9DT05GSVJNfSk7XG4gICAgfVxuXG4gICAgX29uU2V0VXBDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFBIQVNFX1BBU1NQSFJBU0V9KTtcbiAgICB9XG5cbiAgICBfb25Ta2lwUGFzc1BocmFzZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLl9rZXlCYWNrdXBJbmZvID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLnByZXBhcmVLZXlCYWNrdXBWZXJzaW9uKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgY29waWVkOiBmYWxzZSxcbiAgICAgICAgICAgIGRvd25sb2FkZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NIT1dLRVksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblBhc3NQaHJhc2VOZXh0Q2xpY2sgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5fcGFzc3BocmFzZUZpZWxkLmN1cnJlbnQpIHJldHVybjsgLy8gdW5tb3VudGluZ1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3Bhc3NwaHJhc2VGaWVsZC5jdXJyZW50LnZhbGlkYXRlKHsgYWxsb3dFbXB0eTogZmFsc2UgfSk7XG4gICAgICAgIGlmICghdGhpcy5fcGFzc3BocmFzZUZpZWxkLmN1cnJlbnQuc3RhdGUudmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bhc3NwaHJhc2VGaWVsZC5jdXJyZW50LmZvY3VzKCk7XG4gICAgICAgICAgICB0aGlzLl9wYXNzcGhyYXNlRmllbGQuY3VycmVudC52YWxpZGF0ZSh7IGFsbG93RW1wdHk6IGZhbHNlLCBmb2N1c2VkOiB0cnVlIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTX0pO1xuICAgIH07XG5cbiAgICBfb25QYXNzUGhyYXNlQ29uZmlybU5leHRDbGljayA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5wYXNzUGhyYXNlICE9PSB0aGlzLnN0YXRlLnBhc3NQaHJhc2VDb25maXJtKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fa2V5QmFja3VwSW5mbyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5wcmVwYXJlS2V5QmFja3VwVmVyc2lvbih0aGlzLnN0YXRlLnBhc3NQaHJhc2UpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGNvcGllZDogZmFsc2UsXG4gICAgICAgICAgICBkb3dubG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9TSE9XS0VZLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uU2V0QWdhaW5DbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwYXNzUGhyYXNlOiAnJyxcbiAgICAgICAgICAgIHBhc3NQaHJhc2VWYWxpZDogZmFsc2UsXG4gICAgICAgICAgICBwYXNzUGhyYXNlQ29uZmlybTogJycsXG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfUEFTU1BIUkFTRSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX29uS2VlcEl0U2FmZUJhY2tDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfU0hPV0tFWSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX29uUGFzc1BocmFzZVZhbGlkYXRlID0gKHJlc3VsdCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhc3NQaHJhc2VWYWxpZDogcmVzdWx0LnZhbGlkLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uUGFzc1BocmFzZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGFzc1BocmFzZTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblBhc3NQaHJhc2VDb25maXJtQ2hhbmdlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwYXNzUGhyYXNlQ29uZmlybTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZVBhc3NQaHJhc2UoKSB7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG5cbiAgICAgICAgcmV0dXJuIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vblBhc3NQaHJhc2VOZXh0Q2xpY2t9PlxuICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgIFwiPGI+V2FybmluZzwvYj46IFlvdSBzaG91bGQgb25seSBzZXQgdXAga2V5IGJhY2t1cCBmcm9tIGEgdHJ1c3RlZCBjb21wdXRlci5cIiwge30sXG4gICAgICAgICAgICAgICAgeyBiOiBzdWIgPT4gPGI+e3N1Yn08L2I+IH0sXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIldlJ2xsIHN0b3JlIGFuIGVuY3J5cHRlZCBjb3B5IG9mIHlvdXIga2V5cyBvbiBvdXIgc2VydmVyLiBcIiArXG4gICAgICAgICAgICAgICAgXCJTZWN1cmUgeW91ciBiYWNrdXAgd2l0aCBhIHJlY292ZXJ5IHBhc3NwaHJhc2UuXCIsXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxwPntfdChcIkZvciBtYXhpbXVtIHNlY3VyaXR5LCB0aGlzIHNob3VsZCBiZSBkaWZmZXJlbnQgZnJvbSB5b3VyIGFjY291bnQgcGFzc3dvcmQuXCIpfTwvcD5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVLZXlCYWNrdXBEaWFsb2dfcHJpbWFyeUNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nX3Bhc3NQaHJhc2VDb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPFBhc3NwaHJhc2VGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nX3Bhc3NQaHJhc2VJbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25QYXNzUGhyYXNlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWluU2NvcmU9e1BBU1NXT1JEX01JTl9TQ09SRX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBhc3NQaHJhc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblZhbGlkYXRlPXt0aGlzLl9vblBhc3NQaHJhc2VWYWxpZGF0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkUmVmPXt0aGlzLl9wYXNzcGhyYXNlRmllbGR9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3RkKFwiRW50ZXIgYSByZWNvdmVyeSBwYXNzcGhyYXNlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWxFbnRlclBhc3N3b3JkPXtfdGQoXCJFbnRlciBhIHJlY292ZXJ5IHBhc3NwaHJhc2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbFN0cm9uZ1Bhc3N3b3JkPXtfdGQoXCJHcmVhdCEgVGhpcyByZWNvdmVyeSBwYXNzcGhyYXNlIGxvb2tzIHN0cm9uZyBlbm91Z2guXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWxBbGxvd2VkQnV0VW5zYWZlPXtfdGQoXCJHcmVhdCEgVGhpcyByZWNvdmVyeSBwYXNzcGhyYXNlIGxvb2tzIHN0cm9uZyBlbm91Z2guXCIpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgcHJpbWFyeUJ1dHRvbj17X3QoJ05leHQnKX1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25QYXNzUGhyYXNlTmV4dENsaWNrfVxuICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF0aGlzLnN0YXRlLnBhc3NQaHJhc2VWYWxpZH1cbiAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgIDxkZXRhaWxzPlxuICAgICAgICAgICAgICAgIDxzdW1tYXJ5PntfdChcIkFkdmFuY2VkXCIpfTwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPSdwcmltYXJ5JyBvbkNsaWNrPXt0aGlzLl9vblNraXBQYXNzUGhyYXNlQ2xpY2t9ID5cbiAgICAgICAgICAgICAgICAgICAge190KFwiU2V0IHVwIHdpdGggYSByZWNvdmVyeSBrZXlcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICA8L2Zvcm0+O1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZVBhc3NQaHJhc2VDb25maXJtKCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIGxldCBtYXRjaFRleHQ7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnBhc3NQaHJhc2VDb25maXJtID09PSB0aGlzLnN0YXRlLnBhc3NQaHJhc2UpIHtcbiAgICAgICAgICAgIG1hdGNoVGV4dCA9IF90KFwiVGhhdCBtYXRjaGVzIVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5wYXNzUGhyYXNlLnN0YXJ0c1dpdGgodGhpcy5zdGF0ZS5wYXNzUGhyYXNlQ29uZmlybSkpIHtcbiAgICAgICAgICAgIC8vIG9ubHkgdGVsbCB0aGVtIHRoZXkncmUgd3JvbmcgaWYgdGhleSd2ZSBhY3R1YWxseSBnb25lIHdyb25nLlxuICAgICAgICAgICAgLy8gU2VjdXJpdHkgY29uY2lvdXMgcmVhZGVycyB3aWxsIG5vdGUgdGhhdCBpZiB5b3UgbGVmdCByaW90LXdlYiB1bmF0dGVuZGVkXG4gICAgICAgICAgICAvLyBvbiB0aGlzIHNjcmVlbiwgdGhpcyB3b3VsZCBtYWtlIGl0IGVhc3kgZm9yIGEgbWFsaWNpb3VzIHBlcnNvbiB0byBndWVzc1xuICAgICAgICAgICAgLy8geW91ciBwYXNzcGhyYXNlIG9uZSBsZXR0ZXIgYXQgYSB0aW1lLCBidXQgdGhleSBjb3VsZCBnZXQgdGhpcyBmYXN0ZXIgYnlcbiAgICAgICAgICAgIC8vIGp1c3Qgb3BlbmluZyB0aGUgYnJvd3NlcidzIGRldmVsb3BlciB0b29scyBhbmQgcmVhZGluZyBpdC5cbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBub3QgaGF2aW5nIHR5cGVkIGFueXRoaW5nIGF0IGFsbCB3aWxsIG5vdCBoaXQgdGhpcyBjbGF1c2UgYW5kXG4gICAgICAgICAgICAvLyBmYWxsIHRocm91Z2ggc28gZW1wdHkgYm94ID09PSBubyBoaW50LlxuICAgICAgICAgICAgbWF0Y2hUZXh0ID0gX3QoXCJUaGF0IGRvZXNuJ3QgbWF0Y2guXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhc3NQaHJhc2VNYXRjaCA9IG51bGw7XG4gICAgICAgIGlmIChtYXRjaFRleHQpIHtcbiAgICAgICAgICAgIHBhc3NQaHJhc2VNYXRjaCA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nX3Bhc3NQaHJhc2VNYXRjaFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+e21hdGNoVGV4dH08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBlbGVtZW50PVwic3BhblwiIGNsYXNzTmFtZT1cIm14X2xpbmtCdXR0b25cIiBvbkNsaWNrPXt0aGlzLl9vblNldEFnYWluQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiR28gYmFjayB0byBzZXQgaXQgYWdhaW4uXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgcmV0dXJuIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vblBhc3NQaHJhc2VDb25maXJtTmV4dENsaWNrfT5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIlBsZWFzZSBlbnRlciB5b3VyIHJlY292ZXJ5IHBhc3NwaHJhc2UgYSBzZWNvbmQgdGltZSB0byBjb25maXJtLlwiLFxuICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUtleUJhY2t1cERpYWxvZ19wcmltYXJ5Q29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVLZXlCYWNrdXBEaWFsb2dfcGFzc1BocmFzZUNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUGFzc1BocmFzZUNvbmZpcm1DaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc1BocmFzZUNvbmZpcm19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nX3Bhc3NQaHJhc2VJbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e190KFwiUmVwZWF0IHlvdXIgcmVjb3ZlcnkgcGFzc3BocmFzZS4uLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAge3Bhc3NQaHJhc2VNYXRjaH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnNcbiAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdCgnTmV4dCcpfVxuICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vblBhc3NQaHJhc2VDb25maXJtTmV4dENsaWNrfVxuICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUucGFzc1BocmFzZSAhPT0gdGhpcy5zdGF0ZS5wYXNzUGhyYXNlQ29uZmlybX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvZm9ybT47XG4gICAgfVxuXG4gICAgX3JlbmRlclBoYXNlU2hvd0tleSgpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJZb3VyIHJlY292ZXJ5IGtleSBpcyBhIHNhZmV0eSBuZXQgLSB5b3UgY2FuIHVzZSBpdCB0byByZXN0b3JlIFwiICtcbiAgICAgICAgICAgICAgICBcImFjY2VzcyB0byB5b3VyIGVuY3J5cHRlZCBtZXNzYWdlcyBpZiB5b3UgZm9yZ2V0IHlvdXIgcmVjb3ZlcnkgcGFzc3BocmFzZS5cIixcbiAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgIFwiS2VlcCBhIGNvcHkgb2YgaXQgc29tZXdoZXJlIHNlY3VyZSwgbGlrZSBhIHBhc3N3b3JkIG1hbmFnZXIgb3IgZXZlbiBhIHNhZmUuXCIsXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nX3ByaW1hcnlDb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUtleUJhY2t1cERpYWxvZ19yZWNvdmVyeUtleUhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJZb3VyIHJlY292ZXJ5IGtleVwiKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUtleUJhY2t1cERpYWxvZ19yZWNvdmVyeUtleUNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUtleUJhY2t1cERpYWxvZ19yZWNvdmVyeUtleVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNvZGUgcmVmPXt0aGlzLl9jb2xsZWN0UmVjb3ZlcnlLZXlOb2RlfT57dGhpcy5fa2V5QmFja3VwSW5mby5yZWNvdmVyeV9rZXl9PC9jb2RlPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVLZXlCYWNrdXBEaWFsb2dfcmVjb3ZlcnlLZXlCdXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cIm14X0RpYWxvZ19wcmltYXJ5XCIgb25DbGljaz17dGhpcy5fb25Db3B5Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNvcHlcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwibXhfRGlhbG9nX3ByaW1hcnlcIiBvbkNsaWNrPXt0aGlzLl9vbkRvd25sb2FkQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkRvd25sb2FkXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VLZWVwSXRTYWZlKCkge1xuICAgICAgICBsZXQgaW50cm9UZXh0O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3BpZWQpIHtcbiAgICAgICAgICAgIGludHJvVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiWW91ciByZWNvdmVyeSBrZXkgaGFzIGJlZW4gPGI+Y29waWVkIHRvIHlvdXIgY2xpcGJvYXJkPC9iPiwgcGFzdGUgaXQgdG86XCIsXG4gICAgICAgICAgICAgICAge30sIHtiOiBzID0+IDxiPntzfTwvYj59LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkZWQpIHtcbiAgICAgICAgICAgIGludHJvVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiWW91ciByZWNvdmVyeSBrZXkgaXMgaW4geW91ciA8Yj5Eb3dubG9hZHM8L2I+IGZvbGRlci5cIixcbiAgICAgICAgICAgICAgICB7fSwge2I6IHMgPT4gPGI+e3N9PC9iPn0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAge2ludHJvVGV4dH1cbiAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICA8bGk+e190KFwiPGI+UHJpbnQgaXQ8L2I+IGFuZCBzdG9yZSBpdCBzb21ld2hlcmUgc2FmZVwiLCB7fSwge2I6IHMgPT4gPGI+e3N9PC9iPn0pfTwvbGk+XG4gICAgICAgICAgICAgICAgPGxpPntfdChcIjxiPlNhdmUgaXQ8L2I+IG9uIGEgVVNCIGtleSBvciBiYWNrdXAgZHJpdmVcIiwge30sIHtiOiBzID0+IDxiPntzfTwvYj59KX08L2xpPlxuICAgICAgICAgICAgICAgIDxsaT57X3QoXCI8Yj5Db3B5IGl0PC9iPiB0byB5b3VyIHBlcnNvbmFsIGNsb3VkIHN0b3JhZ2VcIiwge30sIHtiOiBzID0+IDxiPntzfTwvYj59KX08L2xpPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KFwiQ29udGludWVcIil9XG4gICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX2NyZWF0ZUJhY2t1cH1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfT5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uS2VlcEl0U2FmZUJhY2tDbGlja30+e190KFwiQmFja1wiKX08L2J1dHRvbj5cbiAgICAgICAgICAgIDwvRGlhbG9nQnV0dG9ucz5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cblxuICAgIF9yZW5kZXJCdXN5UGhhc2UodGV4dCkge1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VEb25lKCkge1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIllvdXIga2V5cyBhcmUgYmVpbmcgYmFja2VkIHVwICh0aGUgZmlyc3QgYmFja3VwIGNvdWxkIHRha2UgYSBmZXcgbWludXRlcykuXCIsXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdPSycpfVxuICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vbkRvbmV9XG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VPcHRPdXRDb25maXJtKCkge1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICBcIldpdGhvdXQgc2V0dGluZyB1cCBTZWN1cmUgTWVzc2FnZSBSZWNvdmVyeSwgeW91IHdvbid0IGJlIGFibGUgdG8gcmVzdG9yZSB5b3VyIFwiICtcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZCBtZXNzYWdlIGhpc3RvcnkgaWYgeW91IGxvZyBvdXQgb3IgdXNlIGFub3RoZXIgc2Vzc2lvbi5cIixcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtfdCgnU2V0IHVwIFNlY3VyZSBNZXNzYWdlIFJlY292ZXJ5Jyl9XG4gICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uU2V0VXBDbGlja31cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5fb25DYW5jZWx9PkkgdW5kZXJzdGFuZCwgY29udGludWUgd2l0aG91dDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxuXG4gICAgX3RpdGxlRm9yUGhhc2UocGhhc2UpIHtcbiAgICAgICAgc3dpdGNoIChwaGFzZSkge1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9QQVNTUEhSQVNFOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2VjdXJlIHlvdXIgYmFja3VwIHdpdGggYSByZWNvdmVyeSBwYXNzcGhyYXNlJyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTTpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ0NvbmZpcm0geW91ciByZWNvdmVyeSBwYXNzcGhyYXNlJyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX09QVE9VVF9DT05GSVJNOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnV2FybmluZyEnKTtcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfU0hPV0tFWTpcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfS0VFUElUU0FGRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ01ha2UgYSBjb3B5IG9mIHlvdXIgcmVjb3Zlcnkga2V5Jyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0JBQ0tJTkdVUDpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1N0YXJ0aW5nIGJhY2t1cC4uLicpO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9ET05FOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU3VjY2VzcyEnKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KFwiQ3JlYXRlIGtleSBiYWNrdXBcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcblxuICAgICAgICBsZXQgY29udGVudDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57X3QoXCJVbmFibGUgdG8gY3JlYXRlIGtleSBiYWNrdXBcIil9PC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17X3QoJ1JldHJ5Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fY3JlYXRlQmFja3VwfVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMuX29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLnN0YXRlLnBoYXNlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9QQVNTUEhSQVNFOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VQYXNzUGhyYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUEhBU0VfUEFTU1BIUkFTRV9DT05GSVJNOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VQYXNzUGhyYXNlQ29uZmlybSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX1NIT1dLRVk6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZVNob3dLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9LRUVQSVRTQUZFOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VLZWVwSXRTYWZlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUEhBU0VfQkFDS0lOR1VQOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyQnVzeVBoYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUEhBU0VfRE9ORTpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuX3JlbmRlclBoYXNlRG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX09QVE9VVF9DT05GSVJNOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VPcHRPdXRDb25maXJtKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT0nbXhfQ3JlYXRlS2V5QmFja3VwRGlhbG9nJ1xuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGhpcy5fdGl0bGVGb3JQaGFzZSh0aGlzLnN0YXRlLnBoYXNlKX1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e1tQSEFTRV9QQVNTUEhSQVNFLCBQSEFTRV9ET05FXS5pbmNsdWRlcyh0aGlzLnN0YXRlLnBoYXNlKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=