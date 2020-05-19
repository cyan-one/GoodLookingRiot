"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Views = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard3(require("react"));

var _errors = require("matrix-js-sdk/src/errors");

var _roomMember = require("matrix-js-sdk/src/models/room-member");

var _crypto = require("matrix-js-sdk/src/crypto");

require("focus-visible");

require("what-input");

var _Analytics = _interopRequireDefault(require("../../Analytics"));

var _DecryptionFailureTracker = require("../../DecryptionFailureTracker");

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _PlatformPeg = _interopRequireDefault(require("../../PlatformPeg"));

var _SdkConfig = _interopRequireDefault(require("../../SdkConfig"));

var RoomListSorter = _interopRequireWildcard3(require("../../RoomListSorter"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _Notifier = _interopRequireDefault(require("../../Notifier"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var _Tinter = _interopRequireDefault(require("../../Tinter"));

var sdk = _interopRequireWildcard3(require("../../index"));

var _RoomInvite = require("../../RoomInvite");

var Rooms = _interopRequireWildcard3(require("../../Rooms"));

var _linkifyMatrix = _interopRequireDefault(require("../../linkify-matrix"));

var Lifecycle = _interopRequireWildcard3(require("../../Lifecycle"));

require("../../stores/LifecycleStore");

var _PageTypes = _interopRequireDefault(require("../../PageTypes"));

var _pages = require("../../utils/pages");

var _createRoom = _interopRequireDefault(require("../../createRoom"));

var _KeyRequestHandler = _interopRequireDefault(require("../../KeyRequestHandler"));

var _languageHandler = require("../../languageHandler");

var _SettingsStore = _interopRequireWildcard3(require("../../settings/SettingsStore"));

var _ThemeController = _interopRequireDefault(require("../../settings/controllers/ThemeController"));

var _Registration = require("../../Registration.js");

var _ErrorUtils = require("../../utils/ErrorUtils");

var _ResizeNotifier = _interopRequireDefault(require("../../utils/ResizeNotifier"));

var _AutoDiscoveryUtils = _interopRequireDefault(require("../../utils/AutoDiscoveryUtils"));

var _DMRoomMap = _interopRequireDefault(require("../../utils/DMRoomMap"));

var _RoomNotifs = require("../../RoomNotifs");

var _theme = require("../../theme");

var _RoomAliasCache = require("../../RoomAliasCache");

var _promise = require("../../utils/promise");

var _ToastStore = _interopRequireDefault(require("../../stores/ToastStore"));

var StorageManager = _interopRequireWildcard3(require("../../utils/StorageManager"));

var _actions = require("../../dispatcher/actions");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017-2019 New Vector Ltd
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
// focus-visible is a Polyfill for the :focus-visible CSS pseudo-attribute used by _AccessibleButton.scss
// what-input helps improve keyboard accessibility
// LifecycleStore is not used but does listen to and dispatch actions

/** constants for MatrixChat.state.view */
let Views; // Actions that are redirected through the onboarding process prior to being
// re-dispatched. NOTE: some actions are non-trivial and would require
// re-factoring to be included in this list in future.

exports.Views = Views;

(function (Views) {
  Views[Views["LOADING"] = 0] = "LOADING";
  Views[Views["WELCOME"] = 1] = "WELCOME";
  Views[Views["LOGIN"] = 2] = "LOGIN";
  Views[Views["REGISTER"] = 3] = "REGISTER";
  Views[Views["POST_REGISTRATION"] = 4] = "POST_REGISTRATION";
  Views[Views["FORGOT_PASSWORD"] = 5] = "FORGOT_PASSWORD";
  Views[Views["COMPLETE_SECURITY"] = 6] = "COMPLETE_SECURITY";
  Views[Views["E2E_SETUP"] = 7] = "E2E_SETUP";
  Views[Views["LOGGED_IN"] = 8] = "LOGGED_IN";
  Views[Views["SOFT_LOGOUT"] = 9] = "SOFT_LOGOUT";
})(Views || (exports.Views = Views = {}));

const ONBOARDING_FLOW_STARTERS = [_actions.Action.ViewUserSettings, 'view_create_chat', 'view_create_room', 'view_create_group'];

class MatrixChat extends _react.default.PureComponent
/*:: <IProps, IState>*/
{
  constructor(props, context) {
    super(props, context);
    (0, _defineProperty2.default)(this, "firstSyncComplete", void 0);
    (0, _defineProperty2.default)(this, "firstSyncPromise", void 0);
    (0, _defineProperty2.default)(this, "screenAfterLogin", void 0);
    (0, _defineProperty2.default)(this, "windowWidth", void 0);
    (0, _defineProperty2.default)(this, "pageChanging", void 0);
    (0, _defineProperty2.default)(this, "accountPassword", void 0);
    (0, _defineProperty2.default)(this, "accountPasswordTimer", void 0);
    (0, _defineProperty2.default)(this, "focusComposer", void 0);
    (0, _defineProperty2.default)(this, "subTitleStatus", void 0);
    (0, _defineProperty2.default)(this, "loggedInView", void 0);
    (0, _defineProperty2.default)(this, "dispatcherRef", void 0);
    (0, _defineProperty2.default)(this, "themeWatcher", void 0);
    (0, _defineProperty2.default)(this, "onAction", payload => {
      // console.log(`MatrixClientPeg.onAction: ${payload.action}`);
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog"); // Start the onboarding process for certain actions

      if (_MatrixClientPeg.MatrixClientPeg.get() && _MatrixClientPeg.MatrixClientPeg.get().isGuest() && ONBOARDING_FLOW_STARTERS.includes(payload.action)) {
        // This will cause `payload` to be dispatched later, once a
        // sync has reached the "prepared" state. Setting a matrix ID
        // will cause a full login and sync and finally the deferred
        // action will be dispatched.
        _dispatcher.default.dispatch({
          action: 'do_after_sync_prepared',
          deferred_action: payload
        });

        _dispatcher.default.dispatch({
          action: 'require_registration'
        });

        return;
      }

      switch (payload.action) {
        case 'MatrixActions.accountData':
          // XXX: This is a collection of several hacks to solve a minor problem. We want to
          // update our local state when the ID server changes, but don't want to put that in
          // the js-sdk as we'd be then dictating how all consumers need to behave. However,
          // this component is already bloated and we probably don't want this tiny logic in
          // here, but there's no better place in the react-sdk for it. Additionally, we're
          // abusing the MatrixActionCreator stuff to avoid errors on dispatches.
          if (payload.event_type === 'm.identity_server') {
            const fullUrl = payload.event_content ? payload.event_content['base_url'] : null;

            if (!fullUrl) {
              _MatrixClientPeg.MatrixClientPeg.get().setIdentityServerUrl(null);

              localStorage.removeItem("mx_is_access_token");
              localStorage.removeItem("mx_is_url");
            } else {
              _MatrixClientPeg.MatrixClientPeg.get().setIdentityServerUrl(fullUrl);

              localStorage.removeItem("mx_is_access_token"); // clear token

              localStorage.setItem("mx_is_url", fullUrl); // XXX: Do we still need this?
            } // redispatch the change with a more specific action


            _dispatcher.default.dispatch({
              action: 'id_server_changed'
            });
          }

          break;

        case 'logout':
          Lifecycle.logout();
          break;

        case 'require_registration':
          (0, _Registration.startAnyRegistrationFlow)(payload);
          break;

        case 'start_registration':
          if (Lifecycle.isSoftLogout()) {
            this.onSoftLogout();
            break;
          } // This starts the full registration flow


          if (payload.screenAfterLogin) {
            this.screenAfterLogin = payload.screenAfterLogin;
          }

          this.startRegistration(payload.params || {});
          break;

        case 'start_login':
          if (Lifecycle.isSoftLogout()) {
            this.onSoftLogout();
            break;
          }

          if (payload.screenAfterLogin) {
            this.screenAfterLogin = payload.screenAfterLogin;
          }

          this.setStateForNewView({
            view: Views.LOGIN
          });
          this.notifyNewScreen('login');
          _ThemeController.default.isLogin = true;
          this.themeWatcher.recheck();
          break;

        case 'start_post_registration':
          this.setState({
            view: Views.POST_REGISTRATION
          });
          break;

        case 'start_password_recovery':
          this.setStateForNewView({
            view: Views.FORGOT_PASSWORD
          });
          this.notifyNewScreen('forgot_password');
          break;

        case 'start_chat':
          (0, _createRoom.default)({
            dmUserId: payload.user_id
          });
          break;

        case 'leave_room':
          this.leaveRoom(payload.room_id);
          break;

        case 'reject_invite':
          _Modal.default.createTrackedDialog('Reject invitation', '', QuestionDialog, {
            title: (0, _languageHandler._t)('Reject invitation'),
            description: (0, _languageHandler._t)('Are you sure you want to reject the invitation?'),
            onFinished: confirm => {
              if (confirm) {
                // FIXME: controller shouldn't be loading a view :(
                const Loader = sdk.getComponent("elements.Spinner");

                const modal = _Modal.default.createDialog(Loader, null, 'mx_Dialog_spinner');

                _MatrixClientPeg.MatrixClientPeg.get().leave(payload.room_id).then(() => {
                  modal.close();

                  if (this.state.currentRoomId === payload.room_id) {
                    _dispatcher.default.dispatch({
                      action: 'view_next_room'
                    });
                  }
                }, err => {
                  modal.close();

                  _Modal.default.createTrackedDialog('Failed to reject invitation', '', ErrorDialog, {
                    title: (0, _languageHandler._t)('Failed to reject invitation'),
                    description: err.toString()
                  });
                });
              }
            }
          });

          break;

        case 'view_user_info':
          this.viewUser(payload.userId, payload.subAction);
          break;

        case 'view_room':
          {
            // Takes either a room ID or room alias: if switching to a room the client is already
            // known to be in (eg. user clicks on a room in the recents panel), supply the ID
            // If the user is clicking on a room in the context of the alias being presented
            // to them, supply the room alias. If both are supplied, the room ID will be ignored.
            const promise = this.viewRoom(payload);

            if (payload.deferred_action) {
              promise.then(() => {
                _dispatcher.default.dispatch(payload.deferred_action);
              });
            }

            break;
          }

        case 'view_prev_room':
          this.viewNextRoom(-1);
          break;

        case 'view_next_room':
          this.viewNextRoom(1);
          break;

        case 'view_indexed_room':
          this.viewIndexedRoom(payload.roomIndex);
          break;

        case _actions.Action.ViewUserSettings:
          {
            const UserSettingsDialog = sdk.getComponent("dialogs.UserSettingsDialog");

            _Modal.default.createTrackedDialog('User settings', '', UserSettingsDialog, {},
            /*className=*/
            null,
            /*isPriority=*/
            false,
            /*isStatic=*/
            true); // View the welcome or home page if we need something to look at


            this.viewSomethingBehindModal();
            break;
          }

        case 'view_create_room':
          this.createRoom(payload.public);
          break;

        case 'view_create_group':
          {
            const CreateGroupDialog = sdk.getComponent("dialogs.CreateGroupDialog");

            _Modal.default.createTrackedDialog('Create Community', '', CreateGroupDialog);

            break;
          }

        case 'view_room_directory':
          {
            const RoomDirectory = sdk.getComponent("structures.RoomDirectory");

            _Modal.default.createTrackedDialog('Room directory', '', RoomDirectory, {}, 'mx_RoomDirectory_dialogWrapper', false, true); // View the welcome or home page if we need something to look at


            this.viewSomethingBehindModal();
            break;
          }

        case 'view_my_groups':
          this.setPage(_PageTypes.default.MyGroups);
          this.notifyNewScreen('groups');
          break;

        case 'view_group':
          this.viewGroup(payload);
          break;

        case 'view_welcome_page':
          this.viewWelcome();
          break;

        case 'view_home_page':
          this.viewHome();
          break;

        case 'view_set_mxid':
          this.setMxId(payload);
          break;

        case 'view_start_chat_or_reuse':
          this.chatCreateOrReuse(payload.user_id);
          break;

        case 'view_create_chat':
          (0, _RoomInvite.showStartChatInviteDialog)();
          break;

        case 'view_invite':
          (0, _RoomInvite.showRoomInviteDialog)(payload.roomId);
          break;

        case 'view_last_screen':
          // This function does what we want, despite the name. The idea is that it shows
          // the last room we were looking at or some reasonable default/guess. We don't
          // have to worry about email invites or similar being re-triggered because the
          // function will have cleared that state and not execute that path.
          this.showScreenAfterLogin();
          break;

        case 'toggle_my_groups':
          // We just dispatch the page change rather than have to worry about
          // what the logic is for each of these branches.
          if (this.state.page_type === _PageTypes.default.MyGroups) {
            _dispatcher.default.dispatch({
              action: 'view_last_screen'
            });
          } else {
            _dispatcher.default.dispatch({
              action: 'view_my_groups'
            });
          }

          break;

        case 'notifier_enabled':
          this.setState({
            showNotifierToolbar: _Notifier.default.shouldShowToolbar()
          });
          break;

        case 'hide_left_panel':
          this.setState({
            collapseLhs: true
          });
          break;

        case 'focus_room_filter': // for CtrlOrCmd+K to work by expanding the left panel first

        case 'show_left_panel':
          this.setState({
            collapseLhs: false
          });
          break;

        case 'panel_disable':
          {
            this.setState({
              leftDisabled: payload.leftDisabled || payload.sideDisabled || false,
              middleDisabled: payload.middleDisabled || false // We don't track the right panel being disabled here - it's tracked in the store.

            });
            break;
          }

        case 'on_logged_in':
          if (!Lifecycle.isSoftLogout() && this.state.view !== Views.LOGIN && this.state.view !== Views.REGISTER && this.state.view !== Views.COMPLETE_SECURITY && this.state.view !== Views.E2E_SETUP) {
            this.onLoggedIn();
          }

          break;

        case 'on_client_not_viable':
          this.onSoftLogout();
          break;

        case 'on_logged_out':
          this.onLoggedOut();
          break;

        case 'will_start_client':
          this.setState({
            ready: false
          }, () => {
            // if the client is about to start, we are, by definition, not ready.
            // Set ready to false now, then it'll be set to true when the sync
            // listener we set below fires.
            this.onWillStartClient();
          });
          break;

        case 'client_started':
          this.onClientStarted();
          break;

        case 'new_version':
          this.onVersion(payload.currentVersion, payload.newVersion, payload.releaseNotes);
          break;

        case 'check_updates':
          this.setState({
            checkingForUpdate: payload.value
          });
          break;

        case 'send_event':
          this.onSendEvent(payload.room_id, payload.event);
          break;

        case 'aria_hide_main_app':
          this.setState({
            hideToSRUsers: true
          });
          break;

        case 'aria_unhide_main_app':
          this.setState({
            hideToSRUsers: false
          });
          break;

        case 'accept_cookies':
          _SettingsStore.default.setValue("analyticsOptIn", null, _SettingsStore.SettingLevel.DEVICE, true);

          _SettingsStore.default.setValue("showCookieBar", null, _SettingsStore.SettingLevel.DEVICE, false);

          this.setState({
            showCookieBar: false
          });

          _Analytics.default.enable();

          break;

        case 'reject_cookies':
          _SettingsStore.default.setValue("analyticsOptIn", null, _SettingsStore.SettingLevel.DEVICE, false);

          _SettingsStore.default.setValue("showCookieBar", null, _SettingsStore.SettingLevel.DEVICE, false);

          this.setState({
            showCookieBar: false
          });
          break;
      }
    });
    (0, _defineProperty2.default)(this, "handleResize", () => {
      const hideLhsThreshold = 1000;
      const showLhsThreshold = 1000;

      if (this.windowWidth > hideLhsThreshold && window.innerWidth <= hideLhsThreshold) {
        _dispatcher.default.dispatch({
          action: 'hide_left_panel'
        });
      }

      if (this.windowWidth <= showLhsThreshold && window.innerWidth > showLhsThreshold) {
        _dispatcher.default.dispatch({
          action: 'show_left_panel'
        });
      }

      this.state.resizeNotifier.notifyWindowResized();
      this.windowWidth = window.innerWidth;
    });
    (0, _defineProperty2.default)(this, "onRegisterClick", () => {
      this.showScreen("register");
    });
    (0, _defineProperty2.default)(this, "onLoginClick", () => {
      this.showScreen("login");
    });
    (0, _defineProperty2.default)(this, "onForgotPasswordClick", () => {
      this.showScreen("forgot_password");
    });
    (0, _defineProperty2.default)(this, "onRegisterFlowComplete", (credentials
    /*: object*/
    , password
    /*: string*/
    ) => {
      return this.onUserCompletedLoginFlow(credentials, password);
    });
    (0, _defineProperty2.default)(this, "onFinishPostRegistration", () => {
      // Don't confuse this with "PageType" which is the middle window to show
      this.setState({
        view: Views.LOGGED_IN
      });
      this.showScreen("settings");
    });
    (0, _defineProperty2.default)(this, "onServerConfigChange", (serverConfig
    /*: ValidatedServerConfig*/
    ) => {
      this.setState({
        serverConfig
      });
    });
    (0, _defineProperty2.default)(this, "makeRegistrationUrl", (params
    /*: {[key: string]: string}*/
    ) => {
      if (this.props.startingFragmentQueryParams.referrer) {
        params.referrer = this.props.startingFragmentQueryParams.referrer;
      }

      return this.props.makeRegistrationUrl(params);
    });
    (0, _defineProperty2.default)(this, "onUserCompletedLoginFlow", async (credentials
    /*: object*/
    , password
    /*: string*/
    ) => {
      this.accountPassword = password; // self-destruct the password after 5mins

      if (this.accountPasswordTimer !== null) clearTimeout(this.accountPasswordTimer);
      this.accountPasswordTimer = setTimeout(() => {
        this.accountPassword = null;
        this.accountPasswordTimer = null;
      }, 60 * 5 * 1000); // Wait for the client to be logged in (but not started)
      // which is enough to ask the server about account data.

      const loggedIn = new Promise(resolve => {
        const actionHandlerRef = _dispatcher.default.register(payload => {
          if (payload.action !== "on_logged_in") {
            return;
          }

          _dispatcher.default.unregister(actionHandlerRef);

          resolve();
        });
      }); // Create and start the client in the background

      const setLoggedInPromise = Lifecycle.setLoggedIn(credentials);
      await loggedIn;

      const cli = _MatrixClientPeg.MatrixClientPeg.get(); // We're checking `isCryptoAvailable` here instead of `isCryptoEnabled`
      // because the client hasn't been started yet.


      const cryptoAvailable = (0, _crypto.isCryptoAvailable)();

      if (!cryptoAvailable) {
        this.onLoggedIn();
      }

      this.setState({
        pendingInitialSync: true
      });
      await this.firstSyncPromise.promise;

      if (!cryptoAvailable) {
        this.setState({
          pendingInitialSync: false
        });
        return setLoggedInPromise;
      } // Test for the master cross-signing key in SSSS as a quick proxy for
      // whether cross-signing has been set up on the account.


      const masterKeyInStorage = !!cli.getAccountData("m.cross_signing.master");

      if (masterKeyInStorage) {
        // Auto-enable cross-signing for the new session when key found in
        // secret storage.
        _SettingsStore.default.setValue("feature_cross_signing", null, _SettingsStore.SettingLevel.DEVICE, true);

        this.setStateForNewView({
          view: Views.COMPLETE_SECURITY
        });
      } else if (_SettingsStore.default.getValue("feature_cross_signing") && (await cli.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing"))) {
        // This will only work if the feature is set to 'enable' in the config,
        // since it's too early in the lifecycle for users to have turned the
        // labs flag on.
        this.setStateForNewView({
          view: Views.E2E_SETUP
        });
      } else {
        this.onLoggedIn();
      }

      this.setState({
        pendingInitialSync: false
      });
      return setLoggedInPromise;
    });
    (0, _defineProperty2.default)(this, "onCompleteSecurityE2eSetupFinished", () => {
      this.onLoggedIn();
    });
    this.state = {
      view: Views.LOADING,
      collapseLhs: false,
      leftDisabled: false,
      middleDisabled: false,
      hasNewVersion: false,
      newVersionReleaseNotes: null,
      checkingForUpdate: null,
      showCookieBar: false,
      hideToSRUsers: false,
      syncError: null,
      // If the current syncing status is ERROR, the error object, otherwise null.
      resizeNotifier: new _ResizeNotifier.default(),
      showNotifierToolbar: false,
      ready: false
    };
    this.loggedInView = (0, _react.createRef)();

    _SdkConfig.default.put(this.props.config); // Used by _viewRoom before getting state from sync


    this.firstSyncComplete = false;
    this.firstSyncPromise = (0, _promise.defer)();

    if (this.props.config.sync_timeline_limit) {
      _MatrixClientPeg.MatrixClientPeg.opts.initialSyncLimit = this.props.config.sync_timeline_limit;
    } // a thing to call showScreen with once login completes.  this is kept
    // outside this.state because updating it should never trigger a
    // rerender.


    this.screenAfterLogin = this.props.initialScreenAfterLogin;
    this.windowWidth = 10000;
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.pageChanging = false; // check we have the right tint applied for this theme.
    // N.B. we don't call the whole of setTheme() here as we may be
    // racing with the theme CSS download finishing from index.js

    _Tinter.default.tint(); // For PersistentElement


    this.state.resizeNotifier.on("middlePanelResized", this.dispatchTimelineResize); // Force users to go through the soft logout page if they're soft logged out

    if (Lifecycle.isSoftLogout()) {
      // When the session loads it'll be detected as soft logged out and a dispatch
      // will be sent out to say that, triggering this MatrixChat to show the soft
      // logout page.
      Lifecycle.loadSession({});
    }

    this.accountPassword = null;
    this.accountPasswordTimer = null;
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    this.themeWatcher = new _theme.ThemeWatcher();
    this.themeWatcher.start();
    this.focusComposer = false; // object field used for tracking the status info appended to the title tag.
    // we don't do it as react state as i'm scared about triggering needless react refreshes.

    this.subTitleStatus = ''; // this can technically be done anywhere but doing this here keeps all
    // the routing url path logic together.

    if (this.onAliasClick) {
      _linkifyMatrix.default.onAliasClick = this.onAliasClick;
    }

    if (this.onUserClick) {
      _linkifyMatrix.default.onUserClick = this.onUserClick;
    }

    if (this.onGroupClick) {
      _linkifyMatrix.default.onGroupClick = this.onGroupClick;
    } // the first thing to do is to try the token params in the query-string
    // if the session isn't soft logged out (ie: is a clean session being logged in)


    if (!Lifecycle.isSoftLogout()) {
      Lifecycle.attemptTokenLogin(this.props.realQueryParams, this.props.defaultDeviceDisplayName).then(loggedIn => {
        if (loggedIn) {
          this.props.onTokenLoginCompleted(); // don't do anything else until the page reloads - just stay in
          // the 'loading' state.

          return;
        } // if the user has followed a login or register link, don't reanimate
        // the old creds, but rather go straight to the relevant page


        const firstScreen = this.screenAfterLogin ? this.screenAfterLogin.screen : null;

        if (firstScreen === 'login' || firstScreen === 'register' || firstScreen === 'forgot_password') {
          this.showScreenAfterLogin();
          return;
        }

        return this.loadSession();
      });
    }

    if (_SettingsStore.default.getValue("showCookieBar")) {
      this.setState({
        showCookieBar: true
      });
    }

    if (_SettingsStore.default.getValue("analyticsOptIn")) {
      _Analytics.default.enable();
    }
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle stage


  UNSAFE_componentWillUpdate(props, state) {
    if (this.shouldTrackPageChange(this.state, state)) {
      this.startPageChangeTimer();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.shouldTrackPageChange(prevState, this.state)) {
      const durationMs = this.stopPageChangeTimer();

      _Analytics.default.trackPageChange(durationMs);
    }

    if (this.focusComposer) {
      _dispatcher.default.dispatch({
        action: 'focus_composer'
      });

      this.focusComposer = false;
    }
  }

  componentWillUnmount() {
    Lifecycle.stopMatrixClient();

    _dispatcher.default.unregister(this.dispatcherRef);

    this.themeWatcher.stop();
    window.removeEventListener('resize', this.handleResize);
    this.state.resizeNotifier.removeListener("middlePanelResized", this.dispatchTimelineResize);
    if (this.accountPasswordTimer !== null) clearTimeout(this.accountPasswordTimer);
  }

  getFallbackHsUrl() {
    if (this.props.serverConfig && this.props.serverConfig.isDefault) {
      return this.props.config.fallback_hs_url;
    } else {
      return null;
    }
  }

  getServerProperties() {
    let props = this.state.serverConfig;
    if (!props) props = this.props.serverConfig; // for unit tests

    if (!props) props = _SdkConfig.default.get()["validated_server_config"];
    return {
      serverConfig: props
    };
  }

  loadSession() {
    // the extra Promise.resolve() ensures that synchronous exceptions hit the same codepath as
    // asynchronous ones.
    return Promise.resolve().then(() => {
      return Lifecycle.loadSession({
        fragmentQueryParams: this.props.startingFragmentQueryParams,
        enableGuest: this.props.enableGuest,
        guestHsUrl: this.getServerProperties().serverConfig.hsUrl,
        guestIsUrl: this.getServerProperties().serverConfig.isUrl,
        defaultDeviceDisplayName: this.props.defaultDeviceDisplayName
      });
    }).then(loadedSession => {
      if (!loadedSession) {
        // fall back to showing the welcome screen
        _dispatcher.default.dispatch({
          action: "view_welcome_page"
        });
      }
    }); // Note we don't catch errors from this: we catch everything within
    // loadSession as there's logic there to ask the user if they want
    // to try logging out.
  }

  startPageChangeTimer() {
    // Tor doesn't support performance
    if (!performance || !performance.mark) return null; // This shouldn't happen because UNSAFE_componentWillUpdate and componentDidUpdate
    // are used.

    if (this.pageChanging) {
      console.warn('MatrixChat.startPageChangeTimer: timer already started');
      return;
    }

    this.pageChanging = true;
    performance.mark('riot_MatrixChat_page_change_start');
  }

  stopPageChangeTimer() {
    // Tor doesn't support performance
    if (!performance || !performance.mark) return null;

    if (!this.pageChanging) {
      console.warn('MatrixChat.stopPageChangeTimer: timer not started');
      return;
    }

    this.pageChanging = false;
    performance.mark('riot_MatrixChat_page_change_stop');
    performance.measure('riot_MatrixChat_page_change_delta', 'riot_MatrixChat_page_change_start', 'riot_MatrixChat_page_change_stop');
    performance.clearMarks('riot_MatrixChat_page_change_start');
    performance.clearMarks('riot_MatrixChat_page_change_stop');
    const measurement = performance.getEntriesByName('riot_MatrixChat_page_change_delta').pop(); // In practice, sometimes the entries list is empty, so we get no measurement

    if (!measurement) return null;
    return measurement.duration;
  }

  shouldTrackPageChange(prevState
  /*: IState*/
  , state
  /*: IState*/
  ) {
    return prevState.currentRoomId !== state.currentRoomId || prevState.view !== state.view || prevState.page_type !== state.page_type;
  }

  setStateForNewView(state
  /*: Partial<IState>*/
  ) {
    if (state.view === undefined) {
      throw new Error("setStateForNewView with no view!");
    }

    const newState = {
      currentUserId: null
    };
    Object.assign(newState, state);
    this.setState(newState);
  }

  setPage(pageType
  /*: string*/
  ) {
    this.setState({
      page_type: pageType
    });
  }

  async startRegistration(params
  /*: {[key: string]: string}*/
  ) {
    const newState
    /*: Partial<IState>*/
    = {
      view: Views.REGISTER
    }; // Only honour params if they are all present, otherwise we reset
    // HS and IS URLs when switching to registration.

    if (params.client_secret && params.session_id && params.hs_url && params.is_url && params.sid) {
      newState.serverConfig = await _AutoDiscoveryUtils.default.validateServerConfigWithStaticUrls(params.hs_url, params.is_url);
      newState.register_client_secret = params.client_secret;
      newState.register_session_id = params.session_id;
      newState.register_id_sid = params.sid;
    }

    this.setStateForNewView(newState);
    _ThemeController.default.isLogin = true;
    this.themeWatcher.recheck();
    this.notifyNewScreen('register');
  } // TODO: Move to RoomViewStore


  viewNextRoom(roomIndexDelta
  /*: number*/
  ) {
    const allRooms = RoomListSorter.mostRecentActivityFirst(_MatrixClientPeg.MatrixClientPeg.get().getRooms()); // If there are 0 rooms or 1 room, view the home page because otherwise
    // if there are 0, we end up trying to index into an empty array, and
    // if there is 1, we end up viewing the same room.

    if (allRooms.length < 2) {
      _dispatcher.default.dispatch({
        action: 'view_home_page'
      });

      return;
    }

    let roomIndex = -1;

    for (let i = 0; i < allRooms.length; ++i) {
      if (allRooms[i].roomId === this.state.currentRoomId) {
        roomIndex = i;
        break;
      }
    }

    roomIndex = (roomIndex + roomIndexDelta) % allRooms.length;
    if (roomIndex < 0) roomIndex = allRooms.length - 1;

    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: allRooms[roomIndex].roomId
    });
  } // TODO: Move to RoomViewStore


  viewIndexedRoom(roomIndex
  /*: number*/
  ) {
    const allRooms = RoomListSorter.mostRecentActivityFirst(_MatrixClientPeg.MatrixClientPeg.get().getRooms());

    if (allRooms[roomIndex]) {
      _dispatcher.default.dispatch({
        action: 'view_room',
        room_id: allRooms[roomIndex].roomId
      });
    }
  } // switch view to the given room
  //
  // @param {Object} roomInfo Object containing data about the room to be joined
  // @param {string=} roomInfo.room_id ID of the room to join. One of room_id or room_alias must be given.
  // @param {string=} roomInfo.room_alias Alias of the room to join. One of room_id or room_alias must be given.
  // @param {boolean=} roomInfo.auto_join If true, automatically attempt to join the room if not already a member.
  // @param {string=} roomInfo.event_id ID of the event in this room to show: this will cause a switch to the
  //                                    context of that particular event.
  // @param {boolean=} roomInfo.highlighted If true, add event_id to the hash of the URL
  //                                        and alter the EventTile to appear highlighted.
  // @param {Object=} roomInfo.third_party_invite Object containing data about the third party
  //                                    we received to join the room, if any.
  // @param {string=} roomInfo.third_party_invite.inviteSignUrl 3pid invite sign URL
  // @param {string=} roomInfo.third_party_invite.invitedEmail The email address the invite was sent to
  // @param {Object=} roomInfo.oob_data Object of additional data about the room
  //                               that has been passed out-of-band (eg.
  //                               room name and avatar from an invite email)


  viewRoom(roomInfo
  /*: IRoomInfo*/
  ) {
    this.focusComposer = true;

    if (roomInfo.room_alias) {
      console.log("Switching to room alias ".concat(roomInfo.room_alias, " at event ") + roomInfo.event_id);
    } else {
      console.log("Switching to room id ".concat(roomInfo.room_id, " at event ") + roomInfo.event_id);
    } // Wait for the first sync to complete so that if a room does have an alias,
    // it would have been retrieved.


    let waitFor = Promise.resolve(null);

    if (!this.firstSyncComplete) {
      if (!this.firstSyncPromise) {
        console.warn('Cannot view a room before first sync. room_id:', roomInfo.room_id);
        return;
      }

      waitFor = this.firstSyncPromise.promise;
    }

    return waitFor.then(() => {
      let presentedId = roomInfo.room_alias || roomInfo.room_id;

      const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomInfo.room_id);

      if (room) {
        const theAlias = Rooms.getDisplayAliasForRoom(room);

        if (theAlias) {
          presentedId = theAlias; // Store display alias of the presented room in cache to speed future
          // navigation.

          (0, _RoomAliasCache.storeRoomAliasInCache)(theAlias, room.roomId);
        } // Store this as the ID of the last room accessed. This is so that we can
        // persist which room is being stored across refreshes and browser quits.


        if (localStorage) {
          localStorage.setItem('mx_last_room_id', room.roomId);
        }
      }

      if (roomInfo.event_id && roomInfo.highlighted) {
        presentedId += "/" + roomInfo.event_id;
      }

      this.setState({
        view: Views.LOGGED_IN,
        currentRoomId: roomInfo.room_id || null,
        page_type: _PageTypes.default.RoomView,
        thirdPartyInvite: roomInfo.third_party_invite,
        roomOobData: roomInfo.oob_data,
        viaServers: roomInfo.via_servers,
        ready: true
      }, () => {
        this.notifyNewScreen('room/' + presentedId);
      });
    });
  }

  viewGroup(payload) {
    const groupId = payload.group_id;
    this.setState({
      currentGroupId: groupId,
      currentGroupIsNew: payload.group_is_new
    });
    this.setPage(_PageTypes.default.GroupView);
    this.notifyNewScreen('group/' + groupId);
  }

  viewSomethingBehindModal() {
    if (this.state.view !== Views.LOGGED_IN) {
      this.viewWelcome();
      return;
    }

    if (!this.state.currentGroupId && !this.state.currentRoomId) {
      this.viewHome();
    }
  }

  viewWelcome() {
    this.setStateForNewView({
      view: Views.WELCOME
    });
    this.notifyNewScreen('welcome');
    _ThemeController.default.isLogin = true;
    this.themeWatcher.recheck();
  }

  viewHome() {
    // The home page requires the "logged in" view, so we'll set that.
    this.setStateForNewView({
      view: Views.LOGGED_IN
    });
    this.setPage(_PageTypes.default.HomePage);
    this.notifyNewScreen('home');
    _ThemeController.default.isLogin = false;
    this.themeWatcher.recheck();
  }

  viewUser(userId
  /*: string*/
  , subAction
  /*: string*/
  ) {
    // Wait for the first sync so that `getRoom` gives us a room object if it's
    // in the sync response
    const waitForSync = this.firstSyncPromise ? this.firstSyncPromise.promise : Promise.resolve();
    waitForSync.then(() => {
      if (subAction === 'chat') {
        this.chatCreateOrReuse(userId);
        return;
      }

      this.notifyNewScreen('user/' + userId);
      this.setState({
        currentUserId: userId
      });
      this.setPage(_PageTypes.default.UserView);
    });
  }

  setMxId(payload) {
    const SetMxIdDialog = sdk.getComponent('views.dialogs.SetMxIdDialog');

    const close = _Modal.default.createTrackedDialog('Set MXID', '', SetMxIdDialog, {
      homeserverUrl: _MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(),
      onFinished: (submitted, credentials) => {
        if (!submitted) {
          _dispatcher.default.dispatch({
            action: 'cancel_after_sync_prepared'
          });

          if (payload.go_home_on_cancel) {
            _dispatcher.default.dispatch({
              action: 'view_home_page'
            });
          }

          return;
        }

        _MatrixClientPeg.MatrixClientPeg.setJustRegisteredUserId(credentials.user_id);

        this.onRegistered(credentials);
      },
      onDifferentServerClicked: ev => {
        _dispatcher.default.dispatch({
          action: 'start_registration'
        });

        close();
      },
      onLoginClick: ev => {
        _dispatcher.default.dispatch({
          action: 'start_login'
        });

        close();
      }
    }).close;
  }

  async createRoom(defaultPublic = false) {
    const CreateRoomDialog = sdk.getComponent('dialogs.CreateRoomDialog');

    const modal = _Modal.default.createTrackedDialog('Create Room', '', CreateRoomDialog, {
      defaultPublic
    });

    const [shouldCreate, opts] = await modal.finished;

    if (shouldCreate) {
      (0, _createRoom.default)(opts);
    }
  }

  chatCreateOrReuse(userId
  /*: string*/
  ) {
    // Use a deferred action to reshow the dialog once the user has registered
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      // No point in making 2 DMs with welcome bot. This assumes view_set_mxid will
      // result in a new DM with the welcome user.
      if (userId !== this.props.config.welcomeUserId) {
        _dispatcher.default.dispatch({
          action: 'do_after_sync_prepared',
          deferred_action: {
            action: 'view_start_chat_or_reuse',
            user_id: userId
          }
        });
      }

      _dispatcher.default.dispatch({
        action: 'require_registration',
        // If the set_mxid dialog is cancelled, view /welcome because if the
        // browser was pointing at /user/@someone:domain?action=chat, the URL
        // needs to be reset so that they can revisit /user/.. // (and trigger
        // `_chatCreateOrReuse` again)
        go_welcome_on_cancel: true,
        screen_after: {
          screen: "user/".concat(this.props.config.welcomeUserId),
          params: {
            action: 'chat'
          }
        }
      });

      return;
    } // TODO: Immutable DMs replaces this


    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const dmRoomMap = new _DMRoomMap.default(client);
    const dmRooms = dmRoomMap.getDMRoomsForUserId(userId);

    if (dmRooms.length > 0) {
      _dispatcher.default.dispatch({
        action: 'view_room',
        room_id: dmRooms[0]
      });
    } else {
      _dispatcher.default.dispatch({
        action: 'start_chat',
        user_id: userId
      });
    }
  }

  leaveRoomWarnings(roomId
  /*: string*/
  ) {
    const roomToLeave = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId); // Show a warning if there are additional complications.


    const joinRules = roomToLeave.currentState.getStateEvents('m.room.join_rules', '');
    const warnings = [];

    if (joinRules) {
      const rule = joinRules.getContent().join_rule;

      if (rule !== "public") {
        warnings.push( /*#__PURE__*/_react.default.createElement("span", {
          className: "warning",
          key: "non_public_warning"
        }, ' '
        /* Whitespace, otherwise the sentences get smashed together */
        , (0, _languageHandler._t)("This room is not public. You will not be able to rejoin without an invite.")));
      }
    }

    return warnings;
  }

  leaveRoom(roomId
  /*: string*/
  ) {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

    const roomToLeave = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId);

    const warnings = this.leaveRoomWarnings(roomId);

    _Modal.default.createTrackedDialog('Leave room', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Leave room"),
      description: /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Are you sure you want to leave the room '%(roomName)s'?", {
        roomName: roomToLeave.name
      }), warnings),
      button: (0, _languageHandler._t)("Leave"),
      onFinished: shouldLeave => {
        if (shouldLeave) {
          const d = _MatrixClientPeg.MatrixClientPeg.get().leaveRoomChain(roomId); // FIXME: controller shouldn't be loading a view :(


          const Loader = sdk.getComponent("elements.Spinner");

          const modal = _Modal.default.createDialog(Loader, null, 'mx_Dialog_spinner');

          d.then(errors => {
            modal.close();

            for (const leftRoomId of Object.keys(errors)) {
              const err = errors[leftRoomId];
              if (!err) continue;
              console.error("Failed to leave room " + leftRoomId + " " + err);
              let title = (0, _languageHandler._t)("Failed to leave room");
              let message = (0, _languageHandler._t)("Server may be unavailable, overloaded, or you hit a bug.");

              if (err.errcode === 'M_CANNOT_LEAVE_SERVER_NOTICE_ROOM') {
                title = (0, _languageHandler._t)("Can't leave Server Notices room");
                message = (0, _languageHandler._t)("This room is used for important messages from the Homeserver, " + "so you cannot leave it.");
              } else if (err && err.message) {
                message = err.message;
              }

              _Modal.default.createTrackedDialog('Failed to leave room', '', ErrorDialog, {
                title: title,
                description: message
              });

              return;
            }

            if (this.state.currentRoomId === roomId) {
              _dispatcher.default.dispatch({
                action: 'view_next_room'
              });
            }
          }, err => {
            // This should only happen if something went seriously wrong with leaving the chain.
            modal.close();
            console.error("Failed to leave room " + roomId + " " + err);

            _Modal.default.createTrackedDialog('Failed to leave room', '', ErrorDialog, {
              title: (0, _languageHandler._t)("Failed to leave room"),
              description: (0, _languageHandler._t)("Unknown error")
            });
          });
        }
      }
    });
  }
  /**
   * Starts a chat with the welcome user, if the user doesn't already have one
   * @returns {string} The room ID of the new room, or null if no room was created
   */


  async startWelcomeUserChat() {
    // We can end up with multiple tabs post-registration where the user
    // might then end up with a session and we don't want them all making
    // a chat with the welcome user: try to de-dupe.
    // We need to wait for the first sync to complete for this to
    // work though.
    let waitFor;

    if (!this.firstSyncComplete) {
      waitFor = this.firstSyncPromise.promise;
    } else {
      waitFor = Promise.resolve();
    }

    await waitFor;

    const welcomeUserRooms = _DMRoomMap.default.shared().getDMRoomsForUserId(this.props.config.welcomeUserId);

    if (welcomeUserRooms.length === 0) {
      const roomId = await (0, _createRoom.default)({
        dmUserId: this.props.config.welcomeUserId,
        // Only view the welcome user if we're NOT looking at a room
        andView: !this.state.currentRoomId,
        spinner: false // we're already showing one: we don't need another one

      }); // This is a bit of a hack, but since the deduplication relies
      // on m.direct being up to date, we need to force a sync
      // of the database, otherwise if the user goes to the other
      // tab before the next save happens (a few minutes), the
      // saved sync will be restored from the db and this code will
      // run without the update to m.direct, making another welcome
      // user room (it doesn't wait for new data from the server, just
      // the saved sync to be loaded).

      const saveWelcomeUser = ev => {
        if (ev.getType() === 'm.direct' && ev.getContent() && ev.getContent()[this.props.config.welcomeUserId]) {
          _MatrixClientPeg.MatrixClientPeg.get().store.save(true);

          _MatrixClientPeg.MatrixClientPeg.get().removeListener("accountData", saveWelcomeUser);
        }
      };

      _MatrixClientPeg.MatrixClientPeg.get().on("accountData", saveWelcomeUser);

      return roomId;
    }

    return null;
  }
  /**
   * Called when a new logged in session has started
   */


  async onLoggedIn() {
    _ThemeController.default.isLogin = false;
    this.themeWatcher.recheck();
    this.setStateForNewView({
      view: Views.LOGGED_IN
    }); // If a specific screen is set to be shown after login, show that above
    // all else, as it probably means the user clicked on something already.

    if (this.screenAfterLogin && this.screenAfterLogin.screen) {
      this.showScreen(this.screenAfterLogin.screen, this.screenAfterLogin.params);
      this.screenAfterLogin = null;
    } else if (_MatrixClientPeg.MatrixClientPeg.currentUserIsJustRegistered()) {
      _MatrixClientPeg.MatrixClientPeg.setJustRegisteredUserId(null);

      if (this.props.config.welcomeUserId && (0, _languageHandler.getCurrentLanguage)().startsWith("en")) {
        const welcomeUserRoom = await this.startWelcomeUserChat();

        if (welcomeUserRoom === null) {
          // We didn't redirect to the welcome user room, so show
          // the homepage.
          _dispatcher.default.dispatch({
            action: 'view_home_page'
          });
        }
      } else {
        // The user has just logged in after registering,
        // so show the homepage.
        _dispatcher.default.dispatch({
          action: 'view_home_page'
        });
      }
    } else {
      this.showScreenAfterLogin();
    }

    StorageManager.tryPersistStorage();
  }

  showScreenAfterLogin() {
    // If screenAfterLogin is set, use that, then null it so that a second login will
    // result in view_home_page, _user_settings or _room_directory
    if (this.screenAfterLogin && this.screenAfterLogin.screen) {
      this.showScreen(this.screenAfterLogin.screen, this.screenAfterLogin.params);
      this.screenAfterLogin = null;
    } else if (localStorage && localStorage.getItem('mx_last_room_id')) {
      // Before defaulting to directory, show the last viewed room
      this.viewLastRoom();
    } else {
      if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
        _dispatcher.default.dispatch({
          action: 'view_welcome_page'
        });
      } else if ((0, _pages.getHomePageUrl)(this.props.config)) {
        _dispatcher.default.dispatch({
          action: 'view_home_page'
        });
      } else {
        this.firstSyncPromise.promise.then(() => {
          _dispatcher.default.dispatch({
            action: 'view_next_room'
          });
        });
      }
    }
  }

  viewLastRoom() {
    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: localStorage.getItem('mx_last_room_id')
    });
  }
  /**
   * Called when the session is logged out
   */


  onLoggedOut() {
    this.notifyNewScreen('login');
    this.setStateForNewView({
      view: Views.LOGIN,
      ready: false,
      collapseLhs: false,
      currentRoomId: null
    });
    this.subTitleStatus = '';
    this.setPageSubtitle();
    _ThemeController.default.isLogin = true;
    this.themeWatcher.recheck();
  }
  /**
   * Called when the session is softly logged out
   */


  onSoftLogout() {
    this.notifyNewScreen('soft_logout');
    this.setStateForNewView({
      view: Views.SOFT_LOGOUT,
      ready: false,
      collapseLhs: false,
      currentRoomId: null
    });
    this.subTitleStatus = '';
    this.setPageSubtitle();
  }
  /**
   * Called just before the matrix client is started
   * (useful for setting listeners)
   */


  onWillStartClient() {
    // reset the 'have completed first sync' flag,
    // since we're about to start the client and therefore about
    // to do the first sync
    this.firstSyncComplete = false;
    this.firstSyncPromise = (0, _promise.defer)();

    const cli = _MatrixClientPeg.MatrixClientPeg.get(); // Allow the JS SDK to reap timeline events. This reduces the amount of
    // memory consumed as the JS SDK stores multiple distinct copies of room
    // state (each of which can be 10s of MBs) for each DISJOINT timeline. This is
    // particularly noticeable when there are lots of 'limited' /sync responses
    // such as when laptops unsleep.
    // https://github.com/vector-im/riot-web/issues/3307#issuecomment-282895568


    cli.setCanResetTimelineCallback(roomId => {
      console.log("Request to reset timeline in room ", roomId, " viewing:", this.state.currentRoomId);

      if (roomId !== this.state.currentRoomId) {
        // It is safe to remove events from rooms we are not viewing.
        return true;
      } // We are viewing the room which we want to reset. It is only safe to do
      // this if we are not scrolled up in the view. To find out, delegate to
      // the timeline panel. If the timeline panel doesn't exist, then we assume
      // it is safe to reset the timeline.


      if (!this.loggedInView.current) {
        return true;
      }

      return this.loggedInView.current.canResetTimelineInRoom(roomId);
    });
    cli.on('sync', (state, prevState, data) => {
      // LifecycleStore and others cannot directly subscribe to matrix client for
      // events because flux only allows store state changes during flux dispatches.
      // So dispatch directly from here. Ideally we'd use a SyncStateStore that
      // would do this dispatch and expose the sync state itself (by listening to
      // its own dispatch).
      _dispatcher.default.dispatch({
        action: 'sync_state',
        prevState,
        state
      });

      if (state === "ERROR" || state === "RECONNECTING") {
        if (data.error instanceof _errors.InvalidStoreError) {
          Lifecycle.handleInvalidStoreError(data.error);
        }

        this.setState({
          syncError: data.error || true
        });
      } else if (this.state.syncError) {
        this.setState({
          syncError: null
        });
      }

      this.updateStatusIndicator(state, prevState);

      if (state === "SYNCING" && prevState === "SYNCING") {
        return;
      }

      console.info("MatrixClient sync state => %s", state);

      if (state !== "PREPARED") {
        return;
      }

      this.firstSyncComplete = true;
      this.firstSyncPromise.resolve();

      _dispatcher.default.dispatch({
        action: 'focus_composer'
      });

      this.setState({
        ready: true,
        showNotifierToolbar: _Notifier.default.shouldShowToolbar()
      });
    });
    cli.on('Call.incoming', function (call) {
      // we dispatch this synchronously to make sure that the event
      // handlers on the call are set up immediately (so that if
      // we get an immediate hangup, we don't get a stuck call)
      _dispatcher.default.dispatch({
        action: 'incoming_call',
        call: call
      }, true);
    });
    cli.on('Session.logged_out', function (errObj) {
      if (Lifecycle.isLoggingOut()) return;

      if (errObj.httpStatus === 401 && errObj.data && errObj.data['soft_logout']) {
        console.warn("Soft logout issued by server - avoiding data deletion");
        Lifecycle.softLogout();
        return;
      }

      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Signed out', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Signed Out'),
        description: (0, _languageHandler._t)('For security, this session has been signed out. Please sign in again.')
      });

      _dispatcher.default.dispatch({
        action: 'logout'
      });
    });
    cli.on('no_consent', function (message, consentUri) {
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

      _Modal.default.createTrackedDialog('No Consent Dialog', '', QuestionDialog, {
        title: (0, _languageHandler._t)('Terms and Conditions'),
        description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, " ", (0, _languageHandler._t)('To continue using the %(homeserverDomain)s homeserver ' + 'you must review and agree to our terms and conditions.', {
          homeserverDomain: cli.getDomain()
        }))),
        button: (0, _languageHandler._t)('Review terms and conditions'),
        cancelButton: (0, _languageHandler._t)('Dismiss'),
        onFinished: confirmed => {
          if (confirmed) {
            const wnd = window.open(consentUri, '_blank');
            wnd.opener = null;
          }
        }
      }, null, true);
    });
    const dft = new _DecryptionFailureTracker.DecryptionFailureTracker((total, errorCode) => {
      _Analytics.default.trackEvent('E2E', 'Decryption failure', errorCode, total);
    }, errorCode => {
      // Map JS-SDK error codes to tracker codes for aggregation
      switch (errorCode) {
        case 'MEGOLM_UNKNOWN_INBOUND_SESSION_ID':
          return 'olm_keys_not_sent_error';

        case 'OLM_UNKNOWN_MESSAGE_INDEX':
          return 'olm_index_error';

        case undefined:
          return 'unexpected_error';

        default:
          return 'unspecified_error';
      }
    }); // Shelved for later date when we have time to think about persisting history of
    // tracked events across sessions.
    // dft.loadTrackedEventHashMap();

    dft.start(); // When logging out, stop tracking failures and destroy state

    cli.on("Session.logged_out", () => dft.stop());
    cli.on("Event.decrypted", (e, err) => dft.eventDecrypted(e, err)); // TODO: We can remove this once cross-signing is the only way.
    // https://github.com/vector-im/riot-web/issues/11908

    const krh = new _KeyRequestHandler.default(cli);
    cli.on("crypto.roomKeyRequest", req => {
      krh.handleKeyRequest(req);
    });
    cli.on("crypto.roomKeyRequestCancellation", req => {
      krh.handleKeyRequestCancellation(req);
    });
    cli.on("Room", room => {
      if (_MatrixClientPeg.MatrixClientPeg.get().isCryptoEnabled()) {
        const blacklistEnabled = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.ROOM_DEVICE, "blacklistUnverifiedDevices", room.roomId,
        /*explicit=*/
        true);

        room.setBlacklistUnverifiedDevices(blacklistEnabled);
      }
    });
    cli.on("crypto.warning", type => {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      switch (type) {
        case 'CRYPTO_WARNING_OLD_VERSION_DETECTED':
          _Modal.default.createTrackedDialog('Crypto migrated', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Old cryptography data detected'),
            description: (0, _languageHandler._t)("Data from an older version of Riot has been detected. " + "This will have caused end-to-end cryptography to malfunction " + "in the older version. End-to-end encrypted messages exchanged " + "recently whilst using the older version may not be decryptable " + "in this version. This may also cause messages exchanged with this " + "version to fail. If you experience problems, log out and back in " + "again. To retain message history, export and re-import your keys.")
          });

          break;
      }
    });
    cli.on("crypto.keyBackupFailed", async errcode => {
      let haveNewVersion;
      let newVersionInfo; // if key backup is still enabled, there must be a new backup in place

      if (_MatrixClientPeg.MatrixClientPeg.get().getKeyBackupEnabled()) {
        haveNewVersion = true;
      } else {
        // otherwise check the server to see if there's a new one
        try {
          newVersionInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
          if (newVersionInfo !== null) haveNewVersion = true;
        } catch (e) {
          console.error("Saw key backup error but failed to check backup version!", e);
          return;
        }
      }

      if (haveNewVersion) {
        _Modal.default.createTrackedDialogAsync('New Recovery Method', 'New Recovery Method', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../async-components/views/dialogs/keybackup/NewRecoveryMethodDialog'))), {
          newVersionInfo
        });
      } else {
        _Modal.default.createTrackedDialogAsync('Recovery Method Removed', 'Recovery Method Removed', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../async-components/views/dialogs/keybackup/RecoveryMethodRemovedDialog'))));
      }
    });
    cli.on("crypto.keySignatureUploadFailure", (failures, source, continuation) => {
      const KeySignatureUploadFailedDialog = sdk.getComponent('views.dialogs.KeySignatureUploadFailedDialog');

      _Modal.default.createTrackedDialog('Failed to upload key signatures', 'Failed to upload key signatures', KeySignatureUploadFailedDialog, {
        failures,
        source,
        continuation
      });
    });
    cli.on("crypto.verification.request", request => {
      const isFlagOn = _SettingsStore.default.getValue("feature_cross_signing");

      if (!isFlagOn && !request.channel.deviceId) {
        request.cancel({
          code: "m.invalid_message",
          reason: "This client has cross-signing disabled"
        });
        return;
      }

      if (request.verifier) {
        const IncomingSasDialog = sdk.getComponent("views.dialogs.IncomingSasDialog");

        _Modal.default.createTrackedDialog('Incoming Verification', '', IncomingSasDialog, {
          verifier: request.verifier
        }, null,
        /* priority = */
        false,
        /* static = */
        true);
      } else if (request.pending) {
        _ToastStore.default.sharedInstance().addOrReplaceToast({
          key: 'verifreq_' + request.channel.transactionId,
          title: request.isSelfVerification ? (0, _languageHandler._t)("Self-verification request") : (0, _languageHandler._t)("Verification Request"),
          icon: "verification",
          props: {
            request
          },
          component: sdk.getComponent("toasts.VerificationRequestToast"),
          priority: _ToastStore.default.PRIORITY_REALTIME
        });
      }
    }); // Fire the tinter right on startup to ensure the default theme is applied
    // A later sync can/will correct the tint to be the right value for the user

    const colorScheme = _SettingsStore.default.getValue("roomColor");

    _Tinter.default.tint(colorScheme.primary_color, colorScheme.secondary_color);
  }
  /**
   * Called shortly after the matrix client has started. Useful for
   * setting up anything that requires the client to be started.
   * @private
   */


  onClientStarted() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli.isCryptoEnabled()) {
      const blacklistEnabled = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, "blacklistUnverifiedDevices");

      cli.setGlobalBlacklistUnverifiedDevices(blacklistEnabled); // With cross-signing enabled, we send to unknown devices
      // without prompting. Any bad-device status the user should
      // be aware of will be signalled through the room shield
      // changing colour. More advanced behaviour will come once
      // we implement more settings.

      cli.setGlobalErrorOnUnknownDevices(!_SettingsStore.default.getValue("feature_cross_signing"));
    }
  }

  showScreen(screen
  /*: string*/
  , params
  /*: {[key: string]: any}*/
  ) {
    if (screen === 'register') {
      _dispatcher.default.dispatch({
        action: 'start_registration',
        params: params
      });
    } else if (screen === 'login') {
      _dispatcher.default.dispatch({
        action: 'start_login',
        params: params
      });
    } else if (screen === 'forgot_password') {
      _dispatcher.default.dispatch({
        action: 'start_password_recovery',
        params: params
      });
    } else if (screen === 'soft_logout') {
      if (_MatrixClientPeg.MatrixClientPeg.get() && _MatrixClientPeg.MatrixClientPeg.get().getUserId() && !Lifecycle.isSoftLogout()) {
        // Logged in - visit a room
        this.viewLastRoom();
      } else {
        // Ultimately triggers soft_logout if needed
        _dispatcher.default.dispatch({
          action: 'start_login',
          params: params
        });
      }
    } else if (screen === 'new') {
      _dispatcher.default.dispatch({
        action: 'view_create_room'
      });
    } else if (screen === 'settings') {
      _dispatcher.default.fire(_actions.Action.ViewUserSettings);
    } else if (screen === 'welcome') {
      _dispatcher.default.dispatch({
        action: 'view_welcome_page'
      });
    } else if (screen === 'home') {
      _dispatcher.default.dispatch({
        action: 'view_home_page'
      });
    } else if (screen === 'start') {
      this.showScreen('home');

      _dispatcher.default.dispatch({
        action: 'require_registration'
      });
    } else if (screen === 'directory') {
      _dispatcher.default.dispatch({
        action: 'view_room_directory'
      });
    } else if (screen === 'groups') {
      _dispatcher.default.dispatch({
        action: 'view_my_groups'
      });
    } else if (screen === 'complete_security') {
      _dispatcher.default.dispatch({
        action: 'start_complete_security'
      });
    } else if (screen === 'post_registration') {
      _dispatcher.default.dispatch({
        action: 'start_post_registration'
      });
    } else if (screen.indexOf('room/') === 0) {
      // Rooms can have the following formats:
      // #room_alias:domain or !opaque_id:domain
      const room = screen.substring(5);
      const domainOffset = room.indexOf(':') + 1; // 0 in case room does not contain a :

      let eventOffset = room.length; // room aliases can contain slashes only look for slash after domain

      if (room.substring(domainOffset).indexOf('/') > -1) {
        eventOffset = domainOffset + room.substring(domainOffset).indexOf('/');
      }

      const roomString = room.substring(0, eventOffset);
      let eventId = room.substring(eventOffset + 1); // empty string if no event id given
      // Previously we pulled the eventID from the segments in such a way
      // where if there was no eventId then we'd get undefined. However, we
      // now do a splice and join to handle v3 event IDs which results in
      // an empty string. To maintain our potential contract with the rest
      // of the app, we coerce the eventId to be undefined where applicable.

      if (!eventId) eventId = undefined; // TODO: Handle encoded room/event IDs: https://github.com/vector-im/riot-web/issues/9149
      // FIXME: sort_out caseConsistency

      const thirdPartyInvite = {
        inviteSignUrl: params.signurl,
        invitedEmail: params.email
      };
      const oobData = {
        name: params.room_name,
        avatarUrl: params.room_avatar_url,
        inviterName: params.inviter_name
      }; // on our URLs there might be a ?via=matrix.org or similar to help
      // joins to the room succeed. We'll pass these through as an array
      // to other levels. If there's just one ?via= then params.via is a
      // single string. If someone does something like ?via=one.com&via=two.com
      // then params.via is an array of strings.

      let via = [];

      if (params.via) {
        if (typeof params.via === 'string') via = [params.via];else via = params.via;
      }

      const payload = {
        action: 'view_room',
        event_id: eventId,
        via_servers: via,
        // If an event ID is given in the URL hash, notify RoomViewStore to mark
        // it as highlighted, which will propagate to RoomView and highlight the
        // associated EventTile.
        highlighted: Boolean(eventId),
        third_party_invite: thirdPartyInvite,
        oob_data: oobData,
        room_alias: undefined,
        room_id: undefined
      };

      if (roomString[0] === '#') {
        payload.room_alias = roomString;
      } else {
        payload.room_id = roomString;
      }

      _dispatcher.default.dispatch(payload);
    } else if (screen.indexOf('user/') === 0) {
      const userId = screen.substring(5);

      _dispatcher.default.dispatch({
        action: 'view_user_info',
        userId: userId,
        subAction: params.action
      });
    } else if (screen.indexOf('group/') === 0) {
      const groupId = screen.substring(6); // TODO: Check valid group ID

      _dispatcher.default.dispatch({
        action: 'view_group',
        group_id: groupId
      });
    } else {
      console.info("Ignoring showScreen for '%s'", screen);
    }
  }

  notifyNewScreen(screen
  /*: string*/
  ) {
    if (this.props.onNewScreen) {
      this.props.onNewScreen(screen);
    }

    this.setPageSubtitle();
  }

  onAliasClick(event
  /*: MouseEvent*/
  , alias
  /*: string*/
  ) {
    event.preventDefault();

    _dispatcher.default.dispatch({
      action: 'view_room',
      room_alias: alias
    });
  }

  onUserClick(event
  /*: MouseEvent*/
  , userId
  /*: string*/
  ) {
    event.preventDefault();
    const member = new _roomMember.RoomMember(null, userId);

    if (!member) {
      return;
    }

    _dispatcher.default.dispatch({
      action: _actions.Action.ViewUser,
      member: member
    });
  }

  onGroupClick(event
  /*: MouseEvent*/
  , groupId
  /*: string*/
  ) {
    event.preventDefault();

    _dispatcher.default.dispatch({
      action: 'view_group',
      group_id: groupId
    });
  }

  onLogoutClick(event
  /*: React.MouseEvent<HTMLAnchorElement, MouseEvent>*/
  ) {
    _dispatcher.default.dispatch({
      action: 'logout'
    });

    event.stopPropagation();
    event.preventDefault();
  }

  dispatchTimelineResize() {
    _dispatcher.default.dispatch({
      action: 'timeline_resize'
    });
  }

  onRoomCreated(roomId
  /*: string*/
  ) {
    _dispatcher.default.dispatch({
      action: "view_room",
      room_id: roomId
    });
  }

  // returns a promise which resolves to the new MatrixClient
  onRegistered(credentials
  /*: object*/
  ) {
    return Lifecycle.setLoggedIn(credentials);
  }

  onVersion(current
  /*: string*/
  , latest
  /*: string*/
  , releaseNotes
  /*: string*/
  ) {
    this.setState({
      version: current,
      newVersion: latest,
      hasNewVersion: current !== latest,
      newVersionReleaseNotes: releaseNotes,
      checkingForUpdate: null
    });
  }

  onSendEvent(roomId
  /*: string*/
  , event
  /*: MatrixEvent*/
  ) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (!cli) {
      _dispatcher.default.dispatch({
        action: 'message_send_failed'
      });

      return;
    }

    cli.sendEvent(roomId, event.getType(), event.getContent()).then(() => {
      _dispatcher.default.dispatch({
        action: 'message_sent'
      });
    }, err => {
      _dispatcher.default.dispatch({
        action: 'message_send_failed'
      });
    });
  }

  setPageSubtitle(subtitle = '') {
    if (this.state.currentRoomId) {
      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const room = client && client.getRoom(this.state.currentRoomId);

      if (room) {
        subtitle = "".concat(this.subTitleStatus, " | ").concat(room.name, " ").concat(subtitle);
      }
    } else {
      subtitle = "".concat(this.subTitleStatus, " ").concat(subtitle);
    }

    document.title = "".concat(_SdkConfig.default.get().brand || 'Riot', " ").concat(subtitle);
  }

  updateStatusIndicator(state
  /*: string*/
  , prevState
  /*: string*/
  ) {
    const notifCount = (0, _RoomNotifs.countRoomsWithNotif)(_MatrixClientPeg.MatrixClientPeg.get().getRooms()).count;

    if (_PlatformPeg.default.get()) {
      _PlatformPeg.default.get().setErrorStatus(state === 'ERROR');

      _PlatformPeg.default.get().setNotificationCount(notifCount);
    }

    this.subTitleStatus = '';

    if (state === "ERROR") {
      this.subTitleStatus += "[".concat((0, _languageHandler._t)("Offline"), "] ");
    }

    if (notifCount > 0) {
      this.subTitleStatus += "[".concat(notifCount, "]");
    }

    this.setPageSubtitle();
  }

  onCloseAllSettings() {
    _dispatcher.default.dispatch({
      action: 'close_settings'
    });
  }

  render() {
    // console.log(`Rendering MatrixChat with view ${this.state.view}`);
    let fragmentAfterLogin = "";

    if (this.props.initialScreenAfterLogin) {
      fragmentAfterLogin = "/".concat(this.props.initialScreenAfterLogin.screen);
    }

    let view;

    if (this.state.view === Views.LOADING) {
      const Spinner = sdk.getComponent('elements.Spinner');
      view = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MatrixChat_splash"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null));
    } else if (this.state.view === Views.COMPLETE_SECURITY) {
      const CompleteSecurity = sdk.getComponent('structures.auth.CompleteSecurity');
      view = /*#__PURE__*/_react.default.createElement(CompleteSecurity, {
        onFinished: this.onCompleteSecurityE2eSetupFinished
      });
    } else if (this.state.view === Views.E2E_SETUP) {
      const E2eSetup = sdk.getComponent('structures.auth.E2eSetup');
      view = /*#__PURE__*/_react.default.createElement(E2eSetup, {
        onFinished: this.onCompleteSecurityE2eSetupFinished,
        accountPassword: this.accountPassword
      });
    } else if (this.state.view === Views.POST_REGISTRATION) {
      // needs to be before normal PageTypes as you are logged in technically
      const PostRegistration = sdk.getComponent('structures.auth.PostRegistration');
      view = /*#__PURE__*/_react.default.createElement(PostRegistration, {
        onComplete: this.onFinishPostRegistration
      });
    } else if (this.state.view === Views.LOGGED_IN) {
      // store errors stop the client syncing and require user intervention, so we'll
      // be showing a dialog. Don't show anything else.
      const isStoreError = this.state.syncError && this.state.syncError instanceof _errors.InvalidStoreError; // `ready` and `view==LOGGED_IN` may be set before `page_type` (because the
      // latter is set via the dispatcher). If we don't yet have a `page_type`,
      // keep showing the spinner for now.

      if (this.state.ready && this.state.page_type && !isStoreError) {
        /* for now, we stuff the entirety of our props and state into the LoggedInView.
         * we should go through and figure out what we actually need to pass down, as well
         * as using something like redux to avoid having a billion bits of state kicking around.
         */
        const LoggedInView = sdk.getComponent('structures.LoggedInView');
        view = /*#__PURE__*/_react.default.createElement(LoggedInView, (0, _extends2.default)({}, this.props, this.state, {
          ref: this.loggedInView,
          matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
          onRoomCreated: this.onRoomCreated,
          onCloseAllSettings: this.onCloseAllSettings,
          onRegistered: this.onRegistered,
          currentRoomId: this.state.currentRoomId,
          showCookieBar: this.state.showCookieBar
        }));
      } else {
        // we think we are logged in, but are still waiting for the /sync to complete
        const Spinner = sdk.getComponent('elements.Spinner');
        let errorBox;

        if (this.state.syncError && !isStoreError) {
          errorBox = /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_MatrixChat_syncError"
          }, (0, _ErrorUtils.messageForSyncError)(this.state.syncError));
        }

        view = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_MatrixChat_splash"
        }, errorBox, /*#__PURE__*/_react.default.createElement(Spinner, null), /*#__PURE__*/_react.default.createElement("a", {
          href: "#",
          className: "mx_MatrixChat_splashButtons",
          onClick: this.onLogoutClick
        }, (0, _languageHandler._t)('Logout')));
      }
    } else if (this.state.view === Views.WELCOME) {
      const Welcome = sdk.getComponent('auth.Welcome');
      view = /*#__PURE__*/_react.default.createElement(Welcome, (0, _extends2.default)({}, this.getServerProperties(), {
        fragmentAfterLogin: fragmentAfterLogin
      }));
    } else if (this.state.view === Views.REGISTER) {
      const Registration = sdk.getComponent('structures.auth.Registration');
      view = /*#__PURE__*/_react.default.createElement(Registration, (0, _extends2.default)({
        clientSecret: this.state.register_client_secret,
        sessionId: this.state.register_session_id,
        idSid: this.state.register_id_sid,
        email: this.props.startingFragmentQueryParams.email,
        brand: this.props.config.brand,
        makeRegistrationUrl: this.makeRegistrationUrl,
        onLoggedIn: this.onRegisterFlowComplete,
        onLoginClick: this.onLoginClick,
        onServerConfigChange: this.onServerConfigChange,
        defaultDeviceDisplayName: this.props.defaultDeviceDisplayName
      }, this.getServerProperties()));
    } else if (this.state.view === Views.FORGOT_PASSWORD) {
      const ForgotPassword = sdk.getComponent('structures.auth.ForgotPassword');
      view = /*#__PURE__*/_react.default.createElement(ForgotPassword, (0, _extends2.default)({
        onComplete: this.onLoginClick,
        onLoginClick: this.onLoginClick,
        onServerConfigChange: this.onServerConfigChange
      }, this.getServerProperties()));
    } else if (this.state.view === Views.LOGIN) {
      const Login = sdk.getComponent('structures.auth.Login');
      view = /*#__PURE__*/_react.default.createElement(Login, (0, _extends2.default)({
        isSyncing: this.state.pendingInitialSync,
        onLoggedIn: this.onUserCompletedLoginFlow,
        onRegisterClick: this.onRegisterClick,
        fallbackHsUrl: this.getFallbackHsUrl(),
        defaultDeviceDisplayName: this.props.defaultDeviceDisplayName,
        onForgotPasswordClick: this.onForgotPasswordClick,
        onServerConfigChange: this.onServerConfigChange,
        fragmentAfterLogin: fragmentAfterLogin
      }, this.getServerProperties()));
    } else if (this.state.view === Views.SOFT_LOGOUT) {
      const SoftLogout = sdk.getComponent('structures.auth.SoftLogout');
      view = /*#__PURE__*/_react.default.createElement(SoftLogout, {
        realQueryParams: this.props.realQueryParams,
        onTokenLoginCompleted: this.props.onTokenLoginCompleted,
        fragmentAfterLogin: fragmentAfterLogin
      });
    } else {
      console.error("Unknown view ".concat(this.state.view));
    }

    const ErrorBoundary = sdk.getComponent('elements.ErrorBoundary');
    return /*#__PURE__*/_react.default.createElement(ErrorBoundary, null, view);
  }

}

