"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DecryptionFailureTracker = exports.DecryptionFailure = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/*
Copyright 2018 New Vector Ltd

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
class DecryptionFailure {
  constructor(failedEventId, errorCode) {
    this.failedEventId = failedEventId;
    this.errorCode = errorCode;
    this.ts = Date.now();
  }

}

exports.DecryptionFailure = DecryptionFailure;

class DecryptionFailureTracker {
  // Array of items of type DecryptionFailure. Every `CHECK_INTERVAL_MS`, this list
  // is checked for failures that happened > `GRACE_PERIOD_MS` ago. Those that did
  // are accumulated in `failureCounts`.
  // A histogram of the number of failures that will be tracked at the next tracking
  // interval, split by failure error code.
  // Event IDs of failures that were tracked previously
  // Set to an interval ID when `start` is called
  // Spread the load on `Analytics` by tracking at a low frequency, `TRACK_INTERVAL_MS`.
  // Call `checkFailures` every `CHECK_INTERVAL_MS`.
  // Give events a chance to be decrypted by waiting `GRACE_PERIOD_MS` before counting
  // the failure in `failureCounts`.

  /**
   * Create a new DecryptionFailureTracker.
   *
   * Call `eventDecrypted(event, err)` on this instance when an event is decrypted.
   *
   * Call `start()` to start the tracker, and `stop()` to stop tracking.
   *
   * @param {function} fn The tracking function, which will be called when failures
   * are tracked. The function should have a signature `(count, trackedErrorCode) => {...}`,
   * where `count` is the number of failures and `errorCode` matches the `.code` of
   * provided DecryptionError errors (by default, unless `errorCodeMapFn` is specified.
   * @param {function?} errorCodeMapFn The function used to map error codes to the
   * trackedErrorCode. If not provided, the `.code` of errors will be used.
   */
  constructor(fn, errorCodeMapFn) {
    (0, _defineProperty2.default)(this, "failures", []);
    (0, _defineProperty2.default)(this, "failureCounts", {// [errorCode]: 42
    });
    (0, _defineProperty2.default)(this, "trackedEventHashMap", {// [eventId]: true
    });
    (0, _defineProperty2.default)(this, "checkInterval", null);
    (0, _defineProperty2.default)(this, "trackInterval", null);

    if (!fn || typeof fn !== 'function') {
      throw new Error('DecryptionFailureTracker requires tracking function');
    }

    if (errorCodeMapFn && typeof errorCodeMapFn !== 'function') {
      throw new Error('DecryptionFailureTracker second constructor argument should be a function');
    }

    this._trackDecryptionFailure = fn;
    this._mapErrorCode = errorCodeMapFn;
  } // loadTrackedEventHashMap() {
  //     this.trackedEventHashMap = JSON.parse(localStorage.getItem('mx-decryption-failure-event-id-hashes')) || {};
  // }
  // saveTrackedEventHashMap() {
  //     localStorage.setItem('mx-decryption-failure-event-id-hashes', JSON.stringify(this.trackedEventHashMap));
  // }


  eventDecrypted(e, err) {
    if (err) {
      this.addDecryptionFailure(new DecryptionFailure(e.getId(), err.code));
    } else {
      // Could be an event in the failures, remove it
      this.removeDecryptionFailuresForEvent(e);
    }
  }

  addDecryptionFailure(failure) {
    this.failures.push(failure);
  }

  removeDecryptionFailuresForEvent(e) {
    this.failures = this.failures.filter(f => f.failedEventId !== e.getId());
  }
  /**
   * Start checking for and tracking failures.
   */


  start() {
    this.checkInterval = setInterval(() => this.checkFailures(Date.now()), DecryptionFailureTracker.CHECK_INTERVAL_MS);
    this.trackInterval = setInterval(() => this.trackFailures(), DecryptionFailureTracker.TRACK_INTERVAL_MS);
  }
  /**
   * Clear state and stop checking for and tracking failures.
   */


