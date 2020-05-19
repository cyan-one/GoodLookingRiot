"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
class TileErrorBoundary extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onBugReport", () => {
      const BugReportDialog = sdk.getComponent("dialogs.BugReportDialog");

      if (!BugReportDialog) {
        return;
      }

      _Modal.default.createTrackedDialog('Bug Report Dialog', '', BugReportDialog, {
        label: 'react-soft-crash-tile'
      });
    });
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    // Side effects are not permitted here, so we only update the state so
    // that the next render shows an error message.
    return {
      error
    };
  }

  render() {
    if (this.state.error) {
      const {
        mxEvent
      } = this.props;
      const classes = {
        mx_EventTile: true,
        mx_EventTile_info: true,
        mx_EventTile_content: true,
        mx_EventTile_tileError: true
      };
      return /*#__PURE__*/_react.default.createElement("div", {
        className: (0, _classnames.default)(classes)
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EventTile_line"
      }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Can't load this message"), mxEvent && " (".concat(mxEvent.getType(), ")"), /*#__PURE__*/_react.default.createElement("a", {
        onClick: this._onBugReport,
        href: "#"
      }, (0, _languageHandler._t)("Submit logs")))));
    }

    return this.props.children;
  }

}

exports.default = TileErrorBoundary;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL1RpbGVFcnJvckJvdW5kYXJ5LmpzIl0sIm5hbWVzIjpbIlRpbGVFcnJvckJvdW5kYXJ5IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiQnVnUmVwb3J0RGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwibGFiZWwiLCJzdGF0ZSIsImVycm9yIiwiZ2V0RGVyaXZlZFN0YXRlRnJvbUVycm9yIiwicmVuZGVyIiwibXhFdmVudCIsImNsYXNzZXMiLCJteF9FdmVudFRpbGUiLCJteF9FdmVudFRpbGVfaW5mbyIsIm14X0V2ZW50VGlsZV9jb250ZW50IiwibXhfRXZlbnRUaWxlX3RpbGVFcnJvciIsImdldFR5cGUiLCJfb25CdWdSZXBvcnQiLCJjaGlsZHJlbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7OztBQXNCZSxNQUFNQSxpQkFBTixTQUFnQ0MsZUFBTUMsU0FBdEMsQ0FBZ0Q7QUFDM0RDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLHdEQWNKLE1BQU07QUFDakIsWUFBTUMsZUFBZSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIseUJBQWpCLENBQXhCOztBQUNBLFVBQUksQ0FBQ0YsZUFBTCxFQUFzQjtBQUNsQjtBQUNIOztBQUNERyxxQkFBTUMsbUJBQU4sQ0FBMEIsbUJBQTFCLEVBQStDLEVBQS9DLEVBQW1ESixlQUFuRCxFQUFvRTtBQUNoRUssUUFBQUEsS0FBSyxFQUFFO0FBRHlELE9BQXBFO0FBR0gsS0F0QmtCO0FBR2YsU0FBS0MsS0FBTCxHQUFhO0FBQ1RDLE1BQUFBLEtBQUssRUFBRTtBQURFLEtBQWI7QUFHSDs7QUFFRCxTQUFPQyx3QkFBUCxDQUFnQ0QsS0FBaEMsRUFBdUM7QUFDbkM7QUFDQTtBQUNBLFdBQU87QUFBRUEsTUFBQUE7QUFBRixLQUFQO0FBQ0g7O0FBWURFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUksS0FBS0gsS0FBTCxDQUFXQyxLQUFmLEVBQXNCO0FBQ2xCLFlBQU07QUFBRUcsUUFBQUE7QUFBRixVQUFjLEtBQUtYLEtBQXpCO0FBQ0EsWUFBTVksT0FBTyxHQUFHO0FBQ1pDLFFBQUFBLFlBQVksRUFBRSxJQURGO0FBRVpDLFFBQUFBLGlCQUFpQixFQUFFLElBRlA7QUFHWkMsUUFBQUEsb0JBQW9CLEVBQUUsSUFIVjtBQUlaQyxRQUFBQSxzQkFBc0IsRUFBRTtBQUpaLE9BQWhCO0FBTUEsMEJBQVE7QUFBSyxRQUFBLFNBQVMsRUFBRSx5QkFBV0osT0FBWDtBQUFoQixzQkFDSjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0ksMkNBQ0sseUJBQUcseUJBQUgsQ0FETCxFQUVNRCxPQUFPLGdCQUFTQSxPQUFPLENBQUNNLE9BQVIsRUFBVCxNQUZiLGVBR0k7QUFBRyxRQUFBLE9BQU8sRUFBRSxLQUFLQyxZQUFqQjtBQUErQixRQUFBLElBQUksRUFBQztBQUFwQyxTQUNLLHlCQUFHLGFBQUgsQ0FETCxDQUhKLENBREosQ0FESSxDQUFSO0FBV0g7O0FBRUQsV0FBTyxLQUFLbEIsS0FBTCxDQUFXbUIsUUFBbEI7QUFDSDs7QUFoRDBEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRpbGVFcnJvckJvdW5kYXJ5IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgLy8gU2lkZSBlZmZlY3RzIGFyZSBub3QgcGVybWl0dGVkIGhlcmUsIHNvIHdlIG9ubHkgdXBkYXRlIHRoZSBzdGF0ZSBzb1xuICAgICAgICAvLyB0aGF0IHRoZSBuZXh0IHJlbmRlciBzaG93cyBhbiBlcnJvciBtZXNzYWdlLlxuICAgICAgICByZXR1cm4geyBlcnJvciB9O1xuICAgIH1cblxuICAgIF9vbkJ1Z1JlcG9ydCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgQnVnUmVwb3J0RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQnVnUmVwb3J0RGlhbG9nXCIpO1xuICAgICAgICBpZiAoIUJ1Z1JlcG9ydERpYWxvZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0J1ZyBSZXBvcnQgRGlhbG9nJywgJycsIEJ1Z1JlcG9ydERpYWxvZywge1xuICAgICAgICAgICAgbGFiZWw6ICdyZWFjdC1zb2Z0LWNyYXNoLXRpbGUnLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgY29uc3QgeyBteEV2ZW50IH0gPSB0aGlzLnByb3BzO1xuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IHtcbiAgICAgICAgICAgICAgICBteF9FdmVudFRpbGU6IHRydWUsXG4gICAgICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2luZm86IHRydWUsXG4gICAgICAgICAgICAgICAgbXhfRXZlbnRUaWxlX2NvbnRlbnQ6IHRydWUsXG4gICAgICAgICAgICAgICAgbXhfRXZlbnRUaWxlX3RpbGVFcnJvcjogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWVzKGNsYXNzZXMpfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9saW5lXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiQ2FuJ3QgbG9hZCB0aGlzIG1lc3NhZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IG14RXZlbnQgJiYgYCAoJHtteEV2ZW50LmdldFR5cGUoKX0pYCB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLl9vbkJ1Z1JlcG9ydH0gaHJlZj1cIiNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJTdWJtaXQgbG9nc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLmNoaWxkcmVuO1xuICAgIH1cbn1cbiJdfQ==