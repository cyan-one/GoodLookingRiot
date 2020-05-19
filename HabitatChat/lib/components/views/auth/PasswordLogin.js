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

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _AutoDiscoveryUtils = require("../../../utils/AutoDiscoveryUtils");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 New Vector Ltd.

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
 * A pure UI component which displays a username/password form.
 */
class PasswordLogin extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: this.props.initialUsername,
      password: this.props.initialPassword,
      phoneCountry: this.props.initialPhoneCountry,
      phoneNumber: this.props.initialPhoneNumber,
      loginType: PasswordLogin.LOGIN_FIELD_MXID
    };
    this.onForgotPasswordClick = this.onForgotPasswordClick.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    this.onUsernameBlur = this.onUsernameBlur.bind(this);
    this.onLoginTypeChange = this.onLoginTypeChange.bind(this);
    this.onPhoneCountryChanged = this.onPhoneCountryChanged.bind(this);
    this.onPhoneNumberChanged = this.onPhoneNumberChanged.bind(this);
    this.onPhoneNumberBlur = this.onPhoneNumberBlur.bind(this);
    this.onPasswordChanged = this.onPasswordChanged.bind(this);
    this.isLoginEmpty = this.isLoginEmpty.bind(this);
  }

  onForgotPasswordClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onForgotPasswordClick();
  }

  onSubmitForm(ev) {
    ev.preventDefault();
    let username = ''; // XXX: Synapse breaks if you send null here:

    let phoneCountry = null;
    let phoneNumber = null;
    let error;

    switch (this.state.loginType) {
      case PasswordLogin.LOGIN_FIELD_EMAIL:
        username = this.state.username;

        if (!username) {
          error = (0, _languageHandler._t)('The email field must not be blank.');
        }

        break;

      case PasswordLogin.LOGIN_FIELD_MXID:
        username = this.state.username;

        if (!username) {
          error = (0, _languageHandler._t)('The username field must not be blank.');
        }

        break;

      case PasswordLogin.LOGIN_FIELD_PHONE:
        phoneCountry = this.state.phoneCountry;
        phoneNumber = this.state.phoneNumber;

        if (!phoneNumber) {
          error = (0, _languageHandler._t)('The phone number field must not be blank.');
        }

        break;
    }

    if (error) {
      this.props.onError(error);
      return;
    }

    if (!this.state.password) {
      this.props.onError((0, _languageHandler._t)('The password field must not be blank.'));
      return;
    }

    this.props.onSubmit(username, phoneCountry, phoneNumber, this.state.password);
  }

  onUsernameChanged(ev) {
    this.setState({
      username: ev.target.value
    });
    this.props.onUsernameChanged(ev.target.value);
  }

  onUsernameBlur(ev) {
    this.props.onUsernameBlur(ev.target.value);
  }

  onLoginTypeChange(ev) {
    const loginType = ev.target.value;
    this.props.onError(null); // send a null error to clear any error messages

    this.setState({
      loginType: loginType,
      username: "" // Reset because email and username use the same state

    });
  }

  onPhoneCountryChanged(country) {
    this.setState({
      phoneCountry: country.iso2,
      phonePrefix: country.prefix
    });
    this.props.onPhoneCountryChanged(country.iso2);
  }

  onPhoneNumberChanged(ev) {
    this.setState({
      phoneNumber: ev.target.value
    });
    this.props.onPhoneNumberChanged(ev.target.value);
  }

  onPhoneNumberBlur(ev) {
    this.props.onPhoneNumberBlur(ev.target.value);
  }

  onPasswordChanged(ev) {
    this.setState({
      password: ev.target.value
    });
    this.props.onPasswordChanged(ev.target.value);
  }

  renderLoginField(loginType, autoFocus) {
    const Field = sdk.getComponent('elements.Field');
    const classes = {};

    switch (loginType) {
      case PasswordLogin.LOGIN_FIELD_EMAIL:
        classes.error = this.props.loginIncorrect && !this.state.username;
        return /*#__PURE__*/_react.default.createElement(Field, {
          className: (0, _classnames.default)(classes),
          name: "username" // make it a little easier for browser's remember-password
          ,
          key: "email_input",
          type: "text",
          label: (0, _languageHandler._t)("Email"),
          placeholder: "joe@example.com",
          value: this.state.username,
          onChange: this.onUsernameChanged,
          onBlur: this.onUsernameBlur,
          disabled: this.props.disableSubmit,
          autoFocus: autoFocus
        });

      case PasswordLogin.LOGIN_FIELD_MXID:
        classes.error = this.props.loginIncorrect && !this.state.username;
        return /*#__PURE__*/_react.default.createElement(Field, {
          className: (0, _classnames.default)(classes),
          name: "username" // make it a little easier for browser's remember-password
          ,
          key: "username_input",
          type: "text",
          label: (0, _languageHandler._t)("Username"),
          value: this.state.username,
          onChange: this.onUsernameChanged,
          onBlur: this.onUsernameBlur,
          disabled: this.props.disableSubmit,
          autoFocus: autoFocus
        });

      case PasswordLogin.LOGIN_FIELD_PHONE:
        {
          const CountryDropdown = sdk.getComponent('views.auth.CountryDropdown');
          classes.error = this.props.loginIncorrect && !this.state.phoneNumber;

          const phoneCountry = /*#__PURE__*/_react.default.createElement(CountryDropdown, {
            value: this.state.phoneCountry,
            isSmall: true,
            showPrefix: true,
            onOptionChange: this.onPhoneCountryChanged
          });

          return /*#__PURE__*/_react.default.createElement(Field, {
            className: (0, _classnames.default)(classes),
            name: "phoneNumber",
            key: "phone_input",
            type: "text",
            label: (0, _languageHandler._t)("Phone"),
            value: this.state.phoneNumber,
            prefix: phoneCountry,
            onChange: this.onPhoneNumberChanged,
            onBlur: this.onPhoneNumberBlur,
            disabled: this.props.disableSubmit,
            autoFocus: autoFocus
          });
        }
    }
  }

  isLoginEmpty() {
    switch (this.state.loginType) {
      case PasswordLogin.LOGIN_FIELD_EMAIL:
      case PasswordLogin.LOGIN_FIELD_MXID:
        return !this.state.username;

      case PasswordLogin.LOGIN_FIELD_PHONE:
        return !this.state.phoneCountry || !this.state.phoneNumber;
    }
  }

  render() {
    const Field = sdk.getComponent('elements.Field');
    const SignInToText = sdk.getComponent('views.auth.SignInToText');
    let forgotPasswordJsx;

    if (this.props.onForgotPasswordClick) {
      forgotPasswordJsx = /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)('Not sure of your password? <a>Set a new one</a>', {}, {
        a: sub => /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_Login_forgot",
          disabled: this.props.busy,
          kind: "link",
          onClick: this.onForgotPasswordClick
        }, sub)
      }));
    }

    const pwFieldClass = (0, _classnames.default)({
      error: this.props.loginIncorrect && !this.isLoginEmpty() // only error password if error isn't top field

    }); // If login is empty, autoFocus login, otherwise autoFocus password.
    // this is for when auto server discovery remounts us when the user tries to tab from username to password

    const autoFocusPassword = !this.isLoginEmpty();
    const loginField = this.renderLoginField(this.state.loginType, !autoFocusPassword);
    let loginType;

    if (!_SdkConfig.default.get().disable_3pid_login) {
      loginType = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Login_type_container"
      }, /*#__PURE__*/_react.default.createElement("label", {
        className: "mx_Login_type_label"
      }, (0, _languageHandler._t)('Sign in with')), /*#__PURE__*/_react.default.createElement(Field, {
        element: "select",
        value: this.state.loginType,
        onChange: this.onLoginTypeChange,
        disabled: this.props.disableSubmit
      }, /*#__PURE__*/_react.default.createElement("option", {
        key: PasswordLogin.LOGIN_FIELD_MXID,
        value: PasswordLogin.LOGIN_FIELD_MXID
      }, (0, _languageHandler._t)('Username')), /*#__PURE__*/_react.default.createElement("option", {
        key: PasswordLogin.LOGIN_FIELD_EMAIL,
        value: PasswordLogin.LOGIN_FIELD_EMAIL
      }, (0, _languageHandler._t)('Email address')), /*#__PURE__*/_react.default.createElement("option", {
        key: PasswordLogin.LOGIN_FIELD_PHONE,
        value: PasswordLogin.LOGIN_FIELD_PHONE
      }, (0, _languageHandler._t)('Phone'))));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(SignInToText, {
      serverConfig: this.props.serverConfig,
      onEditServerDetailsClick: this.props.onEditServerDetailsClick
    }), /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this.onSubmitForm
    }, loginType, loginField, /*#__PURE__*/_react.default.createElement(Field, {
      className: pwFieldClass,
      type: "password",
      name: "password",
      label: (0, _languageHandler._t)('Password'),
      value: this.state.password,
      onChange: this.onPasswordChanged,
      disabled: this.props.disableSubmit,
      autoFocus: autoFocusPassword
    }), forgotPasswordJsx, !this.props.busy && /*#__PURE__*/_react.default.createElement("input", {
      className: "mx_Login_submit",
      type: "submit",
      value: (0, _languageHandler._t)('Sign in'),
      disabled: this.props.disableSubmit
    })));
  }

}

