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
const Presets = {
  PrivateChat: "private_chat",
  PublicChat: "public_chat",
  Custom: "custom"
};

var _default = (0, _createReactClass.default)({
  displayName: 'CreateRoomPresets',
  propTypes: {
    onChange: _propTypes.default.func,
    preset: _propTypes.default.string
  },
  Presets: Presets,
  getDefaultProps: function () {
    return {
      onChange: function () {}
    };
  },
  onValueChanged: function (ev) {
    this.props.onChange(ev.target.value);
  },
  render: function () {
    return /*#__PURE__*/_react.default.createElement("select", {
      className: "mx_Presets",
      onChange: this.onValueChanged,
      value: this.props.preset
    }, /*#__PURE__*/_react.default.createElement("option", {
      value: this.Presets.PrivateChat
    }, (0, _languageHandler._t)("Private Chat")), /*#__PURE__*/_react.default.createElement("option", {
      value: this.Presets.PublicChat
    }, (0, _languageHandler._t)("Public Chat")), /*#__PURE__*/_react.default.createElement("option", {
      value: this.Presets.Custom
    }, (0, _languageHandler._t)("Custom")));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NyZWF0ZV9yb29tL1ByZXNldHMuanMiXSwibmFtZXMiOlsiUHJlc2V0cyIsIlByaXZhdGVDaGF0IiwiUHVibGljQ2hhdCIsIkN1c3RvbSIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwib25DaGFuZ2UiLCJQcm9wVHlwZXMiLCJmdW5jIiwicHJlc2V0Iiwic3RyaW5nIiwiZ2V0RGVmYXVsdFByb3BzIiwib25WYWx1ZUNoYW5nZWQiLCJldiIsInByb3BzIiwidGFyZ2V0IiwidmFsdWUiLCJyZW5kZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsTUFBTUEsT0FBTyxHQUFHO0FBQ1pDLEVBQUFBLFdBQVcsRUFBRSxjQUREO0FBRVpDLEVBQUFBLFVBQVUsRUFBRSxhQUZBO0FBR1pDLEVBQUFBLE1BQU0sRUFBRTtBQUhJLENBQWhCOztlQU1lLCtCQUFpQjtBQUM1QkMsRUFBQUEsV0FBVyxFQUFFLG1CQURlO0FBRTVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsUUFBUSxFQUFFQyxtQkFBVUMsSUFEYjtBQUVQQyxJQUFBQSxNQUFNLEVBQUVGLG1CQUFVRztBQUZYLEdBRmlCO0FBTzVCVixFQUFBQSxPQUFPLEVBQUVBLE9BUG1CO0FBUzVCVyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hMLE1BQUFBLFFBQVEsRUFBRSxZQUFXLENBQUU7QUFEcEIsS0FBUDtBQUdILEdBYjJCO0FBZTVCTSxFQUFBQSxjQUFjLEVBQUUsVUFBU0MsRUFBVCxFQUFhO0FBQ3pCLFNBQUtDLEtBQUwsQ0FBV1IsUUFBWCxDQUFvQk8sRUFBRSxDQUFDRSxNQUFILENBQVVDLEtBQTlCO0FBQ0gsR0FqQjJCO0FBbUI1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZix3QkFDSTtBQUFRLE1BQUEsU0FBUyxFQUFDLFlBQWxCO0FBQStCLE1BQUEsUUFBUSxFQUFFLEtBQUtMLGNBQTlDO0FBQThELE1BQUEsS0FBSyxFQUFFLEtBQUtFLEtBQUwsQ0FBV0w7QUFBaEYsb0JBQ0k7QUFBUSxNQUFBLEtBQUssRUFBRSxLQUFLVCxPQUFMLENBQWFDO0FBQTVCLE9BQTJDLHlCQUFHLGNBQUgsQ0FBM0MsQ0FESixlQUVJO0FBQVEsTUFBQSxLQUFLLEVBQUUsS0FBS0QsT0FBTCxDQUFhRTtBQUE1QixPQUEwQyx5QkFBRyxhQUFILENBQTFDLENBRkosZUFHSTtBQUFRLE1BQUEsS0FBSyxFQUFFLEtBQUtGLE9BQUwsQ0FBYUc7QUFBNUIsT0FBc0MseUJBQUcsUUFBSCxDQUF0QyxDQUhKLENBREo7QUFPSDtBQTNCMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuY29uc3QgUHJlc2V0cyA9IHtcbiAgICBQcml2YXRlQ2hhdDogXCJwcml2YXRlX2NoYXRcIixcbiAgICBQdWJsaWNDaGF0OiBcInB1YmxpY19jaGF0XCIsXG4gICAgQ3VzdG9tOiBcImN1c3RvbVwiLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdDcmVhdGVSb29tUHJlc2V0cycsXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgcHJlc2V0OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIH0sXG5cbiAgICBQcmVzZXRzOiBQcmVzZXRzLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvblZhbHVlQ2hhbmdlZDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShldi50YXJnZXQudmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9XCJteF9QcmVzZXRzXCIgb25DaGFuZ2U9e3RoaXMub25WYWx1ZUNoYW5nZWR9IHZhbHVlPXt0aGlzLnByb3BzLnByZXNldH0+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT17dGhpcy5QcmVzZXRzLlByaXZhdGVDaGF0fT57IF90KFwiUHJpdmF0ZSBDaGF0XCIpIH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXt0aGlzLlByZXNldHMuUHVibGljQ2hhdH0+eyBfdChcIlB1YmxpYyBDaGF0XCIpIH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXt0aGlzLlByZXNldHMuQ3VzdG9tfT57IF90KFwiQ3VzdG9tXCIpIH08L29wdGlvbj5cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==