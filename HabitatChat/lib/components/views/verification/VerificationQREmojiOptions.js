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

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _replaceableComponent = require("../../../utils/replaceableComponent");

var _VerificationQRCode = _interopRequireDefault(require("../elements/crypto/VerificationQRCode"));

var _Spinner = _interopRequireDefault(require("../elements/Spinner"));

var _QRCode = require("matrix-js-sdk/src/crypto/verification/QRCode");

var _dec, _class, _class2, _temp;

let VerificationQREmojiOptions = (_dec = (0, _replaceableComponent.replaceableComponent)("views.verification.VerificationQREmojiOptions"), _dec(_class = (_temp = _class2 = class VerificationQREmojiOptions extends _react.default.Component {
  render() {
    const {
      request
    } = this.props;
    const showQR = request.otherPartySupportsMethod(_QRCode.SCAN_QR_CODE_METHOD);
    let qrCode;

    if (showQR) {
      qrCode = /*#__PURE__*/_react.default.createElement(_VerificationQRCode.default, {
        qrCodeData: request.qrCodeData
      });
    } else {
      qrCode = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationQREmojiOptions_noQR"
      }, /*#__PURE__*/_react.default.createElement(_Spinner.default, null));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Verify this session by completing one of the following:"), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingSasDialog_startOptions"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingSasDialog_startOption"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Scan this unique code")), qrCode), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingSasDialog_betweenText"
    }, (0, _languageHandler._t)("or")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingSasDialog_startOption"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Compare unique emoji")), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_IncomingSasDialog_helpText"
    }, (0, _languageHandler._t)("Compare a unique set of emoji if you don't have a camera on either device")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this.props.onStartEmoji,
      kind: "primary"
    }, (0, _languageHandler._t)("Start")))), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this.props.onCancel,
      kind: "danger"
    }, (0, _languageHandler._t)("Cancel")));
  }

}, (0, _defineProperty2.default)(_class2, "propTypes", {
  request: _propTypes.default.object.isRequired,
  onCancel: _propTypes.default.func.isRequired,
  onStartEmoji: _propTypes.default.func.isRequired
}), _temp)) || _class);
exports.default = VerificationQREmojiOptions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3ZlcmlmaWNhdGlvbi9WZXJpZmljYXRpb25RUkVtb2ppT3B0aW9ucy5qcyJdLCJuYW1lcyI6WyJWZXJpZmljYXRpb25RUkVtb2ppT3B0aW9ucyIsIlJlYWN0IiwiQ29tcG9uZW50IiwicmVuZGVyIiwicmVxdWVzdCIsInByb3BzIiwic2hvd1FSIiwib3RoZXJQYXJ0eVN1cHBvcnRzTWV0aG9kIiwiU0NBTl9RUl9DT0RFX01FVEhPRCIsInFyQ29kZSIsInFyQ29kZURhdGEiLCJvblN0YXJ0RW1vamkiLCJvbkNhbmNlbCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQUdxQkEsMEIsV0FEcEIsZ0RBQXFCLCtDQUFyQixDLG1DQUFELE1BQ3FCQSwwQkFEckIsU0FDd0RDLGVBQU1DLFNBRDlELENBQ3dFO0FBT3BFQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNO0FBQUNDLE1BQUFBO0FBQUQsUUFBWSxLQUFLQyxLQUF2QjtBQUNBLFVBQU1DLE1BQU0sR0FBR0YsT0FBTyxDQUFDRyx3QkFBUixDQUFpQ0MsMkJBQWpDLENBQWY7QUFFQSxRQUFJQyxNQUFKOztBQUNBLFFBQUlILE1BQUosRUFBWTtBQUNSRyxNQUFBQSxNQUFNLGdCQUFHLDZCQUFDLDJCQUFEO0FBQW9CLFFBQUEsVUFBVSxFQUFFTCxPQUFPLENBQUNNO0FBQXhDLFFBQVQ7QUFDSCxLQUZELE1BRU87QUFDSEQsTUFBQUEsTUFBTSxnQkFBRztBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQW9ELDZCQUFDLGdCQUFELE9BQXBELENBQVQ7QUFDSDs7QUFFRCx3QkFDSSwwQ0FDSyx5QkFBRyx5REFBSCxDQURMLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSx3Q0FBSSx5QkFBRyx1QkFBSCxDQUFKLENBREosRUFFS0EsTUFGTCxDQURKLGVBS0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQW1ELHlCQUFHLElBQUgsQ0FBbkQsQ0FMSixlQU1JO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSx3Q0FBSSx5QkFBRyxzQkFBSCxDQUFKLENBREosZUFFSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQWlELHlCQUFHLDJFQUFILENBQWpELENBRkosZUFHSSw2QkFBQyx5QkFBRDtBQUFrQixNQUFBLE9BQU8sRUFBRSxLQUFLSixLQUFMLENBQVdNLFlBQXRDO0FBQW9ELE1BQUEsSUFBSSxFQUFDO0FBQXpELE9BQ0sseUJBQUcsT0FBSCxDQURMLENBSEosQ0FOSixDQUZKLGVBZ0JJLDZCQUFDLHlCQUFEO0FBQWtCLE1BQUEsT0FBTyxFQUFFLEtBQUtOLEtBQUwsQ0FBV08sUUFBdEM7QUFBZ0QsTUFBQSxJQUFJLEVBQUM7QUFBckQsT0FDSyx5QkFBRyxRQUFILENBREwsQ0FoQkosQ0FESjtBQXNCSDs7QUF4Q21FLEMsc0RBQ2pEO0FBQ2ZSLEVBQUFBLE9BQU8sRUFBRVMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFg7QUFFZkgsRUFBQUEsUUFBUSxFQUFFQyxtQkFBVUcsSUFBVixDQUFlRCxVQUZWO0FBR2ZKLEVBQUFBLFlBQVksRUFBRUUsbUJBQVVHLElBQVYsQ0FBZUQ7QUFIZCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IHtyZXBsYWNlYWJsZUNvbXBvbmVudH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3JlcGxhY2VhYmxlQ29tcG9uZW50XCI7XG5pbXBvcnQgVmVyaWZpY2F0aW9uUVJDb2RlIGZyb20gXCIuLi9lbGVtZW50cy9jcnlwdG8vVmVyaWZpY2F0aW9uUVJDb2RlXCI7XG5pbXBvcnQgU3Bpbm5lciBmcm9tIFwiLi4vZWxlbWVudHMvU3Bpbm5lclwiO1xuaW1wb3J0IHtTQ0FOX1FSX0NPREVfTUVUSE9EfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY3J5cHRvL3ZlcmlmaWNhdGlvbi9RUkNvZGVcIjtcblxuQHJlcGxhY2VhYmxlQ29tcG9uZW50KFwidmlld3MudmVyaWZpY2F0aW9uLlZlcmlmaWNhdGlvblFSRW1vamlPcHRpb25zXCIpXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJpZmljYXRpb25RUkVtb2ppT3B0aW9ucyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgcmVxdWVzdDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNhbmNlbDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25TdGFydEVtb2ppOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHtyZXF1ZXN0fSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IHNob3dRUiA9IHJlcXVlc3Qub3RoZXJQYXJ0eVN1cHBvcnRzTWV0aG9kKFNDQU5fUVJfQ09ERV9NRVRIT0QpO1xuXG4gICAgICAgIGxldCBxckNvZGU7XG4gICAgICAgIGlmIChzaG93UVIpIHtcbiAgICAgICAgICAgIHFyQ29kZSA9IDxWZXJpZmljYXRpb25RUkNvZGUgcXJDb2RlRGF0YT17cmVxdWVzdC5xckNvZGVEYXRhfSAvPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFyQ29kZSA9IDxkaXYgY2xhc3NOYW1lPSdteF9WZXJpZmljYXRpb25RUkVtb2ppT3B0aW9uc19ub1FSJz48U3Bpbm5lciAvPjwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtfdChcIlZlcmlmeSB0aGlzIHNlc3Npb24gYnkgY29tcGxldGluZyBvbmUgb2YgdGhlIGZvbGxvd2luZzpcIil9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0luY29taW5nU2FzRGlhbG9nX3N0YXJ0T3B0aW9ucyc+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbmNvbWluZ1Nhc0RpYWxvZ19zdGFydE9wdGlvbic+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD57X3QoXCJTY2FuIHRoaXMgdW5pcXVlIGNvZGVcIil9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAge3FyQ29kZX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbmNvbWluZ1Nhc0RpYWxvZ19iZXR3ZWVuVGV4dCc+e190KFwib3JcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbmNvbWluZ1Nhc0RpYWxvZ19zdGFydE9wdGlvbic+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD57X3QoXCJDb21wYXJlIHVuaXF1ZSBlbW9qaVwiKX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X0luY29taW5nU2FzRGlhbG9nX2hlbHBUZXh0Jz57X3QoXCJDb21wYXJlIGEgdW5pcXVlIHNldCBvZiBlbW9qaSBpZiB5b3UgZG9uJ3QgaGF2ZSBhIGNhbWVyYSBvbiBlaXRoZXIgZGV2aWNlXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25TdGFydEVtb2ppfSBraW5kPSdwcmltYXJ5Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJTdGFydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5wcm9wcy5vbkNhbmNlbH0ga2luZD0nZGFuZ2VyJz5cbiAgICAgICAgICAgICAgICAgICAge190KFwiQ2FuY2VsXCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==