"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadSession = loadSession;
exports.getStoredSessionOwner = getStoredSessionOwner;
exports.getStoredSessionIsGuest = getStoredSessionIsGuest;
exports.attemptTokenLogin = attemptTokenLogin;
exports.handleInvalidStoreError = handleInvalidStoreError;
exports.getLocalStorageSessionVars = getLocalStorageSessionVars;
exports.setLoggedIn = setLoggedIn;
exports.hydrateSession = hydrateSession;
exports.logout = logout;
exports.softLogout = softLogout;
exports.isSoftLogout = isSoftLogout;
exports.isLoggingOut = isLoggingOut;
exports.onLoggedOut = onLoggedOut;
exports.stopMatrixClient = stopMatrixClient;

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var _EventIndexPeg = _interopRequireDefault(require("./indexing/EventIndexPeg"));

var _createMatrixClient = _interopRequireDefault(require("./utils/createMatrixClient"));

var _Analytics = _interopRequireDefault(require("./Analytics"));

var _Notifier = _interopRequireDefault(require("./Notifier"));

var _UserActivity = _interopRequireDefault(require("./UserActivity"));

var _Presence = _interopRequireDefault(require("./Presence"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _DMRoomMap = _interopRequireDefault(require("./utils/DMRoomMap"));

var _Modal = _interopRequireDefault(require("./Modal"));

var sdk = _interopRequireWildcard(require("./index"));

var _ActiveWidgetStore = _interopRequireDefault(require("./stores/ActiveWidgetStore"));

var _PlatformPeg = _interopRequireDefault(require("./PlatformPeg"));

var _Login = require("./Login");

var StorageManager = _interopRequireWildcard(require("./utils/StorageManager"));

var _SettingsStore = _interopRequireDefault(require("./settings/SettingsStore"));

var _TypingStore = _interopRequireDefault(require("./stores/TypingStore"));

var _ToastStore = _interopRequireDefault(require("./stores/ToastStore"));

var _IntegrationManagers = require("./integrations/IntegrationManagers");

var _Mjolnir = require("./mjolnir/Mjolnir");

var _DeviceListener = _interopRequireDefault(require("./DeviceListener"));

var _Jitsi = require("./widgets/Jitsi");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2018 New Vector Ltd
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

/**
 * Called at startup, to attempt to build a logged-in Matrix session. It tries
 * a number of things:
 *
 *
 * 1. if we have a guest access token in the fragment query params, it uses
 *    that.
 *
 * 2. if an access token is stored in local storage (from a previous session),
 *    it uses that.
 *
 * 3. it attempts to auto-register as a guest user.
 *
 * If any of steps 1-4 are successful, it will call {_doSetLoggedIn}, which in
 * turn will raise on_logged_in and will_start_client events.
 *
 * @param {object} opts
 *
 * @param {object} opts.fragmentQueryParams: string->string map of the
 *     query-parameters extracted from the #-fragment of the starting URI.
 *
 * @param {boolean} opts.enableGuest: set to true to enable guest access tokens
 *     and auto-guest registrations.
 *
 * @params {string} opts.guestHsUrl: homeserver URL. Only used if enableGuest is
 *     true; defines the HS to register against.
 *
 * @params {string} opts.guestIsUrl: homeserver URL. Only used if enableGuest is
 *     true; defines the IS to use.
 *
 * @params {bool} opts.ignoreGuest: If the stored session is a guest account, ignore
 *     it and don't load it.
 *
 * @returns {Promise} a promise which resolves when the above process completes.
 *     Resolves to `true` if we ended up starting a session, or `false` if we
 *     failed.
 */
async function loadSession(opts) {
  try {
    let enableGuest = opts.enableGuest || false;
    const guestHsUrl = opts.guestHsUrl;
    const guestIsUrl = opts.guestIsUrl;
    const fragmentQueryParams = opts.fragmentQueryParams || {};
    const defaultDeviceDisplayName = opts.defaultDeviceDisplayName;

    if (enableGuest && !guestHsUrl) {
      console.warn("Cannot enable guest access: can't determine HS URL to use");
      enableGuest = false;
    }

    if (enableGuest && fragmentQueryParams.guest_user_id && fragmentQueryParams.guest_access_token) {
      console.log("Using guest access credentials");
      return _doSetLoggedIn({
        userId: fragmentQueryParams.guest_user_id,
        accessToken: fragmentQueryParams.guest_access_token,
        homeserverUrl: guestHsUrl,
        identityServerUrl: guestIsUrl,
        guest: true
      }, true).then(() => true);
    }

    const success = await _restoreFromLocalStorage({
      ignoreGuest: Boolean(opts.ignoreGuest)
    });

    if (success) {
      return true;
    }

    if (enableGuest) {
      return _registerAsGuest(guestHsUrl, guestIsUrl, defaultDeviceDisplayName);
    } // fall back to welcome screen


    return false;
  } catch (e) {
    if (e instanceof AbortLoginAndRebuildStorage) {
      // If we're aborting login because of a storage inconsistency, we don't
      // need to show the general failure dialog. Instead, just go back to welcome.
      return false;
    }

    return _handleLoadSessionFailure(e);
  }
}
/**
 * Gets the user ID of the persisted session, if one exists. This does not validate
 * that the user's credentials still work, just that they exist and that a user ID
 * is associated with them. The session is not loaded.
 * @returns {String} The persisted session's owner, if an owner exists. Null otherwise.
 */


function getStoredSessionOwner() {
  const {
    hsUrl,
    userId,
    accessToken
  } = getLocalStorageSessionVars();
  return hsUrl && userId && accessToken ? userId : null;
}
/**
 * @returns {bool} True if the stored session is for a guest user or false if it is
 *     for a real user. If there is no stored session, return null.
 */


function getStoredSessionIsGuest() {
  const sessVars = getLocalStorageSessionVars();
  return sessVars.hsUrl && sessVars.userId && sessVars.accessToken ? sessVars.isGuest : null;
}
/**
 * @param {Object} queryParams    string->string map of the
 *     query-parameters extracted from the real query-string of the starting
 *     URI.
 *
 * @param {String} defaultDeviceDisplayName
 *
 * @returns {Promise} promise which resolves to true if we completed the token
 *    login, else false
 */


function attemptTokenLogin(queryParams, defaultDeviceDisplayName) {
  if (!queryParams.loginToken) {
    return Promise.resolve(false);
  }

  if (!queryParams.homeserver) {
    console.warn("Cannot log in with token: can't determine HS URL to use");
    return Promise.resolve(false);
  }

  return (0, _Login.sendLoginRequest)(queryParams.homeserver, queryParams.identityServer, "m.login.token", {
    token: queryParams.loginToken,
    initial_device_display_name: defaultDeviceDisplayName
  }).then(function (creds) {
    console.log("Logged in with token");
    return _clearStorage().then(() => {
      _persistCredentialsToLocalStorage(creds);

      return true;
    });
  }).catch(err => {
    console.error("Failed to log in with login token: " + err + " " + err.data);
    return false;
  });
}

function handleInvalidStoreError(e) {
  if (e.reason === _matrixJsSdk.default.InvalidStoreError.TOGGLED_LAZY_LOADING) {
    return Promise.resolve().then(() => {
      const lazyLoadEnabled = e.value;

      if (lazyLoadEnabled) {
        const LazyLoadingResyncDialog = sdk.getComponent("views.dialogs.LazyLoadingResyncDialog");
        return new Promise(resolve => {
          _Modal.default.createDialog(LazyLoadingResyncDialog, {
            onFinished: resolve
          });
        });
      } else {
        // show warning about simultaneous use
        // between LL/non-LL version on same host.
        // as disabling LL when previously enabled
        // is a strong indicator of this (/develop & /app)
        const LazyLoadingDisabledDialog = sdk.getComponent("views.dialogs.LazyLoadingDisabledDialog");
        return new Promise(resolve => {
          _Modal.default.createDialog(LazyLoadingDisabledDialog, {
            onFinished: resolve,
            host: window.location.host
          });
        });
      }
    }).then(() => {
      return _MatrixClientPeg.MatrixClientPeg.get().store.deleteAllData();
    }).then(() => {
      _PlatformPeg.default.get().reload();
    });
  }
}

function _registerAsGuest(hsUrl, isUrl, defaultDeviceDisplayName) {
  console.log("Doing guest login on ".concat(hsUrl)); // create a temporary MatrixClient to do the login

  const client = _matrixJsSdk.default.createClient({
    baseUrl: hsUrl
  });

  return client.registerGuest({
    body: {
      initial_device_display_name: defaultDeviceDisplayName
    }
  }).then(creds => {
    console.log("Registered as guest: ".concat(creds.user_id));
    return _doSetLoggedIn({
      userId: creds.user_id,
      deviceId: creds.device_id,
      accessToken: creds.access_token,
      homeserverUrl: hsUrl,
      identityServerUrl: isUrl,
      guest: true
    }, true).then(() => true);
  }, err => {
    console.error("Failed to register as guest", err);
    return false;
  });
}
/**
 * Retrieves information about the stored session in localstorage. The session
 * may not be valid, as it is not tested for consistency here.
 * @returns {Object} Information about the session - see implementation for variables.
 */


function getLocalStorageSessionVars() {
  const hsUrl = localStorage.getItem("mx_hs_url");
  const isUrl = localStorage.getItem("mx_is_url");
  const accessToken = localStorage.getItem("mx_access_token");
  const userId = localStorage.getItem("mx_user_id");
  const deviceId = localStorage.getItem("mx_device_id");
  let isGuest;

  if (localStorage.getItem("mx_is_guest") !== null) {
    isGuest = localStorage.getItem("mx_is_guest") === "true";
  } else {
    // legacy key name
    isGuest = localStorage.getItem("matrix-is-guest") === "true";
  }

  return {
    hsUrl,
    isUrl,
    accessToken,
    userId,
    deviceId,
    isGuest
  };
} // returns a promise which resolves to true if a session is found in
// localstorage
//
// N.B. Lifecycle.js should not maintain any further localStorage state, we
//      are moving towards using SessionStore to keep track of state related
//      to the current session (which is typically backed by localStorage).
//
//      The plan is to gradually move the localStorage access done here into
//      SessionStore to avoid bugs where the view becomes out-of-sync with
//      localStorage (e.g. isGuest etc.)


async function _restoreFromLocalStorage(opts) {
  const ignoreGuest = opts.ignoreGuest;

  if (!localStorage) {
    return false;
  }

  const {
    hsUrl,
    isUrl,
    accessToken,
    userId,
    deviceId,
    isGuest
  } = getLocalStorageSessionVars();

  if (accessToken && userId && hsUrl) {
    if (ignoreGuest && isGuest) {
      console.log("Ignoring stored guest account: " + userId);
      return false;
    }

    console.log("Restoring session for ".concat(userId));
    await _doSetLoggedIn({
      userId: userId,
      deviceId: deviceId,
      accessToken: accessToken,
      homeserverUrl: hsUrl,
      identityServerUrl: isUrl,
      guest: isGuest
    }, false);
    return true;
  } else {
    console.log("No previous session found.");
    return false;
  }
}

async function _handleLoadSessionFailure(e) {
  console.error("Unable to load session", e);
  const SessionRestoreErrorDialog = sdk.getComponent('views.dialogs.SessionRestoreErrorDialog');

  const modal = _Modal.default.createTrackedDialog('Session Restore Error', '', SessionRestoreErrorDialog, {
    error: e.message
  });

  const [success] = await modal.finished;

  if (success) {
    // user clicked continue.
    await _clearStorage();
    return false;
  } // try, try again


  return loadSession();
}
/**
 * Transitions to a logged-in state using the given credentials.
 *
 * Starts the matrix client and all other react-sdk services that
 * listen for events while a session is logged in.
 *
 * Also stops the old MatrixClient and clears old credentials/etc out of
 * storage before starting the new client.
 *
 * @param {MatrixClientCreds} credentials The credentials to use
 *
 * @returns {Promise} promise which resolves to the new MatrixClient once it has been started
 */


function setLoggedIn(credentials) {
  stopMatrixClient();
  return _doSetLoggedIn(credentials, true);
}
/**
 * Hydrates an existing session by using the credentials provided. This will
 * not clear any local storage, unlike setLoggedIn().
 *
 * Stops the existing Matrix client (without clearing its data) and starts a
 * new one in its place. This additionally starts all other react-sdk services
 * which use the new Matrix client.
 *
 * If the credentials belong to a different user from the session already stored,
 * the old session will be cleared automatically.
 *
 * @param {MatrixClientCreds} credentials The credentials to use
 *
 * @returns {Promise} promise which resolves to the new MatrixClient once it has been started
 */


function hydrateSession(credentials) {
  const oldUserId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

  const oldDeviceId = _MatrixClientPeg.MatrixClientPeg.get().getDeviceId();

  stopMatrixClient(); // unsets MatrixClientPeg.get()

  localStorage.removeItem("mx_soft_logout");
  _isLoggingOut = false;
  const overwrite = credentials.userId !== oldUserId || credentials.deviceId !== oldDeviceId;

  if (overwrite) {
    console.warn("Clearing all data: Old session belongs to a different user/session");
  }

  return _doSetLoggedIn(credentials, overwrite);
}
/**
 * fires on_logging_in, optionally clears localstorage, persists new credentials
 * to localstorage, starts the new client.
 *
 * @param {MatrixClientCreds} credentials
 * @param {Boolean} clearStorage
 *
 * @returns {Promise} promise which resolves to the new MatrixClient once it has been started
 */


async function _doSetLoggedIn(credentials, clearStorage) {
  credentials.guest = Boolean(credentials.guest);
  const softLogout = isSoftLogout();
  console.log("setLoggedIn: mxid: " + credentials.userId + " deviceId: " + credentials.deviceId + " guest: " + credentials.guest + " hs: " + credentials.homeserverUrl + " softLogout: " + softLogout); // This is dispatched to indicate that the user is still in the process of logging in
  // because async code may take some time to resolve, breaking the assumption that
  // `setLoggedIn` takes an "instant" to complete, and dispatch `on_logged_in` a few ms
  // later than MatrixChat might assume.
  //
  // we fire it *synchronously* to make sure it fires before on_logged_in.
  // (dis.dispatch uses `setTimeout`, which does not guarantee ordering.)

  _dispatcher.default.dispatch({
    action: 'on_logging_in'
  }, true);

  if (clearStorage) {
    await _clearStorage();
  }

  const results = await StorageManager.checkConsistency(); // If there's an inconsistency between account data in local storage and the
  // crypto store, we'll be generally confused when handling encrypted data.
  // Show a modal recommending a full reset of storage.

  if (results.dataInLocalStorage && results.cryptoInited && !results.dataInCryptoStore) {
    const signOut = await _showStorageEvictedDialog();

    if (signOut) {
      await _clearStorage(); // This error feels a bit clunky, but we want to make sure we don't go any
      // further and instead head back to sign in.

      throw new AbortLoginAndRebuildStorage("Aborting login in progress because of storage inconsistency");
    }
  }

  _Analytics.default.setLoggedIn(credentials.guest, credentials.homeserverUrl);

  if (localStorage) {
    try {
      _persistCredentialsToLocalStorage(credentials); // The user registered as a PWLU (PassWord-Less User), the generated password
      // is cached here such that the user can change it at a later time.


      if (credentials.password) {
        // Update SessionStore
        _dispatcher.default.dispatch({
          action: 'cached_password',
          cachedPassword: credentials.password
        });
      }
    } catch (e) {
      console.warn("Error using local storage: can't persist session!", e);
    }
  } else {
    console.warn("No local storage available: can't persist session!");
  }

  _MatrixClientPeg.MatrixClientPeg.replaceUsingCreds(credentials);

  _dispatcher.default.dispatch({
    action: 'on_logged_in'
  });

  await startMatrixClient(
  /*startSyncing=*/
  !softLogout);
  return _MatrixClientPeg.MatrixClientPeg.get();
}

function _showStorageEvictedDialog() {
  const StorageEvictedDialog = sdk.getComponent('views.dialogs.StorageEvictedDialog');
  return new Promise(resolve => {
    _Modal.default.createTrackedDialog('Storage evicted', '', StorageEvictedDialog, {
      onFinished: resolve
    });
  });
} // Note: Babel 6 requires the `transform-builtin-extend` plugin for this to satisfy
// `instanceof`. Babel 7 supports this natively in their class handling.


class AbortLoginAndRebuildStorage extends Error {}

function _persistCredentialsToLocalStorage(credentials) {
  localStorage.setItem("mx_hs_url", credentials.homeserverUrl);

  if (credentials.identityServerUrl) {
    localStorage.setItem("mx_is_url", credentials.identityServerUrl);
  }

  localStorage.setItem("mx_user_id", credentials.userId);
  localStorage.setItem("mx_access_token", credentials.accessToken);
  localStorage.setItem("mx_is_guest", JSON.stringify(credentials.guest)); // if we didn't get a deviceId from the login, leave mx_device_id unset,
  // rather than setting it to "undefined".
  //
  // (in this case MatrixClient doesn't bother with the crypto stuff
  // - that's fine for us).

  if (credentials.deviceId) {
    localStorage.setItem("mx_device_id", credentials.deviceId);
  }

  console.log("Session persisted for ".concat(credentials.userId));
}

let _isLoggingOut = false;
/**
 * Logs the current session out and transitions to the logged-out state
 */

function logout() {
  if (!_MatrixClientPeg.MatrixClientPeg.get()) return;

  if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
    // logout doesn't work for guest sessions
    // Also we sometimes want to re-log in a guest session
    // if we abort the login
    onLoggedOut();
    return;
  }

  _isLoggingOut = true;

  _MatrixClientPeg.MatrixClientPeg.get().logout().then(onLoggedOut, err => {
    // Just throwing an error here is going to be very unhelpful
    // if you're trying to log out because your server's down and
    // you want to log into a different server, so just forget the
    // access token. It's annoying that this will leave the access
    // token still valid, but we should fix this by having access
    // tokens expire (and if you really think you've been compromised,
    // change your password).
    console.log("Failed to call logout API: token will not be invalidated");
    onLoggedOut();
  });
}

function softLogout() {
  if (!_MatrixClientPeg.MatrixClientPeg.get()) return; // Track that we've detected and trapped a soft logout. This helps prevent other
  // parts of the app from starting if there's no point (ie: don't sync if we've
  // been soft logged out, despite having credentials and data for a MatrixClient).

  localStorage.setItem("mx_soft_logout", "true"); // Dev note: please keep this log line around. It can be useful for track down
  // random clients stopping in the middle of the logs.

  console.log("Soft logout initiated");
  _isLoggingOut = true; // to avoid repeated flags
  // Ensure that we dispatch a view change **before** stopping the client so
  // so that React components unmount first. This avoids React soft crashes
  // that can occur when components try to use a null client.

  _dispatcher.default.dispatch({
    action: 'on_client_not_viable'
  }); // generic version of on_logged_out


  stopMatrixClient(
  /*unsetClient=*/
  false); // DO NOT CALL LOGOUT. A soft logout preserves data, logout does not.
}

function isSoftLogout() {
  return localStorage.getItem("mx_soft_logout") === "true";
}

function isLoggingOut() {
  return _isLoggingOut;
}
/**
 * Starts the matrix client and all other react-sdk services that
 * listen for events while a session is logged in.
 * @param {boolean} startSyncing True (default) to actually start
 * syncing the client.
 */


async function startMatrixClient(startSyncing = true) {
  console.log("Lifecycle: Starting MatrixClient"); // dispatch this before starting the matrix client: it's used
  // to add listeners for the 'sync' event so otherwise we'd have
  // a race condition (and we need to dispatch synchronously for this
  // to work).

  _dispatcher.default.dispatch({
    action: 'will_start_client'
  }, true);

  _Notifier.default.start();

  _UserActivity.default.sharedInstance().start();

  _TypingStore.default.sharedInstance().reset(); // just in case


  _ToastStore.default.sharedInstance().reset();

  _DMRoomMap.default.makeShared().start();

  _IntegrationManagers.IntegrationManagers.sharedInstance().startWatching();

  _ActiveWidgetStore.default.start(); // Start Mjolnir even though we haven't checked the feature flag yet. Starting
  // the thing just wastes CPU cycles, but should result in no actual functionality
  // being exposed to the user.


  _Mjolnir.Mjolnir.sharedInstance().start();

  if (startSyncing) {
    // The client might want to populate some views with events from the
    // index (e.g. the FilePanel), therefore initialize the event index
    // before the client.
    await _EventIndexPeg.default.init();
    await _MatrixClientPeg.MatrixClientPeg.start();
  } else {
    console.warn("Caller requested only auxiliary services be started");
    await _MatrixClientPeg.MatrixClientPeg.assign();
  } // This needs to be started after crypto is set up


  _DeviceListener.default.sharedInstance().start(); // Similarly, don't start sending presence updates until we've started
  // the client


  if (!_SettingsStore.default.getValue("lowBandwidth")) {
    _Presence.default.start();
  } // Now that we have a MatrixClientPeg, update the Jitsi info


  await _Jitsi.Jitsi.getInstance().update(); // dispatch that we finished starting up to wire up any other bits
  // of the matrix client that cannot be set prior to starting up.

  _dispatcher.default.dispatch({
    action: 'client_started'
  });

  if (isSoftLogout()) {
    softLogout();
  }
}
/*
 * Stops a running client and all related services, and clears persistent
 * storage. Used after a session has been logged out.
 */


async function onLoggedOut() {
  _isLoggingOut = false; // Ensure that we dispatch a view change **before** stopping the client so
  // so that React components unmount first. This avoids React soft crashes
  // that can occur when components try to use a null client.

  _dispatcher.default.dispatch({
    action: 'on_logged_out'
  }, true);

  stopMatrixClient();
  await _clearStorage();
}
/**
 * @returns {Promise} promise which resolves once the stores have been cleared
 */


async function _clearStorage() {
  _Analytics.default.disable();

  if (window.localStorage) {
    window.localStorage.clear();
  }

  if (window.sessionStorage) {
    window.sessionStorage.clear();
  } // create a temporary client to clear out the persistent stores.


  const cli = (0, _createMatrixClient.default)({
    // we'll never make any requests, so can pass a bogus HS URL
    baseUrl: ""
  });
  await _EventIndexPeg.default.deleteEventIndex();
  await cli.clearStores();
}
/**
 * Stop all the background processes related to the current client.
 * @param {boolean} unsetClient True (default) to abandon the client
 * on MatrixClientPeg after stopping.
 */


function stopMatrixClient(unsetClient = true) {
  _Notifier.default.stop();

  _UserActivity.default.sharedInstance().stop();

  _TypingStore.default.sharedInstance().reset();

  _Presence.default.stop();

  _ActiveWidgetStore.default.stop();

  _IntegrationManagers.IntegrationManagers.sharedInstance().stopWatching();

  _Mjolnir.Mjolnir.sharedInstance().stop();

  _DeviceListener.default.sharedInstance().stop();

  if (_DMRoomMap.default.shared()) _DMRoomMap.default.shared().stop();

  _EventIndexPeg.default.stop();

  const cli = _MatrixClientPeg.MatrixClientPeg.get();

  if (cli) {
    cli.stopClient();
    cli.removeAllListeners();

    if (unsetClient) {
      _MatrixClientPeg.MatrixClientPeg.unset();

      _EventIndexPeg.default.unset();
    }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9MaWZlY3ljbGUuanMiXSwibmFtZXMiOlsibG9hZFNlc3Npb24iLCJvcHRzIiwiZW5hYmxlR3Vlc3QiLCJndWVzdEhzVXJsIiwiZ3Vlc3RJc1VybCIsImZyYWdtZW50UXVlcnlQYXJhbXMiLCJkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWUiLCJjb25zb2xlIiwid2FybiIsImd1ZXN0X3VzZXJfaWQiLCJndWVzdF9hY2Nlc3NfdG9rZW4iLCJsb2ciLCJfZG9TZXRMb2dnZWRJbiIsInVzZXJJZCIsImFjY2Vzc1Rva2VuIiwiaG9tZXNlcnZlclVybCIsImlkZW50aXR5U2VydmVyVXJsIiwiZ3Vlc3QiLCJ0aGVuIiwic3VjY2VzcyIsIl9yZXN0b3JlRnJvbUxvY2FsU3RvcmFnZSIsImlnbm9yZUd1ZXN0IiwiQm9vbGVhbiIsIl9yZWdpc3RlckFzR3Vlc3QiLCJlIiwiQWJvcnRMb2dpbkFuZFJlYnVpbGRTdG9yYWdlIiwiX2hhbmRsZUxvYWRTZXNzaW9uRmFpbHVyZSIsImdldFN0b3JlZFNlc3Npb25Pd25lciIsImhzVXJsIiwiZ2V0TG9jYWxTdG9yYWdlU2Vzc2lvblZhcnMiLCJnZXRTdG9yZWRTZXNzaW9uSXNHdWVzdCIsInNlc3NWYXJzIiwiaXNHdWVzdCIsImF0dGVtcHRUb2tlbkxvZ2luIiwicXVlcnlQYXJhbXMiLCJsb2dpblRva2VuIiwiUHJvbWlzZSIsInJlc29sdmUiLCJob21lc2VydmVyIiwiaWRlbnRpdHlTZXJ2ZXIiLCJ0b2tlbiIsImluaXRpYWxfZGV2aWNlX2Rpc3BsYXlfbmFtZSIsImNyZWRzIiwiX2NsZWFyU3RvcmFnZSIsIl9wZXJzaXN0Q3JlZGVudGlhbHNUb0xvY2FsU3RvcmFnZSIsImNhdGNoIiwiZXJyIiwiZXJyb3IiLCJkYXRhIiwiaGFuZGxlSW52YWxpZFN0b3JlRXJyb3IiLCJyZWFzb24iLCJNYXRyaXgiLCJJbnZhbGlkU3RvcmVFcnJvciIsIlRPR0dMRURfTEFaWV9MT0FESU5HIiwibGF6eUxvYWRFbmFibGVkIiwidmFsdWUiLCJMYXp5TG9hZGluZ1Jlc3luY0RpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlRGlhbG9nIiwib25GaW5pc2hlZCIsIkxhenlMb2FkaW5nRGlzYWJsZWREaWFsb2ciLCJob3N0Iiwid2luZG93IiwibG9jYXRpb24iLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJzdG9yZSIsImRlbGV0ZUFsbERhdGEiLCJQbGF0Zm9ybVBlZyIsInJlbG9hZCIsImlzVXJsIiwiY2xpZW50IiwiY3JlYXRlQ2xpZW50IiwiYmFzZVVybCIsInJlZ2lzdGVyR3Vlc3QiLCJib2R5IiwidXNlcl9pZCIsImRldmljZUlkIiwiZGV2aWNlX2lkIiwiYWNjZXNzX3Rva2VuIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsIlNlc3Npb25SZXN0b3JlRXJyb3JEaWFsb2ciLCJtb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJtZXNzYWdlIiwiZmluaXNoZWQiLCJzZXRMb2dnZWRJbiIsImNyZWRlbnRpYWxzIiwic3RvcE1hdHJpeENsaWVudCIsImh5ZHJhdGVTZXNzaW9uIiwib2xkVXNlcklkIiwiZ2V0VXNlcklkIiwib2xkRGV2aWNlSWQiLCJnZXREZXZpY2VJZCIsInJlbW92ZUl0ZW0iLCJfaXNMb2dnaW5nT3V0Iiwib3ZlcndyaXRlIiwiY2xlYXJTdG9yYWdlIiwic29mdExvZ291dCIsImlzU29mdExvZ291dCIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwicmVzdWx0cyIsIlN0b3JhZ2VNYW5hZ2VyIiwiY2hlY2tDb25zaXN0ZW5jeSIsImRhdGFJbkxvY2FsU3RvcmFnZSIsImNyeXB0b0luaXRlZCIsImRhdGFJbkNyeXB0b1N0b3JlIiwic2lnbk91dCIsIl9zaG93U3RvcmFnZUV2aWN0ZWREaWFsb2ciLCJBbmFseXRpY3MiLCJwYXNzd29yZCIsImNhY2hlZFBhc3N3b3JkIiwicmVwbGFjZVVzaW5nQ3JlZHMiLCJzdGFydE1hdHJpeENsaWVudCIsIlN0b3JhZ2VFdmljdGVkRGlhbG9nIiwiRXJyb3IiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsImxvZ291dCIsIm9uTG9nZ2VkT3V0IiwiaXNMb2dnaW5nT3V0Iiwic3RhcnRTeW5jaW5nIiwiTm90aWZpZXIiLCJzdGFydCIsIlVzZXJBY3Rpdml0eSIsInNoYXJlZEluc3RhbmNlIiwiVHlwaW5nU3RvcmUiLCJyZXNldCIsIlRvYXN0U3RvcmUiLCJETVJvb21NYXAiLCJtYWtlU2hhcmVkIiwiSW50ZWdyYXRpb25NYW5hZ2VycyIsInN0YXJ0V2F0Y2hpbmciLCJBY3RpdmVXaWRnZXRTdG9yZSIsIk1qb2xuaXIiLCJFdmVudEluZGV4UGVnIiwiaW5pdCIsImFzc2lnbiIsIkRldmljZUxpc3RlbmVyIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiUHJlc2VuY2UiLCJKaXRzaSIsImdldEluc3RhbmNlIiwidXBkYXRlIiwiZGlzYWJsZSIsImNsZWFyIiwic2Vzc2lvblN0b3JhZ2UiLCJjbGkiLCJkZWxldGVFdmVudEluZGV4IiwiY2xlYXJTdG9yZXMiLCJ1bnNldENsaWVudCIsInN0b3AiLCJzdG9wV2F0Y2hpbmciLCJzaGFyZWQiLCJzdG9wQ2xpZW50IiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwidW5zZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUExQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0Q0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQ08sZUFBZUEsV0FBZixDQUEyQkMsSUFBM0IsRUFBaUM7QUFDcEMsTUFBSTtBQUNBLFFBQUlDLFdBQVcsR0FBR0QsSUFBSSxDQUFDQyxXQUFMLElBQW9CLEtBQXRDO0FBQ0EsVUFBTUMsVUFBVSxHQUFHRixJQUFJLENBQUNFLFVBQXhCO0FBQ0EsVUFBTUMsVUFBVSxHQUFHSCxJQUFJLENBQUNHLFVBQXhCO0FBQ0EsVUFBTUMsbUJBQW1CLEdBQUdKLElBQUksQ0FBQ0ksbUJBQUwsSUFBNEIsRUFBeEQ7QUFDQSxVQUFNQyx3QkFBd0IsR0FBR0wsSUFBSSxDQUFDSyx3QkFBdEM7O0FBRUEsUUFBSUosV0FBVyxJQUFJLENBQUNDLFVBQXBCLEVBQWdDO0FBQzVCSSxNQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSwyREFBYjtBQUNBTixNQUFBQSxXQUFXLEdBQUcsS0FBZDtBQUNIOztBQUVELFFBQUlBLFdBQVcsSUFDWEcsbUJBQW1CLENBQUNJLGFBRHBCLElBRUFKLG1CQUFtQixDQUFDSyxrQkFGeEIsRUFHSztBQUNESCxNQUFBQSxPQUFPLENBQUNJLEdBQVIsQ0FBWSxnQ0FBWjtBQUNBLGFBQU9DLGNBQWMsQ0FBQztBQUNsQkMsUUFBQUEsTUFBTSxFQUFFUixtQkFBbUIsQ0FBQ0ksYUFEVjtBQUVsQkssUUFBQUEsV0FBVyxFQUFFVCxtQkFBbUIsQ0FBQ0ssa0JBRmY7QUFHbEJLLFFBQUFBLGFBQWEsRUFBRVosVUFIRztBQUlsQmEsUUFBQUEsaUJBQWlCLEVBQUVaLFVBSkQ7QUFLbEJhLFFBQUFBLEtBQUssRUFBRTtBQUxXLE9BQUQsRUFNbEIsSUFOa0IsQ0FBZCxDQU1FQyxJQU5GLENBTU8sTUFBTSxJQU5iLENBQVA7QUFPSDs7QUFDRCxVQUFNQyxPQUFPLEdBQUcsTUFBTUMsd0JBQXdCLENBQUM7QUFDM0NDLE1BQUFBLFdBQVcsRUFBRUMsT0FBTyxDQUFDckIsSUFBSSxDQUFDb0IsV0FBTjtBQUR1QixLQUFELENBQTlDOztBQUdBLFFBQUlGLE9BQUosRUFBYTtBQUNULGFBQU8sSUFBUDtBQUNIOztBQUVELFFBQUlqQixXQUFKLEVBQWlCO0FBQ2IsYUFBT3FCLGdCQUFnQixDQUFDcEIsVUFBRCxFQUFhQyxVQUFiLEVBQXlCRSx3QkFBekIsQ0FBdkI7QUFDSCxLQWxDRCxDQW9DQTs7O0FBQ0EsV0FBTyxLQUFQO0FBQ0gsR0F0Q0QsQ0FzQ0UsT0FBT2tCLENBQVAsRUFBVTtBQUNSLFFBQUlBLENBQUMsWUFBWUMsMkJBQWpCLEVBQThDO0FBQzFDO0FBQ0E7QUFDQSxhQUFPLEtBQVA7QUFDSDs7QUFDRCxXQUFPQyx5QkFBeUIsQ0FBQ0YsQ0FBRCxDQUFoQztBQUNIO0FBQ0o7QUFFRDs7Ozs7Ozs7QUFNTyxTQUFTRyxxQkFBVCxHQUFpQztBQUNwQyxRQUFNO0FBQUNDLElBQUFBLEtBQUQ7QUFBUWYsSUFBQUEsTUFBUjtBQUFnQkMsSUFBQUE7QUFBaEIsTUFBK0JlLDBCQUEwQixFQUEvRDtBQUNBLFNBQU9ELEtBQUssSUFBSWYsTUFBVCxJQUFtQkMsV0FBbkIsR0FBaUNELE1BQWpDLEdBQTBDLElBQWpEO0FBQ0g7QUFFRDs7Ozs7O0FBSU8sU0FBU2lCLHVCQUFULEdBQW1DO0FBQ3RDLFFBQU1DLFFBQVEsR0FBR0YsMEJBQTBCLEVBQTNDO0FBQ0EsU0FBT0UsUUFBUSxDQUFDSCxLQUFULElBQWtCRyxRQUFRLENBQUNsQixNQUEzQixJQUFxQ2tCLFFBQVEsQ0FBQ2pCLFdBQTlDLEdBQTREaUIsUUFBUSxDQUFDQyxPQUFyRSxHQUErRSxJQUF0RjtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7OztBQVVPLFNBQVNDLGlCQUFULENBQTJCQyxXQUEzQixFQUF3QzVCLHdCQUF4QyxFQUFrRTtBQUNyRSxNQUFJLENBQUM0QixXQUFXLENBQUNDLFVBQWpCLEVBQTZCO0FBQ3pCLFdBQU9DLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQUFQO0FBQ0g7O0FBRUQsTUFBSSxDQUFDSCxXQUFXLENBQUNJLFVBQWpCLEVBQTZCO0FBQ3pCL0IsSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEseURBQWI7QUFDQSxXQUFPNEIsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEtBQWhCLENBQVA7QUFDSDs7QUFFRCxTQUFPLDZCQUNISCxXQUFXLENBQUNJLFVBRFQsRUFFSEosV0FBVyxDQUFDSyxjQUZULEVBR0gsZUFIRyxFQUdjO0FBQ2JDLElBQUFBLEtBQUssRUFBRU4sV0FBVyxDQUFDQyxVQUROO0FBRWJNLElBQUFBLDJCQUEyQixFQUFFbkM7QUFGaEIsR0FIZCxFQU9MWSxJQVBLLENBT0EsVUFBU3dCLEtBQVQsRUFBZ0I7QUFDbkJuQyxJQUFBQSxPQUFPLENBQUNJLEdBQVIsQ0FBWSxzQkFBWjtBQUNBLFdBQU9nQyxhQUFhLEdBQUd6QixJQUFoQixDQUFxQixNQUFNO0FBQzlCMEIsTUFBQUEsaUNBQWlDLENBQUNGLEtBQUQsQ0FBakM7O0FBQ0EsYUFBTyxJQUFQO0FBQ0gsS0FITSxDQUFQO0FBSUgsR0FiTSxFQWFKRyxLQWJJLENBYUdDLEdBQUQsSUFBUztBQUNkdkMsSUFBQUEsT0FBTyxDQUFDd0MsS0FBUixDQUFjLHdDQUF3Q0QsR0FBeEMsR0FBOEMsR0FBOUMsR0FDQUEsR0FBRyxDQUFDRSxJQURsQjtBQUVBLFdBQU8sS0FBUDtBQUNILEdBakJNLENBQVA7QUFrQkg7O0FBRU0sU0FBU0MsdUJBQVQsQ0FBaUN6QixDQUFqQyxFQUFvQztBQUN2QyxNQUFJQSxDQUFDLENBQUMwQixNQUFGLEtBQWFDLHFCQUFPQyxpQkFBUCxDQUF5QkMsb0JBQTFDLEVBQWdFO0FBQzVELFdBQU9qQixPQUFPLENBQUNDLE9BQVIsR0FBa0JuQixJQUFsQixDQUF1QixNQUFNO0FBQ2hDLFlBQU1vQyxlQUFlLEdBQUc5QixDQUFDLENBQUMrQixLQUExQjs7QUFDQSxVQUFJRCxlQUFKLEVBQXFCO0FBQ2pCLGNBQU1FLHVCQUF1QixHQUN6QkMsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHVDQUFqQixDQURKO0FBRUEsZUFBTyxJQUFJdEIsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDNUJzQix5QkFBTUMsWUFBTixDQUFtQkosdUJBQW5CLEVBQTRDO0FBQ3hDSyxZQUFBQSxVQUFVLEVBQUV4QjtBQUQ0QixXQUE1QztBQUdILFNBSk0sQ0FBUDtBQUtILE9BUkQsTUFRTztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBTXlCLHlCQUF5QixHQUMzQkwsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHlDQUFqQixDQURKO0FBRUEsZUFBTyxJQUFJdEIsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDNUJzQix5QkFBTUMsWUFBTixDQUFtQkUseUJBQW5CLEVBQThDO0FBQzFDRCxZQUFBQSxVQUFVLEVBQUV4QixPQUQ4QjtBQUUxQzBCLFlBQUFBLElBQUksRUFBRUMsTUFBTSxDQUFDQyxRQUFQLENBQWdCRjtBQUZvQixXQUE5QztBQUlILFNBTE0sQ0FBUDtBQU1IO0FBQ0osS0F4Qk0sRUF3Qko3QyxJQXhCSSxDQXdCQyxNQUFNO0FBQ1YsYUFBT2dELGlDQUFnQkMsR0FBaEIsR0FBc0JDLEtBQXRCLENBQTRCQyxhQUE1QixFQUFQO0FBQ0gsS0ExQk0sRUEwQkpuRCxJQTFCSSxDQTBCQyxNQUFNO0FBQ1ZvRCwyQkFBWUgsR0FBWixHQUFrQkksTUFBbEI7QUFDSCxLQTVCTSxDQUFQO0FBNkJIO0FBQ0o7O0FBRUQsU0FBU2hELGdCQUFULENBQTBCSyxLQUExQixFQUFpQzRDLEtBQWpDLEVBQXdDbEUsd0JBQXhDLEVBQWtFO0FBQzlEQyxFQUFBQSxPQUFPLENBQUNJLEdBQVIsZ0NBQW9DaUIsS0FBcEMsR0FEOEQsQ0FHOUQ7O0FBQ0EsUUFBTTZDLE1BQU0sR0FBR3RCLHFCQUFPdUIsWUFBUCxDQUFvQjtBQUMvQkMsSUFBQUEsT0FBTyxFQUFFL0M7QUFEc0IsR0FBcEIsQ0FBZjs7QUFJQSxTQUFPNkMsTUFBTSxDQUFDRyxhQUFQLENBQXFCO0FBQ3hCQyxJQUFBQSxJQUFJLEVBQUU7QUFDRnBDLE1BQUFBLDJCQUEyQixFQUFFbkM7QUFEM0I7QUFEa0IsR0FBckIsRUFJSlksSUFKSSxDQUlFd0IsS0FBRCxJQUFXO0FBQ2ZuQyxJQUFBQSxPQUFPLENBQUNJLEdBQVIsZ0NBQW9DK0IsS0FBSyxDQUFDb0MsT0FBMUM7QUFDQSxXQUFPbEUsY0FBYyxDQUFDO0FBQ2xCQyxNQUFBQSxNQUFNLEVBQUU2QixLQUFLLENBQUNvQyxPQURJO0FBRWxCQyxNQUFBQSxRQUFRLEVBQUVyQyxLQUFLLENBQUNzQyxTQUZFO0FBR2xCbEUsTUFBQUEsV0FBVyxFQUFFNEIsS0FBSyxDQUFDdUMsWUFIRDtBQUlsQmxFLE1BQUFBLGFBQWEsRUFBRWEsS0FKRztBQUtsQlosTUFBQUEsaUJBQWlCLEVBQUV3RCxLQUxEO0FBTWxCdkQsTUFBQUEsS0FBSyxFQUFFO0FBTlcsS0FBRCxFQU9sQixJQVBrQixDQUFkLENBT0VDLElBUEYsQ0FPTyxNQUFNLElBUGIsQ0FBUDtBQVFILEdBZE0sRUFjSDRCLEdBQUQsSUFBUztBQUNSdkMsSUFBQUEsT0FBTyxDQUFDd0MsS0FBUixDQUFjLDZCQUFkLEVBQTZDRCxHQUE3QztBQUNBLFdBQU8sS0FBUDtBQUNILEdBakJNLENBQVA7QUFrQkg7QUFFRDs7Ozs7OztBQUtPLFNBQVNqQiwwQkFBVCxHQUFzQztBQUN6QyxRQUFNRCxLQUFLLEdBQUdzRCxZQUFZLENBQUNDLE9BQWIsQ0FBcUIsV0FBckIsQ0FBZDtBQUNBLFFBQU1YLEtBQUssR0FBR1UsWUFBWSxDQUFDQyxPQUFiLENBQXFCLFdBQXJCLENBQWQ7QUFDQSxRQUFNckUsV0FBVyxHQUFHb0UsWUFBWSxDQUFDQyxPQUFiLENBQXFCLGlCQUFyQixDQUFwQjtBQUNBLFFBQU10RSxNQUFNLEdBQUdxRSxZQUFZLENBQUNDLE9BQWIsQ0FBcUIsWUFBckIsQ0FBZjtBQUNBLFFBQU1KLFFBQVEsR0FBR0csWUFBWSxDQUFDQyxPQUFiLENBQXFCLGNBQXJCLENBQWpCO0FBRUEsTUFBSW5ELE9BQUo7O0FBQ0EsTUFBSWtELFlBQVksQ0FBQ0MsT0FBYixDQUFxQixhQUFyQixNQUF3QyxJQUE1QyxFQUFrRDtBQUM5Q25ELElBQUFBLE9BQU8sR0FBR2tELFlBQVksQ0FBQ0MsT0FBYixDQUFxQixhQUFyQixNQUF3QyxNQUFsRDtBQUNILEdBRkQsTUFFTztBQUNIO0FBQ0FuRCxJQUFBQSxPQUFPLEdBQUdrRCxZQUFZLENBQUNDLE9BQWIsQ0FBcUIsaUJBQXJCLE1BQTRDLE1BQXREO0FBQ0g7O0FBRUQsU0FBTztBQUFDdkQsSUFBQUEsS0FBRDtBQUFRNEMsSUFBQUEsS0FBUjtBQUFlMUQsSUFBQUEsV0FBZjtBQUE0QkQsSUFBQUEsTUFBNUI7QUFBb0NrRSxJQUFBQSxRQUFwQztBQUE4Qy9DLElBQUFBO0FBQTlDLEdBQVA7QUFDSCxDLENBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLGVBQWVaLHdCQUFmLENBQXdDbkIsSUFBeEMsRUFBOEM7QUFDMUMsUUFBTW9CLFdBQVcsR0FBR3BCLElBQUksQ0FBQ29CLFdBQXpCOztBQUVBLE1BQUksQ0FBQzZELFlBQUwsRUFBbUI7QUFDZixXQUFPLEtBQVA7QUFDSDs7QUFFRCxRQUFNO0FBQUN0RCxJQUFBQSxLQUFEO0FBQVE0QyxJQUFBQSxLQUFSO0FBQWUxRCxJQUFBQSxXQUFmO0FBQTRCRCxJQUFBQSxNQUE1QjtBQUFvQ2tFLElBQUFBLFFBQXBDO0FBQThDL0MsSUFBQUE7QUFBOUMsTUFBeURILDBCQUEwQixFQUF6Rjs7QUFFQSxNQUFJZixXQUFXLElBQUlELE1BQWYsSUFBeUJlLEtBQTdCLEVBQW9DO0FBQ2hDLFFBQUlQLFdBQVcsSUFBSVcsT0FBbkIsRUFBNEI7QUFDeEJ6QixNQUFBQSxPQUFPLENBQUNJLEdBQVIsQ0FBWSxvQ0FBb0NFLE1BQWhEO0FBQ0EsYUFBTyxLQUFQO0FBQ0g7O0FBRUROLElBQUFBLE9BQU8sQ0FBQ0ksR0FBUixpQ0FBcUNFLE1BQXJDO0FBQ0EsVUFBTUQsY0FBYyxDQUFDO0FBQ2pCQyxNQUFBQSxNQUFNLEVBQUVBLE1BRFM7QUFFakJrRSxNQUFBQSxRQUFRLEVBQUVBLFFBRk87QUFHakJqRSxNQUFBQSxXQUFXLEVBQUVBLFdBSEk7QUFJakJDLE1BQUFBLGFBQWEsRUFBRWEsS0FKRTtBQUtqQlosTUFBQUEsaUJBQWlCLEVBQUV3RCxLQUxGO0FBTWpCdkQsTUFBQUEsS0FBSyxFQUFFZTtBQU5VLEtBQUQsRUFPakIsS0FQaUIsQ0FBcEI7QUFRQSxXQUFPLElBQVA7QUFDSCxHQWhCRCxNQWdCTztBQUNIekIsSUFBQUEsT0FBTyxDQUFDSSxHQUFSLENBQVksNEJBQVo7QUFDQSxXQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELGVBQWVlLHlCQUFmLENBQXlDRixDQUF6QyxFQUE0QztBQUN4Q2pCLEVBQUFBLE9BQU8sQ0FBQ3dDLEtBQVIsQ0FBYyx3QkFBZCxFQUF3Q3ZCLENBQXhDO0FBRUEsUUFBTTRELHlCQUF5QixHQUN6QjNCLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix5Q0FBakIsQ0FETjs7QUFHQSxRQUFNMkIsS0FBSyxHQUFHMUIsZUFBTTJCLG1CQUFOLENBQTBCLHVCQUExQixFQUFtRCxFQUFuRCxFQUF1REYseUJBQXZELEVBQWtGO0FBQzVGckMsSUFBQUEsS0FBSyxFQUFFdkIsQ0FBQyxDQUFDK0Q7QUFEbUYsR0FBbEYsQ0FBZDs7QUFJQSxRQUFNLENBQUNwRSxPQUFELElBQVksTUFBTWtFLEtBQUssQ0FBQ0csUUFBOUI7O0FBQ0EsTUFBSXJFLE9BQUosRUFBYTtBQUNUO0FBQ0EsVUFBTXdCLGFBQWEsRUFBbkI7QUFDQSxXQUFPLEtBQVA7QUFDSCxHQWZ1QyxDQWlCeEM7OztBQUNBLFNBQU8zQyxXQUFXLEVBQWxCO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0FBYU8sU0FBU3lGLFdBQVQsQ0FBcUJDLFdBQXJCLEVBQWtDO0FBQ3JDQyxFQUFBQSxnQkFBZ0I7QUFDaEIsU0FBTy9FLGNBQWMsQ0FBQzhFLFdBQUQsRUFBYyxJQUFkLENBQXJCO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlTyxTQUFTRSxjQUFULENBQXdCRixXQUF4QixFQUFxQztBQUN4QyxRQUFNRyxTQUFTLEdBQUczQixpQ0FBZ0JDLEdBQWhCLEdBQXNCMkIsU0FBdEIsRUFBbEI7O0FBQ0EsUUFBTUMsV0FBVyxHQUFHN0IsaUNBQWdCQyxHQUFoQixHQUFzQjZCLFdBQXRCLEVBQXBCOztBQUVBTCxFQUFBQSxnQkFBZ0IsR0FKd0IsQ0FJcEI7O0FBQ3BCVCxFQUFBQSxZQUFZLENBQUNlLFVBQWIsQ0FBd0IsZ0JBQXhCO0FBQ0FDLEVBQUFBLGFBQWEsR0FBRyxLQUFoQjtBQUVBLFFBQU1DLFNBQVMsR0FBR1QsV0FBVyxDQUFDN0UsTUFBWixLQUF1QmdGLFNBQXZCLElBQW9DSCxXQUFXLENBQUNYLFFBQVosS0FBeUJnQixXQUEvRTs7QUFDQSxNQUFJSSxTQUFKLEVBQWU7QUFDWDVGLElBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLG9FQUFiO0FBQ0g7O0FBRUQsU0FBT0ksY0FBYyxDQUFDOEUsV0FBRCxFQUFjUyxTQUFkLENBQXJCO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7QUFTQSxlQUFldkYsY0FBZixDQUE4QjhFLFdBQTlCLEVBQTJDVSxZQUEzQyxFQUF5RDtBQUNyRFYsRUFBQUEsV0FBVyxDQUFDekUsS0FBWixHQUFvQkssT0FBTyxDQUFDb0UsV0FBVyxDQUFDekUsS0FBYixDQUEzQjtBQUVBLFFBQU1vRixVQUFVLEdBQUdDLFlBQVksRUFBL0I7QUFFQS9GLEVBQUFBLE9BQU8sQ0FBQ0ksR0FBUixDQUNJLHdCQUF3QitFLFdBQVcsQ0FBQzdFLE1BQXBDLEdBQ0EsYUFEQSxHQUNnQjZFLFdBQVcsQ0FBQ1gsUUFENUIsR0FFQSxVQUZBLEdBRWFXLFdBQVcsQ0FBQ3pFLEtBRnpCLEdBR0EsT0FIQSxHQUdVeUUsV0FBVyxDQUFDM0UsYUFIdEIsR0FJQSxlQUpBLEdBSWtCc0YsVUFMdEIsRUFMcUQsQ0FhckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FFLHNCQUFJQyxRQUFKLENBQWE7QUFBQ0MsSUFBQUEsTUFBTSxFQUFFO0FBQVQsR0FBYixFQUF3QyxJQUF4Qzs7QUFFQSxNQUFJTCxZQUFKLEVBQWtCO0FBQ2QsVUFBTXpELGFBQWEsRUFBbkI7QUFDSDs7QUFFRCxRQUFNK0QsT0FBTyxHQUFHLE1BQU1DLGNBQWMsQ0FBQ0MsZ0JBQWYsRUFBdEIsQ0ExQnFELENBMkJyRDtBQUNBO0FBQ0E7O0FBQ0EsTUFBSUYsT0FBTyxDQUFDRyxrQkFBUixJQUE4QkgsT0FBTyxDQUFDSSxZQUF0QyxJQUFzRCxDQUFDSixPQUFPLENBQUNLLGlCQUFuRSxFQUFzRjtBQUNsRixVQUFNQyxPQUFPLEdBQUcsTUFBTUMseUJBQXlCLEVBQS9DOztBQUNBLFFBQUlELE9BQUosRUFBYTtBQUNULFlBQU1yRSxhQUFhLEVBQW5CLENBRFMsQ0FFVDtBQUNBOztBQUNBLFlBQU0sSUFBSWxCLDJCQUFKLENBQ0YsNkRBREUsQ0FBTjtBQUdIO0FBQ0o7O0FBRUR5RixxQkFBVXpCLFdBQVYsQ0FBc0JDLFdBQVcsQ0FBQ3pFLEtBQWxDLEVBQXlDeUUsV0FBVyxDQUFDM0UsYUFBckQ7O0FBRUEsTUFBSW1FLFlBQUosRUFBa0I7QUFDZCxRQUFJO0FBQ0F0QyxNQUFBQSxpQ0FBaUMsQ0FBQzhDLFdBQUQsQ0FBakMsQ0FEQSxDQUdBO0FBQ0E7OztBQUNBLFVBQUlBLFdBQVcsQ0FBQ3lCLFFBQWhCLEVBQTBCO0FBQ3RCO0FBQ0FaLDRCQUFJQyxRQUFKLENBQWE7QUFDVEMsVUFBQUEsTUFBTSxFQUFFLGlCQURDO0FBRVRXLFVBQUFBLGNBQWMsRUFBRTFCLFdBQVcsQ0FBQ3lCO0FBRm5CLFNBQWI7QUFJSDtBQUNKLEtBWkQsQ0FZRSxPQUFPM0YsQ0FBUCxFQUFVO0FBQ1JqQixNQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxtREFBYixFQUFrRWdCLENBQWxFO0FBQ0g7QUFDSixHQWhCRCxNQWdCTztBQUNIakIsSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsb0RBQWI7QUFDSDs7QUFFRDBELG1DQUFnQm1ELGlCQUFoQixDQUFrQzNCLFdBQWxDOztBQUVBYSxzQkFBSUMsUUFBSixDQUFhO0FBQUVDLElBQUFBLE1BQU0sRUFBRTtBQUFWLEdBQWI7O0FBRUEsUUFBTWEsaUJBQWlCO0FBQUM7QUFBaUIsR0FBQ2pCLFVBQW5CLENBQXZCO0FBQ0EsU0FBT25DLGlDQUFnQkMsR0FBaEIsRUFBUDtBQUNIOztBQUVELFNBQVM4Qyx5QkFBVCxHQUFxQztBQUNqQyxRQUFNTSxvQkFBb0IsR0FBRzlELEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixvQ0FBakIsQ0FBN0I7QUFDQSxTQUFPLElBQUl0QixPQUFKLENBQVlDLE9BQU8sSUFBSTtBQUMxQnNCLG1CQUFNMkIsbUJBQU4sQ0FBMEIsaUJBQTFCLEVBQTZDLEVBQTdDLEVBQWlEaUMsb0JBQWpELEVBQXVFO0FBQ25FMUQsTUFBQUEsVUFBVSxFQUFFeEI7QUFEdUQsS0FBdkU7QUFHSCxHQUpNLENBQVA7QUFLSCxDLENBRUQ7QUFDQTs7O0FBQ0EsTUFBTVosMkJBQU4sU0FBMEMrRixLQUExQyxDQUFnRDs7QUFFaEQsU0FBUzVFLGlDQUFULENBQTJDOEMsV0FBM0MsRUFBd0Q7QUFDcERSLEVBQUFBLFlBQVksQ0FBQ3VDLE9BQWIsQ0FBcUIsV0FBckIsRUFBa0MvQixXQUFXLENBQUMzRSxhQUE5Qzs7QUFDQSxNQUFJMkUsV0FBVyxDQUFDMUUsaUJBQWhCLEVBQW1DO0FBQy9Ca0UsSUFBQUEsWUFBWSxDQUFDdUMsT0FBYixDQUFxQixXQUFyQixFQUFrQy9CLFdBQVcsQ0FBQzFFLGlCQUE5QztBQUNIOztBQUNEa0UsRUFBQUEsWUFBWSxDQUFDdUMsT0FBYixDQUFxQixZQUFyQixFQUFtQy9CLFdBQVcsQ0FBQzdFLE1BQS9DO0FBQ0FxRSxFQUFBQSxZQUFZLENBQUN1QyxPQUFiLENBQXFCLGlCQUFyQixFQUF3Qy9CLFdBQVcsQ0FBQzVFLFdBQXBEO0FBQ0FvRSxFQUFBQSxZQUFZLENBQUN1QyxPQUFiLENBQXFCLGFBQXJCLEVBQW9DQyxJQUFJLENBQUNDLFNBQUwsQ0FBZWpDLFdBQVcsQ0FBQ3pFLEtBQTNCLENBQXBDLEVBUG9ELENBU3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsTUFBSXlFLFdBQVcsQ0FBQ1gsUUFBaEIsRUFBMEI7QUFDdEJHLElBQUFBLFlBQVksQ0FBQ3VDLE9BQWIsQ0FBcUIsY0FBckIsRUFBcUMvQixXQUFXLENBQUNYLFFBQWpEO0FBQ0g7O0FBRUR4RSxFQUFBQSxPQUFPLENBQUNJLEdBQVIsaUNBQXFDK0UsV0FBVyxDQUFDN0UsTUFBakQ7QUFDSDs7QUFFRCxJQUFJcUYsYUFBYSxHQUFHLEtBQXBCO0FBRUE7Ozs7QUFHTyxTQUFTMEIsTUFBVCxHQUFrQjtBQUNyQixNQUFJLENBQUMxRCxpQ0FBZ0JDLEdBQWhCLEVBQUwsRUFBNEI7O0FBRTVCLE1BQUlELGlDQUFnQkMsR0FBaEIsR0FBc0JuQyxPQUF0QixFQUFKLEVBQXFDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBNkYsSUFBQUEsV0FBVztBQUNYO0FBQ0g7O0FBRUQzQixFQUFBQSxhQUFhLEdBQUcsSUFBaEI7O0FBQ0FoQyxtQ0FBZ0JDLEdBQWhCLEdBQXNCeUQsTUFBdEIsR0FBK0IxRyxJQUEvQixDQUFvQzJHLFdBQXBDLEVBQ0svRSxHQUFELElBQVM7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBdkMsSUFBQUEsT0FBTyxDQUFDSSxHQUFSLENBQVksMERBQVo7QUFDQWtILElBQUFBLFdBQVc7QUFDZCxHQVhMO0FBYUg7O0FBRU0sU0FBU3hCLFVBQVQsR0FBc0I7QUFDekIsTUFBSSxDQUFDbkMsaUNBQWdCQyxHQUFoQixFQUFMLEVBQTRCLE9BREgsQ0FHekI7QUFDQTtBQUNBOztBQUNBZSxFQUFBQSxZQUFZLENBQUN1QyxPQUFiLENBQXFCLGdCQUFyQixFQUF1QyxNQUF2QyxFQU55QixDQVF6QjtBQUNBOztBQUNBbEgsRUFBQUEsT0FBTyxDQUFDSSxHQUFSLENBQVksdUJBQVo7QUFDQXVGLEVBQUFBLGFBQWEsR0FBRyxJQUFoQixDQVh5QixDQVdIO0FBQ3RCO0FBQ0E7QUFDQTs7QUFDQUssc0JBQUlDLFFBQUosQ0FBYTtBQUFDQyxJQUFBQSxNQUFNLEVBQUU7QUFBVCxHQUFiLEVBZnlCLENBZXVCOzs7QUFDaERkLEVBQUFBLGdCQUFnQjtBQUFDO0FBQWdCLE9BQWpCLENBQWhCLENBaEJ5QixDQWtCekI7QUFDSDs7QUFFTSxTQUFTVyxZQUFULEdBQXdCO0FBQzNCLFNBQU9wQixZQUFZLENBQUNDLE9BQWIsQ0FBcUIsZ0JBQXJCLE1BQTJDLE1BQWxEO0FBQ0g7O0FBRU0sU0FBUzJDLFlBQVQsR0FBd0I7QUFDM0IsU0FBTzVCLGFBQVA7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLGVBQWVvQixpQkFBZixDQUFpQ1MsWUFBWSxHQUFDLElBQTlDLEVBQW9EO0FBQ2hEeEgsRUFBQUEsT0FBTyxDQUFDSSxHQUFSLHFDQURnRCxDQUdoRDtBQUNBO0FBQ0E7QUFDQTs7QUFDQTRGLHNCQUFJQyxRQUFKLENBQWE7QUFBQ0MsSUFBQUEsTUFBTSxFQUFFO0FBQVQsR0FBYixFQUE0QyxJQUE1Qzs7QUFFQXVCLG9CQUFTQyxLQUFUOztBQUNBQyx3QkFBYUMsY0FBYixHQUE4QkYsS0FBOUI7O0FBQ0FHLHVCQUFZRCxjQUFaLEdBQTZCRSxLQUE3QixHQVhnRCxDQVdWOzs7QUFDdENDLHNCQUFXSCxjQUFYLEdBQTRCRSxLQUE1Qjs7QUFDQUUscUJBQVVDLFVBQVYsR0FBdUJQLEtBQXZCOztBQUNBUSwyQ0FBb0JOLGNBQXBCLEdBQXFDTyxhQUFyQzs7QUFDQUMsNkJBQWtCVixLQUFsQixHQWZnRCxDQWlCaEQ7QUFDQTtBQUNBOzs7QUFDQVcsbUJBQVFULGNBQVIsR0FBeUJGLEtBQXpCOztBQUVBLE1BQUlGLFlBQUosRUFBa0I7QUFDZDtBQUNBO0FBQ0E7QUFDQSxVQUFNYyx1QkFBY0MsSUFBZCxFQUFOO0FBQ0EsVUFBTTVFLGlDQUFnQitELEtBQWhCLEVBQU47QUFDSCxHQU5ELE1BTU87QUFDSDFILElBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHFEQUFiO0FBQ0EsVUFBTTBELGlDQUFnQjZFLE1BQWhCLEVBQU47QUFDSCxHQS9CK0MsQ0FpQ2hEOzs7QUFDQUMsMEJBQWViLGNBQWYsR0FBZ0NGLEtBQWhDLEdBbENnRCxDQW1DaEQ7QUFDQTs7O0FBQ0EsTUFBSSxDQUFDZ0IsdUJBQWNDLFFBQWQsQ0FBdUIsY0FBdkIsQ0FBTCxFQUE2QztBQUN6Q0Msc0JBQVNsQixLQUFUO0FBQ0gsR0F2QytDLENBeUNoRDs7O0FBQ0EsUUFBTW1CLGFBQU1DLFdBQU4sR0FBb0JDLE1BQXBCLEVBQU4sQ0ExQ2dELENBNENoRDtBQUNBOztBQUNBL0Msc0JBQUlDLFFBQUosQ0FBYTtBQUFDQyxJQUFBQSxNQUFNLEVBQUU7QUFBVCxHQUFiOztBQUVBLE1BQUlILFlBQVksRUFBaEIsRUFBb0I7QUFDaEJELElBQUFBLFVBQVU7QUFDYjtBQUNKO0FBRUQ7Ozs7OztBQUlPLGVBQWV3QixXQUFmLEdBQTZCO0FBQ2hDM0IsRUFBQUEsYUFBYSxHQUFHLEtBQWhCLENBRGdDLENBRWhDO0FBQ0E7QUFDQTs7QUFDQUssc0JBQUlDLFFBQUosQ0FBYTtBQUFDQyxJQUFBQSxNQUFNLEVBQUU7QUFBVCxHQUFiLEVBQXdDLElBQXhDOztBQUNBZCxFQUFBQSxnQkFBZ0I7QUFDaEIsUUFBTWhELGFBQWEsRUFBbkI7QUFDSDtBQUVEOzs7OztBQUdBLGVBQWVBLGFBQWYsR0FBK0I7QUFDM0J1RSxxQkFBVXFDLE9BQVY7O0FBRUEsTUFBSXZGLE1BQU0sQ0FBQ2tCLFlBQVgsRUFBeUI7QUFDckJsQixJQUFBQSxNQUFNLENBQUNrQixZQUFQLENBQW9Cc0UsS0FBcEI7QUFDSDs7QUFFRCxNQUFJeEYsTUFBTSxDQUFDeUYsY0FBWCxFQUEyQjtBQUN2QnpGLElBQUFBLE1BQU0sQ0FBQ3lGLGNBQVAsQ0FBc0JELEtBQXRCO0FBQ0gsR0FUMEIsQ0FXM0I7OztBQUNBLFFBQU1FLEdBQUcsR0FBRyxpQ0FBbUI7QUFDM0I7QUFDQS9FLElBQUFBLE9BQU8sRUFBRTtBQUZrQixHQUFuQixDQUFaO0FBS0EsUUFBTWtFLHVCQUFjYyxnQkFBZCxFQUFOO0FBQ0EsUUFBTUQsR0FBRyxDQUFDRSxXQUFKLEVBQU47QUFDSDtBQUVEOzs7Ozs7O0FBS08sU0FBU2pFLGdCQUFULENBQTBCa0UsV0FBVyxHQUFDLElBQXRDLEVBQTRDO0FBQy9DN0Isb0JBQVM4QixJQUFUOztBQUNBNUIsd0JBQWFDLGNBQWIsR0FBOEIyQixJQUE5Qjs7QUFDQTFCLHVCQUFZRCxjQUFaLEdBQTZCRSxLQUE3Qjs7QUFDQWMsb0JBQVNXLElBQVQ7O0FBQ0FuQiw2QkFBa0JtQixJQUFsQjs7QUFDQXJCLDJDQUFvQk4sY0FBcEIsR0FBcUM0QixZQUFyQzs7QUFDQW5CLG1CQUFRVCxjQUFSLEdBQXlCMkIsSUFBekI7O0FBQ0FkLDBCQUFlYixjQUFmLEdBQWdDMkIsSUFBaEM7O0FBQ0EsTUFBSXZCLG1CQUFVeUIsTUFBVixFQUFKLEVBQXdCekIsbUJBQVV5QixNQUFWLEdBQW1CRixJQUFuQjs7QUFDeEJqQix5QkFBY2lCLElBQWQ7O0FBQ0EsUUFBTUosR0FBRyxHQUFHeEYsaUNBQWdCQyxHQUFoQixFQUFaOztBQUNBLE1BQUl1RixHQUFKLEVBQVM7QUFDTEEsSUFBQUEsR0FBRyxDQUFDTyxVQUFKO0FBQ0FQLElBQUFBLEdBQUcsQ0FBQ1Esa0JBQUo7O0FBRUEsUUFBSUwsV0FBSixFQUFpQjtBQUNiM0YsdUNBQWdCaUcsS0FBaEI7O0FBQ0F0Qiw2QkFBY3NCLEtBQWQ7QUFDSDtBQUNKO0FBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgTWF0cml4IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IEV2ZW50SW5kZXhQZWcgZnJvbSAnLi9pbmRleGluZy9FdmVudEluZGV4UGVnJztcbmltcG9ydCBjcmVhdGVNYXRyaXhDbGllbnQgZnJvbSAnLi91dGlscy9jcmVhdGVNYXRyaXhDbGllbnQnO1xuaW1wb3J0IEFuYWx5dGljcyBmcm9tICcuL0FuYWx5dGljcyc7XG5pbXBvcnQgTm90aWZpZXIgZnJvbSAnLi9Ob3RpZmllcic7XG5pbXBvcnQgVXNlckFjdGl2aXR5IGZyb20gJy4vVXNlckFjdGl2aXR5JztcbmltcG9ydCBQcmVzZW5jZSBmcm9tICcuL1ByZXNlbmNlJztcbmltcG9ydCBkaXMgZnJvbSAnLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuL3V0aWxzL0RNUm9vbU1hcCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi9Nb2RhbCc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgQWN0aXZlV2lkZ2V0U3RvcmUgZnJvbSAnLi9zdG9yZXMvQWN0aXZlV2lkZ2V0U3RvcmUnO1xuaW1wb3J0IFBsYXRmb3JtUGVnIGZyb20gXCIuL1BsYXRmb3JtUGVnXCI7XG5pbXBvcnQgeyBzZW5kTG9naW5SZXF1ZXN0IH0gZnJvbSBcIi4vTG9naW5cIjtcbmltcG9ydCAqIGFzIFN0b3JhZ2VNYW5hZ2VyIGZyb20gJy4vdXRpbHMvU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IFR5cGluZ1N0b3JlIGZyb20gXCIuL3N0b3Jlcy9UeXBpbmdTdG9yZVwiO1xuaW1wb3J0IFRvYXN0U3RvcmUgZnJvbSBcIi4vc3RvcmVzL1RvYXN0U3RvcmVcIjtcbmltcG9ydCB7SW50ZWdyYXRpb25NYW5hZ2Vyc30gZnJvbSBcIi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCB7TWpvbG5pcn0gZnJvbSBcIi4vbWpvbG5pci9Nam9sbmlyXCI7XG5pbXBvcnQgRGV2aWNlTGlzdGVuZXIgZnJvbSBcIi4vRGV2aWNlTGlzdGVuZXJcIjtcbmltcG9ydCB7Sml0c2l9IGZyb20gXCIuL3dpZGdldHMvSml0c2lcIjtcblxuLyoqXG4gKiBDYWxsZWQgYXQgc3RhcnR1cCwgdG8gYXR0ZW1wdCB0byBidWlsZCBhIGxvZ2dlZC1pbiBNYXRyaXggc2Vzc2lvbi4gSXQgdHJpZXNcbiAqIGEgbnVtYmVyIG9mIHRoaW5nczpcbiAqXG4gKlxuICogMS4gaWYgd2UgaGF2ZSBhIGd1ZXN0IGFjY2VzcyB0b2tlbiBpbiB0aGUgZnJhZ21lbnQgcXVlcnkgcGFyYW1zLCBpdCB1c2VzXG4gKiAgICB0aGF0LlxuICpcbiAqIDIuIGlmIGFuIGFjY2VzcyB0b2tlbiBpcyBzdG9yZWQgaW4gbG9jYWwgc3RvcmFnZSAoZnJvbSBhIHByZXZpb3VzIHNlc3Npb24pLFxuICogICAgaXQgdXNlcyB0aGF0LlxuICpcbiAqIDMuIGl0IGF0dGVtcHRzIHRvIGF1dG8tcmVnaXN0ZXIgYXMgYSBndWVzdCB1c2VyLlxuICpcbiAqIElmIGFueSBvZiBzdGVwcyAxLTQgYXJlIHN1Y2Nlc3NmdWwsIGl0IHdpbGwgY2FsbCB7X2RvU2V0TG9nZ2VkSW59LCB3aGljaCBpblxuICogdHVybiB3aWxsIHJhaXNlIG9uX2xvZ2dlZF9pbiBhbmQgd2lsbF9zdGFydF9jbGllbnQgZXZlbnRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMuZnJhZ21lbnRRdWVyeVBhcmFtczogc3RyaW5nLT5zdHJpbmcgbWFwIG9mIHRoZVxuICogICAgIHF1ZXJ5LXBhcmFtZXRlcnMgZXh0cmFjdGVkIGZyb20gdGhlICMtZnJhZ21lbnQgb2YgdGhlIHN0YXJ0aW5nIFVSSS5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdHMuZW5hYmxlR3Vlc3Q6IHNldCB0byB0cnVlIHRvIGVuYWJsZSBndWVzdCBhY2Nlc3MgdG9rZW5zXG4gKiAgICAgYW5kIGF1dG8tZ3Vlc3QgcmVnaXN0cmF0aW9ucy5cbiAqXG4gKiBAcGFyYW1zIHtzdHJpbmd9IG9wdHMuZ3Vlc3RIc1VybDogaG9tZXNlcnZlciBVUkwuIE9ubHkgdXNlZCBpZiBlbmFibGVHdWVzdCBpc1xuICogICAgIHRydWU7IGRlZmluZXMgdGhlIEhTIHRvIHJlZ2lzdGVyIGFnYWluc3QuXG4gKlxuICogQHBhcmFtcyB7c3RyaW5nfSBvcHRzLmd1ZXN0SXNVcmw6IGhvbWVzZXJ2ZXIgVVJMLiBPbmx5IHVzZWQgaWYgZW5hYmxlR3Vlc3QgaXNcbiAqICAgICB0cnVlOyBkZWZpbmVzIHRoZSBJUyB0byB1c2UuXG4gKlxuICogQHBhcmFtcyB7Ym9vbH0gb3B0cy5pZ25vcmVHdWVzdDogSWYgdGhlIHN0b3JlZCBzZXNzaW9uIGlzIGEgZ3Vlc3QgYWNjb3VudCwgaWdub3JlXG4gKiAgICAgaXQgYW5kIGRvbid0IGxvYWQgaXQuXG4gKlxuICogQHJldHVybnMge1Byb21pc2V9IGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIHRoZSBhYm92ZSBwcm9jZXNzIGNvbXBsZXRlcy5cbiAqICAgICBSZXNvbHZlcyB0byBgdHJ1ZWAgaWYgd2UgZW5kZWQgdXAgc3RhcnRpbmcgYSBzZXNzaW9uLCBvciBgZmFsc2VgIGlmIHdlXG4gKiAgICAgZmFpbGVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFNlc3Npb24ob3B0cykge1xuICAgIHRyeSB7XG4gICAgICAgIGxldCBlbmFibGVHdWVzdCA9IG9wdHMuZW5hYmxlR3Vlc3QgfHwgZmFsc2U7XG4gICAgICAgIGNvbnN0IGd1ZXN0SHNVcmwgPSBvcHRzLmd1ZXN0SHNVcmw7XG4gICAgICAgIGNvbnN0IGd1ZXN0SXNVcmwgPSBvcHRzLmd1ZXN0SXNVcmw7XG4gICAgICAgIGNvbnN0IGZyYWdtZW50UXVlcnlQYXJhbXMgPSBvcHRzLmZyYWdtZW50UXVlcnlQYXJhbXMgfHwge307XG4gICAgICAgIGNvbnN0IGRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZSA9IG9wdHMuZGVmYXVsdERldmljZURpc3BsYXlOYW1lO1xuXG4gICAgICAgIGlmIChlbmFibGVHdWVzdCAmJiAhZ3Vlc3RIc1VybCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2Fubm90IGVuYWJsZSBndWVzdCBhY2Nlc3M6IGNhbid0IGRldGVybWluZSBIUyBVUkwgdG8gdXNlXCIpO1xuICAgICAgICAgICAgZW5hYmxlR3Vlc3QgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbmFibGVHdWVzdCAmJlxuICAgICAgICAgICAgZnJhZ21lbnRRdWVyeVBhcmFtcy5ndWVzdF91c2VyX2lkICYmXG4gICAgICAgICAgICBmcmFnbWVudFF1ZXJ5UGFyYW1zLmd1ZXN0X2FjY2Vzc190b2tlblxuICAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVXNpbmcgZ3Vlc3QgYWNjZXNzIGNyZWRlbnRpYWxzXCIpO1xuICAgICAgICAgICAgcmV0dXJuIF9kb1NldExvZ2dlZEluKHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IGZyYWdtZW50UXVlcnlQYXJhbXMuZ3Vlc3RfdXNlcl9pZCxcbiAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbjogZnJhZ21lbnRRdWVyeVBhcmFtcy5ndWVzdF9hY2Nlc3NfdG9rZW4sXG4gICAgICAgICAgICAgICAgaG9tZXNlcnZlclVybDogZ3Vlc3RIc1VybCxcbiAgICAgICAgICAgICAgICBpZGVudGl0eVNlcnZlclVybDogZ3Vlc3RJc1VybCxcbiAgICAgICAgICAgICAgICBndWVzdDogdHJ1ZSxcbiAgICAgICAgICAgIH0sIHRydWUpLnRoZW4oKCkgPT4gdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IF9yZXN0b3JlRnJvbUxvY2FsU3RvcmFnZSh7XG4gICAgICAgICAgICBpZ25vcmVHdWVzdDogQm9vbGVhbihvcHRzLmlnbm9yZUd1ZXN0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbmFibGVHdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9yZWdpc3RlckFzR3Vlc3QoZ3Vlc3RIc1VybCwgZ3Vlc3RJc1VybCwgZGVmYXVsdERldmljZURpc3BsYXlOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZhbGwgYmFjayB0byB3ZWxjb21lIHNjcmVlblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEFib3J0TG9naW5BbmRSZWJ1aWxkU3RvcmFnZSkge1xuICAgICAgICAgICAgLy8gSWYgd2UncmUgYWJvcnRpbmcgbG9naW4gYmVjYXVzZSBvZiBhIHN0b3JhZ2UgaW5jb25zaXN0ZW5jeSwgd2UgZG9uJ3RcbiAgICAgICAgICAgIC8vIG5lZWQgdG8gc2hvdyB0aGUgZ2VuZXJhbCBmYWlsdXJlIGRpYWxvZy4gSW5zdGVhZCwganVzdCBnbyBiYWNrIHRvIHdlbGNvbWUuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9oYW5kbGVMb2FkU2Vzc2lvbkZhaWx1cmUoZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIHVzZXIgSUQgb2YgdGhlIHBlcnNpc3RlZCBzZXNzaW9uLCBpZiBvbmUgZXhpc3RzLiBUaGlzIGRvZXMgbm90IHZhbGlkYXRlXG4gKiB0aGF0IHRoZSB1c2VyJ3MgY3JlZGVudGlhbHMgc3RpbGwgd29yaywganVzdCB0aGF0IHRoZXkgZXhpc3QgYW5kIHRoYXQgYSB1c2VyIElEXG4gKiBpcyBhc3NvY2lhdGVkIHdpdGggdGhlbS4gVGhlIHNlc3Npb24gaXMgbm90IGxvYWRlZC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBwZXJzaXN0ZWQgc2Vzc2lvbidzIG93bmVyLCBpZiBhbiBvd25lciBleGlzdHMuIE51bGwgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmVkU2Vzc2lvbk93bmVyKCkge1xuICAgIGNvbnN0IHtoc1VybCwgdXNlcklkLCBhY2Nlc3NUb2tlbn0gPSBnZXRMb2NhbFN0b3JhZ2VTZXNzaW9uVmFycygpO1xuICAgIHJldHVybiBoc1VybCAmJiB1c2VySWQgJiYgYWNjZXNzVG9rZW4gPyB1c2VySWQgOiBudWxsO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHtib29sfSBUcnVlIGlmIHRoZSBzdG9yZWQgc2Vzc2lvbiBpcyBmb3IgYSBndWVzdCB1c2VyIG9yIGZhbHNlIGlmIGl0IGlzXG4gKiAgICAgZm9yIGEgcmVhbCB1c2VyLiBJZiB0aGVyZSBpcyBubyBzdG9yZWQgc2Vzc2lvbiwgcmV0dXJuIG51bGwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdG9yZWRTZXNzaW9uSXNHdWVzdCgpIHtcbiAgICBjb25zdCBzZXNzVmFycyA9IGdldExvY2FsU3RvcmFnZVNlc3Npb25WYXJzKCk7XG4gICAgcmV0dXJuIHNlc3NWYXJzLmhzVXJsICYmIHNlc3NWYXJzLnVzZXJJZCAmJiBzZXNzVmFycy5hY2Nlc3NUb2tlbiA/IHNlc3NWYXJzLmlzR3Vlc3QgOiBudWxsO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeVBhcmFtcyAgICBzdHJpbmctPnN0cmluZyBtYXAgb2YgdGhlXG4gKiAgICAgcXVlcnktcGFyYW1ldGVycyBleHRyYWN0ZWQgZnJvbSB0aGUgcmVhbCBxdWVyeS1zdHJpbmcgb2YgdGhlIHN0YXJ0aW5nXG4gKiAgICAgVVJJLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWVcbiAqXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB3aGljaCByZXNvbHZlcyB0byB0cnVlIGlmIHdlIGNvbXBsZXRlZCB0aGUgdG9rZW5cbiAqICAgIGxvZ2luLCBlbHNlIGZhbHNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRlbXB0VG9rZW5Mb2dpbihxdWVyeVBhcmFtcywgZGVmYXVsdERldmljZURpc3BsYXlOYW1lKSB7XG4gICAgaWYgKCFxdWVyeVBhcmFtcy5sb2dpblRva2VuKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH1cblxuICAgIGlmICghcXVlcnlQYXJhbXMuaG9tZXNlcnZlcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJDYW5ub3QgbG9nIGluIHdpdGggdG9rZW46IGNhbid0IGRldGVybWluZSBIUyBVUkwgdG8gdXNlXCIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VuZExvZ2luUmVxdWVzdChcbiAgICAgICAgcXVlcnlQYXJhbXMuaG9tZXNlcnZlcixcbiAgICAgICAgcXVlcnlQYXJhbXMuaWRlbnRpdHlTZXJ2ZXIsXG4gICAgICAgIFwibS5sb2dpbi50b2tlblwiLCB7XG4gICAgICAgICAgICB0b2tlbjogcXVlcnlQYXJhbXMubG9naW5Ub2tlbixcbiAgICAgICAgICAgIGluaXRpYWxfZGV2aWNlX2Rpc3BsYXlfbmFtZTogZGVmYXVsdERldmljZURpc3BsYXlOYW1lLFxuICAgICAgICB9LFxuICAgICkudGhlbihmdW5jdGlvbihjcmVkcykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkxvZ2dlZCBpbiB3aXRoIHRva2VuXCIpO1xuICAgICAgICByZXR1cm4gX2NsZWFyU3RvcmFnZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgX3BlcnNpc3RDcmVkZW50aWFsc1RvTG9jYWxTdG9yYWdlKGNyZWRzKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gbG9nIGluIHdpdGggbG9naW4gdG9rZW46IFwiICsgZXJyICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIGVyci5kYXRhKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlSW52YWxpZFN0b3JlRXJyb3IoZSkge1xuICAgIGlmIChlLnJlYXNvbiA9PT0gTWF0cml4LkludmFsaWRTdG9yZUVycm9yLlRPR0dMRURfTEFaWV9MT0FESU5HKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxhenlMb2FkRW5hYmxlZCA9IGUudmFsdWU7XG4gICAgICAgICAgICBpZiAobGF6eUxvYWRFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgTGF6eUxvYWRpbmdSZXN5bmNEaWFsb2cgPVxuICAgICAgICAgICAgICAgICAgICBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZGlhbG9ncy5MYXp5TG9hZGluZ1Jlc3luY0RpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlRGlhbG9nKExhenlMb2FkaW5nUmVzeW5jRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gc2hvdyB3YXJuaW5nIGFib3V0IHNpbXVsdGFuZW91cyB1c2VcbiAgICAgICAgICAgICAgICAvLyBiZXR3ZWVuIExML25vbi1MTCB2ZXJzaW9uIG9uIHNhbWUgaG9zdC5cbiAgICAgICAgICAgICAgICAvLyBhcyBkaXNhYmxpbmcgTEwgd2hlbiBwcmV2aW91c2x5IGVuYWJsZWRcbiAgICAgICAgICAgICAgICAvLyBpcyBhIHN0cm9uZyBpbmRpY2F0b3Igb2YgdGhpcyAoL2RldmVsb3AgJiAvYXBwKVxuICAgICAgICAgICAgICAgIGNvbnN0IExhenlMb2FkaW5nRGlzYWJsZWREaWFsb2cgPVxuICAgICAgICAgICAgICAgICAgICBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZGlhbG9ncy5MYXp5TG9hZGluZ0Rpc2FibGVkRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVEaWFsb2coTGF6eUxvYWRpbmdEaXNhYmxlZERpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25GaW5pc2hlZDogcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvc3Q6IHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnN0b3JlLmRlbGV0ZUFsbERhdGEoKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5yZWxvYWQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfcmVnaXN0ZXJBc0d1ZXN0KGhzVXJsLCBpc1VybCwgZGVmYXVsdERldmljZURpc3BsYXlOYW1lKSB7XG4gICAgY29uc29sZS5sb2coYERvaW5nIGd1ZXN0IGxvZ2luIG9uICR7aHNVcmx9YCk7XG5cbiAgICAvLyBjcmVhdGUgYSB0ZW1wb3JhcnkgTWF0cml4Q2xpZW50IHRvIGRvIHRoZSBsb2dpblxuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeC5jcmVhdGVDbGllbnQoe1xuICAgICAgICBiYXNlVXJsOiBoc1VybCxcbiAgICB9KTtcblxuICAgIHJldHVybiBjbGllbnQucmVnaXN0ZXJHdWVzdCh7XG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGluaXRpYWxfZGV2aWNlX2Rpc3BsYXlfbmFtZTogZGVmYXVsdERldmljZURpc3BsYXlOYW1lLFxuICAgICAgICB9LFxuICAgIH0pLnRoZW4oKGNyZWRzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBSZWdpc3RlcmVkIGFzIGd1ZXN0OiAke2NyZWRzLnVzZXJfaWR9YCk7XG4gICAgICAgIHJldHVybiBfZG9TZXRMb2dnZWRJbih7XG4gICAgICAgICAgICB1c2VySWQ6IGNyZWRzLnVzZXJfaWQsXG4gICAgICAgICAgICBkZXZpY2VJZDogY3JlZHMuZGV2aWNlX2lkLFxuICAgICAgICAgICAgYWNjZXNzVG9rZW46IGNyZWRzLmFjY2Vzc190b2tlbixcbiAgICAgICAgICAgIGhvbWVzZXJ2ZXJVcmw6IGhzVXJsLFxuICAgICAgICAgICAgaWRlbnRpdHlTZXJ2ZXJVcmw6IGlzVXJsLFxuICAgICAgICAgICAgZ3Vlc3Q6IHRydWUsXG4gICAgICAgIH0sIHRydWUpLnRoZW4oKCkgPT4gdHJ1ZSk7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlZ2lzdGVyIGFzIGd1ZXN0XCIsIGVycik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHN0b3JlZCBzZXNzaW9uIGluIGxvY2Fsc3RvcmFnZS4gVGhlIHNlc3Npb25cbiAqIG1heSBub3QgYmUgdmFsaWQsIGFzIGl0IGlzIG5vdCB0ZXN0ZWQgZm9yIGNvbnNpc3RlbmN5IGhlcmUuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiAtIHNlZSBpbXBsZW1lbnRhdGlvbiBmb3IgdmFyaWFibGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxTdG9yYWdlU2Vzc2lvblZhcnMoKSB7XG4gICAgY29uc3QgaHNVcmwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm14X2hzX3VybFwiKTtcbiAgICBjb25zdCBpc1VybCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibXhfaXNfdXJsXCIpO1xuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9hY2Nlc3NfdG9rZW5cIik7XG4gICAgY29uc3QgdXNlcklkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF91c2VyX2lkXCIpO1xuICAgIGNvbnN0IGRldmljZUlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9kZXZpY2VfaWRcIik7XG5cbiAgICBsZXQgaXNHdWVzdDtcbiAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9pc19ndWVzdFwiKSAhPT0gbnVsbCkge1xuICAgICAgICBpc0d1ZXN0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9pc19ndWVzdFwiKSA9PT0gXCJ0cnVlXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbGVnYWN5IGtleSBuYW1lXG4gICAgICAgIGlzR3Vlc3QgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm1hdHJpeC1pcy1ndWVzdFwiKSA9PT0gXCJ0cnVlXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtoc1VybCwgaXNVcmwsIGFjY2Vzc1Rva2VuLCB1c2VySWQsIGRldmljZUlkLCBpc0d1ZXN0fTtcbn1cblxuLy8gcmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gdHJ1ZSBpZiBhIHNlc3Npb24gaXMgZm91bmQgaW5cbi8vIGxvY2Fsc3RvcmFnZVxuLy9cbi8vIE4uQi4gTGlmZWN5Y2xlLmpzIHNob3VsZCBub3QgbWFpbnRhaW4gYW55IGZ1cnRoZXIgbG9jYWxTdG9yYWdlIHN0YXRlLCB3ZVxuLy8gICAgICBhcmUgbW92aW5nIHRvd2FyZHMgdXNpbmcgU2Vzc2lvblN0b3JlIHRvIGtlZXAgdHJhY2sgb2Ygc3RhdGUgcmVsYXRlZFxuLy8gICAgICB0byB0aGUgY3VycmVudCBzZXNzaW9uICh3aGljaCBpcyB0eXBpY2FsbHkgYmFja2VkIGJ5IGxvY2FsU3RvcmFnZSkuXG4vL1xuLy8gICAgICBUaGUgcGxhbiBpcyB0byBncmFkdWFsbHkgbW92ZSB0aGUgbG9jYWxTdG9yYWdlIGFjY2VzcyBkb25lIGhlcmUgaW50b1xuLy8gICAgICBTZXNzaW9uU3RvcmUgdG8gYXZvaWQgYnVncyB3aGVyZSB0aGUgdmlldyBiZWNvbWVzIG91dC1vZi1zeW5jIHdpdGhcbi8vICAgICAgbG9jYWxTdG9yYWdlIChlLmcuIGlzR3Vlc3QgZXRjLilcbmFzeW5jIGZ1bmN0aW9uIF9yZXN0b3JlRnJvbUxvY2FsU3RvcmFnZShvcHRzKSB7XG4gICAgY29uc3QgaWdub3JlR3Vlc3QgPSBvcHRzLmlnbm9yZUd1ZXN0O1xuXG4gICAgaWYgKCFsb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHtoc1VybCwgaXNVcmwsIGFjY2Vzc1Rva2VuLCB1c2VySWQsIGRldmljZUlkLCBpc0d1ZXN0fSA9IGdldExvY2FsU3RvcmFnZVNlc3Npb25WYXJzKCk7XG5cbiAgICBpZiAoYWNjZXNzVG9rZW4gJiYgdXNlcklkICYmIGhzVXJsKSB7XG4gICAgICAgIGlmIChpZ25vcmVHdWVzdCAmJiBpc0d1ZXN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIklnbm9yaW5nIHN0b3JlZCBndWVzdCBhY2NvdW50OiBcIiArIHVzZXJJZCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgUmVzdG9yaW5nIHNlc3Npb24gZm9yICR7dXNlcklkfWApO1xuICAgICAgICBhd2FpdCBfZG9TZXRMb2dnZWRJbih7XG4gICAgICAgICAgICB1c2VySWQ6IHVzZXJJZCxcbiAgICAgICAgICAgIGRldmljZUlkOiBkZXZpY2VJZCxcbiAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiBhY2Nlc3NUb2tlbixcbiAgICAgICAgICAgIGhvbWVzZXJ2ZXJVcmw6IGhzVXJsLFxuICAgICAgICAgICAgaWRlbnRpdHlTZXJ2ZXJVcmw6IGlzVXJsLFxuICAgICAgICAgICAgZ3Vlc3Q6IGlzR3Vlc3QsXG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJObyBwcmV2aW91cyBzZXNzaW9uIGZvdW5kLlwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gX2hhbmRsZUxvYWRTZXNzaW9uRmFpbHVyZShlKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byBsb2FkIHNlc3Npb25cIiwgZSk7XG5cbiAgICBjb25zdCBTZXNzaW9uUmVzdG9yZUVycm9yRGlhbG9nID1cbiAgICAgICAgICBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLlNlc3Npb25SZXN0b3JlRXJyb3JEaWFsb2cnKTtcblxuICAgIGNvbnN0IG1vZGFsID0gTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2Vzc2lvbiBSZXN0b3JlIEVycm9yJywgJycsIFNlc3Npb25SZXN0b3JlRXJyb3JEaWFsb2csIHtcbiAgICAgICAgZXJyb3I6IGUubWVzc2FnZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IFtzdWNjZXNzXSA9IGF3YWl0IG1vZGFsLmZpbmlzaGVkO1xuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIC8vIHVzZXIgY2xpY2tlZCBjb250aW51ZS5cbiAgICAgICAgYXdhaXQgX2NsZWFyU3RvcmFnZSgpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gdHJ5LCB0cnkgYWdhaW5cbiAgICByZXR1cm4gbG9hZFNlc3Npb24oKTtcbn1cblxuLyoqXG4gKiBUcmFuc2l0aW9ucyB0byBhIGxvZ2dlZC1pbiBzdGF0ZSB1c2luZyB0aGUgZ2l2ZW4gY3JlZGVudGlhbHMuXG4gKlxuICogU3RhcnRzIHRoZSBtYXRyaXggY2xpZW50IGFuZCBhbGwgb3RoZXIgcmVhY3Qtc2RrIHNlcnZpY2VzIHRoYXRcbiAqIGxpc3RlbiBmb3IgZXZlbnRzIHdoaWxlIGEgc2Vzc2lvbiBpcyBsb2dnZWQgaW4uXG4gKlxuICogQWxzbyBzdG9wcyB0aGUgb2xkIE1hdHJpeENsaWVudCBhbmQgY2xlYXJzIG9sZCBjcmVkZW50aWFscy9ldGMgb3V0IG9mXG4gKiBzdG9yYWdlIGJlZm9yZSBzdGFydGluZyB0aGUgbmV3IGNsaWVudC5cbiAqXG4gKiBAcGFyYW0ge01hdHJpeENsaWVudENyZWRzfSBjcmVkZW50aWFscyBUaGUgY3JlZGVudGlhbHMgdG8gdXNlXG4gKlxuICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gdGhlIG5ldyBNYXRyaXhDbGllbnQgb25jZSBpdCBoYXMgYmVlbiBzdGFydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMb2dnZWRJbihjcmVkZW50aWFscykge1xuICAgIHN0b3BNYXRyaXhDbGllbnQoKTtcbiAgICByZXR1cm4gX2RvU2V0TG9nZ2VkSW4oY3JlZGVudGlhbHMsIHRydWUpO1xufVxuXG4vKipcbiAqIEh5ZHJhdGVzIGFuIGV4aXN0aW5nIHNlc3Npb24gYnkgdXNpbmcgdGhlIGNyZWRlbnRpYWxzIHByb3ZpZGVkLiBUaGlzIHdpbGxcbiAqIG5vdCBjbGVhciBhbnkgbG9jYWwgc3RvcmFnZSwgdW5saWtlIHNldExvZ2dlZEluKCkuXG4gKlxuICogU3RvcHMgdGhlIGV4aXN0aW5nIE1hdHJpeCBjbGllbnQgKHdpdGhvdXQgY2xlYXJpbmcgaXRzIGRhdGEpIGFuZCBzdGFydHMgYVxuICogbmV3IG9uZSBpbiBpdHMgcGxhY2UuIFRoaXMgYWRkaXRpb25hbGx5IHN0YXJ0cyBhbGwgb3RoZXIgcmVhY3Qtc2RrIHNlcnZpY2VzXG4gKiB3aGljaCB1c2UgdGhlIG5ldyBNYXRyaXggY2xpZW50LlxuICpcbiAqIElmIHRoZSBjcmVkZW50aWFscyBiZWxvbmcgdG8gYSBkaWZmZXJlbnQgdXNlciBmcm9tIHRoZSBzZXNzaW9uIGFscmVhZHkgc3RvcmVkLFxuICogdGhlIG9sZCBzZXNzaW9uIHdpbGwgYmUgY2xlYXJlZCBhdXRvbWF0aWNhbGx5LlxuICpcbiAqIEBwYXJhbSB7TWF0cml4Q2xpZW50Q3JlZHN9IGNyZWRlbnRpYWxzIFRoZSBjcmVkZW50aWFscyB0byB1c2VcbiAqXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB3aGljaCByZXNvbHZlcyB0byB0aGUgbmV3IE1hdHJpeENsaWVudCBvbmNlIGl0IGhhcyBiZWVuIHN0YXJ0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGh5ZHJhdGVTZXNzaW9uKGNyZWRlbnRpYWxzKSB7XG4gICAgY29uc3Qgb2xkVXNlcklkID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IG9sZERldmljZUlkID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldERldmljZUlkKCk7XG5cbiAgICBzdG9wTWF0cml4Q2xpZW50KCk7IC8vIHVuc2V0cyBNYXRyaXhDbGllbnRQZWcuZ2V0KClcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcIm14X3NvZnRfbG9nb3V0XCIpO1xuICAgIF9pc0xvZ2dpbmdPdXQgPSBmYWxzZTtcblxuICAgIGNvbnN0IG92ZXJ3cml0ZSA9IGNyZWRlbnRpYWxzLnVzZXJJZCAhPT0gb2xkVXNlcklkIHx8IGNyZWRlbnRpYWxzLmRldmljZUlkICE9PSBvbGREZXZpY2VJZDtcbiAgICBpZiAob3ZlcndyaXRlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkNsZWFyaW5nIGFsbCBkYXRhOiBPbGQgc2Vzc2lvbiBiZWxvbmdzIHRvIGEgZGlmZmVyZW50IHVzZXIvc2Vzc2lvblwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX2RvU2V0TG9nZ2VkSW4oY3JlZGVudGlhbHMsIG92ZXJ3cml0ZSk7XG59XG5cbi8qKlxuICogZmlyZXMgb25fbG9nZ2luZ19pbiwgb3B0aW9uYWxseSBjbGVhcnMgbG9jYWxzdG9yYWdlLCBwZXJzaXN0cyBuZXcgY3JlZGVudGlhbHNcbiAqIHRvIGxvY2Fsc3RvcmFnZSwgc3RhcnRzIHRoZSBuZXcgY2xpZW50LlxuICpcbiAqIEBwYXJhbSB7TWF0cml4Q2xpZW50Q3JlZHN9IGNyZWRlbnRpYWxzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNsZWFyU3RvcmFnZVxuICpcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHRvIHRoZSBuZXcgTWF0cml4Q2xpZW50IG9uY2UgaXQgaGFzIGJlZW4gc3RhcnRlZFxuICovXG5hc3luYyBmdW5jdGlvbiBfZG9TZXRMb2dnZWRJbihjcmVkZW50aWFscywgY2xlYXJTdG9yYWdlKSB7XG4gICAgY3JlZGVudGlhbHMuZ3Vlc3QgPSBCb29sZWFuKGNyZWRlbnRpYWxzLmd1ZXN0KTtcblxuICAgIGNvbnN0IHNvZnRMb2dvdXQgPSBpc1NvZnRMb2dvdXQoKTtcblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBcInNldExvZ2dlZEluOiBteGlkOiBcIiArIGNyZWRlbnRpYWxzLnVzZXJJZCArXG4gICAgICAgIFwiIGRldmljZUlkOiBcIiArIGNyZWRlbnRpYWxzLmRldmljZUlkICtcbiAgICAgICAgXCIgZ3Vlc3Q6IFwiICsgY3JlZGVudGlhbHMuZ3Vlc3QgK1xuICAgICAgICBcIiBoczogXCIgKyBjcmVkZW50aWFscy5ob21lc2VydmVyVXJsICtcbiAgICAgICAgXCIgc29mdExvZ291dDogXCIgKyBzb2Z0TG9nb3V0LFxuICAgICk7XG5cbiAgICAvLyBUaGlzIGlzIGRpc3BhdGNoZWQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXNlciBpcyBzdGlsbCBpbiB0aGUgcHJvY2VzcyBvZiBsb2dnaW5nIGluXG4gICAgLy8gYmVjYXVzZSBhc3luYyBjb2RlIG1heSB0YWtlIHNvbWUgdGltZSB0byByZXNvbHZlLCBicmVha2luZyB0aGUgYXNzdW1wdGlvbiB0aGF0XG4gICAgLy8gYHNldExvZ2dlZEluYCB0YWtlcyBhbiBcImluc3RhbnRcIiB0byBjb21wbGV0ZSwgYW5kIGRpc3BhdGNoIGBvbl9sb2dnZWRfaW5gIGEgZmV3IG1zXG4gICAgLy8gbGF0ZXIgdGhhbiBNYXRyaXhDaGF0IG1pZ2h0IGFzc3VtZS5cbiAgICAvL1xuICAgIC8vIHdlIGZpcmUgaXQgKnN5bmNocm9ub3VzbHkqIHRvIG1ha2Ugc3VyZSBpdCBmaXJlcyBiZWZvcmUgb25fbG9nZ2VkX2luLlxuICAgIC8vIChkaXMuZGlzcGF0Y2ggdXNlcyBgc2V0VGltZW91dGAsIHdoaWNoIGRvZXMgbm90IGd1YXJhbnRlZSBvcmRlcmluZy4pXG4gICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdvbl9sb2dnaW5nX2luJ30sIHRydWUpO1xuXG4gICAgaWYgKGNsZWFyU3RvcmFnZSkge1xuICAgICAgICBhd2FpdCBfY2xlYXJTdG9yYWdlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFN0b3JhZ2VNYW5hZ2VyLmNoZWNrQ29uc2lzdGVuY3koKTtcbiAgICAvLyBJZiB0aGVyZSdzIGFuIGluY29uc2lzdGVuY3kgYmV0d2VlbiBhY2NvdW50IGRhdGEgaW4gbG9jYWwgc3RvcmFnZSBhbmQgdGhlXG4gICAgLy8gY3J5cHRvIHN0b3JlLCB3ZSdsbCBiZSBnZW5lcmFsbHkgY29uZnVzZWQgd2hlbiBoYW5kbGluZyBlbmNyeXB0ZWQgZGF0YS5cbiAgICAvLyBTaG93IGEgbW9kYWwgcmVjb21tZW5kaW5nIGEgZnVsbCByZXNldCBvZiBzdG9yYWdlLlxuICAgIGlmIChyZXN1bHRzLmRhdGFJbkxvY2FsU3RvcmFnZSAmJiByZXN1bHRzLmNyeXB0b0luaXRlZCAmJiAhcmVzdWx0cy5kYXRhSW5DcnlwdG9TdG9yZSkge1xuICAgICAgICBjb25zdCBzaWduT3V0ID0gYXdhaXQgX3Nob3dTdG9yYWdlRXZpY3RlZERpYWxvZygpO1xuICAgICAgICBpZiAoc2lnbk91dCkge1xuICAgICAgICAgICAgYXdhaXQgX2NsZWFyU3RvcmFnZSgpO1xuICAgICAgICAgICAgLy8gVGhpcyBlcnJvciBmZWVscyBhIGJpdCBjbHVua3ksIGJ1dCB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBnbyBhbnlcbiAgICAgICAgICAgIC8vIGZ1cnRoZXIgYW5kIGluc3RlYWQgaGVhZCBiYWNrIHRvIHNpZ24gaW4uXG4gICAgICAgICAgICB0aHJvdyBuZXcgQWJvcnRMb2dpbkFuZFJlYnVpbGRTdG9yYWdlKFxuICAgICAgICAgICAgICAgIFwiQWJvcnRpbmcgbG9naW4gaW4gcHJvZ3Jlc3MgYmVjYXVzZSBvZiBzdG9yYWdlIGluY29uc2lzdGVuY3lcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBBbmFseXRpY3Muc2V0TG9nZ2VkSW4oY3JlZGVudGlhbHMuZ3Vlc3QsIGNyZWRlbnRpYWxzLmhvbWVzZXJ2ZXJVcmwpO1xuXG4gICAgaWYgKGxvY2FsU3RvcmFnZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgX3BlcnNpc3RDcmVkZW50aWFsc1RvTG9jYWxTdG9yYWdlKGNyZWRlbnRpYWxzKTtcblxuICAgICAgICAgICAgLy8gVGhlIHVzZXIgcmVnaXN0ZXJlZCBhcyBhIFBXTFUgKFBhc3NXb3JkLUxlc3MgVXNlciksIHRoZSBnZW5lcmF0ZWQgcGFzc3dvcmRcbiAgICAgICAgICAgIC8vIGlzIGNhY2hlZCBoZXJlIHN1Y2ggdGhhdCB0aGUgdXNlciBjYW4gY2hhbmdlIGl0IGF0IGEgbGF0ZXIgdGltZS5cbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscy5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBTZXNzaW9uU3RvcmVcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdjYWNoZWRfcGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRQYXNzd29yZDogY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkVycm9yIHVzaW5nIGxvY2FsIHN0b3JhZ2U6IGNhbid0IHBlcnNpc3Qgc2Vzc2lvbiFcIiwgZSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJObyBsb2NhbCBzdG9yYWdlIGF2YWlsYWJsZTogY2FuJ3QgcGVyc2lzdCBzZXNzaW9uIVwiKTtcbiAgICB9XG5cbiAgICBNYXRyaXhDbGllbnRQZWcucmVwbGFjZVVzaW5nQ3JlZHMoY3JlZGVudGlhbHMpO1xuXG4gICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiAnb25fbG9nZ2VkX2luJyB9KTtcblxuICAgIGF3YWl0IHN0YXJ0TWF0cml4Q2xpZW50KC8qc3RhcnRTeW5jaW5nPSovIXNvZnRMb2dvdXQpO1xuICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG59XG5cbmZ1bmN0aW9uIF9zaG93U3RvcmFnZUV2aWN0ZWREaWFsb2coKSB7XG4gICAgY29uc3QgU3RvcmFnZUV2aWN0ZWREaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLlN0b3JhZ2VFdmljdGVkRGlhbG9nJyk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTdG9yYWdlIGV2aWN0ZWQnLCAnJywgU3RvcmFnZUV2aWN0ZWREaWFsb2csIHtcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IHJlc29sdmUsXG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vLyBOb3RlOiBCYWJlbCA2IHJlcXVpcmVzIHRoZSBgdHJhbnNmb3JtLWJ1aWx0aW4tZXh0ZW5kYCBwbHVnaW4gZm9yIHRoaXMgdG8gc2F0aXNmeVxuLy8gYGluc3RhbmNlb2ZgLiBCYWJlbCA3IHN1cHBvcnRzIHRoaXMgbmF0aXZlbHkgaW4gdGhlaXIgY2xhc3MgaGFuZGxpbmcuXG5jbGFzcyBBYm9ydExvZ2luQW5kUmVidWlsZFN0b3JhZ2UgZXh0ZW5kcyBFcnJvciB7IH1cblxuZnVuY3Rpb24gX3BlcnNpc3RDcmVkZW50aWFsc1RvTG9jYWxTdG9yYWdlKGNyZWRlbnRpYWxzKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJteF9oc191cmxcIiwgY3JlZGVudGlhbHMuaG9tZXNlcnZlclVybCk7XG4gICAgaWYgKGNyZWRlbnRpYWxzLmlkZW50aXR5U2VydmVyVXJsKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfaXNfdXJsXCIsIGNyZWRlbnRpYWxzLmlkZW50aXR5U2VydmVyVXJsKTtcbiAgICB9XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJteF91c2VyX2lkXCIsIGNyZWRlbnRpYWxzLnVzZXJJZCk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJteF9hY2Nlc3NfdG9rZW5cIiwgY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4pO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfaXNfZ3Vlc3RcIiwgSlNPTi5zdHJpbmdpZnkoY3JlZGVudGlhbHMuZ3Vlc3QpKTtcblxuICAgIC8vIGlmIHdlIGRpZG4ndCBnZXQgYSBkZXZpY2VJZCBmcm9tIHRoZSBsb2dpbiwgbGVhdmUgbXhfZGV2aWNlX2lkIHVuc2V0LFxuICAgIC8vIHJhdGhlciB0aGFuIHNldHRpbmcgaXQgdG8gXCJ1bmRlZmluZWRcIi5cbiAgICAvL1xuICAgIC8vIChpbiB0aGlzIGNhc2UgTWF0cml4Q2xpZW50IGRvZXNuJ3QgYm90aGVyIHdpdGggdGhlIGNyeXB0byBzdHVmZlxuICAgIC8vIC0gdGhhdCdzIGZpbmUgZm9yIHVzKS5cbiAgICBpZiAoY3JlZGVudGlhbHMuZGV2aWNlSWQpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJteF9kZXZpY2VfaWRcIiwgY3JlZGVudGlhbHMuZGV2aWNlSWQpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBTZXNzaW9uIHBlcnNpc3RlZCBmb3IgJHtjcmVkZW50aWFscy51c2VySWR9YCk7XG59XG5cbmxldCBfaXNMb2dnaW5nT3V0ID0gZmFsc2U7XG5cbi8qKlxuICogTG9ncyB0aGUgY3VycmVudCBzZXNzaW9uIG91dCBhbmQgdHJhbnNpdGlvbnMgdG8gdGhlIGxvZ2dlZC1vdXQgc3RhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvZ291dCgpIHtcbiAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKSkgcmV0dXJuO1xuXG4gICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHtcbiAgICAgICAgLy8gbG9nb3V0IGRvZXNuJ3Qgd29yayBmb3IgZ3Vlc3Qgc2Vzc2lvbnNcbiAgICAgICAgLy8gQWxzbyB3ZSBzb21ldGltZXMgd2FudCB0byByZS1sb2cgaW4gYSBndWVzdCBzZXNzaW9uXG4gICAgICAgIC8vIGlmIHdlIGFib3J0IHRoZSBsb2dpblxuICAgICAgICBvbkxvZ2dlZE91dCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgX2lzTG9nZ2luZ091dCA9IHRydWU7XG4gICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmxvZ291dCgpLnRoZW4ob25Mb2dnZWRPdXQsXG4gICAgICAgIChlcnIpID0+IHtcbiAgICAgICAgICAgIC8vIEp1c3QgdGhyb3dpbmcgYW4gZXJyb3IgaGVyZSBpcyBnb2luZyB0byBiZSB2ZXJ5IHVuaGVscGZ1bFxuICAgICAgICAgICAgLy8gaWYgeW91J3JlIHRyeWluZyB0byBsb2cgb3V0IGJlY2F1c2UgeW91ciBzZXJ2ZXIncyBkb3duIGFuZFxuICAgICAgICAgICAgLy8geW91IHdhbnQgdG8gbG9nIGludG8gYSBkaWZmZXJlbnQgc2VydmVyLCBzbyBqdXN0IGZvcmdldCB0aGVcbiAgICAgICAgICAgIC8vIGFjY2VzcyB0b2tlbi4gSXQncyBhbm5veWluZyB0aGF0IHRoaXMgd2lsbCBsZWF2ZSB0aGUgYWNjZXNzXG4gICAgICAgICAgICAvLyB0b2tlbiBzdGlsbCB2YWxpZCwgYnV0IHdlIHNob3VsZCBmaXggdGhpcyBieSBoYXZpbmcgYWNjZXNzXG4gICAgICAgICAgICAvLyB0b2tlbnMgZXhwaXJlIChhbmQgaWYgeW91IHJlYWxseSB0aGluayB5b3UndmUgYmVlbiBjb21wcm9taXNlZCxcbiAgICAgICAgICAgIC8vIGNoYW5nZSB5b3VyIHBhc3N3b3JkKS5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRmFpbGVkIHRvIGNhbGwgbG9nb3V0IEFQSTogdG9rZW4gd2lsbCBub3QgYmUgaW52YWxpZGF0ZWRcIik7XG4gICAgICAgICAgICBvbkxvZ2dlZE91dCgpO1xuICAgICAgICB9LFxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb2Z0TG9nb3V0KCkge1xuICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpKSByZXR1cm47XG5cbiAgICAvLyBUcmFjayB0aGF0IHdlJ3ZlIGRldGVjdGVkIGFuZCB0cmFwcGVkIGEgc29mdCBsb2dvdXQuIFRoaXMgaGVscHMgcHJldmVudCBvdGhlclxuICAgIC8vIHBhcnRzIG9mIHRoZSBhcHAgZnJvbSBzdGFydGluZyBpZiB0aGVyZSdzIG5vIHBvaW50IChpZTogZG9uJ3Qgc3luYyBpZiB3ZSd2ZVxuICAgIC8vIGJlZW4gc29mdCBsb2dnZWQgb3V0LCBkZXNwaXRlIGhhdmluZyBjcmVkZW50aWFscyBhbmQgZGF0YSBmb3IgYSBNYXRyaXhDbGllbnQpLlxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfc29mdF9sb2dvdXRcIiwgXCJ0cnVlXCIpO1xuXG4gICAgLy8gRGV2IG5vdGU6IHBsZWFzZSBrZWVwIHRoaXMgbG9nIGxpbmUgYXJvdW5kLiBJdCBjYW4gYmUgdXNlZnVsIGZvciB0cmFjayBkb3duXG4gICAgLy8gcmFuZG9tIGNsaWVudHMgc3RvcHBpbmcgaW4gdGhlIG1pZGRsZSBvZiB0aGUgbG9ncy5cbiAgICBjb25zb2xlLmxvZyhcIlNvZnQgbG9nb3V0IGluaXRpYXRlZFwiKTtcbiAgICBfaXNMb2dnaW5nT3V0ID0gdHJ1ZTsgLy8gdG8gYXZvaWQgcmVwZWF0ZWQgZmxhZ3NcbiAgICAvLyBFbnN1cmUgdGhhdCB3ZSBkaXNwYXRjaCBhIHZpZXcgY2hhbmdlICoqYmVmb3JlKiogc3RvcHBpbmcgdGhlIGNsaWVudCBzb1xuICAgIC8vIHNvIHRoYXQgUmVhY3QgY29tcG9uZW50cyB1bm1vdW50IGZpcnN0LiBUaGlzIGF2b2lkcyBSZWFjdCBzb2Z0IGNyYXNoZXNcbiAgICAvLyB0aGF0IGNhbiBvY2N1ciB3aGVuIGNvbXBvbmVudHMgdHJ5IHRvIHVzZSBhIG51bGwgY2xpZW50LlxuICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnb25fY2xpZW50X25vdF92aWFibGUnfSk7IC8vIGdlbmVyaWMgdmVyc2lvbiBvZiBvbl9sb2dnZWRfb3V0XG4gICAgc3RvcE1hdHJpeENsaWVudCgvKnVuc2V0Q2xpZW50PSovZmFsc2UpO1xuXG4gICAgLy8gRE8gTk9UIENBTEwgTE9HT1VULiBBIHNvZnQgbG9nb3V0IHByZXNlcnZlcyBkYXRhLCBsb2dvdXQgZG9lcyBub3QuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NvZnRMb2dvdXQoKSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibXhfc29mdF9sb2dvdXRcIikgPT09IFwidHJ1ZVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2dnaW5nT3V0KCkge1xuICAgIHJldHVybiBfaXNMb2dnaW5nT3V0O1xufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgbWF0cml4IGNsaWVudCBhbmQgYWxsIG90aGVyIHJlYWN0LXNkayBzZXJ2aWNlcyB0aGF0XG4gKiBsaXN0ZW4gZm9yIGV2ZW50cyB3aGlsZSBhIHNlc3Npb24gaXMgbG9nZ2VkIGluLlxuICogQHBhcmFtIHtib29sZWFufSBzdGFydFN5bmNpbmcgVHJ1ZSAoZGVmYXVsdCkgdG8gYWN0dWFsbHkgc3RhcnRcbiAqIHN5bmNpbmcgdGhlIGNsaWVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gc3RhcnRNYXRyaXhDbGllbnQoc3RhcnRTeW5jaW5nPXRydWUpIHtcbiAgICBjb25zb2xlLmxvZyhgTGlmZWN5Y2xlOiBTdGFydGluZyBNYXRyaXhDbGllbnRgKTtcblxuICAgIC8vIGRpc3BhdGNoIHRoaXMgYmVmb3JlIHN0YXJ0aW5nIHRoZSBtYXRyaXggY2xpZW50OiBpdCdzIHVzZWRcbiAgICAvLyB0byBhZGQgbGlzdGVuZXJzIGZvciB0aGUgJ3N5bmMnIGV2ZW50IHNvIG90aGVyd2lzZSB3ZSdkIGhhdmVcbiAgICAvLyBhIHJhY2UgY29uZGl0aW9uIChhbmQgd2UgbmVlZCB0byBkaXNwYXRjaCBzeW5jaHJvbm91c2x5IGZvciB0aGlzXG4gICAgLy8gdG8gd29yaykuXG4gICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd3aWxsX3N0YXJ0X2NsaWVudCd9LCB0cnVlKTtcblxuICAgIE5vdGlmaWVyLnN0YXJ0KCk7XG4gICAgVXNlckFjdGl2aXR5LnNoYXJlZEluc3RhbmNlKCkuc3RhcnQoKTtcbiAgICBUeXBpbmdTdG9yZS5zaGFyZWRJbnN0YW5jZSgpLnJlc2V0KCk7IC8vIGp1c3QgaW4gY2FzZVxuICAgIFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5yZXNldCgpO1xuICAgIERNUm9vbU1hcC5tYWtlU2hhcmVkKCkuc3RhcnQoKTtcbiAgICBJbnRlZ3JhdGlvbk1hbmFnZXJzLnNoYXJlZEluc3RhbmNlKCkuc3RhcnRXYXRjaGluZygpO1xuICAgIEFjdGl2ZVdpZGdldFN0b3JlLnN0YXJ0KCk7XG5cbiAgICAvLyBTdGFydCBNam9sbmlyIGV2ZW4gdGhvdWdoIHdlIGhhdmVuJ3QgY2hlY2tlZCB0aGUgZmVhdHVyZSBmbGFnIHlldC4gU3RhcnRpbmdcbiAgICAvLyB0aGUgdGhpbmcganVzdCB3YXN0ZXMgQ1BVIGN5Y2xlcywgYnV0IHNob3VsZCByZXN1bHQgaW4gbm8gYWN0dWFsIGZ1bmN0aW9uYWxpdHlcbiAgICAvLyBiZWluZyBleHBvc2VkIHRvIHRoZSB1c2VyLlxuICAgIE1qb2xuaXIuc2hhcmVkSW5zdGFuY2UoKS5zdGFydCgpO1xuXG4gICAgaWYgKHN0YXJ0U3luY2luZykge1xuICAgICAgICAvLyBUaGUgY2xpZW50IG1pZ2h0IHdhbnQgdG8gcG9wdWxhdGUgc29tZSB2aWV3cyB3aXRoIGV2ZW50cyBmcm9tIHRoZVxuICAgICAgICAvLyBpbmRleCAoZS5nLiB0aGUgRmlsZVBhbmVsKSwgdGhlcmVmb3JlIGluaXRpYWxpemUgdGhlIGV2ZW50IGluZGV4XG4gICAgICAgIC8vIGJlZm9yZSB0aGUgY2xpZW50LlxuICAgICAgICBhd2FpdCBFdmVudEluZGV4UGVnLmluaXQoKTtcbiAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLnN0YXJ0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiQ2FsbGVyIHJlcXVlc3RlZCBvbmx5IGF1eGlsaWFyeSBzZXJ2aWNlcyBiZSBzdGFydGVkXCIpO1xuICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuYXNzaWduKCk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBuZWVkcyB0byBiZSBzdGFydGVkIGFmdGVyIGNyeXB0byBpcyBzZXQgdXBcbiAgICBEZXZpY2VMaXN0ZW5lci5zaGFyZWRJbnN0YW5jZSgpLnN0YXJ0KCk7XG4gICAgLy8gU2ltaWxhcmx5LCBkb24ndCBzdGFydCBzZW5kaW5nIHByZXNlbmNlIHVwZGF0ZXMgdW50aWwgd2UndmUgc3RhcnRlZFxuICAgIC8vIHRoZSBjbGllbnRcbiAgICBpZiAoIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJsb3dCYW5kd2lkdGhcIikpIHtcbiAgICAgICAgUHJlc2VuY2Uuc3RhcnQoKTtcbiAgICB9XG5cbiAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGEgTWF0cml4Q2xpZW50UGVnLCB1cGRhdGUgdGhlIEppdHNpIGluZm9cbiAgICBhd2FpdCBKaXRzaS5nZXRJbnN0YW5jZSgpLnVwZGF0ZSgpO1xuXG4gICAgLy8gZGlzcGF0Y2ggdGhhdCB3ZSBmaW5pc2hlZCBzdGFydGluZyB1cCB0byB3aXJlIHVwIGFueSBvdGhlciBiaXRzXG4gICAgLy8gb2YgdGhlIG1hdHJpeCBjbGllbnQgdGhhdCBjYW5ub3QgYmUgc2V0IHByaW9yIHRvIHN0YXJ0aW5nIHVwLlxuICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnY2xpZW50X3N0YXJ0ZWQnfSk7XG5cbiAgICBpZiAoaXNTb2Z0TG9nb3V0KCkpIHtcbiAgICAgICAgc29mdExvZ291dCgpO1xuICAgIH1cbn1cblxuLypcbiAqIFN0b3BzIGEgcnVubmluZyBjbGllbnQgYW5kIGFsbCByZWxhdGVkIHNlcnZpY2VzLCBhbmQgY2xlYXJzIHBlcnNpc3RlbnRcbiAqIHN0b3JhZ2UuIFVzZWQgYWZ0ZXIgYSBzZXNzaW9uIGhhcyBiZWVuIGxvZ2dlZCBvdXQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkxvZ2dlZE91dCgpIHtcbiAgICBfaXNMb2dnaW5nT3V0ID0gZmFsc2U7XG4gICAgLy8gRW5zdXJlIHRoYXQgd2UgZGlzcGF0Y2ggYSB2aWV3IGNoYW5nZSAqKmJlZm9yZSoqIHN0b3BwaW5nIHRoZSBjbGllbnQgc29cbiAgICAvLyBzbyB0aGF0IFJlYWN0IGNvbXBvbmVudHMgdW5tb3VudCBmaXJzdC4gVGhpcyBhdm9pZHMgUmVhY3Qgc29mdCBjcmFzaGVzXG4gICAgLy8gdGhhdCBjYW4gb2NjdXIgd2hlbiBjb21wb25lbnRzIHRyeSB0byB1c2UgYSBudWxsIGNsaWVudC5cbiAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ29uX2xvZ2dlZF9vdXQnfSwgdHJ1ZSk7XG4gICAgc3RvcE1hdHJpeENsaWVudCgpO1xuICAgIGF3YWl0IF9jbGVhclN0b3JhZ2UoKTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbmNlIHRoZSBzdG9yZXMgaGF2ZSBiZWVuIGNsZWFyZWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gX2NsZWFyU3RvcmFnZSgpIHtcbiAgICBBbmFseXRpY3MuZGlzYWJsZSgpO1xuXG4gICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5jbGVhcigpO1xuICAgIH1cblxuICAgIGlmICh3aW5kb3cuc2Vzc2lvblN0b3JhZ2UpIHtcbiAgICAgICAgd2luZG93LnNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgdGVtcG9yYXJ5IGNsaWVudCB0byBjbGVhciBvdXQgdGhlIHBlcnNpc3RlbnQgc3RvcmVzLlxuICAgIGNvbnN0IGNsaSA9IGNyZWF0ZU1hdHJpeENsaWVudCh7XG4gICAgICAgIC8vIHdlJ2xsIG5ldmVyIG1ha2UgYW55IHJlcXVlc3RzLCBzbyBjYW4gcGFzcyBhIGJvZ3VzIEhTIFVSTFxuICAgICAgICBiYXNlVXJsOiBcIlwiLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgRXZlbnRJbmRleFBlZy5kZWxldGVFdmVudEluZGV4KCk7XG4gICAgYXdhaXQgY2xpLmNsZWFyU3RvcmVzKCk7XG59XG5cbi8qKlxuICogU3RvcCBhbGwgdGhlIGJhY2tncm91bmQgcHJvY2Vzc2VzIHJlbGF0ZWQgdG8gdGhlIGN1cnJlbnQgY2xpZW50LlxuICogQHBhcmFtIHtib29sZWFufSB1bnNldENsaWVudCBUcnVlIChkZWZhdWx0KSB0byBhYmFuZG9uIHRoZSBjbGllbnRcbiAqIG9uIE1hdHJpeENsaWVudFBlZyBhZnRlciBzdG9wcGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BNYXRyaXhDbGllbnQodW5zZXRDbGllbnQ9dHJ1ZSkge1xuICAgIE5vdGlmaWVyLnN0b3AoKTtcbiAgICBVc2VyQWN0aXZpdHkuc2hhcmVkSW5zdGFuY2UoKS5zdG9wKCk7XG4gICAgVHlwaW5nU3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5yZXNldCgpO1xuICAgIFByZXNlbmNlLnN0b3AoKTtcbiAgICBBY3RpdmVXaWRnZXRTdG9yZS5zdG9wKCk7XG4gICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLnN0b3BXYXRjaGluZygpO1xuICAgIE1qb2xuaXIuc2hhcmVkSW5zdGFuY2UoKS5zdG9wKCk7XG4gICAgRGV2aWNlTGlzdGVuZXIuc2hhcmVkSW5zdGFuY2UoKS5zdG9wKCk7XG4gICAgaWYgKERNUm9vbU1hcC5zaGFyZWQoKSkgRE1Sb29tTWFwLnNoYXJlZCgpLnN0b3AoKTtcbiAgICBFdmVudEluZGV4UGVnLnN0b3AoKTtcbiAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgaWYgKGNsaSkge1xuICAgICAgICBjbGkuc3RvcENsaWVudCgpO1xuICAgICAgICBjbGkucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgaWYgKHVuc2V0Q2xpZW50KSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcudW5zZXQoKTtcbiAgICAgICAgICAgIEV2ZW50SW5kZXhQZWcudW5zZXQoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==