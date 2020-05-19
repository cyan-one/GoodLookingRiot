"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sendBugReport;

var _pako = _interopRequireDefault(require("pako"));

var _MatrixClientPeg = require("../MatrixClientPeg");

var _PlatformPeg = _interopRequireDefault(require("../PlatformPeg"));

var _languageHandler = require("../languageHandler");

var rageshake = _interopRequireWildcard(require("./rageshake"));

var TextEncodingUtf8 = _interopRequireWildcard(require("text-encoding-utf-8"));

var _SettingsStore = _interopRequireDefault(require("../settings/SettingsStore"));

/*
Copyright 2017 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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
// polyfill textencoder if necessary
let TextEncoder = window.TextEncoder;

if (!TextEncoder) {
  TextEncoder = TextEncodingUtf8.TextEncoder;
}

/**
 * Send a bug report.
 *
 * @param {string} bugReportEndpoint HTTP url to send the report to
 *
 * @param {object} opts optional dictionary of options
 *
 * @param {string} opts.userText Any additional user input.
 *
 * @param {boolean} opts.sendLogs True to send logs
 *
 * @param {function(string)} opts.progressCallback Callback to call with progress updates
 *
 * @return {Promise} Resolved when the bug report is sent.
 */
async function sendBugReport(bugReportEndpoint
/*: string*/
, opts
/*: IOpts*/
) {
  if (!bugReportEndpoint) {
    throw new Error("No bug report endpoint has been set.");
  }

  opts = opts || {};

  const progressCallback = opts.progressCallback || (() => {});

  progressCallback((0, _languageHandler._t)("Collecting app version information"));
  let version = "UNKNOWN";

  try {
    version = await _PlatformPeg.default.get().getAppVersion();
  } catch (err) {} // PlatformPeg already logs this.


  let userAgent = "UNKNOWN";

  if (window.navigator && window.navigator.userAgent) {
    userAgent = window.navigator.userAgent;
  }

  let installedPWA = "UNKNOWN";

  try {
    // Known to work at least for desktop Chrome
    installedPWA = String(window.matchMedia('(display-mode: standalone)').matches);
  } catch (e) {}

  let touchInput = "UNKNOWN";

  try {
    // MDN claims broad support across browsers
    touchInput = String(window.matchMedia('(pointer: coarse)').matches);
  } catch (e) {}

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  console.log("Sending bug report.");
  const body = new FormData();
  body.append('text', opts.userText || "User did not supply any additional text.");
  body.append('app', 'riot-web');
  body.append('version', version);
  body.append('user_agent', userAgent);
  body.append('installed_pwa', installedPWA);
  body.append('touch_input', touchInput);

  if (client) {
    body.append('user_id', client.credentials.userId);
    body.append('device_id', client.deviceId);

    if (client.isCryptoEnabled()) {
      const keys = ["ed25519:".concat(client.getDeviceEd25519Key())];

      if (client.getDeviceCurve25519Key) {
        keys.push("curve25519:".concat(client.getDeviceCurve25519Key()));
      }

      body.append('device_keys', keys.join(', '));
      body.append('cross_signing_key', client.getCrossSigningId());
      body.append('device_keys', keys.join(', ')); // add cross-signing status information

      const crossSigning = client._crypto._crossSigningInfo;
      const secretStorage = client._crypto._secretStorage;
      body.append("cross_signing_key", crossSigning.getId());
      body.append("cross_signing_pk_in_ssss", String(!!(await crossSigning.isStoredInSecretStorage(secretStorage))));
      body.append("ssss_key_in_account", String(!!(await secretStorage.hasKey())));
      const pkCache = client.getCrossSigningCacheCallbacks();
      body.append("self_signing_pk_cached", String(!!(pkCache && (await pkCache.getCrossSigningKeyCache("self_signing")))));
      body.append("user_signing_pk_cached", String(!!(pkCache && (await pkCache.getCrossSigningKeyCache("user_signing")))));
      const sessionBackupKeyFromCache = await client._crypto.getSessionBackupPrivateKey();
      body.append("session_backup_key_cached", String(!!sessionBackupKeyFromCache));
      body.append("session_backup_key_well_formed", String(sessionBackupKeyFromCache instanceof Uint8Array));
      body.append("cross_signing_supported_by_hs", String((await client.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing"))));
      body.append("cross_signing_ready", String((await client.isCrossSigningReady())));
      body.append("ssss_key_needs_upgrade", String((await client.secretStorageKeyNeedsUpgrade())));
    }
  }

  if (opts.label) {
    body.append('label', opts.label);
  } // add labs options


  const enabledLabs = _SettingsStore.default.getLabsFeatures().filter(_SettingsStore.default.isFeatureEnabled);

  if (enabledLabs.length) {
    body.append('enabled_labs', enabledLabs.join(', '));
  } // add storage persistence/quota information


  if (navigator.storage && navigator.storage.persisted) {
    try {
      body.append("storageManager_persisted", String((await navigator.storage.persisted())));
    } catch (e) {}
  } else if (document.hasStorageAccess) {
    // Safari
    try {
      body.append("storageManager_persisted", String((await document.hasStorageAccess())));
    } catch (e) {}
  }

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      body.append("storageManager_quota", String(estimate.quota));
      body.append("storageManager_usage", String(estimate.usage));

      if (estimate.usageDetails) {
        Object.keys(estimate.usageDetails).forEach(k => {
          body.append("storageManager_usage_".concat(k), String(estimate.usageDetails[k]));
        });
      }
    } catch (e) {}
  }

  if (window.Modernizr) {
    const missingFeatures = Object.keys(window.Modernizr).filter(key => window.Modernizr[key] === false);

    if (missingFeatures.length > 0) {
      body.append("modernizr_missing_features", missingFeatures.join(", "));
    }
  }

  if (opts.sendLogs) {
    progressCallback((0, _languageHandler._t)("Collecting logs"));
    const logs = await rageshake.getLogsForReport();

    for (const entry of logs) {
      // encode as UTF-8
      const buf = new TextEncoder().encode(entry.lines); // compress

      const compressed = _pako.default.gzip(buf);

      body.append('compressed-log', new Blob([compressed]), entry.id);
    }
  }

  progressCallback((0, _languageHandler._t)("Uploading report"));
  await _submitReport(bugReportEndpoint, body, progressCallback);
}

function _submitReport(endpoint
/*: string*/
, body
/*: FormData*/
, progressCallback
/*: (string) => void*/
) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("POST", endpoint);
    req.timeout = 5 * 60 * 1000;

    req.onreadystatechange = function () {
      if (req.readyState === XMLHttpRequest.LOADING) {
        progressCallback((0, _languageHandler._t)("Waiting for response from server"));
      } else if (req.readyState === XMLHttpRequest.DONE) {
        // on done
        if (req.status < 200 || req.status >= 400) {
          reject(new Error("HTTP ".concat(req.status)));
          return;
        }

        resolve();
      }
    };

    req.send(body);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yYWdlc2hha2Uvc3VibWl0LXJhZ2VzaGFrZS50cyJdLCJuYW1lcyI6WyJUZXh0RW5jb2RlciIsIndpbmRvdyIsIlRleHRFbmNvZGluZ1V0ZjgiLCJzZW5kQnVnUmVwb3J0IiwiYnVnUmVwb3J0RW5kcG9pbnQiLCJvcHRzIiwiRXJyb3IiLCJwcm9ncmVzc0NhbGxiYWNrIiwidmVyc2lvbiIsIlBsYXRmb3JtUGVnIiwiZ2V0IiwiZ2V0QXBwVmVyc2lvbiIsImVyciIsInVzZXJBZ2VudCIsIm5hdmlnYXRvciIsImluc3RhbGxlZFBXQSIsIlN0cmluZyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwiZSIsInRvdWNoSW5wdXQiLCJjbGllbnQiLCJNYXRyaXhDbGllbnRQZWciLCJjb25zb2xlIiwibG9nIiwiYm9keSIsIkZvcm1EYXRhIiwiYXBwZW5kIiwidXNlclRleHQiLCJjcmVkZW50aWFscyIsInVzZXJJZCIsImRldmljZUlkIiwiaXNDcnlwdG9FbmFibGVkIiwia2V5cyIsImdldERldmljZUVkMjU1MTlLZXkiLCJnZXREZXZpY2VDdXJ2ZTI1NTE5S2V5IiwicHVzaCIsImpvaW4iLCJnZXRDcm9zc1NpZ25pbmdJZCIsImNyb3NzU2lnbmluZyIsIl9jcnlwdG8iLCJfY3Jvc3NTaWduaW5nSW5mbyIsInNlY3JldFN0b3JhZ2UiLCJfc2VjcmV0U3RvcmFnZSIsImdldElkIiwiaXNTdG9yZWRJblNlY3JldFN0b3JhZ2UiLCJoYXNLZXkiLCJwa0NhY2hlIiwiZ2V0Q3Jvc3NTaWduaW5nQ2FjaGVDYWxsYmFja3MiLCJnZXRDcm9zc1NpZ25pbmdLZXlDYWNoZSIsInNlc3Npb25CYWNrdXBLZXlGcm9tQ2FjaGUiLCJnZXRTZXNzaW9uQmFja3VwUHJpdmF0ZUtleSIsIlVpbnQ4QXJyYXkiLCJkb2VzU2VydmVyU3VwcG9ydFVuc3RhYmxlRmVhdHVyZSIsImlzQ3Jvc3NTaWduaW5nUmVhZHkiLCJzZWNyZXRTdG9yYWdlS2V5TmVlZHNVcGdyYWRlIiwibGFiZWwiLCJlbmFibGVkTGFicyIsIlNldHRpbmdzU3RvcmUiLCJnZXRMYWJzRmVhdHVyZXMiLCJmaWx0ZXIiLCJpc0ZlYXR1cmVFbmFibGVkIiwibGVuZ3RoIiwic3RvcmFnZSIsInBlcnNpc3RlZCIsImRvY3VtZW50IiwiaGFzU3RvcmFnZUFjY2VzcyIsImVzdGltYXRlIiwicXVvdGEiLCJ1c2FnZSIsInVzYWdlRGV0YWlscyIsIk9iamVjdCIsImZvckVhY2giLCJrIiwiTW9kZXJuaXpyIiwibWlzc2luZ0ZlYXR1cmVzIiwia2V5Iiwic2VuZExvZ3MiLCJsb2dzIiwicmFnZXNoYWtlIiwiZ2V0TG9nc0ZvclJlcG9ydCIsImVudHJ5IiwiYnVmIiwiZW5jb2RlIiwibGluZXMiLCJjb21wcmVzc2VkIiwicGFrbyIsImd6aXAiLCJCbG9iIiwiaWQiLCJfc3VibWl0UmVwb3J0IiwiZW5kcG9pbnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJlcSIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInRpbWVvdXQiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwiTE9BRElORyIsIkRPTkUiLCJzdGF0dXMiLCJzZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFJQTs7QUFDQTs7QUE3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJBO0FBR0EsSUFBSUEsV0FBVyxHQUFHQyxNQUFNLENBQUNELFdBQXpCOztBQUNBLElBQUksQ0FBQ0EsV0FBTCxFQUFrQjtBQUNkQSxFQUFBQSxXQUFXLEdBQUdFLGdCQUFnQixDQUFDRixXQUEvQjtBQUNIOztBQVNEOzs7Ozs7Ozs7Ozs7Ozs7QUFlZSxlQUFlRyxhQUFmLENBQTZCQztBQUE3QjtBQUFBLEVBQXdEQztBQUF4RDtBQUFBLEVBQXFFO0FBQ2hGLE1BQUksQ0FBQ0QsaUJBQUwsRUFBd0I7QUFDcEIsVUFBTSxJQUFJRSxLQUFKLENBQVUsc0NBQVYsQ0FBTjtBQUNIOztBQUVERCxFQUFBQSxJQUFJ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QUFVQyxNQUFWLEtBQXFCO0FBQ3BDLFVBQU1DLEdBQUcsR0FBRyxJQUFJQyxjQUFKLEVBQVo7QUFDQUQsSUFBQUEsR0FBRyxDQUFDRSxJQUFKLENBQVMsTUFBVCxFQUFpQk4sUUFBakI7QUFDQUksSUFBQUEsR0FBRyxDQUFDRyxPQUFKLEdBQWMsSUFBSSxFQUFKLEdBQVMsSUFBdkI7O0FBQ0FILElBQUFBLEdBQUcsQ0FBQ0ksa0JBQUosR0FBeUIsWUFBVztBQUNoQyxVQUFJSixHQUFHLENBQUNLLFVBQUosS0FBbUJKLGNBQWMsQ0FBQ0ssT0FBdEMsRUFBK0M7QUFDM0M5RixRQUFBQSxnQkFBZ0IsQ0FBQyx5QkFBRyxrQ0FBSCxDQUFELENBQWhCO0FBQ0gsT0FGRCxNQUVPLElBQUl3RixHQUFHLENBQUNLLFVBQUosS0FBbUJKLGNBQWMsQ0FBQ00sSUFBdEMsRUFBNEM7QUFDL0M7QUFDQSxZQUFJUCxHQUFHLENBQUNRLE1BQUosR0FBYSxHQUFiLElBQW9CUixHQUFHLENBQUNRLE1BQUosSUFBYyxHQUF0QyxFQUEyQztBQUN2Q1QsVUFBQUEsTUFBTSxDQUFDLElBQUl4RixLQUFKLGdCQUFrQnlGLEdBQUcsQ0FBQ1EsTUFBdEIsRUFBRCxDQUFOO0FBQ0E7QUFDSDs7QUFDRFYsUUFBQUEsT0FBTztBQUNWO0FBQ0osS0FYRDs7QUFZQUUsSUFBQUEsR0FBRyxDQUFDUyxJQUFKLENBQVMvRSxJQUFUO0FBQ0gsR0FqQk0sQ0FBUDtBQWtCSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHBha28gZnJvbSAncGFrbyc7XG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IFBsYXRmb3JtUGVnIGZyb20gJy4uL1BsYXRmb3JtUGVnJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuaW1wb3J0ICogYXMgcmFnZXNoYWtlIGZyb20gJy4vcmFnZXNoYWtlJztcblxuXG4vLyBwb2x5ZmlsbCB0ZXh0ZW5jb2RlciBpZiBuZWNlc3NhcnlcbmltcG9ydCAqIGFzIFRleHRFbmNvZGluZ1V0ZjggZnJvbSAndGV4dC1lbmNvZGluZy11dGYtOCc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xubGV0IFRleHRFbmNvZGVyID0gd2luZG93LlRleHRFbmNvZGVyO1xuaWYgKCFUZXh0RW5jb2Rlcikge1xuICAgIFRleHRFbmNvZGVyID0gVGV4dEVuY29kaW5nVXRmOC5UZXh0RW5jb2Rlcjtcbn1cblxuaW50ZXJmYWNlIElPcHRzIHtcbiAgICBsYWJlbD86IHN0cmluZztcbiAgICB1c2VyVGV4dD86IHN0cmluZztcbiAgICBzZW5kTG9ncz86IGJvb2xlYW47XG4gICAgcHJvZ3Jlc3NDYWxsYmFjaz86IChzdHJpbmcpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogU2VuZCBhIGJ1ZyByZXBvcnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGJ1Z1JlcG9ydEVuZHBvaW50IEhUVFAgdXJsIHRvIHNlbmQgdGhlIHJlcG9ydCB0b1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIG9wdGlvbmFsIGRpY3Rpb25hcnkgb2Ygb3B0aW9uc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnVzZXJUZXh0IEFueSBhZGRpdGlvbmFsIHVzZXIgaW5wdXQuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBvcHRzLnNlbmRMb2dzIFRydWUgdG8gc2VuZCBsb2dzXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcpfSBvcHRzLnByb2dyZXNzQ2FsbGJhY2sgQ2FsbGJhY2sgdG8gY2FsbCB3aXRoIHByb2dyZXNzIHVwZGF0ZXNcbiAqXG4gKiBAcmV0dXJuIHtQcm9taXNlfSBSZXNvbHZlZCB3aGVuIHRoZSBidWcgcmVwb3J0IGlzIHNlbnQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHNlbmRCdWdSZXBvcnQoYnVnUmVwb3J0RW5kcG9pbnQ6IHN0cmluZywgb3B0czogSU9wdHMpIHtcbiAgICBpZiAoIWJ1Z1JlcG9ydEVuZHBvaW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGJ1ZyByZXBvcnQgZW5kcG9pbnQgaGFzIGJlZW4gc2V0LlwiKTtcbiAgICB9XG5cbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICBjb25zdCBwcm9ncmVzc0NhbGxiYWNrID0gb3B0cy5wcm9ncmVzc0NhbGxiYWNrIHx8ICgoKSA9PiB7fSk7XG5cbiAgICBwcm9ncmVzc0NhbGxiYWNrKF90KFwiQ29sbGVjdGluZyBhcHAgdmVyc2lvbiBpbmZvcm1hdGlvblwiKSk7XG4gICAgbGV0IHZlcnNpb24gPSBcIlVOS05PV05cIjtcbiAgICB0cnkge1xuICAgICAgICB2ZXJzaW9uID0gYXdhaXQgUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0QXBwVmVyc2lvbigpO1xuICAgIH0gY2F0Y2ggKGVycikge30gLy8gUGxhdGZvcm1QZWcgYWxyZWFkeSBsb2dzIHRoaXMuXG5cbiAgICBsZXQgdXNlckFnZW50ID0gXCJVTktOT1dOXCI7XG4gICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpIHtcbiAgICAgICAgdXNlckFnZW50ID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgfVxuXG4gICAgbGV0IGluc3RhbGxlZFBXQSA9IFwiVU5LTk9XTlwiO1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEtub3duIHRvIHdvcmsgYXQgbGVhc3QgZm9yIGRlc2t0b3AgQ2hyb21lXG4gICAgICAgIGluc3RhbGxlZFBXQSA9IFN0cmluZyh3aW5kb3cubWF0Y2hNZWRpYSgnKGRpc3BsYXktbW9kZTogc3RhbmRhbG9uZSknKS5tYXRjaGVzKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgbGV0IHRvdWNoSW5wdXQgPSBcIlVOS05PV05cIjtcbiAgICB0cnkge1xuICAgICAgICAvLyBNRE4gY2xhaW1zIGJyb2FkIHN1cHBvcnQgYWNyb3NzIGJyb3dzZXJzXG4gICAgICAgIHRvdWNoSW5wdXQgPSBTdHJpbmcod2luZG93Lm1hdGNoTWVkaWEoJyhwb2ludGVyOiBjb2Fyc2UpJykubWF0Y2hlcyk7XG4gICAgfSBjYXRjaCAoZSkgeyB9XG5cbiAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIlNlbmRpbmcgYnVnIHJlcG9ydC5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgYm9keS5hcHBlbmQoJ3RleHQnLCBvcHRzLnVzZXJUZXh0IHx8IFwiVXNlciBkaWQgbm90IHN1cHBseSBhbnkgYWRkaXRpb25hbCB0ZXh0LlwiKTtcbiAgICBib2R5LmFwcGVuZCgnYXBwJywgJ3Jpb3Qtd2ViJyk7XG4gICAgYm9keS5hcHBlbmQoJ3ZlcnNpb24nLCB2ZXJzaW9uKTtcbiAgICBib2R5LmFwcGVuZCgndXNlcl9hZ2VudCcsIHVzZXJBZ2VudCk7XG4gICAgYm9keS5hcHBlbmQoJ2luc3RhbGxlZF9wd2EnLCBpbnN0YWxsZWRQV0EpO1xuICAgIGJvZHkuYXBwZW5kKCd0b3VjaF9pbnB1dCcsIHRvdWNoSW5wdXQpO1xuXG4gICAgaWYgKGNsaWVudCkge1xuICAgICAgICBib2R5LmFwcGVuZCgndXNlcl9pZCcsIGNsaWVudC5jcmVkZW50aWFscy51c2VySWQpO1xuICAgICAgICBib2R5LmFwcGVuZCgnZGV2aWNlX2lkJywgY2xpZW50LmRldmljZUlkKTtcblxuICAgICAgICBpZiAoY2xpZW50LmlzQ3J5cHRvRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlzID0gW2BlZDI1NTE5OiR7Y2xpZW50LmdldERldmljZUVkMjU1MTlLZXkoKX1gXTtcbiAgICAgICAgICAgIGlmIChjbGllbnQuZ2V0RGV2aWNlQ3VydmUyNTUxOUtleSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaChgY3VydmUyNTUxOToke2NsaWVudC5nZXREZXZpY2VDdXJ2ZTI1NTE5S2V5KCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBib2R5LmFwcGVuZCgnZGV2aWNlX2tleXMnLCBrZXlzLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoJ2Nyb3NzX3NpZ25pbmdfa2V5JywgY2xpZW50LmdldENyb3NzU2lnbmluZ0lkKCkpO1xuXG4gICAgICAgICAgICBib2R5LmFwcGVuZCgnZGV2aWNlX2tleXMnLCBrZXlzLmpvaW4oJywgJykpO1xuXG4gICAgICAgICAgICAvLyBhZGQgY3Jvc3Mtc2lnbmluZyBzdGF0dXMgaW5mb3JtYXRpb25cbiAgICAgICAgICAgIGNvbnN0IGNyb3NzU2lnbmluZyA9IGNsaWVudC5fY3J5cHRvLl9jcm9zc1NpZ25pbmdJbmZvO1xuICAgICAgICAgICAgY29uc3Qgc2VjcmV0U3RvcmFnZSA9IGNsaWVudC5fY3J5cHRvLl9zZWNyZXRTdG9yYWdlO1xuXG4gICAgICAgICAgICBib2R5LmFwcGVuZChcImNyb3NzX3NpZ25pbmdfa2V5XCIsIGNyb3NzU2lnbmluZy5nZXRJZCgpKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwiY3Jvc3Nfc2lnbmluZ19wa19pbl9zc3NzXCIsXG4gICAgICAgICAgICAgICAgU3RyaW5nKCEhKGF3YWl0IGNyb3NzU2lnbmluZy5pc1N0b3JlZEluU2VjcmV0U3RvcmFnZShzZWNyZXRTdG9yYWdlKSkpKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwic3Nzc19rZXlfaW5fYWNjb3VudFwiLCBTdHJpbmcoISEoYXdhaXQgc2VjcmV0U3RvcmFnZS5oYXNLZXkoKSkpKTtcblxuICAgICAgICAgICAgY29uc3QgcGtDYWNoZSA9IGNsaWVudC5nZXRDcm9zc1NpZ25pbmdDYWNoZUNhbGxiYWNrcygpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoXCJzZWxmX3NpZ25pbmdfcGtfY2FjaGVkXCIsXG4gICAgICAgICAgICAgICAgU3RyaW5nKCEhKHBrQ2FjaGUgJiYgYXdhaXQgcGtDYWNoZS5nZXRDcm9zc1NpZ25pbmdLZXlDYWNoZShcInNlbGZfc2lnbmluZ1wiKSkpKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwidXNlcl9zaWduaW5nX3BrX2NhY2hlZFwiLFxuICAgICAgICAgICAgICAgIFN0cmluZyghIShwa0NhY2hlICYmIGF3YWl0IHBrQ2FjaGUuZ2V0Q3Jvc3NTaWduaW5nS2V5Q2FjaGUoXCJ1c2VyX3NpZ25pbmdcIikpKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb25CYWNrdXBLZXlGcm9tQ2FjaGUgPSBhd2FpdCBjbGllbnQuX2NyeXB0by5nZXRTZXNzaW9uQmFja3VwUHJpdmF0ZUtleSgpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoXCJzZXNzaW9uX2JhY2t1cF9rZXlfY2FjaGVkXCIsIFN0cmluZyghIXNlc3Npb25CYWNrdXBLZXlGcm9tQ2FjaGUpKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwic2Vzc2lvbl9iYWNrdXBfa2V5X3dlbGxfZm9ybWVkXCIsIFN0cmluZyhzZXNzaW9uQmFja3VwS2V5RnJvbUNhY2hlIGluc3RhbmNlb2YgVWludDhBcnJheSkpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoXCJjcm9zc19zaWduaW5nX3N1cHBvcnRlZF9ieV9oc1wiLFxuICAgICAgICAgICAgICAgIFN0cmluZyhhd2FpdCBjbGllbnQuZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUoXCJvcmcubWF0cml4LmUyZV9jcm9zc19zaWduaW5nXCIpKSk7XG4gICAgICAgICAgICBib2R5LmFwcGVuZChcImNyb3NzX3NpZ25pbmdfcmVhZHlcIiwgU3RyaW5nKGF3YWl0IGNsaWVudC5pc0Nyb3NzU2lnbmluZ1JlYWR5KCkpKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwic3Nzc19rZXlfbmVlZHNfdXBncmFkZVwiLCBTdHJpbmcoYXdhaXQgY2xpZW50LnNlY3JldFN0b3JhZ2VLZXlOZWVkc1VwZ3JhZGUoKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdHMubGFiZWwpIHtcbiAgICAgICAgYm9keS5hcHBlbmQoJ2xhYmVsJywgb3B0cy5sYWJlbCk7XG4gICAgfVxuXG4gICAgLy8gYWRkIGxhYnMgb3B0aW9uc1xuICAgIGNvbnN0IGVuYWJsZWRMYWJzID0gU2V0dGluZ3NTdG9yZS5nZXRMYWJzRmVhdHVyZXMoKS5maWx0ZXIoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKTtcbiAgICBpZiAoZW5hYmxlZExhYnMubGVuZ3RoKSB7XG4gICAgICAgIGJvZHkuYXBwZW5kKCdlbmFibGVkX2xhYnMnLCBlbmFibGVkTGFicy5qb2luKCcsICcpKTtcbiAgICB9XG5cbiAgICAvLyBhZGQgc3RvcmFnZSBwZXJzaXN0ZW5jZS9xdW90YSBpbmZvcm1hdGlvblxuICAgIGlmIChuYXZpZ2F0b3Iuc3RvcmFnZSAmJiBuYXZpZ2F0b3Iuc3RvcmFnZS5wZXJzaXN0ZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwic3RvcmFnZU1hbmFnZXJfcGVyc2lzdGVkXCIsIFN0cmluZyhhd2FpdCBuYXZpZ2F0b3Iuc3RvcmFnZS5wZXJzaXN0ZWQoKSkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuaGFzU3RvcmFnZUFjY2VzcykgeyAvLyBTYWZhcmlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKFwic3RvcmFnZU1hbmFnZXJfcGVyc2lzdGVkXCIsIFN0cmluZyhhd2FpdCBkb2N1bWVudC5oYXNTdG9yYWdlQWNjZXNzKCkpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gICAgaWYgKG5hdmlnYXRvci5zdG9yYWdlICYmIG5hdmlnYXRvci5zdG9yYWdlLmVzdGltYXRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlc3RpbWF0ZSA9IGF3YWl0IG5hdmlnYXRvci5zdG9yYWdlLmVzdGltYXRlKCk7XG4gICAgICAgICAgICBib2R5LmFwcGVuZChcInN0b3JhZ2VNYW5hZ2VyX3F1b3RhXCIsIFN0cmluZyhlc3RpbWF0ZS5xdW90YSkpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoXCJzdG9yYWdlTWFuYWdlcl91c2FnZVwiLCBTdHJpbmcoZXN0aW1hdGUudXNhZ2UpKTtcbiAgICAgICAgICAgIGlmIChlc3RpbWF0ZS51c2FnZURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhlc3RpbWF0ZS51c2FnZURldGFpbHMpLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGJvZHkuYXBwZW5kKGBzdG9yYWdlTWFuYWdlcl91c2FnZV8ke2t9YCwgU3RyaW5nKGVzdGltYXRlLnVzYWdlRGV0YWlsc1trXSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIGlmICh3aW5kb3cuTW9kZXJuaXpyKSB7XG4gICAgICAgIGNvbnN0IG1pc3NpbmdGZWF0dXJlcyA9IE9iamVjdC5rZXlzKHdpbmRvdy5Nb2Rlcm5penIpLmZpbHRlcihrZXkgPT4gd2luZG93Lk1vZGVybml6cltrZXldID09PSBmYWxzZSk7XG4gICAgICAgIGlmIChtaXNzaW5nRmVhdHVyZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoXCJtb2Rlcm5penJfbWlzc2luZ19mZWF0dXJlc1wiLCBtaXNzaW5nRmVhdHVyZXMuam9pbihcIiwgXCIpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLnNlbmRMb2dzKSB7XG4gICAgICAgIHByb2dyZXNzQ2FsbGJhY2soX3QoXCJDb2xsZWN0aW5nIGxvZ3NcIikpO1xuICAgICAgICBjb25zdCBsb2dzID0gYXdhaXQgcmFnZXNoYWtlLmdldExvZ3NGb3JSZXBvcnQoKTtcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBsb2dzKSB7XG4gICAgICAgICAgICAvLyBlbmNvZGUgYXMgVVRGLThcbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShlbnRyeS5saW5lcyk7XG5cbiAgICAgICAgICAgIC8vIGNvbXByZXNzXG4gICAgICAgICAgICBjb25zdCBjb21wcmVzc2VkID0gcGFrby5nemlwKGJ1Zik7XG5cbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKCdjb21wcmVzc2VkLWxvZycsIG5ldyBCbG9iKFtjb21wcmVzc2VkXSksIGVudHJ5LmlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb2dyZXNzQ2FsbGJhY2soX3QoXCJVcGxvYWRpbmcgcmVwb3J0XCIpKTtcbiAgICBhd2FpdCBfc3VibWl0UmVwb3J0KGJ1Z1JlcG9ydEVuZHBvaW50LCBib2R5LCBwcm9ncmVzc0NhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gX3N1Ym1pdFJlcG9ydChlbmRwb2ludDogc3RyaW5nLCBib2R5OiBGb3JtRGF0YSwgcHJvZ3Jlc3NDYWxsYmFjazogKHN0cmluZykgPT4gdm9pZCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXEub3BlbihcIlBPU1RcIiwgZW5kcG9pbnQpO1xuICAgICAgICByZXEudGltZW91dCA9IDUgKiA2MCAqIDEwMDA7XG4gICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWE1MSHR0cFJlcXVlc3QuTE9BRElORykge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzQ2FsbGJhY2soX3QoXCJXYWl0aW5nIGZvciByZXNwb25zZSBmcm9tIHNlcnZlclwiKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYTUxIdHRwUmVxdWVzdC5ET05FKSB7XG4gICAgICAgICAgICAgICAgLy8gb24gZG9uZVxuICAgICAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzIDwgMjAwIHx8IHJlcS5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYEhUVFAgJHtyZXEuc3RhdHVzfWApKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5zZW5kKGJvZHkpO1xuICAgIH0pO1xufVxuIl19