"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getKeyValueArrayDiffs = getKeyValueArrayDiffs;
exports.shallowEqual = shallowEqual;

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

/**
 * For two objects of the form { key: [val1, val2, val3] }, work out the added/removed
 * values. Entirely new keys will result in the entire value array being added.
 * @param {Object} before
 * @param {Object} after
 * @return {Object[]} An array of objects with the form:
 * { key: $KEY, val: $VALUE, place: "add|del" }
 */
function getKeyValueArrayDiffs(before, after) {
  const results = [];
  const delta = {};
  Object.keys(before).forEach(function (beforeKey) {
    delta[beforeKey] = delta[beforeKey] || 0; // init to 0 initially

    delta[beforeKey]--; // keys present in the past have -ve values
  });
  Object.keys(after).forEach(function (afterKey) {
    delta[afterKey] = delta[afterKey] || 0; // init to 0 initially

    delta[afterKey]++; // keys present in the future have +ve values
  });
  Object.keys(delta).forEach(function (muxedKey) {
    switch (delta[muxedKey]) {
      case 1:
        // A new key in after
        after[muxedKey].forEach(function (afterVal) {
          results.push({
            place: "add",
            key: muxedKey,
            val: afterVal
          });
        });
        break;

      case -1:
        // A before key was removed
        before[muxedKey].forEach(function (beforeVal) {
          results.push({
            place: "del",
            key: muxedKey,
            val: beforeVal
          });
        });
        break;

      case 0:
        {
          // A mix of added/removed keys
          // compare old & new vals
          const itemDelta = {};
          before[muxedKey].forEach(function (beforeVal) {
            itemDelta[beforeVal] = itemDelta[beforeVal] || 0;
            itemDelta[beforeVal]--;
          });
          after[muxedKey].forEach(function (afterVal) {
            itemDelta[afterVal] = itemDelta[afterVal] || 0;
            itemDelta[afterVal]++;
          });
          Object.keys(itemDelta).forEach(function (item) {
            if (itemDelta[item] === 1) {
              results.push({
                place: "add",
                key: muxedKey,
                val: item
              });
            } else if (itemDelta[item] === -1) {
              results.push({
                place: "del",
                key: muxedKey,
                val: item
              });
            } else {// itemDelta of 0 means it was unchanged between before/after
            }
          });
          break;
        }

      default:
        console.error("Calculated key delta of " + delta[muxedKey] + " - this should never happen!");
        break;
    }
  });
  return results;
}
/**
 * Shallow-compare two objects for equality: each key and value must be identical
 * @param {Object} objA First object to compare against the second
 * @param {Object} objB Second object to compare against the first
 * @return {boolean} whether the two objects have same key=values
 */


