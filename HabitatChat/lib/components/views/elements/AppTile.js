"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _url = _interopRequireDefault(require("url"));

var _qs = _interopRequireDefault(require("qs"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _WidgetMessaging = _interopRequireDefault(require("../../../WidgetMessaging"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _AppPermission = _interopRequireDefault(require("./AppPermission"));

var _AppWarning = _interopRequireDefault(require("./AppWarning"));

var _MessageSpinner = _interopRequireDefault(require("./MessageSpinner"));

var _WidgetUtils = _interopRequireDefault(require("../../../utils/WidgetUtils"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _ActiveWidgetStore = _interopRequireDefault(require("../../../stores/ActiveWidgetStore"));

var _classnames = _interopRequireDefault(require("classnames"));

var _IntegrationManagers = require("../../../integrations/IntegrationManagers");

var _SettingsStore = _interopRequireWildcard(require("../../../settings/SettingsStore"));

var _ContextMenu = require("../../structures/ContextMenu");

var _PersistedElement = _interopRequireDefault(require("./PersistedElement"));

var _WidgetType = require("../../../widgets/WidgetType");

/*
Copyright 2017 Vector Creations Ltd
Copyright 2018 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2020 The Matrix.org Foundation C.I.C.

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
const ALLOWED_APP_URL_SCHEMES = ['https:', 'http:'];
const ENABLE_REACT_PERF = false;
/**
 * Does template substitution on a URL (or any string). Variables will be
 * passed through encodeURIComponent.
 * @param {string} uriTemplate The path with template variables e.g. '/foo/$bar'.
 * @param {Object} variables The key/value pairs to replace the template
 * variables with. E.g. { '$bar': 'baz' }.
 * @return {string} The result of replacing all template variables e.g. '/foo/baz'.
 */

function uriFromTemplate(uriTemplate, variables) {
  let out = uriTemplate;

  for (const [key, val] of Object.entries(variables)) {
    out = out.replace('$' + key, encodeURIComponent(val));
  }

  return out;
}

class AppTile extends _react.default.Component {
  constructor(props) {
    super(props); // The key used for PersistedElement

    (0, _defineProperty2.default)(this, "_onContextMenuClick", () => {
      this.setState({
        menuDisplayed: true
      });
    });
    (0, _defineProperty2.default)(this, "_closeContextMenu", () => {
      this.setState({
        menuDisplayed: false
      });
    });
    this._persistKey = 'widget_' + this.props.app.id;
    this.state = this._getNewState(props);
    this._onAction = this._onAction.bind(this);
    this._onLoaded = this._onLoaded.bind(this);
    this._onEditClick = this._onEditClick.bind(this);
    this._onDeleteClick = this._onDeleteClick.bind(this);
    this._onRevokeClicked = this._onRevokeClicked.bind(this);
    this._onSnapshotClick = this._onSnapshotClick.bind(this);
    this.onClickMenuBar = this.onClickMenuBar.bind(this);
    this._onMinimiseClick = this._onMinimiseClick.bind(this);
    this._grantWidgetPermission = this._grantWidgetPermission.bind(this);
    this._revokeWidgetPermission = this._revokeWidgetPermission.bind(this);
    this._onPopoutWidgetClick = this._onPopoutWidgetClick.bind(this);
    this._onReloadWidgetClick = this._onReloadWidgetClick.bind(this);
    this._contextMenuButton = (0, _react.createRef)();
    this._appFrame = (0, _react.createRef)();
    this._menu_bar = (0, _react.createRef)();
  }
  /**
   * Set initial component state when the App wUrl (widget URL) is being updated.
   * Component props *must* be passed (rather than relying on this.props).
   * @param  {Object} newProps The new properties of the component
   * @return {Object} Updated component state to be set with setState
   */


  _getNewState(newProps) {
    // This is a function to make the impact of calling SettingsStore slightly less
    const hasPermissionToLoad = () => {
      const currentlyAllowedWidgets = _SettingsStore.default.getValue("allowedWidgets", newProps.room.roomId);

      return !!currentlyAllowedWidgets[newProps.app.eventId];
    };

    const PersistedElement = sdk.getComponent("elements.PersistedElement");
    return {
      initialising: true,
      // True while we are mangling the widget URL
      // True while the iframe content is loading
      loading: this.props.waitForIframeLoad && !PersistedElement.isMounted(this._persistKey),
      widgetUrl: this._addWurlParams(newProps.app.url),
      // Assume that widget has permission to load if we are the user who
      // added it to the room, or if explicitly granted by the user
      hasPermissionToLoad: newProps.userId === newProps.creatorUserId || hasPermissionToLoad(),
      error: null,
      deleting: false,
      widgetPageTitle: newProps.widgetPageTitle,
      menuDisplayed: false
    };
  }
  /**
   * Does the widget support a given capability
   * @param  {string}  capability Capability to check for
   * @return {Boolean}            True if capability supported
   */


  _hasCapability(capability) {
    return _ActiveWidgetStore.default.widgetHasCapability(this.props.app.id, capability);
  }
  /**
   * Add widget instance specific parameters to pass in wUrl
   * Properties passed to widget instance:
   *  - widgetId
   *  - origin / parent URL
   * @param {string} urlString Url string to modify
   * @return {string}
   * Url string with parameters appended.
   * If url can not be parsed, it is returned unmodified.
   */


  _addWurlParams(urlString) {
    try {
      const parsed = new URL(urlString); // TODO: Replace these with proper widget params
      // See https://github.com/matrix-org/matrix-doc/pull/1958/files#r405714833

      parsed.searchParams.set('widgetId', this.props.app.id);
      parsed.searchParams.set('parentUrl', window.location.href.split('#', 2)[0]); // Replace the encoded dollar signs back to dollar signs. They have no special meaning
      // in HTTP, but URL parsers encode them anyways.

      return parsed.toString().replace(/%24/g, '$');
    } catch (e) {
      console.error("Failed to add widget URL params:", e);
      return urlString;
    }
  }

  isMixedContent() {
    const parentContentProtocol = window.location.protocol;

    const u = _url.default.parse(this.props.app.url);

    const childContentProtocol = u.protocol;

    if (parentContentProtocol === 'https:' && childContentProtocol !== 'https:') {
      console.warn("Refusing to load mixed-content app:", parentContentProtocol, childContentProtocol, window.location, this.props.app.url);
      return true;
    }

    return false;
  }

  componentDidMount() {
    // Only fetch IM token on mount if we're showing and have permission to load
    if (this.props.show && this.state.hasPermissionToLoad) {
      this.setScalarToken();
    } // Widget action listeners


    this.dispatcherRef = _dispatcher.default.register(this._onAction);
  }

  componentWillUnmount() {
    // Widget action listeners
    if (this.dispatcherRef) _dispatcher.default.unregister(this.dispatcherRef); // if it's not remaining on screen, get rid of the PersistedElement container

    if (!_ActiveWidgetStore.default.getWidgetPersistence(this.props.app.id)) {
      _ActiveWidgetStore.default.destroyPersistentWidget(this.props.app.id);

      const PersistedElement = sdk.getComponent("elements.PersistedElement");
      PersistedElement.destroyElement(this._persistKey);
    }
  } // TODO: Generify the name of this function. It's not just scalar tokens.

  /**
   * Adds a scalar token to the widget URL, if required
   * Component initialisation is only complete when this function has resolved
   */


  setScalarToken() {
    if (!_WidgetUtils.default.isScalarUrl(this.props.app.url)) {
      console.warn('Widget does not match integration manager, refusing to set auth token', _url.default);
      this.setState({
        error: null,
        widgetUrl: this._addWurlParams(this.props.app.url),
        initialising: false
      });
      return;
    }

    const managers = _IntegrationManagers.IntegrationManagers.sharedInstance();

    if (!managers.hasManager()) {
      console.warn("No integration manager - not setting scalar token", _url.default);
      this.setState({
        error: null,
        widgetUrl: this._addWurlParams(this.props.app.url),
        initialising: false
      });
      return;
    } // TODO: Pick the right manager for the widget


    const defaultManager = managers.getPrimaryManager();

    if (!_WidgetUtils.default.isScalarUrl(defaultManager.apiUrl)) {
      console.warn('Unknown integration manager, refusing to set auth token', _url.default);
      this.setState({
        error: null,
        widgetUrl: this._addWurlParams(this.props.app.url),
        initialising: false
      });
      return;
    } // Fetch the token before loading the iframe as we need it to mangle the URL


    if (!this._scalarClient) {
      this._scalarClient = defaultManager.getScalarClient();
    }

    this._scalarClient.getScalarToken().then(token => {
      // Append scalar_token as a query param if not already present
      this._scalarClient.scalarToken = token;

      const u = _url.default.parse(this._addWurlParams(this.props.app.url));

      const params = _qs.default.parse(u.query);

      if (!params.scalar_token) {
        params.scalar_token = encodeURIComponent(token); // u.search must be set to undefined, so that u.format() uses query parameters - https://nodejs.org/docs/latest/api/url.html#url_url_format_url_options

        u.search = undefined;
        u.query = params;
      }

      this.setState({
        error: null,
        widgetUrl: u.format(),
        initialising: false
      }); // Fetch page title from remote content if not already set

      if (!this.state.widgetPageTitle && params.url) {
        this._fetchWidgetTitle(params.url);
      }
    }, err => {
      console.error("Failed to get scalar_token", err);
      this.setState({
        error: err.message,
        initialising: false
      });
    });
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(nextProps) {
    // eslint-disable-line camelcase
    if (nextProps.app.url !== this.props.app.url) {
      this._getNewState(nextProps); // Fetch IM token for new URL if we're showing and have permission to load


      if (this.props.show && this.state.hasPermissionToLoad) {
        this.setScalarToken();
      }
    }

    if (nextProps.show && !this.props.show) {
      // We assume that persisted widgets are loaded and don't need a spinner.
      if (this.props.waitForIframeLoad && !_PersistedElement.default.isMounted(this._persistKey)) {
        this.setState({
          loading: true
        });
      } // Fetch IM token now that we're showing if we already have permission to load


      if (this.state.hasPermissionToLoad) {
        this.setScalarToken();
      }
    }

    if (nextProps.widgetPageTitle !== this.props.widgetPageTitle) {
      this.setState({
        widgetPageTitle: nextProps.widgetPageTitle
      });
    }
  }

  _canUserModify() {
    // User widgets should always be modifiable by their creator
    if (this.props.userWidget && _MatrixClientPeg.MatrixClientPeg.get().credentials.userId === this.props.creatorUserId) {
      return true;
    } // Check if the current user can modify widgets in the current room


    return _WidgetUtils.default.canUserModifyWidgets(this.props.room.roomId);
  }

  _onEditClick() {
    console.log("Edit widget ID ", this.props.app.id);

    if (this.props.onEditClick) {
      this.props.onEditClick();
    } else {
      // TODO: Open the right manager for the widget
      if (_SettingsStore.default.isFeatureEnabled("feature_many_integration_managers")) {
        _IntegrationManagers.IntegrationManagers.sharedInstance().openAll(this.props.room, 'type_' + this.props.type, this.props.app.id);
      } else {
        _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager().open(this.props.room, 'type_' + this.props.type, this.props.app.id);
      }
    }
  }

  _onSnapshotClick() {
    console.log("Requesting widget snapshot");

    _ActiveWidgetStore.default.getWidgetMessaging(this.props.app.id).getScreenshot().catch(err => {
      console.error("Failed to get screenshot", err);
    }).then(screenshot => {
      _dispatcher.default.dispatch({
        action: 'picture_snapshot',
        file: screenshot
      }, true);
    });
  }
  /**
   * Ends all widget interaction, such as cancelling calls and disabling webcams.
   * @private
   */


  _endWidgetActions() {
    // HACK: This is a really dirty way to ensure that Jitsi cleans up
    // its hold on the webcam. Without this, the widget holds a media
    // stream open, even after death. See https://github.com/vector-im/riot-web/issues/7351
    if (this._appFrame.current) {
      // In practice we could just do `+= ''` to trick the browser
      // into thinking the URL changed, however I can foresee this
      // being optimized out by a browser. Instead, we'll just point
      // the iframe at a page that is reasonably safe to use in the
      // event the iframe doesn't wink away.
      // This is relative to where the Riot instance is located.
      this._appFrame.current.src = 'about:blank';
    } // Delete the widget from the persisted store for good measure.


    _PersistedElement.default.destroyElement(this._persistKey);
  }
  /* If user has permission to modify widgets, delete the widget,
   * otherwise revoke access for the widget to load in the user's browser
  */


  _onDeleteClick() {
    if (this.props.onDeleteClick) {
      this.props.onDeleteClick();
    } else if (this._canUserModify()) {
      // Show delete confirmation dialog
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

      _Modal.default.createTrackedDialog('Delete Widget', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Delete Widget"),
        description: (0, _languageHandler._t)("Deleting a widget removes it for all users in this room." + " Are you sure you want to delete this widget?"),
        button: (0, _languageHandler._t)("Delete widget"),
        onFinished: confirmed => {
          if (!confirmed) {
            return;
          }

          this.setState({
            deleting: true
          });

          this._endWidgetActions();

          _WidgetUtils.default.setRoomWidget(this.props.room.roomId, this.props.app.id).catch(e => {
            console.error('Failed to delete widget', e);
            const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

            _Modal.default.createTrackedDialog('Failed to remove widget', '', ErrorDialog, {
              title: (0, _languageHandler._t)('Failed to remove widget'),
              description: (0, _languageHandler._t)('An error ocurred whilst trying to remove the widget from the room')
            });
          }).finally(() => {
            this.setState({
              deleting: false
            });
          });
        }
      });
    }
  }

  _onRevokeClicked() {
    console.info("Revoke widget permissions - %s", this.props.app.id);

    this._revokeWidgetPermission();
  }
  /**
   * Called when widget iframe has finished loading
   */


  _onLoaded() {
    // Destroy the old widget messaging before starting it back up again. Some widgets
    // have startup routines that run when they are loaded, so we just need to reinitialize
    // the messaging for them.
    _ActiveWidgetStore.default.delWidgetMessaging(this.props.app.id);

    this._setupWidgetMessaging();

    _ActiveWidgetStore.default.setRoomId(this.props.app.id, this.props.room.roomId);

    this.setState({
      loading: false
    });
  }

  _setupWidgetMessaging() {
    // FIXME: There's probably no reason to do this here: it should probably be done entirely
    // in ActiveWidgetStore.
    const widgetMessaging = new _WidgetMessaging.default(this.props.app.id, this.props.app.url, this._getRenderedUrl(), this.props.userWidget, this._appFrame.current.contentWindow);

    _ActiveWidgetStore.default.setWidgetMessaging(this.props.app.id, widgetMessaging);

    widgetMessaging.getCapabilities().then(requestedCapabilities => {
      console.log("Widget ".concat(this.props.app.id, " requested capabilities: ") + requestedCapabilities);
      requestedCapabilities = requestedCapabilities || []; // Allow whitelisted capabilities

      let requestedWhitelistCapabilies = [];

      if (this.props.whitelistCapabilities && this.props.whitelistCapabilities.length > 0) {
        requestedWhitelistCapabilies = requestedCapabilities.filter(function (e) {
          return this.indexOf(e) >= 0;
        }, this.props.whitelistCapabilities);

        if (requestedWhitelistCapabilies.length > 0) {
          console.log("Widget ".concat(this.props.app.id, " allowing requested, whitelisted properties: ") + requestedWhitelistCapabilies);
        }
      } // TODO -- Add UI to warn about and optionally allow requested capabilities


      _ActiveWidgetStore.default.setWidgetCapabilities(this.props.app.id, requestedWhitelistCapabilies);

      if (this.props.onCapabilityRequest) {
        this.props.onCapabilityRequest(requestedCapabilities);
      } // We only tell Jitsi widgets that we're ready because they're realistically the only ones
      // using this custom extension to the widget API.


      if (_WidgetType.WidgetType.JITSI.matches(this.props.app.type)) {
        widgetMessaging.flagReadyToContinue();
      }
    }).catch(err => {
      console.log("Failed to get capabilities for widget type ".concat(this.props.app.type), this.props.app.id, err);
    });
  }

  _onAction(payload) {
    if (payload.widgetId === this.props.app.id) {
      switch (payload.action) {
        case 'm.sticker':
          if (this._hasCapability('m.sticker')) {
            _dispatcher.default.dispatch({
              action: 'post_sticker_message',
              data: payload.data
            });
          } else {
            console.warn('Ignoring sticker message. Invalid capability');
          }

          break;
      }
    }
  }
  /**
   * Set remote content title on AppTile
   * @param {string} url Url to check for title
   */


  _fetchWidgetTitle(url) {
    this._scalarClient.getScalarPageTitle(url).then(widgetPageTitle => {
      if (widgetPageTitle) {
        this.setState({
          widgetPageTitle: widgetPageTitle
        });
      }
    }, err => {
      console.error("Failed to get page title", err);
    });
  }

  _grantWidgetPermission() {
    const roomId = this.props.room.roomId;
    console.info("Granting permission for widget to load: " + this.props.app.eventId);

    const current = _SettingsStore.default.getValue("allowedWidgets", roomId);

    current[this.props.app.eventId] = true;

    _SettingsStore.default.setValue("allowedWidgets", roomId, _SettingsStore.SettingLevel.ROOM_ACCOUNT, current).then(() => {
      this.setState({
        hasPermissionToLoad: true
      }); // Fetch a token for the integration manager, now that we're allowed to

      this.setScalarToken();
    }).catch(err => {
      console.error(err); // We don't really need to do anything about this - the user will just hit the button again.
    });
  }

  _revokeWidgetPermission() {
    const roomId = this.props.room.roomId;
    console.info("Revoking permission for widget to load: " + this.props.app.eventId);

    const current = _SettingsStore.default.getValue("allowedWidgets", roomId);

    current[this.props.app.eventId] = false;

    _SettingsStore.default.setValue("allowedWidgets", roomId, _SettingsStore.SettingLevel.ROOM_ACCOUNT, current).then(() => {
      this.setState({
        hasPermissionToLoad: false
      }); // Force the widget to be non-persistent (able to be deleted/forgotten)

      _ActiveWidgetStore.default.destroyPersistentWidget(this.props.app.id);

      const PersistedElement = sdk.getComponent("elements.PersistedElement");
      PersistedElement.destroyElement(this._persistKey);
    }).catch(err => {
      console.error(err); // We don't really need to do anything about this - the user will just hit the button again.
    });
  }

  formatAppTileName() {
    let appTileName = "No name";

    if (this.props.app.name && this.props.app.name.trim()) {
      appTileName = this.props.app.name.trim();
    }

    return appTileName;
  }

  onClickMenuBar(ev) {
    ev.preventDefault(); // Ignore clicks on menu bar children

    if (ev.target !== this._menu_bar.current) {
      return;
    } // Toggle the view state of the apps drawer


    if (this.props.userWidget) {
      this._onMinimiseClick();
    } else {
      if (this.props.show) {
        // if we were being shown, end the widget as we're about to be minimized.
        this._endWidgetActions();
      }

      _dispatcher.default.dispatch({
        action: 'appsDrawer',
        show: !this.props.show
      });
    }
  }
  /**
   * Replace the widget template variables in a url with their values
   *
   * @param {string} u The URL with template variables
   * @param {string} widgetType The widget's type
   *
   * @returns {string} url with temlate variables replaced
   */


  _templatedUrl(u, widgetType
  /*: string*/
  ) {
    const targetData = {};

    if (_WidgetType.WidgetType.JITSI.matches(widgetType)) {
      targetData['domain'] = 'jitsi.riot.im'; // v1 jitsi widgets have this hardcoded
    }

    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId;

    const myUser = _MatrixClientPeg.MatrixClientPeg.get().getUser(myUserId);

    const vars = Object.assign(targetData, this.props.app.data, {
      'matrix_user_id': myUserId,
      'matrix_room_id': this.props.room.roomId,
      'matrix_display_name': myUser ? myUser.displayName : myUserId,
      'matrix_avatar_url': myUser ? _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(myUser.avatarUrl) : '',
      // TODO: Namespace themes through some standard
      'theme': _SettingsStore.default.getValue("theme")
    });

    if (vars.conferenceId === undefined) {
      // we'll need to parse the conference ID out of the URL for v1 Jitsi widgets
      const parsedUrl = new URL(this.props.app.url);
      vars.conferenceId = parsedUrl.searchParams.get("confId");
    }

    return uriFromTemplate(u, vars);
  }
  /**
   * Get the URL used in the iframe
   * In cases where we supply our own UI for a widget, this is an internal
   * URL different to the one used if the widget is popped out to a separate
   * tab / browser
   *
   * @returns {string} url
   */


  _getRenderedUrl() {
    let url;

    if (_WidgetType.WidgetType.JITSI.matches(this.props.app.type)) {
      console.log("Replacing Jitsi widget URL with local wrapper");
      url = _WidgetUtils.default.getLocalJitsiWrapperUrl({
        forLocalRender: true
      });
      url = this._addWurlParams(url);
    } else {
      url = this._getSafeUrl(this.state.widgetUrl);
    }

    return this._templatedUrl(url, this.props.app.type);
  }

  _getPopoutUrl() {
    if (_WidgetType.WidgetType.JITSI.matches(this.props.app.type)) {
      return this._templatedUrl(_WidgetUtils.default.getLocalJitsiWrapperUrl({
        forLocalRender: false
      }), this.props.app.type);
    } else {
      // use app.url, not state.widgetUrl, because we want the one without
      // the wURL params for the popped-out version.
      return this._templatedUrl(this._getSafeUrl(this.props.app.url), this.props.app.type);
    }
  }

  _getSafeUrl(u) {
    const parsedWidgetUrl = _url.default.parse(u, true);

    if (ENABLE_REACT_PERF) {
      parsedWidgetUrl.search = null;
      parsedWidgetUrl.query.react_perf = true;
    }

    let safeWidgetUrl = '';

    if (ALLOWED_APP_URL_SCHEMES.includes(parsedWidgetUrl.protocol)) {
      safeWidgetUrl = _url.default.format(parsedWidgetUrl);
    } // Replace all the dollar signs back to dollar signs as they don't affect HTTP at all.
    // We also need the dollar signs in-tact for variable substitution.


    return safeWidgetUrl.replace(/%24/g, '$');
  }

  _getTileTitle() {
    const name = this.formatAppTileName();

    const titleSpacer = /*#__PURE__*/_react.default.createElement("span", null, "\xA0-\xA0");

    let title = '';

    if (this.state.widgetPageTitle && this.state.widgetPageTitle != this.formatAppTileName()) {
      title = this.state.widgetPageTitle;
    }

    return /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("b", null, name), /*#__PURE__*/_react.default.createElement("span", null, title ? titleSpacer : '', title));
  }

  _onMinimiseClick(e) {
    if (this.props.onMinimiseClick) {
      this.props.onMinimiseClick();
    }
  }

  _onPopoutWidgetClick() {
    // Using Object.assign workaround as the following opens in a new window instead of a new tab.
    // window.open(this._getPopoutUrl(), '_blank', 'noopener=yes');
    Object.assign(document.createElement('a'), {
      target: '_blank',
      href: this._getPopoutUrl(),
      rel: 'noreferrer noopener'
    }).click();
  }

  _onReloadWidgetClick() {
    // Reload iframe in this way to avoid cross-origin restrictions
    this._appFrame.current.src = this._appFrame.current.src;
  }

  render() {
    let appTileBody; // Don't render widget if it is in the process of being deleted

    if (this.state.deleting) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    } // Note that there is advice saying allow-scripts shouldn't be used with allow-same-origin
    // because that would allow the iframe to programmatically remove the sandbox attribute, but
    // this would only be for content hosted on the same origin as the riot client: anything
    // hosted on the same origin as the client will get the same access as if you clicked
    // a link to it.


    const sandboxFlags = "allow-forms allow-popups allow-popups-to-escape-sandbox " + "allow-same-origin allow-scripts allow-presentation"; // Additional iframe feature pemissions
    // (see - https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes and https://wicg.github.io/feature-policy/)

    const iframeFeatures = "microphone; camera; encrypted-media; autoplay;";
    const appTileBodyClass = 'mx_AppTileBody' + (this.props.miniMode ? '_mini  ' : ' ');

    if (this.props.show) {
      const loadingElement = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AppLoading_spinner_fadeIn"
      }, /*#__PURE__*/_react.default.createElement(_MessageSpinner.default, {
        msg: "Loading..."
      }));

      if (!this.state.hasPermissionToLoad) {
        const isEncrypted = _MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(this.props.room.roomId);

        appTileBody = /*#__PURE__*/_react.default.createElement("div", {
          className: appTileBodyClass
        }, /*#__PURE__*/_react.default.createElement(_AppPermission.default, {
          roomId: this.props.room.roomId,
          creatorUserId: this.props.creatorUserId,
          url: this.state.widgetUrl,
          isRoomEncrypted: isEncrypted,
          onPermissionGranted: this._grantWidgetPermission
        }));
      } else if (this.state.initialising) {
        appTileBody = /*#__PURE__*/_react.default.createElement("div", {
          className: appTileBodyClass + (this.state.loading ? 'mx_AppLoading' : '')
        }, loadingElement);
      } else {
        if (this.isMixedContent()) {
          appTileBody = /*#__PURE__*/_react.default.createElement("div", {
            className: appTileBodyClass
          }, /*#__PURE__*/_react.default.createElement(_AppWarning.default, {
            errorMsg: "Error - Mixed content"
          }));
        } else {
          appTileBody = /*#__PURE__*/_react.default.createElement("div", {
            className: appTileBodyClass + (this.state.loading ? 'mx_AppLoading' : '')
          }, this.state.loading && loadingElement, /*#__PURE__*/_react.default.createElement("iframe", {
            allow: iframeFeatures,
            ref: this._appFrame,
            src: this._getRenderedUrl(),
            allowFullScreen: true,
            sandbox: sandboxFlags,
            onLoad: this._onLoaded
          })); // if the widget would be allowed to remain on screen, we must put it in
          // a PersistedElement from the get-go, otherwise the iframe will be
          // re-mounted later when we do.

          if (this.props.whitelistCapabilities.includes('m.always_on_screen')) {
            const PersistedElement = sdk.getComponent("elements.PersistedElement"); // Also wrap the PersistedElement in a div to fix the height, otherwise
            // AppTile's border is in the wrong place

            appTileBody = /*#__PURE__*/_react.default.createElement("div", {
              className: "mx_AppTile_persistedWrapper"
            }, /*#__PURE__*/_react.default.createElement(PersistedElement, {
              persistKey: this._persistKey
            }, appTileBody));
          }
        }
      }
    }

    const showMinimiseButton = this.props.showMinimise && this.props.show;
    const showMaximiseButton = this.props.showMinimise && !this.props.show;
    let appTileClass;

    if (this.props.miniMode) {
      appTileClass = 'mx_AppTile_mini';
    } else if (this.props.fullWidth) {
      appTileClass = 'mx_AppTileFullWidth';
    } else {
      appTileClass = 'mx_AppTile';
    }

    const menuBarClasses = (0, _classnames.default)({
      mx_AppTileMenuBar: true,
      mx_AppTileMenuBar_expanded: this.props.show
    });
    let contextMenu;

    if (this.state.menuDisplayed) {
      const elementRect = this._contextMenuButton.current.getBoundingClientRect();

      const canUserModify = this._canUserModify();

      const showEditButton = Boolean(this._scalarClient && canUserModify);
      const showDeleteButton = (this.props.showDelete === undefined || this.props.showDelete) && canUserModify;
      const showPictureSnapshotButton = this._hasCapability('m.capability.screenshot') && this.props.show;
      const WidgetContextMenu = sdk.getComponent('views.context_menus.WidgetContextMenu');
      contextMenu = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenu, (0, _extends2.default)({}, (0, _ContextMenu.aboveLeftOf)(elementRect, null), {
        onFinished: this._closeContextMenu
      }), /*#__PURE__*/_react.default.createElement(WidgetContextMenu, {
        onRevokeClicked: this._onRevokeClicked,
        onEditClicked: showEditButton ? this._onEditClick : undefined,
        onDeleteClicked: showDeleteButton ? this._onDeleteClick : undefined,
        onSnapshotClicked: showPictureSnapshotButton ? this._onSnapshotClick : undefined,
        onReloadClicked: this.props.showReload ? this._onReloadWidgetClick : undefined,
        onFinished: this._closeContextMenu
      }));
    }

    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: appTileClass,
      id: this.props.app.id
    }, this.props.showMenubar && /*#__PURE__*/_react.default.createElement("div", {
      ref: this._menu_bar,
      className: menuBarClasses,
      onClick: this.onClickMenuBar
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_AppTileMenuBarTitle",
      style: {
        pointerEvents: this.props.handleMinimisePointerEvents ? 'all' : false
      }
    }, showMinimiseButton && /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_AppTileMenuBar_iconButton mx_AppTileMenuBar_iconButton_minimise",
      title: (0, _languageHandler._t)('Minimize apps'),
      onClick: this._onMinimiseClick
    }), showMaximiseButton && /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_AppTileMenuBar_iconButton mx_AppTileMenuBar_iconButton_maximise",
      title: (0, _languageHandler._t)('Maximize apps'),
      onClick: this._onMinimiseClick
    }), this.props.showTitle && this._getTileTitle()), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_AppTileMenuBarWidgets"
    }, this.props.showPopout && /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_AppTileMenuBar_iconButton mx_AppTileMenuBar_iconButton_popout",
      title: (0, _languageHandler._t)('Popout widget'),
      onClick: this._onPopoutWidgetClick
    }), /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenuButton, {
      className: "mx_AppTileMenuBar_iconButton mx_AppTileMenuBar_iconButton_menu",
      label: (0, _languageHandler._t)('More options'),
      isExpanded: this.state.menuDisplayed,
      inputRef: this._contextMenuButton,
      onClick: this._onContextMenuClick
    }))), appTileBody), contextMenu);
  }

}

