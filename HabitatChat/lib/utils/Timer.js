"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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

/**
A countdown timer, exposing a promise api.
A timer starts in a non-started state,
and needs to be started by calling `start()`` on it first.

Timers can be `abort()`-ed which makes the promise reject prematurely.

Once a timer is finished or aborted, it can't be started again
(because the promise should not be replaced). Instead, create
a new one through `clone()` or `cloneIfRun()`.
*/
class Timer {
  constructor(timeout) {
    this._timeout = timeout;
    this._onTimeout = this._onTimeout.bind(this);

    this._setNotStarted();
  }

  _setNotStarted() {
    this._timerHandle = null;
    this._startTs = null;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    }).finally(() => {
      this._timerHandle = null;
    });
  }

  _onTimeout() {
    const now = Date.now();
    const elapsed = now - this._startTs;

    if (elapsed >= this._timeout) {
      this._resolve();

      this._setNotStarted();
    } else {
      const delta = this._timeout - elapsed;
      this._timerHandle = setTimeout(this._onTimeout, delta);
    }
  }

  changeTimeout(timeout) {
    if (timeout === this._timeout) {
      return;
    }

    const isSmallerTimeout = timeout < this._timeout;
    this._timeout = timeout;

    if (this.isRunning() && isSmallerTimeout) {
      clearTimeout(this._timerHandle);

      this._onTimeout();
    }
  }
  /**
   * if not started before, starts the timer.
   * @returns {Timer} the same timer
   */


  start() {
    if (!this.isRunning()) {
      this._startTs = Date.now();
      this._timerHandle = setTimeout(this._onTimeout, this._timeout);
    }

    return this;
  }
  /**
   * (re)start the timer. If it's running, reset the timeout. If not, start it.
   * @returns {Timer} the same timer
   */


  restart() {
    if (this.isRunning()) {
      // don't clearTimeout here as this method
      // can be called in fast succession,
      // instead just take note and compare
      // when the already running timeout expires
      this._startTs = Date.now();
      return this;
    } else {
      return this.start();
    }
  }
  /**
   * if the timer is running, abort it,
   * and reject the promise for this timer.
   * @returns {Timer} the same timer
   */


  abort() {
    if (this.isRunning()) {
      clearTimeout(this._timerHandle);

      this._reject(new Error("Timer was aborted."));

      this._setNotStarted();
    }

    return this;
  }
  /**
   *promise that will resolve when the timer elapses,
   *or is rejected when abort is called
   *@return {Promise}
   */


  finished() {
    return this._promise;
  }

  isRunning() {
    return this._timerHandle !== null;
  }

}

