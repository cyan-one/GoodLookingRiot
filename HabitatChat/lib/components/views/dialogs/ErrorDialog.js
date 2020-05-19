"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

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

/*
 * Usage:
 * Modal.createTrackedDialog('An Identifier', 'some detail', ErrorDialog, {
 *   title: "some text", (default: "Error")
 *   description: "some more text",
 *   button: "Button Text",
 *   onFinished: someFunction,
 *   focus: true|false (default: true)
 * });
 */
var _default = (0, _createReactClass.default)({
  displayName: 'ErrorDialog',
  propTypes: {
    title: _propTypes.default.string,
    description: _propTypes.default.oneOfType([_propTypes.default.element, _propTypes.default.string]),
    button: _propTypes.default.string,
    focus: _propTypes.default.bool,
    onFinished: _propTypes.default.func.isRequired,
    headerImage: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      focus: true,
      title: null,
      description: null,
      button: null
    };
  },
  render: function () {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_ErrorDialog",
      onFinished: this.props.onFinished,
      title: this.props.title || (0, _languageHandler._t)('Error'),
      headerImage: this.props.headerImage,
      contentId: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content",
      id: "mx_Dialog_content"
    }, this.props.description || (0, _languageHandler._t)('An error has occurred.')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_Dialog_primary",
      onClick: this.props.onFinished,
      autoFocus: this.props.focus
    }, this.props.button || (0, _languageHandler._t)('OK'))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRXJyb3JEaWFsb2cuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJ0aXRsZSIsIlByb3BUeXBlcyIsInN0cmluZyIsImRlc2NyaXB0aW9uIiwib25lT2ZUeXBlIiwiZWxlbWVudCIsImJ1dHRvbiIsImZvY3VzIiwiYm9vbCIsIm9uRmluaXNoZWQiLCJmdW5jIiwiaXNSZXF1aXJlZCIsImhlYWRlckltYWdlIiwiZ2V0RGVmYXVsdFByb3BzIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsInByb3BzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQTJCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEvQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7Ozs7ZUFpQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsYUFEZTtBQUU1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLEtBQUssRUFBRUMsbUJBQVVDLE1BRFY7QUFFUEMsSUFBQUEsV0FBVyxFQUFFRixtQkFBVUcsU0FBVixDQUFvQixDQUM3QkgsbUJBQVVJLE9BRG1CLEVBRTdCSixtQkFBVUMsTUFGbUIsQ0FBcEIsQ0FGTjtBQU1QSSxJQUFBQSxNQUFNLEVBQUVMLG1CQUFVQyxNQU5YO0FBT1BLLElBQUFBLEtBQUssRUFBRU4sbUJBQVVPLElBUFY7QUFRUEMsSUFBQUEsVUFBVSxFQUFFUixtQkFBVVMsSUFBVixDQUFlQyxVQVJwQjtBQVNQQyxJQUFBQSxXQUFXLEVBQUVYLG1CQUFVQztBQVRoQixHQUZpQjtBQWM1QlcsRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsV0FBTztBQUNITixNQUFBQSxLQUFLLEVBQUUsSUFESjtBQUVIUCxNQUFBQSxLQUFLLEVBQUUsSUFGSjtBQUdIRyxNQUFBQSxXQUFXLEVBQUUsSUFIVjtBQUlIRyxNQUFBQSxNQUFNLEVBQUU7QUFKTCxLQUFQO0FBTUgsR0FyQjJCO0FBdUI1QlEsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxVQUFVLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7QUFDQSx3QkFDSSw2QkFBQyxVQUFEO0FBQ0ksTUFBQSxTQUFTLEVBQUMsZ0JBRGQ7QUFFSSxNQUFBLFVBQVUsRUFBRSxLQUFLQyxLQUFMLENBQVdULFVBRjNCO0FBR0ksTUFBQSxLQUFLLEVBQUUsS0FBS1MsS0FBTCxDQUFXbEIsS0FBWCxJQUFvQix5QkFBRyxPQUFILENBSC9CO0FBSUksTUFBQSxXQUFXLEVBQUUsS0FBS2tCLEtBQUwsQ0FBV04sV0FKNUI7QUFLSSxNQUFBLFNBQVMsRUFBQztBQUxkLG9CQU9JO0FBQUssTUFBQSxTQUFTLEVBQUMsbUJBQWY7QUFBbUMsTUFBQSxFQUFFLEVBQUM7QUFBdEMsT0FDTSxLQUFLTSxLQUFMLENBQVdmLFdBQVgsSUFBMEIseUJBQUcsd0JBQUgsQ0FEaEMsQ0FQSixlQVVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFRLE1BQUEsU0FBUyxFQUFDLG1CQUFsQjtBQUFzQyxNQUFBLE9BQU8sRUFBRSxLQUFLZSxLQUFMLENBQVdULFVBQTFEO0FBQXNFLE1BQUEsU0FBUyxFQUFFLEtBQUtTLEtBQUwsQ0FBV1g7QUFBNUYsT0FDTSxLQUFLVyxLQUFMLENBQVdaLE1BQVgsSUFBcUIseUJBQUcsSUFBSCxDQUQzQixDQURKLENBVkosQ0FESjtBQWtCSDtBQTNDMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qXG4gKiBVc2FnZTpcbiAqIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0FuIElkZW50aWZpZXInLCAnc29tZSBkZXRhaWwnLCBFcnJvckRpYWxvZywge1xuICogICB0aXRsZTogXCJzb21lIHRleHRcIiwgKGRlZmF1bHQ6IFwiRXJyb3JcIilcbiAqICAgZGVzY3JpcHRpb246IFwic29tZSBtb3JlIHRleHRcIixcbiAqICAgYnV0dG9uOiBcIkJ1dHRvbiBUZXh0XCIsXG4gKiAgIG9uRmluaXNoZWQ6IHNvbWVGdW5jdGlvbixcbiAqICAgZm9jdXM6IHRydWV8ZmFsc2UgKGRlZmF1bHQ6IHRydWUpXG4gKiB9KTtcbiAqL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0Vycm9yRGlhbG9nJyxcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgdGl0bGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBQcm9wVHlwZXMub25lT2ZUeXBlKFtcbiAgICAgICAgICAgIFByb3BUeXBlcy5lbGVtZW50LFxuICAgICAgICAgICAgUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgXSksXG4gICAgICAgIGJ1dHRvbjogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgZm9jdXM6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBoZWFkZXJJbWFnZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZvY3VzOiB0cnVlLFxuICAgICAgICAgICAgdGl0bGU6IG51bGwsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcbiAgICAgICAgICAgIGJ1dHRvbjogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2dcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9FcnJvckRpYWxvZ1wiXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXt0aGlzLnByb3BzLnRpdGxlIHx8IF90KCdFcnJvcicpfVxuICAgICAgICAgICAgICAgIGhlYWRlckltYWdlPXt0aGlzLnByb3BzLmhlYWRlckltYWdlfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRJZD0nbXhfRGlhbG9nX2NvbnRlbnQnXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiIGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5kZXNjcmlwdGlvbiB8fCBfdCgnQW4gZXJyb3IgaGFzIG9jY3VycmVkLicpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwibXhfRGlhbG9nX3ByaW1hcnlcIiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9IGF1dG9Gb2N1cz17dGhpcy5wcm9wcy5mb2N1c30+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuYnV0dG9uIHx8IF90KCdPSycpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19