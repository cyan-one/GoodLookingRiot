"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _PlatformPeg = _interopRequireDefault(require("./PlatformPeg"));

var _Modal = _interopRequireDefault(require("./Modal"));

var sdk = _interopRequireWildcard(require("./index"));

var _languageHandler = require("./languageHandler");

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _cryptodevices = require("./cryptodevices");

var _WidgetUtils = _interopRequireDefault(require("./utils/WidgetUtils"));

var _WidgetEchoStore = _interopRequireDefault(require("./stores/WidgetEchoStore"));

var _SettingsStore = _interopRequireWildcard(require("./settings/SettingsStore"));

var _NamingUtils = require("./utils/NamingUtils");

var _Jitsi = require("./widgets/Jitsi");

var _WidgetType = require("./widgets/WidgetType");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 New Vector Ltd
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

/*
 * Manages a list of all the currently active calls.
 *
 * This handler dispatches when voip calls are added/updated/removed from this list:
 * {
 *   action: 'call_state'
 *   room_id: <room ID of the call>
 * }
 *
 * To know the state of the call, this handler exposes a getter to
 * obtain the call for a room:
 *   var call = CallHandler.getCall(roomId)
 *   var state = call.call_state; // ringing|ringback|connected|ended|busy|stop_ringback|stop_ringing
 *
 * This handler listens for and handles the following actions:
 * {
 *   action: 'place_call',
 *   type: 'voice|video',
 *   room_id: <room that the place call button was pressed in>
 * }
 *
 * {
 *   action: 'incoming_call'
 *   call: MatrixCall
 * }
 *
 * {
 *   action: 'hangup'
 *   room_id: <room that the hangup button was pressed in>
 * }
 *
 * {
 *   action: 'answer'
 *   room_id: <room that the answer button was pressed in>
 * }
 */
global.mxCalls = {//room_id: MatrixCall
};
const calls = global.mxCalls;
let ConferenceHandler = null;
const audioPromises = {};

function play(audioId) {
  // TODO: Attach an invisible element for this instead
  // which listens?
  const audio = document.getElementById(audioId);

  if (audio) {
    const playAudio = async () => {
      try {
        // This still causes the chrome debugger to break on promise rejection if
        // the promise is rejected, even though we're catching the exception.
        await audio.play();
      } catch (e) {
        // This is usually because the user hasn't interacted with the document,
        // or chrome doesn't think so and is denying the request. Not sure what
        // we can really do here...
        // https://github.com/vector-im/riot-web/issues/7657
        console.log("Unable to play audio clip", e);
      }
    };

    if (audioPromises[audioId]) {
      audioPromises[audioId] = audioPromises[audioId].then(() => {
        audio.load();
        return playAudio();
      });
    } else {
      audioPromises[audioId] = playAudio();
    }
  }
}

function pause(audioId) {
  // TODO: Attach an invisible element for this instead
  // which listens?
  const audio = document.getElementById(audioId);

  if (audio) {
    if (audioPromises[audioId]) {
      audioPromises[audioId] = audioPromises[audioId].then(() => audio.pause());
    } else {
      // pause doesn't actually return a promise, but might as well do this for symmetry with play();
      audioPromises[audioId] = audio.pause();
    }
  }
}

function _reAttemptCall(call) {
  if (call.direction === 'outbound') {
    _dispatcher.default.dispatch({
      action: 'place_call',
      room_id: call.roomId,
      type: call.type
    });
  } else {
    call.answer();
  }
}

function _setCallListeners(call) {
  call.on("error", function (err) {
    console.error("Call error:", err);

    if (err.code === 'unknown_devices') {
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

      _Modal.default.createTrackedDialog('Call Failed', '', QuestionDialog, {
        title: (0, _languageHandler._t)('Call Failed'),
        description: (0, _languageHandler._t)("There are unknown sessions in this room: " + "if you proceed without verifying them, it will be " + "possible for someone to eavesdrop on your call."),
        button: (0, _languageHandler._t)('Review Sessions'),
        onFinished: function (confirmed) {
          if (confirmed) {
            const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(call.roomId);

            (0, _cryptodevices.showUnknownDeviceDialogForCalls)(_MatrixClientPeg.MatrixClientPeg.get(), room, () => {
              _reAttemptCall(call);
            }, call.direction === 'outbound' ? (0, _languageHandler._t)("Call Anyway") : (0, _languageHandler._t)("Answer Anyway"), call.direction === 'outbound' ? (0, _languageHandler._t)("Call") : (0, _languageHandler._t)("Answer"));
          }
        }
      });
    } else {
      if (_MatrixClientPeg.MatrixClientPeg.get().getTurnServers().length === 0 && _SettingsStore.default.getValue("fallbackICEServerAllowed") === null) {
        _showICEFallbackPrompt();

        return;
      }

      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Call Failed', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Call Failed'),
        description: err.message
      });
    }
  });
  call.on("hangup", function () {
    _setCallState(undefined, call.roomId, "ended");
  }); // map web rtc states to dummy UI state
  // ringing|ringback|connected|ended|busy|stop_ringback|stop_ringing

  call.on("state", function (newState, oldState) {
    if (newState === "ringing") {
      _setCallState(call, call.roomId, "ringing");

      pause("ringbackAudio");
    } else if (newState === "invite_sent") {
      _setCallState(call, call.roomId, "ringback");

      play("ringbackAudio");
    } else if (newState === "ended" && oldState === "connected") {
      _setCallState(undefined, call.roomId, "ended");

      pause("ringbackAudio");
      play("callendAudio");
    } else if (newState === "ended" && oldState === "invite_sent" && (call.hangupParty === "remote" || call.hangupParty === "local" && call.hangupReason === "invite_timeout")) {
      _setCallState(call, call.roomId, "busy");

      pause("ringbackAudio");
      play("busyAudio");
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Call Handler', 'Call Timeout', ErrorDialog, {
        title: (0, _languageHandler._t)('Call Timeout'),
        description: (0, _languageHandler._t)('The remote side failed to pick up') + '.'
      });
    } else if (oldState === "invite_sent") {
      _setCallState(call, call.roomId, "stop_ringback");

      pause("ringbackAudio");
    } else if (oldState === "ringing") {
      _setCallState(call, call.roomId, "stop_ringing");

      pause("ringbackAudio");
    } else if (newState === "connected") {
      _setCallState(call, call.roomId, "connected");

      pause("ringbackAudio");
    }
  });
}

function _setCallState(call, roomId, status) {
  console.log("Call state in ".concat(roomId, " changed to ").concat(status, " (").concat(call ? call.call_state : "-", ")"));
  calls[roomId] = call;

  if (status === "ringing") {
    play("ringAudio");
  } else if (call && call.call_state === "ringing") {
    pause("ringAudio");
  }

  if (call) {
    call.call_state = status;
  }

  _dispatcher.default.dispatch({
    action: 'call_state',
    room_id: roomId,
    state: status
  });
}

function _showICEFallbackPrompt() {
  const cli = _MatrixClientPeg.MatrixClientPeg.get();

  const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

  const code = sub => /*#__PURE__*/React.createElement("code", null, sub);

  _Modal.default.createTrackedDialog('No TURN servers', '', QuestionDialog, {
    title: (0, _languageHandler._t)("Call failed due to misconfigured server"),
    description: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)("Please ask the administrator of your homeserver " + "(<code>%(homeserverDomain)s</code>) to configure a TURN server in " + "order for calls to work reliably.", {
      homeserverDomain: cli.getDomain()
    }, {
      code
    })), /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)("Alternatively, you can try to use the public server at " + "<code>turn.matrix.org</code>, but this will not be as reliable, and " + "it will share your IP address with that server. You can also manage " + "this in Settings.", null, {
      code
    }))),
    button: (0, _languageHandler._t)('Try using turn.matrix.org'),
    cancelButton: (0, _languageHandler._t)('OK'),
    onFinished: allow => {
      _SettingsStore.default.setValue("fallbackICEServerAllowed", null, _SettingsStore.SettingLevel.DEVICE, allow);

      cli.setFallbackICEServerAllowed(allow);
    }
  }, null, true);
}

function _onAction(payload) {
  function placeCall(newCall) {
    _setCallListeners(newCall);

    if (payload.type === 'voice') {
      newCall.placeVoiceCall();
    } else if (payload.type === 'video') {
      newCall.placeVideoCall(payload.remote_element, payload.local_element);
    } else if (payload.type === 'screensharing') {
      const screenCapErrorString = _PlatformPeg.default.get().screenCaptureErrorString();

      if (screenCapErrorString) {
        _setCallState(undefined, newCall.roomId, "ended");

        console.log("Can't capture screen: " + screenCapErrorString);
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Call Handler', 'Unable to capture screen', ErrorDialog, {
          title: (0, _languageHandler._t)('Unable to capture screen'),
          description: screenCapErrorString
        });

        return;
      }

      newCall.placeScreenSharingCall(payload.remote_element, payload.local_element);
    } else {
      console.error("Unknown conf call type: %s", payload.type);
    }
  }

  switch (payload.action) {
    case 'place_call':
      {
        if (callHandler.getAnyActiveCall()) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Call Handler', 'Existing Call', ErrorDialog, {
            title: (0, _languageHandler._t)('Existing Call'),
            description: (0, _languageHandler._t)('You are already in a call.')
          });

          return; // don't allow >1 call to be placed.
        } // if the runtime env doesn't do VoIP, whine.


        if (!_MatrixClientPeg.MatrixClientPeg.get().supportsVoip()) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Call Handler', 'VoIP is unsupported', ErrorDialog, {
            title: (0, _languageHandler._t)('VoIP is unsupported'),
            description: (0, _languageHandler._t)('You cannot place VoIP calls in this browser.')
          });

          return;
        }

        const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(payload.room_id);

        if (!room) {
          console.error("Room %s does not exist.", payload.room_id);
          return;
        }

        const members = room.getJoinedMembers();

        if (members.length <= 1) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Call Handler', 'Cannot place call with self', ErrorDialog, {
            description: (0, _languageHandler._t)('You cannot place a call with yourself.')
          });

          return;
        } else if (members.length === 2) {
          console.info("Place %s call in %s", payload.type, payload.room_id);

          const call = _matrixJsSdk.default.createNewMatrixCall(_MatrixClientPeg.MatrixClientPeg.get(), payload.room_id);

          placeCall(call);
        } else {
          // > 2
          _dispatcher.default.dispatch({
            action: "place_conference_call",
            room_id: payload.room_id,
            type: payload.type,
            remote_element: payload.remote_element,
            local_element: payload.local_element
          });
        }
      }
      break;

    case 'place_conference_call':
      console.info("Place conference call in %s", payload.room_id);

      _startCallApp(payload.room_id, payload.type);

      break;

    case 'incoming_call':
      {
        if (callHandler.getAnyActiveCall()) {
          // ignore multiple incoming calls. in future, we may want a line-1/line-2 setup.
          // we avoid rejecting with "busy" in case the user wants to answer it on a different device.
          // in future we could signal a "local busy" as a warning to the caller.
          // see https://github.com/vector-im/vector-web/issues/1964
          return;
        } // if the runtime env doesn't do VoIP, stop here.


        if (!_MatrixClientPeg.MatrixClientPeg.get().supportsVoip()) {
          return;
        }

        const call = payload.call;

        _setCallListeners(call);

        _setCallState(call, call.roomId, "ringing");
      }
      break;

    case 'hangup':
      if (!calls[payload.room_id]) {
        return; // no call to hangup
      }

      calls[payload.room_id].hangup();

      _setCallState(null, payload.room_id, "ended");

      break;

    case 'answer':
      if (!calls[payload.room_id]) {
        return; // no call to answer
      }

      calls[payload.room_id].answer();

      _setCallState(calls[payload.room_id], payload.room_id, "connected");

      _dispatcher.default.dispatch({
        action: "view_room",
        room_id: payload.room_id
      });

      break;
  }
}

async function _startCallApp(roomId, type) {
  _dispatcher.default.dispatch({
    action: 'appsDrawer',
    show: true
  });

  const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId);

  const currentJitsiWidgets = _WidgetUtils.default.getRoomWidgetsOfType(room, _WidgetType.WidgetType.JITSI);

  if (_WidgetEchoStore.default.roomHasPendingWidgetsOfType(roomId, currentJitsiWidgets, _WidgetType.WidgetType.JITSI)) {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

    _Modal.default.createTrackedDialog('Call already in progress', '', ErrorDialog, {
      title: (0, _languageHandler._t)('Call in Progress'),
      description: (0, _languageHandler._t)('A call is currently being placed!')
    });

    return;
  }

  if (currentJitsiWidgets.length > 0) {
    console.warn("Refusing to start conference call widget in " + roomId + " a conference call widget is already present");
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

    _Modal.default.createTrackedDialog('Already have Jitsi Widget', '', ErrorDialog, {
      title: (0, _languageHandler._t)('Call in Progress'),
      description: (0, _languageHandler._t)('A call is already in progress!')
    });

    return;
  }

  const confId = "JitsiConference".concat((0, _NamingUtils.generateHumanReadableId)());

  const jitsiDomain = _Jitsi.Jitsi.getInstance().preferredDomain;

  let widgetUrl = _WidgetUtils.default.getLocalJitsiWrapperUrl(); // TODO: Remove URL hacks when the mobile clients eventually support v2 widgets


  const parsedUrl = new URL(widgetUrl);
  parsedUrl.search = ''; // set to empty string to make the URL class use searchParams instead

  parsedUrl.searchParams.set('confId', confId);
  widgetUrl = parsedUrl.toString();
  const widgetData = {
    conferenceId: confId,
    isAudioOnly: type === 'voice',
    domain: jitsiDomain
  };
  const widgetId = 'jitsi_' + _MatrixClientPeg.MatrixClientPeg.get().credentials.userId + '_' + Date.now();

  _WidgetUtils.default.setRoomWidget(roomId, widgetId, _WidgetType.WidgetType.JITSI, widgetUrl, 'Jitsi', widgetData).then(() => {
    console.log('Jitsi widget added');
  }).catch(e => {
    if (e.errcode === 'M_FORBIDDEN') {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Call Failed', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Permission Required'),
        description: (0, _languageHandler._t)("You do not have permission to start a conference call in this room")
      });
    }

    console.error(e);
  });
} // FIXME: Nasty way of making sure we only register
// with the dispatcher once


if (!global.mxCallHandler) {
  _dispatcher.default.register(_onAction); // add empty handlers for media actions, otherwise the media keys
  // end up causing the audio elements with our ring/ringback etc
  // audio clips in to play.


  if (navigator.mediaSession) {
    navigator.mediaSession.setActionHandler('play', function () {});
    navigator.mediaSession.setActionHandler('pause', function () {});
    navigator.mediaSession.setActionHandler('seekbackward', function () {});
    navigator.mediaSession.setActionHandler('seekforward', function () {});
    navigator.mediaSession.setActionHandler('previoustrack', function () {});
    navigator.mediaSession.setActionHandler('nexttrack', function () {});
  }
}

const callHandler = {
  getCallForRoom: function (roomId) {
    let call = callHandler.getCall(roomId);
    if (call) return call;

    if (ConferenceHandler) {
      call = ConferenceHandler.getConferenceCallForRoom(roomId);
    }

    if (call) return call;
    return null;
  },
  getCall: function (roomId) {
    return calls[roomId] || null;
  },
  getAnyActiveCall: function () {
    const roomsWithCalls = Object.keys(calls);

    for (let i = 0; i < roomsWithCalls.length; i++) {
      if (calls[roomsWithCalls[i]] && calls[roomsWithCalls[i]].call_state !== "ended") {
        return calls[roomsWithCalls[i]];
      }
    }

    return null;
  },

  /**
   * The conference handler is a module that deals with implementation-specific
   * multi-party calling implementations. Riot passes in its own which creates
   * a one-to-one call with a freeswitch conference bridge. As of July 2018,
   * the de-facto way of conference calling is a Jitsi widget, so this is
   * deprecated. It reamins here for two reasons:
   *  1. So Riot still supports joining existing freeswitch conference calls
   *     (but doesn't support creating them). After a transition period, we can
   *     remove support for joining them too.
   *  2. To hide the one-to-one rooms that old-style conferencing creates. This
   *     is much harder to remove: probably either we make Riot leave & forget these
   *     rooms after we remove support for joining freeswitch conferences, or we
   *     accept that random rooms with cryptic users will suddently appear for
   *     anyone who's ever used conference calling, or we are stuck with this
   *     code forever.
   *
   * @param {object} confHandler The conference handler object
   */
  setConferenceHandler: function (confHandler) {
    ConferenceHandler = confHandler;
  },
  getConferenceHandler: function () {
    return ConferenceHandler;
  }
}; // Only things in here which actually need to be global are the
// calls list (done separately) and making sure we only register
// with the dispatcher once (which uses this mechanism but checks
// separately). This could be tidied up.

