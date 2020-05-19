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

var _MatrixClientPeg = require("../../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../../Modal"));

var _actions = require("../../../../dispatcher/actions");

/*
Copyright 2018, 2019 New Vector Ltd
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
class NewRecoveryMethodDialog extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onOkClick", () => {
      this.props.onFinished();
    });
    (0, _defineProperty2.default)(this, "onGoToSettingsClick", () => {
      this.props.onFinished();

      _dispatcher.default.fire(_actions.Action.ViewUserSettings);
    });
    (0, _defineProperty2.default)(this, "onSetupClick", async () => {
      const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');

      _Modal.default.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, {
        onFinished: this.props.onFinished
      }, null,
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
    }, (0, _languageHandler._t)("New Recovery Method"));

    const newMethodDetected = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("A new recovery passphrase and key for Secure Messages have been detected."));

    const hackWarning = /*#__PURE__*/_react.default.createElement("p", {
      className: "warning"
    }, (0, _languageHandler._t)("If you didn't set the new recovery method, an " + "attacker may be trying to access your account. " + "Change your account password and set a new recovery " + "method immediately in Settings."));

    let content;

    if (_MatrixClientPeg.MatrixClientPeg.get().getKeyBackupEnabled()) {
      content = /*#__PURE__*/_react.default.createElement("div", null, newMethodDetected, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This session is encrypting history using the new recovery method.")), hackWarning, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)("OK"),
        onPrimaryButtonClick: this.onOkClick,
        cancelButton: (0, _languageHandler._t)("Go to Settings"),
        onCancel: this.onGoToSettingsClick
      }));
    } else {
      content = /*#__PURE__*/_react.default.createElement("div", null, newMethodDetected, hackWarning, /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)("Set up Secure Messages"),
        onPrimaryButtonClick: this.onSetupClick,
        cancelButton: (0, _languageHandler._t)("Go to Settings"),
        onCancel: this.onGoToSettingsClick
      }));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_KeyBackupFailedDialog",
      onFinished: this.props.onFinished,
      title: title
    }, content);
  }

}

