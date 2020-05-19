"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _url = _interopRequireDefault(require("url"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _WidgetMessagingEndpoint = _interopRequireDefault(require("./WidgetMessagingEndpoint"));

var _ActiveWidgetStore = _interopRequireDefault(require("./stores/ActiveWidgetStore"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var _RoomViewStore = _interopRequireDefault(require("./stores/RoomViewStore"));

var _IntegrationManagers = require("./integrations/IntegrationManagers");

var _SettingsStore = _interopRequireDefault(require("./settings/SettingsStore"));

var _WidgetApi = require("./widgets/WidgetApi");

/*
Copyright 2018 New Vector Ltd
Copyright 2019 Travis Ralston
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const WIDGET_API_VERSION = '0.0.2'; // Current API version

const SUPPORTED_WIDGET_API_VERSIONS = ['0.0.1', '0.0.2'];
const INBOUND_API_NAME = 'fromWidget'; // Listen for and handle incoming requests using the 'fromWidget' postMessage
// API and initiate responses

class FromWidgetPostMessageApi {
  constructor() {
    this.widgetMessagingEndpoints = [];
    this.widgetListeners = {}; // {action: func[]}

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
  /**
   * Adds a listener for a given action
   * @param {string} action The action to listen for.
   * @param {Function} callbackFn A callback function to be called when the action is
   * encountered. Called with two parameters: the interesting request information and
   * the raw event received from the postMessage API. The raw event is meant to be used
   * for sendResponse and similar functions.
   */


  addListener(action, callbackFn) {
    if (!this.widgetListeners[action]) this.widgetListeners[action] = [];
    this.widgetListeners[action].push(callbackFn);
  }
  /**
   * Removes a listener for a given action.
   * @param {string} action The action that was subscribed to.
   * @param {Function} callbackFn The original callback function that was used to subscribe
   * to updates.
   */


  removeListener(action, callbackFn) {
    if (!this.widgetListeners[action]) return;
    const idx = this.widgetListeners[action].indexOf(callbackFn);
    if (idx !== -1) this.widgetListeners[action].splice(idx, 1);
  }
  /**
   * Register a widget endpoint for trusted postMessage communication
   * @param {string} widgetId    Unique widget identifier
   * @param {string} endpointUrl Widget wurl origin (protocol + (optional port) + host)
   */


  addEndpoint(widgetId, endpointUrl) {
    const u = _url.default.parse(endpointUrl);

    if (!u || !u.protocol || !u.host) {
      console.warn('Add FromWidgetPostMessageApi endpoint - Invalid origin:', endpointUrl);
      return;
    }

    const origin = u.protocol + '//' + u.host;
    const endpoint = new _WidgetMessagingEndpoint.default(widgetId, origin);

    if (this.widgetMessagingEndpoints.some(function (ep) {
      return ep.widgetId === widgetId && ep.endpointUrl === endpointUrl;
    })) {
      // Message endpoint already registered
      console.warn('Add FromWidgetPostMessageApi - Endpoint already registered');
      return;
    } else {
      console.log("Adding fromWidget messaging endpoint for ".concat(widgetId), endpoint);
      this.widgetMessagingEndpoints.push(endpoint);
    }
  }
  /**
   * De-register a widget endpoint from trusted communication sources
   * @param  {string} widgetId Unique widget identifier
   * @param  {string} endpointUrl Widget wurl origin (protocol + (optional port) + host)
   * @return {boolean} True if endpoint was successfully removed
   */


  removeEndpoint(widgetId, endpointUrl) {
    const u = _url.default.parse(endpointUrl);

    if (!u || !u.protocol || !u.host) {
      console.warn('Remove widget messaging endpoint - Invalid origin');
      return;
    }

    const origin = u.protocol + '//' + u.host;

    if (this.widgetMessagingEndpoints && this.widgetMessagingEndpoints.length > 0) {
      const length = this.widgetMessagingEndpoints.length;
      this.widgetMessagingEndpoints = this.widgetMessagingEndpoints.filter(endpoint => endpoint.widgetId !== widgetId || endpoint.endpointUrl !== origin);
      return length > this.widgetMessagingEndpoints.length;
    }

    return false;
  }
  /**
   * Handle widget postMessage events
   * Messages are only handled where a valid, registered messaging endpoints
   * @param  {Event} event Event to handle
   * @return {undefined}
   */


  onPostMessage(event) {
    if (!event.origin) {
      // Handle chrome
      event.origin = event.originalEvent.origin;
    } // Event origin is empty string if undefined


    if (event.origin.length === 0 || !this.trustedEndpoint(event.origin) || event.data.api !== INBOUND_API_NAME || !event.data.widgetId) {
      return; // don't log this - debugging APIs like to spam postMessage which floods the log otherwise
    } // Call any listeners we have registered


    if (this.widgetListeners[event.data.action]) {
      for (const fn of this.widgetListeners[event.data.action]) {
        fn(event.data, event);
      }
    } // Although the requestId is required, we don't use it. We'll be nice and process the message
    // if the property is missing, but with a warning for widget developers.


    if (!event.data.requestId) {
      console.warn("fromWidget action '" + event.data.action + "' does not have a requestId");
    }

    const action = event.data.action;
    const widgetId = event.data.widgetId;

    if (action === 'content_loaded') {
      console.log('Widget reported content loaded for', widgetId);

      _dispatcher.default.dispatch({
        action: 'widget_content_loaded',
        widgetId: widgetId
      });

      this.sendResponse(event, {
        success: true
      });
    } else if (action === 'supported_api_versions') {
      this.sendResponse(event, {
        api: INBOUND_API_NAME,
        supported_versions: SUPPORTED_WIDGET_API_VERSIONS
      });
    } else if (action === 'api_version') {
      this.sendResponse(event, {
        api: INBOUND_API_NAME,
        version: WIDGET_API_VERSION
      });
    } else if (action === 'm.sticker') {
      // console.warn('Got sticker message from widget', widgetId);
      // NOTE -- The widgetData field is deprecated (in favour of the 'data' field) and will be removed eventually
      const data = event.data.data || event.data.widgetData;

      _dispatcher.default.dispatch({
        action: 'm.sticker',
        data: data,
        widgetId: event.data.widgetId
      });
    } else if (action === 'integration_manager_open') {
      // Close the stickerpicker
      _dispatcher.default.dispatch({
        action: 'stickerpicker_close'
      }); // Open the integration manager
      // NOTE -- The widgetData field is deprecated (in favour of the 'data' field) and will be removed eventually


      const data = event.data.data || event.data.widgetData;
      const integType = data && data.integType ? data.integType : null;
      const integId = data && data.integId ? data.integId : null; // TODO: Open the right integration manager for the widget

      if (_SettingsStore.default.isFeatureEnabled("feature_many_integration_managers")) {
        _IntegrationManagers.IntegrationManagers.sharedInstance().openAll(_MatrixClientPeg.MatrixClientPeg.get().getRoom(_RoomViewStore.default.getRoomId()), "type_".concat(integType), integId);
      } else {
        _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager().open(_MatrixClientPeg.MatrixClientPeg.get().getRoom(_RoomViewStore.default.getRoomId()), "type_".concat(integType), integId);
      }
    } else if (action === 'set_always_on_screen') {
      // This is a new message: there is no reason to support the deprecated widgetData here
      const data = event.data.data;
      const val = data.value;

      if (_ActiveWidgetStore.default.widgetHasCapability(widgetId, _WidgetApi.Capability.AlwaysOnScreen)) {
        _ActiveWidgetStore.default.setWidgetPersistence(widgetId, val);
      }
    } else if (action === 'get_openid') {// Handled by caller
    } else {
      console.warn('Widget postMessage event unhandled');
      this.sendError(event, {
        message: 'The postMessage was unhandled'
      });
    }
  }
  /**
   * Check if message origin is registered as trusted
   * @param  {string} origin PostMessage origin to check
   * @return {boolean}       True if trusted
   */


  trustedEndpoint(origin) {
    if (!origin) {
      return false;
    }

    return this.widgetMessagingEndpoints.some(endpoint => {
      // TODO / FIXME -- Should this also check the widgetId?
      return endpoint.endpointUrl === origin;
    });
  }
  /**
   * Send a postmessage response to a postMessage request
   * @param  {Event} event  The original postMessage request event
   * @param  {Object} res   Response data
   */


  sendResponse(event, res) {
    const data = JSON.parse(JSON.stringify(event.data));
    data.response = res;
    event.source.postMessage(data, event.origin);
  }
  /**
   * Send an error response to a postMessage request
   * @param  {Event} event        The original postMessage request event
   * @param  {string} msg         Error message
   * @param  {Error} nestedError  Nested error event (optional)
   */


  sendError(event, msg, nestedError) {
    console.error('Action:' + event.data.action + ' failed with message: ' + msg);
    const data = JSON.parse(JSON.stringify(event.data));
    data.response = {
      error: {
        message: msg
      }
    };

    if (nestedError) {
      data.response.error._error = nestedError;
    }

    event.source.postMessage(data, event.origin);
  }

}

exports.default = FromWidgetPostMessageApi;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Gcm9tV2lkZ2V0UG9zdE1lc3NhZ2VBcGkuanMiXSwibmFtZXMiOlsiV0lER0VUX0FQSV9WRVJTSU9OIiwiU1VQUE9SVEVEX1dJREdFVF9BUElfVkVSU0lPTlMiLCJJTkJPVU5EX0FQSV9OQU1FIiwiRnJvbVdpZGdldFBvc3RNZXNzYWdlQXBpIiwiY29uc3RydWN0b3IiLCJ3aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMiLCJ3aWRnZXRMaXN0ZW5lcnMiLCJzdGFydCIsImJpbmQiLCJzdG9wIiwib25Qb3N0TWVzc2FnZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiYWRkTGlzdGVuZXIiLCJhY3Rpb24iLCJjYWxsYmFja0ZuIiwicHVzaCIsInJlbW92ZUxpc3RlbmVyIiwiaWR4IiwiaW5kZXhPZiIsInNwbGljZSIsImFkZEVuZHBvaW50Iiwid2lkZ2V0SWQiLCJlbmRwb2ludFVybCIsInUiLCJVUkwiLCJwYXJzZSIsInByb3RvY29sIiwiaG9zdCIsImNvbnNvbGUiLCJ3YXJuIiwib3JpZ2luIiwiZW5kcG9pbnQiLCJXaWRnZXRNZXNzYWdpbmdFbmRwb2ludCIsInNvbWUiLCJlcCIsImxvZyIsInJlbW92ZUVuZHBvaW50IiwibGVuZ3RoIiwiZmlsdGVyIiwiZXZlbnQiLCJvcmlnaW5hbEV2ZW50IiwidHJ1c3RlZEVuZHBvaW50IiwiZGF0YSIsImFwaSIsImZuIiwicmVxdWVzdElkIiwiZGlzIiwiZGlzcGF0Y2giLCJzZW5kUmVzcG9uc2UiLCJzdWNjZXNzIiwic3VwcG9ydGVkX3ZlcnNpb25zIiwidmVyc2lvbiIsIndpZGdldERhdGEiLCJpbnRlZ1R5cGUiLCJpbnRlZ0lkIiwiU2V0dGluZ3NTdG9yZSIsImlzRmVhdHVyZUVuYWJsZWQiLCJJbnRlZ3JhdGlvbk1hbmFnZXJzIiwic2hhcmVkSW5zdGFuY2UiLCJvcGVuQWxsIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0Um9vbSIsIlJvb21WaWV3U3RvcmUiLCJnZXRSb29tSWQiLCJnZXRQcmltYXJ5TWFuYWdlciIsIm9wZW4iLCJ2YWwiLCJ2YWx1ZSIsIkFjdGl2ZVdpZGdldFN0b3JlIiwid2lkZ2V0SGFzQ2FwYWJpbGl0eSIsIkNhcGFiaWxpdHkiLCJBbHdheXNPblNjcmVlbiIsInNldFdpZGdldFBlcnNpc3RlbmNlIiwic2VuZEVycm9yIiwibWVzc2FnZSIsInJlcyIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXNwb25zZSIsInNvdXJjZSIsInBvc3RNZXNzYWdlIiwibXNnIiwibmVzdGVkRXJyb3IiLCJlcnJvciIsIl9lcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTFCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkEsTUFBTUEsa0JBQWtCLEdBQUcsT0FBM0IsQyxDQUFvQzs7QUFDcEMsTUFBTUMsNkJBQTZCLEdBQUcsQ0FDbEMsT0FEa0MsRUFFbEMsT0FGa0MsQ0FBdEM7QUFJQSxNQUFNQyxnQkFBZ0IsR0FBRyxZQUF6QixDLENBRUE7QUFDQTs7QUFDZSxNQUFNQyx3QkFBTixDQUErQjtBQUMxQ0MsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0Msd0JBQUwsR0FBZ0MsRUFBaEM7QUFDQSxTQUFLQyxlQUFMLEdBQXVCLEVBQXZCLENBRlUsQ0FFaUI7O0FBRTNCLFNBQUtDLEtBQUwsR0FBYSxLQUFLQSxLQUFMLENBQVdDLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBYjtBQUNBLFNBQUtDLElBQUwsR0FBWSxLQUFLQSxJQUFMLENBQVVELElBQVYsQ0FBZSxJQUFmLENBQVo7QUFDQSxTQUFLRSxhQUFMLEdBQXFCLEtBQUtBLGFBQUwsQ0FBbUJGLElBQW5CLENBQXdCLElBQXhCLENBQXJCO0FBQ0g7O0FBRURELEVBQUFBLEtBQUssR0FBRztBQUNKSSxJQUFBQSxNQUFNLENBQUNDLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLEtBQUtGLGFBQXhDO0FBQ0g7O0FB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YixFQUEwQjtBQUMvQnZELElBQUFBLE9BQU8sQ0FBQ3dELEtBQVIsQ0FBYyxZQUFZN0MsS0FBSyxDQUFDRyxJQUFOLENBQVc3QixNQUF2QixHQUFnQyx3QkFBaEMsR0FBMkRxRSxHQUF6RTtBQUNBLFVBQU14QyxJQUFJLEdBQUdtQyxJQUFJLENBQUNwRCxLQUFMLENBQVdvRCxJQUFJLENBQUNDLFNBQUwsQ0FBZXZDLEtBQUssQ0FBQ0csSUFBckIsQ0FBWCxDQUFiO0FBQ0FBLElBQUFBLElBQUksQ0FBQ3FDLFFBQUwsR0FBZ0I7QUFDWkssTUFBQUEsS0FBSyxFQUFFO0FBQ0hULFFBQUFBLE9BQU8sRUFBRU87QUFETjtBQURLLEtBQWhCOztBQUtBLFFBQUlDLFdBQUosRUFBaUI7QUFDYnpDLE1BQUFBLElBQUksQ0FBQ3FDLFFBQUwsQ0FBY0ssS0FBZCxDQUFvQkMsTUFBcEIsR0FBNkJGLFdBQTdCO0FBQ0g7O0FBQ0Q1QyxJQUFBQSxLQUFLLENBQUN5QyxNQUFOLENBQWFDLFdBQWIsQ0FBeUJ2QyxJQUF6QixFQUErQkgsS0FBSyxDQUFDVCxNQUFyQztBQUNIOztBQTNPeUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRyYXZpcyBSYWxzdG9uXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgJ0xpY2Vuc2UnKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuICdBUyBJUycgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFVSTCBmcm9tICd1cmwnO1xuaW1wb3J0IGRpcyBmcm9tICcuL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgV2lkZ2V0TWVzc2FnaW5nRW5kcG9pbnQgZnJvbSAnLi9XaWRnZXRNZXNzYWdpbmdFbmRwb2ludCc7XG5pbXBvcnQgQWN0aXZlV2lkZ2V0U3RvcmUgZnJvbSAnLi9zdG9yZXMvQWN0aXZlV2lkZ2V0U3RvcmUnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IFJvb21WaWV3U3RvcmUgZnJvbSBcIi4vc3RvcmVzL1Jvb21WaWV3U3RvcmVcIjtcbmltcG9ydCB7SW50ZWdyYXRpb25NYW5hZ2Vyc30gZnJvbSBcIi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7Q2FwYWJpbGl0eX0gZnJvbSBcIi4vd2lkZ2V0cy9XaWRnZXRBcGlcIjtcblxuY29uc3QgV0lER0VUX0FQSV9WRVJTSU9OID0gJzAuMC4yJzsgLy8gQ3VycmVudCBBUEkgdmVyc2lvblxuY29uc3QgU1VQUE9SVEVEX1dJREdFVF9BUElfVkVSU0lPTlMgPSBbXG4gICAgJzAuMC4xJyxcbiAgICAnMC4wLjInLFxuXTtcbmNvbnN0IElOQk9VTkRfQVBJX05BTUUgPSAnZnJvbVdpZGdldCc7XG5cbi8vIExpc3RlbiBmb3IgYW5kIGhhbmRsZSBpbmNvbWluZyByZXF1ZXN0cyB1c2luZyB0aGUgJ2Zyb21XaWRnZXQnIHBvc3RNZXNzYWdlXG4vLyBBUEkgYW5kIGluaXRpYXRlIHJlc3BvbnNlc1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnJvbVdpZGdldFBvc3RNZXNzYWdlQXBpIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy53aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy53aWRnZXRMaXN0ZW5lcnMgPSB7fTsgLy8ge2FjdGlvbjogZnVuY1tdfVxuXG4gICAgICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuc3RvcCA9IHRoaXMuc3RvcC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uUG9zdE1lc3NhZ2UgPSB0aGlzLm9uUG9zdE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLm9uUG9zdE1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5vblBvc3RNZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gYWN0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBUaGUgYWN0aW9uIHRvIGxpc3RlbiBmb3IuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tGbiBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBhY3Rpb24gaXNcbiAgICAgKiBlbmNvdW50ZXJlZC4gQ2FsbGVkIHdpdGggdHdvIHBhcmFtZXRlcnM6IHRoZSBpbnRlcmVzdGluZyByZXF1ZXN0IGluZm9ybWF0aW9uIGFuZFxuICAgICAqIHRoZSByYXcgZXZlbnQgcmVjZWl2ZWQgZnJvbSB0aGUgcG9zdE1lc3NhZ2UgQVBJLiBUaGUgcmF3IGV2ZW50IGlzIG1lYW50IHRvIGJlIHVzZWRcbiAgICAgKiBmb3Igc2VuZFJlc3BvbnNlIGFuZCBzaW1pbGFyIGZ1bmN0aW9ucy5cbiAgICAgKi9cbiAgICBhZGRMaXN0ZW5lcihhY3Rpb24sIGNhbGxiYWNrRm4pIHtcbiAgICAgICAgaWYgKCF0aGlzLndpZGdldExpc3RlbmVyc1thY3Rpb25dKSB0aGlzLndpZGdldExpc3RlbmVyc1thY3Rpb25dID0gW107XG4gICAgICAgIHRoaXMud2lkZ2V0TGlzdGVuZXJzW2FjdGlvbl0ucHVzaChjYWxsYmFja0ZuKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gYWN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gVGhlIGFjdGlvbiB0aGF0IHdhcyBzdWJzY3JpYmVkIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrRm4gVGhlIG9yaWdpbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2FzIHVzZWQgdG8gc3Vic2NyaWJlXG4gICAgICogdG8gdXBkYXRlcy5cbiAgICAgKi9cbiAgICByZW1vdmVMaXN0ZW5lcihhY3Rpb24sIGNhbGxiYWNrRm4pIHtcbiAgICAgICAgaWYgKCF0aGlzLndpZGdldExpc3RlbmVyc1thY3Rpb25dKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy53aWRnZXRMaXN0ZW5lcnNbYWN0aW9uXS5pbmRleE9mKGNhbGxiYWNrRm4pO1xuICAgICAgICBpZiAoaWR4ICE9PSAtMSkgdGhpcy53aWRnZXRMaXN0ZW5lcnNbYWN0aW9uXS5zcGxpY2UoaWR4LCAxKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhIHdpZGdldCBlbmRwb2ludCBmb3IgdHJ1c3RlZCBwb3N0TWVzc2FnZSBjb21tdW5pY2F0aW9uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHdpZGdldElkICAgIFVuaXF1ZSB3aWRnZXQgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBlbmRwb2ludFVybCBXaWRnZXQgd3VybCBvcmlnaW4gKHByb3RvY29sICsgKG9wdGlvbmFsIHBvcnQpICsgaG9zdClcbiAgICAgKi9cbiAgICBhZGRFbmRwb2ludCh3aWRnZXRJZCwgZW5kcG9pbnRVcmwpIHtcbiAgICAgICAgY29uc3QgdSA9IFVSTC5wYXJzZShlbmRwb2ludFVybCk7XG4gICAgICAgIGlmICghdSB8fCAhdS5wcm90b2NvbCB8fCAhdS5ob3N0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FkZCBGcm9tV2lkZ2V0UG9zdE1lc3NhZ2VBcGkgZW5kcG9pbnQgLSBJbnZhbGlkIG9yaWdpbjonLCBlbmRwb2ludFVybCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcmlnaW4gPSB1LnByb3RvY29sICsgJy8vJyArIHUuaG9zdDtcbiAgICAgICAgY29uc3QgZW5kcG9pbnQgPSBuZXcgV2lkZ2V0TWVzc2FnaW5nRW5kcG9pbnQod2lkZ2V0SWQsIG9yaWdpbik7XG4gICAgICAgIGlmICh0aGlzLndpZGdldE1lc3NhZ2luZ0VuZHBvaW50cy5zb21lKGZ1bmN0aW9uKGVwKSB7XG4gICAgICAgICAgICByZXR1cm4gKGVwLndpZGdldElkID09PSB3aWRnZXRJZCAmJiBlcC5lbmRwb2ludFVybCA9PT0gZW5kcG9pbnRVcmwpO1xuICAgICAgICB9KSkge1xuICAgICAgICAgICAgLy8gTWVzc2FnZSBlbmRwb2ludCBhbHJlYWR5IHJlZ2lzdGVyZWRcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWRkIEZyb21XaWRnZXRQb3N0TWVzc2FnZUFwaSAtIEVuZHBvaW50IGFscmVhZHkgcmVnaXN0ZXJlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEFkZGluZyBmcm9tV2lkZ2V0IG1lc3NhZ2luZyBlbmRwb2ludCBmb3IgJHt3aWRnZXRJZH1gLCBlbmRwb2ludCk7XG4gICAgICAgICAgICB0aGlzLndpZGdldE1lc3NhZ2luZ0VuZHBvaW50cy5wdXNoKGVuZHBvaW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlLXJlZ2lzdGVyIGEgd2lkZ2V0IGVuZHBvaW50IGZyb20gdHJ1c3RlZCBjb21tdW5pY2F0aW9uIHNvdXJjZXNcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHdpZGdldElkIFVuaXF1ZSB3aWRnZXQgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gZW5kcG9pbnRVcmwgV2lkZ2V0IHd1cmwgb3JpZ2luIChwcm90b2NvbCArIChvcHRpb25hbCBwb3J0KSArIGhvc3QpXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBlbmRwb2ludCB3YXMgc3VjY2Vzc2Z1bGx5IHJlbW92ZWRcbiAgICAgKi9cbiAgICByZW1vdmVFbmRwb2ludCh3aWRnZXRJZCwgZW5kcG9pbnRVcmwpIHtcbiAgICAgICAgY29uc3QgdSA9IFVSTC5wYXJzZShlbmRwb2ludFVybCk7XG4gICAgICAgIGlmICghdSB8fCAhdS5wcm90b2NvbCB8fCAhdS5ob3N0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JlbW92ZSB3aWRnZXQgbWVzc2FnaW5nIGVuZHBvaW50IC0gSW52YWxpZCBvcmlnaW4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHUucHJvdG9jb2wgKyAnLy8nICsgdS5ob3N0O1xuICAgICAgICBpZiAodGhpcy53aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMgJiYgdGhpcy53aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy53aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy53aWRnZXRNZXNzYWdpbmdFbmRwb2ludHMgPSB0aGlzLndpZGdldE1lc3NhZ2luZ0VuZHBvaW50c1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGVuZHBvaW50KSA9PiBlbmRwb2ludC53aWRnZXRJZCAhPT0gd2lkZ2V0SWQgfHwgZW5kcG9pbnQuZW5kcG9pbnRVcmwgIT09IG9yaWdpbik7XG4gICAgICAgICAgICByZXR1cm4gKGxlbmd0aCA+IHRoaXMud2lkZ2V0TWVzc2FnaW5nRW5kcG9pbnRzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB3aWRnZXQgcG9zdE1lc3NhZ2UgZXZlbnRzXG4gICAgICogTWVzc2FnZXMgYXJlIG9ubHkgaGFuZGxlZCB3aGVyZSBhIHZhbGlkLCByZWdpc3RlcmVkIG1lc3NhZ2luZyBlbmRwb2ludHNcbiAgICAgKiBAcGFyYW0gIHtFdmVudH0gZXZlbnQgRXZlbnQgdG8gaGFuZGxlXG4gICAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgICAqL1xuICAgIG9uUG9zdE1lc3NhZ2UoZXZlbnQpIHtcbiAgICAgICAgaWYgKCFldmVudC5vcmlnaW4pIHsgLy8gSGFuZGxlIGNocm9tZVxuICAgICAgICAgICAgZXZlbnQub3JpZ2luID0gZXZlbnQub3JpZ2luYWxFdmVudC5vcmlnaW47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFdmVudCBvcmlnaW4gaXMgZW1wdHkgc3RyaW5nIGlmIHVuZGVmaW5lZFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBldmVudC5vcmlnaW4ubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgICAhdGhpcy50cnVzdGVkRW5kcG9pbnQoZXZlbnQub3JpZ2luKSB8fFxuICAgICAgICAgICAgZXZlbnQuZGF0YS5hcGkgIT09IElOQk9VTkRfQVBJX05BTUUgfHxcbiAgICAgICAgICAgICFldmVudC5kYXRhLndpZGdldElkXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCBsb2cgdGhpcyAtIGRlYnVnZ2luZyBBUElzIGxpa2UgdG8gc3BhbSBwb3N0TWVzc2FnZSB3aGljaCBmbG9vZHMgdGhlIGxvZyBvdGhlcndpc2VcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGwgYW55IGxpc3RlbmVycyB3ZSBoYXZlIHJlZ2lzdGVyZWRcbiAgICAgICAgaWYgKHRoaXMud2lkZ2V0TGlzdGVuZXJzW2V2ZW50LmRhdGEuYWN0aW9uXSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBmbiBvZiB0aGlzLndpZGdldExpc3RlbmVyc1tldmVudC5kYXRhLmFjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICBmbihldmVudC5kYXRhLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbHRob3VnaCB0aGUgcmVxdWVzdElkIGlzIHJlcXVpcmVkLCB3ZSBkb24ndCB1c2UgaXQuIFdlJ2xsIGJlIG5pY2UgYW5kIHByb2Nlc3MgdGhlIG1lc3NhZ2VcbiAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIG1pc3NpbmcsIGJ1dCB3aXRoIGEgd2FybmluZyBmb3Igd2lkZ2V0IGRldmVsb3BlcnMuXG4gICAgICAgIGlmICghZXZlbnQuZGF0YS5yZXF1ZXN0SWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZyb21XaWRnZXQgYWN0aW9uICdcIiArIGV2ZW50LmRhdGEuYWN0aW9uICsgXCInIGRvZXMgbm90IGhhdmUgYSByZXF1ZXN0SWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhY3Rpb24gPSBldmVudC5kYXRhLmFjdGlvbjtcbiAgICAgICAgY29uc3Qgd2lkZ2V0SWQgPSBldmVudC5kYXRhLndpZGdldElkO1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnY29udGVudF9sb2FkZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV2lkZ2V0IHJlcG9ydGVkIGNvbnRlbnQgbG9hZGVkIGZvcicsIHdpZGdldElkKTtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnd2lkZ2V0X2NvbnRlbnRfbG9hZGVkJyxcbiAgICAgICAgICAgICAgICB3aWRnZXRJZDogd2lkZ2V0SWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2VuZFJlc3BvbnNlKGV2ZW50LCB7c3VjY2VzczogdHJ1ZX0pO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3N1cHBvcnRlZF9hcGlfdmVyc2lvbnMnKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRSZXNwb25zZShldmVudCwge1xuICAgICAgICAgICAgICAgIGFwaTogSU5CT1VORF9BUElfTkFNRSxcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRfdmVyc2lvbnM6IFNVUFBPUlRFRF9XSURHRVRfQVBJX1ZFUlNJT05TLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnYXBpX3ZlcnNpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRSZXNwb25zZShldmVudCwge1xuICAgICAgICAgICAgICAgIGFwaTogSU5CT1VORF9BUElfTkFNRSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBXSURHRVRfQVBJX1ZFUlNJT04sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdtLnN0aWNrZXInKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oJ0dvdCBzdGlja2VyIG1lc3NhZ2UgZnJvbSB3aWRnZXQnLCB3aWRnZXRJZCk7XG4gICAgICAgICAgICAvLyBOT1RFIC0tIFRoZSB3aWRnZXREYXRhIGZpZWxkIGlzIGRlcHJlY2F0ZWQgKGluIGZhdm91ciBvZiB0aGUgJ2RhdGEnIGZpZWxkKSBhbmQgd2lsbCBiZSByZW1vdmVkIGV2ZW50dWFsbHlcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhLmRhdGEgfHwgZXZlbnQuZGF0YS53aWRnZXREYXRhO1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdtLnN0aWNrZXInLCBkYXRhOiBkYXRhLCB3aWRnZXRJZDogZXZlbnQuZGF0YS53aWRnZXRJZH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2ludGVncmF0aW9uX21hbmFnZXJfb3BlbicpIHtcbiAgICAgICAgICAgIC8vIENsb3NlIHRoZSBzdGlja2VycGlja2VyXG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3N0aWNrZXJwaWNrZXJfY2xvc2UnfSk7XG4gICAgICAgICAgICAvLyBPcGVuIHRoZSBpbnRlZ3JhdGlvbiBtYW5hZ2VyXG4gICAgICAgICAgICAvLyBOT1RFIC0tIFRoZSB3aWRnZXREYXRhIGZpZWxkIGlzIGRlcHJlY2F0ZWQgKGluIGZhdm91ciBvZiB0aGUgJ2RhdGEnIGZpZWxkKSBhbmQgd2lsbCBiZSByZW1vdmVkIGV2ZW50dWFsbHlcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhLmRhdGEgfHwgZXZlbnQuZGF0YS53aWRnZXREYXRhO1xuICAgICAgICAgICAgY29uc3QgaW50ZWdUeXBlID0gKGRhdGEgJiYgZGF0YS5pbnRlZ1R5cGUpID8gZGF0YS5pbnRlZ1R5cGUgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgaW50ZWdJZCA9IChkYXRhICYmIGRhdGEuaW50ZWdJZCkgPyBkYXRhLmludGVnSWQgOiBudWxsO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBPcGVuIHRoZSByaWdodCBpbnRlZ3JhdGlvbiBtYW5hZ2VyIGZvciB0aGUgd2lkZ2V0XG4gICAgICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKFwiZmVhdHVyZV9tYW55X2ludGVncmF0aW9uX21hbmFnZXJzXCIpKSB7XG4gICAgICAgICAgICAgICAgSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLm9wZW5BbGwoXG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCkpLFxuICAgICAgICAgICAgICAgICAgICBgdHlwZV8ke2ludGVnVHlwZX1gLFxuICAgICAgICAgICAgICAgICAgICBpbnRlZ0lkLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEludGVncmF0aW9uTWFuYWdlcnMuc2hhcmVkSW5zdGFuY2UoKS5nZXRQcmltYXJ5TWFuYWdlcigpLm9wZW4oXG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCkpLFxuICAgICAgICAgICAgICAgICAgICBgdHlwZV8ke2ludGVnVHlwZX1gLFxuICAgICAgICAgICAgICAgICAgICBpbnRlZ0lkLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnc2V0X2Fsd2F5c19vbl9zY3JlZW4nKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbmV3IG1lc3NhZ2U6IHRoZXJlIGlzIG5vIHJlYXNvbiB0byBzdXBwb3J0IHRoZSBkZXByZWNhdGVkIHdpZGdldERhdGEgaGVyZVxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGEuZGF0YTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGRhdGEudmFsdWU7XG5cbiAgICAgICAgICAgIGlmIChBY3RpdmVXaWRnZXRTdG9yZS53aWRnZXRIYXNDYXBhYmlsaXR5KHdpZGdldElkLCBDYXBhYmlsaXR5LkFsd2F5c09uU2NyZWVuKSkge1xuICAgICAgICAgICAgICAgIEFjdGl2ZVdpZGdldFN0b3JlLnNldFdpZGdldFBlcnNpc3RlbmNlKHdpZGdldElkLCB2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2dldF9vcGVuaWQnKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGVkIGJ5IGNhbGxlclxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdXaWRnZXQgcG9zdE1lc3NhZ2UgZXZlbnQgdW5oYW5kbGVkJyk7XG4gICAgICAgICAgICB0aGlzLnNlbmRFcnJvcihldmVudCwge21lc3NhZ2U6ICdUaGUgcG9zdE1lc3NhZ2Ugd2FzIHVuaGFuZGxlZCd9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIG1lc3NhZ2Ugb3JpZ2luIGlzIHJlZ2lzdGVyZWQgYXMgdHJ1c3RlZFxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gb3JpZ2luIFBvc3RNZXNzYWdlIG9yaWdpbiB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgIFRydWUgaWYgdHJ1c3RlZFxuICAgICAqL1xuICAgIHRydXN0ZWRFbmRwb2ludChvcmlnaW4pIHtcbiAgICAgICAgaWYgKCFvcmlnaW4pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLndpZGdldE1lc3NhZ2luZ0VuZHBvaW50cy5zb21lKChlbmRwb2ludCkgPT4ge1xuICAgICAgICAgICAgLy8gVE9ETyAvIEZJWE1FIC0tIFNob3VsZCB0aGlzIGFsc28gY2hlY2sgdGhlIHdpZGdldElkP1xuICAgICAgICAgICAgcmV0dXJuIGVuZHBvaW50LmVuZHBvaW50VXJsID09PSBvcmlnaW47XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSBwb3N0bWVzc2FnZSByZXNwb25zZSB0byBhIHBvc3RNZXNzYWdlIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gIHtFdmVudH0gZXZlbnQgIFRoZSBvcmlnaW5hbCBwb3N0TWVzc2FnZSByZXF1ZXN0IGV2ZW50XG4gICAgICogQHBhcmFtICB7T2JqZWN0fSByZXMgICBSZXNwb25zZSBkYXRhXG4gICAgICovXG4gICAgc2VuZFJlc3BvbnNlKGV2ZW50LCByZXMpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZXZlbnQuZGF0YSkpO1xuICAgICAgICBkYXRhLnJlc3BvbnNlID0gcmVzO1xuICAgICAgICBldmVudC5zb3VyY2UucG9zdE1lc3NhZ2UoZGF0YSwgZXZlbnQub3JpZ2luKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGFuIGVycm9yIHJlc3BvbnNlIHRvIGEgcG9zdE1lc3NhZ2UgcmVxdWVzdFxuICAgICAqIEBwYXJhbSAge0V2ZW50fSBldmVudCAgICAgICAgVGhlIG9yaWdpbmFsIHBvc3RNZXNzYWdlIHJlcXVlc3QgZXZlbnRcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IG1zZyAgICAgICAgIEVycm9yIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gIHtFcnJvcn0gbmVzdGVkRXJyb3IgIE5lc3RlZCBlcnJvciBldmVudCAob3B0aW9uYWwpXG4gICAgICovXG4gICAgc2VuZEVycm9yKGV2ZW50LCBtc2csIG5lc3RlZEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FjdGlvbjonICsgZXZlbnQuZGF0YS5hY3Rpb24gKyAnIGZhaWxlZCB3aXRoIG1lc3NhZ2U6ICcgKyBtc2cpO1xuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShldmVudC5kYXRhKSk7XG4gICAgICAgIGRhdGEucmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1zZyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChuZXN0ZWRFcnJvcikge1xuICAgICAgICAgICAgZGF0YS5yZXNwb25zZS5lcnJvci5fZXJyb3IgPSBuZXN0ZWRFcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5zb3VyY2UucG9zdE1lc3NhZ2UoZGF0YSwgZXZlbnQub3JpZ2luKTtcbiAgICB9XG59XG4iXX0=