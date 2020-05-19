"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

/*
Copyright 2016 Aviral Dasgupta
Copyright 2017 Vector Creations Ltd
Copyright 2017, 2018 New Vector Ltd

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

/*:: export interface ICommand {
    command: string | null;
    range: {
        start: number;
        end: number;
    };
}*/
class AutocompleteProvider {
  constructor(commandRegex
  /*: RegExp*/
  , forcedCommandRegex
  /*: RegExp*/
  ) {
    (0, _defineProperty2.default)(this, "commandRegex", void 0);
    (0, _defineProperty2.default)(this, "forcedCommandRegex", void 0);

    if (commandRegex) {
      if (!commandRegex.global) {
        throw new Error('commandRegex must have global flag set');
      }

      this.commandRegex = commandRegex;
    }

    if (forcedCommandRegex) {
      if (!forcedCommandRegex.global) {
        throw new Error('forcedCommandRegex must have global flag set');
      }

      this.forcedCommandRegex = forcedCommandRegex;
    }
  }

  destroy() {} // stub

  /**
   * Of the matched commands in the query, returns the first that contains or is contained by the selection, or null.
   * @param {string} query The query string
   * @param {ISelectionRange} selection Selection to search
   * @param {boolean} force True if the user is forcing completion
   * @return {object} { command, range } where both objects fields are null if no match
   */


  getCurrentCommand(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false) {
    let commandRegex = this.commandRegex;

    if (force && this.shouldForceComplete()) {
      commandRegex = this.forcedCommandRegex || /\S+/g;
    }

    if (!commandRegex) {
      return null;
    }

    commandRegex.lastIndex = 0;
    let match;

    while ((match = commandRegex.exec(query)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (selection.start <= end && selection.end >= start) {
        return {
          command: match,
          range: {
            start,
            end
          }
        };
      }
    }

    return {
      command: null,
      range: {
        start: -1,
        end: -1
      }
    };
  }

  async getCompletions(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false)
  /*: Promise<ICompletion[]>*/
  {
    return [];
  }

  getName()
  /*: string*/
  {
    return 'Default Provider';
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode | null*/
  {
    console.error('stub; should be implemented in subclasses');
    return null;
  } // Whether we should provide completions even if triggered forcefully, without a sigil.


  shouldForceComplete()
  /*: boolean*/
  {
    return false;
  }

}

exports.default = AutocompleteProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvQXV0b2NvbXBsZXRlUHJvdmlkZXIudHN4Il0sIm5hbWVzIjpbIkF1dG9jb21wbGV0ZVByb3ZpZGVyIiwiY29uc3RydWN0b3IiLCJjb21tYW5kUmVnZXgiLCJmb3JjZWRDb21tYW5kUmVnZXgiLCJnbG9iYWwiLCJFcnJvciIsImRlc3Ryb3kiLCJnZXRDdXJyZW50Q29tbWFuZCIsInF1ZXJ5Iiwic2VsZWN0aW9uIiwiZm9yY2UiLCJzaG91bGRGb3JjZUNvbXBsZXRlIiwibGFzdEluZGV4IiwibWF0Y2giLCJleGVjIiwic3RhcnQiLCJpbmRleCIsImVuZCIsImxlbmd0aCIsImNvbW1hbmQiLCJyYW5nZSIsImdldENvbXBsZXRpb25zIiwiZ2V0TmFtZSIsInJlbmRlckNvbXBsZXRpb25zIiwiY29tcGxldGlvbnMiLCJjb25zb2xlIiwiZXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QmUsTUFBTUEsb0JBQU4sQ0FBMkI7QUFJdENDLEVBQUFBLFdBQVcsQ0FBQ0M7QUFBRDtBQUFBLElBQXdCQztBQUF4QjtBQUFBLElBQXFEO0FBQUE7QUFBQTs7QUFDNUQsUUFBSUQsWUFBSixFQUFrQjtBQUNkLFVBQUksQ0FBQ0EsWUFBWSxDQUFDRSxNQUFsQixFQUEwQjtBQUN0QixjQUFNLElBQUlDLEtBQUosQ0FBVSx3Q0FBVixDQUFOO0FBQ0g7O0FBQ0QsV0FBS0gsWUFBTCxHQUFvQkEsWUFBcEI7QUFDSDs7QUFDRCxRQUFJQyxrQkFBSixFQUF3QjtBQUNwQixVQUFJLENBQUNBLGtCQUFrQixDQUFDQyxNQUF4QixFQUFnQztBQUM1QixjQUFNLElBQUlDLEtBQUosQ0FBVSw4Q0FBVixDQUFOO0FBQ0g7O0FBQ0QsV0FBS0Ysa0JBQUwsR0FBMEJBLGtCQUExQjtBQUNIO0FBQ0o7O0FBRURHLEVBQUFBLE9BQU8sR0FBRyxDQUVULENBRk0sQ0FDSDs7QUFHSjs7Ozs7Ozs7O0FBT0FDLEVBQUFBLGlCQUFpQixDQUFDQztBQUFEO0FBQUEsSUFBZ0JDO0FBQWhCO0FBQUEsSUFBNENDLEtBQUssR0FBRyxLQUFwRCxFQUEyRDtBQUN4RSxRQUFJUixZQUFZLEdBQUcsS0FBS0EsWUFBeEI7O0FBRUEsUUFBSVEsS0FBSyxJQUFJLEtBQUtDLG1CQUFMLEVBQWIsRUFBeUM7QUFDckNULE1BQUFBLFlBQVksR0FBRyxLQUFLQyxrQkFBTCxJQUEyQixNQUExQztBQUNIOztBQUVELFFBQUksQ0FBQ0QsWUFBTCxFQUFtQjtBQUNmLGFBQU8sSUFBUDtBQUNIOztBQUVEQSxJQUFBQSxZQUFZLENBQUNVLFNBQWIsR0FBeUIsQ0FBekI7QUFFQSxRQUFJQyxLQUFKOztBQUNBLFdBQU8sQ0FBQ0EsS0FBSyxHQUFHWCxZQUFZLENBQUNZLElBQWIsQ0FBa0JOLEtBQWxCLENBQVQsTUFBdUMsSUFBOUMsRUFBb0Q7QUFDaEQsWUFBTU8sS0FBSyxHQUFHRixLQUFLLENBQUNHLEtBQXBCO0FBQ0EsWUFBTUMsR0FBRyxHQUFHRixLQUFLLEdBQUdGLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU0ssTUFBN0I7O0FBQ0EsVUFBSVQsU0FBUyxDQUFDTSxLQUFWLElBQW1CRSxHQUFuQixJQUEwQlIsU0FBUyxDQUFDUSxHQUFWLElBQWlCRixLQUEvQyxFQUFzRDtBQUNsRCxlQUFPO0FBQ0hJLFVBQUFBLE9BQU8sRUFBRU4sS0FETjtBQUVITyxVQUFBQSxLQUFLLEVBQUU7QUFDSEwsWUFBQUEsS0FERztBQUVIRSxZQUFBQTtBQUZHO0FBRkosU0FBUDtBQU9IO0FBQ0o7O0FBQ0QsV0FBTztBQUNIRSxNQUFBQSxPQUFPLEVBQUUsSUFETjtBQUVIQyxNQUFBQSxLQUFLLEVBQUU7QUFDSEwsUUFBQUEsS0FBSyxFQUFFLENBQUMsQ0FETDtBQUVIRSxRQUFBQSxHQUFHLEVBQUUsQ0FBQztBQUZIO0FBRkosS0FBUDtBQU9IOztBQUVELFFBQU1JLGNBQU4sQ0FBcUJiO0FBQXJCO0FBQUEsSUFBb0NDO0FBQXBDO0FBQUEsSUFBZ0VDLEtBQUssR0FBRyxLQUF4RTtBQUFBO0FBQXVHO0FBQ25HLFdBQU8sRUFBUDtBQUNIOztBQUVEWSxFQUFBQSxPQUFPO0FBQUE7QUFBVztBQUNkLFdBQU8sa0JBQVA7QUFDSDs7QUFFREMsRUFBQUEsaUJBQWlCLENBQUNDO0FBQUQ7QUFBQTtBQUFBO0FBQXlEO0FBQ3RFQyxJQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYywyQ0FBZDtBQUNBLFdBQU8sSUFBUDtBQUNILEdBN0VxQyxDQStFdEM7OztBQUNBZixFQUFBQSxtQkFBbUI7QUFBQTtBQUFZO0FBQzNCLFdBQU8sS0FBUDtBQUNIOztBQWxGcUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgQXZpcmFsIERhc2d1cHRhXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUge0lDb21wbGV0aW9uLCBJU2VsZWN0aW9uUmFuZ2V9IGZyb20gJy4vQXV0b2NvbXBsZXRlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbW1hbmQge1xuICAgIGNvbW1hbmQ6IHN0cmluZyB8IG51bGw7XG4gICAgcmFuZ2U6IHtcbiAgICAgICAgc3RhcnQ6IG51bWJlcjtcbiAgICAgICAgZW5kOiBudW1iZXI7XG4gICAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIGNvbW1hbmRSZWdleDogUmVnRXhwO1xuICAgIGZvcmNlZENvbW1hbmRSZWdleDogUmVnRXhwO1xuXG4gICAgY29uc3RydWN0b3IoY29tbWFuZFJlZ2V4PzogUmVnRXhwLCBmb3JjZWRDb21tYW5kUmVnZXg/OiBSZWdFeHApIHtcbiAgICAgICAgaWYgKGNvbW1hbmRSZWdleCkge1xuICAgICAgICAgICAgaWYgKCFjb21tYW5kUmVnZXguZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb21tYW5kUmVnZXggbXVzdCBoYXZlIGdsb2JhbCBmbGFnIHNldCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb21tYW5kUmVnZXggPSBjb21tYW5kUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcmNlZENvbW1hbmRSZWdleCkge1xuICAgICAgICAgICAgaWYgKCFmb3JjZWRDb21tYW5kUmVnZXguZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmb3JjZWRDb21tYW5kUmVnZXggbXVzdCBoYXZlIGdsb2JhbCBmbGFnIHNldCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mb3JjZWRDb21tYW5kUmVnZXggPSBmb3JjZWRDb21tYW5kUmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICAvLyBzdHViXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2YgdGhlIG1hdGNoZWQgY29tbWFuZHMgaW4gdGhlIHF1ZXJ5LCByZXR1cm5zIHRoZSBmaXJzdCB0aGF0IGNvbnRhaW5zIG9yIGlzIGNvbnRhaW5lZCBieSB0aGUgc2VsZWN0aW9uLCBvciBudWxsLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBUaGUgcXVlcnkgc3RyaW5nXG4gICAgICogQHBhcmFtIHtJU2VsZWN0aW9uUmFuZ2V9IHNlbGVjdGlvbiBTZWxlY3Rpb24gdG8gc2VhcmNoXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBUcnVlIGlmIHRoZSB1c2VyIGlzIGZvcmNpbmcgY29tcGxldGlvblxuICAgICAqIEByZXR1cm4ge29iamVjdH0geyBjb21tYW5kLCByYW5nZSB9IHdoZXJlIGJvdGggb2JqZWN0cyBmaWVsZHMgYXJlIG51bGwgaWYgbm8gbWF0Y2hcbiAgICAgKi9cbiAgICBnZXRDdXJyZW50Q29tbWFuZChxdWVyeTogc3RyaW5nLCBzZWxlY3Rpb246IElTZWxlY3Rpb25SYW5nZSwgZm9yY2UgPSBmYWxzZSkge1xuICAgICAgICBsZXQgY29tbWFuZFJlZ2V4ID0gdGhpcy5jb21tYW5kUmVnZXg7XG5cbiAgICAgICAgaWYgKGZvcmNlICYmIHRoaXMuc2hvdWxkRm9yY2VDb21wbGV0ZSgpKSB7XG4gICAgICAgICAgICBjb21tYW5kUmVnZXggPSB0aGlzLmZvcmNlZENvbW1hbmRSZWdleCB8fCAvXFxTKy9nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21tYW5kUmVnZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29tbWFuZFJlZ2V4Lmxhc3RJbmRleCA9IDA7XG5cbiAgICAgICAgbGV0IG1hdGNoO1xuICAgICAgICB3aGlsZSAoKG1hdGNoID0gY29tbWFuZFJlZ2V4LmV4ZWMocXVlcnkpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5pbmRleDtcbiAgICAgICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbi5zdGFydCA8PSBlbmQgJiYgc2VsZWN0aW9uLmVuZCA+PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQ6IG1hdGNoLFxuICAgICAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tbWFuZDogbnVsbCxcbiAgICAgICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IC0xLFxuICAgICAgICAgICAgICAgIGVuZDogLTEsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGdldENvbXBsZXRpb25zKHF1ZXJ5OiBzdHJpbmcsIHNlbGVjdGlvbjogSVNlbGVjdGlvblJhbmdlLCBmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxJQ29tcGxldGlvbltdPiB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnRGVmYXVsdCBQcm92aWRlcic7XG4gICAgfVxuXG4gICAgcmVuZGVyQ29tcGxldGlvbnMoY29tcGxldGlvbnM6IFJlYWN0LlJlYWN0Tm9kZVtdKTogUmVhY3QuUmVhY3ROb2RlIHwgbnVsbCB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ3N0dWI7IHNob3VsZCBiZSBpbXBsZW1lbnRlZCBpbiBzdWJjbGFzc2VzJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIHByb3ZpZGUgY29tcGxldGlvbnMgZXZlbiBpZiB0cmlnZ2VyZWQgZm9yY2VmdWxseSwgd2l0aG91dCBhIHNpZ2lsLlxuICAgIHNob3VsZEZvcmNlQ29tcGxldGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iXX0=