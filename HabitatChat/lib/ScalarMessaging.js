"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startListening = startListening;
exports.stopListening = stopListening;
exports.setOpenManagerUrl = setOpenManagerUrl;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _matrixJsSdk = require("matrix-js-sdk");

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _WidgetUtils = _interopRequireDefault(require("./utils/WidgetUtils"));

var _RoomViewStore = _interopRequireDefault(require("./stores/RoomViewStore"));

var _languageHandler = require("./languageHandler");

var _IntegrationManagers = require("./integrations/IntegrationManagers");

var _WidgetType = require("./widgets/WidgetType");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
// TODO: Generify the name of this and all components within - it's not just for scalar.

/*
Listens for incoming postMessage requests from the integrations UI URL. The following API is exposed:
{
    action: "invite" | "membership_state" | "bot_options" | "set_bot_options" | etc... ,
    room_id: $ROOM_ID,
    user_id: $USER_ID
    // additional request fields
}

The complete request object is returned to the caller with an additional "response" key like so:
{
    action: "invite" | "membership_state" | "bot_options" | "set_bot_options",
    room_id: $ROOM_ID,
    user_id: $USER_ID,
    // additional request fields
    response: { ... }
}

The "action" determines the format of the request and response. All actions can return an error response.
An error response is a "response" object which consists of a sole "error" key to indicate an error.
They look like:
{
    error: {
        message: "Unable to invite user into room.",
        _error: <Original Error Object>
    }
}
The "message" key should be a human-friendly string.

ACTIONS
=======
All actions can return an error response instead of the response outlined below.

invite
------
Invites a user into a room.

Request:
 - room_id is the room to invite the user into.
 - user_id is the user ID to invite.
 - No additional fields.
Response:
{
    success: true
}
Example:
{
    action: "invite",
    room_id: "!foo:bar",
    user_id: "@invitee:bar",
    response: {
        success: true
    }
}

set_bot_options
---------------
Set the m.room.bot.options state event for a bot user.

Request:
 - room_id is the room to send the state event into.
 - user_id is the user ID of the bot who you're setting options for.
 - "content" is an object consisting of the content you wish to set.
Response:
{
    success: true
}
Example:
{
    action: "set_bot_options",
    room_id: "!foo:bar",
    user_id: "@bot:bar",
    content: {
        default_option: "alpha"
    },
    response: {
        success: true
    }
}

get_membership_count
--------------------
Get the number of joined users in the room.

Request:
 - room_id is the room to get the count in.
Response:
78
Example:
{
    action: "get_membership_count",
    room_id: "!foo:bar",
    response: 78
}

can_send_event
--------------
Check if the client can send the given event into the given room. If the client
is unable to do this, an error response is returned instead of 'response: false'.

Request:
 - room_id is the room to do the check in.
 - event_type is the event type which will be sent.
 - is_state is true if the event to be sent is a state event.
Response:
true
Example:
{
    action: "can_send_event",
    is_state: false,
    event_type: "m.room.message",
    room_id: "!foo:bar",
    response: true
}

set_widget
----------
Set a new widget in the room. Clobbers based on the ID.

Request:
 - `room_id` (String) is the room to set the widget in.
 - `widget_id` (String) is the ID of the widget to add (or replace if it already exists).
   It can be an arbitrary UTF8 string and is purely for distinguishing between widgets.
 - `url` (String) is the URL that clients should load in an iframe to run the widget.
   All widgets must have a valid URL. If the URL is `null` (not `undefined`), the
   widget will be removed from the room.
 - `type` (String) is the type of widget, which is provided as a hint for matrix clients so they
   can configure/lay out the widget in different ways. All widgets must have a type.
 - `name` (String) is an optional human-readable string about the widget.
 - `data` (Object) is some optional data about the widget, and can contain arbitrary key/value pairs.
Response:
{
    success: true
}
Example:
{
    action: "set_widget",
    room_id: "!foo:bar",
    widget_id: "abc123",
    url: "http://widget.url",
    type: "example",
    response: {
        success: true
    }
}

get_widgets
-----------
Get a list of all widgets in the room. The response is an array
of state events.

Request:
 - `room_id` (String) is the room to get the widgets in.
Response:
[
    {
        // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
        type: "im.vector.modular.widgets",
        state_key: "wid1",
        content: {
            type: "grafana",
            url: "https://grafanaurl",
            name: "dashboard",
            data: {key: "val"}
        }
        room_id: “!foo:bar”,
        sender: "@alice:localhost"
    }
]
Example:
{
    action: "get_widgets",
    room_id: "!foo:bar",
    response: [
        {
            // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
            type: "im.vector.modular.widgets",
            state_key: "wid1",
            content: {
                type: "grafana",
                url: "https://grafanaurl",
                name: "dashboard",
                data: {key: "val"}
            }
            room_id: “!foo:bar”,
            sender: "@alice:localhost"
        }
    ]
}


membership_state AND bot_options
--------------------------------
Get the content of the "m.room.member" or "m.room.bot.options" state event respectively.

NB: Whilst this API is basically equivalent to getStateEvent, we specifically do not
    want external entities to be able to query any state event for any room, hence the
    restrictive API outlined here.

Request:
 - room_id is the room which has the state event.
 - user_id is the state_key parameter which in both cases is a user ID (the member or the bot).
 - No additional fields.
Response:
 - The event content. If there is no state event, the "response" key should be null.
Example:
{
    action: "membership_state",
    room_id: "!foo:bar",
    user_id: "@somemember:bar",
    response: {
        membership: "join",
        displayname: "Bob",
        avatar_url: null
    }
}
*/
function sendResponse(event, res) {
  const data = JSON.parse(JSON.stringify(event.data));
  data.response = res;
  event.source.postMessage(data, event.origin);
}

