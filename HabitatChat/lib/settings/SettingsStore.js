"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SettingLevel = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _DeviceSettingsHandler = _interopRequireDefault(require("./handlers/DeviceSettingsHandler"));

var _RoomDeviceSettingsHandler = _interopRequireDefault(require("./handlers/RoomDeviceSettingsHandler"));

var _DefaultSettingsHandler = _interopRequireDefault(require("./handlers/DefaultSettingsHandler"));

var _RoomAccountSettingsHandler = _interopRequireDefault(require("./handlers/RoomAccountSettingsHandler"));

var _AccountSettingsHandler = _interopRequireDefault(require("./handlers/AccountSettingsHandler"));

var _RoomSettingsHandler = _interopRequireDefault(require("./handlers/RoomSettingsHandler"));

var _ConfigSettingsHandler = _interopRequireDefault(require("./handlers/ConfigSettingsHandler"));

var _languageHandler = require("../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../SdkConfig"));

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var _Settings = require("./Settings");

var _LocalEchoWrapper = _interopRequireDefault(require("./handlers/LocalEchoWrapper"));

var _WatchManager = require("./WatchManager");

/*
Copyright 2017 Travis Ralston
Copyright 2019 New Vector Ltd.

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
 * Represents the various setting levels supported by the SettingsStore.
 */
const SettingLevel = {
  // Note: This enum is not used in this class or in the Settings file
  // This should always be used elsewhere in the project.
  DEVICE: "device",
  ROOM_DEVICE: "room-device",
  ROOM_ACCOUNT: "room-account",
  ACCOUNT: "account",
  ROOM: "room",
  CONFIG: "config",
  DEFAULT: "default"
};
exports.SettingLevel = SettingLevel;
const defaultWatchManager = new _WatchManager.WatchManager(); // Convert the settings to easier to manage objects for the handlers

const defaultSettings = {};
const invertedDefaultSettings = {};
const featureNames = [];

for (const key of Object.keys(_Settings.SETTINGS)) {
  defaultSettings[key] = _Settings.SETTINGS[key].default;
  if (_Settings.SETTINGS[key].isFeature) featureNames.push(key);

  if (_Settings.SETTINGS[key].invertedSettingName) {
    // Invert now so that the rest of the system will invert it back
    // to what was intended.
    invertedDefaultSettings[key] = !_Settings.SETTINGS[key].default;
  }
}

const LEVEL_HANDLERS = {
  "device": new _DeviceSettingsHandler.default(featureNames, defaultWatchManager),
  "room-device": new _RoomDeviceSettingsHandler.default(defaultWatchManager),
  "room-account": new _RoomAccountSettingsHandler.default(defaultWatchManager),
  "account": new _AccountSettingsHandler.default(defaultWatchManager),
  "room": new _RoomSettingsHandler.default(defaultWatchManager),
  "config": new _ConfigSettingsHandler.default(),
  "default": new _DefaultSettingsHandler.default(defaultSettings, invertedDefaultSettings)
}; // Wrap all the handlers with local echo

for (const key of Object.keys(LEVEL_HANDLERS)) {
  LEVEL_HANDLERS[key] = new _LocalEchoWrapper.default(LEVEL_HANDLERS[key]);
}

const LEVEL_ORDER = ['device', 'room-device', 'room-account', 'account', 'room', 'config', 'default'];
/**
 * Controls and manages application settings by providing varying levels at which the
 * setting value may be specified. The levels are then used to determine what the setting
 * value should be given a set of circumstances. The levels, in priority order, are:
 * - "device"         - Values are determined by the current device
 * - "room-device"    - Values are determined by the current device for a particular room
 * - "room-account"   - Values are determined by the current account for a particular room
 * - "account"        - Values are determined by the current account
 * - "room"           - Values are determined by a particular room (by the room admins)
 * - "config"         - Values are determined by the config.json
 * - "default"        - Values are determined by the hardcoded defaults
 *
 * Each level has a different method to storing the setting value. For implementation
 * specific details, please see the handlers. The "config" and "default" levels are
 * both always supported on all platforms. All other settings should be guarded by
 * isLevelSupported() prior to attempting to set the value.
 *
 * Settings can also represent features. Features are significant portions of the
 * application that warrant a dedicated setting to toggle them on or off. Features are
 * special-cased to ensure that their values respect the configuration (for example, a
 * feature may be reported as disabled even though a user has specifically requested it
 * be enabled).
 */

class SettingsStore {
  // We support watching settings for changes, and do this by tracking which callbacks have
  // been given to us. We end up returning the callbackRef to the caller so they can unsubscribe
  // at a later point.
  //
  // We also maintain a list of monitors which are special watchers: they cause dispatches
  // when the setting changes. We track which rooms we're monitoring though to ensure we
  // don't duplicate updates on the bus.
  // { callbackRef => { callbackFn } }
  // { settingName => { roomId => callbackRef } }
  // Counter used for generation of watcher IDs

  /**
   * Watches for changes in a particular setting. This is done without any local echo
   * wrapping and fires whenever a change is detected in a setting's value, at any level.
   * Watching is intended to be used in scenarios where the app needs to react to changes
   * made by other devices. It is otherwise expected that callers will be able to use the
   * Controller system or track their own changes to settings. Callers should retain the
   * returned reference to later unsubscribe from updates.
   * @param {string} settingName The setting name to watch
   * @param {String} roomId The room ID to watch for changes in. May be null for 'all'.
   * @param {function} callbackFn A function to be called when a setting change is
   * detected. Five arguments can be expected: the setting name, the room ID (may be null),
   * the level the change happened at, the new value at the given level, and finally the new
   * value for the setting regardless of level. The callback is responsible for determining
   * if the change in value is worthwhile enough to react upon.
   * @returns {string} A reference to the watcher that was employed.
   */
  static watchSetting(settingName, roomId, callbackFn) {
    const setting = _Settings.SETTINGS[settingName];
    const originalSettingName = settingName;
    if (!setting) throw new Error("".concat(settingName, " is not a setting"));

    if (setting.invertedSettingName) {
      settingName = setting.invertedSettingName;
    }

    const watcherId = "".concat(new Date().getTime(), "_").concat(SettingsStore._watcherCount++, "_").concat(settingName, "_").concat(roomId);

    const localizedCallback = (changedInRoomId, atLevel, newValAtLevel) => {
      const newValue = SettingsStore.getValue(originalSettingName);
      callbackFn(originalSettingName, changedInRoomId, atLevel, newValAtLevel, newValue);
    };

    console.log("Starting watcher for ".concat(settingName, "@").concat(roomId || '<null room>', " as ID ").concat(watcherId));
    SettingsStore._watchers[watcherId] = localizedCallback;
    defaultWatchManager.watchSetting(settingName, roomId, localizedCallback);
    return watcherId;
  }
  /**
   * Stops the SettingsStore from watching a setting. This is a no-op if the watcher
   * provided is not found.
   * @param {string} watcherReference The watcher reference (received from #watchSetting)
   * to cancel.
   */


  static unwatchSetting(watcherReference) {
    if (!SettingsStore._watchers[watcherReference]) {
      console.warn("Ending non-existent watcher ID ".concat(watcherReference));
      return;
    }

    console.log("Ending watcher ID ".concat(watcherReference));
    defaultWatchManager.unwatchSetting(SettingsStore._watchers[watcherReference]);
    delete SettingsStore._watchers[watcherReference];
  }
  /**
   * Sets up a monitor for a setting. This behaves similar to #watchSetting except instead
   * of making a call to a callback, it forwards all changes to the dispatcher. Callers can
   * expect to listen for the 'setting_updated' action with an object containing settingName,
   * roomId, level, newValueAtLevel, and newValue.
   * @param {string} settingName The setting name to monitor.
   * @param {String} roomId The room ID to monitor for changes in. Use null for all rooms.
   */


  static monitorSetting(settingName, roomId) {
    if (!this._monitors[settingName]) this._monitors[settingName] = {};

    const registerWatcher = () => {
      this._monitors[settingName][roomId] = SettingsStore.watchSetting(settingName, roomId, (settingName, inRoomId, level, newValueAtLevel, newValue) => {
        _dispatcher.default.dispatch({
          action: 'setting_updated',
          settingName,
          roomId: inRoomId,
          level,
          newValueAtLevel,
          newValue
        });
      });
    };

    const hasRoom = Object.keys(this._monitors[settingName]).find(r => r === roomId || r === null);

    if (!hasRoom) {
      registerWatcher();
    } else {
      if (roomId === null) {
        // Unregister all existing watchers and register the new one
        for (const roomId of Object.keys(this._monitors[settingName])) {
          SettingsStore.unwatchSetting(this._monitors[settingName][roomId]);
        }

        this._monitors[settingName] = {};
        registerWatcher();
      } // else a watcher is already registered for the room, so don't bother registering it again

    }
  }
  /**
   * Gets the translated display name for a given setting
   * @param {string} settingName The setting to look up.
   * @param {"device"|"room-device"|"room-account"|"account"|"room"|"config"|"default"} atLevel
   * The level to get the display name for; Defaults to 'default'.
   * @return {String} The display name for the setting, or null if not found.
   */


  static getDisplayName(settingName, atLevel = "default") {
    if (!_Settings.SETTINGS[settingName] || !_Settings.SETTINGS[settingName].displayName) return null;
    let displayName = _Settings.SETTINGS[settingName].displayName;

    if (displayName instanceof Object) {
      if (displayName[atLevel]) displayName = displayName[atLevel];else displayName = displayName["default"];
    }

    return (0, _languageHandler._t)(displayName);
  }
  /**
   * Returns a list of all available labs feature names
   * @returns {string[]} The list of available feature names
   */


  static getLabsFeatures() {
    const possibleFeatures = Object.keys(_Settings.SETTINGS).filter(s => SettingsStore.isFeature(s));

    const enableLabs = _SdkConfig.default.get()["enableLabs"];

    if (enableLabs) return possibleFeatures;
    return possibleFeatures.filter(s => SettingsStore._getFeatureState(s) === "labs");
  }
  /**
   * Determines if a setting is also a feature.
   * @param {string} settingName The setting to look up.
   * @return {boolean} True if the setting is a feature.
   */


  static isFeature(settingName) {
    if (!_Settings.SETTINGS[settingName]) return false;
    return _Settings.SETTINGS[settingName].isFeature;
  }
  /**
   * Determines if a given feature is enabled. The feature given must be a known
   * feature.
   * @param {string} settingName The name of the setting that is a feature.
   * @param {String} roomId The optional room ID to validate in, may be null.
   * @return {boolean} True if the feature is enabled, false otherwise
   */


  static isFeatureEnabled(settingName, roomId = null) {
    if (!SettingsStore.isFeature(settingName)) {
      throw new Error("Setting " + settingName + " is not a feature");
    }

    return SettingsStore.getValue(settingName, roomId);
  }
  /**
   * Sets a feature as enabled or disabled on the current device.
   * @param {string} settingName The name of the setting.
   * @param {boolean} value True to enable the feature, false otherwise.
   * @returns {Promise} Resolves when the setting has been set.
   */


