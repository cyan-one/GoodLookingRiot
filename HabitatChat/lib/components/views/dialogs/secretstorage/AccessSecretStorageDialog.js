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

var sdk = _interopRequireWildcard(require("../../../../index"));

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _languageHandler = require("../../../../languageHandler");

var _CrossSigningManager = require("../../../../CrossSigningManager");

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

/*
 * Access Secure Secret Storage by requesting the user's passphrase.
 */
class AccessSecretStorageDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onCancel", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onUseRecoveryKeyClick", () => {
      this.setState({
        forceRecoveryKey: true
      });
    });
    (0, _defineProperty2.default)(this, "_onResetRecoveryClick", () => {
      // Re-enter the access flow, but resetting storage this time around.
      this.props.onFinished(false);
      (0, _CrossSigningManager.accessSecretStorage)(() => {},
      /* forceReset = */
      true);
    });
    (0, _defineProperty2.default)(this, "_onRecoveryKeyChange", e => {
      this.setState({
        recoveryKey: e.target.value,
        recoveryKeyValid: _MatrixClientPeg.MatrixClientPeg.get().isValidRecoveryKey(e.target.value),
        keyMatches: null
      });
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseNext", async e => {
      e.preventDefault();
      if (this.state.passPhrase.length <= 0) return;
      this.setState({
        keyMatches: null
      });
      const input = {
        passphrase: this.state.passPhrase
      };
      const keyMatches = await this.props.checkPrivateKey(input);

      if (keyMatches) {
        this.props.onFinished(input);
      } else {
        this.setState({
          keyMatches
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onRecoveryKeyNext", async e => {
      e.preventDefault();
      if (!this.state.recoveryKeyValid) return;
      this.setState({
        keyMatches: null
      });
      const input = {
        recoveryKey: this.state.recoveryKey
      };
      const keyMatches = await this.props.checkPrivateKey(input);

      if (keyMatches) {
        this.props.onFinished(input);
      } else {
        this.setState({
          keyMatches
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onPassPhraseChange", e => {
      this.setState({
        passPhrase: e.target.value,
        keyMatches: null
      });
    });
    this.state = {
      recoveryKey: "",
      recoveryKeyValid: false,
      forceRecoveryKey: false,
      passPhrase: '',
      keyMatches: null
    };
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const hasPassphrase = this.props.keyInfo && this.props.keyInfo.passphrase && this.props.keyInfo.passphrase.salt && this.props.keyInfo.passphrase.iterations;
    let content;
    let title;

    if (hasPassphrase && !this.state.forceRecoveryKey) {
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
      title = (0, _languageHandler._t)("Enter recovery passphrase");
      let keyStatus;

      if (this.state.keyMatches === false) {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AccessSecretStorageDialog_keyStatus"
        }, "\uD83D\uDC4E ", (0, _languageHandler._t)("Unable to access secret storage. " + "Please verify that you entered the correct recovery passphrase."));
      } else {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AccessSecretStorageDialog_keyStatus"
        });
      }

      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("<b>Warning</b>: You should only do this on a trusted computer.", {}, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Access your secure message history and your cross-signing " + "identity for verifying other sessions by entering your recovery passphrase.")), /*#__PURE__*/_react.default.createElement("form", {
        className: "mx_AccessSecretStorageDialog_primaryContainer",
        onSubmit: this._onPassPhraseNext
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "password",
        className: "mx_AccessSecretStorageDialog_passPhraseInput",
        onChange: this._onPassPhraseChange,
        value: this.state.passPhrase,
        autoFocus: true,
        autoComplete: "new-password"
      }), keyStatus, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Next'),
        onPrimaryButtonClick: this._onPassPhraseNext,
        hasCancel: true,
        onCancel: this._onCancel,
        focus: false,
        primaryDisabled: this.state.passPhrase.length === 0
      })), (0, _languageHandler._t)("If you've forgotten your recovery passphrase you can " + "<button1>use your recovery key</button1> or " + "<button2>set up new recovery options</button2>.", {}, {
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
          className: "mx_AccessSecretStorageDialog_keyStatus"
        });
      } else if (this.state.keyMatches === false) {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AccessSecretStorageDialog_keyStatus"
        }, "\uD83D\uDC4E ", (0, _languageHandler._t)("Unable to access secret storage. " + "Please verify that you entered the correct recovery key."));
      } else if (this.state.recoveryKeyValid) {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AccessSecretStorageDialog_keyStatus"
        }, "\uD83D\uDC4D ", (0, _languageHandler._t)("This looks like a valid recovery key!"));
      } else {
        keyStatus = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AccessSecretStorageDialog_keyStatus"
        }, "\uD83D\uDC4E ", (0, _languageHandler._t)("Not a valid recovery key"));
      }

      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("<b>Warning</b>: You should only do this on a trusted computer.", {}, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Access your secure message history and your cross-signing " + "identity for verifying other sessions by entering your recovery key.")), /*#__PURE__*/_react.default.createElement("form", {
        className: "mx_AccessSecretStorageDialog_primaryContainer",
        onSubmit: this._onRecoveryKeyNext
      }, /*#__PURE__*/_react.default.createElement("input", {
        className: "mx_AccessSecretStorageDialog_recoveryKeyInput",
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
      })), (0, _languageHandler._t)("If you've forgotten your recovery key you can " + "<button>set up new recovery options</button>.", {}, {
        button: s => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          className: "mx_linkButton",
          element: "span",
          onClick: this._onResetRecoveryClick
        }, s)
      }));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_AccessSecretStorageDialog",
      onFinished: this.props.onFinished,
      title: title
    }, /*#__PURE__*/_react.default.createElement("div", null, content));
  }

}

