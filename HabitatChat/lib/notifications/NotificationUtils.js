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
exports.NotificationUtils = void 0;

class NotificationUtils {
  // Encodes a dictionary of {
  //   "notify": true/false,
  //   "sound": string or undefined,
  //   "highlight: true/false,
  // }
  // to a list of push actions.
  static encodeActions(action) {
    const notify = action.notify;
    const sound = action.sound;
    const highlight = action.highlight;

    if (notify) {
      const actions = ["notify"];

      if (sound) {
        actions.push({
          "set_tweak": "sound",
          "value": sound
        });
      }

      if (highlight) {
        actions.push({
          "set_tweak": "highlight"
        });
      } else {
        actions.push({
          "set_tweak": "highlight",
          "value": false
        });
      }

      return actions;
    } else {
      return ["dont_notify"];
    }
  } // Decode a list of actions to a dictionary of {
  //   "notify": true/false,
  //   "sound": string or undefined,
  //   "highlight: true/false,
  // }
  // If the actions couldn't be decoded then returns null.


  static decodeActions(actions) {
    let notify = false;
    let sound = null;
    let highlight = false;

    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i];

      if (action === "notify") {
        notify = true;
      } else if (action === "dont_notify") {
        notify = false;
      } else if (typeof action === 'object') {
        if (action.set_tweak === "sound") {
          sound = action.value;
        } else if (action.set_tweak === "highlight") {
          highlight = action.value;
        } else {
          // We don't understand this kind of tweak, so give up.
          return null;
        }
      } else {
        // We don't understand this kind of action, so give up.
        return null;
      }
    }

    if (highlight === undefined) {
      // If a highlight tweak is missing a value then it defaults to true.
      highlight = true;
    }

    const result = {
      notify: notify,
      highlight: highlight
    };

    if (sound !== null) {
      result.sound = sound;
    }

    return result;
  }

}

