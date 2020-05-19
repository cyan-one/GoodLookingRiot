"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetApi = exports.WidgetApiType = exports.KnownWidgetActions = exports.Capability = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _randomstring = require("matrix-js-sdk/src/randomstring");

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
// Dev note: This is largely inspired by Dimension. Used with permission.
// https://github.com/turt2live/matrix-dimension/blob/4f92d560266635e5a3c824606215b84e8c0b19f5/web/app/shared/services/scalar/scalar-widget.api.ts
let Capability;
exports.Capability = Capability;

(function (Capability) {
  Capability["Screenshot"] = "m.capability.screenshot";
  Capability["Sticker"] = "m.sticker";
  Capability["AlwaysOnScreen"] = "m.always_on_screen";
})(Capability || (exports.Capability = Capability = {}));

let KnownWidgetActions;
exports.KnownWidgetActions = KnownWidgetActions;

(function (KnownWidgetActions) {
  KnownWidgetActions["GetSupportedApiVersions"] = "supported_api_versions";
  KnownWidgetActions["TakeScreenshot"] = "screenshot";
  KnownWidgetActions["GetCapabilities"] = "capabilities";
  KnownWidgetActions["SendEvent"] = "send_event";
  KnownWidgetActions["UpdateVisibility"] = "visibility";
  KnownWidgetActions["ReceiveOpenIDCredentials"] = "openid_credentials";
  KnownWidgetActions["SetAlwaysOnScreen"] = "set_always_on_screen";
  KnownWidgetActions["ClientReady"] = "im.vector.ready";
})(KnownWidgetActions || (exports.KnownWidgetActions = KnownWidgetActions = {}));
/*:: export type WidgetAction = KnownWidgetActions | string;*/


let WidgetApiType;
exports.WidgetApiType = WidgetApiType;

(function (WidgetApiType) {
  WidgetApiType["ToWidget"] = "toWidget";
  WidgetApiType["FromWidget"] = "fromWidget";
})(WidgetApiType || (exports.WidgetApiType = WidgetApiType = {}));
/*:: export interface WidgetRequest {
    api: WidgetApiType;
    widgetId: string;
    requestId: string;
    data: any;
    action: WidgetAction;
}*/

/*:: export interface ToWidgetRequest extends WidgetRequest {
    api: WidgetApiType.ToWidget;
}*/

/*:: export interface FromWidgetRequest extends WidgetRequest {
    api: WidgetApiType.FromWidget;
    response: any;
}*/


/**
 * Handles Riot <--> Widget interactions for embedded/standalone widgets.
 */
class WidgetApi {
  /**
   * Set this to true if your widget is expecting a ready message from the client. False otherwise (default).
   */
  constructor(currentUrl
  /*: string*/
  , widgetId
  /*: string*/
  , requestedCapabilities
  /*: string[]*/
  ) {
    this.widgetId = widgetId;
    this.requestedCapabilities = requestedCapabilities;
    (0, _defineProperty2.default)(this, "origin", void 0);
    (0, _defineProperty2.default)(this, "inFlightRequests", {});
    (0, _defineProperty2.default)(this, "readyPromise", void 0);
    (0, _defineProperty2.default)(this, "readyPromiseResolve", void 0);
    (0, _defineProperty2.default)(this, "expectingExplicitReady", false);
    this.origin = new URL(currentUrl).origin;
    this.readyPromise = new Promise(resolve => this.readyPromiseResolve = resolve);
    window.addEventListener("message", event => {
      if (event.origin !== this.origin) return; // ignore: invalid origin

      if (!event.data) return; // invalid schema

      if (event.data.widgetId !== this.widgetId) return; // not for us

      const payload = event.data;

      if (payload.api === WidgetApiType.ToWidget && payload.action) {
        console.log("[WidgetAPI] Got request: ".concat(JSON.stringify(payload)));

        if (payload.action === KnownWidgetActions.GetCapabilities) {
          this.onCapabilitiesRequest(payload);

          if (!this.expectingExplicitReady) {
            this.readyPromiseResolve();
          }
        } else if (payload.action === KnownWidgetActions.ClientReady) {
          this.readyPromiseResolve(); // Automatically acknowledge so we can move on

          this.replyToRequest(payload, {});
        } else {
          console.warn("[WidgetAPI] Got unexpected action: ".concat(payload.action));
        }
      } else if (payload.api === WidgetApiType.FromWidget && this.inFlightRequests[payload.requestId]) {
        console.log("[WidgetAPI] Got reply: ".concat(JSON.stringify(payload)));
        const handler = this.inFlightRequests[payload.requestId];
        delete this.inFlightRequests[payload.requestId];
        handler(payload);
      } else {
        console.warn("[WidgetAPI] Unhandled payload: ".concat(JSON.stringify(payload)));
      }
    });
  }

