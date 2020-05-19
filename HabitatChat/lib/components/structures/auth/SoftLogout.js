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

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var Lifecycle = _interopRequireWildcard(require("../../../Lifecycle"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Login = require("../../../Login");

var _AuthPage = _interopRequireDefault(require("../../views/auth/AuthPage"));

var _SSOButton = _interopRequireDefault(require("../../views/elements/SSOButton"));

/*
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
const LOGIN_VIEW = {
  LOADING: 1,
  PASSWORD: 2,
  CAS: 3,
  // SSO, but old
  SSO: 4,
  UNSUPPORTED: 5
};
const FLOWS_TO_VIEWS = {
  "m.login.password": LOGIN_VIEW.PASSWORD,
  "m.login.cas": LOGIN_VIEW.CAS,
  "m.login.sso": LOGIN_VIEW.SSO
};

class SoftLogout extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onClearAll", () => {
      const ConfirmWipeDeviceDialog = sdk.getComponent('dialogs.ConfirmWipeDeviceDialog');

      _Modal.default.createTrackedDialog('Clear Data', 'Soft Logout', ConfirmWipeDeviceDialog, {
        onFinished: wipeData => {
          if (!wipeData) return;
          console.log("Clearing data from soft-logged-out session");
          Lifecycle.logout();
        }
      });
    });
    (0, _defineProperty2.default)(this, "onPasswordChange", ev => {
      this.setState({
        password: ev.target.value
      });
    });
    (0, _defineProperty2.default)(this, "onForgotPassword", () => {
      _dispatcher.default.dispatch({
        action: 'start_password_recovery'
      });
    });
    (0, _defineProperty2.default)(this, "onPasswordLogin", async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      this.setState({
        busy: true
      });

      const hsUrl = _MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl();

      const isUrl = _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl();

      const loginType = "m.login.password";
      const loginParams = {
        identifier: {
          type: "m.id.user",
          user: _MatrixClientPeg.MatrixClientPeg.get().getUserId()
        },
        password: this.state.password,
        device_id: _MatrixClientPeg.MatrixClientPeg.get().getDeviceId()
      };
      let credentials = null;

      try {
        credentials = await (0, _Login.sendLoginRequest)(hsUrl, isUrl, loginType, loginParams);
      } catch (e) {
        let errorText = (0, _languageHandler._t)("Failed to re-authenticate due to a homeserver problem");

        if (e.errcode === "M_FORBIDDEN" && (e.httpStatus === 401 || e.httpStatus === 403)) {
          errorText = (0, _languageHandler._t)("Incorrect password");
        }

        this.setState({
          busy: false,
          errorText: errorText
        });
        return;
      }

      Lifecycle.hydrateSession(credentials).catch(e => {
        console.error(e);
        this.setState({
          busy: false,
          errorText: (0, _languageHandler._t)("Failed to re-authenticate")
        });
      });
    });
    this.state = {
      loginView: LOGIN_VIEW.LOADING,
      keyBackupNeeded: true,
      // assume we do while we figure it out (see componentDidMount)
      busy: false,
      password: "",
      errorText: ""
    };
  }

  componentDidMount()
  /*: void*/
  {
    // We've ended up here when we don't need to - navigate to login
    if (!Lifecycle.isSoftLogout()) {
      _dispatcher.default.dispatch({
        action: "start_login"
      });

      return;
    }

    this._initLogin();

    _MatrixClientPeg.MatrixClientPeg.get().flagAllGroupSessionsForBackup().then(remaining => {
      this.setState({
        keyBackupNeeded: remaining > 0
      });
    });
  }

  async _initLogin() {
    const queryParams = this.props.realQueryParams;
    const hasAllParams = queryParams && queryParams['homeserver'] && queryParams['loginToken'];

    if (hasAllParams) {
      this.setState({
        loginView: LOGIN_VIEW.LOADING
      });
      this.trySsoLogin();
      return;
    } // Note: we don't use the existing Login class because it is heavily flow-based. We don't
    // care about login flows here, unless it is the single flow we support.


    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const loginViews = (await client.loginFlows()).flows.map(f => FLOWS_TO_VIEWS[f.type]);
    const chosenView = loginViews.filter(f => !!f)[0] || LOGIN_VIEW.UNSUPPORTED;
    this.setState({
      loginView: chosenView
    });
  }

  async trySsoLogin() {
    this.setState({
      busy: true
    });
    const hsUrl = this.props.realQueryParams['homeserver'];

    const isUrl = this.props.realQueryParams['identityServer'] || _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl();

    const loginType = "m.login.token";
    const loginParams = {
      token: this.props.realQueryParams['loginToken'],
      device_id: _MatrixClientPeg.MatrixClientPeg.get().getDeviceId()
    };
    let credentials = null;

    try {
      credentials = await (0, _Login.sendLoginRequest)(hsUrl, isUrl, loginType, loginParams);
    } catch (e) {
      console.error(e);
      this.setState({
        busy: false,
        loginView: LOGIN_VIEW.UNSUPPORTED
      });
      return;
    }

    Lifecycle.hydrateSession(credentials).then(() => {
      if (this.props.onTokenLoginCompleted) this.props.onTokenLoginCompleted();
    }).catch(e => {
      console.error(e);
      this.setState({
        busy: false,
        loginView: LOGIN_VIEW.UNSUPPORTED
      });
    });
  }

  _renderSignInSection() {
    if (this.state.loginView === LOGIN_VIEW.LOADING) {
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    }

    let introText = null; // null is translated to something area specific in this function

    if (this.state.keyBackupNeeded) {
      introText = (0, _languageHandler._t)("Regain access to your account and recover encryption keys stored in this session. " + "Without them, you won’t be able to read all of your secure messages in any session.");
    }

    if (this.state.loginView === LOGIN_VIEW.PASSWORD) {
      const Field = sdk.getComponent("elements.Field");
      const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
      let error = null;

      if (this.state.errorText) {
        error = /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_Login_error"
        }, this.state.errorText);
      }

      if (!introText) {
        introText = (0, _languageHandler._t)("Enter your password to sign in and regain access to your account.");
      } // else we already have a message and should use it (key backup warning)


      return /*#__PURE__*/_react.default.createElement("form", {
        onSubmit: this.onPasswordLogin
      }, /*#__PURE__*/_react.default.createElement("p", null, introText), error, /*#__PURE__*/_react.default.createElement(Field, {
        type: "password",
        label: (0, _languageHandler._t)("Password"),
        onChange: this.onPasswordChange,
        value: this.state.password,
        disabled: this.state.busy
      }), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this.onPasswordLogin,
        kind: "primary",
        type: "submit",
        disabled: this.state.busy
      }, (0, _languageHandler._t)("Sign In")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this.onForgotPassword,
        kind: "link"
      }, (0, _languageHandler._t)("Forgotten your password?")));
    }

    if (this.state.loginView === LOGIN_VIEW.SSO || this.state.loginView === LOGIN_VIEW.CAS) {
      if (!introText) {
        introText = (0, _languageHandler._t)("Sign in and regain access to your account.");
      } // else we already have a message and should use it (key backup warning)


      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, introText), /*#__PURE__*/_react.default.createElement(_SSOButton.default, {
        matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
        loginType: this.state.loginView === LOGIN_VIEW.CAS ? "cas" : "sso",
        fragmentAfterLogin: this.props.fragmentAfterLogin
      }));
    } // Default: assume unsupported/error


    return /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You cannot sign in to your account. Please contact your " + "homeserver admin for more information."));
  }

  render() {
    const AuthHeader = sdk.getComponent("auth.AuthHeader");
    const AuthBody = sdk.getComponent("auth.AuthBody");
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement(_AuthPage.default, null, /*#__PURE__*/_react.default.createElement(AuthHeader, null), /*#__PURE__*/_react.default.createElement(AuthBody, null, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("You're signed out")), /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Sign in")), /*#__PURE__*/_react.default.createElement("div", null, this._renderSignInSection()), /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Clear personal data")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Warning: Your personal data (including encryption keys) is still stored " + "in this session. Clear it if you're finished using this session, or want to sign " + "in to another account.")), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      onClick: this.onClearAll,
      kind: "danger"
    }, (0, _languageHandler._t)("Clear all data")))));
  }

}

