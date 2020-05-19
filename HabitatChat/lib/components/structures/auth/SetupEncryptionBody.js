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

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _SetupEncryptionStore = require("../../../stores/SetupEncryptionStore");

/*
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
class SetupEncryptionBody extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onStoreUpdate", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      if (store.phase === _SetupEncryptionStore.PHASE_FINISHED) {
        this.props.onFinished();
        return;
      }

      this.setState({
        phase: store.phase,
        verificationRequest: store.verificationRequest,
        backupInfo: store.backupInfo
      });
    });
    (0, _defineProperty2.default)(this, "_onUsePassphraseClick", async () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      store.usePassPhrase();
    });
    (0, _defineProperty2.default)(this, "onSkipClick", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      store.skip();
    });
    (0, _defineProperty2.default)(this, "onSkipConfirmClick", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      store.skipConfirm();
    });
    (0, _defineProperty2.default)(this, "onSkipBackClick", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      store.returnAfterSkip();
    });
    (0, _defineProperty2.default)(this, "onDoneClick", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      store.done();
    });

    const _store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

    _store.on("update", this._onStoreUpdate);

    _store.start();

    this.state = {
      phase: _store.phase,
      // this serves dual purpose as the object for the request logic and
      // the presence of it indicating that we're in 'verify mode'.
      // Because of the latter, it lives in the state.
      verificationRequest: _store.verificationRequest,
      backupInfo: _store.backupInfo
    };
  }

  componentWillUnmount() {
    const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

    store.off("update", this._onStoreUpdate);
    store.stop();
  }

  render() {
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const {
      phase
    } = this.state;

    if (this.state.verificationRequest) {
      const EncryptionPanel = sdk.getComponent("views.right_panel.EncryptionPanel");
      return /*#__PURE__*/_react.default.createElement(EncryptionPanel, {
        layout: "dialog",
        verificationRequest: this.state.verificationRequest,
        onClose: this.props.onFinished,
        member: _MatrixClientPeg.MatrixClientPeg.get().getUser(this.state.verificationRequest.otherUserId)
      });
    } else if (phase === _SetupEncryptionStore.PHASE_INTRO) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Confirm your identity by verifying this login from one of your other sessions, " + "granting it access to encrypted messages.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This requires the latest Riot on your other devices:")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_clients"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_clients_desktop"
      }, /*#__PURE__*/_react.default.createElement("div", null, "Riot Web"), /*#__PURE__*/_react.default.createElement("div", null, "Riot Desktop")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_clients_mobile"
      }, /*#__PURE__*/_react.default.createElement("div", null, "Riot iOS"), /*#__PURE__*/_react.default.createElement("div", null, "Riot X for Android")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("or another cross-signing capable Matrix client"))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_actionRow"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "link",
        onClick: this._onUsePassphraseClick
      }, (0, _languageHandler._t)("Use Recovery Passphrase or Key")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "danger",
        onClick: this.onSkipClick
      }, (0, _languageHandler._t)("Skip"))));
    } else if (phase === _SetupEncryptionStore.PHASE_DONE) {
      let message;

      if (this.state.backupInfo) {
        message = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your new session is now verified. It has access to your " + "encrypted messages, and other users will see it as trusted."));
      } else {
        message = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your new session is now verified. Other users will see it as trusted."));
      }

      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_heroIcon mx_E2EIcon_verified"
      }), message, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_actionRow"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "primary",
        onClick: this.onDoneClick
      }, (0, _languageHandler._t)("Done"))));
    } else if (phase === _SetupEncryptionStore.PHASE_CONFIRM_SKIP) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Without completing security on this session, it won’t have " + "access to encrypted messages.")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_CompleteSecurity_actionRow"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "warning",
        kind: "secondary",
        onClick: this.onSkipConfirmClick
      }, (0, _languageHandler._t)("Skip")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "danger",
        onClick: this.onSkipBackClick
      }, (0, _languageHandler._t)("Go Back"))));
    } else if (phase === _SetupEncryptionStore.PHASE_BUSY) {
      const Spinner = sdk.getComponent('views.elements.Spinner');
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else {
      console.log("SetupEncryptionBody: Unknown phase ".concat(phase));
    }
  }

}

