"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../languageHandler");

var _AutocompleteProvider = _interopRequireDefault(require("./AutocompleteProvider"));

var _Components = require("./Components");

var sdk = _interopRequireWildcard(require("../index"));

var _QueryMatcher = _interopRequireDefault(require("./QueryMatcher"));

var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));

var _MatrixClientPeg = require("../MatrixClientPeg");

var _Permalinks = require("../utils/permalinks/Permalinks");

/*
Copyright 2016 Aviral Dasgupta
Copyright 2017 Vector Creations Ltd
Copyright 2017, 2018 New Vector Ltd
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>

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
const USER_REGEX = /\B@\S*/g; // used when you hit 'tab' - we allow some separator chars at the beginning
// to allow you to tab-complete /mat into /(matthew)

const FORCED_USER_REGEX = /[^/,:; \t\n]\S*/g;

class UserProvider extends _AutocompleteProvider.default {
  constructor(_room
  /*: Room*/
  ) {
    super(USER_REGEX, FORCED_USER_REGEX);
    (0, _defineProperty2.default)(this, "matcher", void 0);
    (0, _defineProperty2.default)(this, "users", void 0);
    (0, _defineProperty2.default)(this, "room", void 0);
    (0, _defineProperty2.default)(this, "onRoomTimeline", (ev
    /*: MatrixEvent*/
    , room
    /*: Room*/
    , toStartOfTimeline
    /*: boolean*/
    , removed
    /*: boolean*/
    , data
    /*: IRoomTimelineData*/
    ) => {
      if (!room) return;
      if (removed) return;
      if (room.roomId !== this.room.roomId) return; // ignore events from filtered timelines

      if (data.timeline.getTimelineSet() !== room.getUnfilteredTimelineSet()) return; // ignore anything but real-time updates at the end of the room:
      // updates from pagination will happen when the paginate completes.

      if (toStartOfTimeline || !data || !data.liveEvent) return; // TODO: lazyload if we have no ev.sender room member?

      this.onUserSpoke(ev.sender);
    });
    (0, _defineProperty2.default)(this, "onRoomStateMember", (ev
    /*: MatrixEvent*/
    , state
    /*: RoomState*/
    , member
    /*: RoomMember*/
    ) => {
      // ignore members in other rooms
      if (member.roomId !== this.room.roomId) {
        return;
      } // blow away the users cache


      this.users = null;
    });
    this.room = _room;
    this.matcher = new _QueryMatcher.default([], {
      keys: ['name'],
      funcs: [obj => obj.userId.slice(1)],
      // index by user id minus the leading '@'
      shouldMatchPrefix: true,
      shouldMatchWordsOnly: false
    });

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.timeline", this.onRoomTimeline);

    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.members", this.onRoomStateMember);
  }

  destroy() {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Room.timeline", this.onRoomTimeline);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.members", this.onRoomStateMember);
    }
  }

  async getCompletions(rawQuery
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false)
  /*: Promise<ICompletion[]>*/
  {
    const MemberAvatar = sdk.getComponent('views.avatars.MemberAvatar'); // lazy-load user list into matcher

    if (!this.users) this._makeUsers();
    let completions = [];
    const {
      command,
      range
    } = this.getCurrentCommand(rawQuery, selection, force);
    if (!command) return completions;
    const fullMatch = command[0]; // Don't search if the query is a single "@"

    if (fullMatch && fullMatch !== '@') {
      // Don't include the '@' in our search query - it's only used as a way to trigger completion
      const query = fullMatch.startsWith('@') ? fullMatch.substring(1) : fullMatch;
      completions = this.matcher.match(query).map(user => {
        const displayName = user.name || user.userId || '';
        return {
          // Length of completion should equal length of text in decorator. draft-js
          // relies on the length of the entity === length of the text in the decoration.
          completion: user.rawDisplayName,
          completionId: user.userId,
          type: "user",
          suffix: selection.beginning && range.start === 0 ? ': ' : ' ',
          href: (0, _Permalinks.makeUserPermalink)(user.userId),
          component: /*#__PURE__*/_react.default.createElement(_Components.PillCompletion, {
            initialComponent: /*#__PURE__*/_react.default.createElement(MemberAvatar, {
              member: user,
              width: 24,
              height: 24
            }),
            title: displayName,
            description: user.userId
          }),
          range
        };
      });
    }

    return completions;
  }

  getName()
  /*: string*/
  {
    return '👥 ' + (0, _languageHandler._t)('Users');
  }

  _makeUsers() {
    const events = this.room.getLiveTimeline().getEvents();
    const lastSpoken = {};

    for (const event of events) {
      lastSpoken[event.getSender()] = event.getTs();
    }

    const currentUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId;

    this.users = this.room.getJoinedMembers().filter(({
      userId
    }) => userId !== currentUserId);
    this.users = (0, _sortBy2.default)(this.users, member => 1E20 - lastSpoken[member.userId] || 1E20);
    this.matcher.setObjects(this.users);
  }

  onUserSpoke(user
  /*: RoomMember*/
  ) {
    if (!this.users) return;
    if (!user) return;
    if (user.userId === _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) return; // Move the user that spoke to the front of the array

    this.users.splice(this.users.findIndex(user2 => user2.userId === user.userId), 1);
    this.users = [user, ...this.users];
    this.matcher.setObjects(this.users);
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_pill",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("User Autocomplete")
    }, completions);
  }

  shouldForceComplete()
  /*: boolean*/
  {
    return true;
  }

}

exports.default = UserProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvVXNlclByb3ZpZGVyLnRzeCJdLCJuYW1lcyI6WyJVU0VSX1JFR0VYIiwiRk9SQ0VEX1VTRVJfUkVHRVgiLCJVc2VyUHJvdmlkZXIiLCJBdXRvY29tcGxldGVQcm92aWRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsImV2IiwidG9TdGFydE9mVGltZWxpbmUiLCJyZW1vdmVkIiwiZGF0YSIsInJvb21JZCIsInRpbWVsaW5lIiwiZ2V0VGltZWxpbmVTZXQiLCJnZXRVbmZpbHRlcmVkVGltZWxpbmVTZXQiLCJsaXZlRXZlbnQiLCJvblVzZXJTcG9rZSIsInNlbmRlciIsInN0YXRlIiwibWVtYmVyIiwidXNlcnMiLCJtYXRjaGVyIiwiUXVlcnlNYXRjaGVyIiwia2V5cyIsImZ1bmNzIiwib2JqIiwidXNlcklkIiwic2xpY2UiLCJzaG91bGRNYXRjaFByZWZpeCIsInNob3VsZE1hdGNoV29yZHNPbmx5IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwib24iLCJvblJvb21UaW1lbGluZSIsIm9uUm9vbVN0YXRlTWVtYmVyIiwiZGVzdHJveSIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0Q29tcGxldGlvbnMiLCJyYXdRdWVyeSIsInNlbGVjdGlvbiIsImZvcmNlIiwiTWVtYmVyQXZhdGFyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiX21ha2VVc2VycyIsImNvbXBsZXRpb25zIiwiY29tbWFuZCIsInJhbmdlIiwiZ2V0Q3VycmVudENvbW1hbmQiLCJmdWxsTWF0Y2giLCJxdWVyeSIsInN0YXJ0c1dpdGgiLCJzdWJzdHJpbmciLCJtYXRjaCIsIm1hcCIsInVzZXIiLCJkaXNwbGF5TmFtZSIsIm5hbWUiLCJjb21wbGV0aW9uIiwicmF3RGlzcGxheU5hbWUiLCJjb21wbGV0aW9uSWQiLCJ0eXBlIiwic3VmZml4IiwiYmVnaW5uaW5nIiwic3RhcnQiLCJocmVmIiwiY29tcG9uZW50IiwiZ2V0TmFtZSIsImV2ZW50cyIsImdldExpdmVUaW1lbGluZSIsImdldEV2ZW50cyIsImxhc3RTcG9rZW4iLCJldmVudCIsImdldFNlbmRlciIsImdldFRzIiwiY3VycmVudFVzZXJJZCIsImNyZWRlbnRpYWxzIiwiZ2V0Sm9pbmVkTWVtYmVycyIsImZpbHRlciIsInNldE9iamVjdHMiLCJzcGxpY2UiLCJmaW5kSW5kZXgiLCJ1c2VyMiIsInJlbmRlckNvbXBsZXRpb25zIiwic2hvdWxkRm9yY2VDb21wbGV0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFPQTs7QUFqQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9DQSxNQUFNQSxVQUFVLEdBQUcsU0FBbkIsQyxDQUVBO0FBQ0E7O0FBQ0EsTUFBTUMsaUJBQWlCLEdBQUcsa0JBQTFCOztBQU9lLE1BQU1DLFlBQU4sU0FBMkJDLDZCQUEzQixDQUFnRDtBQUszREMsRUFBQUEsV0FBVyxDQUFDQztBQUFEO0FBQUEsSUFBYTtBQUNwQixVQUFNTCxVQUFOLEVBQWtCQyxpQkFBbEI7QUFEb0I7QUFBQTtBQUFBO0FBQUEsMERBcUJDLENBQUNLO0FBQUQ7QUFBQSxNQUFrQkQ7QUFBbEI7QUFBQSxNQUE4QkU7QUFBOUI7QUFBQSxNQUEwREM7QUFBMUQ7QUFBQSxNQUNOQztBQURNO0FBQUEsU0FDc0I7QUFDM0MsVUFBSSxDQUFDSixJQUFMLEVBQVc7QUFDWCxVQUFJRyxPQUFKLEVBQWE7QUFDYixVQUFJSCxJQUFJLENBQUNLLE1BQUwsS0FBZ0IsS0FBS0wsSUFBTCxDQUFVSyxNQUE5QixFQUFzQyxPQUhLLENBSzNDOztBQUNBLFVBQUlELElBQUksQ0FBQ0UsUUFBTCxDQUFjQyxjQUFkLE9BQW1DUCxJQUFJLENBQUNRLHdCQUFMLEVBQXZDLEVBQXdFLE9BTjdCLENBUTNDO0FBQ0E7O0FBQ0EsVUFBSU4saUJBQWlCLElBQUksQ0FBQ0UsSUFBdEIsSUFBOEIsQ0FBQ0EsSUFBSSxDQUFDSyxTQUF4QyxFQUFtRCxPQVZSLENBWTNDOztB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RCxLQUFMLEdBQWEsc0JBQVEsS0FBS0EsS0FBYixFQUFxQkQsTUFBRCxJQUFZLE9BQU9vRCxVQUFVLENBQUNwRCxNQUFNLENBQUNPLE1BQVIsQ0FBakIsSUFBb0MsSUFBcEUsQ0FBYjtBQUVBLFNBQUtMLE9BQUwsQ0FBYTBELFVBQWIsQ0FBd0IsS0FBSzNELEtBQTdCO0FBQ0g7O0FBRURKLEVBQUFBLFdBQVcsQ0FBQ3VDO0FBQUQ7QUFBQSxJQUFtQjtBQUMxQixRQUFJLENBQUMsS0FBS25DLEtBQVYsRUFBaUI7QUFDakIsUUFBSSxDQUFDbUMsSUFBTCxFQUFXO0FBQ1gsUUFBSUEsSUFBSSxDQUFDN0IsTUFBTCxLQUFnQkksaUNBQWdCQyxHQUFoQixHQUFzQjZDLFdBQXRCLENBQWtDbEQsTUFBdEQsRUFBOEQsT0FIcEMsQ0FLMUI7O0FBQ0EsU0FBS04sS0FBTCxDQUFXNEQsTUFBWCxDQUNJLEtBQUs1RCxLQUFMLENBQVc2RCxTQUFYLENBQXNCQyxLQUFELElBQVdBLEtBQUssQ0FBQ3hELE1BQU4sS0FBaUI2QixJQUFJLENBQUM3QixNQUF0RCxDQURKLEVBQ21FLENBRG5FO0FBRUEsU0FBS04sS0FBTCxHQUFhLENBQUNtQyxJQUFELEVBQU8sR0FBRyxLQUFLbkMsS0FBZixDQUFiO0FBRUEsU0FBS0MsT0FBTCxDQUFhMEQsVUFBYixDQUF3QixLQUFLM0QsS0FBN0I7QUFDSDs7QUFFRCtELEVBQUFBLGlCQUFpQixDQUFDdEM7QUFBRDtBQUFBO0FBQUE7QUFBa0Q7QUFDL0Qsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQywyQ0FBZjtBQUEyRCxNQUFBLElBQUksRUFBQyxTQUFoRTtBQUEwRSxvQkFBWSx5QkFBRyxtQkFBSDtBQUF0RixPQUNNQSxXQUROLENBREo7QUFLSDs7QUFFRHVDLEVBQUFBLG1CQUFtQjtBQUFBO0FBQVk7QUFDM0IsV0FBTyxJQUFQO0FBQ0g7O0FBdkkwRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBBdmlyYWwgRGFzZ3VwdGFcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBBdXRvY29tcGxldGVQcm92aWRlciBmcm9tICcuL0F1dG9jb21wbGV0ZVByb3ZpZGVyJztcbmltcG9ydCB7UGlsbENvbXBsZXRpb259IGZyb20gJy4vQ29tcG9uZW50cyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IFF1ZXJ5TWF0Y2hlciBmcm9tICcuL1F1ZXJ5TWF0Y2hlcic7XG5pbXBvcnQgX3NvcnRCeSBmcm9tICdsb2Rhc2gvc29ydEJ5JztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi9NYXRyaXhDbGllbnRQZWcnO1xuXG5pbXBvcnQgTWF0cml4RXZlbnQgZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9ldmVudFwiO1xuaW1wb3J0IFJvb20gZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9yb29tXCI7XG5pbXBvcnQgUm9vbU1lbWJlciBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL3Jvb20tbWVtYmVyXCI7XG5pbXBvcnQgUm9vbVN0YXRlIGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9tb2RlbHMvcm9vbS1zdGF0ZVwiO1xuaW1wb3J0IEV2ZW50VGltZWxpbmUgZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9ldmVudC10aW1lbGluZVwiO1xuaW1wb3J0IHttYWtlVXNlclBlcm1hbGlua30gZnJvbSBcIi4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rc1wiO1xuaW1wb3J0IHtJQ29tcGxldGlvbiwgSVNlbGVjdGlvblJhbmdlfSBmcm9tIFwiLi9BdXRvY29tcGxldGVyXCI7XG5cbmNvbnN0IFVTRVJfUkVHRVggPSAvXFxCQFxcUyovZztcblxuLy8gdXNlZCB3aGVuIHlvdSBoaXQgJ3RhYicgLSB3ZSBhbGxvdyBzb21lIHNlcGFyYXRvciBjaGFycyBhdCB0aGUgYmVnaW5uaW5nXG4vLyB0byBhbGxvdyB5b3UgdG8gdGFiLWNvbXBsZXRlIC9tYXQgaW50byAvKG1hdHRoZXcpXG5jb25zdCBGT1JDRURfVVNFUl9SRUdFWCA9IC9bXi8sOjsgXFx0XFxuXVxcUyovZztcblxuaW50ZXJmYWNlIElSb29tVGltZWxpbmVEYXRhIHtcbiAgICB0aW1lbGluZTogRXZlbnRUaW1lbGluZTtcbiAgICBsaXZlRXZlbnQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVc2VyUHJvdmlkZXIgZXh0ZW5kcyBBdXRvY29tcGxldGVQcm92aWRlciB7XG4gICAgbWF0Y2hlcjogUXVlcnlNYXRjaGVyPFJvb21NZW1iZXI+O1xuICAgIHVzZXJzOiBSb29tTWVtYmVyW107XG4gICAgcm9vbTogUm9vbTtcblxuICAgIGNvbnN0cnVjdG9yKHJvb206IFJvb20pIHtcbiAgICAgICAgc3VwZXIoVVNFUl9SRUdFWCwgRk9SQ0VEX1VTRVJfUkVHRVgpO1xuICAgICAgICB0aGlzLnJvb20gPSByb29tO1xuICAgICAgICB0aGlzLm1hdGNoZXIgPSBuZXcgUXVlcnlNYXRjaGVyKFtdLCB7XG4gICAgICAgICAgICBrZXlzOiBbJ25hbWUnXSxcbiAgICAgICAgICAgIGZ1bmNzOiBbb2JqID0+IG9iai51c2VySWQuc2xpY2UoMSldLCAvLyBpbmRleCBieSB1c2VyIGlkIG1pbnVzIHRoZSBsZWFkaW5nICdAJ1xuICAgICAgICAgICAgc2hvdWxkTWF0Y2hQcmVmaXg6IHRydWUsXG4gICAgICAgICAgICBzaG91bGRNYXRjaFdvcmRzT25seTogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHRoaXMub25Sb29tU3RhdGVNZW1iZXIpO1xuICAgIH1cblxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkpIHtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcIlJvb20udGltZWxpbmVcIiwgdGhpcy5vblJvb21UaW1lbGluZSk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUubWVtYmVyc1wiLCB0aGlzLm9uUm9vbVN0YXRlTWVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25Sb29tVGltZWxpbmUgPSAoZXY6IE1hdHJpeEV2ZW50LCByb29tOiBSb29tLCB0b1N0YXJ0T2ZUaW1lbGluZTogYm9vbGVhbiwgcmVtb3ZlZDogYm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogSVJvb21UaW1lbGluZURhdGEpID0+IHtcbiAgICAgICAgaWYgKCFyb29tKSByZXR1cm47XG4gICAgICAgIGlmIChyZW1vdmVkKSByZXR1cm47XG4gICAgICAgIGlmIChyb29tLnJvb21JZCAhPT0gdGhpcy5yb29tLnJvb21JZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGlnbm9yZSBldmVudHMgZnJvbSBmaWx0ZXJlZCB0aW1lbGluZXNcbiAgICAgICAgaWYgKGRhdGEudGltZWxpbmUuZ2V0VGltZWxpbmVTZXQoKSAhPT0gcm9vbS5nZXRVbmZpbHRlcmVkVGltZWxpbmVTZXQoKSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGlnbm9yZSBhbnl0aGluZyBidXQgcmVhbC10aW1lIHVwZGF0ZXMgYXQgdGhlIGVuZCBvZiB0aGUgcm9vbTpcbiAgICAgICAgLy8gdXBkYXRlcyBmcm9tIHBhZ2luYXRpb24gd2lsbCBoYXBwZW4gd2hlbiB0aGUgcGFnaW5hdGUgY29tcGxldGVzLlxuICAgICAgICBpZiAodG9TdGFydE9mVGltZWxpbmUgfHwgIWRhdGEgfHwgIWRhdGEubGl2ZUV2ZW50KSByZXR1cm47XG5cbiAgICAgICAgLy8gVE9ETzogbGF6eWxvYWQgaWYgd2UgaGF2ZSBubyBldi5zZW5kZXIgcm9vbSBtZW1iZXI/XG4gICAgICAgIHRoaXMub25Vc2VyU3Bva2UoZXYuc2VuZGVyKTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBvblJvb21TdGF0ZU1lbWJlciA9IChldjogTWF0cml4RXZlbnQsIHN0YXRlOiBSb29tU3RhdGUsIG1lbWJlcjogUm9vbU1lbWJlcikgPT4ge1xuICAgICAgICAvLyBpZ25vcmUgbWVtYmVycyBpbiBvdGhlciByb29tc1xuICAgICAgICBpZiAobWVtYmVyLnJvb21JZCAhPT0gdGhpcy5yb29tLnJvb21JZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmxvdyBhd2F5IHRoZSB1c2VycyBjYWNoZVxuICAgICAgICB0aGlzLnVzZXJzID0gbnVsbDtcbiAgICB9O1xuXG4gICAgYXN5bmMgZ2V0Q29tcGxldGlvbnMocmF3UXVlcnk6IHN0cmluZywgc2VsZWN0aW9uOiBJU2VsZWN0aW9uUmFuZ2UsIGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPElDb21wbGV0aW9uW10+IHtcbiAgICAgICAgY29uc3QgTWVtYmVyQXZhdGFyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuYXZhdGFycy5NZW1iZXJBdmF0YXInKTtcblxuICAgICAgICAvLyBsYXp5LWxvYWQgdXNlciBsaXN0IGludG8gbWF0Y2hlclxuICAgICAgICBpZiAoIXRoaXMudXNlcnMpIHRoaXMuX21ha2VVc2VycygpO1xuXG4gICAgICAgIGxldCBjb21wbGV0aW9ucyA9IFtdO1xuICAgICAgICBjb25zdCB7Y29tbWFuZCwgcmFuZ2V9ID0gdGhpcy5nZXRDdXJyZW50Q29tbWFuZChyYXdRdWVyeSwgc2VsZWN0aW9uLCBmb3JjZSk7XG5cbiAgICAgICAgaWYgKCFjb21tYW5kKSByZXR1cm4gY29tcGxldGlvbnM7XG5cbiAgICAgICAgY29uc3QgZnVsbE1hdGNoID0gY29tbWFuZFswXTtcbiAgICAgICAgLy8gRG9uJ3Qgc2VhcmNoIGlmIHRoZSBxdWVyeSBpcyBhIHNpbmdsZSBcIkBcIlxuICAgICAgICBpZiAoZnVsbE1hdGNoICYmIGZ1bGxNYXRjaCAhPT0gJ0AnKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBpbmNsdWRlIHRoZSAnQCcgaW4gb3VyIHNlYXJjaCBxdWVyeSAtIGl0J3Mgb25seSB1c2VkIGFzIGEgd2F5IHRvIHRyaWdnZXIgY29tcGxldGlvblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBmdWxsTWF0Y2guc3RhcnRzV2l0aCgnQCcpID8gZnVsbE1hdGNoLnN1YnN0cmluZygxKSA6IGZ1bGxNYXRjaDtcbiAgICAgICAgICAgIGNvbXBsZXRpb25zID0gdGhpcy5tYXRjaGVyLm1hdGNoKHF1ZXJ5KS5tYXAoKHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9ICh1c2VyLm5hbWUgfHwgdXNlci51c2VySWQgfHwgJycpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIExlbmd0aCBvZiBjb21wbGV0aW9uIHNob3VsZCBlcXVhbCBsZW5ndGggb2YgdGV4dCBpbiBkZWNvcmF0b3IuIGRyYWZ0LWpzXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGllcyBvbiB0aGUgbGVuZ3RoIG9mIHRoZSBlbnRpdHkgPT09IGxlbmd0aCBvZiB0aGUgdGV4dCBpbiB0aGUgZGVjb3JhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbjogdXNlci5yYXdEaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbklkOiB1c2VyLnVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ1c2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeDogKHNlbGVjdGlvbi5iZWdpbm5pbmcgJiYgcmFuZ2Uuc3RhcnQgPT09IDApID8gJzogJyA6ICcgJyxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogbWFrZVVzZXJQZXJtYWxpbmsodXNlci51c2VySWQpLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxQaWxsQ29tcGxldGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDb21wb25lbnQ9ezxNZW1iZXJBdmF0YXIgbWVtYmVyPXt1c2VyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtkaXNwbGF5TmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17dXNlci51c2VySWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGxldGlvbnM7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ/CfkaUgJyArIF90KCdVc2VycycpO1xuICAgIH1cblxuICAgIF9tYWtlVXNlcnMoKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50cyA9IHRoaXMucm9vbS5nZXRMaXZlVGltZWxpbmUoKS5nZXRFdmVudHMoKTtcbiAgICAgICAgY29uc3QgbGFzdFNwb2tlbiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgICAgICBsYXN0U3Bva2VuW2V2ZW50LmdldFNlbmRlcigpXSA9IGV2ZW50LmdldFRzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50VXNlcklkID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWRlbnRpYWxzLnVzZXJJZDtcbiAgICAgICAgdGhpcy51c2VycyA9IHRoaXMucm9vbS5nZXRKb2luZWRNZW1iZXJzKCkuZmlsdGVyKCh7dXNlcklkfSkgPT4gdXNlcklkICE9PSBjdXJyZW50VXNlcklkKTtcblxuICAgICAgICB0aGlzLnVzZXJzID0gX3NvcnRCeSh0aGlzLnVzZXJzLCAobWVtYmVyKSA9PiAxRTIwIC0gbGFzdFNwb2tlblttZW1iZXIudXNlcklkXSB8fCAxRTIwKTtcblxuICAgICAgICB0aGlzLm1hdGNoZXIuc2V0T2JqZWN0cyh0aGlzLnVzZXJzKTtcbiAgICB9XG5cbiAgICBvblVzZXJTcG9rZSh1c2VyOiBSb29tTWVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy51c2VycykgcmV0dXJuO1xuICAgICAgICBpZiAoIXVzZXIpIHJldHVybjtcbiAgICAgICAgaWYgKHVzZXIudXNlcklkID09PSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkKSByZXR1cm47XG5cbiAgICAgICAgLy8gTW92ZSB0aGUgdXNlciB0aGF0IHNwb2tlIHRvIHRoZSBmcm9udCBvZiB0aGUgYXJyYXlcbiAgICAgICAgdGhpcy51c2Vycy5zcGxpY2UoXG4gICAgICAgICAgICB0aGlzLnVzZXJzLmZpbmRJbmRleCgodXNlcjIpID0+IHVzZXIyLnVzZXJJZCA9PT0gdXNlci51c2VySWQpLCAxKTtcbiAgICAgICAgdGhpcy51c2VycyA9IFt1c2VyLCAuLi50aGlzLnVzZXJzXTtcblxuICAgICAgICB0aGlzLm1hdGNoZXIuc2V0T2JqZWN0cyh0aGlzLnVzZXJzKTtcbiAgICB9XG5cbiAgICByZW5kZXJDb21wbGV0aW9ucyhjb21wbGV0aW9uczogUmVhY3QuUmVhY3ROb2RlW10pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9jb250YWluZXJfcGlsbFwiIHJvbGU9XCJsaXN0Ym94XCIgYXJpYS1sYWJlbD17X3QoXCJVc2VyIEF1dG9jb21wbGV0ZVwiKX0+XG4gICAgICAgICAgICAgICAgeyBjb21wbGV0aW9ucyB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzaG91bGRGb3JjZUNvbXBsZXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG4iXX0=