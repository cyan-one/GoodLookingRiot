"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _PlatformPeg = _interopRequireDefault(require("../PlatformPeg"));

var _EventIndex = _interopRequireDefault(require("../indexing/EventIndex"));

var _SettingsStore = _interopRequireWildcard(require("../settings/SettingsStore"));

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

/*
 * Object holding the global EventIndex object. Can only be initialized if the
 * platform supports event indexing.
 */
class EventIndexPeg {
  constructor() {
    this.index = null;
    this._supportIsInstalled = false;
  }
  /**
   * Initialize the EventIndexPeg and if event indexing is enabled initialize
   * the event index.
   *
   * @return {Promise<boolean>} A promise that will resolve to true if an
   * EventIndex was successfully initialized, false otherwise.
   */


  async init() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    if (!indexManager) {
      console.log("EventIndex: Platform doesn't support event indexing, not initializing.");
      return false;
    }

    this._supportIsInstalled = await indexManager.supportsEventIndexing();

    if (!this.supportIsInstalled()) {
      console.log("EventIndex: Event indexing isn't installed for the platform, not initializing.");
      return false;
    }

    if (!_SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, 'enableEventIndexing')) {
      console.log("EventIndex: Event indexing is disabled, not initializing");
      return false;
    }

    return this.initEventIndex();
  }
  /**
   * Initialize the event index.
   *
   * @returns {boolean} True if the event index was succesfully initialized,
   * false otherwise.
   */


  async initEventIndex() {
    const index = new _EventIndex.default();

    try {
      await index.init();
    } catch (e) {
      console.log("EventIndex: Error initializing the event index", e);
      return false;
    }

    this.index = index;
    return true;
  }
  /**
   * Check if the current platform has support for event indexing.
   *
   * @return {boolean} True if it has support, false otherwise. Note that this
   * does not mean that support is installed.
   */


  platformHasSupport()
  /*: boolean*/
  {
    return _PlatformPeg.default.get().getEventIndexingManager() !== null;
  }
  /**
   * Check if event indexing support is installed for the platfrom.
   *
   * Event indexing might require additional optional modules to be installed,
   * this tells us if those are installed. Note that this should only be
   * called after the init() method was called.
   *
   * @return {boolean} True if support is installed, false otherwise.
   */


  supportIsInstalled()
  /*: boolean*/
  {
    return this._supportIsInstalled;
  }
  /**
   * Get the current event index.
   *
   * @return {EventIndex} The current event index.
   */


  get() {
    return this.index;
  }

  start() {
    if (this.index === null) return;
    this.index.startCrawler();
  }

  stop() {
    if (this.index === null) return;
    this.index.stopCrawler();
  }
  /**
   * Unset our event store
   *
   * After a call to this the init() method will need to be called again.
   *
   * @return {Promise} A promise that will resolve once the event index is
   * closed.
   */


  async unset() {
    if (this.index === null) return;
    await this.index.close();
    this.index = null;
  }
  /**
   * Delete our event indexer.
   *
   * After a call to this the init() method will need to be called again.
   *
   * @return {Promise} A promise that will resolve once the event index is
   * deleted.
   */


  async deleteEventIndex() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    if (indexManager !== null) {
      await this.unset();
      console.log("EventIndex: Deleting event index.");
      await indexManager.deleteEventIndex();
    }
  }

}

if (!global.mxEventIndexPeg) {
  global.mxEventIndexPeg = new EventIndexPeg();
}

