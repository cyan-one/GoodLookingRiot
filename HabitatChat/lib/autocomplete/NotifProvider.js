"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _AutocompleteProvider = _interopRequireDefault(require("./AutocompleteProvider"));

var _languageHandler = require("../languageHandler");

var _MatrixClientPeg = require("../MatrixClientPeg");

var _Components = require("./Components");

var sdk = _interopRequireWildcard(require("../index"));

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
const AT_ROOM_REGEX = /@\S*/g;

class NotifProvider extends _AutocompleteProvider.default {
  constructor(room) {
    super(AT_ROOM_REGEX);
    (0, _defineProperty2.default)(this, "room", void 0);
    this.room = room;
  }

  async getCompletions(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false)
  /*: Promise<ICompletion[]>*/
  {
    const RoomAvatar = sdk.getComponent('views.avatars.RoomAvatar');

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!this.room.currentState.mayTriggerNotifOfType('room', client.credentials.userId)) return [];
    const {
      command,
      range
    } = this.getCurrentCommand(query, selection, force);

    if (command && command[0] && '@room'.startsWith(command[0]) && command[0].length > 1) {
      return [{
        completion: '@room',
        completionId: '@room',
        type: "at-room",
        suffix: ' ',
        component: /*#__PURE__*/_react.default.createElement(_Components.PillCompletion, {
          initialComponent: /*#__PURE__*/_react.default.createElement(RoomAvatar, {
            width: 24,
            height: 24,
            room: this.room
          }),
          title: "@room",
          description: (0, _languageHandler._t)("Notify the whole room")
        }),
        range
      }];
    }

    return [];
  }

  getName() {
    return '❗️ ' + (0, _languageHandler._t)('Room Notification');
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_pill mx_Autocomplete_Completion_container_truncate",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("Notification Autocomplete")
    }, completions);
  }

}

