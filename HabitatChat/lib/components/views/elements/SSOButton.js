"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _PlatformPeg = _interopRequireDefault(require("../../../PlatformPeg"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
const SSOButton = (_ref) => {
  let {
    matrixClient,
    loginType,
    fragmentAfterLogin
  } = _ref,
      props = (0, _objectWithoutProperties2.default)(_ref, ["matrixClient", "loginType", "fragmentAfterLogin"]);

  const onClick = () => {
    _PlatformPeg.default.get().startSingleSignOn(matrixClient, loginType, fragmentAfterLogin);
  };

  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, (0, _extends2.default)({}, props, {
    kind: "primary",
    onClick: onClick
  }), (0, _languageHandler._t)("Sign in with single sign-on"));
};

SSOButton.propTypes = {
  matrixClient: _propTypes.default.object.isRequired,
  // does not use context as may use a temporary client
  loginType: _propTypes.default.oneOf(["sso", "cas"]),
  // defaults to "sso" in base-apis
  fragmentAfterLogin: _propTypes.default.string
};
var _default = SSOButton;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1NTT0J1dHRvbi5qcyJdLCJuYW1lcyI6WyJTU09CdXR0b24iLCJtYXRyaXhDbGllbnQiLCJsb2dpblR5cGUiLCJmcmFnbWVudEFmdGVyTG9naW4iLCJwcm9wcyIsIm9uQ2xpY2siLCJQbGF0Zm9ybVBlZyIsImdldCIsInN0YXJ0U2luZ2xlU2lnbk9uIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsIm9uZU9mIiwic3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBLE1BQU1BLFNBQVMsR0FBRyxVQUE2RDtBQUFBLE1BQTVEO0FBQUNDLElBQUFBLFlBQUQ7QUFBZUMsSUFBQUEsU0FBZjtBQUEwQkMsSUFBQUE7QUFBMUIsR0FBNEQ7QUFBQSxNQUFYQyxLQUFXOztBQUMzRSxRQUFNQyxPQUFPLEdBQUcsTUFBTTtBQUNsQkMseUJBQVlDLEdBQVosR0FBa0JDLGlCQUFsQixDQUFvQ1AsWUFBcEMsRUFBa0RDLFNBQWxELEVBQTZEQyxrQkFBN0Q7QUFDSCxHQUZEOztBQUlBLHNCQUNJLDZCQUFDLHlCQUFELDZCQUFzQkMsS0FBdEI7QUFBNkIsSUFBQSxJQUFJLEVBQUMsU0FBbEM7QUFBNEMsSUFBQSxPQUFPLEVBQUVDO0FBQXJELE1BQ0sseUJBQUcsNkJBQUgsQ0FETCxDQURKO0FBS0gsQ0FWRDs7QUFZQUwsU0FBUyxDQUFDUyxTQUFWLEdBQXNCO0FBQ2xCUixFQUFBQSxZQUFZLEVBQUVTLG1CQUFVQyxNQUFWLENBQWlCQyxVQURiO0FBQ3lCO0FBQzNDVixFQUFBQSxTQUFTLEVBQUVRLG1CQUFVRyxLQUFWLENBQWdCLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBaEIsQ0FGTztBQUUwQjtBQUM1Q1YsRUFBQUEsa0JBQWtCLEVBQUVPLG1CQUFVSTtBQUhaLENBQXRCO2VBTWVkLFMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0IFBsYXRmb3JtUGVnIGZyb20gXCIuLi8uLi8uLi9QbGF0Zm9ybVBlZ1wiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4vQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuXG5jb25zdCBTU09CdXR0b24gPSAoe21hdHJpeENsaWVudCwgbG9naW5UeXBlLCBmcmFnbWVudEFmdGVyTG9naW4sIC4uLnByb3BzfSkgPT4ge1xuICAgIGNvbnN0IG9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLnN0YXJ0U2luZ2xlU2lnbk9uKG1hdHJpeENsaWVudCwgbG9naW5UeXBlLCBmcmFnbWVudEFmdGVyTG9naW4pO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiB7Li4ucHJvcHN9IGtpbmQ9XCJwcmltYXJ5XCIgb25DbGljaz17b25DbGlja30+XG4gICAgICAgICAgICB7X3QoXCJTaWduIGluIHdpdGggc2luZ2xlIHNpZ24tb25cIil9XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICApO1xufTtcblxuU1NPQnV0dG9uLnByb3BUeXBlcyA9IHtcbiAgICBtYXRyaXhDbGllbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCwgLy8gZG9lcyBub3QgdXNlIGNvbnRleHQgYXMgbWF5IHVzZSBhIHRlbXBvcmFyeSBjbGllbnRcbiAgICBsb2dpblR5cGU6IFByb3BUeXBlcy5vbmVPZihbXCJzc29cIiwgXCJjYXNcIl0pLCAvLyBkZWZhdWx0cyB0byBcInNzb1wiIGluIGJhc2UtYXBpc1xuICAgIGZyYWdtZW50QWZ0ZXJMb2dpbjogUHJvcFR5cGVzLnN0cmluZyxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNTT0J1dHRvbjtcbiJdfQ==