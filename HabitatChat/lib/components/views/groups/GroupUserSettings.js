"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

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
var _default = (0, _createReactClass.default)({
  displayName: 'GroupUserSettings',
  statics: {
    contextType: _MatrixClientContext.default
  },

  getInitialState() {
    return {
      error: null,
      groups: null
    };
  },

  componentDidMount: function () {
    this.context.getJoinedGroups().then(result => {
      this.setState({
        groups: result.groups || [],
        error: null
      });
    }, err => {
      console.error(err);
      this.setState({
        groups: null,
        error: err
      });
    });
  },

  render() {
    let text = "";
    let groupPublicityToggles = null;
    const groups = this.state.groups;

    if (this.state.error) {
      text = (0, _languageHandler._t)('Something went wrong when trying to get your communities.');
    } else if (groups === null) {
      text = (0, _languageHandler._t)('Loading...');
    } else if (groups.length > 0) {
      const GroupPublicityToggle = sdk.getComponent('groups.GroupPublicityToggle');
      groupPublicityToggles = groups.map((groupId, index) => {
        return /*#__PURE__*/_react.default.createElement(GroupPublicityToggle, {
          key: index,
          groupId: groupId
        });
      });
      text = (0, _languageHandler._t)('Display your community flair in rooms configured to show it.');
    } else {
      text = (0, _languageHandler._t)("You're not currently a member of any communities.");
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", {
      className: "mx_SettingsTab_subsectionText"
    }, text), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, groupPublicityToggles));
  }

});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dyb3Vwcy9Hcm91cFVzZXJTZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInN0YXRpY3MiLCJjb250ZXh0VHlwZSIsIk1hdHJpeENsaWVudENvbnRleHQiLCJnZXRJbml0aWFsU3RhdGUiLCJlcnJvciIsImdyb3VwcyIsImNvbXBvbmVudERpZE1vdW50IiwiY29udGV4dCIsImdldEpvaW5lZEdyb3VwcyIsInRoZW4iLCJyZXN1bHQiLCJzZXRTdGF0ZSIsImVyciIsImNvbnNvbGUiLCJyZW5kZXIiLCJ0ZXh0IiwiZ3JvdXBQdWJsaWNpdHlUb2dnbGVzIiwic3RhdGUiLCJsZW5ndGgiLCJHcm91cFB1YmxpY2l0eVRvZ2dsZSIsInNkayIsImdldENvbXBvbmVudCIsIm1hcCIsImdyb3VwSWQiLCJpbmRleCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7ZUFzQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsbUJBRGU7QUFHNUJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxXQUFXLEVBQUVDO0FBRFIsR0FIbUI7O0FBTzVCQyxFQUFBQSxlQUFlLEdBQUc7QUFDZCxXQUFPO0FBQ0hDLE1BQUFBLEtBQUssRUFBRSxJQURKO0FBRUhDLE1BQUFBLE1BQU0sRUFBRTtBQUZMLEtBQVA7QUFJSCxHQVoyQjs7QUFjNUJDLEVBQUFBLGlCQUFpQixFQUFFLFlBQVc7QUFDMUIsU0FBS0MsT0FBTCxDQUFhQyxlQUFiLEdBQStCQyxJQUEvQixDQUFxQ0MsTUFBRCxJQUFZO0FBQzVDLFdBQUtDLFFBQUwsQ0FBYztBQUFDTixRQUFBQSxNQUFNLEVBQUVLLE1BQU0sQ0FBQ0wsTUFBUCxJQUFpQixFQUExQjtBQUE4QkQsUUFBQUEsS0FBSyxFQUFFO0FBQXJDLE9BQWQ7QUFDSCxLQUZELEVBRUlRLEdBQUQsSUFBUztBQUNSQyxNQUFBQSxPQUFPLENBQUNULEtBQVIsQ0FBY1EsR0FBZDtBQUNBLFdBQUtELFFBQUwsQ0FBYztBQUFDTixRQUFBQSxNQUFNLEVBQUUsSUFBVDtBQUFlRCxRQUFBQSxLQUFLLEVBQUVRO0FBQXRCLE9BQWQ7QUFDSCxLQUxEO0FBTUgsR0FyQjJCOztBQXVCNUJFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUlDLElBQUksR0FBRyxFQUFYO0FBQ0EsUUFBSUMscUJBQXFCLEdBQUcsSUFBNUI7QUFDQSxVQUFNWCxNQUFNLEdBQUcsS0FBS1ksS0FBTCxDQUFXWixNQUExQjs7QUFFQSxRQUFJLEtBQUtZLEtBQUwsQ0FBV2IsS0FBZixFQUFzQjtBQUNsQlcsTUFBQUEsSUFBSSxHQUFHLHlCQUFHLDJEQUFILENBQVA7QUFDSCxLQUZELE1BRU8sSUFBSVYsTUFBTSxLQUFLLElBQWYsRUFBcUI7QUFDeEJVLE1BQUFBLElBQUksR0FBRyx5QkFBRyxZQUFILENBQVA7QUFDSCxLQUZNLE1BRUEsSUFBSVYsTUFBTSxDQUFDYSxNQUFQLEdBQWdCLENBQXBCLEVBQXVCO0FBQzFCLFlBQU1DLG9CQUFvQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsNkJBQWpCLENBQTdCO0FBQ0FMLE1BQUFBLHFCQUFxQixHQUFHWCxNQUFNLENBQUNpQixHQUFQLENBQVcsQ0FBQ0MsT0FBRCxFQUFVQyxLQUFWLEtBQW9CO0FBQ25ELDRCQUFPLDZCQUFDLG9CQUFEO0FBQXNCLFVBQUEsR0FBRyxFQUFFQSxLQUEzQjtBQUFrQyxVQUFBLE9BQU8sRUFBRUQ7QUFBM0MsVUFBUDtBQUNILE9BRnVCLENBQXhCO0FBR0FSLE1BQUFBLElBQUksR0FBRyx5QkFBRyw4REFBSCxDQUFQO0FBQ0gsS0FOTSxNQU1BO0FBQ0hBLE1BQUFBLElBQUksR0FBRyx5QkFBRyxtREFBSCxDQUFQO0FBQ0g7O0FBRUQsd0JBQ0ksdURBQ0k7QUFBRyxNQUFBLFNBQVMsRUFBQztBQUFiLE9BQStDQSxJQUEvQyxDQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ01DLHFCQUROLENBRkosQ0FESjtBQVFIOztBQWxEMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnR3JvdXBVc2VyU2V0dGluZ3MnLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICBjb250ZXh0VHlwZTogTWF0cml4Q2xpZW50Q29udGV4dCxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICBncm91cHM6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdldEpvaW5lZEdyb3VwcygpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Z3JvdXBzOiByZXN1bHQuZ3JvdXBzIHx8IFtdLCBlcnJvcjogbnVsbH0pO1xuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtncm91cHM6IG51bGwsIGVycm9yOiBlcnJ9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xuICAgICAgICBsZXQgZ3JvdXBQdWJsaWNpdHlUb2dnbGVzID0gbnVsbDtcbiAgICAgICAgY29uc3QgZ3JvdXBzID0gdGhpcy5zdGF0ZS5ncm91cHM7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3IpIHtcbiAgICAgICAgICAgIHRleHQgPSBfdCgnU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2hlbiB0cnlpbmcgdG8gZ2V0IHlvdXIgY29tbXVuaXRpZXMuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBzID09PSBudWxsKSB7XG4gICAgICAgICAgICB0ZXh0ID0gX3QoJ0xvYWRpbmcuLi4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChncm91cHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgR3JvdXBQdWJsaWNpdHlUb2dnbGUgPSBzZGsuZ2V0Q29tcG9uZW50KCdncm91cHMuR3JvdXBQdWJsaWNpdHlUb2dnbGUnKTtcbiAgICAgICAgICAgIGdyb3VwUHVibGljaXR5VG9nZ2xlcyA9IGdyb3Vwcy5tYXAoKGdyb3VwSWQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxHcm91cFB1YmxpY2l0eVRvZ2dsZSBrZXk9e2luZGV4fSBncm91cElkPXtncm91cElkfSAvPjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGV4dCA9IF90KCdEaXNwbGF5IHlvdXIgY29tbXVuaXR5IGZsYWlyIGluIHJvb21zIGNvbmZpZ3VyZWQgdG8gc2hvdyBpdC4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIllvdSdyZSBub3QgY3VycmVudGx5IGEgbWVtYmVyIG9mIGFueSBjb21tdW5pdGllcy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dFwiPnsgdGV4dCB9PC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHsgZ3JvdXBQdWJsaWNpdHlUb2dnbGVzIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==