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

var _url = _interopRequireDefault(require("url"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _WidgetUtils = _interopRequireDefault(require("../../../utils/WidgetUtils"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class AppPermission extends _react.default.Component {
  constructor(props) {
    super(props); // The first step is to pick apart the widget so we can render information about it

    const urlInfo = this.parseWidgetUrl(); // The second step is to find the user's profile so we can show it on the prompt

    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.roomId);

    let roomMember;
    if (room) roomMember = room.getMember(this.props.creatorUserId); // Set all this into the initial state

    this.state = _objectSpread({}, urlInfo, {
      roomMember
    });
  }

  parseWidgetUrl() {
    const widgetUrl = _url.default.parse(this.props.url);

    const params = new URLSearchParams(widgetUrl.search); // HACK: We're relying on the query params when we should be relying on the widget's `data`.
    // This is a workaround for Scalar.

    if (_WidgetUtils.default.isScalarUrl(widgetUrl) && params && params.get('url')) {
      const unwrappedUrl = _url.default.parse(params.get('url'));

      return {
        widgetDomain: unwrappedUrl.host || unwrappedUrl.hostname,
        isWrapped: true
      };
    } else {
      return {
        widgetDomain: widgetUrl.host || widgetUrl.hostname,
        isWrapped: false
      };
    }
  }

  render() {
    const AccessibleButton = sdk.getComponent("views.elements.AccessibleButton");
    const MemberAvatar = sdk.getComponent("views.avatars.MemberAvatar");
    const BaseAvatar = sdk.getComponent("views.avatars.BaseAvatar");
    const TextWithTooltip = sdk.getComponent("views.elements.TextWithTooltip");
    const displayName = this.state.roomMember ? this.state.roomMember.name : this.props.creatorUserId;
    const userId = displayName === this.props.creatorUserId ? null : this.props.creatorUserId;
    const avatar = this.state.roomMember ? /*#__PURE__*/_react.default.createElement(MemberAvatar, {
      member: this.state.roomMember,
      width: 38,
      height: 38
    }) : /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      name: this.props.creatorUserId,
      width: 38,
      height: 38
    });

    const warningTooltipText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Any of the following data may be shared:"), /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Your display name")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Your avatar URL")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Your user ID")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Your theme")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Riot URL")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Room ID")), /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)("Widget ID"))));

    const warningTooltip = /*#__PURE__*/_react.default.createElement(TextWithTooltip, {
      tooltip: warningTooltipText,
      tooltipClass: "mx_AppPermissionWarning_tooltip mx_Tooltip_dark"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_AppPermissionWarning_helpIcon"
    })); // Due to i18n limitations, we can't dedupe the code for variables in these two messages.


    const warning = this.state.isWrapped ? (0, _languageHandler._t)("Using this widget may share data <helpIcon /> with %(widgetDomain)s & your Integration Manager.", {
      widgetDomain: this.state.widgetDomain
    }, {
      helpIcon: () => warningTooltip
    }) : (0, _languageHandler._t)("Using this widget may share data <helpIcon /> with %(widgetDomain)s.", {
      widgetDomain: this.state.widgetDomain
    }, {
      helpIcon: () => warningTooltip
    });
    const encryptionWarning = this.props.isRoomEncrypted ? (0, _languageHandler._t)("Widgets do not use message encryption.") : null;
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_row mx_AppPermissionWarning_bolder mx_AppPermissionWarning_smallText"
    }, (0, _languageHandler._t)("Widget added by")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_row"
    }, avatar, /*#__PURE__*/_react.default.createElement("h4", {
      className: "mx_AppPermissionWarning_bolder"
    }, displayName), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_smallText"
    }, userId)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_row mx_AppPermissionWarning_smallText"
    }, warning), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_row mx_AppPermissionWarning_smallText"
    }, (0, _languageHandler._t)("This widget may use cookies."), "\xA0", encryptionWarning), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AppPermissionWarning_row"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary_sm",
      onClick: this.props.onPermissionGranted
    }, (0, _languageHandler._t)("Continue"))));
  }

}

exports.default = AppPermission;
(0, _defineProperty2.default)(AppPermission, "propTypes", {
  url: _propTypes.default.string.isRequired,
  creatorUserId: _propTypes.default.string.isRequired,
  roomId: _propTypes.default.string.isRequired,
  onPermissionGranted: _propTypes.default.func.isRequired,
  isRoomEncrypted: _propTypes.default.bool
});
(0, _defineProperty2.default)(AppPermission, "defaultProps", {
  onPermissionGranted: () => {}
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0FwcFBlcm1pc3Npb24uanMiXSwibmFtZXMiOlsiQXBwUGVybWlzc2lvbiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInVybEluZm8iLCJwYXJzZVdpZGdldFVybCIsInJvb20iLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRSb29tIiwicm9vbUlkIiwicm9vbU1lbWJlciIsImdldE1lbWJlciIsImNyZWF0b3JVc2VySWQiLCJzdGF0ZSIsIndpZGdldFVybCIsInVybCIsInBhcnNlIiwicGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwic2VhcmNoIiwiV2lkZ2V0VXRpbHMiLCJpc1NjYWxhclVybCIsInVud3JhcHBlZFVybCIsIndpZGdldERvbWFpbiIsImhvc3QiLCJob3N0bmFtZSIsImlzV3JhcHBlZCIsInJlbmRlciIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNZW1iZXJBdmF0YXIiLCJCYXNlQXZhdGFyIiwiVGV4dFdpdGhUb29sdGlwIiwiZGlzcGxheU5hbWUiLCJuYW1lIiwidXNlcklkIiwiYXZhdGFyIiwid2FybmluZ1Rvb2x0aXBUZXh0Iiwid2FybmluZ1Rvb2x0aXAiLCJ3YXJuaW5nIiwiaGVscEljb24iLCJlbmNyeXB0aW9uV2FybmluZyIsImlzUm9vbUVuY3J5cHRlZCIsIm9uUGVybWlzc2lvbkdyYW50ZWQiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIiwiZnVuYyIsImJvb2wiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVlLE1BQU1BLGFBQU4sU0FBNEJDLGVBQU1DLFNBQWxDLENBQTRDO0FBYXZEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU4sRUFEZSxD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QUFmLE9BQ0tJLE9BREwsQ0FUSixlQVlJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLLHlCQUFHLDhCQUFILENBREwsVUFDK0NFLGlCQUQvQyxDQVpKLGVBZUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsSUFBSSxFQUFDLFlBQXZCO0FBQW9DLE1BQUEsT0FBTyxFQUFFLEtBQUt4QyxLQUFMLENBQVcwQztBQUF4RCxPQUNLLHlCQUFHLFVBQUgsQ0FETCxDQURKLENBZkosQ0FESjtBQXVCSDs7QUFwSHNEOzs7OEJBQXRDOUMsYSxlQUNFO0FBQ2ZpQixFQUFBQSxHQUFHLEVBQUU4QixtQkFBVUMsTUFBVixDQUFpQkMsVUFEUDtBQUVmbkMsRUFBQUEsYUFBYSxFQUFFaUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRmpCO0FBR2Z0QyxFQUFBQSxNQUFNLEVBQUVvQyxtQkFBVUMsTUFBVixDQUFpQkMsVUFIVjtBQUlmSCxFQUFBQSxtQkFBbUIsRUFBRUMsbUJBQVVHLElBQVYsQ0FBZUQsVUFKckI7QUFLZkosRUFBQUEsZUFBZSxFQUFFRSxtQkFBVUk7QUFMWixDOzhCQURGbkQsYSxrQkFTSztBQUNsQjhDLEVBQUFBLG1CQUFtQixFQUFFLE1BQU0sQ0FBRTtBQURYLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBXaWRnZXRVdGlscyBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvV2lkZ2V0VXRpbHNcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcFBlcm1pc3Npb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHVybDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBjcmVhdG9yVXNlcklkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBvblBlcm1pc3Npb25HcmFudGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBpc1Jvb21FbmNyeXB0ZWQ6IFByb3BUeXBlcy5ib29sLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBvblBlcm1pc3Npb25HcmFudGVkOiAoKSA9PiB7fSxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIC8vIFRoZSBmaXJzdCBzdGVwIGlzIHRvIHBpY2sgYXBhcnQgdGhlIHdpZGdldCBzbyB3ZSBjYW4gcmVuZGVyIGluZm9ybWF0aW9uIGFib3V0IGl0XG4gICAgICAgIGNvbnN0IHVybEluZm8gPSB0aGlzLnBhcnNlV2lkZ2V0VXJsKCk7XG5cbiAgICAgICAgLy8gVGhlIHNlY29uZCBzdGVwIGlzIHRvIGZpbmQgdGhlIHVzZXIncyBwcm9maWxlIHNvIHdlIGNhbiBzaG93IGl0IG9uIHRoZSBwcm9tcHRcbiAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgbGV0IHJvb21NZW1iZXI7XG4gICAgICAgIGlmIChyb29tKSByb29tTWVtYmVyID0gcm9vbS5nZXRNZW1iZXIodGhpcy5wcm9wcy5jcmVhdG9yVXNlcklkKTtcblxuICAgICAgICAvLyBTZXQgYWxsIHRoaXMgaW50byB0aGUgaW5pdGlhbCBzdGF0ZVxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgLi4udXJsSW5mbyxcbiAgICAgICAgICAgIHJvb21NZW1iZXIsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcGFyc2VXaWRnZXRVcmwoKSB7XG4gICAgICAgIGNvbnN0IHdpZGdldFVybCA9IHVybC5wYXJzZSh0aGlzLnByb3BzLnVybCk7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2lkZ2V0VXJsLnNlYXJjaCk7XG5cbiAgICAgICAgLy8gSEFDSzogV2UncmUgcmVseWluZyBvbiB0aGUgcXVlcnkgcGFyYW1zIHdoZW4gd2Ugc2hvdWxkIGJlIHJlbHlpbmcgb24gdGhlIHdpZGdldCdzIGBkYXRhYC5cbiAgICAgICAgLy8gVGhpcyBpcyBhIHdvcmthcm91bmQgZm9yIFNjYWxhci5cbiAgICAgICAgaWYgKFdpZGdldFV0aWxzLmlzU2NhbGFyVXJsKHdpZGdldFVybCkgJiYgcGFyYW1zICYmIHBhcmFtcy5nZXQoJ3VybCcpKSB7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWRVcmwgPSB1cmwucGFyc2UocGFyYW1zLmdldCgndXJsJykpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWRnZXREb21haW46IHVud3JhcHBlZFVybC5ob3N0IHx8IHVud3JhcHBlZFVybC5ob3N0bmFtZSxcbiAgICAgICAgICAgICAgICBpc1dyYXBwZWQ6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWRnZXREb21haW46IHdpZGdldFVybC5ob3N0IHx8IHdpZGdldFVybC5ob3N0bmFtZSxcbiAgICAgICAgICAgICAgICBpc1dyYXBwZWQ6IGZhbHNlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5lbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uXCIpO1xuICAgICAgICBjb25zdCBNZW1iZXJBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuYXZhdGFycy5NZW1iZXJBdmF0YXJcIik7XG4gICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuYXZhdGFycy5CYXNlQXZhdGFyXCIpO1xuICAgICAgICBjb25zdCBUZXh0V2l0aFRvb2x0aXAgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuVGV4dFdpdGhUb29sdGlwXCIpO1xuXG4gICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gdGhpcy5zdGF0ZS5yb29tTWVtYmVyID8gdGhpcy5zdGF0ZS5yb29tTWVtYmVyLm5hbWUgOiB0aGlzLnByb3BzLmNyZWF0b3JVc2VySWQ7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IGRpc3BsYXlOYW1lID09PSB0aGlzLnByb3BzLmNyZWF0b3JVc2VySWQgPyBudWxsIDogdGhpcy5wcm9wcy5jcmVhdG9yVXNlcklkO1xuXG4gICAgICAgIGNvbnN0IGF2YXRhciA9IHRoaXMuc3RhdGUucm9vbU1lbWJlclxuICAgICAgICAgICAgPyA8TWVtYmVyQXZhdGFyIG1lbWJlcj17dGhpcy5zdGF0ZS5yb29tTWVtYmVyfSB3aWR0aD17Mzh9IGhlaWdodD17Mzh9IC8+XG4gICAgICAgICAgICA6IDxCYXNlQXZhdGFyIG5hbWU9e3RoaXMucHJvcHMuY3JlYXRvclVzZXJJZH0gd2lkdGg9ezM4fSBoZWlnaHQ9ezM4fSAvPjtcblxuICAgICAgICBjb25zdCB3YXJuaW5nVG9vbHRpcFRleHQgPSAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtfdChcIkFueSBvZiB0aGUgZm9sbG93aW5nIGRhdGEgbWF5IGJlIHNoYXJlZDpcIil9XG4gICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+e190KFwiWW91ciBkaXNwbGF5IG5hbWVcIil9PC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPntfdChcIllvdXIgYXZhdGFyIFVSTFwiKX08L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+e190KFwiWW91ciB1c2VyIElEXCIpfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT57X3QoXCJZb3VyIHRoZW1lXCIpfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT57X3QoXCJSaW90IFVSTFwiKX08L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+e190KFwiUm9vbSBJRFwiKX08L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+e190KFwiV2lkZ2V0IElEXCIpfTwvbGk+XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgICBjb25zdCB3YXJuaW5nVG9vbHRpcCA9IChcbiAgICAgICAgICAgIDxUZXh0V2l0aFRvb2x0aXAgdG9vbHRpcD17d2FybmluZ1Rvb2x0aXBUZXh0fSB0b29sdGlwQ2xhc3M9J214X0FwcFBlcm1pc3Npb25XYXJuaW5nX3Rvb2x0aXAgbXhfVG9vbHRpcF9kYXJrJz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X0FwcFBlcm1pc3Npb25XYXJuaW5nX2hlbHBJY29uJyAvPlxuICAgICAgICAgICAgPC9UZXh0V2l0aFRvb2x0aXA+XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gRHVlIHRvIGkxOG4gbGltaXRhdGlvbnMsIHdlIGNhbid0IGRlZHVwZSB0aGUgY29kZSBmb3IgdmFyaWFibGVzIGluIHRoZXNlIHR3byBtZXNzYWdlcy5cbiAgICAgICAgY29uc3Qgd2FybmluZyA9IHRoaXMuc3RhdGUuaXNXcmFwcGVkXG4gICAgICAgICAgICA/IF90KFwiVXNpbmcgdGhpcyB3aWRnZXQgbWF5IHNoYXJlIGRhdGEgPGhlbHBJY29uIC8+IHdpdGggJSh3aWRnZXREb21haW4pcyAmIHlvdXIgSW50ZWdyYXRpb24gTWFuYWdlci5cIixcbiAgICAgICAgICAgICAgICB7d2lkZ2V0RG9tYWluOiB0aGlzLnN0YXRlLndpZGdldERvbWFpbn0sIHtoZWxwSWNvbjogKCkgPT4gd2FybmluZ1Rvb2x0aXB9KVxuICAgICAgICAgICAgOiBfdChcIlVzaW5nIHRoaXMgd2lkZ2V0IG1heSBzaGFyZSBkYXRhIDxoZWxwSWNvbiAvPiB3aXRoICUod2lkZ2V0RG9tYWluKXMuXCIsXG4gICAgICAgICAgICAgICAge3dpZGdldERvbWFpbjogdGhpcy5zdGF0ZS53aWRnZXREb21haW59LCB7aGVscEljb246ICgpID0+IHdhcm5pbmdUb29sdGlwfSk7XG5cbiAgICAgICAgY29uc3QgZW5jcnlwdGlvbldhcm5pbmcgPSB0aGlzLnByb3BzLmlzUm9vbUVuY3J5cHRlZCA/IF90KFwiV2lkZ2V0cyBkbyBub3QgdXNlIG1lc3NhZ2UgZW5jcnlwdGlvbi5cIikgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfQXBwUGVybWlzc2lvbldhcm5pbmcnPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9BcHBQZXJtaXNzaW9uV2FybmluZ19yb3cgbXhfQXBwUGVybWlzc2lvbldhcm5pbmdfYm9sZGVyIG14X0FwcFBlcm1pc3Npb25XYXJuaW5nX3NtYWxsVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIldpZGdldCBhZGRlZCBieVwiKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfQXBwUGVybWlzc2lvbldhcm5pbmdfcm93Jz5cbiAgICAgICAgICAgICAgICAgICAge2F2YXRhcn1cbiAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT0nbXhfQXBwUGVybWlzc2lvbldhcm5pbmdfYm9sZGVyJz57ZGlzcGxheU5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0FwcFBlcm1pc3Npb25XYXJuaW5nX3NtYWxsVGV4dCc+e3VzZXJJZH08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfQXBwUGVybWlzc2lvbldhcm5pbmdfcm93IG14X0FwcFBlcm1pc3Npb25XYXJuaW5nX3NtYWxsVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHt3YXJuaW5nfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9BcHBQZXJtaXNzaW9uV2FybmluZ19yb3cgbXhfQXBwUGVybWlzc2lvbldhcm5pbmdfc21hbGxUZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAge190KFwiVGhpcyB3aWRnZXQgbWF5IHVzZSBjb29raWVzLlwiKX0mbmJzcDt7ZW5jcnlwdGlvbldhcm5pbmd9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0FwcFBlcm1pc3Npb25XYXJuaW5nX3Jvdyc+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGtpbmQ9J3ByaW1hcnlfc20nIG9uQ2xpY2s9e3RoaXMucHJvcHMub25QZXJtaXNzaW9uR3JhbnRlZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJDb250aW51ZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19