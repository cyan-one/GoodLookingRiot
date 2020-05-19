"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

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
  displayName: 'CreateRoomButton',
  propTypes: {
    onCreateRoom: _propTypes.default.func
  },
  getDefaultProps: function () {
    return {
      onCreateRoom: function () {}
    };
  },
  onClick: function () {
    this.props.onCreateRoom();
  },
  render: function () {
    return /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_CreateRoomButton",
      onClick: this.onClick
    }, (0, _languageHandler._t)("Create Room"));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NyZWF0ZV9yb29tL0NyZWF0ZVJvb21CdXR0b24uanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkNyZWF0ZVJvb20iLCJQcm9wVHlwZXMiLCJmdW5jIiwiZ2V0RGVmYXVsdFByb3BzIiwib25DbGljayIsInByb3BzIiwicmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7O2VBc0JlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLGtCQURlO0FBRTVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsWUFBWSxFQUFFQyxtQkFBVUM7QUFEakIsR0FGaUI7QUFNNUJDLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSEgsTUFBQUEsWUFBWSxFQUFFLFlBQVcsQ0FBRTtBQUR4QixLQUFQO0FBR0gsR0FWMkI7QUFZNUJJLEVBQUFBLE9BQU8sRUFBRSxZQUFXO0FBQ2hCLFNBQUtDLEtBQUwsQ0FBV0wsWUFBWDtBQUNILEdBZDJCO0FBZ0I1Qk0sRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZix3QkFDSTtBQUFRLE1BQUEsU0FBUyxFQUFDLHFCQUFsQjtBQUF3QyxNQUFBLE9BQU8sRUFBRSxLQUFLRjtBQUF0RCxPQUFpRSx5QkFBRyxhQUFILENBQWpFLENBREo7QUFHSDtBQXBCMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQ3JlYXRlUm9vbUJ1dHRvbicsXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uQ3JlYXRlUm9vbTogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvbkNyZWF0ZVJvb206IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlUm9vbSgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJteF9DcmVhdGVSb29tQnV0dG9uXCIgb25DbGljaz17dGhpcy5vbkNsaWNrfT57IF90KFwiQ3JlYXRlIFJvb21cIikgfTwvYnV0dG9uPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==