"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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
  displayName: 'IncomingCallBox',
  propTypes: {
    incomingCall: _propTypes.default.object
  },
  onAnswerClick: function (e) {
    e.stopPropagation();

    _dispatcher.default.dispatch({
      action: 'answer',
      room_id: this.props.incomingCall.roomId
    });
  },
  onRejectClick: function (e) {
    e.stopPropagation();

    _dispatcher.default.dispatch({
      action: 'hangup',
      room_id: this.props.incomingCall.roomId
    });
  },
  render: function () {
    let room = null;

    if (this.props.incomingCall) {
      room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.incomingCall.roomId);
    }

    const caller = room ? room.name : (0, _languageHandler._t)("unknown caller");
    let incomingCallText = null;

    if (this.props.incomingCall) {
      if (this.props.incomingCall.type === "voice") {
        incomingCallText = (0, _languageHandler._t)("Incoming voice call from %(name)s", {
          name: caller
        });
      } else if (this.props.incomingCall.type === "video") {
        incomingCallText = (0, _languageHandler._t)("Incoming video call from %(name)s", {
          name: caller
        });
      } else {
        incomingCallText = (0, _languageHandler._t)("Incoming call from %(name)s", {
          name: caller
        });
      }
    }

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingCallBox",
      id: "incomingCallBox"
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_IncomingCallBox_chevron",
      src: require("../../../../res/img/chevron-left.png"),
      width: "9",
      height: "16"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingCallBox_title"
    }, incomingCallText), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingCallBox_buttons"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingCallBox_buttons_cell"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_IncomingCallBox_buttons_decline",
      onClick: this.onRejectClick
    }, (0, _languageHandler._t)("Decline"))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_IncomingCallBox_buttons_cell"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_IncomingCallBox_buttons_accept",
      onClick: this.onAnswerClick
    }, (0, _languageHandler._t)("Accept")))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3ZvaXAvSW5jb21pbmdDYWxsQm94LmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwiaW5jb21pbmdDYWxsIiwiUHJvcFR5cGVzIiwib2JqZWN0Iiwib25BbnN3ZXJDbGljayIsImUiLCJzdG9wUHJvcGFnYXRpb24iLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInJvb21faWQiLCJwcm9wcyIsInJvb21JZCIsIm9uUmVqZWN0Q2xpY2siLCJyZW5kZXIiLCJyb29tIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0Um9vbSIsImNhbGxlciIsIm5hbWUiLCJpbmNvbWluZ0NhbGxUZXh0IiwidHlwZSIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJyZXF1aXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF2QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBeUJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLGlCQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsWUFBWSxFQUFFQyxtQkFBVUM7QUFEakIsR0FIaUI7QUFPNUJDLEVBQUFBLGFBQWEsRUFBRSxVQUFTQyxDQUFULEVBQVk7QUFDdkJBLElBQUFBLENBQUMsQ0FBQ0MsZUFBRjs7QUFDQUMsd0JBQUlDLFFBQUosQ0FBYTtBQUNUQyxNQUFBQSxNQUFNLEVBQUUsUUFEQztBQUVUQyxNQUFBQSxPQUFPLEVBQUUsS0FBS0MsS0FBTCxDQUFXVixZQUFYLENBQXdCVztBQUZ4QixLQUFiO0FBSUgsR0FiMkI7QUFlNUJDLEVBQUFBLGFBQWEsRUFBRSxVQUFTUixDQUFULEVBQVk7QUFDdkJBLElBQUFBLENBQUMsQ0FBQ0MsZUFBRjs7QUFDQUMsd0JBQUlDLFFBQUosQ0FBYTtBQUNUQyxNQUFBQSxNQUFNLEVBQUUsUUFEQztBQUVUQyxNQUFBQSxPQUFPLEVBQUUsS0FBS0MsS0FBTCxDQUFXVixZQUFYLENBQXdCVztBQUZ4QixLQUFiO0FBSUgsR0FyQjJCO0FBdUI1QkUsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixRQUFJQyxJQUFJLEdBQUcsSUFBWDs7QUFDQSxRQUFJLEtBQUtKLEtBQUwsQ0FBV1YsWUFBZixFQUE2QjtBQUN6QmMsTUFBQUEsSUFBSSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxPQUF0QixDQUE4QixLQUFLUCxLQUFMLENBQVdWLFlBQVgsQ0FBd0JXLE1BQXRELENBQVA7QUFDSDs7QUFFRCxVQUFNTyxNQUFNLEdBQUdKLElBQUksR0FBR0EsSUFBSSxDQUFDSyxJQUFSLEdBQWUseUJBQUcsZ0JBQUgsQ0FBbEM7QUFFQSxRQUFJQyxnQkFBZ0IsR0FBRyxJQUF2Qjs7QUFDQSxRQUFJLEtBQUtWLEtBQUwsQ0FBV1YsWUFBZixFQUE2QjtBQUN6QixVQUFJLEtBQUtVLEtBQUwsQ0FBV1YsWUFBWCxDQUF3QnFCLElBQXhCLEtBQWlDLE9BQXJDLEVBQThDO0FBQzFDRCxRQUFBQSxnQkFBZ0IsR0FBRyx5QkFBRyxtQ0FBSCxFQUF3QztBQUFDRCxVQUFBQSxJQUFJLEVBQUVEO0FBQVAsU0FBeEMsQ0FBbkI7QUFDSCxPQUZELE1BRU8sSUFBSSxLQUFLUixLQUFMLENBQVdWLFlBQVgsQ0FBd0JxQixJQUF4QixLQUFpQyxPQUFyQyxFQUE4QztBQUNqREQsUUFBQUEsZ0JBQWdCLEdBQUcseUJBQUcsbUNBQUgsRUFBd0M7QUFBQ0QsVUFBQUEsSUFBSSxFQUFFRDtBQUFQLFNBQXhDLENBQW5CO0FBQ0gsT0FGTSxNQUVBO0FBQ0hFLFFBQUFBLGdCQUFnQixHQUFHLHlCQUFHLDZCQUFILEVBQWtDO0FBQUNELFVBQUFBLElBQUksRUFBRUQ7QUFBUCxTQUFsQyxDQUFuQjtBQUNIO0FBQ0o7O0FBRUQsVUFBTUksZ0JBQWdCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwyQkFBakIsQ0FBekI7QUFDQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLG9CQUFmO0FBQW9DLE1BQUEsRUFBRSxFQUFDO0FBQXZDLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUMsNEJBQWY7QUFBNEMsTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyxzQ0FBRCxDQUF4RDtBQUFrRyxNQUFBLEtBQUssRUFBQyxHQUF4RztBQUE0RyxNQUFBLE1BQU0sRUFBQztBQUFuSCxNQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ01MLGdCQUROLENBRkosZUFLSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsU0FBUyxFQUFDLG9DQUE1QjtBQUFpRSxNQUFBLE9BQU8sRUFBRSxLQUFLUjtBQUEvRSxPQUNNLHlCQUFHLFNBQUgsQ0FETixDQURKLENBREosZUFNSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxTQUFTLEVBQUMsbUNBQTVCO0FBQWdFLE1BQUEsT0FBTyxFQUFFLEtBQUtUO0FBQTlFLE9BQ00seUJBQUcsUUFBSCxDQUROLENBREosQ0FOSixDQUxKLENBREo7QUFvQkg7QUEvRDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnSW5jb21pbmdDYWxsQm94JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBpbmNvbWluZ0NhbGw6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfSxcblxuICAgIG9uQW5zd2VyQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2Fuc3dlcicsXG4gICAgICAgICAgICByb29tX2lkOiB0aGlzLnByb3BzLmluY29taW5nQ2FsbC5yb29tSWQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJlamVjdENsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdoYW5ndXAnLFxuICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5wcm9wcy5pbmNvbWluZ0NhbGwucm9vbUlkLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHJvb20gPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5pbmNvbWluZ0NhbGwpIHtcbiAgICAgICAgICAgIHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbSh0aGlzLnByb3BzLmluY29taW5nQ2FsbC5yb29tSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FsbGVyID0gcm9vbSA/IHJvb20ubmFtZSA6IF90KFwidW5rbm93biBjYWxsZXJcIik7XG5cbiAgICAgICAgbGV0IGluY29taW5nQ2FsbFRleHQgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5pbmNvbWluZ0NhbGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmluY29taW5nQ2FsbC50eXBlID09PSBcInZvaWNlXCIpIHtcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGxUZXh0ID0gX3QoXCJJbmNvbWluZyB2b2ljZSBjYWxsIGZyb20gJShuYW1lKXNcIiwge25hbWU6IGNhbGxlcn0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmluY29taW5nQ2FsbC50eXBlID09PSBcInZpZGVvXCIpIHtcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGxUZXh0ID0gX3QoXCJJbmNvbWluZyB2aWRlbyBjYWxsIGZyb20gJShuYW1lKXNcIiwge25hbWU6IGNhbGxlcn0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGxUZXh0ID0gX3QoXCJJbmNvbWluZyBjYWxsIGZyb20gJShuYW1lKXNcIiwge25hbWU6IGNhbGxlcn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfSW5jb21pbmdDYWxsQm94XCIgaWQ9XCJpbmNvbWluZ0NhbGxCb3hcIj5cbiAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X0luY29taW5nQ2FsbEJveF9jaGV2cm9uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jaGV2cm9uLWxlZnQucG5nXCIpfSB3aWR0aD1cIjlcIiBoZWlnaHQ9XCIxNlwiIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbmNvbWluZ0NhbGxCb3hfdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBpbmNvbWluZ0NhbGxUZXh0IH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0luY29taW5nQ2FsbEJveF9idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfSW5jb21pbmdDYWxsQm94X2J1dHRvbnNfY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfSW5jb21pbmdDYWxsQm94X2J1dHRvbnNfZGVjbGluZVwiIG9uQ2xpY2s9e3RoaXMub25SZWplY3RDbGlja30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkRlY2xpbmVcIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbmNvbWluZ0NhbGxCb3hfYnV0dG9uc19jZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9JbmNvbWluZ0NhbGxCb3hfYnV0dG9uc19hY2NlcHRcIiBvbkNsaWNrPXt0aGlzLm9uQW5zd2VyQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJBY2NlcHRcIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuIl19