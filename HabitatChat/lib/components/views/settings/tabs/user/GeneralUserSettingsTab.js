"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var languageHandler = _interopRequireWildcard(require("../../../../../languageHandler"));

var _ProfileSettings = _interopRequireDefault(require("../../ProfileSettings"));

var _Field = _interopRequireDefault(require("../../../elements/Field"));

var _SettingsStore = _interopRequireWildcard(require("../../../../../settings/SettingsStore"));

var _LanguageDropdown = _interopRequireDefault(require("../../../elements/LanguageDropdown"));

var _AccessibleButton = _interopRequireDefault(require("../../../elements/AccessibleButton"));

var _DeactivateAccountDialog = _interopRequireDefault(require("../../../dialogs/DeactivateAccountDialog"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _theme = require("../../../../../theme");

var _PlatformPeg = _interopRequireDefault(require("../../../../../PlatformPeg"));

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../../.."));

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

var _dispatcher = _interopRequireDefault(require("../../../../../dispatcher/dispatcher"));

var _Terms = require("../../../../../Terms");

var _matrixJsSdk = require("matrix-js-sdk");

var _IdentityAuthClient = _interopRequireDefault(require("../../../../../IdentityAuthClient"));

var _UrlUtils = require("../../../../../utils/UrlUtils");

var _boundThreepids = require("../../../../../boundThreepids");

var _Spinner = _interopRequireDefault(require("../../../elements/Spinner"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class GeneralUserSettingsTab extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onAction", payload => {
      if (payload.action === 'id_server_changed') {
        this.setState({
          haveIdServer: Boolean(_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl())
        });

        this._getThreepidState();
      }
    });
    (0, _defineProperty2.default)(this, "_onEmailsChange", emails => {
      this.setState({
        emails
      });
    });
    (0, _defineProperty2.default)(this, "_onMsisdnsChange", msisdns => {
      this.setState({
        msisdns
      });
    });
    (0, _defineProperty2.default)(this, "_onLanguageChange", newLanguage => {
      if (this.state.language === newLanguage) return;

      _SettingsStore.default.setValue("language", null, _SettingsStore.SettingLevel.DEVICE, newLanguage);

      this.setState({
        language: newLanguage
      });

      _PlatformPeg.default.get().reload();
    });
    (0, _defineProperty2.default)(this, "_onThemeChange", e => {
      const newTheme = e.target.value;
      if (this.state.theme === newTheme) return; // doing getValue in the .catch will still return the value we failed to set,
      // so remember what the value was before we tried to set it so we can revert

      const oldTheme = _SettingsStore.default.getValue('theme');

      _SettingsStore.default.setValue("theme", null, _SettingsStore.SettingLevel.ACCOUNT, newTheme).catch(() => {
        _dispatcher.default.dispatch({
          action: 'recheck_theme'
        });

        this.setState({
          theme: oldTheme
        });
      });

      this.setState({
        theme: newTheme
      }); // The settings watcher doesn't fire until the echo comes back from the
      // server, so to make the theme change immediately we need to manually
      // do the dispatch now
      // XXX: The local echoed value appears to be unreliable, in particular
      // when settings custom themes(!) so adding forceTheme to override
      // the value from settings.

      _dispatcher.default.dispatch({
        action: 'recheck_theme',
        forceTheme: newTheme
      });
    });
    (0, _defineProperty2.default)(this, "_onUseSystemThemeChanged", checked => {
      this.setState({
        useSystemTheme: checked
      });

      _SettingsStore.default.setValue("use_system_theme", null, _SettingsStore.SettingLevel.DEVICE, checked);

      _dispatcher.default.dispatch({
        action: 'recheck_theme'
      });
    });
    (0, _defineProperty2.default)(this, "_onPasswordChangeError", err => {
      // TODO: Figure out a design that doesn't involve replacing the current dialog
      let errMsg = err.error || "";

      if (err.httpStatus === 403) {
        errMsg = (0, languageHandler._t)("Failed to change password. Is your password correct?");
      } else if (err.httpStatus) {
        errMsg += " (HTTP status ".concat(err.httpStatus, ")");
      }

      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Failed to change password: " + errMsg);

      _Modal.default.createTrackedDialog('Failed to change password', '', ErrorDialog, {
        title: (0, languageHandler._t)("Error"),
        description: errMsg
      });
    });
    (0, _defineProperty2.default)(this, "_onPasswordChanged", () => {
      // TODO: Figure out a design that doesn't involve replacing the current dialog
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Password changed', '', ErrorDialog, {
        title: (0, languageHandler._t)("Success"),
        description: (0, languageHandler._t)("Your password was successfully changed. You will not receive " + "push notifications on other sessions until you log back in to them") + "."
      });
    });
    (0, _defineProperty2.default)(this, "_onDeactivateClicked", () => {
      _Modal.default.createTrackedDialog('Deactivate Account', '', _DeactivateAccountDialog.default, {
        onFinished: success => {
          if (success) this.props.closeSettingsFn();
        }
      });
    });
    (0, _defineProperty2.default)(this, "_onAddCustomTheme", async () => {
      let currentThemes = _SettingsStore.default.getValue("custom_themes");

      if (!currentThemes) currentThemes = [];
      currentThemes = currentThemes.map(c => c); // cheap clone

      if (this._themeTimer) {
        clearTimeout(this._themeTimer);
      }

      try {
        const r = await fetch(this.state.customThemeUrl);
        const themeInfo = await r.json();

        if (!themeInfo || typeof themeInfo['name'] !== 'string' || typeof themeInfo['colors'] !== 'object') {
          this.setState({
            customThemeMessage: {
              text: (0, languageHandler._t)("Invalid theme schema."),
              isError: true
            }
          });
          return;
        }

        currentThemes.push(themeInfo);
      } catch (e) {
        console.error(e);
        this.setState({
          customThemeMessage: {
            text: (0, languageHandler._t)("Error downloading theme information."),
            isError: true
          }
        });
        return; // Don't continue on error
      }

      await _SettingsStore.default.setValue("custom_themes", null, _SettingsStore.SettingLevel.ACCOUNT, currentThemes);
      this.setState({
        customThemeUrl: "",
        customThemeMessage: {
          text: (0, languageHandler._t)("Theme added!"),
          isError: false
        }
      });
      this._themeTimer = setTimeout(() => {
        this.setState({
          customThemeMessage: {
            text: "",
            isError: false
          }
        });
      }, 3000);
    });
    (0, _defineProperty2.default)(this, "_onCustomThemeChange", e => {
      this.setState({
        customThemeUrl: e.target.value
      });
    });
    this.state = _objectSpread({
      language: languageHandler.getCurrentLanguage(),
      haveIdServer: Boolean(_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()),
      serverSupportsSeparateAddAndBind: null,
      idServerHasUnsignedTerms: false,
      requiredPolicyInfo: {
        // This object is passed along to a component for handling
        hasTerms: false // policiesAndServices, // From the startTermsFlow callback
        // agreedUrls,          // From the startTermsFlow callback
        // resolve,             // Promise resolve function for startTermsFlow callback

      },
      emails: [],
      msisdns: [],
      loading3pids: true
    }, this._calculateThemeState(), {
      customThemeUrl: "",
      customThemeMessage: {
        isError: false,
        text: ""
      }
    });
    this.dispatcherRef = _dispatcher.default.register(this._onAction);
  } // TODO: [REACT-WARNING] Move this to constructor


  async UNSAFE_componentWillMount() {
    // eslint-disable-line camelcase
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const serverSupportsSeparateAddAndBind = await cli.doesServerSupportSeparateAddAndBind();
    const capabilities = await cli.getCapabilities(); // this is cached

    const changePasswordCap = capabilities['m.change_password']; // You can change your password so long as the capability isn't explicitly disabled. The implicit
    // behaviour is you can change your password when the capability is missing or has not-false as
    // the enabled flag value.

    const canChangePassword = !changePasswordCap || changePasswordCap['enabled'] !== false;
    this.setState({
      serverSupportsSeparateAddAndBind,
      canChangePassword
    });

    this._getThreepidState();
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);
  }

  _calculateThemeState() {
    // We have to mirror the logic from ThemeWatcher.getEffectiveTheme so we
    // show the right values for things.
    const themeChoice = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.ACCOUNT, "theme");

    const systemThemeExplicit = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, "use_system_theme", null, false, true);

    const themeExplicit = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, "theme", null, false, true); // If the user has enabled system theme matching, use that.


    if (systemThemeExplicit) {
      return {
        theme: themeChoice,
        useSystemTheme: true
      };
    } // If the user has set a theme explicitly, use that (no system theme matching)


    if (themeExplicit) {
      return {
        theme: themeChoice,
        useSystemTheme: false
      };
    } // Otherwise assume the defaults for the settings


    return {
      theme: themeChoice,
      useSystemTheme: _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, "use_system_theme")
    };
  }

  async _getThreepidState() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get(); // Check to see if terms need accepting


    this._checkTerms(); // Need to get 3PIDs generally for Account section and possibly also for
    // Discovery (assuming we have an IS and terms are agreed).


    let threepids = [];

    try {
      threepids = await (0, _boundThreepids.getThreepidsWithBindStatus)(cli);
    } catch (e) {
      const idServerUrl = _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl();

      console.warn("Unable to reach identity server at ".concat(idServerUrl, " to check ") + "for 3PIDs bindings in Settings");
      console.warn(e);
    }

    this.setState({
      emails: threepids.filter(a => a.medium === 'email'),
      msisdns: threepids.filter(a => a.medium === 'msisdn'),
      loading3pids: false
    });
  }

  async _checkTerms() {
    if (!this.state.haveIdServer) {
      this.setState({
        idServerHasUnsignedTerms: false
      });
      return;
    } // By starting the terms flow we get the logic for checking which terms the user has signed
    // for free. So we might as well use that for our own purposes.


    const idServerUrl = _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl();

    const authClient = new _IdentityAuthClient.default();

    try {
      const idAccessToken = await authClient.getAccessToken({
        check: false
      });
      await (0, _Terms.startTermsFlow)([new _Terms.Service(_matrixJsSdk.SERVICE_TYPES.IS, idServerUrl, idAccessToken)], (policiesAndServices, agreedUrls, extraClassNames) => {
        return new Promise((resolve, reject) => {
          this.setState({
            idServerName: (0, _UrlUtils.abbreviateUrl)(idServerUrl),
            requiredPolicyInfo: {
              hasTerms: true,
              policiesAndServices,
              agreedUrls,
              resolve
            }
          });
        });
      }); // User accepted all terms

      this.setState({
        requiredPolicyInfo: {
          hasTerms: false
        }
      });
    } catch (e) {
      console.warn("Unable to reach identity server at ".concat(idServerUrl, " to check ") + "for terms in Settings");
      console.warn(e);
    }
  }

  _renderProfileSection() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Profile")), /*#__PURE__*/_react.default.createElement(_ProfileSettings.default, null));
  }

  _renderAccountSection() {
    const ChangePassword = sdk.getComponent("views.settings.ChangePassword");
    const EmailAddresses = sdk.getComponent("views.settings.account.EmailAddresses");
    const PhoneNumbers = sdk.getComponent("views.settings.account.PhoneNumbers");

    let passwordChangeForm = /*#__PURE__*/_react.default.createElement(ChangePassword, {
      className: "mx_GeneralUserSettingsTab_changePassword",
      rowClassName: "",
      buttonKind: "primary",
      onError: this._onPasswordChangeError,
      onFinished: this._onPasswordChanged
    });

    let threepidSection = null; // For older homeservers without separate 3PID add and bind methods (MSC2290),
    // we use a combo add with bind option API which requires an identity server to
    // validate 3PID ownership even if we're just adding to the homeserver only.
    // For newer homeservers with separate 3PID add and bind methods (MSC2290),
    // there is no such concern, so we can always show the HS account 3PIDs.

    if (this.state.haveIdServer || this.state.serverSupportsSeparateAddAndBind === true) {
      const emails = this.state.loading3pids ? /*#__PURE__*/_react.default.createElement(_Spinner.default, null) : /*#__PURE__*/_react.default.createElement(EmailAddresses, {
        emails: this.state.emails,
        onEmailsChange: this._onEmailsChange
      });
      const msisdns = this.state.loading3pids ? /*#__PURE__*/_react.default.createElement(_Spinner.default, null) : /*#__PURE__*/_react.default.createElement(PhoneNumbers, {
        msisdns: this.state.msisdns,
        onMsisdnsChange: this._onMsisdnsChange
      });
      threepidSection = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subheading"
      }, (0, languageHandler._t)("Email addresses")), emails, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subheading"
      }, (0, languageHandler._t)("Phone numbers")), msisdns);
    } else if (this.state.serverSupportsSeparateAddAndBind === null) {
      threepidSection = /*#__PURE__*/_react.default.createElement(_Spinner.default, null);
    }

    let passwordChangeText = (0, languageHandler._t)("Set a new account password...");

    if (!this.state.canChangePassword) {
      // Just don't show anything if you can't do anything.
      passwordChangeText = null;
      passwordChangeForm = null;
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_GeneralUserSettingsTab_accountSection"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Account")), /*#__PURE__*/_react.default.createElement("p", {
      className: "mx_SettingsTab_subsectionText"
    }, passwordChangeText), passwordChangeForm, threepidSection);
  }

  _renderLanguageSection() {
    // TODO: Convert to new-styled Field
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Language and region")), /*#__PURE__*/_react.default.createElement(_LanguageDropdown.default, {
      className: "mx_GeneralUserSettingsTab_languageInput",
      onOptionChange: this._onLanguageChange,
      value: this.state.language
    }));
  }

  _renderThemeSection() {
    const SettingsFlag = sdk.getComponent("views.elements.SettingsFlag");
    const LabelledToggleSwitch = sdk.getComponent("views.elements.LabelledToggleSwitch");
    const themeWatcher = new _theme.ThemeWatcher();
    let systemThemeSection;

    if (themeWatcher.isSystemThemeSupported()) {
      systemThemeSection = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(LabelledToggleSwitch, {
        value: this.state.useSystemTheme,
        label: _SettingsStore.default.getDisplayName("use_system_theme"),
        onChange: this._onUseSystemThemeChanged
      }));
    }

    let customThemeForm;

    if (_SettingsStore.default.isFeatureEnabled("feature_custom_themes")) {
      let messageElement = null;

      if (this.state.customThemeMessage.text) {
        if (this.state.customThemeMessage.isError) {
          messageElement = /*#__PURE__*/_react.default.createElement("div", {
            className: "text-error"
          }, this.state.customThemeMessage.text);
        } else {
          messageElement = /*#__PURE__*/_react.default.createElement("div", {
            className: "text-success"
          }, this.state.customThemeMessage.text);
        }
      }

      customThemeForm = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_section"
      }, /*#__PURE__*/_react.default.createElement("form", {
        onSubmit: this._onAddCustomTheme
      }, /*#__PURE__*/_react.default.createElement(_Field.default, {
        label: (0, languageHandler._t)("Custom theme URL"),
        type: "text",
        autoComplete: "off",
        onChange: this._onCustomThemeChange,
        value: this.state.customThemeUrl
      }), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onAddCustomTheme,
        type: "submit",
        kind: "primary_sm",
        disabled: !this.state.customThemeUrl.trim()
      }, (0, languageHandler._t)("Add theme")), messageElement));
    }

    const themes = Object.entries((0, _theme.enumerateThemes)()).map(p => ({
      id: p[0],
      name: p[1]
    })); // convert pairs to objects for code readability

    const builtInThemes = themes.filter(p => !p.id.startsWith("custom-"));
    const customThemes = themes.filter(p => !builtInThemes.includes(p)).sort((a, b) => a.name.localeCompare(b.name));
    const orderedThemes = [...builtInThemes, ...customThemes];
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_GeneralUserSettingsTab_themeSection"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Theme")), systemThemeSection, /*#__PURE__*/_react.default.createElement(_Field.default, {
      label: (0, languageHandler._t)("Theme"),
      element: "select",
      value: this.state.theme,
      onChange: this._onThemeChange,
      disabled: this.state.useSystemTheme
    }, orderedThemes.map(theme => {
      return /*#__PURE__*/_react.default.createElement("option", {
        key: theme.id,
        value: theme.id
      }, theme.name);
    })), customThemeForm, /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "useCompactLayout",
      level: _SettingsStore.SettingLevel.ACCOUNT
    }));
  }

  _renderDiscoverySection() {
    const SetIdServer = sdk.getComponent("views.settings.SetIdServer");

    if (this.state.requiredPolicyInfo.hasTerms) {
      const InlineTermsAgreement = sdk.getComponent("views.terms.InlineTermsAgreement");

      const intro = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, languageHandler._t)("Agree to the identity server (%(serverName)s) Terms of Service to " + "allow yourself to be discoverable by email address or phone number.", {
        serverName: this.state.idServerName
      }));

      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(InlineTermsAgreement, {
        policiesAndServicePairs: this.state.requiredPolicyInfo.policiesAndServices,
        agreedUrls: this.state.requiredPolicyInfo.agreedUrls,
        onFinished: this.state.requiredPolicyInfo.resolve,
        introElement: intro
      }), /*#__PURE__*/_react.default.createElement(SetIdServer, {
        missingTerms: true
      }));
    }

    const EmailAddresses = sdk.getComponent("views.settings.discovery.EmailAddresses");
    const PhoneNumbers = sdk.getComponent("views.settings.discovery.PhoneNumbers");
    const emails = this.state.loading3pids ? /*#__PURE__*/_react.default.createElement(_Spinner.default, null) : /*#__PURE__*/_react.default.createElement(EmailAddresses, {
      emails: this.state.emails
    });
    const msisdns = this.state.loading3pids ? /*#__PURE__*/_react.default.createElement(_Spinner.default, null) : /*#__PURE__*/_react.default.createElement(PhoneNumbers, {
      msisdns: this.state.msisdns
    });
    const threepidSection = this.state.haveIdServer ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GeneralUserSettingsTab_discovery"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Email addresses")), emails, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Phone numbers")), msisdns) : null;
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, threepidSection, /*#__PURE__*/_react.default.createElement(SetIdServer, null));
  }

  _renderManagementSection() {
    // TODO: Improve warning text for account deactivation
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, languageHandler._t)("Account management")), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, languageHandler._t)("Deactivating your account is a permanent action - be careful!")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onDeactivateClicked,
      kind: "danger"
    }, (0, languageHandler._t)("Deactivate Account")));
  }

  _renderIntegrationManagerSection() {
    const SetIntegrationManager = sdk.getComponent("views.settings.SetIntegrationManager");
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement(SetIntegrationManager, null));
  }

  render() {
    const discoWarning = this.state.requiredPolicyInfo.hasTerms ? /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_GeneralUserSettingsTab_warningIcon",
      src: require("../../../../../../res/img/feather-customised/warning-triangle.svg"),
      width: "18",
      height: "18",
      alt: (0, languageHandler._t)("Warning")
    }) : null;
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, languageHandler._t)("General")), this._renderProfileSection(), this._renderAccountSection(), this._renderLanguageSection(), this._renderThemeSection(), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, discoWarning, " ", (0, languageHandler._t)("Discovery")), this._renderDiscoverySection(), this._renderIntegrationManagerSection()
    /* Has its own title */
    , /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, languageHandler._t)("Deactivate account")), this._renderManagementSection());
  }

}

