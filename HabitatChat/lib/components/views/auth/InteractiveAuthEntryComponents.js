"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getEntryComponentForLoginType;
exports.FallbackAuthEntry = exports.SSOAuthEntry = exports.MsisdnAuthEntry = exports.EmailIdentityAuthEntry = exports.TermsAuthEntry = exports.RecaptchaAuthEntry = exports.PasswordAuthEntry = exports.DEFAULT_PHASE = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _url = _interopRequireDefault(require("url"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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

/* This file contains a collection of components which are used by the
 * InteractiveAuth to prompt the user to enter the information needed
 * for an auth stage. (The intention is that they could also be used for other
 * components, such as the registration flow).
 *
 * Call getEntryComponentForLoginType() to get a component suitable for a
 * particular login type. Each component requires the same properties:
 *
 * matrixClient:           A matrix client. May be a different one to the one
 *                         currently being used generally (eg. to register with
 *                         one HS whilst beign a guest on another).
 * loginType:              the login type of the auth stage being attempted
 * authSessionId:          session id from the server
 * clientSecret:           The client secret in use for ID server auth sessions
 * stageParams:            params from the server for the stage being attempted
 * errorText:              error message from a previous attempt to authenticate
 * submitAuthDict:         a function which will be called with the new auth dict
 * busy:                   a boolean indicating whether the auth logic is doing something
 *                         the user needs to wait for.
 * inputs:                 Object of inputs provided by the user, as in js-sdk
 *                         interactive-auth
 * stageState:             Stage-specific object used for communicating state information
 *                         to the UI from the state-specific auth logic.
 *                         Defined keys for stages are:
 *                             m.login.email.identity:
 *                              * emailSid: string representing the sid of the active
 *                                          verification session from the ID server, or
 *                                          null if no session is active.
 * fail:                   a function which should be called with an error object if an
 *                         error occurred during the auth stage. This will cause the auth
 *                         session to be failed and the process to go back to the start.
 * setEmailSid:            m.login.email.identity only: a function to be called with the
 *                         email sid after a token is requested.
 * onPhaseChange:          A function which is called when the stage's phase changes. If
 *                         the stage has no phases, call this with DEFAULT_PHASE. Takes
 *                         one argument, the phase, and is always defined/required.
 * continueText:           For stages which have a continue button, the text to use.
 * continueKind:           For stages which have a continue button, the style of button to
 *                         use. For example, 'danger' or 'primary'.
 * onCancel                A function with no arguments which is called by the stage if the
 *                         user knowingly cancelled/dismissed the authentication attempt.
 *
 * Each component may also provide the following functions (beyond the standard React ones):
 *    focus: set the input focus appropriately in the form.
 */
const DEFAULT_PHASE = 0;
exports.DEFAULT_PHASE = DEFAULT_PHASE;
const PasswordAuthEntry = (0, _createReactClass.default)({
  displayName: 'PasswordAuthEntry',
  statics: {
    LOGIN_TYPE: "m.login.password"
  },
  propTypes: {
    matrixClient: _propTypes.default.object.isRequired,
    submitAuthDict: _propTypes.default.func.isRequired,
    errorText: _propTypes.default.string,
    // is the auth logic currently waiting for something to
    // happen?
    busy: _propTypes.default.bool,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
  },
  getInitialState: function () {
    return {
      password: ""
    };
  },
  _onSubmit: function (e) {
    e.preventDefault();
    if (this.props.busy) return;
    this.props.submitAuthDict({
      type: PasswordAuthEntry.LOGIN_TYPE,
      // TODO: Remove `user` once servers support proper UIA
      // See https://github.com/vector-im/riot-web/issues/10312
      user: this.props.matrixClient.credentials.userId,
      identifier: {
        type: "m.id.user",
        user: this.props.matrixClient.credentials.userId
      },
      password: this.state.password
    });
  },
  _onPasswordFieldChange: function (ev) {
    // enable the submit button iff the password is non-empty
    this.setState({
      password: ev.target.value
    });
  },
  render: function () {
    const passwordBoxClass = (0, _classnames.default)({
      "error": this.props.errorText
    });
    let submitButtonOrSpinner;

    if (this.props.busy) {
      const Loader = sdk.getComponent("elements.Spinner");
      submitButtonOrSpinner = /*#__PURE__*/_react.default.createElement(Loader, null);
    } else {
      submitButtonOrSpinner = /*#__PURE__*/_react.default.createElement("input", {
        type: "submit",
        className: "mx_Dialog_primary",
        disabled: !this.state.password,
        value: (0, _languageHandler._t)("Continue")
      });
    }

    let errorSection;

    if (this.props.errorText) {
      errorSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "error",
        role: "alert"
      }, this.props.errorText);
    }

    const Field = sdk.getComponent('elements.Field');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Confirm your identity by entering your account password below.")), /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onSubmit,
      className: "mx_InteractiveAuthEntryComponents_passwordSection"
    }, /*#__PURE__*/_react.default.createElement(Field, {
      className: passwordBoxClass,
      type: "password",
      name: "passwordField",
      label: (0, _languageHandler._t)('Password'),
      autoFocus: true,
      value: this.state.password,
      onChange: this._onPasswordFieldChange
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_button_row"
    }, submitButtonOrSpinner)), errorSection);
  }
});
exports.PasswordAuthEntry = PasswordAuthEntry;
const RecaptchaAuthEntry = (0, _createReactClass.default)({
  displayName: 'RecaptchaAuthEntry',
  statics: {
    LOGIN_TYPE: "m.login.recaptcha"
  },
  propTypes: {
    submitAuthDict: _propTypes.default.func.isRequired,
    stageParams: _propTypes.default.object.isRequired,
    errorText: _propTypes.default.string,
    busy: _propTypes.default.bool,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
  },
  _onCaptchaResponse: function (response) {
    this.props.submitAuthDict({
      type: RecaptchaAuthEntry.LOGIN_TYPE,
      response: response
    });
  },
  render: function () {
    if (this.props.busy) {
      const Loader = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Loader, null);
    }

    let errorText = this.props.errorText;
    const CaptchaForm = sdk.getComponent("views.auth.CaptchaForm");
    let sitePublicKey;

    if (!this.props.stageParams || !this.props.stageParams.public_key) {
      errorText = (0, _languageHandler._t)("Missing captcha public key in homeserver configuration. Please report " + "this to your homeserver administrator.");
    } else {
      sitePublicKey = this.props.stageParams.public_key;
    }

    let errorSection;

    if (errorText) {
      errorSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "error",
        role: "alert"
      }, errorText);
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(CaptchaForm, {
      sitePublicKey: sitePublicKey,
      onCaptchaResponse: this._onCaptchaResponse
    }), errorSection);
  }
});
exports.RecaptchaAuthEntry = RecaptchaAuthEntry;
const TermsAuthEntry = (0, _createReactClass.default)({
  displayName: 'TermsAuthEntry',
  statics: {
    LOGIN_TYPE: "m.login.terms"
  },
  propTypes: {
    submitAuthDict: _propTypes.default.func.isRequired,
    stageParams: _propTypes.default.object.isRequired,
    errorText: _propTypes.default.string,
    busy: _propTypes.default.bool,
    showContinue: _propTypes.default.bool,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
  },
  // TODO: [REACT-WARNING] Move this to constructor
  componentWillMount: function () {
    // example stageParams:
    //
    // {
    //     "policies": {
    //         "privacy_policy": {
    //             "version": "1.0",
    //             "en": {
    //                 "name": "Privacy Policy",
    //                 "url": "https://example.org/privacy-1.0-en.html",
    //             },
    //             "fr": {
    //                 "name": "Politique de confidentialité",
    //                 "url": "https://example.org/privacy-1.0-fr.html",
    //             },
    //         },
    //         "other_policy": { ... },
    //     }
    // }
    const allPolicies = this.props.stageParams.policies || {};

    const prefLang = _SettingsStore.default.getValue("language");

    const initToggles = {};
    const pickedPolicies = [];

    for (const policyId of Object.keys(allPolicies)) {
      const policy = allPolicies[policyId]; // Pick a language based on the user's language, falling back to english,
      // and finally to the first language available. If there's still no policy
      // available then the homeserver isn't respecting the spec.

      let langPolicy = policy[prefLang];
      if (!langPolicy) langPolicy = policy["en"];

      if (!langPolicy) {
        // last resort
        const firstLang = Object.keys(policy).find(e => e !== "version");
        langPolicy = policy[firstLang];
      }

      if (!langPolicy) throw new Error("Failed to find a policy to show the user");
      initToggles[policyId] = false;
      langPolicy.id = policyId;
      pickedPolicies.push(langPolicy);
    }

    this.setState({
      "toggledPolicies": initToggles,
      "policies": pickedPolicies
    });
  },
  tryContinue: function () {
    this._trySubmit();
  },
  _togglePolicy: function (policyId) {
    const newToggles = {};

    for (const policy of this.state.policies) {
      let checked = this.state.toggledPolicies[policy.id];
      if (policy.id === policyId) checked = !checked;
      newToggles[policy.id] = checked;
    }

    this.setState({
      "toggledPolicies": newToggles
    });
  },
  _trySubmit: function () {
    let allChecked = true;

    for (const policy of this.state.policies) {
      const checked = this.state.toggledPolicies[policy.id];
      allChecked = allChecked && checked;
    }

    if (allChecked) this.props.submitAuthDict({
      type: TermsAuthEntry.LOGIN_TYPE
    });else this.setState({
      errorText: (0, _languageHandler._t)("Please review and accept all of the homeserver's policies")
    });
  },
  render: function () {
    if (this.props.busy) {
      const Loader = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Loader, null);
    }

    const checkboxes = [];
    let allChecked = true;

    for (const policy of this.state.policies) {
      const checked = this.state.toggledPolicies[policy.id];
      allChecked = allChecked && checked;
      checkboxes.push( /*#__PURE__*/_react.default.createElement("label", {
        key: "policy_checkbox_" + policy.id,
        className: "mx_InteractiveAuthEntryComponents_termsPolicy"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "checkbox",
        onChange: () => this._togglePolicy(policy.id),
        checked: checked
      }), /*#__PURE__*/_react.default.createElement("a", {
        href: policy.url,
        target: "_blank",
        rel: "noreferrer noopener"
      }, policy.name)));
    }

    let errorSection;

    if (this.props.errorText || this.state.errorText) {
      errorSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "error",
        role: "alert"
      }, this.props.errorText || this.state.errorText);
    }

    let submitButton;

    if (this.props.showContinue !== false) {
      // XXX: button classes
      submitButton = /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_InteractiveAuthEntryComponents_termsSubmit mx_GeneralButton",
        onClick: this._trySubmit,
        disabled: !allChecked
      }, (0, _languageHandler._t)("Accept"));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Please review and accept the policies of this homeserver:")), checkboxes, errorSection, submitButton);
  }
});
exports.TermsAuthEntry = TermsAuthEntry;
const EmailIdentityAuthEntry = (0, _createReactClass.default)({
  displayName: 'EmailIdentityAuthEntry',
  statics: {
    LOGIN_TYPE: "m.login.email.identity"
  },
  propTypes: {
    matrixClient: _propTypes.default.object.isRequired,
    submitAuthDict: _propTypes.default.func.isRequired,
    authSessionId: _propTypes.default.string.isRequired,
    clientSecret: _propTypes.default.string.isRequired,
    inputs: _propTypes.default.object.isRequired,
    stageState: _propTypes.default.object.isRequired,
    fail: _propTypes.default.func.isRequired,
    setEmailSid: _propTypes.default.func.isRequired,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
  },
  render: function () {
    // This component is now only displayed once the token has been requested,
    // so we know the email has been sent. It can also get loaded after the user
    // has clicked the validation link if the server takes a while to propagate
    // the validation internally. If we're in the session spawned from clicking
    // the validation link, we won't know the email address, so if we don't have it,
    // assume that the link has been clicked and the server will realise when we poll.
    if (this.props.inputs.emailAddress === undefined) {
      const Loader = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Loader, null);
    } else {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("An email has been sent to %(emailAddress)s", {
        emailAddress: sub => /*#__PURE__*/_react.default.createElement("i", null, this.props.inputs.emailAddress)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Please check your email to continue registration.")));
    }
  }
});
exports.EmailIdentityAuthEntry = EmailIdentityAuthEntry;
const MsisdnAuthEntry = (0, _createReactClass.default)({
  displayName: 'MsisdnAuthEntry',
  statics: {
    LOGIN_TYPE: "m.login.msisdn"
  },
  propTypes: {
    inputs: _propTypes.default.shape({
      phoneCountry: _propTypes.default.string,
      phoneNumber: _propTypes.default.string
    }),
    fail: _propTypes.default.func,
    clientSecret: _propTypes.default.func,
    submitAuthDict: _propTypes.default.func.isRequired,
    matrixClient: _propTypes.default.object,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      token: '',
      requestingToken: false
    };
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
    this._submitUrl = null;
    this._sid = null;
    this._msisdn = null;
    this._tokenBox = null;
    this.setState({
      requestingToken: true
    });

    this._requestMsisdnToken().catch(e => {
      this.props.fail(e);
    }).finally(() => {
      this.setState({
        requestingToken: false
      });
    });
  },

  /*
   * Requests a verification token by SMS.
   */
  _requestMsisdnToken: function () {
    return this.props.matrixClient.requestRegisterMsisdnToken(this.props.inputs.phoneCountry, this.props.inputs.phoneNumber, this.props.clientSecret, 1 // TODO: Multiple send attempts?
    ).then(result => {
      this._submitUrl = result.submit_url;
      this._sid = result.sid;
      this._msisdn = result.msisdn;
    });
  },
  _onTokenChange: function (e) {
    this.setState({
      token: e.target.value
    });
  },
  _onFormSubmit: async function (e) {
    e.preventDefault();
    if (this.state.token == '') return;
    this.setState({
      errorText: null
    });

    try {
      const requiresIdServerParam = await this.props.matrixClient.doesServerRequireIdServerParam();
      let result;

      if (this._submitUrl) {
        result = await this.props.matrixClient.submitMsisdnTokenOtherUrl(this._submitUrl, this._sid, this.props.clientSecret, this.state.token);
      } else if (requiresIdServerParam) {
        result = await this.props.matrixClient.submitMsisdnToken(this._sid, this.props.clientSecret, this.state.token);
      } else {
        throw new Error("The registration with MSISDN flow is misconfigured");
      }

      if (result.success) {
        const creds = {
          sid: this._sid,
          client_secret: this.props.clientSecret
        };

        if (requiresIdServerParam) {
          const idServerParsedUrl = _url.default.parse(this.props.matrixClient.getIdentityServerUrl());

          creds.id_server = idServerParsedUrl.host;
        }

        this.props.submitAuthDict({
          type: MsisdnAuthEntry.LOGIN_TYPE,
          // TODO: Remove `threepid_creds` once servers support proper UIA
          // See https://github.com/vector-im/riot-web/issues/10312
          threepid_creds: creds,
          threepidCreds: creds
        });
      } else {
        this.setState({
          errorText: (0, _languageHandler._t)("Token incorrect")
        });
      }
    } catch (e) {
      this.props.fail(e);
      console.log("Failed to submit msisdn token");
    }
  },
  render: function () {
    if (this.state.requestingToken) {
      const Loader = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Loader, null);
    } else {
      const enableSubmit = Boolean(this.state.token);
      const submitClasses = (0, _classnames.default)({
        mx_InteractiveAuthEntryComponents_msisdnSubmit: true,
        mx_GeneralButton: true
      });
      let errorSection;

      if (this.state.errorText) {
        errorSection = /*#__PURE__*/_react.default.createElement("div", {
          className: "error",
          role: "alert"
        }, this.state.errorText);
      }

      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("A text message has been sent to %(msisdn)s", {
        msisdn: /*#__PURE__*/_react.default.createElement("i", null, this._msisdn)
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Please enter the code it contains:")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_InteractiveAuthEntryComponents_msisdnWrapper"
      }, /*#__PURE__*/_react.default.createElement("form", {
        onSubmit: this._onFormSubmit
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "text",
        className: "mx_InteractiveAuthEntryComponents_msisdnEntry",
        value: this.state.token,
        onChange: this._onTokenChange,
        "aria-label": (0, _languageHandler._t)("Code")
      }), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement("input", {
        type: "submit",
        value: (0, _languageHandler._t)("Submit"),
        className: submitClasses,
        disabled: !enableSubmit
      })), errorSection));
    }
  }
});
exports.MsisdnAuthEntry = MsisdnAuthEntry;