exports.NotificationUtils = NotificationUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub3RpZmljYXRpb25zL05vdGlmaWNhdGlvblV0aWxzLmpzIl0sIm5hbWVzIjpbIk5vdGlmaWNhdGlvblV0aWxzIiwiZW5jb2RlQWN0aW9ucyIsImFjdGlvbiIsIm5vdGlmeSIsInNvdW5kIiwiaGlnaGxpZ2h0IiwiYWN0aW9ucyIsInB1c2giLCJkZWNvZGVBY3Rpb25zIiwiaSIsImxlbmd0aCIsInNldF90d2VhayIsInZhbHVlIiwidW5kZWZpbmVkIiwicmVzdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7Ozs7OztBQUVPLE1BQU1BLGlCQUFOLENBQXdCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQU9DLGFBQVAsQ0FBcUJDLE1BQXJCLEVBQTZCO0FBQ3pCLFVBQU1DLE1BQU0sR0FBR0QsTUFBTSxDQUFDQyxNQUF0QjtBQUNBLFVBQU1DLEtBQUssR0FBR0YsTUFBTSxDQUFDRSxLQUFyQjtBQUNBLFVBQU1DLFNBQVMsR0FBR0gsTUFBTSxDQUFDRyxTQUF6Qjs7QUFDQSxRQUFJRixNQUFKLEVBQVk7QUFDUixZQUFNRyxPQUFPLEdBQUcsQ0FBQyxRQUFELENBQWhCOztBQUNBLFVBQUlGLEtBQUosRUFBVztBQUNQRSxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYTtBQUFDLHVCQUFhLE9BQWQ7QUFBdUIsbUJBQVNIO0FBQWhDLFNBQWI7QUFDSDs7QUFDRCxVQUFJQyxTQUFKLEVBQWU7QUFDWEMsUUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWE7QUFBQyx1QkFBYTtBQUFkLFNBQWI7QUFDSCxPQUZELE1BRU87QUFDSEQsUUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWE7QUFBQyx1QkFBYSxXQUFkO0FBQTJCLG1CQUFTO0FBQXBDLFNBQWI7QUFDSDs7QUFDRCxhQUFPRCxPQUFQO0FBQ0gsS0FYRCxNQVdPO0FBQ0gsYUFBTyxDQUFDLGFBQUQsQ0FBUDtBQUNIO0FBQ0osR0F6QjBCLENBMkIzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLFNBQU9FLGFBQVAsQ0FBcUJGLE9BQXJCLEVBQThCO0FBQzFCLFFBQUlILE1BQU0sR0FBRyxLQUFiO0FBQ0EsUUFBSUMsS0FBSyxHQUFHLElBQVo7QUFDQSxRQUFJQyxTQUFTLEdBQUcsS0FBaEI7O0FBRUEsU0FBSyxJQUFJSSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHSCxPQUFPLENBQUNJLE1BQTVCLEVBQW9DLEVBQUVELENBQXRDLEVBQXlDO0FBQ3JDLFlBQU1QLE1BQU0sR0FBR0ksT0FBTyxDQUFDRyxDQUFELENBQXRCOztBQUNBLFVBQUlQLE1BQU0sS0FBSyxRQUFmLEVBQXlCO0FBQ3JCQyxRQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNILE9BRkQsTUFFTyxJQUFJRCxNQUFNLEtBQUssYUFBZixFQUE4QjtBQUNqQ0MsUUFBQUEsTUFBTSxHQUFHLEtBQVQ7QUFDSCxPQUZNLE1BRUEsSUFBSSxPQUFPRCxNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQ25DLFlBQUlBLE1BQU0sQ0FBQ1MsU0FBUCxLQUFxQixPQUF6QixFQUFrQztBQUM5QlAsVUFBQUEsS0FBSyxHQUFHRixNQUFNLENBQUNVLEtBQWY7QUFDSCxTQUZELE1BRU8sSUFBSVYsTUFBTSxDQUFDUyxTQUFQLEtBQXFCLFdBQXpCLEVBQXNDO0FBQ3pDTixVQUFBQSxTQUFTLEdBQUdILE1BQU0sQ0FBQ1UsS0FBbkI7QUFDSCxTQUZNLE1BRUE7QUFDSDtBQUNBLGlCQUFPLElBQVA7QUFDSDtBQUNKLE9BVE0sTUFTQTtBQUNIO0FBQ0EsZUFBTyxJQUFQO0FBQ0g7QUFDSjs7QUFFRCxRQUFJUCxTQUFTLEtBQUtRLFNBQWxCLEVBQTZCO0FBQ3pCO0FBQ0FSLE1BQUFBLFNBQVMsR0FBRyxJQUFaO0FBQ0g7O0FBRUQsVUFBTVMsTUFBTSxHQUFHO0FBQUNYLE1BQUFBLE1BQU0sRUFBRUEsTUFBVDtBQUFpQkUsTUFBQUEsU0FBUyxFQUFFQTtBQUE1QixLQUFmOztBQUNBLFFBQUlELEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ2hCVSxNQUFBQSxNQUFNLENBQUNWLEtBQVAsR0FBZUEsS0FBZjtBQUNIOztBQUNELFdBQU9VLE1BQVA7QUFDSDs7QUFyRTBCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIE5vdGlmaWNhdGlvblV0aWxzIHtcbiAgICAvLyBFbmNvZGVzIGEgZGljdGlvbmFyeSBvZiB7XG4gICAgLy8gICBcIm5vdGlmeVwiOiB0cnVlL2ZhbHNlLFxuICAgIC8vICAgXCJzb3VuZFwiOiBzdHJpbmcgb3IgdW5kZWZpbmVkLFxuICAgIC8vICAgXCJoaWdobGlnaHQ6IHRydWUvZmFsc2UsXG4gICAgLy8gfVxuICAgIC8vIHRvIGEgbGlzdCBvZiBwdXNoIGFjdGlvbnMuXG4gICAgc3RhdGljIGVuY29kZUFjdGlvbnMoYWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5vdGlmeSA9IGFjdGlvbi5ub3RpZnk7XG4gICAgICAgIGNvbnN0IHNvdW5kID0gYWN0aW9uLnNvdW5kO1xuICAgICAgICBjb25zdCBoaWdobGlnaHQgPSBhY3Rpb24uaGlnaGxpZ2h0O1xuICAgICAgICBpZiAobm90aWZ5KSB7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gW1wibm90aWZ5XCJdO1xuICAgICAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucy5wdXNoKHtcInNldF90d2Vha1wiOiBcInNvdW5kXCIsIFwidmFsdWVcIjogc291bmR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoaWdobGlnaHQpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zLnB1c2goe1wic2V0X3R3ZWFrXCI6IFwiaGlnaGxpZ2h0XCJ9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucy5wdXNoKHtcInNldF90d2Vha1wiOiBcImhpZ2hsaWdodFwiLCBcInZhbHVlXCI6IGZhbHNlfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWN0aW9ucztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbXCJkb250X25vdGlmeVwiXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlY29kZSBhIGxpc3Qgb2YgYWN0aW9ucyB0byBhIGRpY3Rpb25hcnkgb2Yge1xuICAgIC8vICAgXCJub3RpZnlcIjogdHJ1ZS9mYWxzZSxcbiAgICAvLyAgIFwic291bmRcIjogc3RyaW5nIG9yIHVuZGVmaW5lZCxcbiAgICAvLyAgIFwiaGlnaGxpZ2h0OiB0cnVlL2ZhbHNlLFxuICAgIC8vIH1cbiAgICAvLyBJZiB0aGUgYWN0aW9ucyBjb3VsZG4ndCBiZSBkZWNvZGVkIHRoZW4gcmV0dXJucyBudWxsLlxuICAgIHN0YXRpYyBkZWNvZGVBY3Rpb25zKGFjdGlvbnMpIHtcbiAgICAgICAgbGV0IG5vdGlmeSA9IGZhbHNlO1xuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuICAgICAgICBsZXQgaGlnaGxpZ2h0ID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBhY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJub3RpZnlcIikge1xuICAgICAgICAgICAgICAgIG5vdGlmeSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJkb250X25vdGlmeVwiKSB7XG4gICAgICAgICAgICAgICAgbm90aWZ5ID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhY3Rpb24gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5zZXRfdHdlYWsgPT09IFwic291bmRcIikge1xuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IGFjdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbi5zZXRfdHdlYWsgPT09IFwiaGlnaGxpZ2h0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0ID0gYWN0aW9uLnZhbHVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IHVuZGVyc3RhbmQgdGhpcyBraW5kIG9mIHR3ZWFrLCBzbyBnaXZlIHVwLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IHVuZGVyc3RhbmQgdGhpcyBraW5kIG9mIGFjdGlvbiwgc28gZ2l2ZSB1cC5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoaWdobGlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gSWYgYSBoaWdobGlnaHQgdHdlYWsgaXMgbWlzc2luZyBhIHZhbHVlIHRoZW4gaXQgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgICAgICAgIGhpZ2hsaWdodCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQgPSB7bm90aWZ5OiBub3RpZnksIGhpZ2hsaWdodDogaGlnaGxpZ2h0fTtcbiAgICAgICAgaWYgKHNvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQuc291bmQgPSBzb3VuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbiJdfQ==