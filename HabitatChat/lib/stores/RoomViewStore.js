"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var _utils = require("flux/utils");

var _MatrixClientPeg = require("../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../index"));

var _Modal = _interopRequireDefault(require("../Modal"));

var _languageHandler = require("../languageHandler");

var _RoomAliasCache = require("../RoomAliasCache");

/*
Copyright 2017 Vector Creations Ltd
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
const INITIAL_STATE = {
  // Whether we're joining the currently viewed room (see isJoining())
  joining: false,
  // Any error that has occurred during joining
  joinError: null,
  // The room ID of the room currently being viewed
  roomId: null,
  // The event to scroll to when the room is first viewed
  initialEventId: null,
  // Whether to highlight the initial event
  isInitialEventHighlighted: false,
  // The room alias of the room (or null if not originally specified in view_room)
  roomAlias: null,
  // Whether the current room is loading
  roomLoading: false,
  // Any error that has occurred during loading
  roomLoadError: null,
  forwardingEvent: null,
  quotingEvent: null,
  matrixClientIsReady: false
};
/**
 * A class for storing application state for RoomView. This is the RoomView's interface
*  with a subset of the js-sdk.
 *  ```
 */

class RoomViewStore extends _utils.Store {
  constructor() {
    super(_dispatcher.default); // Initialise state

    this._state = INITIAL_STATE;

    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      this._state.matrixClientIsReady = _MatrixClientPeg.MatrixClientPeg.get().isInitialSyncComplete();
    }
  }

  _setState(newState) {
    // If values haven't changed, there's nothing to do.
    // This only tries a shallow comparison, so unchanged objects will slip
    // through, but that's probably okay for now.
    let stateChanged = false;

    for (const key of Object.keys(newState)) {
      if (this._state[key] !== newState[key]) {
        stateChanged = true;
        break;
      }
    }

    if (!stateChanged) {
      return;
    }

    this._state = Object.assign(this._state, newState);

    this.__emitChange();
  }

  __onDispatch(payload) {
    switch (payload.action) {
      // view_room:
      //      - room_alias:   '#somealias:matrix.org'
      //      - room_id:      '!roomid123:matrix.org'
      //      - event_id:     '$213456782:matrix.org'
      //      - event_offset: 100
      //      - highlighted:  true
      case 'view_room':
        this._viewRoom(payload);

        break;

      case 'view_my_groups':
      case 'view_group':
        this._setState({
          roomId: null,
          roomAlias: null
        });

        break;

      case 'view_room_error':
        this._viewRoomError(payload);

        break;

      case 'will_join':
        this._setState({
          joining: true
        });

        break;

      case 'cancel_join':
        this._setState({
          joining: false
        });

        break;
      // join_room:
      //      - opts: options for joinRoom

      case 'join_room':
        this._joinRoom(payload);

        break;

      case 'join_room_error':
        this._joinRoomError(payload);

        break;

      case 'join_room_ready':
        this._setState({
          shouldPeek: false
        });

        break;

      case 'on_client_not_viable':
      case 'on_logged_out':
        this.reset();
        break;

      case 'forward_event':
        this._setState({
          forwardingEvent: payload.event
        });

        break;

      case 'reply_to_event':
        // If currently viewed room does not match the room in which we wish to reply then change rooms
        // this can happen when performing a search across all rooms
        if (payload.event && payload.event.getRoomId() !== this._state.roomId) {
          _dispatcher.default.dispatch({
            action: 'view_room',
            room_id: payload.event.getRoomId(),
            replyingToEvent: payload.event
          });
        } else {
          this._setState({
            replyingToEvent: payload.event
          });
        }

        break;

      case 'open_room_settings':
        {
          const RoomSettingsDialog = sdk.getComponent("dialogs.RoomSettingsDialog");

          _Modal.default.createTrackedDialog('Room settings', '', RoomSettingsDialog, {
            roomId: payload.room_id || this._state.roomId
          },
          /*className=*/
          null,
          /*isPriority=*/
          false,
          /*isStatic=*/
          true);

          break;
        }

      case 'sync_state':
        this._setState({
          matrixClientIsReady: _MatrixClientPeg.MatrixClientPeg.get() && _MatrixClientPeg.MatrixClientPeg.get().isInitialSyncComplete()
        });

        break;
    }
  }

  async _viewRoom(payload) {
    if (payload.room_id) {
      const newState = {
        roomId: payload.room_id,
        roomAlias: payload.room_alias,
        initialEventId: payload.event_id,
        isInitialEventHighlighted: payload.highlighted,
        forwardingEvent: null,
        roomLoading: false,
        roomLoadError: null,
        // should peek by default
        shouldPeek: payload.should_peek === undefined ? true : payload.should_peek,
        // have we sent a join request for this room and are waiting for a response?
        joining: payload.joining || false,
        // Reset replyingToEvent because we don't want cross-room because bad UX
        replyingToEvent: null,
        // pull the user out of Room Settings
        isEditingSettings: false
      }; // Allow being given an event to be replied to when switching rooms but sanity check its for this room

      if (payload.replyingToEvent && payload.replyingToEvent.getRoomId() === payload.room_id) {
        newState.replyingToEvent = payload.replyingToEvent;
      }

      if (this._state.forwardingEvent) {
        _dispatcher.default.dispatch({
          action: 'send_event',
          room_id: newState.roomId,
          event: this._state.forwardingEvent
        });
      }

      this._setState(newState);

      if (payload.auto_join) {
        this._joinRoom(payload);
      }
    } else if (payload.room_alias) {
      // Try the room alias to room ID navigation cache first to avoid
      // blocking room navigation on the homeserver.
      let roomId = (0, _RoomAliasCache.getCachedRoomIDForAlias)(payload.room_alias);

      if (!roomId) {
        // Room alias cache miss, so let's ask the homeserver. Resolve the alias
        // and then do a second dispatch with the room ID acquired.
        this._setState({
          roomId: null,
          initialEventId: null,
          initialEventPixelOffset: null,
          isInitialEventHighlighted: null,
          roomAlias: payload.room_alias,
          roomLoading: true,
          roomLoadError: null
        });

        try {
          const result = await _MatrixClientPeg.MatrixClientPeg.get().getRoomIdForAlias(payload.room_alias);
          (0, _RoomAliasCache.storeRoomAliasInCache)(payload.room_alias, result.room_id);
          roomId = result.room_id;
        } catch (err) {
          _dispatcher.default.dispatch({
            action: 'view_room_error',
            room_id: null,
            room_alias: payload.room_alias,
            err
          });

          return;
        }
      }

      _dispatcher.default.dispatch({
        action: 'view_room',
        room_id: roomId,
        event_id: payload.event_id,
        highlighted: payload.highlighted,
        room_alias: payload.room_alias,
        auto_join: payload.auto_join,
        oob_data: payload.oob_data
      });
    }
  }

  _viewRoomError(payload) {
    this._setState({
      roomId: payload.room_id,
      roomAlias: payload.room_alias,
      roomLoading: false,
      roomLoadError: payload.err
    });
  }

  _joinRoom(payload) {
    this._setState({
      joining: true
    });

    _MatrixClientPeg.MatrixClientPeg.get().joinRoom(this._state.roomAlias || this._state.roomId, payload.opts).then(() => {
      // We do *not* clear the 'joining' flag because the Room object and/or our 'joined' member event may not
      // have come down the sync stream yet, and that's the point at which we'd consider the user joined to the
      // room.
      _dispatcher.default.dispatch({
        action: 'join_room_ready'
      });
    }, err => {
      _dispatcher.default.dispatch({
        action: 'join_room_error',
        err: err
      });

      let msg = err.message ? err.message : JSON.stringify(err); // XXX: We are relying on the error message returned by browsers here.
      // This isn't great, but it does generalize the error being shown to users.

      if (msg && msg.startsWith("CORS request rejected")) {
        msg = (0, _languageHandler._t)("There was an error joining the room");
      }

      if (err.errcode === 'M_INCOMPATIBLE_ROOM_VERSION') {
        msg = /*#__PURE__*/React.createElement("div", null, (0, _languageHandler._t)("Sorry, your homeserver is too old to participate in this room."), /*#__PURE__*/React.createElement("br", null), (0, _languageHandler._t)("Please contact your homeserver administrator."));
      }

      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to join room', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to join room"),
        description: msg
      });
    });
  }

  _joinRoomError(payload) {
    this._setState({
      joining: false,
      joinError: payload.err
    });
  }

  reset() {
    this._state = Object.assign({}, INITIAL_STATE);
  } // The room ID of the room currently being viewed


  getRoomId() {
    return this._state.roomId;
  } // The event to scroll to when the room is first viewed


  getInitialEventId() {
    return this._state.initialEventId;
  } // Whether to highlight the initial event


  isInitialEventHighlighted() {
    return this._state.isInitialEventHighlighted;
  } // The room alias of the room (or null if not originally specified in view_room)


  getRoomAlias() {
    return this._state.roomAlias;
  } // Whether the current room is loading (true whilst resolving an alias)


  isRoomLoading() {
    return this._state.roomLoading;
  } // Any error that has occurred during loading


  getRoomLoadError() {
    return this._state.roomLoadError;
  } // True if we're expecting the user to be joined to the room currently being
  // viewed. Note that this is left true after the join request has finished,
  // since we should still consider a join to be in progress until the room
  // & member events come down the sync.
  //
  // This flag remains true after the room has been sucessfully joined,
  // (this store doesn't listen for the appropriate member events)
  // so you should always observe the joined state from the member event
  // if a room object is present.
  // ie. The correct logic is:
  // if (room) {
  //     if (myMember.membership == 'joined') {
  //         // user is joined to the room
  //     } else {
  //         // Not joined
  //     }
  // } else {
  //     if (RoomViewStore.isJoining()) {
  //         // show spinner
  //     } else {
  //         // show join prompt
  //     }
  // }


  isJoining() {
    return this._state.joining;
  } // Any error that has occurred during joining


  getJoinError() {
    return this._state.joinError;
  } // The mxEvent if one is about to be forwarded


  getForwardingEvent() {
    return this._state.forwardingEvent;
  } // The mxEvent if one is currently being replied to/quoted


  getQuotingEvent() {
    return this._state.replyingToEvent;
  }

  shouldPeek() {
    return this._state.shouldPeek && this._state.matrixClientIsReady;
  }

}