exports.default = AccessSecretStorageDialog;
(0, _defineProperty2.default)(AccessSecretStorageDialog, "propTypes", {
  // { passphrase, pubkey }
  keyInfo: _propTypes.default.object.isRequired,
  // Function from one of { passphrase, recoveryKey } -> boolean
  checkPrivateKey: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mvc2VjcmV0c3RvcmFnZS9BY2Nlc3NTZWNyZXRTdG9yYWdlRGlhbG9nLmpzIl0sIm5hbWVzIjpbIkFjY2Vzc1NlY3JldFN0b3JhZ2VEaWFsb2ciLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwib25GaW5pc2hlZCIsInNldFN0YXRlIiwiZm9yY2VSZWNvdmVyeUtleSIsImUiLCJyZWNvdmVyeUtleSIsInRhcmdldCIsInZhbHVlIiwicmVjb3ZlcnlLZXlWYWxpZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzVmFsaWRSZWNvdmVyeUtleSIsImtleU1hdGNoZXMiLCJwcmV2ZW50RGVmYXVsdCIsInN0YXRlIiwicGFzc1BocmFzZSIsImxlbmd0aCIsImlucHV0IiwicGFzc3BocmFzZSIsImNoZWNrUHJpdmF0ZUtleSIsInJlbmRlciIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJoYXNQYXNzcGhyYXNlIiwia2V5SW5mbyIsInNhbHQiLCJpdGVyYXRpb25zIiwiY29udGVudCIsInRpdGxlIiwiRGlhbG9nQnV0dG9ucyIsIkFjY2Vzc2libGVCdXR0b24iLCJrZXlTdGF0dXMiLCJiIiwic3ViIiwiX29uUGFzc1BocmFzZU5leHQiLCJfb25QYXNzUGhyYXNlQ2hhbmdlIiwiX29uQ2FuY2VsIiwiYnV0dG9uMSIsInMiLCJfb25Vc2VSZWNvdmVyeUtleUNsaWNrIiwiYnV0dG9uMiIsIl9vblJlc2V0UmVjb3ZlcnlDbGljayIsIl9vblJlY292ZXJ5S2V5TmV4dCIsIl9vblJlY292ZXJ5S2V5Q2hhbmdlIiwiYnV0dG9uIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBdkJBOzs7Ozs7Ozs7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QUFVRyxJQUFWLENBQWVEO0FBSmpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTgsIDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5LCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcblxuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgYWNjZXNzU2VjcmV0U3RvcmFnZSB9IGZyb20gJy4uLy4uLy4uLy4uL0Nyb3NzU2lnbmluZ01hbmFnZXInO1xuXG4vKlxuICogQWNjZXNzIFNlY3VyZSBTZWNyZXQgU3RvcmFnZSBieSByZXF1ZXN0aW5nIHRoZSB1c2VyJ3MgcGFzc3BocmFzZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIHsgcGFzc3BocmFzZSwgcHVia2V5IH1cbiAgICAgICAga2V5SW5mbzogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBGdW5jdGlvbiBmcm9tIG9uZSBvZiB7IHBhc3NwaHJhc2UsIHJlY292ZXJ5S2V5IH0gLT4gYm9vbGVhblxuICAgICAgICBjaGVja1ByaXZhdGVLZXk6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgcmVjb3ZlcnlLZXk6IFwiXCIsXG4gICAgICAgICAgICByZWNvdmVyeUtleVZhbGlkOiBmYWxzZSxcbiAgICAgICAgICAgIGZvcmNlUmVjb3ZlcnlLZXk6IGZhbHNlLFxuICAgICAgICAgICAgcGFzc1BocmFzZTogJycsXG4gICAgICAgICAgICBrZXlNYXRjaGVzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vbkNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICB9XG5cbiAgICBfb25Vc2VSZWNvdmVyeUtleUNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZvcmNlUmVjb3ZlcnlLZXk6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblJlc2V0UmVjb3ZlcnlDbGljayA9ICgpID0+IHtcbiAgICAgICAgLy8gUmUtZW50ZXIgdGhlIGFjY2VzcyBmbG93LCBidXQgcmVzZXR0aW5nIHN0b3JhZ2UgdGhpcyB0aW1lIGFyb3VuZC5cbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICAgICAgYWNjZXNzU2VjcmV0U3RvcmFnZSgoKSA9PiB7fSwgLyogZm9yY2VSZXNldCA9ICovIHRydWUpO1xuICAgIH1cblxuICAgIF9vblJlY292ZXJ5S2V5Q2hhbmdlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICByZWNvdmVyeUtleTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgICAgICByZWNvdmVyeUtleVZhbGlkOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNWYWxpZFJlY292ZXJ5S2V5KGUudGFyZ2V0LnZhbHVlKSxcbiAgICAgICAgICAgIGtleU1hdGNoZXM6IG51bGwsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblBhc3NQaHJhc2VOZXh0ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnBhc3NQaHJhc2UubGVuZ3RoIDw9IDApIHJldHVybjtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHsga2V5TWF0Y2hlczogbnVsbCB9KTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSB7IHBhc3NwaHJhc2U6IHRoaXMuc3RhdGUucGFzc1BocmFzZSB9O1xuICAgICAgICBjb25zdCBrZXlNYXRjaGVzID0gYXdhaXQgdGhpcy5wcm9wcy5jaGVja1ByaXZhdGVLZXkoaW5wdXQpO1xuICAgICAgICBpZiAoa2V5TWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBrZXlNYXRjaGVzIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUmVjb3ZlcnlLZXlOZXh0ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yZWNvdmVyeUtleVZhbGlkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGtleU1hdGNoZXM6IG51bGwgfSk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0geyByZWNvdmVyeUtleTogdGhpcy5zdGF0ZS5yZWNvdmVyeUtleSB9O1xuICAgICAgICBjb25zdCBrZXlNYXRjaGVzID0gYXdhaXQgdGhpcy5wcm9wcy5jaGVja1ByaXZhdGVLZXkoaW5wdXQpO1xuICAgICAgICBpZiAoa2V5TWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBrZXlNYXRjaGVzIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUGFzc1BocmFzZUNoYW5nZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGFzc1BocmFzZTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgICAgICBrZXlNYXRjaGVzOiBudWxsLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcblxuICAgICAgICBjb25zdCBoYXNQYXNzcGhyYXNlID0gKFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5rZXlJbmZvICYmXG4gICAgICAgICAgICB0aGlzLnByb3BzLmtleUluZm8ucGFzc3BocmFzZSAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5rZXlJbmZvLnBhc3NwaHJhc2Uuc2FsdCAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5rZXlJbmZvLnBhc3NwaHJhc2UuaXRlcmF0aW9uc1xuICAgICAgICApO1xuXG4gICAgICAgIGxldCBjb250ZW50O1xuICAgICAgICBsZXQgdGl0bGU7XG4gICAgICAgIGlmIChoYXNQYXNzcGhyYXNlICYmICF0aGlzLnN0YXRlLmZvcmNlUmVjb3ZlcnlLZXkpIHtcbiAgICAgICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICAgICAgdGl0bGUgPSBfdChcIkVudGVyIHJlY292ZXJ5IHBhc3NwaHJhc2VcIik7XG5cbiAgICAgICAgICAgIGxldCBrZXlTdGF0dXM7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5rZXlNYXRjaGVzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGtleVN0YXR1cyA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZ19rZXlTdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAge1wiXFx1RDgzRFxcdURDNEUgXCJ9e190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJVbmFibGUgdG8gYWNjZXNzIHNlY3JldCBzdG9yYWdlLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlBsZWFzZSB2ZXJpZnkgdGhhdCB5b3UgZW50ZXJlZCB0aGUgY29ycmVjdCByZWNvdmVyeSBwYXNzcGhyYXNlLlwiLFxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2V5U3RhdHVzID0gPGRpdiBjbGFzc05hbWU9XCJteF9BY2Nlc3NTZWNyZXRTdG9yYWdlRGlhbG9nX2tleVN0YXR1c1wiIC8+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiPGI+V2FybmluZzwvYj46IFlvdSBzaG91bGQgb25seSBkbyB0aGlzIG9uIGEgdHJ1c3RlZCBjb21wdXRlci5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHsgYjogc3ViID0+IDxiPntzdWJ9PC9iPiB9LFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJBY2Nlc3MgeW91ciBzZWN1cmUgbWVzc2FnZSBoaXN0b3J5IGFuZCB5b3VyIGNyb3NzLXNpZ25pbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImlkZW50aXR5IGZvciB2ZXJpZnlpbmcgb3RoZXIgc2Vzc2lvbnMgYnkgZW50ZXJpbmcgeW91ciByZWNvdmVyeSBwYXNzcGhyYXNlLlwiLFxuICAgICAgICAgICAgICAgICl9PC9wPlxuXG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwibXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZ19wcmltYXJ5Q29udGFpbmVyXCIgb25TdWJtaXQ9e3RoaXMuX29uUGFzc1BocmFzZU5leHR9PlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9BY2Nlc3NTZWNyZXRTdG9yYWdlRGlhbG9nX3Bhc3NQaHJhc2VJbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25QYXNzUGhyYXNlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc1BocmFzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm5ldy1wYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIHtrZXlTdGF0dXN9XG4gICAgICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdCgnTmV4dCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uUGFzc1BocmFzZU5leHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1cz17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5RGlzYWJsZWQ9e3RoaXMuc3RhdGUucGFzc1BocmFzZS5sZW5ndGggPT09IDB9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCJJZiB5b3UndmUgZm9yZ290dGVuIHlvdXIgcmVjb3ZlcnkgcGFzc3BocmFzZSB5b3UgY2FuIFwiK1xuICAgICAgICAgICAgICAgICAgICBcIjxidXR0b24xPnVzZSB5b3VyIHJlY292ZXJ5IGtleTwvYnV0dG9uMT4gb3IgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxidXR0b24yPnNldCB1cCBuZXcgcmVjb3Zlcnkgb3B0aW9uczwvYnV0dG9uMj4uXCJcbiAgICAgICAgICAgICAgICAsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbjE6IHMgPT4gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50PVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblVzZVJlY292ZXJ5S2V5Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+LFxuICAgICAgICAgICAgICAgICAgICBidXR0b24yOiBzID0+IDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X2xpbmtCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudD1cInNwYW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25SZXNldFJlY292ZXJ5Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+LFxuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGl0bGUgPSBfdChcIkVudGVyIHJlY292ZXJ5IGtleVwiKTtcbiAgICAgICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgICAgICBsZXQga2V5U3RhdHVzO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVjb3ZlcnlLZXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAga2V5U3RhdHVzID0gPGRpdiBjbGFzc05hbWU9XCJteF9BY2Nlc3NTZWNyZXRTdG9yYWdlRGlhbG9nX2tleVN0YXR1c1wiIC8+O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmtleU1hdGNoZXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAga2V5U3RhdHVzID0gPGRpdiBjbGFzc05hbWU9XCJteF9BY2Nlc3NTZWNyZXRTdG9yYWdlRGlhbG9nX2tleVN0YXR1c1wiPlxuICAgICAgICAgICAgICAgICAgICB7XCJcXHVEODNEXFx1REM0RSBcIn17X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlVuYWJsZSB0byBhY2Nlc3Mgc2VjcmV0IHN0b3JhZ2UuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIHZlcmlmeSB0aGF0IHlvdSBlbnRlcmVkIHRoZSBjb3JyZWN0IHJlY292ZXJ5IGtleS5cIixcbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUucmVjb3ZlcnlLZXlWYWxpZCkge1xuICAgICAgICAgICAgICAgIGtleVN0YXR1cyA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZ19rZXlTdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAge1wiXFx1RDgzRFxcdURDNEQgXCJ9e190KFwiVGhpcyBsb29rcyBsaWtlIGEgdmFsaWQgcmVjb3Zlcnkga2V5IVwiKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtleVN0YXR1cyA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZ19rZXlTdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAge1wiXFx1RDgzRFxcdURDNEUgXCJ9e190KFwiTm90IGEgdmFsaWQgcmVjb3Zlcnkga2V5XCIpfVxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29udGVudCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICBcIjxiPldhcm5pbmc8L2I+OiBZb3Ugc2hvdWxkIG9ubHkgZG8gdGhpcyBvbiBhIHRydXN0ZWQgY29tcHV0ZXIuXCIsIHt9LFxuICAgICAgICAgICAgICAgICAgICB7IGI6IHN1YiA9PiA8Yj57c3VifTwvYj4gfSxcbiAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiQWNjZXNzIHlvdXIgc2VjdXJlIG1lc3NhZ2UgaGlzdG9yeSBhbmQgeW91ciBjcm9zcy1zaWduaW5nIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJpZGVudGl0eSBmb3IgdmVyaWZ5aW5nIG90aGVyIHNlc3Npb25zIGJ5IGVudGVyaW5nIHlvdXIgcmVjb3Zlcnkga2V5LlwiLFxuICAgICAgICAgICAgICAgICl9PC9wPlxuXG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwibXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZ19wcmltYXJ5Q29udGFpbmVyXCIgb25TdWJtaXQ9e3RoaXMuX29uUmVjb3ZlcnlLZXlOZXh0fT5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cIm14X0FjY2Vzc1NlY3JldFN0b3JhZ2VEaWFsb2dfcmVjb3ZlcnlLZXlJbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25SZWNvdmVyeUtleUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnJlY292ZXJ5S2V5fVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICB7a2V5U3RhdHVzfVxuICAgICAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUJ1dHRvbj17X3QoJ05leHQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vblJlY292ZXJ5S2V5TmV4dH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLl9vbkNhbmNlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlEaXNhYmxlZD17IXRoaXMuc3RhdGUucmVjb3ZlcnlLZXlWYWxpZH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSd2ZSBmb3Jnb3R0ZW4geW91ciByZWNvdmVyeSBrZXkgeW91IGNhbiBcIitcbiAgICAgICAgICAgICAgICAgICAgXCI8YnV0dG9uPnNldCB1cCBuZXcgcmVjb3Zlcnkgb3B0aW9uczwvYnV0dG9uPi5cIlxuICAgICAgICAgICAgICAgICwge30sIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uOiBzID0+IDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X2xpbmtCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudD1cInNwYW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25SZXNldFJlY292ZXJ5Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+LFxuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT0nbXhfQWNjZXNzU2VjcmV0U3RvcmFnZURpYWxvZydcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgdGl0bGU9e3RpdGxlfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICB7Y29udGVudH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==