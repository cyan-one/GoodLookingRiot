"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.useDevices = exports.getE2EStatus = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _matrixJsSdk = require("matrix-js-sdk");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _createRoom = _interopRequireDefault(require("../../../createRoom"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _AutoHideScrollbar = _interopRequireDefault(require("../../structures/AutoHideScrollbar"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _MultiInviter = _interopRequireDefault(require("../../../utils/MultiInviter"));

var _GroupStore = _interopRequireDefault(require("../../../stores/GroupStore"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _E2EIcon = _interopRequireDefault(require("../rooms/E2EIcon"));

var _useEventEmitter = require("../../../hooks/useEventEmitter");

var _Roles = require("../../../Roles");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _RightPanelStorePhases = require("../../../stores/RightPanelStorePhases");

var _EncryptionPanel = _interopRequireDefault(require("./EncryptionPanel"));

var _useAsyncMemo = require("../../../hooks/useAsyncMemo");

var _verification = require("../../../verification");

var _actions = require("../../../dispatcher/actions");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 Vector Creations Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
const _disambiguateDevices = devices => {
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
};

const getE2EStatus = (cli, userId, devices) => {
  if (!_SettingsStore.default.getValue("feature_cross_signing")) {
    const hasUnverifiedDevice = devices.some(device => device.isUnverified());
    return hasUnverifiedDevice ? "warning" : "verified";
  }

  const isMe = userId === cli.getUserId();
  const userTrust = cli.checkUserTrust(userId);

  if (!userTrust.isCrossSigningVerified()) {
    return userTrust.wasCrossSigningVerified() ? "warning" : "normal";
  }

  const anyDeviceUnverified = devices.some(device => {
    const {
      deviceId
    } = device; // For your own devices, we use the stricter check of cross-signing
    // verification to encourage everyone to trust their own devices via
    // cross-signing so that other users can then safely trust you.
    // For other people's devices, the more general verified check that
    // includes locally verified devices can be used.

    const deviceTrust = cli.checkDeviceTrust(userId, deviceId);
    return isMe ? !deviceTrust.isCrossSigningVerified() : !deviceTrust.isVerified();
  });
  return anyDeviceUnverified ? "warning" : "verified";
};

exports.getE2EStatus = getE2EStatus;

async function openDMForUser(matrixClient, userId) {
  const dmRooms = _DMRoomMap.default.shared().getDMRoomsForUserId(userId);

  const lastActiveRoom = dmRooms.reduce((lastActiveRoom, roomId) => {
    const room = matrixClient.getRoom(roomId);

    if (!room || room.getMyMembership() === "leave") {
      return lastActiveRoom;
    }

    if (!lastActiveRoom || lastActiveRoom.getLastActiveTimestamp() < room.getLastActiveTimestamp()) {
      return room;
    }

    return lastActiveRoom;
  }, null);

  if (lastActiveRoom) {
    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: lastActiveRoom.roomId
    });

    return;
  }

  const createRoomOptions = {
    dmUserId: userId
  };

  if (_SettingsStore.default.getValue("feature_cross_signing")) {
    // Check whether all users have uploaded device keys before.
    // If so, enable encryption in the new room.
    const usersToDevicesMap = await matrixClient.downloadKeys([userId]);
    const allHaveDeviceKeys = Object.values(usersToDevicesMap).every(devices => {
      // `devices` is an object of the form { deviceId: deviceInfo, ... }.
      return Object.keys(devices).length > 0;
    });

    if (allHaveDeviceKeys) {
      createRoomOptions.encryption = true;
    }
  }

  (0, _createRoom.default)(createRoomOptions);
}

function useIsEncrypted(cli, room) {
  const [isEncrypted, setIsEncrypted] = (0, _react.useState)(room ? cli.isRoomEncrypted(room.roomId) : undefined);
  const update = (0, _react.useCallback)(event => {
    if (event.getType() === "m.room.encryption") {
      setIsEncrypted(cli.isRoomEncrypted(room.roomId));
    }
  }, [cli, room]);
  (0, _useEventEmitter.useEventEmitter)(room ? room.currentState : undefined, "RoomState.events", update);
  return isEncrypted;
}

function useHasCrossSigningKeys(cli, member, canVerify, setUpdating) {
  return (0, _useAsyncMemo.useAsyncMemo)(async () => {
    if (!canVerify) {
      return undefined;
    }

    setUpdating(true);

    try {
      await cli.downloadKeys([member.userId]);
      const xsi = cli.getStoredCrossSigningForUser(member.userId);
      const key = xsi && xsi.getId();
      return !!key;
    } finally {
      setUpdating(false);
    }
  }, [cli, member, canVerify], undefined);
}

function DeviceItem({
  userId,
  device
}) {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  const isMe = userId === cli.getUserId();
  const deviceTrust = cli.checkDeviceTrust(userId, device.deviceId);
  const userTrust = cli.checkUserTrust(userId); // For your own devices, we use the stricter check of cross-signing
  // verification to encourage everyone to trust their own devices via
  // cross-signing so that other users can then safely trust you.
  // For other people's devices, the more general verified check that
  // includes locally verified devices can be used.

  const isVerified = isMe && _SettingsStore.default.getValue("feature_cross_signing") ? deviceTrust.isCrossSigningVerified() : deviceTrust.isVerified();
  const classes = (0, _classnames.default)("mx_UserInfo_device", {
    mx_UserInfo_device_verified: isVerified,
    mx_UserInfo_device_unverified: !isVerified
  });
  const iconClasses = (0, _classnames.default)("mx_E2EIcon", {
    mx_E2EIcon_normal: !userTrust.isVerified(),
    mx_E2EIcon_verified: isVerified,
    mx_E2EIcon_warning: userTrust.isVerified() && !isVerified
  });

  const onDeviceClick = () => {
    (0, _verification.verifyDevice)(cli.getUser(userId), device);
  };

  const deviceName = device.ambiguous ? (device.getDisplayName() ? device.getDisplayName() : "") + " (" + device.deviceId + ")" : device.getDisplayName();
  let trustedLabel = null;
  if (userTrust.isVerified()) trustedLabel = isVerified ? (0, _languageHandler._t)("Trusted") : (0, _languageHandler._t)("Not trusted");

  if (isVerified) {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes,
      title: device.deviceId
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: iconClasses
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_device_name"
    }, deviceName), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_device_trusted"
    }, trustedLabel));
  } else {
    return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: classes,
      title: device.deviceId,
      onClick: onDeviceClick
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: iconClasses
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_device_name"
    }, deviceName), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserInfo_device_trusted"
    }, trustedLabel));
  }
}

function DevicesSection({
  devices,
  userId,
  loading
}) {
  const Spinner = sdk.getComponent("elements.Spinner");
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  const userTrust = cli.checkUserTrust(userId);
  const [isExpanded, setExpanded] = (0, _react.useState)(false);

  if (loading) {
    // still loading
    return /*#__PURE__*/_react.default.createElement(Spinner, null);
  }

  if (devices === null) {
    return (0, _languageHandler._t)("Unable to load session list");
  }

  const isMe = userId === cli.getUserId();
  const deviceTrusts = devices.map(d => cli.checkDeviceTrust(userId, d.deviceId));
  let expandSectionDevices = [];
  const unverifiedDevices = [];
  let expandCountCaption;
  let expandHideCaption;
  let expandIconClasses = "mx_E2EIcon";

  if (userTrust.isVerified()) {
    for (let i = 0; i < devices.length; ++i) {
      const device = devices[i];
      const deviceTrust = deviceTrusts[i]; // For your own devices, we use the stricter check of cross-signing
      // verification to encourage everyone to trust their own devices via
      // cross-signing so that other users can then safely trust you.
      // For other people's devices, the more general verified check that
      // includes locally verified devices can be used.

      const isVerified = isMe && _SettingsStore.default.getValue("feature_cross_signing") ? deviceTrust.isCrossSigningVerified() : deviceTrust.isVerified();

      if (isVerified) {
        expandSectionDevices.push(device);
      } else {
        unverifiedDevices.push(device);
      }
    }

    expandCountCaption = (0, _languageHandler._t)("%(count)s verified sessions", {
      count: expandSectionDevices.length
    });
    expandHideCaption = (0, _languageHandler._t)("Hide verified sessions");
    expandIconClasses += " mx_E2EIcon_verified";
  } else {
    expandSectionDevices = devices;
    expandCountCaption = (0, _languageHandler._t)("%(count)s sessions", {
      count: devices.length
    });
    expandHideCaption = (0, _languageHandler._t)("Hide sessions");
    expandIconClasses += " mx_E2EIcon_normal";
  }

  let expandButton;

  if (expandSectionDevices.length) {
    if (isExpanded) {
      expandButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_UserInfo_expand mx_linkButton",
        onClick: () => setExpanded(false)
      }, /*#__PURE__*/_react.default.createElement("div", null, expandHideCaption));
    } else {
      expandButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_UserInfo_expand mx_linkButton",
        onClick: () => setExpanded(true)
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: expandIconClasses
      }), /*#__PURE__*/_react.default.createElement("div", null, expandCountCaption));
    }
  }

  let deviceList = unverifiedDevices.map((device, i) => {
    return /*#__PURE__*/_react.default.createElement(DeviceItem, {
      key: i,
      userId: userId,
      device: device
    });
  });

  if (isExpanded) {
    const keyStart = unverifiedDevices.length;
    deviceList = deviceList.concat(expandSectionDevices.map((device, i) => {
      return /*#__PURE__*/_react.default.createElement(DeviceItem, {
        key: i + keyStart,
        userId: userId,
        device: device
      });
    }));
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_devices"
  }, /*#__PURE__*/_react.default.createElement("div", null, deviceList), /*#__PURE__*/_react.default.createElement("div", null, expandButton));
}

const UserOptionsSection = ({
  member,
  isIgnored,
  canInvite,
  devices
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  let ignoreButton = null;
  let insertPillButton = null;
  let inviteUserButton = null;
  let readReceiptButton = null;
  const isMe = member.userId === cli.getUserId();

  const onShareUserClick = () => {
    const ShareDialog = sdk.getComponent("dialogs.ShareDialog");

    _Modal.default.createTrackedDialog('share room member dialog', '', ShareDialog, {
      target: member
    });
  }; // Only allow the user to ignore the user if its not ourselves
  // same goes for jumping to read receipt


  if (!isMe) {
    const onIgnoreToggle = () => {
      const ignoredUsers = cli.getIgnoredUsers();

      if (isIgnored) {
        const index = ignoredUsers.indexOf(member.userId);
        if (index !== -1) ignoredUsers.splice(index, 1);
      } else {
        ignoredUsers.push(member.userId);
      }

      cli.setIgnoredUsers(ignoredUsers);
    };

    ignoreButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: onIgnoreToggle,
      className: (0, _classnames.default)("mx_UserInfo_field", {
        mx_UserInfo_destructive: !isIgnored
      })
    }, isIgnored ? (0, _languageHandler._t)("Unignore") : (0, _languageHandler._t)("Ignore"));

    if (member.roomId) {
      const onReadReceiptButton = function () {
        const room = cli.getRoom(member.roomId);

        _dispatcher.default.dispatch({
          action: 'view_room',
          highlighted: true,
          event_id: room.getEventReadUpTo(member.userId),
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
        className: "mx_UserInfo_field"
      }, (0, _languageHandler._t)('Jump to read receipt'));
      insertPillButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: onInsertPillButton,
        className: "mx_UserInfo_field"
      }, (0, _languageHandler._t)('Mention'));
    }

    if (canInvite && (!member || !member.membership || member.membership === 'leave')) {
      const roomId = member && member.roomId ? member.roomId : _RoomViewStore.default.getRoomId();

      const onInviteUserButton = async () => {
        try {
          // We use a MultiInviter to re-use the invite logic, even though
          // we're only inviting one user.
          const inviter = new _MultiInviter.default(roomId);
          await inviter.invite([member.userId]).then(() => {
            if (inviter.getCompletionState(member.userId) !== "invited") {
              throw new Error(inviter.getErrorText(member.userId));
            }
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
        className: "mx_UserInfo_field"
      }, (0, _languageHandler._t)('Invite'));
    }
  }

  const shareUserButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    onClick: onShareUserClick,
    className: "mx_UserInfo_field"
  }, (0, _languageHandler._t)('Share Link to User'));

  let directMessageButton;

  if (!isMe) {
    directMessageButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: () => openDMForUser(cli, member.userId),
      className: "mx_UserInfo_field"
    }, (0, _languageHandler._t)('Direct message'));
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container"
  }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Options")), /*#__PURE__*/_react.default.createElement("div", null, directMessageButton, readReceiptButton, shareUserButton, insertPillButton, inviteUserButton, ignoreButton));
};

const _warnSelfDemote = async () => {
  const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

  const {
    finished
  } = _Modal.default.createTrackedDialog('Demoting Self', '', QuestionDialog, {
    title: (0, _languageHandler._t)("Demote yourself?"),
    description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("You will not be able to undo this change as you are demoting yourself, " + "if you are the last privileged user in the room it will be impossible " + "to regain privileges.")),
    button: (0, _languageHandler._t)("Demote")
  });

  const [confirmed] = await finished;
  return confirmed;
};

const GenericAdminToolsContainer = ({
  children
}) => {
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container"
  }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Admin Tools")), /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_buttons"
  }, children));
};

const _isMuted = (member, powerLevelContent) => {
  if (!powerLevelContent || !member) return false;
  const levelToSend = (powerLevelContent.events ? powerLevelContent.events["m.room.message"] : null) || powerLevelContent.events_default;
  return member.powerLevel < levelToSend;
};

const useRoomPowerLevels = (cli, room) => {
  const [powerLevels, setPowerLevels] = (0, _react.useState)({});
  const update = (0, _react.useCallback)(() => {
    if (!room) {
      return;
    }

    const event = room.currentState.getStateEvents("m.room.power_levels", "");

    if (event) {
      setPowerLevels(event.getContent());
    } else {
      setPowerLevels({});
    }

    return () => {
      setPowerLevels({});
    };
  }, [room]);
  (0, _useEventEmitter.useEventEmitter)(cli, "RoomState.members", update);
  (0, _react.useEffect)(() => {
    update();
    return () => {
      setPowerLevels({});
    };
  }, [update]);
  return powerLevels;
};

const RoomKickButton = ({
  member,
  startUpdating,
  stopUpdating
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default); // check if user can be kicked/disinvited

  if (member.membership !== "invite" && member.membership !== "join") return null;

  const onKick = async () => {
    const ConfirmUserActionDialog = sdk.getComponent("dialogs.ConfirmUserActionDialog");

    const {
      finished
    } = _Modal.default.createTrackedDialog('Confirm User Action Dialog', 'onKick', ConfirmUserActionDialog, {
      member,
      action: member.membership === "invite" ? (0, _languageHandler._t)("Disinvite") : (0, _languageHandler._t)("Kick"),
      title: member.membership === "invite" ? (0, _languageHandler._t)("Disinvite this user?") : (0, _languageHandler._t)("Kick this user?"),
      askReason: member.membership === "join",
      danger: true
    });

    const [proceed, reason] = await finished;
    if (!proceed) return;
    startUpdating();
    cli.kick(member.roomId, member.userId, reason || undefined).then(() => {
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
      stopUpdating();
    });
  };

  const kickLabel = member.membership === "invite" ? (0, _languageHandler._t)("Disinvite") : (0, _languageHandler._t)("Kick");
  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    className: "mx_UserInfo_field mx_UserInfo_destructive",
    onClick: onKick
  }, kickLabel);
};

const RedactMessagesButton = ({
  member
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);

  const onRedactAllMessages = async () => {
    const {
      roomId,
      userId
    } = member;
    const room = cli.getRoom(roomId);

    if (!room) {
      return;
    }

    let timeline = room.getLiveTimeline();
    let eventsToRedact = [];

    while (timeline) {
      eventsToRedact = timeline.getEvents().reduce((events, event) => {
        if (event.getSender() === userId && !event.isRedacted() && !event.isRedaction()) {
          return events.concat(event);
        } else {
          return events;
        }
      }, eventsToRedact);
      timeline = timeline.getNeighbouringTimeline(_matrixJsSdk.EventTimeline.BACKWARDS);
    }

    const count = eventsToRedact.length;
    const user = member.name;

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

      const {
        finished
      } = _Modal.default.createTrackedDialog('Remove recent messages by user', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Remove recent messages by %(user)s", {
          user
        }),
        description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You are about to remove %(count)s messages by %(user)s. This cannot be undone. Do you wish to continue?", {
          count,
          user
        })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("For a large amount of messages, this might take some time. Please don't refresh your client in the meantime."))),
        button: (0, _languageHandler._t)("Remove %(count)s messages", {
          count
        })
      });

      const [confirmed] = await finished;

      if (!confirmed) {
        return;
      } // Submitting a large number of redactions freezes the UI,
      // so first yield to allow to rerender after closing the dialog.


      await Promise.resolve();
      console.info("Started redacting recent ".concat(count, " messages for ").concat(user, " in ").concat(roomId));
      await Promise.all(eventsToRedact.map(async event => {
        try {
          await cli.redactEvent(roomId, event.getId());
        } catch (err) {
          // log and swallow errors
          console.error("Could not redact", event.getId());
          console.error(err);
        }
      }));
      console.info("Finished redacting recent ".concat(count, " messages for ").concat(user, " in ").concat(roomId));
    }
  };

  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    className: "mx_UserInfo_field mx_UserInfo_destructive",
    onClick: onRedactAllMessages
  }, (0, _languageHandler._t)("Remove recent messages"));
};

const BanToggleButton = ({
  member,
  startUpdating,
  stopUpdating
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);

  const onBanOrUnban = async () => {
    const ConfirmUserActionDialog = sdk.getComponent("dialogs.ConfirmUserActionDialog");

    const {
      finished
    } = _Modal.default.createTrackedDialog('Confirm User Action Dialog', 'onBanOrUnban', ConfirmUserActionDialog, {
      member,
      action: member.membership === 'ban' ? (0, _languageHandler._t)("Unban") : (0, _languageHandler._t)("Ban"),
      title: member.membership === 'ban' ? (0, _languageHandler._t)("Unban this user?") : (0, _languageHandler._t)("Ban this user?"),
      askReason: member.membership !== 'ban',
      danger: member.membership !== 'ban'
    });

    const [proceed, reason] = await finished;
    if (!proceed) return;
    startUpdating();
    let promise;

    if (member.membership === 'ban') {
      promise = cli.unban(member.roomId, member.userId);
    } else {
      promise = cli.ban(member.roomId, member.userId, reason || undefined);
    }

    promise.then(() => {
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
      stopUpdating();
    });
  };

  let label = (0, _languageHandler._t)("Ban");

  if (member.membership === 'ban') {
    label = (0, _languageHandler._t)("Unban");
  }

  const classes = (0, _classnames.default)("mx_UserInfo_field", {
    mx_UserInfo_destructive: member.membership !== 'ban'
  });
  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    className: classes,
    onClick: onBanOrUnban
  }, label);
};

const MuteToggleButton = ({
  member,
  room,
  powerLevels,
  startUpdating,
  stopUpdating
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default); // Don't show the mute/unmute option if the user is not in the room

  if (member.membership !== "join") return null;

  const isMuted = _isMuted(member, powerLevels);

  const onMuteToggle = async () => {
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const roomId = member.roomId;
    const target = member.userId; // if muting self, warn as it may be irreversible

    if (target === cli.getUserId()) {
      try {
        if (!(await _warnSelfDemote())) return;
      } catch (e) {
        console.error("Failed to warn about self demotion: ", e);
        return;
      }
    }

    const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevelEvent) return;
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
      startUpdating();
      cli.setPowerLevel(roomId, target, level, powerLevelEvent).then(() => {
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
        stopUpdating();
      });
    }
  };

  const classes = (0, _classnames.default)("mx_UserInfo_field", {
    mx_UserInfo_destructive: !isMuted
  });
  const muteLabel = isMuted ? (0, _languageHandler._t)("Unmute") : (0, _languageHandler._t)("Mute");
  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    className: classes,
    onClick: onMuteToggle
  }, muteLabel);
};

