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

var _languageHandler = require("../../../../../languageHandler");

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var _AccessibleButton = _interopRequireDefault(require("../../../elements/AccessibleButton"));

var _SdkConfig = _interopRequireDefault(require("../../../../../SdkConfig"));

var _createRoom = _interopRequireDefault(require("../../../../../createRoom"));

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../../../"));

var _PlatformPeg = _interopRequireDefault(require("../../../../../PlatformPeg"));

var KeyboardShortcuts = _interopRequireWildcard(require("../../../../../accessibility/KeyboardShortcuts"));

/*
Copyright 2019 New Vector Ltd

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
class HelpUserSettingsTab extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onClearCacheAndReload", e => {
      if (!_PlatformPeg.default.get()) return; // Dev note: please keep this log line, it's useful when troubleshooting a MatrixClient suddenly
      // stopping in the middle of the logs.

      console.log("Clear cache & reload clicked");

      _MatrixClientPeg.MatrixClientPeg.get().stopClient();

      _MatrixClientPeg.MatrixClientPeg.get().store.deleteAllData().then(() => {
        _PlatformPeg.default.get().reload();
      });
    });
    (0, _defineProperty2.default)(this, "_onBugReport", e => {
      const BugReportDialog = sdk.getComponent("dialogs.BugReportDialog");

      if (!BugReportDialog) {
        return;
      }

      _Modal.default.createTrackedDialog('Bug Report Dialog', '', BugReportDialog, {});
    });
    (0, _defineProperty2.default)(this, "_onStartBotChat", e => {
      this.props.closeSettingsFn();
      (0, _createRoom.default)({
        dmUserId: _SdkConfig.default.get().welcomeUserId,
        andView: true
      });
    });
    (0, _defineProperty2.default)(this, "_showSpoiler", event => {
      const target = event.target;
      target.innerHTML = target.getAttribute('data-spoiler');
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    this.state = {
      vectorVersion: null,
      canUpdate: false
    };
  }

  componentDidMount()
  /*: void*/
  {
    _PlatformPeg.default.get().getAppVersion().then(ver => this.setState({
      vectorVersion: ver
    })).catch(e => {
      console.error("Error getting vector version: ", e);
    });

    _PlatformPeg.default.get().canSelfUpdate().then(v => this.setState({
      canUpdate: v
    })).catch(e => {
      console.error("Error getting self updatability: ", e);
    });
  }

  _renderLegal() {
    const tocLinks = _SdkConfig.default.get().terms_and_conditions_links;

    if (!tocLinks) return null;
    const legalLinks = [];

    for (const tocEntry of _SdkConfig.default.get().terms_and_conditions_links) {
      legalLinks.push( /*#__PURE__*/_react.default.createElement("div", {
        key: tocEntry.url
      }, /*#__PURE__*/_react.default.createElement("a", {
        href: tocEntry.url,
        rel: "noreferrer noopener",
        target: "_blank"
      }, tocEntry.text)));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_HelpUserSettingsTab_versions"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Legal")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, legalLinks));
  }

  _renderCredits() {
    // Note: This is not translated because it is legal text.
    // Also, &nbsp; is ugly but necessary.
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Credits")), /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, "The ", /*#__PURE__*/_react.default.createElement("a", {
      href: "themes/riot/img/backgrounds/valley.jpg",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "default cover photo"), " is \xA9\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://www.flickr.com/golan",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "Jes\xFAs Roncero"), ' ', "used under the terms of\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://creativecommons.org/licenses/by-sa/4.0/",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "CC-BY-SA 4.0"), "."), /*#__PURE__*/_react.default.createElement("li", null, "The ", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://github.com/matrix-org/twemoji-colr",
      rel: "noreferrer noopener",
      target: "_blank"
    }, " twemoji-colr"), " font is \xA9\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://mozilla.org",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "Mozilla Foundation"), ' ', "used under the terms of\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "http://www.apache.org/licenses/LICENSE-2.0",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "Apache 2.0"), "."), /*#__PURE__*/_react.default.createElement("li", null, "The ", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://twemoji.twitter.com/",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "Twemoji"), " emoji art is \xA9\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://twemoji.twitter.com/",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "Twitter, Inc and other contributors"), " used under the terms of\xA0", /*#__PURE__*/_react.default.createElement("a", {
      href: "https://creativecommons.org/licenses/by/4.0/",
      rel: "noreferrer noopener",
      target: "_blank"
    }, "CC-BY 4.0"), ".")));
  }

  render() {
    let faqText = (0, _languageHandler._t)('For help with using Riot, click <a>here</a>.', {}, {
      'a': sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "https://about.riot.im/need-help/",
        rel: "noreferrer noopener",
        target: "_blank"
      }, sub)
    });

    if (_SdkConfig.default.get().welcomeUserId && (0, _languageHandler.getCurrentLanguage)().startsWith('en')) {
      faqText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('For help with using Riot, click <a>here</a> or start a chat with our ' + 'bot using the button below.', {}, {
        'a': sub => /*#__PURE__*/_react.default.createElement("a", {
          href: "https://about.riot.im/need-help/",
          rel: "noreferrer noopener",
          target: "_blank"
        }, sub)
      }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onStartBotChat,
        kind: "primary"
      }, (0, _languageHandler._t)("Chat with Riot Bot"))));
    }

    const vectorVersion = this.state.vectorVersion || 'unknown';

    let olmVersion = _MatrixClientPeg.MatrixClientPeg.get().olmVersion;

    olmVersion = olmVersion ? "".concat(olmVersion[0], ".").concat(olmVersion[1], ".").concat(olmVersion[2]) : '<not-enabled>';
    let updateButton = null;

    if (this.state.canUpdate) {
      const platform = _PlatformPeg.default.get();

      updateButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: platform.startUpdateCheck,
        kind: "primary"
      }, (0, _languageHandler._t)('Check for update'));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab mx_HelpUserSettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Help & About")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)('Bug reporting')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)("If you've submitted a bug via GitHub, debug logs can help " + "us track down the problem. Debug logs contain application " + "usage data including your username, the IDs or aliases of " + "the rooms or groups you have visited and the usernames of " + "other users. They do not contain messages."), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_HelpUserSettingsTab_debugButton"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onBugReport,
      kind: "primary"
    }, (0, _languageHandler._t)("Submit debug logs"))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_HelpUserSettingsTab_debugButton"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onClearCacheAndReload,
      kind: "danger"
    }, (0, _languageHandler._t)("Clear cache and reload"))), (0, _languageHandler._t)("To report a Matrix-related security issue, please read the Matrix.org " + "<a>Security Disclosure Policy</a>.", {}, {
      'a': sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "https://matrix.org/security-disclosure-policy/",
        rel: "noreferrer noopener",
        target: "_blank"
      }, sub)
    }))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("FAQ")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, faqText), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      kind: "primary",
      onClick: KeyboardShortcuts.toggleDialog
    }, (0, _languageHandler._t)("Keyboard Shortcuts"))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_HelpUserSettingsTab_versions"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Versions")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)("riot-web version:"), " ", vectorVersion, /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("olm version:"), " ", olmVersion, /*#__PURE__*/_react.default.createElement("br", null), updateButton)), this._renderLegal(), this._renderCredits(), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_HelpUserSettingsTab_versions"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Advanced")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)("Homeserver is"), " ", /*#__PURE__*/_react.default.createElement("code", null, _MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl()), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Identity Server is"), " ", /*#__PURE__*/_react.default.createElement("code", null, _MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Access Token:") + ' ', /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      element: "span",
      onClick: this._showSpoiler,
      "data-spoiler": _MatrixClientPeg.MatrixClientPeg.get().getAccessToken()
    }, "<", (0, _languageHandler._t)("click to reveal"), ">"))));
  }

}

