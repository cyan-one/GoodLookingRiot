"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.KIND_INVITE = exports.KIND_DM = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var _matrix = require("matrix-js-sdk/src/matrix");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _contentRepo = require("matrix-js-sdk/src/content-repo");

var Email = _interopRequireWildcard(require("../../../email"));

var _IdentityServerUtils = require("../../../utils/IdentityServerUtils");

var _UrlUtils = require("../../../utils/UrlUtils");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _IdentityAuthClient = _interopRequireDefault(require("../../../IdentityAuthClient"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _humanize = require("../../../utils/humanize");

var _createRoom = _interopRequireWildcard(require("../../../createRoom"));

var _RoomInvite = require("../../../RoomInvite");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _RoomListStore = _interopRequireWildcard(require("../../../stores/RoomListStore"));

var _Keyboard = require("../../../Keyboard");

var _actions = require("../../../dispatcher/actions");

/*
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
const KIND_DM = "dm";
exports.KIND_DM = KIND_DM;
const KIND_INVITE = "invite";
exports.KIND_INVITE = KIND_INVITE;
const INITIAL_ROOMS_SHOWN = 3; // Number of rooms to show at first

const INCREMENT_ROOMS_SHOWN = 5; // Number of rooms to add when 'show more' is clicked
// This is the interface that is expected by various components in this file. It is a bit
// awkward because it also matches the RoomMember class from the js-sdk with some extra support
// for 3PIDs/email addresses.
//
// XXX: We should use TypeScript interfaces instead of this weird "abstract" class.

class Member {
  /**
   * The display name of this Member. For users this should be their profile's display
   * name or user ID if none set. For 3PIDs this should be the 3PID address (email).
   */
  get name()
  /*: string*/
  {
    throw new Error("Member class not implemented");
  }
  /**
   * The ID of this Member. For users this should be their user ID. For 3PIDs this should
   * be the 3PID address (email).
   */


  get userId()
  /*: string*/
  {
    throw new Error("Member class not implemented");
  }
  /**
   * Gets the MXC URL of this Member's avatar. For users this should be their profile's
   * avatar MXC URL or null if none set. For 3PIDs this should always be null.
   */


  getMxcAvatarUrl()
  /*: string*/
  {
    throw new Error("Member class not implemented");
  }

}

class DirectoryMember extends Member {
  constructor(userDirResult
  /*: {user_id: string, display_name: string, avatar_url: string}*/
  ) {
    super();
    (0, _defineProperty2.default)(this, "_userId", void 0);
    (0, _defineProperty2.default)(this, "_displayName", void 0);
    (0, _defineProperty2.default)(this, "_avatarUrl", void 0);
    this._userId = userDirResult.user_id;
    this._displayName = userDirResult.display_name;
    this._avatarUrl = userDirResult.avatar_url;
  } // These next class members are for the Member interface


  get name()
  /*: string*/
  {
    return this._displayName || this._userId;
  }

  get userId()
  /*: string*/
  {
    return this._userId;
  }

  getMxcAvatarUrl()
  /*: string*/
  {
    return this._avatarUrl;
  }

}

class ThreepidMember extends Member {
  constructor(id
  /*: string*/
  ) {
    super();
    (0, _defineProperty2.default)(this, "_id", void 0);
    this._id = id;
  } // This is a getter that would be falsey on all other implementations. Until we have
  // better type support in the react-sdk we can use this trick to determine the kind
  // of 3PID we're dealing with, if any.


  get isEmail()
  /*: boolean*/
  {
    return this._id.includes('@');
  } // These next class members are for the Member interface


  get name()
  /*: string*/
  {
    return this._id;
  }

  get userId()
  /*: string*/
  {
    return this._id;
  }

  getMxcAvatarUrl()
  /*: string*/
  {
    return null;
  }

}

class DMUserTile extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onRemove", e => {
      // Stop the browser from highlighting text
      e.preventDefault();
      e.stopPropagation();
      this.props.onRemove(this.props.member);
    });
  }

  render() {
    const BaseAvatar = sdk.getComponent("views.avatars.BaseAvatar");
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const avatarSize = 20;
    const avatar = this.props.member.isEmail ? /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_InviteDialog_userTile_avatar mx_InviteDialog_userTile_threepidAvatar",
      src: require("../../../../res/img/icon-email-pill-avatar.svg"),
      width: avatarSize,
      height: avatarSize
    }) : /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      className: "mx_InviteDialog_userTile_avatar",
      url: (0, _contentRepo.getHttpUriForMxc)(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), this.props.member.getMxcAvatarUrl(), avatarSize, avatarSize, "crop"),
      name: this.props.member.name,
      idName: this.props.member.userId,
      width: avatarSize,
      height: avatarSize
    });
    let closeButton;

    if (this.props.onRemove) {
      closeButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "mx_InviteDialog_userTile_remove",
        onClick: this._onRemove
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/icon-pill-remove.svg"),
        alt: (0, _languageHandler._t)('Remove'),
        width: 8,
        height: 8
      }));
    }

    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_userTile"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_userTile_pill"
    }, avatar, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_userTile_name"
    }, this.props.member.name)), closeButton);
  }

}

(0, _defineProperty2.default)(DMUserTile, "propTypes", {
  member: _propTypes.default.object.isRequired,
  // Should be a Member (see interface above)
  onRemove: _propTypes.default.func // takes 1 argument, the member being removed

});

class DMRoomTile extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onClick", e => {
      // Stop the browser from highlighting text
      e.preventDefault();
      e.stopPropagation();
      this.props.onToggle(this.props.member);
    });
  }

  _highlightName(str
  /*: string*/
  ) {
    if (!this.props.highlightWord) return str; // We convert things to lowercase for index searching, but pull substrings from
    // the submitted text to preserve case. Note: we don't need to htmlEntities the
    // string because React will safely encode the text for us.

    const lowerStr = str.toLowerCase();
    const filterStr = this.props.highlightWord.toLowerCase();
    const result = [];
    let i = 0;
    let ii;

    while ((ii = lowerStr.indexOf(filterStr, i)) >= 0) {
      // Push any text we missed (first bit/middle of text)
      if (ii > i) {
        // Push any text we aren't highlighting (middle of text match, or beginning of text)
        result.push( /*#__PURE__*/_react.default.createElement("span", {
          key: i + 'begin'
        }, str.substring(i, ii)));
      }

      i = ii; // copy over ii only if we have a match (to preserve i for end-of-text matching)
      // Highlight the word the user entered

      const substr = str.substring(i, filterStr.length + i);
      result.push( /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_InviteDialog_roomTile_highlight",
        key: i + 'bold'
      }, substr));
      i += substr.length;
    } // Push any text we missed (end of text)


    if (i < str.length) {
      result.push( /*#__PURE__*/_react.default.createElement("span", {
        key: i + 'end'
      }, str.substring(i)));
    }

    return result;
  }

  render() {
    const BaseAvatar = sdk.getComponent("views.avatars.BaseAvatar");
    let timestamp = null;

    if (this.props.lastActiveTs) {
      const humanTs = (0, _humanize.humanizeTime)(this.props.lastActiveTs);
      timestamp = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_InviteDialog_roomTile_time"
      }, humanTs);
    }

    const avatarSize = 36;
    const avatar = this.props.member.isEmail ? /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/icon-email-pill-avatar.svg"),
      width: avatarSize,
      height: avatarSize
    }) : /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      url: (0, _contentRepo.getHttpUriForMxc)(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), this.props.member.getMxcAvatarUrl(), avatarSize, avatarSize, "crop"),
      name: this.props.member.name,
      idName: this.props.member.userId,
      width: avatarSize,
      height: avatarSize
    });
    let checkmark = null;

    if (this.props.isSelected) {
      // To reduce flickering we put the 'selected' room tile above the real avatar
      checkmark = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_InviteDialog_roomTile_selected"
      });
    } // To reduce flickering we put the checkmark on top of the actual avatar (prevents
    // the browser from reloading the image source when the avatar remounts).


    const stackedAvatar = /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_roomTile_avatarStack"
    }, avatar, checkmark);

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_roomTile",
      onClick: this._onClick
    }, stackedAvatar, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_roomTile_name"
    }, this._highlightName(this.props.member.name)), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_InviteDialog_roomTile_userId"
    }, this._highlightName(this.props.member.userId)), timestamp);
  }

}

(0, _defineProperty2.default)(DMRoomTile, "propTypes", {
  member: _propTypes.default.object.isRequired,
  // Should be a Member (see interface above)
  lastActiveTs: _propTypes.default.number,
  onToggle: _propTypes.default.func.isRequired,
  // takes 1 argument, the member being toggled
  highlightWord: _propTypes.default.string,
  isSelected: _propTypes.default.bool
});

class InviteDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_debounceTimer", null);
    (0, _defineProperty2.default)(this, "_editorRef", null);
    (0, _defineProperty2.default)(this, "_startDm", async () => {
      this.setState({
        busy: true
      });

      const targets = this._convertFilter();

      const targetIds = targets.map(t => t.userId); // Check if there is already a DM with these people and reuse it if possible.

      const existingRoom = _DMRoomMap.default.shared().getDMRoomForIdentifiers(targetIds);

      if (existingRoom) {
        _dispatcher.default.dispatch({
          action: 'view_room',
          room_id: existingRoom.roomId,
          should_peek: false,
          joining: false
        });

        this.props.onFinished();
        return;
      }

      const createRoomOptions = {
        inlineErrors: true
      };

      if (_SettingsStore.default.getValue("feature_cross_signing")) {
        // Check whether all users have uploaded device keys before.
        // If so, enable encryption in the new room.
        const has3PidMembers = targets.some(t => t instanceof ThreepidMember);

        if (!has3PidMembers) {
          const client = _MatrixClientPeg.MatrixClientPeg.get();

          const allHaveDeviceKeys = await (0, _createRoom.canEncryptToAllUsers)(client, targetIds);

          if (allHaveDeviceKeys) {
            createRoomOptions.encryption = true;
          }
        }
      } // Check if it's a traditional DM and create the room if required.
      // TODO: [Canonical DMs] Remove this check and instead just create the multi-person DM


      let createRoomPromise = Promise.resolve();

      const isSelf = targetIds.length === 1 && targetIds[0] === _MatrixClientPeg.MatrixClientPeg.get().getUserId();

      if (targetIds.length === 1 && !isSelf) {
        createRoomOptions.dmUserId = targetIds[0];
        createRoomPromise = (0, _createRoom.default)(createRoomOptions);
      } else if (isSelf) {
        createRoomPromise = (0, _createRoom.default)(createRoomOptions);
      } else {
        // Create a boring room and try to invite the targets manually.
        createRoomPromise = (0, _createRoom.default)(createRoomOptions).then(roomId => {
          return (0, _RoomInvite.inviteMultipleToRoom)(roomId, targetIds);
        }).then(result => {
          if (this._shouldAbortAfterInviteError(result)) {
            return true; // abort
          }
        });
      } // the createRoom call will show the room for us, so we don't need to worry about that.


      createRoomPromise.then(abort => {
        if (abort === true) return; // only abort on true booleans, not roomIds or something

        this.props.onFinished();
      }).catch(err => {
        console.error(err);
        this.setState({
          busy: false,
          errorText: (0, _languageHandler._t)("We couldn't create your DM. Please check the users you want to invite and try again.")
        });
      });
    });
    (0, _defineProperty2.default)(this, "_inviteUsers", () => {
      this.setState({
        busy: true
      });

      this._convertFilter();

      const targets = this._convertFilter();

      const targetIds = targets.map(t => t.userId);

      const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.roomId);

      if (!room) {
        console.error("Failed to find the room to invite users to");
        this.setState({
          busy: false,
          errorText: (0, _languageHandler._t)("Something went wrong trying to invite the users.")
        });
        return;
      }

      (0, _RoomInvite.inviteMultipleToRoom)(this.props.roomId, targetIds).then(result => {
        if (!this._shouldAbortAfterInviteError(result)) {
          // handles setting error message too
          this.props.onFinished();
        }
      }).catch(err => {
        console.error(err);
        this.setState({
          busy: false,
          errorText: (0, _languageHandler._t)("We couldn't invite those users. Please check the users you want to invite and try again.")
        });
      });
    });
    (0, _defineProperty2.default)(this, "_onKeyDown", e => {
      // when the field is empty and the user hits backspace remove the right-most target
      if (!e.target.value && !this.state.busy && this.state.targets.length > 0 && e.key === _Keyboard.Key.BACKSPACE && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();

        this._removeMember(this.state.targets[this.state.targets.length - 1]);
      }
    });
    (0, _defineProperty2.default)(this, "_updateFilter", e => {
      const term = e.target.value;
      this.setState({
        filterText: term
      }); // Debounce server lookups to reduce spam. We don't clear the existing server
      // results because they might still be vaguely accurate, likewise for races which
      // could happen here.

      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }

      this._debounceTimer = setTimeout(async () => {
        _MatrixClientPeg.MatrixClientPeg.get().searchUserDirectory({
          term
        }).then(async r => {
          if (term !== this.state.filterText) {
            // Discard the results - we were probably too slow on the server-side to make
            // these results useful. This is a race we want to avoid because we could overwrite
            // more accurate results.
            return;
          }

          if (!r.results) r.results = []; // While we're here, try and autocomplete a search result for the mxid itself
          // if there's no matches (and the input looks like a mxid).

          if (term[0] === '@' && term.indexOf(':') > 1) {
            try {
              const profile = await _MatrixClientPeg.MatrixClientPeg.get().getProfileInfo(term);

              if (profile) {
                // If we have a profile, we have enough information to assume that
                // the mxid can be invited - add it to the list. We stick it at the
                // top so it is most obviously presented to the user.
                r.results.splice(0, 0, {
                  user_id: term,
                  display_name: profile['displayname'],
                  avatar_url: profile['avatar_url']
                });
              }
            } catch (e) {
              console.warn("Non-fatal error trying to make an invite for a user ID");
              console.warn(e); // Add a result anyways, just without a profile. We stick it at the
              // top so it is most obviously presented to the user.

              r.results.splice(0, 0, {
                user_id: term,
                display_name: term,
                avatar_url: null
              });
            }
          }

          this.setState({
            serverResultsMixin: r.results.map(u => ({
              userId: u.user_id,
              user: new DirectoryMember(u)
            }))
          });
        }).catch(e => {
          console.error("Error searching user directory:");
          console.error(e);
          this.setState({
            serverResultsMixin: []
          }); // clear results because it's moderately fatal
        }); // Whenever we search the directory, also try to search the identity server. It's
        // all debounced the same anyways.


        if (!this.state.canUseIdentityServer) {
          // The user doesn't have an identity server set - warn them of that.
          this.setState({
            tryingIdentityServer: true
          });
          return;
        }

        if (term.indexOf('@') > 0 && Email.looksValid(term)) {
          // Start off by suggesting the plain email while we try and resolve it
          // to a real account.
          this.setState({
            // per above: the userId is a lie here - it's just a regular identifier
            threepidResultsMixin: [{
              user: new ThreepidMember(term),
              userId: term
            }]
          });

          try {
            const authClient = new _IdentityAuthClient.default();
            const token = await authClient.getAccessToken();
            if (term !== this.state.filterText) return; // abandon hope

            const lookup = await _MatrixClientPeg.MatrixClientPeg.get().lookupThreePid('email', term, undefined, // callback
            token);
            if (term !== this.state.filterText) return; // abandon hope

            if (!lookup || !lookup.mxid) {
              // We weren't able to find anyone - we're already suggesting the plain email
              // as an alternative, so do nothing.
              return;
            } // We append the user suggestion to give the user an option to click
            // the email anyways, and so we don't cause things to jump around. In
            // theory, the user would see the user pop up and think "ah yes, that
            // person!"


            const profile = await _MatrixClientPeg.MatrixClientPeg.get().getProfileInfo(lookup.mxid);
            if (term !== this.state.filterText || !profile) return; // abandon hope

            this.setState({
              threepidResultsMixin: [...this.state.threepidResultsMixin, {
                user: new DirectoryMember({
                  user_id: lookup.mxid,
                  display_name: profile.displayname,
                  avatar_url: profile.avatar_url
                }),
                userId: lookup.mxid
              }]
            });
          } catch (e) {
            console.error("Error searching identity server:");
            console.error(e);
            this.setState({
              threepidResultsMixin: []
            }); // clear results because it's moderately fatal
          }
        }
      }, 150); // 150ms debounce (human reaction time + some)
    });
    (0, _defineProperty2.default)(this, "_showMoreRecents", () => {
      this.setState({
        numRecentsShown: this.state.numRecentsShown + INCREMENT_ROOMS_SHOWN
      });
    });
    (0, _defineProperty2.default)(this, "_showMoreSuggestions", () => {
      this.setState({
        numSuggestionsShown: this.state.numSuggestionsShown + INCREMENT_ROOMS_SHOWN
      });
    });
    (0, _defineProperty2.default)(this, "_toggleMember", (member
    /*: Member*/
    ) => {
      let filterText = this.state.filterText;
      const targets = this.state.targets.map(t => t); // cheap clone for mutation

      const idx = targets.indexOf(member);

      if (idx >= 0) {
        targets.splice(idx, 1);
      } else {
        targets.push(member);
        filterText = ""; // clear the filter when the user accepts a suggestion
      }

      this.setState({
        targets,
        filterText
      });
    });
    (0, _defineProperty2.default)(this, "_removeMember", (member
    /*: Member*/
    ) => {
      const targets = this.state.targets.map(t => t); // cheap clone for mutation

      const idx = targets.indexOf(member);

      if (idx >= 0) {
        targets.splice(idx, 1);
        this.setState({
          targets
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onPaste", async e => {
      if (this.state.filterText) {
        // if the user has already typed something, just let them
        // paste normally.
        return;
      } // Prevent the text being pasted into the textarea


      e.preventDefault(); // Process it as a list of addresses to add instead

      const text = e.clipboardData.getData("text");
      const possibleMembers = [// If we can avoid hitting the profile endpoint, we should.
      ...this.state.recents, ...this.state.suggestions, ...this.state.serverResultsMixin, ...this.state.threepidResultsMixin];
      const toAdd = [];
      const failed = [];
      const potentialAddresses = text.split(/[\s,]+/).map(p => p.trim()).filter(p => !!p); // filter empty strings

      for (const address of potentialAddresses) {
        const member = possibleMembers.find(m => m.userId === address);

        if (member) {
          toAdd.push(member.user);
          continue;
        }

        if (address.indexOf('@') > 0 && Email.looksValid(address)) {
          toAdd.push(new ThreepidMember(address));
          continue;
        }

        if (address[0] !== '@') {
          failed.push(address); // not a user ID

          continue;
        }

        try {
          const profile = await _MatrixClientPeg.MatrixClientPeg.get().getProfileInfo(address);
          const displayName = profile ? profile.displayname : null;
          const avatarUrl = profile ? profile.avatar_url : null;
          toAdd.push(new DirectoryMember({
            user_id: address,
            display_name: displayName,
            avatar_url: avatarUrl
          }));
        } catch (e) {
          console.error("Error looking up profile for " + address);
          console.error(e);
          failed.push(address);
        }
      }

      if (failed.length > 0) {
        const QuestionDialog = sdk.getComponent('dialogs.QuestionDialog');

        _Modal.default.createTrackedDialog('Invite Paste Fail', '', QuestionDialog, {
          title: (0, _languageHandler._t)('Failed to find the following users'),
          description: (0, _languageHandler._t)("The following users might not exist or are invalid, and cannot be invited: %(csvNames)s", {
            csvNames: failed.join(", ")
          }),
          button: (0, _languageHandler._t)('OK')
        });
      }

      this.setState({
        targets: [...this.state.targets, ...toAdd]
      });
    });
    (0, _defineProperty2.default)(this, "_onClickInputArea", e => {
      // Stop the browser from highlighting text
      e.preventDefault();
      e.stopPropagation();

      if (this._editorRef && this._editorRef.current) {
        this._editorRef.current.focus();
      }
    });
    (0, _defineProperty2.default)(this, "_onUseDefaultIdentityServerClick", e => {
      e.preventDefault(); // Update the IS in account data. Actually using it may trigger terms.
      // eslint-disable-next-line react-hooks/rules-of-hooks

      (0, _IdentityServerUtils.useDefaultIdentityServer)();
      this.setState({
        canUseIdentityServer: true,
        tryingIdentityServer: false
      });
    });
    (0, _defineProperty2.default)(this, "_onManageSettingsClick", e => {
      e.preventDefault();

      _dispatcher.default.fire(_actions.Action.ViewUserSettings);

      this.props.onFinished();
    });

    if (props.kind === KIND_INVITE && !props.roomId) {
      throw new Error("When using KIND_INVITE a roomId is required for an InviteDialog");
    }

    const alreadyInvited = new Set([_MatrixClientPeg.MatrixClientPeg.get().getUserId(), _SdkConfig.default.get()['welcomeUserId']]);

    if (props.roomId) {
      const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(props.roomId);

      if (!room) throw new Error("Room ID given to InviteDialog does not look like a room");
      room.getMembersWithMembership('invite').forEach(m => alreadyInvited.add(m.userId));
      room.getMembersWithMembership('join').forEach(m => alreadyInvited.add(m.userId)); // add banned users, so we don't try to invite them

      room.getMembersWithMembership('ban').forEach(m => alreadyInvited.add(m.userId));
    }

    this.state = {
      targets: [],
      // array of Member objects (see interface above)
      filterText: "",
      recents: this._buildRecents(alreadyInvited),
      numRecentsShown: INITIAL_ROOMS_SHOWN,
      suggestions: this._buildSuggestions(alreadyInvited),
      numSuggestionsShown: INITIAL_ROOMS_SHOWN,
      serverResultsMixin: [],
      // { user: DirectoryMember, userId: string }[], like recents and suggestions
      threepidResultsMixin: [],
      // { user: ThreepidMember, userId: string}[], like recents and suggestions
      canUseIdentityServer: !!_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl(),
      tryingIdentityServer: false,
      // These two flags are used for the 'Go' button to communicate what is going on.
      busy: false,
      errorText: null
    };
    this._editorRef = (0, _react.createRef)();
  }

  _buildRecents(excludedTargetIds
  /*: Set<string>*/
  )
  /*: {userId: string, user: RoomMember, lastActive: number}*/
  {
    const rooms = _DMRoomMap.default.shared().getUniqueRoomsWithIndividuals(); // map of userId => js-sdk Room
    // Also pull in all the rooms tagged as TAG_DM so we don't miss anything. Sometimes the
    // room list doesn't tag the room for the DMRoomMap, but does for the room list.


    const taggedRooms = _RoomListStore.default.getRoomLists();

    const dmTaggedRooms = taggedRooms[_RoomListStore.TAG_DM];

    const myUserId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

    for (const dmRoom of dmTaggedRooms) {
      const otherMembers = dmRoom.getJoinedMembers().filter(u => u.userId !== myUserId);

      for (const member of otherMembers) {
        if (rooms[member.userId]) continue; // already have a room

        console.warn("Adding DM room for ".concat(member.userId, " as ").concat(dmRoom.roomId, " from tag, not DM map"));
        rooms[member.userId] = dmRoom;
      }
    }

    const recents = [];

    for (const userId in rooms) {
      // Filter out user IDs that are already in the room / should be excluded
      if (excludedTargetIds.has(userId)) {
        console.warn("[Invite:Recents] Excluding ".concat(userId, " from recents"));
        continue;
      }

      const room = rooms[userId];
      const member = room.getMember(userId);

      if (!member) {
        // just skip people who don't have memberships for some reason
        console.warn("[Invite:Recents] ".concat(userId, " is missing a member object in their own DM (").concat(room.roomId, ")"));
        continue;
      } // Find the last timestamp for a message event


      const searchTypes = ["m.room.message", "m.room.encrypted", "m.sticker"];
      const maxSearchEvents = 20; // to prevent traversing history

      let lastEventTs = 0;

      if (room.timeline && room.timeline.length) {
        for (let i = room.timeline.length - 1; i >= 0; i--) {
          const ev = room.timeline[i];

          if (searchTypes.includes(ev.getType())) {
            lastEventTs = ev.getTs();
            break;
          }

          if (room.timeline.length - i > maxSearchEvents) break;
        }
      }

      if (!lastEventTs) {
        // something weird is going on with this room
        console.warn("[Invite:Recents] ".concat(userId, " (").concat(room.roomId, ") has a weird last timestamp: ").concat(lastEventTs));
        continue;
      }

      recents.push({
        userId,
        user: member,
        lastActive: lastEventTs
      });
    }

    if (!recents) console.warn("[Invite:Recents] No recents to suggest!"); // Sort the recents by last active to save us time later

    recents.sort((a, b) => b.lastActive - a.lastActive);
    return recents;
  }

  _buildSuggestions(excludedTargetIds
  /*: Set<string>*/
  )
  /*: {userId: string, user: RoomMember}*/
  {
    const maxConsideredMembers = 200;

    const joinedRooms = _MatrixClientPeg.MatrixClientPeg.get().getRooms().filter(r => r.getMyMembership() === 'join' && r.getJoinedMemberCount() <= maxConsideredMembers); // Generates { userId: {member, rooms[]} }


    const memberRooms = joinedRooms.reduce((members, room) => {
      // Filter out DMs (we'll handle these in the recents section)
      if (_DMRoomMap.default.shared().getUserIdForRoomId(room.roomId)) {
        return members; // Do nothing
      }

      const joinedMembers = room.getJoinedMembers().filter(u => !excludedTargetIds.has(u.userId));

      for (const member of joinedMembers) {
        // Filter out user IDs that are already in the room / should be excluded
        if (excludedTargetIds.has(member.userId)) {
          continue;
        }

        if (!members[member.userId]) {
          members[member.userId] = {
            member: member,
            // Track the room size of the 'picked' member so we can use the profile of
            // the smallest room (likely a DM).
            pickedMemberRoomSize: room.getJoinedMemberCount(),
            rooms: []
          };
        }

        members[member.userId].rooms.push(room);

        if (room.getJoinedMemberCount() < members[member.userId].pickedMemberRoomSize) {
          members[member.userId].member = member;
          members[member.userId].pickedMemberRoomSize = room.getJoinedMemberCount();
        }
      }

      return members;
    }, {}); // Generates { userId: {member, numRooms, score} }

    const memberScores = Object.values(memberRooms).reduce((scores, entry) => {
      const numMembersTotal = entry.rooms.reduce((c, r) => c + r.getJoinedMemberCount(), 0);
      const maxRange = maxConsideredMembers * entry.rooms.length;
      scores[entry.member.userId] = {
        member: entry.member,
        numRooms: entry.rooms.length,
        score: Math.max(0, Math.pow(1 - numMembersTotal / maxRange, 5))
      };
      return scores;
    }, {}); // Now that we have scores for being in rooms, boost those people who have sent messages
    // recently, as a way to improve the quality of suggestions. We do this by checking every
    // room to see who has sent a message in the last few hours, and giving them a score
    // which correlates to the freshness of their message. In theory, this results in suggestions
    // which are closer to "continue this conversation" rather than "this person exists".

    const trueJoinedRooms = _MatrixClientPeg.MatrixClientPeg.get().getRooms().filter(r => r.getMyMembership() === 'join');

    const now = new Date().getTime();
    const earliestAgeConsidered = now - 60 * 60 * 1000; // 1 hour ago

    const maxMessagesConsidered = 50; // so we don't iterate over a huge amount of traffic

    const lastSpoke = {}; // userId: timestamp

    const lastSpokeMembers = {}; // userId: room member

    for (const room of trueJoinedRooms) {
      // Skip low priority rooms and DMs
      const isDm = _DMRoomMap.default.shared().getUserIdForRoomId(room.roomId);

      if (Object.keys(room.tags).includes("m.lowpriority") || isDm) {
        continue;
      }

      const events = room.getLiveTimeline().getEvents(); // timelines are most recent last

      for (let i = events.length - 1; i >= Math.max(0, events.length - maxMessagesConsidered); i--) {
        const ev = events[i];

        if (excludedTargetIds.has(ev.getSender())) {
          continue;
        }

        if (ev.getTs() <= earliestAgeConsidered) {
          break; // give up: all events from here on out are too old
        }

        if (!lastSpoke[ev.getSender()] || lastSpoke[ev.getSender()] < ev.getTs()) {
          lastSpoke[ev.getSender()] = ev.getTs();
          lastSpokeMembers[ev.getSender()] = room.getMember(ev.getSender());
        }
      }
    }

    for (const userId in lastSpoke) {
      const ts = lastSpoke[userId];
      const member = lastSpokeMembers[userId];
      if (!member) continue; // skip people we somehow don't have profiles for
      // Scores from being in a room give a 'good' score of about 1.0-1.5, so for our
      // boost we'll try and award at least +1.0 for making the list, with +4.0 being
      // an approximate maximum for being selected.

      const distanceFromNow = Math.abs(now - ts); // abs to account for slight future messages

      const inverseTime = now - earliestAgeConsidered - distanceFromNow;
      const scoreBoost = Math.max(1, inverseTime / (15 * 60 * 1000)); // 15min segments to keep scores sane

      let record = memberScores[userId];
      if (!record) record = memberScores[userId] = {
        score: 0
      };
      record.member = member;
      record.score += scoreBoost;
    }

    const members = Object.values(memberScores);
    members.sort((a, b) => {
      if (a.score === b.score) {
        if (a.numRooms === b.numRooms) {
          return a.member.userId.localeCompare(b.member.userId);
        }

        return b.numRooms - a.numRooms;
      }

      return b.score - a.score;
    });
    return members.map(m => ({
      userId: m.member.userId,
      user: m.member
    }));
  }

  _shouldAbortAfterInviteError(result)
  /*: boolean*/
  {
    const failedUsers = Object.keys(result.states).filter(a => result.states[a] === 'error');

    if (failedUsers.length > 0) {
      console.log("Failed to invite users: ", result);
      this.setState({
        busy: false,
        errorText: (0, _languageHandler._t)("Failed to invite the following users to chat: %(csvUsers)s", {
          csvUsers: failedUsers.join(", ")
        })
      });
      return true; // abort
    }

    return false;
  }

  _convertFilter()
  /*: Member[]*/
  {
    // Check to see if there's anything to convert first
    if (!this.state.filterText || !this.state.filterText.includes('@')) return this.state.targets || [];
    let newMember
    /*: Member*/
    ;

    if (this.state.filterText.startsWith('@')) {
      // Assume mxid
      newMember = new DirectoryMember({
        user_id: this.state.filterText,
        display_name: null,
        avatar_url: null
      });
    } else {
      // Assume email
      newMember = new ThreepidMember(this.state.filterText);
    }

    const newTargets = [...(this.state.targets || []), newMember];
    this.setState({
      targets: newTargets,
      filterText: ''
    });
    return newTargets;
  }

  _renderSection(kind
  /*: "recents"|"suggestions"*/
  ) {
    let sourceMembers = kind === 'recents' ? this.state.recents : this.state.suggestions;
    let showNum = kind === 'recents' ? this.state.numRecentsShown : this.state.numSuggestionsShown;
    const showMoreFn = kind === 'recents' ? this._showMoreRecents.bind(this) : this._showMoreSuggestions.bind(this);

    const lastActive = m => kind === 'recents' ? m.lastActive : null;

    let sectionName = kind === 'recents' ? (0, _languageHandler._t)("Recent Conversations") : (0, _languageHandler._t)("Suggestions");

    if (this.props.kind === KIND_INVITE) {
      sectionName = kind === 'recents' ? (0, _languageHandler._t)("Recently Direct Messaged") : (0, _languageHandler._t)("Suggestions");
    } // Mix in the server results if we have any, but only if we're searching. We track the additional
    // members separately because we want to filter sourceMembers but trust the mixin arrays to have
    // the right members in them.


    let priorityAdditionalMembers = []; // Shows up before our own suggestions, higher quality

    let otherAdditionalMembers = []; // Shows up after our own suggestions, lower quality

    const hasMixins = this.state.serverResultsMixin || this.state.threepidResultsMixin;

    if (this.state.filterText && hasMixins && kind === 'suggestions') {
      // We don't want to duplicate members though, so just exclude anyone we've already seen.
      const notAlreadyExists = (u
      /*: Member*/
      ) =>
      /*: boolean*/
      {
        return !sourceMembers.some(m => m.userId === u.userId) && !priorityAdditionalMembers.some(m => m.userId === u.userId) && !otherAdditionalMembers.some(m => m.userId === u.userId);
      };

      otherAdditionalMembers = this.state.serverResultsMixin.filter(notAlreadyExists);
      priorityAdditionalMembers = this.state.threepidResultsMixin.filter(notAlreadyExists);
    }

    const hasAdditionalMembers = priorityAdditionalMembers.length > 0 || otherAdditionalMembers.length > 0; // Hide the section if there's nothing to filter by

    if (sourceMembers.length === 0 && !hasAdditionalMembers) return null; // Do some simple filtering on the input before going much further. If we get no results, say so.

    if (this.state.filterText) {
      const filterBy = this.state.filterText.toLowerCase();
      sourceMembers = sourceMembers.filter(m => m.user.name.toLowerCase().includes(filterBy) || m.userId.toLowerCase().includes(filterBy));

      if (sourceMembers.length === 0 && !hasAdditionalMembers) {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_InviteDialog_section"
        }, /*#__PURE__*/_react.default.createElement("h3", null, sectionName), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("No results")));
      }
    } // Now we mix in the additional members. Again, we presume these have already been filtered. We
    // also assume they are more relevant than our suggestions and prepend them to the list.


    sourceMembers = [...priorityAdditionalMembers, ...sourceMembers, ...otherAdditionalMembers]; // If we're going to hide one member behind 'show more', just use up the space of the button
    // with the member's tile instead.

    if (showNum === sourceMembers.length - 1) showNum++; // .slice() will return an incomplete array but won't error on us if we go too far

    const toRender = sourceMembers.slice(0, showNum);
    const hasMore = toRender.length < sourceMembers.length;
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    let showMore = null;

    if (hasMore) {
      showMore = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: showMoreFn,
        kind: "link"
      }, (0, _languageHandler._t)("Show more"));
    }

    const tiles = toRender.map(r => /*#__PURE__*/_react.default.createElement(DMRoomTile, {
      member: r.user,
      lastActiveTs: lastActive(r),
      key: r.userId,
      onToggle: this._toggleMember,
      highlightWord: this.state.filterText,
      isSelected: this.state.targets.some(t => t.userId === r.userId)
    }));
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_section"
    }, /*#__PURE__*/_react.default.createElement("h3", null, sectionName), tiles, showMore);
  }

  _renderEditor() {
    const targets = this.state.targets.map(t => /*#__PURE__*/_react.default.createElement(DMUserTile, {
      member: t,
      onRemove: !this.state.busy && this._removeMember,
      key: t.userId
    }));

    const input = /*#__PURE__*/_react.default.createElement("textarea", {
      rows: 1,
      onKeyDown: this._onKeyDown,
      onChange: this._updateFilter,
      value: this.state.filterText,
      ref: this._editorRef,
      onPaste: this._onPaste,
      autoFocus: true,
      disabled: this.state.busy
    });

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_editor",
      onClick: this._onClickInputArea
    }, targets, input);
  }

  _renderIdentityServerWarning() {
    if (!this.state.tryingIdentityServer || this.state.canUseIdentityServer) {
      return null;
    }

    const defaultIdentityServerUrl = (0, _IdentityServerUtils.getDefaultIdentityServerUrl)();

    if (defaultIdentityServerUrl) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_identityServer"
      }, (0, _languageHandler._t)("Use an identity server to invite by email. " + "<default>Use the default (%(defaultIdentityServerName)s)</default> " + "or manage in <settings>Settings</settings>.", {
        defaultIdentityServerName: (0, _UrlUtils.abbreviateUrl)(defaultIdentityServerUrl)
      }, {
        default: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: "#",
          onClick: this._onUseDefaultIdentityServerClick
        }, sub),
        settings: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: "#",
          onClick: this._onManageSettingsClick
        }, sub)
      }));
    } else {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_identityServer"
      }, (0, _languageHandler._t)("Use an identity server to invite by email. " + "Manage in <settings>Settings</settings>.", {}, {
        settings: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: "#",
          onClick: this._onManageSettingsClick
        }, sub)
      }));
    }
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const Spinner = sdk.getComponent("elements.Spinner");
    let spinner = null;

    if (this.state.busy) {
      spinner = /*#__PURE__*/_react.default.createElement(Spinner, {
        w: 20,
        h: 20
      });
    }

    let title;
    let helpText;
    let buttonText;
    let goButtonFn;

    const userId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

    if (this.props.kind === KIND_DM) {
      title = (0, _languageHandler._t)("Direct Messages");
      helpText = (0, _languageHandler._t)("Start a conversation with someone using their name, username (like <userId/>) or email address.", {}, {
        userId: () => {
          return /*#__PURE__*/_react.default.createElement("a", {
            href: (0, _Permalinks.makeUserPermalink)(userId),
            rel: "noreferrer noopener",
            target: "_blank"
          }, userId);
        }
      });
      buttonText = (0, _languageHandler._t)("Go");
      goButtonFn = this._startDm;
    } else {
      // KIND_INVITE
      title = (0, _languageHandler._t)("Invite to this room");
      helpText = (0, _languageHandler._t)("Invite someone using their name, username (like <userId/>), email address or <a>share this room</a>.", {}, {
        userId: () => /*#__PURE__*/_react.default.createElement("a", {
          href: (0, _Permalinks.makeUserPermalink)(userId),
          rel: "noreferrer noopener",
          target: "_blank"
        }, userId),
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: (0, _Permalinks.makeRoomPermalink)(this.props.roomId),
          rel: "noreferrer noopener",
          target: "_blank"
        }, sub)
      });
      buttonText = (0, _languageHandler._t)("Invite");
      goButtonFn = this._inviteUsers;
    }

    const hasSelection = this.state.targets.length > 0 || this.state.filterText && this.state.filterText.includes('@');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_InviteDialog",
      hasCancel: true,
      onFinished: this.props.onFinished,
      title: title
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", {
      className: "mx_InviteDialog_helpText"
    }, helpText), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_addressBar"
    }, this._renderEditor(), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_buttonAndSpinner"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      onClick: goButtonFn,
      className: "mx_InviteDialog_goButton",
      disabled: this.state.busy || !hasSelection
    }, buttonText), spinner)), this._renderIdentityServerWarning(), /*#__PURE__*/_react.default.createElement("div", {
      className: "error"
    }, this.state.errorText), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InviteDialog_userSections"
    }, this._renderSection('recents'), this._renderSection('suggestions'))));
  }

}