const RoomAdminToolsContainer = ({
  room,
  children,
  member,
  startUpdating,
  stopUpdating,
  powerLevels
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  let kickButton;
  let banButton;
  let muteButton;
  let redactButton;
  const editPowerLevel = (powerLevels.events ? powerLevels.events["m.room.power_levels"] : null) || powerLevels.state_default;
  const me = room.getMember(cli.getUserId());
  const isMe = me.userId === member.userId;
  const canAffectUser = member.powerLevel < me.powerLevel || isMe;

  if (canAffectUser && me.powerLevel >= powerLevels.kick) {
    kickButton = /*#__PURE__*/_react.default.createElement(RoomKickButton, {
      member: member,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    });
  }

  if (me.powerLevel >= powerLevels.redact) {
    redactButton = /*#__PURE__*/_react.default.createElement(RedactMessagesButton, {
      member: member,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    });
  }

  if (canAffectUser && me.powerLevel >= powerLevels.ban) {
    banButton = /*#__PURE__*/_react.default.createElement(BanToggleButton, {
      member: member,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    });
  }

  if (canAffectUser && me.powerLevel >= editPowerLevel) {
    muteButton = /*#__PURE__*/_react.default.createElement(MuteToggleButton, {
      member: member,
      room: room,
      powerLevels: powerLevels,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    });
  }

  if (kickButton || banButton || muteButton || redactButton || children) {
    return /*#__PURE__*/_react.default.createElement(GenericAdminToolsContainer, null, muteButton, kickButton, banButton, redactButton, children);
  }

  return /*#__PURE__*/_react.default.createElement("div", null);
};

const GroupAdminToolsSection = ({
  children,
  groupId,
  groupMember,
  startUpdating,
  stopUpdating
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  const [isPrivileged, setIsPrivileged] = (0, _react.useState)(false);
  const [isInvited, setIsInvited] = (0, _react.useState)(false); // Listen to group store changes

  (0, _react.useEffect)(() => {
    let unmounted = false;

    const onGroupStoreUpdated = () => {
      if (unmounted) return;
      setIsPrivileged(_GroupStore.default.isUserPrivileged(groupId));
      setIsInvited(_GroupStore.default.getGroupInvitedMembers(groupId).some(m => m.userId === groupMember.userId));
    };

    _GroupStore.default.registerListener(groupId, onGroupStoreUpdated);

    onGroupStoreUpdated(); // Handle unmount

    return () => {
      unmounted = true;

      _GroupStore.default.unregisterListener(onGroupStoreUpdated);
    };
  }, [groupId, groupMember.userId]);

  if (isPrivileged) {
    const _onKick = async () => {
      const ConfirmUserActionDialog = sdk.getComponent("dialogs.ConfirmUserActionDialog");

      const {
        finished
      } = _Modal.default.createDialog(ConfirmUserActionDialog, {
        matrixClient: cli,
        groupMember,
        action: isInvited ? (0, _languageHandler._t)('Disinvite') : (0, _languageHandler._t)('Remove from community'),
        title: isInvited ? (0, _languageHandler._t)('Disinvite this user from community?') : (0, _languageHandler._t)('Remove this user from community?'),
        danger: true
      });

      const [proceed] = await finished;
      if (!proceed) return;
      startUpdating();
      cli.removeUserFromGroup(groupId, groupMember.userId).then(() => {
        // return to the user list
        _dispatcher.default.dispatch({
          action: _actions.Action.ViewUser,
          member: null
        });
      }).catch(e => {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Failed to remove user from group', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Error'),
          description: isInvited ? (0, _languageHandler._t)('Failed to withdraw invitation') : (0, _languageHandler._t)('Failed to remove user from community')
        });

        console.log(e);
      }).finally(() => {
        stopUpdating();
      });
    };

    const kickButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_UserInfo_field mx_UserInfo_destructive",
      onClick: _onKick
    }, isInvited ? (0, _languageHandler._t)('Disinvite') : (0, _languageHandler._t)('Remove from community')); // No make/revoke admin API yet

    /*const opLabel = this.state.isTargetMod ? _t("Revoke Moderator") : _t("Make Moderator");
    giveModButton = <AccessibleButton className="mx_UserInfo_field" onClick={this.onModToggle}>
        {giveOpLabel}
    </AccessibleButton>;*/


    return /*#__PURE__*/_react.default.createElement(GenericAdminToolsContainer, null, kickButton, children);
  }

  return /*#__PURE__*/_react.default.createElement("div", null);
};

const GroupMember = _propTypes.default.shape({
  userId: _propTypes.default.string.isRequired,
  displayname: _propTypes.default.string,
  // XXX: GroupMember objects are inconsistent :((
  avatarUrl: _propTypes.default.string
});

const useIsSynapseAdmin = cli => {
  const [isAdmin, setIsAdmin] = (0, _react.useState)(false);
  (0, _react.useEffect)(() => {
    cli.isSynapseAdministrator().then(isAdmin => {
      setIsAdmin(isAdmin);
    }, () => {
      setIsAdmin(false);
    });
  }, [cli]);
  return isAdmin;
};

const useHomeserverSupportsCrossSigning = cli => {
  return (0, _useAsyncMemo.useAsyncMemo)(async () => {
    return cli.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing");
  }, [cli], false);
};

function useRoomPermissions(cli, room, user) {
  const [roomPermissions, setRoomPermissions] = (0, _react.useState)({
    // modifyLevelMax is the max PL we can set this user to, typically min(their PL, our PL) && canSetPL
    modifyLevelMax: -1,
    canEdit: false,
    canInvite: false
  });
  const updateRoomPermissions = (0, _react.useCallback)(() => {
    if (!room) {
      return;
    }

    const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
    if (!powerLevelEvent) return;
    const powerLevels = powerLevelEvent.getContent();
    if (!powerLevels) return;
    const me = room.getMember(cli.getUserId());
    if (!me) return;
    const them = user;
    const isMe = me.userId === them.userId;
    const canAffectUser = them.powerLevel < me.powerLevel || isMe;
    let modifyLevelMax = -1;

    if (canAffectUser) {
      const editPowerLevel = (powerLevels.events ? powerLevels.events["m.room.power_levels"] : null) || powerLevels.state_default;

      if (me.powerLevel >= editPowerLevel && (isMe || me.powerLevel > them.powerLevel)) {
        modifyLevelMax = me.powerLevel;
      }
    }

    setRoomPermissions({
      canInvite: me.powerLevel >= powerLevels.invite,
      canEdit: modifyLevelMax >= 0,
      modifyLevelMax
    });
  }, [cli, user, room]);
  (0, _useEventEmitter.useEventEmitter)(cli, "RoomState.members", updateRoomPermissions);
  (0, _react.useEffect)(() => {
    updateRoomPermissions();
    return () => {
      setRoomPermissions({
        maximalPowerLevel: -1,
        canEdit: false,
        canInvite: false
      });
    };
  }, [updateRoomPermissions]);
  return roomPermissions;
}

const PowerLevelSection = ({
  user,
  room,
  roomPermissions,
  powerLevels
}) => {
  const [isEditing, setEditing] = (0, _react.useState)(false);

  if (room && user.roomId) {
    // is in room
    if (isEditing) {
      return /*#__PURE__*/_react.default.createElement(PowerLevelEditor, {
        user: user,
        room: room,
        roomPermissions: roomPermissions,
        onFinished: () => setEditing(false)
      });
    } else {
      const IconButton = sdk.getComponent('elements.IconButton');
      const powerLevelUsersDefault = powerLevels.users_default || 0;
      const powerLevel = parseInt(user.powerLevel, 10);
      const modifyButton = roomPermissions.canEdit ? /*#__PURE__*/_react.default.createElement(IconButton, {
        icon: "edit",
        onClick: () => setEditing(true)
      }) : null;
      const role = (0, _Roles.textualPowerLevel)(powerLevel, powerLevelUsersDefault);
      const label = (0, _languageHandler._t)("<strong>%(role)s</strong> in %(roomName)s", {
        role,
        roomName: room.name
      }, {
        strong: label => /*#__PURE__*/_react.default.createElement("strong", null, label)
      });
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UserInfo_profileField"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UserInfo_roleDescription"
      }, label, modifyButton));
    }
  } else {
    return null;
  }
};

const PowerLevelEditor = ({
  user,
  room,
  roomPermissions,
  onFinished
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  const [isUpdating, setIsUpdating] = (0, _react.useState)(false);
  const [selectedPowerLevel, setSelectedPowerLevel] = (0, _react.useState)(parseInt(user.powerLevel, 10));
  const [isDirty, setIsDirty] = (0, _react.useState)(false);
  const onPowerChange = (0, _react.useCallback)(powerLevel => {
    setIsDirty(true);
    setSelectedPowerLevel(parseInt(powerLevel, 10));
  }, [setSelectedPowerLevel, setIsDirty]);
  const changePowerLevel = (0, _react.useCallback)(async () => {
    const _applyPowerChange = (roomId, target, powerLevel, powerLevelEvent) => {
      return cli.setPowerLevel(roomId, target, parseInt(powerLevel), powerLevelEvent).then(function () {
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
      });
    };

    try {
      if (!isDirty) {
        return;
      }

      setIsUpdating(true);
      const powerLevel = selectedPowerLevel;
      const roomId = user.roomId;
      const target = user.userId;
      const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
      if (!powerLevelEvent) return;

      if (!powerLevelEvent.getContent().users) {
        _applyPowerChange(roomId, target, powerLevel, powerLevelEvent);

        return;
      }

      const myUserId = cli.getUserId();
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog"); // If we are changing our own PL it can only ever be decreasing, which we cannot reverse.

      if (myUserId === target) {
        try {
          if (!(await _warnSelfDemote())) return;
        } catch (e) {
          console.error("Failed to warn about self demotion: ", e);
        }

        await _applyPowerChange(roomId, target, powerLevel, powerLevelEvent);
        return;
      }

      const myPower = powerLevelEvent.getContent().users[myUserId];

      if (parseInt(myPower) === parseInt(powerLevel)) {
        const {
          finished
        } = _Modal.default.createTrackedDialog('Promote to PL100 Warning', '', QuestionDialog, {
          title: (0, _languageHandler._t)("Warning!"),
          description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("You will not be able to undo this change as you are promoting the user " + "to have the same power level as yourself."), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Are you sure?")),
          button: (0, _languageHandler._t)("Continue")
        });

        const [confirmed] = await finished;
        if (!confirmed) return;
      }

      await _applyPowerChange(roomId, target, powerLevel, powerLevelEvent);
    } finally {
      onFinished();
    }
  }, [user.roomId, user.userId, cli, selectedPowerLevel, isDirty, setIsUpdating, onFinished, room]);
  const powerLevelEvent = room.currentState.getStateEvents("m.room.power_levels", "");
  const powerLevelUsersDefault = powerLevelEvent ? powerLevelEvent.getContent().users_default : 0;
  const IconButton = sdk.getComponent('elements.IconButton');
  const Spinner = sdk.getComponent("elements.Spinner");
  const buttonOrSpinner = isUpdating ? /*#__PURE__*/_react.default.createElement(Spinner, {
    w: 16,
    h: 16
  }) : /*#__PURE__*/_react.default.createElement(IconButton, {
    icon: "check",
    onClick: changePowerLevel
  });
  const PowerSelector = sdk.getComponent('elements.PowerSelector');
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_profileField"
  }, /*#__PURE__*/_react.default.createElement(PowerSelector, {
    label: null,
    value: selectedPowerLevel,
    maxValue: roomPermissions.modifyLevelMax,
    usersDefault: powerLevelUsersDefault,
    onChange: onPowerChange,
    disabled: isUpdating
  }), buttonOrSpinner);
};

const useDevices = userId => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default); // undefined means yet to be loaded, null means failed to load, otherwise list of devices

  const [devices, setDevices] = (0, _react.useState)(undefined); // Download device lists

  (0, _react.useEffect)(() => {
    setDevices(undefined);
    let cancelled = false;

    async function _downloadDeviceList() {
      try {
        await cli.downloadKeys([userId], true);
        const devices = cli.getStoredDevicesForUser(userId);

        if (cancelled) {
          // we got cancelled - presumably a different user now
          return;
        }

        _disambiguateDevices(devices);

        setDevices(devices);
      } catch (err) {
        setDevices(null);
      }
    }

    _downloadDeviceList(); // Handle being unmounted


    return () => {
      cancelled = true;
    };
  }, [cli, userId]); // Listen to changes

  (0, _react.useEffect)(() => {
    let cancel = false;

    const updateDevices = async () => {
      const newDevices = cli.getStoredDevicesForUser(userId);
      if (cancel) return;
      setDevices(newDevices);
    };

    const onDevicesUpdated = users => {
      if (!users.includes(userId)) return;
      updateDevices();
    };

    const onDeviceVerificationChanged = (_userId, device) => {
      if (_userId !== userId) return;
      updateDevices();
    };

    const onUserTrustStatusChanged = (_userId, trustStatus) => {
      if (_userId !== userId) return;
      updateDevices();
    };

    cli.on("crypto.devicesUpdated", onDevicesUpdated);
    cli.on("deviceVerificationChanged", onDeviceVerificationChanged);
    cli.on("userTrustStatusChanged", onUserTrustStatusChanged); // Handle being unmounted

    return () => {
      cancel = true;
      cli.removeListener("crypto.devicesUpdated", onDevicesUpdated);
      cli.removeListener("deviceVerificationChanged", onDeviceVerificationChanged);
      cli.removeListener("userTrustStatusChanged", onUserTrustStatusChanged);
    };
  }, [cli, userId]);
  return devices;
};

exports.useDevices = useDevices;

const BasicUserInfo = ({
  room,
  member,
  groupId,
  devices,
  isRoomEncrypted
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  const powerLevels = useRoomPowerLevels(cli, room); // Load whether or not we are a Synapse Admin

  const isSynapseAdmin = useIsSynapseAdmin(cli); // Check whether the user is ignored

  const [isIgnored, setIsIgnored] = (0, _react.useState)(cli.isUserIgnored(member.userId)); // Recheck if the user or client changes

  (0, _react.useEffect)(() => {
    setIsIgnored(cli.isUserIgnored(member.userId));
  }, [cli, member.userId]); // Recheck also if we receive new accountData m.ignored_user_list

  const accountDataHandler = (0, _react.useCallback)(ev => {
    if (ev.getType() === "m.ignored_user_list") {
      setIsIgnored(cli.isUserIgnored(member.userId));
    }
  }, [cli, member.userId]);
  (0, _useEventEmitter.useEventEmitter)(cli, "accountData", accountDataHandler); // Count of how many operations are currently in progress, if > 0 then show a Spinner

  const [pendingUpdateCount, setPendingUpdateCount] = (0, _react.useState)(0);
  const startUpdating = (0, _react.useCallback)(() => {
    setPendingUpdateCount(pendingUpdateCount + 1);
  }, [pendingUpdateCount]);
  const stopUpdating = (0, _react.useCallback)(() => {
    setPendingUpdateCount(pendingUpdateCount - 1);
  }, [pendingUpdateCount]);
  const roomPermissions = useRoomPermissions(cli, room, member);
  const onSynapseDeactivate = (0, _react.useCallback)(async () => {
    const QuestionDialog = sdk.getComponent('views.dialogs.QuestionDialog');

    const {
      finished
    } = _Modal.default.createTrackedDialog('Synapse User Deactivation', '', QuestionDialog, {
      title: (0, _languageHandler._t)("Deactivate user?"),
      description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Deactivating this user will log them out and prevent them from logging back in. Additionally, " + "they will leave all the rooms they are in. This action cannot be reversed. Are you sure you " + "want to deactivate this user?")),
      button: (0, _languageHandler._t)("Deactivate user"),
      danger: true
    });

    const [accepted] = await finished;
    if (!accepted) return;

    try {
      await cli.deactivateSynapseUser(member.userId);
    } catch (err) {
      console.error("Failed to deactivate user");
      console.error(err);
      const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

      _Modal.default.createTrackedDialog('Failed to deactivate Synapse user', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Failed to deactivate user'),
        description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
      });
    }
  }, [cli, member.userId]);
  let synapseDeactivateButton;
  let spinner; // We don't need a perfect check here, just something to pass as "probably not our homeserver". If
  // someone does figure out how to bypass this check the worst that happens is an error.
  // FIXME this should be using cli instead of MatrixClientPeg.matrixClient

  if (isSynapseAdmin && member.userId.endsWith(":".concat(_MatrixClientPeg.MatrixClientPeg.getHomeserverName()))) {
    synapseDeactivateButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: onSynapseDeactivate,
      className: "mx_UserInfo_field mx_UserInfo_destructive"
    }, (0, _languageHandler._t)("Deactivate user"));
  }

  let adminToolsContainer;

  if (room && member.roomId) {
    adminToolsContainer = /*#__PURE__*/_react.default.createElement(RoomAdminToolsContainer, {
      powerLevels: powerLevels,
      member: member,
      room: room,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    }, synapseDeactivateButton);
  } else if (groupId) {
    adminToolsContainer = /*#__PURE__*/_react.default.createElement(GroupAdminToolsSection, {
      groupId: groupId,
      groupMember: member,
      startUpdating: startUpdating,
      stopUpdating: stopUpdating
    }, synapseDeactivateButton);
  } else if (synapseDeactivateButton) {
    adminToolsContainer = /*#__PURE__*/_react.default.createElement(GenericAdminToolsContainer, null, synapseDeactivateButton);
  }

  if (pendingUpdateCount > 0) {
    const Loader = sdk.getComponent("elements.Spinner");
    spinner = /*#__PURE__*/_react.default.createElement(Loader, {
      imgClassName: "mx_ContextualMenu_spinner"
    });
  }

  const memberDetails = /*#__PURE__*/_react.default.createElement(PowerLevelSection, {
    powerLevels: powerLevels,
    user: member,
    room: room,
    roomPermissions: roomPermissions
  }); // only display the devices list if our client supports E2E


  const _enableDevices = cli.isCryptoEnabled();

  let text;

  if (!isRoomEncrypted) {
    if (!_enableDevices) {
      text = (0, _languageHandler._t)("This client does not support end-to-end encryption.");
    } else if (room) {
      text = (0, _languageHandler._t)("Messages in this room are not end-to-end encrypted.");
    } else {// TODO what to render for GroupMember
    }
  } else {
    text = (0, _languageHandler._t)("Messages in this room are end-to-end encrypted.");
  }

  let verifyButton;
  const homeserverSupportsCrossSigning = useHomeserverSupportsCrossSigning(cli);
  const userTrust = cli.checkUserTrust(member.userId);
  const userVerified = userTrust.isCrossSigningVerified();
  const isMe = member.userId === cli.getUserId();
  const canVerify = _SettingsStore.default.getValue("feature_cross_signing") && homeserverSupportsCrossSigning && !userVerified && !isMe;

  const setUpdating = updating => {
    setPendingUpdateCount(count => count + (updating ? 1 : -1));
  };

  const hasCrossSigningKeys = useHasCrossSigningKeys(cli, member, canVerify, setUpdating);
  const showDeviceListSpinner = devices === undefined;

  if (canVerify) {
    if (hasCrossSigningKeys !== undefined) {
      // Note: mx_UserInfo_verifyButton is for the end-to-end tests
      verifyButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_UserInfo_field mx_UserInfo_verifyButton",
        onClick: () => {
          if (hasCrossSigningKeys) {
            (0, _verification.verifyUser)(member);
          } else {
            (0, _verification.legacyVerifyUser)(member);
          }
        }
      }, (0, _languageHandler._t)("Verify"));
    } else if (!showDeviceListSpinner) {
      // HACK: only show a spinner if the device section spinner is not shown,
      // to avoid showing a double spinner
      // We should ask for a design that includes all the different loading states here
      const Spinner = sdk.getComponent('elements.Spinner');
      verifyButton = /*#__PURE__*/_react.default.createElement(Spinner, null);
    }
  }

  const securitySection = /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container"
  }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Security")), /*#__PURE__*/_react.default.createElement("p", null, text), verifyButton, /*#__PURE__*/_react.default.createElement(DevicesSection, {
    loading: showDeviceListSpinner,
    devices: devices,
    userId: member.userId
  }));

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, memberDetails && /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container mx_UserInfo_separator mx_UserInfo_memberDetailsContainer"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_memberDetails"
  }, memberDetails)), securitySection, /*#__PURE__*/_react.default.createElement(UserOptionsSection, {
    devices: devices,
    canInvite: roomPermissions.canInvite,
    isIgnored: isIgnored,
    member: member
  }), adminToolsContainer, spinner);
};

const UserInfoHeader = ({
  onClose,
  member,
  e2eStatus
}) => {
  const cli = (0, _react.useContext)(_MatrixClientContext.default);
  let closeButton;

  if (onClose) {
    closeButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_UserInfo_cancel",
      onClick: onClose,
      title: (0, _languageHandler._t)('Close')
    }, /*#__PURE__*/_react.default.createElement("div", null));
  }

  const onMemberAvatarClick = (0, _react.useCallback)(() => {
    const avatarUrl = member.getMxcAvatarUrl ? member.getMxcAvatarUrl() : member.avatarUrl;
    if (!avatarUrl) return;
    const httpUrl = cli.mxcUrlToHttp(avatarUrl);
    const ImageView = sdk.getComponent("elements.ImageView");
    const params = {
      src: httpUrl,
      name: member.name
    };

    _Modal.default.createDialog(ImageView, params, "mx_Dialog_lightbox");
  }, [cli, member]);
  const MemberAvatar = sdk.getComponent('avatars.MemberAvatar');

  const avatarElement = /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_avatar"
  }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(MemberAvatar, {
    key: member.userId // to instantly blank the avatar when UserInfo changes members
    ,
    member: member,
    width: 2 * 0.3 * window.innerHeight // 2x@30vh
    ,
    height: 2 * 0.3 * window.innerHeight // 2x@30vh
    ,
    resizeMethod: "scale",
    fallbackUserId: member.userId,
    onClick: onMemberAvatarClick,
    urls: member.avatarUrl ? [member.avatarUrl] : undefined
  }))));

  let presenceState;
  let presenceLastActiveAgo;
  let presenceCurrentlyActive;
  let statusMessage;

  if (member instanceof _matrixJsSdk.RoomMember && member.user) {
    presenceState = member.user.presence;
    presenceLastActiveAgo = member.user.lastActiveAgo;
    presenceCurrentlyActive = member.user.currentlyActive;

    if (_SettingsStore.default.isFeatureEnabled("feature_custom_status")) {
      statusMessage = member.user._unstable_statusMessage;
    }
  }

  const enablePresenceByHsUrl = _SdkConfig.default.get()["enable_presence_by_hs_url"];

  let showPresence = true;

  if (enablePresenceByHsUrl && enablePresenceByHsUrl[cli.baseUrl] !== undefined) {
    showPresence = enablePresenceByHsUrl[cli.baseUrl];
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
      className: "mx_UserInfo_statusMessage"
    }, statusMessage);
  }

  let e2eIcon;

  if (e2eStatus) {
    e2eIcon = /*#__PURE__*/_react.default.createElement(_E2EIcon.default, {
      size: 18,
      status: e2eStatus,
      isUser: true
    });
  }

  const displayName = member.name || member.displayname;
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, closeButton, avatarElement, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container mx_UserInfo_separator"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_profile"
  }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h2", null, e2eIcon, /*#__PURE__*/_react.default.createElement("span", {
    title: displayName,
    "aria-label": displayName
  }, displayName))), /*#__PURE__*/_react.default.createElement("div", null, member.userId), /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_profileStatus"
  }, presenceLabel, statusLabel))));
};

