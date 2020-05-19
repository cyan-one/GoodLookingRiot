"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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
 * Represents the base class for all level handlers. This class performs no logic
 * and should be overridden.
 */
class SettingsHandler {
  /**
   * Gets the value for a particular setting at this level for a particular room.
   * If no room is applicable, the roomId may be null. The roomId may not be
   * applicable to this level and may be ignored by the handler.
   * @param {string} settingName The name of the setting.
   * @param {String} roomId The room ID to read from, may be null.
   * @returns {*} The setting value, or null if not found.
   */
  getValue(settingName, roomId) {
    console.error("Invalid operation: getValue was not overridden");
    return null;
  }
  /**
   * Sets the value for a particular setting at this level for a particular room.
   * If no room is applicable, the roomId may be null. The roomId may not be
   * applicable to this level and may be ignored by the handler. Setting a value
   * to null will cause the level to remove the value. The current user should be
   * able to set the value prior to calling this.
   * @param {string} settingName The name of the setting to change.
   * @param {String} roomId The room ID to set the value in, may be null.
   * @param {*} newValue The new value for the setting, may be null.
   * @returns {Promise} Resolves when the setting has been saved.
   */


  setValue(settingName, roomId, newValue) {
    console.error("Invalid operation: setValue was not overridden");
    return Promise.reject();
  }
  /**
   * Determines if the current user is able to set the value of the given setting
   * in the given room at this level.
   * @param {string} settingName The name of the setting to check.
   * @param {String} roomId The room ID to check in, may be null
   * @returns {boolean} True if the setting can be set by the user, false otherwise.
   */


  canSetValue(settingName, roomId) {
    return false;
  }
  /**
   * Determines if this level is supported on this device.
   * @returns {boolean} True if this level is supported on the current device.
   */


  isSupported() {
    return false;
  }

}

