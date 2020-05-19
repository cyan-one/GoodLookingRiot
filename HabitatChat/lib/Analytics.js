"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("./languageHandler");

var _PlatformPeg = _interopRequireDefault(require("./PlatformPeg"));

var _SdkConfig = _interopRequireDefault(require("./SdkConfig"));

var _Modal = _interopRequireDefault(require("./Modal"));

var sdk = _interopRequireWildcard(require("./index"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const hashRegex = /#\/(groups?|room|user|settings|register|login|forgot_password|home|directory)/;
const hashVarRegex = /#\/(group|room|user)\/.*$/; // Remove all but the first item in the hash path. Redact unexpected hashes.

function getRedactedHash(hash) {
  // Don't leak URLs we aren't expecting - they could contain tokens/PII
  const match = hashRegex.exec(hash);

  if (!match) {
    console.warn("Unexpected hash location \"".concat(hash, "\""));
    return '#/<unexpected hash location>';
  }

  if (hashVarRegex.test(hash)) {
    return hash.replace(hashVarRegex, "#/$1/<redacted>");
  }

  return hash.replace(hashRegex, "#/$1");
} // Return the current origin, path and hash separated with a `/`. This does
// not include query parameters.


function getRedactedUrl() {
  const {
    origin,
    hash
  } = window.location;
  let {
    pathname
  } = window.location; // Redact paths which could contain unexpected PII

  if (origin.startsWith('file://')) {
    pathname = "/<redacted>/";
  }

  return origin + pathname + getRedactedHash(hash);
}

const customVariables = {
  // The Matomo installation at https://matomo.riot.im is currently configured
  // with a limit of 10 custom variables.
  'App Platform': {
    id: 1,
    expl: (0, _languageHandler._td)('The platform you\'re on'),
    example: 'Electron Platform'
  },
  'App Version': {
    id: 2,
    expl: (0, _languageHandler._td)('The version of Riot'),
    example: '15.0.0'
  },
  'User Type': {
    id: 3,
    expl: (0, _languageHandler._td)('Whether or not you\'re logged in (we don\'t record your username)'),
    example: 'Logged In'
  },
  'Chosen Language': {
    id: 4,
    expl: (0, _languageHandler._td)('Your language of choice'),
    example: 'en'
  },
  'Instance': {
    id: 5,
    expl: (0, _languageHandler._td)('Which officially provided instance you are using, if any'),
    example: 'app'
  },
  'RTE: Uses Richtext Mode': {
    id: 6,
    expl: (0, _languageHandler._td)('Whether or not you\'re using the Richtext mode of the Rich Text Editor'),
    example: 'off'
  },
  'Homeserver URL': {
    id: 7,
    expl: (0, _languageHandler._td)('Your homeserver\'s URL'),
    example: 'https://matrix.org'
  },
  'Touch Input': {
    id: 8,
    expl: (0, _languageHandler._td)("Whether you're using Riot on a device where touch is the primary input mechanism"),
    example: 'false'
  },
  'Breadcrumbs': {
    id: 9,
    expl: (0, _languageHandler._td)("Whether or not you're using the 'breadcrumbs' feature (avatars above the room list)"),
    example: 'disabled'
  },
  'Installed PWA': {
    id: 10,
    expl: (0, _languageHandler._td)("Whether you're using Riot as an installed Progressive Web App"),
    example: 'false'
  }
};

function whitelistRedact(whitelist, str) {
  if (whitelist.includes(str)) return str;
  return '<redacted>';
}

const UID_KEY = "mx_Riot_Analytics_uid";
const CREATION_TS_KEY = "mx_Riot_Analytics_cts";
const VISIT_COUNT_KEY = "mx_Riot_Analytics_vc";
const LAST_VISIT_TS_KEY = "mx_Riot_Analytics_lvts";

function getUid() {
  try {
    let data = localStorage && localStorage.getItem(UID_KEY);

    if (!data && localStorage) {
      localStorage.setItem(UID_KEY, data = [...Array(16)].map(() => Math.random().toString(16)[2]).join(''));
    }

    return data;
  } catch (e) {
    console.error("Analytics error: ", e);
    return "";
  }
}

const HEARTBEAT_INTERVAL = 30 * 1000; // seconds

class Analytics {
  constructor() {
    (0, _defineProperty2.default)(this, "showDetailsModal", () => {
      let rows = [];

      if (!this.disabled) {
        rows = Object.values(this.visitVariables);
      } else {
        rows = Object.keys(customVariables).map(k => [k, (0, _languageHandler._t)('e.g. %(exampleValue)s', {
          exampleValue: customVariables[k].example
        })]);
      }

      const resolution = "".concat(window.screen.width, "x").concat(window.screen.height);
      const otherVariables = [{
        expl: (0, _languageHandler._td)('Every page you use in the app'),
        value: (0, _languageHandler._t)('e.g. <CurrentPageURL>', {}, {
          CurrentPageURL: getRedactedUrl()
        })
      }, {
        expl: (0, _languageHandler._td)('Your user agent'),
        value: navigator.userAgent
      }, {
        expl: (0, _languageHandler._td)('Your device resolution'),
        value: resolution
      }];
      const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

      _Modal.default.createTrackedDialog('Analytics Details', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Analytics'),
        description: /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AnalyticsModal"
        }, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('The information being sent to us to help make Riot better includes:')), /*#__PURE__*/_react.default.createElement("table", null, rows.map(row => /*#__PURE__*/_react.default.createElement("tr", {
          key: row[0]
        }, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)(customVariables[row[0]].expl)), row[1] !== undefined && /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, row[1])))), otherVariables.map((item, index) => /*#__PURE__*/_react.default.createElement("tr", {
          key: index
        }, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)(item.expl)), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, item.value))))), /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('Where this page includes identifiable information, such as a room, ' + 'user or group ID, that data is removed before being sent to the server.')))
      });
    });
    this.baseUrl = null;
    this.siteId = null;
    this.visitVariables = {};
    this.firstPage = true;
    this._heartbeatIntervalID = null;
    this.creationTs = localStorage && localStorage.getItem(CREATION_TS_KEY);

    if (!this.creationTs && localStorage) {
      localStorage.setItem(CREATION_TS_KEY, this.creationTs = new Date().getTime());
    }

    this.lastVisitTs = localStorage && localStorage.getItem(LAST_VISIT_TS_KEY);
    this.visitCount = localStorage && localStorage.getItem(VISIT_COUNT_KEY) || 0;

    if (localStorage) {
      localStorage.setItem(VISIT_COUNT_KEY, parseInt(this.visitCount, 10) + 1);
    }
  }

  get disabled() {
    return !this.baseUrl;
  }
  /**
   * Enable Analytics if initialized but disabled
   * otherwise try and initalize, no-op if piwik config missing
   */


  async enable() {
    if (!this.disabled) return;

    const config = _SdkConfig.default.get();

    if (!config || !config.piwik || !config.piwik.url || !config.piwik.siteId) return;
    this.baseUrl = new URL("piwik.php", config.piwik.url); // set constants

    this.baseUrl.searchParams.set("rec", 1); // rec is required for tracking

    this.baseUrl.searchParams.set("idsite", config.piwik.siteId); // rec is required for tracking

    this.baseUrl.searchParams.set("apiv", 1); // API version to use

    this.baseUrl.searchParams.set("send_image", 0); // we want a 204, not a tiny GIF
    // set user parameters

    this.baseUrl.searchParams.set("_id", getUid()); // uuid

    this.baseUrl.searchParams.set("_idts", this.creationTs); // first ts

    this.baseUrl.searchParams.set("_idvc", parseInt(this.visitCount, 10) + 1); // visit count

    if (this.lastVisitTs) {
      this.baseUrl.searchParams.set("_viewts", this.lastVisitTs); // last visit ts
    }

    const platform = _PlatformPeg.default.get();

    this._setVisitVariable('App Platform', platform.getHumanReadableName());

    try {
      this._setVisitVariable('App Version', (await platform.getAppVersion()));
    } catch (e) {
      this._setVisitVariable('App Version', 'unknown');
    }

    this._setVisitVariable('Chosen Language', (0, _languageHandler.getCurrentLanguage)());

    if (window.location.hostname === 'riot.im') {
      this._setVisitVariable('Instance', window.location.pathname);
    }

    let installedPWA = "unknown";

    try {
      // Known to work at least for desktop Chrome
      installedPWA = window.matchMedia('(display-mode: standalone)').matches;
    } catch (e) {}

    this._setVisitVariable('Installed PWA', installedPWA);

    let touchInput = "unknown";

    try {
      // MDN claims broad support across browsers
      touchInput = window.matchMedia('(pointer: coarse)').matches;
    } catch (e) {}

    this._setVisitVariable('Touch Input', touchInput); // start heartbeat


    this._heartbeatIntervalID = window.setInterval(this.ping.bind(this), HEARTBEAT_INTERVAL);
  }
  /**
   * Disable Analytics, stop the heartbeat and clear identifiers from localStorage
   */


  disable() {
    if (this.disabled) return;
    this.trackEvent('Analytics', 'opt-out');
    window.clearInterval(this._heartbeatIntervalID);
    this.baseUrl = null;
    this.visitVariables = {};
    localStorage.removeItem(UID_KEY);
    localStorage.removeItem(CREATION_TS_KEY);
    localStorage.removeItem(VISIT_COUNT_KEY);
    localStorage.removeItem(LAST_VISIT_TS_KEY);
  }

  async _track(data) {
    if (this.disabled) return;
    const now = new Date();

    const params = _objectSpread({}, data, {
      url: getRedactedUrl(),
      _cvar: JSON.stringify(this.visitVariables),
      // user custom vars
      res: "".concat(window.screen.width, "x").concat(window.screen.height),
      // resolution as WWWWxHHHH
      rand: String(Math.random()).slice(2, 8),
      // random nonce to cache-bust
      h: now.getHours(),
      m: now.getMinutes(),
      s: now.getSeconds()
    });

    const url = new URL(this.baseUrl);

    for (const key in params) {
      url.searchParams.set(key, params[key]);
    }

    try {
      await window.fetch(url, {
        method: "GET",
        mode: "no-cors",
        cache: "no-cache",
        redirect: "follow"
      });
    } catch (e) {
      console.error("Analytics error: ", e);
    }
  }

  ping() {
    this._track({
      ping: 1
    });

    localStorage.setItem(LAST_VISIT_TS_KEY, new Date().getTime()); // update last visit ts
  }

  trackPageChange(generationTimeMs) {
    if (this.disabled) return;

    if (this.firstPage) {
      // De-duplicate first page
      // router seems to hit the fn twice
      this.firstPage = false;
      return;
    }

    if (typeof generationTimeMs !== 'number') {
      console.warn('Analytics.trackPageChange: expected generationTimeMs to be a number'); // But continue anyway because we still want to track the change
    }

    this._track({
      gt_ms: generationTimeMs
    });
  }

  trackEvent(category, action, name, value) {
    if (this.disabled) return;

    this._track({
      e_c: category,
      e_a: action,
      e_n: name,
      e_v: value
    });
  }

  _setVisitVariable(key, value) {
    if (this.disabled) return;
    this.visitVariables[customVariables[key].id] = [key, value];
  }

  setLoggedIn(isGuest, homeserverUrl, identityServerUrl) {
    if (this.disabled) return;

    const config = _SdkConfig.default.get();

    if (!config.piwik) return;
    const whitelistedHSUrls = config.piwik.whitelistedHSUrls || [];

    this._setVisitVariable('User Type', isGuest ? 'Guest' : 'Logged In');

    this._setVisitVariable('Homeserver URL', whitelistRedact(whitelistedHSUrls, homeserverUrl));
  }

  setBreadcrumbs(state) {
    if (this.disabled) return;

    this._setVisitVariable('Breadcrumbs', state ? 'enabled' : 'disabled');
  }

}

