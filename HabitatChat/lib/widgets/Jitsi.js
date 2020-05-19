"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Jitsi = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _SdkConfig = _interopRequireDefault(require("../SdkConfig"));

var _MatrixClientPeg = require("../MatrixClientPeg");

var _autodiscovery = require("matrix-js-sdk/src/autodiscovery");

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
const JITSI_WK_PROPERTY = "im.vector.riot.jitsi";
const JITSI_WK_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours, arbitrarily selected

/*:: export interface JitsiWidgetData {
    conferenceId: string;
    isAudioOnly: boolean;
    domain: string;
}*/

class Jitsi {
  get preferredDomain()
  /*: string*/
  {
    return this.domain || 'jitsi.riot.im';
  }

  constructor() {
    (0, _defineProperty2.default)(this, "domain", void 0);
    // We rely on the first call to be an .update() instead of doing one here. Doing one
    // here could result in duplicate calls to the homeserver.
    // Start a timer to update the server info regularly
    setInterval(() => this.update(), JITSI_WK_CHECK_INTERVAL);
  }

  async update()
  /*: Promise<any>*/
  {
    // Start with a default of the config's domain
    let domain = (_SdkConfig.default.get()['jitsi'] || {})['preferredDomain'] || 'jitsi.riot.im'; // Now request the .well-known config to see if it changed

    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      try {
        console.log("Attempting to get Jitsi conference information from homeserver");

        const homeserverDomain = _MatrixClientPeg.MatrixClientPeg.getHomeserverName();

        const discoveryResponse = await _autodiscovery.AutoDiscovery.getRawClientConfig(homeserverDomain);

        if (discoveryResponse && discoveryResponse[JITSI_WK_PROPERTY]) {
          const wkPreferredDomain = discoveryResponse[JITSI_WK_PROPERTY]['preferredDomain'];
          if (wkPreferredDomain) domain = wkPreferredDomain;
        }
      } catch (e) {
        // These are non-fatal errors
        console.error(e);
      }
    } // Put the result into memory for us to use later


    this.domain = domain;
    console.log("Jitsi conference domain:", this.preferredDomain);
  }
  /**
   * Parses the given URL into the data needed for a Jitsi widget, if the widget
   * URL matches the preferredDomain for the app.
   * @param {string} url The URL to parse.
   * @returns {JitsiWidgetData} The widget data if eligible, otherwise null.
   */


  parsePreferredConferenceUrl(url
  /*: string*/
  )
  /*: JitsiWidgetData*/
  {
    const parsed = new URL(url);
    if (parsed.hostname !== this.preferredDomain) return null; // invalid

    return {
      conferenceId: parsed.pathname,
      domain: parsed.hostname,
      isAudioOnly: false
    };
  }

  static getInstance()
  /*: Jitsi*/
  {
    if (!Jitsi.instance) {
      Jitsi.instance = new Jitsi();
    }

    return Jitsi.instance;
  }

}

