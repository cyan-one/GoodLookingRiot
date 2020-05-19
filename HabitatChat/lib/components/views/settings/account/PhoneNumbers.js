"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ExistingPhoneNumber = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../languageHandler");

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _Field = _interopRequireDefault(require("../../elements/Field"));

var _AccessibleButton = _interopRequireDefault(require("../../elements/AccessibleButton"));

var _AddThreepid = _interopRequireDefault(require("../../../../AddThreepid"));

var _CountryDropdown = _interopRequireDefault(require("../../auth/CountryDropdown"));

var sdk = _interopRequireWildcard(require("../../../../index"));

var _Modal = _interopRequireDefault(require("../../../../Modal"));

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
class ExistingPhoneNumber extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onRemove", e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        verifyRemove: true
      });
    });
    (0, _defineProperty2.default)(this, "_onDontRemove", e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        verifyRemove: false
      });
    });
    (0, _defineProperty2.default)(this, "_onActuallyRemove", e => {
      e.stopPropagation();
      e.preventDefault();

      _MatrixClientPeg.MatrixClientPeg.get().deleteThreePid(this.props.msisdn.medium, this.props.msisdn.address).then(() => {
        return this.props.onRemoved(this.props.msisdn);
      }).catch(err => {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
        console.error("Unable to remove contact information: " + err);

        _Modal.default.createTrackedDialog('Remove 3pid failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Unable to remove contact information"),
          description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
        });
      });
    });
    this.state = {
      verifyRemove: false
    };
  }

  render() {
    if (this.state.verifyRemove) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ExistingPhoneNumber"
      }, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_ExistingPhoneNumber_promptText"
      }, (0, _languageHandler._t)("Remove %(phone)s?", {
        phone: this.props.msisdn.address
      })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onActuallyRemove,
        kind: "danger_sm",
        className: "mx_ExistingPhoneNumber_confirmBtn"
      }, (0, _languageHandler._t)("Remove")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onDontRemove,
        kind: "link_sm",
        className: "mx_ExistingPhoneNumber_confirmBtn"
      }, (0, _languageHandler._t)("Cancel")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ExistingPhoneNumber"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ExistingPhoneNumber_address"
    }, "+", this.props.msisdn.address), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onRemove,
      kind: "danger_sm"
    }, (0, _languageHandler._t)("Remove")));
  }

}

exports.ExistingPhoneNumber = ExistingPhoneNumber;
(0, _defineProperty2.default)(ExistingPhoneNumber, "propTypes", {
  msisdn: _propTypes.default.object.isRequired,
  onRemoved: _propTypes.default.func.isRequired
});

class PhoneNumbers extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onRemoved", address => {
      const msisdns = this.props.msisdns.filter(e => e !== address);
      this.props.onMsisdnsChange(msisdns);
    });
    (0, _defineProperty2.default)(this, "_onChangeNewPhoneNumber", e => {
      this.setState({
        newPhoneNumber: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_onChangeNewPhoneNumberCode", e => {
      this.setState({
        newPhoneNumberCode: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_onAddClick", e => {
      e.stopPropagation();
      e.preventDefault();
      if (!this.state.newPhoneNumber) return;
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      const phoneNumber = this.state.newPhoneNumber;
      const phoneCountry = this.state.phoneCountry;
      const task = new _AddThreepid.default();
      this.setState({
        verifying: true,
        continueDisabled: true,
        addTask: task
      });
      task.addMsisdn(phoneCountry, phoneNumber).then(response => {
        this.setState({
          continueDisabled: false,
          verifyMsisdn: response.msisdn
        });
      }).catch(err => {
        console.error("Unable to add phone number " + phoneNumber + " " + err);
        this.setState({
          verifying: false,
          continueDisabled: false,
          addTask: null
        });

        _Modal.default.createTrackedDialog('Add Phone Number Error', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Error"),
          description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onContinueClick", e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        continueDisabled: true
      });
      const token = this.state.newPhoneNumberCode;
      const address = this.state.verifyMsisdn;
      this.state.addTask.haveMsisdnToken(token).then(() => {
        this.setState({
          addTask: null,
          continueDisabled: false,
          verifying: false,
          verifyMsisdn: "",
          verifyError: null,
          newPhoneNumber: "",
          newPhoneNumberCode: ""
        });
        const msisdns = [...this.props.msisdns, {
          address,
          medium: "msisdn"
        }];
        this.props.onMsisdnsChange(msisdns);
      }).catch(err => {
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
      });
    });
    (0, _defineProperty2.default)(this, "_onCountryChanged", e => {
      this.setState({
        phoneCountry: e.iso2
      });
    });
    this.state = {
      verifying: false,
      verifyError: false,
      verifyMsisdn: "",
      addTask: null,
      continueDisabled: false,
      phoneCountry: "",
      newPhoneNumber: "",
      newPhoneNumberCode: ""
    };
  }

  render() {
    const existingPhoneElements = this.props.msisdns.map(p => {
      return /*#__PURE__*/_react.default.createElement(ExistingPhoneNumber, {
        msisdn: p,
        onRemoved: this._onRemoved,
        key: p.address
      });
    });

    let addVerifySection = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onAddClick,
      kind: "primary"
    }, (0, _languageHandler._t)("Add"));

    if (this.state.verifying) {
      const msisdn = this.state.verifyMsisdn;
      addVerifySection = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("A text message has been sent to +%(msisdn)s. " + "Please enter the verification code it contains.", {
        msisdn: msisdn
      }), /*#__PURE__*/_react.default.createElement("br", null), this.state.verifyError), /*#__PURE__*/_react.default.createElement("form", {
        onSubmit: this._onContinueClick,
        autoComplete: "off",
        noValidate: true
      }, /*#__PURE__*/_react.default.createElement(_Field.default, {
        type: "text",
        label: (0, _languageHandler._t)("Verification code"),
        autoComplete: "off",
        disabled: this.state.continueDisabled,
        value: this.state.newPhoneNumberCode,
        onChange: this._onChangeNewPhoneNumberCode
      }), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onContinueClick,
        kind: "primary",
        disabled: this.state.continueDisabled
      }, (0, _languageHandler._t)("Continue"))));
    }

    const phoneCountry = /*#__PURE__*/_react.default.createElement(_CountryDropdown.default, {
      onOptionChange: this._onCountryChanged,
      className: "mx_PhoneNumbers_country",
      value: this.state.phoneCountry,
      disabled: this.state.verifying,
      isSmall: true,
      showPrefix: true
    });

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PhoneNumbers"
    }, existingPhoneElements, /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onAddClick,
      autoComplete: "off",
      noValidate: true,
      className: "mx_PhoneNumbers_new"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PhoneNumbers_input"
    }, /*#__PURE__*/_react.default.createElement(_Field.default, {
      type: "text",
      label: (0, _languageHandler._t)("Phone Number"),
      autoComplete: "off",
      disabled: this.state.verifying,
      prefix: phoneCountry,
      value: this.state.newPhoneNumber,
      onChange: this._onChangeNewPhoneNumber
    }))), addVerifySection);
  }

}

