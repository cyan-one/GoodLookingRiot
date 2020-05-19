"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2019 Vector Creations Ltd

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
class VerificationComplete extends _react.default.Component {
  render() {
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("Verified!")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You've successfully verified this user.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Secure messages with this user are end-to-end encrypted and not able to be " + "read by third parties.")), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      onPrimaryButtonClick: this.props.onDone,
      primaryButton: (0, _languageHandler._t)("Got It"),
      hasCancel: false
    }));
  }

}

exports.default = VerificationComplete;
(0, _defineProperty2.default)(VerificationComplete, "propTypes", {
  onDone: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3ZlcmlmaWNhdGlvbi9WZXJpZmljYXRpb25Db21wbGV0ZS5qcyJdLCJuYW1lcyI6WyJWZXJpZmljYXRpb25Db21wbGV0ZSIsIlJlYWN0IiwiQ29tcG9uZW50IiwicmVuZGVyIiwiRGlhbG9nQnV0dG9ucyIsInNkayIsImdldENvbXBvbmVudCIsInByb3BzIiwib25Eb25lIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7QUFxQmUsTUFBTUEsb0JBQU4sU0FBbUNDLGVBQU1DLFNBQXpDLENBQW1EO0FBSzlEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxhQUFhLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw4QkFBakIsQ0FBdEI7QUFDQSx3QkFBTyx1REFDSCx5Q0FBSyx5QkFBRyxXQUFILENBQUwsQ0FERyxlQUVILHdDQUFJLHlCQUFHLHlDQUFILENBQUosQ0FGRyxlQUdILHdDQUFJLHlCQUNBLGdGQUNBLHdCQUZBLENBQUosQ0FIRyxlQU9ILDZCQUFDLGFBQUQ7QUFBZSxNQUFBLG9CQUFvQixFQUFFLEtBQUtDLEtBQUwsQ0FBV0MsTUFBaEQ7QUFDSSxNQUFBLGFBQWEsRUFBRSx5QkFBRyxRQUFILENBRG5CO0FBRUksTUFBQSxTQUFTLEVBQUU7QUFGZixNQVBHLENBQVA7QUFZSDs7QUFuQjZEOzs7OEJBQTdDUixvQixlQUNFO0FBQ2ZRLEVBQUFBLE1BQU0sRUFBRUMsbUJBQVVDLElBQVYsQ0FBZUM7QUFEUixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJpZmljYXRpb25Db21wbGV0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25Eb25lOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8aDI+e190KFwiVmVyaWZpZWQhXCIpfTwvaDI+XG4gICAgICAgICAgICA8cD57X3QoXCJZb3UndmUgc3VjY2Vzc2Z1bGx5IHZlcmlmaWVkIHRoaXMgdXNlci5cIil9PC9wPlxuICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgIFwiU2VjdXJlIG1lc3NhZ2VzIHdpdGggdGhpcyB1c2VyIGFyZSBlbmQtdG8tZW5kIGVuY3J5cHRlZCBhbmQgbm90IGFibGUgdG8gYmUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVhZCBieSB0aGlyZCBwYXJ0aWVzLlwiLFxuICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5wcm9wcy5vbkRvbmV9XG4gICAgICAgICAgICAgICAgcHJpbWFyeUJ1dHRvbj17X3QoXCJHb3QgSXRcIil9XG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG4iXX0=