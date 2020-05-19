"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var _Keyboard = require("../../../Keyboard");

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
  displayName: 'SearchBar',
  getInitialState: function () {
    return {
      scope: 'Room'
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._search_term = (0, _react.createRef)();
  },
  onThisRoomClick: function () {
    this.setState({
      scope: 'Room'
    }, () => this._searchIfQuery());
  },
  onAllRoomsClick: function () {
    this.setState({
      scope: 'All'
    }, () => this._searchIfQuery());
  },
  onSearchChange: function (e) {
    switch (e.key) {
      case _Keyboard.Key.ENTER:
        this.onSearch();
        break;

      case _Keyboard.Key.ESCAPE:
        this.props.onCancelClick();
        break;
    }
  },
  _searchIfQuery: function () {
    if (this._search_term.current.value) {
      this.onSearch();
    }
  },
  onSearch: function () {
    this.props.onSearch(this._search_term.current.value, this.state.scope);
  },
  render: function () {
    const searchButtonClasses = (0, _classnames.default)("mx_SearchBar_searchButton", {
      mx_SearchBar_searching: this.props.searchInProgress
    });
    const thisRoomClasses = (0, _classnames.default)("mx_SearchBar_button", {
      mx_SearchBar_unselected: this.state.scope !== 'Room'
    });
    const allRoomsClasses = (0, _classnames.default)("mx_SearchBar_button", {
      mx_SearchBar_unselected: this.state.scope !== 'All'
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SearchBar"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SearchBar_buttons",
      role: "radiogroup"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: thisRoomClasses,
      onClick: this.onThisRoomClick,
      "aria-checked": this.state.scope === 'Room',
      role: "radio"
    }, (0, _languageHandler._t)("This Room")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: allRoomsClasses,
      onClick: this.onAllRoomsClick,
      "aria-checked": this.state.scope === 'All',
      role: "radio"
    }, (0, _languageHandler._t)("All Rooms"))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SearchBar_input mx_textinput"
    }, /*#__PURE__*/_react.default.createElement("input", {
      ref: this._search_term,
      type: "text",
      autoFocus: true,
      placeholder: (0, _languageHandler._t)("Search…"),
      onKeyDown: this.onSearchChange
    }), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: searchButtonClasses,
      onClick: this.onSearch
    })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_SearchBar_cancel",
      onClick: this.props.onCancelClick
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1NlYXJjaEJhci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsImdldEluaXRpYWxTdGF0ZSIsInNjb3BlIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl9zZWFyY2hfdGVybSIsIm9uVGhpc1Jvb21DbGljayIsInNldFN0YXRlIiwiX3NlYXJjaElmUXVlcnkiLCJvbkFsbFJvb21zQ2xpY2siLCJvblNlYXJjaENoYW5nZSIsImUiLCJrZXkiLCJLZXkiLCJFTlRFUiIsIm9uU2VhcmNoIiwiRVNDQVBFIiwicHJvcHMiLCJvbkNhbmNlbENsaWNrIiwiY3VycmVudCIsInZhbHVlIiwic3RhdGUiLCJyZW5kZXIiLCJzZWFyY2hCdXR0b25DbGFzc2VzIiwibXhfU2VhcmNoQmFyX3NlYXJjaGluZyIsInNlYXJjaEluUHJvZ3Jlc3MiLCJ0aGlzUm9vbUNsYXNzZXMiLCJteF9TZWFyY2hCYXJfdW5zZWxlY3RlZCIsImFsbFJvb21zQ2xhc3NlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7ZUF1QmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsV0FEZTtBQUc1QkMsRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsV0FBUTtBQUNKQyxNQUFBQSxLQUFLLEVBQUU7QUFESCxLQUFSO0FBR0gsR0FQMkI7QUFTNUI7QUFDQUMsRUFBQUEseUJBQXlCLEVBQUUsWUFBVztBQUNsQyxTQUFLQyxZQUFMLEdBQW9CLHVCQUFwQjtBQUNILEdBWjJCO0FBYzVCQyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixTQUFLQyxRQUFMLENBQWM7QUFBRUosTUFBQUEsS0FBSyxFQUFFO0FBQVQsS0FBZCxFQUFpQyxNQUFNLEtBQUtLLGNBQUwsRUFBdkM7QUFDSCxHQWhCMkI7QUFrQjVCQyxFQUFBQSxl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Z2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7S2V5fSBmcm9tIFwiLi4vLi4vLi4vS2V5Ym9hcmRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdTZWFyY2hCYXInLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICh7XG4gICAgICAgICAgICBzY29wZTogJ1Jvb20nLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2UgY29tcG9uZW50IHdpdGggcmVhbCBjbGFzcywgdXNlIGNvbnN0cnVjdG9yIGZvciByZWZzXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3NlYXJjaF90ZXJtID0gY3JlYXRlUmVmKCk7XG4gICAgfSxcblxuICAgIG9uVGhpc1Jvb21DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBzY29wZTogJ1Jvb20nIH0sICgpID0+IHRoaXMuX3NlYXJjaElmUXVlcnkoKSk7XG4gICAgfSxcblxuICAgIG9uQWxsUm9vbXNDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBzY29wZTogJ0FsbCcgfSwgKCkgPT4gdGhpcy5fc2VhcmNoSWZRdWVyeSgpKTtcbiAgICB9LFxuXG4gICAgb25TZWFyY2hDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc3dpdGNoIChlLmtleSkge1xuICAgICAgICAgICAgY2FzZSBLZXkuRU5URVI6XG4gICAgICAgICAgICAgICAgdGhpcy5vblNlYXJjaCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBLZXkuRVNDQVBFOlxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25DYW5jZWxDbGljaygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9zZWFyY2hJZlF1ZXJ5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlYXJjaF90ZXJtLmN1cnJlbnQudmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMub25TZWFyY2goKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblNlYXJjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWFyY2godGhpcy5fc2VhcmNoX3Rlcm0uY3VycmVudC52YWx1ZSwgdGhpcy5zdGF0ZS5zY29wZSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaEJ1dHRvbkNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfU2VhcmNoQmFyX3NlYXJjaEJ1dHRvblwiLCB7XG4gICAgICAgICAgICBteF9TZWFyY2hCYXJfc2VhcmNoaW5nOiB0aGlzLnByb3BzLnNlYXJjaEluUHJvZ3Jlc3MsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0aGlzUm9vbUNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfU2VhcmNoQmFyX2J1dHRvblwiLCB7XG4gICAgICAgICAgICBteF9TZWFyY2hCYXJfdW5zZWxlY3RlZDogdGhpcy5zdGF0ZS5zY29wZSAhPT0gJ1Jvb20nLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWxsUm9vbXNDbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X1NlYXJjaEJhcl9idXR0b25cIiwge1xuICAgICAgICAgICAgbXhfU2VhcmNoQmFyX3Vuc2VsZWN0ZWQ6IHRoaXMuc3RhdGUuc2NvcGUgIT09ICdBbGwnLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZWFyY2hCYXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NlYXJjaEJhcl9idXR0b25zXCIgcm9sZT1cInJhZGlvZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPXsgdGhpc1Jvb21DbGFzc2VzIH0gb25DbGljaz17dGhpcy5vblRoaXNSb29tQ2xpY2t9IGFyaWEtY2hlY2tlZD17dGhpcy5zdGF0ZS5zY29wZSA9PT0gJ1Jvb20nfSByb2xlPVwicmFkaW9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlRoaXMgUm9vbVwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9eyBhbGxSb29tc0NsYXNzZXMgfSBvbkNsaWNrPXt0aGlzLm9uQWxsUm9vbXNDbGlja30gYXJpYS1jaGVja2VkPXt0aGlzLnN0YXRlLnNjb3BlID09PSAnQWxsJ30gcm9sZT1cInJhZGlvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJBbGwgUm9vbXNcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NlYXJjaEJhcl9pbnB1dCBteF90ZXh0aW5wdXRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHJlZj17dGhpcy5fc2VhcmNoX3Rlcm19IHR5cGU9XCJ0ZXh0XCIgYXV0b0ZvY3VzPXt0cnVlfSBwbGFjZWhvbGRlcj17X3QoXCJTZWFyY2jigKZcIil9IG9uS2V5RG93bj17dGhpcy5vblNlYXJjaENoYW5nZX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPXsgc2VhcmNoQnV0dG9uQ2xhc3NlcyB9IG9uQ2xpY2s9e3RoaXMub25TZWFyY2h9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfU2VhcmNoQmFyX2NhbmNlbFwiIG9uQ2xpY2s9e3RoaXMucHJvcHMub25DYW5jZWxDbGlja30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==