"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var Email = _interopRequireWildcard(require("../../../email"));

var _AddThreepid = _interopRequireDefault(require("../../../AddThreepid"));

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

/*
Copyright 2017 Vector Creations Ltd
Copyright 2018 New Vector Ltd

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

/**
 * Prompt the user to set an email address.
 *
 * On success, `onFinished(true)` is called.
 */
var _default = (0, _createReactClass.default)({
  displayName: 'SetEmailDialog',
  propTypes: {
    onFinished: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      emailAddress: '',
      emailBusy: false
    };
  },
  onEmailAddressChanged: function (value) {
    this.setState({
      emailAddress: value
    });
  },
  onSubmit: function () {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    const emailAddress = this.state.emailAddress;

    if (!Email.looksValid(emailAddress)) {
      _Modal.default.createTrackedDialog('Invalid Email Address', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Invalid Email Address"),
        description: (0, _languageHandler._t)("This doesn't appear to be a valid email address")
      });

      return;
    }

    this._addThreepid = new _AddThreepid.default();

    this._addThreepid.addEmailAddress(emailAddress).then(() => {
      _Modal.default.createTrackedDialog('Verification Pending', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Verification Pending"),
        description: (0, _languageHandler._t)("Please check your email and click on the link it contains. Once this " + "is done, click continue."),
        button: (0, _languageHandler._t)('Continue'),
        onFinished: this.onEmailDialogFinished
      });
    }, err => {
      this.setState({
        emailBusy: false
      });
      console.error("Unable to add email address " + emailAddress + " " + err);

      _Modal.default.createTrackedDialog('Unable to add email address', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Unable to add email address"),
        description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
      });
    });

    this.setState({
      emailBusy: true
    });
  },
  onCancelled: function () {
    this.props.onFinished(false);
  },
  onEmailDialogFinished: function (ok) {
    if (ok) {
      this.verifyEmailAddress();
    } else {
      this.setState({
        emailBusy: false
      });
    }
  },
  verifyEmailAddress: function () {
    this._addThreepid.checkEmailLinkClicked().then(() => {
      this.props.onFinished(true);
    }, err => {
      this.setState({
        emailBusy: false
      });

      if (err.errcode == 'M_THREEPID_AUTH_FAILED') {
        const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
        const message = (0, _languageHandler._t)("Unable to verify email address.") + " " + (0, _languageHandler._t)("Please check your email and click on the link it contains. Once this is done, click continue.");

        _Modal.default.createTrackedDialog('Verification Pending', '3pid Auth Failed', QuestionDialog, {
          title: (0, _languageHandler._t)("Verification Pending"),
          description: message,
          button: (0, _languageHandler._t)('Continue'),
          onFinished: this.onEmailDialogFinished
        });
      } else {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
        console.error("Unable to verify email address: " + err);

        _Modal.default.createTrackedDialog('Unable to verify email address', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Unable to verify email address."),
          description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
        });
      }
    });
  },
  render: function () {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const Spinner = sdk.getComponent('elements.Spinner');
    const EditableText = sdk.getComponent('elements.EditableText');
    const emailInput = this.state.emailBusy ? /*#__PURE__*/_react.default.createElement(Spinner, null) : /*#__PURE__*/_react.default.createElement(EditableText, {
      initialValue: this.state.emailAddress,
      className: "mx_SetEmailDialog_email_input",
      autoFocus: "true",
      placeholder: (0, _languageHandler._t)("Email address"),
      placeholderClassName: "mx_SetEmailDialog_email_input_placeholder",
      blurToCancel: false,
      onValueChanged: this.onEmailAddressChanged
    });
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_SetEmailDialog",
      onFinished: this.onCancelled,
      title: this.props.title,
      contentId: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", {
      id: "mx_Dialog_content"
    }, (0, _languageHandler._t)('This will allow you to reset your password and receive notifications.')), emailInput), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Dialog_primary",
      type: "submit",
      value: (0, _languageHandler._t)("Continue"),
      onClick: this.onSubmit
    }), /*#__PURE__*/_react.default.createElement("input", {
      type: "submit",
      value: (0, _languageHandler._t)("Skip"),
      onClick: this.onCancelled
    })));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvU2V0RW1haWxEaWFsb2cuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkZpbmlzaGVkIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJlbWFpbEFkZHJlc3MiLCJlbWFpbEJ1c3kiLCJvbkVtYWlsQWRkcmVzc0NoYW5nZWQiLCJ2YWx1ZSIsInNldFN0YXRlIiwib25TdWJtaXQiLCJFcnJvckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIlF1ZXN0aW9uRGlhbG9nIiwic3RhdGUiLCJFbWFpbCIsImxvb2tzVmFsaWQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiX2FkZFRocmVlcGlkIiwiQWRkVGhyZWVwaWQiLCJhZGRFbWFpbEFkZHJlc3MiLCJ0aGVuIiwiYnV0dG9uIiwib25FbWFpbERpYWxvZ0ZpbmlzaGVkIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsIm9uQ2FuY2VsbGVkIiwicHJvcHMiLCJvayIsInZlcmlmeUVtYWlsQWRkcmVzcyIsImNoZWNrRW1haWxMaW5rQ2xpY2tlZCIsImVycmNvZGUiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiU3Bpbm5lciIsIkVkaXRhYmxlVGV4dCIsImVtYWlsSW5wdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQkE7Ozs7O2VBS2UsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsZ0JBRGU7QUFFNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxVQUFVLEVBQUVDLG1CQUFVQyxJQUFWLENBQWVDO0FBRHBCLEdBRmlCO0FBTTVCQyxFQUFBQSxlQUFl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QUFFLHlCQUFHLE1BQUgsQ0FGWDtBQUdJLE1BQUEsT0FBTyxFQUFFLEtBQUtzQjtBQUhsQixNQU5KLENBWEosQ0FESjtBQTBCSDtBQW5JMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0ICogYXMgRW1haWwgZnJvbSAnLi4vLi4vLi4vZW1haWwnO1xuaW1wb3J0IEFkZFRocmVlcGlkIGZyb20gJy4uLy4uLy4uL0FkZFRocmVlcGlkJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5cblxuLyoqXG4gKiBQcm9tcHQgdGhlIHVzZXIgdG8gc2V0IGFuIGVtYWlsIGFkZHJlc3MuXG4gKlxuICogT24gc3VjY2VzcywgYG9uRmluaXNoZWQodHJ1ZSlgIGlzIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdTZXRFbWFpbERpYWxvZycsXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbWFpbEFkZHJlc3M6ICcnLFxuICAgICAgICAgICAgZW1haWxCdXN5OiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25FbWFpbEFkZHJlc3NDaGFuZ2VkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVtYWlsQWRkcmVzczogdmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblN1Ym1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG5cbiAgICAgICAgY29uc3QgZW1haWxBZGRyZXNzID0gdGhpcy5zdGF0ZS5lbWFpbEFkZHJlc3M7XG4gICAgICAgIGlmICghRW1haWwubG9va3NWYWxpZChlbWFpbEFkZHJlc3MpKSB7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdJbnZhbGlkIEVtYWlsIEFkZHJlc3MnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJJbnZhbGlkIEVtYWlsIEFkZHJlc3NcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSBhIHZhbGlkIGVtYWlsIGFkZHJlc3NcIiksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRUaHJlZXBpZCA9IG5ldyBBZGRUaHJlZXBpZCgpO1xuICAgICAgICB0aGlzLl9hZGRUaHJlZXBpZC5hZGRFbWFpbEFkZHJlc3MoZW1haWxBZGRyZXNzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1ZlcmlmaWNhdGlvbiBQZW5kaW5nJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVmVyaWZpY2F0aW9uIFBlbmRpbmdcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlBsZWFzZSBjaGVjayB5b3VyIGVtYWlsIGFuZCBjbGljayBvbiB0aGUgbGluayBpdCBjb250YWlucy4gT25jZSB0aGlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJpcyBkb25lLCBjbGljayBjb250aW51ZS5cIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoJ0NvbnRpbnVlJyksXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogdGhpcy5vbkVtYWlsRGlhbG9nRmluaXNoZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZW1haWxCdXN5OiBmYWxzZX0pO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byBhZGQgZW1haWwgYWRkcmVzcyBcIiArIGVtYWlsQWRkcmVzcyArIFwiIFwiICsgZXJyKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1VuYWJsZSB0byBhZGQgZW1haWwgYWRkcmVzcycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVuYWJsZSB0byBhZGQgZW1haWwgYWRkcmVzc1wiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtlbWFpbEJ1c3k6IHRydWV9KTtcbiAgICB9LFxuXG4gICAgb25DYW5jZWxsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH0sXG5cbiAgICBvbkVtYWlsRGlhbG9nRmluaXNoZWQ6IGZ1bmN0aW9uKG9rKSB7XG4gICAgICAgIGlmIChvaykge1xuICAgICAgICAgICAgdGhpcy52ZXJpZnlFbWFpbEFkZHJlc3MoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VtYWlsQnVzeTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB2ZXJpZnlFbWFpbEFkZHJlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9hZGRUaHJlZXBpZC5jaGVja0VtYWlsTGlua0NsaWNrZWQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZW1haWxCdXN5OiBmYWxzZX0pO1xuICAgICAgICAgICAgaWYgKGVyci5lcnJjb2RlID09ICdNX1RIUkVFUElEX0FVVEhfRkFJTEVEJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IF90KFwiVW5hYmxlIHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzLlwiKSArIFwiIFwiICtcbiAgICAgICAgICAgICAgICAgICAgX3QoXCJQbGVhc2UgY2hlY2sgeW91ciBlbWFpbCBhbmQgY2xpY2sgb24gdGhlIGxpbmsgaXQgY29udGFpbnMuIE9uY2UgdGhpcyBpcyBkb25lLCBjbGljayBjb250aW51ZS5cIik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVmVyaWZpY2F0aW9uIFBlbmRpbmcnLCAnM3BpZCBBdXRoIEZhaWxlZCcsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlZlcmlmaWNhdGlvbiBQZW5kaW5nXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uOiBfdCgnQ29udGludWUnKSxcbiAgICAgICAgICAgICAgICAgICAgb25GaW5pc2hlZDogdGhpcy5vbkVtYWlsRGlhbG9nRmluaXNoZWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byB2ZXJpZnkgZW1haWwgYWRkcmVzczogXCIgKyBlcnIpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1VuYWJsZSB0byB2ZXJpZnkgZW1haWwgYWRkcmVzcycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJVbmFibGUgdG8gdmVyaWZ5IGVtYWlsIGFkZHJlc3MuXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICBjb25zdCBFZGl0YWJsZVRleHQgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5FZGl0YWJsZVRleHQnKTtcblxuICAgICAgICBjb25zdCBlbWFpbElucHV0ID0gdGhpcy5zdGF0ZS5lbWFpbEJ1c3kgPyA8U3Bpbm5lciAvPiA6IDxFZGl0YWJsZVRleHRcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZT17dGhpcy5zdGF0ZS5lbWFpbEFkZHJlc3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJteF9TZXRFbWFpbERpYWxvZ19lbWFpbF9pbnB1dFwiXG4gICAgICAgICAgICBhdXRvRm9jdXM9XCJ0cnVlXCJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdChcIkVtYWlsIGFkZHJlc3NcIil9XG4gICAgICAgICAgICBwbGFjZWhvbGRlckNsYXNzTmFtZT1cIm14X1NldEVtYWlsRGlhbG9nX2VtYWlsX2lucHV0X3BsYWNlaG9sZGVyXCJcbiAgICAgICAgICAgIGJsdXJUb0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICBvblZhbHVlQ2hhbmdlZD17dGhpcy5vbkVtYWlsQWRkcmVzc0NoYW5nZWR9IC8+O1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9XCJteF9TZXRFbWFpbERpYWxvZ1wiXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5vbkNhbmNlbGxlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGhpcy5wcm9wcy50aXRsZX1cbiAgICAgICAgICAgICAgICBjb250ZW50SWQ9J214X0RpYWxvZ19jb250ZW50J1xuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHAgaWQ9J214X0RpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1RoaXMgd2lsbCBhbGxvdyB5b3UgdG8gcmVzZXQgeW91ciBwYXNzd29yZCBhbmQgcmVjZWl2ZSBub3RpZmljYXRpb25zLicpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICB7IGVtYWlsSW5wdXQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19wcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e190KFwiQ29udGludWVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU3VibWl0fVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e190KFwiU2tpcFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DYW5jZWxsZWR9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19