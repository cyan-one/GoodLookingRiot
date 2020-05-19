"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PhoneNumber = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../languageHandler");

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../../index"));

var _Modal = _interopRequireDefault(require("../../../../Modal"));

var _AddThreepid = _interopRequireDefault(require("../../../../AddThreepid"));

/*
Copyright 2019 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

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
TODO: Improve the UX for everything in here.
This is a copy/paste of EmailAddresses, mostly.
 */
// TODO: Combine EmailAddresses and PhoneNumbers to be 3pid agnostic
class PhoneNumber extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onRevokeClick", e => {
      e.stopPropagation();
      e.preventDefault();
      this.changeBinding({
        bind: false,
        label: "revoke",
        errorTitle: (0, _languageHandler._t)("Unable to revoke sharing for phone number")
      });
    });
    (0, _defineProperty2.default)(this, "onShareClick", e => {
      e.stopPropagation();
      e.preventDefault();
      this.changeBinding({
        bind: true,
        label: "share",
        errorTitle: (0, _languageHandler._t)("Unable to share phone number")
      });
    });
    (0, _defineProperty2.default)(this, "onVerificationCodeChange", e => {
      this.setState({
        verificationCode: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "onContinueClick", async e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        continueDisabled: true
      });
      const token = this.state.verificationCode;

      try {
        await this.state.addTask.haveMsisdnToken(token);
        this.setState({
          addTask: null,
          continueDisabled: false,
          verifying: false,
          verifyError: null,
          verificationCode: ""
        });
      } catch (err) {
        this.setState({
          continueDisabled: false
        });

        if (err.errcode !== 'M_THREEPID_AUTH_FAILED') {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Unable to verify phone number: " + err);

          _Modal.default.createTrackedDialog('Unable to verify phone number', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Unable to verify phone number."),
            description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
          });
        } else {
          this.setState({
            verifyError: (0, _languageHandler._t)("Incorrect verification code")
          });
        }
      }
    });
    const {
      bound
    } = props.msisdn;
    this.state = {
      verifying: false,
      verificationCode: "",
      addTask: null,
      continueDisabled: false,
      bound
    };
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(nextProps) {
    // eslint-disable-line camelcase
    const {
      bound
    } = nextProps.msisdn;
    this.setState({
      bound
    });
  }

  async changeBinding({
    bind,
    label,
    errorTitle
  }) {
    if (!(await _MatrixClientPeg.MatrixClientPeg.get().doesServerSupportSeparateAddAndBind())) {
      return this.changeBindingTangledAddBind({
        bind,
        label,
        errorTitle
      });
    }

    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const {
      medium,
      address
    } = this.props.msisdn;

    try {
      if (bind) {
        const task = new _AddThreepid.default();
        this.setState({
          verifying: true,
          continueDisabled: true,
          addTask: task
        }); // XXX: Sydent will accept a number without country code if you add
        // a leading plus sign to a number in E.164 format (which the 3PID
        // address is), but this goes against the spec.
        // See https://github.com/matrix-org/matrix-doc/issues/2222

        await task.bindMsisdn(null, "+".concat(address));
        this.setState({
          continueDisabled: false
        });
      } else {
        await _MatrixClientPeg.MatrixClientPeg.get().unbindThreePid(medium, address);
      }

      this.setState({
        bound: bind
      });
    } catch (err) {
      console.error("Unable to ".concat(label, " phone number ").concat(address, " ").concat(err));
      this.setState({
        verifying: false,
        continueDisabled: false,
        addTask: null
      });

      _Modal.default.createTrackedDialog("Unable to ".concat(label, " phone number"), '', ErrorDialog, {
        title: errorTitle,
        description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
      });
    }
  }

  async changeBindingTangledAddBind({
    bind,
    label,
    errorTitle
  }) {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const {
      medium,
      address
    } = this.props.msisdn;
    const task = new _AddThreepid.default();
    this.setState({
      verifying: true,
      continueDisabled: true,
      addTask: task
    });

    try {
      await _MatrixClientPeg.MatrixClientPeg.get().deleteThreePid(medium, address); // XXX: Sydent will accept a number without country code if you add
      // a leading plus sign to a number in E.164 format (which the 3PID
      // address is), but this goes against the spec.
      // See https://github.com/matrix-org/matrix-doc/issues/2222

      if (bind) {
        await task.bindMsisdn(null, "+".concat(address));
      } else {
        await task.addMsisdn(null, "+".concat(address));
      }

      this.setState({
        continueDisabled: false,
        bound: bind
      });
    } catch (err) {
      console.error("Unable to ".concat(label, " phone number ").concat(address, " ").concat(err));
      this.setState({
        verifying: false,
        continueDisabled: false,
        addTask: null
      });

      _Modal.default.createTrackedDialog("Unable to ".concat(label, " phone number"), '', ErrorDialog, {
        title: errorTitle,
        description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
      });
    }
  }

  render() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const Field = sdk.getComponent('elements.Field');
    const {
      address
    } = this.props.msisdn;
    const {
      verifying,
      bound
    } = this.state;
    let status;

    if (verifying) {
      status = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_ExistingPhoneNumber_verification"
      }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Please enter verification code sent via text."), /*#__PURE__*/_react.default.createElement("br", null), this.state.verifyError), /*#__PURE__*/_react.default.createElement("form", {
        onSubmit: this.onContinueClick,
        autoComplete: "off",
        noValidate: true
      }, /*#__PURE__*/_react.default.createElement(Field, {
        type: "text",
        label: (0, _languageHandler._t)("Verification code"),
        autoComplete: "off",
        disabled: this.state.continueDisabled,
        value: this.state.verificationCode,
        onChange: this.onVerificationCodeChange
      })));
    } else if (bound) {
      status = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "mx_ExistingPhoneNumber_confirmBtn",
        kind: "danger_sm",
        onClick: this.onRevokeClick
      }, (0, _languageHandler._t)("Revoke"));
    } else {
      status = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "mx_ExistingPhoneNumber_confirmBtn",
        kind: "primary_sm",
        onClick: this.onShareClick
      }, (0, _languageHandler._t)("Share"));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ExistingPhoneNumber"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ExistingPhoneNumber_address"
    }, "+", address), status);
  }

}

