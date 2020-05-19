"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("../MatrixClientPeg");

var _SettingsStore = _interopRequireDefault(require("../settings/SettingsStore"));

var _Timer = _interopRequireDefault(require("../utils/Timer"));

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
const TYPING_USER_TIMEOUT = 10000;
const TYPING_SERVER_TIMEOUT = 30000;
/**
 * Tracks typing state for users.
 */

class TypingStore {
  constructor() {
    this.reset();
  }

  static sharedInstance()
  /*: TypingStore*/
  {
    if (global.mxTypingStore === undefined) {
      global.mxTypingStore = new TypingStore();
    }

    return global.mxTypingStore;
  }
  /**
   * Clears all cached typing states. Intended to be called when the
   * MatrixClientPeg client changes.
   */


  reset() {
    this._typingStates = {// "roomId": {
      //     isTyping: bool,     // Whether the user is typing or not
      //     userTimer: Timer,   // Local timeout for "user has stopped typing"
      //     serverTimer: Timer, // Maximum timeout for the typing state
      // },
    };
  }
  /**
   * Changes the typing status for the MatrixClientPeg user.
   * @param {string} roomId The room ID to set the typing state in.
   * @param {boolean} isTyping Whether the user is typing or not.
   */


  setSelfTyping(roomId
  /*: string*/
  , isTyping
  /*: boolean*/
  )
  /*: void*/
  {
    if (!_SettingsStore.default.getValue('sendTypingNotifications')) return;
    if (_SettingsStore.default.getValue('lowBandwidth')) return;
    let currentTyping = this._typingStates[roomId];

    if (!isTyping && !currentTyping || currentTyping && currentTyping.isTyping === isTyping) {
      // No change in state, so don't do anything. We'll let the timer run its course.
      return;
    }

    if (!currentTyping) {
      currentTyping = this._typingStates[roomId] = {
        isTyping: isTyping,
        serverTimer: new _Timer.default(TYPING_SERVER_TIMEOUT),
        userTimer: new _Timer.default(TYPING_USER_TIMEOUT)
      };
    }

    currentTyping.isTyping = isTyping;

    if (isTyping) {
      if (!currentTyping.serverTimer.isRunning()) {
        currentTyping.serverTimer.restart().finished().then(() => {
          const currentTyping = this._typingStates[roomId];
          if (currentTyping) currentTyping.isTyping = false; // The server will (should) time us out on typing, so we don't
          // need to advertise a stop of typing.
        });
      } else currentTyping.serverTimer.restart();

      if (!currentTyping.userTimer.isRunning()) {
        currentTyping.userTimer.restart().finished().then(() => {
          this.setSelfTyping(roomId, false);
        });
      } else currentTyping.userTimer.restart();
    }

    _MatrixClientPeg.MatrixClientPeg.get().sendTyping(roomId, isTyping, TYPING_SERVER_TIMEOUT);
  }

}

