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

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var _LogoutDialog = _interopRequireDefault(require("../dialogs/LogoutDialog"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _HostingLink = require("../../../utils/HostingLink");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _ContextMenu = require("../../structures/ContextMenu");

var sdk = _interopRequireWildcard(require("../../../index"));

var _pages = require("../../../utils/pages");

var _actions = require("../../../dispatcher/actions");

/*
Copyright 2018, 2019 New Vector Ltd
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
class TopLeftMenu extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "openHelp", () => {
      this.closeMenu();
      const RedesignFeedbackDialog = sdk.getComponent("views.dialogs.RedesignFeedbackDialog");

      _Modal.default.createTrackedDialog('Report bugs & give feedback', '', RedesignFeedbackDialog);
    });
    this.viewHomePage = this.viewHomePage.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
  }

  hasHomePage() {
    return !!(0, _pages.getHomePageUrl)(_SdkConfig.default.get());
  }

  render() {
    const isGuest = _MatrixClientPeg.MatrixClientPeg.get().isGuest();

    const hostingSignupLink = (0, _HostingLink.getHostingLink)('user-context-menu');
    let hostingSignup = null;

    if (hostingSignupLink) {
      hostingSignup = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_TopLeftMenu_upgradeLink"
      }, (0, _languageHandler._t)("<a>Upgrade</a> to your own domain", {}, {
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: hostingSignupLink,
          target: "_blank",
          rel: "noreferrer noopener",
          tabIndex: -1
        }, sub)
      }), /*#__PURE__*/_react.default.createElement("a", {
        href: hostingSignupLink,
        target: "_blank",
        rel: "noreferrer noopener",
        role: "presentation",
        "aria-hidden": true,
        tabIndex: -1
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/external-link.svg"),
        width: "11",
        height: "10",
        alt: ""
      })));
    }

    let homePageItem = null;

    if (this.hasHomePage()) {
      homePageItem = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_TopLeftMenu_icon_home",
        onClick: this.viewHomePage
      }, (0, _languageHandler._t)("Home"));
    }

    let signInOutItem;

    if (isGuest) {
      signInOutItem = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_TopLeftMenu_icon_signin",
        onClick: this.signIn
      }, (0, _languageHandler._t)("Sign in"));
    } else {
      signInOutItem = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_TopLeftMenu_icon_signout",
        onClick: this.signOut
      }, (0, _languageHandler._t)("Sign out"));
    }

    const helpItem = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_TopLeftMenu_icon_help",
      onClick: this.openHelp
    }, (0, _languageHandler._t)("Help"));

    const settingsItem = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_TopLeftMenu_icon_settings",
      onClick: this.openSettings
    }, (0, _languageHandler._t)("Settings"));

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TopLeftMenu",
      ref: this.props.containerRef,
      role: "menu"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TopLeftMenu_section_noIcon",
      "aria-readonly": true,
      tabIndex: -1
    }, /*#__PURE__*/_react.default.createElement("div", null, this.props.displayName), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TopLeftMenu_greyedText",
      "aria-hidden": true
    }, this.props.userId), hostingSignup), /*#__PURE__*/_react.default.createElement("ul", {
      className: "mx_TopLeftMenu_section_withIcon",
      role: "none"
    }, homePageItem, settingsItem, helpItem, signInOutItem));
  }

  viewHomePage() {
    _dispatcher.default.dispatch({
      action: 'view_home_page'
    });

    this.closeMenu();
  }

  openSettings() {
    _dispatcher.default.fire(_actions.Action.ViewUserSettings);

    this.closeMenu();
  }

  signIn() {
    _dispatcher.default.dispatch({
      action: 'start_login'
    });

    this.closeMenu();
  }

  signOut() {
    _Modal.default.createTrackedDialog('Logout E2E Export', '', _LogoutDialog.default);

    this.closeMenu();
  }

  closeMenu() {
    if (this.props.onFinished) this.props.onFinished();
  }

}