  stop() {
    clearInterval(this.checkInterval);
    clearInterval(this.trackInterval);
    this.failures = [];
    this.failureCounts = {};
  }
  /**
   * Mark failures that occured before nowTs - GRACE_PERIOD_MS as failures that should be
   * tracked. Only mark one failure per event ID.
   * @param {number} nowTs the timestamp that represents the time now.
   */


  checkFailures(nowTs) {
    const failuresGivenGrace = [];
    const failuresNotReady = [];

    while (this.failures.length > 0) {
      const f = this.failures.shift();

      if (nowTs > f.ts + DecryptionFailureTracker.GRACE_PERIOD_MS) {
        failuresGivenGrace.push(f);
      } else {
        failuresNotReady.push(f);
      }
    }

    this.failures = failuresNotReady; // Only track one failure per event

    const dedupedFailuresMap = failuresGivenGrace.reduce((map, failure) => {
      if (!this.trackedEventHashMap[failure.failedEventId]) {
        return map.set(failure.failedEventId, failure);
      } else {
        return map;
      }
    }, // Use a map to preseve key ordering
    new Map());
    const trackedEventIds = [...dedupedFailuresMap.keys()];
    this.trackedEventHashMap = trackedEventIds.reduce((result, eventId) => _objectSpread({}, result, {
      [eventId]: true
    }), this.trackedEventHashMap); // Commented out for now for expediency, we need to consider unbound nature of storing
    // this in localStorage
    // this.saveTrackedEventHashMap();

    const dedupedFailures = dedupedFailuresMap.values();

    this._aggregateFailures(dedupedFailures);
  }

  _aggregateFailures(failures) {
    for (const failure of failures) {
      const errorCode = failure.errorCode;
      this.failureCounts[errorCode] = (this.failureCounts[errorCode] || 0) + 1;
    }
  }
  /**
   * If there are failures that should be tracked, call the given trackDecryptionFailure
   * function with the number of failures that should be tracked.
   */


  trackFailures() {
    for (const errorCode of Object.keys(this.failureCounts)) {
      if (this.failureCounts[errorCode] > 0) {
        const trackedErrorCode = this._mapErrorCode ? this._mapErrorCode(errorCode) : errorCode;

        this._trackDecryptionFailure(this.failureCounts[errorCode], trackedErrorCode);

        this.failureCounts[errorCode] = 0;
      }
    }
  }

}