exports.default = PasswordLogin;
(0, _defineProperty2.default)(PasswordLogin, "propTypes", {
  onSubmit: _propTypes.default.func.isRequired,
  // fn(username, password)
  onError: _propTypes.default.func,
  onEditServerDetailsClick: _propTypes.default.func,
  onForgotPasswordClick: _propTypes.default.func,
  // fn()
  initialUsername: _propTypes.default.string,
  initialPhoneCountry: _propTypes.default.string,
  initialPhoneNumber: _propTypes.default.string,
  initialPassword: _propTypes.default.string,
  onUsernameChanged: _propTypes.default.func,
  onPhoneCountryChanged: _propTypes.default.func,
  onPhoneNumberChanged: _propTypes.default.func,
  onPasswordChanged: _propTypes.default.func,
  loginIncorrect: _propTypes.default.bool,
  disableSubmit: _propTypes.default.bool,
  serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
  busy: _propTypes.default.bool
});
(0, _defineProperty2.default)(PasswordLogin, "defaultProps", {
  onError: function () {},
  onEditServerDetailsClick: null,
  onUsernameChanged: function () {},
  onUsernameBlur: function () {},
  onPasswordChanged: function () {},
  onPhoneCountryChanged: function () {},
  onPhoneNumberChanged: function () {},
  onPhoneNumberBlur: function () {},
  initialUsername: "",
  initialPhoneCountry: "",
  initialPhoneNumber: "",
  initialPassword: "",
  loginIncorrect: false,
  disableSubmit: false
});
(0, _defineProperty2.default)(PasswordLogin, "LOGIN_FIELD_EMAIL", "login_field_email");
(0, _defineProperty2.default)(PasswordLogin, "LOGIN_FIELD_MXID", "login_field_mxid");
(0, _defineProperty2.default)(PasswordLogin, "LOGIN_FIELD_PHONE", "login_field_phone");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvUGFzc3dvcmRMb2dpbi5qcyJdLCJuYW1lcyI6WyJQYXNzd29yZExvZ2luIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwic3RhdGUiLCJ1c2VybmFtZSIsImluaXRpYWxVc2VybmFtZSIsInBhc3N3b3JkIiwiaW5pdGlhbFBhc3N3b3JkIiwicGhvbmVDb3VudHJ5IiwiaW5pdGlhbFBob25lQ291bnRyeSIsInBob25lTnVtYmVyIiwiaW5pdGlhbFBob25lTnVtYmVyIiwibG9naW5UeXBlIiwiTE9HSU5fRklFTERfTVhJRCIsIm9uRm9yZ290UGFzc3dvcmRDbGljayIsImJpbmQiLCJvblN1Ym1pdEZvcm0iLCJvblVzZXJuYW1lQ2hhbmdlZCIsIm9uVXNlcm5hbWVCbHVyIiwib25Mb2dpblR5cGVDaGFuZ2UiLCJvblBob25lQ291bnRyeUNoYW5nZWQiLCJvblBob25lTnVtYmVyQ2hhbmdlZCIsIm9uUGhvbmVOdW1iZXJCbHVyIiwib25QYXNzd29yZENoYW5nZWQiLCJpc0xvZ2luRW1wdHkiLCJldiIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwiZXJyb3IiLCJMT0dJTl9GSUVMRF9FTUFJTCIsIkxPR0lOX0ZJRUxEX1BIT05FIiwib25FcnJvciIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJ0YXJnZXQiLCJ2YWx1ZSIsImNvdW50cnkiLCJpc28yIiwicGhvbmVQcmVmaXgiLCJwcmVmaXgiLCJyZW5kZXJMb2dpbkZpZWxkIiwiYXV0b0ZvY3VzIiwiRmllbGQiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjbGFzc2VzIiwibG9naW5JbmNvcnJlY3QiLCJkaXNhYmxlU3VibWl0IiwiQ291bnRyeURyb3Bkb3duIiwicmVuZGVyIiwiU2lnbkluVG9UZXh0IiwiZm9yZ290UGFzc3dvcmRKc3giLCJhIiwic3ViIiwiYnVzeSIsInB3RmllbGRDbGFzcyIsImF1dG9Gb2N1c1Bhc3N3b3JkIiwibG9naW5GaWVsZCIsIlNka0NvbmZpZyIsImdldCIsImRpc2FibGVfM3BpZF9sb2dpbiIsInNlcnZlckNvbmZpZyIsIm9uRWRpdFNlcnZlckRldGFpbHNDbGljayIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiYm9vbCIsImluc3RhbmNlT2YiLCJWYWxpZGF0ZWRTZXJ2ZXJDb25maWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBekJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQkE7OztBQUdlLE1BQU1BLGFBQU4sU0FBNEJDLGVBQU1DLFNBQWxDLENBQTRDO0FBeUN2REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBQ0EsU0FBS0MsS0FBTCxHQUFhO0FBQ1RDLE1BQUFBLFFBQVEsRUFBRSxLQUFLRixLQUFMLENBQVdHLGVBRFo7QUFFVEMsTUFBQUEsUUFBUSxFQUFFLEtBQUtKLEtBQUwsQ0FBV0ssZUFGWjtBQUdUQyxNQUFBQSxZQUFZLEVBQUUsS0FBS04sS0FBTCxDQUFXTyxtQkFIaEI7QUFJVEMsTUFBQUEsV0FBVyxFQUFFLEtBQUtSLEtBQUwsQ0FBV1Msa0JBSmY7QUFLVEMsTUFBQUEsU0FBUyxFQUFFZCxhQUFhLENBQUNlO0FBTGhCLEtBQWI7QUFRQSxTQUFLQyxxQkFBTCxHQUE2QixLQUFLQSxxQkFBTCxDQUEyQkMsSUFBM0IsQ0FBZ0MsSUFBaEMsQ0FBN0I7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLEtBQUtBLFlBQUwsQ0FBa0JELElBQWxCLENBQXVCLElBQXZCLENBQXBCO0FBQ0EsU0FBS0UsaUJBQUwsR0FBeUIsS0FBS0EsaUJBQUwsQ0FBdUJGLElBQXZCLENBQTRCLElBQTVCLENBQXpCO0FBQ0EsU0FBS0csY0FBTCxHQUFzQixLQUFLQSxjQUFMLENBQW9CSCxJQUFwQixDQUF5QixJQUF6QixDQUF0QjtB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bEJJLEVBQUFBLG1CQUFtQixFQUFFLEVBVkg7QUFXbEJFLEVBQUFBLGtCQUFrQixFQUFFLEVBWEY7QUFZbEJKLEVBQUFBLGVBQWUsRUFBRSxFQVpDO0FBYWxCdUMsRUFBQUEsY0FBYyxFQUFFLEtBYkU7QUFjbEJDLEVBQUFBLGFBQWEsRUFBRTtBQWRHLEM7OEJBcEJMakQsYSx1QkFxQ1UsbUI7OEJBckNWQSxhLHNCQXNDUyxrQjs4QkF0Q1RBLGEsdUJBdUNVLG1CIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gJy4uLy4uLy4uL1Nka0NvbmZpZyc7XG5pbXBvcnQge1ZhbGlkYXRlZFNlcnZlckNvbmZpZ30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0F1dG9EaXNjb3ZlcnlVdGlsc1wiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcblxuLyoqXG4gKiBBIHB1cmUgVUkgY29tcG9uZW50IHdoaWNoIGRpc3BsYXlzIGEgdXNlcm5hbWUvcGFzc3dvcmQgZm9ybS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFzc3dvcmRMb2dpbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25TdWJtaXQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsIC8vIGZuKHVzZXJuYW1lLCBwYXNzd29yZClcbiAgICAgICAgb25FcnJvcjogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uRWRpdFNlcnZlckRldGFpbHNDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uRm9yZ290UGFzc3dvcmRDbGljazogUHJvcFR5cGVzLmZ1bmMsIC8vIGZuKClcbiAgICAgICAgaW5pdGlhbFVzZXJuYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBpbml0aWFsUGhvbmVDb3VudHJ5OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBpbml0aWFsUGhvbmVOdW1iZXI6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGluaXRpYWxQYXNzd29yZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgb25Vc2VybmFtZUNoYW5nZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvblBob25lQ291bnRyeUNoYW5nZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvblBob25lTnVtYmVyQ2hhbmdlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uUGFzc3dvcmRDaGFuZ2VkOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgbG9naW5JbmNvcnJlY3Q6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBkaXNhYmxlU3VibWl0OiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgc2VydmVyQ29uZmlnOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihWYWxpZGF0ZWRTZXJ2ZXJDb25maWcpLmlzUmVxdWlyZWQsXG4gICAgICAgIGJ1c3k6IFByb3BUeXBlcy5ib29sLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBvbkVycm9yOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2s6IG51bGwsXG4gICAgICAgIG9uVXNlcm5hbWVDaGFuZ2VkOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBvblVzZXJuYW1lQmx1cjogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgb25QYXNzd29yZENoYW5nZWQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIG9uUGhvbmVDb3VudHJ5Q2hhbmdlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgb25QaG9uZU51bWJlckNoYW5nZWQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIG9uUGhvbmVOdW1iZXJCbHVyOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBpbml0aWFsVXNlcm5hbWU6IFwiXCIsXG4gICAgICAgIGluaXRpYWxQaG9uZUNvdW50cnk6IFwiXCIsXG4gICAgICAgIGluaXRpYWxQaG9uZU51bWJlcjogXCJcIixcbiAgICAgICAgaW5pdGlhbFBhc3N3b3JkOiBcIlwiLFxuICAgICAgICBsb2dpbkluY29ycmVjdDogZmFsc2UsXG4gICAgICAgIGRpc2FibGVTdWJtaXQ6IGZhbHNlLFxuICAgIH07XG5cbiAgICBzdGF0aWMgTE9HSU5fRklFTERfRU1BSUwgPSBcImxvZ2luX2ZpZWxkX2VtYWlsXCI7XG4gICAgc3RhdGljIExPR0lOX0ZJRUxEX01YSUQgPSBcImxvZ2luX2ZpZWxkX214aWRcIjtcbiAgICBzdGF0aWMgTE9HSU5fRklFTERfUEhPTkUgPSBcImxvZ2luX2ZpZWxkX3Bob25lXCI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogdGhpcy5wcm9wcy5pbml0aWFsVXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZDogdGhpcy5wcm9wcy5pbml0aWFsUGFzc3dvcmQsXG4gICAgICAgICAgICBwaG9uZUNvdW50cnk6IHRoaXMucHJvcHMuaW5pdGlhbFBob25lQ291bnRyeSxcbiAgICAgICAgICAgIHBob25lTnVtYmVyOiB0aGlzLnByb3BzLmluaXRpYWxQaG9uZU51bWJlcixcbiAgICAgICAgICAgIGxvZ2luVHlwZTogUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9NWElELFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25Gb3Jnb3RQYXNzd29yZENsaWNrID0gdGhpcy5vbkZvcmdvdFBhc3N3b3JkQ2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vblN1Ym1pdEZvcm0gPSB0aGlzLm9uU3VibWl0Rm9ybS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uVXNlcm5hbWVDaGFuZ2VkID0gdGhpcy5vblVzZXJuYW1lQ2hhbmdlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uVXNlcm5hbWVCbHVyID0gdGhpcy5vblVzZXJuYW1lQmx1ci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uTG9naW5UeXBlQ2hhbmdlID0gdGhpcy5vbkxvZ2luVHlwZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uUGhvbmVDb3VudHJ5Q2hhbmdlZCA9IHRoaXMub25QaG9uZUNvdW50cnlDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25QaG9uZU51bWJlckNoYW5nZWQgPSB0aGlzLm9uUGhvbmVOdW1iZXJDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25QaG9uZU51bWJlckJsdXIgPSB0aGlzLm9uUGhvbmVOdW1iZXJCbHVyLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25QYXNzd29yZENoYW5nZWQgPSB0aGlzLm9uUGFzc3dvcmRDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuaXNMb2dpbkVtcHR5ID0gdGhpcy5pc0xvZ2luRW1wdHkuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkZvcmdvdFBhc3N3b3JkQ2xpY2soZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMucHJvcHMub25Gb3Jnb3RQYXNzd29yZENsaWNrKCk7XG4gICAgfVxuXG4gICAgb25TdWJtaXRGb3JtKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0IHVzZXJuYW1lID0gJyc7IC8vIFhYWDogU3luYXBzZSBicmVha3MgaWYgeW91IHNlbmQgbnVsbCBoZXJlOlxuICAgICAgICBsZXQgcGhvbmVDb3VudHJ5ID0gbnVsbDtcbiAgICAgICAgbGV0IHBob25lTnVtYmVyID0gbnVsbDtcbiAgICAgICAgbGV0IGVycm9yO1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5sb2dpblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9FTUFJTDpcbiAgICAgICAgICAgICAgICB1c2VybmFtZSA9IHRoaXMuc3RhdGUudXNlcm5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IF90KCdUaGUgZW1haWwgZmllbGQgbXVzdCBub3QgYmUgYmxhbmsuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYXNzd29yZExvZ2luLkxPR0lOX0ZJRUxEX01YSUQ6XG4gICAgICAgICAgICAgICAgdXNlcm5hbWUgPSB0aGlzLnN0YXRlLnVzZXJuYW1lO1xuICAgICAgICAgICAgICAgIGlmICghdXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBfdCgnVGhlIHVzZXJuYW1lIGZpZWxkIG11c3Qgbm90IGJlIGJsYW5rLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9QSE9ORTpcbiAgICAgICAgICAgICAgICBwaG9uZUNvdW50cnkgPSB0aGlzLnN0YXRlLnBob25lQ291bnRyeTtcbiAgICAgICAgICAgICAgICBwaG9uZU51bWJlciA9IHRoaXMuc3RhdGUucGhvbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgaWYgKCFwaG9uZU51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IF90KCdUaGUgcGhvbmUgbnVtYmVyIGZpZWxkIG11c3Qgbm90IGJlIGJsYW5rLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5wYXNzd29yZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkVycm9yKF90KCdUaGUgcGFzc3dvcmQgZmllbGQgbXVzdCBub3QgYmUgYmxhbmsuJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wcm9wcy5vblN1Ym1pdChcbiAgICAgICAgICAgIHVzZXJuYW1lLFxuICAgICAgICAgICAgcGhvbmVDb3VudHJ5LFxuICAgICAgICAgICAgcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnBhc3N3b3JkLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIG9uVXNlcm5hbWVDaGFuZ2VkKGV2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3VzZXJuYW1lOiBldi50YXJnZXQudmFsdWV9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vblVzZXJuYW1lQ2hhbmdlZChldi50YXJnZXQudmFsdWUpO1xuICAgIH1cblxuICAgIG9uVXNlcm5hbWVCbHVyKGV2KSB7XG4gICAgICAgIHRoaXMucHJvcHMub25Vc2VybmFtZUJsdXIoZXYudGFyZ2V0LnZhbHVlKTtcbiAgICB9XG5cbiAgICBvbkxvZ2luVHlwZUNoYW5nZShldikge1xuICAgICAgICBjb25zdCBsb2dpblR5cGUgPSBldi50YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMucHJvcHMub25FcnJvcihudWxsKTsgLy8gc2VuZCBhIG51bGwgZXJyb3IgdG8gY2xlYXIgYW55IGVycm9yIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbG9naW5UeXBlOiBsb2dpblR5cGUsXG4gICAgICAgICAgICB1c2VybmFtZTogXCJcIiwgLy8gUmVzZXQgYmVjYXVzZSBlbWFpbCBhbmQgdXNlcm5hbWUgdXNlIHRoZSBzYW1lIHN0YXRlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uUGhvbmVDb3VudHJ5Q2hhbmdlZChjb3VudHJ5KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhvbmVDb3VudHJ5OiBjb3VudHJ5LmlzbzIsXG4gICAgICAgICAgICBwaG9uZVByZWZpeDogY291bnRyeS5wcmVmaXgsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnByb3BzLm9uUGhvbmVDb3VudHJ5Q2hhbmdlZChjb3VudHJ5LmlzbzIpO1xuICAgIH1cblxuICAgIG9uUGhvbmVOdW1iZXJDaGFuZ2VkKGV2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Bob25lTnVtYmVyOiBldi50YXJnZXQudmFsdWV9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vblBob25lTnVtYmVyQ2hhbmdlZChldi50YXJnZXQudmFsdWUpO1xuICAgIH1cblxuICAgIG9uUGhvbmVOdW1iZXJCbHVyKGV2KSB7XG4gICAgICAgIHRoaXMucHJvcHMub25QaG9uZU51bWJlckJsdXIoZXYudGFyZ2V0LnZhbHVlKTtcbiAgICB9XG5cbiAgICBvblBhc3N3b3JkQ2hhbmdlZChldikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtwYXNzd29yZDogZXYudGFyZ2V0LnZhbHVlfSk7XG4gICAgICAgIHRoaXMucHJvcHMub25QYXNzd29yZENoYW5nZWQoZXYudGFyZ2V0LnZhbHVlKTtcbiAgICB9XG5cbiAgICByZW5kZXJMb2dpbkZpZWxkKGxvZ2luVHlwZSwgYXV0b0ZvY3VzKSB7XG4gICAgICAgIGNvbnN0IEZpZWxkID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRmllbGQnKTtcblxuICAgICAgICBjb25zdCBjbGFzc2VzID0ge307XG5cbiAgICAgICAgc3dpdGNoIChsb2dpblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9FTUFJTDpcbiAgICAgICAgICAgICAgICBjbGFzc2VzLmVycm9yID0gdGhpcy5wcm9wcy5sb2dpbkluY29ycmVjdCAmJiAhdGhpcy5zdGF0ZS51c2VybmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPEZpZWxkXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhjbGFzc2VzKX1cbiAgICAgICAgICAgICAgICAgICAgbmFtZT1cInVzZXJuYW1lXCIgLy8gbWFrZSBpdCBhIGxpdHRsZSBlYXNpZXIgZm9yIGJyb3dzZXIncyByZW1lbWJlci1wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICBrZXk9XCJlbWFpbF9pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiRW1haWxcIil9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiam9lQGV4YW1wbGUuY29tXCJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUudXNlcm5hbWV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uVXNlcm5hbWVDaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25Vc2VybmFtZUJsdXJ9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVTdWJtaXR9XG4gICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17YXV0b0ZvY3VzfVxuICAgICAgICAgICAgICAgIC8+O1xuICAgICAgICAgICAgY2FzZSBQYXNzd29yZExvZ2luLkxPR0lOX0ZJRUxEX01YSUQ6XG4gICAgICAgICAgICAgICAgY2xhc3Nlcy5lcnJvciA9IHRoaXMucHJvcHMubG9naW5JbmNvcnJlY3QgJiYgIXRoaXMuc3RhdGUudXNlcm5hbWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoY2xhc3Nlcyl9XG4gICAgICAgICAgICAgICAgICAgIG5hbWU9XCJ1c2VybmFtZVwiIC8vIG1ha2UgaXQgYSBsaXR0bGUgZWFzaWVyIGZvciBicm93c2VyJ3MgcmVtZW1iZXItcGFzc3dvcmRcbiAgICAgICAgICAgICAgICAgICAga2V5PVwidXNlcm5hbWVfaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIlVzZXJuYW1lXCIpfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS51c2VybmFtZX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25Vc2VybmFtZUNoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vblVzZXJuYW1lQmx1cn1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXthdXRvRm9jdXN9XG4gICAgICAgICAgICAgICAgLz47XG4gICAgICAgICAgICBjYXNlIFBhc3N3b3JkTG9naW4uTE9HSU5fRklFTERfUEhPTkU6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBDb3VudHJ5RHJvcGRvd24gPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5hdXRoLkNvdW50cnlEcm9wZG93bicpO1xuICAgICAgICAgICAgICAgIGNsYXNzZXMuZXJyb3IgPSB0aGlzLnByb3BzLmxvZ2luSW5jb3JyZWN0ICYmICF0aGlzLnN0YXRlLnBob25lTnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGhvbmVDb3VudHJ5ID0gPENvdW50cnlEcm9wZG93blxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5waG9uZUNvdW50cnl9XG4gICAgICAgICAgICAgICAgICAgIGlzU21hbGw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIHNob3dQcmVmaXg9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIG9uT3B0aW9uQ2hhbmdlPXt0aGlzLm9uUGhvbmVDb3VudHJ5Q2hhbmdlZH1cbiAgICAgICAgICAgICAgICAvPjtcblxuICAgICAgICAgICAgICAgIHJldHVybiA8RmllbGRcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKGNsYXNzZXMpfVxuICAgICAgICAgICAgICAgICAgICBuYW1lPVwicGhvbmVOdW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICBrZXk9XCJwaG9uZV9pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KFwiUGhvbmVcIil9XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBob25lTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICBwcmVmaXg9e3Bob25lQ291bnRyeX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25QaG9uZU51bWJlckNoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vblBob25lTnVtYmVyQmx1cn1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXthdXRvRm9jdXN9XG4gICAgICAgICAgICAgICAgLz47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0xvZ2luRW1wdHkoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5sb2dpblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9FTUFJTDpcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9NWElEOlxuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5zdGF0ZS51c2VybmFtZTtcbiAgICAgICAgICAgIGNhc2UgUGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9QSE9ORTpcbiAgICAgICAgICAgICAgICByZXR1cm4gIXRoaXMuc3RhdGUucGhvbmVDb3VudHJ5IHx8ICF0aGlzLnN0YXRlLnBob25lTnVtYmVyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIGNvbnN0IFNpZ25JblRvVGV4dCA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmF1dGguU2lnbkluVG9UZXh0Jyk7XG5cbiAgICAgICAgbGV0IGZvcmdvdFBhc3N3b3JkSnN4O1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRm9yZ290UGFzc3dvcmRDbGljaykge1xuICAgICAgICAgICAgZm9yZ290UGFzc3dvcmRKc3ggPSA8c3Bhbj5cbiAgICAgICAgICAgICAgICB7X3QoJ05vdCBzdXJlIG9mIHlvdXIgcGFzc3dvcmQ/IDxhPlNldCBhIG5ldyBvbmU8L2E+Jywge30sIHtcbiAgICAgICAgICAgICAgICAgICAgYTogc3ViID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTG9naW5fZm9yZ290XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5wcm9wcy5idXN5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ9XCJsaW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uRm9yZ290UGFzc3dvcmRDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3VifVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9zcGFuPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHB3RmllbGRDbGFzcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgZXJyb3I6IHRoaXMucHJvcHMubG9naW5JbmNvcnJlY3QgJiYgIXRoaXMuaXNMb2dpbkVtcHR5KCksIC8vIG9ubHkgZXJyb3IgcGFzc3dvcmQgaWYgZXJyb3IgaXNuJ3QgdG9wIGZpZWxkXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIElmIGxvZ2luIGlzIGVtcHR5LCBhdXRvRm9jdXMgbG9naW4sIG90aGVyd2lzZSBhdXRvRm9jdXMgcGFzc3dvcmQuXG4gICAgICAgIC8vIHRoaXMgaXMgZm9yIHdoZW4gYXV0byBzZXJ2ZXIgZGlzY292ZXJ5IHJlbW91bnRzIHVzIHdoZW4gdGhlIHVzZXIgdHJpZXMgdG8gdGFiIGZyb20gdXNlcm5hbWUgdG8gcGFzc3dvcmRcbiAgICAgICAgY29uc3QgYXV0b0ZvY3VzUGFzc3dvcmQgPSAhdGhpcy5pc0xvZ2luRW1wdHkoKTtcbiAgICAgICAgY29uc3QgbG9naW5GaWVsZCA9IHRoaXMucmVuZGVyTG9naW5GaWVsZCh0aGlzLnN0YXRlLmxvZ2luVHlwZSwgIWF1dG9Gb2N1c1Bhc3N3b3JkKTtcblxuICAgICAgICBsZXQgbG9naW5UeXBlO1xuICAgICAgICBpZiAoIVNka0NvbmZpZy5nZXQoKS5kaXNhYmxlXzNwaWRfbG9naW4pIHtcbiAgICAgICAgICAgIGxvZ2luVHlwZSA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0xvZ2luX3R5cGVfY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJteF9Mb2dpbl90eXBlX2xhYmVsXCI+eyBfdCgnU2lnbiBpbiB3aXRoJykgfTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudD1cInNlbGVjdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5sb2dpblR5cGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbkxvZ2luVHlwZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVTdWJtaXR9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e1Bhc3N3b3JkTG9naW4uTE9HSU5fRklFTERfTVhJRH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17UGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9NWElEfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdCgnVXNlcm5hbWUnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17UGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9FTUFJTH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17UGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9FTUFJTH1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoJ0VtYWlsIGFkZHJlc3MnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17UGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9QSE9ORX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17UGFzc3dvcmRMb2dpbi5MT0dJTl9GSUVMRF9QSE9ORX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoJ1Bob25lJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9GaWVsZD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8U2lnbkluVG9UZXh0IHNlcnZlckNvbmZpZz17dGhpcy5wcm9wcy5zZXJ2ZXJDb25maWd9XG4gICAgICAgICAgICAgICAgICAgIG9uRWRpdFNlcnZlckRldGFpbHNDbGljaz17dGhpcy5wcm9wcy5vbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2t9IC8+XG4gICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMub25TdWJtaXRGb3JtfT5cbiAgICAgICAgICAgICAgICAgICAge2xvZ2luVHlwZX1cbiAgICAgICAgICAgICAgICAgICAge2xvZ2luRmllbGR9XG4gICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtwd0ZpZWxkQ2xhc3N9XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdCgnUGFzc3dvcmQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnBhc3N3b3JkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25QYXNzd29yZENoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5wcm9wcy5kaXNhYmxlU3VibWl0fVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXthdXRvRm9jdXNQYXNzd29yZH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAge2ZvcmdvdFBhc3N3b3JkSnN4fVxuICAgICAgICAgICAgICAgICAgICB7ICF0aGlzLnByb3BzLmJ1c3kgJiYgPGlucHV0IGNsYXNzTmFtZT1cIm14X0xvZ2luX3N1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtfdCgnU2lnbiBpbicpfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgICAgICAgLz4gfVxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==