exports.default = SoftLogout;
(0, _defineProperty2.default)(SoftLogout, "propTypes", {
  // Query parameters from MatrixChat
  realQueryParams: _propTypes.default.object,
  // {homeserver, identityServer, loginToken}
  // Called when the SSO login completes
  onTokenLoginCompleted: _propTypes.default.func
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9Tb2Z0TG9nb3V0LmpzIl0sIm5hbWVzIjpbIkxPR0lOX1ZJRVciLCJMT0FESU5HIiwiUEFTU1dPUkQiLCJDQVMiLCJTU08iLCJVTlNVUFBPUlRFRCIsIkZMT1dTX1RPX1ZJRVdTIiwiU29mdExvZ291dCIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJDb25maXJtV2lwZURldmljZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsIm9uRmluaXNoZWQiLCJ3aXBlRGF0YSIsImNvbnNvbGUiLCJsb2ciLCJMaWZlY3ljbGUiLCJsb2dvdXQiLCJldiIsInNldFN0YXRlIiwicGFzc3dvcmQiLCJ0YXJnZXQiLCJ2YWx1ZSIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJidXN5IiwiaHNVcmwiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRIb21lc2VydmVyVXJsIiwiaXNVcmwiLCJnZXRJZGVudGl0eVNlcnZlclVybCIsImxvZ2luVHlwZSIsImxvZ2luUGFyYW1zIiwiaWRlbnRpZmllciIsInR5cGUiLCJ1c2VyIiwiZ2V0VXNlcklkIiwic3RhdGUiLCJkZXZpY2VfaWQiLCJnZXREZXZpY2VJZCIsImNyZWRlbnRpYWxzIiwiZSIsImVycm9yVGV4dCIsImVycmNvZGUiLCJodHRwU3RhdHVzIiwiaHlkcmF0ZVNlc3Npb24iLCJjYXRjaCIsImVycm9yIiwibG9naW5WaWV3Iiwia2V5QmFja3VwTmVlZGVkIiwiY29tcG9uZW50RGlkTW91bnQiLCJpc1NvZnRMb2dvdXQiLCJfaW5pdExvZ2luIiwiZmxhZ0FsbEdyb3VwU2Vzc2lvbnNGb3JCYWNrdXAiLCJ0aGVuIiwicmVtYWluaW5nIiwicXVlcnlQYXJhbXMiLCJwcm9wcyIsInJlYWxRdWVyeVBhcmFtcyIsImhhc0FsbFBhcmFtcyIsInRyeVNzb0xvZ2luIiwiY2xpZW50IiwibG9naW5WaWV3cyIsImxvZ2luRmxvd3MiLCJmbG93cyIsIm1hcCIsImYiLCJjaG9zZW5WaWV3IiwiZmlsdGVyIiwidG9rZW4iLCJvblRva2VuTG9naW5Db21wbGV0ZWQiLCJfcmVuZGVyU2lnbkluU2VjdGlvbiIsIlNwaW5uZXIiLCJpbnRyb1RleHQiLCJGaWVsZCIsIkFjY2Vzc2libGVCdXR0b24iLCJvblBhc3N3b3JkTG9naW4iLCJvblBhc3N3b3JkQ2hhbmdlIiwib25Gb3Jnb3RQYXNzd29yZCIsImZyYWdtZW50QWZ0ZXJMb2dpbiIsInJlbmRlciIsIkF1dGhIZWFkZXIiLCJBdXRoQm9keSIsIm9uQ2xlYXJBbGwiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTFCQTs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLE1BQU1BLFVBQVUsR0FBRztBQUNmQyxFQUFBQSxPQUFPLEVBQUUsQ0FETTtBQUVmQyxFQUFBQSxRQUFRLEVBQUUsQ0FGSztBQUdmQyxFQUFBQSxHQUFHLEVBQUUsQ0FIVTtBQUdQO0FBQ1JDLEVBQUFBLEdBQUcsRUFBRSxDQUpVO0FBS2ZDLEVBQUFBLFdBQVcsRUFBRTtBQUxFLENBQW5CO0FBUUEsTUFBTUMsY0FBYyxHQUFHO0FBQ25CLHNCQUFvQk4sVUFBVSxDQUFDRSxRQURaO0FBRW5CLGlCQUFlRixVQUFVLENBQUNHLEdBRlA7QUFHbkIsaUJBQWVILFVBQVUsQ0FBQ0k7QUFIUCxDQUF2Qjs7QUFNZSxNQUFNRyxVQUFOLFNBQXlCQyxlQUFNQyxTQUEvQixDQUF5QztBQVNwREMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSxzREEyQkQsTUFBTTtBQUNmLFlBQU1DLHVCQUF1QixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsaUNBQWpCLENB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QUNBZixFQUFBQSxxQkFBcUIsRUFBRWMsbUJBQVVFO0FBTGxCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0ICogYXMgTGlmZWN5Y2xlIGZyb20gJy4uLy4uLy4uL0xpZmVjeWNsZSc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCB7c2VuZExvZ2luUmVxdWVzdH0gZnJvbSBcIi4uLy4uLy4uL0xvZ2luXCI7XG5pbXBvcnQgQXV0aFBhZ2UgZnJvbSBcIi4uLy4uL3ZpZXdzL2F1dGgvQXV0aFBhZ2VcIjtcbmltcG9ydCBTU09CdXR0b24gZnJvbSBcIi4uLy4uL3ZpZXdzL2VsZW1lbnRzL1NTT0J1dHRvblwiO1xuXG5jb25zdCBMT0dJTl9WSUVXID0ge1xuICAgIExPQURJTkc6IDEsXG4gICAgUEFTU1dPUkQ6IDIsXG4gICAgQ0FTOiAzLCAvLyBTU08sIGJ1dCBvbGRcbiAgICBTU086IDQsXG4gICAgVU5TVVBQT1JURUQ6IDUsXG59O1xuXG5jb25zdCBGTE9XU19UT19WSUVXUyA9IHtcbiAgICBcIm0ubG9naW4ucGFzc3dvcmRcIjogTE9HSU5fVklFVy5QQVNTV09SRCxcbiAgICBcIm0ubG9naW4uY2FzXCI6IExPR0lOX1ZJRVcuQ0FTLFxuICAgIFwibS5sb2dpbi5zc29cIjogTE9HSU5fVklFVy5TU08sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTb2Z0TG9nb3V0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBRdWVyeSBwYXJhbWV0ZXJzIGZyb20gTWF0cml4Q2hhdFxuICAgICAgICByZWFsUXVlcnlQYXJhbXM6IFByb3BUeXBlcy5vYmplY3QsIC8vIHtob21lc2VydmVyLCBpZGVudGl0eVNlcnZlciwgbG9naW5Ub2tlbn1cblxuICAgICAgICAvLyBDYWxsZWQgd2hlbiB0aGUgU1NPIGxvZ2luIGNvbXBsZXRlc1xuICAgICAgICBvblRva2VuTG9naW5Db21wbGV0ZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbG9naW5WaWV3OiBMT0dJTl9WSUVXLkxPQURJTkcsXG4gICAgICAgICAgICBrZXlCYWNrdXBOZWVkZWQ6IHRydWUsIC8vIGFzc3VtZSB3ZSBkbyB3aGlsZSB3ZSBmaWd1cmUgaXQgb3V0IChzZWUgY29tcG9uZW50RGlkTW91bnQpXG5cbiAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IFwiXCIsXG4gICAgICAgICAgICBlcnJvclRleHQ6IFwiXCIsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKTogdm9pZCB7XG4gICAgICAgIC8vIFdlJ3ZlIGVuZGVkIHVwIGhlcmUgd2hlbiB3ZSBkb24ndCBuZWVkIHRvIC0gbmF2aWdhdGUgdG8gbG9naW5cbiAgICAgICAgaWYgKCFMaWZlY3ljbGUuaXNTb2Z0TG9nb3V0KCkpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiBcInN0YXJ0X2xvZ2luXCJ9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXRMb2dpbigpO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5mbGFnQWxsR3JvdXBTZXNzaW9uc0ZvckJhY2t1cCgpLnRoZW4ocmVtYWluaW5nID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2tleUJhY2t1cE5lZWRlZDogcmVtYWluaW5nID4gMH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkNsZWFyQWxsID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBDb25maXJtV2lwZURldmljZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuQ29uZmlybVdpcGVEZXZpY2VEaWFsb2cnKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ2xlYXIgRGF0YScsICdTb2Z0IExvZ291dCcsIENvbmZpcm1XaXBlRGV2aWNlRGlhbG9nLCB7XG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAod2lwZURhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpcGVEYXRhKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNsZWFyaW5nIGRhdGEgZnJvbSBzb2Z0LWxvZ2dlZC1vdXQgc2Vzc2lvblwiKTtcbiAgICAgICAgICAgICAgICBMaWZlY3ljbGUubG9nb3V0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMgX2luaXRMb2dpbigpIHtcbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSB0aGlzLnByb3BzLnJlYWxRdWVyeVBhcmFtcztcbiAgICAgICAgY29uc3QgaGFzQWxsUGFyYW1zID0gcXVlcnlQYXJhbXMgJiYgcXVlcnlQYXJhbXNbJ2hvbWVzZXJ2ZXInXSAmJiBxdWVyeVBhcmFtc1snbG9naW5Ub2tlbiddO1xuICAgICAgICBpZiAoaGFzQWxsUGFyYW1zKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtsb2dpblZpZXc6IExPR0lOX1ZJRVcuTE9BRElOR30pO1xuICAgICAgICAgICAgdGhpcy50cnlTc29Mb2dpbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90ZTogd2UgZG9uJ3QgdXNlIHRoZSBleGlzdGluZyBMb2dpbiBjbGFzcyBiZWNhdXNlIGl0IGlzIGhlYXZpbHkgZmxvdy1iYXNlZC4gV2UgZG9uJ3RcbiAgICAgICAgLy8gY2FyZSBhYm91dCBsb2dpbiBmbG93cyBoZXJlLCB1bmxlc3MgaXQgaXMgdGhlIHNpbmdsZSBmbG93IHdlIHN1cHBvcnQuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgbG9naW5WaWV3cyA9IChhd2FpdCBjbGllbnQubG9naW5GbG93cygpKS5mbG93cy5tYXAoZiA9PiBGTE9XU19UT19WSUVXU1tmLnR5cGVdKTtcblxuICAgICAgICBjb25zdCBjaG9zZW5WaWV3ID0gbG9naW5WaWV3cy5maWx0ZXIoZiA9PiAhIWYpWzBdIHx8IExPR0lOX1ZJRVcuVU5TVVBQT1JURUQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvZ2luVmlldzogY2hvc2VuVmlld30pO1xuICAgIH1cblxuICAgIG9uUGFzc3dvcmRDaGFuZ2UgPSAoZXYpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGFzc3dvcmQ6IGV2LnRhcmdldC52YWx1ZX0pO1xuICAgIH07XG5cbiAgICBvbkZvcmdvdFBhc3N3b3JkID0gKCkgPT4ge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3N0YXJ0X3Bhc3N3b3JkX3JlY292ZXJ5J30pO1xuICAgIH07XG5cbiAgICBvblBhc3N3b3JkTG9naW4gPSBhc3luYyAoZXYpID0+IHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogdHJ1ZX0pO1xuXG4gICAgICAgIGNvbnN0IGhzVXJsID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEhvbWVzZXJ2ZXJVcmwoKTtcbiAgICAgICAgY29uc3QgaXNVcmwgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKTtcbiAgICAgICAgY29uc3QgbG9naW5UeXBlID0gXCJtLmxvZ2luLnBhc3N3b3JkXCI7XG4gICAgICAgIGNvbnN0IGxvZ2luUGFyYW1zID0ge1xuICAgICAgICAgICAgaWRlbnRpZmllcjoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwibS5pZC51c2VyXCIsXG4gICAgICAgICAgICAgICAgdXNlcjogTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZCgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB0aGlzLnN0YXRlLnBhc3N3b3JkLFxuICAgICAgICAgICAgZGV2aWNlX2lkOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0RGV2aWNlSWQoKSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY3JlZGVudGlhbHMgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY3JlZGVudGlhbHMgPSBhd2FpdCBzZW5kTG9naW5SZXF1ZXN0KGhzVXJsLCBpc1VybCwgbG9naW5UeXBlLCBsb2dpblBhcmFtcyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxldCBlcnJvclRleHQgPSBfdChcIkZhaWxlZCB0byByZS1hdXRoZW50aWNhdGUgZHVlIHRvIGEgaG9tZXNlcnZlciBwcm9ibGVtXCIpO1xuICAgICAgICAgICAgaWYgKGUuZXJyY29kZSA9PT0gXCJNX0ZPUkJJRERFTlwiICYmIChlLmh0dHBTdGF0dXMgPT09IDQwMSB8fCBlLmh0dHBTdGF0dXMgPT09IDQwMykpIHtcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSBfdChcIkluY29ycmVjdCBwYXNzd29yZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBlcnJvclRleHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIExpZmVjeWNsZS5oeWRyYXRlU2Vzc2lvbihjcmVkZW50aWFscykuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiBmYWxzZSwgZXJyb3JUZXh0OiBfdChcIkZhaWxlZCB0byByZS1hdXRoZW50aWNhdGVcIil9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jIHRyeVNzb0xvZ2luKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiB0cnVlfSk7XG5cbiAgICAgICAgY29uc3QgaHNVcmwgPSB0aGlzLnByb3BzLnJlYWxRdWVyeVBhcmFtc1snaG9tZXNlcnZlciddO1xuICAgICAgICBjb25zdCBpc1VybCA9IHRoaXMucHJvcHMucmVhbFF1ZXJ5UGFyYW1zWydpZGVudGl0eVNlcnZlciddIHx8IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpO1xuICAgICAgICBjb25zdCBsb2dpblR5cGUgPSBcIm0ubG9naW4udG9rZW5cIjtcbiAgICAgICAgY29uc3QgbG9naW5QYXJhbXMgPSB7XG4gICAgICAgICAgICB0b2tlbjogdGhpcy5wcm9wcy5yZWFsUXVlcnlQYXJhbXNbJ2xvZ2luVG9rZW4nXSxcbiAgICAgICAgICAgIGRldmljZV9pZDogTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldERldmljZUlkKCksXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGNyZWRlbnRpYWxzID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNyZWRlbnRpYWxzID0gYXdhaXQgc2VuZExvZ2luUmVxdWVzdChoc1VybCwgaXNVcmwsIGxvZ2luVHlwZSwgbG9naW5QYXJhbXMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogZmFsc2UsIGxvZ2luVmlldzogTE9HSU5fVklFVy5VTlNVUFBPUlRFRH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgTGlmZWN5Y2xlLmh5ZHJhdGVTZXNzaW9uKGNyZWRlbnRpYWxzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm9uVG9rZW5Mb2dpbkNvbXBsZXRlZCkgdGhpcy5wcm9wcy5vblRva2VuTG9naW5Db21wbGV0ZWQoKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiBmYWxzZSwgbG9naW5WaWV3OiBMT0dJTl9WSUVXLlVOU1VQUE9SVEVEfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZW5kZXJTaWduSW5TZWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5sb2dpblZpZXcgPT09IExPR0lOX1ZJRVcuTE9BRElORykge1xuICAgICAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGludHJvVGV4dCA9IG51bGw7IC8vIG51bGwgaXMgdHJhbnNsYXRlZCB0byBzb21ldGhpbmcgYXJlYSBzcGVjaWZpYyBpbiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmtleUJhY2t1cE5lZWRlZCkge1xuICAgICAgICAgICAgaW50cm9UZXh0ID0gX3QoXG4gICAgICAgICAgICAgICAgXCJSZWdhaW4gYWNjZXNzIHRvIHlvdXIgYWNjb3VudCBhbmQgcmVjb3ZlciBlbmNyeXB0aW9uIGtleXMgc3RvcmVkIGluIHRoaXMgc2Vzc2lvbi4gXCIgK1xuICAgICAgICAgICAgICAgIFwiV2l0aG91dCB0aGVtLCB5b3Ugd29u4oCZdCBiZSBhYmxlIHRvIHJlYWQgYWxsIG9mIHlvdXIgc2VjdXJlIG1lc3NhZ2VzIGluIGFueSBzZXNzaW9uLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxvZ2luVmlldyA9PT0gTE9HSU5fVklFVy5QQVNTV09SRCkge1xuICAgICAgICAgICAgY29uc3QgRmllbGQgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuRmllbGRcIik7XG4gICAgICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3JUZXh0KSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSA8c3BhbiBjbGFzc05hbWU9J214X0xvZ2luX2Vycm9yJz57dGhpcy5zdGF0ZS5lcnJvclRleHR9PC9zcGFuPjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpbnRyb1RleHQpIHtcbiAgICAgICAgICAgICAgICBpbnRyb1RleHQgPSBfdChcIkVudGVyIHlvdXIgcGFzc3dvcmQgdG8gc2lnbiBpbiBhbmQgcmVnYWluIGFjY2VzcyB0byB5b3VyIGFjY291bnQuXCIpO1xuICAgICAgICAgICAgfSAvLyBlbHNlIHdlIGFscmVhZHkgaGF2ZSBhIG1lc3NhZ2UgYW5kIHNob3VsZCB1c2UgaXQgKGtleSBiYWNrdXAgd2FybmluZylcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblBhc3N3b3JkTG9naW59PlxuICAgICAgICAgICAgICAgICAgICA8cD57aW50cm9UZXh0fTwvcD5cbiAgICAgICAgICAgICAgICAgICAge2Vycm9yfVxuICAgICAgICAgICAgICAgICAgICA8RmllbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJQYXNzd29yZFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uUGFzc3dvcmRDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5wYXNzd29yZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmJ1c3l9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uUGFzc3dvcmRMb2dpbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuYnVzeX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiU2lnbiBJblwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLm9uRm9yZ290UGFzc3dvcmR9IGtpbmQ9XCJsaW5rXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJGb3Jnb3R0ZW4geW91ciBwYXNzd29yZD9cIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubG9naW5WaWV3ID09PSBMT0dJTl9WSUVXLlNTTyB8fCB0aGlzLnN0YXRlLmxvZ2luVmlldyA9PT0gTE9HSU5fVklFVy5DQVMpIHtcbiAgICAgICAgICAgIGlmICghaW50cm9UZXh0KSB7XG4gICAgICAgICAgICAgICAgaW50cm9UZXh0ID0gX3QoXCJTaWduIGluIGFuZCByZWdhaW4gYWNjZXNzIHRvIHlvdXIgYWNjb3VudC5cIik7XG4gICAgICAgICAgICB9IC8vIGVsc2Ugd2UgYWxyZWFkeSBoYXZlIGEgbWVzc2FnZSBhbmQgc2hvdWxkIHVzZSBpdCAoa2V5IGJhY2t1cCB3YXJuaW5nKVxuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPntpbnRyb1RleHR9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8U1NPQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhDbGllbnQ9e01hdHJpeENsaWVudFBlZy5nZXQoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZT17dGhpcy5zdGF0ZS5sb2dpblZpZXcgPT09IExPR0lOX1ZJRVcuQ0FTID8gXCJjYXNcIiA6IFwic3NvXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEFmdGVyTG9naW49e3RoaXMucHJvcHMuZnJhZ21lbnRBZnRlckxvZ2lufVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlZmF1bHQ6IGFzc3VtZSB1bnN1cHBvcnRlZC9lcnJvclxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICBcIllvdSBjYW5ub3Qgc2lnbiBpbiB0byB5b3VyIGFjY291bnQuIFBsZWFzZSBjb250YWN0IHlvdXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImhvbWVzZXJ2ZXIgYWRtaW4gZm9yIG1vcmUgaW5mb3JtYXRpb24uXCIsXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEF1dGhIZWFkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXV0aC5BdXRoSGVhZGVyXCIpO1xuICAgICAgICBjb25zdCBBdXRoQm9keSA9IHNkay5nZXRDb21wb25lbnQoXCJhdXRoLkF1dGhCb2R5XCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXV0aFBhZ2U+XG4gICAgICAgICAgICAgICAgPEF1dGhIZWFkZXIgLz5cbiAgICAgICAgICAgICAgICA8QXV0aEJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDxoMj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIllvdSdyZSBzaWduZWQgb3V0XCIpfVxuICAgICAgICAgICAgICAgICAgICA8L2gyPlxuXG4gICAgICAgICAgICAgICAgICAgIDxoMz57X3QoXCJTaWduIGluXCIpfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVyU2lnbkluU2VjdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8aDM+e190KFwiQ2xlYXIgcGVyc29uYWwgZGF0YVwiKX08L2gzPlxuICAgICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIldhcm5pbmc6IFlvdXIgcGVyc29uYWwgZGF0YSAoaW5jbHVkaW5nIGVuY3J5cHRpb24ga2V5cykgaXMgc3RpbGwgc3RvcmVkIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluIHRoaXMgc2Vzc2lvbi4gQ2xlYXIgaXQgaWYgeW91J3JlIGZpbmlzaGVkIHVzaW5nIHRoaXMgc2Vzc2lvbiwgb3Igd2FudCB0byBzaWduIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluIHRvIGFub3RoZXIgYWNjb3VudC5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMub25DbGVhckFsbH0ga2luZD1cImRhbmdlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNsZWFyIGFsbCBkYXRhXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0F1dGhCb2R5PlxuICAgICAgICAgICAgPC9BdXRoUGFnZT5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=