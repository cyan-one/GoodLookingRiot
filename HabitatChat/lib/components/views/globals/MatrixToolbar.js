"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

var _Notifier = _interopRequireDefault(require("../../../Notifier"));

var _AccessibleButton = _interopRequireDefault(require("../../../components/views/elements/AccessibleButton"));

/*
Copyright 2015, 2016 OpenMarket Ltd

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
  displayName: 'MatrixToolbar',
  hideToolbar: function () {
    _Notifier.default.setToolbarHidden(true);
  },
  onClick: function () {
    _Notifier.default.setEnabled(true);
  },
  render: function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar"
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_MatrixToolbar_warning",
      src: require("../../../../res/img/warning.svg"),
      width: "24",
      height: "23",
      alt: ""
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, (0, _languageHandler._t)('You are not receiving desktop notifications'), " ", /*#__PURE__*/_react.default.createElement("a", {
      className: "mx_MatrixToolbar_link",
      onClick: this.onClick
    }, " ", (0, _languageHandler._t)('Enable them now'))), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_MatrixToolbar_close",
      onClick: this.hideToolbar
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18",
      alt: (0, _languageHandler._t)('Close')
    })));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvTWF0cml4VG9vbGJhci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsImhpZGVUb29sYmFyIiwiTm90aWZpZXIiLCJzZXRUb29sYmFySGlkZGVuIiwib25DbGljayIsInNldEVuYWJsZWQiLCJyZW5kZXIiLCJyZXF1aXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFzQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsZUFEZTtBQUc1QkMsRUFBQUEsV0FBVyxFQUFFLFlBQVc7QUFDcEJDLHNCQUFTQyxnQkFBVCxDQUEwQixJQUExQjtBQUNILEdBTDJCO0FBTzVCQyxFQUFBQSxPQUFPLEVBQUUsWUFBVztBQUNoQkYsc0JBQVNHLFVBQVQsQ0FBb0IsSUFBcEI7QUFDSCxHQVQyQjtBQVc1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZix3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQywwQkFBZjtBQUEwQyxNQUFBLEdBQUcsRUFBRUMsT0FBTyxDQUFDLGlDQUFELENBQXREO0FBQTJGLE1BQUEsS0FBSyxFQUFDLElBQWpHO0FBQXNHLE1BQUEsTUFBTSxFQUFDLElBQTdHO0FBQWtILE1BQUEsR0FBRyxFQUFDO0FBQXRILE1BREosZUFFSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDSyx5QkFBRyw2Q0FBSCxDQURMLG9CQUN5RDtBQUFHLE1BQUEsU0FBUyxFQUFDLHVCQUFiO0FBQXFDLE1BQUEsT0FBTyxFQUFHLEtBQUtIO0FBQXBELFlBQWlFLHlCQUFHLGlCQUFILENBQWpFLENBRHpELENBRkosZUFLSSw2QkFBQyx5QkFBRDtBQUFrQixNQUFBLFNBQVMsRUFBQyx3QkFBNUI7QUFBcUQsTUFBQSxPQUFPLEVBQUcsS0FBS0g7QUFBcEUsb0JBQW1GO0FBQUssTUFBQSxHQUFHLEVBQUVNLE9BQU8sQ0FBQyxnQ0FBRCxDQUFqQjtBQUFxRCxNQUFBLEtBQUssRUFBQyxJQUEzRDtBQUFnRSxNQUFBLE1BQU0sRUFBQyxJQUF2RTtBQUE0RSxNQUFBLEdBQUcsRUFBRSx5QkFBRyxPQUFIO0FBQWpGLE1BQW5GLENBTEosQ0FESjtBQVNIO0FBckIyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgTm90aWZpZXIgZnJvbSAnLi4vLi4vLi4vTm90aWZpZXInO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vLi4vLi4vY29tcG9uZW50cy92aWV3cy9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdNYXRyaXhUb29sYmFyJyxcblxuICAgIGhpZGVUb29sYmFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgTm90aWZpZXIuc2V0VG9vbGJhckhpZGRlbih0cnVlKTtcbiAgICB9LFxuXG4gICAgb25DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIE5vdGlmaWVyLnNldEVuYWJsZWQodHJ1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJcIj5cbiAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfd2FybmluZ1wiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvd2FybmluZy5zdmdcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyM1wiIGFsdD1cIlwiIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICB7IF90KCdZb3UgYXJlIG5vdCByZWNlaXZpbmcgZGVza3RvcCBub3RpZmljYXRpb25zJykgfSA8YSBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2xpbmtcIiBvbkNsaWNrPXsgdGhpcy5vbkNsaWNrIH0+IHsgX3QoJ0VuYWJsZSB0aGVtIG5vdycpIH08L2E+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9jbG9zZVwiIG9uQ2xpY2s9eyB0aGlzLmhpZGVUb29sYmFyIH0gPjxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwuc3ZnXCIpfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBhbHQ9e190KCdDbG9zZScpfSAvPjwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==