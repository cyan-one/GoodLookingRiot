"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _PlatformPeg = _interopRequireDefault(require("./PlatformPeg"));

var TextForEvent = _interopRequireWildcard(require("./TextForEvent"));

var _Analytics = _interopRequireDefault(require("./Analytics"));

var Avatar = _interopRequireWildcard(require("./Avatar"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("./index"));

var _languageHandler = require("./languageHandler");

var _Modal = _interopRequireDefault(require("./Modal"));

var _SettingsStore = _interopRequireWildcard(require("./settings/SettingsStore"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd

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

/*
 * Dispatches:
 * {
 *   action: "notifier_enabled",
 *   value: boolean
 * }
 */
const MAX_PENDING_ENCRYPTED = 20;
/*
Override both the content body and the TextForEvent handler for specific msgtypes, in notifications.
This is useful when the content body contains fallback text that would explain that the client can't handle a particular
type of tile.
*/

const typehandlers = {
  "m.key.verification.request": event => {
    const name = (event.sender || {}).name;
    return (0, _languageHandler._t)("%(name)s is requesting verification", {
      name
    });
  }
};
const Notifier = {
  notifsByRoom: {},
  // A list of event IDs that we've received but need to wait until
  // they're decrypted until we decide whether to notify for them
  // or not
  pendingEncryptedEventIds: [],
  notificationMessageForEvent: function (ev) {
    if (typehandlers.hasOwnProperty(ev.getContent().msgtype)) {
      return typehandlers[ev.getContent().msgtype](ev);
    }

    return TextForEvent.textForEvent(ev);
  },
  _displayPopupNotification: function (ev, room) {
    const plaf = _PlatformPeg.default.get();

    if (!plaf) {
      return;
    }

    if (!plaf.supportsNotifications() || !plaf.maySendNotifications()) {
      return;
    }

    if (global.document.hasFocus()) {
      return;
    }

    let msg = this.notificationMessageForEvent(ev);
    if (!msg) return;
    let title;

    if (!ev.sender || room.name === ev.sender.name) {
      title = room.name; // notificationMessageForEvent includes sender,
      // but we already have the sender here

      if (ev.getContent().body && !typehandlers.hasOwnProperty(ev.getContent().msgtype)) {
        msg = ev.getContent().body;
      }
    } else if (ev.getType() === 'm.room.member') {
      // context is all in the message here, we don't need
      // to display sender info
      title = room.name;
    } else if (ev.sender) {
      title = ev.sender.name + " (" + room.name + ")"; // notificationMessageForEvent includes sender,
      // but we've just out sender in the title

      if (ev.getContent().body && !typehandlers.hasOwnProperty(ev.getContent().msgtype)) {
        msg = ev.getContent().body;
      }
    }

    if (!this.isBodyEnabled()) {
      msg = '';
    }

    let avatarUrl = null;

    if (ev.sender && !_SettingsStore.default.getValue("lowBandwidth")) {
      avatarUrl = Avatar.avatarUrlForMember(ev.sender, 40, 40, 'crop');
    }

    const notif = plaf.displayNotification(title, msg, avatarUrl, room); // if displayNotification returns non-null,  the platform supports
    // clearing notifications later, so keep track of this.

    if (notif) {
      if (this.notifsByRoom[ev.getRoomId()] === undefined) this.notifsByRoom[ev.getRoomId()] = [];
      this.notifsByRoom[ev.getRoomId()].push(notif);
    }
  },
  getSoundForRoom: async function (roomId) {
    // We do no caching here because the SDK caches setting
    // and the browser will cache the sound.
    const content = _SettingsStore.default.getValue("notificationSound", roomId);

    if (!content) {
      return null;
    }

    if (!content.url) {
      console.warn("".concat(roomId, " has custom notification sound event, but no url key"));
      return null;
    }

    if (!content.url.startsWith("mxc://")) {
      console.warn("".concat(roomId, " has custom notification sound event, but url is not a mxc url"));
      return null;
    } // Ideally in here we could use MSC1310 to detect the type of file, and reject it.


    return {
      url: _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(content.url),
      name: content.name,
      type: content.type,
      size: content.size
    };
  },
  _playAudioNotification: async function (ev, room) {
    const sound = await this.getSoundForRoom(room.roomId);
    console.log("Got sound ".concat(sound && sound.name || "default", " for ").concat(room.roomId));

    try {
      const selector = document.querySelector(sound ? "audio[src='".concat(sound.url, "']") : "#messageAudio");
      let audioElement = selector;

      if (!selector) {
        if (!sound) {
          console.error("No audio element or sound to play for notification");
          return;
        }

        audioElement = new Audio(sound.url);

        if (sound.type) {
          audioElement.type = sound.type;
        }

        document.body.appendChild(audioElement);
      }

      await audioElement.play();
    } catch (ex) {
      console.warn("Caught error when trying to fetch room notification sound:", ex);
    }
  },
  start: function () {
    // do not re-bind in the case of repeated call
    this.boundOnEvent = this.boundOnEvent || this.onEvent.bind(this);
    this.boundOnSyncStateChange = this.boundOnSyncStateChange || this.onSyncStateChange.bind(this);
    this.boundOnRoomReceipt = this.boundOnRoomReceipt || this.onRoomReceipt.bind(this);
    this.boundOnEventDecrypted = this.boundOnEventDecrypted || this.onEventDecrypted.bind(this);

    _MatrixClientPeg.MatrixClientPeg.get().on('event', this.boundOnEvent);

    _MatrixClientPeg.MatrixClientPeg.get().on('Room.receipt', this.boundOnRoomReceipt);

    _MatrixClientPeg.MatrixClientPeg.get().on('Event.decrypted', this.boundOnEventDecrypted);

    _MatrixClientPeg.MatrixClientPeg.get().on("sync", this.boundOnSyncStateChange);

    this.toolbarHidden = false;
    this.isSyncing = false;
  },
  stop: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener('Event', this.boundOnEvent);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener('Room.receipt', this.boundOnRoomReceipt);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener('Event.decrypted', this.boundOnEventDecrypted);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener('sync', this.boundOnSyncStateChange);
    }

    this.isSyncing = false;
  },
  supportsDesktopNotifications: function () {
    const plaf = _PlatformPeg.default.get();

    return plaf && plaf.supportsNotifications();
  },
  setEnabled: function (enable, callback) {
    const plaf = _PlatformPeg.default.get();

    if (!plaf) return; // Dev note: We don't set the "notificationsEnabled" setting to true here because it is a
    // calculated value. It is determined based upon whether or not the master rule is enabled
    // and other flags. Setting it here would cause a circular reference.

    _Analytics.default.trackEvent('Notifier', 'Set Enabled', enable); // make sure that we persist the current setting audio_enabled setting
    // before changing anything


    if (_SettingsStore.default.isLevelSupported(_SettingsStore.SettingLevel.DEVICE)) {
      _SettingsStore.default.setValue("audioNotificationsEnabled", null, _SettingsStore.SettingLevel.DEVICE, this.isEnabled());
    }

    if (enable) {
      // Attempt to get permission from user
      plaf.requestNotificationPermission().then(result => {
        if (result !== 'granted') {
          // The permission request was dismissed or denied
          // TODO: Support alternative branding in messaging
          const description = result === 'denied' ? (0, _languageHandler._t)('Riot does not have permission to send you notifications - ' + 'please check your browser settings') : (0, _languageHandler._t)('Riot was not given permission to send notifications - please try again');
          const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

          _Modal.default.createTrackedDialog('Unable to enable Notifications', result, ErrorDialog, {
            title: (0, _languageHandler._t)('Unable to enable Notifications'),
            description
          });

          return;
        }

        if (callback) callback();

        _dispatcher.default.dispatch({
          action: "notifier_enabled",
          value: true
        });
      });
    } else {
      _dispatcher.default.dispatch({
        action: "notifier_enabled",
        value: false
      });
    } // set the notifications_hidden flag, as the user has knowingly interacted
    // with the setting we shouldn't nag them any further


    this.setToolbarHidden(true);
  },
  isEnabled: function () {
    return this.isPossible() && _SettingsStore.default.getValue("notificationsEnabled");
  },
  isPossible: function () {
    const plaf = _PlatformPeg.default.get();

    if (!plaf) return false;
    if (!plaf.supportsNotifications()) return false;
    if (!plaf.maySendNotifications()) return false;
    return true; // possible, but not necessarily enabled
  },
  isBodyEnabled: function () {
    return this.isEnabled() && _SettingsStore.default.getValue("notificationBodyEnabled");
  },
  isAudioEnabled: function () {
    return this.isEnabled() && _SettingsStore.default.getValue("audioNotificationsEnabled");
  },
  setToolbarHidden: function (hidden, persistent = true) {
    this.toolbarHidden = hidden;

    _Analytics.default.trackEvent('Notifier', 'Set Toolbar Hidden', hidden); // XXX: why are we dispatching this here?
    // this is nothing to do with notifier_enabled


    _dispatcher.default.dispatch({
      action: "notifier_enabled",
      value: this.isEnabled()
    }); // update the info to localStorage for persistent settings


    if (persistent && global.localStorage) {
      global.localStorage.setItem("notifications_hidden", hidden);
    }
  },
  shouldShowToolbar: function () {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (!client) {
      return false;
    }

    const isGuest = client.isGuest();
    return !isGuest && this.supportsDesktopNotifications() && !this.isEnabled() && !this._isToolbarHidden();
  },
  _isToolbarHidden: function () {
    // Check localStorage for any such meta data
    if (global.localStorage) {
      return global.localStorage.getItem("notifications_hidden") === "true";
    }

    return this.toolbarHidden;
  },
  onSyncStateChange: function (state) {
    if (state === "SYNCING") {
      this.isSyncing = true;
    } else if (state === "STOPPED" || state === "ERROR") {
      this.isSyncing = false;
    }
  },
  onEvent: function (ev) {
    if (!this.isSyncing) return; // don't alert for any messages initially

    if (ev.sender && ev.sender.userId === _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) return; // If it's an encrypted event and the type is still 'm.room.encrypted',
    // it hasn't yet been decrypted, so wait until it is.

    if (ev.isBeingDecrypted() || ev.isDecryptionFailure()) {
      this.pendingEncryptedEventIds.push(ev.getId()); // don't let the list fill up indefinitely

      while (this.pendingEncryptedEventIds.length > MAX_PENDING_ENCRYPTED) {
        this.pendingEncryptedEventIds.shift();
      }

      return;
    }

    this._evaluateEvent(ev);
  },
  onEventDecrypted: function (ev) {
    // 'decrypted' means the decryption process has finished: it may have failed,
    // in which case it might decrypt soon if the keys arrive
    if (ev.isDecryptionFailure()) return;
    const idx = this.pendingEncryptedEventIds.indexOf(ev.getId());
    if (idx === -1) return;
    this.pendingEncryptedEventIds.splice(idx, 1);

    this._evaluateEvent(ev);
  },
  onRoomReceipt: function (ev, room) {
    if (room.getUnreadNotificationCount() === 0) {
      // ideally we would clear each notification when it was read,
      // but we have no way, given a read receipt, to know whether
      // the receipt comes before or after an event, so we can't
      // do this. Instead, clear all notifications for a room once
      // there are no notifs left in that room., which is not quite
      // as good but it's something.
      const plaf = _PlatformPeg.default.get();

      if (!plaf) return;
      if (this.notifsByRoom[room.roomId] === undefined) return;

      for (const notif of this.notifsByRoom[room.roomId]) {
        plaf.clearNotification(notif);
      }

      delete this.notifsByRoom[room.roomId];
    }
  },
  _evaluateEvent: function (ev) {
    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(ev.getRoomId());

    const actions = _MatrixClientPeg.MatrixClientPeg.get().getPushActionsForEvent(ev);

    if (actions && actions.notify) {
      if (this.isEnabled()) {
        this._displayPopupNotification(ev, room);
      }

      if (actions.tweaks.sound && this.isAudioEnabled()) {
        _PlatformPeg.default.get().loudNotification(ev, room);

        this._playAudioNotification(ev, room);
      }
    }
  }
};

if (!global.mxNotifier) {
  global.mxNotifier = Notifier;
}

var _default = global.mxNotifier;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Ob3RpZmllci5qcyJdLCJuYW1lcyI6WyJNQVhfUEVORElOR19FTkNSWVBURUQiLCJ0eXBlaGFuZGxlcnMiLCJldmVudCIsIm5hbWUiLCJzZW5kZXIiLCJOb3RpZmllciIsIm5vdGlmc0J5Um9vbSIsInBlbmRpbmdFbmNyeXB0ZWRFdmVudElkcyIsIm5vdGlmaWNhdGlvbk1lc3NhZ2VGb3JFdmVudCIsImV2IiwiaGFzT3duUHJvcGVydHkiLCJnZXRDb250ZW50IiwibXNndHlwZSIsIlRleHRGb3JFdmVudCIsInRleHRGb3JFdmVudCIsIl9kaXNwbGF5UG9wdXBOb3RpZmljYXRpb24iLCJyb29tIiwicGxhZiIsIlBsYXRmb3JtUGVnIiwiZ2V0Iiwic3VwcG9ydHNOb3RpZmljYXRpb25zIiwibWF5U2VuZE5vdGlmaWNhdGlvbnMiLCJnbG9iYWwiLCJkb2N1bWVudCIsImhhc0ZvY3VzIiwibXNnIiwidGl0bGUiLCJib2R5IiwiZ2V0VHlwZSIsImlzQm9keUVuYWJsZWQiLCJhdmF0YXJVcmwiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJBdmF0YXIiLCJhdmF0YXJVcmxGb3JNZW1iZXIiLCJub3RpZiIsImRpc3BsYXlOb3RpZmljYXRpb24iLCJnZXRSb29tSWQiLCJ1bmRlZmluZWQiLCJwdXNoIiwiZ2V0U291bmRGb3JSb29tIiwicm9vbUlkIiwiY29udGVudCIsInVybCIsImNvbnNvbGUiLCJ3YXJuIiwic3RhcnRzV2l0aCIsIk1hdHJpeENsaWVudFBlZyIsIm14Y1VybFRvSHR0cCIsInR5cGUiLCJzaXplIiwiX3BsYXlBdWRpb05vdGlmaWNhdGlvbiIsInNvdW5kIiwibG9nIiwic2VsZWN0b3IiLCJxdWVyeVNlbGVjdG9yIiwiYXVkaW9FbGVtZW50IiwiZXJyb3IiLCJBdWRpbyIsImFwcGVuZENoaWxkIiwicGxheSIsImV4Iiwic3RhcnQiLCJib3VuZE9uRXZlbnQiLCJvbkV2ZW50IiwiYmluZCIsImJvdW5kT25TeW5jU3RhdGVDaGFuZ2UiLCJvblN5bmNTdGF0ZUNoYW5nZSIsImJvdW5kT25Sb29tUmVjZWlwdCIsIm9uUm9vbVJlY2VpcHQiLCJib3VuZE9uRXZlbnREZWNyeXB0ZWQiLCJvbkV2ZW50RGVjcnlwdGVkIiwib24iLCJ0b29sYmFySGlkZGVuIiwiaXNTeW5jaW5nIiwic3RvcCIsInJlbW92ZUxpc3RlbmVyIiwic3VwcG9ydHNEZXNrdG9wTm90aWZpY2F0aW9ucyIsInNldEVuYWJsZWQiLCJlbmFibGUiLCJjYWxsYmFjayIsIkFuYWx5dGljcyIsInRyYWNrRXZlbnQiLCJpc0xldmVsU3VwcG9ydGVkIiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwic2V0VmFsdWUiLCJpc0VuYWJsZWQiLCJyZXF1ZXN0Tm90aWZpY2F0aW9uUGVybWlzc2lvbiIsInRoZW4iLCJyZXN1bHQiLCJkZXNjcmlwdGlvbiIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJ2YWx1ZSIsInNldFRvb2xiYXJIaWRkZW4iLCJpc1Bvc3NpYmxlIiwiaXNBdWRpb0VuYWJsZWQiLCJoaWRkZW4iLCJwZXJzaXN0ZW50IiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsInNob3VsZFNob3dUb29sYmFyIiwiY2xpZW50IiwiaXNHdWVzdCIsIl9pc1Rvb2xiYXJIaWRkZW4iLCJnZXRJdGVtIiwic3RhdGUiLCJ1c2VySWQiLCJjcmVkZW50aWFscyIsImlzQmVpbmdEZWNyeXB0ZWQiLCJpc0RlY3J5cHRpb25GYWlsdXJlIiwiZ2V0SWQiLCJsZW5ndGgiLCJzaGlmdCIsIl9ldmFsdWF0ZUV2ZW50IiwiaWR4IiwiaW5kZXhPZiIsInNwbGljZSIsImdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50IiwiY2xlYXJOb3RpZmljYXRpb24iLCJnZXRSb29tIiwiYWN0aW9ucyIsImdldFB1c2hBY3Rpb25zRm9yRXZlbnQiLCJub3RpZnkiLCJ0d2Vha3MiLCJsb3VkTm90aWZp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MDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IFBsYXRmb3JtUGVnIGZyb20gJy4vUGxhdGZvcm1QZWcnO1xuaW1wb3J0ICogYXMgVGV4dEZvckV2ZW50IGZyb20gJy4vVGV4dEZvckV2ZW50JztcbmltcG9ydCBBbmFseXRpY3MgZnJvbSAnLi9BbmFseXRpY3MnO1xuaW1wb3J0ICogYXMgQXZhdGFyIGZyb20gJy4vQXZhdGFyJztcbmltcG9ydCBkaXMgZnJvbSAnLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi9Nb2RhbCc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuXG4vKlxuICogRGlzcGF0Y2hlczpcbiAqIHtcbiAqICAgYWN0aW9uOiBcIm5vdGlmaWVyX2VuYWJsZWRcIixcbiAqICAgdmFsdWU6IGJvb2xlYW5cbiAqIH1cbiAqL1xuXG5jb25zdCBNQVhfUEVORElOR19FTkNSWVBURUQgPSAyMDtcblxuLypcbk92ZXJyaWRlIGJvdGggdGhlIGNvbnRlbnQgYm9keSBhbmQgdGhlIFRleHRGb3JFdmVudCBoYW5kbGVyIGZvciBzcGVjaWZpYyBtc2d0eXBlcywgaW4gbm90aWZpY2F0aW9ucy5cblRoaXMgaXMgdXNlZnVsIHdoZW4gdGhlIGNvbnRlbnQgYm9keSBjb250YWlucyBmYWxsYmFjayB0ZXh0IHRoYXQgd291bGQgZXhwbGFpbiB0aGF0IHRoZSBjbGllbnQgY2FuJ3QgaGFuZGxlIGEgcGFydGljdWxhclxudHlwZSBvZiB0aWxlLlxuKi9cbmNvbnN0IHR5cGVoYW5kbGVycyA9IHtcbiAgICBcIm0ua2V5LnZlcmlmaWNhdGlvbi5yZXF1ZXN0XCI6IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gKGV2ZW50LnNlbmRlciB8fCB7fSkubmFtZTtcbiAgICAgICAgcmV0dXJuIF90KFwiJShuYW1lKXMgaXMgcmVxdWVzdGluZyB2ZXJpZmljYXRpb25cIiwgeyBuYW1lIH0pO1xuICAgIH0sXG59O1xuXG5jb25zdCBOb3RpZmllciA9IHtcbiAgICBub3RpZnNCeVJvb206IHt9LFxuXG4gICAgLy8gQSBsaXN0IG9mIGV2ZW50IElEcyB0aGF0IHdlJ3ZlIHJlY2VpdmVkIGJ1dCBuZWVkIHRvIHdhaXQgdW50aWxcbiAgICAvLyB0aGV5J3JlIGRlY3J5cHRlZCB1bnRpbCB3ZSBkZWNpZGUgd2hldGhlciB0byBub3RpZnkgZm9yIHRoZW1cbiAgICAvLyBvciBub3RcbiAgICBwZW5kaW5nRW5jcnlwdGVkRXZlbnRJZHM6IFtdLFxuXG4gICAgbm90aWZpY2F0aW9uTWVzc2FnZUZvckV2ZW50OiBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAodHlwZWhhbmRsZXJzLmhhc093blByb3BlcnR5KGV2LmdldENvbnRlbnQoKS5tc2d0eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVoYW5kbGVyc1tldi5nZXRDb250ZW50KCkubXNndHlwZV0oZXYpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBUZXh0Rm9yRXZlbnQudGV4dEZvckV2ZW50KGV2KTtcbiAgICB9LFxuXG4gICAgX2Rpc3BsYXlQb3B1cE5vdGlmaWNhdGlvbjogZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgY29uc3QgcGxhZiA9IFBsYXRmb3JtUGVnLmdldCgpO1xuICAgICAgICBpZiAoIXBsYWYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBsYWYuc3VwcG9ydHNOb3RpZmljYXRpb25zKCkgfHwgIXBsYWYubWF5U2VuZE5vdGlmaWNhdGlvbnMoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnbG9iYWwuZG9jdW1lbnQuaGFzRm9jdXMoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1zZyA9IHRoaXMubm90aWZpY2F0aW9uTWVzc2FnZUZvckV2ZW50KGV2KTtcbiAgICAgICAgaWYgKCFtc2cpIHJldHVybjtcblxuICAgICAgICBsZXQgdGl0bGU7XG4gICAgICAgIGlmICghZXYuc2VuZGVyIHx8IHJvb20ubmFtZSA9PT0gZXYuc2VuZGVyLm5hbWUpIHtcbiAgICAgICAgICAgIHRpdGxlID0gcm9vbS5uYW1lO1xuICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uTWVzc2FnZUZvckV2ZW50IGluY2x1ZGVzIHNlbmRlcixcbiAgICAgICAgICAgIC8vIGJ1dCB3ZSBhbHJlYWR5IGhhdmUgdGhlIHNlbmRlciBoZXJlXG4gICAgICAgICAgICBpZiAoZXYuZ2V0Q29udGVudCgpLmJvZHkgJiYgIXR5cGVoYW5kbGVycy5oYXNPd25Qcm9wZXJ0eShldi5nZXRDb250ZW50KCkubXNndHlwZSkpIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBldi5nZXRDb250ZW50KCkuYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChldi5nZXRUeXBlKCkgPT09ICdtLnJvb20ubWVtYmVyJykge1xuICAgICAgICAgICAgLy8gY29udGV4dCBpcyBhbGwgaW4gdGhlIG1lc3NhZ2UgaGVyZSwgd2UgZG9uJ3QgbmVlZFxuICAgICAgICAgICAgLy8gdG8gZGlzcGxheSBzZW5kZXIgaW5mb1xuICAgICAgICAgICAgdGl0bGUgPSByb29tLm5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZXYuc2VuZGVyKSB7XG4gICAgICAgICAgICB0aXRsZSA9IGV2LnNlbmRlci5uYW1lICsgXCIgKFwiICsgcm9vbS5uYW1lICsgXCIpXCI7XG4gICAgICAgICAgICAvLyBub3RpZmljYXRpb25NZXNzYWdlRm9yRXZlbnQgaW5jbHVkZXMgc2VuZGVyLFxuICAgICAgICAgICAgLy8gYnV0IHdlJ3ZlIGp1c3Qgb3V0IHNlbmRlciBpbiB0aGUgdGl0bGVcbiAgICAgICAgICAgIGlmIChldi5nZXRDb250ZW50KCkuYm9keSAmJiAhdHlwZWhhbmRsZXJzLmhhc093blByb3BlcnR5KGV2LmdldENvbnRlbnQoKS5tc2d0eXBlKSkge1xuICAgICAgICAgICAgICAgIG1zZyA9IGV2LmdldENvbnRlbnQoKS5ib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzQm9keUVuYWJsZWQoKSkge1xuICAgICAgICAgICAgbXNnID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXZhdGFyVXJsID0gbnVsbDtcbiAgICAgICAgaWYgKGV2LnNlbmRlciAmJiAhU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImxvd0JhbmR3aWR0aFwiKSkge1xuICAgICAgICAgICAgYXZhdGFyVXJsID0gQXZhdGFyLmF2YXRhclVybEZvck1lbWJlcihldi5zZW5kZXIsIDQwLCA0MCwgJ2Nyb3AnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vdGlmID0gcGxhZi5kaXNwbGF5Tm90aWZpY2F0aW9uKHRpdGxlLCBtc2csIGF2YXRhclVybCwgcm9vbSk7XG5cbiAgICAgICAgLy8gaWYgZGlzcGxheU5vdGlmaWNhdGlvbiByZXR1cm5zIG5vbi1udWxsLCAgdGhlIHBsYXRmb3JtIHN1cHBvcnRzXG4gICAgICAgIC8vIGNsZWFyaW5nIG5vdGlmaWNhdGlvbnMgbGF0ZXIsIHNvIGtlZXAgdHJhY2sgb2YgdGhpcy5cbiAgICAgICAgaWYgKG5vdGlmKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ub3RpZnNCeVJvb21bZXYuZ2V0Um9vbUlkKCldID09PSB1bmRlZmluZWQpIHRoaXMubm90aWZzQnlSb29tW2V2LmdldFJvb21JZCgpXSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5ub3RpZnNCeVJvb21bZXYuZ2V0Um9vbUlkKCldLnB1c2gobm90aWYpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFNvdW5kRm9yUm9vbTogYXN5bmMgZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIC8vIFdlIGRvIG5vIGNhY2hpbmcgaGVyZSBiZWNhdXNlIHRoZSBTREsgY2FjaGVzIHNldHRpbmdcbiAgICAgICAgLy8gYW5kIHRoZSBicm93c2VyIHdpbGwgY2FjaGUgdGhlIHNvdW5kLlxuICAgICAgICBjb25zdCBjb250ZW50ID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcIm5vdGlmaWNhdGlvblNvdW5kXCIsIHJvb21JZCk7XG4gICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbnRlbnQudXJsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYCR7cm9vbUlkfSBoYXMgY3VzdG9tIG5vdGlmaWNhdGlvbiBzb3VuZCBldmVudCwgYnV0IG5vIHVybCBrZXlgKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb250ZW50LnVybC5zdGFydHNXaXRoKFwibXhjOi8vXCIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYCR7cm9vbUlkfSBoYXMgY3VzdG9tIG5vdGlmaWNhdGlvbiBzb3VuZCBldmVudCwgYnV0IHVybCBpcyBub3QgYSBteGMgdXJsYCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElkZWFsbHkgaW4gaGVyZSB3ZSBjb3VsZCB1c2UgTVNDMTMxMCB0byBkZXRlY3QgdGhlIHR5cGUgb2YgZmlsZSwgYW5kIHJlamVjdCBpdC5cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXJsOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKGNvbnRlbnQudXJsKSxcbiAgICAgICAgICAgIG5hbWU6IGNvbnRlbnQubmFtZSxcbiAgICAgICAgICAgIHR5cGU6IGNvbnRlbnQudHlwZSxcbiAgICAgICAgICAgIHNpemU6IGNvbnRlbnQuc2l6ZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgX3BsYXlBdWRpb05vdGlmaWNhdGlvbjogYXN5bmMgZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgY29uc3Qgc291bmQgPSBhd2FpdCB0aGlzLmdldFNvdW5kRm9yUm9vbShyb29tLnJvb21JZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBHb3Qgc291bmQgJHtzb3VuZCAmJiBzb3VuZC5uYW1lIHx8IFwiZGVmYXVsdFwifSBmb3IgJHtyb29tLnJvb21JZH1gKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNvdW5kID8gYGF1ZGlvW3NyYz0nJHtzb3VuZC51cmx9J11gIDogXCIjbWVzc2FnZUF1ZGlvXCIpO1xuICAgICAgICAgICAgbGV0IGF1ZGlvRWxlbWVudCA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIGlmICghc291bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIGF1ZGlvIGVsZW1lbnQgb3Igc291bmQgdG8gcGxheSBmb3Igbm90aWZpY2F0aW9uXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF1ZGlvRWxlbWVudCA9IG5ldyBBdWRpbyhzb3VuZC51cmwpO1xuICAgICAgICAgICAgICAgIGlmIChzb3VuZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGF1ZGlvRWxlbWVudC50eXBlID0gc291bmQudHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhdWRpb0VsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgYXVkaW9FbGVtZW50LnBsYXkoKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhdWdodCBlcnJvciB3aGVuIHRyeWluZyB0byBmZXRjaCByb29tIG5vdGlmaWNhdGlvbiBzb3VuZDpcIiwgZXgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gZG8gbm90IHJlLWJpbmQgaW4gdGhlIGNhc2Ugb2YgcmVwZWF0ZWQgY2FsbFxuICAgICAgICB0aGlzLmJvdW5kT25FdmVudCA9IHRoaXMuYm91bmRPbkV2ZW50IHx8IHRoaXMub25FdmVudC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kT25TeW5jU3RhdGVDaGFuZ2UgPSB0aGlzLmJvdW5kT25TeW5jU3RhdGVDaGFuZ2UgfHwgdGhpcy5vblN5bmNTdGF0ZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kT25Sb29tUmVjZWlwdCA9IHRoaXMuYm91bmRPblJvb21SZWNlaXB0IHx8IHRoaXMub25Sb29tUmVjZWlwdC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kT25FdmVudERlY3J5cHRlZCA9IHRoaXMuYm91bmRPbkV2ZW50RGVjcnlwdGVkIHx8IHRoaXMub25FdmVudERlY3J5cHRlZC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbignZXZlbnQnLCB0aGlzLmJvdW5kT25FdmVudCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbignUm9vbS5yZWNlaXB0JywgdGhpcy5ib3VuZE9uUm9vbVJlY2VpcHQpO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oJ0V2ZW50LmRlY3J5cHRlZCcsIHRoaXMuYm91bmRPbkV2ZW50RGVjcnlwdGVkKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwic3luY1wiLCB0aGlzLmJvdW5kT25TeW5jU3RhdGVDaGFuZ2UpO1xuICAgICAgICB0aGlzLnRvb2xiYXJIaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc1N5bmNpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkpIHtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignRXZlbnQnLCB0aGlzLmJvdW5kT25FdmVudCk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoJ1Jvb20ucmVjZWlwdCcsIHRoaXMuYm91bmRPblJvb21SZWNlaXB0KTtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcignRXZlbnQuZGVjcnlwdGVkJywgdGhpcy5ib3VuZE9uRXZlbnREZWNyeXB0ZWQpO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKCdzeW5jJywgdGhpcy5ib3VuZE9uU3luY1N0YXRlQ2hhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzU3luY2luZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBzdXBwb3J0c0Rlc2t0b3BOb3RpZmljYXRpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcGxhZiA9IFBsYXRmb3JtUGVnLmdldCgpO1xuICAgICAgICByZXR1cm4gcGxhZiAmJiBwbGFmLnN1cHBvcnRzTm90aWZpY2F0aW9ucygpO1xuICAgIH0sXG5cbiAgICBzZXRFbmFibGVkOiBmdW5jdGlvbihlbmFibGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHBsYWYgPSBQbGF0Zm9ybVBlZy5nZXQoKTtcbiAgICAgICAgaWYgKCFwbGFmKSByZXR1cm47XG5cbiAgICAgICAgLy8gRGV2IG5vdGU6IFdlIGRvbid0IHNldCB0aGUgXCJub3RpZmljYXRpb25zRW5hYmxlZFwiIHNldHRpbmcgdG8gdHJ1ZSBoZXJlIGJlY2F1c2UgaXQgaXMgYVxuICAgICAgICAvLyBjYWxjdWxhdGVkIHZhbHVlLiBJdCBpcyBkZXRlcm1pbmVkIGJhc2VkIHVwb24gd2hldGhlciBvciBub3QgdGhlIG1hc3RlciBydWxlIGlzIGVuYWJsZWRcbiAgICAgICAgLy8gYW5kIG90aGVyIGZsYWdzLiBTZXR0aW5nIGl0IGhlcmUgd291bGQgY2F1c2UgYSBjaXJjdWxhciByZWZlcmVuY2UuXG5cbiAgICAgICAgQW5hbHl0aWNzLnRyYWNrRXZlbnQoJ05vdGlmaWVyJywgJ1NldCBFbmFibGVkJywgZW5hYmxlKTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBwZXJzaXN0IHRoZSBjdXJyZW50IHNldHRpbmcgYXVkaW9fZW5hYmxlZCBzZXR0aW5nXG4gICAgICAgIC8vIGJlZm9yZSBjaGFuZ2luZyBhbnl0aGluZ1xuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0xldmVsU3VwcG9ydGVkKFNldHRpbmdMZXZlbC5ERVZJQ0UpKSB7XG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiYXVkaW9Ob3RpZmljYXRpb25zRW5hYmxlZFwiLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCB0aGlzLmlzRW5hYmxlZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gZ2V0IHBlcm1pc3Npb24gZnJvbSB1c2VyXG4gICAgICAgICAgICBwbGFmLnJlcXVlc3ROb3RpZmljYXRpb25QZXJtaXNzaW9uKCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gJ2dyYW50ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwZXJtaXNzaW9uIHJlcXVlc3Qgd2FzIGRpc21pc3NlZCBvciBkZW5pZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBhbHRlcm5hdGl2ZSBicmFuZGluZyBpbiBtZXNzYWdpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSByZXN1bHQgPT09ICdkZW5pZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICA/IF90KCdSaW90IGRvZXMgbm90IGhhdmUgcGVybWlzc2lvbiB0byBzZW5kIHlvdSBub3RpZmljYXRpb25zIC0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3BsZWFzZSBjaGVjayB5b3VyIGJyb3dzZXIgc2V0dGluZ3MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBfdCgnUmlvdCB3YXMgbm90IGdpdmVuIHBlcm1pc3Npb24gdG8gc2VuZCBub3RpZmljYXRpb25zIC0gcGxlYXNlIHRyeSBhZ2FpbicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVW5hYmxlIHRvIGVuYWJsZSBOb3RpZmljYXRpb25zJywgcmVzdWx0LCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdVbmFibGUgdG8gZW5hYmxlIE5vdGlmaWNhdGlvbnMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwibm90aWZpZXJfZW5hYmxlZFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IFwibm90aWZpZXJfZW5hYmxlZFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNldCB0aGUgbm90aWZpY2F0aW9uc19oaWRkZW4gZmxhZywgYXMgdGhlIHVzZXIgaGFzIGtub3dpbmdseSBpbnRlcmFjdGVkXG4gICAgICAgIC8vIHdpdGggdGhlIHNldHRpbmcgd2Ugc2hvdWxkbid0IG5hZyB0aGVtIGFueSBmdXJ0aGVyXG4gICAgICAgIHRoaXMuc2V0VG9vbGJhckhpZGRlbih0cnVlKTtcbiAgICB9LFxuXG4gICAgaXNFbmFibGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNQb3NzaWJsZSgpICYmIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJub3RpZmljYXRpb25zRW5hYmxlZFwiKTtcbiAgICB9LFxuXG4gICAgaXNQb3NzaWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHBsYWYgPSBQbGF0Zm9ybVBlZy5nZXQoKTtcbiAgICAgICAgaWYgKCFwbGFmKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghcGxhZi5zdXBwb3J0c05vdGlmaWNhdGlvbnMoKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXBsYWYubWF5U2VuZE5vdGlmaWNhdGlvbnMoKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBwb3NzaWJsZSwgYnV0IG5vdCBuZWNlc3NhcmlseSBlbmFibGVkXG4gICAgfSxcblxuICAgIGlzQm9keUVuYWJsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0VuYWJsZWQoKSAmJiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwibm90aWZpY2F0aW9uQm9keUVuYWJsZWRcIik7XG4gICAgfSxcblxuICAgIGlzQXVkaW9FbmFibGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNFbmFibGVkKCkgJiYgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImF1ZGlvTm90aWZpY2F0aW9uc0VuYWJsZWRcIik7XG4gICAgfSxcblxuICAgIHNldFRvb2xiYXJIaWRkZW46IGZ1bmN0aW9uKGhpZGRlbiwgcGVyc2lzdGVudCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy50b29sYmFySGlkZGVuID0gaGlkZGVuO1xuXG4gICAgICAgIEFuYWx5dGljcy50cmFja0V2ZW50KCdOb3RpZmllcicsICdTZXQgVG9vbGJhciBIaWRkZW4nLCBoaWRkZW4pO1xuXG4gICAgICAgIC8vIFhYWDogd2h5IGFyZSB3ZSBkaXNwYXRjaGluZyB0aGlzIGhlcmU/XG4gICAgICAgIC8vIHRoaXMgaXMgbm90aGluZyB0byBkbyB3aXRoIG5vdGlmaWVyX2VuYWJsZWRcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJub3RpZmllcl9lbmFibGVkXCIsXG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5pc0VuYWJsZWQoKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmZvIHRvIGxvY2FsU3RvcmFnZSBmb3IgcGVyc2lzdGVudCBzZXR0aW5nc1xuICAgICAgICBpZiAocGVyc2lzdGVudCAmJiBnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICBnbG9iYWwubG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJub3RpZmljYXRpb25zX2hpZGRlblwiLCBoaWRkZW4pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNob3VsZFNob3dUb29sYmFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlzR3Vlc3QgPSBjbGllbnQuaXNHdWVzdCgpO1xuICAgICAgICByZXR1cm4gIWlzR3Vlc3QgJiYgdGhpcy5zdXBwb3J0c0Rlc2t0b3BOb3RpZmljYXRpb25zKCkgJiZcbiAgICAgICAgICAgICF0aGlzLmlzRW5hYmxlZCgpICYmICF0aGlzLl9pc1Rvb2xiYXJIaWRkZW4oKTtcbiAgICB9LFxuXG4gICAgX2lzVG9vbGJhckhpZGRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENoZWNrIGxvY2FsU3RvcmFnZSBmb3IgYW55IHN1Y2ggbWV0YSBkYXRhXG4gICAgICAgIGlmIChnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsLmxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibm90aWZpY2F0aW9uc19oaWRkZW5cIikgPT09IFwidHJ1ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudG9vbGJhckhpZGRlbjtcbiAgICB9LFxuXG4gICAgb25TeW5jU3RhdGVDaGFuZ2U6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gXCJTWU5DSU5HXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gXCJTVE9QUEVEXCIgfHwgc3RhdGUgPT09IFwiRVJST1JcIikge1xuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkV2ZW50OiBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoIXRoaXMuaXNTeW5jaW5nKSByZXR1cm47IC8vIGRvbid0IGFsZXJ0IGZvciBhbnkgbWVzc2FnZXMgaW5pdGlhbGx5XG4gICAgICAgIGlmIChldi5zZW5kZXIgJiYgZXYuc2VuZGVyLnVzZXJJZCA9PT0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmNyZWRlbnRpYWxzLnVzZXJJZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIElmIGl0J3MgYW4gZW5jcnlwdGVkIGV2ZW50IGFuZCB0aGUgdHlwZSBpcyBzdGlsbCAnbS5yb29tLmVuY3J5cHRlZCcsXG4gICAgICAgIC8vIGl0IGhhc24ndCB5ZXQgYmVlbiBkZWNyeXB0ZWQsIHNvIHdhaXQgdW50aWwgaXQgaXMuXG4gICAgICAgIGlmIChldi5pc0JlaW5nRGVjcnlwdGVkKCkgfHwgZXYuaXNEZWNyeXB0aW9uRmFpbHVyZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdFbmNyeXB0ZWRFdmVudElkcy5wdXNoKGV2LmdldElkKCkpO1xuICAgICAgICAgICAgLy8gZG9uJ3QgbGV0IHRoZSBsaXN0IGZpbGwgdXAgaW5kZWZpbml0ZWx5XG4gICAgICAgICAgICB3aGlsZSAodGhpcy5wZW5kaW5nRW5jcnlwdGVkRXZlbnRJZHMubGVuZ3RoID4gTUFYX1BFTkRJTkdfRU5DUllQVEVEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nRW5jcnlwdGVkRXZlbnRJZHMuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2V2YWx1YXRlRXZlbnQoZXYpO1xuICAgIH0sXG5cbiAgICBvbkV2ZW50RGVjcnlwdGVkOiBmdW5jdGlvbihldikge1xuICAgICAgICAvLyAnZGVjcnlwdGVkJyBtZWFucyB0aGUgZGVjcnlwdGlvbiBwcm9jZXNzIGhhcyBmaW5pc2hlZDogaXQgbWF5IGhhdmUgZmFpbGVkLFxuICAgICAgICAvLyBpbiB3aGljaCBjYXNlIGl0IG1pZ2h0IGRlY3J5cHQgc29vbiBpZiB0aGUga2V5cyBhcnJpdmVcbiAgICAgICAgaWYgKGV2LmlzRGVjcnlwdGlvbkZhaWx1cmUoKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucGVuZGluZ0VuY3J5cHRlZEV2ZW50SWRzLmluZGV4T2YoZXYuZ2V0SWQoKSk7XG4gICAgICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nRW5jcnlwdGVkRXZlbnRJZHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIHRoaXMuX2V2YWx1YXRlRXZlbnQoZXYpO1xuICAgIH0sXG5cbiAgICBvblJvb21SZWNlaXB0OiBmdW5jdGlvbihldiwgcm9vbSkge1xuICAgICAgICBpZiAocm9vbS5nZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBpZGVhbGx5IHdlIHdvdWxkIGNsZWFyIGVhY2ggbm90aWZpY2F0aW9uIHdoZW4gaXQgd2FzIHJlYWQsXG4gICAgICAgICAgICAvLyBidXQgd2UgaGF2ZSBubyB3YXksIGdpdmVuIGEgcmVhZCByZWNlaXB0LCB0byBrbm93IHdoZXRoZXJcbiAgICAgICAgICAgIC8vIHRoZSByZWNlaXB0IGNvbWVzIGJlZm9yZSBvciBhZnRlciBhbiBldmVudCwgc28gd2UgY2FuJ3RcbiAgICAgICAgICAgIC8vIGRvIHRoaXMuIEluc3RlYWQsIGNsZWFyIGFsbCBub3RpZmljYXRpb25zIGZvciBhIHJvb20gb25jZVxuICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG5vIG5vdGlmcyBsZWZ0IGluIHRoYXQgcm9vbS4sIHdoaWNoIGlzIG5vdCBxdWl0ZVxuICAgICAgICAgICAgLy8gYXMgZ29vZCBidXQgaXQncyBzb21ldGhpbmcuXG4gICAgICAgICAgICBjb25zdCBwbGFmID0gUGxhdGZvcm1QZWcuZ2V0KCk7XG4gICAgICAgICAgICBpZiAoIXBsYWYpIHJldHVybjtcbiAgICAgICAgICAgIGlmICh0aGlzLm5vdGlmc0J5Um9vbVtyb29tLnJvb21JZF0gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgICAgZm9yIChjb25zdCBub3RpZiBvZiB0aGlzLm5vdGlmc0J5Um9vbVtyb29tLnJvb21JZF0pIHtcbiAgICAgICAgICAgICAgICBwbGFmLmNsZWFyTm90aWZpY2F0aW9uKG5vdGlmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm5vdGlmc0J5Um9vbVtyb29tLnJvb21JZF07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2V2YWx1YXRlRXZlbnQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShldi5nZXRSb29tSWQoKSk7XG4gICAgICAgIGNvbnN0IGFjdGlvbnMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0UHVzaEFjdGlvbnNGb3JFdmVudChldik7XG4gICAgICAgIGlmIChhY3Rpb25zICYmIGFjdGlvbnMubm90aWZ5KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BsYXlQb3B1cE5vdGlmaWNhdGlvbihldiwgcm9vbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYWN0aW9ucy50d2Vha3Muc291bmQgJiYgdGhpcy5pc0F1ZGlvRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgUGxhdGZvcm1QZWcuZ2V0KCkubG91ZE5vdGlmaWNhdGlvbihldiwgcm9vbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheUF1ZGlvTm90aWZpY2F0aW9uKGV2LCByb29tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5pZiAoIWdsb2JhbC5teE5vdGlmaWVyKSB7XG4gICAgZ2xvYmFsLm14Tm90aWZpZXIgPSBOb3RpZmllcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2xvYmFsLm14Tm90aWZpZXI7XG4iXX0=