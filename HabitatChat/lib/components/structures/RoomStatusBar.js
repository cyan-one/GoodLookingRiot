"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

var _languageHandler = require("../../languageHandler");

var sdk = _interopRequireWildcard(require("../../index"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _Resend = _interopRequireDefault(require("../../Resend"));

var cryptodevices = _interopRequireWildcard(require("../../cryptodevices"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _ErrorUtils = require("../../utils/ErrorUtils");

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
const STATUS_BAR_HIDDEN = 0;
const STATUS_BAR_EXPANDED = 1;
const STATUS_BAR_EXPANDED_LARGE = 2;

function getUnsentMessages(room) {
  if (!room) {
    return [];
  }

  return room.getPendingEvents().filter(function (ev) {
    return ev.status === _matrixJsSdk.default.EventStatus.NOT_SENT;
  });
}

var _default = (0, _createReactClass.default)({
  displayName: 'RoomStatusBar',
  propTypes: {
    // the room this statusbar is representing.
    room: _propTypes.default.object.isRequired,
    // This is true when the user is alone in the room, but has also sent a message.
    // Used to suggest to the user to invite someone
    sentMessageAndIsAlone: _propTypes.default.bool,
    // true if there is an active call in this room (means we show
    // the 'Active Call' text in the status bar if there is nothing
    // more interesting)
    hasActiveCall: _propTypes.default.bool,
    // true if the room is being peeked at. This affects components that shouldn't
    // logically be shown when peeking, such as a prompt to invite people to a room.
    isPeeking: _propTypes.default.bool,
    // callback for when the user clicks on the 'resend all' button in the
    // 'unsent messages' bar
    onResendAllClick: _propTypes.default.func,
    // callback for when the user clicks on the 'cancel all' button in the
    // 'unsent messages' bar
    onCancelAllClick: _propTypes.default.func,
    // callback for when the user clicks on the 'invite others' button in the
    // 'you are alone' bar
    onInviteClick: _propTypes.default.func,
    // callback for when the user clicks on the 'stop warning me' button in the
    // 'you are alone' bar
    onStopWarningClick: _propTypes.default.func,
    // callback for when we do something that changes the size of the
    // status bar. This is used to trigger a re-layout in the parent
    // component.
    onResize: _propTypes.default.func,
    // callback for when the status bar can be hidden from view, as it is
    // not displaying anything
    onHidden: _propTypes.default.func,
    // callback for when the status bar is displaying something and should
    // be visible
    onVisible: _propTypes.default.func
  },
  getInitialState: function () {
    return {
      syncState: _MatrixClientPeg.MatrixClientPeg.get().getSyncState(),
      syncStateData: _MatrixClientPeg.MatrixClientPeg.get().getSyncStateData(),
      unsentMessages: getUnsentMessages(this.props.room)
    };
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on("sync", this.onSyncStateChange);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.localEchoUpdated", this._onRoomLocalEchoUpdated);

    this._checkSize();
  },
  componentDidUpdate: function () {
    this._checkSize();
  },
  componentWillUnmount: function () {
    // we may have entirely lost our client as we're logging out before clicking login on the guest bar...
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("sync", this.onSyncStateChange);
      client.removeListener("Room.localEchoUpdated", this._onRoomLocalEchoUpdated);
    }
  },
  onSyncStateChange: function (state, prevState, data) {
    if (state === "SYNCING" && prevState === "SYNCING") {
      return;
    }

    this.setState({
      syncState: state,
      syncStateData: data
    });
  },
  _onSendWithoutVerifyingClick: function () {
    cryptodevices.getUnknownDevicesForRoom(_MatrixClientPeg.MatrixClientPeg.get(), this.props.room).then(devices => {
      cryptodevices.markAllDevicesKnown(_MatrixClientPeg.MatrixClientPeg.get(), devices);

      _Resend.default.resendUnsentEvents(this.props.room);
    });
  },
  _onResendAllClick: function () {
    _Resend.default.resendUnsentEvents(this.props.room);

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  },
  _onCancelAllClick: function () {
    _Resend.default.cancelUnsentEvents(this.props.room);

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  },
  _onShowDevicesClick: function () {
    cryptodevices.showUnknownDeviceDialogForMessages(_MatrixClientPeg.MatrixClientPeg.get(), this.props.room);
  },
  _onRoomLocalEchoUpdated: function (event, room, oldEventId, oldStatus) {
    if (room.roomId !== this.props.room.roomId) return;
    this.setState({
      unsentMessages: getUnsentMessages(this.props.room)
    });
  },
  // Check whether current size is greater than 0, if yes call props.onVisible
  _checkSize: function () {
    if (this._getSize()) {
      if (this.props.onVisible) this.props.onVisible();
    } else {
      if (this.props.onHidden) this.props.onHidden();
    }
  },
  // We don't need the actual height - just whether it is likely to have
  // changed - so we use '0' to indicate normal size, and other values to
  // indicate other sizes.
  _getSize: function () {
    if (this._shouldShowConnectionError() || this.props.hasActiveCall || this.props.sentMessageAndIsAlone) {
      return STATUS_BAR_EXPANDED;
    } else if (this.state.unsentMessages.length > 0) {
      return STATUS_BAR_EXPANDED_LARGE;
    }

    return STATUS_BAR_HIDDEN;
  },
  // return suitable content for the image on the left of the status bar.
  _getIndicator: function () {
    if (this.props.hasActiveCall) {
      const TintableSvg = sdk.getComponent("elements.TintableSvg");
      return /*#__PURE__*/_react.default.createElement(TintableSvg, {
        src: require("../../../res/img/sound-indicator.svg"),
        width: "23",
        height: "20"
      });
    }

    if (this._shouldShowConnectionError()) {
      return null;
    }

    return null;
  },
  _shouldShowConnectionError: function () {
    // no conn bar trumps the "some not sent" msg since you can't resend without
    // a connection!
    // There's one situation in which we don't show this 'no connection' bar, and that's
    // if it's a resource limit exceeded error: those are shown in the top bar.
    const errorIsMauError = Boolean(this.state.syncStateData && this.state.syncStateData.error && this.state.syncStateData.error.errcode === 'M_RESOURCE_LIMIT_EXCEEDED');
    return this.state.syncState === "ERROR" && !errorIsMauError;
  },
  _getUnsentMessageContent: function () {
    const unsentMessages = this.state.unsentMessages;
    if (!unsentMessages.length) return null;
    let title;
    let content;
    const hasUDE = unsentMessages.some(m => {
      return m.error && m.error.name === "UnknownDeviceError";
    });

    if (hasUDE) {
      title = (0, _languageHandler._t)("Message not sent due to unknown sessions being present");
      content = (0, _languageHandler._t)("<showSessionsText>Show sessions</showSessionsText>, <sendAnywayText>send anyway</sendAnywayText> or <cancelText>cancel</cancelText>.", {}, {
        'showSessionsText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "resend",
          onClick: this._onShowDevicesClick
        }, sub),
        'sendAnywayText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "sendAnyway",
          onClick: this._onSendWithoutVerifyingClick
        }, sub),
        'cancelText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "cancel",
          onClick: this._onCancelAllClick
        }, sub)
      });
    } else {
      let consentError = null;
      let resourceLimitError = null;

      for (const m of unsentMessages) {
        if (m.error && m.error.errcode === 'M_CONSENT_NOT_GIVEN') {
          consentError = m.error;
          break;
        } else if (m.error && m.error.errcode === 'M_RESOURCE_LIMIT_EXCEEDED') {
          resourceLimitError = m.error;
          break;
        }
      }

      if (consentError) {
        title = (0, _languageHandler._t)("You can't send any messages until you review and agree to " + "<consentLink>our terms and conditions</consentLink>.", {}, {
          'consentLink': sub => /*#__PURE__*/_react.default.createElement("a", {
            href: consentError.data && consentError.data.consent_uri,
            target: "_blank"
          }, sub)
        });
      } else if (resourceLimitError) {
        title = (0, _ErrorUtils.messageForResourceLimitError)(resourceLimitError.data.limit_type, resourceLimitError.data.admin_contact, {
          'monthly_active_user': (0, _languageHandler._td)("Your message wasn't sent because this homeserver has hit its Monthly Active User Limit. " + "Please <a>contact your service administrator</a> to continue using the service."),
          '': (0, _languageHandler._td)("Your message wasn't sent because this homeserver has exceeded a resource limit. " + "Please <a>contact your service administrator</a> to continue using the service.")
        });
      } else if (unsentMessages.length === 1 && unsentMessages[0].error && unsentMessages[0].error.data && unsentMessages[0].error.data.error) {
        title = (0, _ErrorUtils.messageForSendError)(unsentMessages[0].error.data) || unsentMessages[0].error.data.error;
      } else {
        title = (0, _languageHandler._t)('%(count)s of your messages have not been sent.', {
          count: unsentMessages.length
        });
      }

      content = (0, _languageHandler._t)("%(count)s <resendText>Resend all</resendText> or <cancelText>cancel all</cancelText> now. " + "You can also select individual messages to resend or cancel.", {
        count: unsentMessages.length
      }, {
        'resendText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "resend",
          onClick: this._onResendAllClick
        }, sub),
        'cancelText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "cancel",
          onClick: this._onCancelAllClick
        }, sub)
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomStatusBar_connectionLostBar"
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../res/img/feather-customised/warning-triangle.svg"),
      width: "24",
      height: "24",
      title: (0, _languageHandler._t)("Warning"),
      alt: ""
    }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomStatusBar_connectionLostBar_title"
    }, title), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomStatusBar_connectionLostBar_desc"
    }, content)));
  },
  // return suitable content for the main (text) part of the status bar.
  _getContent: function () {
    if (this._shouldShowConnectionError()) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomStatusBar_connectionLostBar"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../res/img/feather-customised/warning-triangle.svg"),
        width: "24",
        height: "24",
        title: "/!\\ ",
        alt: "/!\\ "
      }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomStatusBar_connectionLostBar_title"
      }, (0, _languageHandler._t)('Connectivity to the server has been lost.')), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomStatusBar_connectionLostBar_desc"
      }, (0, _languageHandler._t)('Sent messages will be stored until your connection has returned.'))));
    }

    if (this.state.unsentMessages.length > 0) {
      return this._getUnsentMessageContent();
    }

    if (this.props.hasActiveCall) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomStatusBar_callBar"
      }, /*#__PURE__*/_react.default.createElement("b", null, (0, _languageHandler._t)('Active call')));
    } // If you're alone in the room, and have sent a message, suggest to invite someone


    if (this.props.sentMessageAndIsAlone && !this.props.isPeeking) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomStatusBar_isAlone"
      }, (0, _languageHandler._t)("There's no one else here! Would you like to <inviteText>invite others</inviteText> " + "or <nowarnText>stop warning about the empty room</nowarnText>?", {}, {
        'inviteText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "invite",
          onClick: this.props.onInviteClick
        }, sub),
        'nowarnText': sub => /*#__PURE__*/_react.default.createElement("a", {
          className: "mx_RoomStatusBar_resend_link",
          key: "nowarn",
          onClick: this.props.onStopWarningClick
        }, sub)
      }));
    }

    return null;
  },
  render: function () {
    const content = this._getContent();

    const indicator = this._getIndicator();

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomStatusBar"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomStatusBar_indicator"
    }, indicator), /*#__PURE__*/_react.default.createElement("div", {
      role: "alert"
    }, content));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvUm9vbVN0YXR1c0Jhci5qcyJdLCJuYW1lcyI6WyJTVEFUVVNfQkFSX0hJRERFTiIsIlNUQVRVU19CQVJfRVhQQU5ERUQiLCJTVEFUVVNfQkFSX0VYUEFOREVEX0xBUkdFIiwiZ2V0VW5zZW50TWVzc2FnZXMiLCJyb29tIiwiZ2V0UGVuZGluZ0V2ZW50cyIsImZpbHRlciIsImV2Iiwic3RhdHVzIiwiTWF0cml4IiwiRXZlbnRTdGF0dXMiLCJOT1RfU0VOVCIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsInNlbnRNZXNzYWdlQW5kSXNBbG9uZSIsImJvb2wiLCJoYXNBY3RpdmVDYWxsIiwiaXNQZWVraW5nIiwib25SZXNlbmRBbGxDbGljayIsImZ1bmMiLCJvbkNhbmNlbEFsbENsaWNrIiwib25JbnZpdGVDbGljayIsIm9uU3RvcFdhcm5pbmdDbGljayIsIm9uUmVzaXplIiwib25IaWRkZW4iLCJvblZpc2libGUiLCJnZXRJbml0aWFsU3RhdGUiLCJzeW5jU3RhdGUiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRTeW5jU3RhdGUiLCJzeW5jU3RhdGVEYXRhIiwiZ2V0U3luY1N0YXRlRGF0YSIsInVuc2VudE1lc3NhZ2VzIiwicHJvcHMiLCJjb21wb25lbnREaWRNb3VudCIsIm9uIiwib25TeW5jU3RhdGVDaGFuZ2UiLCJfb25Sb29tTG9jYWxFY2hvVXBkYXRlZCIsIl9jaGVja1NpemUiLCJjb21wb25lbnREaWRVcGRhdGUiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsaWVudCIsInJlbW92ZUxpc3RlbmVyIiwic3RhdGUiLCJwcmV2U3RhdGUiLCJkYXRhIiwic2V0U3RhdGUiLCJfb25TZW5kV2l0aG91dFZlcmlmeWluZ0NsaWNrIiwiY3J5cHRvZGV2aWNlcyIsImdldFVua25vd25EZXZpY2VzRm9yUm9vbSIsInRoZW4iLCJkZXZpY2VzIiwibWFya0FsbERldmljZXNLbm93biIsIlJlc2VuZCIsInJlc2VuZFVuc2VudEV2ZW50cyIsIl9vblJlc2VuZEFsbENsaWNrIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJfb25DYW5jZWxBbGxDbGljayIsImNhbmNlbFVuc2VudEV2ZW50cyIsIl9vblNob3dEZXZpY2VzQ2xpY2siLCJzaG93VW5rbm93bkRldmljZURpYWxvZ0Zvck1lc3NhZ2VzIiwiZXZlbnQiLCJvbGRFdmVudElkIiwib2xkU3RhdHVzIiwicm9vbUlkIiwiX2dldFNpemUiLCJfc2hvdWxkU2hvd0Nvbm5lY3Rpb25FcnJvciIsImxlbmd0aCIsIl9nZXRJbmRpY2F0b3IiLCJUaW50YWJsZVN2ZyIsInNkayIsImdldENvbXBvbmVudCIsInJlcXVpcmUiLCJlcnJvcklzTWF1RXJyb3IiLCJCb29sZWFuIiwiZXJyb3IiLCJlcnJjb2RlIiwiX2dldFVuc2VudE1lc3NhZ2VDb250ZW50IiwidGl0bGUiLCJjb250ZW50IiwiaGFzVURFIiwic29tZSIsIm0iLCJuYW1lIiwic3ViIiwiY29uc2VudEVycm9yIiwicmVzb3VyY2VMaW1pdEVycm9yIiwiY29uc2VudF91cmkiLCJsaW1pdF90eXBlIiwiYWRtaW5fY29udGFjdCIsImNvdW50IiwiX2dldENvbnRlbnQiLCJyZW5kZXIiLCJpbmRpY2F0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTVCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4QkEsTUFBTUEsaUJBQWlCLEdBQUcsQ0FBMUI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRyxDQUE1QjtBQUNBLE1BQU1DLHlCQUF5QixHQUFHLENBQWxDOztBQUVBLFNBQVNDLGlCQUFULENBQTJCQyxJQUEzQixFQUFpQztBQUM3QixNQUFJLENBQUNBLElBQUwsRUFBVztBQUFFLFdBQU8sRUFBUDtBQUFZOztBQUN6QixTQUFP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WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBNYXRyaXggZnJvbSAnbWF0cml4LWpzLXNkayc7XG5pbXBvcnQgeyBfdCwgX3RkIH0gZnJvbSAnLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBSZXNlbmQgZnJvbSAnLi4vLi4vUmVzZW5kJztcbmltcG9ydCAqIGFzIGNyeXB0b2RldmljZXMgZnJvbSAnLi4vLi4vY3J5cHRvZGV2aWNlcyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQge21lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IsIG1lc3NhZ2VGb3JTZW5kRXJyb3J9IGZyb20gJy4uLy4uL3V0aWxzL0Vycm9yVXRpbHMnO1xuXG5jb25zdCBTVEFUVVNfQkFSX0hJRERFTiA9IDA7XG5jb25zdCBTVEFUVVNfQkFSX0VYUEFOREVEID0gMTtcbmNvbnN0IFNUQVRVU19CQVJfRVhQQU5ERURfTEFSR0UgPSAyO1xuXG5mdW5jdGlvbiBnZXRVbnNlbnRNZXNzYWdlcyhyb29tKSB7XG4gICAgaWYgKCFyb29tKSB7IHJldHVybiBbXTsgfVxuICAgIHJldHVybiByb29tLmdldFBlbmRpbmdFdmVudHMoKS5maWx0ZXIoZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgcmV0dXJuIGV2LnN0YXR1cyA9PT0gTWF0cml4LkV2ZW50U3RhdHVzLk5PVF9TRU5UO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1Jvb21TdGF0dXNCYXInLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIHRoZSByb29tIHRoaXMgc3RhdHVzYmFyIGlzIHJlcHJlc2VudGluZy5cbiAgICAgICAgcm9vbTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBUaGlzIGlzIHRydWUgd2hlbiB0aGUgdXNlciBpcyBhbG9uZSBpbiB0aGUgcm9vbSwgYnV0IGhhcyBhbHNvIHNlbnQgYSBtZXNzYWdlLlxuICAgICAgICAvLyBVc2VkIHRvIHN1Z2dlc3QgdG8gdGhlIHVzZXIgdG8gaW52aXRlIHNvbWVvbmVcbiAgICAgICAgc2VudE1lc3NhZ2VBbmRJc0Fsb25lOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyB0cnVlIGlmIHRoZXJlIGlzIGFuIGFjdGl2ZSBjYWxsIGluIHRoaXMgcm9vbSAobWVhbnMgd2Ugc2hvd1xuICAgICAgICAvLyB0aGUgJ0FjdGl2ZSBDYWxsJyB0ZXh0IGluIHRoZSBzdGF0dXMgYmFyIGlmIHRoZXJlIGlzIG5vdGhpbmdcbiAgICAgICAgLy8gbW9yZSBpbnRlcmVzdGluZylcbiAgICAgICAgaGFzQWN0aXZlQ2FsbDogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gdHJ1ZSBpZiB0aGUgcm9vbSBpcyBiZWluZyBwZWVrZWQgYXQuIFRoaXMgYWZmZWN0cyBjb21wb25lbnRzIHRoYXQgc2hvdWxkbid0XG4gICAgICAgIC8vIGxvZ2ljYWxseSBiZSBzaG93biB3aGVuIHBlZWtpbmcsIHN1Y2ggYXMgYSBwcm9tcHQgdG8gaW52aXRlIHBlb3BsZSB0byBhIHJvb20uXG4gICAgICAgIGlzUGVla2luZzogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgZm9yIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSAncmVzZW5kIGFsbCcgYnV0dG9uIGluIHRoZVxuICAgICAgICAvLyAndW5zZW50IG1lc3NhZ2VzJyBiYXJcbiAgICAgICAgb25SZXNlbmRBbGxDbGljazogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgZm9yIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSAnY2FuY2VsIGFsbCcgYnV0dG9uIGluIHRoZVxuICAgICAgICAvLyAndW5zZW50IG1lc3NhZ2VzJyBiYXJcbiAgICAgICAgb25DYW5jZWxBbGxDbGljazogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgZm9yIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSAnaW52aXRlIG90aGVycycgYnV0dG9uIGluIHRoZVxuICAgICAgICAvLyAneW91IGFyZSBhbG9uZScgYmFyXG4gICAgICAgIG9uSW52aXRlQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIGNhbGxiYWNrIGZvciB3aGVuIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGUgJ3N0b3Agd2FybmluZyBtZScgYnV0dG9uIGluIHRoZVxuICAgICAgICAvLyAneW91IGFyZSBhbG9uZScgYmFyXG4gICAgICAgIG9uU3RvcFdhcm5pbmdDbGljazogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgZm9yIHdoZW4gd2UgZG8gc29tZXRoaW5nIHRoYXQgY2hhbmdlcyB0aGUgc2l6ZSBvZiB0aGVcbiAgICAgICAgLy8gc3RhdHVzIGJhci4gVGhpcyBpcyB1c2VkIHRvIHRyaWdnZXIgYSByZS1sYXlvdXQgaW4gdGhlIHBhcmVudFxuICAgICAgICAvLyBjb21wb25lbnQuXG4gICAgICAgIG9uUmVzaXplOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvLyBjYWxsYmFjayBmb3Igd2hlbiB0aGUgc3RhdHVzIGJhciBjYW4gYmUgaGlkZGVuIGZyb20gdmlldywgYXMgaXQgaXNcbiAgICAgICAgLy8gbm90IGRpc3BsYXlpbmcgYW55dGhpbmdcbiAgICAgICAgb25IaWRkZW46IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIGNhbGxiYWNrIGZvciB3aGVuIHRoZSBzdGF0dXMgYmFyIGlzIGRpc3BsYXlpbmcgc29tZXRoaW5nIGFuZCBzaG91bGRcbiAgICAgICAgLy8gYmUgdmlzaWJsZVxuICAgICAgICBvblZpc2libGU6IFByb3BUeXBlcy5mdW5jLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3luY1N0YXRlOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0U3luY1N0YXRlKCksXG4gICAgICAgICAgICBzeW5jU3RhdGVEYXRhOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0U3luY1N0YXRlRGF0YSgpLFxuICAgICAgICAgICAgdW5zZW50TWVzc2FnZXM6IGdldFVuc2VudE1lc3NhZ2VzKHRoaXMucHJvcHMucm9vbSksXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwic3luY1wiLCB0aGlzLm9uU3luY1N0YXRlQ2hhbmdlKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbS5sb2NhbEVjaG9VcGRhdGVkXCIsIHRoaXMuX29uUm9vbUxvY2FsRWNob1VwZGF0ZWQpO1xuXG4gICAgICAgIHRoaXMuX2NoZWNrU2l6ZSgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jaGVja1NpemUoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB3ZSBtYXkgaGF2ZSBlbnRpcmVseSBsb3N0IG91ciBjbGllbnQgYXMgd2UncmUgbG9nZ2luZyBvdXQgYmVmb3JlIGNsaWNraW5nIGxvZ2luIG9uIHRoZSBndWVzdCBiYXIuLi5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpZW50KSB7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJzeW5jXCIsIHRoaXMub25TeW5jU3RhdGVDaGFuZ2UpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5sb2NhbEVjaG9VcGRhdGVkXCIsIHRoaXMuX29uUm9vbUxvY2FsRWNob1VwZGF0ZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uU3luY1N0YXRlQ2hhbmdlOiBmdW5jdGlvbihzdGF0ZSwgcHJldlN0YXRlLCBkYXRhKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gXCJTWU5DSU5HXCIgJiYgcHJldlN0YXRlID09PSBcIlNZTkNJTkdcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3luY1N0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgIHN5bmNTdGF0ZURhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25TZW5kV2l0aG91dFZlcmlmeWluZ0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY3J5cHRvZGV2aWNlcy5nZXRVbmtub3duRGV2aWNlc0ZvclJvb20oTWF0cml4Q2xpZW50UGVnLmdldCgpLCB0aGlzLnByb3BzLnJvb20pLnRoZW4oKGRldmljZXMpID0+IHtcbiAgICAgICAgICAgIGNyeXB0b2RldmljZXMubWFya0FsbERldmljZXNLbm93bihNYXRyaXhDbGllbnRQZWcuZ2V0KCksIGRldmljZXMpO1xuICAgICAgICAgICAgUmVzZW5kLnJlc2VuZFVuc2VudEV2ZW50cyh0aGlzLnByb3BzLnJvb20pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uUmVzZW5kQWxsQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBSZXNlbmQucmVzZW5kVW5zZW50RXZlbnRzKHRoaXMucHJvcHMucm9vbSk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG4gICAgfSxcblxuICAgIF9vbkNhbmNlbEFsbENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmVzZW5kLmNhbmNlbFVuc2VudEV2ZW50cyh0aGlzLnByb3BzLnJvb20pO1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2ZvY3VzX2NvbXBvc2VyJ30pO1xuICAgIH0sXG5cbiAgICBfb25TaG93RGV2aWNlc0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY3J5cHRvZGV2aWNlcy5zaG93VW5rbm93bkRldmljZURpYWxvZ0Zvck1lc3NhZ2VzKE1hdHJpeENsaWVudFBlZy5nZXQoKSwgdGhpcy5wcm9wcy5yb29tKTtcbiAgICB9LFxuXG4gICAgX29uUm9vbUxvY2FsRWNob1VwZGF0ZWQ6IGZ1bmN0aW9uKGV2ZW50LCByb29tLCBvbGRFdmVudElkLCBvbGRTdGF0dXMpIHtcbiAgICAgICAgaWYgKHJvb20ucm9vbUlkICE9PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB1bnNlbnRNZXNzYWdlczogZ2V0VW5zZW50TWVzc2FnZXModGhpcy5wcm9wcy5yb29tKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgY3VycmVudCBzaXplIGlzIGdyZWF0ZXIgdGhhbiAwLCBpZiB5ZXMgY2FsbCBwcm9wcy5vblZpc2libGVcbiAgICBfY2hlY2tTaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2dldFNpemUoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25WaXNpYmxlKSB0aGlzLnByb3BzLm9uVmlzaWJsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25IaWRkZW4pIHRoaXMucHJvcHMub25IaWRkZW4oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBXZSBkb24ndCBuZWVkIHRoZSBhY3R1YWwgaGVpZ2h0IC0ganVzdCB3aGV0aGVyIGl0IGlzIGxpa2VseSB0byBoYXZlXG4gICAgLy8gY2hhbmdlZCAtIHNvIHdlIHVzZSAnMCcgdG8gaW5kaWNhdGUgbm9ybWFsIHNpemUsIGFuZCBvdGhlciB2YWx1ZXMgdG9cbiAgICAvLyBpbmRpY2F0ZSBvdGhlciBzaXplcy5cbiAgICBfZ2V0U2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9zaG91bGRTaG93Q29ubmVjdGlvbkVycm9yKCkgfHxcbiAgICAgICAgICAgIHRoaXMucHJvcHMuaGFzQWN0aXZlQ2FsbCB8fFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5zZW50TWVzc2FnZUFuZElzQWxvbmVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gU1RBVFVTX0JBUl9FWFBBTkRFRDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnVuc2VudE1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFUVVNfQkFSX0VYUEFOREVEX0xBUkdFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFUVVNfQkFSX0hJRERFTjtcbiAgICB9LFxuXG4gICAgLy8gcmV0dXJuIHN1aXRhYmxlIGNvbnRlbnQgZm9yIHRoZSBpbWFnZSBvbiB0aGUgbGVmdCBvZiB0aGUgc3RhdHVzIGJhci5cbiAgICBfZ2V0SW5kaWNhdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaGFzQWN0aXZlQ2FsbCkge1xuICAgICAgICAgICAgY29uc3QgVGludGFibGVTdmcgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVGludGFibGVTdmdcIik7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxUaW50YWJsZVN2ZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL3NvdW5kLWluZGljYXRvci5zdmdcIil9IHdpZHRoPVwiMjNcIiBoZWlnaHQ9XCIyMFwiIC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3Nob3VsZFNob3dDb25uZWN0aW9uRXJyb3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgX3Nob3VsZFNob3dDb25uZWN0aW9uRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBubyBjb25uIGJhciB0cnVtcHMgdGhlIFwic29tZSBub3Qgc2VudFwiIG1zZyBzaW5jZSB5b3UgY2FuJ3QgcmVzZW5kIHdpdGhvdXRcbiAgICAgICAgLy8gYSBjb25uZWN0aW9uIVxuICAgICAgICAvLyBUaGVyZSdzIG9uZSBzaXR1YXRpb24gaW4gd2hpY2ggd2UgZG9uJ3Qgc2hvdyB0aGlzICdubyBjb25uZWN0aW9uJyBiYXIsIGFuZCB0aGF0J3NcbiAgICAgICAgLy8gaWYgaXQncyBhIHJlc291cmNlIGxpbWl0IGV4Y2VlZGVkIGVycm9yOiB0aG9zZSBhcmUgc2hvd24gaW4gdGhlIHRvcCBiYXIuXG4gICAgICAgIGNvbnN0IGVycm9ySXNNYXVFcnJvciA9IEJvb2xlYW4oXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN5bmNTdGF0ZURhdGEgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc3luY1N0YXRlRGF0YS5lcnJvciAmJlxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zeW5jU3RhdGVEYXRhLmVycm9yLmVycmNvZGUgPT09ICdNX1JFU09VUkNFX0xJTUlUX0VYQ0VFREVEJyxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuc3luY1N0YXRlID09PSBcIkVSUk9SXCIgJiYgIWVycm9ySXNNYXVFcnJvcjtcbiAgICB9LFxuXG4gICAgX2dldFVuc2VudE1lc3NhZ2VDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgdW5zZW50TWVzc2FnZXMgPSB0aGlzLnN0YXRlLnVuc2VudE1lc3NhZ2VzO1xuICAgICAgICBpZiAoIXVuc2VudE1lc3NhZ2VzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgbGV0IHRpdGxlO1xuICAgICAgICBsZXQgY29udGVudDtcblxuICAgICAgICBjb25zdCBoYXNVREUgPSB1bnNlbnRNZXNzYWdlcy5zb21lKChtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbS5lcnJvciAmJiBtLmVycm9yLm5hbWUgPT09IFwiVW5rbm93bkRldmljZUVycm9yXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChoYXNVREUpIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJNZXNzYWdlIG5vdCBzZW50IGR1ZSB0byB1bmtub3duIHNlc3Npb25zIGJlaW5nIHByZXNlbnRcIik7XG4gICAgICAgICAgICBjb250ZW50ID0gX3QoXG4gICAgICAgICAgICAgICAgXCI8c2hvd1Nlc3Npb25zVGV4dD5TaG93IHNlc3Npb25zPC9zaG93U2Vzc2lvbnNUZXh0PiwgPHNlbmRBbnl3YXlUZXh0PnNlbmQgYW55d2F5PC9zZW5kQW55d2F5VGV4dD4gb3IgPGNhbmNlbFRleHQ+Y2FuY2VsPC9jYW5jZWxUZXh0Pi5cIixcbiAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICdzaG93U2Vzc2lvbnNUZXh0JzogKHN1YikgPT4gPGEgY2xhc3NOYW1lPVwibXhfUm9vbVN0YXR1c0Jhcl9yZXNlbmRfbGlua1wiIGtleT1cInJlc2VuZFwiIG9uQ2xpY2s9e3RoaXMuX29uU2hvd0RldmljZXNDbGlja30+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICdzZW5kQW55d2F5VGV4dCc6IChzdWIpID0+IDxhIGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfcmVzZW5kX2xpbmtcIiBrZXk9XCJzZW5kQW55d2F5XCIgb25DbGljaz17dGhpcy5fb25TZW5kV2l0aG91dFZlcmlmeWluZ0NsaWNrfT57IHN1YiB9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgJ2NhbmNlbFRleHQnOiAoc3ViKSA9PiA8YSBjbGFzc05hbWU9XCJteF9Sb29tU3RhdHVzQmFyX3Jlc2VuZF9saW5rXCIga2V5PVwiY2FuY2VsXCIgb25DbGljaz17dGhpcy5fb25DYW5jZWxBbGxDbGlja30+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgY29uc2VudEVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvdXJjZUxpbWl0RXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgZm9yIChjb25zdCBtIG9mIHVuc2VudE1lc3NhZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG0uZXJyb3IgJiYgbS5lcnJvci5lcnJjb2RlID09PSAnTV9DT05TRU5UX05PVF9HSVZFTicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc2VudEVycm9yID0gbS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtLmVycm9yICYmIG0uZXJyb3IuZXJyY29kZSA9PT0gJ01fUkVTT1VSQ0VfTElNSVRfRVhDRUVERUQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlTGltaXRFcnJvciA9IG0uZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb25zZW50RXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIllvdSBjYW4ndCBzZW5kIGFueSBtZXNzYWdlcyB1bnRpbCB5b3UgcmV2aWV3IGFuZCBhZ3JlZSB0byBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPGNvbnNlbnRMaW5rPm91ciB0ZXJtcyBhbmQgY29uZGl0aW9uczwvY29uc2VudExpbms+LlwiLFxuICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbnNlbnRMaW5rJzogKHN1YikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXtjb25zZW50RXJyb3IuZGF0YSAmJiBjb25zZW50RXJyb3IuZGF0YS5jb25zZW50X3VyaX0gdGFyZ2V0PVwiX2JsYW5rXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgc3ViIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc291cmNlTGltaXRFcnJvcikge1xuICAgICAgICAgICAgICAgIHRpdGxlID0gbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VMaW1pdEVycm9yLmRhdGEubGltaXRfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VMaW1pdEVycm9yLmRhdGEuYWRtaW5fY29udGFjdCwge1xuICAgICAgICAgICAgICAgICAgICAnbW9udGhseV9hY3RpdmVfdXNlcic6IF90ZChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiWW91ciBtZXNzYWdlIHdhc24ndCBzZW50IGJlY2F1c2UgdGhpcyBob21lc2VydmVyIGhhcyBoaXQgaXRzIE1vbnRobHkgQWN0aXZlIFVzZXIgTGltaXQuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIDxhPmNvbnRhY3QgeW91ciBzZXJ2aWNlIGFkbWluaXN0cmF0b3I8L2E+IHRvIGNvbnRpbnVlIHVzaW5nIHRoZSBzZXJ2aWNlLlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAnJzogX3RkKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJZb3VyIG1lc3NhZ2Ugd2Fzbid0IHNlbnQgYmVjYXVzZSB0aGlzIGhvbWVzZXJ2ZXIgaGFzIGV4Y2VlZGVkIGEgcmVzb3VyY2UgbGltaXQuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIDxhPmNvbnRhY3QgeW91ciBzZXJ2aWNlIGFkbWluaXN0cmF0b3I8L2E+IHRvIGNvbnRpbnVlIHVzaW5nIHRoZSBzZXJ2aWNlLlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICB1bnNlbnRNZXNzYWdlcy5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgICAgICB1bnNlbnRNZXNzYWdlc1swXS5lcnJvciAmJlxuICAgICAgICAgICAgICAgIHVuc2VudE1lc3NhZ2VzWzBdLmVycm9yLmRhdGEgJiZcbiAgICAgICAgICAgICAgICB1bnNlbnRNZXNzYWdlc1swXS5lcnJvci5kYXRhLmVycm9yXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IG1lc3NhZ2VGb3JTZW5kRXJyb3IodW5zZW50TWVzc2FnZXNbMF0uZXJyb3IuZGF0YSkgfHwgdW5zZW50TWVzc2FnZXNbMF0uZXJyb3IuZGF0YS5lcnJvcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdCgnJShjb3VudClzIG9mIHlvdXIgbWVzc2FnZXMgaGF2ZSBub3QgYmVlbiBzZW50LicsIHsgY291bnQ6IHVuc2VudE1lc3NhZ2VzLmxlbmd0aCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSBfdChcIiUoY291bnQpcyA8cmVzZW5kVGV4dD5SZXNlbmQgYWxsPC9yZXNlbmRUZXh0PiBvciA8Y2FuY2VsVGV4dD5jYW5jZWwgYWxsPC9jYW5jZWxUZXh0PiBub3cuIFwiICtcbiAgICAgICAgICAgICAgIFwiWW91IGNhbiBhbHNvIHNlbGVjdCBpbmRpdmlkdWFsIG1lc3NhZ2VzIHRvIHJlc2VuZCBvciBjYW5jZWwuXCIsXG4gICAgICAgICAgICAgICAgeyBjb3VudDogdW5zZW50TWVzc2FnZXMubGVuZ3RoIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAncmVzZW5kVGV4dCc6IChzdWIpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJteF9Sb29tU3RhdHVzQmFyX3Jlc2VuZF9saW5rXCIga2V5PVwicmVzZW5kXCIgb25DbGljaz17dGhpcy5fb25SZXNlbmRBbGxDbGlja30+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICdjYW5jZWxUZXh0JzogKHN1YikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfcmVzZW5kX2xpbmtcIiBrZXk9XCJjYW5jZWxcIiBvbkNsaWNrPXt0aGlzLl9vbkNhbmNlbEFsbENsaWNrfT57IHN1YiB9PC9hPixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfY29ubmVjdGlvbkxvc3RCYXJcIj5cbiAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy9mZWF0aGVyLWN1c3RvbWlzZWQvd2FybmluZy10cmlhbmdsZS5zdmdcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHRpdGxlPXtfdChcIldhcm5pbmdcIil9IGFsdD1cIlwiIC8+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVN0YXR1c0Jhcl9jb25uZWN0aW9uTG9zdEJhcl90aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRpdGxlIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfY29ubmVjdGlvbkxvc3RCYXJfZGVzY1wiPlxuICAgICAgICAgICAgICAgICAgICB7IGNvbnRlbnQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9LFxuXG4gICAgLy8gcmV0dXJuIHN1aXRhYmxlIGNvbnRlbnQgZm9yIHRoZSBtYWluICh0ZXh0KSBwYXJ0IG9mIHRoZSBzdGF0dXMgYmFyLlxuICAgIF9nZXRDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Nob3VsZFNob3dDb25uZWN0aW9uRXJyb3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfY29ubmVjdGlvbkxvc3RCYXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL2ZlYXRoZXItY3VzdG9taXNlZC93YXJuaW5nLXRyaWFuZ2xlLnN2Z1wiKX0gd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgdGl0bGU9XCIvIVxcIFwiIGFsdD1cIi8hXFwgXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVN0YXR1c0Jhcl9jb25uZWN0aW9uTG9zdEJhcl90aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ0Nvbm5lY3Rpdml0eSB0byB0aGUgc2VydmVyIGhhcyBiZWVuIGxvc3QuJykgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfY29ubmVjdGlvbkxvc3RCYXJfZGVzY1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1NlbnQgbWVzc2FnZXMgd2lsbCBiZSBzdG9yZWQgdW50aWwgeW91ciBjb25uZWN0aW9uIGhhcyByZXR1cm5lZC4nKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudW5zZW50TWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldFVuc2VudE1lc3NhZ2VDb250ZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5oYXNBY3RpdmVDYWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVN0YXR1c0Jhcl9jYWxsQmFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxiPnsgX3QoJ0FjdGl2ZSBjYWxsJykgfTwvYj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UncmUgYWxvbmUgaW4gdGhlIHJvb20sIGFuZCBoYXZlIHNlbnQgYSBtZXNzYWdlLCBzdWdnZXN0IHRvIGludml0ZSBzb21lb25lXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNlbnRNZXNzYWdlQW5kSXNBbG9uZSAmJiAhdGhpcy5wcm9wcy5pc1BlZWtpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tU3RhdHVzQmFyX2lzQWxvbmVcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIlRoZXJlJ3Mgbm8gb25lIGVsc2UgaGVyZSEgV291bGQgeW91IGxpa2UgdG8gPGludml0ZVRleHQ+aW52aXRlIG90aGVyczwvaW52aXRlVGV4dD4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3IgPG5vd2FyblRleHQ+c3RvcCB3YXJuaW5nIGFib3V0IHRoZSBlbXB0eSByb29tPC9ub3dhcm5UZXh0Pj9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpbnZpdGVUZXh0JzogKHN1YikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibXhfUm9vbVN0YXR1c0Jhcl9yZXNlbmRfbGlua1wiIGtleT1cImludml0ZVwiIG9uQ2xpY2s9e3RoaXMucHJvcHMub25JbnZpdGVDbGlja30+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25vd2FyblRleHQnOiAoc3ViKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJteF9Sb29tU3RhdHVzQmFyX3Jlc2VuZF9saW5rXCIga2V5PVwibm93YXJuXCIgb25DbGljaz17dGhpcy5wcm9wcy5vblN0b3BXYXJuaW5nQ2xpY2t9Pnsgc3ViIH08L2E+LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLl9nZXRDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IGluZGljYXRvciA9IHRoaXMuX2dldEluZGljYXRvcigpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdGF0dXNCYXJfaW5kaWNhdG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgaW5kaWNhdG9yIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgICAgICAgICAgICB7IGNvbnRlbnQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19