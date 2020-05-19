"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _createRoom = _interopRequireDefault(require("../../../createRoom"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var Unread = _interopRequireWildcard(require("../../../Unread"));

var _Receipt = require("../../../utils/Receipt");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _MultiInviter = _interopRequireDefault(require("../../../utils/MultiInviter"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _E2EIcon = _interopRequireDefault(require("./E2EIcon"));

var _AutoHideScrollbar = _interopRequireDefault(require("../../structures/AutoHideScrollbar"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _actions = require("../../../dispatcher/actions");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _default = (0, _createReactClass.default)({
  displayName: 'MemberInfo',
  propTypes: {
    member: _propTypes.default.object.isRequired
  },
  getInitialState: function () {
    return {
      can: {
        kick: false,
        ban: false,
        mute: false,
        modifyLevel: false,
        synapseDeactivate: false,
        redactMessages: false
      },
      muted: false,
      isTargetMod: false,
      updating: 0,
      devicesLoading: true,
      devices: null,
      isIgnoring: false
    };
  },
  statics: {
    contextType: _MatrixClientContext.default
  },
  // TODO: [REACT-WARNING] Move this to constructor
  UNSAFE_componentWillMount: function () {
    this._cancelDeviceList = null;
    const cli = this.context; // only display the devices list if our client supports E2E

    this._enableDevices = cli.isCryptoEnabled();
    cli.on("deviceVerificationChanged", this.onDeviceVerificationChanged);
    cli.on("Room", this.onRoom);
    cli.on("deleteRoom", this.onDeleteRoom);
    cli.on("Room.timeline", this.onRoomTimeline);
    cli.on("Room.name", this.onRoomName);
    cli.on("Room.receipt", this.onRoomReceipt);
    cli.on("RoomState.events", this.onRoomStateEvents);
    cli.on("RoomMember.name", this.onRoomMemberName);
    cli.on("RoomMember.membership", this.onRoomMemberMembership);
    cli.on("accountData", this.onAccountData);

    this._checkIgnoreState();

    this._updateStateForNewMember(this.props.member);
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    if (this.props.member.userId !== newProps.member.userId) {
      this._updateStateForNewMember(newProps.member);
    }
  },
  componentWillUnmount: function () {
    const client = this.context;

    if (client) {
      client.removeListener("deviceVerificationChanged", this.onDeviceVerificationChanged);
      client.removeListener("Room", this.onRoom);
      client.removeListener("deleteRoom", this.onDeleteRoom);
      client.removeListener("Room.timeline", this.onRoomTimeline);
      client.removeListener("Room.name", this.onRoomName);
      client.removeListener("Room.receipt", this.onRoomReceipt);
      client.removeListener("RoomState.events", this.onRoomStateEvents);
      client.removeListener("RoomMember.name", this.onRoomMemberName);
      client.removeListener("RoomMember.membership", this.onRoomMemberMembership);
      client.removeListener("accountData", this.onAccountData);
    }

    if (this._cancelDeviceList) {
      this._cancelDeviceList();
    }
  },
  _checkIgnoreState: function () {
    const isIgnoring = this.context.isUserIgnored(this.props.member.userId);
    this.setState({
      isIgnoring: isIgnoring
    });
  },
  _disambiguateDevices: function (devices) {
    const names = Object.create(null);

    for (let i = 0; i < devices.length; i++) {
      const name = devices[i].getDisplayName();
      const indexList = names[name] || [];
      indexList.push(i);
      names[name] = indexList;
    }

    for (const name in names) {
      if (names[name].length > 1) {
        names[name].forEach(j => {
          devices[j].ambiguous = true;
        });
      }
    }
  },
  onDeviceVerificationChanged: function (userId, device) {
    if (!this._enableDevices) {
      return;
    }

    if (userId === this.props.member.userId) {
      // no need to re-download the whole thing; just update our copy of
      // the list.
      const devices = this.context.getStoredDevicesForUser(userId);
      this.setState({
        devices: devices,
        e2eStatus: this._getE2EStatus(devices)
      });
    }
  },
  _getE2EStatus: function (devices) {
    const hasUnverifiedDevice = devices.some(device => device.isUnverified());
    return hasUnverifiedDevice ? "warning" : "verified";
  },
  onRoom: function (room) {
    this.forceUpdate();
  },
  onDeleteRoom: function (roomId) {
    this.forceUpdate();
  },
  onRoomTimeline: function (ev, room, toStartOfTimeline) {
    if (toStartOfTimeline) return;
    this.forceUpdate();
  },
  onRoomName: function (room) {
    this.forceUpdate();
  },
  onRoomReceipt: function (receiptEvent, room) {
    // because if we read a notification, it will affect notification count
    // only bother updating if there's a receipt from us
    if ((0, _Receipt.findReadReceiptFromUserId)(receiptEvent, this.context.credentials.userId)) {
      this.forceUpdate();
    }
  },
  onRoomStateEvents: function (ev, state) {
    this.forceUpdate();
  },
  onRoomMemberName: function (ev, member) {
    this.forceUpdate();
  },
  onRoomMemberMembership: function (ev, member) {
    if (this.props.member.userId === member.userId) this.forceUpdate();
  },
  onAccountData: function (ev) {
    if (ev.getType() === 'm.direct') {
      this.forceUpdate();
    }
  },
  _updateStateForNewMember: async function (member) {
    const newState = await this._calculateOpsPermissions(member);
    newState.devicesLoading = true;
    newState.devices = null;
    this.setState(newState);

    if (this._cancelDeviceList) {
      this._cancelDeviceList();

      this._cancelDeviceList = null;
    }

    this._downloadDeviceList(member);
  },
  _downloadDeviceList: function (member) {
    if (!this._enableDevices) {
      return;
    }

    let cancelled = false;

    this._cancelDeviceList = function () {
      cancelled = true;
    };

    const client = this.context;
    const self = this;
    client.downloadKeys([member.userId], true).then(() => {
      return client.getStoredDevicesForUser(member.userId);
    }).finally(function () {
      self._cancelDeviceList = null;
    }).then(function (devices) {
      if (cancelled) {
        // we got cancelled - presumably a different user now
        return;
      }

      self._disambiguateDevices(devices);

      self.setState({
        devicesLoading: false,
        devices: devices,
        e2eStatus: self._getE2EStatus(devices)
      });
    }, function (err) {
      console.log("Error downloading sessions", err);
      self.setState({
        devicesLoading: false
      });
    });
  },
  onIgnoreToggle: function () {
    const ignoredUsers = this.context.getIgnoredUsers();

    if (this.state.isIgnoring) {
      const index = ignoredUsers.indexOf(this.props.member.userId);
      if (index !== -1) ignoredUsers.splice(index, 1);
    } else {
      ignoredUsers.push(this.props.member.userId);
    }

    this.context.setIgnoredUsers(ignoredUsers).then(() => {
      return this.setState({
        isIgnoring: !this.state.isIgnoring
      });
    });
  },
  onKick: function () {
    const membership = this.props.member.membership;
    const ConfirmUserActionDialog = sdk.getComponent("dialogs.ConfirmUserActionDialog");

    _Modal.default.createTrackedDialog('Confirm User Action Dialog', 'onKick', ConfirmUserActionDialog, {
      member: this.props.member,
      action: membership === "invite" ? (0, _languageHandler._t)("Disinvite") : (0, _languageHandler._t)("Kick"),
      title: membership === "invite" ? (0, _languageHandler._t)("Disinvite this user?") : (0, _languageHandler._t)("Kick this user?"),
      askReason: membership === "join",
      danger: true,
      onFinished: (proceed, reason) => {
        if (!proceed) return;
        this.setState({
          updating: this.state.updating + 1
        });
        this.context.kick(this.props.member.roomId, this.props.member.userId, reason || undefined).then(function () {
          // NO-OP; rely on the m.room.member event coming down else we could
          // get out of sync if we force setState here!
          console.log("Kick success");
        }, function (err) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Kick error: " + err);

          _Modal.default.createTrackedDialog('Failed to kick', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Failed to kick"),
            description: err && err.message ? err.message : "Operation failed"
          });
        }).finally(() => {
          this.setState({
            updating: this.state.updating - 1
          });
        });
      }
    });
  },
  onBanOrUnban: function () {
    const ConfirmUserActionDialog = sdk.getComponent("dialogs.ConfirmUserActionDialog");

    _Modal.default.createTrackedDialog('Confirm User Action Dialog', 'onBanOrUnban', ConfirmUserActionDialog, {
      member: this.props.member,
      action: this.props.member.membership === 'ban' ? (0, _languageHandler._t)("Unban") : (0, _languageHandler._t)("Ban"),
      title: this.props.member.membership === 'ban' ? (0, _languageHandler._t)("Unban this user?") : (0, _languageHandler._t)("Ban this user?"),
      askReason: this.props.member.membership !== 'ban',
      danger: this.props.member.membership !== 'ban',
      onFinished: (proceed, reason) => {
        if (!proceed) return;
        this.setState({
          updating: this.state.updating + 1
        });
        let promise;

        if (this.props.member.membership === 'ban') {
          promise = this.context.unban(this.props.member.roomId, this.props.member.userId);
        } else {
          promise = this.context.ban(this.props.member.roomId, this.props.member.userId, reason || undefined);
        }

        promise.then(function () {
          // NO-OP; rely on the m.room.member event coming down else we could
          // get out of sync if we force setState here!
          console.log("Ban success");
        }, function (err) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Ban error: " + err);

          _Modal.default.createTrackedDialog('Failed to ban user', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Error"),
            description: (0, _languageHandler._t)("Failed to ban user")
          });
        }).finally(() => {
          this.setState({
            updating: this.state.updating - 1
          });
        });
      }
    });
  },
  onRedactAllMessages: async function () {
    const {
      roomId,
      userId
    } = this.props.member;
    const room = this.context.getRoom(roomId);

    if (!room) {
      return;
    }

    const timelineSet = room.getUnfilteredTimelineSet();
    let eventsToRedact = [];

    for (const timeline of timelineSet.getTimelines()) {
      eventsToRedact = timeline.getEvents().reduce((events, event) => {
        if (event.getSender() === userId && !event.isRedacted() && !event.isRedaction()) {
          return events.concat(event);
        } else {
          return events;
        }
      }, eventsToRedact);
    }

    const count = eventsToRedact.length;
    const user = this.props.member.name;

    if (count === 0) {
      const InfoDialog = sdk.getComponent("dialogs.InfoDialog");

      _Modal.default.createTrackedDialog('No user messages found to remove', '', InfoDialog, {
        title: (0, _languageHandler._t)("No recent messages by %(user)s found", {
          user
        }),
        description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Try scrolling up in the timeline to see if there are any earlier ones.")))
      });
    } else {
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
      const confirmed = await new Promise(resolve => {
        _Modal.default.createTrackedDialog('Remove recent messages by user', '', QuestionDialog, {
          title: (0, _languageHandler._t)("Remove recent messages by %(user)s", {
            user
          }),
          description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You are about to remove %(count)s messages by %(user)s. This cannot be undone. Do you wish to continue?", {
            count,
            user
          })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("For a large amount of messages, this might take some time. Please don't refresh your client in the meantime."))),
          button: (0, _languageHandler._t)("Remove %(count)s messages", {
            count
          }),
          onFinished: resolve
        });
      });

      if (!confirmed) {
        return;
      } // Submitting a large number of redactions freezes the UI,
      // so first yield to allow to rerender after closing the dialog.


      await Promise.resolve();
      console.info("Started redacting recent ".concat(count, " messages for ").concat(user, " in ").concat(roomId));
      await Promise.all(eventsToRedact.map(async event => {
        try {
          await this.context.redactEvent(roomId, event.getId());
        } catch (err) {
          // log and swallow errors
          console.error("Could not redact", event.getId());
          console.error(err);
        }
      }));
      console.info("Finished redacting recent ".concat(count, " messages for ").concat(user, " in ").concat(roomId));
    }
  },
  _warnSelfDemote: function () {
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    return new Promise(resolve => {
      _Modal.default.createTrackedDialog('Demoting Self', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Demote yourself?"),
        description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("You will not be able to undo this change as you are demoting yourself, " + "if you are the last privileged user in the room it will be impossible " + "to regain privileges.")),
        button: (0, _languageHandler._t)("Demote"),
        onFinished: resolve
      });
    });
  },
  onMuteToggle: async function () {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const roomId = this.props.member.roomId;
    const target = this.props.member.userId;
    const room = this.context.getRoom(roomId);
    if (!room) return; // if muting self, warn as it may be irreversible

    if (target === this.context.getUserId()) {
      try {
        if (!(await this._warnSelfDemote())) return;
      } catch (e) {
        console.error("Failed to warn about self demotion: ", e);
        return;
      }
    }

    const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevelEvent) return;
    const isMuted = this.state.muted;
    const powerLevels = powerLevelEvent.getContent();
    const levelToSend = (powerLevels.events ? powerLevels.events["m.room.message"] : null) || powerLevels.events_default;
    let level;

    if (isMuted) {
      // unmute
      level = levelToSend;
    } else {
      // mute
      level = levelToSend - 1;
    }

    level = parseInt(level);

    if (!isNaN(level)) {
      this.setState({
        updating: this.state.updating + 1
      });
      this.context.setPowerLevel(roomId, target, level, powerLevelEvent).then(function () {
        // NO-OP; rely on the m.room.member event coming down else we could
        // get out of sync if we force setState here!
        console.log("Mute toggle success");
      }, function (err) {
        console.error("Mute error: " + err);

        _Modal.default.createTrackedDialog('Failed to mute user', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Error"),
          description: (0, _languageHandler._t)("Failed to mute user")
        });
      }).finally(() => {
        this.setState({
          updating: this.state.updating - 1
        });
      });
    }
  },
  onModToggle: function () {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const roomId = this.props.member.roomId;
    const target = this.props.member.userId;
    const room = this.context.getRoom(roomId);
    if (!room) return;
    const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevelEvent) return;
    const me = room.getMember(this.context.credentials.userId);
    if (!me) return;
    const defaultLevel = powerLevelEvent.getContent().users_default;
    let modLevel = me.powerLevel - 1;
    if (modLevel > 50 && defaultLevel < 50) modLevel = 50; // try to stick with the vector level defaults
    // toggle the level

    const newLevel = this.state.isTargetMod ? defaultLevel : modLevel;
    this.setState({
      updating: this.state.updating + 1
    });
    this.context.setPowerLevel(roomId, target, parseInt(newLevel), powerLevelEvent).then(function () {
      // NO-OP; rely on the m.room.member event coming down else we could
      // get out of sync if we force setState here!
      console.log("Mod toggle success");
    }, function (err) {
      if (err.errcode === 'M_GUEST_ACCESS_FORBIDDEN') {
        _dispatcher.default.dispatch({
          action: 'require_registration'
        });
      } else {
        console.error("Toggle moderator error:" + err);

        _Modal.default.createTrackedDialog('Failed to toggle moderator status', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Error"),
          description: (0, _languageHandler._t)("Failed to toggle moderator status")
        });
      }
    }).finally(() => {
      this.setState({
        updating: this.state.updating - 1
      });
    });
  },
  onSynapseDeactivate: function () {
    const QuestionDialog = sdk.getComponent('views.dialogs.QuestionDialog');

    _Modal.default.createTrackedDialog('Synapse User Deactivation', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Deactivate user?"),
      description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Deactivating this user will log them out and prevent them from logging back in. Additionally, " + "they will leave all the rooms they are in. This action cannot be reversed. Are you sure you want to " + "deactivate this user?")),
      button: (0, _languageHandler._t)("Deactivate user"),
      danger: true,
      onFinished: accepted => {
        if (!accepted) return;
        this.context.deactivateSynapseUser(this.props.member.userId).catch(e => {
          console.error("Failed to deactivate user");
          console.error(e);
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Failed to deactivate Synapse user', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Failed to deactivate user'),
            description: e && e.message ? e.message : (0, _languageHandler._t)("Operation failed")
          });
        });
      }
    });
  },
  _applyPowerChange: function (roomId, target, powerLevel, powerLevelEvent) {
    this.setState({
      updating: this.state.updating + 1
    });
    this.context.setPowerLevel(roomId, target, parseInt(powerLevel), powerLevelEvent).then(function () {
      // NO-OP; rely on the m.room.member event coming down else we could
      // get out of sync if we force setState here!
      console.log("Power change success");
    }, function (err) {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Failed to change power level " + err);

      _Modal.default.createTrackedDialog('Failed to change power level', '', ErrorDialog, {
        title: (0, _languageHandler._t)("Error"),
        description: (0, _languageHandler._t)("Failed to change power level")
      });
    }).finally(() => {
      this.setState({
        updating: this.state.updating - 1
      });
    });
  },
  onPowerChange: async function (powerLevel) {
    const roomId = this.props.member.roomId;
    const target = this.props.member.userId;
    const room = this.context.getRoom(roomId);
    if (!room) return;
    const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevelEvent) return;

    if (!powerLevelEvent.getContent().users) {
      this._applyPowerChange(roomId, target, powerLevel, powerLevelEvent);

      return;
    }

    const myUserId = this.context.getUserId();
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog"); // If we are changing our own PL it can only ever be decreasing, which we cannot reverse.

    if (myUserId === target) {
      try {
        if (!(await this._warnSelfDemote())) return;

        this._applyPowerChange(roomId, target, powerLevel, powerLevelEvent);
      } catch (e) {
        console.error("Failed to warn about self demotion: ", e);
      }

      return;
    }

    const myPower = powerLevelEvent.getContent().users[myUserId];

    if (parseInt(myPower) === parseInt(powerLevel)) {
      _Modal.default.createTrackedDialog('Promote to PL100 Warning', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Warning!"),
        description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("You will not be able to undo this change as you are promoting the user " + "to have the same power level as yourself."), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Are you sure?")),
        button: (0, _languageHandler._t)("Continue"),
        onFinished: confirmed => {
          if (confirmed) {
            this._applyPowerChange(roomId, target, powerLevel, powerLevelEvent);
          }
        }
      });

      return;
    }

    this._applyPowerChange(roomId, target, powerLevel, powerLevelEvent);
  },
  onNewDMClick: function () {
    this.setState({
      updating: this.state.updating + 1
    });
    (0, _createRoom.default)({
      dmUserId: this.props.member.userId
    }).finally(() => {
      this.setState({
        updating: this.state.updating - 1
      });
    });
  },
  onLeaveClick: function () {
    _dispatcher.default.dispatch({
      action: 'leave_room',
      room_id: this.props.member.roomId
    });
  },
  _calculateOpsPermissions: async function (member) {
    let canDeactivate = false;

    if (this.context) {
      try {
        canDeactivate = await this.context.isSynapseAdministrator();
      } catch (e) {
        console.error(e);
      }
    }

    const defaultPerms = {
      can: {
        // Calculate permissions for Synapse before doing the PL checks
        synapseDeactivate: canDeactivate
      },
      muted: false
    };
    const room = this.context.getRoom(member.roomId);
    if (!room) return defaultPerms;
    const powerLevels = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevels) return defaultPerms;
    const me = room.getMember(this.context.credentials.userId);
    if (!me) return defaultPerms;
    const them = member;
    return {
      can: _objectSpread({}, defaultPerms.can, {}, (await this._calculateCanPermissions(me, them, powerLevels.getContent()))),
      muted: this._isMuted(them, powerLevels.getContent()),
      isTargetMod: them.powerLevel > powerLevels.getContent().users_default
    };
  },
  _calculateCanPermissions: function (me, them, powerLevels) {
    const isMe = me.userId === them.userId;
    const can = {
      kick: false,
      ban: false,
      mute: false,
      modifyLevel: false,
      modifyLevelMax: 0,
      redactMessages: me.powerLevel >= powerLevels.redact
    };
    const canAffectUser = them.powerLevel < me.powerLevel || isMe;

    if (!canAffectUser) {
      //console.info("Cannot affect user: %s >= %s", them.powerLevel, me.powerLevel);
      return can;
    }

    const editPowerLevel = (powerLevels.events ? powerLevels.events["m.room.power_levels"] : null) || powerLevels.state_default;
    can.kick = me.powerLevel >= powerLevels.kick;
    can.ban = me.powerLevel >= powerLevels.ban;
    can.invite = me.powerLevel >= powerLevels.invite;
    can.mute = me.powerLevel >= editPowerLevel;
    can.modifyLevel = me.powerLevel >= editPowerLevel && (isMe || me.powerLevel > them.powerLevel);
    can.modifyLevelMax = me.powerLevel;
    return can;
  },
  _isMuted: function (member, powerLevelContent) {
    if (!powerLevelContent || !member) return false;
    const levelToSend = (powerLevelContent.events ? powerLevelContent.events["m.room.message"] : null) || powerLevelContent.events_default;
    return member.powerLevel < levelToSend;
  },
  onCancel: function (e) {
    _dispatcher.default.dispatch({
      action: _actions.Action.ViewUser,
      member: null
    });
  },
  onMemberAvatarClick: function () {
    const member = this.props.member;
    const avatarUrl = member.getMxcAvatarUrl();
    if (!avatarUrl) return;
    const httpUrl = this.context.mxcUrlToHttp(avatarUrl);
    const ImageView = sdk.getComponent("elements.ImageView");
    const params = {
      src: httpUrl,
      name: member.name
    };

    _Modal.default.createDialog(ImageView, params, "mx_Dialog_lightbox");
  },

  onRoomTileClick(roomId) {
    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: roomId
    });
  },

  _renderDevices: function () {
    if (!this._enableDevices) return null;
    const devices = this.state.devices;
    const MemberDeviceInfo = sdk.getComponent('rooms.MemberDeviceInfo');
    const Spinner = sdk.getComponent("elements.Spinner");
    let devComponents;

    if (this.state.devicesLoading) {
      // still loading
      devComponents = /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else if (devices === null) {
      devComponents = (0, _languageHandler._t)("Unable to load session list");
    } else if (devices.length === 0) {
      devComponents = (0, _languageHandler._t)("No sessions with registered encryption keys");
    } else {
      devComponents = [];

      for (let i = 0; i < devices.length; i++) {
        devComponents.push( /*#__PURE__*/_react.default.createElement(MemberDeviceInfo, {
          key: i,
          userId: this.props.member.userId,
          device: devices[i]
        }));
      }
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Sessions")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_devices"
    }, devComponents));
  },
  onShareUserClick: function () {
    const ShareDialog = sdk.getComponent("dialogs.ShareDialog");

    _Modal.default.createTrackedDialog('share room member dialog', '', ShareDialog, {
      target: this.props.member
    });
  },
  _renderUserOptions: function () {
    const cli = this.context;
    const member = this.props.member;
    let ignoreButton = null;
    let insertPillButton = null;
    let inviteUserButton = null;
    let readReceiptButton = null; // Only allow the user to ignore the user if its not ourselves
    // same goes for jumping to read receipt

    if (member.userId !== cli.getUserId()) {
      ignoreButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onIgnoreToggle,
        className: "mx_MemberInfo_field"
      }, this.state.isIgnoring ? (0, _languageHandler._t)("Unignore") : (0, _languageHandler._t)("Ignore"));

      if (member.roomId) {
        const room = cli.getRoom(member.roomId);
        const eventId = room.getEventReadUpTo(member.userId);

        const onReadReceiptButton = function () {
          _dispatcher.default.dispatch({
            action: 'view_room',
            highlighted: true,
            event_id: eventId,
            room_id: member.roomId
          });
        };

        const onInsertPillButton = function () {
          _dispatcher.default.dispatch({
            action: 'insert_mention',
            user_id: member.userId
          });
        };

        readReceiptButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          onClick: onReadReceiptButton,
          className: "mx_MemberInfo_field"
        }, (0, _languageHandler._t)('Jump to read receipt'));
        insertPillButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          onClick: onInsertPillButton,
          className: "mx_MemberInfo_field"
        }, (0, _languageHandler._t)('Mention'));
      }

      if (this.state.can.invite && (!member || !member.membership || member.membership === 'leave')) {
        const roomId = member && member.roomId ? member.roomId : _RoomViewStore.default.getRoomId();

        const onInviteUserButton = async () => {
          try {
            // We use a MultiInviter to re-use the invite logic, even though
            // we're only inviting one user.
            const inviter = new _MultiInviter.default(roomId);
            await inviter.invite([member.userId]).then(() => {
              if (inviter.getCompletionState(member.userId) !== "invited") throw new Error(inviter.getErrorText(member.userId));
            });
          } catch (err) {
            const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

            _Modal.default.createTrackedDialog('Failed to invite', '', ErrorDialog, {
              title: (0, _languageHandler._t)('Failed to invite'),
              description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
            });
          }
        };

        inviteUserButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          onClick: onInviteUserButton,
          className: "mx_MemberInfo_field"
        }, (0, _languageHandler._t)('Invite'));
      }
    }

    const shareUserButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this.onShareUserClick,
      className: "mx_MemberInfo_field"
    }, (0, _languageHandler._t)('Share Link to User'));

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("User Options")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_buttons"
    }, readReceiptButton, shareUserButton, insertPillButton, ignoreButton, inviteUserButton));
  },
  render: function () {
    let startChat;
    let kickButton;
    let banButton;
    let muteButton;
    let giveModButton;
    let redactButton;
    let synapseDeactivateButton;
    let spinner;

    if (this.props.member.userId !== this.context.credentials.userId) {
      // TODO: Immutable DMs replaces a lot of this
      const dmRoomMap = new _DMRoomMap.default(this.context); // dmRooms will not include dmRooms that we have been invited into but did not join.
      // Because DMRoomMap runs off account_data[m.direct] which is only set on join of dm room.
      // XXX: we potentially want DMs we have been invited to, to also show up here :L
      // especially as logic below concerns specially if we haven't joined but have been invited

      const dmRooms = dmRoomMap.getDMRoomsForUserId(this.props.member.userId);
      const RoomTile = sdk.getComponent("rooms.RoomTile");
      const tiles = [];

      for (const roomId of dmRooms) {
        const room = this.context.getRoom(roomId);

        if (room) {
          const myMembership = room.getMyMembership(); // not a DM room if we have are not joined

          if (myMembership !== 'join') continue;
          const them = this.props.member; // not a DM room if they are not joined

          if (!them.membership || them.membership !== 'join') continue;
          const highlight = room.getUnreadNotificationCount('highlight') > 0;
          tiles.push( /*#__PURE__*/_react.default.createElement(RoomTile, {
            key: room.roomId,
            room: room,
            transparent: true,
            collapsed: false,
            selected: false,
            unread: Unread.doesRoomHaveUnreadMessages(room),
            highlight: highlight,
            isInvite: false,
            onClick: this.onRoomTileClick
          }));
        }
      }

      const labelClasses = (0, _classnames.default)({
        mx_MemberInfo_createRoom_label: true,
        mx_RoomTile_name: true
      });

      let startNewChat = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_createRoom",
        onClick: this.onNewDMClick
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomTile_avatar"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/create-big.svg"),
        width: "26",
        height: "26"
      })), /*#__PURE__*/_react.default.createElement("div", {
        className: labelClasses
      }, /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)("Start a chat"))));

      if (tiles.length > 0) startNewChat = null; // Don't offer a button for a new chat if we have one.

      startChat = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Direct chats")), tiles, startNewChat);
    }

    if (this.state.updating) {
      const Loader = sdk.getComponent("elements.Spinner");
      spinner = /*#__PURE__*/_react.default.createElement(Loader, {
        imgClassName: "mx_ContextualMenu_spinner"
      });
    }

    if (this.state.can.kick) {
      const membership = this.props.member.membership;
      const kickLabel = membership === "invite" ? (0, _languageHandler._t)("Disinvite") : (0, _languageHandler._t)("Kick");
      kickButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_field",
        onClick: this.onKick
      }, kickLabel);
    }

    if (this.state.can.redactMessages) {
      redactButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_field",
        onClick: this.onRedactAllMessages
      }, (0, _languageHandler._t)("Remove recent messages"));
    }

    if (this.state.can.ban) {
      let label = (0, _languageHandler._t)("Ban");

      if (this.props.member.membership === 'ban') {
        label = (0, _languageHandler._t)("Unban");
      }

      banButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_field",
        onClick: this.onBanOrUnban
      }, label);
    }

    if (this.state.can.mute) {
      const muteLabel = this.state.muted ? (0, _languageHandler._t)("Unmute") : (0, _languageHandler._t)("Mute");
      muteButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_field",
        onClick: this.onMuteToggle
      }, muteLabel);
    }

    if (this.state.can.toggleMod) {
      const giveOpLabel = this.state.isTargetMod ? (0, _languageHandler._t)("Revoke Moderator") : (0, _languageHandler._t)("Make Moderator");
      giveModButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_field",
        onClick: this.onModToggle
      }, giveOpLabel);
    } // We don't need a perfect check here, just something to pass as "probably not our homeserver". If
    // someone does figure out how to bypass this check the worst that happens is an error.


    const sameHomeserver = this.props.member.userId.endsWith(":".concat(_MatrixClientPeg.MatrixClientPeg.getHomeserverName()));

    if (this.state.can.synapseDeactivate && sameHomeserver) {
      synapseDeactivateButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onSynapseDeactivate,
        className: "mx_MemberInfo_field"
      }, (0, _languageHandler._t)("Deactivate user"));
    }

    let adminTools;

    if (kickButton || banButton || muteButton || giveModButton || synapseDeactivateButton || redactButton) {
      adminTools = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Admin Tools")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_buttons"
      }, muteButton, kickButton, banButton, redactButton, giveModButton, synapseDeactivateButton));
    }

    const memberName = this.props.member.name;
    let presenceState;
    let presenceLastActiveAgo;
    let presenceCurrentlyActive;
    let statusMessage;

    if (this.props.member.user) {
      presenceState = this.props.member.user.presence;
      presenceLastActiveAgo = this.props.member.user.lastActiveAgo;
      presenceCurrentlyActive = this.props.member.user.currentlyActive;

      if (_SettingsStore.default.isFeatureEnabled("feature_custom_status")) {
        statusMessage = this.props.member.user._unstable_statusMessage;
      }
    }

    const room = this.context.getRoom(this.props.member.roomId);
    const powerLevelEvent = room ? room.currentState.getStateEvents("m.room.power_levels", "") : null;
    const powerLevelUsersDefault = powerLevelEvent ? powerLevelEvent.getContent().users_default : 0;

    const enablePresenceByHsUrl = _SdkConfig.default.get()["enable_presence_by_hs_url"];

    const hsUrl = this.context.baseUrl;
    let showPresence = true;

    if (enablePresenceByHsUrl && enablePresenceByHsUrl[hsUrl] !== undefined) {
      showPresence = enablePresenceByHsUrl[hsUrl];
    }

    let presenceLabel = null;

    if (showPresence) {
      const PresenceLabel = sdk.getComponent('rooms.PresenceLabel');
      presenceLabel = /*#__PURE__*/_react.default.createElement(PresenceLabel, {
        activeAgo: presenceLastActiveAgo,
        currentlyActive: presenceCurrentlyActive,
        presenceState: presenceState
      });
    }

    let statusLabel = null;

    if (statusMessage) {
      statusLabel = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MemberInfo_statusMessage"
      }, statusMessage);
    }

    let roomMemberDetails = null;
    let e2eIconElement;

    if (this.props.member.roomId) {
      // is in room
      const PowerSelector = sdk.getComponent('elements.PowerSelector');
      roomMemberDetails = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_profileField"
      }, /*#__PURE__*/_react.default.createElement(PowerSelector, {
        value: parseInt(this.props.member.powerLevel),
        maxValue: this.state.can.modifyLevelMax,
        disabled: !this.state.can.modifyLevel,
        usersDefault: powerLevelUsersDefault,
        onChange: this.onPowerChange
      })), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_profileField"
      }, presenceLabel, statusLabel));
      const isEncrypted = this.context.isRoomEncrypted(this.props.member.roomId);

      if (this.state.e2eStatus && isEncrypted) {
        e2eIconElement = /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
          status: this.state.e2eStatus,
          isUser: true
        });
      }
    }

    const {
      member
    } = this.props;
    const avatarUrl = member.avatarUrl || member.getMxcAvatarUrl && member.getMxcAvatarUrl();
    let avatarElement;

    if (avatarUrl) {
      const httpUrl = this.context.mxcUrlToHttp(avatarUrl, 800, 800);
      avatarElement = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_avatar"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: httpUrl
      }));
    }

    let backButton;

    if (this.props.member.roomId) {
      backButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_MemberInfo_cancel",
        onClick: this.onCancel,
        title: (0, _languageHandler._t)('Close')
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo",
      role: "tabpanel"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_name"
    }, backButton, e2eIconElement, /*#__PURE__*/_react.default.createElement("h2", null, memberName)), avatarElement, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_container"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_profile"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_profileField"
    }, this.props.member.userId), roomMemberDetails)), /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
      className: "mx_MemberInfo_scrollContainer"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_container"
    }, this._renderUserOptions(), adminTools, startChat, this._renderDevices(), spinner)));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL01lbWJlckluZm8uanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJtZW1iZXIiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwiZ2V0SW5pdGlhbFN0YXRlIiwiY2FuIiwia2ljayIsImJhbiIsIm11dGUiLCJtb2RpZnlMZXZlbCIsInN5bmFwc2VEZWFjdGl2YXRlIiwicmVkYWN0TWVzc2FnZXMiLCJtdXRlZCIsImlzVGFyZ2V0TW9kIiwidXBkYXRpbmciLCJkZXZpY2VzTG9hZGluZyIsImRldmljZXMiLCJpc0lnbm9yaW5nIiwic3RhdGljcyIsImNvbnRleHRUeXBlIiwiTWF0cml4Q2xpZW50Q29udGV4dCIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJfY2FuY2VsRGV2aWNlTGlzdCIsImNsaSIsImNvbnRleHQiLCJfZW5hYmxlRGV2aWNlcyIsImlzQ3J5cHRvRW5hYmxlZCIsIm9uIiwib25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkIiwib25Sb29tIiwib25EZWxldGVSb29tIiwib25Sb29tVGltZWxpbmUiLCJvblJvb21OYW1lIiwib25Sb29tUmVjZWlwdCIsIm9uUm9vbVN0YXRlRXZlbnRzIiwib25Sb29tTWVtYmVyTmFtZSIsIm9uUm9vbU1lbWJlck1lbWJlcnNoaXAiLCJvbkFjY291bnREYXRhIiwiX2NoZWNrSWdub3JlU3RhdGUiLCJfdXBkYXRlU3RhdGVGb3JOZXdNZW1iZXIiLCJwcm9wcyIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV3UHJvcHMiLCJ1c2VySWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsaWVudCIsInJlbW92ZUxpc3RlbmVyIiwiaXNVc2VySWdub3JlZCIsInNldFN0YXRlIiwiX2Rpc2FtYmlndWF0ZURldmljZXMiLCJuYW1lcyIsIk9iamVjdCIsImNyZWF0ZSIsImkiLCJsZW5ndGgiLCJuYW1lIiwiZ2V0RGlzcGxheU5hbWUiLCJpbmRleExpc3QiLCJwdXNoIiwiZm9yRWFjaCIsImoiLCJhbWJpZ3VvdXMiLCJkZXZpY2UiLCJnZXRTdG9yZWREZXZpY2VzRm9yVXNlciIsImUyZVN0YXR1cyIsIl9nZXRFMkVTdGF0dXMiLCJoYXNVbnZlcmlmaWVkRGV2aWNlIiwic29tZSIsImlzVW52ZXJpZmllZCIsInJvb20iLCJmb3JjZVVwZGF0ZSIsInJvb21JZCIsImV2IiwidG9TdGFydE9mVGltZWxpbmUiLCJyZWNlaXB0RXZlbnQiLCJjcmVkZW50aWFscyIsInN0YXRlIiwiZ2V0VHlwZSIsIm5ld1N0YXRlIiwiX2NhbGN1bGF0ZU9wc1Blcm1pc3Npb25zIiwiX2Rvd25sb2FkRGV2aWNlTGlzdCIsImNhbmNlbGxlZCIsInNlbGYiLCJkb3dubG9hZEtleXMiLCJ0aGVuIiwiZmluYWxseSIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJvbklnbm9yZVRvZ2dsZSIsImlnbm9yZWRVc2VycyIsImdldElnbm9yZWRVc2VycyIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInNldElnbm9yZWRVc2VycyIsIm9uS2ljayIsIm1lbWJlcnNoaXAiLCJDb25maXJtVXNlckFjdGlvbkRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsImFjdGlvbiIsInRpdGxlIiwiYXNrUmVhc29uIiwiZGFuZ2VyIiwib25GaW5pc2hlZCIsInByb2NlZWQiLCJyZWFzb24iLCJ1bmRlZmluZWQiLCJFcnJvckRpYWxvZyIsImVycm9yIiwiZGVzY3JpcHRpb24iLCJtZXNzYWdlIiwib25CYW5PclVuYmFuIiwicHJvbWlzZSIsInVuYmFuIiwib25SZWRhY3RBbGxNZXNzYWdlcyIsImdldFJvb20iLCJ0aW1lbGluZVNldCIsImdldFVuZmlsdGVyZWRUaW1lbGluZVNldCIsImV2ZW50c1RvUmVkYWN0IiwidGltZWxpbmUiLCJnZXRUaW1lbGluZXMiLCJnZXRFdmVudHMiLCJyZWR1Y2UiLCJldmVudHMiLCJldmVudCIsImdldFNlbmRlciIsImlzUmVkYWN0ZWQiLCJpc1JlZGFjdGlvbiIsImNvbmNhdCIsImNvdW50IiwidXNlciIsIkluZm9EaWFsb2ciLCJRdWVzdGlvbkRpYWxvZyIsImNvbmZpcm1lZCIsIlByb21pc2UiLCJyZXNvbHZlIiwiYnV0dG9uIiwiaW5mbyIsImFsbCIsIm1hcCIsInJlZGFjdEV2ZW50IiwiZ2V0SWQiLCJfd2FyblNlbGZEZW1vdGUiLCJvbk11dGVUb2dnbGUiLCJ0YXJnZXQiLCJnZXRVc2VySWQiLCJlIiwicG93ZXJMZXZlbEV2ZW50IiwiY3VycmVudFN0YXRlIiwiZ2V0U3RhdGVFdmVudHMiLCJpc011dGVkIiwicG93ZXJMZXZlbHMiLCJnZXRDb250ZW50IiwibGV2ZWxUb1NlbmQiLCJldmVudHNfZGVmYXVsdCIsImxldmVsIiwicGFyc2VJbnQiLCJpc05hTiIsInNldFBvd2VyTGV2ZWwiLCJvbk1vZFRvZ2dsZSIsIm1lIiwiZ2V0TWVtYmVyIiwiZGVmYXVsdExldmVsIiwidXNlcnNfZGVmYXVsdCIsIm1vZExldmVsIiwicG93ZXJMZXZlbCIsIm5ld0xldmVsIiwiZXJyY29kZSIsImRpcyIsImRpc3BhdGNoIiwib25TeW5hcHNlRGVhY3RpdmF0ZSIsImFjY2VwdGVkIiwiZGVhY3RpdmF0ZVN5bmFwc2VVc2VyIiwiY2F0Y2giLCJfYXBwbHlQb3dlckNoYW5nZSIsIm9uUG93ZXJDaGFuZ2UiLCJ1c2VycyIsIm15VXNlcklkIiwibXlQb3dlciIsIm9uTmV3RE1DbGljayIsImRtVXNlcklkIiwib25MZWF2ZUNsaWNrIiwicm9vbV9pZCIsImNhbkRlYWN0aXZhdGUiLCJpc1N5bmFwc2VBZG1pbmlzdHJhdG9yIiwiZGVmYXVsdFBlcm1zIiwidGhlbSIsIl9jYWxjdWxhdGVDYW5QZXJtaXNzaW9ucyIsIl9pc011dGVkIiwiaXNNZSIsIm1vZGlmeUxldmVsTWF4IiwicmVkYWN0IiwiY2FuQWZmZWN0VXNlciIsImVkaXRQb3dlckxldmVsIiwic3RhdGVfZGVmYXVsdCIsImludml0ZSIsInBvd2VyTGV2ZWxDb250ZW50Iiwib25DYW5jZWwiLCJBY3Rpb24iLCJWaWV3VXNlciIsIm9uTWVtYmVyQXZhdGFyQ2xpY2siLCJhdmF0YXJVcmwiLCJnZXRNeGNBdmF0YXJVcmwiLCJodHRwVXJsIiwibXhjVXJsVG9IdHRwIiwiSW1hZ2VWaWV3IiwicGFyYW1zIiwic3JjIiwiY3JlYXRlRGlhbG9nIiwib25Sb29tVGlsZUNsaWNrIiwiX3JlbmRlckRldmljZXMiLCJNZW1iZXJEZXZpY2VJbmZvIiwiU3Bpbm5lciIsImRldkNvbXBvbmVudHMiLCJvblNoYXJlVXNlckNsaWNrIiwiU2hhcmVEaWFsb2ciLCJfcmVuZGVyVXNlck9wdGlvbnMiLCJpZ25vcmVCdXR0b24iLCJpbnNlcnRQaWxsQnV0dG9uIiwiaW52aXRlVXNlckJ1dHRvbiIsInJlYWRSZWNlaXB0QnV0dG9uIiwiZXZlbnRJZCIsImdldEV2ZW50UmVhZFVwVG8iLCJvblJlYWRSZWNlaXB0QnV0dG9uIiwiaGlnaGxpZ2h0ZWQiLCJldmVudF9pZCIsIm9uSW5zZXJ0UGlsbEJ1dHRvbiIsInVzZXJfaWQiLCJSb29tVmlld1N0b3JlIiwiZ2V0Um9vbUlkIiwib25JbnZpdGVVc2VyQnV0dG9uIiwiaW52aXRlciIsIk11bHRpSW52aXRlciIsImdldENvbXBsZXRpb25TdGF0ZSIsIkVycm9yIiwiZ2V0RXJyb3JUZXh0Iiwic2hhcmVVc2VyQnV0dG9uIiwicmVuZGVyIiwic3RhcnRDaGF0Iiwia2lja0J1dHRvbiIsImJhbkJ1dHRvbiIsIm11dGVCdXR0b24iLCJnaXZlTW9kQnV0dG9uIiwicmVkYWN0QnV0dG9uIiwic3luYXBzZURlYWN0aXZhdGVCdXR0b24iLCJzcGlubmVyIiwiZG1Sb29tTWFwIiwiRE1Sb29tTWFwIiwiZG1Sb29tcyIsImdldERNUm9vbXNGb3JVc2VySWQiLCJSb29tVGlsZSIsInRpbGVzIiwibXlNZW1iZXJzaGlwIiwiZ2V0TXlNZW1iZXJzaGlwIiwiaGlnaGxpZ2h0IiwiZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQiLCJVbnJlYWQiLCJkb2VzUm9vbUhhdmVVbnJlYWRNZXNzYWdlcyIsImxhYmVsQ2xhc3NlcyIsIm14X01lbWJlckluZm9fY3JlYXRlUm9vbV9sYWJlbCIsIm14X1Jvb21UaWxlX25hbWUiLCJzdGFydE5ld0NoYXQiLCJyZXF1aXJlIiwiTG9hZGVyIiwia2lja0xhYmVsIiwibGFiZWwiLCJtdXRlTGFiZWwiLCJ0b2dnbGVNb2QiLCJnaXZlT3BMYWJlbCIsInNhbWVIb21lc2VydmVyIiwiZW5kc1dpdGgiLCJNYXRyaXhDbGllbnRQZWciLCJnZXRIb21lc2VydmVyTmFtZSIsImFkbWluVG9vbHMiLCJtZW1iZXJOYW1lIiwicHJlc2VuY2VTdGF0ZSIsInByZXNlbmNlTGFzdEFjdGl2ZUFnbyIsInByZXNlbmNlQ3VycmVudGx5QWN0aXZlIiwic3RhdHVzTWVzc2FnZSIsInByZXNlbmNlIiwibGFzdEFjdGl2ZUFnbyIsImN1cnJlbnRseUFjdGl2ZSIsIlNldHRpbmdzU3RvcmUiLCJpc0ZlYXR1cmVFbmFibGVkIiwiX3Vuc3RhYmxlX3N0YXR1c01lc3NhZ2UiLCJwb3dlckxldmVsVXNlcnNEZWZhdWx0IiwiZW5hYmxlUHJlc2VuY2VCeUhzVXJsIiwiU2RrQ29uZmlnIiwiZ2V0IiwiaHNVcmwiLCJiYXNlVXJsIiwic2hvd1ByZXNlbmNlIiwicHJlc2VuY2VMYWJlbCIsIlByZXNlbmNlTGFiZWwiLCJzdGF0dXNMYWJlbCIsInJvb21NZW1iZXJEZXRhaWxzIiwiZTJlSWNvbkVsZW1lbnQiLCJQb3dlclNlbGVjdG9yIiwiaXNFbmNyeXB0ZWQiLCJpc1Jvb21FbmNyeXB0ZWQiLCJhdmF0YXJFbGVtZW50IiwiYmFja0J1dHRvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQTZCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7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SyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ013RyxVQUROLEVBRU1MLGNBRk4sZUFHSSx5Q0FBTXRCLFVBQU4sQ0FISixDQURKLEVBTU0wQixhQU5OLGVBT0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTSxLQUFLeFEsS0FBTCxDQUFXeEMsTUFBWCxDQUFrQjJDLE1BRHhCLENBREosRUFJTWdRLGlCQUpOLENBRkosQ0FQSixlQWdCSSw2QkFBQywwQkFBRDtBQUFtQixNQUFBLFNBQVMsRUFBQztBQUE3QixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTSxLQUFLL0Usa0JBQUwsRUFETixFQUdNeUQsVUFITixFQUtNbkMsU0FMTixFQU9NLEtBQUs1QixjQUFMLEVBUE4sRUFTTW1DLE9BVE4sQ0FESixDQWhCSixDQURKO0FBZ0NIO0FBdmxDMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTggVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qXG4gKiBTdGF0ZSB2YXJzOlxuICogJ2Nhbic6IHtcbiAqICAga2ljazogYm9vbGVhbixcbiAqICAgYmFuOiBib29sZWFuLFxuICogICBtdXRlOiBib29sZWFuLFxuICogICBtb2RpZnlMZXZlbDogYm9vbGVhblxuICogfSxcbiAqICdtdXRlZCc6IGJvb2xlYW4sXG4gKiAnaXNUYXJnZXRNb2QnOiBib29sZWFuXG4gKi9cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgY3JlYXRlUm9vbSBmcm9tICcuLi8uLi8uLi9jcmVhdGVSb29tJztcbmltcG9ydCBETVJvb21NYXAgZnJvbSAnLi4vLi4vLi4vdXRpbHMvRE1Sb29tTWFwJztcbmltcG9ydCAqIGFzIFVucmVhZCBmcm9tICcuLi8uLi8uLi9VbnJlYWQnO1xuaW1wb3J0IHsgZmluZFJlYWRSZWNlaXB0RnJvbVVzZXJJZCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL1JlY2VpcHQnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgUm9vbVZpZXdTdG9yZSBmcm9tICcuLi8uLi8uLi9zdG9yZXMvUm9vbVZpZXdTdG9yZSc7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gJy4uLy4uLy4uL1Nka0NvbmZpZyc7XG5pbXBvcnQgTXVsdGlJbnZpdGVyIGZyb20gXCIuLi8uLi8uLi91dGlscy9NdWx0aUludml0ZXJcIjtcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgRTJFSWNvbiBmcm9tIFwiLi9FMkVJY29uXCI7XG5pbXBvcnQgQXV0b0hpZGVTY3JvbGxiYXIgZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvQXV0b0hpZGVTY3JvbGxiYXJcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgTWF0cml4Q2xpZW50Q29udGV4dCBmcm9tIFwiLi4vLi4vLi4vY29udGV4dHMvTWF0cml4Q2xpZW50Q29udGV4dFwiO1xuaW1wb3J0IHtBY3Rpb259IGZyb20gXCIuLi8uLi8uLi9kaXNwYXRjaGVyL2FjdGlvbnNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdNZW1iZXJJbmZvJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBtZW1iZXI6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNhbjoge1xuICAgICAgICAgICAgICAgIGtpY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGJhbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgbXV0ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgbW9kaWZ5TGV2ZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN5bmFwc2VEZWFjdGl2YXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZWRhY3RNZXNzYWdlczogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXV0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgaXNUYXJnZXRNb2Q6IGZhbHNlLFxuICAgICAgICAgICAgdXBkYXRpbmc6IDAsXG4gICAgICAgICAgICBkZXZpY2VzTG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIGRldmljZXM6IG51bGwsXG4gICAgICAgICAgICBpc0lnbm9yaW5nOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICBjb250ZXh0VHlwZTogTWF0cml4Q2xpZW50Q29udGV4dCxcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jYW5jZWxEZXZpY2VMaXN0ID0gbnVsbDtcbiAgICAgICAgY29uc3QgY2xpID0gdGhpcy5jb250ZXh0O1xuXG4gICAgICAgIC8vIG9ubHkgZGlzcGxheSB0aGUgZGV2aWNlcyBsaXN0IGlmIG91ciBjbGllbnQgc3VwcG9ydHMgRTJFXG4gICAgICAgIHRoaXMuX2VuYWJsZURldmljZXMgPSBjbGkuaXNDcnlwdG9FbmFibGVkKCk7XG5cbiAgICAgICAgY2xpLm9uKFwiZGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZFwiLCB0aGlzLm9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgIGNsaS5vbihcIlJvb21cIiwgdGhpcy5vblJvb20pO1xuICAgICAgICBjbGkub24oXCJkZWxldGVSb29tXCIsIHRoaXMub25EZWxldGVSb29tKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbS5uYW1lXCIsIHRoaXMub25Sb29tTmFtZSk7XG4gICAgICAgIGNsaS5vbihcIlJvb20ucmVjZWlwdFwiLCB0aGlzLm9uUm9vbVJlY2VpcHQpO1xuICAgICAgICBjbGkub24oXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICBjbGkub24oXCJSb29tTWVtYmVyLm5hbWVcIiwgdGhpcy5vblJvb21NZW1iZXJOYW1lKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbU1lbWJlci5tZW1iZXJzaGlwXCIsIHRoaXMub25Sb29tTWVtYmVyTWVtYmVyc2hpcCk7XG4gICAgICAgIGNsaS5vbihcImFjY291bnREYXRhXCIsIHRoaXMub25BY2NvdW50RGF0YSk7XG5cbiAgICAgICAgdGhpcy5fY2hlY2tJZ25vcmVTdGF0ZSgpO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0YXRlRm9yTmV3TWVtYmVyKHRoaXMucHJvcHMubWVtYmVyKTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubWVtYmVyLnVzZXJJZCAhPT0gbmV3UHJvcHMubWVtYmVyLnVzZXJJZCkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGVGb3JOZXdNZW1iZXIobmV3UHJvcHMubWVtYmVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY29udGV4dDtcbiAgICAgICAgaWYgKGNsaWVudCkge1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiZGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZFwiLCB0aGlzLm9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tXCIsIHRoaXMub25Sb29tKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcImRlbGV0ZVJvb21cIiwgdGhpcy5vbkRlbGV0ZVJvb20pO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcIlJvb20ubmFtZVwiLCB0aGlzLm9uUm9vbU5hbWUpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS5yZWNlaXB0XCIsIHRoaXMub25Sb29tUmVjZWlwdCk7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbU1lbWJlci5uYW1lXCIsIHRoaXMub25Sb29tTWVtYmVyTmFtZSk7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tTWVtYmVyLm1lbWJlcnNoaXBcIiwgdGhpcy5vblJvb21NZW1iZXJNZW1iZXJzaGlwKTtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcImFjY291bnREYXRhXCIsIHRoaXMub25BY2NvdW50RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NhbmNlbERldmljZUxpc3QpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbmNlbERldmljZUxpc3QoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY2hlY2tJZ25vcmVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGlzSWdub3JpbmcgPSB0aGlzLmNvbnRleHQuaXNVc2VySWdub3JlZCh0aGlzLnByb3BzLm1lbWJlci51c2VySWQpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0lnbm9yaW5nOiBpc0lnbm9yaW5nfSk7XG4gICAgfSxcblxuICAgIF9kaXNhbWJpZ3VhdGVEZXZpY2VzOiBmdW5jdGlvbihkZXZpY2VzKSB7XG4gICAgICAgIGNvbnN0IG5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXZpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGV2aWNlc1tpXS5nZXREaXNwbGF5TmFtZSgpO1xuICAgICAgICAgICAgY29uc3QgaW5kZXhMaXN0ID0gbmFtZXNbbmFtZV0gfHwgW107XG4gICAgICAgICAgICBpbmRleExpc3QucHVzaChpKTtcbiAgICAgICAgICAgIG5hbWVzW25hbWVdID0gaW5kZXhMaXN0O1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBuYW1lcykge1xuICAgICAgICAgICAgaWYgKG5hbWVzW25hbWVdLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBuYW1lc1tuYW1lXS5mb3JFYWNoKChqKT0+e1xuICAgICAgICAgICAgICAgICAgICBkZXZpY2VzW2pdLmFtYmlndW91cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkOiBmdW5jdGlvbih1c2VySWQsIGRldmljZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2VuYWJsZURldmljZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1c2VySWQgPT09IHRoaXMucHJvcHMubWVtYmVyLnVzZXJJZCkge1xuICAgICAgICAgICAgLy8gbm8gbmVlZCB0byByZS1kb3dubG9hZCB0aGUgd2hvbGUgdGhpbmc7IGp1c3QgdXBkYXRlIG91ciBjb3B5IG9mXG4gICAgICAgICAgICAvLyB0aGUgbGlzdC5cblxuICAgICAgICAgICAgY29uc3QgZGV2aWNlcyA9IHRoaXMuY29udGV4dC5nZXRTdG9yZWREZXZpY2VzRm9yVXNlcih1c2VySWQpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZGV2aWNlczogZGV2aWNlcyxcbiAgICAgICAgICAgICAgICBlMmVTdGF0dXM6IHRoaXMuX2dldEUyRVN0YXR1cyhkZXZpY2VzKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRFMkVTdGF0dXM6IGZ1bmN0aW9uKGRldmljZXMpIHtcbiAgICAgICAgY29uc3QgaGFzVW52ZXJpZmllZERldmljZSA9IGRldmljZXMuc29tZSgoZGV2aWNlKSA9PiBkZXZpY2UuaXNVbnZlcmlmaWVkKCkpO1xuICAgICAgICByZXR1cm4gaGFzVW52ZXJpZmllZERldmljZSA/IFwid2FybmluZ1wiIDogXCJ2ZXJpZmllZFwiO1xuICAgIH0sXG5cbiAgICBvblJvb206IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBvbkRlbGV0ZVJvb206IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIG9uUm9vbVRpbWVsaW5lOiBmdW5jdGlvbihldiwgcm9vbSwgdG9TdGFydE9mVGltZWxpbmUpIHtcbiAgICAgICAgaWYgKHRvU3RhcnRPZlRpbWVsaW5lKSByZXR1cm47XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25Sb29tTmFtZTogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIG9uUm9vbVJlY2VpcHQ6IGZ1bmN0aW9uKHJlY2VpcHRFdmVudCwgcm9vbSkge1xuICAgICAgICAvLyBiZWNhdXNlIGlmIHdlIHJlYWQgYSBub3RpZmljYXRpb24sIGl0IHdpbGwgYWZmZWN0IG5vdGlmaWNhdGlvbiBjb3VudFxuICAgICAgICAvLyBvbmx5IGJvdGhlciB1cGRhdGluZyBpZiB0aGVyZSdzIGEgcmVjZWlwdCBmcm9tIHVzXG4gICAgICAgIGlmIChmaW5kUmVhZFJlY2VpcHRGcm9tVXNlcklkKHJlY2VpcHRFdmVudCwgdGhpcy5jb250ZXh0LmNyZWRlbnRpYWxzLnVzZXJJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb21TdGF0ZUV2ZW50czogZnVuY3Rpb24oZXYsIHN0YXRlKSB7XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25Sb29tTWVtYmVyTmFtZTogZnVuY3Rpb24oZXYsIG1lbWJlcikge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIG9uUm9vbU1lbWJlck1lbWJlcnNoaXA6IGZ1bmN0aW9uKGV2LCBtZW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubWVtYmVyLnVzZXJJZCA9PT0gbWVtYmVyLnVzZXJJZCkgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBvbkFjY291bnREYXRhOiBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpID09PSAnbS5kaXJlY3QnKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVN0YXRlRm9yTmV3TWVtYmVyOiBhc3luYyBmdW5jdGlvbihtZW1iZXIpIHtcbiAgICAgICAgY29uc3QgbmV3U3RhdGUgPSBhd2FpdCB0aGlzLl9jYWxjdWxhdGVPcHNQZXJtaXNzaW9ucyhtZW1iZXIpO1xuICAgICAgICBuZXdTdGF0ZS5kZXZpY2VzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIG5ld1N0YXRlLmRldmljZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICBpZiAodGhpcy5fY2FuY2VsRGV2aWNlTGlzdCkge1xuICAgICAgICAgICAgdGhpcy5fY2FuY2VsRGV2aWNlTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5fY2FuY2VsRGV2aWNlTGlzdCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kb3dubG9hZERldmljZUxpc3QobWVtYmVyKTtcbiAgICB9LFxuXG4gICAgX2Rvd25sb2FkRGV2aWNlTGlzdDogZnVuY3Rpb24obWVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fZW5hYmxlRGV2aWNlcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jYW5jZWxEZXZpY2VMaXN0ID0gZnVuY3Rpb24oKSB7IGNhbmNlbGxlZCA9IHRydWU7IH07XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY2xpZW50LmRvd25sb2FkS2V5cyhbbWVtYmVyLnVzZXJJZF0sIHRydWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNsaWVudC5nZXRTdG9yZWREZXZpY2VzRm9yVXNlcihtZW1iZXIudXNlcklkKTtcbiAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX2NhbmNlbERldmljZUxpc3QgPSBudWxsO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGRldmljZXMpIHtcbiAgICAgICAgICAgIGlmIChjYW5jZWxsZWQpIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBnb3QgY2FuY2VsbGVkIC0gcHJlc3VtYWJseSBhIGRpZmZlcmVudCB1c2VyIG5vd1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5fZGlzYW1iaWd1YXRlRGV2aWNlcyhkZXZpY2VzKTtcbiAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGRldmljZXNMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBkZXZpY2VzLFxuICAgICAgICAgICAgICAgIGUyZVN0YXR1czogc2VsZi5fZ2V0RTJFU3RhdHVzKGRldmljZXMpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBkb3dubG9hZGluZyBzZXNzaW9uc1wiLCBlcnIpO1xuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7ZGV2aWNlc0xvYWRpbmc6IGZhbHNlfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbklnbm9yZVRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGlnbm9yZWRVc2VycyA9IHRoaXMuY29udGV4dC5nZXRJZ25vcmVkVXNlcnMoKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNJZ25vcmluZykge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpZ25vcmVkVXNlcnMuaW5kZXhPZih0aGlzLnByb3BzLm1lbWJlci51c2VySWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgaWdub3JlZFVzZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZ25vcmVkVXNlcnMucHVzaCh0aGlzLnByb3BzLm1lbWJlci51c2VySWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnNldElnbm9yZWRVc2VycyhpZ25vcmVkVXNlcnMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe2lzSWdub3Jpbmc6ICF0aGlzLnN0YXRlLmlzSWdub3Jpbmd9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uS2ljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSB0aGlzLnByb3BzLm1lbWJlci5tZW1iZXJzaGlwO1xuICAgICAgICBjb25zdCBDb25maXJtVXNlckFjdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkNvbmZpcm1Vc2VyQWN0aW9uRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdDb25maXJtIFVzZXIgQWN0aW9uIERpYWxvZycsICdvbktpY2snLCBDb25maXJtVXNlckFjdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgbWVtYmVyOiB0aGlzLnByb3BzLm1lbWJlcixcbiAgICAgICAgICAgIGFjdGlvbjogbWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIiA/IF90KFwiRGlzaW52aXRlXCIpIDogX3QoXCJLaWNrXCIpLFxuICAgICAgICAgICAgdGl0bGU6IG1lbWJlcnNoaXAgPT09IFwiaW52aXRlXCIgPyBfdChcIkRpc2ludml0ZSB0aGlzIHVzZXI/XCIpIDogX3QoXCJLaWNrIHRoaXMgdXNlcj9cIiksXG4gICAgICAgICAgICBhc2tSZWFzb246IG1lbWJlcnNoaXAgPT09IFwiam9pblwiLFxuICAgICAgICAgICAgZGFuZ2VyOiB0cnVlLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHByb2NlZWQsIHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcHJvY2VlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHVwZGF0aW5nOiB0aGlzLnN0YXRlLnVwZGF0aW5nICsgMSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQua2ljayhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5tZW1iZXIucm9vbUlkLCB0aGlzLnByb3BzLm1lbWJlci51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgIHJlYXNvbiB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk8tT1A7IHJlbHkgb24gdGhlIG0ucm9vbS5tZW1iZXIgZXZlbnQgY29taW5nIGRvd24gZWxzZSB3ZSBjb3VsZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IG91dCBvZiBzeW5jIGlmIHdlIGZvcmNlIHNldFN0YXRlIGhlcmUhXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIktpY2sgc3VjY2Vzc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIktpY2sgZXJyb3I6IFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBraWNrJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRmFpbGVkIHRvIGtpY2tcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICgoZXJyICYmIGVyci5tZXNzYWdlKSA/IGVyci5tZXNzYWdlIDogXCJPcGVyYXRpb24gZmFpbGVkXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKS5maW5hbGx5KCgpPT57XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB1cGRhdGluZzogdGhpcy5zdGF0ZS51cGRhdGluZyAtIDEgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25CYW5PclVuYmFuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQ29uZmlybVVzZXJBY3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5Db25maXJtVXNlckFjdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ29uZmlybSBVc2VyIEFjdGlvbiBEaWFsb2cnLCAnb25CYW5PclVuYmFuJywgQ29uZmlybVVzZXJBY3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIG1lbWJlcjogdGhpcy5wcm9wcy5tZW1iZXIsXG4gICAgICAgICAgICBhY3Rpb246IHRoaXMucHJvcHMubWVtYmVyLm1lbWJlcnNoaXAgPT09ICdiYW4nID8gX3QoXCJVbmJhblwiKSA6IF90KFwiQmFuXCIpLFxuICAgICAgICAgICAgdGl0bGU6IHRoaXMucHJvcHMubWVtYmVyLm1lbWJlcnNoaXAgPT09ICdiYW4nID8gX3QoXCJVbmJhbiB0aGlzIHVzZXI/XCIpIDogX3QoXCJCYW4gdGhpcyB1c2VyP1wiKSxcbiAgICAgICAgICAgIGFza1JlYXNvbjogdGhpcy5wcm9wcy5tZW1iZXIubWVtYmVyc2hpcCAhPT0gJ2JhbicsXG4gICAgICAgICAgICBkYW5nZXI6IHRoaXMucHJvcHMubWVtYmVyLm1lbWJlcnNoaXAgIT09ICdiYW4nLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHByb2NlZWQsIHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcHJvY2VlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHVwZGF0aW5nOiB0aGlzLnN0YXRlLnVwZGF0aW5nICsgMSB9KTtcbiAgICAgICAgICAgICAgICBsZXQgcHJvbWlzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5tZW1iZXIubWVtYmVyc2hpcCA9PT0gJ2JhbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IHRoaXMuY29udGV4dC51bmJhbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMubWVtYmVyLnJvb21JZCwgdGhpcy5wcm9wcy5tZW1iZXIudXNlcklkLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSB0aGlzLmNvbnRleHQuYmFuKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5tZW1iZXIucm9vbUlkLCB0aGlzLnByb3BzLm1lbWJlci51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFzb24gfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk8tT1A7IHJlbHkgb24gdGhlIG0ucm9vbS5tZW1iZXIgZXZlbnQgY29taW5nIGRvd24gZWxzZSB3ZSBjb3VsZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IG91dCBvZiBzeW5jIGlmIHdlIGZvcmNlIHNldFN0YXRlIGhlcmUhXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkJhbiBzdWNjZXNzXCIpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQmFuIGVycm9yOiBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gYmFuIHVzZXInLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvclwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJGYWlsZWQgdG8gYmFuIHVzZXJcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApLmZpbmFsbHkoKCk9PntcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHVwZGF0aW5nOiB0aGlzLnN0YXRlLnVwZGF0aW5nIC0gMSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJlZGFjdEFsbE1lc3NhZ2VzOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qge3Jvb21JZCwgdXNlcklkfSA9IHRoaXMucHJvcHMubWVtYmVyO1xuICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGltZWxpbmVTZXQgPSByb29tLmdldFVuZmlsdGVyZWRUaW1lbGluZVNldCgpO1xuICAgICAgICBsZXQgZXZlbnRzVG9SZWRhY3QgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB0aW1lbGluZSBvZiB0aW1lbGluZVNldC5nZXRUaW1lbGluZXMoKSkge1xuICAgICAgICAgICAgZXZlbnRzVG9SZWRhY3QgPSB0aW1lbGluZS5nZXRFdmVudHMoKS5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZ2V0U2VuZGVyKCkgPT09IHVzZXJJZCAmJiAhZXZlbnQuaXNSZWRhY3RlZCgpICYmICFldmVudC5pc1JlZGFjdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuY29uY2F0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGV2ZW50c1RvUmVkYWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvdW50ID0gZXZlbnRzVG9SZWRhY3QubGVuZ3RoO1xuICAgICAgICBjb25zdCB1c2VyID0gdGhpcy5wcm9wcy5tZW1iZXIubmFtZTtcblxuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IEluZm9EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5JbmZvRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnTm8gdXNlciBtZXNzYWdlcyBmb3VuZCB0byByZW1vdmUnLCAnJywgSW5mb0RpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIk5vIHJlY2VudCBtZXNzYWdlcyBieSAlKHVzZXIpcyBmb3VuZFwiLCB7dXNlcn0pLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcIlRyeSBzY3JvbGxpbmcgdXAgaW4gdGhlIHRpbWVsaW5lIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IGVhcmxpZXIgb25lcy5cIikgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlybWVkID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdSZW1vdmUgcmVjZW50IG1lc3NhZ2VzIGJ5IHVzZXInLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiUmVtb3ZlIHJlY2VudCBtZXNzYWdlcyBieSAlKHVzZXIpc1wiLCB7dXNlcn0pLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcIllvdSBhcmUgYWJvdXQgdG8gcmVtb3ZlICUoY291bnQpcyBtZXNzYWdlcyBieSAlKHVzZXIpcy4gVGhpcyBjYW5ub3QgYmUgdW5kb25lLiBEbyB5b3Ugd2lzaCB0byBjb250aW51ZT9cIiwge2NvdW50LCB1c2VyfSkgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cD57IF90KFwiRm9yIGEgbGFyZ2UgYW1vdW50IG9mIG1lc3NhZ2VzLCB0aGlzIG1pZ2h0IHRha2Ugc29tZSB0aW1lLiBQbGVhc2UgZG9uJ3QgcmVmcmVzaCB5b3VyIGNsaWVudCBpbiB0aGUgbWVhbnRpbWUuXCIpIH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4sXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJSZW1vdmUgJShjb3VudClzIG1lc3NhZ2VzXCIsIHtjb3VudH0pLFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiByZXNvbHZlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghY29uZmlybWVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdWJtaXR0aW5nIGEgbGFyZ2UgbnVtYmVyIG9mIHJlZGFjdGlvbnMgZnJlZXplcyB0aGUgVUksXG4gICAgICAgICAgICAvLyBzbyBmaXJzdCB5aWVsZCB0byBhbGxvdyB0byByZXJlbmRlciBhZnRlciBjbG9zaW5nIHRoZSBkaWFsb2cuXG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBTdGFydGVkIHJlZGFjdGluZyByZWNlbnQgJHtjb3VudH0gbWVzc2FnZXMgZm9yICR7dXNlcn0gaW4gJHtyb29tSWR9YCk7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChldmVudHNUb1JlZGFjdC5tYXAoYXN5bmMgZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5yZWRhY3RFdmVudChyb29tSWQsIGV2ZW50LmdldElkKCkpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyBsb2cgYW5kIHN3YWxsb3cgZXJyb3JzXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgcmVkYWN0XCIsIGV2ZW50LmdldElkKCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBGaW5pc2hlZCByZWRhY3RpbmcgcmVjZW50ICR7Y291bnR9IG1lc3NhZ2VzIGZvciAke3VzZXJ9IGluICR7cm9vbUlkfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF93YXJuU2VsZkRlbW90ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRGVtb3RpbmcgU2VsZicsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkRlbW90ZSB5b3Vyc2VsZj9cIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiWW91IHdpbGwgbm90IGJlIGFibGUgdG8gdW5kbyB0aGlzIGNoYW5nZSBhcyB5b3UgYXJlIGRlbW90aW5nIHlvdXJzZWxmLCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZiB5b3UgYXJlIHRoZSBsYXN0IHByaXZpbGVnZWQgdXNlciBpbiB0aGUgcm9vbSBpdCB3aWxsIGJlIGltcG9zc2libGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG8gcmVnYWluIHByaXZpbGVnZXMuXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJEZW1vdGVcIiksXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogcmVzb2x2ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25NdXRlVG9nZ2xlOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3Qgcm9vbUlkID0gdGhpcy5wcm9wcy5tZW1iZXIucm9vbUlkO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnByb3BzLm1lbWJlci51c2VySWQ7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLmNvbnRleHQuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICBpZiAoIXJvb20pIHJldHVybjtcblxuICAgICAgICAvLyBpZiBtdXRpbmcgc2VsZiwgd2FybiBhcyBpdCBtYXkgYmUgaXJyZXZlcnNpYmxlXG4gICAgICAgIGlmICh0YXJnZXQgPT09IHRoaXMuY29udGV4dC5nZXRVc2VySWQoKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLl93YXJuU2VsZkRlbW90ZSgpKSkgcmV0dXJuO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gd2FybiBhYm91dCBzZWxmIGRlbW90aW9uOiBcIiwgZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcG93ZXJMZXZlbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpO1xuICAgICAgICBpZiAoIXBvd2VyTGV2ZWxFdmVudCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGlzTXV0ZWQgPSB0aGlzLnN0YXRlLm11dGVkO1xuICAgICAgICBjb25zdCBwb3dlckxldmVscyA9IHBvd2VyTGV2ZWxFdmVudC5nZXRDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IGxldmVsVG9TZW5kID0gKFxuICAgICAgICAgICAgKHBvd2VyTGV2ZWxzLmV2ZW50cyA/IHBvd2VyTGV2ZWxzLmV2ZW50c1tcIm0ucm9vbS5tZXNzYWdlXCJdIDogbnVsbCkgfHxcbiAgICAgICAgICAgIHBvd2VyTGV2ZWxzLmV2ZW50c19kZWZhdWx0XG4gICAgICAgICk7XG4gICAgICAgIGxldCBsZXZlbDtcbiAgICAgICAgaWYgKGlzTXV0ZWQpIHsgLy8gdW5tdXRlXG4gICAgICAgICAgICBsZXZlbCA9IGxldmVsVG9TZW5kO1xuICAgICAgICB9IGVsc2UgeyAvLyBtdXRlXG4gICAgICAgICAgICBsZXZlbCA9IGxldmVsVG9TZW5kIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBsZXZlbCA9IHBhcnNlSW50KGxldmVsKTtcblxuICAgICAgICBpZiAoIWlzTmFOKGxldmVsKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHVwZGF0aW5nOiB0aGlzLnN0YXRlLnVwZGF0aW5nICsgMSB9KTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zZXRQb3dlckxldmVsKHJvb21JZCwgdGFyZ2V0LCBsZXZlbCwgcG93ZXJMZXZlbEV2ZW50KS50aGVuKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOTy1PUDsgcmVseSBvbiB0aGUgbS5yb29tLm1lbWJlciBldmVudCBjb21pbmcgZG93biBlbHNlIHdlIGNvdWxkXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCBvdXQgb2Ygc3luYyBpZiB3ZSBmb3JjZSBzZXRTdGF0ZSBoZXJlIVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk11dGUgdG9nZ2xlIHN1Y2Nlc3NcIik7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNdXRlIGVycm9yOiBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBtdXRlIHVzZXInLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIG11dGUgdXNlclwiKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICkuZmluYWxseSgoKT0+e1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB1cGRhdGluZzogdGhpcy5zdGF0ZS51cGRhdGluZyAtIDEgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbk1vZFRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IHJvb21JZCA9IHRoaXMucHJvcHMubWVtYmVyLnJvb21JZDtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wcm9wcy5tZW1iZXIudXNlcklkO1xuICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcG93ZXJMZXZlbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpO1xuICAgICAgICBpZiAoIXBvd2VyTGV2ZWxFdmVudCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG1lID0gcm9vbS5nZXRNZW1iZXIodGhpcy5jb250ZXh0LmNyZWRlbnRpYWxzLnVzZXJJZCk7XG4gICAgICAgIGlmICghbWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCBkZWZhdWx0TGV2ZWwgPSBwb3dlckxldmVsRXZlbnQuZ2V0Q29udGVudCgpLnVzZXJzX2RlZmF1bHQ7XG4gICAgICAgIGxldCBtb2RMZXZlbCA9IG1lLnBvd2VyTGV2ZWwgLSAxO1xuICAgICAgICBpZiAobW9kTGV2ZWwgPiA1MCAmJiBkZWZhdWx0TGV2ZWwgPCA1MCkgbW9kTGV2ZWwgPSA1MDsgLy8gdHJ5IHRvIHN0aWNrIHdpdGggdGhlIHZlY3RvciBsZXZlbCBkZWZhdWx0c1xuICAgICAgICAvLyB0b2dnbGUgdGhlIGxldmVsXG4gICAgICAgIGNvbnN0IG5ld0xldmVsID0gdGhpcy5zdGF0ZS5pc1RhcmdldE1vZCA/IGRlZmF1bHRMZXZlbCA6IG1vZExldmVsO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgdXBkYXRpbmc6IHRoaXMuc3RhdGUudXBkYXRpbmcgKyAxIH0pO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0UG93ZXJMZXZlbChyb29tSWQsIHRhcmdldCwgcGFyc2VJbnQobmV3TGV2ZWwpLCBwb3dlckxldmVsRXZlbnQpLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBOTy1PUDsgcmVseSBvbiB0aGUgbS5yb29tLm1lbWJlciBldmVudCBjb21pbmcgZG93biBlbHNlIHdlIGNvdWxkXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG91dCBvZiBzeW5jIGlmIHdlIGZvcmNlIHNldFN0YXRlIGhlcmUhXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJNb2QgdG9nZ2xlIHN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09ICdNX0dVRVNUX0FDQ0VTU19GT1JCSURERU4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAncmVxdWlyZV9yZWdpc3RyYXRpb24nfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRvZ2dsZSBtb2RlcmF0b3IgZXJyb3I6XCIgKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gdG9nZ2xlIG1vZGVyYXRvciBzdGF0dXMnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIHRvZ2dsZSBtb2RlcmF0b3Igc3RhdHVzXCIpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICApLmZpbmFsbHkoKCk9PntcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB1cGRhdGluZzogdGhpcy5zdGF0ZS51cGRhdGluZyAtIDEgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblN5bmFwc2VEZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLlF1ZXN0aW9uRGlhbG9nJyk7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1N5bmFwc2UgVXNlciBEZWFjdGl2YXRpb24nLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdChcIkRlYWN0aXZhdGUgdXNlcj9cIiksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICA8ZGl2PnsgX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRGVhY3RpdmF0aW5nIHRoaXMgdXNlciB3aWxsIGxvZyB0aGVtIG91dCBhbmQgcHJldmVudCB0aGVtIGZyb20gbG9nZ2luZyBiYWNrIGluLiBBZGRpdGlvbmFsbHksIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJ0aGV5IHdpbGwgbGVhdmUgYWxsIHRoZSByb29tcyB0aGV5IGFyZSBpbi4gVGhpcyBhY3Rpb24gY2Fubm90IGJlIHJldmVyc2VkLiBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImRlYWN0aXZhdGUgdGhpcyB1c2VyP1wiXG4gICAgICAgICAgICAgICAgKSB9PC9kaXY+LFxuICAgICAgICAgICAgYnV0dG9uOiBfdChcIkRlYWN0aXZhdGUgdXNlclwiKSxcbiAgICAgICAgICAgIGRhbmdlcjogdHJ1ZSxcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IChhY2NlcHRlZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghYWNjZXB0ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuZGVhY3RpdmF0ZVN5bmFwc2VVc2VyKHRoaXMucHJvcHMubWVtYmVyLnVzZXJJZCkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZGVhY3RpdmF0ZSB1c2VyXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBkZWFjdGl2YXRlIFN5bmFwc2UgdXNlcicsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdGYWlsZWQgdG8gZGVhY3RpdmF0ZSB1c2VyJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlICYmIGUubWVzc2FnZSkgPyBlLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfYXBwbHlQb3dlckNoYW5nZTogZnVuY3Rpb24ocm9vbUlkLCB0YXJnZXQsIHBvd2VyTGV2ZWwsIHBvd2VyTGV2ZWxFdmVudCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgdXBkYXRpbmc6IHRoaXMuc3RhdGUudXBkYXRpbmcgKyAxIH0pO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0UG93ZXJMZXZlbChyb29tSWQsIHRhcmdldCwgcGFyc2VJbnQocG93ZXJMZXZlbCksIHBvd2VyTGV2ZWxFdmVudCkudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIE5PLU9QOyByZWx5IG9uIHRoZSBtLnJvb20ubWVtYmVyIGV2ZW50IGNvbWluZyBkb3duIGVsc2Ugd2UgY291bGRcbiAgICAgICAgICAgICAgICAvLyBnZXQgb3V0IG9mIHN5bmMgaWYgd2UgZm9yY2Ugc2V0U3RhdGUgaGVyZSFcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvd2VyIGNoYW5nZSBzdWNjZXNzXCIpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGNoYW5nZSBwb3dlciBsZXZlbCBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGNoYW5nZSBwb3dlciBsZXZlbCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvclwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIGNoYW5nZSBwb3dlciBsZXZlbFwiKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICkuZmluYWxseSgoKT0+e1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHVwZGF0aW5nOiB0aGlzLnN0YXRlLnVwZGF0aW5nIC0gMSB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uUG93ZXJDaGFuZ2U6IGFzeW5jIGZ1bmN0aW9uKHBvd2VyTGV2ZWwpIHtcbiAgICAgICAgY29uc3Qgcm9vbUlkID0gdGhpcy5wcm9wcy5tZW1iZXIucm9vbUlkO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnByb3BzLm1lbWJlci51c2VySWQ7XG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLmNvbnRleHQuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICBpZiAoIXJvb20pIHJldHVybjtcblxuICAgICAgICBjb25zdCBwb3dlckxldmVsRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgICAgIGlmICghcG93ZXJMZXZlbEV2ZW50KSByZXR1cm47XG5cbiAgICAgICAgaWYgKCFwb3dlckxldmVsRXZlbnQuZ2V0Q29udGVudCgpLnVzZXJzKSB7XG4gICAgICAgICAgICB0aGlzLl9hcHBseVBvd2VyQ2hhbmdlKHJvb21JZCwgdGFyZ2V0LCBwb3dlckxldmVsLCBwb3dlckxldmVsRXZlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSB0aGlzLmNvbnRleHQuZ2V0VXNlcklkKCk7XG4gICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG5cbiAgICAgICAgLy8gSWYgd2UgYXJlIGNoYW5naW5nIG91ciBvd24gUEwgaXQgY2FuIG9ubHkgZXZlciBiZSBkZWNyZWFzaW5nLCB3aGljaCB3ZSBjYW5ub3QgcmV2ZXJzZS5cbiAgICAgICAgaWYgKG15VXNlcklkID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5fd2FyblNlbGZEZW1vdGUoKSkpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBseVBvd2VyQ2hhbmdlKHJvb21JZCwgdGFyZ2V0LCBwb3dlckxldmVsLCBwb3dlckxldmVsRXZlbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gd2FybiBhYm91dCBzZWxmIGRlbW90aW9uOiBcIiwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBteVBvd2VyID0gcG93ZXJMZXZlbEV2ZW50LmdldENvbnRlbnQoKS51c2Vyc1tteVVzZXJJZF07XG4gICAgICAgIGlmIChwYXJzZUludChteVBvd2VyKSA9PT0gcGFyc2VJbnQocG93ZXJMZXZlbCkpIHtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1Byb21vdGUgdG8gUEwxMDAgV2FybmluZycsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIldhcm5pbmchXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIllvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIHVuZG8gdGhpcyBjaGFuZ2UgYXMgeW91IGFyZSBwcm9tb3RpbmcgdGhlIHVzZXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG8gaGF2ZSB0aGUgc2FtZSBwb3dlciBsZXZlbCBhcyB5b3Vyc2VsZi5cIikgfTxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkFyZSB5b3Ugc3VyZT9cIikgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj4sXG4gICAgICAgICAgICAgICAgYnV0dG9uOiBfdChcIkNvbnRpbnVlXCIpLFxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IChjb25maXJtZWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpcm1lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXBwbHlQb3dlckNoYW5nZShyb29tSWQsIHRhcmdldCwgcG93ZXJMZXZlbCwgcG93ZXJMZXZlbEV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hcHBseVBvd2VyQ2hhbmdlKHJvb21JZCwgdGFyZ2V0LCBwb3dlckxldmVsLCBwb3dlckxldmVsRXZlbnQpO1xuICAgIH0sXG5cbiAgICBvbk5ld0RNQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgdXBkYXRpbmc6IHRoaXMuc3RhdGUudXBkYXRpbmcgKyAxIH0pO1xuICAgICAgICBjcmVhdGVSb29tKHtkbVVzZXJJZDogdGhpcy5wcm9wcy5tZW1iZXIudXNlcklkfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgdXBkYXRpbmc6IHRoaXMuc3RhdGUudXBkYXRpbmcgLSAxIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25MZWF2ZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2xlYXZlX3Jvb20nLFxuICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5wcm9wcy5tZW1iZXIucm9vbUlkLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2NhbGN1bGF0ZU9wc1Blcm1pc3Npb25zOiBhc3luYyBmdW5jdGlvbihtZW1iZXIpIHtcbiAgICAgICAgbGV0IGNhbkRlYWN0aXZhdGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW5EZWFjdGl2YXRlID0gYXdhaXQgdGhpcy5jb250ZXh0LmlzU3luYXBzZUFkbWluaXN0cmF0b3IoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFBlcm1zID0ge1xuICAgICAgICAgICAgY2FuOiB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHBlcm1pc3Npb25zIGZvciBTeW5hcHNlIGJlZm9yZSBkb2luZyB0aGUgUEwgY2hlY2tzXG4gICAgICAgICAgICAgICAgc3luYXBzZURlYWN0aXZhdGU6IGNhbkRlYWN0aXZhdGUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXV0ZWQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20obWVtYmVyLnJvb21JZCk7XG4gICAgICAgIGlmICghcm9vbSkgcmV0dXJuIGRlZmF1bHRQZXJtcztcblxuICAgICAgICBjb25zdCBwb3dlckxldmVscyA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLnBvd2VyX2xldmVsc1wiLCBcIlwiKTtcbiAgICAgICAgaWYgKCFwb3dlckxldmVscykgcmV0dXJuIGRlZmF1bHRQZXJtcztcblxuICAgICAgICBjb25zdCBtZSA9IHJvb20uZ2V0TWVtYmVyKHRoaXMuY29udGV4dC5jcmVkZW50aWFscy51c2VySWQpO1xuICAgICAgICBpZiAoIW1lKSByZXR1cm4gZGVmYXVsdFBlcm1zO1xuXG4gICAgICAgIGNvbnN0IHRoZW0gPSBtZW1iZXI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYW46IHtcbiAgICAgICAgICAgICAgICAuLi5kZWZhdWx0UGVybXMuY2FuLFxuICAgICAgICAgICAgICAgIC4uLmF3YWl0IHRoaXMuX2NhbGN1bGF0ZUNhblBlcm1pc3Npb25zKG1lLCB0aGVtLCBwb3dlckxldmVscy5nZXRDb250ZW50KCkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG11dGVkOiB0aGlzLl9pc011dGVkKHRoZW0sIHBvd2VyTGV2ZWxzLmdldENvbnRlbnQoKSksXG4gICAgICAgICAgICBpc1RhcmdldE1vZDogdGhlbS5wb3dlckxldmVsID4gcG93ZXJMZXZlbHMuZ2V0Q29udGVudCgpLnVzZXJzX2RlZmF1bHQsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIF9jYWxjdWxhdGVDYW5QZXJtaXNzaW9uczogZnVuY3Rpb24obWUsIHRoZW0sIHBvd2VyTGV2ZWxzKSB7XG4gICAgICAgIGNvbnN0IGlzTWUgPSBtZS51c2VySWQgPT09IHRoZW0udXNlcklkO1xuICAgICAgICBjb25zdCBjYW4gPSB7XG4gICAgICAgICAgICBraWNrOiBmYWxzZSxcbiAgICAgICAgICAgIGJhbjogZmFsc2UsXG4gICAgICAgICAgICBtdXRlOiBmYWxzZSxcbiAgICAgICAgICAgIG1vZGlmeUxldmVsOiBmYWxzZSxcbiAgICAgICAgICAgIG1vZGlmeUxldmVsTWF4OiAwLFxuICAgICAgICAgICAgcmVkYWN0TWVzc2FnZXM6IG1lLnBvd2VyTGV2ZWwgPj0gcG93ZXJMZXZlbHMucmVkYWN0LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNhbkFmZmVjdFVzZXIgPSB0aGVtLnBvd2VyTGV2ZWwgPCBtZS5wb3dlckxldmVsIHx8IGlzTWU7XG4gICAgICAgIGlmICghY2FuQWZmZWN0VXNlcikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oXCJDYW5ub3QgYWZmZWN0IHVzZXI6ICVzID49ICVzXCIsIHRoZW0ucG93ZXJMZXZlbCwgbWUucG93ZXJMZXZlbCk7XG4gICAgICAgICAgICByZXR1cm4gY2FuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVkaXRQb3dlckxldmVsID0gKFxuICAgICAgICAgICAgKHBvd2VyTGV2ZWxzLmV2ZW50cyA/IHBvd2VyTGV2ZWxzLmV2ZW50c1tcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIl0gOiBudWxsKSB8fFxuICAgICAgICAgICAgcG93ZXJMZXZlbHMuc3RhdGVfZGVmYXVsdFxuICAgICAgICApO1xuXG4gICAgICAgIGNhbi5raWNrID0gbWUucG93ZXJMZXZlbCA+PSBwb3dlckxldmVscy5raWNrO1xuICAgICAgICBjYW4uYmFuID0gbWUucG93ZXJMZXZlbCA+PSBwb3dlckxldmVscy5iYW47XG4gICAgICAgIGNhbi5pbnZpdGUgPSBtZS5wb3dlckxldmVsID49IHBvd2VyTGV2ZWxzLmludml0ZTtcbiAgICAgICAgY2FuLm11dGUgPSBtZS5wb3dlckxldmVsID49IGVkaXRQb3dlckxldmVsO1xuICAgICAgICBjYW4ubW9kaWZ5TGV2ZWwgPSBtZS5wb3dlckxldmVsID49IGVkaXRQb3dlckxldmVsICYmIChpc01lIHx8IG1lLnBvd2VyTGV2ZWwgPiB0aGVtLnBvd2VyTGV2ZWwpO1xuICAgICAgICBjYW4ubW9kaWZ5TGV2ZWxNYXggPSBtZS5wb3dlckxldmVsO1xuXG4gICAgICAgIHJldHVybiBjYW47XG4gICAgfSxcblxuICAgIF9pc011dGVkOiBmdW5jdGlvbihtZW1iZXIsIHBvd2VyTGV2ZWxDb250ZW50KSB7XG4gICAgICAgIGlmICghcG93ZXJMZXZlbENvbnRlbnQgfHwgIW1lbWJlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IGxldmVsVG9TZW5kID0gKFxuICAgICAgICAgICAgKHBvd2VyTGV2ZWxDb250ZW50LmV2ZW50cyA/IHBvd2VyTGV2ZWxDb250ZW50LmV2ZW50c1tcIm0ucm9vbS5tZXNzYWdlXCJdIDogbnVsbCkgfHxcbiAgICAgICAgICAgIHBvd2VyTGV2ZWxDb250ZW50LmV2ZW50c19kZWZhdWx0XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBtZW1iZXIucG93ZXJMZXZlbCA8IGxldmVsVG9TZW5kO1xuICAgIH0sXG5cbiAgICBvbkNhbmNlbDogZnVuY3Rpb24oZSkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICBtZW1iZXI6IG51bGwsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbk1lbWJlckF2YXRhckNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgbWVtYmVyID0gdGhpcy5wcm9wcy5tZW1iZXI7XG4gICAgICAgIGNvbnN0IGF2YXRhclVybCA9IG1lbWJlci5nZXRNeGNBdmF0YXJVcmwoKTtcbiAgICAgICAgaWYgKCFhdmF0YXJVcmwpIHJldHVybjtcblxuICAgICAgICBjb25zdCBodHRwVXJsID0gdGhpcy5jb250ZXh0Lm14Y1VybFRvSHR0cChhdmF0YXJVcmwpO1xuICAgICAgICBjb25zdCBJbWFnZVZpZXcgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuSW1hZ2VWaWV3XCIpO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgICAgICBzcmM6IGh0dHBVcmwsXG4gICAgICAgICAgICBuYW1lOiBtZW1iZXIubmFtZSxcbiAgICAgICAgfTtcblxuICAgICAgICBNb2RhbC5jcmVhdGVEaWFsb2coSW1hZ2VWaWV3LCBwYXJhbXMsIFwibXhfRGlhbG9nX2xpZ2h0Ym94XCIpO1xuICAgIH0sXG5cbiAgICBvblJvb21UaWxlQ2xpY2socm9vbUlkKSB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3JlbmRlckRldmljZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2VuYWJsZURldmljZXMpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGRldmljZXMgPSB0aGlzLnN0YXRlLmRldmljZXM7XG4gICAgICAgIGNvbnN0IE1lbWJlckRldmljZUluZm8gPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5NZW1iZXJEZXZpY2VJbmZvJyk7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcblxuICAgICAgICBsZXQgZGV2Q29tcG9uZW50cztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGV2aWNlc0xvYWRpbmcpIHtcbiAgICAgICAgICAgIC8vIHN0aWxsIGxvYWRpbmdcbiAgICAgICAgICAgIGRldkNvbXBvbmVudHMgPSA8U3Bpbm5lciAvPjtcbiAgICAgICAgfSBlbHNlIGlmIChkZXZpY2VzID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZXZDb21wb25lbnRzID0gX3QoXCJVbmFibGUgdG8gbG9hZCBzZXNzaW9uIGxpc3RcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoZGV2aWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRldkNvbXBvbmVudHMgPSBfdChcIk5vIHNlc3Npb25zIHdpdGggcmVnaXN0ZXJlZCBlbmNyeXB0aW9uIGtleXNcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXZDb21wb25lbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkZXZDb21wb25lbnRzLnB1c2goPE1lbWJlckRldmljZUluZm8ga2V5PXtpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcklkPXt0aGlzLnByb3BzLm1lbWJlci51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2U9e2RldmljZXNbaV19IC8+KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMz57IF90KFwiU2Vzc2lvbnNcIikgfTwvaDM+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2RldmljZXNcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBkZXZDb21wb25lbnRzIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBvblNoYXJlVXNlckNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgU2hhcmVEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5TaGFyZURpYWxvZ1wiKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnc2hhcmUgcm9vbSBtZW1iZXIgZGlhbG9nJywgJycsIFNoYXJlRGlhbG9nLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMucHJvcHMubWVtYmVyLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3JlbmRlclVzZXJPcHRpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgY2xpID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBjb25zdCBtZW1iZXIgPSB0aGlzLnByb3BzLm1lbWJlcjtcblxuICAgICAgICBsZXQgaWdub3JlQnV0dG9uID0gbnVsbDtcbiAgICAgICAgbGV0IGluc2VydFBpbGxCdXR0b24gPSBudWxsO1xuICAgICAgICBsZXQgaW52aXRlVXNlckJ1dHRvbiA9IG51bGw7XG4gICAgICAgIGxldCByZWFkUmVjZWlwdEJ1dHRvbiA9IG51bGw7XG5cbiAgICAgICAgLy8gT25seSBhbGxvdyB0aGUgdXNlciB0byBpZ25vcmUgdGhlIHVzZXIgaWYgaXRzIG5vdCBvdXJzZWx2ZXNcbiAgICAgICAgLy8gc2FtZSBnb2VzIGZvciBqdW1waW5nIHRvIHJlYWQgcmVjZWlwdFxuICAgICAgICBpZiAobWVtYmVyLnVzZXJJZCAhPT0gY2xpLmdldFVzZXJJZCgpKSB7XG4gICAgICAgICAgICBpZ25vcmVCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5vbklnbm9yZVRvZ2dsZX0gY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUuaXNJZ25vcmluZyA/IF90KFwiVW5pZ25vcmVcIikgOiBfdChcIklnbm9yZVwiKSB9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKG1lbWJlci5yb29tSWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20obWVtYmVyLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRJZCA9IHJvb20uZ2V0RXZlbnRSZWFkVXBUbyhtZW1iZXIudXNlcklkKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG9uUmVhZFJlY2VpcHRCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50X2lkOiBldmVudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogbWVtYmVyLnJvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG9uSW5zZXJ0UGlsbEJ1dHRvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnaW5zZXJ0X21lbnRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcl9pZDogbWVtYmVyLnVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJlYWRSZWNlaXB0QnV0dG9uID0gKFxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXtvblJlYWRSZWNlaXB0QnV0dG9ufSBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdKdW1wIHRvIHJlYWQgcmVjZWlwdCcpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpbnNlcnRQaWxsQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXtvbkluc2VydFBpbGxCdXR0b259IGNsYXNzTmFtZT17XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCJ9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnTWVudGlvbicpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNhbi5pbnZpdGUgJiYgKCFtZW1iZXIgfHwgIW1lbWJlci5tZW1iZXJzaGlwIHx8IG1lbWJlci5tZW1iZXJzaGlwID09PSAnbGVhdmUnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb21JZCA9IG1lbWJlciAmJiBtZW1iZXIucm9vbUlkID8gbWVtYmVyLnJvb21JZCA6IFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25JbnZpdGVVc2VyQnV0dG9uID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgdXNlIGEgTXVsdGlJbnZpdGVyIHRvIHJlLXVzZSB0aGUgaW52aXRlIGxvZ2ljLCBldmVuIHRob3VnaFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgb25seSBpbnZpdGluZyBvbmUgdXNlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGludml0ZXIgPSBuZXcgTXVsdGlJbnZpdGVyKHJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbnZpdGVyLmludml0ZShbbWVtYmVyLnVzZXJJZF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnZpdGVyLmdldENvbXBsZXRpb25TdGF0ZShtZW1iZXIudXNlcklkKSAhPT0gXCJpbnZpdGVkXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihpbnZpdGVyLmdldEVycm9yVGV4dChtZW1iZXIudXNlcklkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBpbnZpdGUnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byBpbnZpdGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaW52aXRlVXNlckJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17b25JbnZpdGVVc2VyQnV0dG9ufSBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdJbnZpdGUnKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2hhcmVVc2VyQnV0dG9uID0gKFxuICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5vblNoYXJlVXNlckNsaWNrfSBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCI+XG4gICAgICAgICAgICAgICAgeyBfdCgnU2hhcmUgTGluayB0byBVc2VyJykgfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMz57IF90KFwiVXNlciBPcHRpb25zXCIpIH08L2gzPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgcmVhZFJlY2VpcHRCdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICB7IHNoYXJlVXNlckJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgaW5zZXJ0UGlsbEJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgaWdub3JlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICAgICAgeyBpbnZpdGVVc2VyQnV0dG9uIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgc3RhcnRDaGF0O1xuICAgICAgICBsZXQga2lja0J1dHRvbjtcbiAgICAgICAgbGV0IGJhbkJ1dHRvbjtcbiAgICAgICAgbGV0IG11dGVCdXR0b247XG4gICAgICAgIGxldCBnaXZlTW9kQnV0dG9uO1xuICAgICAgICBsZXQgcmVkYWN0QnV0dG9uO1xuICAgICAgICBsZXQgc3luYXBzZURlYWN0aXZhdGVCdXR0b247XG4gICAgICAgIGxldCBzcGlubmVyO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm1lbWJlci51c2VySWQgIT09IHRoaXMuY29udGV4dC5jcmVkZW50aWFscy51c2VySWQpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEltbXV0YWJsZSBETXMgcmVwbGFjZXMgYSBsb3Qgb2YgdGhpc1xuICAgICAgICAgICAgY29uc3QgZG1Sb29tTWFwID0gbmV3IERNUm9vbU1hcCh0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgLy8gZG1Sb29tcyB3aWxsIG5vdCBpbmNsdWRlIGRtUm9vbXMgdGhhdCB3ZSBoYXZlIGJlZW4gaW52aXRlZCBpbnRvIGJ1dCBkaWQgbm90IGpvaW4uXG4gICAgICAgICAgICAvLyBCZWNhdXNlIERNUm9vbU1hcCBydW5zIG9mZiBhY2NvdW50X2RhdGFbbS5kaXJlY3RdIHdoaWNoIGlzIG9ubHkgc2V0IG9uIGpvaW4gb2YgZG0gcm9vbS5cbiAgICAgICAgICAgIC8vIFhYWDogd2UgcG90ZW50aWFsbHkgd2FudCBETXMgd2UgaGF2ZSBiZWVuIGludml0ZWQgdG8sIHRvIGFsc28gc2hvdyB1cCBoZXJlIDpMXG4gICAgICAgICAgICAvLyBlc3BlY2lhbGx5IGFzIGxvZ2ljIGJlbG93IGNvbmNlcm5zIHNwZWNpYWxseSBpZiB3ZSBoYXZlbid0IGpvaW5lZCBidXQgaGF2ZSBiZWVuIGludml0ZWRcbiAgICAgICAgICAgIGNvbnN0IGRtUm9vbXMgPSBkbVJvb21NYXAuZ2V0RE1Sb29tc0ZvclVzZXJJZCh0aGlzLnByb3BzLm1lbWJlci51c2VySWQpO1xuXG4gICAgICAgICAgICBjb25zdCBSb29tVGlsZSA9IHNkay5nZXRDb21wb25lbnQoXCJyb29tcy5Sb29tVGlsZVwiKTtcblxuICAgICAgICAgICAgY29uc3QgdGlsZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgcm9vbUlkIG9mIGRtUm9vbXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBteU1lbWJlcnNoaXAgPSByb29tLmdldE15TWVtYmVyc2hpcCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBub3QgYSBETSByb29tIGlmIHdlIGhhdmUgYXJlIG5vdCBqb2luZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG15TWVtYmVyc2hpcCAhPT0gJ2pvaW4nKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVtID0gdGhpcy5wcm9wcy5tZW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdCBhIERNIHJvb20gaWYgdGhleSBhcmUgbm90IGpvaW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoZW0ubWVtYmVyc2hpcCB8fCB0aGVtLm1lbWJlcnNoaXAgIT09ICdqb2luJykgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gcm9vbS5nZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCgnaGlnaGxpZ2h0JykgPiAwO1xuXG4gICAgICAgICAgICAgICAgICAgIHRpbGVzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICA8Um9vbVRpbGUga2V5PXtyb29tLnJvb21JZH0gcm9vbT17cm9vbX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BhcmVudD17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsYXBzZWQ9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlYWQ9e1VucmVhZC5kb2VzUm9vbUhhdmVVbnJlYWRNZXNzYWdlcyhyb29tKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHQ9e2hpZ2hsaWdodH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0ludml0ZT17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblJvb21UaWxlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPixcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxhYmVsQ2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgIG14X01lbWJlckluZm9fY3JlYXRlUm9vbV9sYWJlbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBteF9Sb29tVGlsZV9uYW1lOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsZXQgc3RhcnROZXdDaGF0ID0gPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2NyZWF0ZVJvb21cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25OZXdETUNsaWNrfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVRpbGVfYXZhdGFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jcmVhdGUtYmlnLnN2Z1wiKX0gd2lkdGg9XCIyNlwiIGhlaWdodD1cIjI2XCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17bGFiZWxDbGFzc2VzfT48aT57IF90KFwiU3RhcnQgYSBjaGF0XCIpIH08L2k+PC9kaXY+XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuXG4gICAgICAgICAgICBpZiAodGlsZXMubGVuZ3RoID4gMCkgc3RhcnROZXdDaGF0ID0gbnVsbDsgLy8gRG9uJ3Qgb2ZmZXIgYSBidXR0b24gZm9yIGEgbmV3IGNoYXQgaWYgd2UgaGF2ZSBvbmUuXG5cbiAgICAgICAgICAgIHN0YXJ0Q2hhdCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzPnsgX3QoXCJEaXJlY3QgY2hhdHNcIikgfTwvaDM+XG4gICAgICAgICAgICAgICAgeyB0aWxlcyB9XG4gICAgICAgICAgICAgICAgeyBzdGFydE5ld0NoYXQgfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudXBkYXRpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgc3Bpbm5lciA9IDxMb2FkZXIgaW1nQ2xhc3NOYW1lPVwibXhfQ29udGV4dHVhbE1lbnVfc3Bpbm5lclwiIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY2FuLmtpY2spIHtcbiAgICAgICAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSB0aGlzLnByb3BzLm1lbWJlci5tZW1iZXJzaGlwO1xuICAgICAgICAgICAgY29uc3Qga2lja0xhYmVsID0gbWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIiA/IF90KFwiRGlzaW52aXRlXCIpIDogX3QoXCJLaWNrXCIpO1xuICAgICAgICAgICAga2lja0J1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25LaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgeyBraWNrTGFiZWwgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW4ucmVkYWN0TWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJlZGFjdEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCIgb25DbGljaz17dGhpcy5vblJlZGFjdEFsbE1lc3NhZ2VzfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIlJlbW92ZSByZWNlbnQgbWVzc2FnZXNcIikgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW4uYmFuKSB7XG4gICAgICAgICAgICBsZXQgbGFiZWwgPSBfdChcIkJhblwiKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm1lbWJlci5tZW1iZXJzaGlwID09PSAnYmFuJykge1xuICAgICAgICAgICAgICAgIGxhYmVsID0gX3QoXCJVbmJhblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJhbkJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25CYW5PclVuYmFufT5cbiAgICAgICAgICAgICAgICAgICAgeyBsYWJlbCB9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW4ubXV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbXV0ZUxhYmVsID0gdGhpcy5zdGF0ZS5tdXRlZCA/IF90KFwiVW5tdXRlXCIpIDogX3QoXCJNdXRlXCIpO1xuICAgICAgICAgICAgbXV0ZUJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25NdXRlVG9nZ2xlfT5cbiAgICAgICAgICAgICAgICAgICAgeyBtdXRlTGFiZWwgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY2FuLnRvZ2dsZU1vZCkge1xuICAgICAgICAgICAgY29uc3QgZ2l2ZU9wTGFiZWwgPSB0aGlzLnN0YXRlLmlzVGFyZ2V0TW9kID8gX3QoXCJSZXZva2UgTW9kZXJhdG9yXCIpIDogX3QoXCJNYWtlIE1vZGVyYXRvclwiKTtcbiAgICAgICAgICAgIGdpdmVNb2RCdXR0b24gPSA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCIgb25DbGljaz17dGhpcy5vbk1vZFRvZ2dsZX0+XG4gICAgICAgICAgICAgICAgeyBnaXZlT3BMYWJlbCB9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhIHBlcmZlY3QgY2hlY2sgaGVyZSwganVzdCBzb21ldGhpbmcgdG8gcGFzcyBhcyBcInByb2JhYmx5IG5vdCBvdXIgaG9tZXNlcnZlclwiLiBJZlxuICAgICAgICAvLyBzb21lb25lIGRvZXMgZmlndXJlIG91dCBob3cgdG8gYnlwYXNzIHRoaXMgY2hlY2sgdGhlIHdvcnN0IHRoYXQgaGFwcGVucyBpcyBhbiBlcnJvci5cbiAgICAgICAgY29uc3Qgc2FtZUhvbWVzZXJ2ZXIgPSB0aGlzLnByb3BzLm1lbWJlci51c2VySWQuZW5kc1dpdGgoYDoke01hdHJpeENsaWVudFBlZy5nZXRIb21lc2VydmVyTmFtZSgpfWApO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW4uc3luYXBzZURlYWN0aXZhdGUgJiYgc2FtZUhvbWVzZXJ2ZXIpIHtcbiAgICAgICAgICAgIHN5bmFwc2VEZWFjdGl2YXRlQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMub25TeW5hcHNlRGVhY3RpdmF0ZX0gY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJEZWFjdGl2YXRlIHVzZXJcIil9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhZG1pblRvb2xzO1xuICAgICAgICBpZiAoa2lja0J1dHRvbiB8fCBiYW5CdXR0b24gfHwgbXV0ZUJ1dHRvbiB8fCBnaXZlTW9kQnV0dG9uIHx8IHN5bmFwc2VEZWFjdGl2YXRlQnV0dG9uIHx8IHJlZGFjdEJ1dHRvbikge1xuICAgICAgICAgICAgYWRtaW5Ub29scyA9XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPnsgX3QoXCJBZG1pbiBUb29sc1wiKSB9PC9oMz5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lbWJlckluZm9fYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBtdXRlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsga2lja0J1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGJhbkJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJlZGFjdEJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGdpdmVNb2RCdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzeW5hcHNlRGVhY3RpdmF0ZUJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lbWJlck5hbWUgPSB0aGlzLnByb3BzLm1lbWJlci5uYW1lO1xuXG4gICAgICAgIGxldCBwcmVzZW5jZVN0YXRlO1xuICAgICAgICBsZXQgcHJlc2VuY2VMYXN0QWN0aXZlQWdvO1xuICAgICAgICBsZXQgcHJlc2VuY2VDdXJyZW50bHlBY3RpdmU7XG4gICAgICAgIGxldCBzdGF0dXNNZXNzYWdlO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm1lbWJlci51c2VyKSB7XG4gICAgICAgICAgICBwcmVzZW5jZVN0YXRlID0gdGhpcy5wcm9wcy5tZW1iZXIudXNlci5wcmVzZW5jZTtcbiAgICAgICAgICAgIHByZXNlbmNlTGFzdEFjdGl2ZUFnbyA9IHRoaXMucHJvcHMubWVtYmVyLnVzZXIubGFzdEFjdGl2ZUFnbztcbiAgICAgICAgICAgIHByZXNlbmNlQ3VycmVudGx5QWN0aXZlID0gdGhpcy5wcm9wcy5tZW1iZXIudXNlci5jdXJyZW50bHlBY3RpdmU7XG5cbiAgICAgICAgICAgIGlmIChTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZUVuYWJsZWQoXCJmZWF0dXJlX2N1c3RvbV9zdGF0dXNcIikpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlID0gdGhpcy5wcm9wcy5tZW1iZXIudXNlci5fdW5zdGFibGVfc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLmNvbnRleHQuZ2V0Um9vbSh0aGlzLnByb3BzLm1lbWJlci5yb29tSWQpO1xuICAgICAgICBjb25zdCBwb3dlckxldmVsRXZlbnQgPSByb29tID8gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpIDogbnVsbDtcbiAgICAgICAgY29uc3QgcG93ZXJMZXZlbFVzZXJzRGVmYXVsdCA9IHBvd2VyTGV2ZWxFdmVudCA/IHBvd2VyTGV2ZWxFdmVudC5nZXRDb250ZW50KCkudXNlcnNfZGVmYXVsdCA6IDA7XG5cbiAgICAgICAgY29uc3QgZW5hYmxlUHJlc2VuY2VCeUhzVXJsID0gU2RrQ29uZmlnLmdldCgpW1wiZW5hYmxlX3ByZXNlbmNlX2J5X2hzX3VybFwiXTtcbiAgICAgICAgY29uc3QgaHNVcmwgPSB0aGlzLmNvbnRleHQuYmFzZVVybDtcbiAgICAgICAgbGV0IHNob3dQcmVzZW5jZSA9IHRydWU7XG4gICAgICAgIGlmIChlbmFibGVQcmVzZW5jZUJ5SHNVcmwgJiYgZW5hYmxlUHJlc2VuY2VCeUhzVXJsW2hzVXJsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzaG93UHJlc2VuY2UgPSBlbmFibGVQcmVzZW5jZUJ5SHNVcmxbaHNVcmxdO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHByZXNlbmNlTGFiZWwgPSBudWxsO1xuICAgICAgICBpZiAoc2hvd1ByZXNlbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBQcmVzZW5jZUxhYmVsID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuUHJlc2VuY2VMYWJlbCcpO1xuICAgICAgICAgICAgcHJlc2VuY2VMYWJlbCA9IDxQcmVzZW5jZUxhYmVsIGFjdGl2ZUFnbz17cHJlc2VuY2VMYXN0QWN0aXZlQWdvfVxuICAgICAgICAgICAgICAgIGN1cnJlbnRseUFjdGl2ZT17cHJlc2VuY2VDdXJyZW50bHlBY3RpdmV9XG4gICAgICAgICAgICAgICAgcHJlc2VuY2VTdGF0ZT17cHJlc2VuY2VTdGF0ZX0gLz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RhdHVzTGFiZWwgPSBudWxsO1xuICAgICAgICBpZiAoc3RhdHVzTWVzc2FnZSkge1xuICAgICAgICAgICAgc3RhdHVzTGFiZWwgPSA8c3BhbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX3N0YXR1c01lc3NhZ2VcIj57IHN0YXR1c01lc3NhZ2UgfTwvc3Bhbj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcm9vbU1lbWJlckRldGFpbHMgPSBudWxsO1xuICAgICAgICBsZXQgZTJlSWNvbkVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubWVtYmVyLnJvb21JZCkgeyAvLyBpcyBpbiByb29tXG4gICAgICAgICAgICBjb25zdCBQb3dlclNlbGVjdG9yID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuUG93ZXJTZWxlY3RvcicpO1xuICAgICAgICAgICAgcm9vbU1lbWJlckRldGFpbHMgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19wcm9maWxlRmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPFBvd2VyU2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwYXJzZUludCh0aGlzLnByb3BzLm1lbWJlci5wb3dlckxldmVsKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFZhbHVlPXt0aGlzLnN0YXRlLmNhbi5tb2RpZnlMZXZlbE1heH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshdGhpcy5zdGF0ZS5jYW4ubW9kaWZ5TGV2ZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2Vyc0RlZmF1bHQ9e3Bvd2VyTGV2ZWxVc2Vyc0RlZmF1bHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vblBvd2VyQ2hhbmdlfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19wcm9maWxlRmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAge3ByZXNlbmNlTGFiZWx9XG4gICAgICAgICAgICAgICAgICAgIHtzdGF0dXNMYWJlbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PjtcblxuICAgICAgICAgICAgY29uc3QgaXNFbmNyeXB0ZWQgPSB0aGlzLmNvbnRleHQuaXNSb29tRW5jcnlwdGVkKHRoaXMucHJvcHMubWVtYmVyLnJvb21JZCk7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5lMmVTdGF0dXMgJiYgaXNFbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgICAgICBlMmVJY29uRWxlbWVudCA9ICg8RTJFSWNvbiBzdGF0dXM9e3RoaXMuc3RhdGUuZTJlU3RhdHVzfSBpc1VzZXI9e3RydWV9IC8+KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHttZW1iZXJ9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgYXZhdGFyVXJsID0gbWVtYmVyLmF2YXRhclVybCB8fCAobWVtYmVyLmdldE14Y0F2YXRhclVybCAmJiBtZW1iZXIuZ2V0TXhjQXZhdGFyVXJsKCkpO1xuICAgICAgICBsZXQgYXZhdGFyRWxlbWVudDtcbiAgICAgICAgaWYgKGF2YXRhclVybCkge1xuICAgICAgICAgICAgY29uc3QgaHR0cFVybCA9IHRoaXMuY29udGV4dC5teGNVcmxUb0h0dHAoYXZhdGFyVXJsLCA4MDAsIDgwMCk7XG4gICAgICAgICAgICBhdmF0YXJFbGVtZW50ID0gPGRpdiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2F2YXRhclwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtodHRwVXJsfSAvPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJhY2tCdXR0b247XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm1lbWJlci5yb29tSWQpIHtcbiAgICAgICAgICAgIGJhY2tCdXR0b24gPSAoPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19jYW5jZWxcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DYW5jZWx9XG4gICAgICAgICAgICAgICAgdGl0bGU9e190KCdDbG9zZScpfVxuICAgICAgICAgICAgLz4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb1wiIHJvbGU9XCJ0YWJwYW5lbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19uYW1lXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgYmFja0J1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIHsgZTJlSWNvbkVsZW1lbnQgfVxuICAgICAgICAgICAgICAgICAgICA8aDI+eyBtZW1iZXJOYW1lIH08L2gyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsgYXZhdGFyRWxlbWVudCB9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2NvbnRhaW5lclwiPlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19wcm9maWxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01lbWJlckluZm9fcHJvZmlsZUZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLm1lbWJlci51c2VySWQgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJvb21NZW1iZXJEZXRhaWxzIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPEF1dG9IaWRlU2Nyb2xsYmFyIGNsYXNzTmFtZT1cIm14X01lbWJlckluZm9fc2Nyb2xsQ29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5fcmVuZGVyVXNlck9wdGlvbnMoKSB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgYWRtaW5Ub29scyB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc3RhcnRDaGF0IH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9yZW5kZXJEZXZpY2VzKCkgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHNwaW5uZXIgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0F1dG9IaWRlU2Nyb2xsYmFyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19