exports.default = AppTile;
AppTile.displayName = 'AppTile';
AppTile.propTypes = {
  app: _propTypes.default.object.isRequired,
  room: _propTypes.default.object.isRequired,
  // Specifying 'fullWidth' as true will render the app tile to fill the width of the app drawer continer.
  // This should be set to true when there is only one widget in the app drawer, otherwise it should be false.
  fullWidth: _propTypes.default.bool,
  // Optional. If set, renders a smaller view of the widget
  miniMode: _propTypes.default.bool,
  // UserId of the current user
  userId: _propTypes.default.string.isRequired,
  // UserId of the entity that added / modified the widget
  creatorUserId: _propTypes.default.string,
  waitForIframeLoad: _propTypes.default.bool,
  showMenubar: _propTypes.default.bool,
  // Should the AppTile render itself
  show: _propTypes.default.bool,
  // Optional onEditClickHandler (overrides default behaviour)
  onEditClick: _propTypes.default.func,
  // Optional onDeleteClickHandler (overrides default behaviour)
  onDeleteClick: _propTypes.default.func,
  // Optional onMinimiseClickHandler
  onMinimiseClick: _propTypes.default.func,
  // Optionally hide the tile title
  showTitle: _propTypes.default.bool,
  // Optionally hide the tile minimise icon
  showMinimise: _propTypes.default.bool,
  // Optionally handle minimise button pointer events (default false)
  handleMinimisePointerEvents: _propTypes.default.bool,
  // Optionally hide the delete icon
  showDelete: _propTypes.default.bool,
  // Optionally hide the popout widget icon
  showPopout: _propTypes.default.bool,
  // Optionally show the reload widget icon
  // This is not currently intended for use with production widgets. However
  // it can be useful when developing persistent widgets in order to avoid
  // having to reload all of riot to get new widget content.
  showReload: _propTypes.default.bool,
  // Widget capabilities to allow by default (without user confirmation)
  // NOTE -- Use with caution. This is intended to aid better integration / UX
  // basic widget capabilities, e.g. injecting sticker message events.
  whitelistCapabilities: _propTypes.default.array,
  // Optional function to be called on widget capability request
  // Called with an array of the requested capabilities
  onCapabilityRequest: _propTypes.default.func,
  // Is this an instance of a user widget
  userWidget: _propTypes.default.bool
};
AppTile.defaultProps = {
  waitForIframeLoad: true,
  showMenubar: true,
  showTitle: true,
  showMinimise: true,
  showDelete: true,
  showPopout: true,
  showReload: false,
  handleMinimisePointerEvents: false,
  whitelistCapabilities: [],
  userWidget: false,
  miniMode: false
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0FwcFRpbGUuanMiXSwibmFtZXMiOlsiQUxMT1dFRF9BUFBfVVJMX1NDSEVNRVMiLCJFTkFCTEVfUkVBQ1RfUEVSRiIsInVyaUZyb21UZW1wbGF0ZSIsInVyaVRlbXBsYXRlIiwidmFyaWFibGVzIiwib3V0Iiwia2V5IiwidmFsIiwiT2JqZWN0IiwiZW50cmllcyIsInJlcGxhY2UiLCJlbmNvZGVVUklDb21wb25lbnQiLCJBcHBUaWxlIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwic2V0U3RhdGUiLCJtZW51RGlzcGxheWVkIiwiX3BlcnNpc3RLZXkiLCJhcHAiLCJpZCIsInN0YXRlIiwiX2dldE5ld1N0YXRlIiwiX29uQWN0aW9uIiwiYmluZCIsIl9vbkxvYWRlZCIsIl9vbkVkaXRDbGljayIsIl9vbkRlbGV0ZUNsaWNrIiwiX29uUmV2b2tlQ2xpY2tlZCIsIl9vblNuYXBzaG90Q2xpY2siLCJvbkNsaWNrTWVudUJhciIsIl9vbk1pbmltaXNlQ2xpY2siLCJfZ3JhbnRXaWRnZXRQZXJtaXNzaW9uIiwiX3Jldm9rZVdpZGdldFBlcm1pc3Npb24iLCJfb25Qb3BvdXRXaWRnZXRDbGljayIsIl9vblJlbG9hZFdpZGdldENsaWNrIiwiX2NvbnRleHRNZW51QnV0dG9uIiwiX2FwcEZyYW1lIiwiX21lbnVfYmFyIiwibmV3UHJvcHMiLCJoYXNQZXJtaXNzaW9uVG9Mb2FkIiwiY3VycmVudGx5QWxsb3dlZFdpZGdldHMiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJyb29tIiwicm9vbUlkIiwiZXZlbnRJZCIsIlBlcnNpc3RlZEVsZW1lbnQiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJpbml0aWFsaXNpbmciLCJsb2FkaW5nIiwid2FpdEZvcklmcmFtZUxvYWQiLCJpc01vdW50ZWQiLCJ3aWRnZXRVcmwiLCJfYWRkV3VybFBhcmFtcyIsInVybCIsInVzZXJJZCIsImNyZWF0b3JVc2VySWQiLCJlcnJvciIsImRlbGV0aW5nIiwid2lkZ2V0UGFnZVRpdGxlIiwiX2hhc0NhcGFiaWxpdHkiLCJjYXBhYmlsaXR5IiwiQWN0aXZlV2lkZ2V0U3RvcmUiLCJ3aWRnZXRIYXNDYXBhYmlsaXR5IiwidXJsU3RyaW5nIiwicGFyc2VkIiwiVVJMIiwic2VhcmNoUGFyYW1zIiwic2V0Iiwid2luZG93IiwibG9jYXRpb24iLCJocmVmIiwic3BsaXQiLCJ0b1N0cmluZyIsImUiLCJjb25zb2xlIiwiaXNNaXhlZENvbnRlbnQiLCJwYXJlbnRDb250ZW50UHJvdG9jb2wiLCJwcm90b2NvbCIsInUiLCJwYXJzZSIsImNoaWxkQ29udGVudFByb3RvY29sIiwid2FybiIsImNvbXBvbmVudERpZE1vdW50Iiwic2hvdyIsInNldFNjYWxhclRva2VuIiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwiZ2V0V2lkZ2V0UGVyc2lzdGVuY2UiLCJkZXN0cm95UGVyc2lzdGVudFdpZGdldCIsImRlc3Ryb3lFbGVtZW50IiwiV2lkZ2V0VXRpbHMiLCJpc1NjYWxhclVybCIsIm1hbmFnZXJzIiwiSW50ZWdyYXRpb25NYW5hZ2VycyIsInNoYXJlZEluc3RhbmNlIiwiaGFzTWFuYWdlciIsImRlZmF1bHRNYW5hZ2VyIiwiZ2V0UHJpbWFyeU1hbmFnZXIiLCJhcGlVcmwiLCJfc2NhbGFyQ2xpZW50IiwiZ2V0U2NhbGFyQ2xpZW50IiwiZ2V0U2NhbGFyVG9rZW4iLCJ0aGVuIiwidG9rZW4iLCJzY2FsYXJUb2tlbiIsInBhcmFtcyIsInFzIiwicXVlcnkiLCJzY2FsYXJfdG9rZW4iLCJzZWFyY2giLCJ1bmRlZmluZWQiLCJmb3JtYXQiLCJfZmV0Y2hXaWRnZXRUaXRsZSIsImVyciIsIm1lc3NhZ2UiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5leHRQcm9wcyIsIl9jYW5Vc2VyTW9kaWZ5IiwidXNlcldpZGdldCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImNyZWRlbnRpYWxzIiwiY2FuVXNlck1vZGlmeVdpZGdldHMiLCJsb2ciLCJvbkVkaXRDbGljayIsImlzRmVhdHVyZUVuYWJsZWQiLCJvcGVuQWxsIiwidHlwZSIsIm9wZW4iLCJnZXRXaWRnZXRNZXNzYWdpbmciLCJnZXRTY3JlZW5zaG90IiwiY2F0Y2giLCJzY3JlZW5zaG90IiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJmaWxlIiwiX2VuZFdpZGdldEFjdGlvbnMiLCJjdXJyZW50Iiwic3JjIiwib25EZWxldGVDbGljayIsIlF1ZXN0aW9uRGlhbG9nIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImJ1dHRvbiIsIm9uRmluaXNoZWQiLCJjb25maXJtZWQiLCJzZXRSb29tV2lkZ2V0IiwiRXJyb3JEaWFsb2ciLCJmaW5hbGx5IiwiaW5mbyIsImRlbFdpZGdldE1lc3NhZ2luZyIsIl9zZXR1cFdpZGdldE1lc3NhZ2luZyIsInNldFJvb21JZCIsIndpZGdldE1lc3NhZ2luZyIsIldpZGdldE1lc3NhZ2luZyIsIl9nZXRSZW5kZXJlZFVybCIsImNvbnRlbnRXaW5kb3ciLCJzZXRXaWRnZXRNZXNzYWdpbmciLCJnZXRDYXBhYmlsaXRpZXMiLCJyZXF1ZXN0ZWRDYXBhYmlsaXRpZXMiLCJyZXF1ZXN0ZWRXaGl0ZWxpc3RDYXBhYmlsaWVzIiwid2hpdGVsaXN0Q2FwYWJpbGl0aWVzIiwibGVuZ3RoIiwiZmlsdGVyIiwiaW5kZXhPZiIsInNldFdpZGdldENhcGFiaWxpdGllcyIsIm9uQ2FwYWJpbGl0eVJlcXVlc3QiLCJXaWRnZXRUeXBlIiwiSklUU0kiLCJtYXRjaGVzIiwiZmxhZ1JlYWR5VG9Db250aW51ZSIsInBheWxvYWQiLCJ3aWRnZXRJZCIsImRhdGEiLCJnZXRTY2FsYXJQYWdlVGl0bGUiLCJzZXRWYWx1ZSIsIlNldHRpbmdMZXZlbCIsIlJPT01fQUNDT1VOVCIsImZvcm1hdEFwcFRpbGVOYW1lIiwiYXBwVGlsZU5hbWUiLCJuYW1lIiwidHJpbSIsImV2IiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJfdGVtcGxhdGVkVXJsIiwid2lkZ2V0VHlwZSIsInRhcmdldERhdGEiLCJteVVzZXJJZCIsIm15VXNlciIsImdldFVzZXIiLCJ2YXJzIiwiYXNzaWduIiwiZGlzcGxheU5hbWUiLCJteGNVcmxUb0h0dHAiLCJhdmF0YXJVcmwiLCJjb25mZXJlbmNlSWQiLCJwYXJzZWRVcmwiLCJnZXRMb2NhbEppdHNpV3JhcHBlclVybCIsImZvckxvY2FsUmVuZGVyIiwiX2dldFNhZmVVcmwiLCJfZ2V0UG9wb3V0VXJsIiwicGFyc2VkV2lkZ2V0VXJsIiwicmVhY3RfcGVyZiIsInNhZmVXaWRnZXRVcmwiLCJpbmNsdWRlcyIsIl9nZXRUaWxlVGl0bGUiLCJ0aXRsZVNwYWNlciIsIm9uTWluaW1pc2VDbGljayIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInJlbCIsImNsaWNrIiwicmVuZGVyIiwiYXBwVGlsZUJvZHkiLCJzYW5kYm94RmxhZ3MiLCJpZnJhbWVGZWF0dXJlcyIsImFwcFRpbGVCb2R5Q2xhc3MiLCJtaW5pTW9kZSIsImxvYWRpbmdFbGVtZW50IiwiaXNFbmNyeXB0ZWQiLCJpc1Jvb21FbmNyeXB0ZWQiLCJzaG93TWluaW1pc2VCdXR0b24iLCJzaG93TWluaW1pc2UiLCJzaG93TWF4aW1pc2VCdXR0b24iLCJhcHBUaWxlQ2xhc3MiLCJmdWxsV2lkdGgiLCJtZW51QmFyQ2xhc3NlcyIsIm14X0FwcFRpbGVNZW51QmFyIiwibXhfQXBwVGlsZU1lbnVCYXJfZXhwYW5kZWQiLCJjb250ZXh0TWVudSIsImVsZW1lbnRSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiY2FuVXNlck1vZGlmeSIsInNob3dFZGl0QnV0dG9uIiwiQm9vbGVhbiIsInNob3dEZWxldGVCdXR0b24iLCJzaG93RGVsZXRlIiwic2hvd1BpY3R1cmVTbmFwc2hvdEJ1dHRvbiIsIldpZGdldENvbnRleHRNZW51IiwiX2Nsb3NlQ29udGV4dE1lbnUiLCJzaG93UmVsb2FkIiwic2hvd01lbnViYXIiLCJwb2ludGVyRXZlbnRzIiwiaGFuZGxlTWluaW1pc2VQb2ludGVyRXZlbnRzIiwic2hvd1RpdGxlIiwic2hvd1BvcG91dCIsIl9vbkNvbnRleHRNZW51Q2xpY2siLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwiYm9vbCIsInN0cmluZyIsImZ1bmMiLCJhcnJheSIsImRlZmF1bHRQcm9wcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMENBLE1BQU1BLHVCQUF1QixHQUFHLENBQUMsUUFBRCxFQUFXLE9BQVgsQ0FBaEM7QUFDQSxNQUFNQyxpQkFBaUIsR0FBRyxLQUExQjtBQUVBOzs7Ozs7Ozs7QUFRQSxTQUFTQyxlQUFULENBQXlCQyxXQUF6QixFQUFzQ0MsU0FBdEMsRUFBaUQ7QUFDN0MsTUFBSUMsR0FBRyxHQUFHRixXQUFWOztBQUNBLE9BQUssTUFBTSxDQUFDRyxHQUFELEVBQU1DLEdBQU4sQ0FBWCxJQUF5QkMsTUFBTSxDQUFDQyxPQUFQLENBQWVMLFNBQWYsQ0FBekIsRUFBb0Q7QUFDaERDLElBQUFBLEdBQUcsR0FBR0EsR0FBRyxDQUFDSyxPQUFKLENBQ0YsTUFBTUosR0FESixFQUNTSyxrQkFBa0IsQ0FBQ0osR0FBRCxDQUQzQixDQUFOO0FBR0g7O0FBQ0QsU0FBT0YsR0FBUDtBQUNIOztBQUVjLE1BQU1PLE9BQU4sU0FBc0JDLGVBQU1DLFNBQTVCLENBQXNDO0FBQ2pEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU4sRUFEZSxDQUdmOztBQUhlLCtEQTBt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R0FBdUI7QUFDbkJwTixFQUFBQSxpQkFBaUIsRUFBRSxJQURBO0FBRW5Cc00sRUFBQUEsV0FBVyxFQUFFLElBRk07QUFHbkJHLEVBQUFBLFNBQVMsRUFBRSxJQUhRO0FBSW5CdEIsRUFBQUEsWUFBWSxFQUFFLElBSks7QUFLbkJjLEVBQUFBLFVBQVUsRUFBRSxJQUxPO0FBTW5CUyxFQUFBQSxVQUFVLEVBQUUsSUFOTztBQU9uQkwsRUFBQUEsVUFBVSxFQUFFLEtBUE87QUFRbkJHLEVBQUFBLDJCQUEyQixFQUFFLEtBUlY7QUFTbkJuRixFQUFBQSxxQkFBcUIsRUFBRSxFQVRKO0FBVW5CN0MsRUFBQUEsVUFBVSxFQUFFLEtBVk87QUFXbkJzRyxFQUFBQSxRQUFRLEVBQUU7QUFYUyxDQUF2QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgcXMgZnJvbSAncXMnO1xuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgV2lkZ2V0TWVzc2FnaW5nIGZyb20gJy4uLy4uLy4uL1dpZGdldE1lc3NhZ2luZyc7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tICcuL0FjY2Vzc2libGVCdXR0b24nO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgQXBwUGVybWlzc2lvbiBmcm9tICcuL0FwcFBlcm1pc3Npb24nO1xuaW1wb3J0IEFwcFdhcm5pbmcgZnJvbSAnLi9BcHBXYXJuaW5nJztcbmltcG9ydCBNZXNzYWdlU3Bpbm5lciBmcm9tICcuL01lc3NhZ2VTcGlubmVyJztcbmltcG9ydCBXaWRnZXRVdGlscyBmcm9tICcuLi8uLi8uLi91dGlscy9XaWRnZXRVdGlscyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgQWN0aXZlV2lkZ2V0U3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL0FjdGl2ZVdpZGdldFN0b3JlJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi4vLi4vLi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlLCB7U2V0dGluZ0xldmVsfSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IHthYm92ZUxlZnRPZiwgQ29udGV4dE1lbnUsIENvbnRleHRNZW51QnV0dG9ufSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuaW1wb3J0IFBlcnNpc3RlZEVsZW1lbnQgZnJvbSBcIi4vUGVyc2lzdGVkRWxlbWVudFwiO1xuaW1wb3J0IHtXaWRnZXRUeXBlfSBmcm9tIFwiLi4vLi4vLi4vd2lkZ2V0cy9XaWRnZXRUeXBlXCI7XG5cbmNvbnN0IEFMTE9XRURfQVBQX1VSTF9TQ0hFTUVTID0gWydodHRwczonLCAnaHR0cDonXTtcbmNvbnN0IEVOQUJMRV9SRUFDVF9QRVJGID0gZmFsc2U7XG5cbi8qKlxuICogRG9lcyB0ZW1wbGF0ZSBzdWJzdGl0dXRpb24gb24gYSBVUkwgKG9yIGFueSBzdHJpbmcpLiBWYXJpYWJsZXMgd2lsbCBiZVxuICogcGFzc2VkIHRocm91Z2ggZW5jb2RlVVJJQ29tcG9uZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHVyaVRlbXBsYXRlIFRoZSBwYXRoIHdpdGggdGVtcGxhdGUgdmFyaWFibGVzIGUuZy4gJy9mb28vJGJhcicuXG4gKiBAcGFyYW0ge09iamVjdH0gdmFyaWFibGVzIFRoZSBrZXkvdmFsdWUgcGFpcnMgdG8gcmVwbGFjZSB0aGUgdGVtcGxhdGVcbiAqIHZhcmlhYmxlcyB3aXRoLiBFLmcuIHsgJyRiYXInOiAnYmF6JyB9LlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgcmVzdWx0IG9mIHJlcGxhY2luZyBhbGwgdGVtcGxhdGUgdmFyaWFibGVzIGUuZy4gJy9mb28vYmF6Jy5cbiAqL1xuZnVuY3Rpb24gdXJpRnJvbVRlbXBsYXRlKHVyaVRlbXBsYXRlLCB2YXJpYWJsZXMpIHtcbiAgICBsZXQgb3V0ID0gdXJpVGVtcGxhdGU7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcykpIHtcbiAgICAgICAgb3V0ID0gb3V0LnJlcGxhY2UoXG4gICAgICAgICAgICAnJCcgKyBrZXksIGVuY29kZVVSSUNvbXBvbmVudCh2YWwpLFxuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBUaWxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgLy8gVGhlIGtleSB1c2VkIGZvciBQZXJzaXN0ZWRFbGVtZW50XG4gICAgICAgIHRoaXMuX3BlcnNpc3RLZXkgPSAnd2lkZ2V0XycgKyB0aGlzLnByb3BzLmFwcC5pZDtcblxuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5fZ2V0TmV3U3RhdGUocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuX29uQWN0aW9uID0gdGhpcy5fb25BY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25Mb2FkZWQgPSB0aGlzLl9vbkxvYWRlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbkVkaXRDbGljayA9IHRoaXMuX29uRWRpdENsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uRGVsZXRlQ2xpY2sgPSB0aGlzLl9vbkRlbGV0ZUNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uUmV2b2tlQ2xpY2tlZCA9IHRoaXMuX29uUmV2b2tlQ2xpY2tlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vblNuYXBzaG90Q2xpY2sgPSB0aGlzLl9vblNuYXBzaG90Q2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNsaWNrTWVudUJhciA9IHRoaXMub25DbGlja01lbnVCYXIuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25NaW5pbWlzZUNsaWNrID0gdGhpcy5fb25NaW5pbWlzZUNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2dyYW50V2lkZ2V0UGVybWlzc2lvbiA9IHRoaXMuX2dyYW50V2lkZ2V0UGVybWlzc2lvbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXZva2VXaWRnZXRQZXJtaXNzaW9uID0gdGhpcy5fcmV2b2tlV2lkZ2V0UGVybWlzc2lvbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vblBvcG91dFdpZGdldENsaWNrID0gdGhpcy5fb25Qb3BvdXRXaWRnZXRDbGljay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vblJlbG9hZFdpZGdldENsaWNrID0gdGhpcy5fb25SZWxvYWRXaWRnZXRDbGljay5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuX2NvbnRleHRNZW51QnV0dG9uID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIHRoaXMuX2FwcEZyYW1lID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIHRoaXMuX21lbnVfYmFyID0gY3JlYXRlUmVmKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGluaXRpYWwgY29tcG9uZW50IHN0YXRlIHdoZW4gdGhlIEFwcCB3VXJsICh3aWRnZXQgVVJMKSBpcyBiZWluZyB1cGRhdGVkLlxuICAgICAqIENvbXBvbmVudCBwcm9wcyAqbXVzdCogYmUgcGFzc2VkIChyYXRoZXIgdGhhbiByZWx5aW5nIG9uIHRoaXMucHJvcHMpLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gbmV3UHJvcHMgVGhlIG5ldyBwcm9wZXJ0aWVzIG9mIHRoZSBjb21wb25lbnRcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFVwZGF0ZWQgY29tcG9uZW50IHN0YXRlIHRvIGJlIHNldCB3aXRoIHNldFN0YXRlXG4gICAgICovXG4gICAgX2dldE5ld1N0YXRlKG5ld1Byb3BzKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBmdW5jdGlvbiB0byBtYWtlIHRoZSBpbXBhY3Qgb2YgY2FsbGluZyBTZXR0aW5nc1N0b3JlIHNsaWdodGx5IGxlc3NcbiAgICAgICAgY29uc3QgaGFzUGVybWlzc2lvblRvTG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRseUFsbG93ZWRXaWRnZXRzID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImFsbG93ZWRXaWRnZXRzXCIsIG5ld1Byb3BzLnJvb20ucm9vbUlkKTtcbiAgICAgICAgICAgIHJldHVybiAhIWN1cnJlbnRseUFsbG93ZWRXaWRnZXRzW25ld1Byb3BzLmFwcC5ldmVudElkXTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBQZXJzaXN0ZWRFbGVtZW50ID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlBlcnNpc3RlZEVsZW1lbnRcIik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0aWFsaXNpbmc6IHRydWUsIC8vIFRydWUgd2hpbGUgd2UgYXJlIG1hbmdsaW5nIHRoZSB3aWRnZXQgVVJMXG4gICAgICAgICAgICAvLyBUcnVlIHdoaWxlIHRoZSBpZnJhbWUgY29udGVudCBpcyBsb2FkaW5nXG4gICAgICAgICAgICBsb2FkaW5nOiB0aGlzLnByb3BzLndhaXRGb3JJZnJhbWVMb2FkICYmICFQZXJzaXN0ZWRFbGVtZW50LmlzTW91bnRlZCh0aGlzLl9wZXJzaXN0S2V5KSxcbiAgICAgICAgICAgIHdpZGdldFVybDogdGhpcy5fYWRkV3VybFBhcmFtcyhuZXdQcm9wcy5hcHAudXJsKSxcbiAgICAgICAgICAgIC8vIEFzc3VtZSB0aGF0IHdpZGdldCBoYXMgcGVybWlzc2lvbiB0byBsb2FkIGlmIHdlIGFyZSB0aGUgdXNlciB3aG9cbiAgICAgICAgICAgIC8vIGFkZGVkIGl0IHRvIHRoZSByb29tLCBvciBpZiBleHBsaWNpdGx5IGdyYW50ZWQgYnkgdGhlIHVzZXJcbiAgICAgICAgICAgIGhhc1Blcm1pc3Npb25Ub0xvYWQ6IG5ld1Byb3BzLnVzZXJJZCA9PT0gbmV3UHJvcHMuY3JlYXRvclVzZXJJZCB8fCBoYXNQZXJtaXNzaW9uVG9Mb2FkKCksXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIGRlbGV0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIHdpZGdldFBhZ2VUaXRsZTogbmV3UHJvcHMud2lkZ2V0UGFnZVRpdGxlLFxuICAgICAgICAgICAgbWVudURpc3BsYXllZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9lcyB0aGUgd2lkZ2V0IHN1cHBvcnQgYSBnaXZlbiBjYXBhYmlsaXR5XG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgY2FwYWJpbGl0eSBDYXBhYmlsaXR5IHRvIGNoZWNrIGZvclxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgVHJ1ZSBpZiBjYXBhYmlsaXR5IHN1cHBvcnRlZFxuICAgICAqL1xuICAgIF9oYXNDYXBhYmlsaXR5KGNhcGFiaWxpdHkpIHtcbiAgICAgICAgcmV0dXJuIEFjdGl2ZVdpZGdldFN0b3JlLndpZGdldEhhc0NhcGFiaWxpdHkodGhpcy5wcm9wcy5hcHAuaWQsIGNhcGFiaWxpdHkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCB3aWRnZXQgaW5zdGFuY2Ugc3BlY2lmaWMgcGFyYW1ldGVycyB0byBwYXNzIGluIHdVcmxcbiAgICAgKiBQcm9wZXJ0aWVzIHBhc3NlZCB0byB3aWRnZXQgaW5zdGFuY2U6XG4gICAgICogIC0gd2lkZ2V0SWRcbiAgICAgKiAgLSBvcmlnaW4gLyBwYXJlbnQgVVJMXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFN0cmluZyBVcmwgc3RyaW5nIHRvIG1vZGlmeVxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKiBVcmwgc3RyaW5nIHdpdGggcGFyYW1ldGVycyBhcHBlbmRlZC5cbiAgICAgKiBJZiB1cmwgY2FuIG5vdCBiZSBwYXJzZWQsIGl0IGlzIHJldHVybmVkIHVubW9kaWZpZWQuXG4gICAgICovXG4gICAgX2FkZFd1cmxQYXJhbXModXJsU3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybFN0cmluZyk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IFJlcGxhY2UgdGhlc2Ugd2l0aCBwcm9wZXIgd2lkZ2V0IHBhcmFtc1xuICAgICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL21hdHJpeC1kb2MvcHVsbC8xOTU4L2ZpbGVzI3I0MDU3MTQ4MzNcbiAgICAgICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuc2V0KCd3aWRnZXRJZCcsIHRoaXMucHJvcHMuYXBwLmlkKTtcbiAgICAgICAgICAgIHBhcnNlZC5zZWFyY2hQYXJhbXMuc2V0KCdwYXJlbnRVcmwnLCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycsIDIpWzBdKTtcblxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgZW5jb2RlZCBkb2xsYXIgc2lnbnMgYmFjayB0byBkb2xsYXIgc2lnbnMuIFRoZXkgaGF2ZSBubyBzcGVjaWFsIG1lYW5pbmdcbiAgICAgICAgICAgIC8vIGluIEhUVFAsIGJ1dCBVUkwgcGFyc2VycyBlbmNvZGUgdGhlbSBhbnl3YXlzLlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlZC50b1N0cmluZygpLnJlcGxhY2UoLyUyNC9nLCAnJCcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGFkZCB3aWRnZXQgVVJMIHBhcmFtczpcIiwgZSk7XG4gICAgICAgICAgICByZXR1cm4gdXJsU3RyaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNNaXhlZENvbnRlbnQoKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudENvbnRlbnRQcm90b2NvbCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgICAgICAgY29uc3QgdSA9IHVybC5wYXJzZSh0aGlzLnByb3BzLmFwcC51cmwpO1xuICAgICAgICBjb25zdCBjaGlsZENvbnRlbnRQcm90b2NvbCA9IHUucHJvdG9jb2w7XG4gICAgICAgIGlmIChwYXJlbnRDb250ZW50UHJvdG9jb2wgPT09ICdodHRwczonICYmIGNoaWxkQ29udGVudFByb3RvY29sICE9PSAnaHR0cHM6Jykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiUmVmdXNpbmcgdG8gbG9hZCBtaXhlZC1jb250ZW50IGFwcDpcIixcbiAgICAgICAgICAgIHBhcmVudENvbnRlbnRQcm90b2NvbCwgY2hpbGRDb250ZW50UHJvdG9jb2wsIHdpbmRvdy5sb2NhdGlvbiwgdGhpcy5wcm9wcy5hcHAudXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgLy8gT25seSBmZXRjaCBJTSB0b2tlbiBvbiBtb3VudCBpZiB3ZSdyZSBzaG93aW5nIGFuZCBoYXZlIHBlcm1pc3Npb24gdG8gbG9hZFxuICAgICAgICBpZiAodGhpcy5wcm9wcy5zaG93ICYmIHRoaXMuc3RhdGUuaGFzUGVybWlzc2lvblRvTG9hZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTY2FsYXJUb2tlbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2lkZ2V0IGFjdGlvbiBsaXN0ZW5lcnNcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMuX29uQWN0aW9uKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgLy8gV2lkZ2V0IGFjdGlvbiBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKHRoaXMuZGlzcGF0Y2hlclJlZikgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcblxuICAgICAgICAvLyBpZiBpdCdzIG5vdCByZW1haW5pbmcgb24gc2NyZWVuLCBnZXQgcmlkIG9mIHRoZSBQZXJzaXN0ZWRFbGVtZW50IGNvbnRhaW5lclxuICAgICAgICBpZiAoIUFjdGl2ZVdpZGdldFN0b3JlLmdldFdpZGdldFBlcnNpc3RlbmNlKHRoaXMucHJvcHMuYXBwLmlkKSkge1xuICAgICAgICAgICAgQWN0aXZlV2lkZ2V0U3RvcmUuZGVzdHJveVBlcnNpc3RlbnRXaWRnZXQodGhpcy5wcm9wcy5hcHAuaWQpO1xuICAgICAgICAgICAgY29uc3QgUGVyc2lzdGVkRWxlbWVudCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5QZXJzaXN0ZWRFbGVtZW50XCIpO1xuICAgICAgICAgICAgUGVyc2lzdGVkRWxlbWVudC5kZXN0cm95RWxlbWVudCh0aGlzLl9wZXJzaXN0S2V5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IEdlbmVyaWZ5IHRoZSBuYW1lIG9mIHRoaXMgZnVuY3Rpb24uIEl0J3Mgbm90IGp1c3Qgc2NhbGFyIHRva2Vucy5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgc2NhbGFyIHRva2VuIHRvIHRoZSB3aWRnZXQgVVJMLCBpZiByZXF1aXJlZFxuICAgICAqIENvbXBvbmVudCBpbml0aWFsaXNhdGlvbiBpcyBvbmx5IGNvbXBsZXRlIHdoZW4gdGhpcyBmdW5jdGlvbiBoYXMgcmVzb2x2ZWRcbiAgICAgKi9cbiAgICBzZXRTY2FsYXJUb2tlbigpIHtcbiAgICAgICAgaWYgKCFXaWRnZXRVdGlscy5pc1NjYWxhclVybCh0aGlzLnByb3BzLmFwcC51cmwpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dpZGdldCBkb2VzIG5vdCBtYXRjaCBpbnRlZ3JhdGlvbiBtYW5hZ2VyLCByZWZ1c2luZyB0byBzZXQgYXV0aCB0b2tlbicsIHVybCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICB3aWRnZXRVcmw6IHRoaXMuX2FkZFd1cmxQYXJhbXModGhpcy5wcm9wcy5hcHAudXJsKSxcbiAgICAgICAgICAgICAgICBpbml0aWFsaXNpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYW5hZ2VycyA9IEludGVncmF0aW9uTWFuYWdlcnMuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgaWYgKCFtYW5hZ2Vycy5oYXNNYW5hZ2VyKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIGludGVncmF0aW9uIG1hbmFnZXIgLSBub3Qgc2V0dGluZyBzY2FsYXIgdG9rZW5cIiwgdXJsKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIHdpZGdldFVybDogdGhpcy5fYWRkV3VybFBhcmFtcyh0aGlzLnByb3BzLmFwcC51cmwpLFxuICAgICAgICAgICAgICAgIGluaXRpYWxpc2luZzogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IFBpY2sgdGhlIHJpZ2h0IG1hbmFnZXIgZm9yIHRoZSB3aWRnZXRcblxuICAgICAgICBjb25zdCBkZWZhdWx0TWFuYWdlciA9IG1hbmFnZXJzLmdldFByaW1hcnlNYW5hZ2VyKCk7XG4gICAgICAgIGlmICghV2lkZ2V0VXRpbHMuaXNTY2FsYXJVcmwoZGVmYXVsdE1hbmFnZXIuYXBpVXJsKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdVbmtub3duIGludGVncmF0aW9uIG1hbmFnZXIsIHJlZnVzaW5nIHRvIHNldCBhdXRoIHRva2VuJywgdXJsKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIHdpZGdldFVybDogdGhpcy5fYWRkV3VybFBhcmFtcyh0aGlzLnByb3BzLmFwcC51cmwpLFxuICAgICAgICAgICAgICAgIGluaXRpYWxpc2luZzogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZldGNoIHRoZSB0b2tlbiBiZWZvcmUgbG9hZGluZyB0aGUgaWZyYW1lIGFzIHdlIG5lZWQgaXQgdG8gbWFuZ2xlIHRoZSBVUkxcbiAgICAgICAgaWYgKCF0aGlzLl9zY2FsYXJDbGllbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NjYWxhckNsaWVudCA9IGRlZmF1bHRNYW5hZ2VyLmdldFNjYWxhckNsaWVudCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NjYWxhckNsaWVudC5nZXRTY2FsYXJUb2tlbigpLnRoZW4oKHRva2VuKSA9PiB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgc2NhbGFyX3Rva2VuIGFzIGEgcXVlcnkgcGFyYW0gaWYgbm90IGFscmVhZHkgcHJlc2VudFxuICAgICAgICAgICAgdGhpcy5fc2NhbGFyQ2xpZW50LnNjYWxhclRva2VuID0gdG9rZW47XG4gICAgICAgICAgICBjb25zdCB1ID0gdXJsLnBhcnNlKHRoaXMuX2FkZFd1cmxQYXJhbXModGhpcy5wcm9wcy5hcHAudXJsKSk7XG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBxcy5wYXJzZSh1LnF1ZXJ5KTtcbiAgICAgICAgICAgIGlmICghcGFyYW1zLnNjYWxhcl90b2tlbikge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5zY2FsYXJfdG9rZW4gPSBlbmNvZGVVUklDb21wb25lbnQodG9rZW4pO1xuICAgICAgICAgICAgICAgIC8vIHUuc2VhcmNoIG11c3QgYmUgc2V0IHRvIHVuZGVmaW5lZCwgc28gdGhhdCB1LmZvcm1hdCgpIHVzZXMgcXVlcnkgcGFyYW1ldGVycyAtIGh0dHBzOi8vbm9kZWpzLm9yZy9kb2NzL2xhdGVzdC9hcGkvdXJsLmh0bWwjdXJsX3VybF9mb3JtYXRfdXJsX29wdGlvbnNcbiAgICAgICAgICAgICAgICB1LnNlYXJjaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB1LnF1ZXJ5ID0gcGFyYW1zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICB3aWRnZXRVcmw6IHUuZm9ybWF0KCksXG4gICAgICAgICAgICAgICAgaW5pdGlhbGlzaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBGZXRjaCBwYWdlIHRpdGxlIGZyb20gcmVtb3RlIGNvbnRlbnQgaWYgbm90IGFscmVhZHkgc2V0XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUud2lkZ2V0UGFnZVRpdGxlICYmIHBhcmFtcy51cmwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9mZXRjaFdpZGdldFRpdGxlKHBhcmFtcy51cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGdldCBzY2FsYXJfdG9rZW5cIiwgZXJyKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBpbml0aWFsaXNpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIHdpdGggYXBwcm9wcmlhdGUgbGlmZWN5Y2xlIGV2ZW50XG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIGlmIChuZXh0UHJvcHMuYXBwLnVybCAhPT0gdGhpcy5wcm9wcy5hcHAudXJsKSB7XG4gICAgICAgICAgICB0aGlzLl9nZXROZXdTdGF0ZShuZXh0UHJvcHMpO1xuICAgICAgICAgICAgLy8gRmV0Y2ggSU0gdG9rZW4gZm9yIG5ldyBVUkwgaWYgd2UncmUgc2hvd2luZyBhbmQgaGF2ZSBwZXJtaXNzaW9uIHRvIGxvYWRcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnNob3cgJiYgdGhpcy5zdGF0ZS5oYXNQZXJtaXNzaW9uVG9Mb2FkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTY2FsYXJUb2tlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5leHRQcm9wcy5zaG93ICYmICF0aGlzLnByb3BzLnNob3cpIHtcbiAgICAgICAgICAgIC8vIFdlIGFzc3VtZSB0aGF0IHBlcnNpc3RlZCB3aWRnZXRzIGFyZSBsb2FkZWQgYW5kIGRvbid0IG5lZWQgYSBzcGlubmVyLlxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMud2FpdEZvcklmcmFtZUxvYWQgJiYgIVBlcnNpc3RlZEVsZW1lbnQuaXNNb3VudGVkKHRoaXMuX3BlcnNpc3RLZXkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGZXRjaCBJTSB0b2tlbiBub3cgdGhhdCB3ZSdyZSBzaG93aW5nIGlmIHdlIGFscmVhZHkgaGF2ZSBwZXJtaXNzaW9uIHRvIGxvYWRcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmhhc1Blcm1pc3Npb25Ub0xvYWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFNjYWxhclRva2VuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV4dFByb3BzLndpZGdldFBhZ2VUaXRsZSAhPT0gdGhpcy5wcm9wcy53aWRnZXRQYWdlVGl0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHdpZGdldFBhZ2VUaXRsZTogbmV4dFByb3BzLndpZGdldFBhZ2VUaXRsZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2NhblVzZXJNb2RpZnkoKSB7XG4gICAgICAgIC8vIFVzZXIgd2lkZ2V0cyBzaG91bGQgYWx3YXlzIGJlIG1vZGlmaWFibGUgYnkgdGhlaXIgY3JlYXRvclxuICAgICAgICBpZiAodGhpcy5wcm9wcy51c2VyV2lkZ2V0ICYmIE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWQgPT09IHRoaXMucHJvcHMuY3JlYXRvclVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgdXNlciBjYW4gbW9kaWZ5IHdpZGdldHMgaW4gdGhlIGN1cnJlbnQgcm9vbVxuICAgICAgICByZXR1cm4gV2lkZ2V0VXRpbHMuY2FuVXNlck1vZGlmeVdpZGdldHModGhpcy5wcm9wcy5yb29tLnJvb21JZCk7XG4gICAgfVxuXG4gICAgX29uRWRpdENsaWNrKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkVkaXQgd2lkZ2V0IElEIFwiLCB0aGlzLnByb3BzLmFwcC5pZCk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRWRpdENsaWNrKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRWRpdENsaWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBPcGVuIHRoZSByaWdodCBtYW5hZ2VyIGZvciB0aGUgd2lkZ2V0XG4gICAgICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKFwiZmVhdHVyZV9tYW55X2ludGVncmF0aW9uX21hbmFnZXJzXCIpKSB7XG4gICAgICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLm9wZW5BbGwoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMucm9vbSxcbiAgICAgICAgICAgICAgICAgICAgJ3R5cGVfJyArIHRoaXMucHJvcHMudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5hcHAuaWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLmdldFByaW1hcnlNYW5hZ2VyKCkub3BlbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tLFxuICAgICAgICAgICAgICAgICAgICAndHlwZV8nICsgdGhpcy5wcm9wcy50eXBlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmFwcC5pZCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uU25hcHNob3RDbGljaygpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJSZXF1ZXN0aW5nIHdpZGdldCBzbmFwc2hvdFwiKTtcbiAgICAgICAgQWN0aXZlV2lkZ2V0U3RvcmUuZ2V0V2lkZ2V0TWVzc2FnaW5nKHRoaXMucHJvcHMuYXBwLmlkKS5nZXRTY3JlZW5zaG90KClcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBnZXQgc2NyZWVuc2hvdFwiLCBlcnIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChzY3JlZW5zaG90KSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncGljdHVyZV9zbmFwc2hvdCcsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IHNjcmVlbnNob3QsXG4gICAgICAgICAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmRzIGFsbCB3aWRnZXQgaW50ZXJhY3Rpb24sIHN1Y2ggYXMgY2FuY2VsbGluZyBjYWxscyBhbmQgZGlzYWJsaW5nIHdlYmNhbXMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZW5kV2lkZ2V0QWN0aW9ucygpIHtcbiAgICAgICAgLy8gSEFDSzogVGhpcyBpcyBhIHJlYWxseSBkaXJ0eSB3YXkgdG8gZW5zdXJlIHRoYXQgSml0c2kgY2xlYW5zIHVwXG4gICAgICAgIC8vIGl0cyBob2xkIG9uIHRoZSB3ZWJjYW0uIFdpdGhvdXQgdGhpcywgdGhlIHdpZGdldCBob2xkcyBhIG1lZGlhXG4gICAgICAgIC8vIHN0cmVhbSBvcGVuLCBldmVuIGFmdGVyIGRlYXRoLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvNzM1MVxuICAgICAgICBpZiAodGhpcy5fYXBwRnJhbWUuY3VycmVudCkge1xuICAgICAgICAgICAgLy8gSW4gcHJhY3RpY2Ugd2UgY291bGQganVzdCBkbyBgKz0gJydgIHRvIHRyaWNrIHRoZSBicm93c2VyXG4gICAgICAgICAgICAvLyBpbnRvIHRoaW5raW5nIHRoZSBVUkwgY2hhbmdlZCwgaG93ZXZlciBJIGNhbiBmb3Jlc2VlIHRoaXNcbiAgICAgICAgICAgIC8vIGJlaW5nIG9wdGltaXplZCBvdXQgYnkgYSBicm93c2VyLiBJbnN0ZWFkLCB3ZSdsbCBqdXN0IHBvaW50XG4gICAgICAgICAgICAvLyB0aGUgaWZyYW1lIGF0IGEgcGFnZSB0aGF0IGlzIHJlYXNvbmFibHkgc2FmZSB0byB1c2UgaW4gdGhlXG4gICAgICAgICAgICAvLyBldmVudCB0aGUgaWZyYW1lIGRvZXNuJ3Qgd2luayBhd2F5LlxuICAgICAgICAgICAgLy8gVGhpcyBpcyByZWxhdGl2ZSB0byB3aGVyZSB0aGUgUmlvdCBpbnN0YW5jZSBpcyBsb2NhdGVkLlxuICAgICAgICAgICAgdGhpcy5fYXBwRnJhbWUuY3VycmVudC5zcmMgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVsZXRlIHRoZSB3aWRnZXQgZnJvbSB0aGUgcGVyc2lzdGVkIHN0b3JlIGZvciBnb29kIG1lYXN1cmUuXG4gICAgICAgIFBlcnNpc3RlZEVsZW1lbnQuZGVzdHJveUVsZW1lbnQodGhpcy5fcGVyc2lzdEtleSk7XG4gICAgfVxuXG4gICAgLyogSWYgdXNlciBoYXMgcGVybWlzc2lvbiB0byBtb2RpZnkgd2lkZ2V0cywgZGVsZXRlIHRoZSB3aWRnZXQsXG4gICAgICogb3RoZXJ3aXNlIHJldm9rZSBhY2Nlc3MgZm9yIHRoZSB3aWRnZXQgdG8gbG9hZCBpbiB0aGUgdXNlcidzIGJyb3dzZXJcbiAgICAqL1xuICAgIF9vbkRlbGV0ZUNsaWNrKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkRlbGV0ZUNsaWNrKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRGVsZXRlQ2xpY2soKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jYW5Vc2VyTW9kaWZ5KCkpIHtcbiAgICAgICAgICAgIC8vIFNob3cgZGVsZXRlIGNvbmZpcm1hdGlvbiBkaWFsb2dcbiAgICAgICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdEZWxldGUgV2lkZ2V0JywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRGVsZXRlIFdpZGdldFwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRGVsZXRpbmcgYSB3aWRnZXQgcmVtb3ZlcyBpdCBmb3IgYWxsIHVzZXJzIGluIHRoaXMgcm9vbS5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiIEFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyB3aWRnZXQ/XCIpLFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJEZWxldGUgd2lkZ2V0XCIpLFxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IChjb25maXJtZWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtkZWxldGluZzogdHJ1ZX0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VuZFdpZGdldEFjdGlvbnMoKTtcblxuICAgICAgICAgICAgICAgICAgICBXaWRnZXRVdGlscy5zZXRSb29tV2lkZ2V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tLnJvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuYXBwLmlkLFxuICAgICAgICAgICAgICAgICAgICApLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZGVsZXRlIHdpZGdldCcsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHJlbW92ZSB3aWRnZXQnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byByZW1vdmUgd2lkZ2V0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdBbiBlcnJvciBvY3VycmVkIHdoaWxzdCB0cnlpbmcgdG8gcmVtb3ZlIHRoZSB3aWRnZXQgZnJvbSB0aGUgcm9vbScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZGVsZXRpbmc6IGZhbHNlfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vblJldm9rZUNsaWNrZWQoKSB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIlJldm9rZSB3aWRnZXQgcGVybWlzc2lvbnMgLSAlc1wiLCB0aGlzLnByb3BzLmFwcC5pZCk7XG4gICAgICAgIHRoaXMuX3Jldm9rZVdpZGdldFBlcm1pc3Npb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB3aWRnZXQgaWZyYW1lIGhhcyBmaW5pc2hlZCBsb2FkaW5nXG4gICAgICovXG4gICAgX29uTG9hZGVkKCkge1xuICAgICAgICAvLyBEZXN0cm95IHRoZSBvbGQgd2lkZ2V0IG1lc3NhZ2luZyBiZWZvcmUgc3RhcnRpbmcgaXQgYmFjayB1cCBhZ2Fpbi4gU29tZSB3aWRnZXRzXG4gICAgICAgIC8vIGhhdmUgc3RhcnR1cCByb3V0aW5lcyB0aGF0IHJ1biB3aGVuIHRoZXkgYXJlIGxvYWRlZCwgc28gd2UganVzdCBuZWVkIHRvIHJlaW5pdGlhbGl6ZVxuICAgICAgICAvLyB0aGUgbWVzc2FnaW5nIGZvciB0aGVtLlxuICAgICAgICBBY3RpdmVXaWRnZXRTdG9yZS5kZWxXaWRnZXRNZXNzYWdpbmcodGhpcy5wcm9wcy5hcHAuaWQpO1xuICAgICAgICB0aGlzLl9zZXR1cFdpZGdldE1lc3NhZ2luZygpO1xuXG4gICAgICAgIEFjdGl2ZVdpZGdldFN0b3JlLnNldFJvb21JZCh0aGlzLnByb3BzLmFwcC5pZCwgdGhpcy5wcm9wcy5yb29tLnJvb21JZCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IGZhbHNlfSk7XG4gICAgfVxuXG4gICAgX3NldHVwV2lkZ2V0TWVzc2FnaW5nKCkge1xuICAgICAgICAvLyBGSVhNRTogVGhlcmUncyBwcm9iYWJseSBubyByZWFzb24gdG8gZG8gdGhpcyBoZXJlOiBpdCBzaG91bGQgcHJvYmFibHkgYmUgZG9uZSBlbnRpcmVseVxuICAgICAgICAvLyBpbiBBY3RpdmVXaWRnZXRTdG9yZS5cbiAgICAgICAgY29uc3Qgd2lkZ2V0TWVzc2FnaW5nID0gbmV3IFdpZGdldE1lc3NhZ2luZyhcbiAgICAgICAgICAgIHRoaXMucHJvcHMuYXBwLmlkLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5hcHAudXJsLFxuICAgICAgICAgICAgdGhpcy5fZ2V0UmVuZGVyZWRVcmwoKSxcbiAgICAgICAgICAgIHRoaXMucHJvcHMudXNlcldpZGdldCxcbiAgICAgICAgICAgIHRoaXMuX2FwcEZyYW1lLmN1cnJlbnQuY29udGVudFdpbmRvdyxcbiAgICAgICAgKTtcbiAgICAgICAgQWN0aXZlV2lkZ2V0U3RvcmUuc2V0V2lkZ2V0TWVzc2FnaW5nKHRoaXMucHJvcHMuYXBwLmlkLCB3aWRnZXRNZXNzYWdpbmcpO1xuICAgICAgICB3aWRnZXRNZXNzYWdpbmcuZ2V0Q2FwYWJpbGl0aWVzKCkudGhlbigocmVxdWVzdGVkQ2FwYWJpbGl0aWVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgV2lkZ2V0ICR7dGhpcy5wcm9wcy5hcHAuaWR9IHJlcXVlc3RlZCBjYXBhYmlsaXRpZXM6IGAgKyByZXF1ZXN0ZWRDYXBhYmlsaXRpZXMpO1xuICAgICAgICAgICAgcmVxdWVzdGVkQ2FwYWJpbGl0aWVzID0gcmVxdWVzdGVkQ2FwYWJpbGl0aWVzIHx8IFtdO1xuXG4gICAgICAgICAgICAvLyBBbGxvdyB3aGl0ZWxpc3RlZCBjYXBhYmlsaXRpZXNcbiAgICAgICAgICAgIGxldCByZXF1ZXN0ZWRXaGl0ZWxpc3RDYXBhYmlsaWVzID0gW107XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLndoaXRlbGlzdENhcGFiaWxpdGllcyAmJiB0aGlzLnByb3BzLndoaXRlbGlzdENhcGFiaWxpdGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkV2hpdGVsaXN0Q2FwYWJpbGllcyA9IHJlcXVlc3RlZENhcGFiaWxpdGllcy5maWx0ZXIoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKGUpPj0wO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMucHJvcHMud2hpdGVsaXN0Q2FwYWJpbGl0aWVzKTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0ZWRXaGl0ZWxpc3RDYXBhYmlsaWVzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXaWRnZXQgJHt0aGlzLnByb3BzLmFwcC5pZH0gYWxsb3dpbmcgcmVxdWVzdGVkLCB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzOiBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZFdoaXRlbGlzdENhcGFiaWxpZXMsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUT0RPIC0tIEFkZCBVSSB0byB3YXJuIGFib3V0IGFuZCBvcHRpb25hbGx5IGFsbG93IHJlcXVlc3RlZCBjYXBhYmlsaXRpZXNcblxuICAgICAgICAgICAgQWN0aXZlV2lkZ2V0U3RvcmUuc2V0V2lkZ2V0Q2FwYWJpbGl0aWVzKHRoaXMucHJvcHMuYXBwLmlkLCByZXF1ZXN0ZWRXaGl0ZWxpc3RDYXBhYmlsaWVzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25DYXBhYmlsaXR5UmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25DYXBhYmlsaXR5UmVxdWVzdChyZXF1ZXN0ZWRDYXBhYmlsaXRpZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHRlbGwgSml0c2kgd2lkZ2V0cyB0aGF0IHdlJ3JlIHJlYWR5IGJlY2F1c2UgdGhleSdyZSByZWFsaXN0aWNhbGx5IHRoZSBvbmx5IG9uZXNcbiAgICAgICAgICAgIC8vIHVzaW5nIHRoaXMgY3VzdG9tIGV4dGVuc2lvbiB0byB0aGUgd2lkZ2V0IEFQSS5cbiAgICAgICAgICAgIGlmIChXaWRnZXRUeXBlLkpJVFNJLm1hdGNoZXModGhpcy5wcm9wcy5hcHAudHlwZSkpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRNZXNzYWdpbmcuZmxhZ1JlYWR5VG9Db250aW51ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRmFpbGVkIHRvIGdldCBjYXBhYmlsaXRpZXMgZm9yIHdpZGdldCB0eXBlICR7dGhpcy5wcm9wcy5hcHAudHlwZX1gLCB0aGlzLnByb3BzLmFwcC5pZCwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX29uQWN0aW9uKHBheWxvYWQpIHtcbiAgICAgICAgaWYgKHBheWxvYWQud2lkZ2V0SWQgPT09IHRoaXMucHJvcHMuYXBwLmlkKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbS5zdGlja2VyJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFzQ2FwYWJpbGl0eSgnbS5zdGlja2VyJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdwb3N0X3N0aWNrZXJfbWVzc2FnZScsIGRhdGE6IHBheWxvYWQuZGF0YX0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignSWdub3Jpbmcgc3RpY2tlciBtZXNzYWdlLiBJbnZhbGlkIGNhcGFiaWxpdHknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgcmVtb3RlIGNvbnRlbnQgdGl0bGUgb24gQXBwVGlsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVXJsIHRvIGNoZWNrIGZvciB0aXRsZVxuICAgICAqL1xuICAgIF9mZXRjaFdpZGdldFRpdGxlKHVybCkge1xuICAgICAgICB0aGlzLl9zY2FsYXJDbGllbnQuZ2V0U2NhbGFyUGFnZVRpdGxlKHVybCkudGhlbigod2lkZ2V0UGFnZVRpdGxlKSA9PiB7XG4gICAgICAgICAgICBpZiAod2lkZ2V0UGFnZVRpdGxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lkZ2V0UGFnZVRpdGxlOiB3aWRnZXRQYWdlVGl0bGV9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVycikgPT57XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGdldCBwYWdlIHRpdGxlXCIsIGVycik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9ncmFudFdpZGdldFBlcm1pc3Npb24oKSB7XG4gICAgICAgIGNvbnN0IHJvb21JZCA9IHRoaXMucHJvcHMucm9vbS5yb29tSWQ7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIkdyYW50aW5nIHBlcm1pc3Npb24gZm9yIHdpZGdldCB0byBsb2FkOiBcIiArIHRoaXMucHJvcHMuYXBwLmV2ZW50SWQpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImFsbG93ZWRXaWRnZXRzXCIsIHJvb21JZCk7XG4gICAgICAgIGN1cnJlbnRbdGhpcy5wcm9wcy5hcHAuZXZlbnRJZF0gPSB0cnVlO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiYWxsb3dlZFdpZGdldHNcIiwgcm9vbUlkLCBTZXR0aW5nTGV2ZWwuUk9PTV9BQ0NPVU5ULCBjdXJyZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2hhc1Blcm1pc3Npb25Ub0xvYWQ6IHRydWV9KTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggYSB0b2tlbiBmb3IgdGhlIGludGVncmF0aW9uIG1hbmFnZXIsIG5vdyB0aGF0IHdlJ3JlIGFsbG93ZWQgdG9cbiAgICAgICAgICAgIHRoaXMuc2V0U2NhbGFyVG9rZW4oKTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIGFib3V0IHRoaXMgLSB0aGUgdXNlciB3aWxsIGp1c3QgaGl0IHRoZSBidXR0b24gYWdhaW4uXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9yZXZva2VXaWRnZXRQZXJtaXNzaW9uKCkge1xuICAgICAgICBjb25zdCByb29tSWQgPSB0aGlzLnByb3BzLnJvb20ucm9vbUlkO1xuICAgICAgICBjb25zb2xlLmluZm8oXCJSZXZva2luZyBwZXJtaXNzaW9uIGZvciB3aWRnZXQgdG8gbG9hZDogXCIgKyB0aGlzLnByb3BzLmFwcC5ldmVudElkKTtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJhbGxvd2VkV2lkZ2V0c1wiLCByb29tSWQpO1xuICAgICAgICBjdXJyZW50W3RoaXMucHJvcHMuYXBwLmV2ZW50SWRdID0gZmFsc2U7XG4gICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJhbGxvd2VkV2lkZ2V0c1wiLCByb29tSWQsIFNldHRpbmdMZXZlbC5ST09NX0FDQ09VTlQsIGN1cnJlbnQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGFzUGVybWlzc2lvblRvTG9hZDogZmFsc2V9KTtcblxuICAgICAgICAgICAgLy8gRm9yY2UgdGhlIHdpZGdldCB0byBiZSBub24tcGVyc2lzdGVudCAoYWJsZSB0byBiZSBkZWxldGVkL2ZvcmdvdHRlbilcbiAgICAgICAgICAgIEFjdGl2ZVdpZGdldFN0b3JlLmRlc3Ryb3lQZXJzaXN0ZW50V2lkZ2V0KHRoaXMucHJvcHMuYXBwLmlkKTtcbiAgICAgICAgICAgIGNvbnN0IFBlcnNpc3RlZEVsZW1lbnQgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuUGVyc2lzdGVkRWxlbWVudFwiKTtcbiAgICAgICAgICAgIFBlcnNpc3RlZEVsZW1lbnQuZGVzdHJveUVsZW1lbnQodGhpcy5fcGVyc2lzdEtleSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAvLyBXZSBkb24ndCByZWFsbHkgbmVlZCB0byBkbyBhbnl0aGluZyBhYm91dCB0aGlzIC0gdGhlIHVzZXIgd2lsbCBqdXN0IGhpdCB0aGUgYnV0dG9uIGFnYWluLlxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3JtYXRBcHBUaWxlTmFtZSgpIHtcbiAgICAgICAgbGV0IGFwcFRpbGVOYW1lID0gXCJObyBuYW1lXCI7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmFwcC5uYW1lICYmIHRoaXMucHJvcHMuYXBwLm5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICBhcHBUaWxlTmFtZSA9IHRoaXMucHJvcHMuYXBwLm5hbWUudHJpbSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcHBUaWxlTmFtZTtcbiAgICB9XG5cbiAgICBvbkNsaWNrTWVudUJhcihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIElnbm9yZSBjbGlja3Mgb24gbWVudSBiYXIgY2hpbGRyZW5cbiAgICAgICAgaWYgKGV2LnRhcmdldCAhPT0gdGhpcy5fbWVudV9iYXIuY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVG9nZ2xlIHRoZSB2aWV3IHN0YXRlIG9mIHRoZSBhcHBzIGRyYXdlclxuICAgICAgICBpZiAodGhpcy5wcm9wcy51c2VyV2lkZ2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9vbk1pbmltaXNlQ2xpY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnNob3cpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSB3ZXJlIGJlaW5nIHNob3duLCBlbmQgdGhlIHdpZGdldCBhcyB3ZSdyZSBhYm91dCB0byBiZSBtaW5pbWl6ZWQuXG4gICAgICAgICAgICAgICAgdGhpcy5fZW5kV2lkZ2V0QWN0aW9ucygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdhcHBzRHJhd2VyJyxcbiAgICAgICAgICAgICAgICBzaG93OiAhdGhpcy5wcm9wcy5zaG93LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIHRoZSB3aWRnZXQgdGVtcGxhdGUgdmFyaWFibGVzIGluIGEgdXJsIHdpdGggdGhlaXIgdmFsdWVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdSBUaGUgVVJMIHdpdGggdGVtcGxhdGUgdmFyaWFibGVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHdpZGdldFR5cGUgVGhlIHdpZGdldCdzIHR5cGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHVybCB3aXRoIHRlbWxhdGUgdmFyaWFibGVzIHJlcGxhY2VkXG4gICAgICovXG4gICAgX3RlbXBsYXRlZFVybCh1LCB3aWRnZXRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0RGF0YSA9IHt9O1xuICAgICAgICBpZiAoV2lkZ2V0VHlwZS5KSVRTSS5tYXRjaGVzKHdpZGdldFR5cGUpKSB7XG4gICAgICAgICAgICB0YXJnZXREYXRhWydkb21haW4nXSA9ICdqaXRzaS5yaW90LmltJzsgLy8gdjEgaml0c2kgd2lkZ2V0cyBoYXZlIHRoaXMgaGFyZGNvZGVkXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkO1xuICAgICAgICBjb25zdCBteVVzZXIgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcihteVVzZXJJZCk7XG4gICAgICAgIGNvbnN0IHZhcnMgPSBPYmplY3QuYXNzaWduKHRhcmdldERhdGEsIHRoaXMucHJvcHMuYXBwLmRhdGEsIHtcbiAgICAgICAgICAgICdtYXRyaXhfdXNlcl9pZCc6IG15VXNlcklkLFxuICAgICAgICAgICAgJ21hdHJpeF9yb29tX2lkJzogdGhpcy5wcm9wcy5yb29tLnJvb21JZCxcbiAgICAgICAgICAgICdtYXRyaXhfZGlzcGxheV9uYW1lJzogbXlVc2VyID8gbXlVc2VyLmRpc3BsYXlOYW1lIDogbXlVc2VySWQsXG4gICAgICAgICAgICAnbWF0cml4X2F2YXRhcl91cmwnOiBteVVzZXIgPyBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKG15VXNlci5hdmF0YXJVcmwpIDogJycsXG5cbiAgICAgICAgICAgIC8vIFRPRE86IE5hbWVzcGFjZSB0aGVtZXMgdGhyb3VnaCBzb21lIHN0YW5kYXJkXG4gICAgICAgICAgICAndGhlbWUnOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwidGhlbWVcIiksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh2YXJzLmNvbmZlcmVuY2VJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyB3ZSdsbCBuZWVkIHRvIHBhcnNlIHRoZSBjb25mZXJlbmNlIElEIG91dCBvZiB0aGUgVVJMIGZvciB2MSBKaXRzaSB3aWRnZXRzXG4gICAgICAgICAgICBjb25zdCBwYXJzZWRVcmwgPSBuZXcgVVJMKHRoaXMucHJvcHMuYXBwLnVybCk7XG4gICAgICAgICAgICB2YXJzLmNvbmZlcmVuY2VJZCA9IHBhcnNlZFVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiY29uZklkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVyaUZyb21UZW1wbGF0ZSh1LCB2YXJzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIFVSTCB1c2VkIGluIHRoZSBpZnJhbWVcbiAgICAgKiBJbiBjYXNlcyB3aGVyZSB3ZSBzdXBwbHkgb3VyIG93biBVSSBmb3IgYSB3aWRnZXQsIHRoaXMgaXMgYW4gaW50ZXJuYWxcbiAgICAgKiBVUkwgZGlmZmVyZW50IHRvIHRoZSBvbmUgdXNlZCBpZiB0aGUgd2lkZ2V0IGlzIHBvcHBlZCBvdXQgdG8gYSBzZXBhcmF0ZVxuICAgICAqIHRhYiAvIGJyb3dzZXJcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHVybFxuICAgICAqL1xuICAgIF9nZXRSZW5kZXJlZFVybCgpIHtcbiAgICAgICAgbGV0IHVybDtcblxuICAgICAgICBpZiAoV2lkZ2V0VHlwZS5KSVRTSS5tYXRjaGVzKHRoaXMucHJvcHMuYXBwLnR5cGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlcGxhY2luZyBKaXRzaSB3aWRnZXQgVVJMIHdpdGggbG9jYWwgd3JhcHBlclwiKTtcbiAgICAgICAgICAgIHVybCA9IFdpZGdldFV0aWxzLmdldExvY2FsSml0c2lXcmFwcGVyVXJsKHtmb3JMb2NhbFJlbmRlcjogdHJ1ZX0pO1xuICAgICAgICAgICAgdXJsID0gdGhpcy5fYWRkV3VybFBhcmFtcyh1cmwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsID0gdGhpcy5fZ2V0U2FmZVVybCh0aGlzLnN0YXRlLndpZGdldFVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3RlbXBsYXRlZFVybCh1cmwsIHRoaXMucHJvcHMuYXBwLnR5cGUpO1xuICAgIH1cblxuICAgIF9nZXRQb3BvdXRVcmwoKSB7XG4gICAgICAgIGlmIChXaWRnZXRUeXBlLkpJVFNJLm1hdGNoZXModGhpcy5wcm9wcy5hcHAudHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90ZW1wbGF0ZWRVcmwoXG4gICAgICAgICAgICAgICAgV2lkZ2V0VXRpbHMuZ2V0TG9jYWxKaXRzaVdyYXBwZXJVcmwoe2ZvckxvY2FsUmVuZGVyOiBmYWxzZX0pLFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuYXBwLnR5cGUsXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXNlIGFwcC51cmwsIG5vdCBzdGF0ZS53aWRnZXRVcmwsIGJlY2F1c2Ugd2Ugd2FudCB0aGUgb25lIHdpdGhvdXRcbiAgICAgICAgICAgIC8vIHRoZSB3VVJMIHBhcmFtcyBmb3IgdGhlIHBvcHBlZC1vdXQgdmVyc2lvbi5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90ZW1wbGF0ZWRVcmwodGhpcy5fZ2V0U2FmZVVybCh0aGlzLnByb3BzLmFwcC51cmwpLCB0aGlzLnByb3BzLmFwcC50eXBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9nZXRTYWZlVXJsKHUpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkV2lkZ2V0VXJsID0gdXJsLnBhcnNlKHUsIHRydWUpO1xuICAgICAgICBpZiAoRU5BQkxFX1JFQUNUX1BFUkYpIHtcbiAgICAgICAgICAgIHBhcnNlZFdpZGdldFVybC5zZWFyY2ggPSBudWxsO1xuICAgICAgICAgICAgcGFyc2VkV2lkZ2V0VXJsLnF1ZXJ5LnJlYWN0X3BlcmYgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzYWZlV2lkZ2V0VXJsID0gJyc7XG4gICAgICAgIGlmIChBTExPV0VEX0FQUF9VUkxfU0NIRU1FUy5pbmNsdWRlcyhwYXJzZWRXaWRnZXRVcmwucHJvdG9jb2wpKSB7XG4gICAgICAgICAgICBzYWZlV2lkZ2V0VXJsID0gdXJsLmZvcm1hdChwYXJzZWRXaWRnZXRVcmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVwbGFjZSBhbGwgdGhlIGRvbGxhciBzaWducyBiYWNrIHRvIGRvbGxhciBzaWducyBhcyB0aGV5IGRvbid0IGFmZmVjdCBIVFRQIGF0IGFsbC5cbiAgICAgICAgLy8gV2UgYWxzbyBuZWVkIHRoZSBkb2xsYXIgc2lnbnMgaW4tdGFjdCBmb3IgdmFyaWFibGUgc3Vic3RpdHV0aW9uLlxuICAgICAgICByZXR1cm4gc2FmZVdpZGdldFVybC5yZXBsYWNlKC8lMjQvZywgJyQnKTtcbiAgICB9XG5cbiAgICBfZ2V0VGlsZVRpdGxlKCkge1xuICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5mb3JtYXRBcHBUaWxlTmFtZSgpO1xuICAgICAgICBjb25zdCB0aXRsZVNwYWNlciA9IDxzcGFuPiZuYnNwOy0mbmJzcDs8L3NwYW4+O1xuICAgICAgICBsZXQgdGl0bGUgPSAnJztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUud2lkZ2V0UGFnZVRpdGxlICYmIHRoaXMuc3RhdGUud2lkZ2V0UGFnZVRpdGxlICE9IHRoaXMuZm9ybWF0QXBwVGlsZU5hbWUoKSkge1xuICAgICAgICAgICAgdGl0bGUgPSB0aGlzLnN0YXRlLndpZGdldFBhZ2VUaXRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8Yj57IG5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57IHRpdGxlID8gdGl0bGVTcGFjZXIgOiAnJyB9eyB0aXRsZSB9PC9zcGFuPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9vbk1pbmltaXNlQ2xpY2soZSkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbk1pbmltaXNlQ2xpY2spIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25NaW5pbWlzZUNsaWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Qb3BvdXRXaWRnZXRDbGljaygpIHtcbiAgICAgICAgLy8gVXNpbmcgT2JqZWN0LmFzc2lnbiB3b3JrYXJvdW5kIGFzIHRoZSBmb2xsb3dpbmcgb3BlbnMgaW4gYSBuZXcgd2luZG93IGluc3RlYWQgb2YgYSBuZXcgdGFiLlxuICAgICAgICAvLyB3aW5kb3cub3Blbih0aGlzLl9nZXRQb3BvdXRVcmwoKSwgJ19ibGFuaycsICdub29wZW5lcj15ZXMnKTtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyksXG4gICAgICAgICAgICB7IHRhcmdldDogJ19ibGFuaycsIGhyZWY6IHRoaXMuX2dldFBvcG91dFVybCgpLCByZWw6ICdub3JlZmVycmVyIG5vb3BlbmVyJ30pLmNsaWNrKCk7XG4gICAgfVxuXG4gICAgX29uUmVsb2FkV2lkZ2V0Q2xpY2soKSB7XG4gICAgICAgIC8vIFJlbG9hZCBpZnJhbWUgaW4gdGhpcyB3YXkgdG8gYXZvaWQgY3Jvc3Mtb3JpZ2luIHJlc3RyaWN0aW9uc1xuICAgICAgICB0aGlzLl9hcHBGcmFtZS5jdXJyZW50LnNyYyA9IHRoaXMuX2FwcEZyYW1lLmN1cnJlbnQuc3JjO1xuICAgIH1cblxuICAgIF9vbkNvbnRleHRNZW51Q2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBtZW51RGlzcGxheWVkOiB0cnVlIH0pO1xuICAgIH07XG5cbiAgICBfY2xvc2VDb250ZXh0TWVudSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1lbnVEaXNwbGF5ZWQ6IGZhbHNlIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBhcHBUaWxlQm9keTtcblxuICAgICAgICAvLyBEb24ndCByZW5kZXIgd2lkZ2V0IGlmIGl0IGlzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGRlbGV0ZWRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGVsZXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2IC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoZXJlIGlzIGFkdmljZSBzYXlpbmcgYWxsb3ctc2NyaXB0cyBzaG91bGRuJ3QgYmUgdXNlZCB3aXRoIGFsbG93LXNhbWUtb3JpZ2luXG4gICAgICAgIC8vIGJlY2F1c2UgdGhhdCB3b3VsZCBhbGxvdyB0aGUgaWZyYW1lIHRvIHByb2dyYW1tYXRpY2FsbHkgcmVtb3ZlIHRoZSBzYW5kYm94IGF0dHJpYnV0ZSwgYnV0XG4gICAgICAgIC8vIHRoaXMgd291bGQgb25seSBiZSBmb3IgY29udGVudCBob3N0ZWQgb24gdGhlIHNhbWUgb3JpZ2luIGFzIHRoZSByaW90IGNsaWVudDogYW55dGhpbmdcbiAgICAgICAgLy8gaG9zdGVkIG9uIHRoZSBzYW1lIG9yaWdpbiBhcyB0aGUgY2xpZW50IHdpbGwgZ2V0IHRoZSBzYW1lIGFjY2VzcyBhcyBpZiB5b3UgY2xpY2tlZFxuICAgICAgICAvLyBhIGxpbmsgdG8gaXQuXG4gICAgICAgIGNvbnN0IHNhbmRib3hGbGFncyA9IFwiYWxsb3ctZm9ybXMgYWxsb3ctcG9wdXBzIGFsbG93LXBvcHVwcy10by1lc2NhcGUtc2FuZGJveCBcIitcbiAgICAgICAgICAgIFwiYWxsb3ctc2FtZS1vcmlnaW4gYWxsb3ctc2NyaXB0cyBhbGxvdy1wcmVzZW50YXRpb25cIjtcblxuICAgICAgICAvLyBBZGRpdGlvbmFsIGlmcmFtZSBmZWF0dXJlIHBlbWlzc2lvbnNcbiAgICAgICAgLy8gKHNlZSAtIGh0dHBzOi8vc2l0ZXMuZ29vZ2xlLmNvbS9hL2Nocm9taXVtLm9yZy9kZXYvSG9tZS9jaHJvbWl1bS1zZWN1cml0eS9kZXByZWNhdGluZy1wZXJtaXNzaW9ucy1pbi1jcm9zcy1vcmlnaW4taWZyYW1lcyBhbmQgaHR0cHM6Ly93aWNnLmdpdGh1Yi5pby9mZWF0dXJlLXBvbGljeS8pXG4gICAgICAgIGNvbnN0IGlmcmFtZUZlYXR1cmVzID0gXCJtaWNyb3Bob25lOyBjYW1lcmE7IGVuY3J5cHRlZC1tZWRpYTsgYXV0b3BsYXk7XCI7XG5cbiAgICAgICAgY29uc3QgYXBwVGlsZUJvZHlDbGFzcyA9ICdteF9BcHBUaWxlQm9keScgKyAodGhpcy5wcm9wcy5taW5pTW9kZSA/ICdfbWluaSAgJyA6ICcgJyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2hvdykge1xuICAgICAgICAgICAgY29uc3QgbG9hZGluZ0VsZW1lbnQgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BcHBMb2FkaW5nX3NwaW5uZXJfZmFkZUluXCI+XG4gICAgICAgICAgICAgICAgICAgIDxNZXNzYWdlU3Bpbm5lciBtc2c9J0xvYWRpbmcuLi4nIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmhhc1Blcm1pc3Npb25Ub0xvYWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0VuY3J5cHRlZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc1Jvb21FbmNyeXB0ZWQodGhpcy5wcm9wcy5yb29tLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgYXBwVGlsZUJvZHkgPSAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXthcHBUaWxlQm9keUNsYXNzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBcHBQZXJtaXNzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbUlkPXt0aGlzLnByb3BzLnJvb20ucm9vbUlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0b3JVc2VySWQ9e3RoaXMucHJvcHMuY3JlYXRvclVzZXJJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw9e3RoaXMuc3RhdGUud2lkZ2V0VXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzUm9vbUVuY3J5cHRlZD17aXNFbmNyeXB0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25QZXJtaXNzaW9uR3JhbnRlZD17dGhpcy5fZ3JhbnRXaWRnZXRQZXJtaXNzaW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgICAgICAgICBhcHBUaWxlQm9keSA9IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2FwcFRpbGVCb2R5Q2xhc3MgKyAodGhpcy5zdGF0ZS5sb2FkaW5nID8gJ214X0FwcExvYWRpbmcnIDogJycpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbG9hZGluZ0VsZW1lbnQgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc01peGVkQ29udGVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcFRpbGVCb2R5ID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2FwcFRpbGVCb2R5Q2xhc3N9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBcHBXYXJuaW5nIGVycm9yTXNnPVwiRXJyb3IgLSBNaXhlZCBjb250ZW50XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcFRpbGVCb2R5ID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2FwcFRpbGVCb2R5Q2xhc3MgKyAodGhpcy5zdGF0ZS5sb2FkaW5nID8gJ214X0FwcExvYWRpbmcnIDogJycpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUubG9hZGluZyAmJiBsb2FkaW5nRWxlbWVudCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlmcmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvdz17aWZyYW1lRmVhdHVyZXN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fYXBwRnJhbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17dGhpcy5fZ2V0UmVuZGVyZWRVcmwoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW5kYm94PXtzYW5kYm94RmxhZ3N9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTG9hZD17dGhpcy5fb25Mb2FkZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIHdpZGdldCB3b3VsZCBiZSBhbGxvd2VkIHRvIHJlbWFpbiBvbiBzY3JlZW4sIHdlIG11c3QgcHV0IGl0IGluXG4gICAgICAgICAgICAgICAgICAgIC8vIGEgUGVyc2lzdGVkRWxlbWVudCBmcm9tIHRoZSBnZXQtZ28sIG90aGVyd2lzZSB0aGUgaWZyYW1lIHdpbGwgYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmUtbW91bnRlZCBsYXRlciB3aGVuIHdlIGRvLlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy53aGl0ZWxpc3RDYXBhYmlsaXRpZXMuaW5jbHVkZXMoJ20uYWx3YXlzX29uX3NjcmVlbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBQZXJzaXN0ZWRFbGVtZW50ID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlBlcnNpc3RlZEVsZW1lbnRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBbHNvIHdyYXAgdGhlIFBlcnNpc3RlZEVsZW1lbnQgaW4gYSBkaXYgdG8gZml4IHRoZSBoZWlnaHQsIG90aGVyd2lzZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwVGlsZSdzIGJvcmRlciBpcyBpbiB0aGUgd3JvbmcgcGxhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcFRpbGVCb2R5ID0gPGRpdiBjbGFzc05hbWU9XCJteF9BcHBUaWxlX3BlcnNpc3RlZFdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGVyc2lzdGVkRWxlbWVudCBwZXJzaXN0S2V5PXt0aGlzLl9wZXJzaXN0S2V5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2FwcFRpbGVCb2R5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvUGVyc2lzdGVkRWxlbWVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNob3dNaW5pbWlzZUJ1dHRvbiA9IHRoaXMucHJvcHMuc2hvd01pbmltaXNlICYmIHRoaXMucHJvcHMuc2hvdztcbiAgICAgICAgY29uc3Qgc2hvd01heGltaXNlQnV0dG9uID0gdGhpcy5wcm9wcy5zaG93TWluaW1pc2UgJiYgIXRoaXMucHJvcHMuc2hvdztcblxuICAgICAgICBsZXQgYXBwVGlsZUNsYXNzO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5taW5pTW9kZSkge1xuICAgICAgICAgICAgYXBwVGlsZUNsYXNzID0gJ214X0FwcFRpbGVfbWluaSc7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5mdWxsV2lkdGgpIHtcbiAgICAgICAgICAgIGFwcFRpbGVDbGFzcyA9ICdteF9BcHBUaWxlRnVsbFdpZHRoJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcFRpbGVDbGFzcyA9ICdteF9BcHBUaWxlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lbnVCYXJDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBteF9BcHBUaWxlTWVudUJhcjogdHJ1ZSxcbiAgICAgICAgICAgIG14X0FwcFRpbGVNZW51QmFyX2V4cGFuZGVkOiB0aGlzLnByb3BzLnNob3csXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBjb250ZXh0TWVudTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubWVudURpc3BsYXllZCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9jb250ZXh0TWVudUJ1dHRvbi5jdXJyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgICBjb25zdCBjYW5Vc2VyTW9kaWZ5ID0gdGhpcy5fY2FuVXNlck1vZGlmeSgpO1xuICAgICAgICAgICAgY29uc3Qgc2hvd0VkaXRCdXR0b24gPSBCb29sZWFuKHRoaXMuX3NjYWxhckNsaWVudCAmJiBjYW5Vc2VyTW9kaWZ5KTtcbiAgICAgICAgICAgIGNvbnN0IHNob3dEZWxldGVCdXR0b24gPSAodGhpcy5wcm9wcy5zaG93RGVsZXRlID09PSB1bmRlZmluZWQgfHwgdGhpcy5wcm9wcy5zaG93RGVsZXRlKSAmJiBjYW5Vc2VyTW9kaWZ5O1xuICAgICAgICAgICAgY29uc3Qgc2hvd1BpY3R1cmVTbmFwc2hvdEJ1dHRvbiA9IHRoaXMuX2hhc0NhcGFiaWxpdHkoJ20uY2FwYWJpbGl0eS5zY3JlZW5zaG90JykgJiYgdGhpcy5wcm9wcy5zaG93O1xuXG4gICAgICAgICAgICBjb25zdCBXaWRnZXRDb250ZXh0TWVudSA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmNvbnRleHRfbWVudXMuV2lkZ2V0Q29udGV4dE1lbnUnKTtcbiAgICAgICAgICAgIGNvbnRleHRNZW51ID0gKFxuICAgICAgICAgICAgICAgIDxDb250ZXh0TWVudSB7Li4uYWJvdmVMZWZ0T2YoZWxlbWVudFJlY3QsIG51bGwpfSBvbkZpbmlzaGVkPXt0aGlzLl9jbG9zZUNvbnRleHRNZW51fT5cbiAgICAgICAgICAgICAgICAgICAgPFdpZGdldENvbnRleHRNZW51XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJldm9rZUNsaWNrZWQ9e3RoaXMuX29uUmV2b2tlQ2xpY2tlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRWRpdENsaWNrZWQ9e3Nob3dFZGl0QnV0dG9uID8gdGhpcy5fb25FZGl0Q2xpY2sgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZUNsaWNrZWQ9e3Nob3dEZWxldGVCdXR0b24gPyB0aGlzLl9vbkRlbGV0ZUNsaWNrIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25TbmFwc2hvdENsaWNrZWQ9e3Nob3dQaWN0dXJlU25hcHNob3RCdXR0b24gPyB0aGlzLl9vblNuYXBzaG90Q2xpY2sgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlbG9hZENsaWNrZWQ9e3RoaXMucHJvcHMuc2hvd1JlbG9hZCA/IHRoaXMuX29uUmVsb2FkV2lkZ2V0Q2xpY2sgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLl9jbG9zZUNvbnRleHRNZW51fVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvQ29udGV4dE1lbnU+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxSZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXthcHBUaWxlQ2xhc3N9IGlkPXt0aGlzLnByb3BzLmFwcC5pZH0+XG4gICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLnNob3dNZW51YmFyICYmXG4gICAgICAgICAgICAgICAgPGRpdiByZWY9e3RoaXMuX21lbnVfYmFyfSBjbGFzc05hbWU9e21lbnVCYXJDbGFzc2VzfSBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tNZW51QmFyfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfQXBwVGlsZU1lbnVCYXJUaXRsZVwiIHN0eWxlPXt7cG9pbnRlckV2ZW50czogKHRoaXMucHJvcHMuaGFuZGxlTWluaW1pc2VQb2ludGVyRXZlbnRzID8gJ2FsbCcgOiBmYWxzZSl9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgLyogTWluaW1pc2Ugd2lkZ2V0ICovIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc2hvd01pbmltaXNlQnV0dG9uICYmIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfQXBwVGlsZU1lbnVCYXJfaWNvbkJ1dHRvbiBteF9BcHBUaWxlTWVudUJhcl9pY29uQnV0dG9uX21pbmltaXNlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17X3QoJ01pbmltaXplIGFwcHMnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbk1pbmltaXNlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IC8qIE1heGltaXNlIHdpZGdldCAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHNob3dNYXhpbWlzZUJ1dHRvbiAmJiA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0FwcFRpbGVNZW51QmFyX2ljb25CdXR0b24gbXhfQXBwVGlsZU1lbnVCYXJfaWNvbkJ1dHRvbl9tYXhpbWlzZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KCdNYXhpbWl6ZSBhcHBzJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25NaW5pbWlzZUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz4gfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyAvKiBUaXRsZSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuc2hvd1RpdGxlICYmIHRoaXMuX2dldFRpbGVUaXRsZSgpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9BcHBUaWxlTWVudUJhcldpZGdldHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgLyogUG9wb3V0IHdpZGdldCAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuc2hvd1BvcG91dCAmJiA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0FwcFRpbGVNZW51QmFyX2ljb25CdXR0b24gbXhfQXBwVGlsZU1lbnVCYXJfaWNvbkJ1dHRvbl9wb3BvdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnUG9wb3V0IHdpZGdldCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uUG9wb3V0V2lkZ2V0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IC8qIENvbnRleHQgbWVudSAqLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IDxDb250ZXh0TWVudUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0FwcFRpbGVNZW51QmFyX2ljb25CdXR0b24gbXhfQXBwVGlsZU1lbnVCYXJfaWNvbkJ1dHRvbl9tZW51XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoJ01vcmUgb3B0aW9ucycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRXhwYW5kZWQ9e3RoaXMuc3RhdGUubWVudURpc3BsYXllZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFJlZj17dGhpcy5fY29udGV4dE1lbnVCdXR0b259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25Db250ZXh0TWVudUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz4gfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+IH1cbiAgICAgICAgICAgICAgICB7IGFwcFRpbGVCb2R5IH1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7IGNvbnRleHRNZW51IH1cbiAgICAgICAgPC9SZWFjdC5GcmFnbWVudD47XG4gICAgfVxufVxuXG5BcHBUaWxlLmRpc3BsYXlOYW1lID0gJ0FwcFRpbGUnO1xuXG5BcHBUaWxlLnByb3BUeXBlcyA9IHtcbiAgICBhcHA6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgLy8gU3BlY2lmeWluZyAnZnVsbFdpZHRoJyBhcyB0cnVlIHdpbGwgcmVuZGVyIHRoZSBhcHAgdGlsZSB0byBmaWxsIHRoZSB3aWR0aCBvZiB0aGUgYXBwIGRyYXdlciBjb250aW5lci5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSBzZXQgdG8gdHJ1ZSB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIHdpZGdldCBpbiB0aGUgYXBwIGRyYXdlciwgb3RoZXJ3aXNlIGl0IHNob3VsZCBiZSBmYWxzZS5cbiAgICBmdWxsV2lkdGg6IFByb3BUeXBlcy5ib29sLFxuICAgIC8vIE9wdGlvbmFsLiBJZiBzZXQsIHJlbmRlcnMgYSBzbWFsbGVyIHZpZXcgb2YgdGhlIHdpZGdldFxuICAgIG1pbmlNb2RlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAvLyBVc2VySWQgb2YgdGhlIGN1cnJlbnQgdXNlclxuICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIC8vIFVzZXJJZCBvZiB0aGUgZW50aXR5IHRoYXQgYWRkZWQgLyBtb2RpZmllZCB0aGUgd2lkZ2V0XG4gICAgY3JlYXRvclVzZXJJZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB3YWl0Rm9ySWZyYW1lTG9hZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgc2hvd01lbnViYXI6IFByb3BUeXBlcy5ib29sLFxuICAgIC8vIFNob3VsZCB0aGUgQXBwVGlsZSByZW5kZXIgaXRzZWxmXG4gICAgc2hvdzogUHJvcFR5cGVzLmJvb2wsXG4gICAgLy8gT3B0aW9uYWwgb25FZGl0Q2xpY2tIYW5kbGVyIChvdmVycmlkZXMgZGVmYXVsdCBiZWhhdmlvdXIpXG4gICAgb25FZGl0Q2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgIC8vIE9wdGlvbmFsIG9uRGVsZXRlQ2xpY2tIYW5kbGVyIChvdmVycmlkZXMgZGVmYXVsdCBiZWhhdmlvdXIpXG4gICAgb25EZWxldGVDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgLy8gT3B0aW9uYWwgb25NaW5pbWlzZUNsaWNrSGFuZGxlclxuICAgIG9uTWluaW1pc2VDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgLy8gT3B0aW9uYWxseSBoaWRlIHRoZSB0aWxlIHRpdGxlXG4gICAgc2hvd1RpdGxlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAvLyBPcHRpb25hbGx5IGhpZGUgdGhlIHRpbGUgbWluaW1pc2UgaWNvblxuICAgIHNob3dNaW5pbWlzZTogUHJvcFR5cGVzLmJvb2wsXG4gICAgLy8gT3B0aW9uYWxseSBoYW5kbGUgbWluaW1pc2UgYnV0dG9uIHBvaW50ZXIgZXZlbnRzIChkZWZhdWx0IGZhbHNlKVxuICAgIGhhbmRsZU1pbmltaXNlUG9pbnRlckV2ZW50czogUHJvcFR5cGVzLmJvb2wsXG4gICAgLy8gT3B0aW9uYWxseSBoaWRlIHRoZSBkZWxldGUgaWNvblxuICAgIHNob3dEZWxldGU6IFByb3BUeXBlcy5ib29sLFxuICAgIC8vIE9wdGlvbmFsbHkgaGlkZSB0aGUgcG9wb3V0IHdpZGdldCBpY29uXG4gICAgc2hvd1BvcG91dDogUHJvcFR5cGVzLmJvb2wsXG4gICAgLy8gT3B0aW9uYWxseSBzaG93IHRoZSByZWxvYWQgd2lkZ2V0IGljb25cbiAgICAvLyBUaGlzIGlzIG5vdCBjdXJyZW50bHkgaW50ZW5kZWQgZm9yIHVzZSB3aXRoIHByb2R1Y3Rpb24gd2lkZ2V0cy4gSG93ZXZlclxuICAgIC8vIGl0IGNhbiBiZSB1c2VmdWwgd2hlbiBkZXZlbG9waW5nIHBlcnNpc3RlbnQgd2lkZ2V0cyBpbiBvcmRlciB0byBhdm9pZFxuICAgIC8vIGhhdmluZyB0byByZWxvYWQgYWxsIG9mIHJpb3QgdG8gZ2V0IG5ldyB3aWRnZXQgY29udGVudC5cbiAgICBzaG93UmVsb2FkOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAvLyBXaWRnZXQgY2FwYWJpbGl0aWVzIHRvIGFsbG93IGJ5IGRlZmF1bHQgKHdpdGhvdXQgdXNlciBjb25maXJtYXRpb24pXG4gICAgLy8gTk9URSAtLSBVc2Ugd2l0aCBjYXV0aW9uLiBUaGlzIGlzIGludGVuZGVkIHRvIGFpZCBiZXR0ZXIgaW50ZWdyYXRpb24gLyBVWFxuICAgIC8vIGJhc2ljIHdpZGdldCBjYXBhYmlsaXRpZXMsIGUuZy4gaW5qZWN0aW5nIHN0aWNrZXIgbWVzc2FnZSBldmVudHMuXG4gICAgd2hpdGVsaXN0Q2FwYWJpbGl0aWVzOiBQcm9wVHlwZXMuYXJyYXksXG4gICAgLy8gT3B0aW9uYWwgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHdpZGdldCBjYXBhYmlsaXR5IHJlcXVlc3RcbiAgICAvLyBDYWxsZWQgd2l0aCBhbiBhcnJheSBvZiB0aGUgcmVxdWVzdGVkIGNhcGFiaWxpdGllc1xuICAgIG9uQ2FwYWJpbGl0eVJlcXVlc3Q6IFByb3BUeXBlcy5mdW5jLFxuICAgIC8vIElzIHRoaXMgYW4gaW5zdGFuY2Ugb2YgYSB1c2VyIHdpZGdldFxuICAgIHVzZXJXaWRnZXQ6IFByb3BUeXBlcy5ib29sLFxufTtcblxuQXBwVGlsZS5kZWZhdWx0UHJvcHMgPSB7XG4gICAgd2FpdEZvcklmcmFtZUxvYWQ6IHRydWUsXG4gICAgc2hvd01lbnViYXI6IHRydWUsXG4gICAgc2hvd1RpdGxlOiB0cnVlLFxuICAgIHNob3dNaW5pbWlzZTogdHJ1ZSxcbiAgICBzaG93RGVsZXRlOiB0cnVlLFxuICAgIHNob3dQb3BvdXQ6IHRydWUsXG4gICAgc2hvd1JlbG9hZDogZmFsc2UsXG4gICAgaGFuZGxlTWluaW1pc2VQb2ludGVyRXZlbnRzOiBmYWxzZSxcbiAgICB3aGl0ZWxpc3RDYXBhYmlsaXRpZXM6IFtdLFxuICAgIHVzZXJXaWRnZXQ6IGZhbHNlLFxuICAgIG1pbmlNb2RlOiBmYWxzZSxcbn07XG4iXX0=