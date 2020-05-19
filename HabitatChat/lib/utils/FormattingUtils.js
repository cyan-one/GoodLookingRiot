"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatCount = formatCount;
exports.formatCountLong = formatCountLong;
exports.formatBytes = formatBytes;
exports.formatCryptoKey = formatCryptoKey;
exports.hashCode = hashCode;
exports.getUserNameColorClass = getUserNameColorClass;
exports.formatCommaSeparatedList = formatCommaSeparatedList;

var _languageHandler = require("../languageHandler");

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
 * formats numbers to fit into ~3 characters, suitable for badge counts
 * e.g: 999, 9.9K, 99K, 0.9M, 9.9M, 99M, 0.9B, 9.9B
 */
function formatCount(count) {
  if (count < 1000) return count;
  if (count < 10000) return (count / 1000).toFixed(1) + "K";
  if (count < 100000) return (count / 1000).toFixed(0) + "K";
  if (count < 10000000) return (count / 1000000).toFixed(1) + "M";
  if (count < 100000000) return (count / 1000000).toFixed(0) + "M";
  return (count / 1000000000).toFixed(1) + "B"; // 10B is enough for anyone, right? :S
}
/**
 * Format a count showing the whole number but making it a bit more readable.
 * e.g: 1000 => 1,000
 */


function formatCountLong(count) {
  const formatter = new Intl.NumberFormat();
  return formatter.format(count);
}
/**
 * format a size in bytes into a human readable form
 * e.g: 1024 -> 1.00 KB
 */


function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * format a key into groups of 4 characters, for easier visual inspection
 *
 * @param {string} key key to format
 *
 * @return {string}
 */


function formatCryptoKey(key) {
  return key.match(/.{1,4}/g).join(" ");
}
/**
 * calculates a numeric hash for a given string
 *
 * @param {string} str string to hash
 *
 * @return {number}
 */


function hashCode(str) {
  let hash = 0;
  let i;
  let chr;

  if (str.length === 0) {
    return hash;
  }

  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  return Math.abs(hash);
}

function getUserNameColorClass(userId) {
  const colorNumber = hashCode(userId) % 8 + 1;
  return "mx_Username_color".concat(colorNumber);
}
/**
 * Constructs a written English string representing `items`, with an optional
 * limit on the number of items included in the result. If specified and if the
 * length of `items` is greater than the limit, the string "and n others" will
 * be appended onto the result. If `items` is empty, returns the empty string.
 * If there is only one item, return it.
 * @param {string[]} items the items to construct a string from.
 * @param {number?} itemLimit the number by which to limit the list.
 * @returns {string} a string constructed by joining `items` with a comma
 * between each item, but with the last item appended as " and [lastItem]".
 */


function formatCommaSeparatedList(items, itemLimit) {
  const remaining = itemLimit === undefined ? 0 : Math.max(items.length - itemLimit, 0);

  if (items.length === 0) {
    return "";
  } else if (items.length === 1) {
    return items[0];
  } else if (remaining > 0) {
    items = items.slice(0, itemLimit);
    return (0, _languageHandler._t)("%(items)s and %(count)s others", {
      items: items.join(', '),
      count: remaining
    });
  } else {
    const lastItem = items.pop();
    return (0, _languageHandler._t)("%(items)s and %(lastItem)s", {
      items: items.join(', '),
      lastItem: lastItem
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9Gb3JtYXR0aW5nVXRpbHMuanMiXSwibmFtZXMiOlsiZm9ybWF0Q291bnQiLCJjb3VudCIsInRvRml4ZWQiLCJmb3JtYXRDb3VudExvbmciLCJmb3JtYXR0ZXIiLCJJbnRsIiwiTnVtYmVyRm9ybWF0IiwiZm9ybWF0IiwiZm9ybWF0Qnl0ZXMiLCJieXRlcyIsImRlY2ltYWxzIiwiayIsImRtIiwic2l6ZXMiLCJpIiwiTWF0aCIsImZsb29yIiwibG9nIiwicGFyc2VGbG9hdCIsInBvdyIsImZvcm1hdENyeXB0b0tleSIsImtleSIsIm1hdGNoIiwiam9pbiIsImhhc2hDb2RlIiwic3RyIiwiaGFzaCIsImNociIsImxlbmd0aCIsImNoYXJDb2RlQXQiLCJhYnMiLCJnZXRVc2VyTmFtZUNvbG9yQ2xhc3MiLCJ1c2VySWQiLCJjb2xvck51bWJlciIsImZvcm1hdENvbW1hU2VwYXJhdGVkTGlzdCIsIml0ZW1zIiwiaXRlbUxpbWl0IiwicmVtYWluaW5nIiwidW5kZWZpbmVkIiwibWF4Iiwic2xpY2UiLCJsYXN0SXRlbSIsInBvcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBOzs7O0FBSU8sU0FBU0EsV0FBVCxDQUFxQkMsS0FBckIsRUFBNEI7QUFDaEMsTUFBSUEsS0FBSyxHQUFHLElBQVosRUFBa0IsT0FBT0EsS0FBUDtBQUNsQixNQUFJQSxLQUFLLEdBQUcsS0FBWixFQUFtQixPQUFPLENBQUNBLEtBQUssR0FBRyxJQUFULEVBQWVDLE9BQWYsQ0FBdUIsQ0FBdkIsSUFBNEIsR0FBbkM7QUFDbkIsTUFBSUQsS0FBSyxHQUFHLE1BQVosRUFBb0IsT0FBTyxDQUFDQSxLQUFLLEdBQUcsSUFBVCxFQUFlQyxPQUFmLENBQXVCLENBQXZCLElBQTRCLEdBQW5DO0FBQ3BCLE1BQUlELEtBQUssR0FBRyxRQUFaLEVBQXNCLE9BQU8sQ0FBQ0EsS0FBSyxHQUFHLE9BQVQsRUFBa0JDLE9BQWxCLENBQTBCLENBQTFCLElBQStCLEdBQXRDO0FBQ3RCLE1BQUlELEtBQUssR0FBRyxTQUFaLEVBQXVCLE9BQU8sQ0FBQ0EsS0FBSyxHQUFHLE9BQVQsRUFBa0JDLE9BQWxCLENBQTBCLENBQTFCLElBQStCLEdBQXRDO0FBQ3ZCLFNBQU8sQ0FBQ0QsS0FBSyxHQUFHLFVBQVQsRUFBcUJDLE9BQXJCLENBQTZCLENBQTdCLElBQWtDLEdBQXpDLENBTmdDLENBTWM7QUFDaEQ7QUFFRDs7Ozs7O0FBSU8sU0FBU0MsZUFBVCxDQUF5QkYsS0FBekIsRUFBZ0M7QUFDbkMsUUFBTUcsU0FBUyxHQUFHLElBQUlDLElBQUksQ0FBQ0MsWUFBVCxFQUFsQjtBQUNBLFNBQU9GLFNBQVMsQ0FBQ0csTUFBVixDQUFpQk4sS0FBakIsQ0FBUDtBQUNIO0FBRUQ7Ozs7OztBQUlPLFNBQVNPLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxRQUFRLEdBQUcsQ0FBdkMsRUFBMEM7QUFDN0MsTUFBSUQsS0FBSyxLQUFLLENBQWQsRUFBaUIsT0FBTyxTQUFQO0FBRWpCLFFBQU1FLENBQUMsR0FBRyxJQUFWO0FBQ0EsUUFBTUMsRUFBRSxHQUFHRixRQUFRLEdBQUcsQ0FBWCxHQUFlLENBQWYsR0FBbUJBLFFBQTlCO0FBQ0EsUUFBTUcsS0FBSyxHQUFHLENBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsRUFBNEIsSUFBNUIsRUFBa0MsSUFBbEMsRUFBd0MsSUFBeEMsRUFBOEMsSUFBOUMsRUFBb0QsSUFBcEQsQ0FBZDtBQUVBLFFBQU1DLENBQUMsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdELElBQUksQ0FBQ0UsR0FBTCxDQUFTUixLQUFULElBQWtCTSxJQUFJLENBQUNFLEdBQUwsQ0FBU04sQ0FBVCxDQUE3QixDQUFWO0FBRUEsU0FBT08sVUFBVSxDQUFDLENBQUNULEtBQUssR0FBR00sSUFBSSxDQUFDSSxHQUFMLENBQVNSLENBQVQsRUFBWUcsQ0FBWixDQUFULEVBQXlCWixPQUF6QixDQUFpQ1UsRUFBakMsQ0FBRCxDQUFWLEdBQW1ELEdBQW5ELEdBQXlEQyxLQUFLLENBQUNDLENBQUQsQ0FBckU7QUFDSDtBQUVEOzs7Ozs7Ozs7QUFPTyxTQUFTTSxlQUFULENBQXlCQyxHQUF6QixFQUE4QjtBQUNqQyxTQUFPQSxHQUFHLENBQUNDLEtBQUosQ0FBVSxTQUFWLEVBQXFCQyxJQUFyQixDQUEwQixHQUExQixDQUFQO0FBQ0g7QUFDRDs7Ozs7Ozs7O0FBT08sU0FBU0MsUUFBVCxDQUFrQkMsR0FBbEIsRUFBdUI7QUFDMUIsTUFBSUMsSUFBSSxHQUFHLENBQVg7QUFDQSxNQUFJWixDQUFKO0FBQ0EsTUFBSWEsR0FBSjs7QUFDQSxNQUFJRixHQUFHLENBQUNHLE1BQUosS0FBZSxDQUFuQixFQUFzQjtBQUNsQixXQUFPRixJQUFQO0FBQ0g7O0FBQ0QsT0FBS1osQ0FBQyxHQUFHLENBQVQsRUFBWUEsQ0FBQyxHQUFHVyxHQUFHLENBQUNHLE1BQXBCLEVBQTRCZCxDQUFDLEVBQTdCLEVBQWlDO0FBQzdCYSxJQUFBQSxHQUFHLEdBQUdGLEdBQUcsQ0FBQ0ksVUFBSixDQUFlZixDQUFmLENBQU47QUFDQVksSUFBQUEsSUFBSSxHQUFJLENBQUNBLElBQUksSUFBSSxDQUFULElBQWNBLElBQWYsR0FBdUJDLEdBQTlCO0FBQ0FELElBQUFBLElBQUksSUFBSSxDQUFSO0FBQ0g7O0FBQ0QsU0FBT1gsSUFBSSxDQUFDZSxHQUFMLENBQVNKLElBQVQsQ0FBUDtBQUNIOztBQUVNLFNBQVNLLHFCQUFULENBQStCQyxNQUEvQixFQUF1QztBQUMxQyxRQUFNQyxXQUFXLEdBQUlULFFBQVEsQ0FBQ1EsTUFBRCxDQUFSLEdBQW1CLENBQXBCLEdBQXlCLENBQTdDO0FBQ0Esb0NBQTJCQyxXQUEzQjtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7Ozs7QUFXTyxTQUFTQyx3QkFBVCxDQUFrQ0MsS0FBbEMsRUFBeUNDLFNBQXpDLEVBQW9EO0FBQ3ZELFFBQU1DLFNBQVMsR0FBR0QsU0FBUyxLQUFLRSxTQUFkLEdBQTBCLENBQTFCLEdBQThCdkIsSUFBSSxDQUFDd0IsR0FBTCxDQUM1Q0osS0FBSyxDQUFDUCxNQUFOLEdBQWVRLFNBRDZCLEVBQ2xCLENBRGtCLENBQWhEOztBQUdBLE1BQUlELEtBQUssQ0FBQ1AsTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUNwQixXQUFPLEVBQVA7QUFDSCxHQUZELE1BRU8sSUFBSU8sS0FBSyxDQUFDUCxNQUFOLEtBQWlCLENBQXJCLEVBQXdCO0FBQzNCLFdBQU9PLEtBQUssQ0FBQyxDQUFELENBQVo7QUFDSCxHQUZNLE1BRUEsSUFBSUUsU0FBUyxHQUFHLENBQWhCLEVBQW1CO0FBQ3RCRixJQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQ0ssS0FBTixDQUFZLENBQVosRUFBZUosU0FBZixDQUFSO0FBQ0EsV0FBTyx5QkFBRyxnQ0FBSCxFQUFxQztBQUFFRCxNQUFBQSxLQUFLLEVBQUVBLEtBQUssQ0FBQ1osSUFBTixDQUFXLElBQVgsQ0FBVDtBQUEyQnRCLE1BQUFBLEtBQUssRUFBRW9DO0FBQWxDLEtBQXJDLENBQVA7QUFDSCxHQUhNLE1BR0E7QUFDSCxVQUFNSSxRQUFRLEdBQUdOLEtBQUssQ0FBQ08sR0FBTixFQUFqQjtBQUNBLFdBQU8seUJBQUcsNEJBQUgsRUFBaUM7QUFBRVAsTUFBQUEsS0FBSyxFQUFFQSxLQUFLLENBQUNaLElBQU4sQ0FBVyxJQUFYLENBQVQ7QUFBMkJrQixNQUFBQSxRQUFRLEVBQUVBO0FBQXJDLEtBQWpDLENBQVA7QUFDSDtBQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuLyoqXG4gKiBmb3JtYXRzIG51bWJlcnMgdG8gZml0IGludG8gfjMgY2hhcmFjdGVycywgc3VpdGFibGUgZm9yIGJhZGdlIGNvdW50c1xuICogZS5nOiA5OTksIDkuOUssIDk5SywgMC45TSwgOS45TSwgOTlNLCAwLjlCLCA5LjlCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb3VudChjb3VudCkge1xuICAgaWYgKGNvdW50IDwgMTAwMCkgcmV0dXJuIGNvdW50O1xuICAgaWYgKGNvdW50IDwgMTAwMDApIHJldHVybiAoY291bnQgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJLXCI7XG4gICBpZiAoY291bnQgPCAxMDAwMDApIHJldHVybiAoY291bnQgLyAxMDAwKS50b0ZpeGVkKDApICsgXCJLXCI7XG4gICBpZiAoY291bnQgPCAxMDAwMDAwMCkgcmV0dXJuIChjb3VudCAvIDEwMDAwMDApLnRvRml4ZWQoMSkgKyBcIk1cIjtcbiAgIGlmIChjb3VudCA8IDEwMDAwMDAwMCkgcmV0dXJuIChjb3VudCAvIDEwMDAwMDApLnRvRml4ZWQoMCkgKyBcIk1cIjtcbiAgIHJldHVybiAoY291bnQgLyAxMDAwMDAwMDAwKS50b0ZpeGVkKDEpICsgXCJCXCI7IC8vIDEwQiBpcyBlbm91Z2ggZm9yIGFueW9uZSwgcmlnaHQ/IDpTXG59XG5cbi8qKlxuICogRm9ybWF0IGEgY291bnQgc2hvd2luZyB0aGUgd2hvbGUgbnVtYmVyIGJ1dCBtYWtpbmcgaXQgYSBiaXQgbW9yZSByZWFkYWJsZS5cbiAqIGUuZzogMTAwMCA9PiAxLDAwMFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q291bnRMb25nKGNvdW50KSB7XG4gICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCk7XG4gICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQoY291bnQpXG59XG5cbi8qKlxuICogZm9ybWF0IGEgc2l6ZSBpbiBieXRlcyBpbnRvIGEgaHVtYW4gcmVhZGFibGUgZm9ybVxuICogZS5nOiAxMDI0IC0+IDEuMDAgS0JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEJ5dGVzKGJ5dGVzLCBkZWNpbWFscyA9IDIpIHtcbiAgICBpZiAoYnl0ZXMgPT09IDApIHJldHVybiAnMCBCeXRlcyc7XG5cbiAgICBjb25zdCBrID0gMTAyNDtcbiAgICBjb25zdCBkbSA9IGRlY2ltYWxzIDwgMCA/IDAgOiBkZWNpbWFscztcbiAgICBjb25zdCBzaXplcyA9IFsnQnl0ZXMnLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXTtcblxuICAgIGNvbnN0IGkgPSBNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKTtcblxuICAgIHJldHVybiBwYXJzZUZsb2F0KChieXRlcyAvIE1hdGgucG93KGssIGkpKS50b0ZpeGVkKGRtKSkgKyAnICcgKyBzaXplc1tpXTtcbn1cblxuLyoqXG4gKiBmb3JtYXQgYSBrZXkgaW50byBncm91cHMgb2YgNCBjaGFyYWN0ZXJzLCBmb3IgZWFzaWVyIHZpc3VhbCBpbnNwZWN0aW9uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXkgdG8gZm9ybWF0XG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q3J5cHRvS2V5KGtleSkge1xuICAgIHJldHVybiBrZXkubWF0Y2goLy57MSw0fS9nKS5qb2luKFwiIFwiKTtcbn1cbi8qKlxuICogY2FsY3VsYXRlcyBhIG51bWVyaWMgaGFzaCBmb3IgYSBnaXZlbiBzdHJpbmdcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIHN0cmluZyB0byBoYXNoXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzaENvZGUoc3RyKSB7XG4gICAgbGV0IGhhc2ggPSAwO1xuICAgIGxldCBpO1xuICAgIGxldCBjaHI7XG4gICAgaWYgKHN0ci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hyID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICAgICAgaGFzaCB8PSAwO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5hYnMoaGFzaCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVc2VyTmFtZUNvbG9yQ2xhc3ModXNlcklkKSB7XG4gICAgY29uc3QgY29sb3JOdW1iZXIgPSAoaGFzaENvZGUodXNlcklkKSAlIDgpICsgMTtcbiAgICByZXR1cm4gYG14X1VzZXJuYW1lX2NvbG9yJHtjb2xvck51bWJlcn1gO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB3cml0dGVuIEVuZ2xpc2ggc3RyaW5nIHJlcHJlc2VudGluZyBgaXRlbXNgLCB3aXRoIGFuIG9wdGlvbmFsXG4gKiBsaW1pdCBvbiB0aGUgbnVtYmVyIG9mIGl0ZW1zIGluY2x1ZGVkIGluIHRoZSByZXN1bHQuIElmIHNwZWNpZmllZCBhbmQgaWYgdGhlXG4gKiBsZW5ndGggb2YgYGl0ZW1zYCBpcyBncmVhdGVyIHRoYW4gdGhlIGxpbWl0LCB0aGUgc3RyaW5nIFwiYW5kIG4gb3RoZXJzXCIgd2lsbFxuICogYmUgYXBwZW5kZWQgb250byB0aGUgcmVzdWx0LiBJZiBgaXRlbXNgIGlzIGVtcHR5LCByZXR1cm5zIHRoZSBlbXB0eSBzdHJpbmcuXG4gKiBJZiB0aGVyZSBpcyBvbmx5IG9uZSBpdGVtLCByZXR1cm4gaXQuXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpdGVtcyB0aGUgaXRlbXMgdG8gY29uc3RydWN0IGEgc3RyaW5nIGZyb20uXG4gKiBAcGFyYW0ge251bWJlcj99IGl0ZW1MaW1pdCB0aGUgbnVtYmVyIGJ5IHdoaWNoIHRvIGxpbWl0IHRoZSBsaXN0LlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29uc3RydWN0ZWQgYnkgam9pbmluZyBgaXRlbXNgIHdpdGggYSBjb21tYVxuICogYmV0d2VlbiBlYWNoIGl0ZW0sIGJ1dCB3aXRoIHRoZSBsYXN0IGl0ZW0gYXBwZW5kZWQgYXMgXCIgYW5kIFtsYXN0SXRlbV1cIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbW1hU2VwYXJhdGVkTGlzdChpdGVtcywgaXRlbUxpbWl0KSB7XG4gICAgY29uc3QgcmVtYWluaW5nID0gaXRlbUxpbWl0ID09PSB1bmRlZmluZWQgPyAwIDogTWF0aC5tYXgoXG4gICAgICAgIGl0ZW1zLmxlbmd0aCAtIGl0ZW1MaW1pdCwgMCxcbiAgICApO1xuICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfSBlbHNlIGlmIChpdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGl0ZW1zWzBdO1xuICAgIH0gZWxzZSBpZiAocmVtYWluaW5nID4gMCkge1xuICAgICAgICBpdGVtcyA9IGl0ZW1zLnNsaWNlKDAsIGl0ZW1MaW1pdCk7XG4gICAgICAgIHJldHVybiBfdChcIiUoaXRlbXMpcyBhbmQgJShjb3VudClzIG90aGVyc1wiLCB7IGl0ZW1zOiBpdGVtcy5qb2luKCcsICcpLCBjb3VudDogcmVtYWluaW5nIH0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsYXN0SXRlbSA9IGl0ZW1zLnBvcCgpO1xuICAgICAgICByZXR1cm4gX3QoXCIlKGl0ZW1zKXMgYW5kICUobGFzdEl0ZW0pc1wiLCB7IGl0ZW1zOiBpdGVtcy5qb2luKCcsICcpLCBsYXN0SXRlbTogbGFzdEl0ZW0gfSk7XG4gICAgfVxufVxuIl19