exports.default = SettingsHandler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9oYW5kbGVycy9TZXR0aW5nc0hhbmRsZXIuanMiXSwibmFtZXMiOlsiU2V0dGluZ3NIYW5kbGVyIiwiZ2V0VmFsdWUiLCJzZXR0aW5nTmFtZSIsInJvb21JZCIsImNvbnNvbGUiLCJlcnJvciIsInNldFZhbHVlIiwibmV3VmFsdWUiLCJQcm9taXNlIiwicmVqZWN0IiwiY2FuU2V0VmFsdWUiLCJpc1N1cHBvcnRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7OztBQUllLE1BQU1BLGVBQU4sQ0FBc0I7QUFDakM7Ozs7Ozs7O0FBUUFDLEVBQUFBLFFBQVEsQ0FBQ0MsV0FBRCxFQUFjQyxNQUFkLEVBQXNCO0FBQzFCQyxJQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxnREFBZDtBQUNBLFdBQU8sSUFBUDtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7Ozs7QUFXQUMsRUFBQUEsUUFBUSxDQUFDSixXQUFELEVBQWNDLE1BQWQsRUFBc0JJLFFBQXRCLEVBQWdDO0FBQ3BDSCxJQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxnREFBZDtBQUNBLFdBQU9HLE9BQU8sQ0FBQ0MsTUFBUixFQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7O0FBT0FDLEVBQUFBLFdBQVcsQ0FBQ1IsV0FBRCxFQUFjQyxNQUFkLEVBQXNCO0FBQzdCLFdBQU8sS0FBUDtBQUNIO0FBRUQ7Ozs7OztBQUlBUSxFQUFBQSxXQUFXLEdBQUc7QUFDVixXQUFPLEtBQVA7QUFDSDs7QUEvQ2dDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFRyYXZpcyBSYWxzdG9uXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZC5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBsZXZlbCBoYW5kbGVycy4gVGhpcyBjbGFzcyBwZXJmb3JtcyBubyBsb2dpY1xuICogYW5kIHNob3VsZCBiZSBvdmVycmlkZGVuLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXR0aW5nc0hhbmRsZXIge1xuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHZhbHVlIGZvciBhIHBhcnRpY3VsYXIgc2V0dGluZyBhdCB0aGlzIGxldmVsIGZvciBhIHBhcnRpY3VsYXIgcm9vbS5cbiAgICAgKiBJZiBubyByb29tIGlzIGFwcGxpY2FibGUsIHRoZSByb29tSWQgbWF5IGJlIG51bGwuIFRoZSByb29tSWQgbWF5IG5vdCBiZVxuICAgICAqIGFwcGxpY2FibGUgdG8gdGhpcyBsZXZlbCBhbmQgbWF5IGJlIGlnbm9yZWQgYnkgdGhlIGhhbmRsZXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdOYW1lIFRoZSBuYW1lIG9mIHRoZSBzZXR0aW5nLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gcmVhZCBmcm9tLCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gVGhlIHNldHRpbmcgdmFsdWUsIG9yIG51bGwgaWYgbm90IGZvdW5kLlxuICAgICAqL1xuICAgIGdldFZhbHVlKHNldHRpbmdOYW1lLCByb29tSWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgb3BlcmF0aW9uOiBnZXRWYWx1ZSB3YXMgbm90IG92ZXJyaWRkZW5cIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHZhbHVlIGZvciBhIHBhcnRpY3VsYXIgc2V0dGluZyBhdCB0aGlzIGxldmVsIGZvciBhIHBhcnRpY3VsYXIgcm9vbS5cbiAgICAgKiBJZiBubyByb29tIGlzIGFwcGxpY2FibGUsIHRoZSByb29tSWQgbWF5IGJlIG51bGwuIFRoZSByb29tSWQgbWF5IG5vdCBiZVxuICAgICAqIGFwcGxpY2FibGUgdG8gdGhpcyBsZXZlbCBhbmQgbWF5IGJlIGlnbm9yZWQgYnkgdGhlIGhhbmRsZXIuIFNldHRpbmcgYSB2YWx1ZVxuICAgICAqIHRvIG51bGwgd2lsbCBjYXVzZSB0aGUgbGV2ZWwgdG8gcmVtb3ZlIHRoZSB2YWx1ZS4gVGhlIGN1cnJlbnQgdXNlciBzaG91bGQgYmVcbiAgICAgKiBhYmxlIHRvIHNldCB0aGUgdmFsdWUgcHJpb3IgdG8gY2FsbGluZyB0aGlzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2V0dGluZyB0byBjaGFuZ2UuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJvb21JZCBUaGUgcm9vbSBJRCB0byBzZXQgdGhlIHZhbHVlIGluLCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcGFyYW0geyp9IG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgZm9yIHRoZSBzZXR0aW5nLCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiB0aGUgc2V0dGluZyBoYXMgYmVlbiBzYXZlZC5cbiAgICAgKi9cbiAgICBzZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBvcGVyYXRpb246IHNldFZhbHVlIHdhcyBub3Qgb3ZlcnJpZGRlblwiKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgY3VycmVudCB1c2VyIGlzIGFibGUgdG8gc2V0IHRoZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gc2V0dGluZ1xuICAgICAqIGluIHRoZSBnaXZlbiByb29tIGF0IHRoaXMgbGV2ZWwuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdOYW1lIFRoZSBuYW1lIG9mIHRoZSBzZXR0aW5nIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gY2hlY2sgaW4sIG1heSBiZSBudWxsXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHNldHRpbmcgY2FuIGJlIHNldCBieSB0aGUgdXNlciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGNhblNldFZhbHVlKHNldHRpbmdOYW1lLCByb29tSWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgdGhpcyBsZXZlbCBpcyBzdXBwb3J0ZWQgb24gdGhpcyBkZXZpY2UuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhpcyBsZXZlbCBpcyBzdXBwb3J0ZWQgb24gdGhlIGN1cnJlbnQgZGV2aWNlLlxuICAgICAqL1xuICAgIGlzU3VwcG9ydGVkKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuIl19