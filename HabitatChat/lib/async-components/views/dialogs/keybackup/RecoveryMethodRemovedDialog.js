"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard3(require("../../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../../Modal"));

var _actions = require("../../../../dispatcher/actions");

/*
Copyright 2019 New Vector Ltd
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
class RecoveryMethodRemovedDialog extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onGoToSettingsClick", () => {
      this.props.onFinished();

      _dispatcher.default.fire(_actions.Action.ViewUserSettings);
    });
    (0, _defineProperty2.default)(this, "onSetupClick", () => {
      this.props.onFinished();

      _Modal.default.createTrackedDialogAsync("Key Backup", "Key Backup", Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require("./CreateKeyBackupDialog"))), null, null,
      /* priority = */
      false,
      /* static = */
      true);
    });
  }

  render() {
    const BaseDialog = sdk.getComponent("views.dialogs.BaseDialog");
    const DialogButtons = sdk.getComponent("views.elements.DialogButtons");

    const title = /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_KeyBackupFailedDialog_title"
    }, (0, _languageHandler._t)("Recovery Method Removed"));

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_KeyBackupFailedDialog",
      onFinished: this.props.onFinished,
      title: title
    }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This session has detected that your recovery passphrase and key " + "for Secure Messages have been removed.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("If you did this accidentally, you can setup Secure Messages on " + "this session which will re-encrypt this session's message " + "history with a new recovery method.")), /*#__PURE__*/_react.default.createElement("p", {
      className: "warning"
    }, (0, _languageHandler._t)("If you didn't remove the recovery method, an " + "attacker may be trying to access your account. " + "Change your account password and set a new recovery " + "method immediately in Settings.")), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Set up Secure Messages"),
      onPrimaryButtonClick: this.onSetupClick,
      cancelButton: (0, _languageHandler._t)("Go to Settings"),
      onCancel: this.onGoToSettingsClick
    })));
  }

}

exports.default = RecoveryMethodRemovedDialog;
(0, _defineProperty2.default)(RecoveryMethodRemovedDialog, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL1JlY292ZXJ5TWV0aG9kUmVtb3ZlZERpYWxvZy5qcyJdLCJuYW1lcyI6WyJSZWNvdmVyeU1ldGhvZFJlbW92ZWREaWFsb2ciLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJwcm9wcyIsIm9uRmluaXNoZWQiLCJkaXMiLCJmaXJlIiwiQWN0aW9uIiwiVmlld1VzZXJTZXR0aW5ncyIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIkRpYWxvZ0J1dHRvbnMiLCJ0aXRsZSIsIm9uU2V0dXBDbGljayIsIm9uR29Ub1NldHRpbmdzQ2xpY2siLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7OztBQXlCZSxNQUFNQSwyQkFBTixTQUEwQ0MsZUFBTUMsYUFBaEQsQ0FBOEQ7QUFBQTtBQUFBO0FBQUEsK0RBS25ELE1BQU07QUFDeEIsV0FBS0MsS0FBTCxDQUFXQyxVQUFYOztBQUNBQywwQkFBSUMsSUFBSixDQUFTQyxnQkFBT0MsZ0JBQWhCO0FBQ0gsS0FSd0U7QUFBQSx3REFVMUQsTUFBTTtBQUNqQixXQUFLTCxLQUFMLENBQVdDLFVBQVg7O0FBQ0FLLHFCQUFNQyx3QkFBTixDQUErQixZQUEvQixFQUE2QyxZQUE3Qyw2RUFDVyx5QkFEWCxLQUVJLElBRkosRUFFVSxJQUZWO0FBRWdCO0FBQWlCLFdBRmpDO0FBRXdDO0FBQWUsVUFGdkQ7QUFJSCxLQWhCd0U7QUFBQTs7QUFrQnpFQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxVQUFVLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7QUFDQSxVQUFNQyxhQUFhLEdBQUdGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw4QkFBakIsQ0FBdEI7O0FBRUEsVUFBTUUsS0FBSyxnQkFBRztBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQ1QseUJBQUcseUJBQUgsQ0FEUyxDQUFkOztBQUlBLHdCQUNJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLFNBQVMsRUFBQywwQkFBdEI7QUFDSSxNQUFBLFVBQVUsRUFBRSxLQUFLYixLQUFMLENBQVdDLFVBRDNCO0FBRUksTUFBQSxLQUFLLEVBQUVZO0FBRlgsb0JBSUksdURBQ0ksd0NBQUkseUJBQ0EscUVBQ0Esd0NBRkEsQ0FBSixDQURKLGVBS0ksd0NBQUkseUJBQ0Esb0VBQ0EsNERBREEsR0FFQSxxQ0FIQSxDQUFKLENBTEosZUFVSTtBQUFHLE1BQUEsU0FBUyxFQUFDO0FBQWIsT0FBd0IseUJBQ3BCLGtEQUNBLGlEQURBLEdBRUEsc0RBRkEsR0FHQSxpQ0FKb0IsQ0FBeEIsQ0FWSixlQWdCSSw2QkFBQyxhQUFEO0FBQ0ksTUFBQSxhQUFhLEVBQUUseUJBQUcsd0JBQUgsQ0FEbkI7QUFFSSxNQUFBLG9CQUFvQixFQUFFLEtBQUtDLFlBRi9CO0FBR0ksTUFBQSxZQUFZLEVBQUUseUJBQUcsZ0JBQUgsQ0FIbEI7QUFJSSxNQUFBLFFBQVEsRUFBRSxLQUFLQztBQUpuQixNQWhCSixDQUpKLENBREo7QUE4Qkg7O0FBeER3RTs7OzhCQUF4RGxCLDJCLGVBQ0U7QUFDZkksRUFBQUEsVUFBVSxFQUFFZSxtQkFBVUMsSUFBVixDQUFlQztBQURaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCB7QWN0aW9ufSBmcm9tIFwiLi4vLi4vLi4vLi4vZGlzcGF0Y2hlci9hY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY292ZXJ5TWV0aG9kUmVtb3ZlZERpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgb25Hb1RvU2V0dGluZ3NDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIGRpcy5maXJlKEFjdGlvbi5WaWV3VXNlclNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBvblNldHVwQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMoXCJLZXkgQmFja3VwXCIsIFwiS2V5IEJhY2t1cFwiLFxuICAgICAgICAgICAgaW1wb3J0KFwiLi9DcmVhdGVLZXlCYWNrdXBEaWFsb2dcIiksXG4gICAgICAgICAgICBudWxsLCBudWxsLCAvKiBwcmlvcml0eSA9ICovIGZhbHNlLCAvKiBzdGF0aWMgPSAqLyB0cnVlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9uc1wiKTtcblxuICAgICAgICBjb25zdCB0aXRsZSA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X0tleUJhY2t1cEZhaWxlZERpYWxvZ190aXRsZVwiPlxuICAgICAgICAgICAge190KFwiUmVjb3ZlcnkgTWV0aG9kIFJlbW92ZWRcIil9XG4gICAgICAgIDwvc3Bhbj47XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0tleUJhY2t1cEZhaWxlZERpYWxvZ1wiXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgc2Vzc2lvbiBoYXMgZGV0ZWN0ZWQgdGhhdCB5b3VyIHJlY292ZXJ5IHBhc3NwaHJhc2UgYW5kIGtleSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZvciBTZWN1cmUgTWVzc2FnZXMgaGF2ZSBiZWVuIHJlbW92ZWQuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSBkaWQgdGhpcyBhY2NpZGVudGFsbHksIHlvdSBjYW4gc2V0dXAgU2VjdXJlIE1lc3NhZ2VzIG9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGhpcyBzZXNzaW9uIHdoaWNoIHdpbGwgcmUtZW5jcnlwdCB0aGlzIHNlc3Npb24ncyBtZXNzYWdlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaGlzdG9yeSB3aXRoIGEgbmV3IHJlY292ZXJ5IG1ldGhvZC5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIndhcm5pbmdcIj57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSBkaWRuJ3QgcmVtb3ZlIHRoZSByZWNvdmVyeSBtZXRob2QsIGFuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXR0YWNrZXIgbWF5IGJlIHRyeWluZyB0byBhY2Nlc3MgeW91ciBhY2NvdW50LiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkNoYW5nZSB5b3VyIGFjY291bnQgcGFzc3dvcmQgYW5kIHNldCBhIG5ldyByZWNvdmVyeSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZCBpbW1lZGlhdGVseSBpbiBTZXR0aW5ncy5cIixcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdChcIlNldCB1cCBTZWN1cmUgTWVzc2FnZXNcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5vblNldHVwQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxCdXR0b249e190KFwiR28gdG8gU2V0dGluZ3NcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5vbkdvVG9TZXR0aW5nc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==