var _default = global.mxEventIndexPeg;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmRleGluZy9FdmVudEluZGV4UGVnLmpzIl0sIm5hbWVzIjpbIkV2ZW50SW5kZXhQZWciLCJjb25zdHJ1Y3RvciIsImluZGV4IiwiX3N1cHBvcnRJc0luc3RhbGxlZCIsImluaXQiLCJpbmRleE1hbmFnZXIiLCJQbGF0Zm9ybVBlZyIsImdldCIsImdldEV2ZW50SW5kZXhpbmdNYW5hZ2VyIiwiY29uc29sZSIsImxvZyIsInN1cHBvcnRzRXZlbnRJbmRleGluZyIsInN1cHBvcnRJc0luc3RhbGxlZCIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZUF0IiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwiaW5pdEV2ZW50SW5kZXgiLCJFdmVudEluZGV4IiwiZSIsInBsYXRmb3JtSGFzU3VwcG9ydCIsInN0YXJ0Iiwic3RhcnRDcmF3bGVyIiwic3RvcCIsInN0b3BDcmF3bGVyIiwidW5zZXQiLCJjbG9zZSIsImRlbGV0ZUV2ZW50SW5kZXgiLCJnbG9iYWwiLCJteEV2ZW50SW5kZXhQZWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBcUJBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7OztBQVNBLE1BQU1BLGFBQU4sQ0FBb0I7QUFDaEJDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLEtBQUwsR0FBYSxJQUFiO0FBQ0EsU0FBS0MsbUJBQUwsR0FBMkIsS0FBM0I7QUFDSDtBQUVEOzs7Ozs7Ozs7QUFPQSxRQUFNQyxJQUFOLEdBQWE7QUFDVCxVQUFNQyxZQUFZLEdBQUdDLHFCQUFZQyxHQUFaLEdBQWtCQyx1QkFBbEIsRUFBckI7O0FBQ0EsUUFBSSxDQUFDSCxZQUFMLEVBQW1CO0FBQ2ZJLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLHdFQUFaO0FBQ0EsYUFBTyxLQUFQO0FBQ0g7O0FBRUQsU0FBS1AsbUJBQUwsR0FBMkIsTUFBTUUsWUFBWSxDQUFDTSxxQkFBYixFQUFqQzs7QUFFQSxRQUFJLENBQUMsS0FBS0Msa0JBQUwsRUFBTCxFQUFnQztBQUM1QkgsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksZ0ZBQVo7QUFDQSxhQUFPLEtBQVA7QUFDSDs7QUFFRCxRQUFJLENBQUNHLHVCQUFjQyxVQUFkLENBQXlCQyw0QkFBYUMsTUFBdEMsRUFBOEMscUJBQTlDLENBQUwsRUFBMkU7QUFDdkVQLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDBEQUFaO0FBQ0EsYUFBTyxLQUFQO0FBQ0g7O0FBRUQsV0FBTyxLQUFLTyxjQUFMLEVBQVA7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLFFBQU1BLGNBQU4sR0FBdUI7QUFDbkIsVUFBTWYsS0FBSyxHQUFHLElBQUlnQixtQkFBSixFQUFkOztBQUVBLFFBQUk7QUFDQSxZQUFNaEIsS0FBSyxDQUFDRSxJQUFOLEVBQU47QUFDSCxLQUZELENBRUUsT0FBT2UsQ0FBUCxFQUFVO0FBQ1JWLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdEQUFaLEVBQThEUyxDQUE5RDtBQUNBLGFBQU8sS0FBUDtBQUNIOztBQUVELFNBQUtqQixLQUFMLEdBQWFBLEtBQWI7QUFFQSxXQUFPLElBQVA7QUFDSDtBQUVEOzs7Ozs7OztBQU1Ba0IsRUFBQUEsa0JBQWtCO0FBQUE7QUFBWTtBQUMxQixXQUFPZCxxQkFBWUMsR0FBWixHQUFrQkMsdUJBQWxCLE9BQWdELElBQXZEO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7QUFTQUksRUFBQUEsa0JBQWtCO0FBQUE7QUFBWTtBQUMxQixXQUFPLEtBQUtULG1CQUFaO0FBQ0g7QUFFRDs7Ozs7OztBQUtBSSxFQUFBQSxHQUFHLEdBQUc7QUFDRixXQUFPLEtBQUtMLEtBQVo7QUFDSDs7QUFFRG1CLEVBQUFBLEtBQUssR0FBRztBQUNKLFFBQUksS0FBS25CLEtBQUwsS0FBZSxJQUFuQixFQUF5QjtBQUN6QixTQUFLQSxLQUFMLENBQVdvQixZQUFYO0FBQ0g7O0FBRURDLEVBQUFBLElBQUksR0FBRztBQUNILFFBQUksS0FBS3JCLEtBQUwsS0FBZSxJQUFuQixFQUF5QjtBQUN6QixTQUFLQSxLQUFMLENBQVdzQixXQUFYO0FBQ0g7QUFFRDs7Ozs7Ozs7OztBQVFBLFFBQU1DLEtBQU4sR0FBYztBQUNWLFFBQUksS0FBS3ZCLEtBQUwsS0FBZSxJQUFuQixFQUF5QjtBQUN6QixVQUFNLEtBQUtBLEtBQUwsQ0FBV3dCLEtBQVgsRUFBTjtBQUNBLFNBQUt4QixLQUFMLEdBQWEsSUFBYjtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7QUFRQSxRQUFNeUIsZ0JBQU4sR0FBeUI7QUFDckIsVUFBTXRCLFlBQVksR0FBR0MscUJBQVlDLEdBQVosR0FBa0JDLHVCQUFsQixFQUFyQjs7QUFFQSxRQUFJSCxZQUFZLEtBQUssSUFBckIsRUFBMkI7QUFDdkIsWUFBTSxLQUFLb0IsS0FBTCxFQUFOO0FBQ0FoQixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQ0FBWjtBQUNBLFlBQU1MLFlBQVksQ0FBQ3NCLGdCQUFiLEVBQU47QUFDSDtBQUNKOztBQWhJZTs7QUFtSXBCLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxlQUFaLEVBQTZCO0FBQ3pCRCxFQUFBQSxNQUFNLENBQUNDLGVBQVAsR0FBeUIsSUFBSTdCLGFBQUosRUFBekI7QUFDSDs7ZUFDYzRCLE1BQU0sQ0FBQ0MsZSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qXG4gKiBPYmplY3QgaG9sZGluZyB0aGUgZ2xvYmFsIEV2ZW50SW5kZXggb2JqZWN0LiBDYW4gb25seSBiZSBpbml0aWFsaXplZCBpZiB0aGVcbiAqIHBsYXRmb3JtIHN1cHBvcnRzIGV2ZW50IGluZGV4aW5nLlxuICovXG5cbmltcG9ydCBQbGF0Zm9ybVBlZyBmcm9tIFwiLi4vUGxhdGZvcm1QZWdcIjtcbmltcG9ydCBFdmVudEluZGV4IGZyb20gXCIuLi9pbmRleGluZy9FdmVudEluZGV4XCI7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSAnLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5cbmNsYXNzIEV2ZW50SW5kZXhQZWcge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluZGV4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3VwcG9ydElzSW5zdGFsbGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSB0aGUgRXZlbnRJbmRleFBlZyBhbmQgaWYgZXZlbnQgaW5kZXhpbmcgaXMgZW5hYmxlZCBpbml0aWFsaXplXG4gICAgICogdGhlIGV2ZW50IGluZGV4LlxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gQSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlIHRvIHRydWUgaWYgYW5cbiAgICAgKiBFdmVudEluZGV4IHdhcyBzdWNjZXNzZnVsbHkgaW5pdGlhbGl6ZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBpbmRleE1hbmFnZXIgPSBQbGF0Zm9ybVBlZy5nZXQoKS5nZXRFdmVudEluZGV4aW5nTWFuYWdlcigpO1xuICAgICAgICBpZiAoIWluZGV4TWFuYWdlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBQbGF0Zm9ybSBkb2Vzbid0IHN1cHBvcnQgZXZlbnQgaW5kZXhpbmcsIG5vdCBpbml0aWFsaXppbmcuXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3VwcG9ydElzSW5zdGFsbGVkID0gYXdhaXQgaW5kZXhNYW5hZ2VyLnN1cHBvcnRzRXZlbnRJbmRleGluZygpO1xuXG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0SXNJbnN0YWxsZWQoKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBFdmVudCBpbmRleGluZyBpc24ndCBpbnN0YWxsZWQgZm9yIHRoZSBwbGF0Zm9ybSwgbm90IGluaXRpYWxpemluZy5cIik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChTZXR0aW5nTGV2ZWwuREVWSUNFLCAnZW5hYmxlRXZlbnRJbmRleGluZycpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IEV2ZW50IGluZGV4aW5nIGlzIGRpc2FibGVkLCBub3QgaW5pdGlhbGl6aW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdEV2ZW50SW5kZXgoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIHRoZSBldmVudCBpbmRleC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBldmVudCBpbmRleCB3YXMgc3VjY2VzZnVsbHkgaW5pdGlhbGl6ZWQsXG4gICAgICogZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGFzeW5jIGluaXRFdmVudEluZGV4KCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IG5ldyBFdmVudEluZGV4KCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGluZGV4LmluaXQoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBFcnJvciBpbml0aWFsaXppbmcgdGhlIGV2ZW50IGluZGV4XCIsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjdXJyZW50IHBsYXRmb3JtIGhhcyBzdXBwb3J0IGZvciBldmVudCBpbmRleGluZy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgaXQgaGFzIHN1cHBvcnQsIGZhbHNlIG90aGVyd2lzZS4gTm90ZSB0aGF0IHRoaXNcbiAgICAgKiBkb2VzIG5vdCBtZWFuIHRoYXQgc3VwcG9ydCBpcyBpbnN0YWxsZWQuXG4gICAgICovXG4gICAgcGxhdGZvcm1IYXNTdXBwb3J0KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKSAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBldmVudCBpbmRleGluZyBzdXBwb3J0IGlzIGluc3RhbGxlZCBmb3IgdGhlIHBsYXRmcm9tLlxuICAgICAqXG4gICAgICogRXZlbnQgaW5kZXhpbmcgbWlnaHQgcmVxdWlyZSBhZGRpdGlvbmFsIG9wdGlvbmFsIG1vZHVsZXMgdG8gYmUgaW5zdGFsbGVkLFxuICAgICAqIHRoaXMgdGVsbHMgdXMgaWYgdGhvc2UgYXJlIGluc3RhbGxlZC4gTm90ZSB0aGF0IHRoaXMgc2hvdWxkIG9ubHkgYmVcbiAgICAgKiBjYWxsZWQgYWZ0ZXIgdGhlIGluaXQoKSBtZXRob2Qgd2FzIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgc3VwcG9ydCBpcyBpbnN0YWxsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBzdXBwb3J0SXNJbnN0YWxsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBwb3J0SXNJbnN0YWxsZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IGV2ZW50IGluZGV4LlxuICAgICAqXG4gICAgICogQHJldHVybiB7RXZlbnRJbmRleH0gVGhlIGN1cnJlbnQgZXZlbnQgaW5kZXguXG4gICAgICovXG4gICAgZ2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmRleDtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgdGhpcy5pbmRleC5zdGFydENyYXdsZXIoKTtcbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB0aGlzLmluZGV4LnN0b3BDcmF3bGVyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5zZXQgb3VyIGV2ZW50IHN0b3JlXG4gICAgICpcbiAgICAgKiBBZnRlciBhIGNhbGwgdG8gdGhpcyB0aGUgaW5pdCgpIG1ldGhvZCB3aWxsIG5lZWQgdG8gYmUgY2FsbGVkIGFnYWluLlxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gQSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlIG9uY2UgdGhlIGV2ZW50IGluZGV4IGlzXG4gICAgICogY2xvc2VkLlxuICAgICAqL1xuICAgIGFzeW5jIHVuc2V0KCkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBhd2FpdCB0aGlzLmluZGV4LmNsb3NlKCk7XG4gICAgICAgIHRoaXMuaW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBvdXIgZXZlbnQgaW5kZXhlci5cbiAgICAgKlxuICAgICAqIEFmdGVyIGEgY2FsbCB0byB0aGlzIHRoZSBpbml0KCkgbWV0aG9kIHdpbGwgbmVlZCB0byBiZSBjYWxsZWQgYWdhaW4uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBBIHByb21pc2UgdGhhdCB3aWxsIHJlc29sdmUgb25jZSB0aGUgZXZlbnQgaW5kZXggaXNcbiAgICAgKiBkZWxldGVkLlxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZUV2ZW50SW5kZXgoKSB7XG4gICAgICAgIGNvbnN0IGluZGV4TWFuYWdlciA9IFBsYXRmb3JtUGVnLmdldCgpLmdldEV2ZW50SW5kZXhpbmdNYW5hZ2VyKCk7XG5cbiAgICAgICAgaWYgKGluZGV4TWFuYWdlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bnNldCgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBEZWxldGluZyBldmVudCBpbmRleC5cIik7XG4gICAgICAgICAgICBhd2FpdCBpbmRleE1hbmFnZXIuZGVsZXRlRXZlbnRJbmRleCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pZiAoIWdsb2JhbC5teEV2ZW50SW5kZXhQZWcpIHtcbiAgICBnbG9iYWwubXhFdmVudEluZGV4UGVnID0gbmV3IEV2ZW50SW5kZXhQZWcoKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGdsb2JhbC5teEV2ZW50SW5kZXhQZWc7XG4iXX0=