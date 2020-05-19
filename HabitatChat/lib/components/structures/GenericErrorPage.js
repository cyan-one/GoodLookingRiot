"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

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
class GenericErrorPage extends _react.default.PureComponent {
  render() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GenericErrorPage"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GenericErrorPage_box"
    }, /*#__PURE__*/_react.default.createElement("h1", null, this.props.title), /*#__PURE__*/_react.default.createElement("p", null, this.props.message)));
  }

}

exports.default = GenericErrorPage;
(0, _defineProperty2.default)(GenericErrorPage, "propTypes", {
  title: _propTypes.default.object.isRequired,
  // jsx for title
  message: _propTypes.default.object.isRequired // jsx to display

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvR2VuZXJpY0Vycm9yUGFnZS5qcyJdLCJuYW1lcyI6WyJHZW5lcmljRXJyb3JQYWdlIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwicmVuZGVyIiwicHJvcHMiLCJ0aXRsZSIsIm1lc3NhZ2UiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQW1CZSxNQUFNQSxnQkFBTixTQUErQkMsZUFBTUMsYUFBckMsQ0FBbUQ7QUFNOURDLEVBQUFBLE1BQU0sR0FBRztBQUNMLHdCQUFPO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSDtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0kseUNBQUssS0FBS0MsS0FBTCxDQUFXQyxLQUFoQixDQURKLGVBRUksd0NBQUksS0FBS0QsS0FBTCxDQUFXRSxPQUFmLENBRkosQ0FERyxDQUFQO0FBTUg7O0FBYjZEOzs7OEJBQTdDTixnQixlQUNFO0FBQ2ZLLEVBQUFBLEtBQUssRUFBRUUsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFQ7QUFDcUI7QUFDcENILEVBQUFBLE9BQU8sRUFBRUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRlgsQ0FFdUI7O0FBRnZCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuZXJpY0Vycm9yUGFnZSBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHRpdGxlOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsIC8vIGpzeCBmb3IgdGl0bGVcbiAgICAgICAgbWVzc2FnZTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLCAvLyBqc3ggdG8gZGlzcGxheVxuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbXhfR2VuZXJpY0Vycm9yUGFnZSc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfR2VuZXJpY0Vycm9yUGFnZV9ib3gnPlxuICAgICAgICAgICAgICAgIDxoMT57dGhpcy5wcm9wcy50aXRsZX08L2gxPlxuICAgICAgICAgICAgICAgIDxwPnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG4iXX0=