"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2017 New Vector Ltd.
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
  displayName: 'TooltipButton',
  getInitialState: function () {
    return {
      hover: false
    };
  },
  onMouseOver: function () {
    this.setState({
      hover: true
    });
  },
  onMouseOut: function () {
    this.setState({
      hover: false
    });
  },
  render: function () {
    const Tooltip = sdk.getComponent("elements.Tooltip");
    const tip = this.state.hover ? /*#__PURE__*/_react.default.createElement(Tooltip, {
      className: "mx_TooltipButton_container",
      tooltipClassName: "mx_TooltipButton_helpText",
      label: this.props.helpText
    }) : /*#__PURE__*/_react.default.createElement("div", null);
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TooltipButton",
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut
    }, "?", tip);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1Rvb2x0aXBCdXR0b24uanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJnZXRJbml0aWFsU3RhdGUiLCJob3ZlciIsIm9uTW91c2VPdmVyIiwic2V0U3RhdGUiLCJvbk1vdXNlT3V0IiwicmVuZGVyIiwiVG9vbHRpcCIsInNkayIsImdldENvbXBvbmVudCIsInRpcCIsInN0YXRlIiwicHJvcHMiLCJoZWxwVGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7O2VBcUJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLGVBRGU7QUFHNUJDLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSEMsTUFBQUEsS0FBSyxFQUFFO0FBREosS0FBUDtBQUdILEdBUDJCO0FBUzVCQyxFQUFBQSxXQUFXLEVBQUUsWUFBVztBQUNwQixTQUFLQyxRQUFMLENBQWM7QUFDVkYsTUFBQUEsS0FBSyxFQUFFO0FBREcsS0FBZDtBQUdILEdBYjJCO0FBZTVCRyxFQUFBQSxVQUFVLEVBQUUsWUFBVztBQUNuQixTQUFLRCxRQUFMLENBQWM7QUFDVkYsTUFBQUEsS0FBSyxFQUFFO0FBREcsS0FBZDtBQUdILEdBbkIyQjtBQXFCNUJJLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsVUFBTUMsT0FBTyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQWhCO0FBQ0EsVUFBTUMsR0FBRyxHQUFHLEtBQUtDLEtBQUwsQ0FBV1QsS0FBWCxnQkFBbUIsNkJBQUMsT0FBRDtBQUMzQixNQUFBLFNBQVMsRUFBQyw0QkFEaUI7QUFFM0IsTUFBQSxnQkFBZ0IsRUFBQywyQkFGVTtBQUczQixNQUFBLEtBQUssRUFBRSxLQUFLVSxLQUFMLENBQVdDO0FBSFMsTUFBbkIsZ0JBSVAseUNBSkw7QUFLQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLGtCQUFmO0FBQWtDLE1BQUEsV0FBVyxFQUFFLEtBQUtWLFdBQXBEO0FBQWlFLE1BQUEsVUFBVSxFQUFFLEtBQUtFO0FBQWxGLFlBRU1LLEdBRk4sQ0FESjtBQU1IO0FBbEMyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkLlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnVG9vbHRpcEJ1dHRvbicsXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaG92ZXI6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaG92ZXI6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlT3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBUb29sdGlwID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlRvb2x0aXBcIik7XG4gICAgICAgIGNvbnN0IHRpcCA9IHRoaXMuc3RhdGUuaG92ZXIgPyA8VG9vbHRpcFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfVG9vbHRpcEJ1dHRvbl9jb250YWluZXJcIlxuICAgICAgICAgICAgdG9vbHRpcENsYXNzTmFtZT1cIm14X1Rvb2x0aXBCdXR0b25faGVscFRleHRcIlxuICAgICAgICAgICAgbGFiZWw9e3RoaXMucHJvcHMuaGVscFRleHR9XG4gICAgICAgIC8+IDogPGRpdiAvPjtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVG9vbHRpcEJ1dHRvblwiIG9uTW91c2VPdmVyPXt0aGlzLm9uTW91c2VPdmVyfSBvbk1vdXNlT3V0PXt0aGlzLm9uTW91c2VPdXR9ID5cbiAgICAgICAgICAgICAgICA/XG4gICAgICAgICAgICAgICAgeyB0aXAgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19