function sendError(event, msg, nestedError) {
  console.error("Action:" + event.data.action + " failed with message: " + msg);
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

function inviteUser(event, roomId, userId) {
  console.log("Received request to invite ".concat(userId, " into room ").concat(roomId));

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  const room = client.getRoom(roomId);

  if (room) {
    // if they are already invited we can resolve immediately.
    const member = room.getMember(userId);

    if (member && member.membership === "invite") {
      sendResponse(event, {
        success: true
      });
      return;
    }
  }

  client.invite(roomId, userId).then(function () {
    sendResponse(event, {
      success: true
    });
  }, function (err) {
    sendError(event, (0, _languageHandler._t)('You need to be able to invite users to do that.'), err);
  });
}

function setWidget(event, roomId) {
  const widgetId = event.data.widget_id;
  let widgetType = event.data.type;
  const widgetUrl = event.data.url;
  const widgetName = event.data.name; // optional

  const widgetData = event.data.data; // optional

  const userWidget = event.data.userWidget; // both adding/removing widgets need these checks

  if (!widgetId || widgetUrl === undefined) {
    sendError(event, (0, _languageHandler._t)("Unable to create widget."), new Error("Missing required widget fields."));
    return;
  }

  if (widgetUrl !== null) {
    // if url is null it is being deleted, don't need to check name/type/etc
    // check types of fields
    if (widgetName !== undefined && typeof widgetName !== 'string') {
      sendError(event, (0, _languageHandler._t)("Unable to create widget."), new Error("Optional field 'name' must be a string."));
      return;
    }

    if (widgetData !== undefined && !(widgetData instanceof Object)) {
      sendError(event, (0, _languageHandler._t)("Unable to create widget."), new Error("Optional field 'data' must be an Object."));
      return;
    }

    if (typeof widgetType !== 'string') {
      sendError(event, (0, _languageHandler._t)("Unable to create widget."), new Error("Field 'type' must be a string."));
      return;
    }

    if (typeof widgetUrl !== 'string') {
      sendError(event, (0, _languageHandler._t)("Unable to create widget."), new Error("Field 'url' must be a string or null."));
      return;
    }
  } // convert the widget type to a known widget type


  widgetType = _WidgetType.WidgetType.fromString(widgetType);

  if (userWidget) {
    _WidgetUtils.default.setUserWidget(widgetId, widgetType, widgetUrl, widgetName, widgetData).then(() => {
      sendResponse(event, {
        success: true
      });

      _dispatcher.default.dispatch({
        action: "user_widget_updated"
      });
    }).catch(e => {
      sendError(event, (0, _languageHandler._t)('Unable to create widget.'), e);
    });
  } else {
    // Room widget
    if (!roomId) {
      sendError(event, (0, _languageHandler._t)('Missing roomId.'), null);
    }

    _WidgetUtils.default.setRoomWidget(roomId, widgetId, widgetType, widgetUrl, widgetName, widgetData).then(() => {
      sendResponse(event, {
        success: true
      });
    }, err => {
      sendError(event, (0, _languageHandler._t)('Failed to send request.'), err);
    });
  }
}

function getWidgets(event, roomId) {
  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  let widgetStateEvents = [];

  if (roomId) {
    const room = client.getRoom(roomId);

    if (!room) {
      sendError(event, (0, _languageHandler._t)('This room is not recognised.'));
      return;
    } // XXX: This gets the raw event object (I think because we can't
    // send the MatrixEvent over postMessage?)


    widgetStateEvents = _WidgetUtils.default.getRoomWidgets(room).map(ev => ev.event);
  } // Add user widgets (not linked to a specific room)


  const userWidgets = _WidgetUtils.default.getUserWidgetsArray();

  widgetStateEvents = widgetStateEvents.concat(userWidgets);
  sendResponse(event, widgetStateEvents);
}

function getRoomEncState(event, roomId) {
  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  const room = client.getRoom(roomId);

  if (!room) {
    sendError(event, (0, _languageHandler._t)('This room is not recognised.'));
    return;
  }

  const roomIsEncrypted = _MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(roomId);

  sendResponse(event, roomIsEncrypted);
}

function setPlumbingState(event, roomId, status) {
  if (typeof status !== 'string') {
    throw new Error('Plumbing state status should be a string');
  }

  console.log("Received request to set plumbing state to status \"".concat(status, "\" in room ").concat(roomId));

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  client.sendStateEvent(roomId, "m.room.plumbing", {
    status: status
  }).then(() => {
    sendResponse(event, {
      success: true
    });
  }, err => {
    sendError(event, err.message ? err.message : (0, _languageHandler._t)('Failed to send request.'), err);
  });
}

function setBotOptions(event, roomId, userId) {
  console.log("Received request to set options for bot ".concat(userId, " in room ").concat(roomId));

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  client.sendStateEvent(roomId, "m.room.bot.options", event.data.content, "_" + userId).then(() => {
    sendResponse(event, {
      success: true
    });
  }, err => {
    sendError(event, err.message ? err.message : (0, _languageHandler._t)('Failed to send request.'), err);
  });
}

function setBotPower(event, roomId, userId, level) {
  if (!(Number.isInteger(level) && level >= 0)) {
    sendError(event, (0, _languageHandler._t)('Power level must be positive integer.'));
    return;
  }

  console.log("Received request to set power level to ".concat(level, " for bot ").concat(userId, " in room ").concat(roomId, "."));

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  client.getStateEvent(roomId, "m.room.power_levels", "").then(powerLevels => {
    const powerEvent = new _matrixJsSdk.MatrixEvent({
      type: "m.room.power_levels",
      content: powerLevels
    });
    client.setPowerLevel(roomId, userId, level, powerEvent).then(() => {
      sendResponse(event, {
        success: true
      });
    }, err => {
      sendError(event, err.message ? err.message : (0, _languageHandler._t)('Failed to send request.'), err);
    });
  });
}

function getMembershipState(event, roomId, userId) {
  console.log("membership_state of ".concat(userId, " in room ").concat(roomId, " requested."));
  returnStateEvent(event, roomId, "m.room.member", userId);
}

function getJoinRules(event, roomId) {
  console.log("join_rules of ".concat(roomId, " requested."));
  returnStateEvent(event, roomId, "m.room.join_rules", "");
}

function botOptions(event, roomId, userId) {
  console.log("bot_options of ".concat(userId, " in room ").concat(roomId, " requested."));
  returnStateEvent(event, roomId, "m.room.bot.options", "_" + userId);
}

function getMembershipCount(event, roomId) {
  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  const room = client.getRoom(roomId);

  if (!room) {
    sendError(event, (0, _languageHandler._t)('This room is not recognised.'));
    return;
  }

  const count = room.getJoinedMemberCount();
  sendResponse(event, count);
}

function canSendEvent(event, roomId) {
  const evType = "" + event.data.event_type; // force stringify

  const isState = Boolean(event.data.is_state);

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  const room = client.getRoom(roomId);

  if (!room) {
    sendError(event, (0, _languageHandler._t)('This room is not recognised.'));
    return;
  }

  if (room.getMyMembership() !== "join") {
    sendError(event, (0, _languageHandler._t)('You are not in this room.'));
    return;
  }

  const me = client.credentials.userId;
  let canSend = false;

  if (isState) {
    canSend = room.currentState.maySendStateEvent(evType, me);
  } else {
    canSend = room.currentState.maySendEvent(evType, me);
  }

  if (!canSend) {
    sendError(event, (0, _languageHandler._t)('You do not have permission to do that in this room.'));
    return;
  }

  sendResponse(event, true);
}

function returnStateEvent(event, roomId, eventType, stateKey) {
  const client = _MatrixClientPeg.MatrixClientPeg.get();

  if (!client) {
    sendError(event, (0, _languageHandler._t)('You need to be logged in.'));
    return;
  }

  const room = client.getRoom(roomId);

  if (!room) {
    sendError(event, (0, _languageHandler._t)('This room is not recognised.'));
    return;
  }

  const stateEvent = room.currentState.getStateEvents(eventType, stateKey);

  if (!stateEvent) {
    sendResponse(event, null);
    return;
  }

  sendResponse(event, stateEvent.getContent());
}

const onMessage = function (event) {
  if (!event.origin) {
    // stupid chrome
    event.origin = event.originalEvent.origin;
  } // Check that the integrations UI URL starts with the origin of the event
  // This means the URL could contain a path (like /develop) and still be used
  // to validate event origins, which do not specify paths.
  // (See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)


  let configUrl;

  try {
    if (!openManagerUrl) openManagerUrl = _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager().uiUrl;
    configUrl = new URL(openManagerUrl);
  } catch (e) {
    // No integrations UI URL, ignore silently.
    return;
  }

  let eventOriginUrl;

  try {
    eventOriginUrl = new URL(event.origin);
  } catch (e) {
    return;
  } // TODO -- Scalar postMessage API should be namespaced with event.data.api field
  // Fix following "if" statement to respond only to specific API messages.


  if (configUrl.origin !== eventOriginUrl.origin || !event.data.action || event.data.api // Ignore messages with specific API set
  ) {
      // don't log this - debugging APIs and browser add-ons like to spam
      // postMessage which floods the log otherwise
      return;
    }

  if (event.data.action === "close_scalar") {
    _dispatcher.default.dispatch({
      action: "close_scalar"
    });

    sendResponse(event, null);
    return;
  }

  const roomId = event.data.room_id;
  const userId = event.data.user_id;

  if (!roomId) {
    // These APIs don't require roomId
    // Get and set user widgets (not associated with a specific room)
    // If roomId is specified, it must be validated, so room-based widgets agreed
    // handled further down.
    if (event.data.action === "get_widgets") {
      getWidgets(event, null);
      return;
    } else if (event.data.action === "set_widget") {
      setWidget(event, null);
      return;
    } else {
      sendError(event, (0, _languageHandler._t)('Missing room_id in request'));
      return;
    }
  }

  if (roomId !== _RoomViewStore.default.getRoomId()) {
    sendError(event, (0, _languageHandler._t)('Room %(roomId)s not visible', {
      roomId: roomId
    }));
    return;
  } // Get and set room-based widgets


  if (event.data.action === "get_widgets") {
    getWidgets(event, roomId);
    return;
  } else if (event.data.action === "set_widget") {
    setWidget(event, roomId);
    return;
  } // These APIs don't require userId


  if (event.data.action === "join_rules_state") {
    getJoinRules(event, roomId);
    return;
  } else if (event.data.action === "set_plumbing_state") {
    setPlumbingState(event, roomId, event.data.status);
    return;
  } else if (event.data.action === "get_membership_count") {
    getMembershipCount(event, roomId);
    return;
  } else if (event.data.action === "get_room_enc_state") {
    getRoomEncState(event, roomId);
    return;
  } else if (event.data.action === "can_send_event") {
    canSendEvent(event, roomId);
    return;
  }

  if (!userId) {
    sendError(event, (0, _languageHandler._t)('Missing user_id in request'));
    return;
  }

  switch (event.data.action) {
    case "membership_state":
      getMembershipState(event, roomId, userId);
      break;

    case "invite":
      inviteUser(event, roomId, userId);
      break;

    case "bot_options":
      botOptions(event, roomId, userId);
      break;

    case "set_bot_options":
      setBotOptions(event, roomId, userId);
      break;

    case "set_bot_power":
      setBotPower(event, roomId, userId, event.data.level);
      break;

    default:
      console.warn("Unhandled postMessage event with action '" + event.data.action + "'");
      break;
  }
};

let listenerCount = 0;
let openManagerUrl = null;

function startListening() {
  if (listenerCount === 0) {
    window.addEventListener("message", onMessage, false);
  }

  listenerCount += 1;
}

function stopListening() {
  listenerCount -= 1;

  if (listenerCount === 0) {
    window.removeEventListener("message", onMessage);
  }

  if (listenerCount < 0) {
    // Make an error so we get a stack trace
    const e = new Error("ScalarMessaging: mismatched startListening / stopListening detected." + " Negative count");
    console.error(e);
  }
}

function setOpenManagerUrl(url) {
  openManagerUrl = url;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TY2FsYXJNZXNzYWdpbmcuanMiXSwibmFtZXMiOlsic2VuZFJlc3BvbnNlIiwiZXZlbnQiLCJyZXMiLCJkYXRhIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwicmVzcG9uc2UiLCJzb3VyY2UiLCJwb3N0TWVzc2FnZSIsIm9yaWdpbiIsInNlbmRFcnJvciIsIm1zZyIsIm5lc3RlZEVycm9yIiwiY29uc29sZSIsImVycm9yIiwiYWN0aW9uIiwibWVzc2FnZSIsIl9lcnJvciIsImludml0ZVVzZXIiLCJyb29tSWQiLCJ1c2VySWQiLCJsb2ciLCJjbGllbnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJyb29tIiwiZ2V0Um9vbSIsIm1lbWJlciIsImdldE1lbWJlciIsIm1lbWJlcnNoaXAiLCJzdWNjZXNzIiwiaW52aXRlIiwidGhlbiIsImVyciIsInNldFdpZGdldCIsIndpZGdldElkIiwid2lkZ2V0X2lkIiwid2lkZ2V0VHlwZSIsInR5cGUiLCJ3aWRnZXRVcmwiLCJ1cmwiLCJ3aWRnZXROYW1lIiwibmFtZSIsIndpZGdldERhdGEiLCJ1c2VyV2lkZ2V0IiwidW5kZWZpbmVkIiwiRXJyb3IiLCJPYmplY3QiLCJXaWRnZXRUeXBlIiwiZnJvbVN0cmluZyIsIldpZGdldFV0aWxzIiwic2V0VXNlcldpZGdldCIsImRpcyIsImRpc3BhdGNoIiwiY2F0Y2giLCJlIiwic2V0Um9vbVdpZGdldCIsImdldFdpZGdldHMiLCJ3aWRnZXRTdGF0ZUV2ZW50cyIsImdldFJvb21XaWRnZXRzIiwibWFwIiwiZXYiLCJ1c2VyV2lkZ2V0cyIsImdldFVzZXJXaWRnZXRzQXJyYXkiLCJjb25jYXQiLCJnZXRSb29tRW5jU3RhdGUiLCJyb29tSXNFbmNyeXB0ZWQiLCJpc1Jvb21FbmNyeXB0ZWQiLCJzZXRQbHVtYmluZ1N0YXRlIiwic3RhdHVzIiwic2VuZFN0YXRlRXZlbnQiLCJzZXRCb3RPcHRpb25zIiwiY29udGVudCIsInNldEJvdFBvd2VyIiwibGV2ZWwiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJnZXRTdGF0ZUV2ZW50IiwicG93ZXJMZXZlbHMiLCJwb3dlckV2ZW50IiwiTWF0cml4RXZlbnQiLCJzZXRQb3dlckxldmVsIiwiZ2V0TWVtYmVyc2hpcFN0YXRlIiwicmV0dXJuU3RhdGVFdmVudCIsImdldEpvaW5SdWxlcyIsImJvdE9wdGlvbnMiLCJnZXRNZW1iZXJzaGlwQ291bnQiLCJjb3VudCIsImdldEpvaW5lZE1lbWJlckNvdW50IiwiY2FuU2VuZEV2ZW50IiwiZXZUeXBlIiwiZXZlbnRfdHlwZSIsImlzU3RhdGUiLCJCb29sZWFuIiwiaXNfc3RhdGUiLCJnZXRNeU1lbWJlcnNoaXAiLCJtZSIsImNyZWRlbnRpYWxzIiwiY2FuU2VuZCIsImN1cnJlbnRTdGF0ZSIsIm1heVNlbmRTdGF0ZUV2ZW50IiwibWF5U2VuZEV2ZW50IiwiZXZlbnRUeXBlIiwic3RhdGVLZXkiLCJzdGF0ZUV2ZW50IiwiZ2V0U3RhdGVFdmVudHMiLCJnZXRDb250ZW50Iiwib25NZXNzYWdlIiwib3JpZ2luYWxFdmVudCIsImNvbmZpZ1VybCIsIm9wZW5NYW5hZ2VyVXJsIiwiSW50ZWdyYXRpb25NYW5hZ2VycyIsInNoYXJlZEluc3RhbmNlIiwiZ2V0UHJpbWFyeU1hbmFnZXIiLCJ1aVVybCIsIlVSTCIsImV2ZW50T3JpZ2luVXJsIiwiYXBpIiwicm9vbV9pZCIsInVzZXJfaWQiLCJSb29tVmlld1N0b3JlIiwiZ2V0Um9vbUlkIiwid2FybiIsImxpc3RlbmVyQ291bnQiLCJzdGFydExpc3RlbmluZyIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzdG9wTGlzdGVuaW5nIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInNldE9wZW5NYW5hZ2VyVXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQThPQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyUEE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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LGFBQWEsR0FBRyxDQUFwQixFQUF1QjtBQUNuQjtBQUNBLFVBQU1wRSxDQUFDLEdBQUcsSUFBSVQsS0FBSixDQUNOLHlFQUNBLGlCQUZNLENBQVY7QUFJQWpDLElBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjeUMsQ0FBZDtBQUNIO0FBQ0o7O0FBRU0sU0FBUzBFLGlCQUFULENBQTJCekYsR0FBM0IsRUFBZ0M7QUFDbkNzRSxFQUFBQSxjQUFjLEdBQUd0RSxHQUFqQjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBUT0RPOiBHZW5lcmlmeSB0aGUgbmFtZSBvZiB0aGlzIGFuZCBhbGwgY29tcG9uZW50cyB3aXRoaW4gLSBpdCdzIG5vdCBqdXN0IGZvciBzY2FsYXIuXG5cbi8qXG5MaXN0ZW5zIGZvciBpbmNvbWluZyBwb3N0TWVzc2FnZSByZXF1ZXN0cyBmcm9tIHRoZSBpbnRlZ3JhdGlvbnMgVUkgVVJMLiBUaGUgZm9sbG93aW5nIEFQSSBpcyBleHBvc2VkOlxue1xuICAgIGFjdGlvbjogXCJpbnZpdGVcIiB8IFwibWVtYmVyc2hpcF9zdGF0ZVwiIHwgXCJib3Rfb3B0aW9uc1wiIHwgXCJzZXRfYm90X29wdGlvbnNcIiB8IGV0Yy4uLiAsXG4gICAgcm9vbV9pZDogJFJPT01fSUQsXG4gICAgdXNlcl9pZDogJFVTRVJfSURcbiAgICAvLyBhZGRpdGlvbmFsIHJlcXVlc3QgZmllbGRzXG59XG5cblRoZSBjb21wbGV0ZSByZXF1ZXN0IG9iamVjdCBpcyByZXR1cm5lZCB0byB0aGUgY2FsbGVyIHdpdGggYW4gYWRkaXRpb25hbCBcInJlc3BvbnNlXCIga2V5IGxpa2Ugc286XG57XG4gICAgYWN0aW9uOiBcImludml0ZVwiIHwgXCJtZW1iZXJzaGlwX3N0YXRlXCIgfCBcImJvdF9vcHRpb25zXCIgfCBcInNldF9ib3Rfb3B0aW9uc1wiLFxuICAgIHJvb21faWQ6ICRST09NX0lELFxuICAgIHVzZXJfaWQ6ICRVU0VSX0lELFxuICAgIC8vIGFkZGl0aW9uYWwgcmVxdWVzdCBmaWVsZHNcbiAgICByZXNwb25zZTogeyAuLi4gfVxufVxuXG5UaGUgXCJhY3Rpb25cIiBkZXRlcm1pbmVzIHRoZSBmb3JtYXQgb2YgdGhlIHJlcXVlc3QgYW5kIHJlc3BvbnNlLiBBbGwgYWN0aW9ucyBjYW4gcmV0dXJuIGFuIGVycm9yIHJlc3BvbnNlLlxuQW4gZXJyb3IgcmVzcG9uc2UgaXMgYSBcInJlc3BvbnNlXCIgb2JqZWN0IHdoaWNoIGNvbnNpc3RzIG9mIGEgc29sZSBcImVycm9yXCIga2V5IHRvIGluZGljYXRlIGFuIGVycm9yLlxuVGhleSBsb29rIGxpa2U6XG57XG4gICAgZXJyb3I6IHtcbiAgICAgICAgbWVzc2FnZTogXCJVbmFibGUgdG8gaW52aXRlIHVzZXIgaW50byByb29tLlwiLFxuICAgICAgICBfZXJyb3I6IDxPcmlnaW5hbCBFcnJvciBPYmplY3Q+XG4gICAgfVxufVxuVGhlIFwibWVzc2FnZVwiIGtleSBzaG91bGQgYmUgYSBodW1hbi1mcmllbmRseSBzdHJpbmcuXG5cbkFDVElPTlNcbj09PT09PT1cbkFsbCBhY3Rpb25zIGNhbiByZXR1cm4gYW4gZXJyb3IgcmVzcG9uc2UgaW5zdGVhZCBvZiB0aGUgcmVzcG9uc2Ugb3V0bGluZWQgYmVsb3cuXG5cbmludml0ZVxuLS0tLS0tXG5JbnZpdGVzIGEgdXNlciBpbnRvIGEgcm9vbS5cblxuUmVxdWVzdDpcbiAtIHJvb21faWQgaXMgdGhlIHJvb20gdG8gaW52aXRlIHRoZSB1c2VyIGludG8uXG4gLSB1c2VyX2lkIGlzIHRoZSB1c2VyIElEIHRvIGludml0ZS5cbiAtIE5vIGFkZGl0aW9uYWwgZmllbGRzLlxuUmVzcG9uc2U6XG57XG4gICAgc3VjY2VzczogdHJ1ZVxufVxuRXhhbXBsZTpcbntcbiAgICBhY3Rpb246IFwiaW52aXRlXCIsXG4gICAgcm9vbV9pZDogXCIhZm9vOmJhclwiLFxuICAgIHVzZXJfaWQ6IFwiQGludml0ZWU6YmFyXCIsXG4gICAgcmVzcG9uc2U6IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgIH1cbn1cblxuc2V0X2JvdF9vcHRpb25zXG4tLS0tLS0tLS0tLS0tLS1cblNldCB0aGUgbS5yb29tLmJvdC5vcHRpb25zIHN0YXRlIGV2ZW50IGZvciBhIGJvdCB1c2VyLlxuXG5SZXF1ZXN0OlxuIC0gcm9vbV9pZCBpcyB0aGUgcm9vbSB0byBzZW5kIHRoZSBzdGF0ZSBldmVudCBpbnRvLlxuIC0gdXNlcl9pZCBpcyB0aGUgdXNlciBJRCBvZiB0aGUgYm90IHdobyB5b3UncmUgc2V0dGluZyBvcHRpb25zIGZvci5cbiAtIFwiY29udGVudFwiIGlzIGFuIG9iamVjdCBjb25zaXN0aW5nIG9mIHRoZSBjb250ZW50IHlvdSB3aXNoIHRvIHNldC5cblJlc3BvbnNlOlxue1xuICAgIHN1Y2Nlc3M6IHRydWVcbn1cbkV4YW1wbGU6XG57XG4gICAgYWN0aW9uOiBcInNldF9ib3Rfb3B0aW9uc1wiLFxuICAgIHJvb21faWQ6IFwiIWZvbzpiYXJcIixcbiAgICB1c2VyX2lkOiBcIkBib3Q6YmFyXCIsXG4gICAgY29udGVudDoge1xuICAgICAgICBkZWZhdWx0X29wdGlvbjogXCJhbHBoYVwiXG4gICAgfSxcbiAgICByZXNwb25zZToge1xuICAgICAgICBzdWNjZXNzOiB0cnVlXG4gICAgfVxufVxuXG5nZXRfbWVtYmVyc2hpcF9jb3VudFxuLS0tLS0tLS0tLS0tLS0tLS0tLS1cbkdldCB0aGUgbnVtYmVyIG9mIGpvaW5lZCB1c2VycyBpbiB0aGUgcm9vbS5cblxuUmVxdWVzdDpcbiAtIHJvb21faWQgaXMgdGhlIHJvb20gdG8gZ2V0IHRoZSBjb3VudCBpbi5cblJlc3BvbnNlOlxuNzhcbkV4YW1wbGU6XG57XG4gICAgYWN0aW9uOiBcImdldF9tZW1iZXJzaGlwX2NvdW50XCIsXG4gICAgcm9vbV9pZDogXCIhZm9vOmJhclwiLFxuICAgIHJlc3BvbnNlOiA3OFxufVxuXG5jYW5fc2VuZF9ldmVudFxuLS0tLS0tLS0tLS0tLS1cbkNoZWNrIGlmIHRoZSBjbGllbnQgY2FuIHNlbmQgdGhlIGdpdmVuIGV2ZW50IGludG8gdGhlIGdpdmVuIHJvb20uIElmIHRoZSBjbGllbnRcbmlzIHVuYWJsZSB0byBkbyB0aGlzLCBhbiBlcnJvciByZXNwb25zZSBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdyZXNwb25zZTogZmFsc2UnLlxuXG5SZXF1ZXN0OlxuIC0gcm9vbV9pZCBpcyB0aGUgcm9vbSB0byBkbyB0aGUgY2hlY2sgaW4uXG4gLSBldmVudF90eXBlIGlzIHRoZSBldmVudCB0eXBlIHdoaWNoIHdpbGwgYmUgc2VudC5cbiAtIGlzX3N0YXRlIGlzIHRydWUgaWYgdGhlIGV2ZW50IHRvIGJlIHNlbnQgaXMgYSBzdGF0ZSBldmVudC5cblJlc3BvbnNlOlxudHJ1ZVxuRXhhbXBsZTpcbntcbiAgICBhY3Rpb246IFwiY2FuX3NlbmRfZXZlbnRcIixcbiAgICBpc19zdGF0ZTogZmFsc2UsXG4gICAgZXZlbnRfdHlwZTogXCJtLnJvb20ubWVzc2FnZVwiLFxuICAgIHJvb21faWQ6IFwiIWZvbzpiYXJcIixcbiAgICByZXNwb25zZTogdHJ1ZVxufVxuXG5zZXRfd2lkZ2V0XG4tLS0tLS0tLS0tXG5TZXQgYSBuZXcgd2lkZ2V0IGluIHRoZSByb29tLiBDbG9iYmVycyBiYXNlZCBvbiB0aGUgSUQuXG5cblJlcXVlc3Q6XG4gLSBgcm9vbV9pZGAgKFN0cmluZykgaXMgdGhlIHJvb20gdG8gc2V0IHRoZSB3aWRnZXQgaW4uXG4gLSBgd2lkZ2V0X2lkYCAoU3RyaW5nKSBpcyB0aGUgSUQgb2YgdGhlIHdpZGdldCB0byBhZGQgKG9yIHJlcGxhY2UgaWYgaXQgYWxyZWFkeSBleGlzdHMpLlxuICAgSXQgY2FuIGJlIGFuIGFyYml0cmFyeSBVVEY4IHN0cmluZyBhbmQgaXMgcHVyZWx5IGZvciBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIHdpZGdldHMuXG4gLSBgdXJsYCAoU3RyaW5nKSBpcyB0aGUgVVJMIHRoYXQgY2xpZW50cyBzaG91bGQgbG9hZCBpbiBhbiBpZnJhbWUgdG8gcnVuIHRoZSB3aWRnZXQuXG4gICBBbGwgd2lkZ2V0cyBtdXN0IGhhdmUgYSB2YWxpZCBVUkwuIElmIHRoZSBVUkwgaXMgYG51bGxgIChub3QgYHVuZGVmaW5lZGApLCB0aGVcbiAgIHdpZGdldCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgcm9vbS5cbiAtIGB0eXBlYCAoU3RyaW5nKSBpcyB0aGUgdHlwZSBvZiB3aWRnZXQsIHdoaWNoIGlzIHByb3ZpZGVkIGFzIGEgaGludCBmb3IgbWF0cml4IGNsaWVudHMgc28gdGhleVxuICAgY2FuIGNvbmZpZ3VyZS9sYXkgb3V0IHRoZSB3aWRnZXQgaW4gZGlmZmVyZW50IHdheXMuIEFsbCB3aWRnZXRzIG11c3QgaGF2ZSBhIHR5cGUuXG4gLSBgbmFtZWAgKFN0cmluZykgaXMgYW4gb3B0aW9uYWwgaHVtYW4tcmVhZGFibGUgc3RyaW5nIGFib3V0IHRoZSB3aWRnZXQuXG4gLSBgZGF0YWAgKE9iamVjdCkgaXMgc29tZSBvcHRpb25hbCBkYXRhIGFib3V0IHRoZSB3aWRnZXQsIGFuZCBjYW4gY29udGFpbiBhcmJpdHJhcnkga2V5L3ZhbHVlIHBhaXJzLlxuUmVzcG9uc2U6XG57XG4gICAgc3VjY2VzczogdHJ1ZVxufVxuRXhhbXBsZTpcbntcbiAgICBhY3Rpb246IFwic2V0X3dpZGdldFwiLFxuICAgIHJvb21faWQ6IFwiIWZvbzpiYXJcIixcbiAgICB3aWRnZXRfaWQ6IFwiYWJjMTIzXCIsXG4gICAgdXJsOiBcImh0dHA6Ly93aWRnZXQudXJsXCIsXG4gICAgdHlwZTogXCJleGFtcGxlXCIsXG4gICAgcmVzcG9uc2U6IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgIH1cbn1cblxuZ2V0X3dpZGdldHNcbi0tLS0tLS0tLS0tXG5HZXQgYSBsaXN0IG9mIGFsbCB3aWRnZXRzIGluIHRoZSByb29tLiBUaGUgcmVzcG9uc2UgaXMgYW4gYXJyYXlcbm9mIHN0YXRlIGV2ZW50cy5cblxuUmVxdWVzdDpcbiAtIGByb29tX2lkYCAoU3RyaW5nKSBpcyB0aGUgcm9vbSB0byBnZXQgdGhlIHdpZGdldHMgaW4uXG5SZXNwb25zZTpcbltcbiAgICB7XG4gICAgICAgIC8vIFRPRE86IEVuYWJsZSBzdXBwb3J0IGZvciBtLndpZGdldCBldmVudCB0eXBlIChodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMzExMSlcbiAgICAgICAgdHlwZTogXCJpbS52ZWN0b3IubW9kdWxhci53aWRnZXRzXCIsXG4gICAgICAgIHN0YXRlX2tleTogXCJ3aWQxXCIsXG4gICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiZ3JhZmFuYVwiLFxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vZ3JhZmFuYXVybFwiLFxuICAgICAgICAgICAgbmFtZTogXCJkYXNoYm9hcmRcIixcbiAgICAgICAgICAgIGRhdGE6IHtrZXk6IFwidmFsXCJ9XG4gICAgICAgIH1cbiAgICAgICAgcm9vbV9pZDog4oCcIWZvbzpiYXLigJ0sXG4gICAgICAgIHNlbmRlcjogXCJAYWxpY2U6bG9jYWxob3N0XCJcbiAgICB9XG5dXG5FeGFtcGxlOlxue1xuICAgIGFjdGlvbjogXCJnZXRfd2lkZ2V0c1wiLFxuICAgIHJvb21faWQ6IFwiIWZvbzpiYXJcIixcbiAgICByZXNwb25zZTogW1xuICAgICAgICB7XG4gICAgICAgICAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS53aWRnZXQgZXZlbnQgdHlwZSAoaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTMxMTEpXG4gICAgICAgICAgICB0eXBlOiBcImltLnZlY3Rvci5tb2R1bGFyLndpZGdldHNcIixcbiAgICAgICAgICAgIHN0YXRlX2tleTogXCJ3aWQxXCIsXG4gICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJncmFmYW5hXCIsXG4gICAgICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vZ3JhZmFuYXVybFwiLFxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGFzaGJvYXJkXCIsXG4gICAgICAgICAgICAgICAgZGF0YToge2tleTogXCJ2YWxcIn1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvb21faWQ6IOKAnCFmb286YmFy4oCdLFxuICAgICAgICAgICAgc2VuZGVyOiBcIkBhbGljZTpsb2NhbGhvc3RcIlxuICAgICAgICB9XG4gICAgXVxufVxuXG5cbm1lbWJlcnNoaXBfc3RhdGUgQU5EIGJvdF9vcHRpb25zXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuR2V0IHRoZSBjb250ZW50IG9mIHRoZSBcIm0ucm9vbS5tZW1iZXJcIiBvciBcIm0ucm9vbS5ib3Qub3B0aW9uc1wiIHN0YXRlIGV2ZW50IHJlc3BlY3RpdmVseS5cblxuTkI6IFdoaWxzdCB0aGlzIEFQSSBpcyBiYXNpY2FsbHkgZXF1aXZhbGVudCB0byBnZXRTdGF0ZUV2ZW50LCB3ZSBzcGVjaWZpY2FsbHkgZG8gbm90XG4gICAgd2FudCBleHRlcm5hbCBlbnRpdGllcyB0byBiZSBhYmxlIHRvIHF1ZXJ5IGFueSBzdGF0ZSBldmVudCBmb3IgYW55IHJvb20sIGhlbmNlIHRoZVxuICAgIHJlc3RyaWN0aXZlIEFQSSBvdXRsaW5lZCBoZXJlLlxuXG5SZXF1ZXN0OlxuIC0gcm9vbV9pZCBpcyB0aGUgcm9vbSB3aGljaCBoYXMgdGhlIHN0YXRlIGV2ZW50LlxuIC0gdXNlcl9pZCBpcyB0aGUgc3RhdGVfa2V5IHBhcmFtZXRlciB3aGljaCBpbiBib3RoIGNhc2VzIGlzIGEgdXNlciBJRCAodGhlIG1lbWJlciBvciB0aGUgYm90KS5cbiAtIE5vIGFkZGl0aW9uYWwgZmllbGRzLlxuUmVzcG9uc2U6XG4gLSBUaGUgZXZlbnQgY29udGVudC4gSWYgdGhlcmUgaXMgbm8gc3RhdGUgZXZlbnQsIHRoZSBcInJlc3BvbnNlXCIga2V5IHNob3VsZCBiZSBudWxsLlxuRXhhbXBsZTpcbntcbiAgICBhY3Rpb246IFwibWVtYmVyc2hpcF9zdGF0ZVwiLFxuICAgIHJvb21faWQ6IFwiIWZvbzpiYXJcIixcbiAgICB1c2VyX2lkOiBcIkBzb21lbWVtYmVyOmJhclwiLFxuICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIG1lbWJlcnNoaXA6IFwiam9pblwiLFxuICAgICAgICBkaXNwbGF5bmFtZTogXCJCb2JcIixcbiAgICAgICAgYXZhdGFyX3VybDogbnVsbFxuICAgIH1cbn1cbiovXG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgeyBNYXRyaXhFdmVudCB9IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuaW1wb3J0IGRpcyBmcm9tICcuL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgV2lkZ2V0VXRpbHMgZnJvbSAnLi91dGlscy9XaWRnZXRVdGlscyc7XG5pbXBvcnQgUm9vbVZpZXdTdG9yZSBmcm9tICcuL3N0b3Jlcy9Sb29tVmlld1N0b3JlJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi9pbnRlZ3JhdGlvbnMvSW50ZWdyYXRpb25NYW5hZ2Vyc1wiO1xuaW1wb3J0IHtXaWRnZXRUeXBlfSBmcm9tIFwiLi93aWRnZXRzL1dpZGdldFR5cGVcIjtcblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlKGV2ZW50LCByZXMpIHtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShldmVudC5kYXRhKSk7XG4gICAgZGF0YS5yZXNwb25zZSA9IHJlcztcbiAgICBldmVudC5zb3VyY2UucG9zdE1lc3NhZ2UoZGF0YSwgZXZlbnQub3JpZ2luKTtcbn1cblxuZnVuY3Rpb24gc2VuZEVycm9yKGV2ZW50LCBtc2csIG5lc3RlZEVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkFjdGlvbjpcIiArIGV2ZW50LmRhdGEuYWN0aW9uICsgXCIgZmFpbGVkIHdpdGggbWVzc2FnZTogXCIgKyBtc2cpO1xuICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGV2ZW50LmRhdGEpKTtcbiAgICBkYXRhLnJlc3BvbnNlID0ge1xuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgbWVzc2FnZTogbXNnLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgaWYgKG5lc3RlZEVycm9yKSB7XG4gICAgICAgIGRhdGEucmVzcG9uc2UuZXJyb3IuX2Vycm9yID0gbmVzdGVkRXJyb3I7XG4gICAgfVxuICAgIGV2ZW50LnNvdXJjZS5wb3N0TWVzc2FnZShkYXRhLCBldmVudC5vcmlnaW4pO1xufVxuXG5mdW5jdGlvbiBpbnZpdGVVc2VyKGV2ZW50LCByb29tSWQsIHVzZXJJZCkge1xuICAgIGNvbnNvbGUubG9nKGBSZWNlaXZlZCByZXF1ZXN0IHRvIGludml0ZSAke3VzZXJJZH0gaW50byByb29tICR7cm9vbUlkfWApO1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgIGlmIChyb29tKSB7XG4gICAgICAgIC8vIGlmIHRoZXkgYXJlIGFscmVhZHkgaW52aXRlZCB3ZSBjYW4gcmVzb2x2ZSBpbW1lZGlhdGVseS5cbiAgICAgICAgY29uc3QgbWVtYmVyID0gcm9vbS5nZXRNZW1iZXIodXNlcklkKTtcbiAgICAgICAgaWYgKG1lbWJlciAmJiBtZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIikge1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xpZW50Lmludml0ZShyb29tSWQsIHVzZXJJZCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKGV2ZW50LCB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBfdCgnWW91IG5lZWQgdG8gYmUgYWJsZSB0byBpbnZpdGUgdXNlcnMgdG8gZG8gdGhhdC4nKSwgZXJyKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0V2lkZ2V0KGV2ZW50LCByb29tSWQpIHtcbiAgICBjb25zdCB3aWRnZXRJZCA9IGV2ZW50LmRhdGEud2lkZ2V0X2lkO1xuICAgIGxldCB3aWRnZXRUeXBlID0gZXZlbnQuZGF0YS50eXBlO1xuICAgIGNvbnN0IHdpZGdldFVybCA9IGV2ZW50LmRhdGEudXJsO1xuICAgIGNvbnN0IHdpZGdldE5hbWUgPSBldmVudC5kYXRhLm5hbWU7IC8vIG9wdGlvbmFsXG4gICAgY29uc3Qgd2lkZ2V0RGF0YSA9IGV2ZW50LmRhdGEuZGF0YTsgLy8gb3B0aW9uYWxcbiAgICBjb25zdCB1c2VyV2lkZ2V0ID0gZXZlbnQuZGF0YS51c2VyV2lkZ2V0O1xuXG4gICAgLy8gYm90aCBhZGRpbmcvcmVtb3Zpbmcgd2lkZ2V0cyBuZWVkIHRoZXNlIGNoZWNrc1xuICAgIGlmICghd2lkZ2V0SWQgfHwgd2lkZ2V0VXJsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBfdChcIlVuYWJsZSB0byBjcmVhdGUgd2lkZ2V0LlwiKSwgbmV3IEVycm9yKFwiTWlzc2luZyByZXF1aXJlZCB3aWRnZXQgZmllbGRzLlwiKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAod2lkZ2V0VXJsICE9PSBudWxsKSB7IC8vIGlmIHVybCBpcyBudWxsIGl0IGlzIGJlaW5nIGRlbGV0ZWQsIGRvbid0IG5lZWQgdG8gY2hlY2sgbmFtZS90eXBlL2V0Y1xuICAgICAgICAvLyBjaGVjayB0eXBlcyBvZiBmaWVsZHNcbiAgICAgICAgaWYgKHdpZGdldE5hbWUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygd2lkZ2V0TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHNlbmRFcnJvcihldmVudCwgX3QoXCJVbmFibGUgdG8gY3JlYXRlIHdpZGdldC5cIiksIG5ldyBFcnJvcihcIk9wdGlvbmFsIGZpZWxkICduYW1lJyBtdXN0IGJlIGEgc3RyaW5nLlwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpZGdldERhdGEgIT09IHVuZGVmaW5lZCAmJiAhKHdpZGdldERhdGEgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KFwiVW5hYmxlIHRvIGNyZWF0ZSB3aWRnZXQuXCIpLCBuZXcgRXJyb3IoXCJPcHRpb25hbCBmaWVsZCAnZGF0YScgbXVzdCBiZSBhbiBPYmplY3QuXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHdpZGdldFR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KFwiVW5hYmxlIHRvIGNyZWF0ZSB3aWRnZXQuXCIpLCBuZXcgRXJyb3IoXCJGaWVsZCAndHlwZScgbXVzdCBiZSBhIHN0cmluZy5cIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygd2lkZ2V0VXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBfdChcIlVuYWJsZSB0byBjcmVhdGUgd2lkZ2V0LlwiKSwgbmV3IEVycm9yKFwiRmllbGQgJ3VybCcgbXVzdCBiZSBhIHN0cmluZyBvciBudWxsLlwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IHRoZSB3aWRnZXQgdHlwZSB0byBhIGtub3duIHdpZGdldCB0eXBlXG4gICAgd2lkZ2V0VHlwZSA9IFdpZGdldFR5cGUuZnJvbVN0cmluZyh3aWRnZXRUeXBlKTtcblxuICAgIGlmICh1c2VyV2lkZ2V0KSB7XG4gICAgICAgIFdpZGdldFV0aWxzLnNldFVzZXJXaWRnZXQod2lkZ2V0SWQsIHdpZGdldFR5cGUsIHdpZGdldFVybCwgd2lkZ2V0TmFtZSwgd2lkZ2V0RGF0YSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoZXZlbnQsIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7IGFjdGlvbjogXCJ1c2VyX3dpZGdldF91cGRhdGVkXCIgfSk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdVbmFibGUgdG8gY3JlYXRlIHdpZGdldC4nKSwgZSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7IC8vIFJvb20gd2lkZ2V0XG4gICAgICAgIGlmICghcm9vbUlkKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdNaXNzaW5nIHJvb21JZC4nKSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgV2lkZ2V0VXRpbHMuc2V0Um9vbVdpZGdldChyb29tSWQsIHdpZGdldElkLCB3aWRnZXRUeXBlLCB3aWRnZXRVcmwsIHdpZGdldE5hbWUsIHdpZGdldERhdGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdGYWlsZWQgdG8gc2VuZCByZXF1ZXN0LicpLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldHMoZXZlbnQsIHJvb21JZCkge1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCB3aWRnZXRTdGF0ZUV2ZW50cyA9IFtdO1xuXG4gICAgaWYgKHJvb21JZCkge1xuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdUaGlzIHJvb20gaXMgbm90IHJlY29nbmlzZWQuJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFhYWDogVGhpcyBnZXRzIHRoZSByYXcgZXZlbnQgb2JqZWN0IChJIHRoaW5rIGJlY2F1c2Ugd2UgY2FuJ3RcbiAgICAgICAgLy8gc2VuZCB0aGUgTWF0cml4RXZlbnQgb3ZlciBwb3N0TWVzc2FnZT8pXG4gICAgICAgIHdpZGdldFN0YXRlRXZlbnRzID0gV2lkZ2V0VXRpbHMuZ2V0Um9vbVdpZGdldHMocm9vbSkubWFwKChldikgPT4gZXYuZXZlbnQpO1xuICAgIH1cblxuICAgIC8vIEFkZCB1c2VyIHdpZGdldHMgKG5vdCBsaW5rZWQgdG8gYSBzcGVjaWZpYyByb29tKVxuICAgIGNvbnN0IHVzZXJXaWRnZXRzID0gV2lkZ2V0VXRpbHMuZ2V0VXNlcldpZGdldHNBcnJheSgpO1xuICAgIHdpZGdldFN0YXRlRXZlbnRzID0gd2lkZ2V0U3RhdGVFdmVudHMuY29uY2F0KHVzZXJXaWRnZXRzKTtcblxuICAgIHNlbmRSZXNwb25zZShldmVudCwgd2lkZ2V0U3RhdGVFdmVudHMpO1xufVxuXG5mdW5jdGlvbiBnZXRSb29tRW5jU3RhdGUoZXZlbnQsIHJvb21JZCkge1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgIGlmICghcm9vbSkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdUaGlzIHJvb20gaXMgbm90IHJlY29nbmlzZWQuJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb21Jc0VuY3J5cHRlZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc1Jvb21FbmNyeXB0ZWQocm9vbUlkKTtcblxuICAgIHNlbmRSZXNwb25zZShldmVudCwgcm9vbUlzRW5jcnlwdGVkKTtcbn1cblxuZnVuY3Rpb24gc2V0UGx1bWJpbmdTdGF0ZShldmVudCwgcm9vbUlkLCBzdGF0dXMpIHtcbiAgICBpZiAodHlwZW9mIHN0YXR1cyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbHVtYmluZyBzdGF0ZSBzdGF0dXMgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBSZWNlaXZlZCByZXF1ZXN0IHRvIHNldCBwbHVtYmluZyBzdGF0ZSB0byBzdGF0dXMgXCIke3N0YXR1c31cIiBpbiByb29tICR7cm9vbUlkfWApO1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNsaWVudC5zZW5kU3RhdGVFdmVudChyb29tSWQsIFwibS5yb29tLnBsdW1iaW5nXCIsIHsgc3RhdHVzOiBzdGF0dXMgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHNlbmRSZXNwb25zZShldmVudCwge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIGVyci5tZXNzYWdlID8gZXJyLm1lc3NhZ2UgOiBfdCgnRmFpbGVkIHRvIHNlbmQgcmVxdWVzdC4nKSwgZXJyKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0Qm90T3B0aW9ucyhldmVudCwgcm9vbUlkLCB1c2VySWQpIHtcbiAgICBjb25zb2xlLmxvZyhgUmVjZWl2ZWQgcmVxdWVzdCB0byBzZXQgb3B0aW9ucyBmb3IgYm90ICR7dXNlcklkfSBpbiByb29tICR7cm9vbUlkfWApO1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNsaWVudC5zZW5kU3RhdGVFdmVudChyb29tSWQsIFwibS5yb29tLmJvdC5vcHRpb25zXCIsIGV2ZW50LmRhdGEuY29udGVudCwgXCJfXCIgKyB1c2VySWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzZW5kUmVzcG9uc2UoZXZlbnQsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBlcnIubWVzc2FnZSA/IGVyci5tZXNzYWdlIDogX3QoJ0ZhaWxlZCB0byBzZW5kIHJlcXVlc3QuJyksIGVycik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldEJvdFBvd2VyKGV2ZW50LCByb29tSWQsIHVzZXJJZCwgbGV2ZWwpIHtcbiAgICBpZiAoIShOdW1iZXIuaXNJbnRlZ2VyKGxldmVsKSAmJiBsZXZlbCA+PSAwKSkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdQb3dlciBsZXZlbCBtdXN0IGJlIHBvc2l0aXZlIGludGVnZXIuJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFJlY2VpdmVkIHJlcXVlc3QgdG8gc2V0IHBvd2VyIGxldmVsIHRvICR7bGV2ZWx9IGZvciBib3QgJHt1c2VySWR9IGluIHJvb20gJHtyb29tSWR9LmApO1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2xpZW50LmdldFN0YXRlRXZlbnQocm9vbUlkLCBcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIikudGhlbigocG93ZXJMZXZlbHMpID0+IHtcbiAgICAgICAgY29uc3QgcG93ZXJFdmVudCA9IG5ldyBNYXRyaXhFdmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIixcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwb3dlckxldmVscyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG5cbiAgICAgICAgY2xpZW50LnNldFBvd2VyTGV2ZWwocm9vbUlkLCB1c2VySWQsIGxldmVsLCBwb3dlckV2ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZShldmVudCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBlcnIubWVzc2FnZSA/IGVyci5tZXNzYWdlIDogX3QoJ0ZhaWxlZCB0byBzZW5kIHJlcXVlc3QuJyksIGVycik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRNZW1iZXJzaGlwU3RhdGUoZXZlbnQsIHJvb21JZCwgdXNlcklkKSB7XG4gICAgY29uc29sZS5sb2coYG1lbWJlcnNoaXBfc3RhdGUgb2YgJHt1c2VySWR9IGluIHJvb20gJHtyb29tSWR9IHJlcXVlc3RlZC5gKTtcbiAgICByZXR1cm5TdGF0ZUV2ZW50KGV2ZW50LCByb29tSWQsIFwibS5yb29tLm1lbWJlclwiLCB1c2VySWQpO1xufVxuXG5mdW5jdGlvbiBnZXRKb2luUnVsZXMoZXZlbnQsIHJvb21JZCkge1xuICAgIGNvbnNvbGUubG9nKGBqb2luX3J1bGVzIG9mICR7cm9vbUlkfSByZXF1ZXN0ZWQuYCk7XG4gICAgcmV0dXJuU3RhdGVFdmVudChldmVudCwgcm9vbUlkLCBcIm0ucm9vbS5qb2luX3J1bGVzXCIsIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBib3RPcHRpb25zKGV2ZW50LCByb29tSWQsIHVzZXJJZCkge1xuICAgIGNvbnNvbGUubG9nKGBib3Rfb3B0aW9ucyBvZiAke3VzZXJJZH0gaW4gcm9vbSAke3Jvb21JZH0gcmVxdWVzdGVkLmApO1xuICAgIHJldHVyblN0YXRlRXZlbnQoZXZlbnQsIHJvb21JZCwgXCJtLnJvb20uYm90Lm9wdGlvbnNcIiwgXCJfXCIgKyB1c2VySWQpO1xufVxuXG5mdW5jdGlvbiBnZXRNZW1iZXJzaGlwQ291bnQoZXZlbnQsIHJvb21JZCkge1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgIGlmICghcm9vbSkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdUaGlzIHJvb20gaXMgbm90IHJlY29nbmlzZWQuJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvdW50ID0gcm9vbS5nZXRKb2luZWRNZW1iZXJDb3VudCgpO1xuICAgIHNlbmRSZXNwb25zZShldmVudCwgY291bnQpO1xufVxuXG5mdW5jdGlvbiBjYW5TZW5kRXZlbnQoZXZlbnQsIHJvb21JZCkge1xuICAgIGNvbnN0IGV2VHlwZSA9IFwiXCIgKyBldmVudC5kYXRhLmV2ZW50X3R5cGU7IC8vIGZvcmNlIHN0cmluZ2lmeVxuICAgIGNvbnN0IGlzU3RhdGUgPSBCb29sZWFuKGV2ZW50LmRhdGEuaXNfc3RhdGUpO1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgIGlmICghcm9vbSkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdUaGlzIHJvb20gaXMgbm90IHJlY29nbmlzZWQuJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyb29tLmdldE15TWVtYmVyc2hpcCgpICE9PSBcImpvaW5cIikge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgYXJlIG5vdCBpbiB0aGlzIHJvb20uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1lID0gY2xpZW50LmNyZWRlbnRpYWxzLnVzZXJJZDtcblxuICAgIGxldCBjYW5TZW5kID0gZmFsc2U7XG4gICAgaWYgKGlzU3RhdGUpIHtcbiAgICAgICAgY2FuU2VuZCA9IHJvb20uY3VycmVudFN0YXRlLm1heVNlbmRTdGF0ZUV2ZW50KGV2VHlwZSwgbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhblNlbmQgPSByb29tLmN1cnJlbnRTdGF0ZS5tYXlTZW5kRXZlbnQoZXZUeXBlLCBtZSk7XG4gICAgfVxuXG4gICAgaWYgKCFjYW5TZW5kKSB7XG4gICAgICAgIHNlbmRFcnJvcihldmVudCwgX3QoJ1lvdSBkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGRvIHRoYXQgaW4gdGhpcyByb29tLicpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbmRSZXNwb25zZShldmVudCwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHJldHVyblN0YXRlRXZlbnQoZXZlbnQsIHJvb21JZCwgZXZlbnRUeXBlLCBzdGF0ZUtleSkge1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdZb3UgbmVlZCB0byBiZSBsb2dnZWQgaW4uJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgIGlmICghcm9vbSkge1xuICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdUaGlzIHJvb20gaXMgbm90IHJlY29nbmlzZWQuJykpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHN0YXRlRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhldmVudFR5cGUsIHN0YXRlS2V5KTtcbiAgICBpZiAoIXN0YXRlRXZlbnQpIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKGV2ZW50LCBudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZW5kUmVzcG9uc2UoZXZlbnQsIHN0YXRlRXZlbnQuZ2V0Q29udGVudCgpKTtcbn1cblxuY29uc3Qgb25NZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50Lm9yaWdpbikgeyAvLyBzdHVwaWQgY2hyb21lXG4gICAgICAgIGV2ZW50Lm9yaWdpbiA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQub3JpZ2luO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRoYXQgdGhlIGludGVncmF0aW9ucyBVSSBVUkwgc3RhcnRzIHdpdGggdGhlIG9yaWdpbiBvZiB0aGUgZXZlbnRcbiAgICAvLyBUaGlzIG1lYW5zIHRoZSBVUkwgY291bGQgY29udGFpbiBhIHBhdGggKGxpa2UgL2RldmVsb3ApIGFuZCBzdGlsbCBiZSB1c2VkXG4gICAgLy8gdG8gdmFsaWRhdGUgZXZlbnQgb3JpZ2lucywgd2hpY2ggZG8gbm90IHNwZWNpZnkgcGF0aHMuXG4gICAgLy8gKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93L3Bvc3RNZXNzYWdlKVxuICAgIGxldCBjb25maWdVcmw7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKCFvcGVuTWFuYWdlclVybCkgb3Blbk1hbmFnZXJVcmwgPSBJbnRlZ3JhdGlvbk1hbmFnZXJzLnNoYXJlZEluc3RhbmNlKCkuZ2V0UHJpbWFyeU1hbmFnZXIoKS51aVVybDtcbiAgICAgICAgY29uZmlnVXJsID0gbmV3IFVSTChvcGVuTWFuYWdlclVybCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBObyBpbnRlZ3JhdGlvbnMgVUkgVVJMLCBpZ25vcmUgc2lsZW50bHkuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGV2ZW50T3JpZ2luVXJsO1xuICAgIHRyeSB7XG4gICAgICAgIGV2ZW50T3JpZ2luVXJsID0gbmV3IFVSTChldmVudC5vcmlnaW4pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUT0RPIC0tIFNjYWxhciBwb3N0TWVzc2FnZSBBUEkgc2hvdWxkIGJlIG5hbWVzcGFjZWQgd2l0aCBldmVudC5kYXRhLmFwaSBmaWVsZFxuICAgIC8vIEZpeCBmb2xsb3dpbmcgXCJpZlwiIHN0YXRlbWVudCB0byByZXNwb25kIG9ubHkgdG8gc3BlY2lmaWMgQVBJIG1lc3NhZ2VzLlxuICAgIGlmIChcbiAgICAgICAgY29uZmlnVXJsLm9yaWdpbiAhPT0gZXZlbnRPcmlnaW5Vcmwub3JpZ2luIHx8XG4gICAgICAgICFldmVudC5kYXRhLmFjdGlvbiB8fFxuICAgICAgICBldmVudC5kYXRhLmFwaSAvLyBJZ25vcmUgbWVzc2FnZXMgd2l0aCBzcGVjaWZpYyBBUEkgc2V0XG4gICAgKSB7XG4gICAgICAgIC8vIGRvbid0IGxvZyB0aGlzIC0gZGVidWdnaW5nIEFQSXMgYW5kIGJyb3dzZXIgYWRkLW9ucyBsaWtlIHRvIHNwYW1cbiAgICAgICAgLy8gcG9zdE1lc3NhZ2Ugd2hpY2ggZmxvb2RzIHRoZSBsb2cgb3RoZXJ3aXNlXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnQuZGF0YS5hY3Rpb24gPT09IFwiY2xvc2Vfc2NhbGFyXCIpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiBcImNsb3NlX3NjYWxhclwiIH0pO1xuICAgICAgICBzZW5kUmVzcG9uc2UoZXZlbnQsIG51bGwpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vbUlkID0gZXZlbnQuZGF0YS5yb29tX2lkO1xuICAgIGNvbnN0IHVzZXJJZCA9IGV2ZW50LmRhdGEudXNlcl9pZDtcblxuICAgIGlmICghcm9vbUlkKSB7XG4gICAgICAgIC8vIFRoZXNlIEFQSXMgZG9uJ3QgcmVxdWlyZSByb29tSWRcbiAgICAgICAgLy8gR2V0IGFuZCBzZXQgdXNlciB3aWRnZXRzIChub3QgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgcm9vbSlcbiAgICAgICAgLy8gSWYgcm9vbUlkIGlzIHNwZWNpZmllZCwgaXQgbXVzdCBiZSB2YWxpZGF0ZWQsIHNvIHJvb20tYmFzZWQgd2lkZ2V0cyBhZ3JlZWRcbiAgICAgICAgLy8gaGFuZGxlZCBmdXJ0aGVyIGRvd24uXG4gICAgICAgIGlmIChldmVudC5kYXRhLmFjdGlvbiA9PT0gXCJnZXRfd2lkZ2V0c1wiKSB7XG4gICAgICAgICAgICBnZXRXaWRnZXRzKGV2ZW50LCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhLmFjdGlvbiA9PT0gXCJzZXRfd2lkZ2V0XCIpIHtcbiAgICAgICAgICAgIHNldFdpZGdldChldmVudCwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoZXZlbnQsIF90KCdNaXNzaW5nIHJvb21faWQgaW4gcmVxdWVzdCcpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyb29tSWQgIT09IFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCkpIHtcbiAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBfdCgnUm9vbSAlKHJvb21JZClzIG5vdCB2aXNpYmxlJywge3Jvb21JZDogcm9vbUlkfSkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2V0IGFuZCBzZXQgcm9vbS1iYXNlZCB3aWRnZXRzXG4gICAgaWYgKGV2ZW50LmRhdGEuYWN0aW9uID09PSBcImdldF93aWRnZXRzXCIpIHtcbiAgICAgICAgZ2V0V2lkZ2V0cyhldmVudCwgcm9vbUlkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YS5hY3Rpb24gPT09IFwic2V0X3dpZGdldFwiKSB7XG4gICAgICAgIHNldFdpZGdldChldmVudCwgcm9vbUlkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRoZXNlIEFQSXMgZG9uJ3QgcmVxdWlyZSB1c2VySWRcbiAgICBpZiAoZXZlbnQuZGF0YS5hY3Rpb24gPT09IFwiam9pbl9ydWxlc19zdGF0ZVwiKSB7XG4gICAgICAgIGdldEpvaW5SdWxlcyhldmVudCwgcm9vbUlkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQuZGF0YS5hY3Rpb24gPT09IFwic2V0X3BsdW1iaW5nX3N0YXRlXCIpIHtcbiAgICAgICAgc2V0UGx1bWJpbmdTdGF0ZShldmVudCwgcm9vbUlkLCBldmVudC5kYXRhLnN0YXR1cyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEuYWN0aW9uID09PSBcImdldF9tZW1iZXJzaGlwX2NvdW50XCIpIHtcbiAgICAgICAgZ2V0TWVtYmVyc2hpcENvdW50KGV2ZW50LCByb29tSWQpO1xuICAgICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChldmVudC5kYXRhLmFjdGlvbiA9PT0gXCJnZXRfcm9vbV9lbmNfc3RhdGVcIikge1xuICAgICAgICBnZXRSb29tRW5jU3RhdGUoZXZlbnQsIHJvb21JZCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEuYWN0aW9uID09PSBcImNhbl9zZW5kX2V2ZW50XCIpIHtcbiAgICAgICAgY2FuU2VuZEV2ZW50KGV2ZW50LCByb29tSWQpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgc2VuZEVycm9yKGV2ZW50LCBfdCgnTWlzc2luZyB1c2VyX2lkIGluIHJlcXVlc3QnKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChldmVudC5kYXRhLmFjdGlvbikge1xuICAgICAgICBjYXNlIFwibWVtYmVyc2hpcF9zdGF0ZVwiOlxuICAgICAgICAgICAgZ2V0TWVtYmVyc2hpcFN0YXRlKGV2ZW50LCByb29tSWQsIHVzZXJJZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludml0ZVwiOlxuICAgICAgICAgICAgaW52aXRlVXNlcihldmVudCwgcm9vbUlkLCB1c2VySWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJib3Rfb3B0aW9uc1wiOlxuICAgICAgICAgICAgYm90T3B0aW9ucyhldmVudCwgcm9vbUlkLCB1c2VySWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzZXRfYm90X29wdGlvbnNcIjpcbiAgICAgICAgICAgIHNldEJvdE9wdGlvbnMoZXZlbnQsIHJvb21JZCwgdXNlcklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic2V0X2JvdF9wb3dlclwiOlxuICAgICAgICAgICAgc2V0Qm90UG93ZXIoZXZlbnQsIHJvb21JZCwgdXNlcklkLCBldmVudC5kYXRhLmxldmVsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiVW5oYW5kbGVkIHBvc3RNZXNzYWdlIGV2ZW50IHdpdGggYWN0aW9uICdcIiArIGV2ZW50LmRhdGEuYWN0aW9uICtcIidcIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5sZXQgbGlzdGVuZXJDb3VudCA9IDA7XG5sZXQgb3Blbk1hbmFnZXJVcmwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKGxpc3RlbmVyQ291bnQgPT09IDApIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9uTWVzc2FnZSwgZmFsc2UpO1xuICAgIH1cbiAgICBsaXN0ZW5lckNvdW50ICs9IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wTGlzdGVuaW5nKCkge1xuICAgIGxpc3RlbmVyQ291bnQgLT0gMTtcbiAgICBpZiAobGlzdGVuZXJDb3VudCA9PT0gMCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25NZXNzYWdlKTtcbiAgICB9XG4gICAgaWYgKGxpc3RlbmVyQ291bnQgPCAwKSB7XG4gICAgICAgIC8vIE1ha2UgYW4gZXJyb3Igc28gd2UgZ2V0IGEgc3RhY2sgdHJhY2VcbiAgICAgICAgY29uc3QgZSA9IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiU2NhbGFyTWVzc2FnaW5nOiBtaXNtYXRjaGVkIHN0YXJ0TGlzdGVuaW5nIC8gc3RvcExpc3RlbmluZyBkZXRlY3RlZC5cIiArXG4gICAgICAgICAgICBcIiBOZWdhdGl2ZSBjb3VudFwiLFxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE9wZW5NYW5hZ2VyVXJsKHVybCkge1xuICAgIG9wZW5NYW5hZ2VyVXJsID0gdXJsO1xufVxuIl19