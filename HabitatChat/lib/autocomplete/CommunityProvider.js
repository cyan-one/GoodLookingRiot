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

var _MatrixClientPeg = require("../MatrixClientPeg");

var _QueryMatcher = _interopRequireDefault(require("./QueryMatcher"));

var _Components = require("./Components");

var sdk = _interopRequireWildcard(require("../index"));

var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));

var _Permalinks = require("../utils/permalinks/Permalinks");

var _FlairStore = _interopRequireDefault(require("../stores/FlairStore"));

/*
Copyright 2018 New Vector Ltd
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
const COMMUNITY_REGEX = /\B\+\S*/g;

function score(query, space) {
  const index = space.indexOf(query);

  if (index === -1) {
    return Infinity;
  } else {
    return index;
  }
}

class CommunityProvider extends _AutocompleteProvider.default {
  constructor() {
    super(COMMUNITY_REGEX);
    (0, _defineProperty2.default)(this, "matcher", void 0);
    this.matcher = new _QueryMatcher.default([], {
      keys: ['groupId', 'name', 'shortDescription']
    });
  }

  async getCompletions(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false)
  /*: Promise<ICompletion[]>*/
  {
    const BaseAvatar = sdk.getComponent('views.avatars.BaseAvatar'); // Disable autocompletions when composing commands because of various issues
    // (see https://github.com/vector-im/riot-web/issues/4762)

    if (/^(\/join|\/leave)/.test(query)) {
      return [];
    }

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    let completions = [];
    const {
      command,
      range
    } = this.getCurrentCommand(query, selection, force);

    if (command) {
      const joinedGroups = cli.getGroups().filter(({
        myMembership
      }) => myMembership === 'join');
      const groups = await Promise.all(joinedGroups.map(async ({
        groupId
      }) => {
        try {
          return _FlairStore.default.getGroupProfileCached(cli, groupId);
        } catch (e) {
          // if FlairStore failed, fall back to just groupId
          return Promise.resolve({
            name: '',
            groupId,
            avatarUrl: '',
            shortDescription: ''
          });
        }
      }));
      this.matcher.setObjects(groups);
      const matchedString = command[0];
      completions = this.matcher.match(matchedString);
      completions = (0, _sortBy2.default)(completions, [c => score(matchedString, c.groupId), c => c.groupId.length]).map(({
        avatarUrl,
        groupId,
        name
      }) => ({
        completion: groupId,
        suffix: ' ',
        type: "community",
        href: (0, _Permalinks.makeGroupPermalink)(groupId),
        component: /*#__PURE__*/_react.default.createElement(_Components.PillCompletion, {
          initialComponent: /*#__PURE__*/_react.default.createElement(BaseAvatar, {
            name: name || groupId,
            width: 24,
            height: 24,
            url: avatarUrl ? cli.mxcUrlToHttp(avatarUrl, 24, 24) : null
          }),
          title: name,
          description: groupId
        }),
        range
      })).slice(0, 4);
    }

    return completions;
  }

  getName() {
    return '💬 ' + (0, _languageHandler._t)('Communities');
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_pill mx_Autocomplete_Completion_container_truncate",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("Community Autocomplete")
    }, completions);
  }

}

