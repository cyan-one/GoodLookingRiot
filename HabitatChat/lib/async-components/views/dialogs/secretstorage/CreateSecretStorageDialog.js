"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../../index"));

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _fileSaver = _interopRequireDefault(require("file-saver"));

var _languageHandler = require("../../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../../Modal"));

var _CrossSigningManager = require("../../../../CrossSigningManager");

var _strings = require("../../../../utils/strings");

var _InteractiveAuthEntryComponents = require("../../../../components/views/auth/InteractiveAuthEntryComponents");

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
const PHASE_LOADING = 0;
const PHASE_LOADERROR = 1;
const PHASE_MIGRATE = 2;
const PHASE_PASSPHRASE = 3;
const PHASE_PASSPHRASE_CONFIRM = 4;
const PHASE_SHOWKEY = 5;
const PHASE_KEEPITSAFE = 6;
const PHASE_STORING = 7;
const PHASE_DONE = 8;
const PHASE_CONFIRM_SKIP = 9;
const PASSWORD_MIN_SCORE = 4; // So secure, many characters, much complex, wow, etc, etc.

/*
 * Walks the user through the process of creating a passphrase to guard Secure
 * Secret Storage in account data.
 */

class CreateSecretStorageDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onKeyBackupStatusChange", () => {
      if (this.state.phase === PHASE_MIGRATE) this._fetchBackupInfo();
    });
    (0, _defineProperty2.default)(this, "_collectRecoveryKeyNode", n => {
      this._recoveryKeyNode = n;
    });
    (0, _defineProperty2.default)(this, "_onUseKeyBackupChange", enabled => {
      this.setState({
        useKeyBackup: enabled
      });
    });
    (0, _defineProperty2.default)(this, "_onMigrateFormSubmit", e => {
      e.preventDefault();

      if (this.state.backupSigStatus.usable) {
        this._bootstrapSecretStorage();
      } else {
        this._restoreBackup();
      }
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
      const blob = new Blob([this._recoveryKey.encodedPrivateKey], {
        type: 'text/plain;charset=us-ascii'
      });

      _fileSaver.default.saveAs(blob, 'recovery-key.txt');

      this.setState({
        downloaded: true,
        phase: PHASE_KEEPITSAFE
      });
    });
    (0, _defineProperty2.default)(this, "_doBootstrapUIAuth", async makeRequest => {
      if (this.state.canUploadKeysWithPasswordOnly && this.state.accountPassword) {
        await makeRequest({
          type: 'm.login.password',
          identifier: {
            type: 'm.id.user',
            user: _MatrixClientPeg.MatrixClientPeg.get().getUserId()
          },
          // https://github.com/matrix-org/synapse/issues/5665
          user: _MatrixClientPeg.MatrixClientPeg.get().getUserId(),
          password: this.state.accountPassword
        });
      } else {
        const InteractiveAuthDialog = sdk.getComponent("dialogs.InteractiveAuthDialog");
        const dialogAesthetics = {
          [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
            title: (0, _languageHandler._t)("Use Single Sign On to continue"),
            body: (0, _languageHandler._t)("To continue, use Single Sign On to prove your identity."),
            continueText: (0, _languageHandler._t)("Single Sign On"),
            continueKind: "primary"
          },
          [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
            title: (0, _languageHandler._t)("Confirm encryption setup"),
            body: (0, _languageHandler._t)("Click the button below to confirm setting up encryption."),
            continueText: (0, _languageHandler._t)("Confirm"),
            continueKind: "primary"
          }
        };

        const {
          finished
        } = _Modal.default.createTrackedDialog('Cross-signing keys dialog', '', InteractiveAuthDialog, {
          title: (0, _languageHandler._t)("Setting up keys"),
          matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
          makeRequest,
          aestheticsForStagePhases: {
            [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: dialogAesthetics,
            [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: dialogAesthetics
          }
        });

        const [confirmed] = await finished;

        if (!confirmed) {
          throw new Error("Cross-signing key upload auth canceled");
        }
      }
    });
    (0, _defineProperty2.default)(this, "_bootstrapSecretStorage", async () => {
      this.setState({
        phase: PHASE_STORING,
        error: null
      });

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const {
        force
      } = this.props;

      try {
        if (force) {
          console.log("Forcing secret storage reset"); // log something so we can debug this later

          await cli.bootstrapSecretStorage({
            authUploadDeviceSigningKeys: this._doBootstrapUIAuth,
            createSecretStorageKey: async () => this._recoveryKey,
            setupNewKeyBackup: this.state.useKeyBackup,
            setupNewSecretStorage: true
          });

          if (!this.state.useKeyBackup && this.state.backupInfo) {
            // If the user is resetting their cross-signing keys and doesn't want
            // key backup (but had it enabled before), delete the key backup as it's
            // no longer valid.
            console.log("Deleting invalid key backup (secrets have been reset; key backup not requested)");
            await cli.deleteKeyBackupVersion(this.state.backupInfo.version);
          }
        } else {
          await cli.bootstrapSecretStorage({
            authUploadDeviceSigningKeys: this._doBootstrapUIAuth,
            createSecretStorageKey: async () => this._recoveryKey,
            keyBackupInfo: this.state.backupInfo,
            setupNewKeyBackup: !this.state.backupInfo && this.state.useKeyBackup,
            getKeyBackupPassphrase: () => {
              // We may already have the backup key if we earlier went
              // through the restore backup path, so pass it along
              // rather than prompting again.
              if (this._backupKey) {
                return this._backupKey;
              }

              return (0, _CrossSigningManager.promptForBackupPassphrase)();
            }
          });
        }

        this.setState({
          phase: PHASE_DONE
        });
      } catch (e) {
        if (this.state.canUploadKeysWithPasswordOnly && e.httpStatus === 401 && e.data.flows) {
          this.setState({
            accountPassword: '',
            accountPasswordCorrect: false,
            phase: PHASE_MIGRATE
          });
        } else {
          this.setState({
            error: e
          });
        }

        console.error("Error bootstrapping secret storage", e);
      }
    });
    (0, _defineProperty2.default)(this, "_onCancel", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onDone", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_restoreBackup", async () => {
      // It's possible we'll need the backup key later on for bootstrapping,
      // so let's stash it here, rather than prompting for it twice.
      const keyCallback = k => this._backupKey = k;

      const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');

      const {
        finished
      } = _Modal.default.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, {
        showSummary: false,
        keyCallback
      }, null,
      /* priority = */
      false,
      /* static = */
      false);

      await finished;
      const {
        backupSigStatus
      } = await this._fetchBackupInfo();

      if (backupSigStatus.usable && this.state.canUploadKeysWithPasswordOnly && this.state.accountPassword) {
        this._bootstrapSecretStorage();
      }
    });
    (0, _defineProperty2.default)(this, "_onLoadRetryClick", () => {
      this.setState({
        phase: PHASE_LOADING
      });

      this._fetchBackupInfo();
    });
    (0, _defineProperty2.default)(this, "_onSkipSetupClick", () => {
      this.setState({
        phase: PHASE_CONFIRM_SKIP
      });
    });
    (0, _defineProperty2.default)(this, "_onSetUpClick", () => {
      this.setState({
        phase: PHASE_PASSPHRASE
      });
    });
    (0, _defineProperty2.default)(this, "_onSkipPassPhraseClick", async () => {
      this._recoveryKey = await _MatrixClientPeg.MatrixClientPeg.get().createRecoveryKeyFromPassphrase();
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
      this._recoveryKey = await _MatrixClientPeg.MatrixClientPeg.get().createRecoveryKeyFromPassphrase(this.state.passPhrase);
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
    (0, _defineProperty2.default)(this, "_onAccountPasswordChange", e => {
      this.setState({
        accountPassword: e.target.value
      });
    });
    this._recoveryKey = null;
    this._recoveryKeyNode = null;
    this._backupKey = null;
    this.state = {
      phase: PHASE_LOADING,
      passPhrase: '',
      passPhraseValid: false,
      passPhraseConfirm: '',
      copied: false,
      downloaded: false,
      backupInfo: null,
      backupSigStatus: null,
      // does the server offer a UI auth flow with just m.login.password
      // for /keys/device_signing/upload?
      canUploadKeysWithPasswordOnly: null,
      accountPassword: props.accountPassword || "",
      accountPasswordCorrect: null,
      // status of the key backup toggle switch
      useKeyBackup: true
    };
    this._passphraseField = (0, _react.createRef)();

    this._fetchBackupInfo();

    if (this.state.accountPassword) {
      // If we have an account password in memory, let's simplify and
      // assume it means password auth is also supported for device
      // signing key upload as well. This avoids hitting the server to
      // test auth flows, which may be slow under high load.
      this.state.canUploadKeysWithPasswordOnly = true;
    } else {
      this._queryKeyUploadAuth();
    }

    _MatrixClientPeg.MatrixClientPeg.get().on('crypto.keyBackupStatus', this._onKeyBackupStatusChange);
  }

  componentWillUnmount() {
    _MatrixClientPeg.MatrixClientPeg.get().removeListener('crypto.keyBackupStatus', this._onKeyBackupStatusChange);
  }

  async _fetchBackupInfo() {
    try {
      const backupInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
      const backupSigStatus = // we may not have started crypto yet, in which case we definitely don't trust the backup
      _MatrixClientPeg.MatrixClientPeg.get().isCryptoEnabled() && (await _MatrixClientPeg.MatrixClientPeg.get().isKeyBackupTrusted(backupInfo));
      const {
        force
      } = this.props;
      const phase = backupInfo && !force ? PHASE_MIGRATE : PHASE_PASSPHRASE;
      this.setState({
        phase,
        backupInfo,
        backupSigStatus
      });
      return {
        backupInfo,
        backupSigStatus
      };
    } catch (e) {
      this.setState({
        phase: PHASE_LOADERROR
      });
    }
  }

  async _queryKeyUploadAuth() {
    try {
      await _MatrixClientPeg.MatrixClientPeg.get().uploadDeviceSigningKeys(null, {}); // We should never get here: the server should always require
      // UI auth to upload device signing keys. If we do, we upload
      // no keys which would be a no-op.

      console.log("uploadDeviceSigningKeys unexpectedly succeeded without UI auth!");
    } catch (error) {
      if (!error.data || !error.data.flows) {
        console.log("uploadDeviceSigningKeys advertised no flows!");
        return;
      }

      const canUploadKeysWithPasswordOnly = error.data.flows.some(f => {
        return f.stages.length === 1 && f.stages[0] === 'm.login.password';
      });
      this.setState({
        canUploadKeysWithPasswordOnly
      });
    }
  }

  _renderPhaseMigrate() {
    // TODO: This is a temporary screen so people who have the labs flag turned on and
    // click the button are aware they're making a change to their account.
    // Once we're confident enough in this (and it's supported enough) we can do
    // it automatically.
    // https://github.com/vector-im/riot-web/issues/11696
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    const Field = sdk.getComponent('views.elements.Field');
    let authPrompt;
    let nextCaption = (0, _languageHandler._t)("Next");

    if (this.state.canUploadKeysWithPasswordOnly) {
      authPrompt = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Enter your account password to confirm the upgrade:")), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Field, {
        type: "password",
        label: (0, _languageHandler._t)("Password"),
        value: this.state.accountPassword,
        onChange: this._onAccountPasswordChange,
        flagInvalid: this.state.accountPasswordCorrect === false,
        autoFocus: true
      })));
    } else if (!this.state.backupSigStatus.usable) {
      authPrompt = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Restore your key backup to upgrade your encryption")));
      nextCaption = (0, _languageHandler._t)("Restore");
    } else {
      authPrompt = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You'll need to authenticate with the server to confirm the upgrade."));
    }

    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onMigrateFormSubmit
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Upgrade this session to allow it to verify other sessions, " + "granting them access to encrypted messages and marking them " + "as trusted for other users.")), /*#__PURE__*/_react.default.createElement("div", null, authPrompt), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: nextCaption,
      onPrimaryButtonClick: this._onMigrateFormSubmit,
      hasCancel: false,
      primaryDisabled: this.state.canUploadKeysWithPasswordOnly && !this.state.accountPassword
    }, /*#__PURE__*/_react.default.createElement("button", {
      type: "button",
      className: "danger",
      onClick: this._onSkipSetupClick
    }, (0, _languageHandler._t)('Skip'))));
  }

  _renderPhasePassPhrase() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const LabelledToggleSwitch = sdk.getComponent('views.elements.LabelledToggleSwitch');
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onPassPhraseNextClick
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Set a recovery passphrase to secure encrypted information and recover it if you log out. " + "This should be different to your account password:")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_passPhraseContainer"
    }, /*#__PURE__*/_react.default.createElement(_PassphraseField.default, {
      className: "mx_CreateSecretStorageDialog_passPhraseField",
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
    })), /*#__PURE__*/_react.default.createElement(LabelledToggleSwitch, {
      label: (0, _languageHandler._t)("Back up encrypted message keys"),
      onChange: this._onUseKeyBackupChange,
      value: this.state.useKeyBackup
    }), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Continue'),
      onPrimaryButtonClick: this._onPassPhraseNextClick,
      hasCancel: false,
      disabled: !this.state.passPhraseValid
    }, /*#__PURE__*/_react.default.createElement("button", {
      type: "button",
      onClick: this._onSkipSetupClick,
      className: "danger"
    }, (0, _languageHandler._t)("Skip"))), /*#__PURE__*/_react.default.createElement("details", null, /*#__PURE__*/_react.default.createElement("summary", null, (0, _languageHandler._t)("Advanced")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      onClick: this._onSkipPassPhraseClick
    }, (0, _languageHandler._t)("Set up with a recovery key"))));
  }

  _renderPhasePassPhraseConfirm() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const Field = sdk.getComponent('views.elements.Field');
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
      passPhraseMatch = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, matchText), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        element: "span",
        className: "mx_linkButton",
        onClick: this._onSetAgainClick
      }, (0, _languageHandler._t)("Go back to set it again."))));
    }

    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onPassPhraseConfirmNextClick
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Enter your recovery passphrase a second time to confirm it.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_passPhraseContainer"
    }, /*#__PURE__*/_react.default.createElement(Field, {
      type: "password",
      onChange: this._onPassPhraseConfirmChange,
      value: this.state.passPhraseConfirm,
      className: "mx_CreateSecretStorageDialog_passPhraseField",
      label: (0, _languageHandler._t)("Confirm your recovery passphrase"),
      autoFocus: true,
      autoComplete: "new-password"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_passPhraseMatch"
    }, passPhraseMatch)), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Continue'),
      onPrimaryButtonClick: this._onPassPhraseConfirmNextClick,
      hasCancel: false,
      disabled: this.state.passPhrase !== this.state.passPhraseConfirm
    }, /*#__PURE__*/_react.default.createElement("button", {
      type: "button",
      onClick: this._onSkipSetupClick,
      className: "danger"
    }, (0, _languageHandler._t)("Skip"))));
  }

  _renderPhaseShowKey() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your recovery key is a safety net - you can use it to restore " + "access to your encrypted messages if you forget your recovery passphrase.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Keep a copy of it somewhere secure, like a password manager or even a safe.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_primaryContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_recoveryKeyHeader"
    }, (0, _languageHandler._t)("Your recovery key")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_recoveryKeyContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_recoveryKey"
    }, /*#__PURE__*/_react.default.createElement("code", {
      ref: this._collectRecoveryKeyNode
    }, this._recoveryKey.encodedPrivateKey)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateSecretStorageDialog_recoveryKeyButtons"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      className: "mx_Dialog_primary mx_CreateSecretStorageDialog_recoveryKeyButtons_copyBtn",
      onClick: this._onCopyClick
    }, (0, _languageHandler._t)("Copy")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
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
      onPrimaryButtonClick: this._bootstrapSecretStorage,
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onKeepItSafeBackClick
    }, (0, _languageHandler._t)("Back"))));
  }

  _renderBusyPhase() {
    const Spinner = sdk.getComponent('views.elements.Spinner');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Spinner, null));
  }

  _renderPhaseLoadError() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Unable to query secret storage status")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Retry'),
      onPrimaryButtonClick: this._onLoadRetryClick,
      hasCancel: true,
      onCancel: this._onCancel
    })));
  }

  _renderPhaseDone() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You can now verify your other devices, " + "and other users to keep your chats safe.")), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('OK'),
      onPrimaryButtonClick: this._onDone,
      hasCancel: false
    }));
  }

  _renderPhaseSkipConfirm() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Without completing security on this session, it won’t have " + "access to encrypted messages."), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Go back'),
      onPrimaryButtonClick: this._onSetUpClick,
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("button", {
      type: "button",
      className: "danger",
      onClick: this._onCancel
    }, (0, _languageHandler._t)('Skip'))));
  }

  _titleForPhase(phase) {
    switch (phase) {
      case PHASE_MIGRATE:
        return (0, _languageHandler._t)('Upgrade your encryption');

      case PHASE_PASSPHRASE:
        return (0, _languageHandler._t)('Set up encryption');

      case PHASE_PASSPHRASE_CONFIRM:
        return (0, _languageHandler._t)('Confirm recovery passphrase');

      case PHASE_CONFIRM_SKIP:
        return (0, _languageHandler._t)('Are you sure?');

      case PHASE_SHOWKEY:
      case PHASE_KEEPITSAFE:
        return (0, _languageHandler._t)('Make a copy of your recovery key');

      case PHASE_STORING:
        return (0, _languageHandler._t)('Setting up keys');

      case PHASE_DONE:
        return (0, _languageHandler._t)("You're done!");

      default:
        return '';
    }
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    let content;

    if (this.state.error) {
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Unable to set up secret storage")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_buttons"
      }, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Retry'),
        onPrimaryButtonClick: this._bootstrapSecretStorage,
        hasCancel: true,
        onCancel: this._onCancel
      })));
    } else {
      switch (this.state.phase) {
        case PHASE_LOADING:
          content = this._renderBusyPhase();
          break;

        case PHASE_LOADERROR:
          content = this._renderPhaseLoadError();
          break;

        case PHASE_MIGRATE:
          content = this._renderPhaseMigrate();
          break;

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

        case PHASE_STORING:
          content = this._renderBusyPhase();
          break;

        case PHASE_DONE:
          content = this._renderPhaseDone();
          break;

        case PHASE_CONFIRM_SKIP:
          content = this._renderPhaseSkipConfirm();
          break;
      }
    }

    let headerImage;

    if (this._titleForPhase(this.state.phase)) {
      headerImage = require("../../../../../res/img/e2e/normal.svg");
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_CreateSecretStorageDialog",
      onFinished: this.props.onFinished,
      title: this._titleForPhase(this.state.phase),
      headerImage: headerImage,
      hasCancel: this.props.hasCancel && [PHASE_PASSPHRASE].includes(this.state.phase),
      fixedWidth: false
    }, /*#__PURE__*/_react.default.createElement("div", null, content));
  }

}

