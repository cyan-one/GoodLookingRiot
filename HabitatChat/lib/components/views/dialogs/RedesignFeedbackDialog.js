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
  const existingIssuesUrl = "https://github.com/vector-im/riot-web/issues" + "?q=is%3Aopen+is%3Aissue+sort%3Areactions-%2B1-desc";
  const newIssueUrl = "https://github.com/vector-im/riot-web/issues/new";
  const description1 = (0, _languageHandler._t)("If you run into any bugs or have feedback you'd like to share, " + "please let us know on GitHub.");
  const description2 = (0, _languageHandler._t)("To help avoid duplicate issues, " + "please <existingIssuesLink>view existing issues</existingIssuesLink> " + "first (and add a +1) or <newIssueLink>create a new issue</newIssueLink> " + "if you can't find it.", {}, {
    existingIssuesLink: sub => {
      return /*#__PURE__*/_react.default.createElement("a", {
        target: "_blank",
        rel: "noreferrer noopener",
        href: existingIssuesUrl
      }, sub);
    },
    newIssueLink: sub => {
      return /*#__PURE__*/_react.default.createElement("a", {
        target: "_blank",
        rel: "noreferrer noopener",
        href: newIssueUrl
      }, sub);
    }
  });
  return /*#__PURE__*/_react.default.createElement(_QuestionDialog.default, {
    hasCancelButton: false,
    title: (0, _languageHandler._t)("Report bugs & give feedback"),
    description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, description1), /*#__PURE__*/_react.default.createElement("p", null, description2)),
    button: (0, _languageHandler._t)("Go back"),
    onFinished: props.onFinished
  });
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvUmVkZXNpZ25GZWVkYmFja0RpYWxvZy5qcyJdLCJuYW1lcyI6WyJwcm9wcyIsImV4aXN0aW5nSXNzdWVzVXJsIiwibmV3SXNzdWVVcmwiLCJkZXNjcmlwdGlvbjEiLCJkZXNjcmlwdGlvbjIiLCJleGlzdGluZ0lzc3Vlc0xpbmsiLCJzdWIiLCJuZXdJc3N1ZUxpbmsiLCJvbkZpbmlzaGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFvQmdCQSxLQUFELElBQVc7QUFDdEIsUUFBTUMsaUJBQWlCLEdBQUcsaURBQ3RCLG9EQURKO0FBRUEsUUFBTUMsV0FBVyxHQUFHLGtEQUFwQjtBQUVBLFFBQU1DLFlBQVksR0FDZCx5QkFBRyxvRUFDQSwrQkFESCxDQURKO0FBR0EsUUFBTUMsWUFBWSxHQUFHLHlCQUFHLHFDQUNwQix1RUFEb0IsR0FFcEIsMEVBRm9CLEdBR3BCLHVCQUhpQixFQUdRLEVBSFIsRUFJakI7QUFDSUMsSUFBQUEsa0JBQWtCLEVBQUdDLEdBQUQsSUFBUztBQUN6QiwwQkFBTztBQUFHLFFBQUEsTUFBTSxFQUFDLFFBQVY7QUFBbUIsUUFBQSxHQUFHLEVBQUMscUJBQXZCO0FBQTZDLFFBQUEsSUFBSSxFQUFFTDtBQUFuRCxTQUF3RUssR0FBeEUsQ0FBUDtBQUNILEtBSEw7QUFJSUMsSUFBQUEsWUFBWSxFQUFHRCxHQUFELElBQVM7QUFDbkIsMEJBQU87QUFBRyxRQUFBLE1BQU0sRUFBQyxRQUFWO0FBQW1CLFFBQUEsR0FBRyxFQUFDLHFCQUF2QjtBQUE2QyxRQUFBLElBQUksRUFBRUo7QUFBbkQsU0FBa0VJLEdBQWxFLENBQVA7QUFDSDtBQU5MLEdBSmlCLENBQXJCO0FBYUEsc0JBQVEsNkJBQUMsdUJBQUQ7QUFDSixJQUFBLGVBQWUsRUFBRSxLQURiO0FBRUosSUFBQSxLQUFLLEVBQUUseUJBQUcsNkJBQUgsQ0FGSDtBQUdKLElBQUEsV0FBVyxlQUFFLHVEQUFLLHdDQUFJSCxZQUFKLENBQUwsZUFBMEIsd0NBQUlDLFlBQUosQ0FBMUIsQ0FIVDtBQUlKLElBQUEsTUFBTSxFQUFFLHlCQUFHLFNBQUgsQ0FKSjtBQUtKLElBQUEsVUFBVSxFQUFFSixLQUFLLENBQUNRO0FBTGQsSUFBUjtBQU9ILEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFF1ZXN0aW9uRGlhbG9nIGZyb20gJy4vUXVlc3Rpb25EaWFsb2cnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCAocHJvcHMpID0+IHtcbiAgICBjb25zdCBleGlzdGluZ0lzc3Vlc1VybCA9IFwiaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXNcIiArXG4gICAgICAgIFwiP3E9aXMlM0FvcGVuK2lzJTNBaXNzdWUrc29ydCUzQXJlYWN0aW9ucy0lMkIxLWRlc2NcIjtcbiAgICBjb25zdCBuZXdJc3N1ZVVybCA9IFwiaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvbmV3XCI7XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbjEgPVxuICAgICAgICBfdChcIklmIHlvdSBydW4gaW50byBhbnkgYnVncyBvciBoYXZlIGZlZWRiYWNrIHlvdSdkIGxpa2UgdG8gc2hhcmUsIFwiICtcbiAgICAgICAgICAgXCJwbGVhc2UgbGV0IHVzIGtub3cgb24gR2l0SHViLlwiKTtcbiAgICBjb25zdCBkZXNjcmlwdGlvbjIgPSBfdChcIlRvIGhlbHAgYXZvaWQgZHVwbGljYXRlIGlzc3VlcywgXCIgK1xuICAgICAgICBcInBsZWFzZSA8ZXhpc3RpbmdJc3N1ZXNMaW5rPnZpZXcgZXhpc3RpbmcgaXNzdWVzPC9leGlzdGluZ0lzc3Vlc0xpbms+IFwiICtcbiAgICAgICAgXCJmaXJzdCAoYW5kIGFkZCBhICsxKSBvciA8bmV3SXNzdWVMaW5rPmNyZWF0ZSBhIG5ldyBpc3N1ZTwvbmV3SXNzdWVMaW5rPiBcIiArXG4gICAgICAgIFwiaWYgeW91IGNhbid0IGZpbmQgaXQuXCIsIHt9LFxuICAgICAgICB7XG4gICAgICAgICAgICBleGlzdGluZ0lzc3Vlc0xpbms6IChzdWIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIGhyZWY9e2V4aXN0aW5nSXNzdWVzVXJsfT57IHN1YiB9PC9hPjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXdJc3N1ZUxpbms6IChzdWIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIGhyZWY9e25ld0lzc3VlVXJsfT57IHN1YiB9PC9hPjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgcmV0dXJuICg8UXVlc3Rpb25EaWFsb2dcbiAgICAgICAgaGFzQ2FuY2VsQnV0dG9uPXtmYWxzZX1cbiAgICAgICAgdGl0bGU9e190KFwiUmVwb3J0IGJ1Z3MgJiBnaXZlIGZlZWRiYWNrXCIpfVxuICAgICAgICBkZXNjcmlwdGlvbj17PGRpdj48cD57ZGVzY3JpcHRpb24xfTwvcD48cD57ZGVzY3JpcHRpb24yfTwvcD48L2Rpdj59XG4gICAgICAgIGJ1dHRvbj17X3QoXCJHbyBiYWNrXCIpfVxuICAgICAgICBvbkZpbmlzaGVkPXtwcm9wcy5vbkZpbmlzaGVkfVxuICAgIC8+KTtcbn07XG4iXX0=