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

var _crypto = require("matrix-js-sdk/src/crypto");

var _QRCode = require("matrix-js-sdk/src/crypto/verification/QRCode");

var _VerificationQRCode = _interopRequireDefault(require("../elements/crypto/VerificationQRCode"));

var _languageHandler = require("../../../languageHandler");

var _E2EIcon = _interopRequireDefault(require("../rooms/E2EIcon"));

var _VerificationRequest = require("matrix-js-sdk/src/crypto/verification/request/VerificationRequest");

var _Spinner = _interopRequireDefault(require("../elements/Spinner"));

/*
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
class VerificationPanel extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onReciprocateYesClick", () => {
      this.setState({
        reciprocateButtonClicked: true
      });
      this.state.reciprocateQREvent.confirm();
    });
    (0, _defineProperty2.default)(this, "_onReciprocateNoClick", () => {
      this.setState({
        reciprocateButtonClicked: true
      });
      this.state.reciprocateQREvent.cancel();
    });
    (0, _defineProperty2.default)(this, "_startSAS", async () => {
      this.setState({
        emojiButtonClicked: true
      });
      const verifier = this.props.request.beginKeyVerification(_crypto.verificationMethods.SAS);

      try {
        await verifier.verify();
      } catch (err) {
        console.error(err);
      }
    });
    (0, _defineProperty2.default)(this, "_onSasMatchesClick", () => {
      this.state.sasEvent.confirm();
    });
    (0, _defineProperty2.default)(this, "_onSasMismatchesClick", () => {
      this.state.sasEvent.mismatch();
    });
    (0, _defineProperty2.default)(this, "_updateVerifierState", () => {
      const {
        request
      } = this.props;
      const {
        sasEvent,
        reciprocateQREvent
      } = request.verifier;
      request.verifier.off('show_sas', this._updateVerifierState);
      request.verifier.off('show_reciprocate_qr', this._updateVerifierState);
      this.setState({
        sasEvent,
        reciprocateQREvent
      });
    });
    (0, _defineProperty2.default)(this, "_onRequestChange", async () => {
      const {
        request
      } = this.props;
      const hadVerifier = this._hasVerifier;
      this._hasVerifier = !!request.verifier;

      if (!hadVerifier && this._hasVerifier) {
        request.verifier.on('show_sas', this._updateVerifierState);
        request.verifier.on('show_reciprocate_qr', this._updateVerifierState);

        try {
          // on the requester side, this is also awaited in _startSAS,
          // but that's ok as verify should return the same promise.
          await request.verifier.verify();
        } catch (err) {
          console.error("error verify", err);
        }
      }
    });
    this.state = {};
    this._hasVerifier = false;
  }

  renderQRPhase() {
    const {
      member,
      request
    } = this.props;
    const showSAS = request.otherPartySupportsMethod(_crypto.verificationMethods.SAS);
    const showQR = request.otherPartySupportsMethod(_QRCode.SCAN_QR_CODE_METHOD);
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const noCommonMethodError = !showSAS && !showQR ? /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("The session you are trying to verify doesn't support scanning a QR code or emoji verification, which is what Riot supports. Try with a different client.")) : null;

    if (this.props.layout === 'dialog') {
      // HACK: This is a terrible idea.
      let qrBlock;
      let sasBlock;

      if (showQR) {
        qrBlock = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_VerificationPanel_QRPhase_startOption"
        }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Scan this unique code")), /*#__PURE__*/_react.default.createElement(_VerificationQRCode.default, {
          qrCodeData: request.qrCodeData
        }));
      }

      if (showSAS) {
        sasBlock = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_VerificationPanel_QRPhase_startOption"
        }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Compare unique emoji")), /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_VerificationPanel_QRPhase_helpText"
        }, (0, _languageHandler._t)("Compare a unique set of emoji if you don't have a camera on either device")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          disabled: this.state.emojiButtonClicked,
          onClick: this._startSAS,
          kind: "primary"
        }, (0, _languageHandler._t)("Start")));
      }

      const or = qrBlock && sasBlock ? /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationPanel_QRPhase_betweenText"
      }, (0, _languageHandler._t)("or")) : null;
      return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Verify this session by completing one of the following:"), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationPanel_QRPhase_startOptions"
      }, qrBlock, or, sasBlock, noCommonMethodError));
    }

    let qrBlock;

    if (showQR) {
      qrBlock = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UserInfo_container"
      }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verify by scanning")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Ask %(displayName)s to scan your code:", {
        displayName: member.displayName || member.name || member.userId
      })), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationPanel_qrCode"
      }, /*#__PURE__*/_react.default.createElement(_VerificationQRCode.default, {
        qrCodeData: request.qrCodeData
      })));
    }

    let sasBlock;

    if (showSAS) {
      const disabled = this.state.emojiButtonClicked;
      const sasLabel = showQR ? (0, _languageHandler._t)("If you can't scan the code above, verify by comparing unique emoji.") : (0, _languageHandler._t)("Verify by comparing unique emoji."); // Note: mx_VerificationPanel_verifyByEmojiButton is for the end-to-end tests

      sasBlock = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UserInfo_container"
      }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verify by emoji")), /*#__PURE__*/_react.default.createElement("p", null, sasLabel), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        disabled: disabled,
        kind: "primary",
        className: "mx_UserInfo_wideButton mx_VerificationPanel_verifyByEmojiButton",
        onClick: this._startSAS
      }, (0, _languageHandler._t)("Verify by emoji")));
    }

    const noCommonMethodBlock = noCommonMethodError ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_container"
    }, noCommonMethodError) : null; // TODO: add way to open camera to scan a QR code

    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, qrBlock, sasBlock, noCommonMethodBlock);
  }

  _getDevice() {
    const deviceId = this.props.request && this.props.request.channel.deviceId;
    return _MatrixClientPeg.MatrixClientPeg.get().getStoredDevice(_MatrixClientPeg.MatrixClientPeg.get().getUserId(), deviceId);
  }

  renderQRReciprocatePhase() {
    const {
      member,
      request
    } = this.props;
    let Button; // a bit of a hack, but the FormButton should only be used in the right panel
    // they should probably just be the same component with a css class applied to it?

    if (this.props.inDialog) {
      Button = sdk.getComponent("elements.AccessibleButton");
    } else {
      Button = sdk.getComponent("elements.FormButton");
    }

    const description = request.isSelfVerification ? (0, _languageHandler._t)("Almost there! Is your other session showing the same shield?") : (0, _languageHandler._t)("Almost there! Is %(displayName)s showing the same shield?", {
      displayName: member.displayName || member.name || member.userId
    });
    let body;

    if (this.state.reciprocateQREvent) {
      // riot web doesn't support scanning yet, so assume here we're the client being scanned.
      //
      // we're passing both a label and a child string to Button as
      // FormButton and AccessibleButton expect this differently
      body = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("p", null, description), /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
        isUser: true,
        status: "verified",
        size: 128,
        hideTooltip: true
      }), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationPanel_reciprocateButtons"
      }, /*#__PURE__*/_react.default.createElement(Button, {
        label: (0, _languageHandler._t)("No"),
        kind: "danger",
        disabled: this.state.reciprocateButtonClicked,
        onClick: this._onReciprocateNoClick
      }, (0, _languageHandler._t)("No")), /*#__PURE__*/_react.default.createElement(Button, {
        label: (0, _languageHandler._t)("Yes"),
        kind: "primary",
        disabled: this.state.reciprocateButtonClicked,
        onClick: this._onReciprocateYesClick
      }, (0, _languageHandler._t)("Yes"))));
    } else {
      body = /*#__PURE__*/_react.default.createElement("p", null, /*#__PURE__*/_react.default.createElement(_Spinner.default, null));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_container mx_VerificationPanel_reciprocate_section"
    }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verify by scanning")), body);
  }

  renderVerifiedPhase() {
    const {
      member,
      request
    } = this.props;
    let text;

    if (!request.isSelfVerification) {
      if (this.props.isRoomEncrypted) {
        text = (0, _languageHandler._t)("Verify all users in a room to ensure it's secure.");
      } else {
        text = (0, _languageHandler._t)("In encrypted rooms, verify all users to ensure it’s secure.");
      }
    }

    let description;

    if (request.isSelfVerification) {
      const device = this._getDevice();

      if (!device) {
        // This can happen if the device is logged out while we're still showing verification
        // UI for it.
        console.warn("Verified device we don't know about: " + this.props.request.channel.deviceId);
        description = (0, _languageHandler._t)("You've successfully verified your device!");
      } else {
        description = (0, _languageHandler._t)("You've successfully verified %(deviceName)s (%(deviceId)s)!", {
          deviceName: device ? device.getDisplayName() : '',
          deviceId: this.props.request.channel.deviceId
        });
      }
    } else {
      description = (0, _languageHandler._t)("You've successfully verified %(displayName)s!", {
        displayName: member.displayName || member.name || member.userId
      });
    }

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_container mx_VerificationPanel_verified_section"
    }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verified")), /*#__PURE__*/_react.default.createElement("p", null, description), /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
      isUser: true,
      status: "verified",
      size: 128,
      hideTooltip: true
    }), text ? /*#__PURE__*/_react.default.createElement("p", null, text) : null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      className: "mx_UserInfo_wideButton",
      onClick: this.props.onClose
    }, (0, _languageHandler._t)("Got it")));
  }

  renderCancelledPhase() {
    const {
      member,
      request
    } = this.props;
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let startAgainInstruction;

    if (request.isSelfVerification) {
      startAgainInstruction = (0, _languageHandler._t)("Start verification again from the notification.");
    } else {
      startAgainInstruction = (0, _languageHandler._t)("Start verification again from their profile.");
    }

    let text;

    if (request.cancellationCode === "m.timeout") {
      text = (0, _languageHandler._t)("Verification timed out.") + " ".concat(startAgainInstruction);
    } else if (request.cancellingUserId === request.otherUserId) {
      if (request.isSelfVerification) {
        text = (0, _languageHandler._t)("You cancelled verification on your other session.");
      } else {
        text = (0, _languageHandler._t)("%(displayName)s cancelled verification.", {
          displayName: member.displayName || member.name || member.userId
        });
      }

      text = "".concat(text, " ").concat(startAgainInstruction);
    } else {
      text = (0, _languageHandler._t)("You cancelled verification.") + " ".concat(startAgainInstruction);
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_container"
    }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verification cancelled")), /*#__PURE__*/_react.default.createElement("p", null, text), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      className: "mx_UserInfo_wideButton",
      onClick: this.props.onClose
    }, (0, _languageHandler._t)("Got it")));
  }

  render() {
    const {
      member,
      phase,
      request
    } = this.props;
    const displayName = member.displayName || member.name || member.userId;

    switch (phase) {
      case _VerificationRequest.PHASE_READY:
        return this.renderQRPhase();

      case _VerificationRequest.PHASE_STARTED:
        switch (request.chosenMethod) {
          case _crypto.verificationMethods.RECIPROCATE_QR_CODE:
            return this.renderQRReciprocatePhase();

          case _crypto.verificationMethods.SAS:
            {
              const VerificationShowSas = sdk.getComponent('views.verification.VerificationShowSas');
              const emojis = this.state.sasEvent ? /*#__PURE__*/_react.default.createElement(VerificationShowSas, {
                displayName: displayName,
                device: this._getDevice(),
                sas: this.state.sasEvent.sas,
                onCancel: this._onSasMismatchesClick,
                onDone: this._onSasMatchesClick,
                inDialog: this.props.inDialog,
                isSelf: request.isSelfVerification
              }) : /*#__PURE__*/_react.default.createElement(_Spinner.default, null);
              return /*#__PURE__*/_react.default.createElement("div", {
                className: "mx_UserInfo_container"
              }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Compare emoji")), emojis);
            }

          default:
            return null;
        }

      case _VerificationRequest.PHASE_DONE:
        return this.renderVerifiedPhase();

      case _VerificationRequest.PHASE_CANCELLED:
        return this.renderCancelledPhase();
    }

    console.error("VerificationPanel unhandled phase:", phase);
    return null;
  }

  componentDidMount() {
    const {
      request
    } = this.props;
    request.on("change", this._onRequestChange);

    if (request.verifier) {
      const {
        request
      } = this.props;
      const {
        sasEvent,
        reciprocateQREvent
      } = request.verifier;
      this.setState({
        sasEvent,
        reciprocateQREvent
      });
    }

    this._onRequestChange();
  }

  componentWillUnmount() {
    const {
      request
    } = this.props;

    if (request.verifier) {
      request.verifier.off('show_sas', this._updateVerifierState);
      request.verifier.off('show_reciprocate_qr', this._updateVerifierState);
    }

    request.off("change", this._onRequestChange);
  }

}

