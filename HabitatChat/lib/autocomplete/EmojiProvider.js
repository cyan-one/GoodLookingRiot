"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../languageHandler");

var _AutocompleteProvider = _interopRequireDefault(require("./AutocompleteProvider"));

var _QueryMatcher = _interopRequireDefault(require("./QueryMatcher"));

var _Components = require("./Components");

var _uniq2 = _interopRequireDefault(require("lodash/uniq"));

var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));

var _SettingsStore = _interopRequireDefault(require("../settings/SettingsStore"));

var _HtmlUtils = require("../HtmlUtils");

var _emoji = require("../emoji");

var _emoticon = _interopRequireDefault(require("emojibase-regex/emoticon"));

/*
Copyright 2016 Aviral Dasgupta
Copyright 2017 Vector Creations Ltd
Copyright 2017, 2018 New Vector Ltd
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
const LIMIT = 20; // Match for ascii-style ";-)" emoticons or ":wink:" shortcodes provided by emojibase

const EMOJI_REGEX = new RegExp('(' + _emoticon.default.source + '|:[+-\\w]*:?)$', 'g');

const EMOJI_SHORTNAMES
/*: IEmojiShort[]*/
= _emoji.EMOJI.sort((a, b) => {
  if (a.group === b.group) {
    return a.order - b.order;
  }

  return a.group - b.group;
}).map((emoji, index) => ({
  emoji,
  shortname: ":".concat(emoji.shortcodes[0], ":"),
  // Include the index so that we can preserve the original order
  _orderBy: index
}));

function score(query, space) {
  const index = space.indexOf(query);

  if (index === -1) {
    return Infinity;
  } else {
    return index;
  }
}

class EmojiProvider extends _AutocompleteProvider.default {
  constructor() {
    super(EMOJI_REGEX);
    (0, _defineProperty2.default)(this, "matcher", void 0);
    (0, _defineProperty2.default)(this, "nameMatcher", void 0);
    this.matcher = new _QueryMatcher.default(EMOJI_SHORTNAMES, {
      keys: ['emoji.emoticon', 'shortname'],
      funcs: [o => o.emoji.shortcodes.length > 1 ? o.emoji.shortcodes.slice(1).map(s => ":".concat(s, ":")).join(" ") : "" // aliases
      ],
      // For matching against ascii equivalents
      shouldMatchWordsOnly: false
    });
    this.nameMatcher = new _QueryMatcher.default(EMOJI_SHORTNAMES, {
      keys: ['emoji.annotation'],
      // For removing punctuation
      shouldMatchWordsOnly: true
    });
  }

  async getCompletions(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force
  /*: boolean*/
  )
  /*: Promise<ICompletion[]>*/
  {
    if (!_SettingsStore.default.getValue("MessageComposerInput.suggestEmoji")) {
      return []; // don't give any suggestions if the user doesn't want them
    }

    let completions = [];
    const {
      command,
      range
    } = this.getCurrentCommand(query, selection);

    if (command) {
      const matchedString = command[0];
      completions = this.matcher.match(matchedString); // Do second match with shouldMatchWordsOnly in order to match against 'name'

      completions = completions.concat(this.nameMatcher.match(matchedString));
      const sorters = []; // make sure that emoticons come first

      sorters.push(c => score(matchedString, c.emoji.emoticon || "")); // then sort by score (Infinity if matchedString not in shortname)

      sorters.push(c => score(matchedString, c.shortname)); // then sort by max score of all shortcodes, trim off the `:`

      sorters.push(c => Math.min(...c.emoji.shortcodes.map(s => score(matchedString.substring(1), s)))); // If the matchedString is not empty, sort by length of shortname. Example:
      //  matchedString = ":bookmark"
      //  completions = [":bookmark:", ":bookmark_tabs:", ...]

      if (matchedString.length > 1) {
        sorters.push(c => c.shortname.length);
      } // Finally, sort by original ordering


      sorters.push(c => c._orderBy);
      completions = (0, _sortBy2.default)((0, _uniq2.default)(completions), sorters);
      completions = completions.map(({
        shortname
      }) => {
        const unicode = (0, _HtmlUtils.shortcodeToUnicode)(shortname);
        return {
          completion: unicode,
          component: /*#__PURE__*/_react.default.createElement(_Components.PillCompletion, {
            title: shortname,
            "aria-label": unicode,
            initialComponent: /*#__PURE__*/_react.default.createElement("span", {
              style: {
                maxWidth: '1em'
              }
            }, unicode)
          }),
          range
        };
      }).slice(0, LIMIT);
    }

    return completions;
  }

