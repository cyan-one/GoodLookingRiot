"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../languageHandler");

var _AutocompleteProvider = _interopRequireDefault(require("./AutocompleteProvider"));

var _Components = require("./Components");

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
const DDG_REGEX = /\/ddg\s+(.+)$/g;
const REFERRER = 'vector';

class DuckDuckGoProvider extends _AutocompleteProvider.default {
  constructor() {
    super(DDG_REGEX);
  }

  static getQueryUri(query
  /*: string*/
  ) {
    return "https://api.duckduckgo.com/?q=".concat(encodeURIComponent(query)) + "&format=json&no_redirect=1&no_html=1&t=".concat(encodeURIComponent(REFERRER));
  }

  async getCompletions(query
  /*: string*/
  , selection
  /*: ISelectionRange*/
  , force = false)
  /*: Promise<ICompletion[]>*/
  {
    const {
      command,
      range
    } = this.getCurrentCommand(query, selection);

    if (!query || !command) {
      return [];
    }

    const response = await fetch(DuckDuckGoProvider.getQueryUri(command[1]), {
      method: 'GET'
    });
    const json = await response.json();
    const results = json.Results.map(result => {
      return {
        completion: result.Text,
        component: /*#__PURE__*/_react.default.createElement(_Components.TextualCompletion, {
          title: result.Text,
          description: result.Result
        }),
        range
      };
    });

    if (json.Answer) {
      results.unshift({
        completion: json.Answer,
        component: /*#__PURE__*/_react.default.createElement(_Components.TextualCompletion, {
          title: json.Answer,
          description: json.AnswerType
        }),
        range
      });
    }

    if (json.RelatedTopics && json.RelatedTopics.length > 0) {
      results.unshift({
        completion: json.RelatedTopics[0].Text,
        component: /*#__PURE__*/_react.default.createElement(_Components.TextualCompletion, {
          title: json.RelatedTopics[0].Text
        }),
        range
      });
    }

    if (json.AbstractText) {
      results.unshift({
        completion: json.AbstractText,
        component: /*#__PURE__*/_react.default.createElement(_Components.TextualCompletion, {
          title: json.AbstractText
        }),
        range
      });
    }

    return results;
  }

  getName() {
    return '🔍 ' + (0, _languageHandler._t)('Results from DuckDuckGo');
  }

  renderCompletions(completions
  /*: React.ReactNode[]*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Autocomplete_Completion_container_block",
      role: "listbox",
      "aria-label": (0, _languageHandler._t)("DuckDuckGo Results")
    }, completions);
  }

}

exports.default = DuckDuckGoProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvRHVja0R1Y2tHb1Byb3ZpZGVyLnRzeCJdLCJuYW1lcyI6WyJEREdfUkVHRVgiLCJSRUZFUlJFUiIsIkR1Y2tEdWNrR29Qcm92aWRlciIsIkF1dG9jb21wbGV0ZVByb3ZpZGVyIiwiY29uc3RydWN0b3IiLCJnZXRRdWVyeVVyaSIsInF1ZXJ5IiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZ2V0Q29tcGxldGlvbnMiLCJzZWxlY3Rpb24iLCJmb3JjZSIsImNvbW1hbmQiLCJyYW5nZSIsImdldEN1cnJlbnRDb21tYW5kIiwicmVzcG9uc2UiLCJmZXRjaCIsIm1ldGhvZCIsImpzb24iLCJyZXN1bHRzIiwiUmVzdWx0cyIsIm1hcCIsInJlc3VsdCIsImNvbXBsZXRpb24iLCJUZXh0IiwiY29tcG9uZW50IiwiUmVzdWx0IiwiQW5zd2VyIiwidW5zaGlmdCIsIkFuc3dlclR5cGUiLCJSZWxhdGVkVG9waWNzIiwibGVuZ3RoIiwiQWJzdHJhY3RUZXh0IiwiZ2V0TmFtZSIsInJlbmRlckNvbXBsZXRpb25zIiwiY29tcGxldGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLE1BQU1BLFNBQVMsR0FBRyxnQkFBbEI7QUFDQSxNQUFNQyxRQUFRLEdBQUcsUUFBakI7O0FBRWUsTUFBTUMsa0JBQU4sU0FBaUNDLDZCQUFqQyxDQUFzRDtBQUNqRUMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsVUFBTUosU0FBTjtBQUNIOztBQUVELFNBQU9LLFdBQVAsQ0FBbUJDO0FBQW5CO0FBQUEsSUFBa0M7QUFDOUIsV0FBTyx3Q0FBaUNDLGtCQUFrQixDQUFDRCxLQUFELENBQW5ELHFEQUNzQ0Msa0JBQWtCLENBQUNOLFFBQUQsQ0FEeEQsQ0FBUDtBQUVIOztBQUVELFFBQU1PLGNBQU4sQ0FBcUJGO0FBQXJCO0FBQUEsSUFBb0NHO0FBQXBDO0FBQUEsSUFBZ0VDLEtBQUssR0FBRSxLQUF2RTtBQUFBO0FBQXNHO0FBQ2xHLFVBQU07QUFBQ0MsTUFBQUEsT0FBRDtBQUFVQyxNQUFBQTtBQUFWLFFBQW1CLEtBQUtDLGlCQUFMLENBQXVCUCxLQUF2QixFQUE4QkcsU0FBOUIsQ0FBekI7O0FBQ0EsUUFBSSxDQUFDSCxLQUFELElBQVUsQ0FBQ0ssT0FBZixFQUF3QjtBQUNwQixhQUFPLEVBQVA7QUFDSDs7QUFFRCxVQUFNRyxRQUFRLEdBQUcsTUFBTUMsS0FBSyxDQUFDYixrQkFBa0IsQ0FBQ0csV0FBbkIsQ0FBK0JNLE9BQU8sQ0FBQyxDQUFELENBQXRDLENBQUQsRUFBNkM7QUFDckVLLE1BQUFBLE1BQU0sRUFBRTtBQUQ2RCxLQUE3QyxDQUE1QjtBQUdBLFVBQU1DLElBQUksR0FBRyxNQUFNSCxRQUFRLENBQUNHLElBQVQsRUFBbkI7QUFDQSxVQUFNQyxPQUFPLEdBQUdELElBQUksQ0FBQ0UsT0FBTCxDQUFhQyxHQUFiLENBQWtCQyxNQUFELElBQVk7QUFDekMsYUFBTztBQUNIQyxRQUFBQSxVQUFVLEVBQUVELE1BQU0sQ0FBQ0UsSUFEaEI7QUFFSEMsUUFBQUEsU0FBUyxlQUNMLDZCQUFDLDZCQUFEO0FBQ0ksVUFBQSxLQUFLLEVBQUVILE1BQU0sQ0FBQ0UsSUFEbEI7QUFFSSxVQUFBLFdBQVcsRUFBRUYsTUFBTSxDQUFDSTtBQUZ4QixVQUhEO0FBT0hiLFFBQUFBO0FBUEcsT0FBUDtBQVNILEtBVmUsQ0FBaEI7O0FBV0EsUUFBSUssSUFBSSxDQUFDUyxNQUFULEVBQWlCO0FBQ2JSLE1BQUFBLE9BQU8sQ0FBQ1MsT0FBUixDQUFnQjtBQUNaTCxRQUFBQSxVQUFVLEVBQUVMLElBQUksQ0FBQ1MsTUFETDtBQUVaRixRQUFBQSxTQUFTLGVBQ0wsNkJBQUMsNkJBQUQ7QUFDSSxVQUFBLEtBQUssRUFBRVAsSUFBSSxDQUFDUyxNQURoQjtBQUVJLFVBQUEsV0FBVyxFQUFFVCxJQUFJLENBQUNXO0FBRnRCLFVBSFE7QUFPWmhCLFFBQUFBO0FBUFksT0FBaEI7QUFTSDs7QUFDRCxRQUFJSyxJQUFJLENBQUNZLGFBQUwsSUFBc0JaLElBQUksQ0FBQ1ksYUFBTCxDQUFtQkMsTUFBbkIsR0FBNEIsQ0FBdEQsRUFBeUQ7QUFDckRaLE1BQUFBLE9BQU8sQ0FBQ1MsT0FBUixDQUFnQjtBQUNaTCxRQUFBQSxVQUFVLEVBQUVMLElBQUksQ0FBQ1ksYUFBTCxDQUFtQixDQUFuQixFQUFzQk4sSUFEdEI7QUFFWkMsUUFBQUEsU0FBUyxlQUNMLDZCQUFDLDZCQUFEO0FBQ0ksVUFBQSxLQUFLLEVBQUVQLElBQUksQ0FBQ1ksYUFBTCxDQUFtQixDQUFuQixFQUFzQk47QUFEakMsVUFIUTtBQU1aWCxRQUFBQTtBQU5ZLE9BQWhCO0FBUUg7O0FBQ0QsUUFBSUssSUFBSSxDQUFDYyxZQUFULEVBQXVCO0FBQ25CYixNQUFBQSxPQUFPLENBQUNTLE9BQVIsQ0FBZ0I7QUFDWkwsUUFBQUEsVUFBVSxFQUFFTCxJQUFJLENBQUNjLFlBREw7QUFFWlAsUUFBQUEsU0FBUyxlQUNMLDZCQUFDLDZCQUFEO0FBQ0ksVUFBQSxLQUFLLEVBQUVQLElBQUksQ0FBQ2M7QUFEaEIsVUFIUTtBQU1abkIsUUFBQUE7QUFOWSxPQUFoQjtBQVFIOztBQUNELFdBQU9NLE9BQVA7QUFDSDs7QUFFRGMsRUFBQUEsT0FBTyxHQUFHO0FBQ04sV0FBTyxRQUFRLHlCQUFHLHlCQUFILENBQWY7QUFDSDs7QUFFREMsRUFBQUEsaUJBQWlCLENBQUNDO0FBQUQ7QUFBQTtBQUFBO0FBQWtEO0FBQy9ELHdCQUNJO0FBQ0ksTUFBQSxTQUFTLEVBQUMsNENBRGQ7QUFFSSxNQUFBLElBQUksRUFBQyxTQUZUO0FBR0ksb0JBQVkseUJBQUcsb0JBQUg7QUFIaEIsT0FLTUEsV0FMTixDQURKO0FBU0g7O0FBL0VnRSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBBdmlyYWwgRGFzZ3VwdGFcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQXV0b2NvbXBsZXRlUHJvdmlkZXIgZnJvbSAnLi9BdXRvY29tcGxldGVQcm92aWRlcic7XG5cbmltcG9ydCB7VGV4dHVhbENvbXBsZXRpb259IGZyb20gJy4vQ29tcG9uZW50cyc7XG5pbXBvcnQge0lDb21wbGV0aW9uLCBJU2VsZWN0aW9uUmFuZ2V9IGZyb20gXCIuL0F1dG9jb21wbGV0ZXJcIjtcblxuY29uc3QgRERHX1JFR0VYID0gL1xcL2RkZ1xccysoLispJC9nO1xuY29uc3QgUkVGRVJSRVIgPSAndmVjdG9yJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHVja0R1Y2tHb1Byb3ZpZGVyIGV4dGVuZHMgQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihEREdfUkVHRVgpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRRdWVyeVVyaShxdWVyeTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly9hcGkuZHVja2R1Y2tnby5jb20vP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfWBcbiAgICAgICAgICsgYCZmb3JtYXQ9anNvbiZub19yZWRpcmVjdD0xJm5vX2h0bWw9MSZ0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KFJFRkVSUkVSKX1gO1xuICAgIH1cblxuICAgIGFzeW5jIGdldENvbXBsZXRpb25zKHF1ZXJ5OiBzdHJpbmcsIHNlbGVjdGlvbjogSVNlbGVjdGlvblJhbmdlLCBmb3JjZT0gZmFsc2UpOiBQcm9taXNlPElDb21wbGV0aW9uW10+IHtcbiAgICAgICAgY29uc3Qge2NvbW1hbmQsIHJhbmdlfSA9IHRoaXMuZ2V0Q3VycmVudENvbW1hbmQocXVlcnksIHNlbGVjdGlvbik7XG4gICAgICAgIGlmICghcXVlcnkgfHwgIWNvbW1hbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goRHVja0R1Y2tHb1Byb3ZpZGVyLmdldFF1ZXJ5VXJpKGNvbW1hbmRbMV0pLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGpzb24uUmVzdWx0cy5tYXAoKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0aW9uOiByZXN1bHQuVGV4dCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IChcbiAgICAgICAgICAgICAgICAgICAgPFRleHR1YWxDb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cmVzdWx0LlRleHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17cmVzdWx0LlJlc3VsdH0gLz5cbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChqc29uLkFuc3dlcikge1xuICAgICAgICAgICAgcmVzdWx0cy51bnNoaWZ0KHtcbiAgICAgICAgICAgICAgICBjb21wbGV0aW9uOiBqc29uLkFuc3dlcixcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IChcbiAgICAgICAgICAgICAgICAgICAgPFRleHR1YWxDb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17anNvbi5BbnN3ZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17anNvbi5BbnN3ZXJUeXBlfSAvPlxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgcmFuZ2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoanNvbi5SZWxhdGVkVG9waWNzICYmIGpzb24uUmVsYXRlZFRvcGljcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXN1bHRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgIGNvbXBsZXRpb246IGpzb24uUmVsYXRlZFRvcGljc1swXS5UZXh0LFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dHVhbENvbXBsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtqc29uLlJlbGF0ZWRUb3BpY3NbMF0uVGV4dH0gLz5cbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpzb24uQWJzdHJhY3RUZXh0KSB7XG4gICAgICAgICAgICByZXN1bHRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgIGNvbXBsZXRpb246IGpzb24uQWJzdHJhY3RUZXh0LFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dHVhbENvbXBsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtqc29uLkFic3RyYWN0VGV4dH0gLz5cbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHJhbmdlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuICfwn5SNICcgKyBfdCgnUmVzdWx0cyBmcm9tIER1Y2tEdWNrR28nKTtcbiAgICB9XG5cbiAgICByZW5kZXJDb21wbGV0aW9ucyhjb21wbGV0aW9uczogUmVhY3QuUmVhY3ROb2RlW10pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2NvbnRhaW5lcl9ibG9ja1wiXG4gICAgICAgICAgICAgICAgcm9sZT1cImxpc3Rib3hcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e190KFwiRHVja0R1Y2tHbyBSZXN1bHRzXCIpfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHsgY29tcGxldGlvbnMgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19