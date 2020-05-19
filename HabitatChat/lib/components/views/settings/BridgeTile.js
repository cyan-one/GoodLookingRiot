"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _contentRepo = require("matrix-js-sdk/src/content-repo");

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Pill = _interopRequireDefault(require("../elements/Pill"));

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var _BaseAvatar = _interopRequireDefault(require("../avatars/BaseAvatar"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _replaceableComponent = require("../../../utils/replaceableComponent");

var _dec, _class, _class2, _temp;

let BridgeTile = (_dec = (0, _replaceableComponent.replaceableComponent)("views.settings.BridgeTile"), _dec(_class = (_temp = _class2 = class BridgeTile extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "state", {
      visible: false
    });
  }

  _toggleVisible() {
    this.setState({
      visible: !this.state.visible
    });
  }

  render() {
    const content = this.props.ev.getContent();
    const {
      channel,
      network,
      protocol
    } = content;
    const protocolName = protocol.displayname || protocol.id;
    const channelName = channel.displayname || channel.id;
    const networkName = network ? network.displayname || network.id : protocolName;
    let creator = null;

    if (content.creator) {
      creator = (0, _languageHandler._t)("This bridge was provisioned by <user />.", {}, {
        user: /*#__PURE__*/_react.default.createElement(_Pill.default, {
          type: _Pill.default.TYPE_USER_MENTION,
          room: this.props.room,
          url: (0, _Permalinks.makeUserPermalink)(content.creator),
          shouldShowPillAvatar: true
        })
      });
    }

    const bot = (0, _languageHandler._t)("This bridge is managed by <user />.", {}, {
      user: /*#__PURE__*/_react.default.createElement(_Pill.default, {
        type: _Pill.default.TYPE_USER_MENTION,
        room: this.props.room,
        url: (0, _Permalinks.makeUserPermalink)(this.props.ev.getSender()),
        shouldShowPillAvatar: true
      })
    });
    let networkIcon;

    if (protocol.avatar) {
      const avatarUrl = (0, _contentRepo.getHttpUriForMxc)(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), protocol.avatar, 64, 64, "crop");
      networkIcon = /*#__PURE__*/_react.default.createElement(_BaseAvatar.default, {
        className: "protocol-icon",
        width: 48,
        height: 48,
        resizeMethod: "crop",
        name: protocolName,
        idName: protocolName,
        url: avatarUrl
      });
    } else {
      networkIcon = /*#__PURE__*/_react.default.createElement("div", {
        class: "noProtocolIcon"
      });
    }

    const id = this.props.ev.getId();
    const metadataClassname = "metadata" + (this.state.visible ? " visible" : "");
    return /*#__PURE__*/_react.default.createElement("li", {
      key: id
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "column-icon"
    }, networkIcon), /*#__PURE__*/_react.default.createElement("div", {
      className: "column-data"
    }, /*#__PURE__*/_react.default.createElement("h3", null, protocolName), /*#__PURE__*/_react.default.createElement("p", {
      className: "workspace-channel-details"
    }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Workspace: %(networkName)s", {
      networkName
    })), /*#__PURE__*/_react.default.createElement("span", {
      className: "channel"
    }, (0, _languageHandler._t)("Channel: %(channelName)s", {
      channelName
    }))), /*#__PURE__*/_react.default.createElement("p", {
      className: metadataClassname
    }, creator, " ", bot), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_showMore",
      kind: "secondary",
      onClick: this._toggleVisible.bind(this)
    }, this.state.visible ? (0, _languageHandler._t)("Show less") : (0, _languageHandler._t)("Show more"))));
  }

}, (0, _defineProperty2.default)(_class2, "propTypes", {
  ev: _propTypes.default.object.isRequired,
  room: _propTypes.default.object.isRequired
}), _temp)) || _class);
exports.default = BridgeTile;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0JyaWRnZVRpbGUuanMiXSwibmFtZXMiOlsiQnJpZGdlVGlsZSIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsInZpc2libGUiLCJfdG9nZ2xlVmlzaWJsZSIsInNldFN0YXRlIiwic3RhdGUiLCJyZW5kZXIiLCJjb250ZW50IiwicHJvcHMiLCJldiIsImdldENvbnRlbnQiLCJjaGFubmVsIiwibmV0d29yayIsInByb3RvY29sIiwicHJvdG9jb2xOYW1lIiwiZGlzcGxheW5hbWUiLCJpZCIsImNoYW5uZWxOYW1lIiwibmV0d29ya05hbWUiLCJjcmVhdG9yIiwidXNlciIsIlBpbGwiLCJUWVBFX1VTRVJfTUVOVElPTiIsInJvb20iLCJib3QiLCJnZXRTZW5kZXIiLCJuZXR3b3JrSWNvbiIsImF2YXRhciIsImF2YXRhclVybCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldEhvbWVzZXJ2ZXJVcmwiLCJnZXRJZCIsIm1ldGFkYXRhQ2xhc3NuYW1lIiwiYmluZCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0lBR3FCQSxVLFdBRHBCLGdEQUFxQiwyQkFBckIsQyxtQ0FBRCxNQUNxQkEsVUFEckIsU0FDd0NDLGVBQU1DLGFBRDlDLENBQzREO0FBQUE7QUFBQTtBQUFBLGlEQU1oRDtBQUNKQyxNQUFBQSxPQUFPLEVBQUU7QUFETCxLQU5nRDtBQUFBOztBQVV4REMsRUFBQUEsY0FBYyxHQUFHO0FBQ2IsU0FBS0MsUUFBTCxDQUFjO0FBQ1ZGLE1BQUFBLE9BQU8sRUFBRSxDQUFDLEtBQUtHLEtBQUwsQ0FBV0g7QUFEWCxLQUFkO0FBR0g7O0FBRURJLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE9BQU8sR0FBRyxL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QUcsMEJBQUgsRUFBK0I7QUFBQ0QsTUFBQUE7QUFBRCxLQUEvQixDQUEzQixDQUZKLENBRkosZUFNSTtBQUFHLE1BQUEsU0FBUyxFQUFFZ0I7QUFBZCxPQUNLZCxPQURMLE9BQ2VLLEdBRGYsQ0FOSixlQVNJLDZCQUFDLHlCQUFEO0FBQWtCLE1BQUEsU0FBUyxFQUFDLGFBQTVCO0FBQTBDLE1BQUEsSUFBSSxFQUFDLFdBQS9DO0FBQTJELE1BQUEsT0FBTyxFQUFFLEtBQUtyQixjQUFMLENBQW9CK0IsSUFBcEIsQ0FBeUIsSUFBekI7QUFBcEUsT0FDTSxLQUFLN0IsS0FBTCxDQUFXSCxPQUFYLEdBQXFCLHlCQUFHLFdBQUgsQ0FBckIsR0FBdUMseUJBQUcsV0FBSCxDQUQ3QyxDQVRKLENBSkksQ0FBUjtBQWtCSDs7QUFwRnVELEMsc0RBQ3JDO0FBQ2ZPLEVBQUFBLEVBQUUsRUFBRTBCLG1CQUFVQyxNQUFWLENBQWlCQyxVQUROO0FBRWZkLEVBQUFBLElBQUksRUFBRVksbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRlIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtnZXRIdHRwVXJpRm9yTXhjfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY29udGVudC1yZXBvXCI7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IFBpbGwgZnJvbSBcIi4uL2VsZW1lbnRzL1BpbGxcIjtcbmltcG9ydCB7bWFrZVVzZXJQZXJtYWxpbmt9IGZyb20gXCIuLi8uLi8uLi91dGlscy9wZXJtYWxpbmtzL1Blcm1hbGlua3NcIjtcbmltcG9ydCBCYXNlQXZhdGFyIGZyb20gXCIuLi9hdmF0YXJzL0Jhc2VBdmF0YXJcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQge3JlcGxhY2VhYmxlQ29tcG9uZW50fSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvcmVwbGFjZWFibGVDb21wb25lbnRcIjtcblxuQHJlcGxhY2VhYmxlQ29tcG9uZW50KFwidmlld3Muc2V0dGluZ3MuQnJpZGdlVGlsZVwiKVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJpZGdlVGlsZSBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGV2OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBzdGF0ZSA9IHtcbiAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgfVxuXG4gICAgX3RvZ2dsZVZpc2libGUoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdmlzaWJsZTogIXRoaXMuc3RhdGUudmlzaWJsZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5ldi5nZXRDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IHsgY2hhbm5lbCwgbmV0d29yaywgcHJvdG9jb2wgfSA9IGNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHByb3RvY29sTmFtZSA9IHByb3RvY29sLmRpc3BsYXluYW1lIHx8IHByb3RvY29sLmlkO1xuICAgICAgICBjb25zdCBjaGFubmVsTmFtZSA9IGNoYW5uZWwuZGlzcGxheW5hbWUgfHwgY2hhbm5lbC5pZDtcbiAgICAgICAgY29uc3QgbmV0d29ya05hbWUgPSBuZXR3b3JrID8gbmV0d29yay5kaXNwbGF5bmFtZSB8fCBuZXR3b3JrLmlkIDogcHJvdG9jb2xOYW1lO1xuXG4gICAgICAgIGxldCBjcmVhdG9yID0gbnVsbDtcbiAgICAgICAgaWYgKGNvbnRlbnQuY3JlYXRvcikge1xuICAgICAgICAgICAgY3JlYXRvciA9IF90KFwiVGhpcyBicmlkZ2Ugd2FzIHByb3Zpc2lvbmVkIGJ5IDx1c2VyIC8+LlwiLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICB1c2VyOiA8UGlsbFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT17UGlsbC5UWVBFX1VTRVJfTUVOVElPTn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybD17bWFrZVVzZXJQZXJtYWxpbmsoY29udGVudC5jcmVhdG9yKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZFNob3dQaWxsQXZhdGFyPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAvPixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYm90ID0gX3QoXCJUaGlzIGJyaWRnZSBpcyBtYW5hZ2VkIGJ5IDx1c2VyIC8+LlwiLCB7fSwge1xuICAgICAgICAgICAgdXNlcjogPFBpbGxcbiAgICAgICAgICAgICAgICB0eXBlPXtQaWxsLlRZUEVfVVNFUl9NRU5USU9OfVxuICAgICAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgICAgICB1cmw9e21ha2VVc2VyUGVybWFsaW5rKHRoaXMucHJvcHMuZXYuZ2V0U2VuZGVyKCkpfVxuICAgICAgICAgICAgICAgIHNob3VsZFNob3dQaWxsQXZhdGFyPXt0cnVlfVxuICAgICAgICAgICAgICAgIC8+LFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgbmV0d29ya0ljb247XG5cbiAgICAgICAgaWYgKHByb3RvY29sLmF2YXRhcikge1xuICAgICAgICAgICAgY29uc3QgYXZhdGFyVXJsID0gZ2V0SHR0cFVyaUZvck14YyhcbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SG9tZXNlcnZlclVybCgpLFxuICAgICAgICAgICAgICAgIHByb3RvY29sLmF2YXRhciwgNjQsIDY0LCBcImNyb3BcIixcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIG5ldHdvcmtJY29uID0gPEJhc2VBdmF0YXIgY2xhc3NOYW1lPVwicHJvdG9jb2wtaWNvblwiXG4gICAgICAgICAgICAgICAgd2lkdGg9ezQ4fVxuICAgICAgICAgICAgICAgIGhlaWdodD17NDh9XG4gICAgICAgICAgICAgICAgcmVzaXplTWV0aG9kPSdjcm9wJ1xuICAgICAgICAgICAgICAgIG5hbWU9eyBwcm90b2NvbE5hbWUgfVxuICAgICAgICAgICAgICAgIGlkTmFtZT17IHByb3RvY29sTmFtZSB9XG4gICAgICAgICAgICAgICAgdXJsPXsgYXZhdGFyVXJsIH1cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV0d29ya0ljb24gPSA8ZGl2IGNsYXNzPVwibm9Qcm90b2NvbEljb25cIj48L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpZCA9IHRoaXMucHJvcHMuZXYuZ2V0SWQoKTtcbiAgICAgICAgY29uc3QgbWV0YWRhdGFDbGFzc25hbWUgPSBcIm1ldGFkYXRhXCIgKyAodGhpcy5zdGF0ZS52aXNpYmxlID8gXCIgdmlzaWJsZVwiIDogXCJcIik7XG4gICAgICAgIHJldHVybiAoPGxpIGtleT17aWR9PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2x1bW4taWNvblwiPlxuICAgICAgICAgICAgICAgIHtuZXR3b3JrSWNvbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2x1bW4tZGF0YVwiPlxuICAgICAgICAgICAgICAgIDxoMz57cHJvdG9jb2xOYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwid29ya3NwYWNlLWNoYW5uZWwtZGV0YWlsc1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57X3QoXCJXb3Jrc3BhY2U6ICUobmV0d29ya05hbWUpc1wiLCB7bmV0d29ya05hbWV9KX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNoYW5uZWxcIj57X3QoXCJDaGFubmVsOiAlKGNoYW5uZWxOYW1lKXNcIiwge2NoYW5uZWxOYW1lfSl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e21ldGFkYXRhQ2xhc3NuYW1lfT5cbiAgICAgICAgICAgICAgICAgICAge2NyZWF0b3J9IHtib3R9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X3Nob3dNb3JlXCIga2luZD1cInNlY29uZGFyeVwiIG9uQ2xpY2s9e3RoaXMuX3RvZ2dsZVZpc2libGUuYmluZCh0aGlzKX0+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS52aXNpYmxlID8gX3QoXCJTaG93IGxlc3NcIikgOiBfdChcIlNob3cgbW9yZVwiKSB9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbGk+KTtcbiAgICB9XG59XG4iXX0=