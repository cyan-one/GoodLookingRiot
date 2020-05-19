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

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var FormattingUtils = _interopRequireWildcard(require("../../../utils/FormattingUtils"));

var _languageHandler = require("../../../languageHandler");

var _crypto = require("matrix-js-sdk/src/crypto");

var _createRoom = require("../../../createRoom");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _QRCode = require("matrix-js-sdk/src/crypto/verification/QRCode");

var _VerificationQREmojiOptions = _interopRequireDefault(require("../verification/VerificationQREmojiOptions"));

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
const MODE_LEGACY = 'legacy';
const MODE_SAS = 'sas';
const PHASE_START = 0;
const PHASE_WAIT_FOR_PARTNER_TO_ACCEPT = 1;
const PHASE_PICK_VERIFICATION_OPTION = 2;
const PHASE_SHOW_SAS = 3;
const PHASE_WAIT_FOR_PARTNER_TO_CONFIRM = 4;
const PHASE_VERIFIED = 5;
const PHASE_CANCELLED = 6;

class DeviceVerifyDialog extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onSwitchToLegacyClick", () => {
      if (this._verifier) {
        this._verifier.removeListener('show_sas', this._onVerifierShowSas);

        this._verifier.cancel('User cancel');

        this._verifier = null;
      }

      this.setState({
        mode: MODE_LEGACY
      });
    });
    (0, _defineProperty2.default)(this, "_onSwitchToSasClick", () => {
      this.setState({
        mode: MODE_SAS
      });
    });
    (0, _defineProperty2.default)(this, "_onCancelClick", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onUseSasClick", async () => {
      try {
        this._verifier = this._request.beginKeyVerification(_crypto.verificationMethods.SAS);

        this._verifier.on('show_sas', this._onVerifierShowSas); // throws upon cancellation


        await this._verifier.verify();
        this.setState({
          phase: PHASE_VERIFIED
        });

        this._verifier.removeListener('show_sas', this._onVerifierShowSas);

        this._verifier = null;
      } catch (e) {
        console.log("Verification failed", e);
        this.setState({
          phase: PHASE_CANCELLED
        });
        this._verifier = null;
        this._request = null;
      }
    });
    (0, _defineProperty2.default)(this, "_onLegacyFinished", confirm => {
      if (confirm) {
        _MatrixClientPeg.MatrixClientPeg.get().setDeviceVerified(this.props.userId, this.props.device.deviceId, true);
      }

      this.props.onFinished(confirm);
    });
    (0, _defineProperty2.default)(this, "_onSasRequestClick", async () => {
      this.setState({
        phase: PHASE_WAIT_FOR_PARTNER_TO_ACCEPT
      });

      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const verifyingOwnDevice = this.props.userId === client.getUserId();

      try {
        if (!verifyingOwnDevice && _SettingsStore.default.getValue("feature_cross_signing")) {
          const roomId = await ensureDMExistsAndOpen(this.props.userId); // throws upon cancellation before having started

          const request = await client.requestVerificationDM(this.props.userId, roomId);
          await request.waitFor(r => r.ready || r.started);

          if (request.ready) {
            this._verifier = request.beginKeyVerification(_crypto.verificationMethods.SAS);
          } else {
            this._verifier = request.verifier;
          }
        } else if (verifyingOwnDevice && _SettingsStore.default.getValue("feature_cross_signing")) {
          this._request = await client.requestVerification(this.props.userId, [_crypto.verificationMethods.SAS, _QRCode.SHOW_QR_CODE_METHOD, _crypto.verificationMethods.RECIPROCATE_QR_CODE]);
          await this._request.waitFor(r => r.ready || r.started);
          this.setState({
            phase: PHASE_PICK_VERIFICATION_OPTION
          });
        } else {
          this._verifier = client.beginKeyVerification(_crypto.verificationMethods.SAS, this.props.userId, this.props.device.deviceId);
        }

        if (!this._verifier) return;

        this._verifier.on('show_sas', this._onVerifierShowSas); // throws upon cancellation


        await this._verifier.verify();
        this.setState({
          phase: PHASE_VERIFIED
        });

        this._verifier.removeListener('show_sas', this._onVerifierShowSas);

        this._verifier = null;
      } catch (e) {
        console.log("Verification failed", e);
        this.setState({
          phase: PHASE_CANCELLED
        });
        this._verifier = null;
      }
    });
    (0, _defineProperty2.default)(this, "_onSasMatchesClick", () => {
      this._showSasEvent.confirm();

      this.setState({
        phase: PHASE_WAIT_FOR_PARTNER_TO_CONFIRM
      });
    });
    (0, _defineProperty2.default)(this, "_onVerifiedDoneClick", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_onVerifierShowSas", e => {
      this._showSasEvent = e;
      this.setState({
        phase: PHASE_SHOW_SAS
      });
    });
    this._verifier = null;
    this._showSasEvent = null;
    this._request = null;
    this.state = {
      phase: PHASE_START,
      mode: MODE_SAS,
      sasVerified: false
    };
  }

  componentWillUnmount() {
    if (this._verifier) {
      this._verifier.removeListener('show_sas', this._onVerifierShowSas);

      this._verifier.cancel('User cancel');
    }
  }

  _renderSasVerification() {
    let body;

    switch (this.state.phase) {
      case PHASE_START:
        body = this._renderVerificationPhaseStart();
        break;

      case PHASE_WAIT_FOR_PARTNER_TO_ACCEPT:
        body = this._renderVerificationPhaseWaitAccept();
        break;

      case PHASE_PICK_VERIFICATION_OPTION:
        body = this._renderVerificationPhasePick();
        break;

      case PHASE_SHOW_SAS:
        body = this._renderSasVerificationPhaseShowSas();
        break;

      case PHASE_WAIT_FOR_PARTNER_TO_CONFIRM:
        body = this._renderSasVerificationPhaseWaitForPartnerToConfirm();
        break;

      case PHASE_VERIFIED:
        body = this._renderVerificationPhaseVerified();
        break;

      case PHASE_CANCELLED:
        body = this._renderVerificationPhaseCancelled();
        break;
    }

    const BaseDialog = sdk.getComponent("dialogs.BaseDialog");
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      title: (0, _languageHandler._t)("Verify session"),
      onFinished: this._onCancelClick
    }, body);
  }

  _renderVerificationPhaseStart() {
    const AccessibleButton = sdk.getComponent('views.elements.AccessibleButton');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      element: "span",
      className: "mx_linkButton",
      onClick: this._onSwitchToLegacyClick
    }, (0, _languageHandler._t)("Use Legacy Verification (for older clients)")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Verify by comparing a short text string.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("To be secure, do this in person or use a trusted way to communicate.")), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Begin Verifying'),
      hasCancel: true,
      onPrimaryButtonClick: this._onSasRequestClick,
      onCancel: this._onCancelClick
    }));
  }

  _renderVerificationPhaseWaitAccept() {
    const Spinner = sdk.getComponent("views.elements.Spinner");
    const AccessibleButton = sdk.getComponent('views.elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Spinner, null), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Waiting for partner to accept...")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Nothing appearing? Not all clients support interactive verification yet. " + "<button>Use legacy verification</button>.", {}, {
      button: sub => /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        element: "span",
        className: "mx_linkButton",
        onClick: this._onSwitchToLegacyClick
      }, sub)
    })));
  }

  _renderVerificationPhasePick() {
    return /*#__PURE__*/_react.default.createElement(_VerificationQREmojiOptions.default, {
      request: this._request,
      onCancel: this._onCancelClick,
      onStartEmoji: this._onUseSasClick
    });
  }

  _renderSasVerificationPhaseShowSas() {
    const VerificationShowSas = sdk.getComponent('views.verification.VerificationShowSas');
    return /*#__PURE__*/_react.default.createElement(VerificationShowSas, {
      sas: this._showSasEvent.sas,
      onCancel: this._onCancelClick,
      onDone: this._onSasMatchesClick,
      isSelf: _MatrixClientPeg.MatrixClientPeg.get().getUserId() === this.props.userId,
      onStartEmoji: this._onUseSasClick,
      inDialog: true
    });
  }

  _renderSasVerificationPhaseWaitForPartnerToConfirm() {
    const Spinner = sdk.getComponent('views.elements.Spinner');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Spinner, null), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Waiting for %(userId)s to confirm...", {
      userId: this.props.userId
    })));
  }

  _renderVerificationPhaseVerified() {
    const VerificationComplete = sdk.getComponent('views.verification.VerificationComplete');
    return /*#__PURE__*/_react.default.createElement(VerificationComplete, {
      onDone: this._onVerifiedDoneClick
    });
  }

  _renderVerificationPhaseCancelled() {
    const VerificationCancelled = sdk.getComponent('views.verification.VerificationCancelled');
    return /*#__PURE__*/_react.default.createElement(VerificationCancelled, {
      onDone: this._onCancelClick
    });
  }

  _renderLegacyVerification() {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    const AccessibleButton = sdk.getComponent('views.elements.AccessibleButton');
    let text;

    if (_MatrixClientPeg.MatrixClientPeg.get().getUserId() === this.props.userId) {
      text = (0, _languageHandler._t)("To verify that this session can be trusted, please check that the key you see " + "in User Settings on that device matches the key below:");
    } else {
      text = (0, _languageHandler._t)("To verify that this session can be trusted, please contact its owner using some other " + "means (e.g. in person or a phone call) and ask them whether the key they see in their User Settings " + "for this session matches the key below:");
    }

    const key = FormattingUtils.formatCryptoKey(this.props.device.getFingerprint());

    const body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      element: "span",
      className: "mx_linkButton",
      onClick: this._onSwitchToSasClick
    }, (0, _languageHandler._t)("Use two-way text verification")), /*#__PURE__*/_react.default.createElement("p", null, text), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DeviceVerifyDialog_cryptoSection"
    }, /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session name"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, this.props.device.getDisplayName())), /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session ID"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, this.props.device.deviceId))), /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session key"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, /*#__PURE__*/_react.default.createElement("b", null, key)))))), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("If it matches, press the verify button below. " + "If it doesn't, then someone else is intercepting this session " + "and you probably want to press the blacklist button instead.")));

    return /*#__PURE__*/_react.default.createElement(QuestionDialog, {
      title: (0, _languageHandler._t)("Verify session"),
      description: body,
      button: (0, _languageHandler._t)("I verify that the keys match"),
      onFinished: this._onLegacyFinished
    });
  }

  render() {
    if (this.state.mode === MODE_LEGACY) {
      return this._renderLegacyVerification();
    } else {
      return /*#__PURE__*/_react.default.createElement("div", null, this._renderSasVerification());
    }
  }

}

exports.default = DeviceVerifyDialog;
(0, _defineProperty2.default)(DeviceVerifyDialog, "propTypes", {
  userId: _propTypes.default.string.isRequired,
  device: _propTypes.default.object.isRequired,
  onFinished: _propTypes.default.func.isRequired
});

async function ensureDMExistsAndOpen(userId) {
  const roomId = await (0, _createRoom.ensureDMExists)(_MatrixClientPeg.MatrixClientPeg.get(), userId); // don't use andView and spinner in createRoom, together, they cause this dialog to close and reopen,
  // we causes us to loose the verifier and restart, and we end up having two verification requests

  _dispatcher.default.dispatch({
    action: 'view_room',
    room_id: roomId,
    should_peek: false
  });

  return roomId;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRGV2aWNlVmVyaWZ5RGlhbG9nLmpzIl0sIm5hbWVzIjpbIk1PREVfTEVHQUNZIiwiTU9ERV9TQVMiLCJQSEFTRV9TVEFSVCIsIlBIQVNFX1dBSVRfRk9SX1BBUlRORVJfVE9fQUNDRVBUIiwiUEhBU0VfUElDS19WRVJJRklDQVRJT05fT1BUSU9OIiwiUEhBU0VfU0hPV19TQVMiLCJQSEFTRV9XQUlUX0ZPUl9QQVJUTkVSX1RPX0NPTkZJUk0iLCJQSEFTRV9WRVJJRklFRCIsIlBIQVNFX0NBTkNFTExFRCIsIkRldmljZVZlcmlmeURpYWxvZyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJfdmVyaWZpZXIiLCJyZW1vdmVMaXN0ZW5lciIsIl9vblZlcmlmaWVyU2hvd1NhcyIsImNhbmNlbCIsInNldFN0YXRlIiwibW9kZSIsInByb3BzIiwib25GaW5pc2hlZCIsIl9yZXF1ZXN0IiwiYmVnaW5LZXlWZXJpZmljYXRpb24iLCJ2ZXJpZmljYXRpb25NZXRob2RzIiwiU0FTIiwib24iLCJ2ZXJpZnkiLCJwaGFzZSIsImUiLCJjb25zb2xlIiwibG9nIiwiY29uZmlybSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInNldERldmljZVZlcmlmaWVkIiwidXNlcklkIiwiZGV2aWNlIiwiZGV2aWNlSWQiLCJjbGllbnQiLCJ2ZXJpZnlpbmdPd25EZXZpY2UiLCJnZXRVc2VySWQiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJyb29tSWQiLCJlbnN1cmVETUV4aXN0c0FuZE9wZW4iLCJyZXF1ZXN0IiwicmVxdWVzdFZlcmlmaWNhdGlvbkRNIiwid2FpdEZvciIsInIiLCJyZWFkeSIsInN0YXJ0ZWQiLCJ2ZXJpZmllciIsInJlcXVlc3RWZXJpZmljYXRpb24iLCJTSE9XX1FSX0NPREVfTUVUSE9EIiwiUkVDSVBST0NBVEVfUVJfQ09ERSIsIl9zaG93U2FzRXZlbnQiLCJzdGF0ZSIsInNhc1ZlcmlmaWVkIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJfcmVuZGVyU2FzVmVyaWZpY2F0aW9uIiwiYm9keSIsIl9yZW5kZXJWZXJpZmljYXRpb25QaGFzZVN0YXJ0IiwiX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlV2FpdEFjY2VwdCIsIl9yZW5kZXJWZXJpZmljYXRpb25QaGFzZVBpY2siLCJfcmVuZGVyU2FzVmVyaWZpY2F0aW9uUGhhc2VTaG93U2FzIiwiX3JlbmRlclNhc1ZlcmlmaWNhdGlvblBoYXNlV2FpdEZvclBhcnRuZXJUb0NvbmZpcm0iLCJfcmVuZGVyVmVyaWZpY2F0aW9uUGhhc2VWZXJpZmllZCIsIl9yZW5kZXJWZXJpZmljYXRpb25QaGFzZUNhbmNlbGxlZCIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJfb25DYW5jZWxDbGljayIsIkFjY2Vzc2libGVCdXR0b24iLCJEaWFsb2dCdXR0b25zIiwiX29uU3dpdGNoVG9MZWdhY3lDbGljayIsIl9vblNhc1JlcXVlc3RDbGljayIsIlNwaW5uZXIiLCJidXR0b24iLCJzdWIiLCJfb25Vc2VTYXNDbGljayIsIlZlcmlmaWNhdGlvblNob3dTYXMiLCJzYXMiLCJfb25TYXNNYXRjaGVzQ2xpY2siLCJWZXJpZmljYXRpb25Db21wbGV0ZSIsIl9vblZlcmlmaWVkRG9uZUNsaWNrIiwiVmVyaWZpY2F0aW9uQ2FuY2VsbGVkIiwiX3JlbmRlckxlZ2FjeVZlcmlmaWNhdGlvbiIsIlF1ZXN0aW9uRGlhbG9nIiwidGV4dCIsImtleSIsIkZvcm1hdHRpbmdVdGlscyIsImZvcm1hdENyeXB0b0tleSIsImdldEZpbmdlcnByaW50IiwiX29uU3dpdGNoVG9TYXNDbGljayIsImdldERpc3BsYXlOYW1lIiwiX29uTGVnYWN5RmluaXNoZWQiLCJyZW5kZXIiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIiwib2JqZWN0IiwiZnVuYyIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwicm9vbV9pZCIsInNob3VsZF9w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a0IsZUFDRTtBQUNmMEIsRUFBQUEsTUFBTSxFQUFFOEQsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFY7QUFFZi9ELEVBQUFBLE1BQU0sRUFBRTZELG1CQUFVRyxNQUFWLENBQWlCRCxVQUZWO0FBR2YvRSxFQUFBQSxVQUFVLEVBQUU2RSxtQkFBVUksSUFBVixDQUFlRjtBQUhaLEM7O0FBa1V2QixlQUFldkQscUJBQWYsQ0FBcUNULE1BQXJDLEVBQTZDO0FBQ3pDLFFBQU1RLE1BQU0sR0FBRyxNQUFNLGdDQUFlWCxpQ0FBZ0JDLEdBQWhCLEVBQWYsRUFBc0NFLE1BQXRDLENBQXJCLENBRHlDLENBRXpDO0FBQ0E7O0FBQ0FtRSxzQkFBSUMsUUFBSixDQUFhO0FBQ1RDLElBQUFBLE1BQU0sRUFBRSxXQURDO0FBRVRDLElBQUFBLE9BQU8sRUFBRTlELE1BRkE7QUFHVCtELElBQUFBLFdBQVcsRUFBRTtBQUhKLEdBQWI7O0FBS0EsU0FBTy9ELE1BQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCAqIGFzIEZvcm1hdHRpbmdVdGlscyBmcm9tICcuLi8uLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHt2ZXJpZmljYXRpb25NZXRob2RzfSBmcm9tICdtYXRyaXgtanMtc2RrL3NyYy9jcnlwdG8nO1xuaW1wb3J0IHtlbnN1cmVETUV4aXN0c30gZnJvbSBcIi4uLy4uLy4uL2NyZWF0ZVJvb21cIjtcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5pbXBvcnQge1NIT1dfUVJfQ09ERV9NRVRIT0R9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9jcnlwdG8vdmVyaWZpY2F0aW9uL1FSQ29kZVwiO1xuaW1wb3J0IFZlcmlmaWNhdGlvblFSRW1vamlPcHRpb25zIGZyb20gXCIuLi92ZXJpZmljYXRpb24vVmVyaWZpY2F0aW9uUVJFbW9qaU9wdGlvbnNcIjtcblxuY29uc3QgTU9ERV9MRUdBQ1kgPSAnbGVnYWN5JztcbmNvbnN0IE1PREVfU0FTID0gJ3Nhcyc7XG5cbmNvbnN0IFBIQVNFX1NUQVJUID0gMDtcbmNvbnN0IFBIQVNFX1dBSVRfRk9SX1BBUlRORVJfVE9fQUNDRVBUID0gMTtcbmNvbnN0IFBIQVNFX1BJQ0tfVkVSSUZJQ0FUSU9OX09QVElPTiA9IDI7XG5jb25zdCBQSEFTRV9TSE9XX1NBUyA9IDM7XG5jb25zdCBQSEFTRV9XQUlUX0ZPUl9QQVJUTkVSX1RPX0NPTkZJUk0gPSA0O1xuY29uc3QgUEhBU0VfVkVSSUZJRUQgPSA1O1xuY29uc3QgUEhBU0VfQ0FOQ0VMTEVEID0gNjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2aWNlVmVyaWZ5RGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICB1c2VySWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgZGV2aWNlOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl92ZXJpZmllciA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Nob3dTYXNFdmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlcXVlc3QgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NUQVJULFxuICAgICAgICAgICAgbW9kZTogTU9ERV9TQVMsXG4gICAgICAgICAgICBzYXNWZXJpZmllZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl92ZXJpZmllcikge1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIucmVtb3ZlTGlzdGVuZXIoJ3Nob3dfc2FzJywgdGhpcy5fb25WZXJpZmllclNob3dTYXMpO1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIuY2FuY2VsKCdVc2VyIGNhbmNlbCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uU3dpdGNoVG9MZWdhY3lDbGljayA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3ZlcmlmaWVyKSB7XG4gICAgICAgICAgICB0aGlzLl92ZXJpZmllci5yZW1vdmVMaXN0ZW5lcignc2hvd19zYXMnLCB0aGlzLl9vblZlcmlmaWVyU2hvd1Nhcyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJpZmllci5jYW5jZWwoJ1VzZXIgY2FuY2VsJyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJpZmllciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZTogTU9ERV9MRUdBQ1l9KTtcbiAgICB9XG5cbiAgICBfb25Td2l0Y2hUb1Nhc0NsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHttb2RlOiBNT0RFX1NBU30pO1xuICAgIH1cblxuICAgIF9vbkNhbmNlbENsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH1cblxuICAgIF9vblVzZVNhc0NsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIgPSB0aGlzLl9yZXF1ZXN0LmJlZ2luS2V5VmVyaWZpY2F0aW9uKHZlcmlmaWNhdGlvbk1ldGhvZHMuU0FTKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyLm9uKCdzaG93X3NhcycsIHRoaXMuX29uVmVyaWZpZXJTaG93U2FzKTtcbiAgICAgICAgICAgIC8vIHRocm93cyB1cG9uIGNhbmNlbGxhdGlvblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fdmVyaWZpZXIudmVyaWZ5KCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwaGFzZTogUEhBU0VfVkVSSUZJRUR9KTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyLnJlbW92ZUxpc3RlbmVyKCdzaG93X3NhcycsIHRoaXMuX29uVmVyaWZpZXJTaG93U2FzKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyID0gbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJpZmljYXRpb24gZmFpbGVkXCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgcGhhc2U6IFBIQVNFX0NBTkNFTExFRCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uTGVnYWN5RmluaXNoZWQgPSAoY29uZmlybSkgPT4ge1xuICAgICAgICBpZiAoY29uZmlybSkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldERldmljZVZlcmlmaWVkKFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMudXNlcklkLCB0aGlzLnByb3BzLmRldmljZS5kZXZpY2VJZCwgdHJ1ZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGNvbmZpcm0pO1xuICAgIH1cblxuICAgIF9vblNhc1JlcXVlc3RDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfV0FJVF9GT1JfUEFSVE5FUl9UT19BQ0NFUFQsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHZlcmlmeWluZ093bkRldmljZSA9IHRoaXMucHJvcHMudXNlcklkID09PSBjbGllbnQuZ2V0VXNlcklkKCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIXZlcmlmeWluZ093bkRldmljZSAmJiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gYXdhaXQgZW5zdXJlRE1FeGlzdHNBbmRPcGVuKHRoaXMucHJvcHMudXNlcklkKTtcbiAgICAgICAgICAgICAgICAvLyB0aHJvd3MgdXBvbiBjYW5jZWxsYXRpb24gYmVmb3JlIGhhdmluZyBzdGFydGVkXG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IGF3YWl0IGNsaWVudC5yZXF1ZXN0VmVyaWZpY2F0aW9uRE0oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMudXNlcklkLCByb29tSWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXF1ZXN0LndhaXRGb3IociA9PiByLnJlYWR5IHx8IHIuc3RhcnRlZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QucmVhZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIgPSByZXF1ZXN0LmJlZ2luS2V5VmVyaWZpY2F0aW9uKHZlcmlmaWNhdGlvbk1ldGhvZHMuU0FTKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJpZmllciA9IHJlcXVlc3QudmVyaWZpZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh2ZXJpZnlpbmdPd25EZXZpY2UgJiYgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlcXVlc3QgPSBhd2FpdCBjbGllbnQucmVxdWVzdFZlcmlmaWNhdGlvbih0aGlzLnByb3BzLnVzZXJJZCwgW1xuICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25NZXRob2RzLlNBUyxcbiAgICAgICAgICAgICAgICAgICAgU0hPV19RUl9DT0RFX01FVEhPRCxcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uTWV0aG9kcy5SRUNJUFJPQ0FURV9RUl9DT0RFLFxuICAgICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVxdWVzdC53YWl0Rm9yKHIgPT4gci5yZWFkeSB8fCByLnN0YXJ0ZWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BoYXNlOiBQSEFTRV9QSUNLX1ZFUklGSUNBVElPTl9PUFRJT059KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIgPSBjbGllbnQuYmVnaW5LZXlWZXJpZmljYXRpb24oXG4gICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbk1ldGhvZHMuU0FTLCB0aGlzLnByb3BzLnVzZXJJZCwgdGhpcy5wcm9wcy5kZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5fdmVyaWZpZXIpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyLm9uKCdzaG93X3NhcycsIHRoaXMuX29uVmVyaWZpZXJTaG93U2FzKTtcbiAgICAgICAgICAgIC8vIHRocm93cyB1cG9uIGNhbmNlbGxhdGlvblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fdmVyaWZpZXIudmVyaWZ5KCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwaGFzZTogUEhBU0VfVkVSSUZJRUR9KTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyLnJlbW92ZUxpc3RlbmVyKCdzaG93X3NhcycsIHRoaXMuX29uVmVyaWZpZXJTaG93U2FzKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcmlmaWVyID0gbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJpZmljYXRpb24gZmFpbGVkXCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgcGhhc2U6IFBIQVNFX0NBTkNFTExFRCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fdmVyaWZpZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uU2FzTWF0Y2hlc0NsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLl9zaG93U2FzRXZlbnQuY29uZmlybSgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9XQUlUX0ZPUl9QQVJUTkVSX1RPX0NPTkZJUk0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblZlcmlmaWVkRG9uZUNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgfVxuXG4gICAgX29uVmVyaWZpZXJTaG93U2FzID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5fc2hvd1Nhc0V2ZW50ID0gZTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfU0hPV19TQVMsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZW5kZXJTYXNWZXJpZmljYXRpb24oKSB7XG4gICAgICAgIGxldCBib2R5O1xuICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUucGhhc2UpIHtcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfU1RBUlQ6XG4gICAgICAgICAgICAgICAgYm9keSA9IHRoaXMuX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlU3RhcnQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfV0FJVF9GT1JfUEFSVE5FUl9UT19BQ0NFUFQ6XG4gICAgICAgICAgICAgICAgYm9keSA9IHRoaXMuX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlV2FpdEFjY2VwdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9QSUNLX1ZFUklGSUNBVElPTl9PUFRJT046XG4gICAgICAgICAgICAgICAgYm9keSA9IHRoaXMuX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlUGljaygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9TSE9XX1NBUzpcbiAgICAgICAgICAgICAgICBib2R5ID0gdGhpcy5fcmVuZGVyU2FzVmVyaWZpY2F0aW9uUGhhc2VTaG93U2FzKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1dBSVRfRk9SX1BBUlRORVJfVE9fQ09ORklSTTpcbiAgICAgICAgICAgICAgICBib2R5ID0gdGhpcy5fcmVuZGVyU2FzVmVyaWZpY2F0aW9uUGhhc2VXYWl0Rm9yUGFydG5lclRvQ29uZmlybSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9WRVJJRklFRDpcbiAgICAgICAgICAgICAgICBib2R5ID0gdGhpcy5fcmVuZGVyVmVyaWZpY2F0aW9uUGhhc2VWZXJpZmllZCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9DQU5DRUxMRUQ6XG4gICAgICAgICAgICAgICAgYm9keSA9IHRoaXMuX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlQ2FuY2VsbGVkKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQmFzZURpYWxvZ1wiKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nXG4gICAgICAgICAgICAgICAgdGl0bGU9e190KFwiVmVyaWZ5IHNlc3Npb25cIil9XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5fb25DYW5jZWxDbGlja31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7Ym9keX1cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfcmVuZGVyVmVyaWZpY2F0aW9uUGhhc2VTdGFydCgpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudD1cInNwYW5cIiBjbGFzc05hbWU9XCJteF9saW5rQnV0dG9uXCIgb25DbGljaz17dGhpcy5fb25Td2l0Y2hUb0xlZ2FjeUNsaWNrfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge190KFwiVXNlIExlZ2FjeSBWZXJpZmljYXRpb24gKGZvciBvbGRlciBjbGllbnRzKVwiKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJWZXJpZnkgYnkgY29tcGFyaW5nIGEgc2hvcnQgdGV4dCBzdHJpbmcuXCIpIH1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlRvIGJlIHNlY3VyZSwgZG8gdGhpcyBpbiBwZXJzb24gb3IgdXNlIGEgdHJ1c3RlZCB3YXkgdG8gY29tbXVuaWNhdGUuXCIpfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdCgnQmVnaW4gVmVyaWZ5aW5nJyl9XG4gICAgICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uU2FzUmVxdWVzdENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWxDbGlja31cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlV2FpdEFjY2VwdCgpIHtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5lbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgICAgICAgPHA+e190KFwiV2FpdGluZyBmb3IgcGFydG5lciB0byBhY2NlcHQuLi5cIil9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJOb3RoaW5nIGFwcGVhcmluZz8gTm90IGFsbCBjbGllbnRzIHN1cHBvcnQgaW50ZXJhY3RpdmUgdmVyaWZpY2F0aW9uIHlldC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxidXR0b24+VXNlIGxlZ2FjeSB2ZXJpZmljYXRpb248L2J1dHRvbj4uXCIsXG4gICAgICAgICAgICAgICAgICAgIHt9LCB7YnV0dG9uOiBzdWIgPT4gPEFjY2Vzc2libGVCdXR0b24gZWxlbWVudD0nc3BhbicgY2xhc3NOYW1lPVwibXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblN3aXRjaFRvTGVnYWN5Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzdWJ9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj59LFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlUGljaygpIHtcbiAgICAgICAgcmV0dXJuIDxWZXJpZmljYXRpb25RUkVtb2ppT3B0aW9uc1xuICAgICAgICAgICAgcmVxdWVzdD17dGhpcy5fcmVxdWVzdH1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLl9vbkNhbmNlbENsaWNrfVxuICAgICAgICAgICAgb25TdGFydEVtb2ppPXt0aGlzLl9vblVzZVNhc0NsaWNrfVxuICAgICAgICAvPjtcbiAgICB9XG5cbiAgICBfcmVuZGVyU2FzVmVyaWZpY2F0aW9uUGhhc2VTaG93U2FzKCkge1xuICAgICAgICBjb25zdCBWZXJpZmljYXRpb25TaG93U2FzID0gc2RrLmdldENvbXBvbmVudCgndmlld3MudmVyaWZpY2F0aW9uLlZlcmlmaWNhdGlvblNob3dTYXMnKTtcbiAgICAgICAgcmV0dXJuIDxWZXJpZmljYXRpb25TaG93U2FzXG4gICAgICAgICAgICBzYXM9e3RoaXMuX3Nob3dTYXNFdmVudC5zYXN9XG4gICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25DYW5jZWxDbGlja31cbiAgICAgICAgICAgIG9uRG9uZT17dGhpcy5fb25TYXNNYXRjaGVzQ2xpY2t9XG4gICAgICAgICAgICBpc1NlbGY9e01hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSA9PT0gdGhpcy5wcm9wcy51c2VySWR9XG4gICAgICAgICAgICBvblN0YXJ0RW1vamk9e3RoaXMuX29uVXNlU2FzQ2xpY2t9XG4gICAgICAgICAgICBpbkRpYWxvZz17dHJ1ZX1cbiAgICAgICAgLz47XG4gICAgfVxuXG4gICAgX3JlbmRlclNhc1ZlcmlmaWNhdGlvblBoYXNlV2FpdEZvclBhcnRuZXJUb0NvbmZpcm0oKSB7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5TcGlubmVyJyk7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIldhaXRpbmcgZm9yICUodXNlcklkKXMgdG8gY29uZmlybS4uLlwiLCB7dXNlcklkOiB0aGlzLnByb3BzLnVzZXJJZH0sXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cblxuICAgIF9yZW5kZXJWZXJpZmljYXRpb25QaGFzZVZlcmlmaWVkKCkge1xuICAgICAgICBjb25zdCBWZXJpZmljYXRpb25Db21wbGV0ZSA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLnZlcmlmaWNhdGlvbi5WZXJpZmljYXRpb25Db21wbGV0ZScpO1xuICAgICAgICByZXR1cm4gPFZlcmlmaWNhdGlvbkNvbXBsZXRlIG9uRG9uZT17dGhpcy5fb25WZXJpZmllZERvbmVDbGlja30gLz47XG4gICAgfVxuXG4gICAgX3JlbmRlclZlcmlmaWNhdGlvblBoYXNlQ2FuY2VsbGVkKCkge1xuICAgICAgICBjb25zdCBWZXJpZmljYXRpb25DYW5jZWxsZWQgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy52ZXJpZmljYXRpb24uVmVyaWZpY2F0aW9uQ2FuY2VsbGVkJyk7XG4gICAgICAgIHJldHVybiA8VmVyaWZpY2F0aW9uQ2FuY2VsbGVkIG9uRG9uZT17dGhpcy5fb25DYW5jZWxDbGlja30gLz47XG4gICAgfVxuXG4gICAgX3JlbmRlckxlZ2FjeVZlcmlmaWNhdGlvbigpIHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcblxuICAgICAgICBsZXQgdGV4dDtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSA9PT0gdGhpcy5wcm9wcy51c2VySWQpIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIlRvIHZlcmlmeSB0aGF0IHRoaXMgc2Vzc2lvbiBjYW4gYmUgdHJ1c3RlZCwgcGxlYXNlIGNoZWNrIHRoYXQgdGhlIGtleSB5b3Ugc2VlIFwiICtcbiAgICAgICAgICAgICAgICBcImluIFVzZXIgU2V0dGluZ3Mgb24gdGhhdCBkZXZpY2UgbWF0Y2hlcyB0aGUga2V5IGJlbG93OlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIlRvIHZlcmlmeSB0aGF0IHRoaXMgc2Vzc2lvbiBjYW4gYmUgdHJ1c3RlZCwgcGxlYXNlIGNvbnRhY3QgaXRzIG93bmVyIHVzaW5nIHNvbWUgb3RoZXIgXCIgK1xuICAgICAgICAgICAgICAgIFwibWVhbnMgKGUuZy4gaW4gcGVyc29uIG9yIGEgcGhvbmUgY2FsbCkgYW5kIGFzayB0aGVtIHdoZXRoZXIgdGhlIGtleSB0aGV5IHNlZSBpbiB0aGVpciBVc2VyIFNldHRpbmdzIFwiICtcbiAgICAgICAgICAgICAgICBcImZvciB0aGlzIHNlc3Npb24gbWF0Y2hlcyB0aGUga2V5IGJlbG93OlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleSA9IEZvcm1hdHRpbmdVdGlscy5mb3JtYXRDcnlwdG9LZXkodGhpcy5wcm9wcy5kZXZpY2UuZ2V0RmluZ2VycHJpbnQoKSk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9XCJzcGFuXCIgY2xhc3NOYW1lPVwibXhfbGlua0J1dHRvblwiIG9uQ2xpY2s9e3RoaXMuX29uU3dpdGNoVG9TYXNDbGlja31cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlVzZSB0d28td2F5IHRleHQgdmVyaWZpY2F0aW9uXCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0IH1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZpY2VWZXJpZnlEaWFsb2dfY3J5cHRvU2VjdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGxhYmVsPnsgX3QoXCJTZXNzaW9uIG5hbWVcIikgfTo8L2xhYmVsPiA8c3Bhbj57IHRoaXMucHJvcHMuZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgfTwvc3Bhbj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxsYWJlbD57IF90KFwiU2Vzc2lvbiBJRFwiKSB9OjwvbGFiZWw+IDxzcGFuPjxjb2RlPnsgdGhpcy5wcm9wcy5kZXZpY2UuZGV2aWNlSWQgfTwvY29kZT48L3NwYW4+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48bGFiZWw+eyBfdChcIlNlc3Npb24ga2V5XCIpIH06PC9sYWJlbD4gPHNwYW4+PGNvZGU+PGI+eyBrZXkgfTwvYj48L2NvZGU+PC9zcGFuPjwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJJZiBpdCBtYXRjaGVzLCBwcmVzcyB0aGUgdmVyaWZ5IGJ1dHRvbiBiZWxvdy4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJJZiBpdCBkb2Vzbid0LCB0aGVuIHNvbWVvbmUgZWxzZSBpcyBpbnRlcmNlcHRpbmcgdGhpcyBzZXNzaW9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYW5kIHlvdSBwcm9iYWJseSB3YW50IHRvIHByZXNzIHRoZSBibGFja2xpc3QgYnV0dG9uIGluc3RlYWQuXCIpIH1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPFF1ZXN0aW9uRGlhbG9nXG4gICAgICAgICAgICAgICAgdGl0bGU9e190KFwiVmVyaWZ5IHNlc3Npb25cIil9XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb249e2JvZHl9XG4gICAgICAgICAgICAgICAgYnV0dG9uPXtfdChcIkkgdmVyaWZ5IHRoYXQgdGhlIGtleXMgbWF0Y2hcIil9XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5fb25MZWdhY3lGaW5pc2hlZH1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5tb2RlID09PSBNT0RFX0xFR0FDWSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckxlZ2FjeVZlcmlmaWNhdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclNhc1ZlcmlmaWNhdGlvbigpfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVETUV4aXN0c0FuZE9wZW4odXNlcklkKSB7XG4gICAgY29uc3Qgcm9vbUlkID0gYXdhaXQgZW5zdXJlRE1FeGlzdHMoTWF0cml4Q2xpZW50UGVnLmdldCgpLCB1c2VySWQpO1xuICAgIC8vIGRvbid0IHVzZSBhbmRWaWV3IGFuZCBzcGlubmVyIGluIGNyZWF0ZVJvb20sIHRvZ2V0aGVyLCB0aGV5IGNhdXNlIHRoaXMgZGlhbG9nIHRvIGNsb3NlIGFuZCByZW9wZW4sXG4gICAgLy8gd2UgY2F1c2VzIHVzIHRvIGxvb3NlIHRoZSB2ZXJpZmllciBhbmQgcmVzdGFydCwgYW5kIHdlIGVuZCB1cCBoYXZpbmcgdHdvIHZlcmlmaWNhdGlvbiByZXF1ZXN0c1xuICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgc2hvdWxkX3BlZWs6IGZhbHNlLFxuICAgIH0pO1xuICAgIHJldHVybiByb29tSWQ7XG59XG4iXX0=