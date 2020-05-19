"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _MImageBody = _interopRequireDefault(require("./MImageBody"));

var sdk = _interopRequireWildcard(require("../../../index"));

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
class MStickerBody extends _MImageBody.default {
  // Mostly empty to prevent default behaviour of MImageBody
  onClick(ev) {
    ev.preventDefault();

    if (!this.state.showImage) {
      this.showImage();
    }
  } // MStickerBody doesn't need a wrapping `<a href=...>`, but it does need extra padding
  // which is added by mx_MStickerBody_wrapper


  wrapImage(contentUrl, children) {
    let onClick = null;

    if (!this.state.showImage) {
      onClick = this.onClick;
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MStickerBody_wrapper",
      onClick: onClick
    }, " ", children, " ");
  } // Placeholder to show in place of the sticker image if
  // img onLoad hasn't fired yet.


  getPlaceholder() {
    const TintableSVG = sdk.getComponent('elements.TintableSvg');
    return /*#__PURE__*/_react.default.createElement(TintableSVG, {
      src: require("../../../../res/img/icons-show-stickers.svg"),
      width: "75",
      height: "75"
    });
  } // Tooltip to show on mouse over


  getTooltip() {
    const content = this.props.mxEvent && this.props.mxEvent.getContent();
    if (!content || !content.body || !content.info || !content.info.w) return null;
    const Tooltip = sdk.getComponent('elements.Tooltip');
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
        left: content.info.w + 'px'
      },
      className: "mx_MStickerBody_tooltip"
    }, /*#__PURE__*/_react.default.createElement(Tooltip, {
      label: content.body
    }));
  } // Don't show "Download this_file.png ..."


  getFileBody() {
    return null;
  }

}