  static setFeatureEnabled(settingName, value) {
    // Verify that the setting is actually a setting
    if (!_Settings.SETTINGS[settingName]) {
      throw new Error("Setting '" + settingName + "' does not appear to be a setting.");
    }

    if (!SettingsStore.isFeature(settingName)) {
      throw new Error("Setting " + settingName + " is not a feature");
    }

    return SettingsStore.setValue(settingName, null, "device", value);
  }
  /**
   * Gets the value of a setting. The room ID is optional if the setting is not to
   * be applied to any particular room, otherwise it should be supplied.
   * @param {string} settingName The name of the setting to read the value of.
   * @param {String} roomId The room ID to read the setting value in, may be null.
   * @param {boolean} excludeDefault True to disable using the default value.
   * @return {*} The value, or null if not found
   */


  static getValue(settingName, roomId = null, excludeDefault = false) {
    // Verify that the setting is actually a setting
    if (!_Settings.SETTINGS[settingName]) {
      throw new Error("Setting '" + settingName + "' does not appear to be a setting.");
    }

    const setting = _Settings.SETTINGS[settingName];
    const levelOrder = setting.supportedLevelsAreOrdered ? setting.supportedLevels : LEVEL_ORDER;
    return SettingsStore.getValueAt(levelOrder[0], settingName, roomId, false, excludeDefault);
  }
  /**
   * Gets a setting's value at a particular level, ignoring all levels that are more specific.
   * @param {"device"|"room-device"|"room-account"|"account"|"room"|"config"|"default"} level The
   * level to look at.
   * @param {string} settingName The name of the setting to read.
   * @param {String} roomId The room ID to read the setting value in, may be null.
   * @param {boolean} explicit If true, this method will not consider other levels, just the one
   * provided. Defaults to false.
   * @param {boolean} excludeDefault True to disable using the default value.
   * @return {*} The value, or null if not found.
   */


  static getValueAt(level, settingName, roomId = null, explicit = false, excludeDefault = false) {
    // Verify that the setting is actually a setting
    const setting = _Settings.SETTINGS[settingName];

    if (!setting) {
      throw new Error("Setting '" + settingName + "' does not appear to be a setting.");
    }

    const levelOrder = setting.supportedLevelsAreOrdered ? setting.supportedLevels : LEVEL_ORDER;
    if (!levelOrder.includes("default")) levelOrder.push("default"); // always include default

    const minIndex = levelOrder.indexOf(level);
    if (minIndex === -1) throw new Error("Level " + level + " is not prioritized");

    if (SettingsStore.isFeature(settingName)) {
      const configValue = SettingsStore._getFeatureState(settingName);

      if (configValue === "enable") return true;
      if (configValue === "disable") return false; // else let it fall through the default process
    }

    const handlers = SettingsStore._getHandlers(settingName); // Check if we need to invert the setting at all. Do this after we get the setting
    // handlers though, otherwise we'll fail to read the value.


    if (setting.invertedSettingName) {
      //console.warn(`Inverting ${settingName} to be ${setting.invertedSettingName} - legacy setting`);
      settingName = setting.invertedSettingName;
    }

    if (explicit) {
      const handler = handlers[level];

      if (!handler) {
        return SettingsStore._getFinalValue(setting, level, roomId, null, null);
      }

      const value = handler.getValue(settingName, roomId);
      return SettingsStore._getFinalValue(setting, level, roomId, value, level);
    }

    for (let i = minIndex; i < levelOrder.length; i++) {
      const handler = handlers[levelOrder[i]];
      if (!handler) continue;
      if (excludeDefault && levelOrder[i] === "default") continue;
      const value = handler.getValue(settingName, roomId);
      if (value === null || value === undefined) continue;
      return SettingsStore._getFinalValue(setting, level, roomId, value, levelOrder[i]);
    }

    return SettingsStore._getFinalValue(setting, level, roomId, null, null);
  }

  static _getFinalValue(setting, level, roomId, calculatedValue, calculatedAtLevel) {
    let resultingValue = calculatedValue;

    if (setting.controller) {
      const actualValue = setting.controller.getValueOverride(level, roomId, calculatedValue, calculatedAtLevel);
      if (actualValue !== undefined && actualValue !== null) resultingValue = actualValue;
    }

    if (setting.invertedSettingName) resultingValue = !resultingValue;
    return resultingValue;
  }
  /* eslint-disable valid-jsdoc */
  //https://github.com/eslint/eslint/issues/7307

  /**
   * Sets the value for a setting. The room ID is optional if the setting is not being
   * set for a particular room, otherwise it should be supplied. The value may be null
   * to indicate that the level should no longer have an override.
   * @param {string} settingName The name of the setting to change.
   * @param {String} roomId The room ID to change the value in, may be null.
   * @param {"device"|"room-device"|"room-account"|"account"|"room"} level The level
   * to change the value at.
   * @param {*} value The new value of the setting, may be null.
   * @return {Promise} Resolves when the setting has been changed.
   */

  /* eslint-enable valid-jsdoc */


  static async setValue(settingName, roomId, level, value) {
    // Verify that the setting is actually a setting
    const setting = _Settings.SETTINGS[settingName];

    if (!setting) {
      throw new Error("Setting '" + settingName + "' does not appear to be a setting.");
    }

    const handler = SettingsStore._getHandler(settingName, level);

    if (!handler) {
      throw new Error("Setting " + settingName + " does not have a handler for " + level);
    }

    if (setting.invertedSettingName) {
      // Note: We can't do this when the `level` is "default", however we also
      // know that the user can't possible change the default value through this
      // function so we don't bother checking it.
      //console.warn(`Inverting ${settingName} to be ${setting.invertedSettingName} - legacy setting`);
      settingName = setting.invertedSettingName;
      value = !value;
    }

    if (!handler.canSetValue(settingName, roomId)) {
      throw new Error("User cannot set " + settingName + " at " + level + " in " + roomId);
    }

    await handler.setValue(settingName, roomId, value);
    const controller = setting.controller;

    if (controller) {
      controller.onChange(level, roomId, value);
    }
  }
  /**
   * Determines if the current user is permitted to set the given setting at the given
   * level for a particular room. The room ID is optional if the setting is not being
   * set for a particular room, otherwise it should be supplied.
   * @param {string} settingName The name of the setting to check.
   * @param {String} roomId The room ID to check in, may be null.
   * @param {"device"|"room-device"|"room-account"|"account"|"room"} level The level to
   * check at.
   * @return {boolean} True if the user may set the setting, false otherwise.
   */


  static canSetValue(settingName, roomId, level) {
    // Verify that the setting is actually a setting
    if (!_Settings.SETTINGS[settingName]) {
      throw new Error("Setting '" + settingName + "' does not appear to be a setting.");
    }

    const handler = SettingsStore._getHandler(settingName, level);

    if (!handler) return false;
    return handler.canSetValue(settingName, roomId);
  }
  /**
   * Determines if the given level is supported on this device.
   * @param {"device"|"room-device"|"room-account"|"account"|"room"} level The level
   * to check the feasibility of.
   * @return {boolean} True if the level is supported, false otherwise.
   */


  static isLevelSupported(level) {
    if (!LEVEL_HANDLERS[level]) return false;
    return LEVEL_HANDLERS[level].isSupported();
  }
  /**
   * Debugging function for reading explicit setting values without going through the
   * complicated/biased functions in the SettingsStore. This will print information to
   * the console for analysis. Not intended to be used within the application.
   * @param {string} realSettingName The setting name to try and read.
   * @param {string} roomId Optional room ID to test the setting in.
   */


  static debugSetting(realSettingName, roomId) {
    console.log("--- DEBUG ".concat(realSettingName)); // Note: we intentionally use JSON.stringify here to avoid the console masking the
    // problem if there's a type representation issue. Also, this way it is guaranteed
    // to show up in a rageshake if required.

    const def = _Settings.SETTINGS[realSettingName];
    console.log("--- definition: ".concat(def ? JSON.stringify(def) : '<NOT_FOUND>'));
    console.log("--- default level order: ".concat(JSON.stringify(LEVEL_ORDER)));
    console.log("--- registered handlers: ".concat(JSON.stringify(Object.keys(LEVEL_HANDLERS))));

    const doChecks = settingName => {
      for (const handlerName of Object.keys(LEVEL_HANDLERS)) {
        const handler = LEVEL_HANDLERS[handlerName];

        try {
          const value = handler.getValue(settingName, roomId);
          console.log("---     ".concat(handlerName, "@").concat(roomId || '<no_room>', " = ").concat(JSON.stringify(value)));
        } catch (e) {
          console.log("---     ".concat(handler, "@").concat(roomId || '<no_room>', " THREW ERROR: ").concat(e.message));
          console.error(e);
        }

        if (roomId) {
          try {
            const value = handler.getValue(settingName, null);
            console.log("---     ".concat(handlerName, "@<no_room> = ").concat(JSON.stringify(value)));
          } catch (e) {
            console.log("---     ".concat(handler, "@<no_room> THREW ERROR: ").concat(e.message));
            console.error(e);
          }
        }
      }

      console.log("--- calculating as returned by SettingsStore");
      console.log("--- these might not match if the setting uses a controller - be warned!");

      try {
        const value = SettingsStore.getValue(settingName, roomId);
        console.log("---     SettingsStore#generic@".concat(roomId || '<no_room>', "  = ").concat(JSON.stringify(value)));
      } catch (e) {
        console.log("---     SettingsStore#generic@".concat(roomId || '<no_room>', " THREW ERROR: ").concat(e.message));
        console.error(e);
      }

      if (roomId) {
        try {
          const value = SettingsStore.getValue(settingName, null);
          console.log("---     SettingsStore#generic@<no_room>  = ".concat(JSON.stringify(value)));
        } catch (e) {
          console.log("---     SettingsStore#generic@$<no_room> THREW ERROR: ".concat(e.message));
          console.error(e);
        }
      }

      for (const level of LEVEL_ORDER) {
        try {
          const value = SettingsStore.getValueAt(level, settingName, roomId);
          console.log("---     SettingsStore#".concat(level, "@").concat(roomId || '<no_room>', " = ").concat(JSON.stringify(value)));
        } catch (e) {
          console.log("---     SettingsStore#".concat(level, "@").concat(roomId || '<no_room>', " THREW ERROR: ").concat(e.message));
          console.error(e);
        }

        if (roomId) {
          try {
            const value = SettingsStore.getValueAt(level, settingName, null);
            console.log("---     SettingsStore#".concat(level, "@<no_room> = ").concat(JSON.stringify(value)));
          } catch (e) {
            console.log("---     SettingsStore#".concat(level, "@$<no_room> THREW ERROR: ").concat(e.message));
            console.error(e);
          }
        }
      }
    };

    doChecks(realSettingName);

    if (def.invertedSettingName) {
      console.log("--- TESTING INVERTED SETTING NAME");
      console.log("--- inverted: ".concat(def.invertedSettingName));
      doChecks(def.invertedSettingName);
    }

    console.log("--- END DEBUG");
  }

  static _getHandler(settingName, level) {
    const handlers = SettingsStore._getHandlers(settingName);

    if (!handlers[level]) return null;
    return handlers[level];
  }

  static _getHandlers(settingName) {
    if (!_Settings.SETTINGS[settingName]) return {};
    const handlers = {};

    for (const level of _Settings.SETTINGS[settingName].supportedLevels) {
      if (!LEVEL_HANDLERS[level]) throw new Error("Unexpected level " + level);
      if (SettingsStore.isLevelSupported(level)) handlers[level] = LEVEL_HANDLERS[level];
    } // Always support 'default'


    if (!handlers['default']) handlers['default'] = LEVEL_HANDLERS['default'];
    return handlers;
  }

