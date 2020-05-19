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

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _AutoDiscoveryUtils = _interopRequireWildcard(require("../../../utils/AutoDiscoveryUtils"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _matrix = require("matrix-js-sdk/src/matrix");

var _classnames = _interopRequireDefault(require("classnames"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 New Vector Ltd
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

/*
 * A pure UI component which displays the HS and IS to use.
 */
class ServerConfig extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onHomeserverBlur", ev => {
      this._hsTimeoutId = this._waitThenInvoke(this._hsTimeoutId, () => {
        this.validateServer();
      });
    });
    (0, _defineProperty2.default)(this, "onHomeserverChange", ev => {
      const hsUrl = ev.target.value;
      this.setState({
        hsUrl
      });
    });
    (0, _defineProperty2.default)(this, "onIdentityServerBlur", ev => {
      this._isTimeoutId = this._waitThenInvoke(this._isTimeoutId, () => {
        this.validateServer();
      });
    });
    (0, _defineProperty2.default)(this, "onIdentityServerChange", ev => {
      const isUrl = ev.target.value;
      this.setState({
        isUrl
      });
    });
    (0, _defineProperty2.default)(this, "onSubmit", async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const result = await this.validateServer();
      if (!result) return; // Do not continue.

      if (this.props.onAfterSubmit) {
        this.props.onAfterSubmit();
      }
    });
    (0, _defineProperty2.default)(this, "showHelpPopup", () => {
      const CustomServerDialog = sdk.getComponent('auth.CustomServerDialog');

      _Modal.default.createTrackedDialog('Custom Server Dialog', '', CustomServerDialog);
    });
    this.state = {
      busy: false,
      errorText: "",
      hsUrl: props.serverConfig.hsUrl,
      isUrl: props.serverConfig.isUrl,
      showIdentityServer: false
    };
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(newProps) {
    // eslint-disable-line camelcase
    if (newProps.serverConfig.hsUrl === this.state.hsUrl && newProps.serverConfig.isUrl === this.state.isUrl) return;
    this.validateAndApplyServer(newProps.serverConfig.hsUrl, newProps.serverConfig.isUrl);
  }

  async validateServer() {
    // TODO: Do we want to support .well-known lookups here?
    // If for some reason someone enters "matrix.org" for a URL, we could do a lookup to
    // find their homeserver without demanding they use "https://matrix.org"
    const result = this.validateAndApplyServer(this.state.hsUrl, this.state.isUrl);

    if (!result) {
      return result;
    } // If the UI flow this component is embedded in requires an identity
    // server when the homeserver says it will need one, check first and
    // reveal this field if not already shown.
    // XXX: This a backward compatibility path for homeservers that require
    // an identity server to be passed during certain flows.
    // See also https://github.com/matrix-org/synapse/pull/5868.


    if (this.props.showIdentityServerIfRequiredByHomeserver && !this.state.showIdentityServer && (await this.isIdentityServerRequiredByHomeserver())) {
      this.setState({
        showIdentityServer: true
      });
      return null;
    }

    return result;
  }

  async validateAndApplyServer(hsUrl, isUrl) {
    // Always try and use the defaults first
    const defaultConfig
    /*: ValidatedServerConfig*/
    = _SdkConfig.default.get()["validated_server_config"];

    if (defaultConfig.hsUrl === hsUrl && defaultConfig.isUrl === isUrl) {
      this.setState({
        hsUrl: defaultConfig.hsUrl,
        isUrl: defaultConfig.isUrl,
        busy: false,
        errorText: ""
      });
      this.props.onServerConfigChange(defaultConfig);
      return defaultConfig;
    }

    this.setState({
      hsUrl,
      isUrl,
      busy: true,
      errorText: ""
    });

    try {
      const result = await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(hsUrl, isUrl);
      this.setState({
        busy: false,
        errorText: ""
      });
      this.props.onServerConfigChange(result);
      return result;
    } catch (e) {
      console.error(e);

      const stateForError = _AutoDiscoveryUtils.default.authComponentStateForError(e);

      if (!stateForError.isFatalError) {
        this.setState({
          busy: false
        }); // carry on anyway

        const result = await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(hsUrl, isUrl, true);
        this.props.onServerConfigChange(result);
        return result;
      } else {
        let message = (0, _languageHandler._t)("Unable to validate homeserver/identity server");

        if (e.translatedMessage) {
          message = e.translatedMessage;
        }

        this.setState({
          busy: false,
          errorText: message
        });
        return null;
      }
    }
  }

  async isIdentityServerRequiredByHomeserver() {
    // XXX: We shouldn't have to create a whole new MatrixClient just to
    // check if the homeserver requires an identity server... Should it be
    // extracted to a static utils function...?
    return (0, _matrix.createClient)({
      baseUrl: this.state.hsUrl
    }).doesServerRequireIdServerParam();
  }

  _waitThenInvoke(existingTimeoutId, fn) {
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
    }

    return setTimeout(fn.bind(this), this.props.delayTimeMs);
  }

  _renderHomeserverSection() {
    const Field = sdk.getComponent('elements.Field');
    return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Enter your custom homeserver URL <a>What does this mean?</a>", {}, {
      a: sub => /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_ServerConfig_help",
        href: "#",
        onClick: this.showHelpPopup
      }, sub)
    }), /*#__PURE__*/_react.default.createElement(Field, {
      id: "mx_ServerConfig_hsUrl",
      label: (0, _languageHandler._t)("Homeserver URL"),
      placeholder: this.props.serverConfig.hsUrl,
      value: this.state.hsUrl,
      onBlur: this.onHomeserverBlur,
      onChange: this.onHomeserverChange,
      disabled: this.state.busy
    }));
  }

  _renderIdentityServerSection() {
    const Field = sdk.getComponent('elements.Field');
    const classes = (0, _classnames.default)({
      "mx_ServerConfig_identityServer": true,
      "mx_ServerConfig_identityServer_shown": this.state.showIdentityServer
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, (0, _languageHandler._t)("Enter your custom identity server URL <a>What does this mean?</a>", {}, {
      a: sub => /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_ServerConfig_help",
        href: "#",
        onClick: this.showHelpPopup
      }, sub)
    }), /*#__PURE__*/_react.default.createElement(Field, {
      label: (0, _languageHandler._t)("Identity Server URL"),
      placeholder: this.props.serverConfig.isUrl,
      value: this.state.isUrl || '',
      onBlur: this.onIdentityServerBlur,
      onChange: this.onIdentityServerChange,
      disabled: this.state.busy
    }));
  }

  render() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const errorText = this.state.errorText ? /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ServerConfig_error"
    }, this.state.errorText) : null;
    const submitButton = this.props.submitText ? /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      element: "button",
      type: "submit",
      className: this.props.submitClass,
      onClick: this.onSubmit,
      disabled: this.state.busy
    }, this.props.submitText) : null;
    return /*#__PURE__*/_react.default.createElement("form", {
      className: "mx_ServerConfig",
      onSubmit: this.onSubmit,
      autoComplete: "off"
    }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Other servers")), errorText, this._renderHomeserverSection(), this._renderIdentityServerSection(), submitButton);
  }

}

