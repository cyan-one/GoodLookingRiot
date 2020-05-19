"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _Timer = _interopRequireDefault(require("./utils/Timer"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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
// Time in ms after that a user is considered as unavailable/away
const UNAVAILABLE_TIME_MS = 3 * 60 * 1000; // 3 mins

const PRESENCE_STATES = ["online", "offline", "unavailable"];

class Presence {
  constructor() {
    this._activitySignal = null;
    this._unavailableTimer = null;
    this._onAction = this._onAction.bind(this);
    this._dispatcherRef = null;
  }
  /**
   * Start listening the user activity to evaluate his presence state.
   * Any state change will be sent to the homeserver.
   */


  async start() {
    this._unavailableTimer = new _Timer.default(UNAVAILABLE_TIME_MS); // the user_activity_start action starts the timer

    this._dispatcherRef = _dispatcher.default.register(this._onAction);

    while (this._unavailableTimer) {
      try {
        await this._unavailableTimer.finished();
        this.setState("unavailable");
      } catch (e) {
        /* aborted, stop got called */
      }
    }
  }
  /**
   * Stop tracking user activity
   */


  stop() {
    if (this._dispatcherRef) {
      _dispatcher.default.unregister(this._dispatcherRef);

      this._dispatcherRef = null;
    }

    if (this._unavailableTimer) {
      this._unavailableTimer.abort();

      this._unavailableTimer = null;
    }
  }
  /**
   * Get the current presence state.
   * @returns {string} the presence state (see PRESENCE enum)
   */


  getState() {
    return this.state;
  }

  _onAction(payload) {
    if (payload.action === 'user_activity') {
      this.setState("online");

      this._unavailableTimer.restart();
    }
  }
  /**
   * Set the presence state.
   * If the state has changed, the homeserver will be notified.
   * @param {string} newState the new presence state (see PRESENCE enum)
   */


  async setState(newState) {
    if (newState === this.state) {
      return;
    }

    if (PRESENCE_STATES.indexOf(newState) === -1) {
      throw new Error("Bad presence state: " + newState);
    }

    const oldState = this.state;
    this.state = newState;

    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      return; // don't try to set presence when a guest; it won't work.
    }

    try {
      await _MatrixClientPeg.MatrixClientPeg.get().setPresence(this.state);
      console.info("Presence: %s", newState);
    } catch (err) {
      console.error("Failed to set presence: %s", err);
      this.state = oldState;
    }
  }

}