if (global.mxCallHandler === undefined) {
  global.mxCallHandler = callHandler;
}

var _default = global.mxCallHandler;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9DYWxsSGFuZGxlci5qcyJdLCJuYW1lcyI6WyJnbG9iYWwiLCJteENhbGxzIiwiY2FsbHMiLCJDb25mZXJlbmNlSGFuZGxlciIsImF1ZGlvUHJvbWlzZXMiLCJwbGF5IiwiYXVkaW9JZCIsImF1ZGlvIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInBsYXlBdWRpbyIsImUiLCJjb25zb2xlIiwibG9nIiwidGhlbiIsImxvYWQiLCJwYXVzZSIsIl9yZUF0dGVtcHRDYWxsIiwiY2FsbCIsImRpcmVjdGlvbiIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwicm9vbV9pZCIsInJvb21JZCIsInR5cGUiLCJhbnN3ZXIiLCJfc2V0Q2FsbExpc3RlbmVycyIsIm9uIiwiZXJyIiwiZXJyb3IiLCJjb2RlIiwiUXVlc3Rpb25EaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiYnV0dG9uIiwib25GaW5pc2hlZCIsImNvbmZpcm1lZCIsInJvb20iLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRSb29tIiwiZ2V0VHVyblNlcnZlcnMiLCJsZW5ndGgiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJfc2hvd0lDRUZhbGxiYWNrUHJvbXB0IiwiRXJyb3JEaWFsb2ciLCJtZXNzYWdlIiwiX3NldENhbGxTdGF0ZSIsInVuZGVmaW5lZCIsIm5ld1N0YXRlIiwib2xkU3RhdGUiLCJoYW5ndXBQYXJ0eSIsImhhbmd1cFJlYXNvbiIsInN0YXR1cyIsImNhbGxfc3RhdGUiLCJzdGF0ZSIsImNsaSIsInN1YiIsImhvbWVzZXJ2ZXJEb21haW4iLCJnZXREb21haW4iLCJjYW5jZWxCdXR0b24iLCJhbGxvdyIsInNldFZhbHVlIiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwic2V0RmFsbGJhY2tJQ0VTZXJ2ZXJBbGxvd2VkIiwiX29uQWN0aW9uIiwicGF5bG9hZCIsInBsYWNlQ2FsbCIsIm5ld0NhbGwiLCJwbGFjZVZvaWNlQ2FsbCIsInBsYWNlVmlkZW9DYWxsIiwicmVtb3RlX2VsZW1lbnQiLCJsb2NhbF9lbGVtZW50Iiwic2NyZWVuQ2FwRXJyb3JTdHJpbmciLCJQbGF0Zm9ybVBlZyIsInNjcmVlbkNhcHR1cmVFcnJvclN0cmluZyIsInBsYWNlU2NyZWVuU2hhcmluZ0NhbGwiLCJjYWxsSGFuZGxlciIsImdldEFueUFjdGl2ZUNhbGwiLCJzdXBwb3J0c1ZvaXAiLCJtZW1iZXJzIiwiZ2V0Sm9pbmVkTWVtYmVycyIsImluZm8iLCJNYXRyaXgiLCJjcmVhdGVOZXdNYXRyaXhDYWxsIiwiX3N0YXJ0Q2FsbEFwcCIsImhhbmd1cCIsInNob3ciLCJjdXJyZW50Sml0c2lXaWRnZXRzIiwiV2lkZ2V0VXRpbHMiLCJnZXRSb29tV2lkZ2V0c09mVHlwZSIsIldpZGdldFR5cGUiLCJKSVRTSSIsIldpZGdldEVjaG9TdG9yZSIsInJvb21IYXNQZW5kaW5nV2lkZ2V0c09mVHlwZSIsIndhcm4iLCJjb25mSWQiLCJqaXRzaURvbWFpbiIsIkppdHNpIiwiZ2V0SW5zdGFuY2UiLCJwcmVmZXJyZWREb21haW4iLCJ3aWRnZXRVcmwiLCJnZXRMb2NhbEppdHNpV3JhcHBlclVybCIsInBhcnNlZFVybCIsIlVSTCIsInNlYXJjaCIsInNlYXJjaFBhcmFtcyIsInNldCIsInRvU3RyaW5nIiwid2lkZ2V0RGF0YSIsImNvbmZlcmVuY2VJZCIsImlzQXVkaW9Pbmx5IiwiZG9tYWluIiwid2lkZ2V0SWQiLCJjcmVkZW50aWFscyIsInVzZXJJZCIsIkRhdGUiLCJub3ciLCJzZXRSb29tV2lkZ2V0IiwiY2F0Y2giLCJlcnJjb2RlIiwibXhDYWxsSGFuZGxlciIsInJlZ2lzdGVyIiwibmF2aWdhdG9yIiwibWVkaWFTZXNzaW9uIiwic2V0QWN0aW9uSGFuZGxlciIsImdldENhbGxGb3JSb29tIiwiZ2V0Q2FsbCIsImdldENvbmZlcmVuY2VDYWxsRm9yUm9vbSIsInJvb21zV2l0aENhbGxzIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJzZXRDb25mZXJlbmNlSGFuZGxlciIsImNvbmZIYW5kbGVyIiwiZ2V0Q29uZmVyZW5jZUhhbmRsZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBdURBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXBFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvREFBLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixDQUNiO0FBRGEsQ0FBakI7QUFHQSxNQUFNQyxLQUFLLEdBQUdGLE1BQU0sQ0FBQ0MsT0FBckI7QUFDQSxJQUFJRSxpQkFBaUIsR0FBRyxJQUF4QjtBQUVBLE1BQU1DLGFBQWEsR0FBRyxFQUF0Qjs7QUFFQSxTQUFTQyxJQUFULENBQWNDLE9BQWQsRUFBdUI7QUFDbkI7QUFDQTtBQUNBLFFBQU1DLEtBQUssR0FBR0MsUUFBUSxDQUFDQyxjQUFULENBQXdCSCxPQUF4QixDQUFkOztBQUNBLE1BQUlDLEtBQUosRUFBVztBQUNQLFVBQU1HLFNBQVMsR0FBRyxZQUFZO0FBQzFCLFVBQUk7QUFDQTtBQUNBO0FBQ0EsY0FBTUgsS0FBSyxDQUFDRixJQUFOLEVBQU47QUFDSCxPQUpELENBSUUsT0FBT00sQ0FBUCxFQUFVO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksMkJBQVosRUFBeUNGLENBQXpDO0FBQ0g7QUFDSixLQVpEOztBQWFBLFFBQUlQLGFBQWEsQ0FBQ0UsT0FBRCxDQUFqQixFQUE0QjtBQUN4QkYsTUFBQUEsYUFBYSxDQUFDRSxPQUFELENBQWIsR0FBeUJGLGFBQWEsQ0FBQ0UsT0FBRCxDQUFiLENBQXVCUSxJQUF2QixDQUE0QixNQUFJO0FBQ3JEUCxRQUFBQSxLQUFLLENBQUNRLElBQU47QUFDQSxlQUFPTCxTQUFTLEVBQWhCO0FBQ0gsT0FId0IsQ0FB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OlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKlxuICogTWFuYWdlcyBhIGxpc3Qgb2YgYWxsIHRoZSBjdXJyZW50bHkgYWN0aXZlIGNhbGxzLlxuICpcbiAqIFRoaXMgaGFuZGxlciBkaXNwYXRjaGVzIHdoZW4gdm9pcCBjYWxscyBhcmUgYWRkZWQvdXBkYXRlZC9yZW1vdmVkIGZyb20gdGhpcyBsaXN0OlxuICoge1xuICogICBhY3Rpb246ICdjYWxsX3N0YXRlJ1xuICogICByb29tX2lkOiA8cm9vbSBJRCBvZiB0aGUgY2FsbD5cbiAqIH1cbiAqXG4gKiBUbyBrbm93IHRoZSBzdGF0ZSBvZiB0aGUgY2FsbCwgdGhpcyBoYW5kbGVyIGV4cG9zZXMgYSBnZXR0ZXIgdG9cbiAqIG9idGFpbiB0aGUgY2FsbCBmb3IgYSByb29tOlxuICogICB2YXIgY2FsbCA9IENhbGxIYW5kbGVyLmdldENhbGwocm9vbUlkKVxuICogICB2YXIgc3RhdGUgPSBjYWxsLmNhbGxfc3RhdGU7IC8vIHJpbmdpbmd8cmluZ2JhY2t8Y29ubmVjdGVkfGVuZGVkfGJ1c3l8c3RvcF9yaW5nYmFja3xzdG9wX3JpbmdpbmdcbiAqXG4gKiBUaGlzIGhhbmRsZXIgbGlzdGVucyBmb3IgYW5kIGhhbmRsZXMgdGhlIGZvbGxvd2luZyBhY3Rpb25zOlxuICoge1xuICogICBhY3Rpb246ICdwbGFjZV9jYWxsJyxcbiAqICAgdHlwZTogJ3ZvaWNlfHZpZGVvJyxcbiAqICAgcm9vbV9pZDogPHJvb20gdGhhdCB0aGUgcGxhY2UgY2FsbCBidXR0b24gd2FzIHByZXNzZWQgaW4+XG4gKiB9XG4gKlxuICoge1xuICogICBhY3Rpb246ICdpbmNvbWluZ19jYWxsJ1xuICogICBjYWxsOiBNYXRyaXhDYWxsXG4gKiB9XG4gKlxuICoge1xuICogICBhY3Rpb246ICdoYW5ndXAnXG4gKiAgIHJvb21faWQ6IDxyb29tIHRoYXQgdGhlIGhhbmd1cCBidXR0b24gd2FzIHByZXNzZWQgaW4+XG4gKiB9XG4gKlxuICoge1xuICogICBhY3Rpb246ICdhbnN3ZXInXG4gKiAgIHJvb21faWQ6IDxyb29tIHRoYXQgdGhlIGFuc3dlciBidXR0b24gd2FzIHByZXNzZWQgaW4+XG4gKiB9XG4gKi9cblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBQbGF0Zm9ybVBlZyBmcm9tICcuL1BsYXRmb3JtUGVnJztcbmltcG9ydCBNb2RhbCBmcm9tICcuL01vZGFsJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IE1hdHJpeCBmcm9tICdtYXRyaXgtanMtc2RrJztcbmltcG9ydCBkaXMgZnJvbSAnLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IHsgc2hvd1Vua25vd25EZXZpY2VEaWFsb2dGb3JDYWxscyB9IGZyb20gJy4vY3J5cHRvZGV2aWNlcyc7XG5pbXBvcnQgV2lkZ2V0VXRpbHMgZnJvbSAnLi91dGlscy9XaWRnZXRVdGlscyc7XG5pbXBvcnQgV2lkZ2V0RWNob1N0b3JlIGZyb20gJy4vc3RvcmVzL1dpZGdldEVjaG9TdG9yZSc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwgeyBTZXR0aW5nTGV2ZWwgfSBmcm9tICcuL3NldHRpbmdzL1NldHRpbmdzU3RvcmUnO1xuaW1wb3J0IHtnZW5lcmF0ZUh1bWFuUmVhZGFibGVJZH0gZnJvbSBcIi4vdXRpbHMvTmFtaW5nVXRpbHNcIjtcbmltcG9ydCB7Sml0c2l9IGZyb20gXCIuL3dpZGdldHMvSml0c2lcIjtcbmltcG9ydCB7V2lkZ2V0VHlwZX0gZnJvbSBcIi4vd2lkZ2V0cy9XaWRnZXRUeXBlXCI7XG5cbmdsb2JhbC5teENhbGxzID0ge1xuICAgIC8vcm9vbV9pZDogTWF0cml4Q2FsbFxufTtcbmNvbnN0IGNhbGxzID0gZ2xvYmFsLm14Q2FsbHM7XG5sZXQgQ29uZmVyZW5jZUhhbmRsZXIgPSBudWxsO1xuXG5jb25zdCBhdWRpb1Byb21pc2VzID0ge307XG5cbmZ1bmN0aW9uIHBsYXkoYXVkaW9JZCkge1xuICAgIC8vIFRPRE86IEF0dGFjaCBhbiBpbnZpc2libGUgZWxlbWVudCBmb3IgdGhpcyBpbnN0ZWFkXG4gICAgLy8gd2hpY2ggbGlzdGVucz9cbiAgICBjb25zdCBhdWRpbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGF1ZGlvSWQpO1xuICAgIGlmIChhdWRpbykge1xuICAgICAgICBjb25zdCBwbGF5QXVkaW8gPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgc3RpbGwgY2F1c2VzIHRoZSBjaHJvbWUgZGVidWdnZXIgdG8gYnJlYWsgb24gcHJvbWlzZSByZWplY3Rpb24gaWZcbiAgICAgICAgICAgICAgICAvLyB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCwgZXZlbiB0aG91Z2ggd2UncmUgY2F0Y2hpbmcgdGhlIGV4Y2VwdGlvbi5cbiAgICAgICAgICAgICAgICBhd2FpdCBhdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB1c3VhbGx5IGJlY2F1c2UgdGhlIHVzZXIgaGFzbid0IGludGVyYWN0ZWQgd2l0aCB0aGUgZG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgLy8gb3IgY2hyb21lIGRvZXNuJ3QgdGhpbmsgc28gYW5kIGlzIGRlbnlpbmcgdGhlIHJlcXVlc3QuIE5vdCBzdXJlIHdoYXRcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gcmVhbGx5IGRvIGhlcmUuLi5cbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy83NjU3XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbmFibGUgdG8gcGxheSBhdWRpbyBjbGlwXCIsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXVkaW9Qcm9taXNlc1thdWRpb0lkXSkge1xuICAgICAgICAgICAgYXVkaW9Qcm9taXNlc1thdWRpb0lkXSA9IGF1ZGlvUHJvbWlzZXNbYXVkaW9JZF0udGhlbigoKT0+e1xuICAgICAgICAgICAgICAgIGF1ZGlvLmxvYWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheUF1ZGlvKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF1ZGlvUHJvbWlzZXNbYXVkaW9JZF0gPSBwbGF5QXVkaW8oKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGF1c2UoYXVkaW9JZCkge1xuICAgIC8vIFRPRE86IEF0dGFjaCBhbiBpbnZpc2libGUgZWxlbWVudCBmb3IgdGhpcyBpbnN0ZWFkXG4gICAgLy8gd2hpY2ggbGlzdGVucz9cbiAgICBjb25zdCBhdWRpbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGF1ZGlvSWQpO1xuICAgIGlmIChhdWRpbykge1xuICAgICAgICBpZiAoYXVkaW9Qcm9taXNlc1thdWRpb0lkXSkge1xuICAgICAgICAgICAgYXVkaW9Qcm9taXNlc1thdWRpb0lkXSA9IGF1ZGlvUHJvbWlzZXNbYXVkaW9JZF0udGhlbigoKT0+YXVkaW8ucGF1c2UoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXVzZSBkb2Vzbid0IGFjdHVhbGx5IHJldHVybiBhIHByb21pc2UsIGJ1dCBtaWdodCBhcyB3ZWxsIGRvIHRoaXMgZm9yIHN5bW1ldHJ5IHdpdGggcGxheSgpO1xuICAgICAgICAgICAgYXVkaW9Qcm9taXNlc1thdWRpb0lkXSA9IGF1ZGlvLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9yZUF0dGVtcHRDYWxsKGNhbGwpIHtcbiAgICBpZiAoY2FsbC5kaXJlY3Rpb24gPT09ICdvdXRib3VuZCcpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3BsYWNlX2NhbGwnLFxuICAgICAgICAgICAgcm9vbV9pZDogY2FsbC5yb29tSWQsXG4gICAgICAgICAgICB0eXBlOiBjYWxsLnR5cGUsXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGwuYW5zd2VyKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfc2V0Q2FsbExpc3RlbmVycyhjYWxsKSB7XG4gICAgY2FsbC5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2FsbCBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgaWYgKGVyci5jb2RlID09PSAndW5rbm93bl9kZXZpY2VzJykge1xuICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcblxuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ2FsbCBGYWlsZWQnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0NhbGwgRmFpbGVkJyksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIGFyZSB1bmtub3duIHNlc3Npb25zIGluIHRoaXMgcm9vbTogXCIrXG4gICAgICAgICAgICAgICAgICAgIFwiaWYgeW91IHByb2NlZWQgd2l0aG91dCB2ZXJpZnlpbmcgdGhlbSwgaXQgd2lsbCBiZSBcIitcbiAgICAgICAgICAgICAgICAgICAgXCJwb3NzaWJsZSBmb3Igc29tZW9uZSB0byBlYXZlc2Ryb3Agb24geW91ciBjYWxsLlwiLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgYnV0dG9uOiBfdCgnUmV2aWV3IFNlc3Npb25zJyksXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogZnVuY3Rpb24oY29uZmlybWVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShjYWxsLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93VW5rbm93bkRldmljZURpYWxvZ0ZvckNhbGxzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb29tLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlQXR0ZW1wdENhbGwoY2FsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsLmRpcmVjdGlvbiA9PT0gJ291dGJvdW5kJyA/IF90KFwiQ2FsbCBBbnl3YXlcIikgOiBfdChcIkFuc3dlciBBbnl3YXlcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbC5kaXJlY3Rpb24gPT09ICdvdXRib3VuZCcgPyBfdChcIkNhbGxcIikgOiBfdChcIkFuc3dlclwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFR1cm5TZXJ2ZXJzKCkubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICAgICAgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZhbGxiYWNrSUNFU2VydmVyQWxsb3dlZFwiKSA9PT0gbnVsbFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgX3Nob3dJQ0VGYWxsYmFja1Byb21wdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NhbGwgRmFpbGVkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KCdDYWxsIEZhaWxlZCcpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2FsbC5vbihcImhhbmd1cFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3NldENhbGxTdGF0ZSh1bmRlZmluZWQsIGNhbGwucm9vbUlkLCBcImVuZGVkXCIpO1xuICAgIH0pO1xuICAgIC8vIG1hcCB3ZWIgcnRjIHN0YXRlcyB0byBkdW1teSBVSSBzdGF0ZVxuICAgIC8vIHJpbmdpbmd8cmluZ2JhY2t8Y29ubmVjdGVkfGVuZGVkfGJ1c3l8c3RvcF9yaW5nYmFja3xzdG9wX3JpbmdpbmdcbiAgICBjYWxsLm9uKFwic3RhdGVcIiwgZnVuY3Rpb24obmV3U3RhdGUsIG9sZFN0YXRlKSB7XG4gICAgICAgIGlmIChuZXdTdGF0ZSA9PT0gXCJyaW5naW5nXCIpIHtcbiAgICAgICAgICAgIF9zZXRDYWxsU3RhdGUoY2FsbCwgY2FsbC5yb29tSWQsIFwicmluZ2luZ1wiKTtcbiAgICAgICAgICAgIHBhdXNlKFwicmluZ2JhY2tBdWRpb1wiKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXdTdGF0ZSA9PT0gXCJpbnZpdGVfc2VudFwiKSB7XG4gICAgICAgICAgICBfc2V0Q2FsbFN0YXRlKGNhbGwsIGNhbGwucm9vbUlkLCBcInJpbmdiYWNrXCIpO1xuICAgICAgICAgICAgcGxheShcInJpbmdiYWNrQXVkaW9cIik7XG4gICAgICAgIH0gZWxzZSBpZiAobmV3U3RhdGUgPT09IFwiZW5kZWRcIiAmJiBvbGRTdGF0ZSA9PT0gXCJjb25uZWN0ZWRcIikge1xuICAgICAgICAgICAgX3NldENhbGxTdGF0ZSh1bmRlZmluZWQsIGNhbGwucm9vbUlkLCBcImVuZGVkXCIpO1xuICAgICAgICAgICAgcGF1c2UoXCJyaW5nYmFja0F1ZGlvXCIpO1xuICAgICAgICAgICAgcGxheShcImNhbGxlbmRBdWRpb1wiKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXdTdGF0ZSA9PT0gXCJlbmRlZFwiICYmIG9sZFN0YXRlID09PSBcImludml0ZV9zZW50XCIgJiZcbiAgICAgICAgICAgICAgICAoY2FsbC5oYW5ndXBQYXJ0eSA9PT0gXCJyZW1vdGVcIiB8fFxuICAgICAgICAgICAgICAgIChjYWxsLmhhbmd1cFBhcnR5ID09PSBcImxvY2FsXCIgJiYgY2FsbC5oYW5ndXBSZWFzb24gPT09IFwiaW52aXRlX3RpbWVvdXRcIilcbiAgICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICBfc2V0Q2FsbFN0YXRlKGNhbGwsIGNhbGwucm9vbUlkLCBcImJ1c3lcIik7XG4gICAgICAgICAgICBwYXVzZShcInJpbmdiYWNrQXVkaW9cIik7XG4gICAgICAgICAgICBwbGF5KFwiYnVzeUF1ZGlvXCIpO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NhbGwgSGFuZGxlcicsICdDYWxsIFRpbWVvdXQnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnQ2FsbCBUaW1lb3V0JyksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdUaGUgcmVtb3RlIHNpZGUgZmFpbGVkIHRvIHBpY2sgdXAnKSArICcuJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKG9sZFN0YXRlID09PSBcImludml0ZV9zZW50XCIpIHtcbiAgICAgICAgICAgIF9zZXRDYWxsU3RhdGUoY2FsbCwgY2FsbC5yb29tSWQsIFwic3RvcF9yaW5nYmFja1wiKTtcbiAgICAgICAgICAgIHBhdXNlKFwicmluZ2JhY2tBdWRpb1wiKTtcbiAgICAgICAgfSBlbHNlIGlmIChvbGRTdGF0ZSA9PT0gXCJyaW5naW5nXCIpIHtcbiAgICAgICAgICAgIF9zZXRDYWxsU3RhdGUoY2FsbCwgY2FsbC5yb29tSWQsIFwic3RvcF9yaW5naW5nXCIpO1xuICAgICAgICAgICAgcGF1c2UoXCJyaW5nYmFja0F1ZGlvXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKG5ld1N0YXRlID09PSBcImNvbm5lY3RlZFwiKSB7XG4gICAgICAgICAgICBfc2V0Q2FsbFN0YXRlKGNhbGwsIGNhbGwucm9vbUlkLCBcImNvbm5lY3RlZFwiKTtcbiAgICAgICAgICAgIHBhdXNlKFwicmluZ2JhY2tBdWRpb1wiKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfc2V0Q2FsbFN0YXRlKGNhbGwsIHJvb21JZCwgc3RhdHVzKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIGBDYWxsIHN0YXRlIGluICR7cm9vbUlkfSBjaGFuZ2VkIHRvICR7c3RhdHVzfSAoJHtjYWxsID8gY2FsbC5jYWxsX3N0YXRlIDogXCItXCJ9KWAsXG4gICAgKTtcbiAgICBjYWxsc1tyb29tSWRdID0gY2FsbDtcblxuICAgIGlmIChzdGF0dXMgPT09IFwicmluZ2luZ1wiKSB7XG4gICAgICAgIHBsYXkoXCJyaW5nQXVkaW9cIik7XG4gICAgfSBlbHNlIGlmIChjYWxsICYmIGNhbGwuY2FsbF9zdGF0ZSA9PT0gXCJyaW5naW5nXCIpIHtcbiAgICAgICAgcGF1c2UoXCJyaW5nQXVkaW9cIik7XG4gICAgfVxuXG4gICAgaWYgKGNhbGwpIHtcbiAgICAgICAgY2FsbC5jYWxsX3N0YXRlID0gc3RhdHVzO1xuICAgIH1cbiAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICBhY3Rpb246ICdjYWxsX3N0YXRlJyxcbiAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICBzdGF0ZTogc3RhdHVzLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfc2hvd0lDRUZhbGxiYWNrUHJvbXB0KCkge1xuICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgIGNvbnN0IGNvZGUgPSBzdWIgPT4gPGNvZGU+e3N1Yn08L2NvZGU+O1xuICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ05vIFRVUk4gc2VydmVycycsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICB0aXRsZTogX3QoXCJDYWxsIGZhaWxlZCBkdWUgdG8gbWlzY29uZmlndXJlZCBzZXJ2ZXJcIiksXG4gICAgICAgIGRlc2NyaXB0aW9uOiA8ZGl2PlxuICAgICAgICAgICAgPHA+e190KFxuICAgICAgICAgICAgICAgIFwiUGxlYXNlIGFzayB0aGUgYWRtaW5pc3RyYXRvciBvZiB5b3VyIGhvbWVzZXJ2ZXIgXCIgK1xuICAgICAgICAgICAgICAgIFwiKDxjb2RlPiUoaG9tZXNlcnZlckRvbWFpbilzPC9jb2RlPikgdG8gY29uZmlndXJlIGEgVFVSTiBzZXJ2ZXIgaW4gXCIgK1xuICAgICAgICAgICAgICAgIFwib3JkZXIgZm9yIGNhbGxzIHRvIHdvcmsgcmVsaWFibHkuXCIsXG4gICAgICAgICAgICAgICAgeyBob21lc2VydmVyRG9tYWluOiBjbGkuZ2V0RG9tYWluKCkgfSwgeyBjb2RlIH0sXG4gICAgICAgICAgICApfTwvcD5cbiAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICBcIkFsdGVybmF0aXZlbHksIHlvdSBjYW4gdHJ5IHRvIHVzZSB0aGUgcHVibGljIHNlcnZlciBhdCBcIiArXG4gICAgICAgICAgICAgICAgXCI8Y29kZT50dXJuLm1hdHJpeC5vcmc8L2NvZGU+LCBidXQgdGhpcyB3aWxsIG5vdCBiZSBhcyByZWxpYWJsZSwgYW5kIFwiICtcbiAgICAgICAgICAgICAgICBcIml0IHdpbGwgc2hhcmUgeW91ciBJUCBhZGRyZXNzIHdpdGggdGhhdCBzZXJ2ZXIuIFlvdSBjYW4gYWxzbyBtYW5hZ2UgXCIgK1xuICAgICAgICAgICAgICAgIFwidGhpcyBpbiBTZXR0aW5ncy5cIixcbiAgICAgICAgICAgICAgICBudWxsLCB7IGNvZGUgfSxcbiAgICAgICAgICAgICl9PC9wPlxuICAgICAgICA8L2Rpdj4sXG4gICAgICAgIGJ1dHRvbjogX3QoJ1RyeSB1c2luZyB0dXJuLm1hdHJpeC5vcmcnKSxcbiAgICAgICAgY2FuY2VsQnV0dG9uOiBfdCgnT0snKSxcbiAgICAgICAgb25GaW5pc2hlZDogKGFsbG93KSA9PiB7XG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFwiZmFsbGJhY2tJQ0VTZXJ2ZXJBbGxvd2VkXCIsIG51bGwsIFNldHRpbmdMZXZlbC5ERVZJQ0UsIGFsbG93KTtcbiAgICAgICAgICAgIGNsaS5zZXRGYWxsYmFja0lDRVNlcnZlckFsbG93ZWQoYWxsb3cpO1xuICAgICAgICB9LFxuICAgIH0sIG51bGwsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBfb25BY3Rpb24ocGF5bG9hZCkge1xuICAgIGZ1bmN0aW9uIHBsYWNlQ2FsbChuZXdDYWxsKSB7XG4gICAgICAgIF9zZXRDYWxsTGlzdGVuZXJzKG5ld0NhbGwpO1xuICAgICAgICBpZiAocGF5bG9hZC50eXBlID09PSAndm9pY2UnKSB7XG4gICAgICAgICAgICBuZXdDYWxsLnBsYWNlVm9pY2VDYWxsKCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGF5bG9hZC50eXBlID09PSAndmlkZW8nKSB7XG4gICAgICAgICAgICBuZXdDYWxsLnBsYWNlVmlkZW9DYWxsKFxuICAgICAgICAgICAgICAgIHBheWxvYWQucmVtb3RlX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgcGF5bG9hZC5sb2NhbF9lbGVtZW50LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXlsb2FkLnR5cGUgPT09ICdzY3JlZW5zaGFyaW5nJykge1xuICAgICAgICAgICAgY29uc3Qgc2NyZWVuQ2FwRXJyb3JTdHJpbmcgPSBQbGF0Zm9ybVBlZy5nZXQoKS5zY3JlZW5DYXB0dXJlRXJyb3JTdHJpbmcoKTtcbiAgICAgICAgICAgIGlmIChzY3JlZW5DYXBFcnJvclN0cmluZykge1xuICAgICAgICAgICAgICAgIF9zZXRDYWxsU3RhdGUodW5kZWZpbmVkLCBuZXdDYWxsLnJvb21JZCwgXCJlbmRlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNhbid0IGNhcHR1cmUgc2NyZWVuOiBcIiArIHNjcmVlbkNhcEVycm9yU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NhbGwgSGFuZGxlcicsICdVbmFibGUgdG8gY2FwdHVyZSBzY3JlZW4nLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ1VuYWJsZSB0byBjYXB0dXJlIHNjcmVlbicpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogc2NyZWVuQ2FwRXJyb3JTdHJpbmcsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3Q2FsbC5wbGFjZVNjcmVlblNoYXJpbmdDYWxsKFxuICAgICAgICAgICAgICAgIHBheWxvYWQucmVtb3RlX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgcGF5bG9hZC5sb2NhbF9lbGVtZW50LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmtub3duIGNvbmYgY2FsbCB0eXBlOiAlc1wiLCBwYXlsb2FkLnR5cGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICBjYXNlICdwbGFjZV9jYWxsJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbEhhbmRsZXIuZ2V0QW55QWN0aXZlQ2FsbCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NhbGwgSGFuZGxlcicsICdFeGlzdGluZyBDYWxsJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXhpc3RpbmcgQ2FsbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdZb3UgYXJlIGFscmVhZHkgaW4gYSBjYWxsLicpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCBhbGxvdyA+MSBjYWxsIHRvIGJlIHBsYWNlZC5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgcnVudGltZSBlbnYgZG9lc24ndCBkbyBWb0lQLCB3aGluZS5cbiAgICAgICAgICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5zdXBwb3J0c1ZvaXAoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdDYWxsIEhhbmRsZXInLCAnVm9JUCBpcyB1bnN1cHBvcnRlZCcsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ1ZvSVAgaXMgdW5zdXBwb3J0ZWQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdCgnWW91IGNhbm5vdCBwbGFjZSBWb0lQIGNhbGxzIGluIHRoaXMgYnJvd3Nlci4nKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20ocGF5bG9hZC5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJvb20gJXMgZG9lcyBub3QgZXhpc3QuXCIsIHBheWxvYWQucm9vbV9pZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtZW1iZXJzID0gcm9vbS5nZXRKb2luZWRNZW1iZXJzKCk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlcnMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ2FsbCBIYW5kbGVyJywgJ0Nhbm5vdCBwbGFjZSBjYWxsIHdpdGggc2VsZicsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1lvdSBjYW5ub3QgcGxhY2UgYSBjYWxsIHdpdGggeW91cnNlbGYuJyksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtZW1iZXJzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJQbGFjZSAlcyBjYWxsIGluICVzXCIsIHBheWxvYWQudHlwZSwgcGF5bG9hZC5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbCA9IE1hdHJpeC5jcmVhdGVOZXdNYXRyaXhDYWxsKE1hdHJpeENsaWVudFBlZy5nZXQoKSwgcGF5bG9hZC5yb29tX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VDYWxsKGNhbGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vID4gMlxuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcInBsYWNlX2NvbmZlcmVuY2VfY2FsbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogcGF5bG9hZC5yb29tX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcGF5bG9hZC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3RlX2VsZW1lbnQ6IHBheWxvYWQucmVtb3RlX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbF9lbGVtZW50OiBwYXlsb2FkLmxvY2FsX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwbGFjZV9jb25mZXJlbmNlX2NhbGwnOlxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiUGxhY2UgY29uZmVyZW5jZSBjYWxsIGluICVzXCIsIHBheWxvYWQucm9vbV9pZCk7XG4gICAgICAgICAgICBfc3RhcnRDYWxsQXBwKHBheWxvYWQucm9vbV9pZCwgcGF5bG9hZC50eXBlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdpbmNvbWluZ19jYWxsJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbEhhbmRsZXIuZ2V0QW55QWN0aXZlQ2FsbCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBtdWx0aXBsZSBpbmNvbWluZyBjYWxscy4gaW4gZnV0dXJlLCB3ZSBtYXkgd2FudCBhIGxpbmUtMS9saW5lLTIgc2V0dXAuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGF2b2lkIHJlamVjdGluZyB3aXRoIFwiYnVzeVwiIGluIGNhc2UgdGhlIHVzZXIgd2FudHMgdG8gYW5zd2VyIGl0IG9uIGEgZGlmZmVyZW50IGRldmljZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gZnV0dXJlIHdlIGNvdWxkIHNpZ25hbCBhIFwibG9jYWwgYnVzeVwiIGFzIGEgd2FybmluZyB0byB0aGUgY2FsbGVyLlxuICAgICAgICAgICAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS92ZWN0b3Itd2ViL2lzc3Vlcy8xOTY0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgcnVudGltZSBlbnYgZG9lc24ndCBkbyBWb0lQLCBzdG9wIGhlcmUuXG4gICAgICAgICAgICAgICAgaWYgKCFNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc3VwcG9ydHNWb2lwKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGwgPSBwYXlsb2FkLmNhbGw7XG4gICAgICAgICAgICAgICAgX3NldENhbGxMaXN0ZW5lcnMoY2FsbCk7XG4gICAgICAgICAgICAgICAgX3NldENhbGxTdGF0ZShjYWxsLCBjYWxsLnJvb21JZCwgXCJyaW5naW5nXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2hhbmd1cCc6XG4gICAgICAgICAgICBpZiAoIWNhbGxzW3BheWxvYWQucm9vbV9pZF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIG5vIGNhbGwgdG8gaGFuZ3VwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsc1twYXlsb2FkLnJvb21faWRdLmhhbmd1cCgpO1xuICAgICAgICAgICAgX3NldENhbGxTdGF0ZShudWxsLCBwYXlsb2FkLnJvb21faWQsIFwiZW5kZWRcIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYW5zd2VyJzpcbiAgICAgICAgICAgIGlmICghY2FsbHNbcGF5bG9hZC5yb29tX2lkXSkge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gbm8gY2FsbCB0byBhbnN3ZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxzW3BheWxvYWQucm9vbV9pZF0uYW5zd2VyKCk7XG4gICAgICAgICAgICBfc2V0Q2FsbFN0YXRlKGNhbGxzW3BheWxvYWQucm9vbV9pZF0sIHBheWxvYWQucm9vbV9pZCwgXCJjb25uZWN0ZWRcIik7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogXCJ2aWV3X3Jvb21cIixcbiAgICAgICAgICAgICAgICByb29tX2lkOiBwYXlsb2FkLnJvb21faWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gX3N0YXJ0Q2FsbEFwcChyb29tSWQsIHR5cGUpIHtcbiAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICBhY3Rpb246ICdhcHBzRHJhd2VyJyxcbiAgICAgICAgc2hvdzogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShyb29tSWQpO1xuICAgIGNvbnN0IGN1cnJlbnRKaXRzaVdpZGdldHMgPSBXaWRnZXRVdGlscy5nZXRSb29tV2lkZ2V0c09mVHlwZShyb29tLCBXaWRnZXRUeXBlLkpJVFNJKTtcblxuICAgIGlmIChXaWRnZXRFY2hvU3RvcmUucm9vbUhhc1BlbmRpbmdXaWRnZXRzT2ZUeXBlKHJvb21JZCwgY3VycmVudEppdHNpV2lkZ2V0cywgV2lkZ2V0VHlwZS5KSVRTSSkpIHtcbiAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcblxuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdDYWxsIGFscmVhZHkgaW4gcHJvZ3Jlc3MnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdCgnQ2FsbCBpbiBQcm9ncmVzcycpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdBIGNhbGwgaXMgY3VycmVudGx5IGJlaW5nIHBsYWNlZCEnKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudEppdHNpV2lkZ2V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgIFwiUmVmdXNpbmcgdG8gc3RhcnQgY29uZmVyZW5jZSBjYWxsIHdpZGdldCBpbiBcIiArIHJvb21JZCArXG4gICAgICAgICAgICBcIiBhIGNvbmZlcmVuY2UgY2FsbCB3aWRnZXQgaXMgYWxyZWFkeSBwcmVzZW50XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG5cbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQWxyZWFkeSBoYXZlIEppdHNpIFdpZGdldCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgdGl0bGU6IF90KCdDYWxsIGluIFByb2dyZXNzJyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0EgY2FsbCBpcyBhbHJlYWR5IGluIHByb2dyZXNzIScpLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZJZCA9IGBKaXRzaUNvbmZlcmVuY2Uke2dlbmVyYXRlSHVtYW5SZWFkYWJsZUlkKCl9YDtcbiAgICBjb25zdCBqaXRzaURvbWFpbiA9IEppdHNpLmdldEluc3RhbmNlKCkucHJlZmVycmVkRG9tYWluO1xuXG4gICAgbGV0IHdpZGdldFVybCA9IFdpZGdldFV0aWxzLmdldExvY2FsSml0c2lXcmFwcGVyVXJsKCk7XG5cbiAgICAvLyBUT0RPOiBSZW1vdmUgVVJMIGhhY2tzIHdoZW4gdGhlIG1vYmlsZSBjbGllbnRzIGV2ZW50dWFsbHkgc3VwcG9ydCB2MiB3aWRnZXRzXG4gICAgY29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTCh3aWRnZXRVcmwpO1xuICAgIHBhcnNlZFVybC5zZWFyY2ggPSAnJzsgLy8gc2V0IHRvIGVtcHR5IHN0cmluZyB0byBtYWtlIHRoZSBVUkwgY2xhc3MgdXNlIHNlYXJjaFBhcmFtcyBpbnN0ZWFkXG4gICAgcGFyc2VkVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2NvbmZJZCcsIGNvbmZJZCk7XG4gICAgd2lkZ2V0VXJsID0gcGFyc2VkVXJsLnRvU3RyaW5nKCk7XG5cbiAgICBjb25zdCB3aWRnZXREYXRhID0ge1xuICAgICAgICBjb25mZXJlbmNlSWQ6IGNvbmZJZCxcbiAgICAgICAgaXNBdWRpb09ubHk6IHR5cGUgPT09ICd2b2ljZScsXG4gICAgICAgIGRvbWFpbjogaml0c2lEb21haW4sXG4gICAgfTtcblxuICAgIGNvbnN0IHdpZGdldElkID0gKFxuICAgICAgICAnaml0c2lfJyArXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWQgK1xuICAgICAgICAnXycgK1xuICAgICAgICBEYXRlLm5vdygpXG4gICAgKTtcblxuICAgIFdpZGdldFV0aWxzLnNldFJvb21XaWRnZXQocm9vbUlkLCB3aWRnZXRJZCwgV2lkZ2V0VHlwZS5KSVRTSSwgd2lkZ2V0VXJsLCAnSml0c2knLCB3aWRnZXREYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ppdHNpIHdpZGdldCBhZGRlZCcpO1xuICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgIGlmIChlLmVycmNvZGUgPT09ICdNX0ZPUkJJRERFTicpIHtcbiAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG5cbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NhbGwgRmFpbGVkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KCdQZXJtaXNzaW9uIFJlcXVpcmVkJyksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiWW91IGRvIG5vdCBoYXZlIHBlcm1pc3Npb24gdG8gc3RhcnQgYSBjb25mZXJlbmNlIGNhbGwgaW4gdGhpcyByb29tXCIpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9KTtcbn1cblxuLy8gRklYTUU6IE5hc3R5IHdheSBvZiBtYWtpbmcgc3VyZSB3ZSBvbmx5IHJlZ2lzdGVyXG4vLyB3aXRoIHRoZSBkaXNwYXRjaGVyIG9uY2VcbmlmICghZ2xvYmFsLm14Q2FsbEhhbmRsZXIpIHtcbiAgICBkaXMucmVnaXN0ZXIoX29uQWN0aW9uKTtcbiAgICAvLyBhZGQgZW1wdHkgaGFuZGxlcnMgZm9yIG1lZGlhIGFjdGlvbnMsIG90aGVyd2lzZSB0aGUgbWVkaWEga2V5c1xuICAgIC8vIGVuZCB1cCBjYXVzaW5nIHRoZSBhdWRpbyBlbGVtZW50cyB3aXRoIG91ciByaW5nL3JpbmdiYWNrIGV0Y1xuICAgIC8vIGF1ZGlvIGNsaXBzIGluIHRvIHBsYXkuXG4gICAgaWYgKG5hdmlnYXRvci5tZWRpYVNlc3Npb24pIHtcbiAgICAgICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKCdwbGF5JywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcigncGF1c2UnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKCdzZWVrYmFja3dhcmQnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKCdzZWVrZm9yd2FyZCcsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoJ3ByZXZpb3VzdHJhY2snLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKCduZXh0dHJhY2snLCBmdW5jdGlvbigpIHt9KTtcbiAgICB9XG59XG5cbmNvbnN0IGNhbGxIYW5kbGVyID0ge1xuICAgIGdldENhbGxGb3JSb29tOiBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgbGV0IGNhbGwgPSBjYWxsSGFuZGxlci5nZXRDYWxsKHJvb21JZCk7XG4gICAgICAgIGlmIChjYWxsKSByZXR1cm4gY2FsbDtcblxuICAgICAgICBpZiAoQ29uZmVyZW5jZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIGNhbGwgPSBDb25mZXJlbmNlSGFuZGxlci5nZXRDb25mZXJlbmNlQ2FsbEZvclJvb20ocm9vbUlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbCkgcmV0dXJuIGNhbGw7XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIGdldENhbGw6IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICByZXR1cm4gY2FsbHNbcm9vbUlkXSB8fCBudWxsO1xuICAgIH0sXG5cbiAgICBnZXRBbnlBY3RpdmVDYWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgcm9vbXNXaXRoQ2FsbHMgPSBPYmplY3Qua2V5cyhjYWxscyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbXNXaXRoQ2FsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjYWxsc1tyb29tc1dpdGhDYWxsc1tpXV0gJiZcbiAgICAgICAgICAgICAgICAgICAgY2FsbHNbcm9vbXNXaXRoQ2FsbHNbaV1dLmNhbGxfc3RhdGUgIT09IFwiZW5kZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsc1tyb29tc1dpdGhDYWxsc1tpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBjb25mZXJlbmNlIGhhbmRsZXIgaXMgYSBtb2R1bGUgdGhhdCBkZWFscyB3aXRoIGltcGxlbWVudGF0aW9uLXNwZWNpZmljXG4gICAgICogbXVsdGktcGFydHkgY2FsbGluZyBpbXBsZW1lbnRhdGlvbnMuIFJpb3QgcGFzc2VzIGluIGl0cyBvd24gd2hpY2ggY3JlYXRlc1xuICAgICAqIGEgb25lLXRvLW9uZSBjYWxsIHdpdGggYSBmcmVlc3dpdGNoIGNvbmZlcmVuY2UgYnJpZGdlLiBBcyBvZiBKdWx5IDIwMTgsXG4gICAgICogdGhlIGRlLWZhY3RvIHdheSBvZiBjb25mZXJlbmNlIGNhbGxpbmcgaXMgYSBKaXRzaSB3aWRnZXQsIHNvIHRoaXMgaXNcbiAgICAgKiBkZXByZWNhdGVkLiBJdCByZWFtaW5zIGhlcmUgZm9yIHR3byByZWFzb25zOlxuICAgICAqICAxLiBTbyBSaW90IHN0aWxsIHN1cHBvcnRzIGpvaW5pbmcgZXhpc3RpbmcgZnJlZXN3aXRjaCBjb25mZXJlbmNlIGNhbGxzXG4gICAgICogICAgIChidXQgZG9lc24ndCBzdXBwb3J0IGNyZWF0aW5nIHRoZW0pLiBBZnRlciBhIHRyYW5zaXRpb24gcGVyaW9kLCB3ZSBjYW5cbiAgICAgKiAgICAgcmVtb3ZlIHN1cHBvcnQgZm9yIGpvaW5pbmcgdGhlbSB0b28uXG4gICAgICogIDIuIFRvIGhpZGUgdGhlIG9uZS10by1vbmUgcm9vbXMgdGhhdCBvbGQtc3R5bGUgY29uZmVyZW5jaW5nIGNyZWF0ZXMuIFRoaXNcbiAgICAgKiAgICAgaXMgbXVjaCBoYXJkZXIgdG8gcmVtb3ZlOiBwcm9iYWJseSBlaXRoZXIgd2UgbWFrZSBSaW90IGxlYXZlICYgZm9yZ2V0IHRoZXNlXG4gICAgICogICAgIHJvb21zIGFmdGVyIHdlIHJlbW92ZSBzdXBwb3J0IGZvciBqb2luaW5nIGZyZWVzd2l0Y2ggY29uZmVyZW5jZXMsIG9yIHdlXG4gICAgICogICAgIGFjY2VwdCB0aGF0IHJhbmRvbSByb29tcyB3aXRoIGNyeXB0aWMgdXNlcnMgd2lsbCBzdWRkZW50bHkgYXBwZWFyIGZvclxuICAgICAqICAgICBhbnlvbmUgd2hvJ3MgZXZlciB1c2VkIGNvbmZlcmVuY2UgY2FsbGluZywgb3Igd2UgYXJlIHN0dWNrIHdpdGggdGhpc1xuICAgICAqICAgICBjb2RlIGZvcmV2ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZkhhbmRsZXIgVGhlIGNvbmZlcmVuY2UgaGFuZGxlciBvYmplY3RcbiAgICAgKi9cbiAgICBzZXRDb25mZXJlbmNlSGFuZGxlcjogZnVuY3Rpb24oY29uZkhhbmRsZXIpIHtcbiAgICAgICAgQ29uZmVyZW5jZUhhbmRsZXIgPSBjb25mSGFuZGxlcjtcbiAgICB9LFxuXG4gICAgZ2V0Q29uZmVyZW5jZUhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQ29uZmVyZW5jZUhhbmRsZXI7XG4gICAgfSxcbn07XG4vLyBPbmx5IHRoaW5ncyBpbiBoZXJlIHdoaWNoIGFjdHVhbGx5IG5lZWQgdG8gYmUgZ2xvYmFsIGFyZSB0aGVcbi8vIGNhbGxzIGxpc3QgKGRvbmUgc2VwYXJhdGVseSkgYW5kIG1ha2luZyBzdXJlIHdlIG9ubHkgcmVnaXN0ZXJcbi8vIHdpdGggdGhlIGRpc3BhdGNoZXIgb25jZSAod2hpY2ggdXNlcyB0aGlzIG1lY2hhbmlzbSBidXQgY2hlY2tzXG4vLyBzZXBhcmF0ZWx5KS4gVGhpcyBjb3VsZCBiZSB0aWRpZWQgdXAuXG5pZiAoZ2xvYmFsLm14Q2FsbEhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgIGdsb2JhbC5teENhbGxIYW5kbGVyID0gY2FsbEhhbmRsZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGdsb2JhbC5teENhbGxIYW5kbGVyO1xuIl19