function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];

    if (!objB.hasOwnProperty(key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9PYmplY3RVdGlscy5qcyJdLCJuYW1lcyI6WyJnZXRLZXlWYWx1ZUFycmF5RGlmZnMiLCJiZWZvcmUiLCJhZnRlciIsInJlc3VsdHMiLCJkZWx0YSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiYmVmb3JlS2V5IiwiYWZ0ZXJLZXkiLCJtdXhlZEtleSIsImFmdGVyVmFsIiwicHVzaCIsInBsYWNlIiwia2V5IiwidmFsIiwiYmVmb3JlVmFsIiwiaXRlbURlbHRhIiwiaXRlbSIsImNvbnNvbGUiLCJlcnJvciIsInNoYWxsb3dFcXVhbCIsIm9iakEiLCJvYmpCIiwia2V5c0EiLCJrZXlzQiIsImxlbmd0aCIsImkiLCJoYXNPd25Qcm9wZXJ0eSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7Ozs7Ozs7O0FBUU8sU0FBU0EscUJBQVQsQ0FBK0JDLE1BQS9CLEVBQXVDQyxLQUF2QyxFQUE4QztBQUNqRCxRQUFNQyxPQUFPLEdBQUcsRUFBaEI7QUFDQSxRQUFNQyxLQUFLLEdBQUcsRUFBZDtBQUNBQyxFQUFBQSxNQUFNLENBQUNDLElBQVAsQ0FBWUwsTUFBWixFQUFvQk0sT0FBcEIsQ0FBNEIsVUFBU0MsU0FBVCxFQUFvQjtBQUM1Q0osSUFBQUEsS0FBSyxDQUFDSSxTQUFELENBQUwsR0FBbUJKLEtBQUssQ0FBQ0ksU0FBRCxDQUFMLElBQW9CLENBQXZDLENBRDRDLENBQ0Y7O0FBQzFDSixJQUFBQSxLQUFLLENBQUNJLFNBQUQsQ0FBTCxHQUY0QyxDQUV4QjtBQUN2QixHQUhEO0FBSUFILEVBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZSixLQUFaLEVBQW1CSyxPQUFuQixDQUEyQixVQUFTRSxRQUFULEVBQW1CO0FBQzFDTCxJQUFBQSxLQUFLLENBQUNLLFFBQUQsQ0FBTCxHQUFrQkwsS0FBSyxDQUFDSyxRQUFELENBQUwsSUFBbUIsQ0FBckMsQ0FEMEMsQ0FDRjs7QUFDeENMLElBQUFBLEtBQUssQ0FBQ0ss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QWdCLFFBQWhCLElBQTRCQSxJQUFJLEtBQUssSUFBckMsSUFDRSxPQUFPQyxJQUFQLEtBQWdCLFFBRGxCLElBQzhCQSxJQUFJLEtBQUssSUFEM0MsRUFDaUQ7QUFDN0MsV0FBTyxLQUFQO0FBQ0g7O0FBRUQsUUFBTUMsS0FBSyxHQUFHbkIsTUFBTSxDQUFDQyxJQUFQLENBQVlnQixJQUFaLENBQWQ7QUFDQSxRQUFNRyxLQUFLLEdBQUdwQixNQUFNLENBQUNDLElBQVAsQ0FBWWlCLElBQVosQ0FBZDs7QUFFQSxNQUFJQyxLQUFLLENBQUNFLE1BQU4sS0FBaUJELEtBQUssQ0FBQ0MsTUFBM0IsRUFBbUM7QUFDL0IsV0FBTyxLQUFQO0FBQ0g7O0FBRUQsT0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHSCxLQUFLLENBQUNFLE1BQTFCLEVBQWtDQyxDQUFDLEVBQW5DLEVBQXVDO0FBQ25DLFVBQU1iLEdBQUcsR0FBR1UsS0FBSyxDQUFDRyxDQUFELENBQWpCOztBQUNBLFFBQUksQ0FBQ0osSUFBSSxDQUFDSyxjQUFMLENBQW9CZCxHQUFwQixDQUFELElBQTZCUSxJQUFJLENBQUNSLEdBQUQsQ0FBSixLQUFjUyxJQUFJLENBQUNULEdBQUQsQ0FBbkQsRUFBMEQ7QUFDdEQsYUFBTyxLQUFQO0FBQ0g7QUFDSjs7QUFFRCxTQUFPLElBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKipcbiAqIEZvciB0d28gb2JqZWN0cyBvZiB0aGUgZm9ybSB7IGtleTogW3ZhbDEsIHZhbDIsIHZhbDNdIH0sIHdvcmsgb3V0IHRoZSBhZGRlZC9yZW1vdmVkXG4gKiB2YWx1ZXMuIEVudGlyZWx5IG5ldyBrZXlzIHdpbGwgcmVzdWx0IGluIHRoZSBlbnRpcmUgdmFsdWUgYXJyYXkgYmVpbmcgYWRkZWQuXG4gKiBAcGFyYW0ge09iamVjdH0gYmVmb3JlXG4gKiBAcGFyYW0ge09iamVjdH0gYWZ0ZXJcbiAqIEByZXR1cm4ge09iamVjdFtdfSBBbiBhcnJheSBvZiBvYmplY3RzIHdpdGggdGhlIGZvcm06XG4gKiB7IGtleTogJEtFWSwgdmFsOiAkVkFMVUUsIHBsYWNlOiBcImFkZHxkZWxcIiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXlWYWx1ZUFycmF5RGlmZnMoYmVmb3JlLCBhZnRlcikge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBjb25zdCBkZWx0YSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGJlZm9yZSkuZm9yRWFjaChmdW5jdGlvbihiZWZvcmVLZXkpIHtcbiAgICAgICAgZGVsdGFbYmVmb3JlS2V5XSA9IGRlbHRhW2JlZm9yZUtleV0gfHwgMDsgLy8gaW5pdCB0byAwIGluaXRpYWxseVxuICAgICAgICBkZWx0YVtiZWZvcmVLZXldLS07IC8vIGtleXMgcHJlc2VudCBpbiB0aGUgcGFzdCBoYXZlIC12ZSB2YWx1ZXNcbiAgICB9KTtcbiAgICBPYmplY3Qua2V5cyhhZnRlcikuZm9yRWFjaChmdW5jdGlvbihhZnRlcktleSkge1xuICAgICAgICBkZWx0YVthZnRlcktleV0gPSBkZWx0YVthZnRlcktleV0gfHwgMDsgLy8gaW5pdCB0byAwIGluaXRpYWxseVxuICAgICAgICBkZWx0YVthZnRlcktleV0rKzsgLy8ga2V5cyBwcmVzZW50IGluIHRoZSBmdXR1cmUgaGF2ZSArdmUgdmFsdWVzXG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhkZWx0YSkuZm9yRWFjaChmdW5jdGlvbihtdXhlZEtleSkge1xuICAgICAgICBzd2l0Y2ggKGRlbHRhW211eGVkS2V5XSkge1xuICAgICAgICAgICAgY2FzZSAxOiAvLyBBIG5ldyBrZXkgaW4gYWZ0ZXJcbiAgICAgICAgICAgICAgICBhZnRlclttdXhlZEtleV0uZm9yRWFjaChmdW5jdGlvbihhZnRlclZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwbGFjZTogXCJhZGRcIiwga2V5OiBtdXhlZEtleSwgdmFsOiBhZnRlclZhbCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgLTE6IC8vIEEgYmVmb3JlIGtleSB3YXMgcmVtb3ZlZFxuICAgICAgICAgICAgICAgIGJlZm9yZVttdXhlZEtleV0uZm9yRWFjaChmdW5jdGlvbihiZWZvcmVWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcGxhY2U6IFwiZGVsXCIsIGtleTogbXV4ZWRLZXksIHZhbDogYmVmb3JlVmFsIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAwOiB7Ly8gQSBtaXggb2YgYWRkZWQvcmVtb3ZlZCBrZXlzXG4gICAgICAgICAgICAgICAgLy8gY29tcGFyZSBvbGQgJiBuZXcgdmFsc1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1EZWx0YSA9IHt9O1xuICAgICAgICAgICAgICAgIGJlZm9yZVttdXhlZEtleV0uZm9yRWFjaChmdW5jdGlvbihiZWZvcmVWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbURlbHRhW2JlZm9yZVZhbF0gPSBpdGVtRGVsdGFbYmVmb3JlVmFsXSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICBpdGVtRGVsdGFbYmVmb3JlVmFsXS0tO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFmdGVyW211eGVkS2V5XS5mb3JFYWNoKGZ1bmN0aW9uKGFmdGVyVmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1EZWx0YVthZnRlclZhbF0gPSBpdGVtRGVsdGFbYWZ0ZXJWYWxdIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1EZWx0YVthZnRlclZhbF0rKztcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGl0ZW1EZWx0YSkuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtRGVsdGFbaXRlbV0gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHBsYWNlOiBcImFkZFwiLCBrZXk6IG11eGVkS2V5LCB2YWw6IGl0ZW0gfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbURlbHRhW2l0ZW1dID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcGxhY2U6IFwiZGVsXCIsIGtleTogbXV4ZWRLZXksIHZhbDogaXRlbSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0ZW1EZWx0YSBvZiAwIG1lYW5zIGl0IHdhcyB1bmNoYW5nZWQgYmV0d2VlbiBiZWZvcmUvYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2FsY3VsYXRlZCBrZXkgZGVsdGEgb2YgXCIgKyBkZWx0YVttdXhlZEtleV0gKyBcIiAtIHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiFcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFNoYWxsb3ctY29tcGFyZSB0d28gb2JqZWN0cyBmb3IgZXF1YWxpdHk6IGVhY2gga2V5IGFuZCB2YWx1ZSBtdXN0IGJlIGlkZW50aWNhbFxuICogQHBhcmFtIHtPYmplY3R9IG9iakEgRmlyc3Qgb2JqZWN0IHRvIGNvbXBhcmUgYWdhaW5zdCB0aGUgc2Vjb25kXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqQiBTZWNvbmQgb2JqZWN0IHRvIGNvbXBhcmUgYWdhaW5zdCB0aGUgZmlyc3RcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHdoZXRoZXIgdGhlIHR3byBvYmplY3RzIGhhdmUgc2FtZSBrZXk9dmFsdWVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaGFsbG93RXF1YWwob2JqQSwgb2JqQikge1xuICAgIGlmIChvYmpBID09PSBvYmpCKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqQSAhPT0gJ29iamVjdCcgfHwgb2JqQSA9PT0gbnVsbCB8fFxuICAgICAgICAgIHR5cGVvZiBvYmpCICE9PSAnb2JqZWN0JyB8fCBvYmpCID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXlzQSA9IE9iamVjdC5rZXlzKG9iakEpO1xuICAgIGNvbnN0IGtleXNCID0gT2JqZWN0LmtleXMob2JqQik7XG5cbiAgICBpZiAoa2V5c0EubGVuZ3RoICE9PSBrZXlzQi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c0EubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5c0FbaV07XG4gICAgICAgIGlmICghb2JqQi5oYXNPd25Qcm9wZXJ0eShrZXkpIHx8IG9iakFba2V5XSAhPT0gb2JqQltrZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiJdfQ==