/*
Copyright 2016 OpenMarket Ltd
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
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContentRules = void 0;

var _PushRuleVectorState = require("./PushRuleVectorState");

class ContentRules {
  /**
   * Extract the keyword rules from a list of rules, and parse them
   * into a form which is useful for Vector's UI.
   *
   * Returns an object containing:
   *   rules: the primary list of keyword rules
   *   vectorState: a PushRuleVectorState indicating whether those rules are
   *      OFF/ON/LOUD
   *   externalRules: a list of other keyword rules, with states other than
   *      vectorState
   */
  static parseContentRules(rulesets) {
    // first categorise the keyword rules in terms of their actions
    const contentRules = this._categoriseContentRules(rulesets); // Decide which content rules to display in Vector UI.
    // Vector displays a single global rule for a list of keywords
    // whereas Matrix has a push rule per keyword.
    // Vector can set the unique rule in ON, LOUD or OFF state.
    // Matrix has enabled/disabled plus a combination of (highlight, sound) tweaks.
    // The code below determines which set of user's content push rules can be
    // displayed by the vector UI.
    // Push rules that does not fit, ie defined by another Matrix client, ends
    // in externalRules.
    // There is priority in the determination of which set will be the displayed one.
    // The set with rules that have LOUD tweaks is the first choice. Then, the ones
    // with ON tweaks (no tweaks).


    if (contentRules.loud.length) {
      return {
        vectorState: _PushRuleVectorState.PushRuleVectorState.LOUD,
        rules: contentRules.loud,
        externalRules: [].concat(contentRules.loud_but_disabled, contentRules.on, contentRules.on_but_disabled, contentRules.other)
      };
    } else if (contentRules.loud_but_disabled.length) {
      return {
        vectorState: _PushRuleVectorState.PushRuleVectorState.OFF,
        rules: contentRules.loud_but_disabled,
        externalRules: [].concat(contentRules.on, contentRules.on_but_disabled, contentRules.other)
      };
    } else if (contentRules.on.length) {
      return {
        vectorState: _PushRuleVectorState.PushRuleVectorState.ON,
        rules: contentRules.on,
        externalRules: [].concat(contentRules.on_but_disabled, contentRules.other)
      };
    } else if (contentRules.on_but_disabled.length) {
      return {
        vectorState: _PushRuleVectorState.PushRuleVectorState.OFF,
        rules: contentRules.on_but_disabled,
        externalRules: contentRules.other
      };
    } else {
      return {
        vectorState: _PushRuleVectorState.PushRuleVectorState.ON,
        rules: [],
        externalRules: contentRules.other
      };
    }
  }

  static _categoriseContentRules(rulesets) {
    const contentRules = {
      on: [],
      on_but_disabled: [],
      loud: [],
      loud_but_disabled: [],
      other: []
    };

    for (const kind in rulesets.global) {
      for (let i = 0; i < Object.keys(rulesets.global[kind]).length; ++i) {
        const r = rulesets.global[kind][i]; // check it's not a default rule

        if (r.rule_id[0] === '.' || kind !== 'content') {
          continue;
        }

        r.kind = kind; // is this needed? not sure

        switch (_PushRuleVectorState.PushRuleVectorState.contentRuleVectorStateKind(r)) {
          case _PushRuleVectorState.PushRuleVectorState.ON:
            if (r.enabled) {
              contentRules.on.push(r);
            } else {
              contentRules.on_but_disabled.push(r);
            }

            break;

          case _PushRuleVectorState.PushRuleVectorState.LOUD:
            if (r.enabled) {
              contentRules.loud.push(r);
            } else {
              contentRules.loud_but_disabled.push(r);
            }

            break;

          default:
            contentRules.other.push(r);
            break;
        }
      }
    }

    return contentRules;
  }

}

exports.ContentRules = ContentRules;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub3RpZmljYXRpb25zL0NvbnRlbnRSdWxlcy5qcyJdLCJuYW1lcyI6WyJDb250ZW50UnVsZXMiLCJwYXJzZUNvbnRlbnRSdWxlcyIsInJ1bGVzZXRzIiwiY29udGVudFJ1bGVzIiwiX2NhdGVnb3Jpc2VDb250ZW50UnVsZXMiLCJsb3VkIiwibGVuZ3RoIiwidmVjdG9yU3RhdGUiLCJQdXNoUnVsZVZlY3RvclN0YXRlIiwiTE9VRCIsInJ1bGVzIiwiZXh0ZXJuYWxSdWxlcyIsImNvbmNhdCIsImxvdWRfYnV0X2Rpc2FibGVkIiwib24iLCJvbl9idXRfZGlzYWJsZWQiLCJvdGhlciIsIk9GRiIsIk9OIiwia2luZCIsImdsb2JhbCIsImkiLCJPYmplY3QiLCJrZXlzIiwiciIsInJ1bGVfaWQiLCJjb250ZW50UnVsZVZlY3RvclN0YXRlS2luZCIsImVuYWJsZWQiLCJwdXNoIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7Ozs7OztBQUVBOztBQUVPLE1BQU1BLFlBQU4sQ0FBbUI7QUFDdEI7Ozs7Ozs7Ozs7O0FBV0EsU0FBT0MsaUJBQVAsQ0FBeUJDLFFBQXpCLEVBQW1DO0FBQy9CO0FBQ0EsVUFBTUMsWUFBWSxHQUFHLEtBQUtDLHVCQUFMLENBQTZCRixRQUE3QixDQUFyQixDQUYrQixDQUkvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUVBLFFBQUlDLFlBQVksQ0FBQ0UsSUFBYixDQUFrQkMsTUFBdEIsRUFBOEI7QUFDMUIsYUFBTztBQUNIQyxRQUFBQSxXQUFXLEVBQUVDLHlDQUFvQkMsSUFEOUI7QUFFSEMsUUFBQUEsS0FBSyxFQUFFUCxZQUFZLENBQUNFLElBRmpCO0FBR0hNLFFBQUFBLGFBQWEsRUFBRSxHQUFHQyxNQUFILENBQVVULFlBQVksQ0FBQ1UsaUJBQXZCLEVBQTBDVixZQUFZLENBQUNXLEVBQXZELEVBQTJEWCxZQUFZLENBQUNZLGVBQXhFLEVBQXlGWixZQUFZLENBQUNhLEtBQXRHO0FBSFosT0FBUDtBQUtILEtBTkQsTUFNTyxJQUFJYixZQUFZLENBQUNVLGlCQUFiLENBQStCUCxNQUFuQyxFQUEyQztBQUM5QyxhQUFPO0FBQ0hDLFFBQUFBLFdBQVcsRUFBRUMseUNBQW9CUyxHQUQ5QjtBQUVIUCxRQUFBQSxLQUFLLEVBQUVQLFlBQVksQ0FBQ1UsaUJBRmpCO0FBR0hGLFFBQUFBLGFBQWEsRUFBRSxHQUFHQyxNQUFILENBQVVULFlBQVksQ0FBQ1csRUFBdkIsRUFBMkJYLFlBQVksQ0FBQ1ksZUFBeEMsRUFBeURaLFlBQVksQ0FBQ2EsS0FBdEU7QUFIWixPQUFQO0FBS0gsS0FOTSxNQU1BLElBQUliLFlBQVksQ0FBQ1csRUFBYixDQUFnQlIsTUFBcEIsRUFBNEI7QUFDL0IsYUFBTztBQUNIQyxRQUFBQSxXQUFXLEVBQUVDLHlDQUFvQlUsRUFEOUI7QUFFSFIsUUFBQUEsS0FBSyxFQUFFUCxZQUFZLENBQUNXLEVBRmpCO0FBR0hILFFBQUFBLGFBQWEsRUFBRSxHQUFHQyxNQUFILENBQVVULFlBQVksQ0FBQ1ksZUFBdkIsRUFBd0NaLFlBQVksQ0FBQ2EsS0FBckQ7QUFIWixPQUFQO0FBS0gsS0FOTSxNQU1BLElBQUliLFlBQVksQ0FBQ1ksZUFBYixDQUE2QlQsTUFBakMsRUFBeUM7QUFDNUMsYUFBTztBQUNIQyxRQUFBQSxXQUFXLEVBQUVDLHlDQUFvQlMsR0FEOUI7QUFFSFAsUUFBQUEsS0FBSyxFQUFFUCxZQUFZLENBQUNZLGVBRmpCO0FBR0hKLFFBQUFBLGFBQWEsRUFBRVIsWUFBWSxDQUFDYTtBQUh6QixPQUFQO0FBS0gsS0FOTSxNQU1BO0FBQ0gsYUFBTztBQUNIVCxRQUFBQSxXQUFXLEVBQUVDLHlDQUFvQlUsRUFEOUI7QUFFSFIsUUFBQUEsS0FBSyxFQUFFLEVBRko7QUFHSEMsUUFBQUEsYUFBYSxFQUFFUixZQUFZLENBQUNhO0FBSHpCLE9BQVA7QUFLSDtBQUNKOztBQUVELFNBQU9aLHVCQUFQLENBQStCRixRQUEvQixFQUF5QztBQUNyQyxVQUFNQyxZQUFZLEdBQUc7QUFBQ1csTUFBQUEsRUFBRSxFQUFFLEVBQUw7QUFBU0MsTUFBQUEsZUFBZSxFQUFFLEVBQTFCO0FBQThCVixNQUFBQSxJQUFJLEVBQUUsRUFBcEM7QUFBd0NRLE1BQUFBLGlCQUFpQixFQUFFLEVBQTNEO0FBQStERyxNQUFBQSxLQUFLLEVBQUU7QUFBdEUsS0FBckI7O0FBQ0EsU0FBSyxNQUFNRyxJQUFYLElBQW1CakIsUUFBUSxDQUFDa0IsTUFBNUIsRUFBb0M7QUFDaEMsV0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHQyxNQUFNLENBQUNDLElBQVAsQ0FBWXJCLFFBQVEsQ0FBQ2tCLE1BQVQsQ0FBZ0JELElBQWhCLENBQVosRUFBbUNiLE1BQXZELEVBQStELEVBQUVlLENBQWpFLEVBQW9FO0FBQ2hFLGNBQU1HLENBQUMsR0FBR3RCLFFBQVEsQ0FBQ2tCLE1BQVQsQ0FBZ0JELElBQWhCLEVBQXNCRSxDQUF0QixDQUFWLENBRGdFLENBR2hFOztBQUNBLFlBQUlHLENBQUMsQ0FBQ0MsT0FBRixDQUFVLENBQVYsTUFBaUIsR0FBakIsSUFBd0JOLElBQUksS0FBSyxTQUFyQyxFQUFnRDtBQUM1QztBQUNIOztBQUVESyxRQUFBQSxDQUFDLENBQUNMLElBQUYsR0FBU0EsSUFBVCxDQVJnRSxDQVFqRDs7QUFFZixnQkFBUVgseUNBQW9Ca0IsMEJBQXBCLENBQStDRixDQUEvQyxDQUFSO0FBQ0ksZUFBS2hCLHlDQUFvQlUsRUFBekI7QUFDSSxnQkFBSU0sQ0FBQyxDQUFDRyxPQUFOLEVBQWU7QUFDWHhCLGNBQUFBLFlBQVksQ0FBQ1csRUFBYixDQUFnQmMsSUFBaEIsQ0FBcUJKLENBQXJCO0FBQ0gsYUFGRCxNQUVPO0FBQ0hyQixjQUFBQSxZQUFZLENBQUNZLGVBQWIsQ0FBNkJhLElBQTdCLENBQWtDSixDQUFsQztBQUNIOztBQUNEOztBQUNKLGVBQUtoQix5Q0FBb0JDLElBQXpCO0FBQ0ksZ0JBQUllLENBQUMsQ0FBQ0csT0FBTixFQUFlO0FBQ1h4QixjQUFBQSxZQUFZLENBQUNFLElBQWIsQ0FBa0J1QixJQUFsQixDQUF1QkosQ0FBdkI7QUFDSCxhQUZELE1BRU87QUFDSHJCLGNBQUFBLFlBQVksQ0FBQ1UsaUJBQWIsQ0FBK0JlLElBQS9CLENBQW9DSixDQUFwQztBQUNIOztBQUNEOztBQUNKO0FBQ0lyQixZQUFBQSxZQUFZLENBQUNhLEtBQWIsQ0FBbUJZLElBQW5CLENBQXdCSixDQUF4QjtBQUNBO0FBakJSO0FBbUJIO0FBQ0o7O0FBQ0QsV0FBT3JCLFlBQVA7QUFDSDs7QUFsR3FCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQdXNoUnVsZVZlY3RvclN0YXRlfSBmcm9tIFwiLi9QdXNoUnVsZVZlY3RvclN0YXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb250ZW50UnVsZXMge1xuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgdGhlIGtleXdvcmQgcnVsZXMgZnJvbSBhIGxpc3Qgb2YgcnVsZXMsIGFuZCBwYXJzZSB0aGVtXG4gICAgICogaW50byBhIGZvcm0gd2hpY2ggaXMgdXNlZnVsIGZvciBWZWN0b3IncyBVSS5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmc6XG4gICAgICogICBydWxlczogdGhlIHByaW1hcnkgbGlzdCBvZiBrZXl3b3JkIHJ1bGVzXG4gICAgICogICB2ZWN0b3JTdGF0ZTogYSBQdXNoUnVsZVZlY3RvclN0YXRlIGluZGljYXRpbmcgd2hldGhlciB0aG9zZSBydWxlcyBhcmVcbiAgICAgKiAgICAgIE9GRi9PTi9MT1VEXG4gICAgICogICBleHRlcm5hbFJ1bGVzOiBhIGxpc3Qgb2Ygb3RoZXIga2V5d29yZCBydWxlcywgd2l0aCBzdGF0ZXMgb3RoZXIgdGhhblxuICAgICAqICAgICAgdmVjdG9yU3RhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VDb250ZW50UnVsZXMocnVsZXNldHMpIHtcbiAgICAgICAgLy8gZmlyc3QgY2F0ZWdvcmlzZSB0aGUga2V5d29yZCBydWxlcyBpbiB0ZXJtcyBvZiB0aGVpciBhY3Rpb25zXG4gICAgICAgIGNvbnN0IGNvbnRlbnRSdWxlcyA9IHRoaXMuX2NhdGVnb3Jpc2VDb250ZW50UnVsZXMocnVsZXNldHMpO1xuXG4gICAgICAgIC8vIERlY2lkZSB3aGljaCBjb250ZW50IHJ1bGVzIHRvIGRpc3BsYXkgaW4gVmVjdG9yIFVJLlxuICAgICAgICAvLyBWZWN0b3IgZGlzcGxheXMgYSBzaW5nbGUgZ2xvYmFsIHJ1bGUgZm9yIGEgbGlzdCBvZiBrZXl3b3Jkc1xuICAgICAgICAvLyB3aGVyZWFzIE1hdHJpeCBoYXMgYSBwdXNoIHJ1bGUgcGVyIGtleXdvcmQuXG4gICAgICAgIC8vIFZlY3RvciBjYW4gc2V0IHRoZSB1bmlxdWUgcnVsZSBpbiBPTiwgTE9VRCBvciBPRkYgc3RhdGUuXG4gICAgICAgIC8vIE1hdHJpeCBoYXMgZW5hYmxlZC9kaXNhYmxlZCBwbHVzIGEgY29tYmluYXRpb24gb2YgKGhpZ2hsaWdodCwgc291bmQpIHR3ZWFrcy5cblxuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBkZXRlcm1pbmVzIHdoaWNoIHNldCBvZiB1c2VyJ3MgY29udGVudCBwdXNoIHJ1bGVzIGNhbiBiZVxuICAgICAgICAvLyBkaXNwbGF5ZWQgYnkgdGhlIHZlY3RvciBVSS5cbiAgICAgICAgLy8gUHVzaCBydWxlcyB0aGF0IGRvZXMgbm90IGZpdCwgaWUgZGVmaW5lZCBieSBhbm90aGVyIE1hdHJpeCBjbGllbnQsIGVuZHNcbiAgICAgICAgLy8gaW4gZXh0ZXJuYWxSdWxlcy5cbiAgICAgICAgLy8gVGhlcmUgaXMgcHJpb3JpdHkgaW4gdGhlIGRldGVybWluYXRpb24gb2Ygd2hpY2ggc2V0IHdpbGwgYmUgdGhlIGRpc3BsYXllZCBvbmUuXG4gICAgICAgIC8vIFRoZSBzZXQgd2l0aCBydWxlcyB0aGF0IGhhdmUgTE9VRCB0d2Vha3MgaXMgdGhlIGZpcnN0IGNob2ljZS4gVGhlbiwgdGhlIG9uZXNcbiAgICAgICAgLy8gd2l0aCBPTiB0d2Vha3MgKG5vIHR3ZWFrcykuXG5cbiAgICAgICAgaWYgKGNvbnRlbnRSdWxlcy5sb3VkLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JTdGF0ZTogUHVzaFJ1bGVWZWN0b3JTdGF0ZS5MT1VELFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBjb250ZW50UnVsZXMubG91ZCxcbiAgICAgICAgICAgICAgICBleHRlcm5hbFJ1bGVzOiBbXS5jb25jYXQoY29udGVudFJ1bGVzLmxvdWRfYnV0X2Rpc2FibGVkLCBjb250ZW50UnVsZXMub24sIGNvbnRlbnRSdWxlcy5vbl9idXRfZGlzYWJsZWQsIGNvbnRlbnRSdWxlcy5vdGhlciksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnRSdWxlcy5sb3VkX2J1dF9kaXNhYmxlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmVjdG9yU3RhdGU6IFB1c2hSdWxlVmVjdG9yU3RhdGUuT0ZGLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBjb250ZW50UnVsZXMubG91ZF9idXRfZGlzYWJsZWQsXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxSdWxlczogW10uY29uY2F0KGNvbnRlbnRSdWxlcy5vbiwgY29udGVudFJ1bGVzLm9uX2J1dF9kaXNhYmxlZCwgY29udGVudFJ1bGVzLm90aGVyKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoY29udGVudFJ1bGVzLm9uLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JTdGF0ZTogUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PTixcbiAgICAgICAgICAgICAgICBydWxlczogY29udGVudFJ1bGVzLm9uLFxuICAgICAgICAgICAgICAgIGV4dGVybmFsUnVsZXM6IFtdLmNvbmNhdChjb250ZW50UnVsZXMub25fYnV0X2Rpc2FibGVkLCBjb250ZW50UnVsZXMub3RoZXIpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50UnVsZXMub25fYnV0X2Rpc2FibGVkLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JTdGF0ZTogUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PRkYsXG4gICAgICAgICAgICAgICAgcnVsZXM6IGNvbnRlbnRSdWxlcy5vbl9idXRfZGlzYWJsZWQsXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxSdWxlczogY29udGVudFJ1bGVzLm90aGVyLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmVjdG9yU3RhdGU6IFB1c2hSdWxlVmVjdG9yU3RhdGUuT04sXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxuICAgICAgICAgICAgICAgIGV4dGVybmFsUnVsZXM6IGNvbnRlbnRSdWxlcy5vdGhlcixcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgX2NhdGVnb3Jpc2VDb250ZW50UnVsZXMocnVsZXNldHMpIHtcbiAgICAgICAgY29uc3QgY29udGVudFJ1bGVzID0ge29uOiBbXSwgb25fYnV0X2Rpc2FibGVkOiBbXSwgbG91ZDogW10sIGxvdWRfYnV0X2Rpc2FibGVkOiBbXSwgb3RoZXI6IFtdfTtcbiAgICAgICAgZm9yIChjb25zdCBraW5kIGluIHJ1bGVzZXRzLmdsb2JhbCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBPYmplY3Qua2V5cyhydWxlc2V0cy5nbG9iYWxba2luZF0pLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHJ1bGVzZXRzLmdsb2JhbFtraW5kXVtpXTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGl0J3Mgbm90IGEgZGVmYXVsdCBydWxlXG4gICAgICAgICAgICAgICAgaWYgKHIucnVsZV9pZFswXSA9PT0gJy4nIHx8IGtpbmQgIT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByLmtpbmQgPSBraW5kOyAvLyBpcyB0aGlzIG5lZWRlZD8gbm90IHN1cmVcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAoUHVzaFJ1bGVWZWN0b3JTdGF0ZS5jb250ZW50UnVsZVZlY3RvclN0YXRlS2luZChyKSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFB1c2hSdWxlVmVjdG9yU3RhdGUuT046XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoci5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFJ1bGVzLm9uLnB1c2gocik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRSdWxlcy5vbl9idXRfZGlzYWJsZWQucHVzaChyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFB1c2hSdWxlVmVjdG9yU3RhdGUuTE9VRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50UnVsZXMubG91ZC5wdXNoKHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50UnVsZXMubG91ZF9idXRfZGlzYWJsZWQucHVzaChyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFJ1bGVzLm90aGVyLnB1c2gocik7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnRlbnRSdWxlcztcbiAgICB9XG59XG4iXX0=