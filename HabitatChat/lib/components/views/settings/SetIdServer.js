"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _url = _interopRequireDefault(require("url"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _boundThreepids = require("../../../boundThreepids");

var _IdentityAuthClient = _interopRequireDefault(require("../../../IdentityAuthClient"));

var _UrlUtils = require("../../../utils/UrlUtils");

var _IdentityServerUtils = require("../../../utils/IdentityServerUtils");

var _promise = require("../../../utils/promise");

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
// We'll wait up to this long when checking for 3PID bindings on the IS.
const REACHABILITY_TIMEOUT = 10000; // ms

/**
 * Check an IS URL is valid, including liveness check
 *
 * @param {string} u The url to check
 * @returns {string} null if url passes all checks, otherwise i18ned error string
 */

async function checkIdentityServerUrl(u) {
  const parsedUrl = _url.default.parse(u);

  if (parsedUrl.protocol !== 'https:') return (0, _languageHandler._t)("Identity Server URL must be HTTPS"); // XXX: duplicated logic from js-sdk but it's quite tied up in the validation logic in the
  // js-sdk so probably as easy to duplicate it than to separate it out so we can reuse it

  try {
    const response = await fetch(u + '/_matrix/identity/api/v1');

    if (response.ok) {
      return null;
    } else if (response.status < 200 || response.status >= 300) {
      return (0, _languageHandler._t)("Not a valid Identity Server (status code %(code)s)", {
        code: response.status
      });
    } else {
      return (0, _languageHandler._t)("Could not connect to Identity Server");
    }
  } catch (e) {
    return (0, _languageHandler._t)("Could not connect to Identity Server");
  }
}