class SSOAuthEntry extends _react.default.Component {
  // button to start SSO
  // button to confirm SSO completed
  constructor(props) {
    super(props); // We actually send the user through fallback auth so we don't have to
    // deal with a redirect back to us, losing application context.

    (0, _defineProperty2.default)(this, "_ssoUrl", void 0);
    (0, _defineProperty2.default)(this, "onStartAuthClick", () => {
      // Note: We don't use PlatformPeg's startSsoAuth functions because we almost
      // certainly will need to open the thing in a new tab to avoid losing application
      // context.
      window.open(this._ssoUrl, '_blank');
      this.setState({
        phase: SSOAuthEntry.PHASE_POSTAUTH
      });
      this.props.onPhaseChange(SSOAuthEntry.PHASE_POSTAUTH);
    });
    (0, _defineProperty2.default)(this, "onConfirmClick", () => {
      this.props.submitAuthDict({});
    });
    this._ssoUrl = props.matrixClient.getFallbackAuthUrl(this.props.loginType, this.props.authSessionId);
    this.state = {
      phase: SSOAuthEntry.PHASE_PREAUTH
    };
  }

  componentDidMount()
  /*: void*/
  {
    this.props.onPhaseChange(SSOAuthEntry.PHASE_PREAUTH);
  }

  render() {
    let continueButton = null;

    const cancelButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this.props.onCancel,
      kind: this.props.continueKind ? this.props.continueKind + '_outline' : 'primary_outline'
    }, (0, _languageHandler._t)("Cancel"));

    if (this.state.phase === SSOAuthEntry.PHASE_PREAUTH) {
      continueButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onStartAuthClick,
        kind: this.props.continueKind || 'primary'
      }, this.props.continueText || (0, _languageHandler._t)("Single Sign On"));
    } else {
      continueButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onConfirmClick,
        kind: this.props.continueKind || 'primary'
      }, this.props.continueText || (0, _languageHandler._t)("Confirm"));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InteractiveAuthEntryComponents_sso_buttons"
    }, cancelButton, continueButton);
  }

}