exports.default = GeneralUserSettingsTab;
(0, _defineProperty2.default)(GeneralUserSettingsTab, "propTypes", {
  closeSettingsFn: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvdXNlci9HZW5lcmFsVXNlclNldHRpbmdzVGFiLmpzIl0sIm5hbWVzIjpbIkdlbmVyYWxVc2VyU2V0dGluZ3NUYWIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicGF5bG9hZCIsImFjdGlvbiIsInNldFN0YXRlIiwiaGF2ZUlkU2VydmVyIiwiQm9vbGVhbiIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldElkZW50aXR5U2VydmVyVXJsIiwiX2dldFRocmVlcGlkU3RhdGUiLCJlbWFpbHMiLCJtc2lzZG5zIiwibmV3TGFuZ3VhZ2UiLCJzdGF0ZSIsImxhbmd1YWdlIiwiU2V0dGluZ3NTdG9yZSIsInNldFZhbHVlIiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwiUGxhdGZvcm1QZWciLCJyZWxvYWQiLCJlIiwibmV3VGhlbWUiLCJ0YXJnZXQiLCJ2YWx1ZSIsInRoZW1lIiwib2xkVGhlbWUiLCJnZXRWYWx1ZSIsIkFDQ09VTlQiLCJjYXRjaCIsImRpcyIsImRpc3BhdGNoIiwiZm9yY2VUaGVtZSIsImNoZWNrZWQiLCJ1c2VTeXN0ZW1UaGVtZSIsImVyciIsImVyck1zZyIsImVycm9yIiwiaHR0cFN0YXR1cyIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY29uc29sZSIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJEZWFjdGl2YXRlQWNjb3VudERpYWxvZyIsIm9uRmluaXNoZWQiLCJzdWNjZXNzIiwicHJvcHMiLCJjbG9zZVNldHRpbmdzRm4iLCJjdXJyZW50VGhlbWVzIiwibWFwIiwiYyIsIl90aGVtZVRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiciIsImZldGNoIiwiY3VzdG9tVGhlbWVVcmwiLCJ0aGVtZUluZm8iLCJqc29uIiwiY3VzdG9tVGhlbWVNZXNzYWdlIiwidGV4dCIsImlzRXJyb3IiLCJwdXNoIiwic2V0VGltZW91dCIsImxhbmd1YWdlSGFuZGxlciIsImdldEN1cnJlbnRMYW5ndWFnZSIsInNlcnZlclN1cHBvcnRzU2VwYXJhdGVBZGRBbmRCaW5kIiwiaWRTZXJ2ZXJIYXNVbnNpZ25lZFRlcm1zIiwicmVxdWlyZWRQb2xpY3lJbmZvIiwiaGFzVGVybXMiLCJsb2FkaW5nM3BpZHMiLCJfY2FsY3VsYXRlVGhlbWVTdGF0ZSIsImRpc3BhdGNoZXJSZWYiLCJyZWdpc3RlciIsIl9vbkFjdGlvbiIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJjbGkiLCJkb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCIsImNhcGFiaWxpdGllcyIsImdldENhcGFiaWxpdGllcyIsImNoYW5nZVBhc3N3b3JkQ2FwIiwiY2FuQ2hhbmdlUGFzc3dvcmQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJ0aGVtZUNob2ljZSIsImdldFZhbHVlQXQiLCJzeXN0ZW1UaGVtZUV4cGxpY2l0IiwidGhlbWVFeHBsaWNpdCIsIl9jaGVja1Rlcm1zIiwidGhyZWVwaWRzIiwiaWRTZXJ2ZXJVcmwiLCJ3YXJuIiwiZmlsdGVyIiwiYSIsIm1lZGl1bSIsImF1dGhDbGllbnQiLCJJZGVudGl0eUF1dGhDbGllbnQiLCJpZEFjY2Vzc1Rva2VuIiwiZ2V0QWNjZXNzVG9rZW4iLCJjaGVjayIsIlNlcnZpY2UiLCJTRVJWSUNFX1RZUEVTIiwiSVMiLCJwb2xpY2llc0FuZFNlcnZpY2VzIiwiYWdyZWVkVXJscyIsImV4dHJhQ2xhc3NOYW1lcyIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiaWRTZXJ2ZXJOYW1lIiwiX3JlbmRlclByb2ZpbGVTZWN0aW9uIiwiX3JlbmRlckFjY291bnRTZWN0aW9uIiwiQ2hhbmdlUGFzc3dvcmQiLCJFbWFpbEFkZHJlc3NlcyIsIlBob25lTnVtYmVycyIsInBhc3N3b3JkQ2hhbmdlRm9ybSIsIl9vblBhc3N3b3JkQ2hhbmdlRXJyb3IiLCJfb25QYXNzd29yZENoYW5nZWQiLCJ0aHJlZXBpZFNlY3Rpb24iLCJfb25FbWFpbHNDaGFuZ2UiLCJfb25Nc2lzZG5zQ2hhbmdlIiwicGFzc3dvcmRDaGFuZ2VUZXh0IiwiX3JlbmRlckxhbmd1YWdlU2VjdGlvbiIsIl9vbkxhbmd1YWdlQ2hhbmdlIiwiX3JlbmRlclRoZW1lU2VjdGlvbiIsIlNldHRpbmdzRmxhZyIsIkxhYmVsbGVkVG9nZ2xlU3dpdGNoIiwidGhlbWVXYXRjaGVyIiwiVGhlbWVXYXRjaGVyIiwic3lzdGVtVGhlbWVTZWN0aW9uIiwiaXNTeXN0ZW1UaGVtZVN1cHBvcnRlZCIsImdldERpc3BsYXlOYW1lIiwiX29uVXNlU3lzdGVtVGhlbWVDaGFuZ2VkIiwiY3VzdG9tVGhlbWVGb3JtIiwiaXNGZWF0dXJlRW5hYmxlZCIsIm1lc3NhZ2VFbGVtZW50IiwiX29uQWRkQ3VzdG9tVGhlbWUiLCJfb25DdXN0b21UaGVtZUNoYW5nZSIsInRyaW0iLCJ0aGVtZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwicCIsImlkIiwibmFtZSIsImJ1aWx0SW5UaGVtZXMiLCJzdGFydHNXaXRoIiwiY3VzdG9tVGhlbWVzIiwiaW5jbHVkZXMiLCJzb3J0IiwiYiIsImxvY2FsZUNvbXBhcmUiLCJvcmRlcmVkVGhlbWVzIiwiX29uVGhlbWVDaGFuZ2UiLCJfcmVuZGVyRGlzY292ZXJ5U2VjdGlvbiIsIlNldElkU2VydmVyIiwiSW5saW5lVGVybXNBZ3JlZW1lbnQiLCJpbnRybyIsInNlcnZlck5hbWUiLCJfcmVuZGVyTWFuYWdlbWVudFNlY3Rpb24iLCJfb25EZWFjdGl2YXRlQ2xpY2tlZCIsIl9yZW5kZXJJbnRlZ3JhdGlvbk1hbmFnZXJTZWN0aW9uIiwiU2V0SW50ZWdyYXRpb25NYW5hZ2VyIiwicmVuZGVyIiwiZGlzY29XYXJuaW5nIiwicmVxdWlyZSIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztB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SjtBQWNIOztBQWhoQitEOzs7OEJBQS9Dckssc0IsZUFDRTtBQUNmc0QsRUFBQUEsZUFBZSxFQUFFc0gsbUJBQVVDLElBQVYsQ0FBZUM7QUFEakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQgUHJvZmlsZVNldHRpbmdzIGZyb20gXCIuLi8uLi9Qcm9maWxlU2V0dGluZ3NcIjtcbmltcG9ydCBGaWVsZCBmcm9tIFwiLi4vLi4vLi4vZWxlbWVudHMvRmllbGRcIjtcbmltcG9ydCAqIGFzIGxhbmd1YWdlSGFuZGxlciBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgTGFuZ3VhZ2VEcm9wZG93biBmcm9tIFwiLi4vLi4vLi4vZWxlbWVudHMvTGFuZ3VhZ2VEcm9wZG93blwiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uLy4uLy4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcbmltcG9ydCBEZWFjdGl2YXRlQWNjb3VudERpYWxvZyBmcm9tIFwiLi4vLi4vLi4vZGlhbG9ncy9EZWFjdGl2YXRlQWNjb3VudERpYWxvZ1wiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0IHtlbnVtZXJhdGVUaGVtZXMsIFRoZW1lV2F0Y2hlcn0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3RoZW1lXCI7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL1BsYXRmb3JtUGVnXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi8uLi8uLlwiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9Nb2RhbFwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQge1NlcnZpY2UsIHN0YXJ0VGVybXNGbG93fSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vVGVybXNcIjtcbmltcG9ydCB7U0VSVklDRV9UWVBFU30gZnJvbSBcIm1hdHJpeC1qcy1zZGtcIjtcbmltcG9ydCBJZGVudGl0eUF1dGhDbGllbnQgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL0lkZW50aXR5QXV0aENsaWVudFwiO1xuaW1wb3J0IHthYmJyZXZpYXRlVXJsfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vdXRpbHMvVXJsVXRpbHNcIjtcbmltcG9ydCB7IGdldFRocmVlcGlkc1dpdGhCaW5kU3RhdHVzIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYm91bmRUaHJlZXBpZHMnO1xuaW1wb3J0IFNwaW5uZXIgZnJvbSBcIi4uLy4uLy4uL2VsZW1lbnRzL1NwaW5uZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuZXJhbFVzZXJTZXR0aW5nc1RhYiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgY2xvc2VTZXR0aW5nc0ZuOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlSGFuZGxlci5nZXRDdXJyZW50TGFuZ3VhZ2UoKSxcbiAgICAgICAgICAgIGhhdmVJZFNlcnZlcjogQm9vbGVhbihNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKSksXG4gICAgICAgICAgICBzZXJ2ZXJTdXBwb3J0c1NlcGFyYXRlQWRkQW5kQmluZDogbnVsbCxcbiAgICAgICAgICAgIGlkU2VydmVySGFzVW5zaWduZWRUZXJtczogZmFsc2UsXG4gICAgICAgICAgICByZXF1aXJlZFBvbGljeUluZm86IHsgICAgICAgLy8gVGhpcyBvYmplY3QgaXMgcGFzc2VkIGFsb25nIHRvIGEgY29tcG9uZW50IGZvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgIGhhc1Rlcm1zOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAvLyBwb2xpY2llc0FuZFNlcnZpY2VzLCAvLyBGcm9tIHRoZSBzdGFydFRlcm1zRmxvdyBjYWxsYmFja1xuICAgICAgICAgICAgICAgIC8vIGFncmVlZFVybHMsICAgICAgICAgIC8vIEZyb20gdGhlIHN0YXJ0VGVybXNGbG93IGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZSwgICAgICAgICAgICAgLy8gUHJvbWlzZSByZXNvbHZlIGZ1bmN0aW9uIGZvciBzdGFydFRlcm1zRmxvdyBjYWxsYmFja1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVtYWlsczogW10sXG4gICAgICAgICAgICBtc2lzZG5zOiBbXSxcbiAgICAgICAgICAgIGxvYWRpbmczcGlkczogdHJ1ZSwgLy8gd2hldGhlciBvciBub3QgdGhlIGVtYWlscyBhbmQgbXNpc2RucyBoYXZlIGJlZW4gbG9hZGVkXG4gICAgICAgICAgICAuLi50aGlzLl9jYWxjdWxhdGVUaGVtZVN0YXRlKCksXG4gICAgICAgICAgICBjdXN0b21UaGVtZVVybDogXCJcIixcbiAgICAgICAgICAgIGN1c3RvbVRoZW1lTWVzc2FnZToge2lzRXJyb3I6IGZhbHNlLCB0ZXh0OiBcIlwifSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5fb25BY3Rpb24pO1xuICAgIH1cblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBNb3ZlIHRoaXMgdG8gY29uc3RydWN0b3JcbiAgICBhc3luYyBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50KCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbWVsY2FzZVxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgY29uc3Qgc2VydmVyU3VwcG9ydHNTZXBhcmF0ZUFkZEFuZEJpbmQgPSBhd2FpdCBjbGkuZG9lc1NlcnZlclN1cHBvcnRTZXBhcmF0ZUFkZEFuZEJpbmQoKTtcblxuICAgICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBhd2FpdCBjbGkuZ2V0Q2FwYWJpbGl0aWVzKCk7IC8vIHRoaXMgaXMgY2FjaGVkXG4gICAgICAgIGNvbnN0IGNoYW5nZVBhc3N3b3JkQ2FwID0gY2FwYWJpbGl0aWVzWydtLmNoYW5nZV9wYXNzd29yZCddO1xuXG4gICAgICAgIC8vIFlvdSBjYW4gY2hhbmdlIHlvdXIgcGFzc3dvcmQgc28gbG9uZyBhcyB0aGUgY2FwYWJpbGl0eSBpc24ndCBleHBsaWNpdGx5IGRpc2FibGVkLiBUaGUgaW1wbGljaXRcbiAgICAgICAgLy8gYmVoYXZpb3VyIGlzIHlvdSBjYW4gY2hhbmdlIHlvdXIgcGFzc3dvcmQgd2hlbiB0aGUgY2FwYWJpbGl0eSBpcyBtaXNzaW5nIG9yIGhhcyBub3QtZmFsc2UgYXNcbiAgICAgICAgLy8gdGhlIGVuYWJsZWQgZmxhZyB2YWx1ZS5cbiAgICAgICAgY29uc3QgY2FuQ2hhbmdlUGFzc3dvcmQgPSAhY2hhbmdlUGFzc3dvcmRDYXAgfHwgY2hhbmdlUGFzc3dvcmRDYXBbJ2VuYWJsZWQnXSAhPT0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VydmVyU3VwcG9ydHNTZXBhcmF0ZUFkZEFuZEJpbmQsIGNhbkNoYW5nZVBhc3N3b3JkfSk7XG5cbiAgICAgICAgdGhpcy5fZ2V0VGhyZWVwaWRTdGF0ZSgpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLmRpc3BhdGNoZXJSZWYpO1xuICAgIH1cblxuICAgIF9jYWxjdWxhdGVUaGVtZVN0YXRlKCkge1xuICAgICAgICAvLyBXZSBoYXZlIHRvIG1pcnJvciB0aGUgbG9naWMgZnJvbSBUaGVtZVdhdGNoZXIuZ2V0RWZmZWN0aXZlVGhlbWUgc28gd2VcbiAgICAgICAgLy8gc2hvdyB0aGUgcmlnaHQgdmFsdWVzIGZvciB0aGluZ3MuXG5cbiAgICAgICAgY29uc3QgdGhlbWVDaG9pY2UgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQoU2V0dGluZ0xldmVsLkFDQ09VTlQsIFwidGhlbWVcIik7XG4gICAgICAgIGNvbnN0IHN5c3RlbVRoZW1lRXhwbGljaXQgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQoXG4gICAgICAgICAgICBTZXR0aW5nTGV2ZWwuREVWSUNFLCBcInVzZV9zeXN0ZW1fdGhlbWVcIiwgbnVsbCwgZmFsc2UsIHRydWUpO1xuICAgICAgICBjb25zdCB0aGVtZUV4cGxpY2l0ID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZUF0KFxuICAgICAgICAgICAgU2V0dGluZ0xldmVsLkRFVklDRSwgXCJ0aGVtZVwiLCBudWxsLCBmYWxzZSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgaGFzIGVuYWJsZWQgc3lzdGVtIHRoZW1lIG1hdGNoaW5nLCB1c2UgdGhhdC5cbiAgICAgICAgaWYgKHN5c3RlbVRoZW1lRXhwbGljaXQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGhlbWU6IHRoZW1lQ2hvaWNlLFxuICAgICAgICAgICAgICAgIHVzZVN5c3RlbVRoZW1lOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGhhcyBzZXQgYSB0aGVtZSBleHBsaWNpdGx5LCB1c2UgdGhhdCAobm8gc3lzdGVtIHRoZW1lIG1hdGNoaW5nKVxuICAgICAgICBpZiAodGhlbWVFeHBsaWNpdCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0aGVtZTogdGhlbWVDaG9pY2UsXG4gICAgICAgICAgICAgICAgdXNlU3lzdGVtVGhlbWU6IGZhbHNlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSBhc3N1bWUgdGhlIGRlZmF1bHRzIGZvciB0aGUgc2V0dGluZ3NcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRoZW1lOiB0aGVtZUNob2ljZSxcbiAgICAgICAgICAgIHVzZVN5c3RlbVRoZW1lOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQoU2V0dGluZ0xldmVsLkRFVklDRSwgXCJ1c2Vfc3lzdGVtX3RoZW1lXCIpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9vbkFjdGlvbiA9IChwYXlsb2FkKSA9PiB7XG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gJ2lkX3NlcnZlcl9jaGFuZ2VkJykge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGF2ZUlkU2VydmVyOiBCb29sZWFuKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpKX0pO1xuICAgICAgICAgICAgdGhpcy5fZ2V0VGhyZWVwaWRTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vbkVtYWlsc0NoYW5nZSA9IChlbWFpbHMpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGVtYWlscyB9KTtcbiAgICB9O1xuXG4gICAgX29uTXNpc2Ruc0NoYW5nZSA9IChtc2lzZG5zKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBtc2lzZG5zIH0pO1xuICAgIH07XG5cbiAgICBhc3luYyBfZ2V0VGhyZWVwaWRTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0ZXJtcyBuZWVkIGFjY2VwdGluZ1xuICAgICAgICB0aGlzLl9jaGVja1Rlcm1zKCk7XG5cbiAgICAgICAgLy8gTmVlZCB0byBnZXQgM1BJRHMgZ2VuZXJhbGx5IGZvciBBY2NvdW50IHNlY3Rpb24gYW5kIHBvc3NpYmx5IGFsc28gZm9yXG4gICAgICAgIC8vIERpc2NvdmVyeSAoYXNzdW1pbmcgd2UgaGF2ZSBhbiBJUyBhbmQgdGVybXMgYXJlIGFncmVlZCkuXG4gICAgICAgIGxldCB0aHJlZXBpZHMgPSBbXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocmVlcGlkcyA9IGF3YWl0IGdldFRocmVlcGlkc1dpdGhCaW5kU3RhdHVzKGNsaSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkU2VydmVyVXJsID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgYFVuYWJsZSB0byByZWFjaCBpZGVudGl0eSBzZXJ2ZXIgYXQgJHtpZFNlcnZlclVybH0gdG8gY2hlY2sgYCArXG4gICAgICAgICAgICAgICAgYGZvciAzUElEcyBiaW5kaW5ncyBpbiBTZXR0aW5nc2AsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZW1haWxzOiB0aHJlZXBpZHMuZmlsdGVyKChhKSA9PiBhLm1lZGl1bSA9PT0gJ2VtYWlsJyksXG4gICAgICAgICAgICBtc2lzZG5zOiB0aHJlZXBpZHMuZmlsdGVyKChhKSA9PiBhLm1lZGl1bSA9PT0gJ21zaXNkbicpLFxuICAgICAgICAgICAgbG9hZGluZzNwaWRzOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgX2NoZWNrVGVybXMoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5oYXZlSWRTZXJ2ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2lkU2VydmVySGFzVW5zaWduZWRUZXJtczogZmFsc2V9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJ5IHN0YXJ0aW5nIHRoZSB0ZXJtcyBmbG93IHdlIGdldCB0aGUgbG9naWMgZm9yIGNoZWNraW5nIHdoaWNoIHRlcm1zIHRoZSB1c2VyIGhhcyBzaWduZWRcbiAgICAgICAgLy8gZm9yIGZyZWUuIFNvIHdlIG1pZ2h0IGFzIHdlbGwgdXNlIHRoYXQgZm9yIG91ciBvd24gcHVycG9zZXMuXG4gICAgICAgIGNvbnN0IGlkU2VydmVyVXJsID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCk7XG4gICAgICAgIGNvbnN0IGF1dGhDbGllbnQgPSBuZXcgSWRlbnRpdHlBdXRoQ2xpZW50KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBpZEFjY2Vzc1Rva2VuID0gYXdhaXQgYXV0aENsaWVudC5nZXRBY2Nlc3NUb2tlbih7IGNoZWNrOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHN0YXJ0VGVybXNGbG93KFtuZXcgU2VydmljZShcbiAgICAgICAgICAgICAgICBTRVJWSUNFX1RZUEVTLklTLFxuICAgICAgICAgICAgICAgIGlkU2VydmVyVXJsLFxuICAgICAgICAgICAgICAgIGlkQWNjZXNzVG9rZW4sXG4gICAgICAgICAgICApXSwgKHBvbGljaWVzQW5kU2VydmljZXMsIGFncmVlZFVybHMsIGV4dHJhQ2xhc3NOYW1lcykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRTZXJ2ZXJOYW1lOiBhYmJyZXZpYXRlVXJsKGlkU2VydmVyVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkUG9saWN5SW5mbzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1Rlcm1zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGljaWVzQW5kU2VydmljZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdyZWVkVXJscyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFVzZXIgYWNjZXB0ZWQgYWxsIHRlcm1zXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZXF1aXJlZFBvbGljeUluZm86IHtcbiAgICAgICAgICAgICAgICAgICAgaGFzVGVybXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgIGBVbmFibGUgdG8gcmVhY2ggaWRlbnRpdHkgc2VydmVyIGF0ICR7aWRTZXJ2ZXJVcmx9IHRvIGNoZWNrIGAgK1xuICAgICAgICAgICAgICAgIGBmb3IgdGVybXMgaW4gU2V0dGluZ3NgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vbkxhbmd1YWdlQ2hhbmdlID0gKG5ld0xhbmd1YWdlKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxhbmd1YWdlID09PSBuZXdMYW5ndWFnZSkgcmV0dXJuO1xuXG4gICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJsYW5ndWFnZVwiLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCBuZXdMYW5ndWFnZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xhbmd1YWdlOiBuZXdMYW5ndWFnZX0pO1xuICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5yZWxvYWQoKTtcbiAgICB9O1xuXG4gICAgX29uVGhlbWVDaGFuZ2UgPSAoZSkgPT4ge1xuICAgICAgICBjb25zdCBuZXdUaGVtZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS50aGVtZSA9PT0gbmV3VGhlbWUpIHJldHVybjtcblxuICAgICAgICAvLyBkb2luZyBnZXRWYWx1ZSBpbiB0aGUgLmNhdGNoIHdpbGwgc3RpbGwgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBmYWlsZWQgdG8gc2V0LFxuICAgICAgICAvLyBzbyByZW1lbWJlciB3aGF0IHRoZSB2YWx1ZSB3YXMgYmVmb3JlIHdlIHRyaWVkIHRvIHNldCBpdCBzbyB3ZSBjYW4gcmV2ZXJ0XG4gICAgICAgIGNvbnN0IG9sZFRoZW1lID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZSgndGhlbWUnKTtcbiAgICAgICAgU2V0dGluZ3NTdG9yZS5zZXRWYWx1ZShcInRoZW1lXCIsIG51bGwsIFNldHRpbmdMZXZlbC5BQ0NPVU5ULCBuZXdUaGVtZSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdyZWNoZWNrX3RoZW1lJ30pO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGhlbWU6IG9sZFRoZW1lfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt0aGVtZTogbmV3VGhlbWV9KTtcbiAgICAgICAgLy8gVGhlIHNldHRpbmdzIHdhdGNoZXIgZG9lc24ndCBmaXJlIHVudGlsIHRoZSBlY2hvIGNvbWVzIGJhY2sgZnJvbSB0aGVcbiAgICAgICAgLy8gc2VydmVyLCBzbyB0byBtYWtlIHRoZSB0aGVtZSBjaGFuZ2UgaW1tZWRpYXRlbHkgd2UgbmVlZCB0byBtYW51YWxseVxuICAgICAgICAvLyBkbyB0aGUgZGlzcGF0Y2ggbm93XG4gICAgICAgIC8vIFhYWDogVGhlIGxvY2FsIGVjaG9lZCB2YWx1ZSBhcHBlYXJzIHRvIGJlIHVucmVsaWFibGUsIGluIHBhcnRpY3VsYXJcbiAgICAgICAgLy8gd2hlbiBzZXR0aW5ncyBjdXN0b20gdGhlbWVzKCEpIHNvIGFkZGluZyBmb3JjZVRoZW1lIHRvIG92ZXJyaWRlXG4gICAgICAgIC8vIHRoZSB2YWx1ZSBmcm9tIHNldHRpbmdzLlxuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3JlY2hlY2tfdGhlbWUnLCBmb3JjZVRoZW1lOiBuZXdUaGVtZX0pO1xuICAgIH07XG5cbiAgICBfb25Vc2VTeXN0ZW1UaGVtZUNoYW5nZWQgPSAoY2hlY2tlZCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt1c2VTeXN0ZW1UaGVtZTogY2hlY2tlZH0pO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwidXNlX3N5c3RlbV90aGVtZVwiLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCBjaGVja2VkKTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdyZWNoZWNrX3RoZW1lJ30pO1xuICAgIH07XG5cbiAgICBfb25QYXNzd29yZENoYW5nZUVycm9yID0gKGVycikgPT4ge1xuICAgICAgICAvLyBUT0RPOiBGaWd1cmUgb3V0IGEgZGVzaWduIHRoYXQgZG9lc24ndCBpbnZvbHZlIHJlcGxhY2luZyB0aGUgY3VycmVudCBkaWFsb2dcbiAgICAgICAgbGV0IGVyck1zZyA9IGVyci5lcnJvciB8fCBcIlwiO1xuICAgICAgICBpZiAoZXJyLmh0dHBTdGF0dXMgPT09IDQwMykge1xuICAgICAgICAgICAgZXJyTXNnID0gX3QoXCJGYWlsZWQgdG8gY2hhbmdlIHBhc3N3b3JkLiBJcyB5b3VyIHBhc3N3b3JkIGNvcnJlY3Q/XCIpO1xuICAgICAgICB9IGVsc2UgaWYgKGVyci5odHRwU3RhdHVzKSB7XG4gICAgICAgICAgICBlcnJNc2cgKz0gYCAoSFRUUCBzdGF0dXMgJHtlcnIuaHR0cFN0YXR1c30pYDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGNoYW5nZSBwYXNzd29yZDogXCIgKyBlcnJNc2cpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gY2hhbmdlIHBhc3N3b3JkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvclwiKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBlcnJNc2csXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25QYXNzd29yZENoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgIC8vIFRPRE86IEZpZ3VyZSBvdXQgYSBkZXNpZ24gdGhhdCBkb2Vzbid0IGludm9sdmUgcmVwbGFjaW5nIHRoZSBjdXJyZW50IGRpYWxvZ1xuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdQYXNzd29yZCBjaGFuZ2VkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoXCJTdWNjZXNzXCIpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgIFwiWW91ciBwYXNzd29yZCB3YXMgc3VjY2Vzc2Z1bGx5IGNoYW5nZWQuIFlvdSB3aWxsIG5vdCByZWNlaXZlIFwiICtcbiAgICAgICAgICAgICAgICBcInB1c2ggbm90aWZpY2F0aW9ucyBvbiBvdGhlciBzZXNzaW9ucyB1bnRpbCB5b3UgbG9nIGJhY2sgaW4gdG8gdGhlbVwiLFxuICAgICAgICAgICAgKSArIFwiLlwiLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uRGVhY3RpdmF0ZUNsaWNrZWQgPSAoKSA9PiB7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0RlYWN0aXZhdGUgQWNjb3VudCcsICcnLCBEZWFjdGl2YXRlQWNjb3VudERpYWxvZywge1xuICAgICAgICAgICAgb25GaW5pc2hlZDogKHN1Y2Nlc3MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2VzcykgdGhpcy5wcm9wcy5jbG9zZVNldHRpbmdzRm4oKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25BZGRDdXN0b21UaGVtZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGN1cnJlbnRUaGVtZXMgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiY3VzdG9tX3RoZW1lc1wiKTtcbiAgICAgICAgaWYgKCFjdXJyZW50VGhlbWVzKSBjdXJyZW50VGhlbWVzID0gW107XG4gICAgICAgIGN1cnJlbnRUaGVtZXMgPSBjdXJyZW50VGhlbWVzLm1hcChjID0+IGMpOyAvLyBjaGVhcCBjbG9uZVxuXG4gICAgICAgIGlmICh0aGlzLl90aGVtZVRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGhlbWVUaW1lcik7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHRoaXMuc3RhdGUuY3VzdG9tVGhlbWVVcmwpO1xuICAgICAgICAgICAgY29uc3QgdGhlbWVJbmZvID0gYXdhaXQgci5qc29uKCk7XG4gICAgICAgICAgICBpZiAoIXRoZW1lSW5mbyB8fCB0eXBlb2YodGhlbWVJbmZvWyduYW1lJ10pICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YodGhlbWVJbmZvWydjb2xvcnMnXSkgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VzdG9tVGhlbWVNZXNzYWdlOiB7dGV4dDogX3QoXCJJbnZhbGlkIHRoZW1lIHNjaGVtYS5cIiksIGlzRXJyb3I6IHRydWV9fSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudFRoZW1lcy5wdXNoKHRoZW1lSW5mbyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjdXN0b21UaGVtZU1lc3NhZ2U6IHt0ZXh0OiBfdChcIkVycm9yIGRvd25sb2FkaW5nIHRoZW1lIGluZm9ybWF0aW9uLlwiKSwgaXNFcnJvcjogdHJ1ZX19KTtcbiAgICAgICAgICAgIHJldHVybjsgLy8gRG9uJ3QgY29udGludWUgb24gZXJyb3JcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJjdXN0b21fdGhlbWVzXCIsIG51bGwsIFNldHRpbmdMZXZlbC5BQ0NPVU5ULCBjdXJyZW50VGhlbWVzKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VzdG9tVGhlbWVVcmw6IFwiXCIsIGN1c3RvbVRoZW1lTWVzc2FnZToge3RleHQ6IF90KFwiVGhlbWUgYWRkZWQhXCIpLCBpc0Vycm9yOiBmYWxzZX19KTtcblxuICAgICAgICB0aGlzLl90aGVtZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjdXN0b21UaGVtZU1lc3NhZ2U6IHt0ZXh0OiBcIlwiLCBpc0Vycm9yOiBmYWxzZX19KTtcbiAgICAgICAgfSwgMzAwMCk7XG4gICAgfTtcblxuICAgIF9vbkN1c3RvbVRoZW1lQ2hhbmdlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VzdG9tVGhlbWVVcmw6IGUudGFyZ2V0LnZhbHVlfSk7XG4gICAgfTtcblxuICAgIF9yZW5kZXJQcm9maWxlU2VjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc2VjdGlvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJQcm9maWxlXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8UHJvZmlsZVNldHRpbmdzIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfcmVuZGVyQWNjb3VudFNlY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IENoYW5nZVBhc3N3b3JkID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLnNldHRpbmdzLkNoYW5nZVBhc3N3b3JkXCIpO1xuICAgICAgICBjb25zdCBFbWFpbEFkZHJlc3NlcyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5zZXR0aW5ncy5hY2NvdW50LkVtYWlsQWRkcmVzc2VzXCIpO1xuICAgICAgICBjb25zdCBQaG9uZU51bWJlcnMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuYWNjb3VudC5QaG9uZU51bWJlcnNcIik7XG5cbiAgICAgICAgbGV0IHBhc3N3b3JkQ2hhbmdlRm9ybSA9IChcbiAgICAgICAgICAgIDxDaGFuZ2VQYXNzd29yZFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0dlbmVyYWxVc2VyU2V0dGluZ3NUYWJfY2hhbmdlUGFzc3dvcmRcIlxuICAgICAgICAgICAgICAgIHJvd0NsYXNzTmFtZT1cIlwiXG4gICAgICAgICAgICAgICAgYnV0dG9uS2luZD1cInByaW1hcnlcIlxuICAgICAgICAgICAgICAgIG9uRXJyb3I9e3RoaXMuX29uUGFzc3dvcmRDaGFuZ2VFcnJvcn1cbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLl9vblBhc3N3b3JkQ2hhbmdlZH0gLz5cbiAgICAgICAgKTtcblxuICAgICAgICBsZXQgdGhyZWVwaWRTZWN0aW9uID0gbnVsbDtcblxuICAgICAgICAvLyBGb3Igb2xkZXIgaG9tZXNlcnZlcnMgd2l0aG91dCBzZXBhcmF0ZSAzUElEIGFkZCBhbmQgYmluZCBtZXRob2RzIChNU0MyMjkwKSxcbiAgICAgICAgLy8gd2UgdXNlIGEgY29tYm8gYWRkIHdpdGggYmluZCBvcHRpb24gQVBJIHdoaWNoIHJlcXVpcmVzIGFuIGlkZW50aXR5IHNlcnZlciB0b1xuICAgICAgICAvLyB2YWxpZGF0ZSAzUElEIG93bmVyc2hpcCBldmVuIGlmIHdlJ3JlIGp1c3QgYWRkaW5nIHRvIHRoZSBob21lc2VydmVyIG9ubHkuXG4gICAgICAgIC8vIEZvciBuZXdlciBob21lc2VydmVycyB3aXRoIHNlcGFyYXRlIDNQSUQgYWRkIGFuZCBiaW5kIG1ldGhvZHMgKE1TQzIyOTApLFxuICAgICAgICAvLyB0aGVyZSBpcyBubyBzdWNoIGNvbmNlcm4sIHNvIHdlIGNhbiBhbHdheXMgc2hvdyB0aGUgSFMgYWNjb3VudCAzUElEcy5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaGF2ZUlkU2VydmVyIHx8IHRoaXMuc3RhdGUuc2VydmVyU3VwcG9ydHNTZXBhcmF0ZUFkZEFuZEJpbmQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGVtYWlscyA9IHRoaXMuc3RhdGUubG9hZGluZzNwaWRzXG4gICAgICAgICAgICAgICAgPyA8U3Bpbm5lciAvPlxuICAgICAgICAgICAgICAgIDogPEVtYWlsQWRkcmVzc2VzXG4gICAgICAgICAgICAgICAgICAgIGVtYWlscz17dGhpcy5zdGF0ZS5lbWFpbHN9XG4gICAgICAgICAgICAgICAgICAgIG9uRW1haWxzQ2hhbmdlPXt0aGlzLl9vbkVtYWlsc0NoYW5nZX1cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgIGNvbnN0IG1zaXNkbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmczcGlkc1xuICAgICAgICAgICAgICAgID8gPFNwaW5uZXIgLz5cbiAgICAgICAgICAgICAgICA6IDxQaG9uZU51bWJlcnNcbiAgICAgICAgICAgICAgICAgICAgbXNpc2Rucz17dGhpcy5zdGF0ZS5tc2lzZG5zfVxuICAgICAgICAgICAgICAgICAgICBvbk1zaXNkbnNDaGFuZ2U9e3RoaXMuX29uTXNpc2Ruc0NoYW5nZX1cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgIHRocmVlcGlkU2VjdGlvbiA9IDxkaXY+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZ1wiPntfdChcIkVtYWlsIGFkZHJlc3Nlc1wiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2VtYWlsc31cblxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJQaG9uZSBudW1iZXJzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7bXNpc2Ruc31cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnNlcnZlclN1cHBvcnRzU2VwYXJhdGVBZGRBbmRCaW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJlZXBpZFNlY3Rpb24gPSA8U3Bpbm5lciAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXNzd29yZENoYW5nZVRleHQgPSBfdChcIlNldCBhIG5ldyBhY2NvdW50IHBhc3N3b3JkLi4uXCIpO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuY2FuQ2hhbmdlUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIC8vIEp1c3QgZG9uJ3Qgc2hvdyBhbnl0aGluZyBpZiB5b3UgY2FuJ3QgZG8gYW55dGhpbmcuXG4gICAgICAgICAgICBwYXNzd29yZENoYW5nZVRleHQgPSBudWxsO1xuICAgICAgICAgICAgcGFzc3dvcmRDaGFuZ2VGb3JtID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfR2VuZXJhbFVzZXJTZXR0aW5nc1RhYl9hY2NvdW50U2VjdGlvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJBY2NvdW50XCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7cGFzc3dvcmRDaGFuZ2VUZXh0fVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICB7cGFzc3dvcmRDaGFuZ2VGb3JtfVxuICAgICAgICAgICAgICAgIHt0aHJlZXBpZFNlY3Rpb259XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfcmVuZGVyTGFuZ3VhZ2VTZWN0aW9uKCkge1xuICAgICAgICAvLyBUT0RPOiBDb252ZXJ0IHRvIG5ldy1zdHlsZWQgRmllbGRcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc2VjdGlvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJMYW5ndWFnZSBhbmQgcmVnaW9uXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8TGFuZ3VhZ2VEcm9wZG93biBjbGFzc05hbWU9XCJteF9HZW5lcmFsVXNlclNldHRpbmdzVGFiX2xhbmd1YWdlSW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uT3B0aW9uQ2hhbmdlPXt0aGlzLl9vbkxhbmd1YWdlQ2hhbmdlfSB2YWx1ZT17dGhpcy5zdGF0ZS5sYW5ndWFnZX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJUaGVtZVNlY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFNldHRpbmdzRmxhZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5lbGVtZW50cy5TZXR0aW5nc0ZsYWdcIik7XG4gICAgICAgIGNvbnN0IExhYmVsbGVkVG9nZ2xlU3dpdGNoID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmVsZW1lbnRzLkxhYmVsbGVkVG9nZ2xlU3dpdGNoXCIpO1xuXG4gICAgICAgIGNvbnN0IHRoZW1lV2F0Y2hlciA9IG5ldyBUaGVtZVdhdGNoZXIoKTtcbiAgICAgICAgbGV0IHN5c3RlbVRoZW1lU2VjdGlvbjtcbiAgICAgICAgaWYgKHRoZW1lV2F0Y2hlci5pc1N5c3RlbVRoZW1lU3VwcG9ydGVkKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbVRoZW1lU2VjdGlvbiA9IDxkaXY+XG4gICAgICAgICAgICAgICAgPExhYmVsbGVkVG9nZ2xlU3dpdGNoXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnVzZVN5c3RlbVRoZW1lfVxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17U2V0dGluZ3NTdG9yZS5nZXREaXNwbGF5TmFtZShcInVzZV9zeXN0ZW1fdGhlbWVcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vblVzZVN5c3RlbVRoZW1lQ2hhbmdlZH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1c3RvbVRoZW1lRm9ybTtcbiAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuaXNGZWF0dXJlRW5hYmxlZChcImZlYXR1cmVfY3VzdG9tX3RoZW1lc1wiKSkge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2VFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmN1c3RvbVRoZW1lTWVzc2FnZS50ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuY3VzdG9tVGhlbWVNZXNzYWdlLmlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUVsZW1lbnQgPSA8ZGl2IGNsYXNzTmFtZT0ndGV4dC1lcnJvcic+e3RoaXMuc3RhdGUuY3VzdG9tVGhlbWVNZXNzYWdlLnRleHR9PC9kaXY+O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VFbGVtZW50ID0gPGRpdiBjbGFzc05hbWU9J3RleHQtc3VjY2Vzcyc+e3RoaXMuc3RhdGUuY3VzdG9tVGhlbWVNZXNzYWdlLnRleHR9PC9kaXY+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1c3RvbVRoZW1lRm9ybSA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbic+XG4gICAgICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vbkFkZEN1c3RvbVRoZW1lfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIkN1c3RvbSB0aGVtZSBVUkxcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vbkN1c3RvbVRoZW1lQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmN1c3RvbVRoZW1lVXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25BZGRDdXN0b21UaGVtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCIga2luZD1cInByaW1hcnlfc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshdGhpcy5zdGF0ZS5jdXN0b21UaGVtZVVybC50cmltKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICA+e190KFwiQWRkIHRoZW1lXCIpfTwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttZXNzYWdlRWxlbWVudH1cbiAgICAgICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRoZW1lcyA9IE9iamVjdC5lbnRyaWVzKGVudW1lcmF0ZVRoZW1lcygpKVxuICAgICAgICAgICAgLm1hcChwID0+ICh7aWQ6IHBbMF0sIG5hbWU6IHBbMV19KSk7IC8vIGNvbnZlcnQgcGFpcnMgdG8gb2JqZWN0cyBmb3IgY29kZSByZWFkYWJpbGl0eVxuICAgICAgICBjb25zdCBidWlsdEluVGhlbWVzID0gdGhlbWVzLmZpbHRlcihwID0+ICFwLmlkLnN0YXJ0c1dpdGgoXCJjdXN0b20tXCIpKTtcbiAgICAgICAgY29uc3QgY3VzdG9tVGhlbWVzID0gdGhlbWVzLmZpbHRlcihwID0+ICFidWlsdEluVGhlbWVzLmluY2x1ZGVzKHApKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpO1xuICAgICAgICBjb25zdCBvcmRlcmVkVGhlbWVzID0gWy4uLmJ1aWx0SW5UaGVtZXMsIC4uLmN1c3RvbVRoZW1lc107XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfR2VuZXJhbFVzZXJTZXR0aW5nc1RhYl90aGVtZVNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nXCI+e190KFwiVGhlbWVcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIHtzeXN0ZW1UaGVtZVNlY3Rpb259XG4gICAgICAgICAgICAgICAgPEZpZWxkIGxhYmVsPXtfdChcIlRoZW1lXCIpfSBlbGVtZW50PVwic2VsZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUudGhlbWV9IG9uQ2hhbmdlPXt0aGlzLl9vblRoZW1lQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS51c2VTeXN0ZW1UaGVtZX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtvcmRlcmVkVGhlbWVzLm1hcCh0aGVtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e3RoZW1lLmlkfSB2YWx1ZT17dGhlbWUuaWR9Pnt0aGVtZS5uYW1lfTwvb3B0aW9uPjtcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC9GaWVsZD5cbiAgICAgICAgICAgICAgICB7Y3VzdG9tVGhlbWVGb3JtfVxuICAgICAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWcgbmFtZT1cInVzZUNvbXBhY3RMYXlvdXRcIiBsZXZlbD17U2V0dGluZ0xldmVsLkFDQ09VTlR9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfcmVuZGVyRGlzY292ZXJ5U2VjdGlvbigpIHtcbiAgICAgICAgY29uc3QgU2V0SWRTZXJ2ZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuU2V0SWRTZXJ2ZXJcIik7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucmVxdWlyZWRQb2xpY3lJbmZvLmhhc1Rlcm1zKSB7XG4gICAgICAgICAgICBjb25zdCBJbmxpbmVUZXJtc0FncmVlbWVudCA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy50ZXJtcy5JbmxpbmVUZXJtc0FncmVlbWVudFwiKTtcbiAgICAgICAgICAgIGNvbnN0IGludHJvID0gPHNwYW4gY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHRcIj5cbiAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiQWdyZWUgdG8gdGhlIGlkZW50aXR5IHNlcnZlciAoJShzZXJ2ZXJOYW1lKXMpIFRlcm1zIG9mIFNlcnZpY2UgdG8gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImFsbG93IHlvdXJzZWxmIHRvIGJlIGRpc2NvdmVyYWJsZSBieSBlbWFpbCBhZGRyZXNzIG9yIHBob25lIG51bWJlci5cIixcbiAgICAgICAgICAgICAgICAgICAge3NlcnZlck5hbWU6IHRoaXMuc3RhdGUuaWRTZXJ2ZXJOYW1lfSxcbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9zcGFuPjtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPElubGluZVRlcm1zQWdyZWVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2xpY2llc0FuZFNlcnZpY2VQYWlycz17dGhpcy5zdGF0ZS5yZXF1aXJlZFBvbGljeUluZm8ucG9saWNpZXNBbmRTZXJ2aWNlc31cbiAgICAgICAgICAgICAgICAgICAgICAgIGFncmVlZFVybHM9e3RoaXMuc3RhdGUucmVxdWlyZWRQb2xpY3lJbmZvLmFncmVlZFVybHN9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnN0YXRlLnJlcXVpcmVkUG9saWN5SW5mby5yZXNvbHZlfVxuICAgICAgICAgICAgICAgICAgICAgICAgaW50cm9FbGVtZW50PXtpbnRyb31cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgeyAvKiBoYXMgaXRzIG93biBoZWFkaW5nIGFzIGl0IGluY2x1ZGVzIHRoZSBjdXJyZW50IElEIHNlcnZlciAqLyB9XG4gICAgICAgICAgICAgICAgICAgIDxTZXRJZFNlcnZlciBtaXNzaW5nVGVybXM9e3RydWV9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgRW1haWxBZGRyZXNzZXMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuZGlzY292ZXJ5LkVtYWlsQWRkcmVzc2VzXCIpO1xuICAgICAgICBjb25zdCBQaG9uZU51bWJlcnMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuZGlzY292ZXJ5LlBob25lTnVtYmVyc1wiKTtcblxuICAgICAgICBjb25zdCBlbWFpbHMgPSB0aGlzLnN0YXRlLmxvYWRpbmczcGlkcyA/IDxTcGlubmVyIC8+IDogPEVtYWlsQWRkcmVzc2VzIGVtYWlscz17dGhpcy5zdGF0ZS5lbWFpbHN9IC8+O1xuICAgICAgICBjb25zdCBtc2lzZG5zID0gdGhpcy5zdGF0ZS5sb2FkaW5nM3BpZHMgPyA8U3Bpbm5lciAvPiA6IDxQaG9uZU51bWJlcnMgbXNpc2Rucz17dGhpcy5zdGF0ZS5tc2lzZG5zfSAvPjtcblxuICAgICAgICBjb25zdCB0aHJlZXBpZFNlY3Rpb24gPSB0aGlzLnN0YXRlLmhhdmVJZFNlcnZlciA/IDxkaXYgY2xhc3NOYW1lPSdteF9HZW5lcmFsVXNlclNldHRpbmdzVGFiX2Rpc2NvdmVyeSc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nXCI+e190KFwiRW1haWwgYWRkcmVzc2VzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgIHtlbWFpbHN9XG5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJQaG9uZSBudW1iZXJzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgIHttc2lzZG5zfVxuICAgICAgICA8L2Rpdj4gOiBudWxsO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3NlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICB7dGhyZWVwaWRTZWN0aW9ufVxuICAgICAgICAgICAgICAgIHsgLyogaGFzIGl0cyBvd24gaGVhZGluZyBhcyBpdCBpbmNsdWRlcyB0aGUgY3VycmVudCBJRCBzZXJ2ZXIgKi8gfVxuICAgICAgICAgICAgICAgIDxTZXRJZFNlcnZlciAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX3JlbmRlck1hbmFnZW1lbnRTZWN0aW9uKCkge1xuICAgICAgICAvLyBUT0RPOiBJbXByb3ZlIHdhcm5pbmcgdGV4dCBmb3IgYWNjb3VudCBkZWFjdGl2YXRpb25cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc2VjdGlvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57X3QoXCJBY2NvdW50IG1hbmFnZW1lbnRcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkRlYWN0aXZhdGluZyB5b3VyIGFjY291bnQgaXMgYSBwZXJtYW5lbnQgYWN0aW9uIC0gYmUgY2FyZWZ1bCFcIil9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uRGVhY3RpdmF0ZUNsaWNrZWR9IGtpbmQ9XCJkYW5nZXJcIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiRGVhY3RpdmF0ZSBBY2NvdW50XCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJJbnRlZ3JhdGlvbk1hbmFnZXJTZWN0aW9uKCkge1xuICAgICAgICBjb25zdCBTZXRJbnRlZ3JhdGlvbk1hbmFnZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuU2V0SW50ZWdyYXRpb25NYW5hZ2VyXCIpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3NlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICB7IC8qIGhhcyBpdHMgb3duIGhlYWRpbmcgYXMgaXQgaW5jbHVkZXMgdGhlIGN1cnJlbnQgaW50ZWdyYXRpb24gbWFuYWdlciAqLyB9XG4gICAgICAgICAgICAgICAgPFNldEludGVncmF0aW9uTWFuYWdlciAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBkaXNjb1dhcm5pbmcgPSB0aGlzLnN0YXRlLnJlcXVpcmVkUG9saWN5SW5mby5oYXNUZXJtc1xuICAgICAgICAgICAgPyA8aW1nIGNsYXNzTmFtZT0nbXhfR2VuZXJhbFVzZXJTZXR0aW5nc1RhYl93YXJuaW5nSWNvbidcbiAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9yZXMvaW1nL2ZlYXRoZXItY3VzdG9taXNlZC93YXJuaW5nLXRyaWFuZ2xlLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBhbHQ9e190KFwiV2FybmluZ1wiKX0gLz5cbiAgICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfaGVhZGluZ1wiPntfdChcIkdlbmVyYWxcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclByb2ZpbGVTZWN0aW9uKCl9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckFjY291bnRTZWN0aW9uKCl9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckxhbmd1YWdlU2VjdGlvbigpfVxuICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJUaGVtZVNlY3Rpb24oKX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX2hlYWRpbmdcIj57ZGlzY29XYXJuaW5nfSB7X3QoXCJEaXNjb3ZlcnlcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckRpc2NvdmVyeVNlY3Rpb24oKX1cbiAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVySW50ZWdyYXRpb25NYW5hZ2VyU2VjdGlvbigpIC8qIEhhcyBpdHMgb3duIHRpdGxlICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfaGVhZGluZ1wiPntfdChcIkRlYWN0aXZhdGUgYWNjb3VudFwiKX08L2Rpdj5cbiAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVyTWFuYWdlbWVudFNlY3Rpb24oKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==