exports.default = TypingStore;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvVHlwaW5nU3RvcmUuanMiXSwibmFtZXMiOlsiVFlQSU5HX1VTRVJfVElNRU9VVCIsIlRZUElOR19TRVJWRVJfVElNRU9VVCIsIlR5cGluZ1N0b3JlIiwiY29uc3RydWN0b3IiLCJyZXNldCIsInNoYXJlZEluc3RhbmNlIiwiZ2xvYmFsIiwibXhUeXBpbmdTdG9yZSIsInVuZGVmaW5lZCIsIl90eXBpbmdTdGF0ZXMiLCJzZXRTZWxmVHlwaW5nIiwicm9vbUlkIiwiaXNUeXBpbmciLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJjdXJyZW50VHlwaW5nIiwic2VydmVyVGltZXIiLCJUaW1lciIsInVzZXJUaW1lciIsImlzUnVubmluZyIsInJlc3RhcnQiLCJmaW5pc2hlZCIsInRoZW4iLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJzZW5kVHlwaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7QUFvQkEsTUFBTUEsbUJBQW1CLEdBQUcsS0FBNUI7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxLQUE5QjtBQUVBOzs7O0FBR2UsTUFBTUMsV0FBTixDQUFrQjtBQUM3QkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsS0FBTDtBQUNIOztBQUVELFNBQU9DLGNBQVA7QUFBQTtBQUFxQztBQUNqQyxRQUFJQyxNQUFNLENBQUNDLGFBQVAsS0FBeUJDLFNBQTdCLEVBQXdDO0FBQ3BDRixNQUFBQSxNQUFNLENBQUNDLGFBQVAsR0FBdUIsSUFBSUwsV0FBSixFQUF2QjtBQUNIOztBQUNELFdBQU9JLE1BQU0sQ0FBQ0MsYUFBZDtBQUNIO0FBRUQ7Ozs7OztBQUlBSCxFQUFBQSxLQUFLLEdBQUc7QUFDSixTQUFLSyxhQUFMLEdBQXFCLENBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFMaUIsS0FBckI7QUFPSDtBQUVEOzs7Ozs7O0FBS0FDLEVBQUFBLGFBQWEsQ0FBQ0M7QUFBRDtBQUFBLElBQWlCQztBQUFqQjtBQUFBO0FBQUE7QUFBMEM7QUFDbkQsUUFBSSxDQUFDQyx1QkFBY0MsUUFBZCxDQUF1Qix5QkFBdkIsQ0FBTCxFQUF3RDtBQUN4RCxRQUFJRCx1QkFBY0MsUUFBZCxDQUF1QixjQUF2QixDQUFKLEVBQTRDO0FBRTVDLFFBQUlDLGFBQWEsR0FBRyxLQUFLTixhQUFMLENBQW1CRSxNQUFuQixDQUFwQjs7QUFDQSxRQUFLLENBQUNDLFFBQUQsSUFBYSxDQUFDRyxhQUFmLElBQWtDQSxhQUFhLElBQUlBLGFBQWEsQ0FBQ0gsUUFBZCxLQUEyQkEsUUFBbEYsRUFBNkY7QUFDekY7QUFDQTtBQUNIOztBQUVELFFBQUksQ0FBQ0csYUFBTCxFQUFvQjtBQUNoQkEsTUFBQUEsYUFBYSxHQUFHLEtBQUtOLGFBQUwsQ0FBbUJFLE1BQW5CLElBQTZCO0FBQ3pDQyxRQUFBQSxRQUFRLEVBQUVBLFFBRCtCO0FBRXpDSSxRQUFBQSxXQUFXLEVBQUUsSUFBSUMsY0FBSixDQUFVaEIscUJBQVYsQ0FGNEI7QUFHekNpQixRQUFBQSxTQUFTLEVBQUUsSUFBSUQsY0FBSixDQUFVakIsbUJBQVY7QUFIOEIsT0FBN0M7QUFLSDs7QUFFRGUsSUFBQUEsYUFBYSxDQUFDSCxRQUFkLEdBQXlCQSxRQUF6Qjs7QUFFQSxRQUFJQSxRQUFKLEVBQWM7QUFDVixVQUFJLENBQUNHLGFBQWEsQ0FBQ0MsV0FBZCxDQUEwQkcsU0FBMUIsRUFBTCxFQUE0QztBQUN4Q0osUUFBQUEsYUFBYSxDQUFDQyxXQUFkLENBQTBCSSxPQUExQixHQUFvQ0MsUUFBcEMsR0FBK0NDLElBQS9DLENBQW9ELE1BQU07QUFDdEQsZ0JBQU1QLGFBQWEsR0FBRyxLQUFLTixhQUFMLENBQW1CRSxNQUFuQixDQUF0QjtBQUNBLGNBQUlJLGFBQUosRUFBbUJBLGFBQWEsQ0FBQ0gsUUFBZCxHQUF5QixLQUF6QixDQUZtQyxDQUl0RDtBQUNBO0FBQ0gsU0FORDtBQU9ILE9BUkQsTUFRT0csYUFBYSxDQUFDQyxXQUFkLENBQTBCSSxPQUExQjs7QUFFUCxVQUFJLENBQUNMLGFBQWEsQ0FBQ0csU0FBZCxDQUF3QkMsU0FBeEIsRUFBTCxFQUEwQztBQUN0Q0osUUFBQUEsYUFBYSxDQUFDRyxTQUFkLENBQXdCRSxPQUF4QixHQUFrQ0MsUUFBbEMsR0FBNkNDLElBQTdDLENBQWtELE1BQU07QUFDcEQsZUFBS1osYUFBTCxDQUFtQkMsTUFBbkIsRUFBMkIsS0FBM0I7QUFDSCxTQUZEO0FBR0gsT0FKRCxNQUlPSSxhQUFhLENBQUNHLFNBQWQsQ0FBd0JFLE9BQXhCO0FBQ1Y7O0FBRURHLHFDQUFnQkMsR0FBaEIsR0FBc0JDLFVBQXRCLENBQWlDZCxNQUFqQyxFQUF5Q0MsUUFBekMsRUFBbURYLHFCQUFuRDtBQUNIOztBQXRFNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBUaW1lciBmcm9tIFwiLi4vdXRpbHMvVGltZXJcIjtcblxuY29uc3QgVFlQSU5HX1VTRVJfVElNRU9VVCA9IDEwMDAwO1xuY29uc3QgVFlQSU5HX1NFUlZFUl9USU1FT1VUID0gMzAwMDA7XG5cbi8qKlxuICogVHJhY2tzIHR5cGluZyBzdGF0ZSBmb3IgdXNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFR5cGluZ1N0b3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzaGFyZWRJbnN0YW5jZSgpOiBUeXBpbmdTdG9yZSB7XG4gICAgICAgIGlmIChnbG9iYWwubXhUeXBpbmdTdG9yZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBnbG9iYWwubXhUeXBpbmdTdG9yZSA9IG5ldyBUeXBpbmdTdG9yZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnbG9iYWwubXhUeXBpbmdTdG9yZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0eXBpbmcgc3RhdGVzLiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgd2hlbiB0aGVcbiAgICAgKiBNYXRyaXhDbGllbnRQZWcgY2xpZW50IGNoYW5nZXMuXG4gICAgICovXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuX3R5cGluZ1N0YXRlcyA9IHtcbiAgICAgICAgICAgIC8vIFwicm9vbUlkXCI6IHtcbiAgICAgICAgICAgIC8vICAgICBpc1R5cGluZzogYm9vbCwgICAgIC8vIFdoZXRoZXIgdGhlIHVzZXIgaXMgdHlwaW5nIG9yIG5vdFxuICAgICAgICAgICAgLy8gICAgIHVzZXJUaW1lcjogVGltZXIsICAgLy8gTG9jYWwgdGltZW91dCBmb3IgXCJ1c2VyIGhhcyBzdG9wcGVkIHR5cGluZ1wiXG4gICAgICAgICAgICAvLyAgICAgc2VydmVyVGltZXI6IFRpbWVyLCAvLyBNYXhpbXVtIHRpbWVvdXQgZm9yIHRoZSB0eXBpbmcgc3RhdGVcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgdHlwaW5nIHN0YXR1cyBmb3IgdGhlIE1hdHJpeENsaWVudFBlZyB1c2VyLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gc2V0IHRoZSB0eXBpbmcgc3RhdGUgaW4uXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1R5cGluZyBXaGV0aGVyIHRoZSB1c2VyIGlzIHR5cGluZyBvciBub3QuXG4gICAgICovXG4gICAgc2V0U2VsZlR5cGluZyhyb29tSWQ6IHN0cmluZywgaXNUeXBpbmc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKCdzZW5kVHlwaW5nTm90aWZpY2F0aW9ucycpKSByZXR1cm47XG4gICAgICAgIGlmIChTZXR0aW5nc1N0b3JlLmdldFZhbHVlKCdsb3dCYW5kd2lkdGgnKSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBjdXJyZW50VHlwaW5nID0gdGhpcy5fdHlwaW5nU3RhdGVzW3Jvb21JZF07XG4gICAgICAgIGlmICgoIWlzVHlwaW5nICYmICFjdXJyZW50VHlwaW5nKSB8fCAoY3VycmVudFR5cGluZyAmJiBjdXJyZW50VHlwaW5nLmlzVHlwaW5nID09PSBpc1R5cGluZykpIHtcbiAgICAgICAgICAgIC8vIE5vIGNoYW5nZSBpbiBzdGF0ZSwgc28gZG9uJ3QgZG8gYW55dGhpbmcuIFdlJ2xsIGxldCB0aGUgdGltZXIgcnVuIGl0cyBjb3Vyc2UuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWN1cnJlbnRUeXBpbmcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRUeXBpbmcgPSB0aGlzLl90eXBpbmdTdGF0ZXNbcm9vbUlkXSA9IHtcbiAgICAgICAgICAgICAgICBpc1R5cGluZzogaXNUeXBpbmcsXG4gICAgICAgICAgICAgICAgc2VydmVyVGltZXI6IG5ldyBUaW1lcihUWVBJTkdfU0VSVkVSX1RJTUVPVVQpLFxuICAgICAgICAgICAgICAgIHVzZXJUaW1lcjogbmV3IFRpbWVyKFRZUElOR19VU0VSX1RJTUVPVVQpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRUeXBpbmcuaXNUeXBpbmcgPSBpc1R5cGluZztcblxuICAgICAgICBpZiAoaXNUeXBpbmcpIHtcbiAgICAgICAgICAgIGlmICghY3VycmVudFR5cGluZy5zZXJ2ZXJUaW1lci5pc1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUeXBpbmcuc2VydmVyVGltZXIucmVzdGFydCgpLmZpbmlzaGVkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUeXBpbmcgPSB0aGlzLl90eXBpbmdTdGF0ZXNbcm9vbUlkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRUeXBpbmcpIGN1cnJlbnRUeXBpbmcuaXNUeXBpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgc2VydmVyIHdpbGwgKHNob3VsZCkgdGltZSB1cyBvdXQgb24gdHlwaW5nLCBzbyB3ZSBkb24ndFxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGFkdmVydGlzZSBhIHN0b3Agb2YgdHlwaW5nLlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGN1cnJlbnRUeXBpbmcuc2VydmVyVGltZXIucmVzdGFydCgpO1xuXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRUeXBpbmcudXNlclRpbWVyLmlzUnVubmluZygpKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFR5cGluZy51c2VyVGltZXIucmVzdGFydCgpLmZpbmlzaGVkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2VsZlR5cGluZyhyb29tSWQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBjdXJyZW50VHlwaW5nLnVzZXJUaW1lci5yZXN0YXJ0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VuZFR5cGluZyhyb29tSWQsIGlzVHlwaW5nLCBUWVBJTkdfU0VSVkVSX1RJTUVPVVQpO1xuICAgIH1cbn1cbiJdfQ==