exports.default = MatrixChat;
(0, _defineProperty2.default)(MatrixChat, "displayName", "MatrixChat");
(0, _defineProperty2.default)(MatrixChat, "defaultProps", {
  realQueryParams: {},
  startingFragmentQueryParams: {},
  config: {},
  onTokenLoginCompleted: () => {}
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvTWF0cml4Q2hhdC50c3giXSwibmFtZXMiOlsiVmlld3MiLCJPTkJPQVJESU5HX0ZMT1dfU1RBUlRFUlMiLCJBY3Rpb24iLCJWaWV3VXNlclNldHRpbmdzIiwiTWF0cml4Q2hhdCIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJjb250ZXh0IiwicGF5bG9hZCIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiUXVlc3Rpb25EaWFsb2ciLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJpc0d1ZXN0IiwiaW5jbHVkZXMiLCJhY3Rpb24iLCJkaXMiLCJkaXNwYXRjaCIsImRlZmVycmVkX2FjdGlvbiIsImV2ZW50X3R5cGUiLCJmdWxsVXJsIiwiZXZlbnRfY29udGVudCIsInNldElkZW50aXR5U2VydmVyVXJsIiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsInNldEl0ZW0iLCJMaWZlY3ljbGUiLCJsb2dvdXQiLCJpc1NvZnRMb2dvdXQiLCJvblNvZnRMb2dvdXQiLCJzY3JlZW5BZnRlckxvZ2luIiwic3RhcnRSZWdpc3RyYXRpb24iLCJwYXJhbXMiLCJzZXRTdGF0ZUZvck5ld1ZpZXciLCJ2aWV3IiwiTE9HSU4iLCJub3RpZnlOZXdTY3JlZW4iLCJUaGVtZUNvbnRyb2xsZXIiLCJpc0xvZ2luIiwidGhlbWVXYXRjaGVyIiwicmVjaGVjayIsInNldFN0YXRlIiwiUE9TVF9SRUdJU1RSQVRJT04iLCJGT1JHT1RfUEFTU1dPUkQiLCJkbVVzZXJJZCIsInVzZXJfaWQiLCJsZWF2ZVJvb20iLCJyb29tX2lkIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm9uRmluaXNoZWQiLCJjb25maXJtIiwiTG9hZGVyIiwibW9kYWwiLCJjcmVhdGVEaWFsb2ciLCJsZWF2ZSIsInRoZW4iLCJjbG9zZSIsInN0YXRlIiwiY3VycmVudFJvb21JZCIsImVyciIsInRvU3RyaW5nIiwidmlld1VzZXIiLCJ1c2VySWQiLCJzdWJBY3Rpb24iLCJwcm9taXNlIiwidmlld1Jvb20iLCJ2aWV3TmV4dFJvb20iLCJ2aWV3SW5kZXhlZFJvb20iLCJyb29tSW5kZXgiLCJVc2VyU2V0dGluZ3NEaWFsb2ciLCJ2aWV3U29tZXRoaW5nQmVoaW5kTW9kYWwiLCJjcmVhdGVSb29tIiwicHVibGljIiwiQ3JlYXRlR3JvdXBEaWFsb2ciLCJSb29tRGlyZWN0b3J5Iiwic2V0UGFnZSIsIlBhZ2VUeXBlcyIsIk15R3JvdXBzIiwidmlld0dyb3VwIiwidmlld1dlbGNvbWUiLCJ2aWV3SG9tZSIsInNldE14SWQiLCJjaGF0Q3JlYXRlT3JSZXVzZSIsInJvb21JZCIsInNob3dTY3JlZW5BZnRlckxvZ2luIiwicGFnZV90eXBlIiwic2hvd05vdGlmaWVyVG9vbGJhciIsIk5vdGlmaWVyIiwic2hvdWxkU2hvd1Rvb2xiYXIiLCJjb2xsYXBzZUxocyIsImxlZnREaXNhYmxlZCIsInNpZGVEaXNhYmxlZCIsIm1pZGRsZURpc2FibGVkIiwiUkVHSVNURVIiLCJDT01QTEVURV9TRUNVUklUWSIsIkUyRV9TRVRVUCIsIm9uTG9nZ2VkSW4iLCJvbkxvZ2dlZE91dCIsInJlYWR5Iiwib25XaWxsU3RhcnRDbGllbnQiLCJvbkNsaWVudFN0YXJ0ZWQiLCJvblZlcnNpb24iLCJjdXJyZW50VmVyc2lvbiIsIm5ld1ZlcnNpb24iLCJyZWxlYXNlTm90ZXMiLCJjaGVja2luZ0ZvclVwZGF0ZSIsInZhbHVlIiwib25TZW5kRXZlbnQiLCJldmVudCIsImhpZGVUb1NSVXNlcnMiLCJTZXR0aW5nc1N0b3JlIiwic2V0VmFsdWUiLCJTZXR0aW5nTGV2ZWwiLCJERVZJQ0UiLCJzaG93Q29va2llQmFyIiwiQW5hbHl0aWNzIiwiZW5hYmxlIiwiaGlkZUxoc1RocmVzaG9sZCIsInNob3dMaHNUaHJlc2hvbGQiLCJ3aW5kb3dXaWR0aCIsIndpbmRvdyIsImlubmVyV2lkdGgiLCJyZXNpemVOb3RpZmllciIsIm5vdGlmeVdpbmRvd1Jlc2l6ZWQiLCJzaG93U2NyZWVuIiwiY3JlZGVudGlhbHMiLCJwYXNzd29yZCIsIm9uVXNlckNvbXBsZXRlZExvZ2luRmxvdyIsIkxPR0dFRF9JTiIsInNlcnZlckNvbmZpZyIsInN0YXJ0aW5nRnJhZ21lbnRRdWVyeVBhcmFtcyIsInJlZmVycmVyIiwibWFrZVJlZ2lzdHJhdGlvblVybCIsImFjY291bnRQYXNzd29yZCIsImFjY291bnRQYXNzd29yZFRpbWVyIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImxvZ2dlZEluIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhY3Rpb25IYW5kbGVyUmVmIiwicmVnaXN0ZXIiLCJ1bnJlZ2lzdGVyIiwic2V0TG9nZ2VkSW5Qcm9taXNlIiwic2V0TG9nZ2VkSW4iLCJjbGkiLCJjcnlwdG9BdmFpbGFibGUiLCJwZW5kaW5nSW5pdGlhbFN5bmMiLCJmaXJzdFN5bmNQcm9taXNlIiwibWFzdGVyS2V5SW5TdG9yYWdlIiwiZ2V0QWNjb3VudERhdGEiLCJnZXRWYWx1ZSIsImRvZXNTZXJ2ZXJTdXBwb3J0VW5zdGFibGVGZWF0dXJlIiwiTE9BRElORyIsImhhc05ld1ZlcnNpb24iLCJuZXdWZXJzaW9uUmVsZWFzZU5vdGVzIiwic3luY0Vycm9yIiwiUmVzaXplTm90aWZpZXIiLCJsb2dnZWRJblZpZXciLCJTZGtDb25maWciLCJwdXQiLCJjb25maWciLCJmaXJzdFN5bmNDb21wbGV0ZSIsInN5bmNfdGltZWxpbmVfbGltaXQiLCJvcHRzIiwiaW5pdGlhbFN5bmNMaW1pdCIsImluaXRpYWxTY3JlZW5BZnRlckxvZ2luIiwiaGFuZGxlUmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsInBhZ2VDaGFuZ2luZyIsIlRpbnRlciIsInRpbnQiLCJvbiIsImRpc3BhdGNoVGltZWxpbmVSZXNpemUiLCJsb2FkU2Vzc2lvbiIsImRpc3BhdGNoZXJSZWYiLCJvbkFjdGlvbiIsIlRoZW1lV2F0Y2hlciIsInN0YXJ0IiwiZm9jdXNDb21wb3NlciIsInN1YlRpdGxlU3RhdHVzIiwib25BbGlhc0NsaWNrIiwibGlua2lmeU1hdHJpeCIsIm9uVXNlckNsaWNrIiwib25Hcm91cENsaWNrIiwiYXR0ZW1wdFRva2VuTG9naW4iLCJyZWFsUXVlcnlQYXJhbXMiLCJkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWUiLCJvblRva2VuTG9naW5Db21wbGV0ZWQiLCJmaXJzdFNjcmVlbiIsInNjcmVlbiIsIlVOU0FGRV9jb21wb25lbnRXaWxsVXBkYXRlIiwic2hvdWxkVHJhY2tQYWdlQ2hhbmdlIiwic3RhcnRQYWdlQ2hhbmdlVGltZXIiLCJjb21wb25lbnREaWRVcGRhdGUiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJkdXJhdGlvbk1zIiwic3RvcFBhZ2VDaGFuZ2VUaW1lciIsInRyYWNrUGFnZUNoYW5nZSIsImNvbXBvbmVudFdpbGxVbm1vdW50Iiwic3RvcE1hdHJpeENsaWVudCIsInN0b3AiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJnZXRGYWxsYmFja0hzVXJsIiwiaXNEZWZhdWx0IiwiZmFsbGJhY2tfaHNfdXJsIiwiZ2V0U2VydmVyUHJvcGVydGllcyIsImZyYWdtZW50UXVlcnlQYXJhbXMiLCJlbmFibGVHdWVzdCIsImd1ZXN0SHNVcmwiLCJoc1VybCIsImd1ZXN0SXNVcmwiLCJpc1VybCIsImxvYWRlZFNlc3Npb24iLCJwZXJmb3JtYW5jZSIsIm1hcmsiLCJjb25zb2xlIiwid2FybiIsIm1lYXN1cmUiLCJjbGVhck1hcmtzIiwibWVhc3VyZW1lbnQiLCJnZXRFbnRyaWVzQnlOYW1lIiwicG9wIiwiZHVyYXRpb24iLCJ1bmRlZmluZWQiLCJFcnJvciIsIm5ld1N0YXRlIiwiY3VycmVudFVzZXJJZCIsIk9iamVjdCIsImFzc2lnbiIsInBhZ2VUeXBlIiwiY2xpZW50X3NlY3JldCIsInNlc3Npb25faWQiLCJoc191cmwiLCJpc191cmwiLCJzaWQiLCJBdXRvRGlzY292ZXJ5VXRpbHMiLCJ2YWxpZGF0ZVNlcnZlckNvbmZpZ1dpdGhTdGF0aWNVcmxzIiwicmVnaXN0ZXJfY2xpZW50X3NlY3JldCIsInJlZ2lzdGVyX3Nlc3Npb25faWQiLCJyZWdpc3Rlcl9pZF9zaWQiLCJyb29tSW5kZXhEZWx0YSIsImFsbFJvb21zIiwiUm9vbUxpc3RTb3J0ZXIiLCJtb3N0UmVjZW50QWN0aXZpdHlGaXJzdCIsImdldFJvb21zIiwibGVuZ3RoIiwiaSIsInJvb21JbmZvIiwicm9vbV9hbGlhcyIsImxvZyIsImV2ZW50X2lkIiwid2FpdEZvciIsInByZXNlbnRlZElkIiwicm9vbSIsImdldFJvb20iLCJ0aGVBbGlhcyIsIlJvb21zIiwiZ2V0RGlzcGxheUFsaWFzRm9yUm9vbSIsImhpZ2hsaWdodGVkIiwiUm9vbVZpZXciLCJ0aGlyZFBhcnR5SW52aXRlIiwidGhpcmRfcGFydHlfaW52aXRlIiwicm9vbU9vYkRhdGEiLCJvb2JfZGF0YSIsInZpYVNlcnZlcnMiLCJ2aWFfc2VydmVycyIsImdyb3VwSWQiLCJncm91cF9pZCIsImN1cnJlbnRHcm91cElkIiwiY3VycmVudEdyb3VwSXNOZXciLCJncm91cF9pc19uZXciLCJHcm91cFZpZXciLCJXRUxDT01FIiwiSG9tZVBhZ2UiLCJ3YWl0Rm9yU3luYyIsIlVzZXJWaWV3IiwiU2V0TXhJZERpYWxvZyIsImhvbWVzZXJ2ZXJVcmwiLCJnZXRIb21lc2VydmVyVXJsIiwic3VibWl0dGVkIiwiZ29faG9tZV9vbl9jYW5jZWwiLCJzZXRKdXN0UmVnaXN0ZXJlZFVzZXJJZCIsIm9uUmVnaXN0ZXJlZCIsIm9uRGlmZmVyZW50U2VydmVyQ2xpY2tlZCIsImV2Iiwib25Mb2dpbkNsaWNrIiwiZGVmYXVsdFB1YmxpYyIsIkNyZWF0ZVJvb21EaWFsb2ciLCJzaG91bGRDcmVhdGUiLCJmaW5pc2hlZCIsIndlbGNvbWVVc2VySWQiLCJnb193ZWxjb21lX29uX2NhbmNlbCIsInNjcmVlbl9hZnRlciIsImNsaWVudCIsImRtUm9vbU1hcCIsIkRNUm9vbU1hcCIsImRtUm9vbXMiLCJnZXRETVJvb21zRm9yVXNlcklkIiwibGVhdmVSb29tV2FybmluZ3MiLCJyb29tVG9MZWF2ZSIsImpvaW5SdWxlcyIsImN1cnJlbnRTdGF0ZSIsImdldFN0YXRlRXZlbnRzIiwid2FybmluZ3MiLCJydWxlIiwiZ2V0Q29udGVudCIsImpvaW5fcnVsZSIsInB1c2giLCJyb29tTmFtZSIsIm5hbWUiLCJidXR0b24iLCJzaG91bGRMZWF2ZSIsImQiLCJsZWF2ZVJvb21DaGFpbiIsImVycm9ycyIsImxlZnRSb29tSWQiLCJrZXlzIiwiZXJyb3IiLCJtZXNzYWdlIiwiZXJyY29kZSIsInN0YXJ0V2VsY29tZVVzZXJDaGF0Iiwid2VsY29tZVVzZXJSb29tcyIsInNoYXJlZCIsImFuZFZpZXciLCJzcGlubmVyIiwic2F2ZVdlbGNvbWVVc2VyIiwiZ2V0VHlwZSIsInN0b3JlIiwic2F2ZSIsImN1cnJlbnRVc2VySXNKdXN0UmVnaXN0ZXJlZCIsInN0YXJ0c1dpdGgiLCJ3ZWxjb21lVXNlclJvb20iLCJTdG9yYWdlTWFuYWdlciIsInRyeVBlcnNpc3RTdG9yYWdlIiwiZ2V0SXRlbSIsInZpZXdMYXN0Um9vbSIsInNldFBhZ2VTdWJ0aXRsZSIsIlNPRlRfTE9HT1VUIiwic2V0Q2FuUmVzZXRUaW1lbGluZUNhbGxiYWNrIiwiY3VycmVudCIsImNhblJlc2V0VGltZWxpbmVJblJvb20iLCJkYXRhIiwiSW52YWxpZFN0b3JlRXJyb3IiLCJoYW5kbGVJbnZhbGlkU3RvcmVFcnJvciIsInVwZGF0ZVN0YXR1c0luZGljYXRvciIsImluZm8iLCJjYWxsIiwiZXJyT2JqIiwiaXNMb2dnaW5nT3V0IiwiaHR0cFN0YXR1cyIsInNvZnRMb2dvdXQiLCJjb25zZW50VXJpIiwiaG9tZXNlcnZlckRvbWFpbiIsImdldERvbWFpbiIsImNhbmNlbEJ1dHRvbiIsImNvbmZpcm1lZCIsInduZCIsIm9wZW4iLCJvcGVuZXIiLCJkZnQiLCJEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIiLCJ0b3RhbCIsImVycm9yQ29kZSIsInRyYWNrRXZlbnQiLCJlIiwiZXZlbnREZWNyeXB0ZWQiLCJrcmgiLCJLZXlSZXF1ZXN0SGFuZGxlciIsInJlcSIsImhhbmRsZUtleVJlcXVlc3QiLCJoYW5kbGVLZXlSZXF1ZXN0Q2FuY2VsbGF0aW9uIiwiaXNDcnlwdG9FbmFibGVkIiwiYmxhY2tsaXN0RW5hYmxlZCIsImdldFZhbHVlQXQiLCJST09NX0RFVklDRSIsInNldEJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzIiwidHlwZSIsImhhdmVOZXdWZXJzaW9uIiwibmV3VmVyc2lvbkluZm8iLCJnZXRLZXlCYWNrdXBFbmFibGVkIiwiZ2V0S2V5QmFja3VwVmVyc2lvbiIsImNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYyIsImZhaWx1cmVzIiwic291cmNlIiwiY29udGludWF0aW9uIiwiS2V5U2lnbmF0dXJlVXBsb2FkRmFpbGVkRGlhbG9nIiwicmVxdWVzdCIsImlzRmxhZ09uIiwiY2hhbm5lbCIsImRldmljZUlkIiwiY2FuY2VsIiwiY29kZSIsInJlYXNvbiIsInZlcmlmaWVyIiwiSW5jb21pbmdTYXNEaWFsb2ciLCJwZW5kaW5nIiwiVG9hc3RTdG9yZSIsInNoYXJlZEluc3RhbmNlIiwiYWRkT3JSZXBsYWNlVG9hc3QiLCJrZXkiLCJ0cmFuc2FjdGlvbklkIiwiaXNTZWxmVmVyaWZpY2F0aW9uIiwiaWNvbiIsImNvbXBvbmVudCIsInByaW9yaXR5IiwiUFJJT1JJVFlfUkVBTFRJTUUiLCJjb2xvclNjaGVtZSIsInByaW1hcnlfY29sb3IiLCJzZWNvbmRhcnlfY29sb3IiLCJzZXRHbG9iYWxCbGFja2xpc3RVbnZlcmlmaWVkRGV2aWNlcyIsInNldEdsb2JhbEVycm9yT25Vbmtub3duRGV2aWNlcyIsImdldFVzZXJJZCIsImZpcmUiLCJpbmRleE9mIiwic3Vic3RyaW5nIiwiZG9tYWluT2Zmc2V0IiwiZXZlbnRPZmZzZXQiLCJyb29tU3RyaW5nIiwiZXZlbnRJZCIsImludml0ZVNpZ25VcmwiLCJzaWdudXJsIiwiaW52aXRlZEVtYWlsIiwiZW1haWwiLCJvb2JEYXRhIiwicm9vbV9uYW1lIiwiYXZhdGFyVXJsIiwicm9vbV9hdmF0YXJfdXJsIiwiaW52aXRlck5hbWUiLCJpbnZpdGVyX25hbWUiLCJ2aWEiLCJCb29sZWFuIiwib25OZXdTY3JlZW4iLCJhbGlhcyIsInByZXZlbnREZWZhdWx0IiwibWVtYmVyIiwiUm9vbU1lbWJlciIsIlZpZXdVc2VyIiwib25Mb2dvdXRDbGljayIsInN0b3BQcm9wYWdhdGlvbiIsIm9uUm9vbUNyZWF0ZWQiLCJsYXRlc3QiLCJ2ZXJzaW9uIiwic2VuZEV2ZW50Iiwic3VidGl0bGUiLCJkb2N1bWVudCIsImJyYW5kIiwibm90aWZDb3VudCIsImNvdW50IiwiUGxhdGZvcm1QZWciLCJzZXRFcnJvclN0YXR1cyIsInNldE5vdGlmaWNhdGlvbkNvdW50Iiwib25DbG9zZUFsbFNldHRpbmdzIiwicmVuZGVyIiwiZnJhZ21lbnRBZnRlckxvZ2luIiwiU3Bpbm5lciIsIkNvbXBsZXRlU2VjdXJpdHkiLCJvbkNvbXBsZXRlU2VjdXJpdHlFMmVTZXR1cEZpbmlzaGVkIiwiRTJlU2V0dXAiLCJQb3N0UmVnaXN0cmF0aW9uIiwib25GaW5pc2hQb3N0UmVnaXN0cmF0aW9uIiwiaXNTdG9yZUVycm9yIiwiTG9nZ2VkSW5WaWV3IiwiZXJyb3JCb3giLCJXZWxjb21lIiwiUmVnaXN0cmF0aW9uIiwib25SZWdpc3RlckZsb3dDb21wbGV0ZSIsIm9uU2VydmVyQ29uZmlnQ2hhbmdlIiwiRm9yZ290UGFzc3dvcmQiLCJMb2dpbiIsIm9uUmVnaXN0ZXJDbGljayIsIm9uRm9yZ290UGFzc3dvcmRDbGljayIsIlNvZnRMb2dvdXQiLCJFcnJvckJvdW5kYXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFF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QUFBQSxxQkFBcUIsRUFBRSxNQUFNLENBQUU7QUFKYixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTctMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHsgY3JlYXRlUmVmIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSW52YWxpZFN0b3JlRXJyb3IgfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvZXJyb3JzXCI7XG5pbXBvcnQgeyBSb29tTWVtYmVyIH0gZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9yb29tLW1lbWJlclwiO1xuaW1wb3J0IHsgTWF0cml4RXZlbnQgfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL2V2ZW50XCI7XG5pbXBvcnQgeyBpc0NyeXB0b0F2YWlsYWJsZSB9IGZyb20gJ21hdHJpeC1qcy1zZGsvc3JjL2NyeXB0byc7XG4vLyBmb2N1cy12aXNpYmxlIGlzIGEgUG9seWZpbGwgZm9yIHRoZSA6Zm9jdXMtdmlzaWJsZSBDU1MgcHNldWRvLWF0dHJpYnV0ZSB1c2VkIGJ5IF9BY2Nlc3NpYmxlQnV0dG9uLnNjc3NcbmltcG9ydCAnZm9jdXMtdmlzaWJsZSc7XG4vLyB3aGF0LWlucHV0IGhlbHBzIGltcHJvdmUga2V5Ym9hcmQgYWNjZXNzaWJpbGl0eVxuaW1wb3J0ICd3aGF0LWlucHV0JztcblxuaW1wb3J0IEFuYWx5dGljcyBmcm9tIFwiLi4vLi4vQW5hbHl0aWNzXCI7XG5pbXBvcnQgeyBEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIgfSBmcm9tIFwiLi4vLi4vRGVjcnlwdGlvbkZhaWx1cmVUcmFja2VyXCI7XG5pbXBvcnQgeyBNYXRyaXhDbGllbnRQZWcgfSBmcm9tIFwiLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSBcIi4uLy4uL1BsYXRmb3JtUGVnXCI7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gXCIuLi8uLi9TZGtDb25maWdcIjtcbmltcG9ydCAqIGFzIFJvb21MaXN0U29ydGVyIGZyb20gXCIuLi8uLi9Sb29tTGlzdFNvcnRlclwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgTm90aWZpZXIgZnJvbSAnLi4vLi4vTm90aWZpZXInO1xuXG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uL01vZGFsXCI7XG5pbXBvcnQgVGludGVyIGZyb20gXCIuLi8uLi9UaW50ZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBzaG93Um9vbUludml0ZURpYWxvZywgc2hvd1N0YXJ0Q2hhdEludml0ZURpYWxvZyB9IGZyb20gJy4uLy4uL1Jvb21JbnZpdGUnO1xuaW1wb3J0ICogYXMgUm9vbXMgZnJvbSAnLi4vLi4vUm9vbXMnO1xuaW1wb3J0IGxpbmtpZnlNYXRyaXggZnJvbSBcIi4uLy4uL2xpbmtpZnktbWF0cml4XCI7XG5pbXBvcnQgKiBhcyBMaWZlY3ljbGUgZnJvbSAnLi4vLi4vTGlmZWN5Y2xlJztcbi8vIExpZmVjeWNsZVN0b3JlIGlzIG5vdCB1c2VkIGJ1dCBkb2VzIGxpc3RlbiB0byBhbmQgZGlzcGF0Y2ggYWN0aW9uc1xuaW1wb3J0ICcuLi8uLi9zdG9yZXMvTGlmZWN5Y2xlU3RvcmUnO1xuaW1wb3J0IFBhZ2VUeXBlcyBmcm9tICcuLi8uLi9QYWdlVHlwZXMnO1xuaW1wb3J0IHsgZ2V0SG9tZVBhZ2VVcmwgfSBmcm9tICcuLi8uLi91dGlscy9wYWdlcyc7XG5cbmltcG9ydCBjcmVhdGVSb29tIGZyb20gXCIuLi8uLi9jcmVhdGVSb29tXCI7XG5pbXBvcnQgS2V5UmVxdWVzdEhhbmRsZXIgZnJvbSAnLi4vLi4vS2V5UmVxdWVzdEhhbmRsZXInO1xuaW1wb3J0IHsgX3QsIGdldEN1cnJlbnRMYW5ndWFnZSB9IGZyb20gJy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwgeyBTZXR0aW5nTGV2ZWwgfSBmcm9tIFwiLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IFRoZW1lQ29udHJvbGxlciBmcm9tIFwiLi4vLi4vc2V0dGluZ3MvY29udHJvbGxlcnMvVGhlbWVDb250cm9sbGVyXCI7XG5pbXBvcnQgeyBzdGFydEFueVJlZ2lzdHJhdGlvbkZsb3cgfSBmcm9tIFwiLi4vLi4vUmVnaXN0cmF0aW9uLmpzXCI7XG5pbXBvcnQgeyBtZXNzYWdlRm9yU3luY0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvRXJyb3JVdGlscyc7XG5pbXBvcnQgUmVzaXplTm90aWZpZXIgZnJvbSBcIi4uLy4uL3V0aWxzL1Jlc2l6ZU5vdGlmaWVyXCI7XG5pbXBvcnQgQXV0b0Rpc2NvdmVyeVV0aWxzLCB7IFZhbGlkYXRlZFNlcnZlckNvbmZpZyB9IGZyb20gXCIuLi8uLi91dGlscy9BdXRvRGlzY292ZXJ5VXRpbHNcIjtcbmltcG9ydCBETVJvb21NYXAgZnJvbSAnLi4vLi4vdXRpbHMvRE1Sb29tTWFwJztcbmltcG9ydCB7IGNvdW50Um9vbXNXaXRoTm90aWYgfSBmcm9tICcuLi8uLi9Sb29tTm90aWZzJztcbmltcG9ydCB7IFRoZW1lV2F0Y2hlciB9IGZyb20gXCIuLi8uLi90aGVtZVwiO1xuaW1wb3J0IHsgc3RvcmVSb29tQWxpYXNJbkNhY2hlIH0gZnJvbSAnLi4vLi4vUm9vbUFsaWFzQ2FjaGUnO1xuaW1wb3J0IHsgZGVmZXIsIElEZWZlcnJlZCB9IGZyb20gXCIuLi8uLi91dGlscy9wcm9taXNlXCI7XG5pbXBvcnQgVG9hc3RTdG9yZSBmcm9tIFwiLi4vLi4vc3RvcmVzL1RvYXN0U3RvcmVcIjtcbmltcG9ydCAqIGFzIFN0b3JhZ2VNYW5hZ2VyIGZyb20gXCIuLi8uLi91dGlscy9TdG9yYWdlTWFuYWdlclwiO1xuaW1wb3J0IHR5cGUgTG9nZ2VkSW5WaWV3VHlwZSBmcm9tIFwiLi9Mb2dnZWRJblZpZXdcIjtcbmltcG9ydCB7IFZpZXdVc2VyUGF5bG9hZCB9IGZyb20gXCIuLi8uLi9kaXNwYXRjaGVyL3BheWxvYWRzL1ZpZXdVc2VyUGF5bG9hZFwiO1xuaW1wb3J0IHsgQWN0aW9uIH0gZnJvbSBcIi4uLy4uL2Rpc3BhdGNoZXIvYWN0aW9uc1wiO1xuXG4vKiogY29uc3RhbnRzIGZvciBNYXRyaXhDaGF0LnN0YXRlLnZpZXcgKi9cbmV4cG9ydCBlbnVtIFZpZXdzIHtcbiAgICAvLyBhIHNwZWNpYWwgaW5pdGlhbCBzdGF0ZSB3aGljaCBpcyBvbmx5IHVzZWQgYXQgc3RhcnR1cCwgd2hpbGUgd2UgYXJlXG4gICAgLy8gdHJ5aW5nIHRvIHJlLWFuaW1hdGUgYSBtYXRyaXggY2xpZW50IG9yIHJlZ2lzdGVyIGFzIGEgZ3Vlc3QuXG4gICAgTE9BRElORyA9IDAsXG5cbiAgICAvLyB3ZSBhcmUgc2hvd2luZyB0aGUgd2VsY29tZSB2aWV3XG4gICAgV0VMQ09NRSA9IDEsXG5cbiAgICAvLyB3ZSBhcmUgc2hvd2luZyB0aGUgbG9naW4gdmlld1xuICAgIExPR0lOID0gMixcblxuICAgIC8vIHdlIGFyZSBzaG93aW5nIHRoZSByZWdpc3RyYXRpb24gdmlld1xuICAgIFJFR0lTVEVSID0gMyxcblxuICAgIC8vIGNvbXBsZXRpbmcgdGhlIHJlZ2lzdHJhdGlvbiBmbG93XG4gICAgUE9TVF9SRUdJU1RSQVRJT04gPSA0LFxuXG4gICAgLy8gc2hvd2luZyB0aGUgJ2ZvcmdvdCBwYXNzd29yZCcgdmlld1xuICAgIEZPUkdPVF9QQVNTV09SRCA9IDUsXG5cbiAgICAvLyBzaG93aW5nIGZsb3cgdG8gdHJ1c3QgdGhpcyBuZXcgZGV2aWNlIHdpdGggY3Jvc3Mtc2lnbmluZ1xuICAgIENPTVBMRVRFX1NFQ1VSSVRZID0gNixcblxuICAgIC8vIGZsb3cgdG8gc2V0dXAgU1NTUyAvIGNyb3NzLXNpZ25pbmcgb24gdGhpcyBhY2NvdW50XG4gICAgRTJFX1NFVFVQID0gNyxcblxuICAgIC8vIHdlIGFyZSBsb2dnZWQgaW4gd2l0aCBhbiBhY3RpdmUgbWF0cml4IGNsaWVudC5cbiAgICBMT0dHRURfSU4gPSA4LFxuXG4gICAgLy8gV2UgYXJlIGxvZ2dlZCBvdXQgKGludmFsaWQgdG9rZW4pIGJ1dCBoYXZlIG91ciBsb2NhbCBzdGF0ZSBhZ2Fpbi4gVGhlIHVzZXJcbiAgICAvLyBzaG91bGQgbG9nIGJhY2sgaW4gdG8gcmVoeWRyYXRlIHRoZSBjbGllbnQuXG4gICAgU09GVF9MT0dPVVQgPSA5LFxufVxuXG4vLyBBY3Rpb25zIHRoYXQgYXJlIHJlZGlyZWN0ZWQgdGhyb3VnaCB0aGUgb25ib2FyZGluZyBwcm9jZXNzIHByaW9yIHRvIGJlaW5nXG4vLyByZS1kaXNwYXRjaGVkLiBOT1RFOiBzb21lIGFjdGlvbnMgYXJlIG5vbi10cml2aWFsIGFuZCB3b3VsZCByZXF1aXJlXG4vLyByZS1mYWN0b3JpbmcgdG8gYmUgaW5jbHVkZWQgaW4gdGhpcyBsaXN0IGluIGZ1dHVyZS5cbmNvbnN0IE9OQk9BUkRJTkdfRkxPV19TVEFSVEVSUyA9IFtcbiAgICBBY3Rpb24uVmlld1VzZXJTZXR0aW5ncyxcbiAgICAndmlld19jcmVhdGVfY2hhdCcsXG4gICAgJ3ZpZXdfY3JlYXRlX3Jvb20nLFxuICAgICd2aWV3X2NyZWF0ZV9ncm91cCcsXG5dO1xuXG5pbnRlcmZhY2UgSVNjcmVlbiB7XG4gICAgc2NyZWVuOiBzdHJpbmc7XG4gICAgcGFyYW1zPzogb2JqZWN0O1xufVxuXG5pbnRlcmZhY2UgSVJvb21JbmZvIHtcbiAgICByb29tX2lkPzogc3RyaW5nO1xuICAgIHJvb21fYWxpYXM/OiBzdHJpbmc7XG4gICAgZXZlbnRfaWQ/OiBzdHJpbmc7XG5cbiAgICBhdXRvX2pvaW4/OiBib29sZWFuO1xuICAgIGhpZ2hsaWdodGVkPzogYm9vbGVhbjtcbiAgICB0aGlyZF9wYXJ0eV9pbnZpdGU/OiBvYmplY3Q7XG4gICAgb29iX2RhdGE/OiBvYmplY3Q7XG4gICAgdmlhX3NlcnZlcnM/OiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIElQcm9wcyB7IC8vIFRPRE8gdHlwZSB0aGluZ3MgYmV0dGVyXG4gICAgY29uZmlnOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHNlcnZlckNvbmZpZz86IFZhbGlkYXRlZFNlcnZlckNvbmZpZztcbiAgICBDb25mZXJlbmNlSGFuZGxlcj86IGFueTtcbiAgICBvbk5ld1NjcmVlbjogKHN0cmluZykgPT4gdm9pZDtcbiAgICBlbmFibGVHdWVzdD86IGJvb2xlYW47XG4gICAgLy8gdGhlIHF1ZXJ5UGFyYW1zIGV4dHJhY3RlZCBmcm9tIHRoZSBbcmVhbF0gcXVlcnktc3RyaW5nIG9mIHRoZSBVUklcbiAgICByZWFsUXVlcnlQYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIC8vIHRoZSBpbml0aWFsIHF1ZXJ5UGFyYW1zIGV4dHJhY3RlZCBmcm9tIHRoZSBoYXNoLWZyYWdtZW50IG9mIHRoZSBVUklcbiAgICBzdGFydGluZ0ZyYWdtZW50UXVlcnlQYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIC8vIGNhbGxlZCB3aGVuIHdlIGhhdmUgY29tcGxldGVkIGEgdG9rZW4gbG9naW5cbiAgICBvblRva2VuTG9naW5Db21wbGV0ZWQ/OiAoKSA9PiB2b2lkO1xuICAgIC8vIFJlcHJlc2VudHMgdGhlIHNjcmVlbiB0byBkaXNwbGF5IGFzIGEgcmVzdWx0IG9mIHBhcnNpbmcgdGhlIGluaXRpYWwgd2luZG93LmxvY2F0aW9uXG4gICAgaW5pdGlhbFNjcmVlbkFmdGVyTG9naW4/OiBJU2NyZWVuO1xuICAgIC8vIGRpc3BsYXluYW1lLCBpZiBhbnksIHRvIHNldCBvbiB0aGUgZGV2aWNlIHdoZW4gbG9nZ2luZyBpbi9yZWdpc3RlcmluZy5cbiAgICBkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWU/OiBzdHJpbmcsXG4gICAgLy8gQSBmdW5jdGlvbiB0aGF0IG1ha2VzIGEgcmVnaXN0cmF0aW9uIFVSTFxuICAgIG1ha2VSZWdpc3RyYXRpb25Vcmw6IChvYmplY3QpID0+IHN0cmluZyxcbn1cblxuaW50ZXJmYWNlIElTdGF0ZSB7XG4gICAgLy8gdGhlIG1hc3RlciB2aWV3IHdlIGFyZSBzaG93aW5nLlxuICAgIHZpZXc6IFZpZXdzO1xuICAgIC8vIFdoYXQgdGhlIExvZ2dlZEluVmlldyB3b3VsZCBiZSBzaG93aW5nIGlmIHZpc2libGVcbiAgICBwYWdlX3R5cGU/OiBQYWdlVHlwZXM7XG4gICAgLy8gVGhlIElEIG9mIHRoZSByb29tIHdlJ3JlIHZpZXdpbmcuIFRoaXMgaXMgZWl0aGVyIHBvcHVsYXRlZCBkaXJlY3RseVxuICAgIC8vIGluIHRoZSBjYXNlIHdoZXJlIHdlIHZpZXcgYSByb29tIGJ5IElEIG9yIGJ5IFJvb21WaWV3IHdoZW4gaXQgcmVzb2x2ZXNcbiAgICAvLyB3aGF0IElEIGFuIGFsaWFzIHBvaW50cyBhdC5cbiAgICBjdXJyZW50Um9vbUlkPzogc3RyaW5nO1xuICAgIGN1cnJlbnRHcm91cElkPzogc3RyaW5nO1xuICAgIGN1cnJlbnRHcm91cElzTmV3PzogYm9vbGVhbjtcbiAgICAvLyBJZiB3ZSdyZSB0cnlpbmcgdG8ganVzdCB2aWV3IGEgdXNlciBJRCAoaS5lLiAvdXNlciBVUkwpLCB0aGlzIGlzIGl0XG4gICAgY3VycmVudFVzZXJJZD86IHN0cmluZztcbiAgICAvLyB0aGlzIGlzIHBlcnNpc3RlZCBhcyBteF9saHNfc2l6ZSwgbG9hZGVkIGluIExvZ2dlZEluVmlld1xuICAgIGNvbGxhcHNlTGhzOiBib29sZWFuO1xuICAgIGxlZnREaXNhYmxlZDogYm9vbGVhbjtcbiAgICBtaWRkbGVEaXNhYmxlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgcmlnaHQgcGFuZWwncyBkaXNhYmxlZCBzdGF0ZSBpcyB0cmFja2VkIGluIGl0cyBzdG9yZS5cbiAgICB2ZXJzaW9uPzogc3RyaW5nO1xuICAgIG5ld1ZlcnNpb24/OiBzdHJpbmc7XG4gICAgaGFzTmV3VmVyc2lvbjogYm9vbGVhbjtcbiAgICBuZXdWZXJzaW9uUmVsZWFzZU5vdGVzPzogc3RyaW5nO1xuICAgIGNoZWNraW5nRm9yVXBkYXRlPzogc3RyaW5nOyAvLyB1cGRhdGVDaGVja1N0YXR1c0VudW1cbiAgICBzaG93Q29va2llQmFyOiBib29sZWFuO1xuICAgIC8vIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgcmVnaXN0cmF0aW9uIGRhbmNlIHdpdGggdGhlIElTXG4gICAgcmVnaXN0ZXJfY2xpZW50X3NlY3JldD86IHN0cmluZztcbiAgICByZWdpc3Rlcl9zZXNzaW9uX2lkPzogc3RyaW5nO1xuICAgIHJlZ2lzdGVyX2lkX3NpZD86IHN0cmluZztcbiAgICAvLyBXaGVuIHNob3dpbmcgTW9kYWwgZGlhbG9ncyB3ZSBuZWVkIHRvIHNldCBhcmlhLWhpZGRlbiBvbiB0aGUgcm9vdCBhcHAgZWxlbWVudFxuICAgIC8vIGFuZCBkaXNhYmxlIGl0IHdoZW4gdGhlcmUgYXJlIG5vIGRpYWxvZ3NcbiAgICBoaWRlVG9TUlVzZXJzOiBib29sZWFuO1xuICAgIHN5bmNFcnJvcj86IEVycm9yO1xuICAgIHJlc2l6ZU5vdGlmaWVyOiBSZXNpemVOb3RpZmllcjtcbiAgICBzaG93Tm90aWZpZXJUb29sYmFyOiBib29sZWFuO1xuICAgIHNlcnZlckNvbmZpZz86IFZhbGlkYXRlZFNlcnZlckNvbmZpZztcbiAgICByZWFkeTogYm9vbGVhbjtcbiAgICB0aGlyZFBhcnR5SW52aXRlPzogb2JqZWN0O1xuICAgIHJvb21Pb2JEYXRhPzogb2JqZWN0O1xuICAgIHZpYVNlcnZlcnM/OiBzdHJpbmdbXTtcbiAgICBwZW5kaW5nSW5pdGlhbFN5bmM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXRyaXhDaGF0IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudDxJUHJvcHMsIElTdGF0ZT4ge1xuICAgIHN0YXRpYyBkaXNwbGF5TmFtZSA9IFwiTWF0cml4Q2hhdFwiO1xuXG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgcmVhbFF1ZXJ5UGFyYW1zOiB7fSxcbiAgICAgICAgc3RhcnRpbmdGcmFnbWVudFF1ZXJ5UGFyYW1zOiB7fSxcbiAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgb25Ub2tlbkxvZ2luQ29tcGxldGVkOiAoKSA9PiB7fSxcbiAgICB9O1xuXG4gICAgZmlyc3RTeW5jQ29tcGxldGU6IGJvb2xlYW47XG4gICAgZmlyc3RTeW5jUHJvbWlzZTogSURlZmVycmVkPHZvaWQ+O1xuXG4gICAgcHJpdmF0ZSBzY3JlZW5BZnRlckxvZ2luPzogSVNjcmVlbjtcbiAgICBwcml2YXRlIHdpbmRvd1dpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBwYWdlQ2hhbmdpbmc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBhY2NvdW50UGFzc3dvcmQ/OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBhY2NvdW50UGFzc3dvcmRUaW1lcj86IE5vZGVKUy5UaW1lb3V0O1xuICAgIHByaXZhdGUgZm9jdXNDb21wb3NlcjogYm9vbGVhbjtcbiAgICBwcml2YXRlIHN1YlRpdGxlU3RhdHVzOiBzdHJpbmc7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlZEluVmlldzogUmVhY3QuUmVmT2JqZWN0PExvZ2dlZEluVmlld1R5cGU+O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzcGF0Y2hlclJlZjogYW55O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgdGhlbWVXYXRjaGVyOiBUaGVtZVdhdGNoZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCkge1xuICAgICAgICBzdXBlcihwcm9wcywgY29udGV4dCk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHZpZXc6IFZpZXdzLkxPQURJTkcsXG4gICAgICAgICAgICBjb2xsYXBzZUxoczogZmFsc2UsXG4gICAgICAgICAgICBsZWZ0RGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbWlkZGxlRGlzYWJsZWQ6IGZhbHNlLFxuXG4gICAgICAgICAgICBoYXNOZXdWZXJzaW9uOiBmYWxzZSxcbiAgICAgICAgICAgIG5ld1ZlcnNpb25SZWxlYXNlTm90ZXM6IG51bGwsXG4gICAgICAgICAgICBjaGVja2luZ0ZvclVwZGF0ZTogbnVsbCxcblxuICAgICAgICAgICAgc2hvd0Nvb2tpZUJhcjogZmFsc2UsXG5cbiAgICAgICAgICAgIGhpZGVUb1NSVXNlcnM6IGZhbHNlLFxuXG4gICAgICAgICAgICBzeW5jRXJyb3I6IG51bGwsIC8vIElmIHRoZSBjdXJyZW50IHN5bmNpbmcgc3RhdHVzIGlzIEVSUk9SLCB0aGUgZXJyb3Igb2JqZWN0LCBvdGhlcndpc2UgbnVsbC5cbiAgICAgICAgICAgIHJlc2l6ZU5vdGlmaWVyOiBuZXcgUmVzaXplTm90aWZpZXIoKSxcbiAgICAgICAgICAgIHNob3dOb3RpZmllclRvb2xiYXI6IGZhbHNlLFxuICAgICAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nZ2VkSW5WaWV3ID0gY3JlYXRlUmVmKCk7XG5cbiAgICAgICAgU2RrQ29uZmlnLnB1dCh0aGlzLnByb3BzLmNvbmZpZyk7XG5cbiAgICAgICAgLy8gVXNlZCBieSBfdmlld1Jvb20gYmVmb3JlIGdldHRpbmcgc3RhdGUgZnJvbSBzeW5jXG4gICAgICAgIHRoaXMuZmlyc3RTeW5jQ29tcGxldGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maXJzdFN5bmNQcm9taXNlID0gZGVmZXIoKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuc3luY190aW1lbGluZV9saW1pdCkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLm9wdHMuaW5pdGlhbFN5bmNMaW1pdCA9IHRoaXMucHJvcHMuY29uZmlnLnN5bmNfdGltZWxpbmVfbGltaXQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhIHRoaW5nIHRvIGNhbGwgc2hvd1NjcmVlbiB3aXRoIG9uY2UgbG9naW4gY29tcGxldGVzLiAgdGhpcyBpcyBrZXB0XG4gICAgICAgIC8vIG91dHNpZGUgdGhpcy5zdGF0ZSBiZWNhdXNlIHVwZGF0aW5nIGl0IHNob3VsZCBuZXZlciB0cmlnZ2VyIGFcbiAgICAgICAgLy8gcmVyZW5kZXIuXG4gICAgICAgIHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbiA9IHRoaXMucHJvcHMuaW5pdGlhbFNjcmVlbkFmdGVyTG9naW47XG5cbiAgICAgICAgdGhpcy53aW5kb3dXaWR0aCA9IDEwMDAwO1xuICAgICAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5oYW5kbGVSZXNpemUpO1xuXG4gICAgICAgIHRoaXMucGFnZUNoYW5naW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gY2hlY2sgd2UgaGF2ZSB0aGUgcmlnaHQgdGludCBhcHBsaWVkIGZvciB0aGlzIHRoZW1lLlxuICAgICAgICAvLyBOLkIuIHdlIGRvbid0IGNhbGwgdGhlIHdob2xlIG9mIHNldFRoZW1lKCkgaGVyZSBhcyB3ZSBtYXkgYmVcbiAgICAgICAgLy8gcmFjaW5nIHdpdGggdGhlIHRoZW1lIENTUyBkb3dubG9hZCBmaW5pc2hpbmcgZnJvbSBpbmRleC5qc1xuICAgICAgICBUaW50ZXIudGludCgpO1xuXG4gICAgICAgIC8vIEZvciBQZXJzaXN0ZW50RWxlbWVudFxuICAgICAgICB0aGlzLnN0YXRlLnJlc2l6ZU5vdGlmaWVyLm9uKFwibWlkZGxlUGFuZWxSZXNpemVkXCIsIHRoaXMuZGlzcGF0Y2hUaW1lbGluZVJlc2l6ZSk7XG5cbiAgICAgICAgLy8gRm9yY2UgdXNlcnMgdG8gZ28gdGhyb3VnaCB0aGUgc29mdCBsb2dvdXQgcGFnZSBpZiB0aGV5J3JlIHNvZnQgbG9nZ2VkIG91dFxuICAgICAgICBpZiAoTGlmZWN5Y2xlLmlzU29mdExvZ291dCgpKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBzZXNzaW9uIGxvYWRzIGl0J2xsIGJlIGRldGVjdGVkIGFzIHNvZnQgbG9nZ2VkIG91dCBhbmQgYSBkaXNwYXRjaFxuICAgICAgICAgICAgLy8gd2lsbCBiZSBzZW50IG91dCB0byBzYXkgdGhhdCwgdHJpZ2dlcmluZyB0aGlzIE1hdHJpeENoYXQgdG8gc2hvdyB0aGUgc29mdFxuICAgICAgICAgICAgLy8gbG9nb3V0IHBhZ2UuXG4gICAgICAgICAgICBMaWZlY3ljbGUubG9hZFNlc3Npb24oe30pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY2NvdW50UGFzc3dvcmQgPSBudWxsO1xuICAgICAgICB0aGlzLmFjY291bnRQYXNzd29yZFRpbWVyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgICAgIHRoaXMudGhlbWVXYXRjaGVyID0gbmV3IFRoZW1lV2F0Y2hlcigpO1xuICAgICAgICB0aGlzLnRoZW1lV2F0Y2hlci5zdGFydCgpO1xuXG4gICAgICAgIHRoaXMuZm9jdXNDb21wb3NlciA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG9iamVjdCBmaWVsZCB1c2VkIGZvciB0cmFja2luZyB0aGUgc3RhdHVzIGluZm8gYXBwZW5kZWQgdG8gdGhlIHRpdGxlIHRhZy5cbiAgICAgICAgLy8gd2UgZG9uJ3QgZG8gaXQgYXMgcmVhY3Qgc3RhdGUgYXMgaSdtIHNjYXJlZCBhYm91dCB0cmlnZ2VyaW5nIG5lZWRsZXNzIHJlYWN0IHJlZnJlc2hlcy5cbiAgICAgICAgdGhpcy5zdWJUaXRsZVN0YXR1cyA9ICcnO1xuXG4gICAgICAgIC8vIHRoaXMgY2FuIHRlY2huaWNhbGx5IGJlIGRvbmUgYW55d2hlcmUgYnV0IGRvaW5nIHRoaXMgaGVyZSBrZWVwcyBhbGxcbiAgICAgICAgLy8gdGhlIHJvdXRpbmcgdXJsIHBhdGggbG9naWMgdG9nZXRoZXIuXG4gICAgICAgIGlmICh0aGlzLm9uQWxpYXNDbGljaykge1xuICAgICAgICAgICAgbGlua2lmeU1hdHJpeC5vbkFsaWFzQ2xpY2sgPSB0aGlzLm9uQWxpYXNDbGljaztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vblVzZXJDbGljaykge1xuICAgICAgICAgICAgbGlua2lmeU1hdHJpeC5vblVzZXJDbGljayA9IHRoaXMub25Vc2VyQ2xpY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub25Hcm91cENsaWNrKSB7XG4gICAgICAgICAgICBsaW5raWZ5TWF0cml4Lm9uR3JvdXBDbGljayA9IHRoaXMub25Hcm91cENsaWNrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIGZpcnN0IHRoaW5nIHRvIGRvIGlzIHRvIHRyeSB0aGUgdG9rZW4gcGFyYW1zIGluIHRoZSBxdWVyeS1zdHJpbmdcbiAgICAgICAgLy8gaWYgdGhlIHNlc3Npb24gaXNuJ3Qgc29mdCBsb2dnZWQgb3V0IChpZTogaXMgYSBjbGVhbiBzZXNzaW9uIGJlaW5nIGxvZ2dlZCBpbilcbiAgICAgICAgaWYgKCFMaWZlY3ljbGUuaXNTb2Z0TG9nb3V0KCkpIHtcbiAgICAgICAgICAgIExpZmVjeWNsZS5hdHRlbXB0VG9rZW5Mb2dpbihcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnJlYWxRdWVyeVBhcmFtcyxcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICkudGhlbigobG9nZ2VkSW4pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vblRva2VuTG9naW5Db21wbGV0ZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBkbyBhbnl0aGluZyBlbHNlIHVudGlsIHRoZSBwYWdlIHJlbG9hZHMgLSBqdXN0IHN0YXkgaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlICdsb2FkaW5nJyBzdGF0ZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB1c2VyIGhhcyBmb2xsb3dlZCBhIGxvZ2luIG9yIHJlZ2lzdGVyIGxpbmssIGRvbid0IHJlYW5pbWF0ZVxuICAgICAgICAgICAgICAgIC8vIHRoZSBvbGQgY3JlZHMsIGJ1dCByYXRoZXIgZ28gc3RyYWlnaHQgdG8gdGhlIHJlbGV2YW50IHBhZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdFNjcmVlbiA9IHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbiA/IHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbi5zY3JlZW4gOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0U2NyZWVuID09PSAnbG9naW4nIHx8XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0U2NyZWVuID09PSAncmVnaXN0ZXInIHx8XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0U2NyZWVuID09PSAnZm9yZ290X3Bhc3N3b3JkJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dTY3JlZW5BZnRlckxvZ2luKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkU2Vzc2lvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dDb29raWVCYXJcIikpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHNob3dDb29raWVCYXI6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiYW5hbHl0aWNzT3B0SW5cIikpIHtcbiAgICAgICAgICAgIEFuYWx5dGljcy5lbmFibGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIHdpdGggYXBwcm9wcmlhdGUgbGlmZWN5Y2xlIHN0YWdlXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxVcGRhdGUocHJvcHMsIHN0YXRlKSB7XG4gICAgICAgIGlmICh0aGlzLnNob3VsZFRyYWNrUGFnZUNoYW5nZSh0aGlzLnN0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRQYWdlQ2hhbmdlVGltZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgICAgICBpZiAodGhpcy5zaG91bGRUcmFja1BhZ2VDaGFuZ2UocHJldlN0YXRlLCB0aGlzLnN0YXRlKSkge1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb25NcyA9IHRoaXMuc3RvcFBhZ2VDaGFuZ2VUaW1lcigpO1xuICAgICAgICAgICAgQW5hbHl0aWNzLnRyYWNrUGFnZUNoYW5nZShkdXJhdGlvbk1zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb2N1c0NvbXBvc2VyKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2ZvY3VzX2NvbXBvc2VyJ30pO1xuICAgICAgICAgICAgdGhpcy5mb2N1c0NvbXBvc2VyID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgTGlmZWN5Y2xlLnN0b3BNYXRyaXhDbGllbnQoKTtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICAgICAgdGhpcy50aGVtZVdhdGNoZXIuc3RvcCgpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5oYW5kbGVSZXNpemUpO1xuICAgICAgICB0aGlzLnN0YXRlLnJlc2l6ZU5vdGlmaWVyLnJlbW92ZUxpc3RlbmVyKFwibWlkZGxlUGFuZWxSZXNpemVkXCIsIHRoaXMuZGlzcGF0Y2hUaW1lbGluZVJlc2l6ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuYWNjb3VudFBhc3N3b3JkVGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dCh0aGlzLmFjY291bnRQYXNzd29yZFRpbWVyKTtcbiAgICB9XG5cbiAgICBnZXRGYWxsYmFja0hzVXJsKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcgJiYgdGhpcy5wcm9wcy5zZXJ2ZXJDb25maWcuaXNEZWZhdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5jb25maWcuZmFsbGJhY2tfaHNfdXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRTZXJ2ZXJQcm9wZXJ0aWVzKCkge1xuICAgICAgICBsZXQgcHJvcHMgPSB0aGlzLnN0YXRlLnNlcnZlckNvbmZpZztcbiAgICAgICAgaWYgKCFwcm9wcykgcHJvcHMgPSB0aGlzLnByb3BzLnNlcnZlckNvbmZpZzsgLy8gZm9yIHVuaXQgdGVzdHNcbiAgICAgICAgaWYgKCFwcm9wcykgcHJvcHMgPSBTZGtDb25maWcuZ2V0KClbXCJ2YWxpZGF0ZWRfc2VydmVyX2NvbmZpZ1wiXTtcbiAgICAgICAgcmV0dXJuIHtzZXJ2ZXJDb25maWc6IHByb3BzfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGxvYWRTZXNzaW9uKCkge1xuICAgICAgICAvLyB0aGUgZXh0cmEgUHJvbWlzZS5yZXNvbHZlKCkgZW5zdXJlcyB0aGF0IHN5bmNocm9ub3VzIGV4Y2VwdGlvbnMgaGl0IHRoZSBzYW1lIGNvZGVwYXRoIGFzXG4gICAgICAgIC8vIGFzeW5jaHJvbm91cyBvbmVzLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gTGlmZWN5Y2xlLmxvYWRTZXNzaW9uKHtcbiAgICAgICAgICAgICAgICBmcmFnbWVudFF1ZXJ5UGFyYW1zOiB0aGlzLnByb3BzLnN0YXJ0aW5nRnJhZ21lbnRRdWVyeVBhcmFtcyxcbiAgICAgICAgICAgICAgICBlbmFibGVHdWVzdDogdGhpcy5wcm9wcy5lbmFibGVHdWVzdCxcbiAgICAgICAgICAgICAgICBndWVzdEhzVXJsOiB0aGlzLmdldFNlcnZlclByb3BlcnRpZXMoKS5zZXJ2ZXJDb25maWcuaHNVcmwsXG4gICAgICAgICAgICAgICAgZ3Vlc3RJc1VybDogdGhpcy5nZXRTZXJ2ZXJQcm9wZXJ0aWVzKCkuc2VydmVyQ29uZmlnLmlzVXJsLFxuICAgICAgICAgICAgICAgIGRlZmF1bHREZXZpY2VEaXNwbGF5TmFtZTogdGhpcy5wcm9wcy5kZWZhdWx0RGV2aWNlRGlzcGxheU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigobG9hZGVkU2Vzc2lvbikgPT4ge1xuICAgICAgICAgICAgaWYgKCFsb2FkZWRTZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gZmFsbCBiYWNrIHRvIHNob3dpbmcgdGhlIHdlbGNvbWUgc2NyZWVuXG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246IFwidmlld193ZWxjb21lX3BhZ2VcIn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gTm90ZSB3ZSBkb24ndCBjYXRjaCBlcnJvcnMgZnJvbSB0aGlzOiB3ZSBjYXRjaCBldmVyeXRoaW5nIHdpdGhpblxuICAgICAgICAvLyBsb2FkU2Vzc2lvbiBhcyB0aGVyZSdzIGxvZ2ljIHRoZXJlIHRvIGFzayB0aGUgdXNlciBpZiB0aGV5IHdhbnRcbiAgICAgICAgLy8gdG8gdHJ5IGxvZ2dpbmcgb3V0LlxuICAgIH1cblxuICAgIHN0YXJ0UGFnZUNoYW5nZVRpbWVyKCkge1xuICAgICAgICAvLyBUb3IgZG9lc24ndCBzdXBwb3J0IHBlcmZvcm1hbmNlXG4gICAgICAgIGlmICghcGVyZm9ybWFuY2UgfHwgIXBlcmZvcm1hbmNlLm1hcmspIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIFRoaXMgc2hvdWxkbid0IGhhcHBlbiBiZWNhdXNlIFVOU0FGRV9jb21wb25lbnRXaWxsVXBkYXRlIGFuZCBjb21wb25lbnREaWRVcGRhdGVcbiAgICAgICAgLy8gYXJlIHVzZWQuXG4gICAgICAgIGlmICh0aGlzLnBhZ2VDaGFuZ2luZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdNYXRyaXhDaGF0LnN0YXJ0UGFnZUNoYW5nZVRpbWVyOiB0aW1lciBhbHJlYWR5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhZ2VDaGFuZ2luZyA9IHRydWU7XG4gICAgICAgIHBlcmZvcm1hbmNlLm1hcmsoJ3Jpb3RfTWF0cml4Q2hhdF9wYWdlX2NoYW5nZV9zdGFydCcpO1xuICAgIH1cblxuICAgIHN0b3BQYWdlQ2hhbmdlVGltZXIoKSB7XG4gICAgICAgIC8vIFRvciBkb2Vzbid0IHN1cHBvcnQgcGVyZm9ybWFuY2VcbiAgICAgICAgaWYgKCFwZXJmb3JtYW5jZSB8fCAhcGVyZm9ybWFuY2UubWFyaykgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBhZ2VDaGFuZ2luZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdNYXRyaXhDaGF0LnN0b3BQYWdlQ2hhbmdlVGltZXI6IHRpbWVyIG5vdCBzdGFydGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYWdlQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgICAgcGVyZm9ybWFuY2UubWFyaygncmlvdF9NYXRyaXhDaGF0X3BhZ2VfY2hhbmdlX3N0b3AnKTtcbiAgICAgICAgcGVyZm9ybWFuY2UubWVhc3VyZShcbiAgICAgICAgICAgICdyaW90X01hdHJpeENoYXRfcGFnZV9jaGFuZ2VfZGVsdGEnLFxuICAgICAgICAgICAgJ3Jpb3RfTWF0cml4Q2hhdF9wYWdlX2NoYW5nZV9zdGFydCcsXG4gICAgICAgICAgICAncmlvdF9NYXRyaXhDaGF0X3BhZ2VfY2hhbmdlX3N0b3AnLFxuICAgICAgICApO1xuICAgICAgICBwZXJmb3JtYW5jZS5jbGVhck1hcmtzKCdyaW90X01hdHJpeENoYXRfcGFnZV9jaGFuZ2Vfc3RhcnQnKTtcbiAgICAgICAgcGVyZm9ybWFuY2UuY2xlYXJNYXJrcygncmlvdF9NYXRyaXhDaGF0X3BhZ2VfY2hhbmdlX3N0b3AnKTtcbiAgICAgICAgY29uc3QgbWVhc3VyZW1lbnQgPSBwZXJmb3JtYW5jZS5nZXRFbnRyaWVzQnlOYW1lKCdyaW90X01hdHJpeENoYXRfcGFnZV9jaGFuZ2VfZGVsdGEnKS5wb3AoKTtcblxuICAgICAgICAvLyBJbiBwcmFjdGljZSwgc29tZXRpbWVzIHRoZSBlbnRyaWVzIGxpc3QgaXMgZW1wdHksIHNvIHdlIGdldCBubyBtZWFzdXJlbWVudFxuICAgICAgICBpZiAoIW1lYXN1cmVtZW50KSByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gbWVhc3VyZW1lbnQuZHVyYXRpb247XG4gICAgfVxuXG4gICAgc2hvdWxkVHJhY2tQYWdlQ2hhbmdlKHByZXZTdGF0ZTogSVN0YXRlLCBzdGF0ZTogSVN0YXRlKSB7XG4gICAgICAgIHJldHVybiBwcmV2U3RhdGUuY3VycmVudFJvb21JZCAhPT0gc3RhdGUuY3VycmVudFJvb21JZCB8fFxuICAgICAgICAgICAgcHJldlN0YXRlLnZpZXcgIT09IHN0YXRlLnZpZXcgfHxcbiAgICAgICAgICAgIHByZXZTdGF0ZS5wYWdlX3R5cGUgIT09IHN0YXRlLnBhZ2VfdHlwZTtcbiAgICB9XG5cbiAgICBzZXRTdGF0ZUZvck5ld1ZpZXcoc3RhdGU6IFBhcnRpYWw8SVN0YXRlPikge1xuICAgICAgICBpZiAoc3RhdGUudmlldyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzZXRTdGF0ZUZvck5ld1ZpZXcgd2l0aCBubyB2aWV3IVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHtcbiAgICAgICAgICAgIGN1cnJlbnRVc2VySWQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5hc3NpZ24obmV3U3RhdGUsIHN0YXRlKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gICAgfVxuXG4gICAgb25BY3Rpb24gPSAocGF5bG9hZCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgTWF0cml4Q2xpZW50UGVnLm9uQWN0aW9uOiAke3BheWxvYWQuYWN0aW9ufWApO1xuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBvbmJvYXJkaW5nIHByb2Nlc3MgZm9yIGNlcnRhaW4gYWN0aW9uc1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpICYmIE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkgJiZcbiAgICAgICAgICAgIE9OQk9BUkRJTkdfRkxPV19TVEFSVEVSUy5pbmNsdWRlcyhwYXlsb2FkLmFjdGlvbilcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHdpbGwgY2F1c2UgYHBheWxvYWRgIHRvIGJlIGRpc3BhdGNoZWQgbGF0ZXIsIG9uY2UgYVxuICAgICAgICAgICAgLy8gc3luYyBoYXMgcmVhY2hlZCB0aGUgXCJwcmVwYXJlZFwiIHN0YXRlLiBTZXR0aW5nIGEgbWF0cml4IElEXG4gICAgICAgICAgICAvLyB3aWxsIGNhdXNlIGEgZnVsbCBsb2dpbiBhbmQgc3luYyBhbmQgZmluYWxseSB0aGUgZGVmZXJyZWRcbiAgICAgICAgICAgIC8vIGFjdGlvbiB3aWxsIGJlIGRpc3BhdGNoZWQuXG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2RvX2FmdGVyX3N5bmNfcHJlcGFyZWQnLFxuICAgICAgICAgICAgICAgIGRlZmVycmVkX2FjdGlvbjogcGF5bG9hZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdyZXF1aXJlX3JlZ2lzdHJhdGlvbid9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ01hdHJpeEFjdGlvbnMuYWNjb3VudERhdGEnOlxuICAgICAgICAgICAgICAgIC8vIFhYWDogVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2Ygc2V2ZXJhbCBoYWNrcyB0byBzb2x2ZSBhIG1pbm9yIHByb2JsZW0uIFdlIHdhbnQgdG9cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgb3VyIGxvY2FsIHN0YXRlIHdoZW4gdGhlIElEIHNlcnZlciBjaGFuZ2VzLCBidXQgZG9uJ3Qgd2FudCB0byBwdXQgdGhhdCBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSBqcy1zZGsgYXMgd2UnZCBiZSB0aGVuIGRpY3RhdGluZyBob3cgYWxsIGNvbnN1bWVycyBuZWVkIHRvIGJlaGF2ZS4gSG93ZXZlcixcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGNvbXBvbmVudCBpcyBhbHJlYWR5IGJsb2F0ZWQgYW5kIHdlIHByb2JhYmx5IGRvbid0IHdhbnQgdGhpcyB0aW55IGxvZ2ljIGluXG4gICAgICAgICAgICAgICAgLy8gaGVyZSwgYnV0IHRoZXJlJ3Mgbm8gYmV0dGVyIHBsYWNlIGluIHRoZSByZWFjdC1zZGsgZm9yIGl0LiBBZGRpdGlvbmFsbHksIHdlJ3JlXG4gICAgICAgICAgICAgICAgLy8gYWJ1c2luZyB0aGUgTWF0cml4QWN0aW9uQ3JlYXRvciBzdHVmZiB0byBhdm9pZCBlcnJvcnMgb24gZGlzcGF0Y2hlcy5cbiAgICAgICAgICAgICAgICBpZiAocGF5bG9hZC5ldmVudF90eXBlID09PSAnbS5pZGVudGl0eV9zZXJ2ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxVcmwgPSBwYXlsb2FkLmV2ZW50X2NvbnRlbnQgPyBwYXlsb2FkLmV2ZW50X2NvbnRlbnRbJ2Jhc2VfdXJsJ10gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZ1bGxVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRJZGVudGl0eVNlcnZlclVybChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwibXhfaXNfYWNjZXNzX3Rva2VuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oXCJteF9pc191cmxcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2V0SWRlbnRpdHlTZXJ2ZXJVcmwoZnVsbFVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcIm14X2lzX2FjY2Vzc190b2tlblwiKTsgLy8gY2xlYXIgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfaXNfdXJsXCIsIGZ1bGxVcmwpOyAvLyBYWFg6IERvIHdlIHN0aWxsIG5lZWQgdGhpcz9cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZGlzcGF0Y2ggdGhlIGNoYW5nZSB3aXRoIGEgbW9yZSBzcGVjaWZpYyBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdpZF9zZXJ2ZXJfY2hhbmdlZCd9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsb2dvdXQnOlxuICAgICAgICAgICAgICAgIExpZmVjeWNsZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JlcXVpcmVfcmVnaXN0cmF0aW9uJzpcbiAgICAgICAgICAgICAgICBzdGFydEFueVJlZ2lzdHJhdGlvbkZsb3cocGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzdGFydF9yZWdpc3RyYXRpb24nOlxuICAgICAgICAgICAgICAgIGlmIChMaWZlY3ljbGUuaXNTb2Z0TG9nb3V0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblNvZnRMb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFRoaXMgc3RhcnRzIHRoZSBmdWxsIHJlZ2lzdHJhdGlvbiBmbG93XG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuc2NyZWVuQWZ0ZXJMb2dpbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcmVlbkFmdGVyTG9naW4gPSBwYXlsb2FkLnNjcmVlbkFmdGVyTG9naW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRSZWdpc3RyYXRpb24ocGF5bG9hZC5wYXJhbXMgfHwge30pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RhcnRfbG9naW4nOlxuICAgICAgICAgICAgICAgIGlmIChMaWZlY3ljbGUuaXNTb2Z0TG9nb3V0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblNvZnRMb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLnNjcmVlbkFmdGVyTG9naW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JlZW5BZnRlckxvZ2luID0gcGF5bG9hZC5zY3JlZW5BZnRlckxvZ2luO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlRm9yTmV3Vmlldyh7XG4gICAgICAgICAgICAgICAgICAgIHZpZXc6IFZpZXdzLkxPR0lOLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5TmV3U2NyZWVuKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIFRoZW1lQ29udHJvbGxlci5pc0xvZ2luID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnRoZW1lV2F0Y2hlci5yZWNoZWNrKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzdGFydF9wb3N0X3JlZ2lzdHJhdGlvbic6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHZpZXc6IFZpZXdzLlBPU1RfUkVHSVNUUkFUSU9OLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RhcnRfcGFzc3dvcmRfcmVjb3ZlcnknOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgdmlldzogVmlld3MuRk9SR09UX1BBU1NXT1JELFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5TmV3U2NyZWVuKCdmb3Jnb3RfcGFzc3dvcmQnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N0YXJ0X2NoYXQnOlxuICAgICAgICAgICAgICAgIGNyZWF0ZVJvb20oe1xuICAgICAgICAgICAgICAgICAgICBkbVVzZXJJZDogcGF5bG9hZC51c2VyX2lkLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbGVhdmVfcm9vbSc6XG4gICAgICAgICAgICAgICAgdGhpcy5sZWF2ZVJvb20ocGF5bG9hZC5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JlamVjdF9pbnZpdGUnOlxuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlamVjdCBpbnZpdGF0aW9uJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnUmVqZWN0IGludml0YXRpb24nKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcmVqZWN0IHRoZSBpbnZpdGF0aW9uPycpLFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiAoY29uZmlybSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTogY29udHJvbGxlciBzaG91bGRuJ3QgYmUgbG9hZGluZyBhIHZpZXcgOihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RhbCA9IE1vZGFsLmNyZWF0ZURpYWxvZyhMb2FkZXIsIG51bGwsICdteF9EaWFsb2dfc3Bpbm5lcicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmxlYXZlKHBheWxvYWQucm9vbV9pZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWQgPT09IHBheWxvYWQucm9vbV9pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd2aWV3X25leHRfcm9vbSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHJlamVjdCBpbnZpdGF0aW9uJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byByZWplY3QgaW52aXRhdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfdXNlcl9pbmZvJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdVc2VyKHBheWxvYWQudXNlcklkLCBwYXlsb2FkLnN1YkFjdGlvbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X3Jvb20nOiB7XG4gICAgICAgICAgICAgICAgLy8gVGFrZXMgZWl0aGVyIGEgcm9vbSBJRCBvciByb29tIGFsaWFzOiBpZiBzd2l0Y2hpbmcgdG8gYSByb29tIHRoZSBjbGllbnQgaXMgYWxyZWFkeVxuICAgICAgICAgICAgICAgIC8vIGtub3duIHRvIGJlIGluIChlZy4gdXNlciBjbGlja3Mgb24gYSByb29tIGluIHRoZSByZWNlbnRzIHBhbmVsKSwgc3VwcGx5IHRoZSBJRFxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIGNsaWNraW5nIG9uIGEgcm9vbSBpbiB0aGUgY29udGV4dCBvZiB0aGUgYWxpYXMgYmVpbmcgcHJlc2VudGVkXG4gICAgICAgICAgICAgICAgLy8gdG8gdGhlbSwgc3VwcGx5IHRoZSByb29tIGFsaWFzLiBJZiBib3RoIGFyZSBzdXBwbGllZCwgdGhlIHJvb20gSUQgd2lsbCBiZSBpZ25vcmVkLlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLnZpZXdSb29tKHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmRlZmVycmVkX2FjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHBheWxvYWQuZGVmZXJyZWRfYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAndmlld19wcmV2X3Jvb20nOlxuICAgICAgICAgICAgICAgIHRoaXMudmlld05leHRSb29tKC0xKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfbmV4dF9yb29tJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdOZXh0Um9vbSgxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfaW5kZXhlZF9yb29tJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdJbmRleGVkUm9vbShwYXlsb2FkLnJvb21JbmRleCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFjdGlvbi5WaWV3VXNlclNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgVXNlclNldHRpbmdzRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuVXNlclNldHRpbmdzRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1VzZXIgc2V0dGluZ3MnLCAnJywgVXNlclNldHRpbmdzRGlhbG9nLCB7fSxcbiAgICAgICAgICAgICAgICAgICAgLypjbGFzc05hbWU9Ki9udWxsLCAvKmlzUHJpb3JpdHk9Ki9mYWxzZSwgLyppc1N0YXRpYz0qL3RydWUpO1xuXG4gICAgICAgICAgICAgICAgLy8gVmlldyB0aGUgd2VsY29tZSBvciBob21lIHBhZ2UgaWYgd2UgbmVlZCBzb21ldGhpbmcgdG8gbG9vayBhdFxuICAgICAgICAgICAgICAgIHRoaXMudmlld1NvbWV0aGluZ0JlaGluZE1vZGFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICd2aWV3X2NyZWF0ZV9yb29tJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJvb20ocGF5bG9hZC5wdWJsaWMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlld19jcmVhdGVfZ3JvdXAnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgQ3JlYXRlR3JvdXBEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5DcmVhdGVHcm91cERpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdDcmVhdGUgQ29tbXVuaXR5JywgJycsIENyZWF0ZUdyb3VwRGlhbG9nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfcm9vbV9kaXJlY3RvcnknOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgUm9vbURpcmVjdG9yeSA9IHNkay5nZXRDb21wb25lbnQoXCJzdHJ1Y3R1cmVzLlJvb21EaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnUm9vbSBkaXJlY3RvcnknLCAnJywgUm9vbURpcmVjdG9yeSwge30sXG4gICAgICAgICAgICAgICAgICAgICdteF9Sb29tRGlyZWN0b3J5X2RpYWxvZ1dyYXBwZXInLCBmYWxzZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBWaWV3IHRoZSB3ZWxjb21lIG9yIGhvbWUgcGFnZSBpZiB3ZSBuZWVkIHNvbWV0aGluZyB0byBsb29rIGF0XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3U29tZXRoaW5nQmVoaW5kTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfbXlfZ3JvdXBzJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFBhZ2UoUGFnZVR5cGVzLk15R3JvdXBzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeU5ld1NjcmVlbignZ3JvdXBzJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X2dyb3VwJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdHcm91cChwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfd2VsY29tZV9wYWdlJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdXZWxjb21lKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X2hvbWVfcGFnZSc6XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3SG9tZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlld19zZXRfbXhpZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRNeElkKHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlld19zdGFydF9jaGF0X29yX3JldXNlJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNoYXRDcmVhdGVPclJldXNlKHBheWxvYWQudXNlcl9pZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X2NyZWF0ZV9jaGF0JzpcbiAgICAgICAgICAgICAgICBzaG93U3RhcnRDaGF0SW52aXRlRGlhbG9nKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X2ludml0ZSc6XG4gICAgICAgICAgICAgICAgc2hvd1Jvb21JbnZpdGVEaWFsb2cocGF5bG9hZC5yb29tSWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlld19sYXN0X3NjcmVlbic6XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBkb2VzIHdoYXQgd2Ugd2FudCwgZGVzcGl0ZSB0aGUgbmFtZS4gVGhlIGlkZWEgaXMgdGhhdCBpdCBzaG93c1xuICAgICAgICAgICAgICAgIC8vIHRoZSBsYXN0IHJvb20gd2Ugd2VyZSBsb29raW5nIGF0IG9yIHNvbWUgcmVhc29uYWJsZSBkZWZhdWx0L2d1ZXNzLiBXZSBkb24ndFxuICAgICAgICAgICAgICAgIC8vIGhhdmUgdG8gd29ycnkgYWJvdXQgZW1haWwgaW52aXRlcyBvciBzaW1pbGFyIGJlaW5nIHJlLXRyaWdnZXJlZCBiZWNhdXNlIHRoZVxuICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9uIHdpbGwgaGF2ZSBjbGVhcmVkIHRoYXQgc3RhdGUgYW5kIG5vdCBleGVjdXRlIHRoYXQgcGF0aC5cbiAgICAgICAgICAgICAgICB0aGlzLnNob3dTY3JlZW5BZnRlckxvZ2luKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0b2dnbGVfbXlfZ3JvdXBzJzpcbiAgICAgICAgICAgICAgICAvLyBXZSBqdXN0IGRpc3BhdGNoIHRoZSBwYWdlIGNoYW5nZSByYXRoZXIgdGhhbiBoYXZlIHRvIHdvcnJ5IGFib3V0XG4gICAgICAgICAgICAgICAgLy8gd2hhdCB0aGUgbG9naWMgaXMgZm9yIGVhY2ggb2YgdGhlc2UgYnJhbmNoZXMuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucGFnZV90eXBlID09PSBQYWdlVHlwZXMuTXlHcm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd2aWV3X2xhc3Rfc2NyZWVuJ30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld19teV9ncm91cHMnfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbm90aWZpZXJfZW5hYmxlZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd05vdGlmaWVyVG9vbGJhcjogTm90aWZpZXIuc2hvdWxkU2hvd1Rvb2xiYXIoKX0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaGlkZV9sZWZ0X3BhbmVsJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGFwc2VMaHM6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdmb2N1c19yb29tX2ZpbHRlcic6IC8vIGZvciBDdHJsT3JDbWQrSyB0byB3b3JrIGJ5IGV4cGFuZGluZyB0aGUgbGVmdCBwYW5lbCBmaXJzdFxuICAgICAgICAgICAgY2FzZSAnc2hvd19sZWZ0X3BhbmVsJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGFwc2VMaHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGFuZWxfZGlzYWJsZSc6IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdERpc2FibGVkOiBwYXlsb2FkLmxlZnREaXNhYmxlZCB8fCBwYXlsb2FkLnNpZGVEaXNhYmxlZCB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWlkZGxlRGlzYWJsZWQ6IHBheWxvYWQubWlkZGxlRGlzYWJsZWQgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IHRyYWNrIHRoZSByaWdodCBwYW5lbCBiZWluZyBkaXNhYmxlZCBoZXJlIC0gaXQncyB0cmFja2VkIGluIHRoZSBzdG9yZS5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ29uX2xvZ2dlZF9pbic6XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAhTGlmZWN5Y2xlLmlzU29mdExvZ291dCgpICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUudmlldyAhPT0gVmlld3MuTE9HSU4gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS52aWV3ICE9PSBWaWV3cy5SRUdJU1RFUiAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnZpZXcgIT09IFZpZXdzLkNPTVBMRVRFX1NFQ1VSSVRZICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUudmlldyAhPT0gVmlld3MuRTJFX1NFVFVQXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Mb2dnZWRJbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uX2NsaWVudF9ub3RfdmlhYmxlJzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uU29mdExvZ291dCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25fbG9nZ2VkX291dCc6XG4gICAgICAgICAgICAgICAgdGhpcy5vbkxvZ2dlZE91dCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnd2lsbF9zdGFydF9jbGllbnQnOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3JlYWR5OiBmYWxzZX0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGNsaWVudCBpcyBhYm91dCB0byBzdGFydCwgd2UgYXJlLCBieSBkZWZpbml0aW9uLCBub3QgcmVhZHkuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCByZWFkeSB0byBmYWxzZSBub3csIHRoZW4gaXQnbGwgYmUgc2V0IHRvIHRydWUgd2hlbiB0aGUgc3luY1xuICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5lciB3ZSBzZXQgYmVsb3cgZmlyZXMuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25XaWxsU3RhcnRDbGllbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NsaWVudF9zdGFydGVkJzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xpZW50U3RhcnRlZCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbmV3X3ZlcnNpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMub25WZXJzaW9uKFxuICAgICAgICAgICAgICAgICAgICBwYXlsb2FkLmN1cnJlbnRWZXJzaW9uLCBwYXlsb2FkLm5ld1ZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWQucmVsZWFzZU5vdGVzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGVja191cGRhdGVzJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgY2hlY2tpbmdGb3JVcGRhdGU6IHBheWxvYWQudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZW5kX2V2ZW50JzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2VuZEV2ZW50KHBheWxvYWQucm9vbV9pZCwgcGF5bG9hZC5ldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhcmlhX2hpZGVfbWFpbl9hcHAnOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWRlVG9TUlVzZXJzOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYXJpYV91bmhpZGVfbWFpbl9hcHAnOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWRlVG9TUlVzZXJzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2FjY2VwdF9jb29raWVzJzpcbiAgICAgICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiYW5hbHl0aWNzT3B0SW5cIiwgbnVsbCwgU2V0dGluZ0xldmVsLkRFVklDRSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgU2V0dGluZ3NTdG9yZS5zZXRWYWx1ZShcInNob3dDb29raWVCYXJcIiwgbnVsbCwgU2V0dGluZ0xldmVsLkRFVklDRSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHNob3dDb29raWVCYXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIEFuYWx5dGljcy5lbmFibGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JlamVjdF9jb29raWVzJzpcbiAgICAgICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiYW5hbHl0aWNzT3B0SW5cIiwgbnVsbCwgU2V0dGluZ0xldmVsLkRFVklDRSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJzaG93Q29va2llQmFyXCIsIG51bGwsIFNldHRpbmdMZXZlbC5ERVZJQ0UsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzaG93Q29va2llQmFyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcml2YXRlIHNldFBhZ2UocGFnZVR5cGU6IHN0cmluZykge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhZ2VfdHlwZTogcGFnZVR5cGUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc3RhcnRSZWdpc3RyYXRpb24ocGFyYW1zOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSkge1xuICAgICAgICBjb25zdCBuZXdTdGF0ZTogUGFydGlhbDxJU3RhdGU+ID0ge1xuICAgICAgICAgICAgdmlldzogVmlld3MuUkVHSVNURVIsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gT25seSBob25vdXIgcGFyYW1zIGlmIHRoZXkgYXJlIGFsbCBwcmVzZW50LCBvdGhlcndpc2Ugd2UgcmVzZXRcbiAgICAgICAgLy8gSFMgYW5kIElTIFVSTHMgd2hlbiBzd2l0Y2hpbmcgdG8gcmVnaXN0cmF0aW9uLlxuICAgICAgICBpZiAocGFyYW1zLmNsaWVudF9zZWNyZXQgJiZcbiAgICAgICAgICAgIHBhcmFtcy5zZXNzaW9uX2lkICYmXG4gICAgICAgICAgICBwYXJhbXMuaHNfdXJsICYmXG4gICAgICAgICAgICBwYXJhbXMuaXNfdXJsICYmXG4gICAgICAgICAgICBwYXJhbXMuc2lkXG4gICAgICAgICkge1xuICAgICAgICAgICAgbmV3U3RhdGUuc2VydmVyQ29uZmlnID0gYXdhaXQgQXV0b0Rpc2NvdmVyeVV0aWxzLnZhbGlkYXRlU2VydmVyQ29uZmlnV2l0aFN0YXRpY1VybHMoXG4gICAgICAgICAgICAgICAgcGFyYW1zLmhzX3VybCwgcGFyYW1zLmlzX3VybCxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIG5ld1N0YXRlLnJlZ2lzdGVyX2NsaWVudF9zZWNyZXQgPSBwYXJhbXMuY2xpZW50X3NlY3JldDtcbiAgICAgICAgICAgIG5ld1N0YXRlLnJlZ2lzdGVyX3Nlc3Npb25faWQgPSBwYXJhbXMuc2Vzc2lvbl9pZDtcbiAgICAgICAgICAgIG5ld1N0YXRlLnJlZ2lzdGVyX2lkX3NpZCA9IHBhcmFtcy5zaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlRm9yTmV3VmlldyhuZXdTdGF0ZSk7XG4gICAgICAgIFRoZW1lQ29udHJvbGxlci5pc0xvZ2luID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aGVtZVdhdGNoZXIucmVjaGVjaygpO1xuICAgICAgICB0aGlzLm5vdGlmeU5ld1NjcmVlbigncmVnaXN0ZXInKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBNb3ZlIHRvIFJvb21WaWV3U3RvcmVcbiAgICBwcml2YXRlIHZpZXdOZXh0Um9vbShyb29tSW5kZXhEZWx0YTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGFsbFJvb21zID0gUm9vbUxpc3RTb3J0ZXIubW9zdFJlY2VudEFjdGl2aXR5Rmlyc3QoXG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbXMoKSxcbiAgICAgICAgKTtcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIDAgcm9vbXMgb3IgMSByb29tLCB2aWV3IHRoZSBob21lIHBhZ2UgYmVjYXVzZSBvdGhlcndpc2VcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIDAsIHdlIGVuZCB1cCB0cnlpbmcgdG8gaW5kZXggaW50byBhbiBlbXB0eSBhcnJheSwgYW5kXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIDEsIHdlIGVuZCB1cCB2aWV3aW5nIHRoZSBzYW1lIHJvb20uXG4gICAgICAgIGlmIChhbGxSb29tcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfaG9tZV9wYWdlJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCByb29tSW5kZXggPSAtMTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxSb29tcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGFsbFJvb21zW2ldLnJvb21JZCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Um9vbUlkKSB7XG4gICAgICAgICAgICAgICAgcm9vbUluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByb29tSW5kZXggPSAocm9vbUluZGV4ICsgcm9vbUluZGV4RGVsdGEpICUgYWxsUm9vbXMubGVuZ3RoO1xuICAgICAgICBpZiAocm9vbUluZGV4IDwgMCkgcm9vbUluZGV4ID0gYWxsUm9vbXMubGVuZ3RoIC0gMTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICByb29tX2lkOiBhbGxSb29tc1tyb29tSW5kZXhdLnJvb21JZCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogTW92ZSB0byBSb29tVmlld1N0b3JlXG4gICAgcHJpdmF0ZSB2aWV3SW5kZXhlZFJvb20ocm9vbUluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgYWxsUm9vbXMgPSBSb29tTGlzdFNvcnRlci5tb3N0UmVjZW50QWN0aXZpdHlGaXJzdChcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tcygpLFxuICAgICAgICApO1xuICAgICAgICBpZiAoYWxsUm9vbXNbcm9vbUluZGV4XSkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IGFsbFJvb21zW3Jvb21JbmRleF0ucm9vbUlkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzd2l0Y2ggdmlldyB0byB0aGUgZ2l2ZW4gcm9vbVxuICAgIC8vXG4gICAgLy8gQHBhcmFtIHtPYmplY3R9IHJvb21JbmZvIE9iamVjdCBjb250YWluaW5nIGRhdGEgYWJvdXQgdGhlIHJvb20gdG8gYmUgam9pbmVkXG4gICAgLy8gQHBhcmFtIHtzdHJpbmc9fSByb29tSW5mby5yb29tX2lkIElEIG9mIHRoZSByb29tIHRvIGpvaW4uIE9uZSBvZiByb29tX2lkIG9yIHJvb21fYWxpYXMgbXVzdCBiZSBnaXZlbi5cbiAgICAvLyBAcGFyYW0ge3N0cmluZz19IHJvb21JbmZvLnJvb21fYWxpYXMgQWxpYXMgb2YgdGhlIHJvb20gdG8gam9pbi4gT25lIG9mIHJvb21faWQgb3Igcm9vbV9hbGlhcyBtdXN0IGJlIGdpdmVuLlxuICAgIC8vIEBwYXJhbSB7Ym9vbGVhbj19IHJvb21JbmZvLmF1dG9fam9pbiBJZiB0cnVlLCBhdXRvbWF0aWNhbGx5IGF0dGVtcHQgdG8gam9pbiB0aGUgcm9vbSBpZiBub3QgYWxyZWFkeSBhIG1lbWJlci5cbiAgICAvLyBAcGFyYW0ge3N0cmluZz19IHJvb21JbmZvLmV2ZW50X2lkIElEIG9mIHRoZSBldmVudCBpbiB0aGlzIHJvb20gdG8gc2hvdzogdGhpcyB3aWxsIGNhdXNlIGEgc3dpdGNoIHRvIHRoZVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCBvZiB0aGF0IHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgLy8gQHBhcmFtIHtib29sZWFuPX0gcm9vbUluZm8uaGlnaGxpZ2h0ZWQgSWYgdHJ1ZSwgYWRkIGV2ZW50X2lkIHRvIHRoZSBoYXNoIG9mIHRoZSBVUkxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgYWx0ZXIgdGhlIEV2ZW50VGlsZSB0byBhcHBlYXIgaGlnaGxpZ2h0ZWQuXG4gICAgLy8gQHBhcmFtIHtPYmplY3Q9fSByb29tSW5mby50aGlyZF9wYXJ0eV9pbnZpdGUgT2JqZWN0IGNvbnRhaW5pbmcgZGF0YSBhYm91dCB0aGUgdGhpcmQgcGFydHlcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlIHJlY2VpdmVkIHRvIGpvaW4gdGhlIHJvb20sIGlmIGFueS5cbiAgICAvLyBAcGFyYW0ge3N0cmluZz19IHJvb21JbmZvLnRoaXJkX3BhcnR5X2ludml0ZS5pbnZpdGVTaWduVXJsIDNwaWQgaW52aXRlIHNpZ24gVVJMXG4gICAgLy8gQHBhcmFtIHtzdHJpbmc9fSByb29tSW5mby50aGlyZF9wYXJ0eV9pbnZpdGUuaW52aXRlZEVtYWlsIFRoZSBlbWFpbCBhZGRyZXNzIHRoZSBpbnZpdGUgd2FzIHNlbnQgdG9cbiAgICAvLyBAcGFyYW0ge09iamVjdD19IHJvb21JbmZvLm9vYl9kYXRhIE9iamVjdCBvZiBhZGRpdGlvbmFsIGRhdGEgYWJvdXQgdGhlIHJvb21cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0IGhhcyBiZWVuIHBhc3NlZCBvdXQtb2YtYmFuZCAoZWcuXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbSBuYW1lIGFuZCBhdmF0YXIgZnJvbSBhbiBpbnZpdGUgZW1haWwpXG4gICAgcHJpdmF0ZSB2aWV3Um9vbShyb29tSW5mbzogSVJvb21JbmZvKSB7XG4gICAgICAgIHRoaXMuZm9jdXNDb21wb3NlciA9IHRydWU7XG5cbiAgICAgICAgaWYgKHJvb21JbmZvLnJvb21fYWxpYXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIGBTd2l0Y2hpbmcgdG8gcm9vbSBhbGlhcyAke3Jvb21JbmZvLnJvb21fYWxpYXN9IGF0IGV2ZW50IGAgK1xuICAgICAgICAgICAgICAgIHJvb21JbmZvLmV2ZW50X2lkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTd2l0Y2hpbmcgdG8gcm9vbSBpZCAke3Jvb21JbmZvLnJvb21faWR9IGF0IGV2ZW50IGAgK1xuICAgICAgICAgICAgICAgIHJvb21JbmZvLmV2ZW50X2lkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBmaXJzdCBzeW5jIHRvIGNvbXBsZXRlIHNvIHRoYXQgaWYgYSByb29tIGRvZXMgaGF2ZSBhbiBhbGlhcyxcbiAgICAgICAgLy8gaXQgd291bGQgaGF2ZSBiZWVuIHJldHJpZXZlZC5cbiAgICAgICAgbGV0IHdhaXRGb3IgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIGlmICghdGhpcy5maXJzdFN5bmNDb21wbGV0ZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmZpcnN0U3luY1Byb21pc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0Nhbm5vdCB2aWV3IGEgcm9vbSBiZWZvcmUgZmlyc3Qgc3luYy4gcm9vbV9pZDonLCByb29tSW5mby5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3YWl0Rm9yID0gdGhpcy5maXJzdFN5bmNQcm9taXNlLnByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2FpdEZvci50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBwcmVzZW50ZWRJZCA9IHJvb21JbmZvLnJvb21fYWxpYXMgfHwgcm9vbUluZm8ucm9vbV9pZDtcbiAgICAgICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShyb29tSW5mby5yb29tX2lkKTtcbiAgICAgICAgICAgIGlmIChyb29tKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGhlQWxpYXMgPSBSb29tcy5nZXREaXNwbGF5QWxpYXNGb3JSb29tKHJvb20pO1xuICAgICAgICAgICAgICAgIGlmICh0aGVBbGlhcykge1xuICAgICAgICAgICAgICAgICAgICBwcmVzZW50ZWRJZCA9IHRoZUFsaWFzO1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSBkaXNwbGF5IGFsaWFzIG9mIHRoZSBwcmVzZW50ZWQgcm9vbSBpbiBjYWNoZSB0byBzcGVlZCBmdXR1cmVcbiAgICAgICAgICAgICAgICAgICAgLy8gbmF2aWdhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgc3RvcmVSb29tQWxpYXNJbkNhY2hlKHRoZUFsaWFzLCByb29tLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhpcyBhcyB0aGUgSUQgb2YgdGhlIGxhc3Qgcm9vbSBhY2Nlc3NlZC4gVGhpcyBpcyBzbyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgICAgIC8vIHBlcnNpc3Qgd2hpY2ggcm9vbSBpcyBiZWluZyBzdG9yZWQgYWNyb3NzIHJlZnJlc2hlcyBhbmQgYnJvd3NlciBxdWl0cy5cbiAgICAgICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdteF9sYXN0X3Jvb21faWQnLCByb29tLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm9vbUluZm8uZXZlbnRfaWQgJiYgcm9vbUluZm8uaGlnaGxpZ2h0ZWQpIHtcbiAgICAgICAgICAgICAgICBwcmVzZW50ZWRJZCArPSBcIi9cIiArIHJvb21JbmZvLmV2ZW50X2lkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdmlldzogVmlld3MuTE9HR0VEX0lOLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRSb29tSWQ6IHJvb21JbmZvLnJvb21faWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBwYWdlX3R5cGU6IFBhZ2VUeXBlcy5Sb29tVmlldyxcbiAgICAgICAgICAgICAgICB0aGlyZFBhcnR5SW52aXRlOiByb29tSW5mby50aGlyZF9wYXJ0eV9pbnZpdGUsXG4gICAgICAgICAgICAgICAgcm9vbU9vYkRhdGE6IHJvb21JbmZvLm9vYl9kYXRhLFxuICAgICAgICAgICAgICAgIHZpYVNlcnZlcnM6IHJvb21JbmZvLnZpYV9zZXJ2ZXJzLFxuICAgICAgICAgICAgICAgIHJlYWR5OiB0cnVlLFxuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5TmV3U2NyZWVuKCdyb29tLycgKyBwcmVzZW50ZWRJZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aWV3R3JvdXAocGF5bG9hZCkge1xuICAgICAgICBjb25zdCBncm91cElkID0gcGF5bG9hZC5ncm91cF9pZDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjdXJyZW50R3JvdXBJZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIGN1cnJlbnRHcm91cElzTmV3OiBwYXlsb2FkLmdyb3VwX2lzX25ldyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2V0UGFnZShQYWdlVHlwZXMuR3JvdXBWaWV3KTtcbiAgICAgICAgdGhpcy5ub3RpZnlOZXdTY3JlZW4oJ2dyb3VwLycgKyBncm91cElkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpZXdTb21ldGhpbmdCZWhpbmRNb2RhbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudmlldyAhPT0gVmlld3MuTE9HR0VEX0lOKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdXZWxjb21lKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmN1cnJlbnRHcm91cElkICYmICF0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWQpIHtcbiAgICAgICAgICAgIHRoaXMudmlld0hvbWUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdmlld1dlbGNvbWUoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHtcbiAgICAgICAgICAgIHZpZXc6IFZpZXdzLldFTENPTUUsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vdGlmeU5ld1NjcmVlbignd2VsY29tZScpO1xuICAgICAgICBUaGVtZUNvbnRyb2xsZXIuaXNMb2dpbiA9IHRydWU7XG4gICAgICAgIHRoaXMudGhlbWVXYXRjaGVyLnJlY2hlY2soKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpZXdIb21lKCkge1xuICAgICAgICAvLyBUaGUgaG9tZSBwYWdlIHJlcXVpcmVzIHRoZSBcImxvZ2dlZCBpblwiIHZpZXcsIHNvIHdlJ2xsIHNldCB0aGF0LlxuICAgICAgICB0aGlzLnNldFN0YXRlRm9yTmV3Vmlldyh7XG4gICAgICAgICAgICB2aWV3OiBWaWV3cy5MT0dHRURfSU4sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNldFBhZ2UoUGFnZVR5cGVzLkhvbWVQYWdlKTtcbiAgICAgICAgdGhpcy5ub3RpZnlOZXdTY3JlZW4oJ2hvbWUnKTtcbiAgICAgICAgVGhlbWVDb250cm9sbGVyLmlzTG9naW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aGVtZVdhdGNoZXIucmVjaGVjaygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlld1VzZXIodXNlcklkOiBzdHJpbmcsIHN1YkFjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBmaXJzdCBzeW5jIHNvIHRoYXQgYGdldFJvb21gIGdpdmVzIHVzIGEgcm9vbSBvYmplY3QgaWYgaXQnc1xuICAgICAgICAvLyBpbiB0aGUgc3luYyByZXNwb25zZVxuICAgICAgICBjb25zdCB3YWl0Rm9yU3luYyA9IHRoaXMuZmlyc3RTeW5jUHJvbWlzZSA/XG4gICAgICAgICAgICB0aGlzLmZpcnN0U3luY1Byb21pc2UucHJvbWlzZSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB3YWl0Rm9yU3luYy50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChzdWJBY3Rpb24gPT09ICdjaGF0Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhdENyZWF0ZU9yUmV1c2UodXNlcklkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU5ld1NjcmVlbigndXNlci8nICsgdXNlcklkKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2N1cnJlbnRVc2VySWQ6IHVzZXJJZH0pO1xuICAgICAgICAgICAgdGhpcy5zZXRQYWdlKFBhZ2VUeXBlcy5Vc2VyVmlldyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0TXhJZChwYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IFNldE14SWREaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLlNldE14SWREaWFsb2cnKTtcbiAgICAgICAgY29uc3QgY2xvc2UgPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTZXQgTVhJRCcsICcnLCBTZXRNeElkRGlhbG9nLCB7XG4gICAgICAgICAgICBob21lc2VydmVyVXJsOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SG9tZXNlcnZlclVybCgpLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHN1Ym1pdHRlZCwgY3JlZGVudGlhbHMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXN1Ym1pdHRlZCkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnY2FuY2VsX2FmdGVyX3N5bmNfcHJlcGFyZWQnLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuZ29faG9tZV9vbl9jYW5jZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19ob21lX3BhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuc2V0SnVzdFJlZ2lzdGVyZWRVc2VySWQoY3JlZGVudGlhbHMudXNlcl9pZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vblJlZ2lzdGVyZWQoY3JlZGVudGlhbHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRGlmZmVyZW50U2VydmVyQ2xpY2tlZDogKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzdGFydF9yZWdpc3RyYXRpb24nfSk7XG4gICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkxvZ2luQ2xpY2s6IChldikgPT4ge1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnc3RhcnRfbG9naW4nfSk7XG4gICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLmNsb3NlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUm9vbShkZWZhdWx0UHVibGljID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgQ3JlYXRlUm9vbURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuQ3JlYXRlUm9vbURpYWxvZycpO1xuICAgICAgICBjb25zdCBtb2RhbCA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NyZWF0ZSBSb29tJywgJycsIENyZWF0ZVJvb21EaWFsb2csIHsgZGVmYXVsdFB1YmxpYyB9KTtcblxuICAgICAgICBjb25zdCBbc2hvdWxkQ3JlYXRlLCBvcHRzXSA9IGF3YWl0IG1vZGFsLmZpbmlzaGVkO1xuICAgICAgICBpZiAoc2hvdWxkQ3JlYXRlKSB7XG4gICAgICAgICAgICBjcmVhdGVSb29tKG9wdHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGF0Q3JlYXRlT3JSZXVzZSh1c2VySWQ6IHN0cmluZykge1xuICAgICAgICAvLyBVc2UgYSBkZWZlcnJlZCBhY3Rpb24gdG8gcmVzaG93IHRoZSBkaWFsb2cgb25jZSB0aGUgdXNlciBoYXMgcmVnaXN0ZXJlZFxuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzR3Vlc3QoKSkge1xuICAgICAgICAgICAgLy8gTm8gcG9pbnQgaW4gbWFraW5nIDIgRE1zIHdpdGggd2VsY29tZSBib3QuIFRoaXMgYXNzdW1lcyB2aWV3X3NldF9teGlkIHdpbGxcbiAgICAgICAgICAgIC8vIHJlc3VsdCBpbiBhIG5ldyBETSB3aXRoIHRoZSB3ZWxjb21lIHVzZXIuXG4gICAgICAgICAgICBpZiAodXNlcklkICE9PSB0aGlzLnByb3BzLmNvbmZpZy53ZWxjb21lVXNlcklkKSB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9fYWZ0ZXJfc3luY19wcmVwYXJlZCcsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkX2FjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19zdGFydF9jaGF0X29yX3JldXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nLFxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBzZXRfbXhpZCBkaWFsb2cgaXMgY2FuY2VsbGVkLCB2aWV3IC93ZWxjb21lIGJlY2F1c2UgaWYgdGhlXG4gICAgICAgICAgICAgICAgLy8gYnJvd3NlciB3YXMgcG9pbnRpbmcgYXQgL3VzZXIvQHNvbWVvbmU6ZG9tYWluP2FjdGlvbj1jaGF0LCB0aGUgVVJMXG4gICAgICAgICAgICAgICAgLy8gbmVlZHMgdG8gYmUgcmVzZXQgc28gdGhhdCB0aGV5IGNhbiByZXZpc2l0IC91c2VyLy4uIC8vIChhbmQgdHJpZ2dlclxuICAgICAgICAgICAgICAgIC8vIGBfY2hhdENyZWF0ZU9yUmV1c2VgIGFnYWluKVxuICAgICAgICAgICAgICAgIGdvX3dlbGNvbWVfb25fY2FuY2VsOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNjcmVlbl9hZnRlcjoge1xuICAgICAgICAgICAgICAgICAgICBzY3JlZW46IGB1c2VyLyR7dGhpcy5wcm9wcy5jb25maWcud2VsY29tZVVzZXJJZH1gLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHsgYWN0aW9uOiAnY2hhdCcgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBJbW11dGFibGUgRE1zIHJlcGxhY2VzIHRoaXNcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IGRtUm9vbU1hcCA9IG5ldyBETVJvb21NYXAoY2xpZW50KTtcbiAgICAgICAgY29uc3QgZG1Sb29tcyA9IGRtUm9vbU1hcC5nZXRETVJvb21zRm9yVXNlcklkKHVzZXJJZCk7XG5cbiAgICAgICAgaWYgKGRtUm9vbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IGRtUm9vbXNbMF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc3RhcnRfY2hhdCcsXG4gICAgICAgICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGxlYXZlUm9vbVdhcm5pbmdzKHJvb21JZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJvb21Ub0xlYXZlID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgLy8gU2hvdyBhIHdhcm5pbmcgaWYgdGhlcmUgYXJlIGFkZGl0aW9uYWwgY29tcGxpY2F0aW9ucy5cbiAgICAgICAgY29uc3Qgam9pblJ1bGVzID0gcm9vbVRvTGVhdmUuY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdtLnJvb20uam9pbl9ydWxlcycsICcnKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSBbXTtcbiAgICAgICAgaWYgKGpvaW5SdWxlcykge1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IGpvaW5SdWxlcy5nZXRDb250ZW50KCkuam9pbl9ydWxlO1xuICAgICAgICAgICAgaWYgKHJ1bGUgIT09IFwicHVibGljXCIpIHtcbiAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwid2FybmluZ1wiIGtleT1cIm5vbl9wdWJsaWNfd2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeycgJy8qIFdoaXRlc3BhY2UsIG90aGVyd2lzZSB0aGUgc2VudGVuY2VzIGdldCBzbWFzaGVkIHRvZ2V0aGVyICovIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJUaGlzIHJvb20gaXMgbm90IHB1YmxpYy4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVqb2luIHdpdGhvdXQgYW4gaW52aXRlLlwiKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2FybmluZ3M7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsZWF2ZVJvb20ocm9vbUlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3Qgcm9vbVRvTGVhdmUgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICBjb25zdCB3YXJuaW5ncyA9IHRoaXMubGVhdmVSb29tV2FybmluZ3Mocm9vbUlkKTtcblxuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdMZWF2ZSByb29tJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoXCJMZWF2ZSByb29tXCIpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IChcbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICB7IF90KFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGxlYXZlIHRoZSByb29tICclKHJvb21OYW1lKXMnP1wiLCB7cm9vbU5hbWU6IHJvb21Ub0xlYXZlLm5hbWV9KSB9XG4gICAgICAgICAgICAgICAgICAgIHsgd2FybmluZ3MgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBidXR0b246IF90KFwiTGVhdmVcIiksXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAoc2hvdWxkTGVhdmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkTGVhdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5sZWF2ZVJvb21DaGFpbihyb29tSWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBjb250cm9sbGVyIHNob3VsZG4ndCBiZSBsb2FkaW5nIGEgdmlldyA6KFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kYWwgPSBNb2RhbC5jcmVhdGVEaWFsb2coTG9hZGVyLCBudWxsLCAnbXhfRGlhbG9nX3NwaW5uZXInKTtcblxuICAgICAgICAgICAgICAgICAgICBkLnRoZW4oKGVycm9ycykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBsZWZ0Um9vbUlkIG9mIE9iamVjdC5rZXlzKGVycm9ycykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBlcnJvcnNbbGVmdFJvb21JZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBsZWF2ZSByb29tIFwiICsgbGVmdFJvb21JZCArIFwiIFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGl0bGUgPSBfdChcIkZhaWxlZCB0byBsZWF2ZSByb29tXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gX3QoXCJTZXJ2ZXIgbWF5IGJlIHVuYXZhaWxhYmxlLCBvdmVybG9hZGVkLCBvciB5b3UgaGl0IGEgYnVnLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09ICdNX0NBTk5PVF9MRUFWRV9TRVJWRVJfTk9USUNFX1JPT00nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gX3QoXCJDYW4ndCBsZWF2ZSBTZXJ2ZXIgTm90aWNlcyByb29tXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgcm9vbSBpcyB1c2VkIGZvciBpbXBvcnRhbnQgbWVzc2FnZXMgZnJvbSB0aGUgSG9tZXNlcnZlciwgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzbyB5b3UgY2Fubm90IGxlYXZlIGl0LlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyICYmIGVyci5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGxlYXZlIHJvb20nLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWQgPT09IHJvb21JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld19uZXh0X3Jvb20nfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGlmIHNvbWV0aGluZyB3ZW50IHNlcmlvdXNseSB3cm9uZyB3aXRoIGxlYXZpbmcgdGhlIGNoYWluLlxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gbGVhdmUgcm9vbSBcIiArIHJvb21JZCArIFwiIFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBsZWF2ZSByb29tJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRmFpbGVkIHRvIGxlYXZlIHJvb21cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiVW5rbm93biBlcnJvclwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydHMgYSBjaGF0IHdpdGggdGhlIHdlbGNvbWUgdXNlciwgaWYgdGhlIHVzZXIgZG9lc24ndCBhbHJlYWR5IGhhdmUgb25lXG4gICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIHJvb20gSUQgb2YgdGhlIG5ldyByb29tLCBvciBudWxsIGlmIG5vIHJvb20gd2FzIGNyZWF0ZWRcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHN0YXJ0V2VsY29tZVVzZXJDaGF0KCkge1xuICAgICAgICAvLyBXZSBjYW4gZW5kIHVwIHdpdGggbXVsdGlwbGUgdGFicyBwb3N0LXJlZ2lzdHJhdGlvbiB3aGVyZSB0aGUgdXNlclxuICAgICAgICAvLyBtaWdodCB0aGVuIGVuZCB1cCB3aXRoIGEgc2Vzc2lvbiBhbmQgd2UgZG9uJ3Qgd2FudCB0aGVtIGFsbCBtYWtpbmdcbiAgICAgICAgLy8gYSBjaGF0IHdpdGggdGhlIHdlbGNvbWUgdXNlcjogdHJ5IHRvIGRlLWR1cGUuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIGZpcnN0IHN5bmMgdG8gY29tcGxldGUgZm9yIHRoaXMgdG9cbiAgICAgICAgLy8gd29yayB0aG91Z2guXG4gICAgICAgIGxldCB3YWl0Rm9yO1xuICAgICAgICBpZiAoIXRoaXMuZmlyc3RTeW5jQ29tcGxldGUpIHtcbiAgICAgICAgICAgIHdhaXRGb3IgPSB0aGlzLmZpcnN0U3luY1Byb21pc2UucHJvbWlzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdhaXRGb3IgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB3YWl0Rm9yO1xuXG4gICAgICAgIGNvbnN0IHdlbGNvbWVVc2VyUm9vbXMgPSBETVJvb21NYXAuc2hhcmVkKCkuZ2V0RE1Sb29tc0ZvclVzZXJJZChcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY29uZmlnLndlbGNvbWVVc2VySWQsXG4gICAgICAgICk7XG4gICAgICAgIGlmICh3ZWxjb21lVXNlclJvb21zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gYXdhaXQgY3JlYXRlUm9vbSh7XG4gICAgICAgICAgICAgICAgZG1Vc2VySWQ6IHRoaXMucHJvcHMuY29uZmlnLndlbGNvbWVVc2VySWQsXG4gICAgICAgICAgICAgICAgLy8gT25seSB2aWV3IHRoZSB3ZWxjb21lIHVzZXIgaWYgd2UncmUgTk9UIGxvb2tpbmcgYXQgYSByb29tXG4gICAgICAgICAgICAgICAgYW5kVmlldzogIXRoaXMuc3RhdGUuY3VycmVudFJvb21JZCxcbiAgICAgICAgICAgICAgICBzcGlubmVyOiBmYWxzZSwgLy8gd2UncmUgYWxyZWFkeSBzaG93aW5nIG9uZTogd2UgZG9uJ3QgbmVlZCBhbm90aGVyIG9uZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgYml0IG9mIGEgaGFjaywgYnV0IHNpbmNlIHRoZSBkZWR1cGxpY2F0aW9uIHJlbGllc1xuICAgICAgICAgICAgLy8gb24gbS5kaXJlY3QgYmVpbmcgdXAgdG8gZGF0ZSwgd2UgbmVlZCB0byBmb3JjZSBhIHN5bmNcbiAgICAgICAgICAgIC8vIG9mIHRoZSBkYXRhYmFzZSwgb3RoZXJ3aXNlIGlmIHRoZSB1c2VyIGdvZXMgdG8gdGhlIG90aGVyXG4gICAgICAgICAgICAvLyB0YWIgYmVmb3JlIHRoZSBuZXh0IHNhdmUgaGFwcGVucyAoYSBmZXcgbWludXRlcyksIHRoZVxuICAgICAgICAgICAgLy8gc2F2ZWQgc3luYyB3aWxsIGJlIHJlc3RvcmVkIGZyb20gdGhlIGRiIGFuZCB0aGlzIGNvZGUgd2lsbFxuICAgICAgICAgICAgLy8gcnVuIHdpdGhvdXQgdGhlIHVwZGF0ZSB0byBtLmRpcmVjdCwgbWFraW5nIGFub3RoZXIgd2VsY29tZVxuICAgICAgICAgICAgLy8gdXNlciByb29tIChpdCBkb2Vzbid0IHdhaXQgZm9yIG5ldyBkYXRhIGZyb20gdGhlIHNlcnZlciwganVzdFxuICAgICAgICAgICAgLy8gdGhlIHNhdmVkIHN5bmMgdG8gYmUgbG9hZGVkKS5cbiAgICAgICAgICAgIGNvbnN0IHNhdmVXZWxjb21lVXNlciA9IChldikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgZXYuZ2V0VHlwZSgpID09PSAnbS5kaXJlY3QnICYmXG4gICAgICAgICAgICAgICAgICAgIGV2LmdldENvbnRlbnQoKSAmJlxuICAgICAgICAgICAgICAgICAgICBldi5nZXRDb250ZW50KClbdGhpcy5wcm9wcy5jb25maWcud2VsY29tZVVzZXJJZF1cbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnN0b3JlLnNhdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWNjb3VudERhdGFcIiwgc2F2ZVdlbGNvbWVVc2VyLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oXCJhY2NvdW50RGF0YVwiLCBzYXZlV2VsY29tZVVzZXIpO1xuXG4gICAgICAgICAgICByZXR1cm4gcm9vbUlkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGEgbmV3IGxvZ2dlZCBpbiBzZXNzaW9uIGhhcyBzdGFydGVkXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBvbkxvZ2dlZEluKCkge1xuICAgICAgICBUaGVtZUNvbnRyb2xsZXIuaXNMb2dpbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoZW1lV2F0Y2hlci5yZWNoZWNrKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHsgdmlldzogVmlld3MuTE9HR0VEX0lOIH0pO1xuICAgICAgICAvLyBJZiBhIHNwZWNpZmljIHNjcmVlbiBpcyBzZXQgdG8gYmUgc2hvd24gYWZ0ZXIgbG9naW4sIHNob3cgdGhhdCBhYm92ZVxuICAgICAgICAvLyBhbGwgZWxzZSwgYXMgaXQgcHJvYmFibHkgbWVhbnMgdGhlIHVzZXIgY2xpY2tlZCBvbiBzb21ldGhpbmcgYWxyZWFkeS5cbiAgICAgICAgaWYgKHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbiAmJiB0aGlzLnNjcmVlbkFmdGVyTG9naW4uc2NyZWVuKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTY3JlZW4oXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JlZW5BZnRlckxvZ2luLnNjcmVlbixcbiAgICAgICAgICAgICAgICB0aGlzLnNjcmVlbkFmdGVyTG9naW4ucGFyYW1zLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbiA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoTWF0cml4Q2xpZW50UGVnLmN1cnJlbnRVc2VySXNKdXN0UmVnaXN0ZXJlZCgpKSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuc2V0SnVzdFJlZ2lzdGVyZWRVc2VySWQobnVsbCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53ZWxjb21lVXNlcklkICYmIGdldEN1cnJlbnRMYW5ndWFnZSgpLnN0YXJ0c1dpdGgoXCJlblwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdlbGNvbWVVc2VyUm9vbSA9IGF3YWl0IHRoaXMuc3RhcnRXZWxjb21lVXNlckNoYXQoKTtcbiAgICAgICAgICAgICAgICBpZiAod2VsY29tZVVzZXJSb29tID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRpZG4ndCByZWRpcmVjdCB0byB0aGUgd2VsY29tZSB1c2VyIHJvb20sIHNvIHNob3dcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGhvbWVwYWdlLlxuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfaG9tZV9wYWdlJ30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHVzZXIgaGFzIGp1c3QgbG9nZ2VkIGluIGFmdGVyIHJlZ2lzdGVyaW5nLFxuICAgICAgICAgICAgICAgIC8vIHNvIHNob3cgdGhlIGhvbWVwYWdlLlxuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld19ob21lX3BhZ2UnfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTY3JlZW5BZnRlckxvZ2luKCk7XG4gICAgICAgIH1cblxuICAgICAgICBTdG9yYWdlTWFuYWdlci50cnlQZXJzaXN0U3RvcmFnZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1NjcmVlbkFmdGVyTG9naW4oKSB7XG4gICAgICAgIC8vIElmIHNjcmVlbkFmdGVyTG9naW4gaXMgc2V0LCB1c2UgdGhhdCwgdGhlbiBudWxsIGl0IHNvIHRoYXQgYSBzZWNvbmQgbG9naW4gd2lsbFxuICAgICAgICAvLyByZXN1bHQgaW4gdmlld19ob21lX3BhZ2UsIF91c2VyX3NldHRpbmdzIG9yIF9yb29tX2RpcmVjdG9yeVxuICAgICAgICBpZiAodGhpcy5zY3JlZW5BZnRlckxvZ2luICYmIHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbi5zY3JlZW4pIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NjcmVlbihcbiAgICAgICAgICAgICAgICB0aGlzLnNjcmVlbkFmdGVyTG9naW4uc2NyZWVuLFxuICAgICAgICAgICAgICAgIHRoaXMuc2NyZWVuQWZ0ZXJMb2dpbi5wYXJhbXMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5BZnRlckxvZ2luID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChsb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ214X2xhc3Rfcm9vbV9pZCcpKSB7XG4gICAgICAgICAgICAvLyBCZWZvcmUgZGVmYXVsdGluZyB0byBkaXJlY3RvcnksIHNob3cgdGhlIGxhc3Qgdmlld2VkIHJvb21cbiAgICAgICAgICAgIHRoaXMudmlld0xhc3RSb29tKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzR3Vlc3QoKSkge1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld193ZWxjb21lX3BhZ2UnfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdldEhvbWVQYWdlVXJsKHRoaXMucHJvcHMuY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld19ob21lX3BhZ2UnfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RTeW5jUHJvbWlzZS5wcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfbmV4dF9yb29tJ30pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aWV3TGFzdFJvb20oKSB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgcm9vbV9pZDogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ214X2xhc3Rfcm9vbV9pZCcpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgc2Vzc2lvbiBpcyBsb2dnZWQgb3V0XG4gICAgICovXG4gICAgcHJpdmF0ZSBvbkxvZ2dlZE91dCgpIHtcbiAgICAgICAgdGhpcy5ub3RpZnlOZXdTY3JlZW4oJ2xvZ2luJyk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHtcbiAgICAgICAgICAgIHZpZXc6IFZpZXdzLkxPR0lOLFxuICAgICAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICAgICAgY29sbGFwc2VMaHM6IGZhbHNlLFxuICAgICAgICAgICAgY3VycmVudFJvb21JZDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3ViVGl0bGVTdGF0dXMgPSAnJztcbiAgICAgICAgdGhpcy5zZXRQYWdlU3VidGl0bGUoKTtcbiAgICAgICAgVGhlbWVDb250cm9sbGVyLmlzTG9naW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnRoZW1lV2F0Y2hlci5yZWNoZWNrKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIHNlc3Npb24gaXMgc29mdGx5IGxvZ2dlZCBvdXRcbiAgICAgKi9cbiAgICBwcml2YXRlIG9uU29mdExvZ291dCgpIHtcbiAgICAgICAgdGhpcy5ub3RpZnlOZXdTY3JlZW4oJ3NvZnRfbG9nb3V0Jyk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHtcbiAgICAgICAgICAgIHZpZXc6IFZpZXdzLlNPRlRfTE9HT1VULFxuICAgICAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICAgICAgY29sbGFwc2VMaHM6IGZhbHNlLFxuICAgICAgICAgICAgY3VycmVudFJvb21JZDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3ViVGl0bGVTdGF0dXMgPSAnJztcbiAgICAgICAgdGhpcy5zZXRQYWdlU3VidGl0bGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQganVzdCBiZWZvcmUgdGhlIG1hdHJpeCBjbGllbnQgaXMgc3RhcnRlZFxuICAgICAqICh1c2VmdWwgZm9yIHNldHRpbmcgbGlzdGVuZXJzKVxuICAgICAqL1xuICAgIHByaXZhdGUgb25XaWxsU3RhcnRDbGllbnQoKSB7XG4gICAgICAgIC8vIHJlc2V0IHRoZSAnaGF2ZSBjb21wbGV0ZWQgZmlyc3Qgc3luYycgZmxhZyxcbiAgICAgICAgLy8gc2luY2Ugd2UncmUgYWJvdXQgdG8gc3RhcnQgdGhlIGNsaWVudCBhbmQgdGhlcmVmb3JlIGFib3V0XG4gICAgICAgIC8vIHRvIGRvIHRoZSBmaXJzdCBzeW5jXG4gICAgICAgIHRoaXMuZmlyc3RTeW5jQ29tcGxldGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maXJzdFN5bmNQcm9taXNlID0gZGVmZXIoKTtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgIC8vIEFsbG93IHRoZSBKUyBTREsgdG8gcmVhcCB0aW1lbGluZSBldmVudHMuIFRoaXMgcmVkdWNlcyB0aGUgYW1vdW50IG9mXG4gICAgICAgIC8vIG1lbW9yeSBjb25zdW1lZCBhcyB0aGUgSlMgU0RLIHN0b3JlcyBtdWx0aXBsZSBkaXN0aW5jdCBjb3BpZXMgb2Ygcm9vbVxuICAgICAgICAvLyBzdGF0ZSAoZWFjaCBvZiB3aGljaCBjYW4gYmUgMTBzIG9mIE1CcykgZm9yIGVhY2ggRElTSk9JTlQgdGltZWxpbmUuIFRoaXMgaXNcbiAgICAgICAgLy8gcGFydGljdWxhcmx5IG5vdGljZWFibGUgd2hlbiB0aGVyZSBhcmUgbG90cyBvZiAnbGltaXRlZCcgL3N5bmMgcmVzcG9uc2VzXG4gICAgICAgIC8vIHN1Y2ggYXMgd2hlbiBsYXB0b3BzIHVuc2xlZXAuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzMzMDcjaXNzdWVjb21tZW50LTI4Mjg5NTU2OFxuICAgICAgICBjbGkuc2V0Q2FuUmVzZXRUaW1lbGluZUNhbGxiYWNrKChyb29tSWQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVxdWVzdCB0byByZXNldCB0aW1lbGluZSBpbiByb29tIFwiLCByb29tSWQsIFwiIHZpZXdpbmc6XCIsIHRoaXMuc3RhdGUuY3VycmVudFJvb21JZCk7XG4gICAgICAgICAgICBpZiAocm9vbUlkICE9PSB0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWQpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCBpcyBzYWZlIHRvIHJlbW92ZSBldmVudHMgZnJvbSByb29tcyB3ZSBhcmUgbm90IHZpZXdpbmcuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBXZSBhcmUgdmlld2luZyB0aGUgcm9vbSB3aGljaCB3ZSB3YW50IHRvIHJlc2V0LiBJdCBpcyBvbmx5IHNhZmUgdG8gZG9cbiAgICAgICAgICAgIC8vIHRoaXMgaWYgd2UgYXJlIG5vdCBzY3JvbGxlZCB1cCBpbiB0aGUgdmlldy4gVG8gZmluZCBvdXQsIGRlbGVnYXRlIHRvXG4gICAgICAgICAgICAvLyB0aGUgdGltZWxpbmUgcGFuZWwuIElmIHRoZSB0aW1lbGluZSBwYW5lbCBkb2Vzbid0IGV4aXN0LCB0aGVuIHdlIGFzc3VtZVxuICAgICAgICAgICAgLy8gaXQgaXMgc2FmZSB0byByZXNldCB0aGUgdGltZWxpbmUuXG4gICAgICAgICAgICBpZiAoIXRoaXMubG9nZ2VkSW5WaWV3LmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvZ2dlZEluVmlldy5jdXJyZW50LmNhblJlc2V0VGltZWxpbmVJblJvb20ocm9vbUlkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY2xpLm9uKCdzeW5jJywgKHN0YXRlLCBwcmV2U3RhdGUsIGRhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIExpZmVjeWNsZVN0b3JlIGFuZCBvdGhlcnMgY2Fubm90IGRpcmVjdGx5IHN1YnNjcmliZSB0byBtYXRyaXggY2xpZW50IGZvclxuICAgICAgICAgICAgLy8gZXZlbnRzIGJlY2F1c2UgZmx1eCBvbmx5IGFsbG93cyBzdG9yZSBzdGF0ZSBjaGFuZ2VzIGR1cmluZyBmbHV4IGRpc3BhdGNoZXMuXG4gICAgICAgICAgICAvLyBTbyBkaXNwYXRjaCBkaXJlY3RseSBmcm9tIGhlcmUuIElkZWFsbHkgd2UnZCB1c2UgYSBTeW5jU3RhdGVTdG9yZSB0aGF0XG4gICAgICAgICAgICAvLyB3b3VsZCBkbyB0aGlzIGRpc3BhdGNoIGFuZCBleHBvc2UgdGhlIHN5bmMgc3RhdGUgaXRzZWxmIChieSBsaXN0ZW5pbmcgdG9cbiAgICAgICAgICAgIC8vIGl0cyBvd24gZGlzcGF0Y2gpLlxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzeW5jX3N0YXRlJywgcHJldlN0YXRlLCBzdGF0ZX0pO1xuXG4gICAgICAgICAgICBpZiAoc3RhdGUgPT09IFwiRVJST1JcIiB8fCBzdGF0ZSA9PT0gXCJSRUNPTk5FQ1RJTkdcIikge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmVycm9yIGluc3RhbmNlb2YgSW52YWxpZFN0b3JlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgTGlmZWN5Y2xlLmhhbmRsZUludmFsaWRTdG9yZUVycm9yKGRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzeW5jRXJyb3I6IGRhdGEuZXJyb3IgfHwgdHJ1ZX0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnN5bmNFcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3N5bmNFcnJvcjogbnVsbH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0luZGljYXRvcihzdGF0ZSwgcHJldlN0YXRlKTtcbiAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gXCJTWU5DSU5HXCIgJiYgcHJldlN0YXRlID09PSBcIlNZTkNJTkdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIk1hdHJpeENsaWVudCBzeW5jIHN0YXRlID0+ICVzXCIsIHN0YXRlKTtcbiAgICAgICAgICAgIGlmIChzdGF0ZSAhPT0gXCJQUkVQQVJFRFwiKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICB0aGlzLmZpcnN0U3luY0NvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RTeW5jUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICByZWFkeTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzaG93Tm90aWZpZXJUb29sYmFyOiBOb3RpZmllci5zaG91bGRTaG93VG9vbGJhcigpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjbGkub24oJ0NhbGwuaW5jb21pbmcnLCBmdW5jdGlvbihjYWxsKSB7XG4gICAgICAgICAgICAvLyB3ZSBkaXNwYXRjaCB0aGlzIHN5bmNocm9ub3VzbHkgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50XG4gICAgICAgICAgICAvLyBoYW5kbGVycyBvbiB0aGUgY2FsbCBhcmUgc2V0IHVwIGltbWVkaWF0ZWx5IChzbyB0aGF0IGlmXG4gICAgICAgICAgICAvLyB3ZSBnZXQgYW4gaW1tZWRpYXRlIGhhbmd1cCwgd2UgZG9uJ3QgZ2V0IGEgc3R1Y2sgY2FsbClcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnaW5jb21pbmdfY2FsbCcsXG4gICAgICAgICAgICAgICAgY2FsbDogY2FsbCxcbiAgICAgICAgICAgIH0sIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xpLm9uKCdTZXNzaW9uLmxvZ2dlZF9vdXQnLCBmdW5jdGlvbihlcnJPYmopIHtcbiAgICAgICAgICAgIGlmIChMaWZlY3ljbGUuaXNMb2dnaW5nT3V0KCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGVyck9iai5odHRwU3RhdHVzID09PSA0MDEgJiYgZXJyT2JqLmRhdGEgJiYgZXJyT2JqLmRhdGFbJ3NvZnRfbG9nb3V0J10pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJTb2Z0IGxvZ291dCBpc3N1ZWQgYnkgc2VydmVyIC0gYXZvaWRpbmcgZGF0YSBkZWxldGlvblwiKTtcbiAgICAgICAgICAgICAgICBMaWZlY3ljbGUuc29mdExvZ291dCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1NpZ25lZCBvdXQnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ1NpZ25lZCBPdXQnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0ZvciBzZWN1cml0eSwgdGhpcyBzZXNzaW9uIGhhcyBiZWVuIHNpZ25lZCBvdXQuIFBsZWFzZSBzaWduIGluIGFnYWluLicpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2xvZ291dCcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNsaS5vbignbm9fY29uc2VudCcsIGZ1bmN0aW9uKG1lc3NhZ2UsIGNvbnNlbnRVcmkpIHtcbiAgICAgICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdObyBDb25zZW50IERpYWxvZycsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnVGVybXMgYW5kIENvbmRpdGlvbnMnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHA+IHsgX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAnVG8gY29udGludWUgdXNpbmcgdGhlICUoaG9tZXNlcnZlckRvbWFpbilzIGhvbWVzZXJ2ZXIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAneW91IG11c3QgcmV2aWV3IGFuZCBhZ3JlZSB0byBvdXIgdGVybXMgYW5kIGNvbmRpdGlvbnMuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgaG9tZXNlcnZlckRvbWFpbjogY2xpLmdldERvbWFpbigpIH0sXG4gICAgICAgICAgICAgICAgICAgICkgfVxuICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoJ1JldmlldyB0ZXJtcyBhbmQgY29uZGl0aW9ucycpLFxuICAgICAgICAgICAgICAgIGNhbmNlbEJ1dHRvbjogX3QoJ0Rpc21pc3MnKSxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiAoY29uZmlybWVkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHduZCA9IHdpbmRvdy5vcGVuKGNvbnNlbnRVcmksICdfYmxhbmsnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHduZC5vcGVuZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sIG51bGwsIHRydWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkZnQgPSBuZXcgRGVjcnlwdGlvbkZhaWx1cmVUcmFja2VyKCh0b3RhbCwgZXJyb3JDb2RlKSA9PiB7XG4gICAgICAgICAgICBBbmFseXRpY3MudHJhY2tFdmVudCgnRTJFJywgJ0RlY3J5cHRpb24gZmFpbHVyZScsIGVycm9yQ29kZSwgdG90YWwpO1xuICAgICAgICB9LCAoZXJyb3JDb2RlKSA9PiB7XG4gICAgICAgICAgICAvLyBNYXAgSlMtU0RLIGVycm9yIGNvZGVzIHRvIHRyYWNrZXIgY29kZXMgZm9yIGFnZ3JlZ2F0aW9uXG4gICAgICAgICAgICBzd2l0Y2ggKGVycm9yQ29kZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ01FR09MTV9VTktOT1dOX0lOQk9VTkRfU0VTU0lPTl9JRCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnb2xtX2tleXNfbm90X3NlbnRfZXJyb3InO1xuICAgICAgICAgICAgICAgIGNhc2UgJ09MTV9VTktOT1dOX01FU1NBR0VfSU5ERVgnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ29sbV9pbmRleF9lcnJvcic7XG4gICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndW5leHBlY3RlZF9lcnJvcic7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd1bnNwZWNpZmllZF9lcnJvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNoZWx2ZWQgZm9yIGxhdGVyIGRhdGUgd2hlbiB3ZSBoYXZlIHRpbWUgdG8gdGhpbmsgYWJvdXQgcGVyc2lzdGluZyBoaXN0b3J5IG9mXG4gICAgICAgIC8vIHRyYWNrZWQgZXZlbnRzIGFjcm9zcyBzZXNzaW9ucy5cbiAgICAgICAgLy8gZGZ0LmxvYWRUcmFja2VkRXZlbnRIYXNoTWFwKCk7XG5cbiAgICAgICAgZGZ0LnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gV2hlbiBsb2dnaW5nIG91dCwgc3RvcCB0cmFja2luZyBmYWlsdXJlcyBhbmQgZGVzdHJveSBzdGF0ZVxuICAgICAgICBjbGkub24oXCJTZXNzaW9uLmxvZ2dlZF9vdXRcIiwgKCkgPT4gZGZ0LnN0b3AoKSk7XG4gICAgICAgIGNsaS5vbihcIkV2ZW50LmRlY3J5cHRlZFwiLCAoZSwgZXJyKSA9PiBkZnQuZXZlbnREZWNyeXB0ZWQoZSwgZXJyKSk7XG5cbiAgICAgICAgLy8gVE9ETzogV2UgY2FuIHJlbW92ZSB0aGlzIG9uY2UgY3Jvc3Mtc2lnbmluZyBpcyB0aGUgb25seSB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzExOTA4XG4gICAgICAgIGNvbnN0IGtyaCA9IG5ldyBLZXlSZXF1ZXN0SGFuZGxlcihjbGkpO1xuICAgICAgICBjbGkub24oXCJjcnlwdG8ucm9vbUtleVJlcXVlc3RcIiwgKHJlcSkgPT4ge1xuICAgICAgICAgICAga3JoLmhhbmRsZUtleVJlcXVlc3QocmVxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNsaS5vbihcImNyeXB0by5yb29tS2V5UmVxdWVzdENhbmNlbGxhdGlvblwiLCAocmVxKSA9PiB7XG4gICAgICAgICAgICBrcmguaGFuZGxlS2V5UmVxdWVzdENhbmNlbGxhdGlvbihyZXEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjbGkub24oXCJSb29tXCIsIChyb29tKSA9PiB7XG4gICAgICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzQ3J5cHRvRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxhY2tsaXN0RW5hYmxlZCA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChcbiAgICAgICAgICAgICAgICAgICAgU2V0dGluZ0xldmVsLlJPT01fREVWSUNFLFxuICAgICAgICAgICAgICAgICAgICBcImJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzXCIsXG4gICAgICAgICAgICAgICAgICAgIHJvb20ucm9vbUlkLFxuICAgICAgICAgICAgICAgICAgICAvKmV4cGxpY2l0PSovdHJ1ZSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJvb20uc2V0QmxhY2tsaXN0VW52ZXJpZmllZERldmljZXMoYmxhY2tsaXN0RW5hYmxlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjbGkub24oXCJjcnlwdG8ud2FybmluZ1wiLCAodHlwZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ0NSWVBUT19XQVJOSU5HX09MRF9WRVJTSU9OX0RFVEVDVEVEJzpcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ3J5cHRvIG1pZ3JhdGVkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ09sZCBjcnlwdG9ncmFwaHkgZGF0YSBkZXRlY3RlZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRGF0YSBmcm9tIGFuIG9sZGVyIHZlcnNpb24gb2YgUmlvdCBoYXMgYmVlbiBkZXRlY3RlZC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyB3aWxsIGhhdmUgY2F1c2VkIGVuZC10by1lbmQgY3J5cHRvZ3JhcGh5IHRvIG1hbGZ1bmN0aW9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluIHRoZSBvbGRlciB2ZXJzaW9uLiBFbmQtdG8tZW5kIGVuY3J5cHRlZCBtZXNzYWdlcyBleGNoYW5nZWQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVjZW50bHkgd2hpbHN0IHVzaW5nIHRoZSBvbGRlciB2ZXJzaW9uIG1heSBub3QgYmUgZGVjcnlwdGFibGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaW4gdGhpcyB2ZXJzaW9uLiBUaGlzIG1heSBhbHNvIGNhdXNlIG1lc3NhZ2VzIGV4Y2hhbmdlZCB3aXRoIHRoaXMgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmVyc2lvbiB0byBmYWlsLiBJZiB5b3UgZXhwZXJpZW5jZSBwcm9ibGVtcywgbG9nIG91dCBhbmQgYmFjayBpbiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhZ2Fpbi4gVG8gcmV0YWluIG1lc3NhZ2UgaGlzdG9yeSwgZXhwb3J0IGFuZCByZS1pbXBvcnQgeW91ciBrZXlzLlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2xpLm9uKFwiY3J5cHRvLmtleUJhY2t1cEZhaWxlZFwiLCBhc3luYyAoZXJyY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGhhdmVOZXdWZXJzaW9uO1xuICAgICAgICAgICAgbGV0IG5ld1ZlcnNpb25JbmZvO1xuICAgICAgICAgICAgLy8gaWYga2V5IGJhY2t1cCBpcyBzdGlsbCBlbmFibGVkLCB0aGVyZSBtdXN0IGJlIGEgbmV3IGJhY2t1cCBpbiBwbGFjZVxuICAgICAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRLZXlCYWNrdXBFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBoYXZlTmV3VmVyc2lvbiA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaGVjayB0aGUgc2VydmVyIHRvIHNlZSBpZiB0aGVyZSdzIGEgbmV3IG9uZVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1ZlcnNpb25JbmZvID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEtleUJhY2t1cFZlcnNpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZlcnNpb25JbmZvICE9PSBudWxsKSBoYXZlTmV3VmVyc2lvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU2F3IGtleSBiYWNrdXAgZXJyb3IgYnV0IGZhaWxlZCB0byBjaGVjayBiYWNrdXAgdmVyc2lvbiFcIiwgZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXZlTmV3VmVyc2lvbikge1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYygnTmV3IFJlY292ZXJ5IE1ldGhvZCcsICdOZXcgUmVjb3ZlcnkgTWV0aG9kJyxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0KCcuLi8uLi9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL05ld1JlY292ZXJ5TWV0aG9kRGlhbG9nJyksXG4gICAgICAgICAgICAgICAgICAgIHsgbmV3VmVyc2lvbkluZm8gfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMoJ1JlY292ZXJ5IE1ldGhvZCBSZW1vdmVkJywgJ1JlY292ZXJ5IE1ldGhvZCBSZW1vdmVkJyxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0KCcuLi8uLi9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL1JlY292ZXJ5TWV0aG9kUmVtb3ZlZERpYWxvZycpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNsaS5vbihcImNyeXB0by5rZXlTaWduYXR1cmVVcGxvYWRGYWlsdXJlXCIsIChmYWlsdXJlcywgc291cmNlLCBjb250aW51YXRpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IEtleVNpZ25hdHVyZVVwbG9hZEZhaWxlZERpYWxvZyA9XG4gICAgICAgICAgICAgICAgc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5LZXlTaWduYXR1cmVVcGxvYWRGYWlsZWREaWFsb2cnKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXG4gICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byB1cGxvYWQga2V5IHNpZ25hdHVyZXMnLFxuICAgICAgICAgICAgICAgICdGYWlsZWQgdG8gdXBsb2FkIGtleSBzaWduYXR1cmVzJyxcbiAgICAgICAgICAgICAgICBLZXlTaWduYXR1cmVVcGxvYWRGYWlsZWREaWFsb2csXG4gICAgICAgICAgICAgICAgeyBmYWlsdXJlcywgc291cmNlLCBjb250aW51YXRpb24gfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNsaS5vbihcImNyeXB0by52ZXJpZmljYXRpb24ucmVxdWVzdFwiLCByZXF1ZXN0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzRmxhZ09uID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKTtcblxuICAgICAgICAgICAgaWYgKCFpc0ZsYWdPbiAmJiAhcmVxdWVzdC5jaGFubmVsLmRldmljZUlkKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5jYW5jZWwoe2NvZGU6IFwibS5pbnZhbGlkX21lc3NhZ2VcIiwgcmVhc29uOiBcIlRoaXMgY2xpZW50IGhhcyBjcm9zcy1zaWduaW5nIGRpc2FibGVkXCJ9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnZlcmlmaWVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgSW5jb21pbmdTYXNEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZGlhbG9ncy5JbmNvbWluZ1Nhc0RpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdJbmNvbWluZyBWZXJpZmljYXRpb24nLCAnJywgSW5jb21pbmdTYXNEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZpZXI6IHJlcXVlc3QudmVyaWZpZXIsXG4gICAgICAgICAgICAgICAgfSwgbnVsbCwgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcXVlc3QucGVuZGluZykge1xuICAgICAgICAgICAgICAgIFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5hZGRPclJlcGxhY2VUb2FzdCh7XG4gICAgICAgICAgICAgICAgICAgIGtleTogJ3ZlcmlmcmVxXycgKyByZXF1ZXN0LmNoYW5uZWwudHJhbnNhY3Rpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHJlcXVlc3QuaXNTZWxmVmVyaWZpY2F0aW9uID8gX3QoXCJTZWxmLXZlcmlmaWNhdGlvbiByZXF1ZXN0XCIpIDogX3QoXCJWZXJpZmljYXRpb24gUmVxdWVzdFwiKSxcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogXCJ2ZXJpZmljYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcHM6IHtyZXF1ZXN0fSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBzZGsuZ2V0Q29tcG9uZW50KFwidG9hc3RzLlZlcmlmaWNhdGlvblJlcXVlc3RUb2FzdFwiKSxcbiAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IFRvYXN0U3RvcmUuUFJJT1JJVFlfUkVBTFRJTUUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBGaXJlIHRoZSB0aW50ZXIgcmlnaHQgb24gc3RhcnR1cCB0byBlbnN1cmUgdGhlIGRlZmF1bHQgdGhlbWUgaXMgYXBwbGllZFxuICAgICAgICAvLyBBIGxhdGVyIHN5bmMgY2FuL3dpbGwgY29ycmVjdCB0aGUgdGludCB0byBiZSB0aGUgcmlnaHQgdmFsdWUgZm9yIHRoZSB1c2VyXG4gICAgICAgIGNvbnN0IGNvbG9yU2NoZW1lID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInJvb21Db2xvclwiKTtcbiAgICAgICAgVGludGVyLnRpbnQoY29sb3JTY2hlbWUucHJpbWFyeV9jb2xvciwgY29sb3JTY2hlbWUuc2Vjb25kYXJ5X2NvbG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgc2hvcnRseSBhZnRlciB0aGUgbWF0cml4IGNsaWVudCBoYXMgc3RhcnRlZC4gVXNlZnVsIGZvclxuICAgICAqIHNldHRpbmcgdXAgYW55dGhpbmcgdGhhdCByZXF1aXJlcyB0aGUgY2xpZW50IHRvIGJlIHN0YXJ0ZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIG9uQ2xpZW50U3RhcnRlZCgpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgIGlmIChjbGkuaXNDcnlwdG9FbmFibGVkKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGJsYWNrbGlzdEVuYWJsZWQgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQoXG4gICAgICAgICAgICAgICAgU2V0dGluZ0xldmVsLkRFVklDRSxcbiAgICAgICAgICAgICAgICBcImJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY2xpLnNldEdsb2JhbEJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzKGJsYWNrbGlzdEVuYWJsZWQpO1xuXG4gICAgICAgICAgICAvLyBXaXRoIGNyb3NzLXNpZ25pbmcgZW5hYmxlZCwgd2Ugc2VuZCB0byB1bmtub3duIGRldmljZXNcbiAgICAgICAgICAgIC8vIHdpdGhvdXQgcHJvbXB0aW5nLiBBbnkgYmFkLWRldmljZSBzdGF0dXMgdGhlIHVzZXIgc2hvdWxkXG4gICAgICAgICAgICAvLyBiZSBhd2FyZSBvZiB3aWxsIGJlIHNpZ25hbGxlZCB0aHJvdWdoIHRoZSByb29tIHNoaWVsZFxuICAgICAgICAgICAgLy8gY2hhbmdpbmcgY29sb3VyLiBNb3JlIGFkdmFuY2VkIGJlaGF2aW91ciB3aWxsIGNvbWUgb25jZVxuICAgICAgICAgICAgLy8gd2UgaW1wbGVtZW50IG1vcmUgc2V0dGluZ3MuXG4gICAgICAgICAgICBjbGkuc2V0R2xvYmFsRXJyb3JPblVua25vd25EZXZpY2VzKFxuICAgICAgICAgICAgICAgICFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNob3dTY3JlZW4oc2NyZWVuOiBzdHJpbmcsIHBhcmFtcz86IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gICAgICAgIGlmIChzY3JlZW4gPT09ICdyZWdpc3RlcicpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc3RhcnRfcmVnaXN0cmF0aW9uJyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjcmVlbiA9PT0gJ2xvZ2luJykge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdzdGFydF9sb2dpbicsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChzY3JlZW4gPT09ICdmb3Jnb3RfcGFzc3dvcmQnKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3N0YXJ0X3Bhc3N3b3JkX3JlY292ZXJ5JyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjcmVlbiA9PT0gJ3NvZnRfbG9nb3V0Jykge1xuICAgICAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKSAmJiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCkgJiYgIUxpZmVjeWNsZS5pc1NvZnRMb2dvdXQoKSkge1xuICAgICAgICAgICAgICAgIC8vIExvZ2dlZCBpbiAtIHZpc2l0IGEgcm9vbVxuICAgICAgICAgICAgICAgIHRoaXMudmlld0xhc3RSb29tKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFVsdGltYXRlbHkgdHJpZ2dlcnMgc29mdF9sb2dvdXQgaWYgbmVlZGVkXG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc3RhcnRfbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY3JlZW4gPT09ICduZXcnKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfY3JlYXRlX3Jvb20nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnc2V0dGluZ3MnKSB7XG4gICAgICAgICAgICBkaXMuZmlyZShBY3Rpb24uVmlld1VzZXJTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnd2VsY29tZScpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld193ZWxjb21lX3BhZ2UnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnaG9tZScpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19ob21lX3BhZ2UnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnc3RhcnQnKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTY3JlZW4oJ2hvbWUnKTtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnZGlyZWN0b3J5Jykge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb21fZGlyZWN0b3J5JyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjcmVlbiA9PT0gJ2dyb3VwcycpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19teV9ncm91cHMnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NyZWVuID09PSAnY29tcGxldGVfc2VjdXJpdHknKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3N0YXJ0X2NvbXBsZXRlX3NlY3VyaXR5JyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjcmVlbiA9PT0gJ3Bvc3RfcmVnaXN0cmF0aW9uJykge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdzdGFydF9wb3N0X3JlZ2lzdHJhdGlvbicsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChzY3JlZW4uaW5kZXhPZigncm9vbS8nKSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gUm9vbXMgY2FuIGhhdmUgdGhlIGZvbGxvd2luZyBmb3JtYXRzOlxuICAgICAgICAgICAgLy8gI3Jvb21fYWxpYXM6ZG9tYWluIG9yICFvcGFxdWVfaWQ6ZG9tYWluXG4gICAgICAgICAgICBjb25zdCByb29tID0gc2NyZWVuLnN1YnN0cmluZyg1KTtcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbk9mZnNldCA9IHJvb20uaW5kZXhPZignOicpICsgMTsgLy8gMCBpbiBjYXNlIHJvb20gZG9lcyBub3QgY29udGFpbiBhIDpcbiAgICAgICAgICAgIGxldCBldmVudE9mZnNldCA9IHJvb20ubGVuZ3RoO1xuICAgICAgICAgICAgLy8gcm9vbSBhbGlhc2VzIGNhbiBjb250YWluIHNsYXNoZXMgb25seSBsb29rIGZvciBzbGFzaCBhZnRlciBkb21haW5cbiAgICAgICAgICAgIGlmIChyb29tLnN1YnN0cmluZyhkb21haW5PZmZzZXQpLmluZGV4T2YoJy8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRPZmZzZXQgPSBkb21haW5PZmZzZXQgKyByb29tLnN1YnN0cmluZyhkb21haW5PZmZzZXQpLmluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJvb21TdHJpbmcgPSByb29tLnN1YnN0cmluZygwLCBldmVudE9mZnNldCk7XG4gICAgICAgICAgICBsZXQgZXZlbnRJZCA9IHJvb20uc3Vic3RyaW5nKGV2ZW50T2Zmc2V0ICsgMSk7IC8vIGVtcHR5IHN0cmluZyBpZiBubyBldmVudCBpZCBnaXZlblxuXG4gICAgICAgICAgICAvLyBQcmV2aW91c2x5IHdlIHB1bGxlZCB0aGUgZXZlbnRJRCBmcm9tIHRoZSBzZWdtZW50cyBpbiBzdWNoIGEgd2F5XG4gICAgICAgICAgICAvLyB3aGVyZSBpZiB0aGVyZSB3YXMgbm8gZXZlbnRJZCB0aGVuIHdlJ2QgZ2V0IHVuZGVmaW5lZC4gSG93ZXZlciwgd2VcbiAgICAgICAgICAgIC8vIG5vdyBkbyBhIHNwbGljZSBhbmQgam9pbiB0byBoYW5kbGUgdjMgZXZlbnQgSURzIHdoaWNoIHJlc3VsdHMgaW5cbiAgICAgICAgICAgIC8vIGFuIGVtcHR5IHN0cmluZy4gVG8gbWFpbnRhaW4gb3VyIHBvdGVudGlhbCBjb250cmFjdCB3aXRoIHRoZSByZXN0XG4gICAgICAgICAgICAvLyBvZiB0aGUgYXBwLCB3ZSBjb2VyY2UgdGhlIGV2ZW50SWQgdG8gYmUgdW5kZWZpbmVkIHdoZXJlIGFwcGxpY2FibGUuXG4gICAgICAgICAgICBpZiAoIWV2ZW50SWQpIGV2ZW50SWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IEhhbmRsZSBlbmNvZGVkIHJvb20vZXZlbnQgSURzOiBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy85MTQ5XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiBzb3J0X291dCBjYXNlQ29uc2lzdGVuY3lcbiAgICAgICAgICAgIGNvbnN0IHRoaXJkUGFydHlJbnZpdGUgPSB7XG4gICAgICAgICAgICAgICAgaW52aXRlU2lnblVybDogcGFyYW1zLnNpZ251cmwsXG4gICAgICAgICAgICAgICAgaW52aXRlZEVtYWlsOiBwYXJhbXMuZW1haWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb29iRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBwYXJhbXMucm9vbV9uYW1lLFxuICAgICAgICAgICAgICAgIGF2YXRhclVybDogcGFyYW1zLnJvb21fYXZhdGFyX3VybCxcbiAgICAgICAgICAgICAgICBpbnZpdGVyTmFtZTogcGFyYW1zLmludml0ZXJfbmFtZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIG9uIG91ciBVUkxzIHRoZXJlIG1pZ2h0IGJlIGEgP3ZpYT1tYXRyaXgub3JnIG9yIHNpbWlsYXIgdG8gaGVscFxuICAgICAgICAgICAgLy8gam9pbnMgdG8gdGhlIHJvb20gc3VjY2VlZC4gV2UnbGwgcGFzcyB0aGVzZSB0aHJvdWdoIGFzIGFuIGFycmF5XG4gICAgICAgICAgICAvLyB0byBvdGhlciBsZXZlbHMuIElmIHRoZXJlJ3MganVzdCBvbmUgP3ZpYT0gdGhlbiBwYXJhbXMudmlhIGlzIGFcbiAgICAgICAgICAgIC8vIHNpbmdsZSBzdHJpbmcuIElmIHNvbWVvbmUgZG9lcyBzb21ldGhpbmcgbGlrZSA/dmlhPW9uZS5jb20mdmlhPXR3by5jb21cbiAgICAgICAgICAgIC8vIHRoZW4gcGFyYW1zLnZpYSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzLlxuICAgICAgICAgICAgbGV0IHZpYSA9IFtdO1xuICAgICAgICAgICAgaWYgKHBhcmFtcy52aWEpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHBhcmFtcy52aWEpID09PSAnc3RyaW5nJykgdmlhID0gW3BhcmFtcy52aWFdO1xuICAgICAgICAgICAgICAgIGVsc2UgdmlhID0gcGFyYW1zLnZpYTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIGV2ZW50X2lkOiBldmVudElkLFxuICAgICAgICAgICAgICAgIHZpYV9zZXJ2ZXJzOiB2aWEsXG4gICAgICAgICAgICAgICAgLy8gSWYgYW4gZXZlbnQgSUQgaXMgZ2l2ZW4gaW4gdGhlIFVSTCBoYXNoLCBub3RpZnkgUm9vbVZpZXdTdG9yZSB0byBtYXJrXG4gICAgICAgICAgICAgICAgLy8gaXQgYXMgaGlnaGxpZ2h0ZWQsIHdoaWNoIHdpbGwgcHJvcGFnYXRlIHRvIFJvb21WaWV3IGFuZCBoaWdobGlnaHQgdGhlXG4gICAgICAgICAgICAgICAgLy8gYXNzb2NpYXRlZCBFdmVudFRpbGUuXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWQ6IEJvb2xlYW4oZXZlbnRJZCksXG4gICAgICAgICAgICAgICAgdGhpcmRfcGFydHlfaW52aXRlOiB0aGlyZFBhcnR5SW52aXRlLFxuICAgICAgICAgICAgICAgIG9vYl9kYXRhOiBvb2JEYXRhLFxuICAgICAgICAgICAgICAgIHJvb21fYWxpYXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICByb29tX2lkOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHJvb21TdHJpbmdbMF0gPT09ICcjJykge1xuICAgICAgICAgICAgICAgIHBheWxvYWQucm9vbV9hbGlhcyA9IHJvb21TdHJpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBheWxvYWQucm9vbV9pZCA9IHJvb21TdHJpbmc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaChwYXlsb2FkKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY3JlZW4uaW5kZXhPZigndXNlci8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgdXNlcklkID0gc2NyZWVuLnN1YnN0cmluZyg1KTtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld191c2VyX2luZm8nLFxuICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICAgICAgICAgIHN1YkFjdGlvbjogcGFyYW1zLmFjdGlvbixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjcmVlbi5pbmRleE9mKCdncm91cC8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZ3JvdXBJZCA9IHNjcmVlbi5zdWJzdHJpbmcoNik7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IENoZWNrIHZhbGlkIGdyb3VwIElEXG5cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19ncm91cCcsXG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIklnbm9yaW5nIHNob3dTY3JlZW4gZm9yICclcydcIiwgc2NyZWVuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5vdGlmeU5ld1NjcmVlbihzY3JlZW46IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbk5ld1NjcmVlbikge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk5ld1NjcmVlbihzY3JlZW4pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0UGFnZVN1YnRpdGxlKCk7XG4gICAgfVxuXG4gICAgb25BbGlhc0NsaWNrKGV2ZW50OiBNb3VzZUV2ZW50LCBhbGlhczogc3RyaW5nKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndmlld19yb29tJywgcm9vbV9hbGlhczogYWxpYXN9KTtcbiAgICB9XG5cbiAgICBvblVzZXJDbGljayhldmVudDogTW91c2VFdmVudCwgdXNlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBtZW1iZXIgPSBuZXcgUm9vbU1lbWJlcihudWxsLCB1c2VySWQpO1xuICAgICAgICBpZiAoIW1lbWJlcikgeyByZXR1cm47IH1cbiAgICAgICAgZGlzLmRpc3BhdGNoPFZpZXdVc2VyUGF5bG9hZD4oe1xuICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICBtZW1iZXI6IG1lbWJlcixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Hcm91cENsaWNrKGV2ZW50OiBNb3VzZUV2ZW50LCBncm91cElkOiBzdHJpbmcpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd2aWV3X2dyb3VwJywgZ3JvdXBfaWQ6IGdyb3VwSWR9KTtcbiAgICB9XG5cbiAgICBvbkxvZ291dENsaWNrKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxBbmNob3JFbGVtZW50LCBNb3VzZUV2ZW50Pikge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAnbG9nb3V0JyxcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlc2l6ZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgaGlkZUxoc1RocmVzaG9sZCA9IDEwMDA7XG4gICAgICAgIGNvbnN0IHNob3dMaHNUaHJlc2hvbGQgPSAxMDAwO1xuXG4gICAgICAgIGlmICh0aGlzLndpbmRvd1dpZHRoID4gaGlkZUxoc1RocmVzaG9sZCAmJiB3aW5kb3cuaW5uZXJXaWR0aCA8PSBoaWRlTGhzVGhyZXNob2xkKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICdoaWRlX2xlZnRfcGFuZWwnIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLndpbmRvd1dpZHRoIDw9IHNob3dMaHNUaHJlc2hvbGQgJiYgd2luZG93LmlubmVyV2lkdGggPiBzaG93TGhzVGhyZXNob2xkKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICdzaG93X2xlZnRfcGFuZWwnIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZS5yZXNpemVOb3RpZmllci5ub3RpZnlXaW5kb3dSZXNpemVkKCk7XG4gICAgICAgIHRoaXMud2luZG93V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBkaXNwYXRjaFRpbWVsaW5lUmVzaXplKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICd0aW1lbGluZV9yZXNpemUnIH0pO1xuICAgIH1cblxuICAgIG9uUm9vbUNyZWF0ZWQocm9vbUlkOiBzdHJpbmcpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJ2aWV3X3Jvb21cIixcbiAgICAgICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25SZWdpc3RlckNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dTY3JlZW4oXCJyZWdpc3RlclwiKTtcbiAgICB9O1xuXG4gICAgb25Mb2dpbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dTY3JlZW4oXCJsb2dpblwiKTtcbiAgICB9O1xuXG4gICAgb25Gb3Jnb3RQYXNzd29yZENsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dTY3JlZW4oXCJmb3Jnb3RfcGFzc3dvcmRcIik7XG4gICAgfTtcblxuICAgIG9uUmVnaXN0ZXJGbG93Q29tcGxldGUgPSAoY3JlZGVudGlhbHM6IG9iamVjdCwgcGFzc3dvcmQ6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5vblVzZXJDb21wbGV0ZWRMb2dpbkZsb3coY3JlZGVudGlhbHMsIHBhc3N3b3JkKTtcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gdGhlIG5ldyBNYXRyaXhDbGllbnRcbiAgICBvblJlZ2lzdGVyZWQoY3JlZGVudGlhbHM6IG9iamVjdCkge1xuICAgICAgICByZXR1cm4gTGlmZWN5Y2xlLnNldExvZ2dlZEluKGNyZWRlbnRpYWxzKTtcbiAgICB9XG5cbiAgICBvbkZpbmlzaFBvc3RSZWdpc3RyYXRpb24gPSAoKSA9PiB7XG4gICAgICAgIC8vIERvbid0IGNvbmZ1c2UgdGhpcyB3aXRoIFwiUGFnZVR5cGVcIiB3aGljaCBpcyB0aGUgbWlkZGxlIHdpbmRvdyB0byBzaG93XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdmlldzogVmlld3MuTE9HR0VEX0lOLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zaG93U2NyZWVuKFwic2V0dGluZ3NcIik7XG4gICAgfTtcblxuICAgIG9uVmVyc2lvbihjdXJyZW50OiBzdHJpbmcsIGxhdGVzdDogc3RyaW5nLCByZWxlYXNlTm90ZXM/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB2ZXJzaW9uOiBjdXJyZW50LFxuICAgICAgICAgICAgbmV3VmVyc2lvbjogbGF0ZXN0LFxuICAgICAgICAgICAgaGFzTmV3VmVyc2lvbjogY3VycmVudCAhPT0gbGF0ZXN0LFxuICAgICAgICAgICAgbmV3VmVyc2lvblJlbGVhc2VOb3RlczogcmVsZWFzZU5vdGVzLFxuICAgICAgICAgICAgY2hlY2tpbmdGb3JVcGRhdGU6IG51bGwsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uU2VuZEV2ZW50KHJvb21JZDogc3RyaW5nLCBldmVudDogTWF0cml4RXZlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoIWNsaSkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdtZXNzYWdlX3NlbmRfZmFpbGVkJ30pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xpLnNlbmRFdmVudChyb29tSWQsIGV2ZW50LmdldFR5cGUoKSwgZXZlbnQuZ2V0Q29udGVudCgpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnbWVzc2FnZV9zZW50J30pO1xuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ21lc3NhZ2Vfc2VuZF9mYWlsZWQnfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0UGFnZVN1YnRpdGxlKHN1YnRpdGxlID0gJycpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY3VycmVudFJvb21JZCkge1xuICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IGNsaWVudCAmJiBjbGllbnQuZ2V0Um9vbSh0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWQpO1xuICAgICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgICAgICBzdWJ0aXRsZSA9IGAke3RoaXMuc3ViVGl0bGVTdGF0dXN9IHwgJHsgcm9vbS5uYW1lIH0gJHtzdWJ0aXRsZX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VidGl0bGUgPSBgJHt0aGlzLnN1YlRpdGxlU3RhdHVzfSAke3N1YnRpdGxlfWA7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBgJHtTZGtDb25maWcuZ2V0KCkuYnJhbmQgfHwgJ1Jpb3QnfSAke3N1YnRpdGxlfWA7XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdHVzSW5kaWNhdG9yKHN0YXRlOiBzdHJpbmcsIHByZXZTdGF0ZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vdGlmQ291bnQgPSBjb3VudFJvb21zV2l0aE5vdGlmKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tcygpKS5jb3VudDtcblxuICAgICAgICBpZiAoUGxhdGZvcm1QZWcuZ2V0KCkpIHtcbiAgICAgICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLnNldEVycm9yU3RhdHVzKHN0YXRlID09PSAnRVJST1InKTtcbiAgICAgICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLnNldE5vdGlmaWNhdGlvbkNvdW50KG5vdGlmQ291bnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdWJUaXRsZVN0YXR1cyA9ICcnO1xuICAgICAgICBpZiAoc3RhdGUgPT09IFwiRVJST1JcIikge1xuICAgICAgICAgICAgdGhpcy5zdWJUaXRsZVN0YXR1cyArPSBgWyR7X3QoXCJPZmZsaW5lXCIpfV0gYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm90aWZDb3VudCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3ViVGl0bGVTdGF0dXMgKz0gYFske25vdGlmQ291bnR9XWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFBhZ2VTdWJ0aXRsZSgpO1xuICAgIH1cblxuICAgIG9uQ2xvc2VBbGxTZXR0aW5ncygpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiAnY2xvc2Vfc2V0dGluZ3MnIH0pO1xuICAgIH1cblxuICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlID0gKHNlcnZlckNvbmZpZzogVmFsaWRhdGVkU2VydmVyQ29uZmlnKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlcnZlckNvbmZpZ30pO1xuICAgIH07XG5cbiAgICBwcml2YXRlIG1ha2VSZWdpc3RyYXRpb25VcmwgPSAocGFyYW1zOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zdGFydGluZ0ZyYWdtZW50UXVlcnlQYXJhbXMucmVmZXJyZXIpIHtcbiAgICAgICAgICAgIHBhcmFtcy5yZWZlcnJlciA9IHRoaXMucHJvcHMuc3RhcnRpbmdGcmFnbWVudFF1ZXJ5UGFyYW1zLnJlZmVycmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLm1ha2VSZWdpc3RyYXRpb25VcmwocGFyYW1zKTtcbiAgICB9O1xuXG4gICAgb25Vc2VyQ29tcGxldGVkTG9naW5GbG93ID0gYXN5bmMgKGNyZWRlbnRpYWxzOiBvYmplY3QsIHBhc3N3b3JkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGhpcy5hY2NvdW50UGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICAgICAgLy8gc2VsZi1kZXN0cnVjdCB0aGUgcGFzc3dvcmQgYWZ0ZXIgNW1pbnNcbiAgICAgICAgaWYgKHRoaXMuYWNjb3VudFBhc3N3b3JkVGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dCh0aGlzLmFjY291bnRQYXNzd29yZFRpbWVyKTtcbiAgICAgICAgdGhpcy5hY2NvdW50UGFzc3dvcmRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hY2NvdW50UGFzc3dvcmQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5hY2NvdW50UGFzc3dvcmRUaW1lciA9IG51bGw7XG4gICAgICAgIH0sIDYwICogNSAqIDEwMDApO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBjbGllbnQgdG8gYmUgbG9nZ2VkIGluIChidXQgbm90IHN0YXJ0ZWQpXG4gICAgICAgIC8vIHdoaWNoIGlzIGVub3VnaCB0byBhc2sgdGhlIHNlcnZlciBhYm91dCBhY2NvdW50IGRhdGEuXG4gICAgICAgIGNvbnN0IGxvZ2dlZEluID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25IYW5kbGVyUmVmID0gZGlzLnJlZ2lzdGVyKHBheWxvYWQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiAhPT0gXCJvbl9sb2dnZWRfaW5cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRpcy51bnJlZ2lzdGVyKGFjdGlvbkhhbmRsZXJSZWYpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgYW5kIHN0YXJ0IHRoZSBjbGllbnQgaW4gdGhlIGJhY2tncm91bmRcbiAgICAgICAgY29uc3Qgc2V0TG9nZ2VkSW5Qcm9taXNlID0gTGlmZWN5Y2xlLnNldExvZ2dlZEluKGNyZWRlbnRpYWxzKTtcbiAgICAgICAgYXdhaXQgbG9nZ2VkSW47XG5cbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAvLyBXZSdyZSBjaGVja2luZyBgaXNDcnlwdG9BdmFpbGFibGVgIGhlcmUgaW5zdGVhZCBvZiBgaXNDcnlwdG9FbmFibGVkYFxuICAgICAgICAvLyBiZWNhdXNlIHRoZSBjbGllbnQgaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXQuXG4gICAgICAgIGNvbnN0IGNyeXB0b0F2YWlsYWJsZSA9IGlzQ3J5cHRvQXZhaWxhYmxlKCk7XG4gICAgICAgIGlmICghY3J5cHRvQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9nZ2VkSW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBwZW5kaW5nSW5pdGlhbFN5bmM6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMuZmlyc3RTeW5jUHJvbWlzZS5wcm9taXNlO1xuXG4gICAgICAgIGlmICghY3J5cHRvQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgcGVuZGluZ0luaXRpYWxTeW5jOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIHJldHVybiBzZXRMb2dnZWRJblByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUZXN0IGZvciB0aGUgbWFzdGVyIGNyb3NzLXNpZ25pbmcga2V5IGluIFNTU1MgYXMgYSBxdWljayBwcm94eSBmb3JcbiAgICAgICAgLy8gd2hldGhlciBjcm9zcy1zaWduaW5nIGhhcyBiZWVuIHNldCB1cCBvbiB0aGUgYWNjb3VudC5cbiAgICAgICAgY29uc3QgbWFzdGVyS2V5SW5TdG9yYWdlID0gISFjbGkuZ2V0QWNjb3VudERhdGEoXCJtLmNyb3NzX3NpZ25pbmcubWFzdGVyXCIpO1xuICAgICAgICBpZiAobWFzdGVyS2V5SW5TdG9yYWdlKSB7XG4gICAgICAgICAgICAvLyBBdXRvLWVuYWJsZSBjcm9zcy1zaWduaW5nIGZvciB0aGUgbmV3IHNlc3Npb24gd2hlbiBrZXkgZm91bmQgaW5cbiAgICAgICAgICAgIC8vIHNlY3JldCBzdG9yYWdlLlxuICAgICAgICAgICAgU2V0dGluZ3NTdG9yZS5zZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGVGb3JOZXdWaWV3KHsgdmlldzogVmlld3MuQ09NUExFVEVfU0VDVVJJVFkgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpICYmXG4gICAgICAgICAgICBhd2FpdCBjbGkuZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUoXCJvcmcubWF0cml4LmUyZV9jcm9zc19zaWduaW5nXCIpXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gVGhpcyB3aWxsIG9ubHkgd29yayBpZiB0aGUgZmVhdHVyZSBpcyBzZXQgdG8gJ2VuYWJsZScgaW4gdGhlIGNvbmZpZyxcbiAgICAgICAgICAgIC8vIHNpbmNlIGl0J3MgdG9vIGVhcmx5IGluIHRoZSBsaWZlY3ljbGUgZm9yIHVzZXJzIHRvIGhhdmUgdHVybmVkIHRoZVxuICAgICAgICAgICAgLy8gbGFicyBmbGFnIG9uLlxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZUZvck5ld1ZpZXcoeyB2aWV3OiBWaWV3cy5FMkVfU0VUVVAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9nZ2VkSW4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgcGVuZGluZ0luaXRpYWxTeW5jOiBmYWxzZSB9KTtcblxuICAgICAgICByZXR1cm4gc2V0TG9nZ2VkSW5Qcm9taXNlO1xuICAgIH07XG5cbiAgICAvLyBjb21wbGV0ZSBzZWN1cml0eSAvIGUyZSBzZXR1cCBoYXMgZmluaXNoZWRcbiAgICBvbkNvbXBsZXRlU2VjdXJpdHlFMmVTZXR1cEZpbmlzaGVkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLm9uTG9nZ2VkSW4oKTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUmVuZGVyaW5nIE1hdHJpeENoYXQgd2l0aCB2aWV3ICR7dGhpcy5zdGF0ZS52aWV3fWApO1xuXG4gICAgICAgIGxldCBmcmFnbWVudEFmdGVyTG9naW4gPSBcIlwiO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5pbml0aWFsU2NyZWVuQWZ0ZXJMb2dpbikge1xuICAgICAgICAgICAgZnJhZ21lbnRBZnRlckxvZ2luID0gYC8ke3RoaXMucHJvcHMuaW5pdGlhbFNjcmVlbkFmdGVyTG9naW4uc2NyZWVufWA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdmlldztcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5MT0FESU5HKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICAgICAgdmlldyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeENoYXRfc3BsYXNoXCI+XG4gICAgICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUudmlldyA9PT0gVmlld3MuQ09NUExFVEVfU0VDVVJJVFkpIHtcbiAgICAgICAgICAgIGNvbnN0IENvbXBsZXRlU2VjdXJpdHkgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLmF1dGguQ29tcGxldGVTZWN1cml0eScpO1xuICAgICAgICAgICAgdmlldyA9IChcbiAgICAgICAgICAgICAgICA8Q29tcGxldGVTZWN1cml0eVxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLm9uQ29tcGxldGVTZWN1cml0eUUyZVNldHVwRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5FMkVfU0VUVVApIHtcbiAgICAgICAgICAgIGNvbnN0IEUyZVNldHVwID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5hdXRoLkUyZVNldHVwJyk7XG4gICAgICAgICAgICB2aWV3ID0gKFxuICAgICAgICAgICAgICAgIDxFMmVTZXR1cFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLm9uQ29tcGxldGVTZWN1cml0eUUyZVNldHVwRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRQYXNzd29yZD17dGhpcy5hY2NvdW50UGFzc3dvcmR9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5QT1NUX1JFR0lTVFJBVElPTikge1xuICAgICAgICAgICAgLy8gbmVlZHMgdG8gYmUgYmVmb3JlIG5vcm1hbCBQYWdlVHlwZXMgYXMgeW91IGFyZSBsb2dnZWQgaW4gdGVjaG5pY2FsbHlcbiAgICAgICAgICAgIGNvbnN0IFBvc3RSZWdpc3RyYXRpb24gPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLmF1dGguUG9zdFJlZ2lzdHJhdGlvbicpO1xuICAgICAgICAgICAgdmlldyA9IChcbiAgICAgICAgICAgICAgICA8UG9zdFJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlPXt0aGlzLm9uRmluaXNoUG9zdFJlZ2lzdHJhdGlvbn0gLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5MT0dHRURfSU4pIHtcbiAgICAgICAgICAgIC8vIHN0b3JlIGVycm9ycyBzdG9wIHRoZSBjbGllbnQgc3luY2luZyBhbmQgcmVxdWlyZSB1c2VyIGludGVydmVudGlvbiwgc28gd2UnbGxcbiAgICAgICAgICAgIC8vIGJlIHNob3dpbmcgYSBkaWFsb2cuIERvbid0IHNob3cgYW55dGhpbmcgZWxzZS5cbiAgICAgICAgICAgIGNvbnN0IGlzU3RvcmVFcnJvciA9IHRoaXMuc3RhdGUuc3luY0Vycm9yICYmIHRoaXMuc3RhdGUuc3luY0Vycm9yIGluc3RhbmNlb2YgSW52YWxpZFN0b3JlRXJyb3I7XG5cbiAgICAgICAgICAgIC8vIGByZWFkeWAgYW5kIGB2aWV3PT1MT0dHRURfSU5gIG1heSBiZSBzZXQgYmVmb3JlIGBwYWdlX3R5cGVgIChiZWNhdXNlIHRoZVxuICAgICAgICAgICAgLy8gbGF0dGVyIGlzIHNldCB2aWEgdGhlIGRpc3BhdGNoZXIpLiBJZiB3ZSBkb24ndCB5ZXQgaGF2ZSBhIGBwYWdlX3R5cGVgLFxuICAgICAgICAgICAgLy8ga2VlcCBzaG93aW5nIHRoZSBzcGlubmVyIGZvciBub3cuXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5yZWFkeSAmJiB0aGlzLnN0YXRlLnBhZ2VfdHlwZSAmJiAhaXNTdG9yZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgLyogZm9yIG5vdywgd2Ugc3R1ZmYgdGhlIGVudGlyZXR5IG9mIG91ciBwcm9wcyBhbmQgc3RhdGUgaW50byB0aGUgTG9nZ2VkSW5WaWV3LlxuICAgICAgICAgICAgICAgICAqIHdlIHNob3VsZCBnbyB0aHJvdWdoIGFuZCBmaWd1cmUgb3V0IHdoYXQgd2UgYWN0dWFsbHkgbmVlZCB0byBwYXNzIGRvd24sIGFzIHdlbGxcbiAgICAgICAgICAgICAgICAgKiBhcyB1c2luZyBzb21ldGhpbmcgbGlrZSByZWR1eCB0byBhdm9pZCBoYXZpbmcgYSBiaWxsaW9uIGJpdHMgb2Ygc3RhdGUga2lja2luZyBhcm91bmQuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3QgTG9nZ2VkSW5WaWV3ID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5Mb2dnZWRJblZpZXcnKTtcbiAgICAgICAgICAgICAgICB2aWV3ID0gKFxuICAgICAgICAgICAgICAgICAgICA8TG9nZ2VkSW5WaWV3XG4gICAgICAgICAgICAgICAgICAgICAgICB7Li4udGhpcy5wcm9wc31cbiAgICAgICAgICAgICAgICAgICAgICAgIHsuLi50aGlzLnN0YXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPXt0aGlzLmxvZ2dlZEluVmlld31cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudD17TWF0cml4Q2xpZW50UGVnLmdldCgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Sb29tQ3JlYXRlZD17dGhpcy5vblJvb21DcmVhdGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbG9zZUFsbFNldHRpbmdzPXt0aGlzLm9uQ2xvc2VBbGxTZXR0aW5nc31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVnaXN0ZXJlZD17dGhpcy5vblJlZ2lzdGVyZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Um9vbUlkPXt0aGlzLnN0YXRlLmN1cnJlbnRSb29tSWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93Q29va2llQmFyPXt0aGlzLnN0YXRlLnNob3dDb29raWVCYXJ9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2UgdGhpbmsgd2UgYXJlIGxvZ2dlZCBpbiwgYnV0IGFyZSBzdGlsbCB3YWl0aW5nIGZvciB0aGUgL3N5bmMgdG8gY29tcGxldGVcbiAgICAgICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICAgICAgICAgIGxldCBlcnJvckJveDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5zeW5jRXJyb3IgJiYgIWlzU3RvcmVFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckJveCA9IDxkaXYgY2xhc3NOYW1lPVwibXhfTWF0cml4Q2hhdF9zeW5jRXJyb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttZXNzYWdlRm9yU3luY0Vycm9yKHRoaXMuc3RhdGUuc3luY0Vycm9yKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2aWV3ID0gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeENoYXRfc3BsYXNoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7ZXJyb3JCb3h9XG4gICAgICAgICAgICAgICAgICAgICAgICA8U3Bpbm5lciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJteF9NYXRyaXhDaGF0X3NwbGFzaEJ1dHRvbnNcIiBvbkNsaWNrPXt0aGlzLm9uTG9nb3V0Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdCgnTG9nb3V0Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5XRUxDT01FKSB7XG4gICAgICAgICAgICBjb25zdCBXZWxjb21lID0gc2RrLmdldENvbXBvbmVudCgnYXV0aC5XZWxjb21lJyk7XG4gICAgICAgICAgICB2aWV3ID0gPFdlbGNvbWUgey4uLnRoaXMuZ2V0U2VydmVyUHJvcGVydGllcygpfSBmcmFnbWVudEFmdGVyTG9naW49e2ZyYWdtZW50QWZ0ZXJMb2dpbn0gLz47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5SRUdJU1RFUikge1xuICAgICAgICAgICAgY29uc3QgUmVnaXN0cmF0aW9uID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5hdXRoLlJlZ2lzdHJhdGlvbicpO1xuICAgICAgICAgICAgdmlldyA9IChcbiAgICAgICAgICAgICAgICA8UmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudFNlY3JldD17dGhpcy5zdGF0ZS5yZWdpc3Rlcl9jbGllbnRfc2VjcmV0fVxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWQ9e3RoaXMuc3RhdGUucmVnaXN0ZXJfc2Vzc2lvbl9pZH1cbiAgICAgICAgICAgICAgICAgICAgaWRTaWQ9e3RoaXMuc3RhdGUucmVnaXN0ZXJfaWRfc2lkfVxuICAgICAgICAgICAgICAgICAgICBlbWFpbD17dGhpcy5wcm9wcy5zdGFydGluZ0ZyYWdtZW50UXVlcnlQYXJhbXMuZW1haWx9XG4gICAgICAgICAgICAgICAgICAgIGJyYW5kPXt0aGlzLnByb3BzLmNvbmZpZy5icmFuZH1cbiAgICAgICAgICAgICAgICAgICAgbWFrZVJlZ2lzdHJhdGlvblVybD17dGhpcy5tYWtlUmVnaXN0cmF0aW9uVXJsfVxuICAgICAgICAgICAgICAgICAgICBvbkxvZ2dlZEluPXt0aGlzLm9uUmVnaXN0ZXJGbG93Q29tcGxldGV9XG4gICAgICAgICAgICAgICAgICAgIG9uTG9naW5DbGljaz17dGhpcy5vbkxvZ2luQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIG9uU2VydmVyQ29uZmlnQ2hhbmdlPXt0aGlzLm9uU2VydmVyQ29uZmlnQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWU9e3RoaXMucHJvcHMuZGVmYXVsdERldmljZURpc3BsYXlOYW1lfVxuICAgICAgICAgICAgICAgICAgICB7Li4udGhpcy5nZXRTZXJ2ZXJQcm9wZXJ0aWVzKCl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS52aWV3ID09PSBWaWV3cy5GT1JHT1RfUEFTU1dPUkQpIHtcbiAgICAgICAgICAgIGNvbnN0IEZvcmdvdFBhc3N3b3JkID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5hdXRoLkZvcmdvdFBhc3N3b3JkJyk7XG4gICAgICAgICAgICB2aWV3ID0gKFxuICAgICAgICAgICAgICAgIDxGb3Jnb3RQYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlPXt0aGlzLm9uTG9naW5DbGlja31cbiAgICAgICAgICAgICAgICAgICAgb25Mb2dpbkNsaWNrPXt0aGlzLm9uTG9naW5DbGlja31cbiAgICAgICAgICAgICAgICAgICAgb25TZXJ2ZXJDb25maWdDaGFuZ2U9e3RoaXMub25TZXJ2ZXJDb25maWdDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIHsuLi50aGlzLmdldFNlcnZlclByb3BlcnRpZXMoKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnZpZXcgPT09IFZpZXdzLkxPR0lOKSB7XG4gICAgICAgICAgICBjb25zdCBMb2dpbiA9IHNkay5nZXRDb21wb25lbnQoJ3N0cnVjdHVyZXMuYXV0aC5Mb2dpbicpO1xuICAgICAgICAgICAgdmlldyA9IChcbiAgICAgICAgICAgICAgICA8TG9naW5cbiAgICAgICAgICAgICAgICAgICAgaXNTeW5jaW5nPXt0aGlzLnN0YXRlLnBlbmRpbmdJbml0aWFsU3luY31cbiAgICAgICAgICAgICAgICAgICAgb25Mb2dnZWRJbj17dGhpcy5vblVzZXJDb21wbGV0ZWRMb2dpbkZsb3d9XG4gICAgICAgICAgICAgICAgICAgIG9uUmVnaXN0ZXJDbGljaz17dGhpcy5vblJlZ2lzdGVyQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrSHNVcmw9e3RoaXMuZ2V0RmFsbGJhY2tIc1VybCgpfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0RGV2aWNlRGlzcGxheU5hbWU9e3RoaXMucHJvcHMuZGVmYXVsdERldmljZURpc3BsYXlOYW1lfVxuICAgICAgICAgICAgICAgICAgICBvbkZvcmdvdFBhc3N3b3JkQ2xpY2s9e3RoaXMub25Gb3Jnb3RQYXNzd29yZENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBvblNlcnZlckNvbmZpZ0NoYW5nZT17dGhpcy5vblNlcnZlckNvbmZpZ0NoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBZnRlckxvZ2luPXtmcmFnbWVudEFmdGVyTG9naW59XG4gICAgICAgICAgICAgICAgICAgIHsuLi50aGlzLmdldFNlcnZlclByb3BlcnRpZXMoKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnZpZXcgPT09IFZpZXdzLlNPRlRfTE9HT1VUKSB7XG4gICAgICAgICAgICBjb25zdCBTb2Z0TG9nb3V0ID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5hdXRoLlNvZnRMb2dvdXQnKTtcbiAgICAgICAgICAgIHZpZXcgPSAoXG4gICAgICAgICAgICAgICAgPFNvZnRMb2dvdXRcbiAgICAgICAgICAgICAgICAgICAgcmVhbFF1ZXJ5UGFyYW1zPXt0aGlzLnByb3BzLnJlYWxRdWVyeVBhcmFtc31cbiAgICAgICAgICAgICAgICAgICAgb25Ub2tlbkxvZ2luQ29tcGxldGVkPXt0aGlzLnByb3BzLm9uVG9rZW5Mb2dpbkNvbXBsZXRlZH1cbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBZnRlckxvZ2luPXtmcmFnbWVudEFmdGVyTG9naW59XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmtub3duIHZpZXcgJHt0aGlzLnN0YXRlLnZpZXd9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBFcnJvckJvdW5kYXJ5ID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRXJyb3JCb3VuZGFyeScpO1xuICAgICAgICByZXR1cm4gPEVycm9yQm91bmRhcnk+XG4gICAgICAgICAgICB7dmlld31cbiAgICAgICAgPC9FcnJvckJvdW5kYXJ5PjtcbiAgICB9XG59XG4iXX0=