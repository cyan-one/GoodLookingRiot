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

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _PasswordReset = _interopRequireDefault(require("../../../PasswordReset"));

var _AutoDiscoveryUtils = _interopRequireWildcard(require("../../../utils/AutoDiscoveryUtils"));

var _classnames = _interopRequireDefault(require("classnames"));

var _AuthPage = _interopRequireDefault(require("../../views/auth/AuthPage"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018, 2019 New Vector Ltd
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
// Phases
// Show controls to configure server details
const PHASE_SERVER_DETAILS = 0; // Show the forgot password inputs

const PHASE_FORGOT = 1; // Email is in the process of being sent

const PHASE_SENDING_EMAIL = 2; // Email has been sent

const PHASE_EMAIL_SENT = 3; // User has clicked the link in email and completed reset

const PHASE_DONE = 4;

var _default = (0, _createReactClass.default)({
  displayName: 'ForgotPassword',
  propTypes: {
    serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
    onServerConfigChange: _propTypes.default.func.isRequired,
    onLoginClick: _propTypes.default.func,
    onComplete: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      phase: PHASE_FORGOT,
      email: "",
      password: "",
      password2: "",
      errorText: null,
      // We perform liveliness checks later, but for now suppress the errors.
      // We also track the server dead errors independently of the regular errors so
      // that we can render it differently, and override any other error the user may
      // be seeing.
      serverIsAlive: true,
      serverErrorIsFatal: false,
      serverDeadError: "",
      serverRequiresIdServer: null
    };
  },
  componentDidMount: function () {
    this.reset = null;

    this._checkServerLiveliness(this.props.serverConfig);
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    if (newProps.serverConfig.hsUrl === this.props.serverConfig.hsUrl && newProps.serverConfig.isUrl === this.props.serverConfig.isUrl) return; // Do a liveliness check on the new URLs

    this._checkServerLiveliness(newProps.serverConfig);
  },
  _checkServerLiveliness: async function (serverConfig) {
    try {
      await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(serverConfig.hsUrl, serverConfig.isUrl);
      const pwReset = new _PasswordReset.default(serverConfig.hsUrl, serverConfig.isUrl);
      const serverRequiresIdServer = await pwReset.doesServerRequireIdServerParam();
      this.setState({
        serverIsAlive: true,
        serverRequiresIdServer
      });
    } catch (e) {
      this.setState(_AutoDiscoveryUtils.default.authComponentStateForError(e, "forgot_password"));
    }
  },
  submitPasswordReset: function (email, password) {
    this.setState({
      phase: PHASE_SENDING_EMAIL
    });
    this.reset = new _PasswordReset.default(this.props.serverConfig.hsUrl, this.props.serverConfig.isUrl);
    this.reset.resetPassword(email, password).then(() => {
      this.setState({
        phase: PHASE_EMAIL_SENT
      });
    }, err => {
      this.showErrorDialog((0, _languageHandler._t)('Failed to send email') + ": " + err.message);
      this.setState({
        phase: PHASE_FORGOT
      });
    });
  },
  onVerify: async function (ev) {
    ev.preventDefault();

    if (!this.reset) {
      console.error("onVerify called before submitPasswordReset!");
      return;
    }

    try {
      await this.reset.checkEmailLinkClicked();
      this.setState({
        phase: PHASE_DONE
      });
    } catch (err) {
      this.showErrorDialog(err.message);
    }
  },
  onSubmitForm: async function (ev) {
    ev.preventDefault(); // refresh the server errors, just in case the server came back online

    await this._checkServerLiveliness(this.props.serverConfig);

    if (!this.state.email) {
      this.showErrorDialog((0, _languageHandler._t)('The email address linked to your account must be entered.'));
    } else if (!this.state.password || !this.state.password2) {
      this.showErrorDialog((0, _languageHandler._t)('A new password must be entered.'));
    } else if (this.state.password !== this.state.password2) {
      this.showErrorDialog((0, _languageHandler._t)('New passwords must match each other.'));
    } else {
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

      _Modal.default.createTrackedDialog('Forgot Password Warning', '', QuestionDialog, {
        title: (0, _languageHandler._t)('Warning!'),
        description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Changing your password will reset any end-to-end encryption keys " + "on all of your sessions, making encrypted chat history unreadable. Set up " + "Key Backup or export your room keys from another session before resetting your " + "password.")),
        button: (0, _languageHandler._t)('Continue'),
        onFinished: confirmed => {
          if (confirmed) {
            this.submitPasswordReset(this.state.email, this.state.password);
          }
        }
      });
    }
  },
  onInputChanged: function (stateKey, ev) {
    this.setState({
      [stateKey]: ev.target.value
    });
  },

  async onServerDetailsNextPhaseClick() {
    this.setState({
      phase: PHASE_FORGOT
    });
  },

  onEditServerDetailsClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({
      phase: PHASE_SERVER_DETAILS
    });
  },

  onLoginClick: function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onLoginClick();
  },
  showErrorDialog: function (body, title) {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

    _Modal.default.createTrackedDialog('Forgot Password Error', '', ErrorDialog, {
      title: title,
      description: body
    });
  },

  renderServerDetails() {
    const ServerConfig = sdk.getComponent("auth.ServerConfig");

    if (_SdkConfig.default.get()['disable_custom_urls']) {
      return null;
    }

    return /*#__PURE__*/_react.default.createElement(ServerConfig, {
      serverConfig: this.props.serverConfig,
      onServerConfigChange: this.props.onServerConfigChange,
      delayTimeMs: 0,
      showIdentityServerIfRequiredByHomeserver: true,
      onAfterSubmit: this.onServerDetailsNextPhaseClick,
      submitText: (0, _languageHandler._t)("Next"),
      submitClass: "mx_Login_submit"
    });
  },

  renderForgot() {
    const Field = sdk.getComponent('elements.Field');
    let errorText = null;
    const err = this.state.errorText;

    if (err) {
      errorText = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Login_error"
      }, err);
    }

    let serverDeadSection;

    if (!this.state.serverIsAlive) {
      const classes = (0, _classnames.default)({
        "mx_Login_error": true,
        "mx_Login_serverError": true,
        "mx_Login_serverErrorNonFatal": !this.state.serverErrorIsFatal
      });
      serverDeadSection = /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, this.state.serverDeadError);
    }

    let yourMatrixAccountText = (0, _languageHandler._t)('Your Matrix account on %(serverName)s', {
      serverName: this.props.serverConfig.hsName
    });

    if (this.props.serverConfig.hsNameIsDifferent) {
      const TextWithTooltip = sdk.getComponent("elements.TextWithTooltip");
      yourMatrixAccountText = (0, _languageHandler._t)('Your Matrix account on <underlinedServerName />', {}, {
        'underlinedServerName': () => {
          return /*#__PURE__*/_react.default.createElement(TextWithTooltip, {
            class: "mx_Login_underlinedServerName",
            tooltip: this.props.serverConfig.hsUrl
          }, this.props.serverConfig.hsName);
        }
      });
    } // If custom URLs are allowed, wire up the server details edit link.


    let editLink = null;

    if (!_SdkConfig.default.get()['disable_custom_urls']) {
      editLink = /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_AuthBody_editServerDetails",
        href: "#",
        onClick: this.onEditServerDetailsClick
      }, (0, _languageHandler._t)('Change'));
    }

    if (!this.props.serverConfig.isUrl && this.state.serverRequiresIdServer) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, yourMatrixAccountText, editLink), (0, _languageHandler._t)("No identity server is configured: " + "add one in server settings to reset your password."), /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_AuthBody_changeFlow",
        onClick: this.onLoginClick,
        href: "#"
      }, (0, _languageHandler._t)('Sign in instead')));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, errorText, serverDeadSection, /*#__PURE__*/_react.default.createElement("h3", null, yourMatrixAccountText, editLink), /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this.onSubmitForm
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AuthBody_fieldRow"
    }, /*#__PURE__*/_react.default.createElement(Field, {
      name: "reset_email" // define a name so browser's password autofill gets less confused
      ,
      type: "text",
      label: (0, _languageHandler._t)('Email'),
      value: this.state.email,
      onChange: this.onInputChanged.bind(this, "email"),
      autoFocus: true
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AuthBody_fieldRow"
    }, /*#__PURE__*/_react.default.createElement(Field, {
      name: "reset_password",
      type: "password",
      label: (0, _languageHandler._t)('Password'),
      value: this.state.password,
      onChange: this.onInputChanged.bind(this, "password")
    }), /*#__PURE__*/_react.default.createElement(Field, {
      name: "reset_password_confirm",
      type: "password",
      label: (0, _languageHandler._t)('Confirm'),
      value: this.state.password2,
      onChange: this.onInputChanged.bind(this, "password2")
    })), /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)('A verification email will be sent to your inbox to confirm ' + 'setting your new password.')), /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Login_submit",
      type: "submit",
      value: (0, _languageHandler._t)('Send Reset Email')
    })), /*#__PURE__*/_react.default.createElement("a", {
      className: "mx_AuthBody_changeFlow",
      onClick: this.onLoginClick,
      href: "#"
    }, (0, _languageHandler._t)('Sign in instead')));
  },

  renderSendingEmail() {
    const Spinner = sdk.getComponent("elements.Spinner");
    return /*#__PURE__*/_react.default.createElement(Spinner, null);
  },

  renderEmailSent() {
    return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("An email has been sent to %(emailAddress)s. Once you've followed the " + "link it contains, click below.", {
      emailAddress: this.state.email
    }), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Login_submit",
      type: "button",
      onClick: this.onVerify,
      value: (0, _languageHandler._t)('I have verified my email address')
    }));
  },

  renderDone() {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your password has been reset.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You have been logged out of all sessions and will no longer receive " + "push notifications. To re-enable notifications, sign in again on each " + "device.")), /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Login_submit",
      type: "button",
      onClick: this.props.onComplete,
      value: (0, _languageHandler._t)('Return to login screen')
    }));
  },

  render: function () {
    const AuthHeader = sdk.getComponent("auth.AuthHeader");
    const AuthBody = sdk.getComponent("auth.AuthBody");
    let resetPasswordJsx;

    switch (this.state.phase) {
      case PHASE_SERVER_DETAILS:
        resetPasswordJsx = this.renderServerDetails();
        break;

      case PHASE_FORGOT:
        resetPasswordJsx = this.renderForgot();
        break;

      case PHASE_SENDING_EMAIL:
        resetPasswordJsx = this.renderSendingEmail();
        break;

      case PHASE_EMAIL_SENT:
        resetPasswordJsx = this.renderEmailSent();
        break;

      case PHASE_DONE:
        resetPasswordJsx = this.renderDone();
        break;
    }

    return /*#__PURE__*/_react.default.createElement(_AuthPage.default, null, /*#__PURE__*/_react.default.createElement(AuthHeader, null), /*#__PURE__*/_react.default.createElement(AuthBody, null, /*#__PURE__*/_react.default.createElement("h2", null, " ", (0, _languageHandler._t)('Set a new password'), " "), resetPasswordJsx));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9Gb3Jnb3RQYXNzd29yZC5qcyJdLCJuYW1lcyI6WyJQSEFTRV9TRVJWRVJfREVUQUlMUyIsIlBIQVNFX0ZPUkdPVCIsIlBIQVNFX1NFTkRJTkdfRU1BSUwiLCJQSEFTRV9FTUFJTF9TRU5UIiwiUEhBU0VfRE9ORSIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwic2VydmVyQ29uZmlnIiwiUHJvcFR5cGVzIiwiaW5zdGFuY2VPZiIsIlZhbGlkYXRlZFNlcnZlckNvbmZpZyIsImlzUmVxdWlyZWQiLCJvblNlcnZlckNvbmZpZ0NoYW5nZSIsImZ1bmMiLCJvbkxvZ2luQ2xpY2siLCJvbkNvbXBsZXRlIiwiZ2V0SW5pdGlhbFN0YXRlIiwicGhhc2UiLCJlbWFpbCIsInBhc3N3b3JkIiwicGFzc3dvcmQyIiwiZXJyb3JUZXh0Iiwic2VydmVySXNBbGl2ZSIsInNlcnZlckVycm9ySXNGYXRhbCIsInNlcnZlckRlYWRFcnJvciIsInNlcnZlclJlcXVpcmVzSWRTZXJ2ZXIiLCJjb21wb25lbnREaWRNb3VudCIsInJlc2V0IiwiX2NoZWNrU2VydmVyTGl2ZWxpbmVzcyIsInByb3BzIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXdQcm9wcyIsImhzVXJsIiwiaXNVcmwiLCJBdXRvRGlzY292ZXJ5VXRpbHMiLCJ2YWxpZGF0ZVNlcnZlckNvbmZpZ1dpdGhTdGF0aWNVcmxzIiwicHdSZXNldCIsIlBhc3N3b3JkUmVzZXQiLCJkb2VzU2VydmVyUmVxdWlyZUlkU2VydmVyUGFyYW0iLCJzZXRTdGF0ZSIsImUiLCJhdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvciIsInN1Ym1pdFBhc3N3b3JkUmVzZXQiLCJyZXNldFBhc3N3b3JkIiwidGhlbiIsImVyciIsInNob3dFcnJvckRpYWxvZyIsIm1lc3NhZ2UiLCJvblZlcmlmeSIsImV2IiwicHJldmVudERlZmF1bHQiLCJjb25zb2xlIiwiZXJyb3IiLCJjaGVja0VtYWlsTGlua0NsaWNrZWQiLCJvblN1Ym1pdEZvcm0iLCJzdGF0ZSIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImJ1dHRvbiIsIm9uRmluaXNoZWQiLCJjb25maXJtZWQiLCJvbklucHV0Q2hhbmdlZCIsInN0YXRlS2V5IiwidGFyZ2V0IiwidmFsdWUiLCJvblNlcnZlckRldGFpbHNOZXh0UGhhc2VDbGljayIsIm9uRWRpdFNlcnZlckRldGFpbHNDbGljayIsInN0b3BQcm9wYWdhdGlvbiIsImJvZHkiLCJFcnJvckRpYWxvZyIsInJlbmRlclNlcnZlckRldGFpbHMiLCJTZXJ2ZXJDb25maWciLCJTZGtDb25maWciLCJnZXQiLCJyZW5kZXJGb3Jnb3QiLCJGaWVsZCIsInNlcnZlckRlYWRTZWN0aW9uIiwiY2xhc3NlcyIsInlvdXJNYXRyaXhBY2NvdW50VGV4dCIsInNlcnZlck5hbWUiLCJoc05hbWUiLCJoc05hbWVJc0RpZmZlcmVudCIsIlRleHRXaXRoVG9vbHRpcCIsImVkaXRMaW5rIiwiYmluZCIsInJlbmRlclNlbmRpbmdFbWFpbCIsIlNwaW5uZXIiLCJyZW5kZXJFbWFpbFNlbnQiLCJlbWFpbEFkZHJlc3MiLCJyZW5kZXJEb25lIiwicmVuZGVyIiwiQXV0aEhlYWRlciIsIkF1dGhCb2R5IiwicmVzZXRQYXNzd29yZEpzeCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBNUJBOzs7Ozs7Ozs7Ozs7Ozs7OztBQThCQTtBQUNBO0FBQ0EsTUFBTUEsb0JBQW9CLEdBQUcsQ0FBN0IsQyxDQUNBOztBQUNBLE1BQU1DLFlBQVksR0FBRyxDQUFyQixDLENBQ0E7O0FBQ0EsTUFBTUMsbUJBQW1CLEdBQUcsQ0FBNUIsQyxDQUNBOztB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R0FBR3ZDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixpQkFBakIsQ0FBbkI7QUFDQSxVQUFNdUMsUUFBUSxHQUFHeEMsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGVBQWpCLENBQWpCO0FBRUEsUUFBSXdDLGdCQUFKOztBQUNBLFlBQVEsS0FBSzNDLEtBQUwsQ0FBV3RDLEtBQW5CO0FBQ0ksV0FBS2pCLG9CQUFMO0FBQ0lrRyxRQUFBQSxnQkFBZ0IsR0FBRyxLQUFLdkIsbUJBQUwsRUFBbkI7QUFDQTs7QUFDSixXQUFLMUUsWUFBTDtBQUNJaUcsUUFBQUEsZ0JBQWdCLEdBQUcsS0FBS25CLFlBQUwsRUFBbkI7QUFDQTs7QUFDSixXQUFLN0UsbUJBQUw7QUFDSWdHLFFBQUFBLGdCQUFnQixHQUFHLEtBQUtSLGtCQUFMLEVBQW5CO0FBQ0E7O0FBQ0osV0FBS3ZGLGdCQUFMO0FBQ0krRixRQUFBQSxnQkFBZ0IsR0FBRyxLQUFLTixlQUFMLEVBQW5CO0FBQ0E7O0FBQ0osV0FBS3hGLFVBQUw7QUFDSThGLFFBQUFBLGdCQUFnQixHQUFHLEtBQUtKLFVBQUwsRUFBbkI7QUFDQTtBQWZSOztBQWtCQSx3QkFDSSw2QkFBQyxpQkFBRCxxQkFDSSw2QkFBQyxVQUFELE9BREosZUFFSSw2QkFBQyxRQUFELHFCQUNJLDhDQUFPLHlCQUFHLG9CQUFILENBQVAsTUFESixFQUVLSSxnQkFGTCxDQUZKLENBREo7QUFTSDtBQXJXMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTgsIDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCBTZGtDb25maWcgZnJvbSBcIi4uLy4uLy4uL1Nka0NvbmZpZ1wiO1xuaW1wb3J0IFBhc3N3b3JkUmVzZXQgZnJvbSBcIi4uLy4uLy4uL1Bhc3N3b3JkUmVzZXRcIjtcbmltcG9ydCBBdXRvRGlzY292ZXJ5VXRpbHMsIHtWYWxpZGF0ZWRTZXJ2ZXJDb25maWd9IGZyb20gXCIuLi8uLi8uLi91dGlscy9BdXRvRGlzY292ZXJ5VXRpbHNcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IEF1dGhQYWdlIGZyb20gXCIuLi8uLi92aWV3cy9hdXRoL0F1dGhQYWdlXCI7XG5cbi8vIFBoYXNlc1xuLy8gU2hvdyBjb250cm9scyB0byBjb25maWd1cmUgc2VydmVyIGRldGFpbHNcbmNvbnN0IFBIQVNFX1NFUlZFUl9ERVRBSUxTID0gMDtcbi8vIFNob3cgdGhlIGZvcmdvdCBwYXNzd29yZCBpbnB1dHNcbmNvbnN0IFBIQVNFX0ZPUkdPVCA9IDE7XG4vLyBFbWFpbCBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBzZW50XG5jb25zdCBQSEFTRV9TRU5ESU5HX0VNQUlMID0gMjtcbi8vIEVtYWlsIGhhcyBiZWVuIHNlbnRcbmNvbnN0IFBIQVNFX0VNQUlMX1NFTlQgPSAzO1xuLy8gVXNlciBoYXMgY2xpY2tlZCB0aGUgbGluayBpbiBlbWFpbCBhbmQgY29tcGxldGVkIHJlc2V0XG5jb25zdCBQSEFTRV9ET05FID0gNDtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdGb3Jnb3RQYXNzd29yZCcsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgc2VydmVyQ29uZmlnOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihWYWxpZGF0ZWRTZXJ2ZXJDb25maWcpLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkxvZ2luQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvbkNvbXBsZXRlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX0ZPUkdPVCxcbiAgICAgICAgICAgIGVtYWlsOiBcIlwiLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFwiXCIsXG4gICAgICAgICAgICBwYXNzd29yZDI6IFwiXCIsXG4gICAgICAgICAgICBlcnJvclRleHQ6IG51bGwsXG5cbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm0gbGl2ZWxpbmVzcyBjaGVja3MgbGF0ZXIsIGJ1dCBmb3Igbm93IHN1cHByZXNzIHRoZSBlcnJvcnMuXG4gICAgICAgICAgICAvLyBXZSBhbHNvIHRyYWNrIHRoZSBzZXJ2ZXIgZGVhZCBlcnJvcnMgaW5kZXBlbmRlbnRseSBvZiB0aGUgcmVndWxhciBlcnJvcnMgc29cbiAgICAgICAgICAgIC8vIHRoYXQgd2UgY2FuIHJlbmRlciBpdCBkaWZmZXJlbnRseSwgYW5kIG92ZXJyaWRlIGFueSBvdGhlciBlcnJvciB0aGUgdXNlciBtYXlcbiAgICAgICAgICAgIC8vIGJlIHNlZWluZy5cbiAgICAgICAgICAgIHNlcnZlcklzQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBzZXJ2ZXJFcnJvcklzRmF0YWw6IGZhbHNlLFxuICAgICAgICAgICAgc2VydmVyRGVhZEVycm9yOiBcIlwiLFxuICAgICAgICAgICAgc2VydmVyUmVxdWlyZXNJZFNlcnZlcjogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlc2V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2hlY2tTZXJ2ZXJMaXZlbGluZXNzKHRoaXMucHJvcHMuc2VydmVyQ29uZmlnKTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcbiAgICAgICAgaWYgKG5ld1Byb3BzLnNlcnZlckNvbmZpZy5oc1VybCA9PT0gdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwgJiZcbiAgICAgICAgICAgIG5ld1Byb3BzLnNlcnZlckNvbmZpZy5pc1VybCA9PT0gdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaXNVcmwpIHJldHVybjtcblxuICAgICAgICAvLyBEbyBhIGxpdmVsaW5lc3MgY2hlY2sgb24gdGhlIG5ldyBVUkxzXG4gICAgICAgIHRoaXMuX2NoZWNrU2VydmVyTGl2ZWxpbmVzcyhuZXdQcm9wcy5zZXJ2ZXJDb25maWcpO1xuICAgIH0sXG5cbiAgICBfY2hlY2tTZXJ2ZXJMaXZlbGluZXNzOiBhc3luYyBmdW5jdGlvbihzZXJ2ZXJDb25maWcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IEF1dG9EaXNjb3ZlcnlVdGlscy52YWxpZGF0ZVNlcnZlckNvbmZpZ1dpdGhTdGF0aWNVcmxzKFxuICAgICAgICAgICAgICAgIHNlcnZlckNvbmZpZy5oc1VybCxcbiAgICAgICAgICAgICAgICBzZXJ2ZXJDb25maWcuaXNVcmwsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBwd1Jlc2V0ID0gbmV3IFBhc3N3b3JkUmVzZXQoc2VydmVyQ29uZmlnLmhzVXJsLCBzZXJ2ZXJDb25maWcuaXNVcmwpO1xuICAgICAgICAgICAgY29uc3Qgc2VydmVyUmVxdWlyZXNJZFNlcnZlciA9IGF3YWl0IHB3UmVzZXQuZG9lc1NlcnZlclJlcXVpcmVJZFNlcnZlclBhcmFtKCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHNlcnZlcklzQWxpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgc2VydmVyUmVxdWlyZXNJZFNlcnZlcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKEF1dG9EaXNjb3ZlcnlVdGlscy5hdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvcihlLCBcImZvcmdvdF9wYXNzd29yZFwiKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3VibWl0UGFzc3dvcmRSZXNldDogZnVuY3Rpb24oZW1haWwsIHBhc3N3b3JkKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NFTkRJTkdfRU1BSUwsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlc2V0ID0gbmV3IFBhc3N3b3JkUmVzZXQodGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwsIHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsKTtcbiAgICAgICAgdGhpcy5yZXNldC5yZXNldFBhc3N3b3JkKGVtYWlsLCBwYXNzd29yZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBwaGFzZTogUEhBU0VfRU1BSUxfU0VOVCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3dFcnJvckRpYWxvZyhfdCgnRmFpbGVkIHRvIHNlbmQgZW1haWwnKSArIFwiOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9GT1JHT1QsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uVmVyaWZ5OiBhc3luYyBmdW5jdGlvbihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoIXRoaXMucmVzZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJvblZlcmlmeSBjYWxsZWQgYmVmb3JlIHN1Ym1pdFBhc3N3b3JkUmVzZXQhXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlc2V0LmNoZWNrRW1haWxMaW5rQ2xpY2tlZCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHBoYXNlOiBQSEFTRV9ET05FIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yRGlhbG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblN1Ym1pdEZvcm06IGFzeW5jIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gcmVmcmVzaCB0aGUgc2VydmVyIGVycm9ycywganVzdCBpbiBjYXNlIHRoZSBzZXJ2ZXIgY2FtZSBiYWNrIG9ubGluZVxuICAgICAgICBhd2FpdCB0aGlzLl9jaGVja1NlcnZlckxpdmVsaW5lc3ModGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcpO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5lbWFpbCkge1xuICAgICAgICAgICAgdGhpcy5zaG93RXJyb3JEaWFsb2coX3QoJ1RoZSBlbWFpbCBhZGRyZXNzIGxpbmtlZCB0byB5b3VyIGFjY291bnQgbXVzdCBiZSBlbnRlcmVkLicpKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5wYXNzd29yZCB8fCAhdGhpcy5zdGF0ZS5wYXNzd29yZDIpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yRGlhbG9nKF90KCdBIG5ldyBwYXNzd29yZCBtdXN0IGJlIGVudGVyZWQuJykpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUucGFzc3dvcmQgIT09IHRoaXMuc3RhdGUucGFzc3dvcmQyKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dFcnJvckRpYWxvZyhfdCgnTmV3IHBhc3N3b3JkcyBtdXN0IG1hdGNoIGVhY2ggb3RoZXIuJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZvcmdvdCBQYXNzd29yZCBXYXJuaW5nJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KCdXYXJuaW5nIScpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkNoYW5naW5nIHlvdXIgcGFzc3dvcmQgd2lsbCByZXNldCBhbnkgZW5kLXRvLWVuZCBlbmNyeXB0aW9uIGtleXMgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib24gYWxsIG9mIHlvdXIgc2Vzc2lvbnMsIG1ha2luZyBlbmNyeXB0ZWQgY2hhdCBoaXN0b3J5IHVucmVhZGFibGUuIFNldCB1cCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJLZXkgQmFja3VwIG9yIGV4cG9ydCB5b3VyIHJvb20ga2V5cyBmcm9tIGFub3RoZXIgc2Vzc2lvbiBiZWZvcmUgcmVzZXR0aW5nIHlvdXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGFzc3dvcmQuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoJ0NvbnRpbnVlJyksXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogKGNvbmZpcm1lZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybWVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN1Ym1pdFBhc3N3b3JkUmVzZXQodGhpcy5zdGF0ZS5lbWFpbCwgdGhpcy5zdGF0ZS5wYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25JbnB1dENoYW5nZWQ6IGZ1bmN0aW9uKHN0YXRlS2V5LCBldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIFtzdGF0ZUtleV06IGV2LnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFzeW5jIG9uU2VydmVyRGV0YWlsc05leHRQaGFzZUNsaWNrKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9GT1JHT1QsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2soZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NFUlZFUl9ERVRBSUxTLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25Mb2dpbkNsaWNrOiBmdW5jdGlvbihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkxvZ2luQ2xpY2soKTtcbiAgICB9LFxuXG4gICAgc2hvd0Vycm9yRGlhbG9nOiBmdW5jdGlvbihib2R5LCB0aXRsZSkge1xuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGb3Jnb3QgUGFzc3dvcmQgRXJyb3InLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBib2R5LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyU2VydmVyRGV0YWlscygpIHtcbiAgICAgICAgY29uc3QgU2VydmVyQ29uZmlnID0gc2RrLmdldENvbXBvbmVudChcImF1dGguU2VydmVyQ29uZmlnXCIpO1xuXG4gICAgICAgIGlmIChTZGtDb25maWcuZ2V0KClbJ2Rpc2FibGVfY3VzdG9tX3VybHMnXSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPFNlcnZlckNvbmZpZ1xuICAgICAgICAgICAgc2VydmVyQ29uZmlnPXt0aGlzLnByb3BzLnNlcnZlckNvbmZpZ31cbiAgICAgICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlPXt0aGlzLnByb3BzLm9uU2VydmVyQ29uZmlnQ2hhbmdlfVxuICAgICAgICAgICAgZGVsYXlUaW1lTXM9ezB9XG4gICAgICAgICAgICBzaG93SWRlbnRpdHlTZXJ2ZXJJZlJlcXVpcmVkQnlIb21lc2VydmVyPXt0cnVlfVxuICAgICAgICAgICAgb25BZnRlclN1Ym1pdD17dGhpcy5vblNlcnZlckRldGFpbHNOZXh0UGhhc2VDbGlja31cbiAgICAgICAgICAgIHN1Ym1pdFRleHQ9e190KFwiTmV4dFwiKX1cbiAgICAgICAgICAgIHN1Ym1pdENsYXNzPVwibXhfTG9naW5fc3VibWl0XCJcbiAgICAgICAgLz47XG4gICAgfSxcblxuICAgIHJlbmRlckZvcmdvdCgpIHtcbiAgICAgICAgY29uc3QgRmllbGQgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5GaWVsZCcpO1xuXG4gICAgICAgIGxldCBlcnJvclRleHQgPSBudWxsO1xuICAgICAgICBjb25zdCBlcnIgPSB0aGlzLnN0YXRlLmVycm9yVGV4dDtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgZXJyb3JUZXh0ID0gPGRpdiBjbGFzc05hbWU9XCJteF9Mb2dpbl9lcnJvclwiPnsgZXJyIH08L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2VydmVyRGVhZFNlY3Rpb247XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5zZXJ2ZXJJc0FsaXZlKSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAgICAgXCJteF9Mb2dpbl9lcnJvclwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfTG9naW5fc2VydmVyRXJyb3JcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcIm14X0xvZ2luX3NlcnZlckVycm9yTm9uRmF0YWxcIjogIXRoaXMuc3RhdGUuc2VydmVyRXJyb3JJc0ZhdGFsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXJ2ZXJEZWFkU2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNlcnZlckRlYWRFcnJvcn1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgeW91ck1hdHJpeEFjY291bnRUZXh0ID0gX3QoJ1lvdXIgTWF0cml4IGFjY291bnQgb24gJShzZXJ2ZXJOYW1lKXMnLCB7XG4gICAgICAgICAgICBzZXJ2ZXJOYW1lOiB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc05hbWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNOYW1lSXNEaWZmZXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IFRleHRXaXRoVG9vbHRpcCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5UZXh0V2l0aFRvb2x0aXBcIik7XG5cbiAgICAgICAgICAgIHlvdXJNYXRyaXhBY2NvdW50VGV4dCA9IF90KCdZb3VyIE1hdHJpeCBhY2NvdW50IG9uIDx1bmRlcmxpbmVkU2VydmVyTmFtZSAvPicsIHt9LCB7XG4gICAgICAgICAgICAgICAgJ3VuZGVybGluZWRTZXJ2ZXJOYW1lJzogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPFRleHRXaXRoVG9vbHRpcFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJteF9Mb2dpbl91bmRlcmxpbmVkU2VydmVyTmFtZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwPXt0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc1VybH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMucHJvcHMuc2VydmVyQ29uZmlnLmhzTmFtZX1cbiAgICAgICAgICAgICAgICAgICAgPC9UZXh0V2l0aFRvb2x0aXA+O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGN1c3RvbSBVUkxzIGFyZSBhbGxvd2VkLCB3aXJlIHVwIHRoZSBzZXJ2ZXIgZGV0YWlscyBlZGl0IGxpbmsuXG4gICAgICAgIGxldCBlZGl0TGluayA9IG51bGw7XG4gICAgICAgIGlmICghU2RrQ29uZmlnLmdldCgpWydkaXNhYmxlX2N1c3RvbV91cmxzJ10pIHtcbiAgICAgICAgICAgIGVkaXRMaW5rID0gPGEgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfZWRpdFNlcnZlckRldGFpbHNcIlxuICAgICAgICAgICAgICAgIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5vbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2t9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge190KCdDaGFuZ2UnKX1cbiAgICAgICAgICAgIDwvYT47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsICYmIHRoaXMuc3RhdGUuc2VydmVyUmVxdWlyZXNJZFNlcnZlcikge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzPlxuICAgICAgICAgICAgICAgICAgICB7eW91ck1hdHJpeEFjY291bnRUZXh0fVxuICAgICAgICAgICAgICAgICAgICB7ZWRpdExpbmt9XG4gICAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiTm8gaWRlbnRpdHkgc2VydmVyIGlzIGNvbmZpZ3VyZWQ6IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJhZGQgb25lIGluIHNlcnZlciBzZXR0aW5ncyB0byByZXNldCB5b3VyIHBhc3N3b3JkLlwiLFxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfY2hhbmdlRmxvd1wiIG9uQ2xpY2s9e3RoaXMub25Mb2dpbkNsaWNrfSBocmVmPVwiI1wiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoJ1NpZ24gaW4gaW5zdGVhZCcpfVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAge2Vycm9yVGV4dH1cbiAgICAgICAgICAgIHtzZXJ2ZXJEZWFkU2VjdGlvbn1cbiAgICAgICAgICAgIDxoMz5cbiAgICAgICAgICAgICAgICB7eW91ck1hdHJpeEFjY291bnRUZXh0fVxuICAgICAgICAgICAgICAgIHtlZGl0TGlua31cbiAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdEZvcm19PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfZmllbGRSb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgPEZpZWxkXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwicmVzZXRfZW1haWxcIiAvLyBkZWZpbmUgYSBuYW1lIHNvIGJyb3dzZXIncyBwYXNzd29yZCBhdXRvZmlsbCBnZXRzIGxlc3MgY29uZnVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdCgnRW1haWwnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmVtYWlsfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25JbnB1dENoYW5nZWQuYmluZCh0aGlzLCBcImVtYWlsXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9maWVsZFJvd1wiPlxuICAgICAgICAgICAgICAgICAgICA8RmllbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJyZXNldF9wYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdQYXNzd29yZCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc3dvcmR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbklucHV0Q2hhbmdlZC5iaW5kKHRoaXMsIFwicGFzc3dvcmRcIil9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInJlc2V0X3Bhc3N3b3JkX2NvbmZpcm1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdCgnQ29uZmlybScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc3dvcmQyfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25JbnB1dENoYW5nZWQuYmluZCh0aGlzLCBcInBhc3N3b3JkMlwiKX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57X3QoXG4gICAgICAgICAgICAgICAgICAgICdBIHZlcmlmaWNhdGlvbiBlbWFpbCB3aWxsIGJlIHNlbnQgdG8geW91ciBpbmJveCB0byBjb25maXJtICcgK1xuICAgICAgICAgICAgICAgICAgICAnc2V0dGluZyB5b3VyIG5ldyBwYXNzd29yZC4nLFxuICAgICAgICAgICAgICAgICl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Mb2dpbl9zdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e190KCdTZW5kIFJlc2V0IEVtYWlsJyl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm14X0F1dGhCb2R5X2NoYW5nZUZsb3dcIiBvbkNsaWNrPXt0aGlzLm9uTG9naW5DbGlja30gaHJlZj1cIiNcIj5cbiAgICAgICAgICAgICAgICB7X3QoJ1NpZ24gaW4gaW5zdGVhZCcpfVxuICAgICAgICAgICAgPC9hPlxuICAgICAgICA8L2Rpdj47XG4gICAgfSxcblxuICAgIHJlbmRlclNlbmRpbmdFbWFpbCgpIHtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICByZXR1cm4gPFNwaW5uZXIgLz47XG4gICAgfSxcblxuICAgIHJlbmRlckVtYWlsU2VudCgpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICB7X3QoXCJBbiBlbWFpbCBoYXMgYmVlbiBzZW50IHRvICUoZW1haWxBZGRyZXNzKXMuIE9uY2UgeW91J3ZlIGZvbGxvd2VkIHRoZSBcIiArXG4gICAgICAgICAgICAgICAgXCJsaW5rIGl0IGNvbnRhaW5zLCBjbGljayBiZWxvdy5cIiwgeyBlbWFpbEFkZHJlc3M6IHRoaXMuc3RhdGUuZW1haWwgfSl9XG4gICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJteF9Mb2dpbl9zdWJtaXRcIiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17dGhpcy5vblZlcmlmeX1cbiAgICAgICAgICAgICAgICB2YWx1ZT17X3QoJ0kgaGF2ZSB2ZXJpZmllZCBteSBlbWFpbCBhZGRyZXNzJyl9IC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9LFxuXG4gICAgcmVuZGVyRG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8cD57X3QoXCJZb3VyIHBhc3N3b3JkIGhhcyBiZWVuIHJlc2V0LlwiKX08L3A+XG4gICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJZb3UgaGF2ZSBiZWVuIGxvZ2dlZCBvdXQgb2YgYWxsIHNlc3Npb25zIGFuZCB3aWxsIG5vIGxvbmdlciByZWNlaXZlIFwiICtcbiAgICAgICAgICAgICAgICBcInB1c2ggbm90aWZpY2F0aW9ucy4gVG8gcmUtZW5hYmxlIG5vdGlmaWNhdGlvbnMsIHNpZ24gaW4gYWdhaW4gb24gZWFjaCBcIiArXG4gICAgICAgICAgICAgICAgXCJkZXZpY2UuXCIsXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJteF9Mb2dpbl9zdWJtaXRcIiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17dGhpcy5wcm9wcy5vbkNvbXBsZXRlfVxuICAgICAgICAgICAgICAgIHZhbHVlPXtfdCgnUmV0dXJuIHRvIGxvZ2luIHNjcmVlbicpfSAvPlxuICAgICAgICA8L2Rpdj47XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEF1dGhIZWFkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXV0aC5BdXRoSGVhZGVyXCIpO1xuICAgICAgICBjb25zdCBBdXRoQm9keSA9IHNkay5nZXRDb21wb25lbnQoXCJhdXRoLkF1dGhCb2R5XCIpO1xuXG4gICAgICAgIGxldCByZXNldFBhc3N3b3JkSnN4O1xuICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUucGhhc2UpIHtcbiAgICAgICAgICAgIGNhc2UgUEhBU0VfU0VSVkVSX0RFVEFJTFM6XG4gICAgICAgICAgICAgICAgcmVzZXRQYXNzd29yZEpzeCA9IHRoaXMucmVuZGVyU2VydmVyRGV0YWlscygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQSEFTRV9GT1JHT1Q6XG4gICAgICAgICAgICAgICAgcmVzZXRQYXNzd29yZEpzeCA9IHRoaXMucmVuZGVyRm9yZ290KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX1NFTkRJTkdfRU1BSUw6XG4gICAgICAgICAgICAgICAgcmVzZXRQYXNzd29yZEpzeCA9IHRoaXMucmVuZGVyU2VuZGluZ0VtYWlsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0VNQUlMX1NFTlQ6XG4gICAgICAgICAgICAgICAgcmVzZXRQYXNzd29yZEpzeCA9IHRoaXMucmVuZGVyRW1haWxTZW50KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBIQVNFX0RPTkU6XG4gICAgICAgICAgICAgICAgcmVzZXRQYXNzd29yZEpzeCA9IHRoaXMucmVuZGVyRG9uZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBdXRoUGFnZT5cbiAgICAgICAgICAgICAgICA8QXV0aEhlYWRlciAvPlxuICAgICAgICAgICAgICAgIDxBdXRoQm9keT5cbiAgICAgICAgICAgICAgICAgICAgPGgyPiB7IF90KCdTZXQgYSBuZXcgcGFzc3dvcmQnKSB9IDwvaDI+XG4gICAgICAgICAgICAgICAgICAgIHtyZXNldFBhc3N3b3JkSnN4fVxuICAgICAgICAgICAgICAgIDwvQXV0aEJvZHk+XG4gICAgICAgICAgICA8L0F1dGhQYWdlPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==