  waitReady()
  /*: Promise<any>*/
  {
    return this.readyPromise;
  }

  replyToRequest(payload
  /*: ToWidgetRequest*/
  , reply
  /*: any*/
  ) {
    if (!window.parent) return;
    const request = JSON.parse(JSON.stringify(payload));
    request.response = reply;
    window.parent.postMessage(request, this.origin);
  }

  onCapabilitiesRequest(payload
  /*: ToWidgetRequest*/
  ) {
    return this.replyToRequest(payload, {
      capabilities: this.requestedCapabilities
    });
  }

  callAction(action
  /*: WidgetAction*/
  , payload
  /*: any*/
  , callback
  /*: (reply: FromWidgetRequest) => void*/
  ) {
    if (!window.parent) return;
    const request
    /*: FromWidgetRequest*/
    = {
      api: WidgetApiType.FromWidget,
      widgetId: this.widgetId,
      action: action,
      requestId: (0, _randomstring.randomString)(160),
      data: payload,
      response: {} // Not used at this layer - it's used when the client responds

    };

    if (callback) {
      this.inFlightRequests[request.requestId] = callback;
    }

    console.log("[WidgetAPI] Sending request: ", request);
    window.parent.postMessage(request, "*");
  }

  setAlwaysOnScreen(onScreen
  /*: boolean*/
  )
  /*: Promise<any>*/
  {
    return new Promise(resolve => {
      this.callAction(KnownWidgetActions.SetAlwaysOnScreen, {
        value: onScreen
      }, null);
      resolve(); // SetAlwaysOnScreen is currently fire-and-forget, but that could change.
    });
  }

}