exports.default = MStickerBody;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01TdGlja2VyQm9keS5qcyJdLCJuYW1lcyI6WyJNU3RpY2tlckJvZHkiLCJNSW1hZ2VCb2R5Iiwib25DbGljayIsImV2IiwicHJldmVudERlZmF1bHQiLCJzdGF0ZSIsInNob3dJbWFnZSIsIndyYXBJbWFnZSIsImNvbnRlbnRVcmwiLCJjaGlsZHJlbiIsImdldFBsYWNlaG9sZGVyIiwiVGludGFibGVTVkciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJyZXF1aXJlIiwiZ2V0VG9vbHRpcCIsImNvbnRlbnQiLCJwcm9wcyIsIm14RXZlbnQiLCJnZXRDb250ZW50IiwiYm9keSIsImluZm8iLCJ3IiwiVG9vbHRpcCIsImxlZnQiLCJnZXRGaWxlQm9keSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7QUFvQmUsTUFBTUEsWUFBTixTQUEyQkMsbUJBQTNCLENBQXNDO0FBQ2pEO0FBQ0FDLEVBQUFBLE9BQU8sQ0FBQ0MsRUFBRCxFQUFLO0FBQ1JBLElBQUFBLEVBQUUsQ0FBQ0MsY0FBSDs7QUFDQSxRQUFJLENBQUMsS0FBS0MsS0FBTCxDQUFXQyxTQUFoQixFQUEyQjtBQUN2QixXQUFLQSxTQUFMO0FBQ0g7QUFDSixHQVBnRCxDQVNqRDtBQUNBOzs7QUFDQUMsRUFBQUEsU0FBUyxDQUFDQyxVQUFELEVBQWFDLFFBQWIsRUFBdUI7QUFDNUIsUUFBSVAsT0FBTyxHQUFHLElBQWQ7O0FBQ0EsUUFBSSxDQUFDLEtBQUtHLEtBQUwsQ0FBV0MsU0FBaEIsRUFBMkI7QUFDdkJKLE1BQUFBLE9BQU8sR0FBRyxLQUFLQSxPQUFmO0FBQ0g7O0FBQ0Qsd0JBQU87QUFBSyxNQUFBLFNBQVMsRUFBQyx5QkFBZjtBQUF5QyxNQUFBLE9BQU8sRUFBRUE7QUFBbEQsWUFBOERPLFFBQTlELE1BQVA7QUFDSCxHQWpCZ0QsQ0FtQmpEO0FBQ0E7OztBQUNBQyxFQUFBQSxjQUFjLEdBQUc7QUFDYixVQUFNQyxXQUFXLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixzQkFBakIsQ0FBcEI7QUFDQSx3QkFBTyw2QkFBQyxXQUFEO0FBQWEsTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyw2Q0FBRCxDQUF6QjtBQUEwRSxNQUFBLEtBQUssRUFBQyxJQUFoRjtBQUFxRixNQUFBLE1BQU0sRUFBQztBQUE1RixNQUFQO0FBQ0gsR0F4QmdELENBMEJqRDs7O0FBQ0FDLEVBQUFBLFVBQVUsR0FBRztBQUNULFVBQU1DLE9BQU8sR0FBRyxLQUFLQyxLQUFMLENBQVdDLE9BQVgsSUFBc0IsS0FBS0QsS0FBTCxDQUFXQyxPQUFYLENBQW1CQyxVQUFuQixFQUF0QztBQUVBLFFBQUksQ0FBQ0gsT0FBRCxJQUFZLENBQUNBLE9BQU8sQ0FBQ0ksSUFBckIsSUFBNkIsQ0FBQ0osT0FBTyxDQUFDSyxJQUF0QyxJQUE4QyxDQUFDTCxPQUFPLENBQUNLLElBQVIsQ0FBYUMsQ0FBaEUsRUFBbUUsT0FBTyxJQUFQO0FBRW5FLFVBQU1DLE9BQU8sR0FBR1gsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLHdCQUFPO0FBQUssTUFBQSxLQUFLLEVBQUU7QUFBQ1csUUFBQUEsSUFBSSxFQUFFUixPQUFPLENBQUNLLElBQVIsQ0FBYUMsQ0FBYixHQUFpQjtBQUF4QixPQUFaO0FBQTJDLE1BQUEsU0FBUyxFQUFDO0FBQXJELG9CQUNILDZCQUFDLE9BQUQ7QUFBUyxNQUFBLEtBQUssRUFBRU4sT0FBTyxDQUFDSTtBQUF4QixNQURHLENBQVA7QUFHSCxHQXBDZ0QsQ0FzQ2pEOzs7QUFDQUssRUFBQUEsV0FBVyxHQUFHO0FBQ1YsV0FBTyxJQUFQO0FBQ0g7O0FBekNnRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgTUltYWdlQm9keSBmcm9tICcuL01JbWFnZUJvZHknO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTVN0aWNrZXJCb2R5IGV4dGVuZHMgTUltYWdlQm9keSB7XG4gICAgLy8gTW9zdGx5IGVtcHR5IHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvdXIgb2YgTUltYWdlQm9keVxuICAgIG9uQ2xpY2soZXYpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNob3dJbWFnZSkge1xuICAgICAgICAgICAgdGhpcy5zaG93SW1hZ2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1TdGlja2VyQm9keSBkb2Vzbid0IG5lZWQgYSB3cmFwcGluZyBgPGEgaHJlZj0uLi4+YCwgYnV0IGl0IGRvZXMgbmVlZCBleHRyYSBwYWRkaW5nXG4gICAgLy8gd2hpY2ggaXMgYWRkZWQgYnkgbXhfTVN0aWNrZXJCb2R5X3dyYXBwZXJcbiAgICB3cmFwSW1hZ2UoY29udGVudFVybCwgY2hpbGRyZW4pIHtcbiAgICAgICAgbGV0IG9uQ2xpY2sgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuc2hvd0ltYWdlKSB7XG4gICAgICAgICAgICBvbkNsaWNrID0gdGhpcy5vbkNsaWNrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X01TdGlja2VyQm9keV93cmFwcGVyXCIgb25DbGljaz17b25DbGlja30+IHsgY2hpbGRyZW4gfSA8L2Rpdj47XG4gICAgfVxuXG4gICAgLy8gUGxhY2Vob2xkZXIgdG8gc2hvdyBpbiBwbGFjZSBvZiB0aGUgc3RpY2tlciBpbWFnZSBpZlxuICAgIC8vIGltZyBvbkxvYWQgaGFzbid0IGZpcmVkIHlldC5cbiAgICBnZXRQbGFjZWhvbGRlcigpIHtcbiAgICAgICAgY29uc3QgVGludGFibGVTVkcgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5UaW50YWJsZVN2ZycpO1xuICAgICAgICByZXR1cm4gPFRpbnRhYmxlU1ZHIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbnMtc2hvdy1zdGlja2Vycy5zdmdcIil9IHdpZHRoPVwiNzVcIiBoZWlnaHQ9XCI3NVwiIC8+O1xuICAgIH1cblxuICAgIC8vIFRvb2x0aXAgdG8gc2hvdyBvbiBtb3VzZSBvdmVyXG4gICAgZ2V0VG9vbHRpcCgpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucHJvcHMubXhFdmVudCAmJiB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuXG4gICAgICAgIGlmICghY29udGVudCB8fCAhY29udGVudC5ib2R5IHx8ICFjb250ZW50LmluZm8gfHwgIWNvbnRlbnQuaW5mby53KSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBUb29sdGlwID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuVG9vbHRpcCcpO1xuICAgICAgICByZXR1cm4gPGRpdiBzdHlsZT17e2xlZnQ6IGNvbnRlbnQuaW5mby53ICsgJ3B4J319IGNsYXNzTmFtZT1cIm14X01TdGlja2VyQm9keV90b29sdGlwXCI+XG4gICAgICAgICAgICA8VG9vbHRpcCBsYWJlbD17Y29udGVudC5ib2R5fSAvPlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxuXG4gICAgLy8gRG9uJ3Qgc2hvdyBcIkRvd25sb2FkIHRoaXNfZmlsZS5wbmcgLi4uXCJcbiAgICBnZXRGaWxlQm9keSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIl19