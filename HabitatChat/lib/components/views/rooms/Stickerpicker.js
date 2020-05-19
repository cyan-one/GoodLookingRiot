"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../languageHandler");

var _AppTile = _interopRequireDefault(require("../elements/AppTile"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _WidgetUtils = _interopRequireDefault(require("../../../utils/WidgetUtils"));

var _ActiveWidgetStore = _interopRequireDefault(require("../../../stores/ActiveWidgetStore"));

var _PersistedElement = _interopRequireDefault(require("../elements/PersistedElement"));

var _IntegrationManagers = require("../../../integrations/IntegrationManagers");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _ContextMenu = require("../../structures/ContextMenu");

var _WidgetType = require("../../../widgets/WidgetType");

/*
Copyright 2018 New Vector Ltd

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
// This should be below the dialog level (4000), but above the rest of the UI (1000-2000).
// We sit in a context menu, so this should be given to the context menu.
const STICKERPICKER_Z_INDEX = 3500; // Key to store the widget's AppTile under in PersistedElement

const PERSISTED_ELEMENT_KEY = "stickerPicker";

class Stickerpicker extends _react.default.Component {
  constructor(props) {
    super(props);
    this._onShowStickersClick = this._onShowStickersClick.bind(this);
    this._onHideStickersClick = this._onHideStickersClick.bind(this);
    this._launchManageIntegrations = this._launchManageIntegrations.bind(this);
    this._removeStickerpickerWidgets = this._removeStickerpickerWidgets.bind(this);
    this._updateWidget = this._updateWidget.bind(this);
    this._onWidgetAction = this._onWidgetAction.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onFinished = this._onFinished.bind(this);
    this.popoverWidth = 300;
    this.popoverHeight = 300; // This is loaded by _acquireScalarClient on an as-needed basis.

    this.scalarClient = null;
    this.state = {
      showStickers: false,
      imError: null,
      stickerpickerX: null,
      stickerpickerY: null,
      stickerpickerWidget: null,
      widgetId: null
    };
  }

  _acquireScalarClient() {
    if (this.scalarClient) return Promise.resolve(this.scalarClient); // TODO: Pick the right manager for the widget

    if (_IntegrationManagers.IntegrationManagers.sharedInstance().hasManager()) {
      this.scalarClient = _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager().getScalarClient();
      return this.scalarClient.connect().then(() => {
        this.forceUpdate();
        return this.scalarClient;
      }).catch(e => {
        this._imError((0, _languageHandler._td)("Failed to connect to integration manager"), e);
      });
    } else {
      _IntegrationManagers.IntegrationManagers.sharedInstance().openNoManagerDialog();
    }
  }

  async _removeStickerpickerWidgets() {
    const scalarClient = await this._acquireScalarClient();
    console.log('Removing Stickerpicker widgets');

    if (this.state.widgetId) {
      if (scalarClient) {
        scalarClient.disableWidgetAssets(_WidgetType.WidgetType.STICKERPICKER, this.state.widgetId).then(() => {
          console.log('Assets disabled');
        }).catch(err => {
          console.error('Failed to disable assets');
        });
      } else {
        console.error("Cannot disable assets: no scalar client");
      }
    } else {
      console.warn('No widget ID specified, not disabling assets');
    }

    this.setState({
      showStickers: false
    });

    _WidgetUtils.default.removeStickerpickerWidgets().then(() => {
      this.forceUpdate();
    }).catch(e => {
      console.error('Failed to remove sticker picker widget', e);
    });
  }

  componentDidMount() {
    // Close the sticker picker when the window resizes
    window.addEventListener('resize', this._onResize);
    this.dispatcherRef = _dispatcher.default.register(this._onWidgetAction); // Track updates to widget state in account data

    _MatrixClientPeg.MatrixClientPeg.get().on('accountData', this._updateWidget); // Initialise widget state from current account data


    this._updateWidget();
  }

  componentWillUnmount() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) client.removeListener('accountData', this._updateWidget);
    window.removeEventListener('resize', this._onResize);

    if (this.dispatcherRef) {
      _dispatcher.default.unregister(this.dispatcherRef);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this._sendVisibilityToWidget(this.state.showStickers);
  }

  _imError(errorMsg, e) {
    console.error(errorMsg, e);
    this.setState({
      showStickers: false,
      imError: (0, _languageHandler._t)(errorMsg)
    });
  }

  _updateWidget() {
    const stickerpickerWidget = _WidgetUtils.default.getStickerpickerWidgets()[0];

    if (!stickerpickerWidget) {
      Stickerpicker.currentWidget = null;
      this.setState({
        stickerpickerWidget: null,
        widgetId: null
      });
      return;
    }

    const currentWidget = Stickerpicker.currentWidget;
    let currentUrl = null;

    if (currentWidget && currentWidget.content && currentWidget.content.url) {
      currentUrl = currentWidget.content.url;
    }

    let newUrl = null;

    if (stickerpickerWidget && stickerpickerWidget.content && stickerpickerWidget.content.url) {
      newUrl = stickerpickerWidget.content.url;
    }

    if (newUrl !== currentUrl) {
      // Destroy the existing frame so a new one can be created
      _PersistedElement.default.destroyElement(PERSISTED_ELEMENT_KEY);
    }

    Stickerpicker.currentWidget = stickerpickerWidget;
    this.setState({
      stickerpickerWidget,
      widgetId: stickerpickerWidget ? stickerpickerWidget.id : null
    });
  }

  _onWidgetAction(payload) {
    switch (payload.action) {
      case "user_widget_updated":
        this.forceUpdate();
        break;

      case "stickerpicker_close":
        this.setState({
          showStickers: false
        });
        break;

      case "after_right_panel_phase_change":
      case "show_left_panel":
      case "hide_left_panel":
        this.setState({
          showStickers: false
        });
        break;
    }
  }

  _defaultStickerpickerContent() {
    return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._launchManageIntegrations,
      className: "mx_Stickers_contentPlaceholder"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You don't currently have any stickerpacks enabled")), /*#__PURE__*/_react.default.createElement("p", {
      className: "mx_Stickers_addLink"
    }, (0, _languageHandler._t)("Add some now")), /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/stickerpack-placeholder.png"),
      alt: ""
    }));
  }

  _errorStickerpickerContent() {
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
        "text-align": "center"
      },
      className: "error"
    }, /*#__PURE__*/_react.default.createElement("p", null, " ", this.state.imError, " "));
  }

  _sendVisibilityToWidget(visible) {
    if (!this.state.stickerpickerWidget) return;

    const widgetMessaging = _ActiveWidgetStore.default.getWidgetMessaging(this.state.stickerpickerWidget.id);

    if (widgetMessaging && visible !== this._prevSentVisibility) {
      widgetMessaging.sendVisibility(visible);
      this._prevSentVisibility = visible;
    }
  }

  _getStickerpickerContent() {
    // Handle Integration Manager errors
    if (this.state._imError) {
      return this._errorStickerpickerContent();
    } // Stickers
    // TODO - Add support for Stickerpickers from multiple app stores.
    // Render content from multiple stickerpack sources, each within their
    // own iframe, within the stickerpicker UI element.


    const stickerpickerWidget = this.state.stickerpickerWidget;
    let stickersContent; // Use a separate ReactDOM tree to render the AppTile separately so that it persists and does
    // not unmount when we (a) close the sticker picker (b) switch rooms. It's properties are still
    // updated.

    const PersistedElement = sdk.getComponent("elements.PersistedElement"); // Load stickerpack content

    if (stickerpickerWidget && stickerpickerWidget.content && stickerpickerWidget.content.url) {
      // Set default name
      stickerpickerWidget.content.name = stickerpickerWidget.name || (0, _languageHandler._t)("Stickerpack"); // FIXME: could this use the same code as other apps?

      const stickerApp = {
        id: stickerpickerWidget.id,
        url: stickerpickerWidget.content.url,
        name: stickerpickerWidget.content.name,
        type: stickerpickerWidget.content.type,
        data: stickerpickerWidget.content.data
      };
      stickersContent = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Stickers_content_container"
      }, /*#__PURE__*/_react.default.createElement("div", {
        id: "stickersContent",
        className: "mx_Stickers_content",
        style: {
          border: 'none',
          height: this.popoverHeight,
          width: this.popoverWidth
        }
      }, /*#__PURE__*/_react.default.createElement(PersistedElement, {
        persistKey: PERSISTED_ELEMENT_KEY,
        style: {
          zIndex: STICKERPICKER_Z_INDEX
        }
      }, /*#__PURE__*/_react.default.createElement(_AppTile.default, {
        app: stickerApp,
        room: this.props.room,
        fullWidth: true,
        userId: _MatrixClientPeg.MatrixClientPeg.get().credentials.userId,
        creatorUserId: stickerpickerWidget.sender || _MatrixClientPeg.MatrixClientPeg.get().credentials.userId,
        waitForIframeLoad: true,
        show: true,
        showMenubar: true,
        onEditClick: this._launchManageIntegrations,
        onDeleteClick: this._removeStickerpickerWidgets,
        showTitle: false,
        showMinimise: true,
        showDelete: false,
        showCancel: false,
        showPopout: false,
        onMinimiseClick: this._onHideStickersClick,
        handleMinimisePointerEvents: true,
        whitelistCapabilities: ['m.sticker', 'visibility'],
        userWidget: true
      }))));
    } else {
      // Default content to show if stickerpicker widget not added
      stickersContent = this._defaultStickerpickerContent();
    }

    return stickersContent;
  } // Dev note: this isn't jsdoc because it's angry.

  /*
   * Show the sticker picker overlay
   * If no stickerpacks have been added, show a link to the integration manager add sticker packs page.
   */


  _onShowStickersClick(e) {
    if (!_SettingsStore.default.getValue("integrationProvisioning")) {
      // Intercept this case and spawn a warning.
      return _IntegrationManagers.IntegrationManagers.sharedInstance().showDisabledDialog();
    } // XXX: Simplify by using a context menu that is positioned relative to the sticker picker button


    const buttonRect = e.target.getBoundingClientRect(); // The window X and Y offsets are to adjust position when zoomed in to page

    let x = buttonRect.right + window.pageXOffset - 41; // Amount of horizontal space between the right of menu and the right of the viewport
    //  (10 = amount needed to make chevron centrally aligned)

    const rightPad = 10; // When the sticker picker would be displayed off of the viewport, adjust x
    //  (302 = width of context menu, including borders)

    x = Math.min(x, document.body.clientWidth - (302 + rightPad)); // Offset the chevron location, which is relative to the left of the context menu
    //  (10 = offset when context menu would not be displayed off viewport)
    //  (2 = context menu borders)

    const stickerPickerChevronOffset = Math.max(10, 2 + window.pageXOffset + buttonRect.left - x);
    const y = buttonRect.top + buttonRect.height / 2 + window.pageYOffset - 19;
    this.setState({
      showStickers: true,
      stickerPickerX: x,
      stickerPickerY: y,
      stickerPickerChevronOffset
    });
  }
  /**
   * Trigger hiding of the sticker picker overlay
   * @param  {Event} ev Event that triggered the function call
   */


  _onHideStickersClick(ev) {
    this.setState({
      showStickers: false
    });
  }
  /**
   * Called when the window is resized
   */


  _onResize() {
    this.setState({
      showStickers: false
    });
  }
  /**
   * The stickers picker was hidden
   */


  _onFinished() {
    this.setState({
      showStickers: false
    });
  }
  /**
   * Launch the integration manager on the stickers integration page
   */


  _launchManageIntegrations() {
    // TODO: Open the right integration manager for the widget
    if (_SettingsStore.default.isFeatureEnabled("feature_many_integration_managers")) {
      _IntegrationManagers.IntegrationManagers.sharedInstance().openAll(this.props.room, "type_".concat(_WidgetType.WidgetType.STICKERPICKER.preferred), this.state.widgetId);
    } else {
      _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager().open(this.props.room, "type_".concat(_WidgetType.WidgetType.STICKERPICKER.preferred), this.state.widgetId);
    }
  }

  render() {
    let stickerPicker;
    let stickersButton;

    if (this.state.showStickers) {
      // Show hide-stickers button
      stickersButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        id: "stickersButton",
        key: "controls_hide_stickers",
        className: "mx_MessageComposer_button mx_MessageComposer_stickers mx_Stickers_hideStickers",
        onClick: this._onHideStickersClick,
        title: (0, _languageHandler._t)("Hide Stickers")
      });
      const GenericElementContextMenu = sdk.getComponent('context_menus.GenericElementContextMenu');
      stickerPicker = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenu, {
        chevronOffset: this.state.stickerPickerChevronOffset,
        chevronFace: "bottom",
        left: this.state.stickerPickerX,
        top: this.state.stickerPickerY,
        menuWidth: this.popoverWidth,
        menuHeight: this.popoverHeight,
        onFinished: this._onFinished,
        menuPaddingTop: 0,
        menuPaddingLeft: 0,
        menuPaddingRight: 0,
        zIndex: STICKERPICKER_Z_INDEX
      }, /*#__PURE__*/_react.default.createElement(GenericElementContextMenu, {
        element: this._getStickerpickerContent(),
        onResize: this._onFinished
      }));
    } else {
      // Show show-stickers button
      stickersButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        id: "stickersButton",
        key: "controls_show_stickers",
        className: "mx_MessageComposer_button mx_MessageComposer_stickers",
        onClick: this._onShowStickersClick,
        title: (0, _languageHandler._t)("Show Stickers")
      });
    }

    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, stickersButton, stickerPicker);
  }

}

