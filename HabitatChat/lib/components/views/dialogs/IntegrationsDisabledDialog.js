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

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _actions = require("../../../dispatcher/actions");

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
class IntegrationsDisabledDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onAcknowledgeClick", () => {
      this.props.onFinished();
    });
    (0, _defineProperty2.default)(this, "_onOpenSettingsClick", () => {
      this.props.onFinished();

      _dispatcher.default.fire(_actions.Action.ViewUserSettings);
    });
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_IntegrationsDisabledDialog",
      hasCancel: true,
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Integrations are disabled")
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IntegrationsDisabledDialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Enable 'Manage Integrations' in Settings to do this."))), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Settings"),
      onPrimaryButtonClick: this._onOpenSettingsClick,
      cancelButton: (0, _languageHandler._t)("OK"),
      onCancel: this._onAcknowledgeClick
    }));
  }

}

exports.default = IntegrationsDisabledDialog;
(0, _defineProperty2.default)(IntegrationsDisabledDialog, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvSW50ZWdyYXRpb25zRGlzYWJsZWREaWFsb2cuanMiXSwibmFtZXMiOlsiSW50ZWdyYXRpb25zRGlzYWJsZWREaWFsb2ciLCJSZWFjdCIsIkNvbXBvbmVudCIsInByb3BzIiwib25GaW5pc2hlZCIsImRpcyIsImZpcmUiLCJBY3Rpb24iLCJWaWV3VXNlclNldHRpbmdzIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIkRpYWxvZ0J1dHRvbnMiLCJfb25PcGVuU2V0dGluZ3NDbGljayIsIl9vbkFja25vd2xlZGdlQ2xpY2siLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQXVCZSxNQUFNQSwwQkFBTixTQUF5Q0MsZUFBTUMsU0FBL0MsQ0FBeUQ7QUFBQTtBQUFBO0FBQUEsK0RBSzlDLE1BQU07QUFDeEIsV0FBS0MsS0FBTCxDQUFXQyxVQUFYO0FBQ0gsS0FQbUU7QUFBQSxnRUFTN0MsTUFBTTtBQUN6QixXQUFLRCxLQUFMLENBQVdDLFVBQVg7O0FBQ0FDLDBCQUFJQyxJQUFKLENBQVNDLGdCQUFPQyxnQkFBaEI7QUFDSCxLQVptRTtBQUFBOztBQWNwRUMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsVUFBTUMsYUFBYSxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCO0FBRUEsd0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsU0FBUyxFQUFDLCtCQUF0QjtBQUFzRCxNQUFBLFNBQVMsRUFBRSxJQUFqRTtBQUNZLE1BQUEsVUFBVSxFQUFFLEtBQUtULEtBQUwsQ0FBV0MsVUFEbkM7QUFFWSxNQUFBLEtBQUssRUFBRSx5QkFBRywyQkFBSDtBQUZuQixvQkFHSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksd0NBQUkseUJBQUcsc0RBQUgsQ0FBSixDQURKLENBSEosZUFNSSw2QkFBQyxhQUFEO0FBQ0ksTUFBQSxhQUFhLEVBQUUseUJBQUcsVUFBSCxDQURuQjtBQUVJLE1BQUEsb0JBQW9CLEVBQUUsS0FBS1Usb0JBRi9CO0FBR0ksTUFBQSxZQUFZLEVBQUUseUJBQUcsSUFBSCxDQUhsQjtBQUlJLE1BQUEsUUFBUSxFQUFFLEtBQUtDO0FBSm5CLE1BTkosQ0FESjtBQWVIOztBQWpDbUU7Ozs4QkFBbkRmLDBCLGVBQ0U7QUFDZkksRUFBQUEsVUFBVSxFQUFFWSxtQkFBVUMsSUFBVixDQUFlQztBQURaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7QWN0aW9ufSBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9hY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEludGVncmF0aW9uc0Rpc2FibGVkRGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBfb25BY2tub3dsZWRnZUNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9O1xuXG4gICAgX29uT3BlblNldHRpbmdzQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICBkaXMuZmlyZShBY3Rpb24uVmlld1VzZXJTZXR0aW5ncyk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9J214X0ludGVncmF0aW9uc0Rpc2FibGVkRGlhbG9nJyBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJJbnRlZ3JhdGlvbnMgYXJlIGRpc2FibGVkXCIpfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfSW50ZWdyYXRpb25zRGlzYWJsZWREaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcIkVuYWJsZSAnTWFuYWdlIEludGVncmF0aW9ucycgaW4gU2V0dGluZ3MgdG8gZG8gdGhpcy5cIil9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KFwiU2V0dGluZ3NcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vbk9wZW5TZXR0aW5nc0NsaWNrfVxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxCdXR0b249e190KFwiT0tcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLl9vbkFja25vd2xlZGdlQ2xpY2t9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=