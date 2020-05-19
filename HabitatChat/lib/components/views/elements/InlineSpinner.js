"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

/*
Copyright 2017 New Vector Ltd.

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
  displayName: 'InlineSpinner',
  render: function () {
    const w = this.props.w || 16;
    const h = this.props.h || 16;
    const imgClass = this.props.imgClassName || "";
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InlineSpinner"
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/spinner.gif"),
      width: w,
      height: h,
      className: imgClass
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0lubGluZVNwaW5uZXIuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJyZW5kZXIiLCJ3IiwicHJvcHMiLCJoIiwiaW1nQ2xhc3MiLCJpbWdDbGFzc05hbWUiLCJyZXF1aXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBakJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFtQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsZUFEZTtBQUc1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxDQUFDLEdBQUcsS0FBS0MsS0FBTCxDQUFXRCxDQUFYLElBQWdCLEVBQTFCO0FBQ0EsVUFBTUUsQ0FBQyxHQUFHLEtBQUtELEtBQUwsQ0FBV0MsQ0FBWCxJQUFnQixFQUExQjtBQUNBLFVBQU1DLFFBQVEsR0FBRyxLQUFLRixLQUFMLENBQVdHLFlBQVgsSUFBMkIsRUFBNUM7QUFFQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLEdBQUcsRUFBRUMsT0FBTyxDQUFDLGlDQUFELENBQWpCO0FBQXNELE1BQUEsS0FBSyxFQUFFTCxDQUE3RDtBQUFnRSxNQUFBLE1BQU0sRUFBRUUsQ0FBeEU7QUFBMkUsTUFBQSxTQUFTLEVBQUVDO0FBQXRGLE1BREosQ0FESjtBQUtIO0FBYjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdJbmxpbmVTcGlubmVyJyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLnByb3BzLncgfHwgMTY7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLnByb3BzLmggfHwgMTY7XG4gICAgICAgIGNvbnN0IGltZ0NsYXNzID0gdGhpcy5wcm9wcy5pbWdDbGFzc05hbWUgfHwgXCJcIjtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbmxpbmVTcGlubmVyXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3NwaW5uZXIuZ2lmXCIpfSB3aWR0aD17d30gaGVpZ2h0PXtofSBjbGFzc05hbWU9e2ltZ0NsYXNzfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19