exports.default = CreateSecretStorageDialog;
(0, _defineProperty2.default)(CreateSecretStorageDialog, "propTypes", {
  hasCancel: _propTypes.default.bool,
  accountPassword: _propTypes.default.string,
  force: _propTypes.default.bool
});
(0, _defineProperty2.default)(CreateSecretStorageDialog, "defaultProps", {
  hasCancel: true,
  force: false
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mvc2VjcmV0c3RvcmFnZS9DcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nLmpzIl0sIm5hbWVzIjpbIlBIQVNFX0xPQURJTkciLCJQSEFTRV9MT0FERVJST1IiLCJQSEFTRV9NSUdSQVRFIiwiUEhBU0VfUEFTU1BIUkFTRSIsIlBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTSIsIlBIQVNFX1NIT1dLRVkiLCJQSEFTRV9LRUVQSVRTQUZFIiwiUEhBU0VfU1RPUklORyIsIlBIQVNFX0RPTkUiLCJQSEFTRV9DT05GSVJNX1NLSVAiLCJQQVNTV09SRF9NSU5fU0NPUkUiLCJDcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInN0YXRlIiwicGhhc2UiLCJfZmV0Y2hCYWNrdXBJbmZvIiwibiIsIl9yZWNvdmVyeUtleU5vZGUiLCJlbmFibGVkIiwic2V0U3RhdGUiLCJ1c2VLZXlCYWNrdXAiLCJlIiwicHJldmVudERlZmF1bHQiLCJiYWNrdXBTaWdTdGF0dXMiLCJ1c2FibGUiLCJfYm9vdHN0cmFwU2VjcmV0U3RvcmFnZSIsIl9yZXN0b3JlQmFja3VwIiwic3VjY2Vzc2Z1bCIsImNvcGllZCIsImJsb2IiLCJCbG9iIiwiX3JlY292ZXJ5S2V5IiwiZW5jb2RlZFByaXZhdGVLZXkiLCJ0eXBlIiwiRmlsZVNhdmVyIiwic2F2ZUFzIiwiZG93bmxvYWRlZCIsIm1ha2VSZXF1ZXN0IiwiY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkiLCJhY2NvdW50UGFzc3dvcmQiLCJpZGVudGlmaWVyIiwidXNlciIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFVzZXJJZCIsInBhc3N3b3JkIiwiSW50ZXJhY3RpdmVBdXRoRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZGlhbG9nQWVzdGhldGljcyIsIlNTT0F1dGhFbnRyeSIsIlBIQVNFX1BSRUFVVEgiLCJ0aXRsZSIsImJvZHkiLCJjb250aW51ZVRleHQiLCJjb250aW51ZUtpbmQiLCJQSEFTRV9QT1NUQVVUSCIsImZpbmlzaGVkIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwibWF0cml4Q2xpZW50IiwiYWVzdGhldGljc0ZvclN0YWdlUGhhc2VzIiwiTE9HSU5fVFlQRSIsIlVOU1RBQkxFX0xPR0lOX1RZUEUiLCJjb25maXJtZWQiLCJFcnJvciIsImVycm9yIiwiY2xpIiwiZm9yY2UiLCJjb25zb2xlIiwibG9nIiwiYm9vdHN0cmFwU2VjcmV0U3RvcmFnZSIsImF1dGhVcGxvYWREZXZpY2VTaWduaW5nS2V5cyIsIl9kb0Jvb3RzdHJhcFVJQXV0aCIsImNyZWF0ZVNlY3JldFN0b3JhZ2VLZXkiLCJzZXR1cE5ld0tleUJhY2t1cCIsInNldHVwTmV3U2VjcmV0U3RvcmFnZSIsImJhY2t1cEluZm8iLCJkZWxldGVLZXlCYWNrdXBWZXJzaW9uIiwidmVyc2lvbiIsImtleUJhY2t1cEluZm8iLCJnZXRLZXlCYWNrdXBQYXNzcGhyYXNlIiwiX2JhY2t1cEtleSIsImh0dHBTdGF0dXMiLCJkYXRhIiwiZmxvd3MiLCJhY2NvdW50UGFzc3dvcmRDb3JyZWN0Iiwib25GaW5pc2hlZCIsImtleUNhbGxiYWNrIiwiayIsIlJlc3RvcmVLZXlCYWNrdXBEaWFsb2ciLCJzaG93U3VtbWFyeSIsImNyZWF0ZVJlY292ZXJ5S2V5RnJvbVBhc3NwaHJhc2UiLCJfcGFzc3BocmFzZUZpZWxkIiwiY3VycmVudCIsInZhbGlkYXRlIiwiYWxsb3dFbXB0eSIsInZhbGlkIiwiZm9jdXMiLCJmb2N1c2VkIiwicGFzc1BocmFzZSIsInBhc3NQaHJhc2VDb25maXJtIiwicGFzc1BocmFzZVZhbGlkIiwicmVzdWx0IiwidGFyZ2V0IiwidmFsdWUiLCJfcXVlcnlLZXlVcGxvYWRBdXRoIiwib24iLCJfb25LZXlCYWNrdXBTdGF0dXNDaGFuZ2UiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0S2V5QmFja3VwVmVyc2lvbiIsImlzQ3J5cHRvRW5hYmxlZCIsImlzS2V5QmFja3VwVHJ1c3RlZCIsInVwbG9hZERldmljZVNpZ25pbmdLZXlzIiwic29tZSIsImYiLCJzdGFnZXMiLCJsZW5ndGgiLCJfcmVuZGVyUGhhc2VNaWdyYXRlIiwiRGlhbG9nQnV0dG9ucyIsIkZpZWxkIiwiYXV0aFByb21wdCIsIm5leHRDYXB0aW9uIiwiX29uQWNjb3VudFBhc3N3b3JkQ2hhbmdlIiwiX29uTWlncmF0ZUZvcm1TdWJtaXQiLCJfb25Ta2lwU2V0dXBDbGljayIsIl9yZW5kZXJQaGFzZVBhc3NQaHJhc2UiLCJBY2Nlc3NpYmxlQnV0dG9uIiwiTGFiZWxsZWRUb2dnbGVTd2l0Y2giLCJfb25QYXNzUGhyYXNlTmV4dENsaWNrIiwiX29uUGFzc1BocmFzZUNoYW5nZSIsIl9vblBhc3NQaHJhc2VWYWxpZGF0ZSIsIl9vblVzZUtleUJhY2t1cENoYW5nZSIsIl9vblNraXBQYXNzUGhyYXNlQ2xpY2siLCJfcmVuZGVyUGhhc2VQYXNzUGhyYXNlQ29uZmlybSIsIm1hdGNoVGV4dCIsInN0YXJ0c1dpdGgiLCJwYXNzUGhyYXNlTWF0Y2giLCJfb25TZXRBZ2FpbkNsaWNrIiwiX29uUGFzc1BocmFzZUNvbmZpcm1OZXh0Q2xpY2siLCJfb25QYXNzUGhyYXNlQ29uZmlybUNoYW5nZSIsIl9yZW5kZXJQaGFzZVNob3dLZXkiLCJfY29sbGVjdFJlY292ZXJ5S2V5Tm9kZSIsIl9vbkNvcHlDbGljayIsIl9vbkRvd25sb2FkQ2xpY2siLCJfcmVuZGVyUGhhc2VLZWVwSXRTYWZlIiwiaW50cm9UZXh0IiwiYiIsInMiLCJfb25LZWVwSXRTYWZlQmFja0NsaWNrIiwiX3JlbmRlckJ1c3lQaGFzZSIsIlNwaW5uZXIiLCJfcmVuZGVyUGhhc2VMb2FkRXJyb3IiLCJfb25Mb2FkUmV0cnlDbGljayIsIl9vbkNhbmNlbCIsIl9yZW5kZXJQaGFzZURvbmUiLCJfb25Eb25lIiwiX3JlbmRlclBoYXNlU2tpcENvbmZpcm0iLCJfb25TZXRVcENsaWNrIiwiX3RpdGxlRm9yUGhhc2UiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiY29udGVudCIsImhlYWRlckltYWdlIiwicmVxdWlyZSIsImhhc0NhbmNlbCIsImluY2x1ZGVzIiwiUHJvcFR5cGVzIiwiYm9vbCIsInN0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkEsTUFBTUEsYUFBYSxHQUFHLENBQXRCO0FBQ0EsTUFBTUMsZUFBZSxHQUFHLENBQXhCO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQXRCO0FBQ0EsTUFBTUMsZ0JBQWdCLEdBQUcsQ0FBekI7QUFDQSxNQUFNQyx3QkFBd0IsR0FBRyxDQUFqQztBQUNBLE1BQU1DLGFBQWEsR0FBRyxDQUF0QjtBQUNBLE1BQU1DLGdCQUFnQixHQUFHLENBQXpCO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQXRCO0FBQ0EsTUFBTUMsVUFBVSxHQUFHLENBQW5CO0FBQ0EsTUFBTUMsa0JBQWtCLEdBQUcsQ0FBM0I7QUFFQSxNQUFNQyxrQkFBa0IsR0FBRyxDQUEzQixDLENBQThCOztBQUU5Qjs7Ozs7QUFJZSxNQUFNQyx5QkFBTixTQUF3Q0MsZUFBTUMsYUFBOUMsQ0FBNEQ7QUFZdkVDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLG9FQTRGUSxNQUFNO0FBQzdCLFVBQUksS0FBS0MsS0FBTCxDQUFXQyxLQUFYLEtBQXFCZixhQUF6QixFQUF3QyxLQUFLZ0IsZ0JBQUw7QUFDM0MsS0E5RmtCO0FBQUEsbUVBZ0dRQyxDQUFELElBQU87QUFDN0IsV0FBS0MsZ0JBQUwsR0FBd0JELENBQXhCO0FBQ0gsS0FsR2tCO0FBQUEsaUVBb0dNRSxPQUFELElBQWE7QUFDakMsV0FBS0MsUUFBTCxDQUFjO0FBQ1ZDLFFB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O0FBS0ksTUFBQSxVQUFVLEVBQUU7QUFMaEIsb0JBT0EsMENBQ0txSixPQURMLENBUEEsQ0FESjtBQWFIOztBQXJ2QnNFOzs7OEJBQXREM0oseUIsZUFDRTtBQUNmOEosRUFBQUEsU0FBUyxFQUFFRSxtQkFBVUMsSUFETjtBQUVmbEksRUFBQUEsZUFBZSxFQUFFaUksbUJBQVVFLE1BRlo7QUFHZnRHLEVBQUFBLEtBQUssRUFBRW9HLG1CQUFVQztBQUhGLEM7OEJBREZqSyx5QixrQkFPSztBQUNsQjhKLEVBQUFBLFNBQVMsRUFBRSxJQURPO0FBRWxCbEcsRUFBQUEsS0FBSyxFQUFFO0FBRlcsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgRmlsZVNhdmVyIGZyb20gJ2ZpbGUtc2F2ZXInO1xuaW1wb3J0IHtfdCwgX3RkfSBmcm9tICcuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7IHByb21wdEZvckJhY2t1cFBhc3NwaHJhc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9Dcm9zc1NpZ25pbmdNYW5hZ2VyJztcbmltcG9ydCB7Y29weU5vZGV9IGZyb20gXCIuLi8uLi8uLi8uLi91dGlscy9zdHJpbmdzXCI7XG5pbXBvcnQge1NTT0F1dGhFbnRyeX0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbXBvbmVudHMvdmlld3MvYXV0aC9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNcIjtcbmltcG9ydCBQYXNzcGhyYXNlRmllbGQgZnJvbSBcIi4uLy4uLy4uLy4uL2NvbXBvbmVudHMvdmlld3MvYXV0aC9QYXNzcGhyYXNlRmllbGRcIjtcblxuY29uc3QgUEhBU0VfTE9BRElORyA9IDA7XG5jb25zdCBQSEFTRV9MT0FERVJST1IgPSAxO1xuY29uc3QgUEhBU0VfTUlHUkFURSA9IDI7XG5jb25zdCBQSEFTRV9QQVNTUEhSQVNFID0gMztcbmNvbnN0IFBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTSA9IDQ7XG5jb25zdCBQSEFTRV9TSE9XS0VZID0gNTtcbmNvbnN0IFBIQVNFX0tFRVBJVFNBRkUgPSA2O1xuY29uc3QgUEhBU0VfU1RPUklORyA9IDc7XG5jb25zdCBQSEFTRV9ET05FID0gODtcbmNvbnN0IFBIQVNFX0NPTkZJUk1fU0tJUCA9IDk7XG5cbmNvbnN0IFBBU1NXT1JEX01JTl9TQ09SRSA9IDQ7IC8vIFNvIHNlY3VyZSwgbWFueSBjaGFyYWN0ZXJzLCBtdWNoIGNvbXBsZXgsIHdvdywgZXRjLCBldGMuXG5cbi8qXG4gKiBXYWxrcyB0aGUgdXNlciB0aHJvdWdoIHRoZSBwcm9jZXNzIG9mIGNyZWF0aW5nIGEgcGFzc3BocmFzZSB0byBndWFyZCBTZWN1cmVcbiAqIFNlY3JldCBTdG9yYWdlIGluIGFjY291bnQgZGF0YS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlU2VjcmV0U3RvcmFnZURpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGhhc0NhbmNlbDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIGFjY291bnRQYXNzd29yZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgZm9yY2U6IFByb3BUeXBlcy5ib29sLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBoYXNDYW5jZWw6IHRydWUsXG4gICAgICAgIGZvcmNlOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuX3JlY292ZXJ5S2V5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVjb3ZlcnlLZXlOb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYmFja3VwS2V5ID0gbnVsbDtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX0xPQURJTkcsXG4gICAgICAgICAgICBwYXNzUGhyYXNlOiAnJyxcbiAgICAgICAgICAgIHBhc3NQaHJhc2VWYWxpZDogZmFsc2UsXG4gICAgICAgICAgICBwYXNzUGhyYXNlQ29uZmlybTogJycsXG4gICAgICAgICAgICBjb3BpZWQ6IGZhbHNlLFxuICAgICAgICAgICAgZG93bmxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBiYWNrdXBJbmZvOiBudWxsLFxuICAgICAgICAgICAgYmFja3VwU2lnU3RhdHVzOiBudWxsLFxuICAgICAgICAgICAgLy8gZG9lcyB0aGUgc2VydmVyIG9mZmVyIGEgVUkgYXV0aCBmbG93IHdpdGgganVzdCBtLmxvZ2luLnBhc3N3b3JkXG4gICAgICAgICAgICAvLyBmb3IgL2tleXMvZGV2aWNlX3NpZ25pbmcvdXBsb2FkP1xuICAgICAgICAgICAgY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHk6IG51bGwsXG4gICAgICAgICAgICBhY2NvdW50UGFzc3dvcmQ6IHByb3BzLmFjY291bnRQYXNzd29yZCB8fCBcIlwiLFxuICAgICAgICAgICAgYWNjb3VudFBhc3N3b3JkQ29ycmVjdDogbnVsbCxcbiAgICAgICAgICAgIC8vIHN0YXR1cyBvZiB0aGUga2V5IGJhY2t1cCB0b2dnbGUgc3dpdGNoXG4gICAgICAgICAgICB1c2VLZXlCYWNrdXA6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fcGFzc3BocmFzZUZpZWxkID0gY3JlYXRlUmVmKCk7XG5cbiAgICAgICAgdGhpcy5fZmV0Y2hCYWNrdXBJbmZvKCk7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmFjY291bnRQYXNzd29yZCkge1xuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBhY2NvdW50IHBhc3N3b3JkIGluIG1lbW9yeSwgbGV0J3Mgc2ltcGxpZnkgYW5kXG4gICAgICAgICAgICAvLyBhc3N1bWUgaXQgbWVhbnMgcGFzc3dvcmQgYXV0aCBpcyBhbHNvIHN1cHBvcnRlZCBmb3IgZGV2aWNlXG4gICAgICAgICAgICAvLyBzaWduaW5nIGtleSB1cGxvYWQgYXMgd2VsbC4gVGhpcyBhdm9pZHMgaGl0dGluZyB0aGUgc2VydmVyIHRvXG4gICAgICAgICAgICAvLyB0ZXN0IGF1dGggZmxvd3MsIHdoaWNoIG1heSBiZSBzbG93IHVuZGVyIGhpZ2ggbG9hZC5cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcXVlcnlLZXlVcGxvYWRBdXRoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oJ2NyeXB0by5rZXlCYWNrdXBTdGF0dXMnLCB0aGlzLl9vbktleUJhY2t1cFN0YXR1c0NoYW5nZSk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignY3J5cHRvLmtleUJhY2t1cFN0YXR1cycsIHRoaXMuX29uS2V5QmFja3VwU3RhdHVzQ2hhbmdlKTtcbiAgICB9XG5cbiAgICBhc3luYyBfZmV0Y2hCYWNrdXBJbmZvKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYmFja3VwSW5mbyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRLZXlCYWNrdXBWZXJzaW9uKCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBTaWdTdGF0dXMgPSAoXG4gICAgICAgICAgICAgICAgLy8gd2UgbWF5IG5vdCBoYXZlIHN0YXJ0ZWQgY3J5cHRvIHlldCwgaW4gd2hpY2ggY2FzZSB3ZSBkZWZpbml0ZWx5IGRvbid0IHRydXN0IHRoZSBiYWNrdXBcbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNDcnlwdG9FbmFibGVkKCkgJiYgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzS2V5QmFja3VwVHJ1c3RlZChiYWNrdXBJbmZvKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgeyBmb3JjZSB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgICAgIGNvbnN0IHBoYXNlID0gKGJhY2t1cEluZm8gJiYgIWZvcmNlKSA/IFBIQVNFX01JR1JBVEUgOiBQSEFTRV9QQVNTUEhSQVNFO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBwaGFzZSxcbiAgICAgICAgICAgICAgICBiYWNrdXBJbmZvLFxuICAgICAgICAgICAgICAgIGJhY2t1cFNpZ1N0YXR1cyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGJhY2t1cEluZm8sXG4gICAgICAgICAgICAgICAgYmFja3VwU2lnU3RhdHVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFBIQVNFX0xPQURFUlJPUn0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgX3F1ZXJ5S2V5VXBsb2FkQXV0aCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS51cGxvYWREZXZpY2VTaWduaW5nS2V5cyhudWxsLCB7fSk7XG4gICAgICAgICAgICAvLyBXZSBzaG91bGQgbmV2ZXIgZ2V0IGhlcmU6IHRoZSBzZXJ2ZXIgc2hvdWxkIGFsd2F5cyByZXF1aXJlXG4gICAgICAgICAgICAvLyBVSSBhdXRoIHRvIHVwbG9hZCBkZXZpY2Ugc2lnbmluZyBrZXlzLiBJZiB3ZSBkbywgd2UgdXBsb2FkXG4gICAgICAgICAgICAvLyBubyBrZXlzIHdoaWNoIHdvdWxkIGJlIGEgbm8tb3AuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwbG9hZERldmljZVNpZ25pbmdLZXlzIHVuZXhwZWN0ZWRseSBzdWNjZWVkZWQgd2l0aG91dCBVSSBhdXRoIVwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICghZXJyb3IuZGF0YSB8fCAhZXJyb3IuZGF0YS5mbG93cykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidXBsb2FkRGV2aWNlU2lnbmluZ0tleXMgYWR2ZXJ0aXNlZCBubyBmbG93cyFcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkgPSBlcnJvci5kYXRhLmZsb3dzLnNvbWUoZiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYuc3RhZ2VzLmxlbmd0aCA9PT0gMSAmJiBmLnN0YWdlc1swXSA9PT0gJ20ubG9naW4ucGFzc3dvcmQnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBjYW5VcGxvYWRLZXlzV2l0aFBhc3N3b3JkT25seSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uS2V5QmFja3VwU3RhdHVzQ2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5waGFzZSA9PT0gUEhBU0VfTUlHUkFURSkgdGhpcy5fZmV0Y2hCYWNrdXBJbmZvKCk7XG4gICAgfVxuXG4gICAgX2NvbGxlY3RSZWNvdmVyeUtleU5vZGUgPSAobikgPT4ge1xuICAgICAgICB0aGlzLl9yZWNvdmVyeUtleU5vZGUgPSBuO1xuICAgIH1cblxuICAgIF9vblVzZUtleUJhY2t1cENoYW5nZSA9IChlbmFibGVkKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdXNlS2V5QmFja3VwOiBlbmFibGVkLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfb25NaWdyYXRlRm9ybVN1Ym1pdCA9IChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwU2lnU3RhdHVzLnVzYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5fYm9vdHN0cmFwU2VjcmV0U3RvcmFnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVzdG9yZUJhY2t1cCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQ29weUNsaWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWNjZXNzZnVsID0gY29weU5vZGUodGhpcy5fcmVjb3ZlcnlLZXlOb2RlKTtcbiAgICAgICAgaWYgKHN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGNvcGllZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwaGFzZTogUEhBU0VfS0VFUElUU0FGRSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uRG93bmxvYWRDbGljayA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLl9yZWNvdmVyeUtleS5lbmNvZGVkUHJpdmF0ZUtleV0sIHtcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0L3BsYWluO2NoYXJzZXQ9dXMtYXNjaWknLFxuICAgICAgICB9KTtcbiAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhibG9iLCAncmVjb3Zlcnkta2V5LnR4dCcpO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZG93bmxvYWRlZDogdHJ1ZSxcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9LRUVQSVRTQUZFLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfZG9Cb290c3RyYXBVSUF1dGggPSBhc3luYyAobWFrZVJlcXVlc3QpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkgJiYgdGhpcy5zdGF0ZS5hY2NvdW50UGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGF3YWl0IG1ha2VSZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbS5sb2dpbi5wYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllcjoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbS5pZC51c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgdXNlcjogTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZCgpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvc3luYXBzZS9pc3N1ZXMvNTY2NVxuICAgICAgICAgICAgICAgIHVzZXI6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogdGhpcy5zdGF0ZS5hY2NvdW50UGFzc3dvcmQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IEludGVyYWN0aXZlQXV0aERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkludGVyYWN0aXZlQXV0aERpYWxvZ1wiKTtcblxuICAgICAgICAgICAgY29uc3QgZGlhbG9nQWVzdGhldGljcyA9IHtcbiAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVzZSBTaW5nbGUgU2lnbiBPbiB0byBjb250aW51ZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogX3QoXCJUbyBjb250aW51ZSwgdXNlIFNpbmdsZSBTaWduIE9uIHRvIHByb3ZlIHlvdXIgaWRlbnRpdHkuXCIpLFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVRleHQ6IF90KFwiU2luZ2xlIFNpZ24gT25cIiksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlS2luZDogXCJwcmltYXJ5XCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BPU1RBVVRIXToge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJDb25maXJtIGVuY3J5cHRpb24gc2V0dXBcIiksXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiQ2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byBjb25maXJtIHNldHRpbmcgdXAgZW5jcnlwdGlvbi5cIiksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlVGV4dDogX3QoXCJDb25maXJtXCIpLFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZUtpbmQ6IFwicHJpbWFyeVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCB7IGZpbmlzaGVkIH0gPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgICAgICdDcm9zcy1zaWduaW5nIGtleXMgZGlhbG9nJywgJycsIEludGVyYWN0aXZlQXV0aERpYWxvZyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlNldHRpbmcgdXAga2V5c1wiKSxcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnRQZWcuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgIG1ha2VSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICBhZXN0aGV0aWNzRm9yU3RhZ2VQaGFzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtTU09BdXRoRW50cnkuTE9HSU5fVFlQRV06IGRpYWxvZ0Flc3RoZXRpY3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlVOU1RBQkxFX0xPR0lOX1RZUEVdOiBkaWFsb2dBZXN0aGV0aWNzLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgW2NvbmZpcm1lZF0gPSBhd2FpdCBmaW5pc2hlZDtcbiAgICAgICAgICAgIGlmICghY29uZmlybWVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3Jvc3Mtc2lnbmluZyBrZXkgdXBsb2FkIGF1dGggY2FuY2VsZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYm9vdHN0cmFwU2VjcmV0U3RvcmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfU1RPUklORyxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgY29uc3QgeyBmb3JjZSB9ID0gdGhpcy5wcm9wcztcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGZvcmNlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGb3JjaW5nIHNlY3JldCBzdG9yYWdlIHJlc2V0XCIpOyAvLyBsb2cgc29tZXRoaW5nIHNvIHdlIGNhbiBkZWJ1ZyB0aGlzIGxhdGVyXG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpLmJvb3RzdHJhcFNlY3JldFN0b3JhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBhdXRoVXBsb2FkRGV2aWNlU2lnbmluZ0tleXM6IHRoaXMuX2RvQm9vdHN0cmFwVUlBdXRoLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVTZWNyZXRTdG9yYWdlS2V5OiBhc3luYyAoKSA9PiB0aGlzLl9yZWNvdmVyeUtleSxcbiAgICAgICAgICAgICAgICAgICAgc2V0dXBOZXdLZXlCYWNrdXA6IHRoaXMuc3RhdGUudXNlS2V5QmFja3VwLFxuICAgICAgICAgICAgICAgICAgICBzZXR1cE5ld1NlY3JldFN0b3JhZ2U6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnVzZUtleUJhY2t1cCAmJiB0aGlzLnN0YXRlLmJhY2t1cEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVzZXIgaXMgcmVzZXR0aW5nIHRoZWlyIGNyb3NzLXNpZ25pbmcga2V5cyBhbmQgZG9lc24ndCB3YW50XG4gICAgICAgICAgICAgICAgICAgIC8vIGtleSBiYWNrdXAgKGJ1dCBoYWQgaXQgZW5hYmxlZCBiZWZvcmUpLCBkZWxldGUgdGhlIGtleSBiYWNrdXAgYXMgaXQnc1xuICAgICAgICAgICAgICAgICAgICAvLyBubyBsb25nZXIgdmFsaWQuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRGVsZXRpbmcgaW52YWxpZCBrZXkgYmFja3VwIChzZWNyZXRzIGhhdmUgYmVlbiByZXNldDsga2V5IGJhY2t1cCBub3QgcmVxdWVzdGVkKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpLmRlbGV0ZUtleUJhY2t1cFZlcnNpb24odGhpcy5zdGF0ZS5iYWNrdXBJbmZvLnZlcnNpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpLmJvb3RzdHJhcFNlY3JldFN0b3JhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBhdXRoVXBsb2FkRGV2aWNlU2lnbmluZ0tleXM6IHRoaXMuX2RvQm9vdHN0cmFwVUlBdXRoLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVTZWNyZXRTdG9yYWdlS2V5OiBhc3luYyAoKSA9PiB0aGlzLl9yZWNvdmVyeUtleSxcbiAgICAgICAgICAgICAgICAgICAga2V5QmFja3VwSW5mbzogdGhpcy5zdGF0ZS5iYWNrdXBJbmZvLFxuICAgICAgICAgICAgICAgICAgICBzZXR1cE5ld0tleUJhY2t1cDogIXRoaXMuc3RhdGUuYmFja3VwSW5mbyAmJiB0aGlzLnN0YXRlLnVzZUtleUJhY2t1cCxcbiAgICAgICAgICAgICAgICAgICAgZ2V0S2V5QmFja3VwUGFzc3BocmFzZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbWF5IGFscmVhZHkgaGF2ZSB0aGUgYmFja3VwIGtleSBpZiB3ZSBlYXJsaWVyIHdlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRocm91Z2ggdGhlIHJlc3RvcmUgYmFja3VwIHBhdGgsIHNvIHBhc3MgaXQgYWxvbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJhdGhlciB0aGFuIHByb21wdGluZyBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9iYWNrdXBLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fYmFja3VwS2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21wdEZvckJhY2t1cFBhc3NwaHJhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9ET05FLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNhblVwbG9hZEtleXNXaXRoUGFzc3dvcmRPbmx5ICYmIGUuaHR0cFN0YXR1cyA9PT0gNDAxICYmIGUuZGF0YS5mbG93cykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50UGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50UGFzc3dvcmRDb3JyZWN0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IFBIQVNFX01JR1JBVEUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBlcnJvcjogZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBib290c3RyYXBwaW5nIHNlY3JldCBzdG9yYWdlXCIsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQ2FuY2VsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH1cblxuICAgIF9vbkRvbmUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9XG5cbiAgICBfcmVzdG9yZUJhY2t1cCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gSXQncyBwb3NzaWJsZSB3ZSdsbCBuZWVkIHRoZSBiYWNrdXAga2V5IGxhdGVyIG9uIGZvciBib290c3RyYXBwaW5nLFxuICAgICAgICAvLyBzbyBsZXQncyBzdGFzaCBpdCBoZXJlLCByYXRoZXIgdGhhbiBwcm9tcHRpbmcgZm9yIGl0IHR3aWNlLlxuICAgICAgICBjb25zdCBrZXlDYWxsYmFjayA9IGsgPT4gdGhpcy5fYmFja3VwS2V5ID0gaztcblxuICAgICAgICBjb25zdCBSZXN0b3JlS2V5QmFja3VwRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5rZXliYWNrdXAuUmVzdG9yZUtleUJhY2t1cERpYWxvZycpO1xuICAgICAgICBjb25zdCB7IGZpbmlzaGVkIH0gPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgJ1Jlc3RvcmUgQmFja3VwJywgJycsIFJlc3RvcmVLZXlCYWNrdXBEaWFsb2csXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2hvd1N1bW1hcnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGtleUNhbGxiYWNrLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bGwsIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIGZhbHNlLFxuICAgICAgICApO1xuXG4gICAgICAgIGF3YWl0IGZpbmlzaGVkO1xuICAgICAgICBjb25zdCB7IGJhY2t1cFNpZ1N0YXR1cyB9ID0gYXdhaXQgdGhpcy5fZmV0Y2hCYWNrdXBJbmZvKCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGJhY2t1cFNpZ1N0YXR1cy51c2FibGUgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuYWNjb3VudFBhc3N3b3JkXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fYm9vdHN0cmFwU2VjcmV0U3RvcmFnZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uTG9hZFJldHJ5Q2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3BoYXNlOiBQSEFTRV9MT0FESU5HfSk7XG4gICAgICAgIHRoaXMuX2ZldGNoQmFja3VwSW5mbygpO1xuICAgIH1cblxuICAgIF9vblNraXBTZXR1cENsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtwaGFzZTogUEhBU0VfQ09ORklSTV9TS0lQfSk7XG4gICAgfVxuXG4gICAgX29uU2V0VXBDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFBIQVNFX1BBU1NQSFJBU0V9KTtcbiAgICB9XG5cbiAgICBfb25Ta2lwUGFzc1BocmFzZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLl9yZWNvdmVyeUtleSA9XG4gICAgICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlYXRlUmVjb3ZlcnlLZXlGcm9tUGFzc3BocmFzZSgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGNvcGllZDogZmFsc2UsXG4gICAgICAgICAgICBkb3dubG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9TSE9XS0VZLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfb25QYXNzUGhyYXNlTmV4dENsaWNrID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoIXRoaXMuX3Bhc3NwaHJhc2VGaWVsZC5jdXJyZW50KSByZXR1cm47IC8vIHVubW91bnRpbmdcblxuICAgICAgICBhd2FpdCB0aGlzLl9wYXNzcGhyYXNlRmllbGQuY3VycmVudC52YWxpZGF0ZSh7IGFsbG93RW1wdHk6IGZhbHNlIH0pO1xuICAgICAgICBpZiAoIXRoaXMuX3Bhc3NwaHJhc2VGaWVsZC5jdXJyZW50LnN0YXRlLnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXNzcGhyYXNlRmllbGQuY3VycmVudC5mb2N1cygpO1xuICAgICAgICAgICAgdGhpcy5fcGFzc3BocmFzZUZpZWxkLmN1cnJlbnQudmFsaWRhdGUoeyBhbGxvd0VtcHR5OiBmYWxzZSwgZm9jdXNlZDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3BoYXNlOiBQSEFTRV9QQVNTUEhSQVNFX0NPTkZJUk19KTtcbiAgICB9O1xuXG4gICAgX29uUGFzc1BocmFzZUNvbmZpcm1OZXh0Q2xpY2sgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGFzc1BocmFzZSAhPT0gdGhpcy5zdGF0ZS5wYXNzUGhyYXNlQ29uZmlybSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuX3JlY292ZXJ5S2V5ID1cbiAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVhdGVSZWNvdmVyeUtleUZyb21QYXNzcGhyYXNlKHRoaXMuc3RhdGUucGFzc1BocmFzZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgY29waWVkOiBmYWxzZSxcbiAgICAgICAgICAgIGRvd25sb2FkZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NIT1dLRVksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblNldEFnYWluQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGFzc1BocmFzZTogJycsXG4gICAgICAgICAgICBwYXNzUGhyYXNlVmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGFzc1BocmFzZUNvbmZpcm06ICcnLFxuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1BBU1NQSFJBU0UsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbktlZXBJdFNhZmVCYWNrQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NIT1dLRVksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblBhc3NQaHJhc2VWYWxpZGF0ZSA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwYXNzUGhyYXNlVmFsaWQ6IHJlc3VsdC52YWxpZCxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vblBhc3NQaHJhc2VDaGFuZ2UgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhc3NQaHJhc2U6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfb25QYXNzUGhyYXNlQ29uZmlybUNoYW5nZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGFzc1BocmFzZUNvbmZpcm06IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfb25BY2NvdW50UGFzc3dvcmRDaGFuZ2UgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGFjY291bnRQYXNzd29yZDogZS50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZU1pZ3JhdGUoKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgYSB0ZW1wb3Jhcnkgc2NyZWVuIHNvIHBlb3BsZSB3aG8gaGF2ZSB0aGUgbGFicyBmbGFnIHR1cm5lZCBvbiBhbmRcbiAgICAgICAgLy8gY2xpY2sgdGhlIGJ1dHRvbiBhcmUgYXdhcmUgdGhleSdyZSBtYWtpbmcgYSBjaGFuZ2UgdG8gdGhlaXIgYWNjb3VudC5cbiAgICAgICAgLy8gT25jZSB3ZSdyZSBjb25maWRlbnQgZW5vdWdoIGluIHRoaXMgKGFuZCBpdCdzIHN1cHBvcnRlZCBlbm91Z2gpIHdlIGNhbiBkb1xuICAgICAgICAvLyBpdCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMTY5NlxuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkZpZWxkJyk7XG5cbiAgICAgICAgbGV0IGF1dGhQcm9tcHQ7XG4gICAgICAgIGxldCBuZXh0Q2FwdGlvbiA9IF90KFwiTmV4dFwiKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY2FuVXBsb2FkS2V5c1dpdGhQYXNzd29yZE9ubHkpIHtcbiAgICAgICAgICAgIGF1dGhQcm9tcHQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+e190KFwiRW50ZXIgeW91ciBhY2NvdW50IHBhc3N3b3JkIHRvIGNvbmZpcm0gdGhlIHVwZ3JhZGU6XCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+PEZpZWxkXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIlBhc3N3b3JkXCIpfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5hY2NvdW50UGFzc3dvcmR9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vbkFjY291bnRQYXNzd29yZENoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgZmxhZ0ludmFsaWQ9e3RoaXMuc3RhdGUuYWNjb3VudFBhc3N3b3JkQ29ycmVjdCA9PT0gZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAvPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLmJhY2t1cFNpZ1N0YXR1cy51c2FibGUpIHtcbiAgICAgICAgICAgIGF1dGhQcm9tcHQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+e190KFwiUmVzdG9yZSB5b3VyIGtleSBiYWNrdXAgdG8gdXBncmFkZSB5b3VyIGVuY3J5cHRpb25cIil9PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICBuZXh0Q2FwdGlvbiA9IF90KFwiUmVzdG9yZVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF1dGhQcm9tcHQgPSA8cD5cbiAgICAgICAgICAgICAgICB7X3QoXCJZb3UnbGwgbmVlZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgc2VydmVyIHRvIGNvbmZpcm0gdGhlIHVwZ3JhZGUuXCIpfVxuICAgICAgICAgICAgPC9wPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8Zm9ybSBvblN1Ym1pdD17dGhpcy5fb25NaWdyYXRlRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJVcGdyYWRlIHRoaXMgc2Vzc2lvbiB0byBhbGxvdyBpdCB0byB2ZXJpZnkgb3RoZXIgc2Vzc2lvbnMsIFwiICtcbiAgICAgICAgICAgICAgICBcImdyYW50aW5nIHRoZW0gYWNjZXNzIHRvIGVuY3J5cHRlZCBtZXNzYWdlcyBhbmQgbWFya2luZyB0aGVtIFwiICtcbiAgICAgICAgICAgICAgICBcImFzIHRydXN0ZWQgZm9yIG90aGVyIHVzZXJzLlwiLFxuICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICA8ZGl2PnthdXRoUHJvbXB0fTwvZGl2PlxuICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnNcbiAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtuZXh0Q2FwdGlvbn1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25NaWdyYXRlRm9ybVN1Ym1pdH1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgICAgIHByaW1hcnlEaXNhYmxlZD17dGhpcy5zdGF0ZS5jYW5VcGxvYWRLZXlzV2l0aFBhc3N3b3JkT25seSAmJiAhdGhpcy5zdGF0ZS5hY2NvdW50UGFzc3dvcmR9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5fb25Ta2lwU2V0dXBDbGlja30+XG4gICAgICAgICAgICAgICAgICAgIHtfdCgnU2tpcCcpfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgICAgICA8L2Zvcm0+O1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZVBhc3NQaHJhc2UoKSB7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IExhYmVsbGVkVG9nZ2xlU3dpdGNoID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuTGFiZWxsZWRUb2dnbGVTd2l0Y2gnKTtcblxuICAgICAgICByZXR1cm4gPGZvcm0gb25TdWJtaXQ9e3RoaXMuX29uUGFzc1BocmFzZU5leHRDbGlja30+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJTZXQgYSByZWNvdmVyeSBwYXNzcGhyYXNlIHRvIHNlY3VyZSBlbmNyeXB0ZWQgaW5mb3JtYXRpb24gYW5kIHJlY292ZXIgaXQgaWYgeW91IGxvZyBvdXQuIFwiICtcbiAgICAgICAgICAgICAgICBcIlRoaXMgc2hvdWxkIGJlIGRpZmZlcmVudCB0byB5b3VyIGFjY291bnQgcGFzc3dvcmQ6XCIsXG4gICAgICAgICAgICApfTwvcD5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nX3Bhc3NQaHJhc2VDb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8UGFzc3BocmFzZUZpZWxkXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2dfcGFzc1BocmFzZUZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUGFzc1BocmFzZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgbWluU2NvcmU9e1BBU1NXT1JEX01JTl9TQ09SRX1cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc1BocmFzZX1cbiAgICAgICAgICAgICAgICAgICAgb25WYWxpZGF0ZT17dGhpcy5fb25QYXNzUGhyYXNlVmFsaWRhdGV9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkUmVmPXt0aGlzLl9wYXNzcGhyYXNlRmllbGR9XG4gICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190ZChcIkVudGVyIGEgcmVjb3ZlcnkgcGFzc3BocmFzZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgbGFiZWxFbnRlclBhc3N3b3JkPXtfdGQoXCJFbnRlciBhIHJlY292ZXJ5IHBhc3NwaHJhc2VcIil9XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsU3Ryb25nUGFzc3dvcmQ9e190ZChcIkdyZWF0ISBUaGlzIHJlY292ZXJ5IHBhc3NwaHJhc2UgbG9va3Mgc3Ryb25nIGVub3VnaC5cIil9XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsQWxsb3dlZEJ1dFVuc2FmZT17X3RkKFwiR3JlYXQhIFRoaXMgcmVjb3ZlcnkgcGFzc3BocmFzZSBsb29rcyBzdHJvbmcgZW5vdWdoLlwiKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxMYWJlbGxlZFRvZ2dsZVN3aXRjaFxuICAgICAgICAgICAgICAgIGxhYmVsPXsgX3QoXCJCYWNrIHVwIGVuY3J5cHRlZCBtZXNzYWdlIGtleXNcIil9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uVXNlS2V5QmFja3VwQ2hhbmdlfSB2YWx1ZT17dGhpcy5zdGF0ZS51c2VLZXlCYWNrdXB9XG4gICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KCdDb250aW51ZScpfVxuICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vblBhc3NQaHJhc2VOZXh0Q2xpY2t9XG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXRoaXMuc3RhdGUucGFzc1BocmFzZVZhbGlkfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uU2tpcFNldHVwQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImRhbmdlclwiXG4gICAgICAgICAgICAgICAgPntfdChcIlNraXBcIil9PC9idXR0b24+XG4gICAgICAgICAgICA8L0RpYWxvZ0J1dHRvbnM+XG5cbiAgICAgICAgICAgIDxkZXRhaWxzPlxuICAgICAgICAgICAgICAgIDxzdW1tYXJ5PntfdChcIkFkdmFuY2VkXCIpfTwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPSdwcmltYXJ5JyBvbkNsaWNrPXt0aGlzLl9vblNraXBQYXNzUGhyYXNlQ2xpY2t9ID5cbiAgICAgICAgICAgICAgICAgICAge190KFwiU2V0IHVwIHdpdGggYSByZWNvdmVyeSBrZXlcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICA8L2Zvcm0+O1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZVBhc3NQaHJhc2VDb25maXJtKCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkZpZWxkJyk7XG5cbiAgICAgICAgbGV0IG1hdGNoVGV4dDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGFzc1BocmFzZUNvbmZpcm0gPT09IHRoaXMuc3RhdGUucGFzc1BocmFzZSkge1xuICAgICAgICAgICAgbWF0Y2hUZXh0ID0gX3QoXCJUaGF0IG1hdGNoZXMhXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLnBhc3NQaHJhc2Uuc3RhcnRzV2l0aCh0aGlzLnN0YXRlLnBhc3NQaHJhc2VDb25maXJtKSkge1xuICAgICAgICAgICAgLy8gb25seSB0ZWxsIHRoZW0gdGhleSdyZSB3cm9uZyBpZiB0aGV5J3ZlIGFjdHVhbGx5IGdvbmUgd3JvbmcuXG4gICAgICAgICAgICAvLyBTZWN1cml0eSBjb25jaW91cyByZWFkZXJzIHdpbGwgbm90ZSB0aGF0IGlmIHlvdSBsZWZ0IHJpb3Qtd2ViIHVuYXR0ZW5kZWRcbiAgICAgICAgICAgIC8vIG9uIHRoaXMgc2NyZWVuLCB0aGlzIHdvdWxkIG1ha2UgaXQgZWFzeSBmb3IgYSBtYWxpY2lvdXMgcGVyc29uIHRvIGd1ZXNzXG4gICAgICAgICAgICAvLyB5b3VyIHBhc3NwaHJhc2Ugb25lIGxldHRlciBhdCBhIHRpbWUsIGJ1dCB0aGV5IGNvdWxkIGdldCB0aGlzIGZhc3RlciBieVxuICAgICAgICAgICAgLy8ganVzdCBvcGVuaW5nIHRoZSBicm93c2VyJ3MgZGV2ZWxvcGVyIHRvb2xzIGFuZCByZWFkaW5nIGl0LlxuICAgICAgICAgICAgLy8gTm90ZSB0aGF0IG5vdCBoYXZpbmcgdHlwZWQgYW55dGhpbmcgYXQgYWxsIHdpbGwgbm90IGhpdCB0aGlzIGNsYXVzZSBhbmRcbiAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaCBzbyBlbXB0eSBib3ggPT09IG5vIGhpbnQuXG4gICAgICAgICAgICBtYXRjaFRleHQgPSBfdChcIlRoYXQgZG9lc24ndCBtYXRjaC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFzc1BocmFzZU1hdGNoID0gbnVsbDtcbiAgICAgICAgaWYgKG1hdGNoVGV4dCkge1xuICAgICAgICAgICAgcGFzc1BocmFzZU1hdGNoID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PnttYXRjaFRleHR9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gZWxlbWVudD1cInNwYW5cIiBjbGFzc05hbWU9XCJteF9saW5rQnV0dG9uXCIgb25DbGljaz17dGhpcy5fb25TZXRBZ2FpbkNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkdvIGJhY2sgdG8gc2V0IGl0IGFnYWluLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIHJldHVybiA8Zm9ybSBvblN1Ym1pdD17dGhpcy5fb25QYXNzUGhyYXNlQ29uZmlybU5leHRDbGlja30+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJFbnRlciB5b3VyIHJlY292ZXJ5IHBhc3NwaHJhc2UgYSBzZWNvbmQgdGltZSB0byBjb25maXJtIGl0LlwiLFxuICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2dfcGFzc1BocmFzZUNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25QYXNzUGhyYXNlQ29uZmlybUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc1BocmFzZUNvbmZpcm19XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2dfcGFzc1BocmFzZUZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiQ29uZmlybSB5b3VyIHJlY292ZXJ5IHBhc3NwaHJhc2VcIil9XG4gICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwibmV3LXBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlU2VjcmV0U3RvcmFnZURpYWxvZ19wYXNzUGhyYXNlTWF0Y2hcIj5cbiAgICAgICAgICAgICAgICAgICAge3Bhc3NQaHJhc2VNYXRjaH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnNcbiAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdCgnQ29udGludWUnKX1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25QYXNzUGhyYXNlQ29uZmlybU5leHRDbGlja31cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLnBhc3NQaHJhc2UgIT09IHRoaXMuc3RhdGUucGFzc1BocmFzZUNvbmZpcm19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25Ta2lwU2V0dXBDbGlja31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZGFuZ2VyXCJcbiAgICAgICAgICAgICAgICA+e190KFwiU2tpcFwiKX08L2J1dHRvbj5cbiAgICAgICAgICAgIDwvRGlhbG9nQnV0dG9ucz5cbiAgICAgICAgPC9mb3JtPjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VTaG93S2V5KCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIllvdXIgcmVjb3Zlcnkga2V5IGlzIGEgc2FmZXR5IG5ldCAtIHlvdSBjYW4gdXNlIGl0IHRvIHJlc3RvcmUgXCIgK1xuICAgICAgICAgICAgICAgIFwiYWNjZXNzIHRvIHlvdXIgZW5jcnlwdGVkIG1lc3NhZ2VzIGlmIHlvdSBmb3JnZXQgeW91ciByZWNvdmVyeSBwYXNzcGhyYXNlLlwiLFxuICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJLZWVwIGEgY29weSBvZiBpdCBzb21ld2hlcmUgc2VjdXJlLCBsaWtlIGEgcGFzc3dvcmQgbWFuYWdlciBvciBldmVuIGEgc2FmZS5cIixcbiAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nX3ByaW1hcnlDb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2dfcmVjb3ZlcnlLZXlIZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiWW91ciByZWNvdmVyeSBrZXlcIil9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nX3JlY292ZXJ5S2V5Q29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlU2VjcmV0U3RvcmFnZURpYWxvZ19yZWNvdmVyeUtleVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNvZGUgcmVmPXt0aGlzLl9jb2xsZWN0UmVjb3ZlcnlLZXlOb2RlfT57dGhpcy5fcmVjb3ZlcnlLZXkuZW5jb2RlZFByaXZhdGVLZXl9PC9jb2RlPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVTZWNyZXRTdG9yYWdlRGlhbG9nX3JlY292ZXJ5S2V5QnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kPSdwcmltYXJ5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0RpYWxvZ19wcmltYXJ5IG14X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2dfcmVjb3ZlcnlLZXlCdXR0b25zX2NvcHlCdG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ29weUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNvcHlcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPSdwcmltYXJ5JyBjbGFzc05hbWU9XCJteF9EaWFsb2dfcHJpbWFyeVwiIG9uQ2xpY2s9e3RoaXMuX29uRG93bmxvYWRDbGlja30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiRG93bmxvYWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VLZWVwSXRTYWZlKCkge1xuICAgICAgICBsZXQgaW50cm9UZXh0O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3BpZWQpIHtcbiAgICAgICAgICAgIGludHJvVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiWW91ciByZWNvdmVyeSBrZXkgaGFzIGJlZW4gPGI+Y29waWVkIHRvIHlvdXIgY2xpcGJvYXJkPC9iPiwgcGFzdGUgaXQgdG86XCIsXG4gICAgICAgICAgICAgICAge30sIHtiOiBzID0+IDxiPntzfTwvYj59LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkZWQpIHtcbiAgICAgICAgICAgIGludHJvVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiWW91ciByZWNvdmVyeSBrZXkgaXMgaW4geW91ciA8Yj5Eb3dubG9hZHM8L2I+IGZvbGRlci5cIixcbiAgICAgICAgICAgICAgICB7fSwge2I6IHMgPT4gPGI+e3N9PC9iPn0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAge2ludHJvVGV4dH1cbiAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICA8bGk+e190KFwiPGI+UHJpbnQgaXQ8L2I+IGFuZCBzdG9yZSBpdCBzb21ld2hlcmUgc2FmZVwiLCB7fSwge2I6IHMgPT4gPGI+e3N9PC9iPn0pfTwvbGk+XG4gICAgICAgICAgICAgICAgPGxpPntfdChcIjxiPlNhdmUgaXQ8L2I+IG9uIGEgVVNCIGtleSBvciBiYWNrdXAgZHJpdmVcIiwge30sIHtiOiBzID0+IDxiPntzfTwvYj59KX08L2xpPlxuICAgICAgICAgICAgICAgIDxsaT57X3QoXCI8Yj5Db3B5IGl0PC9iPiB0byB5b3VyIHBlcnNvbmFsIGNsb3VkIHN0b3JhZ2VcIiwge30sIHtiOiBzID0+IDxiPntzfTwvYj59KX08L2xpPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KFwiQ29udGludWVcIil9XG4gICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX2Jvb3RzdHJhcFNlY3JldFN0b3JhZ2V9XG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX0+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbktlZXBJdFNhZmVCYWNrQ2xpY2t9PntfdChcIkJhY2tcIil9PC9idXR0b24+XG4gICAgICAgICAgICA8L0RpYWxvZ0J1dHRvbnM+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyQnVzeVBoYXNlKCkge1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VMb2FkRXJyb3IoKSB7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgPHA+e190KFwiVW5hYmxlIHRvIHF1ZXJ5IHNlY3JldCBzdG9yYWdlIHN0YXR1c1wiKX08L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17X3QoJ1JldHJ5Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vbkxvYWRSZXRyeUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLl9vbkNhbmNlbH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBfcmVuZGVyUGhhc2VEb25lKCkge1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIllvdSBjYW4gbm93IHZlcmlmeSB5b3VyIG90aGVyIGRldmljZXMsIFwiICtcbiAgICAgICAgICAgICAgICBcImFuZCBvdGhlciB1c2VycyB0byBrZWVwIHlvdXIgY2hhdHMgc2FmZS5cIixcbiAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17X3QoJ09LJyl9XG4gICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uRG9uZX1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cblxuICAgIF9yZW5kZXJQaGFzZVNraXBDb25maXJtKCkge1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICBcIldpdGhvdXQgY29tcGxldGluZyBzZWN1cml0eSBvbiB0aGlzIHNlc3Npb24sIGl0IHdvbuKAmXQgaGF2ZSBcIiArXG4gICAgICAgICAgICAgICAgXCJhY2Nlc3MgdG8gZW5jcnlwdGVkIG1lc3NhZ2VzLlwiLFxuICAgICAgICApfVxuICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17X3QoJ0dvIGJhY2snKX1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25TZXRVcENsaWNrfVxuICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5fb25DYW5jZWx9PntfdCgnU2tpcCcpfTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxuXG4gICAgX3RpdGxlRm9yUGhhc2UocGhhc2UpIHtcbiAgICAgICAgc3dpdGNoIChwaGFzZSkge1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9NSUdSQVRFOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnVXBncmFkZSB5b3VyIGVuY3J5cHRpb24nKTtcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfUEFTU1BIUkFTRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1NldCB1cCBlbmNyeXB0aW9uJyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1BBU1NQSFJBU0VfQ09ORklSTTpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ0NvbmZpcm0gcmVjb3ZlcnkgcGFzc3BocmFzZScpO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9DT05GSVJNX1NLSVA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KCdBcmUgeW91IHN1cmU/Jyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1NIT1dLRVk6XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0tFRVBJVFNBRkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KCdNYWtlIGEgY29weSBvZiB5b3VyIHJlY292ZXJ5IGtleScpO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9TVE9SSU5HOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2V0dGluZyB1cCBrZXlzJyk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0RPTkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KFwiWW91J3JlIGRvbmUhXCIpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcblxuICAgICAgICBsZXQgY29udGVudDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57X3QoXCJVbmFibGUgdG8gc2V0IHVwIHNlY3JldCBzdG9yYWdlXCIpfTwvcD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdSZXRyeScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX2Jvb3RzdHJhcFNlY3JldFN0b3JhZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUucGhhc2UpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX0xPQURJTkc6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJCdXN5UGhhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9MT0FERVJST1I6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZUxvYWRFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX01JR1JBVEU6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZU1pZ3JhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9QQVNTUEhSQVNFOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VQYXNzUGhyYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUEhBU0VfUEFTU1BIUkFTRV9DT05GSVJNOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VQYXNzUGhyYXNlQ29uZmlybSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX1NIT1dLRVk6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZVNob3dLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9LRUVQSVRTQUZFOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyUGhhc2VLZWVwSXRTYWZlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUEhBU0VfU1RPUklORzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuX3JlbmRlckJ1c3lQaGFzZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBIQVNFX0RPTkU6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZURvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQSEFTRV9DT05GSVJNX1NLSVA6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl9yZW5kZXJQaGFzZVNraXBDb25maXJtKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGhlYWRlckltYWdlO1xuICAgICAgICBpZiAodGhpcy5fdGl0bGVGb3JQaGFzZSh0aGlzLnN0YXRlLnBoYXNlKSkge1xuICAgICAgICAgICAgaGVhZGVySW1hZ2UgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vcmVzL2ltZy9lMmUvbm9ybWFsLnN2Z1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9J214X0NyZWF0ZVNlY3JldFN0b3JhZ2VEaWFsb2cnXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXt0aGlzLl90aXRsZUZvclBoYXNlKHRoaXMuc3RhdGUucGhhc2UpfVxuICAgICAgICAgICAgICAgIGhlYWRlckltYWdlPXtoZWFkZXJJbWFnZX1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RoaXMucHJvcHMuaGFzQ2FuY2VsICYmIFtQSEFTRV9QQVNTUEhSQVNFXS5pbmNsdWRlcyh0aGlzLnN0YXRlLnBoYXNlKX1cbiAgICAgICAgICAgICAgICBmaXhlZFdpZHRoPXtmYWxzZX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=