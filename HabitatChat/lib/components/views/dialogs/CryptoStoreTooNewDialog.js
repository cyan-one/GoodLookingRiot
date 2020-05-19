"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

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
  const _onLogoutClicked = () => {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

    _Modal.default.createTrackedDialog('Logout e2e db too new', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Sign out"),
      description: (0, _languageHandler._t)("To avoid losing your chat history, you must export your room keys " + "before logging out. You will need to go back to the newer version of " + "Riot to do this"),
      button: (0, _languageHandler._t)("Sign out"),
      focus: false,
      onFinished: doLogout => {
        if (doLogout) {
          _dispatcher.default.dispatch({
            action: 'logout'
          });

          props.onFinished();
        }
      }
    });
  };

  const description = (0, _languageHandler._t)("You've previously used a newer version of Riot on %(host)s. " + "To use this version again with end to end encryption, you will " + "need to sign out and back in again. ", {
    host: props.host
  });
  const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
  const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
  return /*#__PURE__*/_react.default.createElement(BaseDialog, {
    className: "mx_CryptoStoreTooNewDialog",
    contentId: "mx_Dialog_content",
    title: (0, _languageHandler._t)("Incompatible Database"),
    hasCancel: false,
    onFinished: props.onFinished
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_Dialog_content",
    id: "mx_Dialog_content"
  }, description), /*#__PURE__*/_react.default.createElement(DialogButtons, {
    primaryButton: (0, _languageHandler._t)('Continue With Encryption Disabled'),
    hasCancel: false,
    onPrimaryButtonClick: props.onFinished
  }, /*#__PURE__*/_react.default.createElement("button", {
    onClick: _onLogoutClicked
  }, (0, _languageHandler._t)('Sign out'))));
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ3J5cHRvU3RvcmVUb29OZXdEaWFsb2cuanMiXSwibmFtZXMiOlsicHJvcHMiLCJfb25Mb2dvdXRDbGlja2VkIiwiUXVlc3Rpb25EaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiYnV0dG9uIiwiZm9jdXMiLCJvbkZpbmlzaGVkIiwiZG9Mb2dvdXQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImhvc3QiLCJCYXNlRGlhbG9nIiwiRGlhbG9nQnV0dG9ucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFzQmdCQSxLQUFELElBQVc7QUFDdEIsUUFBTUMsZ0JBQWdCLEdBQUcsTUFBTTtBQUMzQixVQUFNQyxjQUFjLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBdkI7O0FBQ0FDLG1CQUFNQyxtQkFBTixDQUEwQix1QkFBMUIsRUFBbUQsRUFBbkQsRUFBdURKLGNBQXZELEVBQXVFO0FBQ25FSyxNQUFBQSxLQUFLLEVBQUUseUJBQUcsVUFBSCxDQUQ0RDtBQUVuRUMsTUFBQUEsV0FBVyxFQUFFLHlCQUNULHVFQUNBLHVFQURBLEdBRUEsaUJBSFMsQ0FGc0Q7QUFPbkVDLE1BQUFBLE1BQU0sRUFBRSx5QkFBRyxVQUFILENBUDJEO0FBUW5FQyxNQUFBQSxLQUFLLEVBQUUsS0FSNEQ7QUFTbkVDLE1BQUFBLFVBQVUsRUFBR0MsUUFBRCxJQUFjO0FBQ3RCLFlBQUlBLFFBQUosRUFBYztBQUNWQyw4QkFBSUMsUUFBSixDQUFhO0FBQUNDLFlBQUFBLE1BQU0sRUFBRTtBQUFULFdBQWI7O0FBQ0FmLFVBQUFBLEtBQUssQ0FBQ1csVUFBTjtBQUNIO0FBQ0o7QUFka0UsS0FBdkU7QUFnQkgsR0FsQkQ7O0FBb0JBLFFBQU1ILFdBQVcsR0FDYix5QkFBRyxpRUFDQyxpRUFERCxHQUVDLHNDQUZKLEVBR0k7QUFBQ1EsSUFBQUEsSUFBSSxFQUFFaEIsS0FBSyxDQUFDZ0I7QUFBYixHQUhKLENBREo7QUFPQSxRQUFNQyxVQUFVLEdBQUdkLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7QUFDQSxRQUFNYyxhQUFhLEdBQUdmLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw4QkFBakIsQ0FBdEI7QUFDQSxzQkFBUSw2QkFBQyxVQUFEO0FBQVksSUFBQSxTQUFTLEVBQUMsNEJBQXRCO0FBQ0osSUFBQSxTQUFTLEVBQUMsbUJBRE47QUFFSixJQUFBLEtBQUssRUFBRSx5QkFBRyx1QkFBSCxDQUZIO0FBR0osSUFBQSxTQUFTLEVBQUUsS0FIUDtBQUlKLElBQUEsVUFBVSxFQUFFSixLQUFLLENBQUNXO0FBSmQsa0JBTUo7QUFBSyxJQUFBLFNBQVMsRUFBQyxtQkFBZjtBQUFtQyxJQUFBLEVBQUUsRUFBQztBQUF0QyxLQUNNSCxXQUROLENBTkksZUFTSiw2QkFBQyxhQUFEO0FBQWUsSUFBQSxhQUFhLEVBQUUseUJBQUcsbUNBQUgsQ0FBOUI7QUFDSSxJQUFBLFNBQVMsRUFBRSxLQURmO0FBRUksSUFBQSxvQkFBb0IsRUFBRVIsS0FBSyxDQUFDVztBQUZoQyxrQkFJSTtBQUFRLElBQUEsT0FBTyxFQUFFVjtBQUFqQixLQUNNLHlCQUFHLFVBQUgsQ0FETixDQUpKLENBVEksQ0FBUjtBQWtCSCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuXG5leHBvcnQgZGVmYXVsdCAocHJvcHMpID0+IHtcbiAgICBjb25zdCBfb25Mb2dvdXRDbGlja2VkID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdMb2dvdXQgZTJlIGRiIHRvbyBuZXcnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdChcIlNpZ24gb3V0XCIpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgIFwiVG8gYXZvaWQgbG9zaW5nIHlvdXIgY2hhdCBoaXN0b3J5LCB5b3UgbXVzdCBleHBvcnQgeW91ciByb29tIGtleXMgXCIgK1xuICAgICAgICAgICAgICAgIFwiYmVmb3JlIGxvZ2dpbmcgb3V0LiBZb3Ugd2lsbCBuZWVkIHRvIGdvIGJhY2sgdG8gdGhlIG5ld2VyIHZlcnNpb24gb2YgXCIgK1xuICAgICAgICAgICAgICAgIFwiUmlvdCB0byBkbyB0aGlzXCIsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgYnV0dG9uOiBfdChcIlNpZ24gb3V0XCIpLFxuICAgICAgICAgICAgZm9jdXM6IGZhbHNlLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKGRvTG9nb3V0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvTG9nb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnbG9nb3V0J30pO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID1cbiAgICAgICAgX3QoXCJZb3UndmUgcHJldmlvdXNseSB1c2VkIGEgbmV3ZXIgdmVyc2lvbiBvZiBSaW90IG9uICUoaG9zdClzLiBcIiArXG4gICAgICAgICAgICBcIlRvIHVzZSB0aGlzIHZlcnNpb24gYWdhaW4gd2l0aCBlbmQgdG8gZW5kIGVuY3J5cHRpb24sIHlvdSB3aWxsIFwiICtcbiAgICAgICAgICAgIFwibmVlZCB0byBzaWduIG91dCBhbmQgYmFjayBpbiBhZ2Fpbi4gXCIsXG4gICAgICAgICAgICB7aG9zdDogcHJvcHMuaG9zdH0sXG4gICAgICAgICk7XG5cbiAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICByZXR1cm4gKDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0NyeXB0b1N0b3JlVG9vTmV3RGlhbG9nXCJcbiAgICAgICAgY29udGVudElkPSdteF9EaWFsb2dfY29udGVudCdcbiAgICAgICAgdGl0bGU9e190KFwiSW5jb21wYXRpYmxlIERhdGFiYXNlXCIpfVxuICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICBvbkZpbmlzaGVkPXtwcm9wcy5vbkZpbmlzaGVkfVxuICAgID5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiIGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICB7IGRlc2NyaXB0aW9uIH1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdDb250aW51ZSBXaXRoIEVuY3J5cHRpb24gRGlzYWJsZWQnKX1cbiAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17cHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtfb25Mb2dvdXRDbGlja2VkfSA+XG4gICAgICAgICAgICAgICAgeyBfdCgnU2lnbiBvdXQnKSB9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgIDwvQmFzZURpYWxvZz4pO1xufTtcbiJdfQ==