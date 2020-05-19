"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd

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
  displayName: 'PresenceLabel',
  propTypes: {
    // number of milliseconds ago this user was last active.
    // zero = unknown
    activeAgo: _propTypes.default.number,
    // if true, activeAgo is an approximation and "Now" should
    // be shown instead
    currentlyActive: _propTypes.default.bool,
    // offline, online, etc
    presenceState: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      ago: -1,
      presenceState: null
    };
  },
  // Return duration as a string using appropriate time units
  // XXX: This would be better handled using a culture-aware library, but we don't use one yet.
  getDuration: function (time) {
    if (!time) return;
    const t = parseInt(time / 1000);
    const s = t % 60;
    const m = parseInt(t / 60) % 60;
    const h = parseInt(t / (60 * 60)) % 24;
    const d = parseInt(t / (60 * 60 * 24));

    if (t < 60) {
      if (t < 0) {
        return (0, _languageHandler._t)("%(duration)ss", {
          duration: 0
        });
      }

      return (0, _languageHandler._t)("%(duration)ss", {
        duration: s
      });
    }

    if (t < 60 * 60) {
      return (0, _languageHandler._t)("%(duration)sm", {
        duration: m
      });
    }

    if (t < 24 * 60 * 60) {
      return (0, _languageHandler._t)("%(duration)sh", {
        duration: h
      });
    }

    return (0, _languageHandler._t)("%(duration)sd", {
      duration: d
    });
  },
  getPrettyPresence: function (presence, activeAgo, currentlyActive) {
    if (!currentlyActive && activeAgo !== undefined && activeAgo > 0) {
      const duration = this.getDuration(activeAgo);
      if (presence === "online") return (0, _languageHandler._t)("Online for %(duration)s", {
        duration: duration
      });
      if (presence === "unavailable") return (0, _languageHandler._t)("Idle for %(duration)s", {
        duration: duration
      }); // XXX: is this actually right?

      if (presence === "offline") return (0, _languageHandler._t)("Offline for %(duration)s", {
        duration: duration
      });
      return (0, _languageHandler._t)("Unknown for %(duration)s", {
        duration: duration
      });
    } else {
      if (presence === "online") return (0, _languageHandler._t)("Online");
      if (presence === "unavailable") return (0, _languageHandler._t)("Idle"); // XXX: is this actually right?

      if (presence === "offline") return (0, _languageHandler._t)("Offline");
      return (0, _languageHandler._t)("Unknown");
    }
  },
  render: function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PresenceLabel"
    }, this.getPrettyPresence(this.props.presenceState, this.props.activeAgo, this.props.currentlyActive));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1ByZXNlbmNlTGFiZWwuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJhY3RpdmVBZ28iLCJQcm9wVHlwZXMiLCJudW1iZXIiLCJjdXJyZW50bHlBY3RpdmUiLCJib29sIiwicHJlc2VuY2VTdGF0ZSIsInN0cmluZyIsImdldERlZmF1bHRQcm9wcyIsImFnbyIsImdldER1cmF0aW9uIiwidGltZSIsInQiLCJwYXJzZUludCIsInMiLCJtIiwiaCIsImQiLCJkdXJhdGlvbiIsImdldFByZXR0eVByZXNlbmNlIiwicHJlc2VuY2UiLCJ1bmRlZmluZWQiLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUVBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O2VBdUJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLGVBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQO0FBQ0E7QUFDQUMsSUFBQUEsU0FBUyxFQUFFQyxtQkFBVUMsTUFIZDtBQUtQO0FBQ0E7QUFDQUMsSUFBQUEsZUFBZSxFQUFFRixtQkFBVUcsSUFQcEI7QUFTUDtBQUNBQyxJQUFBQSxhQUFhLEVBQUVKLG1CQUFVSztBQVZsQixHQUhpQjtBQWdCNUJDLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSEMsTUFBQUEsR0FBRyxFQUFFLENBQUMsQ0FESDtBQUVISCxNQUFBQSxhQUFhLEVBQUU7QUFGWixLQUFQO0FBSUgsR0FyQjJCO0FBdUI1QjtBQUNBO0FBQ0FJLEVBQUFBLFdBQVcsRUFBRSxVQUFTQyxJQUFULEVBQWU7QUFDeEIsUUFBSSxDQUFDQSxJQUFMLEVBQVc7QUFDWCxVQUFNQyxDQUFDLEdBQUdDLFFBQVEsQ0FBQ0YsSUFBSSxHQUFHLElBQVIsQ0FBbEI7QUFDQSxVQUFNRyxDQUFDLEdBQUdGLENBQUMsR0FBRyxFQUFk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bkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuXG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdQcmVzZW5jZUxhYmVsJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGFnbyB0aGlzIHVzZXIgd2FzIGxhc3QgYWN0aXZlLlxuICAgICAgICAvLyB6ZXJvID0gdW5rbm93blxuICAgICAgICBhY3RpdmVBZ286IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgICAgICAgLy8gaWYgdHJ1ZSwgYWN0aXZlQWdvIGlzIGFuIGFwcHJveGltYXRpb24gYW5kIFwiTm93XCIgc2hvdWxkXG4gICAgICAgIC8vIGJlIHNob3duIGluc3RlYWRcbiAgICAgICAgY3VycmVudGx5QWN0aXZlOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBvZmZsaW5lLCBvbmxpbmUsIGV0Y1xuICAgICAgICBwcmVzZW5jZVN0YXRlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWdvOiAtMSxcbiAgICAgICAgICAgIHByZXNlbmNlU3RhdGU6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIFJldHVybiBkdXJhdGlvbiBhcyBhIHN0cmluZyB1c2luZyBhcHByb3ByaWF0ZSB0aW1lIHVuaXRzXG4gICAgLy8gWFhYOiBUaGlzIHdvdWxkIGJlIGJldHRlciBoYW5kbGVkIHVzaW5nIGEgY3VsdHVyZS1hd2FyZSBsaWJyYXJ5LCBidXQgd2UgZG9uJ3QgdXNlIG9uZSB5ZXQuXG4gICAgZ2V0RHVyYXRpb246IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKCF0aW1lKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHQgPSBwYXJzZUludCh0aW1lIC8gMTAwMCk7XG4gICAgICAgIGNvbnN0IHMgPSB0ICUgNjA7XG4gICAgICAgIGNvbnN0IG0gPSBwYXJzZUludCh0IC8gNjApICUgNjA7XG4gICAgICAgIGNvbnN0IGggPSBwYXJzZUludCh0IC8gKDYwICogNjApKSAlIDI0O1xuICAgICAgICBjb25zdCBkID0gcGFyc2VJbnQodCAvICg2MCAqIDYwICogMjQpKTtcbiAgICAgICAgaWYgKHQgPCA2MCkge1xuICAgICAgICAgICAgaWYgKHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KFwiJShkdXJhdGlvbilzc1wiLCB7ZHVyYXRpb246IDB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfdChcIiUoZHVyYXRpb24pc3NcIiwge2R1cmF0aW9uOiBzfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQgPCA2MCAqIDYwKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKGR1cmF0aW9uKXNtXCIsIHtkdXJhdGlvbjogbX0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0IDwgMjQgKiA2MCAqIDYwKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKGR1cmF0aW9uKXNoXCIsIHtkdXJhdGlvbjogaH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfdChcIiUoZHVyYXRpb24pc2RcIiwge2R1cmF0aW9uOiBkfSk7XG4gICAgfSxcblxuICAgIGdldFByZXR0eVByZXNlbmNlOiBmdW5jdGlvbihwcmVzZW5jZSwgYWN0aXZlQWdvLCBjdXJyZW50bHlBY3RpdmUpIHtcbiAgICAgICAgaWYgKCFjdXJyZW50bHlBY3RpdmUgJiYgYWN0aXZlQWdvICE9PSB1bmRlZmluZWQgJiYgYWN0aXZlQWdvID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb24gPSB0aGlzLmdldER1cmF0aW9uKGFjdGl2ZUFnbyk7XG4gICAgICAgICAgICBpZiAocHJlc2VuY2UgPT09IFwib25saW5lXCIpIHJldHVybiBfdChcIk9ubGluZSBmb3IgJShkdXJhdGlvbilzXCIsIHsgZHVyYXRpb246IGR1cmF0aW9uIH0pO1xuICAgICAgICAgICAgaWYgKHByZXNlbmNlID09PSBcInVuYXZhaWxhYmxlXCIpIHJldHVybiBfdChcIklkbGUgZm9yICUoZHVyYXRpb24pc1wiLCB7IGR1cmF0aW9uOiBkdXJhdGlvbiB9KTsgLy8gWFhYOiBpcyB0aGlzIGFjdHVhbGx5IHJpZ2h0P1xuICAgICAgICAgICAgaWYgKHByZXNlbmNlID09PSBcIm9mZmxpbmVcIikgcmV0dXJuIF90KFwiT2ZmbGluZSBmb3IgJShkdXJhdGlvbilzXCIsIHsgZHVyYXRpb246IGR1cmF0aW9uIH0pO1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiVW5rbm93biBmb3IgJShkdXJhdGlvbilzXCIsIHsgZHVyYXRpb246IGR1cmF0aW9uIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHByZXNlbmNlID09PSBcIm9ubGluZVwiKSByZXR1cm4gX3QoXCJPbmxpbmVcIik7XG4gICAgICAgICAgICBpZiAocHJlc2VuY2UgPT09IFwidW5hdmFpbGFibGVcIikgcmV0dXJuIF90KFwiSWRsZVwiKTsgLy8gWFhYOiBpcyB0aGlzIGFjdHVhbGx5IHJpZ2h0P1xuICAgICAgICAgICAgaWYgKHByZXNlbmNlID09PSBcIm9mZmxpbmVcIikgcmV0dXJuIF90KFwiT2ZmbGluZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBfdChcIlVua25vd25cIik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUHJlc2VuY2VMYWJlbFwiPlxuICAgICAgICAgICAgICAgIHsgdGhpcy5nZXRQcmV0dHlQcmVzZW5jZSh0aGlzLnByb3BzLnByZXNlbmNlU3RhdGUsIHRoaXMucHJvcHMuYWN0aXZlQWdvLCB0aGlzLnByb3BzLmN1cnJlbnRseUFjdGl2ZSkgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19