exports.default = PhoneNumbers;
(0, _defineProperty2.default)(PhoneNumbers, "propTypes", {
  msisdns: _propTypes.default.array.isRequired,
  onMsisdnsChange: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL2FjY291bnQvUGhvbmVOdW1iZXJzLmpzIl0sIm5hbWVzIjpbIkV4aXN0aW5nUGhvbmVOdW1iZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0Iiwic2V0U3RhdGUiLCJ2ZXJpZnlSZW1vdmUiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJkZWxldGVUaHJlZVBpZCIsInByb3BzIiwibXNpc2RuIiwibWVkaXVtIiwiYWRkcmVzcyIsInRoZW4iLCJvblJlbW92ZWQiLCJjYXRjaCIsImVyciIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY29uc29sZSIsImVycm9yIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm1lc3NhZ2UiLCJzdGF0ZSIsInJlbmRlciIsInBob25lIiwiX29uQWN0dWFsbHlSZW1vdmUiLCJfb25Eb250UmVtb3ZlIiwiX29uUmVtb3ZlIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImZ1bmMiLCJQaG9uZU51bWJlcnMiLCJtc2lzZG5zIiwiZmlsdGVyIiwib25Nc2lzZG5zQ2hhbmdlIiwibmV3UGhvbmVOdW1iZXIiLCJ0YXJnZXQiLCJ2YWx1ZSIsIm5ld1Bob25lTnVtYmVyQ29kZSIsInBob25lTnVtYmVyIiwicGhvbmVDb3VudHJ5IiwidGFzayIsIkFkZFRocmVlcGlkIiwidmVyaWZ5aW5nIiwiY29udGludWVEaXNhYmxlZCIsImFkZFRhc2siLCJhZGRNc2lzZG4iLCJyZXNwb25zZSIsInZlcmlmeU1zaXNkbiIsInRva2VuIiwiaGF2ZU1zaXNkblRva2VuIiwidmVyaWZ5RXJyb3IiLCJlcnJjb2RlIiwiaXNvMiIsImV4aXN0aW5nUGhvbmVFbGVtZW50cyIsIm1hcCIsInAiLCJfb25SZW1vdmVkIiwiYWRkVmVyaWZ5U2VjdGlvbiIsIl9vbkFkZENsaWNrIiwiX29uQ29udGludWVDbGljayIsIl9vbkNoYW5nZU5ld1Bob25lTnVtYmVyQ29kZSIsIl9vbkNvdW50cnlDaGFuZ2VkIiwiX29uQ2hhbmdlTmV3UGhvbmVOdW1iZXIiLCJhcnJheSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUExQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBOzs7O0FBS0E7QUFFTyxNQUFNQSxtQkFBTixTQUFrQ0MsZUFBTUMsU0FBeEMsQ0FBa0Q7QUFNckRDLEVBQUFBLFdBQVcsR0FBRztBQUNWO0FBRFUscURBUURDLENBQUQsSUFBTztBQUNmQSxNQUFBQSxDQUFDLENBQUNDLGVBQUY7QUFDQUQsTUFBQUEsQ0FBQyxDQUFDRSxjQUFGO0FBRUEsV0FBS0MsUUFBTCxDQUFjO0FBQUNDLFFBQUFBLFlBQVksRUFBRTtBQUFmLE9BQWQ7QUFDSCxLQWJhO0FBQUEseURBZUdKLENBQUQsSUFBTztBQUNuQkEsTUFBQUEsQ0FBQyxDQUFDQyxlQUFGO0FBQ0FELE1BQUFBLENBQUMsQ0FBQ0UsY0FBRjtBQUVBLFdBQUtDLFFBQUwsQ0FBYztBQUFDQyxRQUFBQSxZQUFZLEVBQUU7QUFBZixPQUFkO0FBQ0gsS0FwQmE7QUFBQSw2REFzQk9KLENBQUQsSUFBTztBQUN2QkEsTUFBQUEsQ0FBQyxDQUFDQyxlQUFGO0FBQ0FELE1BQUFBLENBQUMsQ0FBQ0UsY0FBRjs7QUFFQUcsdUNBQWdCQyxHQUFoQixHQUFzQkMsY0FBdEIsQ0FBcUMsS0FBS0MsS0FBTCxDQUFXQyxNQUFYLENBQWtCQyxNQUF2RCxFQUErRCxLQUFLRixLQUFMLENBQVdDLE1BQVgsQ0FBa0JFLE9BQWpGLEVBQTBGQyxJQUExRixDQUErRixNQUFNO0FBQ2pHLGVBQU8sS0FBS0osS0FBTCxDQUFXSyxTQUFYLENBQXFCLEtBQUtMLEtBQUwsQ0FBV0MsTUFBaEMs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REosQ0FGSixFQWVLTCxnQkFmTCxDQURKO0FBbUJIOztBQXpLcUQ7Ozs4QkFBckMzQixZLGVBQ0U7QUFDZkMsRUFBQUEsT0FBTyxFQUFFTCxtQkFBVXFDLEtBQVYsQ0FBZ0JuQyxVQURWO0FBRWZLLEVBQUFBLGVBQWUsRUFBRVAsbUJBQVVHLElBQVYsQ0FBZUQ7QUFGakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgRmllbGQgZnJvbSBcIi4uLy4uL2VsZW1lbnRzL0ZpZWxkXCI7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IEFkZFRocmVlcGlkIGZyb20gXCIuLi8uLi8uLi8uLi9BZGRUaHJlZXBpZFwiO1xuaW1wb3J0IENvdW50cnlEcm9wZG93biBmcm9tIFwiLi4vLi4vYXV0aC9Db3VudHJ5RHJvcGRvd25cIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vLi4vTW9kYWwnO1xuXG4vKlxuVE9ETzogSW1wcm92ZSB0aGUgVVggZm9yIGV2ZXJ5dGhpbmcgaW4gaGVyZS5cblRoaXMgaXMgYSBjb3B5L3Bhc3RlIG9mIEVtYWlsQWRkcmVzc2VzLCBtb3N0bHkuXG4gKi9cblxuLy8gVE9ETzogQ29tYmluZSBFbWFpbEFkZHJlc3NlcyBhbmQgUGhvbmVOdW1iZXJzIHRvIGJlIDNwaWQgYWdub3N0aWNcblxuZXhwb3J0IGNsYXNzIEV4aXN0aW5nUGhvbmVOdW1iZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG1zaXNkbjogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvblJlbW92ZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB2ZXJpZnlSZW1vdmU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vblJlbW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlSZW1vdmU6IHRydWV9KTtcbiAgICB9O1xuXG4gICAgX29uRG9udFJlbW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlSZW1vdmU6IGZhbHNlfSk7XG4gICAgfTtcblxuICAgIF9vbkFjdHVhbGx5UmVtb3ZlID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5kZWxldGVUaHJlZVBpZCh0aGlzLnByb3BzLm1zaXNkbi5tZWRpdW0sIHRoaXMucHJvcHMubXNpc2RuLmFkZHJlc3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMub25SZW1vdmVkKHRoaXMucHJvcHMubXNpc2RuKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gcmVtb3ZlIGNvbnRhY3QgaW5mb3JtYXRpb246IFwiICsgZXJyKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlbW92ZSAzcGlkIGZhaWxlZCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVuYWJsZSB0byByZW1vdmUgY29udGFjdCBpbmZvcm1hdGlvblwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnZlcmlmeVJlbW92ZSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRXhpc3RpbmdQaG9uZU51bWJlcl9wcm9tcHRUZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZW1vdmUgJShwaG9uZSlzP1wiLCB7cGhvbmU6IHRoaXMucHJvcHMubXNpc2RuLmFkZHJlc3N9KX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkFjdHVhbGx5UmVtb3ZlfSBraW5kPVwiZGFuZ2VyX3NtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfRXhpc3RpbmdQaG9uZU51bWJlcl9jb25maXJtQnRuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZW1vdmVcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25Eb250UmVtb3ZlfSBraW5kPVwibGlua19zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJfY29uZmlybUJ0blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiQ2FuY2VsXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXhpc3RpbmdQaG9uZU51bWJlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nUGhvbmVOdW1iZXJfYWRkcmVzc1wiPit7dGhpcy5wcm9wcy5tc2lzZG4uYWRkcmVzc308L3NwYW4+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25SZW1vdmV9IGtpbmQ9XCJkYW5nZXJfc21cIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiUmVtb3ZlXCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGhvbmVOdW1iZXJzIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBtc2lzZG5zOiBQcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgICAgb25Nc2lzZG5zQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdmVyaWZ5aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIHZlcmlmeUVycm9yOiBmYWxzZSxcbiAgICAgICAgICAgIHZlcmlmeU1zaXNkbjogXCJcIixcbiAgICAgICAgICAgIGFkZFRhc2s6IG51bGwsXG4gICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBob25lQ291bnRyeTogXCJcIixcbiAgICAgICAgICAgIG5ld1Bob25lTnVtYmVyOiBcIlwiLFxuICAgICAgICAgICAgbmV3UGhvbmVOdW1iZXJDb2RlOiBcIlwiLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vblJlbW92ZWQgPSAoYWRkcmVzcykgPT4ge1xuICAgICAgICBjb25zdCBtc2lzZG5zID0gdGhpcy5wcm9wcy5tc2lzZG5zLmZpbHRlcigoZSkgPT4gZSAhPT0gYWRkcmVzcyk7XG4gICAgICAgIHRoaXMucHJvcHMub25Nc2lzZG5zQ2hhbmdlKG1zaXNkbnMpO1xuICAgIH07XG5cbiAgICBfb25DaGFuZ2VOZXdQaG9uZU51bWJlciA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbmV3UGhvbmVOdW1iZXI6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uQ2hhbmdlTmV3UGhvbmVOdW1iZXJDb2RlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBuZXdQaG9uZU51bWJlckNvZGU6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uQWRkQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLm5ld1Bob25lTnVtYmVyKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3QgcGhvbmVOdW1iZXIgPSB0aGlzLnN0YXRlLm5ld1Bob25lTnVtYmVyO1xuICAgICAgICBjb25zdCBwaG9uZUNvdW50cnkgPSB0aGlzLnN0YXRlLnBob25lQ291bnRyeTtcblxuICAgICAgICBjb25zdCB0YXNrID0gbmV3IEFkZFRocmVlcGlkKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZlcmlmeWluZzogdHJ1ZSwgY29udGludWVEaXNhYmxlZDogdHJ1ZSwgYWRkVGFzazogdGFza30pO1xuXG4gICAgICAgIHRhc2suYWRkTXNpc2RuKHBob25lQ291bnRyeSwgcGhvbmVOdW1iZXIpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb250aW51ZURpc2FibGVkOiBmYWxzZSwgdmVyaWZ5TXNpc2RuOiByZXNwb25zZS5tc2lzZG59KTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byBhZGQgcGhvbmUgbnVtYmVyIFwiICsgcGhvbmVOdW1iZXIgKyBcIiBcIiArIGVycik7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlpbmc6IGZhbHNlLCBjb250aW51ZURpc2FibGVkOiBmYWxzZSwgYWRkVGFzazogbnVsbH0pO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQWRkIFBob25lIE51bWJlciBFcnJvcicsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KFwiT3BlcmF0aW9uIGZhaWxlZFwiKSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkNvbnRpbnVlQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y29udGludWVEaXNhYmxlZDogdHJ1ZX0pO1xuICAgICAgICBjb25zdCB0b2tlbiA9IHRoaXMuc3RhdGUubmV3UGhvbmVOdW1iZXJDb2RlO1xuICAgICAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5zdGF0ZS52ZXJpZnlNc2lzZG47XG4gICAgICAgIHRoaXMuc3RhdGUuYWRkVGFzay5oYXZlTXNpc2RuVG9rZW4odG9rZW4pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYWRkVGFzazogbnVsbCxcbiAgICAgICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB2ZXJpZnlpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHZlcmlmeU1zaXNkbjogXCJcIixcbiAgICAgICAgICAgICAgICB2ZXJpZnlFcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdQaG9uZU51bWJlcjogXCJcIixcbiAgICAgICAgICAgICAgICBuZXdQaG9uZU51bWJlckNvZGU6IFwiXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG1zaXNkbnMgPSBbXG4gICAgICAgICAgICAgICAgLi4udGhpcy5wcm9wcy5tc2lzZG5zLFxuICAgICAgICAgICAgICAgIHsgYWRkcmVzcywgbWVkaXVtOiBcIm1zaXNkblwiIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk1zaXNkbnNDaGFuZ2UobXNpc2Rucyk7XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvbnRpbnVlRGlzYWJsZWQ6IGZhbHNlfSk7XG4gICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgIT09ICdNX1RIUkVFUElEX0FVVEhfRkFJTEVEJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byB2ZXJpZnkgcGhvbmUgbnVtYmVyOiBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVW5hYmxlIHRvIHZlcmlmeSBwaG9uZSBudW1iZXInLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVW5hYmxlIHRvIHZlcmlmeSBwaG9uZSBudW1iZXIuXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlFcnJvcjogX3QoXCJJbmNvcnJlY3QgdmVyaWZpY2F0aW9uIGNvZGVcIil9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkNvdW50cnlDaGFuZ2VkID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhvbmVDb3VudHJ5OiBlLmlzbzJ9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBleGlzdGluZ1Bob25lRWxlbWVudHMgPSB0aGlzLnByb3BzLm1zaXNkbnMubWFwKChwKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPEV4aXN0aW5nUGhvbmVOdW1iZXIgbXNpc2RuPXtwfSBvblJlbW92ZWQ9e3RoaXMuX29uUmVtb3ZlZH0ga2V5PXtwLmFkZHJlc3N9IC8+O1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgYWRkVmVyaWZ5U2VjdGlvbiA9IChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uQWRkQ2xpY2t9IGtpbmQ9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAge190KFwiQWRkXCIpfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZXJpZnlpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zaXNkbiA9IHRoaXMuc3RhdGUudmVyaWZ5TXNpc2RuO1xuICAgICAgICAgICAgYWRkVmVyaWZ5U2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiQSB0ZXh0IG1lc3NhZ2UgaGFzIGJlZW4gc2VudCB0byArJShtc2lzZG4pcy4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIGVudGVyIHRoZSB2ZXJpZmljYXRpb24gY29kZSBpdCBjb250YWlucy5cIiwgeyBtc2lzZG46IG1zaXNkbiB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUudmVyaWZ5RXJyb3J9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5fb25Db250aW51ZUNsaWNrfSBhdXRvQ29tcGxldGU9XCJvZmZcIiBub1ZhbGlkYXRlPXt0cnVlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJWZXJpZmljYXRpb24gY29kZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmNvbnRpbnVlRGlzYWJsZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUubmV3UGhvbmVOdW1iZXJDb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZU5ld1Bob25lTnVtYmVyQ29kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkNvbnRpbnVlQ2xpY2t9IGtpbmQ9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmNvbnRpbnVlRGlzYWJsZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNvbnRpbnVlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGhvbmVDb3VudHJ5ID0gPENvdW50cnlEcm9wZG93biBvbk9wdGlvbkNoYW5nZT17dGhpcy5fb25Db3VudHJ5Q2hhbmdlZH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Bob25lTnVtYmVyc19jb3VudHJ5XCJcbiAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBob25lQ291bnRyeX1cbiAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLnZlcmlmeWluZ31cbiAgICAgICAgICAgIGlzU21hbGw9e3RydWV9XG4gICAgICAgICAgICBzaG93UHJlZml4PXt0cnVlfVxuICAgICAgICAvPjtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9QaG9uZU51bWJlcnNcIj5cbiAgICAgICAgICAgICAgICB7ZXhpc3RpbmdQaG9uZUVsZW1lbnRzfVxuICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vbkFkZENsaWNrfSBhdXRvQ29tcGxldGU9XCJvZmZcIiBub1ZhbGlkYXRlPXt0cnVlfSBjbGFzc05hbWU9XCJteF9QaG9uZU51bWJlcnNfbmV3XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUGhvbmVOdW1iZXJzX2lucHV0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RmllbGRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiUGhvbmUgTnVtYmVyXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUudmVyaWZ5aW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeD17cGhvbmVDb3VudHJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLm5ld1Bob25lTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZU5ld1Bob25lTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICAgIHthZGRWZXJpZnlTZWN0aW9ufVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19