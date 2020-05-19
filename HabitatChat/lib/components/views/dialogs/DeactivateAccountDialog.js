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

var sdk = _interopRequireWildcard(require("../../../index"));

var _Analytics = _interopRequireDefault(require("../../../Analytics"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var Lifecycle = _interopRequireWildcard(require("../../../Lifecycle"));

var _languageHandler = require("../../../languageHandler");

var _InteractiveAuth = _interopRequireWildcard(require("../../structures/InteractiveAuth"));

var _InteractiveAuthEntryComponents = require("../auth/InteractiveAuthEntryComponents");

/*
Copyright 2016 OpenMarket Ltd
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
class DeactivateAccountDialog extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onStagePhaseChange", (stage, phase) => {
      const dialogAesthetics = {
        [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
          body: (0, _languageHandler._t)("Confirm your account deactivation by using Single Sign On to prove your identity."),
          continueText: (0, _languageHandler._t)("Single Sign On"),
          continueKind: "danger"
        },
        [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
          body: (0, _languageHandler._t)("Are you sure you want to deactivate your account? This is irreversible."),
          continueText: (0, _languageHandler._t)("Confirm account deactivation"),
          continueKind: "danger"
        }
      }; // This is the same as aestheticsForStagePhases in InteractiveAuthDialog minus the `title`

      const DEACTIVATE_AESTHETICS = {
        [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: dialogAesthetics,
        [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: dialogAesthetics,
        [_InteractiveAuthEntryComponents.PasswordAuthEntry.LOGIN_TYPE]: {
          [_InteractiveAuthEntryComponents.DEFAULT_PHASE]: {
            body: (0, _languageHandler._t)("To continue, please enter your password:")
          }
        }
      };
      const aesthetics = DEACTIVATE_AESTHETICS[stage];
      let bodyText = null;
      let continueText = null;
      let continueKind = null;

      if (aesthetics) {
        const phaseAesthetics = aesthetics[phase];
        if (phaseAesthetics && phaseAesthetics.body) bodyText = phaseAesthetics.body;
        if (phaseAesthetics && phaseAesthetics.continueText) continueText = phaseAesthetics.continueText;
        if (phaseAesthetics && phaseAesthetics.continueKind) continueKind = phaseAesthetics.continueKind;
      }

      this.setState({
        bodyText,
        continueText,
        continueKind
      });
    });
    (0, _defineProperty2.default)(this, "_onUIAuthFinished", (success, result, extra) => {
      if (success) return; // great! makeRequest() will be called too.

      if (result === _InteractiveAuth.ERROR_USER_CANCELLED) {
        this._onCancel();

        return;
      }

      console.error("Error during UI Auth:", {
        result,
        extra
      });
      this.setState({
        errStr: (0, _languageHandler._t)("There was a problem communicating with the server. Please try again.")
      });
    });
    (0, _defineProperty2.default)(this, "_onUIAuthComplete", auth => {
      _MatrixClientPeg.MatrixClientPeg.get().deactivateAccount(auth, this.state.shouldErase).then(r => {
        // Deactivation worked - logout & close this dialog
        _Analytics.default.trackEvent('Account', 'Deactivate Account');

        Lifecycle.onLoggedOut();
        this.props.onFinished(true);
      }).catch(e => {
        console.error(e);
        this.setState({
          errStr: (0, _languageHandler._t)("There was a problem communicating with the server. Please try again.")
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onEraseFieldChange", ev => {
      this.setState({
        shouldErase: ev.target.checked,
        // Disable the auth form because we're going to have to reinitialize the auth
        // information. We do this because we can't modify the parameters in the UIA
        // session, and the user will have selected something which changes the request.
        // Therefore, we throw away the last auth session and try a new one.
        authEnabled: false
      }); // As mentioned above, set up for auth again to get updated UIA session info

      this._initAuth(
      /* shouldErase= */
      ev.target.checked);
    });
    this.state = {
      shouldErase: false,
      errStr: null,
      authData: null,
      // for UIA
      authEnabled: true,
      // see usages for information
      // A few strings that are passed to InteractiveAuth for design or are displayed
      // next to the InteractiveAuth component.
      bodyText: null,
      continueText: null,
      continueKind: null
    };

    this._initAuth(
    /* shouldErase= */
    false);
  }

  _onCancel() {
    this.props.onFinished(false);
  }

  _initAuth(shouldErase) {
    _MatrixClientPeg.MatrixClientPeg.get().deactivateAccount(null, shouldErase).then(r => {
      // If we got here, oops. The server didn't require any auth.
      // Our application lifecycle will catch the error and do the logout bits.
      // We'll try to log something in an vain attempt to record what happened (storage
      // is also obliterated on logout).
      console.warn("User's account got deactivated without confirmation: Server had no auth");
      this.setState({
        errStr: (0, _languageHandler._t)("Server did not require any authentication")
      });
    }).catch(e => {
      if (e && e.httpStatus === 401 && e.data) {
        // Valid UIA response
        this.setState({
          authData: e.data,
          authEnabled: true
        });
      } else {
        this.setState({
          errStr: (0, _languageHandler._t)("Server did not return valid authentication information.")
        });
      }
    });
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    let error = null;

    if (this.state.errStr) {
      error = /*#__PURE__*/_react.default.createElement("div", {
        className: "error"
      }, this.state.errStr);
    }

    let auth = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Loading..."));

    if (this.state.authData && this.state.authEnabled) {
      auth = /*#__PURE__*/_react.default.createElement("div", null, this.state.bodyText, /*#__PURE__*/_react.default.createElement(_InteractiveAuth.default, {
        matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
        authData: this.state.authData,
        makeRequest: this._onUIAuthComplete,
        onAuthFinished: this._onUIAuthFinished,
        onStagePhaseChange: this._onStagePhaseChange,
        continueText: this.state.continueText,
        continueKind: this.state.continueKind
      }));
    } // this is on purpose not a <form /> to prevent Enter triggering submission, to further prevent accidents


    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_DeactivateAccountDialog",
      onFinished: this.props.onFinished,
      titleClass: "danger",
      title: (0, _languageHandler._t)("Deactivate Account")
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This will make your account permanently unusable. " + "You will not be able to log in, and no one will be able to re-register the same " + "user ID. " + "This will cause your account to leave all rooms it is participating in, and it " + "will remove your account details from your identity server. " + "<b>This action is irreversible.</b>", {}, {
      b: sub => /*#__PURE__*/_react.default.createElement("b", null, " ", sub, " ")
    })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Deactivating your account <b>does not by default cause us to forget messages you " + "have sent.</b> " + "If you would like us to forget your messages, please tick the box below.", {}, {
      b: sub => /*#__PURE__*/_react.default.createElement("b", null, " ", sub, " ")
    })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Message visibility in Matrix is similar to email. " + "Our forgetting your messages means that messages you have sent will not be shared " + "with any new or unregistered users, but registered users who already have access " + "to these messages will still have access to their copy.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DeactivateAccountDialog_input_section"
    }, /*#__PURE__*/_react.default.createElement("p", null, /*#__PURE__*/_react.default.createElement("label", {
      htmlFor: "mx_DeactivateAccountDialog_erase_account_input"
    }, /*#__PURE__*/_react.default.createElement("input", {
      id: "mx_DeactivateAccountDialog_erase_account_input",
      type: "checkbox",
      checked: this.state.shouldErase,
      onChange: this._onEraseFieldChange
    }), (0, _languageHandler._t)("Please forget all messages I have sent when my account is deactivated " + "(<b>Warning:</b> this will cause future users to see an incomplete view " + "of conversations)", {}, {
      b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
    }))), error, auth)));
  }

}

