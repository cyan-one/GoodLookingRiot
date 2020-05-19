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

var sdk = _interopRequireWildcard(require("../../../index"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2019 New Vector Ltd

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
class StorageEvictedDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_sendBugReport", ev => {
      ev.preventDefault();
      const BugReportDialog = sdk.getComponent("dialogs.BugReportDialog");

      _Modal.default.createTrackedDialog('Storage evicted', 'Send Bug Report Dialog', BugReportDialog, {});
    });
    (0, _defineProperty2.default)(this, "_onSignOutClick", () => {
      this.props.onFinished(true);
    });
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    let logRequest;

    if (_SdkConfig.default.get().bug_report_endpoint_url) {
      logRequest = (0, _languageHandler._t)("To help us prevent this in future, please <a>send us logs</a>.", {}, {
        a: text => /*#__PURE__*/_react.default.createElement("a", {
          href: "#",
          onClick: this._sendBugReport
        }, text)
      });
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_ErrorDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Missing session data'),
      contentId: "mx_Dialog_content",
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content",
      id: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Some session data, including encrypted message keys, is " + "missing. Sign out and sign in to fix this, restoring keys " + "from backup.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your browser likely removed this data when running low on " + "disk space."), " ", logRequest)), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Sign out"),
      onPrimaryButtonClick: this._onSignOutClick,
      focus: true,
      hasCancel: false
    }));
  }

}

exports.default = StorageEvictedDialog;
(0, _defineProperty2.default)(StorageEvictedDialog, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvU3RvcmFnZUV2aWN0ZWREaWFsb2cuanMiXSwibmFtZXMiOlsiU3RvcmFnZUV2aWN0ZWREaWFsb2ciLCJSZWFjdCIsIkNvbXBvbmVudCIsImV2IiwicHJldmVudERlZmF1bHQiLCJCdWdSZXBvcnREaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJwcm9wcyIsIm9uRmluaXNoZWQiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiRGlhbG9nQnV0dG9ucyIsImxvZ1JlcXVlc3QiLCJTZGtDb25maWciLCJnZXQiLCJidWdfcmVwb3J0X2VuZHBvaW50X3VybCIsImEiLCJ0ZXh0IiwiX3NlbmRCdWdSZXBvcnQiLCJfb25TaWduT3V0Q2xpY2siLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQXVCZSxNQUFNQSxvQkFBTixTQUFtQ0MsZUFBTUMsU0FBekMsQ0FBbUQ7QUFBQTtBQUFBO0FBQUEsMERBSzdDQyxFQUFFLElBQUk7QUFDbkJBLE1BQUFBLEVBQUUsQ0FBQ0MsY0FBSDtBQUNBLFlBQU1DLGVBQWUsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHlCQUFqQixDQUF4Qjs7QUFDQUMscUJBQU1DLG1CQUFOLENBQTBCLGlCQUExQixFQUE2Qyx3QkFBN0MsRUFBdUVKLGVBQXZFLEVBQXdGLEVBQXhGO0FBQ0gsS0FUNkQ7QUFBQSwyREFXNUMsTUFBTTtBQUNwQixXQUFLSyxLQUFMLENBQVdDLFVBQVgsQ0FBc0IsSUFBdEI7QUFDSCxLQWI2RDtBQUFBOztBQWU5REMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHUCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsVUFBTU8sYUFBYSxHQUFHUixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCO0FBRUEsUUFBSVEsVUFBSjs7QUFDQSxRQUFJQyxtQkFBVUMsR0FBVixHQUFnQkMsdUJBQXBCLEVBQTZDO0FBQ3pDSCxNQUFBQSxVQUFVLEdBQUcseUJBQ1QsZ0VBRFMsRUFDeUQsRUFEekQsRUFFYjtBQUNJSSxRQUFBQSxDQUFDLEVBQUVDLElBQUksaUJBQUk7QUFBRyxVQUFBLElBQUksRUFBQyxHQUFSO0FBQVksVUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFBMUIsV0FBMkNELElBQTNDO0FBRGYsT0FGYSxDQUFiO0FBS0g7O0FBRUQsd0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsU0FBUyxFQUFDLGdCQUF0QjtBQUF1QyxNQUFBLFVBQVUsRUFBRSxLQUFLVixLQUFMLENBQVdDLFVBQTlEO0FBQ0ksTUFBQSxLQUFLLEVBQUUseUJBQUcsc0JBQUgsQ0FEWDtBQUVJLE1BQUEsU0FBUyxFQUFDLG1CQUZkO0FBR0ksTUFBQSxTQUFTLEVBQUU7QUFIZixvQkFLSTtBQUFLLE1BQUEsU0FBUyxFQUFDLG1CQUFmO0FBQW1DLE1BQUEsRUFBRSxFQUFDO0FBQXRDLG9CQUNJLHdDQUFJLHlCQUNBLDZEQUNBLDREQURBLEdBRUEsY0FIQSxDQUFKLENBREosZUFNSSx3Q0FBSSx5QkFDQSwrREFDQSxhQUZBLENBQUosT0FHSUksVUFISixDQU5KLENBTEosZUFnQkksNkJBQUMsYUFBRDtBQUFlLE1BQUEsYUFBYSxFQUFFLHlCQUFHLFVBQUgsQ0FBOUI7QUFDSSxNQUFBLG9CQUFvQixFQUFFLEtBQUtPLGVBRC9CO0FBRUksTUFBQSxLQUFLLEVBQUUsSUFGWDtBQUdJLE1BQUEsU0FBUyxFQUFFO0FBSGYsTUFoQkosQ0FESjtBQXdCSDs7QUFwRDZEOzs7OEJBQTdDdEIsb0IsZUFDRTtBQUNmVyxFQUFBQSxVQUFVLEVBQUVZLG1CQUFVQyxJQUFWLENBQWVDO0FBRFosQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBTZGtDb25maWcgZnJvbSAnLi4vLi4vLi4vU2RrQ29uZmlnJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0b3JhZ2VFdmljdGVkRGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBfc2VuZEJ1Z1JlcG9ydCA9IGV2ID0+IHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgQnVnUmVwb3J0RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQnVnUmVwb3J0RGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTdG9yYWdlIGV2aWN0ZWQnLCAnU2VuZCBCdWcgUmVwb3J0IERpYWxvZycsIEJ1Z1JlcG9ydERpYWxvZywge30pO1xuICAgIH07XG5cbiAgICBfb25TaWduT3V0Q2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG5cbiAgICAgICAgbGV0IGxvZ1JlcXVlc3Q7XG4gICAgICAgIGlmIChTZGtDb25maWcuZ2V0KCkuYnVnX3JlcG9ydF9lbmRwb2ludF91cmwpIHtcbiAgICAgICAgICAgIGxvZ1JlcXVlc3QgPSBfdChcbiAgICAgICAgICAgICAgICBcIlRvIGhlbHAgdXMgcHJldmVudCB0aGlzIGluIGZ1dHVyZSwgcGxlYXNlIDxhPnNlbmQgdXMgbG9nczwvYT4uXCIsIHt9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGE6IHRleHQgPT4gPGEgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9zZW5kQnVnUmVwb3J0fT57dGV4dH08L2E+LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2cgY2xhc3NOYW1lPVwibXhfRXJyb3JEaWFsb2dcIiBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgdGl0bGU9e190KCdNaXNzaW5nIHNlc3Npb24gZGF0YScpfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRJZD0nbXhfRGlhbG9nX2NvbnRlbnQnXG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCIgaWQ9J214X0RpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTb21lIHNlc3Npb24gZGF0YSwgaW5jbHVkaW5nIGVuY3J5cHRlZCBtZXNzYWdlIGtleXMsIGlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibWlzc2luZy4gU2lnbiBvdXQgYW5kIHNpZ24gaW4gdG8gZml4IHRoaXMsIHJlc3RvcmluZyBrZXlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZnJvbSBiYWNrdXAuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIllvdXIgYnJvd3NlciBsaWtlbHkgcmVtb3ZlZCB0aGlzIGRhdGEgd2hlbiBydW5uaW5nIGxvdyBvbiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRpc2sgc3BhY2UuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9IHtsb2dSZXF1ZXN0fTwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtfdChcIlNpZ24gb3V0XCIpfVxuICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25TaWduT3V0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIGZvY3VzPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19