"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _matrixJsSdk = require("matrix-js-sdk");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _Resend = _interopRequireDefault(require("../../../Resend"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _HtmlUtils = require("../../../HtmlUtils");

var _EventUtils = require("../../../utils/EventUtils");

var _ContextMenu = require("../../structures/ContextMenu");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
function canCancel(eventStatus) {
  return eventStatus === _matrixJsSdk.EventStatus.QUEUED || eventStatus === _matrixJsSdk.EventStatus.NOT_SENT;
}

var _default = (0, _createReactClass.default)({
  displayName: 'MessageContextMenu',
  propTypes: {
    /* the MatrixEvent associated with the context menu */
    mxEvent: _propTypes.default.object.isRequired,

    /* an optional EventTileOps implementation that can be used to unhide preview widgets */
    eventTileOps: _propTypes.default.object,

    /* an optional function to be called when the user clicks collapse thread, if not provided hide button */
    collapseReplyThread: _propTypes.default.func,

    /* callback called when the menu is dismissed */
    onFinished: _propTypes.default.func
  },
  getInitialState: function () {
    return {
      canRedact: false,
      canPin: false
    };
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on('RoomMember.powerLevel', this._checkPermissions);

    this._checkPermissions();
  },
  componentWillUnmount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener('RoomMember.powerLevel', this._checkPermissions);
    }
  },
  _checkPermissions: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const room = cli.getRoom(this.props.mxEvent.getRoomId());
    const canRedact = room.currentState.maySendRedactionForEvent(this.props.mxEvent, cli.credentials.userId);
    let canPin = room.currentState.mayClientSendStateEvent('m.room.pinned_events', cli); // HACK: Intentionally say we can't pin if the user doesn't want to use the functionality

    if (!_SettingsStore.default.isFeatureEnabled("feature_pinning")) canPin = false;
    this.setState({
      canRedact,
      canPin
    });
  },
  _isPinned: function () {
    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.mxEvent.getRoomId());

    const pinnedEvent = room.currentState.getStateEvents('m.room.pinned_events', '');
    if (!pinnedEvent) return false;
    const content = pinnedEvent.getContent();
    return content.pinned && Array.isArray(content.pinned) && content.pinned.includes(this.props.mxEvent.getId());
  },
  onResendClick: function () {
    _Resend.default.resend(this.props.mxEvent);

    this.closeMenu();
  },
  onResendEditClick: function () {
    _Resend.default.resend(this.props.mxEvent.replacingEvent());

    this.closeMenu();
  },
  onResendRedactionClick: function () {
    _Resend.default.resend(this.props.mxEvent.localRedactionEvent());

    this.closeMenu();
  },
  onResendReactionsClick: function () {
    for (const reaction of this._getUnsentReactions()) {
      _Resend.default.resend(reaction);
    }

    this.closeMenu();
  },
  e2eInfoClicked: function () {
    this.props.e2eInfoCallback();
    this.closeMenu();
  },
  onReportEventClick: function () {
    const ReportEventDialog = sdk.getComponent("dialogs.ReportEventDialog");

    _Modal.default.createTrackedDialog('Report Event', '', ReportEventDialog, {
      mxEvent: this.props.mxEvent
    }, 'mx_Dialog_reportEvent');

    this.closeMenu();
  },
  onViewSourceClick: function () {
    const ev = this.props.mxEvent.replacingEvent() || this.props.mxEvent;
    const ViewSource = sdk.getComponent('structures.ViewSource');

    _Modal.default.createTrackedDialog('View Event Source', '', ViewSource, {
      roomId: ev.getRoomId(),
      eventId: ev.getId(),
      content: ev.event
    }, 'mx_Dialog_viewsource');

    this.closeMenu();
  },
  onViewClearSourceClick: function () {
    const ev = this.props.mxEvent.replacingEvent() || this.props.mxEvent;
    const ViewSource = sdk.getComponent('structures.ViewSource');

    _Modal.default.createTrackedDialog('View Clear Event Source', '', ViewSource, {
      roomId: ev.getRoomId(),
      eventId: ev.getId(),
      // FIXME: _clearEvent is private
      content: ev._clearEvent
    }, 'mx_Dialog_viewsource');

    this.closeMenu();
  },
  onRedactClick: function () {
    const ConfirmRedactDialog = sdk.getComponent("dialogs.ConfirmRedactDialog");

    _Modal.default.createTrackedDialog('Confirm Redact Dialog', '', ConfirmRedactDialog, {
      onFinished: async proceed => {
        if (!proceed) return;

        const cli = _MatrixClientPeg.MatrixClientPeg.get();

        try {
          await cli.redactEvent(this.props.mxEvent.getRoomId(), this.props.mxEvent.getId());
        } catch (e) {
          const code = e.errcode || e.statusCode; // only show the dialog if failing for something other than a network error
          // (e.g. no errcode or statusCode) as in that case the redactions end up in the
          // detached queue and we show the room status bar to allow retry

          if (typeof code !== "undefined") {
            const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog"); // display error message stating you couldn't delete this.

            _Modal.default.createTrackedDialog('You cannot delete this message', '', ErrorDialog, {
              title: (0, _languageHandler._t)('Error'),
              description: (0, _languageHandler._t)('You cannot delete this message. (%(code)s)', {
                code
              })
            });
          }
        }
      }
    }, 'mx_Dialog_confirmredact');

    this.closeMenu();
  },
  onCancelSendClick: function () {
    const mxEvent = this.props.mxEvent;
    const editEvent = mxEvent.replacingEvent();
    const redactEvent = mxEvent.localRedactionEvent();

    const pendingReactions = this._getPendingReactions();

    if (editEvent && canCancel(editEvent.status)) {
      _Resend.default.removeFromQueue(editEvent);
    }

    if (redactEvent && canCancel(redactEvent.status)) {
      _Resend.default.removeFromQueue(redactEvent);
    }

    if (pendingReactions.length) {
      for (const reaction of pendingReactions) {
        _Resend.default.removeFromQueue(reaction);
      }
    }

    if (canCancel(mxEvent.status)) {
      _Resend.default.removeFromQueue(this.props.mxEvent);
    }

    this.closeMenu();
  },
  onForwardClick: function () {
    _dispatcher.default.dispatch({
      action: 'forward_event',
      event: this.props.mxEvent
    });

    this.closeMenu();
  },
  onPinClick: function () {
    _MatrixClientPeg.MatrixClientPeg.get().getStateEvent(this.props.mxEvent.getRoomId(), 'm.room.pinned_events', '').catch(e => {
      // Intercept the Event Not Found error and fall through the promise chain with no event.
      if (e.errcode === "M_NOT_FOUND") return null;
      throw e;
    }).then(event => {
      const eventIds = (event ? event.pinned : []) || [];

      if (!eventIds.includes(this.props.mxEvent.getId())) {
        // Not pinned - add
        eventIds.push(this.props.mxEvent.getId());
      } else {
        // Pinned - remove
        eventIds.splice(eventIds.indexOf(this.props.mxEvent.getId()), 1);
      }

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      cli.sendStateEvent(this.props.mxEvent.getRoomId(), 'm.room.pinned_events', {
        pinned: eventIds
      }, '');
    });

    this.closeMenu();
  },
  closeMenu: function () {
    if (this.props.onFinished) this.props.onFinished();
  },
  onUnhidePreviewClick: function () {
    if (this.props.eventTileOps) {
      this.props.eventTileOps.unhideWidget();
    }

    this.closeMenu();
  },
  onQuoteClick: function () {
    _dispatcher.default.dispatch({
      action: 'quote',
      event: this.props.mxEvent
    });

    this.closeMenu();
  },
  onPermalinkClick: function (e
  /*: Event*/
  ) {
    e.preventDefault();
    const ShareDialog = sdk.getComponent("dialogs.ShareDialog");

    _Modal.default.createTrackedDialog('share room message dialog', '', ShareDialog, {
      target: this.props.mxEvent,
      permalinkCreator: this.props.permalinkCreator
    });

    this.closeMenu();
  },
  onCollapseReplyThreadClick: function () {
    this.props.collapseReplyThread();
    this.closeMenu();
  },

  _getReactions(filter) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const room = cli.getRoom(this.props.mxEvent.getRoomId());
    const eventId = this.props.mxEvent.getId();
    return room.getPendingEvents().filter(e => {
      const relation = e.getRelation();
      return relation && relation.rel_type === "m.annotation" && relation.event_id === eventId && filter(e);
    });
  },

  _getPendingReactions() {
    return this._getReactions(e => canCancel(e.status));
  },

  _getUnsentReactions() {
    return this._getReactions(e => e.status === _matrixJsSdk.EventStatus.NOT_SENT);
  },

  render: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const me = cli.getUserId();
    const mxEvent = this.props.mxEvent;
    const eventStatus = mxEvent.status;
    const editStatus = mxEvent.replacingEvent() && mxEvent.replacingEvent().status;
    const redactStatus = mxEvent.localRedactionEvent() && mxEvent.localRedactionEvent().status;

    const unsentReactionsCount = this._getUnsentReactions().length;

    const pendingReactionsCount = this._getPendingReactions().length;

    const allowCancel = canCancel(mxEvent.status) || canCancel(editStatus) || canCancel(redactStatus) || pendingReactionsCount !== 0;
    let resendButton;
    let resendEditButton;
    let resendReactionsButton;
    let resendRedactionButton;
    let redactButton;
    let cancelButton;
    let forwardButton;
    let pinButton;
    let viewClearSourceButton;
    let unhidePreviewButton;
    let externalURLButton;
    let quoteButton;
    let collapseReplyThread; // status is SENT before remote-echo, null after

    const isSent = !eventStatus || eventStatus === _matrixJsSdk.EventStatus.SENT;

    if (!mxEvent.isRedacted()) {
      if (eventStatus === _matrixJsSdk.EventStatus.NOT_SENT) {
        resendButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          className: "mx_MessageContextMenu_field",
          onClick: this.onResendClick
        }, (0, _languageHandler._t)('Resend'));
      }

      if (editStatus === _matrixJsSdk.EventStatus.NOT_SENT) {
        resendEditButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          className: "mx_MessageContextMenu_field",
          onClick: this.onResendEditClick
        }, (0, _languageHandler._t)('Resend edit'));
      }

      if (unsentReactionsCount !== 0) {
        resendReactionsButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          className: "mx_MessageContextMenu_field",
          onClick: this.onResendReactionsClick
        }, (0, _languageHandler._t)('Resend %(unsentCount)s reaction(s)', {
          unsentCount: unsentReactionsCount
        }));
      }
    }

    if (redactStatus === _matrixJsSdk.EventStatus.NOT_SENT) {
      resendRedactionButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onResendRedactionClick
      }, (0, _languageHandler._t)('Resend removal'));
    }

    if (isSent && this.state.canRedact) {
      redactButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onRedactClick
      }, (0, _languageHandler._t)('Remove'));
    }

    if (allowCancel) {
      cancelButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onCancelSendClick
      }, (0, _languageHandler._t)('Cancel Sending'));
    }

    if ((0, _EventUtils.isContentActionable)(mxEvent)) {
      forwardButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onForwardClick
      }, (0, _languageHandler._t)('Forward Message'));

      if (this.state.canPin) {
        pinButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          className: "mx_MessageContextMenu_field",
          onClick: this.onPinClick
        }, this._isPinned() ? (0, _languageHandler._t)('Unpin Message') : (0, _languageHandler._t)('Pin Message'));
      }
    }

    const viewSourceButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_MessageContextMenu_field",
      onClick: this.onViewSourceClick
    }, (0, _languageHandler._t)('View Source'));

    if (mxEvent.getType() !== mxEvent.getWireType()) {
      viewClearSourceButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onViewClearSourceClick
      }, (0, _languageHandler._t)('View Decrypted Source'));
    }

    if (this.props.eventTileOps) {
      if (this.props.eventTileOps.isWidgetHidden()) {
        unhidePreviewButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          className: "mx_MessageContextMenu_field",
          onClick: this.onUnhidePreviewClick
        }, (0, _languageHandler._t)('Unhide Preview'));
      }
    }

    let permalink;

    if (this.props.permalinkCreator) {
      permalink = this.props.permalinkCreator.forEvent(this.props.mxEvent.getId());
    } // XXX: if we use room ID, we should also include a server where the event can be found (other than in the domain of the event ID)


    const permalinkButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      element: "a",
      className: "mx_MessageContextMenu_field",
      onClick: this.onPermalinkClick,
      href: permalink,
      target: "_blank",
      rel: "noreferrer noopener"
    }, mxEvent.isRedacted() || mxEvent.getType() !== 'm.room.message' ? (0, _languageHandler._t)('Share Permalink') : (0, _languageHandler._t)('Share Message'));

    if (this.props.eventTileOps) {
      // this event is rendered using TextualBody
      quoteButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onQuoteClick
      }, (0, _languageHandler._t)('Quote'));
    } // Bridges can provide a 'external_url' to link back to the source.


    if (typeof mxEvent.event.content.external_url === "string" && (0, _HtmlUtils.isUrlPermitted)(mxEvent.event.content.external_url)) {
      externalURLButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        element: "a",
        className: "mx_MessageContextMenu_field",
        target: "_blank",
        rel: "noreferrer noopener",
        onClick: this.closeMenu,
        href: mxEvent.event.content.external_url
      }, (0, _languageHandler._t)('Source URL'));
    }

    if (this.props.collapseReplyThread) {
      collapseReplyThread = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onCollapseReplyThreadClick
      }, (0, _languageHandler._t)('Collapse Reply Thread'));
    }

    let e2eInfo;

    if (this.props.e2eInfoCallback) {
      e2eInfo = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.e2eInfoClicked
      }, (0, _languageHandler._t)('End-to-end encryption information'));
    }

    let reportEventButton;

    if (mxEvent.getSender() !== me) {
      reportEventButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_MessageContextMenu_field",
        onClick: this.onReportEventClick
      }, (0, _languageHandler._t)('Report Content'));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MessageContextMenu"
    }, resendButton, resendEditButton, resendReactionsButton, resendRedactionButton, redactButton, cancelButton, forwardButton, pinButton, viewSourceButton, viewClearSourceButton, unhidePreviewButton, permalinkButton, quoteButton, externalURLButton, collapseReplyThread, e2eInfo, reportEventButton);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvTWVzc2FnZUNvbnRleHRNZW51LmpzIl0sIm5hbWVzIjpbImNhbkNhbmNlbCIsImV2ZW50U3RhdHVzIiwiRXZlbnRTdGF0dXMiLCJRVUVVRUQiLCJOT1RfU0VOVCIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwibXhFdmVudCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJldmVudFRpbGVPcHMiLCJjb2xsYXBzZVJlcGx5VGhyZWFkIiwiZnVuYyIsIm9uRmluaXNoZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJjYW5SZWRhY3QiLCJjYW5QaW4iLCJjb21wb25lbnREaWRNb3VudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm9uIiwiX2NoZWNrUGVybWlzc2lvbnMiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsaSIsInJlbW92ZUxpc3RlbmVyIiwicm9vbSIsImdldFJvb20iLCJwcm9wcyIsImdldFJvb21JZCIsImN1cnJlbnRTdGF0ZSIsIm1heVNlbmRSZWRhY3Rpb25Gb3JFdmVudCIsImNyZWRlbnRpYWxzIiwidXNlcklkIiwibWF5Q2xpZW50U2VuZFN0YXRlRXZlbnQiLCJTZXR0aW5nc1N0b3JlIiwiaXNGZWF0dXJlRW5hYmxlZCIsInNldFN0YXRlIiwiX2lzUGlubmVkIiwicGlubmVkRXZlbnQiLCJnZXRTdGF0ZUV2ZW50cyIsImNvbnRlbnQiLCJnZXRDb250ZW50IiwicGlubmVkIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5jbHVkZXMiLCJnZXRJZCIsIm9uUmVzZW5kQ2xpY2siLCJSZXNlbmQiLCJyZXNlbmQiLCJjbG9zZU1lbnUiLCJvblJlc2VuZEVkaXRDbGljayIsInJlcGxhY2luZ0V2ZW50Iiwib25SZXNlbmRSZWRhY3Rpb25DbGljayIsImxvY2FsUmVkYWN0aW9uRXZlbnQiLCJvblJlc2VuZFJlYWN0aW9uc0NsaWNrIiwicmVhY3Rpb24iLCJfZ2V0VW5zZW50UmVhY3Rpb25zIiwiZTJlSW5mb0NsaWNrZWQiLCJlMmVJbmZvQ2FsbGJhY2siLCJvblJlcG9ydEV2ZW50Q2xpY2siLCJSZXBvcnRFdmVudERpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsIm9uVmlld1NvdXJjZUNsaWNrIiwiZXYiLCJWaWV3U291cmNlIiwicm9vbUlkIiwiZXZlbnRJZCIsImV2ZW50Iiwib25WaWV3Q2xlYXJTb3VyY2VDbGljayIsIl9jbGVhckV2ZW50Iiwib25SZWRhY3RDbGljayIsIkNvbmZpcm1SZWRhY3REaWFsb2ciLCJwcm9jZWVkIiwicmVkYWN0RXZlbnQiLCJlIiwiY29kZSIsImVycmNvZGUiLCJzdGF0dXNDb2RlIiwiRXJyb3JEaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwib25DYW5jZWxTZW5kQ2xpY2siLCJlZGl0RXZlbnQiLCJwZW5kaW5nUmVhY3Rpb25zIiwiX2dldFBlbmRpbmdSZWFjdGlvbnMiLCJzdGF0dXMiLCJyZW1vdmVGcm9tUXVldWUiLCJsZW5ndGgiLCJvbkZvcndhcmRDbGljayIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwib25QaW5DbGljayIsImdldFN0YXRlRXZlbnQiLCJjYXRjaCIsInRoZW4iLCJldmVudElkcyIsInB1c2giLCJzcGxpY2UiLCJpbmRleE9mIiwic2VuZFN0YXRlRXZlbnQiLCJvblVuaGlkZVByZXZpZXdDbGljayIsInVuaGlkZVdpZGdldCIsIm9uUXVvdGVDbGljayIsIm9uUGVybWFsaW5rQ2xpY2siLCJwcmV2ZW50RGVmYXVsdCIsIlNoYXJlRGlhbG9nIiwidGFyZ2V0IiwicGVybWFsaW5rQ3JlYXRvciIsIm9uQ29sbGFwc2VSZXBseVRocmVhZENsaWNrIiwiX2dldFJlYWN0aW9ucyIsImZpbHRlciIsImdldFBlbmRpbmdFdmVudHMiLCJyZWxhdGlvbiIsImdldFJlbGF0aW9uIiwicmVsX3R5cGUiLCJldmVudF9pZCIsInJlbmRlciIsIm1lIiwiZ2V0VXNlcklkIiwiZWRpdFN0YXR1cyIsInJlZGFjdFN0YXR1cyIsInVuc2VudFJlYWN0aW9uc0NvdW50IiwicGVuZGluZ1JlYWN0aW9uc0NvdW50IiwiYWxsb3dDYW5jZWwiLCJyZXNlbmRCdXR0b24iLCJyZXNlbmRFZGl0QnV0dG9uIiwicmVzZW5kUmVhY3Rpb25zQnV0dG9uIiwicmVzZW5kUmVkYWN0aW9uQnV0dG9uIiwicmVkYWN0QnV0dG9uIiwiY2FuY2VsQnV0dG9uIiwiZm9yd2FyZEJ1dHRvbiIsInBpbkJ1dHRvbiIsInZpZXdDbGVhclNvdXJjZUJ1dHRvbiIsInVuaGlkZVByZXZpZXdCdXR0b24iLCJleHRlcm5hbFVSTEJ1dHRvbiIsInF1b3RlQnV0dG9uIiwiaXNTZW50IiwiU0VOVCIsImlzUmVkYWN0ZWQiLCJ1bnNlbnRDb3VudCIsInN0YXRlIiwidmlld1NvdXJjZUJ1dHRvbiIsImdldFR5cGUiLCJnZXRXaXJlVHlwZSIsImlzV2lkZ2V0SGlkZGVuIiwicGVybWFsaW5rIiwiZm9yRXZlbnQiLCJwZXJtYWxpbmtCdXR0b24iLCJleHRlcm5hbF91cmwiLCJlMmVJbmZvIiwicmVwb3J0RXZlbnRCdXR0b24iLCJnZXRTZW5kZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWpDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUNBLFNBQVNBLFNBQVQsQ0FBbUJDLFdBQW5CLEVBQWdDO0FBQzVCLFNBQU9BLFdBQVcsS0FBS0MseUJBQVlDLE1BQTVCLElBQXNDRixXQUFXLEtBQUtDLHlCQUFZRSxRQUF6RTtBQUNIOztlQUVjLCtCQUFpQjtBQUM1QkMsRUFBQUEsV0FBVyxFQUFFLG9CQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBQyxJQUFBQSxPQUFPLEVBQUVDLG1CQUFVQyxNQUFWLENBQWlCQyxVQUZuQjs7QUFJUDtBQUNBQyxJ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QUFBaEUsU0FDTSx5QkFBRyx1QkFBSCxDQUROLENBREo7QUFLSDs7QUFFRCxRQUFJeUMsT0FBSjs7QUFDQSxRQUFJLEtBQUsvSCxLQUFMLENBQVdnQyxlQUFmLEVBQWdDO0FBQzVCK0YsTUFBQUEsT0FBTyxnQkFDSCw2QkFBQyxxQkFBRDtBQUFVLFFBQUEsU0FBUyxFQUFDLDZCQUFwQjtBQUFrRCxRQUFBLE9BQU8sRUFBRSxLQUFLaEc7QUFBaEUsU0FDTSx5QkFBRyxtQ0FBSCxDQUROLENBREo7QUFLSDs7QUFFRCxRQUFJaUcsaUJBQUo7O0FBQ0EsUUFBSXJKLE9BQU8sQ0FBQ3NKLFNBQVIsT0FBd0JsQyxFQUE1QixFQUFnQztBQUM1QmlDLE1BQUFBLGlCQUFpQixnQkFDYiw2QkFBQyxxQkFBRDtBQUFVLFFBQUEsU0FBUyxFQUFDLDZCQUFwQjtBQUFrRCxRQUFBLE9BQU8sRUFBRSxLQUFLL0Y7QUFBaEUsU0FDTSx5QkFBRyxnQkFBSCxDQUROLENBREo7QUFLSDs7QUFFRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTXFFLFlBRE4sRUFFTUMsZ0JBRk4sRUFHTUMscUJBSE4sRUFJTUMscUJBSk4sRUFLTUMsWUFMTixFQU1NQyxZQU5OLEVBT01DLGFBUE4sRUFRTUMsU0FSTixFQVNNVSxnQkFUTixFQVVNVCxxQkFWTixFQVdNQyxtQkFYTixFQVlNYyxlQVpOLEVBYU1aLFdBYk4sRUFjTUQsaUJBZE4sRUFlTWhJLG1CQWZOLEVBZ0JNK0ksT0FoQk4sRUFpQk1DLGlCQWpCTixDQURKO0FBcUJIO0FBbmQyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7RXZlbnRTdGF0dXN9IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IFJlc2VuZCBmcm9tICcuLi8uLi8uLi9SZXNlbmQnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5pbXBvcnQgeyBpc1VybFBlcm1pdHRlZCB9IGZyb20gJy4uLy4uLy4uL0h0bWxVdGlscyc7XG5pbXBvcnQgeyBpc0NvbnRlbnRBY3Rpb25hYmxlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvRXZlbnRVdGlscyc7XG5pbXBvcnQge01lbnVJdGVtfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuXG5mdW5jdGlvbiBjYW5DYW5jZWwoZXZlbnRTdGF0dXMpIHtcbiAgICByZXR1cm4gZXZlbnRTdGF0dXMgPT09IEV2ZW50U3RhdHVzLlFVRVVFRCB8fCBldmVudFN0YXR1cyA9PT0gRXZlbnRTdGF0dXMuTk9UX1NFTlQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnTWVzc2FnZUNvbnRleHRNZW51JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvKiB0aGUgTWF0cml4RXZlbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250ZXh0IG1lbnUgKi9cbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8qIGFuIG9wdGlvbmFsIEV2ZW50VGlsZU9wcyBpbXBsZW1lbnRhdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHVuaGlkZSBwcmV2aWV3IHdpZGdldHMgKi9cbiAgICAgICAgZXZlbnRUaWxlT3BzOiBQcm9wVHlwZXMub2JqZWN0LFxuXG4gICAgICAgIC8qIGFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGNsaWNrcyBjb2xsYXBzZSB0aHJlYWQsIGlmIG5vdCBwcm92aWRlZCBoaWRlIGJ1dHRvbiAqL1xuICAgICAgICBjb2xsYXBzZVJlcGx5VGhyZWFkOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvKiBjYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgbWVudSBpcyBkaXNtaXNzZWQgKi9cbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYW5SZWRhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgY2FuUGluOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oJ1Jvb21NZW1iZXIucG93ZXJMZXZlbCcsIHRoaXMuX2NoZWNrUGVybWlzc2lvbnMpO1xuICAgICAgICB0aGlzLl9jaGVja1Blcm1pc3Npb25zKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpKSB7XG4gICAgICAgICAgICBjbGkucmVtb3ZlTGlzdGVuZXIoJ1Jvb21NZW1iZXIucG93ZXJMZXZlbCcsIHRoaXMuX2NoZWNrUGVybWlzc2lvbnMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jaGVja1Blcm1pc3Npb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20odGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpKTtcblxuICAgICAgICBjb25zdCBjYW5SZWRhY3QgPSByb29tLmN1cnJlbnRTdGF0ZS5tYXlTZW5kUmVkYWN0aW9uRm9yRXZlbnQodGhpcy5wcm9wcy5teEV2ZW50LCBjbGkuY3JlZGVudGlhbHMudXNlcklkKTtcbiAgICAgICAgbGV0IGNhblBpbiA9IHJvb20uY3VycmVudFN0YXRlLm1heUNsaWVudFNlbmRTdGF0ZUV2ZW50KCdtLnJvb20ucGlubmVkX2V2ZW50cycsIGNsaSk7XG5cbiAgICAgICAgLy8gSEFDSzogSW50ZW50aW9uYWxseSBzYXkgd2UgY2FuJ3QgcGluIGlmIHRoZSB1c2VyIGRvZXNuJ3Qgd2FudCB0byB1c2UgdGhlIGZ1bmN0aW9uYWxpdHlcbiAgICAgICAgaWYgKCFTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZUVuYWJsZWQoXCJmZWF0dXJlX3Bpbm5pbmdcIikpIGNhblBpbiA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2NhblJlZGFjdCwgY2FuUGlufSk7XG4gICAgfSxcblxuICAgIF9pc1Bpbm5lZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbSh0aGlzLnByb3BzLm14RXZlbnQuZ2V0Um9vbUlkKCkpO1xuICAgICAgICBjb25zdCBwaW5uZWRFdmVudCA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdtLnJvb20ucGlubmVkX2V2ZW50cycsICcnKTtcbiAgICAgICAgaWYgKCFwaW5uZWRFdmVudCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gcGlubmVkRXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICByZXR1cm4gY29udGVudC5waW5uZWQgJiYgQXJyYXkuaXNBcnJheShjb250ZW50LnBpbm5lZCkgJiYgY29udGVudC5waW5uZWQuaW5jbHVkZXModGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCkpO1xuICAgIH0sXG5cbiAgICBvblJlc2VuZENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmVzZW5kLnJlc2VuZCh0aGlzLnByb3BzLm14RXZlbnQpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH0sXG5cbiAgICBvblJlc2VuZEVkaXRDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIFJlc2VuZC5yZXNlbmQodGhpcy5wcm9wcy5teEV2ZW50LnJlcGxhY2luZ0V2ZW50KCkpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH0sXG5cbiAgICBvblJlc2VuZFJlZGFjdGlvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmVzZW5kLnJlc2VuZCh0aGlzLnByb3BzLm14RXZlbnQubG9jYWxSZWRhY3Rpb25FdmVudCgpKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25SZXNlbmRSZWFjdGlvbnNDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgdGhpcy5fZ2V0VW5zZW50UmVhY3Rpb25zKCkpIHtcbiAgICAgICAgICAgIFJlc2VuZC5yZXNlbmQocmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIGUyZUluZm9DbGlja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5lMmVJbmZvQ2FsbGJhY2soKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25SZXBvcnRFdmVudENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgUmVwb3J0RXZlbnREaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5SZXBvcnRFdmVudERpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnUmVwb3J0IEV2ZW50JywgJycsIFJlcG9ydEV2ZW50RGlhbG9nLCB7XG4gICAgICAgICAgICBteEV2ZW50OiB0aGlzLnByb3BzLm14RXZlbnQsXG4gICAgICAgIH0sICdteF9EaWFsb2dfcmVwb3J0RXZlbnQnKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25WaWV3U291cmNlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBldiA9IHRoaXMucHJvcHMubXhFdmVudC5yZXBsYWNpbmdFdmVudCgpIHx8IHRoaXMucHJvcHMubXhFdmVudDtcbiAgICAgICAgY29uc3QgVmlld1NvdXJjZSA9IHNkay5nZXRDb21wb25lbnQoJ3N0cnVjdHVyZXMuVmlld1NvdXJjZScpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdWaWV3IEV2ZW50IFNvdXJjZScsICcnLCBWaWV3U291cmNlLCB7XG4gICAgICAgICAgICByb29tSWQ6IGV2LmdldFJvb21JZCgpLFxuICAgICAgICAgICAgZXZlbnRJZDogZXYuZ2V0SWQoKSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGV2LmV2ZW50LFxuICAgICAgICB9LCAnbXhfRGlhbG9nX3ZpZXdzb3VyY2UnKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25WaWV3Q2xlYXJTb3VyY2VDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGV2ID0gdGhpcy5wcm9wcy5teEV2ZW50LnJlcGxhY2luZ0V2ZW50KCkgfHwgdGhpcy5wcm9wcy5teEV2ZW50O1xuICAgICAgICBjb25zdCBWaWV3U291cmNlID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5WaWV3U291cmNlJyk7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1ZpZXcgQ2xlYXIgRXZlbnQgU291cmNlJywgJycsIFZpZXdTb3VyY2UsIHtcbiAgICAgICAgICAgIHJvb21JZDogZXYuZ2V0Um9vbUlkKCksXG4gICAgICAgICAgICBldmVudElkOiBldi5nZXRJZCgpLFxuICAgICAgICAgICAgLy8gRklYTUU6IF9jbGVhckV2ZW50IGlzIHByaXZhdGVcbiAgICAgICAgICAgIGNvbnRlbnQ6IGV2Ll9jbGVhckV2ZW50LFxuICAgICAgICB9LCAnbXhfRGlhbG9nX3ZpZXdzb3VyY2UnKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25SZWRhY3RDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IENvbmZpcm1SZWRhY3REaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5Db25maXJtUmVkYWN0RGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdDb25maXJtIFJlZGFjdCBEaWFsb2cnLCAnJywgQ29uZmlybVJlZGFjdERpYWxvZywge1xuICAgICAgICAgICAgb25GaW5pc2hlZDogYXN5bmMgKHByb2NlZWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb2NlZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGkucmVkYWN0RXZlbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Um9vbUlkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBlLmVycmNvZGUgfHwgZS5zdGF0dXNDb2RlO1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHNob3cgdGhlIGRpYWxvZyBpZiBmYWlsaW5nIGZvciBzb21ldGhpbmcgb3RoZXIgdGhhbiBhIG5ldHdvcmsgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gKGUuZy4gbm8gZXJyY29kZSBvciBzdGF0dXNDb2RlKSBhcyBpbiB0aGF0IGNhc2UgdGhlIHJlZGFjdGlvbnMgZW5kIHVwIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBkZXRhY2hlZCBxdWV1ZSBhbmQgd2Ugc2hvdyB0aGUgcm9vbSBzdGF0dXMgYmFyIHRvIGFsbG93IHJldHJ5XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpc3BsYXkgZXJyb3IgbWVzc2FnZSBzdGF0aW5nIHlvdSBjb3VsZG4ndCBkZWxldGUgdGhpcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1lvdSBjYW5ub3QgZGVsZXRlIHRoaXMgbWVzc2FnZScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXJyb3InKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1lvdSBjYW5ub3QgZGVsZXRlIHRoaXMgbWVzc2FnZS4gKCUoY29kZSlzKScsIHtjb2RlfSksXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sICdteF9EaWFsb2dfY29uZmlybXJlZGFjdCcpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH0sXG5cbiAgICBvbkNhbmNlbFNlbmRDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG14RXZlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQ7XG4gICAgICAgIGNvbnN0IGVkaXRFdmVudCA9IG14RXZlbnQucmVwbGFjaW5nRXZlbnQoKTtcbiAgICAgICAgY29uc3QgcmVkYWN0RXZlbnQgPSBteEV2ZW50LmxvY2FsUmVkYWN0aW9uRXZlbnQoKTtcbiAgICAgICAgY29uc3QgcGVuZGluZ1JlYWN0aW9ucyA9IHRoaXMuX2dldFBlbmRpbmdSZWFjdGlvbnMoKTtcblxuICAgICAgICBpZiAoZWRpdEV2ZW50ICYmIGNhbkNhbmNlbChlZGl0RXZlbnQuc3RhdHVzKSkge1xuICAgICAgICAgICAgUmVzZW5kLnJlbW92ZUZyb21RdWV1ZShlZGl0RXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWRhY3RFdmVudCAmJiBjYW5DYW5jZWwocmVkYWN0RXZlbnQuc3RhdHVzKSkge1xuICAgICAgICAgICAgUmVzZW5kLnJlbW92ZUZyb21RdWV1ZShyZWRhY3RFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBlbmRpbmdSZWFjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIHBlbmRpbmdSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBSZXNlbmQucmVtb3ZlRnJvbVF1ZXVlKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FuQ2FuY2VsKG14RXZlbnQuc3RhdHVzKSkge1xuICAgICAgICAgICAgUmVzZW5kLnJlbW92ZUZyb21RdWV1ZSh0aGlzLnByb3BzLm14RXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIG9uRm9yd2FyZENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2ZvcndhcmRfZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnQ6IHRoaXMucHJvcHMubXhFdmVudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIG9uUGluQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0U3RhdGVFdmVudCh0aGlzLnByb3BzLm14RXZlbnQuZ2V0Um9vbUlkKCksICdtLnJvb20ucGlubmVkX2V2ZW50cycsICcnKVxuICAgICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSW50ZXJjZXB0IHRoZSBFdmVudCBOb3QgRm91bmQgZXJyb3IgYW5kIGZhbGwgdGhyb3VnaCB0aGUgcHJvbWlzZSBjaGFpbiB3aXRoIG5vIGV2ZW50LlxuICAgICAgICAgICAgICAgIGlmIChlLmVycmNvZGUgPT09IFwiTV9OT1RfRk9VTkRcIikgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudElkcyA9IChldmVudCA/IGV2ZW50LnBpbm5lZCA6IFtdKSB8fCBbXTtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50SWRzLmluY2x1ZGVzKHRoaXMucHJvcHMubXhFdmVudC5nZXRJZCgpKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgcGlubmVkIC0gYWRkXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SWRzLnB1c2godGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBpbm5lZCAtIHJlbW92ZVxuICAgICAgICAgICAgICAgICAgICBldmVudElkcy5zcGxpY2UoZXZlbnRJZHMuaW5kZXhPZih0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSksIDEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgICAgICBjbGkuc2VuZFN0YXRlRXZlbnQodGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpLCAnbS5yb29tLnBpbm5lZF9ldmVudHMnLCB7cGlubmVkOiBldmVudElkc30sICcnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH0sXG5cbiAgICBjbG9zZU1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkZpbmlzaGVkKSB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9LFxuXG4gICAgb25VbmhpZGVQcmV2aWV3Q2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5ldmVudFRpbGVPcHMpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMuZXZlbnRUaWxlT3BzLnVuaGlkZVdpZGdldCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIG9uUXVvdGVDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdxdW90ZScsXG4gICAgICAgICAgICBldmVudDogdGhpcy5wcm9wcy5teEV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgb25QZXJtYWxpbmtDbGljazogZnVuY3Rpb24oZTogRXZlbnQpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBTaGFyZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlNoYXJlRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdzaGFyZSByb29tIG1lc3NhZ2UgZGlhbG9nJywgJycsIFNoYXJlRGlhbG9nLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMucHJvcHMubXhFdmVudCxcbiAgICAgICAgICAgIHBlcm1hbGlua0NyZWF0b3I6IHRoaXMucHJvcHMucGVybWFsaW5rQ3JlYXRvcixcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIG9uQ29sbGFwc2VSZXBseVRocmVhZENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5jb2xsYXBzZVJlcGx5VGhyZWFkKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfSxcblxuICAgIF9nZXRSZWFjdGlvbnMoZmlsdGVyKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3Qgcm9vbSA9IGNsaS5nZXRSb29tKHRoaXMucHJvcHMubXhFdmVudC5nZXRSb29tSWQoKSk7XG4gICAgICAgIGNvbnN0IGV2ZW50SWQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKTtcbiAgICAgICAgcmV0dXJuIHJvb20uZ2V0UGVuZGluZ0V2ZW50cygpLmZpbHRlcihlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aW9uID0gZS5nZXRSZWxhdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHJlbGF0aW9uICYmXG4gICAgICAgICAgICAgICAgcmVsYXRpb24ucmVsX3R5cGUgPT09IFwibS5hbm5vdGF0aW9uXCIgJiZcbiAgICAgICAgICAgICAgICByZWxhdGlvbi5ldmVudF9pZCA9PT0gZXZlbnRJZCAmJlxuICAgICAgICAgICAgICAgIGZpbHRlcihlKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9nZXRQZW5kaW5nUmVhY3Rpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UmVhY3Rpb25zKGUgPT4gY2FuQ2FuY2VsKGUuc3RhdHVzKSk7XG4gICAgfSxcblxuICAgIF9nZXRVbnNlbnRSZWFjdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRSZWFjdGlvbnMoZSA9PiBlLnN0YXR1cyA9PT0gRXZlbnRTdGF0dXMuTk9UX1NFTlQpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IG1lID0gY2xpLmdldFVzZXJJZCgpO1xuICAgICAgICBjb25zdCBteEV2ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50O1xuICAgICAgICBjb25zdCBldmVudFN0YXR1cyA9IG14RXZlbnQuc3RhdHVzO1xuICAgICAgICBjb25zdCBlZGl0U3RhdHVzID0gbXhFdmVudC5yZXBsYWNpbmdFdmVudCgpICYmIG14RXZlbnQucmVwbGFjaW5nRXZlbnQoKS5zdGF0dXM7XG4gICAgICAgIGNvbnN0IHJlZGFjdFN0YXR1cyA9IG14RXZlbnQubG9jYWxSZWRhY3Rpb25FdmVudCgpICYmIG14RXZlbnQubG9jYWxSZWRhY3Rpb25FdmVudCgpLnN0YXR1cztcbiAgICAgICAgY29uc3QgdW5zZW50UmVhY3Rpb25zQ291bnQgPSB0aGlzLl9nZXRVbnNlbnRSZWFjdGlvbnMoKS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHBlbmRpbmdSZWFjdGlvbnNDb3VudCA9IHRoaXMuX2dldFBlbmRpbmdSZWFjdGlvbnMoKS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGFsbG93Q2FuY2VsID0gY2FuQ2FuY2VsKG14RXZlbnQuc3RhdHVzKSB8fFxuICAgICAgICAgICAgY2FuQ2FuY2VsKGVkaXRTdGF0dXMpIHx8XG4gICAgICAgICAgICBjYW5DYW5jZWwocmVkYWN0U3RhdHVzKSB8fFxuICAgICAgICAgICAgcGVuZGluZ1JlYWN0aW9uc0NvdW50ICE9PSAwO1xuICAgICAgICBsZXQgcmVzZW5kQnV0dG9uO1xuICAgICAgICBsZXQgcmVzZW5kRWRpdEJ1dHRvbjtcbiAgICAgICAgbGV0IHJlc2VuZFJlYWN0aW9uc0J1dHRvbjtcbiAgICAgICAgbGV0IHJlc2VuZFJlZGFjdGlvbkJ1dHRvbjtcbiAgICAgICAgbGV0IHJlZGFjdEJ1dHRvbjtcbiAgICAgICAgbGV0IGNhbmNlbEJ1dHRvbjtcbiAgICAgICAgbGV0IGZvcndhcmRCdXR0b247XG4gICAgICAgIGxldCBwaW5CdXR0b247XG4gICAgICAgIGxldCB2aWV3Q2xlYXJTb3VyY2VCdXR0b247XG4gICAgICAgIGxldCB1bmhpZGVQcmV2aWV3QnV0dG9uO1xuICAgICAgICBsZXQgZXh0ZXJuYWxVUkxCdXR0b247XG4gICAgICAgIGxldCBxdW90ZUJ1dHRvbjtcbiAgICAgICAgbGV0IGNvbGxhcHNlUmVwbHlUaHJlYWQ7XG5cbiAgICAgICAgLy8gc3RhdHVzIGlzIFNFTlQgYmVmb3JlIHJlbW90ZS1lY2hvLCBudWxsIGFmdGVyXG4gICAgICAgIGNvbnN0IGlzU2VudCA9ICFldmVudFN0YXR1cyB8fCBldmVudFN0YXR1cyA9PT0gRXZlbnRTdGF0dXMuU0VOVDtcbiAgICAgICAgaWYgKCFteEV2ZW50LmlzUmVkYWN0ZWQoKSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50U3RhdHVzID09PSBFdmVudFN0YXR1cy5OT1RfU0VOVCkge1xuICAgICAgICAgICAgICAgIHJlc2VuZEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb250ZXh0TWVudV9maWVsZFwiIG9uQ2xpY2s9e3RoaXMub25SZXNlbmRDbGlja30+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdSZXNlbmQnKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVkaXRTdGF0dXMgPT09IEV2ZW50U3RhdHVzLk5PVF9TRU5UKSB7XG4gICAgICAgICAgICAgICAgcmVzZW5kRWRpdEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb250ZXh0TWVudV9maWVsZFwiIG9uQ2xpY2s9e3RoaXMub25SZXNlbmRFZGl0Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnUmVzZW5kIGVkaXQnKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuc2VudFJlYWN0aW9uc0NvdW50ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzZW5kUmVhY3Rpb25zQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCIgb25DbGljaz17dGhpcy5vblJlc2VuZFJlYWN0aW9uc0NsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1Jlc2VuZCAlKHVuc2VudENvdW50KXMgcmVhY3Rpb24ocyknLCB7dW5zZW50Q291bnQ6IHVuc2VudFJlYWN0aW9uc0NvdW50fSkgfVxuICAgICAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVkYWN0U3RhdHVzID09PSBFdmVudFN0YXR1cy5OT1RfU0VOVCkge1xuICAgICAgICAgICAgcmVzZW5kUmVkYWN0aW9uQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uUmVzZW5kUmVkYWN0aW9uQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdSZXNlbmQgcmVtb3ZhbCcpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1NlbnQgJiYgdGhpcy5zdGF0ZS5jYW5SZWRhY3QpIHtcbiAgICAgICAgICAgIHJlZGFjdEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCIgb25DbGljaz17dGhpcy5vblJlZGFjdENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnUmVtb3ZlJykgfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFsbG93Q2FuY2VsKSB7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb250ZXh0TWVudV9maWVsZFwiIG9uQ2xpY2s9e3RoaXMub25DYW5jZWxTZW5kQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdDYW5jZWwgU2VuZGluZycpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0NvbnRlbnRBY3Rpb25hYmxlKG14RXZlbnQpKSB7XG4gICAgICAgICAgICBmb3J3YXJkQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uRm9yd2FyZENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnRm9yd2FyZCBNZXNzYWdlJykgfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW5QaW4pIHtcbiAgICAgICAgICAgICAgICBwaW5CdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uUGluQ2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9pc1Bpbm5lZCgpID8gX3QoJ1VucGluIE1lc3NhZ2UnKSA6IF90KCdQaW4gTWVzc2FnZScpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9NZW51SXRlbT5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgdmlld1NvdXJjZUJ1dHRvbiA9IChcbiAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uVmlld1NvdXJjZUNsaWNrfT5cbiAgICAgICAgICAgICAgICB7IF90KCdWaWV3IFNvdXJjZScpIH1cbiAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKG14RXZlbnQuZ2V0VHlwZSgpICE9PSBteEV2ZW50LmdldFdpcmVUeXBlKCkpIHtcbiAgICAgICAgICAgIHZpZXdDbGVhclNvdXJjZUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCIgb25DbGljaz17dGhpcy5vblZpZXdDbGVhclNvdXJjZUNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnVmlldyBEZWNyeXB0ZWQgU291cmNlJykgfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZXZlbnRUaWxlT3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5ldmVudFRpbGVPcHMuaXNXaWRnZXRIaWRkZW4oKSkge1xuICAgICAgICAgICAgICAgIHVuaGlkZVByZXZpZXdCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uVW5oaWRlUHJldmlld0NsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1VuaGlkZSBQcmV2aWV3JykgfVxuICAgICAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGVybWFsaW5rO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5wZXJtYWxpbmtDcmVhdG9yKSB7XG4gICAgICAgICAgICBwZXJtYWxpbmsgPSB0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3IuZm9yRXZlbnQodGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFhYWDogaWYgd2UgdXNlIHJvb20gSUQsIHdlIHNob3VsZCBhbHNvIGluY2x1ZGUgYSBzZXJ2ZXIgd2hlcmUgdGhlIGV2ZW50IGNhbiBiZSBmb3VuZCAob3RoZXIgdGhhbiBpbiB0aGUgZG9tYWluIG9mIHRoZSBldmVudCBJRClcbiAgICAgICAgY29uc3QgcGVybWFsaW5rQnV0dG9uID0gKFxuICAgICAgICAgICAgPE1lbnVJdGVtXG4gICAgICAgICAgICAgICAgZWxlbWVudD1cImFcIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb250ZXh0TWVudV9maWVsZFwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblBlcm1hbGlua0NsaWNrfVxuICAgICAgICAgICAgICAgIGhyZWY9e3Blcm1hbGlua31cbiAgICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICAgIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHsgbXhFdmVudC5pc1JlZGFjdGVkKCkgfHwgbXhFdmVudC5nZXRUeXBlKCkgIT09ICdtLnJvb20ubWVzc2FnZSdcbiAgICAgICAgICAgICAgICAgICAgPyBfdCgnU2hhcmUgUGVybWFsaW5rJykgOiBfdCgnU2hhcmUgTWVzc2FnZScpIH1cbiAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZXZlbnRUaWxlT3BzKSB7IC8vIHRoaXMgZXZlbnQgaXMgcmVuZGVyZWQgdXNpbmcgVGV4dHVhbEJvZHlcbiAgICAgICAgICAgIHF1b3RlQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uUXVvdGVDbGlja30+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ1F1b3RlJykgfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnJpZGdlcyBjYW4gcHJvdmlkZSBhICdleHRlcm5hbF91cmwnIHRvIGxpbmsgYmFjayB0byB0aGUgc291cmNlLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YobXhFdmVudC5ldmVudC5jb250ZW50LmV4dGVybmFsX3VybCkgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIGlzVXJsUGVybWl0dGVkKG14RXZlbnQuZXZlbnQuY29udGVudC5leHRlcm5hbF91cmwpXG4gICAgICAgICkge1xuICAgICAgICAgICAgZXh0ZXJuYWxVUkxCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9XCJhXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICAgICAgICAgICAgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuY2xvc2VNZW51fVxuICAgICAgICAgICAgICAgICAgICBocmVmPXtteEV2ZW50LmV2ZW50LmNvbnRlbnQuZXh0ZXJuYWxfdXJsfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnU291cmNlIFVSTCcpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5jb2xsYXBzZVJlcGx5VGhyZWFkKSB7XG4gICAgICAgICAgICBjb2xsYXBzZVJlcGx5VGhyZWFkID0gKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9NZXNzYWdlQ29udGV4dE1lbnVfZmllbGRcIiBvbkNsaWNrPXt0aGlzLm9uQ29sbGFwc2VSZXBseVRocmVhZENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnQ29sbGFwc2UgUmVwbHkgVGhyZWFkJykgfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGUyZUluZm87XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmUyZUluZm9DYWxsYmFjaykge1xuICAgICAgICAgICAgZTJlSW5mbyA9IChcbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCIgb25DbGljaz17dGhpcy5lMmVJbmZvQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ0VuZC10by1lbmQgZW5jcnlwdGlvbiBpbmZvcm1hdGlvbicpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXBvcnRFdmVudEJ1dHRvbjtcbiAgICAgICAgaWYgKG14RXZlbnQuZ2V0U2VuZGVyKCkgIT09IG1lKSB7XG4gICAgICAgICAgICByZXBvcnRFdmVudEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTWVzc2FnZUNvbnRleHRNZW51X2ZpZWxkXCIgb25DbGljaz17dGhpcy5vblJlcG9ydEV2ZW50Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdSZXBvcnQgQ29udGVudCcpIH1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lc3NhZ2VDb250ZXh0TWVudVwiPlxuICAgICAgICAgICAgICAgIHsgcmVzZW5kQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHJlc2VuZEVkaXRCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgcmVzZW5kUmVhY3Rpb25zQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHJlc2VuZFJlZGFjdGlvbkJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgeyByZWRhY3RCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgY2FuY2VsQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IGZvcndhcmRCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgcGluQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHZpZXdTb3VyY2VCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgdmlld0NsZWFyU291cmNlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHVuaGlkZVByZXZpZXdCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgcGVybWFsaW5rQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHF1b3RlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IGV4dGVybmFsVVJMQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IGNvbGxhcHNlUmVwbHlUaHJlYWQgfVxuICAgICAgICAgICAgICAgIHsgZTJlSW5mbyB9XG4gICAgICAgICAgICAgICAgeyByZXBvcnRFdmVudEJ1dHRvbiB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=