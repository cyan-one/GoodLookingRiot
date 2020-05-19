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
// const OUTBOUND_API_NAME = 'toWidget';
// Initiate requests using the "toWidget" postMessage API and handle responses
// NOTE: ToWidgetPostMessageApi only handles message events with a data payload with a
// response field
class ToWidgetPostMessageApi {
  constructor(timeoutMs) {
    this._timeoutMs = timeoutMs || 5000; // default to 5s timer

    this._counter = 0;
    this._requestMap = {// $ID: {resolve, reject}
    };
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.onPostMessage = this.onPostMessage.bind(this);
  }

  start() {
    window.addEventListener('message', this.onPostMessage);
  }

  stop() {
    window.removeEventListener('message', this.onPostMessage);
  }

  onPostMessage(ev) {
    // THIS IS ALL UNSAFE EXECUTION.
    // We do not verify who the sender of `ev` is!
    const payload = ev.data; // NOTE: Workaround for running in a mobile WebView where a
    // postMessage immediately triggers this callback even though it is
    // not the response.

    if (payload.response === undefined) {
      return;
    }

    const promise = this._requestMap[payload.requestId];

    if (!promise) {
      return;
    }

    delete this._requestMap[payload.requestId];
    promise.resolve(payload);
  } // Initiate outbound requests (toWidget)


  exec(action, targetWindow, targetOrigin) {
    targetWindow = targetWindow || window.parent; // default to parent window

    targetOrigin = targetOrigin || "*";
    this._counter += 1;
    action.requestId = Date.now() + "-" + Math.random().toString(36) + "-" + this._counter;
    return new Promise((resolve, reject) => {
      this._requestMap[action.requestId] = {
        resolve,
        reject
      };
      targetWindow.postMessage(action, targetOrigin);

      if (this._timeoutMs > 0) {
        setTimeout(() => {
          if (!this._requestMap[action.requestId]) {
            return;
          }

          console.error("postMessage request timed out. Sent object: " + JSON.stringify(action), this._requestMap);

          this._requestMap[action.requestId].reject(new Error("Timed out"));

          delete this._requestMap[action.requestId];
        }, this._timeoutMs);
      }
    });
  }

}