exports.default = TopLeftMenu;
(0, _defineProperty2.default)(TopLeftMenu, "propTypes", {
  displayName: _propTypes.default.string.isRequired,
  userId: _propTypes.default.string.isRequired,
  onFinished: _propTypes.default.func,
  // Optional function to collect a reference to the container
  // of this component directly.
  containerRef: _propTypes.default.func
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvVG9wTGVmdE1lbnUuanMiXSwibmFtZXMiOlsiVG9wTGVmdE1lbnUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiY2xvc2VNZW51IiwiUmVkZXNpZ25GZWVkYmFja0RpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInZpZXdIb21lUGFnZSIsImJpbmQiLCJvcGVuU2V0dGluZ3MiLCJzaWduSW4iLCJzaWduT3V0IiwiaGFzSG9tZVBhZ2UiLCJTZGtDb25maWciLCJnZXQiLCJyZW5kZXIiLCJpc0d1ZXN0IiwiTWF0cml4Q2xpZW50UGVnIiwiaG9zdGluZ1NpZ251cExpbmsiLCJob3N0aW5nU2lnbnVwIiwiYSIsInN1YiIsInJlcXVpcmUiLCJob21lUGFnZUl0ZW0iLCJzaWduSW5PdXRJdGVtIiwiaGVscEl0ZW0iLCJvcGVuSGVscCIsInNldHRpbmdzSXRlbSIsInByb3BzIiwiY29udGFpbmVyUmVmIiwiZGlzcGxheU5hbWUiLCJ1c2VySWQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImZpcmUiLCJBY3Rpb24iLCJWaWV3VXNlclNldHRpbmdzIiwiTG9nb3V0RGlhbG9nIiwib25GaW5pc2hlZCIsIlByb3BUeXBlcyIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTdCQTs7Ozs7Ozs7Ozs7Ozs7OztBQStCZSxNQUFNQSxXQUFOLFNBQTBCQyxlQUFNQyxTQUFoQyxDQUEwQztBQVdyREMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSxvREFtRkgsTUFBTTtBQUNiLFdBQUtDLFNBQUw7QUFDQSxZQUFNQyxz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bUJBQU4sQ0FBMEIsbUJBQTFCLEVBQStDLEVBQS9DLEVBQW1EZ0MscUJBQW5EOztBQUNBLFNBQUtyQyxTQUFMO0FBQ0g7O0FBRURBLEVBQUFBLFNBQVMsR0FBRztBQUNSLFFBQUksS0FBSzJCLEtBQUwsQ0FBV1csVUFBZixFQUEyQixLQUFLWCxLQUFMLENBQVdXLFVBQVg7QUFDOUI7O0FBMUhvRDs7OzhCQUFwQzFDLFcsZUFDRTtBQUNmaUMsRUFBQUEsV0FBVyxFQUFFVSxtQkFBVUMsTUFBVixDQUFpQkMsVUFEZjtBQUVmWCxFQUFBQSxNQUFNLEVBQUVTLG1CQUFVQyxNQUFWLENBQWlCQyxVQUZWO0FBR2ZILEVBQUFBLFVBQVUsRUFBRUMsbUJBQVVHLElBSFA7QUFLZjtBQUNBO0FBQ0FkLEVBQUFBLFlBQVksRUFBRVcsbUJBQVVHO0FBUFQsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBMb2dvdXREaWFsb2cgZnJvbSBcIi4uL2RpYWxvZ3MvTG9nb3V0RGlhbG9nXCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uLy4uL01vZGFsXCI7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gJy4uLy4uLy4uL1Nka0NvbmZpZyc7XG5pbXBvcnQgeyBnZXRIb3N0aW5nTGluayB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0hvc3RpbmdMaW5rJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHtNZW51SXRlbX0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvQ29udGV4dE1lbnVcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7Z2V0SG9tZVBhZ2VVcmx9IGZyb20gXCIuLi8uLi8uLi91dGlscy9wYWdlc1wiO1xuaW1wb3J0IHtBY3Rpb259IGZyb20gXCIuLi8uLi8uLi9kaXNwYXRjaGVyL2FjdGlvbnNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9wTGVmdE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGRpc3BsYXlOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvLyBPcHRpb25hbCBmdW5jdGlvbiB0byBjb2xsZWN0IGEgcmVmZXJlbmNlIHRvIHRoZSBjb250YWluZXJcbiAgICAgICAgLy8gb2YgdGhpcyBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICAgIGNvbnRhaW5lclJlZjogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnZpZXdIb21lUGFnZSA9IHRoaXMudmlld0hvbWVQYWdlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3BlblNldHRpbmdzID0gdGhpcy5vcGVuU2V0dGluZ3MuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zaWduSW4gPSB0aGlzLnNpZ25Jbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnNpZ25PdXQgPSB0aGlzLnNpZ25PdXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBoYXNIb21lUGFnZSgpIHtcbiAgICAgICAgcmV0dXJuICEhZ2V0SG9tZVBhZ2VVcmwoU2RrQ29uZmlnLmdldCgpKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGlzR3Vlc3QgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNHdWVzdCgpO1xuXG4gICAgICAgIGNvbnN0IGhvc3RpbmdTaWdudXBMaW5rID0gZ2V0SG9zdGluZ0xpbmsoJ3VzZXItY29udGV4dC1tZW51Jyk7XG4gICAgICAgIGxldCBob3N0aW5nU2lnbnVwID0gbnVsbDtcbiAgICAgICAgaWYgKGhvc3RpbmdTaWdudXBMaW5rKSB7XG4gICAgICAgICAgICBob3N0aW5nU2lnbnVwID0gPGRpdiBjbGFzc05hbWU9XCJteF9Ub3BMZWZ0TWVudV91cGdyYWRlTGlua1wiPlxuICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCI8YT5VcGdyYWRlPC9hPiB0byB5b3VyIG93biBkb21haW5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGE6IHN1YiA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e2hvc3RpbmdTaWdudXBMaW5rfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCIgdGFiSW5kZXg9ey0xfT57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8YSBocmVmPXtob3N0aW5nU2lnbnVwTGlua30gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHJvbGU9XCJwcmVzZW50YXRpb25cIiBhcmlhLWhpZGRlbj17dHJ1ZX0gdGFiSW5kZXg9ey0xfT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2V4dGVybmFsLWxpbmsuc3ZnXCIpfSB3aWR0aD1cIjExXCIgaGVpZ2h0PVwiMTBcIiBhbHQ9JycgLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaG9tZVBhZ2VJdGVtID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuaGFzSG9tZVBhZ2UoKSkge1xuICAgICAgICAgICAgaG9tZVBhZ2VJdGVtID0gKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9Ub3BMZWZ0TWVudV9pY29uX2hvbWVcIiBvbkNsaWNrPXt0aGlzLnZpZXdIb21lUGFnZX0+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkhvbWVcIil9XG4gICAgICAgICAgICAgICAgPC9NZW51SXRlbT5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2lnbkluT3V0SXRlbTtcbiAgICAgICAgaWYgKGlzR3Vlc3QpIHtcbiAgICAgICAgICAgIHNpZ25Jbk91dEl0ZW0gPSAoXG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X1RvcExlZnRNZW51X2ljb25fc2lnbmluXCIgb25DbGljaz17dGhpcy5zaWduSW59PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJTaWduIGluXCIpfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lnbkluT3V0SXRlbSA9IChcbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfVG9wTGVmdE1lbnVfaWNvbl9zaWdub3V0XCIgb25DbGljaz17dGhpcy5zaWduT3V0fT5cbiAgICAgICAgICAgICAgICAgICAge190KFwiU2lnbiBvdXRcIil9XG4gICAgICAgICAgICAgICAgPC9NZW51SXRlbT5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoZWxwSXRlbSA9IChcbiAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9Ub3BMZWZ0TWVudV9pY29uX2hlbHBcIiBvbkNsaWNrPXt0aGlzLm9wZW5IZWxwfT5cbiAgICAgICAgICAgICAgICB7X3QoXCJIZWxwXCIpfVxuICAgICAgICAgICAgPC9NZW51SXRlbT5cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBzZXR0aW5nc0l0ZW0gPSAoXG4gICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfVG9wTGVmdE1lbnVfaWNvbl9zZXR0aW5nc1wiIG9uQ2xpY2s9e3RoaXMub3BlblNldHRpbmdzfT5cbiAgICAgICAgICAgICAgICB7X3QoXCJTZXR0aW5nc1wiKX1cbiAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfVG9wTGVmdE1lbnVcIiByZWY9e3RoaXMucHJvcHMuY29udGFpbmVyUmVmfSByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub3BMZWZ0TWVudV9zZWN0aW9uX25vSWNvblwiIGFyaWEtcmVhZG9ubHk9e3RydWV9IHRhYkluZGV4PXstMX0+XG4gICAgICAgICAgICAgICAgPGRpdj57dGhpcy5wcm9wcy5kaXNwbGF5TmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1RvcExlZnRNZW51X2dyZXllZFRleHRcIiBhcmlhLWhpZGRlbj17dHJ1ZX0+e3RoaXMucHJvcHMudXNlcklkfTwvZGl2PlxuICAgICAgICAgICAgICAgIHtob3N0aW5nU2lnbnVwfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibXhfVG9wTGVmdE1lbnVfc2VjdGlvbl93aXRoSWNvblwiIHJvbGU9XCJub25lXCI+XG4gICAgICAgICAgICAgICAge2hvbWVQYWdlSXRlbX1cbiAgICAgICAgICAgICAgICB7c2V0dGluZ3NJdGVtfVxuICAgICAgICAgICAgICAgIHtoZWxwSXRlbX1cbiAgICAgICAgICAgICAgICB7c2lnbkluT3V0SXRlbX1cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICBvcGVuSGVscCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgY29uc3QgUmVkZXNpZ25GZWVkYmFja0RpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5kaWFsb2dzLlJlZGVzaWduRmVlZGJhY2tEaWFsb2dcIik7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlcG9ydCBidWdzICYgZ2l2ZSBmZWVkYmFjaycsICcnLCBSZWRlc2lnbkZlZWRiYWNrRGlhbG9nKTtcbiAgICB9O1xuXG4gICAgdmlld0hvbWVQYWdlKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfaG9tZV9wYWdlJ30pO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIG9wZW5TZXR0aW5ncygpIHtcbiAgICAgICAgZGlzLmZpcmUoQWN0aW9uLlZpZXdVc2VyU2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIHNpZ25JbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzdGFydF9sb2dpbid9KTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBzaWduT3V0KCkge1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdMb2dvdXQgRTJFIEV4cG9ydCcsICcnLCBMb2dvdXREaWFsb2cpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNsb3NlTWVudSgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25GaW5pc2hlZCkgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgfVxufVxuIl19