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

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _DeviceListener = _interopRequireDefault(require("../../../DeviceListener"));

var _SetupEncryptionDialog = _interopRequireDefault(require("../dialogs/SetupEncryptionDialog"));

var _CrossSigningManager = require("../../../CrossSigningManager");

/*
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
class SetupEncryptionToast extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onLaterClick", () => {
      _DeviceListener.default.sharedInstance().dismissEncryptionSetup();
    });
    (0, _defineProperty2.default)(this, "_onSetupClick", async () => {
      if (this.props.kind === "verify_this_session") {
        _Modal.default.createTrackedDialog('Verify session', 'Verify session', _SetupEncryptionDialog.default, {}, null,
        /* priority = */
        false,
        /* static = */
        true);
      } else {
        const Spinner = sdk.getComponent("elements.Spinner");

        const modal = _Modal.default.createDialog(Spinner, null, 'mx_Dialog_spinner',
        /* priority */
        false,
        /* static */
        true);

        try {
          await (0, _CrossSigningManager.accessSecretStorage)();
        } finally {
          modal.close();
        }
      }
    });
  }

  getDescription() {
    switch (this.props.kind) {
      case 'set_up_encryption':
      case 'upgrade_encryption':
        return (0, _languageHandler._t)('Verify yourself & others to keep your chats safe');

      case 'verify_this_session':
        return (0, _languageHandler._t)('Other users may not trust it');
    }
  }

  getSetupCaption() {
    switch (this.props.kind) {
      case 'set_up_encryption':
        return (0, _languageHandler._t)('Set up');

      case 'upgrade_encryption':
        return (0, _languageHandler._t)('Upgrade');

      case 'verify_this_session':
        return (0, _languageHandler._t)('Verify');
    }
  }

  render() {
    const FormButton = sdk.getComponent("elements.FormButton");
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_description"
    }, this.getDescription()), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_buttons",
      "aria-live": "off"
    }, /*#__PURE__*/_react.default.createElement(FormButton, {
      label: (0, _languageHandler._t)("Later"),
      kind: "danger",
      onClick: this._onLaterClick
    }), /*#__PURE__*/_react.default.createElement(FormButton, {
      label: this.getSetupCaption(),
      onClick: this._onSetupClick
    })));
  }

}

exports.default = SetupEncryptionToast;
(0, _defineProperty2.default)(SetupEncryptionToast, "propTypes", {
  toastKey: _propTypes.default.string.isRequired,
  kind: _propTypes.default.oneOf(['set_up_encryption', 'verify_this_session', 'upgrade_encryption']).isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3RvYXN0cy9TZXR1cEVuY3J5cHRpb25Ub2FzdC5qcyJdLCJuYW1lcyI6WyJTZXR1cEVuY3J5cHRpb25Ub2FzdCIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsIkRldmljZUxpc3RlbmVyIiwic2hhcmVkSW5zdGFuY2UiLCJkaXNtaXNzRW5jcnlwdGlvblNldHVwIiwicHJvcHMiLCJraW5kIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwiU2V0dXBFbmNyeXB0aW9uRGlhbG9nIiwiU3Bpbm5lciIsInNkayIsImdldENvbXBvbmVudCIsIm1vZGFsIiwiY3JlYXRlRGlhbG9nIiwiY2xvc2UiLCJnZXREZXNjcmlwdGlvbiIsImdldFNldHVwQ2FwdGlvbiIsInJlbmRlciIsIkZvcm1CdXR0b24iLCJfb25MYXRlckNsaWNrIiwiX29uU2V0dXBDbGljayIsInRvYXN0S2V5IiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsIm9uZU9mIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUJlLE1BQU1BLG9CQUFOLFNBQW1DQyxlQUFNQyxhQUF6QyxDQUF1RDtBQUFBO0FBQUE7QUFBQSx5REFVbEQsTUFBTTtBQUNsQkMsOEJBQWVDLGNBQWYsR0FBZ0NDLHNCQUFoQztBQUNILEtBWmlFO0FBQUEseURBY2xELFlBQVk7QUFDeEIsVUFBSSxLQUFLQyxLQUFMLENBQVdDLElBQVgsS0FBb0IscUJBQXhCLEVBQStDO0FBQzNDQyx1QkFBTUMsbUJBQU4sQ0FBMEIsZ0JBQTFCLEVBQTRDLGdCQUE1QyxFQUE4REMsOEJBQTlELEVBQ0ksRUFESixFQUNRLElBRFI7QUFDYztBQUFpQixhQUQvQjtBQUNzQztBQUFlLFlBRHJEO0FBRUgsT0FIRCxNQUdPO0FBQ0gsY0FBTUMsT0FBTyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQWhCOztBQUNBLGNBQU1DLEtBQUssR0FBR04sZUFBTU8sWUFBTixDQUNWSixPQURVLEVBQ0QsSUFEQyxFQUNLLG1CQURMO0FBQzBCO0FBQWUsYUFEekM7QUFDZ0Q7QUFBYSxZQUQ3RCxDQUFkOztBQUdBLFlBQUk7QUFDQSxnQkFBTSwrQ0FBTjtBQUNILFNBRkQsU0FFVTtBQUNORyxVQUFBQSxLQUFLLENBQUNFLEtBQU47QUFDSDtBQUNKO0FBQ0osS0E3QmlFO0FBQUE7O0FBK0JsRUMsRUFBQUEsY0FBYyxHQUFHO0FBQ2IsWUFBUSxLQUFLWCxLQUFMLENBQVdDLElBQW5CO0FBQ0ksV0FBSyxtQkFBTDtBQUNBLFdBQUssb0JBQUw7QUFDSSxlQUFPLHlCQUFHLGtEQUFILENBQVA7O0FBQ0osV0FBSyxxQkFBTDtBQUNJLGVBQU8seUJBQUcsOEJBQUgsQ0FBUDtBQUxSO0FBT0g7O0FBRURXLEVBQUFBLGVBQWUsR0FBRztBQUNkLFlBQVEsS0FBS1osS0FBTCxDQUFXQyxJQUFuQjtBQUNJLFdBQUssbUJBQUw7QUFDSSxlQUFPLHlCQUFHLFFBQUgsQ0FBUDs7QUFDSixXQUFLLG9CQUFMO0FBQ0ksZUFBTyx5QkFBRyxTQUFILENBQVA7O0FBQ0osV0FBSyxxQkFBTDtBQUNJLGVBQU8seUJBQUcsUUFBSCxDQUFQO0FBTlI7QUFRSDs7QUFFRFksRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHUixHQUFHLENBQUNDLFlBQUosQ0FBaUIscUJBQWpCLENBQW5CO0FBQ0Esd0JBQVEsdURBQ0o7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQXVDLEtBQUtJLGNBQUwsRUFBdkMsQ0FESSxlQUVKO0FBQUssTUFBQSxTQUFTLEVBQUMsa0JBQWY7QUFBa0MsbUJBQVU7QUFBNUMsb0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsS0FBSyxFQUFFLHlCQUFHLE9BQUgsQ0FBbkI7QUFBZ0MsTUFBQSxJQUFJLEVBQUMsUUFBckM7QUFBOEMsTUFBQSxPQUFPLEVBQUUsS0FBS0k7QUFBNUQsTUFESixlQUVJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLEtBQUssRUFBRSxLQUFLSCxlQUFMLEVBQW5CO0FBQTJDLE1BQUEsT0FBTyxFQUFFLEtBQUtJO0FBQXpELE1BRkosQ0FGSSxDQUFSO0FBT0g7O0FBN0RpRTs7OzhCQUFqRHRCLG9CLGVBQ0U7QUFDZnVCLEVBQUFBLFFBQVEsRUFBRUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFo7QUFFZm5CLEVBQUFBLElBQUksRUFBRWlCLG1CQUFVRyxLQUFWLENBQWdCLENBQ2xCLG1CQURrQixFQUVsQixxQkFGa0IsRUFHbEIsb0JBSGtCLENBQWhCLEVBSUhEO0FBTlksQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbmh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IERldmljZUxpc3RlbmVyIGZyb20gJy4uLy4uLy4uL0RldmljZUxpc3RlbmVyJztcbmltcG9ydCBTZXR1cEVuY3J5cHRpb25EaWFsb2cgZnJvbSBcIi4uL2RpYWxvZ3MvU2V0dXBFbmNyeXB0aW9uRGlhbG9nXCI7XG5pbXBvcnQgeyBhY2Nlc3NTZWNyZXRTdG9yYWdlIH0gZnJvbSAnLi4vLi4vLi4vQ3Jvc3NTaWduaW5nTWFuYWdlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNldHVwRW5jcnlwdGlvblRvYXN0IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgdG9hc3RLZXk6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAga2luZDogUHJvcFR5cGVzLm9uZU9mKFtcbiAgICAgICAgICAgICdzZXRfdXBfZW5jcnlwdGlvbicsXG4gICAgICAgICAgICAndmVyaWZ5X3RoaXNfc2Vzc2lvbicsXG4gICAgICAgICAgICAndXBncmFkZV9lbmNyeXB0aW9uJyxcbiAgICAgICAgXSkuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgX29uTGF0ZXJDbGljayA9ICgpID0+IHtcbiAgICAgICAgRGV2aWNlTGlzdGVuZXIuc2hhcmVkSW5zdGFuY2UoKS5kaXNtaXNzRW5jcnlwdGlvblNldHVwKCk7XG4gICAgfTtcblxuICAgIF9vblNldHVwQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmtpbmQgPT09IFwidmVyaWZ5X3RoaXNfc2Vzc2lvblwiKSB7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdWZXJpZnkgc2Vzc2lvbicsICdWZXJpZnkgc2Vzc2lvbicsIFNldHVwRW5jcnlwdGlvbkRpYWxvZyxcbiAgICAgICAgICAgICAgICB7fSwgbnVsbCwgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICBjb25zdCBtb2RhbCA9IE1vZGFsLmNyZWF0ZURpYWxvZyhcbiAgICAgICAgICAgICAgICBTcGlubmVyLCBudWxsLCAnbXhfRGlhbG9nX3NwaW5uZXInLCAvKiBwcmlvcml0eSAqLyBmYWxzZSwgLyogc3RhdGljICovIHRydWUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBhY2Nlc3NTZWNyZXRTdG9yYWdlKCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0RGVzY3JpcHRpb24oKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5raW5kKSB7XG4gICAgICAgICAgICBjYXNlICdzZXRfdXBfZW5jcnlwdGlvbic6XG4gICAgICAgICAgICBjYXNlICd1cGdyYWRlX2VuY3J5cHRpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnVmVyaWZ5IHlvdXJzZWxmICYgb3RoZXJzIHRvIGtlZXAgeW91ciBjaGF0cyBzYWZlJyk7XG4gICAgICAgICAgICBjYXNlICd2ZXJpZnlfdGhpc19zZXNzaW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ090aGVyIHVzZXJzIG1heSBub3QgdHJ1c3QgaXQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFNldHVwQ2FwdGlvbigpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLnByb3BzLmtpbmQpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NldF91cF9lbmNyeXB0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1NldCB1cCcpO1xuICAgICAgICAgICAgY2FzZSAndXBncmFkZV9lbmNyeXB0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1VwZ3JhZGUnKTtcbiAgICAgICAgICAgIGNhc2UgJ3ZlcmlmeV90aGlzX3Nlc3Npb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnVmVyaWZ5Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEZvcm1CdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuRm9ybUJ1dHRvblwiKTtcbiAgICAgICAgcmV0dXJuICg8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub2FzdF9kZXNjcmlwdGlvblwiPnt0aGlzLmdldERlc2NyaXB0aW9uKCl9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1RvYXN0X2J1dHRvbnNcIiBhcmlhLWxpdmU9XCJvZmZcIj5cbiAgICAgICAgICAgICAgICA8Rm9ybUJ1dHRvbiBsYWJlbD17X3QoXCJMYXRlclwiKX0ga2luZD1cImRhbmdlclwiIG9uQ2xpY2s9e3RoaXMuX29uTGF0ZXJDbGlja30gLz5cbiAgICAgICAgICAgICAgICA8Rm9ybUJ1dHRvbiBsYWJlbD17dGhpcy5nZXRTZXR1cENhcHRpb24oKX0gb25DbGljaz17dGhpcy5fb25TZXR1cENsaWNrfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2Pik7XG4gICAgfVxufVxuIl19