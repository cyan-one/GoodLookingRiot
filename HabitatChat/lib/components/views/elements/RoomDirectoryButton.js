"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2017 Vector Creations Ltd

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
const RoomDirectoryButton = function (props) {
  const ActionButton = sdk.getComponent('elements.ActionButton');
  return /*#__PURE__*/_react.default.createElement(ActionButton, {
    action: "view_room_directory",
    mouseOverAction: props.callout ? "callout_room_directory" : null,
    label: (0, _languageHandler._t)("Room directory"),
    iconPath: require("../../../../res/img/icons-directory.svg"),
    size: props.size,
    tooltip: props.tooltip
  });
};

RoomDirectoryButton.propTypes = {
  size: _propTypes.default.string,
  tooltip: _propTypes.default.bool
};
var _default = RoomDirectoryButton;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1Jvb21EaXJlY3RvcnlCdXR0b24uanMiXSwibmFtZXMiOlsiUm9vbURpcmVjdG9yeUJ1dHRvbiIsInByb3BzIiwiQWN0aW9uQnV0dG9uIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY2FsbG91dCIsInJlcXVpcmUiLCJzaXplIiwidG9vbHRpcCIsInByb3BUeXBlcyIsIlByb3BUeXBlcyIsInN0cmluZyIsImJvb2wiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLE1BQU1BLG1CQUFtQixHQUFHLFVBQVNDLEtBQVQsRUFBZ0I7QUFDeEMsUUFBTUMsWUFBWSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsdUJBQWpCLENBQXJCO0FBQ0Esc0JBQ0ksNkJBQUMsWUFBRDtBQUFjLElBQUEsTUFBTSxFQUFDLHFCQUFyQjtBQUNJLElBQUEsZUFBZSxFQUFFSCxLQUFLLENBQUNJLE9BQU4sR0FBZ0Isd0JBQWhCLEdBQTJDLElBRGhFO0FBRUksSUFBQSxLQUFLLEVBQUUseUJBQUcsZ0JBQUgsQ0FGWDtBQUdJLElBQUEsUUFBUSxFQUFFQyxPQUFPLENBQUMseUNBQUQsQ0FIckI7QUFJSSxJQUFBLElBQUksRUFBRUwsS0FBSyxDQUFDTSxJQUpoQjtBQUtJLElBQUEsT0FBTyxFQUFFTixLQUFLLENBQUNPO0FBTG5CLElBREo7QUFTSCxDQVhEOztBQWFBUixtQkFBbUIsQ0FBQ1MsU0FBcEIsR0FBZ0M7QUFDNUJGLEVBQUFBLElBQUksRUFBRUcsbUJBQVVDLE1BRFk7QUFFNUJILEVBQUFBLE9BQU8sRUFBRUUsbUJBQVVFO0FBRlMsQ0FBaEM7ZUFLZVosbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmNvbnN0IFJvb21EaXJlY3RvcnlCdXR0b24gPSBmdW5jdGlvbihwcm9wcykge1xuICAgIGNvbnN0IEFjdGlvbkJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjdGlvbkJ1dHRvbicpO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxBY3Rpb25CdXR0b24gYWN0aW9uPVwidmlld19yb29tX2RpcmVjdG9yeVwiXG4gICAgICAgICAgICBtb3VzZU92ZXJBY3Rpb249e3Byb3BzLmNhbGxvdXQgPyBcImNhbGxvdXRfcm9vbV9kaXJlY3RvcnlcIiA6IG51bGx9XG4gICAgICAgICAgICBsYWJlbD17X3QoXCJSb29tIGRpcmVjdG9yeVwiKX1cbiAgICAgICAgICAgIGljb25QYXRoPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29ucy1kaXJlY3Rvcnkuc3ZnXCIpfVxuICAgICAgICAgICAgc2l6ZT17cHJvcHMuc2l6ZX1cbiAgICAgICAgICAgIHRvb2x0aXA9e3Byb3BzLnRvb2x0aXB9XG4gICAgICAgIC8+XG4gICAgKTtcbn07XG5cblJvb21EaXJlY3RvcnlCdXR0b24ucHJvcFR5cGVzID0ge1xuICAgIHNpemU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgdG9vbHRpcDogUHJvcFR5cGVzLmJvb2wsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBSb29tRGlyZWN0b3J5QnV0dG9uO1xuIl19