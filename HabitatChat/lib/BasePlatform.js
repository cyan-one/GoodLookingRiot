"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _matrixJsSdk = require("matrix-js-sdk");

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _BaseEventIndexManager = _interopRequireDefault(require("./indexing/BaseEventIndexManager"));

/*
Copyright 2016 Aviral Dasgupta
Copyright 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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

/**
 * Base class for classes that provide platform-specific functionality
 * eg. Setting an application badge or displaying notifications
 *
 * Instances of this class are provided by the application.
 */
class BasePlatform {
  constructor() {
    this.notificationCount = 0;
    this.errorDidOccur = false;

    _dispatcher.default.register(this._onAction.bind(this));
  }

  _onAction(payload
  /*: Object*/
  ) {
    switch (payload.action) {
      case 'on_client_not_viable':
      case 'on_logged_out':
        this.setNotificationCount(0);
        break;
    }
  } // Used primarily for Analytics


  getHumanReadableName()
  /*: string*/
  {
    return 'Base Platform';
  }

  setNotificationCount(count
  /*: number*/
  ) {
    this.notificationCount = count;
  }

  setErrorStatus(errorDidOccur
  /*: boolean*/
  ) {
    this.errorDidOccur = errorDidOccur;
  }
  /**
   * Returns true if the platform supports displaying
   * notifications, otherwise false.
   * @returns {boolean} whether the platform supports displaying notifications
   */


  supportsNotifications()
  /*: boolean*/
  {
    return false;
  }
  /**
   * Returns true if the application currently has permission
   * to display notifications. Otherwise false.
   * @returns {boolean} whether the application has permission to display notifications
   */


  maySendNotifications()
  /*: boolean*/
  {
    return false;
  }
  /**
   * Requests permission to send notifications. Returns
   * a promise that is resolved when the user has responded
   * to the request. The promise has a single string argument
   * that is 'granted' if the user allowed the request or
   * 'denied' otherwise.
   */


  requestNotificationPermission()
  /*: Promise<string>*/
  {}

  displayNotification(title
  /*: string*/
  , msg
  /*: string*/
  , avatarUrl
  /*: string*/
  , room
  /*: Object*/
  ) {}

  loudNotification(ev
  /*: Event*/
  , room
  /*: Object*/
  ) {}
  /**
   * Returns a promise that resolves to a string representing
   * the current version of the application.
   */


  getAppVersion()
  /*: Promise<string>*/
  {
    throw new Error("getAppVersion not implemented!");
  }
  /*
   * If it's not expected that capturing the screen will work
   * with getUserMedia, return a string explaining why not.
   * Otherwise, return null.
   */


  screenCaptureErrorString()
  /*: string*/
  {
    return "Not implemented";
  }
  /**
   * Restarts the application, without neccessarily reloading
   * any application code
   */


  reload() {
    throw new Error("reload not implemented!");
  }

  supportsAutoLaunch()
  /*: boolean*/
  {
    return false;
  } // XXX: Surely this should be a setting like any other?


  async getAutoLaunchEnabled()
  /*: boolean*/
  {
    return false;
  }

  async setAutoLaunchEnabled(enabled
  /*: boolean*/
  )
  /*: void*/
  {
    throw new Error("Unimplemented");
  }

  supportsAutoHideMenuBar()
  /*: boolean*/
  {
    return false;
  }

  async getAutoHideMenuBarEnabled()
  /*: boolean*/
  {
    return false;
  }

  async setAutoHideMenuBarEnabled(enabled
  /*: boolean*/
  )
  /*: void*/
  {
    throw new Error("Unimplemented");
  }

  supportsMinimizeToTray()
  /*: boolean*/
  {
    return false;
  }

  async getMinimizeToTrayEnabled()
  /*: boolean*/
  {
    return false;
  }

  async setMinimizeToTrayEnabled(enabled
  /*: boolean*/
  )
  /*: void*/
  {
    throw new Error("Unimplemented");
  }
  /**
   * Get our platform specific EventIndexManager.
   *
   * @return {BaseEventIndexManager} The EventIndex manager for our platform,
   * can be null if the platform doesn't support event indexing.
   */


  getEventIndexingManager()
  /*: BaseEventIndexManager | null*/
  {
    return null;
  }

  setLanguage(preferredLangs
  /*: string[]*/
  ) {}