exports.default = ToWidgetPostMessageApi;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Ub1dpZGdldFBvc3RNZXNzYWdlQXBpLmpzIl0sIm5hbWVzIjpbIlRvV2lkZ2V0UG9zdE1lc3NhZ2VBcGkiLCJjb25zdHJ1Y3RvciIsInRpbWVvdXRNcyIsIl90aW1lb3V0TXMiLCJfY291bnRlciIsIl9yZXF1ZXN0TWFwIiwic3RhcnQiLCJiaW5kIiwic3RvcCIsIm9uUG9zdE1lc3NhZ2UiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImV2IiwicGF5bG9hZCIsImRhdGEiLCJyZXNwb25zZSIsInVuZGVmaW5lZCIsInByb21pc2UiLCJyZXF1ZXN0SWQiLCJyZXNvbHZlIiwiZXhlYyIsImFjdGlvbiIsInRhcmdldFdpbmRvdyIsInRhcmdldE9yaWdpbiIsInBhcmVudCIsIkRhdGUiLCJub3ciLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJQcm9taXNlIiwicmVqZWN0IiwicG9zdE1lc3NhZ2UiLCJzZXRUaW1lb3V0IiwiY29uc29sZSIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTtBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1BLHNCQUFOLENBQTZCO0FBQ3hDQyxFQUFBQSxXQUFXLENBQUNDLFNBQUQsRUFBWTtBQUNuQixTQUFLQyxVQUFMLEdBQWtCRCxTQUFTLElBQUksSUFBL0IsQ0FEbUIsQ0FDa0I7O0FBQ3JDLFNBQUtFLFFBQUwsR0FBZ0IsQ0FBaEI7QUFDQSxTQUFLQyxXQUFMLEdBQW1CLENBQ2Y7QUFEZSxLQUFuQjtBQUdBLFNBQUtDLEtBQUwsR0FBYSxLQUFLQSxLQUFMLENBQVdDLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBYjtBQUNBLFNBQUtDLElBQUwsR0FBWSxLQUFLQSxJQUFMLENBQVVELElBQVYsQ0FBZSxJQUFmLENBQVo7QUFDQSxTQUFLRSxhQUFMLEdBQXFCLEtBQUtBLGFBQUwsQ0FBbUJGLElBQW5CLENBQXdCLElBQXhCLENBQXJCO0FBQ0g7O0FBRURELEVBQUFBLEtBQUssR0FBRztBQUNKSSxJQUFBQSxNQUFNLENBQUNDLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLEtBQUtGLGFBQXhDO0FBQ0g7O0FBRURELEVBQUFBLElBQUksR0FBRztBQUNIRSxJQUFBQSxNQUFNLENBQUNFLG1CQUFQLENBQTJCLFNBQTNCLEVBQXNDLEtBQUtILGFBQTNDO0FBQ0g7O0FBRURBLEVBQUFBLGFBQWEsQ0FBQ0ksRUFBRCxFQUFLO0FBQ2Q7QUFDQTtBQUNBLFVBQU1DLE9BQU8sR0FBR0QsRUFBRSxDQUFDRSxJQUFuQixDQUhjLENBSWQ7QUFDQTtBQUNBOztBQUNBLFFBQUlELE9BQU8sQ0FBQ0UsUUFBUixLQUFxQkMsU0FBekIsRUFBb0M7QUFDaEM7QUFDSDs7QUFDRCxVQUFNQyxPQUFPLEdBQUcsS0FBS2IsV0FBTCxDQUFpQlMsT0FBTyxDQUFDSyxTQUF6QixDQUFoQjs7QUFDQSxRQUFJLENBQUNELE9BQUwsRUFBYztBQUNWO0FBQ0g7O0FBQ0QsV0FBTyxLQUFLYixXQUFMLENBQWlCUyxPQUFPLENBQUNLLFNBQXpCLENBQVA7QUFDQUQsSUFBQUEsT0FBTyxDQUFDRSxPQUFSLENBQWdCTixPQUFoQjtBQUNILEdBcEN1QyxDQXNDeEM7OztBQUNBTyxFQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU0MsWUFBVCxFQUF1QkMsWUFBdkIsRUFBcUM7QUFDckNELElBQUFBLFlBQVksR0FBR0EsWUFBWSxJQUFJYixNQUFNLENBQUNlLE1BQXRDLENBRHFDLENBQ1M7O0FBQzlDRCxJQUFBQSxZQUFZLEdBQUdBLFlBQVksSUFBSSxHQUEvQjtBQUNBLFNBQUtwQixRQUFMLElBQWlCLENBQWpCO0FBQ0FrQixJQUFBQSxNQUFNLENBQUNILFNBQVAsR0FBbUJPLElBQUksQ0FBQ0MsR0FBTCxLQUFhLEdBQWIsR0FBbUJDLElBQUksQ0FBQ0MsTUFBTCxHQUFjQyxRQUFkLENBQXVCLEVBQXZCLENBQW5CLEdBQWdELEdBQWhELEdBQXNELEtBQUsxQixRQUE5RTtBQUVBLFdBQU8sSUFBSTJCLE9BQUosQ0FBWSxDQUFDWCxPQUFELEVBQVVZLE1BQVYsS0FBcUI7QUFDcEMsV0FBSzNCLFdBQUwsQ0FBaUJpQixNQUFNLENBQUNILFNBQXhCLElBQXFDO0FBQUNDLFFBQUFBLE9BQUQ7QUFBVVksUUFBQUE7QUFBVixPQUFyQztBQUNBVCxNQUFBQSxZQUFZLENBQUNVLFdBQWIsQ0FBeUJYLE1BQXpCLEVBQWlDRSxZQUFqQzs7QUFFQSxVQUFJLEtBQUtyQixVQUFMLEdBQWtCLENBQXRCLEVBQXlCO0FBQ3JCK0IsUUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDYixjQUFJLENBQUMsS0FBSzdCLFdBQUwsQ0FBaUJpQixNQUFNLENBQUNILFNBQXhCLENBQUwsRUFBeUM7QUFDckM7QUFDSDs7QUFDRGdCLFVBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLGlEQUFpREMsSUFBSSxDQUFDQyxTQUFMLENBQWVoQixNQUFmLENBQS9ELEVBQ0ksS0FBS2pCLFdBRFQ7O0FBRUEsZUFBS0EsV0FBTCxDQUFpQmlCLE1BQU0sQ0FBQ0gsU0FBeEIsRUFBbUNhLE1BQW5DLENBQTBDLElBQUlPLEtBQUosQ0FBVSxXQUFWLENBQTFDOztBQUNBLGlCQUFPLEtBQUtsQyxXQUFMLENBQWlCaUIsTUFBTSxDQUFDSCxTQUF4QixDQUFQO0FBQ0gsU0FSUyxFQVFQLEtBQUtoQixVQVJFLENBQVY7QUFTSDtBQUNKLEtBZk0sQ0FBUDtBQWdCSDs7QUE3RHVDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gY29uc3QgT1VUQk9VTkRfQVBJX05BTUUgPSAndG9XaWRnZXQnO1xuXG4vLyBJbml0aWF0ZSByZXF1ZXN0cyB1c2luZyB0aGUgXCJ0b1dpZGdldFwiIHBvc3RNZXNzYWdlIEFQSSBhbmQgaGFuZGxlIHJlc3BvbnNlc1xuLy8gTk9URTogVG9XaWRnZXRQb3N0TWVzc2FnZUFwaSBvbmx5IGhhbmRsZXMgbWVzc2FnZSBldmVudHMgd2l0aCBhIGRhdGEgcGF5bG9hZCB3aXRoIGFcbi8vIHJlc3BvbnNlIGZpZWxkXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUb1dpZGdldFBvc3RNZXNzYWdlQXBpIHtcbiAgICBjb25zdHJ1Y3Rvcih0aW1lb3V0TXMpIHtcbiAgICAgICAgdGhpcy5fdGltZW91dE1zID0gdGltZW91dE1zIHx8IDUwMDA7IC8vIGRlZmF1bHQgdG8gNXMgdGltZXJcbiAgICAgICAgdGhpcy5fY291bnRlciA9IDA7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RNYXAgPSB7XG4gICAgICAgICAgICAvLyAkSUQ6IHtyZXNvbHZlLCByZWplY3R9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuc3RvcCA9IHRoaXMuc3RvcC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uUG9zdE1lc3NhZ2UgPSB0aGlzLm9uUG9zdE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLm9uUG9zdE1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5vblBvc3RNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBvblBvc3RNZXNzYWdlKGV2KSB7XG4gICAgICAgIC8vIFRISVMgSVMgQUxMIFVOU0FGRSBFWEVDVVRJT04uXG4gICAgICAgIC8vIFdlIGRvIG5vdCB2ZXJpZnkgd2hvIHRoZSBzZW5kZXIgb2YgYGV2YCBpcyFcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGV2LmRhdGE7XG4gICAgICAgIC8vIE5PVEU6IFdvcmthcm91bmQgZm9yIHJ1bm5pbmcgaW4gYSBtb2JpbGUgV2ViVmlldyB3aGVyZSBhXG4gICAgICAgIC8vIHBvc3RNZXNzYWdlIGltbWVkaWF0ZWx5IHRyaWdnZXJzIHRoaXMgY2FsbGJhY2sgZXZlbiB0aG91Z2ggaXQgaXNcbiAgICAgICAgLy8gbm90IHRoZSByZXNwb25zZS5cbiAgICAgICAgaWYgKHBheWxvYWQucmVzcG9uc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLl9yZXF1ZXN0TWFwW3BheWxvYWQucmVxdWVzdElkXTtcbiAgICAgICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHRoaXMuX3JlcXVlc3RNYXBbcGF5bG9hZC5yZXF1ZXN0SWRdO1xuICAgICAgICBwcm9taXNlLnJlc29sdmUocGF5bG9hZCk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhdGUgb3V0Ym91bmQgcmVxdWVzdHMgKHRvV2lkZ2V0KVxuICAgIGV4ZWMoYWN0aW9uLCB0YXJnZXRXaW5kb3csIHRhcmdldE9yaWdpbikge1xuICAgICAgICB0YXJnZXRXaW5kb3cgPSB0YXJnZXRXaW5kb3cgfHwgd2luZG93LnBhcmVudDsgLy8gZGVmYXVsdCB0byBwYXJlbnQgd2luZG93XG4gICAgICAgIHRhcmdldE9yaWdpbiA9IHRhcmdldE9yaWdpbiB8fCBcIipcIjtcbiAgICAgICAgdGhpcy5fY291bnRlciArPSAxO1xuICAgICAgICBhY3Rpb24ucmVxdWVzdElkID0gRGF0ZS5ub3coKSArIFwiLVwiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikgKyBcIi1cIiArIHRoaXMuX2NvdW50ZXI7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RNYXBbYWN0aW9uLnJlcXVlc3RJZF0gPSB7cmVzb2x2ZSwgcmVqZWN0fTtcbiAgICAgICAgICAgIHRhcmdldFdpbmRvdy5wb3N0TWVzc2FnZShhY3Rpb24sIHRhcmdldE9yaWdpbik7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl90aW1lb3V0TXMgPiAwKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcmVxdWVzdE1hcFthY3Rpb24ucmVxdWVzdElkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwb3N0TWVzc2FnZSByZXF1ZXN0IHRpbWVkIG91dC4gU2VudCBvYmplY3Q6IFwiICsgSlNPTi5zdHJpbmdpZnkoYWN0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RNYXApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXF1ZXN0TWFwW2FjdGlvbi5yZXF1ZXN0SWRdLnJlamVjdChuZXcgRXJyb3IoXCJUaW1lZCBvdXRcIikpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVxdWVzdE1hcFthY3Rpb24ucmVxdWVzdElkXTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzLl90aW1lb3V0TXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=