exports.default = NotifProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvTm90aWZQcm92aWRlci50c3giXSwibmFtZXMiOlsiQVRfUk9PTV9SRUdFWCIsIk5vdGlmUHJvdmlkZXIiLCJBdXRvY29tcGxldGVQcm92aWRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsImdldENvbXBsZXRpb25zIiwicXVlcnkiLCJzZWxlY3Rpb24iLCJmb3JjZSIsIlJvb21BdmF0YXIiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjbGllbnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJjdXJyZW50U3RhdGUiLCJtYXlUcmlnZ2VyTm90aWZPZlR5cGUiLCJjcmVkZW50aWFscyIsInVzZXJJZCIsImNvbW1hbmQiLCJyYW5nZSIsImdldEN1cnJlbnRDb21tYW5kIiwic3RhcnRzV2l0aCIsImxlbmd0aCIsImNvbXBsZXRpb24iLCJjb21wbGV0aW9uSWQiLCJ0eXBlIiwic3VmZml4IiwiY29tcG9uZW50IiwiZ2V0TmFtZSIsInJlbmRlckNvbXBsZXRpb25zIiwiY29tcGxldGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsTUFBTUEsYUFBYSxHQUFHLE9BQXRCOztBQUVlLE1BQU1DLGFBQU4sU0FBNEJDLDZCQUE1QixDQUFpRDtBQUc1REMsRUFBQUEsV0FBVyxDQUFDQyxJQUFELEVBQU87QUFDZCxVQUFNSixhQUFOO0FBRGM7QUFFZCxTQUFLSSxJQUFMLEdBQVlBLElBQVo7QUFDSDs7QUFFRCxRQUFNQyxjQUFOLENBQXFCQztBQUFyQjtBQUFBLElBQW9DQztBQUFwQztBQUFBLElBQWdFQyxLQUFLLEdBQUUsS0FBdkU7QUFBQTtBQUFzRztBQUNsRyxVQUFNQyxVQUFVLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7O0FBRUEsVUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBRUEsUUFBSSxDQUFDLEtBQUtWLElBQUwsQ0FBVVcsWUFBVixDQUF1QkMscUJBQXZCLENBQTZDLE1BQTdDLEVBQXFESixNQUFNLENBQUNLLFdBQVAsQ0FBbUJDLE1BQXhFLENBQUwsRUFBc0YsT0FBTyxFQUFQO0FBRXRGLFVBQU07QUFBQ0MsTUFBQUEsT0FBRDtBQUFVQyxNQUFBQTtBQUFWLFFBQW1CLEtBQUtDLGlCQUFMLENBQXVCZixLQUF2QixFQUE4QkMsU0FBOUIsRUFBeUNDLEtBQXpDLENBQXpCOztBQUNBLFFBQUlXLE9BQU8sSUFBSUEsT0FBTyxDQUFDLENBQUQsQ0FBbEIsSUFBeUIsUUFBUUcsVUFBUixDQUFtQkgsT0FBTyxDQUFDLENBQUQsQ0FBMUIsQ0FBekIsSUFBMkRBLE9BQU8sQ0FBQyxDQUFELENBQVAsQ0FBV0ksTUFBWCxHQUFvQixDQUFuRixFQUFzRjtBQUNsRixhQUFPLENBQUM7QUFDSkMsUUFBQUEsVUFBVSxFQUFFLE9BRFI7QUFFSkMsUUFBQUEsWUFBWSxFQUFFLE9BRlY7QUFHSkMsUUFBQUEsSUFBSSxFQUFFLFNBSEY7QUFJSkMsUUFBQUEsTUFBTSxFQUFFLEdBSko7QUFLSkMsUUFBQUEsU0FBUyxlQUNMLDZCQUFDLDBCQUFEO0FBQWdCLFVBQUEsZ0JBQWdCLGVBQUUsNkJBQUMsVUFBRDtBQUFZLFlBQUEsS0FBSyxFQUFFLEVBQW5CO0FBQXVCLFlBQUEsTUFBTSxFQUFFLEVBQS9CO0FBQW1DLFlBQUEsSUFBSSxFQUFFLEtBQUt4QjtBQUE5QyxZQUFsQztBQUEwRixVQUFBLEtBQUssRUFBQyxPQUFoRztBQUF3RyxVQUFBLFdBQVcsRUFBRSx5QkFBRyx1QkFBSDtBQUFySCxVQU5BO0FBUUpnQixRQUFBQTtBQVJJLE9BQUQsQ0FBUDtBQVVIOztBQUNELFdBQU8sRUFBUDtBQUNIOztBQUVEUyxFQUFBQSxPQUFPLEdBQUc7QUFDTixXQUFPLFFBQVEseUJBQUcsbUJBQUgsQ0FBZjtBQUNIOztBQUVEQyxFQUFBQSxpQkFBaUIsQ0FBQ0M7QUFBRDtBQUFBO0FBQUE7QUFBa0Q7QUFDL0Qsd0JBQ0k7QUFDSSxNQUFBLFNBQVMsRUFBQyx5RkFEZDtBQUVJLE1BQUEsSUFBSSxFQUFDLFNBRlQ7QUFHSSxvQkFBWSx5QkFBRywyQkFBSDtBQUhoQixPQUtNQSxXQUxOLENBREo7QUFTSDs7QUE3QzJEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSb29tIGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9tb2RlbHMvcm9vbVwiO1xuaW1wb3J0IEF1dG9jb21wbGV0ZVByb3ZpZGVyIGZyb20gJy4vQXV0b2NvbXBsZXRlUHJvdmlkZXInO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQge1BpbGxDb21wbGV0aW9ufSBmcm9tICcuL0NvbXBvbmVudHMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7SUNvbXBsZXRpb24sIElTZWxlY3Rpb25SYW5nZX0gZnJvbSBcIi4vQXV0b2NvbXBsZXRlclwiO1xuXG5jb25zdCBBVF9ST09NX1JFR0VYID0gL0BcXFMqL2c7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5vdGlmUHJvdmlkZXIgZXh0ZW5kcyBBdXRvY29tcGxldGVQcm92aWRlciB7XG4gICAgcm9vbTogUm9vbTtcblxuICAgIGNvbnN0cnVjdG9yKHJvb20pIHtcbiAgICAgICAgc3VwZXIoQVRfUk9PTV9SRUdFWCk7XG4gICAgICAgIHRoaXMucm9vbSA9IHJvb207XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0Q29tcGxldGlvbnMocXVlcnk6IHN0cmluZywgc2VsZWN0aW9uOiBJU2VsZWN0aW9uUmFuZ2UsIGZvcmNlPSBmYWxzZSk6IFByb21pc2U8SUNvbXBsZXRpb25bXT4ge1xuICAgICAgICBjb25zdCBSb29tQXZhdGFyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuYXZhdGFycy5Sb29tQXZhdGFyJyk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgIGlmICghdGhpcy5yb29tLmN1cnJlbnRTdGF0ZS5tYXlUcmlnZ2VyTm90aWZPZlR5cGUoJ3Jvb20nLCBjbGllbnQuY3JlZGVudGlhbHMudXNlcklkKSkgcmV0dXJuIFtdO1xuXG4gICAgICAgIGNvbnN0IHtjb21tYW5kLCByYW5nZX0gPSB0aGlzLmdldEN1cnJlbnRDb21tYW5kKHF1ZXJ5LCBzZWxlY3Rpb24sIGZvcmNlKTtcbiAgICAgICAgaWYgKGNvbW1hbmQgJiYgY29tbWFuZFswXSAmJiAnQHJvb20nLnN0YXJ0c1dpdGgoY29tbWFuZFswXSkgJiYgY29tbWFuZFswXS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBjb21wbGV0aW9uOiAnQHJvb20nLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRpb25JZDogJ0Byb29tJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBcImF0LXJvb21cIixcbiAgICAgICAgICAgICAgICBzdWZmaXg6ICcgJyxcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IChcbiAgICAgICAgICAgICAgICAgICAgPFBpbGxDb21wbGV0aW9uIGluaXRpYWxDb21wb25lbnQ9ezxSb29tQXZhdGFyIHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gcm9vbT17dGhpcy5yb29tfSAvPn0gdGl0bGU9XCJAcm9vbVwiIGRlc2NyaXB0aW9uPXtfdChcIk5vdGlmeSB0aGUgd2hvbGUgcm9vbVwiKX0gLz5cbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgfV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGdldE5hbWUoKSB7XG4gICAgICAgIHJldHVybiAn4p2X77iPICcgKyBfdCgnUm9vbSBOb3RpZmljYXRpb24nKTtcbiAgICB9XG5cbiAgICByZW5kZXJDb21wbGV0aW9ucyhjb21wbGV0aW9uczogUmVhY3QuUmVhY3ROb2RlW10pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2NvbnRhaW5lcl9waWxsIG14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2NvbnRhaW5lcl90cnVuY2F0ZVwiXG4gICAgICAgICAgICAgICAgcm9sZT1cImxpc3Rib3hcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e190KFwiTm90aWZpY2F0aW9uIEF1dG9jb21wbGV0ZVwiKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IGNvbXBsZXRpb25zIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==