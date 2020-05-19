"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _languageHandler = require("../../../languageHandler");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2019 New Vector Ltd

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
var _default = props => {
  let badge;

  if (props.numUnreadMessages) {
    badge = /*#__PURE__*/React.createElement("div", {
      className: "mx_JumpToBottomButton_badge"
    }, props.numUnreadMessages);
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "mx_JumpToBottomButton"
  }, /*#__PURE__*/React.createElement(_AccessibleButton.default, {
    className: "mx_JumpToBottomButton_scrollDown",
    title: (0, _languageHandler._t)("Scroll to most recent messages"),
    onClick: props.onScrollToBottomClick
  }), badge);
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0p1bXBUb0JvdHRvbUJ1dHRvbi5qcyJdLCJuYW1lcyI6WyJwcm9wcyIsImJhZGdlIiwibnVtVW5yZWFkTWVzc2FnZXMiLCJvblNjcm9sbFRvQm90dG9tQ2xpY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztlQW1CZ0JBLEtBQUQsSUFBVztBQUN0QixNQUFJQyxLQUFKOztBQUNBLE1BQUlELEtBQUssQ0FBQ0UsaUJBQVYsRUFBNkI7QUFDekJELElBQUFBLEtBQUssZ0JBQUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQThDRCxLQUFLLENBQUNFLGlCQUFwRCxDQUFUO0FBQ0g7O0FBQ0Qsc0JBQVE7QUFBSyxJQUFBLFNBQVMsRUFBQztBQUFmLGtCQUNKLG9CQUFDLHlCQUFEO0FBQWtCLElBQUEsU0FBUyxFQUFDLGtDQUE1QjtBQUNJLElBQUEsS0FBSyxFQUFFLHlCQUFHLGdDQUFILENBRFg7QUFFSSxJQUFBLE9BQU8sRUFBRUYsS0FBSyxDQUFDRztBQUZuQixJQURJLEVBS0ZGLEtBTEUsQ0FBUjtBQU9ILEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tICcuLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uJztcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gICAgbGV0IGJhZGdlO1xuICAgIGlmIChwcm9wcy5udW1VbnJlYWRNZXNzYWdlcykge1xuICAgICAgICBiYWRnZSA9ICg8ZGl2IGNsYXNzTmFtZT1cIm14X0p1bXBUb0JvdHRvbUJ1dHRvbl9iYWRnZVwiPntwcm9wcy5udW1VbnJlYWRNZXNzYWdlc308L2Rpdj4pO1xuICAgIH1cbiAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lPVwibXhfSnVtcFRvQm90dG9tQnV0dG9uXCI+XG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0p1bXBUb0JvdHRvbUJ1dHRvbl9zY3JvbGxEb3duXCJcbiAgICAgICAgICAgIHRpdGxlPXtfdChcIlNjcm9sbCB0byBtb3N0IHJlY2VudCBtZXNzYWdlc1wiKX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e3Byb3BzLm9uU2Nyb2xsVG9Cb3R0b21DbGlja30+XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgeyBiYWRnZSB9XG4gICAgPC9kaXY+KTtcbn07XG4iXX0=