let singletonRoomViewStore = null;

if (!singletonRoomViewStore) {
  singletonRoomViewStore = new RoomViewStore();
}

var _default = singletonRoomViewStore;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvUm9vbVZpZXdTdG9yZS5qcyJdLCJuYW1lcyI6WyJJTklUSUFMX1NUQVRFIiwiam9pbmluZyIsImpvaW5FcnJvciIsInJvb21JZCIsImluaXRpYWxFdmVudElkIiwiaXNJbml0aWFsRXZlbnRIaWdobGlnaHRlZCIsInJvb21BbGlhcyIsInJvb21Mb2FkaW5nIiwicm9vbUxvYWRFcnJvciIsImZvcndhcmRpbmdFdmVudCIsInF1b3RpbmdFdmVudCIsIm1hdHJpeENsaWVudElzUmVhZHkiLCJSb29tVmlld1N0b3JlIiwiU3RvcmUiLCJjb25zdHJ1Y3RvciIsImRpcyIsIl9zdGF0ZSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzSW5pdGlhbFN5bmNDb21wbGV0ZSIsIl9zZXRTdGF0ZSIsIm5ld1N0YXRlIiwic3RhdGVDaGFuZ2VkIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsImFzc2lnbiIsIl9fZW1pdENoYW5nZSIsIl9fb25EaXNwYXRjaCIsInBheWxvYWQiLCJhY3Rpb24iLCJfdmlld1Jvb20iLCJfdmlld1Jvb21FcnJvciIsIl9qb2luUm9vbSIsIl9qb2luUm9vbUVycm9yIiwic2hvdWxkUGVlayIsInJlc2V0IiwiZXZlbnQiLCJnZXRSb29tSWQiLCJkaXNwYXRjaCIsInJvb21faWQiLCJyZXBseWluZ1RvRXZlbnQiLCJSb29tU2V0dGluZ3NEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJyb29tX2FsaWFzIiwiZXZlbnRfaWQiLCJoaWdobGlnaHRlZCIsInNob3VsZF9wZWVrIiwidW5kZWZpbmVkIiwiaXNFZGl0aW5nU2V0dGluZ3MiLCJhdXRvX2pvaW4iLCJpbml0aWFsRXZlbnRQaXhlbE9mZnNldCIsInJlc3VsdCIsImdldFJvb21JZEZvckFsaWFzIiwiZXJyIiwib29iX2RhdGEiLCJqb2luUm9vbSIsIm9wdHMiLCJ0aGVuIiwibXNnIiwibWVzc2FnZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFydHNXaXRoIiwiZXJyY29kZSIsIkVycm9yRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImdldEluaXRpYWxFdmVudElkIiwiZ2V0Um9vbUFsaWFzIiwiaXNSb29tTG9hZGluZyIsImdldFJvb21Mb2FkRXJyb3IiLCJpc0pvaW5pbmciLCJnZXRKb2luRXJyb3IiLCJnZXRGb3J3YXJkaW5nRXZlbnQiLCJnZXRRdW90aW5nRXZlbnQiLCJzaW5nbGV0b25Sb29tVmlld1N0b3JlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF2QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLE1BQU1BLGFBQWEsR0FBRztBQUNsQjtBQUNBQyxFQUFBQSxPQUFPLEVBQUUsS0FGUztBQUdsQjtBQUNBQyxFQUFBQSxTQUFTLEVBQUUsSUFKTztBQUtsQjtBQUNBQyxFQUFBQSxNQUFNLEVBQUUsSUFOVTtBQVFsQjtBQUNBQyxFQUFBQSxjQUFjLEVBQUUsSUFURTtBQVVsQjtBQUNBQyxFQUFBQSx5QkFBeUIsRUFBRSxLQVhUO0FBYWxCO0FBQ0FDLEVBQUFBLFNBQVMsRUFBRSxJQWRPO0FBZWxCO0FBQ0FDLEVBQUFBLFdBQVcsRUFBRSxLQWhCSztBQWlCbEI7QUFDQUMsRUFBQUEsYUFBYSxFQUFFLElBbEJHO0FBb0JsQkMsRUFBQUEsZUFBZSxFQUFFLElBcEJDO0FBc0JsQkMsRUFBQUEsWUFBWSxFQUFFLElBdEJJO0FBdUJsQkMsRUFBQUEsbUJBQW1CLEVBQUU7QUF2QkgsQ0FBdEI7QUEwQkE7Ozs7OztBQUtBLE1BQU1DLGFBQU4sU0FBNEJDLFlBQTVCLENBQWtDO0FBQzlCQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixVQUFNQyxtQkFBTixFQURVLENBR1Y7O0FBQ0EsU0FBS0MsTUFBTCxHQUFjaEIsYUFBZDs7QUFDQSxRQUFJaUIsaUNBQWdCQyxHQUFoQixFQUFKLEVBQTJCO0FBQ3ZCLFdBQUtGLE1BQUwsQ0FBWUws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QUNYLFdBQU8sS0FBSzVELE1BQUwsQ0FBWWQsU0FBbkI7QUFDSCxHQXBUNkIsQ0FzVDlCOzs7QUFDQTJFLEVBQUFBLGtCQUFrQixHQUFHO0FBQ2pCLFdBQU8sS0FBSzdELE1BQUwsQ0FBWVAsZUFBbkI7QUFDSCxHQXpUNkIsQ0EyVDlCOzs7QUFDQXFFLEVBQUFBLGVBQWUsR0FBRztBQUNkLFdBQU8sS0FBSzlELE1BQUwsQ0FBWXlCLGVBQW5CO0FBQ0g7O0FBRUROLEVBQUFBLFVBQVUsR0FBRztBQUNULFdBQU8sS0FBS25CLE1BQUwsQ0FBWW1CLFVBQVosSUFBMEIsS0FBS25CLE1BQUwsQ0FBWUwsbUJBQTdDO0FBQ0g7O0FBbFU2Qjs7QUFxVWxDLElBQUlvRSxzQkFBc0IsR0FBRyxJQUE3Qjs7QUFDQSxJQUFJLENBQUNBLHNCQUFMLEVBQTZCO0FBQ3pCQSxFQUFBQSxzQkFBc0IsR0FBRyxJQUFJbkUsYUFBSixFQUF6QjtBQUNIOztlQUNjbUUsc0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgZGlzIGZyb20gJy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQge1N0b3JlfSBmcm9tICdmbHV4L3V0aWxzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi9Nb2RhbCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgeyBnZXRDYWNoZWRSb29tSURGb3JBbGlhcywgc3RvcmVSb29tQWxpYXNJbkNhY2hlIH0gZnJvbSAnLi4vUm9vbUFsaWFzQ2FjaGUnO1xuXG5jb25zdCBJTklUSUFMX1NUQVRFID0ge1xuICAgIC8vIFdoZXRoZXIgd2UncmUgam9pbmluZyB0aGUgY3VycmVudGx5IHZpZXdlZCByb29tIChzZWUgaXNKb2luaW5nKCkpXG4gICAgam9pbmluZzogZmFsc2UsXG4gICAgLy8gQW55IGVycm9yIHRoYXQgaGFzIG9jY3VycmVkIGR1cmluZyBqb2luaW5nXG4gICAgam9pbkVycm9yOiBudWxsLFxuICAgIC8vIFRoZSByb29tIElEIG9mIHRoZSByb29tIGN1cnJlbnRseSBiZWluZyB2aWV3ZWRcbiAgICByb29tSWQ6IG51bGwsXG5cbiAgICAvLyBUaGUgZXZlbnQgdG8gc2Nyb2xsIHRvIHdoZW4gdGhlIHJvb20gaXMgZmlyc3Qgdmlld2VkXG4gICAgaW5pdGlhbEV2ZW50SWQ6IG51bGwsXG4gICAgLy8gV2hldGhlciB0byBoaWdobGlnaHQgdGhlIGluaXRpYWwgZXZlbnRcbiAgICBpc0luaXRpYWxFdmVudEhpZ2hsaWdodGVkOiBmYWxzZSxcblxuICAgIC8vIFRoZSByb29tIGFsaWFzIG9mIHRoZSByb29tIChvciBudWxsIGlmIG5vdCBvcmlnaW5hbGx5IHNwZWNpZmllZCBpbiB2aWV3X3Jvb20pXG4gICAgcm9vbUFsaWFzOiBudWxsLFxuICAgIC8vIFdoZXRoZXIgdGhlIGN1cnJlbnQgcm9vbSBpcyBsb2FkaW5nXG4gICAgcm9vbUxvYWRpbmc6IGZhbHNlLFxuICAgIC8vIEFueSBlcnJvciB0aGF0IGhhcyBvY2N1cnJlZCBkdXJpbmcgbG9hZGluZ1xuICAgIHJvb21Mb2FkRXJyb3I6IG51bGwsXG5cbiAgICBmb3J3YXJkaW5nRXZlbnQ6IG51bGwsXG5cbiAgICBxdW90aW5nRXZlbnQ6IG51bGwsXG4gICAgbWF0cml4Q2xpZW50SXNSZWFkeTogZmFsc2UsXG59O1xuXG4vKipcbiAqIEEgY2xhc3MgZm9yIHN0b3JpbmcgYXBwbGljYXRpb24gc3RhdGUgZm9yIFJvb21WaWV3LiBUaGlzIGlzIHRoZSBSb29tVmlldydzIGludGVyZmFjZVxuKiAgd2l0aCBhIHN1YnNldCBvZiB0aGUganMtc2RrLlxuICogIGBgYFxuICovXG5jbGFzcyBSb29tVmlld1N0b3JlIGV4dGVuZHMgU3RvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihkaXMpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpc2Ugc3RhdGVcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBJTklUSUFMX1NUQVRFO1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZS5tYXRyaXhDbGllbnRJc1JlYWR5ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzSW5pdGlhbFN5bmNDb21wbGV0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldFN0YXRlKG5ld1N0YXRlKSB7XG4gICAgICAgIC8vIElmIHZhbHVlcyBoYXZlbid0IGNoYW5nZWQsIHRoZXJlJ3Mgbm90aGluZyB0byBkby5cbiAgICAgICAgLy8gVGhpcyBvbmx5IHRyaWVzIGEgc2hhbGxvdyBjb21wYXJpc29uLCBzbyB1bmNoYW5nZWQgb2JqZWN0cyB3aWxsIHNsaXBcbiAgICAgICAgLy8gdGhyb3VnaCwgYnV0IHRoYXQncyBwcm9iYWJseSBva2F5IGZvciBub3cuXG4gICAgICAgIGxldCBzdGF0ZUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMobmV3U3RhdGUpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3RhdGVba2V5XSAhPT0gbmV3U3RhdGVba2V5XSkge1xuICAgICAgICAgICAgICAgIHN0YXRlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdGF0ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N0YXRlID0gT2JqZWN0LmFzc2lnbih0aGlzLl9zdGF0ZSwgbmV3U3RhdGUpO1xuICAgICAgICB0aGlzLl9fZW1pdENoYW5nZSgpO1xuICAgIH1cblxuICAgIF9fb25EaXNwYXRjaChwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIHZpZXdfcm9vbTpcbiAgICAgICAgICAgIC8vICAgICAgLSByb29tX2FsaWFzOiAgICcjc29tZWFsaWFzOm1hdHJpeC5vcmcnXG4gICAgICAgICAgICAvLyAgICAgIC0gcm9vbV9pZDogICAgICAnIXJvb21pZDEyMzptYXRyaXgub3JnJ1xuICAgICAgICAgICAgLy8gICAgICAtIGV2ZW50X2lkOiAgICAgJyQyMTM0NTY3ODI6bWF0cml4Lm9yZydcbiAgICAgICAgICAgIC8vICAgICAgLSBldmVudF9vZmZzZXQ6IDEwMFxuICAgICAgICAgICAgLy8gICAgICAtIGhpZ2hsaWdodGVkOiAgdHJ1ZVxuICAgICAgICAgICAgY2FzZSAndmlld19yb29tJzpcbiAgICAgICAgICAgICAgICB0aGlzLl92aWV3Um9vbShwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfbXlfZ3JvdXBzJzpcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfZ3JvdXAnOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbUlkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICByb29tQWxpYXM6IG51bGwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aWV3X3Jvb21fZXJyb3InOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ZpZXdSb29tRXJyb3IocGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd3aWxsX2pvaW4nOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgam9pbmluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NhbmNlbF9qb2luJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGpvaW5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gam9pbl9yb29tOlxuICAgICAgICAgICAgLy8gICAgICAtIG9wdHM6IG9wdGlvbnMgZm9yIGpvaW5Sb29tXG4gICAgICAgICAgICBjYXNlICdqb2luX3Jvb20nOlxuICAgICAgICAgICAgICAgIHRoaXMuX2pvaW5Sb29tKHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnam9pbl9yb29tX2Vycm9yJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9qb2luUm9vbUVycm9yKHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnam9pbl9yb29tX3JlYWR5JzpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7IHNob3VsZFBlZWs6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25fY2xpZW50X25vdF92aWFibGUnOlxuICAgICAgICAgICAgY2FzZSAnb25fbG9nZ2VkX291dCc6XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZm9yd2FyZF9ldmVudCc6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBmb3J3YXJkaW5nRXZlbnQ6IHBheWxvYWQuZXZlbnQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyZXBseV90b19ldmVudCc6XG4gICAgICAgICAgICAgICAgLy8gSWYgY3VycmVudGx5IHZpZXdlZCByb29tIGRvZXMgbm90IG1hdGNoIHRoZSByb29tIGluIHdoaWNoIHdlIHdpc2ggdG8gcmVwbHkgdGhlbiBjaGFuZ2Ugcm9vbXNcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGNhbiBoYXBwZW4gd2hlbiBwZXJmb3JtaW5nIGEgc2VhcmNoIGFjcm9zcyBhbGwgcm9vbXNcbiAgICAgICAgICAgICAgICBpZiAocGF5bG9hZC5ldmVudCAmJiBwYXlsb2FkLmV2ZW50LmdldFJvb21JZCgpICE9PSB0aGlzLl9zdGF0ZS5yb29tSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tX2lkOiBwYXlsb2FkLmV2ZW50LmdldFJvb21JZCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbHlpbmdUb0V2ZW50OiBwYXlsb2FkLmV2ZW50LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXBseWluZ1RvRXZlbnQ6IHBheWxvYWQuZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29wZW5fcm9vbV9zZXR0aW5ncyc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBSb29tU2V0dGluZ3NEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5Sb29tU2V0dGluZ3NEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnUm9vbSBzZXR0aW5ncycsICcnLCBSb29tU2V0dGluZ3NEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbUlkOiBwYXlsb2FkLnJvb21faWQgfHwgdGhpcy5fc3RhdGUucm9vbUlkLFxuICAgICAgICAgICAgICAgIH0sIC8qY2xhc3NOYW1lPSovbnVsbCwgLyppc1ByaW9yaXR5PSovZmFsc2UsIC8qaXNTdGF0aWM9Ki90cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3N5bmNfc3RhdGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4Q2xpZW50SXNSZWFkeTogTWF0cml4Q2xpZW50UGVnLmdldCgpICYmIE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0luaXRpYWxTeW5jQ29tcGxldGUoKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF92aWV3Um9vbShwYXlsb2FkKSB7XG4gICAgICAgIGlmIChwYXlsb2FkLnJvb21faWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xuICAgICAgICAgICAgICAgIHJvb21JZDogcGF5bG9hZC5yb29tX2lkLFxuICAgICAgICAgICAgICAgIHJvb21BbGlhczogcGF5bG9hZC5yb29tX2FsaWFzLFxuICAgICAgICAgICAgICAgIGluaXRpYWxFdmVudElkOiBwYXlsb2FkLmV2ZW50X2lkLFxuICAgICAgICAgICAgICAgIGlzSW5pdGlhbEV2ZW50SGlnaGxpZ2h0ZWQ6IHBheWxvYWQuaGlnaGxpZ2h0ZWQsXG4gICAgICAgICAgICAgICAgZm9yd2FyZGluZ0V2ZW50OiBudWxsLFxuICAgICAgICAgICAgICAgIHJvb21Mb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByb29tTG9hZEVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBwZWVrIGJ5IGRlZmF1bHRcbiAgICAgICAgICAgICAgICBzaG91bGRQZWVrOiBwYXlsb2FkLnNob3VsZF9wZWVrID09PSB1bmRlZmluZWQgPyB0cnVlIDogcGF5bG9hZC5zaG91bGRfcGVlayxcbiAgICAgICAgICAgICAgICAvLyBoYXZlIHdlIHNlbnQgYSBqb2luIHJlcXVlc3QgZm9yIHRoaXMgcm9vbSBhbmQgYXJlIHdhaXRpbmcgZm9yIGEgcmVzcG9uc2U/XG4gICAgICAgICAgICAgICAgam9pbmluZzogcGF5bG9hZC5qb2luaW5nIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgIC8vIFJlc2V0IHJlcGx5aW5nVG9FdmVudCBiZWNhdXNlIHdlIGRvbid0IHdhbnQgY3Jvc3Mtcm9vbSBiZWNhdXNlIGJhZCBVWFxuICAgICAgICAgICAgICAgIHJlcGx5aW5nVG9FdmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICAvLyBwdWxsIHRoZSB1c2VyIG91dCBvZiBSb29tIFNldHRpbmdzXG4gICAgICAgICAgICAgICAgaXNFZGl0aW5nU2V0dGluZ3M6IGZhbHNlLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gQWxsb3cgYmVpbmcgZ2l2ZW4gYW4gZXZlbnQgdG8gYmUgcmVwbGllZCB0byB3aGVuIHN3aXRjaGluZyByb29tcyBidXQgc2FuaXR5IGNoZWNrIGl0cyBmb3IgdGhpcyByb29tXG4gICAgICAgICAgICBpZiAocGF5bG9hZC5yZXBseWluZ1RvRXZlbnQgJiYgcGF5bG9hZC5yZXBseWluZ1RvRXZlbnQuZ2V0Um9vbUlkKCkgPT09IHBheWxvYWQucm9vbV9pZCkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJlcGx5aW5nVG9FdmVudCA9IHBheWxvYWQucmVwbHlpbmdUb0V2ZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUuZm9yd2FyZGluZ0V2ZW50KSB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc2VuZF9ldmVudCcsXG4gICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IG5ld1N0YXRlLnJvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IHRoaXMuX3N0YXRlLmZvcndhcmRpbmdFdmVudCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUobmV3U3RhdGUpO1xuXG4gICAgICAgICAgICBpZiAocGF5bG9hZC5hdXRvX2pvaW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9qb2luUm9vbShwYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwYXlsb2FkLnJvb21fYWxpYXMpIHtcbiAgICAgICAgICAgIC8vIFRyeSB0aGUgcm9vbSBhbGlhcyB0byByb29tIElEIG5hdmlnYXRpb24gY2FjaGUgZmlyc3QgdG8gYXZvaWRcbiAgICAgICAgICAgIC8vIGJsb2NraW5nIHJvb20gbmF2aWdhdGlvbiBvbiB0aGUgaG9tZXNlcnZlci5cbiAgICAgICAgICAgIGxldCByb29tSWQgPSBnZXRDYWNoZWRSb29tSURGb3JBbGlhcyhwYXlsb2FkLnJvb21fYWxpYXMpO1xuICAgICAgICAgICAgaWYgKCFyb29tSWQpIHtcbiAgICAgICAgICAgICAgICAvLyBSb29tIGFsaWFzIGNhY2hlIG1pc3MsIHNvIGxldCdzIGFzayB0aGUgaG9tZXNlcnZlci4gUmVzb2x2ZSB0aGUgYWxpYXNcbiAgICAgICAgICAgICAgICAvLyBhbmQgdGhlbiBkbyBhIHNlY29uZCBkaXNwYXRjaCB3aXRoIHRoZSByb29tIElEIGFjcXVpcmVkLlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbUlkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsRXZlbnRJZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbEV2ZW50UGl4ZWxPZmZzZXQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGlzSW5pdGlhbEV2ZW50SGlnaGxpZ2h0ZWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHJvb21BbGlhczogcGF5bG9hZC5yb29tX2FsaWFzLFxuICAgICAgICAgICAgICAgICAgICByb29tTG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcm9vbUxvYWRFcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbUlkRm9yQWxpYXMocGF5bG9hZC5yb29tX2FsaWFzKTtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVSb29tQWxpYXNJbkNhY2hlKHBheWxvYWQucm9vbV9hbGlhcywgcmVzdWx0LnJvb21faWQpO1xuICAgICAgICAgICAgICAgICAgICByb29tSWQgPSByZXN1bHQucm9vbV9pZDtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbV9lcnJvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9hbGlhczogcGF5bG9hZC5yb29tX2FsaWFzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgICAgICAgICBldmVudF9pZDogcGF5bG9hZC5ldmVudF9pZCxcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZDogcGF5bG9hZC5oaWdobGlnaHRlZCxcbiAgICAgICAgICAgICAgICByb29tX2FsaWFzOiBwYXlsb2FkLnJvb21fYWxpYXMsXG4gICAgICAgICAgICAgICAgYXV0b19qb2luOiBwYXlsb2FkLmF1dG9fam9pbixcbiAgICAgICAgICAgICAgICBvb2JfZGF0YTogcGF5bG9hZC5vb2JfZGF0YSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3ZpZXdSb29tRXJyb3IocGF5bG9hZCkge1xuICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICByb29tSWQ6IHBheWxvYWQucm9vbV9pZCxcbiAgICAgICAgICAgIHJvb21BbGlhczogcGF5bG9hZC5yb29tX2FsaWFzLFxuICAgICAgICAgICAgcm9vbUxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgcm9vbUxvYWRFcnJvcjogcGF5bG9hZC5lcnIsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9qb2luUm9vbShwYXlsb2FkKSB7XG4gICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgIGpvaW5pbmc6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuam9pblJvb20oXG4gICAgICAgICAgICB0aGlzLl9zdGF0ZS5yb29tQWxpYXMgfHwgdGhpcy5fc3RhdGUucm9vbUlkLCBwYXlsb2FkLm9wdHMsXG4gICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBXZSBkbyAqbm90KiBjbGVhciB0aGUgJ2pvaW5pbmcnIGZsYWcgYmVjYXVzZSB0aGUgUm9vbSBvYmplY3QgYW5kL29yIG91ciAnam9pbmVkJyBtZW1iZXIgZXZlbnQgbWF5IG5vdFxuICAgICAgICAgICAgLy8gaGF2ZSBjb21lIGRvd24gdGhlIHN5bmMgc3RyZWFtIHlldCwgYW5kIHRoYXQncyB0aGUgcG9pbnQgYXQgd2hpY2ggd2UnZCBjb25zaWRlciB0aGUgdXNlciBqb2luZWQgdG8gdGhlXG4gICAgICAgICAgICAvLyByb29tLlxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHsgYWN0aW9uOiAnam9pbl9yb29tX3JlYWR5JyB9KTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdqb2luX3Jvb21fZXJyb3InLFxuICAgICAgICAgICAgICAgIGVycjogZXJyLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsZXQgbXNnID0gZXJyLm1lc3NhZ2UgPyBlcnIubWVzc2FnZSA6IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgICAgICAvLyBYWFg6IFdlIGFyZSByZWx5aW5nIG9uIHRoZSBlcnJvciBtZXNzYWdlIHJldHVybmVkIGJ5IGJyb3dzZXJzIGhlcmUuXG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGdyZWF0LCBidXQgaXQgZG9lcyBnZW5lcmFsaXplIHRoZSBlcnJvciBiZWluZyBzaG93biB0byB1c2Vycy5cbiAgICAgICAgICAgIGlmIChtc2cgJiYgbXNnLnN0YXJ0c1dpdGgoXCJDT1JTIHJlcXVlc3QgcmVqZWN0ZWRcIikpIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBfdChcIlRoZXJlIHdhcyBhbiBlcnJvciBqb2luaW5nIHRoZSByb29tXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVyci5lcnJjb2RlID09PSAnTV9JTkNPTVBBVElCTEVfUk9PTV9WRVJTSU9OJykge1xuICAgICAgICAgICAgICAgIG1zZyA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlNvcnJ5LCB5b3VyIGhvbWVzZXJ2ZXIgaXMgdG9vIG9sZCB0byBwYXJ0aWNpcGF0ZSBpbiB0aGlzIHJvb20uXCIpfTxiciAvPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJQbGVhc2UgY29udGFjdCB5b3VyIGhvbWVzZXJ2ZXIgYWRtaW5pc3RyYXRvci5cIil9XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBqb2luIHJvb20nLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJGYWlsZWQgdG8gam9pbiByb29tXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBtc2csXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2pvaW5Sb29tRXJyb3IocGF5bG9hZCkge1xuICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICBqb2luaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGpvaW5FcnJvcjogcGF5bG9hZC5lcnIsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIElOSVRJQUxfU1RBVEUpO1xuICAgIH1cblxuICAgIC8vIFRoZSByb29tIElEIG9mIHRoZSByb29tIGN1cnJlbnRseSBiZWluZyB2aWV3ZWRcbiAgICBnZXRSb29tSWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5yb29tSWQ7XG4gICAgfVxuXG4gICAgLy8gVGhlIGV2ZW50IHRvIHNjcm9sbCB0byB3aGVuIHRoZSByb29tIGlzIGZpcnN0IHZpZXdlZFxuICAgIGdldEluaXRpYWxFdmVudElkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUuaW5pdGlhbEV2ZW50SWQ7XG4gICAgfVxuXG4gICAgLy8gV2hldGhlciB0byBoaWdobGlnaHQgdGhlIGluaXRpYWwgZXZlbnRcbiAgICBpc0luaXRpYWxFdmVudEhpZ2hsaWdodGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUuaXNJbml0aWFsRXZlbnRIaWdobGlnaHRlZDtcbiAgICB9XG5cbiAgICAvLyBUaGUgcm9vbSBhbGlhcyBvZiB0aGUgcm9vbSAob3IgbnVsbCBpZiBub3Qgb3JpZ2luYWxseSBzcGVjaWZpZWQgaW4gdmlld19yb29tKVxuICAgIGdldFJvb21BbGlhcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLnJvb21BbGlhcztcbiAgICB9XG5cbiAgICAvLyBXaGV0aGVyIHRoZSBjdXJyZW50IHJvb20gaXMgbG9hZGluZyAodHJ1ZSB3aGlsc3QgcmVzb2x2aW5nIGFuIGFsaWFzKVxuICAgIGlzUm9vbUxvYWRpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5yb29tTG9hZGluZztcbiAgICB9XG5cbiAgICAvLyBBbnkgZXJyb3IgdGhhdCBoYXMgb2NjdXJyZWQgZHVyaW5nIGxvYWRpbmdcbiAgICBnZXRSb29tTG9hZEVycm9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUucm9vbUxvYWRFcnJvcjtcbiAgICB9XG5cbiAgICAvLyBUcnVlIGlmIHdlJ3JlIGV4cGVjdGluZyB0aGUgdXNlciB0byBiZSBqb2luZWQgdG8gdGhlIHJvb20gY3VycmVudGx5IGJlaW5nXG4gICAgLy8gdmlld2VkLiBOb3RlIHRoYXQgdGhpcyBpcyBsZWZ0IHRydWUgYWZ0ZXIgdGhlIGpvaW4gcmVxdWVzdCBoYXMgZmluaXNoZWQsXG4gICAgLy8gc2luY2Ugd2Ugc2hvdWxkIHN0aWxsIGNvbnNpZGVyIGEgam9pbiB0byBiZSBpbiBwcm9ncmVzcyB1bnRpbCB0aGUgcm9vbVxuICAgIC8vICYgbWVtYmVyIGV2ZW50cyBjb21lIGRvd24gdGhlIHN5bmMuXG4gICAgLy9cbiAgICAvLyBUaGlzIGZsYWcgcmVtYWlucyB0cnVlIGFmdGVyIHRoZSByb29tIGhhcyBiZWVuIHN1Y2Vzc2Z1bGx5IGpvaW5lZCxcbiAgICAvLyAodGhpcyBzdG9yZSBkb2Vzbid0IGxpc3RlbiBmb3IgdGhlIGFwcHJvcHJpYXRlIG1lbWJlciBldmVudHMpXG4gICAgLy8gc28geW91IHNob3VsZCBhbHdheXMgb2JzZXJ2ZSB0aGUgam9pbmVkIHN0YXRlIGZyb20gdGhlIG1lbWJlciBldmVudFxuICAgIC8vIGlmIGEgcm9vbSBvYmplY3QgaXMgcHJlc2VudC5cbiAgICAvLyBpZS4gVGhlIGNvcnJlY3QgbG9naWMgaXM6XG4gICAgLy8gaWYgKHJvb20pIHtcbiAgICAvLyAgICAgaWYgKG15TWVtYmVyLm1lbWJlcnNoaXAgPT0gJ2pvaW5lZCcpIHtcbiAgICAvLyAgICAgICAgIC8vIHVzZXIgaXMgam9pbmVkIHRvIHRoZSByb29tXG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICAvLyBOb3Qgam9pbmVkXG4gICAgLy8gICAgIH1cbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICBpZiAoUm9vbVZpZXdTdG9yZS5pc0pvaW5pbmcoKSkge1xuICAgIC8vICAgICAgICAgLy8gc2hvdyBzcGlubmVyXG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICAvLyBzaG93IGpvaW4gcHJvbXB0XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG4gICAgaXNKb2luaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUuam9pbmluZztcbiAgICB9XG5cbiAgICAvLyBBbnkgZXJyb3IgdGhhdCBoYXMgb2NjdXJyZWQgZHVyaW5nIGpvaW5pbmdcbiAgICBnZXRKb2luRXJyb3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5qb2luRXJyb3I7XG4gICAgfVxuXG4gICAgLy8gVGhlIG14RXZlbnQgaWYgb25lIGlzIGFib3V0IHRvIGJlIGZvcndhcmRlZFxuICAgIGdldEZvcndhcmRpbmdFdmVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLmZvcndhcmRpbmdFdmVudDtcbiAgICB9XG5cbiAgICAvLyBUaGUgbXhFdmVudCBpZiBvbmUgaXMgY3VycmVudGx5IGJlaW5nIHJlcGxpZWQgdG8vcXVvdGVkXG4gICAgZ2V0UXVvdGluZ0V2ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUucmVwbHlpbmdUb0V2ZW50O1xuICAgIH1cblxuICAgIHNob3VsZFBlZWsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5zaG91bGRQZWVrICYmIHRoaXMuX3N0YXRlLm1hdHJpeENsaWVudElzUmVhZHk7XG4gICAgfVxufVxuXG5sZXQgc2luZ2xldG9uUm9vbVZpZXdTdG9yZSA9IG51bGw7XG5pZiAoIXNpbmdsZXRvblJvb21WaWV3U3RvcmUpIHtcbiAgICBzaW5nbGV0b25Sb29tVmlld1N0b3JlID0gbmV3IFJvb21WaWV3U3RvcmUoKTtcbn1cbmV4cG9ydCBkZWZhdWx0IHNpbmdsZXRvblJvb21WaWV3U3RvcmU7XG4iXX0=