exports.default = ServerConfig;
(0, _defineProperty2.default)(ServerConfig, "propTypes", {
  onServerConfigChange: _propTypes.default.func.isRequired,
  // The current configuration that the user is expecting to change.
  serverConfig: _propTypes.default.instanceOf(_AutoDiscoveryUtils.ValidatedServerConfig).isRequired,
  delayTimeMs: _propTypes.default.number,
  // time to wait before invoking onChanged
  // Called after the component calls onServerConfigChange
  onAfterSubmit: _propTypes.default.func,
  // Optional text for the submit button. If falsey, no button will be shown.
  submitText: _propTypes.default.string,
  // Optional class for the submit button. Only applies if the submit button
  // is to be rendered.
  submitClass: _propTypes.default.string,
  // Whether the flow this component is embedded in requires an identity
  // server when the homeserver says it will need one. Default false.
  showIdentityServerIfRequiredByHomeserver: _propTypes.default.bool
});
(0, _defineProperty2.default)(ServerConfig, "defaultProps", {
  onServerConfigChange: function () {},
  delayTimeMs: 0
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvU2VydmVyQ29uZmlnLmpzIl0sIm5hbWVzIjpbIlNlcnZlckNvbmZpZyIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJldiIsIl9oc1RpbWVvdXRJZCIsIl93YWl0VGhlbkludm9rZSIsInZhbGlkYXRlU2VydmVyIiwiaHNVcmwiLCJ0YXJnZXQiLCJ2YWx1ZSIsInNldFN0YXRlIiwiX2lzVGltZW91dElkIiwiaXNVcmwiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsInJlc3VsdCIsIm9uQWZ0ZXJTdWJtaXQiLCJDdXN0b21TZXJ2ZXJEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJzdGF0ZSIsImJ1c3kiLCJlcnJvclRleHQiLCJzZXJ2ZXJDb25maWciLCJzaG93SWRlbnRpdHlTZXJ2ZXIiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5ld1Byb3BzIiwidmFsaWRhdGVBbmRBcHBseVNlcnZlciIsInNob3dJZGVudGl0eVNlcnZlcklmUmVxdWlyZWRCeUhvbWVzZXJ2ZXIiLCJpc0lkZW50aXR5U2VydmVyUmVxdWlyZWRCeUhvbWVzZXJ2ZXIiLCJkZWZhdWx0Q29uZmlnIiwiU2RrQ29uZmlnIiwiZ2V0Iiwib25TZXJ2ZXJDb25maWdDaGFuZ2UiLCJBdXRvRGlzY292ZXJ5VXRpbHMiLCJ2YWxpZGF0ZVNlcnZlckNvbmZpZ1dpdGhTdGF0aWNVcmxzIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YXRlRm9yRXJyb3IiLCJhdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvciIsImlzRmF0YWxFcnJvciIsIm1lc3NhZ2UiLCJ0cmFuc2xhdGVkTWVzc2FnZSIsImJhc2VVcmwiLCJkb2VzU2VydmVyUmVxdWlyZUlkU2VydmVyUGFyYW0iLCJleGlzdGluZ1RpbWVvdXRJZCIsImZuIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImJpbmQiLCJkZWxheVRpbWVNcyIsIl9yZW5kZXJIb21lc2VydmVyU2VjdGlvbiIsIkZpZWxkIiwiYSIsInN1YiIsInNob3dIZWxwUG9wdXAiLCJvbkhvbWVzZXJ2ZXJCbHVyIiwib25Ib21lc2VydmVyQ2hhbmdlIiwiX3JlbmRlcklkZW50aXR5U2VydmVyU2VjdGlvbiIsImNsYXNzZXMiLCJvbklkZW50aXR5U2VydmVyQmx1ciIsIm9uSWRlbnRpdHlTZXJ2ZXJDaGFuZ2UiLCJyZW5kZXIiLCJBY2Nlc3NpYmxlQnV0dG9uIiwic3VibWl0QnV0dG9uIiwic3VibWl0VGV4dCIsInN1Ym1pdENsYXNzIiwib25TdWJtaXQiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCIsImluc3RhbmNlT2YiLCJWYWxpZGF0ZWRTZXJ2ZXJDb25maWciLCJudW1iZXIiLCJzdHJpbmciLCJib29sIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQTNCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBOzs7QUFJZSxNQUFNQSxZQUFOLFNBQTJCQyxlQUFNQyxhQUFqQyxDQUErQztBQTZCMURDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLDREQStHQ0MsRUFBRCxJQUFRO0FBQ3ZCLFdBQUtDLFlBQUwsR0FBb0IsS0FBS0MsZUFBTCxDQUFxQixLQUFLRCxZQUExQixFQUF3QyxNQUFNO0FBQzlELGFBQUtFLGNBQUw7QUFDSCxPQUZtQixDQUFwQjtBQUdILEtBbkhrQjtBQUFBLDhEQXFIR0gsRUFBRCxJQUFRO0FBQ3pCLFlBQU1JLEtBQUssR0FBR0osRUFBRSxDQUFDSyxNQUFILENBQVVDLEtBQXhCO0FBQ0EsV0FBS0MsUUFBTCxDQUFjO0FBQUVILFFBQUFBO0FBQUYsT0FBZDtBQUNILEtBeEhrQjtBQUFBLGdFQTBIS0os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QSxZQUFZLEVBQUU4QyxtQkFBVUcsVUFBVixDQUFxQkMseUNBQXJCLEVBQTRDRixVQUozQztBQU1mcEIsRUFBQUEsV0FBVyxFQUFFa0IsbUJBQVVLLE1BTlI7QUFNZ0I7QUFFL0I7QUFDQTVELEVBQUFBLGFBQWEsRUFBRXVELG1CQUFVQyxJQVRWO0FBV2Y7QUFDQUosRUFBQUEsVUFBVSxFQUFFRyxtQkFBVU0sTUFaUDtBQWNmO0FBQ0E7QUFDQVIsRUFBQUEsV0FBVyxFQUFFRSxtQkFBVU0sTUFoQlI7QUFrQmY7QUFDQTtBQUNBL0MsRUFBQUEsd0NBQXdDLEVBQUV5QyxtQkFBVU87QUFwQnJDLEM7OEJBREZoRixZLGtCQXdCSztBQUNsQnFDLEVBQUFBLG9CQUFvQixFQUFFLFlBQVcsQ0FBRSxDQURqQjtBQUVsQmtCLEVBQUFBLFdBQVcsRUFBRTtBQUZLLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge1ZhbGlkYXRlZFNlcnZlckNvbmZpZ30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0F1dG9EaXNjb3ZlcnlVdGlsc1wiO1xuaW1wb3J0IEF1dG9EaXNjb3ZlcnlVdGlscyBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvQXV0b0Rpc2NvdmVyeVV0aWxzXCI7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gXCIuLi8uLi8uLi9TZGtDb25maWdcIjtcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ21hdHJpeC1qcy1zZGsvc3JjL21hdHJpeCc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcblxuLypcbiAqIEEgcHVyZSBVSSBjb21wb25lbnQgd2hpY2ggZGlzcGxheXMgdGhlIEhTIGFuZCBJUyB0byB1c2UuXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VydmVyQ29uZmlnIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25TZXJ2ZXJDb25maWdDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gVGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGV4cGVjdGluZyB0byBjaGFuZ2UuXG4gICAgICAgIHNlcnZlckNvbmZpZzogUHJvcFR5cGVzLmluc3RhbmNlT2YoVmFsaWRhdGVkU2VydmVyQ29uZmlnKS5pc1JlcXVpcmVkLFxuXG4gICAgICAgIGRlbGF5VGltZU1zOiBQcm9wVHlwZXMubnVtYmVyLCAvLyB0aW1lIHRvIHdhaXQgYmVmb3JlIGludm9raW5nIG9uQ2hhbmdlZFxuXG4gICAgICAgIC8vIENhbGxlZCBhZnRlciB0aGUgY29tcG9uZW50IGNhbGxzIG9uU2VydmVyQ29uZmlnQ2hhbmdlXG4gICAgICAgIG9uQWZ0ZXJTdWJtaXQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIE9wdGlvbmFsIHRleHQgZm9yIHRoZSBzdWJtaXQgYnV0dG9uLiBJZiBmYWxzZXksIG5vIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxuICAgICAgICBzdWJtaXRUZXh0OiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIE9wdGlvbmFsIGNsYXNzIGZvciB0aGUgc3VibWl0IGJ1dHRvbi4gT25seSBhcHBsaWVzIGlmIHRoZSBzdWJtaXQgYnV0dG9uXG4gICAgICAgIC8vIGlzIHRvIGJlIHJlbmRlcmVkLlxuICAgICAgICBzdWJtaXRDbGFzczogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBXaGV0aGVyIHRoZSBmbG93IHRoaXMgY29tcG9uZW50IGlzIGVtYmVkZGVkIGluIHJlcXVpcmVzIGFuIGlkZW50aXR5XG4gICAgICAgIC8vIHNlcnZlciB3aGVuIHRoZSBob21lc2VydmVyIHNheXMgaXQgd2lsbCBuZWVkIG9uZS4gRGVmYXVsdCBmYWxzZS5cbiAgICAgICAgc2hvd0lkZW50aXR5U2VydmVySWZSZXF1aXJlZEJ5SG9tZXNlcnZlcjogUHJvcFR5cGVzLmJvb2wsXG4gICAgfTtcblxuICAgIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBkZWxheVRpbWVNczogMCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yVGV4dDogXCJcIixcbiAgICAgICAgICAgIGhzVXJsOiBwcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwsXG4gICAgICAgICAgICBpc1VybDogcHJvcHMuc2VydmVyQ29uZmlnLmlzVXJsLFxuICAgICAgICAgICAgc2hvd0lkZW50aXR5U2VydmVyOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5ld1Byb3BzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIGlmIChuZXdQcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwgPT09IHRoaXMuc3RhdGUuaHNVcmwgJiZcbiAgICAgICAgICAgIG5ld1Byb3BzLnNlcnZlckNvbmZpZy5pc1VybCA9PT0gdGhpcy5zdGF0ZS5pc1VybCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMudmFsaWRhdGVBbmRBcHBseVNlcnZlcihuZXdQcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmwsIG5ld1Byb3BzLnNlcnZlckNvbmZpZy5pc1VybCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdmFsaWRhdGVTZXJ2ZXIoKSB7XG4gICAgICAgIC8vIFRPRE86IERvIHdlIHdhbnQgdG8gc3VwcG9ydCAud2VsbC1rbm93biBsb29rdXBzIGhlcmU/XG4gICAgICAgIC8vIElmIGZvciBzb21lIHJlYXNvbiBzb21lb25lIGVudGVycyBcIm1hdHJpeC5vcmdcIiBmb3IgYSBVUkwsIHdlIGNvdWxkIGRvIGEgbG9va3VwIHRvXG4gICAgICAgIC8vIGZpbmQgdGhlaXIgaG9tZXNlcnZlciB3aXRob3V0IGRlbWFuZGluZyB0aGV5IHVzZSBcImh0dHBzOi8vbWF0cml4Lm9yZ1wiXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMudmFsaWRhdGVBbmRBcHBseVNlcnZlcih0aGlzLnN0YXRlLmhzVXJsLCB0aGlzLnN0YXRlLmlzVXJsKTtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgVUkgZmxvdyB0aGlzIGNvbXBvbmVudCBpcyBlbWJlZGRlZCBpbiByZXF1aXJlcyBhbiBpZGVudGl0eVxuICAgICAgICAvLyBzZXJ2ZXIgd2hlbiB0aGUgaG9tZXNlcnZlciBzYXlzIGl0IHdpbGwgbmVlZCBvbmUsIGNoZWNrIGZpcnN0IGFuZFxuICAgICAgICAvLyByZXZlYWwgdGhpcyBmaWVsZCBpZiBub3QgYWxyZWFkeSBzaG93bi5cbiAgICAgICAgLy8gWFhYOiBUaGlzIGEgYmFja3dhcmQgY29tcGF0aWJpbGl0eSBwYXRoIGZvciBob21lc2VydmVycyB0aGF0IHJlcXVpcmVcbiAgICAgICAgLy8gYW4gaWRlbnRpdHkgc2VydmVyIHRvIGJlIHBhc3NlZCBkdXJpbmcgY2VydGFpbiBmbG93cy5cbiAgICAgICAgLy8gU2VlIGFsc28gaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvc3luYXBzZS9wdWxsLzU4NjguXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMucHJvcHMuc2hvd0lkZW50aXR5U2VydmVySWZSZXF1aXJlZEJ5SG9tZXNlcnZlciAmJlxuICAgICAgICAgICAgIXRoaXMuc3RhdGUuc2hvd0lkZW50aXR5U2VydmVyICYmXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmlzSWRlbnRpdHlTZXJ2ZXJSZXF1aXJlZEJ5SG9tZXNlcnZlcigpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc2hvd0lkZW50aXR5U2VydmVyOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgYXN5bmMgdmFsaWRhdGVBbmRBcHBseVNlcnZlcihoc1VybCwgaXNVcmwpIHtcbiAgICAgICAgLy8gQWx3YXlzIHRyeSBhbmQgdXNlIHRoZSBkZWZhdWx0cyBmaXJzdFxuICAgICAgICBjb25zdCBkZWZhdWx0Q29uZmlnOiBWYWxpZGF0ZWRTZXJ2ZXJDb25maWcgPSBTZGtDb25maWcuZ2V0KClbXCJ2YWxpZGF0ZWRfc2VydmVyX2NvbmZpZ1wiXTtcbiAgICAgICAgaWYgKGRlZmF1bHRDb25maWcuaHNVcmwgPT09IGhzVXJsICYmIGRlZmF1bHRDb25maWcuaXNVcmwgPT09IGlzVXJsKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBoc1VybDogZGVmYXVsdENvbmZpZy5oc1VybCxcbiAgICAgICAgICAgICAgICBpc1VybDogZGVmYXVsdENvbmZpZy5pc1VybCxcbiAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvclRleHQ6IFwiXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25TZXJ2ZXJDb25maWdDaGFuZ2UoZGVmYXVsdENvbmZpZyk7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdENvbmZpZztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaHNVcmwsXG4gICAgICAgICAgICBpc1VybCxcbiAgICAgICAgICAgIGJ1c3k6IHRydWUsXG4gICAgICAgICAgICBlcnJvclRleHQ6IFwiXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBBdXRvRGlzY292ZXJ5VXRpbHMudmFsaWRhdGVTZXJ2ZXJDb25maWdXaXRoU3RhdGljVXJscyhoc1VybCwgaXNVcmwpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogZmFsc2UsIGVycm9yVGV4dDogXCJcIn0pO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNlcnZlckNvbmZpZ0NoYW5nZShyZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcblxuICAgICAgICAgICAgY29uc3Qgc3RhdGVGb3JFcnJvciA9IEF1dG9EaXNjb3ZlcnlVdGlscy5hdXRoQ29tcG9uZW50U3RhdGVGb3JFcnJvcihlKTtcbiAgICAgICAgICAgIGlmICghc3RhdGVGb3JFcnJvci5pc0ZhdGFsRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gY2Fycnkgb24gYW55d2F5XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgQXV0b0Rpc2NvdmVyeVV0aWxzLnZhbGlkYXRlU2VydmVyQ29uZmlnV2l0aFN0YXRpY1VybHMoaHNVcmwsIGlzVXJsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uU2VydmVyQ29uZmlnQ2hhbmdlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBfdChcIlVuYWJsZSB0byB2YWxpZGF0ZSBob21lc2VydmVyL2lkZW50aXR5IHNlcnZlclwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZS50cmFuc2xhdGVkTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gZS50cmFuc2xhdGVkTWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQ6IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGlzSWRlbnRpdHlTZXJ2ZXJSZXF1aXJlZEJ5SG9tZXNlcnZlcigpIHtcbiAgICAgICAgLy8gWFhYOiBXZSBzaG91bGRuJ3QgaGF2ZSB0byBjcmVhdGUgYSB3aG9sZSBuZXcgTWF0cml4Q2xpZW50IGp1c3QgdG9cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGhvbWVzZXJ2ZXIgcmVxdWlyZXMgYW4gaWRlbnRpdHkgc2VydmVyLi4uIFNob3VsZCBpdCBiZVxuICAgICAgICAvLyBleHRyYWN0ZWQgdG8gYSBzdGF0aWMgdXRpbHMgZnVuY3Rpb24uLi4/XG4gICAgICAgIHJldHVybiBjcmVhdGVDbGllbnQoe1xuICAgICAgICAgICAgYmFzZVVybDogdGhpcy5zdGF0ZS5oc1VybCxcbiAgICAgICAgfSkuZG9lc1NlcnZlclJlcXVpcmVJZFNlcnZlclBhcmFtKCk7XG4gICAgfVxuXG4gICAgb25Ib21lc2VydmVyQmx1ciA9IChldikgPT4ge1xuICAgICAgICB0aGlzLl9oc1RpbWVvdXRJZCA9IHRoaXMuX3dhaXRUaGVuSW52b2tlKHRoaXMuX2hzVGltZW91dElkLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlU2VydmVyKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBvbkhvbWVzZXJ2ZXJDaGFuZ2UgPSAoZXYpID0+IHtcbiAgICAgICAgY29uc3QgaHNVcmwgPSBldi50YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBoc1VybCB9KTtcbiAgICB9O1xuXG4gICAgb25JZGVudGl0eVNlcnZlckJsdXIgPSAoZXYpID0+IHtcbiAgICAgICAgdGhpcy5faXNUaW1lb3V0SWQgPSB0aGlzLl93YWl0VGhlbkludm9rZSh0aGlzLl9pc1RpbWVvdXRJZCwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVNlcnZlcigpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgb25JZGVudGl0eVNlcnZlckNoYW5nZSA9IChldikgPT4ge1xuICAgICAgICBjb25zdCBpc1VybCA9IGV2LnRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGlzVXJsIH0pO1xuICAgIH07XG5cbiAgICBvblN1Ym1pdCA9IGFzeW5jIChldikgPT4ge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy52YWxpZGF0ZVNlcnZlcigpO1xuICAgICAgICBpZiAoIXJlc3VsdCkgcmV0dXJuOyAvLyBEbyBub3QgY29udGludWUuXG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25BZnRlclN1Ym1pdCkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkFmdGVyU3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX3dhaXRUaGVuSW52b2tlKGV4aXN0aW5nVGltZW91dElkLCBmbikge1xuICAgICAgICBpZiAoZXhpc3RpbmdUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChleGlzdGluZ1RpbWVvdXRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZm4uYmluZCh0aGlzKSwgdGhpcy5wcm9wcy5kZWxheVRpbWVNcyk7XG4gICAgfVxuXG4gICAgc2hvd0hlbHBQb3B1cCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgQ3VzdG9tU2VydmVyRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnYXV0aC5DdXN0b21TZXJ2ZXJEaWFsb2cnKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ3VzdG9tIFNlcnZlciBEaWFsb2cnLCAnJywgQ3VzdG9tU2VydmVyRGlhbG9nKTtcbiAgICB9O1xuXG4gICAgX3JlbmRlckhvbWVzZXJ2ZXJTZWN0aW9uKCkge1xuICAgICAgICBjb25zdCBGaWVsZCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkZpZWxkJyk7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAge190KFwiRW50ZXIgeW91ciBjdXN0b20gaG9tZXNlcnZlciBVUkwgPGE+V2hhdCBkb2VzIHRoaXMgbWVhbj88L2E+XCIsIHt9LCB7XG4gICAgICAgICAgICAgICAgYTogc3ViID0+IDxhIGNsYXNzTmFtZT1cIm14X1NlcnZlckNvbmZpZ19oZWxwXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLnNob3dIZWxwUG9wdXB9PlxuICAgICAgICAgICAgICAgICAgICB7c3VifVxuICAgICAgICAgICAgICAgIDwvYT4sXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgIGlkPVwibXhfU2VydmVyQ29uZmlnX2hzVXJsXCJcbiAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJIb21lc2VydmVyIFVSTFwiKX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaHNVcmx9XG4gICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUuaHNVcmx9XG4gICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uSG9tZXNlcnZlckJsdXJ9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25Ib21lc2VydmVyQ2hhbmdlfVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmJ1c3l9XG4gICAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxuXG4gICAgX3JlbmRlcklkZW50aXR5U2VydmVyU2VjdGlvbigpIHtcbiAgICAgICAgY29uc3QgRmllbGQgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5GaWVsZCcpO1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBcIm14X1NlcnZlckNvbmZpZ19pZGVudGl0eVNlcnZlclwiOiB0cnVlLFxuICAgICAgICAgICAgXCJteF9TZXJ2ZXJDb25maWdfaWRlbnRpdHlTZXJ2ZXJfc2hvd25cIjogdGhpcy5zdGF0ZS5zaG93SWRlbnRpdHlTZXJ2ZXIsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICAgICAge190KFwiRW50ZXIgeW91ciBjdXN0b20gaWRlbnRpdHkgc2VydmVyIFVSTCA8YT5XaGF0IGRvZXMgdGhpcyBtZWFuPzwvYT5cIiwge30sIHtcbiAgICAgICAgICAgICAgICBhOiBzdWIgPT4gPGEgY2xhc3NOYW1lPVwibXhfU2VydmVyQ29uZmlnX2hlbHBcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuc2hvd0hlbHBQb3B1cH0+XG4gICAgICAgICAgICAgICAgICAgIHtzdWJ9XG4gICAgICAgICAgICA8L2E+LFxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8RmllbGRcbiAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJJZGVudGl0eSBTZXJ2ZXIgVVJMXCIpfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0aGlzLnByb3BzLnNlcnZlckNvbmZpZy5pc1VybH1cbiAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5pc1VybCB8fCAnJ31cbiAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25JZGVudGl0eVNlcnZlckJsdXJ9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25JZGVudGl0eVNlcnZlckNoYW5nZX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS5idXN5fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcblxuICAgICAgICBjb25zdCBlcnJvclRleHQgPSB0aGlzLnN0YXRlLmVycm9yVGV4dFxuICAgICAgICAgICAgPyA8c3BhbiBjbGFzc05hbWU9J214X1NlcnZlckNvbmZpZ19lcnJvcic+e3RoaXMuc3RhdGUuZXJyb3JUZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICBjb25zdCBzdWJtaXRCdXR0b24gPSB0aGlzLnByb3BzLnN1Ym1pdFRleHRcbiAgICAgICAgICAgID8gPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3RoaXMucHJvcHMuc3VibWl0Q2xhc3N9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU3VibWl0fVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuYnVzeX0+e3RoaXMucHJvcHMuc3VibWl0VGV4dH08L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA6IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT1cIm14X1NlcnZlckNvbmZpZ1wiIG9uU3VibWl0PXt0aGlzLm9uU3VibWl0fSBhdXRvQ29tcGxldGU9XCJvZmZcIj5cbiAgICAgICAgICAgICAgICA8aDM+e190KFwiT3RoZXIgc2VydmVyc1wiKX08L2gzPlxuICAgICAgICAgICAgICAgIHtlcnJvclRleHR9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckhvbWVzZXJ2ZXJTZWN0aW9uKCl9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlcklkZW50aXR5U2VydmVyU2VjdGlvbigpfVxuICAgICAgICAgICAgICAgIHtzdWJtaXRCdXR0b259XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19