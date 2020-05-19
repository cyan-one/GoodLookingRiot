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

var _MatrixClientPeg = require("../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _HostingLink = require("../../utils/HostingLink");

var _HtmlUtils = require("../../HtmlUtils");

var _languageHandler = require("../../languageHandler");

var _AccessibleButton = _interopRequireDefault(require("../views/elements/AccessibleButton"));

var _GroupHeaderButtons = _interopRequireDefault(require("../views/right_panel/GroupHeaderButtons"));

var _MainSplit = _interopRequireDefault(require("./MainSplit"));

var _RightPanel = _interopRequireDefault(require("./RightPanel"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var _classnames = _interopRequireDefault(require("classnames"));

var _GroupStore = _interopRequireDefault(require("../../stores/GroupStore"));

var _FlairStore = _interopRequireDefault(require("../../stores/FlairStore"));

var _GroupAddressPicker = require("../../GroupAddressPicker");

var _Permalinks = require("../../utils/permalinks/Permalinks");

var _matrixJsSdk = require("matrix-js-sdk");

var _promise = require("../../utils/promise");

var _RightPanelStore = _interopRequireDefault(require("../../stores/RightPanelStore"));

var _AutoHideScrollbar = _interopRequireDefault(require("./AutoHideScrollbar"));

/*
Copyright 2017 Vector Creations Ltd.
Copyright 2017, 2018 New Vector Ltd.
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
const LONG_DESC_PLACEHOLDER = (0, _languageHandler._td)("<h1>HTML for your community's page</h1>\n<p>\n    Use the long description to introduce new members to the community, or distribute\n    some important <a href=\"foo\">links</a>\n</p>\n<p>\n    You can even use 'img' tags\n</p>\n");

const RoomSummaryType = _propTypes.default.shape({
  room_id: _propTypes.default.string.isRequired,
  profile: _propTypes.default.shape({
    name: _propTypes.default.string,
    avatar_url: _propTypes.default.string,
    canonical_alias: _propTypes.default.string
  }).isRequired
});

const UserSummaryType = _propTypes.default.shape({
  summaryInfo: _propTypes.default.shape({
    user_id: _propTypes.default.string.isRequired,
    role_id: _propTypes.default.string,
    avatar_url: _propTypes.default.string,
    displayname: _propTypes.default.string
  }).isRequired
});

const CategoryRoomList = (0, _createReactClass.default)({
  displayName: 'CategoryRoomList',
  props: {
    rooms: _propTypes.default.arrayOf(RoomSummaryType).isRequired,
    category: _propTypes.default.shape({
      profile: _propTypes.default.shape({
        name: _propTypes.default.string
      }).isRequired
    }),
    groupId: _propTypes.default.string.isRequired,
    // Whether the list should be editable
    editing: _propTypes.default.bool.isRequired
  },
  onAddRoomsToSummaryClicked: function (ev) {
    ev.preventDefault();
    const AddressPickerDialog = sdk.getComponent("dialogs.AddressPickerDialog");

    _Modal.default.createTrackedDialog('Add Rooms to Group Summary', '', AddressPickerDialog, {
      title: (0, _languageHandler._t)('Add rooms to the community summary'),
      description: (0, _languageHandler._t)("Which rooms would you like to add to this summary?"),
      placeholder: (0, _languageHandler._t)("Room name or alias"),
      button: (0, _languageHandler._t)("Add to summary"),
      pickerType: 'room',
      validAddressTypes: ['mx-room-id'],
      groupId: this.props.groupId,
      onFinished: (success, addrs) => {
        if (!success) return;
        const errorList = [];
        (0, _promise.allSettled)(addrs.map(addr => {
          return _GroupStore.default.addRoomToGroupSummary(this.props.groupId, addr.address).catch(() => {
            errorList.push(addr.address);
          });
        })).then(() => {
          if (errorList.length === 0) {
            return;
          }

          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Failed to add the following room to the group summary', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Failed to add the following rooms to the summary of %(groupId)s:", {
              groupId: this.props.groupId
            }),
            description: errorList.join(", ")
          });
        });
      }
    },
    /*className=*/
    null,
    /*isPriority=*/
    false,
    /*isStatic=*/
    true);
  },
  render: function () {
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    const addButton = this.props.editing ? /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_GroupView_featuredThings_addButton",
      onClick: this.onAddRoomsToSummaryClicked
    }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
      src: require("../../../res/img/icons-create-room.svg"),
      width: "64",
      height: "64"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_addButton_label"
    }, (0, _languageHandler._t)('Add a Room'))) : /*#__PURE__*/_react.default.createElement("div", null);
    const roomNodes = this.props.rooms.map(r => {
      return /*#__PURE__*/_react.default.createElement(FeaturedRoom, {
        key: r.room_id,
        groupId: this.props.groupId,
        editing: this.props.editing,
        summaryInfo: r
      });
    });

    let catHeader = /*#__PURE__*/_react.default.createElement("div", null);

    if (this.props.category && this.props.category.profile) {
      catHeader = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_featuredThings_category"
      }, this.props.category.profile.name);
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_container"
    }, catHeader, roomNodes, addButton);
  }
});
const FeaturedRoom = (0, _createReactClass.default)({
  displayName: 'FeaturedRoom',
  props: {
    summaryInfo: RoomSummaryType.isRequired,
    editing: _propTypes.default.bool.isRequired,
    groupId: _propTypes.default.string.isRequired
  },
  onClick: function (e) {
    e.preventDefault();
    e.stopPropagation();

    _dispatcher.default.dispatch({
      action: 'view_room',
      room_alias: this.props.summaryInfo.profile.canonical_alias,
      room_id: this.props.summaryInfo.room_id
    });
  },
  onDeleteClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();

    _GroupStore.default.removeRoomFromGroupSummary(this.props.groupId, this.props.summaryInfo.room_id).catch(err => {
      console.error('Error whilst removing room from group summary', err);
      const roomName = this.props.summaryInfo.name || this.props.summaryInfo.canonical_alias || this.props.summaryInfo.room_id;
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to remove room from group summary', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to remove the room from the summary of %(groupId)s", {
          groupId: this.props.groupId
        }),
        description: (0, _languageHandler._t)("The room '%(roomName)s' could not be removed from the summary.", {
          roomName
        })
      });
    });
  },
  render: function () {
    const RoomAvatar = sdk.getComponent("avatars.RoomAvatar");
    const roomName = this.props.summaryInfo.profile.name || this.props.summaryInfo.profile.canonical_alias || (0, _languageHandler._t)("Unnamed Room");
    const oobData = {
      roomId: this.props.summaryInfo.room_id,
      avatarUrl: this.props.summaryInfo.profile.avatar_url,
      name: roomName
    };
    let permalink = null;

    if (this.props.summaryInfo.profile && this.props.summaryInfo.profile.canonical_alias) {
      permalink = (0, _Permalinks.makeGroupPermalink)(this.props.summaryInfo.profile.canonical_alias);
    }

    let roomNameNode = null;

    if (permalink) {
      roomNameNode = /*#__PURE__*/_react.default.createElement("a", {
        href: permalink,
        onClick: this.onClick
      }, roomName);
    } else {
      roomNameNode = /*#__PURE__*/_react.default.createElement("span", null, roomName);
    }

    const deleteButton = this.props.editing ? /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_GroupView_featuredThing_deleteButton",
      src: require("../../../res/img/cancel-small.svg"),
      width: "14",
      height: "14",
      alt: "Delete",
      onClick: this.onDeleteClicked
    }) : /*#__PURE__*/_react.default.createElement("div", null);
    return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_GroupView_featuredThing",
      onClick: this.onClick
    }, /*#__PURE__*/_react.default.createElement(RoomAvatar, {
      oobData: oobData,
      width: 64,
      height: 64
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThing_name"
    }, roomNameNode), deleteButton);
  }
});
const RoleUserList = (0, _createReactClass.default)({
  displayName: 'RoleUserList',
  props: {
    users: _propTypes.default.arrayOf(UserSummaryType).isRequired,
    role: _propTypes.default.shape({
      profile: _propTypes.default.shape({
        name: _propTypes.default.string
      }).isRequired
    }),
    groupId: _propTypes.default.string.isRequired,
    // Whether the list should be editable
    editing: _propTypes.default.bool.isRequired
  },
  onAddUsersClicked: function (ev) {
    ev.preventDefault();
    const AddressPickerDialog = sdk.getComponent("dialogs.AddressPickerDialog");

    _Modal.default.createTrackedDialog('Add Users to Group Summary', '', AddressPickerDialog, {
      title: (0, _languageHandler._t)('Add users to the community summary'),
      description: (0, _languageHandler._t)("Who would you like to add to this summary?"),
      placeholder: (0, _languageHandler._t)("Name or Matrix ID"),
      button: (0, _languageHandler._t)("Add to summary"),
      validAddressTypes: ['mx-user-id'],
      groupId: this.props.groupId,
      shouldOmitSelf: false,
      onFinished: (success, addrs) => {
        if (!success) return;
        const errorList = [];
        (0, _promise.allSettled)(addrs.map(addr => {
          return _GroupStore.default.addUserToGroupSummary(addr.address).catch(() => {
            errorList.push(addr.address);
          });
        })).then(() => {
          if (errorList.length === 0) {
            return;
          }

          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Failed to add the following users to the community summary', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Failed to add the following users to the summary of %(groupId)s:", {
              groupId: this.props.groupId
            }),
            description: errorList.join(", ")
          });
        });
      }
    },
    /*className=*/
    null,
    /*isPriority=*/
    false,
    /*isStatic=*/
    true);
  },
  render: function () {
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    const addButton = this.props.editing ? /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_GroupView_featuredThings_addButton",
      onClick: this.onAddUsersClicked
    }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
      src: require("../../../res/img/icons-create-room.svg"),
      width: "64",
      height: "64"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_addButton_label"
    }, (0, _languageHandler._t)('Add a User'))) : /*#__PURE__*/_react.default.createElement("div", null);
    const userNodes = this.props.users.map(u => {
      return /*#__PURE__*/_react.default.createElement(FeaturedUser, {
        key: u.user_id,
        summaryInfo: u,
        editing: this.props.editing,
        groupId: this.props.groupId
      });
    });

    let roleHeader = /*#__PURE__*/_react.default.createElement("div", null);

    if (this.props.role && this.props.role.profile) {
      roleHeader = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_featuredThings_category"
      }, this.props.role.profile.name);
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_container"
    }, roleHeader, userNodes, addButton);
  }
});
const FeaturedUser = (0, _createReactClass.default)({
  displayName: 'FeaturedUser',
  props: {
    summaryInfo: UserSummaryType.isRequired,
    editing: _propTypes.default.bool.isRequired,
    groupId: _propTypes.default.string.isRequired
  },
  onClick: function (e) {
    e.preventDefault();
    e.stopPropagation();

    _dispatcher.default.dispatch({
      action: 'view_start_chat_or_reuse',
      user_id: this.props.summaryInfo.user_id
    });
  },
  onDeleteClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();

    _GroupStore.default.removeUserFromGroupSummary(this.props.groupId, this.props.summaryInfo.user_id).catch(err => {
      console.error('Error whilst removing user from group summary', err);
      const displayName = this.props.summaryInfo.displayname || this.props.summaryInfo.user_id;
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Failed to remove user from community summary', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Failed to remove a user from the summary of %(groupId)s", {
          groupId: this.props.groupId
        }),
        description: (0, _languageHandler._t)("The user '%(displayName)s' could not be removed from the summary.", {
          displayName
        })
      });
    });
  },
  render: function () {
    const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");
    const name = this.props.summaryInfo.displayname || this.props.summaryInfo.user_id;
    const permalink = (0, _Permalinks.makeUserPermalink)(this.props.summaryInfo.user_id);

    const userNameNode = /*#__PURE__*/_react.default.createElement("a", {
      href: permalink,
      onClick: this.onClick
    }, name);

    const httpUrl = _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(this.props.summaryInfo.avatar_url, 64, 64);

    const deleteButton = this.props.editing ? /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_GroupView_featuredThing_deleteButton",
      src: require("../../../res/img/cancel-small.svg"),
      width: "14",
      height: "14",
      alt: "Delete",
      onClick: this.onDeleteClicked
    }) : /*#__PURE__*/_react.default.createElement("div", null);
    return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_GroupView_featuredThing",
      onClick: this.onClick
    }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      name: name,
      url: httpUrl,
      width: 64,
      height: 64
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThing_name"
    }, userNameNode), deleteButton);
  }
});
const GROUP_JOINPOLICY_OPEN = "open";
const GROUP_JOINPOLICY_INVITE = "invite";

var _default = (0, _createReactClass.default)({
  displayName: 'GroupView',
  propTypes: {
    groupId: _propTypes.default.string.isRequired,
    // Whether this is the first time the group admin is viewing the group
    groupIsNew: _propTypes.default.bool
  },
  getInitialState: function () {
    return {
      summary: null,
      isGroupPublicised: null,
      isUserPrivileged: null,
      groupRooms: null,
      groupRoomsLoading: null,
      error: null,
      editing: false,
      saving: false,
      uploadingAvatar: false,
      avatarChanged: false,
      membershipBusy: false,
      publicityBusy: false,
      inviterProfile: null,
      showRightPanel: _RightPanelStore.default.getSharedInstance().isOpenForGroup
    };
  },
  componentDidMount: function () {
    this._unmounted = false;
    this._matrixClient = _MatrixClientPeg.MatrixClientPeg.get();

    this._matrixClient.on("Group.myMembership", this._onGroupMyMembership);

    this._initGroupStore(this.props.groupId, true);

    this._dispatcherRef = _dispatcher.default.register(this._onAction);
    this._rightPanelStoreToken = _RightPanelStore.default.getSharedInstance().addListener(this._onRightPanelStoreUpdate);
  },
  componentWillUnmount: function () {
    this._unmounted = true;

    this._matrixClient.removeListener("Group.myMembership", this._onGroupMyMembership);

    _dispatcher.default.unregister(this._dispatcherRef); // Remove RightPanelStore listener


    if (this._rightPanelStoreToken) {
      this._rightPanelStoreToken.remove();
    }
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    if (this.props.groupId !== newProps.groupId) {
      this.setState({
        summary: null,
        error: null
      }, () => {
        this._initGroupStore(newProps.groupId);
      });
    }
  },
  _onRightPanelStoreUpdate: function () {
    this.setState({
      showRightPanel: _RightPanelStore.default.getSharedInstance().isOpenForGroup
    });
  },
  _onGroupMyMembership: function (group) {
    if (this._unmounted || group.groupId !== this.props.groupId) return;

    if (group.myMembership === 'leave') {
      // Leave settings - the user might have clicked the "Leave" button
      this._closeSettings();
    }

    this.setState({
      membershipBusy: false
    });
  },
  _initGroupStore: function (groupId, firstInit) {
    const group = this._matrixClient.getGroup(groupId);

    if (group && group.inviter && group.inviter.userId) {
      this._fetchInviterProfile(group.inviter.userId);
    }

    _GroupStore.default.registerListener(groupId, this.onGroupStoreUpdated.bind(this, firstInit));

    let willDoOnboarding = false; // XXX: This should be more fluxy - let's get the error from GroupStore .getError or something

    _GroupStore.default.on('error', (err, errorGroupId, stateKey) => {
      if (this._unmounted || groupId !== errorGroupId) return;

      if (err.errcode === 'M_GUEST_ACCESS_FORBIDDEN' && !willDoOnboarding) {
        _dispatcher.default.dispatch({
          action: 'do_after_sync_prepared',
          deferred_action: {
            action: 'view_group',
            group_id: groupId
          }
        });

        _dispatcher.default.dispatch({
          action: 'require_registration',
          screen_after: {
            screen: "group/".concat(groupId)
          }
        });

        willDoOnboarding = true;
      }

      if (stateKey === _GroupStore.default.STATE_KEY.Summary) {
        this.setState({
          summary: null,
          error: err,
          editing: false
        });
      }
    });
  },

  onGroupStoreUpdated(firstInit) {
    if (this._unmounted) return;

    const summary = _GroupStore.default.getSummary(this.props.groupId);

    if (summary.profile) {
      // Default profile fields should be "" for later sending to the server (which
      // requires that the fields are strings, not null)
      ["avatar_url", "long_description", "name", "short_description"].forEach(k => {
        summary.profile[k] = summary.profile[k] || "";
      });
    }

    this.setState({
      summary,
      summaryLoading: !_GroupStore.default.isStateReady(this.props.groupId, _GroupStore.default.STATE_KEY.Summary),
      isGroupPublicised: _GroupStore.default.getGroupPublicity(this.props.groupId),
      isUserPrivileged: _GroupStore.default.isUserPrivileged(this.props.groupId),
      groupRooms: _GroupStore.default.getGroupRooms(this.props.groupId),
      groupRoomsLoading: !_GroupStore.default.isStateReady(this.props.groupId, _GroupStore.default.STATE_KEY.GroupRooms),
      isUserMember: _GroupStore.default.getGroupMembers(this.props.groupId).some(m => m.userId === this._matrixClient.credentials.userId)
    }); // XXX: This might not work but this.props.groupIsNew unused anyway

    if (this.props.groupIsNew && firstInit) {
      this._onEditClick();
    }
  },

  _fetchInviterProfile(userId) {
    this.setState({
      inviterProfileBusy: true
    });

    this._matrixClient.getProfileInfo(userId).then(resp => {
      if (this._unmounted) return;
      this.setState({
        inviterProfile: {
          avatarUrl: resp.avatar_url,
          displayName: resp.displayname
        }
      });
    }).catch(e => {
      console.error('Error getting group inviter profile', e);
    }).finally(() => {
      if (this._unmounted) return;
      this.setState({
        inviterProfileBusy: false
      });
    });
  },

  _onEditClick: function () {
    this.setState({
      editing: true,
      profileForm: Object.assign({}, this.state.summary.profile),
      joinableForm: {
        policyType: this.state.summary.profile.is_openly_joinable ? GROUP_JOINPOLICY_OPEN : GROUP_JOINPOLICY_INVITE
      }
    });
  },
  _onShareClick: function () {
    const ShareDialog = sdk.getComponent("dialogs.ShareDialog");

    _Modal.default.createTrackedDialog('share community dialog', '', ShareDialog, {
      target: this._matrixClient.getGroup(this.props.groupId) || new _matrixJsSdk.Group(this.props.groupId)
    });
  },
  _onCancelClick: function () {
    this._closeSettings();
  },

  _onAction(payload) {
    switch (payload.action) {
      // NOTE: close_settings is an app-wide dispatch; as it is dispatched from MatrixChat
      case 'close_settings':
        this.setState({
          editing: false,
          profileForm: null
        });
        break;

      default:
        break;
    }
  },

  _closeSettings() {
    _dispatcher.default.dispatch({
      action: 'close_settings'
    });
  },

  _onNameChange: function (value) {
    const newProfileForm = Object.assign(this.state.profileForm, {
      name: value
    });
    this.setState({
      profileForm: newProfileForm
    });
  },
  _onShortDescChange: function (value) {
    const newProfileForm = Object.assign(this.state.profileForm, {
      short_description: value
    });
    this.setState({
      profileForm: newProfileForm
    });
  },
  _onLongDescChange: function (e) {
    const newProfileForm = Object.assign(this.state.profileForm, {
      long_description: e.target.value
    });
    this.setState({
      profileForm: newProfileForm
    });
  },
  _onAvatarSelected: function (ev) {
    const file = ev.target.files[0];
    if (!file) return;
    this.setState({
      uploadingAvatar: true
    });

    this._matrixClient.uploadContent(file).then(url => {
      const newProfileForm = Object.assign(this.state.profileForm, {
        avatar_url: url
      });
      this.setState({
        uploadingAvatar: false,
        profileForm: newProfileForm,
        // Indicate that FlairStore needs to be poked to show this change
        // in TagTile (TagPanel), Flair and GroupTile (MyGroups).
        avatarChanged: true
      });
    }).catch(e => {
      this.setState({
        uploadingAvatar: false
      });
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Failed to upload avatar image", e);

      _Modal.default.createTrackedDialog('Failed to upload image', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Error'),
        description: (0, _languageHandler._t)('Failed to upload image')
      });
    });
  },
  _onJoinableChange: function (ev) {
    this.setState({
      joinableForm: {
        policyType: ev.target.value
      }
    });
  },
  _onSaveClick: function () {
    this.setState({
      saving: true
    });
    const savePromise = this.state.isUserPrivileged ? this._saveGroup() : Promise.resolve();
    savePromise.then(result => {
      this.setState({
        saving: false,
        editing: false,
        summary: null
      });

      _dispatcher.default.dispatch({
        action: 'panel_disable'
      });

      this._initGroupStore(this.props.groupId);

      if (this.state.avatarChanged) {
        // XXX: Evil - poking a store should be done from an async action
        _FlairStore.default.refreshGroupProfile(this._matrixClient, this.props.groupId);
      }
    }).catch(e => {
      this.setState({
        saving: false
      });
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Failed to save community profile", e);

      _Modal.default.createTrackedDialog('Failed to update group', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Error'),
        description: (0, _languageHandler._t)('Failed to update community')
      });
    }).finally(() => {
      this.setState({
        avatarChanged: false
      });
    });
  },
  _saveGroup: async function () {
    await this._matrixClient.setGroupProfile(this.props.groupId, this.state.profileForm);
    await this._matrixClient.setGroupJoinPolicy(this.props.groupId, {
      type: this.state.joinableForm.policyType
    });
  },
  _onAcceptInviteClick: async function () {
    this.setState({
      membershipBusy: true
    }); // Wait 500ms to prevent flashing. Do this before sending a request otherwise we risk the
    // spinner disappearing after we have fetched new group data.

    await (0, _promise.sleep)(500);

    _GroupStore.default.acceptGroupInvite(this.props.groupId).then(() => {// don't reset membershipBusy here: wait for the membership change to come down the sync
    }).catch(e => {
      this.setState({
        membershipBusy: false
      });
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Error accepting invite', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Error"),
        description: (0, _languageHandler._t)("Unable to accept invite")
      });
    });
  },
  _onRejectInviteClick: async function () {
    this.setState({
      membershipBusy: true
    }); // Wait 500ms to prevent flashing. Do this before sending a request otherwise we risk the
    // spinner disappearing after we have fetched new group data.

    await (0, _promise.sleep)(500);

    _GroupStore.default.leaveGroup(this.props.groupId).then(() => {// don't reset membershipBusy here: wait for the membership change to come down the sync
    }).catch(e => {
      this.setState({
        membershipBusy: false
      });
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Error rejecting invite', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Error"),
        description: (0, _languageHandler._t)("Unable to reject invite")
      });
    });
  },
  _onJoinClick: async function () {
    if (this._matrixClient.isGuest()) {
      _dispatcher.default.dispatch({
        action: 'require_registration',
        screen_after: {
          screen: "group/".concat(this.props.groupId)
        }
      });

      return;
    }

    this.setState({
      membershipBusy: true
    }); // Wait 500ms to prevent flashing. Do this before sending a request otherwise we risk the
    // spinner disappearing after we have fetched new group data.

    await (0, _promise.sleep)(500);

    _GroupStore.default.joinGroup(this.props.groupId).then(() => {// don't reset membershipBusy here: wait for the membership change to come down the sync
    }).catch(e => {
      this.setState({
        membershipBusy: false
      });
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Error joining room', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Error"),
        description: (0, _languageHandler._t)("Unable to join community")
      });
    });
  },
  _leaveGroupWarnings: function () {
    const warnings = [];

    if (this.state.isUserPrivileged) {
      warnings.push( /*#__PURE__*/_react.default.createElement("span", {
        className: "warning"
      }, " "
      /* Whitespace, otherwise the sentences get smashed together */
      , (0, _languageHandler._t)("You are an administrator of this community. You will not be " + "able to rejoin without an invite from another administrator.")));
    }

    return warnings;
  },
  _onLeaveClick: function () {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

    const warnings = this._leaveGroupWarnings();

    _Modal.default.createTrackedDialog('Leave Group', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Leave Community"),
      description: /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Leave %(groupName)s?", {
        groupName: this.props.groupId
      }), warnings),
      button: (0, _languageHandler._t)("Leave"),
      danger: this.state.isUserPrivileged,
      onFinished: async confirmed => {
        if (!confirmed) return;
        this.setState({
          membershipBusy: true
        }); // Wait 500ms to prevent flashing. Do this before sending a request otherwise we risk the
        // spinner disappearing after we have fetched new group data.

        await (0, _promise.sleep)(500);

        _GroupStore.default.leaveGroup(this.props.groupId).then(() => {// don't reset membershipBusy here: wait for the membership change to come down the sync
        }).catch(e => {
          this.setState({
            membershipBusy: false
          });
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Error leaving community', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Error"),
            description: (0, _languageHandler._t)("Unable to leave community")
          });
        });
      }
    });
  },
  _onAddRoomsClick: function () {
    (0, _GroupAddressPicker.showGroupAddRoomDialog)(this.props.groupId);
  },
  _getGroupSection: function () {
    const groupSettingsSectionClasses = (0, _classnames.default)({
      "mx_GroupView_group": this.state.editing,
      "mx_GroupView_group_disabled": this.state.editing && !this.state.isUserPrivileged
    });
    const header = this.state.editing ? /*#__PURE__*/_react.default.createElement("h2", null, " ", (0, _languageHandler._t)('Community Settings'), " ") : /*#__PURE__*/_react.default.createElement("div", null);
    const hostingSignupLink = (0, _HostingLink.getHostingLink)('community-settings');
    let hostingSignup = null;

    if (hostingSignupLink && this.state.isUserPrivileged) {
      hostingSignup = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_hostingSignup"
      }, (0, _languageHandler._t)("Want more than a community? <a>Get your own server</a>", {}, {
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: hostingSignupLink,
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      }), /*#__PURE__*/_react.default.createElement("a", {
        href: hostingSignupLink,
        target: "_blank",
        rel: "noreferrer noopener"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../res/img/external-link.svg"),
        width: "11",
        height: "10",
        alt: ""
      })));
    }

    const changeDelayWarning = this.state.editing && this.state.isUserPrivileged ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_changeDelayWarning"
    }, (0, _languageHandler._t)('Changes made to your community <bold1>name</bold1> and <bold2>avatar</bold2> ' + 'might not be seen by other users for up to 30 minutes.', {}, {
      'bold1': sub => /*#__PURE__*/_react.default.createElement("b", null, " ", sub, " "),
      'bold2': sub => /*#__PURE__*/_react.default.createElement("b", null, " ", sub, " ")
    })) : /*#__PURE__*/_react.default.createElement("div", null);
    return /*#__PURE__*/_react.default.createElement("div", {
      className: groupSettingsSectionClasses
    }, header, hostingSignup, changeDelayWarning, this._getJoinableNode(), this._getLongDescriptionNode(), this._getRoomsNode());
  },
  _getRoomsNode: function () {
    const RoomDetailList = sdk.getComponent('rooms.RoomDetailList');
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const TintableSvg = sdk.getComponent('elements.TintableSvg');
    const Spinner = sdk.getComponent('elements.Spinner');
    const TooltipButton = sdk.getComponent('elements.TooltipButton');
    const roomsHelpNode = this.state.editing ? /*#__PURE__*/_react.default.createElement(TooltipButton, {
      helpText: (0, _languageHandler._t)('These rooms are displayed to community members on the community page. ' + 'Community members can join the rooms by clicking on them.')
    }) : /*#__PURE__*/_react.default.createElement("div", null);
    const addRoomRow = this.state.editing ? /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_GroupView_rooms_header_addRow",
      onClick: this._onAddRoomsClick
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_rooms_header_addRow_button"
    }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
      src: require("../../../res/img/icons-room-add.svg"),
      width: "24",
      height: "24"
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_rooms_header_addRow_label"
    }, (0, _languageHandler._t)('Add rooms to this community'))) : /*#__PURE__*/_react.default.createElement("div", null);
    const roomDetailListClassName = (0, _classnames.default)({
      "mx_fadable": true,
      "mx_fadable_faded": this.state.editing
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_rooms"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_rooms_header"
    }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)('Rooms'), roomsHelpNode), addRoomRow), this.state.groupRoomsLoading ? /*#__PURE__*/_react.default.createElement(Spinner, null) : /*#__PURE__*/_react.default.createElement(RoomDetailList, {
      rooms: this.state.groupRooms,
      className: roomDetailListClassName
    }));
  },
  _getFeaturedRoomsNode: function () {
    const summary = this.state.summary;
    const defaultCategoryRooms = [];
    const categoryRooms = {};
    summary.rooms_section.rooms.forEach(r => {
      if (r.category_id === null) {
        defaultCategoryRooms.push(r);
      } else {
        let list = categoryRooms[r.category_id];

        if (list === undefined) {
          list = [];
          categoryRooms[r.category_id] = list;
        }

        list.push(r);
      }
    });

    const defaultCategoryNode = /*#__PURE__*/_react.default.createElement(CategoryRoomList, {
      rooms: defaultCategoryRooms,
      groupId: this.props.groupId,
      editing: this.state.editing
    });

    const categoryRoomNodes = Object.keys(categoryRooms).map(catId => {
      const cat = summary.rooms_section.categories[catId];
      return /*#__PURE__*/_react.default.createElement(CategoryRoomList, {
        key: catId,
        rooms: categoryRooms[catId],
        category: cat,
        groupId: this.props.groupId,
        editing: this.state.editing
      });
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_header"
    }, (0, _languageHandler._t)('Featured Rooms:')), defaultCategoryNode, categoryRoomNodes);
  },
  _getFeaturedUsersNode: function () {
    const summary = this.state.summary;
    const noRoleUsers = [];
    const roleUsers = {};
    summary.users_section.users.forEach(u => {
      if (u.role_id === null) {
        noRoleUsers.push(u);
      } else {
        let list = roleUsers[u.role_id];

        if (list === undefined) {
          list = [];
          roleUsers[u.role_id] = list;
        }

        list.push(u);
      }
    });

    const noRoleNode = /*#__PURE__*/_react.default.createElement(RoleUserList, {
      users: noRoleUsers,
      groupId: this.props.groupId,
      editing: this.state.editing
    });

    const roleUserNodes = Object.keys(roleUsers).map(roleId => {
      const role = summary.users_section.roles[roleId];
      return /*#__PURE__*/_react.default.createElement(RoleUserList, {
        key: roleId,
        users: roleUsers[roleId],
        role: role,
        groupId: this.props.groupId,
        editing: this.state.editing
      });
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_featuredThings_header"
    }, (0, _languageHandler._t)('Featured Users:')), noRoleNode, roleUserNodes);
  },
  _getMembershipSection: function () {
    const Spinner = sdk.getComponent("elements.Spinner");
    const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");

    const group = this._matrixClient.getGroup(this.props.groupId);

    if (group && group.myMembership === 'invite') {
      if (this.state.membershipBusy || this.state.inviterProfileBusy) {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_GroupView_membershipSection"
        }, /*#__PURE__*/_react.default.createElement(Spinner, null));
      }

      const httpInviterAvatar = this.state.inviterProfile ? this._matrixClient.mxcUrlToHttp(this.state.inviterProfile.avatarUrl, 36, 36) : null;
      let inviterName = group.inviter.userId;

      if (this.state.inviterProfile) {
        inviterName = this.state.inviterProfile.displayName || group.inviter.userId;
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_membershipSection mx_GroupView_membershipSection_invited"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_membershipSubSection"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_membershipSection_description"
      }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
        url: httpInviterAvatar,
        name: inviterName,
        width: 36,
        height: 36
      }), (0, _languageHandler._t)("%(inviter)s has invited you to join this community", {
        inviter: inviterName
      })), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_membership_buttonContainer"
      }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_GroupView_textButton mx_RoomHeader_textButton",
        onClick: this._onAcceptInviteClick
      }, (0, _languageHandler._t)("Accept")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_GroupView_textButton mx_RoomHeader_textButton",
        onClick: this._onRejectInviteClick
      }, (0, _languageHandler._t)("Decline")))));
    }

    let membershipContainerExtraClasses;
    let membershipButtonExtraClasses;
    let membershipButtonTooltip;
    let membershipButtonText;
    let membershipButtonOnClick; // User is not in the group

    if ((!group || group.myMembership === 'leave') && this.state.summary && this.state.summary.profile && Boolean(this.state.summary.profile.is_openly_joinable)) {
      membershipButtonText = (0, _languageHandler._t)("Join this community");
      membershipButtonOnClick = this._onJoinClick;
      membershipButtonExtraClasses = 'mx_GroupView_joinButton';
      membershipContainerExtraClasses = 'mx_GroupView_membershipSection_leave';
    } else if (group && group.myMembership === 'join' && this.state.editing) {
      membershipButtonText = (0, _languageHandler._t)("Leave this community");
      membershipButtonOnClick = this._onLeaveClick;
      membershipButtonTooltip = this.state.isUserPrivileged ? (0, _languageHandler._t)("You are an administrator of this community") : (0, _languageHandler._t)("You are a member of this community");
      membershipButtonExtraClasses = {
        'mx_GroupView_leaveButton': true,
        'mx_RoomHeader_textButton_danger': this.state.isUserPrivileged
      };
      membershipContainerExtraClasses = 'mx_GroupView_membershipSection_joined';
    } else {
      return null;
    }

    const membershipButtonClasses = (0, _classnames.default)(['mx_RoomHeader_textButton', 'mx_GroupView_textButton'], membershipButtonExtraClasses);
    const membershipContainerClasses = (0, _classnames.default)('mx_GroupView_membershipSection', membershipContainerExtraClasses);
    return /*#__PURE__*/_react.default.createElement("div", {
      className: membershipContainerClasses
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_membershipSubSection"
    }, this.state.membershipBusy ? /*#__PURE__*/_react.default.createElement(Spinner, null) : /*#__PURE__*/_react.default.createElement("div", null), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_membership_buttonContainer"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: membershipButtonClasses,
      onClick: membershipButtonOnClick,
      title: membershipButtonTooltip
    }, membershipButtonText))));
  },
  _getJoinableNode: function () {
    const InlineSpinner = sdk.getComponent('elements.InlineSpinner');
    return this.state.editing ? /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)('Who can join this community?'), this.state.groupJoinableLoading ? /*#__PURE__*/_react.default.createElement(InlineSpinner, null) : /*#__PURE__*/_react.default.createElement("div", null)), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      value: GROUP_JOINPOLICY_INVITE,
      checked: this.state.joinableForm.policyType === GROUP_JOINPOLICY_INVITE,
      onChange: this._onJoinableChange
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_label_text"
    }, (0, _languageHandler._t)('Only people who have been invited')))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement("input", {
      type: "radio",
      value: GROUP_JOINPOLICY_OPEN,
      checked: this.state.joinableForm.policyType === GROUP_JOINPOLICY_OPEN,
      onChange: this._onJoinableChange
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_label_text"
    }, (0, _languageHandler._t)('Everyone'))))) : null;
  },
  _getLongDescriptionNode: function () {
    const summary = this.state.summary;
    let description = null;

    if (summary.profile && summary.profile.long_description) {
      description = (0, _HtmlUtils.sanitizedHtmlNode)(summary.profile.long_description);
    } else if (this.state.isUserPrivileged) {
      description = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_groupDesc_placeholder",
        onClick: this._onEditClick
      }, (0, _languageHandler._t)('Your community hasn\'t got a Long Description, a HTML page to show to community members.<br />' + 'Click here to open settings and give it one!', {}, {
        'br': /*#__PURE__*/_react.default.createElement("br", null)
      }));
    }

    const groupDescEditingClasses = (0, _classnames.default)({
      "mx_GroupView_groupDesc": true,
      "mx_GroupView_groupDesc_disabled": !this.state.isUserPrivileged
    });
    return this.state.editing ? /*#__PURE__*/_react.default.createElement("div", {
      className: groupDescEditingClasses
    }, /*#__PURE__*/_react.default.createElement("h3", null, " ", (0, _languageHandler._t)("Long Description (HTML)"), " "), /*#__PURE__*/_react.default.createElement("textarea", {
      value: this.state.profileForm.long_description,
      placeholder: (0, _languageHandler._t)(LONG_DESC_PLACEHOLDER),
      onChange: this._onLongDescChange,
      tabIndex: "4",
      key: "editLongDesc"
    })) : /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_GroupView_groupDesc"
    }, description);
  },
  render: function () {
    const GroupAvatar = sdk.getComponent("avatars.GroupAvatar");
    const Spinner = sdk.getComponent("elements.Spinner");

    if (this.state.summaryLoading && this.state.error === null || this.state.saving) {
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else if (this.state.summary && !this.state.error) {
      const summary = this.state.summary;
      let avatarNode;
      let nameNode;
      let shortDescNode;
      const rightButtons = [];

      if (this.state.editing && this.state.isUserPrivileged) {
        let avatarImage;

        if (this.state.uploadingAvatar) {
          avatarImage = /*#__PURE__*/_react.default.createElement(Spinner, null);
        } else {
          const GroupAvatar = sdk.getComponent('avatars.GroupAvatar');
          avatarImage = /*#__PURE__*/_react.default.createElement(GroupAvatar, {
            groupId: this.props.groupId,
            groupName: this.state.profileForm.name,
            groupAvatarUrl: this.state.profileForm.avatar_url,
            width: 28,
            height: 28,
            resizeMethod: "crop"
          });
        }

        avatarNode = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_GroupView_avatarPicker"
        }, /*#__PURE__*/_react.default.createElement("label", {
          htmlFor: "avatarInput",
          className: "mx_GroupView_avatarPicker_label"
        }, avatarImage), /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_GroupView_avatarPicker_edit"
        }, /*#__PURE__*/_react.default.createElement("label", {
          htmlFor: "avatarInput",
          className: "mx_GroupView_avatarPicker_label"
        }, /*#__PURE__*/_react.default.createElement("img", {
          src: require("../../../res/img/camera.svg"),
          alt: (0, _languageHandler._t)("Upload avatar"),
          title: (0, _languageHandler._t)("Upload avatar"),
          width: "17",
          height: "15"
        })), /*#__PURE__*/_react.default.createElement("input", {
          id: "avatarInput",
          className: "mx_GroupView_uploadInput",
          type: "file",
          onChange: this._onAvatarSelected
        })));
        const EditableText = sdk.getComponent("elements.EditableText");
        nameNode = /*#__PURE__*/_react.default.createElement(EditableText, {
          className: "mx_GroupView_editable",
          placeholderClassName: "mx_GroupView_placeholder",
          placeholder: (0, _languageHandler._t)('Community Name'),
          blurToCancel: false,
          initialValue: this.state.profileForm.name,
          onValueChanged: this._onNameChange,
          tabIndex: "0",
          dir: "auto"
        });
        shortDescNode = /*#__PURE__*/_react.default.createElement(EditableText, {
          className: "mx_GroupView_editable",
          placeholderClassName: "mx_GroupView_placeholder",
          placeholder: (0, _languageHandler._t)("Description"),
          blurToCancel: false,
          initialValue: this.state.profileForm.short_description,
          onValueChanged: this._onShortDescChange,
          tabIndex: "0",
          dir: "auto"
        });
      } else {
        const onGroupHeaderItemClick = this.state.isUserMember ? this._onEditClick : null;
        const groupAvatarUrl = summary.profile ? summary.profile.avatar_url : null;
        const groupName = summary.profile ? summary.profile.name : null;
        avatarNode = /*#__PURE__*/_react.default.createElement(GroupAvatar, {
          groupId: this.props.groupId,
          groupAvatarUrl: groupAvatarUrl,
          groupName: groupName,
          onClick: onGroupHeaderItemClick,
          width: 28,
          height: 28
        });

        if (summary.profile && summary.profile.name) {
          nameNode = /*#__PURE__*/_react.default.createElement("div", {
            onClick: onGroupHeaderItemClick
          }, /*#__PURE__*/_react.default.createElement("span", null, summary.profile.name), /*#__PURE__*/_react.default.createElement("span", {
            className: "mx_GroupView_header_groupid"
          }, "(", this.props.groupId, ")"));
        } else {
          nameNode = /*#__PURE__*/_react.default.createElement("span", {
            onClick: onGroupHeaderItemClick
          }, this.props.groupId);
        }

        if (summary.profile && summary.profile.short_description) {
          shortDescNode = /*#__PURE__*/_react.default.createElement("span", {
            onClick: onGroupHeaderItemClick
          }, summary.profile.short_description);
        }
      }

      if (this.state.editing) {
        rightButtons.push( /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_GroupView_textButton mx_RoomHeader_textButton",
          key: "_saveButton",
          onClick: this._onSaveClick
        }, (0, _languageHandler._t)('Save')));
        rightButtons.push( /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_RoomHeader_cancelButton",
          key: "_cancelButton",
          onClick: this._onCancelClick
        }, /*#__PURE__*/_react.default.createElement("img", {
          src: require("../../../res/img/cancel.svg"),
          className: "mx_filterFlipColor",
          width: "18",
          height: "18",
          alt: (0, _languageHandler._t)("Cancel")
        })));
      } else {
        if (summary.user && summary.user.membership === 'join') {
          rightButtons.push( /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
            className: "mx_GroupHeader_button mx_GroupHeader_editButton",
            key: "_editButton",
            onClick: this._onEditClick,
            title: (0, _languageHandler._t)("Community Settings")
          }));
        }

        rightButtons.push( /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_GroupHeader_button mx_GroupHeader_shareButton",
          key: "_shareButton",
          onClick: this._onShareClick,
          title: (0, _languageHandler._t)('Share Community')
        }));
      }

      const rightPanel = this.state.showRightPanel ? /*#__PURE__*/_react.default.createElement(_RightPanel.default, {
        groupId: this.props.groupId
      }) : undefined;
      const headerClasses = {
        "mx_GroupView_header": true,
        "light-panel": true,
        "mx_GroupView_header_view": !this.state.editing,
        "mx_GroupView_header_isUserMember": this.state.isUserMember
      };
      return /*#__PURE__*/_react.default.createElement("main", {
        className: "mx_GroupView"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: (0, _classnames.default)(headerClasses)
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_leftCol"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_avatar"
      }, avatarNode), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_info"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_name"
      }, nameNode), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_shortDesc"
      }, shortDescNode))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_GroupView_header_rightCol"
      }, rightButtons), /*#__PURE__*/_react.default.createElement(_GroupHeaderButtons.default, null)), /*#__PURE__*/_react.default.createElement(_MainSplit.default, {
        panel: rightPanel
      }, /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
        className: "mx_GroupView_body"
      }, this._getMembershipSection(), this._getGroupSection())));
    } else if (this.state.error) {
      if (this.state.error.httpStatus === 404) {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_GroupView_error"
        }, (0, _languageHandler._t)('Community %(groupId)s not found', {
          groupId: this.props.groupId
        }));
      } else {
        let extraText;

        if (this.state.error.errcode === 'M_UNRECOGNIZED') {
          extraText = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('This homeserver does not support communities'));
        }

        return /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_GroupView_error"
        }, (0, _languageHandler._t)('Failed to load %(groupId)s', {
          groupId: this.props.groupId
        }), extraText);
      }
    } else {
      console.error("Invalid state for GroupView");
      return /*#__PURE__*/_react.default.createElement("div", null);
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvR3JvdXBWaWV3LmpzIl0sIm5hbWVzIjpbIkxPTkdfREVTQ19QTEFDRUhPTERFUiIsIlJvb21TdW1tYXJ5VHlwZSIsIlByb3BUeXBlcyIsInNoYXBlIiwicm9vbV9pZCIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJwcm9maWxlIiwibmFtZSIsImF2YXRhcl91cmwiLCJjYW5vbmljYWxfYWxpYXMiLCJVc2VyU3VtbWFyeVR5cGUiLCJzdW1tYXJ5SW5mbyIsInVzZXJfaWQiLCJyb2xlX2lkIiwiZGlzcGxheW5hbWUiLCJDYXRlZ29yeVJvb21MaXN0IiwiZGlzcGxheU5hbWUiLCJwcm9wcyIsInJvb21zIiwiYXJyYXlPZiIsImNhdGVnb3J5IiwiZ3JvdXBJZCIsImVkaXRpbmciLCJib29sIiwib25BZGRSb29tc1RvU3VtbWFyeUNsaWNrZWQiLCJldiIsInByZXZlbnREZWZhdWx0IiwiQWRkcmVzc1BpY2tlckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJwbGFjZWhvbGRlciIsImJ1dHRvbiIsInBpY2tlclR5cGUiLCJ2YWxpZEFkZHJlc3NUeXBlcyIsIm9uRmluaXNoZWQiLCJzdWNjZXNzIiwiYWRkcnMiLCJlcnJvckxpc3QiLCJtYXAiLCJhZGRyIiwiR3JvdXBTdG9yZSIsImFkZFJvb21Ub0dyb3VwU3VtbWFyeSIsImFkZHJlc3MiLCJjYXRjaCIsInB1c2giLCJ0aGVuIiwibGVuZ3RoIiwiRXJyb3JEaWFsb2ciLCJqb2luIiwicmVuZGVyIiwiVGludGFibGVTdmciLCJhZGRCdXR0b24iLCJyZXF1aXJlIiwicm9vbU5vZGVzIiwiciIsImNhdEhlYWRlciIsIkZlYXR1cmVkUm9vbSIsIm9uQ2xpY2siLCJlIiwic3RvcFByb3BhZ2F0aW9uIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJyb29tX2FsaWFzIiwib25EZWxldGVDbGlja2VkIiwicmVtb3ZlUm9vbUZyb21Hcm91cFN1bW1hcnkiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJyb29tTmFtZSIsIlJvb21BdmF0YXIiLCJvb2JEYXRhIiwicm9vbUlkIiwiYXZhdGFyVXJsIiwicGVybWFsaW5rIiwicm9vbU5hbWVOb2RlIiwiZGVsZXRlQnV0dG9uIiwiUm9sZVVzZXJMaXN0IiwidXNlcnMiLCJyb2xlIiwib25BZGRVc2Vyc0NsaWNrZWQiLCJzaG91bGRPbWl0U2VsZiIsImFkZFVzZXJUb0dyb3VwU3VtbWFyeSIsInVzZXJOb2RlcyIsInUiLCJyb2xlSGVhZGVyIiwiRmVhdHVyZWRVc2VyIiwicmVtb3ZlVXNlckZyb21Hcm91cFN1bW1hcnkiLCJCYXNlQXZhdGFyIiwidXNlck5hbWVOb2RlIiwiaHR0cFVybCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm14Y1VybFRvSHR0cCIsIkdST1VQX0pPSU5QT0xJQ1lfT1BFTiIsIkdST1VQX0pPSU5QT0xJQ1lfSU5WSVRFIiwicHJvcFR5cGVzIiwiZ3JvdXBJc05ldyIsImdldEluaXRpYWxTdGF0ZSIsInN1bW1hcnkiLCJpc0dyb3VwUHVibGljaXNlZCIsImlzVXNlclByaXZpbGVnZWQiLCJncm91cFJvb21zIiwiZ3JvdXBSb29tc0xvYWRpbmciLCJzYXZpbmciLCJ1cGxvYWRpbmdBdmF0YXIiLCJhdmF0YXJDaGFuZ2VkIiwibWVtYmVyc2hpcEJ1c3kiLCJwdWJsaWNpdHlCdXN5IiwiaW52aXRlclByb2ZpbGUiLCJzaG93UmlnaHRQYW5lbCIsIlJpZ2h0UGFuZWxTdG9yZSIsImdldFNoYXJlZEluc3RhbmNlIiwiaXNPcGVuRm9yR3JvdXAiLCJjb21wb25lbnREaWRNb3VudCIsIl91bm1vdW50ZWQiLCJfbWF0cml4Q2xpZW50Iiwib24iLCJfb25Hcm91cE15TWVtYmVyc2hpcCIsIl9pbml0R3JvdXBTdG9yZSIsIl9kaXNwYXRjaGVyUmVmIiwicmVnaXN0ZXIiLCJfb25BY3Rpb24iLCJfcmlnaHRQYW5lbFN0b3JlVG9rZW4iLCJhZGRMaXN0ZW5lciIsIl9vblJpZ2h0UGFuZWxTdG9yZVVwZGF0ZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJ1bnJlZ2lzdGVyIiwicmVtb3ZlIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXdQcm9wcyIsInNldFN0YXRlIiwiZ3JvdXAiLCJteU1lbWJlcnNoaXAiLCJfY2xvc2VTZXR0aW5ncyIsImZpcnN0SW5pdCIsImdldEdyb3VwIiwiaW52aXRlciIsInVzZXJJZCIsIl9mZXRjaEludml0ZXJQcm9maWxlIiwicmVnaXN0ZXJMaXN0ZW5lciIsIm9uR3JvdXBTdG9yZVVwZGF0ZWQiLCJiaW5kIiwid2lsbERvT25ib2FyZGluZyIsImVycm9yR3JvdXBJZCIsInN0YXRlS2V5IiwiZXJyY29kZSIsImRlZmVycmVkX2FjdGlvbiIsImdyb3VwX2lkIiwic2NyZWVuX2FmdGVyIiwic2NyZWVuIiwiU1RBVEVfS0VZIiwiU3VtbWFyeSIsImdldFN1bW1hcnkiLCJmb3JFYWNoIiwiayIsInN1bW1hcnlMb2FkaW5nIiwiaXNTdGF0ZVJlYWR5IiwiZ2V0R3JvdXBQdWJsaWNpdHkiLCJnZXRHcm91cFJvb21zIiwiR3JvdXBSb29tcyIsImlzVXNlck1lbWJlciIsImdldEdyb3VwTWVtYmVycyIsInNvbWUiLCJtIiwiY3JlZGVudGlhbHMiLCJfb25FZGl0Q2xpY2siLCJpbnZpdGVyUHJvZmlsZUJ1c3kiLCJnZXRQcm9maWxlSW5mbyIsInJlc3AiLCJmaW5hbGx5IiwicHJvZmlsZUZvcm0iLCJPYmplY3QiLCJhc3NpZ24iLCJzdGF0ZSIsImpvaW5hYmxlRm9ybSIsInBvbGljeVR5cGUiLCJpc19vcGVubHlfam9pbmFibGUiLCJfb25TaGFyZUNsaWNrIiwiU2hhcmVEaWFsb2ciLCJ0YXJnZXQiLCJHcm91cCIsIl9vbkNhbmNlbENsaWNrIiwicGF5bG9hZCIsIl9vbk5hbWVDaGFuZ2UiLCJ2YWx1ZSIsIm5ld1Byb2ZpbGVGb3JtIiwiX29uU2hvcnREZXNjQ2hhbmdlIiwic2hvcnRfZGVzY3JpcHRpb24iLCJfb25Mb25nRGVzY0NoYW5nZSIsImxvbmdfZGVzY3JpcHRpb24iLCJfb25BdmF0YXJTZWxlY3RlZCIsImZpbGUiLCJmaWxlcyIsInVwbG9hZENvbnRlbnQiLCJ1cmwiLCJfb25Kb2luYWJsZUNoYW5nZSIsIl9vblNhdmVDbGljayIsInNhdmVQcm9taXNlIiwiX3NhdmVHcm91cCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVzdWx0IiwiRmxhaXJTdG9yZSIsInJlZnJlc2hHcm91cFByb2ZpbGUiLCJzZXRHcm91cFByb2ZpbGUiLCJzZXRHcm91cEpvaW5Qb2xpY3kiLCJ0eXBlIiwiX29uQWNjZXB0SW52aXRlQ2xpY2siLCJhY2NlcHRHcm91cEludml0ZSIsIl9vblJlamVjdEludml0ZUNsaWNrIiwibGVhdmVHcm91cCIsIl9vbkpvaW5DbGljayIsImlzR3Vlc3QiLCJqb2luR3JvdXAiLCJfbGVhdmVHcm91cFdhcm5pbmdzIiwid2FybmluZ3MiLCJfb25MZWF2ZUNsaWNrIiwiUXVlc3Rpb25EaWFsb2ciLCJncm91cE5hbWUiLCJkYW5nZXIiLCJjb25maXJtZWQiLCJfb25BZGRSb29tc0NsaWNrIiwiX2dldEdyb3VwU2VjdGlvbiIsImdyb3VwU2V0dGluZ3NTZWN0aW9uQ2xhc3NlcyIsImhlYWRlciIsImhvc3RpbmdTaWdudXBMaW5rIiwiaG9zdGluZ1NpZ251cCIsImEiLCJzdWIiLCJjaGFuZ2VEZWxheVdhcm5pbmciLCJfZ2V0Sm9pbmFibGVOb2RlIiwiX2dldExvbmdEZXNjcmlwdGlvbk5vZGUiLCJfZ2V0Um9vbXNOb2RlIiwiUm9vbURldGFpbExpc3QiLCJBY2Nlc3NpYmxlQnV0dG9uIiwiU3Bpbm5lciIsIlRvb2x0aXBCdXR0b24iLCJyb29tc0hlbHBOb2RlIiwiYWRkUm9vbVJvdyIsInJvb21EZXRhaWxMaXN0Q2xhc3NOYW1lIiwiX2dldEZlYXR1cmVkUm9vbXNOb2RlIiwiZGVmYXVsdENhdGVnb3J5Um9vbXMiLCJjYXRlZ29yeVJvb21zIiwicm9vbXNfc2VjdGlvbiIsImNhdGVnb3J5X2lkIiwibGlzdCIsInVuZGVmaW5lZCIsImRlZmF1bHRDYXRlZ29yeU5vZGUiLCJjYXRlZ29yeVJvb21Ob2RlcyIsImtleXMiLCJjYXRJZCIsImNhdCIsImNhdGVnb3JpZXMiLCJfZ2V0RmVhdHVyZWRVc2Vyc05vZGUiLCJub1JvbGVVc2VycyIsInJvbGVVc2VycyIsInVzZXJzX3NlY3Rpb24iLCJub1JvbGVOb2RlIiwicm9sZVVzZXJOb2RlcyIsInJvbGVJZCIsInJvbGVzIiwiX2dldE1lbWJlcnNoaXBTZWN0aW9uIiwiaHR0cEludml0ZXJBdmF0YXIiLCJpbnZpdGVyTmFtZSIsIm1lbWJlcnNoaXBDb250YWluZXJFeHRyYUNsYXNzZXMiLCJtZW1iZXJzaGlwQnV0dG9uRXh0cmFDbGFzc2VzIiwibWVtYmVyc2hpcEJ1dHRvblRvb2x0aXAiLCJtZW1iZXJzaGlwQnV0dG9uVGV4dCIsIm1lbWJlcnNoaXBCdXR0b25PbkNsaWNrIiwiQm9vbGVhbiIsIm1lbWJlcnNoaXBCdXR0b25DbGFzc2VzIiwibWVtYmVyc2hpcENvbnRhaW5lckNsYXNzZXMiLCJJbmxpbmVTcGlubmVyIiwiZ3JvdXBKb2luYWJsZUxvYWRpbmciLCJncm91cERlc2NFZGl0aW5nQ2xhc3NlcyIsIkdyb3VwQXZhdGFyIiwiYXZhdGFyTm9kZSIsIm5hbWVOb2RlIiwic2hvcnREZXNjTm9kZSIsInJpZ2h0QnV0dG9ucyIsImF2YXRhckltYWdlIiwiRWRpdGFibGVUZXh0Iiwib25Hcm91cEhlYWRlckl0ZW1DbGljayIsImdyb3VwQXZhdGFyVXJsIiwidXNlciIsIm1lbWJlcnNoaXAiLCJyaWdodFBhbmVsIiwiaGVhZGVyQ2xhc3NlcyIsImh0dHBTdGF0dXMiLCJleHRyYVRleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztB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MEJBQU8seUNBQVA7QUFDSDtBQUNKO0FBcjhCMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZC5cbkNvcHlyaWdodCAyMDE3LCAyMDE4IE5ldyBWZWN0b3IgTHRkLlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBnZXRIb3N0aW5nTGluayB9IGZyb20gJy4uLy4uL3V0aWxzL0hvc3RpbmdMaW5rJztcbmltcG9ydCB7IHNhbml0aXplZEh0bWxOb2RlIH0gZnJvbSAnLi4vLi4vSHRtbFV0aWxzJztcbmltcG9ydCB7IF90LCBfdGQgfSBmcm9tICcuLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vdmlld3MvZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgR3JvdXBIZWFkZXJCdXR0b25zIGZyb20gJy4uL3ZpZXdzL3JpZ2h0X3BhbmVsL0dyb3VwSGVhZGVyQnV0dG9ucyc7XG5pbXBvcnQgTWFpblNwbGl0IGZyb20gJy4vTWFpblNwbGl0JztcbmltcG9ydCBSaWdodFBhbmVsIGZyb20gJy4vUmlnaHRQYW5lbCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vTW9kYWwnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmltcG9ydCBHcm91cFN0b3JlIGZyb20gJy4uLy4uL3N0b3Jlcy9Hcm91cFN0b3JlJztcbmltcG9ydCBGbGFpclN0b3JlIGZyb20gJy4uLy4uL3N0b3Jlcy9GbGFpclN0b3JlJztcbmltcG9ydCB7IHNob3dHcm91cEFkZFJvb21EaWFsb2cgfSBmcm9tICcuLi8uLi9Hcm91cEFkZHJlc3NQaWNrZXInO1xuaW1wb3J0IHttYWtlR3JvdXBQZXJtYWxpbmssIG1ha2VVc2VyUGVybWFsaW5rfSBmcm9tIFwiLi4vLi4vdXRpbHMvcGVybWFsaW5rcy9QZXJtYWxpbmtzXCI7XG5pbXBvcnQge0dyb3VwfSBmcm9tIFwibWF0cml4LWpzLXNka1wiO1xuaW1wb3J0IHthbGxTZXR0bGVkLCBzbGVlcH0gZnJvbSBcIi4uLy4uL3V0aWxzL3Byb21pc2VcIjtcbmltcG9ydCBSaWdodFBhbmVsU3RvcmUgZnJvbSBcIi4uLy4uL3N0b3Jlcy9SaWdodFBhbmVsU3RvcmVcIjtcbmltcG9ydCBBdXRvSGlkZVNjcm9sbGJhciBmcm9tIFwiLi9BdXRvSGlkZVNjcm9sbGJhclwiO1xuXG5jb25zdCBMT05HX0RFU0NfUExBQ0VIT0xERVIgPSBfdGQoXG5gPGgxPkhUTUwgZm9yIHlvdXIgY29tbXVuaXR5J3MgcGFnZTwvaDE+XG48cD5cbiAgICBVc2UgdGhlIGxvbmcgZGVzY3JpcHRpb24gdG8gaW50cm9kdWNlIG5ldyBtZW1iZXJzIHRvIHRoZSBjb21tdW5pdHksIG9yIGRpc3RyaWJ1dGVcbiAgICBzb21lIGltcG9ydGFudCA8YSBocmVmPVwiZm9vXCI+bGlua3M8L2E+XG48L3A+XG48cD5cbiAgICBZb3UgY2FuIGV2ZW4gdXNlICdpbWcnIHRhZ3NcbjwvcD5cbmApO1xuXG5jb25zdCBSb29tU3VtbWFyeVR5cGUgPSBQcm9wVHlwZXMuc2hhcGUoe1xuICAgIHJvb21faWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICBwcm9maWxlOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICBuYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBhdmF0YXJfdXJsOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBjYW5vbmljYWxfYWxpYXM6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSkuaXNSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBVc2VyU3VtbWFyeVR5cGUgPSBQcm9wVHlwZXMuc2hhcGUoe1xuICAgIHN1bW1hcnlJbmZvOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICB1c2VyX2lkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHJvbGVfaWQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGF2YXRhcl91cmw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGRpc3BsYXluYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIH0pLmlzUmVxdWlyZWQsXG59KTtcblxuY29uc3QgQ2F0ZWdvcnlSb29tTGlzdCA9IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQ2F0ZWdvcnlSb29tTGlzdCcsXG5cbiAgICBwcm9wczoge1xuICAgICAgICByb29tczogUHJvcFR5cGVzLmFycmF5T2YoUm9vbVN1bW1hcnlUeXBlKS5pc1JlcXVpcmVkLFxuICAgICAgICBjYXRlZ29yeTogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgICAgICAgIHByb2ZpbGU6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgICAgICAgICAgICAgbmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIH0pLmlzUmVxdWlyZWQsXG4gICAgICAgIH0pLFxuICAgICAgICBncm91cElkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gV2hldGhlciB0aGUgbGlzdCBzaG91bGQgYmUgZWRpdGFibGVcbiAgICAgICAgZWRpdGluZzogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgb25BZGRSb29tc1RvU3VtbWFyeUNsaWNrZWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IEFkZHJlc3NQaWNrZXJEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5BZGRyZXNzUGlja2VyRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdBZGQgUm9vbXMgdG8gR3JvdXAgU3VtbWFyeScsICcnLCBBZGRyZXNzUGlja2VyRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoJ0FkZCByb29tcyB0byB0aGUgY29tbXVuaXR5IHN1bW1hcnknKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcIldoaWNoIHJvb21zIHdvdWxkIHlvdSBsaWtlIHRvIGFkZCB0byB0aGlzIHN1bW1hcnk/XCIpLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF90KFwiUm9vbSBuYW1lIG9yIGFsaWFzXCIpLFxuICAgICAgICAgICAgYnV0dG9uOiBfdChcIkFkZCB0byBzdW1tYXJ5XCIpLFxuICAgICAgICAgICAgcGlja2VyVHlwZTogJ3Jvb20nLFxuICAgICAgICAgICAgdmFsaWRBZGRyZXNzVHlwZXM6IFsnbXgtcm9vbS1pZCddLFxuICAgICAgICAgICAgZ3JvdXBJZDogdGhpcy5wcm9wcy5ncm91cElkLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHN1Y2Nlc3MsIGFkZHJzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdWNjZXNzKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3JMaXN0ID0gW107XG4gICAgICAgICAgICAgICAgYWxsU2V0dGxlZChhZGRycy5tYXAoKGFkZHIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwU3RvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRSb29tVG9Hcm91cFN1bW1hcnkodGhpcy5wcm9wcy5ncm91cElkLCBhZGRyLmFkZHJlc3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4geyBlcnJvckxpc3QucHVzaChhZGRyLmFkZHJlc3MpOyB9KTtcbiAgICAgICAgICAgICAgICB9KSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvckxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICdGYWlsZWQgdG8gYWRkIHRoZSBmb2xsb3dpbmcgcm9vbSB0byB0aGUgZ3JvdXAgc3VtbWFyeScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnJywgRXJyb3JEaWFsb2csXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBhZGQgdGhlIGZvbGxvd2luZyByb29tcyB0byB0aGUgc3VtbWFyeSBvZiAlKGdyb3VwSWQpczpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Z3JvdXBJZDogdGhpcy5wcm9wcy5ncm91cElkfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZXJyb3JMaXN0LmpvaW4oXCIsIFwiKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCAvKmNsYXNzTmFtZT0qL251bGwsIC8qaXNQcmlvcml0eT0qL2ZhbHNlLCAvKmlzU3RhdGljPSovdHJ1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFRpbnRhYmxlU3ZnID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlRpbnRhYmxlU3ZnXCIpO1xuICAgICAgICBjb25zdCBhZGRCdXR0b24gPSB0aGlzLnByb3BzLmVkaXRpbmcgP1xuICAgICAgICAgICAgKDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nc19hZGRCdXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25BZGRSb29tc1RvU3VtbWFyeUNsaWNrZWR9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFRpbnRhYmxlU3ZnIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uL3Jlcy9pbWcvaWNvbnMtY3JlYXRlLXJvb20uc3ZnXCIpfSB3aWR0aD1cIjY0XCIgaGVpZ2h0PVwiNjRcIiAvPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2ZlYXR1cmVkVGhpbmdzX2FkZEJ1dHRvbl9sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdBZGQgYSBSb29tJykgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPikgOiA8ZGl2IC8+O1xuXG4gICAgICAgIGNvbnN0IHJvb21Ob2RlcyA9IHRoaXMucHJvcHMucm9vbXMubWFwKChyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPEZlYXR1cmVkUm9vbVxuICAgICAgICAgICAgICAgIGtleT17ci5yb29tX2lkfVxuICAgICAgICAgICAgICAgIGdyb3VwSWQ9e3RoaXMucHJvcHMuZ3JvdXBJZH1cbiAgICAgICAgICAgICAgICBlZGl0aW5nPXt0aGlzLnByb3BzLmVkaXRpbmd9XG4gICAgICAgICAgICAgICAgc3VtbWFyeUluZm89e3J9IC8+O1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgY2F0SGVhZGVyID0gPGRpdiAvPjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuY2F0ZWdvcnkgJiYgdGhpcy5wcm9wcy5jYXRlZ29yeS5wcm9maWxlKSB7XG4gICAgICAgICAgICBjYXRIZWFkZXIgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nc19jYXRlZ29yeVwiPlxuICAgICAgICAgICAgeyB0aGlzLnByb3BzLmNhdGVnb3J5LnByb2ZpbGUubmFtZSB9XG4gICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfY29udGFpbmVyXCI+XG4gICAgICAgICAgICB7IGNhdEhlYWRlciB9XG4gICAgICAgICAgICB7IHJvb21Ob2RlcyB9XG4gICAgICAgICAgICB7IGFkZEJ1dHRvbiB9XG4gICAgICAgIDwvZGl2PjtcbiAgICB9LFxufSk7XG5cbmNvbnN0IEZlYXR1cmVkUm9vbSA9IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnRmVhdHVyZWRSb29tJyxcblxuICAgIHByb3BzOiB7XG4gICAgICAgIHN1bW1hcnlJbmZvOiBSb29tU3VtbWFyeVR5cGUuaXNSZXF1aXJlZCxcbiAgICAgICAgZWRpdGluZzogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgZ3JvdXBJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBvbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgIHJvb21fYWxpYXM6IHRoaXMucHJvcHMuc3VtbWFyeUluZm8ucHJvZmlsZS5jYW5vbmljYWxfYWxpYXMsXG4gICAgICAgICAgICByb29tX2lkOiB0aGlzLnByb3BzLnN1bW1hcnlJbmZvLnJvb21faWQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkRlbGV0ZUNsaWNrZWQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBHcm91cFN0b3JlLnJlbW92ZVJvb21Gcm9tR3JvdXBTdW1tYXJ5KFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5ncm91cElkLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby5yb29tX2lkLFxuICAgICAgICApLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHdoaWxzdCByZW1vdmluZyByb29tIGZyb20gZ3JvdXAgc3VtbWFyeScsIGVycik7XG4gICAgICAgICAgICBjb25zdCByb29tTmFtZSA9IHRoaXMucHJvcHMuc3VtbWFyeUluZm8ubmFtZSB8fFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuc3VtbWFyeUluZm8uY2Fub25pY2FsX2FsaWFzIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby5yb29tX2lkO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXG4gICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byByZW1vdmUgcm9vbSBmcm9tIGdyb3VwIHN1bW1hcnknLFxuICAgICAgICAgICAgICAgICcnLCBFcnJvckRpYWxvZyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRmFpbGVkIHRvIHJlbW92ZSB0aGUgcm9vbSBmcm9tIHRoZSBzdW1tYXJ5IG9mICUoZ3JvdXBJZClzXCIsXG4gICAgICAgICAgICAgICAgICAgIHtncm91cElkOiB0aGlzLnByb3BzLmdyb3VwSWR9LFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiVGhlIHJvb20gJyUocm9vbU5hbWUpcycgY291bGQgbm90IGJlIHJlbW92ZWQgZnJvbSB0aGUgc3VtbWFyeS5cIiwge3Jvb21OYW1lfSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFJvb21BdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXZhdGFycy5Sb29tQXZhdGFyXCIpO1xuXG4gICAgICAgIGNvbnN0IHJvb21OYW1lID0gdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby5wcm9maWxlLm5hbWUgfHxcbiAgICAgICAgICAgIHRoaXMucHJvcHMuc3VtbWFyeUluZm8ucHJvZmlsZS5jYW5vbmljYWxfYWxpYXMgfHxcbiAgICAgICAgICAgIF90KFwiVW5uYW1lZCBSb29tXCIpO1xuXG4gICAgICAgIGNvbnN0IG9vYkRhdGEgPSB7XG4gICAgICAgICAgICByb29tSWQ6IHRoaXMucHJvcHMuc3VtbWFyeUluZm8ucm9vbV9pZCxcbiAgICAgICAgICAgIGF2YXRhclVybDogdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby5wcm9maWxlLmF2YXRhcl91cmwsXG4gICAgICAgICAgICBuYW1lOiByb29tTmFtZSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgcGVybWFsaW5rID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc3VtbWFyeUluZm8ucHJvZmlsZSAmJiB0aGlzLnByb3BzLnN1bW1hcnlJbmZvLnByb2ZpbGUuY2Fub25pY2FsX2FsaWFzKSB7XG4gICAgICAgICAgICBwZXJtYWxpbmsgPSBtYWtlR3JvdXBQZXJtYWxpbmsodGhpcy5wcm9wcy5zdW1tYXJ5SW5mby5wcm9maWxlLmNhbm9uaWNhbF9hbGlhcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vbU5hbWVOb2RlID0gbnVsbDtcbiAgICAgICAgaWYgKHBlcm1hbGluaykge1xuICAgICAgICAgICAgcm9vbU5hbWVOb2RlID0gPGEgaHJlZj17cGVybWFsaW5rfSBvbkNsaWNrPXt0aGlzLm9uQ2xpY2t9ID57IHJvb21OYW1lIH08L2E+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm9vbU5hbWVOb2RlID0gPHNwYW4+eyByb29tTmFtZSB9PC9zcGFuPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHRoaXMucHJvcHMuZWRpdGluZyA/XG4gICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2ZlYXR1cmVkVGhpbmdfZGVsZXRlQnV0dG9uXCJcbiAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL2NhbmNlbC1zbWFsbC5zdmdcIil9XG4gICAgICAgICAgICAgICAgd2lkdGg9XCIxNFwiXG4gICAgICAgICAgICAgICAgaGVpZ2h0PVwiMTRcIlxuICAgICAgICAgICAgICAgIGFsdD1cIkRlbGV0ZVwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkRlbGV0ZUNsaWNrZWR9IC8+XG4gICAgICAgICAgICA6IDxkaXYgLz47XG5cbiAgICAgICAgcmV0dXJuIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nXCIgb25DbGljaz17dGhpcy5vbkNsaWNrfT5cbiAgICAgICAgICAgIDxSb29tQXZhdGFyIG9vYkRhdGE9e29vYkRhdGF9IHdpZHRoPXs2NH0gaGVpZ2h0PXs2NH0gLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2ZlYXR1cmVkVGhpbmdfbmFtZVwiPnsgcm9vbU5hbWVOb2RlIH08L2Rpdj5cbiAgICAgICAgICAgIHsgZGVsZXRlQnV0dG9uIH1cbiAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICB9LFxufSk7XG5cbmNvbnN0IFJvbGVVc2VyTGlzdCA9IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUm9sZVVzZXJMaXN0JyxcblxuICAgIHByb3BzOiB7XG4gICAgICAgIHVzZXJzOiBQcm9wVHlwZXMuYXJyYXlPZihVc2VyU3VtbWFyeVR5cGUpLmlzUmVxdWlyZWQsXG4gICAgICAgIHJvbGU6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgICAgICAgICBwcm9maWxlOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICAgICAgICAgIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICB9KS5pc1JlcXVpcmVkLFxuICAgICAgICB9KSxcbiAgICAgICAgZ3JvdXBJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIFdoZXRoZXIgdGhlIGxpc3Qgc2hvdWxkIGJlIGVkaXRhYmxlXG4gICAgICAgIGVkaXRpbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIG9uQWRkVXNlcnNDbGlja2VkOiBmdW5jdGlvbihldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBBZGRyZXNzUGlja2VyRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQWRkcmVzc1BpY2tlckRpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQWRkIFVzZXJzIHRvIEdyb3VwIFN1bW1hcnknLCAnJywgQWRkcmVzc1BpY2tlckRpYWxvZywge1xuICAgICAgICAgICAgdGl0bGU6IF90KCdBZGQgdXNlcnMgdG8gdGhlIGNvbW11bml0eSBzdW1tYXJ5JyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJXaG8gd291bGQgeW91IGxpa2UgdG8gYWRkIHRvIHRoaXMgc3VtbWFyeT9cIiksXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogX3QoXCJOYW1lIG9yIE1hdHJpeCBJRFwiKSxcbiAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJBZGQgdG8gc3VtbWFyeVwiKSxcbiAgICAgICAgICAgIHZhbGlkQWRkcmVzc1R5cGVzOiBbJ214LXVzZXItaWQnXSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMucHJvcHMuZ3JvdXBJZCxcbiAgICAgICAgICAgIHNob3VsZE9taXRTZWxmOiBmYWxzZSxcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IChzdWNjZXNzLCBhZGRycykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghc3VjY2VzcykgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yTGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgIGFsbFNldHRsZWQoYWRkcnMubWFwKChhZGRyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBHcm91cFN0b3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkVXNlclRvR3JvdXBTdW1tYXJ5KGFkZHIuYWRkcmVzcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7IGVycm9yTGlzdC5wdXNoKGFkZHIuYWRkcmVzcyk7IH0pO1xuICAgICAgICAgICAgICAgIH0pKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBhZGQgdGhlIGZvbGxvd2luZyB1c2VycyB0byB0aGUgY29tbXVuaXR5IHN1bW1hcnknLFxuICAgICAgICAgICAgICAgICAgICAgICAgJycsIEVycm9yRGlhbG9nLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gYWRkIHRoZSBmb2xsb3dpbmcgdXNlcnMgdG8gdGhlIHN1bW1hcnkgb2YgJShncm91cElkKXM6XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2dyb3VwSWQ6IHRoaXMucHJvcHMuZ3JvdXBJZH0sXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGVycm9yTGlzdC5qb2luKFwiLCBcIiksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgLypjbGFzc05hbWU9Ki9udWxsLCAvKmlzUHJpb3JpdHk9Ki9mYWxzZSwgLyppc1N0YXRpYz0qL3RydWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBUaW50YWJsZVN2ZyA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5UaW50YWJsZVN2Z1wiKTtcbiAgICAgICAgY29uc3QgYWRkQnV0dG9uID0gdGhpcy5wcm9wcy5lZGl0aW5nID9cbiAgICAgICAgICAgICg8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfYWRkQnV0dG9uXCIgb25DbGljaz17dGhpcy5vbkFkZFVzZXJzQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgIDxUaW50YWJsZVN2ZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL2ljb25zLWNyZWF0ZS1yb29tLnN2Z1wiKX0gd2lkdGg9XCI2NFwiIGhlaWdodD1cIjY0XCIgLz5cbiAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfYWRkQnV0dG9uX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgICB7IF90KCdBZGQgYSBVc2VyJykgfVxuICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+KSA6IDxkaXYgLz47XG4gICAgICAgIGNvbnN0IHVzZXJOb2RlcyA9IHRoaXMucHJvcHMudXNlcnMubWFwKCh1KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPEZlYXR1cmVkVXNlclxuICAgICAgICAgICAgICAgIGtleT17dS51c2VyX2lkfVxuICAgICAgICAgICAgICAgIHN1bW1hcnlJbmZvPXt1fVxuICAgICAgICAgICAgICAgIGVkaXRpbmc9e3RoaXMucHJvcHMuZWRpdGluZ31cbiAgICAgICAgICAgICAgICBncm91cElkPXt0aGlzLnByb3BzLmdyb3VwSWR9IC8+O1xuICAgICAgICB9KTtcbiAgICAgICAgbGV0IHJvbGVIZWFkZXIgPSA8ZGl2IC8+O1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5yb2xlICYmIHRoaXMucHJvcHMucm9sZS5wcm9maWxlKSB7XG4gICAgICAgICAgICByb2xlSGVhZGVyID0gPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfY2F0ZWdvcnlcIj57IHRoaXMucHJvcHMucm9sZS5wcm9maWxlLm5hbWUgfTwvZGl2PjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfY29udGFpbmVyXCI+XG4gICAgICAgICAgICB7IHJvbGVIZWFkZXIgfVxuICAgICAgICAgICAgeyB1c2VyTm9kZXMgfVxuICAgICAgICAgICAgeyBhZGRCdXR0b24gfVxuICAgICAgICA8L2Rpdj47XG4gICAgfSxcbn0pO1xuXG5jb25zdCBGZWF0dXJlZFVzZXIgPSBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0ZlYXR1cmVkVXNlcicsXG5cbiAgICBwcm9wczoge1xuICAgICAgICBzdW1tYXJ5SW5mbzogVXNlclN1bW1hcnlUeXBlLmlzUmVxdWlyZWQsXG4gICAgICAgIGVkaXRpbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgICAgIGdyb3VwSWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfc3RhcnRfY2hhdF9vcl9yZXVzZScsXG4gICAgICAgICAgICB1c2VyX2lkOiB0aGlzLnByb3BzLnN1bW1hcnlJbmZvLnVzZXJfaWQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkRlbGV0ZUNsaWNrZWQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBHcm91cFN0b3JlLnJlbW92ZVVzZXJGcm9tR3JvdXBTdW1tYXJ5KFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5ncm91cElkLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby51c2VyX2lkLFxuICAgICAgICApLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHdoaWxzdCByZW1vdmluZyB1c2VyIGZyb20gZ3JvdXAgc3VtbWFyeScsIGVycik7XG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9IHRoaXMucHJvcHMuc3VtbWFyeUluZm8uZGlzcGxheW5hbWUgfHwgdGhpcy5wcm9wcy5zdW1tYXJ5SW5mby51c2VyX2lkO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXG4gICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byByZW1vdmUgdXNlciBmcm9tIGNvbW11bml0eSBzdW1tYXJ5JyxcbiAgICAgICAgICAgICAgICAnJywgRXJyb3JEaWFsb2csXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFxuICAgICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byByZW1vdmUgYSB1c2VyIGZyb20gdGhlIHN1bW1hcnkgb2YgJShncm91cElkKXNcIixcbiAgICAgICAgICAgICAgICAgICAge2dyb3VwSWQ6IHRoaXMucHJvcHMuZ3JvdXBJZH0sXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJUaGUgdXNlciAnJShkaXNwbGF5TmFtZSlzJyBjb3VsZCBub3QgYmUgcmVtb3ZlZCBmcm9tIHRoZSBzdW1tYXJ5LlwiLCB7ZGlzcGxheU5hbWV9KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQmFzZUF2YXRhciA9IHNkay5nZXRDb21wb25lbnQoXCJhdmF0YXJzLkJhc2VBdmF0YXJcIik7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnByb3BzLnN1bW1hcnlJbmZvLmRpc3BsYXluYW1lIHx8IHRoaXMucHJvcHMuc3VtbWFyeUluZm8udXNlcl9pZDtcblxuICAgICAgICBjb25zdCBwZXJtYWxpbmsgPSBtYWtlVXNlclBlcm1hbGluayh0aGlzLnByb3BzLnN1bW1hcnlJbmZvLnVzZXJfaWQpO1xuICAgICAgICBjb25zdCB1c2VyTmFtZU5vZGUgPSA8YSBocmVmPXtwZXJtYWxpbmt9IG9uQ2xpY2s9e3RoaXMub25DbGlja30+eyBuYW1lIH08L2E+O1xuICAgICAgICBjb25zdCBodHRwVXJsID0gTWF0cml4Q2xpZW50UGVnLmdldCgpXG4gICAgICAgICAgICAubXhjVXJsVG9IdHRwKHRoaXMucHJvcHMuc3VtbWFyeUluZm8uYXZhdGFyX3VybCwgNjQsIDY0KTtcblxuICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSB0aGlzLnByb3BzLmVkaXRpbmcgP1xuICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nX2RlbGV0ZUJ1dHRvblwiXG4gICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwtc21hbGwuc3ZnXCIpfVxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMTRcIlxuICAgICAgICAgICAgICAgIGhlaWdodD1cIjE0XCJcbiAgICAgICAgICAgICAgICBhbHQ9XCJEZWxldGVcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25EZWxldGVDbGlja2VkfSAvPlxuICAgICAgICAgICAgOiA8ZGl2IC8+O1xuXG4gICAgICAgIHJldHVybiA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ1wiIG9uQ2xpY2s9e3RoaXMub25DbGlja30+XG4gICAgICAgICAgICA8QmFzZUF2YXRhciBuYW1lPXtuYW1lfSB1cmw9e2h0dHBVcmx9IHdpZHRoPXs2NH0gaGVpZ2h0PXs2NH0gLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2ZlYXR1cmVkVGhpbmdfbmFtZVwiPnsgdXNlck5hbWVOb2RlIH08L2Rpdj5cbiAgICAgICAgICAgIHsgZGVsZXRlQnV0dG9uIH1cbiAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICB9LFxufSk7XG5cbmNvbnN0IEdST1VQX0pPSU5QT0xJQ1lfT1BFTiA9IFwib3BlblwiO1xuY29uc3QgR1JPVVBfSk9JTlBPTElDWV9JTlZJVEUgPSBcImludml0ZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0dyb3VwVmlldycsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgZ3JvdXBJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgdGhlIGdyb3VwIGFkbWluIGlzIHZpZXdpbmcgdGhlIGdyb3VwXG4gICAgICAgIGdyb3VwSXNOZXc6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VtbWFyeTogbnVsbCxcbiAgICAgICAgICAgIGlzR3JvdXBQdWJsaWNpc2VkOiBudWxsLFxuICAgICAgICAgICAgaXNVc2VyUHJpdmlsZWdlZDogbnVsbCxcbiAgICAgICAgICAgIGdyb3VwUm9vbXM6IG51bGwsXG4gICAgICAgICAgICBncm91cFJvb21zTG9hZGluZzogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICAgICAgICBzYXZpbmc6IGZhbHNlLFxuICAgICAgICAgICAgdXBsb2FkaW5nQXZhdGFyOiBmYWxzZSxcbiAgICAgICAgICAgIGF2YXRhckNoYW5nZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgcHVibGljaXR5QnVzeTogZmFsc2UsXG4gICAgICAgICAgICBpbnZpdGVyUHJvZmlsZTogbnVsbCxcbiAgICAgICAgICAgIHNob3dSaWdodFBhbmVsOiBSaWdodFBhbmVsU3RvcmUuZ2V0U2hhcmVkSW5zdGFuY2UoKS5pc09wZW5Gb3JHcm91cCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQub24oXCJHcm91cC5teU1lbWJlcnNoaXBcIiwgdGhpcy5fb25Hcm91cE15TWVtYmVyc2hpcCk7XG5cbiAgICAgICAgdGhpcy5faW5pdEdyb3VwU3RvcmUodGhpcy5wcm9wcy5ncm91cElkLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMuX29uQWN0aW9uKTtcbiAgICAgICAgdGhpcy5fcmlnaHRQYW5lbFN0b3JlVG9rZW4gPSBSaWdodFBhbmVsU3RvcmUuZ2V0U2hhcmVkSW5zdGFuY2UoKS5hZGRMaXN0ZW5lcih0aGlzLl9vblJpZ2h0UGFuZWxTdG9yZVVwZGF0ZSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiR3JvdXAubXlNZW1iZXJzaGlwXCIsIHRoaXMuX29uR3JvdXBNeU1lbWJlcnNoaXApO1xuICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLl9kaXNwYXRjaGVyUmVmKTtcblxuICAgICAgICAvLyBSZW1vdmUgUmlnaHRQYW5lbFN0b3JlIGxpc3RlbmVyXG4gICAgICAgIGlmICh0aGlzLl9yaWdodFBhbmVsU3RvcmVUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5fcmlnaHRQYW5lbFN0b3JlVG9rZW4ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZ3JvdXBJZCAhPT0gbmV3UHJvcHMuZ3JvdXBJZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc3VtbWFyeTogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0R3JvdXBTdG9yZShuZXdQcm9wcy5ncm91cElkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vblJpZ2h0UGFuZWxTdG9yZVVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2hvd1JpZ2h0UGFuZWw6IFJpZ2h0UGFuZWxTdG9yZS5nZXRTaGFyZWRJbnN0YW5jZSgpLmlzT3BlbkZvckdyb3VwLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uR3JvdXBNeU1lbWJlcnNoaXA6IGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQgfHwgZ3JvdXAuZ3JvdXBJZCAhPT0gdGhpcy5wcm9wcy5ncm91cElkKSByZXR1cm47XG4gICAgICAgIGlmIChncm91cC5teU1lbWJlcnNoaXAgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICAgIC8vIExlYXZlIHNldHRpbmdzIC0gdGhlIHVzZXIgbWlnaHQgaGF2ZSBjbGlja2VkIHRoZSBcIkxlYXZlXCIgYnV0dG9uXG4gICAgICAgICAgICB0aGlzLl9jbG9zZVNldHRpbmdzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bWVtYmVyc2hpcEJ1c3k6IGZhbHNlfSk7XG4gICAgfSxcblxuICAgIF9pbml0R3JvdXBTdG9yZTogZnVuY3Rpb24oZ3JvdXBJZCwgZmlyc3RJbml0KSB7XG4gICAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fbWF0cml4Q2xpZW50LmdldEdyb3VwKGdyb3VwSWQpO1xuICAgICAgICBpZiAoZ3JvdXAgJiYgZ3JvdXAuaW52aXRlciAmJiBncm91cC5pbnZpdGVyLnVzZXJJZCkge1xuICAgICAgICAgICAgdGhpcy5fZmV0Y2hJbnZpdGVyUHJvZmlsZShncm91cC5pbnZpdGVyLnVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgR3JvdXBTdG9yZS5yZWdpc3Rlckxpc3RlbmVyKGdyb3VwSWQsIHRoaXMub25Hcm91cFN0b3JlVXBkYXRlZC5iaW5kKHRoaXMsIGZpcnN0SW5pdCkpO1xuICAgICAgICBsZXQgd2lsbERvT25ib2FyZGluZyA9IGZhbHNlO1xuICAgICAgICAvLyBYWFg6IFRoaXMgc2hvdWxkIGJlIG1vcmUgZmx1eHkgLSBsZXQncyBnZXQgdGhlIGVycm9yIGZyb20gR3JvdXBTdG9yZSAuZ2V0RXJyb3Igb3Igc29tZXRoaW5nXG4gICAgICAgIEdyb3VwU3RvcmUub24oJ2Vycm9yJywgKGVyciwgZXJyb3JHcm91cElkLCBzdGF0ZUtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCB8fCBncm91cElkICE9PSBlcnJvckdyb3VwSWQpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIuZXJyY29kZSA9PT0gJ01fR1VFU1RfQUNDRVNTX0ZPUkJJRERFTicgJiYgIXdpbGxEb09uYm9hcmRpbmcpIHtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdkb19hZnRlcl9zeW5jX3ByZXBhcmVkJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRfYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X2dyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX2lkOiBncm91cElkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nLCBzY3JlZW5fYWZ0ZXI6IHtzY3JlZW46IGBncm91cC8ke2dyb3VwSWR9YH19KTtcbiAgICAgICAgICAgICAgICB3aWxsRG9PbmJvYXJkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdGF0ZUtleSA9PT0gR3JvdXBTdG9yZS5TVEFURV9LRVkuU3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyLFxuICAgICAgICAgICAgICAgICAgICBlZGl0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uR3JvdXBTdG9yZVVwZGF0ZWQoZmlyc3RJbml0KSB7XG4gICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc3VtbWFyeSA9IEdyb3VwU3RvcmUuZ2V0U3VtbWFyeSh0aGlzLnByb3BzLmdyb3VwSWQpO1xuICAgICAgICBpZiAoc3VtbWFyeS5wcm9maWxlKSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0IHByb2ZpbGUgZmllbGRzIHNob3VsZCBiZSBcIlwiIGZvciBsYXRlciBzZW5kaW5nIHRvIHRoZSBzZXJ2ZXIgKHdoaWNoXG4gICAgICAgICAgICAvLyByZXF1aXJlcyB0aGF0IHRoZSBmaWVsZHMgYXJlIHN0cmluZ3MsIG5vdCBudWxsKVxuICAgICAgICAgICAgW1wiYXZhdGFyX3VybFwiLCBcImxvbmdfZGVzY3JpcHRpb25cIiwgXCJuYW1lXCIsIFwic2hvcnRfZGVzY3JpcHRpb25cIl0uZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIHN1bW1hcnkucHJvZmlsZVtrXSA9IHN1bW1hcnkucHJvZmlsZVtrXSB8fCBcIlwiO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdW1tYXJ5LFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRpbmc6ICFHcm91cFN0b3JlLmlzU3RhdGVSZWFkeSh0aGlzLnByb3BzLmdyb3VwSWQsIEdyb3VwU3RvcmUuU1RBVEVfS0VZLlN1bW1hcnkpLFxuICAgICAgICAgICAgaXNHcm91cFB1YmxpY2lzZWQ6IEdyb3VwU3RvcmUuZ2V0R3JvdXBQdWJsaWNpdHkodGhpcy5wcm9wcy5ncm91cElkKSxcbiAgICAgICAgICAgIGlzVXNlclByaXZpbGVnZWQ6IEdyb3VwU3RvcmUuaXNVc2VyUHJpdmlsZWdlZCh0aGlzLnByb3BzLmdyb3VwSWQpLFxuICAgICAgICAgICAgZ3JvdXBSb29tczogR3JvdXBTdG9yZS5nZXRHcm91cFJvb21zKHRoaXMucHJvcHMuZ3JvdXBJZCksXG4gICAgICAgICAgICBncm91cFJvb21zTG9hZGluZzogIUdyb3VwU3RvcmUuaXNTdGF0ZVJlYWR5KHRoaXMucHJvcHMuZ3JvdXBJZCwgR3JvdXBTdG9yZS5TVEFURV9LRVkuR3JvdXBSb29tcyksXG4gICAgICAgICAgICBpc1VzZXJNZW1iZXI6IEdyb3VwU3RvcmUuZ2V0R3JvdXBNZW1iZXJzKHRoaXMucHJvcHMuZ3JvdXBJZCkuc29tZShcbiAgICAgICAgICAgICAgICAobSkgPT4gbS51c2VySWQgPT09IHRoaXMuX21hdHJpeENsaWVudC5jcmVkZW50aWFscy51c2VySWQsXG4gICAgICAgICAgICApLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gWFhYOiBUaGlzIG1pZ2h0IG5vdCB3b3JrIGJ1dCB0aGlzLnByb3BzLmdyb3VwSXNOZXcgdW51c2VkIGFueXdheVxuICAgICAgICBpZiAodGhpcy5wcm9wcy5ncm91cElzTmV3ICYmIGZpcnN0SW5pdCkge1xuICAgICAgICAgICAgdGhpcy5fb25FZGl0Q2xpY2soKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZmV0Y2hJbnZpdGVyUHJvZmlsZSh1c2VySWQpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBpbnZpdGVyUHJvZmlsZUJ1c3k6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQuZ2V0UHJvZmlsZUluZm8odXNlcklkKS50aGVuKChyZXNwKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBpbnZpdGVyUHJvZmlsZToge1xuICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IHJlc3AuYXZhdGFyX3VybCxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHJlc3AuZGlzcGxheW5hbWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyBncm91cCBpbnZpdGVyIHByb2ZpbGUnLCBlKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBpbnZpdGVyUHJvZmlsZUJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25FZGl0Q2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVkaXRpbmc6IHRydWUsXG4gICAgICAgICAgICBwcm9maWxlRm9ybTogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZS5zdW1tYXJ5LnByb2ZpbGUpLFxuICAgICAgICAgICAgam9pbmFibGVGb3JtOiB7XG4gICAgICAgICAgICAgICAgcG9saWN5VHlwZTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zdW1tYXJ5LnByb2ZpbGUuaXNfb3Blbmx5X2pvaW5hYmxlID9cbiAgICAgICAgICAgICAgICAgICAgICAgIEdST1VQX0pPSU5QT0xJQ1lfT1BFTiA6XG4gICAgICAgICAgICAgICAgICAgICAgICBHUk9VUF9KT0lOUE9MSUNZX0lOVklURSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25TaGFyZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgU2hhcmVEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5TaGFyZURpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnc2hhcmUgY29tbXVuaXR5IGRpYWxvZycsICcnLCBTaGFyZURpYWxvZywge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLl9tYXRyaXhDbGllbnQuZ2V0R3JvdXAodGhpcy5wcm9wcy5ncm91cElkKSB8fCBuZXcgR3JvdXAodGhpcy5wcm9wcy5ncm91cElkKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9vbkNhbmNlbENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY2xvc2VTZXR0aW5ncygpO1xuICAgIH0sXG5cbiAgICBfb25BY3Rpb24ocGF5bG9hZCkge1xuICAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBjbG9zZV9zZXR0aW5ncyBpcyBhbiBhcHAtd2lkZSBkaXNwYXRjaDsgYXMgaXQgaXMgZGlzcGF0Y2hlZCBmcm9tIE1hdHJpeENoYXRcbiAgICAgICAgICAgIGNhc2UgJ2Nsb3NlX3NldHRpbmdzJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVGb3JtOiBudWxsLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY2xvc2VTZXR0aW5ncygpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdjbG9zZV9zZXR0aW5ncyd9KTtcbiAgICB9LFxuXG4gICAgX29uTmFtZUNoYW5nZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY29uc3QgbmV3UHJvZmlsZUZvcm0gPSBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUucHJvZmlsZUZvcm0sIHsgbmFtZTogdmFsdWUgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcHJvZmlsZUZvcm06IG5ld1Byb2ZpbGVGb3JtLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uU2hvcnREZXNjQ2hhbmdlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBjb25zdCBuZXdQcm9maWxlRm9ybSA9IE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZS5wcm9maWxlRm9ybSwgeyBzaG9ydF9kZXNjcmlwdGlvbjogdmFsdWUgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcHJvZmlsZUZvcm06IG5ld1Byb2ZpbGVGb3JtLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uTG9uZ0Rlc2NDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc3QgbmV3UHJvZmlsZUZvcm0gPSBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUucHJvZmlsZUZvcm0sIHsgbG9uZ19kZXNjcmlwdGlvbjogZS50YXJnZXQudmFsdWUgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcHJvZmlsZUZvcm06IG5ld1Byb2ZpbGVGb3JtLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uQXZhdGFyU2VsZWN0ZWQ6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBldi50YXJnZXQuZmlsZXNbMF07XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3VwbG9hZGluZ0F2YXRhcjogdHJ1ZX0pO1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQudXBsb2FkQ29udGVudChmaWxlKS50aGVuKCh1cmwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1Byb2ZpbGVGb3JtID0gT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLnByb2ZpbGVGb3JtLCB7IGF2YXRhcl91cmw6IHVybCB9KTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHVwbG9hZGluZ0F2YXRhcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgcHJvZmlsZUZvcm06IG5ld1Byb2ZpbGVGb3JtLFxuXG4gICAgICAgICAgICAgICAgLy8gSW5kaWNhdGUgdGhhdCBGbGFpclN0b3JlIG5lZWRzIHRvIGJlIHBva2VkIHRvIHNob3cgdGhpcyBjaGFuZ2VcbiAgICAgICAgICAgICAgICAvLyBpbiBUYWdUaWxlIChUYWdQYW5lbCksIEZsYWlyIGFuZCBHcm91cFRpbGUgKE15R3JvdXBzKS5cbiAgICAgICAgICAgICAgICBhdmF0YXJDaGFuZ2VkOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHt1cGxvYWRpbmdBdmF0YXI6IGZhbHNlfSk7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byB1cGxvYWQgYXZhdGFyIGltYWdlXCIsIGUpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHVwbG9hZCBpbWFnZScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXJyb3InKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0ZhaWxlZCB0byB1cGxvYWQgaW1hZ2UnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uSm9pbmFibGVDaGFuZ2U6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgam9pbmFibGVGb3JtOiB7IHBvbGljeVR5cGU6IGV2LnRhcmdldC52YWx1ZSB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uU2F2ZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2F2aW5nOiB0cnVlfSk7XG4gICAgICAgIGNvbnN0IHNhdmVQcm9taXNlID0gdGhpcy5zdGF0ZS5pc1VzZXJQcml2aWxlZ2VkID8gdGhpcy5fc2F2ZUdyb3VwKCkgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgc2F2ZVByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBzYXZpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVkaXRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN1bW1hcnk6IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAncGFuZWxfZGlzYWJsZSd9KTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRHcm91cFN0b3JlKHRoaXMucHJvcHMuZ3JvdXBJZCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmF2YXRhckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBYWFg6IEV2aWwgLSBwb2tpbmcgYSBzdG9yZSBzaG91bGQgYmUgZG9uZSBmcm9tIGFuIGFzeW5jIGFjdGlvblxuICAgICAgICAgICAgICAgIEZsYWlyU3RvcmUucmVmcmVzaEdyb3VwUHJvZmlsZSh0aGlzLl9tYXRyaXhDbGllbnQsIHRoaXMucHJvcHMuZ3JvdXBJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBzYXZpbmc6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzYXZlIGNvbW11bml0eSBwcm9maWxlXCIsIGUpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHVwZGF0ZSBncm91cCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXJyb3InKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0ZhaWxlZCB0byB1cGRhdGUgY29tbXVuaXR5JyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBhdmF0YXJDaGFuZ2VkOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3NhdmVHcm91cDogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX21hdHJpeENsaWVudC5zZXRHcm91cFByb2ZpbGUodGhpcy5wcm9wcy5ncm91cElkLCB0aGlzLnN0YXRlLnByb2ZpbGVGb3JtKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fbWF0cml4Q2xpZW50LnNldEdyb3VwSm9pblBvbGljeSh0aGlzLnByb3BzLmdyb3VwSWQsIHtcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuc3RhdGUuam9pbmFibGVGb3JtLnBvbGljeVR5cGUsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25BY2NlcHRJbnZpdGVDbGljazogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNoaXBCdXN5OiB0cnVlfSk7XG5cbiAgICAgICAgLy8gV2FpdCA1MDBtcyB0byBwcmV2ZW50IGZsYXNoaW5nLiBEbyB0aGlzIGJlZm9yZSBzZW5kaW5nIGEgcmVxdWVzdCBvdGhlcndpc2Ugd2UgcmlzayB0aGVcbiAgICAgICAgLy8gc3Bpbm5lciBkaXNhcHBlYXJpbmcgYWZ0ZXIgd2UgaGF2ZSBmZXRjaGVkIG5ldyBncm91cCBkYXRhLlxuICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuXG4gICAgICAgIEdyb3VwU3RvcmUuYWNjZXB0R3JvdXBJbnZpdGUodGhpcy5wcm9wcy5ncm91cElkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGRvbid0IHJlc2V0IG1lbWJlcnNoaXBCdXN5IGhlcmU6IHdhaXQgZm9yIHRoZSBtZW1iZXJzaGlwIGNoYW5nZSB0byBjb21lIGRvd24gdGhlIHN5bmNcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNoaXBCdXN5OiBmYWxzZX0pO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0Vycm9yIGFjY2VwdGluZyBpbnZpdGUnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvclwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJVbmFibGUgdG8gYWNjZXB0IGludml0ZVwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uUmVqZWN0SW52aXRlQ2xpY2s6IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHttZW1iZXJzaGlwQnVzeTogdHJ1ZX0pO1xuXG4gICAgICAgIC8vIFdhaXQgNTAwbXMgdG8gcHJldmVudCBmbGFzaGluZy4gRG8gdGhpcyBiZWZvcmUgc2VuZGluZyBhIHJlcXVlc3Qgb3RoZXJ3aXNlIHdlIHJpc2sgdGhlXG4gICAgICAgIC8vIHNwaW5uZXIgZGlzYXBwZWFyaW5nIGFmdGVyIHdlIGhhdmUgZmV0Y2hlZCBuZXcgZ3JvdXAgZGF0YS5cbiAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcblxuICAgICAgICBHcm91cFN0b3JlLmxlYXZlR3JvdXAodGhpcy5wcm9wcy5ncm91cElkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGRvbid0IHJlc2V0IG1lbWJlcnNoaXBCdXN5IGhlcmU6IHdhaXQgZm9yIHRoZSBtZW1iZXJzaGlwIGNoYW5nZSB0byBjb21lIGRvd24gdGhlIHN5bmNcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNoaXBCdXN5OiBmYWxzZX0pO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0Vycm9yIHJlamVjdGluZyBpbnZpdGUnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvclwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJVbmFibGUgdG8gcmVqZWN0IGludml0ZVwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uSm9pbkNsaWNrOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hdHJpeENsaWVudC5pc0d1ZXN0KCkpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nLCBzY3JlZW5fYWZ0ZXI6IHtzY3JlZW46IGBncm91cC8ke3RoaXMucHJvcHMuZ3JvdXBJZH1gfX0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bWVtYmVyc2hpcEJ1c3k6IHRydWV9KTtcblxuICAgICAgICAvLyBXYWl0IDUwMG1zIHRvIHByZXZlbnQgZmxhc2hpbmcuIERvIHRoaXMgYmVmb3JlIHNlbmRpbmcgYSByZXF1ZXN0IG90aGVyd2lzZSB3ZSByaXNrIHRoZVxuICAgICAgICAvLyBzcGlubmVyIGRpc2FwcGVhcmluZyBhZnRlciB3ZSBoYXZlIGZldGNoZWQgbmV3IGdyb3VwIGRhdGEuXG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG5cbiAgICAgICAgR3JvdXBTdG9yZS5qb2luR3JvdXAodGhpcy5wcm9wcy5ncm91cElkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGRvbid0IHJlc2V0IG1lbWJlcnNoaXBCdXN5IGhlcmU6IHdhaXQgZm9yIHRoZSBtZW1iZXJzaGlwIGNoYW5nZSB0byBjb21lIGRvd24gdGhlIHN5bmNcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNoaXBCdXN5OiBmYWxzZX0pO1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0Vycm9yIGpvaW5pbmcgcm9vbScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcIlVuYWJsZSB0byBqb2luIGNvbW11bml0eVwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2xlYXZlR3JvdXBXYXJuaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdzID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNVc2VyUHJpdmlsZWdlZCkge1xuICAgICAgICAgICAgd2FybmluZ3MucHVzaCgoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICB7IFwiIFwiIC8qIFdoaXRlc3BhY2UsIG90aGVyd2lzZSB0aGUgc2VudGVuY2VzIGdldCBzbWFzaGVkIHRvZ2V0aGVyICovIH1cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIllvdSBhcmUgYW4gYWRtaW5pc3RyYXRvciBvZiB0aGlzIGNvbW11bml0eS4gWW91IHdpbGwgbm90IGJlIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcImFibGUgdG8gcmVqb2luIHdpdGhvdXQgYW4gaW52aXRlIGZyb20gYW5vdGhlciBhZG1pbmlzdHJhdG9yLlwiKSB9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2FybmluZ3M7XG4gICAgfSxcblxuXG4gICAgX29uTGVhdmVDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdzID0gdGhpcy5fbGVhdmVHcm91cFdhcm5pbmdzKCk7XG5cbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnTGVhdmUgR3JvdXAnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdChcIkxlYXZlIENvbW11bml0eVwiKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoXG4gICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgeyBfdChcIkxlYXZlICUoZ3JvdXBOYW1lKXM/XCIsIHtncm91cE5hbWU6IHRoaXMucHJvcHMuZ3JvdXBJZH0pIH1cbiAgICAgICAgICAgICAgICB7IHdhcm5pbmdzIH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgYnV0dG9uOiBfdChcIkxlYXZlXCIpLFxuICAgICAgICAgICAgZGFuZ2VyOiB0aGlzLnN0YXRlLmlzVXNlclByaXZpbGVnZWQsXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiBhc3luYyAoY29uZmlybWVkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb25maXJtZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe21lbWJlcnNoaXBCdXN5OiB0cnVlfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBXYWl0IDUwMG1zIHRvIHByZXZlbnQgZmxhc2hpbmcuIERvIHRoaXMgYmVmb3JlIHNlbmRpbmcgYSByZXF1ZXN0IG90aGVyd2lzZSB3ZSByaXNrIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNwaW5uZXIgZGlzYXBwZWFyaW5nIGFmdGVyIHdlIGhhdmUgZmV0Y2hlZCBuZXcgZ3JvdXAgZGF0YS5cbiAgICAgICAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuXG4gICAgICAgICAgICAgICAgR3JvdXBTdG9yZS5sZWF2ZUdyb3VwKHRoaXMucHJvcHMuZ3JvdXBJZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvbid0IHJlc2V0IG1lbWJlcnNoaXBCdXN5IGhlcmU6IHdhaXQgZm9yIHRoZSBtZW1iZXJzaGlwIGNoYW5nZSB0byBjb21lIGRvd24gdGhlIHN5bmNcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHttZW1iZXJzaGlwQnVzeTogZmFsc2V9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRXJyb3IgbGVhdmluZyBjb21tdW5pdHknLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiVW5hYmxlIHRvIGxlYXZlIGNvbW11bml0eVwiKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uQWRkUm9vbXNDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNob3dHcm91cEFkZFJvb21EaWFsb2codGhpcy5wcm9wcy5ncm91cElkKTtcbiAgICB9LFxuXG4gICAgX2dldEdyb3VwU2VjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGdyb3VwU2V0dGluZ3NTZWN0aW9uQ2xhc3NlcyA9IGNsYXNzbmFtZXMoe1xuICAgICAgICAgICAgXCJteF9Hcm91cFZpZXdfZ3JvdXBcIjogdGhpcy5zdGF0ZS5lZGl0aW5nLFxuICAgICAgICAgICAgXCJteF9Hcm91cFZpZXdfZ3JvdXBfZGlzYWJsZWRcIjogdGhpcy5zdGF0ZS5lZGl0aW5nICYmICF0aGlzLnN0YXRlLmlzVXNlclByaXZpbGVnZWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuc3RhdGUuZWRpdGluZyA/IDxoMj4geyBfdCgnQ29tbXVuaXR5IFNldHRpbmdzJykgfSA8L2gyPiA6IDxkaXYgLz47XG5cbiAgICAgICAgY29uc3QgaG9zdGluZ1NpZ251cExpbmsgPSBnZXRIb3N0aW5nTGluaygnY29tbXVuaXR5LXNldHRpbmdzJyk7XG4gICAgICAgIGxldCBob3N0aW5nU2lnbnVwID0gbnVsbDtcbiAgICAgICAgaWYgKGhvc3RpbmdTaWdudXBMaW5rICYmIHRoaXMuc3RhdGUuaXNVc2VyUHJpdmlsZWdlZCkge1xuICAgICAgICAgICAgaG9zdGluZ1NpZ251cCA9IDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2hvc3RpbmdTaWdudXBcIj5cbiAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiV2FudCBtb3JlIHRoYW4gYSBjb21tdW5pdHk/IDxhPkdldCB5b3VyIG93biBzZXJ2ZXI8L2E+XCIsIHt9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhOiBzdWIgPT4gPGEgaHJlZj17aG9zdGluZ1NpZ251cExpbmt9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8YSBocmVmPXtob3N0aW5nU2lnbnVwTGlua30gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uL3Jlcy9pbWcvZXh0ZXJuYWwtbGluay5zdmdcIil9IHdpZHRoPVwiMTFcIiBoZWlnaHQ9XCIxMFwiIGFsdD0nJyAvPlxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoYW5nZURlbGF5V2FybmluZyA9IHRoaXMuc3RhdGUuZWRpdGluZyAmJiB0aGlzLnN0YXRlLmlzVXNlclByaXZpbGVnZWQgP1xuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfY2hhbmdlRGVsYXlXYXJuaW5nXCI+XG4gICAgICAgICAgICAgICAgeyBfdChcbiAgICAgICAgICAgICAgICAgICAgJ0NoYW5nZXMgbWFkZSB0byB5b3VyIGNvbW11bml0eSA8Ym9sZDE+bmFtZTwvYm9sZDE+IGFuZCA8Ym9sZDI+YXZhdGFyPC9ib2xkMj4gJyArXG4gICAgICAgICAgICAgICAgICAgICdtaWdodCBub3QgYmUgc2VlbiBieSBvdGhlciB1c2VycyBmb3IgdXAgdG8gMzAgbWludXRlcy4nLFxuICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2JvbGQxJzogKHN1YikgPT4gPGI+IHsgc3ViIH0gPC9iPixcbiAgICAgICAgICAgICAgICAgICAgICAgICdib2xkMic6IChzdWIpID0+IDxiPiB7IHN1YiB9IDwvYj4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKSB9XG4gICAgICAgICAgICA8L2Rpdj4gOiA8ZGl2IC8+O1xuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e2dyb3VwU2V0dGluZ3NTZWN0aW9uQ2xhc3Nlc30+XG4gICAgICAgICAgICB7IGhlYWRlciB9XG4gICAgICAgICAgICB7IGhvc3RpbmdTaWdudXAgfVxuICAgICAgICAgICAgeyBjaGFuZ2VEZWxheVdhcm5pbmcgfVxuICAgICAgICAgICAgeyB0aGlzLl9nZXRKb2luYWJsZU5vZGUoKSB9XG4gICAgICAgICAgICB7IHRoaXMuX2dldExvbmdEZXNjcmlwdGlvbk5vZGUoKSB9XG4gICAgICAgICAgICB7IHRoaXMuX2dldFJvb21zTm9kZSgpIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICBfZ2V0Um9vbXNOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgUm9vbURldGFpbExpc3QgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5Sb29tRGV0YWlsTGlzdCcpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBjb25zdCBUaW50YWJsZVN2ZyA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLlRpbnRhYmxlU3ZnJyk7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcGlubmVyJyk7XG4gICAgICAgIGNvbnN0IFRvb2x0aXBCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5Ub29sdGlwQnV0dG9uJyk7XG5cbiAgICAgICAgY29uc3Qgcm9vbXNIZWxwTm9kZSA9IHRoaXMuc3RhdGUuZWRpdGluZyA/IDxUb29sdGlwQnV0dG9uIGhlbHBUZXh0PXtcbiAgICAgICAgICAgIF90KFxuICAgICAgICAgICAgICAgICdUaGVzZSByb29tcyBhcmUgZGlzcGxheWVkIHRvIGNvbW11bml0eSBtZW1iZXJzIG9uIHRoZSBjb21tdW5pdHkgcGFnZS4gJytcbiAgICAgICAgICAgICAgICAnQ29tbXVuaXR5IG1lbWJlcnMgY2FuIGpvaW4gdGhlIHJvb21zIGJ5IGNsaWNraW5nIG9uIHRoZW0uJyxcbiAgICAgICAgICAgIClcbiAgICAgICAgfSAvPiA6IDxkaXYgLz47XG5cbiAgICAgICAgY29uc3QgYWRkUm9vbVJvdyA9IHRoaXMuc3RhdGUuZWRpdGluZyA/XG4gICAgICAgICAgICAoPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X3Jvb21zX2hlYWRlcl9hZGRSb3dcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQWRkUm9vbXNDbGlja31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19yb29tc19oZWFkZXJfYWRkUm93X2J1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICA8VGludGFibGVTdmcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy9pY29ucy1yb29tLWFkZC5zdmdcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfcm9vbXNfaGVhZGVyX2FkZFJvd19sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdBZGQgcm9vbXMgdG8gdGhpcyBjb21tdW5pdHknKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+KSA6IDxkaXYgLz47XG4gICAgICAgIGNvbnN0IHJvb21EZXRhaWxMaXN0Q2xhc3NOYW1lID0gY2xhc3NuYW1lcyh7XG4gICAgICAgICAgICBcIm14X2ZhZGFibGVcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwibXhfZmFkYWJsZV9mYWRlZFwiOiB0aGlzLnN0YXRlLmVkaXRpbmcsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfcm9vbXNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X3Jvb21zX2hlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxoMz5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnUm9vbXMnKSB9XG4gICAgICAgICAgICAgICAgICAgIHsgcm9vbXNIZWxwTm9kZSB9XG4gICAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgICB7IGFkZFJvb21Sb3cgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7IHRoaXMuc3RhdGUuZ3JvdXBSb29tc0xvYWRpbmcgP1xuICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+IDpcbiAgICAgICAgICAgICAgICA8Um9vbURldGFpbExpc3RcbiAgICAgICAgICAgICAgICAgICAgcm9vbXM9e3RoaXMuc3RhdGUuZ3JvdXBSb29tc31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtyb29tRGV0YWlsTGlzdENsYXNzTmFtZX0gLz5cbiAgICAgICAgICAgIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICBfZ2V0RmVhdHVyZWRSb29tc05vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5zdGF0ZS5zdW1tYXJ5O1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRDYXRlZ29yeVJvb21zID0gW107XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5Um9vbXMgPSB7fTtcbiAgICAgICAgc3VtbWFyeS5yb29tc19zZWN0aW9uLnJvb21zLmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgICAgIGlmIChyLmNhdGVnb3J5X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdENhdGVnb3J5Um9vbXMucHVzaChyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGxpc3QgPSBjYXRlZ29yeVJvb21zW3IuY2F0ZWdvcnlfaWRdO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVJvb21zW3IuY2F0ZWdvcnlfaWRdID0gbGlzdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0Q2F0ZWdvcnlOb2RlID0gPENhdGVnb3J5Um9vbUxpc3RcbiAgICAgICAgICAgIHJvb21zPXtkZWZhdWx0Q2F0ZWdvcnlSb29tc31cbiAgICAgICAgICAgIGdyb3VwSWQ9e3RoaXMucHJvcHMuZ3JvdXBJZH1cbiAgICAgICAgICAgIGVkaXRpbmc9e3RoaXMuc3RhdGUuZWRpdGluZ30gLz47XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5Um9vbU5vZGVzID0gT2JqZWN0LmtleXMoY2F0ZWdvcnlSb29tcykubWFwKChjYXRJZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2F0ID0gc3VtbWFyeS5yb29tc19zZWN0aW9uLmNhdGVnb3JpZXNbY2F0SWRdO1xuICAgICAgICAgICAgcmV0dXJuIDxDYXRlZ29yeVJvb21MaXN0XG4gICAgICAgICAgICAgICAga2V5PXtjYXRJZH1cbiAgICAgICAgICAgICAgICByb29tcz17Y2F0ZWdvcnlSb29tc1tjYXRJZF19XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk9e2NhdH1cbiAgICAgICAgICAgICAgICBncm91cElkPXt0aGlzLnByb3BzLmdyb3VwSWR9XG4gICAgICAgICAgICAgICAgZWRpdGluZz17dGhpcy5zdGF0ZS5lZGl0aW5nfSAvPjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2ZlYXR1cmVkVGhpbmdzXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nc19oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICB7IF90KCdGZWF0dXJlZCBSb29tczonKSB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHsgZGVmYXVsdENhdGVnb3J5Tm9kZSB9XG4gICAgICAgICAgICB7IGNhdGVnb3J5Um9vbU5vZGVzIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICBfZ2V0RmVhdHVyZWRVc2Vyc05vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5zdGF0ZS5zdW1tYXJ5O1xuXG4gICAgICAgIGNvbnN0IG5vUm9sZVVzZXJzID0gW107XG4gICAgICAgIGNvbnN0IHJvbGVVc2VycyA9IHt9O1xuICAgICAgICBzdW1tYXJ5LnVzZXJzX3NlY3Rpb24udXNlcnMuZm9yRWFjaCgodSkgPT4ge1xuICAgICAgICAgICAgaWYgKHUucm9sZV9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5vUm9sZVVzZXJzLnB1c2godSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBsaXN0ID0gcm9sZVVzZXJzW3Uucm9sZV9pZF07XG4gICAgICAgICAgICAgICAgaWYgKGxpc3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIHJvbGVVc2Vyc1t1LnJvbGVfaWRdID0gbGlzdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKHUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBub1JvbGVOb2RlID0gPFJvbGVVc2VyTGlzdFxuICAgICAgICAgICAgdXNlcnM9e25vUm9sZVVzZXJzfVxuICAgICAgICAgICAgZ3JvdXBJZD17dGhpcy5wcm9wcy5ncm91cElkfVxuICAgICAgICAgICAgZWRpdGluZz17dGhpcy5zdGF0ZS5lZGl0aW5nfSAvPjtcbiAgICAgICAgY29uc3Qgcm9sZVVzZXJOb2RlcyA9IE9iamVjdC5rZXlzKHJvbGVVc2VycykubWFwKChyb2xlSWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJvbGUgPSBzdW1tYXJ5LnVzZXJzX3NlY3Rpb24ucm9sZXNbcm9sZUlkXTtcbiAgICAgICAgICAgIHJldHVybiA8Um9sZVVzZXJMaXN0XG4gICAgICAgICAgICAgICAga2V5PXtyb2xlSWR9XG4gICAgICAgICAgICAgICAgdXNlcnM9e3JvbGVVc2Vyc1tyb2xlSWRdfVxuICAgICAgICAgICAgICAgIHJvbGU9e3JvbGV9XG4gICAgICAgICAgICAgICAgZ3JvdXBJZD17dGhpcy5wcm9wcy5ncm91cElkfVxuICAgICAgICAgICAgICAgIGVkaXRpbmc9e3RoaXMuc3RhdGUuZWRpdGluZ30gLz47XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19mZWF0dXJlZFRoaW5nc1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZmVhdHVyZWRUaGluZ3NfaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgeyBfdCgnRmVhdHVyZWQgVXNlcnM6JykgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7IG5vUm9sZU5vZGUgfVxuICAgICAgICAgICAgeyByb2xlVXNlck5vZGVzIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICBfZ2V0TWVtYmVyc2hpcFNlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXZhdGFycy5CYXNlQXZhdGFyXCIpO1xuXG4gICAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fbWF0cml4Q2xpZW50LmdldEdyb3VwKHRoaXMucHJvcHMuZ3JvdXBJZCk7XG5cbiAgICAgICAgaWYgKGdyb3VwICYmIGdyb3VwLm15TWVtYmVyc2hpcCA9PT0gJ2ludml0ZScpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLm1lbWJlcnNoaXBCdXN5IHx8IHRoaXMuc3RhdGUuaW52aXRlclByb2ZpbGVCdXN5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X21lbWJlcnNoaXBTZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaHR0cEludml0ZXJBdmF0YXIgPSB0aGlzLnN0YXRlLmludml0ZXJQcm9maWxlID9cbiAgICAgICAgICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQubXhjVXJsVG9IdHRwKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmludml0ZXJQcm9maWxlLmF2YXRhclVybCwgMzYsIDM2LFxuICAgICAgICAgICAgICAgICkgOiBudWxsO1xuXG4gICAgICAgICAgICBsZXQgaW52aXRlck5hbWUgPSBncm91cC5pbnZpdGVyLnVzZXJJZDtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmludml0ZXJQcm9maWxlKSB7XG4gICAgICAgICAgICAgICAgaW52aXRlck5hbWUgPSB0aGlzLnN0YXRlLmludml0ZXJQcm9maWxlLmRpc3BsYXlOYW1lIHx8IGdyb3VwLmludml0ZXIudXNlcklkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X21lbWJlcnNoaXBTZWN0aW9uIG14X0dyb3VwVmlld19tZW1iZXJzaGlwU2VjdGlvbl9pbnZpdGVkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfbWVtYmVyc2hpcFN1YlNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfbWVtYmVyc2hpcFNlY3Rpb25fZGVzY3JpcHRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCYXNlQXZhdGFyIHVybD17aHR0cEludml0ZXJBdmF0YXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17aW52aXRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9ezM2fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17MzZ9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIiUoaW52aXRlcilzIGhhcyBpbnZpdGVkIHlvdSB0byBqb2luIHRoaXMgY29tbXVuaXR5XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZpdGVyOiBpbnZpdGVyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X21lbWJlcnNoaXBfYnV0dG9uQ29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfdGV4dEJ1dHRvbiBteF9Sb29tSGVhZGVyX3RleHRCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQWNjZXB0SW52aXRlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkFjY2VwdFwiKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfdGV4dEJ1dHRvbiBteF9Sb29tSGVhZGVyX3RleHRCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uUmVqZWN0SW52aXRlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkRlY2xpbmVcIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtZW1iZXJzaGlwQ29udGFpbmVyRXh0cmFDbGFzc2VzO1xuICAgICAgICBsZXQgbWVtYmVyc2hpcEJ1dHRvbkV4dHJhQ2xhc3NlcztcbiAgICAgICAgbGV0IG1lbWJlcnNoaXBCdXR0b25Ub29sdGlwO1xuICAgICAgICBsZXQgbWVtYmVyc2hpcEJ1dHRvblRleHQ7XG4gICAgICAgIGxldCBtZW1iZXJzaGlwQnV0dG9uT25DbGljaztcblxuICAgICAgICAvLyBVc2VyIGlzIG5vdCBpbiB0aGUgZ3JvdXBcbiAgICAgICAgaWYgKCghZ3JvdXAgfHwgZ3JvdXAubXlNZW1iZXJzaGlwID09PSAnbGVhdmUnKSAmJlxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zdW1tYXJ5ICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN1bW1hcnkucHJvZmlsZSAmJlxuICAgICAgICAgICAgQm9vbGVhbih0aGlzLnN0YXRlLnN1bW1hcnkucHJvZmlsZS5pc19vcGVubHlfam9pbmFibGUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1dHRvblRleHQgPSBfdChcIkpvaW4gdGhpcyBjb21tdW5pdHlcIik7XG4gICAgICAgICAgICBtZW1iZXJzaGlwQnV0dG9uT25DbGljayA9IHRoaXMuX29uSm9pbkNsaWNrO1xuXG4gICAgICAgICAgICBtZW1iZXJzaGlwQnV0dG9uRXh0cmFDbGFzc2VzID0gJ214X0dyb3VwVmlld19qb2luQnV0dG9uJztcbiAgICAgICAgICAgIG1lbWJlcnNoaXBDb250YWluZXJFeHRyYUNsYXNzZXMgPSAnbXhfR3JvdXBWaWV3X21lbWJlcnNoaXBTZWN0aW9uX2xlYXZlJztcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIGdyb3VwICYmXG4gICAgICAgICAgICBncm91cC5teU1lbWJlcnNoaXAgPT09ICdqb2luJyAmJlxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5lZGl0aW5nXG4gICAgICAgICkge1xuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1dHRvblRleHQgPSBfdChcIkxlYXZlIHRoaXMgY29tbXVuaXR5XCIpO1xuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1dHRvbk9uQ2xpY2sgPSB0aGlzLl9vbkxlYXZlQ2xpY2s7XG4gICAgICAgICAgICBtZW1iZXJzaGlwQnV0dG9uVG9vbHRpcCA9IHRoaXMuc3RhdGUuaXNVc2VyUHJpdmlsZWdlZCA/XG4gICAgICAgICAgICAgICAgX3QoXCJZb3UgYXJlIGFuIGFkbWluaXN0cmF0b3Igb2YgdGhpcyBjb21tdW5pdHlcIikgOlxuICAgICAgICAgICAgICAgIF90KFwiWW91IGFyZSBhIG1lbWJlciBvZiB0aGlzIGNvbW11bml0eVwiKTtcblxuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1dHRvbkV4dHJhQ2xhc3NlcyA9IHtcbiAgICAgICAgICAgICAgICAnbXhfR3JvdXBWaWV3X2xlYXZlQnV0dG9uJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAnbXhfUm9vbUhlYWRlcl90ZXh0QnV0dG9uX2Rhbmdlcic6IHRoaXMuc3RhdGUuaXNVc2VyUHJpdmlsZWdlZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBtZW1iZXJzaGlwQ29udGFpbmVyRXh0cmFDbGFzc2VzID0gJ214X0dyb3VwVmlld19tZW1iZXJzaGlwU2VjdGlvbl9qb2luZWQnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZW1iZXJzaGlwQnV0dG9uQ2xhc3NlcyA9IGNsYXNzbmFtZXMoW1xuICAgICAgICAgICAgJ214X1Jvb21IZWFkZXJfdGV4dEJ1dHRvbicsXG4gICAgICAgICAgICAnbXhfR3JvdXBWaWV3X3RleHRCdXR0b24nLFxuICAgICAgICBdLFxuICAgICAgICAgICAgbWVtYmVyc2hpcEJ1dHRvbkV4dHJhQ2xhc3NlcyxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBtZW1iZXJzaGlwQ29udGFpbmVyQ2xhc3NlcyA9IGNsYXNzbmFtZXMoXG4gICAgICAgICAgICAnbXhfR3JvdXBWaWV3X21lbWJlcnNoaXBTZWN0aW9uJyxcbiAgICAgICAgICAgIG1lbWJlcnNoaXBDb250YWluZXJFeHRyYUNsYXNzZXMsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXttZW1iZXJzaGlwQ29udGFpbmVyQ2xhc3Nlc30+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19tZW1iZXJzaGlwU3ViU2VjdGlvblwiPlxuICAgICAgICAgICAgICAgIHsgLyogVGhlIDxkaXYgLz4gaXMgZm9yIGZsZXggYWxpZ25tZW50ICovIH1cbiAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUubWVtYmVyc2hpcEJ1c3kgPyA8U3Bpbm5lciAvPiA6IDxkaXYgLz4gfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X21lbWJlcnNoaXBfYnV0dG9uQ29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e21lbWJlcnNoaXBCdXR0b25DbGFzc2VzfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17bWVtYmVyc2hpcEJ1dHRvbk9uQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bWVtYmVyc2hpcEJ1dHRvblRvb2x0aXB9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbWVtYmVyc2hpcEJ1dHRvblRleHQgfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICBfZ2V0Sm9pbmFibGVOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgSW5saW5lU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLklubGluZVNwaW5uZXInKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZWRpdGluZyA/IDxkaXY+XG4gICAgICAgICAgICA8aDM+XG4gICAgICAgICAgICAgICAgeyBfdCgnV2hvIGNhbiBqb2luIHRoaXMgY29tbXVuaXR5PycpIH1cbiAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUuZ3JvdXBKb2luYWJsZUxvYWRpbmcgP1xuICAgICAgICAgICAgICAgICAgICA8SW5saW5lU3Bpbm5lciAvPiA6IDxkaXYgLz5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e0dST1VQX0pPSU5QT0xJQ1lfSU5WSVRFfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5qb2luYWJsZUZvcm0ucG9saWN5VHlwZSA9PT0gR1JPVVBfSk9JTlBPTElDWV9JTlZJVEV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Kb2luYWJsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfbGFiZWxfdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnT25seSBwZW9wbGUgd2hvIGhhdmUgYmVlbiBpbnZpdGVkJykgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17R1JPVVBfSk9JTlBPTElDWV9PUEVOfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5qb2luYWJsZUZvcm0ucG9saWN5VHlwZSA9PT0gR1JPVVBfSk9JTlBPTElDWV9PUEVOfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uSm9pbmFibGVDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2xhYmVsX3RleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ0V2ZXJ5b25lJykgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PiA6IG51bGw7XG4gICAgfSxcblxuICAgIF9nZXRMb25nRGVzY3JpcHRpb25Ob2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuc3RhdGUuc3VtbWFyeTtcbiAgICAgICAgbGV0IGRlc2NyaXB0aW9uID0gbnVsbDtcbiAgICAgICAgaWYgKHN1bW1hcnkucHJvZmlsZSAmJiBzdW1tYXJ5LnByb2ZpbGUubG9uZ19kZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBzYW5pdGl6ZWRIdG1sTm9kZShzdW1tYXJ5LnByb2ZpbGUubG9uZ19kZXNjcmlwdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5pc1VzZXJQcml2aWxlZ2VkKSB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZ3JvdXBEZXNjX3BsYWNlaG9sZGVyXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbkVkaXRDbGlja31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IF90KFxuICAgICAgICAgICAgICAgICAgICAnWW91ciBjb21tdW5pdHkgaGFzblxcJ3QgZ290IGEgTG9uZyBEZXNjcmlwdGlvbiwgYSBIVE1MIHBhZ2UgdG8gc2hvdyB0byBjb21tdW5pdHkgbWVtYmVycy48YnIgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgJ0NsaWNrIGhlcmUgdG8gb3BlbiBzZXR0aW5ncyBhbmQgZ2l2ZSBpdCBvbmUhJyxcbiAgICAgICAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgICAgICAgIHsgJ2JyJzogPGJyIC8+IH0sXG4gICAgICAgICAgICAgICAgKSB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ3JvdXBEZXNjRWRpdGluZ0NsYXNzZXMgPSBjbGFzc25hbWVzKHtcbiAgICAgICAgICAgIFwibXhfR3JvdXBWaWV3X2dyb3VwRGVzY1wiOiB0cnVlLFxuICAgICAgICAgICAgXCJteF9Hcm91cFZpZXdfZ3JvdXBEZXNjX2Rpc2FibGVkXCI6ICF0aGlzLnN0YXRlLmlzVXNlclByaXZpbGVnZWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmVkaXRpbmcgP1xuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2dyb3VwRGVzY0VkaXRpbmdDbGFzc2VzfT5cbiAgICAgICAgICAgICAgICA8aDM+IHsgX3QoXCJMb25nIERlc2NyaXB0aW9uIChIVE1MKVwiKSB9IDwvaDM+XG4gICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnByb2ZpbGVGb3JtLmxvbmdfZGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdChMT05HX0RFU0NfUExBQ0VIT0xERVIpfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Mb25nRGVzY0NoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9XCI0XCJcbiAgICAgICAgICAgICAgICAgICAga2V5PVwiZWRpdExvbmdEZXNjXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+IDpcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2dyb3VwRGVzY1wiPlxuICAgICAgICAgICAgICAgIHsgZGVzY3JpcHRpb24gfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBHcm91cEF2YXRhciA9IHNkay5nZXRDb21wb25lbnQoXCJhdmF0YXJzLkdyb3VwQXZhdGFyXCIpO1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc3VtbWFyeUxvYWRpbmcgJiYgdGhpcy5zdGF0ZS5lcnJvciA9PT0gbnVsbCB8fCB0aGlzLnN0YXRlLnNhdmluZykge1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuc3VtbWFyeSAmJiAhdGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuc3RhdGUuc3VtbWFyeTtcblxuICAgICAgICAgICAgbGV0IGF2YXRhck5vZGU7XG4gICAgICAgICAgICBsZXQgbmFtZU5vZGU7XG4gICAgICAgICAgICBsZXQgc2hvcnREZXNjTm9kZTtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0QnV0dG9ucyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGluZyAmJiB0aGlzLnN0YXRlLmlzVXNlclByaXZpbGVnZWQpIHtcbiAgICAgICAgICAgICAgICBsZXQgYXZhdGFySW1hZ2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUudXBsb2FkaW5nQXZhdGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGF2YXRhckltYWdlID0gPFNwaW5uZXIgLz47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgR3JvdXBBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLkdyb3VwQXZhdGFyJyk7XG4gICAgICAgICAgICAgICAgICAgIGF2YXRhckltYWdlID0gPEdyb3VwQXZhdGFyIGdyb3VwSWQ9e3RoaXMucHJvcHMuZ3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwTmFtZT17dGhpcy5zdGF0ZS5wcm9maWxlRm9ybS5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBBdmF0YXJVcmw9e3RoaXMuc3RhdGUucHJvZmlsZUZvcm0uYXZhdGFyX3VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXsyOH0gaGVpZ2h0PXsyOH0gcmVzaXplTWV0aG9kPSdjcm9wJ1xuICAgICAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhdmF0YXJOb2RlID0gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19hdmF0YXJQaWNrZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiYXZhdGFySW5wdXRcIiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfYXZhdGFyUGlja2VyX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBhdmF0YXJJbWFnZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfYXZhdGFyUGlja2VyX2VkaXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImF2YXRhcklucHV0XCIgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2F2YXRhclBpY2tlcl9sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uL3Jlcy9pbWcvY2FtZXJhLnN2Z1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17X3QoXCJVcGxvYWQgYXZhdGFyXCIpfSB0aXRsZT17X3QoXCJVcGxvYWQgYXZhdGFyXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9XCIxN1wiIGhlaWdodD1cIjE1XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImF2YXRhcklucHV0XCIgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X3VwbG9hZElucHV0XCIgdHlwZT1cImZpbGVcIiBvbkNoYW5nZT17dGhpcy5fb25BdmF0YXJTZWxlY3RlZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgRWRpdGFibGVUZXh0ID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkVkaXRhYmxlVGV4dFwiKTtcblxuICAgICAgICAgICAgICAgIG5hbWVOb2RlID0gPEVkaXRhYmxlVGV4dFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZWRpdGFibGVcIlxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlckNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19wbGFjZWhvbGRlclwiXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdCgnQ29tbXVuaXR5IE5hbWUnKX1cbiAgICAgICAgICAgICAgICAgICAgYmx1clRvQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFZhbHVlPXt0aGlzLnN0YXRlLnByb2ZpbGVGb3JtLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgIG9uVmFsdWVDaGFuZ2VkPXt0aGlzLl9vbk5hbWVDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PVwiMFwiXG4gICAgICAgICAgICAgICAgICAgIGRpcj1cImF1dG9cIiAvPjtcblxuICAgICAgICAgICAgICAgIHNob3J0RGVzY05vZGUgPSA8RWRpdGFibGVUZXh0XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19lZGl0YWJsZVwiXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyQ2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X3BsYWNlaG9sZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e190KFwiRGVzY3JpcHRpb25cIil9XG4gICAgICAgICAgICAgICAgICAgIGJsdXJUb0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxWYWx1ZT17dGhpcy5zdGF0ZS5wcm9maWxlRm9ybS5zaG9ydF9kZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgb25WYWx1ZUNoYW5nZWQ9e3RoaXMuX29uU2hvcnREZXNjQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICB0YWJJbmRleD1cIjBcIlxuICAgICAgICAgICAgICAgICAgICBkaXI9XCJhdXRvXCIgLz47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uR3JvdXBIZWFkZXJJdGVtQ2xpY2sgPSB0aGlzLnN0YXRlLmlzVXNlck1lbWJlciA/IHRoaXMuX29uRWRpdENsaWNrIDogbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cEF2YXRhclVybCA9IHN1bW1hcnkucHJvZmlsZSA/IHN1bW1hcnkucHJvZmlsZS5hdmF0YXJfdXJsIDogbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cE5hbWUgPSBzdW1tYXJ5LnByb2ZpbGUgPyBzdW1tYXJ5LnByb2ZpbGUubmFtZSA6IG51bGw7XG4gICAgICAgICAgICAgICAgYXZhdGFyTm9kZSA9IDxHcm91cEF2YXRhclxuICAgICAgICAgICAgICAgICAgICBncm91cElkPXt0aGlzLnByb3BzLmdyb3VwSWR9XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwQXZhdGFyVXJsPXtncm91cEF2YXRhclVybH1cbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBOYW1lPXtncm91cE5hbWV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uR3JvdXBIZWFkZXJJdGVtQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoPXsyOH0gaGVpZ2h0PXsyOH1cbiAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeS5wcm9maWxlICYmIHN1bW1hcnkucHJvZmlsZS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVOb2RlID0gPGRpdiBvbkNsaWNrPXtvbkdyb3VwSGVhZGVySXRlbUNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPnsgc3VtbWFyeS5wcm9maWxlLm5hbWUgfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19oZWFkZXJfZ3JvdXBpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh7IHRoaXMucHJvcHMuZ3JvdXBJZCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZU5vZGUgPSA8c3BhbiBvbkNsaWNrPXtvbkdyb3VwSGVhZGVySXRlbUNsaWNrfT57IHRoaXMucHJvcHMuZ3JvdXBJZCB9PC9zcGFuPjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN1bW1hcnkucHJvZmlsZSAmJiBzdW1tYXJ5LnByb2ZpbGUuc2hvcnRfZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvcnREZXNjTm9kZSA9IDxzcGFuIG9uQ2xpY2s9e29uR3JvdXBIZWFkZXJJdGVtQ2xpY2t9Pnsgc3VtbWFyeS5wcm9maWxlLnNob3J0X2Rlc2NyaXB0aW9uIH08L3NwYW4+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGluZykge1xuICAgICAgICAgICAgICAgIHJpZ2h0QnV0dG9ucy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfdGV4dEJ1dHRvbiBteF9Sb29tSGVhZGVyX3RleHRCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PVwiX3NhdmVCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25TYXZlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1NhdmUnKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj4sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByaWdodEJ1dHRvbnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9jYW5jZWxCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PVwiX2NhbmNlbEJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbkNhbmNlbENsaWNrfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uL3Jlcy9pbWcvY2FuY2VsLnN2Z1wiKX0gY2xhc3NOYW1lPVwibXhfZmlsdGVyRmxpcENvbG9yXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBhbHQ9e190KFwiQ2FuY2VsXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5LnVzZXIgJiYgc3VtbWFyeS51c2VyLm1lbWJlcnNoaXAgPT09ICdqb2luJykge1xuICAgICAgICAgICAgICAgICAgICByaWdodEJ1dHRvbnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0dyb3VwSGVhZGVyX2J1dHRvbiBteF9Hcm91cEhlYWRlcl9lZGl0QnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9XCJfZWRpdEJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25FZGl0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KFwiQ29tbXVuaXR5IFNldHRpbmdzXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmlnaHRCdXR0b25zLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0dyb3VwSGVhZGVyX2J1dHRvbiBteF9Hcm91cEhlYWRlcl9zaGFyZUJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9XCJfc2hhcmVCdXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25TaGFyZUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KCdTaGFyZSBDb21tdW5pdHknKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0UGFuZWwgPSB0aGlzLnN0YXRlLnNob3dSaWdodFBhbmVsID8gPFJpZ2h0UGFuZWwgZ3JvdXBJZD17dGhpcy5wcm9wcy5ncm91cElkfSAvPiA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgY29uc3QgaGVhZGVyQ2xhc3NlcyA9IHtcbiAgICAgICAgICAgICAgICBcIm14X0dyb3VwVmlld19oZWFkZXJcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImxpZ2h0LXBhbmVsXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9Hcm91cFZpZXdfaGVhZGVyX3ZpZXdcIjogIXRoaXMuc3RhdGUuZWRpdGluZyxcbiAgICAgICAgICAgICAgICBcIm14X0dyb3VwVmlld19oZWFkZXJfaXNVc2VyTWVtYmVyXCI6IHRoaXMuc3RhdGUuaXNVc2VyTWVtYmVyLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8bWFpbiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZXMoaGVhZGVyQ2xhc3Nlcyl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfaGVhZGVyX2xlZnRDb2xcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19oZWFkZXJfYXZhdGFyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYXZhdGFyTm9kZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfaGVhZGVyX2luZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfaGVhZGVyX25hbWVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZU5vZGUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfaGVhZGVyX3Nob3J0RGVzY1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzaG9ydERlc2NOb2RlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2hlYWRlcl9yaWdodENvbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcmlnaHRCdXR0b25zIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPEdyb3VwSGVhZGVyQnV0dG9ucyAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPE1haW5TcGxpdCBwYW5lbD17cmlnaHRQYW5lbH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QXV0b0hpZGVTY3JvbGxiYXIgY2xhc3NOYW1lPVwibXhfR3JvdXBWaWV3X2JvZHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX2dldE1lbWJlcnNoaXBTZWN0aW9uKCkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5fZ2V0R3JvdXBTZWN0aW9uKCkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BdXRvSGlkZVNjcm9sbGJhcj5cbiAgICAgICAgICAgICAgICAgICAgPC9NYWluU3BsaXQ+XG4gICAgICAgICAgICAgICAgPC9tYWluPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmVycm9yKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvci5odHRwU3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0dyb3VwVmlld19lcnJvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnQ29tbXVuaXR5ICUoZ3JvdXBJZClzIG5vdCBmb3VuZCcsIHtncm91cElkOiB0aGlzLnByb3BzLmdyb3VwSWR9KSB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBleHRyYVRleHQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3IuZXJyY29kZSA9PT0gJ01fVU5SRUNPR05JWkVEJykge1xuICAgICAgICAgICAgICAgICAgICBleHRyYVRleHQgPSA8ZGl2PnsgX3QoJ1RoaXMgaG9tZXNlcnZlciBkb2VzIG5vdCBzdXBwb3J0IGNvbW11bml0aWVzJykgfTwvZGl2PjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Hcm91cFZpZXdfZXJyb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ0ZhaWxlZCB0byBsb2FkICUoZ3JvdXBJZClzJywge2dyb3VwSWQ6IHRoaXMucHJvcHMuZ3JvdXBJZCB9KSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGV4dHJhVGV4dCB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBzdGF0ZSBmb3IgR3JvdXBWaWV3XCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=