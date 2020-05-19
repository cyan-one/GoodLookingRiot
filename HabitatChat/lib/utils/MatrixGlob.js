"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MatrixGlob = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _globToRegexp = _interopRequireDefault(require("glob-to-regexp"));

/*
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
// Taken with permission from matrix-bot-sdk:
// https://github.com/turt2live/matrix-js-bot-sdk/blob/eb148c2ecec7bf3ade801d73deb43df042d55aef/src/MatrixGlob.ts

/**
 * Represents a common Matrix glob. This is commonly used
 * for server ACLs and similar functions.
 */
class MatrixGlob {
  /**
   * Creates a new Matrix Glob
   * @param {string} glob The glob to convert. Eg: "*.example.org"
   */
  constructor(glob
  /*: string*/
  ) {
    (0, _defineProperty2.default)(this, "_regex", void 0);
    const globRegex = (0, _globToRegexp.default)(glob, {
      extended: false,
      globstar: false
    }); // We need to convert `?` manually because globToRegexp's extended mode
    // does more than we want it to.

    const replaced = globRegex.toString().replace(/\\\?/g, ".");
    this._regex = new RegExp(replaced.substring(1, replaced.length - 1));
  }
  /**
   * Tests the glob against a value, returning true if it matches.
   * @param {string} val The value to test.
   * @returns {boolean} True if the value matches the glob, false otherwise.
   */


  test(val
  /*: string*/
  )
  /*: boolean*/
  {
    return this._regex.test(val);
  }

}

exports.MatrixGlob = MatrixGlob;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9NYXRyaXhHbG9iLmpzIl0sIm5hbWVzIjpbIk1hdHJpeEdsb2IiLCJjb25zdHJ1Y3RvciIsImdsb2IiLCJnbG9iUmVnZXgiLCJleHRlbmRlZCIsImdsb2JzdGFyIiwicmVwbGFjZWQiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJfcmVnZXgiLCJSZWdFeHAiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJ0ZXN0IiwidmFsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFoQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTtBQUNBOztBQUVBOzs7O0FBSU8sTUFBTUEsVUFBTixDQUFpQjtBQUdwQjs7OztBQUlBQyxFQUFBQSxXQUFXLENBQUNDO0FBQUQ7QUFBQSxJQUFlO0FBQUE7QUFDdEIsVUFBTUMsU0FBUyxHQUFHLDJCQUFhRCxJQUFiLEVBQW1CO0FBQ2pDRSxNQUFBQSxRQUFRLEVBQUUsS0FEdUI7QUFFakNDLE1BQUFBLFFBQVEsRUFBRTtBQUZ1QixLQUFuQixDQUFsQixDQURzQixDQU10QjtBQUNBOztBQUNBLFVBQU1DLFFBQVEsR0FBR0gsU0FBUyxDQUFDSSxRQUFWLEdBQXFCQyxPQUFyQixDQUE2QixPQUE3QixFQUFzQyxHQUF0QyxDQUFqQjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxNQUFKLENBQVdKLFFBQVEsQ0FBQ0ssU0FBVCxDQUFtQixDQUFuQixFQUFzQkwsUUFBUSxDQUFDTSxNQUFULEdBQWtCLENBQXhDLENBQVgsQ0FBZDtBQUNIO0FBRUQ7Ozs7Ozs7QUFLQUMsRUFBQUEsSUFBSSxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUF1QjtBQUN2QixXQUFPLEtBQUtMLE1BQUwsQ0FBWUksSUFBWixDQUFpQkMsR0FBakIsQ0FBUDtBQUNIOztBQTFCbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgZ2xvYlRvUmVnZXhwIGZyb20gXCJnbG9iLXRvLXJlZ2V4cFwiO1xuXG4vLyBUYWtlbiB3aXRoIHBlcm1pc3Npb24gZnJvbSBtYXRyaXgtYm90LXNkazpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90dXJ0MmxpdmUvbWF0cml4LWpzLWJvdC1zZGsvYmxvYi9lYjE0OGMyZWNlYzdiZjNhZGU4MDFkNzNkZWI0M2RmMDQyZDU1YWVmL3NyYy9NYXRyaXhHbG9iLnRzXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbW1vbiBNYXRyaXggZ2xvYi4gVGhpcyBpcyBjb21tb25seSB1c2VkXG4gKiBmb3Igc2VydmVyIEFDTHMgYW5kIHNpbWlsYXIgZnVuY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgTWF0cml4R2xvYiB7XG4gICAgX3JlZ2V4OiBSZWdFeHA7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IE1hdHJpeCBHbG9iXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdsb2IgVGhlIGdsb2IgdG8gY29udmVydC4gRWc6IFwiKi5leGFtcGxlLm9yZ1wiXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZ2xvYjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGdsb2JSZWdleCA9IGdsb2JUb1JlZ2V4cChnbG9iLCB7XG4gICAgICAgICAgICBleHRlbmRlZDogZmFsc2UsXG4gICAgICAgICAgICBnbG9ic3RhcjogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gY29udmVydCBgP2AgbWFudWFsbHkgYmVjYXVzZSBnbG9iVG9SZWdleHAncyBleHRlbmRlZCBtb2RlXG4gICAgICAgIC8vIGRvZXMgbW9yZSB0aGFuIHdlIHdhbnQgaXQgdG8uXG4gICAgICAgIGNvbnN0IHJlcGxhY2VkID0gZ2xvYlJlZ2V4LnRvU3RyaW5nKCkucmVwbGFjZSgvXFxcXFxcPy9nLCBcIi5cIik7XG4gICAgICAgIHRoaXMuX3JlZ2V4ID0gbmV3IFJlZ0V4cChyZXBsYWNlZC5zdWJzdHJpbmcoMSwgcmVwbGFjZWQubGVuZ3RoIC0gMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHRoZSBnbG9iIGFnYWluc3QgYSB2YWx1ZSwgcmV0dXJuaW5nIHRydWUgaWYgaXQgbWF0Y2hlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSBnbG9iLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgdGVzdCh2YWw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnZXgudGVzdCh2YWwpO1xuICAgIH1cbn1cbiJdfQ==