exports.default = NewRecoveryMethodDialog;
(0, _defineProperty2.default)(NewRecoveryMethodDialog, "propTypes", {
  // As returned by js-sdk getKeyBackupVersion()
  newVersionInfo: _propTypes.default.object,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL05ld1JlY292ZXJ5TWV0aG9kRGlhbG9nLmpzIl0sIm5hbWVzIjpbIk5ld1JlY292ZXJ5TWV0aG9kRGlhbG9nIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwicHJvcHMiLCJvbkZpbmlzaGVkIiwiZGlzIiwiZmlyZSIsIkFjdGlvbiIsIlZpZXdVc2VyU2V0dGluZ3MiLCJSZXN0b3JlS2V5QmFja3VwRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsIkRpYWxvZ0J1dHRvbnMiLCJ0aXRsZSIsIm5ld01ldGhvZERldGVjdGVkIiwiaGFja1dhcm5pbmciLCJjb250ZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0S2V5QmFja3VwRW5hYmxlZCIsIm9uT2tDbGljayIsIm9uR29Ub1NldHRpbmdzQ2xpY2siLCJvblNldHVwQ2xpY2siLCJuZXdWZXJzaW9uSW5mbyIsIlByb3BUeXBlcyIsIm9iamVjdCIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7OztBQTBCZSxNQUFNQSx1QkFBTixTQUFzQ0MsZUFBTUMsYUFBNUMsQ0FBMEQ7QUFBQTtBQUFBO0FBQUEscURBT3pELE1BQU07QUFDZCxXQUFLQyxLQUFMLENBQVdDLFVBQVg7QUFDSCxLQVRvRTtBQUFBLCtEQVcvQyxNQUFNO0FBQ3hCLFdBQUtELEtBQUwsQ0FBV0MsVUFBWDs7QUFDQUMsMEJBQUlDLElBQUosQ0FBU0MsZ0JBQU9DLGdCQUFoQjtBQUNILEtBZG9FO0FBQUEsd0RBZ0J0RCxZQUFZO0FBQ3ZCLFlBQU1DLHNCQUFzQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMENBQWpCLENBQS9COztBQUNBQyxxQkFBTUMsbUJBQU4sQ0FDSSxnQkFESixFQUNzQixFQUR0QixFQUMwQkosc0JBRDFCLEVBQ2tEO0FBQzFDTCxRQUFBQSxVQUFVLEVBQUUsS0FBS0QsS0FBTCxDQUFXQztBQURtQixPQURsRCxFQUdPLElBSFA7QUFHYTtBQUFpQixXQUg5QjtBQUdxQztBQUFlLFVBSHBEO0FBS0gsS0F2Qm9FO0FBQUE7O0FBeUJyRVUsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHTCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsVUFBTUssYUFBYSxHQUFHTixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCOztBQUVBLFVBQU1NLEtBQUssZ0JBQUc7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUNULHlCQUFHLHFCQUFILENBRFMsQ0FBZDs7QUFJQSxVQUFNQyxpQkFBaUIsZ0JBQUcsd0NBQUkseUJBQzFCLDJFQUQwQixDQUFKLENBQTFCOztBQUlBLFVBQU1DLFdBQVcsZ0JBQUc7QUFBRyxNQUFBLFNBQVMsRUFBQztBQUFiLE9BQXdCLHlCQUN4QyxtREFDQSxpREFEQSxHQUVBLHNEQUZBLEdBR0EsaUNBSndDLENBQXhCLENBQXBCOztBQU9BLFFBQUlDLE9BQUo7O0FBQ0EsUUFBSUMsaUNBQWdCQyxHQUFoQixHQUFzQkMsbUJBQXRCLEVBQUosRUFBaUQ7QUFDN0NILE1BQUFBLE9BQU8sZ0JBQUcsMENBQ0xGLGlCQURLLGVBRU4sd0NBQUkseUJBQ0EsbUVBREEsQ0FBSixDQUZNLEVBS0xDLFdBTEssZUFNTiw2QkFBQyxhQUFEO0FBQ0ksUUFBQSxhQUFhLEVBQUUseUJBQUcsSUFBSCxDQURuQjtBQUVJLFFBQUEsb0JBQW9CLEVBQUUsS0FBS0ssU0FGL0I7QUFHSSxRQUFBLFlBQVksRUFBRSx5QkFBRyxnQkFBSCxDQUhsQjtBQUlJLFFBQUEsUUFBUSxFQUFFLEtBQUtDO0FBSm5CLFFBTk0sQ0FBVjtBQWFILEtBZEQsTUFjTztBQUNITCxNQUFBQSxPQUFPLGdCQUFHLDBDQUNMRixpQkFESyxFQUVMQyxXQUZLLGVBR04sNkJBQUMsYUFBRDtBQUNJLFFBQUEsYUFBYSxFQUFFLHlCQUFHLHdCQUFILENBRG5CO0FBRUksUUFBQSxvQkFBb0IsRUFBRSxLQUFLTyxZQUYvQjtBQUdJLFFBQUEsWUFBWSxFQUFFLHlCQUFHLGdCQUFILENBSGxCO0FBSUksUUFBQSxRQUFRLEVBQUUsS0FBS0Q7QUFKbkIsUUFITSxDQUFWO0FBVUg7O0FBRUQsd0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsU0FBUyxFQUFDLDBCQUF0QjtBQUNJLE1BQUEsVUFBVSxFQUFFLEtBQUt0QixLQUFMLENBQVdDLFVBRDNCO0FBRUksTUFBQSxLQUFLLEVBQUVhO0FBRlgsT0FJS0csT0FKTCxDQURKO0FBUUg7O0FBaEZvRTs7OzhCQUFwRHBCLHVCLGVBQ0U7QUFDZjtBQUNBMkIsRUFBQUEsY0FBYyxFQUFFQyxtQkFBVUMsTUFGWDtBQUdmekIsRUFBQUEsVUFBVSxFQUFFd0IsbUJBQVVFLElBQVYsQ0FBZUM7QUFIWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCB7QWN0aW9ufSBmcm9tIFwiLi4vLi4vLi4vLi4vZGlzcGF0Y2hlci9hY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5ld1JlY292ZXJ5TWV0aG9kRGlhbG9nIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gQXMgcmV0dXJuZWQgYnkganMtc2RrIGdldEtleUJhY2t1cFZlcnNpb24oKVxuICAgICAgICBuZXdWZXJzaW9uSW5mbzogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBvbk9rQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgIH1cblxuICAgIG9uR29Ub1NldHRpbmdzQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICBkaXMuZmlyZShBY3Rpb24uVmlld1VzZXJTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgb25TZXR1cENsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBSZXN0b3JlS2V5QmFja3VwRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5rZXliYWNrdXAuUmVzdG9yZUtleUJhY2t1cERpYWxvZycpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgJ1Jlc3RvcmUgQmFja3VwJywgJycsIFJlc3RvcmVLZXlCYWNrdXBEaWFsb2csIHtcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiB0aGlzLnByb3BzLm9uRmluaXNoZWQsXG4gICAgICAgICAgICB9LCBudWxsLCAvKiBwcmlvcml0eSA9ICovIGZhbHNlLCAvKiBzdGF0aWMgPSAqLyB0cnVlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9uc1wiKTtcblxuICAgICAgICBjb25zdCB0aXRsZSA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X0tleUJhY2t1cEZhaWxlZERpYWxvZ190aXRsZVwiPlxuICAgICAgICAgICAge190KFwiTmV3IFJlY292ZXJ5IE1ldGhvZFwiKX1cbiAgICAgICAgPC9zcGFuPjtcblxuICAgICAgICBjb25zdCBuZXdNZXRob2REZXRlY3RlZCA9IDxwPntfdChcbiAgICAgICAgICAgIFwiQSBuZXcgcmVjb3ZlcnkgcGFzc3BocmFzZSBhbmQga2V5IGZvciBTZWN1cmUgTWVzc2FnZXMgaGF2ZSBiZWVuIGRldGVjdGVkLlwiLFxuICAgICAgICApfTwvcD47XG5cbiAgICAgICAgY29uc3QgaGFja1dhcm5pbmcgPSA8cCBjbGFzc05hbWU9XCJ3YXJuaW5nXCI+e190KFxuICAgICAgICAgICAgXCJJZiB5b3UgZGlkbid0IHNldCB0aGUgbmV3IHJlY292ZXJ5IG1ldGhvZCwgYW4gXCIgK1xuICAgICAgICAgICAgXCJhdHRhY2tlciBtYXkgYmUgdHJ5aW5nIHRvIGFjY2VzcyB5b3VyIGFjY291bnQuIFwiICtcbiAgICAgICAgICAgIFwiQ2hhbmdlIHlvdXIgYWNjb3VudCBwYXNzd29yZCBhbmQgc2V0IGEgbmV3IHJlY292ZXJ5IFwiICtcbiAgICAgICAgICAgIFwibWV0aG9kIGltbWVkaWF0ZWx5IGluIFNldHRpbmdzLlwiLFxuICAgICAgICApfTwvcD47XG5cbiAgICAgICAgbGV0IGNvbnRlbnQ7XG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0S2V5QmFja3VwRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICB7bmV3TWV0aG9kRGV0ZWN0ZWR9XG4gICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICBcIlRoaXMgc2Vzc2lvbiBpcyBlbmNyeXB0aW5nIGhpc3RvcnkgdXNpbmcgdGhlIG5ldyByZWNvdmVyeSBtZXRob2QuXCIsXG4gICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAge2hhY2tXYXJuaW5nfVxuICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KFwiT0tcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLm9uT2tDbGlja31cbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsQnV0dG9uPXtfdChcIkdvIHRvIFNldHRpbmdzXCIpfVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5vbkdvVG9TZXR0aW5nc0NsaWNrfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50ID0gPGRpdj5cbiAgICAgICAgICAgICAgICB7bmV3TWV0aG9kRGV0ZWN0ZWR9XG4gICAgICAgICAgICAgICAge2hhY2tXYXJuaW5nfVxuICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KFwiU2V0IHVwIFNlY3VyZSBNZXNzYWdlc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMub25TZXR1cENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxCdXR0b249e190KFwiR28gdG8gU2V0dGluZ3NcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLm9uR29Ub1NldHRpbmdzQ2xpY2t9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9XCJteF9LZXlCYWNrdXBGYWlsZWREaWFsb2dcIlxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGl0bGV9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19