  getSSOCallbackUrl(hsUrl
  /*: string*/
  , isUrl
  /*: string*/
  , fragmentAfterLogin
  /*: string*/
  )
  /*: URL*/
  {
    const url = new URL(window.location.href);
    url.hash = fragmentAfterLogin || "";
    url.searchParams.set("homeserver", hsUrl);
    url.searchParams.set("identityServer", isUrl);
    return url;
  }
  /**
   * Begin Single Sign On flows.
   * @param {MatrixClient} mxClient the matrix client using which we should start the flow
   * @param {"sso"|"cas"} loginType the type of SSO it is, CAS/SSO.
   * @param {string} fragmentAfterLogin the hash to pass to the app during sso callback.
   */


  startSingleSignOn(mxClient
  /*: MatrixClient*/
  , loginType
  /*: "sso" | "cas"*/
  , fragmentAfterLogin
  /*: string*/
  ) {
    const callbackUrl = this.getSSOCallbackUrl(mxClient.getHomeserverUrl(), mxClient.getIdentityServerUrl(), fragmentAfterLogin);
    window.location.href = mxClient.getSsoLoginUrl(callbackUrl.toString(), loginType); // redirect to SSO
  }

  onKeyDown(ev
  /*: KeyboardEvent*/
  )
  /*: boolean*/
  {
    return false; // no shortcuts implemented
  }

}