if (!global.mxAnalytics) {
  global.mxAnalytics = new Analytics();
}

var _default = global.mxAnalytics;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BbmFseXRpY3MuanMiXSwibmFtZXMiOlsiaGFzaFJlZ2V4IiwiaGFzaFZhclJlZ2V4IiwiZ2V0UmVkYWN0ZWRIYXNoIiwiaGFzaCIsIm1hdGNoIiwiZXhlYyIsImNvbnNvbGUiLCJ3YXJuIiwidGVzdCIsInJlcGxhY2UiLCJnZXRSZWRhY3RlZFVybCIsIm9yaWdpbiIsIndpbmRvdyIsImxvY2F0aW9uIiwicGF0aG5hbWUiLCJzdGFydHNXaXRoIiwiY3VzdG9tVmFyaWFibGVzIiwiaWQiLCJleHBsIiwiZXhhbXBsZSIsIndoaXRlbGlzdFJlZGFjdCIsIndoaXRlbGlzdCIsInN0ciIsImluY2x1ZGVzIiwiVUlEX0tFWSIsIkNSRUFUSU9OX1RTX0tFWSIsIlZJU0lUX0NPVU5UX0tFWSIsIkxBU1RfVklTSVRfVFNfS0VZIiwiZ2V0VWlkIiwiZGF0YSIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzZXRJdGVtIiwiQXJyYXkiLCJtYXAiLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJqb2luIiwiZSIsImVycm9yIiwiSEVBUlRCRUFUX0lOVEVSVkFMIiwiQW5hbHl0aWNzIiwiY29uc3RydWN0b3IiLCJyb3dzIiwiZGlzYWJsZWQiLCJPYmplY3QiLCJ2YWx1ZXMiLCJ2aXNpdFZhcmlhYmxlcyIsImtleXMiLCJrIiwiZXhhbXBsZVZhbHVlIiwicmVzb2x1dGlvbiIsInNjcmVlbiIsIndpZHRoIiwiaGVpZ2h0Iiwib3RoZXJWYXJpYWJsZXMiLCJ2YWx1ZSIsIkN1cnJlbnRQYWdlVVJMIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwicm93IiwidW5kZWZpbmVkIiwiaXRlbSIsImluZGV4IiwiYmFzZVVybCIsInNpdGVJZCIsImZpcnN0UGFnZSIsIl9oZWFydGJlYXRJbnRlcnZhbElEIiwiY3JlYXRpb25UcyIsIkRhdGUiLCJnZXRUaW1lIiwibGFzdFZpc2l0VHMiLCJ2aXNpdENvdW50IiwicGFyc2VJbnQiLCJlbmFibGUiLCJjb25maWciLCJTZGtDb25maWciLCJnZXQiLCJwaXdpayIsInVybCIsIlVSTCIsInNlYXJjaFBhcmFtcyIsInNldCIsInBsYXRmb3JtIiwiUGxhdGZvcm1QZWciLCJfc2V0VmlzaXRWYXJpYWJsZSIsImdldEh1bWFuUmVhZGFibGVOYW1lIiwiZ2V0QXBwVmVyc2lvbiIsImhvc3RuYW1lIiwiaW5zdGFsbGVkUFdBIiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJ0b3VjaElucHV0Iiwic2V0SW50ZXJ2YWwiLCJwaW5nIiwiYmluZCIsImRpc2FibGUiLCJ0cmFja0V2ZW50IiwiY2xlYXJJbnRlcnZhbCIsInJlbW92ZUl0ZW0iLCJfdHJhY2siLCJub3ciLCJwYXJhbXMiLCJfY3ZhciIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXMiLCJyYW5kIiwiU3RyaW5nIiwic2xpY2UiLCJoIiwiZ2V0SG91cnMiLCJtIiwiZ2V0TWludXRlcyIsInMiLCJnZXRTZWNvbmRzIiwia2V5IiwiZmV0Y2giLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJyZWRpcmVjdCIsInRyYWNrUGFnZUNoYW5nZSIsImdlbmVyYXRpb25UaW1lTXMiLCJndF9tcyIsImNhdGVnb3J5IiwiYWN0aW9uIiwibmFtZSIsImVfYyIsImVfYSIsImVfbiIsImVfdiIsInNldExvZ2dlZEluIiwiaXNHdWVzdCIsImhvbWVzZXJ2ZXJVcmwiLCJpZGVudGl0eVNlcnZlclVybCIsIndoaXRlbGlzdGVkSFNVcmxzIiwic2V0QnJlYWRjcnVtYnMiLCJzdGF0ZSIsImdsb2JhbCIsIm14QW5hbHl0aWNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUcsK0VBQWxCO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLDJCQUFyQixDLENBRUE7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LEdBQXFCLElBQUkxRyxTQUFKLEVBQXJCO0FBQ0g7O2VBQ2N5RyxNQUFNLENBQUNDLFciLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCB7IGdldEN1cnJlbnRMYW5ndWFnZSwgX3QsIF90ZCB9IGZyb20gJy4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBQbGF0Zm9ybVBlZyBmcm9tICcuL1BsYXRmb3JtUGVnJztcbmltcG9ydCBTZGtDb25maWcgZnJvbSAnLi9TZGtDb25maWcnO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4vTW9kYWwnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4vaW5kZXgnO1xuXG5jb25zdCBoYXNoUmVnZXggPSAvI1xcLyhncm91cHM/fHJvb218dXNlcnxzZXR0aW5nc3xyZWdpc3Rlcnxsb2dpbnxmb3Jnb3RfcGFzc3dvcmR8aG9tZXxkaXJlY3RvcnkpLztcbmNvbnN0IGhhc2hWYXJSZWdleCA9IC8jXFwvKGdyb3VwfHJvb218dXNlcilcXC8uKiQvO1xuXG4vLyBSZW1vdmUgYWxsIGJ1dCB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgaGFzaCBwYXRoLiBSZWRhY3QgdW5leHBlY3RlZCBoYXNoZXMuXG5mdW5jdGlvbiBnZXRSZWRhY3RlZEhhc2goaGFzaCkge1xuICAgIC8vIERvbid0IGxlYWsgVVJMcyB3ZSBhcmVuJ3QgZXhwZWN0aW5nIC0gdGhleSBjb3VsZCBjb250YWluIHRva2Vucy9QSUlcbiAgICBjb25zdCBtYXRjaCA9IGhhc2hSZWdleC5leGVjKGhhc2gpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBVbmV4cGVjdGVkIGhhc2ggbG9jYXRpb24gXCIke2hhc2h9XCJgKTtcbiAgICAgICAgcmV0dXJuICcjLzx1bmV4cGVjdGVkIGhhc2ggbG9jYXRpb24+JztcbiAgICB9XG5cbiAgICBpZiAoaGFzaFZhclJlZ2V4LnRlc3QoaGFzaCkpIHtcbiAgICAgICAgcmV0dXJuIGhhc2gucmVwbGFjZShoYXNoVmFyUmVnZXgsIFwiIy8kMS88cmVkYWN0ZWQ+XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoLnJlcGxhY2UoaGFzaFJlZ2V4LCBcIiMvJDFcIik7XG59XG5cbi8vIFJldHVybiB0aGUgY3VycmVudCBvcmlnaW4sIHBhdGggYW5kIGhhc2ggc2VwYXJhdGVkIHdpdGggYSBgL2AuIFRoaXMgZG9lc1xuLy8gbm90IGluY2x1ZGUgcXVlcnkgcGFyYW1ldGVycy5cbmZ1bmN0aW9uIGdldFJlZGFjdGVkVXJsKCkge1xuICAgIGNvbnN0IHsgb3JpZ2luLCBoYXNoIH0gPSB3aW5kb3cubG9jYXRpb247XG4gICAgbGV0IHsgcGF0aG5hbWUgfSA9IHdpbmRvdy5sb2NhdGlvbjtcblxuICAgIC8vIFJlZGFjdCBwYXRocyB3aGljaCBjb3VsZCBjb250YWluIHVuZXhwZWN0ZWQgUElJXG4gICAgaWYgKG9yaWdpbi5zdGFydHNXaXRoKCdmaWxlOi8vJykpIHtcbiAgICAgICAgcGF0aG5hbWUgPSBcIi88cmVkYWN0ZWQ+L1wiO1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnaW4gKyBwYXRobmFtZSArIGdldFJlZGFjdGVkSGFzaChoYXNoKTtcbn1cblxuY29uc3QgY3VzdG9tVmFyaWFibGVzID0ge1xuICAgIC8vIFRoZSBNYXRvbW8gaW5zdGFsbGF0aW9uIGF0IGh0dHBzOi8vbWF0b21vLnJpb3QuaW0gaXMgY3VycmVudGx5IGNvbmZpZ3VyZWRcbiAgICAvLyB3aXRoIGEgbGltaXQgb2YgMTAgY3VzdG9tIHZhcmlhYmxlcy5cbiAgICAnQXBwIFBsYXRmb3JtJzoge1xuICAgICAgICBpZDogMSxcbiAgICAgICAgZXhwbDogX3RkKCdUaGUgcGxhdGZvcm0geW91XFwncmUgb24nKSxcbiAgICAgICAgZXhhbXBsZTogJ0VsZWN0cm9uIFBsYXRmb3JtJyxcbiAgICB9LFxuICAgICdBcHAgVmVyc2lvbic6IHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIGV4cGw6IF90ZCgnVGhlIHZlcnNpb24gb2YgUmlvdCcpLFxuICAgICAgICBleGFtcGxlOiAnMTUuMC4wJyxcbiAgICB9LFxuICAgICdVc2VyIFR5cGUnOiB7XG4gICAgICAgIGlkOiAzLFxuICAgICAgICBleHBsOiBfdGQoJ1doZXRoZXIgb3Igbm90IHlvdVxcJ3JlIGxvZ2dlZCBpbiAod2UgZG9uXFwndCByZWNvcmQgeW91ciB1c2VybmFtZSknKSxcbiAgICAgICAgZXhhbXBsZTogJ0xvZ2dlZCBJbicsXG4gICAgfSxcbiAgICAnQ2hvc2VuIExhbmd1YWdlJzoge1xuICAgICAgICBpZDogNCxcbiAgICAgICAgZXhwbDogX3RkKCdZb3VyIGxhbmd1YWdlIG9mIGNob2ljZScpLFxuICAgICAgICBleGFtcGxlOiAnZW4nLFxuICAgIH0sXG4gICAgJ0luc3RhbmNlJzoge1xuICAgICAgICBpZDogNSxcbiAgICAgICAgZXhwbDogX3RkKCdXaGljaCBvZmZpY2lhbGx5IHByb3ZpZGVkIGluc3RhbmNlIHlvdSBhcmUgdXNpbmcsIGlmIGFueScpLFxuICAgICAgICBleGFtcGxlOiAnYXBwJyxcbiAgICB9LFxuICAgICdSVEU6IFVzZXMgUmljaHRleHQgTW9kZSc6IHtcbiAgICAgICAgaWQ6IDYsXG4gICAgICAgIGV4cGw6IF90ZCgnV2hldGhlciBvciBub3QgeW91XFwncmUgdXNpbmcgdGhlIFJpY2h0ZXh0IG1vZGUgb2YgdGhlIFJpY2ggVGV4dCBFZGl0b3InKSxcbiAgICAgICAgZXhhbXBsZTogJ29mZicsXG4gICAgfSxcbiAgICAnSG9tZXNlcnZlciBVUkwnOiB7XG4gICAgICAgIGlkOiA3LFxuICAgICAgICBleHBsOiBfdGQoJ1lvdXIgaG9tZXNlcnZlclxcJ3MgVVJMJyksXG4gICAgICAgIGV4YW1wbGU6ICdodHRwczovL21hdHJpeC5vcmcnLFxuICAgIH0sXG4gICAgJ1RvdWNoIElucHV0Jzoge1xuICAgICAgICBpZDogOCxcbiAgICAgICAgZXhwbDogX3RkKFwiV2hldGhlciB5b3UncmUgdXNpbmcgUmlvdCBvbiBhIGRldmljZSB3aGVyZSB0b3VjaCBpcyB0aGUgcHJpbWFyeSBpbnB1dCBtZWNoYW5pc21cIiksXG4gICAgICAgIGV4YW1wbGU6ICdmYWxzZScsXG4gICAgfSxcbiAgICAnQnJlYWRjcnVtYnMnOiB7XG4gICAgICAgIGlkOiA5LFxuICAgICAgICBleHBsOiBfdGQoXCJXaGV0aGVyIG9yIG5vdCB5b3UncmUgdXNpbmcgdGhlICdicmVhZGNydW1icycgZmVhdHVyZSAoYXZhdGFycyBhYm92ZSB0aGUgcm9vbSBsaXN0KVwiKSxcbiAgICAgICAgZXhhbXBsZTogJ2Rpc2FibGVkJyxcbiAgICB9LFxuICAgICdJbnN0YWxsZWQgUFdBJzoge1xuICAgICAgICBpZDogMTAsXG4gICAgICAgIGV4cGw6IF90ZChcIldoZXRoZXIgeW91J3JlIHVzaW5nIFJpb3QgYXMgYW4gaW5zdGFsbGVkIFByb2dyZXNzaXZlIFdlYiBBcHBcIiksXG4gICAgICAgIGV4YW1wbGU6ICdmYWxzZScsXG4gICAgfSxcbn07XG5cbmZ1bmN0aW9uIHdoaXRlbGlzdFJlZGFjdCh3aGl0ZWxpc3QsIHN0cikge1xuICAgIGlmICh3aGl0ZWxpc3QuaW5jbHVkZXMoc3RyKSkgcmV0dXJuIHN0cjtcbiAgICByZXR1cm4gJzxyZWRhY3RlZD4nO1xufVxuXG5jb25zdCBVSURfS0VZID0gXCJteF9SaW90X0FuYWx5dGljc191aWRcIjtcbmNvbnN0IENSRUFUSU9OX1RTX0tFWSA9IFwibXhfUmlvdF9BbmFseXRpY3NfY3RzXCI7XG5jb25zdCBWSVNJVF9DT1VOVF9LRVkgPSBcIm14X1Jpb3RfQW5hbHl0aWNzX3ZjXCI7XG5jb25zdCBMQVNUX1ZJU0lUX1RTX0tFWSA9IFwibXhfUmlvdF9BbmFseXRpY3NfbHZ0c1wiO1xuXG5mdW5jdGlvbiBnZXRVaWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IGRhdGEgPSBsb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oVUlEX0tFWSk7XG4gICAgICAgIGlmICghZGF0YSAmJiBsb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFVJRF9LRVksIGRhdGEgPSBbLi4uQXJyYXkoMTYpXS5tYXAoKCkgPT4gTWF0aC5yYW5kb20oKS50b1N0cmluZygxNilbMl0pLmpvaW4oJycpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBbmFseXRpY3MgZXJyb3I6IFwiLCBlKTtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxufVxuXG5jb25zdCBIRUFSVEJFQVRfSU5URVJWQUwgPSAzMCAqIDEwMDA7IC8vIHNlY29uZHNcblxuY2xhc3MgQW5hbHl0aWNzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaXRlSWQgPSBudWxsO1xuICAgICAgICB0aGlzLnZpc2l0VmFyaWFibGVzID0ge307XG5cbiAgICAgICAgdGhpcy5maXJzdFBhZ2UgPSB0cnVlO1xuICAgICAgICB0aGlzLl9oZWFydGJlYXRJbnRlcnZhbElEID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0aW9uVHMgPSBsb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oQ1JFQVRJT05fVFNfS0VZKTtcbiAgICAgICAgaWYgKCF0aGlzLmNyZWF0aW9uVHMgJiYgbG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDUkVBVElPTl9UU19LRVksIHRoaXMuY3JlYXRpb25UcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGFzdFZpc2l0VHMgPSBsb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oTEFTVF9WSVNJVF9UU19LRVkpO1xuICAgICAgICB0aGlzLnZpc2l0Q291bnQgPSBsb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oVklTSVRfQ09VTlRfS0VZKSB8fCAwO1xuICAgICAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShWSVNJVF9DT1VOVF9LRVksIHBhcnNlSW50KHRoaXMudmlzaXRDb3VudCwgMTApICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgZGlzYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5iYXNlVXJsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBBbmFseXRpY3MgaWYgaW5pdGlhbGl6ZWQgYnV0IGRpc2FibGVkXG4gICAgICogb3RoZXJ3aXNlIHRyeSBhbmQgaW5pdGFsaXplLCBuby1vcCBpZiBwaXdpayBjb25maWcgbWlzc2luZ1xuICAgICAqL1xuICAgIGFzeW5jIGVuYWJsZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgY29uZmlnID0gU2RrQ29uZmlnLmdldCgpO1xuICAgICAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLnBpd2lrIHx8ICFjb25maWcucGl3aWsudXJsIHx8ICFjb25maWcucGl3aWsuc2l0ZUlkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5iYXNlVXJsID0gbmV3IFVSTChcInBpd2lrLnBocFwiLCBjb25maWcucGl3aWsudXJsKTtcbiAgICAgICAgLy8gc2V0IGNvbnN0YW50c1xuICAgICAgICB0aGlzLmJhc2VVcmwuc2VhcmNoUGFyYW1zLnNldChcInJlY1wiLCAxKTsgLy8gcmVjIGlzIHJlcXVpcmVkIGZvciB0cmFja2luZ1xuICAgICAgICB0aGlzLmJhc2VVcmwuc2VhcmNoUGFyYW1zLnNldChcImlkc2l0ZVwiLCBjb25maWcucGl3aWsuc2l0ZUlkKTsgLy8gcmVjIGlzIHJlcXVpcmVkIGZvciB0cmFja2luZ1xuICAgICAgICB0aGlzLmJhc2VVcmwuc2VhcmNoUGFyYW1zLnNldChcImFwaXZcIiwgMSk7IC8vIEFQSSB2ZXJzaW9uIHRvIHVzZVxuICAgICAgICB0aGlzLmJhc2VVcmwuc2VhcmNoUGFyYW1zLnNldChcInNlbmRfaW1hZ2VcIiwgMCk7IC8vIHdlIHdhbnQgYSAyMDQsIG5vdCBhIHRpbnkgR0lGXG4gICAgICAgIC8vIHNldCB1c2VyIHBhcmFtZXRlcnNcbiAgICAgICAgdGhpcy5iYXNlVXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJfaWRcIiwgZ2V0VWlkKCkpOyAvLyB1dWlkXG4gICAgICAgIHRoaXMuYmFzZVVybC5zZWFyY2hQYXJhbXMuc2V0KFwiX2lkdHNcIiwgdGhpcy5jcmVhdGlvblRzKTsgLy8gZmlyc3QgdHNcbiAgICAgICAgdGhpcy5iYXNlVXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJfaWR2Y1wiLCBwYXJzZUludCh0aGlzLnZpc2l0Q291bnQsIDEwKSsgMSk7IC8vIHZpc2l0IGNvdW50XG4gICAgICAgIGlmICh0aGlzLmxhc3RWaXNpdFRzKSB7XG4gICAgICAgICAgICB0aGlzLmJhc2VVcmwuc2VhcmNoUGFyYW1zLnNldChcIl92aWV3dHNcIiwgdGhpcy5sYXN0VmlzaXRUcyk7IC8vIGxhc3QgdmlzaXQgdHNcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBsYXRmb3JtID0gUGxhdGZvcm1QZWcuZ2V0KCk7XG4gICAgICAgIHRoaXMuX3NldFZpc2l0VmFyaWFibGUoJ0FwcCBQbGF0Zm9ybScsIHBsYXRmb3JtLmdldEh1bWFuUmVhZGFibGVOYW1lKCkpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fc2V0VmlzaXRWYXJpYWJsZSgnQXBwIFZlcnNpb24nLCBhd2FpdCBwbGF0Zm9ybS5nZXRBcHBWZXJzaW9uKCkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRWaXNpdFZhcmlhYmxlKCdBcHAgVmVyc2lvbicsICd1bmtub3duJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zZXRWaXNpdFZhcmlhYmxlKCdDaG9zZW4gTGFuZ3VhZ2UnLCBnZXRDdXJyZW50TGFuZ3VhZ2UoKSk7XG5cbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ3Jpb3QuaW0nKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRWaXNpdFZhcmlhYmxlKCdJbnN0YW5jZScsIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5zdGFsbGVkUFdBID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBLbm93biB0byB3b3JrIGF0IGxlYXN0IGZvciBkZXNrdG9wIENocm9tZVxuICAgICAgICAgICAgaW5zdGFsbGVkUFdBID0gd2luZG93Lm1hdGNoTWVkaWEoJyhkaXNwbGF5LW1vZGU6IHN0YW5kYWxvbmUpJykubWF0Y2hlcztcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgIHRoaXMuX3NldFZpc2l0VmFyaWFibGUoJ0luc3RhbGxlZCBQV0EnLCBpbnN0YWxsZWRQV0EpO1xuXG4gICAgICAgIGxldCB0b3VjaElucHV0ID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBNRE4gY2xhaW1zIGJyb2FkIHN1cHBvcnQgYWNyb3NzIGJyb3dzZXJzXG4gICAgICAgICAgICB0b3VjaElucHV0ID0gd2luZG93Lm1hdGNoTWVkaWEoJyhwb2ludGVyOiBjb2Fyc2UpJykubWF0Y2hlcztcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgIHRoaXMuX3NldFZpc2l0VmFyaWFibGUoJ1RvdWNoIElucHV0JywgdG91Y2hJbnB1dCk7XG5cbiAgICAgICAgLy8gc3RhcnQgaGVhcnRiZWF0XG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdEludGVydmFsSUQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwodGhpcy5waW5nLmJpbmQodGhpcyksIEhFQVJUQkVBVF9JTlRFUlZBTCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBBbmFseXRpY3MsIHN0b3AgdGhlIGhlYXJ0YmVhdCBhbmQgY2xlYXIgaWRlbnRpZmllcnMgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICAgKi9cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLnRyYWNrRXZlbnQoJ0FuYWx5dGljcycsICdvcHQtb3V0Jyk7XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2hlYXJ0YmVhdEludGVydmFsSUQpO1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSBudWxsO1xuICAgICAgICB0aGlzLnZpc2l0VmFyaWFibGVzID0ge307XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFVJRF9LRVkpO1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShDUkVBVElPTl9UU19LRVkpO1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShWSVNJVF9DT1VOVF9LRVkpO1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShMQVNUX1ZJU0lUX1RTX0tFWSk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3RyYWNrKGRhdGEpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcblxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgICAgICAuLi5kYXRhLFxuICAgICAgICAgICAgdXJsOiBnZXRSZWRhY3RlZFVybCgpLFxuXG4gICAgICAgICAgICBfY3ZhcjogSlNPTi5zdHJpbmdpZnkodGhpcy52aXNpdFZhcmlhYmxlcyksIC8vIHVzZXIgY3VzdG9tIHZhcnNcbiAgICAgICAgICAgIHJlczogYCR7d2luZG93LnNjcmVlbi53aWR0aH14JHt3aW5kb3cuc2NyZWVuLmhlaWdodH1gLCAvLyByZXNvbHV0aW9uIGFzIFdXV1d4SEhISFxuICAgICAgICAgICAgcmFuZDogU3RyaW5nKE1hdGgucmFuZG9tKCkpLnNsaWNlKDIsIDgpLCAvLyByYW5kb20gbm9uY2UgdG8gY2FjaGUtYnVzdFxuICAgICAgICAgICAgaDogbm93LmdldEhvdXJzKCksXG4gICAgICAgICAgICBtOiBub3cuZ2V0TWludXRlcygpLFxuICAgICAgICAgICAgczogbm93LmdldFNlY29uZHMoKSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHRoaXMuYmFzZVVybCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHBhcmFtcykge1xuICAgICAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoa2V5LCBwYXJhbXNba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgd2luZG93LmZldGNoKHVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICBtb2RlOiBcIm5vLWNvcnNcIixcbiAgICAgICAgICAgICAgICBjYWNoZTogXCJuby1jYWNoZVwiLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBbmFseXRpY3MgZXJyb3I6IFwiLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBpbmcoKSB7XG4gICAgICAgIHRoaXMuX3RyYWNrKHtcbiAgICAgICAgICAgIHBpbmc6IDEsXG4gICAgICAgIH0pO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMQVNUX1ZJU0lUX1RTX0tFWSwgbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAvLyB1cGRhdGUgbGFzdCB2aXNpdCB0c1xuICAgIH1cblxuICAgIHRyYWNrUGFnZUNoYW5nZShnZW5lcmF0aW9uVGltZU1zKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmZpcnN0UGFnZSkge1xuICAgICAgICAgICAgLy8gRGUtZHVwbGljYXRlIGZpcnN0IHBhZ2VcbiAgICAgICAgICAgIC8vIHJvdXRlciBzZWVtcyB0byBoaXQgdGhlIGZuIHR3aWNlXG4gICAgICAgICAgICB0aGlzLmZpcnN0UGFnZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBnZW5lcmF0aW9uVGltZU1zICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBbmFseXRpY3MudHJhY2tQYWdlQ2hhbmdlOiBleHBlY3RlZCBnZW5lcmF0aW9uVGltZU1zIHRvIGJlIGEgbnVtYmVyJyk7XG4gICAgICAgICAgICAvLyBCdXQgY29udGludWUgYW55d2F5IGJlY2F1c2Ugd2Ugc3RpbGwgd2FudCB0byB0cmFjayB0aGUgY2hhbmdlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cmFjayh7XG4gICAgICAgICAgICBndF9tczogZ2VuZXJhdGlvblRpbWVNcyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdHJhY2tFdmVudChjYXRlZ29yeSwgYWN0aW9uLCBuYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl90cmFjayh7XG4gICAgICAgICAgICBlX2M6IGNhdGVnb3J5LFxuICAgICAgICAgICAgZV9hOiBhY3Rpb24sXG4gICAgICAgICAgICBlX246IG5hbWUsXG4gICAgICAgICAgICBlX3Y6IHZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfc2V0VmlzaXRWYXJpYWJsZShrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMudmlzaXRWYXJpYWJsZXNbY3VzdG9tVmFyaWFibGVzW2tleV0uaWRdID0gW2tleSwgdmFsdWVdO1xuICAgIH1cblxuICAgIHNldExvZ2dlZEluKGlzR3Vlc3QsIGhvbWVzZXJ2ZXJVcmwsIGlkZW50aXR5U2VydmVyVXJsKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgY29uZmlnID0gU2RrQ29uZmlnLmdldCgpO1xuICAgICAgICBpZiAoIWNvbmZpZy5waXdpaykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHdoaXRlbGlzdGVkSFNVcmxzID0gY29uZmlnLnBpd2lrLndoaXRlbGlzdGVkSFNVcmxzIHx8IFtdO1xuXG4gICAgICAgIHRoaXMuX3NldFZpc2l0VmFyaWFibGUoJ1VzZXIgVHlwZScsIGlzR3Vlc3QgPyAnR3Vlc3QnIDogJ0xvZ2dlZCBJbicpO1xuICAgICAgICB0aGlzLl9zZXRWaXNpdFZhcmlhYmxlKCdIb21lc2VydmVyIFVSTCcsIHdoaXRlbGlzdFJlZGFjdCh3aGl0ZWxpc3RlZEhTVXJscywgaG9tZXNlcnZlclVybCkpO1xuICAgIH1cblxuICAgIHNldEJyZWFkY3J1bWJzKHN0YXRlKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3NldFZpc2l0VmFyaWFibGUoJ0JyZWFkY3J1bWJzJywgc3RhdGUgPyAnZW5hYmxlZCcgOiAnZGlzYWJsZWQnKTtcbiAgICB9XG5cbiAgICBzaG93RGV0YWlsc01vZGFsID0gKCkgPT4ge1xuICAgICAgICBsZXQgcm93cyA9IFtdO1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHJvd3MgPSBPYmplY3QudmFsdWVzKHRoaXMudmlzaXRWYXJpYWJsZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm93cyA9IE9iamVjdC5rZXlzKGN1c3RvbVZhcmlhYmxlcykubWFwKFxuICAgICAgICAgICAgICAgIChrKSA9PiBbXG4gICAgICAgICAgICAgICAgICAgIGssXG4gICAgICAgICAgICAgICAgICAgIF90KCdlLmcuICUoZXhhbXBsZVZhbHVlKXMnLCB7IGV4YW1wbGVWYWx1ZTogY3VzdG9tVmFyaWFibGVzW2tdLmV4YW1wbGUgfSksXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXNvbHV0aW9uID0gYCR7d2luZG93LnNjcmVlbi53aWR0aH14JHt3aW5kb3cuc2NyZWVuLmhlaWdodH1gO1xuICAgICAgICBjb25zdCBvdGhlclZhcmlhYmxlcyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBleHBsOiBfdGQoJ0V2ZXJ5IHBhZ2UgeW91IHVzZSBpbiB0aGUgYXBwJyksXG4gICAgICAgICAgICAgICAgdmFsdWU6IF90KFxuICAgICAgICAgICAgICAgICAgICAnZS5nLiA8Q3VycmVudFBhZ2VVUkw+JyxcbiAgICAgICAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEN1cnJlbnRQYWdlVVJMOiBnZXRSZWRhY3RlZFVybCgpLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyBleHBsOiBfdGQoJ1lvdXIgdXNlciBhZ2VudCcpLCB2YWx1ZTogbmF2aWdhdG9yLnVzZXJBZ2VudCB9LFxuICAgICAgICAgICAgeyBleHBsOiBfdGQoJ1lvdXIgZGV2aWNlIHJlc29sdXRpb24nKSwgdmFsdWU6IHJlc29sdXRpb24gfSxcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQW5hbHl0aWNzIERldGFpbHMnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdCgnQW5hbHl0aWNzJyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogPGRpdiBjbGFzc05hbWU9XCJteF9BbmFseXRpY3NNb2RhbFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1RoZSBpbmZvcm1hdGlvbiBiZWluZyBzZW50IHRvIHVzIHRvIGhlbHAgbWFrZSBSaW90IGJldHRlciBpbmNsdWRlczonKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICB7IHJvd3MubWFwKChyb3cpID0+IDx0ciBrZXk9e3Jvd1swXX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+eyBfdChjdXN0b21WYXJpYWJsZXNbcm93WzBdXS5leHBsKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgcm93WzFdICE9PSB1bmRlZmluZWQgJiYgPHRkPjxjb2RlPnsgcm93WzFdIH08L2NvZGU+PC90ZD4gfVxuICAgICAgICAgICAgICAgICAgICA8L3RyPikgfVxuICAgICAgICAgICAgICAgICAgICB7IG90aGVyVmFyaWFibGVzLm1hcCgoaXRlbSwgaW5kZXgpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoaXRlbS5leHBsKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+eyBpdGVtLnZhbHVlIH08L2NvZGU+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1doZXJlIHRoaXMgcGFnZSBpbmNsdWRlcyBpZGVudGlmaWFibGUgaW5mb3JtYXRpb24sIHN1Y2ggYXMgYSByb29tLCAnXG4gICAgICAgICAgICAgICAgICAgICAgICArICd1c2VyIG9yIGdyb3VwIElELCB0aGF0IGRhdGEgaXMgcmVtb3ZlZCBiZWZvcmUgYmVpbmcgc2VudCB0byB0aGUgc2VydmVyLicpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PixcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuaWYgKCFnbG9iYWwubXhBbmFseXRpY3MpIHtcbiAgICBnbG9iYWwubXhBbmFseXRpY3MgPSBuZXcgQW5hbHl0aWNzKCk7XG59XG5leHBvcnQgZGVmYXVsdCBnbG9iYWwubXhBbmFseXRpY3M7XG4iXX0=