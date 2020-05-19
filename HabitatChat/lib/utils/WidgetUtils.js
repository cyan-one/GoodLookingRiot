"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("../MatrixClientPeg");

var _SdkConfig = _interopRequireDefault(require("../SdkConfig"));

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var url = _interopRequireWildcard(require("url"));

var _WidgetEchoStore = _interopRequireDefault(require("../stores/WidgetEchoStore"));

var _SettingsStore = _interopRequireDefault(require("../settings/SettingsStore"));

var _ActiveWidgetStore = _interopRequireDefault(require("../stores/ActiveWidgetStore"));

var _IntegrationManagers = require("../integrations/IntegrationManagers");

var _WidgetApi = require("../widgets/WidgetApi");

var _room = require("matrix-js-sdk/src/models/room");

var _WidgetType = require("../widgets/WidgetType");

/*
Copyright 2017 Vector Creations Ltd
Copyright 2018 New Vector Ltd
Copyright 2019 Travis Ralston

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
// How long we wait for the state event echo to come back from the server
// before waitFor[Room/User]Widget rejects its promise
const WIDGET_WAIT_TIME = 20000;

class WidgetUtils {
  /* Returns true if user is able to send state events to modify widgets in this room
   * (Does not apply to non-room-based / user widgets)
   * @param roomId -- The ID of the room to check
   * @return Boolean -- true if the user can modify widgets in this room
   * @throws Error -- specifies the error reason
   */
  static canUserModifyWidgets(roomId) {
    if (!roomId) {
      console.warn('No room ID specified');
      return false;
    }

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!client) {
      console.warn('User must be be logged in');
      return false;
    }

    const room = client.getRoom(roomId);

    if (!room) {
      console.warn("Room ID ".concat(roomId, " is not recognised"));
      return false;
    }

    const me = client.credentials.userId;

    if (!me) {
      console.warn('Failed to get user ID');
      return false;
    }

    if (room.getMyMembership() !== "join") {
      console.warn("User ".concat(me, " is not in room ").concat(roomId));
      return false;
    } // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)


    return room.currentState.maySendStateEvent('im.vector.modular.widgets', me);
  } // TODO: Generify the name of this function. It's not just scalar.

  /**
   * Returns true if specified url is a scalar URL, typically https://scalar.vector.im/api
   * @param  {[type]}  testUrlString URL to check
   * @return {Boolean} True if specified URL is a scalar URL
   */


  static isScalarUrl(testUrlString) {
    if (!testUrlString) {
      console.error('Scalar URL check failed. No URL specified');
      return false;
    }

    const testUrl = url.parse(testUrlString);

    let scalarUrls = _SdkConfig.default.get().integrations_widgets_urls;

    if (!scalarUrls || scalarUrls.length === 0) {
      const defaultManager = _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager();

      if (defaultManager) {
        scalarUrls = [defaultManager.apiUrl];
      } else {
        scalarUrls = [];
      }
    }

    for (let i = 0; i < scalarUrls.length; i++) {
      const scalarUrl = url.parse(scalarUrls[i]);

      if (testUrl && scalarUrl) {
        if (testUrl.protocol === scalarUrl.protocol && testUrl.host === scalarUrl.host && testUrl.pathname.startsWith(scalarUrl.pathname)) {
          return true;
        }
      }
    }

    return false;
  }
  /**
   * Returns a promise that resolves when a widget with the given
   * ID has been added as a user widget (ie. the accountData event
   * arrives) or rejects after a timeout
   *
   * @param {string} widgetId The ID of the widget to wait for
   * @param {boolean} add True to wait for the widget to be added,
   *     false to wait for it to be deleted.
   * @returns {Promise} that resolves when the widget is in the
   *     requested state according to the `add` param
   */


  static waitForUserWidget(widgetId, add) {
    return new Promise((resolve, reject) => {
      // Tests an account data event, returning true if it's in the state
      // we're waiting for it to be in
      function eventInIntendedState(ev) {
        if (!ev || !ev.getContent()) return false;

        if (add) {
          return ev.getContent()[widgetId] !== undefined;
        } else {
          return ev.getContent()[widgetId] === undefined;
        }
      }

      const startingAccountDataEvent = _MatrixClientPeg.MatrixClientPeg.get().getAccountData('m.widgets');

      if (eventInIntendedState(startingAccountDataEvent)) {
        resolve();
        return;
      }

      function onAccountData(ev) {
        const currentAccountDataEvent = _MatrixClientPeg.MatrixClientPeg.get().getAccountData('m.widgets');

        if (eventInIntendedState(currentAccountDataEvent)) {
          _MatrixClientPeg.MatrixClientPeg.get().removeListener('accountData', onAccountData);

          clearTimeout(timerId);
          resolve();
        }
      }

      const timerId = setTimeout(() => {
        _MatrixClientPeg.MatrixClientPeg.get().removeListener('accountData', onAccountData);

        reject(new Error("Timed out waiting for widget ID " + widgetId + " to appear"));
      }, WIDGET_WAIT_TIME);

      _MatrixClientPeg.MatrixClientPeg.get().on('accountData', onAccountData);
    });
  }
  /**
   * Returns a promise that resolves when a widget with the given
   * ID has been added as a room widget in the given room (ie. the
   * room state event arrives) or rejects after a timeout
   *
   * @param {string} widgetId The ID of the widget to wait for
   * @param {string} roomId The ID of the room to wait for the widget in
   * @param {boolean} add True to wait for the widget to be added,
   *     false to wait for it to be deleted.
   * @returns {Promise} that resolves when the widget is in the
   *     requested state according to the `add` param
   */


  static waitForRoomWidget(widgetId, roomId, add) {
    return new Promise((resolve, reject) => {
      // Tests a list of state events, returning true if it's in the state
      // we're waiting for it to be in
      function eventsInIntendedState(evList) {
        const widgetPresent = evList.some(ev => {
          return ev.getContent() && ev.getContent()['id'] === widgetId;
        });

        if (add) {
          return widgetPresent;
        } else {
          return !widgetPresent;
        }
      }

      const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId); // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)


      const startingWidgetEvents = room.currentState.getStateEvents('im.vector.modular.widgets');

      if (eventsInIntendedState(startingWidgetEvents)) {
        resolve();
        return;
      }

      function onRoomStateEvents(ev) {
        if (ev.getRoomId() !== roomId) return; // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)

        const currentWidgetEvents = room.currentState.getStateEvents('im.vector.modular.widgets');

        if (eventsInIntendedState(currentWidgetEvents)) {
          _MatrixClientPeg.MatrixClientPeg.get().removeListener('RoomState.events', onRoomStateEvents);

          clearTimeout(timerId);
          resolve();
        }
      }

      const timerId = setTimeout(() => {
        _MatrixClientPeg.MatrixClientPeg.get().removeListener('RoomState.events', onRoomStateEvents);

        reject(new Error("Timed out waiting for widget ID " + widgetId + " to appear"));
      }, WIDGET_WAIT_TIME);

      _MatrixClientPeg.MatrixClientPeg.get().on('RoomState.events', onRoomStateEvents);
    });
  }

  static setUserWidget(widgetId, widgetType
  /*: WidgetType*/
  , widgetUrl, widgetName, widgetData) {
    const content = {
      type: widgetType.preferred,
      url: widgetUrl,
      name: widgetName,
      data: widgetData
    };

    const client = _MatrixClientPeg.MatrixClientPeg.get(); // Get the current widgets and clone them before we modify them, otherwise
    // we'll modify the content of the old event.


    const userWidgets = JSON.parse(JSON.stringify(WidgetUtils.getUserWidgets())); // Delete existing widget with ID

    try {
      delete userWidgets[widgetId];
    } catch (e) {
      console.error("$widgetId is non-configurable");
    }

    const addingWidget = Boolean(widgetUrl); // Add new widget / update

    if (addingWidget) {
      userWidgets[widgetId] = {
        content: content,
        sender: client.getUserId(),
        state_key: widgetId,
        type: 'm.widget',
        id: widgetId
      };
    } // This starts listening for when the echo comes back from the server
    // since the widget won't appear added until this happens. If we don't
    // wait for this, the action will complete but if the user is fast enough,
    // the widget still won't actually be there.


    return client.setAccountData('m.widgets', userWidgets).then(() => {
      return WidgetUtils.waitForUserWidget(widgetId, addingWidget);
    }).then(() => {
      _dispatcher.default.dispatch({
        action: "user_widget_updated"
      });
    });
  }

  static setRoomWidget(roomId, widgetId, widgetType
  /*: WidgetType*/
  , widgetUrl, widgetName, widgetData) {
    let content;
    const addingWidget = Boolean(widgetUrl);

    if (addingWidget) {
      content = {
        // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
        // For now we'll send the legacy event type for compatibility with older apps/riots
        type: widgetType.legacy,
        url: widgetUrl,
        name: widgetName,
        data: widgetData
      };
    } else {
      content = {};
    }

    _WidgetEchoStore.default.setRoomWidgetEcho(roomId, widgetId, content);

    const client = _MatrixClientPeg.MatrixClientPeg.get(); // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)


    return client.sendStateEvent(roomId, "im.vector.modular.widgets", content, widgetId).then(() => {
      return WidgetUtils.waitForRoomWidget(widgetId, roomId, addingWidget);
    }).finally(() => {
      _WidgetEchoStore.default.removeRoomWidgetEcho(roomId, widgetId);
    });
  }
  /**
   * Get room specific widgets
   * @param  {Room} room The room to get widgets force
   * @return {[object]} Array containing current / active room widgets
   */


  static getRoomWidgets(room
  /*: Room*/
  ) {
    // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
    const appsStateEvents = room.currentState.getStateEvents('im.vector.modular.widgets');

    if (!appsStateEvents) {
      return [];
    }

    return appsStateEvents.filter(ev => {
      return ev.getContent().type && ev.getContent().url;
    });
  }
  /**
   * Get user specific widgets (not linked to a specific room)
   * @return {object} Event content object containing current / active user widgets
   */


  static getUserWidgets() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!client) {
      throw new Error('User not logged in');
    }

    const userWidgets = client.getAccountData('m.widgets');

    if (userWidgets && userWidgets.getContent()) {
      return userWidgets.getContent();
    }

    return {};
  }
  /**
   * Get user specific widgets (not linked to a specific room) as an array
   * @return {[object]} Array containing current / active user widgets
   */


  static getUserWidgetsArray() {
    return Object.values(WidgetUtils.getUserWidgets());
  }
  /**
   * Get active stickerpicker widgets (stickerpickers are user widgets by nature)
   * @return {[object]} Array containing current / active stickerpicker widgets
   */


  static getStickerpickerWidgets() {
    const widgets = WidgetUtils.getUserWidgetsArray();
    return widgets.filter(widget => widget.content && widget.content.type === "m.stickerpicker");
  }
  /**
   * Get all integration manager widgets for this user.
   * @returns {Object[]} An array of integration manager user widgets.
   */


  static getIntegrationManagerWidgets() {
    const widgets = WidgetUtils.getUserWidgetsArray();
    return widgets.filter(w => w.content && w.content.type === "m.integration_manager");
  }

  static getRoomWidgetsOfType(room
  /*: Room*/
  , type
  /*: WidgetType*/
  ) {
    const widgets = WidgetUtils.getRoomWidgets(room);
    return (widgets || []).filter(w => {
      const content = w.getContent();
      return content.url && type.matches(content.type);
    });
  }

  static removeIntegrationManagerWidgets() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!client) {
      throw new Error('User not logged in');
    }

    const widgets = client.getAccountData('m.widgets');
    if (!widgets) return;
    const userWidgets = widgets.getContent() || {};
    Object.entries(userWidgets).forEach(([key, widget]) => {
      if (widget.content && widget.content.type === "m.integration_manager") {
        delete userWidgets[key];
      }
    });
    return client.setAccountData('m.widgets', userWidgets);
  }

  static addIntegrationManagerWidget(name
  /*: string*/
  , uiUrl
  /*: string*/
  , apiUrl
  /*: string*/
  ) {
    return WidgetUtils.setUserWidget("integration_manager_" + new Date().getTime(), _WidgetType.WidgetType.INTEGRATION_MANAGER, uiUrl, "Integration Manager: " + name, {
      "api_url": apiUrl
    });
  }
  /**
   * Remove all stickerpicker widgets (stickerpickers are user widgets by nature)
   * @return {Promise} Resolves on account data updated
   */


  static removeStickerpickerWidgets() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!client) {
      throw new Error('User not logged in');
    }

    const widgets = client.getAccountData('m.widgets');
    if (!widgets) return;
    const userWidgets = widgets.getContent() || {};
    Object.entries(userWidgets).forEach(([key, widget]) => {
      if (widget.content && widget.content.type === 'm.stickerpicker') {
        delete userWidgets[key];
      }
    });
    return client.setAccountData('m.widgets', userWidgets);
  }

  static makeAppConfig(appId, app, senderUserId, roomId, eventId) {
    if (!senderUserId) {
      throw new Error("Widgets must be created by someone - provide a senderUserId");
    }

    app.creatorUserId = senderUserId;
    app.id = appId;
    app.eventId = eventId;
    app.name = app.name || app.type;
    return app;
  }

  static getCapWhitelistForAppTypeInRoomId(appType, roomId) {
    const enableScreenshots = _SettingsStore.default.getValue("enableWidgetScreenshots", roomId);

    const capWhitelist = enableScreenshots ? [_WidgetApi.Capability.Screenshot] : []; // Obviously anyone that can add a widget can claim it's a jitsi widget,
    // so this doesn't really offer much over the set of domains we load
    // widgets from at all, but it probably makes sense for sanity.

    if (_WidgetType.WidgetType.JITSI.matches(appType)) {
      capWhitelist.push(_WidgetApi.Capability.AlwaysOnScreen);
    }

    return capWhitelist;
  }

  static getWidgetSecurityKey(widgetId, widgetUrl, isUserWidget) {
    let widgetLocation = _ActiveWidgetStore.default.getRoomId(widgetId);

    if (isUserWidget) {
      const userWidget = WidgetUtils.getUserWidgetsArray().find(w => w.id === widgetId && w.content && w.content.url === widgetUrl);

      if (!userWidget) {
        throw new Error("No matching user widget to form security key");
      }

      widgetLocation = userWidget.sender;
    }

    if (!widgetLocation) {
      throw new Error("Failed to locate where the widget resides");
    }

    return encodeURIComponent("".concat(widgetLocation, "::").concat(widgetUrl));
  }

  static getLocalJitsiWrapperUrl(opts
  /*: {forLocalRender?: boolean}*/
  = {}) {
    // NB. we can't just encodeURIComponent all of these because the $ signs need to be there
    const queryString = ['conferenceDomain=$domain', 'conferenceId=$conferenceId', 'isAudioOnly=$isAudioOnly', 'displayName=$matrix_display_name', 'avatarUrl=$matrix_avatar_url', 'userId=$matrix_user_id'].join('&');
    let baseUrl = window.location;

    if (window.location.protocol !== "https:" && !opts.forLocalRender) {
      // Use an external wrapper if we're not locally rendering the widget. This is usually
      // the URL that will end up in the widget event, so we want to make sure it's relatively
      // safe to send.
      // We'll end up using a local render URL when we see a Jitsi widget anyways, so this is
      // really just for backwards compatibility and to appease the spec.
      baseUrl = "https://riot.im/app/";
    }

    const url = new URL("jitsi.html#" + queryString, baseUrl); // this strips hash fragment from baseUrl

    return url.href;
  }

}

