"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
  displayName: 'CompatibilityPage',
  propTypes: {
    onAccept: _propTypes.default.func
  },
  getDefaultProps: function () {
    return {
      onAccept: function () {} // NOP

    };
  },
  onAccept: function () {
    this.props.onAccept();
  },
  render: function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CompatibilityPage"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CompatibilityPage_box"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Sorry, your browser is <b>not</b> able to run Riot.", {}, {
      'b': sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
    }), " "), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Riot uses many advanced browser features, some of which are not available " + "or experimental in your current browser.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('Please install <chromeLink>Chrome</chromeLink>, <firefoxLink>Firefox</firefoxLink>, ' + 'or <safariLink>Safari</safariLink> for the best experience.', {}, {
      'chromeLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "https://www.google.com/chrome"
      }, sub),
      'firefoxLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "https://firefox.com"
      }, sub),
      'safariLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "https://apple.com/safari"
      }, sub)
    })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("With your current browser, the look and feel of the application may be " + "completely incorrect, and some or all features may not function. " + "If you want to try it anyway you can continue, but you are on your own in terms " + "of any issues you may encounter!")), /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onAccept
    }, (0, _languageHandler._t)("I understand the risks and wish to continue"))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvQ29tcGF0aWJpbGl0eVBhZ2UuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkFjY2VwdCIsIlByb3BUeXBlcyIsImZ1bmMiLCJnZXREZWZhdWx0UHJvcHMiLCJwcm9wcyIsInJlbmRlciIsInN1YiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUF1QmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsbUJBRGU7QUFFNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxRQUFRLEVBQUVDLG1CQUFVQztBQURiLEdBRmlCO0FBTTVCQyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hILE1BQUFBLFFBQVEsRUFBRSxZQUFXLENBQUUsQ0FEcEIsQ0FDc0I7O0FBRHRCLEtBQVA7QUFHSCxHQVYyQjtBQVk1QkEsRUFBQUEsUUFBUSxFQUFFLFlBQVc7QUFDakIsU0FBS0ksS0FBTCxDQUFXSixRQUFYO0FBQ0gsR0FkMkI7QUFnQjVCSyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLHdCQUNBO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksd0NBQUsseUJBQUcscURBQUgsRUFBMEQsRUFBMUQsRUFBOEQ7QUFBRSxXQUFNQyxHQUFELGlCQUFTLHdDQUFJQSxHQUFKO0FBQWhCLEtBQTlELENBQUwsTUFESixlQUVJLHdDQUNFLHlCQUNFLCtFQUNBLDBDQUZGLENBREYsQ0FGSixlQVFJLHdDQUNFLHlCQUNFLHlGQUNBLDZEQUZGLEVBR0UsRUFIRixFQUlFO0FBQ0ksb0JBQWVBLEdBQUQsaUJBQVM7QUFBRyxRQUFBLElBQUksRUFBQztBQUFSLFNBQXlDQSxHQUF6QyxDQUQzQjtBQUVJLHFCQUFnQkEsR0FBRCxpQkFBUztBQUFHLFFBQUEsSUFBSSxFQUFDO0FBQVIsU0FBK0JBLEdBQS9CLENBRjVCO0FBR0ksb0JBQWVBLEdBQUQsaUJBQVM7QUFBRyxRQUFBLElBQUksRUFBQztBQUFSLFNBQW9DQSxHQUFwQztBQUgzQixLQUpGLENBREYsQ0FSSixlQW9CSSx3Q0FDRSx5QkFDRSw0RUFDQSxtRUFEQSxHQUVBLGtGQUZBLEdBR0Esa0NBSkYsQ0FERixDQXBCSixlQTRCSTtBQUFRLE1BQUEsT0FBTyxFQUFFLEtBQUtOO0FBQXRCLE9BQ00seUJBQUcsNkNBQUgsQ0FETixDQTVCSixDQURKLENBREE7QUFvQ0g7QUFyRDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQ29tcGF0aWJpbGl0eVBhZ2UnLFxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBvbkFjY2VwdDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvbkFjY2VwdDogZnVuY3Rpb24oKSB7fSwgLy8gTk9QXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uQWNjZXB0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkFjY2VwdCgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBhdGliaWxpdHlQYWdlXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBhdGliaWxpdHlQYWdlX2JveFwiPlxuICAgICAgICAgICAgICAgIDxwPnsgX3QoXCJTb3JyeSwgeW91ciBicm93c2VyIGlzIDxiPm5vdDwvYj4gYWJsZSB0byBydW4gUmlvdC5cIiwge30sIHsgJ2InOiAoc3ViKSA9PiA8Yj57c3VifTwvYj4gfSkgfSA8L3A+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgeyBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJSaW90IHVzZXMgbWFueSBhZHZhbmNlZCBicm93c2VyIGZlYXR1cmVzLCBzb21lIG9mIHdoaWNoIGFyZSBub3QgYXZhaWxhYmxlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJvciBleHBlcmltZW50YWwgaW4geW91ciBjdXJyZW50IGJyb3dzZXIuXCIsXG4gICAgICAgICAgICAgICAgKSB9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgIHsgX3QoXG4gICAgICAgICAgICAgICAgICAgICdQbGVhc2UgaW5zdGFsbCA8Y2hyb21lTGluaz5DaHJvbWU8L2Nocm9tZUxpbms+LCA8ZmlyZWZveExpbms+RmlyZWZveDwvZmlyZWZveExpbms+LCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ29yIDxzYWZhcmlMaW5rPlNhZmFyaTwvc2FmYXJpTGluaz4gZm9yIHRoZSBiZXN0IGV4cGVyaWVuY2UuJyxcbiAgICAgICAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjaHJvbWVMaW5rJzogKHN1YikgPT4gPGEgaHJlZj1cImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vY2hyb21lXCI+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ZpcmVmb3hMaW5rJzogKHN1YikgPT4gPGEgaHJlZj1cImh0dHBzOi8vZmlyZWZveC5jb21cIj57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2FmYXJpTGluayc6IChzdWIpID0+IDxhIGhyZWY9XCJodHRwczovL2FwcGxlLmNvbS9zYWZhcmlcIj57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgeyBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJXaXRoIHlvdXIgY3VycmVudCBicm93c2VyLCB0aGUgbG9vayBhbmQgZmVlbCBvZiB0aGUgYXBwbGljYXRpb24gbWF5IGJlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJjb21wbGV0ZWx5IGluY29ycmVjdCwgYW5kIHNvbWUgb3IgYWxsIGZlYXR1cmVzIG1heSBub3QgZnVuY3Rpb24uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJJZiB5b3Ugd2FudCB0byB0cnkgaXQgYW55d2F5IHlvdSBjYW4gY29udGludWUsIGJ1dCB5b3UgYXJlIG9uIHlvdXIgb3duIGluIHRlcm1zIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJvZiBhbnkgaXNzdWVzIHlvdSBtYXkgZW5jb3VudGVyIVwiLFxuICAgICAgICAgICAgICAgICkgfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMub25BY2NlcHR9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KFwiSSB1bmRlcnN0YW5kIHRoZSByaXNrcyBhbmQgd2lzaCB0byBjb250aW51ZVwiKSB9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19