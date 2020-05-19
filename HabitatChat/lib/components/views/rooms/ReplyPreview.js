"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Permalinks = require("../../../utils/permalinks/Permalinks");

/*
Copyright 2017 New Vector Ltd

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
function cancelQuoting() {
  _dispatcher.default.dispatch({
    action: 'reply_to_event',
    event: null
  });
}

class ReplyPreview extends _react.default.Component {
  constructor(props) {
    super(props);
    this.unmounted = false;
    this.state = {
      event: _RoomViewStore.default.getQuotingEvent()
    };
    this._onRoomViewStoreUpdate = this._onRoomViewStoreUpdate.bind(this);
    this._roomStoreToken = _RoomViewStore.default.addListener(this._onRoomViewStoreUpdate);
  }

  componentWillUnmount() {
    this.unmounted = true; // Remove RoomStore listener

    if (this._roomStoreToken) {
      this._roomStoreToken.remove();
    }
  }

  _onRoomViewStoreUpdate() {
    if (this.unmounted) return;

    const event = _RoomViewStore.default.getQuotingEvent();

    if (this.state.event !== event) {
      this.setState({
        event
      });
    }
  }

  render() {
    if (!this.state.event) return null;
    const EventTile = sdk.getComponent('rooms.EventTile');
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReplyPreview"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReplyPreview_section"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReplyPreview_header mx_ReplyPreview_title"
    }, '💬 ' + (0, _languageHandler._t)('Replying')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReplyPreview_header mx_ReplyPreview_cancel"
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_filterFlipColor",
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18",
      onClick: cancelQuoting
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReplyPreview_clear"
    }), /*#__PURE__*/_react.default.createElement(EventTile, {
      last: true,
      tileShape: "reply_preview",
      mxEvent: this.state.event,
      permalinkCreator: this.props.permalinkCreator,
      isTwelveHour: _SettingsStore.default.getValue("showTwelveHourTimestamps")
    })));
  }

}

