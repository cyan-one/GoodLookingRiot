"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.textForEvent = textForEvent;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _CallHandler = _interopRequireDefault(require("./CallHandler"));

var _languageHandler = require("./languageHandler");

var Roles = _interopRequireWildcard(require("./Roles"));

var _RoomInvite = require("./RoomInvite");

var _SettingsStore = _interopRequireDefault(require("./settings/SettingsStore"));

var _BanList = require("./mjolnir/BanList");

/*
Copyright 2015, 2016 OpenMarket Ltd

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
function textForMemberEvent(ev) {
  // XXX: SYJS-16 "sender is sometimes null for join messages"
  const senderName = ev.sender ? ev.sender.name : ev.getSender();
  const targetName = ev.target ? ev.target.name : ev.getStateKey();
  const prevContent = ev.getPrevContent();
  const content = ev.getContent();

  const ConferenceHandler = _CallHandler.default.getConferenceHandler();

  const reason = content.reason ? (0, _languageHandler._t)('Reason') + ': ' + content.reason : '';

  switch (content.membership) {
    case 'invite':
      {
        const threePidContent = content.third_party_invite;

        if (threePidContent) {
          if (threePidContent.display_name) {
            return (0, _languageHandler._t)('%(targetName)s accepted the invitation for %(displayName)s.', {
              targetName,
              displayName: threePidContent.display_name
            });
          } else {
            return (0, _languageHandler._t)('%(targetName)s accepted an invitation.', {
              targetName
            });
          }
        } else {
          if (ConferenceHandler && ConferenceHandler.isConferenceUser(ev.getStateKey())) {
            return (0, _languageHandler._t)('%(senderName)s requested a VoIP conference.', {
              senderName
            });
          } else {
            return (0, _languageHandler._t)('%(senderName)s invited %(targetName)s.', {
              senderName,
              targetName
            });
          }
        }
      }

    case 'ban':
      return (0, _languageHandler._t)('%(senderName)s banned %(targetName)s.', {
        senderName,
        targetName
      }) + ' ' + reason;

    case 'join':
      if (prevContent && prevContent.membership === 'join') {
        if (prevContent.displayname && content.displayname && prevContent.displayname !== content.displayname) {
          return (0, _languageHandler._t)('%(oldDisplayName)s changed their display name to %(displayName)s.', {
            oldDisplayName: prevContent.displayname,
            displayName: content.displayname
          });
        } else if (!prevContent.displayname && content.displayname) {
          return (0, _languageHandler._t)('%(senderName)s set their display name to %(displayName)s.', {
            senderName: ev.getSender(),
            displayName: content.displayname
          });
        } else if (prevContent.displayname && !content.displayname) {
          return (0, _languageHandler._t)('%(senderName)s removed their display name (%(oldDisplayName)s).', {
            senderName,
            oldDisplayName: prevContent.displayname
          });
        } else if (prevContent.avatar_url && !content.avatar_url) {
          return (0, _languageHandler._t)('%(senderName)s removed their profile picture.', {
            senderName
          });
        } else if (prevContent.avatar_url && content.avatar_url && prevContent.avatar_url !== content.avatar_url) {
          return (0, _languageHandler._t)('%(senderName)s changed their profile picture.', {
            senderName
          });
        } else if (!prevContent.avatar_url && content.avatar_url) {
          return (0, _languageHandler._t)('%(senderName)s set a profile picture.', {
            senderName
          });
        } else if (_SettingsStore.default.getValue("showHiddenEventsInTimeline")) {
          // This is a null rejoin, it will only be visible if the Labs option is enabled
          return (0, _languageHandler._t)("%(senderName)s made no change.", {
            senderName
          });
        } else {
          return "";
        }
      } else {
        if (!ev.target) console.warn("Join message has no target! -- " + ev.getContent().state_key);

        if (ConferenceHandler && ConferenceHandler.isConferenceUser(ev.getStateKey())) {
          return (0, _languageHandler._t)('VoIP conference started.');
        } else {
          return (0, _languageHandler._t)('%(targetName)s joined the room.', {
            targetName
          });
        }
      }

    case 'leave':
      if (ev.getSender() === ev.getStateKey()) {
        if (ConferenceHandler && ConferenceHandler.isConferenceUser(ev.getStateKey())) {
          return (0, _languageHandler._t)('VoIP conference finished.');
        } else if (prevContent.membership === "invite") {
          return (0, _languageHandler._t)('%(targetName)s rejected the invitation.', {
            targetName
          });
        } else {
          return (0, _languageHandler._t)('%(targetName)s left the room.', {
            targetName
          });
        }
      } else if (prevContent.membership === "ban") {
        return (0, _languageHandler._t)('%(senderName)s unbanned %(targetName)s.', {
          senderName,
          targetName
        });
      } else if (prevContent.membership === "invite") {
        return (0, _languageHandler._t)('%(senderName)s withdrew %(targetName)s\'s invitation.', {
          senderName,
          targetName
        }) + ' ' + reason;
      } else {
        // sender is not target and made the target leave, if not from invite/ban then this is a kick
        return (0, _languageHandler._t)('%(senderName)s kicked %(targetName)s.', {
          senderName,
          targetName
        }) + ' ' + reason;
      }

  }
}

function textForTopicEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  return (0, _languageHandler._t)('%(senderDisplayName)s changed the topic to "%(topic)s".', {
    senderDisplayName,
    topic: ev.getContent().topic
  });
}

function textForRoomNameEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();

  if (!ev.getContent().name || ev.getContent().name.trim().length === 0) {
    return (0, _languageHandler._t)('%(senderDisplayName)s removed the room name.', {
      senderDisplayName
    });
  }

  if (ev.getPrevContent().name) {
    return (0, _languageHandler._t)('%(senderDisplayName)s changed the room name from %(oldRoomName)s to %(newRoomName)s.', {
      senderDisplayName,
      oldRoomName: ev.getPrevContent().name,
      newRoomName: ev.getContent().name
    });
  }

  return (0, _languageHandler._t)('%(senderDisplayName)s changed the room name to %(roomName)s.', {
    senderDisplayName,
    roomName: ev.getContent().name
  });
}

function textForTombstoneEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  return (0, _languageHandler._t)('%(senderDisplayName)s upgraded this room.', {
    senderDisplayName
  });
}

function textForJoinRulesEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();

  switch (ev.getContent().join_rule) {
    case "public":
      return (0, _languageHandler._t)('%(senderDisplayName)s made the room public to whoever knows the link.', {
        senderDisplayName
      });

    case "invite":
      return (0, _languageHandler._t)('%(senderDisplayName)s made the room invite only.', {
        senderDisplayName
      });

    default:
      // The spec supports "knock" and "private", however nothing implements these.
      return (0, _languageHandler._t)('%(senderDisplayName)s changed the join rule to %(rule)s', {
        senderDisplayName,
        rule: ev.getContent().join_rule
      });
  }
}

function textForGuestAccessEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();

  switch (ev.getContent().guest_access) {
    case "can_join":
      return (0, _languageHandler._t)('%(senderDisplayName)s has allowed guests to join the room.', {
        senderDisplayName
      });

    case "forbidden":
      return (0, _languageHandler._t)('%(senderDisplayName)s has prevented guests from joining the room.', {
        senderDisplayName
      });

    default:
      // There's no other options we can expect, however just for safety's sake we'll do this.
      return (0, _languageHandler._t)('%(senderDisplayName)s changed guest access to %(rule)s', {
        senderDisplayName,
        rule: ev.getContent().guest_access
      });
  }
}

function textForRelatedGroupsEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  const groups = ev.getContent().groups || [];
  const prevGroups = ev.getPrevContent().groups || [];
  const added = groups.filter(g => !prevGroups.includes(g));
  const removed = prevGroups.filter(g => !groups.includes(g));

  if (added.length && !removed.length) {
    return (0, _languageHandler._t)('%(senderDisplayName)s enabled flair for %(groups)s in this room.', {
      senderDisplayName,
      groups: added.join(', ')
    });
  } else if (!added.length && removed.length) {
    return (0, _languageHandler._t)('%(senderDisplayName)s disabled flair for %(groups)s in this room.', {
      senderDisplayName,
      groups: removed.join(', ')
    });
  } else if (added.length && removed.length) {
    return (0, _languageHandler._t)('%(senderDisplayName)s enabled flair for %(newGroups)s and disabled flair for ' + '%(oldGroups)s in this room.', {
      senderDisplayName,
      newGroups: added.join(', '),
      oldGroups: removed.join(', ')
    });
  } else {
    // Don't bother rendering this change (because there were no changes)
    return '';
  }
}

function textForServerACLEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  const prevContent = ev.getPrevContent();
  const changes = [];
  const current = ev.getContent();
  const prev = {
    deny: Array.isArray(prevContent.deny) ? prevContent.deny : [],
    allow: Array.isArray(prevContent.allow) ? prevContent.allow : [],
    allow_ip_literals: !(prevContent.allow_ip_literals === false)
  };
  let text = "";

  if (prev.deny.length === 0 && prev.allow.length === 0) {
    text = "".concat(senderDisplayName, " set server ACLs for this room: ");
  } else {
    text = "".concat(senderDisplayName, " changed the server ACLs for this room: ");
  }

  if (!Array.isArray(current.allow)) {
    current.allow = [];
  }
  /* If we know for sure everyone is banned, don't bother showing the diff view */


  if (current.allow.length === 0) {
    return text + "🎉 All servers are banned from participating! This room can no longer be used.";
  }

  if (!Array.isArray(current.deny)) {
    current.deny = [];
  }

  const bannedServers = current.deny.filter(srv => typeof srv === 'string' && !prev.deny.includes(srv));
  const unbannedServers = prev.deny.filter(srv => typeof srv === 'string' && !current.deny.includes(srv));
  const allowedServers = current.allow.filter(srv => typeof srv === 'string' && !prev.allow.includes(srv));
  const unallowedServers = prev.allow.filter(srv => typeof srv === 'string' && !current.allow.includes(srv));

  if (bannedServers.length > 0) {
    changes.push("Servers matching ".concat(bannedServers.join(", "), " are now banned."));
  }

  if (unbannedServers.length > 0) {
    changes.push("Servers matching ".concat(unbannedServers.join(", "), " were removed from the ban list."));
  }

  if (allowedServers.length > 0) {
    changes.push("Servers matching ".concat(allowedServers.join(", "), " are now allowed."));
  }

  if (unallowedServers.length > 0) {
    changes.push("Servers matching ".concat(unallowedServers.join(", "), " were removed from the allowed list."));
  }

  if (prev.allow_ip_literals !== current.allow_ip_literals) {
    const allowban = current.allow_ip_literals ? "allowed" : "banned";
    changes.push("Participating from a server using an IP literal hostname is now ".concat(allowban, "."));
  }

  return text + changes.join(" ");
}

function textForMessageEvent(ev) {
  const senderDisplayName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  let message = senderDisplayName + ': ' + ev.getContent().body;

  if (ev.getContent().msgtype === "m.emote") {
    message = "* " + senderDisplayName + " " + message;
  } else if (ev.getContent().msgtype === "m.image") {
    message = (0, _languageHandler._t)('%(senderDisplayName)s sent an image.', {
      senderDisplayName
    });
  }

  return message;
}

function textForCanonicalAliasEvent(ev) {
  const senderName = ev.sender && ev.sender.name ? ev.sender.name : ev.getSender();
  const oldAlias = ev.getPrevContent().alias;
  const oldAltAliases = ev.getPrevContent().alt_aliases || [];
  const newAlias = ev.getContent().alias;
  const newAltAliases = ev.getContent().alt_aliases || [];
  const removedAltAliases = oldAltAliases.filter(alias => !newAltAliases.includes(alias));
  const addedAltAliases = newAltAliases.filter(alias => !oldAltAliases.includes(alias));

  if (!removedAltAliases.length && !addedAltAliases.length) {
    if (newAlias) {
      return (0, _languageHandler._t)('%(senderName)s set the main address for this room to %(address)s.', {
        senderName: senderName,
        address: ev.getContent().alias
      });
    } else if (oldAlias) {
      return (0, _languageHandler._t)('%(senderName)s removed the main address for this room.', {
        senderName: senderName
      });
    }
  } else if (newAlias === oldAlias) {
    if (addedAltAliases.length && !removedAltAliases.length) {
      return (0, _languageHandler._t)('%(senderName)s added the alternative addresses %(addresses)s for this room.', {
        senderName: senderName,
        addresses: addedAltAliases.join(", "),
        count: addedAltAliases.length
      });
    }

    if (removedAltAliases.length && !addedAltAliases.length) {
      return (0, _languageHandler._t)('%(senderName)s removed the alternative addresses %(addresses)s for this room.', {
        senderName: senderName,
        addresses: removedAltAliases.join(", "),
        count: removedAltAliases.length
      });
    }

    if (removedAltAliases.length && addedAltAliases.length) {
      return (0, _languageHandler._t)('%(senderName)s changed the alternative addresses for this room.', {
        senderName: senderName
      });
    }
  } else {
    // both alias and alt_aliases where modified
    return (0, _languageHandler._t)('%(senderName)s changed the main and alternative addresses for this room.', {
      senderName: senderName
    });
  } // in case there is no difference between the two events,
  // say something as we can't simply hide the tile from here


  return (0, _languageHandler._t)('%(senderName)s changed the addresses for this room.', {
    senderName: senderName
  });
}