exports.default = SetupEncryptionBody;
(0, _defineProperty2.default)(SetupEncryptionBody, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9TZXR1cEVuY3J5cHRpb25Cb2R5LmpzIl0sIm5hbWVzIjpbIlNldHVwRW5jcnlwdGlvbkJvZHkiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwic3RvcmUiLCJTZXR1cEVuY3J5cHRpb25TdG9yZSIsInNoYXJlZEluc3RhbmNlIiwicGhhc2UiLCJQSEFTRV9GSU5JU0hFRCIsInByb3BzIiwib25GaW5pc2hlZCIsInNldFN0YXRlIiwidmVyaWZpY2F0aW9uUmVxdWVzdCIsImJhY2t1cEluZm8iLCJ1c2VQYXNzUGhyYXNlIiwic2tpcCIsInNraXBDb25maXJtIiwicmV0dXJuQWZ0ZXJTa2lwIiwiZG9uZSIsIm9uIiwiX29uU3RvcmVVcGRhdGUiLCJzdGFydCIsInN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJvZmYiLCJzdG9wIiwicmVuZGVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNkayIsImdldENvbXBvbmVudCIsIkVuY3J5cHRpb25QYW5lbCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFVzZXIiLCJvdGhlclVzZXJJZCIsIlBIQVNFX0lOVFJPIiwiX29uVXNlUGFzc3BocmFzZUNsaWNrIiwib25Ta2lwQ2xpY2siLCJQSEFTRV9ET05FIiwibWVzc2FnZSIsIm9uRG9uZUNsaWNrIiwiUEhBU0VfQ09ORklSTV9TS0lQIiwib25Ta2lwQ29uZmlybUNsaWNrIiwib25Ta2lwQmFja0NsaWNrIiwiUEhBU0VfQlVTWSIsIlNwaW5uZXIiLCJjb25zb2xlIiwibG9nIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7QUE4QmUsTUFBTUEsbUJBQU4sU0FBa0NDLGVBQU1DLFNBQXhDLENBQWtEO0FBSzdE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QUtDO0FBRmxCLFNBSUsseUJBQUcsTUFBSCxDQUpMLENBREosQ0FISixDQURKO0FBY0gsS0ExQk0sTUEwQkEsSUFBSWpDLEtBQUssS0FBS2tDLHdDQUFkLEVBQWtDO0FBQ3JDLDBCQUNJLHVEQUNJLHdDQUFJLHlCQUNBLGdFQUNBLCtCQUZBLENBQUosQ0FESixlQUtJO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDSSw2QkFBQyxnQkFBRDtBQUNJLFFBQUEsU0FBUyxFQUFDLFNBRGQ7QUFFSSxRQUFBLElBQUksRUFBQyxXQUZUO0FBR0ksUUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFIbEIsU0FLSyx5QkFBRyxNQUFILENBTEwsQ0FESixlQVFJLDZCQUFDLGdCQUFEO0FBQ0ksUUFBQSxJQUFJLEVBQUMsUUFEVDtBQUVJLFFBQUEsT0FBTyxFQUFFLEtBQUtDO0FBRmxCLFNBSUsseUJBQUcsU0FBSCxDQUpMLENBUkosQ0FMSixDQURKO0FBdUJILEtBeEJNLE1Bd0JBLElBQUlwQyxLQUFLLEtBQUtxQyxnQ0FBZCxFQUEwQjtBQUM3QixZQUFNQyxPQUFPLEdBQUdqQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQWhCO0FBQ0EsMEJBQU8sNkJBQUMsT0FBRCxPQUFQO0FBQ0gsS0FITSxNQUdBO0FBQ0hpQixNQUFBQSxPQUFPLENBQUNDLEdBQVIsOENBQWtEeEMsS0FBbEQ7QUFDSDtBQUNKOztBQXhLNEQ7Ozs4QkFBNUNQLG1CLGVBQ0U7QUFDZlUsRUFBQUEsVUFBVSxFQUFFc0MsbUJBQVVDLElBQVYsQ0FBZUM7QUFEWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgeyBNYXRyaXhDbGllbnRQZWcgfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7XG4gICAgU2V0dXBFbmNyeXB0aW9uU3RvcmUsXG4gICAgUEhBU0VfSU5UUk8sXG4gICAgUEhBU0VfQlVTWSxcbiAgICBQSEFTRV9ET05FLFxuICAgIFBIQVNFX0NPTkZJUk1fU0tJUCxcbiAgICBQSEFTRV9GSU5JU0hFRCxcbn0gZnJvbSAnLi4vLi4vLi4vc3RvcmVzL1NldHVwRW5jcnlwdGlvblN0b3JlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dXBFbmNyeXB0aW9uQm9keSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgc3RvcmUub24oXCJ1cGRhdGVcIiwgdGhpcy5fb25TdG9yZVVwZGF0ZSk7XG4gICAgICAgIHN0b3JlLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBwaGFzZTogc3RvcmUucGhhc2UsXG4gICAgICAgICAgICAvLyB0aGlzIHNlcnZlcyBkdWFsIHB1cnBvc2UgYXMgdGhlIG9iamVjdCBmb3IgdGhlIHJlcXVlc3QgbG9naWMgYW5kXG4gICAgICAgICAgICAvLyB0aGUgcHJlc2VuY2Ugb2YgaXQgaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGluICd2ZXJpZnkgbW9kZScuXG4gICAgICAgICAgICAvLyBCZWNhdXNlIG9mIHRoZSBsYXR0ZXIsIGl0IGxpdmVzIGluIHRoZSBzdGF0ZS5cbiAgICAgICAgICAgIHZlcmlmaWNhdGlvblJlcXVlc3Q6IHN0b3JlLnZlcmlmaWNhdGlvblJlcXVlc3QsXG4gICAgICAgICAgICBiYWNrdXBJbmZvOiBzdG9yZS5iYWNrdXBJbmZvLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vblN0b3JlVXBkYXRlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzdG9yZSA9IFNldHVwRW5jcnlwdGlvblN0b3JlLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICAgIGlmIChzdG9yZS5waGFzZSA9PT0gUEhBU0VfRklOSVNIRUQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IHN0b3JlLnBoYXNlLFxuICAgICAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWVzdDogc3RvcmUudmVyaWZpY2F0aW9uUmVxdWVzdCxcbiAgICAgICAgICAgIGJhY2t1cEluZm86IHN0b3JlLmJhY2t1cEluZm8sXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBTZXR1cEVuY3J5cHRpb25TdG9yZS5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgICBzdG9yZS5vZmYoXCJ1cGRhdGVcIiwgdGhpcy5fb25TdG9yZVVwZGF0ZSk7XG4gICAgICAgIHN0b3JlLnN0b3AoKTtcbiAgICB9XG5cbiAgICBfb25Vc2VQYXNzcGhyYXNlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgc3RvcmUudXNlUGFzc1BocmFzZSgpO1xuICAgIH1cblxuICAgIG9uU2tpcENsaWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzdG9yZSA9IFNldHVwRW5jcnlwdGlvblN0b3JlLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICAgIHN0b3JlLnNraXAoKTtcbiAgICB9XG5cbiAgICBvblNraXBDb25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgc3RvcmUuc2tpcENvbmZpcm0oKTtcbiAgICB9XG5cbiAgICBvblNraXBCYWNrQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgc3RvcmUucmV0dXJuQWZ0ZXJTa2lwKCk7XG4gICAgfVxuXG4gICAgb25Eb25lQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgc3RvcmUuZG9uZSgpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uXCIpO1xuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHBoYXNlLFxuICAgICAgICB9ID0gdGhpcy5zdGF0ZTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZXJpZmljYXRpb25SZXF1ZXN0KSB7XG4gICAgICAgICAgICBjb25zdCBFbmNyeXB0aW9uUGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MucmlnaHRfcGFuZWwuRW5jcnlwdGlvblBhbmVsXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxFbmNyeXB0aW9uUGFuZWxcbiAgICAgICAgICAgICAgICBsYXlvdXQ9XCJkaWFsb2dcIlxuICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvblJlcXVlc3Q9e3RoaXMuc3RhdGUudmVyaWZpY2F0aW9uUmVxdWVzdH1cbiAgICAgICAgICAgICAgICBvbkNsb3NlPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgbWVtYmVyPXtNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcih0aGlzLnN0YXRlLnZlcmlmaWNhdGlvblJlcXVlc3Qub3RoZXJVc2VySWQpfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH0gZWxzZSBpZiAocGhhc2UgPT09IFBIQVNFX0lOVFJPKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29uZmlybSB5b3VyIGlkZW50aXR5IGJ5IHZlcmlmeWluZyB0aGlzIGxvZ2luIGZyb20gb25lIG9mIHlvdXIgb3RoZXIgc2Vzc2lvbnMsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZ3JhbnRpbmcgaXQgYWNjZXNzIHRvIGVuY3J5cHRlZCBtZXNzYWdlcy5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyByZXF1aXJlcyB0aGUgbGF0ZXN0IFJpb3Qgb24geW91ciBvdGhlciBkZXZpY2VzOlwiLFxuICAgICAgICAgICAgICAgICAgICApfTwvcD5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfY2xpZW50c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Db21wbGV0ZVNlY3VyaXR5X2NsaWVudHNfZGVza3RvcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+UmlvdCBXZWI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlJpb3QgRGVza3RvcDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfY2xpZW50c19tb2JpbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlJpb3QgaU9TPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5SaW90IFggZm9yIEFuZHJvaWQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+e190KFwib3IgYW5vdGhlciBjcm9zcy1zaWduaW5nIGNhcGFibGUgTWF0cml4IGNsaWVudFwiKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ29tcGxldGVTZWN1cml0eV9hY3Rpb25Sb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9XCJsaW5rXCIgb25DbGljaz17dGhpcy5fb25Vc2VQYXNzcGhyYXNlQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlVzZSBSZWNvdmVyeSBQYXNzcGhyYXNlIG9yIEtleVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9XCJkYW5nZXJcIiBvbkNsaWNrPXt0aGlzLm9uU2tpcENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJTa2lwXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAocGhhc2UgPT09IFBIQVNFX0RPTkUpIHtcbiAgICAgICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwSW5mbykge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiWW91ciBuZXcgc2Vzc2lvbiBpcyBub3cgdmVyaWZpZWQuIEl0IGhhcyBhY2Nlc3MgdG8geW91ciBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkIG1lc3NhZ2VzLCBhbmQgb3RoZXIgdXNlcnMgd2lsbCBzZWUgaXQgYXMgdHJ1c3RlZC5cIixcbiAgICAgICAgICAgICAgICApfTwvcD47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiWW91ciBuZXcgc2Vzc2lvbiBpcyBub3cgdmVyaWZpZWQuIE90aGVyIHVzZXJzIHdpbGwgc2VlIGl0IGFzIHRydXN0ZWQuXCIsXG4gICAgICAgICAgICAgICAgKX08L3A+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfaGVyb0ljb24gbXhfRTJFSWNvbl92ZXJpZmllZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgIHttZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfYWN0aW9uUm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uRG9uZUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkRvbmVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChwaGFzZSA9PT0gUEhBU0VfQ09ORklSTV9TS0lQKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiV2l0aG91dCBjb21wbGV0aW5nIHNlY3VyaXR5IG9uIHRoaXMgc2Vzc2lvbiwgaXQgd29u4oCZdCBoYXZlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWNjZXNzIHRvIGVuY3J5cHRlZCBtZXNzYWdlcy5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ29tcGxldGVTZWN1cml0eV9hY3Rpb25Sb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwid2FybmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZD1cInNlY29uZGFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblNraXBDb25maXJtQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiU2tpcFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZD1cImRhbmdlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblNraXBCYWNrQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiR28gQmFja1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHBoYXNlID09PSBQSEFTRV9CVVNZKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIC8+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFNldHVwRW5jcnlwdGlvbkJvZHk6IFVua25vd24gcGhhc2UgJHtwaGFzZX1gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==