exports.default = ReplyPreview;
(0, _defineProperty2.default)(ReplyPreview, "propTypes", {
  permalinkCreator: _propTypes.default.instanceOf(_Permalinks.RoomPermalinkCreator).isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1JlcGx5UHJldmlldy5qcyJdLCJuYW1lcyI6WyJjYW5jZWxRdW90aW5nIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJldmVudCIsIlJlcGx5UHJldmlldyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInVubW91bnRlZCIsInN0YXRlIiwiUm9vbVZpZXdTdG9yZSIsImdldFF1b3RpbmdFdmVudCIsIl9vblJvb21WaWV3U3RvcmVVcGRhdGUiLCJiaW5kIiwiX3Jvb21TdG9yZVRva2VuIiwiYWRkTGlzdGVuZXIiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZSIsInNldFN0YXRlIiwicmVuZGVyIiwiRXZlbnRUaWxlIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicmVxdWlyZSIsInBlcm1hbGlua0NyZWF0b3IiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJQcm9wVHlwZXMiLCJpbnN0YW5jZU9mIiwiUm9vbVBlcm1hbGlua0NyZWF0b3IiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLFNBQVNBLGFBQVQsR0FBeUI7QUFDckJDLHNCQUFJQyxRQUFKLENBQWE7QUFDVEMsSUFBQUEsTUFBTSxFQUFFLGdCQURDO0FBRVRDLElBQUFBLEtBQUssRUFBRTtBQUZFLEdBQWI7QUFJSDs7QUFFYyxNQUFNQyxZQUFOLFNBQTJCQyxlQUFNQyxTQUFqQyxDQUEyQztBQUt0REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixLQUFqQjtBQUVBLFNBQUtDLEtBQUwsR0FBYTtBQUNUUCxNQUFBQSxLQUFLLEVBQUVRLHVCQUFjQyxlQUFkO0FBREUsS0FBYjtBQUlBLFNBQUtDLHNCQUFMLEdBQThCLEtBQUtBLHNCQUFMLENBQTRCQyxJQUE1QixDQUFpQyxJQUFqQyxDQUE5QjtBQUNBLFNBQUtDLGVBQUwsR0FBdUJKLHVCQUFjSyxXQUFkLENBQTBCLEtBQUtILHNCQUEvQixDQUF2QjtBQUNIOztBQUVESSxFQUFBQSxvQkFBb0IsR0FBRztBQUNuQixTQUFLUixTQUFMLEdBQWlCLElBQWpCLENBRG1CLENBR25COztBQUNBLFFBQUksS0FBS00sZUFBVCxFQUEwQjtBQUN0QixXQUFLQSxlQUFMLENBQXFCRyxNQUFyQjtBQUNIO0FBQ0o7O0FBRURMLEVBQUFBLHNCQUFzQixHQUFHO0FBQ3JCLFFBQUksS0FBS0osU0FBVCxFQUFvQjs7QUFFcEIsVUFBTU4sS0FBSyxHQUFHUSx1QkFBY0MsZUFBZCxFQUFkOztBQUNBLFFBQUksS0FBS0YsS0FBTCxDQUFXUCxLQUFYLEtBQXFCQSxLQUF6QixFQUFnQztBQUM1QixXQUFLZ0IsUUFBTCxDQUFjO0FBQUVoQixRQUFBQTtBQUFGLE9BQWQ7QUFDSDtBQUNKOztBQUVEaUIsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsUUFBSSxDQUFDLEtBQUtWLEtBQUwsQ0FBV1AsS0FBaEIsRUFBdUIsT0FBTyxJQUFQO0FBRXZCLFVBQU1rQixTQUFTLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixpQkFBakIsQ0FBbEI7QUFFQSx3QkFBTztBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0g7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNNLFFBQVEseUJBQUcsVUFBSCxDQURkLENBREosZUFJSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQyxvQkFBZjtBQUFvQyxNQUFBLEdBQUcsRUFBRUMsT0FBTyxDQUFDLGdDQUFELENBQWhEO0FBQW9GLE1BQUEsS0FBSyxFQUFDLElBQTFGO0FBQStGLE1BQUEsTUFBTSxFQUFDLElBQXRHO0FBQ0ssTUFBQSxPQUFPLEVBQUV6QjtBQURkLE1BREosQ0FKSixlQVFJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixNQVJKLGVBU0ksNkJBQUMsU0FBRDtBQUFXLE1BQUEsSUFBSSxFQUFFLElBQWpCO0FBQ1csTUFBQSxTQUFTLEVBQUMsZUFEckI7QUFFVyxNQUFBLE9BQU8sRUFBRSxLQUFLVyxLQUFMLENBQVdQLEtBRi9CO0FBR1csTUFBQSxnQkFBZ0IsRUFBRSxLQUFLSyxLQUFMLENBQVdpQixnQkFIeEM7QUFJVyxNQUFBLFlBQVksRUFBRUMsdUJBQWNDLFFBQWQsQ0FBdUIsMEJBQXZCO0FBSnpCLE1BVEosQ0FERyxDQUFQO0FBaUJIOztBQXpEcUQ7Ozs4QkFBckN2QixZLGVBQ0U7QUFDZnFCLEVBQUFBLGdCQUFnQixFQUFFRyxtQkFBVUMsVUFBVixDQUFxQkMsZ0NBQXJCLEVBQTJDQztBQUQ5QyxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgUm9vbVZpZXdTdG9yZSBmcm9tICcuLi8uLi8uLi9zdG9yZXMvUm9vbVZpZXdTdG9yZSc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0IHtSb29tUGVybWFsaW5rQ3JlYXRvcn0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rc1wiO1xuXG5mdW5jdGlvbiBjYW5jZWxRdW90aW5nKCkge1xuICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgIGFjdGlvbjogJ3JlcGx5X3RvX2V2ZW50JyxcbiAgICAgICAgZXZlbnQ6IG51bGwsXG4gICAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcGx5UHJldmlldyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgcGVybWFsaW5rQ3JlYXRvcjogUHJvcFR5cGVzLmluc3RhbmNlT2YoUm9vbVBlcm1hbGlua0NyZWF0b3IpLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgZXZlbnQ6IFJvb21WaWV3U3RvcmUuZ2V0UXVvdGluZ0V2ZW50KCksXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fb25Sb29tVmlld1N0b3JlVXBkYXRlID0gdGhpcy5fb25Sb29tVmlld1N0b3JlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3Jvb21TdG9yZVRva2VuID0gUm9vbVZpZXdTdG9yZS5hZGRMaXN0ZW5lcih0aGlzLl9vblJvb21WaWV3U3RvcmVVcGRhdGUpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICB0aGlzLnVubW91bnRlZCA9IHRydWU7XG5cbiAgICAgICAgLy8gUmVtb3ZlIFJvb21TdG9yZSBsaXN0ZW5lclxuICAgICAgICBpZiAodGhpcy5fcm9vbVN0b3JlVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb21TdG9yZVRva2VuLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUm9vbVZpZXdTdG9yZVVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZXZlbnQgPSBSb29tVmlld1N0b3JlLmdldFF1b3RpbmdFdmVudCgpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ldmVudCAhPT0gZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBldmVudCB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmV2ZW50KSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBFdmVudFRpbGUgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5FdmVudFRpbGUnKTtcblxuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9SZXBseVByZXZpZXdcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUmVwbHlQcmV2aWV3X3NlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1JlcGx5UHJldmlld19oZWFkZXIgbXhfUmVwbHlQcmV2aWV3X3RpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgJ/CfkqwgJyArIF90KCdSZXBseWluZycpIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1JlcGx5UHJldmlld19oZWFkZXIgbXhfUmVwbHlQcmV2aWV3X2NhbmNlbFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X2ZpbHRlckZsaXBDb2xvclwiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvY2FuY2VsLnN2Z1wiKX0gd2lkdGg9XCIxOFwiIGhlaWdodD1cIjE4XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtjYW5jZWxRdW90aW5nfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUmVwbHlQcmV2aWV3X2NsZWFyXCIgLz5cbiAgICAgICAgICAgICAgICA8RXZlbnRUaWxlIGxhc3Q9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aWxlU2hhcGU9XCJyZXBseV9wcmV2aWV3XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG14RXZlbnQ9e3RoaXMuc3RhdGUuZXZlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3J9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpc1R3ZWx2ZUhvdXI9e1NldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93VHdlbHZlSG91clRpbWVzdGFtcHNcIil9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cbiJdfQ==