exports.Jitsi = Jitsi;
(0, _defineProperty2.default)(Jitsi, "instance", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93aWRnZXRzL0ppdHNpLnRzIl0sIm5hbWVzIjpbIkpJVFNJX1dLX1BST1BFUlRZIiwiSklUU0lfV0tfQ0hFQ0tfSU5URVJWQUwiLCJKaXRzaSIsInByZWZlcnJlZERvbWFpbiIsImRvbWFpbiIsImNvbnN0cnVjdG9yIiwic2V0SW50ZXJ2YWwiLCJ1cGRhdGUiLCJTZGtDb25maWciLCJnZXQiLCJNYXRyaXhDbGllbnRQZWciLCJjb25zb2xlIiwibG9nIiwiaG9tZXNlcnZlckRvbWFpbiIsImdldEhvbWVzZXJ2ZXJOYW1lIiwiZGlzY292ZXJ5UmVzcG9uc2UiLCJBdXRvRGlzY292ZXJ5IiwiZ2V0UmF3Q2xpZW50Q29uZmlnIiwid2tQcmVmZXJyZWREb21haW4iLCJlIiwiZXJyb3IiLCJwYXJzZVByZWZlcnJlZENvbmZlcmVuY2VVcmwiLCJ1cmwiLCJwYXJzZWQiLCJVUkwiLCJob3N0bmFtZSIsImNvbmZlcmVuY2VJZCIsInBhdGhuYW1lIiwiaXNBdWRpb09ubHkiLCJnZXRJbnN0YW5jZSIsImluc3RhbmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxNQUFNQSxpQkFBaUIsR0FBRyxzQkFBMUI7QUFDQSxNQUFNQyx1QkFBdUIsR0FBRyxJQUFJLEVBQUosR0FBUyxFQUFULEdBQWMsSUFBOUMsQyxDQUFvRDs7Ozs7Ozs7QUFRN0MsTUFBTUMsS0FBTixDQUFZO0FBS2YsTUFBV0MsZUFBWDtBQUFBO0FBQXFDO0FBQ2pDLFdBQU8sS0FBS0MsTUFBTCxJQUFlLGVBQXRCO0FBQ0g7O0FBRURDLEVBQUFBLFdBQVcsR0FBRztBQUFBO0FBQ1Y7QUFDQTtBQUVBO0FBQ0FDLElBQUFBLFdBQVcsQ0FBQyxNQUFNLEtBQUtDLE1BQUwsRUFBUCxFQUFzQk4sdUJBQXRCLENBQVg7QUFDSDs7QUFFRCxRQUFhTSxNQUFiO0FBQUE7QUFBb0M7QUFDaEM7QUFDQSxRQUFJSCxNQUFNLEdBQUcsQ0FBQ0ksbUJBQVVDLEdBQVYsR0FBZ0IsT0FBaEIsS0FBNEIsRUFBN0IsRUFBaUMsaUJBQWpDLEtBQXVELGVBQXBFLENBRmdDLENBSWhDOztBQUNBLFFBQUlDLGlDQUFnQkQsR0FBaEIsRUFBSixFQUEyQjtBQUN2QixVQUFJO0FBQ0FFLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdFQUFaOztBQUVBLGNBQU1DLGdCQUFnQixHQUFHSCxpQ0FBZ0JJLGlCQUFoQixFQUF6Qjs7QUFDQSxjQUFNQyxpQkFBaUIsR0FBRyxNQUFNQyw2QkFBY0Msa0JBQWQsQ0FBaUNKLGdCQUFqQyxDQUFoQzs7QUFDQSxZQUFJRSxpQkFBaUIsSUFBSUEsaUJBQWlCLENBQUNmLGlCQUFELENBQTFDLEVBQStEO0FBQzNELGdCQUFNa0IsaUJBQWlCLEdBQUdILGlCQUFpQixDQUFDZixpQkFBRCxDQUFqQixDQUFxQyxpQkFBckMsQ0FBMUI7QUFDQSxjQUFJa0IsaUJBQUosRUFBdUJkLE1BQU0sR0FBR2MsaUJBQVQ7QUFDMUI7QUFDSixPQVRELENBU0UsT0FBT0MsQ0FBUCxFQUFVO0FBQ1I7QUFDQVIsUUFBQUEsT0FBTyxDQUFDUyxLQUFSLENBQWNELENBQWQ7QUFDSDtBQUNKLEtBbkIrQixDQXFCaEM7OztBQUNBLFNBQUtmLE1BQUwsR0FBY0EsTUFBZDtBQUNBTyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSwwQkFBWixFQUF3QyxLQUFLVCxlQUE3QztBQUNIO0FBRUQ7Ozs7Ozs7O0FBTU9rQixFQUFBQSwyQkFBUCxDQUFtQ0M7QUFBbkM7QUFBQTtBQUFBO0FBQWlFO0FBQzdELFVBQU1DLE1BQU0sR0FBRyxJQUFJQyxHQUFKLENBQVFGLEdBQVIsQ0FBZjtBQUNBLFFBQUlDLE1BQU0sQ0FBQ0UsUUFBUCxLQUFvQixLQUFLdEIsZUFBN0IsRUFBOEMsT0FBTyxJQUFQLENBRmUsQ0FFRjs7QUFDM0QsV0FBTztBQUNIdUIsTUFBQUEsWUFBWSxFQUFFSCxNQUFNLENBQUNJLFFBRGxCO0FBRUh2QixNQUFBQSxNQUFNLEVBQUVtQixNQUFNLENBQUNFLFFBRlo7QUFHSEcsTUFBQUEsV0FBVyxFQUFFO0FBSFYsS0FBUDtBQUtIOztBQUVELFNBQWNDLFdBQWQ7QUFBQTtBQUFtQztBQUMvQixRQUFJLENBQUMzQixLQUFLLENBQUM0QixRQUFYLEVBQXFCO0FBQ2pCNUIsTUFBQUEsS0FBSyxDQUFDNEIsUUFBTixHQUFpQixJQUFJNUIsS0FBSixFQUFqQjtBQUNIOztBQUNELFdBQU9BLEtBQUssQ0FBQzRCLFFBQWI7QUFDSDs7QUFoRWM7Ozs4QkFBTjVCLEsiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gXCIuLi9TZGtDb25maWdcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQge0F1dG9EaXNjb3Zlcnl9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9hdXRvZGlzY292ZXJ5XCI7XG5cbmNvbnN0IEpJVFNJX1dLX1BST1BFUlRZID0gXCJpbS52ZWN0b3IucmlvdC5qaXRzaVwiO1xuY29uc3QgSklUU0lfV0tfQ0hFQ0tfSU5URVJWQUwgPSAyICogNjAgKiA2MCAqIDEwMDA7IC8vIDIgaG91cnMsIGFyYml0cmFyaWx5IHNlbGVjdGVkXG5cbmV4cG9ydCBpbnRlcmZhY2UgSml0c2lXaWRnZXREYXRhIHtcbiAgICBjb25mZXJlbmNlSWQ6IHN0cmluZztcbiAgICBpc0F1ZGlvT25seTogYm9vbGVhbjtcbiAgICBkb21haW46IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEppdHNpIHtcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSml0c2k7XG5cbiAgICBwcml2YXRlIGRvbWFpbjogc3RyaW5nO1xuXG4gICAgcHVibGljIGdldCBwcmVmZXJyZWREb21haW4oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tYWluIHx8ICdqaXRzaS5yaW90LmltJztcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gV2UgcmVseSBvbiB0aGUgZmlyc3QgY2FsbCB0byBiZSBhbiAudXBkYXRlKCkgaW5zdGVhZCBvZiBkb2luZyBvbmUgaGVyZS4gRG9pbmcgb25lXG4gICAgICAgIC8vIGhlcmUgY291bGQgcmVzdWx0IGluIGR1cGxpY2F0ZSBjYWxscyB0byB0aGUgaG9tZXNlcnZlci5cblxuICAgICAgICAvLyBTdGFydCBhIHRpbWVyIHRvIHVwZGF0ZSB0aGUgc2VydmVyIGluZm8gcmVndWxhcmx5XG4gICAgICAgIHNldEludGVydmFsKCgpID0+IHRoaXMudXBkYXRlKCksIEpJVFNJX1dLX0NIRUNLX0lOVEVSVkFMKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBkZWZhdWx0IG9mIHRoZSBjb25maWcncyBkb21haW5cbiAgICAgICAgbGV0IGRvbWFpbiA9IChTZGtDb25maWcuZ2V0KClbJ2ppdHNpJ10gfHwge30pWydwcmVmZXJyZWREb21haW4nXSB8fCAnaml0c2kucmlvdC5pbSc7XG5cbiAgICAgICAgLy8gTm93IHJlcXVlc3QgdGhlIC53ZWxsLWtub3duIGNvbmZpZyB0byBzZWUgaWYgaXQgY2hhbmdlZFxuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGluZyB0byBnZXQgSml0c2kgY29uZmVyZW5jZSBpbmZvcm1hdGlvbiBmcm9tIGhvbWVzZXJ2ZXJcIik7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBob21lc2VydmVyRG9tYWluID0gTWF0cml4Q2xpZW50UGVnLmdldEhvbWVzZXJ2ZXJOYW1lKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzY292ZXJ5UmVzcG9uc2UgPSBhd2FpdCBBdXRvRGlzY292ZXJ5LmdldFJhd0NsaWVudENvbmZpZyhob21lc2VydmVyRG9tYWluKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlzY292ZXJ5UmVzcG9uc2UgJiYgZGlzY292ZXJ5UmVzcG9uc2VbSklUU0lfV0tfUFJPUEVSVFldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdrUHJlZmVycmVkRG9tYWluID0gZGlzY292ZXJ5UmVzcG9uc2VbSklUU0lfV0tfUFJPUEVSVFldWydwcmVmZXJyZWREb21haW4nXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdrUHJlZmVycmVkRG9tYWluKSBkb21haW4gPSB3a1ByZWZlcnJlZERvbWFpbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlc2UgYXJlIG5vbi1mYXRhbCBlcnJvcnNcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHV0IHRoZSByZXN1bHQgaW50byBtZW1vcnkgZm9yIHVzIHRvIHVzZSBsYXRlclxuICAgICAgICB0aGlzLmRvbWFpbiA9IGRvbWFpbjtcbiAgICAgICAgY29uc29sZS5sb2coXCJKaXRzaSBjb25mZXJlbmNlIGRvbWFpbjpcIiwgdGhpcy5wcmVmZXJyZWREb21haW4pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBhcnNlcyB0aGUgZ2l2ZW4gVVJMIGludG8gdGhlIGRhdGEgbmVlZGVkIGZvciBhIEppdHNpIHdpZGdldCwgaWYgdGhlIHdpZGdldFxuICAgICAqIFVSTCBtYXRjaGVzIHRoZSBwcmVmZXJyZWREb21haW4gZm9yIHRoZSBhcHAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHBhcnNlLlxuICAgICAqIEByZXR1cm5zIHtKaXRzaVdpZGdldERhdGF9IFRoZSB3aWRnZXQgZGF0YSBpZiBlbGlnaWJsZSwgb3RoZXJ3aXNlIG51bGwuXG4gICAgICovXG4gICAgcHVibGljIHBhcnNlUHJlZmVycmVkQ29uZmVyZW5jZVVybCh1cmw6IHN0cmluZyk6IEppdHNpV2lkZ2V0RGF0YSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsKTtcbiAgICAgICAgaWYgKHBhcnNlZC5ob3N0bmFtZSAhPT0gdGhpcy5wcmVmZXJyZWREb21haW4pIHJldHVybiBudWxsOyAvLyBpbnZhbGlkXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb25mZXJlbmNlSWQ6IHBhcnNlZC5wYXRobmFtZSxcbiAgICAgICAgICAgIGRvbWFpbjogcGFyc2VkLmhvc3RuYW1lLFxuICAgICAgICAgICAgaXNBdWRpb09ubHk6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogSml0c2kge1xuICAgICAgICBpZiAoIUppdHNpLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBKaXRzaS5pbnN0YW5jZSA9IG5ldyBKaXRzaSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBKaXRzaS5pbnN0YW5jZTtcbiAgICB9XG59XG4iXX0=