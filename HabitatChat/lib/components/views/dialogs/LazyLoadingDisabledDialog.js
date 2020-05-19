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
  const description1 = (0, _languageHandler._t)("You've previously used Riot on %(host)s with lazy loading of members enabled. " + "In this version lazy loading is disabled. " + "As the local cache is not compatible between these two settings, " + "Riot needs to resync your account.", {
    host: props.host
  });
  const description2 = (0, _languageHandler._t)("If the other version of Riot is still open in another tab, " + "please close it as using Riot on the same host with both " + "lazy loading enabled and disabled simultaneously will cause issues.");
  return /*#__PURE__*/_react.default.createElement(_QuestionDialog.default, {
    hasCancelButton: false,
    title: (0, _languageHandler._t)("Incompatible local cache"),
    description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, description1), /*#__PURE__*/_react.default.createElement("p", null, description2)),
    button: (0, _languageHandler._t)("Clear cache and resync"),
    onFinished: props.onFinished
  });
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvTGF6eUxvYWRpbmdEaXNhYmxlZERpYWxvZy5qcyJdLCJuYW1lcyI6WyJwcm9wcyIsImRlc2NyaXB0aW9uMSIsImhvc3QiLCJkZXNjcmlwdGlvbjIiLCJvbkZpbmlzaGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFvQmdCQSxLQUFELElBQVc7QUFDdEIsUUFBTUMsWUFBWSxHQUNkLHlCQUFHLG1GQUNDLDRDQURELEdBRUMsbUVBRkQsR0FHQyxvQ0FISixFQUlJO0FBQUNDLElBQUFBLElBQUksRUFBRUYsS0FBSyxDQUFDRTtBQUFiLEdBSkosQ0FESjtBQU1BLFFBQU1DLFlBQVksR0FBRyx5QkFBRyxnRUFDaEIsMkRBRGdCLEdBRWhCLHFFQUZhLENBQXJCO0FBSUEsc0JBQVEsNkJBQUMsdUJBQUQ7QUFDSixJQUFBLGVBQWUsRUFBRSxLQURiO0FBRUosSUFBQSxLQUFLLEVBQUUseUJBQUcsMEJBQUgsQ0FGSDtBQUdKLElBQUEsV0FBVyxlQUFFLHVEQUFLLHdDQUFJRixZQUFKLENBQUwsZUFBMEIsd0NBQUlFLFlBQUosQ0FBMUIsQ0FIVDtBQUlKLElBQUEsTUFBTSxFQUFFLHlCQUFHLHdCQUFILENBSko7QUFLSixJQUFBLFVBQVUsRUFBRUgsS0FBSyxDQUFDSTtBQUxkLElBQVI7QUFPSCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBRdWVzdGlvbkRpYWxvZyBmcm9tICcuL1F1ZXN0aW9uRGlhbG9nJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24xID1cbiAgICAgICAgX3QoXCJZb3UndmUgcHJldmlvdXNseSB1c2VkIFJpb3Qgb24gJShob3N0KXMgd2l0aCBsYXp5IGxvYWRpbmcgb2YgbWVtYmVycyBlbmFibGVkLiBcIiArXG4gICAgICAgICAgICBcIkluIHRoaXMgdmVyc2lvbiBsYXp5IGxvYWRpbmcgaXMgZGlzYWJsZWQuIFwiICtcbiAgICAgICAgICAgIFwiQXMgdGhlIGxvY2FsIGNhY2hlIGlzIG5vdCBjb21wYXRpYmxlIGJldHdlZW4gdGhlc2UgdHdvIHNldHRpbmdzLCBcIiArXG4gICAgICAgICAgICBcIlJpb3QgbmVlZHMgdG8gcmVzeW5jIHlvdXIgYWNjb3VudC5cIixcbiAgICAgICAgICAgIHtob3N0OiBwcm9wcy5ob3N0fSk7XG4gICAgY29uc3QgZGVzY3JpcHRpb24yID0gX3QoXCJJZiB0aGUgb3RoZXIgdmVyc2lvbiBvZiBSaW90IGlzIHN0aWxsIG9wZW4gaW4gYW5vdGhlciB0YWIsIFwiICtcbiAgICAgICAgICAgIFwicGxlYXNlIGNsb3NlIGl0IGFzIHVzaW5nIFJpb3Qgb24gdGhlIHNhbWUgaG9zdCB3aXRoIGJvdGggXCIgK1xuICAgICAgICAgICAgXCJsYXp5IGxvYWRpbmcgZW5hYmxlZCBhbmQgZGlzYWJsZWQgc2ltdWx0YW5lb3VzbHkgd2lsbCBjYXVzZSBpc3N1ZXMuXCIpO1xuXG4gICAgcmV0dXJuICg8UXVlc3Rpb25EaWFsb2dcbiAgICAgICAgaGFzQ2FuY2VsQnV0dG9uPXtmYWxzZX1cbiAgICAgICAgdGl0bGU9e190KFwiSW5jb21wYXRpYmxlIGxvY2FsIGNhY2hlXCIpfVxuICAgICAgICBkZXNjcmlwdGlvbj17PGRpdj48cD57ZGVzY3JpcHRpb24xfTwvcD48cD57ZGVzY3JpcHRpb24yfTwvcD48L2Rpdj59XG4gICAgICAgIGJ1dHRvbj17X3QoXCJDbGVhciBjYWNoZSBhbmQgcmVzeW5jXCIpfVxuICAgICAgICBvbkZpbmlzaGVkPXtwcm9wcy5vbkZpbmlzaGVkfVxuICAgIC8+KTtcbn07XG4iXX0=