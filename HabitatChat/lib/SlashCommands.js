"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseCommandString = parseCommandString;
exports.getCommand = getCommand;
exports.CommandMap = exports.Commands = exports.Command = exports.CommandCategories = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var React = _interopRequireWildcard(require("react"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("./index"));

var _languageHandler = require("./languageHandler");

var _Modal = _interopRequireDefault(require("./Modal"));

var _MultiInviter = _interopRequireDefault(require("./utils/MultiInviter"));

var _HtmlUtils = require("./HtmlUtils");

var _QuestionDialog = _interopRequireDefault(require("./components/views/dialogs/QuestionDialog"));

var _WidgetUtils = _interopRequireDefault(require("./utils/WidgetUtils"));

var _colour = require("./utils/colour");

var _UserAddress = require("./UserAddress");

var _UrlUtils = require("./utils/UrlUtils");

var _IdentityServerUtils = require("./utils/IdentityServerUtils");

var _Permalinks = require("./utils/permalinks/Permalinks");

var _RoomInvite = require("./RoomInvite");

var _WidgetType = require("./widgets/WidgetType");

var _Jitsi = require("./widgets/Jitsi");

var _parse = require("parse5");

var _submitRageshake = _interopRequireDefault(require("./rageshake/submit-rageshake"));

var _SdkConfig = _interopRequireDefault(require("./SdkConfig"));

var _createRoom = require("./createRoom");

var _actions = require("./dispatcher/actions");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const singleMxcUpload = async () =>
/*: Promise<any>*/
{
  return new Promise(resolve => {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');

    fileSelector.onchange = (ev
    /*: HTMLInputEvent*/
    ) => {
      const file = ev.target.files[0];
      const UploadConfirmDialog = sdk.getComponent("dialogs.UploadConfirmDialog");

      _Modal.default.createTrackedDialog('Upload Files confirmation', '', UploadConfirmDialog, {
        file,
        onFinished: shouldContinue => {
          resolve(shouldContinue ? _MatrixClientPeg.MatrixClientPeg.get().uploadContent(file) : null);
        }
      });
    };

    fileSelector.click();
  });
};

const CommandCategories = {
  "messages": (0, _languageHandler._td)("Messages"),
  "actions": (0, _languageHandler._td)("Actions"),
  "admin": (0, _languageHandler._td)("Admin"),
  "advanced": (0, _languageHandler._td)("Advanced"),
  "other": (0, _languageHandler._td)("Other")
};
exports.CommandCategories = CommandCategories;

class Command {
  constructor(opts
  /*: ICommandOpts*/
  ) {
    (0, _defineProperty2.default)(this, "command", void 0);
    (0, _defineProperty2.default)(this, "aliases", void 0);
    (0, _defineProperty2.default)(this, "args", void 0);
    (0, _defineProperty2.default)(this, "description", void 0);
    (0, _defineProperty2.default)(this, "runFn", void 0);
    (0, _defineProperty2.default)(this, "category", void 0);
    (0, _defineProperty2.default)(this, "hideCompletionAfterSpace", void 0);
    this.command = opts.command;
    this.aliases = opts.aliases || [];
    this.args = opts.args || "";
    this.description = opts.description;
    this.runFn = opts.runFn;
    this.category = opts.category || CommandCategories.other;
    this.hideCompletionAfterSpace = opts.hideCompletionAfterSpace || false;
  }

  getCommand() {
    return "/".concat(this.command);
  }

  getCommandWithArgs() {
    return this.getCommand() + " " + this.args;
  }

  run(roomId
  /*: string*/
  , args
  /*: string*/
  , cmd
  /*: string*/
  ) {
    // if it has no runFn then its an ignored/nop command (autocomplete only) e.g `/me`
    if (!this.runFn) return;
    return this.runFn.bind(this)(roomId, args, cmd);
  }

  getUsage() {
    return (0, _languageHandler._t)('Usage') + ': ' + this.getCommandWithArgs();
  }

}

exports.Command = Command;

function reject(error) {
  return {
    error
  };
}

function success(promise
/*: Promise<any>*/
) {
  return {
    promise
  };
}
/* Disable the "unexpected this" error for these commands - all of the run
 * functions are called with `this` bound to the Command instance.
 */


const Commands = [new Command({
  command: 'shrug',
  args: '<message>',
  description: (0, _languageHandler._td)('Prepends ¯\\_(ツ)_/¯ to a plain-text message'),
  runFn: function (roomId, args) {
    let message = '¯\\_(ツ)_/¯';

    if (args) {
      message = message + ' ' + args;
    }

    return success(_MatrixClientPeg.MatrixClientPeg.get().sendTextMessage(roomId, message));
  },
  category: CommandCategories.messages
}), new Command({
  command: 'plain',
  args: '<message>',
  description: (0, _languageHandler._td)('Sends a message as plain text, without interpreting it as markdown'),
  runFn: function (roomId, messages) {
    return success(_MatrixClientPeg.MatrixClientPeg.get().sendTextMessage(roomId, messages));
  },
  category: CommandCategories.messages
}), new Command({
  command: 'html',
  args: '<message>',
  description: (0, _languageHandler._td)('Sends a message as html, without interpreting it as markdown'),
  runFn: function (roomId, messages) {
    return success(_MatrixClientPeg.MatrixClientPeg.get().sendHtmlMessage(roomId, messages, messages));
  },
  category: CommandCategories.messages
}), new Command({
  command: 'ddg',
  args: '<query>',
  description: (0, _languageHandler._td)('Searches DuckDuckGo for results'),
  runFn: function () {
    const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog'); // TODO Don't explain this away, actually show a search UI here.

    _Modal.default.createTrackedDialog('Slash Commands', '/ddg is not a command', ErrorDialog, {
      title: (0, _languageHandler._t)('/ddg is not a command'),
      description: (0, _languageHandler._t)('To use it, just wait for autocomplete results to load and tab through them.')
    });

    return success();
  },
  category: CommandCategories.actions,
  hideCompletionAfterSpace: true
}), new Command({
  command: 'upgraderoom',
  args: '<new_version>',
  description: (0, _languageHandler._td)('Upgrades a room to a new version'),
  runFn: function (roomId, args) {
    if (args) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const room = cli.getRoom(roomId);

      if (!room.currentState.mayClientSendStateEvent("m.room.tombstone", cli)) {
        return reject((0, _languageHandler._t)("You do not have the required permissions to use this command."));
      }

      const RoomUpgradeWarningDialog = sdk.getComponent("dialogs.RoomUpgradeWarningDialog");

      const {
        finished
      } = _Modal.default.createTrackedDialog('Slash Commands', 'upgrade room confirmation', RoomUpgradeWarningDialog, {
        roomId: roomId,
        targetVersion: args
      },
      /*className=*/
      null,
      /*isPriority=*/
      false,
      /*isStatic=*/
      true);

      return success(finished.then(async ([resp]) => {
        if (!resp.continue) return;
        let checkForUpgradeFn;

        try {
          const upgradePromise = cli.upgradeRoom(roomId, args); // We have to wait for the js-sdk to give us the room back so
          // we can more effectively abuse the MultiInviter behaviour
          // which heavily relies on the Room object being available.

          if (resp.invite) {
            checkForUpgradeFn = async newRoom => {
              // The upgradePromise should be done by the time we await it here.
              const {
                replacement_room: newRoomId
              } = await upgradePromise;
              if (newRoom.roomId !== newRoomId) return;
              const toInvite = [...room.getMembersWithMembership("join"), ...room.getMembersWithMembership("invite")].map(m => m.userId).filter(m => m !== cli.getUserId());

              if (toInvite.length > 0) {
                // Errors are handled internally to this function
                await (0, _RoomInvite.inviteUsersToRoom)(newRoomId, toInvite);
              }

              cli.removeListener('Room', checkForUpgradeFn);
            };

            cli.on('Room', checkForUpgradeFn);
          } // We have to await after so that the checkForUpgradesFn has a proper reference
          // to the new room's ID.


          await upgradePromise;
        } catch (e) {
          console.error(e);
          if (checkForUpgradeFn) cli.removeListener('Room', checkForUpgradeFn);
          const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

          _Modal.default.createTrackedDialog('Slash Commands', 'room upgrade error', ErrorDialog, {
            title: (0, _languageHandler._t)('Error upgrading room'),
            description: (0, _languageHandler._t)('Double check that your server supports the room version chosen and try again.')
          });
        }
      }));
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'nick',
  args: '<display_name>',
  description: (0, _languageHandler._td)('Changes your display nickname'),
  runFn: function (roomId, args) {
    if (args) {
      return success(_MatrixClientPeg.MatrixClientPeg.get().setDisplayName(args));
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'myroomnick',
  aliases: ['roomnick'],
  args: '<display_name>',
  description: (0, _languageHandler._td)('Changes your display nickname in the current room only'),
  runFn: function (roomId, args) {
    if (args) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const ev = cli.getRoom(roomId).currentState.getStateEvents('m.room.member', cli.getUserId());

      const content = _objectSpread({}, ev ? ev.getContent() : {
        membership: 'join'
      }, {
        displayname: args
      });

      return success(cli.sendStateEvent(roomId, 'm.room.member', content, cli.getUserId()));
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'roomavatar',
  args: '[<mxc_url>]',
  description: (0, _languageHandler._td)('Changes the avatar of the current room'),
  runFn: function (roomId, args) {
    let promise = Promise.resolve(args);

    if (!args) {
      promise = singleMxcUpload();
    }

    return success(promise.then(url => {
      if (!url) return;
      return _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(roomId, 'm.room.avatar', {
        url
      }, '');
    }));
  },
  category: CommandCategories.actions
}), new Command({
  command: 'myroomavatar',
  args: '[<mxc_url>]',
  description: (0, _languageHandler._td)('Changes your avatar in this current room only'),
  runFn: function (roomId, args) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const room = cli.getRoom(roomId);
    const userId = cli.getUserId();
    let promise = Promise.resolve(args);

    if (!args) {
      promise = singleMxcUpload();
    }

    return success(promise.then(url => {
      if (!url) return;
      const ev = room.currentState.getStateEvents('m.room.member', userId);

      const content = _objectSpread({}, ev ? ev.getContent() : {
        membership: 'join'
      }, {
        avatar_url: url
      });

      return cli.sendStateEvent(roomId, 'm.room.member', content, userId);
    }));
  },
  category: CommandCategories.actions
}), new Command({
  command: 'myavatar',
  args: '[<mxc_url>]',
  description: (0, _languageHandler._td)('Changes your avatar in all rooms'),
  runFn: function (roomId, args) {
    let promise = Promise.resolve(args);

    if (!args) {
      promise = singleMxcUpload();
    }

    return success(promise.then(url => {
      if (!url) return;
      return _MatrixClientPeg.MatrixClientPeg.get().setAvatarUrl(url);
    }));
  },
  category: CommandCategories.actions
}), new Command({
  command: 'topic',
  args: '[<topic>]',
  description: (0, _languageHandler._td)('Gets or sets the room topic'),
  runFn: function (roomId, args) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (args) {
      return success(cli.setRoomTopic(roomId, args));
    }

    const room = cli.getRoom(roomId);
    if (!room) return reject((0, _languageHandler._t)("Failed to set topic"));
    const topicEvents = room.currentState.getStateEvents('m.room.topic', '');
    const topic = topicEvents && topicEvents.getContent().topic;
    const topicHtml = topic ? (0, _HtmlUtils.linkifyAndSanitizeHtml)(topic) : (0, _languageHandler._t)('This room has no topic.');
    const InfoDialog = sdk.getComponent('dialogs.InfoDialog');

    _Modal.default.createTrackedDialog('Slash Commands', 'Topic', InfoDialog, {
      title: room.name,
      description: /*#__PURE__*/React.createElement("div", {
        dangerouslySetInnerHTML: {
          __html: topicHtml
        }
      }),
      hasCloseButton: true
    });

    return success();
  },
  category: CommandCategories.admin
}), new Command({
  command: 'roomname',
  args: '<name>',
  description: (0, _languageHandler._td)('Sets the room name'),
  runFn: function (roomId, args) {
    if (args) {
      return success(_MatrixClientPeg.MatrixClientPeg.get().setRoomName(roomId, args));
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'invite',
  args: '<user-id>',
  description: (0, _languageHandler._td)('Invites user with given id to current room'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+)$/);

      if (matches) {
        // We use a MultiInviter to re-use the invite logic, even though
        // we're only inviting one user.
        const address = matches[1]; // If we need an identity server but don't have one, things
        // get a bit more complex here, but we try to show something
        // meaningful.

        let finished = Promise.resolve();

        if ((0, _UserAddress.getAddressType)(address) === 'email' && !_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl()) {
          const defaultIdentityServerUrl = (0, _IdentityServerUtils.getDefaultIdentityServerUrl)();

          if (defaultIdentityServerUrl) {
            ({
              finished
            } = _Modal.default.createTrackedDialog('Slash Commands', 'Identity server', _QuestionDialog.default, {
              title: (0, _languageHandler._t)("Use an identity server"),
              description: /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)("Use an identity server to invite by email. " + "Click continue to use the default identity server " + "(%(defaultIdentityServerName)s) or manage in Settings.", {
                defaultIdentityServerName: (0, _UrlUtils.abbreviateUrl)(defaultIdentityServerUrl)
              })),
              button: (0, _languageHandler._t)("Continue")
            }));
            finished = finished.then(([useDefault]) => {
              if (useDefault) {
                (0, _IdentityServerUtils.useDefaultIdentityServer)();
                return;
              }

              throw new Error((0, _languageHandler._t)("Use an identity server to invite by email. Manage in Settings."));
            });
          } else {
            return reject((0, _languageHandler._t)("Use an identity server to invite by email. Manage in Settings."));
          }
        }

        const inviter = new _MultiInviter.default(roomId);
        return success(finished.then(() => {
          return inviter.invite([address]);
        }).then(() => {
          if (inviter.getCompletionState(address) !== "invited") {
            throw new Error(inviter.getErrorText(address));
          }
        }));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'join',
  aliases: ['j', 'goto'],
  args: '<room-alias>',
  description: (0, _languageHandler._td)('Joins room with given alias'),
  runFn: function (_, args) {
    if (args) {
      // Note: we support 2 versions of this command. The first is
      // the public-facing one for most users and the other is a
      // power-user edition where someone may join via permalink or
      // room ID with optional servers. Practically, this results
      // in the following variations:
      //   /join #example:example.org
      //   /join !example:example.org
      //   /join !example:example.org altserver.com elsewhere.ca
      //   /join https://matrix.to/#/!example:example.org?via=altserver.com
      // The command also supports event permalinks transparently:
      //   /join https://matrix.to/#/!example:example.org/$something:example.org
      //   /join https://matrix.to/#/!example:example.org/$something:example.org?via=altserver.com
      const params = args.split(' ');
      if (params.length < 1) return reject(this.getUsage());
      let isPermalink = false;

      if (params[0].startsWith("http:") || params[0].startsWith("https:")) {
        // It's at least a URL - try and pull out a hostname to check against the
        // permalink handler
        const parsedUrl = new URL(params[0]);
        const hostname = parsedUrl.host || parsedUrl.hostname; // takes first non-falsey value
        // if we're using a Riot permalink handler, this will catch it before we get much further.
        // see below where we make assumptions about parsing the URL.

        if ((0, _Permalinks.isPermalinkHost)(hostname)) {
          isPermalink = true;
        }
      }

      if (params[0][0] === '#') {
        let roomAlias = params[0];

        if (!roomAlias.includes(':')) {
          roomAlias += ':' + _MatrixClientPeg.MatrixClientPeg.get().getDomain();
        }

        _dispatcher.default.dispatch({
          action: 'view_room',
          room_alias: roomAlias,
          auto_join: true
        });

        return success();
      } else if (params[0][0] === '!') {
        const roomId = params[0];
        const viaServers = params.splice(0);

        _dispatcher.default.dispatch({
          action: 'view_room',
          room_id: roomId,
          opts: {
            // These are passed down to the js-sdk's /join call
            viaServers: viaServers
          },
          via_servers: viaServers,
          // for the rejoin button
          auto_join: true
        });

        return success();
      } else if (isPermalink) {
        const permalinkParts = (0, _Permalinks.parsePermalink)(params[0]); // This check technically isn't needed because we already did our
        // safety checks up above. However, for good measure, let's be sure.

        if (!permalinkParts) {
          return reject(this.getUsage());
        } // If for some reason someone wanted to join a group or user, we should
        // stop them now.


        if (!permalinkParts.roomIdOrAlias) {
          return reject(this.getUsage());
        }

        const entity = permalinkParts.roomIdOrAlias;
        const viaServers = permalinkParts.viaServers;
        const eventId = permalinkParts.eventId;
        const dispatch = {
          action: 'view_room',
          auto_join: true
        };
        if (entity[0] === '!') dispatch["room_id"] = entity;else dispatch["room_alias"] = entity;

        if (eventId) {
          dispatch["event_id"] = eventId;
          dispatch["highlighted"] = true;
        }

        if (viaServers) {
          // For the join
          dispatch["opts"] = {
            // These are passed down to the js-sdk's /join call
            viaServers: viaServers
          }; // For if the join fails (rejoin button)

          dispatch['via_servers'] = viaServers;
        }

        _dispatcher.default.dispatch(dispatch);

        return success();
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'part',
  args: '[<room-alias>]',
  description: (0, _languageHandler._td)('Leave room'),
  runFn: function (roomId, args) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    let targetRoomId;

    if (args) {
      const matches = args.match(/^(\S+)$/);

      if (matches) {
        let roomAlias = matches[1];
        if (roomAlias[0] !== '#') return reject(this.getUsage());

        if (!roomAlias.includes(':')) {
          roomAlias += ':' + cli.getDomain();
        } // Try to find a room with this alias


        const rooms = cli.getRooms();

        for (let i = 0; i < rooms.length; i++) {
          const aliasEvents = rooms[i].currentState.getStateEvents('m.room.aliases');

          for (let j = 0; j < aliasEvents.length; j++) {
            const aliases = aliasEvents[j].getContent().aliases || [];

            for (let k = 0; k < aliases.length; k++) {
              if (aliases[k] === roomAlias) {
                targetRoomId = rooms[i].roomId;
                break;
              }
            }

            if (targetRoomId) break;
          }

          if (targetRoomId) break;
        }

        if (!targetRoomId) return reject((0, _languageHandler._t)('Unrecognised room alias:') + ' ' + roomAlias);
      }
    }

    if (!targetRoomId) targetRoomId = roomId;
    return success(cli.leaveRoomChain(targetRoomId).then(function () {
      _dispatcher.default.dispatch({
        action: 'view_next_room'
      });
    }));
  },
  category: CommandCategories.actions
}), new Command({
  command: 'kick',
  args: '<user-id> [reason]',
  description: (0, _languageHandler._td)('Kicks user with given id'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+?)( +(.*))?$/);

      if (matches) {
        return success(_MatrixClientPeg.MatrixClientPeg.get().kick(roomId, matches[1], matches[3]));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'ban',
  args: '<user-id> [reason]',
  description: (0, _languageHandler._td)('Bans user with given id'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+?)( +(.*))?$/);

      if (matches) {
        return success(_MatrixClientPeg.MatrixClientPeg.get().ban(roomId, matches[1], matches[3]));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'unban',
  args: '<user-id>',
  description: (0, _languageHandler._td)('Unbans user with given ID'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+)$/);

      if (matches) {
        // Reset the user membership to "leave" to unban him
        return success(_MatrixClientPeg.MatrixClientPeg.get().unban(roomId, matches[1]));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'ignore',
  args: '<user-id>',
  description: (0, _languageHandler._td)('Ignores a user, hiding their messages from you'),
  runFn: function (roomId, args) {
    if (args) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const matches = args.match(/^(\S+)$/);

      if (matches) {
        const userId = matches[1];
        const ignoredUsers = cli.getIgnoredUsers();
        ignoredUsers.push(userId); // de-duped internally in the js-sdk

        return success(cli.setIgnoredUsers(ignoredUsers).then(() => {
          const InfoDialog = sdk.getComponent('dialogs.InfoDialog');

          _Modal.default.createTrackedDialog('Slash Commands', 'User ignored', InfoDialog, {
            title: (0, _languageHandler._t)('Ignored user'),
            description: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)('You are now ignoring %(userId)s', {
              userId
            })))
          });
        }));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'unignore',
  args: '<user-id>',
  description: (0, _languageHandler._td)('Stops ignoring a user, showing their messages going forward'),
  runFn: function (roomId, args) {
    if (args) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const matches = args.match(/^(\S+)$/);

      if (matches) {
        const userId = matches[1];
        const ignoredUsers = cli.getIgnoredUsers();
        const index = ignoredUsers.indexOf(userId);
        if (index !== -1) ignoredUsers.splice(index, 1);
        return success(cli.setIgnoredUsers(ignoredUsers).then(() => {
          const InfoDialog = sdk.getComponent('dialogs.InfoDialog');

          _Modal.default.createTrackedDialog('Slash Commands', 'User unignored', InfoDialog, {
            title: (0, _languageHandler._t)('Unignored user'),
            description: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)('You are no longer ignoring %(userId)s', {
              userId
            })))
          });
        }));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), new Command({
  command: 'op',
  args: '<user-id> [<power-level>]',
  description: (0, _languageHandler._td)('Define the power level of a user'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+?)( +(-?\d+))?$/);
      let powerLevel = 50; // default power level for op

      if (matches) {
        const userId = matches[1];

        if (matches.length === 4 && undefined !== matches[3]) {
          powerLevel = parseInt(matches[3], 10);
        }

        if (!isNaN(powerLevel)) {
          const cli = _MatrixClientPeg.MatrixClientPeg.get();

          const room = cli.getRoom(roomId);
          if (!room) return reject((0, _languageHandler._t)("Command failed"));
          const powerLevelEvent = room.currentState.getStateEvents('m.room.power_levels', '');
          if (!powerLevelEvent.getContent().users[args]) return reject((0, _languageHandler._t)("Could not find user in room"));
          return success(cli.setPowerLevel(roomId, userId, powerLevel, powerLevelEvent));
        }
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'deop',
  args: '<user-id>',
  description: (0, _languageHandler._td)('Deops user with given id'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+)$/);

      if (matches) {
        const cli = _MatrixClientPeg.MatrixClientPeg.get();

        const room = cli.getRoom(roomId);
        if (!room) return reject((0, _languageHandler._t)("Command failed"));
        const powerLevelEvent = room.currentState.getStateEvents('m.room.power_levels', '');
        if (!powerLevelEvent.getContent().users[args]) return reject((0, _languageHandler._t)("Could not find user in room"));
        return success(cli.setPowerLevel(roomId, args, undefined, powerLevelEvent));
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.admin
}), new Command({
  command: 'devtools',
  description: (0, _languageHandler._td)('Opens the Developer Tools dialog'),
  runFn: function (roomId) {
    const DevtoolsDialog = sdk.getComponent('dialogs.DevtoolsDialog');

    _Modal.default.createDialog(DevtoolsDialog, {
      roomId
    });

    return success();
  },
  category: CommandCategories.advanced
}), new Command({
  command: 'addwidget',
  args: '<url | embed code | Jitsi url>',
  description: (0, _languageHandler._td)('Adds a custom widget by URL to the room'),
  runFn: function (roomId, widgetUrl) {
    if (!widgetUrl) {
      return reject((0, _languageHandler._t)("Please supply a widget URL or embed code"));
    } // Try and parse out a widget URL from iframes


    if (widgetUrl.toLowerCase().startsWith("<iframe ")) {
      // We use parse5, which doesn't render/create a DOM node. It instead runs
      // some superfast regex over the text so we don't have to.
      const embed = (0, _parse.parseFragment)(widgetUrl);

      if (embed && embed.childNodes && embed.childNodes.length === 1) {
        const iframe = embed.childNodes[0];

        if (iframe.tagName.toLowerCase() === 'iframe' && iframe.attrs) {
          const srcAttr = iframe.attrs.find(a => a.name === 'src');
          console.log("Pulling URL out of iframe (embed code)");
          widgetUrl = srcAttr.value;
        }
      }
    }

    if (!widgetUrl.startsWith("https://") && !widgetUrl.startsWith("http://")) {
      return reject((0, _languageHandler._t)("Please supply a https:// or http:// widget URL"));
    }

    if (_WidgetUtils.default.canUserModifyWidgets(roomId)) {
      const userId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

      const nowMs = new Date().getTime();
      const widgetId = encodeURIComponent("".concat(roomId, "_").concat(userId, "_").concat(nowMs));
      let type = _WidgetType.WidgetType.CUSTOM;
      let name = "Custom Widget";
      let data = {}; // Make the widget a Jitsi widget if it looks like a Jitsi widget

      const jitsiData = _Jitsi.Jitsi.getInstance().parsePreferredConferenceUrl(widgetUrl);

      if (jitsiData) {
        console.log("Making /addwidget widget a Jitsi conference");
        type = _WidgetType.WidgetType.JITSI;
        name = "Jitsi Conference";
        data = jitsiData;
        widgetUrl = _WidgetUtils.default.getLocalJitsiWrapperUrl();
      }

      return success(_WidgetUtils.default.setRoomWidget(roomId, widgetId, type, widgetUrl, name, data));
    } else {
      return reject((0, _languageHandler._t)("You cannot modify widgets in this room."));
    }
  },
  category: CommandCategories.admin
}), new Command({
  command: 'verify',
  args: '<user-id> <device-id> <device-signing-key>',
  description: (0, _languageHandler._td)('Verifies a user, session, and pubkey tuple'),
  runFn: function (roomId, args) {
    if (args) {
      const matches = args.match(/^(\S+) +(\S+) +(\S+)$/);

      if (matches) {
        const cli = _MatrixClientPeg.MatrixClientPeg.get();

        const userId = matches[1];
        const deviceId = matches[2];
        const fingerprint = matches[3];
        return success((async () => {
          const device = cli.getStoredDevice(userId, deviceId);

          if (!device) {
            throw new Error((0, _languageHandler._t)('Unknown (user, session) pair:') + " (".concat(userId, ", ").concat(deviceId, ")"));
          }

          const deviceTrust = await cli.checkDeviceTrust(userId, deviceId);

          if (deviceTrust.isVerified()) {
            if (device.getFingerprint() === fingerprint) {
              throw new Error((0, _languageHandler._t)('Session already verified!'));
            } else {
              throw new Error((0, _languageHandler._t)('WARNING: Session already verified, but keys do NOT MATCH!'));
            }
          }

          if (device.getFingerprint() !== fingerprint) {
            const fprint = device.getFingerprint();
            throw new Error((0, _languageHandler._t)('WARNING: KEY VERIFICATION FAILED! The signing key for %(userId)s and session' + ' %(deviceId)s is "%(fprint)s" which does not match the provided key ' + '"%(fingerprint)s". This could mean your communications are being intercepted!', {
              fprint,
              userId,
              deviceId,
              fingerprint
            }));
          }

          await cli.setDeviceVerified(userId, deviceId, true); // Tell the user we verified everything

          const InfoDialog = sdk.getComponent('dialogs.InfoDialog');

          _Modal.default.createTrackedDialog('Slash Commands', 'Verified key', InfoDialog, {
            title: (0, _languageHandler._t)('Verified key'),
            description: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, (0, _languageHandler._t)('The signing key you provided matches the signing key you received ' + 'from %(userId)s\'s session %(deviceId)s. Session marked as verified.', {
              userId,
              deviceId
            })))
          });
        })());
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.advanced
}), new Command({
  command: 'discardsession',
  description: (0, _languageHandler._td)('Forces the current outbound group session in an encrypted room to be discarded'),
  runFn: function (roomId) {
    try {
      _MatrixClientPeg.MatrixClientPeg.get().forceDiscardSession(roomId);
    } catch (e) {
      return reject(e.message);
    }

    return success();
  },
  category: CommandCategories.advanced
}), new Command({
  command: "rainbow",
  description: (0, _languageHandler._td)("Sends the given message coloured as a rainbow"),
  args: '<message>',
  runFn: function (roomId, args) {
    if (!args) return reject(this.getUserId());
    return success(_MatrixClientPeg.MatrixClientPeg.get().sendHtmlMessage(roomId, args, (0, _colour.textToHtmlRainbow)(args)));
  },
  category: CommandCategories.messages
}), new Command({
  command: "rainbowme",
  description: (0, _languageHandler._td)("Sends the given emote coloured as a rainbow"),
  args: '<message>',
  runFn: function (roomId, args) {
    if (!args) return reject(this.getUserId());
    return success(_MatrixClientPeg.MatrixClientPeg.get().sendHtmlEmote(roomId, args, (0, _colour.textToHtmlRainbow)(args)));
  },
  category: CommandCategories.messages
}), new Command({
  command: "help",
  description: (0, _languageHandler._td)("Displays list of commands with usages and descriptions"),
  runFn: function () {
    const SlashCommandHelpDialog = sdk.getComponent('dialogs.SlashCommandHelpDialog');

    _Modal.default.createTrackedDialog('Slash Commands', 'Help', SlashCommandHelpDialog);

    return success();
  },
  category: CommandCategories.advanced
}), new Command({
  command: "whois",
  description: (0, _languageHandler._td)("Displays information about a user"),
  args: "<user-id>",
  runFn: function (roomId, userId) {
    if (!userId || !userId.startsWith("@") || !userId.includes(":")) {
      return reject(this.getUsage());
    }

    const member = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId).getMember(userId);

    _dispatcher.default.dispatch({
      action: _actions.Action.ViewUser,
      // XXX: We should be using a real member object and not assuming what the
      // receiver wants.
      member: member || {
        userId
      }
    });

    return success();
  },
  category: CommandCategories.advanced
}), new Command({
  command: "rageshake",
  aliases: ["bugreport"],
  description: (0, _languageHandler._td)("Send a bug report with logs"),
  args: "<description>",
  runFn: function (roomId, args) {
    return success((0, _submitRageshake.default)(_SdkConfig.default.get().bug_report_endpoint_url, {
      userText: args,
      sendLogs: true
    }).then(() => {
      const InfoDialog = sdk.getComponent('dialogs.InfoDialog');

      _Modal.default.createTrackedDialog('Slash Commands', 'Rageshake sent', InfoDialog, {
        title: (0, _languageHandler._t)('Logs sent'),
        description: (0, _languageHandler._t)('Thank you!')
      });
    }));
  },
  category: CommandCategories.advanced
}), new Command({
  command: "query",
  description: (0, _languageHandler._td)("Opens chat with the given user"),
  args: "<user-id>",
  runFn: function (roomId, userId) {
    if (!userId || !userId.startsWith("@") || !userId.includes(":")) {
      return reject(this.getUsage());
    }

    return success((async () => {
      _dispatcher.default.dispatch({
        action: 'view_room',
        room_id: await (0, _createRoom.ensureDMExists)(_MatrixClientPeg.MatrixClientPeg.get(), userId)
      });
    })());
  },
  category: CommandCategories.actions
}), new Command({
  command: "msg",
  description: (0, _languageHandler._td)("Sends a message to the given user"),
  args: "<user-id> <message>",
  runFn: function (_, args) {
    if (args) {
      // matches the first whitespace delimited group and then the rest of the string
      const matches = args.match(/^([\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uFEFE\uFF00-\uFFFF]+?)(?: +([\s\S]*))?$/);

      if (matches) {
        const [userId, msg] = matches.slice(1);

        if (msg && userId && userId.startsWith("@") && userId.includes(":")) {
          return success((async () => {
            const cli = _MatrixClientPeg.MatrixClientPeg.get();

            const roomId = await (0, _createRoom.ensureDMExists)(cli, userId);

            _dispatcher.default.dispatch({
              action: 'view_room',
              room_id: roomId
            });

            cli.sendTextMessage(roomId, msg);
          })());
        }
      }
    }

    return reject(this.getUsage());
  },
  category: CommandCategories.actions
}), // Command definitions for autocompletion ONLY:
// /me is special because its not handled by SlashCommands.js and is instead done inside the Composer classes
new Command({
  command: "me",
  args: '<message>',
  description: (0, _languageHandler._td)('Displays action'),
  category: CommandCategories.messages,
  hideCompletionAfterSpace: true
})]; // build a map from names and aliases to the Command objects.

exports.Commands = Commands;
const CommandMap = new Map();
exports.CommandMap = CommandMap;
Commands.forEach(cmd => {
  CommandMap.set(cmd.command, cmd);
  cmd.aliases.forEach(alias => {
    CommandMap.set(alias, cmd);
  });
});

function parseCommandString(input) {
  // trim any trailing whitespace, as it can confuse the parser for
  // IRC-style commands
  input = input.replace(/\s+$/, '');
  if (input[0] !== '/') return null; // not a command

  const bits = input.match(/^(\S+?)(?: +((.|\n)*))?$/);
  let cmd;
  let args;

  if (bits) {
    cmd = bits[1].substring(1).toLowerCase();
    args = bits[2];
  } else {
    cmd = input;
  }

  return {
    cmd,
    args
  };
}
/**
 * Process the given text for /commands and return a bound method to perform them.
 * @param {string} roomId The room in which the command was performed.
 * @param {string} input The raw text input by the user.
 * @return {null|function(): Object} Function returning an object with the property 'error' if there was an error
 * processing the command, or 'promise' if a request was sent out.
 * Returns null if the input didn't match a command.
 */


function getCommand(roomId, input) {
  const {
    cmd,
    args
  } = parseCommandString(input);

  if (CommandMap.has(cmd)) {
    return () => CommandMap.get(cmd).run(roomId, args, cmd);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TbGFzaENvbW1hbmRzLnRzeCJdLCJuYW1lcyI6WyJzaW5nbGVNeGNVcGxvYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImZpbGVTZWxlY3RvciIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsIm9uY2hhbmdlIiwiZXYiLCJmaWxlIiwidGFyZ2V0IiwiZmlsZXMiLCJVcGxvYWRDb25maXJtRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwib25GaW5pc2hlZCIsInNob3VsZENvbnRpbnVlIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwidXBsb2FkQ29udGVudCIsImNsaWNrIiwiQ29tbWFuZENhdGVnb3JpZXMiLCJDb21tYW5kIiwiY29uc3RydWN0b3IiLCJvcHRzIiwiY29tbWFuZCIsImFsaWFzZXMiLCJhcmdzIiwiZGVzY3JpcHRpb24iLCJydW5GbiIsImNhdGVnb3J5Iiwib3RoZXIiLCJoaWRlQ29tcGxldGlvbkFmdGVyU3BhY2UiLCJnZXRDb21tYW5kIiwiZ2V0Q29tbWFuZFdpdGhBcmdzIiwicnVuIiwicm9vbUlkIiwiY21kIiwiYmluZCIsImdldFVzYWdlIiwicmVqZWN0IiwiZXJyb3IiLCJzdWNjZXNzIiwicHJvbWlzZSIsIkNvbW1hbmRzIiwibWVzc2FnZSIsInNlbmRUZXh0TWVzc2FnZSIsIm1lc3NhZ2VzIiwic2VuZEh0bWxNZXNzYWdlIiwiRXJyb3JEaWFsb2ciLCJ0aXRsZSIsImFjdGlvbnMiLCJjbGkiLCJyb29tIiwiZ2V0Um9vbSIsImN1cnJlbnRTdGF0ZSIsIm1heUNsaWVudFNlbmRTdGF0ZUV2ZW50IiwiUm9vbVVwZ3JhZGVXYXJuaW5nRGlhbG9nIiwiZmluaXNoZWQiLCJ0YXJnZXRWZXJzaW9uIiwidGhlbiIsInJlc3AiLCJjb250aW51ZSIsImNoZWNrRm9yVXBncmFkZUZuIiwidXBncmFkZVByb21pc2UiLCJ1cGdyYWRlUm9vbSIsImludml0ZSIsIm5ld1Jvb20iLCJyZXBsYWNlbWVudF9yb29tIiwibmV3Um9vbUlkIiwidG9JbnZpdGUiLCJnZXRNZW1iZXJzV2l0aE1lbWJlcnNoaXAiLCJtYXAiLCJtIiwidXNlcklkIiwiZmlsdGVyIiwiZ2V0VXNlcklkIiwibGVuZ3RoIiwicmVtb3ZlTGlzdGVuZXIiLCJvbiIsImUiLCJjb25zb2xlIiwiYWRtaW4iLCJzZXREaXNwbGF5TmFtZSIsImdldFN0YXRlRXZlbnRzIiwiY29udGVudCIsImdldENvbnRlbnQiLCJtZW1iZXJzaGlwIiwiZGlzcGxheW5hbWUiLCJzZW5kU3RhdGVFdmVudCIsInVybCIsImF2YXRhcl91cmwiLCJzZXRBdmF0YXJVcmwiLCJzZXRSb29tVG9waWMiLCJ0b3BpY0V2ZW50cyIsInRvcGljIiwidG9waWNIdG1sIiwiSW5mb0RpYWxvZyIsIm5hbWUiLCJfX2h0bWwiLCJoYXNDbG9zZUJ1dHRvbiIsInNldFJvb21OYW1lIiwibWF0Y2hlcyIsIm1hdGNoIiwiYWRkcmVzcyIsImdldElkZW50aXR5U2VydmVyVXJsIiwiZGVmYXVsdElkZW50aXR5U2VydmVyVXJsIiwiUXVlc3Rpb25EaWFsb2ciLCJkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJOYW1lIiwiYnV0dG9uIiwidXNlRGVmYXVsdCIsIkVycm9yIiwiaW52aXRlciIsIk11bHRpSW52aXRlciIsImdldENvbXBsZXRpb25TdGF0ZSIsImdldEVycm9yVGV4dCIsIl8iLCJwYXJhbXMiLCJzcGxpdCIsImlzUGVybWFsaW5rIiwic3RhcnRzV2l0aCIsInBhcnNlZFVybCIsIlVSTCIsImhvc3RuYW1lIiwiaG9zdCIsInJvb21BbGlhcyIsImluY2x1ZGVzIiwiZ2V0RG9tYWluIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJyb29tX2FsaWFzIiwiYXV0b19qb2luIiwidmlhU2VydmVycyIsInNwbGljZSIsInJvb21faWQiLCJ2aWFfc2VydmVycyIsInBlcm1hbGlua1BhcnRzIiwicm9vbUlkT3JBbGlhcyIsImVudGl0eSIsImV2ZW50SWQiLCJ0YXJnZXRSb29tSWQiLCJyb29tcyIsImdldFJvb21zIiwiaSIsImFsaWFzRXZlbnRzIiwiaiIsImsiLCJsZWF2ZVJvb21DaGFpbiIsImtpY2siLCJiYW4iLCJ1bmJhbiIsImlnbm9yZWRVc2VycyIsImdldElnbm9yZWRVc2VycyIsInB1c2giLCJzZXRJZ25vcmVkVXNlcnMiLCJpbmRleCIsImluZGV4T2YiLCJwb3dlckxldmVsIiwidW5kZWZpbmVkIiwicGFyc2VJbnQiLCJpc05hTiIsInBvd2VyTGV2ZWxFdmVudCIsInVzZXJzIiwic2V0UG93ZXJMZXZlbCIsIkRldnRvb2xzRGlhbG9nIiwiY3JlYXRlRGlhbG9nIiwiYWR2YW5jZWQiLCJ3aWRnZXRVcmwiLCJ0b0xvd2VyQ2FzZSIsImVtYmVkIiwiY2hpbGROb2RlcyIsImlmcmFtZSIsInRhZ05hbWUiLCJhdHRycyIsInNyY0F0dHIiLCJmaW5kIiwiYSIsImxvZyIsInZhbHVlIiwiV2lkZ2V0VXRpbHMiLCJjYW5Vc2VyTW9kaWZ5V2lkZ2V0cyIsIm5vd01zIiwiRGF0ZSIsImdldFRpbWUiLCJ3aWRnZXRJZCIsImVuY29kZVVSSUNvbXBvbmVudCIsInR5cGUiLCJXaWRnZXRUeXBlIiwiQ1VTVE9NIiwiZGF0YSIsImppdHNpRGF0YSIsIkppdHNpIiwiZ2V0SW5zdGFuY2UiLCJwYXJzZVByZWZlcnJlZENvbmZlcmVuY2VVcmwiLCJKSVRTSSIsImdldExvY2FsSml0c2lXcmFwcGVyVXJsIiwic2V0Um9vbVdpZGdldCIsImRldmljZUlkIiwiZmluZ2VycHJpbnQiLCJkZXZpY2UiLCJnZXRTdG9yZWREZXZpY2UiLCJkZXZpY2VUcnVzdCIsImNoZWNrRGV2aWNlVHJ1c3QiLCJpc1ZlcmlmaWVkIiwiZ2V0RmluZ2VycHJpbnQiLCJmcHJpbnQiLCJzZXREZXZpY2VWZXJpZmllZCIsImZvcmNlRGlzY2FyZFNlc3Npb24iLCJzZW5kSHRtbEVtb3RlIiwiU2xhc2hDb21tYW5kSGVscERpYWxvZyIsIm1lbWJlciIsImdldE1lbWJlciIsIkFjdGlvbiIsIlZpZXdVc2VyIiwiU2RrQ29uZmlnIiwiYnVnX3JlcG9ydF9lbmRwb2ludF91cmwiLCJ1c2VyVGV4dCIsInNlbmRMb2dzIiwibXNnIiwic2xpY2UiLCJDb21tYW5kTWFwIiwiTWFwIiwiZm9yRWFjaCIsInNldCIsImFsaWFzIiwicGFyc2VDb21tYW5kU3RyaW5nIiwiaW5wdXQiLCJyZXBsYWNlIiwiYml0cyIsInN1YnN0cmluZyIsImhhcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUFPQSxNQUFNQSxlQUFlLEdBQUc7QUFBQTtBQUEwQjtBQUM5QyxTQUFPLElBQUlDLE9BQUosQ0FBYUMsT0FBRCxJQUFhO0FBQzVCLFVBQU1DLFlBQVksR0FBR0MsUUFBUSxDQUFDQyxhQUFULENBQXVCLE9BQXZCLENBQXJCO0FBQ0FGLElBQUFBLFlBQVksQ0FBQ0csWUFBYixDQUEwQixNQUExQixFQUFrQyxNQUFsQzs7QUFDQUgsSUFBQUEsWUFBWSxDQUFDSSxRQUFiLEdBQXdCLENBQUNDO0FBQUQ7QUFBQSxTQUF3QjtBQUM1QyxZQUFNQyxJQUFJLEdBQUdELEVBQUUsQ0FBQ0UsTUFBSCxDQUFVQyxLQUFWLENBQWdCLENBQWhCLENBQWI7QUFFQSxZQUFNQyxtQkFBbUIsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDZCQUFqQixDQUE1Qjs7QUFDQUMscUJBQU1DLG1CQUFOLENBQTBCLDJCQUExQixFQUF1RCxFQUF2RCxFQUEyREosbUJBQTNELEVBQWdGO0FBQzVFSCxRQUFBQSxJQUQ0RTtBQUU1RVEsUUFBQUEsVUFBVSxFQUFHQyxjQUFELElBQW9CO0FBQzVCaEIsVUFBQUEsT0FBTyxDQUFDZ0IsY0FBYyxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxh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QU8sTUFBTXdMLFVBQVUsQ0FBQzNNLEdBQVgsQ0FBZW1CLEdBQWYsRUFBb0JGLEdBQXBCLENBQXdCQyxNQUF4QixFQUFnQ1QsSUFBaEMsRUFBc0NVLEdBQXRDLENBQWI7QUFDSDtBQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IGRpcyBmcm9tICcuL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQge190LCBfdGR9IGZyb20gJy4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBNb2RhbCBmcm9tICcuL01vZGFsJztcbmltcG9ydCBNdWx0aUludml0ZXIgZnJvbSAnLi91dGlscy9NdWx0aUludml0ZXInO1xuaW1wb3J0IHsgbGlua2lmeUFuZFNhbml0aXplSHRtbCB9IGZyb20gJy4vSHRtbFV0aWxzJztcbmltcG9ydCBRdWVzdGlvbkRpYWxvZyBmcm9tIFwiLi9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvUXVlc3Rpb25EaWFsb2dcIjtcbmltcG9ydCBXaWRnZXRVdGlscyBmcm9tIFwiLi91dGlscy9XaWRnZXRVdGlsc1wiO1xuaW1wb3J0IHt0ZXh0VG9IdG1sUmFpbmJvd30gZnJvbSBcIi4vdXRpbHMvY29sb3VyXCI7XG5pbXBvcnQgeyBnZXRBZGRyZXNzVHlwZSB9IGZyb20gJy4vVXNlckFkZHJlc3MnO1xuaW1wb3J0IHsgYWJicmV2aWF0ZVVybCB9IGZyb20gJy4vdXRpbHMvVXJsVXRpbHMnO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdElkZW50aXR5U2VydmVyVXJsLCB1c2VEZWZhdWx0SWRlbnRpdHlTZXJ2ZXIgfSBmcm9tICcuL3V0aWxzL0lkZW50aXR5U2VydmVyVXRpbHMnO1xuaW1wb3J0IHtpc1Blcm1hbGlua0hvc3QsIHBhcnNlUGVybWFsaW5rfSBmcm9tIFwiLi91dGlscy9wZXJtYWxpbmtzL1Blcm1hbGlua3NcIjtcbmltcG9ydCB7aW52aXRlVXNlcnNUb1Jvb219IGZyb20gXCIuL1Jvb21JbnZpdGVcIjtcbmltcG9ydCB7IFdpZGdldFR5cGUgfSBmcm9tIFwiLi93aWRnZXRzL1dpZGdldFR5cGVcIjtcbmltcG9ydCB7IEppdHNpIH0gZnJvbSBcIi4vd2lkZ2V0cy9KaXRzaVwiO1xuaW1wb3J0IHsgcGFyc2VGcmFnbWVudCBhcyBwYXJzZUh0bWwgfSBmcm9tIFwicGFyc2U1XCI7XG5pbXBvcnQgc2VuZEJ1Z1JlcG9ydCBmcm9tIFwiLi9yYWdlc2hha2Uvc3VibWl0LXJhZ2VzaGFrZVwiO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tIFwiLi9TZGtDb25maWdcIjtcbmltcG9ydCB7IGVuc3VyZURNRXhpc3RzIH0gZnJvbSBcIi4vY3JlYXRlUm9vbVwiO1xuaW1wb3J0IHsgVmlld1VzZXJQYXlsb2FkIH0gZnJvbSBcIi4vZGlzcGF0Y2hlci9wYXlsb2Fkcy9WaWV3VXNlclBheWxvYWRcIjtcbmltcG9ydCB7IEFjdGlvbiB9IGZyb20gXCIuL2Rpc3BhdGNoZXIvYWN0aW9uc1wiO1xuXG4vLyBYWFg6IHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzE4MTZcbmludGVyZmFjZSBIVE1MSW5wdXRFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgICB0YXJnZXQ6IEhUTUxJbnB1dEVsZW1lbnQgJiBFdmVudFRhcmdldDtcbn1cblxuY29uc3Qgc2luZ2xlTXhjVXBsb2FkID0gYXN5bmMgKCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGVTZWxlY3RvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGZpbGVTZWxlY3Rvci5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZmlsZScpO1xuICAgICAgICBmaWxlU2VsZWN0b3Iub25jaGFuZ2UgPSAoZXY6IEhUTUxJbnB1dEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZXYudGFyZ2V0LmZpbGVzWzBdO1xuXG4gICAgICAgICAgICBjb25zdCBVcGxvYWRDb25maXJtRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuVXBsb2FkQ29uZmlybURpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1VwbG9hZCBGaWxlcyBjb25maXJtYXRpb24nLCAnJywgVXBsb2FkQ29uZmlybURpYWxvZywge1xuICAgICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZDogKHNob3VsZENvbnRpbnVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2hvdWxkQ29udGludWUgPyBNYXRyaXhDbGllbnRQZWcuZ2V0KCkudXBsb2FkQ29udGVudChmaWxlKSA6IG51bGwpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBmaWxlU2VsZWN0b3IuY2xpY2soKTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBDb21tYW5kQ2F0ZWdvcmllcyA9IHtcbiAgICBcIm1lc3NhZ2VzXCI6IF90ZChcIk1lc3NhZ2VzXCIpLFxuICAgIFwiYWN0aW9uc1wiOiBfdGQoXCJBY3Rpb25zXCIpLFxuICAgIFwiYWRtaW5cIjogX3RkKFwiQWRtaW5cIiksXG4gICAgXCJhZHZhbmNlZFwiOiBfdGQoXCJBZHZhbmNlZFwiKSxcbiAgICBcIm90aGVyXCI6IF90ZChcIk90aGVyXCIpLFxufTtcblxudHlwZSBSdW5GbiA9ICgocm9vbUlkOiBzdHJpbmcsIGFyZ3M6IHN0cmluZywgY21kOiBzdHJpbmcpID0+IHtlcnJvcjogYW55fSB8IHtwcm9taXNlOiBQcm9taXNlPGFueT59KTtcblxuaW50ZXJmYWNlIElDb21tYW5kT3B0cyB7XG4gICAgY29tbWFuZDogc3RyaW5nO1xuICAgIGFsaWFzZXM/OiBzdHJpbmdbXTtcbiAgICBhcmdzPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcnVuRm4/OiBSdW5GbjtcbiAgICBjYXRlZ29yeTogc3RyaW5nO1xuICAgIGhpZGVDb21wbGV0aW9uQWZ0ZXJTcGFjZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBDb21tYW5kIHtcbiAgICBjb21tYW5kOiBzdHJpbmc7XG4gICAgYWxpYXNlczogc3RyaW5nW107XG4gICAgYXJnczogdW5kZWZpbmVkIHwgc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcnVuRm46IHVuZGVmaW5lZCB8IFJ1bkZuO1xuICAgIGNhdGVnb3J5OiBzdHJpbmc7XG4gICAgaGlkZUNvbXBsZXRpb25BZnRlclNwYWNlOiBib29sZWFuO1xuXG4gICAgY29uc3RydWN0b3Iob3B0czogSUNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuY29tbWFuZCA9IG9wdHMuY29tbWFuZDtcbiAgICAgICAgdGhpcy5hbGlhc2VzID0gb3B0cy5hbGlhc2VzIHx8IFtdO1xuICAgICAgICB0aGlzLmFyZ3MgPSBvcHRzLmFyZ3MgfHwgXCJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IG9wdHMuZGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMucnVuRm4gPSBvcHRzLnJ1bkZuO1xuICAgICAgICB0aGlzLmNhdGVnb3J5ID0gb3B0cy5jYXRlZ29yeSB8fCBDb21tYW5kQ2F0ZWdvcmllcy5vdGhlcjtcbiAgICAgICAgdGhpcy5oaWRlQ29tcGxldGlvbkFmdGVyU3BhY2UgPSBvcHRzLmhpZGVDb21wbGV0aW9uQWZ0ZXJTcGFjZSB8fCBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRDb21tYW5kKCkge1xuICAgICAgICByZXR1cm4gYC8ke3RoaXMuY29tbWFuZH1gO1xuICAgIH1cblxuICAgIGdldENvbW1hbmRXaXRoQXJncygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tbWFuZCgpICsgXCIgXCIgKyB0aGlzLmFyZ3M7XG4gICAgfVxuXG4gICAgcnVuKHJvb21JZDogc3RyaW5nLCBhcmdzOiBzdHJpbmcsIGNtZDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGlmIGl0IGhhcyBubyBydW5GbiB0aGVuIGl0cyBhbiBpZ25vcmVkL25vcCBjb21tYW5kIChhdXRvY29tcGxldGUgb25seSkgZS5nIGAvbWVgXG4gICAgICAgIGlmICghdGhpcy5ydW5GbikgcmV0dXJuO1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5Gbi5iaW5kKHRoaXMpKHJvb21JZCwgYXJncywgY21kKTtcbiAgICB9XG5cbiAgICBnZXRVc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIF90KCdVc2FnZScpICsgJzogJyArIHRoaXMuZ2V0Q29tbWFuZFdpdGhBcmdzKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWplY3QoZXJyb3IpIHtcbiAgICByZXR1cm4ge2Vycm9yfTtcbn1cblxuZnVuY3Rpb24gc3VjY2Vzcyhwcm9taXNlPzogUHJvbWlzZTxhbnk+KSB7XG4gICAgcmV0dXJuIHtwcm9taXNlfTtcbn1cblxuLyogRGlzYWJsZSB0aGUgXCJ1bmV4cGVjdGVkIHRoaXNcIiBlcnJvciBmb3IgdGhlc2UgY29tbWFuZHMgLSBhbGwgb2YgdGhlIHJ1blxuICogZnVuY3Rpb25zIGFyZSBjYWxsZWQgd2l0aCBgdGhpc2AgYm91bmQgdG8gdGhlIENvbW1hbmQgaW5zdGFuY2UuXG4gKi9cblxuZXhwb3J0IGNvbnN0IENvbW1hbmRzID0gW1xuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ3NocnVnJyxcbiAgICAgICAgYXJnczogJzxtZXNzYWdlPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ1ByZXBlbmRzIMKvXFxcXF8o44OEKV8vwq8gdG8gYSBwbGFpbi10ZXh0IG1lc3NhZ2UnKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnwq9cXFxcXyjjg4QpXy/Cryc7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgJyAnICsgYXJncztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kVGV4dE1lc3NhZ2Uocm9vbUlkLCBtZXNzYWdlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5tZXNzYWdlcyxcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdwbGFpbicsXG4gICAgICAgIGFyZ3M6ICc8bWVzc2FnZT4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdTZW5kcyBhIG1lc3NhZ2UgYXMgcGxhaW4gdGV4dCwgd2l0aG91dCBpbnRlcnByZXRpbmcgaXQgYXMgbWFya2Rvd24nKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kVGV4dE1lc3NhZ2Uocm9vbUlkLCBtZXNzYWdlcykpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMubWVzc2FnZXMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnaHRtbCcsXG4gICAgICAgIGFyZ3M6ICc8bWVzc2FnZT4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdTZW5kcyBhIG1lc3NhZ2UgYXMgaHRtbCwgd2l0aG91dCBpbnRlcnByZXRpbmcgaXQgYXMgbWFya2Rvd24nKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kSHRtbE1lc3NhZ2Uocm9vbUlkLCBtZXNzYWdlcywgbWVzc2FnZXMpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLm1lc3NhZ2VzLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2RkZycsXG4gICAgICAgIGFyZ3M6ICc8cXVlcnk+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnU2VhcmNoZXMgRHVja0R1Y2tHbyBmb3IgcmVzdWx0cycpLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgICAgIC8vIFRPRE8gRG9uJ3QgZXhwbGFpbiB0aGlzIGF3YXksIGFjdHVhbGx5IHNob3cgYSBzZWFyY2ggVUkgaGVyZS5cbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1NsYXNoIENvbW1hbmRzJywgJy9kZGcgaXMgbm90IGEgY29tbWFuZCcsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KCcvZGRnIGlzIG5vdCBhIGNvbW1hbmQnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1RvIHVzZSBpdCwganVzdCB3YWl0IGZvciBhdXRvY29tcGxldGUgcmVzdWx0cyB0byBsb2FkIGFuZCB0YWIgdGhyb3VnaCB0aGVtLicpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWN0aW9ucyxcbiAgICAgICAgaGlkZUNvbXBsZXRpb25BZnRlclNwYWNlOiB0cnVlLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ3VwZ3JhZGVyb29tJyxcbiAgICAgICAgYXJnczogJzxuZXdfdmVyc2lvbj4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdVcGdyYWRlcyBhIHJvb20gdG8gYSBuZXcgdmVyc2lvbicpLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb20uY3VycmVudFN0YXRlLm1heUNsaWVudFNlbmRTdGF0ZUV2ZW50KFwibS5yb29tLnRvbWJzdG9uZVwiLCBjbGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoX3QoXCJZb3UgZG8gbm90IGhhdmUgdGhlIHJlcXVpcmVkIHBlcm1pc3Npb25zIHRvIHVzZSB0aGlzIGNvbW1hbmQuXCIpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBSb29tVXBncmFkZVdhcm5pbmdEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5Sb29tVXBncmFkZVdhcm5pbmdEaWFsb2dcIik7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB7ZmluaXNoZWR9ID0gTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2xhc2ggQ29tbWFuZHMnLCAndXBncmFkZSByb29tIGNvbmZpcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIFJvb21VcGdyYWRlV2FybmluZ0RpYWxvZywge3Jvb21JZDogcm9vbUlkLCB0YXJnZXRWZXJzaW9uOiBhcmdzfSwgLypjbGFzc05hbWU9Ki9udWxsLFxuICAgICAgICAgICAgICAgICAgICAvKmlzUHJpb3JpdHk9Ki9mYWxzZSwgLyppc1N0YXRpYz0qL3RydWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoZmluaXNoZWQudGhlbihhc3luYyAoW3Jlc3BdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzcC5jb250aW51ZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGVja0ZvclVwZ3JhZGVGbjtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZ3JhZGVQcm9taXNlID0gY2xpLnVwZ3JhZGVSb29tKHJvb21JZCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgdG8gd2FpdCBmb3IgdGhlIGpzLXNkayB0byBnaXZlIHVzIHRoZSByb29tIGJhY2sgc29cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGNhbiBtb3JlIGVmZmVjdGl2ZWx5IGFidXNlIHRoZSBNdWx0aUludml0ZXIgYmVoYXZpb3VyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGljaCBoZWF2aWx5IHJlbGllcyBvbiB0aGUgUm9vbSBvYmplY3QgYmVpbmcgYXZhaWxhYmxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3AuaW52aXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tGb3JVcGdyYWRlRm4gPSBhc3luYyAobmV3Um9vbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdXBncmFkZVByb21pc2Ugc2hvdWxkIGJlIGRvbmUgYnkgdGhlIHRpbWUgd2UgYXdhaXQgaXQgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50X3Jvb206IG5ld1Jvb21JZH0gPSBhd2FpdCB1cGdyYWRlUHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1Jvb20ucm9vbUlkICE9PSBuZXdSb29tSWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b0ludml0ZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnJvb20uZ2V0TWVtYmVyc1dpdGhNZW1iZXJzaGlwKFwiam9pblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnJvb20uZ2V0TWVtYmVyc1dpdGhNZW1iZXJzaGlwKFwiaW52aXRlXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLm1hcChtID0+IG0udXNlcklkKS5maWx0ZXIobSA9PiBtICE9PSBjbGkuZ2V0VXNlcklkKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b0ludml0ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFcnJvcnMgYXJlIGhhbmRsZWQgaW50ZXJuYWxseSB0byB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbnZpdGVVc2Vyc1RvUm9vbShuZXdSb29tSWQsIHRvSW52aXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcignUm9vbScsIGNoZWNrRm9yVXBncmFkZUZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaS5vbignUm9vbScsIGNoZWNrRm9yVXBncmFkZUZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBhd2FpdCBhZnRlciBzbyB0aGF0IHRoZSBjaGVja0ZvclVwZ3JhZGVzRm4gaGFzIGEgcHJvcGVyIHJlZmVyZW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gdGhlIG5ldyByb29tJ3MgSUQuXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB1cGdyYWRlUHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrRm9yVXBncmFkZUZuKSBjbGkucmVtb3ZlTGlzdGVuZXIoJ1Jvb20nLCBjaGVja0ZvclVwZ3JhZGVGbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5FcnJvckRpYWxvZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2xhc2ggQ29tbWFuZHMnLCAncm9vbSB1cGdyYWRlIGVycm9yJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0Vycm9yIHVwZ3JhZGluZyByb29tJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRG91YmxlIGNoZWNrIHRoYXQgeW91ciBzZXJ2ZXIgc3VwcG9ydHMgdGhlIHJvb20gdmVyc2lvbiBjaG9zZW4gYW5kIHRyeSBhZ2Fpbi4nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzYWdlKCkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWRtaW4sXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnbmljaycsXG4gICAgICAgIGFyZ3M6ICc8ZGlzcGxheV9uYW1lPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0NoYW5nZXMgeW91ciBkaXNwbGF5IG5pY2tuYW1lJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldERpc3BsYXlOYW1lKGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFjdGlvbnMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnbXlyb29tbmljaycsXG4gICAgICAgIGFsaWFzZXM6IFsncm9vbW5pY2snXSxcbiAgICAgICAgYXJnczogJzxkaXNwbGF5X25hbWU+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnQ2hhbmdlcyB5b3VyIGRpc3BsYXkgbmlja25hbWUgaW4gdGhlIGN1cnJlbnQgcm9vbSBvbmx5JyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ID0gY2xpLmdldFJvb20ocm9vbUlkKS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5tZW1iZXInLCBjbGkuZ2V0VXNlcklkKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmV2ID8gZXYuZ2V0Q29udGVudCgpIDogeyBtZW1iZXJzaGlwOiAnam9pbicgfSxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheW5hbWU6IGFyZ3MsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcyhjbGkuc2VuZFN0YXRlRXZlbnQocm9vbUlkLCAnbS5yb29tLm1lbWJlcicsIGNvbnRlbnQsIGNsaS5nZXRVc2VySWQoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzYWdlKCkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWN0aW9ucyxcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdyb29tYXZhdGFyJyxcbiAgICAgICAgYXJnczogJ1s8bXhjX3VybD5dJyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnQ2hhbmdlcyB0aGUgYXZhdGFyIG9mIHRoZSBjdXJyZW50IHJvb20nKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoYXJncyk7XG4gICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlID0gc2luZ2xlTXhjVXBsb2FkKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKHByb21pc2UudGhlbigodXJsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF1cmwpIHJldHVybjtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnNlbmRTdGF0ZUV2ZW50KHJvb21JZCwgJ20ucm9vbS5hdmF0YXInLCB7dXJsfSwgJycpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWN0aW9ucyxcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdteXJvb21hdmF0YXInLFxuICAgICAgICBhcmdzOiAnWzxteGNfdXJsPl0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdDaGFuZ2VzIHlvdXIgYXZhdGFyIGluIHRoaXMgY3VycmVudCByb29tIG9ubHknKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IGNsaS5nZXRSb29tKHJvb21JZCk7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSBjbGkuZ2V0VXNlcklkKCk7XG5cbiAgICAgICAgICAgIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZSA9IHNpbmdsZU14Y1VwbG9hZCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc3VjY2Vzcyhwcm9taXNlLnRoZW4oKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdXJsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZXYgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnbS5yb29tLm1lbWJlcicsIHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZXYgPyBldi5nZXRDb250ZW50KCkgOiB7IG1lbWJlcnNoaXA6ICdqb2luJyB9LFxuICAgICAgICAgICAgICAgICAgICBhdmF0YXJfdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xpLnNlbmRTdGF0ZUV2ZW50KHJvb21JZCwgJ20ucm9vbS5tZW1iZXInLCBjb250ZW50LCB1c2VySWQpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWN0aW9ucyxcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdteWF2YXRhcicsXG4gICAgICAgIGFyZ3M6ICdbPG14Y191cmw+XScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0NoYW5nZXMgeW91ciBhdmF0YXIgaW4gYWxsIHJvb21zJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZSA9IHNpbmdsZU14Y1VwbG9hZCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc3VjY2Vzcyhwcm9taXNlLnRoZW4oKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdXJsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRBdmF0YXJVcmwodXJsKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFjdGlvbnMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAndG9waWMnLFxuICAgICAgICBhcmdzOiAnWzx0b3BpYz5dJyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnR2V0cyBvciBzZXRzIHRoZSByb29tIHRvcGljJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoY2xpLnNldFJvb21Ub3BpYyhyb29tSWQsIGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJvb20gPSBjbGkuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICAgICAgaWYgKCFyb29tKSByZXR1cm4gcmVqZWN0KF90KFwiRmFpbGVkIHRvIHNldCB0b3BpY1wiKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljRXZlbnRzID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS50b3BpYycsICcnKTtcbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gdG9waWNFdmVudHMgJiYgdG9waWNFdmVudHMuZ2V0Q29udGVudCgpLnRvcGljO1xuICAgICAgICAgICAgY29uc3QgdG9waWNIdG1sID0gdG9waWMgPyBsaW5raWZ5QW5kU2FuaXRpemVIdG1sKHRvcGljKSA6IF90KCdUaGlzIHJvb20gaGFzIG5vIHRvcGljLicpO1xuXG4gICAgICAgICAgICBjb25zdCBJbmZvRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5JbmZvRGlhbG9nJyk7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTbGFzaCBDb21tYW5kcycsICdUb3BpYycsIEluZm9EaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogcm9vbS5uYW1lLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiA8ZGl2IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogdG9waWNIdG1sIH19IC8+LFxuICAgICAgICAgICAgICAgIGhhc0Nsb3NlQnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWRtaW4sXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAncm9vbW5hbWUnLFxuICAgICAgICBhcmdzOiAnPG5hbWU+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnU2V0cyB0aGUgcm9vbSBuYW1lJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldFJvb21OYW1lKHJvb21JZCwgYXJncykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzYWdlKCkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWRtaW4sXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnaW52aXRlJyxcbiAgICAgICAgYXJnczogJzx1c2VyLWlkPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0ludml0ZXMgdXNlciB3aXRoIGdpdmVuIGlkIHRvIGN1cnJlbnQgcm9vbScpLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBhcmdzLm1hdGNoKC9eKFxcUyspJC8pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHVzZSBhIE11bHRpSW52aXRlciB0byByZS11c2UgdGhlIGludml0ZSBsb2dpYywgZXZlbiB0aG91Z2hcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgb25seSBpbnZpdGluZyBvbmUgdXNlci5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkcmVzcyA9IG1hdGNoZXNbMV07XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIG5lZWQgYW4gaWRlbnRpdHkgc2VydmVyIGJ1dCBkb24ndCBoYXZlIG9uZSwgdGhpbmdzXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCBhIGJpdCBtb3JlIGNvbXBsZXggaGVyZSwgYnV0IHdlIHRyeSB0byBzaG93IHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBtZWFuaW5nZnVsLlxuICAgICAgICAgICAgICAgICAgICBsZXQgZmluaXNoZWQgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QWRkcmVzc1R5cGUoYWRkcmVzcykgPT09ICdlbWFpbCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwoKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRJZGVudGl0eVNlcnZlclVybCA9IGdldERlZmF1bHRJZGVudGl0eVNlcnZlclVybCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRJZGVudGl0eVNlcnZlclVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh7IGZpbmlzaGVkIH0gPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTbGFzaCBDb21tYW5kcycsICdJZGVudGl0eSBzZXJ2ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVXNlIGFuIGlkZW50aXR5IHNlcnZlclwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJVc2UgYW4gaWRlbnRpdHkgc2VydmVyIHRvIGludml0ZSBieSBlbWFpbC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ2xpY2sgY29udGludWUgdG8gdXNlIHRoZSBkZWZhdWx0IGlkZW50aXR5IHNlcnZlciBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIoJShkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJOYW1lKXMpIG9yIG1hbmFnZSBpbiBTZXR0aW5ncy5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRJZGVudGl0eVNlcnZlck5hbWU6IGFiYnJldmlhdGVVcmwoZGVmYXVsdElkZW50aXR5U2VydmVyVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX08L3A+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uOiBfdChcIkNvbnRpbnVlXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluaXNoZWQgPSBmaW5pc2hlZC50aGVuKChbdXNlRGVmYXVsdF06IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlRGVmYXVsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlRGVmYXVsdElkZW50aXR5U2VydmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKF90KFwiVXNlIGFuIGlkZW50aXR5IHNlcnZlciB0byBpbnZpdGUgYnkgZW1haWwuIE1hbmFnZSBpbiBTZXR0aW5ncy5cIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KF90KFwiVXNlIGFuIGlkZW50aXR5IHNlcnZlciB0byBpbnZpdGUgYnkgZW1haWwuIE1hbmFnZSBpbiBTZXR0aW5ncy5cIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludml0ZXIgPSBuZXcgTXVsdGlJbnZpdGVyKHJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKGZpbmlzaGVkLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludml0ZXIuaW52aXRlKFthZGRyZXNzXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludml0ZXIuZ2V0Q29tcGxldGlvblN0YXRlKGFkZHJlc3MpICE9PSBcImludml0ZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihpbnZpdGVyLmdldEVycm9yVGV4dChhZGRyZXNzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5hY3Rpb25zLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2pvaW4nLFxuICAgICAgICBhbGlhc2VzOiBbJ2onLCAnZ290byddLFxuICAgICAgICBhcmdzOiAnPHJvb20tYWxpYXM+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnSm9pbnMgcm9vbSB3aXRoIGdpdmVuIGFsaWFzJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihfLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIC8vIE5vdGU6IHdlIHN1cHBvcnQgMiB2ZXJzaW9ucyBvZiB0aGlzIGNvbW1hbmQuIFRoZSBmaXJzdCBpc1xuICAgICAgICAgICAgICAgIC8vIHRoZSBwdWJsaWMtZmFjaW5nIG9uZSBmb3IgbW9zdCB1c2VycyBhbmQgdGhlIG90aGVyIGlzIGFcbiAgICAgICAgICAgICAgICAvLyBwb3dlci11c2VyIGVkaXRpb24gd2hlcmUgc29tZW9uZSBtYXkgam9pbiB2aWEgcGVybWFsaW5rIG9yXG4gICAgICAgICAgICAgICAgLy8gcm9vbSBJRCB3aXRoIG9wdGlvbmFsIHNlcnZlcnMuIFByYWN0aWNhbGx5LCB0aGlzIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZm9sbG93aW5nIHZhcmlhdGlvbnM6XG4gICAgICAgICAgICAgICAgLy8gICAvam9pbiAjZXhhbXBsZTpleGFtcGxlLm9yZ1xuICAgICAgICAgICAgICAgIC8vICAgL2pvaW4gIWV4YW1wbGU6ZXhhbXBsZS5vcmdcbiAgICAgICAgICAgICAgICAvLyAgIC9qb2luICFleGFtcGxlOmV4YW1wbGUub3JnIGFsdHNlcnZlci5jb20gZWxzZXdoZXJlLmNhXG4gICAgICAgICAgICAgICAgLy8gICAvam9pbiBodHRwczovL21hdHJpeC50by8jLyFleGFtcGxlOmV4YW1wbGUub3JnP3ZpYT1hbHRzZXJ2ZXIuY29tXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNvbW1hbmQgYWxzbyBzdXBwb3J0cyBldmVudCBwZXJtYWxpbmtzIHRyYW5zcGFyZW50bHk6XG4gICAgICAgICAgICAgICAgLy8gICAvam9pbiBodHRwczovL21hdHJpeC50by8jLyFleGFtcGxlOmV4YW1wbGUub3JnLyRzb21ldGhpbmc6ZXhhbXBsZS5vcmdcbiAgICAgICAgICAgICAgICAvLyAgIC9qb2luIGh0dHBzOi8vbWF0cml4LnRvLyMvIWV4YW1wbGU6ZXhhbXBsZS5vcmcvJHNvbWV0aGluZzpleGFtcGxlLm9yZz92aWE9YWx0c2VydmVyLmNvbVxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGFyZ3Muc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA8IDEpIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcblxuICAgICAgICAgICAgICAgIGxldCBpc1Blcm1hbGluayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbXNbMF0uc3RhcnRzV2l0aChcImh0dHA6XCIpIHx8IHBhcmFtc1swXS5zdGFydHNXaXRoKFwiaHR0cHM6XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgYXQgbGVhc3QgYSBVUkwgLSB0cnkgYW5kIHB1bGwgb3V0IGEgaG9zdG5hbWUgdG8gY2hlY2sgYWdhaW5zdCB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcGVybWFsaW5rIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTChwYXJhbXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBob3N0bmFtZSA9IHBhcnNlZFVybC5ob3N0IHx8IHBhcnNlZFVybC5ob3N0bmFtZTsgLy8gdGFrZXMgZmlyc3Qgbm9uLWZhbHNleSB2YWx1ZVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlJ3JlIHVzaW5nIGEgUmlvdCBwZXJtYWxpbmsgaGFuZGxlciwgdGhpcyB3aWxsIGNhdGNoIGl0IGJlZm9yZSB3ZSBnZXQgbXVjaCBmdXJ0aGVyLlxuICAgICAgICAgICAgICAgICAgICAvLyBzZWUgYmVsb3cgd2hlcmUgd2UgbWFrZSBhc3N1bXB0aW9ucyBhYm91dCBwYXJzaW5nIHRoZSBVUkwuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Blcm1hbGlua0hvc3QoaG9zdG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1Blcm1hbGluayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtc1swXVswXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByb29tQWxpYXMgPSBwYXJhbXNbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghcm9vbUFsaWFzLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21BbGlhcyArPSAnOicgKyBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0RG9tYWluKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21fYWxpYXM6IHJvb21BbGlhcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9fam9pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJhbXNbMF1bMF0gPT09ICchJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb29tSWQgPSBwYXJhbXNbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpYVNlcnZlcnMgPSBwYXJhbXMuc3BsaWNlKDApO1xuXG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBwYXNzZWQgZG93biB0byB0aGUganMtc2RrJ3MgL2pvaW4gY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpYVNlcnZlcnM6IHZpYVNlcnZlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlhX3NlcnZlcnM6IHZpYVNlcnZlcnMsIC8vIGZvciB0aGUgcmVqb2luIGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b19qb2luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzUGVybWFsaW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBlcm1hbGlua1BhcnRzID0gcGFyc2VQZXJtYWxpbmsocGFyYW1zWzBdKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGNoZWNrIHRlY2huaWNhbGx5IGlzbid0IG5lZWRlZCBiZWNhdXNlIHdlIGFscmVhZHkgZGlkIG91clxuICAgICAgICAgICAgICAgICAgICAvLyBzYWZldHkgY2hlY2tzIHVwIGFib3ZlLiBIb3dldmVyLCBmb3IgZ29vZCBtZWFzdXJlLCBsZXQncyBiZSBzdXJlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlcm1hbGlua1BhcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBmb3Igc29tZSByZWFzb24gc29tZW9uZSB3YW50ZWQgdG8gam9pbiBhIGdyb3VwIG9yIHVzZXIsIHdlIHNob3VsZFxuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHRoZW0gbm93LlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlcm1hbGlua1BhcnRzLnJvb21JZE9yQWxpYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHBlcm1hbGlua1BhcnRzLnJvb21JZE9yQWxpYXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpYVNlcnZlcnMgPSBwZXJtYWxpbmtQYXJ0cy52aWFTZXJ2ZXJzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudElkID0gcGVybWFsaW5rUGFydHMuZXZlbnRJZDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwYXRjaCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvX2pvaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVswXSA9PT0gJyEnKSBkaXNwYXRjaFtcInJvb21faWRcIl0gPSBlbnRpdHk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZGlzcGF0Y2hbXCJyb29tX2FsaWFzXCJdID0gZW50aXR5O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaFtcImV2ZW50X2lkXCJdID0gZXZlbnRJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoW1wiaGlnaGxpZ2h0ZWRcIl0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZpYVNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciB0aGUgam9pblxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2hbXCJvcHRzXCJdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBwYXNzZWQgZG93biB0byB0aGUganMtc2RrJ3MgL2pvaW4gY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpYVNlcnZlcnM6IHZpYVNlcnZlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgaWYgdGhlIGpvaW4gZmFpbHMgKHJlam9pbiBidXR0b24pXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaFsndmlhX3NlcnZlcnMnXSA9IHZpYVNlcnZlcnM7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goZGlzcGF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFjdGlvbnMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAncGFydCcsXG4gICAgICAgIGFyZ3M6ICdbPHJvb20tYWxpYXM+XScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0xlYXZlIHJvb20nKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgICAgICBsZXQgdGFyZ2V0Um9vbUlkO1xuICAgICAgICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrKSQvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcm9vbUFsaWFzID0gbWF0Y2hlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvb21BbGlhc1swXSAhPT0gJyMnKSByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyb29tQWxpYXMuaW5jbHVkZXMoJzonKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbUFsaWFzICs9ICc6JyArIGNsaS5nZXREb21haW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIGEgcm9vbSB3aXRoIHRoaXMgYWxpYXNcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vbXMgPSBjbGkuZ2V0Um9vbXMoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpYXNFdmVudHMgPSByb29tc1tpXS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5hbGlhc2VzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFsaWFzRXZlbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpYXNlcyA9IGFsaWFzRXZlbnRzW2pdLmdldENvbnRlbnQoKS5hbGlhc2VzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYWxpYXNlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxpYXNlc1trXSA9PT0gcm9vbUFsaWFzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSb29tSWQgPSByb29tc1tpXS5yb29tSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Um9vbUlkKSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRSb29tSWQpIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0Um9vbUlkKSByZXR1cm4gcmVqZWN0KF90KCdVbnJlY29nbmlzZWQgcm9vbSBhbGlhczonKSArICcgJyArIHJvb21BbGlhcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRhcmdldFJvb21JZCkgdGFyZ2V0Um9vbUlkID0gcm9vbUlkO1xuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoXG4gICAgICAgICAgICAgICAgY2xpLmxlYXZlUm9vbUNoYWluKHRhcmdldFJvb21JZCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd2aWV3X25leHRfcm9vbSd9KTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5hY3Rpb25zLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2tpY2snLFxuICAgICAgICBhcmdzOiAnPHVzZXItaWQ+IFtyZWFzb25dJyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnS2lja3MgdXNlciB3aXRoIGdpdmVuIGlkJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGFyZ3MubWF0Y2goL14oXFxTKz8pKCArKC4qKSk/JC8pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5raWNrKHJvb21JZCwgbWF0Y2hlc1sxXSwgbWF0Y2hlc1szXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkbWluLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2JhbicsXG4gICAgICAgIGFyZ3M6ICc8dXNlci1pZD4gW3JlYXNvbl0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdCYW5zIHVzZXIgd2l0aCBnaXZlbiBpZCcpLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBhcmdzLm1hdGNoKC9eKFxcUys/KSggKyguKikpPyQvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcyhNYXRyaXhDbGllbnRQZWcuZ2V0KCkuYmFuKHJvb21JZCwgbWF0Y2hlc1sxXSwgbWF0Y2hlc1szXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkbWluLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ3VuYmFuJyxcbiAgICAgICAgYXJnczogJzx1c2VyLWlkPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ1VuYmFucyB1c2VyIHdpdGggZ2l2ZW4gSUQnKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrKSQvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgdXNlciBtZW1iZXJzaGlwIHRvIFwibGVhdmVcIiB0byB1bmJhbiBoaW1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoTWF0cml4Q2xpZW50UGVnLmdldCgpLnVuYmFuKHJvb21JZCwgbWF0Y2hlc1sxXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkbWluLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2lnbm9yZScsXG4gICAgICAgIGFyZ3M6ICc8dXNlci1pZD4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdJZ25vcmVzIGEgdXNlciwgaGlkaW5nIHRoZWlyIG1lc3NhZ2VzIGZyb20geW91JyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGFyZ3MubWF0Y2goL14oXFxTKykkLyk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcklkID0gbWF0Y2hlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaWdub3JlZFVzZXJzID0gY2xpLmdldElnbm9yZWRVc2VycygpO1xuICAgICAgICAgICAgICAgICAgICBpZ25vcmVkVXNlcnMucHVzaCh1c2VySWQpOyAvLyBkZS1kdXBlZCBpbnRlcm5hbGx5IGluIHRoZSBqcy1zZGtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGkuc2V0SWdub3JlZFVzZXJzKGlnbm9yZWRVc2VycykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgSW5mb0RpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuSW5mb0RpYWxvZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1NsYXNoIENvbW1hbmRzJywgJ1VzZXIgaWdub3JlZCcsIEluZm9EaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdJZ25vcmVkIHVzZXInKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cD57IF90KCdZb3UgYXJlIG5vdyBpZ25vcmluZyAlKHVzZXJJZClzJywge3VzZXJJZH0pIH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFjdGlvbnMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAndW5pZ25vcmUnLFxuICAgICAgICBhcmdzOiAnPHVzZXItaWQ+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnU3RvcHMgaWdub3JpbmcgYSB1c2VyLCBzaG93aW5nIHRoZWlyIG1lc3NhZ2VzIGdvaW5nIGZvcndhcmQnKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrKSQvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpZ25vcmVkVXNlcnMgPSBjbGkuZ2V0SWdub3JlZFVzZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaWdub3JlZFVzZXJzLmluZGV4T2YodXNlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgaWdub3JlZFVzZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpLnNldElnbm9yZWRVc2VycyhpZ25vcmVkVXNlcnMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEluZm9EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkluZm9EaWFsb2cnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTbGFzaCBDb21tYW5kcycsICdVc2VyIHVuaWdub3JlZCcsIEluZm9EaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdVbmlnbm9yZWQgdXNlcicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwPnsgX3QoJ1lvdSBhcmUgbm8gbG9uZ2VyIGlnbm9yaW5nICUodXNlcklkKXMnLCB7dXNlcklkfSkgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzYWdlKCkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWN0aW9ucyxcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdvcCcsXG4gICAgICAgIGFyZ3M6ICc8dXNlci1pZD4gWzxwb3dlci1sZXZlbD5dJyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnRGVmaW5lIHRoZSBwb3dlciBsZXZlbCBvZiBhIHVzZXInKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrPykoICsoLT9cXGQrKSk/JC8pO1xuICAgICAgICAgICAgICAgIGxldCBwb3dlckxldmVsID0gNTA7IC8vIGRlZmF1bHQgcG93ZXIgbGV2ZWwgZm9yIG9wXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcklkID0gbWF0Y2hlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSA0ICYmIHVuZGVmaW5lZCAhPT0gbWF0Y2hlc1szXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG93ZXJMZXZlbCA9IHBhcnNlSW50KG1hdGNoZXNbM10sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKHBvd2VyTGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByb29tID0gY2xpLmdldFJvb20ocm9vbUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcm9vbSkgcmV0dXJuIHJlamVjdChfdChcIkNvbW1hbmQgZmFpbGVkXCIpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcG93ZXJMZXZlbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5wb3dlcl9sZXZlbHMnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBvd2VyTGV2ZWxFdmVudC5nZXRDb250ZW50KCkudXNlcnNbYXJnc10pIHJldHVybiByZWplY3QoX3QoXCJDb3VsZCBub3QgZmluZCB1c2VyIGluIHJvb21cIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoY2xpLnNldFBvd2VyTGV2ZWwocm9vbUlkLCB1c2VySWQsIHBvd2VyTGV2ZWwsIHBvd2VyTGV2ZWxFdmVudCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzYWdlKCkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWRtaW4sXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnZGVvcCcsXG4gICAgICAgIGFyZ3M6ICc8dXNlci1pZD4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKCdEZW9wcyB1c2VyIHdpdGggZ2l2ZW4gaWQnKSxcbiAgICAgICAgcnVuRm46IGZ1bmN0aW9uKHJvb21JZCwgYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrKSQvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb20gPSBjbGkuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJvb20pIHJldHVybiByZWplY3QoX3QoXCJDb21tYW5kIGZhaWxlZFwiKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG93ZXJMZXZlbEV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5wb3dlcl9sZXZlbHMnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcG93ZXJMZXZlbEV2ZW50LmdldENvbnRlbnQoKS51c2Vyc1thcmdzXSkgcmV0dXJuIHJlamVjdChfdChcIkNvdWxkIG5vdCBmaW5kIHVzZXIgaW4gcm9vbVwiKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKGNsaS5zZXRQb3dlckxldmVsKHJvb21JZCwgYXJncywgdW5kZWZpbmVkLCBwb3dlckxldmVsRXZlbnQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5hZG1pbixcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdkZXZ0b29scycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ09wZW5zIHRoZSBEZXZlbG9wZXIgVG9vbHMgZGlhbG9nJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgICAgIGNvbnN0IERldnRvb2xzRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5EZXZ0b29sc0RpYWxvZycpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlRGlhbG9nKERldnRvb2xzRGlhbG9nLCB7cm9vbUlkfSk7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWR2YW5jZWQsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnYWRkd2lkZ2V0JyxcbiAgICAgICAgYXJnczogJzx1cmwgfCBlbWJlZCBjb2RlIHwgSml0c2kgdXJsPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0FkZHMgYSBjdXN0b20gd2lkZ2V0IGJ5IFVSTCB0byB0aGUgcm9vbScpLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCB3aWRnZXRVcmwpIHtcbiAgICAgICAgICAgIGlmICghd2lkZ2V0VXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChfdChcIlBsZWFzZSBzdXBwbHkgYSB3aWRnZXQgVVJMIG9yIGVtYmVkIGNvZGVcIikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcnkgYW5kIHBhcnNlIG91dCBhIHdpZGdldCBVUkwgZnJvbSBpZnJhbWVzXG4gICAgICAgICAgICBpZiAod2lkZ2V0VXJsLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcIjxpZnJhbWUgXCIpKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgdXNlIHBhcnNlNSwgd2hpY2ggZG9lc24ndCByZW5kZXIvY3JlYXRlIGEgRE9NIG5vZGUuIEl0IGluc3RlYWQgcnVuc1xuICAgICAgICAgICAgICAgIC8vIHNvbWUgc3VwZXJmYXN0IHJlZ2V4IG92ZXIgdGhlIHRleHQgc28gd2UgZG9uJ3QgaGF2ZSB0by5cbiAgICAgICAgICAgICAgICBjb25zdCBlbWJlZCA9IHBhcnNlSHRtbCh3aWRnZXRVcmwpO1xuICAgICAgICAgICAgICAgIGlmIChlbWJlZCAmJiBlbWJlZC5jaGlsZE5vZGVzICYmIGVtYmVkLmNoaWxkTm9kZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlmcmFtZSA9IGVtYmVkLmNoaWxkTm9kZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZnJhbWUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnaWZyYW1lJyAmJiBpZnJhbWUuYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNyY0F0dHIgPSBpZnJhbWUuYXR0cnMuZmluZChhID0+IGEubmFtZSA9PT0gJ3NyYycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQdWxsaW5nIFVSTCBvdXQgb2YgaWZyYW1lIChlbWJlZCBjb2RlKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZGdldFVybCA9IHNyY0F0dHIudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghd2lkZ2V0VXJsLnN0YXJ0c1dpdGgoXCJodHRwczovL1wiKSAmJiAhd2lkZ2V0VXJsLnN0YXJ0c1dpdGgoXCJodHRwOi8vXCIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChfdChcIlBsZWFzZSBzdXBwbHkgYSBodHRwczovLyBvciBodHRwOi8vIHdpZGdldCBVUkxcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFdpZGdldFV0aWxzLmNhblVzZXJNb2RpZnlXaWRnZXRzKHJvb21JZCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm93TXMgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHdpZGdldElkID0gZW5jb2RlVVJJQ29tcG9uZW50KGAke3Jvb21JZH1fJHt1c2VySWR9XyR7bm93TXN9YCk7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBXaWRnZXRUeXBlLkNVU1RPTTtcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IFwiQ3VzdG9tIFdpZGdldFwiO1xuICAgICAgICAgICAgICAgIGxldCBkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHRoZSB3aWRnZXQgYSBKaXRzaSB3aWRnZXQgaWYgaXQgbG9va3MgbGlrZSBhIEppdHNpIHdpZGdldFxuICAgICAgICAgICAgICAgIGNvbnN0IGppdHNpRGF0YSA9IEppdHNpLmdldEluc3RhbmNlKCkucGFyc2VQcmVmZXJyZWRDb25mZXJlbmNlVXJsKHdpZGdldFVybCk7XG4gICAgICAgICAgICAgICAgaWYgKGppdHNpRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1ha2luZyAvYWRkd2lkZ2V0IHdpZGdldCBhIEppdHNpIGNvbmZlcmVuY2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBXaWRnZXRUeXBlLkpJVFNJO1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gXCJKaXRzaSBDb25mZXJlbmNlXCI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBqaXRzaURhdGE7XG4gICAgICAgICAgICAgICAgICAgIHdpZGdldFVybCA9IFdpZGdldFV0aWxzLmdldExvY2FsSml0c2lXcmFwcGVyVXJsKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoV2lkZ2V0VXRpbHMuc2V0Um9vbVdpZGdldChyb29tSWQsIHdpZGdldElkLCB0eXBlLCB3aWRnZXRVcmwsIG5hbWUsIGRhdGEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChfdChcIllvdSBjYW5ub3QgbW9kaWZ5IHdpZGdldHMgaW4gdGhpcyByb29tLlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5hZG1pbixcbiAgICB9KSxcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICd2ZXJpZnknLFxuICAgICAgICBhcmdzOiAnPHVzZXItaWQ+IDxkZXZpY2UtaWQ+IDxkZXZpY2Utc2lnbmluZy1rZXk+JyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnVmVyaWZpZXMgYSB1c2VyLCBzZXNzaW9uLCBhbmQgcHVia2V5IHR1cGxlJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGFyZ3MubWF0Y2goL14oXFxTKykgKyhcXFMrKSArKFxcUyspJC8pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VJZCA9IG1hdGNoZXNbMl07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbmdlcnByaW50ID0gbWF0Y2hlc1szXTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcygoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlID0gY2xpLmdldFN0b3JlZERldmljZSh1c2VySWQsIGRldmljZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGV2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKF90KCdVbmtub3duICh1c2VyLCBzZXNzaW9uKSBwYWlyOicpICsgYCAoJHt1c2VySWR9LCAke2RldmljZUlkfSlgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRldmljZVRydXN0ID0gYXdhaXQgY2xpLmNoZWNrRGV2aWNlVHJ1c3QodXNlcklkLCBkZXZpY2VJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXZpY2VUcnVzdC5pc1ZlcmlmaWVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGV2aWNlLmdldEZpbmdlcnByaW50KCkgPT09IGZpbmdlcnByaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihfdCgnU2Vzc2lvbiBhbHJlYWR5IHZlcmlmaWVkIScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoX3QoJ1dBUk5JTkc6IFNlc3Npb24gYWxyZWFkeSB2ZXJpZmllZCwgYnV0IGtleXMgZG8gTk9UIE1BVENIIScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXZpY2UuZ2V0RmluZ2VycHJpbnQoKSAhPT0gZmluZ2VycHJpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmcHJpbnQgPSBkZXZpY2UuZ2V0RmluZ2VycHJpbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90KCdXQVJOSU5HOiBLRVkgVkVSSUZJQ0FUSU9OIEZBSUxFRCEgVGhlIHNpZ25pbmcga2V5IGZvciAlKHVzZXJJZClzIGFuZCBzZXNzaW9uJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICUoZGV2aWNlSWQpcyBpcyBcIiUoZnByaW50KXNcIiB3aGljaCBkb2VzIG5vdCBtYXRjaCB0aGUgcHJvdmlkZWQga2V5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wiJShmaW5nZXJwcmludClzXCIuIFRoaXMgY291bGQgbWVhbiB5b3VyIGNvbW11bmljYXRpb25zIGFyZSBiZWluZyBpbnRlcmNlcHRlZCEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZwcmludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluZ2VycHJpbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaS5zZXREZXZpY2VWZXJpZmllZCh1c2VySWQsIGRldmljZUlkLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGVsbCB0aGUgdXNlciB3ZSB2ZXJpZmllZCBldmVyeXRoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBJbmZvRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgnZGlhbG9ncy5JbmZvRGlhbG9nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdTbGFzaCBDb21tYW5kcycsICdWZXJpZmllZCBrZXknLCBJbmZvRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdWZXJpZmllZCBrZXknKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3QoJ1RoZSBzaWduaW5nIGtleSB5b3UgcHJvdmlkZWQgbWF0Y2hlcyB0aGUgc2lnbmluZyBrZXkgeW91IHJlY2VpdmVkICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZnJvbSAlKHVzZXJJZClzXFwncyBzZXNzaW9uICUoZGV2aWNlSWQpcy4gU2Vzc2lvbiBtYXJrZWQgYXMgdmVyaWZpZWQuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3VzZXJJZCwgZGV2aWNlSWR9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkdmFuY2VkLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogJ2Rpc2NhcmRzZXNzaW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZCgnRm9yY2VzIHRoZSBjdXJyZW50IG91dGJvdW5kIGdyb3VwIHNlc3Npb24gaW4gYW4gZW5jcnlwdGVkIHJvb20gdG8gYmUgZGlzY2FyZGVkJyksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmZvcmNlRGlzY2FyZFNlc3Npb24ocm9vbUlkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWR2YW5jZWQsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiBcInJhaW5ib3dcIixcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZChcIlNlbmRzIHRoZSBnaXZlbiBtZXNzYWdlIGNvbG91cmVkIGFzIGEgcmFpbmJvd1wiKSxcbiAgICAgICAgYXJnczogJzxtZXNzYWdlPicsXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmICghYXJncykgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kSHRtbE1lc3NhZ2Uocm9vbUlkLCBhcmdzLCB0ZXh0VG9IdG1sUmFpbmJvdyhhcmdzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMubWVzc2FnZXMsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiBcInJhaW5ib3dtZVwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKFwiU2VuZHMgdGhlIGdpdmVuIGVtb3RlIGNvbG91cmVkIGFzIGEgcmFpbmJvd1wiKSxcbiAgICAgICAgYXJnczogJzxtZXNzYWdlPicsXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihyb29tSWQsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmICghYXJncykgcmV0dXJuIHJlamVjdCh0aGlzLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kSHRtbEVtb3RlKHJvb21JZCwgYXJncywgdGV4dFRvSHRtbFJhaW5ib3coYXJncykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLm1lc3NhZ2VzLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogXCJoZWxwXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoXCJEaXNwbGF5cyBsaXN0IG9mIGNvbW1hbmRzIHdpdGggdXNhZ2VzIGFuZCBkZXNjcmlwdGlvbnNcIiksXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IFNsYXNoQ29tbWFuZEhlbHBEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLlNsYXNoQ29tbWFuZEhlbHBEaWFsb2cnKTtcblxuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2xhc2ggQ29tbWFuZHMnLCAnSGVscCcsIFNsYXNoQ29tbWFuZEhlbHBEaWFsb2cpO1xuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkdmFuY2VkLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogXCJ3aG9pc1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKFwiRGlzcGxheXMgaW5mb3JtYXRpb24gYWJvdXQgYSB1c2VyXCIpLFxuICAgICAgICBhcmdzOiBcIjx1c2VyLWlkPlwiLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCB1c2VySWQpIHtcbiAgICAgICAgICAgIGlmICghdXNlcklkIHx8ICF1c2VySWQuc3RhcnRzV2l0aChcIkBcIikgfHwgIXVzZXJJZC5pbmNsdWRlcyhcIjpcIikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHJvb21JZCkuZ2V0TWVtYmVyKHVzZXJJZCk7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2g8Vmlld1VzZXJQYXlsb2FkPih7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICAgICAgLy8gWFhYOiBXZSBzaG91bGQgYmUgdXNpbmcgYSByZWFsIG1lbWJlciBvYmplY3QgYW5kIG5vdCBhc3N1bWluZyB3aGF0IHRoZVxuICAgICAgICAgICAgICAgIC8vIHJlY2VpdmVyIHdhbnRzLlxuICAgICAgICAgICAgICAgIG1lbWJlcjogbWVtYmVyIHx8IHt1c2VySWR9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcygpO1xuICAgICAgICB9LFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMuYWR2YW5jZWQsXG4gICAgfSksXG4gICAgbmV3IENvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiBcInJhZ2VzaGFrZVwiLFxuICAgICAgICBhbGlhc2VzOiBbXCJidWdyZXBvcnRcIl0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoXCJTZW5kIGEgYnVnIHJlcG9ydCB3aXRoIGxvZ3NcIiksXG4gICAgICAgIGFyZ3M6IFwiPGRlc2NyaXB0aW9uPlwiLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcyhcbiAgICAgICAgICAgICAgICBzZW5kQnVnUmVwb3J0KFNka0NvbmZpZy5nZXQoKS5idWdfcmVwb3J0X2VuZHBvaW50X3VybCwge1xuICAgICAgICAgICAgICAgICAgICB1c2VyVGV4dDogYXJncyxcbiAgICAgICAgICAgICAgICAgICAgc2VuZExvZ3M6IHRydWUsXG4gICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEluZm9EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkluZm9EaWFsb2cnKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnU2xhc2ggQ29tbWFuZHMnLCAnUmFnZXNoYWtlIHNlbnQnLCBJbmZvRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0xvZ3Mgc2VudCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KCdUaGFuayB5b3UhJyksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFkdmFuY2VkLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogXCJxdWVyeVwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogX3RkKFwiT3BlbnMgY2hhdCB3aXRoIHRoZSBnaXZlbiB1c2VyXCIpLFxuICAgICAgICBhcmdzOiBcIjx1c2VyLWlkPlwiLFxuICAgICAgICBydW5GbjogZnVuY3Rpb24ocm9vbUlkLCB1c2VySWQpIHtcbiAgICAgICAgICAgIGlmICghdXNlcklkIHx8ICF1c2VySWQuc3RhcnRzV2l0aChcIkBcIikgfHwgIXVzZXJJZC5pbmNsdWRlcyhcIjpcIikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KHRoaXMuZ2V0VXNhZ2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzKChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogYXdhaXQgZW5zdXJlRE1FeGlzdHMoTWF0cml4Q2xpZW50UGVnLmdldCgpLCB1c2VySWQpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhdGVnb3J5OiBDb21tYW5kQ2F0ZWdvcmllcy5hY3Rpb25zLFxuICAgIH0pLFxuICAgIG5ldyBDb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogXCJtc2dcIixcbiAgICAgICAgZGVzY3JpcHRpb246IF90ZChcIlNlbmRzIGEgbWVzc2FnZSB0byB0aGUgZ2l2ZW4gdXNlclwiKSxcbiAgICAgICAgYXJnczogXCI8dXNlci1pZD4gPG1lc3NhZ2U+XCIsXG4gICAgICAgIHJ1bkZuOiBmdW5jdGlvbihfLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgICAgIC8vIG1hdGNoZXMgdGhlIGZpcnN0IHdoaXRlc3BhY2UgZGVsaW1pdGVkIGdyb3VwIGFuZCB0aGVuIHRoZSByZXN0IG9mIHRoZSBzdHJpbmdcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gYXJncy5tYXRjaCgvXihcXFMrPykoPzogKyguKikpPyQvcyk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3VzZXJJZCwgbXNnXSA9IG1hdGNoZXMuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cgJiYgdXNlcklkICYmIHVzZXJJZC5zdGFydHNXaXRoKFwiQFwiKSAmJiB1c2VySWQuaW5jbHVkZXMoXCI6XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcygoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByb29tSWQgPSBhd2FpdCBlbnN1cmVETUV4aXN0cyhjbGksIHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19yb29tJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaS5zZW5kVGV4dE1lc3NhZ2Uocm9vbUlkLCBtc2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZWplY3QodGhpcy5nZXRVc2FnZSgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2F0ZWdvcnk6IENvbW1hbmRDYXRlZ29yaWVzLmFjdGlvbnMsXG4gICAgfSksXG5cbiAgICAvLyBDb21tYW5kIGRlZmluaXRpb25zIGZvciBhdXRvY29tcGxldGlvbiBPTkxZOlxuICAgIC8vIC9tZSBpcyBzcGVjaWFsIGJlY2F1c2UgaXRzIG5vdCBoYW5kbGVkIGJ5IFNsYXNoQ29tbWFuZHMuanMgYW5kIGlzIGluc3RlYWQgZG9uZSBpbnNpZGUgdGhlIENvbXBvc2VyIGNsYXNzZXNcbiAgICBuZXcgQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6IFwibWVcIixcbiAgICAgICAgYXJnczogJzxtZXNzYWdlPicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBfdGQoJ0Rpc3BsYXlzIGFjdGlvbicpLFxuICAgICAgICBjYXRlZ29yeTogQ29tbWFuZENhdGVnb3JpZXMubWVzc2FnZXMsXG4gICAgICAgIGhpZGVDb21wbGV0aW9uQWZ0ZXJTcGFjZTogdHJ1ZSxcbiAgICB9KSxcbl07XG5cbi8vIGJ1aWxkIGEgbWFwIGZyb20gbmFtZXMgYW5kIGFsaWFzZXMgdG8gdGhlIENvbW1hbmQgb2JqZWN0cy5cbmV4cG9ydCBjb25zdCBDb21tYW5kTWFwID0gbmV3IE1hcCgpO1xuQ29tbWFuZHMuZm9yRWFjaChjbWQgPT4ge1xuICAgIENvbW1hbmRNYXAuc2V0KGNtZC5jb21tYW5kLCBjbWQpO1xuICAgIGNtZC5hbGlhc2VzLmZvckVhY2goYWxpYXMgPT4ge1xuICAgICAgICBDb21tYW5kTWFwLnNldChhbGlhcywgY21kKTtcbiAgICB9KTtcbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb21tYW5kU3RyaW5nKGlucHV0KSB7XG4gICAgLy8gdHJpbSBhbnkgdHJhaWxpbmcgd2hpdGVzcGFjZSwgYXMgaXQgY2FuIGNvbmZ1c2UgdGhlIHBhcnNlciBmb3JcbiAgICAvLyBJUkMtc3R5bGUgY29tbWFuZHNcbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1xccyskLywgJycpO1xuICAgIGlmIChpbnB1dFswXSAhPT0gJy8nKSByZXR1cm4gbnVsbDsgLy8gbm90IGEgY29tbWFuZFxuXG4gICAgY29uc3QgYml0cyA9IGlucHV0Lm1hdGNoKC9eKFxcUys/KSg/OiArKCgufFxcbikqKSk/JC8pO1xuICAgIGxldCBjbWQ7XG4gICAgbGV0IGFyZ3M7XG4gICAgaWYgKGJpdHMpIHtcbiAgICAgICAgY21kID0gYml0c1sxXS5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgYXJncyA9IGJpdHNbMl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY21kID0gaW5wdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtjbWQsIGFyZ3N9O1xufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIGdpdmVuIHRleHQgZm9yIC9jb21tYW5kcyBhbmQgcmV0dXJuIGEgYm91bmQgbWV0aG9kIHRvIHBlcmZvcm0gdGhlbS5cbiAqIEBwYXJhbSB7c3RyaW5nfSByb29tSWQgVGhlIHJvb20gaW4gd2hpY2ggdGhlIGNvbW1hbmQgd2FzIHBlcmZvcm1lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dCBUaGUgcmF3IHRleHQgaW5wdXQgYnkgdGhlIHVzZXIuXG4gKiBAcmV0dXJuIHtudWxsfGZ1bmN0aW9uKCk6IE9iamVjdH0gRnVuY3Rpb24gcmV0dXJuaW5nIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0eSAnZXJyb3InIGlmIHRoZXJlIHdhcyBhbiBlcnJvclxuICogcHJvY2Vzc2luZyB0aGUgY29tbWFuZCwgb3IgJ3Byb21pc2UnIGlmIGEgcmVxdWVzdCB3YXMgc2VudCBvdXQuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIGlucHV0IGRpZG4ndCBtYXRjaCBhIGNvbW1hbmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tYW5kKHJvb21JZCwgaW5wdXQpIHtcbiAgICBjb25zdCB7Y21kLCBhcmdzfSA9IHBhcnNlQ29tbWFuZFN0cmluZyhpbnB1dCk7XG5cbiAgICBpZiAoQ29tbWFuZE1hcC5oYXMoY21kKSkge1xuICAgICAgICByZXR1cm4gKCkgPT4gQ29tbWFuZE1hcC5nZXQoY21kKS5ydW4ocm9vbUlkLCBhcmdzLCBjbWQpO1xuICAgIH1cbn1cbiJdfQ==