  getName() {
    return '😃 ' + (0, _languageHandler._t)('Emoji');
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_pill",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("Emoji Autocomplete")
    }, completions);
  }

}

exports.default = EmojiProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvRW1vamlQcm92aWRlci50c3giXSwibmFtZXMiOlsiTElNSVQiLCJFTU9KSV9SRUdFWCIsIlJlZ0V4cCIsIkVNT1RJQ09OX1JFR0VYIiwic291cmNlIiwiRU1PSklfU0hPUlROQU1FUyIsIkVNT0pJIiwic29ydCIsImEiLCJiIiwiZ3JvdXAiLCJvcmRlciIsIm1hcCIsImVtb2ppIiwiaW5kZXgiLCJzaG9ydG5hbWUiLCJzaG9ydGNvZGVzIiwiX29yZGVyQnkiLCJzY29yZSIsInF1ZXJ5Iiwic3BhY2UiLCJpbmRleE9mIiwiSW5maW5pdHkiLCJFbW9qaVByb3ZpZGVyIiwiQXV0b2NvbXBsZXRlUHJvdmlkZXIiLCJjb25zdHJ1Y3RvciIsIm1hdGNoZXIiLCJRdWVyeU1hdGNoZXIiLCJrZXlzIiwiZnVuY3MiLCJvIiwibGVuZ3RoIiwic2xpY2UiLCJzIiwiam9pbiIsInNob3VsZE1hdGNoV29yZHNPbmx5IiwibmFtZU1hdGNoZXIiLCJnZXRDb21wbGV0aW9ucyIsInNlbGVjdGlvbiIsImZvcmNlIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiY29tcGxldGlvbnMiLCJjb21tYW5kIiwicmFuZ2UiLCJnZXRDdXJyZW50Q29tbWFuZCIsIm1hdGNoZWRTdHJpbmciLCJtYXRjaCIsImNvbmNhdCIsInNvcnRlcnMiLCJwdXNoIiwiYyIsImVtb3RpY29uIiwiTWF0aCIsIm1pbiIsInN1YnN0cmluZyIsInVuaWNvZGUiLCJjb21wbGV0aW9uIiwiY29tcG9uZW50IiwibWF4V2lkdGgiLCJnZXROYW1lIiwicmVuZGVyQ29tcGxldGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQS9CQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUNBLE1BQU1BLEtBQUssR0FBRyxFQUFkLEMsQ0FFQTs7QUFDQSxNQUFNQyxX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Q0csUUFBQUE7QUFBRCxPQUFELEtBQWlCO0FBQzNDLGNBQU15QyxPQUFPLEdBQUcsbUNBQW1CekMsU0FBbkIsQ0FBaEI7QUFDQSxlQUFPO0FBQ0gwQyxVQUFBQSxVQUFVLEVBQUVELE9BRFQ7QUFFSEUsVUFBQUEsU0FBUyxlQUNMLDZCQUFDLDBCQUFEO0FBQWdCLFlBQUEsS0FBSyxFQUFFM0MsU0FBdkI7QUFBa0MsMEJBQVl5QyxPQUE5QztBQUF1RCxZQUFBLGdCQUFnQixlQUNuRTtBQUFNLGNBQUEsS0FBSyxFQUFFO0FBQUNHLGdCQUFBQSxRQUFRLEVBQUU7QUFBWDtBQUFiLGVBQWtDSCxPQUFsQztBQURKLFlBSEQ7QUFPSFosVUFBQUE7QUFQRyxTQUFQO0FBU0gsT0FYYSxFQVdYWixLQVhXLENBV0wsQ0FYSyxFQVdGaEMsS0FYRSxDQUFkO0FBWUg7O0FBQ0QsV0FBTzBDLFdBQVA7QUFDSDs7QUFFRGtCLEVBQUFBLE9BQU8sR0FBRztBQUNOLFdBQU8sUUFBUSx5QkFBRyxPQUFILENBQWY7QUFDSDs7QUFFREMsRUFBQUEsaUJBQWlCLENBQUNuQjtBQUFEO0FBQUE7QUFBQTtBQUFrRDtBQUMvRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLDJDQUFmO0FBQTJELE1BQUEsSUFBSSxFQUFDLFNBQWhFO0FBQTBFLG9CQUFZLHlCQUFHLG9CQUFIO0FBQXRGLE9BQ01BLFdBRE4sQ0FESjtBQUtIOztBQS9FMkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgQXZpcmFsIERhc2d1cHRhXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBBdXRvY29tcGxldGVQcm92aWRlciBmcm9tICcuL0F1dG9jb21wbGV0ZVByb3ZpZGVyJztcbmltcG9ydCBRdWVyeU1hdGNoZXIgZnJvbSAnLi9RdWVyeU1hdGNoZXInO1xuaW1wb3J0IHtQaWxsQ29tcGxldGlvbn0gZnJvbSAnLi9Db21wb25lbnRzJztcbmltcG9ydCB7SUNvbXBsZXRpb24sIElTZWxlY3Rpb25SYW5nZX0gZnJvbSAnLi9BdXRvY29tcGxldGVyJztcbmltcG9ydCBfdW5pcSBmcm9tICdsb2Rhc2gvdW5pcSc7XG5pbXBvcnQgX3NvcnRCeSBmcm9tICdsb2Rhc2gvc29ydEJ5JztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgeyBzaG9ydGNvZGVUb1VuaWNvZGUgfSBmcm9tICcuLi9IdG1sVXRpbHMnO1xuaW1wb3J0IHsgRU1PSkksIElFbW9qaSB9IGZyb20gJy4uL2Vtb2ppJztcblxuaW1wb3J0IEVNT1RJQ09OX1JFR0VYIGZyb20gJ2Vtb2ppYmFzZS1yZWdleC9lbW90aWNvbic7XG5cbmNvbnN0IExJTUlUID0gMjA7XG5cbi8vIE1hdGNoIGZvciBhc2NpaS1zdHlsZSBcIjstKVwiIGVtb3RpY29ucyBvciBcIjp3aW5rOlwiIHNob3J0Y29kZXMgcHJvdmlkZWQgYnkgZW1vamliYXNlXG5jb25zdCBFTU9KSV9SRUdFWCA9IG5ldyBSZWdFeHAoJygnICsgRU1PVElDT05fUkVHRVguc291cmNlICsgJ3w6WystXFxcXHddKjo/KSQnLCAnZycpO1xuXG5pbnRlcmZhY2UgSUVtb2ppU2hvcnQge1xuICAgIGVtb2ppOiBJRW1vamk7XG4gICAgc2hvcnRuYW1lOiBzdHJpbmc7XG4gICAgX29yZGVyQnk6IG51bWJlcjtcbn1cblxuY29uc3QgRU1PSklfU0hPUlROQU1FUzogSUVtb2ppU2hvcnRbXSA9IEVNT0pJLnNvcnQoKGEsIGIpID0+IHtcbiAgICBpZiAoYS5ncm91cCA9PT0gYi5ncm91cCkge1xuICAgICAgICByZXR1cm4gYS5vcmRlciAtIGIub3JkZXI7XG4gICAgfVxuICAgIHJldHVybiBhLmdyb3VwIC0gYi5ncm91cDtcbn0pLm1hcCgoZW1vamksIGluZGV4KSA9PiAoe1xuICAgIGVtb2ppLFxuICAgIHNob3J0bmFtZTogYDoke2Vtb2ppLnNob3J0Y29kZXNbMF19OmAsXG4gICAgLy8gSW5jbHVkZSB0aGUgaW5kZXggc28gdGhhdCB3ZSBjYW4gcHJlc2VydmUgdGhlIG9yaWdpbmFsIG9yZGVyXG4gICAgX29yZGVyQnk6IGluZGV4LFxufSkpO1xuXG5mdW5jdGlvbiBzY29yZShxdWVyeSwgc3BhY2UpIHtcbiAgICBjb25zdCBpbmRleCA9IHNwYWNlLmluZGV4T2YocXVlcnkpO1xuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVtb2ppUHJvdmlkZXIgZXh0ZW5kcyBBdXRvY29tcGxldGVQcm92aWRlciB7XG4gICAgbWF0Y2hlcjogUXVlcnlNYXRjaGVyPElFbW9qaVNob3J0PjtcbiAgICBuYW1lTWF0Y2hlcjogUXVlcnlNYXRjaGVyPElFbW9qaVNob3J0PjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihFTU9KSV9SRUdFWCk7XG4gICAgICAgIHRoaXMubWF0Y2hlciA9IG5ldyBRdWVyeU1hdGNoZXIoRU1PSklfU0hPUlROQU1FUywge1xuICAgICAgICAgICAga2V5czogWydlbW9qaS5lbW90aWNvbicsICdzaG9ydG5hbWUnXSxcbiAgICAgICAgICAgIGZ1bmNzOiBbXG4gICAgICAgICAgICAgICAgKG8pID0+IG8uZW1vamkuc2hvcnRjb2Rlcy5sZW5ndGggPiAxID8gby5lbW9qaS5zaG9ydGNvZGVzLnNsaWNlKDEpLm1hcChzID0+IGA6JHtzfTpgKS5qb2luKFwiIFwiKSA6IFwiXCIsIC8vIGFsaWFzZXNcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYWdhaW5zdCBhc2NpaSBlcXVpdmFsZW50c1xuICAgICAgICAgICAgc2hvdWxkTWF0Y2hXb3Jkc09ubHk6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5uYW1lTWF0Y2hlciA9IG5ldyBRdWVyeU1hdGNoZXIoRU1PSklfU0hPUlROQU1FUywge1xuICAgICAgICAgICAga2V5czogWydlbW9qaS5hbm5vdGF0aW9uJ10sXG4gICAgICAgICAgICAvLyBGb3IgcmVtb3ZpbmcgcHVuY3R1YXRpb25cbiAgICAgICAgICAgIHNob3VsZE1hdGNoV29yZHNPbmx5OiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRDb21wbGV0aW9ucyhxdWVyeTogc3RyaW5nLCBzZWxlY3Rpb246IElTZWxlY3Rpb25SYW5nZSwgZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTxJQ29tcGxldGlvbltdPiB7XG4gICAgICAgIGlmICghU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcIk1lc3NhZ2VDb21wb3NlcklucHV0LnN1Z2dlc3RFbW9qaVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdOyAvLyBkb24ndCBnaXZlIGFueSBzdWdnZXN0aW9ucyBpZiB0aGUgdXNlciBkb2Vzbid0IHdhbnQgdGhlbVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbXBsZXRpb25zID0gW107XG4gICAgICAgIGNvbnN0IHtjb21tYW5kLCByYW5nZX0gPSB0aGlzLmdldEN1cnJlbnRDb21tYW5kKHF1ZXJ5LCBzZWxlY3Rpb24pO1xuICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hlZFN0cmluZyA9IGNvbW1hbmRbMF07XG4gICAgICAgICAgICBjb21wbGV0aW9ucyA9IHRoaXMubWF0Y2hlci5tYXRjaChtYXRjaGVkU3RyaW5nKTtcblxuICAgICAgICAgICAgLy8gRG8gc2Vjb25kIG1hdGNoIHdpdGggc2hvdWxkTWF0Y2hXb3Jkc09ubHkgaW4gb3JkZXIgdG8gbWF0Y2ggYWdhaW5zdCAnbmFtZSdcbiAgICAgICAgICAgIGNvbXBsZXRpb25zID0gY29tcGxldGlvbnMuY29uY2F0KHRoaXMubmFtZU1hdGNoZXIubWF0Y2gobWF0Y2hlZFN0cmluZykpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0ZXJzID0gW107XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCBlbW90aWNvbnMgY29tZSBmaXJzdFxuICAgICAgICAgICAgc29ydGVycy5wdXNoKChjKSA9PiBzY29yZShtYXRjaGVkU3RyaW5nLCBjLmVtb2ppLmVtb3RpY29uIHx8IFwiXCIpKTtcblxuICAgICAgICAgICAgLy8gdGhlbiBzb3J0IGJ5IHNjb3JlIChJbmZpbml0eSBpZiBtYXRjaGVkU3RyaW5nIG5vdCBpbiBzaG9ydG5hbWUpXG4gICAgICAgICAgICBzb3J0ZXJzLnB1c2goKGMpID0+IHNjb3JlKG1hdGNoZWRTdHJpbmcsIGMuc2hvcnRuYW1lKSk7XG4gICAgICAgICAgICAvLyB0aGVuIHNvcnQgYnkgbWF4IHNjb3JlIG9mIGFsbCBzaG9ydGNvZGVzLCB0cmltIG9mZiB0aGUgYDpgXG4gICAgICAgICAgICBzb3J0ZXJzLnB1c2goKGMpID0+IE1hdGgubWluKC4uLmMuZW1vamkuc2hvcnRjb2Rlcy5tYXAocyA9PiBzY29yZShtYXRjaGVkU3RyaW5nLnN1YnN0cmluZygxKSwgcykpKSk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbWF0Y2hlZFN0cmluZyBpcyBub3QgZW1wdHksIHNvcnQgYnkgbGVuZ3RoIG9mIHNob3J0bmFtZS4gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vICBtYXRjaGVkU3RyaW5nID0gXCI6Ym9va21hcmtcIlxuICAgICAgICAgICAgLy8gIGNvbXBsZXRpb25zID0gW1wiOmJvb2ttYXJrOlwiLCBcIjpib29rbWFya190YWJzOlwiLCAuLi5dXG4gICAgICAgICAgICBpZiAobWF0Y2hlZFN0cmluZy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgc29ydGVycy5wdXNoKChjKSA9PiBjLnNob3J0bmFtZS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmluYWxseSwgc29ydCBieSBvcmlnaW5hbCBvcmRlcmluZ1xuICAgICAgICAgICAgc29ydGVycy5wdXNoKChjKSA9PiBjLl9vcmRlckJ5KTtcbiAgICAgICAgICAgIGNvbXBsZXRpb25zID0gX3NvcnRCeShfdW5pcShjb21wbGV0aW9ucyksIHNvcnRlcnMpO1xuXG4gICAgICAgICAgICBjb21wbGV0aW9ucyA9IGNvbXBsZXRpb25zLm1hcCgoe3Nob3J0bmFtZX0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB1bmljb2RlID0gc2hvcnRjb2RlVG9Vbmljb2RlKHNob3J0bmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbjogdW5pY29kZSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8UGlsbENvbXBsZXRpb24gdGl0bGU9e3Nob3J0bmFtZX0gYXJpYS1sYWJlbD17dW5pY29kZX0gaW5pdGlhbENvbXBvbmVudD17XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3ttYXhXaWR0aDogJzFlbSd9fT57IHVuaWNvZGUgfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gLz5cbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2UsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pLnNsaWNlKDAsIExJTUlUKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGxldGlvbnM7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuICfwn5iDICcgKyBfdCgnRW1vamknKTtcbiAgICB9XG5cbiAgICByZW5kZXJDb21wbGV0aW9ucyhjb21wbGV0aW9uczogUmVhY3QuUmVhY3ROb2RlW10pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9jb250YWluZXJfcGlsbFwiIHJvbGU9XCJsaXN0Ym94XCIgYXJpYS1sYWJlbD17X3QoXCJFbW9qaSBBdXRvY29tcGxldGVcIil9PlxuICAgICAgICAgICAgICAgIHsgY29tcGxldGlvbnMgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19