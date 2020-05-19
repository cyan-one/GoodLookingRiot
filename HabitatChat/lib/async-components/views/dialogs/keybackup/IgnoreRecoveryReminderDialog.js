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

var sdk = _interopRequireWildcard(require("../../../../index"));

var _languageHandler = require("../../../../languageHandler");

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
class IgnoreRecoveryReminderDialog extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onDontAskAgainClick", () => {
      this.props.onFinished();
      this.props.onDontAskAgain();
    });
    (0, _defineProperty2.default)(this, "onSetupClick", () => {
      this.props.onFinished();
      this.props.onSetup();
    });
  }

  render() {
    const BaseDialog = sdk.getComponent("views.dialogs.BaseDialog");
    const DialogButtons = sdk.getComponent("views.elements.DialogButtons");
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_IgnoreRecoveryReminderDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Are you sure?")
    }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Without setting up Secure Message Recovery, " + "you'll lose your secure message history when you " + "log out.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("If you don't want to set this up now, you can later " + "in Settings.")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Set up"),
      onPrimaryButtonClick: this.onSetupClick,
      cancelButton: (0, _languageHandler._t)("Don't ask again"),
      onCancel: this.onDontAskAgainClick
    }))));
  }

}

exports.default = IgnoreRecoveryReminderDialog;
(0, _defineProperty2.default)(IgnoreRecoveryReminderDialog, "propTypes", {
  onDontAskAgain: _propTypes.default.func.isRequired,
  onFinished: _propTypes.default.func.isRequired,
  onSetup: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL0lnbm9yZVJlY292ZXJ5UmVtaW5kZXJEaWFsb2cuanMiXSwibmFtZXMiOlsiSWdub3JlUmVjb3ZlcnlSZW1pbmRlckRpYWxvZyIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsInByb3BzIiwib25GaW5pc2hlZCIsIm9uRG9udEFza0FnYWluIiwib25TZXR1cCIsInJlbmRlciIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJEaWFsb2dCdXR0b25zIiwib25TZXR1cENsaWNrIiwib25Eb250QXNrQWdhaW5DbGljayIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7O0FBcUJlLE1BQU1BLDRCQUFOLFNBQTJDQyxlQUFNQyxhQUFqRCxDQUErRDtBQUFBO0FBQUE7QUFBQSwrREFPcEQsTUFBTTtBQUN4QixXQUFLQyxLQUFMLENBQVdDLFVBQVg7QUFDQSxXQUFLRCxLQUFMLENBQVdFLGNBQVg7QUFDSCxLQVZ5RTtBQUFBLHdEQVkzRCxNQUFNO0FBQ2pCLFdBQUtGLEtBQUwsQ0FBV0MsVUFBWDtBQUNBLFdBQUtELEtBQUwsQ0FBV0csT0FBWDtBQUNILEtBZnlFO0FBQUE7O0FBaUIxRUMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsVUFBTUMsYUFBYSxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCO0FBRUEsd0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsU0FBUyxFQUFDLGlDQUF0QjtBQUNJLE1BQUEsVUFBVSxFQUFFLEtBQUtQLEtBQUwsQ0FBV0MsVUFEM0I7QUFFSSxNQUFBLEtBQUssRUFBRSx5QkFBRyxlQUFIO0FBRlgsb0JBSUksdURBQ0ksd0NBQUkseUJBQ0EsaURBQ0EsbURBREEsR0FFQSxVQUhBLENBQUosQ0FESixlQU1JLHdDQUFJLHlCQUNBLHlEQUNBLGNBRkEsQ0FBSixDQU5KLGVBVUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLDZCQUFDLGFBQUQ7QUFDSSxNQUFBLGFBQWEsRUFBRSx5QkFBRyxRQUFILENBRG5CO0FBRUksTUFBQSxvQkFBb0IsRUFBRSxLQUFLUSxZQUYvQjtBQUdJLE1BQUEsWUFBWSxFQUFFLHlCQUFHLGlCQUFILENBSGxCO0FBSUksTUFBQSxRQUFRLEVBQUUsS0FBS0M7QUFKbkIsTUFESixDQVZKLENBSkosQ0FESjtBQTBCSDs7QUEvQ3lFOzs7OEJBQXpEYiw0QixlQUNFO0FBQ2ZLLEVBQUFBLGNBQWMsRUFBRVMsbUJBQVVDLElBQVYsQ0FBZUMsVUFEaEI7QUFFZlosRUFBQUEsVUFBVSxFQUFFVSxtQkFBVUMsSUFBVixDQUFlQyxVQUZaO0FBR2ZWLEVBQUFBLE9BQU8sRUFBRVEsbUJBQVVDLElBQVYsQ0FBZUM7QUFIVCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IHsgX3QgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElnbm9yZVJlY292ZXJ5UmVtaW5kZXJEaWFsb2cgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkRvbnRBc2tBZ2FpbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25TZXR1cDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBvbkRvbnRBc2tBZ2FpbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkRvbnRBc2tBZ2FpbigpO1xuICAgIH1cblxuICAgIG9uU2V0dXBDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIHRoaXMucHJvcHMub25TZXR1cCgpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9uc1wiKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2cgY2xhc3NOYW1lPVwibXhfSWdub3JlUmVjb3ZlcnlSZW1pbmRlckRpYWxvZ1wiXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkFyZSB5b3Ugc3VyZT9cIil9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJXaXRob3V0IHNldHRpbmcgdXAgU2VjdXJlIE1lc3NhZ2UgUmVjb3ZlcnksIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieW91J2xsIGxvc2UgeW91ciBzZWN1cmUgbWVzc2FnZSBoaXN0b3J5IHdoZW4geW91IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nIG91dC5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSWYgeW91IGRvbid0IHdhbnQgdG8gc2V0IHRoaXMgdXAgbm93LCB5b3UgY2FuIGxhdGVyIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaW4gU2V0dGluZ3MuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KFwiU2V0IHVwXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLm9uU2V0dXBDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxCdXR0b249e190KFwiRG9uJ3QgYXNrIGFnYWluXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLm9uRG9udEFza0FnYWluQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=