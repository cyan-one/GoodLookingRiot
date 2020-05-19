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

var _languageHandler = require("../../../languageHandler");

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

/*
 * A dialog for confirming a redaction.
 */
var _default = (0, _createReactClass.default)({
  displayName: 'ConfirmRedactDialog',
  render: function () {
    const QuestionDialog = sdk.getComponent('views.dialogs.QuestionDialog');
    return /*#__PURE__*/_react.default.createElement(QuestionDialog, {
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Confirm Removal"),
      description: (0, _languageHandler._t)("Are you sure you wish to remove (delete) this event? " + "Note that if you delete a room name or topic change, it could undo the change."),
      button: (0, _languageHandler._t)("Remove")
    });
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ29uZmlybVJlZGFjdERpYWxvZy5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInJlbmRlciIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicHJvcHMiLCJvbkZpbmlzaGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7OztlQUdlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLHFCQURlO0FBRzVCQyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLFVBQU1DLGNBQWMsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDhCQUFqQixDQUF2QjtBQUNBLHdCQUNJLDZCQUFDLGNBQUQ7QUFBZ0IsTUFBQSxVQUFVLEVBQUUsS0FBS0MsS0FBTCxDQUFXQyxVQUF2QztBQUNJLE1BQUEsS0FBSyxFQUFFLHlCQUFHLGlCQUFILENBRFg7QUFFSSxNQUFBLFdBQVcsRUFDUCx5QkFBRywwREFDQSxnRkFESCxDQUhSO0FBS0ksTUFBQSxNQUFNLEVBQUUseUJBQUcsUUFBSDtBQUxaLE1BREo7QUFTSDtBQWQyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG4vKlxuICogQSBkaWFsb2cgZm9yIGNvbmZpcm1pbmcgYSByZWRhY3Rpb24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQ29uZmlybVJlZGFjdERpYWxvZycsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuUXVlc3Rpb25EaWFsb2cnKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxRdWVzdGlvbkRpYWxvZyBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgdGl0bGU9e190KFwiQ29uZmlybSBSZW1vdmFsXCIpfVxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uPXtcbiAgICAgICAgICAgICAgICAgICAgX3QoXCJBcmUgeW91IHN1cmUgeW91IHdpc2ggdG8gcmVtb3ZlIChkZWxldGUpIHRoaXMgZXZlbnQ/IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgXCJOb3RlIHRoYXQgaWYgeW91IGRlbGV0ZSBhIHJvb20gbmFtZSBvciB0b3BpYyBjaGFuZ2UsIGl0IGNvdWxkIHVuZG8gdGhlIGNoYW5nZS5cIil9XG4gICAgICAgICAgICAgICAgYnV0dG9uPXtfdChcIlJlbW92ZVwiKX0+XG4gICAgICAgICAgICA8L1F1ZXN0aW9uRGlhbG9nPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==