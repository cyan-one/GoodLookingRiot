"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _Notifier = _interopRequireDefault(require("../../../Notifier"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

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
  displayName: 'EnableNotificationsButton',
  componentDidMount: function () {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
  },
  componentWillUnmount: function () {
    _dispatcher.default.unregister(this.dispatcherRef);
  },
  onAction: function (payload) {
    if (payload.action !== "notifier_enabled") {
      return;
    }

    this.forceUpdate();
  },
  enabled: function () {
    return _Notifier.default.isEnabled();
  },
  onClick: function () {
    const self = this;

    if (!_Notifier.default.supportsDesktopNotifications()) {
      return;
    }

    if (!_Notifier.default.isEnabled()) {
      _Notifier.default.setEnabled(true, function () {
        self.forceUpdate();
      });
    } else {
      _Notifier.default.setEnabled(false);
    }

    this.forceUpdate();
  },
  render: function () {
    if (this.enabled()) {
      return /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_EnableNotificationsButton",
        onClick: this.onClick
      }, (0, _languageHandler._t)("Disable Notifications"));
    } else {
      return /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_EnableNotificationsButton",
        onClick: this.onClick
      }, (0, _languageHandler._t)("Enable Notifications"));
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0VuYWJsZU5vdGlmaWNhdGlvbnNCdXR0b24uanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJjb21wb25lbnREaWRNb3VudCIsImRpc3BhdGNoZXJSZWYiLCJkaXMiLCJyZWdpc3RlciIsIm9uQWN0aW9uIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwicGF5bG9hZCIsImFjdGlvbiIsImZvcmNlVXBkYXRlIiwiZW5hYmxlZCIsIk5vdGlmaWVyIiwiaXNFbmFibGVkIiwib25DbGljayIsInNlbGYiLCJzdXBwb3J0c0Rlc2t0b3BOb3RpZmljYXRpb25zIiwic2V0RW5hYmxlZCIsInJlbmRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O2VBc0JlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLDJCQURlO0FBRzVCQyxFQUFBQSxpQkFBaUIsRUFBRSxZQUFXO0FBQzFCLFNBQUtDLGFBQUwsR0FBcUJDLG9CQUFJQyxRQUFKLENBQWEsS0FBS0MsUUFBbEIsQ0FBckI7QUFDSCxHQUwyQjtBQU81QkMsRUFBQUEsb0JBQW9CLEVBQUUsWUFBVztBQUM3Qkgsd0JBQUlJLFVBQUosQ0FBZSxLQUFLTCxhQUFwQjtBQUNILEdBVDJCO0FBVzVCRyxFQUFBQSxRQUFRLEVBQUUsVUFBU0csT0FBVCxFQUFrQjtBQUN4QixRQUFJQSxPQUFPLENBQUNDLE1BQVIsS0FBbUIsa0JBQXZCLEVBQTJDO0FBQ3ZDO0FBQ0g7O0FBQ0QsU0FBS0MsV0FBTDtBQUNILEdBaEIyQjtBQWtCNUJDLEVBQUFBLE9BQU8sRUFBRSxZQUFXO0FBQ2hCLFdBQU9DLGtCQUFTQyxTQUFULEVBQVA7QUFDSCxHQXBCMkI7QUFzQjVCQyxFQUFBQSxPQUFPLEVBQUUsWUFBVztBQUNoQixVQUFNQyxJQUFJLEdBQUcsSUFBYjs7QUFDQSxRQUFJLENBQUNILGtCQUFTSSw0QkFBVCxFQUFMLEVBQThDO0FBQzFDO0FBQ0g7O0FBQ0QsUUFBSSxDQUFDSixrQkFBU0MsU0FBVCxFQUFMLEVBQTJCO0FBQ3ZCRCx3QkFBU0ssVUFBVCxDQUFvQixJQUFwQixFQUEwQixZQUFXO0FBQ2pDRixRQUFBQSxJQUFJLENBQUNMLFdBQUw7QUFDSCxPQUZEO0FBR0gsS0FKRCxNQUlPO0FBQ0hFLHdCQUFTSyxVQUFULENBQW9CLEtBQXBCO0FBQ0g7O0FBQ0QsU0FBS1AsV0FBTDtBQUNILEdBbkMyQjtBQXFDNUJRLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsUUFBSSxLQUFLUCxPQUFMLEVBQUosRUFBb0I7QUFDaEIsMEJBQ0k7QUFBUSxRQUFBLFNBQVMsRUFBQyw4QkFBbEI7QUFBaUQsUUFBQSxPQUFPLEVBQUUsS0FBS0c7QUFBL0QsU0FDTSx5QkFBRyx1QkFBSCxDQUROLENBREo7QUFLSCxLQU5ELE1BTU87QUFDSCwwQkFDSTtBQUFRLFFBQUEsU0FBUyxFQUFDLDhCQUFsQjtBQUFpRCxRQUFBLE9BQU8sRUFBRSxLQUFLQTtBQUEvRCxTQUNNLHlCQUFHLHNCQUFILENBRE4sQ0FESjtBQUtIO0FBQ0o7QUFuRDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IE5vdGlmaWVyIGZyb20gXCIuLi8uLi8uLi9Ob3RpZmllclwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnRW5hYmxlTm90aWZpY2F0aW9uc0J1dHRvbicsXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLmRpc3BhdGNoZXJSZWYpO1xuICAgIH0sXG5cbiAgICBvbkFjdGlvbjogZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgICAgICBpZiAocGF5bG9hZC5hY3Rpb24gIT09IFwibm90aWZpZXJfZW5hYmxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBlbmFibGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE5vdGlmaWVyLmlzRW5hYmxlZCgpO1xuICAgIH0sXG5cbiAgICBvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICghTm90aWZpZXIuc3VwcG9ydHNEZXNrdG9wTm90aWZpY2F0aW9ucygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFOb3RpZmllci5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgTm90aWZpZXIuc2V0RW5hYmxlZCh0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE5vdGlmaWVyLnNldEVuYWJsZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwibXhfRW5hYmxlTm90aWZpY2F0aW9uc0J1dHRvblwiIG9uQ2xpY2s9e3RoaXMub25DbGlja30+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJEaXNhYmxlIE5vdGlmaWNhdGlvbnNcIikgfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJteF9FbmFibGVOb3RpZmljYXRpb25zQnV0dG9uXCIgb25DbGljaz17dGhpcy5vbkNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIkVuYWJsZSBOb3RpZmljYXRpb25zXCIpIH1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=