exports.default = WidgetUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9XaWRnZXRVdGlscy5qcyJdLCJuYW1lcyI6WyJXSURHRVRfV0FJVF9USU1FIiwiV2lkZ2V0VXRpbHMiLCJjYW5Vc2VyTW9kaWZ5V2lkZ2V0cyIsInJvb21JZCIsImNvbnNvbGUiLCJ3YXJuIiwiY2xpZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwicm9vbSIsImdldFJvb20iLCJtZSIsImNyZWRlbnRpYWxzIiwidXNlcklkIiwiZ2V0TXlNZW1iZXJzaGlwIiwiY3VycmVudFN0YXRlIiwibWF5U2VuZFN0YXRlRXZlbnQiLCJpc1NjYWxhclVybCIsInRlc3RVcmxTdHJpbmciLCJlcnJvciIsInRlc3RVcmwiLCJ1cmwiLCJwYXJzZSIsInNjYWxhclVybHMiLCJTZGtDb25maWciLCJpbnRlZ3JhdGlvbnNfd2lkZ2V0c191cmxzIiwibGVuZ3RoIiwiZGVmYXVsdE1hbmFnZXIiLCJJbnRlZ3JhdGlvbk1hbmFnZXJzIiwic2hhcmVkSW5zdGFuY2UiLCJnZXRQcmltYXJ5TWFuYWdlciIsImFwaVVybCIsImkiLCJzY2FsYXJVcmwiLCJwcm90b2NvbCIsImhvc3QiLCJwYXRobmFtZSIsInN0YXJ0c1dpdGgiLCJ3YWl0Rm9yVXNlcldpZGdldCIsIndpZGdldElkIiwiYWRkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJldmVudEluSW50ZW5kZWRTdGF0ZSIsImV2IiwiZ2V0Q29udGVudCIsInVuZGVmaW5lZCIsInN0YXJ0aW5nQWNjb3VudERhdGFFdmVudCIsImdldEFjY291bnREYXRhIiwib25BY2NvdW50RGF0YSIsImN1cnJlbnRBY2NvdW50RGF0YUV2ZW50IiwicmVtb3ZlTGlzdGVuZXIiLCJjbGVhclRpbWVvdXQiLCJ0aW1lcklkIiwic2V0VGltZW91dCIsIkVycm9yIiwib24iLCJ3YWl0Rm9yUm9vbVdpZGdldCIsImV2ZW50c0luSW50ZW5kZWRTdGF0ZSIsImV2TGlzdCIsIndpZGdldFByZXNlbnQiLCJzb21lIiwic3RhcnRpbmdXaWRnZXRFdmVudHMiLCJnZXRTdGF0ZUV2ZW50cyIsIm9uUm9vbVN0YXRlRXZlbnRzIiwiZ2V0Um9vbUlkIiwiY3VycmVudFdpZGdldEV2ZW50cyIsInNldFVzZXJXaWRnZXQiLCJ3aWRnZXRUeXBlIiwid2lkZ2V0VXJsIiwid2lkZ2V0TmFtZSIsIndpZGdldERhdGEiLCJjb250ZW50IiwidHlwZSIsInByZWZlcnJlZCIsIm5hbWUiLCJkYXRhIiwidXNlcldpZGdldHMiLCJKU09OIiwic3RyaW5naWZ5IiwiZ2V0VXNlcldpZGdldHMiLCJlIiwiYWRkaW5nV2lkZ2V0IiwiQm9vbGVhbiIsInNlbmRlciIsImdldFVzZXJJZCIsInN0YXRlX2tleSIsImlkIiwic2V0QWNjb3VudERhdGEiLCJ0aGVuIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJzZXRSb29tV2lkZ2V0IiwibGVnYWN5IiwiV2lkZ2V0RWNob1N0b3JlIiwic2V0Um9vbVdpZGdldEVjaG8iLCJzZW5kU3RhdGVFdmVudCIsImZpbmFsbHkiLCJyZW1vdmVSb29tV2lkZ2V0RWNobyIsImdldFJvb21XaWRnZXRzIiwiYXBwc1N0YXRlRXZlbnRzIiwiZmlsdGVyIiwiZ2V0VXNlcldpZGdldHNBcnJheSIsIk9iamVjdCIsInZhbHVlcyIsImdldFN0aWNrZXJwaWNrZXJXaWRnZXRzIiwid2lkZ2V0cyIsIndpZGdldCIsImdldEludGVncmF0aW9uTWFuYWdlcldpZGdldHMiLCJ3IiwiZ2V0Um9vbVdpZGdldHNPZlR5cGUiLCJtYXRjaGVzIiwicmVtb3ZlSW50ZWdyYXRpb25NYW5hZ2VyV2lkZ2V0cyIsImVudHJpZXMiLCJmb3JFYWNoIiwia2V5IiwiYWRkSW50ZWdyYXRpb25NYW5hZ2VyV2lkZ2V0IiwidWlVcmwiLCJEYXRlIiwiZ2V0VGltZSIsIldpZGdldFR5cGUiLCJJTlRFR1JBVElPTl9NQU5BR0VSIiwicmVtb3ZlU3RpY2tlcnBpY2tlcldpZGdldHMiLCJtYWtlQXBwQ29uZmlnIiwiYXBwSWQiLCJhcHAiLCJzZW5kZXJVc2VySWQiLCJldmVudElkIiwiY3JlYXRvclVzZXJJZCIsImdldENhcFdoaXRlbGlzdEZvckFwcFR5cGVJblJvb21JZCIsImFwcFR5cGUiLCJlbmFibGVTY3JlZW5zaG90cyIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsImNhcFdoaXRlbGlzdCIsIkNhcGFiaWxpdHkiLCJTY3JlZW5zaG90IiwiSklUU0kiLCJwdXNoIiwiQWx3YXlzT25TY3JlZW4iLCJnZXRXaWRnZXRTZWN1cml0eUtleSIsImlzVXNlcldpZGdldCIsIndpZGdldExvY2F0aW9uIiwiQWN0aXZlV2lkZ2V0U3RvcmUiLCJ1c2VyV2lkZ2V0IiwiZmluZCIsImVuY29kZVVSSUNvbXBvbmVudCIsImdldExvY2FsSml0c2lXcmFwcGVyVXJsIiwib3B0cyIsInF1ZXJ5U3RyaW5nIiwiam9pbiIsImJhc2VVcmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImZvckxvY2FsUmVuZGVyIiwiVVJMIiwiaHJlZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBS0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBaENBOzs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQTtBQUNBO0FBQ0EsTUFBTUEsZ0JBQWdCLEdBQUcsS0FBekI7O0FBUWUsTUFBTUMsV0FBTixDQUFrQjtBQUM3Qjs7Ozs7O0FBTUEsU0FBT0Msb0JBQVAsQ0FBNEJDLE1BQTVCLEVBQW9DO0FBQ2hDLFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1RDLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHNCQUFiO0FBQ0EsYUFBTyxLQUFQO0FBQ0g7O0FBRUQsVUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsUUFBSSxDQUFDRixNQUFMLEVBQWE7QUFDVEYsTUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsMkJBQWI7QUFDQSxhQUFPLEtBQVA7QUFDSDs7QUFFRCxVQUFNSSxJQUFJLEdBQUdILE1BQU0sQ0FBQ0ksT0FBUCxD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QjtBQUNIOztBQUVELFNBQU8rRSx1QkFBUCxDQUErQkM7QUFBZ0M7QUFBQSxJQUFDLEVBQWhFLEVBQW9FO0FBQ2hFO0FBQ0EsVUFBTUMsV0FBVyxHQUFHLENBQ2hCLDBCQURnQixFQUVoQiw0QkFGZ0IsRUFHaEIsMEJBSGdCLEVBSWhCLGtDQUpnQixFQUtoQiw4QkFMZ0IsRUFNaEIsd0JBTmdCLEVBT2xCQyxJQVBrQixDQU9iLEdBUGEsQ0FBcEI7QUFTQSxRQUFJQyxPQUFPLEdBQUdDLE1BQU0sQ0FBQ0MsUUFBckI7O0FBQ0EsUUFBSUQsTUFBTSxDQUFDQyxRQUFQLENBQWdCekgsUUFBaEIsS0FBNkIsUUFBN0IsSUFBeUMsQ0FBQ29ILElBQUksQ0FBQ00sY0FBbkQsRUFBbUU7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSCxNQUFBQSxPQUFPLEdBQUcsc0JBQVY7QUFDSDs7QUFDRCxVQUFNcEksR0FBRyxHQUFHLElBQUl3SSxHQUFKLENBQVEsZ0JBQWdCTixXQUF4QixFQUFxQ0UsT0FBckMsQ0FBWixDQXBCZ0UsQ0FvQkw7O0FBQzNELFdBQU9wSSxHQUFHLENBQUN5SSxJQUFYO0FBQ0g7O0FBcGI0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRyYXZpcyBSYWxzdG9uXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gXCIuLi9TZGtDb25maWdcIjtcbmltcG9ydCBkaXMgZnJvbSAnLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCAqIGFzIHVybCBmcm9tIFwidXJsXCI7XG5pbXBvcnQgV2lkZ2V0RWNob1N0b3JlIGZyb20gJy4uL3N0b3Jlcy9XaWRnZXRFY2hvU3RvcmUnO1xuXG4vLyBIb3cgbG9uZyB3ZSB3YWl0IGZvciB0aGUgc3RhdGUgZXZlbnQgZWNobyB0byBjb21lIGJhY2sgZnJvbSB0aGUgc2VydmVyXG4vLyBiZWZvcmUgd2FpdEZvcltSb29tL1VzZXJdV2lkZ2V0IHJlamVjdHMgaXRzIHByb21pc2VcbmNvbnN0IFdJREdFVF9XQUlUX1RJTUUgPSAyMDAwMDtcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgQWN0aXZlV2lkZ2V0U3RvcmUgZnJvbSBcIi4uL3N0b3Jlcy9BY3RpdmVXaWRnZXRTdG9yZVwiO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCB7Q2FwYWJpbGl0eX0gZnJvbSBcIi4uL3dpZGdldHMvV2lkZ2V0QXBpXCI7XG5pbXBvcnQge1Jvb219IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9tb2RlbHMvcm9vbVwiO1xuaW1wb3J0IHtXaWRnZXRUeXBlfSBmcm9tIFwiLi4vd2lkZ2V0cy9XaWRnZXRUeXBlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdpZGdldFV0aWxzIHtcbiAgICAvKiBSZXR1cm5zIHRydWUgaWYgdXNlciBpcyBhYmxlIHRvIHNlbmQgc3RhdGUgZXZlbnRzIHRvIG1vZGlmeSB3aWRnZXRzIGluIHRoaXMgcm9vbVxuICAgICAqIChEb2VzIG5vdCBhcHBseSB0byBub24tcm9vbS1iYXNlZCAvIHVzZXIgd2lkZ2V0cylcbiAgICAgKiBAcGFyYW0gcm9vbUlkIC0tIFRoZSBJRCBvZiB0aGUgcm9vbSB0byBjaGVja1xuICAgICAqIEByZXR1cm4gQm9vbGVhbiAtLSB0cnVlIGlmIHRoZSB1c2VyIGNhbiBtb2RpZnkgd2lkZ2V0cyBpbiB0aGlzIHJvb21cbiAgICAgKiBAdGhyb3dzIEVycm9yIC0tIHNwZWNpZmllcyB0aGUgZXJyb3IgcmVhc29uXG4gICAgICovXG4gICAgc3RhdGljIGNhblVzZXJNb2RpZnlXaWRnZXRzKHJvb21JZCkge1xuICAgICAgICBpZiAoIXJvb21JZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyByb29tIElEIHNwZWNpZmllZCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdVc2VyIG11c3QgYmUgYmUgbG9nZ2VkIGluJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFJvb20gSUQgJHtyb29tSWR9IGlzIG5vdCByZWNvZ25pc2VkYCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZSA9IGNsaWVudC5jcmVkZW50aWFscy51c2VySWQ7XG4gICAgICAgIGlmICghbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCB1c2VyIElEJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm9vbS5nZXRNeU1lbWJlcnNoaXAoKSAhPT0gXCJqb2luXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVXNlciAke21lfSBpcyBub3QgaW4gcm9vbSAke3Jvb21JZH1gKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IEVuYWJsZSBzdXBwb3J0IGZvciBtLndpZGdldCBldmVudCB0eXBlIChodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMzExMSlcbiAgICAgICAgcmV0dXJuIHJvb20uY3VycmVudFN0YXRlLm1heVNlbmRTdGF0ZUV2ZW50KCdpbS52ZWN0b3IubW9kdWxhci53aWRnZXRzJywgbWUpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IEdlbmVyaWZ5IHRoZSBuYW1lIG9mIHRoaXMgZnVuY3Rpb24uIEl0J3Mgbm90IGp1c3Qgc2NhbGFyLlxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBzcGVjaWZpZWQgdXJsIGlzIGEgc2NhbGFyIFVSTCwgdHlwaWNhbGx5IGh0dHBzOi8vc2NhbGFyLnZlY3Rvci5pbS9hcGlcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICB0ZXN0VXJsU3RyaW5nIFVSTCB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgc3BlY2lmaWVkIFVSTCBpcyBhIHNjYWxhciBVUkxcbiAgICAgKi9cbiAgICBzdGF0aWMgaXNTY2FsYXJVcmwodGVzdFVybFN0cmluZykge1xuICAgICAgICBpZiAoIXRlc3RVcmxTdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NjYWxhciBVUkwgY2hlY2sgZmFpbGVkLiBObyBVUkwgc3BlY2lmaWVkJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZXN0VXJsID0gdXJsLnBhcnNlKHRlc3RVcmxTdHJpbmcpO1xuICAgICAgICBsZXQgc2NhbGFyVXJscyA9IFNka0NvbmZpZy5nZXQoKS5pbnRlZ3JhdGlvbnNfd2lkZ2V0c191cmxzO1xuICAgICAgICBpZiAoIXNjYWxhclVybHMgfHwgc2NhbGFyVXJscy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRNYW5hZ2VyID0gSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLmdldFByaW1hcnlNYW5hZ2VyKCk7XG4gICAgICAgICAgICBpZiAoZGVmYXVsdE1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICBzY2FsYXJVcmxzID0gW2RlZmF1bHRNYW5hZ2VyLmFwaVVybF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjYWxhclVybHMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NhbGFyVXJscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgc2NhbGFyVXJsID0gdXJsLnBhcnNlKHNjYWxhclVybHNbaV0pO1xuICAgICAgICAgICAgaWYgKHRlc3RVcmwgJiYgc2NhbGFyVXJsKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0ZXN0VXJsLnByb3RvY29sID09PSBzY2FsYXJVcmwucHJvdG9jb2wgJiZcbiAgICAgICAgICAgICAgICAgICAgdGVzdFVybC5ob3N0ID09PSBzY2FsYXJVcmwuaG9zdCAmJlxuICAgICAgICAgICAgICAgICAgICB0ZXN0VXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoc2NhbGFyVXJsLnBhdGhuYW1lKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBhIHdpZGdldCB3aXRoIHRoZSBnaXZlblxuICAgICAqIElEIGhhcyBiZWVuIGFkZGVkIGFzIGEgdXNlciB3aWRnZXQgKGllLiB0aGUgYWNjb3VudERhdGEgZXZlbnRcbiAgICAgKiBhcnJpdmVzKSBvciByZWplY3RzIGFmdGVyIGEgdGltZW91dFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHdpZGdldElkIFRoZSBJRCBvZiB0aGUgd2lkZ2V0IHRvIHdhaXQgZm9yXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhZGQgVHJ1ZSB0byB3YWl0IGZvciB0aGUgd2lkZ2V0IHRvIGJlIGFkZGVkLFxuICAgICAqICAgICBmYWxzZSB0byB3YWl0IGZvciBpdCB0byBiZSBkZWxldGVkLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHdpZGdldCBpcyBpbiB0aGVcbiAgICAgKiAgICAgcmVxdWVzdGVkIHN0YXRlIGFjY29yZGluZyB0byB0aGUgYGFkZGAgcGFyYW1cbiAgICAgKi9cbiAgICBzdGF0aWMgd2FpdEZvclVzZXJXaWRnZXQod2lkZ2V0SWQsIGFkZCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgLy8gVGVzdHMgYW4gYWNjb3VudCBkYXRhIGV2ZW50LCByZXR1cm5pbmcgdHJ1ZSBpZiBpdCdzIGluIHRoZSBzdGF0ZVxuICAgICAgICAgICAgLy8gd2UncmUgd2FpdGluZyBmb3IgaXQgdG8gYmUgaW5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV2ZW50SW5JbnRlbmRlZFN0YXRlKGV2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFldiB8fCAhZXYuZ2V0Q29udGVudCgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXYuZ2V0Q29udGVudCgpW3dpZGdldElkXSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldi5nZXRDb250ZW50KClbd2lkZ2V0SWRdID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzdGFydGluZ0FjY291bnREYXRhRXZlbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0QWNjb3VudERhdGEoJ20ud2lkZ2V0cycpO1xuICAgICAgICAgICAgaWYgKGV2ZW50SW5JbnRlbmRlZFN0YXRlKHN0YXJ0aW5nQWNjb3VudERhdGFFdmVudCkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbkFjY291bnREYXRhKGV2KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEFjY291bnREYXRhRXZlbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0QWNjb3VudERhdGEoJ20ud2lkZ2V0cycpO1xuICAgICAgICAgICAgICAgIGlmIChldmVudEluSW50ZW5kZWRTdGF0ZShjdXJyZW50QWNjb3VudERhdGFFdmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKCdhY2NvdW50RGF0YScsIG9uQWNjb3VudERhdGEpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0aW1lcklkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKCdhY2NvdW50RGF0YScsIG9uQWNjb3VudERhdGEpO1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJUaW1lZCBvdXQgd2FpdGluZyBmb3Igd2lkZ2V0IElEIFwiICsgd2lkZ2V0SWQgKyBcIiB0byBhcHBlYXJcIikpO1xuICAgICAgICAgICAgfSwgV0lER0VUX1dBSVRfVElNRSk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oJ2FjY291bnREYXRhJywgb25BY2NvdW50RGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBhIHdpZGdldCB3aXRoIHRoZSBnaXZlblxuICAgICAqIElEIGhhcyBiZWVuIGFkZGVkIGFzIGEgcm9vbSB3aWRnZXQgaW4gdGhlIGdpdmVuIHJvb20gKGllLiB0aGVcbiAgICAgKiByb29tIHN0YXRlIGV2ZW50IGFycml2ZXMpIG9yIHJlamVjdHMgYWZ0ZXIgYSB0aW1lb3V0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gd2lkZ2V0SWQgVGhlIElEIG9mIHRoZSB3aWRnZXQgdG8gd2FpdCBmb3JcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcm9vbUlkIFRoZSBJRCBvZiB0aGUgcm9vbSB0byB3YWl0IGZvciB0aGUgd2lkZ2V0IGluXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhZGQgVHJ1ZSB0byB3YWl0IGZvciB0aGUgd2lkZ2V0IHRvIGJlIGFkZGVkLFxuICAgICAqICAgICBmYWxzZSB0byB3YWl0IGZvciBpdCB0byBiZSBkZWxldGVkLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHdpZGdldCBpcyBpbiB0aGVcbiAgICAgKiAgICAgcmVxdWVzdGVkIHN0YXRlIGFjY29yZGluZyB0byB0aGUgYGFkZGAgcGFyYW1cbiAgICAgKi9cbiAgICBzdGF0aWMgd2FpdEZvclJvb21XaWRnZXQod2lkZ2V0SWQsIHJvb21JZCwgYWRkKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyBUZXN0cyBhIGxpc3Qgb2Ygc3RhdGUgZXZlbnRzLCByZXR1cm5pbmcgdHJ1ZSBpZiBpdCdzIGluIHRoZSBzdGF0ZVxuICAgICAgICAgICAgLy8gd2UncmUgd2FpdGluZyBmb3IgaXQgdG8gYmUgaW5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV2ZW50c0luSW50ZW5kZWRTdGF0ZShldkxpc3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3aWRnZXRQcmVzZW50ID0gZXZMaXN0LnNvbWUoKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldi5nZXRDb250ZW50KCkgJiYgZXYuZ2V0Q29udGVudCgpWydpZCddID09PSB3aWRnZXRJZDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aWRnZXRQcmVzZW50O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhd2lkZ2V0UHJlc2VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICAgICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0ud2lkZ2V0IGV2ZW50IHR5cGUgKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzEzMTExKVxuICAgICAgICAgICAgY29uc3Qgc3RhcnRpbmdXaWRnZXRFdmVudHMgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnaW0udmVjdG9yLm1vZHVsYXIud2lkZ2V0cycpO1xuICAgICAgICAgICAgaWYgKGV2ZW50c0luSW50ZW5kZWRTdGF0ZShzdGFydGluZ1dpZGdldEV2ZW50cykpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvblJvb21TdGF0ZUV2ZW50cyhldikge1xuICAgICAgICAgICAgICAgIGlmIChldi5nZXRSb29tSWQoKSAhPT0gcm9vbUlkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS53aWRnZXQgZXZlbnQgdHlwZSAoaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTMxMTEpXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFdpZGdldEV2ZW50cyA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdpbS52ZWN0b3IubW9kdWxhci53aWRnZXRzJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzSW5JbnRlbmRlZFN0YXRlKGN1cnJlbnRXaWRnZXRFdmVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignUm9vbVN0YXRlLmV2ZW50cycsIG9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdGltZXJJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignUm9vbVN0YXRlLmV2ZW50cycsIG9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiVGltZWQgb3V0IHdhaXRpbmcgZm9yIHdpZGdldCBJRCBcIiArIHdpZGdldElkICsgXCIgdG8gYXBwZWFyXCIpKTtcbiAgICAgICAgICAgIH0sIFdJREdFVF9XQUlUX1RJTUUpO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKCdSb29tU3RhdGUuZXZlbnRzJywgb25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgc2V0VXNlcldpZGdldCh3aWRnZXRJZCwgd2lkZ2V0VHlwZTogV2lkZ2V0VHlwZSwgd2lkZ2V0VXJsLCB3aWRnZXROYW1lLCB3aWRnZXREYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB0eXBlOiB3aWRnZXRUeXBlLnByZWZlcnJlZCxcbiAgICAgICAgICAgIHVybDogd2lkZ2V0VXJsLFxuICAgICAgICAgICAgbmFtZTogd2lkZ2V0TmFtZSxcbiAgICAgICAgICAgIGRhdGE6IHdpZGdldERhdGEsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgd2lkZ2V0cyBhbmQgY2xvbmUgdGhlbSBiZWZvcmUgd2UgbW9kaWZ5IHRoZW0sIG90aGVyd2lzZVxuICAgICAgICAvLyB3ZSdsbCBtb2RpZnkgdGhlIGNvbnRlbnQgb2YgdGhlIG9sZCBldmVudC5cbiAgICAgICAgY29uc3QgdXNlcldpZGdldHMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KFdpZGdldFV0aWxzLmdldFVzZXJXaWRnZXRzKCkpKTtcblxuICAgICAgICAvLyBEZWxldGUgZXhpc3Rpbmcgd2lkZ2V0IHdpdGggSURcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRlbGV0ZSB1c2VyV2lkZ2V0c1t3aWRnZXRJZF07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR3aWRnZXRJZCBpcyBub24tY29uZmlndXJhYmxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhZGRpbmdXaWRnZXQgPSBCb29sZWFuKHdpZGdldFVybCk7XG5cbiAgICAgICAgLy8gQWRkIG5ldyB3aWRnZXQgLyB1cGRhdGVcbiAgICAgICAgaWYgKGFkZGluZ1dpZGdldCkge1xuICAgICAgICAgICAgdXNlcldpZGdldHNbd2lkZ2V0SWRdID0ge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICAgICAgc2VuZGVyOiBjbGllbnQuZ2V0VXNlcklkKCksXG4gICAgICAgICAgICAgICAgc3RhdGVfa2V5OiB3aWRnZXRJZCxcbiAgICAgICAgICAgICAgICB0eXBlOiAnbS53aWRnZXQnLFxuICAgICAgICAgICAgICAgIGlkOiB3aWRnZXRJZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIHN0YXJ0cyBsaXN0ZW5pbmcgZm9yIHdoZW4gdGhlIGVjaG8gY29tZXMgYmFjayBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgLy8gc2luY2UgdGhlIHdpZGdldCB3b24ndCBhcHBlYXIgYWRkZWQgdW50aWwgdGhpcyBoYXBwZW5zLiBJZiB3ZSBkb24ndFxuICAgICAgICAvLyB3YWl0IGZvciB0aGlzLCB0aGUgYWN0aW9uIHdpbGwgY29tcGxldGUgYnV0IGlmIHRoZSB1c2VyIGlzIGZhc3QgZW5vdWdoLFxuICAgICAgICAvLyB0aGUgd2lkZ2V0IHN0aWxsIHdvbid0IGFjdHVhbGx5IGJlIHRoZXJlLlxuICAgICAgICByZXR1cm4gY2xpZW50LnNldEFjY291bnREYXRhKCdtLndpZGdldHMnLCB1c2VyV2lkZ2V0cykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gV2lkZ2V0VXRpbHMud2FpdEZvclVzZXJXaWRnZXQod2lkZ2V0SWQsIGFkZGluZ1dpZGdldCk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiBcInVzZXJfd2lkZ2V0X3VwZGF0ZWRcIiB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHNldFJvb21XaWRnZXQocm9vbUlkLCB3aWRnZXRJZCwgd2lkZ2V0VHlwZTogV2lkZ2V0VHlwZSwgd2lkZ2V0VXJsLCB3aWRnZXROYW1lLCB3aWRnZXREYXRhKSB7XG4gICAgICAgIGxldCBjb250ZW50O1xuXG4gICAgICAgIGNvbnN0IGFkZGluZ1dpZGdldCA9IEJvb2xlYW4od2lkZ2V0VXJsKTtcblxuICAgICAgICBpZiAoYWRkaW5nV2lkZ2V0KSB7XG4gICAgICAgICAgICBjb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEVuYWJsZSBzdXBwb3J0IGZvciBtLndpZGdldCBldmVudCB0eXBlIChodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMzExMSlcbiAgICAgICAgICAgICAgICAvLyBGb3Igbm93IHdlJ2xsIHNlbmQgdGhlIGxlZ2FjeSBldmVudCB0eXBlIGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgYXBwcy9yaW90c1xuICAgICAgICAgICAgICAgIHR5cGU6IHdpZGdldFR5cGUubGVnYWN5LFxuICAgICAgICAgICAgICAgIHVybDogd2lkZ2V0VXJsLFxuICAgICAgICAgICAgICAgIG5hbWU6IHdpZGdldE5hbWUsXG4gICAgICAgICAgICAgICAgZGF0YTogd2lkZ2V0RGF0YSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50ID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBXaWRnZXRFY2hvU3RvcmUuc2V0Um9vbVdpZGdldEVjaG8ocm9vbUlkLCB3aWRnZXRJZCwgY29udGVudCk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS53aWRnZXQgZXZlbnQgdHlwZSAoaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTMxMTEpXG4gICAgICAgIHJldHVybiBjbGllbnQuc2VuZFN0YXRlRXZlbnQocm9vbUlkLCBcImltLnZlY3Rvci5tb2R1bGFyLndpZGdldHNcIiwgY29udGVudCwgd2lkZ2V0SWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFdpZGdldFV0aWxzLndhaXRGb3JSb29tV2lkZ2V0KHdpZGdldElkLCByb29tSWQsIGFkZGluZ1dpZGdldCk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgV2lkZ2V0RWNob1N0b3JlLnJlbW92ZVJvb21XaWRnZXRFY2hvKHJvb21JZCwgd2lkZ2V0SWQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcm9vbSBzcGVjaWZpYyB3aWRnZXRzXG4gICAgICogQHBhcmFtICB7Um9vbX0gcm9vbSBUaGUgcm9vbSB0byBnZXQgd2lkZ2V0cyBmb3JjZVxuICAgICAqIEByZXR1cm4ge1tvYmplY3RdfSBBcnJheSBjb250YWluaW5nIGN1cnJlbnQgLyBhY3RpdmUgcm9vbSB3aWRnZXRzXG4gICAgICovXG4gICAgc3RhdGljIGdldFJvb21XaWRnZXRzKHJvb206IFJvb20pIHtcbiAgICAgICAgLy8gVE9ETzogRW5hYmxlIHN1cHBvcnQgZm9yIG0ud2lkZ2V0IGV2ZW50IHR5cGUgKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzEzMTExKVxuICAgICAgICBjb25zdCBhcHBzU3RhdGVFdmVudHMgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnaW0udmVjdG9yLm1vZHVsYXIud2lkZ2V0cycpO1xuICAgICAgICBpZiAoIWFwcHNTdGF0ZUV2ZW50cykge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFwcHNTdGF0ZUV2ZW50cy5maWx0ZXIoKGV2KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXYuZ2V0Q29udGVudCgpLnR5cGUgJiYgZXYuZ2V0Q29udGVudCgpLnVybDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHVzZXIgc3BlY2lmaWMgd2lkZ2V0cyAobm90IGxpbmtlZCB0byBhIHNwZWNpZmljIHJvb20pXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBFdmVudCBjb250ZW50IG9iamVjdCBjb250YWluaW5nIGN1cnJlbnQgLyBhY3RpdmUgdXNlciB3aWRnZXRzXG4gICAgICovXG4gICAgc3RhdGljIGdldFVzZXJXaWRnZXRzKCkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGxvZ2dlZCBpbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVzZXJXaWRnZXRzID0gY2xpZW50LmdldEFjY291bnREYXRhKCdtLndpZGdldHMnKTtcbiAgICAgICAgaWYgKHVzZXJXaWRnZXRzICYmIHVzZXJXaWRnZXRzLmdldENvbnRlbnQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJXaWRnZXRzLmdldENvbnRlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHVzZXIgc3BlY2lmaWMgd2lkZ2V0cyAobm90IGxpbmtlZCB0byBhIHNwZWNpZmljIHJvb20pIGFzIGFuIGFycmF5XG4gICAgICogQHJldHVybiB7W29iamVjdF19IEFycmF5IGNvbnRhaW5pbmcgY3VycmVudCAvIGFjdGl2ZSB1c2VyIHdpZGdldHNcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0VXNlcldpZGdldHNBcnJheSgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC52YWx1ZXMoV2lkZ2V0VXRpbHMuZ2V0VXNlcldpZGdldHMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFjdGl2ZSBzdGlja2VycGlja2VyIHdpZGdldHMgKHN0aWNrZXJwaWNrZXJzIGFyZSB1c2VyIHdpZGdldHMgYnkgbmF0dXJlKVxuICAgICAqIEByZXR1cm4ge1tvYmplY3RdfSBBcnJheSBjb250YWluaW5nIGN1cnJlbnQgLyBhY3RpdmUgc3RpY2tlcnBpY2tlciB3aWRnZXRzXG4gICAgICovXG4gICAgc3RhdGljIGdldFN0aWNrZXJwaWNrZXJXaWRnZXRzKCkge1xuICAgICAgICBjb25zdCB3aWRnZXRzID0gV2lkZ2V0VXRpbHMuZ2V0VXNlcldpZGdldHNBcnJheSgpO1xuICAgICAgICByZXR1cm4gd2lkZ2V0cy5maWx0ZXIoKHdpZGdldCkgPT4gd2lkZ2V0LmNvbnRlbnQgJiYgd2lkZ2V0LmNvbnRlbnQudHlwZSA9PT0gXCJtLnN0aWNrZXJwaWNrZXJcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBpbnRlZ3JhdGlvbiBtYW5hZ2VyIHdpZGdldHMgZm9yIHRoaXMgdXNlci5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0W119IEFuIGFycmF5IG9mIGludGVncmF0aW9uIG1hbmFnZXIgdXNlciB3aWRnZXRzLlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRJbnRlZ3JhdGlvbk1hbmFnZXJXaWRnZXRzKCkge1xuICAgICAgICBjb25zdCB3aWRnZXRzID0gV2lkZ2V0VXRpbHMuZ2V0VXNlcldpZGdldHNBcnJheSgpO1xuICAgICAgICByZXR1cm4gd2lkZ2V0cy5maWx0ZXIodyA9PiB3LmNvbnRlbnQgJiYgdy5jb250ZW50LnR5cGUgPT09IFwibS5pbnRlZ3JhdGlvbl9tYW5hZ2VyXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRSb29tV2lkZ2V0c09mVHlwZShyb29tOiBSb29tLCB0eXBlOiBXaWRnZXRUeXBlKSB7XG4gICAgICAgIGNvbnN0IHdpZGdldHMgPSBXaWRnZXRVdGlscy5nZXRSb29tV2lkZ2V0cyhyb29tKTtcbiAgICAgICAgcmV0dXJuICh3aWRnZXRzIHx8IFtdKS5maWx0ZXIodyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gdy5nZXRDb250ZW50KCk7XG4gICAgICAgICAgICByZXR1cm4gY29udGVudC51cmwgJiYgdHlwZS5tYXRjaGVzKGNvbnRlbnQudHlwZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVJbnRlZ3JhdGlvbk1hbmFnZXJXaWRnZXRzKCkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGxvZ2dlZCBpbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpZGdldHMgPSBjbGllbnQuZ2V0QWNjb3VudERhdGEoJ20ud2lkZ2V0cycpO1xuICAgICAgICBpZiAoIXdpZGdldHMpIHJldHVybjtcbiAgICAgICAgY29uc3QgdXNlcldpZGdldHMgPSB3aWRnZXRzLmdldENvbnRlbnQoKSB8fCB7fTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXModXNlcldpZGdldHMpLmZvckVhY2goKFtrZXksIHdpZGdldF0pID0+IHtcbiAgICAgICAgICAgIGlmICh3aWRnZXQuY29udGVudCAmJiB3aWRnZXQuY29udGVudC50eXBlID09PSBcIm0uaW50ZWdyYXRpb25fbWFuYWdlclwiKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHVzZXJXaWRnZXRzW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xpZW50LnNldEFjY291bnREYXRhKCdtLndpZGdldHMnLCB1c2VyV2lkZ2V0cyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFkZEludGVncmF0aW9uTWFuYWdlcldpZGdldChuYW1lOiBzdHJpbmcsIHVpVXJsOiBzdHJpbmcsIGFwaVVybDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBXaWRnZXRVdGlscy5zZXRVc2VyV2lkZ2V0KFxuICAgICAgICAgICAgXCJpbnRlZ3JhdGlvbl9tYW5hZ2VyX1wiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKSxcbiAgICAgICAgICAgIFdpZGdldFR5cGUuSU5URUdSQVRJT05fTUFOQUdFUixcbiAgICAgICAgICAgIHVpVXJsLFxuICAgICAgICAgICAgXCJJbnRlZ3JhdGlvbiBNYW5hZ2VyOiBcIiArIG5hbWUsXG4gICAgICAgICAgICB7XCJhcGlfdXJsXCI6IGFwaVVybH0sXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBzdGlja2VycGlja2VyIHdpZGdldHMgKHN0aWNrZXJwaWNrZXJzIGFyZSB1c2VyIHdpZGdldHMgYnkgbmF0dXJlKVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFJlc29sdmVzIG9uIGFjY291bnQgZGF0YSB1cGRhdGVkXG4gICAgICovXG4gICAgc3RhdGljIHJlbW92ZVN0aWNrZXJwaWNrZXJXaWRnZXRzKCkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGxvZ2dlZCBpbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpZGdldHMgPSBjbGllbnQuZ2V0QWNjb3VudERhdGEoJ20ud2lkZ2V0cycpO1xuICAgICAgICBpZiAoIXdpZGdldHMpIHJldHVybjtcbiAgICAgICAgY29uc3QgdXNlcldpZGdldHMgPSB3aWRnZXRzLmdldENvbnRlbnQoKSB8fCB7fTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXModXNlcldpZGdldHMpLmZvckVhY2goKFtrZXksIHdpZGdldF0pID0+IHtcbiAgICAgICAgICAgIGlmICh3aWRnZXQuY29udGVudCAmJiB3aWRnZXQuY29udGVudC50eXBlID09PSAnbS5zdGlja2VycGlja2VyJykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB1c2VyV2lkZ2V0c1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNsaWVudC5zZXRBY2NvdW50RGF0YSgnbS53aWRnZXRzJywgdXNlcldpZGdldHMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYWtlQXBwQ29uZmlnKGFwcElkLCBhcHAsIHNlbmRlclVzZXJJZCwgcm9vbUlkLCBldmVudElkKSB7XG4gICAgICAgIGlmICghc2VuZGVyVXNlcklkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXaWRnZXRzIG11c3QgYmUgY3JlYXRlZCBieSBzb21lb25lIC0gcHJvdmlkZSBhIHNlbmRlclVzZXJJZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBhcHAuY3JlYXRvclVzZXJJZCA9IHNlbmRlclVzZXJJZDtcblxuICAgICAgICBhcHAuaWQgPSBhcHBJZDtcbiAgICAgICAgYXBwLmV2ZW50SWQgPSBldmVudElkO1xuICAgICAgICBhcHAubmFtZSA9IGFwcC5uYW1lIHx8IGFwcC50eXBlO1xuXG4gICAgICAgIHJldHVybiBhcHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENhcFdoaXRlbGlzdEZvckFwcFR5cGVJblJvb21JZChhcHBUeXBlLCByb29tSWQpIHtcbiAgICAgICAgY29uc3QgZW5hYmxlU2NyZWVuc2hvdHMgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZW5hYmxlV2lkZ2V0U2NyZWVuc2hvdHNcIiwgcm9vbUlkKTtcblxuICAgICAgICBjb25zdCBjYXBXaGl0ZWxpc3QgPSBlbmFibGVTY3JlZW5zaG90cyA/IFtDYXBhYmlsaXR5LlNjcmVlbnNob3RdIDogW107XG5cbiAgICAgICAgLy8gT2J2aW91c2x5IGFueW9uZSB0aGF0IGNhbiBhZGQgYSB3aWRnZXQgY2FuIGNsYWltIGl0J3MgYSBqaXRzaSB3aWRnZXQsXG4gICAgICAgIC8vIHNvIHRoaXMgZG9lc24ndCByZWFsbHkgb2ZmZXIgbXVjaCBvdmVyIHRoZSBzZXQgb2YgZG9tYWlucyB3ZSBsb2FkXG4gICAgICAgIC8vIHdpZGdldHMgZnJvbSBhdCBhbGwsIGJ1dCBpdCBwcm9iYWJseSBtYWtlcyBzZW5zZSBmb3Igc2FuaXR5LlxuICAgICAgICBpZiAoV2lkZ2V0VHlwZS5KSVRTSS5tYXRjaGVzKGFwcFR5cGUpKSB7XG4gICAgICAgICAgICBjYXBXaGl0ZWxpc3QucHVzaChDYXBhYmlsaXR5LkFsd2F5c09uU2NyZWVuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYXBXaGl0ZWxpc3Q7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFdpZGdldFNlY3VyaXR5S2V5KHdpZGdldElkLCB3aWRnZXRVcmwsIGlzVXNlcldpZGdldCkge1xuICAgICAgICBsZXQgd2lkZ2V0TG9jYXRpb24gPSBBY3RpdmVXaWRnZXRTdG9yZS5nZXRSb29tSWQod2lkZ2V0SWQpO1xuXG4gICAgICAgIGlmIChpc1VzZXJXaWRnZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJXaWRnZXQgPSBXaWRnZXRVdGlscy5nZXRVc2VyV2lkZ2V0c0FycmF5KClcbiAgICAgICAgICAgICAgICAuZmluZCgodykgPT4gdy5pZCA9PT0gd2lkZ2V0SWQgJiYgdy5jb250ZW50ICYmIHcuY29udGVudC51cmwgPT09IHdpZGdldFVybCk7XG5cbiAgICAgICAgICAgIGlmICghdXNlcldpZGdldCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hdGNoaW5nIHVzZXIgd2lkZ2V0IHRvIGZvcm0gc2VjdXJpdHkga2V5XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aWRnZXRMb2NhdGlvbiA9IHVzZXJXaWRnZXQuc2VuZGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF3aWRnZXRMb2NhdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvY2F0ZSB3aGVyZSB0aGUgd2lkZ2V0IHJlc2lkZXNcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KGAke3dpZGdldExvY2F0aW9ufTo6JHt3aWRnZXRVcmx9YCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldExvY2FsSml0c2lXcmFwcGVyVXJsKG9wdHM6IHtmb3JMb2NhbFJlbmRlcj86IGJvb2xlYW59PXt9KSB7XG4gICAgICAgIC8vIE5CLiB3ZSBjYW4ndCBqdXN0IGVuY29kZVVSSUNvbXBvbmVudCBhbGwgb2YgdGhlc2UgYmVjYXVzZSB0aGUgJCBzaWducyBuZWVkIHRvIGJlIHRoZXJlXG4gICAgICAgIGNvbnN0IHF1ZXJ5U3RyaW5nID0gW1xuICAgICAgICAgICAgJ2NvbmZlcmVuY2VEb21haW49JGRvbWFpbicsXG4gICAgICAgICAgICAnY29uZmVyZW5jZUlkPSRjb25mZXJlbmNlSWQnLFxuICAgICAgICAgICAgJ2lzQXVkaW9Pbmx5PSRpc0F1ZGlvT25seScsXG4gICAgICAgICAgICAnZGlzcGxheU5hbWU9JG1hdHJpeF9kaXNwbGF5X25hbWUnLFxuICAgICAgICAgICAgJ2F2YXRhclVybD0kbWF0cml4X2F2YXRhcl91cmwnLFxuICAgICAgICAgICAgJ3VzZXJJZD0kbWF0cml4X3VzZXJfaWQnLFxuICAgICAgICBdLmpvaW4oJyYnKTtcblxuICAgICAgICBsZXQgYmFzZVVybCA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCAhPT0gXCJodHRwczpcIiAmJiAhb3B0cy5mb3JMb2NhbFJlbmRlcikge1xuICAgICAgICAgICAgLy8gVXNlIGFuIGV4dGVybmFsIHdyYXBwZXIgaWYgd2UncmUgbm90IGxvY2FsbHkgcmVuZGVyaW5nIHRoZSB3aWRnZXQuIFRoaXMgaXMgdXN1YWxseVxuICAgICAgICAgICAgLy8gdGhlIFVSTCB0aGF0IHdpbGwgZW5kIHVwIGluIHRoZSB3aWRnZXQgZXZlbnQsIHNvIHdlIHdhbnQgdG8gbWFrZSBzdXJlIGl0J3MgcmVsYXRpdmVseVxuICAgICAgICAgICAgLy8gc2FmZSB0byBzZW5kLlxuICAgICAgICAgICAgLy8gV2UnbGwgZW5kIHVwIHVzaW5nIGEgbG9jYWwgcmVuZGVyIFVSTCB3aGVuIHdlIHNlZSBhIEppdHNpIHdpZGdldCBhbnl3YXlzLCBzbyB0aGlzIGlzXG4gICAgICAgICAgICAvLyByZWFsbHkganVzdCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgYW5kIHRvIGFwcGVhc2UgdGhlIHNwZWMuXG4gICAgICAgICAgICBiYXNlVXJsID0gXCJodHRwczovL3Jpb3QuaW0vYXBwL1wiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoXCJqaXRzaS5odG1sI1wiICsgcXVlcnlTdHJpbmcsIGJhc2VVcmwpOyAvLyB0aGlzIHN0cmlwcyBoYXNoIGZyYWdtZW50IGZyb20gYmFzZVVybFxuICAgICAgICByZXR1cm4gdXJsLmhyZWY7XG4gICAgfVxufVxuIl19