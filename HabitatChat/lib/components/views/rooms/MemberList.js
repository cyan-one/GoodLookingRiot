"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _AutoHideScrollbar = _interopRequireDefault(require("../../structures/AutoHideScrollbar"));

var _RoomInvite = require("../../../RoomInvite");

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _CallHandler = _interopRequireDefault(require("../../../CallHandler"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
const INITIAL_LOAD_NUM_MEMBERS = 30;
const INITIAL_LOAD_NUM_INVITED = 5;
const SHOW_MORE_INCREMENT = 100; // Regex applied to filter our punctuation in member names before applying sort, to fuzzy it a little
// matches all ASCII punctuation: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~

const SORT_REGEX = /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]+/g;

var _default = (0, _createReactClass.default)({
  displayName: 'MemberList',
  getInitialState: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli.hasLazyLoadMembersEnabled()) {
      // show an empty list
      return this._getMembersState([]);
    } else {
      return this._getMembersState(this.roomMembers());
    }
  },
  // TODO: [REACT-WARNING] Move this to constructor
  UNSAFE_componentWillMount: function () {
    this._mounted = true;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli.hasLazyLoadMembersEnabled()) {
      this._showMembersAccordingToMembershipWithLL();

      cli.on("Room.myMembership", this.onMyMembership);
    } else {
      this._listenForMembersChanges();
    }

    cli.on("Room", this.onRoom); // invites & joining after peek

    const enablePresenceByHsUrl = _SdkConfig.default.get()["enable_presence_by_hs_url"];

    const hsUrl = _MatrixClientPeg.MatrixClientPeg.get().baseUrl;

    this._showPresence = true;

    if (enablePresenceByHsUrl && enablePresenceByHsUrl[hsUrl] !== undefined) {
      this._showPresence = enablePresenceByHsUrl[hsUrl];
    }
  },
  _listenForMembersChanges: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("RoomState.members", this.onRoomStateMember);
    cli.on("RoomMember.name", this.onRoomMemberName);
    cli.on("RoomState.events", this.onRoomStateEvent); // We listen for changes to the lastPresenceTs which is essentially
    // listening for all presence events (we display most of not all of
    // the information contained in presence events).

    cli.on("User.lastPresenceTs", this.onUserPresenceChange);
    cli.on("User.presence", this.onUserPresenceChange);
    cli.on("User.currentlyActive", this.onUserPresenceChange); // cli.on("Room.timeline", this.onRoomTimeline);
  },
  componentWillUnmount: function () {
    this._mounted = false;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener("RoomState.members", this.onRoomStateMember);
      cli.removeListener("RoomMember.name", this.onRoomMemberName);
      cli.removeListener("Room.myMembership", this.onMyMembership);
      cli.removeListener("RoomState.events", this.onRoomStateEvent);
      cli.removeListener("Room", this.onRoom);
      cli.removeListener("User.lastPresenceTs", this.onUserPresenceChange);
      cli.removeListener("User.presence", this.onUserPresenceChange);
      cli.removeListener("User.currentlyActive", this.onUserPresenceChange);
    } // cancel any pending calls to the rate_limited_funcs


    this._updateList.cancelPendingCall();
  },

  /**
   * If lazy loading is enabled, either:
   * show a spinner and load the members if the user is joined,
   * or show the members available so far if the user is invited
   */
  _showMembersAccordingToMembershipWithLL: async function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli.hasLazyLoadMembersEnabled()) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const room = cli.getRoom(this.props.roomId);
      const membership = room && room.getMyMembership();

      if (membership === "join") {
        this.setState({
          loading: true
        });

        try {
          await room.loadMembersIfNeeded();
        } catch (ex) {
          /* already logged in RoomView */
        }

        if (this._mounted) {
          this.setState(this._getMembersState(this.roomMembers()));

          this._listenForMembersChanges();
        }
      } else if (membership === "invite") {
        // show the members we've got when invited
        this.setState(this._getMembersState(this.roomMembers()));
      }
    }
  },
  _getMembersState: function (members) {
    // set the state after determining _showPresence to make sure it's
    // taken into account while rerendering
    return {
      loading: false,
      members: members,
      filteredJoinedMembers: this._filterMembers(members, 'join'),
      filteredInvitedMembers: this._filterMembers(members, 'invite'),
      // ideally we'd size this to the page height, but
      // in practice I find that a little constraining
      truncateAtJoined: INITIAL_LOAD_NUM_MEMBERS,
      truncateAtInvited: INITIAL_LOAD_NUM_INVITED,
      searchQuery: ""
    };
  },

  onUserPresenceChange(event, user) {
    // Attach a SINGLE listener for global presence changes then locate the
    // member tile and re-render it. This is more efficient than every tile
    // ever attaching their own listener.
    const tile = this.refs[user.userId]; // console.log(`Got presence update for ${user.userId}. hasTile=${!!tile}`);

    if (tile) {
      this._updateList(); // reorder the membership list

    }
  },

  onRoom: function (room) {
    if (room.roomId !== this.props.roomId) {
      return;
    } // We listen for room events because when we accept an invite
    // we need to wait till the room is fully populated with state
    // before refreshing the member list else we get a stale list.


    this._showMembersAccordingToMembershipWithLL();
  },
  onMyMembership: function (room, membership, oldMembership) {
    if (room.roomId === this.props.roomId && membership === "join") {
      this._showMembersAccordingToMembershipWithLL();
    }
  },
  onRoomStateMember: function (ev, state, member) {
    if (member.roomId !== this.props.roomId) {
      return;
    }

    this._updateList();
  },
  onRoomMemberName: function (ev, member) {
    if (member.roomId !== this.props.roomId) {
      return;
    }

    this._updateList();
  },
  onRoomStateEvent: function (event, state) {
    if (event.getRoomId() === this.props.roomId && event.getType() === "m.room.third_party_invite") {
      this._updateList();
    }
  },
  _updateList: (0, _ratelimitedfunc.default)(function () {
    this._updateListNow();
  }, 500),
  _updateListNow: function () {
    // console.log("Updating memberlist");
    const newState = {
      loading: false,
      members: this.roomMembers()
    };
    newState.filteredJoinedMembers = this._filterMembers(newState.members, 'join', this.state.searchQuery);
    newState.filteredInvitedMembers = this._filterMembers(newState.members, 'invite', this.state.searchQuery);
    this.setState(newState);
  },
  getMembersWithUser: function () {
    if (!this.props.roomId) return [];

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const room = cli.getRoom(this.props.roomId);
    if (!room) return [];
    const allMembers = Object.values(room.currentState.members);
    allMembers.forEach(function (member) {
      // work around a race where you might have a room member object
      // before the user object exists.  This may or may not cause
      // https://github.com/vector-im/vector-web/issues/186
      if (member.user === null) {
        member.user = cli.getUser(member.userId);
      } // XXX: this user may have no lastPresenceTs value!
      // the right solution here is to fix the race rather than leave it as 0

    });
    return allMembers;
  },
  roomMembers: function () {
    const ConferenceHandler = _CallHandler.default.getConferenceHandler();

    const allMembers = this.getMembersWithUser();
    const filteredAndSortedMembers = allMembers.filter(m => {
      return (m.membership === 'join' || m.membership === 'invite') && (!ConferenceHandler || ConferenceHandler && !ConferenceHandler.isConferenceUser(m.userId));
    });
    filteredAndSortedMembers.sort(this.memberSort);
    return filteredAndSortedMembers;
  },
  _createOverflowTileJoined: function (overflowCount, totalCount) {
    return this._createOverflowTile(overflowCount, totalCount, this._showMoreJoinedMemberList);
  },
  _createOverflowTileInvited: function (overflowCount, totalCount) {
    return this._createOverflowTile(overflowCount, totalCount, this._showMoreInvitedMemberList);
  },
  _createOverflowTile: function (overflowCount, totalCount, onClick) {
    // For now we'll pretend this is any entity. It should probably be a separate tile.
    const EntityTile = sdk.getComponent("rooms.EntityTile");
    const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");
    const text = (0, _languageHandler._t)("and %(count)s others...", {
      count: overflowCount
    });
    return /*#__PURE__*/_react.default.createElement(EntityTile, {
      className: "mx_EntityTile_ellipsis",
      avatarJsx: /*#__PURE__*/_react.default.createElement(BaseAvatar, {
        url: require("../../../../res/img/ellipsis.svg"),
        name: "...",
        width: 36,
        height: 36
      }),
      name: text,
      presenceState: "online",
      suppressOnHover: true,
      onClick: onClick
    });
  },
  _showMoreJoinedMemberList: function () {
    this.setState({
      truncateAtJoined: this.state.truncateAtJoined + SHOW_MORE_INCREMENT
    });
  },
  _showMoreInvitedMemberList: function () {
    this.setState({
      truncateAtInvited: this.state.truncateAtInvited + SHOW_MORE_INCREMENT
    });
  },
  memberString: function (member) {
    if (!member) {
      return "(null)";
    } else {
      const u = member.user;
      return "(" + member.name + ", " + member.powerLevel + ", " + (u ? u.lastActiveAgo : "<null>") + ", " + (u ? u.getLastActiveTs() : "<null>") + ", " + (u ? u.currentlyActive : "<null>") + ", " + (u ? u.presence : "<null>") + ")";
    }
  },
  // returns negative if a comes before b,
  // returns 0 if a and b are equivalent in ordering
  // returns positive if a comes after b.
  memberSort: function (memberA, memberB) {
    // order by presence, with "active now" first.
    // ...and then by power level
    // ...and then by last active
    // ...and then alphabetically.
    // We could tiebreak instead by "last recently spoken in this room" if we wanted to.
    // console.log(`Comparing userA=${this.memberString(memberA)} userB=${this.memberString(memberB)}`);
    const userA = memberA.user;
    const userB = memberB.user; // if (!userA) console.log("!! MISSING USER FOR A-SIDE: " + memberA.name + " !!");
    // if (!userB) console.log("!! MISSING USER FOR B-SIDE: " + memberB.name + " !!");

    if (!userA && !userB) return 0;
    if (userA && !userB) return -1;
    if (!userA && userB) return 1; // First by presence

    if (this._showPresence) {
      const convertPresence = p => p === 'unavailable' ? 'online' : p;

      const presenceIndex = p => {
        const order = ['active', 'online', 'offline'];
        const idx = order.indexOf(convertPresence(p));
        return idx === -1 ? order.length : idx; // unknown states at the end
      };

      const idxA = presenceIndex(userA.currentlyActive ? 'active' : userA.presence);
      const idxB = presenceIndex(userB.currentlyActive ? 'active' : userB.presence); // console.log(`userA_presenceGroup=${idxA} userB_presenceGroup=${idxB}`);

      if (idxA !== idxB) {
        // console.log("Comparing on presence group - returning");
        return idxA - idxB;
      }
    } // Second by power level


    if (memberA.powerLevel !== memberB.powerLevel) {
      // console.log("Comparing on power level - returning");
      return memberB.powerLevel - memberA.powerLevel;
    } // Third by last active


    if (this._showPresence && userA.getLastActiveTs() !== userB.getLastActiveTs()) {
      // console.log("Comparing on last active timestamp - returning");
      return userB.getLastActiveTs() - userA.getLastActiveTs();
    } // Fourth by name (alphabetical)


    const nameA = (memberA.name[0] === '@' ? memberA.name.substr(1) : memberA.name).replace(SORT_REGEX, "");
    const nameB = (memberB.name[0] === '@' ? memberB.name.substr(1) : memberB.name).replace(SORT_REGEX, ""); // console.log(`Comparing userA_name=${nameA} against userB_name=${nameB} - returning`);

    return nameA.localeCompare(nameB, {
      ignorePunctuation: true,
      sensitivity: "base"
    });
  },
  onSearchQueryChanged: function (searchQuery) {
    this.setState({
      searchQuery,
      filteredJoinedMembers: this._filterMembers(this.state.members, 'join', searchQuery),
      filteredInvitedMembers: this._filterMembers(this.state.members, 'invite', searchQuery)
    });
  },
  _onPending3pidInviteClick: function (inviteEvent) {
    _dispatcher.default.dispatch({
      action: 'view_3pid_invite',
      event: inviteEvent
    });
  },
  _filterMembers: function (members, membership, query) {
    return members.filter(m => {
      if (query) {
        query = query.toLowerCase();
        const matchesName = m.name.toLowerCase().indexOf(query) !== -1;
        const matchesId = m.userId.toLowerCase().indexOf(query) !== -1;

        if (!matchesName && !matchesId) {
          return false;
        }
      }

      return m.membership === membership;
    });
  },
  _getPending3PidInvites: function () {
    // include 3pid invites (m.room.third_party_invite) state events.
    // The HS may have already converted these into m.room.member invites so
    // we shouldn't add them if the 3pid invite state key (token) is in the
    // member invite (content.third_party_invite.signed.token)
    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.roomId);

    if (room) {
      return room.currentState.getStateEvents("m.room.third_party_invite").filter(function (e) {
        if (!(0, _RoomInvite.isValid3pidInvite)(e)) return false; // discard all invites which have a m.room.member event since we've
        // already added them.

        const memberEvent = room.currentState.getInviteForThreePidToken(e.getStateKey());
        if (memberEvent) return false;
        return true;
      });
    }
  },
  _makeMemberTiles: function (members) {
    const MemberTile = sdk.getComponent("rooms.MemberTile");
    const EntityTile = sdk.getComponent("rooms.EntityTile");
    return members.map(m => {
      if (m.userId) {
        // Is a Matrix invite
        return /*#__PURE__*/_react.default.createElement(MemberTile, {
          key: m.userId,
          member: m,
          ref: m.userId,
          showPresence: this._showPresence
        });
      } else {
        // Is a 3pid invite
        return /*#__PURE__*/_react.default.createElement(EntityTile, {
          key: m.getStateKey(),
          name: m.getContent().display_name,
          suppressOnHover: true,
          onClick: () => this._onPending3pidInviteClick(m)
        });
      }
    });
  },
  _getChildrenJoined: function (start, end) {
    return this._makeMemberTiles(this.state.filteredJoinedMembers.slice(start, end));
  },
  _getChildCountJoined: function () {
    return this.state.filteredJoinedMembers.length;
  },
  _getChildrenInvited: function (start, end) {
    let targets = this.state.filteredInvitedMembers;

    if (end > this.state.filteredInvitedMembers.length) {
      targets = targets.concat(this._getPending3PidInvites());
    }

    return this._makeMemberTiles(targets.slice(start, end));
  },
  _getChildCountInvited: function () {
    return this.state.filteredInvitedMembers.length + (this._getPending3PidInvites() || []).length;
  },
  render: function () {
    if (this.state.loading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberList"
      }, /*#__PURE__*/_react.default.createElement(Spinner, null));
    }

    const SearchBox = sdk.getComponent('structures.SearchBox');
    const TruncatedList = sdk.getComponent("elements.TruncatedList");

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const room = cli.getRoom(this.props.roomId);
    let inviteButton;

    if (room && room.getMyMembership() === 'join') {
      // assume we can invite until proven false
      let canInvite = true;
      const plEvent = room.currentState.getStateEvents("m.room.power_levels", "");
      const me = room.getMember(cli.getUserId());

      if (plEvent && me) {
        const content = plEvent.getContent();

        if (content && content.invite > me.powerLevel) {
          canInvite = false;
        }
      }

      const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
      inviteButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "mx_MemberList_invite",
        onClick: this.onInviteButtonClick,
        disabled: !canInvite
      }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)('Invite to this room')));
    }

    let invitedHeader;
    let invitedSection;

    if (this._getChildCountInvited() > 0) {
      invitedHeader = /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("Invited"));
      invitedSection = /*#__PURE__*/_react.default.createElement(TruncatedList, {
        className: "mx_MemberList_section mx_MemberList_invited",
        truncateAt: this.state.truncateAtInvited,
        createOverflowElement: this._createOverflowTileInvited,
        getChildren: this._getChildrenInvited,
        getChildCount: this._getChildCountInvited
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberList",
      role: "tabpanel"
    }, inviteButton, /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberList_wrapper"
    }, /*#__PURE__*/_react.default.createElement(TruncatedList, {
      className: "mx_MemberList_section mx_MemberList_joined",
      truncateAt: this.state.truncateAtJoined,
      createOverflowElement: this._createOverflowTileJoined,
      getChildren: this._getChildrenJoined,
      getChildCount: this._getChildCountJoined
    }), invitedHeader, invitedSection)), /*#__PURE__*/_react.default.createElement(SearchBox, {
      className: "mx_MemberList_query mx_textinput_icon mx_textinput_search",
      placeholder: (0, _languageHandler._t)('Filter room members'),
      onSearch: this.onSearchQueryChanged
    }));
  },
  onInviteButtonClick: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
      _dispatcher.default.dispatch({
        action: 'require_registration'
      });

      return;
    } // call AddressPickerDialog


    _dispatcher.default.dispatch({
      action: 'view_invite',
      roomId: this.props.roomId
    });
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL01lbWJlckxpc3QuanMiXSwibmFtZXMiOlsiSU5JVElBTF9MT0FEX05VTV9NRU1CRVJTIiwiSU5JVElBTF9MT0FEX05VTV9JTlZJVEVEIiwiU0hPV19NT1JFX0lOQ1JFTUVOVCIsIlNPUlRfUkVHRVgiLCJkaXNwbGF5TmFtZSIsImdldEluaXRpYWxTdGF0ZSIsImNsaSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImhhc0xhenlMb2FkTWVtYmVyc0VuYWJsZWQiLCJfZ2V0TWVtYmVyc1N0YXRlIiwicm9vbU1lbWJlcnMiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiX21vdW50ZWQiLCJfc2hvd01lbWJlcnNBY2NvcmRpbmdUb01lbWJlcnNoaXBXaXRoTEwiLCJvbiIsIm9uTXlNZW1iZXJzaGlwIiwiX2xpc3RlbkZvck1lbWJlcnNDaGFuZ2VzIiwib25Sb29tIiwiZW5hYmxlUHJlc2VuY2VCeUhzVXJsIiwiU2RrQ29uZmlnIiwiaHNVcmwiLCJiYXNlVXJsIiwiX3Nob3dQcmVzZW5jZSIsInVuZGVmaW5lZCIsIm9uUm9vbVN0YXRlTWVtYmVyIiwib25Sb29tTWVtYmVyTmFtZSIsIm9uUm9vbVN0YXRlRXZlbnQiLCJvblVzZXJQcmVzZW5jZUNoYW5nZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJfdXBkYXRlTGlzdCIsImNhbmNlbFBlbmRpbmdDYWxsIiwicm9vbSIsImdldFJvb20iLCJwcm9wcyIsInJvb21JZCIsIm1lbWJlcnNoaXAiLCJnZXRNeU1lbWJlcnNoaXAiLCJzZXRTdGF0ZSIsImxvYWRpbmciLCJsb2FkTWVtYmVyc0lmTmVlZGVkIiwiZXgiLCJtZW1iZXJzIiwiZmlsdGVyZWRKb2luZWRNZW1iZXJzIiwiX2ZpbHRlck1lbWJlcnMiLCJmaWx0ZXJlZEludml0ZWRNZW1iZXJzIiwidHJ1bmNhdGVBdEpvaW5lZCIsInRydW5jYXRlQXRJbnZpdGVkIiwic2VhcmNoUXVlcnkiLCJldmVudCIsInVzZXIiLCJ0aWxlIiwicmVmcyIsInVzZXJJZCIsIm9sZE1lbWJlcnNoaXAiLCJldiIsInN0YXRlIiwibWVtYmVyIiwiZ2V0Um9vbUlkIiwiZ2V0VHlwZSIsIl91cGRhdGVMaXN0Tm93IiwibmV3U3RhdGUiLCJnZXRNZW1iZXJzV2l0aFVzZXIiLCJhbGxNZW1iZXJzIiwiT2JqZWN0IiwidmFsdWVzIiwiY3VycmVudFN0YXRlIiwiZm9yRWFjaCIsImdldFVzZXIiLCJDb25mZXJlbmNlSGFuZGxlciIsIkNhbGxIYW5kbGVyIiwiZ2V0Q29uZmVyZW5jZUhhbmRsZXIiLCJmaWx0ZXJlZEFuZFNvcnRlZE1lbWJlcnMiLCJmaWx0ZXIiLCJtIiwiaXNDb25mZXJlbmNlVXNlciIsInNvcnQiLCJtZW1iZXJTb3J0IiwiX2NyZWF0ZU92ZXJmbG93VGlsZUpvaW5lZCIsIm92ZXJmbG93Q291bnQiLCJ0b3RhbENvdW50IiwiX2NyZWF0ZU92ZXJmbG93VGlsZSIsIl9zaG93TW9yZUpvaW5lZE1lbWJlckxpc3QiLCJfY3JlYXRlT3ZlcmZsb3dUaWxlSW52aXRlZCIsIl9zaG93TW9yZUludml0ZWRNZW1iZXJMaXN0Iiwib25DbGljayIsIkVudGl0eVRpbGUiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJCYXNlQXZhdGFyIiwidGV4dCIsImNvdW50IiwicmVxdWlyZSIsIm1lbWJlclN0cmluZyIsInUiLCJuYW1lIiwicG93ZXJMZXZlbCIsImxhc3RBY3RpdmVBZ28iLCJnZXRMYXN0QWN0aXZlVHMiLCJjdXJyZW50bHlBY3RpdmUiLCJwcmVzZW5jZSIsIm1lbWJlckEiLCJtZW1iZXJCIiwidXNlckEiLCJ1c2VyQiIsImNvbnZlcnRQcmVzZW5jZSIsInAiLCJwcmVzZW5jZUluZGV4Iiwib3JkZXIiLCJpZHgiLCJpbmRleE9mIiwibGVuZ3RoIiwiaWR4QSIsImlkeEIiLCJuYW1lQSIsInN1YnN0ciIsInJlcGxhY2UiLCJuYW1lQiIsImxvY2FsZUNvbXBhcmUiLCJpZ25vcmVQdW5jdHVhdGlvbiIsInNlbnNpdGl2aXR5Iiwib25TZWFyY2hRdWVyeUNoYW5nZWQiLCJfb25QZW5kaW5nM3BpZEludml0ZUNsaWNrIiwiaW52aXRlRXZlbnQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInF1ZXJ5IiwidG9Mb3dlckNhc2UiLCJtYXRjaGVzTmFtZSIsIm1hdGNoZXNJZCIsIl9nZXRQZW5kaW5nM1BpZEludml0ZXMiLCJnZXRTdGF0ZUV2ZW50cyIsImUiLCJtZW1iZXJFdmVudCIsImdldEludml0ZUZvclRocmVlUGlkVG9rZW4iLCJnZXRTdGF0ZUtleSIsIl9tYWtlTWVtYmVyVGlsZXMiLCJNZW1iZXJUaWxlIiwibWFwIiwiZ2V0Q29udGVudCIsImRpc3BsYXlfbmFtZSIsIl9nZXRDaGlsZHJlbkpvaW5lZCIsInN0YXJ0IiwiZW5kIiwic2xpY2UiLCJfZ2V0Q2hpbGRDb3VudEpvaW5lZCIsIl9nZXRDaGlsZHJlbkludml0ZWQiLCJ0YXJnZXRzIiwiY29uY2F0IiwiX2dldENoaWxkQ291bnRJbnZpdGVkIiwicmVuZGVyIiwiU3Bpbm5lciIsIlNlYXJjaEJveCIsIlRydW5jYXRlZExpc3QiLCJpbnZpdGVCdXR0b24iLCJjYW5JbnZpdGUiLCJwbEV2ZW50IiwibWUiLCJnZXRNZW1iZXIiLCJnZXRVc2VySWQiLCJjb250ZW50IiwiaW52aXRlIiwiQWNjZXNzaWJsZUJ1dHRvbiIsIm9uSW52aXRlQnV0dG9uQ2xpY2siLCJpbnZpdGVkSGVhZGVyIiwiaW52aXRlZFNlY3Rpb24iLCJpc0d1ZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE1QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLE1BQU1BLHdCQUF3QixHQUFHLEVBQWpDO0FBQ0EsTUFBTUMsd0JBQXdCLEdBQUcsQ0FBakM7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRyxHQUE1QixDLENBRUE7QUFDQTs7QUFDQSxNQUFN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QUdMLFFBQUEsYUFBYSxFQUFFLEtBQUtHO0FBSGYsUUFBakI7QUFLSDs7QUFFRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLGVBQWY7QUFBK0IsTUFBQSxJQUFJLEVBQUM7QUFBcEMsT0FDTUssWUFETixlQUVJLDZCQUFDLDBCQUFELHFCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSw2QkFBQyxhQUFEO0FBQWUsTUFBQSxTQUFTLEVBQUMsNENBQXpCO0FBQXNFLE1BQUEsVUFBVSxFQUFFLEtBQUtuRyxLQUFMLENBQVdWLGdCQUE3RjtBQUNJLE1BQUEscUJBQXFCLEVBQUUsS0FBS2dDLHlCQURoQztBQUVJLE1BQUEsV0FBVyxFQUFFLEtBQUtnRSxrQkFGdEI7QUFHSSxNQUFBLGFBQWEsRUFBRSxLQUFLSTtBQUh4QixNQURKLEVBS01tQixhQUxOLEVBTU1DLGNBTk4sQ0FESixDQUZKLGVBYUksNkJBQUMsU0FBRDtBQUFXLE1BQUEsU0FBUyxFQUFDLDJEQUFyQjtBQUNXLE1BQUEsV0FBVyxFQUFHLHlCQUFHLHFCQUFILENBRHpCO0FBRVcsTUFBQSxRQUFRLEVBQUcsS0FBSzdDO0FBRjNCLE1BYkosQ0FESjtBQW1CSCxHQWpkMkI7QUFtZDVCMkMsRUFBQUEsbUJBQW1CLEVBQUUsWUFBVztBQUM1QixRQUFJOUosaUNBQWdCQyxHQUFoQixHQUFzQmdLLE9BQXRCLEVBQUosRUFBcUM7QUFDakMzQywwQkFBSUMsUUFBSixDQUFhO0FBQUNDLFFBQUFBLE1BQU0sRUFBRTtBQUFULE9BQWI7O0FBQ0E7QUFDSCxLQUoyQixDQU01Qjs7O0FBQ0FGLHdCQUFJQyxRQUFKLENBQWE7QUFDVEMsTUFBQUEsTUFBTSxFQUFFLGFBREM7QUFFVDNGLE1BQUFBLE1BQU0sRUFBRSxLQUFLRCxLQUFMLENBQVdDO0FBRlYsS0FBYjtBQUlIO0FBOWQyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTggTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBTZGtDb25maWcgZnJvbSAnLi4vLi4vLi4vU2RrQ29uZmlnJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCBBdXRvSGlkZVNjcm9sbGJhciBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9BdXRvSGlkZVNjcm9sbGJhclwiO1xuaW1wb3J0IHtpc1ZhbGlkM3BpZEludml0ZX0gZnJvbSBcIi4uLy4uLy4uL1Jvb21JbnZpdGVcIjtcbmltcG9ydCByYXRlX2xpbWl0ZWRfZnVuYyBmcm9tIFwiLi4vLi4vLi4vcmF0ZWxpbWl0ZWRmdW5jXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IENhbGxIYW5kbGVyIGZyb20gXCIuLi8uLi8uLi9DYWxsSGFuZGxlclwiO1xuXG5jb25zdCBJTklUSUFMX0xPQURfTlVNX01FTUJFUlMgPSAzMDtcbmNvbnN0IElOSVRJQUxfTE9BRF9OVU1fSU5WSVRFRCA9IDU7XG5jb25zdCBTSE9XX01PUkVfSU5DUkVNRU5UID0gMTAwO1xuXG4vLyBSZWdleCBhcHBsaWVkIHRvIGZpbHRlciBvdXIgcHVuY3R1YXRpb24gaW4gbWVtYmVyIG5hbWVzIGJlZm9yZSBhcHBseWluZyBzb3J0LCB0byBmdXp6eSBpdCBhIGxpdHRsZVxuLy8gbWF0Y2hlcyBhbGwgQVNDSUkgcHVuY3R1YXRpb246ICFcIiMkJSYnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5cbmNvbnN0IFNPUlRfUkVHRVggPSAvW1xceDIxLVxceDJGXFx4M0EtXFx4NDBcXHg1Qi1cXHg2MFxceDdCLVxceDdFXSsvZztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdNZW1iZXJMaXN0JyxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaS5oYXNMYXp5TG9hZE1lbWJlcnNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIC8vIHNob3cgYW4gZW1wdHkgbGlzdFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldE1lbWJlcnNTdGF0ZShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0TWVtYmVyc1N0YXRlKHRoaXMucm9vbU1lbWJlcnMoKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpLmhhc0xhenlMb2FkTWVtYmVyc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lbWJlcnNBY2NvcmRpbmdUb01lbWJlcnNoaXBXaXRoTEwoKTtcbiAgICAgICAgICAgIGNsaS5vbihcIlJvb20ubXlNZW1iZXJzaGlwXCIsIHRoaXMub25NeU1lbWJlcnNoaXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuRm9yTWVtYmVyc0NoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBjbGkub24oXCJSb29tXCIsIHRoaXMub25Sb29tKTsgLy8gaW52aXRlcyAmIGpvaW5pbmcgYWZ0ZXIgcGVla1xuICAgICAgICBjb25zdCBlbmFibGVQcmVzZW5jZUJ5SHNVcmwgPSBTZGtDb25maWcuZ2V0KClbXCJlbmFibGVfcHJlc2VuY2VfYnlfaHNfdXJsXCJdO1xuICAgICAgICBjb25zdCBoc1VybCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5iYXNlVXJsO1xuICAgICAgICB0aGlzLl9zaG93UHJlc2VuY2UgPSB0cnVlO1xuICAgICAgICBpZiAoZW5hYmxlUHJlc2VuY2VCeUhzVXJsICYmIGVuYWJsZVByZXNlbmNlQnlIc1VybFtoc1VybF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1ByZXNlbmNlID0gZW5hYmxlUHJlc2VuY2VCeUhzVXJsW2hzVXJsXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfbGlzdGVuRm9yTWVtYmVyc0NoYW5nZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNsaS5vbihcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHRoaXMub25Sb29tU3RhdGVNZW1iZXIpO1xuICAgICAgICBjbGkub24oXCJSb29tTWVtYmVyLm5hbWVcIiwgdGhpcy5vblJvb21NZW1iZXJOYW1lKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnQpO1xuICAgICAgICAvLyBXZSBsaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGxhc3RQcmVzZW5jZVRzIHdoaWNoIGlzIGVzc2VudGlhbGx5XG4gICAgICAgIC8vIGxpc3RlbmluZyBmb3IgYWxsIHByZXNlbmNlIGV2ZW50cyAod2UgZGlzcGxheSBtb3N0IG9mIG5vdCBhbGwgb2ZcbiAgICAgICAgLy8gdGhlIGluZm9ybWF0aW9uIGNvbnRhaW5lZCBpbiBwcmVzZW5jZSBldmVudHMpLlxuICAgICAgICBjbGkub24oXCJVc2VyLmxhc3RQcmVzZW5jZVRzXCIsIHRoaXMub25Vc2VyUHJlc2VuY2VDaGFuZ2UpO1xuICAgICAgICBjbGkub24oXCJVc2VyLnByZXNlbmNlXCIsIHRoaXMub25Vc2VyUHJlc2VuY2VDaGFuZ2UpO1xuICAgICAgICBjbGkub24oXCJVc2VyLmN1cnJlbnRseUFjdGl2ZVwiLCB0aGlzLm9uVXNlclByZXNlbmNlQ2hhbmdlKTtcbiAgICAgICAgLy8gY2xpLm9uKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaSkge1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLm1lbWJlcnNcIiwgdGhpcy5vblJvb21TdGF0ZU1lbWJlcik7XG4gICAgICAgICAgICBjbGkucmVtb3ZlTGlzdGVuZXIoXCJSb29tTWVtYmVyLm5hbWVcIiwgdGhpcy5vblJvb21NZW1iZXJOYW1lKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcIlJvb20ubXlNZW1iZXJzaGlwXCIsIHRoaXMub25NeU1lbWJlcnNoaXApO1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnQpO1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVwiLCB0aGlzLm9uUm9vbSk7XG4gICAgICAgICAgICBjbGkucmVtb3ZlTGlzdGVuZXIoXCJVc2VyLmxhc3RQcmVzZW5jZVRzXCIsIHRoaXMub25Vc2VyUHJlc2VuY2VDaGFuZ2UpO1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiVXNlci5wcmVzZW5jZVwiLCB0aGlzLm9uVXNlclByZXNlbmNlQ2hhbmdlKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcIlVzZXIuY3VycmVudGx5QWN0aXZlXCIsIHRoaXMub25Vc2VyUHJlc2VuY2VDaGFuZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2FuY2VsIGFueSBwZW5kaW5nIGNhbGxzIHRvIHRoZSByYXRlX2xpbWl0ZWRfZnVuY3NcbiAgICAgICAgdGhpcy5fdXBkYXRlTGlzdC5jYW5jZWxQZW5kaW5nQ2FsbCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJZiBsYXp5IGxvYWRpbmcgaXMgZW5hYmxlZCwgZWl0aGVyOlxuICAgICAqIHNob3cgYSBzcGlubmVyIGFuZCBsb2FkIHRoZSBtZW1iZXJzIGlmIHRoZSB1c2VyIGlzIGpvaW5lZCxcbiAgICAgKiBvciBzaG93IHRoZSBtZW1iZXJzIGF2YWlsYWJsZSBzbyBmYXIgaWYgdGhlIHVzZXIgaXMgaW52aXRlZFxuICAgICAqL1xuICAgIF9zaG93TWVtYmVyc0FjY29yZGluZ1RvTWVtYmVyc2hpcFdpdGhMTDogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaS5oYXNMYXp5TG9hZE1lbWJlcnNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb20gPSBjbGkuZ2V0Um9vbSh0aGlzLnByb3BzLnJvb21JZCk7XG4gICAgICAgICAgICBjb25zdCBtZW1iZXJzaGlwID0gcm9vbSAmJiByb29tLmdldE15TWVtYmVyc2hpcCgpO1xuICAgICAgICAgICAgaWYgKG1lbWJlcnNoaXAgPT09IFwiam9pblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bG9hZGluZzogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJvb20ubG9hZE1lbWJlcnNJZk5lZWRlZCgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7LyogYWxyZWFkeSBsb2dnZWQgaW4gUm9vbVZpZXcgKi99XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLl9nZXRNZW1iZXJzU3RhdGUodGhpcy5yb29tTWVtYmVycygpKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xpc3RlbkZvck1lbWJlcnNDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZW1iZXJzaGlwID09PSBcImludml0ZVwiKSB7XG4gICAgICAgICAgICAgICAgLy8gc2hvdyB0aGUgbWVtYmVycyB3ZSd2ZSBnb3Qgd2hlbiBpbnZpdGVkXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLl9nZXRNZW1iZXJzU3RhdGUodGhpcy5yb29tTWVtYmVycygpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldE1lbWJlcnNTdGF0ZTogZnVuY3Rpb24obWVtYmVycykge1xuICAgICAgICAvLyBzZXQgdGhlIHN0YXRlIGFmdGVyIGRldGVybWluaW5nIF9zaG93UHJlc2VuY2UgdG8gbWFrZSBzdXJlIGl0J3NcbiAgICAgICAgLy8gdGFrZW4gaW50byBhY2NvdW50IHdoaWxlIHJlcmVuZGVyaW5nXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIG1lbWJlcnM6IG1lbWJlcnMsXG4gICAgICAgICAgICBmaWx0ZXJlZEpvaW5lZE1lbWJlcnM6IHRoaXMuX2ZpbHRlck1lbWJlcnMobWVtYmVycywgJ2pvaW4nKSxcbiAgICAgICAgICAgIGZpbHRlcmVkSW52aXRlZE1lbWJlcnM6IHRoaXMuX2ZpbHRlck1lbWJlcnMobWVtYmVycywgJ2ludml0ZScpLFxuXG4gICAgICAgICAgICAvLyBpZGVhbGx5IHdlJ2Qgc2l6ZSB0aGlzIHRvIHRoZSBwYWdlIGhlaWdodCwgYnV0XG4gICAgICAgICAgICAvLyBpbiBwcmFjdGljZSBJIGZpbmQgdGhhdCBhIGxpdHRsZSBjb25zdHJhaW5pbmdcbiAgICAgICAgICAgIHRydW5jYXRlQXRKb2luZWQ6IElOSVRJQUxfTE9BRF9OVU1fTUVNQkVSUyxcbiAgICAgICAgICAgIHRydW5jYXRlQXRJbnZpdGVkOiBJTklUSUFMX0xPQURfTlVNX0lOVklURUQsXG4gICAgICAgICAgICBzZWFyY2hRdWVyeTogXCJcIixcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25Vc2VyUHJlc2VuY2VDaGFuZ2UoZXZlbnQsIHVzZXIpIHtcbiAgICAgICAgLy8gQXR0YWNoIGEgU0lOR0xFIGxpc3RlbmVyIGZvciBnbG9iYWwgcHJlc2VuY2UgY2hhbmdlcyB0aGVuIGxvY2F0ZSB0aGVcbiAgICAgICAgLy8gbWVtYmVyIHRpbGUgYW5kIHJlLXJlbmRlciBpdC4gVGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGV2ZXJ5IHRpbGVcbiAgICAgICAgLy8gZXZlciBhdHRhY2hpbmcgdGhlaXIgb3duIGxpc3RlbmVyLlxuICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5yZWZzW3VzZXIudXNlcklkXTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEdvdCBwcmVzZW5jZSB1cGRhdGUgZm9yICR7dXNlci51c2VySWR9LiBoYXNUaWxlPSR7ISF0aWxlfWApO1xuICAgICAgICBpZiAodGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGlzdCgpOyAvLyByZW9yZGVyIHRoZSBtZW1iZXJzaGlwIGxpc3RcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb206IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgaWYgKHJvb20ucm9vbUlkICE9PSB0aGlzLnByb3BzLnJvb21JZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGxpc3RlbiBmb3Igcm9vbSBldmVudHMgYmVjYXVzZSB3aGVuIHdlIGFjY2VwdCBhbiBpbnZpdGVcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3YWl0IHRpbGwgdGhlIHJvb20gaXMgZnVsbHkgcG9wdWxhdGVkIHdpdGggc3RhdGVcbiAgICAgICAgLy8gYmVmb3JlIHJlZnJlc2hpbmcgdGhlIG1lbWJlciBsaXN0IGVsc2Ugd2UgZ2V0IGEgc3RhbGUgbGlzdC5cbiAgICAgICAgdGhpcy5fc2hvd01lbWJlcnNBY2NvcmRpbmdUb01lbWJlcnNoaXBXaXRoTEwoKTtcbiAgICB9LFxuXG4gICAgb25NeU1lbWJlcnNoaXA6IGZ1bmN0aW9uKHJvb20sIG1lbWJlcnNoaXAsIG9sZE1lbWJlcnNoaXApIHtcbiAgICAgICAgaWYgKHJvb20ucm9vbUlkID09PSB0aGlzLnByb3BzLnJvb21JZCAmJiBtZW1iZXJzaGlwID09PSBcImpvaW5cIikge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lbWJlcnNBY2NvcmRpbmdUb01lbWJlcnNoaXBXaXRoTEwoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb21TdGF0ZU1lbWJlcjogZnVuY3Rpb24oZXYsIHN0YXRlLCBtZW1iZXIpIHtcbiAgICAgICAgaWYgKG1lbWJlci5yb29tSWQgIT09IHRoaXMucHJvcHMucm9vbUlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdXBkYXRlTGlzdCgpO1xuICAgIH0sXG5cbiAgICBvblJvb21NZW1iZXJOYW1lOiBmdW5jdGlvbihldiwgbWVtYmVyKSB7XG4gICAgICAgIGlmIChtZW1iZXIucm9vbUlkICE9PSB0aGlzLnByb3BzLnJvb21JZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZUxpc3QoKTtcbiAgICB9LFxuXG4gICAgb25Sb29tU3RhdGVFdmVudDogZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICAgIGlmIChldmVudC5nZXRSb29tSWQoKSA9PT0gdGhpcy5wcm9wcy5yb29tSWQgJiZcbiAgICAgICAgICAgIGV2ZW50LmdldFR5cGUoKSA9PT0gXCJtLnJvb20udGhpcmRfcGFydHlfaW52aXRlXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUxpc3QoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlTGlzdDogcmF0ZV9saW1pdGVkX2Z1bmMoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUxpc3ROb3coKTtcbiAgICB9LCA1MDApLFxuXG4gICAgX3VwZGF0ZUxpc3ROb3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlVwZGF0aW5nIG1lbWJlcmxpc3RcIik7XG4gICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xuICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBtZW1iZXJzOiB0aGlzLnJvb21NZW1iZXJzKCksXG4gICAgICAgIH07XG4gICAgICAgIG5ld1N0YXRlLmZpbHRlcmVkSm9pbmVkTWVtYmVycyA9IHRoaXMuX2ZpbHRlck1lbWJlcnMobmV3U3RhdGUubWVtYmVycywgJ2pvaW4nLCB0aGlzLnN0YXRlLnNlYXJjaFF1ZXJ5KTtcbiAgICAgICAgbmV3U3RhdGUuZmlsdGVyZWRJbnZpdGVkTWVtYmVycyA9IHRoaXMuX2ZpbHRlck1lbWJlcnMobmV3U3RhdGUubWVtYmVycywgJ2ludml0ZScsIHRoaXMuc3RhdGUuc2VhcmNoUXVlcnkpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcbiAgICB9LFxuXG4gICAgZ2V0TWVtYmVyc1dpdGhVc2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLnJvb21JZCkgcmV0dXJuIFtdO1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHJvb20gPSBjbGkuZ2V0Um9vbSh0aGlzLnByb3BzLnJvb21JZCk7XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuIFtdO1xuXG4gICAgICAgIGNvbnN0IGFsbE1lbWJlcnMgPSBPYmplY3QudmFsdWVzKHJvb20uY3VycmVudFN0YXRlLm1lbWJlcnMpO1xuXG4gICAgICAgIGFsbE1lbWJlcnMuZm9yRWFjaChmdW5jdGlvbihtZW1iZXIpIHtcbiAgICAgICAgICAgIC8vIHdvcmsgYXJvdW5kIGEgcmFjZSB3aGVyZSB5b3UgbWlnaHQgaGF2ZSBhIHJvb20gbWVtYmVyIG9iamVjdFxuICAgICAgICAgICAgLy8gYmVmb3JlIHRoZSB1c2VyIG9iamVjdCBleGlzdHMuICBUaGlzIG1heSBvciBtYXkgbm90IGNhdXNlXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3ZlY3Rvci13ZWIvaXNzdWVzLzE4NlxuICAgICAgICAgICAgaWYgKG1lbWJlci51c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWVtYmVyLnVzZXIgPSBjbGkuZ2V0VXNlcihtZW1iZXIudXNlcklkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gWFhYOiB0aGlzIHVzZXIgbWF5IGhhdmUgbm8gbGFzdFByZXNlbmNlVHMgdmFsdWUhXG4gICAgICAgICAgICAvLyB0aGUgcmlnaHQgc29sdXRpb24gaGVyZSBpcyB0byBmaXggdGhlIHJhY2UgcmF0aGVyIHRoYW4gbGVhdmUgaXQgYXMgMFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYWxsTWVtYmVycztcbiAgICB9LFxuXG4gICAgcm9vbU1lbWJlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBDb25mZXJlbmNlSGFuZGxlciA9IENhbGxIYW5kbGVyLmdldENvbmZlcmVuY2VIYW5kbGVyKCk7XG5cbiAgICAgICAgY29uc3QgYWxsTWVtYmVycyA9IHRoaXMuZ2V0TWVtYmVyc1dpdGhVc2VyKCk7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkQW5kU29ydGVkTWVtYmVycyA9IGFsbE1lbWJlcnMuZmlsdGVyKChtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIG0ubWVtYmVyc2hpcCA9PT0gJ2pvaW4nIHx8IG0ubWVtYmVyc2hpcCA9PT0gJ2ludml0ZSdcbiAgICAgICAgICAgICkgJiYgKFxuICAgICAgICAgICAgICAgICFDb25mZXJlbmNlSGFuZGxlciB8fFxuICAgICAgICAgICAgICAgIChDb25mZXJlbmNlSGFuZGxlciAmJiAhQ29uZmVyZW5jZUhhbmRsZXIuaXNDb25mZXJlbmNlVXNlcihtLnVzZXJJZCkpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgZmlsdGVyZWRBbmRTb3J0ZWRNZW1iZXJzLnNvcnQodGhpcy5tZW1iZXJTb3J0KTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkQW5kU29ydGVkTWVtYmVycztcbiAgICB9LFxuXG4gICAgX2NyZWF0ZU92ZXJmbG93VGlsZUpvaW5lZDogZnVuY3Rpb24ob3ZlcmZsb3dDb3VudCwgdG90YWxDb3VudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlT3ZlcmZsb3dUaWxlKG92ZXJmbG93Q291bnQsIHRvdGFsQ291bnQsIHRoaXMuX3Nob3dNb3JlSm9pbmVkTWVtYmVyTGlzdCk7XG4gICAgfSxcblxuICAgIF9jcmVhdGVPdmVyZmxvd1RpbGVJbnZpdGVkOiBmdW5jdGlvbihvdmVyZmxvd0NvdW50LCB0b3RhbENvdW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVPdmVyZmxvd1RpbGUob3ZlcmZsb3dDb3VudCwgdG90YWxDb3VudCwgdGhpcy5fc2hvd01vcmVJbnZpdGVkTWVtYmVyTGlzdCk7XG4gICAgfSxcblxuICAgIF9jcmVhdGVPdmVyZmxvd1RpbGU6IGZ1bmN0aW9uKG92ZXJmbG93Q291bnQsIHRvdGFsQ291bnQsIG9uQ2xpY2spIHtcbiAgICAgICAgLy8gRm9yIG5vdyB3ZSdsbCBwcmV0ZW5kIHRoaXMgaXMgYW55IGVudGl0eS4gSXQgc2hvdWxkIHByb2JhYmx5IGJlIGEgc2VwYXJhdGUgdGlsZS5cbiAgICAgICAgY29uc3QgRW50aXR5VGlsZSA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5FbnRpdHlUaWxlXCIpO1xuICAgICAgICBjb25zdCBCYXNlQXZhdGFyID0gc2RrLmdldENvbXBvbmVudChcImF2YXRhcnMuQmFzZUF2YXRhclwiKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IF90KFwiYW5kICUoY291bnQpcyBvdGhlcnMuLi5cIiwgeyBjb3VudDogb3ZlcmZsb3dDb3VudCB9KTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxFbnRpdHlUaWxlIGNsYXNzTmFtZT1cIm14X0VudGl0eVRpbGVfZWxsaXBzaXNcIiBhdmF0YXJKc3g9e1xuICAgICAgICAgICAgICAgIDxCYXNlQXZhdGFyIHVybD17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvZWxsaXBzaXMuc3ZnXCIpfSBuYW1lPVwiLi4uXCIgd2lkdGg9ezM2fSBoZWlnaHQ9ezM2fSAvPlxuICAgICAgICAgICAgfSBuYW1lPXt0ZXh0fSBwcmVzZW5jZVN0YXRlPVwib25saW5lXCIgc3VwcHJlc3NPbkhvdmVyPXt0cnVlfVxuICAgICAgICAgICAgb25DbGljaz17b25DbGlja30gLz5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX3Nob3dNb3JlSm9pbmVkTWVtYmVyTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdHJ1bmNhdGVBdEpvaW5lZDogdGhpcy5zdGF0ZS50cnVuY2F0ZUF0Sm9pbmVkICsgU0hPV19NT1JFX0lOQ1JFTUVOVCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9zaG93TW9yZUludml0ZWRNZW1iZXJMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB0cnVuY2F0ZUF0SW52aXRlZDogdGhpcy5zdGF0ZS50cnVuY2F0ZUF0SW52aXRlZCArIFNIT1dfTU9SRV9JTkNSRU1FTlQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBtZW1iZXJTdHJpbmc6IGZ1bmN0aW9uKG1lbWJlcikge1xuICAgICAgICBpZiAoIW1lbWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIFwiKG51bGwpXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB1ID0gbWVtYmVyLnVzZXI7XG4gICAgICAgICAgICByZXR1cm4gXCIoXCIgKyBtZW1iZXIubmFtZSArIFwiLCBcIiArIG1lbWJlci5wb3dlckxldmVsICsgXCIsIFwiICsgKHUgPyB1Lmxhc3RBY3RpdmVBZ28gOiBcIjxudWxsPlwiKSArIFwiLCBcIiArICh1ID8gdS5nZXRMYXN0QWN0aXZlVHMoKSA6IFwiPG51bGw+XCIpICsgXCIsIFwiICsgKHUgPyB1LmN1cnJlbnRseUFjdGl2ZSA6IFwiPG51bGw+XCIpICsgXCIsIFwiICsgKHUgPyB1LnByZXNlbmNlIDogXCI8bnVsbD5cIikgKyBcIilcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyByZXR1cm5zIG5lZ2F0aXZlIGlmIGEgY29tZXMgYmVmb3JlIGIsXG4gICAgLy8gcmV0dXJucyAwIGlmIGEgYW5kIGIgYXJlIGVxdWl2YWxlbnQgaW4gb3JkZXJpbmdcbiAgICAvLyByZXR1cm5zIHBvc2l0aXZlIGlmIGEgY29tZXMgYWZ0ZXIgYi5cbiAgICBtZW1iZXJTb3J0OiBmdW5jdGlvbihtZW1iZXJBLCBtZW1iZXJCKSB7XG4gICAgICAgIC8vIG9yZGVyIGJ5IHByZXNlbmNlLCB3aXRoIFwiYWN0aXZlIG5vd1wiIGZpcnN0LlxuICAgICAgICAvLyAuLi5hbmQgdGhlbiBieSBwb3dlciBsZXZlbFxuICAgICAgICAvLyAuLi5hbmQgdGhlbiBieSBsYXN0IGFjdGl2ZVxuICAgICAgICAvLyAuLi5hbmQgdGhlbiBhbHBoYWJldGljYWxseS5cbiAgICAgICAgLy8gV2UgY291bGQgdGllYnJlYWsgaW5zdGVhZCBieSBcImxhc3QgcmVjZW50bHkgc3Bva2VuIGluIHRoaXMgcm9vbVwiIGlmIHdlIHdhbnRlZCB0by5cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ29tcGFyaW5nIHVzZXJBPSR7dGhpcy5tZW1iZXJTdHJpbmcobWVtYmVyQSl9IHVzZXJCPSR7dGhpcy5tZW1iZXJTdHJpbmcobWVtYmVyQil9YCk7XG5cbiAgICAgICAgY29uc3QgdXNlckEgPSBtZW1iZXJBLnVzZXI7XG4gICAgICAgIGNvbnN0IHVzZXJCID0gbWVtYmVyQi51c2VyO1xuXG4gICAgICAgIC8vIGlmICghdXNlckEpIGNvbnNvbGUubG9nKFwiISEgTUlTU0lORyBVU0VSIEZPUiBBLVNJREU6IFwiICsgbWVtYmVyQS5uYW1lICsgXCIgISFcIik7XG4gICAgICAgIC8vIGlmICghdXNlckIpIGNvbnNvbGUubG9nKFwiISEgTUlTU0lORyBVU0VSIEZPUiBCLVNJREU6IFwiICsgbWVtYmVyQi5uYW1lICsgXCIgISFcIik7XG5cbiAgICAgICAgaWYgKCF1c2VyQSAmJiAhdXNlckIpIHJldHVybiAwO1xuICAgICAgICBpZiAodXNlckEgJiYgIXVzZXJCKSByZXR1cm4gLTE7XG4gICAgICAgIGlmICghdXNlckEgJiYgdXNlckIpIHJldHVybiAxO1xuXG4gICAgICAgIC8vIEZpcnN0IGJ5IHByZXNlbmNlXG4gICAgICAgIGlmICh0aGlzLl9zaG93UHJlc2VuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRQcmVzZW5jZSA9IChwKSA9PiBwID09PSAndW5hdmFpbGFibGUnID8gJ29ubGluZScgOiBwO1xuICAgICAgICAgICAgY29uc3QgcHJlc2VuY2VJbmRleCA9IHAgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yZGVyID0gWydhY3RpdmUnLCAnb25saW5lJywgJ29mZmxpbmUnXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpZHggPSBvcmRlci5pbmRleE9mKGNvbnZlcnRQcmVzZW5jZShwKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkeCA9PT0gLTEgPyBvcmRlci5sZW5ndGggOiBpZHg7IC8vIHVua25vd24gc3RhdGVzIGF0IHRoZSBlbmRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGlkeEEgPSBwcmVzZW5jZUluZGV4KHVzZXJBLmN1cnJlbnRseUFjdGl2ZSA/ICdhY3RpdmUnIDogdXNlckEucHJlc2VuY2UpO1xuICAgICAgICAgICAgY29uc3QgaWR4QiA9IHByZXNlbmNlSW5kZXgodXNlckIuY3VycmVudGx5QWN0aXZlID8gJ2FjdGl2ZScgOiB1c2VyQi5wcmVzZW5jZSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdXNlckFfcHJlc2VuY2VHcm91cD0ke2lkeEF9IHVzZXJCX3ByZXNlbmNlR3JvdXA9JHtpZHhCfWApO1xuICAgICAgICAgICAgaWYgKGlkeEEgIT09IGlkeEIpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbXBhcmluZyBvbiBwcmVzZW5jZSBncm91cCAtIHJldHVybmluZ1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWR4QSAtIGlkeEI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWNvbmQgYnkgcG93ZXIgbGV2ZWxcbiAgICAgICAgaWYgKG1lbWJlckEucG93ZXJMZXZlbCAhPT0gbWVtYmVyQi5wb3dlckxldmVsKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbXBhcmluZyBvbiBwb3dlciBsZXZlbCAtIHJldHVybmluZ1wiKTtcbiAgICAgICAgICAgIHJldHVybiBtZW1iZXJCLnBvd2VyTGV2ZWwgLSBtZW1iZXJBLnBvd2VyTGV2ZWw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlyZCBieSBsYXN0IGFjdGl2ZVxuICAgICAgICBpZiAodGhpcy5fc2hvd1ByZXNlbmNlICYmIHVzZXJBLmdldExhc3RBY3RpdmVUcygpICE9PSB1c2VyQi5nZXRMYXN0QWN0aXZlVHMoKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb21wYXJpbmcgb24gbGFzdCBhY3RpdmUgdGltZXN0YW1wIC0gcmV0dXJuaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJCLmdldExhc3RBY3RpdmVUcygpIC0gdXNlckEuZ2V0TGFzdEFjdGl2ZVRzKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGb3VydGggYnkgbmFtZSAoYWxwaGFiZXRpY2FsKVxuICAgICAgICBjb25zdCBuYW1lQSA9IChtZW1iZXJBLm5hbWVbMF0gPT09ICdAJyA/IG1lbWJlckEubmFtZS5zdWJzdHIoMSkgOiBtZW1iZXJBLm5hbWUpLnJlcGxhY2UoU09SVF9SRUdFWCwgXCJcIik7XG4gICAgICAgIGNvbnN0IG5hbWVCID0gKG1lbWJlckIubmFtZVswXSA9PT0gJ0AnID8gbWVtYmVyQi5uYW1lLnN1YnN0cigxKSA6IG1lbWJlckIubmFtZSkucmVwbGFjZShTT1JUX1JFR0VYLCBcIlwiKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYENvbXBhcmluZyB1c2VyQV9uYW1lPSR7bmFtZUF9IGFnYWluc3QgdXNlckJfbmFtZT0ke25hbWVCfSAtIHJldHVybmluZ2ApO1xuICAgICAgICByZXR1cm4gbmFtZUEubG9jYWxlQ29tcGFyZShuYW1lQiwge1xuICAgICAgICAgICAgaWdub3JlUHVuY3R1YXRpb246IHRydWUsXG4gICAgICAgICAgICBzZW5zaXRpdml0eTogXCJiYXNlXCIsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblNlYXJjaFF1ZXJ5Q2hhbmdlZDogZnVuY3Rpb24oc2VhcmNoUXVlcnkpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzZWFyY2hRdWVyeSxcbiAgICAgICAgICAgIGZpbHRlcmVkSm9pbmVkTWVtYmVyczogdGhpcy5fZmlsdGVyTWVtYmVycyh0aGlzLnN0YXRlLm1lbWJlcnMsICdqb2luJywgc2VhcmNoUXVlcnkpLFxuICAgICAgICAgICAgZmlsdGVyZWRJbnZpdGVkTWVtYmVyczogdGhpcy5fZmlsdGVyTWVtYmVycyh0aGlzLnN0YXRlLm1lbWJlcnMsICdpbnZpdGUnLCBzZWFyY2hRdWVyeSksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25QZW5kaW5nM3BpZEludml0ZUNsaWNrOiBmdW5jdGlvbihpbnZpdGVFdmVudCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld18zcGlkX2ludml0ZScsXG4gICAgICAgICAgICBldmVudDogaW52aXRlRXZlbnQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfZmlsdGVyTWVtYmVyczogZnVuY3Rpb24obWVtYmVycywgbWVtYmVyc2hpcCwgcXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIG1lbWJlcnMuZmlsdGVyKChtKSA9PiB7XG4gICAgICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc05hbWUgPSBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5KSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlc0lkID0gbS51c2VySWQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5KSAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZXNOYW1lICYmICFtYXRjaGVzSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG0ubWVtYmVyc2hpcCA9PT0gbWVtYmVyc2hpcDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9nZXRQZW5kaW5nM1BpZEludml0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBpbmNsdWRlIDNwaWQgaW52aXRlcyAobS5yb29tLnRoaXJkX3BhcnR5X2ludml0ZSkgc3RhdGUgZXZlbnRzLlxuICAgICAgICAvLyBUaGUgSFMgbWF5IGhhdmUgYWxyZWFkeSBjb252ZXJ0ZWQgdGhlc2UgaW50byBtLnJvb20ubWVtYmVyIGludml0ZXMgc29cbiAgICAgICAgLy8gd2Ugc2hvdWxkbid0IGFkZCB0aGVtIGlmIHRoZSAzcGlkIGludml0ZSBzdGF0ZSBrZXkgKHRva2VuKSBpcyBpbiB0aGVcbiAgICAgICAgLy8gbWVtYmVyIGludml0ZSAoY29udGVudC50aGlyZF9wYXJ0eV9pbnZpdGUuc2lnbmVkLnRva2VuKVxuICAgICAgICBjb25zdCByb29tID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuXG4gICAgICAgIGlmIChyb29tKSB7XG4gICAgICAgICAgICByZXR1cm4gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20udGhpcmRfcGFydHlfaW52aXRlXCIpLmZpbHRlcihmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkM3BpZEludml0ZShlKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gZGlzY2FyZCBhbGwgaW52aXRlcyB3aGljaCBoYXZlIGEgbS5yb29tLm1lbWJlciBldmVudCBzaW5jZSB3ZSd2ZVxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgYWRkZWQgdGhlbS5cbiAgICAgICAgICAgICAgICBjb25zdCBtZW1iZXJFdmVudCA9IHJvb20uY3VycmVudFN0YXRlLmdldEludml0ZUZvclRocmVlUGlkVG9rZW4oZS5nZXRTdGF0ZUtleSgpKTtcbiAgICAgICAgICAgICAgICBpZiAobWVtYmVyRXZlbnQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9tYWtlTWVtYmVyVGlsZXM6IGZ1bmN0aW9uKG1lbWJlcnMpIHtcbiAgICAgICAgY29uc3QgTWVtYmVyVGlsZSA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5NZW1iZXJUaWxlXCIpO1xuICAgICAgICBjb25zdCBFbnRpdHlUaWxlID0gc2RrLmdldENvbXBvbmVudChcInJvb21zLkVudGl0eVRpbGVcIik7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlcnMubWFwKChtKSA9PiB7XG4gICAgICAgICAgICBpZiAobS51c2VySWQpIHtcbiAgICAgICAgICAgICAgICAvLyBJcyBhIE1hdHJpeCBpbnZpdGVcbiAgICAgICAgICAgICAgICByZXR1cm4gPE1lbWJlclRpbGUga2V5PXttLnVzZXJJZH0gbWVtYmVyPXttfSByZWY9e20udXNlcklkfSBzaG93UHJlc2VuY2U9e3RoaXMuX3Nob3dQcmVzZW5jZX0gLz47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIElzIGEgM3BpZCBpbnZpdGVcbiAgICAgICAgICAgICAgICByZXR1cm4gPEVudGl0eVRpbGUga2V5PXttLmdldFN0YXRlS2V5KCl9IG5hbWU9e20uZ2V0Q29udGVudCgpLmRpc3BsYXlfbmFtZX0gc3VwcHJlc3NPbkhvdmVyPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLl9vblBlbmRpbmczcGlkSW52aXRlQ2xpY2sobSl9IC8+O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2dldENoaWxkcmVuSm9pbmVkOiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYWtlTWVtYmVyVGlsZXModGhpcy5zdGF0ZS5maWx0ZXJlZEpvaW5lZE1lbWJlcnMuc2xpY2Uoc3RhcnQsIGVuZCkpO1xuICAgIH0sXG5cbiAgICBfZ2V0Q2hpbGRDb3VudEpvaW5lZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmZpbHRlcmVkSm9pbmVkTWVtYmVycy5sZW5ndGg7XG4gICAgfSxcblxuICAgIF9nZXRDaGlsZHJlbkludml0ZWQ6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgbGV0IHRhcmdldHMgPSB0aGlzLnN0YXRlLmZpbHRlcmVkSW52aXRlZE1lbWJlcnM7XG4gICAgICAgIGlmIChlbmQgPiB0aGlzLnN0YXRlLmZpbHRlcmVkSW52aXRlZE1lbWJlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXJnZXRzID0gdGFyZ2V0cy5jb25jYXQodGhpcy5fZ2V0UGVuZGluZzNQaWRJbnZpdGVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX21ha2VNZW1iZXJUaWxlcyh0YXJnZXRzLnNsaWNlKHN0YXJ0LCBlbmQpKTtcbiAgICB9LFxuXG4gICAgX2dldENoaWxkQ291bnRJbnZpdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZmlsdGVyZWRJbnZpdGVkTWVtYmVycy5sZW5ndGggKyAodGhpcy5fZ2V0UGVuZGluZzNQaWRJbnZpdGVzKCkgfHwgW10pLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubG9hZGluZykge1xuICAgICAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVyTGlzdFwiPjxTcGlubmVyIC8+PC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgU2VhcmNoQm94ID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5TZWFyY2hCb3gnKTtcbiAgICAgICAgY29uc3QgVHJ1bmNhdGVkTGlzdCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5UcnVuY2F0ZWRMaXN0XCIpO1xuXG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3Qgcm9vbSA9IGNsaS5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgbGV0IGludml0ZUJ1dHRvbjtcblxuICAgICAgICBpZiAocm9vbSAmJiByb29tLmdldE15TWVtYmVyc2hpcCgpID09PSAnam9pbicpIHtcbiAgICAgICAgICAgIC8vIGFzc3VtZSB3ZSBjYW4gaW52aXRlIHVudGlsIHByb3ZlbiBmYWxzZVxuICAgICAgICAgICAgbGV0IGNhbkludml0ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHBsRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgICAgICAgICBjb25zdCBtZSA9IHJvb20uZ2V0TWVtYmVyKGNsaS5nZXRVc2VySWQoKSk7XG4gICAgICAgICAgICBpZiAocGxFdmVudCAmJiBtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBwbEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudCAmJiBjb250ZW50Lmludml0ZSA+IG1lLnBvd2VyTGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuSW52aXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b25cIik7XG4gICAgICAgICAgICBpbnZpdGVCdXR0b24gPVxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X01lbWJlckxpc3RfaW52aXRlXCIgb25DbGljaz17dGhpcy5vbkludml0ZUJ1dHRvbkNsaWNrfSBkaXNhYmxlZD17IWNhbkludml0ZX0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnsgX3QoJ0ludml0ZSB0byB0aGlzIHJvb20nKSB9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW52aXRlZEhlYWRlcjtcbiAgICAgICAgbGV0IGludml0ZWRTZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5fZ2V0Q2hpbGRDb3VudEludml0ZWQoKSA+IDApIHtcbiAgICAgICAgICAgIGludml0ZWRIZWFkZXIgPSA8aDI+eyBfdChcIkludml0ZWRcIikgfTwvaDI+O1xuICAgICAgICAgICAgaW52aXRlZFNlY3Rpb24gPSA8VHJ1bmNhdGVkTGlzdCBjbGFzc05hbWU9XCJteF9NZW1iZXJMaXN0X3NlY3Rpb24gbXhfTWVtYmVyTGlzdF9pbnZpdGVkXCIgdHJ1bmNhdGVBdD17dGhpcy5zdGF0ZS50cnVuY2F0ZUF0SW52aXRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU92ZXJmbG93RWxlbWVudD17dGhpcy5fY3JlYXRlT3ZlcmZsb3dUaWxlSW52aXRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdldENoaWxkcmVuPXt0aGlzLl9nZXRDaGlsZHJlbkludml0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRDaGlsZENvdW50PXt0aGlzLl9nZXRDaGlsZENvdW50SW52aXRlZH1cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lbWJlckxpc3RcIiByb2xlPVwidGFicGFuZWxcIj5cbiAgICAgICAgICAgICAgICB7IGludml0ZUJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgPEF1dG9IaWRlU2Nyb2xsYmFyPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lbWJlckxpc3Rfd3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRydW5jYXRlZExpc3QgY2xhc3NOYW1lPVwibXhfTWVtYmVyTGlzdF9zZWN0aW9uIG14X01lbWJlckxpc3Rfam9pbmVkXCIgdHJ1bmNhdGVBdD17dGhpcy5zdGF0ZS50cnVuY2F0ZUF0Sm9pbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU92ZXJmbG93RWxlbWVudD17dGhpcy5fY3JlYXRlT3ZlcmZsb3dUaWxlSm9pbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldENoaWxkcmVuPXt0aGlzLl9nZXRDaGlsZHJlbkpvaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRDaGlsZENvdW50PXt0aGlzLl9nZXRDaGlsZENvdW50Sm9pbmVkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBpbnZpdGVkSGVhZGVyIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgaW52aXRlZFNlY3Rpb24gfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0F1dG9IaWRlU2Nyb2xsYmFyPlxuXG4gICAgICAgICAgICAgICAgPFNlYXJjaEJveCBjbGFzc05hbWU9XCJteF9NZW1iZXJMaXN0X3F1ZXJ5IG14X3RleHRpbnB1dF9pY29uIG14X3RleHRpbnB1dF9zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9eyBfdCgnRmlsdGVyIHJvb20gbWVtYmVycycpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VhcmNoPXsgdGhpcy5vblNlYXJjaFF1ZXJ5Q2hhbmdlZCB9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgb25JbnZpdGVCdXR0b25DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNHdWVzdCgpKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3JlcXVpcmVfcmVnaXN0cmF0aW9uJ30pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2FsbCBBZGRyZXNzUGlja2VyRGlhbG9nXG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X2ludml0ZScsXG4gICAgICAgICAgICByb29tSWQ6IHRoaXMucHJvcHMucm9vbUlkLFxuICAgICAgICB9KTtcbiAgICB9LFxufSk7XG4iXX0=