exports.default = HelpUserSettingsTab;
(0, _defineProperty2.default)(HelpUserSettingsTab, "propTypes", {
  closeSettingsFn: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvdXNlci9IZWxwVXNlclNldHRpbmdzVGFiLmpzIl0sIm5hbWVzIjpbIkhlbHBVc2VyU2V0dGluZ3NUYWIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZSIsIlBsYXRmb3JtUGVnIiwiZ2V0IiwiY29uc29sZSIsImxvZyIsIk1hdHJpeENsaWVudFBlZyIsInN0b3BDbGllbnQiLCJzdG9yZSIsImRlbGV0ZUFsbERhdGEiLCJ0aGVuIiwicmVsb2FkIiwiQnVnUmVwb3J0RGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwicHJvcHMiLCJjbG9zZVNldHRpbmdzRm4iLCJkbVVzZXJJZCIsIlNka0NvbmZpZyIsIndlbGNvbWVVc2VySWQiLCJhbmRWaWV3IiwiZXZlbnQiLCJ0YXJnZXQiLCJpbm5lckhUTUwiLCJnZXRBdHRyaWJ1dGUiLCJyYW5nZSIsImRvY3VtZW50IiwiY3JlYXRlUmFuZ2UiLCJzZWxlY3ROb2RlQ29udGVudHMiLCJzZWxlY3Rpb24iLCJ3aW5kb3ciLCJnZXRTZWxlY3Rpb24iLCJyZW1vdmVBbGxSYW5nZXMiLCJhZGRSYW5nZSIsInN0YXRlIiwidmVjdG9yVmVyc2lvbiIsImNhblVwZGF0ZSIsImNvbXBvbmVudERpZE1vdW50IiwiZ2V0QXBwVmVyc2lvbiIsInZlciIsInNldFN0YXRlIiwiY2F0Y2giLCJlcnJvciIsImNhblNlbGZVcGRhdGUiLCJ2IiwiX3JlbmRlckxlZ2FsIiwidG9jTGlua3MiLCJ0ZXJtc19hbmRfY29uZGl0aW9uc19saW5rcyIsImxlZ2FsTGlua3MiLCJ0b2NFbnRyeSIsInB1c2giLCJ1cmwiLCJ0ZXh0IiwiX3JlbmRlckNyZWRpdHMiLCJyZW5kZXIiLCJmYXFUZXh0Iiwic3ViIiwic3RhcnRzV2l0aCIsIl9vblN0YXJ0Qm90Q2hhdCIsIm9sbVZlcnNpb24iLCJ1cGRhdGVCdXR0b24iLCJwbGF0Zm9ybSIsInN0YXJ0VXBkYXRlQ2hlY2siLCJfb25CdWdSZXBvcnQiLCJfb25DbGVhckNhY2hlQW5kUmVsb2FkIiwiS2V5Ym9hcmRTaG9ydGN1dHMiLCJ0b2dnbGVEaWFsb2ciLCJnZXRIb21lc2VydmVyVXJsIiwiZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwiLCJfc2hvd1Nwb2lsZXIiLCJnZXRBY2Nlc3NUb2tlbiIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTFCQTs7Ozs7Ozs7Ozs7Ozs7O0FBNEJlLE1BQU1BLG1CQUFOLFNBQWtDQyxlQUFNQyxTQUF4QyxDQUFrRDtBQUs3REMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSxrRUFrQllDLENBQUQsSUFBTztBQUM1QixVQUFJLENBQUNDLHFCQUFZQyxHQUFaLEVBQUwsRUFBd0IsT0FESSxDQUc1QjtBQUNBOztBQUNBQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4QkFBWjs7QUFDQUMsdUNBQWdCSCxHQUFoQixHQUFzQkksVUFBdEI7O0FBQ0FELHVDQUFnQkgsR0FBaEIsR0FBc0JLLEtBQXRCLENBQTRCQyxhQUE1QixHQUE0Q0MsSUFBNUMsQ0FBaUQsTUFBTTtBQUNuRFIsNkJBQVlDLEdBQVosR0FBa0JRLE1BQWxCO0FBQ0gsT0FGRDtBQUdILEtBNUJhO0FBQUEsd0RBOEJFVixDQUFELElBQU87QUFDbEIsWUFBTVcsZUFBZSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIseUJBQWpCLENBQXhCOztBQUNBLFVBQUksQ0FBQ0YsZUFBTCxFQUFzQjtBQUNsQjtBQUNIOztBQUNERyxxQkFBTUMsbUJBQU4sQ0FBMEIsbUJBQTFCLEVBQStDLEVBQS9DLEVBQW1ESixlQUFuRCxFQUFvRSxFQUFwRTtBQUNILEtBcENhO0FBQUEsMkRBc0NL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QUFBaUMsTUFBQSxPQUFPLEVBQUUsS0FBS0MsWUFBL0M7QUFDa0Isc0JBQWNqRSxpQ0FBZ0JILEdBQWhCLEdBQXNCcUUsY0FBdEI7QUFEaEMsWUFFVSx5QkFBRyxpQkFBSCxDQUZWLE1BSkosQ0FGSixDQXJESixDQURKO0FBb0VIOztBQW5PNEQ7Ozs4QkFBNUMzRSxtQixlQUNFO0FBQ2ZxQixFQUFBQSxlQUFlLEVBQUV1RCxtQkFBVUMsSUFBVixDQUFlQztBQURqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge190LCBnZXRDdXJyZW50TGFuZ3VhZ2V9IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vLi4vLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vU2RrQ29uZmlnXCI7XG5pbXBvcnQgY3JlYXRlUm9vbSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vY3JlYXRlUm9vbVwiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9Nb2RhbFwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9cIjtcbmltcG9ydCBQbGF0Zm9ybVBlZyBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vUGxhdGZvcm1QZWdcIjtcbmltcG9ydCAqIGFzIEtleWJvYXJkU2hvcnRjdXRzIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hY2Nlc3NpYmlsaXR5L0tleWJvYXJkU2hvcnRjdXRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlbHBVc2VyU2V0dGluZ3NUYWIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGNsb3NlU2V0dGluZ3NGbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHZlY3RvclZlcnNpb246IG51bGwsXG4gICAgICAgICAgICBjYW5VcGRhdGU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCk6IHZvaWQge1xuICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5nZXRBcHBWZXJzaW9uKCkudGhlbigodmVyKSA9PiB0aGlzLnNldFN0YXRlKHt2ZWN0b3JWZXJzaW9uOiB2ZXJ9KSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIHZlY3RvciB2ZXJzaW9uOiBcIiwgZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5jYW5TZWxmVXBkYXRlKCkudGhlbigodikgPT4gdGhpcy5zZXRTdGF0ZSh7Y2FuVXBkYXRlOiB2fSkpLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2V0dGluZyBzZWxmIHVwZGF0YWJpbGl0eTogXCIsIGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfb25DbGVhckNhY2hlQW5kUmVsb2FkID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCFQbGF0Zm9ybVBlZy5nZXQoKSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIERldiBub3RlOiBwbGVhc2Uga2VlcCB0aGlzIGxvZyBsaW5lLCBpdCdzIHVzZWZ1bCB3aGVuIHRyb3VibGVzaG9vdGluZyBhIE1hdHJpeENsaWVudCBzdWRkZW5seVxuICAgICAgICAvLyBzdG9wcGluZyBpbiB0aGUgbWlkZGxlIG9mIHRoZSBsb2dzLlxuICAgICAgICBjb25zb2xlLmxvZyhcIkNsZWFyIGNhY2hlICYgcmVsb2FkIGNsaWNrZWRcIik7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zdG9wQ2xpZW50KCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zdG9yZS5kZWxldGVBbGxEYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5yZWxvYWQoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbkJ1Z1JlcG9ydCA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IEJ1Z1JlcG9ydERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkJ1Z1JlcG9ydERpYWxvZ1wiKTtcbiAgICAgICAgaWYgKCFCdWdSZXBvcnREaWFsb2cpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdCdWcgUmVwb3J0IERpYWxvZycsICcnLCBCdWdSZXBvcnREaWFsb2csIHt9KTtcbiAgICB9O1xuXG4gICAgX29uU3RhcnRCb3RDaGF0ID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5jbG9zZVNldHRpbmdzRm4oKTtcbiAgICAgICAgY3JlYXRlUm9vbSh7XG4gICAgICAgICAgICBkbVVzZXJJZDogU2RrQ29uZmlnLmdldCgpLndlbGNvbWVVc2VySWQsXG4gICAgICAgICAgICBhbmRWaWV3OiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX3Nob3dTcG9pbGVyID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgdGFyZ2V0LmlubmVySFRNTCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3BvaWxlcicpO1xuXG4gICAgICAgIGNvbnN0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKHRhcmdldCk7XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG4gICAgfTtcblxuICAgIF9yZW5kZXJMZWdhbCgpIHtcbiAgICAgICAgY29uc3QgdG9jTGlua3MgPSBTZGtDb25maWcuZ2V0KCkudGVybXNfYW5kX2NvbmRpdGlvbnNfbGlua3M7XG4gICAgICAgIGlmICghdG9jTGlua3MpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGxlZ2FsTGlua3MgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB0b2NFbnRyeSBvZiBTZGtDb25maWcuZ2V0KCkudGVybXNfYW5kX2NvbmRpdGlvbnNfbGlua3MpIHtcbiAgICAgICAgICAgIGxlZ2FsTGlua3MucHVzaCg8ZGl2IGtleT17dG9jRW50cnkudXJsfT5cbiAgICAgICAgICAgICAgICA8YSBocmVmPXt0b2NFbnRyeS51cmx9IHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIj57dG9jRW50cnkudGV4dH08L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uIG14X0hlbHBVc2VyU2V0dGluZ3NUYWJfdmVyc2lvbnMnPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KFwiTGVnYWxcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHtsZWdhbExpbmtzfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX3JlbmRlckNyZWRpdHMoKSB7XG4gICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgbm90IHRyYW5zbGF0ZWQgYmVjYXVzZSBpdCBpcyBsZWdhbCB0ZXh0LlxuICAgICAgICAvLyBBbHNvLCAmbmJzcDsgaXMgdWdseSBidXQgbmVjZXNzYXJ5LlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3NlY3Rpb24nPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KFwiQ3JlZGl0c1wiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICBUaGUgPGEgaHJlZj1cInRoZW1lcy9yaW90L2ltZy9iYWNrZ3JvdW5kcy92YWxsZXkuanBnXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdCBjb3ZlciBwaG90bzwvYT4gaXMgwqkmbmJzcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJodHRwczovL3d3dy5mbGlja3IuY29tL2dvbGFuXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPkplc8O6cyBSb25jZXJvPC9hPnsnICd9XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiZuYnNwO1xuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS80LjAvXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQ0MtQlktU0EgNC4wPC9hPi5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgVGhlIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vbWF0cml4LW9yZy90d2Vtb2ppLWNvbHJcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIj4gdHdlbW9qaS1jb2xyPC9hPiBmb250IGlzIMKpJm5ic3A7XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiaHR0cHM6Ly9tb3ppbGxhLm9yZ1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIj5Nb3ppbGxhIEZvdW5kYXRpb248L2E+eycgJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgdW5kZXIgdGhlIHRlcm1zIG9mJm5ic3A7XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQXBhY2hlIDIuMDwvYT4uXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIFRoZSA8YSBocmVmPVwiaHR0cHM6Ly90d2Vtb2ppLnR3aXR0ZXIuY29tL1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFR3ZW1vamk8L2E+IGVtb2ppIGFydCBpcyDCqSZuYnNwO1xuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vdHdlbW9qaS50d2l0dGVyLmNvbS9cIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCIgdGFyZ2V0PVwiX2JsYW5rXCI+VHdpdHRlciwgSW5jIGFuZCBvdGhlclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJpYnV0b3JzPC9hPiB1c2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiZuYnNwO1xuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS80LjAvXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQ0MtQlkgNC4wPC9hPi5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmFxVGV4dCA9IF90KCdGb3IgaGVscCB3aXRoIHVzaW5nIFJpb3QsIGNsaWNrIDxhPmhlcmU8L2E+LicsIHt9LCB7XG4gICAgICAgICAgICAnYSc6IChzdWIpID0+XG4gICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vYWJvdXQucmlvdC5pbS9uZWVkLWhlbHAvXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPntzdWJ9PC9hPixcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChTZGtDb25maWcuZ2V0KCkud2VsY29tZVVzZXJJZCAmJiBnZXRDdXJyZW50TGFuZ3VhZ2UoKS5zdGFydHNXaXRoKCdlbicpKSB7XG4gICAgICAgICAgICBmYXFUZXh0ID0gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90KCdGb3IgaGVscCB3aXRoIHVzaW5nIFJpb3QsIGNsaWNrIDxhPmhlcmU8L2E+IG9yIHN0YXJ0IGEgY2hhdCB3aXRoIG91ciAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYm90IHVzaW5nIHRoZSBidXR0b24gYmVsb3cuJywge30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYSc6IChzdWIpID0+IDxhIGhyZWY9XCJodHRwczovL2Fib3V0LnJpb3QuaW0vbmVlZC1oZWxwL1wiIHJlbD0nbm9yZWZlcnJlciBub29wZW5lcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD0nX2JsYW5rJz57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vblN0YXJ0Qm90Q2hhdH0ga2luZD0ncHJpbWFyeSc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiQ2hhdCB3aXRoIFJpb3QgQm90XCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2ZWN0b3JWZXJzaW9uID0gdGhpcy5zdGF0ZS52ZWN0b3JWZXJzaW9uIHx8ICd1bmtub3duJztcblxuICAgICAgICBsZXQgb2xtVmVyc2lvbiA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbG1WZXJzaW9uO1xuICAgICAgICBvbG1WZXJzaW9uID0gb2xtVmVyc2lvbiA/IGAke29sbVZlcnNpb25bMF19LiR7b2xtVmVyc2lvblsxXX0uJHtvbG1WZXJzaW9uWzJdfWAgOiAnPG5vdC1lbmFibGVkPic7XG5cbiAgICAgICAgbGV0IHVwZGF0ZUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNhblVwZGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgcGxhdGZvcm0gPSBQbGF0Zm9ybVBlZy5nZXQoKTtcbiAgICAgICAgICAgIHVwZGF0ZUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXtwbGF0Zm9ybS5zdGFydFVwZGF0ZUNoZWNrfSBraW5kPSdwcmltYXJ5Jz5cbiAgICAgICAgICAgICAgICAgICAge190KCdDaGVjayBmb3IgdXBkYXRlJyl9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiIG14X0hlbHBVc2VyU2V0dGluZ3NUYWJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX2hlYWRpbmdcIj57X3QoXCJIZWxwICYgQWJvdXRcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KCdCdWcgcmVwb3J0aW5nJyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90KCBcIklmIHlvdSd2ZSBzdWJtaXR0ZWQgYSBidWcgdmlhIEdpdEh1YiwgZGVidWcgbG9ncyBjYW4gaGVscCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidXMgdHJhY2sgZG93biB0aGUgcHJvYmxlbS4gRGVidWcgbG9ncyBjb250YWluIGFwcGxpY2F0aW9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2FnZSBkYXRhIGluY2x1ZGluZyB5b3VyIHVzZXJuYW1lLCB0aGUgSURzIG9yIGFsaWFzZXMgb2YgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRoZSByb29tcyBvciBncm91cHMgeW91IGhhdmUgdmlzaXRlZCBhbmQgdGhlIHVzZXJuYW1lcyBvZiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3RoZXIgdXNlcnMuIFRoZXkgZG8gbm90IGNvbnRhaW4gbWVzc2FnZXMuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0hlbHBVc2VyU2V0dGluZ3NUYWJfZGVidWdCdXR0b24nPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uQnVnUmVwb3J0fSBraW5kPSdwcmltYXJ5Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiU3VibWl0IGRlYnVnIGxvZ3NcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfSGVscFVzZXJTZXR0aW5nc1RhYl9kZWJ1Z0J1dHRvbic+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25DbGVhckNhY2hlQW5kUmVsb2FkfSBraW5kPSdkYW5nZXInPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJDbGVhciBjYWNoZSBhbmQgcmVsb2FkXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90KCBcIlRvIHJlcG9ydCBhIE1hdHJpeC1yZWxhdGVkIHNlY3VyaXR5IGlzc3VlLCBwbGVhc2UgcmVhZCB0aGUgTWF0cml4Lm9yZyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGE+U2VjdXJpdHkgRGlzY2xvc3VyZSBQb2xpY3k8L2E+LlwiLCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2EnOiAoc3ViKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJodHRwczovL21hdHJpeC5vcmcvc2VjdXJpdHktZGlzY2xvc3VyZS1wb2xpY3kvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCIgdGFyZ2V0PVwiX2JsYW5rXCI+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbic+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3ViaGVhZGluZyc+e190KFwiRkFRXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmYXFUZXh0fVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD1cInByaW1hcnlcIiBvbkNsaWNrPXtLZXlib2FyZFNob3J0Y3V0cy50b2dnbGVEaWFsb2d9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIktleWJvYXJkIFNob3J0Y3V0c1wiKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbiBteF9IZWxwVXNlclNldHRpbmdzVGFiX3ZlcnNpb25zJz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nJz57X3QoXCJWZXJzaW9uc1wiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJyaW90LXdlYiB2ZXJzaW9uOlwiKX0ge3ZlY3RvclZlcnNpb259PGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJvbG0gdmVyc2lvbjpcIil9IHtvbG1WZXJzaW9ufTxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAge3VwZGF0ZUJ1dHRvbn1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckxlZ2FsKCl9XG4gICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckNyZWRpdHMoKX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc2VjdGlvbiBteF9IZWxwVXNlclNldHRpbmdzVGFiX3ZlcnNpb25zJz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJoZWFkaW5nJz57X3QoXCJBZHZhbmNlZFwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJIb21lc2VydmVyIGlzXCIpfSA8Y29kZT57TWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEhvbWVzZXJ2ZXJVcmwoKX08L2NvZGU+PGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJJZGVudGl0eSBTZXJ2ZXIgaXNcIil9IDxjb2RlPntNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKX08L2NvZGU+PGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJBY2Nlc3MgVG9rZW46XCIpICsgJyAnfVxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gZWxlbWVudD1cInNwYW5cIiBvbkNsaWNrPXt0aGlzLl9zaG93U3BvaWxlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtc3BvaWxlcj17TWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEFjY2Vzc1Rva2VuKCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICZsdDt7IF90KFwiY2xpY2sgdG8gcmV2ZWFsXCIpIH0mZ3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19