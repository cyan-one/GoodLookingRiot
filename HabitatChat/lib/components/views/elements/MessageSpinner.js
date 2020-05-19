"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

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
var _default = (0, _createReactClass.default)({
  displayName: 'MessageSpinner',
  render: function () {
    const w = this.props.w || 32;
    const h = this.props.h || 32;
    const imgClass = this.props.imgClassName || "";
    const msg = this.props.msg || "Loading...";
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Spinner"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Spinner_Msg"
    }, msg), "\xA0", /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/spinner.gif"),
      width: w,
      height: h,
      className: imgClass
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL01lc3NhZ2VTcGlubmVyLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicmVuZGVyIiwidyIsInByb3BzIiwiaCIsImltZ0NsYXNzIiwiaW1nQ2xhc3NOYW1lIiwibXNnIiwicmVxdWlyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O2VBbUJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLGdCQURlO0FBRzVCQyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLFVBQU1DLENBQUMsR0FBRyxLQUFLQyxLQUFMLENBQVdELENBQVgsSUFBZ0IsRUFBMUI7QUFDQSxVQUFNRSxDQUFDLEdBQUcsS0FBS0QsS0FBTCxDQUFXQyxDQUFYLElBQWdCLEVBQTFCO0FBQ0EsVUFBTUMsUUFBUSxHQUFHLEtBQUtGLEtBQUwsQ0FBV0csWUFBWCxJQUEyQixFQUE1QztBQUNBLFVBQU1DLEdBQUcsR0FBRyxLQUFLSixLQUFMLENBQVdJLEdBQVgsSUFBa0IsWUFBOUI7QUFDQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQWtDQSxHQUFsQyxDQURKLHVCQUVJO0FBQUssTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyxpQ0FBRCxDQUFqQjtBQUFzRCxNQUFBLEtBQUssRUFBRU4sQ0FBN0Q7QUFBZ0UsTUFBQSxNQUFNLEVBQUVFLENBQXhFO0FBQTJFLE1BQUEsU0FBUyxFQUFFQztBQUF0RixNQUZKLENBREo7QUFNSDtBQWQyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnTWVzc2FnZVNwaW5uZXInLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMucHJvcHMudyB8fCAzMjtcbiAgICAgICAgY29uc3QgaCA9IHRoaXMucHJvcHMuaCB8fCAzMjtcbiAgICAgICAgY29uc3QgaW1nQ2xhc3MgPSB0aGlzLnByb3BzLmltZ0NsYXNzTmFtZSB8fCBcIlwiO1xuICAgICAgICBjb25zdCBtc2cgPSB0aGlzLnByb3BzLm1zZyB8fCBcIkxvYWRpbmcuLi5cIjtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU3Bpbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU3Bpbm5lcl9Nc2dcIj57IG1zZyB9PC9kaXY+Jm5ic3A7XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3NwaW5uZXIuZ2lmXCIpfSB3aWR0aD17d30gaGVpZ2h0PXtofSBjbGFzc05hbWU9e2ltZ0NsYXNzfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19