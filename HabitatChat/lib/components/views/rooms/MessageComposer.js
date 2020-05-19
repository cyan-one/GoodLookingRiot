"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var _CallHandler = _interopRequireDefault(require("../../../CallHandler"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _Stickerpicker = _interopRequireDefault(require("./Stickerpicker"));

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var _ContentMessages = _interopRequireDefault(require("../../../ContentMessages"));

var _E2EIcon = _interopRequireDefault(require("./E2EIcon"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 New Vector Ltd

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
function ComposerAvatar(props) {
  const MemberStatusMessageAvatar = sdk.getComponent('avatars.MemberStatusMessageAvatar');
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_MessageComposer_avatar"
  }, /*#__PURE__*/_react.default.createElement(MemberStatusMessageAvatar, {
    member: props.me,
    width: 24,
    height: 24
  }));
}

ComposerAvatar.propTypes = {
  me: _propTypes.default.object.isRequired
};

function CallButton(props) {
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');

  const onVoiceCallClick = ev => {
    _dispatcher.default.dispatch({
      action: 'place_call',
      type: "voice",
      room_id: props.roomId
    });
  };

  return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
    className: "mx_MessageComposer_button mx_MessageComposer_voicecall",
    onClick: onVoiceCallClick,
    title: (0, _languageHandler._t)('Voice call')
  });
}

CallButton.propTypes = {
  roomId: _propTypes.default.string.isRequired
};

function VideoCallButton(props) {
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');

  const onCallClick = ev => {
    _dispatcher.default.dispatch({
      action: 'place_call',
      type: ev.shiftKey ? "screensharing" : "video",
      room_id: props.roomId
    });
  };

  return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
    className: "mx_MessageComposer_button mx_MessageComposer_videocall",
    onClick: onCallClick,
    title: (0, _languageHandler._t)('Video call')
  });
}

VideoCallButton.propTypes = {
  roomId: _propTypes.default.string.isRequired
};

function HangupButton(props) {
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');

  const onHangupClick = () => {
    const call = _CallHandler.default.getCallForRoom(props.roomId);

    if (!call) {
      return;
    }

    _dispatcher.default.dispatch({
      action: 'hangup',
      // hangup the call for this room, which may not be the room in props
      // (e.g. conferences which will hangup the 1:1 room instead)
      room_id: call.roomId
    });
  };

  return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
    className: "mx_MessageComposer_button mx_MessageComposer_hangup",
    onClick: onHangupClick,
    title: (0, _languageHandler._t)('Hangup')
  });
}

HangupButton.propTypes = {
  roomId: _propTypes.default.string.isRequired
};

class UploadButton extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onAction", payload => {
      if (payload.action === "upload_file") {
        this.onUploadClick();
      }
    });
    this.onUploadClick = this.onUploadClick.bind(this);
    this.onUploadFileInputChange = this.onUploadFileInputChange.bind(this);
    this._uploadInput = (0, _react.createRef)();
    this._dispatcherRef = _dispatcher.default.register(this.onAction);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this._dispatcherRef);
  }

  onUploadClick(ev) {
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      _dispatcher.default.dispatch({
        action: 'require_registration'
      });

      return;
    }

    this._uploadInput.current.click();
  }

  onUploadFileInputChange(ev) {
    if (ev.target.files.length === 0) return; // take a copy so we can safely reset the value of the form control
    // (Note it is a FileList: we can't use slice or sensible iteration).

    const tfiles = [];

    for (let i = 0; i < ev.target.files.length; ++i) {
      tfiles.push(ev.target.files[i]);
    }

    _ContentMessages.default.sharedInstance().sendContentListToRoom(tfiles, this.props.roomId, _MatrixClientPeg.MatrixClientPeg.get()); // This is the onChange handler for a file form control, but we're
    // not keeping any state, so reset the value of the form control
    // to empty.
    // NB. we need to set 'value': the 'files' property is immutable.


    ev.target.value = '';
  }

  render() {
    const uploadInputStyle = {
      display: 'none'
    };
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_MessageComposer_button mx_MessageComposer_upload",
      onClick: this.onUploadClick,
      title: (0, _languageHandler._t)('Upload file')
    }, /*#__PURE__*/_react.default.createElement("input", {
      ref: this._uploadInput,
      type: "file",
      style: uploadInputStyle,
      multiple: true,
      onChange: this.onUploadFileInputChange
    }));
  }

}

(0, _defineProperty2.default)(UploadButton, "propTypes", {
  roomId: _propTypes.default.string.isRequired
});

class MessageComposer extends _react.default.Component {
  constructor(props) {
    super(props);
    this.onInputStateChanged = this.onInputStateChanged.bind(this);
    this._onRoomStateEvents = this._onRoomStateEvents.bind(this);
    this._onRoomViewStoreUpdate = this._onRoomViewStoreUpdate.bind(this);
    this._onTombstoneClick = this._onTombstoneClick.bind(this);
    this.renderPlaceholderText = this.renderPlaceholderText.bind(this);
    this.state = {
      isQuoting: Boolean(_RoomViewStore.default.getQuotingEvent()),
      tombstone: this._getRoomTombstone(),
      canSendMessages: this.props.room.maySendMessage(),
      showCallButtons: _SettingsStore.default.getValue("showCallButtonsInComposer")
    };
  }

  componentDidMount() {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this._onRoomStateEvents);