function textForCallAnswerEvent(event) {
  const senderName = event.sender ? event.sender.name : (0, _languageHandler._t)('Someone');
  const supported = _MatrixClientPeg.MatrixClientPeg.get().supportsVoip() ? '' : (0, _languageHandler._t)('(not supported by this browser)');
  return (0, _languageHandler._t)('%(senderName)s answered the call.', {
    senderName
  }) + ' ' + supported;
}

function textForCallHangupEvent(event) {
  const senderName = event.sender ? event.sender.name : (0, _languageHandler._t)('Someone');
  const eventContent = event.getContent();
  let reason = "";

  if (!_MatrixClientPeg.MatrixClientPeg.get().supportsVoip()) {
    reason = (0, _languageHandler._t)('(not supported by this browser)');
  } else if (eventContent.reason) {
    if (eventContent.reason === "ice_failed") {
      reason = (0, _languageHandler._t)('(could not connect media)');
    } else if (eventContent.reason === "invite_timeout") {
      reason = (0, _languageHandler._t)('(no answer)');
    } else if (eventContent.reason === "user hangup") {
      // workaround for https://github.com/vector-im/riot-web/issues/5178
      // it seems Android randomly sets a reason of "user hangup" which is
      // interpreted as an error code :(
      // https://github.com/vector-im/riot-android/issues/2623
      reason = '';
    } else {
      reason = (0, _languageHandler._t)('(unknown failure: %(reason)s)', {
        reason: eventContent.reason
      });
    }
  }

  return (0, _languageHandler._t)('%(senderName)s ended the call.', {
    senderName
  }) + ' ' + reason;
}

function textForCallInviteEvent(event) {
  const senderName = event.sender ? event.sender.name : (0, _languageHandler._t)('Someone'); // FIXME: Find a better way to determine this from the event?

  let isVoice = true;

  if (event.getContent().offer && event.getContent().offer.sdp && event.getContent().offer.sdp.indexOf('m=video') !== -1) {
    isVoice = false;
  }

  const isSupported = _MatrixClientPeg.MatrixClientPeg.get().supportsVoip(); // This ladder could be reduced down to a couple string variables, however other languages
  // can have a hard time translating those strings. In an effort to make translations easier
  // and more accurate, we break out the string-based variables to a couple booleans.


  if (isVoice && isSupported) {
    return (0, _languageHandler._t)("%(senderName)s placed a voice call.", {
      senderName
    });
  } else if (isVoice && !isSupported) {
    return (0, _languageHandler._t)("%(senderName)s placed a voice call. (not supported by this browser)", {
      senderName
    });
  } else if (!isVoice && isSupported) {
    return (0, _languageHandler._t)("%(senderName)s placed a video call.", {
      senderName
    });
  } else if (!isVoice && !isSupported) {
    return (0, _languageHandler._t)("%(senderName)s placed a video call. (not supported by this browser)", {
      senderName
    });
  }
}

function textForThreePidInviteEvent(event) {
  const senderName = event.sender ? event.sender.name : event.getSender();

  if (!(0, _RoomInvite.isValid3pidInvite)(event)) {
    const targetDisplayName = event.getPrevContent().display_name || (0, _languageHandler._t)("Someone");
    return (0, _languageHandler._t)('%(senderName)s revoked the invitation for %(targetDisplayName)s to join the room.', {
      senderName,
      targetDisplayName
    });
  }

  return (0, _languageHandler._t)('%(senderName)s sent an invitation to %(targetDisplayName)s to join the room.', {
    senderName,
    targetDisplayName: event.getContent().display_name
  });
}

function textForHistoryVisibilityEvent(event) {
  const senderName = event.sender ? event.sender.name : event.getSender();

  switch (event.getContent().history_visibility) {
    case 'invited':
      return (0, _languageHandler._t)('%(senderName)s made future room history visible to all room members, ' + 'from the point they are invited.', {
        senderName
      });

    case 'joined':
      return (0, _languageHandler._t)('%(senderName)s made future room history visible to all room members, ' + 'from the point they joined.', {
        senderName
      });

    case 'shared':
      return (0, _languageHandler._t)('%(senderName)s made future room history visible to all room members.', {
        senderName
      });

    case 'world_readable':
      return (0, _languageHandler._t)('%(senderName)s made future room history visible to anyone.', {
        senderName
      });

    default:
      return (0, _languageHandler._t)('%(senderName)s made future room history visible to unknown (%(visibility)s).', {
        senderName,
        visibility: event.getContent().history_visibility
      });
  }
} // Currently will only display a change if a user's power level is changed


function textForPowerEvent(event) {
  const senderName = event.sender ? event.sender.name : event.getSender();

  if (!event.getPrevContent() || !event.getPrevContent().users || !event.getContent() || !event.getContent().users) {
    return '';
  }

  const userDefault = event.getContent().users_default || 0; // Construct set of userIds

  const users = [];
  Object.keys(event.getContent().users).forEach(userId => {
    if (users.indexOf(userId) === -1) users.push(userId);
  });
  Object.keys(event.getPrevContent().users).forEach(userId => {
    if (users.indexOf(userId) === -1) users.push(userId);
  });
  const diff = []; // XXX: This is also surely broken for i18n

  users.forEach(userId => {
    // Previous power level
    const from = event.getPrevContent().users[userId]; // Current power level

    const to = event.getContent().users[userId];

    if (to !== from) {
      diff.push((0, _languageHandler._t)('%(userId)s from %(fromPowerLevel)s to %(toPowerLevel)s', {
        userId,
        fromPowerLevel: Roles.textualPowerLevel(from, userDefault),
        toPowerLevel: Roles.textualPowerLevel(to, userDefault)
      }));
    }
  });

  if (!diff.length) {
    return '';
  }

  return (0, _languageHandler._t)('%(senderName)s changed the power level of %(powerLevelDiffText)s.', {
    senderName,
    powerLevelDiffText: diff.join(", ")
  });
}

function textForPinnedEvent(event) {
  const senderName = event.sender ? event.sender.name : event.getSender();
  return (0, _languageHandler._t)("%(senderName)s changed the pinned messages for the room.", {
    senderName
  });
}

function textForWidgetEvent(event) {
  const senderName = event.getSender();
  const {
    name: prevName,
    type: prevType,
    url: prevUrl
  } = event.getPrevContent();
  const {
    name,
    type,
    url
  } = event.getContent() || {};
  let widgetName = name || prevName || type || prevType || ''; // Apply sentence case to widget name

  if (widgetName && widgetName.length > 0) {
    widgetName = widgetName[0].toUpperCase() + widgetName.slice(1) + ' ';
  } // If the widget was removed, its content should be {}, but this is sufficiently
  // equivalent to that condition.


  if (url) {
    if (prevUrl) {
      return (0, _languageHandler._t)('%(widgetName)s widget modified by %(senderName)s', {
        widgetName,
        senderName
      });
    } else {
      return (0, _languageHandler._t)('%(widgetName)s widget added by %(senderName)s', {
        widgetName,
        senderName
      });
    }
  } else {
    return (0, _languageHandler._t)('%(widgetName)s widget removed by %(senderName)s', {
      widgetName,
      senderName
    });
  }
}

function textForMjolnirEvent(event) {
  const senderName = event.getSender();
  const {
    entity: prevEntity
  } = event.getPrevContent();
  const {
    entity,
    recommendation,
    reason
  } = event.getContent(); // Rule removed

  if (!entity) {
    if (_BanList.USER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s removed the rule banning users matching %(glob)s", {
        senderName,
        glob: prevEntity
      });
    } else if (_BanList.ROOM_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s removed the rule banning rooms matching %(glob)s", {
        senderName,
        glob: prevEntity
      });
    } else if (_BanList.SERVER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s removed the rule banning servers matching %(glob)s", {
        senderName,
        glob: prevEntity
      });
    } // Unknown type. We'll say something, but we shouldn't end up here.


    return (0, _languageHandler._t)("%(senderName)s removed a ban rule matching %(glob)s", {
      senderName,
      glob: prevEntity
    });
  } // Invalid rule


  if (!recommendation || !reason) return (0, _languageHandler._t)("%(senderName)s updated an invalid ban rule", {
    senderName
  }); // Rule updated

  if (entity === prevEntity) {
    if (_BanList.USER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s updated the rule banning users matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } else if (_BanList.ROOM_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s updated the rule banning rooms matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } else if (_BanList.SERVER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s updated the rule banning servers matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } // Unknown type. We'll say something but we shouldn't end up here.


    return (0, _languageHandler._t)("%(senderName)s updated a ban rule matching %(glob)s for %(reason)s", {
      senderName,
      glob: entity,
      reason
    });
  } // New rule


  if (!prevEntity) {
    if (_BanList.USER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s created a rule banning users matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } else if (_BanList.ROOM_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s created a rule banning rooms matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } else if (_BanList.SERVER_RULE_TYPES.includes(event.getType())) {
      return (0, _languageHandler._t)("%(senderName)s created a rule banning servers matching %(glob)s for %(reason)s", {
        senderName,
        glob: entity,
        reason
      });
    } // Unknown type. We'll say something but we shouldn't end up here.


    return (0, _languageHandler._t)("%(senderName)s created a ban rule matching %(glob)s for %(reason)s", {
      senderName,
      glob: entity,
      reason
    });
  } // else the entity !== prevEntity - count as a removal & add


  if (_BanList.USER_RULE_TYPES.includes(event.getType())) {
    return (0, _languageHandler._t)("%(senderName)s changed a rule that was banning users matching %(oldGlob)s to matching " + "%(newGlob)s for %(reason)s", {
      senderName,
      oldGlob: prevEntity,
      newGlob: entity,
      reason
    });
  } else if (_BanList.ROOM_RULE_TYPES.includes(event.getType())) {
    return (0, _languageHandler._t)("%(senderName)s changed a rule that was banning rooms matching %(oldGlob)s to matching " + "%(newGlob)s for %(reason)s", {
      senderName,
      oldGlob: prevEntity,
      newGlob: entity,
      reason
    });
  } else if (_BanList.SERVER_RULE_TYPES.includes(event.getType())) {
    return (0, _languageHandler._t)("%(senderName)s changed a rule that was banning servers matching %(oldGlob)s to matching " + "%(newGlob)s for %(reason)s", {
      senderName,
      oldGlob: prevEntity,
      newGlob: entity,
      reason
    });
  } // Unknown type. We'll say something but we shouldn't end up here.


  return (0, _languageHandler._t)("%(senderName)s updated a ban rule that was matching %(oldGlob)s to matching %(newGlob)s " + "for %(reason)s", {
    senderName,
    oldGlob: prevEntity,
    newGlob: entity,
    reason
  });
}

const handlers = {
  'm.room.message': textForMessageEvent,
  'm.call.invite': textForCallInviteEvent,
  'm.call.answer': textForCallAnswerEvent,
  'm.call.hangup': textForCallHangupEvent
};
const stateHandlers = {
  'm.room.canonical_alias': textForCanonicalAliasEvent,
  'm.room.name': textForRoomNameEvent,
  'm.room.topic': textForTopicEvent,
  'm.room.member': textForMemberEvent,
  'm.room.third_party_invite': textForThreePidInviteEvent,
  'm.room.history_visibility': textForHistoryVisibilityEvent,
  'm.room.power_levels': textForPowerEvent,
  'm.room.pinned_events': textForPinnedEvent,
  'm.room.server_acl': textForServerACLEvent,
  'm.room.tombstone': textForTombstoneEvent,
  'm.room.join_rules': textForJoinRulesEvent,
  'm.room.guest_access': textForGuestAccessEvent,
  'm.room.related_groups': textForRelatedGroupsEvent,
  // TODO: Enable support for m.widget event type (https://github.com/vector-im/riot-web/issues/13111)
  'im.vector.modular.widgets': textForWidgetEvent
}; // Add all the Mjolnir stuff to the renderer

