"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Login = _interopRequireDefault(require("../../../Login"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _ErrorUtils = require("../../../utils/ErrorUtils");

var _AutoDiscoveryUtils = _interopRequireWildcard(require("../../../utils/AutoDiscoveryUtils"));

var _classnames = _interopRequireDefault(require("classnames"));

var _AuthPage = _interopRequireDefault(require("../../views/auth/AuthPage"));

var _SSOButton = _interopRequireDefault(require("../../views/elements/SSOButton"));

var _PlatformPeg = _interopRequireDefault(require("../../../PlatformPeg"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// For validating phone numbers without country codes
const PHONE_NUMBER_REGEX = /^[0-9()\-\s]*$/; // Phases
// Show controls to configure server details

const PHASE_SERVER_DETAILS = 0; // Show the appropriate login flow(s) for the server

const PHASE_LOGIN = 1; // Enable phases for login

const PHASES_ENABLED = true; // These are used in several places, and come from the js-sdk's autodiscovery
// stuff. We define them here so that they'll be picked up by i18n.

(0, _languageHandler._td)("Invalid homeserver discovery response");
(0, _languageHandler._td)("Failed to get autodiscovery configuration from server");
(0, _languageHandler._td)("Invalid base_url for m.homeserver");
(0, _languageHandler._td)("Homeserver URL does not appear to be a valid Matrix homeserver");
(0, _languageHandler._td)("Invalid identity server discovery response");
(0, _languageHandler._td)("Invalid base_url for m.identity_server");
(0, _languageHandler._td)("Identity server URL does not appear to be a valid identity server");
(0, _languageHandler._td)("General failure");
/**
 * A wire component which glues together login UI components and Login logic
 */

var _default = (0, _createReactClass.default)({
  displayName: 'Login',
  propTypes: {
    // Called when the user has logged in. Params:
    // - The object returned by the login API
    // - The user's password, if applicable, (may be cached in memory for a
    //   short time so the user is not required to re-enter their password
    //   for operations like uploading cross-signing keys).
    onLoggedIn: _propTypes.default.func.isRequired,
    // If true, the component will consider itself busy.
    busy: _propTypes.default.bool,
    // Secondary HS which we try to log into if the user is using
    // the default HS but login fails. Useful for migrating to a
    // different homeserver without confusing users.
    fallbackHsUrl: _propTypes.default.string,
    defaultDeviceDisplayName: _propTypes.default.string,
    // login shouldn't know or care how registration, password recovery,
    // etc is done.
    onRegisterClick: _propTypes.default.func.isRequired,
    onForgotPasswordClick: _propTypes.default.func,
    onServerConfigChange: _propTypes.default.func.isRequired,
    serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
    isSyncing: _propTypes.default.bool
  },
  getInitialState: function () {
    return {
      busy: false,
      busyLoggingIn: null,
      errorText: null,
      loginIncorrect: false,
      canTryLogin: true,
      // can we attempt to log in or are there validation errors?
      // used for preserving form values when changing homeserver
      username: "",
      phoneCountry: null,
      phoneNumber: "",
      // Phase of the overall login dialog.
      phase: PHASE_LOGIN,
      // The current login flow, such as password, SSO, etc.
      currentFlow: null,
      // we need to load the flows from the server
      // We perform liveliness checks later, but for now suppress the errors.
      // We also track the server dead errors independently of the regular errors so
      // that we can render it differently, and override any other error the user may
      // be seeing.
      serverIsAlive: true,
      serverErrorIsFatal: false,
      serverDeadError: ""
    };
  },
  // TODO: [REACT-WARNING] Move this to constructor
  UNSAFE_componentWillMount: function () {
    this._unmounted = false; // map from login step type to a function which will render a control
    // letting you do that login type

    this._stepRendererMap = {
      'm.login.password': this._renderPasswordStep,
      // CAS and SSO are the same thing, modulo the url we link to
      'm.login.cas': () => this._renderSsoStep("cas"),
      'm.login.sso': () => this._renderSsoStep("sso")
    };

    this._initLoginLogic();
  },
  componentWillUnmount: function () {
    this._unmounted = true;
  },

  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.serverConfig.hsUrl === this.props.serverConfig.hsUrl && newProps.serverConfig.isUrl === this.props.serverConfig.isUrl) return; // Ensure that we end up actually logging in to the right place

    this._initLoginLogic(newProps.serverConfig.hsUrl, newProps.serverConfig.isUrl);
  },

  onPasswordLoginError: function (errorText) {
    this.setState({
      errorText,
      loginIncorrect: Boolean(errorText)
    });
  },
  isBusy: function () {
    return this.state.busy || this.props.busy;
  },
  onPasswordLogin: async function (username, phoneCountry, phoneNumber, password) {
    if (!this.state.serverIsAlive) {
      this.setState({
        busy: true
      }); // Do a quick liveliness check on the URLs

      let aliveAgain = true;

      try {
        await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(this.props.serverConfig.hsUrl, this.props.serverConfig.isUrl);
        this.setState({
          serverIsAlive: true,
          errorText: ""
        });
      } catch (e) {
        const componentState = _AutoDiscoveryUtils.default.authComponentStateForError(e);

        this.setState(_objectSpread({
          busy: false,
          busyLoggingIn: false
        }, componentState));
        aliveAgain = !componentState.serverErrorIsFatal;
      } // Prevent people from submitting their password when something isn't right.


      if (!aliveAgain) {
        return;
      }
    }

    this.setState({
      busy: true,
      busyLoggingIn: true,
      errorText: null,
      loginIncorrect: false
    });

    this._loginLogic.loginViaPassword(username, phoneCountry, phoneNumber, password).then(data => {
      this.setState({
        serverIsAlive: true
      }); // it must be, we logged in.

      this.props.onLoggedIn(data, password);
    }, error => {
      if (this._unmounted) {
        return;
      }

      let errorText; // Some error strings only apply for logging in

      const usingEmail = username.indexOf("@") > 0;

      if (error.httpStatus === 400 && usingEmail) {
        errorText = (0, _languageHandler._t)('This homeserver does not support login using email address.');
      } else if (error.errcode === 'M_RESOURCE_LIMIT_EXCEEDED') {
        const errorTop = (0, _ErrorUtils.messageForResourceLimitError)(error.data.limit_type, error.data.admin_contact, {
          'monthly_active_user': (0, _languageHandler._td)("This homeserver has hit its Monthly Active User limit."),
          '': (0, _languageHandler._td)("This homeserver has exceeded one of its resource limits.")
        });
        const errorDetail = (0, _ErrorUtils.messageForResourceLimitError)(error.data.limit_type, error.data.admin_contact, {
          '': (0, _languageHandler._td)("Please <a>contact your service administrator</a> to continue using this service.")
        });
        errorText = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, errorTop), /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_Login_smallError"
        }, errorDetail));
      } else if (error.httpStatus === 401 || error.httpStatus === 403) {
        if (error.errcode === 'M_USER_DEACTIVATED') {
          errorText = (0, _languageHandler._t)('This account has been deactivated.');
        } else if (_SdkConfig.default.get()['disable_custom_urls']) {
          errorText = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('Incorrect username and/or password.')), /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_Login_smallError"
          }, (0, _languageHandler._t)('Please note you are logging into the %(hs)s server, not matrix.org.', {
            hs: this.props.serverConfig.hsName
          })));
        } else {
          errorText = (0, _languageHandler._t)('Incorrect username and/or password.');
        }
      } else {
        // other errors, not specific to doing a password login
        errorText = this._errorTextFromError(error);
      }

      this.setState({
        busy: false,
        busyLoggingIn: false,
        errorText: errorText,
        // 401 would be the sensible status code for 'incorrect password'
        // but the login API gives a 403 https://matrix.org/jira/browse/SYN-744
        // mentions this (although the bug is for UI auth which is not this)
        // We treat both as an incorrect password
        loginIncorrect: error.httpStatus === 401 || error.httpStatus === 403
      });
    });
  },
  onUsernameChanged: function (username) {
    this.setState({
      username: username
    });
  },
  onUsernameBlur: async function (username) {
    const doWellknownLookup = username[0] === "@";
    this.setState({
      username: username,
      busy: doWellknownLookup,
      errorText: null,
      canTryLogin: true
    });

    if (doWellknownLookup) {
      const serverName = username.split(':').slice(1).join(':');

      try {
        const result = await _AutoDiscoveryUtils.default.validateServerName(serverName);
        this.props.onServerConfigChange(result); // We'd like to rely on new props coming in via `onServerConfigChange`
        // so that we know the servers have definitely updated before clearing
        // the busy state. In the case of a full MXID that resolves to the same
        // HS as Riot's default HS though, there may not be any server change.
        // To avoid this trap, we clear busy here. For cases where the server
        // actually has changed, `_initLoginLogic` will be called and manages
        // busy state for its own liveness check.

        this.setState({
          busy: false
        });
      } catch (e) {
        console.error("Problem parsing URL or unhandled error doing .well-known discovery:", e);
        let message = (0, _languageHandler._t)("Failed to perform homeserver discovery");

        if (e.translatedMessage) {
          message = e.translatedMessage;
        }

        let errorText = message;
        let discoveryState = {};

        if (_AutoDiscoveryUtils.default.isLivelinessError(e)) {
          errorText = this.state.errorText;
          discoveryState = _AutoDiscoveryUtils.default.authComponentStateForError(e);
        }

        this.setState(_objectSpread({
          busy: false,
          errorText
        }, discoveryState));
      }
    }
  },
  onPhoneCountryChanged: function (phoneCountry) {
    this.setState({
      phoneCountry: phoneCountry
    });
  },
  onPhoneNumberChanged: function (phoneNumber) {
    this.setState({
      phoneNumber: phoneNumber
    });
  },
  onPhoneNumberBlur: function (phoneNumber) {
    // Validate the phone number entered
    if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
      this.setState({
        errorText: (0, _languageHandler._t)('The phone number entered looks invalid'),
        canTryLogin: false
      });
    } else {
      this.setState({
        errorText: null,
        canTryLogin: true
      });
    }
  },
  onRegisterClick: function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onRegisterClick();
  },
  onTryRegisterClick: function (ev) {
    const step = this._getCurrentFlowStep();

    if (step === 'm.login.sso' || step === 'm.login.cas') {
      // If we're showing SSO it means that registration is also probably disabled,
      // so intercept the click and instead pretend the user clicked 'Sign in with SSO'.
      ev.preventDefault();
      ev.stopPropagation();
      const ssoKind = step === 'm.login.sso' ? 'sso' : 'cas';

      _PlatformPeg.default.get().startSingleSignOn(this._loginLogic.createTemporaryClient(), ssoKind, this.props.fragmentAfterLogin);
    } else {
      // Don't intercept - just go through to the register page
      this.onRegisterClick(ev);
    }
  },

  async onServerDetailsNextPhaseClick() {
    this.setState({
      phase: PHASE_LOGIN
    });
  },

  onEditServerDetailsClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({
      phase: PHASE_SERVER_DETAILS
    });
  },

  _initLoginLogic: async function (hsUrl, isUrl) {
    hsUrl = hsUrl || this.props.serverConfig.hsUrl;
    isUrl = isUrl || this.props.serverConfig.isUrl;
    let isDefaultServer = false;

    if (this.props.serverConfig.isDefault && hsUrl === this.props.serverConfig.hsUrl && isUrl === this.props.serverConfig.isUrl) {
      isDefaultServer = true;
    }

    const fallbackHsUrl = isDefaultServer ? this.props.fallbackHsUrl : null;
    const loginLogic = new _Login.default(hsUrl, isUrl, fallbackHsUrl, {
      defaultDeviceDisplayName: this.props.defaultDeviceDisplayName
    });
    this._loginLogic = loginLogic;
    this.setState({
      busy: true,
      currentFlow: null,
      // reset flow
      loginIncorrect: false
    }); // Do a quick liveliness check on the URLs

    try {
      const {
        warning
      } = await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(hsUrl, isUrl);

      if (warning) {
        this.setState(_objectSpread({}, _AutoDiscoveryUtils.default.authComponentStateForError(warning), {
          errorText: ""
        }));
      } else {
        this.setState({
          serverIsAlive: true,
          errorText: ""
        });
      }
    } catch (e) {
      this.setState(_objectSpread({
        busy: false
      }, _AutoDiscoveryUtils.default.authComponentStateForError(e)));

      if (this.state.serverErrorIsFatal) {
        // Server is dead: show server details prompt instead
        this.setState({
          phase: PHASE_SERVER_DETAILS
        });
        return;
      }
    }

    loginLogic.getFlows().then(flows => {
      // look for a flow where we understand all of the steps.
      for (let i = 0; i < flows.length; i++) {
        if (!this._isSupportedFlow(flows[i])) {
          continue;
        } // we just pick the first flow where we support all the
        // steps. (we don't have a UI for multiple logins so let's skip
        // that for now).


        loginLogic.chooseFlow(i);
        this.setState({
          currentFlow: this._getCurrentFlowStep()
        });
        return;
      } // we got to the end of the list without finding a suitable
      // flow.


      this.setState({
        errorText: (0, _languageHandler._t)("This homeserver doesn't offer any login flows which are " + "supported by this client.")
      });
    }, err => {
      this.setState({
        errorText: this._errorTextFromError(err),
        loginIncorrect: false,
        canTryLogin: false
      });
    }).finally(() => {
      this.setState({
        busy: false
      });
    });
  },
  _isSupportedFlow: function (flow) {
    // technically the flow can have multiple steps, but no one does this
    // for login and loginLogic doesn't support it so we can ignore it.
    if (!this._stepRendererMap[flow.type]) {
      console.log("Skipping flow", flow, "due to unsupported login type", flow.type);
      return false;
    }

    return true;
  },
  _getCurrentFlowStep: function () {
    return this._loginLogic ? this._loginLogic.getCurrentFlowStep() : null;
  },

  _errorTextFromError(err) {
    let errCode = err.errcode;

    if (!errCode && err.httpStatus) {
      errCode = "HTTP " + err.httpStatus;
    }

    let errorText = (0, _languageHandler._t)("Error: Problem communicating with the given homeserver.") + (errCode ? " (" + errCode + ")" : "");

    if (err.cors === 'rejected') {
      if (window.location.protocol === 'https:' && (this.props.serverConfig.hsUrl.startsWith("http:") || !this.props.serverConfig.hsUrl.startsWith("http"))) {
        errorText = /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Can't connect to homeserver via HTTP when an HTTPS URL is in your browser bar. " + "Either use HTTPS or <a>enable unsafe scripts</a>.", {}, {
          'a': sub => {
            return /*#__PURE__*/_react.default.createElement("a", {
              target: "_blank",
              rel: "noreferrer noopener",
              href: "https://www.google.com/search?&q=enable%20unsafe%20scripts"
            }, sub);
          }
        }));
      } else {
        errorText = /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Can't connect to homeserver - please check your connectivity, ensure your " + "<a>homeserver's SSL certificate</a> is trusted, and that a browser extension " + "is not blocking requests.", {}, {
          'a': sub => /*#__PURE__*/_react.default.createElement("a", {
            target: "_blank",
            rel: "noreferrer noopener",
            href: this.props.serverConfig.hsUrl
          }, sub)
        }));
      }
    }

    return errorText;
  },

  renderServerComponent() {
    const ServerConfig = sdk.getComponent("auth.ServerConfig");

    if (_SdkConfig.default.get()['disable_custom_urls']) {
      return null;
    }

    if (PHASES_ENABLED && this.state.phase !== PHASE_SERVER_DETAILS) {
      return null;
    }

    const serverDetailsProps = {};

    if (PHASES_ENABLED) {
      serverDetailsProps.onAfterSubmit = this.onServerDetailsNextPhaseClick;
      serverDetailsProps.submitText = (0, _languageHandler._t)("Next");
      serverDetailsProps.submitClass = "mx_Login_submit";
    }

    return /*#__PURE__*/_react.default.createElement(ServerConfig, (0, _extends2.default)({
      serverConfig: this.props.serverConfig,
      onServerConfigChange: this.props.onServerConfigChange,
      delayTimeMs: 250
    }, serverDetailsProps));
  },

  renderLoginComponentForStep() {
    if (PHASES_ENABLED && this.state.phase !== PHASE_LOGIN) {
      return null;
    }

    const step = this.state.currentFlow;

    if (!step) {
      return null;
    }

    const stepRenderer = this._stepRendererMap[step];

    if (stepRenderer) {
      return stepRenderer();
    }

    return null;
  },

  _renderPasswordStep: function () {
    const PasswordLogin = sdk.getComponent('auth.PasswordLogin');
    let onEditServerDetailsClick = null; // If custom URLs are allowed, wire up the server details edit link.

    if (PHASES_ENABLED && !_SdkConfig.default.get()['disable_custom_urls']) {
      onEditServerDetailsClick = this.onEditServerDetailsClick;
    }

    return /*#__PURE__*/_react.default.createElement(PasswordLogin, {
      onSubmit: this.onPasswordLogin,
      onError: this.onPasswordLoginError,
      onEditServerDetailsClick: onEditServerDetailsClick,
      initialUsername: this.state.username,
      initialPhoneCountry: this.state.phoneCountry,
      initialPhoneNumber: this.state.phoneNumber,
      onUsernameChanged: this.onUsernameChanged,
      onUsernameBlur: this.onUsernameBlur,
      onPhoneCountryChanged: this.onPhoneCountryChanged,
      onPhoneNumberChanged: this.onPhoneNumberChanged,
      onPhoneNumberBlur: this.onPhoneNumberBlur,
      onForgotPasswordClick: this.props.onForgotPasswordClick,
      loginIncorrect: this.state.loginIncorrect,
      serverConfig: this.props.serverConfig,
      disableSubmit: this.isBusy(),
      busy: this.props.isSyncing || this.state.busyLoggingIn
    });
  },
  _renderSsoStep: function (loginType) {
    const SignInToText = sdk.getComponent('views.auth.SignInToText');
    let onEditServerDetailsClick = null; // If custom URLs are allowed, wire up the server details edit link.

    if (PHASES_ENABLED && !_SdkConfig.default.get()['disable_custom_urls']) {
      onEditServerDetailsClick = this.onEditServerDetailsClick;
    } // XXX: This link does *not* have a target="_blank" because single sign-on relies on
    // redirecting the user back to a URI once they're logged in. On the web, this means
    // we use the same window and redirect back to riot. On electron, this actually
    // opens the SSO page in the electron app itself due to
    // https://github.com/electron/electron/issues/8841 and so happens to work.
    // If this bug gets fixed, it will break SSO since it will open the SSO page in the
    // user's browser, let them log into their SSO provider, then redirect their browser
    // to vector://vector which, of course, will not work.


    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(SignInToText, {
      serverConfig: this.props.serverConfig,
      onEditServerDetailsClick: onEditServerDetailsClick
    }), /*#__PURE__*/_react.default.createElement(_SSOButton.default, {
      className: "mx_Login_sso_link mx_Login_submit",
      matrixClient: this._loginLogic.createTemporaryClient(),
      loginType: loginType,
      fragmentAfterLogin: this.props.fragmentAfterLogin
    }));
  },
  render: function () {
    const Loader = sdk.getComponent("elements.Spinner");
    const InlineSpinner = sdk.getComponent("elements.InlineSpinner");
    const AuthHeader = sdk.getComponent("auth.AuthHeader");
    const AuthBody = sdk.getComponent("auth.AuthBody");
    const loader = this.isBusy() && !this.state.busyLoggingIn ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Login_loader"
    }, /*#__PURE__*/_react.default.createElement(Loader, null)) : null;
    const errorText = this.state.errorText;
    let errorTextSection;

    if (errorText) {
      errorTextSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Login_error"
      }, errorText);
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

    let footer;

    if (this.props.isSyncing || this.state.busyLoggingIn) {
      footer = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AuthBody_paddedFooter"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AuthBody_paddedFooter_title"
      }, /*#__PURE__*/_react.default.createElement(InlineSpinner, {
        w: 20,
        h: 20
      }), this.props.isSyncing ? (0, _languageHandler._t)("Syncing...") : (0, _languageHandler._t)("Signing In...")), this.props.isSyncing && /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AuthBody_paddedFooter_subtitle"
      }, (0, _languageHandler._t)("If you've joined lots of rooms, this might take a while")));
    } else {
      footer = /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_AuthBody_changeFlow",
        onClick: this.onTryRegisterClick,
        href: "#"
      }, (0, _languageHandler._t)('Create account'));
    }

    return /*#__PURE__*/_react.default.createElement(_AuthPage.default, null, /*#__PURE__*/_react.default.createElement(AuthHeader, {
      disableLanguageSelector: this.props.isSyncing || this.state.busyLoggingIn
    }), /*#__PURE__*/_react.default.createElement(AuthBody, null, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)('Sign in'), loader), errorTextSection, serverDeadSection, this.renderServerComponent(), this.renderLoginComponentForStep(), footer));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9Mb2dpbi5qcyJdLCJuYW1lcyI6WyJQSE9ORV9OVU1CRVJfUkVHRVgiLCJQSEFTRV9TRVJWRVJfREVUQUlMUyIsIlBIQVNFX0xPR0lOIiwiUEhBU0VTX0VOQUJMRUQiLCJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsIm9uTG9nZ2VkSW4iLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCIsImJ1c3kiLCJib29sIiwiZmFsbGJhY2tIc1VybCIsInN0cmluZyIsImRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZSIsIm9uUmVnaXN0ZXJDbGljayIsIm9uRm9yZ290UGFzc3dvcmRDbGljayIsIm9uU2VydmVyQ29uZmlnQ2hhbmdlIiwic2VydmVyQ29uZmlnIiwiaW5zdGFuY2VPZiIsIlZhbGlkYXRlZFNlcnZlckNvbmZpZyIsImlzU3luY2luZyIsImdldEluaXRpYWxTdGF0ZSIsImJ1c3lMb2dnaW5nSW4iLCJlcnJvclRleHQiLCJsb2dpbkluY29ycmVjdCIsImNhblRyeUxvZ2luIiwidXNlcm5hbWUiLCJwaG9uZUNvdW50cnkiLCJwaG9uZU51bWJlciIsInBoYXNlIiwiY3VycmVudEZsb3ciLCJzZXJ2ZXJJc0FsaXZlIiwic2VydmVyRXJyb3JJc0ZhdGFsIiwic2VydmVyRGVhZEVycm9yIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl91bm1vdW50ZWQiLCJfc3RlcFJlbmRlcmVyTWFwIiwiX3JlbmRlclBhc3N3b3JkU3RlcCIsIl9yZW5kZXJTc29TdGVwIiwiX2luaXRMb2dpbkxvZ2ljIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5ld1Byb3BzIiwiaHNVcmwiLCJwcm9wcyIsImlzVXJsIiwib25QYXNzd29yZExvZ2luRXJyb3IiLCJzZXRTdGF0ZSIsIkJvb2xlYW4iLCJpc0J1c3kiLCJzdGF0ZSIsIm9uUGFzc3dvcmRMb2dpbiIsInBhc3N3b3JkIiwiYWxpdmVBZ2FpbiIsIkF1dG9EaXNjb3ZlcnlVdGlscyIsInZhbGlkYXRlU2VydmVyQ29uZmlnV2l0aFN0YXRpY1VybHMiLCJlIiwiY29tcG9uZW50U3RhdGUiLCJhdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvciIsIl9sb2dpbkxvZ2ljIiwibG9naW5WaWFQYXNzd29yZCIsInRoZW4iLCJkYXRhIiwiZXJyb3IiLCJ1c2luZ0VtYWlsIiwiaW5kZXhPZiIsImh0dHBTdGF0dXMiLCJlcnJjb2RlIiwiZXJyb3JUb3AiLCJsaW1pdF90eXBlIiwiYWRtaW5fY29udGFjdCIsImVycm9yRGV0YWlsIiwiU2RrQ29uZmlnIiwiZ2V0IiwiaHMiLCJoc05hbWUiLCJfZXJyb3JUZXh0RnJvbUVycm9yIiwib25Vc2VybmFtZUNoYW5nZWQiLCJvblVzZXJuYW1lQmx1ciIsImRvV2VsbGtub3duTG9va3VwIiwic2VydmVyTmFtZSIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwicmVzdWx0IiwidmFsaWRhdGVTZXJ2ZXJOYW1lIiwiY29uc29sZSIsIm1lc3NhZ2UiLCJ0cmFuc2xhdGVkTWVzc2FnZSIsImRpc2NvdmVyeVN0YXRlIiwiaXNMaXZlbGluZXNzRXJyb3IiLCJvblBob25lQ291bnRyeUNoYW5nZWQiLCJvblBob25lTnVtYmVyQ2hhbmdlZCIsIm9uUGhvbmVOdW1iZXJCbHVyIiwidGVzdCIsImV2IiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJvblRyeVJlZ2lzdGVyQ2xpY2siLCJzdGVwIiwiX2dldEN1cnJlbnRGbG93U3RlcCIsInNzb0tpbmQiLCJQbGF0Zm9ybVBlZyIsInN0YXJ0U2luZ2xlU2lnbk9uIiwiY3JlYXRlVGVtcG9yYXJ5Q2xpZW50IiwiZnJhZ21lbnRBZnRlckxvZ2luIiwib25TZXJ2ZXJEZXRhaWxzTmV4dFBoYXNlQ2xpY2siLCJvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2siLCJpc0RlZmF1bHRTZXJ2ZXIiLCJpc0RlZmF1bHQiLCJsb2dpbkxvZ2ljIiwiTG9naW4iLCJ3YXJuaW5nIiwiZ2V0Rmxvd3MiLCJmbG93cyIsImkiLCJsZW5ndGgiLCJfaXNTdXBwb3J0ZWRGbG93IiwiY2hvb3NlRmxvdyIsImVyciIsImZpbmFsbHkiLCJmbG93IiwidHlwZSIsImxvZyIsImdldEN1cnJlbnRGbG93U3RlcCIsImVyckNvZGUiLCJjb3JzIiwid2luZG93IiwibG9jYXRpb24iLCJwcm90b2NvbCIsInN0YXJ0c1dpdGgiLCJzdWIiLCJyZW5kZXJTZXJ2ZXJDb21wb25lbnQiLCJTZXJ2ZXJDb25maWciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJzZXJ2ZXJEZXRhaWxzUHJvcHMiLCJvbkFmdGVyU3VibWl0Iiwic3VibWl0VGV4dCIsInN1Ym1pdENsYXNzIiwicmVuZGVyTG9naW5Db21wb25lbnRGb3JTdGVwIiwic3RlcFJlbmRlcmVyIiwiUGFzc3dvcmRMb2dpbiIsImxvZ2luVHlwZSIsIlNpZ25JblRvVGV4dCIsInJlbmRlciIsIkxvYWRlciIsIklubGluZVNwaW5uZXIiLCJBdXRoSGVhZGVyIiwiQXV0aEJvZHkiLCJsb2FkZXIiLCJlcnJvclRleHRTZWN0aW9uIiwic2VydmVyRGVhZFNlY3Rpb24iLCJjbGFzc2VzIiwiZm9vdGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsTUFBTUEsa0JBQWtCLEdBQUcsZ0JBQTNCLEMsQ0FFQTtBQUNBOztBQUNBLE1BQU1DLG9CQUFvQixHQUFHLENBQTdCLEMsQ0FDQTs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsQ0FBcEIsQyxDQUVBOztBQUNBLE1BQU1DLGNBQWMsR0FBRyxJQUF2QixDLENBRUE7QUFDQTs7QUFDQSwwQkFBSSx1Q0FBSjtBQUNBLDBCQUFJLHVEQUFKO0FBQ0EsMEJBQUksbUNBQUo7QUFDQSwwQkFBSSxnRUFBSjtBQUNBLDBCQUFJ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LFlBQUgsQ0FBdkIsR0FBMEMseUJBQUcsZUFBSCxDQUZoRCxDQURLLEVBS0gsS0FBS3dCLEtBQUwsQ0FBV3hCLFNBQVgsaUJBQXdCO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUNyQix5QkFBRyx5REFBSCxDQURxQixDQUxyQixDQUFUO0FBU0gsS0FWRCxNQVVPO0FBQ0hzSSxNQUFBQSxNQUFNLGdCQUNGO0FBQUcsUUFBQSxTQUFTLEVBQUMsd0JBQWI7QUFBc0MsUUFBQSxPQUFPLEVBQUUsS0FBS3hELGtCQUFwRDtBQUF3RSxRQUFBLElBQUksRUFBQztBQUE3RSxTQUNNLHlCQUFHLGdCQUFILENBRE4sQ0FESjtBQUtIOztBQUVELHdCQUNJLDZCQUFDLGlCQUFELHFCQUNJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLHVCQUF1QixFQUFFLEtBQUt0RCxLQUFMLENBQVd4QixTQUFYLElBQXdCLEtBQUs4QixLQUFMLENBQVc1QjtBQUF4RSxNQURKLGVBRUksNkJBQUMsUUFBRCxxQkFDSSx5Q0FDSyx5QkFBRyxTQUFILENBREwsRUFFS2dJLE1BRkwsQ0FESixFQUtNQyxnQkFMTixFQU1NQyxpQkFOTixFQU9NLEtBQUtwQixxQkFBTCxFQVBOLEVBUU0sS0FBS1EsMkJBQUwsRUFSTixFQVNNYyxNQVROLENBRkosQ0FESjtBQWdCSDtBQXhvQjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3QsIF90ZH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgTG9naW4gZnJvbSAnLi4vLi4vLi4vTG9naW4nO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tICcuLi8uLi8uLi9TZGtDb25maWcnO1xuaW1wb3J0IHsgbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0Vycm9yVXRpbHMnO1xuaW1wb3J0IEF1dG9EaXNjb3ZlcnlVdGlscywge1ZhbGlkYXRlZFNlcnZlckNvbmZpZ30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0F1dG9EaXNjb3ZlcnlVdGlsc1wiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCBBdXRoUGFnZSBmcm9tIFwiLi4vLi4vdmlld3MvYXV0aC9BdXRoUGFnZVwiO1xuaW1wb3J0IFNTT0J1dHRvbiBmcm9tIFwiLi4vLi4vdmlld3MvZWxlbWVudHMvU1NPQnV0dG9uXCI7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSAnLi4vLi4vLi4vUGxhdGZvcm1QZWcnO1xuXG4vLyBGb3IgdmFsaWRhdGluZyBwaG9uZSBudW1iZXJzIHdpdGhvdXQgY291bnRyeSBjb2Rlc1xuY29uc3QgUEhPTkVfTlVNQkVSX1JFR0VYID0gL15bMC05KClcXC1cXHNdKiQvO1xuXG4vLyBQaGFzZXNcbi8vIFNob3cgY29udHJvbHMgdG8gY29uZmlndXJlIHNlcnZlciBkZXRhaWxzXG5jb25zdCBQSEFTRV9TRVJWRVJfREVUQUlMUyA9IDA7XG4vLyBTaG93IHRoZSBhcHByb3ByaWF0ZSBsb2dpbiBmbG93KHMpIGZvciB0aGUgc2VydmVyXG5jb25zdCBQSEFTRV9MT0dJTiA9IDE7XG5cbi8vIEVuYWJsZSBwaGFzZXMgZm9yIGxvZ2luXG5jb25zdCBQSEFTRVNfRU5BQkxFRCA9IHRydWU7XG5cbi8vIFRoZXNlIGFyZSB1c2VkIGluIHNldmVyYWwgcGxhY2VzLCBhbmQgY29tZSBmcm9tIHRoZSBqcy1zZGsncyBhdXRvZGlzY292ZXJ5XG4vLyBzdHVmZi4gV2UgZGVmaW5lIHRoZW0gaGVyZSBzbyB0aGF0IHRoZXknbGwgYmUgcGlja2VkIHVwIGJ5IGkxOG4uXG5fdGQoXCJJbnZhbGlkIGhvbWVzZXJ2ZXIgZGlzY292ZXJ5IHJlc3BvbnNlXCIpO1xuX3RkKFwiRmFpbGVkIHRvIGdldCBhdXRvZGlzY292ZXJ5IGNvbmZpZ3VyYXRpb24gZnJvbSBzZXJ2ZXJcIik7XG5fdGQoXCJJbnZhbGlkIGJhc2VfdXJsIGZvciBtLmhvbWVzZXJ2ZXJcIik7XG5fdGQoXCJIb21lc2VydmVyIFVSTCBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgYSB2YWxpZCBNYXRyaXggaG9tZXNlcnZlclwiKTtcbl90ZChcIkludmFsaWQgaWRlbnRpdHkgc2VydmVyIGRpc2NvdmVyeSByZXNwb25zZVwiKTtcbl90ZChcIkludmFsaWQgYmFzZV91cmwgZm9yIG0uaWRlbnRpdHlfc2VydmVyXCIpO1xuX3RkKFwiSWRlbnRpdHkgc2VydmVyIFVSTCBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgYSB2YWxpZCBpZGVudGl0eSBzZXJ2ZXJcIik7XG5fdGQoXCJHZW5lcmFsIGZhaWx1cmVcIik7XG5cbi8qKlxuICogQSB3aXJlIGNvbXBvbmVudCB3aGljaCBnbHVlcyB0b2dldGhlciBsb2dpbiBVSSBjb21wb25lbnRzIGFuZCBMb2dpbiBsb2dpY1xuICovXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0xvZ2luJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBDYWxsZWQgd2hlbiB0aGUgdXNlciBoYXMgbG9nZ2VkIGluLiBQYXJhbXM6XG4gICAgICAgIC8vIC0gVGhlIG9iamVjdCByZXR1cm5lZCBieSB0aGUgbG9naW4gQVBJXG4gICAgICAgIC8vIC0gVGhlIHVzZXIncyBwYXNzd29yZCwgaWYgYXBwbGljYWJsZSwgKG1heSBiZSBjYWNoZWQgaW4gbWVtb3J5IGZvciBhXG4gICAgICAgIC8vICAgc2hvcnQgdGltZSBzbyB0aGUgdXNlciBpcyBub3QgcmVxdWlyZWQgdG8gcmUtZW50ZXIgdGhlaXIgcGFzc3dvcmRcbiAgICAgICAgLy8gICBmb3Igb3BlcmF0aW9ucyBsaWtlIHVwbG9hZGluZyBjcm9zcy1zaWduaW5nIGtleXMpLlxuICAgICAgICBvbkxvZ2dlZEluOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIElmIHRydWUsIHRoZSBjb21wb25lbnQgd2lsbCBjb25zaWRlciBpdHNlbGYgYnVzeS5cbiAgICAgICAgYnVzeTogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gU2Vjb25kYXJ5IEhTIHdoaWNoIHdlIHRyeSB0byBsb2cgaW50byBpZiB0aGUgdXNlciBpcyB1c2luZ1xuICAgICAgICAvLyB0aGUgZGVmYXVsdCBIUyBidXQgbG9naW4gZmFpbHMuIFVzZWZ1bCBmb3IgbWlncmF0aW5nIHRvIGFcbiAgICAgICAgLy8gZGlmZmVyZW50IGhvbWVzZXJ2ZXIgd2l0aG91dCBjb25mdXNpbmcgdXNlcnMuXG4gICAgICAgIGZhbGxiYWNrSHNVcmw6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgZGVmYXVsdERldmljZURpc3BsYXlOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIGxvZ2luIHNob3VsZG4ndCBrbm93IG9yIGNhcmUgaG93IHJlZ2lzdHJhdGlvbiwgcGFzc3dvcmQgcmVjb3ZlcnksXG4gICAgICAgIC8vIGV0YyBpcyBkb25lLlxuICAgICAgICBvblJlZ2lzdGVyQ2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRm9yZ290UGFzc3dvcmRDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIHNlcnZlckNvbmZpZzogUHJvcFR5cGVzLmluc3RhbmNlT2YoVmFsaWRhdGVkU2VydmVyQ29uZmlnKS5pc1JlcXVpcmVkLFxuICAgICAgICBpc1N5bmNpbmc6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICBidXN5TG9nZ2luZ0luOiBudWxsLFxuICAgICAgICAgICAgZXJyb3JUZXh0OiBudWxsLFxuICAgICAgICAgICAgbG9naW5JbmNvcnJlY3Q6IGZhbHNlLFxuICAgICAgICAgICAgY2FuVHJ5TG9naW46IHRydWUsIC8vIGNhbiB3ZSBhdHRlbXB0IHRvIGxvZyBpbiBvciBhcmUgdGhlcmUgdmFsaWRhdGlvbiBlcnJvcnM/XG5cbiAgICAgICAgICAgIC8vIHVzZWQgZm9yIHByZXNlcnZpbmcgZm9ybSB2YWx1ZXMgd2hlbiBjaGFuZ2luZyBob21lc2VydmVyXG4gICAgICAgICAgICB1c2VybmFtZTogXCJcIixcbiAgICAgICAgICAgIHBob25lQ291bnRyeTogbnVsbCxcbiAgICAgICAgICAgIHBob25lTnVtYmVyOiBcIlwiLFxuXG4gICAgICAgICAgICAvLyBQaGFzZSBvZiB0aGUgb3ZlcmFsbCBsb2dpbiBkaWFsb2cuXG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfTE9HSU4sXG4gICAgICAgICAgICAvLyBUaGUgY3VycmVudCBsb2dpbiBmbG93LCBzdWNoIGFzIHBhc3N3b3JkLCBTU08sIGV0Yy5cbiAgICAgICAgICAgIGN1cnJlbnRGbG93OiBudWxsLCAvLyB3ZSBuZWVkIHRvIGxvYWQgdGhlIGZsb3dzIGZyb20gdGhlIHNlcnZlclxuXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtIGxpdmVsaW5lc3MgY2hlY2tzIGxhdGVyLCBidXQgZm9yIG5vdyBzdXBwcmVzcyB0aGUgZXJyb3JzLlxuICAgICAgICAgICAgLy8gV2UgYWxzbyB0cmFjayB0aGUgc2VydmVyIGRlYWQgZXJyb3JzIGluZGVwZW5kZW50bHkgb2YgdGhlIHJlZ3VsYXIgZXJyb3JzIHNvXG4gICAgICAgICAgICAvLyB0aGF0IHdlIGNhbiByZW5kZXIgaXQgZGlmZmVyZW50bHksIGFuZCBvdmVycmlkZSBhbnkgb3RoZXIgZXJyb3IgdGhlIHVzZXIgbWF5XG4gICAgICAgICAgICAvLyBiZSBzZWVpbmcuXG4gICAgICAgICAgICBzZXJ2ZXJJc0FsaXZlOiB0cnVlLFxuICAgICAgICAgICAgc2VydmVyRXJyb3JJc0ZhdGFsOiBmYWxzZSxcbiAgICAgICAgICAgIHNlcnZlckRlYWRFcnJvcjogXCJcIixcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBtYXAgZnJvbSBsb2dpbiBzdGVwIHR5cGUgdG8gYSBmdW5jdGlvbiB3aGljaCB3aWxsIHJlbmRlciBhIGNvbnRyb2xcbiAgICAgICAgLy8gbGV0dGluZyB5b3UgZG8gdGhhdCBsb2dpbiB0eXBlXG4gICAgICAgIHRoaXMuX3N0ZXBSZW5kZXJlck1hcCA9IHtcbiAgICAgICAgICAgICdtLmxvZ2luLnBhc3N3b3JkJzogdGhpcy5fcmVuZGVyUGFzc3dvcmRTdGVwLFxuXG4gICAgICAgICAgICAvLyBDQVMgYW5kIFNTTyBhcmUgdGhlIHNhbWUgdGhpbmcsIG1vZHVsbyB0aGUgdXJsIHdlIGxpbmsgdG9cbiAgICAgICAgICAgICdtLmxvZ2luLmNhcyc6ICgpID0+IHRoaXMuX3JlbmRlclNzb1N0ZXAoXCJjYXNcIiksXG4gICAgICAgICAgICAnbS5sb2dpbi5zc28nOiAoKSA9PiB0aGlzLl9yZW5kZXJTc29TdGVwKFwic3NvXCIpLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX2luaXRMb2dpbkxvZ2ljKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXdQcm9wcykge1xuICAgICAgICBpZiAobmV3UHJvcHMuc2VydmVyQ29uZmlnLmhzVXJsID09PSB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc1VybCAmJlxuICAgICAgICAgICAgbmV3UHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsID09PSB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHdlIGVuZCB1cCBhY3R1YWxseSBsb2dnaW5nIGluIHRvIHRoZSByaWdodCBwbGFjZVxuICAgICAgICB0aGlzLl9pbml0TG9naW5Mb2dpYyhuZXdQcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwsIG5ld1Byb3BzLnNlcnZlckNvbmZpZy5pc1VybCk7XG4gICAgfSxcblxuICAgIG9uUGFzc3dvcmRMb2dpbkVycm9yOiBmdW5jdGlvbihlcnJvclRleHQpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBlcnJvclRleHQsXG4gICAgICAgICAgICBsb2dpbkluY29ycmVjdDogQm9vbGVhbihlcnJvclRleHQpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaXNCdXN5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuYnVzeSB8fCB0aGlzLnByb3BzLmJ1c3k7XG4gICAgfSxcblxuICAgIG9uUGFzc3dvcmRMb2dpbjogYXN5bmMgZnVuY3Rpb24odXNlcm5hbWUsIHBob25lQ291bnRyeSwgcGhvbmVOdW1iZXIsIHBhc3N3b3JkKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5zZXJ2ZXJJc0FsaXZlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiB0cnVlfSk7XG4gICAgICAgICAgICAvLyBEbyBhIHF1aWNrIGxpdmVsaW5lc3MgY2hlY2sgb24gdGhlIFVSTHNcbiAgICAgICAgICAgIGxldCBhbGl2ZUFnYWluID0gdHJ1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgQXV0b0Rpc2NvdmVyeVV0aWxzLnZhbGlkYXRlU2VydmVyQ29uZmlnV2l0aFN0YXRpY1VybHMoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmhzVXJsLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlcnZlcklzQWxpdmU6IHRydWUsIGVycm9yVGV4dDogXCJcIn0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFN0YXRlID0gQXV0b0Rpc2NvdmVyeVV0aWxzLmF1dGhDb21wb25lbnRTdGF0ZUZvckVycm9yKGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYnVzeUxvZ2dpbmdJbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbXBvbmVudFN0YXRlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFsaXZlQWdhaW4gPSAhY29tcG9uZW50U3RhdGUuc2VydmVyRXJyb3JJc0ZhdGFsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQcmV2ZW50IHBlb3BsZSBmcm9tIHN1Ym1pdHRpbmcgdGhlaXIgcGFzc3dvcmQgd2hlbiBzb21ldGhpbmcgaXNuJ3QgcmlnaHQuXG4gICAgICAgICAgICBpZiAoIWFsaXZlQWdhaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGJ1c3k6IHRydWUsXG4gICAgICAgICAgICBidXN5TG9nZ2luZ0luOiB0cnVlLFxuICAgICAgICAgICAgZXJyb3JUZXh0OiBudWxsLFxuICAgICAgICAgICAgbG9naW5JbmNvcnJlY3Q6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9sb2dpbkxvZ2ljLmxvZ2luVmlhUGFzc3dvcmQoXG4gICAgICAgICAgICB1c2VybmFtZSwgcGhvbmVDb3VudHJ5LCBwaG9uZU51bWJlciwgcGFzc3dvcmQsXG4gICAgICAgICkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VydmVySXNBbGl2ZTogdHJ1ZX0pOyAvLyBpdCBtdXN0IGJlLCB3ZSBsb2dnZWQgaW4uXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uTG9nZ2VkSW4oZGF0YSwgcGFzc3dvcmQpO1xuICAgICAgICB9LCAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZXJyb3JUZXh0O1xuXG4gICAgICAgICAgICAvLyBTb21lIGVycm9yIHN0cmluZ3Mgb25seSBhcHBseSBmb3IgbG9nZ2luZyBpblxuICAgICAgICAgICAgY29uc3QgdXNpbmdFbWFpbCA9IHVzZXJuYW1lLmluZGV4T2YoXCJAXCIpID4gMDtcbiAgICAgICAgICAgIGlmIChlcnJvci5odHRwU3RhdHVzID09PSA0MDAgJiYgdXNpbmdFbWFpbCkge1xuICAgICAgICAgICAgICAgIGVycm9yVGV4dCA9IF90KCdUaGlzIGhvbWVzZXJ2ZXIgZG9lcyBub3Qgc3VwcG9ydCBsb2dpbiB1c2luZyBlbWFpbCBhZGRyZXNzLicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5lcnJjb2RlID09PSAnTV9SRVNPVVJDRV9MSU1JVF9FWENFRURFRCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvclRvcCA9IG1lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGVycm9yLmRhdGEubGltaXRfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IuZGF0YS5hZG1pbl9jb250YWN0LCB7XG4gICAgICAgICAgICAgICAgICAgICdtb250aGx5X2FjdGl2ZV91c2VyJzogX3RkKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGhvbWVzZXJ2ZXIgaGFzIGhpdCBpdHMgTW9udGhseSBBY3RpdmUgVXNlciBsaW1pdC5cIixcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgJyc6IF90ZChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyBob21lc2VydmVyIGhhcyBleGNlZWRlZCBvbmUgb2YgaXRzIHJlc291cmNlIGxpbWl0cy5cIixcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRldGFpbCA9IG1lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGVycm9yLmRhdGEubGltaXRfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IuZGF0YS5hZG1pbl9jb250YWN0LCB7XG4gICAgICAgICAgICAgICAgICAgICcnOiBfdGQoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlBsZWFzZSA8YT5jb250YWN0IHlvdXIgc2VydmljZSBhZG1pbmlzdHJhdG9yPC9hPiB0byBjb250aW51ZSB1c2luZyB0aGlzIHNlcnZpY2UuXCIsXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj57ZXJyb3JUb3B9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0xvZ2luX3NtYWxsRXJyb3JcIj57ZXJyb3JEZXRhaWx9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLmh0dHBTdGF0dXMgPT09IDQwMSB8fCBlcnJvci5odHRwU3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IuZXJyY29kZSA9PT0gJ01fVVNFUl9ERUFDVElWQVRFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gX3QoJ1RoaXMgYWNjb3VudCBoYXMgYmVlbiBkZWFjdGl2YXRlZC4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFNka0NvbmZpZy5nZXQoKVsnZGlzYWJsZV9jdXN0b21fdXJscyddKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dCA9IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj57IF90KCdJbmNvcnJlY3QgdXNlcm5hbWUgYW5kL29yIHBhc3N3b3JkLicpIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0xvZ2luX3NtYWxsRXJyb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBub3RlIHlvdSBhcmUgbG9nZ2luZyBpbnRvIHRoZSAlKGhzKXMgc2VydmVyLCBub3QgbWF0cml4Lm9yZy4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2hzOiB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc05hbWV9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gX3QoJ0luY29ycmVjdCB1c2VybmFtZSBhbmQvb3IgcGFzc3dvcmQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBvdGhlciBlcnJvcnMsIG5vdCBzcGVjaWZpYyB0byBkb2luZyBhIHBhc3N3b3JkIGxvZ2luXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0ID0gdGhpcy5fZXJyb3JUZXh0RnJvbUVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYnVzeUxvZ2dpbmdJbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBlcnJvclRleHQsXG4gICAgICAgICAgICAgICAgLy8gNDAxIHdvdWxkIGJlIHRoZSBzZW5zaWJsZSBzdGF0dXMgY29kZSBmb3IgJ2luY29ycmVjdCBwYXNzd29yZCdcbiAgICAgICAgICAgICAgICAvLyBidXQgdGhlIGxvZ2luIEFQSSBnaXZlcyBhIDQwMyBodHRwczovL21hdHJpeC5vcmcvamlyYS9icm93c2UvU1lOLTc0NFxuICAgICAgICAgICAgICAgIC8vIG1lbnRpb25zIHRoaXMgKGFsdGhvdWdoIHRoZSBidWcgaXMgZm9yIFVJIGF1dGggd2hpY2ggaXMgbm90IHRoaXMpXG4gICAgICAgICAgICAgICAgLy8gV2UgdHJlYXQgYm90aCBhcyBhbiBpbmNvcnJlY3QgcGFzc3dvcmRcbiAgICAgICAgICAgICAgICBsb2dpbkluY29ycmVjdDogZXJyb3IuaHR0cFN0YXR1cyA9PT0gNDAxIHx8IGVycm9yLmh0dHBTdGF0dXMgPT09IDQwMyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25Vc2VybmFtZUNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyB1c2VybmFtZTogdXNlcm5hbWUgfSk7XG4gICAgfSxcblxuICAgIG9uVXNlcm5hbWVCbHVyOiBhc3luYyBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgICBjb25zdCBkb1dlbGxrbm93bkxvb2t1cCA9IHVzZXJuYW1lWzBdID09PSBcIkBcIjtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICBidXN5OiBkb1dlbGxrbm93bkxvb2t1cCxcbiAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgICAgIGNhblRyeUxvZ2luOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGRvV2VsbGtub3duTG9va3VwKSB7XG4gICAgICAgICAgICBjb25zdCBzZXJ2ZXJOYW1lID0gdXNlcm5hbWUuc3BsaXQoJzonKS5zbGljZSgxKS5qb2luKCc6Jyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEF1dG9EaXNjb3ZlcnlVdGlscy52YWxpZGF0ZVNlcnZlck5hbWUoc2VydmVyTmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNlcnZlckNvbmZpZ0NoYW5nZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIC8vIFdlJ2QgbGlrZSB0byByZWx5IG9uIG5ldyBwcm9wcyBjb21pbmcgaW4gdmlhIGBvblNlcnZlckNvbmZpZ0NoYW5nZWBcbiAgICAgICAgICAgICAgICAvLyBzbyB0aGF0IHdlIGtub3cgdGhlIHNlcnZlcnMgaGF2ZSBkZWZpbml0ZWx5IHVwZGF0ZWQgYmVmb3JlIGNsZWFyaW5nXG4gICAgICAgICAgICAgICAgLy8gdGhlIGJ1c3kgc3RhdGUuIEluIHRoZSBjYXNlIG9mIGEgZnVsbCBNWElEIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHNhbWVcbiAgICAgICAgICAgICAgICAvLyBIUyBhcyBSaW90J3MgZGVmYXVsdCBIUyB0aG91Z2gsIHRoZXJlIG1heSBub3QgYmUgYW55IHNlcnZlciBjaGFuZ2UuXG4gICAgICAgICAgICAgICAgLy8gVG8gYXZvaWQgdGhpcyB0cmFwLCB3ZSBjbGVhciBidXN5IGhlcmUuIEZvciBjYXNlcyB3aGVyZSB0aGUgc2VydmVyXG4gICAgICAgICAgICAgICAgLy8gYWN0dWFsbHkgaGFzIGNoYW5nZWQsIGBfaW5pdExvZ2luTG9naWNgIHdpbGwgYmUgY2FsbGVkIGFuZCBtYW5hZ2VzXG4gICAgICAgICAgICAgICAgLy8gYnVzeSBzdGF0ZSBmb3IgaXRzIG93biBsaXZlbmVzcyBjaGVjay5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlByb2JsZW0gcGFyc2luZyBVUkwgb3IgdW5oYW5kbGVkIGVycm9yIGRvaW5nIC53ZWxsLWtub3duIGRpc2NvdmVyeTpcIiwgZSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IF90KFwiRmFpbGVkIHRvIHBlcmZvcm0gaG9tZXNlcnZlciBkaXNjb3ZlcnlcIik7XG4gICAgICAgICAgICAgICAgaWYgKGUudHJhbnNsYXRlZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IGUudHJhbnNsYXRlZE1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yVGV4dCA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgbGV0IGRpc2NvdmVyeVN0YXRlID0ge307XG4gICAgICAgICAgICAgICAgaWYgKEF1dG9EaXNjb3ZlcnlVdGlscy5pc0xpdmVsaW5lc3NFcnJvcihlKSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQgPSB0aGlzLnN0YXRlLmVycm9yVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5U3RhdGUgPSBBdXRvRGlzY292ZXJ5VXRpbHMuYXV0aENvbXBvbmVudFN0YXRlRm9yRXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQsXG4gICAgICAgICAgICAgICAgICAgIC4uLmRpc2NvdmVyeVN0YXRlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUGhvbmVDb3VudHJ5Q2hhbmdlZDogZnVuY3Rpb24ocGhvbmVDb3VudHJ5KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBwaG9uZUNvdW50cnk6IHBob25lQ291bnRyeSB9KTtcbiAgICB9LFxuXG4gICAgb25QaG9uZU51bWJlckNoYW5nZWQ6IGZ1bmN0aW9uKHBob25lTnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhvbmVOdW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25QaG9uZU51bWJlckJsdXI6IGZ1bmN0aW9uKHBob25lTnVtYmVyKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIHRoZSBwaG9uZSBudW1iZXIgZW50ZXJlZFxuICAgICAgICBpZiAoIVBIT05FX05VTUJFUl9SRUdFWC50ZXN0KHBob25lTnVtYmVyKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBfdCgnVGhlIHBob25lIG51bWJlciBlbnRlcmVkIGxvb2tzIGludmFsaWQnKSxcbiAgICAgICAgICAgICAgICBjYW5UcnlMb2dpbjogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICBjYW5UcnlMb2dpbjogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUmVnaXN0ZXJDbGljazogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMucHJvcHMub25SZWdpc3RlckNsaWNrKCk7XG4gICAgfSxcblxuICAgIG9uVHJ5UmVnaXN0ZXJDbGljazogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgY29uc3Qgc3RlcCA9IHRoaXMuX2dldEN1cnJlbnRGbG93U3RlcCgpO1xuICAgICAgICBpZiAoc3RlcCA9PT0gJ20ubG9naW4uc3NvJyB8fCBzdGVwID09PSAnbS5sb2dpbi5jYXMnKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSBzaG93aW5nIFNTTyBpdCBtZWFucyB0aGF0IHJlZ2lzdHJhdGlvbiBpcyBhbHNvIHByb2JhYmx5IGRpc2FibGVkLFxuICAgICAgICAgICAgLy8gc28gaW50ZXJjZXB0IHRoZSBjbGljayBhbmQgaW5zdGVhZCBwcmV0ZW5kIHRoZSB1c2VyIGNsaWNrZWQgJ1NpZ24gaW4gd2l0aCBTU08nLlxuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgY29uc3Qgc3NvS2luZCA9IHN0ZXAgPT09ICdtLmxvZ2luLnNzbycgPyAnc3NvJyA6ICdjYXMnO1xuICAgICAgICAgICAgUGxhdGZvcm1QZWcuZ2V0KCkuc3RhcnRTaW5nbGVTaWduT24odGhpcy5fbG9naW5Mb2dpYy5jcmVhdGVUZW1wb3JhcnlDbGllbnQoKSwgc3NvS2luZCxcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmZyYWdtZW50QWZ0ZXJMb2dpbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEb24ndCBpbnRlcmNlcHQgLSBqdXN0IGdvIHRocm91Z2ggdG8gdGhlIHJlZ2lzdGVyIHBhZ2VcbiAgICAgICAgICAgIHRoaXMub25SZWdpc3RlckNsaWNrKGV2KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBvblNlcnZlckRldGFpbHNOZXh0UGhhc2VDbGljaygpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfTE9HSU4sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2soZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NFUlZFUl9ERVRBSUxTLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2luaXRMb2dpbkxvZ2ljOiBhc3luYyBmdW5jdGlvbihoc1VybCwgaXNVcmwpIHtcbiAgICAgICAgaHNVcmwgPSBoc1VybCB8fCB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc1VybDtcbiAgICAgICAgaXNVcmwgPSBpc1VybCB8fCB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybDtcblxuICAgICAgICBsZXQgaXNEZWZhdWx0U2VydmVyID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc0RlZmF1bHRcbiAgICAgICAgICAgICYmIGhzVXJsID09PSB0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc1VybFxuICAgICAgICAgICAgJiYgaXNVcmwgPT09IHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsKSB7XG4gICAgICAgICAgICBpc0RlZmF1bHRTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmFsbGJhY2tIc1VybCA9IGlzRGVmYXVsdFNlcnZlciA/IHRoaXMucHJvcHMuZmFsbGJhY2tIc1VybCA6IG51bGw7XG5cbiAgICAgICAgY29uc3QgbG9naW5Mb2dpYyA9IG5ldyBMb2dpbihoc1VybCwgaXNVcmwsIGZhbGxiYWNrSHNVcmwsIHtcbiAgICAgICAgICAgIGRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZTogdGhpcy5wcm9wcy5kZWZhdWx0RGV2aWNlRGlzcGxheU5hbWUsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sb2dpbkxvZ2ljID0gbG9naW5Mb2dpYztcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGJ1c3k6IHRydWUsXG4gICAgICAgICAgICBjdXJyZW50RmxvdzogbnVsbCwgLy8gcmVzZXQgZmxvd1xuICAgICAgICAgICAgbG9naW5JbmNvcnJlY3Q6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBEbyBhIHF1aWNrIGxpdmVsaW5lc3MgY2hlY2sgb24gdGhlIFVSTHNcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgd2FybmluZyB9ID1cbiAgICAgICAgICAgICAgICBhd2FpdCBBdXRvRGlzY292ZXJ5VXRpbHMudmFsaWRhdGVTZXJ2ZXJDb25maWdXaXRoU3RhdGljVXJscyhoc1VybCwgaXNVcmwpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uQXV0b0Rpc2NvdmVyeVV0aWxzLmF1dGhDb21wb25lbnRTdGF0ZUZvckVycm9yKHdhcm5pbmcpLFxuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJJc0FsaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIC4uLkF1dG9EaXNjb3ZlcnlVdGlscy5hdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvcihlKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VydmVyRXJyb3JJc0ZhdGFsKSB7XG4gICAgICAgICAgICAgICAgLy8gU2VydmVyIGlzIGRlYWQ6IHNob3cgc2VydmVyIGRldGFpbHMgcHJvbXB0IGluc3RlYWRcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1NFUlZFUl9ERVRBSUxTLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZ2luTG9naWMuZ2V0Rmxvd3MoKS50aGVuKChmbG93cykgPT4ge1xuICAgICAgICAgICAgLy8gbG9vayBmb3IgYSBmbG93IHdoZXJlIHdlIHVuZGVyc3RhbmQgYWxsIG9mIHRoZSBzdGVwcy5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmxvd3MubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1N1cHBvcnRlZEZsb3coZmxvd3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHdlIGp1c3QgcGljayB0aGUgZmlyc3QgZmxvdyB3aGVyZSB3ZSBzdXBwb3J0IGFsbCB0aGVcbiAgICAgICAgICAgICAgICAvLyBzdGVwcy4gKHdlIGRvbid0IGhhdmUgYSBVSSBmb3IgbXVsdGlwbGUgbG9naW5zIHNvIGxldCdzIHNraXBcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGZvciBub3cpLlxuICAgICAgICAgICAgICAgIGxvZ2luTG9naWMuY2hvb3NlRmxvdyhpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZsb3c6IHRoaXMuX2dldEN1cnJlbnRGbG93U3RlcCgpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHdlIGdvdCB0byB0aGUgZW5kIG9mIHRoZSBsaXN0IHdpdGhvdXQgZmluZGluZyBhIHN1aXRhYmxlXG4gICAgICAgICAgICAvLyBmbG93LlxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGhvbWVzZXJ2ZXIgZG9lc24ndCBvZmZlciBhbnkgbG9naW4gZmxvd3Mgd2hpY2ggYXJlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydGVkIGJ5IHRoaXMgY2xpZW50LlwiLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiB0aGlzLl9lcnJvclRleHRGcm9tRXJyb3IoZXJyKSxcbiAgICAgICAgICAgICAgICBsb2dpbkluY29ycmVjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgY2FuVHJ5TG9naW46IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9pc1N1cHBvcnRlZEZsb3c6IGZ1bmN0aW9uKGZsb3cpIHtcbiAgICAgICAgLy8gdGVjaG5pY2FsbHkgdGhlIGZsb3cgY2FuIGhhdmUgbXVsdGlwbGUgc3RlcHMsIGJ1dCBubyBvbmUgZG9lcyB0aGlzXG4gICAgICAgIC8vIGZvciBsb2dpbiBhbmQgbG9naW5Mb2dpYyBkb2Vzbid0IHN1cHBvcnQgaXQgc28gd2UgY2FuIGlnbm9yZSBpdC5cbiAgICAgICAgaWYgKCF0aGlzLl9zdGVwUmVuZGVyZXJNYXBbZmxvdy50eXBlXSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTa2lwcGluZyBmbG93XCIsIGZsb3csIFwiZHVlIHRvIHVuc3VwcG9ydGVkIGxvZ2luIHR5cGVcIiwgZmxvdy50eXBlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgX2dldEN1cnJlbnRGbG93U3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2dpbkxvZ2ljID8gdGhpcy5fbG9naW5Mb2dpYy5nZXRDdXJyZW50Rmxvd1N0ZXAoKSA6IG51bGw7XG4gICAgfSxcblxuICAgIF9lcnJvclRleHRGcm9tRXJyb3IoZXJyKSB7XG4gICAgICAgIGxldCBlcnJDb2RlID0gZXJyLmVycmNvZGU7XG4gICAgICAgIGlmICghZXJyQ29kZSAmJiBlcnIuaHR0cFN0YXR1cykge1xuICAgICAgICAgICAgZXJyQ29kZSA9IFwiSFRUUCBcIiArIGVyci5odHRwU3RhdHVzO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVycm9yVGV4dCA9IF90KFwiRXJyb3I6IFByb2JsZW0gY29tbXVuaWNhdGluZyB3aXRoIHRoZSBnaXZlbiBob21lc2VydmVyLlwiKSArXG4gICAgICAgICAgICAgICAgKGVyckNvZGUgPyBcIiAoXCIgKyBlcnJDb2RlICsgXCIpXCIgOiBcIlwiKTtcblxuICAgICAgICBpZiAoZXJyLmNvcnMgPT09ICdyZWplY3RlZCcpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonICYmXG4gICAgICAgICAgICAgICAgKHRoaXMucHJvcHMuc2VydmVyQ29uZmlnLmhzVXJsLnN0YXJ0c1dpdGgoXCJodHRwOlwiKSB8fFxuICAgICAgICAgICAgICAgICAhdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwuc3RhcnRzV2l0aChcImh0dHBcIikpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIkNhbid0IGNvbm5lY3QgdG8gaG9tZXNlcnZlciB2aWEgSFRUUCB3aGVuIGFuIEhUVFBTIFVSTCBpcyBpbiB5b3VyIGJyb3dzZXIgYmFyLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkVpdGhlciB1c2UgSFRUUFMgb3IgPGE+ZW5hYmxlIHVuc2FmZSBzY3JpcHRzPC9hPi5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2EnOiAoc3ViKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8YSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9XCJodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD8mcT1lbmFibGUlMjB1bnNhZmUlMjBzY3JpcHRzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzdWIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvclRleHQgPSA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIkNhbid0IGNvbm5lY3QgdG8gaG9tZXNlcnZlciAtIHBsZWFzZSBjaGVjayB5b3VyIGNvbm5lY3Rpdml0eSwgZW5zdXJlIHlvdXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCI8YT5ob21lc2VydmVyJ3MgU1NMIGNlcnRpZmljYXRlPC9hPiBpcyB0cnVzdGVkLCBhbmQgdGhhdCBhIGJyb3dzZXIgZXh0ZW5zaW9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaXMgbm90IGJsb2NraW5nIHJlcXVlc3RzLlwiLCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYSc6IChzdWIpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIiBocmVmPXt0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5oc1VybH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHN1YiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVycm9yVGV4dDtcbiAgICB9LFxuXG4gICAgcmVuZGVyU2VydmVyQ29tcG9uZW50KCkge1xuICAgICAgICBjb25zdCBTZXJ2ZXJDb25maWcgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXV0aC5TZXJ2ZXJDb25maWdcIik7XG5cbiAgICAgICAgaWYgKFNka0NvbmZpZy5nZXQoKVsnZGlzYWJsZV9jdXN0b21fdXJscyddKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChQSEFTRVNfRU5BQkxFRCAmJiB0aGlzLnN0YXRlLnBoYXNlICE9PSBQSEFTRV9TRVJWRVJfREVUQUlMUykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZXJ2ZXJEZXRhaWxzUHJvcHMgPSB7fTtcbiAgICAgICAgaWYgKFBIQVNFU19FTkFCTEVEKSB7XG4gICAgICAgICAgICBzZXJ2ZXJEZXRhaWxzUHJvcHMub25BZnRlclN1Ym1pdCA9IHRoaXMub25TZXJ2ZXJEZXRhaWxzTmV4dFBoYXNlQ2xpY2s7XG4gICAgICAgICAgICBzZXJ2ZXJEZXRhaWxzUHJvcHMuc3VibWl0VGV4dCA9IF90KFwiTmV4dFwiKTtcbiAgICAgICAgICAgIHNlcnZlckRldGFpbHNQcm9wcy5zdWJtaXRDbGFzcyA9IFwibXhfTG9naW5fc3VibWl0XCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPFNlcnZlckNvbmZpZ1xuICAgICAgICAgICAgc2VydmVyQ29uZmlnPXt0aGlzLnByb3BzLnNlcnZlckNvbmZpZ31cbiAgICAgICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlPXt0aGlzLnByb3BzLm9uU2VydmVyQ29uZmlnQ2hhbmdlfVxuICAgICAgICAgICAgZGVsYXlUaW1lTXM9ezI1MH1cbiAgICAgICAgICAgIHsuLi5zZXJ2ZXJEZXRhaWxzUHJvcHN9XG4gICAgICAgIC8+O1xuICAgIH0sXG5cbiAgICByZW5kZXJMb2dpbkNvbXBvbmVudEZvclN0ZXAoKSB7XG4gICAgICAgIGlmIChQSEFTRVNfRU5BQkxFRCAmJiB0aGlzLnN0YXRlLnBoYXNlICE9PSBQSEFTRV9MT0dJTikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGVwID0gdGhpcy5zdGF0ZS5jdXJyZW50RmxvdztcblxuICAgICAgICBpZiAoIXN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RlcFJlbmRlcmVyID0gdGhpcy5fc3RlcFJlbmRlcmVyTWFwW3N0ZXBdO1xuXG4gICAgICAgIGlmIChzdGVwUmVuZGVyZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwUmVuZGVyZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUGFzc3dvcmRTdGVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgUGFzc3dvcmRMb2dpbiA9IHNkay5nZXRDb21wb25lbnQoJ2F1dGguUGFzc3dvcmRMb2dpbicpO1xuXG4gICAgICAgIGxldCBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2sgPSBudWxsO1xuICAgICAgICAvLyBJZiBjdXN0b20gVVJMcyBhcmUgYWxsb3dlZCwgd2lyZSB1cCB0aGUgc2VydmVyIGRldGFpbHMgZWRpdCBsaW5rLlxuICAgICAgICBpZiAoUEhBU0VTX0VOQUJMRUQgJiYgIVNka0NvbmZpZy5nZXQoKVsnZGlzYWJsZV9jdXN0b21fdXJscyddKSB7XG4gICAgICAgICAgICBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2sgPSB0aGlzLm9uRWRpdFNlcnZlckRldGFpbHNDbGljaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UGFzc3dvcmRMb2dpblxuICAgICAgICAgICAgICAgb25TdWJtaXQ9e3RoaXMub25QYXNzd29yZExvZ2lufVxuICAgICAgICAgICAgICAgb25FcnJvcj17dGhpcy5vblBhc3N3b3JkTG9naW5FcnJvcn1cbiAgICAgICAgICAgICAgIG9uRWRpdFNlcnZlckRldGFpbHNDbGljaz17b25FZGl0U2VydmVyRGV0YWlsc0NsaWNrfVxuICAgICAgICAgICAgICAgaW5pdGlhbFVzZXJuYW1lPXt0aGlzLnN0YXRlLnVzZXJuYW1lfVxuICAgICAgICAgICAgICAgaW5pdGlhbFBob25lQ291bnRyeT17dGhpcy5zdGF0ZS5waG9uZUNvdW50cnl9XG4gICAgICAgICAgICAgICBpbml0aWFsUGhvbmVOdW1iZXI9e3RoaXMuc3RhdGUucGhvbmVOdW1iZXJ9XG4gICAgICAgICAgICAgICBvblVzZXJuYW1lQ2hhbmdlZD17dGhpcy5vblVzZXJuYW1lQ2hhbmdlZH1cbiAgICAgICAgICAgICAgIG9uVXNlcm5hbWVCbHVyPXt0aGlzLm9uVXNlcm5hbWVCbHVyfVxuICAgICAgICAgICAgICAgb25QaG9uZUNvdW50cnlDaGFuZ2VkPXt0aGlzLm9uUGhvbmVDb3VudHJ5Q2hhbmdlZH1cbiAgICAgICAgICAgICAgIG9uUGhvbmVOdW1iZXJDaGFuZ2VkPXt0aGlzLm9uUGhvbmVOdW1iZXJDaGFuZ2VkfVxuICAgICAgICAgICAgICAgb25QaG9uZU51bWJlckJsdXI9e3RoaXMub25QaG9uZU51bWJlckJsdXJ9XG4gICAgICAgICAgICAgICBvbkZvcmdvdFBhc3N3b3JkQ2xpY2s9e3RoaXMucHJvcHMub25Gb3Jnb3RQYXNzd29yZENsaWNrfVxuICAgICAgICAgICAgICAgbG9naW5JbmNvcnJlY3Q9e3RoaXMuc3RhdGUubG9naW5JbmNvcnJlY3R9XG4gICAgICAgICAgICAgICBzZXJ2ZXJDb25maWc9e3RoaXMucHJvcHMuc2VydmVyQ29uZmlnfVxuICAgICAgICAgICAgICAgZGlzYWJsZVN1Ym1pdD17dGhpcy5pc0J1c3koKX1cbiAgICAgICAgICAgICAgIGJ1c3k9e3RoaXMucHJvcHMuaXNTeW5jaW5nIHx8IHRoaXMuc3RhdGUuYnVzeUxvZ2dpbmdJbn1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9yZW5kZXJTc29TdGVwOiBmdW5jdGlvbihsb2dpblR5cGUpIHtcbiAgICAgICAgY29uc3QgU2lnbkluVG9UZXh0ID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuYXV0aC5TaWduSW5Ub1RleHQnKTtcblxuICAgICAgICBsZXQgb25FZGl0U2VydmVyRGV0YWlsc0NsaWNrID0gbnVsbDtcbiAgICAgICAgLy8gSWYgY3VzdG9tIFVSTHMgYXJlIGFsbG93ZWQsIHdpcmUgdXAgdGhlIHNlcnZlciBkZXRhaWxzIGVkaXQgbGluay5cbiAgICAgICAgaWYgKFBIQVNFU19FTkFCTEVEICYmICFTZGtDb25maWcuZ2V0KClbJ2Rpc2FibGVfY3VzdG9tX3VybHMnXSkge1xuICAgICAgICAgICAgb25FZGl0U2VydmVyRGV0YWlsc0NsaWNrID0gdGhpcy5vbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2s7XG4gICAgICAgIH1cbiAgICAgICAgLy8gWFhYOiBUaGlzIGxpbmsgZG9lcyAqbm90KiBoYXZlIGEgdGFyZ2V0PVwiX2JsYW5rXCIgYmVjYXVzZSBzaW5nbGUgc2lnbi1vbiByZWxpZXMgb25cbiAgICAgICAgLy8gcmVkaXJlY3RpbmcgdGhlIHVzZXIgYmFjayB0byBhIFVSSSBvbmNlIHRoZXkncmUgbG9nZ2VkIGluLiBPbiB0aGUgd2ViLCB0aGlzIG1lYW5zXG4gICAgICAgIC8vIHdlIHVzZSB0aGUgc2FtZSB3aW5kb3cgYW5kIHJlZGlyZWN0IGJhY2sgdG8gcmlvdC4gT24gZWxlY3Ryb24sIHRoaXMgYWN0dWFsbHlcbiAgICAgICAgLy8gb3BlbnMgdGhlIFNTTyBwYWdlIGluIHRoZSBlbGVjdHJvbiBhcHAgaXRzZWxmIGR1ZSB0b1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZWxlY3Ryb24vZWxlY3Ryb24vaXNzdWVzLzg4NDEgYW5kIHNvIGhhcHBlbnMgdG8gd29yay5cbiAgICAgICAgLy8gSWYgdGhpcyBidWcgZ2V0cyBmaXhlZCwgaXQgd2lsbCBicmVhayBTU08gc2luY2UgaXQgd2lsbCBvcGVuIHRoZSBTU08gcGFnZSBpbiB0aGVcbiAgICAgICAgLy8gdXNlcidzIGJyb3dzZXIsIGxldCB0aGVtIGxvZyBpbnRvIHRoZWlyIFNTTyBwcm92aWRlciwgdGhlbiByZWRpcmVjdCB0aGVpciBicm93c2VyXG4gICAgICAgIC8vIHRvIHZlY3RvcjovL3ZlY3RvciB3aGljaCwgb2YgY291cnNlLCB3aWxsIG5vdCB3b3JrLlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8U2lnbkluVG9UZXh0IHNlcnZlckNvbmZpZz17dGhpcy5wcm9wcy5zZXJ2ZXJDb25maWd9XG4gICAgICAgICAgICAgICAgICAgIG9uRWRpdFNlcnZlckRldGFpbHNDbGljaz17b25FZGl0U2VydmVyRGV0YWlsc0NsaWNrfSAvPlxuXG4gICAgICAgICAgICAgICAgPFNTT0J1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Mb2dpbl9zc29fbGluayBteF9Mb2dpbl9zdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhDbGllbnQ9e3RoaXMuX2xvZ2luTG9naWMuY3JlYXRlVGVtcG9yYXJ5Q2xpZW50KCl9XG4gICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZT17bG9naW5UeXBlfVxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEFmdGVyTG9naW49e3RoaXMucHJvcHMuZnJhZ21lbnRBZnRlckxvZ2lufVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgIGNvbnN0IElubGluZVNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuSW5saW5lU3Bpbm5lclwiKTtcbiAgICAgICAgY29uc3QgQXV0aEhlYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJhdXRoLkF1dGhIZWFkZXJcIik7XG4gICAgICAgIGNvbnN0IEF1dGhCb2R5ID0gc2RrLmdldENvbXBvbmVudChcImF1dGguQXV0aEJvZHlcIik7XG4gICAgICAgIGNvbnN0IGxvYWRlciA9IHRoaXMuaXNCdXN5KCkgJiYgIXRoaXMuc3RhdGUuYnVzeUxvZ2dpbmdJbiA/XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0xvZ2luX2xvYWRlclwiPjxMb2FkZXIgLz48L2Rpdj4gOiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IHRoaXMuc3RhdGUuZXJyb3JUZXh0O1xuXG4gICAgICAgIGxldCBlcnJvclRleHRTZWN0aW9uO1xuICAgICAgICBpZiAoZXJyb3JUZXh0KSB7XG4gICAgICAgICAgICBlcnJvclRleHRTZWN0aW9uID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTG9naW5fZXJyb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvclRleHQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzZXJ2ZXJEZWFkU2VjdGlvbjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNlcnZlcklzQWxpdmUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICBcIm14X0xvZ2luX2Vycm9yXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9Mb2dpbl9zZXJ2ZXJFcnJvclwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfTG9naW5fc2VydmVyRXJyb3JOb25GYXRhbFwiOiAhdGhpcy5zdGF0ZS5zZXJ2ZXJFcnJvcklzRmF0YWwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlcnZlckRlYWRTZWN0aW9uID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuc2VydmVyRGVhZEVycm9yfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb290ZXI7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmlzU3luY2luZyB8fCB0aGlzLnN0YXRlLmJ1c3lMb2dnaW5nSW4pIHtcbiAgICAgICAgICAgIGZvb3RlciA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfcGFkZGVkRm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9wYWRkZWRGb290ZXJfdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPElubGluZVNwaW5uZXIgdz17MjB9IGg9ezIwfSAvPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuaXNTeW5jaW5nID8gX3QoXCJTeW5jaW5nLi4uXCIpIDogX3QoXCJTaWduaW5nIEluLi4uXCIpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuaXNTeW5jaW5nICYmIDxkaXYgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfcGFkZGVkRm9vdGVyX3N1YnRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIklmIHlvdSd2ZSBqb2luZWQgbG90cyBvZiByb29tcywgdGhpcyBtaWdodCB0YWtlIGEgd2hpbGVcIil9XG4gICAgICAgICAgICAgICAgPC9kaXY+IH1cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvb3RlciA9IChcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9jaGFuZ2VGbG93XCIgb25DbGljaz17dGhpcy5vblRyeVJlZ2lzdGVyQ2xpY2t9IGhyZWY9XCIjXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ0NyZWF0ZSBhY2NvdW50JykgfVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEF1dGhQYWdlPlxuICAgICAgICAgICAgICAgIDxBdXRoSGVhZGVyIGRpc2FibGVMYW5ndWFnZVNlbGVjdG9yPXt0aGlzLnByb3BzLmlzU3luY2luZyB8fCB0aGlzLnN0YXRlLmJ1c3lMb2dnaW5nSW59IC8+XG4gICAgICAgICAgICAgICAgPEF1dGhCb2R5PlxuICAgICAgICAgICAgICAgICAgICA8aDI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoJ1NpZ24gaW4nKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgICAgICAgICAgIHsgZXJyb3JUZXh0U2VjdGlvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgc2VydmVyRGVhZFNlY3Rpb24gfVxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucmVuZGVyU2VydmVyQ29tcG9uZW50KCkgfVxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucmVuZGVyTG9naW5Db21wb25lbnRGb3JTdGVwKCkgfVxuICAgICAgICAgICAgICAgICAgICB7IGZvb3RlciB9XG4gICAgICAgICAgICAgICAgPC9BdXRoQm9keT5cbiAgICAgICAgICAgIDwvQXV0aFBhZ2U+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19