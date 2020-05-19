"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _ErrorUtils = require("../../../utils/ErrorUtils");

var ServerType = _interopRequireWildcard(require("../../views/auth/ServerTypeSelector"));

var _AutoDiscoveryUtils = _interopRequireWildcard(require("../../../utils/AutoDiscoveryUtils"));

var _classnames = _interopRequireDefault(require("classnames"));

var Lifecycle = _interopRequireWildcard(require("../../../Lifecycle"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _AuthPage = _interopRequireDefault(require("../../views/auth/AuthPage"));

var _Login = _interopRequireDefault(require("../../../Login"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Phases
// Show controls to configure server details
const PHASE_SERVER_DETAILS = 0; // Show the appropriate registration flow(s) for the server

const PHASE_REGISTRATION = 1; // Enable phases for registration

const PHASES_ENABLED = true;

var _default = (0, _createReactClass.default)({
  displayName: 'Registration',
  propTypes: {
    // Called when the user has logged in. Params:
    // - object with userId, deviceId, homeserverUrl, identityServerUrl, accessToken
    // - The user's password, if available and applicable (may be cached in memory
    //   for a short time so the user is not required to re-enter their password
    //   for operations like uploading cross-signing keys).
    onLoggedIn: _propTypes.default.func.isRequired,
    clientSecret: _propTypes.default.string,
    sessionId: _propTypes.default.string,
    makeRegistrationUrl: _propTypes.default.func.isRequired,
    idSid: _propTypes.default.string,
    serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
    brand: _propTypes.default.string,
    email: _propTypes.default.string,
    // registration shouldn't know or care how login is done.
    onLoginClick: _propTypes.default.func.isRequired,
    onServerConfigChange: _propTypes.default.func.isRequired,
    defaultDeviceDisplayName: _propTypes.default.string
  },
  getInitialState: function () {
    const serverType = ServerType.getTypeFromServerConfig(this.props.serverConfig);
    return {
      busy: false,
      errorText: null,
      // We remember the values entered by the user because
      // the registration form will be unmounted during the
      // course of registration, but if there's an error we
      // want to bring back the registration form with the
      // values the user entered still in it. We can keep
      // them in this component's state since this component
      // persist for the duration of the registration process.
      formVals: {
        email: this.props.email
      },
      // true if we're waiting for the user to complete
      // user-interactive auth
      // If we've been given a session ID, we're resuming
      // straight back into UI auth
      doingUIAuth: Boolean(this.props.sessionId),
      serverType,
      // Phase of the overall registration dialog.
      phase: PHASE_REGISTRATION,
      flows: null,
      // If set, we've registered but are not going to log
      // the user in to their new account automatically.
      completedNoSignin: false,
      // We perform liveliness checks later, but for now suppress the errors.
      // We also track the server dead errors independently of the regular errors so
      // that we can render it differently, and override any other error the user may
      // be seeing.
      serverIsAlive: true,
      serverErrorIsFatal: false,
      serverDeadError: "",
      // Our matrix client - part of state because we can't render the UI auth
      // component without it.
      matrixClient: null,
      // whether the HS requires an ID server to register with a threepid
      serverRequiresIdServer: null,
      // The user ID we've just registered
      registeredUsername: null,
      // if a different user ID to the one we just registered is logged in,
      // this is the user ID that's logged in.
      differentLoggedInUserId: null
    };
  },
  componentDidMount: function () {
    this._unmounted = false;

    this._replaceClient();
  },

  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.serverConfig.hsUrl === this.props.serverConfig.hsUrl && newProps.serverConfig.isUrl === this.props.serverConfig.isUrl) return;

    this._replaceClient(newProps.serverConfig); // Handle cases where the user enters "https://matrix.org" for their server
    // from the advanced option - we should default to FREE at that point.


    const serverType = ServerType.getTypeFromServerConfig(newProps.serverConfig);

    if (serverType !== this.state.serverType) {
      // Reset the phase to default phase for the server type.
      this.setState({
        serverType,
        phase: this.getDefaultPhaseForServerType(serverType)
      });
    }
  },

  getDefaultPhaseForServerType(type) {
    switch (type) {
      case ServerType.FREE:
        {
          // Move directly to the registration phase since the server
          // details are fixed.
          return PHASE_REGISTRATION;
        }

      case ServerType.PREMIUM:
      case ServerType.ADVANCED:
        return PHASE_SERVER_DETAILS;
    }
  },

  onServerTypeChange(type) {
    this.setState({
      serverType: type
    }); // When changing server types, set the HS / IS URLs to reasonable defaults for the
    // the new type.

    switch (type) {
      case ServerType.FREE:
        {
          const {
            serverConfig
          } = ServerType.TYPES.FREE;
          this.props.onServerConfigChange(serverConfig);
          break;
        }

      case ServerType.PREMIUM:
        // We can accept whatever server config was the default here as this essentially
        // acts as a slightly different "custom server"/ADVANCED option.
        break;

      case ServerType.ADVANCED:
        // Use the default config from the config
        this.props.onServerConfigChange(_SdkConfig.default.get()["validated_server_config"]);
        break;
    } // Reset the phase to default phase for the server type.


    this.setState({
      phase: this.getDefaultPhaseForServerType(type)
    });
  },

  _replaceClient: async function (serverConfig) {
    this.setState({
      errorText: null,
      serverDeadError: null,
      serverErrorIsFatal: false,
      // busy while we do liveness check (we need to avoid trying to render
      // the UI auth component while we don't have a matrix client)
      busy: true
    });
    if (!serverConfig) serverConfig = this.props.serverConfig; // Do a liveliness check on the URLs

    try {
      await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(serverConfig.hsUrl, serverConfig.isUrl);
      this.setState({
        serverIsAlive: true,
        serverErrorIsFatal: false
      });
    } catch (e) {
      this.setState(_objectSpread({
        busy: false
      }, _AutoDiscoveryUtils.default.authComponentStateForError(e, "register")));

      if (this.state.serverErrorIsFatal) {
        return; // Server is dead - do not continue.
      }
    }

    const {
      hsUrl,
      isUrl
    } = serverConfig;

    const cli = _matrixJsSdk.default.createClient({
      baseUrl: hsUrl,
      idBaseUrl: isUrl
    });

    let serverRequiresIdServer = true;

    try {
      serverRequiresIdServer = await cli.doesServerRequireIdServerParam();
    } catch (e) {
      console.log("Unable to determine is server needs id_server param", e);
    }

    this.setState({
      matrixClient: cli,
      serverRequiresIdServer,
      busy: false
    });

    const showGenericError = e => {
      this.setState({
        errorText: (0, _languageHandler._t)("Unable to query for supported registration methods."),
        // add empty flows array to get rid of spinner
        flows: []
      });
    };

    try {
      // We do the first registration request ourselves to discover whether we need to
      // do SSO instead. If we've already started the UI Auth process though, we don't
      // need to.
      if (!this.state.doingUIAuth) {
        await this._makeRegisterRequest({}); // This should never succeed since we specified an empty
        // auth object.

        console.log("Expecting 401 from register request but got success!");
      }
    } catch (e) {
      if (e.httpStatus === 401) {
        this.setState({
          flows: e.data.flows
        });
      } else if (e.httpStatus === 403 && e.errcode === "M_UNKNOWN") {
        // At this point registration is pretty much disabled, but before we do that let's
        // quickly check to see if the server supports SSO instead. If it does, we'll send
        // the user off to the login page to figure their account out.
        try {
          const loginLogic = new _Login.default(hsUrl, isUrl, null, {
            defaultDeviceDisplayName: "riot login check" // We shouldn't ever be used

          });
          const flows = await loginLogic.getFlows();
          const hasSsoFlow = flows.find(f => f.type === 'm.login.sso' || f.type === 'm.login.cas');

          if (hasSsoFlow) {
            // Redirect to login page - server probably expects SSO only
            _dispatcher.default.dispatch({
              action: 'start_login'
            });
          } else {
            this.setState({
              serverErrorIsFatal: true,
              // fatal because user cannot continue on this server
              errorText: (0, _languageHandler._t)("Registration has been disabled on this homeserver."),
              // add empty flows array to get rid of spinner
              flows: []
            });
          }
        } catch (e) {
          console.error("Failed to get login flows to check for SSO support", e);
          showGenericError(e);
        }
      } else {
        console.log("Unable to query for supported registration methods.", e);
        showGenericError(e);
      }
    }
  },
  onFormSubmit: function (formVals) {
    this.setState({
      errorText: "",
      busy: true,
      formVals: formVals,
      doingUIAuth: true
    });
  },
  _requestEmailToken: function (emailAddress, clientSecret, sendAttempt, sessionId) {
    return this.state.matrixClient.requestRegisterEmailToken(emailAddress, clientSecret, sendAttempt, this.props.makeRegistrationUrl({
      client_secret: clientSecret,
      hs_url: this.state.matrixClient.getHomeserverUrl(),
      is_url: this.state.matrixClient.getIdentityServerUrl(),
      session_id: sessionId
    }));
  },
  _onUIAuthFinished: async function (success, response, extra) {
    if (!success) {
      let msg = response.message || response.toString(); // can we give a better error message?

      if (response.errcode === 'M_RESOURCE_LIMIT_EXCEEDED') {
        const errorTop = (0, _ErrorUtils.messageForResourceLimitError)(response.data.limit_type, response.data.admin_contact, {
          'monthly_active_user': (0, _languageHandler._td)("This homeserver has hit its Monthly Active User limit."),
          '': (0, _languageHandler._td)("This homeserver has exceeded one of its resource limits.")
        });
        const errorDetail = (0, _ErrorUtils.messageForResourceLimitError)(response.data.limit_type, response.data.admin_contact, {
          '': (0, _languageHandler._td)("Please <a>contact your service administrator</a> to continue using this service.")
        });
        msg = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, errorTop), /*#__PURE__*/_react.default.createElement("p", null, errorDetail));
      } else if (response.required_stages && response.required_stages.indexOf('m.login.msisdn') > -1) {
        let msisdnAvailable = false;

        for (const flow of response.available_flows) {
          msisdnAvailable |= flow.stages.indexOf('m.login.msisdn') > -1;
        }

        if (!msisdnAvailable) {
          msg = (0, _languageHandler._t)('This server does not support authentication with a phone number.');
        }
      }

      this.setState({
        busy: false,
        doingUIAuth: false,
        errorText: msg
      });
      return;
    }

    _MatrixClientPeg.MatrixClientPeg.setJustRegisteredUserId(response.user_id);

    const newState = {
      doingUIAuth: false,
      registeredUsername: response.user_id
    }; // The user came in through an email validation link. To avoid overwriting
    // their session, check to make sure the session isn't someone else, and
    // isn't a guest user since we'll usually have set a guest user session before
    // starting the registration process. This isn't perfect since it's possible
    // the user had a separate guest session they didn't actually mean to replace.

    const sessionOwner = Lifecycle.getStoredSessionOwner();
    const sessionIsGuest = Lifecycle.getStoredSessionIsGuest();

    if (sessionOwner && !sessionIsGuest && sessionOwner !== response.userId) {
      console.log("Found a session for ".concat(sessionOwner, " but ").concat(response.userId, " has just registered."));
      newState.differentLoggedInUserId = sessionOwner;
    } else {
      newState.differentLoggedInUserId = null;
    }

    if (response.access_token) {
      const cli = await this.props.onLoggedIn({
        userId: response.user_id,
        deviceId: response.device_id,
        homeserverUrl: this.state.matrixClient.getHomeserverUrl(),
        identityServerUrl: this.state.matrixClient.getIdentityServerUrl(),
        accessToken: response.access_token
      }, this.state.formVals.password);

      this._setupPushers(cli); // we're still busy until we get unmounted: don't show the registration form again


      newState.busy = true;
    } else {
      newState.busy = false;
      newState.completedNoSignin = true;
    }

    this.setState(newState);
  },
  _setupPushers: function (matrixClient) {
    if (!this.props.brand) {
      return Promise.resolve();
    }

    return matrixClient.getPushers().then(resp => {
      const pushers = resp.pushers;

      for (let i = 0; i < pushers.length; ++i) {
        if (pushers[i].kind === 'email') {
          const emailPusher = pushers[i];
          emailPusher.data = {
            brand: this.props.brand
          };
          matrixClient.setPusher(emailPusher).then(() => {
            console.log("Set email branding to " + this.props.brand);
          }, error => {
            console.error("Couldn't set email branding: " + error);
          });
        }
      }
    }, error => {
      console.error("Couldn't get pushers: " + error);
    });
  },
  onLoginClick: function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onLoginClick();
  },

  onGoToFormClicked(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    this._replaceClient();

    this.setState({
      busy: false,
      doingUIAuth: false,
      phase: PHASE_REGISTRATION
    });
  },

  async onServerDetailsNextPhaseClick() {
    this.setState({
      phase: PHASE_REGISTRATION
    });
  },

  onEditServerDetailsClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({
      phase: PHASE_SERVER_DETAILS
    });
  },

  _makeRegisterRequest: function (auth) {
    // We inhibit login if we're trying to register with an email address: this
    // avoids a lot of complex race conditions that can occur if we try to log
    // the user in one one or both of the tabs they might end up with after
    // clicking the email link.
    let inhibitLogin = Boolean(this.state.formVals.email); // Only send inhibitLogin if we're sending username / pw params
    // (Since we need to send no params at all to use the ones saved in the
    // session).

    if (!this.state.formVals.password) inhibitLogin = null;
    const registerParams = {
      username: this.state.formVals.username,
      password: this.state.formVals.password,
      initial_device_display_name: this.props.defaultDeviceDisplayName
    };
    if (auth) registerParams.auth = auth;
    if (inhibitLogin !== undefined && inhibitLogin !== null) registerParams.inhibit_login = inhibitLogin;
    return this.state.matrixClient.registerRequest(registerParams);
  },
  _getUIAuthInputs: function () {
    return {
      emailAddress: this.state.formVals.email,
      phoneCountry: this.state.formVals.phoneCountry,
      phoneNumber: this.state.formVals.phoneNumber
    };
  },
  // Links to the login page shown after registration is completed are routed through this
  // which checks the user hasn't already logged in somewhere else (perhaps we should do
  // this more generally?)
  _onLoginClickWithCheck: async function (ev) {
    ev.preventDefault();
    const sessionLoaded = await Lifecycle.loadSession({
      ignoreGuest: true
    });

    if (!sessionLoaded) {
      // ok fine, there's still no session: really go to the login page
      this.props.onLoginClick();
    }
  },

  renderServerComponent() {
    const ServerTypeSelector = sdk.getComponent("auth.ServerTypeSelector");
    const ServerConfig = sdk.getComponent("auth.ServerConfig");
    const ModularServerConfig = sdk.getComponent("auth.ModularServerConfig");

    if (_SdkConfig.default.get()['disable_custom_urls']) {
      return null;
    } // If we're on a different phase, we only show the server type selector,
    // which is always shown if we allow custom URLs at all.
    // (if there's a fatal server error, we need to show the full server
    // config as the user may need to change servers to resolve the error).


    if (PHASES_ENABLED && this.state.phase !== PHASE_SERVER_DETAILS && !this.state.serverErrorIsFatal) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(ServerTypeSelector, {
        selected: this.state.serverType,
        onChange: this.onServerTypeChange
      }));
    }

    const serverDetailsProps = {};

    if (PHASES_ENABLED) {
      serverDetailsProps.onAfterSubmit = this.onServerDetailsNextPhaseClick;
      serverDetailsProps.submitText = (0, _languageHandler._t)("Next");
      serverDetailsProps.submitClass = "mx_Login_submit";
    }

    let serverDetails = null;

    switch (this.state.serverType) {
      case ServerType.FREE:
        break;

      case ServerType.PREMIUM:
        serverDetails = /*#__PURE__*/_react.default.createElement(ModularServerConfig, (0, _extends2.default)({
          serverConfig: this.props.serverConfig,
          onServerConfigChange: this.props.onServerConfigChange,
          delayTimeMs: 250
        }, serverDetailsProps));
        break;

      case ServerType.ADVANCED:
        serverDetails = /*#__PURE__*/_react.default.createElement(ServerConfig, (0, _extends2.default)({
          serverConfig: this.props.serverConfig,
          onServerConfigChange: this.props.onServerConfigChange,
          delayTimeMs: 250,
          showIdentityServerIfRequiredByHomeserver: true
        }, serverDetailsProps));
        break;
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(ServerTypeSelector, {
      selected: this.state.serverType,
      onChange: this.onServerTypeChange
    }), serverDetails);
  },

  renderRegisterComponent() {
    if (PHASES_ENABLED && this.state.phase !== PHASE_REGISTRATION) {
      return null;
    }

    const InteractiveAuth = sdk.getComponent('structures.InteractiveAuth');
    const Spinner = sdk.getComponent('elements.Spinner');
    const RegistrationForm = sdk.getComponent('auth.RegistrationForm');

    if (this.state.matrixClient && this.state.doingUIAuth) {
      return /*#__PURE__*/_react.default.createElement(InteractiveAuth, {
        matrixClient: this.state.matrixClient,
        makeRequest: this._makeRegisterRequest,
        onAuthFinished: this._onUIAuthFinished,
        inputs: this._getUIAuthInputs(),
        requestEmailToken: this._requestEmailToken,
        sessionId: this.props.sessionId,
        clientSecret: this.props.clientSecret,
        emailSid: this.props.idSid,
        poll: true
      });
    } else if (!this.state.matrixClient && !this.state.busy) {
      return null;
    } else if (this.state.busy || !this.state.flows) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AuthBody_spinner"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null));
    } else if (this.state.flows.length) {
      let onEditServerDetailsClick = null; // If custom URLs are allowed and we haven't selected the Free server type, wire
      // up the server details edit link.

      if (PHASES_ENABLED && !_SdkConfig.default.get()['disable_custom_urls'] && this.state.serverType !== ServerType.FREE) {
        onEditServerDetailsClick = this.onEditServerDetailsClick;
      }

      return /*#__PURE__*/_react.default.createElement(RegistrationForm, {
        defaultUsername: this.state.formVals.username,
        defaultEmail: this.state.formVals.email,
        defaultPhoneCountry: this.state.formVals.phoneCountry,
        defaultPhoneNumber: this.state.formVals.phoneNumber,
        defaultPassword: this.state.formVals.password,
        onRegisterClick: this.onFormSubmit,
        onEditServerDetailsClick: onEditServerDetailsClick,
        flows: this.state.flows,
        serverConfig: this.props.serverConfig,
        canSubmit: !this.state.serverErrorIsFatal,
        serverRequiresIdServer: this.state.serverRequiresIdServer
      });
    }
  },

  render: function () {
    const AuthHeader = sdk.getComponent('auth.AuthHeader');
    const AuthBody = sdk.getComponent("auth.AuthBody");
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let errorText;
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

    const signIn = /*#__PURE__*/_react.default.createElement("a", {
      className: "mx_AuthBody_changeFlow",
      onClick: this.onLoginClick,
      href: "#"
    }, (0, _languageHandler._t)('Sign in instead')); // Only show the 'go back' button if you're not looking at the form


    let goBack;

    if (PHASES_ENABLED && this.state.phase !== PHASE_REGISTRATION || this.state.doingUIAuth) {
      goBack = /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_AuthBody_changeFlow",
        onClick: this.onGoToFormClicked,
        href: "#"
      }, (0, _languageHandler._t)('Go back'));
    }

    let body;

    if (this.state.completedNoSignin) {
      let regDoneText;

      if (this.state.differentLoggedInUserId) {
        regDoneText = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your new account (%(newAccountId)s) is registered, but you're already " + "logged into a different account (%(loggedInUserId)s).", {
          newAccountId: this.state.registeredUsername,
          loggedInUserId: this.state.differentLoggedInUserId
        })), /*#__PURE__*/_react.default.createElement("p", null, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          element: "span",
          className: "mx_linkButton",
          onClick: this._onLoginClickWithCheck
        }, (0, _languageHandler._t)("Continue with previous account"))));
      } else if (this.state.formVals.password) {
        // We're the client that started the registration
        regDoneText = /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("<a>Log in</a> to your new account.", {}, {
          a: sub => /*#__PURE__*/_react.default.createElement("a", {
            href: "#/login",
            onClick: this._onLoginClickWithCheck
          }, sub)
        }));
      } else {
        // We're not the original client: the user probably got to us by clicking the
        // email validation link. We can't offer a 'go straight to your account' link
        // as we don't have the original creds.
        regDoneText = /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("You can now close this window or <a>log in</a> to your new account.", {}, {
          a: sub => /*#__PURE__*/_react.default.createElement("a", {
            href: "#/login",
            onClick: this._onLoginClickWithCheck
          }, sub)
        }));
      }

      body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("Registration Successful")), regDoneText);
    } else {
      body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)('Create your account')), errorText, serverDeadSection, this.renderServerComponent(), this.renderRegisterComponent(), goBack, signIn);
    }

    return /*#__PURE__*/_react.default.createElement(_AuthPage.default, null, /*#__PURE__*/_react.default.createElement(AuthHeader, null), /*#__PURE__*/_react.default.createElement(AuthBody, null, body));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9SZWdpc3RyYXRpb24uanMiXSwibmFtZXMiOlsiUEhBU0VfU0VSVkVSX0RFVEFJTFMiLCJQSEFTRV9SRUdJU1RSQVRJT04iLCJQSEFTRVNfRU5BQkxFRCIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwib25Mb2dnZWRJbiIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIiwiY2xpZW50U2VjcmV0Iiwic3RyaW5nIiwic2Vzc2lvbklkIiwibWFrZVJlZ2lzdHJhdGlvblVybCIsImlkU2lkIiwic2VydmVyQ29uZmlnIiwiaW5zdGFuY2VPZiIsIlZhbGlkYXRlZFNlcnZlckNvbmZpZyIsImJyYW5kIiwiZW1haWwiLCJvbkxvZ2luQ2xpY2siLCJvblNlcnZlckNvbmZpZ0NoYW5nZSIsImRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZSIsImdldEluaXRpYWxTdGF0ZSIsInNlcnZlclR5cGUiLCJTZXJ2ZXJUeXBlIiwiZ2V0VHlwZUZyb21TZXJ2ZXJDb25maWciLCJwcm9wcyIsImJ1c3kiLCJlcnJvclRleHQiLCJmb3JtVmFscyIsImRvaW5nVUlBdXRoIiwiQm9vbGVhbiIsInBoYXNlIiwiZmxvd3MiLCJjb21wbGV0ZWROb1NpZ25pbiIsInNlcnZlcklzQWxpdmUiLCJzZXJ2ZXJFcnJvcklzRmF0YWwiLCJzZXJ2ZXJEZWFkRXJyb3IiLCJtYXRyaXhDbGllbnQiLCJzZXJ2ZXJSZXF1aXJlc0lkU2VydmVyIiwicmVnaXN0ZXJlZFVzZXJuYW1lIiwiZGlmZmVyZW50TG9nZ2VkSW5Vc2VySWQiLCJjb21wb25lbnREaWRNb3VudCIsIl91bm1vdW50ZWQiLCJfcmVwbGFjZUNsaWVudCIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV3UHJvcHMiLCJoc1VybCIsImlzVXJsIiwic3RhdGUiLCJzZXRTdGF0ZSIsImdldERlZmF1bHRQaGFzZUZvclNlcnZlclR5cGUiLCJ0eXBlIiwiRlJFRSIsIlBSRU1JVU0iLCJBRFZBTkNFRCIsIm9uU2VydmVyVHlwZUNoYW5nZSIsIlRZUEVTIiwiU2RrQ29uZmlnIiwiZ2V0IiwiQXV0b0Rpc2NvdmVyeVV0aWxzIiwidmFsaWRhdGVTZXJ2ZXJDb25maWdXaXRoU3RhdGljVXJscyIsImUiLCJhdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvciIsImNsaSIsIk1hdHJpeCIsImNyZWF0ZUNsaWVudCIsImJhc2VVcmwiLCJpZEJhc2VVcmwiLCJkb2VzU2VydmVyUmVxdWlyZUlkU2VydmVyUGFyYW0iLCJjb25zb2xlIiwibG9nIiwic2hvd0dlbmVyaWNFcnJvciIsIl9tYWtlUmVnaXN0ZXJSZXF1ZXN0IiwiaHR0cFN0YXR1cyIsImRhdGEiLCJlcnJjb2RlIiwibG9naW5Mb2dpYyIsIkxvZ2luIiwiZ2V0Rmxvd3MiLCJoYXNTc29GbG93IiwiZmluZCIsImYiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImVycm9yIiwib25Gb3JtU3VibWl0IiwiX3JlcXVlc3RFbWFpbFRva2VuIiwiZW1haWxBZGRyZXNzIiwic2VuZEF0dGVtcHQiLCJyZXF1ZXN0UmVnaXN0ZXJFbWFpbFRva2VuIiwiY2xpZW50X3NlY3JldCIsImhzX3VybCIsImdldEhvbWVzZXJ2ZXJVcmwiLCJpc191cmwiLCJnZXRJZGVudGl0eVNlcnZlclVybCIsInNlc3Npb25faWQiLCJfb25VSUF1dGhGaW5pc2hlZCIsInN1Y2Nlc3MiLCJyZXNwb25zZSIsImV4dHJhIiwibXNnIiwibWVzc2FnZSIsInRvU3RyaW5nIiwiZXJyb3JUb3AiLCJsaW1pdF90eXBlIiwiYWRtaW5fY29udGFjdCIsImVycm9yRGV0YWlsIiwicmVxdWlyZWRfc3RhZ2VzIiwiaW5kZXhPZiIsIm1zaXNkbkF2YWlsYWJsZSIsImZsb3ciLCJhdmFpbGFibGVfZmxvd3MiLCJzdGFnZXMiLCJNYXRyaXhDbGllbnRQZWciLCJzZXRKdXN0UmVnaXN0ZXJlZFVzZXJJZCIsInVzZXJfaWQiLCJuZXdTdGF0ZSIsInNlc3Npb25Pd25lciIsIkxpZmVjeWNsZSIsImdldFN0b3JlZFNlc3Npb25Pd25lciIsInNlc3Npb25Jc0d1ZXN0IiwiZ2V0U3RvcmVkU2Vzc2lvbklzR3Vlc3QiLCJ1c2VySWQiLCJhY2Nlc3NfdG9rZW4iLCJkZXZpY2VJZCIsImRldmljZV9pZCIsImhvbWVzZXJ2ZXJVcmwiLCJpZGVudGl0eVNlcnZlclVybCIsImFjY2Vzc1Rva2VuIiwicGFzc3dvcmQiLCJfc2V0dXBQdXNoZXJzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRQdXNoZXJzIiwidGhlbiIsInJlc3AiLCJwdXNoZXJzIiwiaSIsImxlbmd0aCIsImtpbmQiLCJlbWFpbFB1c2hlciIsInNldFB1c2hlciIsImV2IiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJvbkdvVG9Gb3JtQ2xpY2tlZCIsIm9uU2VydmVyRGV0YWlsc05leHRQaGFzZUNsaWNrIiwib25FZGl0U2VydmVyRGV0YWlsc0NsaWNrIiwiYXV0aCIsImluaGliaXRMb2dpbiIsInJlZ2lzdGVyUGFyYW1zIiwidXNlcm5hbWUiLCJpbml0aWFsX2RldmljZV9kaXNwbGF5X25hbWUiLCJ1bmRlZmluZWQiLCJpbmhpYml0X2xvZ2luIiwicmVnaXN0ZXJSZXF1ZXN0IiwiX2dldFVJQXV0aElucHV0cyIsInBob25lQ291bnRyeSIsInBob25lTnVtYmVyIiwiX29uTG9naW5DbGlja1dpdGhDaGVjayIsInNlc3Npb25Mb2FkZWQiLCJsb2FkU2Vzc2lvbiIsImlnbm9yZUd1ZXN0IiwicmVuZGVyU2VydmVyQ29tcG9uZW50IiwiU2VydmVyVHlwZVNlbGVjdG9yIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiU2VydmVyQ29uZmlnIiwiTW9kdWxhclNlcnZlckNvbmZpZyIsInNlcnZlckRldGFpbHNQcm9wcyIsIm9uQWZ0ZXJTdWJtaXQiLCJzdWJtaXRUZXh0Iiwic3VibWl0Q2xhc3MiLCJzZXJ2ZXJEZXRhaWxzIiwicmVuZGVyUmVnaXN0ZXJDb21wb25lbnQiLCJJbnRlcmFjdGl2ZUF1dGgiLCJTcGlubmVyIiwiUmVnaXN0cmF0aW9uRm9ybSIsInJlbmRlciIsIkF1dGhIZWFkZXIiLCJBdXRoQm9keSIsIkFjY2Vzc2libGVCdXR0b24iLCJlcnIiLCJzZXJ2ZXJEZWFkU2VjdGlvbiIsImNsYXNzZXMiLCJzaWduSW4iLCJnb0JhY2siLCJib2R5IiwicmVnRG9uZVRleHQiLCJuZXdBY2NvdW50SWQiLCJsb2dnZWRJblVzZXJJZCIsImEiLCJzdWIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUNBLE1BQU1BLG9CQUFvQixHQUFHLENBQTdCLEMsQ0FDQTs7QUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxDQUEzQixDLENBRUE7O0FBQ0EsTUFBTUMsY0FBYyxHQUFHLElBQXZCOztlQUVlLCtCQUFpQjtBQUM1QkMsRUFBQUEsV0FBVyxFQUFFLGNBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsSUFBQUEsVUFBVSxFQUFFQyxtQkFBVUMsSUFBVixDQUFlQyxVQU5wQjtBQVFQQyxJQUFBQSxZQUFZLEVBQUVILG1CQUFVSSxNQVJqQjtBQVNQQyxJQUFBQSxTQUFTLEVBQUVMLG1CQUFVSSxNQVRkO0FBVVBFLElBQUFBLG1CQUFtQixFQUFFTixtQkFBVUMsSUFBVixDQUFlQyxVQVY3QjtBQVdQSyxJQUFBQSxLQUFLLEVBQUVQLG1CQUFVSSxNQVhWO0FBWVBJLElBQUFBLFlBQVksRUFBRVIsbUJBQVVTLFVBQVYsQ0FBcUJDLHlDQUFyQixFQUE0Q1IsVUFabkQ7QUFhUFMsSUFBQUEsS0FBSyxFQUFFWCxtQkFBVUksTUFiVjtBQWNQUSxJQUFBQSxLQUFLLEVBQUVaLG1CQUFVSSxNQWRWO0FBZVA7QUFDQVMsSUFBQUEsWUFBWSxFQUFFYixtQkFBVUMsSUFBVixDQUFlQyxVQWhCdEI7QUFpQlBZLElBQUFBLG9CQUFvQixFQUFFZCxtQkFBVUMsSUFBVixDQUFlQyxVQWpCOUI7QUFrQlBhLElBQUFBLHdCQUF3QixFQUFFZixtQkFBVUk7QUFsQjdCLEdBSGlCO0FBd0I1QlksRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsVUFBTUMsVUFBVSxHQUFHQyxVQUFVLENBQUNDLHVCQUFYLENBQW1DLEtBQUtDLEtBQUwsQ0FBV1osWUFBOUMsQ0FBbkI7QUFFQSxXQUFPO0FBQ0hhLE1BQUFBLElBQUksRUFBRSxLQURIO0FBRUhDLE1BQUFBLFNBQVMsRUFBRSxJQUZSO0FBR0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsTUFBQUEsUUFBUSxFQUFFO0FBQ05YLFFBQUFBLEtBQUssRUFBRSxLQUFLUSxLQUFMLENBQVdSO0FBRFosT0FWUDtBQWFIO0FBQ0E7QUFDQTtBQUNBO0FBQ0FZLE1BQUFBLFdBQVcsRUFBRUMsT0FBTyxDQUFDLEtBQUtMLEtBQUwsQ0FBV2YsU0FBWixDQWpCakI7QUFrQkhZLE1BQUFBLFVBbEJHO0FBbUJIO0FBQ0FTLE1BQUFBLEtBQUssRUFBRS9CLGtCQXBCSjtBQXFCSGdDLE1BQUFBLEtBQUssRUFBRSxJQXJCSjtBQXNCSDtBQUNBO0FBQ0FDLE1BQUFBLGlCQUFpQixFQUFFLEtBeEJoQjtBQTBCSDtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFBQSxhQUFhLEVBQUUsSUE5Qlo7QUErQkhDLE1BQUFBLGtCQUFrQixFQUFFLEtBL0JqQjtBQWdDSEMsTUFBQUEsZUFBZSxFQUFFLEVBaENkO0FBa0NIO0FBQ0E7QUFDQUMsTUFBQUEsWUFBWSxFQUFFLElBcENYO0FBc0NIO0FBQ0FDLE1BQUFBLHNCQUFzQixFQUFFLElBdkNyQjtBQXlDSDtBQUNBQyxNQUFBQSxrQkFBa0IsRUFBRSxJQTFDakI7QUE0Q0g7QUFDQTtBQUNBQyxNQUFBQSx1QkFBdUIsRUFBRTtBQTlDdEIsS0FBUDtBQWdESCxHQTNFMkI7QUE2RTVCQyxFQUFBQSxpQkFBaUIsRUFBRSxZQUFXO0FBQzFCLFNBQUtDLFVBQUwsR0FBa0IsS0FBbEI7O0FBQ0EsU0FBS0MsY0FBTDtBQUNILEdBaEYyQjs7QUFrRjVCO0FBQ0FDLEVBQUFBLGdDQUFnQyxDQUFDQyxRQUFELEVBQVc7QUFDdkMsUUFBSUEsUUFBUSxDQUFDaEMsWUFBVCxDQUFzQmlDLEtBQXRCLEtBQWdDLEtBQUtyQixLQUFMLENBQVdaLFlBQVgsQ0FBd0JpQyxLQUF4RCxJQUNBRCxRQUFRLENBQUNoQyxZQUFULENBQXNCa0MsS0FBdEIsS0FBZ0MsS0FBS3RCLEtBQUwsQ0FBV1osWUFBWCxDQUF3QmtDLEtBRDVELEVBQ21FOztBQUVuRSxTQUFLSixjQUFMLENBQW9CRSxRQUFRLENBQUNoQyxZQUE3QixFQUp1QyxDQU12QztBQUNBOzs7QUFDQSxVQUFNUyxVQUFVLEdBQUdDLFVBQVUsQ0FBQ0MsdUJBQVgsQ0FBbUNxQixRQUFRLENBQUNoQyxZQUE1QyxDQUFuQjs7QUFDQSxRQUFJUyxVQUFVLEtBQUssS0FBSzBCLEtBQUwsQ0FBVzFCLFVBQTlCLEVBQTBDO0FBQ3RDO0FBQ0EsV0FBSzJCLFFBQUwsQ0FBYztBQUNWM0IsUUFBQUEsVUFEVTtBQUVWUyxRQUFBQSxLQUFLLEVBQUUsS0FBS21CLDRCQUFMLENBQWtDNUIsVUFBbEM7QUFGRyxPQUFkO0FBSUg7QUFDSixHQW5HMkI7O0FBcUc1QjRCLEVBQUFBLDRCQUE0QixDQUFDQyxJQUFELEVBQU87QUFDL0IsWUFBUUEsSUFBUjtBQUNJLFdBQUs1QixVQUFVLENBQUM2QixJQUFoQjtBQUFzQjtBQUNsQjtBQUNBO0FBQ0EsaUJBQU9wRCxrQkFBUDtBQUNIOztBQUNELFdBQUt1QixVQUFVLENBQUM4QixPQUFoQjtBQUNBLFdBQUs5QixVQUFVLENBQUMrQixRQUFoQjtBQUNJLGVBQU92RCxvQkFBUDtBQVJSO0FBVUgsR0FoSDJCOztBQWtINUJ3RCxFQUFBQSxrQkFBa0IsQ0FBQ0osSUFBRCxFQUFPO0FBQ3JCLFNBQUtGLFFBQUwsQ0FBYztBQUNWM0IsTUFBQUEsVUFBVSxFQUFFNkI7QUFERixLQUFkLEVBRHFCLENBS3JCO0FBQ0E7O0FBQ0EsWUFBUUEsSUFBUjtBQUNJLFdBQUs1QixVQUFVLENBQUM2QixJQUFoQjtBQUFzQjtBQUNsQixnQkFBTTtBQUFFdkMsWUFBQUE7QUFBRixjQUFtQlUsVUFBVSxDQUFDaUMsS0FBWCxDQUFpQkosSUFBMUM7QUFDQSxlQUFLM0IsS0FBTCxDQUFXTixvQkFBWCxDQUFnQ04sWUFBaEM7QUFDQTtBQUNIOztBQUNELFdBQUtVLFVBQVUsQ0FBQzhCLE9BQWhCO0FBQ0k7QUFDQTtBQUNBOztBQUNKLFdBQUs5QixVQUFVLENBQUMrQixRQUFoQjtBQUNJO0FBQ0EsYUFBSzdCLEtBQUwsQ0FBV04sb0JBQVgsQ0FBZ0NzQyxtQkFBVUMsR0FBVixHQUFnQix5QkFBaEIsQ0FBaEM7QUFDQTtBQWJSLEtBUHFCLENBdUJyQjs7O0FBQ0EsU0FBS1QsUUFBTCxDQUFjO0FBQ1ZsQixNQUFBQSxLQUFLLEVBQUUsS0FBS21CLDRCQUFMLENBQWtDQyxJQUFsQztBQURHLEtBQWQ7QUFHSCxHQTdJMkI7O0FBK0k1QlIsRUFBQUEsY0FBYyxFQUFFLGdCQUFlOUIsWUFBZixFQUE2QjtBQUN6QyxTQUFLb0MsUUFBTCxDQUFjO0FBQ1Z0QixNQUFBQSxTQUFTLEVBQUUsSUFERDtBQUVWUyxNQUFBQSxlQUFlLEVBQUUsSUFGUDtBQUdWRCxNQUFBQSxrQkFBa0IsRUFBRSxLQUhWO0FBSVY7QUFDQTtBQUNBVCxNQUFBQSxJQUFJLEVBQUU7QUFOSSxLQUFkO0FBUUEsUUFBSSxDQUFDYixZQUFMLEVBQW1CQSxZQUFZLEdBQUcsS0FBS1ksS0FBTCxDQUFXWixZQUExQixDQVRzQixDQVd6Qzs7QUFDQSxRQUFJO0FBQ0EsWUFBTThDLDRCQUFtQkMsa0NBQW5CLENBQ0YvQyxZQUFZLENBQUNpQyxLQURYLEVBRUZqQyxZQUFZLENBQUNrQyxLQUZYLENBQU47QUFJQSxXQUFLRSxRQUFMLENBQWM7QUFDVmYsUUFBQUEsYUFBYSxFQUFFLElBREw7QUFFVkMsUUFBQUEsa0JBQWtCLEVBQUU7QUFGVixPQUFkO0FBSUgsS0FURCxDQVNFLE9BQU8wQixDQUFQLEVBQVU7QUFDUixXQUFLWixRQUFMO0FBQ0l2QixRQUFBQSxJQUFJLEVBQUU7QUFEVixTQUVPaUMsNEJBQW1CRywwQkFBbkIsQ0FBOENELENBQTlDLEVBQWlELFVBQWpELENBRlA7O0FBSUEsVUFBSSxLQUFLYixLQUFMLENBQVdiLGtCQUFmLEVBQW1DO0FBQy9CLGVBRCtCLENBQ3ZCO0FBQ1g7QUFDSjs7QUFFRCxVQUFNO0FBQUNXLE1BQUFBLEtBQUQ7QUFBUUMsTUFBQUE7QUFBUixRQUFpQmxDLFlBQXZCOztBQUNBLFVBQU1rRCxHQUFHLEdBQUdDLHFCQUFPQyxZQUFQLENBQW9CO0FBQzVCQyxNQUFBQSxPQUFPLEVBQUVwQixLQURtQjtBQUU1QnFCLE1BQUFBLFNBQVMsRUFBRXBCO0FBRmlCLEtBQXBCLENBQVo7O0FBS0EsUUFBSVQsc0JBQXNCLEdBQUcsSUFBN0I7O0FBQ0EsUUFBSTtBQUNBQSxNQUFBQSxzQkFBc0IsR0FBRyxNQUFNeUIsR0FBRyxDQUFDSyw4QkFBSixFQUEvQjtBQUNILEtBRkQsQ0FFRSxPQUFPUCxDQUFQLEVBQVU7QUFDUlEsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkscURBQVosRUFBbUVULENBQW5FO0FBQ0g7O0FBRUQsU0FBS1osUUFBTCxDQUFjO0FBQ1ZaLE1BQUFBLFlBQVksRUFBRTBCLEdBREo7QUFFVnpCLE1BQUFBLHNCQUZVO0FBR1ZaLE1BQUFBLElBQUksRUFBRTtBQUhJLEtBQWQ7O0FBS0EsVUFBTTZDLGdCQUFnQixHQUFJVixDQUFELElBQU87QUFDNUIsV0FBS1osUUFBTCxDQUFjO0FBQ1Z0QixRQUFBQSxTQUFTLEVBQUUseUJBQUcscURBQUgsQ0FERDtBQUVWO0FBQ0FLLFFBQUFBLEtBQUssRUFBRTtBQUhHLE9BQWQ7QUFLSCxLQU5EOztBQU9BLFFBQUk7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFJLENBQUMsS0FBS2dCLEtBQUwsQ0FBV25CLFdBQWhCLEVBQTZCO0FBQ3pCLGNBQU0sS0FBSzJDLG9CQUFMLENBQTBCLEVBQTFCLENBQU4sQ0FEeUIsQ0FFekI7QUFDQTs7QUFDQUgsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksc0RBQVo7QUFDSDtBQUNKLEtBVkQsQ0FVRSxPQUFPVCxDQUFQLEVBQVU7QUFDUixVQUFJQSxDQUFDLENBQUNZLFVBQUYsS0FBaUIsR0FBckIsRUFBMEI7QUFDdEIsYUFBS3hCLFFBQUwsQ0FBYztBQUNWakIsVUFBQUEsS0FBSyxFQUFFNkIsQ0FBQyxDQUFDYSxJQUFGLENBQU8xQztBQURKLFNBQWQ7QUFHSCxPQUpELE1BSU8sSUFBSTZCLENBQUMsQ0FBQ1ksVUFBRixLQUFpQixHQUFqQixJQUF3QlosQ0FBQyxDQUFDYyxPQUFGLEtBQWMsV0FBMUMsRUFBdUQ7QUFDMUQ7QUFDQTtBQUNBO0FBQ0EsWUFBSTtBQUNBLGdCQUFNQyxVQUFVLEdBQUcsSUFBSUMsY0FBSixDQUFVL0IsS0FBVixFQUFpQkMsS0FBakIsRUFBd0IsSUFBeEIsRUFBOEI7QUFDN0MzQixZQUFBQSx3QkFBd0IsRUFBRSxrQkFEbUIsQ0FDQzs7QUFERCxXQUE5QixDQUFuQjtBQUdBLGdCQUFNWSxLQUFLLEdBQUcsTUFBTTRDLFVBQVUsQ0FBQ0UsUUFBWCxFQUFwQjtBQUNBLGdCQUFNQyxVQUFVLEdBQUcvQyxLQUFLLENBQUNnRCxJQUFOLENBQVdDLENBQUMsSUFBSUEsQ0FBQyxDQUFDOUIsSUFBRixLQUFXLGFBQVgsSUFBNEI4QixDQUFDLENBQUM5QixJQUFGLEtBQVcsYUFBdkQsQ0FBbkI7O0FBQ0EsY0FBSTRCLFVBQUosRUFBZ0I7QUFDWjtBQUNBRyxnQ0FBSUMsUUFBSixDQUFhO0FBQUNDLGNBQUFBLE1BQU0sRUFBRTtBQUFULGFBQWI7QUFDSCxXQUhELE1BR087QUFDSCxpQkFBS25DLFFBQUwsQ0FBYztBQUNWZCxjQUFBQSxrQkFBa0IsRUFBRSxJQURWO0FBQ2dCO0FBQzFCUixjQUFBQSxTQUFTLEVBQUUseUJBQUcsb0RBQUgsQ0FGRDtBQUdWO0FBQ0FLLGNBQUFBLEtBQUssRUFBRTtBQUpHLGFBQWQ7QUFNSDtBQUNKLFNBakJELENBaUJFLE9BQU82QixDQUFQLEVBQVU7QUFDUlEsVUFBQUEsT0FBTyxDQUFDZ0IsS0FBUixDQUFjLG9EQUFkLEVBQW9FeEIsQ0FBcEU7QUFDQVUsVUFBQUEsZ0JBQWdCLENBQUNWLENBQUQsQ0FBaEI7QUFDSDtBQUNKLE9BekJNLE1BeUJBO0FBQ0hRLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLHFEQUFaLEVBQW1FVCxDQUFuRTtBQUNBVSxRQUFBQSxnQkFBZ0IsQ0FBQ1YsQ0FBRCxDQUFoQjtBQUNIO0FBQ0o7QUFDSixHQXBQMkI7QUFzUDVCeUIsRUFBQUEsWUFBWSxFQUFFLFVBQVMxRCxRQUFULEVBQW1CO0FBQzdCLFNBQUtxQixRQUFMLENBQWM7QUFDVnRCLE1BQUFBLFNBQVMsRUFBRSxFQUREO0FBRVZELE1BQUFBLElBQUksRUFBRSxJQUZJO0FBR1ZFLE1BQUFBLFFBQVEsRUFBRUEsUUFIQTtBQUlWQyxNQUFBQSxXQUFXLEVBQUU7QUFKSCxLQUFkO0FBTUgsR0E3UDJCO0FBK1A1QjBELEVBQUFBLGtCQUFrQixFQUFFLFVBQVNDLFlBQVQsRUFBdUJoRixZQUF2QixFQUFxQ2lGLFdBQXJDLEVBQWtEL0UsU0FBbEQsRUFBNkQ7QUFDN0UsV0FBTyxLQUFLc0MsS0FBTCxDQUFXWCxZQUFYLENBQXdCcUQseUJBQXhCLENBQ0hGLFlBREcsRUFFSGhGLFlBRkcsRUFHSGlGLFdBSEcsRUFJSCxLQUFLaEUsS0FBTCxDQUFXZCxtQkFBWCxDQUErQjtBQUMzQmdGLE1BQUFBLGFBQWEsRUFBRW5GLFlBRFk7QUFFM0JvRixNQUFBQSxNQUFNLEVBQUUsS0FBSzVDLEtBQUwsQ0FBV1gsWUFBWCxDQUF3QndELGdCQUF4QixFQUZtQjtBQUczQkMsTUFBQUEsTUFBTSxFQUFFLEtBQUs5QyxLQUFMLENBQVdYLFlBQVgsQ0FBd0IwRCxvQkFBeEIsRUFIbUI7QUFJM0JDLE1BQUFBLFVBQVUsRUFBRXRGO0FBSmUsS0FBL0IsQ0FKRyxDQUFQO0FBV0gsR0EzUTJCO0FBNlE1QnVGLEVBQUFBLGlCQUFpQixFQUFFLGdCQUFlQyxPQUFmLEVBQXdCQyxRQUF4QixFQUFrQ0MsS0FBbEMsRUFBeUM7QUFDeEQsUUFBSSxDQUFDRixPQUFMLEVBQWM7QUFDVixVQUFJRyxHQUFHLEdBQUdGLFFBQVEsQ0FBQ0csT0FBVCxJQUFvQkgsUUFBUSxDQUFDSSxRQUFULEVBQTlCLENBRFUsQ0FFVjs7QUFDQSxVQUFJSixRQUFRLENBQUN4QixPQUFULEtBQXFCLDJCQUF6QixFQUFzRDtBQUNsRCxjQUFNNkIsUUFBUSxHQUFHLDhDQUNiTCxRQUFRLENBQUN6QixJQUFULENBQWMrQixVQURELEVBRWJOLFFBQVEsQ0FBQ3pCLElBQVQsQ0FBY2dDLGFBRkQsRUFFZ0I7QUFDN0IsaUNBQXVCLDBCQUNuQix3REFEbUIsQ0FETTtBQUk3QixjQUFJLDBCQUNBLDBEQURBO0FBSnlCLFNBRmhCLENBQWpCO0FBVUEsY0FBTUMsV0FBVyxHQUFHLDhDQUNoQlIsUUFBUSxDQUFDekIsSUFBVCxDQUFjK0IsVUFERSxFQUVoQk4sUUFBUSxDQUFDekIsSUFBVCxDQUFjZ0MsYUFGRSxFQUVhO0FBQzdCLGNBQUksMEJBQ0Esa0ZBREE7QUFEeUIsU0FGYixDQUFwQjtBQU9BTCxRQUFBQSxHQUFHLGdCQUFHLHVEQUNGLHdDQUFJRyxRQUFKLENBREUsZUFFRix3Q0FBSUcsV0FBSixDQUZFLENBQU47QUFJSCxPQXRCRCxNQXNCTyxJQUFJUixRQUFRLENBQUNTLGVBQVQsSUFBNEJULFFBQVEsQ0FBQ1MsZUFBVCxDQUF5QkMsT0FBekIsQ0FBaUMsZ0JBQWpDLElBQXFELENBQUMsQ0FBdEYsRUFBeUY7QUFDNUYsWUFBSUMsZUFBZSxHQUFHLEtBQXRCOztBQUNBLGFBQUssTUFBTUMsSUFBWCxJQUFtQlosUUFBUSxDQUFDYSxlQUE1QixFQUE2QztBQUN6Q0YsVUFBQUEsZUFBZSxJQUFJQyxJQUFJLENBQUNFLE1BQUwsQ0FBWUosT0FBWixDQUFvQixnQkFBcEIsSUFBd0MsQ0FBQyxDQUE1RDtBQUNIOztBQUNELFlBQUksQ0FBQ0MsZUFBTCxFQUFzQjtBQUNsQlQsVUFBQUEsR0FBRyxHQUFHLHlCQUFHLGtFQUFILENBQU47QUFDSDtBQUNKOztBQUNELFdBQUtwRCxRQUFMLENBQWM7QUFDVnZCLFFBQUFBLElBQUksRUFBRSxLQURJO0FBRVZHLFFBQUFBLFdBQVcsRUFBRSxLQUZIO0FBR1ZGLFFBQUFBLFNBQVMsRUFBRTBFO0FBSEQsT0FBZDtBQUtBO0FBQ0g7O0FBRURhLHFDQUFnQkMsdUJBQWhCLENBQXdDaEIsUUFBUSxDQUFDaUIsT0FBakQ7O0FBRUEsVUFBTUMsUUFBUSxHQUFHO0FBQ2J4RixNQUFBQSxXQUFXLEVBQUUsS0FEQTtBQUViVSxNQUFBQSxrQkFBa0IsRUFBRTRELFFBQVEsQ0FBQ2lCO0FBRmhCLEtBQWpCLENBN0N3RCxDQWtEeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxVQUFNRSxZQUFZLEdBQUdDLFNBQVMsQ0FBQ0MscUJBQVYsRUFBckI7QUFDQSxVQUFNQyxjQUFjLEdBQUdGLFNBQVMsQ0FBQ0csdUJBQVYsRUFBdkI7O0FBQ0EsUUFBSUosWUFBWSxJQUFJLENBQUNHLGNBQWpCLElBQW1DSCxZQUFZLEtBQUtuQixRQUFRLENBQUN3QixNQUFqRSxFQUF5RTtBQUNyRXRELE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUiwrQkFDMkJnRCxZQUQzQixrQkFDK0NuQixRQUFRLENBQUN3QixNQUR4RDtBQUdBTixNQUFBQSxRQUFRLENBQUM3RSx1QkFBVCxHQUFtQzhFLFlBQW5DO0FBQ0gsS0FMRCxNQUtPO0FBQ0hELE1BQUFBLFFBQVEsQ0FBQzdFLHVCQUFULEdBQW1DLElBQW5DO0FBQ0g7O0FBRUQsUUFBSTJELFFBQVEsQ0FBQ3lCLFlBQWIsRUFBMkI7QUFDdkIsWUFBTTdELEdBQUcsR0FBRyxNQUFNLEtBQUt0QyxLQUFMLENBQVdyQixVQUFYLENBQXNCO0FBQ3BDdUgsUUFBQUEsTUFBTSxFQUFFeEIsUUFBUSxDQUFDaUIsT0FEbUI7QUFFcENTLFFBQUFBLFFBQVEsRUFBRTFCLFFBQVEsQ0FBQzJCLFNBRmlCO0FBR3BDQyxRQUFBQSxhQUFhLEVBQUUsS0FBSy9FLEtBQUwsQ0FBV1gsWUFBWCxDQUF3QndELGdCQUF4QixFQUhxQjtBQUlwQ21DLFFBQUFBLGlCQUFpQixFQUFFLEtBQUtoRixLQUFMLENBQVdYLFlBQVgsQ0FBd0IwRCxvQkFBeEIsRUFKaUI7QUFLcENrQyxRQUFBQSxXQUFXLEVBQUU5QixRQUFRLENBQUN5QjtBQUxjLE9BQXRCLEVBTWYsS0FBSzVFLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JzRyxRQU5MLENBQWxCOztBQVFBLFdBQUtDLGFBQUwsQ0FBbUJwRSxHQUFuQixFQVR1QixDQVV2Qjs7O0FBQ0FzRCxNQUFBQSxRQUFRLENBQUMzRixJQUFULEdBQWdCLElBQWhCO0FBQ0gsS0FaRCxNQVlPO0FBQ0gyRixNQUFBQSxRQUFRLENBQUMzRixJQUFULEdBQWdCLEtBQWhCO0FBQ0EyRixNQUFBQSxRQUFRLENBQUNwRixpQkFBVCxHQUE2QixJQUE3QjtBQUNIOztBQUVELFNBQUtnQixRQUFMLENBQWNvRSxRQUFkO0FBQ0gsR0FqVzJCO0FBbVc1QmMsRUFBQUEsYUFBYSxFQUFFLFVBQVM5RixZQUFULEVBQXVCO0FBQ2xDLFFBQUksQ0FBQyxLQUFLWixLQUFMLENBQVdULEtBQWhCLEVBQXVCO0FBQ25CLGFBQU9vSCxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNIOztBQUNELFdBQU9oRyxZQUFZLENBQUNpRyxVQUFiLEdBQTBCQyxJQUExQixDQUFnQ0MsSUFBRCxJQUFRO0FBQzFDLFlBQU1DLE9BQU8sR0FBR0QsSUFBSSxDQUFDQyxPQUFyQjs7QUFDQSxXQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdELE9BQU8sQ0FBQ0UsTUFBNUIsRUFBb0MsRUFBRUQsQ0FBdEMsRUFBeUM7QUFDckMsWUFBSUQsT0FBTyxDQUFDQyxDQUFELENBQVAsQ0FBV0UsSUFBWCxLQUFvQixPQUF4QixFQUFpQztBQUM3QixnQkFBTUMsV0FBVyxHQUFHSixPQUFPLENBQUNDLENBQUQsQ0FBM0I7QUFDQUcsVUFBQUEsV0FBVyxDQUFDbkUsSUFBWixHQUFtQjtBQUFFMUQsWUFBQUEsS0FBSyxFQUFFLEtBQUtTLEtBQUwsQ0FBV1Q7QUFBcEIsV0FBbkI7QUFDQXFCLFVBQUFBLFlBQVksQ0FBQ3lHLFNBQWIsQ0FBdUJELFdBQXZCLEVBQW9DTixJQUFwQyxDQUF5QyxNQUFNO0FBQzNDbEUsWUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksMkJBQTJCLEtBQUs3QyxLQUFMLENBQVdULEtBQWxEO0FBQ0gsV0FGRCxFQUVJcUUsS0FBRCxJQUFXO0FBQ1ZoQixZQUFBQSxPQUFPLENBQUNnQixLQUFSLENBQWMsa0NBQWtDQSxLQUFoRDtBQUNILFdBSkQ7QUFLSDtBQUNKO0FBQ0osS0FiTSxFQWFIQSxLQUFELElBQVc7QUFDVmhCLE1BQUFBLE9BQU8sQ0FBQ2dCLEtBQVIsQ0FBYywyQkFBMkJBLEtBQXpDO0FBQ0gsS0FmTSxDQUFQO0FBZ0JILEdBdlgyQjtBQXlYNUJuRSxFQUFBQSxZQUFZLEVBQUUsVUFBUzZILEVBQVQsRUFBYTtBQUN2QkEsSUFBQUEsRUFBRSxDQUFDQyxjQUFIO0FBQ0FELElBQUFBLEVBQUUsQ0FBQ0UsZUFBSDtBQUNBLFNBQUt4SCxLQUFMLENBQVdQLFlBQVg7QUFDSCxHQTdYMkI7O0FBK1g1QmdJLEVBQUFBLGlCQUFpQixDQUFDSCxFQUFELEVBQUs7QUFDbEJBLElBQUFBLEVBQUUsQ0FBQ0MsY0FBSDtBQUNBRCxJQUFBQSxFQUFFLENBQUNFLGVBQUg7O0FBQ0EsU0FBS3RHLGNBQUw7O0FBQ0EsU0FBS00sUUFBTCxDQUFjO0FBQ1Z2QixNQUFBQSxJQUFJLEVBQUUsS0FESTtBQUVWRyxNQUFBQSxXQUFXLEVBQUUsS0FGSDtBQUdWRSxNQUFBQSxLQUFLLEVBQUUvQjtBQUhHLEtBQWQ7QUFLSCxHQXhZMkI7O0FBMFk1QixRQUFNbUosNkJBQU4sR0FBc0M7QUFDbEMsU0FBS2xHLFFBQUwsQ0FBYztBQUNWbEIsTUFBQUEsS0FBSyxFQUFFL0I7QUFERyxLQUFkO0FBR0gsR0E5WTJCOztBQWdaNUJvSixFQUFBQSx3QkFBd0IsQ0FBQ0wsRUFBRCxFQUFLO0FBQ3pCQSxJQUFBQSxFQUFFLENBQUNDLGNBQUg7QUFDQUQsSUFBQUEsRUFBRSxDQUFDRSxlQUFIO0FBQ0EsU0FBS2hHLFFBQUwsQ0FBYztBQUNWbEIsTUFBQUEsS0FBSyxFQUFFaEM7QUFERyxLQUFkO0FBR0gsR0F0WjJCOztBQXdaNUJ5RSxFQUFBQSxvQkFBb0IsRUFBRSxVQUFTNkUsSUFBVCxFQUFlO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBSUMsWUFBWSxHQUFHeEgsT0FBTyxDQUFDLEtBQUtrQixLQUFMLENBQVdwQixRQUFYLENBQW9CWCxLQUFyQixDQUExQixDQUxpQyxDQU9qQztBQUNBO0FBQ0E7O0FBQ0EsUUFBSSxDQUFDLEtBQUsrQixLQUFMLENBQVdwQixRQUFYLENBQW9Cc0csUUFBekIsRUFBbUNvQixZQUFZLEdBQUcsSUFBZjtBQUVuQyxVQUFNQyxjQUFjLEdBQUc7QUFDbkJDLE1BQUFBLFFBQVEsRUFBRSxLQUFLeEcsS0FBTCxDQUFXcEIsUUFBWCxDQUFvQjRILFFBRFg7QUFFbkJ0QixNQUFBQSxRQUFRLEVBQUUsS0FBS2xGLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JzRyxRQUZYO0FBR25CdUIsTUFBQUEsMkJBQTJCLEVBQUUsS0FBS2hJLEtBQUwsQ0FBV0w7QUFIckIsS0FBdkI7QUFLQSxRQUFJaUksSUFBSixFQUFVRSxjQUFjLENBQUNGLElBQWYsR0FBc0JBLElBQXRCO0FBQ1YsUUFBSUMsWUFBWSxLQUFLSSxTQUFqQixJQUE4QkosWUFBWSxLQUFLLElBQW5ELEVBQXlEQyxjQUFjLENBQUNJLGFBQWYsR0FBK0JMLFlBQS9CO0FBQ3pELFdBQU8sS0FBS3RHLEtBQUwsQ0FBV1gsWUFBWCxDQUF3QnVILGVBQXhCLENBQXdDTCxjQUF4QyxDQUFQO0FBQ0gsR0E1YTJCO0FBOGE1Qk0sRUFBQUEsZ0JBQWdCLEVBQUUsWUFBVztBQUN6QixXQUFPO0FBQ0hyRSxNQUFBQSxZQUFZLEVBQUUsS0FBS3hDLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JYLEtBRC9CO0FBRUg2SSxNQUFBQSxZQUFZLEVBQUUsS0FBSzlHLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JrSSxZQUYvQjtBQUdIQyxNQUFBQSxXQUFXLEVBQUUsS0FBSy9HLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JtSTtBQUg5QixLQUFQO0FBS0gsR0FwYjJCO0FBc2I1QjtBQUNBO0FBQ0E7QUFDQUMsRUFBQUEsc0JBQXNCLEVBQUUsZ0JBQWVqQixFQUFmLEVBQW1CO0FBQ3ZDQSxJQUFBQSxFQUFFLENBQUNDLGNBQUg7QUFFQSxVQUFNaUIsYUFBYSxHQUFHLE1BQU0xQyxTQUFTLENBQUMyQyxXQUFWLENBQXNCO0FBQUNDLE1BQUFBLFdBQVcsRUFBRTtBQUFkLEtBQXRCLENBQTVCOztBQUNBLFFBQUksQ0FBQ0YsYUFBTCxFQUFvQjtBQUNoQjtBQUNBLFdBQUt4SSxLQUFMLENBQVdQLFlBQVg7QUFDSDtBQUNKLEdBamMyQjs7QUFtYzVCa0osRUFBQUEscUJBQXFCLEdBQUc7QUFDcEIsVUFBTUMsa0JBQWtCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix5QkFBakIsQ0FBM0I7QUFDQSxVQUFNQyxZQUFZLEdBQUdGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixtQkFBakIsQ0FBckI7QUFDQSxVQUFNRSxtQkFBbUIsR0FBR0gsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDBCQUFqQixDQUE1Qjs7QUFFQSxRQUFJOUcsbUJBQVVDLEdBQVYsR0FBZ0IscUJBQWhCLENBQUosRUFBNEM7QUFDeEMsYUFBTyxJQUFQO0FBQ0gsS0FQbUIsQ0FTcEI7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLFFBQUl6RCxjQUFjLElBQUksS0FBSytDLEtBQUwsQ0FBV2pCLEtBQVgsS0FBcUJoQyxvQkFBdkMsSUFBK0QsQ0FBQyxLQUFLaUQsS0FBTCxDQUFXYixrQkFBL0UsRUFBbUc7QUFDL0YsMEJBQU8sdURBQ0gsNkJBQUMsa0JBQUQ7QUFDSSxRQUFBLFFBQVEsRUFBRSxLQUFLYSxLQUFMLENBQVcxQixVQUR6QjtBQUVJLFFBQUEsUUFBUSxFQUFFLEtBQUtpQztBQUZuQixRQURHLENBQVA7QUFNSDs7QUFFRCxVQUFNbUgsa0JBQWtCLEdBQUcsRUFBM0I7O0FBQ0EsUUFBSXpLLGNBQUosRUFBb0I7QUFDaEJ5SyxNQUFBQSxrQkFBa0IsQ0FBQ0MsYUFBbkIsR0FBbUMsS0FBS3hCLDZCQUF4QztBQUNBdUIsTUFBQUEsa0JBQWtCLENBQUNFLFVBQW5CLEdBQWdDLHlCQUFHLE1BQUgsQ0FBaEM7QUFDQUYsTUFBQUEsa0JBQWtCLENBQUNHLFdBQW5CLEdBQWlDLGlCQUFqQztBQUNIOztBQUVELFFBQUlDLGFBQWEsR0FBRyxJQUFwQjs7QUFDQSxZQUFRLEtBQUs5SCxLQUFMLENBQVcxQixVQUFuQjtBQUNJLFdBQUtDLFVBQVUsQ0FBQzZCLElBQWhCO0FBQ0k7O0FBQ0osV0FBSzdCLFVBQVUsQ0FBQzhCLE9BQWhCO0FBQ0l5SCxRQUFBQSxhQUFhLGdCQUFHLDZCQUFDLG1CQUFEO0FBQ1osVUFBQSxZQUFZLEVBQUUsS0FBS3JKLEtBQUwsQ0FBV1osWUFEYjtBQUVaLFVBQUEsb0JBQW9CLEVBQUUsS0FBS1ksS0FBTCxDQUFXTixvQkFGckI7QUFHWixVQUFBLFdBQVcsRUFBRTtBQUhELFdBSVJ1SixrQkFKUSxFQUFoQjtBQU1BOztBQUNKLFdBQUtuSixVQUFVLENBQUMrQixRQUFoQjtBQUNJd0gsUUFBQUEsYUFBYSxnQkFBRyw2QkFBQyxZQUFEO0FBQ1osVUFBQSxZQUFZLEVBQUUsS0FBS3JKLEtBQUwsQ0FBV1osWUFEYjtBQUVaLFVBQUEsb0JBQW9CLEVBQUUsS0FBS1ksS0FBTCxDQUFXTixvQkFGckI7QUFHWixVQUFBLFdBQVcsRUFBRSxHQUhEO0FBSVosVUFBQSx3Q0FBd0MsRUFBRTtBQUo5QixXQUtSdUosa0JBTFEsRUFBaEI7QUFPQTtBQW5CUjs7QUFzQkEsd0JBQU8sdURBQ0gsNkJBQUMsa0JBQUQ7QUFDSSxNQUFBLFFBQVEsRUFBRSxLQUFLMUgsS0FBTCxDQUFXMUIsVUFEekI7QUFFSSxNQUFBLFFBQVEsRUFBRSxLQUFLaUM7QUFGbkIsTUFERyxFQUtGdUgsYUFMRSxDQUFQO0FBT0gsR0E5ZjJCOztBQWdnQjVCQyxFQUFBQSx1QkFBdUIsR0FBRztBQUN0QixRQUFJOUssY0FBYyxJQUFJLEtBQUsrQyxLQUFMLENBQVdqQixLQUFYLEtBQXFCL0Isa0JBQTNDLEVBQStEO0FBQzNELGFBQU8sSUFBUDtBQUNIOztBQUVELFVBQU1nTCxlQUFlLEdBQUdWLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw0QkFBakIsQ0FBeEI7QUFDQSxVQUFNVSxPQUFPLEdBQUdYLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixrQkFBakIsQ0FBaEI7QUFDQSxVQUFNVyxnQkFBZ0IsR0FBR1osR0FBRyxDQUFDQyxZQUFKLENBQWlCLHVCQUFqQixDQUF6Qjs7QUFFQSxRQUFJLEtBQUt2SCxLQUFMLENBQVdYLFlBQVgsSUFBMkIsS0FBS1csS0FBTCxDQUFXbkIsV0FBMUMsRUFBdUQ7QUFDbkQsMEJBQU8sNkJBQUMsZUFBRDtBQUNILFFBQUEsWUFBWSxFQUFFLEtBQUttQixLQUFMLENBQVdYLFlBRHRCO0FBRUgsUUFBQSxXQUFXLEVBQUUsS0FBS21DLG9CQUZmO0FBR0gsUUFBQSxjQUFjLEVBQUUsS0FBS3lCLGlCQUhsQjtBQUlILFFBQUEsTUFBTSxFQUFFLEtBQUs0RCxnQkFBTCxFQUpMO0FBS0gsUUFBQSxpQkFBaUIsRUFBRSxLQUFLdEUsa0JBTHJCO0FBTUgsUUFBQSxTQUFTLEVBQUUsS0FBSzlELEtBQUwsQ0FBV2YsU0FObkI7QUFPSCxRQUFBLFlBQVksRUFBRSxLQUFLZSxLQUFMLENBQVdqQixZQVB0QjtBQVFILFFBQUEsUUFBUSxFQUFFLEtBQUtpQixLQUFMLENBQVdiLEtBUmxCO0FBU0gsUUFBQSxJQUFJLEVBQUU7QUFUSCxRQUFQO0FBV0gsS0FaRCxNQVlPLElBQUksQ0FBQyxLQUFLb0MsS0FBTCxDQUFXWCxZQUFaLElBQTRCLENBQUMsS0FBS1csS0FBTCxDQUFXdEIsSUFBNUMsRUFBa0Q7QUFDckQsYUFBTyxJQUFQO0FBQ0gsS0FGTSxNQUVBLElBQUksS0FBS3NCLEtBQUwsQ0FBV3RCLElBQVgsSUFBbUIsQ0FBQyxLQUFLc0IsS0FBTCxDQUFXaEIsS0FBbkMsRUFBMEM7QUFDN0MsMEJBQU87QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLHNCQUNILDZCQUFDLE9BQUQsT0FERyxDQUFQO0FBR0gsS0FKTSxNQUlBLElBQUksS0FBS2dCLEtBQUwsQ0FBV2hCLEtBQVgsQ0FBaUIyRyxNQUFyQixFQUE2QjtBQUNoQyxVQUFJUyx3QkFBd0IsR0FBRyxJQUEvQixDQURnQyxDQUVoQztBQUNBOztBQUNBLFVBQ0luSixjQUFjLElBQ2QsQ0FBQ3dELG1CQUFVQyxHQUFWLEdBQWdCLHFCQUFoQixDQURELElBRUEsS0FBS1YsS0FBTCxDQUFXMUIsVUFBWCxLQUEwQkMsVUFBVSxDQUFDNkIsSUFIekMsRUFJRTtBQUNFZ0csUUFBQUEsd0JBQXdCLEdBQUcsS0FBS0Esd0JBQWhDO0FBQ0g7O0FBRUQsMEJBQU8sNkJBQUMsZ0JBQUQ7QUFDSCxRQUFBLGVBQWUsRUFBRSxLQUFLcEcsS0FBTCxDQUFXcEIsUUFBWCxDQUFvQjRILFFBRGxDO0FBRUgsUUFBQSxZQUFZLEVBQUUsS0FBS3hHLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JYLEtBRi9CO0FBR0gsUUFBQSxtQkFBbUIsRUFBRSxLQUFLK0IsS0FBTCxDQUFXcEIsUUFBWCxDQUFvQmtJLFlBSHRDO0FBSUgsUUFBQSxrQkFBa0IsRUFBRSxLQUFLOUcsS0FBTCxDQUFXcEIsUUFBWCxDQUFvQm1JLFdBSnJDO0FBS0gsUUFBQSxlQUFlLEVBQUUsS0FBSy9HLEtBQUwsQ0FBV3BCLFFBQVgsQ0FBb0JzRyxRQUxsQztBQU1ILFFBQUEsZUFBZSxFQUFFLEtBQUs1QyxZQU5uQjtBQU9ILFFBQUEsd0JBQXdCLEVBQUU4RCx3QkFQdkI7QUFRSCxRQUFBLEtBQUssRUFBRSxLQUFLcEcsS0FBTCxDQUFXaEIsS0FSZjtBQVNILFFBQUEsWUFBWSxFQUFFLEtBQUtQLEtBQUwsQ0FBV1osWUFUdEI7QUFVSCxRQUFBLFNBQVMsRUFBRSxDQUFDLEtBQUttQyxLQUFMLENBQVdiLGtCQVZwQjtBQVdILFFBQUEsc0JBQXNCLEVBQUUsS0FBS2EsS0FBTCxDQUFXVjtBQVhoQyxRQUFQO0FBYUg7QUFDSixHQXJqQjJCOztBQXVqQjVCNkksRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxVQUFVLEdBQUdkLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixpQkFBakIsQ0FBbkI7QUFDQSxVQUFNYyxRQUFRLEdBQUdmLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixlQUFqQixDQUFqQjtBQUNBLFVBQU1lLGdCQUFnQixHQUFHaEIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDJCQUFqQixDQUF6QjtBQUVBLFFBQUk1SSxTQUFKO0FBQ0EsVUFBTTRKLEdBQUcsR0FBRyxLQUFLdkksS0FBTCxDQUFXckIsU0FBdkI7O0FBQ0EsUUFBSTRKLEdBQUosRUFBUztBQUNMNUosTUFBQUEsU0FBUyxnQkFBRztBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FBa0M0SixHQUFsQyxDQUFaO0FBQ0g7O0FBRUQsUUFBSUMsaUJBQUo7O0FBQ0EsUUFBSSxDQUFDLEtBQUt4SSxLQUFMLENBQVdkLGFBQWhCLEVBQStCO0FBQzNCLFlBQU11SixPQUFPLEdBQUcseUJBQVc7QUFDdkIsMEJBQWtCLElBREs7QUFFdkIsZ0NBQXdCLElBRkQ7QUFHdkIsd0NBQWdDLENBQUMsS0FBS3pJLEtBQUwsQ0FBV2I7QUFIckIsT0FBWCxDQUFoQjtBQUtBcUosTUFBQUEsaUJBQWlCLGdCQUNiO0FBQUssUUFBQSxTQUFTLEVBQUVDO0FBQWhCLFNBQ0ssS0FBS3pJLEtBQUwsQ0FBV1osZUFEaEIsQ0FESjtBQUtIOztBQUVELFVBQU1zSixNQUFNLGdCQUFHO0FBQUcsTUFBQSxTQUFTLEVBQUMsd0JBQWI7QUFBc0MsTUFBQSxPQUFPLEVBQUUsS0FBS3hLLFlBQXBEO0FBQWtFLE1BQUEsSUFBSSxFQUFDO0FBQXZFLE9BQ1QseUJBQUcsaUJBQUgsQ0FEUyxDQUFmLENBekJlLENBNkJmOzs7QUFDQSxRQUFJeUssTUFBSjs7QUFDQSxRQUFLMUwsY0FBYyxJQUFJLEtBQUsrQyxLQUFMLENBQVdqQixLQUFYLEtBQXFCL0Isa0JBQXhDLElBQStELEtBQUtnRCxLQUFMLENBQVduQixXQUE5RSxFQUEyRjtBQUN2RjhKLE1BQUFBLE1BQU0sZ0JBQUc7QUFBRyxRQUFBLFNBQVMsRUFBQyx3QkFBYjtBQUFzQyxRQUFBLE9BQU8sRUFBRSxLQUFLekMsaUJBQXBEO0FBQXVFLFFBQUEsSUFBSSxFQUFDO0FBQTVFLFNBQ0gseUJBQUcsU0FBSCxDQURHLENBQVQ7QUFHSDs7QUFFRCxRQUFJMEMsSUFBSjs7QUFDQSxRQUFJLEtBQUs1SSxLQUFMLENBQVdmLGlCQUFmLEVBQWtDO0FBQzlCLFVBQUk0SixXQUFKOztBQUNBLFVBQUksS0FBSzdJLEtBQUwsQ0FBV1IsdUJBQWYsRUFBd0M7QUFDcENxSixRQUFBQSxXQUFXLGdCQUFHLHVEQUNWLHdDQUFJLHlCQUNBLDJFQUNBLHVEQUZBLEVBRXlEO0FBQ3JEQyxVQUFBQSxZQUFZLEVBQUUsS0FBSzlJLEtBQUwsQ0FBV1Qsa0JBRDRCO0FBRXJEd0osVUFBQUEsY0FBYyxFQUFFLEtBQUsvSSxLQUFMLENBQVdSO0FBRjBCLFNBRnpELENBQUosQ0FEVSxlQVFWLHFEQUFHLDZCQUFDLGdCQUFEO0FBQWtCLFVBQUEsT0FBTyxFQUFDLE1BQTFCO0FBQWlDLFVBQUEsU0FBUyxFQUFDLGVBQTNDO0FBQTJELFVBQUEsT0FBTyxFQUFFLEtBQUt3SDtBQUF6RSxXQUNFLHlCQUFHLGdDQUFILENBREYsQ0FBSCxDQVJVLENBQWQ7QUFZSCxPQWJELE1BYU8sSUFBSSxLQUFLaEgsS0FBTCxDQUFXcEIsUUFBWCxDQUFvQnNHLFFBQXhCLEVBQWtDO0FBQ3JDO0FBQ0EyRCxRQUFBQSxXQUFXLGdCQUFHLHlDQUFLLHlCQUNmLG9DQURlLEVBQ3VCLEVBRHZCLEVBRWY7QUFDSUcsVUFBQUEsQ0FBQyxFQUFHQyxHQUFELGlCQUFTO0FBQUcsWUFBQSxJQUFJLEVBQUMsU0FBUjtBQUFrQixZQUFBLE9BQU8sRUFBRSxLQUFLakM7QUFBaEMsYUFBeURpQyxHQUF6RDtBQURoQixTQUZlLENBQUwsQ0FBZDtBQU1ILE9BUk0sTUFRQTtBQUNIO0FBQ0E7QUFDQTtBQUNBSixRQUFBQSxXQUFXLGdCQUFHLHlDQUFLLHlCQUNmLHFFQURlLEVBQ3dELEVBRHhELEVBRWY7QUFDSUcsVUFBQUEsQ0FBQyxFQUFHQyxHQUFELGlCQUFTO0FBQUcsWUFBQSxJQUFJLEVBQUMsU0FBUjtBQUFrQixZQUFBLE9BQU8sRUFBRSxLQUFLakM7QUFBaEMsYUFBeURpQyxHQUF6RDtBQURoQixTQUZlLENBQUwsQ0FBZDtBQU1IOztBQUNETCxNQUFBQSxJQUFJLGdCQUFHLHVEQUNILHlDQUFLLHlCQUFHLHlCQUFILENBQUwsQ0FERyxFQUVEQyxXQUZDLENBQVA7QUFJSCxLQXRDRCxNQXNDTztBQUNIRCxNQUFBQSxJQUFJLGdCQUFHLHVEQUNILHlDQUFNLHlCQUFHLHFCQUFILENBQU4sQ0FERyxFQUVEakssU0FGQyxFQUdENkosaUJBSEMsRUFJRCxLQUFLcEIscUJBQUwsRUFKQyxFQUtELEtBQUtXLHVCQUFMLEVBTEMsRUFNRFksTUFOQyxFQU9ERCxNQVBDLENBQVA7QUFTSDs7QUFFRCx3QkFDSSw2QkFBQyxpQkFBRCxxQkFDSSw2QkFBQyxVQUFELE9BREosZUFFSSw2QkFBQyxRQUFELFFBQ01FLElBRE4sQ0FGSixDQURKO0FBUUg7QUF2cEIyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTgsIDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5LCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IE1hdHJpeCBmcm9tICdtYXRyaXgtanMtc2RrJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCwgX3RkIH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBTZGtDb25maWcgZnJvbSAnLi4vLi4vLi4vU2RrQ29uZmlnJztcbmltcG9ydCB7IG1lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IgfSBmcm9tICcuLi8uLi8uLi91dGlscy9FcnJvclV0aWxzJztcbmltcG9ydCAqIGFzIFNlcnZlclR5cGUgZnJvbSAnLi4vLi4vdmlld3MvYXV0aC9TZXJ2ZXJUeXBlU2VsZWN0b3InO1xuaW1wb3J0IEF1dG9EaXNjb3ZlcnlVdGlscywge1ZhbGlkYXRlZFNlcnZlckNvbmZpZ30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0F1dG9EaXNjb3ZlcnlVdGlsc1wiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCAqIGFzIExpZmVjeWNsZSBmcm9tICcuLi8uLi8uLi9MaWZlY3ljbGUnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBBdXRoUGFnZSBmcm9tIFwiLi4vLi4vdmlld3MvYXV0aC9BdXRoUGFnZVwiO1xuaW1wb3J0IExvZ2luIGZyb20gXCIuLi8uLi8uLi9Mb2dpblwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5cbi8vIFBoYXNlc1xuLy8gU2hvdyBjb250cm9scyB0byBjb25maWd1cmUgc2VydmVyIGRldGFpbHNcbmNvbnN0IFBIQVNFX1NFUlZFUl9ERVRBSUxTID0gMDtcbi8vIFNob3cgdGhlIGFwcHJvcHJpYXRlIHJlZ2lzdHJhdGlvbiBmbG93KHMpIGZvciB0aGUgc2VydmVyXG5jb25zdCBQSEFTRV9SRUdJU1RSQVRJT04gPSAxO1xuXG4vLyBFbmFibGUgcGhhc2VzIGZvciByZWdpc3RyYXRpb25cbmNvbnN0IFBIQVNFU19FTkFCTEVEID0gdHJ1ZTtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSZWdpc3RyYXRpb24nLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIENhbGxlZCB3aGVuIHRoZSB1c2VyIGhhcyBsb2dnZWQgaW4uIFBhcmFtczpcbiAgICAgICAgLy8gLSBvYmplY3Qgd2l0aCB1c2VySWQsIGRldmljZUlkLCBob21lc2VydmVyVXJsLCBpZGVudGl0eVNlcnZlclVybCwgYWNjZXNzVG9rZW5cbiAgICAgICAgLy8gLSBUaGUgdXNlcidzIHBhc3N3b3JkLCBpZiBhdmFpbGFibGUgYW5kIGFwcGxpY2FibGUgKG1heSBiZSBjYWNoZWQgaW4gbWVtb3J5XG4gICAgICAgIC8vICAgZm9yIGEgc2hvcnQgdGltZSBzbyB0aGUgdXNlciBpcyBub3QgcmVxdWlyZWQgdG8gcmUtZW50ZXIgdGhlaXIgcGFzc3dvcmRcbiAgICAgICAgLy8gICBmb3Igb3BlcmF0aW9ucyBsaWtlIHVwbG9hZGluZyBjcm9zcy1zaWduaW5nIGtleXMpLlxuICAgICAgICBvbkxvZ2dlZEluOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIGNsaWVudFNlY3JldDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgc2Vzc2lvbklkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBtYWtlUmVnaXN0cmF0aW9uVXJsOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBpZFNpZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgc2VydmVyQ29uZmlnOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihWYWxpZGF0ZWRTZXJ2ZXJDb25maWcpLmlzUmVxdWlyZWQsXG4gICAgICAgIGJyYW5kOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBlbWFpbDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gcmVnaXN0cmF0aW9uIHNob3VsZG4ndCBrbm93IG9yIGNhcmUgaG93IGxvZ2luIGlzIGRvbmUuXG4gICAgICAgIG9uTG9naW5DbGljazogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25TZXJ2ZXJDb25maWdDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIGRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgc2VydmVyVHlwZSA9IFNlcnZlclR5cGUuZ2V0VHlwZUZyb21TZXJ2ZXJDb25maWcodGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgICAgIC8vIFdlIHJlbWVtYmVyIHRoZSB2YWx1ZXMgZW50ZXJlZCBieSB0aGUgdXNlciBiZWNhdXNlXG4gICAgICAgICAgICAvLyB0aGUgcmVnaXN0cmF0aW9uIGZvcm0gd2lsbCBiZSB1bm1vdW50ZWQgZHVyaW5nIHRoZVxuICAgICAgICAgICAgLy8gY291cnNlIG9mIHJlZ2lzdHJhdGlvbiwgYnV0IGlmIHRoZXJlJ3MgYW4gZXJyb3Igd2VcbiAgICAgICAgICAgIC8vIHdhbnQgdG8gYnJpbmcgYmFjayB0aGUgcmVnaXN0cmF0aW9uIGZvcm0gd2l0aCB0aGVcbiAgICAgICAgICAgIC8vIHZhbHVlcyB0aGUgdXNlciBlbnRlcmVkIHN0aWxsIGluIGl0LiBXZSBjYW4ga2VlcFxuICAgICAgICAgICAgLy8gdGhlbSBpbiB0aGlzIGNvbXBvbmVudCdzIHN0YXRlIHNpbmNlIHRoaXMgY29tcG9uZW50XG4gICAgICAgICAgICAvLyBwZXJzaXN0IGZvciB0aGUgZHVyYXRpb24gb2YgdGhlIHJlZ2lzdHJhdGlvbiBwcm9jZXNzLlxuICAgICAgICAgICAgZm9ybVZhbHM6IHtcbiAgICAgICAgICAgICAgICBlbWFpbDogdGhpcy5wcm9wcy5lbWFpbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyB0cnVlIGlmIHdlJ3JlIHdhaXRpbmcgZm9yIHRoZSB1c2VyIHRvIGNvbXBsZXRlXG4gICAgICAgICAgICAvLyB1c2VyLWludGVyYWN0aXZlIGF1dGhcbiAgICAgICAgICAgIC8vIElmIHdlJ3ZlIGJlZW4gZ2l2ZW4gYSBzZXNzaW9uIElELCB3ZSdyZSByZXN1bWluZ1xuICAgICAgICAgICAgLy8gc3RyYWlnaHQgYmFjayBpbnRvIFVJIGF1dGhcbiAgICAgICAgICAgIGRvaW5nVUlBdXRoOiBCb29sZWFuKHRoaXMucHJvcHMuc2Vzc2lvbklkKSxcbiAgICAgICAgICAgIHNlcnZlclR5cGUsXG4gICAgICAgICAgICAvLyBQaGFzZSBvZiB0aGUgb3ZlcmFsbCByZWdpc3RyYXRpb24gZGlhbG9nLlxuICAgICAgICAgICAgcGhhc2U6IFBIQVNFX1JFR0lTVFJBVElPTixcbiAgICAgICAgICAgIGZsb3dzOiBudWxsLFxuICAgICAgICAgICAgLy8gSWYgc2V0LCB3ZSd2ZSByZWdpc3RlcmVkIGJ1dCBhcmUgbm90IGdvaW5nIHRvIGxvZ1xuICAgICAgICAgICAgLy8gdGhlIHVzZXIgaW4gdG8gdGhlaXIgbmV3IGFjY291bnQgYXV0b21hdGljYWxseS5cbiAgICAgICAgICAgIGNvbXBsZXRlZE5vU2lnbmluOiBmYWxzZSxcblxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybSBsaXZlbGluZXNzIGNoZWNrcyBsYXRlciwgYnV0IGZvciBub3cgc3VwcHJlc3MgdGhlIGVycm9ycy5cbiAgICAgICAgICAgIC8vIFdlIGFsc28gdHJhY2sgdGhlIHNlcnZlciBkZWFkIGVycm9ycyBpbmRlcGVuZGVudGx5IG9mIHRoZSByZWd1bGFyIGVycm9ycyBzb1xuICAgICAgICAgICAgLy8gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGRpZmZlcmVudGx5LCBhbmQgb3ZlcnJpZGUgYW55IG90aGVyIGVycm9yIHRoZSB1c2VyIG1heVxuICAgICAgICAgICAgLy8gYmUgc2VlaW5nLlxuICAgICAgICAgICAgc2VydmVySXNBbGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHNlcnZlckVycm9ySXNGYXRhbDogZmFsc2UsXG4gICAgICAgICAgICBzZXJ2ZXJEZWFkRXJyb3I6IFwiXCIsXG5cbiAgICAgICAgICAgIC8vIE91ciBtYXRyaXggY2xpZW50IC0gcGFydCBvZiBzdGF0ZSBiZWNhdXNlIHdlIGNhbid0IHJlbmRlciB0aGUgVUkgYXV0aFxuICAgICAgICAgICAgLy8gY29tcG9uZW50IHdpdGhvdXQgaXQuXG4gICAgICAgICAgICBtYXRyaXhDbGllbnQ6IG51bGwsXG5cbiAgICAgICAgICAgIC8vIHdoZXRoZXIgdGhlIEhTIHJlcXVpcmVzIGFuIElEIHNlcnZlciB0byByZWdpc3RlciB3aXRoIGEgdGhyZWVwaWRcbiAgICAgICAgICAgIHNlcnZlclJlcXVpcmVzSWRTZXJ2ZXI6IG51bGwsXG5cbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIElEIHdlJ3ZlIGp1c3QgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgcmVnaXN0ZXJlZFVzZXJuYW1lOiBudWxsLFxuXG4gICAgICAgICAgICAvLyBpZiBhIGRpZmZlcmVudCB1c2VyIElEIHRvIHRoZSBvbmUgd2UganVzdCByZWdpc3RlcmVkIGlzIGxvZ2dlZCBpbixcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIHVzZXIgSUQgdGhhdCdzIGxvZ2dlZCBpbi5cbiAgICAgICAgICAgIGRpZmZlcmVudExvZ2dlZEluVXNlcklkOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9yZXBsYWNlQ2xpZW50KCk7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIHdpdGggYXBwcm9wcmlhdGUgbGlmZWN5Y2xlIGV2ZW50XG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV3UHJvcHMpIHtcbiAgICAgICAgaWYgKG5ld1Byb3BzLnNlcnZlckNvbmZpZy5oc1VybCA9PT0gdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwgJiZcbiAgICAgICAgICAgIG5ld1Byb3BzLnNlcnZlckNvbmZpZy5pc1VybCA9PT0gdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaXNVcmwpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9yZXBsYWNlQ2xpZW50KG5ld1Byb3BzLnNlcnZlckNvbmZpZyk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNhc2VzIHdoZXJlIHRoZSB1c2VyIGVudGVycyBcImh0dHBzOi8vbWF0cml4Lm9yZ1wiIGZvciB0aGVpciBzZXJ2ZXJcbiAgICAgICAgLy8gZnJvbSB0aGUgYWR2YW5jZWQgb3B0aW9uIC0gd2Ugc2hvdWxkIGRlZmF1bHQgdG8gRlJFRSBhdCB0aGF0IHBvaW50LlxuICAgICAgICBjb25zdCBzZXJ2ZXJUeXBlID0gU2VydmVyVHlwZS5nZXRUeXBlRnJvbVNlcnZlckNvbmZpZyhuZXdQcm9wcy5zZXJ2ZXJDb25maWcpO1xuICAgICAgICBpZiAoc2VydmVyVHlwZSAhPT0gdGhpcy5zdGF0ZS5zZXJ2ZXJUeXBlKSB7XG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgcGhhc2UgdG8gZGVmYXVsdCBwaGFzZSBmb3IgdGhlIHNlcnZlciB0eXBlLlxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc2VydmVyVHlwZSxcbiAgICAgICAgICAgICAgICBwaGFzZTogdGhpcy5nZXREZWZhdWx0UGhhc2VGb3JTZXJ2ZXJUeXBlKHNlcnZlclR5cGUpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFBoYXNlRm9yU2VydmVyVHlwZSh0eXBlKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBTZXJ2ZXJUeXBlLkZSRUU6IHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIGRpcmVjdGx5IHRvIHRoZSByZWdpc3RyYXRpb24gcGhhc2Ugc2luY2UgdGhlIHNlcnZlclxuICAgICAgICAgICAgICAgIC8vIGRldGFpbHMgYXJlIGZpeGVkLlxuICAgICAgICAgICAgICAgIHJldHVybiBQSEFTRV9SRUdJU1RSQVRJT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFNlcnZlclR5cGUuUFJFTUlVTTpcbiAgICAgICAgICAgIGNhc2UgU2VydmVyVHlwZS5BRFZBTkNFRDpcbiAgICAgICAgICAgICAgICByZXR1cm4gUEhBU0VfU0VSVkVSX0RFVEFJTFM7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25TZXJ2ZXJUeXBlQ2hhbmdlKHR5cGUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzZXJ2ZXJUeXBlOiB0eXBlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBXaGVuIGNoYW5naW5nIHNlcnZlciB0eXBlcywgc2V0IHRoZSBIUyAvIElTIFVSTHMgdG8gcmVhc29uYWJsZSBkZWZhdWx0cyBmb3IgdGhlXG4gICAgICAgIC8vIHRoZSBuZXcgdHlwZS5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFNlcnZlclR5cGUuRlJFRToge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2VydmVyQ29uZmlnIH0gPSBTZXJ2ZXJUeXBlLlRZUEVTLkZSRUU7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNlcnZlckNvbmZpZ0NoYW5nZShzZXJ2ZXJDb25maWcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBTZXJ2ZXJUeXBlLlBSRU1JVU06XG4gICAgICAgICAgICAgICAgLy8gV2UgY2FuIGFjY2VwdCB3aGF0ZXZlciBzZXJ2ZXIgY29uZmlnIHdhcyB0aGUgZGVmYXVsdCBoZXJlIGFzIHRoaXMgZXNzZW50aWFsbHlcbiAgICAgICAgICAgICAgICAvLyBhY3RzIGFzIGEgc2xpZ2h0bHkgZGlmZmVyZW50IFwiY3VzdG9tIHNlcnZlclwiL0FEVkFOQ0VEIG9wdGlvbi5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2VydmVyVHlwZS5BRFZBTkNFRDpcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIGRlZmF1bHQgY29uZmlnIGZyb20gdGhlIGNvbmZpZ1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25TZXJ2ZXJDb25maWdDaGFuZ2UoU2RrQ29uZmlnLmdldCgpW1widmFsaWRhdGVkX3NlcnZlcl9jb25maWdcIl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHBoYXNlIHRvIGRlZmF1bHQgcGhhc2UgZm9yIHRoZSBzZXJ2ZXIgdHlwZS5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogdGhpcy5nZXREZWZhdWx0UGhhc2VGb3JTZXJ2ZXJUeXBlKHR5cGUpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3JlcGxhY2VDbGllbnQ6IGFzeW5jIGZ1bmN0aW9uKHNlcnZlckNvbmZpZykge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgICAgIHNlcnZlckRlYWRFcnJvcjogbnVsbCxcbiAgICAgICAgICAgIHNlcnZlckVycm9ySXNGYXRhbDogZmFsc2UsXG4gICAgICAgICAgICAvLyBidXN5IHdoaWxlIHdlIGRvIGxpdmVuZXNzIGNoZWNrICh3ZSBuZWVkIHRvIGF2b2lkIHRyeWluZyB0byByZW5kZXJcbiAgICAgICAgICAgIC8vIHRoZSBVSSBhdXRoIGNvbXBvbmVudCB3aGlsZSB3ZSBkb24ndCBoYXZlIGEgbWF0cml4IGNsaWVudClcbiAgICAgICAgICAgIGJ1c3k6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXNlcnZlckNvbmZpZykgc2VydmVyQ29uZmlnID0gdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWc7XG5cbiAgICAgICAgLy8gRG8gYSBsaXZlbGluZXNzIGNoZWNrIG9uIHRoZSBVUkxzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBBdXRvRGlzY292ZXJ5VXRpbHMudmFsaWRhdGVTZXJ2ZXJDb25maWdXaXRoU3RhdGljVXJscyhcbiAgICAgICAgICAgICAgICBzZXJ2ZXJDb25maWcuaHNVcmwsXG4gICAgICAgICAgICAgICAgc2VydmVyQ29uZmlnLmlzVXJsLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHNlcnZlcklzQWxpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgc2VydmVyRXJyb3JJc0ZhdGFsOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAuLi5BdXRvRGlzY292ZXJ5VXRpbHMuYXV0aENvbXBvbmVudFN0YXRlRm9yRXJyb3IoZSwgXCJyZWdpc3RlclwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VydmVyRXJyb3JJc0ZhdGFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBTZXJ2ZXIgaXMgZGVhZCAtIGRvIG5vdCBjb250aW51ZS5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtoc1VybCwgaXNVcmx9ID0gc2VydmVyQ29uZmlnO1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXguY3JlYXRlQ2xpZW50KHtcbiAgICAgICAgICAgIGJhc2VVcmw6IGhzVXJsLFxuICAgICAgICAgICAgaWRCYXNlVXJsOiBpc1VybCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHNlcnZlclJlcXVpcmVzSWRTZXJ2ZXIgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2VydmVyUmVxdWlyZXNJZFNlcnZlciA9IGF3YWl0IGNsaS5kb2VzU2VydmVyUmVxdWlyZUlkU2VydmVyUGFyYW0oKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGlzIHNlcnZlciBuZWVkcyBpZF9zZXJ2ZXIgcGFyYW1cIiwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1hdHJpeENsaWVudDogY2xpLFxuICAgICAgICAgICAgc2VydmVyUmVxdWlyZXNJZFNlcnZlcixcbiAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2hvd0dlbmVyaWNFcnJvciA9IChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvclRleHQ6IF90KFwiVW5hYmxlIHRvIHF1ZXJ5IGZvciBzdXBwb3J0ZWQgcmVnaXN0cmF0aW9uIG1ldGhvZHMuXCIpLFxuICAgICAgICAgICAgICAgIC8vIGFkZCBlbXB0eSBmbG93cyBhcnJheSB0byBnZXQgcmlkIG9mIHNwaW5uZXJcbiAgICAgICAgICAgICAgICBmbG93czogW10sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdlIGRvIHRoZSBmaXJzdCByZWdpc3RyYXRpb24gcmVxdWVzdCBvdXJzZWx2ZXMgdG8gZGlzY292ZXIgd2hldGhlciB3ZSBuZWVkIHRvXG4gICAgICAgICAgICAvLyBkbyBTU08gaW5zdGVhZC4gSWYgd2UndmUgYWxyZWFkeSBzdGFydGVkIHRoZSBVSSBBdXRoIHByb2Nlc3MgdGhvdWdoLCB3ZSBkb24ndFxuICAgICAgICAgICAgLy8gbmVlZCB0by5cbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZS5kb2luZ1VJQXV0aCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX21ha2VSZWdpc3RlclJlcXVlc3Qoe30pO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIHN1Y2NlZWQgc2luY2Ugd2Ugc3BlY2lmaWVkIGFuIGVtcHR5XG4gICAgICAgICAgICAgICAgLy8gYXV0aCBvYmplY3QuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFeHBlY3RpbmcgNDAxIGZyb20gcmVnaXN0ZXIgcmVxdWVzdCBidXQgZ290IHN1Y2Nlc3MhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZS5odHRwU3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZmxvd3M6IGUuZGF0YS5mbG93cyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5odHRwU3RhdHVzID09PSA0MDMgJiYgZS5lcnJjb2RlID09PSBcIk1fVU5LTk9XTlwiKSB7XG4gICAgICAgICAgICAgICAgLy8gQXQgdGhpcyBwb2ludCByZWdpc3RyYXRpb24gaXMgcHJldHR5IG11Y2ggZGlzYWJsZWQsIGJ1dCBiZWZvcmUgd2UgZG8gdGhhdCBsZXQnc1xuICAgICAgICAgICAgICAgIC8vIHF1aWNrbHkgY2hlY2sgdG8gc2VlIGlmIHRoZSBzZXJ2ZXIgc3VwcG9ydHMgU1NPIGluc3RlYWQuIElmIGl0IGRvZXMsIHdlJ2xsIHNlbmRcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXNlciBvZmYgdG8gdGhlIGxvZ2luIHBhZ2UgdG8gZmlndXJlIHRoZWlyIGFjY291bnQgb3V0LlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZ2luTG9naWMgPSBuZXcgTG9naW4oaHNVcmwsIGlzVXJsLCBudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWU6IFwicmlvdCBsb2dpbiBjaGVja1wiLCAvLyBXZSBzaG91bGRuJ3QgZXZlciBiZSB1c2VkXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmbG93cyA9IGF3YWl0IGxvZ2luTG9naWMuZ2V0Rmxvd3MoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzU3NvRmxvdyA9IGZsb3dzLmZpbmQoZiA9PiBmLnR5cGUgPT09ICdtLmxvZ2luLnNzbycgfHwgZi50eXBlID09PSAnbS5sb2dpbi5jYXMnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1Nzb0Zsb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlZGlyZWN0IHRvIGxvZ2luIHBhZ2UgLSBzZXJ2ZXIgcHJvYmFibHkgZXhwZWN0cyBTU08gb25seVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzdGFydF9sb2dpbid9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckVycm9ySXNGYXRhbDogdHJ1ZSwgLy8gZmF0YWwgYmVjYXVzZSB1c2VyIGNhbm5vdCBjb250aW51ZSBvbiB0aGlzIHNlcnZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dDogX3QoXCJSZWdpc3RyYXRpb24gaGFzIGJlZW4gZGlzYWJsZWQgb24gdGhpcyBob21lc2VydmVyLlwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGQgZW1wdHkgZmxvd3MgYXJyYXkgdG8gZ2V0IHJpZCBvZiBzcGlubmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxvd3M6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZ2V0IGxvZ2luIGZsb3dzIHRvIGNoZWNrIGZvciBTU08gc3VwcG9ydFwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0dlbmVyaWNFcnJvcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5hYmxlIHRvIHF1ZXJ5IGZvciBzdXBwb3J0ZWQgcmVnaXN0cmF0aW9uIG1ldGhvZHMuXCIsIGUpO1xuICAgICAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3IoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Gb3JtU3VibWl0OiBmdW5jdGlvbihmb3JtVmFscykge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yVGV4dDogXCJcIixcbiAgICAgICAgICAgIGJ1c3k6IHRydWUsXG4gICAgICAgICAgICBmb3JtVmFsczogZm9ybVZhbHMsXG4gICAgICAgICAgICBkb2luZ1VJQXV0aDogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9yZXF1ZXN0RW1haWxUb2tlbjogZnVuY3Rpb24oZW1haWxBZGRyZXNzLCBjbGllbnRTZWNyZXQsIHNlbmRBdHRlbXB0LCBzZXNzaW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUubWF0cml4Q2xpZW50LnJlcXVlc3RSZWdpc3RlckVtYWlsVG9rZW4oXG4gICAgICAgICAgICBlbWFpbEFkZHJlc3MsXG4gICAgICAgICAgICBjbGllbnRTZWNyZXQsXG4gICAgICAgICAgICBzZW5kQXR0ZW1wdCxcbiAgICAgICAgICAgIHRoaXMucHJvcHMubWFrZVJlZ2lzdHJhdGlvblVybCh7XG4gICAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogY2xpZW50U2VjcmV0LFxuICAgICAgICAgICAgICAgIGhzX3VybDogdGhpcy5zdGF0ZS5tYXRyaXhDbGllbnQuZ2V0SG9tZXNlcnZlclVybCgpLFxuICAgICAgICAgICAgICAgIGlzX3VybDogdGhpcy5zdGF0ZS5tYXRyaXhDbGllbnQuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKSxcbiAgICAgICAgICAgICAgICBzZXNzaW9uX2lkOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX29uVUlBdXRoRmluaXNoZWQ6IGFzeW5jIGZ1bmN0aW9uKHN1Y2Nlc3MsIHJlc3BvbnNlLCBleHRyYSkge1xuICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGxldCBtc2cgPSByZXNwb25zZS5tZXNzYWdlIHx8IHJlc3BvbnNlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAvLyBjYW4gd2UgZ2l2ZSBhIGJldHRlciBlcnJvciBtZXNzYWdlP1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycmNvZGUgPT09ICdNX1JFU09VUkNFX0xJTUlUX0VYQ0VFREVEJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yVG9wID0gbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5saW1pdF90eXBlLFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLmFkbWluX2NvbnRhY3QsIHtcbiAgICAgICAgICAgICAgICAgICAgJ21vbnRobHlfYWN0aXZlX3VzZXInOiBfdGQoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgaG9tZXNlcnZlciBoYXMgaGl0IGl0cyBNb250aGx5IEFjdGl2ZSBVc2VyIGxpbWl0LlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAnJzogX3RkKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGhvbWVzZXJ2ZXIgaGFzIGV4Y2VlZGVkIG9uZSBvZiBpdHMgcmVzb3VyY2UgbGltaXRzLlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yRGV0YWlsID0gbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5saW1pdF90eXBlLFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLmFkbWluX2NvbnRhY3QsIHtcbiAgICAgICAgICAgICAgICAgICAgJyc6IF90ZChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIDxhPmNvbnRhY3QgeW91ciBzZXJ2aWNlIGFkbWluaXN0cmF0b3I8L2E+IHRvIGNvbnRpbnVlIHVzaW5nIHRoaXMgc2VydmljZS5cIixcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBtc2cgPSA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cD57ZXJyb3JUb3B9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57ZXJyb3JEZXRhaWx9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UucmVxdWlyZWRfc3RhZ2VzICYmIHJlc3BvbnNlLnJlcXVpcmVkX3N0YWdlcy5pbmRleE9mKCdtLmxvZ2luLm1zaXNkbicpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBsZXQgbXNpc2RuQXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBmbG93IG9mIHJlc3BvbnNlLmF2YWlsYWJsZV9mbG93cykge1xuICAgICAgICAgICAgICAgICAgICBtc2lzZG5BdmFpbGFibGUgfD0gZmxvdy5zdGFnZXMuaW5kZXhPZignbS5sb2dpbi5tc2lzZG4nKSA+IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW1zaXNkbkF2YWlsYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBfdCgnVGhpcyBzZXJ2ZXIgZG9lcyBub3Qgc3VwcG9ydCBhdXRoZW50aWNhdGlvbiB3aXRoIGEgcGhvbmUgbnVtYmVyLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRvaW5nVUlBdXRoOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvclRleHQ6IG1zZyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLnNldEp1c3RSZWdpc3RlcmVkVXNlcklkKHJlc3BvbnNlLnVzZXJfaWQpO1xuXG4gICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xuICAgICAgICAgICAgZG9pbmdVSUF1dGg6IGZhbHNlLFxuICAgICAgICAgICAgcmVnaXN0ZXJlZFVzZXJuYW1lOiByZXNwb25zZS51c2VyX2lkLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFRoZSB1c2VyIGNhbWUgaW4gdGhyb3VnaCBhbiBlbWFpbCB2YWxpZGF0aW9uIGxpbmsuIFRvIGF2b2lkIG92ZXJ3cml0aW5nXG4gICAgICAgIC8vIHRoZWlyIHNlc3Npb24sIGNoZWNrIHRvIG1ha2Ugc3VyZSB0aGUgc2Vzc2lvbiBpc24ndCBzb21lb25lIGVsc2UsIGFuZFxuICAgICAgICAvLyBpc24ndCBhIGd1ZXN0IHVzZXIgc2luY2Ugd2UnbGwgdXN1YWxseSBoYXZlIHNldCBhIGd1ZXN0IHVzZXIgc2Vzc2lvbiBiZWZvcmVcbiAgICAgICAgLy8gc3RhcnRpbmcgdGhlIHJlZ2lzdHJhdGlvbiBwcm9jZXNzLiBUaGlzIGlzbid0IHBlcmZlY3Qgc2luY2UgaXQncyBwb3NzaWJsZVxuICAgICAgICAvLyB0aGUgdXNlciBoYWQgYSBzZXBhcmF0ZSBndWVzdCBzZXNzaW9uIHRoZXkgZGlkbid0IGFjdHVhbGx5IG1lYW4gdG8gcmVwbGFjZS5cbiAgICAgICAgY29uc3Qgc2Vzc2lvbk93bmVyID0gTGlmZWN5Y2xlLmdldFN0b3JlZFNlc3Npb25Pd25lcigpO1xuICAgICAgICBjb25zdCBzZXNzaW9uSXNHdWVzdCA9IExpZmVjeWNsZS5nZXRTdG9yZWRTZXNzaW9uSXNHdWVzdCgpO1xuICAgICAgICBpZiAoc2Vzc2lvbk93bmVyICYmICFzZXNzaW9uSXNHdWVzdCAmJiBzZXNzaW9uT3duZXIgIT09IHJlc3BvbnNlLnVzZXJJZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgYEZvdW5kIGEgc2Vzc2lvbiBmb3IgJHtzZXNzaW9uT3duZXJ9IGJ1dCAke3Jlc3BvbnNlLnVzZXJJZH0gaGFzIGp1c3QgcmVnaXN0ZXJlZC5gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG5ld1N0YXRlLmRpZmZlcmVudExvZ2dlZEluVXNlcklkID0gc2Vzc2lvbk93bmVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3U3RhdGUuZGlmZmVyZW50TG9nZ2VkSW5Vc2VySWQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlLmFjY2Vzc190b2tlbikge1xuICAgICAgICAgICAgY29uc3QgY2xpID0gYXdhaXQgdGhpcy5wcm9wcy5vbkxvZ2dlZEluKHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHJlc3BvbnNlLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgZGV2aWNlSWQ6IHJlc3BvbnNlLmRldmljZV9pZCxcbiAgICAgICAgICAgICAgICBob21lc2VydmVyVXJsOiB0aGlzLnN0YXRlLm1hdHJpeENsaWVudC5nZXRIb21lc2VydmVyVXJsKCksXG4gICAgICAgICAgICAgICAgaWRlbnRpdHlTZXJ2ZXJVcmw6IHRoaXMuc3RhdGUubWF0cml4Q2xpZW50LmdldElkZW50aXR5U2VydmVyVXJsKCksXG4gICAgICAgICAgICAgICAgYWNjZXNzVG9rZW46IHJlc3BvbnNlLmFjY2Vzc190b2tlbixcbiAgICAgICAgICAgIH0sIHRoaXMuc3RhdGUuZm9ybVZhbHMucGFzc3dvcmQpO1xuXG4gICAgICAgICAgICB0aGlzLl9zZXR1cFB1c2hlcnMoY2xpKTtcbiAgICAgICAgICAgIC8vIHdlJ3JlIHN0aWxsIGJ1c3kgdW50aWwgd2UgZ2V0IHVubW91bnRlZDogZG9uJ3Qgc2hvdyB0aGUgcmVnaXN0cmF0aW9uIGZvcm0gYWdhaW5cbiAgICAgICAgICAgIG5ld1N0YXRlLmJ1c3kgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3U3RhdGUuYnVzeSA9IGZhbHNlO1xuICAgICAgICAgICAgbmV3U3RhdGUuY29tcGxldGVkTm9TaWduaW4gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gICAgfSxcblxuICAgIF9zZXR1cFB1c2hlcnM6IGZ1bmN0aW9uKG1hdHJpeENsaWVudCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvcHMuYnJhbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Q2xpZW50LmdldFB1c2hlcnMoKS50aGVuKChyZXNwKT0+e1xuICAgICAgICAgICAgY29uc3QgcHVzaGVycyA9IHJlc3AucHVzaGVycztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHVzaGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmIChwdXNoZXJzW2ldLmtpbmQgPT09ICdlbWFpbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxQdXNoZXIgPSBwdXNoZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBlbWFpbFB1c2hlci5kYXRhID0geyBicmFuZDogdGhpcy5wcm9wcy5icmFuZCB9O1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXhDbGllbnQuc2V0UHVzaGVyKGVtYWlsUHVzaGVyKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2V0IGVtYWlsIGJyYW5kaW5nIHRvIFwiICsgdGhpcy5wcm9wcy5icmFuZCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkbid0IHNldCBlbWFpbCBicmFuZGluZzogXCIgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGRuJ3QgZ2V0IHB1c2hlcnM6IFwiICsgZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25Mb2dpbkNsaWNrOiBmdW5jdGlvbihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkxvZ2luQ2xpY2soKTtcbiAgICB9LFxuXG4gICAgb25Hb1RvRm9ybUNsaWNrZWQoZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3JlcGxhY2VDbGllbnQoKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIGRvaW5nVUlBdXRoOiBmYWxzZSxcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9SRUdJU1RSQVRJT04sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvblNlcnZlckRldGFpbHNOZXh0UGhhc2VDbGljaygpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogUEhBU0VfUkVHSVNUUkFUSU9OLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25FZGl0U2VydmVyRGV0YWlsc0NsaWNrKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiBQSEFTRV9TRVJWRVJfREVUQUlMUyxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9tYWtlUmVnaXN0ZXJSZXF1ZXN0OiBmdW5jdGlvbihhdXRoKSB7XG4gICAgICAgIC8vIFdlIGluaGliaXQgbG9naW4gaWYgd2UncmUgdHJ5aW5nIHRvIHJlZ2lzdGVyIHdpdGggYW4gZW1haWwgYWRkcmVzczogdGhpc1xuICAgICAgICAvLyBhdm9pZHMgYSBsb3Qgb2YgY29tcGxleCByYWNlIGNvbmRpdGlvbnMgdGhhdCBjYW4gb2NjdXIgaWYgd2UgdHJ5IHRvIGxvZ1xuICAgICAgICAvLyB0aGUgdXNlciBpbiBvbmUgb25lIG9yIGJvdGggb2YgdGhlIHRhYnMgdGhleSBtaWdodCBlbmQgdXAgd2l0aCBhZnRlclxuICAgICAgICAvLyBjbGlja2luZyB0aGUgZW1haWwgbGluay5cbiAgICAgICAgbGV0IGluaGliaXRMb2dpbiA9IEJvb2xlYW4odGhpcy5zdGF0ZS5mb3JtVmFscy5lbWFpbCk7XG5cbiAgICAgICAgLy8gT25seSBzZW5kIGluaGliaXRMb2dpbiBpZiB3ZSdyZSBzZW5kaW5nIHVzZXJuYW1lIC8gcHcgcGFyYW1zXG4gICAgICAgIC8vIChTaW5jZSB3ZSBuZWVkIHRvIHNlbmQgbm8gcGFyYW1zIGF0IGFsbCB0byB1c2UgdGhlIG9uZXMgc2F2ZWQgaW4gdGhlXG4gICAgICAgIC8vIHNlc3Npb24pLlxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZm9ybVZhbHMucGFzc3dvcmQpIGluaGliaXRMb2dpbiA9IG51bGw7XG5cbiAgICAgICAgY29uc3QgcmVnaXN0ZXJQYXJhbXMgPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogdGhpcy5zdGF0ZS5mb3JtVmFscy51c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB0aGlzLnN0YXRlLmZvcm1WYWxzLnBhc3N3b3JkLFxuICAgICAgICAgICAgaW5pdGlhbF9kZXZpY2VfZGlzcGxheV9uYW1lOiB0aGlzLnByb3BzLmRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGF1dGgpIHJlZ2lzdGVyUGFyYW1zLmF1dGggPSBhdXRoO1xuICAgICAgICBpZiAoaW5oaWJpdExvZ2luICE9PSB1bmRlZmluZWQgJiYgaW5oaWJpdExvZ2luICE9PSBudWxsKSByZWdpc3RlclBhcmFtcy5pbmhpYml0X2xvZ2luID0gaW5oaWJpdExvZ2luO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5tYXRyaXhDbGllbnQucmVnaXN0ZXJSZXF1ZXN0KHJlZ2lzdGVyUGFyYW1zKTtcbiAgICB9LFxuXG4gICAgX2dldFVJQXV0aElucHV0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbWFpbEFkZHJlc3M6IHRoaXMuc3RhdGUuZm9ybVZhbHMuZW1haWwsXG4gICAgICAgICAgICBwaG9uZUNvdW50cnk6IHRoaXMuc3RhdGUuZm9ybVZhbHMucGhvbmVDb3VudHJ5LFxuICAgICAgICAgICAgcGhvbmVOdW1iZXI6IHRoaXMuc3RhdGUuZm9ybVZhbHMucGhvbmVOdW1iZXIsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIExpbmtzIHRvIHRoZSBsb2dpbiBwYWdlIHNob3duIGFmdGVyIHJlZ2lzdHJhdGlvbiBpcyBjb21wbGV0ZWQgYXJlIHJvdXRlZCB0aHJvdWdoIHRoaXNcbiAgICAvLyB3aGljaCBjaGVja3MgdGhlIHVzZXIgaGFzbid0IGFscmVhZHkgbG9nZ2VkIGluIHNvbWV3aGVyZSBlbHNlIChwZXJoYXBzIHdlIHNob3VsZCBkb1xuICAgIC8vIHRoaXMgbW9yZSBnZW5lcmFsbHk/KVxuICAgIF9vbkxvZ2luQ2xpY2tXaXRoQ2hlY2s6IGFzeW5jIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3Qgc2Vzc2lvbkxvYWRlZCA9IGF3YWl0IExpZmVjeWNsZS5sb2FkU2Vzc2lvbih7aWdub3JlR3Vlc3Q6IHRydWV9KTtcbiAgICAgICAgaWYgKCFzZXNzaW9uTG9hZGVkKSB7XG4gICAgICAgICAgICAvLyBvayBmaW5lLCB0aGVyZSdzIHN0aWxsIG5vIHNlc3Npb246IHJlYWxseSBnbyB0byB0aGUgbG9naW4gcGFnZVxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkxvZ2luQ2xpY2soKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXJTZXJ2ZXJDb21wb25lbnQoKSB7XG4gICAgICAgIGNvbnN0IFNlcnZlclR5cGVTZWxlY3RvciA9IHNkay5nZXRDb21wb25lbnQoXCJhdXRoLlNlcnZlclR5cGVTZWxlY3RvclwiKTtcbiAgICAgICAgY29uc3QgU2VydmVyQ29uZmlnID0gc2RrLmdldENvbXBvbmVudChcImF1dGguU2VydmVyQ29uZmlnXCIpO1xuICAgICAgICBjb25zdCBNb2R1bGFyU2VydmVyQ29uZmlnID0gc2RrLmdldENvbXBvbmVudChcImF1dGguTW9kdWxhclNlcnZlckNvbmZpZ1wiKTtcblxuICAgICAgICBpZiAoU2RrQ29uZmlnLmdldCgpWydkaXNhYmxlX2N1c3RvbV91cmxzJ10pIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UncmUgb24gYSBkaWZmZXJlbnQgcGhhc2UsIHdlIG9ubHkgc2hvdyB0aGUgc2VydmVyIHR5cGUgc2VsZWN0b3IsXG4gICAgICAgIC8vIHdoaWNoIGlzIGFsd2F5cyBzaG93biBpZiB3ZSBhbGxvdyBjdXN0b20gVVJMcyBhdCBhbGwuXG4gICAgICAgIC8vIChpZiB0aGVyZSdzIGEgZmF0YWwgc2VydmVyIGVycm9yLCB3ZSBuZWVkIHRvIHNob3cgdGhlIGZ1bGwgc2VydmVyXG4gICAgICAgIC8vIGNvbmZpZyBhcyB0aGUgdXNlciBtYXkgbmVlZCB0byBjaGFuZ2Ugc2VydmVycyB0byByZXNvbHZlIHRoZSBlcnJvcikuXG4gICAgICAgIGlmIChQSEFTRVNfRU5BQkxFRCAmJiB0aGlzLnN0YXRlLnBoYXNlICE9PSBQSEFTRV9TRVJWRVJfREVUQUlMUyAmJiAhdGhpcy5zdGF0ZS5zZXJ2ZXJFcnJvcklzRmF0YWwpIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgICAgIDxTZXJ2ZXJUeXBlU2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ9e3RoaXMuc3RhdGUuc2VydmVyVHlwZX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25TZXJ2ZXJUeXBlQ2hhbmdlfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZXJ2ZXJEZXRhaWxzUHJvcHMgPSB7fTtcbiAgICAgICAgaWYgKFBIQVNFU19FTkFCTEVEKSB7XG4gICAgICAgICAgICBzZXJ2ZXJEZXRhaWxzUHJvcHMub25BZnRlclN1Ym1pdCA9IHRoaXMub25TZXJ2ZXJEZXRhaWxzTmV4dFBoYXNlQ2xpY2s7XG4gICAgICAgICAgICBzZXJ2ZXJEZXRhaWxzUHJvcHMuc3VibWl0VGV4dCA9IF90KFwiTmV4dFwiKTtcbiAgICAgICAgICAgIHNlcnZlckRldGFpbHNQcm9wcy5zdWJtaXRDbGFzcyA9IFwibXhfTG9naW5fc3VibWl0XCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2VydmVyRGV0YWlscyA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5zZXJ2ZXJUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFNlcnZlclR5cGUuRlJFRTpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2VydmVyVHlwZS5QUkVNSVVNOlxuICAgICAgICAgICAgICAgIHNlcnZlckRldGFpbHMgPSA8TW9kdWxhclNlcnZlckNvbmZpZ1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJDb25maWc9e3RoaXMucHJvcHMuc2VydmVyQ29uZmlnfVxuICAgICAgICAgICAgICAgICAgICBvblNlcnZlckNvbmZpZ0NoYW5nZT17dGhpcy5wcm9wcy5vblNlcnZlckNvbmZpZ0NoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgZGVsYXlUaW1lTXM9ezI1MH1cbiAgICAgICAgICAgICAgICAgICAgey4uLnNlcnZlckRldGFpbHNQcm9wc31cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2VydmVyVHlwZS5BRFZBTkNFRDpcbiAgICAgICAgICAgICAgICBzZXJ2ZXJEZXRhaWxzID0gPFNlcnZlckNvbmZpZ1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJDb25maWc9e3RoaXMucHJvcHMuc2VydmVyQ29uZmlnfVxuICAgICAgICAgICAgICAgICAgICBvblNlcnZlckNvbmZpZ0NoYW5nZT17dGhpcy5wcm9wcy5vblNlcnZlckNvbmZpZ0NoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgZGVsYXlUaW1lTXM9ezI1MH1cbiAgICAgICAgICAgICAgICAgICAgc2hvd0lkZW50aXR5U2VydmVySWZSZXF1aXJlZEJ5SG9tZXNlcnZlcj17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgey4uLnNlcnZlckRldGFpbHNQcm9wc31cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgPFNlcnZlclR5cGVTZWxlY3RvclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkPXt0aGlzLnN0YXRlLnNlcnZlclR5cGV9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25TZXJ2ZXJUeXBlQ2hhbmdlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIHtzZXJ2ZXJEZXRhaWxzfVxuICAgICAgICA8L2Rpdj47XG4gICAgfSxcblxuICAgIHJlbmRlclJlZ2lzdGVyQ29tcG9uZW50KCkge1xuICAgICAgICBpZiAoUEhBU0VTX0VOQUJMRUQgJiYgdGhpcy5zdGF0ZS5waGFzZSAhPT0gUEhBU0VfUkVHSVNUUkFUSU9OKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEludGVyYWN0aXZlQXV0aCA9IHNkay5nZXRDb21wb25lbnQoJ3N0cnVjdHVyZXMuSW50ZXJhY3RpdmVBdXRoJyk7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcGlubmVyJyk7XG4gICAgICAgIGNvbnN0IFJlZ2lzdHJhdGlvbkZvcm0gPSBzZGsuZ2V0Q29tcG9uZW50KCdhdXRoLlJlZ2lzdHJhdGlvbkZvcm0nKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5tYXRyaXhDbGllbnQgJiYgdGhpcy5zdGF0ZS5kb2luZ1VJQXV0aCkge1xuICAgICAgICAgICAgcmV0dXJuIDxJbnRlcmFjdGl2ZUF1dGhcbiAgICAgICAgICAgICAgICBtYXRyaXhDbGllbnQ9e3RoaXMuc3RhdGUubWF0cml4Q2xpZW50fVxuICAgICAgICAgICAgICAgIG1ha2VSZXF1ZXN0PXt0aGlzLl9tYWtlUmVnaXN0ZXJSZXF1ZXN0fVxuICAgICAgICAgICAgICAgIG9uQXV0aEZpbmlzaGVkPXt0aGlzLl9vblVJQXV0aEZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIGlucHV0cz17dGhpcy5fZ2V0VUlBdXRoSW5wdXRzKCl9XG4gICAgICAgICAgICAgICAgcmVxdWVzdEVtYWlsVG9rZW49e3RoaXMuX3JlcXVlc3RFbWFpbFRva2VufVxuICAgICAgICAgICAgICAgIHNlc3Npb25JZD17dGhpcy5wcm9wcy5zZXNzaW9uSWR9XG4gICAgICAgICAgICAgICAgY2xpZW50U2VjcmV0PXt0aGlzLnByb3BzLmNsaWVudFNlY3JldH1cbiAgICAgICAgICAgICAgICBlbWFpbFNpZD17dGhpcy5wcm9wcy5pZFNpZH1cbiAgICAgICAgICAgICAgICBwb2xsPXt0cnVlfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhdGUubWF0cml4Q2xpZW50ICYmICF0aGlzLnN0YXRlLmJ1c3kpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuYnVzeSB8fCAhdGhpcy5zdGF0ZS5mbG93cykge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfQXV0aEJvZHlfc3Bpbm5lclwiPlxuICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5mbG93cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxldCBvbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2sgPSBudWxsO1xuICAgICAgICAgICAgLy8gSWYgY3VzdG9tIFVSTHMgYXJlIGFsbG93ZWQgYW5kIHdlIGhhdmVuJ3Qgc2VsZWN0ZWQgdGhlIEZyZWUgc2VydmVyIHR5cGUsIHdpcmVcbiAgICAgICAgICAgIC8vIHVwIHRoZSBzZXJ2ZXIgZGV0YWlscyBlZGl0IGxpbmsuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgUEhBU0VTX0VOQUJMRUQgJiZcbiAgICAgICAgICAgICAgICAhU2RrQ29uZmlnLmdldCgpWydkaXNhYmxlX2N1c3RvbV91cmxzJ10gJiZcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNlcnZlclR5cGUgIT09IFNlcnZlclR5cGUuRlJFRVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgb25FZGl0U2VydmVyRGV0YWlsc0NsaWNrID0gdGhpcy5vbkVkaXRTZXJ2ZXJEZXRhaWxzQ2xpY2s7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiA8UmVnaXN0cmF0aW9uRm9ybVxuICAgICAgICAgICAgICAgIGRlZmF1bHRVc2VybmFtZT17dGhpcy5zdGF0ZS5mb3JtVmFscy51c2VybmFtZX1cbiAgICAgICAgICAgICAgICBkZWZhdWx0RW1haWw9e3RoaXMuc3RhdGUuZm9ybVZhbHMuZW1haWx9XG4gICAgICAgICAgICAgICAgZGVmYXVsdFBob25lQ291bnRyeT17dGhpcy5zdGF0ZS5mb3JtVmFscy5waG9uZUNvdW50cnl9XG4gICAgICAgICAgICAgICAgZGVmYXVsdFBob25lTnVtYmVyPXt0aGlzLnN0YXRlLmZvcm1WYWxzLnBob25lTnVtYmVyfVxuICAgICAgICAgICAgICAgIGRlZmF1bHRQYXNzd29yZD17dGhpcy5zdGF0ZS5mb3JtVmFscy5wYXNzd29yZH1cbiAgICAgICAgICAgICAgICBvblJlZ2lzdGVyQ2xpY2s9e3RoaXMub25Gb3JtU3VibWl0fVxuICAgICAgICAgICAgICAgIG9uRWRpdFNlcnZlckRldGFpbHNDbGljaz17b25FZGl0U2VydmVyRGV0YWlsc0NsaWNrfVxuICAgICAgICAgICAgICAgIGZsb3dzPXt0aGlzLnN0YXRlLmZsb3dzfVxuICAgICAgICAgICAgICAgIHNlcnZlckNvbmZpZz17dGhpcy5wcm9wcy5zZXJ2ZXJDb25maWd9XG4gICAgICAgICAgICAgICAgY2FuU3VibWl0PXshdGhpcy5zdGF0ZS5zZXJ2ZXJFcnJvcklzRmF0YWx9XG4gICAgICAgICAgICAgICAgc2VydmVyUmVxdWlyZXNJZFNlcnZlcj17dGhpcy5zdGF0ZS5zZXJ2ZXJSZXF1aXJlc0lkU2VydmVyfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQXV0aEhlYWRlciA9IHNkay5nZXRDb21wb25lbnQoJ2F1dGguQXV0aEhlYWRlcicpO1xuICAgICAgICBjb25zdCBBdXRoQm9keSA9IHNkay5nZXRDb21wb25lbnQoXCJhdXRoLkF1dGhCb2R5XCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIGxldCBlcnJvclRleHQ7XG4gICAgICAgIGNvbnN0IGVyciA9IHRoaXMuc3RhdGUuZXJyb3JUZXh0O1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvclRleHQgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0xvZ2luX2Vycm9yXCI+eyBlcnIgfTwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzZXJ2ZXJEZWFkU2VjdGlvbjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNlcnZlcklzQWxpdmUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICBcIm14X0xvZ2luX2Vycm9yXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9Mb2dpbl9zZXJ2ZXJFcnJvclwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfTG9naW5fc2VydmVyRXJyb3JOb25GYXRhbFwiOiAhdGhpcy5zdGF0ZS5zZXJ2ZXJFcnJvcklzRmF0YWwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlcnZlckRlYWRTZWN0aW9uID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuc2VydmVyRGVhZEVycm9yfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpZ25JbiA9IDxhIGNsYXNzTmFtZT1cIm14X0F1dGhCb2R5X2NoYW5nZUZsb3dcIiBvbkNsaWNrPXt0aGlzLm9uTG9naW5DbGlja30gaHJlZj1cIiNcIj5cbiAgICAgICAgICAgIHsgX3QoJ1NpZ24gaW4gaW5zdGVhZCcpIH1cbiAgICAgICAgPC9hPjtcblxuICAgICAgICAvLyBPbmx5IHNob3cgdGhlICdnbyBiYWNrJyBidXR0b24gaWYgeW91J3JlIG5vdCBsb29raW5nIGF0IHRoZSBmb3JtXG4gICAgICAgIGxldCBnb0JhY2s7XG4gICAgICAgIGlmICgoUEhBU0VTX0VOQUJMRUQgJiYgdGhpcy5zdGF0ZS5waGFzZSAhPT0gUEhBU0VfUkVHSVNUUkFUSU9OKSB8fCB0aGlzLnN0YXRlLmRvaW5nVUlBdXRoKSB7XG4gICAgICAgICAgICBnb0JhY2sgPSA8YSBjbGFzc05hbWU9XCJteF9BdXRoQm9keV9jaGFuZ2VGbG93XCIgb25DbGljaz17dGhpcy5vbkdvVG9Gb3JtQ2xpY2tlZH0gaHJlZj1cIiNcIj5cbiAgICAgICAgICAgICAgICB7IF90KCdHbyBiYWNrJykgfVxuICAgICAgICAgICAgPC9hPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib2R5O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZWROb1NpZ25pbikge1xuICAgICAgICAgICAgbGV0IHJlZ0RvbmVUZXh0O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlmZmVyZW50TG9nZ2VkSW5Vc2VySWQpIHtcbiAgICAgICAgICAgICAgICByZWdEb25lVGV4dCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiWW91ciBuZXcgYWNjb3VudCAoJShuZXdBY2NvdW50SWQpcykgaXMgcmVnaXN0ZXJlZCwgYnV0IHlvdSdyZSBhbHJlYWR5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nZ2VkIGludG8gYSBkaWZmZXJlbnQgYWNjb3VudCAoJShsb2dnZWRJblVzZXJJZClzKS5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0FjY291bnRJZDogdGhpcy5zdGF0ZS5yZWdpc3RlcmVkVXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VkSW5Vc2VySWQ6IHRoaXMuc3RhdGUuZGlmZmVyZW50TG9nZ2VkSW5Vc2VySWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPHA+PEFjY2Vzc2libGVCdXR0b24gZWxlbWVudD1cInNwYW5cIiBjbGFzc05hbWU9XCJteF9saW5rQnV0dG9uXCIgb25DbGljaz17dGhpcy5fb25Mb2dpbkNsaWNrV2l0aENoZWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkNvbnRpbnVlIHdpdGggcHJldmlvdXMgYWNjb3VudFwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuZm9ybVZhbHMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSdyZSB0aGUgY2xpZW50IHRoYXQgc3RhcnRlZCB0aGUgcmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgICAgcmVnRG9uZVRleHQgPSA8aDM+e190KFxuICAgICAgICAgICAgICAgICAgICBcIjxhPkxvZyBpbjwvYT4gdG8geW91ciBuZXcgYWNjb3VudC5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGE6IChzdWIpID0+IDxhIGhyZWY9XCIjL2xvZ2luXCIgb25DbGljaz17dGhpcy5fb25Mb2dpbkNsaWNrV2l0aENoZWNrfT57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKX08L2gzPjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UncmUgbm90IHRoZSBvcmlnaW5hbCBjbGllbnQ6IHRoZSB1c2VyIHByb2JhYmx5IGdvdCB0byB1cyBieSBjbGlja2luZyB0aGVcbiAgICAgICAgICAgICAgICAvLyBlbWFpbCB2YWxpZGF0aW9uIGxpbmsuIFdlIGNhbid0IG9mZmVyIGEgJ2dvIHN0cmFpZ2h0IHRvIHlvdXIgYWNjb3VudCcgbGlua1xuICAgICAgICAgICAgICAgIC8vIGFzIHdlIGRvbid0IGhhdmUgdGhlIG9yaWdpbmFsIGNyZWRzLlxuICAgICAgICAgICAgICAgIHJlZ0RvbmVUZXh0ID0gPGgzPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJZb3UgY2FuIG5vdyBjbG9zZSB0aGlzIHdpbmRvdyBvciA8YT5sb2cgaW48L2E+IHRvIHlvdXIgbmV3IGFjY291bnQuXCIsIHt9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhOiAoc3ViKSA9PiA8YSBocmVmPVwiIy9sb2dpblwiIG9uQ2xpY2s9e3RoaXMuX29uTG9naW5DbGlja1dpdGhDaGVja30+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICl9PC9oMz47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBib2R5ID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8aDI+e190KFwiUmVnaXN0cmF0aW9uIFN1Y2Nlc3NmdWxcIil9PC9oMj5cbiAgICAgICAgICAgICAgICB7IHJlZ0RvbmVUZXh0IH1cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJvZHkgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMj57IF90KCdDcmVhdGUgeW91ciBhY2NvdW50JykgfTwvaDI+XG4gICAgICAgICAgICAgICAgeyBlcnJvclRleHQgfVxuICAgICAgICAgICAgICAgIHsgc2VydmVyRGVhZFNlY3Rpb24gfVxuICAgICAgICAgICAgICAgIHsgdGhpcy5yZW5kZXJTZXJ2ZXJDb21wb25lbnQoKSB9XG4gICAgICAgICAgICAgICAgeyB0aGlzLnJlbmRlclJlZ2lzdGVyQ29tcG9uZW50KCkgfVxuICAgICAgICAgICAgICAgIHsgZ29CYWNrIH1cbiAgICAgICAgICAgICAgICB7IHNpZ25JbiB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEF1dGhQYWdlPlxuICAgICAgICAgICAgICAgIDxBdXRoSGVhZGVyIC8+XG4gICAgICAgICAgICAgICAgPEF1dGhCb2R5PlxuICAgICAgICAgICAgICAgICAgICB7IGJvZHkgfVxuICAgICAgICAgICAgICAgIDwvQXV0aEJvZHk+XG4gICAgICAgICAgICA8L0F1dGhQYWdlPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==