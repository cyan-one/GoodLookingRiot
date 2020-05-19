"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
  displayName: 'UserSelector',
  propTypes: {
    onChange: _propTypes.default.func,
    selected_users: _propTypes.default.arrayOf(_propTypes.default.string)
  },
  getDefaultProps: function () {
    return {
      onChange: function () {},
      selected: []
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._user_id_input = (0, _react.createRef)();
  },
  addUser: function (user_id) {
    if (this.props.selected_users.indexOf(user_id == -1)) {
      this.props.onChange(this.props.selected_users.concat([user_id]));
    }
  },
  removeUser: function (user_id) {
    this.props.onChange(this.props.selected_users.filter(function (e) {
      return e != user_id;
    }));
  },
  onAddUserId: function () {
    this.addUser(this._user_id_input.current.value);
    this._user_id_input.current.value = "";
  },
  render: function () {
    const self = this;
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("ul", {
      className: "mx_UserSelector_UserIdList"
    }, this.props.selected_users.map(function (user_id, i) {
      return /*#__PURE__*/_react.default.createElement("li", {
        key: user_id
      }, user_id, " - ", /*#__PURE__*/_react.default.createElement("span", {
        onClick: function () {
          self.removeUser(user_id);
        }
      }, "X"));
    })), /*#__PURE__*/_react.default.createElement("input", {
      type: "text",
      ref: this._user_id_input,
      defaultValue: "",
      className: "mx_UserSelector_userIdInput",
      placeholder: (0, _languageHandler._t)("ex. @bob:example.com")
    }), /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onAddUserId,
      className: "mx_UserSelector_AddUserId"
    }, (0, _languageHandler._t)("Add User")));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1VzZXJTZWxlY3Rvci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsIm9uQ2hhbmdlIiwiUHJvcFR5cGVzIiwiZnVuYyIsInNlbGVjdGVkX3VzZXJzIiwiYXJyYXlPZiIsInN0cmluZyIsImdldERlZmF1bHRQcm9wcyIsInNlbGVjdGVkIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl91c2VyX2lkX2lucHV0IiwiYWRkVXNlciIsInVzZXJfaWQiLCJwcm9wcyIsImluZGV4T2YiLCJjb25jYXQiLCJyZW1vdmVVc2VyIiwiZmlsdGVyIiwiZSIsIm9uQWRkVXNlcklkIiwiY3VycmVudCIsInZhbHVlIiwicmVuZGVyIiwic2VsZiIsIm1hcCIsImkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7OztlQXNCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxjQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsUUFBUSxFQUFFQyxtQkFBVUMsSUFEYjtBQUVQQyxJQUFBQSxjQUFjLEVBQUVGLG1CQUFVRyxPQUFWLENBQWtCSCxtQkFBVUksTUFBNUI7QUFGVCxHQUhpQjtBQVE1QkMsRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsV0FBTztBQUNITixNQUFBQSxRQUFRLEVBQUUsWUFBVyxDQUFFLENBRHBCO0FBRUhPLE1BQUFBLFFBQVEsRUFBRTtBQUZQLEtBQVA7QUFJSCxHQWIyQjtBQWU1QjtBQUNBQyxFQUFBQSx5QkFBeUIsRUFBRSxZQUFXO0FBQ2xDLFNBQUtDLGNBQUwsR0FBc0IsdUJBQXRCO0FBQ0gsR0FsQjJCO0FBb0I1QkMsRUFBQUEsT0FBTyxFQUFFLFVBQVNDLE9BQVQsRUFBa0I7QUFDdkIsUUFBSSxLQUFLQyxLQUFMLENBQVdULGNBQVgsQ0FBMEJVLE9BQTFCLENBQWtDRixPQUFPLElBQUksQ0FBQyxDQUE5QyxDQUFKLEVBQXNEO0FBQ2xELFdBQUtDLEtBQUwsQ0FBV1osUUFBWCxDQUFvQixLQUFLWSxLQUFMLENBQVdULGNBQVgsQ0FBMEJXLE1BQTFCLENBQWlDLENBQUNILE9BQUQsQ0FBakMsQ0FBcEI7QUFDSDtBQUNKLEdBeEIyQjtBQTBCNUJJLEVBQUFBLFVBQVUsRUFBRSxVQUFTSixPQUFULEVBQWtCO0FBQzFCLFNBQUtDLEtBQUwsQ0FBV1osUUFBWCxDQUFvQixLQUFLWSxLQUFMLENBQVdULGNBQVgsQ0FBMEJhLE1BQTFCLENBQWlDLFVBQVNDLENBQVQsRUFBWTtBQUM3RCxhQUFPQSxDQUFDLElBQUlOLE9BQVo7QUFDSCxLQUZtQixDQUFwQjtBQUdILEdBOUIyQjtBQWdDNUJPLEVBQUFBLFdBQVcsRUFBRSxZQUFXO0FBQ3BCLFNBQUtSLE9BQUwsQ0FBYSxLQUFLRCxjQUFMLENBQW9CVSxPQUFwQixDQUE0QkMsS0FBekM7QUFDQSxTQUFLWCxjQUFMLENBQW9CVSxPQUFwQixDQUE0QkMsS0FBNUIsR0FBb0MsRUFBcEM7QUFDSCxHQW5DMkI7QUFxQzVCQyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLFVBQU1DLElBQUksR0FBRyxJQUFiO0FBQ0Esd0JBQ0ksdURBQ0k7QUFBSSxNQUFBLFNBQVMsRUFBQztBQUFkLE9BQ00sS0FBS1YsS0FBTCxDQUFXVCxjQUFYLENBQTBCb0IsR0FBMUIsQ0FBOEIsVUFBU1osT0FBVCxFQUFrQmEsQ0FBbEIsRUFBcUI7QUFDakQsMEJBQU87QUFBSSxRQUFBLEdBQUcsRUFBRWI7QUFBVCxTQUFvQkEsT0FBcEIsc0JBQWdDO0FBQU0sUUFBQSxPQUFPLEVBQUUsWUFBVztBQUFDVyxVQUFBQSxJQUFJLENBQUNQLFVBQUwsQ0FBZ0JKLE9BQWhCO0FBQTBCO0FBQXJELGFBQWhDLENBQVA7QUFDSCxLQUZDLENBRE4sQ0FESixlQU1JO0FBQU8sTUFBQSxJQUFJLEVBQUMsTUFBWjtBQUFtQixNQUFBLEdBQUcsRUFBRSxLQUFLRixjQUE3QjtBQUE2QyxNQUFBLFlBQVksRUFBQyxFQUExRDtBQUE2RCxNQUFBLFNBQVMsRUFBQyw2QkFBdkU7QUFBcUcsTUFBQSxXQUFXLEVBQUUseUJBQUcsc0JBQUg7QUFBbEgsTUFOSixlQU9JO0FBQVEsTUFBQSxPQUFPLEVBQUUsS0FBS1MsV0FBdEI7QUFBbUMsTUFBQSxTQUFTLEVBQUM7QUFBN0MsT0FDTSx5QkFBRyxVQUFILENBRE4sQ0FQSixDQURKO0FBYUg7QUFwRDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdVc2VyU2VsZWN0b3InLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgc2VsZWN0ZWRfdXNlcnM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5zdHJpbmcpLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBzZWxlY3RlZDogW10sXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIGNvbXBvbmVudCB3aXRoIHJlYWwgY2xhc3MsIHVzZSBjb25zdHJ1Y3RvciBmb3IgcmVmc1xuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91c2VyX2lkX2lucHV0ID0gY3JlYXRlUmVmKCk7XG4gICAgfSxcblxuICAgIGFkZFVzZXI6IGZ1bmN0aW9uKHVzZXJfaWQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2VsZWN0ZWRfdXNlcnMuaW5kZXhPZih1c2VyX2lkID09IC0xKSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh0aGlzLnByb3BzLnNlbGVjdGVkX3VzZXJzLmNvbmNhdChbdXNlcl9pZF0pKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW1vdmVVc2VyOiBmdW5jdGlvbih1c2VyX2lkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5wcm9wcy5zZWxlY3RlZF91c2Vycy5maWx0ZXIoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUgIT0gdXNlcl9pZDtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICBvbkFkZFVzZXJJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYWRkVXNlcih0aGlzLl91c2VyX2lkX2lucHV0LmN1cnJlbnQudmFsdWUpO1xuICAgICAgICB0aGlzLl91c2VyX2lkX2lucHV0LmN1cnJlbnQudmFsdWUgPSBcIlwiO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm14X1VzZXJTZWxlY3Rvcl9Vc2VySWRMaXN0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5zZWxlY3RlZF91c2Vycy5tYXAoZnVuY3Rpb24odXNlcl9pZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxsaSBrZXk9e3VzZXJfaWR9PnsgdXNlcl9pZCB9IC0gPHNwYW4gb25DbGljaz17ZnVuY3Rpb24oKSB7c2VsZi5yZW1vdmVVc2VyKHVzZXJfaWQpO319Plg8L3NwYW4+PC9saT47XG4gICAgICAgICAgICAgICAgICAgIH0pIH1cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIHJlZj17dGhpcy5fdXNlcl9pZF9pbnB1dH0gZGVmYXVsdFZhbHVlPVwiXCIgY2xhc3NOYW1lPVwibXhfVXNlclNlbGVjdG9yX3VzZXJJZElucHV0XCIgcGxhY2Vob2xkZXI9e190KFwiZXguIEBib2I6ZXhhbXBsZS5jb21cIil9IC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLm9uQWRkVXNlcklkfSBjbGFzc05hbWU9XCJteF9Vc2VyU2VsZWN0b3JfQWRkVXNlcklkXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJBZGQgVXNlclwiKSB9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=