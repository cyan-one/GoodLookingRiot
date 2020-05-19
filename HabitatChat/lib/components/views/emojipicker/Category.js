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

var _EmojiPicker = require("./EmojiPicker");

var sdk = _interopRequireWildcard(require("../../../index"));

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
const OVERFLOW_ROWS = 3;

class Category extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_renderEmojiRow", rowIndex => {
      const {
        onClick,
        onMouseEnter,
        onMouseLeave,
        selectedEmojis,
        emojis
      } = this.props;
      const emojisForRow = emojis.slice(rowIndex * 8, (rowIndex + 1) * 8);
      const Emoji = sdk.getComponent("emojipicker.Emoji");
      return /*#__PURE__*/_react.default.createElement("div", {
        key: rowIndex
      }, emojisForRow.map(emoji => /*#__PURE__*/_react.default.createElement(Emoji, {
        key: emoji.hexcode,
        emoji: emoji,
        selectedEmojis: selectedEmojis,
        onClick: onClick,
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave
      })));
    });
  }

  render() {
    const {
      emojis,
      name,
      heightBefore,
      viewportHeight,
      scrollTop
    } = this.props;

    if (!emojis || emojis.length === 0) {
      return null;
    }

    const rows = new Array(Math.ceil(emojis.length / _EmojiPicker.EMOJIS_PER_ROW));

    for (let counter = 0; counter < rows.length; ++counter) {
      rows[counter] = counter;
    }

    const LazyRenderList = sdk.getComponent('elements.LazyRenderList');
    const viewportTop = scrollTop;
    const viewportBottom = viewportTop + viewportHeight;
    const listTop = heightBefore + _EmojiPicker.CATEGORY_HEADER_HEIGHT;
    const listBottom = listTop + rows.length * _EmojiPicker.EMOJI_HEIGHT;
    const top = Math.max(viewportTop, listTop);
    const bottom = Math.min(viewportBottom, listBottom); // the viewport height and scrollTop passed to the LazyRenderList
    // is capped at the intersection with the real viewport, so lists
    // out of view are passed height 0, so they won't render any items.

    const localHeight = Math.max(0, bottom - top);
    const localScrollTop = Math.max(0, scrollTop - listTop);
    return /*#__PURE__*/_react.default.createElement("section", {
      className: "mx_EmojiPicker_category",
      "data-category-id": this.props.id
    }, /*#__PURE__*/_react.default.createElement("h2", {
      className: "mx_EmojiPicker_category_label"
    }, name), /*#__PURE__*/_react.default.createElement(LazyRenderList, {
      element: "ul",
      className: "mx_EmojiPicker_list",
      itemHeight: _EmojiPicker.EMOJI_HEIGHT,
      items: rows,
      scrollTop: localScrollTop,
      height: localHeight,
      overflowItems: OVERFLOW_ROWS,
      overflowMargin: 0,
      renderItem: this._renderEmojiRow
    }));
  }

}

