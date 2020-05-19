"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _SettingsHandler = _interopRequireDefault(require("./SettingsHandler"));

/*
Copyright 2017 Travis Ralston
Copyright 2019 New Vector Ltd.

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
 * Gets settings at the "default" level. This handler does not support setting values.
 * This handler does not make use of the roomId parameter.
 */
class DefaultSettingsHandler extends _SettingsHandler.default {
  /**
   * Creates a new default settings handler with the given defaults
   * @param {object} defaults The default setting values, keyed by setting name.
   * @param {object} invertedDefaults The default inverted setting values, keyed by setting name.
   */
  constructor(defaults, invertedDefaults) {
    super();
    this._defaults = defaults;
    this._invertedDefaults = invertedDefaults;
  }

  getValue(settingName, roomId) {
    let value = this._defaults[settingName];

    if (value === undefined) {
      value = this._invertedDefaults[settingName];
    }

    return value;
  }

  setValue(settingName, roomId, newValue) {
    throw new Error("Cannot set values on the default level handler");
  }

  canSetValue(settingName, roomId) {
    return false;
  }

  isSupported() {
    return true;
  }

}

exports.default = DefaultSettingsHandler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9oYW5kbGVycy9EZWZhdWx0U2V0dGluZ3NIYW5kbGVyLmpzIl0sIm5hbWVzIjpbIkRlZmF1bHRTZXR0aW5nc0hhbmRsZXIiLCJTZXR0aW5nc0hhbmRsZXIiLCJjb25zdHJ1Y3RvciIsImRlZmF1bHRzIiwiaW52ZXJ0ZWREZWZhdWx0cyIsIl9kZWZhdWx0cyIsIl9pbnZlcnRlZERlZmF1bHRzIiwiZ2V0VmFsdWUiLCJzZXR0aW5nTmFtZSIsInJvb21JZCIsInZhbHVlIiwidW5kZWZpbmVkIiwic2V0VmFsdWUiLCJuZXdWYWx1ZSIsIkVycm9yIiwiY2FuU2V0VmFsdWUiLCJpc1N1cHBvcnRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBaUJBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7Ozs7QUFJZSxNQUFNQSxzQkFBTixTQUFxQ0Msd0JBQXJDLENBQXFEO0FBQ2hFOzs7OztBQUtBQyxFQUFBQSxXQUFXLENBQUNDLFFBQUQsRUFBV0MsZ0JBQVgsRUFBNkI7QUFDcEM7QUFDQSxTQUFLQyxTQUFMLEdBQWlCRixRQUFqQjtBQUNBLFNBQUtHLGlCQUFMLEdBQXlCRixnQkFBekI7QUFDSDs7QUFFREcsRUFBQUEsUUFBUSxDQUFDQyxXQUFELEVBQWNDLE1BQWQsRUFBc0I7QUFDMUIsUUFBSUMsS0FBSyxHQUFHLEtBQUtMLFNBQUwsQ0FBZUcsV0FBZixDQUFaOztBQUNBLFFBQUlFLEtBQUssS0FBS0MsU0FBZCxFQUF5QjtBQUNyQkQsTUFBQUEsS0FBSyxHQUFHLEtBQUtKLGlCQUFMLENBQXVCRSxXQUF2QixDQUFSO0FBQ0g7O0FBQ0QsV0FBT0UsS0FBUDtBQUNIOztBQUVERSxFQUFBQSxRQUFRLENBQUNKLFdBQUQsRUFBY0MsTUFBZCxFQUFzQkksUUFBdEIsRUFBZ0M7QUFDcEMsVUFBTSxJQUFJQyxLQUFKLENBQVUsZ0RBQVYsQ0FBTjtBQUNIOztBQUVEQyxFQUFBQSxXQUFXLENBQUNQLFdBQUQsRUFBY0MsTUFBZCxFQUFzQjtBQUM3QixXQUFPLEtBQVA7QUFDSDs7QUFFRE8sRUFBQUEsV0FBVyxHQUFHO0FBQ1YsV0FBTyxJQUFQO0FBQ0g7O0FBOUIrRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBUcmF2aXMgUmFsc3RvblxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFNldHRpbmdzSGFuZGxlciBmcm9tIFwiLi9TZXR0aW5nc0hhbmRsZXJcIjtcblxuLyoqXG4gKiBHZXRzIHNldHRpbmdzIGF0IHRoZSBcImRlZmF1bHRcIiBsZXZlbC4gVGhpcyBoYW5kbGVyIGRvZXMgbm90IHN1cHBvcnQgc2V0dGluZyB2YWx1ZXMuXG4gKiBUaGlzIGhhbmRsZXIgZG9lcyBub3QgbWFrZSB1c2Ugb2YgdGhlIHJvb21JZCBwYXJhbWV0ZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlZmF1bHRTZXR0aW5nc0hhbmRsZXIgZXh0ZW5kcyBTZXR0aW5nc0hhbmRsZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgZGVmYXVsdCBzZXR0aW5ncyBoYW5kbGVyIHdpdGggdGhlIGdpdmVuIGRlZmF1bHRzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRlZmF1bHRzIFRoZSBkZWZhdWx0IHNldHRpbmcgdmFsdWVzLCBrZXllZCBieSBzZXR0aW5nIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGludmVydGVkRGVmYXVsdHMgVGhlIGRlZmF1bHQgaW52ZXJ0ZWQgc2V0dGluZyB2YWx1ZXMsIGtleWVkIGJ5IHNldHRpbmcgbmFtZS5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgaW52ZXJ0ZWREZWZhdWx0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9kZWZhdWx0cyA9IGRlZmF1bHRzO1xuICAgICAgICB0aGlzLl9pbnZlcnRlZERlZmF1bHRzID0gaW52ZXJ0ZWREZWZhdWx0cztcbiAgICB9XG5cbiAgICBnZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuX2RlZmF1bHRzW3NldHRpbmdOYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5faW52ZXJ0ZWREZWZhdWx0c1tzZXR0aW5nTmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHNldFZhbHVlKHNldHRpbmdOYW1lLCByb29tSWQsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzZXQgdmFsdWVzIG9uIHRoZSBkZWZhdWx0IGxldmVsIGhhbmRsZXJcIik7XG4gICAgfVxuXG4gICAgY2FuU2V0VmFsdWUoc2V0dGluZ05hbWUsIHJvb21JZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaXNTdXBwb3J0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbiJdfQ==