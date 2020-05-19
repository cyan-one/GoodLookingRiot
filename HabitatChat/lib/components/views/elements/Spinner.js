"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

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
  displayName: 'Spinner',
  render: function () {
    const w = this.props.w || 32;
    const h = this.props.h || 32;
    const imgClass = this.props.imgClassName || "";
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Spinner"
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/spinner.gif"),
      width: w,
      height: h,
      className: imgClass
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1NwaW5uZXIuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJyZW5kZXIiLCJ3IiwicHJvcHMiLCJoIiwiaW1nQ2xhc3MiLCJpbWdDbGFzc05hbWUiLCJyZXF1aXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7O2VBb0JlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLFNBRGU7QUFHNUJDLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsVUFBTUMsQ0FBQyxHQUFHLEtBQUtDLEtBQUwsQ0FBV0QsQ0FBWCxJQUFnQixFQUExQjtBQUNBLFVBQU1FLENBQUMsR0FBRyxLQUFLRCxLQUFMLENBQVdDLENBQVgsSUFBZ0IsRUFBMUI7QUFDQSxVQUFNQyxRQUFRLEdBQUcsS0FBS0YsS0FBTCxDQUFXRyxZQUFYLElBQTJCLEVBQTVDO0FBQ0Esd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyxpQ0FBRCxDQUFqQjtBQUFzRCxNQUFBLEtBQUssRUFBRUwsQ0FBN0Q7QUFBZ0UsTUFBQSxNQUFNLEVBQUVFLENBQXhFO0FBQTJFLE1BQUEsU0FBUyxFQUFFQztBQUF0RixNQURKLENBREo7QUFLSDtBQVoyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnU3Bpbm5lcicsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCB3ID0gdGhpcy5wcm9wcy53IHx8IDMyO1xuICAgICAgICBjb25zdCBoID0gdGhpcy5wcm9wcy5oIHx8IDMyO1xuICAgICAgICBjb25zdCBpbWdDbGFzcyA9IHRoaXMucHJvcHMuaW1nQ2xhc3NOYW1lIHx8IFwiXCI7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NwaW5uZXJcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvc3Bpbm5lci5naWZcIil9IHdpZHRoPXt3fSBoZWlnaHQ9e2h9IGNsYXNzTmFtZT17aW1nQ2xhc3N9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=