exports.PhoneNumber = PhoneNumber;
(0, _defineProperty2.default)(PhoneNumber, "propTypes", {
  msisdn: _propTypes.default.object.isRequired
});

class PhoneNumbers extends _react.default.Component {
  render() {
    let content;

    if (this.props.msisdns.length > 0) {
      content = this.props.msisdns.map(e => {
        return /*#__PURE__*/_react.default.createElement(PhoneNumber, {
          msisdn: e,
          key: e.address
        });
      });
    } else {
      content = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, _languageHandler._t)("Discovery options will appear once you have added a phone number above."));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PhoneNumbers"
    }, content);
  }

}

exports.default = PhoneNumbers;
(0, _defineProperty2.default)(PhoneNumbers, "propTypes", {
  msisdns: _propTypes.default.array.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL2Rpc2NvdmVyeS9QaG9uZU51bWJlcnMuanMiXSwibmFtZXMiOlsiUGhvbmVOdW1iZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJlIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJjaGFuZ2VCaW5kaW5nIiwiYmluZCIsImxhYmVsIiwiZXJyb3JUaXRsZSIsInNldFN0YXRlIiwidmVyaWZpY2F0aW9uQ29kZSIsInRhcmdldCIsInZhbHVlIiwiY29udGludWVEaXNhYmxlZCIsInRva2VuIiwic3RhdGUiLCJhZGRUYXNrIiwiaGF2ZU1zaXNkblRva2VuIiwidmVyaWZ5aW5nIiwidmVyaWZ5RXJyb3IiLCJlcnIiLCJlcnJjb2RlIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjb25zb2xlIiwiZXJyb3IiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsImJvdW5kIiwibXNpc2RuIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXh0UHJvcHMiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJkb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCIsImNoYW5nZUJpbmRpbmdUYW5nbGVkQWRkQmluZCIsIm1lZGl1bSIsImFkZHJlc3MiLCJ0YXNrIiwiQWRkVGhyZWVwaWQiLCJiaW5kTXNpc2RuIiwidW5iaW5kVGhyZWVQaWQiLCJkZWxldGVUaHJlZVBpZCIsImFkZE1zaXNkbiIsInJlbmRlciIsIkFjY2Vzc2libGVCdXR0b24iLCJGaWVsZCIsInN0YXR1cyIsIm9uQ29udGludWVDbGljayIsIm9uVmVyaWZpY2F0aW9uQ29kZUNoYW5nZSIsIm9uUmV2b2tlQ2xpY2siLCJvblNoYXJlQ2xpY2siLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwiUGhvbmVOdW1iZXJzIiwiY29udGVudCIsIm1zaXNkbnMiLCJsZW5ndGgiLCJtYXAiLCJhcnJheSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJBOzs7O0FBS0E7QUFFTyxNQUFNQSxXQUFOLFNBQTBCQyxlQUFNQyxTQUFoQyxDQUEwQztBQUs3Q0MsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUseURBc0dGQyxDQUFELElBQU87QUFDbkJBLE1BQUFBLENBQUMsQ0FBQ0MsZUFBRjtBQUNBRCxNQUFBQSxDQUFDLENBQUNFLGNBQUY7QUFDQSxXQUFLQyxhQUFMLENBQW1CO0FBQ2ZDLFFBQUFBLElBQUksRUFBRSxLQURTO0FBRWZDLFFBQUFBLEtBQUssRUFBRSxRQUZRO0FBR2ZDLFFBQUFBLFVBQVUsRUFBRSx5QkFBRywyQ0FBSDtBQUhHLE9BQW5CO0FBS0gsS0E5R2tCO0FBQUEsd0RBZ0hITixDQUFELElBQU87QUFDbEJBLE1BQUFBLENBQUMsQ0FBQ0MsZUFBRjtBQUNBRCxNQUFBQSxDQUFDLENBQUNFLGNBQUY7QUFDQSxXQUFLQyxhQUFMLENBQW1CO0FBQ2ZDLFFBQUFBLElBQUksRUFBRSxJQURTO0FBRWZDLFFBQUFBLEtBQUssRUFBRSxPQUZRO0FBR2ZDLFFBQUFBLFVBQVUsRUFBRSx5QkFBRyw4QkFBSDtBQUhHLE9BQW5CO0FBS0gsS0F4SGtCO0FBQUEsb0VBMEhTTixDQUFELElBQU87QUFDOUIsV0FBS08sUUFBTCxDQUFjO0FBQ1ZDLFFBQUFBLGdCQUFnQixFQUFFUixDQUFDLENBQUNTLE1BQUYsQ0FBU0M7QUFEakIsT0FBZDtBQUdILEtBOUhrQjtBQUFBLDJEQWdJRCxNQUFPVixDQUFQLElBQWE7QUFDM0JBLE1BQUFBLENBQUMsQ0FBQ0MsZUFBRjtBQUNBRCxNQUFBQSxDQUFDLENBQUNFLGNB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eUVBQUgsQ0FESyxDQUFWO0FBR0g7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0tBLE9BREwsQ0FESjtBQUtIOztBQXRCcUQ7Ozs4QkFBckNELFksZUFDRTtBQUNmRSxFQUFBQSxPQUFPLEVBQUVMLG1CQUFVUSxLQUFWLENBQWdCTjtBQURWLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5cbmltcG9ydCB7IF90IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IEFkZFRocmVlcGlkIGZyb20gJy4uLy4uLy4uLy4uL0FkZFRocmVlcGlkJztcblxuLypcblRPRE86IEltcHJvdmUgdGhlIFVYIGZvciBldmVyeXRoaW5nIGluIGhlcmUuXG5UaGlzIGlzIGEgY29weS9wYXN0ZSBvZiBFbWFpbEFkZHJlc3NlcywgbW9zdGx5LlxuICovXG5cbi8vIFRPRE86IENvbWJpbmUgRW1haWxBZGRyZXNzZXMgYW5kIFBob25lTnVtYmVycyB0byBiZSAzcGlkIGFnbm9zdGljXG5cbmV4cG9ydCBjbGFzcyBQaG9uZU51bWJlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgbXNpc2RuOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICBjb25zdCB7IGJvdW5kIH0gPSBwcm9wcy5tc2lzZG47XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHZlcmlmeWluZzogZmFsc2UsXG4gICAgICAgICAgICB2ZXJpZmljYXRpb25Db2RlOiBcIlwiLFxuICAgICAgICAgICAgYWRkVGFzazogbnVsbCxcbiAgICAgICAgICAgIGNvbnRpbnVlRGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgYm91bmQsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgICAgICAgY29uc3QgeyBib3VuZCB9ID0gbmV4dFByb3BzLm1zaXNkbjtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGJvdW5kIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGNoYW5nZUJpbmRpbmcoeyBiaW5kLCBsYWJlbCwgZXJyb3JUaXRsZSB9KSB7XG4gICAgICAgIGlmICghYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmRvZXNTZXJ2ZXJTdXBwb3J0U2VwYXJhdGVBZGRBbmRCaW5kKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoYW5nZUJpbmRpbmdUYW5nbGVkQWRkQmluZCh7IGJpbmQsIGxhYmVsLCBlcnJvclRpdGxlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3QgeyBtZWRpdW0sIGFkZHJlc3MgfSA9IHRoaXMucHJvcHMubXNpc2RuO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoYmluZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhc2sgPSBuZXcgQWRkVGhyZWVwaWQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZ5aW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhZGRUYXNrOiB0YXNrLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIFhYWDogU3lkZW50IHdpbGwgYWNjZXB0IGEgbnVtYmVyIHdpdGhvdXQgY291bnRyeSBjb2RlIGlmIHlvdSBhZGRcbiAgICAgICAgICAgICAgICAvLyBhIGxlYWRpbmcgcGx1cyBzaWduIHRvIGEgbnVtYmVyIGluIEUuMTY0IGZvcm1hdCAod2hpY2ggdGhlIDNQSURcbiAgICAgICAgICAgICAgICAvLyBhZGRyZXNzIGlzKSwgYnV0IHRoaXMgZ29lcyBhZ2FpbnN0IHRoZSBzcGVjLlxuICAgICAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWF0cml4LW9yZy9tYXRyaXgtZG9jL2lzc3Vlcy8yMjIyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGFzay5iaW5kTXNpc2RuKG51bGwsIGArJHthZGRyZXNzfWApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLnVuYmluZFRocmVlUGlkKG1lZGl1bSwgYWRkcmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgYm91bmQ6IGJpbmQgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hYmxlIHRvICR7bGFiZWx9IHBob25lIG51bWJlciAke2FkZHJlc3N9ICR7ZXJyfWApO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdmVyaWZ5aW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhZGRUYXNrOiBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKGBVbmFibGUgdG8gJHtsYWJlbH0gcGhvbmUgbnVtYmVyYCwgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IGVycm9yVGl0bGUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICgoZXJyICYmIGVyci5tZXNzYWdlKSA/IGVyci5tZXNzYWdlIDogX3QoXCJPcGVyYXRpb24gZmFpbGVkXCIpKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY2hhbmdlQmluZGluZ1RhbmdsZWRBZGRCaW5kKHsgYmluZCwgbGFiZWwsIGVycm9yVGl0bGUgfSkge1xuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBjb25zdCB7IG1lZGl1bSwgYWRkcmVzcyB9ID0gdGhpcy5wcm9wcy5tc2lzZG47XG5cbiAgICAgICAgY29uc3QgdGFzayA9IG5ldyBBZGRUaHJlZXBpZCgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHZlcmlmeWluZzogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRpbnVlRGlzYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBhZGRUYXNrOiB0YXNrLFxuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmRlbGV0ZVRocmVlUGlkKG1lZGl1bSwgYWRkcmVzcyk7XG4gICAgICAgICAgICAvLyBYWFg6IFN5ZGVudCB3aWxsIGFjY2VwdCBhIG51bWJlciB3aXRob3V0IGNvdW50cnkgY29kZSBpZiB5b3UgYWRkXG4gICAgICAgICAgICAvLyBhIGxlYWRpbmcgcGx1cyBzaWduIHRvIGEgbnVtYmVyIGluIEUuMTY0IGZvcm1hdCAod2hpY2ggdGhlIDNQSURcbiAgICAgICAgICAgIC8vIGFkZHJlc3MgaXMpLCBidXQgdGhpcyBnb2VzIGFnYWluc3QgdGhlIHNwZWMuXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvbWF0cml4LWRvYy9pc3N1ZXMvMjIyMlxuICAgICAgICAgICAgaWYgKGJpbmQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0YXNrLmJpbmRNc2lzZG4obnVsbCwgYCske2FkZHJlc3N9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRhc2suYWRkTXNpc2RuKG51bGwsIGArJHthZGRyZXNzfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgY29udGludWVEaXNhYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgYm91bmQ6IGJpbmQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFibGUgdG8gJHtsYWJlbH0gcGhvbmUgbnVtYmVyICR7YWRkcmVzc30gJHtlcnJ9YCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB2ZXJpZnlpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlRGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFkZFRhc2s6IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coYFVuYWJsZSB0byAke2xhYmVsfSBwaG9uZSBudW1iZXJgLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogZXJyb3JUaXRsZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblJldm9rZUNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNoYW5nZUJpbmRpbmcoe1xuICAgICAgICAgICAgYmluZDogZmFsc2UsXG4gICAgICAgICAgICBsYWJlbDogXCJyZXZva2VcIixcbiAgICAgICAgICAgIGVycm9yVGl0bGU6IF90KFwiVW5hYmxlIHRvIHJldm9rZSBzaGFyaW5nIGZvciBwaG9uZSBudW1iZXJcIiksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uU2hhcmVDbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VCaW5kaW5nKHtcbiAgICAgICAgICAgIGJpbmQ6IHRydWUsXG4gICAgICAgICAgICBsYWJlbDogXCJzaGFyZVwiLFxuICAgICAgICAgICAgZXJyb3JUaXRsZTogX3QoXCJVbmFibGUgdG8gc2hhcmUgcGhvbmUgbnVtYmVyXCIpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvblZlcmlmaWNhdGlvbkNvZGVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHZlcmlmaWNhdGlvbkNvZGU6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkNvbnRpbnVlQ2xpY2sgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGNvbnRpbnVlRGlzYWJsZWQ6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IHRva2VuID0gdGhpcy5zdGF0ZS52ZXJpZmljYXRpb25Db2RlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0ZS5hZGRUYXNrLmhhdmVNc2lzZG5Ub2tlbih0b2tlbik7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBhZGRUYXNrOiBudWxsLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlRGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHZlcmlmeWluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgdmVyaWZ5RXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uQ29kZTogXCJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBjb250aW51ZURpc2FibGVkOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIGlmIChlcnIuZXJyY29kZSAhPT0gJ01fVEhSRUVQSURfQVVUSF9GQUlMRUQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5hYmxlIHRvIHZlcmlmeSBwaG9uZSBudW1iZXI6IFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdVbmFibGUgdG8gdmVyaWZ5IHBob25lIG51bWJlcicsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJVbmFibGUgdG8gdmVyaWZ5IHBob25lIG51bWJlci5cIiksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KFwiT3BlcmF0aW9uIGZhaWxlZFwiKSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZlcmlmeUVycm9yOiBfdChcIkluY29ycmVjdCB2ZXJpZmljYXRpb24gY29kZVwiKX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIGNvbnN0IHsgYWRkcmVzcyB9ID0gdGhpcy5wcm9wcy5tc2lzZG47XG4gICAgICAgIGNvbnN0IHsgdmVyaWZ5aW5nLCBib3VuZCB9ID0gdGhpcy5zdGF0ZTtcblxuICAgICAgICBsZXQgc3RhdHVzO1xuICAgICAgICBpZiAodmVyaWZ5aW5nKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSA8c3BhbiBjbGFzc05hbWU9XCJteF9FeGlzdGluZ1Bob25lTnVtYmVyX3ZlcmlmaWNhdGlvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJQbGVhc2UgZW50ZXIgdmVyaWZpY2F0aW9uIGNvZGUgc2VudCB2aWEgdGV4dC5cIil9XG4gICAgICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS52ZXJpZnlFcnJvcn1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMub25Db250aW51ZUNsaWNrfSBhdXRvQ29tcGxldGU9XCJvZmZcIiBub1ZhbGlkYXRlPXt0cnVlfT5cbiAgICAgICAgICAgICAgICAgICAgPEZpZWxkXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJWZXJpZmljYXRpb24gY29kZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS5jb250aW51ZURpc2FibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUudmVyaWZpY2F0aW9uQ29kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uVmVyaWZpY2F0aW9uQ29kZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L3NwYW4+O1xuICAgICAgICB9IGVsc2UgaWYgKGJvdW5kKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJfY29uZmlybUJ0blwiXG4gICAgICAgICAgICAgICAga2luZD1cImRhbmdlcl9zbVwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblJldm9rZUNsaWNrfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtfdChcIlJldm9rZVwiKX1cbiAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0dXMgPSA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJfY29uZmlybUJ0blwiXG4gICAgICAgICAgICAgICAga2luZD1cInByaW1hcnlfc21cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25TaGFyZUNsaWNrfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtfdChcIlNoYXJlXCIpfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9FeGlzdGluZ1Bob25lTnVtYmVyX2FkZHJlc3NcIj4re2FkZHJlc3N9PC9zcGFuPlxuICAgICAgICAgICAgICAgIHtzdGF0dXN9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBob25lTnVtYmVycyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgbXNpc2RuczogUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgY29udGVudDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubXNpc2Rucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gdGhpcy5wcm9wcy5tc2lzZG5zLm1hcCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiA8UGhvbmVOdW1iZXIgbXNpc2RuPXtlfSBrZXk9e2UuYWRkcmVzc30gLz47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dFwiPlxuICAgICAgICAgICAgICAgIHtfdChcIkRpc2NvdmVyeSBvcHRpb25zIHdpbGwgYXBwZWFyIG9uY2UgeW91IGhhdmUgYWRkZWQgYSBwaG9uZSBudW1iZXIgYWJvdmUuXCIpfVxuICAgICAgICAgICAgPC9zcGFuPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Bob25lTnVtYmVyc1wiPlxuICAgICAgICAgICAgICAgIHtjb250ZW50fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19