exports.default = Stickerpicker;
(0, _defineProperty2.default)(Stickerpicker, "currentWidget", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1N0aWNrZXJwaWNrZXIuanMiXSwibmFtZXMiOlsiU1RJQ0tFUlBJQ0tFUl9aX0lOREVYIiwiUEVSU0lTVEVEX0VMRU1FTlRfS0VZIiwiU3RpY2tlcnBpY2tlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9vblNob3dTdGlja2Vyc0NsaWNrIiwiYmluZCIsIl9vbkhpZGVTdGlja2Vyc0NsaWNrIiwiX2xhdW5jaE1hbmFnZUludGVncmF0aW9ucyIsIl9yZW1vdmVTdGlja2VycGlja2VyV2lkZ2V0cyIsIl91cGRhdGVXaWRnZXQiLCJfb25XaWRnZXRBY3Rpb24iLCJfb25SZXNpemUiLCJfb25GaW5pc2hlZCIsInBvcG92ZXJXaWR0aCIsInBvcG92ZXJIZWlnaHQiLCJzY2FsYXJDbGllbnQiLCJzdGF0ZSIsInNob3dTdGlja2VycyIsImltRXJyb3IiLCJzdGlja2VycGlja2VyWCIsInN0aWNrZXJwaWNrZXJZIiwic3RpY2tlcnBpY2tlcldpZGdldCIsIndpZGdldElkIiwiX2FjcXVpcmVTY2FsYXJDbGllbnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsIkludGVncmF0aW9uTWFuYWdlcnMiLCJzaGFyZWRJbnN0YW5jZSIsImhhc01hbmFnZXIiLCJnZXRQcmltYXJ5TWFuYWdlciIsImdldFNjYWxhckNsaWVudCIsImNvbm5lY3QiLCJ0aGVuIiwiZm9yY2VVcGRhdGUiLCJjYXRjaCIsImUiLCJfaW1FcnJvciIsIm9wZW5Ob01hbmFnZXJEaWFsb2ciLCJjb25zb2xlIiwibG9nIiwiZGlzYWJsZVdpZGdldEFzc2V0cyIsIldpZGdldFR5cGUiLCJTVElDS0VSUElDS0VSIiwiZXJyIiwiZXJyb3IiLCJ3YXJuIiwic2V0U3RhdGUiLCJXaWRnZXRVdGlscyIsInJlbW92ZVN0aWNrZXJwaWNrZXJXaWRnZXRzIiwiY29tcG9uZW50RGlkTW91bnQiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwib24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsaWVudCIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInVucmVnaXN0ZXIiLCJjb21wb25lbnREaWRVcGRhdGUiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJfc2VuZFZpc2liaWxpdHlUb1dpZGdldCIsImVycm9yTXNnIiwiZ2V0U3RpY2tlcnBpY2tlcldpZGdldHMiLCJjdXJyZW50V2lkZ2V0IiwiY3VycmVudFVybCIsImNvbnRlbnQiLCJ1cmwiLCJuZXdVcmwiLCJQZXJzaXN0ZWRFbGVtZW50IiwiZGVzdHJveUVsZW1lbnQiLCJpZCIsInBheWxvYWQiLCJhY3Rpb24iLCJfZGVmYXVsdFN0aWNrZXJwaWNrZXJDb250ZW50IiwicmVxdWlyZSIsIl9lcnJvclN0aWNrZXJwaWNrZXJDb250ZW50IiwidmlzaWJsZSIsIndpZGdldE1lc3NhZ2luZyIsIkFjdGl2ZVdpZGdldFN0b3JlIiwiZ2V0V2lkZ2V0TWVzc2FnaW5nIiwiX3ByZXZTZW50VmlzaWJpbGl0eSIsInNlbmRWaXNpYmlsaXR5IiwiX2dldFN0aWNrZXJwaWNrZXJDb250ZW50Iiwic3RpY2tlcnNDb250ZW50Iiwic2RrIiwiZ2V0Q29tcG9uZW50IiwibmFtZSIsInN0aWNrZXJBcHAiLCJ0eXBlIiwiZGF0YSIsImJvcmRlciIsImhlaWdodCIsIndpZHRoIiwiekluZGV4Iiwicm9vbSIsImNyZWRlbnRpYWxzIiwidXNlcklkIiwic2VuZGVyIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwic2hvd0Rpc2FibGVkRGlhbG9nIiwiYnV0dG9uUmVjdCIsInRhcmdldCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsIngiLCJyaWdodCIsInBhZ2VYT2Zmc2V0IiwicmlnaHRQYWQiLCJNYXRoIiwibWluIiwiZG9jdW1lbnQiLCJib2R5IiwiY2xpZW50V2lkdGgiLCJzdGlja2VyUGlja2VyQ2hldnJvbk9mZnNldCIsIm1heCIsImxlZnQiLCJ5IiwidG9wIiwicGFnZVlPZmZzZXQiLCJzdGlja2VyUGlja2VyWCIsInN0aWNrZXJQaWNrZXJZIiwiZXYiLCJpc0ZlYXR1cmVFbmFibGVkIiwib3BlbkFsbCIsInByZWZlcnJlZCIsIm9wZW4iLCJyZW5kZXIiLCJzdGlja2VyUGlja2VyIiwic3RpY2tlcnNCdXR0b24iLCJHZW5lcmljRWxlbWVudENvbnRleHRNZW51Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBNUJBOzs7Ozs7Ozs7Ozs7Ozs7QUE4QkE7QUFDQTtBQUNBLE1BQU1BLHFCQUFxQixHQUFHLElBQTlCLEMsQ0FFQTs7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxlQUE5Qjs7QUFFZSxNQUFNQyxhQUFOLFNBQTRCQyxlQUFNQyxTQUFsQyxDQUE0QztBQUd2REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBQ0EsU0FBS0Msb0JBQUwsR0FBNEIsS0FBS0Esb0JBQUwsQ0FBMEJDLElBQTFCLENBQStCLElBQS9CLENBQTVCO0FBQ0EsU0FBS0Msb0JBQUwsR0FBNEIsS0FBS0Esb0JBQUwsQ0FBMEJELElBQTFCLENBQStCLElBQS9CLENBQTVCO0FBQ0EsU0FBS0UseUJBQUwsR0FBaUMsS0FBS0EseUJBQUwsQ0FBK0JGLElBQS9CLENBQW9DLElBQXBDLENBQWpDO0FBQ0EsU0FBS0csMkJBQUwsR0FBbUMsS0FBS0EsMkJBQUwsQ0FBaUNILElBQWpDLENBQXNDLElBQXRDLENBQW5DO0FBQ0EsU0FBS0ksYUFBTCxHQUFxQixLQUFLQSxhQUFMLENBQW1CSixJQUFuQixDQUF3QixJQUF4QixDQUFyQjtBQUNBLFNBQUtLLGVBQUwsR0FBdUIsS0FBS0EsZUFBTCxDQUFxQkwsSUFBckIsQ0FBMEIsSUFBMUIsQ0FBdkI7QUFDQSxTQUFLTSxTQUFMLEdBQWlCLEtBQUtBLFNBQUwsQ0FBZU4sSUFBZixDQUFvQixJQUFwQixDQUFqQjtBQUNBLFNBQUtPLFdBQUwsR0FBbUIsS0FBS0EsV0FBTCxDQUFpQlAsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBbkI7QUFFQSxTQUFLUSxZQUFMLEdBQW9CLEdBQXBCO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQixHQUFyQixDQVplLENBY2Y7O0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixJQUFwQjtBQUVBLFNBQUtDLEtBQUwsR0FBYTtBQUNUQyxNQUFBQSxZQUFZLEVBQUUsS0FETDtBQUVUQyxNQUFBQSxPQUFPLEVBQUUsSUFGQTtBQUdUQyxNQUFBQSxjQUFjLEVBQUUsSUFIUDtBQUlUQyxNQUFBQSxjQUFjLEVBQUUsSUFKUDtBQUtUQyxNQUFBQSxtQkFBbUIsRUFBRSxJQUxaO0FBTVRDLE1BQUFBLFFBQVEsRUFBRTtBQU5ELEtBQWI7QUFRSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsUUFBSSxLQUFLUixZQUFULEVBQXVCLE9BQU9TLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFLVixZQUFyQixDQUFQLENBREosQ0FFbkI7O0FBQ0EsUUFBSVcseUNBQW9CQyxjQUFwQixHQUFxQ0MsVUFBckMsRUFBSixFQUF1RDtBQUNuRCxXQUFLYixZQUFMLEdBQW9CVyx5Q0FBb0JDLGNBQXBCLEdBQXFDRSxpQkFBckMsR0FBeURDLGVBQXpELEVBQXBCO0FBQ0EsYUFBTyxLQUFLZixZQUFMLENBQWtCZ0IsT0FBbEIsR0FBNEJDLElBQTVCLENBQWlDLE1BQU07QUFDMUMsYUFBS0MsV0FBTDtBQUNBLGVBQU8sS0FBS2xCLFlBQVo7QUFDSCxPQUhNLEVBR0ptQixLQUhJLENBR0dDLENBQUQsSUFBTztBQUNaLGFBQUtDLFFBQUwsQ0FBYywwQkFBSSwwQ0FBSixDQUFkLEVBQStERCxDQUEvRDtBQUNILE9BTE0sQ0FBUDtBQU1ILEtBUkQsTUFRTztBQUNIVCwrQ0FBb0JDLGNBQXBCLEdBQXFDVSxtQkFBckM7QUFDSDtBQUNKOztBQUVELFFBQU03QiwyQkFBTixHQUFvQztBQUNoQyxVQUFNTyxZQUFZLEdBQUcsTUFBTSxLQUFLUSxvQkFBTCxFQUEzQjtBQUNBZSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQ0FBWjs7QUFDQSxRQUFJLEtBQUt2QixLQUFMLENBQVdNLFFBQWYsRUFBeUI7QUFDckIsVUFBSVAsWUFBSixFQUFrQjtBQUNkQSxRQUFBQSxZQUFZLENBQUN5QixtQkFBYixDQUFpQ0MsdUJBQVdDLGFBQTVDLEVBQTJELEtBQUsxQixLQUFMLENBQVdNLFFBQXRFLEVBQWdGVSxJQUFoRixDQUFxRixNQUFNO0FBQ3ZGTSxVQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxpQkFBWjtBQUNILFNBRkQsRUFFR0wsS0FGSCxDQUVVUyxHQUFELElBQVM7QUFDZEwsVUFBQUEsT0FBTyxDQUFDTSxLQUFSLENBQWMsMEJBQWQ7QUFDSCxTQUpEO0FBS0gsT0FORCxNQU1PO0FBQ0hOLFFBQUFBLE9BQU8sQ0FBQ00sS0FBUixDQUFjLHlDQUFkO0FBQ0g7QUFDSixLQVZELE1BVU87QUFDSE4sTUFBQUEsT0FBTyxDQUFDTyxJQUFSLENBQWEsOENBQWI7QUFDSDs7QUFFRCxTQUFLQyxRQUFMLENBQWM7QUFBQzdCLE1BQUFBLFlBQVksRUFBRTtBQUFmLEtBQWQ7O0FBQ0E4Qix5QkFBWUMsMEJBQVosR0FBeUNoQixJQUF6QyxDQUE4QyxNQUFNO0FBQ2hELFdBQUtDLFdBQUw7QUFDSCxLQUZELEVBRUdDLEtBRkgsQ0FFVUMsQ0FBRCxJQUFPO0FBQ1pHLE1BQUFBLE9BQU8sQ0FBQ00sS0FBUixDQUFjLHdDQUFkLEVBQXdEVCxDQUF4RDtBQUNILEtBSkQ7QUFLSDs7QUFFRGMsRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEI7QUFDQUMsSUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxLQUFLeEMsU0FBdkM7QUFFQSxTQUFLeUMsYUFBTCxHQUFxQkMsb0JBQUlDLFFBQUosQ0FBYSxLQUFLNUMsZUFBbEIsQ0FBckIsQ0FKZ0IsQ0FNaEI7O0FBQ0E2QyxxQ0FBZ0JDLEdBQWhCLEdBQXNCQyxFQUF0QixDQUF5QixhQUF6QixFQUF3QyxLQUFLaEQsYUFBN0MsRUFQZ0IsQ0FTaEI7OztBQUNBLFNBQUtBLGFBQUw7QUFDSDs7QUFFRGlELEVBQUFBLG9CQUFvQixHQUFHO0FBQ25CLFVBQU1DLE1BQU0sR0FBR0osaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFFBQUlHLE1BQUosRUFBWUEsTUFBTSxDQUFDQyxjQUFQLENBQXNCLGFBQXRCLEVBQXFDLEtBQUtuRCxhQUExQztBQUVaeUMsSUFBQUEsTUFBTSxDQUFDVyxtQkFBUCxDQUEyQixRQUEzQixFQUFxQyxLQUFLbEQsU0FBMUM7O0FBQ0EsUUFBSSxLQUFLeUMsYUFBVCxFQUF3QjtBQUNwQkMsMEJBQUlTLFVBQUosQ0FBZSxLQUFLVixhQUFwQjtBQUNIO0FBQ0o7O0FBRURXLEVBQUFBLGtCQUFrQixDQUFDQyxTQUFELEVBQVlDLFNBQVosRUFBdUI7QUFDckMsU0FBS0MsdUJBQUwsQ0FBNkIsS0FBS2xELEtBQUwsQ0FBV0MsWUFBeEM7QUFDSDs7QUFFRG1CLEVBQUFBLFFBQVEsQ0FBQytCLFFBQUQsRUFBV2hDLENBQVgsRUFBYztBQUNsQkcsSUFBQUEsT0FBTyxDQUFDTSxLQUFSLENBQWN1QixRQUFkLEVBQXdCaEMsQ0FBeEI7QUFDQSxTQUFLVyxRQUFMLENBQWM7QUFDVjdCLE1BQUFBLFlBQVksRUFBRSxLQURKO0FBRVZDLE1BQUFBLE9BQU8sRUFBRSx5QkFBR2lELFFBQUg7QUFGQyxLQUFkO0FBSUg7O0FBRUQxRCxFQUFBQSxhQUFhLEdBQUc7QUFDWixVQUFNWSxtQkFBbUIsR0FBRzBCLHFCQUFZcUIsdUJBQVosR0FBc0MsQ0FBdEMsQ0FBNUI7O0FBQ0EsUUFBSSxDQUFDL0MsbUJBQUwsRUFBMEI7QUFDdEJ0QixNQUFBQSxhQUFhLENBQUNzRSxhQUFkLEdBQThCLElBQTlCO0FBQ0EsV0FBS3ZCLFFBQUwsQ0FBYztBQUFDekIsUUFBQUEsbUJBQW1CLEVBQUUsSUFBdEI7QUFBNEJDLFFBQUFBLFFBQVEsRUFBRTtBQUF0QyxPQUFkO0FBQ0E7QUFDSDs7QUFFRCxVQUFNK0MsYUFBYSxHQUFHdEUsYUFBYSxDQUFDc0UsYUFBcEM7QUFDQSxRQUFJQyxVQUFVLEdBQUcsSUFBakI7O0FBQ0EsUUFBSUQsYUFBYSxJQUFJQSxhQUFhLENBQUNFLE9BQS9CLElBQTBDRixhQUFhLENBQUNFLE9BQWQsQ0FBc0JDLEdBQXBFLEVBQXlFO0FBQ3JFRixNQUFBQSxVQUFVLEdBQUdELGFBQWEsQ0FBQ0UsT0FBZCxDQUFzQkMsR0FBbkM7QUFDSDs7QUFFRCxRQUFJQyxNQUFNLEdBQUcsSUFBYjs7QUFDQSxRQUFJcEQsbUJBQW1CLElBQUlBLG1CQUFtQixDQUFDa0QsT0FBM0MsSUFBc0RsRCxtQkFBbUIsQ0FBQ2tELE9BQXBCLENBQTRCQyxHQUF0RixFQUEyRjtBQUN2RkMsTUFBQUEsTUFBTSxHQUFHcEQsbUJBQW1CLENBQUNrRCxPQUFwQixDQUE0QkMsR0FBckM7QUFDSDs7QUFFRCxRQUFJQyxNQUFNLEtBQUtILFVBQWYsRUFBMkI7QUFDdkI7QUFDQUksZ0NBQWlCQyxjQUFqQixDQUFnQzdFLHFCQUFoQztBQUNIOztBQUVEQyxJQUFBQSxhQUFhLENBQUNzRSxhQUFkLEdBQThCaEQsbUJBQTlCO0FBQ0EsU0FBS3lCLFFBQUwsQ0FBYztBQUNWekIsTUFBQUEsbUJBRFU7QUFFVkMsTUFBQUEsUUFBUSxFQUFFRCxtQkFBbUIsR0FBR0EsbUJBQW1CLENBQUN1RCxFQUF2QixHQUE0QjtBQUYvQyxLQUFkO0FBSUg7O0FBRURsRSxFQUFBQSxlQUFlLENBQUNtRSxPQUFELEVBQVU7QUFDckIsWUFBUUEsT0FBTyxDQUFDQyxNQUFoQjtBQUNJLFdBQUsscUJBQUw7QUFDSSxhQUFLN0MsV0FBTDtBQUNBOztBQUNKLFdBQUsscUJBQUw7QUFDSSxhQUFLYSxRQUFMLENBQWM7QUFBQzdCLFVBQUFBLFlBQVksRUFBRTtBQUFmLFNBQWQ7QUFDQTs7QUFDSixXQUFLLGdDQUFMO0FBQ0EsV0FBSyxpQkFBTDtBQUNBLFdBQUssaUJBQUw7QUFDSSxhQUFLNkIsUUFBTCxDQUFjO0FBQUM3QixVQUFBQSxZQUFZLEVBQUU7QUFBZixTQUFkO0FBQ0E7QUFYUjtBQWFIOztBQUVEOEQsRUFBQUEsNEJBQTRCLEdBQUc7QUFDM0Isd0JBQ0ksNkJBQUMseUJBQUQ7QUFBa0IsTUFBQSxPQUFPLEVBQUUsS0FBS3hFLHlCQUFoQztBQUNJLE1BQUEsU0FBUyxFQUFDO0FBRGQsb0JBRUksd0NBQUsseUJBQUcsbURBQUgsQ0FBTCxDQUZKLGVBR0k7QUFBRyxNQUFBLFNBQVMsRUFBQztBQUFiLE9BQXFDLHlCQUFHLGNBQUgsQ0FBckMsQ0FISixlQUlJO0FBQUssTUFBQSxHQUFHLEVBQUV5RSxPQUFPLENBQUMsaURBQUQsQ0FBakI7QUFBc0UsTUFBQSxHQUFHLEVBQUM7QUFBMUUsTUFKSixDQURKO0FBUUg7O0FBRURDLEVBQUFBLDBCQUEwQixHQUFHO0FBQ3pCLHdCQUNJO0FBQUssTUFBQSxLQUFLLEVBQUU7QUFBQyxzQkFBYztBQUFmLE9BQVo7QUFBc0MsTUFBQSxTQUFTLEVBQUM7QUFBaEQsb0JBQ0ksNkNBQU0sS0FBS2pFLEtBQUwsQ0FBV0UsT0FBakIsTUFESixDQURKO0FBS0g7O0FBRURnRCxFQUFBQSx1QkFBdUIsQ0FBQ2dCLE9BQUQsRUFBVTtBQUM3QixRQUFJLENBQUMsS0FBS2xFLEtBQUwsQ0FBV0ssbUJBQWhCLEVBQXFDOztBQUNyQyxVQUFNOEQsZUFBZSxHQUFHQywyQkFBa0JDLGtCQUFsQixDQUFxQyxLQUFLckUsS0FBTCxDQUFXSyxtQkFBWCxDQUErQnVELEVBQXBFLENBQXhCOztBQUNBLFFBQUlPLGVBQWUsSUFBSUQsT0FBTyxLQUFLLEtBQUtJLG1CQUF4QyxFQUE2RDtBQUN6REgsTUFBQUEsZUFBZSxDQUFDSSxjQUFoQixDQUErQkwsT0FBL0I7QUFDQSxXQUFLSSxtQkFBTCxHQUEyQkosT0FBM0I7QUFDSDtBQUNKOztBQUVETSxFQUFBQSx3QkFBd0IsR0FBRztBQUN2QjtBQUNBLFFBQUksS0FBS3hFLEtBQUwsQ0FBV29CLFFBQWYsRUFBeUI7QUFDckIsYUFBTyxLQUFLNkMsMEJBQUwsRUFBUDtBQUNILEtBSnNCLENBTXZCO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxVQUFNNUQsbUJBQW1CLEdBQUcsS0FBS0wsS0FBTCxDQUFXSyxtQkFBdkM7QUFDQSxRQUFJb0UsZUFBSixDQVh1QixDQWF2QjtBQUNBO0FBQ0E7O0FBQ0EsVUFBTWYsZ0JBQWdCLEdBQUdnQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCLENBaEJ1QixDQWtCdkI7O0FBQ0EsUUFBSXRFLG1CQUFtQixJQUFJQSxtQkFBbUIsQ0FBQ2tELE9BQTNDLElBQXNEbEQsbUJBQW1CLENBQUNrRCxPQUFwQixDQUE0QkMsR0FBdEYsRUFBMkY7QUFDdkY7QUFDQW5ELE1BQUFBLG1CQUFtQixDQUFDa0QsT0FBcEIsQ0FBNEJxQixJQUE1QixHQUFtQ3ZFLG1CQUFtQixDQUFDdUUsSUFBcEIsSUFBNEIseUJBQUcsYUFBSCxDQUEvRCxDQUZ1RixDQUl2Rjs7QUFDQSxZQUFNQyxVQUFVLEdBQUc7QUFDZmpCLFFBQUFBLEVBQUUsRUFBRXZELG1CQUFtQixDQUFDdUQsRUFEVDtBQUVmSixRQUFBQSxHQUFHLEVBQUVuRCxtQkFBbUIsQ0FBQ2tELE9BQXBCLENBQTRCQyxHQUZsQjtBQUdmb0IsUUFBQUEsSUFBSSxFQUFFdkUsbUJBQW1CLENBQUNrRCxPQUFwQixDQUE0QnFCLElBSG5CO0FBSWZFLFFBQUFBLElBQUksRUFBRXpFLG1CQUFtQixDQUFDa0QsT0FBcEIsQ0FBNEJ1QixJQUpuQjtBQUtmQyxRQUFBQSxJQUFJLEVBQUUxRSxtQkFBbUIsQ0FBQ2tELE9BQXBCLENBQTRCd0I7QUFMbkIsT0FBbkI7QUFRQU4sTUFBQUEsZUFBZSxnQkFDWDtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0k7QUFDSSxRQUFBLEVBQUUsRUFBQyxpQkFEUDtBQUVJLFFBQUEsU0FBUyxFQUFDLHFCQUZkO0FBR0ksUUFBQSxLQUFLLEVBQUU7QUFDSE8sVUFBQUEsTUFBTSxFQUFFLE1BREw7QUFFSEMsVUFBQUEsTUFBTSxFQUFFLEtBQUtuRixhQUZWO0FBR0hvRixVQUFBQSxLQUFLLEVBQUUsS0FBS3JGO0FBSFQ7QUFIWCxzQkFTQSw2QkFBQyxnQkFBRDtBQUFrQixRQUFBLFVBQVUsRUFBRWYscUJBQTlCO0FBQXFELFFBQUEsS0FBSyxFQUFFO0FBQUNxRyxVQUFBQSxNQUFNLEVBQUV0RztBQUFUO0FBQTVELHNCQUNJLDZCQUFDLGdCQUFEO0FBQ0ksUUFBQSxHQUFHLEVBQUVnRyxVQURUO0FBRUksUUFBQSxJQUFJLEVBQUUsS0FBSzFGLEtBQUwsQ0FBV2lHLElBRnJCO0FBR0ksUUFBQSxTQUFTLEVBQUUsSUFIZjtBQUlJLFFBQUEsTUFBTSxFQUFFN0MsaUNBQWdCQyxHQUFoQixHQUFzQjZDLFdBQXRCLENBQWtDQyxNQUo5QztBQUtJLFFBQUEsYUFBYSxFQUFFakYsbUJBQW1CLENBQUNrRixNQUFwQixJQUE4QmhELGlDQUFnQkMsR0FBaEIsR0FBc0I2QyxXQUF0QixDQUFrQ0MsTUFMbkY7QUFNSSxRQUFBLGlCQUFpQixFQUFFLElBTnZCO0FBT0ksUUFBQSxJQUFJLEVBQUUsSUFQVjtBQVFJLFFBQUEsV0FBVyxFQUFFLElBUmpCO0FBU0ksUUFBQSxXQUFXLEVBQUUsS0FBSy9GLHlCQVR0QjtBQVVJLFFBQUEsYUFBYSxFQUFFLEtBQUtDLDJCQVZ4QjtBQVdJLFFBQUEsU0FBUyxFQUFFLEtBWGY7QUFZSSxRQUFBLFlBQVksRUFBRSxJQVpsQjtBQWFJLFFBQUEsVUFBVSxFQUFFLEtBYmhCO0FBY0ksUUFBQSxVQUFVLEVBQUUsS0FkaEI7QUFlSSxRQUFBLFVBQVUsRUFBRSxLQWZoQjtBQWdCSSxRQUFBLGVBQWUsRUFBRSxLQUFLRixvQkFoQjFCO0FBaUJJLFFBQUEsMkJBQTJCLEVBQUUsSUFqQmpDO0FBa0JJLFFBQUEscUJBQXFCLEVBQUUsQ0FBQyxXQUFELEVBQWMsWUFBZCxDQWxCM0I7QUFtQkksUUFBQSxVQUFVLEVBQUU7QUFuQmhCLFFBREosQ0FUQSxDQURKLENBREo7QUFxQ0gsS0FsREQsTUFrRE87QUFDSDtBQUNBbUYsTUFBQUEsZUFBZSxHQUFHLEtBQUtWLDRCQUFMLEVBQWxCO0FBQ0g7O0FBQ0QsV0FBT1UsZUFBUDtBQUNILEdBL1BzRCxDQWlRdkQ7O0FBQ0E7Ozs7OztBQUlBckYsRUFBQUEsb0JBQW9CLENBQUMrQixDQUFELEVBQUk7QUFDcEIsUUFBSSxDQUFDcUUsdUJBQWNDLFFBQWQsQ0FBdUIseUJBQXZCLENBQUwsRUFBd0Q7QUFDcEQ7QUFDQSxhQUFPL0UseUNBQW9CQyxjQUFwQixHQUFxQytFLGtCQUFyQyxFQUFQO0FBQ0gsS0FKbUIsQ0FNcEI7OztBQUVBLFVBQU1DLFVBQVUsR0FBR3hFLENBQUMsQ0FBQ3lFLE1BQUYsQ0FBU0MscUJBQVQsRUFBbkIsQ0FSb0IsQ0FVcEI7O0FBQ0EsUUFBSUMsQ0FBQyxHQUFHSCxVQUFVLENBQUNJLEtBQVgsR0FBbUI3RCxNQUFNLENBQUM4RCxXQUExQixHQUF3QyxFQUFoRCxDQVhvQixDQWFwQjtBQUNBOztBQUNBLFVBQU1DLFFBQVEsR0FBRyxFQUFqQixDQWZvQixDQWlCcEI7QUFDQTs7QUFDQUgsSUFBQUEsQ0FBQyxHQUFHSSxJQUFJLENBQUNDLEdBQUwsQ0FBU0wsQ0FBVCxFQUFZTSxRQUFRLENBQUNDLElBQVQsQ0FBY0MsV0FBZCxJQUE2QixNQUFNTCxRQUFuQyxDQUFaLENBQUosQ0FuQm9CLENBcUJwQjtBQUNBO0FBQ0E7O0FBQ0EsVUFBTU0sMEJBQTBCLEdBQUdMLElBQUksQ0FBQ00sR0FBTCxDQUFTLEVBQVQsRUFBYSxJQUFJdEUsTUFBTSxDQUFDOEQsV0FBWCxHQUF5QkwsVUFBVSxDQUFDYyxJQUFwQyxHQUEyQ1gsQ0FBeEQsQ0FBbkM7QUFFQSxVQUFNWSxDQUFDLEdBQUlmLFVBQVUsQ0FBQ2dCLEdBQVgsR0FBa0JoQixVQUFVLENBQUNWLE1BQVgsR0FBb0IsQ0FBdEMsR0FBMkMvQyxNQUFNLENBQUMwRSxXQUFuRCxHQUFrRSxFQUE1RTtBQUVBLFNBQUs5RSxRQUFMLENBQWM7QUFDVjdCLE1BQUFBLFlBQVksRUFBRSxJQURKO0FBRVY0RyxNQUFBQSxjQUFjLEVBQUVmLENBRk47QUFHVmdCLE1BQUFBLGNBQWMsRUFBRUosQ0FITjtBQUlWSCxNQUFBQTtBQUpVLEtBQWQ7QUFNSDtBQUVEOzs7Ozs7QUFJQWpILEVBQUFBLG9CQUFvQixDQUFDeUgsRUFBRCxFQUFLO0FBQ3JCLFNBQUtqRixRQUFMLENBQWM7QUFBQzdCLE1BQUFBLFlBQVksRUFBRTtBQUFmLEtBQWQ7QUFDSDtBQUVEOzs7OztBQUdBTixFQUFBQSxTQUFTLEdBQUc7QUFDUixTQUFLbUMsUUFBTCxDQUFjO0FBQUM3QixNQUFBQSxZQUFZLEVBQUU7QUFBZixLQUFkO0FBQ0g7QUFFRDs7Ozs7QUFHQUwsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS2tDLFFBQUwsQ0FBYztBQUFDN0IsTUFBQUEsWUFBWSxFQUFFO0FBQWYsS0FBZDtBQUNIO0FBRUQ7Ozs7O0FBR0FWLEVBQUFBLHlCQUF5QixHQUFHO0FBQ3hCO0FBQ0EsUUFBSWlHLHVCQUFjd0IsZ0JBQWQsQ0FBK0IsbUNBQS9CLENBQUosRUFBeUU7QUFDckV0RywrQ0FBb0JDLGNBQXBCLEdBQXFDc0csT0FBckMsQ0FDSSxLQUFLOUgsS0FBTCxDQUFXaUcsSUFEZixpQkFFWTNELHVCQUFXQyxhQUFYLENBQXlCd0YsU0FGckMsR0FHSSxLQUFLbEgsS0FBTCxDQUFXTSxRQUhmO0FBS0gsS0FORCxNQU1PO0FBQ0hJLCtDQUFvQkMsY0FBcEIsR0FBcUNFLGlCQUFyQyxHQUF5RHNHLElBQXpELENBQ0ksS0FBS2hJLEtBQUwsQ0FBV2lHLElBRGYsaUJBRVkzRCx1QkFBV0MsYUFBWCxDQUF5QndGLFNBRnJDLEdBR0ksS0FBS2xILEtBQUwsQ0FBV00sUUFIZjtBQUtIO0FBQ0o7O0FBRUQ4RyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxRQUFJQyxhQUFKO0FBQ0EsUUFBSUMsY0FBSjs7QUFDQSxRQUFJLEtBQUt0SCxLQUFMLENBQVdDLFlBQWYsRUFBNkI7QUFDekI7QUFDQXFILE1BQUFBLGNBQWMsZ0JBQ1YsNkJBQUMseUJBQUQ7QUFDSSxRQUFBLEVBQUUsRUFBQyxnQkFEUDtBQUVJLFFBQUEsR0FBRyxFQUFDLHdCQUZSO0FBR0ksUUFBQSxTQUFTLEVBQUMsZ0ZBSGQ7QUFJSSxRQUFBLE9BQU8sRUFBRSxLQUFLaEksb0JBSmxCO0FBS0ksUUFBQSxLQUFLLEVBQUUseUJBQUcsZUFBSDtBQUxYLFFBREo7QUFVQSxZQUFNaUkseUJBQXlCLEdBQUc3QyxHQUFHLENBQUNDLFlBQUosQ0FBaUIseUNBQWpCLENBQWxDO0FBQ0EwQyxNQUFBQSxhQUFhLGdCQUFHLDZCQUFDLHdCQUFEO0FBQ1osUUFBQSxhQUFhLEVBQUUsS0FBS3JILEtBQUwsQ0FBV3VHLDBCQURkO0FBRVosUUFBQSxXQUFXLEVBQUMsUUFGQTtBQUdaLFFBQUEsSUFBSSxFQUFFLEtBQUt2RyxLQUFMLENBQVc2RyxjQUhMO0FBSVosUUFBQSxHQUFHLEVBQUUsS0FBSzdHLEtBQUwsQ0FBVzhHLGNBSko7QUFLWixRQUFBLFNBQVMsRUFBRSxLQUFLakgsWUFMSjtBQU1aLFFBQUEsVUFBVSxFQUFFLEtBQUtDLGFBTkw7QUFPWixRQUFBLFVBQVUsRUFBRSxLQUFLRixXQVBMO0FBUVosUUFBQSxjQUFjLEVBQUUsQ0FSSjtBQVNaLFFBQUEsZUFBZSxFQUFFLENBVEw7QUFVWixRQUFBLGdCQUFnQixFQUFFLENBVk47QUFXWixRQUFBLE1BQU0sRUFBRWY7QUFYSSxzQkFhWiw2QkFBQyx5QkFBRDtBQUEyQixRQUFBLE9BQU8sRUFBRSxLQUFLMkYsd0JBQUwsRUFBcEM7QUFBcUUsUUFBQSxRQUFRLEVBQUUsS0FBSzVFO0FBQXBGLFFBYlksQ0FBaEI7QUFlSCxLQTVCRCxNQTRCTztBQUNIO0FBQ0EwSCxNQUFBQSxjQUFjLGdCQUNWLDZCQUFDLHlCQUFEO0FBQ0ksUUFBQSxFQUFFLEVBQUMsZ0JBRFA7QUFFSSxRQUFBLEdBQUcsRUFBQyx3QkFGUjtBQUdJLFFBQUEsU0FBUyxFQUFDLHVEQUhkO0FBSUksUUFBQSxPQUFPLEVBQUUsS0FBS2xJLG9CQUpsQjtBQUtJLFFBQUEsS0FBSyxFQUFFLHlCQUFHLGVBQUg7QUFMWCxRQURKO0FBU0g7O0FBQ0Qsd0JBQU8sNkJBQUMsY0FBRCxDQUFPLFFBQVAsUUFDRGtJLGNBREMsRUFFREQsYUFGQyxDQUFQO0FBSUg7O0FBbllzRDs7OzhCQUF0Q3RJLGEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7X3QsIF90ZH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBBcHBUaWxlIGZyb20gJy4uL2VsZW1lbnRzL0FwcFRpbGUnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgV2lkZ2V0VXRpbHMgZnJvbSAnLi4vLi4vLi4vdXRpbHMvV2lkZ2V0VXRpbHMnO1xuaW1wb3J0IEFjdGl2ZVdpZGdldFN0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9BY3RpdmVXaWRnZXRTdG9yZSc7XG5pbXBvcnQgUGVyc2lzdGVkRWxlbWVudCBmcm9tIFwiLi4vZWxlbWVudHMvUGVyc2lzdGVkRWxlbWVudFwiO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi4vLi4vLi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQge0NvbnRleHRNZW51fSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuaW1wb3J0IHtXaWRnZXRUeXBlfSBmcm9tIFwiLi4vLi4vLi4vd2lkZ2V0cy9XaWRnZXRUeXBlXCI7XG5cbi8vIFRoaXMgc2hvdWxkIGJlIGJlbG93IHRoZSBkaWFsb2cgbGV2ZWwgKDQwMDApLCBidXQgYWJvdmUgdGhlIHJlc3Qgb2YgdGhlIFVJICgxMDAwLTIwMDApLlxuLy8gV2Ugc2l0IGluIGEgY29udGV4dCBtZW51LCBzbyB0aGlzIHNob3VsZCBiZSBnaXZlbiB0byB0aGUgY29udGV4dCBtZW51LlxuY29uc3QgU1RJQ0tFUlBJQ0tFUl9aX0lOREVYID0gMzUwMDtcblxuLy8gS2V5IHRvIHN0b3JlIHRoZSB3aWRnZXQncyBBcHBUaWxlIHVuZGVyIGluIFBlcnNpc3RlZEVsZW1lbnRcbmNvbnN0IFBFUlNJU1RFRF9FTEVNRU5UX0tFWSA9IFwic3RpY2tlclBpY2tlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGlja2VycGlja2VyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgY3VycmVudFdpZGdldDtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5fb25TaG93U3RpY2tlcnNDbGljayA9IHRoaXMuX29uU2hvd1N0aWNrZXJzQ2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25IaWRlU3RpY2tlcnNDbGljayA9IHRoaXMuX29uSGlkZVN0aWNrZXJzQ2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fbGF1bmNoTWFuYWdlSW50ZWdyYXRpb25zID0gdGhpcy5fbGF1bmNoTWFuYWdlSW50ZWdyYXRpb25zLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNrZXJwaWNrZXJXaWRnZXRzID0gdGhpcy5fcmVtb3ZlU3RpY2tlcnBpY2tlcldpZGdldHMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlV2lkZ2V0ID0gdGhpcy5fdXBkYXRlV2lkZ2V0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uV2lkZ2V0QWN0aW9uID0gdGhpcy5fb25XaWRnZXRBY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25SZXNpemUgPSB0aGlzLl9vblJlc2l6ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbkZpbmlzaGVkID0gdGhpcy5fb25GaW5pc2hlZC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMucG9wb3ZlcldpZHRoID0gMzAwO1xuICAgICAgICB0aGlzLnBvcG92ZXJIZWlnaHQgPSAzMDA7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBsb2FkZWQgYnkgX2FjcXVpcmVTY2FsYXJDbGllbnQgb24gYW4gYXMtbmVlZGVkIGJhc2lzLlxuICAgICAgICB0aGlzLnNjYWxhckNsaWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHNob3dTdGlja2VyczogZmFsc2UsXG4gICAgICAgICAgICBpbUVycm9yOiBudWxsLFxuICAgICAgICAgICAgc3RpY2tlcnBpY2tlclg6IG51bGwsXG4gICAgICAgICAgICBzdGlja2VycGlja2VyWTogbnVsbCxcbiAgICAgICAgICAgIHN0aWNrZXJwaWNrZXJXaWRnZXQ6IG51bGwsXG4gICAgICAgICAgICB3aWRnZXRJZDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfYWNxdWlyZVNjYWxhckNsaWVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2NhbGFyQ2xpZW50KSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc2NhbGFyQ2xpZW50KTtcbiAgICAgICAgLy8gVE9ETzogUGljayB0aGUgcmlnaHQgbWFuYWdlciBmb3IgdGhlIHdpZGdldFxuICAgICAgICBpZiAoSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLmhhc01hbmFnZXIoKSkge1xuICAgICAgICAgICAgdGhpcy5zY2FsYXJDbGllbnQgPSBJbnRlZ3JhdGlvbk1hbmFnZXJzLnNoYXJlZEluc3RhbmNlKCkuZ2V0UHJpbWFyeU1hbmFnZXIoKS5nZXRTY2FsYXJDbGllbnQoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxhckNsaWVudC5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxhckNsaWVudDtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1FcnJvcihfdGQoXCJGYWlsZWQgdG8gY29ubmVjdCB0byBpbnRlZ3JhdGlvbiBtYW5hZ2VyXCIpLCBlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLm9wZW5Ob01hbmFnZXJEaWFsb2coKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9yZW1vdmVTdGlja2VycGlja2VyV2lkZ2V0cygpIHtcbiAgICAgICAgY29uc3Qgc2NhbGFyQ2xpZW50ID0gYXdhaXQgdGhpcy5fYWNxdWlyZVNjYWxhckNsaWVudCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnUmVtb3ZpbmcgU3RpY2tlcnBpY2tlciB3aWRnZXRzJyk7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLndpZGdldElkKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyQ2xpZW50KSB7XG4gICAgICAgICAgICAgICAgc2NhbGFyQ2xpZW50LmRpc2FibGVXaWRnZXRBc3NldHMoV2lkZ2V0VHlwZS5TVElDS0VSUElDS0VSLCB0aGlzLnN0YXRlLndpZGdldElkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Fzc2V0cyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGRpc2FibGUgYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYW5ub3QgZGlzYWJsZSBhc3NldHM6IG5vIHNjYWxhciBjbGllbnRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIHdpZGdldCBJRCBzcGVjaWZpZWQsIG5vdCBkaXNhYmxpbmcgYXNzZXRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93U3RpY2tlcnM6IGZhbHNlfSk7XG4gICAgICAgIFdpZGdldFV0aWxzLnJlbW92ZVN0aWNrZXJwaWNrZXJXaWRnZXRzKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVtb3ZlIHN0aWNrZXIgcGlja2VyIHdpZGdldCcsIGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgLy8gQ2xvc2UgdGhlIHN0aWNrZXIgcGlja2VyIHdoZW4gdGhlIHdpbmRvdyByZXNpemVzXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLl9vblJlc2l6ZSk7XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMuX29uV2lkZ2V0QWN0aW9uKTtcblxuICAgICAgICAvLyBUcmFjayB1cGRhdGVzIHRvIHdpZGdldCBzdGF0ZSBpbiBhY2NvdW50IGRhdGFcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKCdhY2NvdW50RGF0YScsIHRoaXMuX3VwZGF0ZVdpZGdldCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGlzZSB3aWRnZXQgc3RhdGUgZnJvbSBjdXJyZW50IGFjY291bnQgZGF0YVxuICAgICAgICB0aGlzLl91cGRhdGVXaWRnZXQoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpZW50KSBjbGllbnQucmVtb3ZlTGlzdGVuZXIoJ2FjY291bnREYXRhJywgdGhpcy5fdXBkYXRlV2lkZ2V0KTtcblxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5fb25SZXNpemUpO1xuICAgICAgICBpZiAodGhpcy5kaXNwYXRjaGVyUmVmKSB7XG4gICAgICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLmRpc3BhdGNoZXJSZWYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgICAgIHRoaXMuX3NlbmRWaXNpYmlsaXR5VG9XaWRnZXQodGhpcy5zdGF0ZS5zaG93U3RpY2tlcnMpO1xuICAgIH1cblxuICAgIF9pbUVycm9yKGVycm9yTXNnLCBlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNc2csIGUpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNob3dTdGlja2VyczogZmFsc2UsXG4gICAgICAgICAgICBpbUVycm9yOiBfdChlcnJvck1zZyksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF91cGRhdGVXaWRnZXQoKSB7XG4gICAgICAgIGNvbnN0IHN0aWNrZXJwaWNrZXJXaWRnZXQgPSBXaWRnZXRVdGlscy5nZXRTdGlja2VycGlja2VyV2lkZ2V0cygpWzBdO1xuICAgICAgICBpZiAoIXN0aWNrZXJwaWNrZXJXaWRnZXQpIHtcbiAgICAgICAgICAgIFN0aWNrZXJwaWNrZXIuY3VycmVudFdpZGdldCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzdGlja2VycGlja2VyV2lkZ2V0OiBudWxsLCB3aWRnZXRJZDogbnVsbH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudFdpZGdldCA9IFN0aWNrZXJwaWNrZXIuY3VycmVudFdpZGdldDtcbiAgICAgICAgbGV0IGN1cnJlbnRVcmwgPSBudWxsO1xuICAgICAgICBpZiAoY3VycmVudFdpZGdldCAmJiBjdXJyZW50V2lkZ2V0LmNvbnRlbnQgJiYgY3VycmVudFdpZGdldC5jb250ZW50LnVybCkge1xuICAgICAgICAgICAgY3VycmVudFVybCA9IGN1cnJlbnRXaWRnZXQuY29udGVudC51cmw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmV3VXJsID0gbnVsbDtcbiAgICAgICAgaWYgKHN0aWNrZXJwaWNrZXJXaWRnZXQgJiYgc3RpY2tlcnBpY2tlcldpZGdldC5jb250ZW50ICYmIHN0aWNrZXJwaWNrZXJXaWRnZXQuY29udGVudC51cmwpIHtcbiAgICAgICAgICAgIG5ld1VybCA9IHN0aWNrZXJwaWNrZXJXaWRnZXQuY29udGVudC51cmw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VXJsICE9PSBjdXJyZW50VXJsKSB7XG4gICAgICAgICAgICAvLyBEZXN0cm95IHRoZSBleGlzdGluZyBmcmFtZSBzbyBhIG5ldyBvbmUgY2FuIGJlIGNyZWF0ZWRcbiAgICAgICAgICAgIFBlcnNpc3RlZEVsZW1lbnQuZGVzdHJveUVsZW1lbnQoUEVSU0lTVEVEX0VMRU1FTlRfS0VZKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFN0aWNrZXJwaWNrZXIuY3VycmVudFdpZGdldCA9IHN0aWNrZXJwaWNrZXJXaWRnZXQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RpY2tlcnBpY2tlcldpZGdldCxcbiAgICAgICAgICAgIHdpZGdldElkOiBzdGlja2VycGlja2VyV2lkZ2V0ID8gc3RpY2tlcnBpY2tlcldpZGdldC5pZCA6IG51bGwsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbldpZGdldEFjdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgXCJ1c2VyX3dpZGdldF91cGRhdGVkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0aWNrZXJwaWNrZXJfY2xvc2VcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93U3RpY2tlcnM6IGZhbHNlfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYWZ0ZXJfcmlnaHRfcGFuZWxfcGhhc2VfY2hhbmdlXCI6XG4gICAgICAgICAgICBjYXNlIFwic2hvd19sZWZ0X3BhbmVsXCI6XG4gICAgICAgICAgICBjYXNlIFwiaGlkZV9sZWZ0X3BhbmVsXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd1N0aWNrZXJzOiBmYWxzZX0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2RlZmF1bHRTdGlja2VycGlja2VyQ29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2xhdW5jaE1hbmFnZUludGVncmF0aW9uc31cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9J214X1N0aWNrZXJzX2NvbnRlbnRQbGFjZWhvbGRlcic+XG4gICAgICAgICAgICAgICAgPHA+eyBfdChcIllvdSBkb24ndCBjdXJyZW50bHkgaGF2ZSBhbnkgc3RpY2tlcnBhY2tzIGVuYWJsZWRcIikgfTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9J214X1N0aWNrZXJzX2FkZExpbmsnPnsgX3QoXCJBZGQgc29tZSBub3dcIikgfTwvcD5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvc3RpY2tlcnBhY2stcGxhY2Vob2xkZXIucG5nXCIpfSBhbHQ9XCJcIiAvPlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9lcnJvclN0aWNrZXJwaWNrZXJDb250ZW50KCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBzdHlsZT17e1widGV4dC1hbGlnblwiOiBcImNlbnRlclwifX0gY2xhc3NOYW1lPVwiZXJyb3JcIj5cbiAgICAgICAgICAgICAgICA8cD4geyB0aGlzLnN0YXRlLmltRXJyb3IgfSA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfc2VuZFZpc2liaWxpdHlUb1dpZGdldCh2aXNpYmxlKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5zdGlja2VycGlja2VyV2lkZ2V0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHdpZGdldE1lc3NhZ2luZyA9IEFjdGl2ZVdpZGdldFN0b3JlLmdldFdpZGdldE1lc3NhZ2luZyh0aGlzLnN0YXRlLnN0aWNrZXJwaWNrZXJXaWRnZXQuaWQpO1xuICAgICAgICBpZiAod2lkZ2V0TWVzc2FnaW5nICYmIHZpc2libGUgIT09IHRoaXMuX3ByZXZTZW50VmlzaWJpbGl0eSkge1xuICAgICAgICAgICAgd2lkZ2V0TWVzc2FnaW5nLnNlbmRWaXNpYmlsaXR5KHZpc2libGUpO1xuICAgICAgICAgICAgdGhpcy5fcHJldlNlbnRWaXNpYmlsaXR5ID0gdmlzaWJsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9nZXRTdGlja2VycGlja2VyQ29udGVudCgpIHtcbiAgICAgICAgLy8gSGFuZGxlIEludGVncmF0aW9uIE1hbmFnZXIgZXJyb3JzXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLl9pbUVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZXJyb3JTdGlja2VycGlja2VyQ29udGVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RpY2tlcnNcbiAgICAgICAgLy8gVE9ETyAtIEFkZCBzdXBwb3J0IGZvciBTdGlja2VycGlja2VycyBmcm9tIG11bHRpcGxlIGFwcCBzdG9yZXMuXG4gICAgICAgIC8vIFJlbmRlciBjb250ZW50IGZyb20gbXVsdGlwbGUgc3RpY2tlcnBhY2sgc291cmNlcywgZWFjaCB3aXRoaW4gdGhlaXJcbiAgICAgICAgLy8gb3duIGlmcmFtZSwgd2l0aGluIHRoZSBzdGlja2VycGlja2VyIFVJIGVsZW1lbnQuXG4gICAgICAgIGNvbnN0IHN0aWNrZXJwaWNrZXJXaWRnZXQgPSB0aGlzLnN0YXRlLnN0aWNrZXJwaWNrZXJXaWRnZXQ7XG4gICAgICAgIGxldCBzdGlja2Vyc0NvbnRlbnQ7XG5cbiAgICAgICAgLy8gVXNlIGEgc2VwYXJhdGUgUmVhY3RET00gdHJlZSB0byByZW5kZXIgdGhlIEFwcFRpbGUgc2VwYXJhdGVseSBzbyB0aGF0IGl0IHBlcnNpc3RzIGFuZCBkb2VzXG4gICAgICAgIC8vIG5vdCB1bm1vdW50IHdoZW4gd2UgKGEpIGNsb3NlIHRoZSBzdGlja2VyIHBpY2tlciAoYikgc3dpdGNoIHJvb21zLiBJdCdzIHByb3BlcnRpZXMgYXJlIHN0aWxsXG4gICAgICAgIC8vIHVwZGF0ZWQuXG4gICAgICAgIGNvbnN0IFBlcnNpc3RlZEVsZW1lbnQgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuUGVyc2lzdGVkRWxlbWVudFwiKTtcblxuICAgICAgICAvLyBMb2FkIHN0aWNrZXJwYWNrIGNvbnRlbnRcbiAgICAgICAgaWYgKHN0aWNrZXJwaWNrZXJXaWRnZXQgJiYgc3RpY2tlcnBpY2tlcldpZGdldC5jb250ZW50ICYmIHN0aWNrZXJwaWNrZXJXaWRnZXQuY29udGVudC51cmwpIHtcbiAgICAgICAgICAgIC8vIFNldCBkZWZhdWx0IG5hbWVcbiAgICAgICAgICAgIHN0aWNrZXJwaWNrZXJXaWRnZXQuY29udGVudC5uYW1lID0gc3RpY2tlcnBpY2tlcldpZGdldC5uYW1lIHx8IF90KFwiU3RpY2tlcnBhY2tcIik7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiBjb3VsZCB0aGlzIHVzZSB0aGUgc2FtZSBjb2RlIGFzIG90aGVyIGFwcHM/XG4gICAgICAgICAgICBjb25zdCBzdGlja2VyQXBwID0ge1xuICAgICAgICAgICAgICAgIGlkOiBzdGlja2VycGlja2VyV2lkZ2V0LmlkLFxuICAgICAgICAgICAgICAgIHVybDogc3RpY2tlcnBpY2tlcldpZGdldC5jb250ZW50LnVybCxcbiAgICAgICAgICAgICAgICBuYW1lOiBzdGlja2VycGlja2VyV2lkZ2V0LmNvbnRlbnQubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBzdGlja2VycGlja2VyV2lkZ2V0LmNvbnRlbnQudHlwZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBzdGlja2VycGlja2VyV2lkZ2V0LmNvbnRlbnQuZGF0YSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHN0aWNrZXJzQ29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU3RpY2tlcnNfY29udGVudF9jb250YWluZXInPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD0nc3RpY2tlcnNDb250ZW50J1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPSdteF9TdGlja2Vyc19jb250ZW50J1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMucG9wb3ZlckhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy5wb3BvdmVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxQZXJzaXN0ZWRFbGVtZW50IHBlcnNpc3RLZXk9e1BFUlNJU1RFRF9FTEVNRU5UX0tFWX0gc3R5bGU9e3t6SW5kZXg6IFNUSUNLRVJQSUNLRVJfWl9JTkRFWH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgPEFwcFRpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHA9e3N0aWNrZXJBcHB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbT17dGhpcy5wcm9wcy5yb29tfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxXaWR0aD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VySWQ9e01hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRvclVzZXJJZD17c3RpY2tlcnBpY2tlcldpZGdldC5zZW5kZXIgfHwgTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWRlbnRpYWxzLnVzZXJJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9ySWZyYW1lTG9hZD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93PXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZW51YmFyPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRWRpdENsaWNrPXt0aGlzLl9sYXVuY2hNYW5hZ2VJbnRlZ3JhdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EZWxldGVDbGljaz17dGhpcy5fcmVtb3ZlU3RpY2tlcnBpY2tlcldpZGdldHN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1RpdGxlPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWluaW1pc2U9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0RlbGV0ZT17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1BvcG91dD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25NaW5pbWlzZUNsaWNrPXt0aGlzLl9vbkhpZGVTdGlja2Vyc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZU1pbmltaXNlUG9pbnRlckV2ZW50cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZWxpc3RDYXBhYmlsaXRpZXM9e1snbS5zdGlja2VyJywgJ3Zpc2liaWxpdHknXX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyV2lkZ2V0PXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9QZXJzaXN0ZWRFbGVtZW50PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0IGNvbnRlbnQgdG8gc2hvdyBpZiBzdGlja2VycGlja2VyIHdpZGdldCBub3QgYWRkZWRcbiAgICAgICAgICAgIHN0aWNrZXJzQ29udGVudCA9IHRoaXMuX2RlZmF1bHRTdGlja2VycGlja2VyQ29udGVudCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGlja2Vyc0NvbnRlbnQ7XG4gICAgfVxuXG4gICAgLy8gRGV2IG5vdGU6IHRoaXMgaXNuJ3QganNkb2MgYmVjYXVzZSBpdCdzIGFuZ3J5LlxuICAgIC8qXG4gICAgICogU2hvdyB0aGUgc3RpY2tlciBwaWNrZXIgb3ZlcmxheVxuICAgICAqIElmIG5vIHN0aWNrZXJwYWNrcyBoYXZlIGJlZW4gYWRkZWQsIHNob3cgYSBsaW5rIHRvIHRoZSBpbnRlZ3JhdGlvbiBtYW5hZ2VyIGFkZCBzdGlja2VyIHBhY2tzIHBhZ2UuXG4gICAgICovXG4gICAgX29uU2hvd1N0aWNrZXJzQ2xpY2soZSkge1xuICAgICAgICBpZiAoIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJpbnRlZ3JhdGlvblByb3Zpc2lvbmluZ1wiKSkge1xuICAgICAgICAgICAgLy8gSW50ZXJjZXB0IHRoaXMgY2FzZSBhbmQgc3Bhd24gYSB3YXJuaW5nLlxuICAgICAgICAgICAgcmV0dXJuIEludGVncmF0aW9uTWFuYWdlcnMuc2hhcmVkSW5zdGFuY2UoKS5zaG93RGlzYWJsZWREaWFsb2coKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFhYWDogU2ltcGxpZnkgYnkgdXNpbmcgYSBjb250ZXh0IG1lbnUgdGhhdCBpcyBwb3NpdGlvbmVkIHJlbGF0aXZlIHRvIHRoZSBzdGlja2VyIHBpY2tlciBidXR0b25cblxuICAgICAgICBjb25zdCBidXR0b25SZWN0ID0gZS50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgLy8gVGhlIHdpbmRvdyBYIGFuZCBZIG9mZnNldHMgYXJlIHRvIGFkanVzdCBwb3NpdGlvbiB3aGVuIHpvb21lZCBpbiB0byBwYWdlXG4gICAgICAgIGxldCB4ID0gYnV0dG9uUmVjdC5yaWdodCArIHdpbmRvdy5wYWdlWE9mZnNldCAtIDQxO1xuXG4gICAgICAgIC8vIEFtb3VudCBvZiBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gdGhlIHJpZ2h0IG9mIG1lbnUgYW5kIHRoZSByaWdodCBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgLy8gICgxMCA9IGFtb3VudCBuZWVkZWQgdG8gbWFrZSBjaGV2cm9uIGNlbnRyYWxseSBhbGlnbmVkKVxuICAgICAgICBjb25zdCByaWdodFBhZCA9IDEwO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHN0aWNrZXIgcGlja2VyIHdvdWxkIGJlIGRpc3BsYXllZCBvZmYgb2YgdGhlIHZpZXdwb3J0LCBhZGp1c3QgeFxuICAgICAgICAvLyAgKDMwMiA9IHdpZHRoIG9mIGNvbnRleHQgbWVudSwgaW5jbHVkaW5nIGJvcmRlcnMpXG4gICAgICAgIHggPSBNYXRoLm1pbih4LCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoIC0gKDMwMiArIHJpZ2h0UGFkKSk7XG5cbiAgICAgICAgLy8gT2Zmc2V0IHRoZSBjaGV2cm9uIGxvY2F0aW9uLCB3aGljaCBpcyByZWxhdGl2ZSB0byB0aGUgbGVmdCBvZiB0aGUgY29udGV4dCBtZW51XG4gICAgICAgIC8vICAoMTAgPSBvZmZzZXQgd2hlbiBjb250ZXh0IG1lbnUgd291bGQgbm90IGJlIGRpc3BsYXllZCBvZmYgdmlld3BvcnQpXG4gICAgICAgIC8vICAoMiA9IGNvbnRleHQgbWVudSBib3JkZXJzKVxuICAgICAgICBjb25zdCBzdGlja2VyUGlja2VyQ2hldnJvbk9mZnNldCA9IE1hdGgubWF4KDEwLCAyICsgd2luZG93LnBhZ2VYT2Zmc2V0ICsgYnV0dG9uUmVjdC5sZWZ0IC0geCk7XG5cbiAgICAgICAgY29uc3QgeSA9IChidXR0b25SZWN0LnRvcCArIChidXR0b25SZWN0LmhlaWdodCAvIDIpICsgd2luZG93LnBhZ2VZT2Zmc2V0KSAtIDE5O1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2hvd1N0aWNrZXJzOiB0cnVlLFxuICAgICAgICAgICAgc3RpY2tlclBpY2tlclg6IHgsXG4gICAgICAgICAgICBzdGlja2VyUGlja2VyWTogeSxcbiAgICAgICAgICAgIHN0aWNrZXJQaWNrZXJDaGV2cm9uT2Zmc2V0LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGhpZGluZyBvZiB0aGUgc3RpY2tlciBwaWNrZXIgb3ZlcmxheVxuICAgICAqIEBwYXJhbSAge0V2ZW50fSBldiBFdmVudCB0aGF0IHRyaWdnZXJlZCB0aGUgZnVuY3Rpb24gY2FsbFxuICAgICAqL1xuICAgIF9vbkhpZGVTdGlja2Vyc0NsaWNrKGV2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dTdGlja2VyczogZmFsc2V9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcbiAgICAgKi9cbiAgICBfb25SZXNpemUoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dTdGlja2VyczogZmFsc2V9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc3RpY2tlcnMgcGlja2VyIHdhcyBoaWRkZW5cbiAgICAgKi9cbiAgICBfb25GaW5pc2hlZCgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd1N0aWNrZXJzOiBmYWxzZX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExhdW5jaCB0aGUgaW50ZWdyYXRpb24gbWFuYWdlciBvbiB0aGUgc3RpY2tlcnMgaW50ZWdyYXRpb24gcGFnZVxuICAgICAqL1xuICAgIF9sYXVuY2hNYW5hZ2VJbnRlZ3JhdGlvbnMoKSB7XG4gICAgICAgIC8vIFRPRE86IE9wZW4gdGhlIHJpZ2h0IGludGVncmF0aW9uIG1hbmFnZXIgZm9yIHRoZSB3aWRnZXRcbiAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuaXNGZWF0dXJlRW5hYmxlZChcImZlYXR1cmVfbWFueV9pbnRlZ3JhdGlvbl9tYW5hZ2Vyc1wiKSkge1xuICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLm9wZW5BbGwoXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tLFxuICAgICAgICAgICAgICAgIGB0eXBlXyR7V2lkZ2V0VHlwZS5TVElDS0VSUElDS0VSLnByZWZlcnJlZH1gLFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUud2lkZ2V0SWQsXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLmdldFByaW1hcnlNYW5hZ2VyKCkub3BlbihcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnJvb20sXG4gICAgICAgICAgICAgICAgYHR5cGVfJHtXaWRnZXRUeXBlLlNUSUNLRVJQSUNLRVIucHJlZmVycmVkfWAsXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS53aWRnZXRJZCxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzdGlja2VyUGlja2VyO1xuICAgICAgICBsZXQgc3RpY2tlcnNCdXR0b247XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dTdGlja2Vycykge1xuICAgICAgICAgICAgLy8gU2hvdyBoaWRlLXN0aWNrZXJzIGJ1dHRvblxuICAgICAgICAgICAgc3RpY2tlcnNCdXR0b24gPVxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGlkPSdzdGlja2Vyc0J1dHRvbidcbiAgICAgICAgICAgICAgICAgICAga2V5PVwiY29udHJvbHNfaGlkZV9zdGlja2Vyc1wiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb21wb3Nlcl9idXR0b24gbXhfTWVzc2FnZUNvbXBvc2VyX3N0aWNrZXJzIG14X1N0aWNrZXJzX2hpZGVTdGlja2Vyc1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uSGlkZVN0aWNrZXJzQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkhpZGUgU3RpY2tlcnNcIil9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG5cbiAgICAgICAgICAgIGNvbnN0IEdlbmVyaWNFbGVtZW50Q29udGV4dE1lbnUgPSBzZGsuZ2V0Q29tcG9uZW50KCdjb250ZXh0X21lbnVzLkdlbmVyaWNFbGVtZW50Q29udGV4dE1lbnUnKTtcbiAgICAgICAgICAgIHN0aWNrZXJQaWNrZXIgPSA8Q29udGV4dE1lbnVcbiAgICAgICAgICAgICAgICBjaGV2cm9uT2Zmc2V0PXt0aGlzLnN0YXRlLnN0aWNrZXJQaWNrZXJDaGV2cm9uT2Zmc2V0fVxuICAgICAgICAgICAgICAgIGNoZXZyb25GYWNlPVwiYm90dG9tXCJcbiAgICAgICAgICAgICAgICBsZWZ0PXt0aGlzLnN0YXRlLnN0aWNrZXJQaWNrZXJYfVxuICAgICAgICAgICAgICAgIHRvcD17dGhpcy5zdGF0ZS5zdGlja2VyUGlja2VyWX1cbiAgICAgICAgICAgICAgICBtZW51V2lkdGg9e3RoaXMucG9wb3ZlcldpZHRofVxuICAgICAgICAgICAgICAgIG1lbnVIZWlnaHQ9e3RoaXMucG9wb3ZlckhlaWdodH1cbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLl9vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIG1lbnVQYWRkaW5nVG9wPXswfVxuICAgICAgICAgICAgICAgIG1lbnVQYWRkaW5nTGVmdD17MH1cbiAgICAgICAgICAgICAgICBtZW51UGFkZGluZ1JpZ2h0PXswfVxuICAgICAgICAgICAgICAgIHpJbmRleD17U1RJQ0tFUlBJQ0tFUl9aX0lOREVYfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxHZW5lcmljRWxlbWVudENvbnRleHRNZW51IGVsZW1lbnQ9e3RoaXMuX2dldFN0aWNrZXJwaWNrZXJDb250ZW50KCl9IG9uUmVzaXplPXt0aGlzLl9vbkZpbmlzaGVkfSAvPlxuICAgICAgICAgICAgPC9Db250ZXh0TWVudT47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTaG93IHNob3ctc3RpY2tlcnMgYnV0dG9uXG4gICAgICAgICAgICBzdGlja2Vyc0J1dHRvbiA9XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgaWQ9J3N0aWNrZXJzQnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICBrZXk9XCJjb250cm9sc19zaG93X3N0aWNrZXJzXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX2J1dHRvbiBteF9NZXNzYWdlQ29tcG9zZXJfc3RpY2tlcnNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblNob3dTdGlja2Vyc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJTaG93IFN0aWNrZXJzXCIpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICB7IHN0aWNrZXJzQnV0dG9uIH1cbiAgICAgICAgICAgIHsgc3RpY2tlclBpY2tlciB9XG4gICAgICAgIDwvUmVhY3QuRnJhZ21lbnQ+O1xuICAgIH1cbn1cbiJdfQ==