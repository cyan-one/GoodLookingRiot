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

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var FormattingUtils = _interopRequireWildcard(require("../../../utils/FormattingUtils"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 New Vector Ltd
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
class ManualDeviceKeyVerificationDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onCancelClick", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onLegacyFinished", confirm => {
      if (confirm) {
        _MatrixClientPeg.MatrixClientPeg.get().setDeviceVerified(this.props.userId, this.props.device.deviceId, true);
      }

      this.props.onFinished(confirm);
    });
  }

  render() {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    let text;

    if (_MatrixClientPeg.MatrixClientPeg.get().getUserId() === this.props.userId) {
      text = (0, _languageHandler._t)("Confirm by comparing the following with the User Settings in your other session:");
    } else {
      text = (0, _languageHandler._t)("Confirm this user's session by comparing the following with their User Settings:");
    }

    const key = FormattingUtils.formatCryptoKey(this.props.device.getFingerprint());

    const body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, text), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DeviceVerifyDialog_cryptoSection"
    }, /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session name"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, this.props.device.getDisplayName())), /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session ID"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, this.props.device.deviceId))), /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)("Session key"), ":"), " ", /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("code", null, /*#__PURE__*/_react.default.createElement("b", null, key)))))), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("If they don't match, the security of your communication may be compromised.")));

    return /*#__PURE__*/_react.default.createElement(QuestionDialog, {
      title: (0, _languageHandler._t)("Verify session"),
      description: body,
      button: (0, _languageHandler._t)("Verify session"),
      onFinished: this._onLegacyFinished
    });
  }

}