for (const evType of _BanList.ALL_RULE_TYPES) {
  stateHandlers[evType] = textForMjolnirEvent;
}

function textForEvent(ev) {
  const handler = (ev.isState() ? stateHandlers : handlers)[ev.getType()];
  if (handler) return handler(ev);
  return '';
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXh0Rm9yRXZlbnQuanMiXSwibmFtZXMiOlsidGV4dEZvck1lbWJlckV2ZW50IiwiZXYiLCJzZW5kZXJOYW1lIiwic2VuZGVyIiwibmFtZSIsImdldFNlbmRlciIsInRhcmdldE5hbWUiLCJ0YXJnZXQiLCJnZXRTdGF0ZUtleSIsInByZXZDb250ZW50IiwiZ2V0UHJldkNvbnRlbnQiLCJjb250ZW50IiwiZ2V0Q29udGVudCIsIkNvbmZlcmVuY2VIYW5kbGVyIiwiQ2FsbEhhbmRsZXIiLCJnZXRDb25mZXJlbmNlSGFuZGxlciIsInJlYXNvbiIsIm1lbWJlcnNoaXAiLCJ0aHJlZVBpZENvbnRlbnQiLCJ0aGlyZF9wYXJ0eV9pbnZpdGUiLCJkaXNwbGF5X25hbWUiLCJkaXNwbGF5TmFtZSIsImlzQ29uZmVyZW5jZVVzZXIiLCJkaXNwbGF5bmFtZSIsIm9sZERpc3BsYXlOYW1lIiwiYXZhdGFyX3VybCIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsImNvbnNvbGUiLCJ3YXJuIiwic3RhdGVfa2V5IiwidGV4dEZvclRvcGljRXZlbnQiLCJzZW5kZXJEaXNwbGF5TmFtZSIsInRvcGljIiwidGV4dEZvclJvb21OYW1lRXZlbnQiLCJ0cmltIiwibGVuZ3RoIiwib2xkUm9vbU5hbWUiLCJuZXdSb29tTmFtZSIsInJvb21OYW1lIiwidGV4dEZvclRvbWJzdG9uZUV2ZW50IiwidGV4dEZvckpvaW5SdWxlc0V2ZW50Iiwiam9pbl9ydWxlIiwicnVsZSIsInRleHRGb3JHdWVzdEFjY2Vzc0V2ZW50IiwiZ3Vlc3RfYWNjZXNzIiwidGV4dEZvclJlbGF0ZWRHcm91cHNFdmVudCIsImdyb3VwcyIsInByZXZHcm91cHMiLCJhZGRlZCIsImZpbHRlciIsImciLCJpbmNsdWRlcyIsInJlbW92ZWQiLCJqb2luIiwibmV3R3JvdXBzIiwib2xkR3JvdXBzIiwidGV4dEZvclNlcnZlckFDTEV2ZW50IiwiY2hhbmdlcyIsImN1cnJlbnQiLCJwcmV2IiwiZGVueSIsIkFycmF5IiwiaXNBcnJheSIsImFsbG93IiwiYWxsb3dfaXBfbGl0ZXJhbHMiLCJ0ZXh0IiwiYmFubmVkU2VydmVycyIsInNydiIsInVuYmFubmVkU2VydmVycyIsImFsbG93ZWRTZXJ2ZXJzIiwidW5hbGxvd2VkU2VydmVycyIsInB1c2giLCJhbGxvd2JhbiIsInRleHRGb3JNZXNzYWdlRXZlbnQiLCJtZXNzYWdlIiwiYm9keSIsIm1zZ3R5cGUiLCJ0ZXh0Rm9yQ2Fub25pY2FsQWxpYXNFdmVudCIsIm9sZEFsaWFzIiwiYWxpYXMiLCJvbGRBbHRBbGlhc2VzIiwiYWx0X2FsaWFzZXMiLCJuZXdBbGlhcyIsIm5ld0FsdEFsaWFzZXMiLCJyZW1vdmVkQWx0QWxpYXNlcyIsImFkZGVkQWx0QWxpYXNlcyIsImFkZHJlc3MiLCJhZGRyZXNzZXMiLCJjb3VudCIsInRleHRGb3JDYWxsQW5zd2VyRXZlbnQiLCJldmVudCIsInN1cHBvcnRlZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInN1cHBvcnRzVm9pcCIsInRleHRGb3JDYWxsSGFuZ3VwRXZlbnQiLCJldmVudENvbnRlbnQiLCJ0ZXh0Rm9yQ2FsbEludml0ZUV2ZW50IiwiaXNWb2ljZSIsIm9mZmVyIiwic2RwIiwiaW5kZXhPZiIsImlzU3VwcG9ydGVkIiwidGV4dEZvclRocmVlUGlkSW52aXRlRXZlbnQiLCJ0YXJnZXREaXNwbGF5TmFtZSIsInRleHRGb3JIaXN0b3J5VmlzaWJpbGl0eUV2ZW50IiwiaGlzdG9yeV92aXNpYmlsaXR5IiwidmlzaWJpbGl0eSIsInRleHRGb3JQb3dlckV2ZW50IiwidXNlcnMiLCJ1c2VyRGVmYXVsdCIsInVzZXJzX2RlZmF1bHQiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsInVzZXJJZCIsImRpZmYiLCJmcm9tIiwidG8iLCJmcm9tUG93ZXJMZXZlbCIsIlJvbGVzIiwidGV4dHVhbFBvd2VyTGV2ZWwiLCJ0b1Bvd2VyTGV2ZWwiLCJwb3dlckxldmVsRGlmZlRleHQiLCJ0ZXh0Rm9yUGlubmVkRXZlbnQiLCJ0ZXh0Rm9yV2lkZ2V0RXZlbnQiLCJwcmV2TmFtZSIsInR5cGUiLCJwcmV2VHlwZSIsInVybCIsInByZXZVcmwiLCJ3aWRnZXROYW1lIiwidG9VcHBlckNhc2UiLCJzbGljZSIsInRleHRGb3JNam9sbmlyRXZlbnQiLCJlbnRpdHkiLCJwcmV2RW50aXR5IiwicmVjb21tZW5kYXRpb24iLCJVU0VSX1JVTEVfVFlQRVMiLCJnZXRUeXBlIiwiZ2xvYiIsIlJPT01fUlVMRV9UWVBFUyIsIlNFUlZFUl9SVUxFX1RZUEVTIiwib2xkR2xvYiIsIm5ld0dsb2IiLCJoYW5kbGVycyIsInN0YXRlSGFuZGxlcnMiLCJldlR5cGUiLCJBTExfUlVMRV9UWVBFUyIsInRleHRGb3JFdmVudCIsImhhbmRsZXIiLCJpc1N0YXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBLFNBQVNBLGtCQUFULENBQTRCQyxFQUE1QixFQUFnQztBQUM1QjtBQUNBLFFBQU1DLFVBQVUsR0FBR0QsRUFBRSxDQUFDRSxNQUFILEdBQVlGLEVBQUUsQ0FBQ0UsTUFBSCxDQUFVQyxJQUF0QixHQUE2QkgsRUFBRSxDQUFDSSxTQUFILEVBQWhEO0FBQ0EsUUFBTUMsVUFBVSxHQUFHTCxFQUFFLENBQUNNLE1BQUgsR0FBWU4sRUFBRSxDQUFDTSxNQUFILENBQVVILElBQXRCLEdBQTZCSCxFQUFFLENBQUNPLFdBQUgsRUFBaEQ7QUFDQSxRQUFNQyxXQUFXLEdBQUdSLEVBQUUsQ0FBQ1MsY0FBSCxFQUFwQjtBQUNBLFFBQU1DLE9BQU8sR0FBR1YsRUFBRSxDQUFDVyxVQUFILEVBQWhCOztBQUVBLFFBQU1DLGlCQUFpQixHQUFHQyxxQkFBWUMsb0JBQVosRUFBMUI7O0FBQ0EsUUFBTUMsTUFBTSxHQUFHTCxPQUFPLENBQUNLLE1BQVIsR0FBa0IseUJBQUcsUUFBSCxJQUFlLElBQWYsR0FBc0JMLE9BQU8sQ0FBQ0ssTUFBaEQsR0FBMEQsRUFBekU7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QWlCL0Isa0JBSkM7QUFLbEIsK0JBQTZCd0csMEJBTFg7QUFNbEIsK0JBQTZCRSw2QkFOWDtBQU9sQix5QkFBdUJHLGlCQVBMO0FBUWxCLDBCQUF3QmdCLGtCQVJOO0FBU2xCLHVCQUFxQnBFLHFCQVRIO0FBVWxCLHNCQUFvQmpCLHFCQVZGO0FBV2xCLHVCQUFxQkMscUJBWEg7QUFZbEIseUJBQXVCRyx1QkFaTDtBQWFsQiwyQkFBeUJFLHlCQWJQO0FBZWxCO0FBQ0EsK0JBQTZCZ0Y7QUFoQlgsQ0FBdEIsQyxDQW1CQTs7QUFDQSxLQUFLLE1BQU1zQixNQUFYLElBQXFCQyx1QkFBckIsRUFBcUM7QUFDakNGLEVBQUFBLGFBQWEsQ0FBQ0MsTUFBRCxDQUFiLEdBQXdCYixtQkFBeEI7QUFDSDs7QUFFTSxTQUFTZSxZQUFULENBQXNCckosRUFBdEIsRUFBMEI7QUFDN0IsUUFBTXNKLE9BQU8sR0FBRyxDQUFDdEosRUFBRSxDQUFDdUosT0FBSCxLQUFlTCxhQUFmLEdBQStCRCxRQUFoQyxFQUEwQ2pKLEVBQUUsQ0FBQzJJLE9BQUgsRUFBMUMsQ0FBaEI7QUFDQSxNQUFJVyxPQUFKLEVBQWEsT0FBT0EsT0FBTyxDQUFDdEosRUFBRCxDQUFkO0FBQ2IsU0FBTyxFQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBDYWxsSGFuZGxlciBmcm9tICcuL0NhbGxIYW5kbGVyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgUm9sZXMgZnJvbSAnLi9Sb2xlcyc7XG5pbXBvcnQge2lzVmFsaWQzcGlkSW52aXRlfSBmcm9tIFwiLi9Sb29tSW52aXRlXCI7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQge0FMTF9SVUxFX1RZUEVTLCBST09NX1JVTEVfVFlQRVMsIFNFUlZFUl9SVUxFX1RZUEVTLCBVU0VSX1JVTEVfVFlQRVN9IGZyb20gXCIuL21qb2xuaXIvQmFuTGlzdFwiO1xuXG5mdW5jdGlvbiB0ZXh0Rm9yTWVtYmVyRXZlbnQoZXYpIHtcbiAgICAvLyBYWFg6IFNZSlMtMTYgXCJzZW5kZXIgaXMgc29tZXRpbWVzIG51bGwgZm9yIGpvaW4gbWVzc2FnZXNcIlxuICAgIGNvbnN0IHNlbmRlck5hbWUgPSBldi5zZW5kZXIgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpO1xuICAgIGNvbnN0IHRhcmdldE5hbWUgPSBldi50YXJnZXQgPyBldi50YXJnZXQubmFtZSA6IGV2LmdldFN0YXRlS2V5KCk7XG4gICAgY29uc3QgcHJldkNvbnRlbnQgPSBldi5nZXRQcmV2Q29udGVudCgpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBldi5nZXRDb250ZW50KCk7XG5cbiAgICBjb25zdCBDb25mZXJlbmNlSGFuZGxlciA9IENhbGxIYW5kbGVyLmdldENvbmZlcmVuY2VIYW5kbGVyKCk7XG4gICAgY29uc3QgcmVhc29uID0gY29udGVudC5yZWFzb24gPyAoX3QoJ1JlYXNvbicpICsgJzogJyArIGNvbnRlbnQucmVhc29uKSA6ICcnO1xuICAgIHN3aXRjaCAoY29udGVudC5tZW1iZXJzaGlwKSB7XG4gICAgICAgIGNhc2UgJ2ludml0ZSc6IHtcbiAgICAgICAgICAgIGNvbnN0IHRocmVlUGlkQ29udGVudCA9IGNvbnRlbnQudGhpcmRfcGFydHlfaW52aXRlO1xuICAgICAgICAgICAgaWYgKHRocmVlUGlkQ29udGVudCkge1xuICAgICAgICAgICAgICAgIGlmICh0aHJlZVBpZENvbnRlbnQuZGlzcGxheV9uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJSh0YXJnZXROYW1lKXMgYWNjZXB0ZWQgdGhlIGludml0YXRpb24gZm9yICUoZGlzcGxheU5hbWUpcy4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHRocmVlUGlkQ29udGVudC5kaXNwbGF5X25hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJSh0YXJnZXROYW1lKXMgYWNjZXB0ZWQgYW4gaW52aXRhdGlvbi4nLCB7dGFyZ2V0TmFtZX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKENvbmZlcmVuY2VIYW5kbGVyICYmIENvbmZlcmVuY2VIYW5kbGVyLmlzQ29uZmVyZW5jZVVzZXIoZXYuZ2V0U3RhdGVLZXkoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyByZXF1ZXN0ZWQgYSBWb0lQIGNvbmZlcmVuY2UuJywge3NlbmRlck5hbWV9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIGludml0ZWQgJSh0YXJnZXROYW1lKXMuJywge3NlbmRlck5hbWUsIHRhcmdldE5hbWV9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAnYmFuJzpcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgYmFubmVkICUodGFyZ2V0TmFtZSlzLicsIHtzZW5kZXJOYW1lLCB0YXJnZXROYW1lfSkgKyAnICcgKyByZWFzb247XG4gICAgICAgIGNhc2UgJ2pvaW4nOlxuICAgICAgICAgICAgaWYgKHByZXZDb250ZW50ICYmIHByZXZDb250ZW50Lm1lbWJlcnNoaXAgPT09ICdqb2luJykge1xuICAgICAgICAgICAgICAgIGlmIChwcmV2Q29udGVudC5kaXNwbGF5bmFtZSAmJiBjb250ZW50LmRpc3BsYXluYW1lICYmIHByZXZDb250ZW50LmRpc3BsYXluYW1lICE9PSBjb250ZW50LmRpc3BsYXluYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJShvbGREaXNwbGF5TmFtZSlzIGNoYW5nZWQgdGhlaXIgZGlzcGxheSBuYW1lIHRvICUoZGlzcGxheU5hbWUpcy4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbGREaXNwbGF5TmFtZTogcHJldkNvbnRlbnQuZGlzcGxheW5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogY29udGVudC5kaXNwbGF5bmFtZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghcHJldkNvbnRlbnQuZGlzcGxheW5hbWUgJiYgY29udGVudC5kaXNwbGF5bmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIHNldCB0aGVpciBkaXNwbGF5IG5hbWUgdG8gJShkaXNwbGF5TmFtZSlzLicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRlck5hbWU6IGV2LmdldFNlbmRlcigpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IGNvbnRlbnQuZGlzcGxheW5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldkNvbnRlbnQuZGlzcGxheW5hbWUgJiYgIWNvbnRlbnQuZGlzcGxheW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyByZW1vdmVkIHRoZWlyIGRpc3BsYXkgbmFtZSAoJShvbGREaXNwbGF5TmFtZSlzKS4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkRGlzcGxheU5hbWU6IHByZXZDb250ZW50LmRpc3BsYXluYW1lLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZDb250ZW50LmF2YXRhcl91cmwgJiYgIWNvbnRlbnQuYXZhdGFyX3VybCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIHJlbW92ZWQgdGhlaXIgcHJvZmlsZSBwaWN0dXJlLicsIHtzZW5kZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2Q29udGVudC5hdmF0YXJfdXJsICYmIGNvbnRlbnQuYXZhdGFyX3VybCAmJlxuICAgICAgICAgICAgICAgICAgICBwcmV2Q29udGVudC5hdmF0YXJfdXJsICE9PSBjb250ZW50LmF2YXRhcl91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyBjaGFuZ2VkIHRoZWlyIHByb2ZpbGUgcGljdHVyZS4nLCB7c2VuZGVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXByZXZDb250ZW50LmF2YXRhcl91cmwgJiYgY29udGVudC5hdmF0YXJfdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgc2V0IGEgcHJvZmlsZSBwaWN0dXJlLicsIHtzZW5kZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd0hpZGRlbkV2ZW50c0luVGltZWxpbmVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG51bGwgcmVqb2luLCBpdCB3aWxsIG9ubHkgYmUgdmlzaWJsZSBpZiB0aGUgTGFicyBvcHRpb24gaXMgZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBtYWRlIG5vIGNoYW5nZS5cIiwge3NlbmRlck5hbWV9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghZXYudGFyZ2V0KSBjb25zb2xlLndhcm4oXCJKb2luIG1lc3NhZ2UgaGFzIG5vIHRhcmdldCEgLS0gXCIgKyBldi5nZXRDb250ZW50KCkuc3RhdGVfa2V5KTtcbiAgICAgICAgICAgICAgICBpZiAoQ29uZmVyZW5jZUhhbmRsZXIgJiYgQ29uZmVyZW5jZUhhbmRsZXIuaXNDb25mZXJlbmNlVXNlcihldi5nZXRTdGF0ZUtleSgpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1ZvSVAgY29uZmVyZW5jZSBzdGFydGVkLicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJSh0YXJnZXROYW1lKXMgam9pbmVkIHRoZSByb29tLicsIHt0YXJnZXROYW1lfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBjYXNlICdsZWF2ZSc6XG4gICAgICAgICAgICBpZiAoZXYuZ2V0U2VuZGVyKCkgPT09IGV2LmdldFN0YXRlS2V5KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoQ29uZmVyZW5jZUhhbmRsZXIgJiYgQ29uZmVyZW5jZUhhbmRsZXIuaXNDb25mZXJlbmNlVXNlcihldi5nZXRTdGF0ZUtleSgpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ1ZvSVAgY29uZmVyZW5jZSBmaW5pc2hlZC4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZDb250ZW50Lm1lbWJlcnNoaXAgPT09IFwiaW52aXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90KCclKHRhcmdldE5hbWUpcyByZWplY3RlZCB0aGUgaW52aXRhdGlvbi4nLCB7dGFyZ2V0TmFtZX0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJSh0YXJnZXROYW1lKXMgbGVmdCB0aGUgcm9vbS4nLCB7dGFyZ2V0TmFtZX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldkNvbnRlbnQubWVtYmVyc2hpcCA9PT0gXCJiYW5cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgdW5iYW5uZWQgJSh0YXJnZXROYW1lKXMuJywge3NlbmRlck5hbWUsIHRhcmdldE5hbWV9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldkNvbnRlbnQubWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgd2l0aGRyZXcgJSh0YXJnZXROYW1lKXNcXCdzIGludml0YXRpb24uJywge1xuICAgICAgICAgICAgICAgICAgICBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lLFxuICAgICAgICAgICAgICAgIH0pICsgJyAnICsgcmVhc29uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBzZW5kZXIgaXMgbm90IHRhcmdldCBhbmQgbWFkZSB0aGUgdGFyZ2V0IGxlYXZlLCBpZiBub3QgZnJvbSBpbnZpdGUvYmFuIHRoZW4gdGhpcyBpcyBhIGtpY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIGtpY2tlZCAlKHRhcmdldE5hbWUpcy4nLCB7c2VuZGVyTmFtZSwgdGFyZ2V0TmFtZX0pICsgJyAnICsgcmVhc29uO1xuICAgICAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdGV4dEZvclRvcGljRXZlbnQoZXYpIHtcbiAgICBjb25zdCBzZW5kZXJEaXNwbGF5TmFtZSA9IGV2LnNlbmRlciAmJiBldi5zZW5kZXIubmFtZSA/IGV2LnNlbmRlci5uYW1lIDogZXYuZ2V0U2VuZGVyKCk7XG4gICAgcmV0dXJuIF90KCclKHNlbmRlckRpc3BsYXlOYW1lKXMgY2hhbmdlZCB0aGUgdG9waWMgdG8gXCIlKHRvcGljKXNcIi4nLCB7XG4gICAgICAgIHNlbmRlckRpc3BsYXlOYW1lLFxuICAgICAgICB0b3BpYzogZXYuZ2V0Q29udGVudCgpLnRvcGljLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXh0Rm9yUm9vbU5hbWVFdmVudChldikge1xuICAgIGNvbnN0IHNlbmRlckRpc3BsYXlOYW1lID0gZXYuc2VuZGVyICYmIGV2LnNlbmRlci5uYW1lID8gZXYuc2VuZGVyLm5hbWUgOiBldi5nZXRTZW5kZXIoKTtcblxuICAgIGlmICghZXYuZ2V0Q29udGVudCgpLm5hbWUgfHwgZXYuZ2V0Q29udGVudCgpLm5hbWUudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyRGlzcGxheU5hbWUpcyByZW1vdmVkIHRoZSByb29tIG5hbWUuJywge3NlbmRlckRpc3BsYXlOYW1lfSk7XG4gICAgfVxuICAgIGlmIChldi5nZXRQcmV2Q29udGVudCgpLm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlckRpc3BsYXlOYW1lKXMgY2hhbmdlZCB0aGUgcm9vbSBuYW1lIGZyb20gJShvbGRSb29tTmFtZSlzIHRvICUobmV3Um9vbU5hbWUpcy4nLCB7XG4gICAgICAgICAgICBzZW5kZXJEaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIG9sZFJvb21OYW1lOiBldi5nZXRQcmV2Q29udGVudCgpLm5hbWUsXG4gICAgICAgICAgICBuZXdSb29tTmFtZTogZXYuZ2V0Q29udGVudCgpLm5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gX3QoJyUoc2VuZGVyRGlzcGxheU5hbWUpcyBjaGFuZ2VkIHRoZSByb29tIG5hbWUgdG8gJShyb29tTmFtZSlzLicsIHtcbiAgICAgICAgc2VuZGVyRGlzcGxheU5hbWUsXG4gICAgICAgIHJvb21OYW1lOiBldi5nZXRDb250ZW50KCkubmFtZSxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdGV4dEZvclRvbWJzdG9uZUV2ZW50KGV2KSB7XG4gICAgY29uc3Qgc2VuZGVyRGlzcGxheU5hbWUgPSBldi5zZW5kZXIgJiYgZXYuc2VuZGVyLm5hbWUgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpO1xuICAgIHJldHVybiBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIHVwZ3JhZGVkIHRoaXMgcm9vbS4nLCB7c2VuZGVyRGlzcGxheU5hbWV9KTtcbn1cblxuZnVuY3Rpb24gdGV4dEZvckpvaW5SdWxlc0V2ZW50KGV2KSB7XG4gICAgY29uc3Qgc2VuZGVyRGlzcGxheU5hbWUgPSBldi5zZW5kZXIgJiYgZXYuc2VuZGVyLm5hbWUgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpO1xuICAgIHN3aXRjaCAoZXYuZ2V0Q29udGVudCgpLmpvaW5fcnVsZSkge1xuICAgICAgICBjYXNlIFwicHVibGljXCI6XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyRGlzcGxheU5hbWUpcyBtYWRlIHRoZSByb29tIHB1YmxpYyB0byB3aG9ldmVyIGtub3dzIHRoZSBsaW5rLicsIHtzZW5kZXJEaXNwbGF5TmFtZX0pO1xuICAgICAgICBjYXNlIFwiaW52aXRlXCI6XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyRGlzcGxheU5hbWUpcyBtYWRlIHRoZSByb29tIGludml0ZSBvbmx5LicsIHtzZW5kZXJEaXNwbGF5TmFtZX0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVGhlIHNwZWMgc3VwcG9ydHMgXCJrbm9ja1wiIGFuZCBcInByaXZhdGVcIiwgaG93ZXZlciBub3RoaW5nIGltcGxlbWVudHMgdGhlc2UuXG4gICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyRGlzcGxheU5hbWUpcyBjaGFuZ2VkIHRoZSBqb2luIHJ1bGUgdG8gJShydWxlKXMnLCB7XG4gICAgICAgICAgICAgICAgc2VuZGVyRGlzcGxheU5hbWUsXG4gICAgICAgICAgICAgICAgcnVsZTogZXYuZ2V0Q29udGVudCgpLmpvaW5fcnVsZSxcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdGV4dEZvckd1ZXN0QWNjZXNzRXZlbnQoZXYpIHtcbiAgICBjb25zdCBzZW5kZXJEaXNwbGF5TmFtZSA9IGV2LnNlbmRlciAmJiBldi5zZW5kZXIubmFtZSA/IGV2LnNlbmRlci5uYW1lIDogZXYuZ2V0U2VuZGVyKCk7XG4gICAgc3dpdGNoIChldi5nZXRDb250ZW50KCkuZ3Vlc3RfYWNjZXNzKSB7XG4gICAgICAgIGNhc2UgXCJjYW5fam9pblwiOlxuICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlckRpc3BsYXlOYW1lKXMgaGFzIGFsbG93ZWQgZ3Vlc3RzIHRvIGpvaW4gdGhlIHJvb20uJywge3NlbmRlckRpc3BsYXlOYW1lfSk7XG4gICAgICAgIGNhc2UgXCJmb3JiaWRkZW5cIjpcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIGhhcyBwcmV2ZW50ZWQgZ3Vlc3RzIGZyb20gam9pbmluZyB0aGUgcm9vbS4nLCB7c2VuZGVyRGlzcGxheU5hbWV9KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFRoZXJlJ3Mgbm8gb3RoZXIgb3B0aW9ucyB3ZSBjYW4gZXhwZWN0LCBob3dldmVyIGp1c3QgZm9yIHNhZmV0eSdzIHNha2Ugd2UnbGwgZG8gdGhpcy5cbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIGNoYW5nZWQgZ3Vlc3QgYWNjZXNzIHRvICUocnVsZSlzJywge1xuICAgICAgICAgICAgICAgIHNlbmRlckRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgIHJ1bGU6IGV2LmdldENvbnRlbnQoKS5ndWVzdF9hY2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JSZWxhdGVkR3JvdXBzRXZlbnQoZXYpIHtcbiAgICBjb25zdCBzZW5kZXJEaXNwbGF5TmFtZSA9IGV2LnNlbmRlciAmJiBldi5zZW5kZXIubmFtZSA/IGV2LnNlbmRlci5uYW1lIDogZXYuZ2V0U2VuZGVyKCk7XG4gICAgY29uc3QgZ3JvdXBzID0gZXYuZ2V0Q29udGVudCgpLmdyb3VwcyB8fCBbXTtcbiAgICBjb25zdCBwcmV2R3JvdXBzID0gZXYuZ2V0UHJldkNvbnRlbnQoKS5ncm91cHMgfHwgW107XG4gICAgY29uc3QgYWRkZWQgPSBncm91cHMuZmlsdGVyKChnKSA9PiAhcHJldkdyb3Vwcy5pbmNsdWRlcyhnKSk7XG4gICAgY29uc3QgcmVtb3ZlZCA9IHByZXZHcm91cHMuZmlsdGVyKChnKSA9PiAhZ3JvdXBzLmluY2x1ZGVzKGcpKTtcblxuICAgIGlmIChhZGRlZC5sZW5ndGggJiYgIXJlbW92ZWQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIGVuYWJsZWQgZmxhaXIgZm9yICUoZ3JvdXBzKXMgaW4gdGhpcyByb29tLicsIHtcbiAgICAgICAgICAgIHNlbmRlckRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgZ3JvdXBzOiBhZGRlZC5qb2luKCcsICcpLFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKCFhZGRlZC5sZW5ndGggJiYgcmVtb3ZlZC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlckRpc3BsYXlOYW1lKXMgZGlzYWJsZWQgZmxhaXIgZm9yICUoZ3JvdXBzKXMgaW4gdGhpcyByb29tLicsIHtcbiAgICAgICAgICAgIHNlbmRlckRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgZ3JvdXBzOiByZW1vdmVkLmpvaW4oJywgJyksXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoYWRkZWQubGVuZ3RoICYmIHJlbW92ZWQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIGVuYWJsZWQgZmxhaXIgZm9yICUobmV3R3JvdXBzKXMgYW5kIGRpc2FibGVkIGZsYWlyIGZvciAnICtcbiAgICAgICAgICAgICclKG9sZEdyb3VwcylzIGluIHRoaXMgcm9vbS4nLCB7XG4gICAgICAgICAgICBzZW5kZXJEaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIG5ld0dyb3VwczogYWRkZWQuam9pbignLCAnKSxcbiAgICAgICAgICAgIG9sZEdyb3VwczogcmVtb3ZlZC5qb2luKCcsICcpLFxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEb24ndCBib3RoZXIgcmVuZGVyaW5nIHRoaXMgY2hhbmdlIChiZWNhdXNlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcylcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdGV4dEZvclNlcnZlckFDTEV2ZW50KGV2KSB7XG4gICAgY29uc3Qgc2VuZGVyRGlzcGxheU5hbWUgPSBldi5zZW5kZXIgJiYgZXYuc2VuZGVyLm5hbWUgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpO1xuICAgIGNvbnN0IHByZXZDb250ZW50ID0gZXYuZ2V0UHJldkNvbnRlbnQoKTtcbiAgICBjb25zdCBjaGFuZ2VzID0gW107XG4gICAgY29uc3QgY3VycmVudCA9IGV2LmdldENvbnRlbnQoKTtcbiAgICBjb25zdCBwcmV2ID0ge1xuICAgICAgICBkZW55OiBBcnJheS5pc0FycmF5KHByZXZDb250ZW50LmRlbnkpID8gcHJldkNvbnRlbnQuZGVueSA6IFtdLFxuICAgICAgICBhbGxvdzogQXJyYXkuaXNBcnJheShwcmV2Q29udGVudC5hbGxvdykgPyBwcmV2Q29udGVudC5hbGxvdyA6IFtdLFxuICAgICAgICBhbGxvd19pcF9saXRlcmFsczogIShwcmV2Q29udGVudC5hbGxvd19pcF9saXRlcmFscyA9PT0gZmFsc2UpLFxuICAgIH07XG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGlmIChwcmV2LmRlbnkubGVuZ3RoID09PSAwICYmIHByZXYuYWxsb3cubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRleHQgPSBgJHtzZW5kZXJEaXNwbGF5TmFtZX0gc2V0IHNlcnZlciBBQ0xzIGZvciB0aGlzIHJvb206IGA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dCA9IGAke3NlbmRlckRpc3BsYXlOYW1lfSBjaGFuZ2VkIHRoZSBzZXJ2ZXIgQUNMcyBmb3IgdGhpcyByb29tOiBgO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShjdXJyZW50LmFsbG93KSkge1xuICAgICAgICBjdXJyZW50LmFsbG93ID0gW107XG4gICAgfVxuICAgIC8qIElmIHdlIGtub3cgZm9yIHN1cmUgZXZlcnlvbmUgaXMgYmFubmVkLCBkb24ndCBib3RoZXIgc2hvd2luZyB0aGUgZGlmZiB2aWV3ICovXG4gICAgaWYgKGN1cnJlbnQuYWxsb3cubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0ZXh0ICsgXCLwn46JIEFsbCBzZXJ2ZXJzIGFyZSBiYW5uZWQgZnJvbSBwYXJ0aWNpcGF0aW5nISBUaGlzIHJvb20gY2FuIG5vIGxvbmdlciBiZSB1c2VkLlwiO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShjdXJyZW50LmRlbnkpKSB7XG4gICAgICAgIGN1cnJlbnQuZGVueSA9IFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGJhbm5lZFNlcnZlcnMgPSBjdXJyZW50LmRlbnkuZmlsdGVyKChzcnYpID0+IHR5cGVvZihzcnYpID09PSAnc3RyaW5nJyAmJiAhcHJldi5kZW55LmluY2x1ZGVzKHNydikpO1xuICAgIGNvbnN0IHVuYmFubmVkU2VydmVycyA9IHByZXYuZGVueS5maWx0ZXIoKHNydikgPT4gdHlwZW9mKHNydikgPT09ICdzdHJpbmcnICYmICFjdXJyZW50LmRlbnkuaW5jbHVkZXMoc3J2KSk7XG4gICAgY29uc3QgYWxsb3dlZFNlcnZlcnMgPSBjdXJyZW50LmFsbG93LmZpbHRlcigoc3J2KSA9PiB0eXBlb2Yoc3J2KSA9PT0gJ3N0cmluZycgJiYgIXByZXYuYWxsb3cuaW5jbHVkZXMoc3J2KSk7XG4gICAgY29uc3QgdW5hbGxvd2VkU2VydmVycyA9IHByZXYuYWxsb3cuZmlsdGVyKChzcnYpID0+IHR5cGVvZihzcnYpID09PSAnc3RyaW5nJyAmJiAhY3VycmVudC5hbGxvdy5pbmNsdWRlcyhzcnYpKTtcblxuICAgIGlmIChiYW5uZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY2hhbmdlcy5wdXNoKGBTZXJ2ZXJzIG1hdGNoaW5nICR7YmFubmVkU2VydmVycy5qb2luKFwiLCBcIil9IGFyZSBub3cgYmFubmVkLmApO1xuICAgIH1cblxuICAgIGlmICh1bmJhbm5lZFNlcnZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjaGFuZ2VzLnB1c2goYFNlcnZlcnMgbWF0Y2hpbmcgJHt1bmJhbm5lZFNlcnZlcnMuam9pbihcIiwgXCIpfSB3ZXJlIHJlbW92ZWQgZnJvbSB0aGUgYmFuIGxpc3QuYCk7XG4gICAgfVxuXG4gICAgaWYgKGFsbG93ZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY2hhbmdlcy5wdXNoKGBTZXJ2ZXJzIG1hdGNoaW5nICR7YWxsb3dlZFNlcnZlcnMuam9pbihcIiwgXCIpfSBhcmUgbm93IGFsbG93ZWQuYCk7XG4gICAgfVxuXG4gICAgaWYgKHVuYWxsb3dlZFNlcnZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjaGFuZ2VzLnB1c2goYFNlcnZlcnMgbWF0Y2hpbmcgJHt1bmFsbG93ZWRTZXJ2ZXJzLmpvaW4oXCIsIFwiKX0gd2VyZSByZW1vdmVkIGZyb20gdGhlIGFsbG93ZWQgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJldi5hbGxvd19pcF9saXRlcmFscyAhPT0gY3VycmVudC5hbGxvd19pcF9saXRlcmFscykge1xuICAgICAgICBjb25zdCBhbGxvd2JhbiA9IGN1cnJlbnQuYWxsb3dfaXBfbGl0ZXJhbHMgPyBcImFsbG93ZWRcIiA6IFwiYmFubmVkXCI7XG4gICAgICAgIGNoYW5nZXMucHVzaChgUGFydGljaXBhdGluZyBmcm9tIGEgc2VydmVyIHVzaW5nIGFuIElQIGxpdGVyYWwgaG9zdG5hbWUgaXMgbm93ICR7YWxsb3diYW59LmApO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0ICsgY2hhbmdlcy5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gdGV4dEZvck1lc3NhZ2VFdmVudChldikge1xuICAgIGNvbnN0IHNlbmRlckRpc3BsYXlOYW1lID0gZXYuc2VuZGVyICYmIGV2LnNlbmRlci5uYW1lID8gZXYuc2VuZGVyLm5hbWUgOiBldi5nZXRTZW5kZXIoKTtcbiAgICBsZXQgbWVzc2FnZSA9IHNlbmRlckRpc3BsYXlOYW1lICsgJzogJyArIGV2LmdldENvbnRlbnQoKS5ib2R5O1xuICAgIGlmIChldi5nZXRDb250ZW50KCkubXNndHlwZSA9PT0gXCJtLmVtb3RlXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IFwiKiBcIiArIHNlbmRlckRpc3BsYXlOYW1lICsgXCIgXCIgKyBtZXNzYWdlO1xuICAgIH0gZWxzZSBpZiAoZXYuZ2V0Q29udGVudCgpLm1zZ3R5cGUgPT09IFwibS5pbWFnZVwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBfdCgnJShzZW5kZXJEaXNwbGF5TmFtZSlzIHNlbnQgYW4gaW1hZ2UuJywge3NlbmRlckRpc3BsYXlOYW1lfSk7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xufVxuXG5mdW5jdGlvbiB0ZXh0Rm9yQ2Fub25pY2FsQWxpYXNFdmVudChldikge1xuICAgIGNvbnN0IHNlbmRlck5hbWUgPSBldi5zZW5kZXIgJiYgZXYuc2VuZGVyLm5hbWUgPyBldi5zZW5kZXIubmFtZSA6IGV2LmdldFNlbmRlcigpO1xuICAgIGNvbnN0IG9sZEFsaWFzID0gZXYuZ2V0UHJldkNvbnRlbnQoKS5hbGlhcztcbiAgICBjb25zdCBvbGRBbHRBbGlhc2VzID0gZXYuZ2V0UHJldkNvbnRlbnQoKS5hbHRfYWxpYXNlcyB8fCBbXTtcbiAgICBjb25zdCBuZXdBbGlhcyA9IGV2LmdldENvbnRlbnQoKS5hbGlhcztcbiAgICBjb25zdCBuZXdBbHRBbGlhc2VzID0gZXYuZ2V0Q29udGVudCgpLmFsdF9hbGlhc2VzIHx8IFtdO1xuICAgIGNvbnN0IHJlbW92ZWRBbHRBbGlhc2VzID0gb2xkQWx0QWxpYXNlcy5maWx0ZXIoYWxpYXMgPT4gIW5ld0FsdEFsaWFzZXMuaW5jbHVkZXMoYWxpYXMpKTtcbiAgICBjb25zdCBhZGRlZEFsdEFsaWFzZXMgPSBuZXdBbHRBbGlhc2VzLmZpbHRlcihhbGlhcyA9PiAhb2xkQWx0QWxpYXNlcy5pbmNsdWRlcyhhbGlhcykpO1xuXG4gICAgaWYgKCFyZW1vdmVkQWx0QWxpYXNlcy5sZW5ndGggJiYgIWFkZGVkQWx0QWxpYXNlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKG5ld0FsaWFzKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIHNldCB0aGUgbWFpbiBhZGRyZXNzIGZvciB0aGlzIHJvb20gdG8gJShhZGRyZXNzKXMuJywge1xuICAgICAgICAgICAgICAgIHNlbmRlck5hbWU6IHNlbmRlck5hbWUsXG4gICAgICAgICAgICAgICAgYWRkcmVzczogZXYuZ2V0Q29udGVudCgpLmFsaWFzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAob2xkQWxpYXMpIHtcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgcmVtb3ZlZCB0aGUgbWFpbiBhZGRyZXNzIGZvciB0aGlzIHJvb20uJywge1xuICAgICAgICAgICAgICAgIHNlbmRlck5hbWU6IHNlbmRlck5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmV3QWxpYXMgPT09IG9sZEFsaWFzKSB7XG4gICAgICAgIGlmIChhZGRlZEFsdEFsaWFzZXMubGVuZ3RoICYmICFyZW1vdmVkQWx0QWxpYXNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgYWRkZWQgdGhlIGFsdGVybmF0aXZlIGFkZHJlc3NlcyAlKGFkZHJlc3NlcylzIGZvciB0aGlzIHJvb20uJywge1xuICAgICAgICAgICAgICAgIHNlbmRlck5hbWU6IHNlbmRlck5hbWUsXG4gICAgICAgICAgICAgICAgYWRkcmVzc2VzOiBhZGRlZEFsdEFsaWFzZXMuam9pbihcIiwgXCIpLFxuICAgICAgICAgICAgICAgIGNvdW50OiBhZGRlZEFsdEFsaWFzZXMubGVuZ3RoLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gaWYgKHJlbW92ZWRBbHRBbGlhc2VzLmxlbmd0aCAmJiAhYWRkZWRBbHRBbGlhc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyByZW1vdmVkIHRoZSBhbHRlcm5hdGl2ZSBhZGRyZXNzZXMgJShhZGRyZXNzZXMpcyBmb3IgdGhpcyByb29tLicsIHtcbiAgICAgICAgICAgICAgICBzZW5kZXJOYW1lOiBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NlczogcmVtb3ZlZEFsdEFsaWFzZXMuam9pbihcIiwgXCIpLFxuICAgICAgICAgICAgICAgIGNvdW50OiByZW1vdmVkQWx0QWxpYXNlcy5sZW5ndGgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBpZiAocmVtb3ZlZEFsdEFsaWFzZXMubGVuZ3RoICYmIGFkZGVkQWx0QWxpYXNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgY2hhbmdlZCB0aGUgYWx0ZXJuYXRpdmUgYWRkcmVzc2VzIGZvciB0aGlzIHJvb20uJywge1xuICAgICAgICAgICAgICAgIHNlbmRlck5hbWU6IHNlbmRlck5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGJvdGggYWxpYXMgYW5kIGFsdF9hbGlhc2VzIHdoZXJlIG1vZGlmaWVkXG4gICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgY2hhbmdlZCB0aGUgbWFpbiBhbmQgYWx0ZXJuYXRpdmUgYWRkcmVzc2VzIGZvciB0aGlzIHJvb20uJywge1xuICAgICAgICAgICAgc2VuZGVyTmFtZTogc2VuZGVyTmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGluIGNhc2UgdGhlcmUgaXMgbm8gZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSB0d28gZXZlbnRzLFxuICAgIC8vIHNheSBzb21ldGhpbmcgYXMgd2UgY2FuJ3Qgc2ltcGx5IGhpZGUgdGhlIHRpbGUgZnJvbSBoZXJlXG4gICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyBjaGFuZ2VkIHRoZSBhZGRyZXNzZXMgZm9yIHRoaXMgcm9vbS4nLCB7XG4gICAgICAgIHNlbmRlck5hbWU6IHNlbmRlck5hbWUsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JDYWxsQW5zd2VyRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBzZW5kZXJOYW1lID0gZXZlbnQuc2VuZGVyID8gZXZlbnQuc2VuZGVyLm5hbWUgOiBfdCgnU29tZW9uZScpO1xuICAgIGNvbnN0IHN1cHBvcnRlZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5zdXBwb3J0c1ZvaXAoKSA/ICcnIDogX3QoJyhub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgYnJvd3NlciknKTtcbiAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIGFuc3dlcmVkIHRoZSBjYWxsLicsIHtzZW5kZXJOYW1lfSkgKyAnICcgKyBzdXBwb3J0ZWQ7XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JDYWxsSGFuZ3VwRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBzZW5kZXJOYW1lID0gZXZlbnQuc2VuZGVyID8gZXZlbnQuc2VuZGVyLm5hbWUgOiBfdCgnU29tZW9uZScpO1xuICAgIGNvbnN0IGV2ZW50Q29udGVudCA9IGV2ZW50LmdldENvbnRlbnQoKTtcbiAgICBsZXQgcmVhc29uID0gXCJcIjtcbiAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5zdXBwb3J0c1ZvaXAoKSkge1xuICAgICAgICByZWFzb24gPSBfdCgnKG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyKScpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnRDb250ZW50LnJlYXNvbikge1xuICAgICAgICBpZiAoZXZlbnRDb250ZW50LnJlYXNvbiA9PT0gXCJpY2VfZmFpbGVkXCIpIHtcbiAgICAgICAgICAgIHJlYXNvbiA9IF90KCcoY291bGQgbm90IGNvbm5lY3QgbWVkaWEpJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRDb250ZW50LnJlYXNvbiA9PT0gXCJpbnZpdGVfdGltZW91dFwiKSB7XG4gICAgICAgICAgICByZWFzb24gPSBfdCgnKG5vIGFuc3dlciknKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudENvbnRlbnQucmVhc29uID09PSBcInVzZXIgaGFuZ3VwXCIpIHtcbiAgICAgICAgICAgIC8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzUxNzhcbiAgICAgICAgICAgIC8vIGl0IHNlZW1zIEFuZHJvaWQgcmFuZG9tbHkgc2V0cyBhIHJlYXNvbiBvZiBcInVzZXIgaGFuZ3VwXCIgd2hpY2ggaXNcbiAgICAgICAgICAgIC8vIGludGVycHJldGVkIGFzIGFuIGVycm9yIGNvZGUgOihcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC1hbmRyb2lkL2lzc3Vlcy8yNjIzXG4gICAgICAgICAgICByZWFzb24gPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYXNvbiA9IF90KCcodW5rbm93biBmYWlsdXJlOiAlKHJlYXNvbilzKScsIHtyZWFzb246IGV2ZW50Q29udGVudC5yZWFzb259KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIGVuZGVkIHRoZSBjYWxsLicsIHtzZW5kZXJOYW1lfSkgKyAnICcgKyByZWFzb247XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JDYWxsSW52aXRlRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBzZW5kZXJOYW1lID0gZXZlbnQuc2VuZGVyID8gZXZlbnQuc2VuZGVyLm5hbWUgOiBfdCgnU29tZW9uZScpO1xuICAgIC8vIEZJWE1FOiBGaW5kIGEgYmV0dGVyIHdheSB0byBkZXRlcm1pbmUgdGhpcyBmcm9tIHRoZSBldmVudD9cbiAgICBsZXQgaXNWb2ljZSA9IHRydWU7XG4gICAgaWYgKGV2ZW50LmdldENvbnRlbnQoKS5vZmZlciAmJiBldmVudC5nZXRDb250ZW50KCkub2ZmZXIuc2RwICYmXG4gICAgICAgICAgICBldmVudC5nZXRDb250ZW50KCkub2ZmZXIuc2RwLmluZGV4T2YoJ209dmlkZW8nKSAhPT0gLTEpIHtcbiAgICAgICAgaXNWb2ljZSA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBpc1N1cHBvcnRlZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5zdXBwb3J0c1ZvaXAoKTtcblxuICAgIC8vIFRoaXMgbGFkZGVyIGNvdWxkIGJlIHJlZHVjZWQgZG93biB0byBhIGNvdXBsZSBzdHJpbmcgdmFyaWFibGVzLCBob3dldmVyIG90aGVyIGxhbmd1YWdlc1xuICAgIC8vIGNhbiBoYXZlIGEgaGFyZCB0aW1lIHRyYW5zbGF0aW5nIHRob3NlIHN0cmluZ3MuIEluIGFuIGVmZm9ydCB0byBtYWtlIHRyYW5zbGF0aW9ucyBlYXNpZXJcbiAgICAvLyBhbmQgbW9yZSBhY2N1cmF0ZSwgd2UgYnJlYWsgb3V0IHRoZSBzdHJpbmctYmFzZWQgdmFyaWFibGVzIHRvIGEgY291cGxlIGJvb2xlYW5zLlxuICAgIGlmIChpc1ZvaWNlICYmIGlzU3VwcG9ydGVkKSB7XG4gICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHBsYWNlZCBhIHZvaWNlIGNhbGwuXCIsIHtzZW5kZXJOYW1lfSk7XG4gICAgfSBlbHNlIGlmIChpc1ZvaWNlICYmICFpc1N1cHBvcnRlZCkge1xuICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBwbGFjZWQgYSB2b2ljZSBjYWxsLiAobm90IHN1cHBvcnRlZCBieSB0aGlzIGJyb3dzZXIpXCIsIHtzZW5kZXJOYW1lfSk7XG4gICAgfSBlbHNlIGlmICghaXNWb2ljZSAmJiBpc1N1cHBvcnRlZCkge1xuICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBwbGFjZWQgYSB2aWRlbyBjYWxsLlwiLCB7c2VuZGVyTmFtZX0pO1xuICAgIH0gZWxzZSBpZiAoIWlzVm9pY2UgJiYgIWlzU3VwcG9ydGVkKSB7XG4gICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHBsYWNlZCBhIHZpZGVvIGNhbGwuIChub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgYnJvd3NlcilcIiwge3NlbmRlck5hbWV9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JUaHJlZVBpZEludml0ZUV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3Qgc2VuZGVyTmFtZSA9IGV2ZW50LnNlbmRlciA/IGV2ZW50LnNlbmRlci5uYW1lIDogZXZlbnQuZ2V0U2VuZGVyKCk7XG5cbiAgICBpZiAoIWlzVmFsaWQzcGlkSW52aXRlKGV2ZW50KSkge1xuICAgICAgICBjb25zdCB0YXJnZXREaXNwbGF5TmFtZSA9IGV2ZW50LmdldFByZXZDb250ZW50KCkuZGlzcGxheV9uYW1lIHx8IF90KFwiU29tZW9uZVwiKTtcbiAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyByZXZva2VkIHRoZSBpbnZpdGF0aW9uIGZvciAlKHRhcmdldERpc3BsYXlOYW1lKXMgdG8gam9pbiB0aGUgcm9vbS4nLCB7XG4gICAgICAgICAgICBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgdGFyZ2V0RGlzcGxheU5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgc2VudCBhbiBpbnZpdGF0aW9uIHRvICUodGFyZ2V0RGlzcGxheU5hbWUpcyB0byBqb2luIHRoZSByb29tLicsIHtcbiAgICAgICAgc2VuZGVyTmFtZSxcbiAgICAgICAgdGFyZ2V0RGlzcGxheU5hbWU6IGV2ZW50LmdldENvbnRlbnQoKS5kaXNwbGF5X25hbWUsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRleHRGb3JIaXN0b3J5VmlzaWJpbGl0eUV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3Qgc2VuZGVyTmFtZSA9IGV2ZW50LnNlbmRlciA/IGV2ZW50LnNlbmRlci5uYW1lIDogZXZlbnQuZ2V0U2VuZGVyKCk7XG4gICAgc3dpdGNoIChldmVudC5nZXRDb250ZW50KCkuaGlzdG9yeV92aXNpYmlsaXR5KSB7XG4gICAgICAgIGNhc2UgJ2ludml0ZWQnOlxuICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyBtYWRlIGZ1dHVyZSByb29tIGhpc3RvcnkgdmlzaWJsZSB0byBhbGwgcm9vbSBtZW1iZXJzLCAnXG4gICAgICAgICAgICAgICAgKyAnZnJvbSB0aGUgcG9pbnQgdGhleSBhcmUgaW52aXRlZC4nLCB7c2VuZGVyTmFtZX0pO1xuICAgICAgICBjYXNlICdqb2luZWQnOlxuICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyBtYWRlIGZ1dHVyZSByb29tIGhpc3RvcnkgdmlzaWJsZSB0byBhbGwgcm9vbSBtZW1iZXJzLCAnXG4gICAgICAgICAgICAgICAgKyAnZnJvbSB0aGUgcG9pbnQgdGhleSBqb2luZWQuJywge3NlbmRlck5hbWV9KTtcbiAgICAgICAgY2FzZSAnc2hhcmVkJzpcbiAgICAgICAgICAgIHJldHVybiBfdCgnJShzZW5kZXJOYW1lKXMgbWFkZSBmdXR1cmUgcm9vbSBoaXN0b3J5IHZpc2libGUgdG8gYWxsIHJvb20gbWVtYmVycy4nLCB7c2VuZGVyTmFtZX0pO1xuICAgICAgICBjYXNlICd3b3JsZF9yZWFkYWJsZSc6XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIG1hZGUgZnV0dXJlIHJvb20gaGlzdG9yeSB2aXNpYmxlIHRvIGFueW9uZS4nLCB7c2VuZGVyTmFtZX0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIF90KCclKHNlbmRlck5hbWUpcyBtYWRlIGZ1dHVyZSByb29tIGhpc3RvcnkgdmlzaWJsZSB0byB1bmtub3duICglKHZpc2liaWxpdHkpcykuJywge1xuICAgICAgICAgICAgICAgIHNlbmRlck5hbWUsXG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogZXZlbnQuZ2V0Q29udGVudCgpLmhpc3RvcnlfdmlzaWJpbGl0eSxcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuLy8gQ3VycmVudGx5IHdpbGwgb25seSBkaXNwbGF5IGEgY2hhbmdlIGlmIGEgdXNlcidzIHBvd2VyIGxldmVsIGlzIGNoYW5nZWRcbmZ1bmN0aW9uIHRleHRGb3JQb3dlckV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3Qgc2VuZGVyTmFtZSA9IGV2ZW50LnNlbmRlciA/IGV2ZW50LnNlbmRlci5uYW1lIDogZXZlbnQuZ2V0U2VuZGVyKCk7XG4gICAgaWYgKCFldmVudC5nZXRQcmV2Q29udGVudCgpIHx8ICFldmVudC5nZXRQcmV2Q29udGVudCgpLnVzZXJzIHx8XG4gICAgICAgICFldmVudC5nZXRDb250ZW50KCkgfHwgIWV2ZW50LmdldENvbnRlbnQoKS51c2Vycykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGNvbnN0IHVzZXJEZWZhdWx0ID0gZXZlbnQuZ2V0Q29udGVudCgpLnVzZXJzX2RlZmF1bHQgfHwgMDtcbiAgICAvLyBDb25zdHJ1Y3Qgc2V0IG9mIHVzZXJJZHNcbiAgICBjb25zdCB1c2VycyA9IFtdO1xuICAgIE9iamVjdC5rZXlzKGV2ZW50LmdldENvbnRlbnQoKS51c2VycykuZm9yRWFjaChcbiAgICAgICAgKHVzZXJJZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJzLmluZGV4T2YodXNlcklkKSA9PT0gLTEpIHVzZXJzLnB1c2godXNlcklkKTtcbiAgICAgICAgfSxcbiAgICApO1xuICAgIE9iamVjdC5rZXlzKGV2ZW50LmdldFByZXZDb250ZW50KCkudXNlcnMpLmZvckVhY2goXG4gICAgICAgICh1c2VySWQpID0+IHtcbiAgICAgICAgICAgIGlmICh1c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xKSB1c2Vycy5wdXNoKHVzZXJJZCk7XG4gICAgICAgIH0sXG4gICAgKTtcbiAgICBjb25zdCBkaWZmID0gW107XG4gICAgLy8gWFhYOiBUaGlzIGlzIGFsc28gc3VyZWx5IGJyb2tlbiBmb3IgaTE4blxuICAgIHVzZXJzLmZvckVhY2goKHVzZXJJZCkgPT4ge1xuICAgICAgICAvLyBQcmV2aW91cyBwb3dlciBsZXZlbFxuICAgICAgICBjb25zdCBmcm9tID0gZXZlbnQuZ2V0UHJldkNvbnRlbnQoKS51c2Vyc1t1c2VySWRdO1xuICAgICAgICAvLyBDdXJyZW50IHBvd2VyIGxldmVsXG4gICAgICAgIGNvbnN0IHRvID0gZXZlbnQuZ2V0Q29udGVudCgpLnVzZXJzW3VzZXJJZF07XG4gICAgICAgIGlmICh0byAhPT0gZnJvbSkge1xuICAgICAgICAgICAgZGlmZi5wdXNoKFxuICAgICAgICAgICAgICAgIF90KCclKHVzZXJJZClzIGZyb20gJShmcm9tUG93ZXJMZXZlbClzIHRvICUodG9Qb3dlckxldmVsKXMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvd2VyTGV2ZWw6IFJvbGVzLnRleHR1YWxQb3dlckxldmVsKGZyb20sIHVzZXJEZWZhdWx0KSxcbiAgICAgICAgICAgICAgICAgICAgdG9Qb3dlckxldmVsOiBSb2xlcy50ZXh0dWFsUG93ZXJMZXZlbCh0bywgdXNlckRlZmF1bHQpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghZGlmZi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gX3QoJyUoc2VuZGVyTmFtZSlzIGNoYW5nZWQgdGhlIHBvd2VyIGxldmVsIG9mICUocG93ZXJMZXZlbERpZmZUZXh0KXMuJywge1xuICAgICAgICBzZW5kZXJOYW1lLFxuICAgICAgICBwb3dlckxldmVsRGlmZlRleHQ6IGRpZmYuam9pbihcIiwgXCIpLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXh0Rm9yUGlubmVkRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBzZW5kZXJOYW1lID0gZXZlbnQuc2VuZGVyID8gZXZlbnQuc2VuZGVyLm5hbWUgOiBldmVudC5nZXRTZW5kZXIoKTtcbiAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBjaGFuZ2VkIHRoZSBwaW5uZWQgbWVzc2FnZXMgZm9yIHRoZSByb29tLlwiLCB7c2VuZGVyTmFtZX0pO1xufVxuXG5mdW5jdGlvbiB0ZXh0Rm9yV2lkZ2V0RXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBzZW5kZXJOYW1lID0gZXZlbnQuZ2V0U2VuZGVyKCk7XG4gICAgY29uc3Qge25hbWU6IHByZXZOYW1lLCB0eXBlOiBwcmV2VHlwZSwgdXJsOiBwcmV2VXJsfSA9IGV2ZW50LmdldFByZXZDb250ZW50KCk7XG4gICAgY29uc3Qge25hbWUsIHR5cGUsIHVybH0gPSBldmVudC5nZXRDb250ZW50KCkgfHwge307XG5cbiAgICBsZXQgd2lkZ2V0TmFtZSA9IG5hbWUgfHwgcHJldk5hbWUgfHwgdHlwZSB8fCBwcmV2VHlwZSB8fCAnJztcbiAgICAvLyBBcHBseSBzZW50ZW5jZSBjYXNlIHRvIHdpZGdldCBuYW1lXG4gICAgaWYgKHdpZGdldE5hbWUgJiYgd2lkZ2V0TmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHdpZGdldE5hbWUgPSB3aWRnZXROYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyB3aWRnZXROYW1lLnNsaWNlKDEpICsgJyAnO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSB3aWRnZXQgd2FzIHJlbW92ZWQsIGl0cyBjb250ZW50IHNob3VsZCBiZSB7fSwgYnV0IHRoaXMgaXMgc3VmZmljaWVudGx5XG4gICAgLy8gZXF1aXZhbGVudCB0byB0aGF0IGNvbmRpdGlvbi5cbiAgICBpZiAodXJsKSB7XG4gICAgICAgIGlmIChwcmV2VXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUod2lkZ2V0TmFtZSlzIHdpZGdldCBtb2RpZmllZCBieSAlKHNlbmRlck5hbWUpcycsIHtcbiAgICAgICAgICAgICAgICB3aWRnZXROYW1lLCBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoJyUod2lkZ2V0TmFtZSlzIHdpZGdldCBhZGRlZCBieSAlKHNlbmRlck5hbWUpcycsIHtcbiAgICAgICAgICAgICAgICB3aWRnZXROYW1lLCBzZW5kZXJOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gX3QoJyUod2lkZ2V0TmFtZSlzIHdpZGdldCByZW1vdmVkIGJ5ICUoc2VuZGVyTmFtZSlzJywge1xuICAgICAgICAgICAgd2lkZ2V0TmFtZSwgc2VuZGVyTmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0ZXh0Rm9yTWpvbG5pckV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3Qgc2VuZGVyTmFtZSA9IGV2ZW50LmdldFNlbmRlcigpO1xuICAgIGNvbnN0IHtlbnRpdHk6IHByZXZFbnRpdHl9ID0gZXZlbnQuZ2V0UHJldkNvbnRlbnQoKTtcbiAgICBjb25zdCB7ZW50aXR5LCByZWNvbW1lbmRhdGlvbiwgcmVhc29ufSA9IGV2ZW50LmdldENvbnRlbnQoKTtcblxuICAgIC8vIFJ1bGUgcmVtb3ZlZFxuICAgIGlmICghZW50aXR5KSB7XG4gICAgICAgIGlmIChVU0VSX1JVTEVfVFlQRVMuaW5jbHVkZXMoZXZlbnQuZ2V0VHlwZSgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiJShzZW5kZXJOYW1lKXMgcmVtb3ZlZCB0aGUgcnVsZSBiYW5uaW5nIHVzZXJzIG1hdGNoaW5nICUoZ2xvYilzXCIsXG4gICAgICAgICAgICAgICAge3NlbmRlck5hbWUsIGdsb2I6IHByZXZFbnRpdHl9KTtcbiAgICAgICAgfSBlbHNlIGlmIChST09NX1JVTEVfVFlQRVMuaW5jbHVkZXMoZXZlbnQuZ2V0VHlwZSgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIF90KFwiJShzZW5kZXJOYW1lKXMgcmVtb3ZlZCB0aGUgcnVsZSBiYW5uaW5nIHJvb21zIG1hdGNoaW5nICUoZ2xvYilzXCIsXG4gICAgICAgICAgICAgICAge3NlbmRlck5hbWUsIGdsb2I6IHByZXZFbnRpdHl9KTtcbiAgICAgICAgfSBlbHNlIGlmIChTRVJWRVJfUlVMRV9UWVBFUy5pbmNsdWRlcyhldmVudC5nZXRUeXBlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyByZW1vdmVkIHRoZSBydWxlIGJhbm5pbmcgc2VydmVycyBtYXRjaGluZyAlKGdsb2Ipc1wiLFxuICAgICAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBnbG9iOiBwcmV2RW50aXR5fSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVbmtub3duIHR5cGUuIFdlJ2xsIHNheSBzb21ldGhpbmcsIGJ1dCB3ZSBzaG91bGRuJ3QgZW5kIHVwIGhlcmUuXG4gICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHJlbW92ZWQgYSBiYW4gcnVsZSBtYXRjaGluZyAlKGdsb2Ipc1wiLCB7c2VuZGVyTmFtZSwgZ2xvYjogcHJldkVudGl0eX0pO1xuICAgIH1cblxuICAgIC8vIEludmFsaWQgcnVsZVxuICAgIGlmICghcmVjb21tZW5kYXRpb24gfHwgIXJlYXNvbikgcmV0dXJuIF90KGAlKHNlbmRlck5hbWUpcyB1cGRhdGVkIGFuIGludmFsaWQgYmFuIHJ1bGVgLCB7c2VuZGVyTmFtZX0pO1xuXG4gICAgLy8gUnVsZSB1cGRhdGVkXG4gICAgaWYgKGVudGl0eSA9PT0gcHJldkVudGl0eSkge1xuICAgICAgICBpZiAoVVNFUl9SVUxFX1RZUEVTLmluY2x1ZGVzKGV2ZW50LmdldFR5cGUoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHVwZGF0ZWQgdGhlIHJ1bGUgYmFubmluZyB1c2VycyBtYXRjaGluZyAlKGdsb2IpcyBmb3IgJShyZWFzb24pc1wiLFxuICAgICAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBnbG9iOiBlbnRpdHksIHJlYXNvbn0pO1xuICAgICAgICB9IGVsc2UgaWYgKFJPT01fUlVMRV9UWVBFUy5pbmNsdWRlcyhldmVudC5nZXRUeXBlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyB1cGRhdGVkIHRoZSBydWxlIGJhbm5pbmcgcm9vbXMgbWF0Y2hpbmcgJShnbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgICAgICB7c2VuZGVyTmFtZSwgZ2xvYjogZW50aXR5LCByZWFzb259KTtcbiAgICAgICAgfSBlbHNlIGlmIChTRVJWRVJfUlVMRV9UWVBFUy5pbmNsdWRlcyhldmVudC5nZXRUeXBlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyB1cGRhdGVkIHRoZSBydWxlIGJhbm5pbmcgc2VydmVycyBtYXRjaGluZyAlKGdsb2IpcyBmb3IgJShyZWFzb24pc1wiLFxuICAgICAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBnbG9iOiBlbnRpdHksIHJlYXNvbn0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVW5rbm93biB0eXBlLiBXZSdsbCBzYXkgc29tZXRoaW5nIGJ1dCB3ZSBzaG91bGRuJ3QgZW5kIHVwIGhlcmUuXG4gICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHVwZGF0ZWQgYSBiYW4gcnVsZSBtYXRjaGluZyAlKGdsb2IpcyBmb3IgJShyZWFzb24pc1wiLFxuICAgICAgICAgICAge3NlbmRlck5hbWUsIGdsb2I6IGVudGl0eSwgcmVhc29ufSk7XG4gICAgfVxuXG4gICAgLy8gTmV3IHJ1bGVcbiAgICBpZiAoIXByZXZFbnRpdHkpIHtcbiAgICAgICAgaWYgKFVTRVJfUlVMRV9UWVBFUy5pbmNsdWRlcyhldmVudC5nZXRUeXBlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBjcmVhdGVkIGEgcnVsZSBiYW5uaW5nIHVzZXJzIG1hdGNoaW5nICUoZ2xvYilzIGZvciAlKHJlYXNvbilzXCIsXG4gICAgICAgICAgICAgICAge3NlbmRlck5hbWUsIGdsb2I6IGVudGl0eSwgcmVhc29ufSk7XG4gICAgICAgIH0gZWxzZSBpZiAoUk9PTV9SVUxFX1RZUEVTLmluY2x1ZGVzKGV2ZW50LmdldFR5cGUoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIGNyZWF0ZWQgYSBydWxlIGJhbm5pbmcgcm9vbXMgbWF0Y2hpbmcgJShnbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgICAgICB7c2VuZGVyTmFtZSwgZ2xvYjogZW50aXR5LCByZWFzb259KTtcbiAgICAgICAgfSBlbHNlIGlmIChTRVJWRVJfUlVMRV9UWVBFUy5pbmNsdWRlcyhldmVudC5nZXRUeXBlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBjcmVhdGVkIGEgcnVsZSBiYW5uaW5nIHNlcnZlcnMgbWF0Y2hpbmcgJShnbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgICAgICB7c2VuZGVyTmFtZSwgZ2xvYjogZW50aXR5LCByZWFzb259KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVua25vd24gdHlwZS4gV2UnbGwgc2F5IHNvbWV0aGluZyBidXQgd2Ugc2hvdWxkbid0IGVuZCB1cCBoZXJlLlxuICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBjcmVhdGVkIGEgYmFuIHJ1bGUgbWF0Y2hpbmcgJShnbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBnbG9iOiBlbnRpdHksIHJlYXNvbn0pO1xuICAgIH1cblxuICAgIC8vIGVsc2UgdGhlIGVudGl0eSAhPT0gcHJldkVudGl0eSAtIGNvdW50IGFzIGEgcmVtb3ZhbCAmIGFkZFxuICAgIGlmIChVU0VSX1JVTEVfVFlQRVMuaW5jbHVkZXMoZXZlbnQuZ2V0VHlwZSgpKSkge1xuICAgICAgICByZXR1cm4gX3QoXCIlKHNlbmRlck5hbWUpcyBjaGFuZ2VkIGEgcnVsZSB0aGF0IHdhcyBiYW5uaW5nIHVzZXJzIG1hdGNoaW5nICUob2xkR2xvYilzIHRvIG1hdGNoaW5nIFwiICtcbiAgICAgICAgICAgIFwiJShuZXdHbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBvbGRHbG9iOiBwcmV2RW50aXR5LCBuZXdHbG9iOiBlbnRpdHksIHJlYXNvbn0pO1xuICAgIH0gZWxzZSBpZiAoUk9PTV9SVUxFX1RZUEVTLmluY2x1ZGVzKGV2ZW50LmdldFR5cGUoKSkpIHtcbiAgICAgICAgcmV0dXJuIF90KFwiJShzZW5kZXJOYW1lKXMgY2hhbmdlZCBhIHJ1bGUgdGhhdCB3YXMgYmFubmluZyByb29tcyBtYXRjaGluZyAlKG9sZEdsb2IpcyB0byBtYXRjaGluZyBcIiArXG4gICAgICAgICAgICBcIiUobmV3R2xvYilzIGZvciAlKHJlYXNvbilzXCIsXG4gICAgICAgICAgICB7c2VuZGVyTmFtZSwgb2xkR2xvYjogcHJldkVudGl0eSwgbmV3R2xvYjogZW50aXR5LCByZWFzb259KTtcbiAgICB9IGVsc2UgaWYgKFNFUlZFUl9SVUxFX1RZUEVTLmluY2x1ZGVzKGV2ZW50LmdldFR5cGUoKSkpIHtcbiAgICAgICAgcmV0dXJuIF90KFwiJShzZW5kZXJOYW1lKXMgY2hhbmdlZCBhIHJ1bGUgdGhhdCB3YXMgYmFubmluZyBzZXJ2ZXJzIG1hdGNoaW5nICUob2xkR2xvYilzIHRvIG1hdGNoaW5nIFwiICtcbiAgICAgICAgICAgIFwiJShuZXdHbG9iKXMgZm9yICUocmVhc29uKXNcIixcbiAgICAgICAgICAgIHtzZW5kZXJOYW1lLCBvbGRHbG9iOiBwcmV2RW50aXR5LCBuZXdHbG9iOiBlbnRpdHksIHJlYXNvbn0pO1xuICAgIH1cblxuICAgIC8vIFVua25vd24gdHlwZS4gV2UnbGwgc2F5IHNvbWV0aGluZyBidXQgd2Ugc2hvdWxkbid0IGVuZCB1cCBoZXJlLlxuICAgIHJldHVybiBfdChcIiUoc2VuZGVyTmFtZSlzIHVwZGF0ZWQgYSBiYW4gcnVsZSB0aGF0IHdhcyBtYXRjaGluZyAlKG9sZEdsb2IpcyB0byBtYXRjaGluZyAlKG5ld0dsb2IpcyBcIiArXG4gICAgICAgIFwiZm9yICUocmVhc29uKXNcIiwge3NlbmRlck5hbWUsIG9sZEdsb2I6IHByZXZFbnRpdHksIG5ld0dsb2I6IGVudGl0eSwgcmVhc29ufSk7XG59XG5cbmNvbnN0IGhhbmRsZXJzID0ge1xuICAgICdtLnJvb20ubWVzc2FnZSc6IHRleHRGb3JNZXNzYWdlRXZlbnQsXG4gICAgJ20uY2FsbC5pbnZpdGUnOiB0ZXh0Rm9yQ2FsbEludml0ZUV2ZW50LFxuICAgICdtLmNhbGwuYW5zd2VyJzogdGV4dEZvckNhbGxBbnN3ZXJFdmVudCxcbiAgICAnbS5jYWxsLmhhbmd1cCc6IHRleHRGb3JDYWxsSGFuZ3VwRXZlbnQsXG59O1xuXG5jb25zdCBzdGF0ZUhhbmRsZXJzID0ge1xuICAgICdtLnJvb20uY2Fub25pY2FsX2FsaWFzJzogdGV4dEZvckNhbm9uaWNhbEFsaWFzRXZlbnQsXG4gICAgJ20ucm9vbS5uYW1lJzogdGV4dEZvclJvb21OYW1lRXZlbnQsXG4gICAgJ20ucm9vbS50b3BpYyc6IHRleHRGb3JUb3BpY0V2ZW50LFxuICAgICdtLnJvb20ubWVtYmVyJzogdGV4dEZvck1lbWJlckV2ZW50LFxuICAgICdtLnJvb20udGhpcmRfcGFydHlfaW52aXRlJzogdGV4dEZvclRocmVlUGlkSW52aXRlRXZlbnQsXG4gICAgJ20ucm9vbS5oaXN0b3J5X3Zpc2liaWxpdHknOiB0ZXh0Rm9ySGlzdG9yeVZpc2liaWxpdHlFdmVudCxcbiAgICAnbS5yb29tLnBvd2VyX2xldmVscyc6IHRleHRGb3JQb3dlckV2ZW50LFxuICAgICdtLnJvb20ucGlubmVkX2V2ZW50cyc6IHRleHRGb3JQaW5uZWRFdmVudCxcbiAgICAnbS5yb29tLnNlcnZlcl9hY2wnOiB0ZXh0Rm9yU2VydmVyQUNMRXZlbnQsXG4gICAgJ20ucm9vbS50b21ic3RvbmUnOiB0ZXh0Rm9yVG9tYnN0b25lRXZlbnQsXG4gICAgJ20ucm9vbS5qb2luX3J1bGVzJzogdGV4dEZvckpvaW5SdWxlc0V2ZW50LFxuICAgICdtLnJvb20uZ3Vlc3RfYWNjZXNzJzogdGV4dEZvckd1ZXN0QWNjZXNzRXZlbnQsXG4gICAgJ20ucm9vbS5yZWxhdGVkX2dyb3Vwcyc6IHRleHRGb3JSZWxhdGVkR3JvdXBzRXZlbnQsXG5cbiAgICAvLyBUT0RPOiBFbmFibGUgc3VwcG9ydCBmb3IgbS53aWRnZXQgZXZlbnQgdHlwZSAoaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTMxMTEpXG4gICAgJ2ltLnZlY3Rvci5tb2R1bGFyLndpZGdldHMnOiB0ZXh0Rm9yV2lkZ2V0RXZlbnQsXG59O1xuXG4vLyBBZGQgYWxsIHRoZSBNam9sbmlyIHN0dWZmIHRvIHRoZSByZW5kZXJlclxuZm9yIChjb25zdCBldlR5cGUgb2YgQUxMX1JVTEVfVFlQRVMpIHtcbiAgICBzdGF0ZUhhbmRsZXJzW2V2VHlwZV0gPSB0ZXh0Rm9yTWpvbG5pckV2ZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGV4dEZvckV2ZW50KGV2KSB7XG4gICAgY29uc3QgaGFuZGxlciA9IChldi5pc1N0YXRlKCkgPyBzdGF0ZUhhbmRsZXJzIDogaGFuZGxlcnMpW2V2LmdldFR5cGUoKV07XG4gICAgaWYgKGhhbmRsZXIpIHJldHVybiBoYW5kbGVyKGV2KTtcbiAgICByZXR1cm4gJyc7XG59XG4iXX0=