const UserInfo = (_ref) => {
  let {
    user,
    groupId,
    roomId,
    onClose,
    phase = _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo
  } = _ref,
      props = (0, _objectWithoutProperties2.default)(_ref, ["user", "groupId", "roomId", "onClose", "phase"]);
  const cli = (0, _react.useContext)(_MatrixClientContext.default); // Load room if we are given a room id and memoize it

  const room = (0, _react.useMemo)(() => roomId ? cli.getRoom(roomId) : null, [cli, roomId]); // fetch latest room member if we have a room, so we don't show historical information, falling back to user

  const member = (0, _react.useMemo)(() => room ? room.getMember(user.userId) || user : user, [room, user]);
  const isRoomEncrypted = useIsEncrypted(cli, room);
  const devices = useDevices(user.userId);
  let e2eStatus;

  if (isRoomEncrypted && devices) {
    e2eStatus = getE2EStatus(cli, user.userId, devices);
  }

  const classes = ["mx_UserInfo"];
  let content;

  switch (phase) {
    case _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo:
    case _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberInfo:
      content = /*#__PURE__*/_react.default.createElement(BasicUserInfo, {
        room: room,
        member: member,
        groupId: groupId,
        devices: devices,
        isRoomEncrypted: isRoomEncrypted
      });
      break;

    case _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel:
      classes.push("mx_UserInfo_smallAvatar");
      content = /*#__PURE__*/_react.default.createElement(_EncryptionPanel.default, (0, _extends2.default)({}, props, {
        member: member,
        onClose: onClose,
        isRoomEncrypted: isRoomEncrypted
      }));
      break;
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    className: classes.join(" "),
    role: "tabpanel"
  }, /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
    className: "mx_UserInfo_scrollContainer"
  }, /*#__PURE__*/_react.default.createElement(UserInfoHeader, {
    member: member,
    e2eStatus: e2eStatus,
    onClose: onClose
  }), content));
};

