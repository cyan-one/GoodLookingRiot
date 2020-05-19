"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

/*
Copyright 2019 Tulir Asokan <tulir@maunium.net>

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
class Preview extends _react.default.PureComponent {
  render() {
    const {
      unicode = "",
      annotation = "",
      shortcodes: [shortcode = ""]
    } = this.props.emoji || {};
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_footer mx_EmojiPicker_preview"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_preview_emoji"
    }, unicode), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_preview_text"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_name mx_EmojiPicker_preview_name"
    }, annotation), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_shortcode"
    }, shortcode)));
  }

}

(0, _defineProperty2.default)(Preview, "propTypes", {
  emoji: _propTypes.default.object
});
var _default = Preview;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2Vtb2ppcGlja2VyL1ByZXZpZXcuanMiXSwibmFtZXMiOlsiUHJldmlldyIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsInJlbmRlciIsInVuaWNvZGUiLCJhbm5vdGF0aW9uIiwic2hvcnRjb2RlcyIsInNob3J0Y29kZSIsInByb3BzIiwiZW1vamkiLCJQcm9wVHlwZXMiLCJvYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU1BLE9BQU4sU0FBc0JDLGVBQU1DLGFBQTVCLENBQTBDO0FBS3RDQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNO0FBQ0ZDLE1BQUFBLE9BQU8sR0FBRyxFQURSO0FBRUZDLE1BQUFBLFVBQVUsR0FBRyxFQUZYO0FBR0ZDLE1BQUFBLFVBQVUsRUFBRSxDQUFDQyxTQUFTLEdBQUcsRUFBYjtBQUhWLFFBSUYsS0FBS0MsS0FBTCxDQUFXQyxLQUFYLElBQW9CLEVBSnhCO0FBS0Esd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLTCxPQURMLENBREosZUFJSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0tDLFVBREwsQ0FESixlQUlJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLRSxTQURMLENBSkosQ0FKSixDQURKO0FBZUg7O0FBMUJxQzs7OEJBQXBDUCxPLGVBQ2lCO0FBQ2ZTLEVBQUFBLEtBQUssRUFBRUMsbUJBQVVDO0FBREYsQztlQTRCUlgsTyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUdWxpciBBc29rYW4gPHR1bGlyQG1hdW5pdW0ubmV0PlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuXG5jbGFzcyBQcmV2aWV3IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZW1vamk6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgdW5pY29kZSA9IFwiXCIsXG4gICAgICAgICAgICBhbm5vdGF0aW9uID0gXCJcIixcbiAgICAgICAgICAgIHNob3J0Y29kZXM6IFtzaG9ydGNvZGUgPSBcIlwiXSxcbiAgICAgICAgfSA9IHRoaXMucHJvcHMuZW1vamkgfHwge307XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0Vtb2ppUGlja2VyX2Zvb3RlciBteF9FbW9qaVBpY2tlcl9wcmV2aWV3XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9wcmV2aWV3X2Vtb2ppXCI+XG4gICAgICAgICAgICAgICAgICAgIHt1bmljb2RlfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRW1vamlQaWNrZXJfcHJldmlld190ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRW1vamlQaWNrZXJfbmFtZSBteF9FbW9qaVBpY2tlcl9wcmV2aWV3X25hbWVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHthbm5vdGF0aW9ufVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9zaG9ydGNvZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzaG9ydGNvZGV9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcmV2aWV3O1xuIl19