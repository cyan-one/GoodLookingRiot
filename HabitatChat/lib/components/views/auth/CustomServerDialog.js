"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'CustomServerDialog',
  render: function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ErrorDialog"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_title"
    }, (0, _languageHandler._t)("Custom Server Options")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You can use the custom server options to sign into other " + "Matrix servers by specifying a different homeserver URL. This " + "allows you to use this app with an existing Matrix account on a " + "different homeserver."))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.props.onFinished,
      autoFocus: true
    }, (0, _languageHandler._t)("Dismiss"))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvQ3VzdG9tU2VydmVyRGlhbG9nLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicmVuZGVyIiwicHJvcHMiLCJvbkZpbmlzaGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7O2VBcUJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLG9CQURlO0FBRzVCQyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTSx5QkFBRyx1QkFBSCxDQUROLENBREosZUFJSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksd0NBQUkseUJBQ0EsOERBQ0EsZ0VBREEsR0FFQSxrRUFGQSxHQUdBLHVCQUpBLENBQUosQ0FESixDQUpKLGVBWUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQVEsTUFBQSxPQUFPLEVBQUUsS0FBS0MsS0FBTCxDQUFXQyxVQUE1QjtBQUF3QyxNQUFBLFNBQVMsRUFBRTtBQUFuRCxPQUNNLHlCQUFHLFNBQUgsQ0FETixDQURKLENBWkosQ0FESjtBQW9CSDtBQXhCMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdDdXN0b21TZXJ2ZXJEaWFsb2cnLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRXJyb3JEaWFsb2dcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ190aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICB7IF90KFwiQ3VzdG9tIFNlcnZlciBPcHRpb25zXCIpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiWW91IGNhbiB1c2UgdGhlIGN1c3RvbSBzZXJ2ZXIgb3B0aW9ucyB0byBzaWduIGludG8gb3RoZXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJNYXRyaXggc2VydmVycyBieSBzcGVjaWZ5aW5nIGEgZGlmZmVyZW50IGhvbWVzZXJ2ZXIgVVJMLiBUaGlzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWxsb3dzIHlvdSB0byB1c2UgdGhpcyBhcHAgd2l0aCBhbiBleGlzdGluZyBNYXRyaXggYWNjb3VudCBvbiBhIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW50IGhvbWVzZXJ2ZXIuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9IGF1dG9Gb2N1cz17dHJ1ZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiRGlzbWlzc1wiKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19