exports.default = InviteDialog;
(0, _defineProperty2.default)(InviteDialog, "propTypes", {
  // Takes an array of user IDs/emails to invite.
  onFinished: _propTypes.default.func.isRequired,
  // The kind of invite being performed. Assumed to be KIND_DM if
  // not provided.
  kind: _propTypes.default.string,
  // The room ID this dialog is for. Only required for KIND_INVITE.
  roomId: _propTypes.default.string
});
(0, _defineProperty2.default)(InviteDialog, "defaultProps", {
  kind: KIND_DM
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvSW52aXRlRGlhbG9nLmpzIl0sIm5hbWVzIjpbIktJTkRfRE0iLCJLSU5EX0lOVklURSIsIklOSVRJQUxfUk9PTVNfU0hPV04iLCJJTkNSRU1FTlRfUk9PTVNfU0hPV04iLCJNZW1iZXIiLCJuYW1lIiwiRXJyb3IiLCJ1c2VySWQiLCJnZXRNeGNBdmF0YXJVcmwiLCJEaXJlY3RvcnlNZW1iZXIiLCJjb25zdHJ1Y3RvciIsInVzZXJEaXJSZXN1bHQiLCJfdXNlcklkIiwidXNlcl9pZCIsIl9kaXNwbGF5TmFtZSIsImRpc3BsYXlfbmFtZSIsIl9hdmF0YXJVcmwiLCJhdmF0YXJfdXJsIiwiVGhyZWVwaWRNZW1iZXIiLCJpZCIsIl9pZCIsImlzRW1haWwiLCJpbmNsdWRlcyIsIkRNVXNlclRpbGUiLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJlIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJwcm9wcyIsIm9uUmVtb3ZlIiwibWVtYmVyIiwicmVuZGVyIiwiQmFzZUF2YXRhciIsInNkayIsImdldENvbXBvbmVudCIsIkFjY2Vzc2libGVCdXR0b24iLCJhdmF0YXJTaXplIiwiYXZhdGFyIiwicmVxdWlyZSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldEhvbWVzZXJ2ZXJVcmwiLCJjbG9zZUJ1dHRvbiIsIl9vblJlbW92ZSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJmdW5jIiwiRE1Sb29tVGlsZSIsIm9uVG9nZ2xlIiwiX2hpZ2hsaWdodE5hbWUiLCJzdHIiLCJoaWdobGlnaHRXb3JkIiwibG93ZXJTdHIiLCJ0b0xvd2VyQ2FzZSIsImZpbHRlclN0ciIsInJlc3VsdCIsImkiLCJpaSIsImluZGV4T2YiLCJwdXNoIiwic3Vic3RyaW5nIiwic3Vic3RyIiwibGVuZ3RoIiwidGltZXN0YW1wIiwibGFzdEFjdGl2ZVRzIiwiaHVtYW5UcyIsImNoZWNrbWFyayIsImlzU2VsZWN0ZWQiLCJzdGFja2VkQXZhdGFyIiwiX29uQ2xpY2siLCJudW1iZXIiLCJzdHJpbmciLCJib29sIiwiSW52aXRlRGlhbG9nIiwic2V0U3RhdGUiLCJidXN5IiwidGFyZ2V0cyIsIl9jb252ZXJ0RmlsdGVyIiwidGFyZ2V0SWRzIiwibWFwIiwidCIsImV4aXN0aW5nUm9vbSIsIkRNUm9vbU1hcCIsInNoYXJlZCIsImdldERNUm9vbUZvcklkZW50aWZpZXJzIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJyb29tX2lkIiwicm9vbUlkIiwic2hvdWxkX3BlZWsiLCJqb2luaW5nIiwib25GaW5pc2hlZCIsImNyZWF0ZVJvb21PcHRpb25zIiwiaW5saW5lRXJyb3JzIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiaGFzM1BpZE1lbWJlcnMiLCJzb21lIiwiY2xpZW50IiwiYWxsSGF2ZURldmljZUtleXMiLCJlbmNyeXB0aW9uIiwiY3JlYXRlUm9vbVByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsImlzU2VsZiIsImdldFVzZXJJZCIsImRtVXNlcklkIiwidGhlbiIsIl9zaG91bGRBYm9ydEFmdGVySW52aXRlRXJyb3IiLCJhYm9ydCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwiZXJyb3JUZXh0Iiwicm9vbSIsImdldFJvb20iLCJ0YXJnZXQiLCJ2YWx1ZSIsInN0YXRlIiwia2V5IiwiS2V5IiwiQkFDS1NQQUNFIiwiY3RybEtleSIsInNoaWZ0S2V5IiwibWV0YUtleSIsIl9yZW1vdmVNZW1iZXIiLCJ0ZXJtIiwiZmlsdGVyVGV4dCIsIl9kZWJvdW5jZVRpbWVyIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsInNlYXJjaFVzZXJEaXJlY3RvcnkiLCJyIiwicmVzdWx0cyIsInByb2ZpbGUiLCJnZXRQcm9maWxlSW5mbyIsInNwbGljZSIsIndhcm4iLCJzZXJ2ZXJSZXN1bHRzTWl4aW4iLCJ1IiwidXNlciIsImNhblVzZUlkZW50aXR5U2VydmVyIiwidHJ5aW5nSWRlbnRpdHlTZXJ2ZXIiLCJFbWFpbCIsImxvb2tzVmFsaWQiLCJ0aHJlZXBpZFJlc3VsdHNNaXhpbiIsImF1dGhDbGllbnQiLCJJZGVudGl0eUF1dGhDbGllbnQiLCJ0b2tlbiIsImdldEFjY2Vzc1Rva2VuIiwibG9va3VwIiwibG9va3VwVGhyZWVQaWQiLCJ1bmRlZmluZWQiLCJteGlkIiwiZGlzcGxheW5hbWUiLCJudW1SZWNlbnRzU2hvd24iLCJudW1TdWdnZXN0aW9uc1Nob3duIiwiaWR4IiwidGV4dCIsImNsaXBib2FyZERhdGEiLCJnZXREYXRhIiwicG9zc2libGVNZW1iZXJzIiwicmVjZW50cyIsInN1Z2dlc3Rpb25zIiwidG9BZGQiLCJmYWlsZWQiLCJwb3RlbnRpYWxBZGRyZXNzZXMiLCJzcGxpdCIsInAiLCJ0cmltIiwiZmlsdGVyIiwiYWRkcmVzcyIsImZpbmQiLCJtIiwiZGlzcGxheU5hbWUiLCJhdmF0YXJVcmwiLCJRdWVzdGlvbkRpYWxvZyIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJjc3ZOYW1lcyIsImpvaW4iLCJidXR0b24iLCJfZWRpdG9yUmVmIiwiY3VycmVudCIsImZvY3VzIiwiZmlyZSIsIkFjdGlvbiIsIlZpZXdVc2VyU2V0dGluZ3MiLCJraW5kIiwiYWxyZWFkeUludml0ZWQiLCJTZXQiLCJTZGtDb25maWciLCJnZXRNZW1iZXJzV2l0aE1lbWJlcnNoaXAiLCJmb3JFYWNoIiwiYWRkIiwiX2J1aWxkUmVjZW50cyIsIl9idWlsZFN1Z2dlc3Rpb25zIiwiZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwiLCJleGNsdWRlZFRhcmdldElkcyIsInJvb21zIiwiZ2V0VW5pcXVlUm9vbXNXaXRoSW5kaXZpZHVhbHMiLCJ0YWdnZWRSb29tcyIsIlJvb21MaXN0U3RvcmUiLCJnZXRSb29tTGlzdHMiLCJkbVRhZ2dlZFJvb21zIiwiVEFHX0RNIiwibXlVc2VySWQiLCJkbVJvb20iLCJvdGhlck1lbWJlcnMiLCJnZXRKb2luZWRNZW1iZXJzIiwiaGFzIiwiZ2V0TWVtYmVyIiwic2VhcmNoVHlwZXMiLCJtYXhTZWFyY2hFdmVudHMiLCJsYXN0RXZlbnRUcyIsInRpbWVsaW5lIiwiZXYiLCJnZXRUeXBlIiwiZ2V0VHMiLCJsYXN0QWN0aXZlIiwic29ydCIsImEiLCJiIiwibWF4Q29uc2lkZXJlZE1lbWJlcnMiLCJqb2luZWRSb29tcyIsImdldFJvb21zIiwiZ2V0TXlNZW1iZXJzaGlwIiwiZ2V0Sm9pbmVkTWVtYmVyQ291bnQiLCJtZW1iZXJSb29tcyIsInJlZHVjZSIsIm1lbWJlcnMiLCJnZXRVc2VySWRGb3JSb29tSWQiLCJqb2luZWRNZW1iZXJzIiwicGlja2VkTWVtYmVyUm9vbVNpemUiLCJtZW1iZXJTY29yZXMiLCJPYmplY3QiLCJ2YWx1ZXMiLCJzY29yZXMiLCJlbnRyeSIsIm51bU1lbWJlcnNUb3RhbCIsImMiLCJtYXhSYW5nZSIsIm51bVJvb21zIiwic2NvcmUiLCJNYXRoIiwibWF4IiwicG93IiwidHJ1ZUpvaW5lZFJvb21zIiwibm93IiwiRGF0ZSIsImdldFRpbWUiLCJlYXJsaWVzdEFnZUNvbnNpZGVyZWQiLCJtYXhNZXNzYWdlc0NvbnNpZGVyZWQiLCJsYXN0U3Bva2UiLCJsYXN0U3Bva2VNZW1iZXJzIiwiaXNEbSIsImtleXMiLCJ0YWdzIiwiZXZlbnRzIiwiZ2V0TGl2ZVRpbWVsaW5lIiwiZ2V0RXZlbnRzIiwiZ2V0U2VuZGVyIiwidHMiLCJkaXN0YW5jZUZyb21Ob3ciLCJhYnMiLCJpbnZlcnNlVGltZSIsInNjb3JlQm9vc3QiLCJyZWNvcmQiLCJsb2NhbGVDb21wYXJlIiwiZmFpbGVkVXNlcnMiLCJzdGF0ZXMiLCJsb2ciLCJjc3ZVc2VycyIsIm5ld01lbWJlciIsInN0YXJ0c1dpdGgiLCJuZXdUYXJnZXRzIiwiX3JlbmRlclNlY3Rpb24iLCJzb3VyY2VNZW1iZXJzIiwic2hvd051bSIsInNob3dNb3JlRm4iLCJfc2hvd01vcmVSZWNlbnRzIiwiYmluZCIsIl9zaG93TW9yZVN1Z2dlc3Rpb25zIiwic2VjdGlvbk5hbWUiLCJwcmlvcml0eUFkZGl0aW9uYWxNZW1iZXJzIiwib3RoZXJBZGRpdGlvbmFsTWVtYmVycyIsImhhc01peGlucyIsIm5vdEFscmVhZHlFeGlzdHMiLCJoYXNBZGRpdGlvbmFsTWVtYmVycyIsImZpbHRlckJ5IiwidG9SZW5kZXIiLCJzbGljZSIsImhhc01vcmUiLCJzaG93TW9yZSIsInRpbGVzIiwiX3RvZ2dsZU1lbWJlciIsIl9yZW5kZXJFZGl0b3IiLCJpbnB1dCIsIl9vbktleURvd24iLCJfdXBkYXRlRmlsdGVyIiwiX29uUGFzdGUiLCJfb25DbGlja0lucHV0QXJlYSIsIl9yZW5kZXJJZGVudGl0eVNlcnZlcldhcm5pbmciLCJkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJVcmwiLCJkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJOYW1lIiwiZGVmYXVsdCIsInN1YiIsIl9vblVzZURlZmF1bHRJZGVudGl0eVNlcnZlckNsaWNrIiwic2V0dGluZ3MiLCJfb25NYW5hZ2VTZXR0aW5nc0NsaWNrIiwiQmFzZURpYWxvZyIsIlNwaW5uZXIiLCJzcGlubmVyIiwiaGVscFRleHQiLCJidXR0b25UZXh0IiwiZ29CdXR0b25GbiIsIl9zdGFydERtIiwiX2ludml0ZVVzZXJzIiwiaGFzU2VsZWN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRDQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0NPLE1BQU1BLE9BQU8sR0FBRyxJQUFoQjs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsUUFBcEI7O0FBRVAsTUFBTUMsbUJBQW1CLEdBQUcsQ0FBNUIsQyxDQUErQjs7QUFDL0IsTUFBTUMscUJBQXFCLEdBQUcsQ0FBOUIsQyxDQUFpQztBQUVqQztBQUNBO0FBQ0E7QUFDQTtB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bkMsQ0FqQkosZUFrQkk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0ssS0FBS3FLLGNBQUwsQ0FBb0IsU0FBcEIsQ0FETCxFQUVLLEtBQUtBLGNBQUwsQ0FBb0IsYUFBcEIsQ0FGTCxDQWxCSixDQU5KLENBREo7QUFnQ0g7O0FBajFCeUQ7Ozs4QkFBekMvTSxZLGVBQ0U7QUFDZjtBQUNBbUIsRUFBQUEsVUFBVSxFQUFFakQsbUJBQVVHLElBQVYsQ0FBZUQsVUFGWjtBQUlmO0FBQ0E7QUFDQW1KLEVBQUFBLElBQUksRUFBRXJKLG1CQUFVNEIsTUFORDtBQVFmO0FBQ0FrQixFQUFBQSxNQUFNLEVBQUU5QyxtQkFBVTRCO0FBVEgsQzs4QkFERkUsWSxrQkFhSztBQUNsQnVILEVBQUFBLElBQUksRUFBRWxNO0FBRFksQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSwgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQge21ha2VSb29tUGVybWFsaW5rLCBtYWtlVXNlclBlcm1hbGlua30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rc1wiO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvRE1Sb29tTWFwXCI7XG5pbXBvcnQge1Jvb21NZW1iZXJ9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9tYXRyaXhcIjtcbmltcG9ydCBTZGtDb25maWcgZnJvbSBcIi4uLy4uLy4uL1Nka0NvbmZpZ1wiO1xuaW1wb3J0IHtnZXRIdHRwVXJpRm9yTXhjfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY29udGVudC1yZXBvXCI7XG5pbXBvcnQgKiBhcyBFbWFpbCBmcm9tIFwiLi4vLi4vLi4vZW1haWxcIjtcbmltcG9ydCB7Z2V0RGVmYXVsdElkZW50aXR5U2VydmVyVXJsLCB1c2VEZWZhdWx0SWRlbnRpdHlTZXJ2ZXJ9IGZyb20gXCIuLi8uLi8uLi91dGlscy9JZGVudGl0eVNlcnZlclV0aWxzXCI7XG5pbXBvcnQge2FiYnJldmlhdGVVcmx9IGZyb20gXCIuLi8uLi8uLi91dGlscy9VcmxVdGlsc1wiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgSWRlbnRpdHlBdXRoQ2xpZW50IGZyb20gXCIuLi8uLi8uLi9JZGVudGl0eUF1dGhDbGllbnRcIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCB7aHVtYW5pemVUaW1lfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvaHVtYW5pemVcIjtcbmltcG9ydCBjcmVhdGVSb29tLCB7Y2FuRW5jcnlwdFRvQWxsVXNlcnN9IGZyb20gXCIuLi8uLi8uLi9jcmVhdGVSb29tXCI7XG5pbXBvcnQge2ludml0ZU11bHRpcGxlVG9Sb29tfSBmcm9tIFwiLi4vLi4vLi4vUm9vbUludml0ZVwiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5pbXBvcnQgUm9vbUxpc3RTdG9yZSwge1RBR19ETX0gZnJvbSBcIi4uLy4uLy4uL3N0b3Jlcy9Sb29tTGlzdFN0b3JlXCI7XG5pbXBvcnQge0tleX0gZnJvbSBcIi4uLy4uLy4uL0tleWJvYXJkXCI7XG5pbXBvcnQge0FjdGlvbn0gZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvYWN0aW9uc1wiO1xuXG5leHBvcnQgY29uc3QgS0lORF9ETSA9IFwiZG1cIjtcbmV4cG9ydCBjb25zdCBLSU5EX0lOVklURSA9IFwiaW52aXRlXCI7XG5cbmNvbnN0IElOSVRJQUxfUk9PTVNfU0hPV04gPSAzOyAvLyBOdW1iZXIgb2Ygcm9vbXMgdG8gc2hvdyBhdCBmaXJzdFxuY29uc3QgSU5DUkVNRU5UX1JPT01TX1NIT1dOID0gNTsgLy8gTnVtYmVyIG9mIHJvb21zIHRvIGFkZCB3aGVuICdzaG93IG1vcmUnIGlzIGNsaWNrZWRcblxuLy8gVGhpcyBpcyB0aGUgaW50ZXJmYWNlIHRoYXQgaXMgZXhwZWN0ZWQgYnkgdmFyaW91cyBjb21wb25lbnRzIGluIHRoaXMgZmlsZS4gSXQgaXMgYSBiaXRcbi8vIGF3a3dhcmQgYmVjYXVzZSBpdCBhbHNvIG1hdGNoZXMgdGhlIFJvb21NZW1iZXIgY2xhc3MgZnJvbSB0aGUganMtc2RrIHdpdGggc29tZSBleHRyYSBzdXBwb3J0XG4vLyBmb3IgM1BJRHMvZW1haWwgYWRkcmVzc2VzLlxuLy9cbi8vIFhYWDogV2Ugc2hvdWxkIHVzZSBUeXBlU2NyaXB0IGludGVyZmFjZXMgaW5zdGVhZCBvZiB0aGlzIHdlaXJkIFwiYWJzdHJhY3RcIiBjbGFzcy5cbmNsYXNzIE1lbWJlciB7XG4gICAgLyoqXG4gICAgICogVGhlIGRpc3BsYXkgbmFtZSBvZiB0aGlzIE1lbWJlci4gRm9yIHVzZXJzIHRoaXMgc2hvdWxkIGJlIHRoZWlyIHByb2ZpbGUncyBkaXNwbGF5XG4gICAgICogbmFtZSBvciB1c2VyIElEIGlmIG5vbmUgc2V0LiBGb3IgM1BJRHMgdGhpcyBzaG91bGQgYmUgdGhlIDNQSUQgYWRkcmVzcyAoZW1haWwpLlxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7IHRocm93IG5ldyBFcnJvcihcIk1lbWJlciBjbGFzcyBub3QgaW1wbGVtZW50ZWRcIik7IH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBJRCBvZiB0aGlzIE1lbWJlci4gRm9yIHVzZXJzIHRoaXMgc2hvdWxkIGJlIHRoZWlyIHVzZXIgSUQuIEZvciAzUElEcyB0aGlzIHNob3VsZFxuICAgICAqIGJlIHRoZSAzUElEIGFkZHJlc3MgKGVtYWlsKS5cbiAgICAgKi9cbiAgICBnZXQgdXNlcklkKCk6IHN0cmluZyB7IHRocm93IG5ldyBFcnJvcihcIk1lbWJlciBjbGFzcyBub3QgaW1wbGVtZW50ZWRcIik7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIE1YQyBVUkwgb2YgdGhpcyBNZW1iZXIncyBhdmF0YXIuIEZvciB1c2VycyB0aGlzIHNob3VsZCBiZSB0aGVpciBwcm9maWxlJ3NcbiAgICAgKiBhdmF0YXIgTVhDIFVSTCBvciBudWxsIGlmIG5vbmUgc2V0LiBGb3IgM1BJRHMgdGhpcyBzaG91bGQgYWx3YXlzIGJlIG51bGwuXG4gICAgICovXG4gICAgZ2V0TXhjQXZhdGFyVXJsKCk6IHN0cmluZyB7IHRocm93IG5ldyBFcnJvcihcIk1lbWJlciBjbGFzcyBub3QgaW1wbGVtZW50ZWRcIik7IH1cbn1cblxuY2xhc3MgRGlyZWN0b3J5TWVtYmVyIGV4dGVuZHMgTWVtYmVyIHtcbiAgICBfdXNlcklkOiBzdHJpbmc7XG4gICAgX2Rpc3BsYXlOYW1lOiBzdHJpbmc7XG4gICAgX2F2YXRhclVybDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IodXNlckRpclJlc3VsdDoge3VzZXJfaWQ6IHN0cmluZywgZGlzcGxheV9uYW1lOiBzdHJpbmcsIGF2YXRhcl91cmw6IHN0cmluZ30pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fdXNlcklkID0gdXNlckRpclJlc3VsdC51c2VyX2lkO1xuICAgICAgICB0aGlzLl9kaXNwbGF5TmFtZSA9IHVzZXJEaXJSZXN1bHQuZGlzcGxheV9uYW1lO1xuICAgICAgICB0aGlzLl9hdmF0YXJVcmwgPSB1c2VyRGlyUmVzdWx0LmF2YXRhcl91cmw7XG4gICAgfVxuXG4gICAgLy8gVGhlc2UgbmV4dCBjbGFzcyBtZW1iZXJzIGFyZSBmb3IgdGhlIE1lbWJlciBpbnRlcmZhY2VcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcGxheU5hbWUgfHwgdGhpcy5fdXNlcklkO1xuICAgIH1cblxuICAgIGdldCB1c2VySWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VzZXJJZDtcbiAgICB9XG5cbiAgICBnZXRNeGNBdmF0YXJVcmwoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F2YXRhclVybDtcbiAgICB9XG59XG5cbmNsYXNzIFRocmVlcGlkTWVtYmVyIGV4dGVuZHMgTWVtYmVyIHtcbiAgICBfaWQ6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKGlkOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgZ2V0dGVyIHRoYXQgd291bGQgYmUgZmFsc2V5IG9uIGFsbCBvdGhlciBpbXBsZW1lbnRhdGlvbnMuIFVudGlsIHdlIGhhdmVcbiAgICAvLyBiZXR0ZXIgdHlwZSBzdXBwb3J0IGluIHRoZSByZWFjdC1zZGsgd2UgY2FuIHVzZSB0aGlzIHRyaWNrIHRvIGRldGVybWluZSB0aGUga2luZFxuICAgIC8vIG9mIDNQSUQgd2UncmUgZGVhbGluZyB3aXRoLCBpZiBhbnkuXG4gICAgZ2V0IGlzRW1haWwoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZC5pbmNsdWRlcygnQCcpO1xuICAgIH1cblxuICAgIC8vIFRoZXNlIG5leHQgY2xhc3MgbWVtYmVycyBhcmUgZm9yIHRoZSBNZW1iZXIgaW50ZXJmYWNlXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH1cblxuICAgIGdldCB1c2VySWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH1cblxuICAgIGdldE14Y0F2YXRhclVybCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmNsYXNzIERNVXNlclRpbGUgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBtZW1iZXI6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCwgLy8gU2hvdWxkIGJlIGEgTWVtYmVyIChzZWUgaW50ZXJmYWNlIGFib3ZlKVxuICAgICAgICBvblJlbW92ZTogUHJvcFR5cGVzLmZ1bmMsIC8vIHRha2VzIDEgYXJndW1lbnQsIHRoZSBtZW1iZXIgYmVpbmcgcmVtb3ZlZFxuICAgIH07XG5cbiAgICBfb25SZW1vdmUgPSAoZSkgPT4ge1xuICAgICAgICAvLyBTdG9wIHRoZSBicm93c2VyIGZyb20gaGlnaGxpZ2h0aW5nIHRleHRcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIHRoaXMucHJvcHMub25SZW1vdmUodGhpcy5wcm9wcy5tZW1iZXIpO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuYXZhdGFycy5CYXNlQXZhdGFyXCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b25cIik7XG5cbiAgICAgICAgY29uc3QgYXZhdGFyU2l6ZSA9IDIwO1xuICAgICAgICBjb25zdCBhdmF0YXIgPSB0aGlzLnByb3BzLm1lbWJlci5pc0VtYWlsXG4gICAgICAgICAgICA/IDxpbWdcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ191c2VyVGlsZV9hdmF0YXIgbXhfSW52aXRlRGlhbG9nX3VzZXJUaWxlX3RocmVlcGlkQXZhdGFyJ1xuICAgICAgICAgICAgICAgIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbi1lbWFpbC1waWxsLWF2YXRhci5zdmdcIil9XG4gICAgICAgICAgICAgICAgd2lkdGg9e2F2YXRhclNpemV9IGhlaWdodD17YXZhdGFyU2l6ZX0gLz5cbiAgICAgICAgICAgIDogPEJhc2VBdmF0YXJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ191c2VyVGlsZV9hdmF0YXInXG4gICAgICAgICAgICAgICAgdXJsPXtnZXRIdHRwVXJpRm9yTXhjKFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SG9tZXNlcnZlclVybCgpLCB0aGlzLnByb3BzLm1lbWJlci5nZXRNeGNBdmF0YXJVcmwoKSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyU2l6ZSwgYXZhdGFyU2l6ZSwgXCJjcm9wXCIpfVxuICAgICAgICAgICAgICAgIG5hbWU9e3RoaXMucHJvcHMubWVtYmVyLm5hbWV9XG4gICAgICAgICAgICAgICAgaWROYW1lPXt0aGlzLnByb3BzLm1lbWJlci51c2VySWR9XG4gICAgICAgICAgICAgICAgd2lkdGg9e2F2YXRhclNpemV9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXthdmF0YXJTaXplfSAvPjtcblxuICAgICAgICBsZXQgY2xvc2VCdXR0b247XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uUmVtb3ZlKSB7XG4gICAgICAgICAgICBjbG9zZUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ191c2VyVGlsZV9yZW1vdmUnXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uUmVtb3ZlfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb24tcGlsbC1yZW1vdmUuc3ZnXCIpfSBhbHQ9e190KCdSZW1vdmUnKX0gd2lkdGg9ezh9IGhlaWdodD17OH0gLz5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfSW52aXRlRGlhbG9nX3VzZXJUaWxlJz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ191c2VyVGlsZV9waWxsJz5cbiAgICAgICAgICAgICAgICAgICAge2F2YXRhcn1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfdXNlclRpbGVfbmFtZSc+e3RoaXMucHJvcHMubWVtYmVyLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7IGNsb3NlQnV0dG9uIH1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmNsYXNzIERNUm9vbVRpbGUgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBtZW1iZXI6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCwgLy8gU2hvdWxkIGJlIGEgTWVtYmVyIChzZWUgaW50ZXJmYWNlIGFib3ZlKVxuICAgICAgICBsYXN0QWN0aXZlVHM6IFByb3BUeXBlcy5udW1iZXIsXG4gICAgICAgIG9uVG9nZ2xlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLCAvLyB0YWtlcyAxIGFyZ3VtZW50LCB0aGUgbWVtYmVyIGJlaW5nIHRvZ2dsZWRcbiAgICAgICAgaGlnaGxpZ2h0V29yZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgaXNTZWxlY3RlZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgfTtcblxuICAgIF9vbkNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgLy8gU3RvcCB0aGUgYnJvd3NlciBmcm9tIGhpZ2hsaWdodGluZyB0ZXh0XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICB0aGlzLnByb3BzLm9uVG9nZ2xlKHRoaXMucHJvcHMubWVtYmVyKTtcbiAgICB9O1xuXG4gICAgX2hpZ2hsaWdodE5hbWUoc3RyOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLmhpZ2hsaWdodFdvcmQpIHJldHVybiBzdHI7XG5cbiAgICAgICAgLy8gV2UgY29udmVydCB0aGluZ3MgdG8gbG93ZXJjYXNlIGZvciBpbmRleCBzZWFyY2hpbmcsIGJ1dCBwdWxsIHN1YnN0cmluZ3MgZnJvbVxuICAgICAgICAvLyB0aGUgc3VibWl0dGVkIHRleHQgdG8gcHJlc2VydmUgY2FzZS4gTm90ZTogd2UgZG9uJ3QgbmVlZCB0byBodG1sRW50aXRpZXMgdGhlXG4gICAgICAgIC8vIHN0cmluZyBiZWNhdXNlIFJlYWN0IHdpbGwgc2FmZWx5IGVuY29kZSB0aGUgdGV4dCBmb3IgdXMuXG4gICAgICAgIGNvbnN0IGxvd2VyU3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IGZpbHRlclN0ciA9IHRoaXMucHJvcHMuaGlnaGxpZ2h0V29yZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgbGV0IGlpO1xuICAgICAgICB3aGlsZSAoKGlpID0gbG93ZXJTdHIuaW5kZXhPZihmaWx0ZXJTdHIsIGkpKSA+PSAwKSB7XG4gICAgICAgICAgICAvLyBQdXNoIGFueSB0ZXh0IHdlIG1pc3NlZCAoZmlyc3QgYml0L21pZGRsZSBvZiB0ZXh0KVxuICAgICAgICAgICAgaWYgKGlpID4gaSkge1xuICAgICAgICAgICAgICAgIC8vIFB1c2ggYW55IHRleHQgd2UgYXJlbid0IGhpZ2hsaWdodGluZyAobWlkZGxlIG9mIHRleHQgbWF0Y2gsIG9yIGJlZ2lubmluZyBvZiB0ZXh0KVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKDxzcGFuIGtleT17aSArICdiZWdpbid9PntzdHIuc3Vic3RyaW5nKGksIGlpKX08L3NwYW4+KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaSA9IGlpOyAvLyBjb3B5IG92ZXIgaWkgb25seSBpZiB3ZSBoYXZlIGEgbWF0Y2ggKHRvIHByZXNlcnZlIGkgZm9yIGVuZC1vZi10ZXh0IG1hdGNoaW5nKVxuXG4gICAgICAgICAgICAvLyBIaWdobGlnaHQgdGhlIHdvcmQgdGhlIHVzZXIgZW50ZXJlZFxuICAgICAgICAgICAgY29uc3Qgc3Vic3RyID0gc3RyLnN1YnN0cmluZyhpLCBmaWx0ZXJTdHIubGVuZ3RoICsgaSk7XG4gICAgICAgICAgICByZXN1bHQucHVzaCg8c3BhbiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19yb29tVGlsZV9oaWdobGlnaHQnIGtleT17aSArICdib2xkJ30+e3N1YnN0cn08L3NwYW4+KTtcbiAgICAgICAgICAgIGkgKz0gc3Vic3RyLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFB1c2ggYW55IHRleHQgd2UgbWlzc2VkIChlbmQgb2YgdGV4dClcbiAgICAgICAgaWYgKGkgPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCg8c3BhbiBrZXk9e2kgKyAnZW5kJ30+e3N0ci5zdWJzdHJpbmcoaSl9PC9zcGFuPik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZUF2YXRhciA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5hdmF0YXJzLkJhc2VBdmF0YXJcIik7XG5cbiAgICAgICAgbGV0IHRpbWVzdGFtcCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmxhc3RBY3RpdmVUcykge1xuICAgICAgICAgICAgY29uc3QgaHVtYW5UcyA9IGh1bWFuaXplVGltZSh0aGlzLnByb3BzLmxhc3RBY3RpdmVUcyk7XG4gICAgICAgICAgICB0aW1lc3RhbXAgPSA8c3BhbiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19yb29tVGlsZV90aW1lJz57aHVtYW5Uc308L3NwYW4+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXZhdGFyU2l6ZSA9IDM2O1xuICAgICAgICBjb25zdCBhdmF0YXIgPSB0aGlzLnByb3BzLm1lbWJlci5pc0VtYWlsXG4gICAgICAgICAgICA/IDxpbWdcbiAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2ljb24tZW1haWwtcGlsbC1hdmF0YXIuc3ZnXCIpfVxuICAgICAgICAgICAgICAgIHdpZHRoPXthdmF0YXJTaXplfSBoZWlnaHQ9e2F2YXRhclNpemV9IC8+XG4gICAgICAgICAgICA6IDxCYXNlQXZhdGFyXG4gICAgICAgICAgICAgICAgdXJsPXtnZXRIdHRwVXJpRm9yTXhjKFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SG9tZXNlcnZlclVybCgpLCB0aGlzLnByb3BzLm1lbWJlci5nZXRNeGNBdmF0YXJVcmwoKSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyU2l6ZSwgYXZhdGFyU2l6ZSwgXCJjcm9wXCIpfVxuICAgICAgICAgICAgICAgIG5hbWU9e3RoaXMucHJvcHMubWVtYmVyLm5hbWV9XG4gICAgICAgICAgICAgICAgaWROYW1lPXt0aGlzLnByb3BzLm1lbWJlci51c2VySWR9XG4gICAgICAgICAgICAgICAgd2lkdGg9e2F2YXRhclNpemV9XG4gICAgICAgICAgICAgICAgaGVpZ2h0PXthdmF0YXJTaXplfSAvPjtcblxuICAgICAgICBsZXQgY2hlY2ttYXJrID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaXNTZWxlY3RlZCkge1xuICAgICAgICAgICAgLy8gVG8gcmVkdWNlIGZsaWNrZXJpbmcgd2UgcHV0IHRoZSAnc2VsZWN0ZWQnIHJvb20gdGlsZSBhYm92ZSB0aGUgcmVhbCBhdmF0YXJcbiAgICAgICAgICAgIGNoZWNrbWFyayA9IDxkaXYgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfcm9vbVRpbGVfc2VsZWN0ZWQnIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVG8gcmVkdWNlIGZsaWNrZXJpbmcgd2UgcHV0IHRoZSBjaGVja21hcmsgb24gdG9wIG9mIHRoZSBhY3R1YWwgYXZhdGFyIChwcmV2ZW50c1xuICAgICAgICAvLyB0aGUgYnJvd3NlciBmcm9tIHJlbG9hZGluZyB0aGUgaW1hZ2Ugc291cmNlIHdoZW4gdGhlIGF2YXRhciByZW1vdW50cykuXG4gICAgICAgIGNvbnN0IHN0YWNrZWRBdmF0YXIgPSAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19yb29tVGlsZV9hdmF0YXJTdGFjayc+XG4gICAgICAgICAgICAgICAge2F2YXRhcn1cbiAgICAgICAgICAgICAgICB7Y2hlY2ttYXJrfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfSW52aXRlRGlhbG9nX3Jvb21UaWxlJyBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrfT5cbiAgICAgICAgICAgICAgICB7c3RhY2tlZEF2YXRhcn1cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19yb29tVGlsZV9uYW1lJz57dGhpcy5faGlnaGxpZ2h0TmFtZSh0aGlzLnByb3BzLm1lbWJlci5uYW1lKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfcm9vbVRpbGVfdXNlcklkJz57dGhpcy5faGlnaGxpZ2h0TmFtZSh0aGlzLnByb3BzLm1lbWJlci51c2VySWQpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7dGltZXN0YW1wfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnZpdGVEaWFsb2cgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBUYWtlcyBhbiBhcnJheSBvZiB1c2VyIElEcy9lbWFpbHMgdG8gaW52aXRlLlxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIFRoZSBraW5kIG9mIGludml0ZSBiZWluZyBwZXJmb3JtZWQuIEFzc3VtZWQgdG8gYmUgS0lORF9ETSBpZlxuICAgICAgICAvLyBub3QgcHJvdmlkZWQuXG4gICAgICAgIGtpbmQ6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gVGhlIHJvb20gSUQgdGhpcyBkaWFsb2cgaXMgZm9yLiBPbmx5IHJlcXVpcmVkIGZvciBLSU5EX0lOVklURS5cbiAgICAgICAgcm9vbUlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBraW5kOiBLSU5EX0RNLFxuICAgIH07XG5cbiAgICBfZGVib3VuY2VUaW1lcjogbnVtYmVyID0gbnVsbDtcbiAgICBfZWRpdG9yUmVmOiBhbnkgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIGlmIChwcm9wcy5raW5kID09PSBLSU5EX0lOVklURSAmJiAhcHJvcHMucm9vbUlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXaGVuIHVzaW5nIEtJTkRfSU5WSVRFIGEgcm9vbUlkIGlzIHJlcXVpcmVkIGZvciBhbiBJbnZpdGVEaWFsb2dcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbHJlYWR5SW52aXRlZCA9IG5ldyBTZXQoW01hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSwgU2RrQ29uZmlnLmdldCgpWyd3ZWxjb21lVXNlcklkJ11dKTtcbiAgICAgICAgaWYgKHByb3BzLnJvb21JZCkge1xuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHByb3BzLnJvb21JZCk7XG4gICAgICAgICAgICBpZiAoIXJvb20pIHRocm93IG5ldyBFcnJvcihcIlJvb20gSUQgZ2l2ZW4gdG8gSW52aXRlRGlhbG9nIGRvZXMgbm90IGxvb2sgbGlrZSBhIHJvb21cIik7XG4gICAgICAgICAgICByb29tLmdldE1lbWJlcnNXaXRoTWVtYmVyc2hpcCgnaW52aXRlJykuZm9yRWFjaChtID0+IGFscmVhZHlJbnZpdGVkLmFkZChtLnVzZXJJZCkpO1xuICAgICAgICAgICAgcm9vbS5nZXRNZW1iZXJzV2l0aE1lbWJlcnNoaXAoJ2pvaW4nKS5mb3JFYWNoKG0gPT4gYWxyZWFkeUludml0ZWQuYWRkKG0udXNlcklkKSk7XG4gICAgICAgICAgICAvLyBhZGQgYmFubmVkIHVzZXJzLCBzbyB3ZSBkb24ndCB0cnkgdG8gaW52aXRlIHRoZW1cbiAgICAgICAgICAgIHJvb20uZ2V0TWVtYmVyc1dpdGhNZW1iZXJzaGlwKCdiYW4nKS5mb3JFYWNoKG0gPT4gYWxyZWFkeUludml0ZWQuYWRkKG0udXNlcklkKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdGFyZ2V0czogW10sIC8vIGFycmF5IG9mIE1lbWJlciBvYmplY3RzIChzZWUgaW50ZXJmYWNlIGFib3ZlKVxuICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJcIixcbiAgICAgICAgICAgIHJlY2VudHM6IHRoaXMuX2J1aWxkUmVjZW50cyhhbHJlYWR5SW52aXRlZCksXG4gICAgICAgICAgICBudW1SZWNlbnRzU2hvd246IElOSVRJQUxfUk9PTVNfU0hPV04sXG4gICAgICAgICAgICBzdWdnZXN0aW9uczogdGhpcy5fYnVpbGRTdWdnZXN0aW9ucyhhbHJlYWR5SW52aXRlZCksXG4gICAgICAgICAgICBudW1TdWdnZXN0aW9uc1Nob3duOiBJTklUSUFMX1JPT01TX1NIT1dOLFxuICAgICAgICAgICAgc2VydmVyUmVzdWx0c01peGluOiBbXSwgLy8geyB1c2VyOiBEaXJlY3RvcnlNZW1iZXIsIHVzZXJJZDogc3RyaW5nIH1bXSwgbGlrZSByZWNlbnRzIGFuZCBzdWdnZXN0aW9uc1xuICAgICAgICAgICAgdGhyZWVwaWRSZXN1bHRzTWl4aW46IFtdLCAvLyB7IHVzZXI6IFRocmVlcGlkTWVtYmVyLCB1c2VySWQ6IHN0cmluZ31bXSwgbGlrZSByZWNlbnRzIGFuZCBzdWdnZXN0aW9uc1xuICAgICAgICAgICAgY2FuVXNlSWRlbnRpdHlTZXJ2ZXI6ICEhTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCksXG4gICAgICAgICAgICB0cnlpbmdJZGVudGl0eVNlcnZlcjogZmFsc2UsXG5cbiAgICAgICAgICAgIC8vIFRoZXNlIHR3byBmbGFncyBhcmUgdXNlZCBmb3IgdGhlICdHbycgYnV0dG9uIHRvIGNvbW11bmljYXRlIHdoYXQgaXMgZ29pbmcgb24uXG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yVGV4dDogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9lZGl0b3JSZWYgPSBjcmVhdGVSZWYoKTtcbiAgICB9XG5cbiAgICBfYnVpbGRSZWNlbnRzKGV4Y2x1ZGVkVGFyZ2V0SWRzOiBTZXQ8c3RyaW5nPik6IHt1c2VySWQ6IHN0cmluZywgdXNlcjogUm9vbU1lbWJlciwgbGFzdEFjdGl2ZTogbnVtYmVyfSB7XG4gICAgICAgIGNvbnN0IHJvb21zID0gRE1Sb29tTWFwLnNoYXJlZCgpLmdldFVuaXF1ZVJvb21zV2l0aEluZGl2aWR1YWxzKCk7IC8vIG1hcCBvZiB1c2VySWQgPT4ganMtc2RrIFJvb21cblxuICAgICAgICAvLyBBbHNvIHB1bGwgaW4gYWxsIHRoZSByb29tcyB0YWdnZWQgYXMgVEFHX0RNIHNvIHdlIGRvbid0IG1pc3MgYW55dGhpbmcuIFNvbWV0aW1lcyB0aGVcbiAgICAgICAgLy8gcm9vbSBsaXN0IGRvZXNuJ3QgdGFnIHRoZSByb29tIGZvciB0aGUgRE1Sb29tTWFwLCBidXQgZG9lcyBmb3IgdGhlIHJvb20gbGlzdC5cbiAgICAgICAgY29uc3QgdGFnZ2VkUm9vbXMgPSBSb29tTGlzdFN0b3JlLmdldFJvb21MaXN0cygpO1xuICAgICAgICBjb25zdCBkbVRhZ2dlZFJvb21zID0gdGFnZ2VkUm9vbXNbVEFHX0RNXTtcbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCk7XG4gICAgICAgIGZvciAoY29uc3QgZG1Sb29tIG9mIGRtVGFnZ2VkUm9vbXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG90aGVyTWVtYmVycyA9IGRtUm9vbS5nZXRKb2luZWRNZW1iZXJzKCkuZmlsdGVyKHUgPT4gdS51c2VySWQgIT09IG15VXNlcklkKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIG90aGVyTWVtYmVycykge1xuICAgICAgICAgICAgICAgIGlmIChyb29tc1ttZW1iZXIudXNlcklkXSkgY29udGludWU7IC8vIGFscmVhZHkgaGF2ZSBhIHJvb21cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQWRkaW5nIERNIHJvb20gZm9yICR7bWVtYmVyLnVzZXJJZH0gYXMgJHtkbVJvb20ucm9vbUlkfSBmcm9tIHRhZywgbm90IERNIG1hcGApO1xuICAgICAgICAgICAgICAgIHJvb21zW21lbWJlci51c2VySWRdID0gZG1Sb29tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVjZW50cyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHVzZXJJZCBpbiByb29tcykge1xuICAgICAgICAgICAgLy8gRmlsdGVyIG91dCB1c2VyIElEcyB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSByb29tIC8gc2hvdWxkIGJlIGV4Y2x1ZGVkXG4gICAgICAgICAgICBpZiAoZXhjbHVkZWRUYXJnZXRJZHMuaGFzKHVzZXJJZCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtJbnZpdGU6UmVjZW50c10gRXhjbHVkaW5nICR7dXNlcklkfSBmcm9tIHJlY2VudHNgKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zW3VzZXJJZF07XG4gICAgICAgICAgICBjb25zdCBtZW1iZXIgPSByb29tLmdldE1lbWJlcih1c2VySWQpO1xuICAgICAgICAgICAgaWYgKCFtZW1iZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBqdXN0IHNraXAgcGVvcGxlIHdobyBkb24ndCBoYXZlIG1lbWJlcnNoaXBzIGZvciBzb21lIHJlYXNvblxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0ludml0ZTpSZWNlbnRzXSAke3VzZXJJZH0gaXMgbWlzc2luZyBhIG1lbWJlciBvYmplY3QgaW4gdGhlaXIgb3duIERNICgke3Jvb20ucm9vbUlkfSlgKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluZCB0aGUgbGFzdCB0aW1lc3RhbXAgZm9yIGEgbWVzc2FnZSBldmVudFxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoVHlwZXMgPSBbXCJtLnJvb20ubWVzc2FnZVwiLCBcIm0ucm9vbS5lbmNyeXB0ZWRcIiwgXCJtLnN0aWNrZXJcIl07XG4gICAgICAgICAgICBjb25zdCBtYXhTZWFyY2hFdmVudHMgPSAyMDsgLy8gdG8gcHJldmVudCB0cmF2ZXJzaW5nIGhpc3RvcnlcbiAgICAgICAgICAgIGxldCBsYXN0RXZlbnRUcyA9IDA7XG4gICAgICAgICAgICBpZiAocm9vbS50aW1lbGluZSAmJiByb29tLnRpbWVsaW5lLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSByb29tLnRpbWVsaW5lLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2ID0gcm9vbS50aW1lbGluZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaFR5cGVzLmluY2x1ZGVzKGV2LmdldFR5cGUoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RFdmVudFRzID0gZXYuZ2V0VHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb29tLnRpbWVsaW5lLmxlbmd0aCAtIGkgPiBtYXhTZWFyY2hFdmVudHMpIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbGFzdEV2ZW50VHMpIHtcbiAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcgd2VpcmQgaXMgZ29pbmcgb24gd2l0aCB0aGlzIHJvb21cbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtJbnZpdGU6UmVjZW50c10gJHt1c2VySWR9ICgke3Jvb20ucm9vbUlkfSkgaGFzIGEgd2VpcmQgbGFzdCB0aW1lc3RhbXA6ICR7bGFzdEV2ZW50VHN9YCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlY2VudHMucHVzaCh7dXNlcklkLCB1c2VyOiBtZW1iZXIsIGxhc3RBY3RpdmU6IGxhc3RFdmVudFRzfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyZWNlbnRzKSBjb25zb2xlLndhcm4oXCJbSW52aXRlOlJlY2VudHNdIE5vIHJlY2VudHMgdG8gc3VnZ2VzdCFcIik7XG5cbiAgICAgICAgLy8gU29ydCB0aGUgcmVjZW50cyBieSBsYXN0IGFjdGl2ZSB0byBzYXZlIHVzIHRpbWUgbGF0ZXJcbiAgICAgICAgcmVjZW50cy5zb3J0KChhLCBiKSA9PiBiLmxhc3RBY3RpdmUgLSBhLmxhc3RBY3RpdmUpO1xuXG4gICAgICAgIHJldHVybiByZWNlbnRzO1xuICAgIH1cblxuICAgIF9idWlsZFN1Z2dlc3Rpb25zKGV4Y2x1ZGVkVGFyZ2V0SWRzOiBTZXQ8c3RyaW5nPik6IHt1c2VySWQ6IHN0cmluZywgdXNlcjogUm9vbU1lbWJlcn0ge1xuICAgICAgICBjb25zdCBtYXhDb25zaWRlcmVkTWVtYmVycyA9IDIwMDtcbiAgICAgICAgY29uc3Qgam9pbmVkUm9vbXMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbXMoKVxuICAgICAgICAgICAgLmZpbHRlcihyID0+IHIuZ2V0TXlNZW1iZXJzaGlwKCkgPT09ICdqb2luJyAmJiByLmdldEpvaW5lZE1lbWJlckNvdW50KCkgPD0gbWF4Q29uc2lkZXJlZE1lbWJlcnMpO1xuXG4gICAgICAgIC8vIEdlbmVyYXRlcyB7IHVzZXJJZDoge21lbWJlciwgcm9vbXNbXX0gfVxuICAgICAgICBjb25zdCBtZW1iZXJSb29tcyA9IGpvaW5lZFJvb21zLnJlZHVjZSgobWVtYmVycywgcm9vbSkgPT4ge1xuICAgICAgICAgICAgLy8gRmlsdGVyIG91dCBETXMgKHdlJ2xsIGhhbmRsZSB0aGVzZSBpbiB0aGUgcmVjZW50cyBzZWN0aW9uKVxuICAgICAgICAgICAgaWYgKERNUm9vbU1hcC5zaGFyZWQoKS5nZXRVc2VySWRGb3JSb29tSWQocm9vbS5yb29tSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnM7IC8vIERvIG5vdGhpbmdcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgam9pbmVkTWVtYmVycyA9IHJvb20uZ2V0Sm9pbmVkTWVtYmVycygpLmZpbHRlcih1ID0+ICFleGNsdWRlZFRhcmdldElkcy5oYXModS51c2VySWQpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIGpvaW5lZE1lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgb3V0IHVzZXIgSURzIHRoYXQgYXJlIGFscmVhZHkgaW4gdGhlIHJvb20gLyBzaG91bGQgYmUgZXhjbHVkZWRcbiAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZWRUYXJnZXRJZHMuaGFzKG1lbWJlci51c2VySWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghbWVtYmVyc1ttZW1iZXIudXNlcklkXSkge1xuICAgICAgICAgICAgICAgICAgICBtZW1iZXJzW21lbWJlci51c2VySWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVtYmVyOiBtZW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmFjayB0aGUgcm9vbSBzaXplIG9mIHRoZSAncGlja2VkJyBtZW1iZXIgc28gd2UgY2FuIHVzZSB0aGUgcHJvZmlsZSBvZlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHNtYWxsZXN0IHJvb20gKGxpa2VseSBhIERNKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBpY2tlZE1lbWJlclJvb21TaXplOiByb29tLmdldEpvaW5lZE1lbWJlckNvdW50KCksXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tczogW10sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWVtYmVyc1ttZW1iZXIudXNlcklkXS5yb29tcy5wdXNoKHJvb20pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJvb20uZ2V0Sm9pbmVkTWVtYmVyQ291bnQoKSA8IG1lbWJlcnNbbWVtYmVyLnVzZXJJZF0ucGlja2VkTWVtYmVyUm9vbVNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyc1ttZW1iZXIudXNlcklkXS5tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlcnNbbWVtYmVyLnVzZXJJZF0ucGlja2VkTWVtYmVyUm9vbVNpemUgPSByb29tLmdldEpvaW5lZE1lbWJlckNvdW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnM7XG4gICAgICAgIH0sIHt9KTtcblxuICAgICAgICAvLyBHZW5lcmF0ZXMgeyB1c2VySWQ6IHttZW1iZXIsIG51bVJvb21zLCBzY29yZX0gfVxuICAgICAgICBjb25zdCBtZW1iZXJTY29yZXMgPSBPYmplY3QudmFsdWVzKG1lbWJlclJvb21zKS5yZWR1Y2UoKHNjb3JlcywgZW50cnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG51bU1lbWJlcnNUb3RhbCA9IGVudHJ5LnJvb21zLnJlZHVjZSgoYywgcikgPT4gYyArIHIuZ2V0Sm9pbmVkTWVtYmVyQ291bnQoKSwgMCk7XG4gICAgICAgICAgICBjb25zdCBtYXhSYW5nZSA9IG1heENvbnNpZGVyZWRNZW1iZXJzICogZW50cnkucm9vbXMubGVuZ3RoO1xuICAgICAgICAgICAgc2NvcmVzW2VudHJ5Lm1lbWJlci51c2VySWRdID0ge1xuICAgICAgICAgICAgICAgIG1lbWJlcjogZW50cnkubWVtYmVyLFxuICAgICAgICAgICAgICAgIG51bVJvb21zOiBlbnRyeS5yb29tcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc2NvcmU6IE1hdGgubWF4KDAsIE1hdGgucG93KDEgLSAobnVtTWVtYmVyc1RvdGFsIC8gbWF4UmFuZ2UpLCA1KSksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHNjb3JlcztcbiAgICAgICAgfSwge30pO1xuXG4gICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgc2NvcmVzIGZvciBiZWluZyBpbiByb29tcywgYm9vc3QgdGhvc2UgcGVvcGxlIHdobyBoYXZlIHNlbnQgbWVzc2FnZXNcbiAgICAgICAgLy8gcmVjZW50bHksIGFzIGEgd2F5IHRvIGltcHJvdmUgdGhlIHF1YWxpdHkgb2Ygc3VnZ2VzdGlvbnMuIFdlIGRvIHRoaXMgYnkgY2hlY2tpbmcgZXZlcnlcbiAgICAgICAgLy8gcm9vbSB0byBzZWUgd2hvIGhhcyBzZW50IGEgbWVzc2FnZSBpbiB0aGUgbGFzdCBmZXcgaG91cnMsIGFuZCBnaXZpbmcgdGhlbSBhIHNjb3JlXG4gICAgICAgIC8vIHdoaWNoIGNvcnJlbGF0ZXMgdG8gdGhlIGZyZXNobmVzcyBvZiB0aGVpciBtZXNzYWdlLiBJbiB0aGVvcnksIHRoaXMgcmVzdWx0cyBpbiBzdWdnZXN0aW9uc1xuICAgICAgICAvLyB3aGljaCBhcmUgY2xvc2VyIHRvIFwiY29udGludWUgdGhpcyBjb252ZXJzYXRpb25cIiByYXRoZXIgdGhhbiBcInRoaXMgcGVyc29uIGV4aXN0c1wiLlxuICAgICAgICBjb25zdCB0cnVlSm9pbmVkUm9vbXMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbXMoKS5maWx0ZXIociA9PiByLmdldE15TWVtYmVyc2hpcCgpID09PSAnam9pbicpO1xuICAgICAgICBjb25zdCBub3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBjb25zdCBlYXJsaWVzdEFnZUNvbnNpZGVyZWQgPSBub3cgLSAoNjAgKiA2MCAqIDEwMDApOyAvLyAxIGhvdXIgYWdvXG4gICAgICAgIGNvbnN0IG1heE1lc3NhZ2VzQ29uc2lkZXJlZCA9IDUwOyAvLyBzbyB3ZSBkb24ndCBpdGVyYXRlIG92ZXIgYSBodWdlIGFtb3VudCBvZiB0cmFmZmljXG4gICAgICAgIGNvbnN0IGxhc3RTcG9rZSA9IHt9OyAvLyB1c2VySWQ6IHRpbWVzdGFtcFxuICAgICAgICBjb25zdCBsYXN0U3Bva2VNZW1iZXJzID0ge307IC8vIHVzZXJJZDogcm9vbSBtZW1iZXJcbiAgICAgICAgZm9yIChjb25zdCByb29tIG9mIHRydWVKb2luZWRSb29tcykge1xuICAgICAgICAgICAgLy8gU2tpcCBsb3cgcHJpb3JpdHkgcm9vbXMgYW5kIERNc1xuICAgICAgICAgICAgY29uc3QgaXNEbSA9IERNUm9vbU1hcC5zaGFyZWQoKS5nZXRVc2VySWRGb3JSb29tSWQocm9vbS5yb29tSWQpO1xuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHJvb20udGFncykuaW5jbHVkZXMoXCJtLmxvd3ByaW9yaXR5XCIpIHx8IGlzRG0pIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZXZlbnRzID0gcm9vbS5nZXRMaXZlVGltZWxpbmUoKS5nZXRFdmVudHMoKTsgLy8gdGltZWxpbmVzIGFyZSBtb3N0IHJlY2VudCBsYXN0XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZXZlbnRzLmxlbmd0aCAtIDE7IGkgPj0gTWF0aC5tYXgoMCwgZXZlbnRzLmxlbmd0aCAtIG1heE1lc3NhZ2VzQ29uc2lkZXJlZCk7IGktLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ID0gZXZlbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChleGNsdWRlZFRhcmdldElkcy5oYXMoZXYuZ2V0U2VuZGVyKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXYuZ2V0VHMoKSA8PSBlYXJsaWVzdEFnZUNvbnNpZGVyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGdpdmUgdXA6IGFsbCBldmVudHMgZnJvbSBoZXJlIG9uIG91dCBhcmUgdG9vIG9sZFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghbGFzdFNwb2tlW2V2LmdldFNlbmRlcigpXSB8fCBsYXN0U3Bva2VbZXYuZ2V0U2VuZGVyKCldIDwgZXYuZ2V0VHMoKSkge1xuICAgICAgICAgICAgICAgICAgICBsYXN0U3Bva2VbZXYuZ2V0U2VuZGVyKCldID0gZXYuZ2V0VHMoKTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNwb2tlTWVtYmVyc1tldi5nZXRTZW5kZXIoKV0gPSByb29tLmdldE1lbWJlcihldi5nZXRTZW5kZXIoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgdXNlcklkIGluIGxhc3RTcG9rZSkge1xuICAgICAgICAgICAgY29uc3QgdHMgPSBsYXN0U3Bva2VbdXNlcklkXTtcbiAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IGxhc3RTcG9rZU1lbWJlcnNbdXNlcklkXTtcbiAgICAgICAgICAgIGlmICghbWVtYmVyKSBjb250aW51ZTsgLy8gc2tpcCBwZW9wbGUgd2Ugc29tZWhvdyBkb24ndCBoYXZlIHByb2ZpbGVzIGZvclxuXG4gICAgICAgICAgICAvLyBTY29yZXMgZnJvbSBiZWluZyBpbiBhIHJvb20gZ2l2ZSBhICdnb29kJyBzY29yZSBvZiBhYm91dCAxLjAtMS41LCBzbyBmb3Igb3VyXG4gICAgICAgICAgICAvLyBib29zdCB3ZSdsbCB0cnkgYW5kIGF3YXJkIGF0IGxlYXN0ICsxLjAgZm9yIG1ha2luZyB0aGUgbGlzdCwgd2l0aCArNC4wIGJlaW5nXG4gICAgICAgICAgICAvLyBhbiBhcHByb3hpbWF0ZSBtYXhpbXVtIGZvciBiZWluZyBzZWxlY3RlZC5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlRnJvbU5vdyA9IE1hdGguYWJzKG5vdyAtIHRzKTsgLy8gYWJzIHRvIGFjY291bnQgZm9yIHNsaWdodCBmdXR1cmUgbWVzc2FnZXNcbiAgICAgICAgICAgIGNvbnN0IGludmVyc2VUaW1lID0gKG5vdyAtIGVhcmxpZXN0QWdlQ29uc2lkZXJlZCkgLSBkaXN0YW5jZUZyb21Ob3c7XG4gICAgICAgICAgICBjb25zdCBzY29yZUJvb3N0ID0gTWF0aC5tYXgoMSwgaW52ZXJzZVRpbWUgLyAoMTUgKiA2MCAqIDEwMDApKTsgLy8gMTVtaW4gc2VnbWVudHMgdG8ga2VlcCBzY29yZXMgc2FuZVxuXG4gICAgICAgICAgICBsZXQgcmVjb3JkID0gbWVtYmVyU2NvcmVzW3VzZXJJZF07XG4gICAgICAgICAgICBpZiAoIXJlY29yZCkgcmVjb3JkID0gbWVtYmVyU2NvcmVzW3VzZXJJZF0gPSB7c2NvcmU6IDB9O1xuICAgICAgICAgICAgcmVjb3JkLm1lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgICAgIHJlY29yZC5zY29yZSArPSBzY29yZUJvb3N0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVtYmVycyA9IE9iamVjdC52YWx1ZXMobWVtYmVyU2NvcmVzKTtcbiAgICAgICAgbWVtYmVycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYS5zY29yZSA9PT0gYi5zY29yZSkge1xuICAgICAgICAgICAgICAgIGlmIChhLm51bVJvb21zID09PSBiLm51bVJvb21zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLm1lbWJlci51c2VySWQubG9jYWxlQ29tcGFyZShiLm1lbWJlci51c2VySWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBiLm51bVJvb21zIC0gYS5udW1Sb29tcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBiLnNjb3JlIC0gYS5zY29yZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlcnMubWFwKG0gPT4gKHt1c2VySWQ6IG0ubWVtYmVyLnVzZXJJZCwgdXNlcjogbS5tZW1iZXJ9KSk7XG4gICAgfVxuXG4gICAgX3Nob3VsZEFib3J0QWZ0ZXJJbnZpdGVFcnJvcihyZXN1bHQpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgZmFpbGVkVXNlcnMgPSBPYmplY3Qua2V5cyhyZXN1bHQuc3RhdGVzKS5maWx0ZXIoYSA9PiByZXN1bHQuc3RhdGVzW2FdID09PSAnZXJyb3InKTtcbiAgICAgICAgaWYgKGZhaWxlZFVzZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRmFpbGVkIHRvIGludml0ZSB1c2VyczogXCIsIHJlc3VsdCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvclRleHQ6IF90KFwiRmFpbGVkIHRvIGludml0ZSB0aGUgZm9sbG93aW5nIHVzZXJzIHRvIGNoYXQ6ICUoY3N2VXNlcnMpc1wiLCB7XG4gICAgICAgICAgICAgICAgICAgIGNzdlVzZXJzOiBmYWlsZWRVc2Vycy5qb2luKFwiLCBcIiksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBhYm9ydFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBfY29udmVydEZpbHRlcigpOiBNZW1iZXJbXSB7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSdzIGFueXRoaW5nIHRvIGNvbnZlcnQgZmlyc3RcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmZpbHRlclRleHQgfHwgIXRoaXMuc3RhdGUuZmlsdGVyVGV4dC5pbmNsdWRlcygnQCcpKSByZXR1cm4gdGhpcy5zdGF0ZS50YXJnZXRzIHx8IFtdO1xuXG4gICAgICAgIGxldCBuZXdNZW1iZXI6IE1lbWJlcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZmlsdGVyVGV4dC5zdGFydHNXaXRoKCdAJykpIHtcbiAgICAgICAgICAgIC8vIEFzc3VtZSBteGlkXG4gICAgICAgICAgICBuZXdNZW1iZXIgPSBuZXcgRGlyZWN0b3J5TWVtYmVyKHt1c2VyX2lkOiB0aGlzLnN0YXRlLmZpbHRlclRleHQsIGRpc3BsYXlfbmFtZTogbnVsbCwgYXZhdGFyX3VybDogbnVsbH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQXNzdW1lIGVtYWlsXG4gICAgICAgICAgICBuZXdNZW1iZXIgPSBuZXcgVGhyZWVwaWRNZW1iZXIodGhpcy5zdGF0ZS5maWx0ZXJUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXdUYXJnZXRzID0gWy4uLih0aGlzLnN0YXRlLnRhcmdldHMgfHwgW10pLCBuZXdNZW1iZXJdO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt0YXJnZXRzOiBuZXdUYXJnZXRzLCBmaWx0ZXJUZXh0OiAnJ30pO1xuICAgICAgICByZXR1cm4gbmV3VGFyZ2V0cztcbiAgICB9XG5cbiAgICBfc3RhcnREbSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YnVzeTogdHJ1ZX0pO1xuICAgICAgICBjb25zdCB0YXJnZXRzID0gdGhpcy5fY29udmVydEZpbHRlcigpO1xuICAgICAgICBjb25zdCB0YXJnZXRJZHMgPSB0YXJnZXRzLm1hcCh0ID0+IHQudXNlcklkKTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgRE0gd2l0aCB0aGVzZSBwZW9wbGUgYW5kIHJldXNlIGl0IGlmIHBvc3NpYmxlLlxuICAgICAgICBjb25zdCBleGlzdGluZ1Jvb20gPSBETVJvb21NYXAuc2hhcmVkKCkuZ2V0RE1Sb29tRm9ySWRlbnRpZmllcnModGFyZ2V0SWRzKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nUm9vbSkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IGV4aXN0aW5nUm9vbS5yb29tSWQsXG4gICAgICAgICAgICAgICAgc2hvdWxkX3BlZWs6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGpvaW5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNyZWF0ZVJvb21PcHRpb25zID0ge2lubGluZUVycm9yczogdHJ1ZX07XG5cbiAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgYWxsIHVzZXJzIGhhdmUgdXBsb2FkZWQgZGV2aWNlIGtleXMgYmVmb3JlLlxuICAgICAgICAgICAgLy8gSWYgc28sIGVuYWJsZSBlbmNyeXB0aW9uIGluIHRoZSBuZXcgcm9vbS5cbiAgICAgICAgICAgIGNvbnN0IGhhczNQaWRNZW1iZXJzID0gdGFyZ2V0cy5zb21lKHQgPT4gdCBpbnN0YW5jZW9mIFRocmVlcGlkTWVtYmVyKTtcbiAgICAgICAgICAgIGlmICghaGFzM1BpZE1lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSGF2ZURldmljZUtleXMgPSBhd2FpdCBjYW5FbmNyeXB0VG9BbGxVc2VycyhjbGllbnQsIHRhcmdldElkcyk7XG4gICAgICAgICAgICAgICAgaWYgKGFsbEhhdmVEZXZpY2VLZXlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZVJvb21PcHRpb25zLmVuY3J5cHRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIGl0J3MgYSB0cmFkaXRpb25hbCBETSBhbmQgY3JlYXRlIHRoZSByb29tIGlmIHJlcXVpcmVkLlxuICAgICAgICAvLyBUT0RPOiBbQ2Fub25pY2FsIERNc10gUmVtb3ZlIHRoaXMgY2hlY2sgYW5kIGluc3RlYWQganVzdCBjcmVhdGUgdGhlIG11bHRpLXBlcnNvbiBETVxuICAgICAgICBsZXQgY3JlYXRlUm9vbVByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgY29uc3QgaXNTZWxmID0gdGFyZ2V0SWRzLmxlbmd0aCA9PT0gMSAmJiB0YXJnZXRJZHNbMF0gPT09IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKTtcbiAgICAgICAgaWYgKHRhcmdldElkcy5sZW5ndGggPT09IDEgJiYgIWlzU2VsZikge1xuICAgICAgICAgICAgY3JlYXRlUm9vbU9wdGlvbnMuZG1Vc2VySWQgPSB0YXJnZXRJZHNbMF07XG4gICAgICAgICAgICBjcmVhdGVSb29tUHJvbWlzZSA9IGNyZWF0ZVJvb20oY3JlYXRlUm9vbU9wdGlvbnMpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU2VsZikge1xuICAgICAgICAgICAgY3JlYXRlUm9vbVByb21pc2UgPSBjcmVhdGVSb29tKGNyZWF0ZVJvb21PcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGJvcmluZyByb29tIGFuZCB0cnkgdG8gaW52aXRlIHRoZSB0YXJnZXRzIG1hbnVhbGx5LlxuICAgICAgICAgICAgY3JlYXRlUm9vbVByb21pc2UgPSBjcmVhdGVSb29tKGNyZWF0ZVJvb21PcHRpb25zKS50aGVuKHJvb21JZCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGludml0ZU11bHRpcGxlVG9Sb29tKHJvb21JZCwgdGFyZ2V0SWRzKTtcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2hvdWxkQWJvcnRBZnRlckludml0ZUVycm9yKHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGFib3J0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgY3JlYXRlUm9vbSBjYWxsIHdpbGwgc2hvdyB0aGUgcm9vbSBmb3IgdXMsIHNvIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgdGhhdC5cbiAgICAgICAgY3JlYXRlUm9vbVByb21pc2UudGhlbihhYm9ydCA9PiB7XG4gICAgICAgICAgICBpZiAoYWJvcnQgPT09IHRydWUpIHJldHVybjsgLy8gb25seSBhYm9ydCBvbiB0cnVlIGJvb2xlYW5zLCBub3Qgcm9vbUlkcyBvciBzb21ldGhpbmdcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBfdChcIldlIGNvdWxkbid0IGNyZWF0ZSB5b3VyIERNLiBQbGVhc2UgY2hlY2sgdGhlIHVzZXJzIHlvdSB3YW50IHRvIGludml0ZSBhbmQgdHJ5IGFnYWluLlwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX2ludml0ZVVzZXJzID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiB0cnVlfSk7XG4gICAgICAgIHRoaXMuX2NvbnZlcnRGaWx0ZXIoKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuX2NvbnZlcnRGaWx0ZXIoKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0SWRzID0gdGFyZ2V0cy5tYXAodCA9PiB0LnVzZXJJZCk7XG5cbiAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGZpbmQgdGhlIHJvb20gdG8gaW52aXRlIHVzZXJzIHRvXCIpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3JUZXh0OiBfdChcIlNvbWV0aGluZyB3ZW50IHdyb25nIHRyeWluZyB0byBpbnZpdGUgdGhlIHVzZXJzLlwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaW52aXRlTXVsdGlwbGVUb1Jvb20odGhpcy5wcm9wcy5yb29tSWQsIHRhcmdldElkcykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zaG91bGRBYm9ydEFmdGVySW52aXRlRXJyb3IocmVzdWx0KSkgeyAvLyBoYW5kbGVzIHNldHRpbmcgZXJyb3IgbWVzc2FnZSB0b29cbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yVGV4dDogX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiV2UgY291bGRuJ3QgaW52aXRlIHRob3NlIHVzZXJzLiBQbGVhc2UgY2hlY2sgdGhlIHVzZXJzIHlvdSB3YW50IHRvIGludml0ZSBhbmQgdHJ5IGFnYWluLlwiLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vbktleURvd24gPSAoZSkgPT4ge1xuICAgICAgICAvLyB3aGVuIHRoZSBmaWVsZCBpcyBlbXB0eSBhbmQgdGhlIHVzZXIgaGl0cyBiYWNrc3BhY2UgcmVtb3ZlIHRoZSByaWdodC1tb3N0IHRhcmdldFxuICAgICAgICBpZiAoIWUudGFyZ2V0LnZhbHVlICYmICF0aGlzLnN0YXRlLmJ1c3kgJiYgdGhpcy5zdGF0ZS50YXJnZXRzLmxlbmd0aCA+IDAgJiYgZS5rZXkgPT09IEtleS5CQUNLU1BBQ0UgJiZcbiAgICAgICAgICAgICFlLmN0cmxLZXkgJiYgIWUuc2hpZnRLZXkgJiYgIWUubWV0YUtleVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZU1lbWJlcih0aGlzLnN0YXRlLnRhcmdldHNbdGhpcy5zdGF0ZS50YXJnZXRzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBfdXBkYXRlRmlsdGVyID0gKGUpID0+IHtcbiAgICAgICAgY29uc3QgdGVybSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtmaWx0ZXJUZXh0OiB0ZXJtfSk7XG5cbiAgICAgICAgLy8gRGVib3VuY2Ugc2VydmVyIGxvb2t1cHMgdG8gcmVkdWNlIHNwYW0uIFdlIGRvbid0IGNsZWFyIHRoZSBleGlzdGluZyBzZXJ2ZXJcbiAgICAgICAgLy8gcmVzdWx0cyBiZWNhdXNlIHRoZXkgbWlnaHQgc3RpbGwgYmUgdmFndWVseSBhY2N1cmF0ZSwgbGlrZXdpc2UgZm9yIHJhY2VzIHdoaWNoXG4gICAgICAgIC8vIGNvdWxkIGhhcHBlbiBoZXJlLlxuICAgICAgICBpZiAodGhpcy5fZGVib3VuY2VUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RlYm91bmNlVGltZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RlYm91bmNlVGltZXIgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZWFyY2hVc2VyRGlyZWN0b3J5KHt0ZXJtfSkudGhlbihhc3luYyByID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGVybSAhPT0gdGhpcy5zdGF0ZS5maWx0ZXJUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIERpc2NhcmQgdGhlIHJlc3VsdHMgLSB3ZSB3ZXJlIHByb2JhYmx5IHRvbyBzbG93IG9uIHRoZSBzZXJ2ZXItc2lkZSB0byBtYWtlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZXNlIHJlc3VsdHMgdXNlZnVsLiBUaGlzIGlzIGEgcmFjZSB3ZSB3YW50IHRvIGF2b2lkIGJlY2F1c2Ugd2UgY291bGQgb3ZlcndyaXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIG1vcmUgYWNjdXJhdGUgcmVzdWx0cy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghci5yZXN1bHRzKSByLnJlc3VsdHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIC8vIFdoaWxlIHdlJ3JlIGhlcmUsIHRyeSBhbmQgYXV0b2NvbXBsZXRlIGEgc2VhcmNoIHJlc3VsdCBmb3IgdGhlIG14aWQgaXRzZWxmXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBubyBtYXRjaGVzIChhbmQgdGhlIGlucHV0IGxvb2tzIGxpa2UgYSBteGlkKS5cbiAgICAgICAgICAgICAgICBpZiAodGVybVswXSA9PT0gJ0AnICYmIHRlcm0uaW5kZXhPZignOicpID4gMSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZmlsZSA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRQcm9maWxlSW5mbyh0ZXJtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9maWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIHByb2ZpbGUsIHdlIGhhdmUgZW5vdWdoIGluZm9ybWF0aW9uIHRvIGFzc3VtZSB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG14aWQgY2FuIGJlIGludml0ZWQgLSBhZGQgaXQgdG8gdGhlIGxpc3QuIFdlIHN0aWNrIGl0IGF0IHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvcCBzbyBpdCBpcyBtb3N0IG9idmlvdXNseSBwcmVzZW50ZWQgdG8gdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgci5yZXN1bHRzLnNwbGljZSgwLCAwLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6IHRlcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfbmFtZTogcHJvZmlsZVsnZGlzcGxheW5hbWUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyX3VybDogcHJvZmlsZVsnYXZhdGFyX3VybCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJOb24tZmF0YWwgZXJyb3IgdHJ5aW5nIHRvIG1ha2UgYW4gaW52aXRlIGZvciBhIHVzZXIgSURcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhIHJlc3VsdCBhbnl3YXlzLCBqdXN0IHdpdGhvdXQgYSBwcm9maWxlLiBXZSBzdGljayBpdCBhdCB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvcCBzbyBpdCBpcyBtb3N0IG9idmlvdXNseSBwcmVzZW50ZWQgdG8gdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICByLnJlc3VsdHMuc3BsaWNlKDAsIDAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyX2lkOiB0ZXJtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfbmFtZTogdGVybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJfdXJsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyUmVzdWx0c01peGluOiByLnJlc3VsdHMubWFwKHUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJZDogdS51c2VyX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogbmV3IERpcmVjdG9yeU1lbWJlcih1KSxcbiAgICAgICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlYXJjaGluZyB1c2VyIGRpcmVjdG9yeTpcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzZXJ2ZXJSZXN1bHRzTWl4aW46IFtdfSk7IC8vIGNsZWFyIHJlc3VsdHMgYmVjYXVzZSBpdCdzIG1vZGVyYXRlbHkgZmF0YWxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBXaGVuZXZlciB3ZSBzZWFyY2ggdGhlIGRpcmVjdG9yeSwgYWxzbyB0cnkgdG8gc2VhcmNoIHRoZSBpZGVudGl0eSBzZXJ2ZXIuIEl0J3NcbiAgICAgICAgICAgIC8vIGFsbCBkZWJvdW5jZWQgdGhlIHNhbWUgYW55d2F5cy5cbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZS5jYW5Vc2VJZGVudGl0eVNlcnZlcikge1xuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIGRvZXNuJ3QgaGF2ZSBhbiBpZGVudGl0eSBzZXJ2ZXIgc2V0IC0gd2FybiB0aGVtIG9mIHRoYXQuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dHJ5aW5nSWRlbnRpdHlTZXJ2ZXI6IHRydWV9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGVybS5pbmRleE9mKCdAJykgPiAwICYmIEVtYWlsLmxvb2tzVmFsaWQodGVybSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGFydCBvZmYgYnkgc3VnZ2VzdGluZyB0aGUgcGxhaW4gZW1haWwgd2hpbGUgd2UgdHJ5IGFuZCByZXNvbHZlIGl0XG4gICAgICAgICAgICAgICAgLy8gdG8gYSByZWFsIGFjY291bnQuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIC8vIHBlciBhYm92ZTogdGhlIHVzZXJJZCBpcyBhIGxpZSBoZXJlIC0gaXQncyBqdXN0IGEgcmVndWxhciBpZGVudGlmaWVyXG4gICAgICAgICAgICAgICAgICAgIHRocmVlcGlkUmVzdWx0c01peGluOiBbe3VzZXI6IG5ldyBUaHJlZXBpZE1lbWJlcih0ZXJtKSwgdXNlcklkOiB0ZXJtfV0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aENsaWVudCA9IG5ldyBJZGVudGl0eUF1dGhDbGllbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXJtICE9PSB0aGlzLnN0YXRlLmZpbHRlclRleHQpIHJldHVybjsgLy8gYWJhbmRvbiBob3BlXG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9va3VwID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmxvb2t1cFRocmVlUGlkKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2VtYWlsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIC8vIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlcm0gIT09IHRoaXMuc3RhdGUuZmlsdGVyVGV4dCkgcmV0dXJuOyAvLyBhYmFuZG9uIGhvcGVcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWxvb2t1cCB8fCAhbG9va3VwLm14aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHdlcmVuJ3QgYWJsZSB0byBmaW5kIGFueW9uZSAtIHdlJ3JlIGFscmVhZHkgc3VnZ2VzdGluZyB0aGUgcGxhaW4gZW1haWxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIGFuIGFsdGVybmF0aXZlLCBzbyBkbyBub3RoaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgYXBwZW5kIHRoZSB1c2VyIHN1Z2dlc3Rpb24gdG8gZ2l2ZSB0aGUgdXNlciBhbiBvcHRpb24gdG8gY2xpY2tcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVtYWlsIGFueXdheXMsIGFuZCBzbyB3ZSBkb24ndCBjYXVzZSB0aGluZ3MgdG8ganVtcCBhcm91bmQuIEluXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW9yeSwgdGhlIHVzZXIgd291bGQgc2VlIHRoZSB1c2VyIHBvcCB1cCBhbmQgdGhpbmsgXCJhaCB5ZXMsIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgLy8gcGVyc29uIVwiXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2ZpbGUgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0UHJvZmlsZUluZm8obG9va3VwLm14aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVybSAhPT0gdGhpcy5zdGF0ZS5maWx0ZXJUZXh0IHx8ICFwcm9maWxlKSByZXR1cm47IC8vIGFiYW5kb24gaG9wZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocmVlcGlkUmVzdWx0c01peGluOiBbLi4udGhpcy5zdGF0ZS50aHJlZXBpZFJlc3VsdHNNaXhpbiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IG5ldyBEaXJlY3RvcnlNZW1iZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyX2lkOiBsb29rdXAubXhpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9uYW1lOiBwcm9maWxlLmRpc3BsYXluYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJfdXJsOiBwcm9maWxlLmF2YXRhcl91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcklkOiBsb29rdXAubXhpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZWFyY2hpbmcgaWRlbnRpdHkgc2VydmVyOlwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGhyZWVwaWRSZXN1bHRzTWl4aW46IFtdfSk7IC8vIGNsZWFyIHJlc3VsdHMgYmVjYXVzZSBpdCdzIG1vZGVyYXRlbHkgZmF0YWxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDE1MCk7IC8vIDE1MG1zIGRlYm91bmNlIChodW1hbiByZWFjdGlvbiB0aW1lICsgc29tZSlcbiAgICB9O1xuXG4gICAgX3Nob3dNb3JlUmVjZW50cyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bnVtUmVjZW50c1Nob3duOiB0aGlzLnN0YXRlLm51bVJlY2VudHNTaG93biArIElOQ1JFTUVOVF9ST09NU19TSE9XTn0pO1xuICAgIH07XG5cbiAgICBfc2hvd01vcmVTdWdnZXN0aW9ucyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bnVtU3VnZ2VzdGlvbnNTaG93bjogdGhpcy5zdGF0ZS5udW1TdWdnZXN0aW9uc1Nob3duICsgSU5DUkVNRU5UX1JPT01TX1NIT1dOfSk7XG4gICAgfTtcblxuICAgIF90b2dnbGVNZW1iZXIgPSAobWVtYmVyOiBNZW1iZXIpID0+IHtcbiAgICAgICAgbGV0IGZpbHRlclRleHQgPSB0aGlzLnN0YXRlLmZpbHRlclRleHQ7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLnN0YXRlLnRhcmdldHMubWFwKHQgPT4gdCk7IC8vIGNoZWFwIGNsb25lIGZvciBtdXRhdGlvblxuICAgICAgICBjb25zdCBpZHggPSB0YXJnZXRzLmluZGV4T2YobWVtYmVyKTtcbiAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICB0YXJnZXRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKG1lbWJlcik7XG4gICAgICAgICAgICBmaWx0ZXJUZXh0ID0gXCJcIjsgLy8gY2xlYXIgdGhlIGZpbHRlciB3aGVuIHRoZSB1c2VyIGFjY2VwdHMgYSBzdWdnZXN0aW9uXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGFyZ2V0cywgZmlsdGVyVGV4dH0pO1xuICAgIH07XG5cbiAgICBfcmVtb3ZlTWVtYmVyID0gKG1lbWJlcjogTWVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLnN0YXRlLnRhcmdldHMubWFwKHQgPT4gdCk7IC8vIGNoZWFwIGNsb25lIGZvciBtdXRhdGlvblxuICAgICAgICBjb25zdCBpZHggPSB0YXJnZXRzLmluZGV4T2YobWVtYmVyKTtcbiAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICB0YXJnZXRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGFyZ2V0c30pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vblBhc3RlID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZmlsdGVyVGV4dCkge1xuICAgICAgICAgICAgLy8gaWYgdGhlIHVzZXIgaGFzIGFscmVhZHkgdHlwZWQgc29tZXRoaW5nLCBqdXN0IGxldCB0aGVtXG4gICAgICAgICAgICAvLyBwYXN0ZSBub3JtYWxseS5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHRleHQgYmVpbmcgcGFzdGVkIGludG8gdGhlIHRleHRhcmVhXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBQcm9jZXNzIGl0IGFzIGEgbGlzdCBvZiBhZGRyZXNzZXMgdG8gYWRkIGluc3RlYWRcbiAgICAgICAgY29uc3QgdGV4dCA9IGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKFwidGV4dFwiKTtcbiAgICAgICAgY29uc3QgcG9zc2libGVNZW1iZXJzID0gW1xuICAgICAgICAgICAgLy8gSWYgd2UgY2FuIGF2b2lkIGhpdHRpbmcgdGhlIHByb2ZpbGUgZW5kcG9pbnQsIHdlIHNob3VsZC5cbiAgICAgICAgICAgIC4uLnRoaXMuc3RhdGUucmVjZW50cyxcbiAgICAgICAgICAgIC4uLnRoaXMuc3RhdGUuc3VnZ2VzdGlvbnMsXG4gICAgICAgICAgICAuLi50aGlzLnN0YXRlLnNlcnZlclJlc3VsdHNNaXhpbixcbiAgICAgICAgICAgIC4uLnRoaXMuc3RhdGUudGhyZWVwaWRSZXN1bHRzTWl4aW4sXG4gICAgICAgIF07XG4gICAgICAgIGNvbnN0IHRvQWRkID0gW107XG4gICAgICAgIGNvbnN0IGZhaWxlZCA9IFtdO1xuICAgICAgICBjb25zdCBwb3RlbnRpYWxBZGRyZXNzZXMgPSB0ZXh0LnNwbGl0KC9bXFxzLF0rLykubWFwKHAgPT4gcC50cmltKCkpLmZpbHRlcihwID0+ICEhcCk7IC8vIGZpbHRlciBlbXB0eSBzdHJpbmdzXG4gICAgICAgIGZvciAoY29uc3QgYWRkcmVzcyBvZiBwb3RlbnRpYWxBZGRyZXNzZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHBvc3NpYmxlTWVtYmVycy5maW5kKG0gPT4gbS51c2VySWQgPT09IGFkZHJlc3MpO1xuICAgICAgICAgICAgaWYgKG1lbWJlcikge1xuICAgICAgICAgICAgICAgIHRvQWRkLnB1c2gobWVtYmVyLnVzZXIpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYWRkcmVzcy5pbmRleE9mKCdAJykgPiAwICYmIEVtYWlsLmxvb2tzVmFsaWQoYWRkcmVzcykpIHtcbiAgICAgICAgICAgICAgICB0b0FkZC5wdXNoKG5ldyBUaHJlZXBpZE1lbWJlcihhZGRyZXNzKSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhZGRyZXNzWzBdICE9PSAnQCcpIHtcbiAgICAgICAgICAgICAgICBmYWlsZWQucHVzaChhZGRyZXNzKTsgLy8gbm90IGEgdXNlciBJRFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2ZpbGUgPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0UHJvZmlsZUluZm8oYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSBwcm9maWxlID8gcHJvZmlsZS5kaXNwbGF5bmFtZSA6IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgYXZhdGFyVXJsID0gcHJvZmlsZSA/IHByb2ZpbGUuYXZhdGFyX3VybCA6IG51bGw7XG4gICAgICAgICAgICAgICAgdG9BZGQucHVzaChuZXcgRGlyZWN0b3J5TWVtYmVyKHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcl9pZDogYWRkcmVzcyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9uYW1lOiBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyX3VybDogYXZhdGFyVXJsLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgbG9va2luZyB1cCBwcm9maWxlIGZvciBcIiArIGFkZHJlc3MpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgZmFpbGVkLnB1c2goYWRkcmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmFpbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5RdWVzdGlvbkRpYWxvZycpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnSW52aXRlIFBhc3RlIEZhaWwnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byBmaW5kIHRoZSBmb2xsb3dpbmcgdXNlcnMnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVGhlIGZvbGxvd2luZyB1c2VycyBtaWdodCBub3QgZXhpc3Qgb3IgYXJlIGludmFsaWQsIGFuZCBjYW5ub3QgYmUgaW52aXRlZDogJShjc3ZOYW1lcylzXCIsXG4gICAgICAgICAgICAgICAgICAgIHtjc3ZOYW1lczogZmFpbGVkLmpvaW4oXCIsIFwiKX0sXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBidXR0b246IF90KCdPSycpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHt0YXJnZXRzOiBbLi4udGhpcy5zdGF0ZS50YXJnZXRzLCAuLi50b0FkZF19KTtcbiAgICB9O1xuXG4gICAgX29uQ2xpY2tJbnB1dEFyZWEgPSAoZSkgPT4ge1xuICAgICAgICAvLyBTdG9wIHRoZSBicm93c2VyIGZyb20gaGlnaGxpZ2h0aW5nIHRleHRcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3JSZWYgJiYgdGhpcy5fZWRpdG9yUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvclJlZi5jdXJyZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uVXNlRGVmYXVsdElkZW50aXR5U2VydmVyQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBJUyBpbiBhY2NvdW50IGRhdGEuIEFjdHVhbGx5IHVzaW5nIGl0IG1heSB0cmlnZ2VyIHRlcm1zLlxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3NcbiAgICAgICAgdXNlRGVmYXVsdElkZW50aXR5U2VydmVyKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2NhblVzZUlkZW50aXR5U2VydmVyOiB0cnVlLCB0cnlpbmdJZGVudGl0eVNlcnZlcjogZmFsc2V9KTtcbiAgICB9O1xuXG4gICAgX29uTWFuYWdlU2V0dGluZ3NDbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZGlzLmZpcmUoQWN0aW9uLlZpZXdVc2VyU2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9O1xuXG4gICAgX3JlbmRlclNlY3Rpb24oa2luZDogXCJyZWNlbnRzXCJ8XCJzdWdnZXN0aW9uc1wiKSB7XG4gICAgICAgIGxldCBzb3VyY2VNZW1iZXJzID0ga2luZCA9PT0gJ3JlY2VudHMnID8gdGhpcy5zdGF0ZS5yZWNlbnRzIDogdGhpcy5zdGF0ZS5zdWdnZXN0aW9ucztcbiAgICAgICAgbGV0IHNob3dOdW0gPSBraW5kID09PSAncmVjZW50cycgPyB0aGlzLnN0YXRlLm51bVJlY2VudHNTaG93biA6IHRoaXMuc3RhdGUubnVtU3VnZ2VzdGlvbnNTaG93bjtcbiAgICAgICAgY29uc3Qgc2hvd01vcmVGbiA9IGtpbmQgPT09ICdyZWNlbnRzJyA/IHRoaXMuX3Nob3dNb3JlUmVjZW50cy5iaW5kKHRoaXMpIDogdGhpcy5fc2hvd01vcmVTdWdnZXN0aW9ucy5iaW5kKHRoaXMpO1xuICAgICAgICBjb25zdCBsYXN0QWN0aXZlID0gKG0pID0+IGtpbmQgPT09ICdyZWNlbnRzJyA/IG0ubGFzdEFjdGl2ZSA6IG51bGw7XG4gICAgICAgIGxldCBzZWN0aW9uTmFtZSA9IGtpbmQgPT09ICdyZWNlbnRzJyA/IF90KFwiUmVjZW50IENvbnZlcnNhdGlvbnNcIikgOiBfdChcIlN1Z2dlc3Rpb25zXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmtpbmQgPT09IEtJTkRfSU5WSVRFKSB7XG4gICAgICAgICAgICBzZWN0aW9uTmFtZSA9IGtpbmQgPT09ICdyZWNlbnRzJyA/IF90KFwiUmVjZW50bHkgRGlyZWN0IE1lc3NhZ2VkXCIpIDogX3QoXCJTdWdnZXN0aW9uc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1peCBpbiB0aGUgc2VydmVyIHJlc3VsdHMgaWYgd2UgaGF2ZSBhbnksIGJ1dCBvbmx5IGlmIHdlJ3JlIHNlYXJjaGluZy4gV2UgdHJhY2sgdGhlIGFkZGl0aW9uYWxcbiAgICAgICAgLy8gbWVtYmVycyBzZXBhcmF0ZWx5IGJlY2F1c2Ugd2Ugd2FudCB0byBmaWx0ZXIgc291cmNlTWVtYmVycyBidXQgdHJ1c3QgdGhlIG1peGluIGFycmF5cyB0byBoYXZlXG4gICAgICAgIC8vIHRoZSByaWdodCBtZW1iZXJzIGluIHRoZW0uXG4gICAgICAgIGxldCBwcmlvcml0eUFkZGl0aW9uYWxNZW1iZXJzID0gW107IC8vIFNob3dzIHVwIGJlZm9yZSBvdXIgb3duIHN1Z2dlc3Rpb25zLCBoaWdoZXIgcXVhbGl0eVxuICAgICAgICBsZXQgb3RoZXJBZGRpdGlvbmFsTWVtYmVycyA9IFtdOyAvLyBTaG93cyB1cCBhZnRlciBvdXIgb3duIHN1Z2dlc3Rpb25zLCBsb3dlciBxdWFsaXR5XG4gICAgICAgIGNvbnN0IGhhc01peGlucyA9IHRoaXMuc3RhdGUuc2VydmVyUmVzdWx0c01peGluIHx8IHRoaXMuc3RhdGUudGhyZWVwaWRSZXN1bHRzTWl4aW47XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmZpbHRlclRleHQgJiYgaGFzTWl4aW5zICYmIGtpbmQgPT09ICdzdWdnZXN0aW9ucycpIHtcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gZHVwbGljYXRlIG1lbWJlcnMgdGhvdWdoLCBzbyBqdXN0IGV4Y2x1ZGUgYW55b25lIHdlJ3ZlIGFscmVhZHkgc2Vlbi5cbiAgICAgICAgICAgIGNvbnN0IG5vdEFscmVhZHlFeGlzdHMgPSAodTogTWVtYmVyKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzb3VyY2VNZW1iZXJzLnNvbWUobSA9PiBtLnVzZXJJZCA9PT0gdS51c2VySWQpXG4gICAgICAgICAgICAgICAgICAgICYmICFwcmlvcml0eUFkZGl0aW9uYWxNZW1iZXJzLnNvbWUobSA9PiBtLnVzZXJJZCA9PT0gdS51c2VySWQpXG4gICAgICAgICAgICAgICAgICAgICYmICFvdGhlckFkZGl0aW9uYWxNZW1iZXJzLnNvbWUobSA9PiBtLnVzZXJJZCA9PT0gdS51c2VySWQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb3RoZXJBZGRpdGlvbmFsTWVtYmVycyA9IHRoaXMuc3RhdGUuc2VydmVyUmVzdWx0c01peGluLmZpbHRlcihub3RBbHJlYWR5RXhpc3RzKTtcbiAgICAgICAgICAgIHByaW9yaXR5QWRkaXRpb25hbE1lbWJlcnMgPSB0aGlzLnN0YXRlLnRocmVlcGlkUmVzdWx0c01peGluLmZpbHRlcihub3RBbHJlYWR5RXhpc3RzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNBZGRpdGlvbmFsTWVtYmVycyA9IHByaW9yaXR5QWRkaXRpb25hbE1lbWJlcnMubGVuZ3RoID4gMCB8fCBvdGhlckFkZGl0aW9uYWxNZW1iZXJzLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgLy8gSGlkZSB0aGUgc2VjdGlvbiBpZiB0aGVyZSdzIG5vdGhpbmcgdG8gZmlsdGVyIGJ5XG4gICAgICAgIGlmIChzb3VyY2VNZW1iZXJzLmxlbmd0aCA9PT0gMCAmJiAhaGFzQWRkaXRpb25hbE1lbWJlcnMpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIERvIHNvbWUgc2ltcGxlIGZpbHRlcmluZyBvbiB0aGUgaW5wdXQgYmVmb3JlIGdvaW5nIG11Y2ggZnVydGhlci4gSWYgd2UgZ2V0IG5vIHJlc3VsdHMsIHNheSBzby5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZmlsdGVyVGV4dCkge1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyQnkgPSB0aGlzLnN0YXRlLmZpbHRlclRleHQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHNvdXJjZU1lbWJlcnMgPSBzb3VyY2VNZW1iZXJzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihtID0+IG0udXNlci5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmlsdGVyQnkpIHx8IG0udXNlcklkLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmlsdGVyQnkpKTtcblxuICAgICAgICAgICAgaWYgKHNvdXJjZU1lbWJlcnMubGVuZ3RoID09PSAwICYmICFoYXNBZGRpdGlvbmFsTWVtYmVycykge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfc2VjdGlvbic+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+e3NlY3Rpb25OYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD57X3QoXCJObyByZXN1bHRzXCIpfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyB3ZSBtaXggaW4gdGhlIGFkZGl0aW9uYWwgbWVtYmVycy4gQWdhaW4sIHdlIHByZXN1bWUgdGhlc2UgaGF2ZSBhbHJlYWR5IGJlZW4gZmlsdGVyZWQuIFdlXG4gICAgICAgIC8vIGFsc28gYXNzdW1lIHRoZXkgYXJlIG1vcmUgcmVsZXZhbnQgdGhhbiBvdXIgc3VnZ2VzdGlvbnMgYW5kIHByZXBlbmQgdGhlbSB0byB0aGUgbGlzdC5cbiAgICAgICAgc291cmNlTWVtYmVycyA9IFsuLi5wcmlvcml0eUFkZGl0aW9uYWxNZW1iZXJzLCAuLi5zb3VyY2VNZW1iZXJzLCAuLi5vdGhlckFkZGl0aW9uYWxNZW1iZXJzXTtcblxuICAgICAgICAvLyBJZiB3ZSdyZSBnb2luZyB0byBoaWRlIG9uZSBtZW1iZXIgYmVoaW5kICdzaG93IG1vcmUnLCBqdXN0IHVzZSB1cCB0aGUgc3BhY2Ugb2YgdGhlIGJ1dHRvblxuICAgICAgICAvLyB3aXRoIHRoZSBtZW1iZXIncyB0aWxlIGluc3RlYWQuXG4gICAgICAgIGlmIChzaG93TnVtID09PSBzb3VyY2VNZW1iZXJzLmxlbmd0aCAtIDEpIHNob3dOdW0rKztcblxuICAgICAgICAvLyAuc2xpY2UoKSB3aWxsIHJldHVybiBhbiBpbmNvbXBsZXRlIGFycmF5IGJ1dCB3b24ndCBlcnJvciBvbiB1cyBpZiB3ZSBnbyB0b28gZmFyXG4gICAgICAgIGNvbnN0IHRvUmVuZGVyID0gc291cmNlTWVtYmVycy5zbGljZSgwLCBzaG93TnVtKTtcbiAgICAgICAgY29uc3QgaGFzTW9yZSA9IHRvUmVuZGVyLmxlbmd0aCA8IHNvdXJjZU1lbWJlcnMubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcbiAgICAgICAgbGV0IHNob3dNb3JlID0gbnVsbDtcbiAgICAgICAgaWYgKGhhc01vcmUpIHtcbiAgICAgICAgICAgIHNob3dNb3JlID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3Nob3dNb3JlRm59IGtpbmQ9XCJsaW5rXCI+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlNob3cgbW9yZVwiKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGlsZXMgPSB0b1JlbmRlci5tYXAociA9PiAoXG4gICAgICAgICAgICA8RE1Sb29tVGlsZVxuICAgICAgICAgICAgICAgIG1lbWJlcj17ci51c2VyfVxuICAgICAgICAgICAgICAgIGxhc3RBY3RpdmVUcz17bGFzdEFjdGl2ZShyKX1cbiAgICAgICAgICAgICAgICBrZXk9e3IudXNlcklkfVxuICAgICAgICAgICAgICAgIG9uVG9nZ2xlPXt0aGlzLl90b2dnbGVNZW1iZXJ9XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0V29yZD17dGhpcy5zdGF0ZS5maWx0ZXJUZXh0fVxuICAgICAgICAgICAgICAgIGlzU2VsZWN0ZWQ9e3RoaXMuc3RhdGUudGFyZ2V0cy5zb21lKHQgPT4gdC51c2VySWQgPT09IHIudXNlcklkKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICkpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19zZWN0aW9uJz5cbiAgICAgICAgICAgICAgICA8aDM+e3NlY3Rpb25OYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAge3RpbGVzfVxuICAgICAgICAgICAgICAgIHtzaG93TW9yZX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJFZGl0b3IoKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLnN0YXRlLnRhcmdldHMubWFwKHQgPT4gKFxuICAgICAgICAgICAgPERNVXNlclRpbGUgbWVtYmVyPXt0fSBvblJlbW92ZT17IXRoaXMuc3RhdGUuYnVzeSAmJiB0aGlzLl9yZW1vdmVNZW1iZXJ9IGtleT17dC51c2VySWR9IC8+XG4gICAgICAgICkpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IChcbiAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgIHJvd3M9ezF9XG4gICAgICAgICAgICAgICAgb25LZXlEb3duPXt0aGlzLl9vbktleURvd259XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX3VwZGF0ZUZpbHRlcn1cbiAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5maWx0ZXJUZXh0fVxuICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fZWRpdG9yUmVmfVxuICAgICAgICAgICAgICAgIG9uUGFzdGU9e3RoaXMuX29uUGFzdGV9XG4gICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXt0cnVlfVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmJ1c3l9XG4gICAgICAgICAgICAvPlxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19lZGl0b3InIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2tJbnB1dEFyZWF9PlxuICAgICAgICAgICAgICAgIHt0YXJnZXRzfVxuICAgICAgICAgICAgICAgIHtpbnB1dH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJJZGVudGl0eVNlcnZlcldhcm5pbmcoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS50cnlpbmdJZGVudGl0eVNlcnZlciB8fCB0aGlzLnN0YXRlLmNhblVzZUlkZW50aXR5U2VydmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRJZGVudGl0eVNlcnZlclVybCA9IGdldERlZmF1bHRJZGVudGl0eVNlcnZlclVybCgpO1xuICAgICAgICBpZiAoZGVmYXVsdElkZW50aXR5U2VydmVyVXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQWRkcmVzc1BpY2tlckRpYWxvZ19pZGVudGl0eVNlcnZlclwiPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJVc2UgYW4gaWRlbnRpdHkgc2VydmVyIHRvIGludml0ZSBieSBlbWFpbC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxkZWZhdWx0PlVzZSB0aGUgZGVmYXVsdCAoJShkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJOYW1lKXMpPC9kZWZhdWx0PiBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwib3IgbWFuYWdlIGluIDxzZXR0aW5ncz5TZXR0aW5nczwvc2V0dGluZ3M+LlwiLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJOYW1lOiBhYmJyZXZpYXRlVXJsKGRlZmF1bHRJZGVudGl0eVNlcnZlclVybCksXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHN1YiA9PiA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX29uVXNlRGVmYXVsdElkZW50aXR5U2VydmVyQ2xpY2t9PntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiBzdWIgPT4gPGEgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9vbk1hbmFnZVNldHRpbmdzQ2xpY2t9PntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApfTwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BZGRyZXNzUGlja2VyRGlhbG9nX2lkZW50aXR5U2VydmVyXCI+e190KFxuICAgICAgICAgICAgICAgICAgICBcIlVzZSBhbiBpZGVudGl0eSBzZXJ2ZXIgdG8gaW52aXRlIGJ5IGVtYWlsLiBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiTWFuYWdlIGluIDxzZXR0aW5ncz5TZXR0aW5nczwvc2V0dGluZ3M+LlwiLFxuICAgICAgICAgICAgICAgICAgICB7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3M6IHN1YiA9PiA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX29uTWFuYWdlU2V0dGluZ3NDbGlja30+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICl9PC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuXG4gICAgICAgIGxldCBzcGlubmVyID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYnVzeSkge1xuICAgICAgICAgICAgc3Bpbm5lciA9IDxTcGlubmVyIHc9ezIwfSBoPXsyMH0gLz47XG4gICAgICAgIH1cblxuXG4gICAgICAgIGxldCB0aXRsZTtcbiAgICAgICAgbGV0IGhlbHBUZXh0O1xuICAgICAgICBsZXQgYnV0dG9uVGV4dDtcbiAgICAgICAgbGV0IGdvQnV0dG9uRm47XG5cbiAgICAgICAgY29uc3QgdXNlcklkID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZCgpO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5raW5kID09PSBLSU5EX0RNKSB7XG4gICAgICAgICAgICB0aXRsZSA9IF90KFwiRGlyZWN0IE1lc3NhZ2VzXCIpO1xuICAgICAgICAgICAgaGVscFRleHQgPSBfdChcbiAgICAgICAgICAgICAgICBcIlN0YXJ0IGEgY29udmVyc2F0aW9uIHdpdGggc29tZW9uZSB1c2luZyB0aGVpciBuYW1lLCB1c2VybmFtZSAobGlrZSA8dXNlcklkLz4pIG9yIGVtYWlsIGFkZHJlc3MuXCIsXG4gICAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgICAge3VzZXJJZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGEgaHJlZj17bWFrZVVzZXJQZXJtYWxpbmsodXNlcklkKX0gcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPnt1c2VySWR9PC9hPjtcbiAgICAgICAgICAgICAgICB9fSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBidXR0b25UZXh0ID0gX3QoXCJHb1wiKTtcbiAgICAgICAgICAgIGdvQnV0dG9uRm4gPSB0aGlzLl9zdGFydERtO1xuICAgICAgICB9IGVsc2UgeyAvLyBLSU5EX0lOVklURVxuICAgICAgICAgICAgdGl0bGUgPSBfdChcIkludml0ZSB0byB0aGlzIHJvb21cIik7XG4gICAgICAgICAgICBoZWxwVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiSW52aXRlIHNvbWVvbmUgdXNpbmcgdGhlaXIgbmFtZSwgdXNlcm5hbWUgKGxpa2UgPHVzZXJJZC8+KSwgZW1haWwgYWRkcmVzcyBvciA8YT5zaGFyZSB0aGlzIHJvb208L2E+LlwiLFxuICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcklkOiAoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj17bWFrZVVzZXJQZXJtYWxpbmsodXNlcklkKX0gcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPnt1c2VySWR9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgYTogKHN1YikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e21ha2VSb29tUGVybWFsaW5rKHRoaXMucHJvcHMucm9vbUlkKX0gcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJ1dHRvblRleHQgPSBfdChcIkludml0ZVwiKTtcbiAgICAgICAgICAgIGdvQnV0dG9uRm4gPSB0aGlzLl9pbnZpdGVVc2VycztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc1NlbGVjdGlvbiA9IHRoaXMuc3RhdGUudGFyZ2V0cy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCAodGhpcy5zdGF0ZS5maWx0ZXJUZXh0ICYmIHRoaXMuc3RhdGUuZmlsdGVyVGV4dC5pbmNsdWRlcygnQCcpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2cnXG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXt0cnVlfVxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGl0bGV9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfaGVscFRleHQnPntoZWxwVGV4dH08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfYWRkcmVzc0Jhcic+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVyRWRpdG9yKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfSW52aXRlRGlhbG9nX2J1dHRvbkFuZFNwaW5uZXInPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17Z29CdXR0b25Gbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPSdteF9JbnZpdGVEaWFsb2dfZ29CdXR0b24nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0aGlzLnN0YXRlLmJ1c3kgfHwgIWhhc1NlbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtidXR0b25UZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3Bpbm5lcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlcklkZW50aXR5U2VydmVyV2FybmluZygpfVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZXJyb3InPnt0aGlzLnN0YXRlLmVycm9yVGV4dH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0ludml0ZURpYWxvZ191c2VyU2VjdGlvbnMnPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclNlY3Rpb24oJ3JlY2VudHMnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJTZWN0aW9uKCdzdWdnZXN0aW9ucycpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=