    this._roomStoreToken = _RoomViewStore.default.addListener(this._onRoomViewStoreUpdate);

    this._waitForOwnMember();
  }

  _waitForOwnMember() {
    // if we have the member already, do that
    const me = this.props.room.getMember(_MatrixClientPeg.MatrixClientPeg.get().getUserId());

    if (me) {
      this.setState({
        me
      });
      return;
    } // Otherwise, wait for member loading to finish and then update the member for the avatar.
    // The members should already be loading, and loadMembersIfNeeded
    // will return the promise for the existing operation


    this.props.room.loadMembersIfNeeded().then(() => {
      const me = this.props.room.getMember(_MatrixClientPeg.MatrixClientPeg.get().getUserId());
      this.setState({
        me
      });
    });
  }

  componentWillUnmount() {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.events", this._onRoomStateEvents);
    }

    if (this._roomStoreToken) {
      this._roomStoreToken.remove();
    }
  }

  _onRoomStateEvents(ev, state) {
    if (ev.getRoomId() !== this.props.room.roomId) return;

    if (ev.getType() === 'm.room.tombstone') {
      this.setState({
        tombstone: this._getRoomTombstone()
      });
    }

    if (ev.getType() === 'm.room.power_levels') {
      this.setState({
        canSendMessages: this.props.room.maySendMessage()
      });
    }
  }

  _getRoomTombstone() {
    return this.props.room.currentState.getStateEvents('m.room.tombstone', '');
  }

  _onRoomViewStoreUpdate() {
    const isQuoting = Boolean(_RoomViewStore.default.getQuotingEvent());
    if (this.state.isQuoting === isQuoting) return;
    this.setState({
      isQuoting
    });
  }

  onInputStateChanged(inputState) {
    // Merge the new input state with old to support partial updates
    inputState = Object.assign({}, this.state.inputState, inputState);
    this.setState({
      inputState
    });
  }

  _onTombstoneClick(ev) {
    ev.preventDefault();
    const replacementRoomId = this.state.tombstone.getContent()['replacement_room'];

    const replacementRoom = _MatrixClientPeg.MatrixClientPeg.get().getRoom(replacementRoomId);

    let createEventId = null;

    if (replacementRoom) {
      const createEvent = replacementRoom.currentState.getStateEvents('m.room.create', '');
      if (createEvent && createEvent.getId()) createEventId = createEvent.getId();
    }

    const viaServers = [this.state.tombstone.getSender().split(':').splice(1).join(':')];

    _dispatcher.default.dispatch({
      action: 'view_room',
      highlighted: true,
      event_id: createEventId,
      room_id: replacementRoomId,
      auto_join: true,
      // Try to join via the server that sent the event. This converts @something:example.org
      // into a server domain by splitting on colons and ignoring the first entry ("@something").
      via_servers: viaServers,
      opts: {
        // These are passed down to the js-sdk's /join call
        viaServers: viaServers
      }
    });
  }

  renderPlaceholderText() {
    if (_SettingsStore.default.getValue("feature_cross_signing")) {
      if (this.state.isQuoting) {
        if (this.props.e2eStatus) {
          return (0, _languageHandler._t)('Send an encrypted reply…');
        } else {
          return (0, _languageHandler._t)('Send a reply…');
        }
      } else {
        if (this.props.e2eStatus) {
          return (0, _languageHandler._t)('Send an encrypted message…');
        } else {
          return (0, _languageHandler._t)('Send a message…');
        }
      }
    } else {
      if (this.state.isQuoting) {
        if (this.props.e2eStatus) {
          return (0, _languageHandler._t)('Send an encrypted reply…');
        } else {
          return (0, _languageHandler._t)('Send a reply (unencrypted)…');
        }
      } else {
        if (this.props.e2eStatus) {
          return (0, _languageHandler._t)('Send an encrypted message…');
        } else {
          return (0, _languageHandler._t)('Send a message (unencrypted)…');
        }
      }
    }
  }

  render() {
    const controls = [this.state.me ? /*#__PURE__*/_react.default.createElement(ComposerAvatar, {
      key: "controls_avatar",
      me: this.state.me
    }) : null, this.props.e2eStatus ? /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
      key: "e2eIcon",
      status: this.props.e2eStatus,
      className: "mx_MessageComposer_e2eIcon"
    }) : null];

    if (!this.state.tombstone && this.state.canSendMessages) {
      // This also currently includes the call buttons. Really we should
      // check separately for whether we can call, but this is slightly
      // complex because of conference calls.
      const SendMessageComposer = sdk.getComponent("rooms.SendMessageComposer");
      const callInProgress = this.props.callState && this.props.callState !== 'ended';
      controls.push( /*#__PURE__*/_react.default.createElement(SendMessageComposer, {
        ref: c => this.messageComposerInput = c,
        key: "controls_input",
        room: this.props.room,
        placeholder: this.renderPlaceholderText(),
        permalinkCreator: this.props.permalinkCreator
      }), /*#__PURE__*/_react.default.createElement(_Stickerpicker.default, {
        key: "stickerpicker_controls_button",
        room: this.props.room
      }), /*#__PURE__*/_react.default.createElement(UploadButton, {
        key: "controls_upload",
        roomId: this.props.room.roomId
      }));

      if (this.state.showCallButtons) {
        if (callInProgress) {
          controls.push( /*#__PURE__*/_react.default.createElement(HangupButton, {
            key: "controls_hangup",
            roomId: this.props.room.roomId
          }));
        } else {
          controls.push( /*#__PURE__*/_react.default.createElement(CallButton, {
            key: "controls_call",
            roomId: this.props.room.roomId
          }), /*#__PURE__*/_react.default.createElement(VideoCallButton, {
            key: "controls_videocall",
            roomId: this.props.room.roomId
          }));
        }
      }
    } else if (this.state.tombstone) {
      const replacementRoomId = this.state.tombstone.getContent()['replacement_room'];
      const continuesLink = replacementRoomId ? /*#__PURE__*/_react.default.createElement("a", {
        href: (0, _Permalinks.makeRoomPermalink)(replacementRoomId),
        className: "mx_MessageComposer_roomReplaced_link",
        onClick: this._onTombstoneClick
      }, (0, _languageHandler._t)("The conversation continues here.")) : '';
      controls.push( /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MessageComposer_replaced_wrapper",
        key: "room_replaced"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MessageComposer_replaced_valign"
      }, /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_MessageComposer_roomReplaced_icon",
        src: require("../../../../res/img/room_replaced.svg")
      }), /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MessageComposer_roomReplaced_header"
      }, (0, _languageHandler._t)("This room has been replaced and is no longer active.")), /*#__PURE__*/_react.default.createElement("br", null), continuesLink)));
    } else {
      controls.push( /*#__PURE__*/_react.default.createElement("div", {
        key: "controls_error",
        className: "mx_MessageComposer_noperm_error"
      }, (0, _languageHandler._t)('You do not have permission to post to this room')));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MessageComposer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MessageComposer_wrapper"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MessageComposer_row"
    }, controls)));
  }

}

