"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

/*
Copyright 2015, 2016 OpenMarket Ltd
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
  displayName: 'ProgressBar',
  propTypes: {
    value: _propTypes.default.number,
    max: _propTypes.default.number
  },
  render: function () {
    // Would use an HTML5 progress tag but if that doesn't animate if you
    // use the HTML attributes rather than styles
    const progressStyle = {
      width: this.props.value / this.props.max * 100 + "%"
    };
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ProgressBar"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ProgressBar_fill",
      style: progressStyle
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1Byb2dyZXNzQmFyLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwidmFsdWUiLCJQcm9wVHlwZXMiLCJudW1iZXIiLCJtYXgiLCJyZW5kZXIiLCJwcm9ncmVzc1N0eWxlIiwid2lkdGgiLCJwcm9wcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7OztlQXFCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxhQURlO0FBRTVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsS0FBSyxFQUFFQyxtQkFBVUMsTUFEVjtBQUVQQyxJQUFBQSxHQUFHLEVBQUVGLG1CQUFVQztBQUZSLEdBRmlCO0FBTzVCRSxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmO0FBQ0E7QUFDQSxVQUFNQyxhQUFhLEdBQUc7QUFDbEJDLE1BQUFBLEtBQUssRUFBSSxLQUFLQyxLQUFMLENBQVdQLEtBQVgsR0FBbUIsS0FBS08sS0FBTCxDQUFXSixHQUEvQixHQUFzQyxHQUF2QyxHQUE0QztBQURqQyxLQUF0QjtBQUdBLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFBZ0M7QUFBSyxNQUFBLFNBQVMsRUFBQyxxQkFBZjtBQUFxQyxNQUFBLEtBQUssRUFBRUU7QUFBNUMsTUFBaEMsQ0FESjtBQUdIO0FBaEIyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1Byb2dyZXNzQmFyJyxcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgdmFsdWU6IFByb3BUeXBlcy5udW1iZXIsXG4gICAgICAgIG1heDogUHJvcFR5cGVzLm51bWJlcixcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gV291bGQgdXNlIGFuIEhUTUw1IHByb2dyZXNzIHRhZyBidXQgaWYgdGhhdCBkb2Vzbid0IGFuaW1hdGUgaWYgeW91XG4gICAgICAgIC8vIHVzZSB0aGUgSFRNTCBhdHRyaWJ1dGVzIHJhdGhlciB0aGFuIHN0eWxlc1xuICAgICAgICBjb25zdCBwcm9ncmVzc1N0eWxlID0ge1xuICAgICAgICAgICAgd2lkdGg6ICgodGhpcy5wcm9wcy52YWx1ZSAvIHRoaXMucHJvcHMubWF4KSAqIDEwMCkrXCIlXCIsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Byb2dyZXNzQmFyXCI+PGRpdiBjbGFzc05hbWU9XCJteF9Qcm9ncmVzc0Jhcl9maWxsXCIgc3R5bGU9e3Byb2dyZXNzU3R5bGV9PjwvZGl2PjwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==