exports.SSOAuthEntry = SSOAuthEntry;
(0, _defineProperty2.default)(SSOAuthEntry, "propTypes", {
  matrixClient: _propTypes.default.object.isRequired,
  authSessionId: _propTypes.default.string.isRequired,
  loginType: _propTypes.default.string.isRequired,
  submitAuthDict: _propTypes.default.func.isRequired,
  errorText: _propTypes.default.string,
  onPhaseChange: _propTypes.default.func.isRequired,
  continueText: _propTypes.default.string,
  continueKind: _propTypes.default.string,
  onCancel: _propTypes.default.func
});
(0, _defineProperty2.default)(SSOAuthEntry, "LOGIN_TYPE", "m.login.sso");
(0, _defineProperty2.default)(SSOAuthEntry, "UNSTABLE_LOGIN_TYPE", "org.matrix.login.sso");
(0, _defineProperty2.default)(SSOAuthEntry, "PHASE_PREAUTH", 1);
(0, _defineProperty2.default)(SSOAuthEntry, "PHASE_POSTAUTH", 2);
const FallbackAuthEntry = (0, _createReactClass.default)({
  displayName: 'FallbackAuthEntry',
  propTypes: {
    matrixClient: _propTypes.default.object.isRequired,
    authSessionId: _propTypes.default.string.isRequired,
    loginType: _propTypes.default.string.isRequired,
    submitAuthDict: _propTypes.default.func.isRequired,
    errorText: _propTypes.default.string,
    onPhaseChange: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    this.props.onPhaseChange(DEFAULT_PHASE);
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    // we have to make the user click a button, as browsers will block
    // the popup if we open it immediately.
    this._popupWindow = null;
    window.addEventListener("message", this._onReceiveMessage);
    this._fallbackButton = (0, _react.createRef)();
  },
  componentWillUnmount: function () {
    window.removeEventListener("message", this._onReceiveMessage);

    if (this._popupWindow) {
      this._popupWindow.close();
    }
  },
  focus: function () {
    if (this._fallbackButton.current) {
      this._fallbackButton.current.focus();
    }
  },
  _onShowFallbackClick: function (e) {
    e.preventDefault();
    e.stopPropagation();
    const url = this.props.matrixClient.getFallbackAuthUrl(this.props.loginType, this.props.authSessionId);
    this._popupWindow = window.open(url);
    this._popupWindow.opener = null;
  },
  _onReceiveMessage: function (event) {
    if (event.data === "authDone" && event.origin === this.props.matrixClient.getHomeserverUrl()) {
      this.props.submitAuthDict({});
    }
  },
  render: function () {
    let errorSection;

    if (this.props.errorText) {
      errorSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "error",
        role: "alert"
      }, this.props.errorText);
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("a", {
      href: "",
      ref: this._fallbackButton,
      onClick: this._onShowFallbackClick
    }, (0, _languageHandler._t)("Start authentication")), errorSection);
  }
});
exports.FallbackAuthEntry = FallbackAuthEntry;
const AuthEntryComponents = [PasswordAuthEntry, RecaptchaAuthEntry, EmailIdentityAuthEntry, MsisdnAuthEntry, TermsAuthEntry, SSOAuthEntry];