(0, _defineProperty2.default)(Category, "propTypes", {
  emojis: _propTypes.default.arrayOf(_propTypes.default.object).isRequired,
  name: _propTypes.default.string.isRequired,
  id: _propTypes.default.string.isRequired,
  onMouseEnter: _propTypes.default.func.isRequired,
  onMouseLeave: _propTypes.default.func.isRequired,
  onClick: _propTypes.default.func.isRequired,
  selectedEmojis: _propTypes.default.instanceOf(Set)
});
var _default = Category;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2Vtb2ppcGlja2VyL0NhdGVnb3J5LmpzIl0sIm5hbWVzIjpbIk9WRVJGTE9XX1JPV1MiLCJDYXRlZ29yeSIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsInJvd0luZGV4Iiwib25DbGljayIsIm9uTW91c2VFbnRlciIsIm9uTW91c2VMZWF2ZSIsInNlbGVjdGVkRW1vamlzIiwiZW1vamlzIiwicHJvcHMiLCJlbW9qaXNGb3JSb3ciLCJzbGljZSIsIkVtb2ppIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwibWFwIiwiZW1vamkiLCJoZXhjb2RlIiwicmVuZGVyIiwibmFtZSIsImhlaWdodEJlZm9yZSIsInZpZXdwb3J0SGVpZ2h0Iiwic2Nyb2xsVG9wIiwibGVuZ3RoIiwicm93cyIsIkFycmF5IiwiTWF0aCIsImNlaWwiLCJFTU9KSVNfUEVSX1JPVyIsImNvdW50ZXIiLCJMYXp5UmVuZGVyTGlzdCIsInZpZXdwb3J0VG9wIiwidmlld3BvcnRCb3R0b20iLCJsaXN0VG9wIiwiQ0FURUdPUllfSEVBREVSX0hFSUdIVCIsImxpc3RCb3R0b20iLCJFTU9KSV9IRUlHSFQiLCJ0b3AiLCJtYXgiLCJib3R0b20iLCJtaW4iLCJsb2NhbEhlaWdodCIsImxvY2FsU2Nyb2xsVG9wIiwiaWQiLCJfcmVuZGVyRW1vamlSb3ciLCJQcm9wVHlwZXMiLCJhcnJheU9mIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsInN0cmluZyIsImZ1bmMiLCJpbnN0YW5jZU9mIiwiU2V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLE1BQU1BLGFBQWEsR0FBRyxDQUF0Qjs7QUFFQSxNQUFNQyxRQUFOLFNBQXVCQyxlQUFNQyxhQUE3QixDQUEyQztBQUFBO0FBQUE7QUFBQSwyREFXcEJDLFFBQUQsSUFBYztBQUM1QixZQUFNO0FBQUVDLFFBQUFBLE9B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LEtBQUssRUFBRVosSUFGckM7QUFHSSxNQUFBLFNBQVMsRUFBRWtCLGNBSGY7QUFJSSxNQUFBLE1BQU0sRUFBRUQsV0FKWjtBQUtJLE1BQUEsYUFBYSxFQUFFMUMsYUFMbkI7QUFNSSxNQUFBLGNBQWMsRUFBRSxDQU5wQjtBQU9JLE1BQUEsVUFBVSxFQUFFLEtBQUs2QztBQVByQixNQUpKLENBREo7QUFnQkg7O0FBN0RzQzs7OEJBQXJDNUMsUSxlQUNpQjtBQUNmUSxFQUFBQSxNQUFNLEVBQUVxQyxtQkFBVUMsT0FBVixDQUFrQkQsbUJBQVVFLE1BQTVCLEVBQW9DQyxVQUQ3QjtBQUVmN0IsRUFBQUEsSUFBSSxFQUFFMEIsbUJBQVVJLE1BQVYsQ0FBaUJELFVBRlI7QUFHZkwsRUFBQUEsRUFBRSxFQUFFRSxtQkFBVUksTUFBVixDQUFpQkQsVUFITjtBQUlmM0MsRUFBQUEsWUFBWSxFQUFFd0MsbUJBQVVLLElBQVYsQ0FBZUYsVUFKZDtBQUtmMUMsRUFBQUEsWUFBWSxFQUFFdUMsbUJBQVVLLElBQVYsQ0FBZUYsVUFMZDtBQU1mNUMsRUFBQUEsT0FBTyxFQUFFeUMsbUJBQVVLLElBQVYsQ0FBZUYsVUFOVDtBQU9mekMsRUFBQUEsY0FBYyxFQUFFc0MsbUJBQVVNLFVBQVYsQ0FBcUJDLEdBQXJCO0FBUEQsQztlQStEUnBELFEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVHVsaXIgQXNva2FuIDx0dWxpckBtYXVuaXVtLm5ldD5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IENBVEVHT1JZX0hFQURFUl9IRUlHSFQsIEVNT0pJX0hFSUdIVCwgRU1PSklTX1BFUl9ST1cgfSBmcm9tIFwiLi9FbW9qaVBpY2tlclwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcblxuY29uc3QgT1ZFUkZMT1dfUk9XUyA9IDM7XG5cbmNsYXNzIENhdGVnb3J5IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZW1vamlzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMub2JqZWN0KS5pc1JlcXVpcmVkLFxuICAgICAgICBuYW1lOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIGlkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uTW91c2VFbnRlcjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25Nb3VzZUxlYXZlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNsaWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBzZWxlY3RlZEVtb2ppczogUHJvcFR5cGVzLmluc3RhbmNlT2YoU2V0KSxcbiAgICB9O1xuXG4gICAgX3JlbmRlckVtb2ppUm93ID0gKHJvd0luZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHsgb25DbGljaywgb25Nb3VzZUVudGVyLCBvbk1vdXNlTGVhdmUsIHNlbGVjdGVkRW1vamlzLCBlbW9qaXMgfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IGVtb2ppc0ZvclJvdyA9IGVtb2ppcy5zbGljZShyb3dJbmRleCAqIDgsIChyb3dJbmRleCArIDEpICogOCk7XG4gICAgICAgIGNvbnN0IEVtb2ppID0gc2RrLmdldENvbXBvbmVudChcImVtb2ppcGlja2VyLkVtb2ppXCIpO1xuICAgICAgICByZXR1cm4gKDxkaXYga2V5PXtyb3dJbmRleH0+e1xuICAgICAgICAgICAgZW1vamlzRm9yUm93Lm1hcChlbW9qaSA9PlxuICAgICAgICAgICAgICAgIDxFbW9qaSBrZXk9e2Vtb2ppLmhleGNvZGV9IGVtb2ppPXtlbW9qaX0gc2VsZWN0ZWRFbW9qaXM9e3NlbGVjdGVkRW1vamlzfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNsaWNrfSBvbk1vdXNlRW50ZXI9e29uTW91c2VFbnRlcn0gb25Nb3VzZUxlYXZlPXtvbk1vdXNlTGVhdmV9IC8+KVxuICAgICAgICB9PC9kaXY+KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7IGVtb2ppcywgbmFtZSwgaGVpZ2h0QmVmb3JlLCB2aWV3cG9ydEhlaWdodCwgc2Nyb2xsVG9wIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAoIWVtb2ppcyB8fCBlbW9qaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb3dzID0gbmV3IEFycmF5KE1hdGguY2VpbChlbW9qaXMubGVuZ3RoIC8gRU1PSklTX1BFUl9ST1cpKTtcbiAgICAgICAgZm9yIChsZXQgY291bnRlciA9IDA7IGNvdW50ZXIgPCByb3dzLmxlbmd0aDsgKytjb3VudGVyKSB7XG4gICAgICAgICAgICByb3dzW2NvdW50ZXJdID0gY291bnRlcjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBMYXp5UmVuZGVyTGlzdCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkxhenlSZW5kZXJMaXN0Jyk7XG5cbiAgICAgICAgY29uc3Qgdmlld3BvcnRUb3AgPSBzY3JvbGxUb3A7XG4gICAgICAgIGNvbnN0IHZpZXdwb3J0Qm90dG9tID0gdmlld3BvcnRUb3AgKyB2aWV3cG9ydEhlaWdodDtcbiAgICAgICAgY29uc3QgbGlzdFRvcCA9IGhlaWdodEJlZm9yZSArIENBVEVHT1JZX0hFQURFUl9IRUlHSFQ7XG4gICAgICAgIGNvbnN0IGxpc3RCb3R0b20gPSBsaXN0VG9wICsgKHJvd3MubGVuZ3RoICogRU1PSklfSEVJR0hUKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5tYXgodmlld3BvcnRUb3AsIGxpc3RUb3ApO1xuICAgICAgICBjb25zdCBib3R0b20gPSBNYXRoLm1pbih2aWV3cG9ydEJvdHRvbSwgbGlzdEJvdHRvbSk7XG4gICAgICAgIC8vIHRoZSB2aWV3cG9ydCBoZWlnaHQgYW5kIHNjcm9sbFRvcCBwYXNzZWQgdG8gdGhlIExhenlSZW5kZXJMaXN0XG4gICAgICAgIC8vIGlzIGNhcHBlZCBhdCB0aGUgaW50ZXJzZWN0aW9uIHdpdGggdGhlIHJlYWwgdmlld3BvcnQsIHNvIGxpc3RzXG4gICAgICAgIC8vIG91dCBvZiB2aWV3IGFyZSBwYXNzZWQgaGVpZ2h0IDAsIHNvIHRoZXkgd29uJ3QgcmVuZGVyIGFueSBpdGVtcy5cbiAgICAgICAgY29uc3QgbG9jYWxIZWlnaHQgPSBNYXRoLm1heCgwLCBib3R0b20gLSB0b3ApO1xuICAgICAgICBjb25zdCBsb2NhbFNjcm9sbFRvcCA9IE1hdGgubWF4KDAsIHNjcm9sbFRvcCAtIGxpc3RUb3ApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9jYXRlZ29yeVwiIGRhdGEtY2F0ZWdvcnktaWQ9e3RoaXMucHJvcHMuaWR9PlxuICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9jYXRlZ29yeV9sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICB7bmFtZX1cbiAgICAgICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgICAgIDxMYXp5UmVuZGVyTGlzdFxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50PVwidWxcIiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9saXN0XCJcbiAgICAgICAgICAgICAgICAgICAgaXRlbUhlaWdodD17RU1PSklfSEVJR0hUfSBpdGVtcz17cm93c31cbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVG9wPXtsb2NhbFNjcm9sbFRvcH1cbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PXtsb2NhbEhlaWdodH1cbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3dJdGVtcz17T1ZFUkZMT1dfUk9XU31cbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3dNYXJnaW49ezB9XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlckl0ZW09e3RoaXMuX3JlbmRlckVtb2ppUm93fT5cbiAgICAgICAgICAgICAgICA8L0xhenlSZW5kZXJMaXN0PlxuICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ2F0ZWdvcnk7XG4iXX0=