exports.default = MessageComposer;
MessageComposer.propTypes = {
  // js-sdk Room object
  room: _propTypes.default.object.isRequired,
  // string representing the current voip call state
  callState: _propTypes.default.string,
  // string representing the current room app drawer state
  showApps: _propTypes.default.bool
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL01lc3NhZ2VDb21wb3Nlci5qcyJdLCJuYW1lcyI6WyJDb21wb3NlckF2YXRhciIsInByb3BzIiwiTWVtYmVyU3RhdHVzTWVzc2FnZUF2YXRhciIsInNkayIsImdldENvbXBvbmVudCIsIm1lIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsIkNhbGxCdXR0b24iLCJBY2Nlc3NpYmxlQnV0dG9uIiwib25Wb2ljZUNhbGxDbGljayIsImV2IiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJ0eXBlIiwicm9vbV9pZCIsInJvb21JZCIsInN0cmluZyIsIlZpZGVvQ2FsbEJ1dHRvbiIsIm9uQ2FsbENsaWNrIiwic2hpZnRLZXkiLCJIYW5ndXBCdXR0b24iLCJvbkhhbmd1cENsaWNrIiwiY2FsbCIsIkNhbGxIYW5kbGVyIiwiZ2V0Q2FsbEZvclJvb20iLCJVcGxvYWRCdXR0b24iLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicGF5bG9hZCIsIm9uVXBsb2FkQ2xpY2siLCJiaW5kIiwib25VcGxvYWRGaWxlSW5wdXRDaGFuZ2UiLCJfdXBsb2FkSW5wdXQiLCJfZGlzcGF0Y2hlclJlZiIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJpc0d1ZXN0IiwiY3VycmVudCIsImNsaWNrIiwidGFyZ2V0IiwiZmlsZXMiLCJsZW5ndGgiLCJ0ZmlsZXMiLCJpIiwicHVzaCIsIkNvbnRlbnRNZXNzYWdlcyIsInNoYXJlZEluc3RhbmNlIiwic2VuZENvbnRlbnRMaXN0VG9Sb29tIiwidmFsdWUiLCJyZW5kZXIiLCJ1cGxvYWRJbnB1dFN0eWxlIiwiZGlzcGxheSIsIk1lc3NhZ2VDb21wb3NlciIsIm9uSW5wdXRTdGF0ZUNoYW5nZWQiLCJfb25Sb29tU3RhdGVFdmVudHMiLCJfb25Sb29tVmlld1N0b3JlVXBkYXRlIiwiX29uVG9tYnN0b25lQ2xpY2siLCJyZW5kZXJQbGFjZWhvbGRlclRleHQiLCJzdGF0ZSIsImlzUXVvdGluZyIsIkJvb2xlYW4iLCJSb29tVmlld1N0b3JlIiwiZ2V0UXVvdGluZ0V2ZW50IiwidG9tYnN0b25lIiwiX2dldFJvb21Ub21ic3RvbmUiLCJjYW5TZW5kTWVzc2FnZXMiLCJyb29tIiwibWF5U2VuZE1lc3NhZ2UiLCJzaG93Q2FsbEJ1dHRvbnMiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJjb21wb25lbnREaWRNb3VudCIsIm9uIiwiX3Jvb21TdG9yZVRva2VuIiwiYWRkTGlzdGVuZXIiLCJfd2FpdEZvck93bk1lbWJlciIsImdldE1lbWJlciIsImdldFVzZXJJZCIsInNldFN0YXRlIiwibG9hZE1lbWJlcnNJZk5lZWRlZCIsInRoZW4iLCJyZW1vdmVMaXN0ZW5lciIsInJlbW92ZSIsImdldFJvb21JZCIsImdldFR5cGUiLCJjdXJyZW50U3RhdGUiLCJnZXRTdGF0ZUV2ZW50cyIsImlucHV0U3RhdGUiLCJPYmplY3QiLCJhc3NpZ24iLCJwcmV2ZW50RGVmYXVsdCIsInJlcGxhY2VtZW50Um9vbUlkIiwiZ2V0Q29udGVudCIsInJlcGxhY2VtZW50Um9vbSIsImdldFJvb20iLCJjcmVhdGVFdmVudElkIiwiY3JlYXRlRXZlbnQiLCJnZXRJZCIsInZpYVNlcnZlcnMiLCJnZXRTZW5kZXIiLCJzcGxpdCIsInNwbGljZSIsImpvaW4iLCJoaWdobGlnaHRlZCIsImV2ZW50X2lkIiwiYXV0b19qb2luIiwidmlhX3NlcnZlcnMiLCJvcHRzIiwiZTJlU3RhdHVzIiwiY29udHJvbHMiLCJTZW5kTWVzc2FnZUNvbXBvc2VyIiwiY2FsbEluUHJvZ3Jlc3MiLCJjYWxsU3RhdGUiLCJjIiwibWVzc2FnZUNvbXBvc2VySW5wdXQiLCJwZXJtYWxpbmtDcmVhdG9yIiwiY29udGludWVzTGluayIsInJlcXVpcmUiLCJzaG93QXBwcyIsImJvb2wi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RyxFQUFDLGdCQUFUO0FBQTBCLFFBQUEsU0FBUyxFQUFDO0FBQXBDLFNBQ00seUJBQUcsaURBQUgsQ0FETixDQURKO0FBS0g7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTWlFLFFBRE4sQ0FESixDQURKLENBREo7QUFTSDs7QUFyTndEOzs7QUF3TjdEekQsZUFBZSxDQUFDdkQsU0FBaEIsR0FBNEI7QUFDeEI7QUFDQXFFLEVBQUFBLElBQUksRUFBRXBFLG1CQUFVQyxNQUFWLENBQWlCQyxVQUZDO0FBSXhCO0FBQ0FnSCxFQUFBQSxTQUFTLEVBQUVsSCxtQkFBVWEsTUFMRztBQU94QjtBQUNBMkcsRUFBQUEsUUFBUSxFQUFFeEgsbUJBQVV5SDtBQVJJLENBQTVCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQ2FsbEhhbmRsZXIgZnJvbSAnLi4vLi4vLi4vQ2FsbEhhbmRsZXInO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IFJvb21WaWV3U3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL1Jvb21WaWV3U3RvcmUnO1xuaW1wb3J0IFN0aWNrZXJwaWNrZXIgZnJvbSAnLi9TdGlja2VycGlja2VyJztcbmltcG9ydCB7IG1ha2VSb29tUGVybWFsaW5rIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWFsaW5rcy9QZXJtYWxpbmtzJztcbmltcG9ydCBDb250ZW50TWVzc2FnZXMgZnJvbSAnLi4vLi4vLi4vQ29udGVudE1lc3NhZ2VzJztcbmltcG9ydCBFMkVJY29uIGZyb20gJy4vRTJFSWNvbic7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuXG5mdW5jdGlvbiBDb21wb3NlckF2YXRhcihwcm9wcykge1xuICAgIGNvbnN0IE1lbWJlclN0YXR1c01lc3NhZ2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLk1lbWJlclN0YXR1c01lc3NhZ2VBdmF0YXInKTtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfYXZhdGFyXCI+XG4gICAgICAgIDxNZW1iZXJTdGF0dXNNZXNzYWdlQXZhdGFyIG1lbWJlcj17cHJvcHMubWV9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICA8L2Rpdj47XG59XG5cbkNvbXBvc2VyQXZhdGFyLnByb3BUeXBlcyA9IHtcbiAgICBtZTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxufTtcblxuZnVuY3Rpb24gQ2FsbEJ1dHRvbihwcm9wcykge1xuICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgY29uc3Qgb25Wb2ljZUNhbGxDbGljayA9IChldikgPT4ge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAncGxhY2VfY2FsbCcsXG4gICAgICAgICAgICB0eXBlOiBcInZvaWNlXCIsXG4gICAgICAgICAgICByb29tX2lkOiBwcm9wcy5yb29tSWQsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gKDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb21wb3Nlcl9idXR0b24gbXhfTWVzc2FnZUNvbXBvc2VyX3ZvaWNlY2FsbFwiXG4gICAgICAgICAgICBvbkNsaWNrPXtvblZvaWNlQ2FsbENsaWNrfVxuICAgICAgICAgICAgdGl0bGU9e190KCdWb2ljZSBjYWxsJyl9XG4gICAgICAgIC8+KTtcbn1cblxuQ2FsbEJ1dHRvbi5wcm9wVHlwZXMgPSB7XG4gICAgcm9vbUlkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG59O1xuXG5mdW5jdGlvbiBWaWRlb0NhbGxCdXR0b24ocHJvcHMpIHtcbiAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgIGNvbnN0IG9uQ2FsbENsaWNrID0gKGV2KSA9PiB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdwbGFjZV9jYWxsJyxcbiAgICAgICAgICAgIHR5cGU6IGV2LnNoaWZ0S2V5ID8gXCJzY3JlZW5zaGFyaW5nXCIgOiBcInZpZGVvXCIsXG4gICAgICAgICAgICByb29tX2lkOiBwcm9wcy5yb29tSWQsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX2J1dHRvbiBteF9NZXNzYWdlQ29tcG9zZXJfdmlkZW9jYWxsXCJcbiAgICAgICAgb25DbGljaz17b25DYWxsQ2xpY2t9XG4gICAgICAgIHRpdGxlPXtfdCgnVmlkZW8gY2FsbCcpfVxuICAgIC8+O1xufVxuXG5WaWRlb0NhbGxCdXR0b24ucHJvcFR5cGVzID0ge1xuICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxufTtcblxuZnVuY3Rpb24gSGFuZ3VwQnV0dG9uKHByb3BzKSB7XG4gICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICBjb25zdCBvbkhhbmd1cENsaWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsID0gQ2FsbEhhbmRsZXIuZ2V0Q2FsbEZvclJvb20ocHJvcHMucm9vbUlkKTtcbiAgICAgICAgaWYgKCFjYWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2hhbmd1cCcsXG4gICAgICAgICAgICAvLyBoYW5ndXAgdGhlIGNhbGwgZm9yIHRoaXMgcm9vbSwgd2hpY2ggbWF5IG5vdCBiZSB0aGUgcm9vbSBpbiBwcm9wc1xuICAgICAgICAgICAgLy8gKGUuZy4gY29uZmVyZW5jZXMgd2hpY2ggd2lsbCBoYW5ndXAgdGhlIDE6MSByb29tIGluc3RlYWQpXG4gICAgICAgICAgICByb29tX2lkOiBjYWxsLnJvb21JZCxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gKDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb21wb3Nlcl9idXR0b24gbXhfTWVzc2FnZUNvbXBvc2VyX2hhbmd1cFwiXG4gICAgICAgICAgICBvbkNsaWNrPXtvbkhhbmd1cENsaWNrfVxuICAgICAgICAgICAgdGl0bGU9e190KCdIYW5ndXAnKX1cbiAgICAgICAgLz4pO1xufVxuXG5IYW5ndXBCdXR0b24ucHJvcFR5cGVzID0ge1xuICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxufTtcblxuY2xhc3MgVXBsb2FkQnV0dG9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICByb29tSWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMub25VcGxvYWRDbGljayA9IHRoaXMub25VcGxvYWRDbGljay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uVXBsb2FkRmlsZUlucHV0Q2hhbmdlID0gdGhpcy5vblVwbG9hZEZpbGVJbnB1dENoYW5nZS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZElucHV0ID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGRpcy51bnJlZ2lzdGVyKHRoaXMuX2Rpc3BhdGNoZXJSZWYpO1xuICAgIH1cblxuICAgIG9uQWN0aW9uID0gcGF5bG9hZCA9PiB7XG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gXCJ1cGxvYWRfZmlsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLm9uVXBsb2FkQ2xpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBvblVwbG9hZENsaWNrKGV2KSB7XG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNHdWVzdCgpKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3JlcXVpcmVfcmVnaXN0cmF0aW9uJ30pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwbG9hZElucHV0LmN1cnJlbnQuY2xpY2soKTtcbiAgICB9XG5cbiAgICBvblVwbG9hZEZpbGVJbnB1dENoYW5nZShldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0LmZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHRha2UgYSBjb3B5IHNvIHdlIGNhbiBzYWZlbHkgcmVzZXQgdGhlIHZhbHVlIG9mIHRoZSBmb3JtIGNvbnRyb2xcbiAgICAgICAgLy8gKE5vdGUgaXQgaXMgYSBGaWxlTGlzdDogd2UgY2FuJ3QgdXNlIHNsaWNlIG9yIHNlbnNpYmxlIGl0ZXJhdGlvbikuXG4gICAgICAgIGNvbnN0IHRmaWxlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2LnRhcmdldC5maWxlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGZpbGVzLnB1c2goZXYudGFyZ2V0LmZpbGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIENvbnRlbnRNZXNzYWdlcy5zaGFyZWRJbnN0YW5jZSgpLnNlbmRDb250ZW50TGlzdFRvUm9vbShcbiAgICAgICAgICAgIHRmaWxlcywgdGhpcy5wcm9wcy5yb29tSWQsIE1hdHJpeENsaWVudFBlZy5nZXQoKSxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbkNoYW5nZSBoYW5kbGVyIGZvciBhIGZpbGUgZm9ybSBjb250cm9sLCBidXQgd2UncmVcbiAgICAgICAgLy8gbm90IGtlZXBpbmcgYW55IHN0YXRlLCBzbyByZXNldCB0aGUgdmFsdWUgb2YgdGhlIGZvcm0gY29udHJvbFxuICAgICAgICAvLyB0byBlbXB0eS5cbiAgICAgICAgLy8gTkIuIHdlIG5lZWQgdG8gc2V0ICd2YWx1ZSc6IHRoZSAnZmlsZXMnIHByb3BlcnR5IGlzIGltbXV0YWJsZS5cbiAgICAgICAgZXYudGFyZ2V0LnZhbHVlID0gJyc7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB1cGxvYWRJbnB1dFN0eWxlID0ge2Rpc3BsYXk6ICdub25lJ307XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfYnV0dG9uIG14X01lc3NhZ2VDb21wb3Nlcl91cGxvYWRcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25VcGxvYWRDbGlja31cbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoJ1VwbG9hZCBmaWxlJyl9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fdXBsb2FkSW5wdXR9XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJmaWxlXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3VwbG9hZElucHV0U3R5bGV9XG4gICAgICAgICAgICAgICAgICAgIG11bHRpcGxlXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uVXBsb2FkRmlsZUlucHV0Q2hhbmdlfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZXNzYWdlQ29tcG9zZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5vbklucHV0U3RhdGVDaGFuZ2VkID0gdGhpcy5vbklucHV0U3RhdGVDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uUm9vbVN0YXRlRXZlbnRzID0gdGhpcy5fb25Sb29tU3RhdGVFdmVudHMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25Sb29tVmlld1N0b3JlVXBkYXRlID0gdGhpcy5fb25Sb29tVmlld1N0b3JlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uVG9tYnN0b25lQ2xpY2sgPSB0aGlzLl9vblRvbWJzdG9uZUNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMucmVuZGVyUGxhY2Vob2xkZXJUZXh0ID0gdGhpcy5yZW5kZXJQbGFjZWhvbGRlclRleHQuYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgaXNRdW90aW5nOiBCb29sZWFuKFJvb21WaWV3U3RvcmUuZ2V0UXVvdGluZ0V2ZW50KCkpLFxuICAgICAgICAgICAgdG9tYnN0b25lOiB0aGlzLl9nZXRSb29tVG9tYnN0b25lKCksXG4gICAgICAgICAgICBjYW5TZW5kTWVzc2FnZXM6IHRoaXMucHJvcHMucm9vbS5tYXlTZW5kTWVzc2FnZSgpLFxuICAgICAgICAgICAgc2hvd0NhbGxCdXR0b25zOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd0NhbGxCdXR0b25zSW5Db21wb3NlclwiKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLl9vblJvb21TdGF0ZUV2ZW50cyk7XG4gICAgICAgIHRoaXMuX3Jvb21TdG9yZVRva2VuID0gUm9vbVZpZXdTdG9yZS5hZGRMaXN0ZW5lcih0aGlzLl9vblJvb21WaWV3U3RvcmVVcGRhdGUpO1xuICAgICAgICB0aGlzLl93YWl0Rm9yT3duTWVtYmVyKCk7XG4gICAgfVxuXG4gICAgX3dhaXRGb3JPd25NZW1iZXIoKSB7XG4gICAgICAgIC8vIGlmIHdlIGhhdmUgdGhlIG1lbWJlciBhbHJlYWR5LCBkbyB0aGF0XG4gICAgICAgIGNvbnN0IG1lID0gdGhpcy5wcm9wcy5yb29tLmdldE1lbWJlcihNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCkpO1xuICAgICAgICBpZiAobWUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB3YWl0IGZvciBtZW1iZXIgbG9hZGluZyB0byBmaW5pc2ggYW5kIHRoZW4gdXBkYXRlIHRoZSBtZW1iZXIgZm9yIHRoZSBhdmF0YXIuXG4gICAgICAgIC8vIFRoZSBtZW1iZXJzIHNob3VsZCBhbHJlYWR5IGJlIGxvYWRpbmcsIGFuZCBsb2FkTWVtYmVyc0lmTmVlZGVkXG4gICAgICAgIC8vIHdpbGwgcmV0dXJuIHRoZSBwcm9taXNlIGZvciB0aGUgZXhpc3Rpbmcgb3BlcmF0aW9uXG4gICAgICAgIHRoaXMucHJvcHMucm9vbS5sb2FkTWVtYmVyc0lmTmVlZGVkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZSA9IHRoaXMucHJvcHMucm9vbS5nZXRNZW1iZXIoTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpKSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMuX29uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcm9vbVN0b3JlVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb21TdG9yZVRva2VuLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUm9vbVN0YXRlRXZlbnRzKGV2LCBzdGF0ZSkge1xuICAgICAgICBpZiAoZXYuZ2V0Um9vbUlkKCkgIT09IHRoaXMucHJvcHMucm9vbS5yb29tSWQpIHJldHVybjtcblxuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpID09PSAnbS5yb29tLnRvbWJzdG9uZScpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3RvbWJzdG9uZTogdGhpcy5fZ2V0Um9vbVRvbWJzdG9uZSgpfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2LmdldFR5cGUoKSA9PT0gJ20ucm9vbS5wb3dlcl9sZXZlbHMnKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjYW5TZW5kTWVzc2FnZXM6IHRoaXMucHJvcHMucm9vbS5tYXlTZW5kTWVzc2FnZSgpfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZ2V0Um9vbVRvbWJzdG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS50b21ic3RvbmUnLCAnJyk7XG4gICAgfVxuXG4gICAgX29uUm9vbVZpZXdTdG9yZVVwZGF0ZSgpIHtcbiAgICAgICAgY29uc3QgaXNRdW90aW5nID0gQm9vbGVhbihSb29tVmlld1N0b3JlLmdldFF1b3RpbmdFdmVudCgpKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNRdW90aW5nID09PSBpc1F1b3RpbmcpIHJldHVybjtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGlzUXVvdGluZyB9KTtcbiAgICB9XG5cbiAgICBvbklucHV0U3RhdGVDaGFuZ2VkKGlucHV0U3RhdGUpIHtcbiAgICAgICAgLy8gTWVyZ2UgdGhlIG5ldyBpbnB1dCBzdGF0ZSB3aXRoIG9sZCB0byBzdXBwb3J0IHBhcnRpYWwgdXBkYXRlc1xuICAgICAgICBpbnB1dFN0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZS5pbnB1dFN0YXRlLCBpbnB1dFN0YXRlKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aW5wdXRTdGF0ZX0pO1xuICAgIH1cblxuICAgIF9vblRvbWJzdG9uZUNsaWNrKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRSb29tSWQgPSB0aGlzLnN0YXRlLnRvbWJzdG9uZS5nZXRDb250ZW50KClbJ3JlcGxhY2VtZW50X3Jvb20nXTtcbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRSb29tID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20ocmVwbGFjZW1lbnRSb29tSWQpO1xuICAgICAgICBsZXQgY3JlYXRlRXZlbnRJZCA9IG51bGw7XG4gICAgICAgIGlmIChyZXBsYWNlbWVudFJvb20pIHtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZUV2ZW50ID0gcmVwbGFjZW1lbnRSb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnbS5yb29tLmNyZWF0ZScsICcnKTtcbiAgICAgICAgICAgIGlmIChjcmVhdGVFdmVudCAmJiBjcmVhdGVFdmVudC5nZXRJZCgpKSBjcmVhdGVFdmVudElkID0gY3JlYXRlRXZlbnQuZ2V0SWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZpYVNlcnZlcnMgPSBbdGhpcy5zdGF0ZS50b21ic3RvbmUuZ2V0U2VuZGVyKCkuc3BsaXQoJzonKS5zcGxpY2UoMSkuam9pbignOicpXTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICBoaWdobGlnaHRlZDogdHJ1ZSxcbiAgICAgICAgICAgIGV2ZW50X2lkOiBjcmVhdGVFdmVudElkLFxuICAgICAgICAgICAgcm9vbV9pZDogcmVwbGFjZW1lbnRSb29tSWQsXG4gICAgICAgICAgICBhdXRvX2pvaW46IHRydWUsXG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBqb2luIHZpYSB0aGUgc2VydmVyIHRoYXQgc2VudCB0aGUgZXZlbnQuIFRoaXMgY29udmVydHMgQHNvbWV0aGluZzpleGFtcGxlLm9yZ1xuICAgICAgICAgICAgLy8gaW50byBhIHNlcnZlciBkb21haW4gYnkgc3BsaXR0aW5nIG9uIGNvbG9ucyBhbmQgaWdub3JpbmcgdGhlIGZpcnN0IGVudHJ5IChcIkBzb21ldGhpbmdcIikuXG4gICAgICAgICAgICB2aWFfc2VydmVyczogdmlhU2VydmVycyxcbiAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICAvLyBUaGVzZSBhcmUgcGFzc2VkIGRvd24gdG8gdGhlIGpzLXNkaydzIC9qb2luIGNhbGxcbiAgICAgICAgICAgICAgICB2aWFTZXJ2ZXJzOiB2aWFTZXJ2ZXJzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyUGxhY2Vob2xkZXJUZXh0KCkge1xuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNRdW90aW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZTJlU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2VuZCBhbiBlbmNyeXB0ZWQgcmVwbHnigKYnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1NlbmQgYSByZXBseeKApicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZTJlU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2VuZCBhbiBlbmNyeXB0ZWQgbWVzc2FnZeKApicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2VuZCBhIG1lc3NhZ2XigKYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5pc1F1b3RpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5lMmVTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90KCdTZW5kIGFuIGVuY3J5cHRlZCByZXBseeKApicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnU2VuZCBhIHJlcGx5ICh1bmVuY3J5cHRlZCnigKYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmUyZVN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1NlbmQgYW4gZW5jcnlwdGVkIG1lc3NhZ2XigKYnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1NlbmQgYSBtZXNzYWdlICh1bmVuY3J5cHRlZCnigKYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gW1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5tZSA/IDxDb21wb3NlckF2YXRhciBrZXk9XCJjb250cm9sc19hdmF0YXJcIiBtZT17dGhpcy5zdGF0ZS5tZX0gLz4gOiBudWxsLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5lMmVTdGF0dXMgP1xuICAgICAgICAgICAgICAgIDxFMkVJY29uIGtleT1cImUyZUljb25cIiBzdGF0dXM9e3RoaXMucHJvcHMuZTJlU3RhdHVzfSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfZTJlSWNvblwiIC8+IDpcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICBdO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS50b21ic3RvbmUgJiYgdGhpcy5zdGF0ZS5jYW5TZW5kTWVzc2FnZXMpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgYWxzbyBjdXJyZW50bHkgaW5jbHVkZXMgdGhlIGNhbGwgYnV0dG9ucy4gUmVhbGx5IHdlIHNob3VsZFxuICAgICAgICAgICAgLy8gY2hlY2sgc2VwYXJhdGVseSBmb3Igd2hldGhlciB3ZSBjYW4gY2FsbCwgYnV0IHRoaXMgaXMgc2xpZ2h0bHlcbiAgICAgICAgICAgIC8vIGNvbXBsZXggYmVjYXVzZSBvZiBjb25mZXJlbmNlIGNhbGxzLlxuXG4gICAgICAgICAgICBjb25zdCBTZW5kTWVzc2FnZUNvbXBvc2VyID0gc2RrLmdldENvbXBvbmVudChcInJvb21zLlNlbmRNZXNzYWdlQ29tcG9zZXJcIik7XG4gICAgICAgICAgICBjb25zdCBjYWxsSW5Qcm9ncmVzcyA9IHRoaXMucHJvcHMuY2FsbFN0YXRlICYmIHRoaXMucHJvcHMuY2FsbFN0YXRlICE9PSAnZW5kZWQnO1xuXG4gICAgICAgICAgICBjb250cm9scy5wdXNoKFxuICAgICAgICAgICAgICAgIDxTZW5kTWVzc2FnZUNvbXBvc2VyXG4gICAgICAgICAgICAgICAgICAgIHJlZj17KGMpID0+IHRoaXMubWVzc2FnZUNvbXBvc2VySW5wdXQgPSBjfVxuICAgICAgICAgICAgICAgICAgICBrZXk9XCJjb250cm9sc19pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3RoaXMucmVuZGVyUGxhY2Vob2xkZXJUZXh0KCl9XG4gICAgICAgICAgICAgICAgICAgIHBlcm1hbGlua0NyZWF0b3I9e3RoaXMucHJvcHMucGVybWFsaW5rQ3JlYXRvcn0gLz4sXG4gICAgICAgICAgICAgICAgPFN0aWNrZXJwaWNrZXIga2V5PSdzdGlja2VycGlja2VyX2NvbnRyb2xzX2J1dHRvbicgcm9vbT17dGhpcy5wcm9wcy5yb29tfSAvPixcbiAgICAgICAgICAgICAgICA8VXBsb2FkQnV0dG9uIGtleT1cImNvbnRyb2xzX3VwbG9hZFwiIHJvb21JZD17dGhpcy5wcm9wcy5yb29tLnJvb21JZH0gLz4sXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5zaG93Q2FsbEJ1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbEluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbHMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxIYW5ndXBCdXR0b24ga2V5PVwiY29udHJvbHNfaGFuZ3VwXCIgcm9vbUlkPXt0aGlzLnByb3BzLnJvb20ucm9vbUlkfSAvPixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb250cm9scy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgPENhbGxCdXR0b24ga2V5PVwiY29udHJvbHNfY2FsbFwiIHJvb21JZD17dGhpcy5wcm9wcy5yb29tLnJvb21JZH0gLz4sXG4gICAgICAgICAgICAgICAgICAgICAgICA8VmlkZW9DYWxsQnV0dG9uIGtleT1cImNvbnRyb2xzX3ZpZGVvY2FsbFwiIHJvb21JZD17dGhpcy5wcm9wcy5yb29tLnJvb21JZH0gLz4sXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUudG9tYnN0b25lKSB7XG4gICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudFJvb21JZCA9IHRoaXMuc3RhdGUudG9tYnN0b25lLmdldENvbnRlbnQoKVsncmVwbGFjZW1lbnRfcm9vbSddO1xuXG4gICAgICAgICAgICBjb25zdCBjb250aW51ZXNMaW5rID0gcmVwbGFjZW1lbnRSb29tSWQgPyAoXG4gICAgICAgICAgICAgICAgPGEgaHJlZj17bWFrZVJvb21QZXJtYWxpbmsocmVwbGFjZW1lbnRSb29tSWQpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfcm9vbVJlcGxhY2VkX2xpbmtcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vblRvbWJzdG9uZUNsaWNrfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge190KFwiVGhlIGNvbnZlcnNhdGlvbiBjb250aW51ZXMgaGVyZS5cIil9XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgKSA6ICcnO1xuXG4gICAgICAgICAgICBjb250cm9scy5wdXNoKDxkaXYgY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX3JlcGxhY2VkX3dyYXBwZXJcIiBrZXk9XCJyb29tX3JlcGxhY2VkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfcmVwbGFjZWRfdmFsaWduXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX3Jvb21SZXBsYWNlZF9pY29uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9yb29tX3JlcGxhY2VkLnN2Z1wiKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX3Jvb21SZXBsYWNlZF9oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIlRoaXMgcm9vbSBoYXMgYmVlbiByZXBsYWNlZCBhbmQgaXMgbm8gbG9uZ2VyIGFjdGl2ZS5cIil9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj48YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgeyBjb250aW51ZXNMaW5rIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250cm9scy5wdXNoKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PVwiY29udHJvbHNfZXJyb3JcIiBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJfbm9wZXJtX2Vycm9yXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1lvdSBkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIHBvc3QgdG8gdGhpcyByb29tJykgfVxuICAgICAgICAgICAgICAgIDwvZGl2PixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29tcG9zZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb21wb3Nlcl93cmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbXBvc2VyX3Jvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBjb250cm9scyB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5NZXNzYWdlQ29tcG9zZXIucHJvcFR5cGVzID0ge1xuICAgIC8vIGpzLXNkayBSb29tIG9iamVjdFxuICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgIC8vIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgdm9pcCBjYWxsIHN0YXRlXG4gICAgY2FsbFN0YXRlOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgLy8gc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCByb29tIGFwcCBkcmF3ZXIgc3RhdGVcbiAgICBzaG93QXBwczogUHJvcFR5cGVzLmJvb2wsXG59O1xuIl19