class SetIdServer extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onAction", payload => {
      // We react to changes in the ID server in the event the user is staring at this form
      // when changing their identity server on another device.
      if (payload.action !== "id_server_changed") return;
      this.setState({
        currentClientIdServer: _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()
      });
    });
    (0, _defineProperty2.default)(this, "_onIdentityServerChanged", ev => {
      const u = ev.target.value;
      this.setState({
        idServer: u
      });
    });
    (0, _defineProperty2.default)(this, "_getTooltip", () => {
      if (this.state.checking) {
        const InlineSpinner = sdk.getComponent('views.elements.InlineSpinner');
        return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(InlineSpinner, null), (0, _languageHandler._t)("Checking server"));
      } else if (this.state.error) {
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "warning"
        }, this.state.error);
      } else {
        return null;
      }
    });
    (0, _defineProperty2.default)(this, "_idServerChangeEnabled", () => {
      return !!this.state.idServer && !this.state.busy;
    });
    (0, _defineProperty2.default)(this, "_saveIdServer", fullUrl => {
      // Account data change will update localstorage, client, etc through dispatcher
      _MatrixClientPeg.MatrixClientPeg.get().setAccountData("m.identity_server", {
        base_url: fullUrl
      });

      this.setState({
        busy: false,
        error: null,
        currentClientIdServer: fullUrl,
        idServer: ''
      });
    });
    (0, _defineProperty2.default)(this, "_checkIdServer", async e => {
      e.preventDefault();
      const {
        idServer,
        currentClientIdServer
      } = this.state;
      this.setState({
        busy: true,
        checking: true,
        error: null
      });
      const fullUrl = (0, _UrlUtils.unabbreviateUrl)(idServer);
      let errStr = await checkIdentityServerUrl(fullUrl);

      if (!errStr) {
        try {
          this.setState({
            checking: false
          }); // clear tooltip
          // Test the identity server by trying to register with it. This
          // may result in a terms of service prompt.

          const authClient = new _IdentityAuthClient.default(fullUrl);
          await authClient.getAccessToken();
          let save = true; // Double check that the identity server even has terms of service.

          const hasTerms = await (0, _IdentityServerUtils.doesIdentityServerHaveTerms)(fullUrl);

          if (!hasTerms) {
            const [confirmed] = await this._showNoTermsWarning(fullUrl);
            save = confirmed;
          } // Show a general warning, possibly with details about any bound
          // 3PIDs that would be left behind.


          if (save && currentClientIdServer && fullUrl !== currentClientIdServer) {
            const [confirmed] = await this._showServerChangeWarning({
              title: (0, _languageHandler._t)("Change identity server"),
              unboundMessage: (0, _languageHandler._t)("Disconnect from the identity server <current /> and " + "connect to <new /> instead?", {}, {
                current: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(currentClientIdServer)),
                new: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(idServer))
              }),
              button: (0, _languageHandler._t)("Continue")
            });
            save = confirmed;
          }

          if (save) {
            this._saveIdServer(fullUrl);
          }
        } catch (e) {
          console.error(e);
          errStr = (0, _languageHandler._t)("Terms of service not accepted or the identity server is invalid.");
        }
      }

      this.setState({
        busy: false,
        checking: false,
        error: errStr,
        currentClientIdServer: _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()
      });
    });
    (0, _defineProperty2.default)(this, "_onDisconnectClicked", async () => {
      this.setState({
        disconnectBusy: true
      });

      try {
        const [confirmed] = await this._showServerChangeWarning({
          title: (0, _languageHandler._t)("Disconnect identity server"),
          unboundMessage: (0, _languageHandler._t)("Disconnect from the identity server <idserver />?", {}, {
            idserver: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(this.state.currentClientIdServer))
          }),
          button: (0, _languageHandler._t)("Disconnect")
        });

        if (confirmed) {
          this._disconnectIdServer();
        }
      } finally {
        this.setState({
          disconnectBusy: false
        });
      }
    });
    (0, _defineProperty2.default)(this, "_disconnectIdServer", () => {
      // Account data change will update localstorage, client, etc through dispatcher
      _MatrixClientPeg.MatrixClientPeg.get().setAccountData("m.identity_server", {
        base_url: null // clear

      });

      let newFieldVal = '';

      if ((0, _IdentityServerUtils.getDefaultIdentityServerUrl)()) {
        // Prepopulate the client's default so the user at least has some idea of
        // a valid value they might enter
        newFieldVal = (0, _UrlUtils.abbreviateUrl)((0, _IdentityServerUtils.getDefaultIdentityServerUrl)());
      }

      this.setState({
        busy: false,
        error: null,
        currentClientIdServer: _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl(),
        idServer: newFieldVal
      });
    });
    let defaultIdServer = '';

    if (!_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl() && (0, _IdentityServerUtils.getDefaultIdentityServerUrl)()) {
      // If no ID server is configured but there's one in the config, prepopulate
      // the field to help the user.
      defaultIdServer = (0, _UrlUtils.abbreviateUrl)((0, _IdentityServerUtils.getDefaultIdentityServerUrl)());
    }

    this.state = {
      defaultIdServer,
      currentClientIdServer: _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl(),
      idServer: "",
      error: null,
      busy: false,
      disconnectBusy: false,
      checking: false
    };
  }

  componentDidMount()
  /*: void*/
  {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
  }

  componentWillUnmount()
  /*: void*/
  {
    _dispatcher.default.unregister(this.dispatcherRef);
  }

  _showNoTermsWarning(fullUrl) {
    const QuestionDialog = sdk.getComponent("views.dialogs.QuestionDialog");

    const {
      finished
    } = _Modal.default.createTrackedDialog('No Terms Warning', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Identity server has no terms of service"),
      description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("span", {
        className: "warning"
      }, (0, _languageHandler._t)("The identity server you have chosen does not have any terms of service.")), /*#__PURE__*/_react.default.createElement("span", null, "\xA0", (0, _languageHandler._t)("Only continue if you trust the owner of the server."))),
      button: (0, _languageHandler._t)("Continue")
    });

    return finished;
  }

  async _showServerChangeWarning({
    title,
    unboundMessage,
    button
  }) {
    const {
      currentClientIdServer
    } = this.state;
    let threepids = [];
    let currentServerReachable = true;

    try {
      threepids = await (0, _promise.timeout)((0, _boundThreepids.getThreepidsWithBindStatus)(_MatrixClientPeg.MatrixClientPeg.get()), Promise.reject(new Error("Timeout attempting to reach identity server")), REACHABILITY_TIMEOUT);
    } catch (e) {
      currentServerReachable = false;
      console.warn("Unable to reach identity server at ".concat(currentClientIdServer, " to check ") + "for 3PIDs during IS change flow");
      console.warn(e);
    }

    const boundThreepids = threepids.filter(tp => tp.bound);
    let message;
    let danger = false;
    const messageElements = {
      idserver: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(currentClientIdServer)),
      b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
    };

    if (!currentServerReachable) {
      message = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You should <b>remove your personal data</b> from identity server " + "<idserver /> before disconnecting. Unfortunately, identity server " + "<idserver /> is currently offline or cannot be reached.", {}, messageElements)), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You should:")), /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("check your browser plugins for anything that might block " + "the identity server (such as Privacy Badger)")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("contact the administrators of identity server <idserver />", {}, {
        idserver: messageElements.idserver
      })), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("wait and try again later"))));
      danger = true;
      button = (0, _languageHandler._t)("Disconnect anyway");
    } else if (boundThreepids.length) {
      message = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You are still <b>sharing your personal data</b> on the identity " + "server <idserver />.", {}, messageElements)), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("We recommend that you remove your email addresses and phone numbers " + "from the identity server before disconnecting.")));
      danger = true;
      button = (0, _languageHandler._t)("Disconnect anyway");
    } else {
      message = unboundMessage;
    }

    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

    const {
      finished
    } = _Modal.default.createTrackedDialog('Identity Server Bound Warning', '', QuestionDialog, {
      title,
      description: message,
      button,
      cancelButton: (0, _languageHandler._t)("Go back"),
      danger
    });

    return finished;
  }

  render() {
    const AccessibleButton = sdk.getComponent('views.elements.AccessibleButton');
    const Field = sdk.getComponent('elements.Field');
    const idServerUrl = this.state.currentClientIdServer;
    let sectionTitle;
    let bodyText;

    if (idServerUrl) {
      sectionTitle = (0, _languageHandler._t)("Identity Server (%(server)s)", {
        server: (0, _UrlUtils.abbreviateUrl)(idServerUrl)
      });
      bodyText = (0, _languageHandler._t)("You are currently using <server></server> to discover and be discoverable by " + "existing contacts you know. You can change your identity server below.", {}, {
        server: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(idServerUrl))
      });

      if (this.props.missingTerms) {
        bodyText = (0, _languageHandler._t)("If you don't want to use <server /> to discover and be discoverable by existing " + "contacts you know, enter another identity server below.", {}, {
          server: sub => /*#__PURE__*/_react.default.createElement("b", null, (0, _UrlUtils.abbreviateUrl)(idServerUrl))
        });
      }
    } else {
      sectionTitle = (0, _languageHandler._t)("Identity Server");
      bodyText = (0, _languageHandler._t)("You are not currently using an identity server. " + "To discover and be discoverable by existing contacts you know, " + "add one below.");
    }

    let discoSection;

    if (idServerUrl) {
      let discoButtonContent = (0, _languageHandler._t)("Disconnect");
      let discoBodyText = (0, _languageHandler._t)("Disconnecting from your identity server will mean you " + "won't be discoverable by other users and you won't be " + "able to invite others by email or phone.");

      if (this.props.missingTerms) {
        discoBodyText = (0, _languageHandler._t)("Using an identity server is optional. If you choose not to " + "use an identity server, you won't be discoverable by other users " + "and you won't be able to invite others by email or phone.");
        discoButtonContent = (0, _languageHandler._t)("Do not use an identity server");
      }

      if (this.state.disconnectBusy) {
        const InlineSpinner = sdk.getComponent('views.elements.InlineSpinner');
        discoButtonContent = /*#__PURE__*/_react.default.createElement(InlineSpinner, null);
      }

      discoSection = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_SettingsTab_subsectionText"
      }, discoBodyText), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this._onDisconnectClicked,
        kind: "danger_sm"
      }, discoButtonContent));
    }

    return /*#__PURE__*/_react.default.createElement("form", {
      className: "mx_SettingsTab_section mx_SetIdServer",
      onSubmit: this._checkIdServer
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, sectionTitle), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subsectionText"
    }, bodyText), /*#__PURE__*/_react.default.createElement(Field, {
      label: (0, _languageHandler._t)("Enter a new identity server"),
      type: "text",
      autoComplete: "off",
      placeholder: this.state.defaultIdServer,
      value: this.state.idServer,
      onChange: this._onIdentityServerChanged,
      tooltipContent: this._getTooltip(),
      tooltipClassName: "mx_SetIdServer_tooltip",
      disabled: this.state.busy,
      flagInvalid: !!this.state.error
    }), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      type: "submit",
      kind: "primary_sm",
      onClick: this._checkIdServer,
      disabled: !this._idServerChangeEnabled()
    }, (0, _languageHandler._t)("Change")), discoSection);
  }

}

exports.default = SetIdServer;
(0, _defineProperty2.default)(SetIdServer, "propTypes", {
  // Whether or not the ID server is missing terms. This affects the text
  // shown to the user.
  missingTerms: _propTypes.default.bool
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL1NldElkU2VydmVyLmpzIl0sIm5hbWVzIjpbIlJFQUNIQUJJTElUWV9USU1FT1VUIiwiY2hlY2tJZGVudGl0eVNlcnZlclVybCIsInUiLCJwYXJzZWRVcmwiLCJ1cmwiLCJwYXJzZSIsInByb3RvY29sIiwicmVzcG9uc2UiLCJmZXRjaCIsIm9rIiwic3RhdHVzIiwiY29kZSIsImUiLCJTZXRJZFNlcnZlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwYXlsb2FkIiwiYWN0aW9uIiwic2V0U3RhdGUiLCJjdXJyZW50Q2xpZW50SWRTZXJ2ZXIiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRJZGVudGl0eVNlcnZlclVybCIsImV2IiwidGFyZ2V0IiwidmFsdWUiLCJpZFNlcnZlciIsInN0YXRlIiwiY2hlY2tpbmciLCJJbmxpbmVTcGlubmVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZXJyb3IiLCJidXN5IiwiZnVsbFVybCIsInNldEFjY291bnREYXRhIiwiYmFzZV91cmwiLCJwcmV2ZW50RGVmYXVsdCIsImVyclN0ciIsImF1dGhDbGllbnQiLCJJZGVudGl0eUF1dGhDbGllbnQiLCJnZXRBY2Nlc3NUb2tlbiIsInNhdmUiLCJoYXNUZXJtcyIsImNvbmZpcm1lZCIsIl9zaG93Tm9UZXJtc1dhcm5pbmciLCJfc2hvd1NlcnZlckNoYW5nZVdhcm5pbmciLCJ0aXRsZSIsInVuYm91bmRNZXNzYWdlIiwiY3VycmVudCIsInN1YiIsIm5ldyIsImJ1dHRvbiIsIl9zYXZlSWRTZXJ2ZXIiLCJjb25zb2xlIiwiZGlzY29ubmVjdEJ1c3kiLCJpZHNlcnZlciIsIl9kaXNjb25uZWN0SWRTZXJ2ZXIiLCJuZXdGaWVsZFZhbCIsImRlZmF1bHRJZFNlcnZlciIsImNvbXBvbmVudERpZE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJRdWVzdGlvbkRpYWxvZyIsImZpbmlzaGVkIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwiZGVzY3JpcHRpb24iLCJ0aHJlZXBpZHMiLCJjdXJyZW50U2VydmVyUmVhY2hhYmxlIiwiUHJvbWlzZSIsInJlamVjdCIsIkVycm9yIiwid2FybiIsImJvdW5kVGhyZWVwaWRzIiwiZmlsdGVyIiwidHAiLCJib3VuZCIsIm1lc3NhZ2UiLCJkYW5nZXIiLCJtZXNzYWdlRWxlbWVudHMiLCJiIiwibGVuZ3RoIiwiY2FuY2VsQnV0dG9uIiwicmVuZGVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsIkZpZWxkIiwiaWRTZXJ2ZXJVcmwiLCJzZWN0aW9uVGl0bGUiLCJib2R5VGV4dCIsInNlcnZlciIsInByb3BzIiwibWlzc2luZ1Rlcm1zIiwiZGlzY29TZWN0aW9uIiwiZGlzY29CdXR0b25Db250ZW50IiwiZGlzY29Cb2R5VGV4dCIsIl9vbkRpc2Nvbm5lY3RDbGlja2VkIiwiX2NoZWNrSWRTZXJ2ZXIiLCJfb25JZGVudGl0eVNlcnZlckNoYW5nZWQiLCJfZ2V0VG9vbHRpcCIsIl9pZFNlcnZlckNoYW5nZUVuYWJsZWQiLCJQcm9wVHlwZXMiLCJib29sIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTVCQTs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBO0FBQ0EsTUFBTUEsb0JBQW9CLEdBQUcsS0FBN0IsQyxDQUFvQzs7QUFFcEM7Ozs7Ozs7QUFNQSxlQUFlQyxzQkFBZixDQUFzQ0MsQ0FBdEMsRUFBeUM7QUFDckMsUUFBTUMsU0FBUyxHQUFHQyxhQUFJQyxLQUFKLENBQVVILENBQVYsQ0FBbEI7O0FBRUEsTUFBSUMsU0FBUyxDQUFDRyxRQUFWLEtBQXVCLFFBQTNCLEVBQXFDLE9BQU8seUJBQUcsbUNBQUgs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QUhULEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0IHsgZ2V0VGhyZWVwaWRzV2l0aEJpbmRTdGF0dXMgfSBmcm9tICcuLi8uLi8uLi9ib3VuZFRocmVlcGlkcyc7XG5pbXBvcnQgSWRlbnRpdHlBdXRoQ2xpZW50IGZyb20gXCIuLi8uLi8uLi9JZGVudGl0eUF1dGhDbGllbnRcIjtcbmltcG9ydCB7YWJicmV2aWF0ZVVybCwgdW5hYmJyZXZpYXRlVXJsfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvVXJsVXRpbHNcIjtcbmltcG9ydCB7IGdldERlZmF1bHRJZGVudGl0eVNlcnZlclVybCwgZG9lc0lkZW50aXR5U2VydmVySGF2ZVRlcm1zIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvSWRlbnRpdHlTZXJ2ZXJVdGlscyc7XG5pbXBvcnQge3RpbWVvdXR9IGZyb20gXCIuLi8uLi8uLi91dGlscy9wcm9taXNlXCI7XG5cbi8vIFdlJ2xsIHdhaXQgdXAgdG8gdGhpcyBsb25nIHdoZW4gY2hlY2tpbmcgZm9yIDNQSUQgYmluZGluZ3Mgb24gdGhlIElTLlxuY29uc3QgUkVBQ0hBQklMSVRZX1RJTUVPVVQgPSAxMDAwMDsgLy8gbXNcblxuLyoqXG4gKiBDaGVjayBhbiBJUyBVUkwgaXMgdmFsaWQsIGluY2x1ZGluZyBsaXZlbmVzcyBjaGVja1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1IFRoZSB1cmwgdG8gY2hlY2tcbiAqIEByZXR1cm5zIHtzdHJpbmd9IG51bGwgaWYgdXJsIHBhc3NlcyBhbGwgY2hlY2tzLCBvdGhlcndpc2UgaTE4bmVkIGVycm9yIHN0cmluZ1xuICovXG5hc3luYyBmdW5jdGlvbiBjaGVja0lkZW50aXR5U2VydmVyVXJsKHUpIHtcbiAgICBjb25zdCBwYXJzZWRVcmwgPSB1cmwucGFyc2UodSk7XG5cbiAgICBpZiAocGFyc2VkVXJsLnByb3RvY29sICE9PSAnaHR0cHM6JykgcmV0dXJuIF90KFwiSWRlbnRpdHkgU2VydmVyIFVSTCBtdXN0IGJlIEhUVFBTXCIpO1xuXG4gICAgLy8gWFhYOiBkdXBsaWNhdGVkIGxvZ2ljIGZyb20ganMtc2RrIGJ1dCBpdCdzIHF1aXRlIHRpZWQgdXAgaW4gdGhlIHZhbGlkYXRpb24gbG9naWMgaW4gdGhlXG4gICAgLy8ganMtc2RrIHNvIHByb2JhYmx5IGFzIGVhc3kgdG8gZHVwbGljYXRlIGl0IHRoYW4gdG8gc2VwYXJhdGUgaXQgb3V0IHNvIHdlIGNhbiByZXVzZSBpdFxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godSArICcvX21hdHJpeC9pZGVudGl0eS9hcGkvdjEnKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiTm90IGEgdmFsaWQgSWRlbnRpdHkgU2VydmVyIChzdGF0dXMgY29kZSAlKGNvZGUpcylcIiwge2NvZGU6IHJlc3BvbnNlLnN0YXR1c30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiQ291bGQgbm90IGNvbm5lY3QgdG8gSWRlbnRpdHkgU2VydmVyXCIpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gX3QoXCJDb3VsZCBub3QgY29ubmVjdCB0byBJZGVudGl0eSBTZXJ2ZXJcIik7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXRJZFNlcnZlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gV2hldGhlciBvciBub3QgdGhlIElEIHNlcnZlciBpcyBtaXNzaW5nIHRlcm1zLiBUaGlzIGFmZmVjdHMgdGhlIHRleHRcbiAgICAgICAgLy8gc2hvd24gdG8gdGhlIHVzZXIuXG4gICAgICAgIG1pc3NpbmdUZXJtczogUHJvcFR5cGVzLmJvb2wsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGxldCBkZWZhdWx0SWRTZXJ2ZXIgPSAnJztcbiAgICAgICAgaWYgKCFNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKSAmJiBnZXREZWZhdWx0SWRlbnRpdHlTZXJ2ZXJVcmwoKSkge1xuICAgICAgICAgICAgLy8gSWYgbm8gSUQgc2VydmVyIGlzIGNvbmZpZ3VyZWQgYnV0IHRoZXJlJ3Mgb25lIGluIHRoZSBjb25maWcsIHByZXBvcHVsYXRlXG4gICAgICAgICAgICAvLyB0aGUgZmllbGQgdG8gaGVscCB0aGUgdXNlci5cbiAgICAgICAgICAgIGRlZmF1bHRJZFNlcnZlciA9IGFiYnJldmlhdGVVcmwoZ2V0RGVmYXVsdElkZW50aXR5U2VydmVyVXJsKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGRlZmF1bHRJZFNlcnZlcixcbiAgICAgICAgICAgIGN1cnJlbnRDbGllbnRJZFNlcnZlcjogTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCksXG4gICAgICAgICAgICBpZFNlcnZlcjogXCJcIixcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICBkaXNjb25uZWN0QnVzeTogZmFsc2UsXG4gICAgICAgICAgICBjaGVja2luZzogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICB9XG5cbiAgICBvbkFjdGlvbiA9IChwYXlsb2FkKSA9PiB7XG4gICAgICAgIC8vIFdlIHJlYWN0IHRvIGNoYW5nZXMgaW4gdGhlIElEIHNlcnZlciBpbiB0aGUgZXZlbnQgdGhlIHVzZXIgaXMgc3RhcmluZyBhdCB0aGlzIGZvcm1cbiAgICAgICAgLy8gd2hlbiBjaGFuZ2luZyB0aGVpciBpZGVudGl0eSBzZXJ2ZXIgb24gYW5vdGhlciBkZXZpY2UuXG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiAhPT0gXCJpZF9zZXJ2ZXJfY2hhbmdlZFwiKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjdXJyZW50Q2xpZW50SWRTZXJ2ZXI6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uSWRlbnRpdHlTZXJ2ZXJDaGFuZ2VkID0gKGV2KSA9PiB7XG4gICAgICAgIGNvbnN0IHUgPSBldi50YXJnZXQudmFsdWU7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aWRTZXJ2ZXI6IHV9KTtcbiAgICB9O1xuXG4gICAgX2dldFRvb2x0aXAgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNoZWNraW5nKSB7XG4gICAgICAgICAgICBjb25zdCBJbmxpbmVTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuSW5saW5lU3Bpbm5lcicpO1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAgPElubGluZVNwaW5uZXIgLz5cbiAgICAgICAgICAgICAgICB7IF90KFwiQ2hlY2tpbmcgc2VydmVyXCIpIH1cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPSd3YXJuaW5nJz57dGhpcy5zdGF0ZS5lcnJvcn08L3NwYW4+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX2lkU2VydmVyQ2hhbmdlRW5hYmxlZCA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zdGF0ZS5pZFNlcnZlciAmJiAhdGhpcy5zdGF0ZS5idXN5O1xuICAgIH07XG5cbiAgICBfc2F2ZUlkU2VydmVyID0gKGZ1bGxVcmwpID0+IHtcbiAgICAgICAgLy8gQWNjb3VudCBkYXRhIGNoYW5nZSB3aWxsIHVwZGF0ZSBsb2NhbHN0b3JhZ2UsIGNsaWVudCwgZXRjIHRocm91Z2ggZGlzcGF0Y2hlclxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2V0QWNjb3VudERhdGEoXCJtLmlkZW50aXR5X3NlcnZlclwiLCB7XG4gICAgICAgICAgICBiYXNlX3VybDogZnVsbFVybCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIGN1cnJlbnRDbGllbnRJZFNlcnZlcjogZnVsbFVybCxcbiAgICAgICAgICAgIGlkU2VydmVyOiAnJyxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9jaGVja0lkU2VydmVyID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB7IGlkU2VydmVyLCBjdXJyZW50Q2xpZW50SWRTZXJ2ZXIgfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogdHJ1ZSwgY2hlY2tpbmc6IHRydWUsIGVycm9yOiBudWxsfSk7XG5cbiAgICAgICAgY29uc3QgZnVsbFVybCA9IHVuYWJicmV2aWF0ZVVybChpZFNlcnZlcik7XG5cbiAgICAgICAgbGV0IGVyclN0ciA9IGF3YWl0IGNoZWNrSWRlbnRpdHlTZXJ2ZXJVcmwoZnVsbFVybCk7XG4gICAgICAgIGlmICghZXJyU3RyKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NoZWNraW5nOiBmYWxzZX0pOyAvLyBjbGVhciB0b29sdGlwXG5cbiAgICAgICAgICAgICAgICAvLyBUZXN0IHRoZSBpZGVudGl0eSBzZXJ2ZXIgYnkgdHJ5aW5nIHRvIHJlZ2lzdGVyIHdpdGggaXQuIFRoaXNcbiAgICAgICAgICAgICAgICAvLyBtYXkgcmVzdWx0IGluIGEgdGVybXMgb2Ygc2VydmljZSBwcm9tcHQuXG4gICAgICAgICAgICAgICAgY29uc3QgYXV0aENsaWVudCA9IG5ldyBJZGVudGl0eUF1dGhDbGllbnQoZnVsbFVybCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgYXV0aENsaWVudC5nZXRBY2Nlc3NUb2tlbigpO1xuXG4gICAgICAgICAgICAgICAgbGV0IHNhdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgLy8gRG91YmxlIGNoZWNrIHRoYXQgdGhlIGlkZW50aXR5IHNlcnZlciBldmVuIGhhcyB0ZXJtcyBvZiBzZXJ2aWNlLlxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1Rlcm1zID0gYXdhaXQgZG9lc0lkZW50aXR5U2VydmVySGF2ZVRlcm1zKGZ1bGxVcmwpO1xuICAgICAgICAgICAgICAgIGlmICghaGFzVGVybXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW2NvbmZpcm1lZF0gPSBhd2FpdCB0aGlzLl9zaG93Tm9UZXJtc1dhcm5pbmcoZnVsbFVybCk7XG4gICAgICAgICAgICAgICAgICAgIHNhdmUgPSBjb25maXJtZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU2hvdyBhIGdlbmVyYWwgd2FybmluZywgcG9zc2libHkgd2l0aCBkZXRhaWxzIGFib3V0IGFueSBib3VuZFxuICAgICAgICAgICAgICAgIC8vIDNQSURzIHRoYXQgd291bGQgYmUgbGVmdCBiZWhpbmQuXG4gICAgICAgICAgICAgICAgaWYgKHNhdmUgJiYgY3VycmVudENsaWVudElkU2VydmVyICYmIGZ1bGxVcmwgIT09IGN1cnJlbnRDbGllbnRJZFNlcnZlcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbY29uZmlybWVkXSA9IGF3YWl0IHRoaXMuX3Nob3dTZXJ2ZXJDaGFuZ2VXYXJuaW5nKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkNoYW5nZSBpZGVudGl0eSBzZXJ2ZXJcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmJvdW5kTWVzc2FnZTogX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJEaXNjb25uZWN0IGZyb20gdGhlIGlkZW50aXR5IHNlcnZlciA8Y3VycmVudCAvPiBhbmQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29ubmVjdCB0byA8bmV3IC8+IGluc3RlYWQ/XCIsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogc3ViID0+IDxiPnthYmJyZXZpYXRlVXJsKGN1cnJlbnRDbGllbnRJZFNlcnZlcil9PC9iPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3OiBzdWIgPT4gPGI+e2FiYnJldmlhdGVVcmwoaWRTZXJ2ZXIpfTwvYj4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b246IF90KFwiQ29udGludWVcIiksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYXZlID0gY29uZmlybWVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzYXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NhdmVJZFNlcnZlcihmdWxsVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICBlcnJTdHIgPSBfdChcIlRlcm1zIG9mIHNlcnZpY2Ugbm90IGFjY2VwdGVkIG9yIHRoZSBpZGVudGl0eSBzZXJ2ZXIgaXMgaW52YWxpZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIGNoZWNraW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJTdHIsXG4gICAgICAgICAgICBjdXJyZW50Q2xpZW50SWRTZXJ2ZXI6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX3Nob3dOb1Rlcm1zV2FybmluZyhmdWxsVXJsKSB7XG4gICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IHsgZmluaXNoZWQgfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ05vIFRlcm1zIFdhcm5pbmcnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdChcIklkZW50aXR5IHNlcnZlciBoYXMgbm8gdGVybXMgb2Ygc2VydmljZVwiKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiVGhlIGlkZW50aXR5IHNlcnZlciB5b3UgaGF2ZSBjaG9zZW4gZG9lcyBub3QgaGF2ZSBhbnkgdGVybXMgb2Ygc2VydmljZS5cIil9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAmbmJzcDt7X3QoXCJPbmx5IGNvbnRpbnVlIGlmIHlvdSB0cnVzdCB0aGUgb3duZXIgb2YgdGhlIHNlcnZlci5cIil9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBidXR0b246IF90KFwiQ29udGludWVcIiksXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmluaXNoZWQ7XG4gICAgfVxuXG4gICAgX29uRGlzY29ubmVjdENsaWNrZWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2Rpc2Nvbm5lY3RCdXN5OiB0cnVlfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbY29uZmlybWVkXSA9IGF3YWl0IHRoaXMuX3Nob3dTZXJ2ZXJDaGFuZ2VXYXJuaW5nKHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJEaXNjb25uZWN0IGlkZW50aXR5IHNlcnZlclwiKSxcbiAgICAgICAgICAgICAgICB1bmJvdW5kTWVzc2FnZTogX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRGlzY29ubmVjdCBmcm9tIHRoZSBpZGVudGl0eSBzZXJ2ZXIgPGlkc2VydmVyIC8+P1wiLCB7fSxcbiAgICAgICAgICAgICAgICAgICAge2lkc2VydmVyOiBzdWIgPT4gPGI+e2FiYnJldmlhdGVVcmwodGhpcy5zdGF0ZS5jdXJyZW50Q2xpZW50SWRTZXJ2ZXIpfTwvYj59LFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgYnV0dG9uOiBfdChcIkRpc2Nvbm5lY3RcIiksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNjb25uZWN0SWRTZXJ2ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2Rpc2Nvbm5lY3RCdXN5OiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jIF9zaG93U2VydmVyQ2hhbmdlV2FybmluZyh7IHRpdGxlLCB1bmJvdW5kTWVzc2FnZSwgYnV0dG9uIH0pIHtcbiAgICAgICAgY29uc3QgeyBjdXJyZW50Q2xpZW50SWRTZXJ2ZXIgfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgbGV0IHRocmVlcGlkcyA9IFtdO1xuICAgICAgICBsZXQgY3VycmVudFNlcnZlclJlYWNoYWJsZSA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJlZXBpZHMgPSBhd2FpdCB0aW1lb3V0KFxuICAgICAgICAgICAgICAgIGdldFRocmVlcGlkc1dpdGhCaW5kU3RhdHVzKE1hdHJpeENsaWVudFBlZy5nZXQoKSksXG4gICAgICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiVGltZW91dCBhdHRlbXB0aW5nIHRvIHJlYWNoIGlkZW50aXR5IHNlcnZlclwiKSksXG4gICAgICAgICAgICAgICAgUkVBQ0hBQklMSVRZX1RJTUVPVVQsXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjdXJyZW50U2VydmVyUmVhY2hhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgYFVuYWJsZSB0byByZWFjaCBpZGVudGl0eSBzZXJ2ZXIgYXQgJHtjdXJyZW50Q2xpZW50SWRTZXJ2ZXJ9IHRvIGNoZWNrIGAgK1xuICAgICAgICAgICAgICAgIGBmb3IgM1BJRHMgZHVyaW5nIElTIGNoYW5nZSBmbG93YCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYm91bmRUaHJlZXBpZHMgPSB0aHJlZXBpZHMuZmlsdGVyKHRwID0+IHRwLmJvdW5kKTtcbiAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgIGxldCBkYW5nZXIgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgbWVzc2FnZUVsZW1lbnRzID0ge1xuICAgICAgICAgICAgaWRzZXJ2ZXI6IHN1YiA9PiA8Yj57YWJicmV2aWF0ZVVybChjdXJyZW50Q2xpZW50SWRTZXJ2ZXIpfTwvYj4sXG4gICAgICAgICAgICBiOiBzdWIgPT4gPGI+e3N1Yn08L2I+LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWN1cnJlbnRTZXJ2ZXJSZWFjaGFibGUpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJZb3Ugc2hvdWxkIDxiPnJlbW92ZSB5b3VyIHBlcnNvbmFsIGRhdGE8L2I+IGZyb20gaWRlbnRpdHkgc2VydmVyIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8aWRzZXJ2ZXIgLz4gYmVmb3JlIGRpc2Nvbm5lY3RpbmcuIFVuZm9ydHVuYXRlbHksIGlkZW50aXR5IHNlcnZlciBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPGlkc2VydmVyIC8+IGlzIGN1cnJlbnRseSBvZmZsaW5lIG9yIGNhbm5vdCBiZSByZWFjaGVkLlwiLFxuICAgICAgICAgICAgICAgICAgICB7fSwgbWVzc2FnZUVsZW1lbnRzLFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcIllvdSBzaG91bGQ6XCIpfTwvcD5cbiAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrIHlvdXIgYnJvd3NlciBwbHVnaW5zIGZvciBhbnl0aGluZyB0aGF0IG1pZ2h0IGJsb2NrIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGhlIGlkZW50aXR5IHNlcnZlciAoc3VjaCBhcyBQcml2YWN5IEJhZGdlcilcIixcbiAgICAgICAgICAgICAgICAgICAgKX08L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+e190KFwiY29udGFjdCB0aGUgYWRtaW5pc3RyYXRvcnMgb2YgaWRlbnRpdHkgc2VydmVyIDxpZHNlcnZlciAvPlwiLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRzZXJ2ZXI6IG1lc3NhZ2VFbGVtZW50cy5pZHNlcnZlcixcbiAgICAgICAgICAgICAgICAgICAgfSl9PC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPntfdChcIndhaXQgYW5kIHRyeSBhZ2FpbiBsYXRlclwiKX08L2xpPlxuICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICBkYW5nZXIgPSB0cnVlO1xuICAgICAgICAgICAgYnV0dG9uID0gX3QoXCJEaXNjb25uZWN0IGFueXdheVwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChib3VuZFRocmVlcGlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJZb3UgYXJlIHN0aWxsIDxiPnNoYXJpbmcgeW91ciBwZXJzb25hbCBkYXRhPC9iPiBvbiB0aGUgaWRlbnRpdHkgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInNlcnZlciA8aWRzZXJ2ZXIgLz4uXCIsIHt9LCBtZXNzYWdlRWxlbWVudHMsXG4gICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICBcIldlIHJlY29tbWVuZCB0aGF0IHlvdSByZW1vdmUgeW91ciBlbWFpbCBhZGRyZXNzZXMgYW5kIHBob25lIG51bWJlcnMgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImZyb20gdGhlIGlkZW50aXR5IHNlcnZlciBiZWZvcmUgZGlzY29ubmVjdGluZy5cIixcbiAgICAgICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIGRhbmdlciA9IHRydWU7XG4gICAgICAgICAgICBidXR0b24gPSBfdChcIkRpc2Nvbm5lY3QgYW55d2F5XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSA9IHVuYm91bmRNZXNzYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3QgeyBmaW5pc2hlZCB9ID0gTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnSWRlbnRpdHkgU2VydmVyIEJvdW5kIFdhcm5pbmcnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1lc3NhZ2UsXG4gICAgICAgICAgICBidXR0b24sXG4gICAgICAgICAgICBjYW5jZWxCdXR0b246IF90KFwiR28gYmFja1wiKSxcbiAgICAgICAgICAgIGRhbmdlcixcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmaW5pc2hlZDtcbiAgICB9XG5cbiAgICBfZGlzY29ubmVjdElkU2VydmVyID0gKCkgPT4ge1xuICAgICAgICAvLyBBY2NvdW50IGRhdGEgY2hhbmdlIHdpbGwgdXBkYXRlIGxvY2Fsc3RvcmFnZSwgY2xpZW50LCBldGMgdGhyb3VnaCBkaXNwYXRjaGVyXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRBY2NvdW50RGF0YShcIm0uaWRlbnRpdHlfc2VydmVyXCIsIHtcbiAgICAgICAgICAgIGJhc2VfdXJsOiBudWxsLCAvLyBjbGVhclxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgbmV3RmllbGRWYWwgPSAnJztcbiAgICAgICAgaWYgKGdldERlZmF1bHRJZGVudGl0eVNlcnZlclVybCgpKSB7XG4gICAgICAgICAgICAvLyBQcmVwb3B1bGF0ZSB0aGUgY2xpZW50J3MgZGVmYXVsdCBzbyB0aGUgdXNlciBhdCBsZWFzdCBoYXMgc29tZSBpZGVhIG9mXG4gICAgICAgICAgICAvLyBhIHZhbGlkIHZhbHVlIHRoZXkgbWlnaHQgZW50ZXJcbiAgICAgICAgICAgIG5ld0ZpZWxkVmFsID0gYWJicmV2aWF0ZVVybChnZXREZWZhdWx0SWRlbnRpdHlTZXJ2ZXJVcmwoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICBjdXJyZW50Q2xpZW50SWRTZXJ2ZXI6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpLFxuICAgICAgICAgICAgaWRTZXJ2ZXI6IG5ld0ZpZWxkVmFsLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIGNvbnN0IGlkU2VydmVyVXJsID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2xpZW50SWRTZXJ2ZXI7XG4gICAgICAgIGxldCBzZWN0aW9uVGl0bGU7XG4gICAgICAgIGxldCBib2R5VGV4dDtcbiAgICAgICAgaWYgKGlkU2VydmVyVXJsKSB7XG4gICAgICAgICAgICBzZWN0aW9uVGl0bGUgPSBfdChcIklkZW50aXR5IFNlcnZlciAoJShzZXJ2ZXIpcylcIiwgeyBzZXJ2ZXI6IGFiYnJldmlhdGVVcmwoaWRTZXJ2ZXJVcmwpIH0pO1xuICAgICAgICAgICAgYm9keVRleHQgPSBfdChcbiAgICAgICAgICAgICAgICBcIllvdSBhcmUgY3VycmVudGx5IHVzaW5nIDxzZXJ2ZXI+PC9zZXJ2ZXI+IHRvIGRpc2NvdmVyIGFuZCBiZSBkaXNjb3ZlcmFibGUgYnkgXCIgK1xuICAgICAgICAgICAgICAgIFwiZXhpc3RpbmcgY29udGFjdHMgeW91IGtub3cuIFlvdSBjYW4gY2hhbmdlIHlvdXIgaWRlbnRpdHkgc2VydmVyIGJlbG93LlwiLFxuICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgIHsgc2VydmVyOiBzdWIgPT4gPGI+e2FiYnJldmlhdGVVcmwoaWRTZXJ2ZXJVcmwpfTwvYj4gfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5taXNzaW5nVGVybXMpIHtcbiAgICAgICAgICAgICAgICBib2R5VGV4dCA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSBkb24ndCB3YW50IHRvIHVzZSA8c2VydmVyIC8+IHRvIGRpc2NvdmVyIGFuZCBiZSBkaXNjb3ZlcmFibGUgYnkgZXhpc3RpbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImNvbnRhY3RzIHlvdSBrbm93LCBlbnRlciBhbm90aGVyIGlkZW50aXR5IHNlcnZlciBiZWxvdy5cIixcbiAgICAgICAgICAgICAgICAgICAge30sIHtzZXJ2ZXI6IHN1YiA9PiA8Yj57YWJicmV2aWF0ZVVybChpZFNlcnZlclVybCl9PC9iPn0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlY3Rpb25UaXRsZSA9IF90KFwiSWRlbnRpdHkgU2VydmVyXCIpO1xuICAgICAgICAgICAgYm9keVRleHQgPSBfdChcbiAgICAgICAgICAgICAgICBcIllvdSBhcmUgbm90IGN1cnJlbnRseSB1c2luZyBhbiBpZGVudGl0eSBzZXJ2ZXIuIFwiICtcbiAgICAgICAgICAgICAgICBcIlRvIGRpc2NvdmVyIGFuZCBiZSBkaXNjb3ZlcmFibGUgYnkgZXhpc3RpbmcgY29udGFjdHMgeW91IGtub3csIFwiICtcbiAgICAgICAgICAgICAgICBcImFkZCBvbmUgYmVsb3cuXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRpc2NvU2VjdGlvbjtcbiAgICAgICAgaWYgKGlkU2VydmVyVXJsKSB7XG4gICAgICAgICAgICBsZXQgZGlzY29CdXR0b25Db250ZW50ID0gX3QoXCJEaXNjb25uZWN0XCIpO1xuICAgICAgICAgICAgbGV0IGRpc2NvQm9keVRleHQgPSBfdChcbiAgICAgICAgICAgICAgICBcIkRpc2Nvbm5lY3RpbmcgZnJvbSB5b3VyIGlkZW50aXR5IHNlcnZlciB3aWxsIG1lYW4geW91IFwiICtcbiAgICAgICAgICAgICAgICBcIndvbid0IGJlIGRpc2NvdmVyYWJsZSBieSBvdGhlciB1c2VycyBhbmQgeW91IHdvbid0IGJlIFwiICtcbiAgICAgICAgICAgICAgICBcImFibGUgdG8gaW52aXRlIG90aGVycyBieSBlbWFpbCBvciBwaG9uZS5cIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5taXNzaW5nVGVybXMpIHtcbiAgICAgICAgICAgICAgICBkaXNjb0JvZHlUZXh0ID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVXNpbmcgYW4gaWRlbnRpdHkgc2VydmVyIGlzIG9wdGlvbmFsLiBJZiB5b3UgY2hvb3NlIG5vdCB0byBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwidXNlIGFuIGlkZW50aXR5IHNlcnZlciwgeW91IHdvbid0IGJlIGRpc2NvdmVyYWJsZSBieSBvdGhlciB1c2VycyBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiYW5kIHlvdSB3b24ndCBiZSBhYmxlIHRvIGludml0ZSBvdGhlcnMgYnkgZW1haWwgb3IgcGhvbmUuXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBkaXNjb0J1dHRvbkNvbnRlbnQgPSBfdChcIkRvIG5vdCB1c2UgYW4gaWRlbnRpdHkgc2VydmVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlzY29ubmVjdEJ1c3kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBJbmxpbmVTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuSW5saW5lU3Bpbm5lcicpO1xuICAgICAgICAgICAgICAgIGRpc2NvQnV0dG9uQ29udGVudCA9IDxJbmxpbmVTcGlubmVyIC8+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzY29TZWN0aW9uID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dFwiPntkaXNjb0JvZHlUZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkRpc2Nvbm5lY3RDbGlja2VkfSBraW5kPVwiZGFuZ2VyX3NtXCI+XG4gICAgICAgICAgICAgICAgICAgIHtkaXNjb0J1dHRvbkNvbnRlbnR9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3NlY3Rpb24gbXhfU2V0SWRTZXJ2ZXJcIiBvblN1Ym1pdD17dGhpcy5fY2hlY2tJZFNlcnZlcn0+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZ1wiPlxuICAgICAgICAgICAgICAgICAgICB7c2VjdGlvblRpdGxlfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7Ym9keVRleHR9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJFbnRlciBhIG5ldyBpZGVudGl0eSBzZXJ2ZXJcIil9XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3RoaXMuc3RhdGUuZGVmYXVsdElkU2VydmVyfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5pZFNlcnZlcn1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uSWRlbnRpdHlTZXJ2ZXJDaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwQ29udGVudD17dGhpcy5fZ2V0VG9vbHRpcCgpfVxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwQ2xhc3NOYW1lPVwibXhfU2V0SWRTZXJ2ZXJfdG9vbHRpcFwiXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmJ1c3l9XG4gICAgICAgICAgICAgICAgICAgIGZsYWdJbnZhbGlkPXshIXRoaXMuc3RhdGUuZXJyb3J9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiB0eXBlPVwic3VibWl0XCIga2luZD1cInByaW1hcnlfc21cIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9jaGVja0lkU2VydmVyfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXRoaXMuX2lkU2VydmVyQ2hhbmdlRW5hYmxlZCgpfVxuICAgICAgICAgICAgICAgID57X3QoXCJDaGFuZ2VcIil9PC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIHtkaXNjb1NlY3Rpb259XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19