var _default = new Presence();

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9QcmVzZW5jZS5qcyJdLCJuYW1lcyI6WyJVTkFWQUlMQUJMRV9USU1FX01TIiwiUFJFU0VOQ0VfU1RBVEVTIiwiUHJlc2VuY2UiLCJjb25zdHJ1Y3RvciIsIl9hY3Rpdml0eVNpZ25hbCIsIl91bmF2YWlsYWJsZVRpbWVyIiwiX29uQWN0aW9uIiwiYmluZCIsIl9kaXNwYXRjaGVyUmVmIiwic3RhcnQiLCJUaW1lciIsImRpcyIsInJlZ2lzdGVyIiwiZmluaXNoZWQiLCJzZXRTdGF0ZSIsImUiLCJzdG9wIiwidW5yZWdpc3RlciIsImFib3J0IiwiZ2V0U3RhdGUiLCJzdGF0ZSIsInBheWxvYWQiLCJhY3Rpb24iLCJyZXN0YXJ0IiwibmV3U3RhdGUiLCJpbmRleE9mIiwiRXJyb3IiLCJvbGRTdGF0ZSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzR3Vlc3QiLCJzZXRQcmVzZW5jZSIsImNvbnNvbGUiLCJpbmZvIiwiZXJyIiwiZXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JDO0FBQ0QsTUFBTUEsbUJBQW1CLEdBQUcsSUFBSSxFQUFKLEdBQVMsSUFBckMsQyxDQUEyQzs7QUFDM0MsTUFBTUMsZUFBZSxHQUFHLENBQUMsUUFBRCxFQUFXLFNBQVgsRUFBc0IsYUFBdEIsQ0FBeEI7O0FBRUEsTUFBTUMsUUFBTixDQUFlO0FBQ1hDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLGVBQUwsR0FBdUIsSUFBdkI7QUFDQSxTQUFLQyxpQkFBTCxHQUF5QixJQUF6QjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsS0FBS0EsU0FBTCxDQUFlQyxJQUFmLENBQW9CLElBQXBCLENBQWpCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixJQUF0QjtBQUNIO0FBQ0Q7Ozs7OztBQUlBLFFBQU1DLEtBQU4sR0FBYztBQUNWLFNBQUtKLGlCQUFMLEdBQXlCLElBQUlLLGNBQUosQ0FBVVYsbUJBQVYsQ0FBekIsQ0FEVSxDQUVWOztBQUNBLFNBQUtRLGNBQUwsR0FBc0JHLG9CQUFJQyxRQUFKLENBQWEsS0FBS04sU0FBbEIsQ0FBdEI7O0FBQ0EsV0FBTyxLQUFLRCxpQkFBWixFQUErQjtBQUMzQixVQUFJO0FBQ0EsY0FBTSxLQUFLQSxpQkFBTCxDQUF1QlEsUUFBdkIsRUFBTjtBQUNBLGFBQUtDLFFBQUwsQ0FBYyxhQUFkO0FBQ0gsT0FIRCxDQUdFLE9BQU9DLENBQVAsRUFBVTtBQUFFO0FBQWdDO0FBQ2pEO0FBQ0o7QUFFRDs7Ozs7QUFHQUMsRUFBQUEsSUFBSSxHQUFHO0FBQ0gsUUFBSSxLQUFLUixjQUFULEVBQXlCO0FBQ3JCRywwQkFBSU0sVUFBSixDQUFlLEtBQUtULGNBQXBCOztBQUNBLFdBQUtBLGNBQUwsR0FBc0IsSUFBdEI7QUFDSDs7QUFDRCxRQUFJLEtBQUtILGlCQUFULEVBQTRCO0FBQ3hCLFdBQUtBLGlCQUFMLENBQXVCYSxLQUF2Qjs7QUFDQSxXQUFLYixpQkFBTCxHQUF5QixJQUF6QjtBQUNIO0FBQ0o7QUFFRDs7Ozs7O0FBSUFjLEVBQUFBLFFBQVEsR0FBRztBQUNQLFdBQU8sS0FBS0MsS0FBWjtBQUNIOztBQUVEZCxFQUFBQSxTQUFTLENBQUNlLE9BQUQsRUFBVTtBQUNmLFFBQUlBLE9BQU8sQ0FBQ0MsTUFBUixLQUFtQixlQUF2QixFQUF3QztBQUNwQyxXQUFLUixRQUFMLENBQWMsUUFBZDs7QUFDQSxXQUFLVCxpQkFBTCxDQUF1QmtCLE9BQXZCO0FBQ0g7QUFDSjtBQUVEOzs7Ozs7O0FBS0EsUUFBTVQsUUFBTixDQUFlVSxRQUFmLEVBQXlCO0FBQ3JCLFFBQUlBLFFBQVEsS0FBSyxLQUFLSixLQUF0QixFQUE2QjtBQUN6QjtBQUNIOztBQUNELFFBQUluQixlQUFlLENBQUN3QixPQUFoQixDQUF3QkQsUUFBeEIsTUFBc0MsQ0FBQyxDQUEzQyxFQUE4QztBQUMxQyxZQUFNLElBQUlFLEtBQUosQ0FBVSx5QkFBeUJGLFFBQW5DLENBQU47QUFDSDs7QUFDRCxVQUFNRyxRQUFRLEdBQUcsS0FBS1AsS0FBdEI7QUFDQSxTQUFLQSxLQUFMLEdBQWFJLFFBQWI7O0FBRUEsUUFBSUksaUNBQWdCQyxHQUFoQixHQUFzQkMsT0FBdEIsRUFBSixFQUFxQztBQUNqQyxhQURpQyxDQUN6QjtBQUNYOztBQUVELFFBQUk7QUFDQSxZQUFNRixpQ0FBZ0JDLEdBQWhCLEdBQXNCRSxXQUF0QixDQUFrQyxLQUFLWCxLQUF2QyxDQUFOO0FBQ0FZLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLGNBQWIsRUFBNkJULFFBQTdCO0FBQ0gsS0FIRCxDQUdFLE9BQU9VLEdBQVAsRUFBWTtBQUNWRixNQUFBQSxPQUFPLENBQUNHLEtBQVIsQ0FBYyw0QkFBZCxFQUE0Q0QsR0FBNUM7QUFDQSxXQUFLZCxLQUFMLEdBQWFPLFFBQWI7QUFDSDtBQUNKOztBQTlFVTs7ZUFpRkEsSUFBSXpCLFFBQUosRSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXJcIjtcbmltcG9ydCBUaW1lciBmcm9tICcuL3V0aWxzL1RpbWVyJztcblxuIC8vIFRpbWUgaW4gbXMgYWZ0ZXIgdGhhdCBhIHVzZXIgaXMgY29uc2lkZXJlZCBhcyB1bmF2YWlsYWJsZS9hd2F5XG5jb25zdCBVTkFWQUlMQUJMRV9USU1FX01TID0gMyAqIDYwICogMTAwMDsgLy8gMyBtaW5zXG5jb25zdCBQUkVTRU5DRV9TVEFURVMgPSBbXCJvbmxpbmVcIiwgXCJvZmZsaW5lXCIsIFwidW5hdmFpbGFibGVcIl07XG5cbmNsYXNzIFByZXNlbmNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZpdHlTaWduYWwgPSBudWxsO1xuICAgICAgICB0aGlzLl91bmF2YWlsYWJsZVRpbWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fb25BY3Rpb24gPSB0aGlzLl9vbkFjdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9kaXNwYXRjaGVyUmVmID0gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnQgbGlzdGVuaW5nIHRoZSB1c2VyIGFjdGl2aXR5IHRvIGV2YWx1YXRlIGhpcyBwcmVzZW5jZSBzdGF0ZS5cbiAgICAgKiBBbnkgc3RhdGUgY2hhbmdlIHdpbGwgYmUgc2VudCB0byB0aGUgaG9tZXNlcnZlci5cbiAgICAgKi9cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5fdW5hdmFpbGFibGVUaW1lciA9IG5ldyBUaW1lcihVTkFWQUlMQUJMRV9USU1FX01TKTtcbiAgICAgICAgLy8gdGhlIHVzZXJfYWN0aXZpdHlfc3RhcnQgYWN0aW9uIHN0YXJ0cyB0aGUgdGltZXJcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLl9vbkFjdGlvbik7XG4gICAgICAgIHdoaWxlICh0aGlzLl91bmF2YWlsYWJsZVRpbWVyKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3VuYXZhaWxhYmxlVGltZXIuZmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKFwidW5hdmFpbGFibGVcIik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IC8qIGFib3J0ZWQsIHN0b3AgZ290IGNhbGxlZCAqLyB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIHRyYWNraW5nIHVzZXIgYWN0aXZpdHlcbiAgICAgKi9cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5fZGlzcGF0Y2hlclJlZikge1xuICAgICAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5fZGlzcGF0Y2hlclJlZik7XG4gICAgICAgICAgICB0aGlzLl9kaXNwYXRjaGVyUmVmID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fdW5hdmFpbGFibGVUaW1lcikge1xuICAgICAgICAgICAgdGhpcy5fdW5hdmFpbGFibGVUaW1lci5hYm9ydCgpO1xuICAgICAgICAgICAgdGhpcy5fdW5hdmFpbGFibGVUaW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgcHJlc2VuY2Ugc3RhdGUuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHByZXNlbmNlIHN0YXRlIChzZWUgUFJFU0VOQ0UgZW51bSlcbiAgICAgKi9cbiAgICBnZXRTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgX29uQWN0aW9uKHBheWxvYWQpIHtcbiAgICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSAndXNlcl9hY3Rpdml0eScpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoXCJvbmxpbmVcIik7XG4gICAgICAgICAgICB0aGlzLl91bmF2YWlsYWJsZVRpbWVyLnJlc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgcHJlc2VuY2Ugc3RhdGUuXG4gICAgICogSWYgdGhlIHN0YXRlIGhhcyBjaGFuZ2VkLCB0aGUgaG9tZXNlcnZlciB3aWxsIGJlIG5vdGlmaWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdTdGF0ZSB0aGUgbmV3IHByZXNlbmNlIHN0YXRlIChzZWUgUFJFU0VOQ0UgZW51bSlcbiAgICAgKi9cbiAgICBhc3luYyBzZXRTdGF0ZShuZXdTdGF0ZSkge1xuICAgICAgICBpZiAobmV3U3RhdGUgPT09IHRoaXMuc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoUFJFU0VOQ0VfU1RBVEVTLmluZGV4T2YobmV3U3RhdGUpID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIHByZXNlbmNlIHN0YXRlOiBcIiArIG5ld1N0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcblxuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzR3Vlc3QoKSkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCB0cnkgdG8gc2V0IHByZXNlbmNlIHdoZW4gYSBndWVzdDsgaXQgd29uJ3Qgd29yay5cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2V0UHJlc2VuY2UodGhpcy5zdGF0ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJQcmVzZW5jZTogJXNcIiwgbmV3U3RhdGUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2V0IHByZXNlbmNlOiAlc1wiLCBlcnIpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IG9sZFN0YXRlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgUHJlc2VuY2UoKTtcbiJdfQ==