function getEntryComponentForLoginType(loginType) {
  for (const c of AuthEntryComponents) {
    if (c.LOGIN_TYPE === loginType || c.UNSTABLE_LOGIN_TYPE === loginType) {
      return c;
    }
  }

  return FallbackAuthEntry;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvSW50ZXJhY3RpdmVBdXRoRW50cnlDb21wb25lbnRzLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfUEhBU0UiLCJQYXNzd29yZEF1dGhFbnRyeSIsImRpc3BsYXlOYW1lIiwic3RhdGljcyIsIkxPR0lOX1RZUEUiLCJwcm9wVHlwZXMiLCJtYXRyaXhDbGllbnQiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3VibWl0QXV0aERpY3QiLCJmdW5jIiwiZXJyb3JUZXh0Iiwic3RyaW5nIiwiYnVzeSIsImJvb2wiLCJvblBoYXNlQ2hhbmdlIiwiY29tcG9uZW50RGlkTW91bnQiLCJwcm9wcyIsImdldEluaXRpYWxTdGF0ZSIsInBhc3N3b3JkIiwiX29uU3VibWl0IiwiZSIsInByZXZlbnREZWZhdWx0IiwidHlwZSIsInVzZXIiLCJjcmVkZW50aWFscyIsInVzZXJJZCIsImlkZW50aWZpZXIiLCJzdGF0ZSIsIl9vblBhc3N3b3JkRmllbGRDaGFuZ2UiLCJldiIsInNldFN0YXRlIiwidGFyZ2V0IiwidmFsdWUiLCJyZW5kZXIiLCJwYXNzd29yZEJveENsYXNzIiwic3VibWl0QnV0dG9uT3JTcGlubmVyIiwiTG9hZGVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZXJyb3JTZWN0aW9uIiwiRmllbGQiLCJSZWNhcHRjaGFBdXRoRW50cnkiLCJzdGFnZVBhcmFtcyIsIl9vbkNhcHRjaGFSZXNwb25zZSIsInJlc3BvbnNlIiwiQ2FwdGNoYUZvcm0iLCJzaXRlUHVibGljS2V5IiwicHVibGljX2tleSIsIlRlcm1zQXV0aEVudHJ5Iiwic2hvd0NvbnRpbnVlIiwiY29tcG9uZW50V2lsbE1vdW50IiwiYWxsUG9saWNpZXMiLCJwb2xpY2llcyIsInByZWZMYW5nIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiaW5pdFRvZ2dsZXMiLCJwaWNrZWRQb2xpY2llcyIsInBvbGljeUlkIiwiT2JqZWN0Iiwia2V5cyIsInBvbGljeSIsImxhbmdQb2xpY3kiLCJmaXJzdExhbmciLCJmaW5kIiwiRXJyb3IiLCJpZCIsInB1c2giLCJ0cnlDb250aW51ZSIsIl90cnlTdWJtaXQiLCJfdG9nZ2xlUG9saWN5IiwibmV3VG9nZ2xlcyIsImNoZWNrZWQiLCJ0b2dnbGVkUG9saWNpZXMiLCJhbGxDaGVja2VkIiwiY2hlY2tib3hlcyIsInVybCIsIm5hbWUiLCJzdWJtaXRCdXR0b24iLCJFbWFpbElkZW50aXR5QXV0aEVudHJ5IiwiYXV0aFNlc3Npb25JZCIsImNsaWVudFNlY3JldCIsImlucHV0cyIsInN0YWdlU3RhdGUiLCJmYWlsIiwic2V0RW1haWxTaWQiLCJlbWFpbEFkZHJlc3MiLCJ1bmRlZmluZWQiLCJzdWIiLCJNc2lzZG5BdXRoRW50cnkiLCJzaGFwZSIsInBob25lQ291bnRyeSIsInBob25lTnVtYmVyIiwidG9rZW4iLCJyZXF1ZXN0aW5nVG9rZW4iLCJfc3VibWl0VXJsIiwiX3NpZCIsIl9tc2lzZG4iLCJfdG9rZW5Cb3giLCJfcmVxdWVzdE1zaXNkblRva2VuIiwiY2F0Y2giLCJmaW5hbGx5IiwicmVxdWVzdFJlZ2lzdGVyTXNpc2RuVG9rZW4iLCJ0aGVuIiwicmVzdWx0Iiwic3VibWl0X3VybCIsInNpZCIsIm1zaXNkbiIsIl9vblRva2VuQ2hhbmdlIiwiX29uRm9ybVN1Ym1pdCIsInJlcXVpcmVzSWRTZXJ2ZXJQYXJhbSIsImRvZXNTZXJ2ZXJSZXF1aXJlSWRTZXJ2ZXJQYXJhbSIsInN1Ym1pdE1zaXNkblRva2VuT3RoZXJVcmwiLCJzdWJtaXRNc2lzZG5Ub2tlbiIsInN1Y2Nlc3MiLCJjcmVkcyIsImNsaWVudF9zZWNyZXQiLCJpZFNlcnZlclBhcnNlZFVybCIsInBhcnNlIiwiZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwiLCJpZF9zZXJ2ZXIiLCJob3N0IiwidGhyZWVwaWRfY3JlZHMiLCJ0aHJlZXBpZENyZWRzIiwiY29uc29sZSIsImxvZyIsImVuYWJsZVN1Ym1pdCIsIkJvb2xlYW4iLCJzdWJtaXRDbGFzc2VzIiwibXhfSW50ZXJhY3RpdmVBdXRoRW50cnlDb21wb25lbnRzX21zaXNkblN1Ym1pdCIsIm14X0dlbmVyYWxCdXR0b24iLCJTU09BdXRoRW50cnkiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwid2luZG93Iiwib3BlbiIsIl9zc29VcmwiLCJwaGFzZSIsIlBIQVNFX1BPU1RBVVRIIiwiZ2V0RmFsbGJhY2tBdXRoVXJsIiwibG9naW5UeXBlIiwiUEhBU0VfUFJFQVVUSCIsImNvbnRpbnVlQnV0dG9uIiwiY2FuY2VsQnV0dG9uIiwib25DYW5jZWwiLCJjb250aW51ZUtpbmQiLCJvblN0YXJ0QXV0aENsaWNrIiwiY29udGludWVUZXh0Iiwib25Db25maXJtQ2xpY2siLCJGYWxsYmFja0F1dGhFbnRyeSIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJfcG9wdXBXaW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiX29uUmVjZWl2ZU1lc3NhZ2UiLCJfZmFsbGJhY2tCdXR0b24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjbG9zZSIsImZvY3VzIiwiY3VycmVudCIsIl9vblNob3dGYWxsYmFja0NsaWNrIiwic3RvcFByb3BhZ2F0aW9uIiwib3BlbmVyIiwiZXZlbnQiLCJkYXRhIiwib3JpZ2luIiwiZ2V0SG9tZXNlcnZlclVybCIsIkF1dGhFbnRyeUNvbXBvbmVudHMiLCJnZXRFbnRyeUNvbXBvbmVudEZvckxvZ2luVHlwZSIsImMiLCJVTlNUQUJMRV9MT0dJTl9UWVBFIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOENPLE1BQU1BLGFBQWEsR0FBRyxDQUF0Qjs7QUFFQSxNQUFNQyxpQkFB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T0FBTyxFQUFFLEtBQUtNO0FBQXBELE9BQTRFLHlCQUFHLHNCQUFILENBQTVFLENBREosRUFFSzFILFlBRkwsQ0FESjtBQU1IO0FBM0U2QyxDQUFqQixDQUExQjs7QUE4RVAsTUFBTWlJLG1CQUFtQixHQUFHLENBQ3hCekssaUJBRHdCLEVBRXhCMEMsa0JBRndCLEVBR3hCc0Msc0JBSHdCLEVBSXhCVSxlQUp3QixFQUt4QnpDLGNBTHdCLEVBTXhCbUYsWUFOd0IsQ0FBNUI7O0FBU2UsU0FBU3NDLDZCQUFULENBQXVDNUIsU0FBdkMsRUFBa0Q7QUFDN0QsT0FBSyxNQUFNNkIsQ0FBWCxJQUFnQkYsbUJBQWhCLEVBQXFDO0FBQ2pDLFFBQUlFLENBQUMsQ0FBQ3hLLFVBQUYsS0FBaUIySSxTQUFqQixJQUE4QjZCLENBQUMsQ0FBQ0MsbUJBQUYsS0FBMEI5QixTQUE1RCxFQUF1RTtBQUNuRSxhQUFPNkIsQ0FBUDtBQUNIO0FBQ0o7O0FBQ0QsU0FBT3BCLGlCQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOSwgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJztcblxuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuXG4vKiBUaGlzIGZpbGUgY29udGFpbnMgYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMgd2hpY2ggYXJlIHVzZWQgYnkgdGhlXG4gKiBJbnRlcmFjdGl2ZUF1dGggdG8gcHJvbXB0IHRoZSB1c2VyIHRvIGVudGVyIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWRcbiAqIGZvciBhbiBhdXRoIHN0YWdlLiAoVGhlIGludGVudGlvbiBpcyB0aGF0IHRoZXkgY291bGQgYWxzbyBiZSB1c2VkIGZvciBvdGhlclxuICogY29tcG9uZW50cywgc3VjaCBhcyB0aGUgcmVnaXN0cmF0aW9uIGZsb3cpLlxuICpcbiAqIENhbGwgZ2V0RW50cnlDb21wb25lbnRGb3JMb2dpblR5cGUoKSB0byBnZXQgYSBjb21wb25lbnQgc3VpdGFibGUgZm9yIGFcbiAqIHBhcnRpY3VsYXIgbG9naW4gdHlwZS4gRWFjaCBjb21wb25lbnQgcmVxdWlyZXMgdGhlIHNhbWUgcHJvcGVydGllczpcbiAqXG4gKiBtYXRyaXhDbGllbnQ6ICAgICAgICAgICBBIG1hdHJpeCBjbGllbnQuIE1heSBiZSBhIGRpZmZlcmVudCBvbmUgdG8gdGhlIG9uZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudGx5IGJlaW5nIHVzZWQgZ2VuZXJhbGx5IChlZy4gdG8gcmVnaXN0ZXIgd2l0aFxuICogICAgICAgICAgICAgICAgICAgICAgICAgb25lIEhTIHdoaWxzdCBiZWlnbiBhIGd1ZXN0IG9uIGFub3RoZXIpLlxuICogbG9naW5UeXBlOiAgICAgICAgICAgICAgdGhlIGxvZ2luIHR5cGUgb2YgdGhlIGF1dGggc3RhZ2UgYmVpbmcgYXR0ZW1wdGVkXG4gKiBhdXRoU2Vzc2lvbklkOiAgICAgICAgICBzZXNzaW9uIGlkIGZyb20gdGhlIHNlcnZlclxuICogY2xpZW50U2VjcmV0OiAgICAgICAgICAgVGhlIGNsaWVudCBzZWNyZXQgaW4gdXNlIGZvciBJRCBzZXJ2ZXIgYXV0aCBzZXNzaW9uc1xuICogc3RhZ2VQYXJhbXM6ICAgICAgICAgICAgcGFyYW1zIGZyb20gdGhlIHNlcnZlciBmb3IgdGhlIHN0YWdlIGJlaW5nIGF0dGVtcHRlZFxuICogZXJyb3JUZXh0OiAgICAgICAgICAgICAgZXJyb3IgbWVzc2FnZSBmcm9tIGEgcHJldmlvdXMgYXR0ZW1wdCB0byBhdXRoZW50aWNhdGVcbiAqIHN1Ym1pdEF1dGhEaWN0OiAgICAgICAgIGEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGUgbmV3IGF1dGggZGljdFxuICogYnVzeTogICAgICAgICAgICAgICAgICAgYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgYXV0aCBsb2dpYyBpcyBkb2luZyBzb21ldGhpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSB1c2VyIG5lZWRzIHRvIHdhaXQgZm9yLlxuICogaW5wdXRzOiAgICAgICAgICAgICAgICAgT2JqZWN0IG9mIGlucHV0cyBwcm92aWRlZCBieSB0aGUgdXNlciwgYXMgaW4ganMtc2RrXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGl2ZS1hdXRoXG4gKiBzdGFnZVN0YXRlOiAgICAgICAgICAgICBTdGFnZS1zcGVjaWZpYyBvYmplY3QgdXNlZCBmb3IgY29tbXVuaWNhdGluZyBzdGF0ZSBpbmZvcm1hdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgdG8gdGhlIFVJIGZyb20gdGhlIHN0YXRlLXNwZWNpZmljIGF1dGggbG9naWMuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBEZWZpbmVkIGtleXMgZm9yIHN0YWdlcyBhcmU6XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5sb2dpbi5lbWFpbC5pZGVudGl0eTpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBlbWFpbFNpZDogc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgc2lkIG9mIHRoZSBhY3RpdmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uIHNlc3Npb24gZnJvbSB0aGUgSUQgc2VydmVyLCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsIGlmIG5vIHNlc3Npb24gaXMgYWN0aXZlLlxuICogZmFpbDogICAgICAgICAgICAgICAgICAgYSBmdW5jdGlvbiB3aGljaCBzaG91bGQgYmUgY2FsbGVkIHdpdGggYW4gZXJyb3Igb2JqZWN0IGlmIGFuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvciBvY2N1cnJlZCBkdXJpbmcgdGhlIGF1dGggc3RhZ2UuIFRoaXMgd2lsbCBjYXVzZSB0aGUgYXV0aFxuICogICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbiB0byBiZSBmYWlsZWQgYW5kIHRoZSBwcm9jZXNzIHRvIGdvIGJhY2sgdG8gdGhlIHN0YXJ0LlxuICogc2V0RW1haWxTaWQ6ICAgICAgICAgICAgbS5sb2dpbi5lbWFpbC5pZGVudGl0eSBvbmx5OiBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgZW1haWwgc2lkIGFmdGVyIGEgdG9rZW4gaXMgcmVxdWVzdGVkLlxuICogb25QaGFzZUNoYW5nZTogICAgICAgICAgQSBmdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgc3RhZ2UncyBwaGFzZSBjaGFuZ2VzLiBJZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHN0YWdlIGhhcyBubyBwaGFzZXMsIGNhbGwgdGhpcyB3aXRoIERFRkFVTFRfUEhBU0UuIFRha2VzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBvbmUgYXJndW1lbnQsIHRoZSBwaGFzZSwgYW5kIGlzIGFsd2F5cyBkZWZpbmVkL3JlcXVpcmVkLlxuICogY29udGludWVUZXh0OiAgICAgICAgICAgRm9yIHN0YWdlcyB3aGljaCBoYXZlIGEgY29udGludWUgYnV0dG9uLCB0aGUgdGV4dCB0byB1c2UuXG4gKiBjb250aW51ZUtpbmQ6ICAgICAgICAgICBGb3Igc3RhZ2VzIHdoaWNoIGhhdmUgYSBjb250aW51ZSBidXR0b24sIHRoZSBzdHlsZSBvZiBidXR0b24gdG9cbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHVzZS4gRm9yIGV4YW1wbGUsICdkYW5nZXInIG9yICdwcmltYXJ5Jy5cbiAqIG9uQ2FuY2VsICAgICAgICAgICAgICAgIEEgZnVuY3Rpb24gd2l0aCBubyBhcmd1bWVudHMgd2hpY2ggaXMgY2FsbGVkIGJ5IHRoZSBzdGFnZSBpZiB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIga25vd2luZ2x5IGNhbmNlbGxlZC9kaXNtaXNzZWQgdGhlIGF1dGhlbnRpY2F0aW9uIGF0dGVtcHQuXG4gKlxuICogRWFjaCBjb21wb25lbnQgbWF5IGFsc28gcHJvdmlkZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyAoYmV5b25kIHRoZSBzdGFuZGFyZCBSZWFjdCBvbmVzKTpcbiAqICAgIGZvY3VzOiBzZXQgdGhlIGlucHV0IGZvY3VzIGFwcHJvcHJpYXRlbHkgaW4gdGhlIGZvcm0uXG4gKi9cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUEhBU0UgPSAwO1xuXG5leHBvcnQgY29uc3QgUGFzc3dvcmRBdXRoRW50cnkgPSBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1Bhc3N3b3JkQXV0aEVudHJ5JyxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgTE9HSU5fVFlQRTogXCJtLmxvZ2luLnBhc3N3b3JkXCIsXG4gICAgfSxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBtYXRyaXhDbGllbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgc3VibWl0QXV0aERpY3Q6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIGVycm9yVGV4dDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gaXMgdGhlIGF1dGggbG9naWMgY3VycmVudGx5IHdhaXRpbmcgZm9yIHNvbWV0aGluZyB0b1xuICAgICAgICAvLyBoYXBwZW4/XG4gICAgICAgIGJ1c3k6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBvblBoYXNlQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25QaGFzZUNoYW5nZShERUZBVUxUX1BIQVNFKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhc3N3b3JkOiBcIlwiLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBfb25TdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5idXN5KSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5wcm9wcy5zdWJtaXRBdXRoRGljdCh7XG4gICAgICAgICAgICB0eXBlOiBQYXNzd29yZEF1dGhFbnRyeS5MT0dJTl9UWVBFLFxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIGB1c2VyYCBvbmNlIHNlcnZlcnMgc3VwcG9ydCBwcm9wZXIgVUlBXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTAzMTJcbiAgICAgICAgICAgIHVzZXI6IHRoaXMucHJvcHMubWF0cml4Q2xpZW50LmNyZWRlbnRpYWxzLnVzZXJJZCxcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm0uaWQudXNlclwiLFxuICAgICAgICAgICAgICAgIHVzZXI6IHRoaXMucHJvcHMubWF0cml4Q2xpZW50LmNyZWRlbnRpYWxzLnVzZXJJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXNzd29yZDogdGhpcy5zdGF0ZS5wYXNzd29yZCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9vblBhc3N3b3JkRmllbGRDaGFuZ2U6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIC8vIGVuYWJsZSB0aGUgc3VibWl0IGJ1dHRvbiBpZmYgdGhlIHBhc3N3b3JkIGlzIG5vbi1lbXB0eVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhc3N3b3JkOiBldi50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBwYXNzd29yZEJveENsYXNzID0gY2xhc3NuYW1lcyh7XG4gICAgICAgICAgICBcImVycm9yXCI6IHRoaXMucHJvcHMuZXJyb3JUZXh0LFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgc3VibWl0QnV0dG9uT3JTcGlubmVyO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5idXN5KSB7XG4gICAgICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgICAgIHN1Ym1pdEJ1dHRvbk9yU3Bpbm5lciA9IDxMb2FkZXIgLz47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdWJtaXRCdXR0b25PclNwaW5uZXIgPSAoXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9EaWFsb2dfcHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshdGhpcy5zdGF0ZS5wYXNzd29yZH1cbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e190KFwiQ29udGludWVcIil9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZXJyb3JTZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5lcnJvclRleHQpIHtcbiAgICAgICAgICAgIGVycm9yU2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCIgcm9sZT1cImFsZXJ0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5lcnJvclRleHQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEZpZWxkID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRmllbGQnKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57IF90KFwiQ29uZmlybSB5b3VyIGlkZW50aXR5IGJ5IGVudGVyaW5nIHlvdXIgYWNjb3VudCBwYXNzd29yZCBiZWxvdy5cIikgfTwvcD5cbiAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5fb25TdWJtaXR9IGNsYXNzTmFtZT1cIm14X0ludGVyYWN0aXZlQXV0aEVudHJ5Q29tcG9uZW50c19wYXNzd29yZFNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgPEZpZWxkXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3Bhc3N3b3JkQm94Q2xhc3N9XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInBhc3N3b3JkRmllbGRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdQYXNzd29yZCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucGFzc3dvcmR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25QYXNzd29yZEZpZWxkQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X2J1dHRvbl9yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc3VibWl0QnV0dG9uT3JTcGlubmVyIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgeyBlcnJvclNlY3Rpb24gfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuXG5leHBvcnQgY29uc3QgUmVjYXB0Y2hhQXV0aEVudHJ5ID0gY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSZWNhcHRjaGFBdXRoRW50cnknLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICBMT0dJTl9UWVBFOiBcIm0ubG9naW4ucmVjYXB0Y2hhXCIsXG4gICAgfSxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBzdWJtaXRBdXRoRGljdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgc3RhZ2VQYXJhbXM6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgZXJyb3JUZXh0OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBidXN5OiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgb25QaGFzZUNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uUGhhc2VDaGFuZ2UoREVGQVVMVF9QSEFTRSk7XG4gICAgfSxcblxuICAgIF9vbkNhcHRjaGFSZXNwb25zZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5zdWJtaXRBdXRoRGljdCh7XG4gICAgICAgICAgICB0eXBlOiBSZWNhcHRjaGFBdXRoRW50cnkuTE9HSU5fVFlQRSxcbiAgICAgICAgICAgIHJlc3BvbnNlOiByZXNwb25zZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmJ1c3kpIHtcbiAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxMb2FkZXIgLz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZXJyb3JUZXh0ID0gdGhpcy5wcm9wcy5lcnJvclRleHQ7XG5cbiAgICAgICAgY29uc3QgQ2FwdGNoYUZvcm0gPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuYXV0aC5DYXB0Y2hhRm9ybVwiKTtcbiAgICAgICAgbGV0IHNpdGVQdWJsaWNLZXk7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5zdGFnZVBhcmFtcyB8fCAhdGhpcy5wcm9wcy5zdGFnZVBhcmFtcy5wdWJsaWNfa2V5KSB7XG4gICAgICAgICAgICBlcnJvclRleHQgPSBfdChcbiAgICAgICAgICAgICAgICBcIk1pc3NpbmcgY2FwdGNoYSBwdWJsaWMga2V5IGluIGhvbWVzZXJ2ZXIgY29uZmlndXJhdGlvbi4gUGxlYXNlIHJlcG9ydCBcIiArXG4gICAgICAgICAgICAgICAgXCJ0aGlzIHRvIHlvdXIgaG9tZXNlcnZlciBhZG1pbmlzdHJhdG9yLlwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpdGVQdWJsaWNLZXkgPSB0aGlzLnByb3BzLnN0YWdlUGFyYW1zLnB1YmxpY19rZXk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZXJyb3JTZWN0aW9uO1xuICAgICAgICBpZiAoZXJyb3JUZXh0KSB7XG4gICAgICAgICAgICBlcnJvclNlY3Rpb24gPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJlcnJvclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgICAgICAgICAgICB7IGVycm9yVGV4dCB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPENhcHRjaGFGb3JtIHNpdGVQdWJsaWNLZXk9e3NpdGVQdWJsaWNLZXl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FwdGNoYVJlc3BvbnNlPXt0aGlzLl9vbkNhcHRjaGFSZXNwb25zZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIHsgZXJyb3JTZWN0aW9uIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuZXhwb3J0IGNvbnN0IFRlcm1zQXV0aEVudHJ5ID0gY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdUZXJtc0F1dGhFbnRyeScsXG5cbiAgICBzdGF0aWNzOiB7XG4gICAgICAgIExPR0lOX1RZUEU6IFwibS5sb2dpbi50ZXJtc1wiLFxuICAgIH0sXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgc3VibWl0QXV0aERpY3Q6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHN0YWdlUGFyYW1zOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIGVycm9yVGV4dDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgYnVzeTogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIHNob3dDb250aW51ZTogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIG9uUGhhc2VDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblBoYXNlQ2hhbmdlKERFRkFVTFRfUEhBU0UpO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gTW92ZSB0aGlzIHRvIGNvbnN0cnVjdG9yXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gZXhhbXBsZSBzdGFnZVBhcmFtczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgICAgXCJwb2xpY2llc1wiOiB7XG4gICAgICAgIC8vICAgICAgICAgXCJwcml2YWN5X3BvbGljeVwiOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIFwidmVyc2lvblwiOiBcIjEuMFwiLFxuICAgICAgICAvLyAgICAgICAgICAgICBcImVuXCI6IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIlByaXZhY3kgUG9saWN5XCIsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBcInVybFwiOiBcImh0dHBzOi8vZXhhbXBsZS5vcmcvcHJpdmFjeS0xLjAtZW4uaHRtbFwiLFxuICAgICAgICAvLyAgICAgICAgICAgICB9LFxuICAgICAgICAvLyAgICAgICAgICAgICBcImZyXCI6IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIlBvbGl0aXF1ZSBkZSBjb25maWRlbnRpYWxpdMOpXCIsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBcInVybFwiOiBcImh0dHBzOi8vZXhhbXBsZS5vcmcvcHJpdmFjeS0xLjAtZnIuaHRtbFwiLFxuICAgICAgICAvLyAgICAgICAgICAgICB9LFxuICAgICAgICAvLyAgICAgICAgIH0sXG4gICAgICAgIC8vICAgICAgICAgXCJvdGhlcl9wb2xpY3lcIjogeyAuLi4gfSxcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGNvbnN0IGFsbFBvbGljaWVzID0gdGhpcy5wcm9wcy5zdGFnZVBhcmFtcy5wb2xpY2llcyB8fCB7fTtcbiAgICAgICAgY29uc3QgcHJlZkxhbmcgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwibGFuZ3VhZ2VcIik7XG4gICAgICAgIGNvbnN0IGluaXRUb2dnbGVzID0ge307XG4gICAgICAgIGNvbnN0IHBpY2tlZFBvbGljaWVzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcG9saWN5SWQgb2YgT2JqZWN0LmtleXMoYWxsUG9saWNpZXMpKSB7XG4gICAgICAgICAgICBjb25zdCBwb2xpY3kgPSBhbGxQb2xpY2llc1twb2xpY3lJZF07XG5cbiAgICAgICAgICAgIC8vIFBpY2sgYSBsYW5ndWFnZSBiYXNlZCBvbiB0aGUgdXNlcidzIGxhbmd1YWdlLCBmYWxsaW5nIGJhY2sgdG8gZW5nbGlzaCxcbiAgICAgICAgICAgIC8vIGFuZCBmaW5hbGx5IHRvIHRoZSBmaXJzdCBsYW5ndWFnZSBhdmFpbGFibGUuIElmIHRoZXJlJ3Mgc3RpbGwgbm8gcG9saWN5XG4gICAgICAgICAgICAvLyBhdmFpbGFibGUgdGhlbiB0aGUgaG9tZXNlcnZlciBpc24ndCByZXNwZWN0aW5nIHRoZSBzcGVjLlxuICAgICAgICAgICAgbGV0IGxhbmdQb2xpY3kgPSBwb2xpY3lbcHJlZkxhbmddO1xuICAgICAgICAgICAgaWYgKCFsYW5nUG9saWN5KSBsYW5nUG9saWN5ID0gcG9saWN5W1wiZW5cIl07XG4gICAgICAgICAgICBpZiAoIWxhbmdQb2xpY3kpIHtcbiAgICAgICAgICAgICAgICAvLyBsYXN0IHJlc29ydFxuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGFuZyA9IE9iamVjdC5rZXlzKHBvbGljeSkuZmluZChlID0+IGUgIT09IFwidmVyc2lvblwiKTtcbiAgICAgICAgICAgICAgICBsYW5nUG9saWN5ID0gcG9saWN5W2ZpcnN0TGFuZ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxhbmdQb2xpY3kpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBmaW5kIGEgcG9saWN5IHRvIHNob3cgdGhlIHVzZXJcIik7XG5cbiAgICAgICAgICAgIGluaXRUb2dnbGVzW3BvbGljeUlkXSA9IGZhbHNlO1xuXG4gICAgICAgICAgICBsYW5nUG9saWN5LmlkID0gcG9saWN5SWQ7XG4gICAgICAgICAgICBwaWNrZWRQb2xpY2llcy5wdXNoKGxhbmdQb2xpY3kpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBcInRvZ2dsZWRQb2xpY2llc1wiOiBpbml0VG9nZ2xlcyxcbiAgICAgICAgICAgIFwicG9saWNpZXNcIjogcGlja2VkUG9saWNpZXMsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0cnlDb250aW51ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RyeVN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICBfdG9nZ2xlUG9saWN5OiBmdW5jdGlvbihwb2xpY3lJZCkge1xuICAgICAgICBjb25zdCBuZXdUb2dnbGVzID0ge307XG4gICAgICAgIGZvciAoY29uc3QgcG9saWN5IG9mIHRoaXMuc3RhdGUucG9saWNpZXMpIHtcbiAgICAgICAgICAgIGxldCBjaGVja2VkID0gdGhpcy5zdGF0ZS50b2dnbGVkUG9saWNpZXNbcG9saWN5LmlkXTtcbiAgICAgICAgICAgIGlmIChwb2xpY3kuaWQgPT09IHBvbGljeUlkKSBjaGVja2VkID0gIWNoZWNrZWQ7XG5cbiAgICAgICAgICAgIG5ld1RvZ2dsZXNbcG9saWN5LmlkXSA9IGNoZWNrZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XCJ0b2dnbGVkUG9saWNpZXNcIjogbmV3VG9nZ2xlc30pO1xuICAgIH0sXG5cbiAgICBfdHJ5U3VibWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IGFsbENoZWNrZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IHBvbGljeSBvZiB0aGlzLnN0YXRlLnBvbGljaWVzKSB7XG4gICAgICAgICAgICBjb25zdCBjaGVja2VkID0gdGhpcy5zdGF0ZS50b2dnbGVkUG9saWNpZXNbcG9saWN5LmlkXTtcbiAgICAgICAgICAgIGFsbENoZWNrZWQgPSBhbGxDaGVja2VkICYmIGNoZWNrZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxsQ2hlY2tlZCkgdGhpcy5wcm9wcy5zdWJtaXRBdXRoRGljdCh7dHlwZTogVGVybXNBdXRoRW50cnkuTE9HSU5fVFlQRX0pO1xuICAgICAgICBlbHNlIHRoaXMuc2V0U3RhdGUoe2Vycm9yVGV4dDogX3QoXCJQbGVhc2UgcmV2aWV3IGFuZCBhY2NlcHQgYWxsIG9mIHRoZSBob21lc2VydmVyJ3MgcG9saWNpZXNcIil9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuYnVzeSkge1xuICAgICAgICAgICAgY29uc3QgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICByZXR1cm4gPExvYWRlciAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoZWNrYm94ZXMgPSBbXTtcbiAgICAgICAgbGV0IGFsbENoZWNrZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IHBvbGljeSBvZiB0aGlzLnN0YXRlLnBvbGljaWVzKSB7XG4gICAgICAgICAgICBjb25zdCBjaGVja2VkID0gdGhpcy5zdGF0ZS50b2dnbGVkUG9saWNpZXNbcG9saWN5LmlkXTtcbiAgICAgICAgICAgIGFsbENoZWNrZWQgPSBhbGxDaGVja2VkICYmIGNoZWNrZWQ7XG5cbiAgICAgICAgICAgIGNoZWNrYm94ZXMucHVzaChcbiAgICAgICAgICAgICAgICA8bGFiZWwga2V5PXtcInBvbGljeV9jaGVja2JveF9cIiArIHBvbGljeS5pZH0gY2xhc3NOYW1lPVwibXhfSW50ZXJhY3RpdmVBdXRoRW50cnlDb21wb25lbnRzX3Rlcm1zUG9saWN5XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbkNoYW5nZT17KCkgPT4gdGhpcy5fdG9nZ2xlUG9saWN5KHBvbGljeS5pZCl9IGNoZWNrZWQ9e2NoZWNrZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e3BvbGljeS51cmx9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj57IHBvbGljeS5uYW1lIH08L2E+XG4gICAgICAgICAgICAgICAgPC9sYWJlbD4sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVycm9yU2VjdGlvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZXJyb3JUZXh0IHx8IHRoaXMuc3RhdGUuZXJyb3JUZXh0KSB7XG4gICAgICAgICAgICBlcnJvclNlY3Rpb24gPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJlcnJvclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuZXJyb3JUZXh0IHx8IHRoaXMuc3RhdGUuZXJyb3JUZXh0IH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3VibWl0QnV0dG9uO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zaG93Q29udGludWUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBYWFg6IGJ1dHRvbiBjbGFzc2VzXG4gICAgICAgICAgICBzdWJtaXRCdXR0b24gPSA8YnV0dG9uIGNsYXNzTmFtZT1cIm14X0ludGVyYWN0aXZlQXV0aEVudHJ5Q29tcG9uZW50c190ZXJtc1N1Ym1pdCBteF9HZW5lcmFsQnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fdHJ5U3VibWl0fSBkaXNhYmxlZD17IWFsbENoZWNrZWR9PntfdChcIkFjY2VwdFwiKX08L2J1dHRvbj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57X3QoXCJQbGVhc2UgcmV2aWV3IGFuZCBhY2NlcHQgdGhlIHBvbGljaWVzIG9mIHRoaXMgaG9tZXNlcnZlcjpcIil9PC9wPlxuICAgICAgICAgICAgICAgIHsgY2hlY2tib3hlcyB9XG4gICAgICAgICAgICAgICAgeyBlcnJvclNlY3Rpb24gfVxuICAgICAgICAgICAgICAgIHsgc3VibWl0QnV0dG9uIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuZXhwb3J0IGNvbnN0IEVtYWlsSWRlbnRpdHlBdXRoRW50cnkgPSBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0VtYWlsSWRlbnRpdHlBdXRoRW50cnknLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICBMT0dJTl9UWVBFOiBcIm0ubG9naW4uZW1haWwuaWRlbnRpdHlcIixcbiAgICB9LFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG1hdHJpeENsaWVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBzdWJtaXRBdXRoRGljdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgYXV0aFNlc3Npb25JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBjbGllbnRTZWNyZXQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgaW5wdXRzOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIHN0YWdlU3RhdGU6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgZmFpbDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgc2V0RW1haWxTaWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uUGhhc2VDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblBoYXNlQ2hhbmdlKERFRkFVTFRfUEhBU0UpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBUaGlzIGNvbXBvbmVudCBpcyBub3cgb25seSBkaXNwbGF5ZWQgb25jZSB0aGUgdG9rZW4gaGFzIGJlZW4gcmVxdWVzdGVkLFxuICAgICAgICAvLyBzbyB3ZSBrbm93IHRoZSBlbWFpbCBoYXMgYmVlbiBzZW50LiBJdCBjYW4gYWxzbyBnZXQgbG9hZGVkIGFmdGVyIHRoZSB1c2VyXG4gICAgICAgIC8vIGhhcyBjbGlja2VkIHRoZSB2YWxpZGF0aW9uIGxpbmsgaWYgdGhlIHNlcnZlciB0YWtlcyBhIHdoaWxlIHRvIHByb3BhZ2F0ZVxuICAgICAgICAvLyB0aGUgdmFsaWRhdGlvbiBpbnRlcm5hbGx5LiBJZiB3ZSdyZSBpbiB0aGUgc2Vzc2lvbiBzcGF3bmVkIGZyb20gY2xpY2tpbmdcbiAgICAgICAgLy8gdGhlIHZhbGlkYXRpb24gbGluaywgd2Ugd29uJ3Qga25vdyB0aGUgZW1haWwgYWRkcmVzcywgc28gaWYgd2UgZG9uJ3QgaGF2ZSBpdCxcbiAgICAgICAgLy8gYXNzdW1lIHRoYXQgdGhlIGxpbmsgaGFzIGJlZW4gY2xpY2tlZCBhbmQgdGhlIHNlcnZlciB3aWxsIHJlYWxpc2Ugd2hlbiB3ZSBwb2xsLlxuICAgICAgICBpZiAodGhpcy5wcm9wcy5pbnB1dHMuZW1haWxBZGRyZXNzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxMb2FkZXIgLz47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPnsgX3QoXCJBbiBlbWFpbCBoYXMgYmVlbiBzZW50IHRvICUoZW1haWxBZGRyZXNzKXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZW1haWxBZGRyZXNzOiAoc3ViKSA9PiA8aT57IHRoaXMucHJvcHMuaW5wdXRzLmVtYWlsQWRkcmVzcyB9PC9pPiB9LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57IF90KFwiUGxlYXNlIGNoZWNrIHlvdXIgZW1haWwgdG8gY29udGludWUgcmVnaXN0cmF0aW9uLlwiKSB9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcblxuZXhwb3J0IGNvbnN0IE1zaXNkbkF1dGhFbnRyeSA9IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnTXNpc2RuQXV0aEVudHJ5JyxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgTE9HSU5fVFlQRTogXCJtLmxvZ2luLm1zaXNkblwiLFxuICAgIH0sXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgaW5wdXRzOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICAgICAgcGhvbmVDb3VudHJ5OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgcGhvbmVOdW1iZXI6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIH0pLFxuICAgICAgICBmYWlsOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgY2xpZW50U2VjcmV0OiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgc3VibWl0QXV0aERpY3Q6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG1hdHJpeENsaWVudDogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgb25QaGFzZUNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRva2VuOiAnJyxcbiAgICAgICAgICAgIHJlcXVlc3RpbmdUb2tlbjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblBoYXNlQ2hhbmdlKERFRkFVTFRfUEhBU0UpO1xuXG4gICAgICAgIHRoaXMuX3N1Ym1pdFVybCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NpZCA9IG51bGw7XG4gICAgICAgIHRoaXMuX21zaXNkbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Rva2VuQm94ID0gbnVsbDtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtyZXF1ZXN0aW5nVG9rZW46IHRydWV9KTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdE1zaXNkblRva2VuKCkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMuZmFpbChlKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtyZXF1ZXN0aW5nVG9rZW46IGZhbHNlfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFJlcXVlc3RzIGEgdmVyaWZpY2F0aW9uIHRva2VuIGJ5IFNNUy5cbiAgICAgKi9cbiAgICBfcmVxdWVzdE1zaXNkblRva2VuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMubWF0cml4Q2xpZW50LnJlcXVlc3RSZWdpc3Rlck1zaXNkblRva2VuKFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5pbnB1dHMucGhvbmVDb3VudHJ5LFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5pbnB1dHMucGhvbmVOdW1iZXIsXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNsaWVudFNlY3JldCxcbiAgICAgICAgICAgIDEsIC8vIFRPRE86IE11bHRpcGxlIHNlbmQgYXR0ZW1wdHM/XG4gICAgICAgICkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zdWJtaXRVcmwgPSByZXN1bHQuc3VibWl0X3VybDtcbiAgICAgICAgICAgIHRoaXMuX3NpZCA9IHJlc3VsdC5zaWQ7XG4gICAgICAgICAgICB0aGlzLl9tc2lzZG4gPSByZXN1bHQubXNpc2RuO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uVG9rZW5DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB0b2tlbjogZS50YXJnZXQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25Gb3JtU3VibWl0OiBhc3luYyBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudG9rZW4gPT0gJycpIHJldHVybjtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVpcmVzSWRTZXJ2ZXJQYXJhbSA9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQuZG9lc1NlcnZlclJlcXVpcmVJZFNlcnZlclBhcmFtKCk7XG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgaWYgKHRoaXMuX3N1Ym1pdFVybCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMucHJvcHMubWF0cml4Q2xpZW50LnN1Ym1pdE1zaXNkblRva2VuT3RoZXJVcmwoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N1Ym1pdFVybCwgdGhpcy5fc2lkLCB0aGlzLnByb3BzLmNsaWVudFNlY3JldCwgdGhpcy5zdGF0ZS50b2tlbixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXF1aXJlc0lkU2VydmVyUGFyYW0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLnByb3BzLm1hdHJpeENsaWVudC5zdWJtaXRNc2lzZG5Ub2tlbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2lkLCB0aGlzLnByb3BzLmNsaWVudFNlY3JldCwgdGhpcy5zdGF0ZS50b2tlbixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgcmVnaXN0cmF0aW9uIHdpdGggTVNJU0ROIGZsb3cgaXMgbWlzY29uZmlndXJlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNyZWRzID0ge1xuICAgICAgICAgICAgICAgICAgICBzaWQ6IHRoaXMuX3NpZCxcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogdGhpcy5wcm9wcy5jbGllbnRTZWNyZXQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWlyZXNJZFNlcnZlclBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkU2VydmVyUGFyc2VkVXJsID0gdXJsLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgY3JlZHMuaWRfc2VydmVyID0gaWRTZXJ2ZXJQYXJzZWRVcmwuaG9zdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5zdWJtaXRBdXRoRGljdCh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE1zaXNkbkF1dGhFbnRyeS5MT0dJTl9UWVBFLFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgYHRocmVlcGlkX2NyZWRzYCBvbmNlIHNlcnZlcnMgc3VwcG9ydCBwcm9wZXIgVUlBXG4gICAgICAgICAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMDMxMlxuICAgICAgICAgICAgICAgICAgICB0aHJlZXBpZF9jcmVkczogY3JlZHMsXG4gICAgICAgICAgICAgICAgICAgIHRocmVlcGlkQ3JlZHM6IGNyZWRzLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBfdChcIlRva2VuIGluY29ycmVjdFwiKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5mYWlsKGUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGYWlsZWQgdG8gc3VibWl0IG1zaXNkbiB0b2tlblwiKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5yZXF1ZXN0aW5nVG9rZW4pIHtcbiAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxMb2FkZXIgLz47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBlbmFibGVTdWJtaXQgPSBCb29sZWFuKHRoaXMuc3RhdGUudG9rZW4pO1xuICAgICAgICAgICAgY29uc3Qgc3VibWl0Q2xhc3NlcyA9IGNsYXNzbmFtZXMoe1xuICAgICAgICAgICAgICAgIG14X0ludGVyYWN0aXZlQXV0aEVudHJ5Q29tcG9uZW50c19tc2lzZG5TdWJtaXQ6IHRydWUsXG4gICAgICAgICAgICAgICAgbXhfR2VuZXJhbEJ1dHRvbjogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IGVycm9yU2VjdGlvbjtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmVycm9yVGV4dCkge1xuICAgICAgICAgICAgICAgIGVycm9yU2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJlcnJvclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLmVycm9yVGV4dCB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxwPnsgX3QoXCJBIHRleHQgbWVzc2FnZSBoYXMgYmVlbiBzZW50IHRvICUobXNpc2RuKXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbXNpc2RuOiA8aT57IHRoaXMuX21zaXNkbiB9PC9pPiB9LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57IF90KFwiUGxlYXNlIGVudGVyIHRoZSBjb2RlIGl0IGNvbnRhaW5zOlwiKSB9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0ludGVyYWN0aXZlQXV0aEVudHJ5Q29tcG9uZW50c19tc2lzZG5XcmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5fb25Gb3JtU3VibWl0fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNfbXNpc2RuRW50cnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS50b2tlbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uVG9rZW5DaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9eyBfdChcIkNvZGVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPXtfdChcIlN1Ym1pdFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtzdWJtaXRDbGFzc2VzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWVuYWJsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICAgICAgICAgICAge2Vycm9yU2VjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuXG5leHBvcnQgY2xhc3MgU1NPQXV0aEVudHJ5IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBtYXRyaXhDbGllbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgYXV0aFNlc3Npb25JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBsb2dpblR5cGU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgc3VibWl0QXV0aERpY3Q6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIGVycm9yVGV4dDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgb25QaGFzZUNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgY29udGludWVUZXh0OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBjb250aW51ZUtpbmQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIG9uQ2FuY2VsOiBQcm9wVHlwZXMuZnVuYyxcbiAgICB9O1xuXG4gICAgc3RhdGljIExPR0lOX1RZUEUgPSBcIm0ubG9naW4uc3NvXCI7XG4gICAgc3RhdGljIFVOU1RBQkxFX0xPR0lOX1RZUEUgPSBcIm9yZy5tYXRyaXgubG9naW4uc3NvXCI7XG5cbiAgICBzdGF0aWMgUEhBU0VfUFJFQVVUSCA9IDE7IC8vIGJ1dHRvbiB0byBzdGFydCBTU09cbiAgICBzdGF0aWMgUEhBU0VfUE9TVEFVVEggPSAyOyAvLyBidXR0b24gdG8gY29uZmlybSBTU08gY29tcGxldGVkXG5cbiAgICBfc3NvVXJsOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgLy8gV2UgYWN0dWFsbHkgc2VuZCB0aGUgdXNlciB0aHJvdWdoIGZhbGxiYWNrIGF1dGggc28gd2UgZG9uJ3QgaGF2ZSB0b1xuICAgICAgICAvLyBkZWFsIHdpdGggYSByZWRpcmVjdCBiYWNrIHRvIHVzLCBsb3NpbmcgYXBwbGljYXRpb24gY29udGV4dC5cbiAgICAgICAgdGhpcy5fc3NvVXJsID0gcHJvcHMubWF0cml4Q2xpZW50LmdldEZhbGxiYWNrQXV0aFVybChcbiAgICAgICAgICAgIHRoaXMucHJvcHMubG9naW5UeXBlLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5hdXRoU2Vzc2lvbklkLFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBwaGFzZTogU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEgsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJvcHMub25QaGFzZUNoYW5nZShTU09BdXRoRW50cnkuUEhBU0VfUFJFQVVUSCk7XG4gICAgfVxuXG4gICAgb25TdGFydEF1dGhDbGljayA9ICgpID0+IHtcbiAgICAgICAgLy8gTm90ZTogV2UgZG9uJ3QgdXNlIFBsYXRmb3JtUGVnJ3Mgc3RhcnRTc29BdXRoIGZ1bmN0aW9ucyBiZWNhdXNlIHdlIGFsbW9zdFxuICAgICAgICAvLyBjZXJ0YWlubHkgd2lsbCBuZWVkIHRvIG9wZW4gdGhlIHRoaW5nIGluIGEgbmV3IHRhYiB0byBhdm9pZCBsb3NpbmcgYXBwbGljYXRpb25cbiAgICAgICAgLy8gY29udGV4dC5cblxuICAgICAgICB3aW5kb3cub3Blbih0aGlzLl9zc29VcmwsICdfYmxhbmsnKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IFNTT0F1dGhFbnRyeS5QSEFTRV9QT1NUQVVUSH0pO1xuICAgICAgICB0aGlzLnByb3BzLm9uUGhhc2VDaGFuZ2UoU1NPQXV0aEVudHJ5LlBIQVNFX1BPU1RBVVRIKTtcbiAgICB9O1xuXG4gICAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMuc3VibWl0QXV0aERpY3Qoe30pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBjb250aW51ZUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIGNvbnN0IGNhbmNlbEJ1dHRvbiA9IChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5vbkNhbmNlbH1cbiAgICAgICAgICAgICAgICBraW5kPXt0aGlzLnByb3BzLmNvbnRpbnVlS2luZCA/ICh0aGlzLnByb3BzLmNvbnRpbnVlS2luZCArICdfb3V0bGluZScpIDogJ3ByaW1hcnlfb3V0bGluZSd9XG4gICAgICAgICAgICA+e190KFwiQ2FuY2VsXCIpfTwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGhhc2UgPT09IFNTT0F1dGhFbnRyeS5QSEFTRV9QUkVBVVRIKSB7XG4gICAgICAgICAgICBjb250aW51ZUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU3RhcnRBdXRoQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIGtpbmQ9e3RoaXMucHJvcHMuY29udGludWVLaW5kIHx8ICdwcmltYXJ5J31cbiAgICAgICAgICAgICAgICA+e3RoaXMucHJvcHMuY29udGludWVUZXh0IHx8IF90KFwiU2luZ2xlIFNpZ24gT25cIil9PC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRpbnVlQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25Db25maXJtQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIGtpbmQ9e3RoaXMucHJvcHMuY29udGludWVLaW5kIHx8ICdwcmltYXJ5J31cbiAgICAgICAgICAgICAgICA+e3RoaXMucHJvcHMuY29udGludWVUZXh0IHx8IF90KFwiQ29uZmlybVwiKX08L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdteF9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNfc3NvX2J1dHRvbnMnPlxuICAgICAgICAgICAge2NhbmNlbEJ1dHRvbn1cbiAgICAgICAgICAgIHtjb250aW51ZUJ1dHRvbn1cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IEZhbGxiYWNrQXV0aEVudHJ5ID0gY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdGYWxsYmFja0F1dGhFbnRyeScsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgbWF0cml4Q2xpZW50OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIGF1dGhTZXNzaW9uSWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgbG9naW5UeXBlOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHN1Ym1pdEF1dGhEaWN0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBlcnJvclRleHQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIG9uUGhhc2VDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblBoYXNlQ2hhbmdlKERFRkFVTFRfUEhBU0UpO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gd2UgaGF2ZSB0byBtYWtlIHRoZSB1c2VyIGNsaWNrIGEgYnV0dG9uLCBhcyBicm93c2VycyB3aWxsIGJsb2NrXG4gICAgICAgIC8vIHRoZSBwb3B1cCBpZiB3ZSBvcGVuIGl0IGltbWVkaWF0ZWx5LlxuICAgICAgICB0aGlzLl9wb3B1cFdpbmRvdyA9IG51bGw7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLl9vblJlY2VpdmVNZXNzYWdlKTtcblxuICAgICAgICB0aGlzLl9mYWxsYmFja0J1dHRvbiA9IGNyZWF0ZVJlZigpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLl9vblJlY2VpdmVNZXNzYWdlKTtcbiAgICAgICAgaWYgKHRoaXMuX3BvcHVwV2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLl9wb3B1cFdpbmRvdy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ZhbGxiYWNrQnV0dG9uLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZhbGxiYWNrQnV0dG9uLmN1cnJlbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25TaG93RmFsbGJhY2tDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgdXJsID0gdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQuZ2V0RmFsbGJhY2tBdXRoVXJsKFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5sb2dpblR5cGUsXG4gICAgICAgICAgICB0aGlzLnByb3BzLmF1dGhTZXNzaW9uSWQsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3BvcHVwV2luZG93ID0gd2luZG93Lm9wZW4odXJsKTtcbiAgICAgICAgdGhpcy5fcG9wdXBXaW5kb3cub3BlbmVyID0gbnVsbDtcbiAgICB9LFxuXG4gICAgX29uUmVjZWl2ZU1lc3NhZ2U6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGV2ZW50LmRhdGEgPT09IFwiYXV0aERvbmVcIiAmJlxuICAgICAgICAgICAgZXZlbnQub3JpZ2luID09PSB0aGlzLnByb3BzLm1hdHJpeENsaWVudC5nZXRIb21lc2VydmVyVXJsKClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLnN1Ym1pdEF1dGhEaWN0KHt9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgZXJyb3JTZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5lcnJvclRleHQpIHtcbiAgICAgICAgICAgIGVycm9yU2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCIgcm9sZT1cImFsZXJ0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5lcnJvclRleHQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8YSBocmVmPVwiXCIgcmVmPXt0aGlzLl9mYWxsYmFja0J1dHRvbn0gb25DbGljaz17dGhpcy5fb25TaG93RmFsbGJhY2tDbGlja30+eyBfdChcIlN0YXJ0IGF1dGhlbnRpY2F0aW9uXCIpIH08L2E+XG4gICAgICAgICAgICAgICAge2Vycm9yU2VjdGlvbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuY29uc3QgQXV0aEVudHJ5Q29tcG9uZW50cyA9IFtcbiAgICBQYXNzd29yZEF1dGhFbnRyeSxcbiAgICBSZWNhcHRjaGFBdXRoRW50cnksXG4gICAgRW1haWxJZGVudGl0eUF1dGhFbnRyeSxcbiAgICBNc2lzZG5BdXRoRW50cnksXG4gICAgVGVybXNBdXRoRW50cnksXG4gICAgU1NPQXV0aEVudHJ5LFxuXTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0RW50cnlDb21wb25lbnRGb3JMb2dpblR5cGUobG9naW5UeXBlKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIEF1dGhFbnRyeUNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKGMuTE9HSU5fVFlQRSA9PT0gbG9naW5UeXBlIHx8IGMuVU5TVEFCTEVfTE9HSU5fVFlQRSA9PT0gbG9naW5UeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRmFsbGJhY2tBdXRoRW50cnk7XG59XG4iXX0=