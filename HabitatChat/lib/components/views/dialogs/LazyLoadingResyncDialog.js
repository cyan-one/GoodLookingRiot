"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _QuestionDialog = _interopRequireDefault(require("./QuestionDialog"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2018 New Vector Ltd

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
var _default = props => {
  const description = (0, _languageHandler._t)("Riot now uses 3-5x less memory, by only loading information about other users" + " when needed. Please wait whilst we resynchronise with the server!");
  return /*#__PURE__*/_react.default.createElement(_QuestionDialog.default, {
    hasCancelButton: false,
    title: (0, _languageHandler._t)("Updating Riot"),
    description: /*#__PURE__*/_react.default.createElement("div", null, description),
    button: (0, _languageHandler._t)("OK"),
    onFinished: props.onFinished
  });
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvTGF6eUxvYWRpbmdSZXN5bmNEaWFsb2cuanMiXSwibmFtZXMiOlsicHJvcHMiLCJkZXNjcmlwdGlvbiIsIm9uRmluaXNoZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztlQW9CZ0JBLEtBQUQsSUFBVztBQUN0QixRQUFNQyxXQUFXLEdBQ2IseUJBQUcsa0ZBQ0Qsb0VBREYsQ0FESjtBQUlBLHNCQUFRLDZCQUFDLHVCQUFEO0FBQ0osSUFBQSxlQUFlLEVBQUUsS0FEYjtBQUVKLElBQUEsS0FBSyxFQUFFLHlCQUFHLGVBQUgsQ0FGSDtBQUdKLElBQUEsV0FBVyxlQUFFLDBDQUFNQSxXQUFOLENBSFQ7QUFJSixJQUFBLE1BQU0sRUFBRSx5QkFBRyxJQUFILENBSko7QUFLSixJQUFBLFVBQVUsRUFBRUQsS0FBSyxDQUFDRTtBQUxkLElBQVI7QUFPSCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBRdWVzdGlvbkRpYWxvZyBmcm9tICcuL1F1ZXN0aW9uRGlhbG9nJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPVxuICAgICAgICBfdChcIlJpb3Qgbm93IHVzZXMgMy01eCBsZXNzIG1lbW9yeSwgYnkgb25seSBsb2FkaW5nIGluZm9ybWF0aW9uIGFib3V0IG90aGVyIHVzZXJzXCJcbiAgICAgICAgKyBcIiB3aGVuIG5lZWRlZC4gUGxlYXNlIHdhaXQgd2hpbHN0IHdlIHJlc3luY2hyb25pc2Ugd2l0aCB0aGUgc2VydmVyIVwiKTtcblxuICAgIHJldHVybiAoPFF1ZXN0aW9uRGlhbG9nXG4gICAgICAgIGhhc0NhbmNlbEJ1dHRvbj17ZmFsc2V9XG4gICAgICAgIHRpdGxlPXtfdChcIlVwZGF0aW5nIFJpb3RcIil9XG4gICAgICAgIGRlc2NyaXB0aW9uPXs8ZGl2PntkZXNjcmlwdGlvbn08L2Rpdj59XG4gICAgICAgIGJ1dHRvbj17X3QoXCJPS1wiKX1cbiAgICAgICAgb25GaW5pc2hlZD17cHJvcHMub25GaW5pc2hlZH1cbiAgICAvPik7XG59O1xuIl19