exports.DecryptionFailureTracker = DecryptionFailureTracker;
(0, _defineProperty2.default)(DecryptionFailureTracker, "TRACK_INTERVAL_MS", 60000);
(0, _defineProperty2.default)(DecryptionFailureTracker, "CHECK_INTERVAL_MS", 5000);
(0, _defineProperty2.default)(DecryptionFailureTracker, "GRACE_PERIOD_MS", 60000);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9EZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIuanMiXSwibmFtZXMiOlsiRGVjcnlwdGlvbkZhaWx1cmUiLCJjb25zdHJ1Y3RvciIsImZhaWxlZEV2ZW50SWQiLCJlcnJvckNvZGUiLCJ0cyIsIkRhdGUiLCJub3ciLCJEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIiLCJmbiIsImVycm9yQ29kZU1hcEZuIiwiRXJyb3IiLCJfdHJhY2tEZWNyeXB0aW9uRmFpbHVyZSIsIl9tYXBFcnJvckNvZGUiLCJldmVudERlY3J5cHRlZCIsImUiLCJlcnIiLCJhZGREZWNyeXB0aW9uRmFpbHVyZSIsImdldElkIiwiY29kZSIsInJlbW92ZURlY3J5cHRpb25GYWlsdXJlc0ZvckV2ZW50IiwiZmFpbHVyZSIsImZhaWx1cmVzIiwicHVzaCIsImZpbHRlciIsImYiLCJzdGFydCIsImNoZWNrSW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsImNoZWNrRmFpbHVyZXMiLCJDSEVDS19JTlRFUlZBTF9NUyIsInRyYWNrSW50ZXJ2YWwiLCJ0cmFja0ZhaWx1cmVzIiwiVFJBQ0tfSU5URVJWQUxfTVMiLCJzdG9wIiwiY2xlYXJJbnRlcnZhbCIsImZhaWx1cmVDb3VudHMiLCJub3dUcyIsImZhaWx1cmVzR2l2ZW5HcmFjZSIsImZhaWx1cmVzTm90UmVhZHkiLCJsZW5ndGgiLCJzaGlmdCIsIkdSQUNFX1BFUklPRF9NUyIsImRlZHVwZWRGYWlsdXJlc01hcCIsInJlZHVjZSIsIm1hcCIsInRyYWNrZWRFdmVudEhhc2hNYXAiLCJzZXQiLCJNYXAiLCJ0cmFja2VkRXZlbnRJZHMiLCJrZXlzIiwicmVzdWx0IiwiZXZlbnRJZCIsImRlZHVwZWRGYWlsdXJlcyIsInZhbHVlcyIsIl9hZ2dyZWdhdGVGYWlsdXJlcyIsIk9iamVjdCIsInRyYWNrZWRFcnJvckNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFnQk8sTUFBTUEsaUJBQU4sQ0FBd0I7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RCxPQUFYLElBQXNCQyxRQUF0QixFQUFnQztBQUM1QixZQUFNbEIsU0FBUyxHQUFHaUIsT0FBTyxDQUFDakIsU0FBMUI7QUFDQSxXQUFLZ0MsYUFBTCxDQUFtQmhDLFNBQW5CLElBQWdDLENBQUMsS0FBS2dDLGFBQUwsQ0FBbUJoQyxTQUFuQixLQUFpQyxDQUFsQyxJQUF1QyxDQUF2RTtBQUNIO0FBQ0o7QUFFRDs7Ozs7O0FBSUE0QixFQUFBQSxhQUFhLEdBQUc7QUFDWixTQUFLLE1BQU01QixTQUFYLElBQXdCb0QsTUFBTSxDQUFDTixJQUFQLENBQVksS0FBS2QsYUFBakIsQ0FBeEIsRUFBeUQ7QUFDckQsVUFBSSxLQUFLQSxhQUFMLENBQW1CaEMsU0FBbkIsSUFBZ0MsQ0FBcEMsRUFBdUM7QUFDbkMsY0FBTXFELGdCQUFnQixHQUFHLEtBQUs1QyxhQUFMLEdBQXFCLEtBQUtBLGFBQUwsQ0FBbUJULFNBQW5CLENBQXJCLEdBQXFEQSxTQUE5RTs7QUFFQSxhQUFLUSx1QkFBTCxDQUE2QixLQUFLd0IsYUFBTCxDQUFtQmhDLFNBQW5CLENBQTdCLEVBQTREcUQsZ0JBQTVEOztBQUNBLGFBQUtyQixhQUFMLENBQW1CaEMsU0FBbkIsSUFBZ0MsQ0FBaEM7QUFDSDtBQUNKO0FBQ0o7O0FBaExpQzs7OzhCQUF6Qkksd0IsdUJBc0JrQixLOzhCQXRCbEJBLHdCLHVCQXlCa0IsSTs4QkF6QmxCQSx3QixxQkE2QmdCLEsiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5leHBvcnQgY2xhc3MgRGVjcnlwdGlvbkZhaWx1cmUge1xuICAgIGNvbnN0cnVjdG9yKGZhaWxlZEV2ZW50SWQsIGVycm9yQ29kZSkge1xuICAgICAgICB0aGlzLmZhaWxlZEV2ZW50SWQgPSBmYWlsZWRFdmVudElkO1xuICAgICAgICB0aGlzLmVycm9yQ29kZSA9IGVycm9yQ29kZTtcbiAgICAgICAgdGhpcy50cyA9IERhdGUubm93KCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVjcnlwdGlvbkZhaWx1cmVUcmFja2VyIHtcbiAgICAvLyBBcnJheSBvZiBpdGVtcyBvZiB0eXBlIERlY3J5cHRpb25GYWlsdXJlLiBFdmVyeSBgQ0hFQ0tfSU5URVJWQUxfTVNgLCB0aGlzIGxpc3RcbiAgICAvLyBpcyBjaGVja2VkIGZvciBmYWlsdXJlcyB0aGF0IGhhcHBlbmVkID4gYEdSQUNFX1BFUklPRF9NU2AgYWdvLiBUaG9zZSB0aGF0IGRpZFxuICAgIC8vIGFyZSBhY2N1bXVsYXRlZCBpbiBgZmFpbHVyZUNvdW50c2AuXG4gICAgZmFpbHVyZXMgPSBbXTtcblxuICAgIC8vIEEgaGlzdG9ncmFtIG9mIHRoZSBudW1iZXIgb2YgZmFpbHVyZXMgdGhhdCB3aWxsIGJlIHRyYWNrZWQgYXQgdGhlIG5leHQgdHJhY2tpbmdcbiAgICAvLyBpbnRlcnZhbCwgc3BsaXQgYnkgZmFpbHVyZSBlcnJvciBjb2RlLlxuICAgIGZhaWx1cmVDb3VudHMgPSB7XG4gICAgICAgIC8vIFtlcnJvckNvZGVdOiA0MlxuICAgIH07XG5cbiAgICAvLyBFdmVudCBJRHMgb2YgZmFpbHVyZXMgdGhhdCB3ZXJlIHRyYWNrZWQgcHJldmlvdXNseVxuICAgIHRyYWNrZWRFdmVudEhhc2hNYXAgPSB7XG4gICAgICAgIC8vIFtldmVudElkXTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBTZXQgdG8gYW4gaW50ZXJ2YWwgSUQgd2hlbiBgc3RhcnRgIGlzIGNhbGxlZFxuICAgIGNoZWNrSW50ZXJ2YWwgPSBudWxsO1xuICAgIHRyYWNrSW50ZXJ2YWwgPSBudWxsO1xuXG4gICAgLy8gU3ByZWFkIHRoZSBsb2FkIG9uIGBBbmFseXRpY3NgIGJ5IHRyYWNraW5nIGF0IGEgbG93IGZyZXF1ZW5jeSwgYFRSQUNLX0lOVEVSVkFMX01TYC5cbiAgICBzdGF0aWMgVFJBQ0tfSU5URVJWQUxfTVMgPSA2MDAwMDtcblxuICAgIC8vIENhbGwgYGNoZWNrRmFpbHVyZXNgIGV2ZXJ5IGBDSEVDS19JTlRFUlZBTF9NU2AuXG4gICAgc3RhdGljIENIRUNLX0lOVEVSVkFMX01TID0gNTAwMDtcblxuICAgIC8vIEdpdmUgZXZlbnRzIGEgY2hhbmNlIHRvIGJlIGRlY3J5cHRlZCBieSB3YWl0aW5nIGBHUkFDRV9QRVJJT0RfTVNgIGJlZm9yZSBjb3VudGluZ1xuICAgIC8vIHRoZSBmYWlsdXJlIGluIGBmYWlsdXJlQ291bnRzYC5cbiAgICBzdGF0aWMgR1JBQ0VfUEVSSU9EX01TID0gNjAwMDA7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgRGVjcnlwdGlvbkZhaWx1cmVUcmFja2VyLlxuICAgICAqXG4gICAgICogQ2FsbCBgZXZlbnREZWNyeXB0ZWQoZXZlbnQsIGVycilgIG9uIHRoaXMgaW5zdGFuY2Ugd2hlbiBhbiBldmVudCBpcyBkZWNyeXB0ZWQuXG4gICAgICpcbiAgICAgKiBDYWxsIGBzdGFydCgpYCB0byBzdGFydCB0aGUgdHJhY2tlciwgYW5kIGBzdG9wKClgIHRvIHN0b3AgdHJhY2tpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiBUaGUgdHJhY2tpbmcgZnVuY3Rpb24sIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gZmFpbHVyZXNcbiAgICAgKiBhcmUgdHJhY2tlZC4gVGhlIGZ1bmN0aW9uIHNob3VsZCBoYXZlIGEgc2lnbmF0dXJlIGAoY291bnQsIHRyYWNrZWRFcnJvckNvZGUpID0+IHsuLi59YCxcbiAgICAgKiB3aGVyZSBgY291bnRgIGlzIHRoZSBudW1iZXIgb2YgZmFpbHVyZXMgYW5kIGBlcnJvckNvZGVgIG1hdGNoZXMgdGhlIGAuY29kZWAgb2ZcbiAgICAgKiBwcm92aWRlZCBEZWNyeXB0aW9uRXJyb3IgZXJyb3JzIChieSBkZWZhdWx0LCB1bmxlc3MgYGVycm9yQ29kZU1hcEZuYCBpcyBzcGVjaWZpZWQuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbj99IGVycm9yQ29kZU1hcEZuIFRoZSBmdW5jdGlvbiB1c2VkIHRvIG1hcCBlcnJvciBjb2RlcyB0byB0aGVcbiAgICAgKiB0cmFja2VkRXJyb3JDb2RlLiBJZiBub3QgcHJvdmlkZWQsIHRoZSBgLmNvZGVgIG9mIGVycm9ycyB3aWxsIGJlIHVzZWQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZm4sIGVycm9yQ29kZU1hcEZuKSB7XG4gICAgICAgIGlmICghZm4gfHwgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlY3J5cHRpb25GYWlsdXJlVHJhY2tlciByZXF1aXJlcyB0cmFja2luZyBmdW5jdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVycm9yQ29kZU1hcEZuICYmIHR5cGVvZiBlcnJvckNvZGVNYXBGbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIgc2Vjb25kIGNvbnN0cnVjdG9yIGFyZ3VtZW50IHNob3VsZCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cmFja0RlY3J5cHRpb25GYWlsdXJlID0gZm47XG4gICAgICAgIHRoaXMuX21hcEVycm9yQ29kZSA9IGVycm9yQ29kZU1hcEZuO1xuICAgIH1cblxuICAgIC8vIGxvYWRUcmFja2VkRXZlbnRIYXNoTWFwKCkge1xuICAgIC8vICAgICB0aGlzLnRyYWNrZWRFdmVudEhhc2hNYXAgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdteC1kZWNyeXB0aW9uLWZhaWx1cmUtZXZlbnQtaWQtaGFzaGVzJykpIHx8IHt9O1xuICAgIC8vIH1cblxuICAgIC8vIHNhdmVUcmFja2VkRXZlbnRIYXNoTWFwKCkge1xuICAgIC8vICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnbXgtZGVjcnlwdGlvbi1mYWlsdXJlLWV2ZW50LWlkLWhhc2hlcycsIEpTT04uc3RyaW5naWZ5KHRoaXMudHJhY2tlZEV2ZW50SGFzaE1hcCkpO1xuICAgIC8vIH1cblxuICAgIGV2ZW50RGVjcnlwdGVkKGUsIGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB0aGlzLmFkZERlY3J5cHRpb25GYWlsdXJlKG5ldyBEZWNyeXB0aW9uRmFpbHVyZShlLmdldElkKCksIGVyci5jb2RlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBDb3VsZCBiZSBhbiBldmVudCBpbiB0aGUgZmFpbHVyZXMsIHJlbW92ZSBpdFxuICAgICAgICAgICAgdGhpcy5yZW1vdmVEZWNyeXB0aW9uRmFpbHVyZXNGb3JFdmVudChlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZERlY3J5cHRpb25GYWlsdXJlKGZhaWx1cmUpIHtcbiAgICAgICAgdGhpcy5mYWlsdXJlcy5wdXNoKGZhaWx1cmUpO1xuICAgIH1cblxuICAgIHJlbW92ZURlY3J5cHRpb25GYWlsdXJlc0ZvckV2ZW50KGUpIHtcbiAgICAgICAgdGhpcy5mYWlsdXJlcyA9IHRoaXMuZmFpbHVyZXMuZmlsdGVyKChmKSA9PiBmLmZhaWxlZEV2ZW50SWQgIT09IGUuZ2V0SWQoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgY2hlY2tpbmcgZm9yIGFuZCB0cmFja2luZyBmYWlsdXJlcy5cbiAgICAgKi9cbiAgICBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5jaGVja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmNoZWNrRmFpbHVyZXMoRGF0ZS5ub3coKSksXG4gICAgICAgICAgICBEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIuQ0hFQ0tfSU5URVJWQUxfTVMsXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy50cmFja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgICAoKSA9PiB0aGlzLnRyYWNrRmFpbHVyZXMoKSxcbiAgICAgICAgICAgIERlY3J5cHRpb25GYWlsdXJlVHJhY2tlci5UUkFDS19JTlRFUlZBTF9NUyxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBzdGF0ZSBhbmQgc3RvcCBjaGVja2luZyBmb3IgYW5kIHRyYWNraW5nIGZhaWx1cmVzLlxuICAgICAqL1xuICAgIHN0b3AoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5jaGVja0ludGVydmFsKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRyYWNrSW50ZXJ2YWwpO1xuXG4gICAgICAgIHRoaXMuZmFpbHVyZXMgPSBbXTtcbiAgICAgICAgdGhpcy5mYWlsdXJlQ291bnRzID0ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFyayBmYWlsdXJlcyB0aGF0IG9jY3VyZWQgYmVmb3JlIG5vd1RzIC0gR1JBQ0VfUEVSSU9EX01TIGFzIGZhaWx1cmVzIHRoYXQgc2hvdWxkIGJlXG4gICAgICogdHJhY2tlZC4gT25seSBtYXJrIG9uZSBmYWlsdXJlIHBlciBldmVudCBJRC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbm93VHMgdGhlIHRpbWVzdGFtcCB0aGF0IHJlcHJlc2VudHMgdGhlIHRpbWUgbm93LlxuICAgICAqL1xuICAgIGNoZWNrRmFpbHVyZXMobm93VHMpIHtcbiAgICAgICAgY29uc3QgZmFpbHVyZXNHaXZlbkdyYWNlID0gW107XG4gICAgICAgIGNvbnN0IGZhaWx1cmVzTm90UmVhZHkgPSBbXTtcbiAgICAgICAgd2hpbGUgKHRoaXMuZmFpbHVyZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZiA9IHRoaXMuZmFpbHVyZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIGlmIChub3dUcyA+IGYudHMgKyBEZWNyeXB0aW9uRmFpbHVyZVRyYWNrZXIuR1JBQ0VfUEVSSU9EX01TKSB7XG4gICAgICAgICAgICAgICAgZmFpbHVyZXNHaXZlbkdyYWNlLnB1c2goZik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZhaWx1cmVzTm90UmVhZHkucHVzaChmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZhaWx1cmVzID0gZmFpbHVyZXNOb3RSZWFkeTtcblxuICAgICAgICAvLyBPbmx5IHRyYWNrIG9uZSBmYWlsdXJlIHBlciBldmVudFxuICAgICAgICBjb25zdCBkZWR1cGVkRmFpbHVyZXNNYXAgPSBmYWlsdXJlc0dpdmVuR3JhY2UucmVkdWNlKFxuICAgICAgICAgICAgKG1hcCwgZmFpbHVyZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50cmFja2VkRXZlbnRIYXNoTWFwW2ZhaWx1cmUuZmFpbGVkRXZlbnRJZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcC5zZXQoZmFpbHVyZS5mYWlsZWRFdmVudElkLCBmYWlsdXJlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBVc2UgYSBtYXAgdG8gcHJlc2V2ZSBrZXkgb3JkZXJpbmdcbiAgICAgICAgICAgIG5ldyBNYXAoKSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCB0cmFja2VkRXZlbnRJZHMgPSBbLi4uZGVkdXBlZEZhaWx1cmVzTWFwLmtleXMoKV07XG5cbiAgICAgICAgdGhpcy50cmFja2VkRXZlbnRIYXNoTWFwID0gdHJhY2tlZEV2ZW50SWRzLnJlZHVjZShcbiAgICAgICAgICAgIChyZXN1bHQsIGV2ZW50SWQpID0+ICh7Li4ucmVzdWx0LCBbZXZlbnRJZF06IHRydWV9KSxcbiAgICAgICAgICAgIHRoaXMudHJhY2tlZEV2ZW50SGFzaE1hcCxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBDb21tZW50ZWQgb3V0IGZvciBub3cgZm9yIGV4cGVkaWVuY3ksIHdlIG5lZWQgdG8gY29uc2lkZXIgdW5ib3VuZCBuYXR1cmUgb2Ygc3RvcmluZ1xuICAgICAgICAvLyB0aGlzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICAvLyB0aGlzLnNhdmVUcmFja2VkRXZlbnRIYXNoTWFwKCk7XG5cbiAgICAgICAgY29uc3QgZGVkdXBlZEZhaWx1cmVzID0gZGVkdXBlZEZhaWx1cmVzTWFwLnZhbHVlcygpO1xuXG4gICAgICAgIHRoaXMuX2FnZ3JlZ2F0ZUZhaWx1cmVzKGRlZHVwZWRGYWlsdXJlcyk7XG4gICAgfVxuXG4gICAgX2FnZ3JlZ2F0ZUZhaWx1cmVzKGZhaWx1cmVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmFpbHVyZSBvZiBmYWlsdXJlcykge1xuICAgICAgICAgICAgY29uc3QgZXJyb3JDb2RlID0gZmFpbHVyZS5lcnJvckNvZGU7XG4gICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudHNbZXJyb3JDb2RlXSA9ICh0aGlzLmZhaWx1cmVDb3VudHNbZXJyb3JDb2RlXSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBhcmUgZmFpbHVyZXMgdGhhdCBzaG91bGQgYmUgdHJhY2tlZCwgY2FsbCB0aGUgZ2l2ZW4gdHJhY2tEZWNyeXB0aW9uRmFpbHVyZVxuICAgICAqIGZ1bmN0aW9uIHdpdGggdGhlIG51bWJlciBvZiBmYWlsdXJlcyB0aGF0IHNob3VsZCBiZSB0cmFja2VkLlxuICAgICAqL1xuICAgIHRyYWNrRmFpbHVyZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZXJyb3JDb2RlIG9mIE9iamVjdC5rZXlzKHRoaXMuZmFpbHVyZUNvdW50cykpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZhaWx1cmVDb3VudHNbZXJyb3JDb2RlXSA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja2VkRXJyb3JDb2RlID0gdGhpcy5fbWFwRXJyb3JDb2RlID8gdGhpcy5fbWFwRXJyb3JDb2RlKGVycm9yQ29kZSkgOiBlcnJvckNvZGU7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl90cmFja0RlY3J5cHRpb25GYWlsdXJlKHRoaXMuZmFpbHVyZUNvdW50c1tlcnJvckNvZGVdLCB0cmFja2VkRXJyb3JDb2RlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudHNbZXJyb3JDb2RlXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=