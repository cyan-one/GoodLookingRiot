"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
Copyright 2017 Travis Ralston

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
 * Represents a controller for individual settings to alter the reading behaviour
 * based upon environmental conditions, or to react to changes and therefore update
 * the working environment.
 *
 * This is not intended to replace the functionality of a SettingsHandler, it is only
 * intended to handle environmental factors for specific settings.
 */
class SettingController {
  /**
   * Gets the overridden value for the setting, if any. This must return null if the
   * value is not to be overridden, otherwise it must return the new value.
   * @param {string} level The level at which the value was requested at.
   * @param {String} roomId The room ID, may be null.
   * @param {*} calculatedValue The value that the handlers think the setting should be,
   * may be null.
   * @param {string} calculatedAtLevel The level for which the calculated value was
   * calculated at. May be null.
   * @return {*} The value that should be used, or null if no override is applicable.
   */
  getValueOverride(level, roomId, calculatedValue, calculatedAtLevel) {
    return null; // no override
  }
  /**
   * Called when the setting value has been changed.
   * @param {string} level The level at which the setting has been modified.
   * @param {String} roomId The room ID, may be null.
   * @param {*} newValue The new value for the setting, may be null.
   */


  onChange(level, roomId, newValue) {// do nothing by default
  }

}

exports.default = SettingController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9jb250cm9sbGVycy9TZXR0aW5nQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6WyJTZXR0aW5nQ29udHJvbGxlciIsImdldFZhbHVlT3ZlcnJpZGUiLCJsZXZlbCIsInJvb21JZCIsImNhbGN1bGF0ZWRWYWx1ZSIsImNhbGN1bGF0ZWRBdExldmVsIiwib25DaGFuZ2UiLCJuZXdWYWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOzs7Ozs7OztBQVFlLE1BQU1BLGlCQUFOLENBQXdCO0FBQ25DOzs7Ozs7Ozs7OztBQVdBQyxFQUFBQSxnQkFBZ0IsQ0FBQ0MsS0FBRCxFQUFRQyxNQUFSLEVBQWdCQyxlQUFoQixFQUFpQ0MsaUJBQWpDLEVBQW9EO0FBQ2hFLFdBQU8sSUFBUCxDQURnRSxDQUNuRDtBQUNoQjtBQUVEOzs7Ozs7OztBQU1BQyxFQUFBQSxRQUFRLENBQUNKLEtBQUQsRUFBUUMsTUFBUixFQUFnQkksUUFBaEIsRUFBMEIsQ0FDOUI7QUFDSDs7QUF4QmtDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFRyYXZpcyBSYWxzdG9uXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29udHJvbGxlciBmb3IgaW5kaXZpZHVhbCBzZXR0aW5ncyB0byBhbHRlciB0aGUgcmVhZGluZyBiZWhhdmlvdXJcbiAqIGJhc2VkIHVwb24gZW52aXJvbm1lbnRhbCBjb25kaXRpb25zLCBvciB0byByZWFjdCB0byBjaGFuZ2VzIGFuZCB0aGVyZWZvcmUgdXBkYXRlXG4gKiB0aGUgd29ya2luZyBlbnZpcm9ubWVudC5cbiAqXG4gKiBUaGlzIGlzIG5vdCBpbnRlbmRlZCB0byByZXBsYWNlIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGEgU2V0dGluZ3NIYW5kbGVyLCBpdCBpcyBvbmx5XG4gKiBpbnRlbmRlZCB0byBoYW5kbGUgZW52aXJvbm1lbnRhbCBmYWN0b3JzIGZvciBzcGVjaWZpYyBzZXR0aW5ncy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dGluZ0NvbnRyb2xsZXIge1xuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIG92ZXJyaWRkZW4gdmFsdWUgZm9yIHRoZSBzZXR0aW5nLCBpZiBhbnkuIFRoaXMgbXVzdCByZXR1cm4gbnVsbCBpZiB0aGVcbiAgICAgKiB2YWx1ZSBpcyBub3QgdG8gYmUgb3ZlcnJpZGRlbiwgb3RoZXJ3aXNlIGl0IG11c3QgcmV0dXJuIHRoZSBuZXcgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxldmVsIFRoZSBsZXZlbCBhdCB3aGljaCB0aGUgdmFsdWUgd2FzIHJlcXVlc3RlZCBhdC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vbUlkIFRoZSByb29tIElELCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcGFyYW0geyp9IGNhbGN1bGF0ZWRWYWx1ZSBUaGUgdmFsdWUgdGhhdCB0aGUgaGFuZGxlcnMgdGhpbmsgdGhlIHNldHRpbmcgc2hvdWxkIGJlLFxuICAgICAqIG1heSBiZSBudWxsLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjYWxjdWxhdGVkQXRMZXZlbCBUaGUgbGV2ZWwgZm9yIHdoaWNoIHRoZSBjYWxjdWxhdGVkIHZhbHVlIHdhc1xuICAgICAqIGNhbGN1bGF0ZWQgYXQuIE1heSBiZSBudWxsLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSB0aGF0IHNob3VsZCBiZSB1c2VkLCBvciBudWxsIGlmIG5vIG92ZXJyaWRlIGlzIGFwcGxpY2FibGUuXG4gICAgICovXG4gICAgZ2V0VmFsdWVPdmVycmlkZShsZXZlbCwgcm9vbUlkLCBjYWxjdWxhdGVkVmFsdWUsIGNhbGN1bGF0ZWRBdExldmVsKSB7XG4gICAgICAgIHJldHVybiBudWxsOyAvLyBubyBvdmVycmlkZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBzZXR0aW5nIHZhbHVlIGhhcyBiZWVuIGNoYW5nZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxldmVsIFRoZSBsZXZlbCBhdCB3aGljaCB0aGUgc2V0dGluZyBoYXMgYmVlbiBtb2RpZmllZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vbUlkIFRoZSByb29tIElELCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcGFyYW0geyp9IG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgZm9yIHRoZSBzZXR0aW5nLCBtYXkgYmUgbnVsbC5cbiAgICAgKi9cbiAgICBvbkNoYW5nZShsZXZlbCwgcm9vbUlkLCBuZXdWYWx1ZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nIGJ5IGRlZmF1bHRcbiAgICB9XG59XG4iXX0=