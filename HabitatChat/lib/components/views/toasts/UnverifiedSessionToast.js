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

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _DeviceListener = _interopRequireDefault(require("../../../DeviceListener"));

var _NewSessionReviewDialog = _interopRequireDefault(require("../dialogs/NewSessionReviewDialog"));

var _FormButton = _interopRequireDefault(require("../elements/FormButton"));

var _replaceableComponent = require("../../../utils/replaceableComponent");

var _dec, _class, _class2, _temp;

let UnverifiedSessionToast = (_dec = (0, _replaceableComponent.replaceableComponent)("views.toasts.UnverifiedSessionToast"), _dec(_class = (_temp = _class2 = class UnverifiedSessionToast extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onLaterClick", () => {
      _DeviceListener.default.sharedInstance().dismissUnverifiedSessions([this.props.deviceId]);
    });
    (0, _defineProperty2.default)(this, "_onReviewClick", async () => {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      _Modal.default.createTrackedDialog('New Session Review', 'Starting dialog', _NewSessionReviewDialog.default, {
        userId: cli.getUserId(),
        device: cli.getStoredDevice(cli.getUserId(), this.props.deviceId),
        onFinished: r => {
          if (!r) {
            /* This'll come back false if the user clicks "this wasn't me" and saw a warning dialog */
            _DeviceListener.default.sharedInstance().dismissUnverifiedSessions([this.props.deviceId]);
          }
        }
      }, null,
      /* priority = */
      false,
      /* static = */
      true);
    });
  }

  render() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const device = cli.getStoredDevice(cli.getUserId(), this.props.deviceId);
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_description"
    }, (0, _languageHandler._t)("Verify the new login accessing your account: %(name)s", {
      name: device.getDisplayName()
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_buttons",
      "aria-live": "off"
    }, /*#__PURE__*/_react.default.createElement(_FormButton.default, {
      label: (0, _languageHandler._t)("Later"),
      kind: "danger",
      onClick: this._onLaterClick
    }), /*#__PURE__*/_react.default.createElement(_FormButton.default, {
      label: (0, _languageHandler._t)("Verify"),
      onClick: this._onReviewClick
    })));
  }

}, (0, _defineProperty2.default)(_class2, "propTypes", {
  deviceId: _propTypes.default.string
}), _temp)) || _class);
exports.default = UnverifiedSessionToast;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3RvYXN0cy9VbnZlcmlmaWVkU2Vzc2lvblRvYXN0LmpzIl0sIm5hbWVzIjpbIlVudmVyaWZpZWRTZXNzaW9uVG9hc3QiLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJEZXZpY2VMaXN0ZW5lciIsInNoYXJlZEluc3RhbmNlIiwiZGlzbWlzc1VudmVyaWZpZWRTZXNzaW9ucyIsInByb3BzIiwiZGV2aWNlSWQiLCJjbGkiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJOZXdTZXNzaW9uUmV2aWV3RGlhbG9nIiwidXNlcklkIiwiZ2V0VXNlcklkIiwiZGV2aWNlIiwiZ2V0U3RvcmVkRGV2aWNlIiwib25GaW5pc2hlZCIsInIiLCJyZW5kZXIiLCJuYW1lIiwiZ2V0RGlzcGxheU5hbWUiLCJfb25MYXRlckNsaWNrIiwiX29uUmV2aWV3Q2xpY2siLCJQcm9wVHlwZXMiLCJzdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0lBR3FCQSxzQixXQURwQixnREFBcUIscUNBQXJCLEMsbUNBQUQsTUFDcUJBLHNCQURyQixTQUNvREMsZUFBTUMsYUFEMUQsQ0FDd0U7QUFBQTtBQUFBO0FBQUEseURBS3BELE1BQU07QUFDbEJDLDhCQUFlQyxjQUFmLEdBQWdDQyx5QkFBaEMsQ0FBMEQsQ0FBQyxLQUFLQyxLQUFMLENBQVdDLFFBQVosQ0FBMUQ7QUFDSCxLQVBtRTtBQUFBLDBEQVNuRCxZQUFZO0FBQ3pCLFlBQU1DLEdBQUcsR0FBR0MsaUNBQWdCQyxHQUFoQixFQUFaOztBQUNBQyxxQkFBTUMsbUJBQU4sQ0FBMEIsb0JBQTFCLEVBQWdELGlCQUFoRCxFQUFtRUMsK0JBQW5FLEVBQTJGO0FBQ3ZGQyxRQUFBQSxNQUFNLEVBQUVOLEdBQUcsQ0FBQ08sU0FBSixFQUQrRTtBQUV2RkMsUUFBQUEsTUFBTSxFQUFFUixHQUFHLENBQUNTLGVBQUosQ0FBb0JULEdBQUcsQ0FBQ08sU0FBSixFQUFwQixFQUFxQyxLQUFLVCxLQUFMLENBQVdDLFFBQWhELENBRitFO0FBR3ZGVyxRQUFBQSxVQUFVLEVBQUdDLENBQUQsSUFBTztBQUNmLGNBQUksQ0FBQ0EsQ0FBTCxFQUFRO0FBQ0o7QUFDQWhCLG9DQUFlQyxjQUFmLEdBQWdDQyx5QkFBaEMsQ0FBMEQsQ0FBQyxLQUFLQyxLQUFMLENBQVdDLFFBQVosQ0FBMUQ7QUFDSDtBQUNKO0FBUnNGLE9BQTNGLEVBU0csSUFUSDtBQVNTO0FBQWlCLFdBVDFCO0FBU2lDO0FBQWUsVUFUaEQ7QUFVSCxLQXJCbUU7QUFBQTs7QUF1QnBFYSxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNWixHQUFHLEdBQUdDLGlDQUFnQkMsR0FBaEIsRUFBWjs7QUFDQSxVQUFNTSxNQUFNLEdBQUdSLEdBQUcsQ0FBQ1MsZUFBSixDQUFvQlQsR0FBRyxDQUFDTyxTQUFKLEVBQXBCLEVBQXFDLEtBQUtULEtBQUwsQ0FBV0MsUUFBaEQsQ0FBZjtBQUVBLHdCQUFRLHVEQUNKO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLLHlCQUNHLHVEQURILEVBQzREO0FBQUVjLE1BQUFBLElBQUksRUFBRUwsTUFBTSxDQUFDTSxjQUFQO0FBQVIsS0FENUQsQ0FETCxDQURJLGVBS0o7QUFBSyxNQUFBLFNBQVMsRUFBQyxrQkFBZjtBQUFrQyxtQkFBVTtBQUE1QyxvQkFDSSw2QkFBQyxtQkFBRDtBQUFZLE1BQUEsS0FBSyxFQUFFLHlCQUFHLE9BQUgsQ0FBbkI7QUFBZ0MsTUFBQSxJQUFJLEVBQUMsUUFBckM7QUFBOEMsTUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFBNUQsTUFESixlQUVJLDZCQUFDLG1CQUFEO0FBQVksTUFBQSxLQUFLLEVBQUUseUJBQUcsUUFBSCxDQUFuQjtBQUFpQyxNQUFBLE9BQU8sRUFBRSxLQUFLQztBQUEvQyxNQUZKLENBTEksQ0FBUjtBQVVIOztBQXJDbUUsQyxzREFDakQ7QUFDZmpCLEVBQUFBLFFBQVEsRUFBRWtCLG1CQUFVQztBQURMLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG5odHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgTWF0cml4Q2xpZW50UGVnIH0gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgRGV2aWNlTGlzdGVuZXIgZnJvbSAnLi4vLi4vLi4vRGV2aWNlTGlzdGVuZXInO1xuaW1wb3J0IE5ld1Nlc3Npb25SZXZpZXdEaWFsb2cgZnJvbSAnLi4vZGlhbG9ncy9OZXdTZXNzaW9uUmV2aWV3RGlhbG9nJztcbmltcG9ydCBGb3JtQnV0dG9uIGZyb20gJy4uL2VsZW1lbnRzL0Zvcm1CdXR0b24nO1xuaW1wb3J0IHsgcmVwbGFjZWFibGVDb21wb25lbnQgfSBmcm9tICcuLi8uLi8uLi91dGlscy9yZXBsYWNlYWJsZUNvbXBvbmVudCc7XG5cbkByZXBsYWNlYWJsZUNvbXBvbmVudChcInZpZXdzLnRvYXN0cy5VbnZlcmlmaWVkU2Vzc2lvblRvYXN0XCIpXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVbnZlcmlmaWVkU2Vzc2lvblRvYXN0IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZGV2aWNlSWQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfVxuXG4gICAgX29uTGF0ZXJDbGljayA9ICgpID0+IHtcbiAgICAgICAgRGV2aWNlTGlzdGVuZXIuc2hhcmVkSW5zdGFuY2UoKS5kaXNtaXNzVW52ZXJpZmllZFNlc3Npb25zKFt0aGlzLnByb3BzLmRldmljZUlkXSk7XG4gICAgfTtcblxuICAgIF9vblJldmlld0NsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ05ldyBTZXNzaW9uIFJldmlldycsICdTdGFydGluZyBkaWFsb2cnLCBOZXdTZXNzaW9uUmV2aWV3RGlhbG9nLCB7XG4gICAgICAgICAgICB1c2VySWQ6IGNsaS5nZXRVc2VySWQoKSxcbiAgICAgICAgICAgIGRldmljZTogY2xpLmdldFN0b3JlZERldmljZShjbGkuZ2V0VXNlcklkKCksIHRoaXMucHJvcHMuZGV2aWNlSWQpLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVGhpcydsbCBjb21lIGJhY2sgZmFsc2UgaWYgdGhlIHVzZXIgY2xpY2tzIFwidGhpcyB3YXNuJ3QgbWVcIiBhbmQgc2F3IGEgd2FybmluZyBkaWFsb2cgKi9cbiAgICAgICAgICAgICAgICAgICAgRGV2aWNlTGlzdGVuZXIuc2hhcmVkSW5zdGFuY2UoKS5kaXNtaXNzVW52ZXJpZmllZFNlc3Npb25zKFt0aGlzLnByb3BzLmRldmljZUlkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgbnVsbCwgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBkZXZpY2UgPSBjbGkuZ2V0U3RvcmVkRGV2aWNlKGNsaS5nZXRVc2VySWQoKSwgdGhpcy5wcm9wcy5kZXZpY2VJZCk7XG5cbiAgICAgICAgcmV0dXJuICg8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub2FzdF9kZXNjcmlwdGlvblwiPlxuICAgICAgICAgICAgICAgIHtfdChcbiAgICAgICAgICAgICAgICAgICAgXCJWZXJpZnkgdGhlIG5ldyBsb2dpbiBhY2Nlc3NpbmcgeW91ciBhY2NvdW50OiAlKG5hbWUpc1wiLCB7IG5hbWU6IGRldmljZS5nZXREaXNwbGF5TmFtZSgpfSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVG9hc3RfYnV0dG9uc1wiIGFyaWEtbGl2ZT1cIm9mZlwiPlxuICAgICAgICAgICAgICAgIDxGb3JtQnV0dG9uIGxhYmVsPXtfdChcIkxhdGVyXCIpfSBraW5kPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5fb25MYXRlckNsaWNrfSAvPlxuICAgICAgICAgICAgICAgIDxGb3JtQnV0dG9uIGxhYmVsPXtfdChcIlZlcmlmeVwiKX0gb25DbGljaz17dGhpcy5fb25SZXZpZXdDbGlja30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cbn1cbiJdfQ==