exports.default = ManualDeviceKeyVerificationDialog;
(0, _defineProperty2.default)(ManualDeviceKeyVerificationDialog, "propTypes", {
  userId: _propTypes.default.string.isRequired,
  device: _propTypes.default.object.isRequired,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvTWFudWFsRGV2aWNlS2V5VmVyaWZpY2F0aW9uRGlhbG9nLmpzIl0sIm5hbWVzIjpbIk1hbnVhbERldmljZUtleVZlcmlmaWNhdGlvbkRpYWxvZyIsIlJlYWN0IiwiQ29tcG9uZW50IiwicHJvcHMiLCJvbkZpbmlzaGVkIiwiY29uZmlybSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInNldERldmljZVZlcmlmaWVkIiwidXNlcklkIiwiZGV2aWNlIiwiZGV2aWNlSWQiLCJyZW5kZXIiLCJRdWVzdGlvbkRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsInRleHQiLCJnZXRVc2VySWQiLCJrZXkiLCJGb3JtYXR0aW5nVXRpbHMiLCJmb3JtYXRDcnlwdG9LZXkiLCJnZXRGaW5nZXJwcmludCIsImJvZHkiLCJnZXREaXNwbGF5TmFtZSIsIl9vbkxlZ2FjeUZpbmlzaGVkIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsIm9iamVjdCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFvQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBekJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJlLE1BQU1BLGlDQUFOLFNBQWdEQyxlQUFNQyxTQUF0RCxDQUFnRTtBQUFBO0FBQUE7QUFBQSwwREFPMUQsTUFBTTtBQUNuQixXQUFLQyxLQUFMLENBQVdDLFVBQVgsQ0FBc0IsS0FBdEI7QUFDSCxLQVQwRTtBQUFBLDZEQVd0REMsT0FBRCxJQUFhO0FBQzdCLFVBQUlBLE9BQUosRUFBYTtBQUNUQyx5Q0FBZ0JDLEdBQWhCLEdBQXNCQyxpQkFBdEIsQ0FDSSxLQUFLTCxLQUFMLENBQVdNLE1BRGYsRUFDdUIsS0FBS04sS0FBTCxDQUFXTyxNQUFYLENBQWtCQyxRQUR6QyxFQUNtRCxJQURuRDtBQUdIOztBQUNELFdBQUtSLEtBQUwsQ0FBV0MsVUFBWCxDQUFzQkMsT0FBdEI7QUFDSCxLQWxCMEU7QUFBQTs7QUFvQjNFTyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxjQUFjLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBdkI7QUFFQSxRQUFJQyxJQUFKOztBQUNBLFFBQUlWLGlDQUFnQkMsR0FBaEIsR0FBc0JVLFNBQXRCLE9BQXNDLEtBQUtkLEtBQUwsQ0FBV00sTUFBckQsRUFBNkQ7QUFDekRPLE1BQUFBLElBQUksR0FBRyx5QkFBRyxrRkFBSCxDQUFQO0FBQ0gsS0FGRCxNQUVPO0FBQ0hBLE1BQUFBLElBQUksR0FBRyx5QkFBRyxrRkFBSCxDQUFQO0FBQ0g7O0FBRUQsVUFBTUUsR0FBRyxHQUFHQyxlQUFlLENBQUNDLGVBQWhCLENBQWdDLEtBQUtqQixLQUFMLENBQVdPLE1BQVgsQ0FBa0JXLGNBQWxCLEVBQWhDLENBQVo7O0FBQ0EsVUFBTUMsSUFBSSxnQkFDTix1REFDSSx3Q0FDTU4sSUFETixDQURKLGVBSUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLHNEQUNJLHNEQUFJLDRDQUFTLHlCQUFHLGNBQUgsQ0FBVCxNQUFKLG9CQUEyQywyQ0FBUSxLQUFLYixLQUFMLENBQVdPLE1BQVgsQ0FBa0JhLGNBQWxCLEVBQVIsQ0FBM0MsQ0FESixlQUVJLHNEQUFJLDRDQUFTLHlCQUFHLFlBQUgsQ0FBVCxNQUFKLG9CQUF5Qyx3REFBTSwyQ0FBUSxLQUFLcEIsS0FBTCxDQUFXTyxNQUFYLENBQWtCQyxRQUExQixDQUFOLENBQXpDLENBRkosZUFHSSxzREFBSSw0Q0FBUyx5QkFBRyxhQUFILENBQVQsTUFBSixvQkFBMEMsd0RBQU0sd0RBQU0sd0NBQUtPLEdBQUwsQ0FBTixDQUFOLENBQTFDLENBSEosQ0FESixDQUpKLGVBV0ksd0NBQ00seUJBQUcsNkVBQUgsQ0FETixDQVhKLENBREo7O0FBa0JBLHdCQUNJLDZCQUFDLGNBQUQ7QUFDSSxNQUFBLEtBQUssRUFBRSx5QkFBRyxnQkFBSCxDQURYO0FBRUksTUFBQSxXQUFXLEVBQUVJLElBRmpCO0FBR0ksTUFBQSxNQUFNLEVBQUUseUJBQUcsZ0JBQUgsQ0FIWjtBQUlJLE1BQUEsVUFBVSxFQUFFLEtBQUtFO0FBSnJCLE1BREo7QUFRSDs7QUF6RDBFOzs7OEJBQTFEeEIsaUMsZUFDRTtBQUNmUyxFQUFBQSxNQUFNLEVBQUVnQixtQkFBVUMsTUFBVixDQUFpQkMsVUFEVjtBQUVmakIsRUFBQUEsTUFBTSxFQUFFZSxtQkFBVUcsTUFBVixDQUFpQkQsVUFGVjtBQUdmdkIsRUFBQUEsVUFBVSxFQUFFcUIsbUJBQVVJLElBQVYsQ0FBZUY7QUFIWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCAqIGFzIEZvcm1hdHRpbmdVdGlscyBmcm9tICcuLi8uLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYW51YWxEZXZpY2VLZXlWZXJpZmljYXRpb25EaWFsb2cgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBkZXZpY2U6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgX29uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgX29uTGVnYWN5RmluaXNoZWQgPSAoY29uZmlybSkgPT4ge1xuICAgICAgICBpZiAoY29uZmlybSkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldERldmljZVZlcmlmaWVkKFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMudXNlcklkLCB0aGlzLnByb3BzLmRldmljZS5kZXZpY2VJZCwgdHJ1ZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGNvbmZpcm0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcblxuICAgICAgICBsZXQgdGV4dDtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSA9PT0gdGhpcy5wcm9wcy51c2VySWQpIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIkNvbmZpcm0gYnkgY29tcGFyaW5nIHRoZSBmb2xsb3dpbmcgd2l0aCB0aGUgVXNlciBTZXR0aW5ncyBpbiB5b3VyIG90aGVyIHNlc3Npb246XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dCA9IF90KFwiQ29uZmlybSB0aGlzIHVzZXIncyBzZXNzaW9uIGJ5IGNvbXBhcmluZyB0aGUgZm9sbG93aW5nIHdpdGggdGhlaXIgVXNlciBTZXR0aW5nczpcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXkgPSBGb3JtYXR0aW5nVXRpbHMuZm9ybWF0Q3J5cHRvS2V5KHRoaXMucHJvcHMuZGV2aWNlLmdldEZpbmdlcnByaW50KCkpO1xuICAgICAgICBjb25zdCBib2R5ID0gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0IH1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZpY2VWZXJpZnlEaWFsb2dfY3J5cHRvU2VjdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGxhYmVsPnsgX3QoXCJTZXNzaW9uIG5hbWVcIikgfTo8L2xhYmVsPiA8c3Bhbj57IHRoaXMucHJvcHMuZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgfTwvc3Bhbj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxsYWJlbD57IF90KFwiU2Vzc2lvbiBJRFwiKSB9OjwvbGFiZWw+IDxzcGFuPjxjb2RlPnsgdGhpcy5wcm9wcy5kZXZpY2UuZGV2aWNlSWQgfTwvY29kZT48L3NwYW4+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48bGFiZWw+eyBfdChcIlNlc3Npb24ga2V5XCIpIH06PC9sYWJlbD4gPHNwYW4+PGNvZGU+PGI+eyBrZXkgfTwvYj48L2NvZGU+PC9zcGFuPjwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJJZiB0aGV5IGRvbid0IG1hdGNoLCB0aGUgc2VjdXJpdHkgb2YgeW91ciBjb21tdW5pY2F0aW9uIG1heSBiZSBjb21wcm9taXNlZC5cIikgfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UXVlc3Rpb25EaWFsb2dcbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJWZXJpZnkgc2Vzc2lvblwiKX1cbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17Ym9keX1cbiAgICAgICAgICAgICAgICBidXR0b249e190KFwiVmVyaWZ5IHNlc3Npb25cIil9XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5fb25MZWdhY3lGaW5pc2hlZH1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19