exports.default = Timer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9UaW1lci5qcyJdLCJuYW1lcyI6WyJUaW1lciIsImNvbnN0cnVjdG9yIiwidGltZW91dCIsIl90aW1lb3V0IiwiX29uVGltZW91dCIsImJpbmQiLCJfc2V0Tm90U3RhcnRlZCIsIl90aW1lckhhbmRsZSIsIl9zdGFydFRzIiwiX3Byb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIl9yZXNvbHZlIiwiX3JlamVjdCIsImZpbmFsbHkiLCJub3ciLCJEYXRlIiwiZWxhcHNlZCIsImRlbHRhIiwic2V0VGltZW91dCIsImNoYW5nZVRpbWVvdXQiLCJpc1NtYWxsZXJUaW1lb3V0IiwiaXNSdW5uaW5nIiwiY2xlYXJUaW1lb3V0Iiwic3RhcnQiLCJyZXN0YXJ0IiwiYWJvcnQiLCJFcnJvciIsImZpbmlzaGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7Ozs7O0FBV2UsTUFBTUEsS0FBTixDQUFZO0FBQ3ZCQyxFQUFBQSxXQUFXLENBQUNDLE9BQUQsRUFBVTtBQUNqQixTQUFLQyxRQUFMLEdBQWdCRCxPQUFoQjtBQUNBLFNBQUtFLFVBQUwsR0FBa0IsS0FBS0EsVUFBTCxDQUFnQkMsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBbEI7O0FBQ0EsU0FBS0MsY0FBTDtBQUNIOztBQUVEQSxFQUFBQSxjQUFjLEdBQUc7QUFDYixTQUFLQyxZQUFMLEdBQW9CLElBQXBCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixJQUFoQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0IsSUFBSUMsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUM3QyxXQUFLQyxRQUFMLEdBQWdCRixPQUFoQjtBQUNBLFdBQUtHLE9BQUwsR0FBZUYsTUFBZjtBQUNILEtBSGUsRUFHYkcsT0FIYSxDQUdMLE1BQU07QUFDYixXQUFLUixZQUFMLEdBQW9CLElBQXBCO0FBQ0gsS0FMZSxDQUFoQjtBQU1IOztBQUVESCxFQUFBQSxVQUFVLEdBQUc7QUFDVCxVQUFNWSxHQUFHLEdBQUdDLElBQUksQ0FBQ0QsR0FBTCxFQUFaO0FBQ0EsVUFBTUUsT0FBTyxHQUFHRixHQUFHLEdBQUcsS0FBS1IsUUFBM0I7O0FBQ0EsUUFBSVUsT0FBTyxJQUFJLEtBQUtmLFFBQXBCLEVBQThCO0FBQzFCLFdBQUtVLFFBQUw7O0FBQ0EsV0FBS1AsY0FBTDtBQUNILEtBSEQsTUFHTztBQUNILFlBQU1hLEtBQUssR0FBRyxLQUFLaEIsUUFBTCxHQUFnQmUsT0FBOUI7QUFDQSxXQUFLWCxZQUFMLEdBQW9CYSxVQUFVLENBQUMsS0FBS2hCLFVBQU4sRUFBa0JlLEtBQWxCLENBQTlCO0FBQ0g7QUFDSjs7QUFFREUsRUFBQUEsYUFBYSxDQUFDbkIsT0FBRCxFQUFVO0FBQ25CLFFBQUlBLE9BQU8sS0FBSyxLQUFLQyxRQUFyQixFQUErQjtBQUMzQjtBQUNIOztBQUNELFVBQU1tQixnQkFBZ0IsR0FBR3BCLE9BQU8sR0FBRyxLQUFLQyxRQUF4QztBQUNBLFNBQUtBLFFBQUwsR0FBZ0JELE9BQWhCOztBQUNBLFFBQUksS0FBS3FCLFNBQUwsTUFBb0JELGdCQUF4QixFQUEwQztBQUN0Q0UsTUFBQUEsWUFBWSxDQUFDLEtBQUtqQixZQUFOLENBQVo7O0FBQ0EsV0FBS0gsVUFBTDtBQUNIO0FBQ0o7QUFFRDs7Ozs7O0FBSUFxQixFQUFBQSxLQUFLLEdBQUc7QUFDSixRQUFJLENBQUMsS0FBS0YsU0FBTCxFQUFMLEVBQXVCO0FBQ25CLFdBQUtmLFFBQUwsR0FBZ0JTLElBQUksQ0FBQ0QsR0FBTCxFQUFoQjtBQUNBLFdBQUtULFlBQUwsR0FBb0JhLFVBQVUsQ0FBQyxLQUFLaEIsVUFBTixFQUFrQixLQUFLRCxRQUF2QixDQUE5QjtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIO0FBRUQ7Ozs7OztBQUlBdUIsRUFBQUEsT0FBTyxHQUFHO0FBQ04sUUFBSSxLQUFLSCxTQUFMLEVBQUosRUFBc0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFLZixRQUFMLEdBQWdCUyxJQUFJLENBQUNELEdBQUwsRUFBaEI7QUFDQSxhQUFPLElBQVA7QUFDSCxLQVBELE1BT087QUFDSCxhQUFPLEtBQUtTLEtBQUwsRUFBUDtBQUNIO0FBQ0o7QUFFRDs7Ozs7OztBQUtBRSxFQUFBQSxLQUFLLEdBQUc7QUFDSixRQUFJLEtBQUtKLFNBQUwsRUFBSixFQUFzQjtBQUNsQkMsTUFBQUEsWUFBWSxDQUFDLEtBQUtqQixZQUFOLENBQVo7O0FBQ0EsV0FBS08sT0FBTCxDQUFhLElBQUljLEtBQUosQ0FBVSxvQkFBVixDQUFiOztBQUNBLFdBQUt0QixjQUFMO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7QUFFRDs7Ozs7OztBQUtBdUIsRUFBQUEsUUFBUSxHQUFHO0FBQ1AsV0FBTyxLQUFLcEIsUUFBWjtBQUNIOztBQUVEYyxFQUFBQSxTQUFTLEdBQUc7QUFDUixXQUFPLEtBQUtoQixZQUFMLEtBQXNCLElBQTdCO0FBQ0g7O0FBaEdzQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qKlxuQSBjb3VudGRvd24gdGltZXIsIGV4cG9zaW5nIGEgcHJvbWlzZSBhcGkuXG5BIHRpbWVyIHN0YXJ0cyBpbiBhIG5vbi1zdGFydGVkIHN0YXRlLFxuYW5kIG5lZWRzIHRvIGJlIHN0YXJ0ZWQgYnkgY2FsbGluZyBgc3RhcnQoKWBgIG9uIGl0IGZpcnN0LlxuXG5UaW1lcnMgY2FuIGJlIGBhYm9ydCgpYC1lZCB3aGljaCBtYWtlcyB0aGUgcHJvbWlzZSByZWplY3QgcHJlbWF0dXJlbHkuXG5cbk9uY2UgYSB0aW1lciBpcyBmaW5pc2hlZCBvciBhYm9ydGVkLCBpdCBjYW4ndCBiZSBzdGFydGVkIGFnYWluXG4oYmVjYXVzZSB0aGUgcHJvbWlzZSBzaG91bGQgbm90IGJlIHJlcGxhY2VkKS4gSW5zdGVhZCwgY3JlYXRlXG5hIG5ldyBvbmUgdGhyb3VnaCBgY2xvbmUoKWAgb3IgYGNsb25lSWZSdW4oKWAuXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGltZXIge1xuICAgIGNvbnN0cnVjdG9yKHRpbWVvdXQpIHtcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIHRoaXMuX29uVGltZW91dCA9IHRoaXMuX29uVGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9zZXROb3RTdGFydGVkKCk7XG4gICAgfVxuXG4gICAgX3NldE5vdFN0YXJ0ZWQoKSB7XG4gICAgICAgIHRoaXMuX3RpbWVySGFuZGxlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3RhcnRUcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMuX3JlamVjdCA9IHJlamVjdDtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl90aW1lckhhbmRsZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vblRpbWVvdXQoKSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IGVsYXBzZWQgPSBub3cgLSB0aGlzLl9zdGFydFRzO1xuICAgICAgICBpZiAoZWxhcHNlZCA+PSB0aGlzLl90aW1lb3V0KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKCk7XG4gICAgICAgICAgICB0aGlzLl9zZXROb3RTdGFydGVkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWx0YSA9IHRoaXMuX3RpbWVvdXQgLSBlbGFwc2VkO1xuICAgICAgICAgICAgdGhpcy5fdGltZXJIYW5kbGUgPSBzZXRUaW1lb3V0KHRoaXMuX29uVGltZW91dCwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hhbmdlVGltZW91dCh0aW1lb3V0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSB0aGlzLl90aW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNTbWFsbGVyVGltZW91dCA9IHRpbWVvdXQgPCB0aGlzLl90aW1lb3V0O1xuICAgICAgICB0aGlzLl90aW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgaWYgKHRoaXMuaXNSdW5uaW5nKCkgJiYgaXNTbWFsbGVyVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVySGFuZGxlKTtcbiAgICAgICAgICAgIHRoaXMuX29uVGltZW91dCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaWYgbm90IHN0YXJ0ZWQgYmVmb3JlLCBzdGFydHMgdGhlIHRpbWVyLlxuICAgICAqIEByZXR1cm5zIHtUaW1lcn0gdGhlIHNhbWUgdGltZXJcbiAgICAgKi9cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUnVubmluZygpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFydFRzID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVySGFuZGxlID0gc2V0VGltZW91dCh0aGlzLl9vblRpbWVvdXQsIHRoaXMuX3RpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIChyZSlzdGFydCB0aGUgdGltZXIuIElmIGl0J3MgcnVubmluZywgcmVzZXQgdGhlIHRpbWVvdXQuIElmIG5vdCwgc3RhcnQgaXQuXG4gICAgICogQHJldHVybnMge1RpbWVyfSB0aGUgc2FtZSB0aW1lclxuICAgICAqL1xuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUnVubmluZygpKSB7XG4gICAgICAgICAgICAvLyBkb24ndCBjbGVhclRpbWVvdXQgaGVyZSBhcyB0aGlzIG1ldGhvZFxuICAgICAgICAgICAgLy8gY2FuIGJlIGNhbGxlZCBpbiBmYXN0IHN1Y2Nlc3Npb24sXG4gICAgICAgICAgICAvLyBpbnN0ZWFkIGp1c3QgdGFrZSBub3RlIGFuZCBjb21wYXJlXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBhbHJlYWR5IHJ1bm5pbmcgdGltZW91dCBleHBpcmVzXG4gICAgICAgICAgICB0aGlzLl9zdGFydFRzID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGlmIHRoZSB0aW1lciBpcyBydW5uaW5nLCBhYm9ydCBpdCxcbiAgICAgKiBhbmQgcmVqZWN0IHRoZSBwcm9taXNlIGZvciB0aGlzIHRpbWVyLlxuICAgICAqIEByZXR1cm5zIHtUaW1lcn0gdGhlIHNhbWUgdGltZXJcbiAgICAgKi9cbiAgICBhYm9ydCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lckhhbmRsZSk7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QobmV3IEVycm9yKFwiVGltZXIgd2FzIGFib3J0ZWQuXCIpKTtcbiAgICAgICAgICAgIHRoaXMuX3NldE5vdFN0YXJ0ZWQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKnByb21pc2UgdGhhdCB3aWxsIHJlc29sdmUgd2hlbiB0aGUgdGltZXIgZWxhcHNlcyxcbiAgICAgKm9yIGlzIHJlamVjdGVkIHdoZW4gYWJvcnQgaXMgY2FsbGVkXG4gICAgICpAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZpbmlzaGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9XG5cbiAgICBpc1J1bm5pbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aW1lckhhbmRsZSAhPT0gbnVsbDtcbiAgICB9XG59XG4iXX0=