"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../languageHandler");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var _RoomDetailRow = require("./RoomDetailRow");

/*
Copyright 2017 New Vector Ltd.

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
  displayName: 'RoomDetailList',
  propTypes: {
    rooms: _propTypes.default.arrayOf(_RoomDetailRow.roomShape),
    className: _propTypes.default.string
  },
  getRows: function () {
    if (!this.props.rooms) return [];
    const RoomDetailRow = sdk.getComponent('rooms.RoomDetailRow');
    return this.props.rooms.map((room, index) => {
      return /*#__PURE__*/_react.default.createElement(RoomDetailRow, {
        key: index,
        room: room,
        onClick: this.onDetailsClick
      });
    });
  },
  onDetailsClick: function (ev, room) {
    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: room.roomId,
      room_alias: room.canonicalAlias || (room.aliases || [])[0]
    });
  },

  render() {
    const rows = this.getRows();
    let rooms;

    if (rows.length === 0) {
      rooms = /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('No rooms to show'));
    } else {
      rooms = /*#__PURE__*/_react.default.createElement("table", {
        className: "mx_RoomDirectory_table"
      }, /*#__PURE__*/_react.default.createElement("tbody", null, this.getRows()));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: (0, _classnames.default)("mx_RoomDetailList", this.props.className)
    }, rooms);
  }

});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21EZXRhaWxMaXN0LmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbXMiLCJQcm9wVHlwZXMiLCJhcnJheU9mIiwicm9vbVNoYXBlIiwiY2xhc3NOYW1lIiwic3RyaW5nIiwiZ2V0Um93cyIsInByb3BzIiwiUm9vbURldGFpbFJvdyIsInNkayIsImdldENvbXBvbmVudCIsIm1hcCIsInJvb20iLCJpbmRleCIsIm9uRGV0YWlsc0NsaWNrIiwiZXYiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInJvb21faWQiLCJyb29tSWQiLCJyb29tX2FsaWFzIiwiY2Fub25pY2FsQWxpYXMiLCJhbGlhc2VzIiwicmVuZGVyIiwicm93cyIsImxlbmd0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBeEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUEwQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsZ0JBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxLQUFLLEVBQUVDLG1CQUFVQyxPQUFWLENBQWtCQyx3QkFBbEIsQ0FEQTtBQUVQQyxJQUFBQSxTQUFTLEVBQUVILG1CQUFVSTtBQUZkLEdBSGlCO0FBUTVCQyxFQUFBQSxPQUFPLEVBQUUsWUFBVztBQUNoQixRQUFJLENBQUMsS0FBS0MsS0FBTCxDQUFXUCxLQUFoQixFQUF1QixPQUFPLEVBQVA7QUFFdkIsVUFBTVEsYUFBYSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIscUJBQWpCLENBQXRCO0FBQ0EsV0FBTyxLQUFLSCxLQUFMLENBQVdQLEtBQVgsQ0FBaUJXLEdBQWpCLENBQXFCLENBQUNDLElBQUQsRUFBT0MsS0FBUCxLQUFpQjtBQUN6QywwQkFBTyw2QkFBQyxhQUFEO0FBQWUsUUFBQSxHQUFHLEVBQUVBLEtBQXBCO0FBQTJCLFFBQUEsSUFBSSxFQUFFRCxJQUFqQztBQUF1QyxRQUFBLE9BQU8sRUFBRSxLQUFLRTtBQUFyRCxRQUFQO0FBQ0gsS0FGTSxDQUFQO0FBR0gsR0FmMkI7QUFpQjVCQSxFQUFBQSxjQUFjLEVBQUUsVUFBU0MsRUFBVCxFQUFhSCxJQUFiLEVBQW1CO0FBQy9CSSx3QkFBSUMsUUFBSixDQUFhO0FBQ1RDLE1BQUFBLE1BQU0sRUFBRSxXQURDO0FBRVRDLE1BQUFBLE9BQU8sRUFBRVAsSUFBSSxDQUFDUSxNQUZMO0FBR1RDLE1BQUFBLFVBQVUsRUFBRVQsSUFBSSxDQUFDVSxjQUFMLElBQXVCLENBQUNWLElBQUksQ0FBQ1csT0FBTCxJQUFnQixFQUFqQixFQUFxQixDQUFyQjtBQUgxQixLQUFiO0FBS0gsR0F2QjJCOztBQXlCNUJDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLElBQUksR0FBRyxLQUFLbkIsT0FBTCxFQUFiO0FBQ0EsUUFBSU4sS0FBSjs7QUFDQSxRQUFJeUIsSUFBSSxDQUFDQyxNQUFMLEtBQWdCLENBQXBCLEVBQXVCO0FBQ25CMUIsTUFBQUEsS0FBSyxnQkFBRyx3Q0FBSyx5QkFBRyxrQkFBSCxDQUFMLENBQVI7QUFDSCxLQUZELE1BRU87QUFDSEEsTUFBQUEsS0FBSyxnQkFBRztBQUFPLFFBQUEsU0FBUyxFQUFDO0FBQWpCLHNCQUNKLDRDQUNNLEtBQUtNLE9BQUwsRUFETixDQURJLENBQVI7QUFLSDs7QUFDRCx3QkFBTztBQUFLLE1BQUEsU0FBUyxFQUFFLHlCQUFXLG1CQUFYLEVBQWdDLEtBQUtDLEtBQUwsQ0FBV0gsU0FBM0M7QUFBaEIsT0FDREosS0FEQyxDQUFQO0FBR0g7O0FBeEMyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcblxuaW1wb3J0IHtyb29tU2hhcGV9IGZyb20gJy4vUm9vbURldGFpbFJvdyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUm9vbURldGFpbExpc3QnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHJvb21zOiBQcm9wVHlwZXMuYXJyYXlPZihyb29tU2hhcGUpLFxuICAgICAgICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIGdldFJvd3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvcHMucm9vbXMpIHJldHVybiBbXTtcblxuICAgICAgICBjb25zdCBSb29tRGV0YWlsUm93ID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuUm9vbURldGFpbFJvdycpO1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5yb29tcy5tYXAoKHJvb20sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPFJvb21EZXRhaWxSb3cga2V5PXtpbmRleH0gcm9vbT17cm9vbX0gb25DbGljaz17dGhpcy5vbkRldGFpbHNDbGlja30gLz47XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkRldGFpbHNDbGljazogZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICByb29tX2lkOiByb29tLnJvb21JZCxcbiAgICAgICAgICAgIHJvb21fYWxpYXM6IHJvb20uY2Fub25pY2FsQWxpYXMgfHwgKHJvb20uYWxpYXNlcyB8fCBbXSlbMF0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvd3MgPSB0aGlzLmdldFJvd3MoKTtcbiAgICAgICAgbGV0IHJvb21zO1xuICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJvb21zID0gPGk+eyBfdCgnTm8gcm9vbXMgdG8gc2hvdycpIH08L2k+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm9vbXMgPSA8dGFibGUgY2xhc3NOYW1lPVwibXhfUm9vbURpcmVjdG9yeV90YWJsZVwiPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLmdldFJvd3MoKSB9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcIm14X1Jvb21EZXRhaWxMaXN0XCIsIHRoaXMucHJvcHMuY2xhc3NOYW1lKX0+XG4gICAgICAgICAgICB7IHJvb21zIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG59KTtcbiJdfQ==