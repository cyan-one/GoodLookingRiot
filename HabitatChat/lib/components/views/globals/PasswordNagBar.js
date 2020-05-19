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

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2017 Vector Creations Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: "PasswordNagBar",
  onUpdateClicked: function () {
    const SetPasswordDialog = sdk.getComponent('dialogs.SetPasswordDialog');

    _Modal.default.createTrackedDialog('Set Password Dialog', 'Password Nag Bar', SetPasswordDialog);
  },
  render: function () {
    const toolbarClasses = "mx_MatrixToolbar mx_MatrixToolbar_clickable";
    return /*#__PURE__*/_react.default.createElement("div", {
      className: toolbarClasses,
      onClick: this.onUpdateClicked
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_MatrixToolbar_warning",
      src: require("../../../../res/img/warning.svg"),
      width: "24",
      height: "23",
      alt: ""
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, (0, _languageHandler._t)("To return to your account in future you need to <u>set a password</u>", {}, {
      'u': sub => /*#__PURE__*/_react.default.createElement("u", null, sub)
    })), /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_MatrixToolbar_action"
    }, (0, _languageHandler._t)("Set Password")));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvUGFzc3dvcmROYWdCYXIuanMiXSwibmFtZXMiOlsib25VcGRhdGVDbGlja2VkIiwiU2V0UGFzc3dvcmREaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJyZW5kZXIiLCJ0b29sYmFyQ2xhc3NlcyIsInJlcXVpcmUiLCJzdWIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7OztlQXVCZSwrQkFBaUI7QUFBQTtBQUM1QkEsRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsVUFBTUMsaUJBQWlCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwyQkFBakIsQ0FBMUI7O0FBQ0FDLG1CQUFNQyxtQkFBTixDQUEwQixxQkFBMUIsRUFBaUQsa0JBQWpELEVBQXFFSixpQkFBckU7QUFDSCxHQUoyQjtBQU01QkssRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxjQUFjLEdBQUcsNkNBQXZCO0FBQ0Esd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBRUEsY0FBaEI7QUFBZ0MsTUFBQSxPQUFPLEVBQUUsS0FBS1A7QUFBOUMsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQywwQkFBZjtBQUNJLE1BQUEsR0FBRyxFQUFFUSxPQUFPLENBQUMsaUNBQUQsQ0FEaEI7QUFFSSxNQUFBLEtBQUssRUFBQyxJQUZWO0FBR0ksTUFBQSxNQUFNLEVBQUMsSUFIWDtBQUlJLE1BQUEsR0FBRyxFQUFDO0FBSlIsTUFESixlQU9JO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNNLHlCQUNFLHVFQURGLEVBRUUsRUFGRixFQUdFO0FBQUUsV0FBTUMsR0FBRCxpQkFBUyx3Q0FBS0EsR0FBTDtBQUFoQixLQUhGLENBRE4sQ0FQSixlQWNJO0FBQVEsTUFBQSxTQUFTLEVBQUM7QUFBbEIsT0FDTSx5QkFBRyxjQUFILENBRE4sQ0FkSixDQURKO0FBb0JIO0FBNUIyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIG9uVXBkYXRlQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFNldFBhc3N3b3JkRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5TZXRQYXNzd29yZERpYWxvZycpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTZXQgUGFzc3dvcmQgRGlhbG9nJywgJ1Bhc3N3b3JkIE5hZyBCYXInLCBTZXRQYXNzd29yZERpYWxvZyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHRvb2xiYXJDbGFzc2VzID0gXCJteF9NYXRyaXhUb29sYmFyIG14X01hdHJpeFRvb2xiYXJfY2xpY2thYmxlXCI7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17dG9vbGJhckNsYXNzZXN9IG9uQ2xpY2s9e3RoaXMub25VcGRhdGVDbGlja2VkfT5cbiAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfd2FybmluZ1wiXG4gICAgICAgICAgICAgICAgICAgIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvd2FybmluZy5zdmdcIil9XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoPVwiMjRcIlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9XCIyM1wiXG4gICAgICAgICAgICAgICAgICAgIGFsdD1cIlwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICB7IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUbyByZXR1cm4gdG8geW91ciBhY2NvdW50IGluIGZ1dHVyZSB5b3UgbmVlZCB0byA8dT5zZXQgYSBwYXNzd29yZDwvdT5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyAndSc6IChzdWIpID0+IDx1Pnsgc3ViIH08L3U+IH0sXG4gICAgICAgICAgICAgICAgICAgICkgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9hY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIlNldCBQYXNzd29yZFwiKSB9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=