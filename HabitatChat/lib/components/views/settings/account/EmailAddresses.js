"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ExistingEmailAddress = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../languageHandler");

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _Field = _interopRequireDefault(require("../../elements/Field"));

var _AccessibleButton = _interopRequireDefault(require("../../elements/AccessibleButton"));

var Email = _interopRequireWildcard(require("../../../../email"));

var _AddThreepid = _interopRequireDefault(require("../../../../AddThreepid"));

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
It's very much placeholder, but it gets the job done. The old way of handling
email addresses in user settings was to use dialogs to communicate state, however
due to our dialog system overriding dialogs (causing unmounts) this creates problems
for a sane UX. For instance, the user could easily end up entering an email address
and receive a dialog to verify the address, which then causes the component here
to forget what it was doing and ultimately fail. Dialogs are still used in some
places to communicate errors - these should be replaced with inline validation when
that is available.
 */
class ExistingEmailAddress extends _react.default.Component {
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

      _MatrixClientPeg.MatrixClientPeg.get().deleteThreePid(this.props.email.medium, this.props.email.address).then(() => {
        return this.props.onRemoved(this.props.email);
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
        className: "mx_ExistingEmailAddress"
      }, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_ExistingEmailAddress_promptText"
      }, (0, _languageHandler._t)("Remove %(email)s?", {
        email: this.props.email.address
      })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onActuallyRemove,
        kind: "danger_sm",
        className: "mx_ExistingEmailAddress_confirmBtn"
      }, (0, _languageHandler._t)("Remove")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onDontRemove,
        kind: "link_sm",
        className: "mx_ExistingEmailAddress_confirmBtn"
      }, (0, _languageHandler._t)("Cancel")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ExistingEmailAddress"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ExistingEmailAddress_email"
    }, this.props.email.address), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onRemove,
      kind: "danger_sm"
    }, (0, _languageHandler._t)("Remove")));
  }

}

exports.ExistingEmailAddress = ExistingEmailAddress;
(0, _defineProperty2.default)(ExistingEmailAddress, "propTypes", {
  email: _propTypes.default.object.isRequired,
  onRemoved: _propTypes.default.func.isRequired
});

class EmailAddresses extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onRemoved", address => {
      const emails = this.props.emails.filter(e => e !== address);
      this.props.onEmailsChange(emails);
    });
    (0, _defineProperty2.default)(this, "_onChangeNewEmailAddress", e => {
      this.setState({
        newEmailAddress: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_onAddClick", e => {
      e.stopPropagation();
      e.preventDefault();
      if (!this.state.newEmailAddress) return;
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      const email = this.state.newEmailAddress; // TODO: Inline field validation

      if (!Email.looksValid(email)) {
        _Modal.default.createTrackedDialog('Invalid email address', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Invalid Email Address"),
          description: (0, _languageHandler._t)("This doesn't appear to be a valid email address")
        });

        return;
      }

      const task = new _AddThreepid.default();
      this.setState({
        verifying: true,
        continueDisabled: true,
        addTask: task
      });
      task.addEmailAddress(email).then(() => {
        this.setState({
          continueDisabled: false
        });
      }).catch(err => {
        console.error("Unable to add email address " + email + " " + err);
        this.setState({
          verifying: false,
          continueDisabled: false,
          addTask: null
        });

        _Modal.default.createTrackedDialog('Unable to add email address', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Unable to add email address"),
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
      this.state.addTask.checkEmailLinkClicked().then(() => {
        const email = this.state.newEmailAddress;
        this.setState({
          addTask: null,
          continueDisabled: false,
          verifying: false,
          newEmailAddress: ""
        });
        const emails = [...this.props.emails, {
          address: email,
          medium: "email"
        }];
        this.props.onEmailsChange(emails);
      }).catch(err => {
        this.setState({
          continueDisabled: false
        });
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        if (err.errcode === 'M_THREEPID_AUTH_FAILED') {
          _Modal.default.createTrackedDialog("Email hasn't been verified yet", "", ErrorDialog, {
            title: (0, _languageHandler._t)("Your email address hasn't been verified yet"),
            description: (0, _languageHandler._t)("Click the link in the email you received to verify " + "and then click continue again.")
          });
        } else {
          console.error("Unable to verify email address: ", err);

          _Modal.default.createTrackedDialog('Unable to verify email address', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Unable to verify email address."),
            description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
          });
        }
      });
    });
    this.state = {
      verifying: false,
      addTask: null,
      continueDisabled: false,
      newEmailAddress: ""
    };
  }

  render() {
    const existingEmailElements = this.props.emails.map(e => {
      return /*#__PURE__*/_react.default.createElement(ExistingEmailAddress, {
        email: e,
        onRemoved: this._onRemoved,
        key: e.address
      });
    });

    let addButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onAddClick,
      kind: "primary"
    }, (0, _languageHandler._t)("Add"));

    if (this.state.verifying) {
      addButton = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("We've sent you an email to verify your address. Please follow the instructions there and then click the button below.")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onContinueClick,
        kind: "primary",
        disabled: this.state.continueDisabled
      }, (0, _languageHandler._t)("Continue")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmailAddresses"
    }, existingEmailElements, /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onAddClick,
      autoComplete: "off",
      noValidate: true,
      className: "mx_EmailAddresses_new"
    }, /*#__PURE__*/_react.default.createElement(_Field.default, {
      type: "text",
      label: (0, _languageHandler._t)("Email Address"),
      autoComplete: "off",
      disabled: this.state.verifying,
      value: this.state.newEmailAddress,
      onChange: this._onChangeNewEmailAddress
    }), addButton));
  }

}