UserInfo.propTypes = {
  user: _propTypes.default.oneOfType([_propTypes.default.instanceOf(_matrixJsSdk.User), _propTypes.default.instanceOf(_matrixJsSdk.RoomMember), GroupMember]).isRequired,
  group: _propTypes.default.instanceOf(_matrixJsSdk.Group),
  groupId: _propTypes.default.string,
  roomId: _propTypes.default.string,
  onClose: _propTypes.default.func
};
var _default = UserInfo;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3JpZ2h0X3BhbmVsL1VzZXJJbmZvLmpzIl0sIm5hbWVzIjpbIl9kaXNhbWJpZ3VhdGVEZXZpY2VzIiwiZGV2aWNlcyIsIm5hbWVzIiwiT2JqZWN0IiwiY3JlYXRlIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJnZXREaXNwbGF5TmFtZSIsImluZGV4TGlzdCIsInB1c2giLCJmb3JFYWNoIiwiaiIsImFtYmlndW91cyIsImdldEUyRVN0YXR1cyIsImNsaSIsInVzZXJJZCIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsImhhc1VudmVyaWZpZWREZXZpY2UiLCJzb21lIiwiZGV2aWNlIiwiaXNVbnZlcmlmaWVkIiwiaXNNZSIsImdldFVzZXJJZCIsInVzZXJUcnVzdCIsImNoZWNrVXNlclRydXN0IiwiaXNDcm9zc1NpZ25pbmdWZXJpZmllZCIsIndhc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkIiwiYW55RGV2aWNlVW52ZXJpZmllZCIsImRldmljZUlkIiwiZGV2aWNlVHJ1c3QiLCJjaGVja0RldmljZVRydXN0IiwiaXNWZXJpZmllZCIsIm9wZW5ETUZvclVzZXIiLCJtYXRyaXhDbGllbnQiLCJkbVJvb21zIiwiRE1Sb29tTWFwIiwic2hhcmVkIiwiZ2V0RE1Sb29tc0ZvclVzZXJJZCIsImxhc3RBY3RpdmVSb29tIiwicmVkdWNlIiwicm9vbUlkIiwicm9vbSIsImdldFJvb20iLCJnZXRNeU1lbWJlcnNoaXAiLCJnZXRMYXN0QWN0aXZlVGltZXN0YW1wIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJyb29tX2lkIiwiY3JlYXRlUm9vbU9wdGlvbnMiLCJkbVVzZXJJZCIsInVzZXJzVG9EZXZpY2VzTWFwIiwiZG93bmxvYWRLZXlzIiwiYWxsSGF2ZURldmljZUtleXMiLCJ2YWx1ZXMiLCJldmVyeSIsImtleXMiLCJlbmNyeXB0aW9uIiwidXNlSXNFbmNyeXB0ZWQiLCJpc0VuY3J5cHRlZCIsInNldElzRW5jcnlwdGVkIiwiaXNSb29tRW5jcnlwdGVkIiwidW5kZWZpbmVkIiwidXBkYXRlIiwiZXZlbnQiLCJnZXRUeXBlIiwiY3VycmVudFN0YXRlIiwidXNlSGFzQ3Jvc3NTaWduaW5nS2V5cyIsIm1lbWJlciIsImNhblZlcmlmeSIsInNldFVwZGF0aW5nIiwieHNpIiwiZ2V0U3RvcmVkQ3Jvc3NTaWduaW5nRm9yVXNlciIsImtleSIsImdldElkIiwiRGV2aWNlSXRlbSIsIk1hdHJpeENsaWVudENvbnRleHQiLCJjbGFzc2VzIiwibXhfVXNlckluZm9fZGV2aWNlX3ZlcmlmaWVkIiwibXhfVXNlckluZm9fZGV2aWNlX3VudmVyaWZpZWQiLCJpY29uQ2xhc3NlcyIsIm14X0UyRUljb25fbm9ybWFsIiwibXhfRTJFSWNvbl92ZXJpZmllZCIsIm14X0UyRUljb25fd2FybmluZyIsIm9uRGV2aWNlQ2xpY2siLCJnZXRVc2VyIiwiZGV2aWNlTmFtZSIsInRydXN0ZWRMYWJlbCIsIkRldmljZXNTZWN0aW9uIiwibG9hZGluZyIsIlNwaW5uZXIiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJpc0V4cGFuZGVkIiwic2V0RXhwYW5kZWQiLCJkZXZpY2VUcnVzdHMiLCJtYXAiLCJkIiwiZXhwYW5kU2VjdGlvbkRldmljZXMiLCJ1bnZlcmlmaWVkRGV2aWNlcyIsImV4cGFuZENvdW50Q2FwdGlvbiIsImV4cGFuZEhpZGVDYXB0aW9uIiwiZXhwYW5kSWNvbkNsYXNzZXMiLCJjb3VudCIsImV4cGFuZEJ1dHRvbiIsImRldmljZUxpc3QiLCJrZXlTdGFydCIsImNvbmNhdCIsIlVzZXJPcHRpb25zU2VjdGlvbiIsImlzSWdub3JlZCIsImNhbkludml0ZSIsImlnbm9yZUJ1dHRvbiIsImluc2VydFBpbGxCdXR0b24iLCJpbnZpdGVVc2VyQnV0dG9uIiwicmVhZFJlY2VpcHRCdXR0b24iLCJvblNoYXJlVXNlckNsaWNrIiwiU2hhcmVEaWFsb2ciLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0YXJnZXQiLCJvbklnbm9yZVRvZ2dsZSIsImlnbm9yZWRVc2VycyIsImdldElnbm9yZWRVc2VycyIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInNldElnbm9yZWRVc2VycyIsIm14X1VzZXJJbmZvX2Rlc3RydWN0aXZlIiwib25SZWFkUmVjZWlwdEJ1dHRvbiIsImhpZ2hsaWdodGVkIiwiZXZlbnRfaWQiLCJnZXRFdmVudFJlYWRVcFRvIiwib25JbnNlcnRQaWxsQnV0dG9uIiwidXNlcl9pZCIsIm1lbWJlcnNoaXAiLCJSb29tVmlld1N0b3JlIiwiZ2V0Um9vbUlkIiwib25JbnZpdGVVc2VyQnV0dG9uIiwiaW52aXRlciIsIk11bHRpSW52aXRlciIsImludml0ZSIsInRoZW4iLCJnZXRDb21wbGV0aW9uU3RhdGUiLCJFcnJvciIsImdldEVycm9yVGV4dCIsImVyciIsIkVycm9yRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm1lc3NhZ2UiLCJzaGFyZVVzZXJCdXR0b24iLCJkaXJlY3RNZXNzYWdlQnV0dG9uIiwiX3dhcm5TZWxmRGVtb3RlIiwiUXVlc3Rpb25EaWFsb2ciLCJmaW5pc2hlZCIsImJ1dHRvbiIsImNvbmZpcm1lZCIsIkdlbmVyaWNBZG1pblRvb2xzQ29udGFpbmVyIiwiY2hpbGRyZW4iLCJfaXNNdXRlZCIsInBvd2VyTGV2ZWxDb250ZW50IiwibGV2ZWxUb1NlbmQiLCJldmVudHMiLCJldmVudHNfZGVmYXVsdCIsInBvd2VyTGV2ZWwiLCJ1c2VSb29tUG93ZXJMZXZlbHMiLCJwb3dlckxldmVscyIsInNldFBvd2VyTGV2ZWxzIiwiZ2V0U3RhdGVFdmVudHMiLCJnZXRDb250ZW50IiwiUm9vbUtpY2tCdXR0b24iLCJzdGFydFVwZGF0aW5nIiwic3RvcFVwZGF0aW5nIiwib25LaWNrIiwiQ29uZmlybVVzZXJBY3Rpb25EaWFsb2ciLCJhc2tSZWFzb24iLCJkYW5nZXIiLCJwcm9jZWVkIiwicmVhc29uIiwia2ljayIsImNvbnNvbGUiLCJsb2ciLCJlcnJvciIsImZpbmFsbHkiLCJraWNrTGFiZWwiLCJSZWRhY3RNZXNzYWdlc0J1dHRvbiIsIm9uUmVkYWN0QWxsTWVzc2FnZXMiLCJ0aW1lbGluZSIsImdldExpdmVUaW1lbGluZSIsImV2ZW50c1RvUmVkYWN0IiwiZ2V0RXZlbnRzIiwiZ2V0U2VuZGVyIiwiaXNSZWRhY3RlZCIsImlzUmVkYWN0aW9uIiwiZ2V0TmVpZ2hib3VyaW5nVGltZWxpbmUiLCJFdmVudFRpbWVsaW5lIiwiQkFDS1dBUkRTIiwidXNlciIsIkluZm9EaWFsb2ciLCJQcm9taXNlIiwicmVzb2x2ZSIsImluZm8iLCJhbGwiLCJyZWRhY3RFdmVudCIsIkJhblRvZ2dsZUJ1dHRvbiIsIm9uQmFuT3JVbmJhbiIsInByb21pc2UiLCJ1bmJhbiIsImJhbiIsImxhYmVsIiwiTXV0ZVRvZ2dsZUJ1dHRvbiIsImlzTXV0ZWQiLCJvbk11dGVUb2dnbGUiLCJlIiwicG93ZXJMZXZlbEV2ZW50IiwibGV2ZWwiLCJwYXJzZUludCIsImlzTmFOIiwic2V0UG93ZXJMZXZlbCIsIm11dGVMYWJlbCIsIlJvb21BZG1pblRvb2xzQ29udGFpbmVyIiwia2lja0J1dHRvbiIsImJhbkJ1dHRvbiIsIm11dGVCdXR0b24iLCJyZWRhY3RCdXR0b24iLCJlZGl0UG93ZXJMZXZlbCIsInN0YXRlX2RlZmF1bHQiLCJtZSIsImdldE1lbWJlciIsImNhbkFmZmVjdFVzZXIiLCJyZWRhY3QiLCJHcm91cEFkbWluVG9vbHNTZWN0aW9uIiwiZ3JvdXBJZCIsImdyb3VwTWVtYmVyIiwiaXNQcml2aWxlZ2VkIiwic2V0SXNQcml2aWxlZ2VkIiwiaXNJbnZpdGVkIiwic2V0SXNJbnZpdGVkIiwidW5tb3VudGVkIiwib25Hcm91cFN0b3JlVXBkYXRlZCIsIkdyb3VwU3RvcmUiLCJpc1VzZXJQcml2aWxlZ2VkIiwiZ2V0R3JvdXBJbnZpdGVkTWVtYmVycyIsIm0iLCJyZWdpc3Rlckxpc3RlbmVyIiwidW5yZWdpc3Rlckxpc3RlbmVyIiwiX29uS2ljayIsImNyZWF0ZURpYWxvZyIsInJlbW92ZVVzZXJGcm9tR3JvdXAiLCJBY3Rpb24iLCJWaWV3VXNlciIsImNhdGNoIiwiR3JvdXBNZW1iZXIiLCJQcm9wVHlwZXMiLCJzaGFwZSIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJkaXNwbGF5bmFtZSIsImF2YXRhclVybCIsInVzZUlzU3luYXBzZUFkbWluIiwiaXNBZG1pbiIsInNldElzQWRtaW4iLCJpc1N5bmFwc2VBZG1pbmlzdHJhdG9yIiwidXNlSG9tZXNlcnZlclN1cHBvcnRzQ3Jvc3NTaWduaW5nIiwiZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUiLCJ1c2VSb29tUGVybWlzc2lvbnMiLCJyb29tUGVybWlzc2lvbnMiLCJzZXRSb29tUGVybWlzc2lvbnMiLCJtb2RpZnlMZXZlbE1heCIsImNhbkVkaXQiLCJ1cGRhdGVSb29tUGVybWlzc2lvbnMiLCJ0aGVtIiwibWF4aW1hbFBvd2VyTGV2ZWwiLCJQb3dlckxldmVsU2VjdGlvbiIsImlzRWRpdGluZyIsInNldEVkaXRpbmciLCJJY29uQnV0dG9uIiwicG93ZXJMZXZlbFVzZXJzRGVmYXVsdCIsInVzZXJzX2RlZmF1bHQiLCJtb2RpZnlCdXR0b24iLCJyb2xlIiwicm9vbU5hbWUiLCJzdHJvbmciLCJQb3dlckxldmVsRWRpdG9yIiwib25GaW5pc2hlZCIsImlzVXBkYXRpbmciLCJzZXRJc1VwZGF0aW5nIiwic2VsZWN0ZWRQb3dlckxldmVsIiwic2V0U2VsZWN0ZWRQb3dlckxldmVsIiwiaXNEaXJ0eSIsInNldElzRGlydHkiLCJvblBvd2VyQ2hhbmdlIiwiY2hhbmdlUG93ZXJMZXZlbCIsIl9hcHBseVBvd2VyQ2hhbmdlIiwidXNlcnMiLCJteVVzZXJJZCIsIm15UG93ZXIiLCJidXR0b25PclNwaW5uZXIiLCJQb3dlclNlbGVjdG9yIiwidXNlRGV2aWNlcyIsInNldERldmljZXMiLCJjYW5jZWxsZWQiLCJfZG93bmxvYWREZXZpY2VMaXN0IiwiZ2V0U3RvcmVkRGV2aWNlc0ZvclVzZXIiLCJjYW5jZWwiLCJ1cGRhdGVEZXZpY2VzIiwibmV3RGV2aWNlcyIsIm9uRGV2aWNlc1VwZGF0ZWQiLCJpbmNsdWRlcyIsIm9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCIsIl91c2VySWQiLCJvblVzZXJUcnVzdFN0YXR1c0NoYW5nZWQiLCJ0cnVzdFN0YXR1cyIsIm9uIiwicmVtb3ZlTGlzdGVuZXIiLCJCYXNpY1VzZXJJbmZvIiwiaXNTeW5hcHNlQWRtaW4iLCJzZXRJc0lnbm9yZWQiLCJpc1VzZXJJZ25vcmVkIiwiYWNjb3VudERhdGFIYW5kbGVyIiwiZXYiLCJwZW5kaW5nVXBkYXRlQ291bnQiLCJzZXRQZW5kaW5nVXBkYXRlQ291bnQiLCJvblN5bmFwc2VEZWFjdGl2YXRlIiwiYWNjZXB0ZWQiLCJkZWFjdGl2YXRlU3luYXBzZVVzZXIiLCJzeW5hcHNlRGVhY3RpdmF0ZUJ1dHRvbiIsInNwaW5uZXIiLCJlbmRzV2l0aCIsIk1hdHJpeENsaWVudFBlZyIsImdldEhvbWVzZXJ2ZXJOYW1lIiwiYWRtaW5Ub29sc0NvbnRhaW5lciIsIkxvYWRlciIsIm1lbWJlckRldGFpbHMiLCJfZW5hYmxlRGV2aWNlcyIsImlzQ3J5cHRvRW5hYmxlZCIsInRleHQiLCJ2ZXJpZnlCdXR0b24iLCJob21lc2VydmVyU3VwcG9ydHNDcm9zc1NpZ25pbmciLCJ1c2VyVmVyaWZpZWQiLCJ1cGRhdGluZyIsImhhc0Nyb3NzU2lnbmluZ0tleXMiLCJzaG93RGV2aWNlTGlzdFNwaW5uZXIiLCJzZWN1cml0eVNlY3Rpb24iLCJVc2VySW5mb0hlYWRlciIsIm9uQ2xvc2UiLCJlMmVTdGF0dXMiLCJjbG9zZUJ1dHRvbiIsIm9uTWVtYmVyQXZhdGFyQ2xpY2siLCJnZXRNeGNBdmF0YXJVcmwiLCJodHRwVXJsIiwibXhjVXJsVG9IdHRwIiwiSW1hZ2VWaWV3IiwicGFyYW1zIiwic3JjIiwiTWVtYmVyQXZhdGFyIiwiYXZhdGFyRWxlbWVudCIsIndpbmRvdyIsImlubmVySGVpZ2h0IiwicHJlc2VuY2VTdGF0ZSIsInByZXNlbmNlTGFzdEFjdGl2ZUFnbyIsInByZXNlbmNlQ3VycmVudGx5QWN0aXZlIiwic3RhdHVzTWVzc2FnZSIsIlJvb21NZW1iZXIiLCJwcmVzZW5jZSIsImxhc3RBY3RpdmVBZ28iLCJjdXJyZW50bHlBY3RpdmUiLCJpc0ZlYXR1cmVFbmFibGVkIiwiX3Vuc3RhYmxlX3N0YXR1c01lc3NhZ2UiLCJlbmFibGVQcmVzZW5jZUJ5SHNVcmwiLCJTZGtDb25maWciLCJnZXQiLCJzaG93UHJlc2VuY2UiLCJiYXNlVXJsIiwicHJlc2VuY2VMYWJlbCIsIlByZXNlbmNlTGFiZWwiLCJzdGF0dXNMYWJlbCIsImUyZUljb24iLCJkaXNwbGF5TmFtZSIsIlVzZXJJbmZvIiwicGhhc2UiLCJSSUdIVF9QQU5FTF9QSEFTRVMiLCJSb29tTWVtYmVySW5mbyIsInByb3BzIiwiY29udGVudCIsIkdyb3VwTWVtYmVySW5mbyIsIkVuY3J5cHRpb25QYW5lbCIsImpvaW4iLCJwcm9wVHlwZXMiLCJvbmVPZlR5cGUiLCJpbnN0YW5jZU9mIiwiVXNlciIsImdyb3VwIiwiR3JvdXAiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBOUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnREEsTUFBTUEsb0JBQW9CLEdBQUlDLE9BQUQsSUFBYTtBQUN0QyxRQUFNQyxLQUFLLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLElBQWQsQ0FBZDs7QUFDQSxPQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdKLE9BQU8sQ0FBQ0ssTUFBNUIsRUFBb0NELENBQUMsRUFBckMsRUFBeUM7QUFDckMsVUFBTUUsSUFBSSxHQUFHTixPQUFPLENBQUNJLENBQUQsQ0FBUCxDQUFXRyxjQUFYLEVBQWI7QUFDQSxVQUFNQyxTQUFT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QW9CLENBQ3RCeEksbUJBQVV5SSxVQUFWLENBQXFCQyxpQkFBckIsQ0FEc0IsRUFFdEIxSSxtQkFBVXlJLFVBQVYsQ0FBcUIzQix1QkFBckIsQ0FGc0IsRUFHdEIvRyxXQUhzQixDQUFwQixFQUlISSxVQUxjO0FBTWpCd0ksRUFBQUEsS0FBSyxFQUFFM0ksbUJBQVV5SSxVQUFWLENBQXFCRyxrQkFBckIsQ0FOVTtBQU9qQmpLLEVBQUFBLE9BQU8sRUFBRXFCLG1CQUFVRSxNQVBGO0FBUWpCdk4sRUFBQUEsTUFBTSxFQUFFcU4sbUJBQVVFLE1BUkQ7QUFVakIwRixFQUFBQSxPQUFPLEVBQUU1RixtQkFBVTZJO0FBVkYsQ0FBckI7ZUFhZWYsUSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcsIDIwMTggVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VDYWxsYmFjaywgdXNlTWVtbywgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ29udGV4dH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IHtHcm91cCwgUm9vbU1lbWJlciwgVXNlcn0gZnJvbSAnbWF0cml4LWpzLXNkayc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBjcmVhdGVSb29tIGZyb20gJy4uLy4uLy4uL2NyZWF0ZVJvb20nO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi8uLi8uLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgU2RrQ29uZmlnIGZyb20gJy4uLy4uLy4uL1Nka0NvbmZpZyc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IHtFdmVudFRpbWVsaW5lfSBmcm9tIFwibWF0cml4LWpzLXNka1wiO1xuaW1wb3J0IEF1dG9IaWRlU2Nyb2xsYmFyIGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL0F1dG9IaWRlU2Nyb2xsYmFyXCI7XG5pbXBvcnQgUm9vbVZpZXdTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc3RvcmVzL1Jvb21WaWV3U3RvcmVcIjtcbmltcG9ydCBNdWx0aUludml0ZXIgZnJvbSBcIi4uLy4uLy4uL3V0aWxzL011bHRpSW52aXRlclwiO1xuaW1wb3J0IEdyb3VwU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3N0b3Jlcy9Hcm91cFN0b3JlXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IEUyRUljb24gZnJvbSBcIi4uL3Jvb21zL0UyRUljb25cIjtcbmltcG9ydCB7dXNlRXZlbnRFbWl0dGVyfSBmcm9tIFwiLi4vLi4vLi4vaG9va3MvdXNlRXZlbnRFbWl0dGVyXCI7XG5pbXBvcnQge3RleHR1YWxQb3dlckxldmVsfSBmcm9tICcuLi8uLi8uLi9Sb2xlcyc7XG5pbXBvcnQgTWF0cml4Q2xpZW50Q29udGV4dCBmcm9tIFwiLi4vLi4vLi4vY29udGV4dHMvTWF0cml4Q2xpZW50Q29udGV4dFwiO1xuaW1wb3J0IHtSSUdIVF9QQU5FTF9QSEFTRVN9IGZyb20gXCIuLi8uLi8uLi9zdG9yZXMvUmlnaHRQYW5lbFN0b3JlUGhhc2VzXCI7XG5pbXBvcnQgRW5jcnlwdGlvblBhbmVsIGZyb20gXCIuL0VuY3J5cHRpb25QYW5lbFwiO1xuaW1wb3J0IHsgdXNlQXN5bmNNZW1vIH0gZnJvbSAnLi4vLi4vLi4vaG9va3MvdXNlQXN5bmNNZW1vJztcbmltcG9ydCB7IHZlcmlmeVVzZXIsIGxlZ2FjeVZlcmlmeVVzZXIsIHZlcmlmeURldmljZSB9IGZyb20gJy4uLy4uLy4uL3ZlcmlmaWNhdGlvbic7XG5pbXBvcnQge0FjdGlvbn0gZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvYWN0aW9uc1wiO1xuXG5jb25zdCBfZGlzYW1iaWd1YXRlRGV2aWNlcyA9IChkZXZpY2VzKSA9PiB7XG4gICAgY29uc3QgbmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGV2aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBuYW1lID0gZGV2aWNlc1tpXS5nZXREaXNwbGF5TmFtZSgpO1xuICAgICAgICBjb25zdCBpbmRleExpc3QgPSBuYW1lc1tuYW1lXSB8fCBbXTtcbiAgICAgICAgaW5kZXhMaXN0LnB1c2goaSk7XG4gICAgICAgIG5hbWVzW25hbWVdID0gaW5kZXhMaXN0O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gbmFtZXMpIHtcbiAgICAgICAgaWYgKG5hbWVzW25hbWVdLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIG5hbWVzW25hbWVdLmZvckVhY2goKGopPT57XG4gICAgICAgICAgICAgICAgZGV2aWNlc1tqXS5hbWJpZ3VvdXMgPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0RTJFU3RhdHVzID0gKGNsaSwgdXNlcklkLCBkZXZpY2VzKSA9PiB7XG4gICAgaWYgKCFTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiZmVhdHVyZV9jcm9zc19zaWduaW5nXCIpKSB7XG4gICAgICAgIGNvbnN0IGhhc1VudmVyaWZpZWREZXZpY2UgPSBkZXZpY2VzLnNvbWUoKGRldmljZSkgPT4gZGV2aWNlLmlzVW52ZXJpZmllZCgpKTtcbiAgICAgICAgcmV0dXJuIGhhc1VudmVyaWZpZWREZXZpY2UgPyBcIndhcm5pbmdcIiA6IFwidmVyaWZpZWRcIjtcbiAgICB9XG4gICAgY29uc3QgaXNNZSA9IHVzZXJJZCA9PT0gY2xpLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IHVzZXJUcnVzdCA9IGNsaS5jaGVja1VzZXJUcnVzdCh1c2VySWQpO1xuICAgIGlmICghdXNlclRydXN0LmlzQ3Jvc3NTaWduaW5nVmVyaWZpZWQoKSkge1xuICAgICAgICByZXR1cm4gdXNlclRydXN0Lndhc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkKCkgPyBcIndhcm5pbmdcIiA6IFwibm9ybWFsXCI7XG4gICAgfVxuXG4gICAgY29uc3QgYW55RGV2aWNlVW52ZXJpZmllZCA9IGRldmljZXMuc29tZShkZXZpY2UgPT4ge1xuICAgICAgICBjb25zdCB7IGRldmljZUlkIH0gPSBkZXZpY2U7XG4gICAgICAgIC8vIEZvciB5b3VyIG93biBkZXZpY2VzLCB3ZSB1c2UgdGhlIHN0cmljdGVyIGNoZWNrIG9mIGNyb3NzLXNpZ25pbmdcbiAgICAgICAgLy8gdmVyaWZpY2F0aW9uIHRvIGVuY291cmFnZSBldmVyeW9uZSB0byB0cnVzdCB0aGVpciBvd24gZGV2aWNlcyB2aWFcbiAgICAgICAgLy8gY3Jvc3Mtc2lnbmluZyBzbyB0aGF0IG90aGVyIHVzZXJzIGNhbiB0aGVuIHNhZmVseSB0cnVzdCB5b3UuXG4gICAgICAgIC8vIEZvciBvdGhlciBwZW9wbGUncyBkZXZpY2VzLCB0aGUgbW9yZSBnZW5lcmFsIHZlcmlmaWVkIGNoZWNrIHRoYXRcbiAgICAgICAgLy8gaW5jbHVkZXMgbG9jYWxseSB2ZXJpZmllZCBkZXZpY2VzIGNhbiBiZSB1c2VkLlxuICAgICAgICBjb25zdCBkZXZpY2VUcnVzdCA9IGNsaS5jaGVja0RldmljZVRydXN0KHVzZXJJZCwgZGV2aWNlSWQpO1xuICAgICAgICByZXR1cm4gaXNNZSA/ICFkZXZpY2VUcnVzdC5pc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkKCkgOiAhZGV2aWNlVHJ1c3QuaXNWZXJpZmllZCgpO1xuICAgIH0pO1xuICAgIHJldHVybiBhbnlEZXZpY2VVbnZlcmlmaWVkID8gXCJ3YXJuaW5nXCIgOiBcInZlcmlmaWVkXCI7XG59O1xuXG5hc3luYyBmdW5jdGlvbiBvcGVuRE1Gb3JVc2VyKG1hdHJpeENsaWVudCwgdXNlcklkKSB7XG4gICAgY29uc3QgZG1Sb29tcyA9IERNUm9vbU1hcC5zaGFyZWQoKS5nZXRETVJvb21zRm9yVXNlcklkKHVzZXJJZCk7XG4gICAgY29uc3QgbGFzdEFjdGl2ZVJvb20gPSBkbVJvb21zLnJlZHVjZSgobGFzdEFjdGl2ZVJvb20sIHJvb21JZCkgPT4ge1xuICAgICAgICBjb25zdCByb29tID0gbWF0cml4Q2xpZW50LmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tIHx8IHJvb20uZ2V0TXlNZW1iZXJzaGlwKCkgPT09IFwibGVhdmVcIikge1xuICAgICAgICAgICAgcmV0dXJuIGxhc3RBY3RpdmVSb29tO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbGFzdEFjdGl2ZVJvb20gfHwgbGFzdEFjdGl2ZVJvb20uZ2V0TGFzdEFjdGl2ZVRpbWVzdGFtcCgpIDwgcm9vbS5nZXRMYXN0QWN0aXZlVGltZXN0YW1wKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByb29tO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsYXN0QWN0aXZlUm9vbTtcbiAgICB9LCBudWxsKTtcblxuICAgIGlmIChsYXN0QWN0aXZlUm9vbSkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgIHJvb21faWQ6IGxhc3RBY3RpdmVSb29tLnJvb21JZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjcmVhdGVSb29tT3B0aW9ucyA9IHtcbiAgICAgICAgZG1Vc2VySWQ6IHVzZXJJZCxcbiAgICB9O1xuXG4gICAgaWYgKFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpIHtcbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBhbGwgdXNlcnMgaGF2ZSB1cGxvYWRlZCBkZXZpY2Uga2V5cyBiZWZvcmUuXG4gICAgICAgIC8vIElmIHNvLCBlbmFibGUgZW5jcnlwdGlvbiBpbiB0aGUgbmV3IHJvb20uXG4gICAgICAgIGNvbnN0IHVzZXJzVG9EZXZpY2VzTWFwID0gYXdhaXQgbWF0cml4Q2xpZW50LmRvd25sb2FkS2V5cyhbdXNlcklkXSk7XG4gICAgICAgIGNvbnN0IGFsbEhhdmVEZXZpY2VLZXlzID0gT2JqZWN0LnZhbHVlcyh1c2Vyc1RvRGV2aWNlc01hcCkuZXZlcnkoZGV2aWNlcyA9PiB7XG4gICAgICAgICAgICAvLyBgZGV2aWNlc2AgaXMgYW4gb2JqZWN0IG9mIHRoZSBmb3JtIHsgZGV2aWNlSWQ6IGRldmljZUluZm8sIC4uLiB9LlxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGRldmljZXMpLmxlbmd0aCA+IDA7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYWxsSGF2ZURldmljZUtleXMpIHtcbiAgICAgICAgICAgIGNyZWF0ZVJvb21PcHRpb25zLmVuY3J5cHRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlUm9vbShjcmVhdGVSb29tT3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIHVzZUlzRW5jcnlwdGVkKGNsaSwgcm9vbSkge1xuICAgIGNvbnN0IFtpc0VuY3J5cHRlZCwgc2V0SXNFbmNyeXB0ZWRdID0gdXNlU3RhdGUocm9vbSA/IGNsaS5pc1Jvb21FbmNyeXB0ZWQocm9vbS5yb29tSWQpIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IHVwZGF0ZSA9IHVzZUNhbGxiYWNrKChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuZ2V0VHlwZSgpID09PSBcIm0ucm9vbS5lbmNyeXB0aW9uXCIpIHtcbiAgICAgICAgICAgIHNldElzRW5jcnlwdGVkKGNsaS5pc1Jvb21FbmNyeXB0ZWQocm9vbS5yb29tSWQpKTtcbiAgICAgICAgfVxuICAgIH0sIFtjbGksIHJvb21dKTtcbiAgICB1c2VFdmVudEVtaXR0ZXIocm9vbSA/IHJvb20uY3VycmVudFN0YXRlIDogdW5kZWZpbmVkLCBcIlJvb21TdGF0ZS5ldmVudHNcIiwgdXBkYXRlKTtcbiAgICByZXR1cm4gaXNFbmNyeXB0ZWQ7XG59XG5cbmZ1bmN0aW9uIHVzZUhhc0Nyb3NzU2lnbmluZ0tleXMoY2xpLCBtZW1iZXIsIGNhblZlcmlmeSwgc2V0VXBkYXRpbmcpIHtcbiAgICByZXR1cm4gdXNlQXN5bmNNZW1vKGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFjYW5WZXJpZnkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VXBkYXRpbmcodHJ1ZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBjbGkuZG93bmxvYWRLZXlzKFttZW1iZXIudXNlcklkXSk7XG4gICAgICAgICAgICBjb25zdCB4c2kgPSBjbGkuZ2V0U3RvcmVkQ3Jvc3NTaWduaW5nRm9yVXNlcihtZW1iZXIudXNlcklkKTtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHhzaSAmJiB4c2kuZ2V0SWQoKTtcbiAgICAgICAgICAgIHJldHVybiAhIWtleTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNldFVwZGF0aW5nKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0sIFtjbGksIG1lbWJlciwgY2FuVmVyaWZ5XSwgdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gRGV2aWNlSXRlbSh7dXNlcklkLCBkZXZpY2V9KSB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcbiAgICBjb25zdCBpc01lID0gdXNlcklkID09PSBjbGkuZ2V0VXNlcklkKCk7XG4gICAgY29uc3QgZGV2aWNlVHJ1c3QgPSBjbGkuY2hlY2tEZXZpY2VUcnVzdCh1c2VySWQsIGRldmljZS5kZXZpY2VJZCk7XG4gICAgY29uc3QgdXNlclRydXN0ID0gY2xpLmNoZWNrVXNlclRydXN0KHVzZXJJZCk7XG4gICAgLy8gRm9yIHlvdXIgb3duIGRldmljZXMsIHdlIHVzZSB0aGUgc3RyaWN0ZXIgY2hlY2sgb2YgY3Jvc3Mtc2lnbmluZ1xuICAgIC8vIHZlcmlmaWNhdGlvbiB0byBlbmNvdXJhZ2UgZXZlcnlvbmUgdG8gdHJ1c3QgdGhlaXIgb3duIGRldmljZXMgdmlhXG4gICAgLy8gY3Jvc3Mtc2lnbmluZyBzbyB0aGF0IG90aGVyIHVzZXJzIGNhbiB0aGVuIHNhZmVseSB0cnVzdCB5b3UuXG4gICAgLy8gRm9yIG90aGVyIHBlb3BsZSdzIGRldmljZXMsIHRoZSBtb3JlIGdlbmVyYWwgdmVyaWZpZWQgY2hlY2sgdGhhdFxuICAgIC8vIGluY2x1ZGVzIGxvY2FsbHkgdmVyaWZpZWQgZGV2aWNlcyBjYW4gYmUgdXNlZC5cbiAgICBjb25zdCBpc1ZlcmlmaWVkID0gKGlzTWUgJiYgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSkgP1xuICAgICAgICBkZXZpY2VUcnVzdC5pc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkKCkgOlxuICAgICAgICBkZXZpY2VUcnVzdC5pc1ZlcmlmaWVkKCk7XG5cbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X1VzZXJJbmZvX2RldmljZVwiLCB7XG4gICAgICAgIG14X1VzZXJJbmZvX2RldmljZV92ZXJpZmllZDogaXNWZXJpZmllZCxcbiAgICAgICAgbXhfVXNlckluZm9fZGV2aWNlX3VudmVyaWZpZWQ6ICFpc1ZlcmlmaWVkLFxuICAgIH0pO1xuICAgIGNvbnN0IGljb25DbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X0UyRUljb25cIiwge1xuICAgICAgICBteF9FMkVJY29uX25vcm1hbDogIXVzZXJUcnVzdC5pc1ZlcmlmaWVkKCksXG4gICAgICAgIG14X0UyRUljb25fdmVyaWZpZWQ6IGlzVmVyaWZpZWQsXG4gICAgICAgIG14X0UyRUljb25fd2FybmluZzogdXNlclRydXN0LmlzVmVyaWZpZWQoKSAmJiAhaXNWZXJpZmllZCxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9uRGV2aWNlQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHZlcmlmeURldmljZShjbGkuZ2V0VXNlcih1c2VySWQpLCBkZXZpY2UpO1xuICAgIH07XG5cbiAgICBjb25zdCBkZXZpY2VOYW1lID0gZGV2aWNlLmFtYmlndW91cyA/XG4gICAgICAgICAgICAoZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgPyBkZXZpY2UuZ2V0RGlzcGxheU5hbWUoKSA6IFwiXCIpICsgXCIgKFwiICsgZGV2aWNlLmRldmljZUlkICsgXCIpXCIgOlxuICAgICAgICAgICAgZGV2aWNlLmdldERpc3BsYXlOYW1lKCk7XG4gICAgbGV0IHRydXN0ZWRMYWJlbCA9IG51bGw7XG4gICAgaWYgKHVzZXJUcnVzdC5pc1ZlcmlmaWVkKCkpIHRydXN0ZWRMYWJlbCA9IGlzVmVyaWZpZWQgPyBfdChcIlRydXN0ZWRcIikgOiBfdChcIk5vdCB0cnVzdGVkXCIpO1xuXG5cbiAgICBpZiAoaXNWZXJpZmllZCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9IHRpdGxlPXtkZXZpY2UuZGV2aWNlSWR9ID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17aWNvbkNsYXNzZXN9IC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19kZXZpY2VfbmFtZVwiPntkZXZpY2VOYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZGV2aWNlX3RydXN0ZWRcIj57dHJ1c3RlZExhYmVsfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtkZXZpY2UuZGV2aWNlSWR9XG4gICAgICAgICAgICAgICAgb25DbGljaz17b25EZXZpY2VDbGlja31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17aWNvbkNsYXNzZXN9IC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19kZXZpY2VfbmFtZVwiPntkZXZpY2VOYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZGV2aWNlX3RydXN0ZWRcIj57dHJ1c3RlZExhYmVsfTwvZGl2PlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gRGV2aWNlc1NlY3Rpb24oe2RldmljZXMsIHVzZXJJZCwgbG9hZGluZ30pIHtcbiAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcbiAgICBjb25zdCB1c2VyVHJ1c3QgPSBjbGkuY2hlY2tVc2VyVHJ1c3QodXNlcklkKTtcblxuICAgIGNvbnN0IFtpc0V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICBpZiAobG9hZGluZykge1xuICAgICAgICAvLyBzdGlsbCBsb2FkaW5nXG4gICAgICAgIHJldHVybiA8U3Bpbm5lciAvPjtcbiAgICB9XG4gICAgaWYgKGRldmljZXMgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIF90KFwiVW5hYmxlIHRvIGxvYWQgc2Vzc2lvbiBsaXN0XCIpO1xuICAgIH1cbiAgICBjb25zdCBpc01lID0gdXNlcklkID09PSBjbGkuZ2V0VXNlcklkKCk7XG4gICAgY29uc3QgZGV2aWNlVHJ1c3RzID0gZGV2aWNlcy5tYXAoZCA9PiBjbGkuY2hlY2tEZXZpY2VUcnVzdCh1c2VySWQsIGQuZGV2aWNlSWQpKTtcblxuICAgIGxldCBleHBhbmRTZWN0aW9uRGV2aWNlcyA9IFtdO1xuICAgIGNvbnN0IHVudmVyaWZpZWREZXZpY2VzID0gW107XG5cbiAgICBsZXQgZXhwYW5kQ291bnRDYXB0aW9uO1xuICAgIGxldCBleHBhbmRIaWRlQ2FwdGlvbjtcbiAgICBsZXQgZXhwYW5kSWNvbkNsYXNzZXMgPSBcIm14X0UyRUljb25cIjtcblxuICAgIGlmICh1c2VyVHJ1c3QuaXNWZXJpZmllZCgpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGV2aWNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgZGV2aWNlID0gZGV2aWNlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGRldmljZVRydXN0ID0gZGV2aWNlVHJ1c3RzW2ldO1xuICAgICAgICAgICAgLy8gRm9yIHlvdXIgb3duIGRldmljZXMsIHdlIHVzZSB0aGUgc3RyaWN0ZXIgY2hlY2sgb2YgY3Jvc3Mtc2lnbmluZ1xuICAgICAgICAgICAgLy8gdmVyaWZpY2F0aW9uIHRvIGVuY291cmFnZSBldmVyeW9uZSB0byB0cnVzdCB0aGVpciBvd24gZGV2aWNlcyB2aWFcbiAgICAgICAgICAgIC8vIGNyb3NzLXNpZ25pbmcgc28gdGhhdCBvdGhlciB1c2VycyBjYW4gdGhlbiBzYWZlbHkgdHJ1c3QgeW91LlxuICAgICAgICAgICAgLy8gRm9yIG90aGVyIHBlb3BsZSdzIGRldmljZXMsIHRoZSBtb3JlIGdlbmVyYWwgdmVyaWZpZWQgY2hlY2sgdGhhdFxuICAgICAgICAgICAgLy8gaW5jbHVkZXMgbG9jYWxseSB2ZXJpZmllZCBkZXZpY2VzIGNhbiBiZSB1c2VkLlxuICAgICAgICAgICAgY29uc3QgaXNWZXJpZmllZCA9IChpc01lICYmIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpID9cbiAgICAgICAgICAgICAgICBkZXZpY2VUcnVzdC5pc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkKCkgOlxuICAgICAgICAgICAgICAgIGRldmljZVRydXN0LmlzVmVyaWZpZWQoKTtcblxuICAgICAgICAgICAgaWYgKGlzVmVyaWZpZWQpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRTZWN0aW9uRGV2aWNlcy5wdXNoKGRldmljZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVudmVyaWZpZWREZXZpY2VzLnB1c2goZGV2aWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBleHBhbmRDb3VudENhcHRpb24gPSBfdChcIiUoY291bnQpcyB2ZXJpZmllZCBzZXNzaW9uc1wiLCB7Y291bnQ6IGV4cGFuZFNlY3Rpb25EZXZpY2VzLmxlbmd0aH0pO1xuICAgICAgICBleHBhbmRIaWRlQ2FwdGlvbiA9IF90KFwiSGlkZSB2ZXJpZmllZCBzZXNzaW9uc1wiKTtcbiAgICAgICAgZXhwYW5kSWNvbkNsYXNzZXMgKz0gXCIgbXhfRTJFSWNvbl92ZXJpZmllZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGV4cGFuZFNlY3Rpb25EZXZpY2VzID0gZGV2aWNlcztcbiAgICAgICAgZXhwYW5kQ291bnRDYXB0aW9uID0gX3QoXCIlKGNvdW50KXMgc2Vzc2lvbnNcIiwge2NvdW50OiBkZXZpY2VzLmxlbmd0aH0pO1xuICAgICAgICBleHBhbmRIaWRlQ2FwdGlvbiA9IF90KFwiSGlkZSBzZXNzaW9uc1wiKTtcbiAgICAgICAgZXhwYW5kSWNvbkNsYXNzZXMgKz0gXCIgbXhfRTJFSWNvbl9ub3JtYWxcIjtcbiAgICB9XG5cbiAgICBsZXQgZXhwYW5kQnV0dG9uO1xuICAgIGlmIChleHBhbmRTZWN0aW9uRGV2aWNlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICAgIGV4cGFuZEJ1dHRvbiA9ICg8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19leHBhbmQgbXhfbGlua0J1dHRvblwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoZmFsc2UpfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXY+e2V4cGFuZEhpZGVDYXB0aW9ufTwvZGl2PlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBhbmRCdXR0b24gPSAoPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZXhwYW5kIG14X2xpbmtCdXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEV4cGFuZGVkKHRydWUpfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtleHBhbmRJY29uQ2xhc3Nlc30gLz5cbiAgICAgICAgICAgICAgICA8ZGl2PntleHBhbmRDb3VudENhcHRpb259PC9kaXY+XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxldCBkZXZpY2VMaXN0ID0gdW52ZXJpZmllZERldmljZXMubWFwKChkZXZpY2UsIGkpID0+IHtcbiAgICAgICAgcmV0dXJuICg8RGV2aWNlSXRlbSBrZXk9e2l9IHVzZXJJZD17dXNlcklkfSBkZXZpY2U9e2RldmljZX0gLz4pO1xuICAgIH0pO1xuICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICAgIGNvbnN0IGtleVN0YXJ0ID0gdW52ZXJpZmllZERldmljZXMubGVuZ3RoO1xuICAgICAgICBkZXZpY2VMaXN0ID0gZGV2aWNlTGlzdC5jb25jYXQoZXhwYW5kU2VjdGlvbkRldmljZXMubWFwKChkZXZpY2UsIGkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoPERldmljZUl0ZW0ga2V5PXtpICsga2V5U3RhcnR9IHVzZXJJZD17dXNlcklkfSBkZXZpY2U9e2RldmljZX0gLz4pO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19kZXZpY2VzXCI+XG4gICAgICAgICAgICA8ZGl2PntkZXZpY2VMaXN0fTwvZGl2PlxuICAgICAgICAgICAgPGRpdj57ZXhwYW5kQnV0dG9ufTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5jb25zdCBVc2VyT3B0aW9uc1NlY3Rpb24gPSAoe21lbWJlciwgaXNJZ25vcmVkLCBjYW5JbnZpdGUsIGRldmljZXN9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIGxldCBpZ25vcmVCdXR0b24gPSBudWxsO1xuICAgIGxldCBpbnNlcnRQaWxsQnV0dG9uID0gbnVsbDtcbiAgICBsZXQgaW52aXRlVXNlckJ1dHRvbiA9IG51bGw7XG4gICAgbGV0IHJlYWRSZWNlaXB0QnV0dG9uID0gbnVsbDtcblxuICAgIGNvbnN0IGlzTWUgPSBtZW1iZXIudXNlcklkID09PSBjbGkuZ2V0VXNlcklkKCk7XG5cbiAgICBjb25zdCBvblNoYXJlVXNlckNsaWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBTaGFyZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlNoYXJlRGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdzaGFyZSByb29tIG1lbWJlciBkaWFsb2cnLCAnJywgU2hhcmVEaWFsb2csIHtcbiAgICAgICAgICAgIHRhcmdldDogbWVtYmVyLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gT25seSBhbGxvdyB0aGUgdXNlciB0byBpZ25vcmUgdGhlIHVzZXIgaWYgaXRzIG5vdCBvdXJzZWx2ZXNcbiAgICAvLyBzYW1lIGdvZXMgZm9yIGp1bXBpbmcgdG8gcmVhZCByZWNlaXB0XG4gICAgaWYgKCFpc01lKSB7XG4gICAgICAgIGNvbnN0IG9uSWdub3JlVG9nZ2xlID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaWdub3JlZFVzZXJzID0gY2xpLmdldElnbm9yZWRVc2VycygpO1xuICAgICAgICAgICAgaWYgKGlzSWdub3JlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaWdub3JlZFVzZXJzLmluZGV4T2YobWVtYmVyLnVzZXJJZCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgaWdub3JlZFVzZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZWRVc2Vycy5wdXNoKG1lbWJlci51c2VySWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjbGkuc2V0SWdub3JlZFVzZXJzKGlnbm9yZWRVc2Vycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWdub3JlQnV0dG9uID0gKFxuICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17b25JZ25vcmVUb2dnbGV9IGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcIm14X1VzZXJJbmZvX2ZpZWxkXCIsIHtteF9Vc2VySW5mb19kZXN0cnVjdGl2ZTogIWlzSWdub3JlZH0pfT5cbiAgICAgICAgICAgICAgICB7IGlzSWdub3JlZCA/IF90KFwiVW5pZ25vcmVcIikgOiBfdChcIklnbm9yZVwiKSB9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKG1lbWJlci5yb29tSWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uUmVhZFJlY2VpcHRCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20obWVtYmVyLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50X2lkOiByb29tLmdldEV2ZW50UmVhZFVwVG8obWVtYmVyLnVzZXJJZCksXG4gICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IG1lbWJlci5yb29tSWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBvbkluc2VydFBpbGxCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdpbnNlcnRfbWVudGlvbicsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6IG1lbWJlci51c2VySWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZWFkUmVjZWlwdEJ1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXtvblJlYWRSZWNlaXB0QnV0dG9ufSBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdKdW1wIHRvIHJlYWQgcmVjZWlwdCcpIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpbnNlcnRQaWxsQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e29uSW5zZXJ0UGlsbEJ1dHRvbn0gY2xhc3NOYW1lPXtcIm14X1VzZXJJbmZvX2ZpZWxkXCJ9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdNZW50aW9uJykgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FuSW52aXRlICYmICghbWVtYmVyIHx8ICFtZW1iZXIubWVtYmVyc2hpcCB8fCBtZW1iZXIubWVtYmVyc2hpcCA9PT0gJ2xlYXZlJykpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb21JZCA9IG1lbWJlciAmJiBtZW1iZXIucm9vbUlkID8gbWVtYmVyLnJvb21JZCA6IFJvb21WaWV3U3RvcmUuZ2V0Um9vbUlkKCk7XG4gICAgICAgICAgICBjb25zdCBvbkludml0ZVVzZXJCdXR0b24gPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgdXNlIGEgTXVsdGlJbnZpdGVyIHRvIHJlLXVzZSB0aGUgaW52aXRlIGxvZ2ljLCBldmVuIHRob3VnaFxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBvbmx5IGludml0aW5nIG9uZSB1c2VyLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnZpdGVyID0gbmV3IE11bHRpSW52aXRlcihyb29tSWQpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbnZpdGVyLmludml0ZShbbWVtYmVyLnVzZXJJZF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludml0ZXIuZ2V0Q29tcGxldGlvblN0YXRlKG1lbWJlci51c2VySWQpICE9PSBcImludml0ZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihpbnZpdGVyLmdldEVycm9yVGV4dChtZW1iZXIudXNlcklkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGludml0ZScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdGYWlsZWQgdG8gaW52aXRlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpbnZpdGVVc2VyQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e29uSW52aXRlVXNlckJ1dHRvbn0gY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnSW52aXRlJykgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzaGFyZVVzZXJCdXR0b24gPSAoXG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e29uU2hhcmVVc2VyQ2xpY2t9IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2ZpZWxkXCI+XG4gICAgICAgICAgICB7IF90KCdTaGFyZSBMaW5rIHRvIFVzZXInKSB9XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICApO1xuXG4gICAgbGV0IGRpcmVjdE1lc3NhZ2VCdXR0b247XG4gICAgaWYgKCFpc01lKSB7XG4gICAgICAgIGRpcmVjdE1lc3NhZ2VCdXR0b24gPSAoXG4gICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBvcGVuRE1Gb3JVc2VyKGNsaSwgbWVtYmVyLnVzZXJJZCl9IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2ZpZWxkXCI+XG4gICAgICAgICAgICAgICAgeyBfdCgnRGlyZWN0IG1lc3NhZ2UnKSB9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxoMz57IF90KFwiT3B0aW9uc1wiKSB9PC9oMz5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgeyBkaXJlY3RNZXNzYWdlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHJlYWRSZWNlaXB0QnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IHNoYXJlVXNlckJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgeyBpbnNlcnRQaWxsQnV0dG9uIH1cbiAgICAgICAgICAgICAgICB7IGludml0ZVVzZXJCdXR0b24gfVxuICAgICAgICAgICAgICAgIHsgaWdub3JlQnV0dG9uIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufTtcblxuY29uc3QgX3dhcm5TZWxmRGVtb3RlID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG4gICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0RlbW90aW5nIFNlbGYnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgdGl0bGU6IF90KFwiRGVtb3RlIHlvdXJzZWxmP1wiKSxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHsgX3QoXCJZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byB1bmRvIHRoaXMgY2hhbmdlIGFzIHlvdSBhcmUgZGVtb3RpbmcgeW91cnNlbGYsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJpZiB5b3UgYXJlIHRoZSBsYXN0IHByaXZpbGVnZWQgdXNlciBpbiB0aGUgcm9vbSBpdCB3aWxsIGJlIGltcG9zc2libGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInRvIHJlZ2FpbiBwcml2aWxlZ2VzLlwiKSB9XG4gICAgICAgICAgICA8L2Rpdj4sXG4gICAgICAgIGJ1dHRvbjogX3QoXCJEZW1vdGVcIiksXG4gICAgfSk7XG5cbiAgICBjb25zdCBbY29uZmlybWVkXSA9IGF3YWl0IGZpbmlzaGVkO1xuICAgIHJldHVybiBjb25maXJtZWQ7XG59O1xuXG5jb25zdCBHZW5lcmljQWRtaW5Ub29sc0NvbnRhaW5lciA9ICh7Y2hpbGRyZW59KSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxoMz57IF90KFwiQWRtaW4gVG9vbHNcIikgfTwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICB7IGNoaWxkcmVuIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufTtcblxuY29uc3QgX2lzTXV0ZWQgPSAobWVtYmVyLCBwb3dlckxldmVsQ29udGVudCkgPT4ge1xuICAgIGlmICghcG93ZXJMZXZlbENvbnRlbnQgfHwgIW1lbWJlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3QgbGV2ZWxUb1NlbmQgPSAoXG4gICAgICAgIChwb3dlckxldmVsQ29udGVudC5ldmVudHMgPyBwb3dlckxldmVsQ29udGVudC5ldmVudHNbXCJtLnJvb20ubWVzc2FnZVwiXSA6IG51bGwpIHx8XG4gICAgICAgIHBvd2VyTGV2ZWxDb250ZW50LmV2ZW50c19kZWZhdWx0XG4gICAgKTtcbiAgICByZXR1cm4gbWVtYmVyLnBvd2VyTGV2ZWwgPCBsZXZlbFRvU2VuZDtcbn07XG5cbmNvbnN0IHVzZVJvb21Qb3dlckxldmVscyA9IChjbGksIHJvb20pID0+IHtcbiAgICBjb25zdCBbcG93ZXJMZXZlbHMsIHNldFBvd2VyTGV2ZWxzXSA9IHVzZVN0YXRlKHt9KTtcblxuICAgIGNvbnN0IHVwZGF0ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgc2V0UG93ZXJMZXZlbHMoZXZlbnQuZ2V0Q29udGVudCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFBvd2VyTGV2ZWxzKHt9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgc2V0UG93ZXJMZXZlbHMoe30pO1xuICAgICAgICB9O1xuICAgIH0sIFtyb29tXSk7XG5cbiAgICB1c2VFdmVudEVtaXR0ZXIoY2xpLCBcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHVwZGF0ZSk7XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBzZXRQb3dlckxldmVscyh7fSk7XG4gICAgICAgIH07XG4gICAgfSwgW3VwZGF0ZV0pO1xuICAgIHJldHVybiBwb3dlckxldmVscztcbn07XG5cbmNvbnN0IFJvb21LaWNrQnV0dG9uID0gKHttZW1iZXIsIHN0YXJ0VXBkYXRpbmcsIHN0b3BVcGRhdGluZ30pID0+IHtcbiAgICBjb25zdCBjbGkgPSB1c2VDb250ZXh0KE1hdHJpeENsaWVudENvbnRleHQpO1xuXG4gICAgLy8gY2hlY2sgaWYgdXNlciBjYW4gYmUga2lja2VkL2Rpc2ludml0ZWRcbiAgICBpZiAobWVtYmVyLm1lbWJlcnNoaXAgIT09IFwiaW52aXRlXCIgJiYgbWVtYmVyLm1lbWJlcnNoaXAgIT09IFwiam9pblwiKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IG9uS2ljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgQ29uZmlybVVzZXJBY3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5Db25maXJtVXNlckFjdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXG4gICAgICAgICAgICAnQ29uZmlybSBVc2VyIEFjdGlvbiBEaWFsb2cnLFxuICAgICAgICAgICAgJ29uS2ljaycsXG4gICAgICAgICAgICBDb25maXJtVXNlckFjdGlvbkRpYWxvZyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBtZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIiA/IF90KFwiRGlzaW52aXRlXCIpIDogX3QoXCJLaWNrXCIpLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBtZW1iZXIubWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIiA/IF90KFwiRGlzaW52aXRlIHRoaXMgdXNlcj9cIikgOiBfdChcIktpY2sgdGhpcyB1c2VyP1wiKSxcbiAgICAgICAgICAgICAgICBhc2tSZWFzb246IG1lbWJlci5tZW1iZXJzaGlwID09PSBcImpvaW5cIixcbiAgICAgICAgICAgICAgICBkYW5nZXI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IFtwcm9jZWVkLCByZWFzb25dID0gYXdhaXQgZmluaXNoZWQ7XG4gICAgICAgIGlmICghcHJvY2VlZCkgcmV0dXJuO1xuXG4gICAgICAgIHN0YXJ0VXBkYXRpbmcoKTtcbiAgICAgICAgY2xpLmtpY2sobWVtYmVyLnJvb21JZCwgbWVtYmVyLnVzZXJJZCwgcmVhc29uIHx8IHVuZGVmaW5lZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBOTy1PUDsgcmVseSBvbiB0aGUgbS5yb29tLm1lbWJlciBldmVudCBjb21pbmcgZG93biBlbHNlIHdlIGNvdWxkXG4gICAgICAgICAgICAvLyBnZXQgb3V0IG9mIHN5bmMgaWYgd2UgZm9yY2Ugc2V0U3RhdGUgaGVyZSFcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiS2ljayBzdWNjZXNzXCIpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiS2ljayBlcnJvcjogXCIgKyBlcnIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGtpY2snLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJGYWlsZWQgdG8ga2lja1wiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBcIk9wZXJhdGlvbiBmYWlsZWRcIiksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBzdG9wVXBkYXRpbmcoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGtpY2tMYWJlbCA9IG1lbWJlci5tZW1iZXJzaGlwID09PSBcImludml0ZVwiID8gX3QoXCJEaXNpbnZpdGVcIikgOiBfdChcIktpY2tcIik7XG4gICAgcmV0dXJuIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2ZpZWxkIG14X1VzZXJJbmZvX2Rlc3RydWN0aXZlXCIgb25DbGljaz17b25LaWNrfT5cbiAgICAgICAgeyBraWNrTGFiZWwgfVxuICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG59O1xuXG5jb25zdCBSZWRhY3RNZXNzYWdlc0J1dHRvbiA9ICh7bWVtYmVyfSkgPT4ge1xuICAgIGNvbnN0IGNsaSA9IHVzZUNvbnRleHQoTWF0cml4Q2xpZW50Q29udGV4dCk7XG5cbiAgICBjb25zdCBvblJlZGFjdEFsbE1lc3NhZ2VzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB7cm9vbUlkLCB1c2VySWR9ID0gbWVtYmVyO1xuICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRpbWVsaW5lID0gcm9vbS5nZXRMaXZlVGltZWxpbmUoKTtcbiAgICAgICAgbGV0IGV2ZW50c1RvUmVkYWN0ID0gW107XG4gICAgICAgIHdoaWxlICh0aW1lbGluZSkge1xuICAgICAgICAgICAgZXZlbnRzVG9SZWRhY3QgPSB0aW1lbGluZS5nZXRFdmVudHMoKS5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZ2V0U2VuZGVyKCkgPT09IHVzZXJJZCAmJiAhZXZlbnQuaXNSZWRhY3RlZCgpICYmICFldmVudC5pc1JlZGFjdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuY29uY2F0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGV2ZW50c1RvUmVkYWN0KTtcbiAgICAgICAgICAgIHRpbWVsaW5lID0gdGltZWxpbmUuZ2V0TmVpZ2hib3VyaW5nVGltZWxpbmUoRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY291bnQgPSBldmVudHNUb1JlZGFjdC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHVzZXIgPSBtZW1iZXIubmFtZTtcblxuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IEluZm9EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5JbmZvRGlhbG9nXCIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnTm8gdXNlciBtZXNzYWdlcyBmb3VuZCB0byByZW1vdmUnLCAnJywgSW5mb0RpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIk5vIHJlY2VudCBtZXNzYWdlcyBieSAlKHVzZXIpcyBmb3VuZFwiLCB7dXNlcn0pLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcIlRyeSBzY3JvbGxpbmcgdXAgaW4gdGhlIHRpbWVsaW5lIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IGVhcmxpZXIgb25lcy5cIikgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuXG4gICAgICAgICAgICBjb25zdCB7ZmluaXNoZWR9ID0gTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnUmVtb3ZlIHJlY2VudCBtZXNzYWdlcyBieSB1c2VyJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiUmVtb3ZlIHJlY2VudCBtZXNzYWdlcyBieSAlKHVzZXIpc1wiLCB7dXNlcn0pLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+eyBfdChcIllvdSBhcmUgYWJvdXQgdG8gcmVtb3ZlICUoY291bnQpcyBtZXNzYWdlcyBieSAlKHVzZXIpcy4gVGhpcyBjYW5ub3QgYmUgdW5kb25lLiBEbyB5b3Ugd2lzaCB0byBjb250aW51ZT9cIiwge2NvdW50LCB1c2VyfSkgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPnsgX3QoXCJGb3IgYSBsYXJnZSBhbW91bnQgb2YgbWVzc2FnZXMsIHRoaXMgbWlnaHQgdGFrZSBzb21lIHRpbWUuIFBsZWFzZSBkb24ndCByZWZyZXNoIHlvdXIgY2xpZW50IGluIHRoZSBtZWFudGltZS5cIikgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJSZW1vdmUgJShjb3VudClzIG1lc3NhZ2VzXCIsIHtjb3VudH0pLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IFtjb25maXJtZWRdID0gYXdhaXQgZmluaXNoZWQ7XG4gICAgICAgICAgICBpZiAoIWNvbmZpcm1lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3VibWl0dGluZyBhIGxhcmdlIG51bWJlciBvZiByZWRhY3Rpb25zIGZyZWV6ZXMgdGhlIFVJLFxuICAgICAgICAgICAgLy8gc28gZmlyc3QgeWllbGQgdG8gYWxsb3cgdG8gcmVyZW5kZXIgYWZ0ZXIgY2xvc2luZyB0aGUgZGlhbG9nLlxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgU3RhcnRlZCByZWRhY3RpbmcgcmVjZW50ICR7Y291bnR9IG1lc3NhZ2VzIGZvciAke3VzZXJ9IGluICR7cm9vbUlkfWApO1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZXZlbnRzVG9SZWRhY3QubWFwKGFzeW5jIGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGkucmVkYWN0RXZlbnQocm9vbUlkLCBldmVudC5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9nIGFuZCBzd2FsbG93IGVycm9yc1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IHJlZGFjdFwiLCBldmVudC5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgRmluaXNoZWQgcmVkYWN0aW5nIHJlY2VudCAke2NvdW50fSBtZXNzYWdlcyBmb3IgJHt1c2VyfSBpbiAke3Jvb21JZH1gKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZmllbGQgbXhfVXNlckluZm9fZGVzdHJ1Y3RpdmVcIiBvbkNsaWNrPXtvblJlZGFjdEFsbE1lc3NhZ2VzfT5cbiAgICAgICAgeyBfdChcIlJlbW92ZSByZWNlbnQgbWVzc2FnZXNcIikgfVxuICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG59O1xuXG5jb25zdCBCYW5Ub2dnbGVCdXR0b24gPSAoe21lbWJlciwgc3RhcnRVcGRhdGluZywgc3RvcFVwZGF0aW5nfSkgPT4ge1xuICAgIGNvbnN0IGNsaSA9IHVzZUNvbnRleHQoTWF0cml4Q2xpZW50Q29udGV4dCk7XG5cbiAgICBjb25zdCBvbkJhbk9yVW5iYW4gPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IENvbmZpcm1Vc2VyQWN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQ29uZmlybVVzZXJBY3Rpb25EaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IHtmaW5pc2hlZH0gPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgJ0NvbmZpcm0gVXNlciBBY3Rpb24gRGlhbG9nJyxcbiAgICAgICAgICAgICdvbkJhbk9yVW5iYW4nLFxuICAgICAgICAgICAgQ29uZmlybVVzZXJBY3Rpb25EaWFsb2csXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVtYmVyLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogbWVtYmVyLm1lbWJlcnNoaXAgPT09ICdiYW4nID8gX3QoXCJVbmJhblwiKSA6IF90KFwiQmFuXCIpLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBtZW1iZXIubWVtYmVyc2hpcCA9PT0gJ2JhbicgPyBfdChcIlVuYmFuIHRoaXMgdXNlcj9cIikgOiBfdChcIkJhbiB0aGlzIHVzZXI/XCIpLFxuICAgICAgICAgICAgICAgIGFza1JlYXNvbjogbWVtYmVyLm1lbWJlcnNoaXAgIT09ICdiYW4nLFxuICAgICAgICAgICAgICAgIGRhbmdlcjogbWVtYmVyLm1lbWJlcnNoaXAgIT09ICdiYW4nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBbcHJvY2VlZCwgcmVhc29uXSA9IGF3YWl0IGZpbmlzaGVkO1xuICAgICAgICBpZiAoIXByb2NlZWQpIHJldHVybjtcblxuICAgICAgICBzdGFydFVwZGF0aW5nKCk7XG4gICAgICAgIGxldCBwcm9taXNlO1xuICAgICAgICBpZiAobWVtYmVyLm1lbWJlcnNoaXAgPT09ICdiYW4nKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gY2xpLnVuYmFuKG1lbWJlci5yb29tSWQsIG1lbWJlci51c2VySWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZSA9IGNsaS5iYW4obWVtYmVyLnJvb21JZCwgbWVtYmVyLnVzZXJJZCwgcmVhc29uIHx8IHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIE5PLU9QOyByZWx5IG9uIHRoZSBtLnJvb20ubWVtYmVyIGV2ZW50IGNvbWluZyBkb3duIGVsc2Ugd2UgY291bGRcbiAgICAgICAgICAgIC8vIGdldCBvdXQgb2Ygc3luYyBpZiB3ZSBmb3JjZSBzZXRTdGF0ZSBoZXJlIVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCYW4gc3VjY2Vzc1wiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkJhbiBlcnJvcjogXCIgKyBlcnIpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIGJhbiB1c2VyJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRXJyb3JcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIGJhbiB1c2VyXCIpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgc3RvcFVwZGF0aW5nKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgbGFiZWwgPSBfdChcIkJhblwiKTtcbiAgICBpZiAobWVtYmVyLm1lbWJlcnNoaXAgPT09ICdiYW4nKSB7XG4gICAgICAgIGxhYmVsID0gX3QoXCJVbmJhblwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X1VzZXJJbmZvX2ZpZWxkXCIsIHtcbiAgICAgICAgbXhfVXNlckluZm9fZGVzdHJ1Y3RpdmU6IG1lbWJlci5tZW1iZXJzaGlwICE9PSAnYmFuJyxcbiAgICB9KTtcblxuICAgIHJldHVybiA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e29uQmFuT3JVbmJhbn0+XG4gICAgICAgIHsgbGFiZWwgfVxuICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG59O1xuXG5jb25zdCBNdXRlVG9nZ2xlQnV0dG9uID0gKHttZW1iZXIsIHJvb20sIHBvd2VyTGV2ZWxzLCBzdGFydFVwZGF0aW5nLCBzdG9wVXBkYXRpbmd9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIC8vIERvbid0IHNob3cgdGhlIG11dGUvdW5tdXRlIG9wdGlvbiBpZiB0aGUgdXNlciBpcyBub3QgaW4gdGhlIHJvb21cbiAgICBpZiAobWVtYmVyLm1lbWJlcnNoaXAgIT09IFwiam9pblwiKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGlzTXV0ZWQgPSBfaXNNdXRlZChtZW1iZXIsIHBvd2VyTGV2ZWxzKTtcbiAgICBjb25zdCBvbk11dGVUb2dnbGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IHJvb21JZCA9IG1lbWJlci5yb29tSWQ7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IG1lbWJlci51c2VySWQ7XG5cbiAgICAgICAgLy8gaWYgbXV0aW5nIHNlbGYsIHdhcm4gYXMgaXQgbWF5IGJlIGlycmV2ZXJzaWJsZVxuICAgICAgICBpZiAodGFyZ2V0ID09PSBjbGkuZ2V0VXNlcklkKCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgX3dhcm5TZWxmRGVtb3RlKCkpKSByZXR1cm47XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byB3YXJuIGFib3V0IHNlbGYgZGVtb3Rpb246IFwiLCBlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwb3dlckxldmVsRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgICAgIGlmICghcG93ZXJMZXZlbEV2ZW50KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcG93ZXJMZXZlbHMgPSBwb3dlckxldmVsRXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBjb25zdCBsZXZlbFRvU2VuZCA9IChcbiAgICAgICAgICAgIChwb3dlckxldmVscy5ldmVudHMgPyBwb3dlckxldmVscy5ldmVudHNbXCJtLnJvb20ubWVzc2FnZVwiXSA6IG51bGwpIHx8XG4gICAgICAgICAgICBwb3dlckxldmVscy5ldmVudHNfZGVmYXVsdFxuICAgICAgICApO1xuICAgICAgICBsZXQgbGV2ZWw7XG4gICAgICAgIGlmIChpc011dGVkKSB7IC8vIHVubXV0ZVxuICAgICAgICAgICAgbGV2ZWwgPSBsZXZlbFRvU2VuZDtcbiAgICAgICAgfSBlbHNlIHsgLy8gbXV0ZVxuICAgICAgICAgICAgbGV2ZWwgPSBsZXZlbFRvU2VuZCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgbGV2ZWwgPSBwYXJzZUludChsZXZlbCk7XG5cbiAgICAgICAgaWYgKCFpc05hTihsZXZlbCkpIHtcbiAgICAgICAgICAgIHN0YXJ0VXBkYXRpbmcoKTtcbiAgICAgICAgICAgIGNsaS5zZXRQb3dlckxldmVsKHJvb21JZCwgdGFyZ2V0LCBsZXZlbCwgcG93ZXJMZXZlbEV2ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBOTy1PUDsgcmVseSBvbiB0aGUgbS5yb29tLm1lbWJlciBldmVudCBjb21pbmcgZG93biBlbHNlIHdlIGNvdWxkXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG91dCBvZiBzeW5jIGlmIHdlIGZvcmNlIHNldFN0YXRlIGhlcmUhXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJNdXRlIHRvZ2dsZSBzdWNjZXNzXCIpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk11dGUgZXJyb3I6IFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gbXV0ZSB1c2VyJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJGYWlsZWQgdG8gbXV0ZSB1c2VyXCIpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcFVwZGF0aW5nKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X1VzZXJJbmZvX2ZpZWxkXCIsIHtcbiAgICAgICAgbXhfVXNlckluZm9fZGVzdHJ1Y3RpdmU6ICFpc011dGVkLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbXV0ZUxhYmVsID0gaXNNdXRlZCA/IF90KFwiVW5tdXRlXCIpIDogX3QoXCJNdXRlXCIpO1xuICAgIHJldHVybiA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e29uTXV0ZVRvZ2dsZX0+XG4gICAgICAgIHsgbXV0ZUxhYmVsIH1cbiAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xufTtcblxuY29uc3QgUm9vbUFkbWluVG9vbHNDb250YWluZXIgPSAoe3Jvb20sIGNoaWxkcmVuLCBtZW1iZXIsIHN0YXJ0VXBkYXRpbmcsIHN0b3BVcGRhdGluZywgcG93ZXJMZXZlbHN9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcbiAgICBsZXQga2lja0J1dHRvbjtcbiAgICBsZXQgYmFuQnV0dG9uO1xuICAgIGxldCBtdXRlQnV0dG9uO1xuICAgIGxldCByZWRhY3RCdXR0b247XG5cbiAgICBjb25zdCBlZGl0UG93ZXJMZXZlbCA9IChcbiAgICAgICAgKHBvd2VyTGV2ZWxzLmV2ZW50cyA/IHBvd2VyTGV2ZWxzLmV2ZW50c1tcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIl0gOiBudWxsKSB8fFxuICAgICAgICBwb3dlckxldmVscy5zdGF0ZV9kZWZhdWx0XG4gICAgKTtcblxuICAgIGNvbnN0IG1lID0gcm9vbS5nZXRNZW1iZXIoY2xpLmdldFVzZXJJZCgpKTtcbiAgICBjb25zdCBpc01lID0gbWUudXNlcklkID09PSBtZW1iZXIudXNlcklkO1xuICAgIGNvbnN0IGNhbkFmZmVjdFVzZXIgPSBtZW1iZXIucG93ZXJMZXZlbCA8IG1lLnBvd2VyTGV2ZWwgfHwgaXNNZTtcblxuICAgIGlmIChjYW5BZmZlY3RVc2VyICYmIG1lLnBvd2VyTGV2ZWwgPj0gcG93ZXJMZXZlbHMua2ljaykge1xuICAgICAgICBraWNrQnV0dG9uID0gPFJvb21LaWNrQnV0dG9uIG1lbWJlcj17bWVtYmVyfSBzdGFydFVwZGF0aW5nPXtzdGFydFVwZGF0aW5nfSBzdG9wVXBkYXRpbmc9e3N0b3BVcGRhdGluZ30gLz47XG4gICAgfVxuICAgIGlmIChtZS5wb3dlckxldmVsID49IHBvd2VyTGV2ZWxzLnJlZGFjdCkge1xuICAgICAgICByZWRhY3RCdXR0b24gPSAoXG4gICAgICAgICAgICA8UmVkYWN0TWVzc2FnZXNCdXR0b24gbWVtYmVyPXttZW1iZXJ9IHN0YXJ0VXBkYXRpbmc9e3N0YXJ0VXBkYXRpbmd9IHN0b3BVcGRhdGluZz17c3RvcFVwZGF0aW5nfSAvPlxuICAgICAgICApO1xuICAgIH1cbiAgICBpZiAoY2FuQWZmZWN0VXNlciAmJiBtZS5wb3dlckxldmVsID49IHBvd2VyTGV2ZWxzLmJhbikge1xuICAgICAgICBiYW5CdXR0b24gPSA8QmFuVG9nZ2xlQnV0dG9uIG1lbWJlcj17bWVtYmVyfSBzdGFydFVwZGF0aW5nPXtzdGFydFVwZGF0aW5nfSBzdG9wVXBkYXRpbmc9e3N0b3BVcGRhdGluZ30gLz47XG4gICAgfVxuICAgIGlmIChjYW5BZmZlY3RVc2VyICYmIG1lLnBvd2VyTGV2ZWwgPj0gZWRpdFBvd2VyTGV2ZWwpIHtcbiAgICAgICAgbXV0ZUJ1dHRvbiA9IChcbiAgICAgICAgICAgIDxNdXRlVG9nZ2xlQnV0dG9uXG4gICAgICAgICAgICAgICAgbWVtYmVyPXttZW1iZXJ9XG4gICAgICAgICAgICAgICAgcm9vbT17cm9vbX1cbiAgICAgICAgICAgICAgICBwb3dlckxldmVscz17cG93ZXJMZXZlbHN9XG4gICAgICAgICAgICAgICAgc3RhcnRVcGRhdGluZz17c3RhcnRVcGRhdGluZ31cbiAgICAgICAgICAgICAgICBzdG9wVXBkYXRpbmc9e3N0b3BVcGRhdGluZ31cbiAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGtpY2tCdXR0b24gfHwgYmFuQnV0dG9uIHx8IG11dGVCdXR0b24gfHwgcmVkYWN0QnV0dG9uIHx8IGNoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybiA8R2VuZXJpY0FkbWluVG9vbHNDb250YWluZXI+XG4gICAgICAgICAgICB7IG11dGVCdXR0b24gfVxuICAgICAgICAgICAgeyBraWNrQnV0dG9uIH1cbiAgICAgICAgICAgIHsgYmFuQnV0dG9uIH1cbiAgICAgICAgICAgIHsgcmVkYWN0QnV0dG9uIH1cbiAgICAgICAgICAgIHsgY2hpbGRyZW4gfVxuICAgICAgICA8L0dlbmVyaWNBZG1pblRvb2xzQ29udGFpbmVyPjtcbiAgICB9XG5cbiAgICByZXR1cm4gPGRpdiAvPjtcbn07XG5cbmNvbnN0IEdyb3VwQWRtaW5Ub29sc1NlY3Rpb24gPSAoe2NoaWxkcmVuLCBncm91cElkLCBncm91cE1lbWJlciwgc3RhcnRVcGRhdGluZywgc3RvcFVwZGF0aW5nfSkgPT4ge1xuICAgIGNvbnN0IGNsaSA9IHVzZUNvbnRleHQoTWF0cml4Q2xpZW50Q29udGV4dCk7XG5cbiAgICBjb25zdCBbaXNQcml2aWxlZ2VkLCBzZXRJc1ByaXZpbGVnZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtpc0ludml0ZWQsIHNldElzSW52aXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICAvLyBMaXN0ZW4gdG8gZ3JvdXAgc3RvcmUgY2hhbmdlc1xuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGxldCB1bm1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICBjb25zdCBvbkdyb3VwU3RvcmVVcGRhdGVkID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHVubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgc2V0SXNQcml2aWxlZ2VkKEdyb3VwU3RvcmUuaXNVc2VyUHJpdmlsZWdlZChncm91cElkKSk7XG4gICAgICAgICAgICBzZXRJc0ludml0ZWQoR3JvdXBTdG9yZS5nZXRHcm91cEludml0ZWRNZW1iZXJzKGdyb3VwSWQpLnNvbWUoXG4gICAgICAgICAgICAgICAgKG0pID0+IG0udXNlcklkID09PSBncm91cE1lbWJlci51c2VySWQsXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfTtcblxuICAgICAgICBHcm91cFN0b3JlLnJlZ2lzdGVyTGlzdGVuZXIoZ3JvdXBJZCwgb25Hcm91cFN0b3JlVXBkYXRlZCk7XG4gICAgICAgIG9uR3JvdXBTdG9yZVVwZGF0ZWQoKTtcbiAgICAgICAgLy8gSGFuZGxlIHVubW91bnRcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHVubW91bnRlZCA9IHRydWU7XG4gICAgICAgICAgICBHcm91cFN0b3JlLnVucmVnaXN0ZXJMaXN0ZW5lcihvbkdyb3VwU3RvcmVVcGRhdGVkKTtcbiAgICAgICAgfTtcbiAgICB9LCBbZ3JvdXBJZCwgZ3JvdXBNZW1iZXIudXNlcklkXSk7XG5cbiAgICBpZiAoaXNQcml2aWxlZ2VkKSB7XG4gICAgICAgIGNvbnN0IF9vbktpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBDb25maXJtVXNlckFjdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkNvbmZpcm1Vc2VyQWN0aW9uRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZURpYWxvZyhDb25maXJtVXNlckFjdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudDogY2xpLFxuICAgICAgICAgICAgICAgIGdyb3VwTWVtYmVyLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogaXNJbnZpdGVkID8gX3QoJ0Rpc2ludml0ZScpIDogX3QoJ1JlbW92ZSBmcm9tIGNvbW11bml0eScpLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBpc0ludml0ZWQgPyBfdCgnRGlzaW52aXRlIHRoaXMgdXNlciBmcm9tIGNvbW11bml0eT8nKVxuICAgICAgICAgICAgICAgICAgICA6IF90KCdSZW1vdmUgdGhpcyB1c2VyIGZyb20gY29tbXVuaXR5PycpLFxuICAgICAgICAgICAgICAgIGRhbmdlcjogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBbcHJvY2VlZF0gPSBhd2FpdCBmaW5pc2hlZDtcbiAgICAgICAgICAgIGlmICghcHJvY2VlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBzdGFydFVwZGF0aW5nKCk7XG4gICAgICAgICAgICBjbGkucmVtb3ZlVXNlckZyb21Hcm91cChncm91cElkLCBncm91cE1lbWJlci51c2VySWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0byB0aGUgdXNlciBsaXN0XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICAgICAgICAgIG1lbWJlcjogbnVsbCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gcmVtb3ZlIHVzZXIgZnJvbSBncm91cCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0Vycm9yJyksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpc0ludml0ZWQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgX3QoJ0ZhaWxlZCB0byB3aXRoZHJhdyBpbnZpdGF0aW9uJykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgX3QoJ0ZhaWxlZCB0byByZW1vdmUgdXNlciBmcm9tIGNvbW11bml0eScpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcFVwZGF0aW5nKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBraWNrQnV0dG9uID0gKFxuICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZmllbGQgbXhfVXNlckluZm9fZGVzdHJ1Y3RpdmVcIiBvbkNsaWNrPXtfb25LaWNrfT5cbiAgICAgICAgICAgICAgICB7IGlzSW52aXRlZCA/IF90KCdEaXNpbnZpdGUnKSA6IF90KCdSZW1vdmUgZnJvbSBjb21tdW5pdHknKSB9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gTm8gbWFrZS9yZXZva2UgYWRtaW4gQVBJIHlldFxuICAgICAgICAvKmNvbnN0IG9wTGFiZWwgPSB0aGlzLnN0YXRlLmlzVGFyZ2V0TW9kID8gX3QoXCJSZXZva2UgTW9kZXJhdG9yXCIpIDogX3QoXCJNYWtlIE1vZGVyYXRvclwiKTtcbiAgICAgICAgZ2l2ZU1vZEJ1dHRvbiA9IDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2ZpZWxkXCIgb25DbGljaz17dGhpcy5vbk1vZFRvZ2dsZX0+XG4gICAgICAgICAgICB7Z2l2ZU9wTGFiZWx9XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47Ki9cblxuICAgICAgICByZXR1cm4gPEdlbmVyaWNBZG1pblRvb2xzQ29udGFpbmVyPlxuICAgICAgICAgICAgeyBraWNrQnV0dG9uIH1cbiAgICAgICAgICAgIHsgY2hpbGRyZW4gfVxuICAgICAgICA8L0dlbmVyaWNBZG1pblRvb2xzQ29udGFpbmVyPjtcbiAgICB9XG5cbiAgICByZXR1cm4gPGRpdiAvPjtcbn07XG5cbmNvbnN0IEdyb3VwTWVtYmVyID0gUHJvcFR5cGVzLnNoYXBlKHtcbiAgICB1c2VySWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICBkaXNwbGF5bmFtZTogUHJvcFR5cGVzLnN0cmluZywgLy8gWFhYOiBHcm91cE1lbWJlciBvYmplY3RzIGFyZSBpbmNvbnNpc3RlbnQgOigoXG4gICAgYXZhdGFyVXJsOiBQcm9wVHlwZXMuc3RyaW5nLFxufSk7XG5cbmNvbnN0IHVzZUlzU3luYXBzZUFkbWluID0gKGNsaSkgPT4ge1xuICAgIGNvbnN0IFtpc0FkbWluLCBzZXRJc0FkbWluXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjbGkuaXNTeW5hcHNlQWRtaW5pc3RyYXRvcigpLnRoZW4oKGlzQWRtaW4pID0+IHtcbiAgICAgICAgICAgIHNldElzQWRtaW4oaXNBZG1pbik7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHNldElzQWRtaW4oZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9LCBbY2xpXSk7XG4gICAgcmV0dXJuIGlzQWRtaW47XG59O1xuXG5jb25zdCB1c2VIb21lc2VydmVyU3VwcG9ydHNDcm9zc1NpZ25pbmcgPSAoY2xpKSA9PiB7XG4gICAgcmV0dXJuIHVzZUFzeW5jTWVtbyhhc3luYyAoKSA9PiB7XG4gICAgICAgIHJldHVybiBjbGkuZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUoXCJvcmcubWF0cml4LmUyZV9jcm9zc19zaWduaW5nXCIpO1xuICAgIH0sIFtjbGldLCBmYWxzZSk7XG59O1xuXG5mdW5jdGlvbiB1c2VSb29tUGVybWlzc2lvbnMoY2xpLCByb29tLCB1c2VyKSB7XG4gICAgY29uc3QgW3Jvb21QZXJtaXNzaW9ucywgc2V0Um9vbVBlcm1pc3Npb25zXSA9IHVzZVN0YXRlKHtcbiAgICAgICAgLy8gbW9kaWZ5TGV2ZWxNYXggaXMgdGhlIG1heCBQTCB3ZSBjYW4gc2V0IHRoaXMgdXNlciB0bywgdHlwaWNhbGx5IG1pbih0aGVpciBQTCwgb3VyIFBMKSAmJiBjYW5TZXRQTFxuICAgICAgICBtb2RpZnlMZXZlbE1heDogLTEsXG4gICAgICAgIGNhbkVkaXQ6IGZhbHNlLFxuICAgICAgICBjYW5JbnZpdGU6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnN0IHVwZGF0ZVJvb21QZXJtaXNzaW9ucyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwb3dlckxldmVsRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgICAgIGlmICghcG93ZXJMZXZlbEV2ZW50KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHBvd2VyTGV2ZWxzID0gcG93ZXJMZXZlbEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgaWYgKCFwb3dlckxldmVscykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG1lID0gcm9vbS5nZXRNZW1iZXIoY2xpLmdldFVzZXJJZCgpKTtcbiAgICAgICAgaWYgKCFtZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRoZW0gPSB1c2VyO1xuICAgICAgICBjb25zdCBpc01lID0gbWUudXNlcklkID09PSB0aGVtLnVzZXJJZDtcbiAgICAgICAgY29uc3QgY2FuQWZmZWN0VXNlciA9IHRoZW0ucG93ZXJMZXZlbCA8IG1lLnBvd2VyTGV2ZWwgfHwgaXNNZTtcblxuICAgICAgICBsZXQgbW9kaWZ5TGV2ZWxNYXggPSAtMTtcbiAgICAgICAgaWYgKGNhbkFmZmVjdFVzZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRQb3dlckxldmVsID0gKFxuICAgICAgICAgICAgICAgIChwb3dlckxldmVscy5ldmVudHMgPyBwb3dlckxldmVscy5ldmVudHNbXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCJdIDogbnVsbCkgfHxcbiAgICAgICAgICAgICAgICBwb3dlckxldmVscy5zdGF0ZV9kZWZhdWx0XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKG1lLnBvd2VyTGV2ZWwgPj0gZWRpdFBvd2VyTGV2ZWwgJiYgKGlzTWUgfHwgbWUucG93ZXJMZXZlbCA+IHRoZW0ucG93ZXJMZXZlbCkpIHtcbiAgICAgICAgICAgICAgICBtb2RpZnlMZXZlbE1heCA9IG1lLnBvd2VyTGV2ZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZXRSb29tUGVybWlzc2lvbnMoe1xuICAgICAgICAgICAgY2FuSW52aXRlOiBtZS5wb3dlckxldmVsID49IHBvd2VyTGV2ZWxzLmludml0ZSxcbiAgICAgICAgICAgIGNhbkVkaXQ6IG1vZGlmeUxldmVsTWF4ID49IDAsXG4gICAgICAgICAgICBtb2RpZnlMZXZlbE1heCxcbiAgICAgICAgfSk7XG4gICAgfSwgW2NsaSwgdXNlciwgcm9vbV0pO1xuICAgIHVzZUV2ZW50RW1pdHRlcihjbGksIFwiUm9vbVN0YXRlLm1lbWJlcnNcIiwgdXBkYXRlUm9vbVBlcm1pc3Npb25zKTtcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICB1cGRhdGVSb29tUGVybWlzc2lvbnMoKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHNldFJvb21QZXJtaXNzaW9ucyh7XG4gICAgICAgICAgICAgICAgbWF4aW1hbFBvd2VyTGV2ZWw6IC0xLFxuICAgICAgICAgICAgICAgIGNhbkVkaXQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNhbkludml0ZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9LCBbdXBkYXRlUm9vbVBlcm1pc3Npb25zXSk7XG5cbiAgICByZXR1cm4gcm9vbVBlcm1pc3Npb25zO1xufVxuXG5jb25zdCBQb3dlckxldmVsU2VjdGlvbiA9ICh7dXNlciwgcm9vbSwgcm9vbVBlcm1pc3Npb25zLCBwb3dlckxldmVsc30pID0+IHtcbiAgICBjb25zdCBbaXNFZGl0aW5nLCBzZXRFZGl0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBpZiAocm9vbSAmJiB1c2VyLnJvb21JZCkgeyAvLyBpcyBpbiByb29tXG4gICAgICAgIGlmIChpc0VkaXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiAoPFBvd2VyTGV2ZWxFZGl0b3JcbiAgICAgICAgICAgICAgICB1c2VyPXt1c2VyfSByb29tPXtyb29tfSByb29tUGVybWlzc2lvbnM9e3Jvb21QZXJtaXNzaW9uc31cbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXsoKSA9PiBzZXRFZGl0aW5nKGZhbHNlKX0gLz4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgSWNvbkJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkljb25CdXR0b24nKTtcbiAgICAgICAgICAgIGNvbnN0IHBvd2VyTGV2ZWxVc2Vyc0RlZmF1bHQgPSBwb3dlckxldmVscy51c2Vyc19kZWZhdWx0IHx8IDA7XG4gICAgICAgICAgICBjb25zdCBwb3dlckxldmVsID0gcGFyc2VJbnQodXNlci5wb3dlckxldmVsLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBtb2RpZnlCdXR0b24gPSByb29tUGVybWlzc2lvbnMuY2FuRWRpdCA/XG4gICAgICAgICAgICAgICAgKDxJY29uQnV0dG9uIGljb249XCJlZGl0XCIgb25DbGljaz17KCkgPT4gc2V0RWRpdGluZyh0cnVlKX0gLz4pIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHJvbGUgPSB0ZXh0dWFsUG93ZXJMZXZlbChwb3dlckxldmVsLCBwb3dlckxldmVsVXNlcnNEZWZhdWx0KTtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gX3QoXCI8c3Ryb25nPiUocm9sZSlzPC9zdHJvbmc+IGluICUocm9vbU5hbWUpc1wiLFxuICAgICAgICAgICAgICAgIHtyb2xlLCByb29tTmFtZTogcm9vbS5uYW1lfSxcbiAgICAgICAgICAgICAgICB7c3Ryb25nOiBsYWJlbCA9PiA8c3Ryb25nPntsYWJlbH08L3N0cm9uZz59LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19wcm9maWxlRmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19yb2xlRGVzY3JpcHRpb25cIj57bGFiZWx9e21vZGlmeUJ1dHRvbn08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBQb3dlckxldmVsRWRpdG9yID0gKHt1c2VyLCByb29tLCByb29tUGVybWlzc2lvbnMsIG9uRmluaXNoZWR9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIGNvbnN0IFtpc1VwZGF0aW5nLCBzZXRJc1VwZGF0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbc2VsZWN0ZWRQb3dlckxldmVsLCBzZXRTZWxlY3RlZFBvd2VyTGV2ZWxdID0gdXNlU3RhdGUocGFyc2VJbnQodXNlci5wb3dlckxldmVsLCAxMCkpO1xuICAgIGNvbnN0IFtpc0RpcnR5LCBzZXRJc0RpcnR5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBvblBvd2VyQ2hhbmdlID0gdXNlQ2FsbGJhY2soKHBvd2VyTGV2ZWwpID0+IHtcbiAgICAgICAgc2V0SXNEaXJ0eSh0cnVlKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRQb3dlckxldmVsKHBhcnNlSW50KHBvd2VyTGV2ZWwsIDEwKSk7XG4gICAgfSwgW3NldFNlbGVjdGVkUG93ZXJMZXZlbCwgc2V0SXNEaXJ0eV0pO1xuXG4gICAgY29uc3QgY2hhbmdlUG93ZXJMZXZlbCA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgX2FwcGx5UG93ZXJDaGFuZ2UgPSAocm9vbUlkLCB0YXJnZXQsIHBvd2VyTGV2ZWwsIHBvd2VyTGV2ZWxFdmVudCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNsaS5zZXRQb3dlckxldmVsKHJvb21JZCwgdGFyZ2V0LCBwYXJzZUludChwb3dlckxldmVsKSwgcG93ZXJMZXZlbEV2ZW50KS50aGVuKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOTy1PUDsgcmVseSBvbiB0aGUgbS5yb29tLm1lbWJlciBldmVudCBjb21pbmcgZG93biBlbHNlIHdlIGNvdWxkXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCBvdXQgb2Ygc3luYyBpZiB3ZSBmb3JjZSBzZXRTdGF0ZSBoZXJlIVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvd2VyIGNoYW5nZSBzdWNjZXNzXCIpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGNoYW5nZSBwb3dlciBsZXZlbCBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBjaGFuZ2UgcG93ZXIgbGV2ZWwnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkVycm9yXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRmFpbGVkIHRvIGNoYW5nZSBwb3dlciBsZXZlbFwiKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghaXNEaXJ0eSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SXNVcGRhdGluZyh0cnVlKTtcblxuICAgICAgICAgICAgY29uc3QgcG93ZXJMZXZlbCA9IHNlbGVjdGVkUG93ZXJMZXZlbDtcblxuICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gdXNlci5yb29tSWQ7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB1c2VyLnVzZXJJZDtcblxuICAgICAgICAgICAgY29uc3QgcG93ZXJMZXZlbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpO1xuICAgICAgICAgICAgaWYgKCFwb3dlckxldmVsRXZlbnQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCFwb3dlckxldmVsRXZlbnQuZ2V0Q29udGVudCgpLnVzZXJzKSB7XG4gICAgICAgICAgICAgICAgX2FwcGx5UG93ZXJDaGFuZ2Uocm9vbUlkLCB0YXJnZXQsIHBvd2VyTGV2ZWwsIHBvd2VyTGV2ZWxFdmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBteVVzZXJJZCA9IGNsaS5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgIGNvbnN0IFF1ZXN0aW9uRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuUXVlc3Rpb25EaWFsb2dcIik7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGFyZSBjaGFuZ2luZyBvdXIgb3duIFBMIGl0IGNhbiBvbmx5IGV2ZXIgYmUgZGVjcmVhc2luZywgd2hpY2ggd2UgY2Fubm90IHJldmVyc2UuXG4gICAgICAgICAgICBpZiAobXlVc2VySWQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IF93YXJuU2VsZkRlbW90ZSgpKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byB3YXJuIGFib3V0IHNlbGYgZGVtb3Rpb246IFwiLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgX2FwcGx5UG93ZXJDaGFuZ2Uocm9vbUlkLCB0YXJnZXQsIHBvd2VyTGV2ZWwsIHBvd2VyTGV2ZWxFdmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBteVBvd2VyID0gcG93ZXJMZXZlbEV2ZW50LmdldENvbnRlbnQoKS51c2Vyc1tteVVzZXJJZF07XG4gICAgICAgICAgICBpZiAocGFyc2VJbnQobXlQb3dlcikgPT09IHBhcnNlSW50KHBvd2VyTGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1Byb21vdGUgdG8gUEwxMDAgV2FybmluZycsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJXYXJuaW5nIVwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byB1bmRvIHRoaXMgY2hhbmdlIGFzIHlvdSBhcmUgcHJvbW90aW5nIHRoZSB1c2VyIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0byBoYXZlIHRoZSBzYW1lIHBvd2VyIGxldmVsIGFzIHlvdXJzZWxmLlwiKSB9PGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkFyZSB5b3Ugc3VyZT9cIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgICAgICBidXR0b246IF90KFwiQ29udGludWVcIiksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBbY29uZmlybWVkXSA9IGF3YWl0IGZpbmlzaGVkO1xuICAgICAgICAgICAgICAgIGlmICghY29uZmlybWVkKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBfYXBwbHlQb3dlckNoYW5nZShyb29tSWQsIHRhcmdldCwgcG93ZXJMZXZlbCwgcG93ZXJMZXZlbEV2ZW50KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIG9uRmluaXNoZWQoKTtcbiAgICAgICAgfVxuICAgIH0sIFt1c2VyLnJvb21JZCwgdXNlci51c2VySWQsIGNsaSwgc2VsZWN0ZWRQb3dlckxldmVsLCBpc0RpcnR5LCBzZXRJc1VwZGF0aW5nLCBvbkZpbmlzaGVkLCByb29tXSk7XG5cbiAgICBjb25zdCBwb3dlckxldmVsRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIiwgXCJcIik7XG4gICAgY29uc3QgcG93ZXJMZXZlbFVzZXJzRGVmYXVsdCA9IHBvd2VyTGV2ZWxFdmVudCA/IHBvd2VyTGV2ZWxFdmVudC5nZXRDb250ZW50KCkudXNlcnNfZGVmYXVsdCA6IDA7XG4gICAgY29uc3QgSWNvbkJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkljb25CdXR0b24nKTtcbiAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgY29uc3QgYnV0dG9uT3JTcGlubmVyID0gaXNVcGRhdGluZyA/IDxTcGlubmVyIHc9ezE2fSBoPXsxNn0gLz4gOlxuICAgICAgICA8SWNvbkJ1dHRvbiBpY29uPVwiY2hlY2tcIiBvbkNsaWNrPXtjaGFuZ2VQb3dlckxldmVsfSAvPjtcblxuICAgIGNvbnN0IFBvd2VyU2VsZWN0b3IgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5Qb3dlclNlbGVjdG9yJyk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19wcm9maWxlRmllbGRcIj5cbiAgICAgICAgICAgIDxQb3dlclNlbGVjdG9yXG4gICAgICAgICAgICAgICAgbGFiZWw9e251bGx9XG4gICAgICAgICAgICAgICAgdmFsdWU9e3NlbGVjdGVkUG93ZXJMZXZlbH1cbiAgICAgICAgICAgICAgICBtYXhWYWx1ZT17cm9vbVBlcm1pc3Npb25zLm1vZGlmeUxldmVsTWF4fVxuICAgICAgICAgICAgICAgIHVzZXJzRGVmYXVsdD17cG93ZXJMZXZlbFVzZXJzRGVmYXVsdH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17b25Qb3dlckNoYW5nZX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNVcGRhdGluZ31cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICB7YnV0dG9uT3JTcGlubmVyfVxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufTtcblxuZXhwb3J0IGNvbnN0IHVzZURldmljZXMgPSAodXNlcklkKSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIC8vIHVuZGVmaW5lZCBtZWFucyB5ZXQgdG8gYmUgbG9hZGVkLCBudWxsIG1lYW5zIGZhaWxlZCB0byBsb2FkLCBvdGhlcndpc2UgbGlzdCBvZiBkZXZpY2VzXG4gICAgY29uc3QgW2RldmljZXMsIHNldERldmljZXNdID0gdXNlU3RhdGUodW5kZWZpbmVkKTtcbiAgICAvLyBEb3dubG9hZCBkZXZpY2UgbGlzdHNcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBzZXREZXZpY2VzKHVuZGVmaW5lZCk7XG5cbiAgICAgICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIF9kb3dubG9hZERldmljZUxpc3QoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaS5kb3dubG9hZEtleXMoW3VzZXJJZF0sIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRldmljZXMgPSBjbGkuZ2V0U3RvcmVkRGV2aWNlc0ZvclVzZXIodXNlcklkKTtcblxuICAgICAgICAgICAgICAgIGlmIChjYW5jZWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgZ290IGNhbmNlbGxlZCAtIHByZXN1bWFibHkgYSBkaWZmZXJlbnQgdXNlciBub3dcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF9kaXNhbWJpZ3VhdGVEZXZpY2VzKGRldmljZXMpO1xuICAgICAgICAgICAgICAgIHNldERldmljZXMoZGV2aWNlcyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBzZXREZXZpY2VzKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9kb3dubG9hZERldmljZUxpc3QoKTtcblxuICAgICAgICAvLyBIYW5kbGUgYmVpbmcgdW5tb3VudGVkXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0sIFtjbGksIHVzZXJJZF0pO1xuXG4gICAgLy8gTGlzdGVuIHRvIGNoYW5nZXNcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBsZXQgY2FuY2VsID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHVwZGF0ZURldmljZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdEZXZpY2VzID0gY2xpLmdldFN0b3JlZERldmljZXNGb3JVc2VyKHVzZXJJZCk7XG4gICAgICAgICAgICBpZiAoY2FuY2VsKSByZXR1cm47XG4gICAgICAgICAgICBzZXREZXZpY2VzKG5ld0RldmljZXMpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvbkRldmljZXNVcGRhdGVkID0gKHVzZXJzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXVzZXJzLmluY2x1ZGVzKHVzZXJJZCkpIHJldHVybjtcbiAgICAgICAgICAgIHVwZGF0ZURldmljZXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkID0gKF91c2VySWQsIGRldmljZSkgPT4ge1xuICAgICAgICAgICAgaWYgKF91c2VySWQgIT09IHVzZXJJZCkgcmV0dXJuO1xuICAgICAgICAgICAgdXBkYXRlRGV2aWNlcygpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvblVzZXJUcnVzdFN0YXR1c0NoYW5nZWQgPSAoX3VzZXJJZCwgdHJ1c3RTdGF0dXMpID0+IHtcbiAgICAgICAgICAgIGlmIChfdXNlcklkICE9PSB1c2VySWQpIHJldHVybjtcbiAgICAgICAgICAgIHVwZGF0ZURldmljZXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2xpLm9uKFwiY3J5cHRvLmRldmljZXNVcGRhdGVkXCIsIG9uRGV2aWNlc1VwZGF0ZWQpO1xuICAgICAgICBjbGkub24oXCJkZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkXCIsIG9uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgICAgIGNsaS5vbihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgb25Vc2VyVHJ1c3RTdGF0dXNDaGFuZ2VkKTtcbiAgICAgICAgLy8gSGFuZGxlIGJlaW5nIHVubW91bnRlZFxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY2FuY2VsID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcImNyeXB0by5kZXZpY2VzVXBkYXRlZFwiLCBvbkRldmljZXNVcGRhdGVkKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcImRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWRcIiwgb25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgb25Vc2VyVHJ1c3RTdGF0dXNDaGFuZ2VkKTtcbiAgICAgICAgfTtcbiAgICB9LCBbY2xpLCB1c2VySWRdKTtcblxuICAgIHJldHVybiBkZXZpY2VzO1xufTtcblxuY29uc3QgQmFzaWNVc2VySW5mbyA9ICh7cm9vbSwgbWVtYmVyLCBncm91cElkLCBkZXZpY2VzLCBpc1Jvb21FbmNyeXB0ZWR9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIGNvbnN0IHBvd2VyTGV2ZWxzID0gdXNlUm9vbVBvd2VyTGV2ZWxzKGNsaSwgcm9vbSk7XG4gICAgLy8gTG9hZCB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgYSBTeW5hcHNlIEFkbWluXG4gICAgY29uc3QgaXNTeW5hcHNlQWRtaW4gPSB1c2VJc1N5bmFwc2VBZG1pbihjbGkpO1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgdXNlciBpcyBpZ25vcmVkXG4gICAgY29uc3QgW2lzSWdub3JlZCwgc2V0SXNJZ25vcmVkXSA9IHVzZVN0YXRlKGNsaS5pc1VzZXJJZ25vcmVkKG1lbWJlci51c2VySWQpKTtcbiAgICAvLyBSZWNoZWNrIGlmIHRoZSB1c2VyIG9yIGNsaWVudCBjaGFuZ2VzXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgc2V0SXNJZ25vcmVkKGNsaS5pc1VzZXJJZ25vcmVkKG1lbWJlci51c2VySWQpKTtcbiAgICB9LCBbY2xpLCBtZW1iZXIudXNlcklkXSk7XG4gICAgLy8gUmVjaGVjayBhbHNvIGlmIHdlIHJlY2VpdmUgbmV3IGFjY291bnREYXRhIG0uaWdub3JlZF91c2VyX2xpc3RcbiAgICBjb25zdCBhY2NvdW50RGF0YUhhbmRsZXIgPSB1c2VDYWxsYmFjaygoZXYpID0+IHtcbiAgICAgICAgaWYgKGV2LmdldFR5cGUoKSA9PT0gXCJtLmlnbm9yZWRfdXNlcl9saXN0XCIpIHtcbiAgICAgICAgICAgIHNldElzSWdub3JlZChjbGkuaXNVc2VySWdub3JlZChtZW1iZXIudXNlcklkKSk7XG4gICAgICAgIH1cbiAgICB9LCBbY2xpLCBtZW1iZXIudXNlcklkXSk7XG4gICAgdXNlRXZlbnRFbWl0dGVyKGNsaSwgXCJhY2NvdW50RGF0YVwiLCBhY2NvdW50RGF0YUhhbmRsZXIpO1xuXG4gICAgLy8gQ291bnQgb2YgaG93IG1hbnkgb3BlcmF0aW9ucyBhcmUgY3VycmVudGx5IGluIHByb2dyZXNzLCBpZiA+IDAgdGhlbiBzaG93IGEgU3Bpbm5lclxuICAgIGNvbnN0IFtwZW5kaW5nVXBkYXRlQ291bnQsIHNldFBlbmRpbmdVcGRhdGVDb3VudF0gPSB1c2VTdGF0ZSgwKTtcbiAgICBjb25zdCBzdGFydFVwZGF0aW5nID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBzZXRQZW5kaW5nVXBkYXRlQ291bnQocGVuZGluZ1VwZGF0ZUNvdW50ICsgMSk7XG4gICAgfSwgW3BlbmRpbmdVcGRhdGVDb3VudF0pO1xuICAgIGNvbnN0IHN0b3BVcGRhdGluZyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgc2V0UGVuZGluZ1VwZGF0ZUNvdW50KHBlbmRpbmdVcGRhdGVDb3VudCAtIDEpO1xuICAgIH0sIFtwZW5kaW5nVXBkYXRlQ291bnRdKTtcblxuICAgIGNvbnN0IHJvb21QZXJtaXNzaW9ucyA9IHVzZVJvb21QZXJtaXNzaW9ucyhjbGksIHJvb20sIG1lbWJlcik7XG5cbiAgICBjb25zdCBvblN5bmFwc2VEZWFjdGl2YXRlID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuUXVlc3Rpb25EaWFsb2cnKTtcbiAgICAgICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1N5bmFwc2UgVXNlciBEZWFjdGl2YXRpb24nLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgIHRpdGxlOiBfdChcIkRlYWN0aXZhdGUgdXNlcj9cIiksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICA8ZGl2PnsgX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRGVhY3RpdmF0aW5nIHRoaXMgdXNlciB3aWxsIGxvZyB0aGVtIG91dCBhbmQgcHJldmVudCB0aGVtIGZyb20gbG9nZ2luZyBiYWNrIGluLiBBZGRpdGlvbmFsbHksIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJ0aGV5IHdpbGwgbGVhdmUgYWxsIHRoZSByb29tcyB0aGV5IGFyZSBpbi4gVGhpcyBhY3Rpb24gY2Fubm90IGJlIHJldmVyc2VkLiBBcmUgeW91IHN1cmUgeW91IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJ3YW50IHRvIGRlYWN0aXZhdGUgdGhpcyB1c2VyP1wiLFxuICAgICAgICAgICAgICAgICkgfTwvZGl2PixcbiAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJEZWFjdGl2YXRlIHVzZXJcIiksXG4gICAgICAgICAgICBkYW5nZXI6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IFthY2NlcHRlZF0gPSBhd2FpdCBmaW5pc2hlZDtcbiAgICAgICAgaWYgKCFhY2NlcHRlZCkgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2xpLmRlYWN0aXZhdGVTeW5hcHNlVXNlcihtZW1iZXIudXNlcklkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGRlYWN0aXZhdGUgdXNlclwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcblxuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkVycm9yRGlhbG9nJyk7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gZGVhY3RpdmF0ZSBTeW5hcHNlIHVzZXInLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byBkZWFjdGl2YXRlIHVzZXInKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdChcIk9wZXJhdGlvbiBmYWlsZWRcIikpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCBbY2xpLCBtZW1iZXIudXNlcklkXSk7XG5cbiAgICBsZXQgc3luYXBzZURlYWN0aXZhdGVCdXR0b247XG4gICAgbGV0IHNwaW5uZXI7XG5cbiAgICAvLyBXZSBkb24ndCBuZWVkIGEgcGVyZmVjdCBjaGVjayBoZXJlLCBqdXN0IHNvbWV0aGluZyB0byBwYXNzIGFzIFwicHJvYmFibHkgbm90IG91ciBob21lc2VydmVyXCIuIElmXG4gICAgLy8gc29tZW9uZSBkb2VzIGZpZ3VyZSBvdXQgaG93IHRvIGJ5cGFzcyB0aGlzIGNoZWNrIHRoZSB3b3JzdCB0aGF0IGhhcHBlbnMgaXMgYW4gZXJyb3IuXG4gICAgLy8gRklYTUUgdGhpcyBzaG91bGQgYmUgdXNpbmcgY2xpIGluc3RlYWQgb2YgTWF0cml4Q2xpZW50UGVnLm1hdHJpeENsaWVudFxuICAgIGlmIChpc1N5bmFwc2VBZG1pbiAmJiBtZW1iZXIudXNlcklkLmVuZHNXaXRoKGA6JHtNYXRyaXhDbGllbnRQZWcuZ2V0SG9tZXNlcnZlck5hbWUoKX1gKSkge1xuICAgICAgICBzeW5hcHNlRGVhY3RpdmF0ZUJ1dHRvbiA9IChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e29uU3luYXBzZURlYWN0aXZhdGV9IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2ZpZWxkIG14X1VzZXJJbmZvX2Rlc3RydWN0aXZlXCI+XG4gICAgICAgICAgICAgICAge190KFwiRGVhY3RpdmF0ZSB1c2VyXCIpfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgIH1cblxuICAgIGxldCBhZG1pblRvb2xzQ29udGFpbmVyO1xuICAgIGlmIChyb29tICYmIG1lbWJlci5yb29tSWQpIHtcbiAgICAgICAgYWRtaW5Ub29sc0NvbnRhaW5lciA9IChcbiAgICAgICAgICAgIDxSb29tQWRtaW5Ub29sc0NvbnRhaW5lclxuICAgICAgICAgICAgICAgIHBvd2VyTGV2ZWxzPXtwb3dlckxldmVsc31cbiAgICAgICAgICAgICAgICBtZW1iZXI9e21lbWJlcn1cbiAgICAgICAgICAgICAgICByb29tPXtyb29tfVxuICAgICAgICAgICAgICAgIHN0YXJ0VXBkYXRpbmc9e3N0YXJ0VXBkYXRpbmd9XG4gICAgICAgICAgICAgICAgc3RvcFVwZGF0aW5nPXtzdG9wVXBkYXRpbmd9PlxuICAgICAgICAgICAgICAgIHsgc3luYXBzZURlYWN0aXZhdGVCdXR0b24gfVxuICAgICAgICAgICAgPC9Sb29tQWRtaW5Ub29sc0NvbnRhaW5lcj5cbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgYWRtaW5Ub29sc0NvbnRhaW5lciA9IChcbiAgICAgICAgICAgIDxHcm91cEFkbWluVG9vbHNTZWN0aW9uXG4gICAgICAgICAgICAgICAgZ3JvdXBJZD17Z3JvdXBJZH1cbiAgICAgICAgICAgICAgICBncm91cE1lbWJlcj17bWVtYmVyfVxuICAgICAgICAgICAgICAgIHN0YXJ0VXBkYXRpbmc9e3N0YXJ0VXBkYXRpbmd9XG4gICAgICAgICAgICAgICAgc3RvcFVwZGF0aW5nPXtzdG9wVXBkYXRpbmd9PlxuICAgICAgICAgICAgICAgIHsgc3luYXBzZURlYWN0aXZhdGVCdXR0b24gfVxuICAgICAgICAgICAgPC9Hcm91cEFkbWluVG9vbHNTZWN0aW9uPlxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAoc3luYXBzZURlYWN0aXZhdGVCdXR0b24pIHtcbiAgICAgICAgYWRtaW5Ub29sc0NvbnRhaW5lciA9IChcbiAgICAgICAgICAgIDxHZW5lcmljQWRtaW5Ub29sc0NvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICB7IHN5bmFwc2VEZWFjdGl2YXRlQnV0dG9uIH1cbiAgICAgICAgICAgIDwvR2VuZXJpY0FkbWluVG9vbHNDb250YWluZXI+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHBlbmRpbmdVcGRhdGVDb3VudCA+IDApIHtcbiAgICAgICAgY29uc3QgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgIHNwaW5uZXIgPSA8TG9hZGVyIGltZ0NsYXNzTmFtZT1cIm14X0NvbnRleHR1YWxNZW51X3NwaW5uZXJcIiAvPjtcbiAgICB9XG5cbiAgICBjb25zdCBtZW1iZXJEZXRhaWxzID0gKFxuICAgICAgICA8UG93ZXJMZXZlbFNlY3Rpb25cbiAgICAgICAgICAgIHBvd2VyTGV2ZWxzPXtwb3dlckxldmVsc31cbiAgICAgICAgICAgIHVzZXI9e21lbWJlcn1cbiAgICAgICAgICAgIHJvb209e3Jvb219XG4gICAgICAgICAgICByb29tUGVybWlzc2lvbnM9e3Jvb21QZXJtaXNzaW9uc31cbiAgICAgICAgLz5cbiAgICApO1xuXG4gICAgLy8gb25seSBkaXNwbGF5IHRoZSBkZXZpY2VzIGxpc3QgaWYgb3VyIGNsaWVudCBzdXBwb3J0cyBFMkVcbiAgICBjb25zdCBfZW5hYmxlRGV2aWNlcyA9IGNsaS5pc0NyeXB0b0VuYWJsZWQoKTtcblxuICAgIGxldCB0ZXh0O1xuICAgIGlmICghaXNSb29tRW5jcnlwdGVkKSB7XG4gICAgICAgIGlmICghX2VuYWJsZURldmljZXMpIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIlRoaXMgY2xpZW50IGRvZXMgbm90IHN1cHBvcnQgZW5kLXRvLWVuZCBlbmNyeXB0aW9uLlwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChyb29tKSB7XG4gICAgICAgICAgICB0ZXh0ID0gX3QoXCJNZXNzYWdlcyBpbiB0aGlzIHJvb20gYXJlIG5vdCBlbmQtdG8tZW5kIGVuY3J5cHRlZC5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPIHdoYXQgdG8gcmVuZGVyIGZvciBHcm91cE1lbWJlclxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dCA9IF90KFwiTWVzc2FnZXMgaW4gdGhpcyByb29tIGFyZSBlbmQtdG8tZW5kIGVuY3J5cHRlZC5cIik7XG4gICAgfVxuXG4gICAgbGV0IHZlcmlmeUJ1dHRvbjtcbiAgICBjb25zdCBob21lc2VydmVyU3VwcG9ydHNDcm9zc1NpZ25pbmcgPSB1c2VIb21lc2VydmVyU3VwcG9ydHNDcm9zc1NpZ25pbmcoY2xpKTtcblxuICAgIGNvbnN0IHVzZXJUcnVzdCA9IGNsaS5jaGVja1VzZXJUcnVzdChtZW1iZXIudXNlcklkKTtcbiAgICBjb25zdCB1c2VyVmVyaWZpZWQgPSB1c2VyVHJ1c3QuaXNDcm9zc1NpZ25pbmdWZXJpZmllZCgpO1xuICAgIGNvbnN0IGlzTWUgPSBtZW1iZXIudXNlcklkID09PSBjbGkuZ2V0VXNlcklkKCk7XG4gICAgY29uc3QgY2FuVmVyaWZ5ID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaG9tZXNlcnZlclN1cHBvcnRzQ3Jvc3NTaWduaW5nICYmICF1c2VyVmVyaWZpZWQgJiYgIWlzTWU7XG5cbiAgICBjb25zdCBzZXRVcGRhdGluZyA9ICh1cGRhdGluZykgPT4ge1xuICAgICAgICBzZXRQZW5kaW5nVXBkYXRlQ291bnQoY291bnQgPT4gY291bnQgKyAodXBkYXRpbmcgPyAxIDogLTEpKTtcbiAgICB9O1xuICAgIGNvbnN0IGhhc0Nyb3NzU2lnbmluZ0tleXMgPVxuICAgICAgICB1c2VIYXNDcm9zc1NpZ25pbmdLZXlzKGNsaSwgbWVtYmVyLCBjYW5WZXJpZnksIHNldFVwZGF0aW5nICk7XG5cbiAgICBjb25zdCBzaG93RGV2aWNlTGlzdFNwaW5uZXIgPSBkZXZpY2VzID09PSB1bmRlZmluZWQ7XG4gICAgaWYgKGNhblZlcmlmeSkge1xuICAgICAgICBpZiAoaGFzQ3Jvc3NTaWduaW5nS2V5cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBOb3RlOiBteF9Vc2VySW5mb192ZXJpZnlCdXR0b24gaXMgZm9yIHRoZSBlbmQtdG8tZW5kIHRlc3RzXG4gICAgICAgICAgICB2ZXJpZnlCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfVXNlckluZm9fZmllbGQgbXhfVXNlckluZm9fdmVyaWZ5QnV0dG9uXCIgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzQ3Jvc3NTaWduaW5nS2V5cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZ5VXNlcihtZW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVnYWN5VmVyaWZ5VXNlcihtZW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfX0+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlZlcmlmeVwiKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCFzaG93RGV2aWNlTGlzdFNwaW5uZXIpIHtcbiAgICAgICAgICAgIC8vIEhBQ0s6IG9ubHkgc2hvdyBhIHNwaW5uZXIgaWYgdGhlIGRldmljZSBzZWN0aW9uIHNwaW5uZXIgaXMgbm90IHNob3duLFxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgc2hvd2luZyBhIGRvdWJsZSBzcGlubmVyXG4gICAgICAgICAgICAvLyBXZSBzaG91bGQgYXNrIGZvciBhIGRlc2lnbiB0aGF0IGluY2x1ZGVzIGFsbCB0aGUgZGlmZmVyZW50IGxvYWRpbmcgc3RhdGVzIGhlcmVcbiAgICAgICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcGlubmVyJyk7XG4gICAgICAgICAgICB2ZXJpZnlCdXR0b24gPSA8U3Bpbm5lciAvPjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNlY3VyaXR5U2VjdGlvbiA9IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxoMz57IF90KFwiU2VjdXJpdHlcIikgfTwvaDM+XG4gICAgICAgICAgICA8cD57IHRleHQgfTwvcD5cbiAgICAgICAgICAgIHsgdmVyaWZ5QnV0dG9uIH1cbiAgICAgICAgICAgIDxEZXZpY2VzU2VjdGlvblxuICAgICAgICAgICAgICAgIGxvYWRpbmc9e3Nob3dEZXZpY2VMaXN0U3Bpbm5lcn1cbiAgICAgICAgICAgICAgICBkZXZpY2VzPXtkZXZpY2VzfVxuICAgICAgICAgICAgICAgIHVzZXJJZD17bWVtYmVyLnVzZXJJZH0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcblxuICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgIHsgbWVtYmVyRGV0YWlscyAmJlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2NvbnRhaW5lciBteF9Vc2VySW5mb19zZXBhcmF0b3IgbXhfVXNlckluZm9fbWVtYmVyRGV0YWlsc0NvbnRhaW5lclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19tZW1iZXJEZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgeyBtZW1iZXJEZXRhaWxzIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj4gfVxuXG4gICAgICAgIHsgc2VjdXJpdHlTZWN0aW9uIH1cbiAgICAgICAgPFVzZXJPcHRpb25zU2VjdGlvblxuICAgICAgICAgICAgZGV2aWNlcz17ZGV2aWNlc31cbiAgICAgICAgICAgIGNhbkludml0ZT17cm9vbVBlcm1pc3Npb25zLmNhbkludml0ZX1cbiAgICAgICAgICAgIGlzSWdub3JlZD17aXNJZ25vcmVkfVxuICAgICAgICAgICAgbWVtYmVyPXttZW1iZXJ9IC8+XG5cbiAgICAgICAgeyBhZG1pblRvb2xzQ29udGFpbmVyIH1cblxuICAgICAgICB7IHNwaW5uZXIgfVxuICAgIDwvUmVhY3QuRnJhZ21lbnQ+O1xufTtcblxuY29uc3QgVXNlckluZm9IZWFkZXIgPSAoe29uQ2xvc2UsIG1lbWJlciwgZTJlU3RhdHVzfSkgPT4ge1xuICAgIGNvbnN0IGNsaSA9IHVzZUNvbnRleHQoTWF0cml4Q2xpZW50Q29udGV4dCk7XG5cbiAgICBsZXQgY2xvc2VCdXR0b247XG4gICAgaWYgKG9uQ2xvc2UpIHtcbiAgICAgICAgY2xvc2VCdXR0b24gPSA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19jYW5jZWxcIiBvbkNsaWNrPXtvbkNsb3NlfSB0aXRsZT17X3QoJ0Nsb3NlJyl9PlxuICAgICAgICAgICAgPGRpdiAvPlxuICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgIH1cblxuICAgIGNvbnN0IG9uTWVtYmVyQXZhdGFyQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IGF2YXRhclVybCA9IG1lbWJlci5nZXRNeGNBdmF0YXJVcmwgPyBtZW1iZXIuZ2V0TXhjQXZhdGFyVXJsKCkgOiBtZW1iZXIuYXZhdGFyVXJsO1xuICAgICAgICBpZiAoIWF2YXRhclVybCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGh0dHBVcmwgPSBjbGkubXhjVXJsVG9IdHRwKGF2YXRhclVybCk7XG4gICAgICAgIGNvbnN0IEltYWdlVmlldyA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5JbWFnZVZpZXdcIik7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgICAgIHNyYzogaHR0cFVybCxcbiAgICAgICAgICAgIG5hbWU6IG1lbWJlci5uYW1lLFxuICAgICAgICB9O1xuXG4gICAgICAgIE1vZGFsLmNyZWF0ZURpYWxvZyhJbWFnZVZpZXcsIHBhcmFtcywgXCJteF9EaWFsb2dfbGlnaHRib3hcIik7XG4gICAgfSwgW2NsaSwgbWVtYmVyXSk7XG5cbiAgICBjb25zdCBNZW1iZXJBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLk1lbWJlckF2YXRhcicpO1xuICAgIGNvbnN0IGF2YXRhckVsZW1lbnQgPSAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fYXZhdGFyXCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxNZW1iZXJBdmF0YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17bWVtYmVyLnVzZXJJZH0gLy8gdG8gaW5zdGFudGx5IGJsYW5rIHRoZSBhdmF0YXIgd2hlbiBVc2VySW5mbyBjaGFuZ2VzIG1lbWJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbWJlcj17bWVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9ezIgKiAwLjMgKiB3aW5kb3cuaW5uZXJIZWlnaHR9IC8vIDJ4QDMwdmhcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17MiAqIDAuMyAqIHdpbmRvdy5pbm5lckhlaWdodH0gLy8gMnhAMzB2aFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplTWV0aG9kPVwic2NhbGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2tVc2VySWQ9e21lbWJlci51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbk1lbWJlckF2YXRhckNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgdXJscz17bWVtYmVyLmF2YXRhclVybCA/IFttZW1iZXIuYXZhdGFyVXJsXSA6IHVuZGVmaW5lZH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgbGV0IHByZXNlbmNlU3RhdGU7XG4gICAgbGV0IHByZXNlbmNlTGFzdEFjdGl2ZUFnbztcbiAgICBsZXQgcHJlc2VuY2VDdXJyZW50bHlBY3RpdmU7XG4gICAgbGV0IHN0YXR1c01lc3NhZ2U7XG5cbiAgICBpZiAobWVtYmVyIGluc3RhbmNlb2YgUm9vbU1lbWJlciAmJiBtZW1iZXIudXNlcikge1xuICAgICAgICBwcmVzZW5jZVN0YXRlID0gbWVtYmVyLnVzZXIucHJlc2VuY2U7XG4gICAgICAgIHByZXNlbmNlTGFzdEFjdGl2ZUFnbyA9IG1lbWJlci51c2VyLmxhc3RBY3RpdmVBZ287XG4gICAgICAgIHByZXNlbmNlQ3VycmVudGx5QWN0aXZlID0gbWVtYmVyLnVzZXIuY3VycmVudGx5QWN0aXZlO1xuXG4gICAgICAgIGlmIChTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZUVuYWJsZWQoXCJmZWF0dXJlX2N1c3RvbV9zdGF0dXNcIikpIHtcbiAgICAgICAgICAgIHN0YXR1c01lc3NhZ2UgPSBtZW1iZXIudXNlci5fdW5zdGFibGVfc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGVuYWJsZVByZXNlbmNlQnlIc1VybCA9IFNka0NvbmZpZy5nZXQoKVtcImVuYWJsZV9wcmVzZW5jZV9ieV9oc191cmxcIl07XG4gICAgbGV0IHNob3dQcmVzZW5jZSA9IHRydWU7XG4gICAgaWYgKGVuYWJsZVByZXNlbmNlQnlIc1VybCAmJiBlbmFibGVQcmVzZW5jZUJ5SHNVcmxbY2xpLmJhc2VVcmxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2hvd1ByZXNlbmNlID0gZW5hYmxlUHJlc2VuY2VCeUhzVXJsW2NsaS5iYXNlVXJsXTtcbiAgICB9XG5cbiAgICBsZXQgcHJlc2VuY2VMYWJlbCA9IG51bGw7XG4gICAgaWYgKHNob3dQcmVzZW5jZSkge1xuICAgICAgICBjb25zdCBQcmVzZW5jZUxhYmVsID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuUHJlc2VuY2VMYWJlbCcpO1xuICAgICAgICBwcmVzZW5jZUxhYmVsID0gPFByZXNlbmNlTGFiZWwgYWN0aXZlQWdvPXtwcmVzZW5jZUxhc3RBY3RpdmVBZ299XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50bHlBY3RpdmU9e3ByZXNlbmNlQ3VycmVudGx5QWN0aXZlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VuY2VTdGF0ZT17cHJlc2VuY2VTdGF0ZX0gLz47XG4gICAgfVxuXG4gICAgbGV0IHN0YXR1c0xhYmVsID0gbnVsbDtcbiAgICBpZiAoc3RhdHVzTWVzc2FnZSkge1xuICAgICAgICBzdGF0dXNMYWJlbCA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3N0YXR1c01lc3NhZ2VcIj57IHN0YXR1c01lc3NhZ2UgfTwvc3Bhbj47XG4gICAgfVxuXG4gICAgbGV0IGUyZUljb247XG4gICAgaWYgKGUyZVN0YXR1cykge1xuICAgICAgICBlMmVJY29uID0gPEUyRUljb24gc2l6ZT17MTh9IHN0YXR1cz17ZTJlU3RhdHVzfSBpc1VzZXI9e3RydWV9IC8+O1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gbWVtYmVyLm5hbWUgfHwgbWVtYmVyLmRpc3BsYXluYW1lO1xuICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgIHsgY2xvc2VCdXR0b24gfVxuICAgICAgICB7IGF2YXRhckVsZW1lbnQgfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fY29udGFpbmVyIG14X1VzZXJJbmZvX3NlcGFyYXRvclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19wcm9maWxlXCI+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGgyPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBlMmVJY29uIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHRpdGxlPXtkaXNwbGF5TmFtZX0gYXJpYS1sYWJlbD17ZGlzcGxheU5hbWV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZGlzcGxheU5hbWUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+eyBtZW1iZXIudXNlcklkIH08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3Byb2ZpbGVTdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAge3ByZXNlbmNlTGFiZWx9XG4gICAgICAgICAgICAgICAgICAgIHtzdGF0dXNMYWJlbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L1JlYWN0LkZyYWdtZW50Pjtcbn07XG5cbmNvbnN0IFVzZXJJbmZvID0gKHt1c2VyLCBncm91cElkLCByb29tSWQsIG9uQ2xvc2UsIHBoYXNlPVJJR0hUX1BBTkVMX1BIQVNFUy5Sb29tTWVtYmVySW5mbywgLi4ucHJvcHN9KSA9PiB7XG4gICAgY29uc3QgY2xpID0gdXNlQ29udGV4dChNYXRyaXhDbGllbnRDb250ZXh0KTtcblxuICAgIC8vIExvYWQgcm9vbSBpZiB3ZSBhcmUgZ2l2ZW4gYSByb29tIGlkIGFuZCBtZW1vaXplIGl0XG4gICAgY29uc3Qgcm9vbSA9IHVzZU1lbW8oKCkgPT4gcm9vbUlkID8gY2xpLmdldFJvb20ocm9vbUlkKSA6IG51bGwsIFtjbGksIHJvb21JZF0pO1xuICAgIC8vIGZldGNoIGxhdGVzdCByb29tIG1lbWJlciBpZiB3ZSBoYXZlIGEgcm9vbSwgc28gd2UgZG9uJ3Qgc2hvdyBoaXN0b3JpY2FsIGluZm9ybWF0aW9uLCBmYWxsaW5nIGJhY2sgdG8gdXNlclxuICAgIGNvbnN0IG1lbWJlciA9IHVzZU1lbW8oKCkgPT4gcm9vbSA/IChyb29tLmdldE1lbWJlcih1c2VyLnVzZXJJZCkgfHwgdXNlcikgOiB1c2VyLCBbcm9vbSwgdXNlcl0pO1xuXG4gICAgY29uc3QgaXNSb29tRW5jcnlwdGVkID0gdXNlSXNFbmNyeXB0ZWQoY2xpLCByb29tKTtcbiAgICBjb25zdCBkZXZpY2VzID0gdXNlRGV2aWNlcyh1c2VyLnVzZXJJZCk7XG5cbiAgICBsZXQgZTJlU3RhdHVzO1xuICAgIGlmIChpc1Jvb21FbmNyeXB0ZWQgJiYgZGV2aWNlcykge1xuICAgICAgICBlMmVTdGF0dXMgPSBnZXRFMkVTdGF0dXMoY2xpLCB1c2VyLnVzZXJJZCwgZGV2aWNlcyk7XG4gICAgfVxuXG4gICAgY29uc3QgY2xhc3NlcyA9IFtcIm14X1VzZXJJbmZvXCJdO1xuXG4gICAgbGV0IGNvbnRlbnQ7XG4gICAgc3dpdGNoIChwaGFzZSkge1xuICAgICAgICBjYXNlIFJJR0hUX1BBTkVMX1BIQVNFUy5Sb29tTWVtYmVySW5mbzpcbiAgICAgICAgY2FzZSBSSUdIVF9QQU5FTF9QSEFTRVMuR3JvdXBNZW1iZXJJbmZvOlxuICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8QmFzaWNVc2VySW5mb1xuICAgICAgICAgICAgICAgICAgICByb29tPXtyb29tfVxuICAgICAgICAgICAgICAgICAgICBtZW1iZXI9e21lbWJlcn1cbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZD17Z3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlcz17ZGV2aWNlc31cbiAgICAgICAgICAgICAgICAgICAgaXNSb29tRW5jcnlwdGVkPXtpc1Jvb21FbmNyeXB0ZWR9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLkVuY3J5cHRpb25QYW5lbDpcbiAgICAgICAgICAgIGNsYXNzZXMucHVzaChcIm14X1VzZXJJbmZvX3NtYWxsQXZhdGFyXCIpO1xuICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8RW5jcnlwdGlvblBhbmVsIHsuLi5wcm9wc30gbWVtYmVyPXttZW1iZXJ9IG9uQ2xvc2U9e29uQ2xvc2V9IGlzUm9vbUVuY3J5cHRlZD17aXNSb29tRW5jcnlwdGVkfSAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oXCIgXCIpfSByb2xlPVwidGFicGFuZWxcIj5cbiAgICAgICAgICAgIDxBdXRvSGlkZVNjcm9sbGJhciBjbGFzc05hbWU9XCJteF9Vc2VySW5mb19zY3JvbGxDb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8VXNlckluZm9IZWFkZXIgbWVtYmVyPXttZW1iZXJ9IGUyZVN0YXR1cz17ZTJlU3RhdHVzfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuXG4gICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICAgIDwvQXV0b0hpZGVTY3JvbGxiYXI+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59O1xuXG5Vc2VySW5mby5wcm9wVHlwZXMgPSB7XG4gICAgdXNlcjogUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgICAgIFByb3BUeXBlcy5pbnN0YW5jZU9mKFVzZXIpLFxuICAgICAgICBQcm9wVHlwZXMuaW5zdGFuY2VPZihSb29tTWVtYmVyKSxcbiAgICAgICAgR3JvdXBNZW1iZXIsXG4gICAgXSkuaXNSZXF1aXJlZCxcbiAgICBncm91cDogUHJvcFR5cGVzLmluc3RhbmNlT2YoR3JvdXApLFxuICAgIGdyb3VwSWQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgcm9vbUlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgb25DbG9zZTogUHJvcFR5cGVzLmZ1bmMsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBVc2VySW5mbztcbiJdfQ==