exports.default = VerificationPanel;
(0, _defineProperty2.default)(VerificationPanel, "propTypes", {
  layout: _propTypes.default.string,
  request: _propTypes.default.object.isRequired,
  member: _propTypes.default.object.isRequired,
  phase: _propTypes.default.oneOf([_VerificationRequest.PHASE_UNSENT, _VerificationRequest.PHASE_REQUESTED, _VerificationRequest.PHASE_READY, _VerificationRequest.PHASE_STARTED, _VerificationRequest.PHASE_CANCELLED, _VerificationRequest.PHASE_DONE]).isRequired,
  onClose: _propTypes.default.func.isRequired,
  isRoomEncrypted: _propTypes.default.bool
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3JpZ2h0X3BhbmVsL1ZlcmlmaWNhdGlvblBhbmVsLmpzIl0sIm5hbWVzIjpbIlZlcmlmaWNhdGlvblBhbmVsIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInNldFN0YXRlIiwicmVjaXByb2NhdGVCdXR0b25DbGlja2VkIiwic3RhdGUiLCJyZWNpcHJvY2F0ZVFSRXZlbnQiLCJjb25maXJtIiwiY2FuY2VsIiwiZW1vamlCdXR0b25DbGlja2VkIiwidmVyaWZpZXIiLCJyZXF1ZXN0IiwiYmVnaW5LZXlWZXJpZmljYXRpb24iLCJ2ZXJpZmljYXRpb25NZXRob2RzIiwiU0FTIiwidmVyaWZ5IiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwic2FzRXZlbnQiLCJtaXNtYXRjaCIsIm9mZiIsIl91cGRhdGVWZXJpZmllclN0YXRlIiwiaGFkVmVyaWZpZXIiLCJfaGFzVmVyaWZpZXIiLCJvbiIsInJlbmRlclFSUGhhc2UiLCJtZW1iZXIiLCJzaG93U0FTIiwib3RoZXJQYXJ0eVN1cHBvcnRzTWV0aG9kIiwic2hvd1FSIiwiU0NBTl9RUl9DT0RFX01FVEhPRCIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJub0NvbW1vbk1ldGhvZEVycm9yIiwibGF5b3V0IiwicXJCbG9jayIsInNhc0Jsb2NrIiwicXJDb2RlRGF0YSIsIl9zdGFydFNBUyIsIm9yIiwiZGlzcGxheU5hbWUiLCJuYW1lIiwidXNlcklkIiwiZGlzYWJsZWQiLCJzYXNMYWJlbCIsIm5vQ29tbW9uTWV0aG9kQmxvY2siLCJfZ2V0RGV2aWNlIiwiZGV2aWNlSWQiLCJjaGFubmVsIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0U3RvcmVkRGV2aWNlIiwiZ2V0VXNlcklkIiwicmVuZGVyUVJSZWNpcHJvY2F0ZVBoYXNlIiwiQnV0dG9uIiwiaW5EaWFsb2ciLCJkZXNjcmlwdGlvbiIsImlzU2VsZlZlcmlmaWNhdGlvbiIsImJvZHkiLCJfb25SZWNpcHJvY2F0ZU5vQ2xpY2siLCJfb25SZWNpcHJvY2F0ZVllc0NsaWNrIiwicmVuZGVyVmVyaWZpZWRQaGFzZSIsInRleHQiLCJpc1Jvb21FbmNyeXB0ZWQiLCJkZXZpY2UiLCJ3YXJuIiwiZGV2aWNlTmFtZSIsImdldERpc3BsYXlOYW1lIiwib25DbG9zZSIsInJlbmRlckNhbmNlbGxlZFBoYXNlIiwic3RhcnRBZ2Fpbkluc3RydWN0aW9uIiwiY2FuY2VsbGF0aW9uQ29kZSIsImNhbmNlbGxpbmdVc2VySWQiLCJvdGhlclVzZXJJZCIsInJlbmRlciIsInBoYXNlIiwiUEhBU0VfUkVBRFkiLCJQSEFTRV9TVEFSVEVEIiwiY2hvc2VuTWV0aG9kIiwiUkVDSVBST0NBVEVfUVJfQ09ERSIsIlZlcmlmaWNhdGlvblNob3dTYXMiLCJlbW9qaXMiLCJzYXMiLCJfb25TYXNNaXNtYXRjaGVzQ2xpY2siLCJfb25TYXNNYXRjaGVzQ2xpY2siLCJQSEFTRV9ET05FIiwiUEhBU0VfQ0FOQ0VMTEVEIiwiY29tcG9uZW50RGlkTW91bnQiLCJfb25SZXF1ZXN0Q2hhbmdlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwib25lT2YiLCJQSEFTRV9VTlNFTlQiLCJQSEFTRV9SRVFVRVNURUQiLCJmdW5jIiwiYm9vbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFRQTs7QUFuQ0E7Ozs7Ozs7Ozs7Ozs7OztBQXFDZSxNQUFNQSxpQkFBTixTQUFnQ0MsZUFBTUMsYUFBdEMsQ0FBb0Q7QUFpQi9EQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSxrRUFvR00sTUFBTTtBQUMzQixXQUFLQyxRQUFMLENBQWM7QUFBQ0MsUUFBQUEsd0JBQXdCLEVBQUU7QUFBM0IsT0FBZDtBQUNBLFdBQUtDLEtBQUwsQ0FBV0Msa0JBQVgsQ0FBOEJDLE9BQTlCO0FBQ0gsS0F2R2tCO0FBQUEsaUVBeUdLLE1BQU07QUFDMUIsV0FBS0osUUFBTCxDQUFjO0FBQUNDLFFBQUFBLHdCQUF3QixFQUFFO0FBQTNCLE9BQWQ7QUFDQSxXQUFLQyxLQUFMLENBQVdDLGtCQUFYLENBQThCRSxNQUE5QjtBQUNILEtBNUdrQjtBQUFBLHFEQThSUCxZQUFZO0FBQ3BCLFdBQUtMLFFBQUwsQ0FBYztBQUFDTSxRQUFBQSxrQkFBa0IsRUFBRTtBQUFyQixPQUFkO0FBQ0EsWUFBTUMsUUFBUSxHQUFHLEtBQUtSLEtBQUwsQ0FBV1MsT0FBWCxDQUFtQkMsb0JBQW5CLENBQXdDQyw0QkFBb0JDLEdBQTVELENBQWpCOztBQUNBLFVBQUk7QUFDQSxjQUFNSixRQUFRLENBQUNLLE1BQVQsRUFBTjtBQUNILE9BRkQsQ0FFRSxPQUFPQyxHQUFQLEVBQVk7QUFDVkMsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLEdBQWQ7QUFDSDtBQUNKLEtBdFNrQjtBQUFBLDhEQXdTRSxNQUFNO0FBQ3ZCLFdBQUtYLEtBQUwsQ0FBV2MsUUFBWCxDQUFvQlosT0FBcEI7QUFDSCxLQTFTa0I7QUFBQSxpRUE0U0ssTUFBTTtBQUMxQixXQUFLRixLQUFMLENBQVdjLFFBQVgsQ0FBb0JDLFFBQXBCO0FBQ0gsS0E5U2tCO0FBQUEsZ0VBZ1RJLE1BQU07QUFDekIsWUFBTTtBQUFDVCxRQUFBQTtBQUFELFVBQVksS0FBS1QsS0FBdkI7QUFDQSxZQUFNO0FBQUNpQixRQUFBQSxRQUFEO0FBQVdiLFFBQUFBO0FBQVgsVUFBaUNLLE9BQU8sQ0FBQ0QsUUFBL0M7QUFDQUMsTUFBQUEsT0FBTyxDQUFDRCxRQUFSLENBQWlCVyxHQUFqQixDQUFxQixVQUFyQixFQUFpQyxLQUFLQyxvQkFBdEM7QUFDQVgsTUFBQUEsT0FBTyxDQUFDRCxRQUFSLENBQWlCVyxHQUFqQixDQUFxQixxQkFBckIsRUFBNEMsS0FBS0Msb0JBQWpEO0FBQ0EsV0FBS25CLFFBQUwsQ0FBYztBQUFDZ0IsUUFBQUEsUUFBRDtBQUFXYixRQUFBQTtBQUFYLE9BQWQ7QUFDSCxLQXRUa0I7QUFBQSw0REF3VEEsWUFBWTtBQUMzQixZQUFNO0FBQUNLLFFBQUFBO0FBQUQsVUFBWSxLQUFLVCxLQUF2QjtBQUNBLFlBQU1xQixXQUFXLEdBQUcsS0FBS0MsWUFBekI7QUFDQSxXQUFLQSxZQUFMLEdBQW9CLENBQUMsQ0FBQ2IsT0FBTyxDQUFDRCxRQUE5Qjs7QUFDQSxVQUFJLENBQUNhLFdBQUQsSUFBZ0IsS0FBS0MsWUFBekIsRUFBdUM7QUFDbkNiLFFBQUFBLE9BQU8sQ0FBQ0QsUUFBUixDQUFpQmUsRUFBakIsQ0FBb0IsVUFBcEIsRUFBZ0MsS0FBS0gsb0JBQXJDO0FBQ0FYLFFBQUFBLE9BQU8sQ0FBQ0QsUUFBUixDQUFpQmUsRUFBakIsQ0FBb0IscUJBQXBCLEVBQTJDLEtBQUtILG9CQUFoRDs7QUFDQSxZQUFJO0FBQ0E7QUFDQTtBQUNBLGdCQUFNWCxPQUFPLENBQUNELFFBQVIsQ0FBaUJLLE1BQWpCLEVBQU47QUFDSCxTQUpELENBSUUsT0FBT0MsR0FBUCxFQUFZO0FBQ1ZDLFVBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLGNBQWQsRUFBOEJGLEdBQTlCO0FBQ0g7QUFDSjtBQUNKLEtBdlVrQjtBQUVmLFNBQUtYLEtBQUwsR0FBYSxFQUFiO0FBQ0EsU0FBS21CLFlBQUwsR0FBb0IsS0FBcEI7QUFDSDs7QUFFREUsRUFBQUEsYUFBYSxHQUFHO0FBQ1osVUFBTTtBQUFDQyxNQUFBQSxNQUFEO0FBQVNoQixNQUFBQTtBQUFULFFBQW9CLEtBQUtULEtBQS9CO0FBQ0EsVUFBTTBCLE9BQU8sR0FBR2pCLE9BQU8sQ0FBQ2tCLHdCQUFSLENBQWlDaEIsNEJBQW9CQyxHQUFyRCxDQUFoQjtBQUNBLFVBQU1nQixNQUFNLEdBQUduQixPQUFPLENBQUNrQix3QkFBUixDQUFpQ0UsMkJBQWpDLENBQWY7QUFDQSxVQUFNQyxnQkFBZ0IsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDJCQUFqQixDQUF6QjtBQUVBLFVBQU1DLG1CQUFtQixHQUFHLENBQUNQLE9BQUQsSUFBWSxDQUFDRSxNQUFiLGdCQUN4Qix3Q0FBSSx5QkFBRywwSkFBSCxDQUFKLENBRHdCLEdBRXhCLElBRko7O0FBSUEsUUFBSSxLQUFLNUIsS0FBTCxDQUFXa0MsTUFBWCxLQUFzQixRQUExQixFQUFvQztBQUNoQztBQUNBLFVBQUlDLE9BQUo7QUFDQSxVQUFJQyxRQUFKOztBQUNBLFVBQUlSLE1BQUosRUFBWTtBQUNSTyxRQUFBQSxPQUFPLGdCQUNIO0FBQUssVUFBQSxTQUFTLEVBQUM7QUFBZix3QkFDSSx3Q0FBSSx5QkFBRyx1QkFBSCxDQUFKLENBREosZUFFSSw2QkFBQywyQkFBRDtBQUFvQixVQUFBLFVBQVUsRUFBRTFCLE9BQU8sQ0FBQzRCO0FBQXhDLFVBRkosQ0FESjtBQUtIOztBQUNELFVBQUlYLE9BQUosRUFBYTtBQUNUVSxRQUFBQSxRQUFRLGdCQUNKO0FBQUssVUFBQSxTQUFTLEVBQUM7QUFBZix3QkFDSSx3Q0FBSSx5QkFBRyxzQkFBSCxDQUFKLENBREosZUFFSTtBQUFNLFVBQUEsU0FBUyxFQUFDO0FBQWhCLFdBQXlELHlCQUFHLDJFQUFILENBQXpELENBRkosZUFHSSw2QkFBQyxnQkFBRDtBQUFrQixVQUFBLFFBQVEsRUFBRSxLQUFLakMsS0FBTCxDQUFXSSxrQkFBdkM7QUFBMkQsVUFBQSxPQUFPLEVBQUUsS0FBSytCLFNBQXpFO0FBQW9GLFVBQUEsSUFBSSxFQUFDO0FBQXpGLFdBQ0sseUJBQUcsT0FBSCxDQURMLENBSEosQ0FESjtBQVFIOztBQUNELFlBQU1DLEVBQUUsR0FBR0osT0FBTyxJQUFJQyxRQUFYLGdCQUNQO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUEyRCx5QkFBRyxJQUFILENBQTNELENBRE8sR0FDc0UsSUFEakY7QUFFQSwwQkFDSSwwQ0FDSyx5QkFBRyx5REFBSCxDQURMLGVBRUk7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLFNBQ0tELE9BREwsRUFFS0ksRUFGTCxFQUdLSCxRQUhMLEVBSUtILG1CQUpMLENBRkosQ0FESjtBQVdIOztBQUVELFFBQUlFLE9BQUo7O0FBQ0EsUUFBSVAsTUFBSixFQUFZO0FBQ1JPLE1BQUFBLE9BQU8sZ0JBQUc7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLHNCQUNOLHlDQUFLLHlCQUFHLG9CQUFILENBQUwsQ0FETSxlQUVOLHdDQUFJLHlCQUFHLHdDQUFILEVBQTZDO0FBQzdDSyxRQUFBQSxXQUFXLEVBQUVmLE1BQU0sQ0FBQ2UsV0FBUCxJQUFzQmYsTUFBTSxDQUFDZ0IsSUFBN0IsSUFBcUNoQixNQUFNLENBQUNpQjtBQURaLE9BQTdDLENBQUosQ0FGTSxlQU1OO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDSSw2QkFBQywyQkFBRDtBQUFvQixRQUFBLFVBQVUsRUFBRWpDLE9BQU8sQ0FBQzRCO0FBQXhDLFFBREosQ0FOTSxDQUFWO0FBVUg7O0FBRUQsUUFBSUQsUUFBSjs7QUFDQSxRQUFJVixPQUFKLEVBQWE7QUFDVCxZQUFNaUIsUUFBUSxHQUFHLEtBQUt4QyxLQUFMLENBQVdJLGtCQUE1QjtBQUNBLFlBQU1xQyxRQUFRLEdBQUdoQixNQUFNLEdBQ25CLHlCQUFHLHFFQUFILENBRG1CLEdBRW5CLHlCQUFHLG1DQUFILENBRkosQ0FGUyxDQU1UOztBQUNBUSxNQUFBQSxRQUFRLGdCQUFHO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDUCx5Q0FBSyx5QkFBRyxpQkFBSCxDQUFMLENBRE8sZUFFUCx3Q0FBSVEsUUFBSixDQUZPLGVBR1AsNkJBQUMsZ0JBQUQ7QUFDSSxRQUFBLFFBQVEsRUFBRUQsUUFEZDtBQUVJLFFBQUEsSUFBSSxFQUFDLFNBRlQ7QUFHSSxRQUFBLFNBQVMsRUFBQyxpRUFIZDtBQUlJLFFBQUEsT0FBTyxFQUFFLEtBQUtMO0FBSmxCLFNBTUsseUJBQUcsaUJBQUgsQ0FOTCxDQUhPLENBQVg7QUFZSDs7QUFFRCxVQUFNTyxtQkFBbUIsR0FBR1osbUJBQW1CLGdCQUMxQztBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBd0NBLG1CQUF4QyxDQUQwQyxHQUUxQyxJQUZMLENBbEZZLENBc0ZaOztBQUNBLHdCQUFPLDZCQUFDLGNBQUQsQ0FBTyxRQUFQLFFBQ0ZFLE9BREUsRUFFRkMsUUFGRSxFQUdGUyxtQkFIRSxDQUFQO0FBS0g7O0FBWURDLEVBQUFBLFVBQVUsR0FBRztBQUNULFVBQU1DLFFBQVEsR0FBRyxLQUFLL0MsS0FBTCxDQUFXUyxPQUFYLElBQXNCLEtBQUtULEtBQUwsQ0FBV1MsT0FBWCxDQUFtQnVDLE9BQW5CLENBQTJCRCxRQUFsRTtBQUNBLFdBQU9FLGlDQUFnQkMsR0FBaEIsR0FBc0JDLGVBQXRCLENBQXNDRixpQ0FBZ0JDLEdBQWhCLEdBQXNCRSxTQUF0QixFQUF0QyxFQUF5RUwsUUFBekUsQ0FBUDtBQUNIOztBQUVETSxFQUFBQSx3QkFBd0IsR0FBRztBQUN2QixVQUFNO0FBQUM1QixNQUFBQSxNQUFEO0FBQVNoQixNQUFBQTtBQUFULFFBQW9CLEtBQUtULEtBQS9CO0FBQ0EsUUFBSXNELE1BQUosQ0FGdUIsQ0FHdkI7QUFDQTs7QUFDQSxRQUFJLEtBQUt0RCxLQUFMLENBQVd1RCxRQUFmLEVBQXlCO0FBQ3JCRCxNQUFBQSxNQUFNLEdBQUd2QixHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQVQ7QUFDSCxLQUZELE1BRU87QUFDSHNCLE1BQUFBLE1BQU0sR0FBR3ZCLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBVDtBQUNIOztBQUNELFVBQU13QixXQUFXLEdBQUcvQyxPQUFPLENBQUNnRCxrQkFBUixHQUNoQix5QkFBRyw4REFBSCxDQURnQixHQUVoQix5QkFBRywyREFBSCxFQUFnRTtBQUM1RGpCLE1BQUFBLFdBQVcsRUFBRWYsTUFBTSxDQUFDZSxXQUFQLElBQXNCZixNQUFNLENBQUNnQixJQUE3QixJQUFxQ2hCLE1BQU0sQ0FBQ2lCO0FBREcsS0FBaEUsQ0FGSjtBQUtBLFFBQUlnQixJQUFKOztBQUNBLFFBQUksS0FBS3ZELEtBQUwsQ0FBV0Msa0JBQWYsRUFBbUM7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQXNELE1BQUFBLElBQUksZ0JBQUcsNkJBQUMsY0FBRCxDQUFPLFFBQVAscUJBQ0gsd0NBQUlGLFdBQUosQ0FERyxlQUVILDZCQUFDLGdCQUFEO0FBQVMsUUFBQSxNQUFNLEVBQUUsSUFBakI7QUFBdUIsUUFBQSxNQUFNLEVBQUMsVUFBOUI7QUFBeUMsUUFBQSxJQUFJLEVBQUUsR0FBL0M7QUFBb0QsUUFBQSxXQUFXLEVBQUU7QUFBakUsUUFGRyxlQUdIO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDSSw2QkFBQyxNQUFEO0FBQ0ksUUFBQSxLQUFLLEVBQUUseUJBQUcsSUFBSCxDQURYO0FBQ3FCLFFBQUEsSUFBSSxFQUFDLFFBRDFCO0FBRUksUUFBQSxRQUFRLEVBQUUsS0FBS3JELEtBQUwsQ0FBV0Qsd0JBRnpCO0FBR0ksUUFBQSxPQUFPLEVBQUUsS0FBS3lEO0FBSGxCLFNBRzBDLHlCQUFHLElBQUgsQ0FIMUMsQ0FESixlQUtJLDZCQUFDLE1BQUQ7QUFDSSxRQUFBLEtBQUssRUFBRSx5QkFBRyxLQUFILENBRFg7QUFDc0IsUUFBQSxJQUFJLEVBQUMsU0FEM0I7QUFFSSxRQUFBLFFBQVEsRUFBRSxLQUFLeEQsS0FBTCxDQUFXRCx3QkFGekI7QUFHSSxRQUFBLE9BQU8sRUFBRSxLQUFLMEQ7QUFIbEIsU0FHMkMseUJBQUcsS0FBSCxDQUgzQyxDQUxKLENBSEcsQ0FBUDtBQWNILEtBbkJELE1BbUJPO0FBQ0hGLE1BQUFBLElBQUksZ0JBQUcscURBQUcsNkJBQUMsZ0JBQUQsT0FBSCxDQUFQO0FBQ0g7O0FBQ0Qsd0JBQU87QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNILHlDQUFLLHlCQUFHLG9CQUFILENBQUwsQ0FERyxFQUVEQSxJQUZDLENBQVA7QUFJSDs7QUFFREcsRUFBQUEsbUJBQW1CLEdBQUc7QUFDbEIsVUFBTTtBQUFDcEMsTUFBQUEsTUFBRDtBQUFTaEIsTUFBQUE7QUFBVCxRQUFvQixLQUFLVCxLQUEvQjtBQUVBLFFBQUk4RCxJQUFKOztBQUNBLFFBQUksQ0FBQ3JELE9BQU8sQ0FBQ2dELGtCQUFiLEVBQWlDO0FBQzdCLFVBQUksS0FBS3pELEtBQUwsQ0FBVytELGVBQWYsRUFBZ0M7QUFDNUJELFFBQUFBLElBQUksR0FBRyx5QkFBRyxtREFBSCxDQUFQO0FBQ0gsT0FGRCxNQUVPO0FBQ0hBLFFBQUFBLElBQUksR0FBRyx5QkFBRyw2REFBSCxDQUFQO0FBQ0g7QUFDSjs7QUFFRCxRQUFJTixXQUFKOztBQUNBLFFBQUkvQyxPQUFPLENBQUNnRCxrQkFBWixFQUFnQztBQUM1QixZQUFNTyxNQUFNLEdBQUcsS0FBS2xCLFVBQUwsRUFBZjs7QUFDQSxVQUFJLENBQUNrQixNQUFMLEVBQWE7QUFDVDtBQUNBO0FBQ0FqRCxRQUFBQSxPQUFPLENBQUNrRCxJQUFSLENBQWEsMENBQTBDLEtBQUtqRSxLQUFMLENBQVdTLE9BQVgsQ0FBbUJ1QyxPQUFuQixDQUEyQkQsUUFBbEY7QUFDQVMsUUFBQUEsV0FBVyxHQUFHLHlCQUFHLDJDQUFILENBQWQ7QUFDSCxPQUxELE1BS087QUFDSEEsUUFBQUEsV0FBVyxHQUFHLHlCQUFHLDZEQUFILEVBQWtFO0FBQzVFVSxVQUFBQSxVQUFVLEVBQUVGLE1BQU0sR0FBR0EsTUFBTSxDQUFDRyxjQUFQLEVBQUgsR0FBNkIsRUFENkI7QUFFNUVwQixVQUFBQSxRQUFRLEVBQUUsS0FBSy9DLEtBQUwsQ0FBV1MsT0FBWCxDQUFtQnVDLE9BQW5CLENBQTJCRDtBQUZ1QyxTQUFsRSxDQUFkO0FBSUg7QUFDSixLQWJELE1BYU87QUFDSFMsTUFBQUEsV0FBVyxHQUFHLHlCQUFHLCtDQUFILEVBQW9EO0FBQzlEaEIsUUFBQUEsV0FBVyxFQUFFZixNQUFNLENBQUNlLFdBQVAsSUFBc0JmLE1BQU0sQ0FBQ2dCLElBQTdCLElBQXFDaEIsTUFBTSxDQUFDaUI7QUFESyxPQUFwRCxDQUFkO0FBR0g7O0FBRUQsVUFBTVosZ0JBQWdCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwyQkFBakIsQ0FBekI7QUFDQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0kseUNBQUsseUJBQUcsVUFBSCxDQUFMLENBREosZUFFSSx3Q0FBSXdCLFdBQUosQ0FGSixlQUdJLDZCQUFDLGdCQUFEO0FBQVMsTUFBQSxNQUFNLEVBQUUsSUFBakI7QUFBdUIsTUFBQSxNQUFNLEVBQUMsVUFBOUI7QUFBeUMsTUFBQSxJQUFJLEVBQUUsR0FBL0M7QUFBb0QsTUFBQSxXQUFXLEVBQUU7QUFBakUsTUFISixFQUlNTSxJQUFJLGdCQUFHLHdDQUFLQSxJQUFMLENBQUgsR0FBcUIsSUFKL0IsZUFLSSw2QkFBQyxnQkFBRDtBQUFrQixNQUFBLElBQUksRUFBQyxTQUF2QjtBQUFpQyxNQUFBLFNBQVMsRUFBQyx3QkFBM0M7QUFBb0UsTUFBQSxPQUFPLEVBQUUsS0FBSzlELEtBQUwsQ0FBV29FO0FBQXhGLE9BQ0sseUJBQUcsUUFBSCxDQURMLENBTEosQ0FESjtBQVdIOztBQUVEQyxFQUFBQSxvQkFBb0IsR0FBRztBQUNuQixVQUFNO0FBQUM1QyxNQUFBQSxNQUFEO0FBQVNoQixNQUFBQTtBQUFULFFBQW9CLEtBQUtULEtBQS9CO0FBRUEsVUFBTThCLGdCQUFnQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBRUEsUUFBSXNDLHFCQUFKOztBQUNBLFFBQUk3RCxPQUFPLENBQUNnRCxrQkFBWixFQUFnQztBQUM1QmEsTUFBQUEscUJBQXFCLEdBQUcseUJBQUcsaURBQUgsQ0FBeEI7QUFDSCxLQUZELE1BRU87QUFDSEEsTUFBQUEscUJBQXFCLEdBQUcseUJBQUcsOENBQUgsQ0FBeEI7QUFDSDs7QUFFRCxRQUFJUixJQUFKOztBQUNBLFFBQUlyRCxPQUFPLENBQUM4RCxnQkFBUixLQUE2QixXQUFqQyxFQUE4QztBQUMxQ1QsTUFBQUEsSUFBSSxHQUFHLHlCQUFHLHlCQUFILGVBQW9DUSxxQkFBcEMsQ0FBUDtBQUNILEtBRkQsTUFFTyxJQUFJN0QsT0FBTyxDQUFDK0QsZ0JBQVIsS0FBNkIvRCxPQUFPLENBQUNnRSxXQUF6QyxFQUFzRDtBQUN6RCxVQUFJaEUsT0FBTyxDQUFDZ0Qsa0JBQVosRUFBZ0M7QUFDNUJLLFFBQUFBLElBQUksR0FBRyx5QkFBRyxtREFBSCxDQUFQO0FBQ0gsT0FGRCxNQUVPO0FBQ0hBLFFBQUFBLElBQUksR0FBRyx5QkFBRyx5Q0FBSCxFQUE4QztBQUNqRHRCLFVBQUFBLFdBQVcsRUFBRWYsTUFBTSxDQUFDZSxXQUFQLElBQXNCZixNQUFNLENBQUNnQixJQUE3QixJQUFxQ2hCLE1BQU0sQ0FBQ2lCO0FBRFIsU0FBOUMsQ0FBUDtBQUdIOztBQUNEb0IsTUFBQUEsSUFBSSxhQUFNQSxJQUFOLGNBQWNRLHFCQUFkLENBQUo7QUFDSCxLQVRNLE1BU0E7QUFDSFIsTUFBQUEsSUFBSSxHQUFHLHlCQUFHLDZCQUFILGVBQXdDUSxxQkFBeEMsQ0FBUDtBQUNIOztBQUVELHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSx5Q0FBSyx5QkFBRyx3QkFBSCxDQUFMLENBREosZUFFSSx3Q0FBS1IsSUFBTCxDQUZKLGVBSUksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxJQUFJLEVBQUMsU0FBdkI7QUFBaUMsTUFBQSxTQUFTLEVBQUMsd0JBQTNDO0FBQW9FLE1BQUEsT0FBTyxFQUFFLEtBQUs5RCxLQUFMLENBQVdvRTtBQUF4RixPQUNLLHlCQUFHLFFBQUgsQ0FETCxDQUpKLENBREo7QUFVSDs7QUFFRE0sRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTTtBQUFDakQsTUFBQUEsTUFBRDtBQUFTa0QsTUFBQUEsS0FBVDtBQUFnQmxFLE1BQUFBO0FBQWhCLFFBQTJCLEtBQUtULEtBQXRDO0FBRUEsVUFBTXdDLFdBQVcsR0FBR2YsTUFBTSxDQUFDZSxXQUFQLElBQXNCZixNQUFNLENBQUNnQixJQUE3QixJQUFxQ2hCLE1BQU0sQ0FBQ2lCLE1BQWhFOztBQUVBLFlBQVFpQyxLQUFSO0FBQ0ksV0FBS0MsZ0NBQUw7QUFDSSxlQUFPLEtBQUtwRCxhQUFMLEVBQVA7O0FBQ0osV0FBS3FELGtDQUFMO0FBQ0ksZ0JBQVFwRSxPQUFPLENBQUNxRSxZQUFoQjtBQUNJLGVBQUtuRSw0QkFBb0JvRSxtQkFBekI7QUFDSSxtQkFBTyxLQUFLMUIsd0JBQUwsRUFBUDs7QUFDSixlQUFLMUMsNEJBQW9CQyxHQUF6QjtBQUE4QjtBQUMxQixvQkFBTW9FLG1CQUFtQixHQUFHakQsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHdDQUFqQixDQUE1QjtBQUNBLG9CQUFNaUQsTUFBTSxHQUFHLEtBQUs5RSxLQUFMLENBQVdjLFFBQVgsZ0JBQ1gsNkJBQUMsbUJBQUQ7QUFDSSxnQkFBQSxXQUFXLEVBQUV1QixXQURqQjtBQUVJLGdCQUFBLE1BQU0sRUFBRSxLQUFLTSxVQUFMLEVBRlo7QUFHSSxnQkFBQSxHQUFHLEVBQUUsS0FBSzNDLEtBQUwsQ0FBV2MsUUFBWCxDQUFvQmlFLEdBSDdCO0FBSUksZ0JBQUEsUUFBUSxFQUFFLEtBQUtDLHFCQUpuQjtBQUtJLGdCQUFBLE1BQU0sRUFBRSxLQUFLQyxrQkFMakI7QUFNSSxnQkFBQSxRQUFRLEVBQUUsS0FBS3BGLEtBQUwsQ0FBV3VELFFBTnpCO0FBT0ksZ0JBQUEsTUFBTSxFQUFFOUMsT0FBTyxDQUFDZ0Q7QUFQcEIsZ0JBRFcsZ0JBU04sNkJBQUMsZ0JBQUQsT0FUVDtBQVVBLGtDQUFPO0FBQUssZ0JBQUEsU0FBUyxFQUFDO0FBQWYsOEJBQ0gseUNBQUsseUJBQUcsZUFBSCxDQUFMLENBREcsRUFFRHdCLE1BRkMsQ0FBUDtBQUlIOztBQUNEO0FBQ0ksbUJBQU8sSUFBUDtBQXJCUjs7QUF1QkosV0FBS0ksK0JBQUw7QUFDSSxlQUFPLEtBQUt4QixtQkFBTCxFQUFQOztBQUNKLFdBQUt5QixvQ0FBTDtBQUNJLGVBQU8sS0FBS2pCLG9CQUFMLEVBQVA7QUE5QlI7O0FBZ0NBdEQsSUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWMsb0NBQWQsRUFBb0QyRCxLQUFwRDtBQUNBLFdBQU8sSUFBUDtBQUNIOztBQTZDRFksRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEIsVUFBTTtBQUFDOUUsTUFBQUE7QUFBRCxRQUFZLEtBQUtULEtBQXZCO0FBQ0FTLElBQUFBLE9BQU8sQ0FBQ2MsRUFBUixDQUFXLFFBQVgsRUFBcUIsS0FBS2lFLGdCQUExQjs7QUFDQSxRQUFJL0UsT0FBTyxDQUFDRCxRQUFaLEVBQXNCO0FBQ2xCLFlBQU07QUFBQ0MsUUFBQUE7QUFBRCxVQUFZLEtBQUtULEtBQXZCO0FBQ0EsWUFBTTtBQUFDaUIsUUFBQUEsUUFBRDtBQUFXYixRQUFBQTtBQUFYLFVBQWlDSyxPQUFPLENBQUNELFFBQS9DO0FBQ0EsV0FBS1AsUUFBTCxDQUFjO0FBQUNnQixRQUFBQSxRQUFEO0FBQVdiLFFBQUFBO0FBQVgsT0FBZDtBQUNIOztBQUNELFNBQUtvRixnQkFBTDtBQUNIOztBQUVEQyxFQUFBQSxvQkFBb0IsR0FBRztBQUNuQixVQUFNO0FBQUNoRixNQUFBQTtBQUFELFFBQVksS0FBS1QsS0FBdkI7O0FBQ0EsUUFBSVMsT0FBTyxDQUFDRCxRQUFaLEVBQXNCO0FBQ2xCQyxNQUFBQSxPQUFPLENBQUNELFFBQVIsQ0FBaUJXLEdBQWpCLENBQXFCLFVBQXJCLEVBQWlDLEtBQUtDLG9CQUF0QztBQUNBWCxNQUFBQSxPQUFPLENBQUNELFFBQVIsQ0FBaUJXLEdBQWpCLENBQXFCLHFCQUFyQixFQUE0QyxLQUFLQyxvQkFBakQ7QUFDSDs7QUFDRFgsSUFBQUEsT0FBTyxDQUFDVSxHQUFSLENBQVksUUFBWixFQUFzQixLQUFLcUUsZ0JBQTNCO0FBQ0g7O0FBNVc4RDs7OzhCQUE5QzVGLGlCLGVBQ0U7QUFDZnNDLEVBQUFBLE1BQU0sRUFBRXdELG1CQUFVQyxNQURIO0FBRWZsRixFQUFBQSxPQUFPLEVBQUVpRixtQkFBVUUsTUFBVixDQUFpQkMsVUFGWDtBQUdmcEUsRUFBQUEsTUFBTSxFQUFFaUUsbUJBQVVFLE1BQVYsQ0FBaUJDLFVBSFY7QUFJZmxCLEVBQUFBLEtBQUssRUFBRWUsbUJBQVVJLEtBQVYsQ0FBZ0IsQ0FDbkJDLGlDQURtQixFQUVuQkMsb0NBRm1CLEVBR25CcEIsZ0NBSG1CLEVBSW5CQyxrQ0FKbUIsRUFLbkJTLG9DQUxtQixFQU1uQkQsK0JBTm1CLENBQWhCLEVBT0pRLFVBWFk7QUFZZnpCLEVBQUFBLE9BQU8sRUFBRXNCLG1CQUFVTyxJQUFWLENBQWVKLFVBWlQ7QUFhZjlCLEVBQUFBLGVBQWUsRUFBRTJCLG1CQUFVUTtBQWJaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCI7XG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHt2ZXJpZmljYXRpb25NZXRob2RzfSBmcm9tICdtYXRyaXgtanMtc2RrL3NyYy9jcnlwdG8nO1xuaW1wb3J0IHtTQ0FOX1FSX0NPREVfTUVUSE9EfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY3J5cHRvL3ZlcmlmaWNhdGlvbi9RUkNvZGVcIjtcblxuaW1wb3J0IFZlcmlmaWNhdGlvblFSQ29kZSBmcm9tIFwiLi4vZWxlbWVudHMvY3J5cHRvL1ZlcmlmaWNhdGlvblFSQ29kZVwiO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IEUyRUljb24gZnJvbSBcIi4uL3Jvb21zL0UyRUljb25cIjtcbmltcG9ydCB7XG4gICAgUEhBU0VfVU5TRU5ULFxuICAgIFBIQVNFX1JFUVVFU1RFRCxcbiAgICBQSEFTRV9SRUFEWSxcbiAgICBQSEFTRV9ET05FLFxuICAgIFBIQVNFX1NUQVJURUQsXG4gICAgUEhBU0VfQ0FOQ0VMTEVELFxufSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY3J5cHRvL3ZlcmlmaWNhdGlvbi9yZXF1ZXN0L1ZlcmlmaWNhdGlvblJlcXVlc3RcIjtcbmltcG9ydCBTcGlubmVyIGZyb20gXCIuLi9lbGVtZW50cy9TcGlubmVyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlcmlmaWNhdGlvblBhbmVsIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgbGF5b3V0OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICByZXF1ZXN0OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIG1lbWJlcjogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBwaGFzZTogUHJvcFR5cGVzLm9uZU9mKFtcbiAgICAgICAgICAgIFBIQVNFX1VOU0VOVCxcbiAgICAgICAgICAgIFBIQVNFX1JFUVVFU1RFRCxcbiAgICAgICAgICAgIFBIQVNFX1JFQURZLFxuICAgICAgICAgICAgUEhBU0VfU1RBUlRFRCxcbiAgICAgICAgICAgIFBIQVNFX0NBTkNFTExFRCxcbiAgICAgICAgICAgIFBIQVNFX0RPTkUsXG4gICAgICAgIF0pLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xvc2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIGlzUm9vbUVuY3J5cHRlZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgICAgICB0aGlzLl9oYXNWZXJpZmllciA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJlbmRlclFSUGhhc2UoKSB7XG4gICAgICAgIGNvbnN0IHttZW1iZXIsIHJlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3Qgc2hvd1NBUyA9IHJlcXVlc3Qub3RoZXJQYXJ0eVN1cHBvcnRzTWV0aG9kKHZlcmlmaWNhdGlvbk1ldGhvZHMuU0FTKTtcbiAgICAgICAgY29uc3Qgc2hvd1FSID0gcmVxdWVzdC5vdGhlclBhcnR5U3VwcG9ydHNNZXRob2QoU0NBTl9RUl9DT0RFX01FVEhPRCk7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG5cbiAgICAgICAgY29uc3Qgbm9Db21tb25NZXRob2RFcnJvciA9ICFzaG93U0FTICYmICFzaG93UVIgP1xuICAgICAgICAgICAgPHA+e190KFwiVGhlIHNlc3Npb24geW91IGFyZSB0cnlpbmcgdG8gdmVyaWZ5IGRvZXNuJ3Qgc3VwcG9ydCBzY2FubmluZyBhIFFSIGNvZGUgb3IgZW1vamkgdmVyaWZpY2F0aW9uLCB3aGljaCBpcyB3aGF0IFJpb3Qgc3VwcG9ydHMuIFRyeSB3aXRoIGEgZGlmZmVyZW50IGNsaWVudC5cIil9PC9wPiA6XG4gICAgICAgICAgICBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmxheW91dCA9PT0gJ2RpYWxvZycpIHtcbiAgICAgICAgICAgIC8vIEhBQ0s6IFRoaXMgaXMgYSB0ZXJyaWJsZSBpZGVhLlxuICAgICAgICAgICAgbGV0IHFyQmxvY2s7XG4gICAgICAgICAgICBsZXQgc2FzQmxvY2s7XG4gICAgICAgICAgICBpZiAoc2hvd1FSKSB7XG4gICAgICAgICAgICAgICAgcXJCbG9jayA9XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9WZXJpZmljYXRpb25QYW5lbF9RUlBoYXNlX3N0YXJ0T3B0aW9uJz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPntfdChcIlNjYW4gdGhpcyB1bmlxdWUgY29kZVwiKX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VmVyaWZpY2F0aW9uUVJDb2RlIHFyQ29kZURhdGE9e3JlcXVlc3QucXJDb2RlRGF0YX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNob3dTQVMpIHtcbiAgICAgICAgICAgICAgICBzYXNCbG9jayA9XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9WZXJpZmljYXRpb25QYW5lbF9RUlBoYXNlX3N0YXJ0T3B0aW9uJz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPntfdChcIkNvbXBhcmUgdW5pcXVlIGVtb2ppXCIpfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfVmVyaWZpY2F0aW9uUGFuZWxfUVJQaGFzZV9oZWxwVGV4dCc+e190KFwiQ29tcGFyZSBhIHVuaXF1ZSBzZXQgb2YgZW1vamkgaWYgeW91IGRvbid0IGhhdmUgYSBjYW1lcmEgb24gZWl0aGVyIGRldmljZVwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBkaXNhYmxlZD17dGhpcy5zdGF0ZS5lbW9qaUJ1dHRvbkNsaWNrZWR9IG9uQ2xpY2s9e3RoaXMuX3N0YXJ0U0FTfSBraW5kPSdwcmltYXJ5Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJTdGFydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3IgPSBxckJsb2NrICYmIHNhc0Jsb2NrID9cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfVmVyaWZpY2F0aW9uUGFuZWxfUVJQaGFzZV9iZXR3ZWVuVGV4dCc+e190KFwib3JcIil9PC9kaXY+IDogbnVsbDtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiVmVyaWZ5IHRoaXMgc2Vzc2lvbiBieSBjb21wbGV0aW5nIG9uZSBvZiB0aGUgZm9sbG93aW5nOlwiKX1cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1ZlcmlmaWNhdGlvblBhbmVsX1FSUGhhc2Vfc3RhcnRPcHRpb25zJz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtxckJsb2NrfVxuICAgICAgICAgICAgICAgICAgICAgICAge29yfVxuICAgICAgICAgICAgICAgICAgICAgICAge3Nhc0Jsb2NrfVxuICAgICAgICAgICAgICAgICAgICAgICAge25vQ29tbW9uTWV0aG9kRXJyb3J9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBxckJsb2NrO1xuICAgICAgICBpZiAoc2hvd1FSKSB7XG4gICAgICAgICAgICBxckJsb2NrID0gPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8aDM+e190KFwiVmVyaWZ5IGJ5IHNjYW5uaW5nXCIpfTwvaDM+XG4gICAgICAgICAgICAgICAgPHA+e190KFwiQXNrICUoZGlzcGxheU5hbWUpcyB0byBzY2FuIHlvdXIgY29kZTpcIiwge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogbWVtYmVyLmRpc3BsYXlOYW1lIHx8IG1lbWJlci5uYW1lIHx8IG1lbWJlci51c2VySWQsXG4gICAgICAgICAgICAgICAgfSl9PC9wPlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9WZXJpZmljYXRpb25QYW5lbF9xckNvZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPFZlcmlmaWNhdGlvblFSQ29kZSBxckNvZGVEYXRhPXtyZXF1ZXN0LnFyQ29kZURhdGF9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2FzQmxvY2s7XG4gICAgICAgIGlmIChzaG93U0FTKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNhYmxlZCA9IHRoaXMuc3RhdGUuZW1vamlCdXR0b25DbGlja2VkO1xuICAgICAgICAgICAgY29uc3Qgc2FzTGFiZWwgPSBzaG93UVIgP1xuICAgICAgICAgICAgICAgIF90KFwiSWYgeW91IGNhbid0IHNjYW4gdGhlIGNvZGUgYWJvdmUsIHZlcmlmeSBieSBjb21wYXJpbmcgdW5pcXVlIGVtb2ppLlwiKSA6XG4gICAgICAgICAgICAgICAgX3QoXCJWZXJpZnkgYnkgY29tcGFyaW5nIHVuaXF1ZSBlbW9qaS5cIik7XG5cbiAgICAgICAgICAgIC8vIE5vdGU6IG14X1ZlcmlmaWNhdGlvblBhbmVsX3ZlcmlmeUJ5RW1vamlCdXR0b24gaXMgZm9yIHRoZSBlbmQtdG8tZW5kIHRlc3RzXG4gICAgICAgICAgICBzYXNCbG9jayA9IDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGgzPntfdChcIlZlcmlmeSBieSBlbW9qaVwiKX08L2gzPlxuICAgICAgICAgICAgICAgIDxwPntzYXNMYWJlbH08L3A+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2Rpc2FibGVkfVxuICAgICAgICAgICAgICAgICAgICBraW5kPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3dpZGVCdXR0b24gbXhfVmVyaWZpY2F0aW9uUGFuZWxfdmVyaWZ5QnlFbW9qaUJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX3N0YXJ0U0FTfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge190KFwiVmVyaWZ5IGJ5IGVtb2ppXCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vQ29tbW9uTWV0aG9kQmxvY2sgPSBub0NvbW1vbk1ldGhvZEVycm9yID9cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2NvbnRhaW5lclwiPntub0NvbW1vbk1ldGhvZEVycm9yfTwvZGl2PiA6XG4gICAgICAgICAgICAgbnVsbDtcblxuICAgICAgICAvLyBUT0RPOiBhZGQgd2F5IHRvIG9wZW4gY2FtZXJhIHRvIHNjYW4gYSBRUiBjb2RlXG4gICAgICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICB7cXJCbG9ja31cbiAgICAgICAgICAgIHtzYXNCbG9ja31cbiAgICAgICAgICAgIHtub0NvbW1vbk1ldGhvZEJsb2NrfVxuICAgICAgICA8L1JlYWN0LkZyYWdtZW50PjtcbiAgICB9XG5cbiAgICBfb25SZWNpcHJvY2F0ZVllc0NsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtyZWNpcHJvY2F0ZUJ1dHRvbkNsaWNrZWQ6IHRydWV9KTtcbiAgICAgICAgdGhpcy5zdGF0ZS5yZWNpcHJvY2F0ZVFSRXZlbnQuY29uZmlybSgpO1xuICAgIH07XG5cbiAgICBfb25SZWNpcHJvY2F0ZU5vQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3JlY2lwcm9jYXRlQnV0dG9uQ2xpY2tlZDogdHJ1ZX0pO1xuICAgICAgICB0aGlzLnN0YXRlLnJlY2lwcm9jYXRlUVJFdmVudC5jYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgX2dldERldmljZSgpIHtcbiAgICAgICAgY29uc3QgZGV2aWNlSWQgPSB0aGlzLnByb3BzLnJlcXVlc3QgJiYgdGhpcy5wcm9wcy5yZXF1ZXN0LmNoYW5uZWwuZGV2aWNlSWQ7XG4gICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0U3RvcmVkRGV2aWNlKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSwgZGV2aWNlSWQpO1xuICAgIH1cblxuICAgIHJlbmRlclFSUmVjaXByb2NhdGVQaGFzZSgpIHtcbiAgICAgICAgY29uc3Qge21lbWJlciwgcmVxdWVzdH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBsZXQgQnV0dG9uO1xuICAgICAgICAvLyBhIGJpdCBvZiBhIGhhY2ssIGJ1dCB0aGUgRm9ybUJ1dHRvbiBzaG91bGQgb25seSBiZSB1c2VkIGluIHRoZSByaWdodCBwYW5lbFxuICAgICAgICAvLyB0aGV5IHNob3VsZCBwcm9iYWJseSBqdXN0IGJlIHRoZSBzYW1lIGNvbXBvbmVudCB3aXRoIGEgY3NzIGNsYXNzIGFwcGxpZWQgdG8gaXQ/XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmluRGlhbG9nKSB7XG4gICAgICAgICAgICBCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5Gb3JtQnV0dG9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcmVxdWVzdC5pc1NlbGZWZXJpZmljYXRpb24gP1xuICAgICAgICAgICAgX3QoXCJBbG1vc3QgdGhlcmUhIElzIHlvdXIgb3RoZXIgc2Vzc2lvbiBzaG93aW5nIHRoZSBzYW1lIHNoaWVsZD9cIikgOlxuICAgICAgICAgICAgX3QoXCJBbG1vc3QgdGhlcmUhIElzICUoZGlzcGxheU5hbWUpcyBzaG93aW5nIHRoZSBzYW1lIHNoaWVsZD9cIiwge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBtZW1iZXIuZGlzcGxheU5hbWUgfHwgbWVtYmVyLm5hbWUgfHwgbWVtYmVyLnVzZXJJZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBsZXQgYm9keTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVjaXByb2NhdGVRUkV2ZW50KSB7XG4gICAgICAgICAgICAvLyByaW90IHdlYiBkb2Vzbid0IHN1cHBvcnQgc2Nhbm5pbmcgeWV0LCBzbyBhc3N1bWUgaGVyZSB3ZSdyZSB0aGUgY2xpZW50IGJlaW5nIHNjYW5uZWQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gd2UncmUgcGFzc2luZyBib3RoIGEgbGFiZWwgYW5kIGEgY2hpbGQgc3RyaW5nIHRvIEJ1dHRvbiBhc1xuICAgICAgICAgICAgLy8gRm9ybUJ1dHRvbiBhbmQgQWNjZXNzaWJsZUJ1dHRvbiBleHBlY3QgdGhpcyBkaWZmZXJlbnRseVxuICAgICAgICAgICAgYm9keSA9IDxSZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICAgICAgICA8cD57ZGVzY3JpcHRpb259PC9wPlxuICAgICAgICAgICAgICAgIDxFMkVJY29uIGlzVXNlcj17dHJ1ZX0gc3RhdHVzPVwidmVyaWZpZWRcIiBzaXplPXsxMjh9IGhpZGVUb29sdGlwPXt0cnVlfSAvPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVmVyaWZpY2F0aW9uUGFuZWxfcmVjaXByb2NhdGVCdXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIk5vXCIpfSBraW5kPVwiZGFuZ2VyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLnJlY2lwcm9jYXRlQnV0dG9uQ2xpY2tlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uUmVjaXByb2NhdGVOb0NsaWNrfT57X3QoXCJOb1wiKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiWWVzXCIpfSBraW5kPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS5yZWNpcHJvY2F0ZUJ1dHRvbkNsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblJlY2lwcm9jYXRlWWVzQ2xpY2t9PntfdChcIlllc1wiKX08L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvUmVhY3QuRnJhZ21lbnQ+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm9keSA9IDxwPjxTcGlubmVyIC8+PC9wPjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jb250YWluZXIgbXhfVmVyaWZpY2F0aW9uUGFuZWxfcmVjaXByb2NhdGVfc2VjdGlvblwiPlxuICAgICAgICAgICAgPGgzPntfdChcIlZlcmlmeSBieSBzY2FubmluZ1wiKX08L2gzPlxuICAgICAgICAgICAgeyBib2R5IH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cblxuICAgIHJlbmRlclZlcmlmaWVkUGhhc2UoKSB7XG4gICAgICAgIGNvbnN0IHttZW1iZXIsIHJlcXVlc3R9ID0gdGhpcy5wcm9wcztcblxuICAgICAgICBsZXQgdGV4dDtcbiAgICAgICAgaWYgKCFyZXF1ZXN0LmlzU2VsZlZlcmlmaWNhdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuaXNSb29tRW5jcnlwdGVkKSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IF90KFwiVmVyaWZ5IGFsbCB1c2VycyBpbiBhIHJvb20gdG8gZW5zdXJlIGl0J3Mgc2VjdXJlLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IF90KFwiSW4gZW5jcnlwdGVkIHJvb21zLCB2ZXJpZnkgYWxsIHVzZXJzIHRvIGVuc3VyZSBpdOKAmXMgc2VjdXJlLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkZXNjcmlwdGlvbjtcbiAgICAgICAgaWYgKHJlcXVlc3QuaXNTZWxmVmVyaWZpY2F0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBkZXZpY2UgPSB0aGlzLl9nZXREZXZpY2UoKTtcbiAgICAgICAgICAgIGlmICghZGV2aWNlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBjYW4gaGFwcGVuIGlmIHRoZSBkZXZpY2UgaXMgbG9nZ2VkIG91dCB3aGlsZSB3ZSdyZSBzdGlsbCBzaG93aW5nIHZlcmlmaWNhdGlvblxuICAgICAgICAgICAgICAgIC8vIFVJIGZvciBpdC5cbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJWZXJpZmllZCBkZXZpY2Ugd2UgZG9uJ3Qga25vdyBhYm91dDogXCIgKyB0aGlzLnByb3BzLnJlcXVlc3QuY2hhbm5lbC5kZXZpY2VJZCk7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBfdChcIllvdSd2ZSBzdWNjZXNzZnVsbHkgdmVyaWZpZWQgeW91ciBkZXZpY2UhXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IF90KFwiWW91J3ZlIHN1Y2Nlc3NmdWxseSB2ZXJpZmllZCAlKGRldmljZU5hbWUpcyAoJShkZXZpY2VJZClzKSFcIiwge1xuICAgICAgICAgICAgICAgICAgICBkZXZpY2VOYW1lOiBkZXZpY2UgPyBkZXZpY2UuZ2V0RGlzcGxheU5hbWUoKSA6ICcnLFxuICAgICAgICAgICAgICAgICAgICBkZXZpY2VJZDogdGhpcy5wcm9wcy5yZXF1ZXN0LmNoYW5uZWwuZGV2aWNlSWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IF90KFwiWW91J3ZlIHN1Y2Nlc3NmdWxseSB2ZXJpZmllZCAlKGRpc3BsYXlOYW1lKXMhXCIsIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogbWVtYmVyLmRpc3BsYXlOYW1lIHx8IG1lbWJlci5uYW1lIHx8IG1lbWJlci51c2VySWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2NvbnRhaW5lciBteF9WZXJpZmljYXRpb25QYW5lbF92ZXJpZmllZF9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgPGgzPntfdChcIlZlcmlmaWVkXCIpfTwvaDM+XG4gICAgICAgICAgICAgICAgPHA+e2Rlc2NyaXB0aW9ufTwvcD5cbiAgICAgICAgICAgICAgICA8RTJFSWNvbiBpc1VzZXI9e3RydWV9IHN0YXR1cz1cInZlcmlmaWVkXCIgc2l6ZT17MTI4fSBoaWRlVG9vbHRpcD17dHJ1ZX0gLz5cbiAgICAgICAgICAgICAgICB7IHRleHQgPyA8cD57IHRleHQgfTwvcD4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3dpZGVCdXR0b25cIiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uQ2xvc2V9PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJHb3QgaXRcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyQ2FuY2VsbGVkUGhhc2UoKSB7XG4gICAgICAgIGNvbnN0IHttZW1iZXIsIHJlcXVlc3R9ID0gdGhpcy5wcm9wcztcblxuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIGxldCBzdGFydEFnYWluSW5zdHJ1Y3Rpb247XG4gICAgICAgIGlmIChyZXF1ZXN0LmlzU2VsZlZlcmlmaWNhdGlvbikge1xuICAgICAgICAgICAgc3RhcnRBZ2Fpbkluc3RydWN0aW9uID0gX3QoXCJTdGFydCB2ZXJpZmljYXRpb24gYWdhaW4gZnJvbSB0aGUgbm90aWZpY2F0aW9uLlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXJ0QWdhaW5JbnN0cnVjdGlvbiA9IF90KFwiU3RhcnQgdmVyaWZpY2F0aW9uIGFnYWluIGZyb20gdGhlaXIgcHJvZmlsZS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGV4dDtcbiAgICAgICAgaWYgKHJlcXVlc3QuY2FuY2VsbGF0aW9uQ29kZSA9PT0gXCJtLnRpbWVvdXRcIikge1xuICAgICAgICAgICAgdGV4dCA9IF90KFwiVmVyaWZpY2F0aW9uIHRpbWVkIG91dC5cIikgKyBgICR7c3RhcnRBZ2Fpbkluc3RydWN0aW9ufWA7XG4gICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5jYW5jZWxsaW5nVXNlcklkID09PSByZXF1ZXN0Lm90aGVyVXNlcklkKSB7XG4gICAgICAgICAgICBpZiAocmVxdWVzdC5pc1NlbGZWZXJpZmljYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gX3QoXCJZb3UgY2FuY2VsbGVkIHZlcmlmaWNhdGlvbiBvbiB5b3VyIG90aGVyIHNlc3Npb24uXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gX3QoXCIlKGRpc3BsYXlOYW1lKXMgY2FuY2VsbGVkIHZlcmlmaWNhdGlvbi5cIiwge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogbWVtYmVyLmRpc3BsYXlOYW1lIHx8IG1lbWJlci5uYW1lIHx8IG1lbWJlci51c2VySWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0ID0gYCR7dGV4dH0gJHtzdGFydEFnYWluSW5zdHJ1Y3Rpb259YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIllvdSBjYW5jZWxsZWQgdmVyaWZpY2F0aW9uLlwiKSArIGAgJHtzdGFydEFnYWluSW5zdHJ1Y3Rpb259YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2NvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxoMz57X3QoXCJWZXJpZmljYXRpb24gY2FuY2VsbGVkXCIpfTwvaDM+XG4gICAgICAgICAgICAgICAgPHA+eyB0ZXh0IH08L3A+XG5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3dpZGVCdXR0b25cIiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uQ2xvc2V9PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJHb3QgaXRcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7bWVtYmVyLCBwaGFzZSwgcmVxdWVzdH0gPSB0aGlzLnByb3BzO1xuXG4gICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gbWVtYmVyLmRpc3BsYXlOYW1lIHx8IG1lbWJlci5uYW1lIHx8IG1lbWJlci51c2VySWQ7XG5cbiAgICAgICAgc3dpdGNoIChwaGFzZSkge1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9SRUFEWTpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJRUlBoYXNlKCk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1NUQVJURUQ6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZXF1ZXN0LmNob3Nlbk1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHZlcmlmaWNhdGlvbk1ldGhvZHMuUkVDSVBST0NBVEVfUVJfQ09ERTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbmRlclFSUmVjaXByb2NhdGVQaGFzZSgpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHZlcmlmaWNhdGlvbk1ldGhvZHMuU0FTOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBWZXJpZmljYXRpb25TaG93U2FzID0gc2RrLmdldENvbXBvbmVudCgndmlld3MudmVyaWZpY2F0aW9uLlZlcmlmaWNhdGlvblNob3dTYXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtb2ppcyA9IHRoaXMuc3RhdGUuc2FzRXZlbnQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxWZXJpZmljYXRpb25TaG93U2FzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lPXtkaXNwbGF5TmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlPXt0aGlzLl9nZXREZXZpY2UoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FzPXt0aGlzLnN0YXRlLnNhc0V2ZW50LnNhc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMuX29uU2FzTWlzbWF0Y2hlc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRvbmU9e3RoaXMuX29uU2FzTWF0Y2hlc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbkRpYWxvZz17dGhpcy5wcm9wcy5pbkRpYWxvZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNTZWxmPXtyZXF1ZXN0LmlzU2VsZlZlcmlmaWNhdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPiA6IDxTcGlubmVyIC8+O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgzPntfdChcIkNvbXBhcmUgZW1vamlcIil9PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGVtb2ppcyB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgUEhBU0VfRE9ORTpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJWZXJpZmllZFBoYXNlKCk7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0NBTkNFTExFRDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJDYW5jZWxsZWRQaGFzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJWZXJpZmljYXRpb25QYW5lbCB1bmhhbmRsZWQgcGhhc2U6XCIsIHBoYXNlKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgX3N0YXJ0U0FTID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtlbW9qaUJ1dHRvbkNsaWNrZWQ6IHRydWV9KTtcbiAgICAgICAgY29uc3QgdmVyaWZpZXIgPSB0aGlzLnByb3BzLnJlcXVlc3QuYmVnaW5LZXlWZXJpZmljYXRpb24odmVyaWZpY2F0aW9uTWV0aG9kcy5TQVMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdmVyaWZpZXIudmVyaWZ5KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vblNhc01hdGNoZXNDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zdGF0ZS5zYXNFdmVudC5jb25maXJtKCk7XG4gICAgfTtcblxuICAgIF9vblNhc01pc21hdGNoZXNDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zdGF0ZS5zYXNFdmVudC5taXNtYXRjaCgpO1xuICAgIH07XG5cbiAgICBfdXBkYXRlVmVyaWZpZXJTdGF0ZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qge3JlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3Qge3Nhc0V2ZW50LCByZWNpcHJvY2F0ZVFSRXZlbnR9ID0gcmVxdWVzdC52ZXJpZmllcjtcbiAgICAgICAgcmVxdWVzdC52ZXJpZmllci5vZmYoJ3Nob3dfc2FzJywgdGhpcy5fdXBkYXRlVmVyaWZpZXJTdGF0ZSk7XG4gICAgICAgIHJlcXVlc3QudmVyaWZpZXIub2ZmKCdzaG93X3JlY2lwcm9jYXRlX3FyJywgdGhpcy5fdXBkYXRlVmVyaWZpZXJTdGF0ZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nhc0V2ZW50LCByZWNpcHJvY2F0ZVFSRXZlbnR9KTtcbiAgICB9O1xuXG4gICAgX29uUmVxdWVzdENoYW5nZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qge3JlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgaGFkVmVyaWZpZXIgPSB0aGlzLl9oYXNWZXJpZmllcjtcbiAgICAgICAgdGhpcy5faGFzVmVyaWZpZXIgPSAhIXJlcXVlc3QudmVyaWZpZXI7XG4gICAgICAgIGlmICghaGFkVmVyaWZpZXIgJiYgdGhpcy5faGFzVmVyaWZpZXIpIHtcbiAgICAgICAgICAgIHJlcXVlc3QudmVyaWZpZXIub24oJ3Nob3dfc2FzJywgdGhpcy5fdXBkYXRlVmVyaWZpZXJTdGF0ZSk7XG4gICAgICAgICAgICByZXF1ZXN0LnZlcmlmaWVyLm9uKCdzaG93X3JlY2lwcm9jYXRlX3FyJywgdGhpcy5fdXBkYXRlVmVyaWZpZXJTdGF0ZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIG9uIHRoZSByZXF1ZXN0ZXIgc2lkZSwgdGhpcyBpcyBhbHNvIGF3YWl0ZWQgaW4gX3N0YXJ0U0FTLFxuICAgICAgICAgICAgICAgIC8vIGJ1dCB0aGF0J3Mgb2sgYXMgdmVyaWZ5IHNob3VsZCByZXR1cm4gdGhlIHNhbWUgcHJvbWlzZS5cbiAgICAgICAgICAgICAgICBhd2FpdCByZXF1ZXN0LnZlcmlmaWVyLnZlcmlmeSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHZlcmlmeVwiLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBjb25zdCB7cmVxdWVzdH0gPSB0aGlzLnByb3BzO1xuICAgICAgICByZXF1ZXN0Lm9uKFwiY2hhbmdlXCIsIHRoaXMuX29uUmVxdWVzdENoYW5nZSk7XG4gICAgICAgIGlmIChyZXF1ZXN0LnZlcmlmaWVyKSB7XG4gICAgICAgICAgICBjb25zdCB7cmVxdWVzdH0gPSB0aGlzLnByb3BzO1xuICAgICAgICAgICAgY29uc3Qge3Nhc0V2ZW50LCByZWNpcHJvY2F0ZVFSRXZlbnR9ID0gcmVxdWVzdC52ZXJpZmllcjtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nhc0V2ZW50LCByZWNpcHJvY2F0ZVFSRXZlbnR9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vblJlcXVlc3RDaGFuZ2UoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY29uc3Qge3JlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgaWYgKHJlcXVlc3QudmVyaWZpZXIpIHtcbiAgICAgICAgICAgIHJlcXVlc3QudmVyaWZpZXIub2ZmKCdzaG93X3NhcycsIHRoaXMuX3VwZGF0ZVZlcmlmaWVyU3RhdGUpO1xuICAgICAgICAgICAgcmVxdWVzdC52ZXJpZmllci5vZmYoJ3Nob3dfcmVjaXByb2NhdGVfcXInLCB0aGlzLl91cGRhdGVWZXJpZmllclN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0Lm9mZihcImNoYW5nZVwiLCB0aGlzLl9vblJlcXVlc3RDaGFuZ2UpO1xuICAgIH1cbn1cbiJdfQ==