exports.default = DeactivateAccountDialog;
DeactivateAccountDialog.propTypes = {
  onFinished: _propTypes.default.func.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRGVhY3RpdmF0ZUFjY291bnREaWFsb2cuanMiXSwibmFtZXMiOlsiRGVhY3RpdmF0ZUFjY291bnREaWFsb2ciLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGFnZSIsInBoYXNlIiwiZGlhbG9nQWVzdGhldGljcyIsIlNTT0F1dGhFbnRyeSIsIlBIQVNFX1BSRUFVVEgiLCJib2R5IiwiY29udGludWVUZXh0IiwiY29udGludWVLaW5kIiwiUEhBU0VfUE9TVEFVVEgiLCJERUFDVElWQVRFX0FFU1RIRVRJQ1MiLCJMT0dJTl9UWVBFIiwiVU5TVEFCTEVfTE9HSU5fVFlQRSIsIlBhc3N3b3JkQXV0aEVudHJ5IiwiREVGQVVMVF9QSEFTRSIsImFlc3RoZXRpY3MiLCJib2R5VGV4dCIsInBoYXNlQWVzdGhldGljcyIsInNldFN0YXRlIiwic3VjY2VzcyIsInJlc3VsdCIsImV4dHJhIiwiRVJST1JfVVNFUl9DQU5DRUxMRUQiLCJfb25DYW5jZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJlcnJTdHIiLCJhdXRoIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZGVhY3RpdmF0ZUFjY291bnQiLCJzdGF0ZSIsInNob3VsZEVyYXNlIiwidGhlbiIsInIiLCJBbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiTGlmZWN5Y2xlIiwib25Mb2dnZWRPdXQiLCJvbkZpbmlzaGVkIiwiY2F0Y2giLCJlIiwiZXYiLCJ0YXJnZXQiLCJjaGVja2VkIiwiYXV0aEVuYWJsZWQiLCJfaW5pdEF1dGgiLCJhdXRoRGF0YSIsIndhcm4iLCJodHRwU3RhdHVzIiwiZGF0YSIsInJlbmRlciIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJfb25VSUF1dGhDb21wbGV0ZSIsIl9vblVJQXV0aEZpbmlzaGVkIiwiX29uU3RhZ2VQaGFzZUNoYW5nZSIsImIiLCJzdWIiLCJfb25FcmFz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QUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLHFEQUNJO0FBQU8sTUFBQSxPQUFPLEVBQUM7QUFBZixvQkFDSTtBQUNJLE1BQUEsRUFBRSxFQUFDLGdEQURQO0FBRUksTUFBQSxJQUFJLEVBQUMsVUFGVDtBQUdJLE1BQUEsT0FBTyxFQUFFLEtBQUs1QixLQUFMLENBQVdDLFdBSHhCO0FBSUksTUFBQSxRQUFRLEVBQUUsS0FBSzRCO0FBSm5CLE1BREosRUFPTSx5QkFDRSwyRUFDQSwwRUFEQSxHQUVBLG1CQUhGLEVBSUUsRUFKRixFQUtFO0FBQUVGLE1BQUFBLENBQUMsRUFBR0MsR0FBRCxpQkFBUyx3Q0FBS0EsR0FBTDtBQUFkLEtBTEYsQ0FQTixDQURKLENBREosRUFtQktsQyxLQW5CTCxFQW9CS0UsSUFwQkwsQ0EzQkosQ0FMSixDQURKO0FBMkRIOztBQS9NZ0U7OztBQWtOckUvQix1QkFBdUIsQ0FBQ2lFLFNBQXhCLEdBQW9DO0FBQ2hDdEIsRUFBQUEsVUFBVSxFQUFFdUIsbUJBQVVDLElBQVYsQ0FBZUM7QUFESyxDQUFwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBBbmFseXRpY3MgZnJvbSAnLi4vLi4vLi4vQW5hbHl0aWNzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgTGlmZWN5Y2xlIGZyb20gJy4uLy4uLy4uL0xpZmVjeWNsZSc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgSW50ZXJhY3RpdmVBdXRoLCB7RVJST1JfVVNFUl9DQU5DRUxMRUR9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL0ludGVyYWN0aXZlQXV0aFwiO1xuaW1wb3J0IHtERUZBVUxUX1BIQVNFLCBQYXNzd29yZEF1dGhFbnRyeSwgU1NPQXV0aEVudHJ5fSBmcm9tIFwiLi4vYXV0aC9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVhY3RpdmF0ZUFjY291bnREaWFsb2cgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgc2hvdWxkRXJhc2U6IGZhbHNlLFxuICAgICAgICAgICAgZXJyU3RyOiBudWxsLFxuICAgICAgICAgICAgYXV0aERhdGE6IG51bGwsIC8vIGZvciBVSUFcbiAgICAgICAgICAgIGF1dGhFbmFibGVkOiB0cnVlLCAvLyBzZWUgdXNhZ2VzIGZvciBpbmZvcm1hdGlvblxuXG4gICAgICAgICAgICAvLyBBIGZldyBzdHJpbmdzIHRoYXQgYXJlIHBhc3NlZCB0byBJbnRlcmFjdGl2ZUF1dGggZm9yIGRlc2lnbiBvciBhcmUgZGlzcGxheWVkXG4gICAgICAgICAgICAvLyBuZXh0IHRvIHRoZSBJbnRlcmFjdGl2ZUF1dGggY29tcG9uZW50LlxuICAgICAgICAgICAgYm9keVRleHQ6IG51bGwsXG4gICAgICAgICAgICBjb250aW51ZVRleHQ6IG51bGwsXG4gICAgICAgICAgICBjb250aW51ZUtpbmQ6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5faW5pdEF1dGgoLyogc2hvdWxkRXJhc2U9ICovZmFsc2UpO1xuICAgIH1cblxuICAgIF9vblN0YWdlUGhhc2VDaGFuZ2UgPSAoc3RhZ2UsIHBoYXNlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpYWxvZ0Flc3RoZXRpY3MgPSB7XG4gICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgYm9keTogX3QoXCJDb25maXJtIHlvdXIgYWNjb3VudCBkZWFjdGl2YXRpb24gYnkgdXNpbmcgU2luZ2xlIFNpZ24gT24gdG8gcHJvdmUgeW91ciBpZGVudGl0eS5cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIlNpbmdsZSBTaWduIE9uXCIpLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlS2luZDogXCJkYW5nZXJcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BPU1RBVVRIXToge1xuICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlYWN0aXZhdGUgeW91ciBhY2NvdW50PyBUaGlzIGlzIGlycmV2ZXJzaWJsZS5cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIkNvbmZpcm0gYWNjb3VudCBkZWFjdGl2YXRpb25cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcImRhbmdlclwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBzYW1lIGFzIGFlc3RoZXRpY3NGb3JTdGFnZVBoYXNlcyBpbiBJbnRlcmFjdGl2ZUF1dGhEaWFsb2cgbWludXMgdGhlIGB0aXRsZWBcbiAgICAgICAgY29uc3QgREVBQ1RJVkFURV9BRVNUSEVUSUNTID0ge1xuICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5MT0dJTl9UWVBFXTogZGlhbG9nQWVzdGhldGljcyxcbiAgICAgICAgICAgIFtTU09BdXRoRW50cnkuVU5TVEFCTEVfTE9HSU5fVFlQRV06IGRpYWxvZ0Flc3RoZXRpY3MsXG4gICAgICAgICAgICBbUGFzc3dvcmRBdXRoRW50cnkuTE9HSU5fVFlQRV06IHtcbiAgICAgICAgICAgICAgICBbREVGQVVMVF9QSEFTRV06IHtcbiAgICAgICAgICAgICAgICAgICAgYm9keTogX3QoXCJUbyBjb250aW51ZSwgcGxlYXNlIGVudGVyIHlvdXIgcGFzc3dvcmQ6XCIpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFlc3RoZXRpY3MgPSBERUFDVElWQVRFX0FFU1RIRVRJQ1Nbc3RhZ2VdO1xuICAgICAgICBsZXQgYm9keVRleHQgPSBudWxsO1xuICAgICAgICBsZXQgY29udGludWVUZXh0ID0gbnVsbDtcbiAgICAgICAgbGV0IGNvbnRpbnVlS2luZCA9IG51bGw7XG4gICAgICAgIGlmIChhZXN0aGV0aWNzKSB7XG4gICAgICAgICAgICBjb25zdCBwaGFzZUFlc3RoZXRpY3MgPSBhZXN0aGV0aWNzW3BoYXNlXTtcbiAgICAgICAgICAgIGlmIChwaGFzZUFlc3RoZXRpY3MgJiYgcGhhc2VBZXN0aGV0aWNzLmJvZHkpIGJvZHlUZXh0ID0gcGhhc2VBZXN0aGV0aWNzLmJvZHk7XG4gICAgICAgICAgICBpZiAocGhhc2VBZXN0aGV0aWNzICYmIHBoYXNlQWVzdGhldGljcy5jb250aW51ZVRleHQpIGNvbnRpbnVlVGV4dCA9IHBoYXNlQWVzdGhldGljcy5jb250aW51ZVRleHQ7XG4gICAgICAgICAgICBpZiAocGhhc2VBZXN0aGV0aWNzICYmIHBoYXNlQWVzdGhldGljcy5jb250aW51ZUtpbmQpIGNvbnRpbnVlS2luZCA9IHBoYXNlQWVzdGhldGljcy5jb250aW51ZUtpbmQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Ym9keVRleHQsIGNvbnRpbnVlVGV4dCwgY29udGludWVLaW5kfSk7XG4gICAgfTtcblxuICAgIF9vblVJQXV0aEZpbmlzaGVkID0gKHN1Y2Nlc3MsIHJlc3VsdCwgZXh0cmEpID0+IHtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHJldHVybjsgLy8gZ3JlYXQhIG1ha2VSZXF1ZXN0KCkgd2lsbCBiZSBjYWxsZWQgdG9vLlxuXG4gICAgICAgIGlmIChyZXN1bHQgPT09IEVSUk9SX1VTRVJfQ0FOQ0VMTEVEKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkNhbmNlbCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGR1cmluZyBVSSBBdXRoOlwiLCB7cmVzdWx0LCBleHRyYX0pO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtlcnJTdHI6IF90KFwiVGhlcmUgd2FzIGEgcHJvYmxlbSBjb21tdW5pY2F0aW5nIHdpdGggdGhlIHNlcnZlci4gUGxlYXNlIHRyeSBhZ2Fpbi5cIil9KTtcbiAgICB9O1xuXG4gICAgX29uVUlBdXRoQ29tcGxldGUgPSAoYXV0aCkgPT4ge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZGVhY3RpdmF0ZUFjY291bnQoYXV0aCwgdGhpcy5zdGF0ZS5zaG91bGRFcmFzZSkudGhlbihyID0+IHtcbiAgICAgICAgICAgIC8vIERlYWN0aXZhdGlvbiB3b3JrZWQgLSBsb2dvdXQgJiBjbG9zZSB0aGlzIGRpYWxvZ1xuICAgICAgICAgICAgQW5hbHl0aWNzLnRyYWNrRXZlbnQoJ0FjY291bnQnLCAnRGVhY3RpdmF0ZSBBY2NvdW50Jyk7XG4gICAgICAgICAgICBMaWZlY3ljbGUub25Mb2dnZWRPdXQoKTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICAgICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZXJyU3RyOiBfdChcIlRoZXJlIHdhcyBhIHByb2JsZW0gY29tbXVuaWNhdGluZyB3aXRoIHRoZSBzZXJ2ZXIuIFBsZWFzZSB0cnkgYWdhaW4uXCIpfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25FcmFzZUZpZWxkQ2hhbmdlID0gKGV2KSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2hvdWxkRXJhc2U6IGV2LnRhcmdldC5jaGVja2VkLFxuXG4gICAgICAgICAgICAvLyBEaXNhYmxlIHRoZSBhdXRoIGZvcm0gYmVjYXVzZSB3ZSdyZSBnb2luZyB0byBoYXZlIHRvIHJlaW5pdGlhbGl6ZSB0aGUgYXV0aFxuICAgICAgICAgICAgLy8gaW5mb3JtYXRpb24uIFdlIGRvIHRoaXMgYmVjYXVzZSB3ZSBjYW4ndCBtb2RpZnkgdGhlIHBhcmFtZXRlcnMgaW4gdGhlIFVJQVxuICAgICAgICAgICAgLy8gc2Vzc2lvbiwgYW5kIHRoZSB1c2VyIHdpbGwgaGF2ZSBzZWxlY3RlZCBzb21ldGhpbmcgd2hpY2ggY2hhbmdlcyB0aGUgcmVxdWVzdC5cbiAgICAgICAgICAgIC8vIFRoZXJlZm9yZSwgd2UgdGhyb3cgYXdheSB0aGUgbGFzdCBhdXRoIHNlc3Npb24gYW5kIHRyeSBhIG5ldyBvbmUuXG4gICAgICAgICAgICBhdXRoRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFzIG1lbnRpb25lZCBhYm92ZSwgc2V0IHVwIGZvciBhdXRoIGFnYWluIHRvIGdldCB1cGRhdGVkIFVJQSBzZXNzaW9uIGluZm9cbiAgICAgICAgdGhpcy5faW5pdEF1dGgoLyogc2hvdWxkRXJhc2U9ICovZXYudGFyZ2V0LmNoZWNrZWQpO1xuICAgIH07XG5cbiAgICBfb25DYW5jZWwoKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgX2luaXRBdXRoKHNob3VsZEVyYXNlKSB7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5kZWFjdGl2YXRlQWNjb3VudChudWxsLCBzaG91bGRFcmFzZSkudGhlbihyID0+IHtcbiAgICAgICAgICAgIC8vIElmIHdlIGdvdCBoZXJlLCBvb3BzLiBUaGUgc2VydmVyIGRpZG4ndCByZXF1aXJlIGFueSBhdXRoLlxuICAgICAgICAgICAgLy8gT3VyIGFwcGxpY2F0aW9uIGxpZmVjeWNsZSB3aWxsIGNhdGNoIHRoZSBlcnJvciBhbmQgZG8gdGhlIGxvZ291dCBiaXRzLlxuICAgICAgICAgICAgLy8gV2UnbGwgdHJ5IHRvIGxvZyBzb21ldGhpbmcgaW4gYW4gdmFpbiBhdHRlbXB0IHRvIHJlY29yZCB3aGF0IGhhcHBlbmVkIChzdG9yYWdlXG4gICAgICAgICAgICAvLyBpcyBhbHNvIG9ibGl0ZXJhdGVkIG9uIGxvZ291dCkuXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJVc2VyJ3MgYWNjb3VudCBnb3QgZGVhY3RpdmF0ZWQgd2l0aG91dCBjb25maXJtYXRpb246IFNlcnZlciBoYWQgbm8gYXV0aFwiKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VyclN0cjogX3QoXCJTZXJ2ZXIgZGlkIG5vdCByZXF1aXJlIGFueSBhdXRoZW50aWNhdGlvblwiKX0pO1xuICAgICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIGlmIChlICYmIGUuaHR0cFN0YXR1cyA9PT0gNDAxICYmIGUuZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIFZhbGlkIFVJQSByZXNwb25zZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2F1dGhEYXRhOiBlLmRhdGEsIGF1dGhFbmFibGVkOiB0cnVlfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VyclN0cjogX3QoXCJTZXJ2ZXIgZGlkIG5vdCByZXR1cm4gdmFsaWQgYXV0aGVudGljYXRpb24gaW5mb3JtYXRpb24uXCIpfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuXG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmVyclN0cikge1xuICAgICAgICAgICAgZXJyb3IgPSA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCI+XG4gICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLmVyclN0ciB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXV0aCA9IDxkaXY+e190KFwiTG9hZGluZy4uLlwiKX08L2Rpdj47XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dGhEYXRhICYmIHRoaXMuc3RhdGUuYXV0aEVuYWJsZWQpIHtcbiAgICAgICAgICAgIGF1dGggPSAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuYm9keVRleHR9XG4gICAgICAgICAgICAgICAgICAgIDxJbnRlcmFjdGl2ZUF1dGhcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudD17TWF0cml4Q2xpZW50UGVnLmdldCgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0aERhdGE9e3RoaXMuc3RhdGUuYXV0aERhdGF9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWtlUmVxdWVzdD17dGhpcy5fb25VSUF1dGhDb21wbGV0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQXV0aEZpbmlzaGVkPXt0aGlzLl9vblVJQXV0aEZpbmlzaGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25TdGFnZVBoYXNlQ2hhbmdlPXt0aGlzLl9vblN0YWdlUGhhc2VDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVRleHQ9e3RoaXMuc3RhdGUuY29udGludWVUZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVLaW5kPXt0aGlzLnN0YXRlLmNvbnRpbnVlS2luZH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzIGlzIG9uIHB1cnBvc2Ugbm90IGEgPGZvcm0gLz4gdG8gcHJldmVudCBFbnRlciB0cmlnZ2VyaW5nIHN1Ym1pc3Npb24sIHRvIGZ1cnRoZXIgcHJldmVudCBhY2NpZGVudHNcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0RlYWN0aXZhdGVBY2NvdW50RGlhbG9nXCJcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgdGl0bGVDbGFzcz1cImRhbmdlclwiXG4gICAgICAgICAgICAgICAgdGl0bGU9e190KFwiRGVhY3RpdmF0ZSBBY2NvdW50XCIpfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyB3aWxsIG1ha2UgeW91ciBhY2NvdW50IHBlcm1hbmVudGx5IHVudXNhYmxlLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIllvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGxvZyBpbiwgYW5kIG5vIG9uZSB3aWxsIGJlIGFibGUgdG8gcmUtcmVnaXN0ZXIgdGhlIHNhbWUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyIElELiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgd2lsbCBjYXVzZSB5b3VyIGFjY291bnQgdG8gbGVhdmUgYWxsIHJvb21zIGl0IGlzIHBhcnRpY2lwYXRpbmcgaW4sIGFuZCBpdCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpbGwgcmVtb3ZlIHlvdXIgYWNjb3VudCBkZXRhaWxzIGZyb20geW91ciBpZGVudGl0eSBzZXJ2ZXIuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGI+VGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLjwvYj5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBiOiAoc3ViKSA9PiA8Yj4geyBzdWIgfSA8L2I+IH0sXG4gICAgICAgICAgICAgICAgICAgICkgfTwvcD5cblxuICAgICAgICAgICAgICAgICAgICA8cD57IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJEZWFjdGl2YXRpbmcgeW91ciBhY2NvdW50IDxiPmRvZXMgbm90IGJ5IGRlZmF1bHQgY2F1c2UgdXMgdG8gZm9yZ2V0IG1lc3NhZ2VzIHlvdSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImhhdmUgc2VudC48L2I+IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSWYgeW91IHdvdWxkIGxpa2UgdXMgdG8gZm9yZ2V0IHlvdXIgbWVzc2FnZXMsIHBsZWFzZSB0aWNrIHRoZSBib3ggYmVsb3cuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgYjogKHN1YikgPT4gPGI+IHsgc3ViIH0gPC9iPiB9LFxuICAgICAgICAgICAgICAgICAgICApIH08L3A+XG5cbiAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTWVzc2FnZSB2aXNpYmlsaXR5IGluIE1hdHJpeCBpcyBzaW1pbGFyIHRvIGVtYWlsLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk91ciBmb3JnZXR0aW5nIHlvdXIgbWVzc2FnZXMgbWVhbnMgdGhhdCBtZXNzYWdlcyB5b3UgaGF2ZSBzZW50IHdpbGwgbm90IGJlIHNoYXJlZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpdGggYW55IG5ldyBvciB1bnJlZ2lzdGVyZWQgdXNlcnMsIGJ1dCByZWdpc3RlcmVkIHVzZXJzIHdobyBhbHJlYWR5IGhhdmUgYWNjZXNzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidG8gdGhlc2UgbWVzc2FnZXMgd2lsbCBzdGlsbCBoYXZlIGFjY2VzcyB0byB0aGVpciBjb3B5LlwiLFxuICAgICAgICAgICAgICAgICAgICApIH08L3A+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZWFjdGl2YXRlQWNjb3VudERpYWxvZ19pbnB1dF9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cIm14X0RlYWN0aXZhdGVBY2NvdW50RGlhbG9nX2VyYXNlX2FjY291bnRfaW5wdXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cIm14X0RlYWN0aXZhdGVBY2NvdW50RGlhbG9nX2VyYXNlX2FjY291bnRfaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3RoaXMuc3RhdGUuc2hvdWxkRXJhc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25FcmFzZUZpZWxkQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJQbGVhc2UgZm9yZ2V0IGFsbCBtZXNzYWdlcyBJIGhhdmUgc2VudCB3aGVuIG15IGFjY291bnQgaXMgZGVhY3RpdmF0ZWQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIoPGI+V2FybmluZzo8L2I+IHRoaXMgd2lsbCBjYXVzZSBmdXR1cmUgdXNlcnMgdG8gc2VlIGFuIGluY29tcGxldGUgdmlldyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9mIGNvbnZlcnNhdGlvbnMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYjogKHN1YikgPT4gPGI+eyBzdWIgfTwvYj4gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cblxuICAgICAgICAgICAgICAgICAgICAgICAge2Vycm9yfVxuICAgICAgICAgICAgICAgICAgICAgICAge2F1dGh9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5EZWFjdGl2YXRlQWNjb3VudERpYWxvZy5wcm9wVHlwZXMgPSB7XG4gICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbn07XG4iXX0=