exports.default = EmailAddresses;
(0, _defineProperty2.default)(EmailAddresses, "propTypes", {
  emails: _propTypes.default.array.isRequired,
  onEmailsChange: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL2FjY291bnQvRW1haWxBZGRyZXNzZXMuanMiXSwibmFtZXMiOlsiRXhpc3RpbmdFbWFpbEFkZHJlc3MiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0Iiwic2V0U3RhdGUiLCJ2ZXJpZnlSZW1vdmUiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJkZWxldGVUaHJlZVBpZCIsInByb3BzIiwiZW1haWwiLCJtZWRpdW0iLCJhZGRyZXNzIiwidGhlbiIsIm9uUmVtb3ZlZCIsImNhdGNoIiwiZXJyIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjb25zb2xlIiwiZXJyb3IiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsInN0YXRlIiwicmVuZGVyIiwiX29uQWN0dWFsbHlSZW1vdmUiLCJfb25Eb250UmVtb3ZlIiwiX29uUmVtb3ZlIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImZ1bmMiLCJFbWFpbEFkZHJlc3NlcyIsImVtYWlscyIsImZpbHRlciIsIm9uRW1haWxzQ2hhbmdlIiwibmV3RW1haWxBZGRyZXNzIiwidGFyZ2V0IiwidmFsdWUiLCJFbWFpbCIsImxvb2tzVmFsaWQiLCJ0YXNrIiwiQWRkVGhyZWVwaWQiLCJ2ZXJpZnlpbmciLCJjb250aW51ZURpc2FibGVkIiwiYWRkVGFzayIsImFkZEVtYWlsQWRkcmVzcyIsImNoZWNrRW1haWxMaW5rQ2xpY2tlZCIsImVycmNvZGUiLCJleGlzdGluZ0VtYWlsRWxlbWVudHMiLCJtYXAiLCJfb25SZW1vdmVkIiwiYWRkQnV0dG9uIiwiX29uQWRkQ2xpY2siLCJfb25Db250aW51ZUNsaWNrIiwiX29uQ2hhbmdlTmV3RW1haWxBZGRyZXNzIiwiYXJy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LEtBQUwsQ0FBV29CLFNBQWYsRUFBMEI7QUFDdEJTLE1BQUFBLFNBQVMsZ0JBQ1AsdURBQ0ksMENBQU0seUJBQUcsdUhBQUgsQ0FBTixDQURKLGVBRUksNkJBQUMseUJBQUQ7QUFBa0IsUUFBQSxPQUFPLEVBQUUsS0FBS0UsZ0JBQWhDO0FBQWtELFFBQUEsSUFBSSxFQUFDLFNBQXZEO0FBQ2tCLFFBQUEsUUFBUSxFQUFFLEtBQUsvQixLQUFMLENBQVdxQjtBQUR2QyxTQUVLLHlCQUFHLFVBQUgsQ0FGTCxDQUZKLENBREY7QUFTSDs7QUFFRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDS0sscUJBREwsZUFFSTtBQUFNLE1BQUEsUUFBUSxFQUFFLEtBQUtJLFdBQXJCO0FBQWtDLE1BQUEsWUFBWSxFQUFDLEtBQS9DO0FBQ00sTUFBQSxVQUFVLEVBQUUsSUFEbEI7QUFDd0IsTUFBQSxTQUFTLEVBQUM7QUFEbEMsb0JBRUksNkJBQUMsY0FBRDtBQUNJLE1BQUEsSUFBSSxFQUFDLE1BRFQ7QUFFSSxNQUFBLEtBQUssRUFBRSx5QkFBRyxlQUFILENBRlg7QUFHSSxNQUFBLFlBQVksRUFBQyxLQUhqQjtBQUlJLE1BQUEsUUFBUSxFQUFFLEtBQUs5QixLQUFMLENBQVdvQixTQUp6QjtBQUtJLE1BQUEsS0FBSyxFQUFFLEtBQUtwQixLQUFMLENBQVdhLGVBTHRCO0FBTUksTUFBQSxRQUFRLEVBQUUsS0FBS21CO0FBTm5CLE1BRkosRUFVS0gsU0FWTCxDQUZKLENBREo7QUFpQkg7O0FBekl1RDs7OzhCQUF2Q3BCLGMsZUFDRTtBQUNmQyxFQUFBQSxNQUFNLEVBQUVMLG1CQUFVNEIsS0FBVixDQUFnQjFCLFVBRFQ7QUFFZkssRUFBQUEsY0FBYyxFQUFFUCxtQkFBVUcsSUFBVixDQUFlRDtBQUZoQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBGaWVsZCBmcm9tIFwiLi4vLi4vZWxlbWVudHMvRmllbGRcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi8uLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQgKiBhcyBFbWFpbCBmcm9tIFwiLi4vLi4vLi4vLi4vZW1haWxcIjtcbmltcG9ydCBBZGRUaHJlZXBpZCBmcm9tIFwiLi4vLi4vLi4vLi4vQWRkVGhyZWVwaWRcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vLi4vTW9kYWwnO1xuXG4vKlxuVE9ETzogSW1wcm92ZSB0aGUgVVggZm9yIGV2ZXJ5dGhpbmcgaW4gaGVyZS5cbkl0J3MgdmVyeSBtdWNoIHBsYWNlaG9sZGVyLCBidXQgaXQgZ2V0cyB0aGUgam9iIGRvbmUuIFRoZSBvbGQgd2F5IG9mIGhhbmRsaW5nXG5lbWFpbCBhZGRyZXNzZXMgaW4gdXNlciBzZXR0aW5ncyB3YXMgdG8gdXNlIGRpYWxvZ3MgdG8gY29tbXVuaWNhdGUgc3RhdGUsIGhvd2V2ZXJcbmR1ZSB0byBvdXIgZGlhbG9nIHN5c3RlbSBvdmVycmlkaW5nIGRpYWxvZ3MgKGNhdXNpbmcgdW5tb3VudHMpIHRoaXMgY3JlYXRlcyBwcm9ibGVtc1xuZm9yIGEgc2FuZSBVWC4gRm9yIGluc3RhbmNlLCB0aGUgdXNlciBjb3VsZCBlYXNpbHkgZW5kIHVwIGVudGVyaW5nIGFuIGVtYWlsIGFkZHJlc3NcbmFuZCByZWNlaXZlIGEgZGlhbG9nIHRvIHZlcmlmeSB0aGUgYWRkcmVzcywgd2hpY2ggdGhlbiBjYXVzZXMgdGhlIGNvbXBvbmVudCBoZXJlXG50byBmb3JnZXQgd2hhdCBpdCB3YXMgZG9pbmcgYW5kIHVsdGltYXRlbHkgZmFpbC4gRGlhbG9ncyBhcmUgc3RpbGwgdXNlZCBpbiBzb21lXG5wbGFjZXMgdG8gY29tbXVuaWNhdGUgZXJyb3JzIC0gdGhlc2Ugc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGggaW5saW5lIHZhbGlkYXRpb24gd2hlblxudGhhdCBpcyBhdmFpbGFibGUuXG4gKi9cblxuZXhwb3J0IGNsYXNzIEV4aXN0aW5nRW1haWxBZGRyZXNzIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBlbWFpbDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvblJlbW92ZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB2ZXJpZnlSZW1vdmU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vblJlbW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlSZW1vdmU6IHRydWV9KTtcbiAgICB9O1xuXG4gICAgX29uRG9udFJlbW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlSZW1vdmU6IGZhbHNlfSk7XG4gICAgfTtcblxuICAgIF9vbkFjdHVhbGx5UmVtb3ZlID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5kZWxldGVUaHJlZVBpZCh0aGlzLnByb3BzLmVtYWlsLm1lZGl1bSwgdGhpcy5wcm9wcy5lbWFpbC5hZGRyZXNzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLm9uUmVtb3ZlZCh0aGlzLnByb3BzLmVtYWlsKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gcmVtb3ZlIGNvbnRhY3QgaW5mb3JtYXRpb246IFwiICsgZXJyKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlbW92ZSAzcGlkIGZhaWxlZCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVuYWJsZSB0byByZW1vdmUgY29udGFjdCBpbmZvcm1hdGlvblwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnZlcmlmeVJlbW92ZSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nRW1haWxBZGRyZXNzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nRW1haWxBZGRyZXNzX3Byb21wdFRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlJlbW92ZSAlKGVtYWlsKXM/XCIsIHtlbWFpbDogdGhpcy5wcm9wcy5lbWFpbC5hZGRyZXNzfSApfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uQWN0dWFsbHlSZW1vdmV9IGtpbmQ9XCJkYW5nZXJfc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9FeGlzdGluZ0VtYWlsQWRkcmVzc19jb25maXJtQnRuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZW1vdmVcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25Eb250UmVtb3ZlfSBraW5kPVwibGlua19zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nRW1haWxBZGRyZXNzX2NvbmZpcm1CdG5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNhbmNlbFwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V4aXN0aW5nRW1haWxBZGRyZXNzXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRXhpc3RpbmdFbWFpbEFkZHJlc3NfZW1haWxcIj57dGhpcy5wcm9wcy5lbWFpbC5hZGRyZXNzfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vblJlbW92ZX0ga2luZD1cImRhbmdlcl9zbVwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZW1vdmVcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbWFpbEFkZHJlc3NlcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZW1haWxzOiBQcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgICAgb25FbWFpbHNDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB2ZXJpZnlpbmc6IGZhbHNlLFxuICAgICAgICAgICAgYWRkVGFzazogbnVsbCxcbiAgICAgICAgICAgIGNvbnRpbnVlRGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbmV3RW1haWxBZGRyZXNzOiBcIlwiLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vblJlbW92ZWQgPSAoYWRkcmVzcykgPT4ge1xuICAgICAgICBjb25zdCBlbWFpbHMgPSB0aGlzLnByb3BzLmVtYWlscy5maWx0ZXIoKGUpID0+IGUgIT09IGFkZHJlc3MpO1xuICAgICAgICB0aGlzLnByb3BzLm9uRW1haWxzQ2hhbmdlKGVtYWlscyk7XG4gICAgfTtcblxuICAgIF9vbkNoYW5nZU5ld0VtYWlsQWRkcmVzcyA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbmV3RW1haWxBZGRyZXNzOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkFkZENsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5uZXdFbWFpbEFkZHJlc3MpIHJldHVybjtcblxuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBjb25zdCBlbWFpbCA9IHRoaXMuc3RhdGUubmV3RW1haWxBZGRyZXNzO1xuXG4gICAgICAgIC8vIFRPRE86IElubGluZSBmaWVsZCB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghRW1haWwubG9va3NWYWxpZChlbWFpbCkpIHtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ludmFsaWQgZW1haWwgYWRkcmVzcycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkludmFsaWQgRW1haWwgQWRkcmVzc1wiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgdmFsaWQgZW1haWwgYWRkcmVzc1wiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFzayA9IG5ldyBBZGRUaHJlZXBpZCgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlpbmc6IHRydWUsIGNvbnRpbnVlRGlzYWJsZWQ6IHRydWUsIGFkZFRhc2s6IHRhc2t9KTtcblxuICAgICAgICB0YXNrLmFkZEVtYWlsQWRkcmVzcyhlbWFpbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb250aW51ZURpc2FibGVkOiBmYWxzZX0pO1xuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5hYmxlIHRvIGFkZCBlbWFpbCBhZGRyZXNzIFwiICsgZW1haWwgKyBcIiBcIiArIGVycik7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZnlpbmc6IGZhbHNlLCBjb250aW51ZURpc2FibGVkOiBmYWxzZSwgYWRkVGFzazogbnVsbH0pO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVW5hYmxlIHRvIGFkZCBlbWFpbCBhZGRyZXNzJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVW5hYmxlIHRvIGFkZCBlbWFpbCBhZGRyZXNzXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KFwiT3BlcmF0aW9uIGZhaWxlZFwiKSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkNvbnRpbnVlQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y29udGludWVEaXNhYmxlZDogdHJ1ZX0pO1xuICAgICAgICB0aGlzLnN0YXRlLmFkZFRhc2suY2hlY2tFbWFpbExpbmtDbGlja2VkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbWFpbCA9IHRoaXMuc3RhdGUubmV3RW1haWxBZGRyZXNzO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYWRkVGFzazogbnVsbCxcbiAgICAgICAgICAgICAgICBjb250aW51ZURpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB2ZXJpZnlpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5ld0VtYWlsQWRkcmVzczogXCJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1haWxzID0gW1xuICAgICAgICAgICAgICAgIC4uLnRoaXMucHJvcHMuZW1haWxzLFxuICAgICAgICAgICAgICAgIHsgYWRkcmVzczogZW1haWwsIG1lZGl1bTogXCJlbWFpbFwiIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkVtYWlsc0NoYW5nZShlbWFpbHMpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb250aW51ZURpc2FibGVkOiBmYWxzZX0pO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGlmIChlcnIuZXJyY29kZSA9PT0gJ01fVEhSRUVQSURfQVVUSF9GQUlMRUQnKSB7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZyhcIkVtYWlsIGhhc24ndCBiZWVuIHZlcmlmaWVkIHlldFwiLCBcIlwiLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJZb3VyIGVtYWlsIGFkZHJlc3MgaGFzbid0IGJlZW4gdmVyaWZpZWQgeWV0XCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJDbGljayB0aGUgbGluayBpbiB0aGUgZW1haWwgeW91IHJlY2VpdmVkIHRvIHZlcmlmeSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFuZCB0aGVuIGNsaWNrIGNvbnRpbnVlIGFnYWluLlwiKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byB2ZXJpZnkgZW1haWwgYWRkcmVzczogXCIsIGVycik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVW5hYmxlIHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVuYWJsZSB0byB2ZXJpZnkgZW1haWwgYWRkcmVzcy5cIiksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KFwiT3BlcmF0aW9uIGZhaWxlZFwiKSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRW1haWxFbGVtZW50cyA9IHRoaXMucHJvcHMuZW1haWxzLm1hcCgoZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxFeGlzdGluZ0VtYWlsQWRkcmVzcyBlbWFpbD17ZX0gb25SZW1vdmVkPXt0aGlzLl9vblJlbW92ZWR9IGtleT17ZS5hZGRyZXNzfSAvPjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGFkZEJ1dHRvbiA9IChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uQWRkQ2xpY2t9IGtpbmQ9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAge190KFwiQWRkXCIpfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZXJpZnlpbmcpIHtcbiAgICAgICAgICAgIGFkZEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+e190KFwiV2UndmUgc2VudCB5b3UgYW4gZW1haWwgdG8gdmVyaWZ5IHlvdXIgYWRkcmVzcy4gUGxlYXNlIGZvbGxvdyB0aGUgaW5zdHJ1Y3Rpb25zIHRoZXJlIGFuZCB0aGVuIGNsaWNrIHRoZSBidXR0b24gYmVsb3cuXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25Db250aW51ZUNsaWNrfSBraW5kPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS5jb250aW51ZURpc2FibGVkfT5cbiAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJDb250aW51ZVwiKX1cbiAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRW1haWxBZGRyZXNzZXNcIj5cbiAgICAgICAgICAgICAgICB7ZXhpc3RpbmdFbWFpbEVsZW1lbnRzfVxuICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vbkFkZENsaWNrfSBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICAgICAgICAgIG5vVmFsaWRhdGU9e3RydWV9IGNsYXNzTmFtZT1cIm14X0VtYWlsQWRkcmVzc2VzX25ld1wiPlxuICAgICAgICAgICAgICAgICAgICA8RmllbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIkVtYWlsIEFkZHJlc3NcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUudmVyaWZ5aW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUubmV3RW1haWxBZGRyZXNzfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uQ2hhbmdlTmV3RW1haWxBZGRyZXNzfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICB7YWRkQnV0dG9ufVxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==