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

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var _IdentityAuthClient = _interopRequireDefault(require("../../../IdentityAuthClient"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
const MessageCase = Object.freeze({
  NotLoggedIn: "NotLoggedIn",
  Joining: "Joining",
  Loading: "Loading",
  Rejecting: "Rejecting",
  Kicked: "Kicked",
  Banned: "Banned",
  OtherThreePIDError: "OtherThreePIDError",
  InvitedEmailNotFoundInAccount: "InvitedEmailNotFoundInAccount",
  InvitedEmailNoIdentityServer: "InvitedEmailNoIdentityServer",
  InvitedEmailMismatch: "InvitedEmailMismatch",
  Invite: "Invite",
  ViewingRoom: "ViewingRoom",
  RoomNotFound: "RoomNotFound",
  OtherError: "OtherError"
});

var _default = (0, _createReactClass.default)({
  displayName: 'RoomPreviewBar',
  propTypes: {
    onJoinClick: _propTypes.default.func,
    onRejectClick: _propTypes.default.func,
    onRejectAndIgnoreClick: _propTypes.default.func,
    onForgetClick: _propTypes.default.func,
    // if inviterName is specified, the preview bar will shown an invite to the room.
    // You should also specify onRejectClick if specifiying inviterName
    inviterName: _propTypes.default.string,
    // If invited by 3rd party invite, the email address the invite was sent to
    invitedEmail: _propTypes.default.string,
    // For third party invites, information passed about the room out-of-band
    oobData: _propTypes.default.object,
    // For third party invites, a URL for a 3pid invite signing service
    signUrl: _propTypes.default.string,
    // A standard client/server API error object. If supplied, indicates that the
    // caller was unable to fetch details about the room for the given reason.
    error: _propTypes.default.object,
    canPreview: _propTypes.default.bool,
    previewLoading: _propTypes.default.bool,
    room: _propTypes.default.object,
    // When a spinner is present, a spinnerState can be specified to indicate the
    // purpose of the spinner.
    spinner: _propTypes.default.bool,
    spinnerState: _propTypes.default.oneOf(["joining"]),
    loading: _propTypes.default.bool,
    joining: _propTypes.default.bool,
    rejecting: _propTypes.default.bool,
    // The alias that was used to access this room, if appropriate
    // If given, this will be how the room is referred to (eg.
    // in error messages).
    roomAlias: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      onJoinClick: function () {}
    };
  },
  getInitialState: function () {
    return {
      busy: false
    };
  },
  componentDidMount: function () {
    this._checkInvitedEmail();
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.props.invitedEmail !== prevProps.invitedEmail || this.props.inviterName !== prevProps.inviterName) {
      this._checkInvitedEmail();
    }
  },
  _checkInvitedEmail: async function () {
    // If this is an invite and we've been told what email address was
    // invited, fetch the user's account emails and discovery bindings so we
    // can check them against the email that was invited.
    if (this.props.inviterName && this.props.invitedEmail) {
      this.setState({
        busy: true
      });

      try {
        // Gather the account 3PIDs
        const account3pids = await _MatrixClientPeg.MatrixClientPeg.get().getThreePids();
        this.setState({
          accountEmails: account3pids.threepids.filter(b => b.medium === 'email').map(b => b.address)
        }); // If we have an IS connected, use that to lookup the email and
        // check the bound MXID.

        if (!_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()) {
          this.setState({
            busy: false
          });
          return;
        }

        const authClient = new _IdentityAuthClient.default();
        const identityAccessToken = await authClient.getAccessToken();
        const result = await _MatrixClientPeg.MatrixClientPeg.get().lookupThreePid('email', this.props.invitedEmail, undefined
        /* callback */
        , identityAccessToken);
        this.setState({
          invitedEmailMxid: result.mxid
        });
      } catch (err) {
        this.setState({
          threePidFetchError: err
        });
      }

      this.setState({
        busy: false
      });
    }
  },

  _getMessageCase() {
    const isGuest = _MatrixClientPeg.MatrixClientPeg.get().isGuest();

    if (isGuest) {
      return MessageCase.NotLoggedIn;
    }

    const myMember = this._getMyMember();

    if (myMember) {
      if (myMember.isKicked()) {
        return MessageCase.Kicked;
      } else if (myMember.membership === "ban") {
        return MessageCase.Banned;
      }
    }

    if (this.props.joining) {
      return MessageCase.Joining;
    } else if (this.props.rejecting) {
      return MessageCase.Rejecting;
    } else if (this.props.loading || this.state.busy) {
      return MessageCase.Loading;
    }

    if (this.props.inviterName) {
      if (this.props.invitedEmail) {
        if (this.state.threePidFetchError) {
          return MessageCase.OtherThreePIDError;
        } else if (this.state.accountEmails && !this.state.accountEmails.includes(this.props.invitedEmail)) {
          return MessageCase.InvitedEmailNotFoundInAccount;
        } else if (!_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()) {
          return MessageCase.InvitedEmailNoIdentityServer;
        } else if (this.state.invitedEmailMxid != _MatrixClientPeg.MatrixClientPeg.get().getUserId()) {
          return MessageCase.InvitedEmailMismatch;
        }
      }

      return MessageCase.Invite;
    } else if (this.props.error) {
      if (this.props.error.errcode == 'M_NOT_FOUND') {
        return MessageCase.RoomNotFound;
      } else {
        return MessageCase.OtherError;
      }
    } else {
      return MessageCase.ViewingRoom;
    }
  },

  _getKickOrBanInfo() {
    const myMember = this._getMyMember();

    if (!myMember) {
      return {};
    }

    const kickerMember = this.props.room.currentState.getMember(myMember.events.member.getSender());
    const memberName = kickerMember ? kickerMember.name : myMember.events.member.getSender();
    const reason = myMember.events.member.getContent().reason;
    return {
      memberName,
      reason
    };
  },

  _joinRule: function () {
    const room = this.props.room;

    if (room) {
      const joinRules = room.currentState.getStateEvents('m.room.join_rules', '');

      if (joinRules) {
        return joinRules.getContent().join_rule;
      }
    }
  },
  _roomName: function (atStart = false) {
    const name = this.props.room ? this.props.room.name : this.props.roomAlias;

    if (name) {
      return name;
    } else if (atStart) {
      return (0, _languageHandler._t)("This room");
    } else {
      return (0, _languageHandler._t)("this room");
    }
  },

  _getMyMember() {
    return this.props.room && this.props.room.getMember(_MatrixClientPeg.MatrixClientPeg.get().getUserId());
  },

  _getInviteMember: function () {
    const {
      room
    } = this.props;

    if (!room) {
      return;
    }

    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

    const inviteEvent = room.currentState.getMember(myUserId);

    if (!inviteEvent) {
      return;
    }

    const inviterUserId = inviteEvent.events.member.getSender();
    return room.currentState.getMember(inviterUserId);
  },

  _isDMInvite() {
    const myMember = this._getMyMember();

    if (!myMember) {
      return false;
    }

    const memberEvent = myMember.events.member;
    const memberContent = memberEvent.getContent();
    return memberContent.membership === "invite" && memberContent.is_direct;
  },

  _makeScreenAfterLogin() {
    return {
      screen: 'room',
      params: {
        email: this.props.invitedEmail,
        signurl: this.props.signUrl,
        room_name: this.props.oobData ? this.props.oobData.room_name : null,
        room_avatar_url: this.props.oobData ? this.props.oobData.avatarUrl : null,
        inviter_name: this.props.oobData ? this.props.oobData.inviterName : null
      }
    };
  },

  onLoginClick: function () {
    _dispatcher.default.dispatch({
      action: 'start_login',
      screenAfterLogin: this._makeScreenAfterLogin()
    });
  },
  onRegisterClick: function () {
    _dispatcher.default.dispatch({
      action: 'start_registration',
      screenAfterLogin: this._makeScreenAfterLogin()
    });
  },
  render: function () {
    const Spinner = sdk.getComponent('elements.Spinner');
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let showSpinner = false;
    let darkStyle = false;
    let title;
    let subTitle;
    let primaryActionHandler;
    let primaryActionLabel;
    let secondaryActionHandler;
    let secondaryActionLabel;
    let footer;
    const extraComponents = [];

    const messageCase = this._getMessageCase();

    switch (messageCase) {
      case MessageCase.Joining:
        {
          title = (0, _languageHandler._t)("Joining room …");
          showSpinner = true;
          break;
        }

      case MessageCase.Loading:
        {
          title = (0, _languageHandler._t)("Loading …");
          showSpinner = true;
          break;
        }

      case MessageCase.Rejecting:
        {
          title = (0, _languageHandler._t)("Rejecting invite …");
          showSpinner = true;
          break;
        }

      case MessageCase.NotLoggedIn:
        {
          darkStyle = true;
          title = (0, _languageHandler._t)("Join the conversation with an account");
          primaryActionLabel = (0, _languageHandler._t)("Sign Up");
          primaryActionHandler = this.onRegisterClick;
          secondaryActionLabel = (0, _languageHandler._t)("Sign In");
          secondaryActionHandler = this.onLoginClick;

          if (this.props.previewLoading) {
            footer = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(Spinner, {
              w: 20,
              h: 20
            }), (0, _languageHandler._t)("Loading room preview"));
          }

          break;
        }

      case MessageCase.Kicked:
        {
          const {
            memberName,
            reason
          } = this._getKickOrBanInfo();

          title = (0, _languageHandler._t)("You were kicked from %(roomName)s by %(memberName)s", {
            memberName,
            roomName: this._roomName()
          });
          subTitle = reason ? (0, _languageHandler._t)("Reason: %(reason)s", {
            reason
          }) : null;

          if (this._joinRule() === "invite") {
            primaryActionLabel = (0, _languageHandler._t)("Forget this room");
            primaryActionHandler = this.props.onForgetClick;
          } else {
            primaryActionLabel = (0, _languageHandler._t)("Re-join");
            primaryActionHandler = this.props.onJoinClick;
            secondaryActionLabel = (0, _languageHandler._t)("Forget this room");
            secondaryActionHandler = this.props.onForgetClick;
          }

          break;
        }

      case MessageCase.Banned:
        {
          const {
            memberName,
            reason
          } = this._getKickOrBanInfo();

          title = (0, _languageHandler._t)("You were banned from %(roomName)s by %(memberName)s", {
            memberName,
            roomName: this._roomName()
          });
          subTitle = reason ? (0, _languageHandler._t)("Reason: %(reason)s", {
            reason
          }) : null;
          primaryActionLabel = (0, _languageHandler._t)("Forget this room");
          primaryActionHandler = this.props.onForgetClick;
          break;
        }

      case MessageCase.OtherThreePIDError:
        {
          title = (0, _languageHandler._t)("Something went wrong with your invite to %(roomName)s", {
            roomName: this._roomName()
          });

          const joinRule = this._joinRule();

          const errCodeMessage = (0, _languageHandler._t)("An error (%(errcode)s) was returned while trying to validate your " + "invite. You could try to pass this information on to a room admin.", {
            errcode: this.state.threePidFetchError.errcode || (0, _languageHandler._t)("unknown error code")
          });

          switch (joinRule) {
            case "invite":
              subTitle = [(0, _languageHandler._t)("You can only join it with a working invite."), errCodeMessage];
              primaryActionLabel = (0, _languageHandler._t)("Try to join anyway");
              primaryActionHandler = this.props.onJoinClick;
              break;

            case "public":
              subTitle = (0, _languageHandler._t)("You can still join it because this is a public room.");
              primaryActionLabel = (0, _languageHandler._t)("Join the discussion");
              primaryActionHandler = this.props.onJoinClick;
              break;

            default:
              subTitle = errCodeMessage;
              primaryActionLabel = (0, _languageHandler._t)("Try to join anyway");
              primaryActionHandler = this.props.onJoinClick;
              break;
          }

          break;
        }

      case MessageCase.InvitedEmailNotFoundInAccount:
        {
          title = (0, _languageHandler._t)("This invite to %(roomName)s was sent to %(email)s which is not " + "associated with your account", {
            roomName: this._roomName(),
            email: this.props.invitedEmail
          });
          subTitle = (0, _languageHandler._t)("Link this email with your account in Settings to receive invites " + "directly in Riot.");
          primaryActionLabel = (0, _languageHandler._t)("Join the discussion");
          primaryActionHandler = this.props.onJoinClick;
          break;
        }

      case MessageCase.InvitedEmailNoIdentityServer:
        {
          title = (0, _languageHandler._t)("This invite to %(roomName)s was sent to %(email)s", {
            roomName: this._roomName(),
            email: this.props.invitedEmail
          });
          subTitle = (0, _languageHandler._t)("Use an identity server in Settings to receive invites directly in Riot.");
          primaryActionLabel = (0, _languageHandler._t)("Join the discussion");
          primaryActionHandler = this.props.onJoinClick;
          break;
        }

      case MessageCase.InvitedEmailMismatch:
        {
          title = (0, _languageHandler._t)("This invite to %(roomName)s was sent to %(email)s", {
            roomName: this._roomName(),
            email: this.props.invitedEmail
          });
          subTitle = (0, _languageHandler._t)("Share this email in Settings to receive invites directly in Riot.");
          primaryActionLabel = (0, _languageHandler._t)("Join the discussion");
          primaryActionHandler = this.props.onJoinClick;
          break;
        }

      case MessageCase.Invite:
        {
          const RoomAvatar = sdk.getComponent("views.avatars.RoomAvatar");

          const avatar = /*#__PURE__*/_react.default.createElement(RoomAvatar, {
            room: this.props.room,
            oobData: this.props.oobData
          });

          const inviteMember = this._getInviteMember();

          let inviterElement;

          if (inviteMember) {
            inviterElement = /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("span", {
              className: "mx_RoomPreviewBar_inviter"
            }, inviteMember.rawDisplayName), " (", inviteMember.userId, ")");
          } else {
            inviterElement = /*#__PURE__*/_react.default.createElement("span", {
              className: "mx_RoomPreviewBar_inviter"
            }, this.props.inviterName);
          }

          const isDM = this._isDMInvite();

          if (isDM) {
            title = (0, _languageHandler._t)("Do you want to chat with %(user)s?", {
              user: inviteMember.name
            });
            subTitle = [avatar, (0, _languageHandler._t)("<userName/> wants to chat", {}, {
              userName: () => inviterElement
            })];
            primaryActionLabel = (0, _languageHandler._t)("Start chatting");
          } else {
            title = (0, _languageHandler._t)("Do you want to join %(roomName)s?", {
              roomName: this._roomName()
            });
            subTitle = [avatar, (0, _languageHandler._t)("<userName/> invited you", {}, {
              userName: () => inviterElement
            })];
            primaryActionLabel = (0, _languageHandler._t)("Accept");
          }

          primaryActionHandler = this.props.onJoinClick;
          secondaryActionLabel = (0, _languageHandler._t)("Reject");
          secondaryActionHandler = this.props.onRejectClick;

          if (this.props.onRejectAndIgnoreClick) {
            extraComponents.push( /*#__PURE__*/_react.default.createElement(AccessibleButton, {
              kind: "secondary",
              onClick: this.props.onRejectAndIgnoreClick,
              key: "ignore"
            }, (0, _languageHandler._t)("Reject & Ignore user")));
          }

          break;
        }

      case MessageCase.ViewingRoom:
        {
          if (this.props.canPreview) {
            title = (0, _languageHandler._t)("You're previewing %(roomName)s. Want to join it?", {
              roomName: this._roomName()
            });
          } else {
            title = (0, _languageHandler._t)("%(roomName)s can't be previewed. Do you want to join it?", {
              roomName: this._roomName(true)
            });
          }

          primaryActionLabel = (0, _languageHandler._t)("Join the discussion");
          primaryActionHandler = this.props.onJoinClick;
          break;
        }

      case MessageCase.RoomNotFound:
        {
          title = (0, _languageHandler._t)("%(roomName)s does not exist.", {
            roomName: this._roomName(true)
          });
          subTitle = (0, _languageHandler._t)("This room doesn't exist. Are you sure you're at the right place?");
          break;
        }

      case MessageCase.OtherError:
        {
          title = (0, _languageHandler._t)("%(roomName)s is not accessible at this time.", {
            roomName: this._roomName(true)
          });
          subTitle = [(0, _languageHandler._t)("Try again later, or ask a room admin to check if you have access."), (0, _languageHandler._t)("%(errcode)s was returned while trying to access the room. " + "If you think you're seeing this message in error, please " + "<issueLink>submit a bug report</issueLink>.", {
            errcode: this.props.error.errcode
          }, {
            issueLink: label => /*#__PURE__*/_react.default.createElement("a", {
              href: "https://github.com/vector-im/riot-web/issues/new/choose",
              target: "_blank",
              rel: "noreferrer noopener"
            }, label)
          })];
          break;
        }
    }

    let subTitleElements;

    if (subTitle) {
      if (!Array.isArray(subTitle)) {
        subTitle = [subTitle];
      }

      subTitleElements = subTitle.map((t, i) => /*#__PURE__*/_react.default.createElement("p", {
        key: "subTitle".concat(i)
      }, t));
    }

    let titleElement;

    if (showSpinner) {
      titleElement = /*#__PURE__*/_react.default.createElement("h3", {
        className: "mx_RoomPreviewBar_spinnerTitle"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null), title);
    } else {
      titleElement = /*#__PURE__*/_react.default.createElement("h3", null, title);
    }

    let primaryButton;

    if (primaryActionHandler) {
      primaryButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "primary",
        onClick: primaryActionHandler
      }, primaryActionLabel);
    }

    let secondaryButton;

    if (secondaryActionHandler) {
      secondaryButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "secondary",
        onClick: secondaryActionHandler
      }, secondaryActionLabel);
    }

    const classes = (0, _classnames.default)("mx_RoomPreviewBar", "dark-panel", "mx_RoomPreviewBar_".concat(messageCase), {
      "mx_RoomPreviewBar_panel": this.props.canPreview,
      "mx_RoomPreviewBar_dialog": !this.props.canPreview,
      "mx_RoomPreviewBar_dark": darkStyle
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomPreviewBar_message"
    }, titleElement, subTitleElements), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomPreviewBar_actions"
    }, secondaryButton, extraComponents, primaryButton), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomPreviewBar_footer"
    }, footer));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21QcmV2aWV3QmFyLmpzIl0sIm5hbWVzIjpbIk1lc3NhZ2VDYXNlIiwiT2JqZWN0IiwiZnJlZXplIiwiTm90TG9nZ2VkSW4iLCJKb2luaW5nIiwiTG9hZGluZyIsIlJlamVjdGluZyIsIktpY2tlZCIsIkJhbm5lZCIsIk90aGVyVGhyZWVQSURFcnJvciIsIkludml0ZWRFbWFpbE5vdEZvdW5kSW5BY2NvdW50IiwiSW52aXRlZEVtYWlsTm9JZGVudGl0eVNlcnZlciIsIkludml0ZWRFbWFpbE1pc21hdGNoIiwiSW52aXRlIiwiVmlld2luZ1Jvb20iLCJSb29tTm90Rm91bmQiLCJPdGhlckVycm9yIiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkpvaW5DbGljayIsIlByb3BUeXBlcyIsImZ1bmMiLCJvblJlamVjdENsaWNrIiwib25SZWplY3RBbmRJZ25vcmVDbGljayIsIm9uRm9yZ2V0Q2xpY2siLCJpbnZpdGVyTmFtZSIsInN0cmluZyIsImludml0ZWRFbWFpbCIsIm9vYkRhdGEiLCJvYmplY3QiLCJzaWduVXJsIiwiZXJyb3IiLCJjYW5QcmV2aWV3IiwiYm9vbCIsInByZXZpZXdMb2FkaW5nIiwicm9vbSIsInNwaW5uZXIiLCJzcGlubmVyU3RhdGUiLCJvbmVPZiIsImxvYWRpbmciLCJqb2luaW5nIiwicmVqZWN0aW5nIiwicm9vbUFsaWFzIiwiZ2V0RGVmYXVsdFByb3BzIiwiZ2V0SW5pdGlhbFN0YXRlIiwiYnVzeSIsImNvbXBvbmVudERpZE1vdW50IiwiX2NoZWNrSW52aXRlZEVtYWlsIiwiY29tcG9uZW50RGlkVXBkYXRlIiwicHJldlByb3BzIiwicHJldlN0YXRlIiwicHJvcHMiLCJzZXRTdGF0ZSIsImFjY291bnQzcGlkcyIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFRocmVlUGlkcyIsImFjY291bnRFbWFpbHMiLCJ0aHJlZXBpZHMiLCJmaWx0ZXIiLCJiIiwibWVkaXVtIiwibWFwIiwiYWRkcmVzcyIsImdldElkZW50aXR5U2VydmVyVXJsIiwiYXV0aENsaWVudCIsIklkZW50aXR5QXV0aENsaWVudCIsImlkZW50aXR5QWNjZXNzVG9rZW4iLCJnZXRBY2Nlc3NUb2tlbiIsInJlc3VsdCIsImxvb2t1cFRocmVlUGlkIiwidW5kZWZpbmVkIiwiaW52aXRlZEVtYWlsTXhpZCIsIm14aWQiLCJlcnIiLCJ0aHJlZVBpZEZldGNoRXJyb3IiLCJfZ2V0TWVzc2FnZUNhc2UiLCJpc0d1ZXN0IiwibXlNZW1iZXIiLCJfZ2V0TXlNZW1iZXIiLCJpc0tpY2tlZCIsIm1lbWJlcnNoaXAiLCJzdGF0ZSIsImluY2x1ZGVzIiwiZ2V0VXNlcklkIiwiZXJyY29kZSIsIl9nZXRLaWNrT3JCYW5JbmZvIiwia2lja2VyTWVtYmVyIiwiY3VycmVudFN0YXRlIiwiZ2V0TWVtYmVyIiwiZXZlbnRzIiwibWVtYmVyIiwiZ2V0U2VuZGVyIiwibWVtYmVyTmFtZSIsIm5hbWUiLCJyZWFzb24iLCJnZXRDb250ZW50IiwiX2pvaW5SdWxlIiwiam9pblJ1bGVzIiwiZ2V0U3RhdGVFdmVudHMiLCJqb2luX3J1bGUiLCJfcm9vbU5hbWUiLCJhdFN0YXJ0IiwiX2dldEludml0ZU1lbWJlciIsIm15VXNlcklkIiwiaW52aXRlRXZlbnQiLCJpbnZpdGVyVXNlcklkIiwiX2lzRE1JbnZpdGUiLCJtZW1iZXJFdmVudCIsIm1lbWJlckNvbnRlbnQiLCJpc19kaXJlY3QiLCJfbWFrZVNjcmVlbkFmdGVyTG9naW4iLCJzY3JlZW4iLCJwYXJhbXMiLCJlbWFpbCIsInNpZ251cmwiLCJyb29tX25hbWUiLCJyb29tX2F2YXRhcl91cmwiLCJhdmF0YXJVcmwiLCJpbnZpdGVyX25hbWUiLCJvbkxvZ2luQ2xpY2siLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInNjcmVlbkFmdGVyTG9naW4iLCJvblJlZ2lzdGVyQ2xpY2siLCJyZW5kZXIiLCJTcGlubmVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNob3dTcGlubmVyIiwiZGFya1N0eWxlIiwidGl0bGUiLCJzdWJUaXRsZSIsInByaW1hcnlBY3Rpb25IYW5kbGVyIiwicHJpbWFyeUFjdGlvbkxhYmVsIiwic2Vjb25kYXJ5QWN0aW9uSGFuZGxlciIsInNlY29uZGFyeUFjdGlvbkxhYmVsIiwiZm9vdGVyIiwiZXh0cmFDb21wb25lbnRzIiwibWVzc2FnZUNhc2UiLCJyb29tTmFtZSIsImpvaW5SdWxlIiwiZXJyQ29kZU1lc3NhZ2UiLCJSb29tQXZhdGFyIiwiYXZhdGFyIiwiaW52aXRlTWVtYmVyIiwiaW52aXRlckVsZW1lbnQiLCJyYXdEaXNwbGF5TmFtZSIsInVzZXJJZCIsImlzRE0iLCJ1c2VyIiwidXNlck5hbWUiLCJwdXNoIiwiaXNzdWVMaW5rIiwibGFiZWwiLCJzdWJUaXRsZUVsZW1lbnRzIiwiQXJyYXkiLCJpc0FycmF5IiwidCIsImkiLCJ0aXRsZUVsZW1lbnQiLCJwcmltYXJ5QnV0dG9uIiwic2Vjb25kYXJ5QnV0dG9uIiwiY2xhc3NlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBMUJBOzs7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxNQUFNQSxXQUFXLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzlCQyxFQUFBQSxXQUFXLEVBQUUsYUFEaUI7QUFFOUJDLEVBQUFBLE9BQU8sRUFBRSxTQUZxQjtBQUc5QkMsRUFBQUEsT0FBTyxFQUFFLFNBSHFCO0FBSTlCQyxFQUFBQSxTQUFTLEVBQUUsV0FKbUI7QUFLOUJDLEVBQUFBLE1BQU0sRUFBRSxRQUxzQjtBQU05QkMsRUFBQUEsTUFBTSxFQUFFLFFBTnNCO0FBTzlCQyxFQUFBQSxrQkFBa0IsRUFBRSxvQkFQVTtBQVE5QkMsRUFBQUEsNkJBQTZCLEVBQUUsK0JBUkQ7QUFTOUJDLEVBQUFBLDRCQUE0QixFQUFFLDhCQVRBO0FBVTlCQyxFQUFBQSxvQkFBb0IsRUFB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REo7QUFnQkg7QUFoaEIyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBJZGVudGl0eUF1dGhDbGllbnQgZnJvbSAnLi4vLi4vLi4vSWRlbnRpdHlBdXRoQ2xpZW50JztcblxuY29uc3QgTWVzc2FnZUNhc2UgPSBPYmplY3QuZnJlZXplKHtcbiAgICBOb3RMb2dnZWRJbjogXCJOb3RMb2dnZWRJblwiLFxuICAgIEpvaW5pbmc6IFwiSm9pbmluZ1wiLFxuICAgIExvYWRpbmc6IFwiTG9hZGluZ1wiLFxuICAgIFJlamVjdGluZzogXCJSZWplY3RpbmdcIixcbiAgICBLaWNrZWQ6IFwiS2lja2VkXCIsXG4gICAgQmFubmVkOiBcIkJhbm5lZFwiLFxuICAgIE90aGVyVGhyZWVQSURFcnJvcjogXCJPdGhlclRocmVlUElERXJyb3JcIixcbiAgICBJbnZpdGVkRW1haWxOb3RGb3VuZEluQWNjb3VudDogXCJJbnZpdGVkRW1haWxOb3RGb3VuZEluQWNjb3VudFwiLFxuICAgIEludml0ZWRFbWFpbE5vSWRlbnRpdHlTZXJ2ZXI6IFwiSW52aXRlZEVtYWlsTm9JZGVudGl0eVNlcnZlclwiLFxuICAgIEludml0ZWRFbWFpbE1pc21hdGNoOiBcIkludml0ZWRFbWFpbE1pc21hdGNoXCIsXG4gICAgSW52aXRlOiBcIkludml0ZVwiLFxuICAgIFZpZXdpbmdSb29tOiBcIlZpZXdpbmdSb29tXCIsXG4gICAgUm9vbU5vdEZvdW5kOiBcIlJvb21Ob3RGb3VuZFwiLFxuICAgIE90aGVyRXJyb3I6IFwiT3RoZXJFcnJvclwiLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUm9vbVByZXZpZXdCYXInLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uSm9pbkNsaWNrOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgb25SZWplY3RDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uUmVqZWN0QW5kSWdub3JlQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvbkZvcmdldENsaWNrOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgLy8gaWYgaW52aXRlck5hbWUgaXMgc3BlY2lmaWVkLCB0aGUgcHJldmlldyBiYXIgd2lsbCBzaG93biBhbiBpbnZpdGUgdG8gdGhlIHJvb20uXG4gICAgICAgIC8vIFlvdSBzaG91bGQgYWxzbyBzcGVjaWZ5IG9uUmVqZWN0Q2xpY2sgaWYgc3BlY2lmaXlpbmcgaW52aXRlck5hbWVcbiAgICAgICAgaW52aXRlck5hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gSWYgaW52aXRlZCBieSAzcmQgcGFydHkgaW52aXRlLCB0aGUgZW1haWwgYWRkcmVzcyB0aGUgaW52aXRlIHdhcyBzZW50IHRvXG4gICAgICAgIGludml0ZWRFbWFpbDogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBGb3IgdGhpcmQgcGFydHkgaW52aXRlcywgaW5mb3JtYXRpb24gcGFzc2VkIGFib3V0IHRoZSByb29tIG91dC1vZi1iYW5kXG4gICAgICAgIG9vYkRhdGE6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLy8gRm9yIHRoaXJkIHBhcnR5IGludml0ZXMsIGEgVVJMIGZvciBhIDNwaWQgaW52aXRlIHNpZ25pbmcgc2VydmljZVxuICAgICAgICBzaWduVXJsOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIEEgc3RhbmRhcmQgY2xpZW50L3NlcnZlciBBUEkgZXJyb3Igb2JqZWN0LiBJZiBzdXBwbGllZCwgaW5kaWNhdGVzIHRoYXQgdGhlXG4gICAgICAgIC8vIGNhbGxlciB3YXMgdW5hYmxlIHRvIGZldGNoIGRldGFpbHMgYWJvdXQgdGhlIHJvb20gZm9yIHRoZSBnaXZlbiByZWFzb24uXG4gICAgICAgIGVycm9yOiBQcm9wVHlwZXMub2JqZWN0LFxuXG4gICAgICAgIGNhblByZXZpZXc6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBwcmV2aWV3TG9hZGluZzogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLy8gV2hlbiBhIHNwaW5uZXIgaXMgcHJlc2VudCwgYSBzcGlubmVyU3RhdGUgY2FuIGJlIHNwZWNpZmllZCB0byBpbmRpY2F0ZSB0aGVcbiAgICAgICAgLy8gcHVycG9zZSBvZiB0aGUgc3Bpbm5lci5cbiAgICAgICAgc3Bpbm5lcjogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIHNwaW5uZXJTdGF0ZTogUHJvcFR5cGVzLm9uZU9mKFtcImpvaW5pbmdcIl0pLFxuICAgICAgICBsb2FkaW5nOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgam9pbmluZzogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIHJlamVjdGluZzogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIC8vIFRoZSBhbGlhcyB0aGF0IHdhcyB1c2VkIHRvIGFjY2VzcyB0aGlzIHJvb20sIGlmIGFwcHJvcHJpYXRlXG4gICAgICAgIC8vIElmIGdpdmVuLCB0aGlzIHdpbGwgYmUgaG93IHRoZSByb29tIGlzIHJlZmVycmVkIHRvIChlZy5cbiAgICAgICAgLy8gaW4gZXJyb3IgbWVzc2FnZXMpLlxuICAgICAgICByb29tQWxpYXM6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvbkpvaW5DbGljazogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NoZWNrSW52aXRlZEVtYWlsKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaW52aXRlZEVtYWlsICE9PSBwcmV2UHJvcHMuaW52aXRlZEVtYWlsIHx8IHRoaXMucHJvcHMuaW52aXRlck5hbWUgIT09IHByZXZQcm9wcy5pbnZpdGVyTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hlY2tJbnZpdGVkRW1haWwoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY2hlY2tJbnZpdGVkRW1haWw6IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGFuIGludml0ZSBhbmQgd2UndmUgYmVlbiB0b2xkIHdoYXQgZW1haWwgYWRkcmVzcyB3YXNcbiAgICAgICAgLy8gaW52aXRlZCwgZmV0Y2ggdGhlIHVzZXIncyBhY2NvdW50IGVtYWlscyBhbmQgZGlzY292ZXJ5IGJpbmRpbmdzIHNvIHdlXG4gICAgICAgIC8vIGNhbiBjaGVjayB0aGVtIGFnYWluc3QgdGhlIGVtYWlsIHRoYXQgd2FzIGludml0ZWQuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmludml0ZXJOYW1lICYmIHRoaXMucHJvcHMuaW52aXRlZEVtYWlsKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiB0cnVlfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEdhdGhlciB0aGUgYWNjb3VudCAzUElEc1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY291bnQzcGlkcyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRUaHJlZVBpZHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudEVtYWlsczogYWNjb3VudDNwaWRzLnRocmVlcGlkc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihiID0+IGIubWVkaXVtID09PSAnZW1haWwnKS5tYXAoYiA9PiBiLmFkZHJlc3MpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYW4gSVMgY29ubmVjdGVkLCB1c2UgdGhhdCB0byBsb29rdXAgdGhlIGVtYWlsIGFuZFxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBib3VuZCBNWElELlxuICAgICAgICAgICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogZmFsc2V9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhdXRoQ2xpZW50ID0gbmV3IElkZW50aXR5QXV0aENsaWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkZW50aXR5QWNjZXNzVG9rZW4gPSBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmxvb2t1cFRocmVlUGlkKFxuICAgICAgICAgICAgICAgICAgICAnZW1haWwnLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmludml0ZWRFbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkIC8qIGNhbGxiYWNrICovLFxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eUFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aW52aXRlZEVtYWlsTXhpZDogcmVzdWx0Lm14aWR9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3RocmVlUGlkRmV0Y2hFcnJvcjogZXJyfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRNZXNzYWdlQ2FzZSgpIHtcbiAgICAgICAgY29uc3QgaXNHdWVzdCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCk7XG5cbiAgICAgICAgaWYgKGlzR3Vlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBNZXNzYWdlQ2FzZS5Ob3RMb2dnZWRJbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG15TWVtYmVyID0gdGhpcy5fZ2V0TXlNZW1iZXIoKTtcblxuICAgICAgICBpZiAobXlNZW1iZXIpIHtcbiAgICAgICAgICAgIGlmIChteU1lbWJlci5pc0tpY2tlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1lc3NhZ2VDYXNlLktpY2tlZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXlNZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJiYW5cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBNZXNzYWdlQ2FzZS5CYW5uZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5qb2luaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gTWVzc2FnZUNhc2UuSm9pbmluZztcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnJlamVjdGluZykge1xuICAgICAgICAgICAgcmV0dXJuIE1lc3NhZ2VDYXNlLlJlamVjdGluZztcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmxvYWRpbmcgfHwgdGhpcy5zdGF0ZS5idXN5KSB7XG4gICAgICAgICAgICByZXR1cm4gTWVzc2FnZUNhc2UuTG9hZGluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmludml0ZXJOYW1lKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5pbnZpdGVkRW1haWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS50aHJlZVBpZEZldGNoRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1lc3NhZ2VDYXNlLk90aGVyVGhyZWVQSURFcnJvcjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmFjY291bnRFbWFpbHMgJiZcbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuc3RhdGUuYWNjb3VudEVtYWlscy5pbmNsdWRlcyh0aGlzLnByb3BzLmludml0ZWRFbWFpbClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1lc3NhZ2VDYXNlLkludml0ZWRFbWFpbE5vdEZvdW5kSW5BY2NvdW50O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRJZGVudGl0eVNlcnZlclVybCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNZXNzYWdlQ2FzZS5JbnZpdGVkRW1haWxOb0lkZW50aXR5U2VydmVyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5pbnZpdGVkRW1haWxNeGlkICE9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWVzc2FnZUNhc2UuSW52aXRlZEVtYWlsTWlzbWF0Y2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE1lc3NhZ2VDYXNlLkludml0ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmVycm9yKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5lcnJvci5lcnJjb2RlID09ICdNX05PVF9GT1VORCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWVzc2FnZUNhc2UuUm9vbU5vdEZvdW5kO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWVzc2FnZUNhc2UuT3RoZXJFcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNZXNzYWdlQ2FzZS5WaWV3aW5nUm9vbTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZ2V0S2lja09yQmFuSW5mbygpIHtcbiAgICAgICAgY29uc3QgbXlNZW1iZXIgPSB0aGlzLl9nZXRNeU1lbWJlcigpO1xuICAgICAgICBpZiAoIW15TWVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qga2lja2VyTWVtYmVyID0gdGhpcy5wcm9wcy5yb29tLmN1cnJlbnRTdGF0ZS5nZXRNZW1iZXIoXG4gICAgICAgICAgICBteU1lbWJlci5ldmVudHMubWVtYmVyLmdldFNlbmRlcigpLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBtZW1iZXJOYW1lID0ga2lja2VyTWVtYmVyID9cbiAgICAgICAgICAgIGtpY2tlck1lbWJlci5uYW1lIDogbXlNZW1iZXIuZXZlbnRzLm1lbWJlci5nZXRTZW5kZXIoKTtcbiAgICAgICAgY29uc3QgcmVhc29uID0gbXlNZW1iZXIuZXZlbnRzLm1lbWJlci5nZXRDb250ZW50KCkucmVhc29uO1xuICAgICAgICByZXR1cm4ge21lbWJlck5hbWUsIHJlYXNvbn07XG4gICAgfSxcblxuICAgIF9qb2luUnVsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLnByb3BzLnJvb207XG4gICAgICAgIGlmIChyb29tKSB7XG4gICAgICAgICAgICBjb25zdCBqb2luUnVsZXMgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnbS5yb29tLmpvaW5fcnVsZXMnLCAnJyk7XG4gICAgICAgICAgICBpZiAoam9pblJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpvaW5SdWxlcy5nZXRDb250ZW50KCkuam9pbl9ydWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yb29tTmFtZTogZnVuY3Rpb24oYXRTdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnByb3BzLnJvb20gPyB0aGlzLnByb3BzLnJvb20ubmFtZSA6IHRoaXMucHJvcHMucm9vbUFsaWFzO1xuICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoYXRTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiVGhpcyByb29tXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwidGhpcyByb29tXCIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRNeU1lbWJlcigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRoaXMucHJvcHMucm9vbSAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5yb29tLmdldE1lbWJlcihNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCkpXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9nZXRJbnZpdGVNZW1iZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCB7cm9vbX0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBteVVzZXJJZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3QgaW52aXRlRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRNZW1iZXIobXlVc2VySWQpO1xuICAgICAgICBpZiAoIWludml0ZUV2ZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW52aXRlclVzZXJJZCA9IGludml0ZUV2ZW50LmV2ZW50cy5tZW1iZXIuZ2V0U2VuZGVyKCk7XG4gICAgICAgIHJldHVybiByb29tLmN1cnJlbnRTdGF0ZS5nZXRNZW1iZXIoaW52aXRlclVzZXJJZCk7XG4gICAgfSxcblxuICAgIF9pc0RNSW52aXRlKCkge1xuICAgICAgICBjb25zdCBteU1lbWJlciA9IHRoaXMuX2dldE15TWVtYmVyKCk7XG4gICAgICAgIGlmICghbXlNZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtZW1iZXJFdmVudCA9IG15TWVtYmVyLmV2ZW50cy5tZW1iZXI7XG4gICAgICAgIGNvbnN0IG1lbWJlckNvbnRlbnQgPSBtZW1iZXJFdmVudC5nZXRDb250ZW50KCk7XG4gICAgICAgIHJldHVybiBtZW1iZXJDb250ZW50Lm1lbWJlcnNoaXAgPT09IFwiaW52aXRlXCIgJiYgbWVtYmVyQ29udGVudC5pc19kaXJlY3Q7XG4gICAgfSxcblxuICAgIF9tYWtlU2NyZWVuQWZ0ZXJMb2dpbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjcmVlbjogJ3Jvb20nLFxuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgZW1haWw6IHRoaXMucHJvcHMuaW52aXRlZEVtYWlsLFxuICAgICAgICAgICAgICAgIHNpZ251cmw6IHRoaXMucHJvcHMuc2lnblVybCxcbiAgICAgICAgICAgICAgICByb29tX25hbWU6IHRoaXMucHJvcHMub29iRGF0YSA/IHRoaXMucHJvcHMub29iRGF0YS5yb29tX25hbWUgOiBudWxsLFxuICAgICAgICAgICAgICAgIHJvb21fYXZhdGFyX3VybDogdGhpcy5wcm9wcy5vb2JEYXRhID8gdGhpcy5wcm9wcy5vb2JEYXRhLmF2YXRhclVybCA6IG51bGwsXG4gICAgICAgICAgICAgICAgaW52aXRlcl9uYW1lOiB0aGlzLnByb3BzLm9vYkRhdGEgPyB0aGlzLnByb3BzLm9vYkRhdGEuaW52aXRlck5hbWUgOiBudWxsLFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvbkxvZ2luQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goeyBhY3Rpb246ICdzdGFydF9sb2dpbicsIHNjcmVlbkFmdGVyTG9naW46IHRoaXMuX21ha2VTY3JlZW5BZnRlckxvZ2luKCkgfSk7XG4gICAgfSxcblxuICAgIG9uUmVnaXN0ZXJDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7IGFjdGlvbjogJ3N0YXJ0X3JlZ2lzdHJhdGlvbicsIHNjcmVlbkFmdGVyTG9naW46IHRoaXMuX21ha2VTY3JlZW5BZnRlckxvZ2luKCkgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcGlubmVyJyk7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG5cbiAgICAgICAgbGV0IHNob3dTcGlubmVyID0gZmFsc2U7XG4gICAgICAgIGxldCBkYXJrU3R5bGUgPSBmYWxzZTtcbiAgICAgICAgbGV0IHRpdGxlO1xuICAgICAgICBsZXQgc3ViVGl0bGU7XG4gICAgICAgIGxldCBwcmltYXJ5QWN0aW9uSGFuZGxlcjtcbiAgICAgICAgbGV0IHByaW1hcnlBY3Rpb25MYWJlbDtcbiAgICAgICAgbGV0IHNlY29uZGFyeUFjdGlvbkhhbmRsZXI7XG4gICAgICAgIGxldCBzZWNvbmRhcnlBY3Rpb25MYWJlbDtcbiAgICAgICAgbGV0IGZvb3RlcjtcbiAgICAgICAgY29uc3QgZXh0cmFDb21wb25lbnRzID0gW107XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZUNhc2UgPSB0aGlzLl9nZXRNZXNzYWdlQ2FzZSgpO1xuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2VDYXNlKSB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLkpvaW5pbmc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiSm9pbmluZyByb29tIOKAplwiKTtcbiAgICAgICAgICAgICAgICBzaG93U3Bpbm5lciA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLkxvYWRpbmc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiTG9hZGluZyDigKZcIik7XG4gICAgICAgICAgICAgICAgc2hvd1NwaW5uZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlQ2FzZS5SZWplY3Rpbmc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiUmVqZWN0aW5nIGludml0ZSDigKZcIik7XG4gICAgICAgICAgICAgICAgc2hvd1NwaW5uZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlQ2FzZS5Ob3RMb2dnZWRJbjoge1xuICAgICAgICAgICAgICAgIGRhcmtTdHlsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcIkpvaW4gdGhlIGNvbnZlcnNhdGlvbiB3aXRoIGFuIGFjY291bnRcIik7XG4gICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJTaWduIFVwXCIpO1xuICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25IYW5kbGVyID0gdGhpcy5vblJlZ2lzdGVyQ2xpY2s7XG4gICAgICAgICAgICAgICAgc2Vjb25kYXJ5QWN0aW9uTGFiZWwgPSBfdChcIlNpZ24gSW5cIik7XG4gICAgICAgICAgICAgICAgc2Vjb25kYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMub25Mb2dpbkNsaWNrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnByZXZpZXdMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvb3RlciA9IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFNwaW5uZXIgdz17MjB9IGg9ezIwfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiTG9hZGluZyByb29tIHByZXZpZXdcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLktpY2tlZDoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHttZW1iZXJOYW1lLCByZWFzb259ID0gdGhpcy5fZ2V0S2lja09yQmFuSW5mbygpO1xuICAgICAgICAgICAgICAgIHRpdGxlID0gX3QoXCJZb3Ugd2VyZSBraWNrZWQgZnJvbSAlKHJvb21OYW1lKXMgYnkgJShtZW1iZXJOYW1lKXNcIixcbiAgICAgICAgICAgICAgICAgICAge21lbWJlck5hbWUsIHJvb21OYW1lOiB0aGlzLl9yb29tTmFtZSgpfSk7XG4gICAgICAgICAgICAgICAgc3ViVGl0bGUgPSByZWFzb24gPyBfdChcIlJlYXNvbjogJShyZWFzb24pc1wiLCB7cmVhc29ufSkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2pvaW5SdWxlKCkgPT09IFwiaW52aXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJGb3JnZXQgdGhpcyByb29tXCIpO1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMucHJvcHMub25Gb3JnZXRDbGljaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uTGFiZWwgPSBfdChcIlJlLWpvaW5cIik7XG4gICAgICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25IYW5kbGVyID0gdGhpcy5wcm9wcy5vbkpvaW5DbGljaztcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kYXJ5QWN0aW9uTGFiZWwgPSBfdChcIkZvcmdldCB0aGlzIHJvb21cIik7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZGFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uRm9yZ2V0Q2xpY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlQ2FzZS5CYW5uZWQ6IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7bWVtYmVyTmFtZSwgcmVhc29ufSA9IHRoaXMuX2dldEtpY2tPckJhbkluZm8oKTtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiWW91IHdlcmUgYmFubmVkIGZyb20gJShyb29tTmFtZSlzIGJ5ICUobWVtYmVyTmFtZSlzXCIsXG4gICAgICAgICAgICAgICAgICAgIHttZW1iZXJOYW1lLCByb29tTmFtZTogdGhpcy5fcm9vbU5hbWUoKX0pO1xuICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gcmVhc29uID8gX3QoXCJSZWFzb246ICUocmVhc29uKXNcIiwge3JlYXNvbn0pIDogbnVsbDtcbiAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uTGFiZWwgPSBfdChcIkZvcmdldCB0aGlzIHJvb21cIik7XG4gICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uRm9yZ2V0Q2xpY2s7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLk90aGVyVGhyZWVQSURFcnJvcjoge1xuICAgICAgICAgICAgICAgIHRpdGxlID0gX3QoXCJTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHlvdXIgaW52aXRlIHRvICUocm9vbU5hbWUpc1wiLFxuICAgICAgICAgICAgICAgICAgICB7cm9vbU5hbWU6IHRoaXMuX3Jvb21OYW1lKCl9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBqb2luUnVsZSA9IHRoaXMuX2pvaW5SdWxlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyQ29kZU1lc3NhZ2UgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJBbiBlcnJvciAoJShlcnJjb2RlKXMpIHdhcyByZXR1cm5lZCB3aGlsZSB0cnlpbmcgdG8gdmFsaWRhdGUgeW91ciBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiaW52aXRlLiBZb3UgY291bGQgdHJ5IHRvIHBhc3MgdGhpcyBpbmZvcm1hdGlvbiBvbiB0byBhIHJvb20gYWRtaW4uXCIsXG4gICAgICAgICAgICAgICAgICAgIHtlcnJjb2RlOiB0aGlzLnN0YXRlLnRocmVlUGlkRmV0Y2hFcnJvci5lcnJjb2RlIHx8IF90KFwidW5rbm93biBlcnJvciBjb2RlXCIpfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoam9pblJ1bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImludml0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViVGl0bGUgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3QoXCJZb3UgY2FuIG9ubHkgam9pbiBpdCB3aXRoIGEgd29ya2luZyBpbnZpdGUuXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVyckNvZGVNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25MYWJlbCA9IF90KFwiVHJ5IHRvIGpvaW4gYW55d2F5XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uSm9pbkNsaWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJwdWJsaWNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gX3QoXCJZb3UgY2FuIHN0aWxsIGpvaW4gaXQgYmVjYXVzZSB0aGlzIGlzIGEgcHVibGljIHJvb20uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJKb2luIHRoZSBkaXNjdXNzaW9uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uSm9pbkNsaWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJUaXRsZSA9IGVyckNvZGVNZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJUcnkgdG8gam9pbiBhbnl3YXlcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMucHJvcHMub25Kb2luQ2xpY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLkludml0ZWRFbWFpbE5vdEZvdW5kSW5BY2NvdW50OiB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGludml0ZSB0byAlKHJvb21OYW1lKXMgd2FzIHNlbnQgdG8gJShlbWFpbClzIHdoaWNoIGlzIG5vdCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiYXNzb2NpYXRlZCB3aXRoIHlvdXIgYWNjb3VudFwiLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb29tTmFtZTogdGhpcy5fcm9vbU5hbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB0aGlzLnByb3BzLmludml0ZWRFbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiTGluayB0aGlzIGVtYWlsIHdpdGggeW91ciBhY2NvdW50IGluIFNldHRpbmdzIHRvIHJlY2VpdmUgaW52aXRlcyBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiZGlyZWN0bHkgaW4gUmlvdC5cIixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25MYWJlbCA9IF90KFwiSm9pbiB0aGUgZGlzY3Vzc2lvblwiKTtcbiAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMucHJvcHMub25Kb2luQ2xpY2s7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLkludml0ZWRFbWFpbE5vSWRlbnRpdHlTZXJ2ZXI6IHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoaXMgaW52aXRlIHRvICUocm9vbU5hbWUpcyB3YXMgc2VudCB0byAlKGVtYWlsKXNcIixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbU5hbWU6IHRoaXMuX3Jvb21OYW1lKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogdGhpcy5wcm9wcy5pbnZpdGVkRW1haWwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBzdWJUaXRsZSA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlVzZSBhbiBpZGVudGl0eSBzZXJ2ZXIgaW4gU2V0dGluZ3MgdG8gcmVjZWl2ZSBpbnZpdGVzIGRpcmVjdGx5IGluIFJpb3QuXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uTGFiZWwgPSBfdChcIkpvaW4gdGhlIGRpc2N1c3Npb25cIik7XG4gICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uSm9pbkNsaWNrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlQ2FzZS5JbnZpdGVkRW1haWxNaXNtYXRjaDoge1xuICAgICAgICAgICAgICAgIHRpdGxlID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVGhpcyBpbnZpdGUgdG8gJShyb29tTmFtZSlzIHdhcyBzZW50IHRvICUoZW1haWwpc1wiLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb29tTmFtZTogdGhpcy5fcm9vbU5hbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB0aGlzLnByb3BzLmludml0ZWRFbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiU2hhcmUgdGhpcyBlbWFpbCBpbiBTZXR0aW5ncyB0byByZWNlaXZlIGludml0ZXMgZGlyZWN0bHkgaW4gUmlvdC5cIixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25MYWJlbCA9IF90KFwiSm9pbiB0aGUgZGlzY3Vzc2lvblwiKTtcbiAgICAgICAgICAgICAgICBwcmltYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMucHJvcHMub25Kb2luQ2xpY2s7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLkludml0ZToge1xuICAgICAgICAgICAgICAgIGNvbnN0IFJvb21BdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuYXZhdGFycy5Sb29tQXZhdGFyXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2YXRhciA9IDxSb29tQXZhdGFyIHJvb209e3RoaXMucHJvcHMucm9vbX0gb29iRGF0YT17dGhpcy5wcm9wcy5vb2JEYXRhfSAvPjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGludml0ZU1lbWJlciA9IHRoaXMuX2dldEludml0ZU1lbWJlcigpO1xuICAgICAgICAgICAgICAgIGxldCBpbnZpdGVyRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoaW52aXRlTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGludml0ZXJFbGVtZW50ID0gPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9Sb29tUHJldmlld0Jhcl9pbnZpdGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2ludml0ZU1lbWJlci5yYXdEaXNwbGF5TmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj4gKHtpbnZpdGVNZW1iZXIudXNlcklkfSlcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnZpdGVyRWxlbWVudCA9ICg8c3BhbiBjbGFzc05hbWU9XCJteF9Sb29tUHJldmlld0Jhcl9pbnZpdGVyXCI+e3RoaXMucHJvcHMuaW52aXRlck5hbWV9PC9zcGFuPik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgaXNETSA9IHRoaXMuX2lzRE1JbnZpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNETSkge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiRG8geW91IHdhbnQgdG8gY2hhdCB3aXRoICUodXNlcilzP1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB1c2VyOiBpbnZpdGVNZW1iZXIubmFtZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3ViVGl0bGUgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBfdChcIjx1c2VyTmFtZS8+IHdhbnRzIHRvIGNoYXRcIiwge30sIHt1c2VyTmFtZTogKCkgPT4gaW52aXRlckVsZW1lbnR9KSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJTdGFydCBjaGF0dGluZ1wiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiRG8geW91IHdhbnQgdG8gam9pbiAlKHJvb21OYW1lKXM/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJvb21OYW1lOiB0aGlzLl9yb29tTmFtZSgpIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdWJUaXRsZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YXRhcixcbiAgICAgICAgICAgICAgICAgICAgICAgIF90KFwiPHVzZXJOYW1lLz4gaW52aXRlZCB5b3VcIiwge30sIHt1c2VyTmFtZTogKCkgPT4gaW52aXRlckVsZW1lbnR9KSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJBY2NlcHRcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkhhbmRsZXIgPSB0aGlzLnByb3BzLm9uSm9pbkNsaWNrO1xuICAgICAgICAgICAgICAgIHNlY29uZGFyeUFjdGlvbkxhYmVsID0gX3QoXCJSZWplY3RcIik7XG4gICAgICAgICAgICAgICAgc2Vjb25kYXJ5QWN0aW9uSGFuZGxlciA9IHRoaXMucHJvcHMub25SZWplY3RDbGljaztcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm9uUmVqZWN0QW5kSWdub3JlQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0cmFDb21wb25lbnRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwic2Vjb25kYXJ5XCIgb25DbGljaz17dGhpcy5wcm9wcy5vblJlamVjdEFuZElnbm9yZUNsaWNrfSBrZXk9XCJpZ25vcmVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiUmVqZWN0ICYgSWdub3JlIHVzZXJcIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VDYXNlLlZpZXdpbmdSb29tOiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuY2FuUHJldmlldykge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiWW91J3JlIHByZXZpZXdpbmcgJShyb29tTmFtZSlzLiBXYW50IHRvIGpvaW4gaXQ/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7cm9vbU5hbWU6IHRoaXMuX3Jvb21OYW1lKCl9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiJShyb29tTmFtZSlzIGNhbid0IGJlIHByZXZpZXdlZC4gRG8geW91IHdhbnQgdG8gam9pbiBpdD9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHtyb29tTmFtZTogdGhpcy5fcm9vbU5hbWUodHJ1ZSl9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJpbWFyeUFjdGlvbkxhYmVsID0gX3QoXCJKb2luIHRoZSBkaXNjdXNzaW9uXCIpO1xuICAgICAgICAgICAgICAgIHByaW1hcnlBY3Rpb25IYW5kbGVyID0gdGhpcy5wcm9wcy5vbkpvaW5DbGljaztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZUNhc2UuUm9vbU5vdEZvdW5kOiB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcIiUocm9vbU5hbWUpcyBkb2VzIG5vdCBleGlzdC5cIiwge3Jvb21OYW1lOiB0aGlzLl9yb29tTmFtZSh0cnVlKX0pO1xuICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gX3QoXCJUaGlzIHJvb20gZG9lc24ndCBleGlzdC4gQXJlIHlvdSBzdXJlIHlvdSdyZSBhdCB0aGUgcmlnaHQgcGxhY2U/XCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlQ2FzZS5PdGhlckVycm9yOiB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcIiUocm9vbU5hbWUpcyBpcyBub3QgYWNjZXNzaWJsZSBhdCB0aGlzIHRpbWUuXCIsIHtyb29tTmFtZTogdGhpcy5fcm9vbU5hbWUodHJ1ZSl9KTtcbiAgICAgICAgICAgICAgICBzdWJUaXRsZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgX3QoXCJUcnkgYWdhaW4gbGF0ZXIsIG9yIGFzayBhIHJvb20gYWRtaW4gdG8gY2hlY2sgaWYgeW91IGhhdmUgYWNjZXNzLlwiKSxcbiAgICAgICAgICAgICAgICAgICAgX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiUoZXJyY29kZSlzIHdhcyByZXR1cm5lZCB3aGlsZSB0cnlpbmcgdG8gYWNjZXNzIHRoZSByb29tLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIklmIHlvdSB0aGluayB5b3UncmUgc2VlaW5nIHRoaXMgbWVzc2FnZSBpbiBlcnJvciwgcGxlYXNlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGlzc3VlTGluaz5zdWJtaXQgYSBidWcgcmVwb3J0PC9pc3N1ZUxpbms+LlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBlcnJjb2RlOiB0aGlzLnByb3BzLmVycm9yLmVycmNvZGUgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgaXNzdWVMaW5rOiBsYWJlbCA9PiA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvbmV3L2Nob29zZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiPnsgbGFiZWwgfTwvYT4gfSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN1YlRpdGxlRWxlbWVudHM7XG4gICAgICAgIGlmIChzdWJUaXRsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN1YlRpdGxlKSkge1xuICAgICAgICAgICAgICAgIHN1YlRpdGxlID0gW3N1YlRpdGxlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1YlRpdGxlRWxlbWVudHMgPSBzdWJUaXRsZS5tYXAoKHQsIGkpID0+IDxwIGtleT17YHN1YlRpdGxlJHtpfWB9Pnt0fTwvcD4pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRpdGxlRWxlbWVudDtcbiAgICAgICAgaWYgKHNob3dTcGlubmVyKSB7XG4gICAgICAgICAgICB0aXRsZUVsZW1lbnQgPSA8aDMgY2xhc3NOYW1lPVwibXhfUm9vbVByZXZpZXdCYXJfc3Bpbm5lclRpdGxlXCI+PFNwaW5uZXIgLz57IHRpdGxlIH08L2gzPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRpdGxlRWxlbWVudCA9IDxoMz57IHRpdGxlIH08L2gzPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcmltYXJ5QnV0dG9uO1xuICAgICAgICBpZiAocHJpbWFyeUFjdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgICAgIHByaW1hcnlCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD1cInByaW1hcnlcIiBvbkNsaWNrPXtwcmltYXJ5QWN0aW9uSGFuZGxlcn0+XG4gICAgICAgICAgICAgICAgICAgIHsgcHJpbWFyeUFjdGlvbkxhYmVsIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNlY29uZGFyeUJ1dHRvbjtcbiAgICAgICAgaWYgKHNlY29uZGFyeUFjdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgICAgIHNlY29uZGFyeUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwic2Vjb25kYXJ5XCIgb25DbGljaz17c2Vjb25kYXJ5QWN0aW9uSGFuZGxlcn0+XG4gICAgICAgICAgICAgICAgICAgIHsgc2Vjb25kYXJ5QWN0aW9uTGFiZWwgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X1Jvb21QcmV2aWV3QmFyXCIsIFwiZGFyay1wYW5lbFwiLCBgbXhfUm9vbVByZXZpZXdCYXJfJHttZXNzYWdlQ2FzZX1gLCB7XG4gICAgICAgICAgICBcIm14X1Jvb21QcmV2aWV3QmFyX3BhbmVsXCI6IHRoaXMucHJvcHMuY2FuUHJldmlldyxcbiAgICAgICAgICAgIFwibXhfUm9vbVByZXZpZXdCYXJfZGlhbG9nXCI6ICF0aGlzLnByb3BzLmNhblByZXZpZXcsXG4gICAgICAgICAgICBcIm14X1Jvb21QcmV2aWV3QmFyX2RhcmtcIjogZGFya1N0eWxlLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVByZXZpZXdCYXJfbWVzc2FnZVwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRpdGxlRWxlbWVudCB9XG4gICAgICAgICAgICAgICAgICAgIHsgc3ViVGl0bGVFbGVtZW50cyB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tUHJldmlld0Jhcl9hY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgc2Vjb25kYXJ5QnV0dG9uIH1cbiAgICAgICAgICAgICAgICAgICAgeyBleHRyYUNvbXBvbmVudHMgfVxuICAgICAgICAgICAgICAgICAgICB7IHByaW1hcnlCdXR0b24gfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVByZXZpZXdCYXJfZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZm9vdGVyIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==