  static _getFeatureState(settingName) {
    const featuresConfig = _SdkConfig.default.get()['features'];

    const enableLabs = _SdkConfig.default.get()['enableLabs']; // we'll honour the old flag


    let featureState = enableLabs ? "labs" : "disable";

    if (featuresConfig && featuresConfig[settingName] !== undefined) {
      featureState = featuresConfig[settingName];
    }

    const allowedStates = ['enable', 'disable', 'labs'];

    if (!allowedStates.includes(featureState)) {
      console.warn("Feature state '" + featureState + "' is invalid for " + settingName);
      featureState = "disable"; // to prevent accidental features.
    }

    return featureState;
  }

} // For debugging purposes


exports.default = SettingsStore;
(0, _defineProperty2.default)(SettingsStore, "_watchers", {});
(0, _defineProperty2.default)(SettingsStore, "_monitors", {});
(0, _defineProperty2.default)(SettingsStore, "_watcherCount", 1);
global.mxSettingsStore = SettingsStore;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlLmpzIl0sIm5hbWVzIjpbIlNldHRpbmdMZXZlbCIsIkRFVklDRSIsIlJPT01fREVWSUNFIiwiUk9PTV9BQ0NPVU5UIiwiQUNDT1VOVCIsIlJPT00iLCJDT05GSUciLCJERUZBVUxUIiwiZGVmYXVsdFdhdGNoTWFuYWdlciIsIldhdGNoTWFuYWdlciIsImRlZmF1bHRTZXR0aW5ncyIsImludmVydGVkRGVmYXVsdFNldHRpbmdzIiwiZmVhdHVyZU5hbWVzIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsIlNFVFRJTkdTIiwiZGVmYXVsdCIsImlzRmVhdHVyZSIsInB1c2giLCJpbnZlcnRlZFNldHRpbmdOYW1lIiwiTEVWRUxfSEFORExFUlMiLCJEZXZpY2VTZXR0aW5nc0hhbmRsZXIiLCJSb29tRGV2aWNlU2V0dGluZ3NIYW5kbGVyIiwiUm9vbUFjY291bnRTZXR0aW5nc0hhbmRsZXIiLCJBY2NvdW50U2V0dGluZ3NIYW5kbGVyIiwiUm9vbVNldHRpbmdzSGFuZGxlciIsIkNvbmZpZ1NldHRpbmdzSGFuZGxlciIsIkRlZmF1bHRTZXR0aW5nc0hhbmRsZXIiLCJMb2NhbEVjaG9XcmFwcGVyIiwiTEVWRUxfT1JERVIiLCJTZXR0aW5nc1N0b3JlIiwid2F0Y2hTZXR0aW5nIiwic2V0dGluZ05hbWUiLCJyb29tSWQiLCJjYWxsYmFja0ZuIiwic2V0dGluZyIsIm9yaWdpbmFsU2V0dGluZ05hbWUiLCJFcnJvciIsIndhdGNoZXJJZCIsIkRhdGUiLCJnZXRUaW1lIiwiX3dhdGNoZXJDb3VudCIsImxvY2FsaXplZENhbGxiYWNrIiwiY2hhbmdlZEluUm9vbUlkIiwiYXRMZXZlbCIsIm5ld1ZhbEF0TGV2ZWwiLCJuZXdWYWx1ZSIsImdldFZhbHVlIiwiY29uc29sZSIsImxvZyIsIl93YXRjaGVycyIsInVud2F0Y2hTZXR0aW5nIiwid2F0Y2hlclJlZmVyZW5jZSIsIndhcm4iLCJtb25pdG9yU2V0dGluZyIsIl9tb25pdG9ycyIsInJlZ2lzdGVyV2F0Y2hlciIsImluUm9vbUlkIiwibGV2ZWwiLCJuZXdWYWx1ZUF0TGV2ZWwiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImhhc1Jvb20iLCJmaW5kIiwiciIsImdldERpc3BsYXlOYW1lIiwiZGlzcGxheU5hbWUiLCJnZXRMYWJzRmVhdHVyZXMiLCJwb3NzaWJsZUZlYXR1cmVzIiwiZmlsdGVyIiwicyIsImVuYWJsZUxhYnMiLCJTZGtDb25maWciLCJnZXQiLCJfZ2V0RmVhdHVyZVN0YXRlIiwiaXNGZWF0dXJlRW5hYmxlZCIsInNldEZlYXR1cmVFbmFibGVkIiwidmFsdWUiLCJzZXRWYWx1ZSIsImV4Y2x1ZGVEZWZhdWx0IiwibGV2ZWxPcmRlciIsInN1cHBvcnRlZExldmVsc0FyZU9yZGVyZWQiLCJzdXBwb3J0ZWRMZXZlbHMiLCJnZXRWYWx1ZUF0IiwiZXhwbGljaXQiLCJpbmNsdWRlcyIsIm1pbkluZGV4IiwiaW5kZXhPZiIsImNvbmZpZ1ZhbHVlIiwiaGFuZGxlcnMiLCJfZ2V0SGFuZGxlcnMiLCJoYW5kbGVyIiwiX2dldEZpbmFsVmFsdWUiLCJpIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiY2FsY3VsYXRlZFZhbHVlIiwiY2FsY3VsYXRlZEF0TGV2ZWwiLCJyZXN1bHRpbmdWYWx1ZSIsImNvbnRyb2xsZXIiLCJhY3R1YWxWYWx1ZSIsImdldFZhbHVlT3ZlcnJpZGUiLCJfZ2V0SGFuZGxlciIsImNhblNldFZhbHVlIiwib25DaGFuZ2UiLCJpc0xldmVsU3VwcG9ydGVkIiwiaXNTdXBwb3J0ZWQiLCJkZWJ1Z1NldHRpbmciLCJyZWFsU2V0dGluZ05hbWUiLCJkZWYiLCJKU09OIiwic3RyaW5naWZ5IiwiZG9DaGVja3MiLCJoYW5kbGVyTmFtZSIsImUiLCJtZXNzYWdlIiwiZXJyb3IiLCJmZWF0dXJlc0NvbmZpZyIsImZlYXR1cmVTdGF0ZSIsImFsbG93ZWRTdGF0ZXMiLCJnbG9iYWwiLCJteFNldHRpbmdzU3RvcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FB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QXhCLEVBQXFDO0FBQ2pDLFVBQU1zRixjQUFjLEdBQUc3QyxtQkFBVUMsR0FBVixHQUFnQixVQUFoQixDQUF2Qjs7QUFDQSxVQUFNRixVQUFVLEdBQUdDLG1CQUFVQyxHQUFWLEdBQWdCLFlBQWhCLENBQW5CLENBRmlDLENBRWlCOzs7QUFFbEQsUUFBSTZDLFlBQVksR0FBRy9DLFVBQVUsR0FBRyxNQUFILEdBQVksU0FBekM7O0FBQ0EsUUFBSThDLGNBQWMsSUFBSUEsY0FBYyxDQUFDdEYsV0FBRCxDQUFkLEtBQWdDZ0UsU0FBdEQsRUFBaUU7QUFDN0R1QixNQUFBQSxZQUFZLEdBQUdELGNBQWMsQ0FBQ3RGLFdBQUQsQ0FBN0I7QUFDSDs7QUFFRCxVQUFNd0YsYUFBYSxHQUFHLENBQUMsUUFBRCxFQUFXLFNBQVgsRUFBc0IsTUFBdEIsQ0FBdEI7O0FBQ0EsUUFBSSxDQUFDQSxhQUFhLENBQUNsQyxRQUFkLENBQXVCaUMsWUFBdkIsQ0FBTCxFQUEyQztBQUN2Q3ZFLE1BQUFBLE9BQU8sQ0FBQ0ssSUFBUixDQUFhLG9CQUFvQmtFLFlBQXBCLEdBQW1DLG1CQUFuQyxHQUF5RHZGLFdBQXRFO0FBQ0F1RixNQUFBQSxZQUFZLEdBQUcsU0FBZixDQUZ1QyxDQUViO0FBQzdCOztBQUVELFdBQU9BLFlBQVA7QUFDSDs7QUExZThCLEMsQ0E2ZW5DOzs7OzhCQTdlcUJ6RixhLGVBUUUsRTs4QkFSRkEsYSxlQVNFLEU7OEJBVEZBLGEsbUJBWU0sQztBQWtlM0IyRixNQUFNLENBQUNDLGVBQVAsR0FBeUI1RixhQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBUcmF2aXMgUmFsc3RvblxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IERldmljZVNldHRpbmdzSGFuZGxlciBmcm9tIFwiLi9oYW5kbGVycy9EZXZpY2VTZXR0aW5nc0hhbmRsZXJcIjtcbmltcG9ydCBSb29tRGV2aWNlU2V0dGluZ3NIYW5kbGVyIGZyb20gXCIuL2hhbmRsZXJzL1Jvb21EZXZpY2VTZXR0aW5nc0hhbmRsZXJcIjtcbmltcG9ydCBEZWZhdWx0U2V0dGluZ3NIYW5kbGVyIGZyb20gXCIuL2hhbmRsZXJzL0RlZmF1bHRTZXR0aW5nc0hhbmRsZXJcIjtcbmltcG9ydCBSb29tQWNjb3VudFNldHRpbmdzSGFuZGxlciBmcm9tIFwiLi9oYW5kbGVycy9Sb29tQWNjb3VudFNldHRpbmdzSGFuZGxlclwiO1xuaW1wb3J0IEFjY291bnRTZXR0aW5nc0hhbmRsZXIgZnJvbSBcIi4vaGFuZGxlcnMvQWNjb3VudFNldHRpbmdzSGFuZGxlclwiO1xuaW1wb3J0IFJvb21TZXR0aW5nc0hhbmRsZXIgZnJvbSBcIi4vaGFuZGxlcnMvUm9vbVNldHRpbmdzSGFuZGxlclwiO1xuaW1wb3J0IENvbmZpZ1NldHRpbmdzSGFuZGxlciBmcm9tIFwiLi9oYW5kbGVycy9Db25maWdTZXR0aW5nc0hhbmRsZXJcIjtcbmltcG9ydCB7X3R9IGZyb20gJy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gXCIuLi9TZGtDb25maWdcIjtcbmltcG9ydCBkaXMgZnJvbSAnLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7U0VUVElOR1N9IGZyb20gXCIuL1NldHRpbmdzXCI7XG5pbXBvcnQgTG9jYWxFY2hvV3JhcHBlciBmcm9tIFwiLi9oYW5kbGVycy9Mb2NhbEVjaG9XcmFwcGVyXCI7XG5pbXBvcnQge1dhdGNoTWFuYWdlcn0gZnJvbSBcIi4vV2F0Y2hNYW5hZ2VyXCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgdmFyaW91cyBzZXR0aW5nIGxldmVscyBzdXBwb3J0ZWQgYnkgdGhlIFNldHRpbmdzU3RvcmUuXG4gKi9cbmV4cG9ydCBjb25zdCBTZXR0aW5nTGV2ZWwgPSB7XG4gICAgLy8gTm90ZTogVGhpcyBlbnVtIGlzIG5vdCB1c2VkIGluIHRoaXMgY2xhc3Mgb3IgaW4gdGhlIFNldHRpbmdzIGZpbGVcbiAgICAvLyBUaGlzIHNob3VsZCBhbHdheXMgYmUgdXNlZCBlbHNld2hlcmUgaW4gdGhlIHByb2plY3QuXG4gICAgREVWSUNFOiBcImRldmljZVwiLFxuICAgIFJPT01fREVWSUNFOiBcInJvb20tZGV2aWNlXCIsXG4gICAgUk9PTV9BQ0NPVU5UOiBcInJvb20tYWNjb3VudFwiLFxuICAgIEFDQ09VTlQ6IFwiYWNjb3VudFwiLFxuICAgIFJPT006IFwicm9vbVwiLFxuICAgIENPTkZJRzogXCJjb25maWdcIixcbiAgICBERUZBVUxUOiBcImRlZmF1bHRcIixcbn07XG5cbmNvbnN0IGRlZmF1bHRXYXRjaE1hbmFnZXIgPSBuZXcgV2F0Y2hNYW5hZ2VyKCk7XG5cbi8vIENvbnZlcnQgdGhlIHNldHRpbmdzIHRvIGVhc2llciB0byBtYW5hZ2Ugb2JqZWN0cyBmb3IgdGhlIGhhbmRsZXJzXG5jb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7fTtcbmNvbnN0IGludmVydGVkRGVmYXVsdFNldHRpbmdzID0ge307XG5jb25zdCBmZWF0dXJlTmFtZXMgPSBbXTtcbmZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKFNFVFRJTkdTKSkge1xuICAgIGRlZmF1bHRTZXR0aW5nc1trZXldID0gU0VUVElOR1Nba2V5XS5kZWZhdWx0O1xuICAgIGlmIChTRVRUSU5HU1trZXldLmlzRmVhdHVyZSkgZmVhdHVyZU5hbWVzLnB1c2goa2V5KTtcbiAgICBpZiAoU0VUVElOR1Nba2V5XS5pbnZlcnRlZFNldHRpbmdOYW1lKSB7XG4gICAgICAgIC8vIEludmVydCBub3cgc28gdGhhdCB0aGUgcmVzdCBvZiB0aGUgc3lzdGVtIHdpbGwgaW52ZXJ0IGl0IGJhY2tcbiAgICAgICAgLy8gdG8gd2hhdCB3YXMgaW50ZW5kZWQuXG4gICAgICAgIGludmVydGVkRGVmYXVsdFNldHRpbmdzW2tleV0gPSAhU0VUVElOR1Nba2V5XS5kZWZhdWx0O1xuICAgIH1cbn1cblxuY29uc3QgTEVWRUxfSEFORExFUlMgPSB7XG4gICAgXCJkZXZpY2VcIjogbmV3IERldmljZVNldHRpbmdzSGFuZGxlcihmZWF0dXJlTmFtZXMsIGRlZmF1bHRXYXRjaE1hbmFnZXIpLFxuICAgIFwicm9vbS1kZXZpY2VcIjogbmV3IFJvb21EZXZpY2VTZXR0aW5nc0hhbmRsZXIoZGVmYXVsdFdhdGNoTWFuYWdlciksXG4gICAgXCJyb29tLWFjY291bnRcIjogbmV3IFJvb21BY2NvdW50U2V0dGluZ3NIYW5kbGVyKGRlZmF1bHRXYXRjaE1hbmFnZXIpLFxuICAgIFwiYWNjb3VudFwiOiBuZXcgQWNjb3VudFNldHRpbmdzSGFuZGxlcihkZWZhdWx0V2F0Y2hNYW5hZ2VyKSxcbiAgICBcInJvb21cIjogbmV3IFJvb21TZXR0aW5nc0hhbmRsZXIoZGVmYXVsdFdhdGNoTWFuYWdlciksXG4gICAgXCJjb25maWdcIjogbmV3IENvbmZpZ1NldHRpbmdzSGFuZGxlcigpLFxuICAgIFwiZGVmYXVsdFwiOiBuZXcgRGVmYXVsdFNldHRpbmdzSGFuZGxlcihkZWZhdWx0U2V0dGluZ3MsIGludmVydGVkRGVmYXVsdFNldHRpbmdzKSxcbn07XG5cbi8vIFdyYXAgYWxsIHRoZSBoYW5kbGVycyB3aXRoIGxvY2FsIGVjaG9cbmZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKExFVkVMX0hBTkRMRVJTKSkge1xuICAgIExFVkVMX0hBTkRMRVJTW2tleV0gPSBuZXcgTG9jYWxFY2hvV3JhcHBlcihMRVZFTF9IQU5ETEVSU1trZXldKTtcbn1cblxuY29uc3QgTEVWRUxfT1JERVIgPSBbXG4gICAgJ2RldmljZScsICdyb29tLWRldmljZScsICdyb29tLWFjY291bnQnLCAnYWNjb3VudCcsICdyb29tJywgJ2NvbmZpZycsICdkZWZhdWx0Jyxcbl07XG5cbi8qKlxuICogQ29udHJvbHMgYW5kIG1hbmFnZXMgYXBwbGljYXRpb24gc2V0dGluZ3MgYnkgcHJvdmlkaW5nIHZhcnlpbmcgbGV2ZWxzIGF0IHdoaWNoIHRoZVxuICogc2V0dGluZyB2YWx1ZSBtYXkgYmUgc3BlY2lmaWVkLiBUaGUgbGV2ZWxzIGFyZSB0aGVuIHVzZWQgdG8gZGV0ZXJtaW5lIHdoYXQgdGhlIHNldHRpbmdcbiAqIHZhbHVlIHNob3VsZCBiZSBnaXZlbiBhIHNldCBvZiBjaXJjdW1zdGFuY2VzLiBUaGUgbGV2ZWxzLCBpbiBwcmlvcml0eSBvcmRlciwgYXJlOlxuICogLSBcImRldmljZVwiICAgICAgICAgLSBWYWx1ZXMgYXJlIGRldGVybWluZWQgYnkgdGhlIGN1cnJlbnQgZGV2aWNlXG4gKiAtIFwicm9vbS1kZXZpY2VcIiAgICAtIFZhbHVlcyBhcmUgZGV0ZXJtaW5lZCBieSB0aGUgY3VycmVudCBkZXZpY2UgZm9yIGEgcGFydGljdWxhciByb29tXG4gKiAtIFwicm9vbS1hY2NvdW50XCIgICAtIFZhbHVlcyBhcmUgZGV0ZXJtaW5lZCBieSB0aGUgY3VycmVudCBhY2NvdW50IGZvciBhIHBhcnRpY3VsYXIgcm9vbVxuICogLSBcImFjY291bnRcIiAgICAgICAgLSBWYWx1ZXMgYXJlIGRldGVybWluZWQgYnkgdGhlIGN1cnJlbnQgYWNjb3VudFxuICogLSBcInJvb21cIiAgICAgICAgICAgLSBWYWx1ZXMgYXJlIGRldGVybWluZWQgYnkgYSBwYXJ0aWN1bGFyIHJvb20gKGJ5IHRoZSByb29tIGFkbWlucylcbiAqIC0gXCJjb25maWdcIiAgICAgICAgIC0gVmFsdWVzIGFyZSBkZXRlcm1pbmVkIGJ5IHRoZSBjb25maWcuanNvblxuICogLSBcImRlZmF1bHRcIiAgICAgICAgLSBWYWx1ZXMgYXJlIGRldGVybWluZWQgYnkgdGhlIGhhcmRjb2RlZCBkZWZhdWx0c1xuICpcbiAqIEVhY2ggbGV2ZWwgaGFzIGEgZGlmZmVyZW50IG1ldGhvZCB0byBzdG9yaW5nIHRoZSBzZXR0aW5nIHZhbHVlLiBGb3IgaW1wbGVtZW50YXRpb25cbiAqIHNwZWNpZmljIGRldGFpbHMsIHBsZWFzZSBzZWUgdGhlIGhhbmRsZXJzLiBUaGUgXCJjb25maWdcIiBhbmQgXCJkZWZhdWx0XCIgbGV2ZWxzIGFyZVxuICogYm90aCBhbHdheXMgc3VwcG9ydGVkIG9uIGFsbCBwbGF0Zm9ybXMuIEFsbCBvdGhlciBzZXR0aW5ncyBzaG91bGQgYmUgZ3VhcmRlZCBieVxuICogaXNMZXZlbFN1cHBvcnRlZCgpIHByaW9yIHRvIGF0dGVtcHRpbmcgdG8gc2V0IHRoZSB2YWx1ZS5cbiAqXG4gKiBTZXR0aW5ncyBjYW4gYWxzbyByZXByZXNlbnQgZmVhdHVyZXMuIEZlYXR1cmVzIGFyZSBzaWduaWZpY2FudCBwb3J0aW9ucyBvZiB0aGVcbiAqIGFwcGxpY2F0aW9uIHRoYXQgd2FycmFudCBhIGRlZGljYXRlZCBzZXR0aW5nIHRvIHRvZ2dsZSB0aGVtIG9uIG9yIG9mZi4gRmVhdHVyZXMgYXJlXG4gKiBzcGVjaWFsLWNhc2VkIHRvIGVuc3VyZSB0aGF0IHRoZWlyIHZhbHVlcyByZXNwZWN0IHRoZSBjb25maWd1cmF0aW9uIChmb3IgZXhhbXBsZSwgYVxuICogZmVhdHVyZSBtYXkgYmUgcmVwb3J0ZWQgYXMgZGlzYWJsZWQgZXZlbiB0aG91Z2ggYSB1c2VyIGhhcyBzcGVjaWZpY2FsbHkgcmVxdWVzdGVkIGl0XG4gKiBiZSBlbmFibGVkKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dGluZ3NTdG9yZSB7XG4gICAgLy8gV2Ugc3VwcG9ydCB3YXRjaGluZyBzZXR0aW5ncyBmb3IgY2hhbmdlcywgYW5kIGRvIHRoaXMgYnkgdHJhY2tpbmcgd2hpY2ggY2FsbGJhY2tzIGhhdmVcbiAgICAvLyBiZWVuIGdpdmVuIHRvIHVzLiBXZSBlbmQgdXAgcmV0dXJuaW5nIHRoZSBjYWxsYmFja1JlZiB0byB0aGUgY2FsbGVyIHNvIHRoZXkgY2FuIHVuc3Vic2NyaWJlXG4gICAgLy8gYXQgYSBsYXRlciBwb2ludC5cbiAgICAvL1xuICAgIC8vIFdlIGFsc28gbWFpbnRhaW4gYSBsaXN0IG9mIG1vbml0b3JzIHdoaWNoIGFyZSBzcGVjaWFsIHdhdGNoZXJzOiB0aGV5IGNhdXNlIGRpc3BhdGNoZXNcbiAgICAvLyB3aGVuIHRoZSBzZXR0aW5nIGNoYW5nZXMuIFdlIHRyYWNrIHdoaWNoIHJvb21zIHdlJ3JlIG1vbml0b3JpbmcgdGhvdWdoIHRvIGVuc3VyZSB3ZVxuICAgIC8vIGRvbid0IGR1cGxpY2F0ZSB1cGRhdGVzIG9uIHRoZSBidXMuXG4gICAgc3RhdGljIF93YXRjaGVycyA9IHt9OyAvLyB7IGNhbGxiYWNrUmVmID0+IHsgY2FsbGJhY2tGbiB9IH1cbiAgICBzdGF0aWMgX21vbml0b3JzID0ge307IC8vIHsgc2V0dGluZ05hbWUgPT4geyByb29tSWQgPT4gY2FsbGJhY2tSZWYgfSB9XG5cbiAgICAvLyBDb3VudGVyIHVzZWQgZm9yIGdlbmVyYXRpb24gb2Ygd2F0Y2hlciBJRHNcbiAgICBzdGF0aWMgX3dhdGNoZXJDb3VudCA9IDE7XG5cbiAgICAvKipcbiAgICAgKiBXYXRjaGVzIGZvciBjaGFuZ2VzIGluIGEgcGFydGljdWxhciBzZXR0aW5nLiBUaGlzIGlzIGRvbmUgd2l0aG91dCBhbnkgbG9jYWwgZWNob1xuICAgICAqIHdyYXBwaW5nIGFuZCBmaXJlcyB3aGVuZXZlciBhIGNoYW5nZSBpcyBkZXRlY3RlZCBpbiBhIHNldHRpbmcncyB2YWx1ZSwgYXQgYW55IGxldmVsLlxuICAgICAqIFdhdGNoaW5nIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgaW4gc2NlbmFyaW9zIHdoZXJlIHRoZSBhcHAgbmVlZHMgdG8gcmVhY3QgdG8gY2hhbmdlc1xuICAgICAqIG1hZGUgYnkgb3RoZXIgZGV2aWNlcy4gSXQgaXMgb3RoZXJ3aXNlIGV4cGVjdGVkIHRoYXQgY2FsbGVycyB3aWxsIGJlIGFibGUgdG8gdXNlIHRoZVxuICAgICAqIENvbnRyb2xsZXIgc3lzdGVtIG9yIHRyYWNrIHRoZWlyIG93biBjaGFuZ2VzIHRvIHNldHRpbmdzLiBDYWxsZXJzIHNob3VsZCByZXRhaW4gdGhlXG4gICAgICogcmV0dXJuZWQgcmVmZXJlbmNlIHRvIGxhdGVyIHVuc3Vic2NyaWJlIGZyb20gdXBkYXRlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ05hbWUgVGhlIHNldHRpbmcgbmFtZSB0byB3YXRjaFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gd2F0Y2ggZm9yIGNoYW5nZXMgaW4uIE1heSBiZSBudWxsIGZvciAnYWxsJy5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja0ZuIEEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gYSBzZXR0aW5nIGNoYW5nZSBpc1xuICAgICAqIGRldGVjdGVkLiBGaXZlIGFyZ3VtZW50cyBjYW4gYmUgZXhwZWN0ZWQ6IHRoZSBzZXR0aW5nIG5hbWUsIHRoZSByb29tIElEIChtYXkgYmUgbnVsbCksXG4gICAgICogdGhlIGxldmVsIHRoZSBjaGFuZ2UgaGFwcGVuZWQgYXQsIHRoZSBuZXcgdmFsdWUgYXQgdGhlIGdpdmVuIGxldmVsLCBhbmQgZmluYWxseSB0aGUgbmV3XG4gICAgICogdmFsdWUgZm9yIHRoZSBzZXR0aW5nIHJlZ2FyZGxlc3Mgb2YgbGV2ZWwuIFRoZSBjYWxsYmFjayBpcyByZXNwb25zaWJsZSBmb3IgZGV0ZXJtaW5pbmdcbiAgICAgKiBpZiB0aGUgY2hhbmdlIGluIHZhbHVlIGlzIHdvcnRod2hpbGUgZW5vdWdoIHRvIHJlYWN0IHVwb24uXG4gICAgICogQHJldHVybnMge3N0cmluZ30gQSByZWZlcmVuY2UgdG8gdGhlIHdhdGNoZXIgdGhhdCB3YXMgZW1wbG95ZWQuXG4gICAgICovXG4gICAgc3RhdGljIHdhdGNoU2V0dGluZyhzZXR0aW5nTmFtZSwgcm9vbUlkLCBjYWxsYmFja0ZuKSB7XG4gICAgICAgIGNvbnN0IHNldHRpbmcgPSBTRVRUSU5HU1tzZXR0aW5nTmFtZV07XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsU2V0dGluZ05hbWUgPSBzZXR0aW5nTmFtZTtcbiAgICAgICAgaWYgKCFzZXR0aW5nKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2V0dGluZ05hbWV9IGlzIG5vdCBhIHNldHRpbmdgKTtcblxuICAgICAgICBpZiAoc2V0dGluZy5pbnZlcnRlZFNldHRpbmdOYW1lKSB7XG4gICAgICAgICAgICBzZXR0aW5nTmFtZSA9IHNldHRpbmcuaW52ZXJ0ZWRTZXR0aW5nTmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdhdGNoZXJJZCA9IGAke25ldyBEYXRlKCkuZ2V0VGltZSgpfV8ke1NldHRpbmdzU3RvcmUuX3dhdGNoZXJDb3VudCsrfV8ke3NldHRpbmdOYW1lfV8ke3Jvb21JZH1gO1xuXG4gICAgICAgIGNvbnN0IGxvY2FsaXplZENhbGxiYWNrID0gKGNoYW5nZWRJblJvb21JZCwgYXRMZXZlbCwgbmV3VmFsQXRMZXZlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKG9yaWdpbmFsU2V0dGluZ05hbWUpO1xuICAgICAgICAgICAgY2FsbGJhY2tGbihvcmlnaW5hbFNldHRpbmdOYW1lLCBjaGFuZ2VkSW5Sb29tSWQsIGF0TGV2ZWwsIG5ld1ZhbEF0TGV2ZWwsIG5ld1ZhbHVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgd2F0Y2hlciBmb3IgJHtzZXR0aW5nTmFtZX1AJHtyb29tSWQgfHwgJzxudWxsIHJvb20+J30gYXMgSUQgJHt3YXRjaGVySWR9YCk7XG4gICAgICAgIFNldHRpbmdzU3RvcmUuX3dhdGNoZXJzW3dhdGNoZXJJZF0gPSBsb2NhbGl6ZWRDYWxsYmFjaztcbiAgICAgICAgZGVmYXVsdFdhdGNoTWFuYWdlci53YXRjaFNldHRpbmcoc2V0dGluZ05hbWUsIHJvb21JZCwgbG9jYWxpemVkQ2FsbGJhY2spO1xuXG4gICAgICAgIHJldHVybiB3YXRjaGVySWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgdGhlIFNldHRpbmdzU3RvcmUgZnJvbSB3YXRjaGluZyBhIHNldHRpbmcuIFRoaXMgaXMgYSBuby1vcCBpZiB0aGUgd2F0Y2hlclxuICAgICAqIHByb3ZpZGVkIGlzIG5vdCBmb3VuZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gd2F0Y2hlclJlZmVyZW5jZSBUaGUgd2F0Y2hlciByZWZlcmVuY2UgKHJlY2VpdmVkIGZyb20gI3dhdGNoU2V0dGluZylcbiAgICAgKiB0byBjYW5jZWwuXG4gICAgICovXG4gICAgc3RhdGljIHVud2F0Y2hTZXR0aW5nKHdhdGNoZXJSZWZlcmVuY2UpIHtcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLl93YXRjaGVyc1t3YXRjaGVyUmVmZXJlbmNlXSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBFbmRpbmcgbm9uLWV4aXN0ZW50IHdhdGNoZXIgSUQgJHt3YXRjaGVyUmVmZXJlbmNlfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYEVuZGluZyB3YXRjaGVyIElEICR7d2F0Y2hlclJlZmVyZW5jZX1gKTtcbiAgICAgICAgZGVmYXVsdFdhdGNoTWFuYWdlci51bndhdGNoU2V0dGluZyhTZXR0aW5nc1N0b3JlLl93YXRjaGVyc1t3YXRjaGVyUmVmZXJlbmNlXSk7XG4gICAgICAgIGRlbGV0ZSBTZXR0aW5nc1N0b3JlLl93YXRjaGVyc1t3YXRjaGVyUmVmZXJlbmNlXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbW9uaXRvciBmb3IgYSBzZXR0aW5nLiBUaGlzIGJlaGF2ZXMgc2ltaWxhciB0byAjd2F0Y2hTZXR0aW5nIGV4Y2VwdCBpbnN0ZWFkXG4gICAgICogb2YgbWFraW5nIGEgY2FsbCB0byBhIGNhbGxiYWNrLCBpdCBmb3J3YXJkcyBhbGwgY2hhbmdlcyB0byB0aGUgZGlzcGF0Y2hlci4gQ2FsbGVycyBjYW5cbiAgICAgKiBleHBlY3QgdG8gbGlzdGVuIGZvciB0aGUgJ3NldHRpbmdfdXBkYXRlZCcgYWN0aW9uIHdpdGggYW4gb2JqZWN0IGNvbnRhaW5pbmcgc2V0dGluZ05hbWUsXG4gICAgICogcm9vbUlkLCBsZXZlbCwgbmV3VmFsdWVBdExldmVsLCBhbmQgbmV3VmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdOYW1lIFRoZSBzZXR0aW5nIG5hbWUgdG8gbW9uaXRvci5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vbUlkIFRoZSByb29tIElEIHRvIG1vbml0b3IgZm9yIGNoYW5nZXMgaW4uIFVzZSBudWxsIGZvciBhbGwgcm9vbXMuXG4gICAgICovXG4gICAgc3RhdGljIG1vbml0b3JTZXR0aW5nKHNldHRpbmdOYW1lLCByb29tSWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tb25pdG9yc1tzZXR0aW5nTmFtZV0pIHRoaXMuX21vbml0b3JzW3NldHRpbmdOYW1lXSA9IHt9O1xuXG4gICAgICAgIGNvbnN0IHJlZ2lzdGVyV2F0Y2hlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX21vbml0b3JzW3NldHRpbmdOYW1lXVtyb29tSWRdID0gU2V0dGluZ3NTdG9yZS53YXRjaFNldHRpbmcoXG4gICAgICAgICAgICAgICAgc2V0dGluZ05hbWUsIHJvb21JZCwgKHNldHRpbmdOYW1lLCBpblJvb21JZCwgbGV2ZWwsIG5ld1ZhbHVlQXRMZXZlbCwgbmV3VmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NldHRpbmdfdXBkYXRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21JZDogaW5Sb29tSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlQXRMZXZlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBoYXNSb29tID0gT2JqZWN0LmtleXModGhpcy5fbW9uaXRvcnNbc2V0dGluZ05hbWVdKS5maW5kKChyKSA9PiByID09PSByb29tSWQgfHwgciA9PT0gbnVsbCk7XG4gICAgICAgIGlmICghaGFzUm9vbSkge1xuICAgICAgICAgICAgcmVnaXN0ZXJXYXRjaGVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocm9vbUlkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gVW5yZWdpc3RlciBhbGwgZXhpc3Rpbmcgd2F0Y2hlcnMgYW5kIHJlZ2lzdGVyIHRoZSBuZXcgb25lXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByb29tSWQgb2YgT2JqZWN0LmtleXModGhpcy5fbW9uaXRvcnNbc2V0dGluZ05hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnVud2F0Y2hTZXR0aW5nKHRoaXMuX21vbml0b3JzW3NldHRpbmdOYW1lXVtyb29tSWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9uaXRvcnNbc2V0dGluZ05hbWVdID0ge307XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJXYXRjaGVyKCk7XG4gICAgICAgICAgICB9IC8vIGVsc2UgYSB3YXRjaGVyIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBmb3IgdGhlIHJvb20sIHNvIGRvbid0IGJvdGhlciByZWdpc3RlcmluZyBpdCBhZ2FpblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgdHJhbnNsYXRlZCBkaXNwbGF5IG5hbWUgZm9yIGEgZ2l2ZW4gc2V0dGluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nTmFtZSBUaGUgc2V0dGluZyB0byBsb29rIHVwLlxuICAgICAqIEBwYXJhbSB7XCJkZXZpY2VcInxcInJvb20tZGV2aWNlXCJ8XCJyb29tLWFjY291bnRcInxcImFjY291bnRcInxcInJvb21cInxcImNvbmZpZ1wifFwiZGVmYXVsdFwifSBhdExldmVsXG4gICAgICogVGhlIGxldmVsIHRvIGdldCB0aGUgZGlzcGxheSBuYW1lIGZvcjsgRGVmYXVsdHMgdG8gJ2RlZmF1bHQnLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGRpc3BsYXkgbmFtZSBmb3IgdGhlIHNldHRpbmcsIG9yIG51bGwgaWYgbm90IGZvdW5kLlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXREaXNwbGF5TmFtZShzZXR0aW5nTmFtZSwgYXRMZXZlbCA9IFwiZGVmYXVsdFwiKSB7XG4gICAgICAgIGlmICghU0VUVElOR1Nbc2V0dGluZ05hbWVdIHx8ICFTRVRUSU5HU1tzZXR0aW5nTmFtZV0uZGlzcGxheU5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGxldCBkaXNwbGF5TmFtZSA9IFNFVFRJTkdTW3NldHRpbmdOYW1lXS5kaXNwbGF5TmFtZTtcbiAgICAgICAgaWYgKGRpc3BsYXlOYW1lIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheU5hbWVbYXRMZXZlbF0pIGRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWVbYXRMZXZlbF07XG4gICAgICAgICAgICBlbHNlIGRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWVbXCJkZWZhdWx0XCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF90KGRpc3BsYXlOYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIGxhYnMgZmVhdHVyZSBuYW1lc1xuICAgICAqIEByZXR1cm5zIHtzdHJpbmdbXX0gVGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGZlYXR1cmUgbmFtZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0TGFic0ZlYXR1cmVzKCkge1xuICAgICAgICBjb25zdCBwb3NzaWJsZUZlYXR1cmVzID0gT2JqZWN0LmtleXMoU0VUVElOR1MpLmZpbHRlcigocykgPT4gU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmUocykpO1xuXG4gICAgICAgIGNvbnN0IGVuYWJsZUxhYnMgPSBTZGtDb25maWcuZ2V0KClbXCJlbmFibGVMYWJzXCJdO1xuICAgICAgICBpZiAoZW5hYmxlTGFicykgcmV0dXJuIHBvc3NpYmxlRmVhdHVyZXM7XG5cbiAgICAgICAgcmV0dXJuIHBvc3NpYmxlRmVhdHVyZXMuZmlsdGVyKChzKSA9PiBTZXR0aW5nc1N0b3JlLl9nZXRGZWF0dXJlU3RhdGUocykgPT09IFwibGFic1wiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGEgc2V0dGluZyBpcyBhbHNvIGEgZmVhdHVyZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ05hbWUgVGhlIHNldHRpbmcgdG8gbG9vayB1cC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBzZXR0aW5nIGlzIGEgZmVhdHVyZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgaXNGZWF0dXJlKHNldHRpbmdOYW1lKSB7XG4gICAgICAgIGlmICghU0VUVElOR1Nbc2V0dGluZ05hbWVdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBTRVRUSU5HU1tzZXR0aW5nTmFtZV0uaXNGZWF0dXJlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYSBnaXZlbiBmZWF0dXJlIGlzIGVuYWJsZWQuIFRoZSBmZWF0dXJlIGdpdmVuIG11c3QgYmUgYSBrbm93blxuICAgICAqIGZlYXR1cmUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdOYW1lIFRoZSBuYW1lIG9mIHRoZSBzZXR0aW5nIHRoYXQgaXMgYSBmZWF0dXJlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIG9wdGlvbmFsIHJvb20gSUQgdG8gdmFsaWRhdGUgaW4sIG1heSBiZSBudWxsLlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGZlYXR1cmUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgc3RhdGljIGlzRmVhdHVyZUVuYWJsZWQoc2V0dGluZ05hbWUsIHJvb21JZCA9IG51bGwpIHtcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZShzZXR0aW5nTmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgXCIgKyBzZXR0aW5nTmFtZSArIFwiIGlzIG5vdCBhIGZlYXR1cmVcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgZmVhdHVyZSBhcyBlbmFibGVkIG9yIGRpc2FibGVkIG9uIHRoZSBjdXJyZW50IGRldmljZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ05hbWUgVGhlIG5hbWUgb2YgdGhlIHNldHRpbmcuXG4gICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZSBUcnVlIHRvIGVuYWJsZSB0aGUgZmVhdHVyZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBzZXR0aW5nIGhhcyBiZWVuIHNldC5cbiAgICAgKi9cbiAgICBzdGF0aWMgc2V0RmVhdHVyZUVuYWJsZWQoc2V0dGluZ05hbWUsIHZhbHVlKSB7XG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZSBzZXR0aW5nIGlzIGFjdHVhbGx5IGEgc2V0dGluZ1xuICAgICAgICBpZiAoIVNFVFRJTkdTW3NldHRpbmdOYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2V0dGluZyAnXCIgKyBzZXR0aW5nTmFtZSArIFwiJyBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgYSBzZXR0aW5nLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIVNldHRpbmdzU3RvcmUuaXNGZWF0dXJlKHNldHRpbmdOYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2V0dGluZyBcIiArIHNldHRpbmdOYW1lICsgXCIgaXMgbm90IGEgZmVhdHVyZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKHNldHRpbmdOYW1lLCBudWxsLCBcImRldmljZVwiLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgYSBzZXR0aW5nLiBUaGUgcm9vbSBJRCBpcyBvcHRpb25hbCBpZiB0aGUgc2V0dGluZyBpcyBub3QgdG9cbiAgICAgKiBiZSBhcHBsaWVkIHRvIGFueSBwYXJ0aWN1bGFyIHJvb20sIG90aGVyd2lzZSBpdCBzaG91bGQgYmUgc3VwcGxpZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdOYW1lIFRoZSBuYW1lIG9mIHRoZSBzZXR0aW5nIHRvIHJlYWQgdGhlIHZhbHVlIG9mLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gcmVhZCB0aGUgc2V0dGluZyB2YWx1ZSBpbiwgbWF5IGJlIG51bGwuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBleGNsdWRlRGVmYXVsdCBUcnVlIHRvIGRpc2FibGUgdXNpbmcgdGhlIGRlZmF1bHQgdmFsdWUuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlLCBvciBudWxsIGlmIG5vdCBmb3VuZFxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkID0gbnVsbCwgZXhjbHVkZURlZmF1bHQgPSBmYWxzZSkge1xuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgc2V0dGluZyBpcyBhY3R1YWxseSBhIHNldHRpbmdcbiAgICAgICAgaWYgKCFTRVRUSU5HU1tzZXR0aW5nTmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgJ1wiICsgc2V0dGluZ05hbWUgKyBcIicgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGEgc2V0dGluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZXR0aW5nID0gU0VUVElOR1Nbc2V0dGluZ05hbWVdO1xuICAgICAgICBjb25zdCBsZXZlbE9yZGVyID0gKHNldHRpbmcuc3VwcG9ydGVkTGV2ZWxzQXJlT3JkZXJlZCA/IHNldHRpbmcuc3VwcG9ydGVkTGV2ZWxzIDogTEVWRUxfT1JERVIpO1xuXG4gICAgICAgIHJldHVybiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQobGV2ZWxPcmRlclswXSwgc2V0dGluZ05hbWUsIHJvb21JZCwgZmFsc2UsIGV4Y2x1ZGVEZWZhdWx0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgc2V0dGluZydzIHZhbHVlIGF0IGEgcGFydGljdWxhciBsZXZlbCwgaWdub3JpbmcgYWxsIGxldmVscyB0aGF0IGFyZSBtb3JlIHNwZWNpZmljLlxuICAgICAqIEBwYXJhbSB7XCJkZXZpY2VcInxcInJvb20tZGV2aWNlXCJ8XCJyb29tLWFjY291bnRcInxcImFjY291bnRcInxcInJvb21cInxcImNvbmZpZ1wifFwiZGVmYXVsdFwifSBsZXZlbCBUaGVcbiAgICAgKiBsZXZlbCB0byBsb29rIGF0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2V0dGluZyB0byByZWFkLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gcmVhZCB0aGUgc2V0dGluZyB2YWx1ZSBpbiwgbWF5IGJlIG51bGwuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBleHBsaWNpdCBJZiB0cnVlLCB0aGlzIG1ldGhvZCB3aWxsIG5vdCBjb25zaWRlciBvdGhlciBsZXZlbHMsIGp1c3QgdGhlIG9uZVxuICAgICAqIHByb3ZpZGVkLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV4Y2x1ZGVEZWZhdWx0IFRydWUgdG8gZGlzYWJsZSB1c2luZyB0aGUgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgdmFsdWUsIG9yIG51bGwgaWYgbm90IGZvdW5kLlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRWYWx1ZUF0KGxldmVsLCBzZXR0aW5nTmFtZSwgcm9vbUlkID0gbnVsbCwgZXhwbGljaXQgPSBmYWxzZSwgZXhjbHVkZURlZmF1bHQgPSBmYWxzZSkge1xuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgc2V0dGluZyBpcyBhY3R1YWxseSBhIHNldHRpbmdcbiAgICAgICAgY29uc3Qgc2V0dGluZyA9IFNFVFRJTkdTW3NldHRpbmdOYW1lXTtcbiAgICAgICAgaWYgKCFzZXR0aW5nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZXR0aW5nICdcIiArIHNldHRpbmdOYW1lICsgXCInIGRvZXMgbm90IGFwcGVhciB0byBiZSBhIHNldHRpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGV2ZWxPcmRlciA9IChzZXR0aW5nLnN1cHBvcnRlZExldmVsc0FyZU9yZGVyZWQgPyBzZXR0aW5nLnN1cHBvcnRlZExldmVscyA6IExFVkVMX09SREVSKTtcbiAgICAgICAgaWYgKCFsZXZlbE9yZGVyLmluY2x1ZGVzKFwiZGVmYXVsdFwiKSkgbGV2ZWxPcmRlci5wdXNoKFwiZGVmYXVsdFwiKTsgLy8gYWx3YXlzIGluY2x1ZGUgZGVmYXVsdFxuXG4gICAgICAgIGNvbnN0IG1pbkluZGV4ID0gbGV2ZWxPcmRlci5pbmRleE9mKGxldmVsKTtcbiAgICAgICAgaWYgKG1pbkluZGV4ID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKFwiTGV2ZWwgXCIgKyBsZXZlbCArIFwiIGlzIG5vdCBwcmlvcml0aXplZFwiKTtcblxuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmUoc2V0dGluZ05hbWUpKSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWdWYWx1ZSA9IFNldHRpbmdzU3RvcmUuX2dldEZlYXR1cmVTdGF0ZShzZXR0aW5nTmFtZSk7XG4gICAgICAgICAgICBpZiAoY29uZmlnVmFsdWUgPT09IFwiZW5hYmxlXCIpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ1ZhbHVlID09PSBcImRpc2FibGVcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgLy8gZWxzZSBsZXQgaXQgZmFsbCB0aHJvdWdoIHRoZSBkZWZhdWx0IHByb2Nlc3NcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gU2V0dGluZ3NTdG9yZS5fZ2V0SGFuZGxlcnMoc2V0dGluZ05hbWUpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBzZXR0aW5nIGF0IGFsbC4gRG8gdGhpcyBhZnRlciB3ZSBnZXQgdGhlIHNldHRpbmdcbiAgICAgICAgLy8gaGFuZGxlcnMgdGhvdWdoLCBvdGhlcndpc2Ugd2UnbGwgZmFpbCB0byByZWFkIHRoZSB2YWx1ZS5cbiAgICAgICAgaWYgKHNldHRpbmcuaW52ZXJ0ZWRTZXR0aW5nTmFtZSkge1xuICAgICAgICAgICAgLy9jb25zb2xlLndhcm4oYEludmVydGluZyAke3NldHRpbmdOYW1lfSB0byBiZSAke3NldHRpbmcuaW52ZXJ0ZWRTZXR0aW5nTmFtZX0gLSBsZWdhY3kgc2V0dGluZ2ApO1xuICAgICAgICAgICAgc2V0dGluZ05hbWUgPSBzZXR0aW5nLmludmVydGVkU2V0dGluZ05hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXhwbGljaXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVyc1tsZXZlbF07XG4gICAgICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU2V0dGluZ3NTdG9yZS5fZ2V0RmluYWxWYWx1ZShzZXR0aW5nLCBsZXZlbCwgcm9vbUlkLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaGFuZGxlci5nZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkKTtcbiAgICAgICAgICAgIHJldHVybiBTZXR0aW5nc1N0b3JlLl9nZXRGaW5hbFZhbHVlKHNldHRpbmcsIGxldmVsLCByb29tSWQsIHZhbHVlLCBsZXZlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gbWluSW5kZXg7IGkgPCBsZXZlbE9yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gaGFuZGxlcnNbbGV2ZWxPcmRlcltpXV07XG4gICAgICAgICAgICBpZiAoIWhhbmRsZXIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKGV4Y2x1ZGVEZWZhdWx0ICYmIGxldmVsT3JkZXJbaV0gPT09IFwiZGVmYXVsdFwiKSBjb250aW51ZTtcblxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBoYW5kbGVyLmdldFZhbHVlKHNldHRpbmdOYW1lLCByb29tSWQpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgcmV0dXJuIFNldHRpbmdzU3RvcmUuX2dldEZpbmFsVmFsdWUoc2V0dGluZywgbGV2ZWwsIHJvb21JZCwgdmFsdWUsIGxldmVsT3JkZXJbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFNldHRpbmdzU3RvcmUuX2dldEZpbmFsVmFsdWUoc2V0dGluZywgbGV2ZWwsIHJvb21JZCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgc3RhdGljIF9nZXRGaW5hbFZhbHVlKHNldHRpbmcsIGxldmVsLCByb29tSWQsIGNhbGN1bGF0ZWRWYWx1ZSwgY2FsY3VsYXRlZEF0TGV2ZWwpIHtcbiAgICAgICAgbGV0IHJlc3VsdGluZ1ZhbHVlID0gY2FsY3VsYXRlZFZhbHVlO1xuXG4gICAgICAgIGlmIChzZXR0aW5nLmNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdHVhbFZhbHVlID0gc2V0dGluZy5jb250cm9sbGVyLmdldFZhbHVlT3ZlcnJpZGUobGV2ZWwsIHJvb21JZCwgY2FsY3VsYXRlZFZhbHVlLCBjYWxjdWxhdGVkQXRMZXZlbCk7XG4gICAgICAgICAgICBpZiAoYWN0dWFsVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBhY3R1YWxWYWx1ZSAhPT0gbnVsbCkgcmVzdWx0aW5nVmFsdWUgPSBhY3R1YWxWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5nLmludmVydGVkU2V0dGluZ05hbWUpIHJlc3VsdGluZ1ZhbHVlID0gIXJlc3VsdGluZ1ZhbHVlO1xuICAgICAgICByZXR1cm4gcmVzdWx0aW5nVmFsdWU7XG4gICAgfVxuXG4gICAgLyogZXNsaW50LWRpc2FibGUgdmFsaWQtanNkb2MgKi8gLy9odHRwczovL2dpdGh1Yi5jb20vZXNsaW50L2VzbGludC9pc3N1ZXMvNzMwN1xuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHZhbHVlIGZvciBhIHNldHRpbmcuIFRoZSByb29tIElEIGlzIG9wdGlvbmFsIGlmIHRoZSBzZXR0aW5nIGlzIG5vdCBiZWluZ1xuICAgICAqIHNldCBmb3IgYSBwYXJ0aWN1bGFyIHJvb20sIG90aGVyd2lzZSBpdCBzaG91bGQgYmUgc3VwcGxpZWQuIFRoZSB2YWx1ZSBtYXkgYmUgbnVsbFxuICAgICAqIHRvIGluZGljYXRlIHRoYXQgdGhlIGxldmVsIHNob3VsZCBubyBsb25nZXIgaGF2ZSBhbiBvdmVycmlkZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ05hbWUgVGhlIG5hbWUgb2YgdGhlIHNldHRpbmcgdG8gY2hhbmdlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIHJvb20gSUQgdG8gY2hhbmdlIHRoZSB2YWx1ZSBpbiwgbWF5IGJlIG51bGwuXG4gICAgICogQHBhcmFtIHtcImRldmljZVwifFwicm9vbS1kZXZpY2VcInxcInJvb20tYWNjb3VudFwifFwiYWNjb3VudFwifFwicm9vbVwifSBsZXZlbCBUaGUgbGV2ZWxcbiAgICAgKiB0byBjaGFuZ2UgdGhlIHZhbHVlIGF0LlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgc2V0dGluZywgbWF5IGJlIG51bGwuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiB0aGUgc2V0dGluZyBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgICAqL1xuICAgIC8qIGVzbGludC1lbmFibGUgdmFsaWQtanNkb2MgKi9cbiAgICBzdGF0aWMgYXN5bmMgc2V0VmFsdWUoc2V0dGluZ05hbWUsIHJvb21JZCwgbGV2ZWwsIHZhbHVlKSB7XG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZSBzZXR0aW5nIGlzIGFjdHVhbGx5IGEgc2V0dGluZ1xuICAgICAgICBjb25zdCBzZXR0aW5nID0gU0VUVElOR1Nbc2V0dGluZ05hbWVdO1xuICAgICAgICBpZiAoIXNldHRpbmcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgJ1wiICsgc2V0dGluZ05hbWUgKyBcIicgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGEgc2V0dGluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gU2V0dGluZ3NTdG9yZS5fZ2V0SGFuZGxlcihzZXR0aW5nTmFtZSwgbGV2ZWwpO1xuICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgXCIgKyBzZXR0aW5nTmFtZSArIFwiIGRvZXMgbm90IGhhdmUgYSBoYW5kbGVyIGZvciBcIiArIGxldmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5nLmludmVydGVkU2V0dGluZ05hbWUpIHtcbiAgICAgICAgICAgIC8vIE5vdGU6IFdlIGNhbid0IGRvIHRoaXMgd2hlbiB0aGUgYGxldmVsYCBpcyBcImRlZmF1bHRcIiwgaG93ZXZlciB3ZSBhbHNvXG4gICAgICAgICAgICAvLyBrbm93IHRoYXQgdGhlIHVzZXIgY2FuJ3QgcG9zc2libGUgY2hhbmdlIHRoZSBkZWZhdWx0IHZhbHVlIHRocm91Z2ggdGhpc1xuICAgICAgICAgICAgLy8gZnVuY3Rpb24gc28gd2UgZG9uJ3QgYm90aGVyIGNoZWNraW5nIGl0LlxuICAgICAgICAgICAgLy9jb25zb2xlLndhcm4oYEludmVydGluZyAke3NldHRpbmdOYW1lfSB0byBiZSAke3NldHRpbmcuaW52ZXJ0ZWRTZXR0aW5nTmFtZX0gLSBsZWdhY3kgc2V0dGluZ2ApO1xuICAgICAgICAgICAgc2V0dGluZ05hbWUgPSBzZXR0aW5nLmludmVydGVkU2V0dGluZ05hbWU7XG4gICAgICAgICAgICB2YWx1ZSA9ICF2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFuZGxlci5jYW5TZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNlciBjYW5ub3Qgc2V0IFwiICsgc2V0dGluZ05hbWUgKyBcIiBhdCBcIiArIGxldmVsICsgXCIgaW4gXCIgKyByb29tSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgaGFuZGxlci5zZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkLCB2YWx1ZSk7XG5cbiAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHNldHRpbmcuY29udHJvbGxlcjtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIub25DaGFuZ2UobGV2ZWwsIHJvb21JZCwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgY3VycmVudCB1c2VyIGlzIHBlcm1pdHRlZCB0byBzZXQgdGhlIGdpdmVuIHNldHRpbmcgYXQgdGhlIGdpdmVuXG4gICAgICogbGV2ZWwgZm9yIGEgcGFydGljdWxhciByb29tLiBUaGUgcm9vbSBJRCBpcyBvcHRpb25hbCBpZiB0aGUgc2V0dGluZyBpcyBub3QgYmVpbmdcbiAgICAgKiBzZXQgZm9yIGEgcGFydGljdWxhciByb29tLCBvdGhlcndpc2UgaXQgc2hvdWxkIGJlIHN1cHBsaWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2V0dGluZyB0byBjaGVjay5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vbUlkIFRoZSByb29tIElEIHRvIGNoZWNrIGluLCBtYXkgYmUgbnVsbC5cbiAgICAgKiBAcGFyYW0ge1wiZGV2aWNlXCJ8XCJyb29tLWRldmljZVwifFwicm9vbS1hY2NvdW50XCJ8XCJhY2NvdW50XCJ8XCJyb29tXCJ9IGxldmVsIFRoZSBsZXZlbCB0b1xuICAgICAqIGNoZWNrIGF0LlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHVzZXIgbWF5IHNldCB0aGUgc2V0dGluZywgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHN0YXRpYyBjYW5TZXRWYWx1ZShzZXR0aW5nTmFtZSwgcm9vbUlkLCBsZXZlbCkge1xuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgc2V0dGluZyBpcyBhY3R1YWxseSBhIHNldHRpbmdcbiAgICAgICAgaWYgKCFTRVRUSU5HU1tzZXR0aW5nTmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgJ1wiICsgc2V0dGluZ05hbWUgKyBcIicgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGEgc2V0dGluZy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gU2V0dGluZ3NTdG9yZS5fZ2V0SGFuZGxlcihzZXR0aW5nTmFtZSwgbGV2ZWwpO1xuICAgICAgICBpZiAoIWhhbmRsZXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGhhbmRsZXIuY2FuU2V0VmFsdWUoc2V0dGluZ05hbWUsIHJvb21JZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gbGV2ZWwgaXMgc3VwcG9ydGVkIG9uIHRoaXMgZGV2aWNlLlxuICAgICAqIEBwYXJhbSB7XCJkZXZpY2VcInxcInJvb20tZGV2aWNlXCJ8XCJyb29tLWFjY291bnRcInxcImFjY291bnRcInxcInJvb21cIn0gbGV2ZWwgVGhlIGxldmVsXG4gICAgICogdG8gY2hlY2sgdGhlIGZlYXNpYmlsaXR5IG9mLlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGxldmVsIGlzIHN1cHBvcnRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHN0YXRpYyBpc0xldmVsU3VwcG9ydGVkKGxldmVsKSB7XG4gICAgICAgIGlmICghTEVWRUxfSEFORExFUlNbbGV2ZWxdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBMRVZFTF9IQU5ETEVSU1tsZXZlbF0uaXNTdXBwb3J0ZWQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWJ1Z2dpbmcgZnVuY3Rpb24gZm9yIHJlYWRpbmcgZXhwbGljaXQgc2V0dGluZyB2YWx1ZXMgd2l0aG91dCBnb2luZyB0aHJvdWdoIHRoZVxuICAgICAqIGNvbXBsaWNhdGVkL2JpYXNlZCBmdW5jdGlvbnMgaW4gdGhlIFNldHRpbmdzU3RvcmUuIFRoaXMgd2lsbCBwcmludCBpbmZvcm1hdGlvbiB0b1xuICAgICAqIHRoZSBjb25zb2xlIGZvciBhbmFseXNpcy4gTm90IGludGVuZGVkIHRvIGJlIHVzZWQgd2l0aGluIHRoZSBhcHBsaWNhdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVhbFNldHRpbmdOYW1lIFRoZSBzZXR0aW5nIG5hbWUgdG8gdHJ5IGFuZCByZWFkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByb29tSWQgT3B0aW9uYWwgcm9vbSBJRCB0byB0ZXN0IHRoZSBzZXR0aW5nIGluLlxuICAgICAqL1xuICAgIHN0YXRpYyBkZWJ1Z1NldHRpbmcocmVhbFNldHRpbmdOYW1lLCByb29tSWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYC0tLSBERUJVRyAke3JlYWxTZXR0aW5nTmFtZX1gKTtcblxuICAgICAgICAvLyBOb3RlOiB3ZSBpbnRlbnRpb25hbGx5IHVzZSBKU09OLnN0cmluZ2lmeSBoZXJlIHRvIGF2b2lkIHRoZSBjb25zb2xlIG1hc2tpbmcgdGhlXG4gICAgICAgIC8vIHByb2JsZW0gaWYgdGhlcmUncyBhIHR5cGUgcmVwcmVzZW50YXRpb24gaXNzdWUuIEFsc28sIHRoaXMgd2F5IGl0IGlzIGd1YXJhbnRlZWRcbiAgICAgICAgLy8gdG8gc2hvdyB1cCBpbiBhIHJhZ2VzaGFrZSBpZiByZXF1aXJlZC5cblxuICAgICAgICBjb25zdCBkZWYgPSBTRVRUSU5HU1tyZWFsU2V0dGluZ05hbWVdO1xuICAgICAgICBjb25zb2xlLmxvZyhgLS0tIGRlZmluaXRpb246ICR7ZGVmID8gSlNPTi5zdHJpbmdpZnkoZGVmKSA6ICc8Tk9UX0ZPVU5EPid9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAtLS0gZGVmYXVsdCBsZXZlbCBvcmRlcjogJHtKU09OLnN0cmluZ2lmeShMRVZFTF9PUkRFUil9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAtLS0gcmVnaXN0ZXJlZCBoYW5kbGVyczogJHtKU09OLnN0cmluZ2lmeShPYmplY3Qua2V5cyhMRVZFTF9IQU5ETEVSUykpfWApO1xuXG4gICAgICAgIGNvbnN0IGRvQ2hlY2tzID0gKHNldHRpbmdOYW1lKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJOYW1lIG9mIE9iamVjdC5rZXlzKExFVkVMX0hBTkRMRVJTKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBMRVZFTF9IQU5ETEVSU1toYW5kbGVyTmFtZV07XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGhhbmRsZXIuZ2V0VmFsdWUoc2V0dGluZ05hbWUsIHJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLS0gICAgICR7aGFuZGxlck5hbWV9QCR7cm9vbUlkIHx8ICc8bm9fcm9vbT4nfSA9ICR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfWApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYC0tLSAgICAgJHtoYW5kbGVyfUAke3Jvb21JZCB8fCAnPG5vX3Jvb20+J30gVEhSRVcgRVJST1I6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyb29tSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaGFuZGxlci5nZXRWYWx1ZShzZXR0aW5nTmFtZSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tICAgICAke2hhbmRsZXJOYW1lfUA8bm9fcm9vbT4gPSAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYC0tLSAgICAgJHtoYW5kbGVyfUA8bm9fcm9vbT4gVEhSRVcgRVJST1I6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coYC0tLSBjYWxjdWxhdGluZyBhcyByZXR1cm5lZCBieSBTZXR0aW5nc1N0b3JlYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tIHRoZXNlIG1pZ2h0IG5vdCBtYXRjaCBpZiB0aGUgc2V0dGluZyB1c2VzIGEgY29udHJvbGxlciAtIGJlIHdhcm5lZCFgKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoc2V0dGluZ05hbWUsIHJvb21JZCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYC0tLSAgICAgU2V0dGluZ3NTdG9yZSNnZW5lcmljQCR7cm9vbUlkIHx8ICc8bm9fcm9vbT4nfSAgPSAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX1gKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tICAgICBTZXR0aW5nc1N0b3JlI2dlbmVyaWNAJHtyb29tSWQgfHwgJzxub19yb29tPid9IFRIUkVXIEVSUk9SOiAke2UubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKHNldHRpbmdOYW1lLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYC0tLSAgICAgU2V0dGluZ3NTdG9yZSNnZW5lcmljQDxub19yb29tPiAgPSAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX1gKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLS0gICAgIFNldHRpbmdzU3RvcmUjZ2VuZXJpY0AkPG5vX3Jvb20+IFRIUkVXIEVSUk9SOiAke2UubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgbGV2ZWwgb2YgTEVWRUxfT1JERVIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChsZXZlbCwgc2V0dGluZ05hbWUsIHJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLS0gICAgIFNldHRpbmdzU3RvcmUjJHtsZXZlbH1AJHtyb29tSWQgfHwgJzxub19yb29tPid9ID0gJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tICAgICBTZXR0aW5nc1N0b3JlIyR7bGV2ZWx9QCR7cm9vbUlkIHx8ICc8bm9fcm9vbT4nfSBUSFJFVyBFUlJPUjogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJvb21JZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQobGV2ZWwsIHNldHRpbmdOYW1lLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLS0gICAgIFNldHRpbmdzU3RvcmUjJHtsZXZlbH1APG5vX3Jvb20+ID0gJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9YCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLS0gICAgIFNldHRpbmdzU3RvcmUjJHtsZXZlbH1AJDxub19yb29tPiBUSFJFVyBFUlJPUjogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGRvQ2hlY2tzKHJlYWxTZXR0aW5nTmFtZSk7XG5cbiAgICAgICAgaWYgKGRlZi5pbnZlcnRlZFNldHRpbmdOYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tIFRFU1RJTkcgSU5WRVJURUQgU0VUVElORyBOQU1FYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgLS0tIGludmVydGVkOiAke2RlZi5pbnZlcnRlZFNldHRpbmdOYW1lfWApO1xuICAgICAgICAgICAgZG9DaGVja3MoZGVmLmludmVydGVkU2V0dGluZ05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYC0tLSBFTkQgREVCVUdgKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2dldEhhbmRsZXIoc2V0dGluZ05hbWUsIGxldmVsKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gU2V0dGluZ3NTdG9yZS5fZ2V0SGFuZGxlcnMoc2V0dGluZ05hbWUpO1xuICAgICAgICBpZiAoIWhhbmRsZXJzW2xldmVsXSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBoYW5kbGVyc1tsZXZlbF07XG4gICAgfVxuXG4gICAgc3RhdGljIF9nZXRIYW5kbGVycyhzZXR0aW5nTmFtZSkge1xuICAgICAgICBpZiAoIVNFVFRJTkdTW3NldHRpbmdOYW1lXSkgcmV0dXJuIHt9O1xuXG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0ge307XG4gICAgICAgIGZvciAoY29uc3QgbGV2ZWwgb2YgU0VUVElOR1Nbc2V0dGluZ05hbWVdLnN1cHBvcnRlZExldmVscykge1xuICAgICAgICAgICAgaWYgKCFMRVZFTF9IQU5ETEVSU1tsZXZlbF0pIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgbGV2ZWwgXCIgKyBsZXZlbCk7XG4gICAgICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0xldmVsU3VwcG9ydGVkKGxldmVsKSkgaGFuZGxlcnNbbGV2ZWxdID0gTEVWRUxfSEFORExFUlNbbGV2ZWxdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWx3YXlzIHN1cHBvcnQgJ2RlZmF1bHQnXG4gICAgICAgIGlmICghaGFuZGxlcnNbJ2RlZmF1bHQnXSkgaGFuZGxlcnNbJ2RlZmF1bHQnXSA9IExFVkVMX0hBTkRMRVJTWydkZWZhdWx0J107XG5cbiAgICAgICAgcmV0dXJuIGhhbmRsZXJzO1xuICAgIH1cblxuICAgIHN0YXRpYyBfZ2V0RmVhdHVyZVN0YXRlKHNldHRpbmdOYW1lKSB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVzQ29uZmlnID0gU2RrQ29uZmlnLmdldCgpWydmZWF0dXJlcyddO1xuICAgICAgICBjb25zdCBlbmFibGVMYWJzID0gU2RrQ29uZmlnLmdldCgpWydlbmFibGVMYWJzJ107IC8vIHdlJ2xsIGhvbm91ciB0aGUgb2xkIGZsYWdcblxuICAgICAgICBsZXQgZmVhdHVyZVN0YXRlID0gZW5hYmxlTGFicyA/IFwibGFic1wiIDogXCJkaXNhYmxlXCI7XG4gICAgICAgIGlmIChmZWF0dXJlc0NvbmZpZyAmJiBmZWF0dXJlc0NvbmZpZ1tzZXR0aW5nTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZmVhdHVyZVN0YXRlID0gZmVhdHVyZXNDb25maWdbc2V0dGluZ05hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxsb3dlZFN0YXRlcyA9IFsnZW5hYmxlJywgJ2Rpc2FibGUnLCAnbGFicyddO1xuICAgICAgICBpZiAoIWFsbG93ZWRTdGF0ZXMuaW5jbHVkZXMoZmVhdHVyZVN0YXRlKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmVhdHVyZSBzdGF0ZSAnXCIgKyBmZWF0dXJlU3RhdGUgKyBcIicgaXMgaW52YWxpZCBmb3IgXCIgKyBzZXR0aW5nTmFtZSk7XG4gICAgICAgICAgICBmZWF0dXJlU3RhdGUgPSBcImRpc2FibGVcIjsgLy8gdG8gcHJldmVudCBhY2NpZGVudGFsIGZlYXR1cmVzLlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZlYXR1cmVTdGF0ZTtcbiAgICB9XG59XG5cbi8vIEZvciBkZWJ1Z2dpbmcgcHVycG9zZXNcbmdsb2JhbC5teFNldHRpbmdzU3RvcmUgPSBTZXR0aW5nc1N0b3JlO1xuIl19