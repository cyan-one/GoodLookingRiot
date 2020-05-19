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

var _phonenumber = require("../../../phonenumber");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _languageHandler = require("../../../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _Registration = require("../../../Registration");

var _Validation = _interopRequireDefault(require("../elements/Validation"));

var _AutoDiscoveryUtils = require("../../../utils/AutoDiscoveryUtils");

var _PassphraseField = _interopRequireDefault(require("./PassphraseField"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2018, 2019 New Vector Ltd
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
const FIELD_EMAIL = 'field_email';
const FIELD_PHONE_NUMBER = 'field_phone_number';
const FIELD_USERNAME = 'field_username';
const FIELD_PASSWORD = 'field_password';
const FIELD_PASSWORD_CONFIRM = 'field_password_confirm';
const PASSWORD_MIN_SCORE = 3; // safely unguessable: moderate protection from offline slow-hash scenario.

/**
 * A pure UI component which displays a registration form.
 */

var _default = (0, _createReactClass.default)({
  displayName: 'RegistrationForm',
  propTypes: {
    // Values pre-filled in the input boxes when the component loads
    defaultEmail: _propTypes.default.string,
    defaultPhoneCountry: _propTypes.default.string,
    defaultPhoneNumber: _propTypes.default.string,
    defaultUsername: _propTypes.default.string,
    defaultPassword: _propTypes.default.string,
    onRegisterClick: _propTypes.default.func.isRequired,
    // onRegisterClick(Object) => ?Promise
    onEditServerDetailsClick: _propTypes.default.func,
    flows: _propTypes.default.arrayOf(_propTypes.default.object).isRequired,
    serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
    canSubmit: _propTypes.default.bool,
    serverRequiresIdServer: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      onValidationChange: console.error,
      canSubmit: true
    };
  },
  getInitialState: function () {
    return {
      // Field error codes by field ID
      fieldValid: {},
      // The ISO2 country code selected in the phone number entry
      phoneCountry: this.props.defaultPhoneCountry,
      username: this.props.defaultUsername || "",
      email: this.props.defaultEmail || "",
      phoneNumber: this.props.defaultPhoneNumber || "",
      password: this.props.defaultPassword || "",
      passwordConfirm: this.props.defaultPassword || "",
      passwordComplexity: null
    };
  },
  onSubmit: async function (ev) {
    ev.preventDefault();
    if (!this.props.canSubmit) return;
    const allFieldsValid = await this.verifyFieldsBeforeSubmit();

    if (!allFieldsValid) {
      return;
    }

    const self = this;

    if (this.state.email === '') {
      const haveIs = Boolean(this.props.serverConfig.isUrl);
      let desc;

      if (this.props.serverRequiresIdServer && !haveIs) {
        desc = (0, _languageHandler._t)("No identity server is configured so you cannot add an email address in order to " + "reset your password in the future.");
      } else if (this._showEmail()) {
        desc = (0, _languageHandler._t)("If you don't specify an email address, you won't be able to reset your password. " + "Are you sure?");
      } else {
        // user can't set an e-mail so don't prompt them to
        self._doSubmit(ev);

        return;
      }

      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

      _Modal.default.createTrackedDialog('If you don\'t specify an email address...', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Warning!"),
        description: desc,
        button: (0, _languageHandler._t)("Continue"),
        onFinished: function (confirmed) {
          if (confirmed) {
            self._doSubmit(ev);
          }
        }
      });
    } else {
      self._doSubmit(ev);
    }
  },
  _doSubmit: function (ev) {
    const email = this.state.email.trim();
    const promise = this.props.onRegisterClick({
      username: this.state.username.trim(),
      password: this.state.password.trim(),
      email: email,
      phoneCountry: this.state.phoneCountry,
      phoneNumber: this.state.phoneNumber
    });

    if (promise) {
      ev.target.disabled = true;
      promise.finally(function () {
        ev.target.disabled = false;
      });
    }
  },

  async verifyFieldsBeforeSubmit() {
    // Blur the active element if any, so we first run its blur validation,
    // which is less strict than the pass we're about to do below for all fields.
    const activeElement = document.activeElement;

    if (activeElement) {
      activeElement.blur();
    }

    const fieldIDsInDisplayOrder = [FIELD_USERNAME, FIELD_PASSWORD, FIELD_PASSWORD_CONFIRM, FIELD_EMAIL, FIELD_PHONE_NUMBER]; // Run all fields with stricter validation that no longer allows empty
    // values for required fields.

    for (const fieldID of fieldIDsInDisplayOrder) {
      const field = this[fieldID];

      if (!field) {
        continue;
      } // We must wait for these validations to finish before queueing
      // up the setState below so our setState goes in the queue after
      // all the setStates from these validate calls (that's how we
      // know they've finished).


      await field.validate({
        allowEmpty: false
      });
    } // Validation and state updates are async, so we need to wait for them to complete
    // first. Queue a `setState` callback and wait for it to resolve.


    await new Promise(resolve => this.setState({}, resolve));

    if (this.allFieldsValid()) {
      return true;
    }

    const invalidField = this.findFirstInvalidField(fieldIDsInDisplayOrder);

    if (!invalidField) {
      return true;
    } // Focus the first invalid field and show feedback in the stricter mode
    // that no longer allows empty values for required fields.


    invalidField.focus();
    invalidField.validate({
      allowEmpty: false,
      focused: true
    });
    return false;
  },

  /**
   * @returns {boolean} true if all fields were valid last time they were validated.
   */
  allFieldsValid: function () {
    const keys = Object.keys(this.state.fieldValid);

    for (let i = 0; i < keys.length; ++i) {
      if (!this.state.fieldValid[keys[i]]) {
        return false;
      }
    }

    return true;
  },

  findFirstInvalidField(fieldIDs) {
    for (const fieldID of fieldIDs) {
      if (!this.state.fieldValid[fieldID] && this[fieldID]) {
        return this[fieldID];
      }
    }

    return null;
  },

  markFieldValid: function (fieldID, valid) {
    const {
      fieldValid
    } = this.state;
    fieldValid[fieldID] = valid;
    this.setState({
      fieldValid
    });
  },

  onEmailChange(ev) {
    this.setState({
      email: ev.target.value
    });
  },

  async onEmailValidate(fieldState) {
    const result = await this.validateEmailRules(fieldState);
    this.markFieldValid(FIELD_EMAIL, result.valid);
    return result;
  },

  validateEmailRules: (0, _Validation.default)({
    description: () => (0, _languageHandler._t)("Use an email address to recover your account"),
    rules: [{
      key: "required",
      test: function ({
        value,
        allowEmpty
      }) {
        return allowEmpty || !this._authStepIsRequired('m.login.email.identity') || !!value;
      },
      invalid: () => (0, _languageHandler._t)("Enter email address (required on this homeserver)")
    }, {
      key: "email",
      test: ({
        value
      }) => !value || Email.looksValid(value),
      invalid: () => (0, _languageHandler._t)("Doesn't look like a valid email address")
    }]
  }),

  onPasswordChange(ev) {
    this.setState({
      password: ev.target.value
    });
  },

  onPasswordValidate(result) {
    this.markFieldValid(FIELD_PASSWORD, result.valid);
  },

  onPasswordConfirmChange(ev) {
    this.setState({
      passwordConfirm: ev.target.value
    });
  },

  async onPasswordConfirmValidate(fieldState) {
    const result = await this.validatePasswordConfirmRules(fieldState);
    this.markFieldValid(FIELD_PASSWORD_CONFIRM, result.valid);
    return result;
  },

  validatePasswordConfirmRules: (0, _Validation.default)({
    rules: [{
      key: "required",
      test: ({
        value,
        allowEmpty
      }) => allowEmpty || !!value,
      invalid: () => (0, _languageHandler._t)("Confirm password")
    }, {
      key: "match",
      test: function ({
        value
      }) {
        return !value || value === this.state.password;
      },
      invalid: () => (0, _languageHandler._t)("Passwords don't match")
    }]
  }),

  onPhoneCountryChange(newVal) {
    this.setState({
      phoneCountry: newVal.iso2,
      phonePrefix: newVal.prefix
    });
  },

  onPhoneNumberChange(ev) {
    this.setState({
      phoneNumber: ev.target.value
    });
  },

  async onPhoneNumberValidate(fieldState) {
    const result = await this.validatePhoneNumberRules(fieldState);
    this.markFieldValid(FIELD_PHONE_NUMBER, result.valid);
    return result;
  },

  validatePhoneNumberRules: (0, _Validation.default)({
    description: () => (0, _languageHandler._t)("Other users can invite you to rooms using your contact details"),
    rules: [{
      key: "required",
      test: function ({
        value,
        allowEmpty
      }) {
        return allowEmpty || !this._authStepIsRequired('m.login.msisdn') || !!value;
      },
      invalid: () => (0, _languageHandler._t)("Enter phone number (required on this homeserver)")
    }, {
      key: "email",
      test: ({
        value
      }) => !value || (0, _phonenumber.looksValid)(value),
      invalid: () => (0, _languageHandler._t)("Doesn't look like a valid phone number")
    }]
  }),

  onUsernameChange(ev) {
    this.setState({
      username: ev.target.value
    });
  },

  async onUsernameValidate(fieldState) {
    const result = await this.validateUsernameRules(fieldState);
    this.markFieldValid(FIELD_USERNAME, result.valid);
    return result;
  },

  validateUsernameRules: (0, _Validation.default)({
    description: () => (0, _languageHandler._t)("Use lowercase letters, numbers, dashes and underscores only"),
    rules: [{
      key: "required",
      test: ({
        value,
        allowEmpty
      }) => allowEmpty || !!value,
      invalid: () => (0, _languageHandler._t)("Enter username")
    }, {
      key: "safeLocalpart",
      test: ({
        value
      }) => !value || _Registration.SAFE_LOCALPART_REGEX.test(value),
      invalid: () => (0, _languageHandler._t)("Some characters not allowed")
    }]
  }),

  /**
   * A step is required if all flows include that step.
   *
   * @param {string} step A stage name to check
   * @returns {boolean} Whether it is required
   */
  _authStepIsRequired(step) {
    return this.props.flows.every(flow => {
      return flow.stages.includes(step);
    });
  },

  /**
   * A step is used if any flows include that step.
   *
   * @param {string} step A stage name to check
   * @returns {boolean} Whether it is used
   */
  _authStepIsUsed(step) {
    return this.props.flows.some(flow => {
      return flow.stages.includes(step);
    });
  },

  _showEmail() {
    const haveIs = Boolean(this.props.serverConfig.isUrl);

    if (this.props.serverRequiresIdServer && !haveIs || !this._authStepIsUsed('m.login.email.identity')) {
      return false;
    }

    return true;
  },

  _showPhoneNumber() {
    const threePidLogin = !_SdkConfig.default.get().disable_3pid_login;
    const haveIs = Boolean(this.props.serverConfig.isUrl);

    if (!threePidLogin || this.props.serverRequiresIdServer && !haveIs || !this._authStepIsUsed('m.login.msisdn')) {
      return false;
    }

    return true;
  },

  renderEmail() {
    if (!this._showEmail()) {
      return null;
    }

    const Field = sdk.getComponent('elements.Field');
    const emailPlaceholder = this._authStepIsRequired('m.login.email.identity') ? (0, _languageHandler._t)("Email") : (0, _languageHandler._t)("Email (optional)");
    return /*#__PURE__*/_react.default.createElement(Field, {
      ref: field => this[FIELD_EMAIL] = field,
      type: "text",
      label: emailPlaceholder,
      value: this.state.email,
      onChange: this.onEmailChange,
      onValidate: this.onEmailValidate
    });
  },

  renderPassword() {
    return /*#__PURE__*/_react.default.createElement(_PassphraseField.default, {
      id: "mx_RegistrationForm_password",
      fieldRef: field => this[FIELD_PASSWORD] = field,
      minScore: PASSWORD_MIN_SCORE,
      value: this.state.password,
      onChange: this.onPasswordChange,
      onValidate: this.onPasswordValidate
    });
  },

  renderPasswordConfirm() {
    const Field = sdk.getComponent('elements.Field');
    return /*#__PURE__*/_react.default.createElement(Field, {
      id: "mx_RegistrationForm_passwordConfirm",
      ref: field => this[FIELD_PASSWORD_CONFIRM] = field,
      type: "password",
      autoComplete: "new-password",
      label: (0, _languageHandler._t)("Confirm"),
      value: this.state.passwordConfirm,
      onChange: this.onPasswordConfirmChange,
      onValidate: this.onPasswordConfirmValidate
    });
  },

  renderPhoneNumber() {
    if (!this._showPhoneNumber()) {
      return null;
    }

    const CountryDropdown = sdk.getComponent('views.auth.CountryDropdown');
    const Field = sdk.getComponent('elements.Field');
    const phoneLabel = this._authStepIsRequired('m.login.msisdn') ? (0, _languageHandler._t)("Phone") : (0, _languageHandler._t)("Phone (optional)");

    const phoneCountry = /*#__PURE__*/_react.default.createElement(CountryDropdown, {
      value: this.state.phoneCountry,
      isSmall: true,
      showPrefix: true,
      onOptionChange: this.onPhoneCountryChange
    });

    return /*#__PURE__*/_react.default.createElement(Field, {
      ref: field => this[FIELD_PHONE_NUMBER] = field,
      type: "text",
      label: phoneLabel,
      value: this.state.phoneNumber,
      prefix: phoneCountry,
      onChange: this.onPhoneNumberChange,
      onValidate: this.onPhoneNumberValidate
    });
  },

  renderUsername() {
    const Field = sdk.getComponent('elements.Field');
    return /*#__PURE__*/_react.default.createElement(Field, {
      id: "mx_RegistrationForm_username",
      ref: field => this[FIELD_USERNAME] = field,
      type: "text",
      autoFocus: true,
      label: (0, _languageHandler._t)("Username"),
      value: this.state.username,
      onChange: this.onUsernameChange,
      onValidate: this.onUsernameValidate
    });
  },

  render: function () {
    let yourMatrixAccountText = (0, _languageHandler._t)('Create your Matrix account on %(serverName)s', {
      serverName: this.props.serverConfig.hsName
    });

    if (this.props.serverConfig.hsNameIsDifferent) {
      const TextWithTooltip = sdk.getComponent("elements.TextWithTooltip");
      yourMatrixAccountText = (0, _languageHandler._t)('Create your Matrix account on <underlinedServerName />', {}, {
        'underlinedServerName': () => {
          return /*#__PURE__*/_react.default.createElement(TextWithTooltip, {
            class: "mx_Login_underlinedServerName",
            tooltip: this.props.serverConfig.hsUrl
          }, this.props.serverConfig.hsName);
        }
      });
    }

    let editLink = null;

    if (this.props.onEditServerDetailsClick) {
      editLink = /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_AuthBody_editServerDetails",
        href: "#",
        onClick: this.props.onEditServerDetailsClick
      }, (0, _languageHandler._t)('Change'));
    }

    const registerButton = /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Login_submit",
      type: "submit",
      value: (0, _languageHandler._t)("Register"),
      disabled: !this.props.canSubmit
    });

    let emailHelperText = null;

    if (this._showEmail()) {
      if (this._showPhoneNumber()) {
        emailHelperText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Set an email for account recovery. " + "Use email or phone to optionally be discoverable by existing contacts."));
      } else {
        emailHelperText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Set an email for account recovery. " + "Use email to optionally be discoverable by existing contacts."));
      }
    }

    const haveIs = Boolean(this.props.serverConfig.isUrl);
    let noIsText = null;

    if (this.props.serverRequiresIdServer && !haveIs) {
      noIsText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("No identity server is configured so you cannot add an email address in order to " + "reset your password in the future."));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, yourMatrixAccountText, editLink), /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this.onSubmit
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AuthBody_fieldRow"
    }, this.renderUsername()), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AuthBody_fieldRow"
    }, this.renderPassword(), this.renderPasswordConfirm()), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AuthBody_fieldRow"
    }, this.renderEmail(), this.renderPhoneNumber()), emailHelperText, noIsText, registerButton));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvUmVnaXN0cmF0aW9uRm9ybS5qcyJdLCJuYW1lcyI6WyJGSUVMRF9FTUFJTCIsIkZJRUxEX1BIT05FX05VTUJFUiIsIkZJRUxEX1VTRVJOQU1FIiwiRklFTERfUEFTU1dPUkQiLCJGSUVMRF9QQVNTV09SRF9DT05GSVJNIiwiUEFTU1dPUkRfTUlOX1NDT1JFIiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJkZWZhdWx0RW1haWwiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJkZWZhdWx0UGhvbmVDb3VudHJ5IiwiZGVmYXVsdFBob25lTnVtYmVyIiwiZGVmYXVsdFVzZXJuYW1lIiwiZGVmYXVsdFBhc3N3b3JkIiwib25SZWdpc3RlckNsaWNrIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2siLCJmbG93cyIsImFycmF5T2YiLCJvYmplY3QiLCJzZXJ2ZXJDb25maWciLCJpbnN0YW5jZU9mIiwiVmFsaWRhdGVkU2VydmVyQ29uZmlnIiwiY2FuU3VibWl0IiwiYm9vbCIsInNlcnZlclJlcXVpcmVzSWRTZXJ2ZXIiLCJnZXREZWZhdWx0UHJvcHMiLCJvblZhbGlkYXRpb25DaGFuZ2UiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRJbml0aWFsU3RhdGUiLCJmaWVsZFZhbGlkIiwicGhvbmVDb3VudHJ5IiwicHJvcHMiLCJ1c2VybmFtZSIsImVtYWlsIiwicGhvbmVOdW1iZXIiLCJwYXNzd29yZCIsInBhc3N3b3JkQ29uZmlybSIsInBhc3N3b3JkQ29tcGxleGl0eSIsIm9uU3VibWl0IiwiZXYiLCJwcmV2ZW50RGVmYXVsdCIsImFsbEZpZWxkc1ZhbGlkIiwidmVyaWZ5RmllbGRzQmVmb3JlU3VibWl0Iiwic2VsZiIsInN0YXRlIiwiaGF2ZUlzIiwiQm9vbGVhbiIsImlzVXJsIiwiZGVzYyIsIl9zaG93RW1haWwiLCJfZG9TdWJtaXQiLCJRdWVzdGlvbkRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJidXR0b24iLCJvbkZpbmlzaGVkIiwiY29uZmlybWVkIiwidHJpbSIsInByb21pc2UiLCJ0YXJnZXQiLCJkaXNhYmxlZCIsImZpbmFsbHkiLCJhY3RpdmVFbGVtZW50IiwiZG9jdW1lbnQiLCJibHVyIiwiZmllbGRJRHNJbkRpc3BsYXlPcmRlciIsImZpZWxkSUQiLCJmaWVsZCIsInZhbGlkYXRlIiwiYWxsb3dFbXB0eSIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0U3RhdGUiLCJpbnZhbGlkRmllbGQiLCJmaW5kRmlyc3RJbnZhbGlkRmllbGQiLCJmb2N1cyIsImZvY3VzZWQiLCJrZXlzIiwiT2JqZWN0IiwiaSIsImxlbmd0aCIsImZpZWxkSURzIiwibWFya0ZpZWxkVmFsaWQiLCJ2YWxpZCIsIm9uRW1haWxDaGFuZ2UiLCJ2YWx1ZSIsIm9uRW1haWxWYWxpZGF0ZSIsImZpZWxkU3RhdGUiLCJyZXN1bHQiLCJ2YWxpZGF0ZUVtYWlsUnVsZXMiLCJydWxlcyIsImtleSIsInRlc3QiLCJfYXV0aFN0ZXBJc1JlcXVpcmVkIiwiaW52YWxpZCIsIkVtYWlsIiwibG9va3NWYWxpZCIsIm9uUGFzc3dvcmRDaGFuZ2UiLCJvblBhc3N3b3JkVmFsaWRhdGUiLCJvblBhc3N3b3JkQ29uZmlybUNoYW5nZSIsIm9uUGFzc3dvcmRDb25maXJtVmFsaWRhdGUiLCJ2YWxpZGF0ZVBhc3N3b3JkQ29uZmlybVJ1bGVzIiwib25QaG9uZUNvdW50cnlDaGFuZ2UiLCJuZXdWYWwiLCJpc28yIiwicGhvbmVQcmVmaXgiLCJwcmVmaXgiLCJvblBob25lTnVtYmVyQ2hhbmdlIiwib25QaG9uZU51bWJlclZhbGlkYXRlIiwidmFsaWRhdGVQaG9uZU51bWJlclJ1bGVzIiwib25Vc2VybmFtZUNoYW5nZSIsIm9uVXNlcm5hbWVWYWxpZGF0ZSIsInZhbGlkYXRlVXNlcm5hbWVSdWxlcyIsIlNBRkVfTE9DQUxQQVJUX1JFR0VYIiwic3RlcCIsImV2ZXJ5IiwiZmxvdyIsInN0YWdlcyIsImluY2x1ZGVzIiwiX2F1dGhTdGVwSXNVc2VkIiwic29tZSIsIl9zaG93UGhvbmVOdW1iZXIiLCJ0aHJlZVBpZExvZ2luIiwiU2RrQ29uZmlnIiwiZ2V0IiwiZGlzYWJsZV8zcGlkX2xvZ2luIiwicmVuZGVyRW1haWwiLCJGaWVsZCIsImVtYWlsUGxhY2Vob2xkZXIiLCJyZW5kZXJQYXNzd29yZCIsInJlbmRlclBhc3N3b3JkQ29uZmlybSIsInJlbmRlclBob25lTnVtYmVyIiwiQ291bnRyeURyb3Bkb3duIiwicGhvbmVMYWJlbCIsInJlbmRlclVzZXJuYW1lIiwicmVuZGVyIiwieW91ck1hdHJpeEFjY291bnRUZXh0Iiwic2VydmVyTmFtZSIsImhzTmFtZSIsImhzTmFtZUlzRGlmZmVyZW50IiwiVGV4dFdpdGhUb29sdGlwIiwiaHNVcmwiLCJlZGl0TGluayIsInJlZ2lzdGVyQnV0dG9uIiwiZW1haWxIZWxwZXJUZXh0Iiwibm9Jc1RleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQS9CQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUNBLE1BQU1BLFdBQVcsR0FBRyxhQUFwQjtBQUNBLE1BQU1DLGtCQUFrQixHQUFHLG9CQUEzQjtBQUNBLE1BQU1DLGNBQWMsR0FBRyxnQkFBdkI7QUFDQSxNQUFNQyxjQUFjLEdBQUcsZ0JBQXZCO0FBQ0EsTUFBTUMsc0JBQXNCLEdBQUcsd0JBQS9CO0FBRUEsTUFBTUMsa0JBQWtCLEdBQUcsQ0FBM0IsQyxDQUE4Qjs7QUFFOUI7Ozs7ZUFHZSwrQkFBaUI7QUFDNUJDLEVBQUFBLFdBQVcsRUFBRSxrQkFEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1A7QUFDQUMsSUFBQUEsWUFBWSxFQUFFQyxtQkFBVUMsTUFGakI7QUFHUEMsSUFBQUEsbUJBQW1CLEVBQUVGLG1CQUFVQyxNQUh4QjtBQUlQRSxJQUFBQSxrQkFBa0IsRUFBRUgsbUJBQVVDLE1BSnZCO0FBS1BHLElBQUFBLGVBQWUsRUFBRUosbUJBQVVDLE1BTHBCO0FBTVBJLElBQUFBLGVBQWUsRUFBRUwsbUJBQVVDLE1BTnBCO0FBT1BLLElBQUFBLGVBQWUsRUFBRU4sbUJBQVVPLElBQVYsQ0FBZUMsVUFQekI7QUFPcUM7QUFDNUNDLElBQUFBLHdCQUF3QixFQUFFVCxtQkFBVU8sSUFSN0I7QUFTUEcsSUFBQUEsS0FBSyxFQUFFVixtQkFBVVcsT0FBVixDQUFrQlgsbUJBQVVZLE1BQTVCLEVBQW9DSixVQVRwQztBQVVQSyxJQUFBQSxZQUFZLEVBQUViLG1CQUFVYyxVQUFWLENBQXFCQyx5Q0FBckIsRUFBNENQLFVBVm5EO0FBV1BRLElBQUFBLFNBQVMsRUFBRWhCLG1CQUFVaUIsSUFYZDtBQVlQQyxJQUFBQSxzQkFBc0IsRUFBRWxCLG1CQUFVaUI7QUFaM0IsR0FIaUI7QUFrQjVCRSxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hDLE1BQUFBLGtCQUFrQixFQUFFQyxPQUFPLENBQUNDLEtBRHpCO0FBRUhOLE1BQUFBLFNBQVMsRUFBRTtBQUZSLEtBQVA7QUFJSCxHQXZCMkI7QUF5QjVCTyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0g7QUFDQUMsTUFBQUEsVUFBVSxFQUFFLEVBRlQ7QUFHSDtBQUNBQyxNQUFBQSxZQUFZLEVBQUUsS0FBS0MsS0FBTCxDQUFXeEIsbUJBSnRCO0FBS0h5QixNQUFBQSxRQUFRLEVBQUUsS0FBS0QsS0FBTCxDQUFXdEIsZUFBWCxJQUE4QixFQUxyQztBQU1Id0IsTUFBQUEsS0FBSyxFQUFFLEtBQUtGLEtBQUwsQ0FBVzNCLFlBQVgsSUFBMkIsRUFOL0I7QUFPSDhCLE1BQUFBLFdBQVcsRUFBRSxLQUFLSCxLQUFMLENBQVd2QixrQkFBWCxJQUFpQyxFQVAzQztBQVFIMkIsTUFBQUEsUUFBUSxFQUFFLEtBQUtKLEtBQUwsQ0FBV3JCLGVBQVgsSUFBOEIsRUFSckM7QUFTSDBCLE1BQUFBLGVBQWUsRUFBRSxLQUFLTCxLQUFMLENBQVdyQixlQUFYLElBQThCLEVBVDVDO0FBVUgyQixNQUFBQSxrQkFBa0IsRUFBRTtBQVZqQixLQUFQO0FBWUgsR0F0QzJCO0FBd0M1QkMsRUFBQUEsUUFBUSxFQUFFLGdCQUFlQyxFQUFmLEVBQW1CO0FBQ3pCQSxJQUFBQSxFQUFFLENBQUNDLGNBQUg7QUFFQSxRQUFJLENBQUMsS0FBS1QsS0FBTCxDQUFXVixTQUFoQixFQUEyQjtBQUUzQixVQUFNb0IsY0FBYyxHQUFHLE1BQU0sS0FBS0Msd0JBQUwsRUFBN0I7O0FBQ0EsUUFBSSxDQUFDRCxjQUFMLEVBQXFCO0FBQ2pCO0FBQ0g7O0FBRUQsVUFBTUUsSUFBSSxHQUFHLElBQWI7O0FBQ0EsUUFBSSxLQUFLQyxLQUFMLENBQVdYLEtBQVgsS0FBcUIsRUFBekIsRUFBNkI7QUFDekIsWUFBTVksTUFBTSxHQUFHQyxPQUFPLENBQUMsS0FBS2YsS0FBTCxDQUFXYixZQUFYLENBQXdCNkIsS0FBekIsQ0FBdEI7QUFFQSxVQUFJQyxJQUFKOztBQUNBLFVBQUksS0FBS2pCLEtBQUwsQ0FBV1Isc0JBQVgsSUFBcUMsQ0FBQ3NCLE1BQTFDLEVBQWtEO0FBQzlDRyxRQUFBQSxJQUFJLEdBQUcseUJBQ0gscUZBQ0Esb0NBRkcsQ0FBUDtBQUlILE9BTEQsTUFLTyxJQUFJLEtBQUtDLFVBQUwsRUFBSixFQUF1QjtBQUMxQkQsUUFBQUEsSUFBSSxHQUFHLHlCQUNILHNGQUNBLGVBRkcsQ0FBUDtBQUlILE9BTE0sTUFLQTtBQUNIO0FBQ0FMLFFBQUFBLElBQUksQ0FBQ08sU0FBTCxDQUFlWCxFQUFmOztBQUNBO0FBQ0g7O0FBRUQsWUFBTVksY0FBYyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXZCOztBQUNBQyxxQkFBTUMsbUJBQU4sQ0FBMEIsMkNBQTFCLEVBQXVFLEVBQXZFLEVBQTJFSixjQUEzRSxFQUEyRjtBQUN2RkssUUFBQUEsS0FBSyxFQUFFLHlCQUFHLFVBQUgsQ0FEZ0Y7QUFFdkZDLFFBQUFBLFdBQVcsRUFBRVQsSUFGMEU7QUFHdkZVLFFBQUFBLE1BQU0sRUFBRSx5QkFBRyxVQUFILENBSCtFO0FBSXZGQyxRQUFBQSxVQUFVLEVBQUUsVUFBU0MsU0FBVCxFQUFvQjtBQUM1QixjQUFJQSxTQUFKLEVBQWU7QUFDWGpCLFlBQUFBLElBQUksQ0FBQ08sU0FBTCxDQUFlWCxFQUFmO0FBQ0g7QUFDSjtBQVJzRixPQUEzRjtBQVVILEtBL0JELE1BK0JPO0FBQ0hJLE1BQUFBLElBQUksQ0FBQ08sU0FBTCxDQUFlWCxFQUFmO0FBQ0g7QUFDSixHQXJGMkI7QUF1RjVCVyxFQUFBQSxTQUFTLEVBQUUsVUFBU1gsRUFBVCxFQUFhO0FBQ3BCLFVBQU1OLEtBQUssR0FBRyxLQUFLVyxLQUFMLENBQVdYLEtBQVgsQ0FBaUI0QixJQUFqQixFQUFkO0FBQ0EsVUFBTUMsT0FBTyxHQUFHLEtBQUsvQixLQUFMLENBQVdwQixlQUFYLENBQTJCO0FBQ3ZDcUIsTUFBQUEsUUFBUSxFQUFFLEtBQUtZLEtBQUwsQ0FBV1osUUFBWCxDQUFvQjZCLElBQXBCLEVBRDZCO0FBRXZDMUIsTUFBQUEsUUFBUSxFQUFFLEtBQUtTLEtBQUwsQ0FBV1QsUUFBWCxDQUFvQjBCLElBQXBCLEVBRjZCO0FBR3ZDNUIsTUFBQUEsS0FBSyxFQUFFQSxLQUhnQztBQUl2Q0gsTUFBQUEsWUFBWSxFQUFFLEtBQUtjLEtBQUwsQ0FBV2QsWUFKYztBQUt2Q0ksTUFBQUEsV0FBVyxFQUFFLEtBQUtVLEtBQUwsQ0FBV1Y7QUFMZSxLQUEzQixDQUFoQjs7QUFRQSxRQUFJNEIsT0FBSixFQUFhO0FBQ1R2QixNQUFBQSxFQUFFLENBQUN3QixNQUFILENBQVVDLFFBQVYsR0FBcUIsSUFBckI7QUFDQUYsTUFBQUEsT0FBTyxDQUFDRyxPQUFSLENBQWdCLFlBQVc7QUFDdkIxQixRQUFBQSxFQUFFLENBQUN3QixNQUFILENBQVVDLFFBQVYsR0FBcUIsS0FBckI7QUFDSCxPQUZEO0FBR0g7QUFDSixHQXZHMkI7O0FBeUc1QixRQUFNdEIsd0JBQU4sR0FBaUM7QUFDN0I7QUFDQTtBQUNBLFVBQU13QixhQUFhLEdBQUdDLFFBQVEsQ0FBQ0QsYUFBL0I7O0FBQ0EsUUFBSUEsYUFBSixFQUFtQjtBQUNmQSxNQUFBQSxhQUFhLENBQUNFLElBQWQ7QUFDSDs7QUFFRCxVQUFNQyxzQkFBc0IsR0FBRyxDQUMzQnZFLGNBRDJCLEVBRTNCQyxjQUYyQixFQUczQkMsc0JBSDJCLEVBSTNCSixXQUoyQixFQUszQkMsa0JBTDJCLENBQS9CLENBUjZCLENBZ0I3QjtBQUNBOztBQUNBLFNBQUssTUFBTXlFLE9BQVgsSUFBc0JELHNCQUF0QixFQUE4QztBQUMxQyxZQUFNRSxLQUFLLEdBQUcsS0FBS0QsT0FBTCxDQUFkOztBQUNBLFVBQUksQ0FBQ0MsS0FBTCxFQUFZO0FBQ1I7QUFDSCxPQUp5QyxDQUsxQztBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsWUFBTUEsS0FBSyxDQUFDQyxRQUFOLENBQWU7QUFBRUMsUUFBQUEsVUFBVSxFQUFFO0FBQWQsT0FBZixDQUFOO0FBQ0gsS0E1QjRCLENBOEI3QjtBQUNBOzs7QUFDQSxVQUFNLElBQUlDLE9BQUosQ0FBWUMsT0FBTyxJQUFJLEtBQUtDLFFBQUwsQ0FBYyxFQUFkLEVBQWtCRCxPQUFsQixDQUF2QixDQUFOOztBQUVBLFFBQUksS0FBS2xDLGNBQUwsRUFBSixFQUEyQjtBQUN2QixhQUFPLElBQVA7QUFDSDs7QUFFRCxVQUFNb0MsWUFBWSxHQUFHLEtBQUtDLHFCQUFMLENBQTJCVCxzQkFBM0IsQ0FBckI7O0FBRUEsUUFBSSxDQUFDUSxZQUFMLEVBQW1CO0FBQ2YsYUFBTyxJQUFQO0FBQ0gsS0ExQzRCLENBNEM3QjtBQUNBOzs7QUFDQUEsSUFBQUEsWUFBWSxDQUFDRSxLQUFiO0FBQ0FGLElBQUFBLFlBQVksQ0FBQ0wsUUFBYixDQUFzQjtBQUFFQyxNQUFBQSxVQUFVLEVBQUUsS0FBZDtBQUFxQk8sTUFBQUEsT0FBTyxFQUFFO0FBQTlCLEtBQXRCO0FBQ0EsV0FBTyxLQUFQO0FBQ0gsR0ExSjJCOztBQTRKNUI7OztBQUdBdkMsRUFBQUEsY0FBYyxFQUFFLFlBQVc7QUFDdkIsVUFBTXdDLElBQUksR0FBR0MsTUFBTSxDQUFDRCxJQUFQLENBQVksS0FBS3JDLEtBQUwsQ0FBV2YsVUFBdkIsQ0FBYjs7QUFDQSxTQUFLLElBQUlzRCxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHRixJQUFJLENBQUNHLE1BQXpCLEVBQWlDLEVBQUVELENBQW5DLEVBQXNDO0FBQ2xDLFVBQUksQ0FBQyxLQUFLdkMsS0FBTCxDQUFXZixVQUFYLENBQXNCb0QsSUFBSSxDQUFDRSxDQUFELENBQTFCLENBQUwsRUFBcUM7QUFDakMsZUFBTyxLQUFQO0FBQ0g7QUFDSjs7QUFDRCxXQUFPLElBQVA7QUFDSCxHQXZLMkI7O0FBeUs1QkwsRUFBQUEscUJBQXFCLENBQUNPLFFBQUQsRUFBVztBQUM1QixTQUFLLE1BQU1mLE9BQVgsSUFBc0JlLFFBQXRCLEVBQWdDO0FBQzVCLFVBQUksQ0FBQyxLQUFLekMsS0FBTCxDQUFXZixVQUFYLENBQXNCeUMsT0FBdEIsQ0FBRCxJQUFtQyxLQUFLQSxPQUFMLENBQXZDLEVBQXNEO0FBQ2xELGVBQU8sS0FBS0EsT0FBTCxDQUFQO0FBQ0g7QUFDSjs7QUFDRCxXQUFPLElBQVA7QUFDSCxHQWhMMkI7O0FBa0w1QmdCLEVBQUFBLGNBQWMsRUFBRSxVQUFTaEIsT0FBVCxFQUFrQmlCLEtBQWxCLEVBQXlCO0FBQ3JDLFVBQU07QUFBRTFELE1BQUFBO0FBQUYsUUFBaUIsS0FBS2UsS0FBNUI7QUFDQWYsSUFBQUEsVUFBVSxDQUFDeUMsT0FBRCxDQUFWLEdBQXNCaUIsS0FBdEI7QUFDQSxTQUFLWCxRQUFMLENBQWM7QUFDVi9DLE1BQUFBO0FBRFUsS0FBZDtBQUdILEdBeEwyQjs7QUEwTDVCMkQsRUFBQUEsYUFBYSxDQUFDakQsRUFBRCxFQUFLO0FBQ2QsU0FBS3FDLFFBQUwsQ0FBYztBQUNWM0MsTUFBQUEsS0FBSyxFQUFFTSxFQUFFLENBQUN3QixNQUFILENBQVUwQjtBQURQLEtBQWQ7QUFHSCxHQTlMMkI7O0FBZ001QixRQUFNQyxlQUFOLENBQXNCQyxVQUF0QixFQUFrQztBQUM5QixVQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLQyxrQkFBTCxDQUF3QkYsVUFBeEIsQ0FBckI7QUFDQSxTQUFLTCxjQUFMLENBQW9CMUYsV0FBcEIsRUFBaUNnRyxNQUFNLENBQUNMLEtBQXhDO0FBQ0EsV0FBT0ssTUFBUDtBQUNILEdBcE0yQjs7QUFzTTVCQyxFQUFBQSxrQkFBa0IsRUFBRSx5QkFBZTtBQUMvQnBDLElBQUFBLFdBQVcsRUFBRSxNQUFNLHlCQUFHLDhDQUFILENBRFk7QUFFL0JxQyxJQUFBQSxLQUFLLEVBQUUsQ0FDSDtBQUNJQyxNQUFBQSxHQUFHLEVBQUUsVUFEVDtBQUVJQyxNQUFBQSxJQUFJLEVBQUUsVUFBUztBQUFFUCxRQUFBQSxLQUFGO0FBQVNoQixRQUFBQTtBQUFULE9BQVQsRUFBZ0M7QUFDbEMsZUFBT0EsVUFBVSxJQUFJLENBQUMsS0FBS3dCLG1CQUFMLENBQXlCLHdCQUF6QixDQUFmLElBQXFFLENBQUMsQ0FBQ1IsS0FBOUU7QUFDSCxPQUpMO0FBS0lTLE1BQUFBLE9BQU8sRUFBRSxNQUFNLHlCQUFHLG1EQUFIO0FBTG5CLEtBREcsRUFRSDtBQUNJSCxNQUFBQSxHQUFHLEVBQUUsT0FEVDtBQUVJQyxNQUFBQSxJQUFJLEVBQUUsQ0FBQztBQUFFUCxRQUFBQTtBQUFGLE9BQUQsS0FBZSxDQUFDQSxLQUFELElBQVVVLEtBQUssQ0FBQ0MsVUFBTixDQUFpQlgsS0FBakIsQ0FGbkM7QUFHSVMsTUFBQUEsT0FBTyxFQUFFLE1BQU0seUJBQUcseUNBQUg7QUFIbkIsS0FSRztBQUZ3QixHQUFmLENBdE1ROztBQXdONUJHLEVBQUFBLGdCQUFnQixDQUFDOUQsRUFBRCxFQUFLO0FBQ2pCLFNBQUtxQyxRQUFMLENBQWM7QUFDVnpDLE1BQUFBLFFBQVEsRUFBRUksRUFBRSxDQUFDd0IsTUFBSCxDQUFVMEI7QUFEVixLQUFkO0FBR0gsR0E1TjJCOztBQThONUJhLEVBQUFBLGtCQUFrQixDQUFDVixNQUFELEVBQVM7QUFDdkIsU0FBS04sY0FBTCxDQUFvQnZGLGNBQXBCLEVBQW9DNkYsTUFBTSxDQUFDTCxLQUEzQztBQUNILEdBaE8yQjs7QUFrTzVCZ0IsRUFBQUEsdUJBQXVCLENBQUNoRSxFQUFELEVBQUs7QUFDeEIsU0FBS3FDLFFBQUwsQ0FBYztBQUNWeEMsTUFBQUEsZUFBZSxFQUFFRyxFQUFFLENBQUN3QixNQUFILENBQVUwQjtBQURqQixLQUFkO0FBR0gsR0F0TzJCOztBQXdPNUIsUUFBTWUseUJBQU4sQ0FBZ0NiLFVBQWhDLEVBQTRDO0FBQ3hDLFVBQU1DLE1BQU0sR0FBRyxNQUFNLEtBQUthLDRCQUFMLENBQWtDZCxVQUFsQyxDQUFyQjtBQUNBLFNBQUtMLGNBQUwsQ0FBb0J0RixzQkFBcEIsRUFBNEM0RixNQUFNLENBQUNMLEtBQW5EO0FBQ0EsV0FBT0ssTUFBUDtBQUNILEdBNU8yQjs7QUE4TzVCYSxFQUFBQSw0QkFBNEIsRUFBRSx5QkFBZTtBQUN6Q1gsSUFBQUEsS0FBSyxFQUFFLENBQ0g7QUFDSUMsTUFBQUEsR0FBRyxFQUFFLFVBRFQ7QUFFSUMsTUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBRVAsUUFBQUEsS0FBRjtBQUFTaEIsUUFBQUE7QUFBVCxPQUFELEtBQTJCQSxVQUFVLElBQUksQ0FBQyxDQUFDZ0IsS0FGckQ7QUFHSVMsTUFBQUEsT0FBTyxFQUFFLE1BQU0seUJBQUcsa0JBQUg7QUFIbkIsS0FERyxFQU1IO0FBQ0lILE1BQUFBLEdBQUcsRUFBRSxPQURUO0FBRUlDLE1BQUFBLElBQUksRUFBRSxVQUFTO0FBQUVQLFFBQUFBO0FBQUYsT0FBVCxFQUFvQjtBQUN0QixlQUFPLENBQUNBLEtBQUQsSUFBVUEsS0FBSyxLQUFLLEtBQUs3QyxLQUFMLENBQVdULFFBQXRDO0FBQ0gsT0FKTDtBQUtJK0QsTUFBQUEsT0FBTyxFQUFFLE1BQU0seUJBQUcsdUJBQUg7QUFMbkIsS0FORztBQURrQyxHQUFmLENBOU9GOztBQStQNUJRLEVBQUFBLG9CQUFvQixDQUFDQyxNQUFELEVBQVM7QUFDekIsU0FBSy9CLFFBQUwsQ0FBYztBQUNWOUMsTUFBQUEsWUFBWSxFQUFFNkUsTUFBTSxDQUFDQyxJQURYO0FBRVZDLE1BQUFBLFdBQVcsRUFBRUYsTUFBTSxDQUFDRztBQUZWLEtBQWQ7QUFJSCxHQXBRMkI7O0FBc1E1QkMsRUFBQUEsbUJBQW1CLENBQUN4RSxFQUFELEVBQUs7QUFDcEIsU0FBS3FDLFFBQUwsQ0FBYztBQUNWMUMsTUFBQUEsV0FBVyxFQUFFSyxFQUFFLENBQUN3QixNQUFILENBQVUwQjtBQURiLEtBQWQ7QUFHSCxHQTFRMkI7O0FBNFE1QixRQUFNdUIscUJBQU4sQ0FBNEJyQixVQUE1QixFQUF3QztBQUNwQyxVQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLcUIsd0JBQUwsQ0FBOEJ0QixVQUE5QixDQUFyQjtBQUNBLFNBQUtMLGNBQUwsQ0FBb0J6RixrQkFBcEIsRUFBd0MrRixNQUFNLENBQUNMLEtBQS9DO0FBQ0EsV0FBT0ssTUFBUDtBQUNILEdBaFIyQjs7QUFrUjVCcUIsRUFBQUEsd0JBQXdCLEVBQUUseUJBQWU7QUFDckN4RCxJQUFBQSxXQUFXLEVBQUUsTUFBTSx5QkFBRyxnRUFBSCxDQURrQjtBQUVyQ3FDLElBQUFBLEtBQUssRUFBRSxDQUNIO0FBQ0lDLE1BQUFBLEdBQUcsRUFBRSxVQURUO0FBRUlDLE1BQUFBLElBQUksRUFBRSxVQUFTO0FBQUVQLFFBQUFBLEtBQUY7QUFBU2hCLFFBQUFBO0FBQVQsT0FBVCxFQUFnQztBQUNsQyxlQUFPQSxVQUFVLElBQUksQ0FBQyxLQUFLd0IsbUJBQUwsQ0FBeUIsZ0JBQXpCLENBQWYsSUFBNkQsQ0FBQyxDQUFDUixLQUF0RTtBQUNILE9BSkw7QUFLSVMsTUFBQUEsT0FBTyxFQUFFLE1BQU0seUJBQUcsa0RBQUg7QUFMbkIsS0FERyxFQVFIO0FBQ0lILE1BQUFBLEdBQUcsRUFBRSxPQURUO0FBRUlDLE1BQUFBLElBQUksRUFBRSxDQUFDO0FBQUVQLFFBQUFBO0FBQUYsT0FBRCxLQUFlLENBQUNBLEtBQUQsSUFBVSw2QkFBc0JBLEtBQXRCLENBRm5DO0FBR0lTLE1BQUFBLE9BQU8sRUFBRSxNQUFNLHlCQUFHLHdDQUFIO0FBSG5CLEtBUkc7QUFGOEIsR0FBZixDQWxSRTs7QUFvUzVCZ0IsRUFBQUEsZ0JBQWdCLENBQUMzRSxFQUFELEVBQUs7QUFDakIsU0FBS3FDLFFBQUwsQ0FBYztBQUNWNUMsTUFBQUEsUUFBUSxFQUFFTyxFQUFFLENBQUN3QixNQUFILENBQVUwQjtBQURWLEtBQWQ7QUFHSCxHQXhTMkI7O0FBMFM1QixRQUFNMEIsa0JBQU4sQ0FBeUJ4QixVQUF6QixFQUFxQztBQUNqQyxVQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLd0IscUJBQUwsQ0FBMkJ6QixVQUEzQixDQUFyQjtBQUNBLFNBQUtMLGNBQUwsQ0FBb0J4RixjQUFwQixFQUFvQzhGLE1BQU0sQ0FBQ0wsS0FBM0M7QUFDQSxXQUFPSyxNQUFQO0FBQ0gsR0E5UzJCOztBQWdUNUJ3QixFQUFBQSxxQkFBcUIsRUFBRSx5QkFBZTtBQUNsQzNELElBQUFBLFdBQVcsRUFBRSxNQUFNLHlCQUFHLDZEQUFILENBRGU7QUFFbENxQyxJQUFBQSxLQUFLLEVBQUUsQ0FDSDtBQUNJQyxNQUFBQSxHQUFHLEVBQUUsVUFEVDtBQUVJQyxNQUFBQSxJQUFJLEVBQUUsQ0FBQztBQUFFUCxRQUFBQSxLQUFGO0FBQVNoQixRQUFBQTtBQUFULE9BQUQsS0FBMkJBLFVBQVUsSUFBSSxDQUFDLENBQUNnQixLQUZyRDtBQUdJUyxNQUFBQSxPQUFPLEVBQUUsTUFBTSx5QkFBRyxnQkFBSDtBQUhuQixLQURHLEVBTUg7QUFDSUgsTUFBQUEsR0FBRyxFQUFFLGVBRFQ7QUFFSUMsTUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBRVAsUUFBQUE7QUFBRixPQUFELEtBQWUsQ0FBQ0EsS0FBRCxJQUFVNEIsbUNBQXFCckIsSUFBckIsQ0FBMEJQLEtBQTFCLENBRm5DO0FBR0lTLE1BQUFBLE9BQU8sRUFBRSxNQUFNLHlCQUFHLDZCQUFIO0FBSG5CLEtBTkc7QUFGMkIsR0FBZixDQWhUSzs7QUFnVTVCOzs7Ozs7QUFNQUQsRUFBQUEsbUJBQW1CLENBQUNxQixJQUFELEVBQU87QUFDdEIsV0FBTyxLQUFLdkYsS0FBTCxDQUFXaEIsS0FBWCxDQUFpQndHLEtBQWpCLENBQXdCQyxJQUFELElBQVU7QUFDcEMsYUFBT0EsSUFBSSxDQUFDQyxNQUFMLENBQVlDLFFBQVosQ0FBcUJKLElBQXJCLENBQVA7QUFDSCxLQUZNLENBQVA7QUFHSCxHQTFVMkI7O0FBNFU1Qjs7Ozs7O0FBTUFLLEVBQUFBLGVBQWUsQ0FBQ0wsSUFBRCxFQUFPO0FBQ2xCLFdBQU8sS0FBS3ZGLEtBQUwsQ0FBV2hCLEtBQVgsQ0FBaUI2RyxJQUFqQixDQUF1QkosSUFBRCxJQUFVO0FBQ25DLGFBQU9BLElBQUksQ0FBQ0MsTUFBTCxDQUFZQyxRQUFaLENBQXFCSixJQUFyQixDQUFQO0FBQ0gsS0FGTSxDQUFQO0FBR0gsR0F0VjJCOztBQXdWNUJyRSxFQUFBQSxVQUFVLEdBQUc7QUFDVCxVQUFNSixNQUFNLEdBQUdDLE9BQU8sQ0FBQyxLQUFLZixLQUFMLENBQVdiLFlBQVgsQ0FBd0I2QixLQUF6QixDQUF0Qjs7QUFDQSxRQUNLLEtBQUtoQixLQUFMLENBQVdSLHNCQUFYLElBQXFDLENBQUNzQixNQUF2QyxJQUNBLENBQUMsS0FBSzhFLGVBQUwsQ0FBcUIsd0JBQXJCLENBRkwsRUFHRTtBQUNFLGFBQU8sS0FBUDtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNILEdBalcyQjs7QUFtVzVCRSxFQUFBQSxnQkFBZ0IsR0FBRztBQUNmLFVBQU1DLGFBQWEsR0FBRyxDQUFDQyxtQkFBVUMsR0FBVixHQUFnQkMsa0JBQXZDO0FBQ0EsVUFBTXBGLE1BQU0sR0FBR0MsT0FBTyxDQUFDLEtBQUtmLEtBQUwsQ0FBV2IsWUFBWCxDQUF3QjZCLEtBQXpCLENBQXRCOztBQUNBLFFBQ0ksQ0FBQytFLGFBQUQsSUFDQyxLQUFLL0YsS0FBTCxDQUFXUixzQkFBWCxJQUFxQyxDQUFDc0IsTUFEdkMsSUFFQSxDQUFDLEtBQUs4RSxlQUFMLENBQXFCLGdCQUFyQixDQUhMLEVBSUU7QUFDRSxhQUFPLEtBQVA7QUFDSDs7QUFDRCxXQUFPLElBQVA7QUFDSCxHQTlXMkI7O0FBZ1g1Qk8sRUFBQUEsV0FBVyxHQUFHO0FBQ1YsUUFBSSxDQUFDLEtBQUtqRixVQUFMLEVBQUwsRUFBd0I7QUFDcEIsYUFBTyxJQUFQO0FBQ0g7O0FBQ0QsVUFBTWtGLEtBQUssR0FBRy9FLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixnQkFBakIsQ0FBZDtBQUNBLFVBQU0rRSxnQkFBZ0IsR0FBRyxLQUFLbkMsbUJBQUwsQ0FBeUIsd0JBQXpCLElBQ3JCLHlCQUFHLE9BQUgsQ0FEcUIsR0FFckIseUJBQUcsa0JBQUgsQ0FGSjtBQUdBLHdCQUFPLDZCQUFDLEtBQUQ7QUFDSCxNQUFBLEdBQUcsRUFBRTFCLEtBQUssSUFBSSxLQUFLM0UsV0FBTCxJQUFvQjJFLEtBRC9CO0FBRUgsTUFBQSxJQUFJLEVBQUMsTUFGRjtBQUdILE1BQUEsS0FBSyxFQUFFNkQsZ0JBSEo7QUFJSCxNQUFBLEtBQUssRUFBRSxLQUFLeEYsS0FBTCxDQUFXWCxLQUpmO0FBS0gsTUFBQSxRQUFRLEVBQUUsS0FBS3VELGFBTFo7QUFNSCxNQUFBLFVBQVUsRUFBRSxLQUFLRTtBQU5kLE1BQVA7QUFRSCxHQWhZMkI7O0FBa1k1QjJDLEVBQUFBLGNBQWMsR0FBRztBQUNiLHdCQUFPLDZCQUFDLHdCQUFEO0FBQ0gsTUFBQSxFQUFFLEVBQUMsOEJBREE7QUFFSCxNQUFBLFFBQVEsRUFBRTlELEtBQUssSUFBSSxLQUFLeEUsY0FBTCxJQUF1QndFLEtBRnZDO0FBR0gsTUFBQSxRQUFRLEVBQUV0RSxrQkFIUDtBQUlILE1BQUEsS0FBSyxFQUFFLEtBQUsyQyxLQUFMLENBQVdULFFBSmY7QUFLSCxNQUFBLFFBQVEsRUFBRSxLQUFLa0UsZ0JBTFo7QUFNSCxNQUFBLFVBQVUsRUFBRSxLQUFLQztBQU5kLE1BQVA7QUFRSCxHQTNZMkI7O0FBNlk1QmdDLEVBQUFBLHFCQUFxQixHQUFHO0FBQ3BCLFVBQU1ILEtBQUssR0FBRy9FLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixnQkFBakIsQ0FBZDtBQUNBLHdCQUFPLDZCQUFDLEtBQUQ7QUFDSCxNQUFBLEVBQUUsRUFBQyxxQ0FEQTtBQUVILE1BQUEsR0FBRyxFQUFFa0IsS0FBSyxJQUFJLEtBQUt2RSxzQkFBTCxJQUErQnVFLEtBRjFDO0FBR0gsTUFBQSxJQUFJLEVBQUMsVUFIRjtBQUlILE1BQUEsWUFBWSxFQUFDLGNBSlY7QUFLSCxNQUFBLEtBQUssRUFBRSx5QkFBRyxTQUFILENBTEo7QUFNSCxNQUFBLEtBQUssRUFBRSxLQUFLM0IsS0FBTCxDQUFXUixlQU5mO0FBT0gsTUFBQSxRQUFRLEVBQUUsS0FBS21FLHVCQVBaO0FBUUgsTUFBQSxVQUFVLEVBQUUsS0FBS0M7QUFSZCxNQUFQO0FBVUgsR0F6WjJCOztBQTJaNUIrQixFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixRQUFJLENBQUMsS0FBS1YsZ0JBQUwsRUFBTCxFQUE4QjtBQUMxQixhQUFPLElBQVA7QUFDSDs7QUFDRCxVQUFNVyxlQUFlLEdBQUdwRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsNEJBQWpCLENBQXhCO0FBQ0EsVUFBTThFLEtBQUssR0FBRy9FLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixnQkFBakIsQ0FBZDtBQUNBLFVBQU1vRixVQUFVLEdBQUcsS0FBS3hDLG1CQUFMLENBQXlCLGdCQUF6QixJQUNmLHlCQUFHLE9BQUgsQ0FEZSxHQUVmLHlCQUFHLGtCQUFILENBRko7O0FBR0EsVUFBTW5FLFlBQVksZ0JBQUcsNkJBQUMsZUFBRDtBQUNqQixNQUFBLEtBQUssRUFBRSxLQUFLYyxLQUFMLENBQVdkLFlBREQ7QUFFakIsTUFBQSxPQUFPLEVBQUUsSUFGUTtBQUdqQixNQUFBLFVBQVUsRUFBRSxJQUhLO0FBSWpCLE1BQUEsY0FBYyxFQUFFLEtBQUs0RTtBQUpKLE1BQXJCOztBQU1BLHdCQUFPLDZCQUFDLEtBQUQ7QUFDSCxNQUFBLEdBQUcsRUFBRW5DLEtBQUssSUFBSSxLQUFLMUUsa0JBQUwsSUFBMkIwRSxLQUR0QztBQUVILE1BQUEsSUFBSSxFQUFDLE1BRkY7QUFHSCxNQUFBLEtBQUssRUFBRWtFLFVBSEo7QUFJSCxNQUFBLEtBQUssRUFBRSxLQUFLN0YsS0FBTCxDQUFXVixXQUpmO0FBS0gsTUFBQSxNQUFNLEVBQUVKLFlBTEw7QUFNSCxNQUFBLFFBQVEsRUFBRSxLQUFLaUYsbUJBTlo7QUFPSCxNQUFBLFVBQVUsRUFBRSxLQUFLQztBQVBkLE1BQVA7QUFTSCxHQW5iMkI7O0FBcWI1QjBCLEVBQUFBLGNBQWMsR0FBRztBQUNiLFVBQU1QLEtBQUssR0FBRy9FLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixnQkFBakIsQ0FBZDtBQUNBLHdCQUFPLDZCQUFDLEtBQUQ7QUFDSCxNQUFBLEVBQUUsRUFBQyw4QkFEQTtBQUVILE1BQUEsR0FBRyxFQUFFa0IsS0FBSyxJQUFJLEtBQUt6RSxjQUFMLElBQXVCeUUsS0FGbEM7QUFHSCxNQUFBLElBQUksRUFBQyxNQUhGO0FBSUgsTUFBQSxTQUFTLEVBQUUsSUFKUjtBQUtILE1BQUEsS0FBSyxFQUFFLHlCQUFHLFVBQUgsQ0FMSjtBQU1ILE1BQUEsS0FBSyxFQUFFLEtBQUszQixLQUFMLENBQVdaLFFBTmY7QUFPSCxNQUFBLFFBQVEsRUFBRSxLQUFLa0YsZ0JBUFo7QUFRSCxNQUFBLFVBQVUsRUFBRSxLQUFLQztBQVJkLE1BQVA7QUFVSCxHQWpjMkI7O0FBbWM1QndCLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsUUFBSUMscUJBQXFCLEdBQUcseUJBQUcsOENBQUgsRUFBbUQ7QUFDM0VDLE1BQUFBLFVBQVUsRUFBRSxLQUFLOUcsS0FBTCxDQUFXYixZQUFYLENBQXdCNEg7QUFEdUMsS0FBbkQsQ0FBNUI7O0FBR0EsUUFBSSxLQUFLL0csS0FBTCxDQUFXYixZQUFYLENBQXdCNkgsaUJBQTVCLEVBQStDO0FBQzNDLFlBQU1DLGVBQWUsR0FBRzVGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBeEI7QUFFQXVGLE1BQUFBLHFCQUFxQixHQUFHLHlCQUFHLHdEQUFILEVBQTZELEVBQTdELEVBQWlFO0FBQ3JGLGdDQUF3QixNQUFNO0FBQzFCLDhCQUFPLDZCQUFDLGVBQUQ7QUFDSCxZQUFBLEtBQUssRUFBQywrQkFESDtBQUVILFlBQUEsT0FBTyxFQUFFLEtBQUs3RyxLQUFMLENBQVdiLFlBQVgsQ0FBd0IrSDtBQUY5QixhQUlGLEtBQUtsSCxLQUFMLENBQVdiLFlBQVgsQ0FBd0I0SCxNQUp0QixDQUFQO0FBTUg7QUFSb0YsT0FBakUsQ0FBeEI7QUFVSDs7QUFFRCxRQUFJSSxRQUFRLEdBQUcsSUFBZjs7QUFDQSxRQUFJLEtBQUtuSCxLQUFMLENBQVdqQix3QkFBZixFQUF5QztBQUNyQ29JLE1BQUFBLFFBQVEsZ0JBQUc7QUFBRyxRQUFBLFNBQVMsRUFBQywrQkFBYjtBQUNQLFFBQUEsSUFBSSxFQUFDLEdBREU7QUFDRSxRQUFBLE9BQU8sRUFBRSxLQUFLbkgsS0FBTCxDQUFXakI7QUFEdEIsU0FHTix5QkFBRyxRQUFILENBSE0sQ0FBWDtBQUtIOztBQUVELFVBQU1xSSxjQUFjLGdCQUNoQjtBQUFPLE1BQUEsU0FBUyxFQUFDLGlCQUFqQjtBQUFtQyxNQUFBLElBQUksRUFBQyxRQUF4QztBQUFpRCxNQUFBLEtBQUssRUFBRSx5QkFBRyxVQUFILENBQXhEO0FBQXdFLE1BQUEsUUFBUSxFQUFFLENBQUMsS0FBS3BILEtBQUwsQ0FBV1Y7QUFBOUYsTUFESjs7QUFJQSxRQUFJK0gsZUFBZSxHQUFHLElBQXRCOztBQUNBLFFBQUksS0FBS25HLFVBQUwsRUFBSixFQUF1QjtBQUNuQixVQUFJLEtBQUs0RSxnQkFBTCxFQUFKLEVBQTZCO0FBQ3pCdUIsUUFBQUEsZUFBZSxnQkFBRywwQ0FDYix5QkFDRyx3Q0FDQSx3RUFGSCxDQURhLENBQWxCO0FBTUgsT0FQRCxNQU9PO0FBQ0hBLFFBQUFBLGVBQWUsZ0JBQUcsMENBQ2IseUJBQ0csd0NBQ0EsK0RBRkgsQ0FEYSxDQUFsQjtBQU1IO0FBQ0o7O0FBQ0QsVUFBTXZHLE1BQU0sR0FBR0MsT0FBTyxDQUFDLEtBQUtmLEtBQUwsQ0FBV2IsWUFBWCxDQUF3QjZCLEtBQXpCLENBQXRCO0FBQ0EsUUFBSXNHLFFBQVEsR0FBRyxJQUFmOztBQUNBLFFBQUksS0FBS3RILEtBQUwsQ0FBV1Isc0JBQVgsSUFBcUMsQ0FBQ3NCLE1BQTFDLEVBQWtEO0FBQzlDd0csTUFBQUEsUUFBUSxnQkFBRywwQ0FDTix5QkFDRyxxRkFDQSxvQ0FGSCxDQURNLENBQVg7QUFNSDs7QUFFRCx3QkFDSSx1REFDSSx5Q0FDS1QscUJBREwsRUFFS00sUUFGTCxDQURKLGVBS0k7QUFBTSxNQUFBLFFBQVEsRUFBRSxLQUFLNUc7QUFBckIsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0ssS0FBS29HLGNBQUwsRUFETCxDQURKLGVBSUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0ssS0FBS0wsY0FBTCxFQURMLEVBRUssS0FBS0MscUJBQUwsRUFGTCxDQUpKLGVBUUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0ssS0FBS0osV0FBTCxFQURMLEVBRUssS0FBS0ssaUJBQUwsRUFGTCxDQVJKLEVBWU1hLGVBWk4sRUFhTUMsUUFiTixFQWNNRixjQWROLENBTEosQ0FESjtBQXdCSDtBQXhoQjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCAqIGFzIEVtYWlsIGZyb20gJy4uLy4uLy4uL2VtYWlsJztcbmltcG9ydCB7IGxvb2tzVmFsaWQgYXMgcGhvbmVOdW1iZXJMb29rc1ZhbGlkIH0gZnJvbSAnLi4vLi4vLi4vcGhvbmVudW1iZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBTZGtDb25maWcgZnJvbSAnLi4vLi4vLi4vU2RrQ29uZmlnJztcbmltcG9ydCB7IFNBRkVfTE9DQUxQQVJUX1JFR0VYIH0gZnJvbSAnLi4vLi4vLi4vUmVnaXN0cmF0aW9uJztcbmltcG9ydCB3aXRoVmFsaWRhdGlvbiBmcm9tICcuLi9lbGVtZW50cy9WYWxpZGF0aW9uJztcbmltcG9ydCB7VmFsaWRhdGVkU2VydmVyQ29uZmlnfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvQXV0b0Rpc2NvdmVyeVV0aWxzXCI7XG5pbXBvcnQgUGFzc3BocmFzZUZpZWxkIGZyb20gXCIuL1Bhc3NwaHJhc2VGaWVsZFwiO1xuXG5jb25zdCBGSUVMRF9FTUFJTCA9ICdmaWVsZF9lbWFpbCc7XG5jb25zdCBGSUVMRF9QSE9ORV9OVU1CRVIgPSAnZmllbGRfcGhvbmVfbnVtYmVyJztcbmNvbnN0IEZJRUxEX1VTRVJOQU1FID0gJ2ZpZWxkX3VzZXJuYW1lJztcbmNvbnN0IEZJRUxEX1BBU1NXT1JEID0gJ2ZpZWxkX3Bhc3N3b3JkJztcbmNvbnN0IEZJRUxEX1BBU1NXT1JEX0NPTkZJUk0gPSAnZmllbGRfcGFzc3dvcmRfY29uZmlybSc7XG5cbmNvbnN0IFBBU1NXT1JEX01JTl9TQ09SRSA9IDM7IC8vIHNhZmVseSB1bmd1ZXNzYWJsZTogbW9kZXJhdGUgcHJvdGVjdGlvbiBmcm9tIG9mZmxpbmUgc2xvdy1oYXNoIHNjZW5hcmlvLlxuXG4vKipcbiAqIEEgcHVyZSBVSSBjb21wb25lbnQgd2hpY2ggZGlzcGxheXMgYSByZWdpc3RyYXRpb24gZm9ybS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSZWdpc3RyYXRpb25Gb3JtJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBWYWx1ZXMgcHJlLWZpbGxlZCBpbiB0aGUgaW5wdXQgYm94ZXMgd2hlbiB0aGUgY29tcG9uZW50IGxvYWRzXG4gICAgICAgIGRlZmF1bHRFbWFpbDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgZGVmYXVsdFBob25lQ291bnRyeTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgZGVmYXVsdFBob25lTnVtYmVyOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBkZWZhdWx0VXNlcm5hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGRlZmF1bHRQYXNzd29yZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgb25SZWdpc3RlckNsaWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLCAvLyBvblJlZ2lzdGVyQ2xpY2soT2JqZWN0KSA9PiA/UHJvbWlzZVxuICAgICAgICBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBmbG93czogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLm9iamVjdCkuaXNSZXF1aXJlZCxcbiAgICAgICAgc2VydmVyQ29uZmlnOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihWYWxpZGF0ZWRTZXJ2ZXJDb25maWcpLmlzUmVxdWlyZWQsXG4gICAgICAgIGNhblN1Ym1pdDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIHNlcnZlclJlcXVpcmVzSWRTZXJ2ZXI6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb25WYWxpZGF0aW9uQ2hhbmdlOiBjb25zb2xlLmVycm9yLFxuICAgICAgICAgICAgY2FuU3VibWl0OiB0cnVlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gRmllbGQgZXJyb3IgY29kZXMgYnkgZmllbGQgSURcbiAgICAgICAgICAgIGZpZWxkVmFsaWQ6IHt9LFxuICAgICAgICAgICAgLy8gVGhlIElTTzIgY291bnRyeSBjb2RlIHNlbGVjdGVkIGluIHRoZSBwaG9uZSBudW1iZXIgZW50cnlcbiAgICAgICAgICAgIHBob25lQ291bnRyeTogdGhpcy5wcm9wcy5kZWZhdWx0UGhvbmVDb3VudHJ5LFxuICAgICAgICAgICAgdXNlcm5hbWU6IHRoaXMucHJvcHMuZGVmYXVsdFVzZXJuYW1lIHx8IFwiXCIsXG4gICAgICAgICAgICBlbWFpbDogdGhpcy5wcm9wcy5kZWZhdWx0RW1haWwgfHwgXCJcIixcbiAgICAgICAgICAgIHBob25lTnVtYmVyOiB0aGlzLnByb3BzLmRlZmF1bHRQaG9uZU51bWJlciB8fCBcIlwiLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHRoaXMucHJvcHMuZGVmYXVsdFBhc3N3b3JkIHx8IFwiXCIsXG4gICAgICAgICAgICBwYXNzd29yZENvbmZpcm06IHRoaXMucHJvcHMuZGVmYXVsdFBhc3N3b3JkIHx8IFwiXCIsXG4gICAgICAgICAgICBwYXNzd29yZENvbXBsZXhpdHk6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uU3VibWl0OiBhc3luYyBmdW5jdGlvbihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5jYW5TdWJtaXQpIHJldHVybjtcblxuICAgICAgICBjb25zdCBhbGxGaWVsZHNWYWxpZCA9IGF3YWl0IHRoaXMudmVyaWZ5RmllbGRzQmVmb3JlU3VibWl0KCk7XG4gICAgICAgIGlmICghYWxsRmllbGRzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lbWFpbCA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhdmVJcyA9IEJvb2xlYW4odGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaXNVcmwpO1xuXG4gICAgICAgICAgICBsZXQgZGVzYztcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnNlcnZlclJlcXVpcmVzSWRTZXJ2ZXIgJiYgIWhhdmVJcykge1xuICAgICAgICAgICAgICAgIGRlc2MgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJObyBpZGVudGl0eSBzZXJ2ZXIgaXMgY29uZmlndXJlZCBzbyB5b3UgY2Fubm90IGFkZCBhbiBlbWFpbCBhZGRyZXNzIGluIG9yZGVyIHRvIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJyZXNldCB5b3VyIHBhc3N3b3JkIGluIHRoZSBmdXR1cmUuXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fc2hvd0VtYWlsKCkpIHtcbiAgICAgICAgICAgICAgICBkZXNjID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiSWYgeW91IGRvbid0IHNwZWNpZnkgYW4gZW1haWwgYWRkcmVzcywgeW91IHdvbid0IGJlIGFibGUgdG8gcmVzZXQgeW91ciBwYXNzd29yZC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIkFyZSB5b3Ugc3VyZT9cIixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB1c2VyIGNhbid0IHNldCBhbiBlLW1haWwgc28gZG9uJ3QgcHJvbXB0IHRoZW0gdG9cbiAgICAgICAgICAgICAgICBzZWxmLl9kb1N1Ym1pdChldik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnSWYgeW91IGRvblxcJ3Qgc3BlY2lmeSBhbiBlbWFpbCBhZGRyZXNzLi4uJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiV2FybmluZyFcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2MsXG4gICAgICAgICAgICAgICAgYnV0dG9uOiBfdChcIkNvbnRpbnVlXCIpLFxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IGZ1bmN0aW9uKGNvbmZpcm1lZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybWVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb1N1Ym1pdChldik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLl9kb1N1Ym1pdChldik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2RvU3VibWl0OiBmdW5jdGlvbihldikge1xuICAgICAgICBjb25zdCBlbWFpbCA9IHRoaXMuc3RhdGUuZW1haWwudHJpbSgpO1xuICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5wcm9wcy5vblJlZ2lzdGVyQ2xpY2soe1xuICAgICAgICAgICAgdXNlcm5hbWU6IHRoaXMuc3RhdGUudXNlcm5hbWUudHJpbSgpLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHRoaXMuc3RhdGUucGFzc3dvcmQudHJpbSgpLFxuICAgICAgICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgICAgICAgcGhvbmVDb3VudHJ5OiB0aGlzLnN0YXRlLnBob25lQ291bnRyeSxcbiAgICAgICAgICAgIHBob25lTnVtYmVyOiB0aGlzLnN0YXRlLnBob25lTnVtYmVyLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHJvbWlzZSkge1xuICAgICAgICAgICAgZXYudGFyZ2V0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHByb21pc2UuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBldi50YXJnZXQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHZlcmlmeUZpZWxkc0JlZm9yZVN1Ym1pdCgpIHtcbiAgICAgICAgLy8gQmx1ciB0aGUgYWN0aXZlIGVsZW1lbnQgaWYgYW55LCBzbyB3ZSBmaXJzdCBydW4gaXRzIGJsdXIgdmFsaWRhdGlvbixcbiAgICAgICAgLy8gd2hpY2ggaXMgbGVzcyBzdHJpY3QgdGhhbiB0aGUgcGFzcyB3ZSdyZSBhYm91dCB0byBkbyBiZWxvdyBmb3IgYWxsIGZpZWxkcy5cbiAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmIChhY3RpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICBhY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpZWxkSURzSW5EaXNwbGF5T3JkZXIgPSBbXG4gICAgICAgICAgICBGSUVMRF9VU0VSTkFNRSxcbiAgICAgICAgICAgIEZJRUxEX1BBU1NXT1JELFxuICAgICAgICAgICAgRklFTERfUEFTU1dPUkRfQ09ORklSTSxcbiAgICAgICAgICAgIEZJRUxEX0VNQUlMLFxuICAgICAgICAgICAgRklFTERfUEhPTkVfTlVNQkVSLFxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIFJ1biBhbGwgZmllbGRzIHdpdGggc3RyaWN0ZXIgdmFsaWRhdGlvbiB0aGF0IG5vIGxvbmdlciBhbGxvd3MgZW1wdHlcbiAgICAgICAgLy8gdmFsdWVzIGZvciByZXF1aXJlZCBmaWVsZHMuXG4gICAgICAgIGZvciAoY29uc3QgZmllbGRJRCBvZiBmaWVsZElEc0luRGlzcGxheU9yZGVyKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXNbZmllbGRJRF07XG4gICAgICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBXZSBtdXN0IHdhaXQgZm9yIHRoZXNlIHZhbGlkYXRpb25zIHRvIGZpbmlzaCBiZWZvcmUgcXVldWVpbmdcbiAgICAgICAgICAgIC8vIHVwIHRoZSBzZXRTdGF0ZSBiZWxvdyBzbyBvdXIgc2V0U3RhdGUgZ29lcyBpbiB0aGUgcXVldWUgYWZ0ZXJcbiAgICAgICAgICAgIC8vIGFsbCB0aGUgc2V0U3RhdGVzIGZyb20gdGhlc2UgdmFsaWRhdGUgY2FsbHMgKHRoYXQncyBob3cgd2VcbiAgICAgICAgICAgIC8vIGtub3cgdGhleSd2ZSBmaW5pc2hlZCkuXG4gICAgICAgICAgICBhd2FpdCBmaWVsZC52YWxpZGF0ZSh7IGFsbG93RW1wdHk6IGZhbHNlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGlvbiBhbmQgc3RhdGUgdXBkYXRlcyBhcmUgYXN5bmMsIHNvIHdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlbSB0byBjb21wbGV0ZVxuICAgICAgICAvLyBmaXJzdC4gUXVldWUgYSBgc2V0U3RhdGVgIGNhbGxiYWNrIGFuZCB3YWl0IGZvciBpdCB0byByZXNvbHZlLlxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMuc2V0U3RhdGUoe30sIHJlc29sdmUpKTtcblxuICAgICAgICBpZiAodGhpcy5hbGxGaWVsZHNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGludmFsaWRGaWVsZCA9IHRoaXMuZmluZEZpcnN0SW52YWxpZEZpZWxkKGZpZWxkSURzSW5EaXNwbGF5T3JkZXIpO1xuXG4gICAgICAgIGlmICghaW52YWxpZEZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvY3VzIHRoZSBmaXJzdCBpbnZhbGlkIGZpZWxkIGFuZCBzaG93IGZlZWRiYWNrIGluIHRoZSBzdHJpY3RlciBtb2RlXG4gICAgICAgIC8vIHRoYXQgbm8gbG9uZ2VyIGFsbG93cyBlbXB0eSB2YWx1ZXMgZm9yIHJlcXVpcmVkIGZpZWxkcy5cbiAgICAgICAgaW52YWxpZEZpZWxkLmZvY3VzKCk7XG4gICAgICAgIGludmFsaWRGaWVsZC52YWxpZGF0ZSh7IGFsbG93RW1wdHk6IGZhbHNlLCBmb2N1c2VkOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGFsbCBmaWVsZHMgd2VyZSB2YWxpZCBsYXN0IHRpbWUgdGhleSB3ZXJlIHZhbGlkYXRlZC5cbiAgICAgKi9cbiAgICBhbGxGaWVsZHNWYWxpZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnN0YXRlLmZpZWxkVmFsaWQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZS5maWVsZFZhbGlkW2tleXNbaV1dKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBmaW5kRmlyc3RJbnZhbGlkRmllbGQoZmllbGRJRHMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmaWVsZElEIG9mIGZpZWxkSURzKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZmllbGRWYWxpZFtmaWVsZElEXSAmJiB0aGlzW2ZpZWxkSURdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRJRF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIG1hcmtGaWVsZFZhbGlkOiBmdW5jdGlvbihmaWVsZElELCB2YWxpZCkge1xuICAgICAgICBjb25zdCB7IGZpZWxkVmFsaWQgfSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIGZpZWxkVmFsaWRbZmllbGRJRF0gPSB2YWxpZDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmaWVsZFZhbGlkLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25FbWFpbENoYW5nZShldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVtYWlsOiBldi50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvbkVtYWlsVmFsaWRhdGUoZmllbGRTdGF0ZSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnZhbGlkYXRlRW1haWxSdWxlcyhmaWVsZFN0YXRlKTtcbiAgICAgICAgdGhpcy5tYXJrRmllbGRWYWxpZChGSUVMRF9FTUFJTCwgcmVzdWx0LnZhbGlkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVFbWFpbFJ1bGVzOiB3aXRoVmFsaWRhdGlvbih7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAoKSA9PiBfdChcIlVzZSBhbiBlbWFpbCBhZGRyZXNzIHRvIHJlY292ZXIgeW91ciBhY2NvdW50XCIpLFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogXCJyZXF1aXJlZFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6IGZ1bmN0aW9uKHsgdmFsdWUsIGFsbG93RW1wdHkgfSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxsb3dFbXB0eSB8fCAhdGhpcy5fYXV0aFN0ZXBJc1JlcXVpcmVkKCdtLmxvZ2luLmVtYWlsLmlkZW50aXR5JykgfHwgISF2YWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGludmFsaWQ6ICgpID0+IF90KFwiRW50ZXIgZW1haWwgYWRkcmVzcyAocmVxdWlyZWQgb24gdGhpcyBob21lc2VydmVyKVwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5OiBcImVtYWlsXCIsXG4gICAgICAgICAgICAgICAgdGVzdDogKHsgdmFsdWUgfSkgPT4gIXZhbHVlIHx8IEVtYWlsLmxvb2tzVmFsaWQodmFsdWUpLFxuICAgICAgICAgICAgICAgIGludmFsaWQ6ICgpID0+IF90KFwiRG9lc24ndCBsb29rIGxpa2UgYSB2YWxpZCBlbWFpbCBhZGRyZXNzXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KSxcblxuICAgIG9uUGFzc3dvcmRDaGFuZ2UoZXYpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwYXNzd29yZDogZXYudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25QYXNzd29yZFZhbGlkYXRlKHJlc3VsdCkge1xuICAgICAgICB0aGlzLm1hcmtGaWVsZFZhbGlkKEZJRUxEX1BBU1NXT1JELCByZXN1bHQudmFsaWQpO1xuICAgIH0sXG5cbiAgICBvblBhc3N3b3JkQ29uZmlybUNoYW5nZShldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhc3N3b3JkQ29uZmlybTogZXYudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgb25QYXNzd29yZENvbmZpcm1WYWxpZGF0ZShmaWVsZFN0YXRlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudmFsaWRhdGVQYXNzd29yZENvbmZpcm1SdWxlcyhmaWVsZFN0YXRlKTtcbiAgICAgICAgdGhpcy5tYXJrRmllbGRWYWxpZChGSUVMRF9QQVNTV09SRF9DT05GSVJNLCByZXN1bHQudmFsaWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVBhc3N3b3JkQ29uZmlybVJ1bGVzOiB3aXRoVmFsaWRhdGlvbih7XG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5OiBcInJlcXVpcmVkXCIsXG4gICAgICAgICAgICAgICAgdGVzdDogKHsgdmFsdWUsIGFsbG93RW1wdHkgfSkgPT4gYWxsb3dFbXB0eSB8fCAhIXZhbHVlLFxuICAgICAgICAgICAgICAgIGludmFsaWQ6ICgpID0+IF90KFwiQ29uZmlybSBwYXNzd29yZFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5OiBcIm1hdGNoXCIsXG4gICAgICAgICAgICAgICAgdGVzdDogZnVuY3Rpb24oeyB2YWx1ZSB9KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhdmFsdWUgfHwgdmFsdWUgPT09IHRoaXMuc3RhdGUucGFzc3dvcmQ7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdChcIlBhc3N3b3JkcyBkb24ndCBtYXRjaFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICBdLFxuICAgIH0pLFxuXG4gICAgb25QaG9uZUNvdW50cnlDaGFuZ2UobmV3VmFsKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhvbmVDb3VudHJ5OiBuZXdWYWwuaXNvMixcbiAgICAgICAgICAgIHBob25lUHJlZml4OiBuZXdWYWwucHJlZml4LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25QaG9uZU51bWJlckNoYW5nZShldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBob25lTnVtYmVyOiBldi50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvblBob25lTnVtYmVyVmFsaWRhdGUoZmllbGRTdGF0ZSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnZhbGlkYXRlUGhvbmVOdW1iZXJSdWxlcyhmaWVsZFN0YXRlKTtcbiAgICAgICAgdGhpcy5tYXJrRmllbGRWYWxpZChGSUVMRF9QSE9ORV9OVU1CRVIsIHJlc3VsdC52YWxpZCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGhvbmVOdW1iZXJSdWxlczogd2l0aFZhbGlkYXRpb24oe1xuICAgICAgICBkZXNjcmlwdGlvbjogKCkgPT4gX3QoXCJPdGhlciB1c2VycyBjYW4gaW52aXRlIHlvdSB0byByb29tcyB1c2luZyB5b3VyIGNvbnRhY3QgZGV0YWlsc1wiKSxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBrZXk6IFwicmVxdWlyZWRcIixcbiAgICAgICAgICAgICAgICB0ZXN0OiBmdW5jdGlvbih7IHZhbHVlLCBhbGxvd0VtcHR5IH0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsbG93RW1wdHkgfHwgIXRoaXMuX2F1dGhTdGVwSXNSZXF1aXJlZCgnbS5sb2dpbi5tc2lzZG4nKSB8fCAhIXZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaW52YWxpZDogKCkgPT4gX3QoXCJFbnRlciBwaG9uZSBudW1iZXIgKHJlcXVpcmVkIG9uIHRoaXMgaG9tZXNlcnZlcilcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogXCJlbWFpbFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6ICh7IHZhbHVlIH0pID0+ICF2YWx1ZSB8fCBwaG9uZU51bWJlckxvb2tzVmFsaWQodmFsdWUpLFxuICAgICAgICAgICAgICAgIGludmFsaWQ6ICgpID0+IF90KFwiRG9lc24ndCBsb29rIGxpa2UgYSB2YWxpZCBwaG9uZSBudW1iZXJcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pLFxuXG4gICAgb25Vc2VybmFtZUNoYW5nZShldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiBldi50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvblVzZXJuYW1lVmFsaWRhdGUoZmllbGRTdGF0ZSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnZhbGlkYXRlVXNlcm5hbWVSdWxlcyhmaWVsZFN0YXRlKTtcbiAgICAgICAgdGhpcy5tYXJrRmllbGRWYWxpZChGSUVMRF9VU0VSTkFNRSwgcmVzdWx0LnZhbGlkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVVc2VybmFtZVJ1bGVzOiB3aXRoVmFsaWRhdGlvbih7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAoKSA9PiBfdChcIlVzZSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycywgZGFzaGVzIGFuZCB1bmRlcnNjb3JlcyBvbmx5XCIpLFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogXCJyZXF1aXJlZFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6ICh7IHZhbHVlLCBhbGxvd0VtcHR5IH0pID0+IGFsbG93RW1wdHkgfHwgISF2YWx1ZSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdChcIkVudGVyIHVzZXJuYW1lXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBrZXk6IFwic2FmZUxvY2FscGFydFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6ICh7IHZhbHVlIH0pID0+ICF2YWx1ZSB8fCBTQUZFX0xPQ0FMUEFSVF9SRUdFWC50ZXN0KHZhbHVlKSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdChcIlNvbWUgY2hhcmFjdGVycyBub3QgYWxsb3dlZFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSksXG5cbiAgICAvKipcbiAgICAgKiBBIHN0ZXAgaXMgcmVxdWlyZWQgaWYgYWxsIGZsb3dzIGluY2x1ZGUgdGhhdCBzdGVwLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0ZXAgQSBzdGFnZSBuYW1lIHRvIGNoZWNrXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgaXQgaXMgcmVxdWlyZWRcbiAgICAgKi9cbiAgICBfYXV0aFN0ZXBJc1JlcXVpcmVkKHN0ZXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZmxvd3MuZXZlcnkoKGZsb3cpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBmbG93LnN0YWdlcy5pbmNsdWRlcyhzdGVwKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgc3RlcCBpcyB1c2VkIGlmIGFueSBmbG93cyBpbmNsdWRlIHRoYXQgc3RlcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGVwIEEgc3RhZ2UgbmFtZSB0byBjaGVja1xuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIGl0IGlzIHVzZWRcbiAgICAgKi9cbiAgICBfYXV0aFN0ZXBJc1VzZWQoc3RlcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5mbG93cy5zb21lKChmbG93KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZmxvdy5zdGFnZXMuaW5jbHVkZXMoc3RlcCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfc2hvd0VtYWlsKCkge1xuICAgICAgICBjb25zdCBoYXZlSXMgPSBCb29sZWFuKHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgKHRoaXMucHJvcHMuc2VydmVyUmVxdWlyZXNJZFNlcnZlciAmJiAhaGF2ZUlzKSB8fFxuICAgICAgICAgICAgIXRoaXMuX2F1dGhTdGVwSXNVc2VkKCdtLmxvZ2luLmVtYWlsLmlkZW50aXR5JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIF9zaG93UGhvbmVOdW1iZXIoKSB7XG4gICAgICAgIGNvbnN0IHRocmVlUGlkTG9naW4gPSAhU2RrQ29uZmlnLmdldCgpLmRpc2FibGVfM3BpZF9sb2dpbjtcbiAgICAgICAgY29uc3QgaGF2ZUlzID0gQm9vbGVhbih0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICF0aHJlZVBpZExvZ2luIHx8XG4gICAgICAgICAgICAodGhpcy5wcm9wcy5zZXJ2ZXJSZXF1aXJlc0lkU2VydmVyICYmICFoYXZlSXMpIHx8XG4gICAgICAgICAgICAhdGhpcy5fYXV0aFN0ZXBJc1VzZWQoJ20ubG9naW4ubXNpc2RuJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIHJlbmRlckVtYWlsKCkge1xuICAgICAgICBpZiAoIXRoaXMuX3Nob3dFbWFpbCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIGNvbnN0IGVtYWlsUGxhY2Vob2xkZXIgPSB0aGlzLl9hdXRoU3RlcElzUmVxdWlyZWQoJ20ubG9naW4uZW1haWwuaWRlbnRpdHknKSA/XG4gICAgICAgICAgICBfdChcIkVtYWlsXCIpIDpcbiAgICAgICAgICAgIF90KFwiRW1haWwgKG9wdGlvbmFsKVwiKTtcbiAgICAgICAgcmV0dXJuIDxGaWVsZFxuICAgICAgICAgICAgcmVmPXtmaWVsZCA9PiB0aGlzW0ZJRUxEX0VNQUlMXSA9IGZpZWxkfVxuICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgbGFiZWw9e2VtYWlsUGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5lbWFpbH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uRW1haWxDaGFuZ2V9XG4gICAgICAgICAgICBvblZhbGlkYXRlPXt0aGlzLm9uRW1haWxWYWxpZGF0ZX1cbiAgICAgICAgLz47XG4gICAgfSxcblxuICAgIHJlbmRlclBhc3N3b3JkKCkge1xuICAgICAgICByZXR1cm4gPFBhc3NwaHJhc2VGaWVsZFxuICAgICAgICAgICAgaWQ9XCJteF9SZWdpc3RyYXRpb25Gb3JtX3Bhc3N3b3JkXCJcbiAgICAgICAgICAgIGZpZWxkUmVmPXtmaWVsZCA9PiB0aGlzW0ZJRUxEX1BBU1NXT1JEXSA9IGZpZWxkfVxuICAgICAgICAgICAgbWluU2NvcmU9e1BBU1NXT1JEX01JTl9TQ09SRX1cbiAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBhc3N3b3JkfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25QYXNzd29yZENoYW5nZX1cbiAgICAgICAgICAgIG9uVmFsaWRhdGU9e3RoaXMub25QYXNzd29yZFZhbGlkYXRlfVxuICAgICAgICAvPjtcbiAgICB9LFxuXG4gICAgcmVuZGVyUGFzc3dvcmRDb25maXJtKCkge1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIHJldHVybiA8RmllbGRcbiAgICAgICAgICAgIGlkPVwibXhfUmVnaXN0cmF0aW9uRm9ybV9wYXNzd29yZENvbmZpcm1cIlxuICAgICAgICAgICAgcmVmPXtmaWVsZCA9PiB0aGlzW0ZJRUxEX1BBU1NXT1JEX0NPTkZJUk1dID0gZmllbGR9XG4gICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwibmV3LXBhc3N3b3JkXCJcbiAgICAgICAgICAgIGxhYmVsPXtfdChcIkNvbmZpcm1cIil9XG4gICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5wYXNzd29yZENvbmZpcm19XG4gICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vblBhc3N3b3JkQ29uZmlybUNoYW5nZX1cbiAgICAgICAgICAgIG9uVmFsaWRhdGU9e3RoaXMub25QYXNzd29yZENvbmZpcm1WYWxpZGF0ZX1cbiAgICAgICAgLz47XG4gICAgfSxcblxuICAgIHJlbmRlclBob25lTnVtYmVyKCkge1xuICAgICAgICBpZiAoIXRoaXMuX3Nob3dQaG9uZU51bWJlcigpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBDb3VudHJ5RHJvcGRvd24gPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5hdXRoLkNvdW50cnlEcm9wZG93bicpO1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIGNvbnN0IHBob25lTGFiZWwgPSB0aGlzLl9hdXRoU3RlcElzUmVxdWlyZWQoJ20ubG9naW4ubXNpc2RuJykgP1xuICAgICAgICAgICAgX3QoXCJQaG9uZVwiKSA6XG4gICAgICAgICAgICBfdChcIlBob25lIChvcHRpb25hbClcIik7XG4gICAgICAgIGNvbnN0IHBob25lQ291bnRyeSA9IDxDb3VudHJ5RHJvcGRvd25cbiAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBob25lQ291bnRyeX1cbiAgICAgICAgICAgIGlzU21hbGw9e3RydWV9XG4gICAgICAgICAgICBzaG93UHJlZml4PXt0cnVlfVxuICAgICAgICAgICAgb25PcHRpb25DaGFuZ2U9e3RoaXMub25QaG9uZUNvdW50cnlDaGFuZ2V9XG4gICAgICAgIC8+O1xuICAgICAgICByZXR1cm4gPEZpZWxkXG4gICAgICAgICAgICByZWY9e2ZpZWxkID0+IHRoaXNbRklFTERfUEhPTkVfTlVNQkVSXSA9IGZpZWxkfVxuICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgbGFiZWw9e3Bob25lTGFiZWx9XG4gICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5waG9uZU51bWJlcn1cbiAgICAgICAgICAgIHByZWZpeD17cGhvbmVDb3VudHJ5fVxuICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25QaG9uZU51bWJlckNoYW5nZX1cbiAgICAgICAgICAgIG9uVmFsaWRhdGU9e3RoaXMub25QaG9uZU51bWJlclZhbGlkYXRlfVxuICAgICAgICAvPjtcbiAgICB9LFxuXG4gICAgcmVuZGVyVXNlcm5hbWUoKSB7XG4gICAgICAgIGNvbnN0IEZpZWxkID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRmllbGQnKTtcbiAgICAgICAgcmV0dXJuIDxGaWVsZFxuICAgICAgICAgICAgaWQ9XCJteF9SZWdpc3RyYXRpb25Gb3JtX3VzZXJuYW1lXCJcbiAgICAgICAgICAgIHJlZj17ZmllbGQgPT4gdGhpc1tGSUVMRF9VU0VSTkFNRV0gPSBmaWVsZH1cbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgIGxhYmVsPXtfdChcIlVzZXJuYW1lXCIpfVxuICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUudXNlcm5hbWV9XG4gICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vblVzZXJuYW1lQ2hhbmdlfVxuICAgICAgICAgICAgb25WYWxpZGF0ZT17dGhpcy5vblVzZXJuYW1lVmFsaWRhdGV9XG4gICAgICAgIC8+O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgeW91ck1hdHJpeEFjY291bnRUZXh0ID0gX3QoJ0NyZWF0ZSB5b3VyIE1hdHJpeCBhY2NvdW50IG9uICUoc2VydmVyTmFtZSlzJywge1xuICAgICAgICAgICAgc2VydmVyTmFtZTogdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNOYW1lLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmhzTmFtZUlzRGlmZmVyZW50KSB7XG4gICAgICAgICAgICBjb25zdCBUZXh0V2l0aFRvb2x0aXAgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVGV4dFdpdGhUb29sdGlwXCIpO1xuXG4gICAgICAgICAgICB5b3VyTWF0cml4QWNjb3VudFRleHQgPSBfdCgnQ3JlYXRlIHlvdXIgTWF0cml4IGFjY291bnQgb24gPHVuZGVybGluZWRTZXJ2ZXJOYW1lIC8+Jywge30sIHtcbiAgICAgICAgICAgICAgICAndW5kZXJsaW5lZFNlcnZlck5hbWUnOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA8VGV4dFdpdGhUb29sdGlwXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cIm14X0xvZ2luX3VuZGVybGluZWRTZXJ2ZXJOYW1lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9e3RoaXMucHJvcHMuc2VydmVyQ29uZmlnLmhzVXJsfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNOYW1lfVxuICAgICAgICAgICAgICAgICAgICA8L1RleHRXaXRoVG9vbHRpcD47XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVkaXRMaW5rID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25FZGl0U2VydmVyRGV0YWlsc0NsaWNrKSB7XG4gICAgICAgICAgICBlZGl0TGluayA9IDxhIGNsYXNzTmFtZT1cIm14X0F1dGhCb2R5X2VkaXRTZXJ2ZXJEZXRhaWxzXCJcbiAgICAgICAgICAgICAgICBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMucHJvcHMub25FZGl0U2VydmVyRGV0YWlsc0NsaWNrfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtfdCgnQ2hhbmdlJyl9XG4gICAgICAgICAgICA8L2E+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVnaXN0ZXJCdXR0b24gPSAoXG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibXhfTG9naW5fc3VibWl0XCIgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPXtfdChcIlJlZ2lzdGVyXCIpfSBkaXNhYmxlZD17IXRoaXMucHJvcHMuY2FuU3VibWl0fSAvPlxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBlbWFpbEhlbHBlclRleHQgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5fc2hvd0VtYWlsKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zaG93UGhvbmVOdW1iZXIoKSkge1xuICAgICAgICAgICAgICAgIGVtYWlsSGVscGVyVGV4dCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2V0IGFuIGVtYWlsIGZvciBhY2NvdW50IHJlY292ZXJ5LiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlVzZSBlbWFpbCBvciBwaG9uZSB0byBvcHRpb25hbGx5IGJlIGRpc2NvdmVyYWJsZSBieSBleGlzdGluZyBjb250YWN0cy5cIixcbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVtYWlsSGVscGVyVGV4dCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2V0IGFuIGVtYWlsIGZvciBhY2NvdW50IHJlY292ZXJ5LiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlVzZSBlbWFpbCB0byBvcHRpb25hbGx5IGJlIGRpc2NvdmVyYWJsZSBieSBleGlzdGluZyBjb250YWN0cy5cIixcbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGF2ZUlzID0gQm9vbGVhbih0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybCk7XG4gICAgICAgIGxldCBub0lzVGV4dCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNlcnZlclJlcXVpcmVzSWRTZXJ2ZXIgJiYgIWhhdmVJcykge1xuICAgICAgICAgICAgbm9Jc1RleHQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCJObyBpZGVudGl0eSBzZXJ2ZXIgaXMgY29uZmlndXJlZCBzbyB5b3UgY2Fubm90IGFkZCBhbiBlbWFpbCBhZGRyZXNzIGluIG9yZGVyIHRvIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJyZXNldCB5b3VyIHBhc3N3b3JkIGluIHRoZSBmdXR1cmUuXCIsXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMz5cbiAgICAgICAgICAgICAgICAgICAge3lvdXJNYXRyaXhBY2NvdW50VGV4dH1cbiAgICAgICAgICAgICAgICAgICAge2VkaXRMaW5rfVxuICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMub25TdWJtaXR9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0F1dGhCb2R5X2ZpZWxkUm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5yZW5kZXJVc2VybmFtZSgpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9maWVsZFJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMucmVuZGVyUGFzc3dvcmQoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnJlbmRlclBhc3N3b3JkQ29uZmlybSgpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9maWVsZFJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMucmVuZGVyRW1haWwoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnJlbmRlclBob25lTnVtYmVyKCl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7IGVtYWlsSGVscGVyVGV4dCB9XG4gICAgICAgICAgICAgICAgICAgIHsgbm9Jc1RleHQgfVxuICAgICAgICAgICAgICAgICAgICB7IHJlZ2lzdGVyQnV0dG9uIH1cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=