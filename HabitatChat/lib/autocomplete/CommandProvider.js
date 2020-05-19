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

var _SlashCommands = require("../SlashCommands");

/*
Copyright 2016 Aviral Dasgupta
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd
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
const COMMAND_RE = /(^\/\w*)(?: .*)?/g;

class CommandProvider extends _AutocompleteProvider.default {
  constructor() {
    super(COMMAND_RE);
    (0, _defineProperty2.default)(this, "matcher", void 0);
    this.matcher = new _QueryMatcher.default(_SlashCommands.Commands, {
      keys: ['command', 'args', 'description'],
      funcs: [({
        aliases
      }) => aliases.join(" ")] // aliases

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
    const {
      command,
      range
    } = this.getCurrentCommand(query, selection);
    if (!command) return [];
    let matches = []; // check if the full match differs from the first word (i.e. returns false if the command has args)

    if (command[0] !== command[1]) {
      // The input looks like a command with arguments, perform exact match
      const name = command[1].substr(1); // strip leading `/`

      if (_SlashCommands.CommandMap.has(name)) {
        // some commands, namely `me` and `ddg` don't suit having the usage shown whilst typing their arguments
        if (_SlashCommands.CommandMap.get(name).hideCompletionAfterSpace) return [];
        matches = [_SlashCommands.CommandMap.get(name)];
      }
    } else {
      if (query === '/') {
        // If they have just entered `/` show everything
        matches = _SlashCommands.Commands;
      } else {
        // otherwise fuzzy match against all of the fields
        matches = this.matcher.match(command[1]);
      }
    }

    return matches.map(result => {
      let completion = result.getCommand() + ' ';
      const usedAlias = result.aliases.find(alias => "/".concat(alias) === command[1]); // If the command (or an alias) is the same as the one they entered, we don't want to discard their arguments

      if (usedAlias || result.getCommand() === command[1]) {
        completion = command[0];
      }

      return {
        completion,
        type: "command",
        component: /*#__PURE__*/_react.default.createElement(_Components.TextualCompletion, {
          title: "/".concat(usedAlias || result.command),
          subtitle: result.args,
          description: (0, _languageHandler._t)(result.description)
        }),
        range
      };
    });
  }

  getName() {
    return '*️⃣ ' + (0, _languageHandler._t)('Commands');
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_block",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("Command Autocomplete")
    }, completions);
  }

}

exports.default = CommandProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvQ29tbWFuZFByb3ZpZGVyLnRzeCJdLCJuYW1lcyI6WyJDT01NQU5EX1JFIiwiQ29tbWFuZFByb3ZpZGVyIiwiQXV0b2NvbXBsZXRlUHJvdmlkZXIiLCJjb25zdHJ1Y3RvciIsIm1hdGNoZXIiLCJRdWVyeU1hdGNoZXIiLCJDb21tYW5kcyIsImtleXMiLCJmdW5jcyIsImFsaWFzZXMiLCJqb2luIiwiZ2V0Q29tcGxldGlvbnMiLCJxdWVyeSIsInNlbGVjdGlvbiIsImZvcmNlIiwiY29tbWFuZCIsInJhbmdlIiwiZ2V0Q3VycmVudENvbW1hbmQiLCJtYXRjaGVzIiwibmFtZSIsInN1YnN0ciIsIkNvbW1hbmRNYXAiLCJoYXMiLCJnZXQiLCJoaWRlQ29tcGxldGlvbkFmdGVyU3BhY2UiLCJtYXRjaCIsIm1hcCIsInJlc3VsdCIsImNvbXBsZXRpb24iLCJnZXRDb21tYW5kIiwidXNlZEFsaWFzIiwiZmluZCIsImFsaWFzIiwidHlwZSIsImNvbXBvbmVudCIsImFyZ3MiLCJkZXNjcmlwdGlvbiIsImdldE5hbWUiLCJyZW5kZXJDb21wbGV0aW9ucyIsImNvbXBsZXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUF6QkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxNQUFNQSxVQUFVLEdBQUcsbUJBQW5COztBQUVlLE1BQU1DLGVBQU4sU0FBOEJDLDZCQUE5QixDQUFtRDtBQUc5REMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsVUFBTUgsVUFBTjtBQURVO0FBRVYsU0FBS0ksT0FBTCxHQUFlLElBQUlDLHFCQUFKLENBQWlCQyx1QkFBakIsRUFBMkI7QUFDdENDLE1BQUFBLElBQUksRUFBRSxDQUFDLFNBQUQsRUFBWSxNQUFaLEVBQW9CLGFBQXBCLENBRGdDO0FBRXRDQyxNQUFBQSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQUNDLFFBQUFBO0FBQUQsT0FBRCxLQUFlQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxHQUFiLENBQWhCLENBRitCLENBRUs7O0FBRkwsS0FBM0IsQ0FBZjtBQUlIOztBQUVELFFBQU1DLGNBQU4sQ0FBcUJDO0FBQXJCO0FBQUEsSUFBb0NDO0FBQXBDO0FBQUEsSUFBZ0VDO0FBQWhFO0FBQUE7QUFBQTtBQUF5RztBQUNyRyxVQUFNO0FBQUNDLE1BQUFBLE9BQUQ7QUFBVUMsTUFBQUE7QUFBVixRQUFtQixLQUFLQyxpQkFBTCxDQUF1QkwsS0FBdkIsRUFBOEJDLFNBQTlCLENBQXpCO0FBQ0EsUUFBSSxDQUFDRSxPQUFMLEVBQWMsT0FBTyxFQUFQO0FBRWQsUUFBSUcsT0FBTyxHQUFHLEVBQWQsQ0FKcUcsQ0FLckc7O0FBQ0EsUUFBSUgsT0FBTyxDQUFDLENBQUQsQ0FBUCxLQUFlQSxPQUFPLENBQUMsQ0FBRCxDQUExQixFQUErQjtBQUMzQjtBQUNBLFlBQU1JLElBQUksR0FBR0osT0FBTyxDQUFDLENBQUQsQ0FBUCxDQUFXSyxNQUFYLENBQWtCLENBQWxCLENBQWIsQ0FGMkIsQ0FFUTs7QUFDbkMsVUFBSUMsMEJBQVdDLEdBQVgsQ0FBZUgsSUFBZixDQUFKLEVBQTBCO0FBQ3RCO0FBQ0EsWUFBSUUsMEJBQVdFLEdBQVgsQ0FBZUosSUFBZixFQUFxQkssd0JBQXpCLEVBQW1ELE9BQU8sRUFBUDtBQUNuRE4sUUFBQUEsT0FBTyxHQUFHLENBQUNHLDBCQUFXRSxHQUFYLENBQWVKLElBQWYsQ0FBRCxDQUFWO0FBQ0g7QUFDSixLQVJELE1BUU87QUFDSCxVQUFJUCxLQUFLLEtBQUssR0FBZCxFQUFtQjtBQUNmO0FBQ0FNLFFBQUFBLE9BQU8sR0FBR1osdUJBQVY7QUFDSCxPQUhELE1BR087QUFDSDtBQUNBWSxRQUFBQSxPQUFPLEdBQUcsS0FBS2QsT0FBTCxDQUFhcUIsS0FBYixDQUFtQlYsT0FBTyxDQUFDLENBQUQsQ0FBMUIsQ0FBVjtBQUNIO0FBQ0o7O0FBR0QsV0FBT0csT0FBTyxDQUFDUSxHQUFSLENBQWFDLE1BQUQsSUFBWTtBQUMzQixVQUFJQyxVQUFVLEdBQUdELE1BQU0sQ0FBQ0UsVUFBUCxLQUFzQixHQUF2QztBQUNBLFlBQU1DLFNBQVMsR0FBR0gsTUFBTSxDQUFDbEIsT0FBUCxDQUFlc0IsSUFBZixDQUFvQkMsS0FBSyxJQUFJLFdBQUlBLEtBQUosTUFBZ0JqQixPQUFPLENBQUMsQ0FBRCxDQUFwRCxDQUFsQixDQUYyQixDQUczQjs7QUFDQSxVQUFJZSxTQUFTLElBQUlILE1BQU0sQ0FBQ0UsVUFBUCxPQUF3QmQsT0FBTyxDQUFDLENBQUQsQ0FBaEQsRUFBcUQ7QUFDakRhLFFBQUFBLFVBQVUsR0FBR2IsT0FBTyxDQUFDLENBQUQsQ0FBcEI7QUFDSDs7QUFFRCxhQUFPO0FBQ0hhLFFBQUFBLFVBREc7QUFFSEssUUFBQUEsSUFBSSxFQUFFLFNBRkg7QUFHSEMsUUFBQUEsU0FBUyxlQUFFLDZCQUFDLDZCQUFEO0FBQ1AsVUFBQSxLQUFLLGFBQU1KLFNBQVMsSUFBSUgsTUFBTSxDQUFDWixPQUExQixDQURFO0FBRVAsVUFBQSxRQUFRLEVBQUVZLE1BQU0sQ0FBQ1EsSUFGVjtBQUdQLFVBQUEsV0FBVyxFQUFFLHlCQUFHUixNQUFNLENBQUNTLFdBQVY7QUFITixVQUhSO0FBT0hwQixRQUFBQTtBQVBHLE9BQVA7QUFTSCxLQWpCTSxDQUFQO0FBa0JIOztBQUVEcUIsRUFBQUEsT0FBTyxHQUFHO0FBQ04sV0FBTyxTQUFTLHlCQUFHLFVBQUgsQ0FBaEI7QUFDSDs7QUFFREMsRUFBQUEsaUJBQWlCLENBQUNDO0FBQUQ7QUFBQTtBQUFBO0FBQWtEO0FBQy9ELHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUMsNENBQWY7QUFBNEQsTUFBQSxJQUFJLEVBQUMsU0FBakU7QUFBMkUsb0JBQVkseUJBQUcsc0JBQUg7QUFBdkYsT0FDTUEsV0FETixDQURKO0FBS0g7O0FBbEU2RCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBBdmlyYWwgRGFzZ3VwdGFcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7X3R9IGZyb20gJy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQXV0b2NvbXBsZXRlUHJvdmlkZXIgZnJvbSAnLi9BdXRvY29tcGxldGVQcm92aWRlcic7XG5pbXBvcnQgUXVlcnlNYXRjaGVyIGZyb20gJy4vUXVlcnlNYXRjaGVyJztcbmltcG9ydCB7VGV4dHVhbENvbXBsZXRpb259IGZyb20gJy4vQ29tcG9uZW50cyc7XG5pbXBvcnQge0lDb21wbGV0aW9uLCBJU2VsZWN0aW9uUmFuZ2V9IGZyb20gXCIuL0F1dG9jb21wbGV0ZXJcIjtcbmltcG9ydCB7Q29tbWFuZCwgQ29tbWFuZHMsIENvbW1hbmRNYXB9IGZyb20gJy4uL1NsYXNoQ29tbWFuZHMnO1xuXG5jb25zdCBDT01NQU5EX1JFID0gLyheXFwvXFx3KikoPzogLiopPy9nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21tYW5kUHJvdmlkZXIgZXh0ZW5kcyBBdXRvY29tcGxldGVQcm92aWRlciB7XG4gICAgbWF0Y2hlcjogUXVlcnlNYXRjaGVyPENvbW1hbmQ+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKENPTU1BTkRfUkUpO1xuICAgICAgICB0aGlzLm1hdGNoZXIgPSBuZXcgUXVlcnlNYXRjaGVyKENvbW1hbmRzLCB7XG4gICAgICAgICAgICBrZXlzOiBbJ2NvbW1hbmQnLCAnYXJncycsICdkZXNjcmlwdGlvbiddLFxuICAgICAgICAgICAgZnVuY3M6IFsoe2FsaWFzZXN9KSA9PiBhbGlhc2VzLmpvaW4oXCIgXCIpXSwgLy8gYWxpYXNlc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRDb21wbGV0aW9ucyhxdWVyeTogc3RyaW5nLCBzZWxlY3Rpb246IElTZWxlY3Rpb25SYW5nZSwgZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTxJQ29tcGxldGlvbltdPiB7XG4gICAgICAgIGNvbnN0IHtjb21tYW5kLCByYW5nZX0gPSB0aGlzLmdldEN1cnJlbnRDb21tYW5kKHF1ZXJ5LCBzZWxlY3Rpb24pO1xuICAgICAgICBpZiAoIWNvbW1hbmQpIHJldHVybiBbXTtcblxuICAgICAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuICAgICAgICAvLyBjaGVjayBpZiB0aGUgZnVsbCBtYXRjaCBkaWZmZXJzIGZyb20gdGhlIGZpcnN0IHdvcmQgKGkuZS4gcmV0dXJucyBmYWxzZSBpZiB0aGUgY29tbWFuZCBoYXMgYXJncylcbiAgICAgICAgaWYgKGNvbW1hbmRbMF0gIT09IGNvbW1hbmRbMV0pIHtcbiAgICAgICAgICAgIC8vIFRoZSBpbnB1dCBsb29rcyBsaWtlIGEgY29tbWFuZCB3aXRoIGFyZ3VtZW50cywgcGVyZm9ybSBleGFjdCBtYXRjaFxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbW1hbmRbMV0uc3Vic3RyKDEpOyAvLyBzdHJpcCBsZWFkaW5nIGAvYFxuICAgICAgICAgICAgaWYgKENvbW1hbmRNYXAuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgLy8gc29tZSBjb21tYW5kcywgbmFtZWx5IGBtZWAgYW5kIGBkZGdgIGRvbid0IHN1aXQgaGF2aW5nIHRoZSB1c2FnZSBzaG93biB3aGlsc3QgdHlwaW5nIHRoZWlyIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmIChDb21tYW5kTWFwLmdldChuYW1lKS5oaWRlQ29tcGxldGlvbkFmdGVyU3BhY2UpIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gW0NvbW1hbmRNYXAuZ2V0KG5hbWUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChxdWVyeSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhleSBoYXZlIGp1c3QgZW50ZXJlZCBgL2Agc2hvdyBldmVyeXRoaW5nXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IENvbW1hbmRzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgZnV6enkgbWF0Y2ggYWdhaW5zdCBhbGwgb2YgdGhlIGZpZWxkc1xuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSB0aGlzLm1hdGNoZXIubWF0Y2goY29tbWFuZFsxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHJldHVybiBtYXRjaGVzLm1hcCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgY29tcGxldGlvbiA9IHJlc3VsdC5nZXRDb21tYW5kKCkgKyAnICc7XG4gICAgICAgICAgICBjb25zdCB1c2VkQWxpYXMgPSByZXN1bHQuYWxpYXNlcy5maW5kKGFsaWFzID0+IGAvJHthbGlhc31gID09PSBjb21tYW5kWzFdKTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBjb21tYW5kIChvciBhbiBhbGlhcykgaXMgdGhlIHNhbWUgYXMgdGhlIG9uZSB0aGV5IGVudGVyZWQsIHdlIGRvbid0IHdhbnQgdG8gZGlzY2FyZCB0aGVpciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICh1c2VkQWxpYXMgfHwgcmVzdWx0LmdldENvbW1hbmQoKSA9PT0gY29tbWFuZFsxXSkge1xuICAgICAgICAgICAgICAgIGNvbXBsZXRpb24gPSBjb21tYW5kWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvbXBsZXRpb24sXG4gICAgICAgICAgICAgICAgdHlwZTogXCJjb21tYW5kXCIsXG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiA8VGV4dHVhbENvbXBsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9e2AvJHt1c2VkQWxpYXMgfHwgcmVzdWx0LmNvbW1hbmR9YH1cbiAgICAgICAgICAgICAgICAgICAgc3VidGl0bGU9e3Jlc3VsdC5hcmdzfVxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17X3QocmVzdWx0LmRlc2NyaXB0aW9uKX0gLz4sXG4gICAgICAgICAgICAgICAgcmFuZ2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gJyrvuI/ig6MgJyArIF90KCdDb21tYW5kcycpO1xuICAgIH1cblxuICAgIHJlbmRlckNvbXBsZXRpb25zKGNvbXBsZXRpb25zOiBSZWFjdC5SZWFjdE5vZGVbXSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2NvbnRhaW5lcl9ibG9ja1wiIHJvbGU9XCJsaXN0Ym94XCIgYXJpYS1sYWJlbD17X3QoXCJDb21tYW5kIEF1dG9jb21wbGV0ZVwiKX0+XG4gICAgICAgICAgICAgICAgeyBjb21wbGV0aW9ucyB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=