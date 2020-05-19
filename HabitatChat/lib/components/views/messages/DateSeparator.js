"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var _DateUtils = require("../../../DateUtils");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>

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
function getdaysArray() {
  return [(0, _languageHandler._t)('Sunday'), (0, _languageHandler._t)('Monday'), (0, _languageHandler._t)('Tuesday'), (0, _languageHandler._t)('Wednesday'), (0, _languageHandler._t)('Thursday'), (0, _languageHandler._t)('Friday'), (0, _languageHandler._t)('Saturday')];
}

class DateSeparator extends _react.default.Component {
  getLabel() {
    const date = new Date(this.props.ts);
    const today = new Date();
    const yesterday = new Date();
    const days = getdaysArray();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return (0, _languageHandler._t)('Today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return (0, _languageHandler._t)('Yesterday');
    } else if (today.getTime() - date.getTime() < 6 * 24 * 60 * 60 * 1000) {
      return days[date.getDay()];
    } else {
      return (0, _DateUtils.formatFullDateNoTime)(date);
    }
  }

  render() {
    // ARIA treats <hr/>s as separators, here we abuse them slightly so manually treat this entire thing as one
    // tab-index=-1 to allow it to be focusable but do not add tab stop for it, primarily for screen readers
    return /*#__PURE__*/_react.default.createElement("h2", {
      className: "mx_DateSeparator",
      role: "separator",
      tabIndex: -1
    }, /*#__PURE__*/_react.default.createElement("hr", {
      role: "none"
    }), /*#__PURE__*/_react.default.createElement("div", null, this.getLabel()), /*#__PURE__*/_react.default.createElement("hr", {
      role: "none"
    }));
  }

}

exports.default = DateSeparator;
(0, _defineProperty2.default)(DateSeparator, "propTypes", {
  ts: _propTypes.default.number.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL0RhdGVTZXBhcmF0b3IuanMiXSwibmFtZXMiOlsiZ2V0ZGF5c0FycmF5IiwiRGF0ZVNlcGFyYXRvciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiZ2V0TGFiZWwiLCJkYXRlIiwiRGF0ZSIsInByb3BzIiwidHMiLCJ0b2RheSIsInllc3RlcmRheSIsImRheXMiLCJzZXREYXRlIiwiZ2V0RGF0ZSIsInRvRGF0ZVN0cmluZyIsImdldFRpbWUiLCJnZXREYXkiLCJyZW5kZXIiLCJQcm9wVHlwZXMiLCJudW1iZXIiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsU0FBU0EsWUFBVCxHQUF3QjtBQUN2QixTQUFPLENBQ0EseUJBQUcsUUFBSCxDQURBLEVBRUEseUJBQUcsUUFBSCxDQUZBLEVBR0EseUJBQUcsU0FBSCxDQUhBLEVBSUEseUJBQUcsV0FBSCxDQUpBLEVBS0EseUJBQUcsVUFBSCxDQUxBLEVBTUEseUJBQUcsUUFBSCxDQU5BLEVBT0EseUJBQUcsVUFBSCxDQVBBLENBQVA7QUFTQTs7QUFFYyxNQUFNQyxhQUFOLFNBQTRCQyxlQUFNQyxTQUFsQyxDQUE0QztBQUt2REMsRUFBQUEsUUFBUSxHQUFHO0FBQ1AsVUFBTUMsSUFBSSxHQUFHLElBQUlDLElBQUosQ0FBUyxLQUFLQyxLQUFMLENBQVdDLEVBQXBCLENBQWI7QUFDQSxVQUFNQyxLQUFLLEdBQUcsSUFBSUgsSUFBSixFQUFkO0FBQ0EsVUFBTUksU0FBUyxHQUFHLElBQUlKLElBQUosRUFBbEI7QUFDQSxVQUFNSyxJQUFJLEdBQUdYLFlBQVksRUFBekI7QUFDQVUsSUFBQUEsU0FBUyxDQUFDRSxPQUFWLENBQWtCSCxLQUFLLENBQUNJLE9BQU4sS0FBa0IsQ0FBcEM7O0FBRUEsUUFBSVIsSUFBSSxDQUFDUyxZQUFMLE9BQXdCTCxLQUFLLENBQUNLLFlBQU4sRUFBNUIsRUFBa0Q7QUFDOUMsYUFBTyx5QkFBRyxPQUFILENBQVA7QUFDSCxLQUZELE1BRU8sSUFBSVQsSUFBSSxDQUFDUyxZQUFMLE9BQXdCSixTQUFTLENBQUNJLFlBQVYsRUFBNUIsRUFBc0Q7QUFDekQsYUFBTyx5QkFBRyxXQUFILENBQVA7QUFDSCxLQUZNLE1BRUEsSUFBSUwsS0FBSyxDQUFDTSxPQUFOLEtBQWtCVixJQUFJLENBQUNVLE9BQUwsRUFBbEIsR0FBbUMsSUFBSSxFQUFKLEdBQVMsRUFBVCxHQUFjLEVBQWQsR0FBbUIsSUFBMUQsRUFBZ0U7QUFDbkUsYUFBT0osSUFBSSxDQUFDTixJQUFJLENBQUNXLE1BQUwsRUFBRCxDQUFYO0FBQ0gsS0FGTSxNQUVBO0FBQ0gsYUFBTyxxQ0FBcUJYLElBQXJCLENBQVA7QUFDSDtBQUNKOztBQUVEWSxFQUFBQSxNQUFNLEdBQUc7QUFDTDtBQUNBO0FBQ0Esd0JBQU87QUFBSSxNQUFBLFNBQVMsRUFBQyxrQkFBZDtBQUFpQyxNQUFBLElBQUksRUFBQyxXQUF0QztBQUFrRCxNQUFBLFFBQVEsRUFBRSxDQUFDO0FBQTdELG9CQUNIO0FBQUksTUFBQSxJQUFJLEVBQUM7QUFBVCxNQURHLGVBRUgsMENBQU8sS0FBS2IsUUFBTCxFQUFQLENBRkcsZUFHSDtBQUFJLE1BQUEsSUFBSSxFQUFDO0FBQVQsTUFIRyxDQUFQO0FBS0g7O0FBL0JzRDs7OzhCQUF0Q0gsYSxlQUNFO0FBQ2ZPLEVBQUFBLEVBQUUsRUFBRVUsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRE4sQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge2Zvcm1hdEZ1bGxEYXRlTm9UaW1lfSBmcm9tICcuLi8uLi8uLi9EYXRlVXRpbHMnO1xuXG5mdW5jdGlvbiBnZXRkYXlzQXJyYXkoKSB7XG5cdHJldHVybiBbXG4gICAgICAgIF90KCdTdW5kYXknKSxcbiAgICAgICAgX3QoJ01vbmRheScpLFxuICAgICAgICBfdCgnVHVlc2RheScpLFxuICAgICAgICBfdCgnV2VkbmVzZGF5JyksXG4gICAgICAgIF90KCdUaHVyc2RheScpLFxuICAgICAgICBfdCgnRnJpZGF5JyksXG4gICAgICAgIF90KCdTYXR1cmRheScpLFxuICAgIF07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhdGVTZXBhcmF0b3IgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHRzOiBQcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGdldExhYmVsKCkge1xuICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodGhpcy5wcm9wcy50cyk7XG4gICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgeWVzdGVyZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgZGF5cyA9IGdldGRheXNBcnJheSgpO1xuICAgICAgICB5ZXN0ZXJkYXkuc2V0RGF0ZSh0b2RheS5nZXREYXRlKCkgLSAxKTtcblxuICAgICAgICBpZiAoZGF0ZS50b0RhdGVTdHJpbmcoKSA9PT0gdG9kYXkudG9EYXRlU3RyaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBfdCgnVG9kYXknKTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRlLnRvRGF0ZVN0cmluZygpID09PSB5ZXN0ZXJkYXkudG9EYXRlU3RyaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBfdCgnWWVzdGVyZGF5Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAodG9kYXkuZ2V0VGltZSgpIC0gZGF0ZS5nZXRUaW1lKCkgPCA2ICogMjQgKiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheXNbZGF0ZS5nZXREYXkoKV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0RnVsbERhdGVOb1RpbWUoZGF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIEFSSUEgdHJlYXRzIDxoci8+cyBhcyBzZXBhcmF0b3JzLCBoZXJlIHdlIGFidXNlIHRoZW0gc2xpZ2h0bHkgc28gbWFudWFsbHkgdHJlYXQgdGhpcyBlbnRpcmUgdGhpbmcgYXMgb25lXG4gICAgICAgIC8vIHRhYi1pbmRleD0tMSB0byBhbGxvdyBpdCB0byBiZSBmb2N1c2FibGUgYnV0IGRvIG5vdCBhZGQgdGFiIHN0b3AgZm9yIGl0LCBwcmltYXJpbHkgZm9yIHNjcmVlbiByZWFkZXJzXG4gICAgICAgIHJldHVybiA8aDIgY2xhc3NOYW1lPVwibXhfRGF0ZVNlcGFyYXRvclwiIHJvbGU9XCJzZXBhcmF0b3JcIiB0YWJJbmRleD17LTF9PlxuICAgICAgICAgICAgPGhyIHJvbGU9XCJub25lXCIgLz5cbiAgICAgICAgICAgIDxkaXY+eyB0aGlzLmdldExhYmVsKCkgfTwvZGl2PlxuICAgICAgICAgICAgPGhyIHJvbGU9XCJub25lXCIgLz5cbiAgICAgICAgPC9oMj47XG4gICAgfVxufVxuIl19