exports.default = CommunityProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvQ29tbXVuaXR5UHJvdmlkZXIudHN4Il0sIm5hbWVzIjpbIkNPTU1VTklUWV9SRUdFWCIsInNjb3JlIiwicXVlcnkiLCJzcGFjZSIsImluZGV4IiwiaW5kZXhPZiIsIkluZmluaXR5IiwiQ29tbXVuaXR5UHJvdmlkZXIiLCJBdXRvY29tcGxldGVQcm92aWRlciIsImNvbnN0cnVjdG9yIiwibWF0Y2hlciIsIlF1ZXJ5TWF0Y2hlciIsImtleXMiLCJnZXRDb21wbGV0aW9ucyIsInNlbGVjdGlvbiIsImZvcmNlIiwiQmFzZUF2YXRhciIsInNkayIsImdldENvbXBvbmVudCIsInRlc3QiLCJjbGkiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJjb21wbGV0aW9ucyIsImNvbW1hbmQiLCJyYW5nZSIsImdldEN1cnJlbnRDb21tYW5kIiwiam9pbmVkR3JvdXBzIiwiZ2V0R3JvdXBzIiwiZmlsdGVyIiwibXlNZW1iZXJzaGlwIiwiZ3JvdXBzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImdyb3VwSWQiLCJGbGFpclN0b3JlIiwiZ2V0R3JvdXBQcm9maWxlQ2FjaGVkIiwiZSIsInJlc29sdmUiLCJuYW1lIiwiYXZhdGFyVXJsIiwic2hvcnREZXNjcmlwdGlvbiIsInNldE9iamVjdHMiLCJtYXRjaGVkU3RyaW5nIiwibWF0Y2giLCJjIiwibGVuZ3RoIiwiY29tcGxldGlvbiIsInN1ZmZpeCIsInR5cGUiLCJocmVmIiwiY29tcG9uZW50IiwibXhjVXJsVG9IdHRwIiwic2xpY2UiLCJnZXROYW1lIiwicmVuZGVyQ29tcGxldGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBNUJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLE1BQU1BLGVBQWUsR0FBRyxVQUF4Qjs7QUFFQSxTQUFTQyxLQUFULENBQWVDLEtBQWYsRUFB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QUEsSUFBSSxFQUFFLG9DQUFtQmhCLE9BQW5CLENBSjhCO0FBS3BDaUIsUUFBQUEsU0FBUyxlQUNMLDZCQUFDLDBCQUFEO0FBQWdCLFVBQUEsZ0JBQWdCLGVBQzVCLDZCQUFDLFVBQUQ7QUFBWSxZQUFBLElBQUksRUFBRVosSUFBSSxJQUFJTCxPQUExQjtBQUNZLFlBQUEsS0FBSyxFQUFFLEVBRG5CO0FBQ3VCLFlBQUEsTUFBTSxFQUFFLEVBRC9CO0FBRVksWUFBQSxHQUFHLEVBQUVNLFNBQVMsR0FBR3JCLEdBQUcsQ0FBQ2lDLFlBQUosQ0FBaUJaLFNBQWpCLEVBQTRCLEVBQTVCLEVBQWdDLEVBQWhDLENBQUgsR0FBeUM7QUFGbkUsWUFESjtBQUlFLFVBQUEsS0FBSyxFQUFFRCxJQUpUO0FBSWUsVUFBQSxXQUFXLEVBQUVMO0FBSjVCLFVBTmdDO0FBWXBDVixRQUFBQTtBQVpvQyxPQUFqQyxDQUhPLEVBaUJiNkIsS0FqQmEsQ0FpQlAsQ0FqQk8sRUFpQkosQ0FqQkksQ0FBZDtBQWtCSDs7QUFDRCxXQUFPL0IsV0FBUDtBQUNIOztBQUVEZ0MsRUFBQUEsT0FBTyxHQUFHO0FBQ04sV0FBTyxRQUFRLHlCQUFHLGFBQUgsQ0FBZjtBQUNIOztBQUVEQyxFQUFBQSxpQkFBaUIsQ0FBQ2pDO0FBQUQ7QUFBQTtBQUFBO0FBQWtEO0FBQy9ELHdCQUNJO0FBQ0ksTUFBQSxTQUFTLEVBQUMseUZBRGQ7QUFFSSxNQUFBLElBQUksRUFBQyxTQUZUO0FBR0ksb0JBQVkseUJBQUcsd0JBQUg7QUFIaEIsT0FLTUEsV0FMTixDQURKO0FBU0g7O0FBOUUrRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBHcm91cCBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL2dyb3VwXCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQXV0b2NvbXBsZXRlUHJvdmlkZXIgZnJvbSAnLi9BdXRvY29tcGxldGVQcm92aWRlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBRdWVyeU1hdGNoZXIgZnJvbSAnLi9RdWVyeU1hdGNoZXInO1xuaW1wb3J0IHtQaWxsQ29tcGxldGlvbn0gZnJvbSAnLi9Db21wb25lbnRzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgX3NvcnRCeSBmcm9tICdsb2Rhc2gvc29ydEJ5JztcbmltcG9ydCB7bWFrZUdyb3VwUGVybWFsaW5rfSBmcm9tIFwiLi4vdXRpbHMvcGVybWFsaW5rcy9QZXJtYWxpbmtzXCI7XG5pbXBvcnQge0lDb21wbGV0aW9uLCBJU2VsZWN0aW9uUmFuZ2V9IGZyb20gXCIuL0F1dG9jb21wbGV0ZXJcIjtcbmltcG9ydCBGbGFpclN0b3JlIGZyb20gXCIuLi9zdG9yZXMvRmxhaXJTdG9yZVwiO1xuXG5jb25zdCBDT01NVU5JVFlfUkVHRVggPSAvXFxCXFwrXFxTKi9nO1xuXG5mdW5jdGlvbiBzY29yZShxdWVyeSwgc3BhY2UpIHtcbiAgICBjb25zdCBpbmRleCA9IHNwYWNlLmluZGV4T2YocXVlcnkpO1xuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbW11bml0eVByb3ZpZGVyIGV4dGVuZHMgQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIG1hdGNoZXI6IFF1ZXJ5TWF0Y2hlcjxHcm91cD47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoQ09NTVVOSVRZX1JFR0VYKTtcbiAgICAgICAgdGhpcy5tYXRjaGVyID0gbmV3IFF1ZXJ5TWF0Y2hlcihbXSwge1xuICAgICAgICAgICAga2V5czogWydncm91cElkJywgJ25hbWUnLCAnc2hvcnREZXNjcmlwdGlvbiddLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRDb21wbGV0aW9ucyhxdWVyeTogc3RyaW5nLCBzZWxlY3Rpb246IElTZWxlY3Rpb25SYW5nZSwgZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8SUNvbXBsZXRpb25bXT4ge1xuICAgICAgICBjb25zdCBCYXNlQXZhdGFyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuYXZhdGFycy5CYXNlQXZhdGFyJyk7XG5cbiAgICAgICAgLy8gRGlzYWJsZSBhdXRvY29tcGxldGlvbnMgd2hlbiBjb21wb3NpbmcgY29tbWFuZHMgYmVjYXVzZSBvZiB2YXJpb3VzIGlzc3Vlc1xuICAgICAgICAvLyAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzQ3NjIpXG4gICAgICAgIGlmICgvXihcXC9qb2lufFxcL2xlYXZlKS8udGVzdChxdWVyeSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgbGV0IGNvbXBsZXRpb25zID0gW107XG4gICAgICAgIGNvbnN0IHtjb21tYW5kLCByYW5nZX0gPSB0aGlzLmdldEN1cnJlbnRDb21tYW5kKHF1ZXJ5LCBzZWxlY3Rpb24sIGZvcmNlKTtcbiAgICAgICAgaWYgKGNvbW1hbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGpvaW5lZEdyb3VwcyA9IGNsaS5nZXRHcm91cHMoKS5maWx0ZXIoKHtteU1lbWJlcnNoaXB9KSA9PiBteU1lbWJlcnNoaXAgPT09ICdqb2luJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGdyb3VwcyA9IChhd2FpdCBQcm9taXNlLmFsbChqb2luZWRHcm91cHMubWFwKGFzeW5jICh7Z3JvdXBJZH0pID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRmxhaXJTdG9yZS5nZXRHcm91cFByb2ZpbGVDYWNoZWQoY2xpLCBncm91cElkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IC8vIGlmIEZsYWlyU3RvcmUgZmFpbGVkLCBmYWxsIGJhY2sgdG8ganVzdCBncm91cElkXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0RGVzY3JpcHRpb246ICcnLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSkpO1xuXG4gICAgICAgICAgICB0aGlzLm1hdGNoZXIuc2V0T2JqZWN0cyhncm91cHMpO1xuXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVkU3RyaW5nID0gY29tbWFuZFswXTtcbiAgICAgICAgICAgIGNvbXBsZXRpb25zID0gdGhpcy5tYXRjaGVyLm1hdGNoKG1hdGNoZWRTdHJpbmcpO1xuICAgICAgICAgICAgY29tcGxldGlvbnMgPSBfc29ydEJ5KGNvbXBsZXRpb25zLCBbXG4gICAgICAgICAgICAgICAgKGMpID0+IHNjb3JlKG1hdGNoZWRTdHJpbmcsIGMuZ3JvdXBJZCksXG4gICAgICAgICAgICAgICAgKGMpID0+IGMuZ3JvdXBJZC5sZW5ndGgsXG4gICAgICAgICAgICBdKS5tYXAoKHthdmF0YXJVcmwsIGdyb3VwSWQsIG5hbWV9KSA9PiAoe1xuICAgICAgICAgICAgICAgIGNvbXBsZXRpb246IGdyb3VwSWQsXG4gICAgICAgICAgICAgICAgc3VmZml4OiAnICcsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJjb21tdW5pdHlcIixcbiAgICAgICAgICAgICAgICBocmVmOiBtYWtlR3JvdXBQZXJtYWxpbmsoZ3JvdXBJZCksXG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiAoXG4gICAgICAgICAgICAgICAgICAgIDxQaWxsQ29tcGxldGlvbiBpbml0aWFsQ29tcG9uZW50PXtcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCYXNlQXZhdGFyIG5hbWU9e25hbWUgfHwgZ3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybD17YXZhdGFyVXJsID8gY2xpLm14Y1VybFRvSHR0cChhdmF0YXJVcmwsIDI0LCAyNCkgOiBudWxsfSAvPlxuICAgICAgICAgICAgICAgICAgICB9IHRpdGxlPXtuYW1lfSBkZXNjcmlwdGlvbj17Z3JvdXBJZH0gLz5cbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAuc2xpY2UoMCwgNCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBsZXRpb25zO1xuICAgIH1cblxuICAgIGdldE5hbWUoKSB7XG4gICAgICAgIHJldHVybiAn8J+SrCAnICsgX3QoJ0NvbW11bml0aWVzJyk7XG4gICAgfVxuXG4gICAgcmVuZGVyQ29tcGxldGlvbnMoY29tcGxldGlvbnM6IFJlYWN0LlJlYWN0Tm9kZVtdKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9jb250YWluZXJfcGlsbCBteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9jb250YWluZXJfdHJ1bmNhdGVcIlxuICAgICAgICAgICAgICAgIHJvbGU9XCJsaXN0Ym94XCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtfdChcIkNvbW11bml0eSBBdXRvY29tcGxldGVcIil9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgeyBjb21wbGV0aW9ucyB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=