exports.default = BasePlatform;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9CYXNlUGxhdGZvcm0uanMiXSwibmFtZXMiOlsiQmFzZVBsYXRmb3JtIiwiY29uc3RydWN0b3IiLCJub3RpZmljYXRpb25Db3VudCIsImVycm9yRGlkT2NjdXIiLCJkaXMiLCJyZWdpc3RlciIsIl9vbkFjdGlvbiIsImJpbmQiLCJwYXlsb2FkIiwiYWN0aW9uIiwic2V0Tm90aWZpY2F0aW9uQ291bnQiLCJnZXRIdW1hblJlYWRhYmxlTmFtZSIsImNvdW50Iiwic2V0RXJyb3JTdGF0dXMiLCJzdXBwb3J0c05vdGlmaWNhdGlvbnMiLCJtYXlTZW5kTm90aWZpY2F0aW9ucyIsInJlcXVlc3ROb3RpZmljYXRpb25QZXJtaXNzaW9uIiwiZGlzcGxheU5vdGlmaWNhdGlvbiIsInRpdGxlIiwibXNnIiwiYXZhdGFyVXJsIiwicm9vbSIsImxvdWROb3RpZmljYXRpb24iLCJldiIsImdldEFwcFZlcnNpb24iLCJFcnJvciIsInNjcmVlbkNhcHR1cmVFcnJvclN0cmluZyIsInJlbG9hZCIsInN1cHBvcnRzQXV0b0xhdW5jaCIsImdldEF1dG9MYXVuY2hFbmFibGVkIiwic2V0QXV0b0xhdW5jaEVuYWJsZWQiLCJlbmFibGVkIiwic3VwcG9ydHNBdXRvSGlkZU1lbnVCYXIiLCJnZXRBdXRvSGlkZU1lbnVCYXJFbmFibGVkIiwic2V0QXV0b0hpZGVNZW51QmFyRW5hYmxlZCIsInN1cHBvcnRzTWluaW1pemVUb1RyYXkiLCJnZXRNaW5pbWl6ZVRvVHJheUVuYWJsZWQiLCJzZXRNaW5pbWl6ZVRvVHJheUVuYWJsZWQiLCJnZXRFdmVudEluZGV4aW5nTWFuYWdlciIsInNldExhbmd1YWdlIiwicHJlZmVycmVkTGFuZ3MiLCJnZXRTU09DYWxsYmFja1VybCIsImhzVXJsIiwiaXNVcmwiLCJmcmFnbWVudEFmdGVyTG9naW4iLCJ1cmwiLCJVUkwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJoYXNoIiwic2VhcmNoUGFyYW1zIiwic2V0Iiwic3RhcnRTaW5nbGVTaWduT24iLCJteENsaWVudCIsImxvZ2luVHlwZSIsImNhbGxiYWNrVXJsIiwiZ2V0SG9tZXNlcnZlclVybCIsImdldElkZW50aXR5U2VydmVyVXJsIiwiZ2V0U3NvTG9naW5VcmwiLCJ0b1N0cmluZyIsIm9uS2V5RG93biJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBcUJBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCQTs7Ozs7O0FBTWUsTUFBTUEsWUFBTixDQUFtQjtBQUM5QkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsaUJBQUwsR0FBeUIsQ0FBekI7QUFDQSxTQUFLQyxhQUFMLEdBQXFCLEtBQXJCOztBQUVBQyx3QkFBSUMsUUFBSixDQUFhLEtBQUtDLFNBQUwsQ0FBZUMsSUFBZixDQUFvQixJQUFwQixDQUFiO0FBQ0g7O0FBRURELEVBQUFBLFNBQVMsQ0FBQ0U7QUFBRDtBQUFBLElBQWtCO0FBQ3ZCLFlBQVFBLE9BQU8sQ0FBQ0MsTUFBaEI7QUFDSSxXQUFLLHNCQUFMO0FBQ0EsV0FBSyxlQUFMO0FBQ0ksYUFBS0Msb0JBQUwsQ0FBMEIsQ0FBMUI7QUFDQTtBQUpSO0FBTUgsR0FmNkIsQ0FpQjlCOzs7QUFDQUMsRUFBQUEsb0JBQW9CO0FBQUE7QUFBVztBQUMzQixXQUFPLGVBQVA7QUFDSDs7QUFFREQsRUFBQUEsb0JBQW9CLENBQUNFO0FBQUQ7QUFBQSxJQUFnQjtBQUNoQyxTQUFLVixpQkFBTCxHQUF5QlUsS0FBekI7QUFDSDs7QUFFREMsRUFBQUEsY0FBYyxDQUFDVjtBQUFEO0FBQUEsSUFBeUI7QUFDbkMsU0FBS0EsYUFBTCxHQUFxQkEsYUFBckI7QUFDSDtBQUVEOzs7Ozs7O0FBS0FXLEVBQUFBLHFCQUFxQjtBQUFBO0FBQVk7QUFDN0IsV0FBTyxLQUFQO0FBQ0g7QUFFRDs7Ozs7OztBQUtBQyxFQUFBQSxvQkFBb0I7QUFBQTtBQUFZO0FBQzVCLFdBQU8sS0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7OztBQU9BQyxFQUFBQSw2QkFBNkI7QUFBQTtBQUFvQixH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O0FBQUQ7QUFBQTtBQUFBO0FBQTZCO0FBQ2xDLFdBQU8sS0FBUCxDQURrQyxDQUNwQjtBQUNqQjs7QUFoSzZCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuLypcbkNvcHlyaWdodCAyMDE2IEF2aXJhbCBEYXNndXB0YVxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7TWF0cml4Q2xpZW50fSBmcm9tIFwibWF0cml4LWpzLXNka1wiO1xuaW1wb3J0IGRpcyBmcm9tICcuL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgQmFzZUV2ZW50SW5kZXhNYW5hZ2VyIGZyb20gJy4vaW5kZXhpbmcvQmFzZUV2ZW50SW5kZXhNYW5hZ2VyJztcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBjbGFzc2VzIHRoYXQgcHJvdmlkZSBwbGF0Zm9ybS1zcGVjaWZpYyBmdW5jdGlvbmFsaXR5XG4gKiBlZy4gU2V0dGluZyBhbiBhcHBsaWNhdGlvbiBiYWRnZSBvciBkaXNwbGF5aW5nIG5vdGlmaWNhdGlvbnNcbiAqXG4gKiBJbnN0YW5jZXMgb2YgdGhpcyBjbGFzcyBhcmUgcHJvdmlkZWQgYnkgdGhlIGFwcGxpY2F0aW9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCYXNlUGxhdGZvcm0ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbkNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5lcnJvckRpZE9jY3VyID0gZmFsc2U7XG5cbiAgICAgICAgZGlzLnJlZ2lzdGVyKHRoaXMuX29uQWN0aW9uLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIF9vbkFjdGlvbihwYXlsb2FkOiBPYmplY3QpIHtcbiAgICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnb25fY2xpZW50X25vdF92aWFibGUnOlxuICAgICAgICAgICAgY2FzZSAnb25fbG9nZ2VkX291dCc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXROb3RpZmljYXRpb25Db3VudCgwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVzZWQgcHJpbWFyaWx5IGZvciBBbmFseXRpY3NcbiAgICBnZXRIdW1hblJlYWRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ0Jhc2UgUGxhdGZvcm0nO1xuICAgIH1cblxuICAgIHNldE5vdGlmaWNhdGlvbkNvdW50KGNvdW50OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5ub3RpZmljYXRpb25Db3VudCA9IGNvdW50O1xuICAgIH1cblxuICAgIHNldEVycm9yU3RhdHVzKGVycm9yRGlkT2NjdXI6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5lcnJvckRpZE9jY3VyID0gZXJyb3JEaWRPY2N1cjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHBsYXRmb3JtIHN1cHBvcnRzIGRpc3BsYXlpbmdcbiAgICAgKiBub3RpZmljYXRpb25zLCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIHBsYXRmb3JtIHN1cHBvcnRzIGRpc3BsYXlpbmcgbm90aWZpY2F0aW9uc1xuICAgICAqL1xuICAgIHN1cHBvcnRzTm90aWZpY2F0aW9ucygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYXBwbGljYXRpb24gY3VycmVudGx5IGhhcyBwZXJtaXNzaW9uXG4gICAgICogdG8gZGlzcGxheSBub3RpZmljYXRpb25zLiBPdGhlcndpc2UgZmFsc2UuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGFwcGxpY2F0aW9uIGhhcyBwZXJtaXNzaW9uIHRvIGRpc3BsYXkgbm90aWZpY2F0aW9uc1xuICAgICAqL1xuICAgIG1heVNlbmROb3RpZmljYXRpb25zKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgcGVybWlzc2lvbiB0byBzZW5kIG5vdGlmaWNhdGlvbnMuIFJldHVybnNcbiAgICAgKiBhIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSB1c2VyIGhhcyByZXNwb25kZWRcbiAgICAgKiB0byB0aGUgcmVxdWVzdC4gVGhlIHByb21pc2UgaGFzIGEgc2luZ2xlIHN0cmluZyBhcmd1bWVudFxuICAgICAqIHRoYXQgaXMgJ2dyYW50ZWQnIGlmIHRoZSB1c2VyIGFsbG93ZWQgdGhlIHJlcXVlc3Qgb3JcbiAgICAgKiAnZGVuaWVkJyBvdGhlcndpc2UuXG4gICAgICovXG4gICAgcmVxdWVzdE5vdGlmaWNhdGlvblBlcm1pc3Npb24oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB9XG5cbiAgICBkaXNwbGF5Tm90aWZpY2F0aW9uKHRpdGxlOiBzdHJpbmcsIG1zZzogc3RyaW5nLCBhdmF0YXJVcmw6IHN0cmluZywgcm9vbTogT2JqZWN0KSB7XG4gICAgfVxuXG4gICAgbG91ZE5vdGlmaWNhdGlvbihldjogRXZlbnQsIHJvb206IE9iamVjdCkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgcmVwcmVzZW50aW5nXG4gICAgICogdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgYXBwbGljYXRpb24uXG4gICAgICovXG4gICAgZ2V0QXBwVmVyc2lvbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnZXRBcHBWZXJzaW9uIG5vdCBpbXBsZW1lbnRlZCFcIik7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBJZiBpdCdzIG5vdCBleHBlY3RlZCB0aGF0IGNhcHR1cmluZyB0aGUgc2NyZWVuIHdpbGwgd29ya1xuICAgICAqIHdpdGggZ2V0VXNlck1lZGlhLCByZXR1cm4gYSBzdHJpbmcgZXhwbGFpbmluZyB3aHkgbm90LlxuICAgICAqIE90aGVyd2lzZSwgcmV0dXJuIG51bGwuXG4gICAgICovXG4gICAgc2NyZWVuQ2FwdHVyZUVycm9yU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBcIk5vdCBpbXBsZW1lbnRlZFwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc3RhcnRzIHRoZSBhcHBsaWNhdGlvbiwgd2l0aG91dCBuZWNjZXNzYXJpbHkgcmVsb2FkaW5nXG4gICAgICogYW55IGFwcGxpY2F0aW9uIGNvZGVcbiAgICAgKi9cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInJlbG9hZCBub3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgIH1cblxuICAgIHN1cHBvcnRzQXV0b0xhdW5jaCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFhYWDogU3VyZWx5IHRoaXMgc2hvdWxkIGJlIGEgc2V0dGluZyBsaWtlIGFueSBvdGhlcj9cbiAgICBhc3luYyBnZXRBdXRvTGF1bmNoRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGFzeW5jIHNldEF1dG9MYXVuY2hFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBzdXBwb3J0c0F1dG9IaWRlTWVudUJhcigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEF1dG9IaWRlTWVudUJhckVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhc3luYyBzZXRBdXRvSGlkZU1lbnVCYXJFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBzdXBwb3J0c01pbmltaXplVG9UcmF5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0TWluaW1pemVUb1RyYXlFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYXN5bmMgc2V0TWluaW1pemVUb1RyYXlFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgb3VyIHBsYXRmb3JtIHNwZWNpZmljIEV2ZW50SW5kZXhNYW5hZ2VyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7QmFzZUV2ZW50SW5kZXhNYW5hZ2VyfSBUaGUgRXZlbnRJbmRleCBtYW5hZ2VyIGZvciBvdXIgcGxhdGZvcm0sXG4gICAgICogY2FuIGJlIG51bGwgaWYgdGhlIHBsYXRmb3JtIGRvZXNuJ3Qgc3VwcG9ydCBldmVudCBpbmRleGluZy5cbiAgICAgKi9cbiAgICBnZXRFdmVudEluZGV4aW5nTWFuYWdlcigpOiBCYXNlRXZlbnRJbmRleE1hbmFnZXIgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgc2V0TGFuZ3VhZ2UocHJlZmVycmVkTGFuZ3M6IHN0cmluZ1tdKSB7fVxuXG4gICAgZ2V0U1NPQ2FsbGJhY2tVcmwoaHNVcmw6IHN0cmluZywgaXNVcmw6IHN0cmluZywgZnJhZ21lbnRBZnRlckxvZ2luOiBzdHJpbmcpOiBVUkwge1xuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgdXJsLmhhc2ggPSBmcmFnbWVudEFmdGVyTG9naW4gfHwgXCJcIjtcbiAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJob21lc2VydmVyXCIsIGhzVXJsKTtcbiAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJpZGVudGl0eVNlcnZlclwiLCBpc1VybCk7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmVnaW4gU2luZ2xlIFNpZ24gT24gZmxvd3MuXG4gICAgICogQHBhcmFtIHtNYXRyaXhDbGllbnR9IG14Q2xpZW50IHRoZSBtYXRyaXggY2xpZW50IHVzaW5nIHdoaWNoIHdlIHNob3VsZCBzdGFydCB0aGUgZmxvd1xuICAgICAqIEBwYXJhbSB7XCJzc29cInxcImNhc1wifSBsb2dpblR5cGUgdGhlIHR5cGUgb2YgU1NPIGl0IGlzLCBDQVMvU1NPLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmcmFnbWVudEFmdGVyTG9naW4gdGhlIGhhc2ggdG8gcGFzcyB0byB0aGUgYXBwIGR1cmluZyBzc28gY2FsbGJhY2suXG4gICAgICovXG4gICAgc3RhcnRTaW5nbGVTaWduT24obXhDbGllbnQ6IE1hdHJpeENsaWVudCwgbG9naW5UeXBlOiBcInNzb1wiIHwgXCJjYXNcIiwgZnJhZ21lbnRBZnRlckxvZ2luOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tVcmwgPSB0aGlzLmdldFNTT0NhbGxiYWNrVXJsKG14Q2xpZW50LmdldEhvbWVzZXJ2ZXJVcmwoKSwgbXhDbGllbnQuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKSxcbiAgICAgICAgICAgIGZyYWdtZW50QWZ0ZXJMb2dpbik7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbXhDbGllbnQuZ2V0U3NvTG9naW5VcmwoY2FsbGJhY2tVcmwudG9TdHJpbmcoKSwgbG9naW5UeXBlKTsgLy8gcmVkaXJlY3QgdG8gU1NPXG4gICAgfVxuXG4gICAgb25LZXlEb3duKGV2OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gc2hvcnRjdXRzIGltcGxlbWVudGVkXG4gICAgfVxufVxuIl19