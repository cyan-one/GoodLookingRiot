"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../languageHandler");

var _SlashCommands = require("../../../SlashCommands");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
var _default = ({
  onFinished
}) => {
  const InfoDialog = sdk.getComponent('dialogs.InfoDialog');
  const categories = {};

  _SlashCommands.Commands.forEach(cmd => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }

    categories[cmd.category].push(cmd);
  });

  const body = Object.values(_SlashCommands.CommandCategories).filter(c => categories[c]).map(category => {
    const rows = [/*#__PURE__*/_react.default.createElement("tr", {
      key: "_category_" + category,
      className: "mx_SlashCommandHelpDialog_headerRow"
    }, /*#__PURE__*/_react.default.createElement("td", {
      colSpan: 3
    }, /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)(category))))];
    categories[category].forEach(cmd => {
      rows.push( /*#__PURE__*/_react.default.createElement("tr", {
        key: cmd.command
      }, /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("strong", null, cmd.getCommand())), /*#__PURE__*/_react.default.createElement("td", null, cmd.args), /*#__PURE__*/_react.default.createElement("td", null, cmd.description)));
    });
    return rows;
  });
  return /*#__PURE__*/_react.default.createElement(InfoDialog, {
    className: "mx_SlashCommandHelpDialog",
    title: (0, _languageHandler._t)("Command Help"),
    description: /*#__PURE__*/_react.default.createElement("table", null, /*#__PURE__*/_react.default.createElement("tbody", null, body)),
    hasCloseButton: true,
    onFinished: onFinished
  });
};

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvU2xhc2hDb21tYW5kSGVscERpYWxvZy5qcyJdLCJuYW1lcyI6WyJvbkZpbmlzaGVkIiwiSW5mb0RpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsImNhdGVnb3JpZXMiLCJDb21tYW5kcyIsImZvckVhY2giLCJjbWQiLCJjYXRlZ29yeSIsInB1c2giLCJib2R5IiwiT2JqZWN0IiwidmFsdWVzIiwiQ29tbWFuZENhdGVnb3JpZXMiLCJmaWx0ZXIiLCJjIiwibWFwIiwicm93cyIsImNvbW1hbmQiLCJnZXRDb21tYW5kIiwiYXJncyIsImRlc2NyaXB0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7OztlQXFCZSxDQUFDO0FBQUNBLEVBQUFBO0FBQUQsQ0FBRCxLQUFrQjtBQUM3QixRQUFNQyxVQUFVLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixvQkFBakIsQ0FBbkI7QUFFQSxRQUFNQyxVQUFVLEdBQUcsRUFBbkI7O0FBQ0FDLDBCQUFTQyxPQUFULENBQWlCQyxHQUFHLElBQUk7QUFDcEIsUUFBSSxDQUFDSCxVQUFVLENBQUNHLEdBQUcsQ0FBQ0MsUUFBTCxDQUFmLEVBQStCO0FBQzNCSixNQUFBQSxVQUFVLENBQUNHLEdBQUcsQ0FBQ0MsUUFBTCxDQUFWLEdBQTJCLEVBQTNCO0FBQ0g7O0FBQ0RKLElBQUFBLFVBQVUsQ0FBQ0csR0FBRyxDQUFDQyxRQUFMLENBQVYsQ0FBeUJDLElBQXpCLENBQThCRixHQUE5QjtBQUNILEdBTEQ7O0FBT0EsUUFBTUcsSUFBSSxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0MsZ0NBQWQsRUFBaUNDLE1BQWpDLENBQXdDQyxDQUFDLElBQUlYLFVBQVUsQ0FBQ1csQ0FBRCxDQUF2RCxFQUE0REMsR0FBNUQsQ0FBaUVSLFFBQUQsSUFBYztBQUN2RixVQUFNUyxJQUFJLEdBQUcsY0FDVDtBQUFJLE1BQUEsR0FBRyxFQUFFLGVBQWVULFFBQXhCO0FBQWtDLE1BQUEsU0FBUyxFQUFDO0FBQTVDLG9CQUNJO0FBQUksTUFBQSxPQUFPLEVBQUU7QUFBYixvQkFDSSx5Q0FBSyx5QkFBR0EsUUFBSCxDQUFMLENBREosQ0FESixDQURTLENBQWI7QUFRQUosSUFBQUEsVUFBVSxDQUFDSSxRQUFELENBQVYsQ0FBcUJGLE9BQXJCLENBQTZCQyxHQUFHLElBQUk7QUFDaENVLE1BQUFBLElBQUksQ0FBQ1IsSUFBTCxlQUFVO0FBQUksUUFBQSxHQUFHLEVBQUVGLEdBQUcsQ0FBQ1c7QUFBYixzQkFDTixzREFBSSw2Q0FBU1gsR0FBRyxDQUFDWSxVQUFKLEVBQVQsQ0FBSixDQURNLGVBRU4seUNBQUtaLEdBQUcsQ0FBQ2EsSUFBVCxDQUZNLGVBR04seUNBQUtiLEdBQUcsQ0FBQ2MsV0FBVCxDQUhNLENBQVY7QUFLSCxLQU5EO0FBUUEsV0FBT0osSUFBUDtBQUNILEdBbEJZLENBQWI7QUFvQkEsc0JBQU8sNkJBQUMsVUFBRDtBQUNILElBQUEsU0FBUyxFQUFDLDJCQURQO0FBRUgsSUFBQSxLQUFLLEVBQUUseUJBQUcsY0FBSCxDQUZKO0FBR0gsSUFBQSxXQUFXLGVBQUUseURBQ1QsNENBQ0tQLElBREwsQ0FEUyxDQUhWO0FBUUgsSUFBQSxjQUFjLEVBQUUsSUFSYjtBQVNILElBQUEsVUFBVSxFQUFFVjtBQVRULElBQVA7QUFVSCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQge0NvbW1hbmRDYXRlZ29yaWVzLCBDb21tYW5kc30gZnJvbSBcIi4uLy4uLy4uL1NsYXNoQ29tbWFuZHNcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgKHtvbkZpbmlzaGVkfSkgPT4ge1xuICAgIGNvbnN0IEluZm9EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkluZm9EaWFsb2cnKTtcblxuICAgIGNvbnN0IGNhdGVnb3JpZXMgPSB7fTtcbiAgICBDb21tYW5kcy5mb3JFYWNoKGNtZCA9PiB7XG4gICAgICAgIGlmICghY2F0ZWdvcmllc1tjbWQuY2F0ZWdvcnldKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW2NtZC5jYXRlZ29yeV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBjYXRlZ29yaWVzW2NtZC5jYXRlZ29yeV0ucHVzaChjbWQpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYm9keSA9IE9iamVjdC52YWx1ZXMoQ29tbWFuZENhdGVnb3JpZXMpLmZpbHRlcihjID0+IGNhdGVnb3JpZXNbY10pLm1hcCgoY2F0ZWdvcnkpID0+IHtcbiAgICAgICAgY29uc3Qgcm93cyA9IFtcbiAgICAgICAgICAgIDx0ciBrZXk9e1wiX2NhdGVnb3J5X1wiICsgY2F0ZWdvcnl9IGNsYXNzTmFtZT1cIm14X1NsYXNoQ29tbWFuZEhlbHBEaWFsb2dfaGVhZGVyUm93XCI+XG4gICAgICAgICAgICAgICAgPHRkIGNvbFNwYW49ezN9PlxuICAgICAgICAgICAgICAgICAgICA8aDI+e190KGNhdGVnb3J5KX08L2gyPlxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPixcbiAgICAgICAgXTtcblxuICAgICAgICBjYXRlZ29yaWVzW2NhdGVnb3J5XS5mb3JFYWNoKGNtZCA9PiB7XG4gICAgICAgICAgICByb3dzLnB1c2goPHRyIGtleT17Y21kLmNvbW1hbmR9PlxuICAgICAgICAgICAgICAgIDx0ZD48c3Ryb25nPntjbWQuZ2V0Q29tbWFuZCgpfTwvc3Ryb25nPjwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkPntjbWQuYXJnc308L3RkPlxuICAgICAgICAgICAgICAgIDx0ZD57Y21kLmRlc2NyaXB0aW9ufTwvdGQ+XG4gICAgICAgICAgICA8L3RyPik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByb3dzO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIDxJbmZvRGlhbG9nXG4gICAgICAgIGNsYXNzTmFtZT1cIm14X1NsYXNoQ29tbWFuZEhlbHBEaWFsb2dcIlxuICAgICAgICB0aXRsZT17X3QoXCJDb21tYW5kIEhlbHBcIil9XG4gICAgICAgIGRlc2NyaXB0aW9uPXs8dGFibGU+XG4gICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAge2JvZHl9XG4gICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICA8L3RhYmxlPn1cbiAgICAgICAgaGFzQ2xvc2VCdXR0b249e3RydWV9XG4gICAgICAgIG9uRmluaXNoZWQ9e29uRmluaXNoZWR9IC8+O1xufTtcbiJdfQ==