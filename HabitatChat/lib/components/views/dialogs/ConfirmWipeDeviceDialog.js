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

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2019 The Matrix.org Foundation C.I.C.

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
class ConfirmWipeDeviceDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onConfirm", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_onDecline", () => {
      this.props.onFinished(false);
    });
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_ConfirmWipeDeviceDialog",
      hasCancel: true,
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Clear all data in this session?")
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ConfirmWipeDeviceDialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Clearing all data from this session is permanent. Encrypted messages will be lost " + "unless their keys have been backed up."))), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Clear all data"),
      onPrimaryButtonClick: this._onConfirm,
      primaryButtonClass: "danger",
      cancelButton: (0, _languageHandler._t)("Cancel"),
      onCancel: this._onDecline
    }));
  }

}

exports.default = ConfirmWipeDeviceDialog;
(0, _defineProperty2.default)(ConfirmWipeDeviceDialog, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ29uZmlybVdpcGVEZXZpY2VEaWFsb2cuanMiXSwibmFtZXMiOlsiQ29uZmlybVdpcGVEZXZpY2VEaWFsb2ciLCJSZWFjdCIsIkNvbXBvbmVudCIsInByb3BzIiwib25GaW5pc2hlZCIsInJlbmRlciIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJEaWFsb2dCdXR0b25zIiwiX29uQ29uZmlybSIsIl9vbkRlY2xpbmUiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQSx1QkFBTixTQUFzQ0MsZUFBTUMsU0FBNUMsQ0FBc0Q7QUFBQTtBQUFBO0FBQUEsc0RBS3BELE1BQU07QUFDZixXQUFLQyxLQUFMLENBQVdDLFVBQVgsQ0FBc0IsSUFBdEI7QUFDSCxLQVBnRTtBQUFBLHNEQVNwRCxNQUFNO0FBQ2YsV0FBS0QsS0FBTCxDQUFXQyxVQUFYLENBQXNCLEtBQXRCO0FBQ0gsS0FYZ0U7QUFBQTs7QUFhakVDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLFVBQVUsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDBCQUFqQixDQUFuQjtBQUNBLFVBQU1DLGFBQWEsR0FBR0YsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDhCQUFqQixDQUF0QjtBQUVBLHdCQUNJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLFNBQVMsRUFBQyw0QkFBdEI7QUFBbUQsTUFBQSxTQUFTLEVBQUUsSUFBOUQ7QUFDWSxNQUFBLFVBQVUsRUFBRSxLQUFLTCxLQUFMLENBQVdDLFVBRG5DO0FBRVksTUFBQSxLQUFLLEVBQUUseUJBQUcsaUNBQUg7QUFGbkIsb0JBR0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLHdDQUNLLHlCQUNHLHVGQUNBLHdDQUZILENBREwsQ0FESixDQUhKLGVBV0ksNkJBQUMsYUFBRDtBQUNJLE1BQUEsYUFBYSxFQUFFLHlCQUFHLGdCQUFILENBRG5CO0FBRUksTUFBQSxvQkFBb0IsRUFBRSxLQUFLTSxVQUYvQjtBQUdJLE1BQUEsa0JBQWtCLEVBQUMsUUFIdkI7QUFJSSxNQUFBLFlBQVksRUFBRSx5QkFBRyxRQUFILENBSmxCO0FBS0ksTUFBQSxRQUFRLEVBQUUsS0FBS0M7QUFMbkIsTUFYSixDQURKO0FBcUJIOztBQXRDZ0U7Ozs4QkFBaERYLHVCLGVBQ0U7QUFDZkksRUFBQUEsVUFBVSxFQUFFUSxtQkFBVUMsSUFBVixDQUFlQztBQURaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlybVdpcGVEZXZpY2VEaWFsb2cgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIF9vbkNvbmZpcm0gPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9O1xuXG4gICAgX29uRGVjbGluZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT0nbXhfQ29uZmlybVdpcGVEZXZpY2VEaWFsb2cnIGhhc0NhbmNlbD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkNsZWFyIGFsbCBkYXRhIGluIHRoaXMgc2Vzc2lvbj9cIil9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9Db25maXJtV2lwZURldmljZURpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJDbGVhcmluZyBhbGwgZGF0YSBmcm9tIHRoaXMgc2Vzc2lvbiBpcyBwZXJtYW5lbnQuIEVuY3J5cHRlZCBtZXNzYWdlcyB3aWxsIGJlIGxvc3QgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5sZXNzIHRoZWlyIGtleXMgaGF2ZSBiZWVuIGJhY2tlZCB1cC5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uPXtfdChcIkNsZWFyIGFsbCBkYXRhXCIpfVxuICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25Db25maXJtfVxuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uQ2xhc3M9XCJkYW5nZXJcIlxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxCdXR0b249e190KFwiQ2FuY2VsXCIpfVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17dGhpcy5fb25EZWNsaW5lfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19