exports.WidgetApi = WidgetApi;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93aWRnZXRzL1dpZGdldEFwaS50cyJdLCJuYW1lcyI6WyJDYXBhYmlsaXR5IiwiS25vd25XaWRnZXRBY3Rpb25zIiwiV2lkZ2V0QXBpVHlwZSIsIldpZGdldEFwaSIsImNvbnN0cnVjdG9yIiwiY3VycmVudFVybCIsIndpZGdldElkIiwicmVxdWVzdGVkQ2FwYWJpbGl0aWVzIiwib3JpZ2luIiwiVVJMIiwicmVhZHlQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWFkeVByb21pc2VSZXNvbHZlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiZGF0YSIsInBheWxvYWQiLCJhcGkiLCJUb1dpZGdldCIsImFjdGlvbiIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiR2V0Q2FwYWJpbGl0aWVzIiwib25DYXBhYmlsaXRpZXNSZXF1ZXN0IiwiZXhwZWN0aW5nRXhwbGljaXRSZWFkeSIsIkNsaWVudFJlYWR5IiwicmVwbHlUb1JlcXVlc3QiLCJ3YXJuIiwiRnJvbVdpZGdldCIsImluRmxpZ2h0UmVxdWVzdHMiLCJyZXF1ZXN0SWQiLCJoYW5kbGVyIiwid2FpdFJlYWR5IiwicmVwbHkiLCJwYXJlbnQiLCJyZXF1ZXN0IiwicGFyc2UiLCJyZXNwb25zZSIsInBvc3RNZXNzYWdlIiwiY2FwYWJpbGl0aWVzIiwiY2FsbEFjdGlvbiIsImNhbGxiYWNrIiwic2V0QWx3YXlzT25TY3JlZW4iLCJvblNjcmVlbiIsIlNldEFsd2F5c09uU2NyZWVuIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBO0FBQ0E7SUFJWUEsVTs7O1dBQUFBLFU7QUFBQUEsRUFBQUEsVTtBQUFBQSxFQUFBQSxVO0FBQUFBLEVBQUFBLFU7R0FBQUEsVSwwQkFBQUEsVTs7SUFNQUMsa0I7OztXQUFBQSxrQjtBQUFBQSxFQUFBQSxrQjtBQUFBQSxFQUFBQSxrQjtBQUFB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UUFBSUksUUFBSixFQUFjO0FBQ1YsV0FBS1osZ0JBQUwsQ0FBc0JNLE9BQU8sQ0FBQ0wsU0FBOUIsSUFBMkNXLFFBQTNDO0FBQ0g7O0FBRUR2QixJQUFBQSxPQUFPLENBQUNDLEdBQVIsa0NBQTZDZ0IsT0FBN0M7QUFDQXpCLElBQUFBLE1BQU0sQ0FBQ3dCLE1BQVAsQ0FBY0ksV0FBZCxDQUEwQkgsT0FBMUIsRUFBbUMsR0FBbkM7QUFDSDs7QUFFTU8sRUFBQUEsaUJBQVAsQ0FBeUJDO0FBQXpCO0FBQUE7QUFBQTtBQUEwRDtBQUN0RCxXQUFPLElBQUlwQyxPQUFKLENBQWlCQyxPQUFPLElBQUk7QUFDL0IsV0FBS2dDLFVBQUwsQ0FBZ0IzQyxrQkFBa0IsQ0FBQytDLGlCQUFuQyxFQUFzRDtBQUFDQyxRQUFBQSxLQUFLLEVBQUVGO0FBQVIsT0FBdEQsRUFBeUUsSUFBekU7QUFDQW5DLE1BQUFBLE9BQU8sR0FGd0IsQ0FFcEI7QUFDZCxLQUhNLENBQVA7QUFJSDs7QUEzRmtCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gRGV2IG5vdGU6IFRoaXMgaXMgbGFyZ2VseSBpbnNwaXJlZCBieSBEaW1lbnNpb24uIFVzZWQgd2l0aCBwZXJtaXNzaW9uLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3R1cnQybGl2ZS9tYXRyaXgtZGltZW5zaW9uL2Jsb2IvNGY5MmQ1NjAyNjY2MzVlNWEzYzgyNDYwNjIxNWI4NGU4YzBiMTlmNS93ZWIvYXBwL3NoYXJlZC9zZXJ2aWNlcy9zY2FsYXIvc2NhbGFyLXdpZGdldC5hcGkudHNcblxuaW1wb3J0IHsgcmFuZG9tU3RyaW5nIH0gZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL3JhbmRvbXN0cmluZ1wiO1xuXG5leHBvcnQgZW51bSBDYXBhYmlsaXR5IHtcbiAgICBTY3JlZW5zaG90ID0gXCJtLmNhcGFiaWxpdHkuc2NyZWVuc2hvdFwiLFxuICAgIFN0aWNrZXIgPSBcIm0uc3RpY2tlclwiLFxuICAgIEFsd2F5c09uU2NyZWVuID0gXCJtLmFsd2F5c19vbl9zY3JlZW5cIixcbn1cblxuZXhwb3J0IGVudW0gS25vd25XaWRnZXRBY3Rpb25zIHtcbiAgICBHZXRTdXBwb3J0ZWRBcGlWZXJzaW9ucyA9IFwic3VwcG9ydGVkX2FwaV92ZXJzaW9uc1wiLFxuICAgIFRha2VTY3JlZW5zaG90ID0gXCJzY3JlZW5zaG90XCIsXG4gICAgR2V0Q2FwYWJpbGl0aWVzID0gXCJjYXBhYmlsaXRpZXNcIixcbiAgICBTZW5kRXZlbnQgPSBcInNlbmRfZXZlbnRcIixcbiAgICBVcGRhdGVWaXNpYmlsaXR5ID0gXCJ2aXNpYmlsaXR5XCIsXG4gICAgUmVjZWl2ZU9wZW5JRENyZWRlbnRpYWxzID0gXCJvcGVuaWRfY3JlZGVudGlhbHNcIixcbiAgICBTZXRBbHdheXNPblNjcmVlbiA9IFwic2V0X2Fsd2F5c19vbl9zY3JlZW5cIixcbiAgICBDbGllbnRSZWFkeSA9IFwiaW0udmVjdG9yLnJlYWR5XCIsXG59XG5cbmV4cG9ydCB0eXBlIFdpZGdldEFjdGlvbiA9IEtub3duV2lkZ2V0QWN0aW9ucyB8IHN0cmluZztcblxuZXhwb3J0IGVudW0gV2lkZ2V0QXBpVHlwZSB7XG4gICAgVG9XaWRnZXQgPSBcInRvV2lkZ2V0XCIsXG4gICAgRnJvbVdpZGdldCA9IFwiZnJvbVdpZGdldFwiLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdpZGdldFJlcXVlc3Qge1xuICAgIGFwaTogV2lkZ2V0QXBpVHlwZTtcbiAgICB3aWRnZXRJZDogc3RyaW5nO1xuICAgIHJlcXVlc3RJZDogc3RyaW5nO1xuICAgIGRhdGE6IGFueTtcbiAgICBhY3Rpb246IFdpZGdldEFjdGlvbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUb1dpZGdldFJlcXVlc3QgZXh0ZW5kcyBXaWRnZXRSZXF1ZXN0IHtcbiAgICBhcGk6IFdpZGdldEFwaVR5cGUuVG9XaWRnZXQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnJvbVdpZGdldFJlcXVlc3QgZXh0ZW5kcyBXaWRnZXRSZXF1ZXN0IHtcbiAgICBhcGk6IFdpZGdldEFwaVR5cGUuRnJvbVdpZGdldDtcbiAgICByZXNwb25zZTogYW55O1xufVxuXG4vKipcbiAqIEhhbmRsZXMgUmlvdCA8LS0+IFdpZGdldCBpbnRlcmFjdGlvbnMgZm9yIGVtYmVkZGVkL3N0YW5kYWxvbmUgd2lkZ2V0cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFdpZGdldEFwaSB7XG4gICAgcHJpdmF0ZSBvcmlnaW46IHN0cmluZztcbiAgICBwcml2YXRlIGluRmxpZ2h0UmVxdWVzdHM6IHsgW3JlcXVlc3RJZDogc3RyaW5nXTogKHJlcGx5OiBGcm9tV2lkZ2V0UmVxdWVzdCkgPT4gdm9pZCB9ID0ge307XG4gICAgcHJpdmF0ZSByZWFkeVByb21pc2U6IFByb21pc2U8YW55PjtcbiAgICBwcml2YXRlIHJlYWR5UHJvbWlzZVJlc29sdmU6ICgpID0+IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhpcyB0byB0cnVlIGlmIHlvdXIgd2lkZ2V0IGlzIGV4cGVjdGluZyBhIHJlYWR5IG1lc3NhZ2UgZnJvbSB0aGUgY2xpZW50LiBGYWxzZSBvdGhlcndpc2UgKGRlZmF1bHQpLlxuICAgICAqL1xuICAgIHB1YmxpYyBleHBlY3RpbmdFeHBsaWNpdFJlYWR5ID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihjdXJyZW50VXJsOiBzdHJpbmcsIHByaXZhdGUgd2lkZ2V0SWQ6IHN0cmluZywgcHJpdmF0ZSByZXF1ZXN0ZWRDYXBhYmlsaXRpZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHRoaXMub3JpZ2luID0gbmV3IFVSTChjdXJyZW50VXJsKS5vcmlnaW47XG5cbiAgICAgICAgdGhpcy5yZWFkeVByb21pc2UgPSBuZXcgUHJvbWlzZTxhbnk+KHJlc29sdmUgPT4gdGhpcy5yZWFkeVByb21pc2VSZXNvbHZlID0gcmVzb2x2ZSk7XG5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5vcmlnaW4gIT09IHRoaXMub3JpZ2luKSByZXR1cm47IC8vIGlnbm9yZTogaW52YWxpZCBvcmlnaW5cbiAgICAgICAgICAgIGlmICghZXZlbnQuZGF0YSkgcmV0dXJuOyAvLyBpbnZhbGlkIHNjaGVtYVxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEud2lkZ2V0SWQgIT09IHRoaXMud2lkZ2V0SWQpIHJldHVybjsgLy8gbm90IGZvciB1c1xuXG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gPFdpZGdldFJlcXVlc3Q+ZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChwYXlsb2FkLmFwaSA9PT0gV2lkZ2V0QXBpVHlwZS5Ub1dpZGdldCAmJiBwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV2lkZ2V0QVBJXSBHb3QgcmVxdWVzdDogJHtKU09OLnN0cmluZ2lmeShwYXlsb2FkKX1gKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gS25vd25XaWRnZXRBY3Rpb25zLkdldENhcGFiaWxpdGllcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2FwYWJpbGl0aWVzUmVxdWVzdCg8VG9XaWRnZXRSZXF1ZXN0PnBheWxvYWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZXhwZWN0aW5nRXhwbGljaXRSZWFkeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWFkeVByb21pc2VSZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBheWxvYWQuYWN0aW9uID09PSBLbm93bldpZGdldEFjdGlvbnMuQ2xpZW50UmVhZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWFkeVByb21pc2VSZXNvbHZlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhY2tub3dsZWRnZSBzbyB3ZSBjYW4gbW92ZSBvblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGx5VG9SZXF1ZXN0KDxUb1dpZGdldFJlcXVlc3Q+cGF5bG9hZCwge30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dpZGdldEFQSV0gR290IHVuZXhwZWN0ZWQgYWN0aW9uOiAke3BheWxvYWQuYWN0aW9ufWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF5bG9hZC5hcGkgPT09IFdpZGdldEFwaVR5cGUuRnJvbVdpZGdldCAmJiB0aGlzLmluRmxpZ2h0UmVxdWVzdHNbcGF5bG9hZC5yZXF1ZXN0SWRdKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtXaWRnZXRBUEldIEdvdCByZXBseTogJHtKU09OLnN0cmluZ2lmeShwYXlsb2FkKX1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5pbkZsaWdodFJlcXVlc3RzW3BheWxvYWQucmVxdWVzdElkXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5pbkZsaWdodFJlcXVlc3RzW3BheWxvYWQucmVxdWVzdElkXTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyKDxGcm9tV2lkZ2V0UmVxdWVzdD5wYXlsb2FkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbV2lkZ2V0QVBJXSBVbmhhbmRsZWQgcGF5bG9hZDogJHtKU09OLnN0cmluZ2lmeShwYXlsb2FkKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHdhaXRSZWFkeSgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkeVByb21pc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXBseVRvUmVxdWVzdChwYXlsb2FkOiBUb1dpZGdldFJlcXVlc3QsIHJlcGx5OiBhbnkpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cucGFyZW50KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkpO1xuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlID0gcmVwbHk7XG5cbiAgICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZShyZXF1ZXN0LCB0aGlzLm9yaWdpbik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNhcGFiaWxpdGllc1JlcXVlc3QocGF5bG9hZDogVG9XaWRnZXRSZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcGx5VG9SZXF1ZXN0KHBheWxvYWQsIHtjYXBhYmlsaXRpZXM6IHRoaXMucmVxdWVzdGVkQ2FwYWJpbGl0aWVzfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGxBY3Rpb24oYWN0aW9uOiBXaWRnZXRBY3Rpb24sIHBheWxvYWQ6IGFueSwgY2FsbGJhY2s6IChyZXBseTogRnJvbVdpZGdldFJlcXVlc3QpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cucGFyZW50KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcmVxdWVzdDogRnJvbVdpZGdldFJlcXVlc3QgPSB7XG4gICAgICAgICAgICBhcGk6IFdpZGdldEFwaVR5cGUuRnJvbVdpZGdldCxcbiAgICAgICAgICAgIHdpZGdldElkOiB0aGlzLndpZGdldElkLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgICAgICByZXF1ZXN0SWQ6IHJhbmRvbVN0cmluZygxNjApLFxuICAgICAgICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICAgICAgICAgIHJlc3BvbnNlOiB7fSwgLy8gTm90IHVzZWQgYXQgdGhpcyBsYXllciAtIGl0J3MgdXNlZCB3aGVuIHRoZSBjbGllbnQgcmVzcG9uZHNcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5GbGlnaHRSZXF1ZXN0c1tyZXF1ZXN0LnJlcXVlc3RJZF0gPSBjYWxsYmFjaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBbV2lkZ2V0QVBJXSBTZW5kaW5nIHJlcXVlc3Q6IGAsIHJlcXVlc3QpO1xuICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHJlcXVlc3QsIFwiKlwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QWx3YXlzT25TY3JlZW4ob25TY3JlZW46IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PihyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFjdGlvbihLbm93bldpZGdldEFjdGlvbnMuU2V0QWx3YXlzT25TY3JlZW4sIHt2YWx1ZTogb25TY3JlZW59LCBudWxsKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTsgLy8gU2V0QWx3YXlzT25TY3JlZW4gaXMgY3VycmVudGx5IGZpcmUtYW5kLWZvcmdldCwgYnV0IHRoYXQgY291bGQgY2hhbmdlLlxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=