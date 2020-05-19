"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SETTINGS = void 0;

var _matrixJsSdk = require("matrix-js-sdk");

var _languageHandler = require("../languageHandler");

var _NotificationControllers = require("./controllers/NotificationControllers");

var _CustomStatusController = _interopRequireDefault(require("./controllers/CustomStatusController"));

var _ThemeController = _interopRequireDefault(require("./controllers/ThemeController"));

var _PushToMatrixClientController = _interopRequireDefault(require("./controllers/PushToMatrixClientController"));

var _ReloadOnChangeController = _interopRequireDefault(require("./controllers/ReloadOnChangeController"));

var _RightPanelStorePhases = require("../stores/RightPanelStorePhases");

/*
Copyright 2017 Travis Ralston
Copyright 2018, 2019 New Vector Ltd.
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
// These are just a bunch of helper arrays to avoid copy/pasting a bunch of times
const LEVELS_ROOM_SETTINGS = ['device', 'room-device', 'room-account', 'account', 'config'];
const LEVELS_ROOM_OR_ACCOUNT = ['room-account', 'account'];
const LEVELS_ROOM_SETTINGS_WITH_ROOM = ['device', 'room-device', 'room-account', 'account', 'config', 'room'];
const LEVELS_ACCOUNT_SETTINGS = ['device', 'account', 'config'];
const LEVELS_FEATURE = ['device', 'config'];
const LEVELS_DEVICE_ONLY_SETTINGS = ['device'];
const LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG = ['device', 'config'];
const SETTINGS = {
  // EXAMPLE SETTING:
  // "my-setting": {
  //     // Must be set to true for features. Default is 'false'.
  //     isFeature: false,
  //
  //     // Display names are strongly recommended for clarity.
  //     displayName: _td("Cool Name"),
  //
  //     // Display name can also be an object for different levels.
  //     //displayName: {
  //     //    "device": _td("Name for when the setting is used at 'device'"),
  //     //    "room": _td("Name for when the setting is used at 'room'"),
  //     //    "default": _td("The name for all other levels"),
  //     //}
  //
  //     // The supported levels are required. Preferably, use the preset arrays
  //     // at the top of this file to define this rather than a custom array.
  //     supportedLevels: [
  //         // The order does not matter.
  //
  //         "device",        // Affects the current device only
  //         "room-device",   // Affects the current room on the current device
  //         "room-account",  // Affects the current room for the current account
  //         "account",       // Affects the current account
  //         "room",          // Affects the current room (controlled by room admins)
  //         "config",        // Affects the current application
  //
  //         // "default" is always supported and does not get listed here.
  //     ],
  //
  //     // Required. Can be any data type. The value specified here should match
  //     // the data being stored (ie: if a boolean is used, the setting should
  //     // represent a boolean).
  //     default: {
  //         your: "value",
  //     },
  //
  //     // Optional settings controller. See SettingsController for more information.
  //     controller: new MySettingController(),
  //
  //     // Optional flag to make supportedLevels be respected as the order to handle
  //     // settings. The first element is treated as "most preferred". The "default"
  //     // level is always appended to the end.
  //     supportedLevelsAreOrdered: false,
  //
  //     // Optional value to invert a boolean setting's value. The string given will
  //     // be read as the setting's ID instead of the one provided as the key for the
  //     // setting definition. By setting this, the returned value will automatically
  //     // be inverted, except for when the default value is returned. Inversion will
  //     // occur after the controller is asked for an override. This should be used by
  //     // historical settings which we don't want existing user's values be wiped. Do
  //     // not use this for new settings.
  //     invertedSettingName: "my-negative-setting",
  // },
  "feature_pinning": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Message Pinning"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "feature_custom_status": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Custom user status messages"),
    supportedLevels: LEVELS_FEATURE,
    default: false,
    controller: new _CustomStatusController.default()
  },
  "feature_custom_tags": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Group & filter rooms by custom tags (refresh to apply changes)"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "feature_state_counters": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Render simple counters in room header"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "feature_many_integration_managers": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Multiple integration managers"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "feature_mjolnir": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Try out new ways to ignore people (experimental)"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "feature_custom_themes": {
    isFeature: true,
    displayName: (0, _languageHandler._td)("Support adding custom themes"),
    supportedLevels: LEVELS_FEATURE,
    default: false
  },
  "mjolnirRooms": {
    supportedLevels: ['account'],
    default: []
  },
  "mjolnirPersonalRoom": {
    supportedLevels: ['account'],
    default: null
  },
  "feature_cross_signing": {
    // XXX: We shouldn't be using the feature prefix for non-feature settings. There is an exception
    // for this case though as we're converting a feature to a setting for a temporary safety net.
    displayName: (0, _languageHandler._td)("Enable cross-signing to verify per-user instead of per-session"),
    supportedLevels: ['device', 'config'],
    // we shouldn't use LEVELS_FEATURE for non-features, so copy it here.
    default: true
  },
  "feature_bridge_state": {
    isFeature: true,
    supportedLevels: LEVELS_FEATURE,
    displayName: (0, _languageHandler._td)("Show info about bridges in room settings"),
    default: false
  },
  "MessageComposerInput.suggestEmoji": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Enable Emoji suggestions while typing'),
    default: true,
    invertedSettingName: 'MessageComposerInput.dontSuggestEmoji'
  },
  "useCompactLayout": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Use compact timeline layout'),
    default: false
  },
  "showRedactions": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: (0, _languageHandler._td)('Show a placeholder for removed messages'),
    default: true,
    invertedSettingName: 'hideRedactions'
  },
  "showJoinLeaves": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: (0, _languageHandler._td)('Show join/leave messages (invites/kicks/bans unaffected)'),
    default: true,
    invertedSettingName: 'hideJoinLeaves'
  },
  "showAvatarChanges": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: (0, _languageHandler._td)('Show avatar changes'),
    default: true,
    invertedSettingName: 'hideAvatarChanges'
  },
  "showDisplaynameChanges": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: (0, _languageHandler._td)('Show display name changes'),
    default: true,
    invertedSettingName: 'hideDisplaynameChanges'
  },
  "showReadReceipts": {
    supportedLevels: LEVELS_ROOM_SETTINGS,
    displayName: (0, _languageHandler._td)('Show read receipts sent by other users'),
    default: true,
    invertedSettingName: 'hideReadReceipts'
  },
  "showTwelveHourTimestamps": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Show timestamps in 12 hour format (e.g. 2:30pm)'),
    default: false
  },
  "alwaysShowTimestamps": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Always show message timestamps'),
    default: false
  },
  "autoplayGifsAndVideos": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Autoplay GIFs and videos'),
    default: false
  },
  "alwaysShowEncryptionIcons": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Always show encryption icons'),
    default: true
  },
  "showRoomRecoveryReminder": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Show a reminder to enable Secure Message Recovery in encrypted rooms'),
    default: true
  },
  "enableSyntaxHighlightLanguageDetection": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Enable automatic language detection for syntax highlighting'),
    default: false
  },
  "Pill.shouldShowPillAvatar": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Show avatars in user and room mentions'),
    default: true,
    invertedSettingName: 'Pill.shouldHidePillAvatar'
  },
  "TextualBody.enableBigEmoji": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Enable big emoji in chat'),
    default: true,
    invertedSettingName: 'TextualBody.disableBigEmoji'
  },
  "MessageComposerInput.isRichTextEnabled": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    default: false
  },
  "MessageComposer.showFormatting": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    default: false
  },
  "sendTypingNotifications": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Send typing notifications"),
    default: true,
    invertedSettingName: 'dontSendTypingNotifications'
  },
  "showTypingNotifications": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Show typing notifications"),
    default: true
  },
  "MessageComposerInput.autoReplaceEmoji": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Automatically replace plain text Emoji'),
    default: false
  },
  "VideoView.flipVideoHorizontally": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Mirror local video feed'),
    default: false
  },
  "TagPanel.enableTagPanel": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Enable Community Filter Panel'),
    default: true,
    invertedSettingName: 'TagPanel.disableTagPanel'
  },
  "theme": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    default: "light",
    controller: new _ThemeController.default()
  },
  "custom_themes": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    default: []
  },
  "use_system_theme": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: true,
    displayName: (0, _languageHandler._td)("Match system theme")
  },
  "webRtcAllowPeerToPeer": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    displayName: (0, _languageHandler._td)('Allow Peer-to-Peer for 1:1 calls'),
    default: true,
    invertedSettingName: 'webRtcForceTURN'
  },
  "webrtc_audiooutput": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: null
  },
  "webrtc_audioinput": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: null
  },
  "webrtc_videoinput": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: null
  },
  "language": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: "en"
  },
  "breadcrumb_rooms": {
    supportedLevels: ['account'],
    default: []
  },
  "room_directory_servers": {
    supportedLevels: ['account'],
    default: []
  },
  "integrationProvisioning": {
    supportedLevels: ['account'],
    default: true
  },
  "allowedWidgets": {
    supportedLevels: ['room-account'],
    default: {} // none allowed

  },
  "analyticsOptIn": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    displayName: (0, _languageHandler._td)('Send analytics data'),
    default: false
  },
  "showCookieBar": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: true
  },
  "autocompleteDelay": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: 200
  },
  "readMarkerInViewThresholdMs": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: 3000
  },
  "readMarkerOutOfViewThresholdMs": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: 30000
  },
  "blacklistUnverifiedDevices": {
    // We specifically want to have room-device > device so that users may set a device default
    // with a per-room override.
    supportedLevels: ['room-device', 'device'],
    supportedLevelsAreOrdered: true,
    displayName: {
      "default": (0, _languageHandler._td)('Never send encrypted messages to unverified sessions from this session'),
      "room-device": (0, _languageHandler._td)('Never send encrypted messages to unverified sessions in this room from this session')
    },
    default: false
  },
  "urlPreviewsEnabled": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: {
      "default": (0, _languageHandler._td)('Enable inline URL previews by default'),
      "room-account": (0, _languageHandler._td)("Enable URL previews for this room (only affects you)"),
      "room": (0, _languageHandler._td)("Enable URL previews by default for participants in this room")
    },
    default: true
  },
  "urlPreviewsEnabled_e2ee": {
    supportedLevels: ['room-device', 'room-account'],
    displayName: {
      "room-account": (0, _languageHandler._td)("Enable URL previews for this room (only affects you)")
    },
    default: false
  },
  "roomColor": {
    supportedLevels: LEVELS_ROOM_SETTINGS_WITH_ROOM,
    displayName: (0, _languageHandler._td)("Room Colour"),
    default: {
      primary_color: null,
      // Hex string, eg: #000000
      secondary_color: null // Hex string, eg: #000000

    }
  },
  "notificationsEnabled": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: false,
    controller: new _NotificationControllers.NotificationsEnabledController()
  },
  "notificationSound": {
    supportedLevels: LEVELS_ROOM_OR_ACCOUNT,
    default: false
  },
  "notificationBodyEnabled": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: true,
    controller: new _NotificationControllers.NotificationBodyEnabledController()
  },
  "audioNotificationsEnabled": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: true,
    controller: new _NotificationControllers.AudioNotificationsEnabledController()
  },
  "enableWidgetScreenshots": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Enable widget screenshots on supported widgets'),
    default: false
  },
  "PinnedEvents.isOpen": {
    supportedLevels: ['room-device'],
    default: false
  },
  "promptBeforeInviteUnknownUsers": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Prompt before sending invites to potentially invalid matrix IDs'),
    default: true
  },
  "showDeveloperTools": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)('Show developer tools'),
    default: false
  },
  "widgetOpenIDPermissions": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: {
      allow: [],
      deny: []
    }
  },
  "RoomList.orderAlphabetically": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Order rooms by name"),
    default: false
  },
  "RoomList.orderByImportance": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Show rooms with unread notifications first"),
    default: true
  },
  "breadcrumbs": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Show shortcuts to recently viewed rooms above the room list"),
    default: true
  },
  "showHiddenEventsInTimeline": {
    displayName: (0, _languageHandler._td)("Show hidden events in timeline"),
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: false
  },
  "lowBandwidth": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    displayName: (0, _languageHandler._td)('Low bandwidth mode'),
    default: false,
    controller: new _ReloadOnChangeController.default()
  },
  "fallbackICEServerAllowed": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    displayName: (0, _languageHandler._td)("Allow fallback call assist server turn.matrix.org when your homeserver " + "does not offer one (your IP address would be shared during a call)"),
    // This is a tri-state value, where `null` means "prompt the user".
    default: null
  },
  "sendReadReceipts": {
    supportedLevels: LEVELS_ROOM_SETTINGS,
    displayName: (0, _languageHandler._td)("Send read receipts for messages (requires compatible homeserver to disable)"),
    default: true
  },
  "showImages": {
    supportedLevels: LEVELS_ACCOUNT_SETTINGS,
    displayName: (0, _languageHandler._td)("Show previews/thumbnails for images"),
    default: true
  },
  "showRightPanelInRoom": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: false
  },
  "showRightPanelInGroup": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: false
  },
  "lastRightPanelPhaseForRoom": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo
  },
  "lastRightPanelPhaseForGroup": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    default: _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList
  },
  "enableEventIndexing": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    displayName: (0, _languageHandler._td)("Enable message search in encrypted rooms"),
    default: true
  },
  "keepSecretStoragePassphraseForSession": {
    supportedLevels: ['device', 'config'],
    displayName: (0, _languageHandler._td)("Keep recovery passphrase in memory for this session"),
    default: false
  },
  "crawlerSleepTime": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    displayName: (0, _languageHandler._td)("How fast should messages be downloaded."),
    default: 3000
  },
  "showCallButtonsInComposer": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS_WITH_CONFIG,
    default: true
  },
  "e2ee.manuallyVerifyAllSessions": {
    supportedLevels: LEVELS_DEVICE_ONLY_SETTINGS,
    displayName: (0, _languageHandler._td)("Manually verify all remote sessions"),
    default: false,
    controller: new _PushToMatrixClientController.default(_matrixJsSdk.MatrixClient.prototype.setCryptoTrustCrossSignedDevices, true)
  }
};
exports.SETTINGS = SETTINGS;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXR0aW5ncy9TZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJMRVZFTFNfUk9PTV9TRVRUSU5HUyIsIkxFVkVMU19ST09NX09SX0FDQ09VTlQiLCJMRVZFTFNfUk9PTV9TRVRUSU5HU19XSVRIX1JPT00iLCJMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyIsIkxFVkVMU19GRUFUVVJFIiwiTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTIiwiTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHIiwiU0VUVElOR1MiLCJpc0ZlYXR1cmUiLCJkaXNwbGF5TmFtZSIsInN1cHBvcnRlZExldmVscyIsImRlZmF1bHQiLCJjb250cm9sbGVyIiwiQ3VzdG9tU3RhdHVzQ29udHJvbGxlciIsImludmVydGVkU2V0dGluZ05hbWUiLCJUaGVtZUNvbnRyb2xsZXIiLCJzdXBwb3J0ZWRMZXZlbHNBcmVPcmRlcmVkIiwicHJpbWFyeV9jb2xvciIsInNlY29uZGFyeV9jb2xvciIsIk5vdGlmaWNhdGlvbnNFbmFibGVkQ29udHJvbGxlciIsIk5vdGlmaWNhdGlvbkJvZHlFbmFibGVkQ29udHJvbGxlciIsIkF1ZGlvTm90aWZpY2F0aW9uc0VuYWJsZWRDb250cm9sbGVyIiwiYWxsb3ciLCJkZW55IiwiUmVsb2FkT25DaGFuZ2VDb250cm9sbGVyIiwiUklHSFRfUEFORUxfUEhBU0VTIiwiUm9vbU1lbWJlckluZm8iLCJHcm91cE1lbWJlckxpc3QiLCJQdXNoVG9NYXRyaXhDbGllbnRDb250cm9sbGVyIiwiTWF0cml4Q2xpZW50IiwicHJvdG90eXBlIiwic2V0Q3J5cHRvVHJ1c3RDcm9zc1NpZ25lZERldmljZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFFQTs7QUFDQTs7QUFLQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE5QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0NBO0FBQ0EsTUFBTUEsb0JBQW9CLEdBQUcsQ0FBQyxRQUFELEVB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QUgyQixHQTFjckI7QUErY3BCLHNCQUFvQjtBQUNoQkQsSUFBQUEsZUFBZSxFQUFFTCwyQkFERDtBQUVoQkksSUFBQUEsV0FBVyxFQUFFLDBCQUFJLHlDQUFKLENBRkc7QUFHaEJFLElBQUFBLE9BQU8sRUFBRTtBQUhPLEdBL2NBO0FBb2RwQiwrQkFBNkI7QUFDekJELElBQUFBLGVBQWUsRUFBRUosdUNBRFE7QUFFekJLLElBQUFBLE9BQU8sRUFBRTtBQUZnQixHQXBkVDtBQXdkcEIsb0NBQWtDO0FBQzlCRCxJQUFBQSxlQUFlLEVBQUVMLDJCQURhO0FBRTlCSSxJQUFBQSxXQUFXLEVBQUUsMEJBQUkscUNBQUosQ0FGaUI7QUFHOUJFLElBQUFBLE9BQU8sRUFBRSxLQUhxQjtBQUk5QkMsSUFBQUEsVUFBVSxFQUFFLElBQUlnQixxQ0FBSixDQUNSQywwQkFBYUMsU0FBYixDQUF1QkMsZ0NBRGYsRUFDaUQsSUFEakQ7QUFKa0I7QUF4ZGQsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVHJhdmlzIFJhbHN0b25cbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkLlxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge01hdHJpeENsaWVudH0gZnJvbSAnbWF0cml4LWpzLXNkayc7XG5cbmltcG9ydCB7X3RkfSBmcm9tICcuLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtcbiAgICBBdWRpb05vdGlmaWNhdGlvbnNFbmFibGVkQ29udHJvbGxlcixcbiAgICBOb3RpZmljYXRpb25Cb2R5RW5hYmxlZENvbnRyb2xsZXIsXG4gICAgTm90aWZpY2F0aW9uc0VuYWJsZWRDb250cm9sbGVyLFxufSBmcm9tIFwiLi9jb250cm9sbGVycy9Ob3RpZmljYXRpb25Db250cm9sbGVyc1wiO1xuaW1wb3J0IEN1c3RvbVN0YXR1c0NvbnRyb2xsZXIgZnJvbSBcIi4vY29udHJvbGxlcnMvQ3VzdG9tU3RhdHVzQ29udHJvbGxlclwiO1xuaW1wb3J0IFRoZW1lQ29udHJvbGxlciBmcm9tICcuL2NvbnRyb2xsZXJzL1RoZW1lQ29udHJvbGxlcic7XG5pbXBvcnQgUHVzaFRvTWF0cml4Q2xpZW50Q29udHJvbGxlciBmcm9tICcuL2NvbnRyb2xsZXJzL1B1c2hUb01hdHJpeENsaWVudENvbnRyb2xsZXInO1xuaW1wb3J0IFJlbG9hZE9uQ2hhbmdlQ29udHJvbGxlciBmcm9tIFwiLi9jb250cm9sbGVycy9SZWxvYWRPbkNoYW5nZUNvbnRyb2xsZXJcIjtcbmltcG9ydCB7UklHSFRfUEFORUxfUEhBU0VTfSBmcm9tIFwiLi4vc3RvcmVzL1JpZ2h0UGFuZWxTdG9yZVBoYXNlc1wiO1xuXG4vLyBUaGVzZSBhcmUganVzdCBhIGJ1bmNoIG9mIGhlbHBlciBhcnJheXMgdG8gYXZvaWQgY29weS9wYXN0aW5nIGEgYnVuY2ggb2YgdGltZXNcbmNvbnN0IExFVkVMU19ST09NX1NFVFRJTkdTID0gWydkZXZpY2UnLCAncm9vbS1kZXZpY2UnLCAncm9vbS1hY2NvdW50JywgJ2FjY291bnQnLCAnY29uZmlnJ107XG5jb25zdCBMRVZFTFNfUk9PTV9PUl9BQ0NPVU5UID0gWydyb29tLWFjY291bnQnLCAnYWNjb3VudCddO1xuY29uc3QgTEVWRUxTX1JPT01fU0VUVElOR1NfV0lUSF9ST09NID0gWydkZXZpY2UnLCAncm9vbS1kZXZpY2UnLCAncm9vbS1hY2NvdW50JywgJ2FjY291bnQnLCAnY29uZmlnJywgJ3Jvb20nXTtcbmNvbnN0IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTID0gWydkZXZpY2UnLCAnYWNjb3VudCcsICdjb25maWcnXTtcbmNvbnN0IExFVkVMU19GRUFUVVJFID0gWydkZXZpY2UnLCAnY29uZmlnJ107XG5jb25zdCBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MgPSBbJ2RldmljZSddO1xuY29uc3QgTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHID0gWydkZXZpY2UnLCAnY29uZmlnJ107XG5cbmV4cG9ydCBjb25zdCBTRVRUSU5HUyA9IHtcbiAgICAvLyBFWEFNUExFIFNFVFRJTkc6XG4gICAgLy8gXCJteS1zZXR0aW5nXCI6IHtcbiAgICAvLyAgICAgLy8gTXVzdCBiZSBzZXQgdG8gdHJ1ZSBmb3IgZmVhdHVyZXMuIERlZmF1bHQgaXMgJ2ZhbHNlJy5cbiAgICAvLyAgICAgaXNGZWF0dXJlOiBmYWxzZSxcbiAgICAvL1xuICAgIC8vICAgICAvLyBEaXNwbGF5IG5hbWVzIGFyZSBzdHJvbmdseSByZWNvbW1lbmRlZCBmb3IgY2xhcml0eS5cbiAgICAvLyAgICAgZGlzcGxheU5hbWU6IF90ZChcIkNvb2wgTmFtZVwiKSxcbiAgICAvL1xuICAgIC8vICAgICAvLyBEaXNwbGF5IG5hbWUgY2FuIGFsc28gYmUgYW4gb2JqZWN0IGZvciBkaWZmZXJlbnQgbGV2ZWxzLlxuICAgIC8vICAgICAvL2Rpc3BsYXlOYW1lOiB7XG4gICAgLy8gICAgIC8vICAgIFwiZGV2aWNlXCI6IF90ZChcIk5hbWUgZm9yIHdoZW4gdGhlIHNldHRpbmcgaXMgdXNlZCBhdCAnZGV2aWNlJ1wiKSxcbiAgICAvLyAgICAgLy8gICAgXCJyb29tXCI6IF90ZChcIk5hbWUgZm9yIHdoZW4gdGhlIHNldHRpbmcgaXMgdXNlZCBhdCAncm9vbSdcIiksXG4gICAgLy8gICAgIC8vICAgIFwiZGVmYXVsdFwiOiBfdGQoXCJUaGUgbmFtZSBmb3IgYWxsIG90aGVyIGxldmVsc1wiKSxcbiAgICAvLyAgICAgLy99XG4gICAgLy9cbiAgICAvLyAgICAgLy8gVGhlIHN1cHBvcnRlZCBsZXZlbHMgYXJlIHJlcXVpcmVkLiBQcmVmZXJhYmx5LCB1c2UgdGhlIHByZXNldCBhcnJheXNcbiAgICAvLyAgICAgLy8gYXQgdGhlIHRvcCBvZiB0aGlzIGZpbGUgdG8gZGVmaW5lIHRoaXMgcmF0aGVyIHRoYW4gYSBjdXN0b20gYXJyYXkuXG4gICAgLy8gICAgIHN1cHBvcnRlZExldmVsczogW1xuICAgIC8vICAgICAgICAgLy8gVGhlIG9yZGVyIGRvZXMgbm90IG1hdHRlci5cbiAgICAvL1xuICAgIC8vICAgICAgICAgXCJkZXZpY2VcIiwgICAgICAgIC8vIEFmZmVjdHMgdGhlIGN1cnJlbnQgZGV2aWNlIG9ubHlcbiAgICAvLyAgICAgICAgIFwicm9vbS1kZXZpY2VcIiwgICAvLyBBZmZlY3RzIHRoZSBjdXJyZW50IHJvb20gb24gdGhlIGN1cnJlbnQgZGV2aWNlXG4gICAgLy8gICAgICAgICBcInJvb20tYWNjb3VudFwiLCAgLy8gQWZmZWN0cyB0aGUgY3VycmVudCByb29tIGZvciB0aGUgY3VycmVudCBhY2NvdW50XG4gICAgLy8gICAgICAgICBcImFjY291bnRcIiwgICAgICAgLy8gQWZmZWN0cyB0aGUgY3VycmVudCBhY2NvdW50XG4gICAgLy8gICAgICAgICBcInJvb21cIiwgICAgICAgICAgLy8gQWZmZWN0cyB0aGUgY3VycmVudCByb29tIChjb250cm9sbGVkIGJ5IHJvb20gYWRtaW5zKVxuICAgIC8vICAgICAgICAgXCJjb25maWdcIiwgICAgICAgIC8vIEFmZmVjdHMgdGhlIGN1cnJlbnQgYXBwbGljYXRpb25cbiAgICAvL1xuICAgIC8vICAgICAgICAgLy8gXCJkZWZhdWx0XCIgaXMgYWx3YXlzIHN1cHBvcnRlZCBhbmQgZG9lcyBub3QgZ2V0IGxpc3RlZCBoZXJlLlxuICAgIC8vICAgICBdLFxuICAgIC8vXG4gICAgLy8gICAgIC8vIFJlcXVpcmVkLiBDYW4gYmUgYW55IGRhdGEgdHlwZS4gVGhlIHZhbHVlIHNwZWNpZmllZCBoZXJlIHNob3VsZCBtYXRjaFxuICAgIC8vICAgICAvLyB0aGUgZGF0YSBiZWluZyBzdG9yZWQgKGllOiBpZiBhIGJvb2xlYW4gaXMgdXNlZCwgdGhlIHNldHRpbmcgc2hvdWxkXG4gICAgLy8gICAgIC8vIHJlcHJlc2VudCBhIGJvb2xlYW4pLlxuICAgIC8vICAgICBkZWZhdWx0OiB7XG4gICAgLy8gICAgICAgICB5b3VyOiBcInZhbHVlXCIsXG4gICAgLy8gICAgIH0sXG4gICAgLy9cbiAgICAvLyAgICAgLy8gT3B0aW9uYWwgc2V0dGluZ3MgY29udHJvbGxlci4gU2VlIFNldHRpbmdzQ29udHJvbGxlciBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAvLyAgICAgY29udHJvbGxlcjogbmV3IE15U2V0dGluZ0NvbnRyb2xsZXIoKSxcbiAgICAvL1xuICAgIC8vICAgICAvLyBPcHRpb25hbCBmbGFnIHRvIG1ha2Ugc3VwcG9ydGVkTGV2ZWxzIGJlIHJlc3BlY3RlZCBhcyB0aGUgb3JkZXIgdG8gaGFuZGxlXG4gICAgLy8gICAgIC8vIHNldHRpbmdzLiBUaGUgZmlyc3QgZWxlbWVudCBpcyB0cmVhdGVkIGFzIFwibW9zdCBwcmVmZXJyZWRcIi4gVGhlIFwiZGVmYXVsdFwiXG4gICAgLy8gICAgIC8vIGxldmVsIGlzIGFsd2F5cyBhcHBlbmRlZCB0byB0aGUgZW5kLlxuICAgIC8vICAgICBzdXBwb3J0ZWRMZXZlbHNBcmVPcmRlcmVkOiBmYWxzZSxcbiAgICAvL1xuICAgIC8vICAgICAvLyBPcHRpb25hbCB2YWx1ZSB0byBpbnZlcnQgYSBib29sZWFuIHNldHRpbmcncyB2YWx1ZS4gVGhlIHN0cmluZyBnaXZlbiB3aWxsXG4gICAgLy8gICAgIC8vIGJlIHJlYWQgYXMgdGhlIHNldHRpbmcncyBJRCBpbnN0ZWFkIG9mIHRoZSBvbmUgcHJvdmlkZWQgYXMgdGhlIGtleSBmb3IgdGhlXG4gICAgLy8gICAgIC8vIHNldHRpbmcgZGVmaW5pdGlvbi4gQnkgc2V0dGluZyB0aGlzLCB0aGUgcmV0dXJuZWQgdmFsdWUgd2lsbCBhdXRvbWF0aWNhbGx5XG4gICAgLy8gICAgIC8vIGJlIGludmVydGVkLCBleGNlcHQgZm9yIHdoZW4gdGhlIGRlZmF1bHQgdmFsdWUgaXMgcmV0dXJuZWQuIEludmVyc2lvbiB3aWxsXG4gICAgLy8gICAgIC8vIG9jY3VyIGFmdGVyIHRoZSBjb250cm9sbGVyIGlzIGFza2VkIGZvciBhbiBvdmVycmlkZS4gVGhpcyBzaG91bGQgYmUgdXNlZCBieVxuICAgIC8vICAgICAvLyBoaXN0b3JpY2FsIHNldHRpbmdzIHdoaWNoIHdlIGRvbid0IHdhbnQgZXhpc3RpbmcgdXNlcidzIHZhbHVlcyBiZSB3aXBlZC4gRG9cbiAgICAvLyAgICAgLy8gbm90IHVzZSB0aGlzIGZvciBuZXcgc2V0dGluZ3MuXG4gICAgLy8gICAgIGludmVydGVkU2V0dGluZ05hbWU6IFwibXktbmVnYXRpdmUtc2V0dGluZ1wiLFxuICAgIC8vIH0sXG4gICAgXCJmZWF0dXJlX3Bpbm5pbmdcIjoge1xuICAgICAgICBpc0ZlYXR1cmU6IHRydWUsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJNZXNzYWdlIFBpbm5pbmdcIiksXG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0ZFQVRVUkUsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJmZWF0dXJlX2N1c3RvbV9zdGF0dXNcIjoge1xuICAgICAgICBpc0ZlYXR1cmU6IHRydWUsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJDdXN0b20gdXNlciBzdGF0dXMgbWVzc2FnZXNcIiksXG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0ZFQVRVUkUsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICBjb250cm9sbGVyOiBuZXcgQ3VzdG9tU3RhdHVzQ29udHJvbGxlcigpLFxuICAgIH0sXG4gICAgXCJmZWF0dXJlX2N1c3RvbV90YWdzXCI6IHtcbiAgICAgICAgaXNGZWF0dXJlOiB0cnVlLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiR3JvdXAgJiBmaWx0ZXIgcm9vbXMgYnkgY3VzdG9tIHRhZ3MgKHJlZnJlc2ggdG8gYXBwbHkgY2hhbmdlcylcIiksXG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0ZFQVRVUkUsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJmZWF0dXJlX3N0YXRlX2NvdW50ZXJzXCI6IHtcbiAgICAgICAgaXNGZWF0dXJlOiB0cnVlLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiUmVuZGVyIHNpbXBsZSBjb3VudGVycyBpbiByb29tIGhlYWRlclwiKSxcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfRkVBVFVSRSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcImZlYXR1cmVfbWFueV9pbnRlZ3JhdGlvbl9tYW5hZ2Vyc1wiOiB7XG4gICAgICAgIGlzRmVhdHVyZTogdHJ1ZSxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZChcIk11bHRpcGxlIGludGVncmF0aW9uIG1hbmFnZXJzXCIpLFxuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19GRUFUVVJFLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiZmVhdHVyZV9tam9sbmlyXCI6IHtcbiAgICAgICAgaXNGZWF0dXJlOiB0cnVlLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiVHJ5IG91dCBuZXcgd2F5cyB0byBpZ25vcmUgcGVvcGxlIChleHBlcmltZW50YWwpXCIpLFxuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19GRUFUVVJFLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiZmVhdHVyZV9jdXN0b21fdGhlbWVzXCI6IHtcbiAgICAgICAgaXNGZWF0dXJlOiB0cnVlLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiU3VwcG9ydCBhZGRpbmcgY3VzdG9tIHRoZW1lc1wiKSxcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfRkVBVFVSRSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcIm1qb2xuaXJSb29tc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogWydhY2NvdW50J10sXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgIH0sXG4gICAgXCJtam9sbmlyUGVyc29uYWxSb29tXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBbJ2FjY291bnQnXSxcbiAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICB9LFxuICAgIFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCI6IHtcbiAgICAgICAgLy8gWFhYOiBXZSBzaG91bGRuJ3QgYmUgdXNpbmcgdGhlIGZlYXR1cmUgcHJlZml4IGZvciBub24tZmVhdHVyZSBzZXR0aW5ncy4gVGhlcmUgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIC8vIGZvciB0aGlzIGNhc2UgdGhvdWdoIGFzIHdlJ3JlIGNvbnZlcnRpbmcgYSBmZWF0dXJlIHRvIGEgc2V0dGluZyBmb3IgYSB0ZW1wb3Jhcnkgc2FmZXR5IG5ldC5cbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZChcIkVuYWJsZSBjcm9zcy1zaWduaW5nIHRvIHZlcmlmeSBwZXItdXNlciBpbnN0ZWFkIG9mIHBlci1zZXNzaW9uXCIpLFxuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IFsnZGV2aWNlJywgJ2NvbmZpZyddLCAvLyB3ZSBzaG91bGRuJ3QgdXNlIExFVkVMU19GRUFUVVJFIGZvciBub24tZmVhdHVyZXMsIHNvIGNvcHkgaXQgaGVyZS5cbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwiZmVhdHVyZV9icmlkZ2Vfc3RhdGVcIjoge1xuICAgICAgICBpc0ZlYXR1cmU6IHRydWUsXG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0ZFQVRVUkUsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJTaG93IGluZm8gYWJvdXQgYnJpZGdlcyBpbiByb29tIHNldHRpbmdzXCIpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiTWVzc2FnZUNvbXBvc2VySW5wdXQuc3VnZ2VzdEVtb2ppXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnRW5hYmxlIEVtb2ppIHN1Z2dlc3Rpb25zIHdoaWxlIHR5cGluZycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnTWVzc2FnZUNvbXBvc2VySW5wdXQuZG9udFN1Z2dlc3RFbW9qaScsXG4gICAgfSxcbiAgICBcInVzZUNvbXBhY3RMYXlvdXRcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdVc2UgY29tcGFjdCB0aW1lbGluZSBsYXlvdXQnKSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcInNob3dSZWRhY3Rpb25zXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfUk9PTV9TRVRUSU5HU19XSVRIX1JPT00sXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ1Nob3cgYSBwbGFjZWhvbGRlciBmb3IgcmVtb3ZlZCBtZXNzYWdlcycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnaGlkZVJlZGFjdGlvbnMnLFxuICAgIH0sXG4gICAgXCJzaG93Sm9pbkxlYXZlc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX1JPT01fU0VUVElOR1NfV0lUSF9ST09NLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdTaG93IGpvaW4vbGVhdmUgbWVzc2FnZXMgKGludml0ZXMva2lja3MvYmFucyB1bmFmZmVjdGVkKScpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnaGlkZUpvaW5MZWF2ZXMnLFxuICAgIH0sXG4gICAgXCJzaG93QXZhdGFyQ2hhbmdlc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX1JPT01fU0VUVElOR1NfV0lUSF9ST09NLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdTaG93IGF2YXRhciBjaGFuZ2VzJyksXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIGludmVydGVkU2V0dGluZ05hbWU6ICdoaWRlQXZhdGFyQ2hhbmdlcycsXG4gICAgfSxcbiAgICBcInNob3dEaXNwbGF5bmFtZUNoYW5nZXNcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ST09NX1NFVFRJTkdTX1dJVEhfUk9PTSxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnU2hvdyBkaXNwbGF5IG5hbWUgY2hhbmdlcycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnaGlkZURpc3BsYXluYW1lQ2hhbmdlcycsXG4gICAgfSxcbiAgICBcInNob3dSZWFkUmVjZWlwdHNcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ST09NX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdTaG93IHJlYWQgcmVjZWlwdHMgc2VudCBieSBvdGhlciB1c2VycycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnaGlkZVJlYWRSZWNlaXB0cycsXG4gICAgfSxcbiAgICBcInNob3dUd2VsdmVIb3VyVGltZXN0YW1wc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ1Nob3cgdGltZXN0YW1wcyBpbiAxMiBob3VyIGZvcm1hdCAoZS5nLiAyOjMwcG0pJyksXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJhbHdheXNTaG93VGltZXN0YW1wc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ0Fsd2F5cyBzaG93IG1lc3NhZ2UgdGltZXN0YW1wcycpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiYXV0b3BsYXlHaWZzQW5kVmlkZW9zXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnQXV0b3BsYXkgR0lGcyBhbmQgdmlkZW9zJyksXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJhbHdheXNTaG93RW5jcnlwdGlvbkljb25zXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnQWx3YXlzIHNob3cgZW5jcnlwdGlvbiBpY29ucycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgXCJzaG93Um9vbVJlY292ZXJ5UmVtaW5kZXJcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdTaG93IGEgcmVtaW5kZXIgdG8gZW5hYmxlIFNlY3VyZSBNZXNzYWdlIFJlY292ZXJ5IGluIGVuY3J5cHRlZCByb29tcycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgXCJlbmFibGVTeW50YXhIaWdobGlnaHRMYW5ndWFnZURldGVjdGlvblwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ0VuYWJsZSBhdXRvbWF0aWMgbGFuZ3VhZ2UgZGV0ZWN0aW9uIGZvciBzeW50YXggaGlnaGxpZ2h0aW5nJyksXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJQaWxsLnNob3VsZFNob3dQaWxsQXZhdGFyXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnU2hvdyBhdmF0YXJzIGluIHVzZXIgYW5kIHJvb20gbWVudGlvbnMnKSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgaW52ZXJ0ZWRTZXR0aW5nTmFtZTogJ1BpbGwuc2hvdWxkSGlkZVBpbGxBdmF0YXInLFxuICAgIH0sXG4gICAgXCJUZXh0dWFsQm9keS5lbmFibGVCaWdFbW9qaVwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ0VuYWJsZSBiaWcgZW1vamkgaW4gY2hhdCcpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnVGV4dHVhbEJvZHkuZGlzYWJsZUJpZ0Vtb2ppJyxcbiAgICB9LFxuICAgIFwiTWVzc2FnZUNvbXBvc2VySW5wdXQuaXNSaWNoVGV4dEVuYWJsZWRcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiTWVzc2FnZUNvbXBvc2VyLnNob3dGb3JtYXR0aW5nXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcInNlbmRUeXBpbmdOb3RpZmljYXRpb25zXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZChcIlNlbmQgdHlwaW5nIG5vdGlmaWNhdGlvbnNcIiksXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIGludmVydGVkU2V0dGluZ05hbWU6ICdkb250U2VuZFR5cGluZ05vdGlmaWNhdGlvbnMnLFxuICAgIH0sXG4gICAgXCJzaG93VHlwaW5nTm90aWZpY2F0aW9uc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJTaG93IHR5cGluZyBub3RpZmljYXRpb25zXCIpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgXCJNZXNzYWdlQ29tcG9zZXJJbnB1dC5hdXRvUmVwbGFjZUVtb2ppXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnQXV0b21hdGljYWxseSByZXBsYWNlIHBsYWluIHRleHQgRW1vamknKSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcIlZpZGVvVmlldy5mbGlwVmlkZW9Ib3Jpem9udGFsbHlcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdNaXJyb3IgbG9jYWwgdmlkZW8gZmVlZCcpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiVGFnUGFuZWwuZW5hYmxlVGFnUGFuZWxcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdFbmFibGUgQ29tbXVuaXR5IEZpbHRlciBQYW5lbCcpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnVGFnUGFuZWwuZGlzYWJsZVRhZ1BhbmVsJyxcbiAgICB9LFxuICAgIFwidGhlbWVcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkZWZhdWx0OiBcImxpZ2h0XCIsXG4gICAgICAgIGNvbnRyb2xsZXI6IG5ldyBUaGVtZUNvbnRyb2xsZXIoKSxcbiAgICB9LFxuICAgIFwiY3VzdG9tX3RoZW1lc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgIH0sXG4gICAgXCJ1c2Vfc3lzdGVtX3RoZW1lXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJNYXRjaCBzeXN0ZW0gdGhlbWVcIiksXG4gICAgfSxcbiAgICBcIndlYlJ0Y0FsbG93UGVlclRvUGVlclwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdBbGxvdyBQZWVyLXRvLVBlZXIgZm9yIDE6MSBjYWxscycpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBpbnZlcnRlZFNldHRpbmdOYW1lOiAnd2ViUnRjRm9yY2VUVVJOJyxcbiAgICB9LFxuICAgIFwid2VicnRjX2F1ZGlvb3V0cHV0XCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBcIndlYnJ0Y19hdWRpb2lucHV0XCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBcIndlYnJ0Y192aWRlb2lucHV0XCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBcImxhbmd1YWdlXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1NfV0lUSF9DT05GSUcsXG4gICAgICAgIGRlZmF1bHQ6IFwiZW5cIixcbiAgICB9LFxuICAgIFwiYnJlYWRjcnVtYl9yb29tc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogWydhY2NvdW50J10sXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgIH0sXG4gICAgXCJyb29tX2RpcmVjdG9yeV9zZXJ2ZXJzXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBbJ2FjY291bnQnXSxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgfSxcbiAgICBcImludGVncmF0aW9uUHJvdmlzaW9uaW5nXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBbJ2FjY291bnQnXSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwiYWxsb3dlZFdpZGdldHNcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IFsncm9vbS1hY2NvdW50J10sXG4gICAgICAgIGRlZmF1bHQ6IHt9LCAvLyBub25lIGFsbG93ZWRcbiAgICB9LFxuICAgIFwiYW5hbHl0aWNzT3B0SW5cIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HU19XSVRIX0NPTkZJRyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnU2VuZCBhbmFseXRpY3MgZGF0YScpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwic2hvd0Nvb2tpZUJhclwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgXCJhdXRvY29tcGxldGVEZWxheVwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHLFxuICAgICAgICBkZWZhdWx0OiAyMDAsXG4gICAgfSxcbiAgICBcInJlYWRNYXJrZXJJblZpZXdUaHJlc2hvbGRNc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHLFxuICAgICAgICBkZWZhdWx0OiAzMDAwLFxuICAgIH0sXG4gICAgXCJyZWFkTWFya2VyT3V0T2ZWaWV3VGhyZXNob2xkTXNcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HU19XSVRIX0NPTkZJRyxcbiAgICAgICAgZGVmYXVsdDogMzAwMDAsXG4gICAgfSxcbiAgICBcImJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzXCI6IHtcbiAgICAgICAgLy8gV2Ugc3BlY2lmaWNhbGx5IHdhbnQgdG8gaGF2ZSByb29tLWRldmljZSA+IGRldmljZSBzbyB0aGF0IHVzZXJzIG1heSBzZXQgYSBkZXZpY2UgZGVmYXVsdFxuICAgICAgICAvLyB3aXRoIGEgcGVyLXJvb20gb3ZlcnJpZGUuXG4gICAgICAgIHN1cHBvcnRlZExldmVsczogWydyb29tLWRldmljZScsICdkZXZpY2UnXSxcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzQXJlT3JkZXJlZDogdHJ1ZSxcbiAgICAgICAgZGlzcGxheU5hbWU6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBfdGQoJ05ldmVyIHNlbmQgZW5jcnlwdGVkIG1lc3NhZ2VzIHRvIHVudmVyaWZpZWQgc2Vzc2lvbnMgZnJvbSB0aGlzIHNlc3Npb24nKSxcbiAgICAgICAgICAgIFwicm9vbS1kZXZpY2VcIjogX3RkKCdOZXZlciBzZW5kIGVuY3J5cHRlZCBtZXNzYWdlcyB0byB1bnZlcmlmaWVkIHNlc3Npb25zIGluIHRoaXMgcm9vbSBmcm9tIHRoaXMgc2Vzc2lvbicpLFxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwidXJsUHJldmlld3NFbmFibGVkXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfUk9PTV9TRVRUSU5HU19XSVRIX1JPT00sXG4gICAgICAgIGRpc3BsYXlOYW1lOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogX3RkKCdFbmFibGUgaW5saW5lIFVSTCBwcmV2aWV3cyBieSBkZWZhdWx0JyksXG4gICAgICAgICAgICBcInJvb20tYWNjb3VudFwiOiBfdGQoXCJFbmFibGUgVVJMIHByZXZpZXdzIGZvciB0aGlzIHJvb20gKG9ubHkgYWZmZWN0cyB5b3UpXCIpLFxuICAgICAgICAgICAgXCJyb29tXCI6IF90ZChcIkVuYWJsZSBVUkwgcHJldmlld3MgYnkgZGVmYXVsdCBmb3IgcGFydGljaXBhbnRzIGluIHRoaXMgcm9vbVwiKSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwidXJsUHJldmlld3NFbmFibGVkX2UyZWVcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IFsncm9vbS1kZXZpY2UnLCAncm9vbS1hY2NvdW50J10sXG4gICAgICAgIGRpc3BsYXlOYW1lOiB7XG4gICAgICAgICAgICBcInJvb20tYWNjb3VudFwiOiBfdGQoXCJFbmFibGUgVVJMIHByZXZpZXdzIGZvciB0aGlzIHJvb20gKG9ubHkgYWZmZWN0cyB5b3UpXCIpLFxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwicm9vbUNvbG9yXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfUk9PTV9TRVRUSU5HU19XSVRIX1JPT00sXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJSb29tIENvbG91clwiKSxcbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgcHJpbWFyeV9jb2xvcjogbnVsbCwgLy8gSGV4IHN0cmluZywgZWc6ICMwMDAwMDBcbiAgICAgICAgICAgIHNlY29uZGFyeV9jb2xvcjogbnVsbCwgLy8gSGV4IHN0cmluZywgZWc6ICMwMDAwMDBcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIFwibm90aWZpY2F0aW9uc0VuYWJsZWRcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIGNvbnRyb2xsZXI6IG5ldyBOb3RpZmljYXRpb25zRW5hYmxlZENvbnRyb2xsZXIoKSxcbiAgICB9LFxuICAgIFwibm90aWZpY2F0aW9uU291bmRcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ST09NX09SX0FDQ09VTlQsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJub3RpZmljYXRpb25Cb2R5RW5hYmxlZFwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyOiBuZXcgTm90aWZpY2F0aW9uQm9keUVuYWJsZWRDb250cm9sbGVyKCksXG4gICAgfSxcbiAgICBcImF1ZGlvTm90aWZpY2F0aW9uc0VuYWJsZWRcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlcjogbmV3IEF1ZGlvTm90aWZpY2F0aW9uc0VuYWJsZWRDb250cm9sbGVyKCksXG4gICAgfSxcbiAgICBcImVuYWJsZVdpZGdldFNjcmVlbnNob3RzXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnRW5hYmxlIHdpZGdldCBzY3JlZW5zaG90cyBvbiBzdXBwb3J0ZWQgd2lkZ2V0cycpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiUGlubmVkRXZlbnRzLmlzT3BlblwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogWydyb29tLWRldmljZSddLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwicHJvbXB0QmVmb3JlSW52aXRlVW5rbm93blVzZXJzXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfQUNDT1VOVF9TRVRUSU5HUyxcbiAgICAgICAgZGlzcGxheU5hbWU6IF90ZCgnUHJvbXB0IGJlZm9yZSBzZW5kaW5nIGludml0ZXMgdG8gcG90ZW50aWFsbHkgaW52YWxpZCBtYXRyaXggSURzJyksXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgfSxcbiAgICBcInNob3dEZXZlbG9wZXJUb29sc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoJ1Nob3cgZGV2ZWxvcGVyIHRvb2xzJyksXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJ3aWRnZXRPcGVuSURQZXJtaXNzaW9uc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTLFxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBhbGxvdzogW10sXG4gICAgICAgICAgICBkZW55OiBbXSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIFwiUm9vbUxpc3Qub3JkZXJBbHBoYWJldGljYWxseVwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJPcmRlciByb29tcyBieSBuYW1lXCIpLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwiUm9vbUxpc3Qub3JkZXJCeUltcG9ydGFuY2VcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19BQ0NPVU5UX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiU2hvdyByb29tcyB3aXRoIHVucmVhZCBub3RpZmljYXRpb25zIGZpcnN0XCIpLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gICAgXCJicmVhZGNydW1ic1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJTaG93IHNob3J0Y3V0cyB0byByZWNlbnRseSB2aWV3ZWQgcm9vbXMgYWJvdmUgdGhlIHJvb20gbGlzdFwiKSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwic2hvd0hpZGRlbkV2ZW50c0luVGltZWxpbmVcIjoge1xuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiU2hvdyBoaWRkZW4gZXZlbnRzIGluIHRpbWVsaW5lXCIpLFxuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcImxvd0JhbmR3aWR0aFwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTX1dJVEhfQ09ORklHLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKCdMb3cgYmFuZHdpZHRoIG1vZGUnKSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIGNvbnRyb2xsZXI6IG5ldyBSZWxvYWRPbkNoYW5nZUNvbnRyb2xsZXIoKSxcbiAgICB9LFxuICAgIFwiZmFsbGJhY2tJQ0VTZXJ2ZXJBbGxvd2VkXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXG4gICAgICAgICAgICBcIkFsbG93IGZhbGxiYWNrIGNhbGwgYXNzaXN0IHNlcnZlciB0dXJuLm1hdHJpeC5vcmcgd2hlbiB5b3VyIGhvbWVzZXJ2ZXIgXCIgK1xuICAgICAgICAgICAgXCJkb2VzIG5vdCBvZmZlciBvbmUgKHlvdXIgSVAgYWRkcmVzcyB3b3VsZCBiZSBzaGFyZWQgZHVyaW5nIGEgY2FsbClcIixcbiAgICAgICAgKSxcbiAgICAgICAgLy8gVGhpcyBpcyBhIHRyaS1zdGF0ZSB2YWx1ZSwgd2hlcmUgYG51bGxgIG1lYW5zIFwicHJvbXB0IHRoZSB1c2VyXCIuXG4gICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBcInNlbmRSZWFkUmVjZWlwdHNcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ST09NX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFxuICAgICAgICAgICAgXCJTZW5kIHJlYWQgcmVjZWlwdHMgZm9yIG1lc3NhZ2VzIChyZXF1aXJlcyBjb21wYXRpYmxlIGhvbWVzZXJ2ZXIgdG8gZGlzYWJsZSlcIixcbiAgICAgICAgKSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwic2hvd0ltYWdlc1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0FDQ09VTlRfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJTaG93IHByZXZpZXdzL3RodW1ibmFpbHMgZm9yIGltYWdlc1wiKSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwic2hvd1JpZ2h0UGFuZWxJblJvb21cIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBcInNob3dSaWdodFBhbmVsSW5Hcm91cFwiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIFwibGFzdFJpZ2h0UGFuZWxQaGFzZUZvclJvb21cIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogUklHSFRfUEFORUxfUEhBU0VTLlJvb21NZW1iZXJJbmZvLFxuICAgIH0sXG4gICAgXCJsYXN0UmlnaHRQYW5lbFBoYXNlRm9yR3JvdXBcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HUyxcbiAgICAgICAgZGVmYXVsdDogUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwTWVtYmVyTGlzdCxcbiAgICB9LFxuICAgIFwiZW5hYmxlRXZlbnRJbmRleGluZ1wiOiB7XG4gICAgICAgIHN1cHBvcnRlZExldmVsczogTEVWRUxTX0RFVklDRV9PTkxZX1NFVFRJTkdTLFxuICAgICAgICBkaXNwbGF5TmFtZTogX3RkKFwiRW5hYmxlIG1lc3NhZ2Ugc2VhcmNoIGluIGVuY3J5cHRlZCByb29tc1wiKSxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwia2VlcFNlY3JldFN0b3JhZ2VQYXNzcGhyYXNlRm9yU2Vzc2lvblwiOiB7XG4gICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IFsnZGV2aWNlJywgJ2NvbmZpZyddLFxuICAgICAgICAgZGlzcGxheU5hbWU6IF90ZChcIktlZXAgcmVjb3ZlcnkgcGFzc3BocmFzZSBpbiBtZW1vcnkgZm9yIHRoaXMgc2Vzc2lvblwiKSxcbiAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXCJjcmF3bGVyU2xlZXBUaW1lXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJIb3cgZmFzdCBzaG91bGQgbWVzc2FnZXMgYmUgZG93bmxvYWRlZC5cIiksXG4gICAgICAgIGRlZmF1bHQ6IDMwMDAsXG4gICAgfSxcbiAgICBcInNob3dDYWxsQnV0dG9uc0luQ29tcG9zZXJcIjoge1xuICAgICAgICBzdXBwb3J0ZWRMZXZlbHM6IExFVkVMU19ERVZJQ0VfT05MWV9TRVRUSU5HU19XSVRIX0NPTkZJRyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB9LFxuICAgIFwiZTJlZS5tYW51YWxseVZlcmlmeUFsbFNlc3Npb25zXCI6IHtcbiAgICAgICAgc3VwcG9ydGVkTGV2ZWxzOiBMRVZFTFNfREVWSUNFX09OTFlfU0VUVElOR1MsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBfdGQoXCJNYW51YWxseSB2ZXJpZnkgYWxsIHJlbW90ZSBzZXNzaW9uc1wiKSxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIGNvbnRyb2xsZXI6IG5ldyBQdXNoVG9NYXRyaXhDbGllbnRDb250cm9sbGVyKFxuICAgICAgICAgICAgTWF0cml4Q2xpZW50LnByb3RvdHlwZS5zZXRDcnlwdG9UcnVzdENyb3NzU2lnbmVkRGV2aWNlcywgdHJ1ZSxcbiAgICAgICAgKSxcbiAgICB9LFxufTtcbiJdfQ==