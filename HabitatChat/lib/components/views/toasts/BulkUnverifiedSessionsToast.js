"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DeviceListener = _interopRequireDefault(require("../../../DeviceListener"));

var _FormButton = _interopRequireDefault(require("../elements/FormButton"));

var _replaceableComponent = require("../../../utils/replaceableComponent");

var _dec, _class, _class2, _temp;

let BulkUnverifiedSessionsToast = (_dec = (0, _replaceableComponent.replaceableComponent)("views.toasts.BulkUnverifiedSessionsToast"), _dec(_class = (_temp = _class2 = class BulkUnverifiedSessionsToast extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onLaterClick", () => {
      _DeviceListener.default.sharedInstance().dismissUnverifiedSessions(this.props.deviceIds);
    });
    (0, _defineProperty2.default)(this, "_onReviewClick", async () => {
      _DeviceListener.default.sharedInstance().dismissUnverifiedSessions(this.props.deviceIds);

      _dispatcher.default.dispatch({
        action: 'view_user_info',
        userId: _MatrixClientPeg.MatrixClientPeg.get().getUserId()
      });
    });
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_description"
    }, (0, _languageHandler._t)("Verify all your sessions to ensure your account & messages are safe")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_buttons",
      "aria-live": "off"
    }, /*#__PURE__*/_react.default.createElement(_FormButton.default, {
      label: (0, _languageHandler._t)("Later"),
      kind: "danger",
      onClick: this._onLaterClick
    }), /*#__PURE__*/_react.default.createElement(_FormButton.default, {
      label: (0, _languageHandler._t)("Review"),
      onClick: this._onReviewClick
    })));
  }

}, (0, _defineProperty2.default)(_class2, "propTypes", {
  deviceIds: _propTypes.default.array
}), _temp)) || _class);
exports.default = BulkUnverifiedSessionsToast;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3RvYXN0cy9CdWxrVW52ZXJpZmllZFNlc3Npb25zVG9hc3QuanMiXSwibmFtZXMiOlsiQnVsa1VudmVyaWZpZWRTZXNzaW9uc1RvYXN0IiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiRGV2aWNlTGlzdGVuZXIiLCJzaGFyZWRJbnN0YW5jZSIsImRpc21pc3NVbnZlcmlmaWVkU2Vzc2lvbnMiLCJwcm9wcyIsImRldmljZUlkcyIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwidXNlcklkIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0VXNlcklkIiwicmVuZGVyIiwiX29uTGF0ZXJDbGljayIsIl9vblJldmlld0NsaWNrIiwiUHJvcFR5cGVzIiwiYXJyYXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0lBR3FCQSwyQixXQURwQixnREFBcUIsMENBQXJCLEMsbUNBQUQsTUFDcUJBLDJCQURyQixTQUN5REMsZUFBTUMsYUFEL0QsQ0FDNkU7QUFBQTtBQUFBO0FBQUEseURBS3pELE1BQU07QUFDbEJDLDhCQUFlQyxjQUFmLEdBQWdDQyx5QkFBaEMsQ0FBMEQsS0FBS0MsS0FBTCxDQUFXQyxTQUFyRTtBQUNILEtBUHdFO0FBQUEsMERBU3hELFlBQVk7QUFDekJKLDhCQUFlQyxjQUFmLEdBQWdDQyx5QkFBaEMsQ0FBMEQsS0FBS0MsS0FBTCxDQUFXQyxTQUFyRTs7QUFFQUMsMEJBQUlDLFFBQUosQ0FBYTtBQUNUQyxRQUFBQSxNQUFNLEVBQUUsZ0JBREM7QUFFVEMsUUFBQUEsTUFBTSxFQUFFQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxTQUF0QjtBQUZDLE9BQWI7QUFJSCxLQWhCd0U7QUFBQTs7QUFrQnpFQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCx3QkFBUSx1REFDSjtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDSyx5QkFBRyxxRUFBSCxDQURMLENBREksZUFJSjtBQUFLLE1BQUEsU0FBUyxFQUFDLGtCQUFmO0FBQWtDLG1CQUFVO0FBQTVDLG9CQUNJLDZCQUFDLG1CQUFEO0FBQVksTUFBQSxLQUFLLEVBQUUseUJBQUcsT0FBSCxDQUFuQjtBQUFnQyxNQUFBLElBQUksRUFBQyxRQUFyQztBQUE4QyxNQUFBLE9BQU8sRUFBRSxLQUFLQztBQUE1RCxNQURKLGVBRUksNkJBQUMsbUJBQUQ7QUFBWSxNQUFBLEtBQUssRUFBRSx5QkFBRyxRQUFILENBQW5CO0FBQWlDLE1BQUEsT0FBTyxFQUFFLEtBQUtDO0FBQS9DLE1BRkosQ0FKSSxDQUFSO0FBU0g7O0FBNUJ3RSxDLHNEQUN0RDtBQUNmVixFQUFBQSxTQUFTLEVBQUVXLG1CQUFVQztBQUROLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG5odHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgeyBNYXRyaXhDbGllbnRQZWcgfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IERldmljZUxpc3RlbmVyIGZyb20gJy4uLy4uLy4uL0RldmljZUxpc3RlbmVyJztcbmltcG9ydCBGb3JtQnV0dG9uIGZyb20gJy4uL2VsZW1lbnRzL0Zvcm1CdXR0b24nO1xuaW1wb3J0IHsgcmVwbGFjZWFibGVDb21wb25lbnQgfSBmcm9tICcuLi8uLi8uLi91dGlscy9yZXBsYWNlYWJsZUNvbXBvbmVudCc7XG5cbkByZXBsYWNlYWJsZUNvbXBvbmVudChcInZpZXdzLnRvYXN0cy5CdWxrVW52ZXJpZmllZFNlc3Npb25zVG9hc3RcIilcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1bGtVbnZlcmlmaWVkU2Vzc2lvbnNUb2FzdCBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGRldmljZUlkczogUHJvcFR5cGVzLmFycmF5LFxuICAgIH1cblxuICAgIF9vbkxhdGVyQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIERldmljZUxpc3RlbmVyLnNoYXJlZEluc3RhbmNlKCkuZGlzbWlzc1VudmVyaWZpZWRTZXNzaW9ucyh0aGlzLnByb3BzLmRldmljZUlkcyk7XG4gICAgfTtcblxuICAgIF9vblJldmlld0NsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBEZXZpY2VMaXN0ZW5lci5zaGFyZWRJbnN0YW5jZSgpLmRpc21pc3NVbnZlcmlmaWVkU2Vzc2lvbnModGhpcy5wcm9wcy5kZXZpY2VJZHMpO1xuXG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X3VzZXJfaW5mbycsXG4gICAgICAgICAgICB1c2VySWQ6IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuICg8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub2FzdF9kZXNjcmlwdGlvblwiPlxuICAgICAgICAgICAgICAgIHtfdChcIlZlcmlmeSBhbGwgeW91ciBzZXNzaW9ucyB0byBlbnN1cmUgeW91ciBhY2NvdW50ICYgbWVzc2FnZXMgYXJlIHNhZmVcIil9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVG9hc3RfYnV0dG9uc1wiIGFyaWEtbGl2ZT1cIm9mZlwiPlxuICAgICAgICAgICAgICAgIDxGb3JtQnV0dG9uIGxhYmVsPXtfdChcIkxhdGVyXCIpfSBraW5kPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5fb25MYXRlckNsaWNrfSAvPlxuICAgICAgICAgICAgICAgIDxGb3JtQnV0dG9uIGxhYmVsPXtfdChcIlJldmlld1wiKX0gb25DbGljaz17dGhpcy5fb25SZXZpZXdDbGlja30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cbn1cbiJdfQ==