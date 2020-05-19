"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGenericPermalink = makeGenericPermalink;
exports.makeUserPermalink = makeUserPermalink;
exports.makeRoomPermalink = makeRoomPermalink;
exports.makeGroupPermalink = makeGroupPermalink;
exports.isPermalinkHost = isPermalinkHost;
exports.tryTransformEntityToPermalink = tryTransformEntityToPermalink;
exports.tryTransformPermalinkToLocalHref = tryTransformPermalinkToLocalHref;
exports.getPrimaryPermalinkEntity = getPrimaryPermalinkEntity;
exports.parsePermalink = parsePermalink;
exports.RoomPermalinkCreator = void 0;

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _isIp = _interopRequireDefault(require("is-ip"));

var utils = _interopRequireWildcard(require("matrix-js-sdk/src/utils"));

var _SpecPermalinkConstructor = _interopRequireWildcard(require("./SpecPermalinkConstructor"));

var _PermalinkConstructor = _interopRequireWildcard(require("./PermalinkConstructor"));

var _RiotPermalinkConstructor = _interopRequireDefault(require("./RiotPermalinkConstructor"));

var _linkifyMatrix = _interopRequireDefault(require("../../linkify-matrix"));

var _SdkConfig = _interopRequireDefault(require("../../SdkConfig"));

/*
Copyright 2019 New Vector Ltd

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
// The maximum number of servers to pick when working out which servers
// to add to permalinks. The servers are appended as ?via=example.org
const MAX_SERVER_CANDIDATES = 3; // Permalinks can have servers appended to them so that the user
// receiving them can have a fighting chance at joining the room.
// These servers are called "candidates" at this point because
// it is unclear whether they are going to be useful to actually
// join in the future.
//
// We pick 3 servers based on the following criteria:
//
//   Server 1: The highest power level user in the room, provided
//   they are at least PL 50. We don't calculate "what is a moderator"
//   here because it is less relevant for the vast majority of rooms.
//   We also want to ensure that we get an admin or high-ranking mod
//   as they are less likely to leave the room. If no user happens
//   to meet this criteria, we'll pick the most popular server in the
//   room.
//
//   Server 2: The next most popular server in the room (in user
//   distribution). This cannot be the same as Server 1. If no other
//   servers are available then we'll only return Server 1.
//
//   Server 3: The next most popular server by user distribution. This
//   has the same rules as Server 2, with the added exception that it
//   must be unique from Server 1 and 2.
// Rationale for popular servers: It's hard to get rid of people when
// they keep flocking in from a particular server. Sure, the server could
// be ACL'd in the future or for some reason be evicted from the room
// however an event like that is unlikely the larger the room gets. If
// the server is ACL'd at the time of generating the link however, we
// shouldn't pick them. We also don't pick IP addresses.
// Note: we don't pick the server the room was created on because the
// homeserver should already be using that server as a last ditch attempt
// and there's less of a guarantee that the server is a resident server.
// Instead, we actively figure out which servers are likely to be residents
// in the future and try to use those.
// Note: Users receiving permalinks that happen to have all 3 potential
// servers fail them (in terms of joining) are somewhat expected to hunt
// down the person who gave them the link to ask for a participating server.
// The receiving user can then manually append the known-good server to
// the list and magically have the link work.

class RoomPermalinkCreator {
  // We support being given a roomId as a fallback in the event the `room` object
  // doesn't exist or is not healthy for us to rely on. For example, loading a
  // permalink to a room which the MatrixClient doesn't know about.
  constructor(room, roomId = null) {
    this._room = room;
    this._roomId = room ? room.roomId : roomId;
    this._highestPlUserId = null;
    this._populationMap = null;
    this._bannedHostsRegexps = null;
    this._allowedHostsRegexps = null;
    this._serverCandidates = null;
    this._started = false;

    if (!this._roomId) {
      throw new Error("Failed to resolve a roomId for the permalink creator to use");
    }

    this.onMembership = this.onMembership.bind(this);
    this.onRoomState = this.onRoomState.bind(this);
  }

  load() {
    if (!this._room || !this._room.currentState) {
      // Under rare and unknown circumstances it is possible to have a room with no
      // currentState, at least potentially at the early stages of joining a room.
      // To avoid breaking everything, we'll just warn rather than throw as well as
      // not bother updating the various aspects of the share link.
      console.warn("Tried to load a permalink creator with no room state");
      return;
    }

    this._updateAllowedServers();

    this._updateHighestPlUser();

    this._updatePopulationMap();

    this._updateServerCandidates();
  }

  start() {
    this.load();

    this._room.on("RoomMember.membership", this.onMembership);

    this._room.on("RoomState.events", this.onRoomState);

    this._started = true;
  }

  stop() {
    this._room.removeListener("RoomMember.membership", this.onMembership);

    this._room.removeListener("RoomState.events", this.onRoomState);

    this._started = false;
  }

  isStarted() {
    return this._started;
  }

  forEvent(eventId) {
    return getPermalinkConstructor().forEvent(this._roomId, eventId, this._serverCandidates);
  }

  forRoom() {
    return getPermalinkConstructor().forRoom(this._roomId, this._serverCandidates);
  }

  onRoomState(event) {
    switch (event.getType()) {
      case "m.room.server_acl":
        this._updateAllowedServers();

        this._updateHighestPlUser();

        this._updatePopulationMap();

        this._updateServerCandidates();

        return;

      case "m.room.power_levels":
        this._updateHighestPlUser();

        this._updateServerCandidates();

        return;
    }
  }

  onMembership(evt, member, oldMembership) {
    const userId = member.userId;
    const membership = member.membership;
    const serverName = getServerName(userId);
    const hasJoined = oldMembership !== "join" && membership === "join";
    const hasLeft = oldMembership === "join" && membership !== "join";

    if (hasLeft) {
      this._populationMap[serverName]--;
    } else if (hasJoined) {
      this._populationMap[serverName]++;
    }

    this._updateHighestPlUser();

    this._updateServerCandidates();
  }

  _updateHighestPlUser() {
    const plEvent = this._room.currentState.getStateEvents("m.room.power_levels", "");

    if (plEvent) {
      const content = plEvent.getContent();

      if (content) {
        const users = content.users;

        if (users) {
          const entries = Object.entries(users);
          const allowedEntries = entries.filter(([userId]) => {
            const member = this._room.getMember(userId);

            if (!member || member.membership !== "join") {
              return false;
            }

            const serverName = getServerName(userId);
            return !isHostnameIpAddress(serverName) && !isHostInRegex(serverName, this._bannedHostsRegexps) && isHostInRegex(serverName, this._allowedHostsRegexps);
          });
          const maxEntry = allowedEntries.reduce((max, entry) => {
            return entry[1] > max[1] ? entry : max;
          }, [null, 0]);
          const [userId, powerLevel] = maxEntry; // object wasn't empty, and max entry wasn't a demotion from the default

          if (userId !== null && powerLevel >= 50) {
            this._highestPlUserId = userId;
            return;
          }
        }
      }
    }

    this._highestPlUserId = null;
  }

  _updateAllowedServers() {
    const bannedHostsRegexps = [];
    let allowedHostsRegexps = [new RegExp(".*")]; // default allow everyone

    if (this._room.currentState) {
      const aclEvent = this._room.currentState.getStateEvents("m.room.server_acl", "");

      if (aclEvent && aclEvent.getContent()) {
        const getRegex = hostname => new RegExp("^" + utils.globToRegexp(hostname, false) + "$");

        const denied = aclEvent.getContent().deny || [];
        denied.forEach(h => bannedHostsRegexps.push(getRegex(h)));
        const allowed = aclEvent.getContent().allow || [];
        allowedHostsRegexps = []; // we don't want to use the default rule here

        allowed.forEach(h => allowedHostsRegexps.push(getRegex(h)));
      }
    }

    this._bannedHostsRegexps = bannedHostsRegexps;
    this._allowedHostsRegexps = allowedHostsRegexps;
  }

  _updatePopulationMap() {
    const populationMap
    /*: { [server: string]: number }*/
    = {};

    for (const member of this._room.getJoinedMembers()) {
      const serverName = getServerName(member.userId);

      if (!populationMap[serverName]) {
        populationMap[serverName] = 0;
      }

      populationMap[serverName]++;
    }

    this._populationMap = populationMap;
  }

  _updateServerCandidates() {
    let candidates = [];

    if (this._highestPlUserId) {
      candidates.push(getServerName(this._highestPlUserId));
    }

    const serversByPopulation = Object.keys(this._populationMap).sort((a, b) => this._populationMap[b] - this._populationMap[a]).filter(a => {
      return !candidates.includes(a) && !isHostnameIpAddress(a) && !isHostInRegex(a, this._bannedHostsRegexps) && isHostInRegex(a, this._allowedHostsRegexps);
    });
    const remainingServers = serversByPopulation.slice(0, MAX_SERVER_CANDIDATES - candidates.length);
    candidates = candidates.concat(remainingServers);
    this._serverCandidates = candidates;
  }

}

exports.RoomPermalinkCreator = RoomPermalinkCreator;

function makeGenericPermalink(entityId
/*: string*/
)
/*: string*/
{
  return getPermalinkConstructor().forEntity(entityId);
}

function makeUserPermalink(userId) {
  return getPermalinkConstructor().forUser(userId);
}

function makeRoomPermalink(roomId) {
  if (!roomId) {
    throw new Error("can't permalink a falsey roomId");
  } // If the roomId isn't actually a room ID, don't try to list the servers.
  // Aliases are already routable, and don't need extra information.


  if (roomId[0] !== '!') return getPermalinkConstructor().forRoom(roomId, []);

  const client = _MatrixClientPeg.MatrixClientPeg.get();

  const room = client.getRoom(roomId);

  if (!room) {
    return getPermalinkConstructor().forRoom(roomId, []);
  }

  const permalinkCreator = new RoomPermalinkCreator(room);
  permalinkCreator.load();
  return permalinkCreator.forRoom();
}

function makeGroupPermalink(groupId) {
  return getPermalinkConstructor().forGroup(groupId);
}

function isPermalinkHost(host
/*: string*/
)
/*: boolean*/
{
  // Always check if the permalink is a spec permalink (callers are likely to call
  // parsePermalink after this function).
  if (new _SpecPermalinkConstructor.default().isPermalinkHost(host)) return true;
  return getPermalinkConstructor().isPermalinkHost(host);
}
/**
 * Transforms an entity (permalink, room alias, user ID, etc) into a local URL
 * if possible. If the given entity is not found to be valid enough to be converted
 * then a null value will be returned.
 * @param {string} entity The entity to transform.
 * @returns {string|null} The transformed permalink or null if unable.
 */


function tryTransformEntityToPermalink(entity
/*: string*/
)
/*: string*/
{
  if (!entity) return null; // Check to see if it is a bare entity for starters

  if (entity[0] === '#' || entity[0] === '!') return makeRoomPermalink(entity);
  if (entity[0] === '@') return makeUserPermalink(entity);
  if (entity[0] === '+') return makeGroupPermalink(entity); // Then try and merge it into a permalink

  return tryTransformPermalinkToLocalHref(entity);
}
/**
 * Transforms a permalink (or possible permalink) into a local URL if possible. If
 * the given permalink is found to not be a permalink, it'll be returned unaltered.
 * @param {string} permalink The permalink to try and transform.
 * @returns {string} The transformed permalink or original URL if unable.
 */


function tryTransformPermalinkToLocalHref(permalink
/*: string*/
)
/*: string*/
{
  if (!permalink.startsWith("http:") && !permalink.startsWith("https:")) {
    return permalink;
  }

  const m = permalink.match(_linkifyMatrix.default.VECTOR_URL_PATTERN);

  if (m) {
    return m[1];
  } // A bit of a hack to convert permalinks of unknown origin to Riot links


  try {
    const permalinkParts = parsePermalink(permalink);

    if (permalinkParts) {
      if (permalinkParts.roomIdOrAlias) {
        const eventIdPart = permalinkParts.eventId ? "/".concat(permalinkParts.eventId) : '';
        permalink = "#/room/".concat(permalinkParts.roomIdOrAlias).concat(eventIdPart);
      } else if (permalinkParts.groupId) {
        permalink = "#/group/".concat(permalinkParts.groupId);
      } else if (permalinkParts.userId) {
        permalink = "#/user/".concat(permalinkParts.userId);
      } // else not a valid permalink for our purposes - do not handle

    }
  } catch (e) {// Not an href we need to care about
  }

  return permalink;
}

function getPrimaryPermalinkEntity(permalink
/*: string*/
)
/*: string*/
{
  try {
    let permalinkParts = parsePermalink(permalink); // If not a permalink, try the vector patterns.

    if (!permalinkParts) {
      const m = permalink.match(_linkifyMatrix.default.VECTOR_URL_PATTERN);

      if (m) {
        // A bit of a hack, but it gets the job done
        const handler = new _RiotPermalinkConstructor.default("http://localhost");
        const entityInfo = m[1].split('#').slice(1).join('#');
        permalinkParts = handler.parsePermalink("http://localhost/#".concat(entityInfo));
      }
    }

    if (!permalinkParts) return null; // not processable

    if (permalinkParts.userId) return permalinkParts.userId;
    if (permalinkParts.groupId) return permalinkParts.groupId;
    if (permalinkParts.roomIdOrAlias) return permalinkParts.roomIdOrAlias;
  } catch (e) {// no entity - not a permalink
  }

  return null;
}

function getPermalinkConstructor()
/*: PermalinkConstructor*/
{
  const riotPrefix = _SdkConfig.default.get()['permalinkPrefix'];

  if (riotPrefix && riotPrefix !== _SpecPermalinkConstructor.baseUrl) {
    return new _RiotPermalinkConstructor.default(riotPrefix);
  }

  return new _SpecPermalinkConstructor.default();
}

function parsePermalink(fullUrl
/*: string*/
)
/*: PermalinkParts*/
{
  const riotPrefix = _SdkConfig.default.get()['permalinkPrefix'];

  if (fullUrl.startsWith(_SpecPermalinkConstructor.baseUrl)) {
    return new _SpecPermalinkConstructor.default().parsePermalink(fullUrl);
  } else if (riotPrefix && fullUrl.startsWith(riotPrefix)) {
    return new _RiotPermalinkConstructor.default(riotPrefix).parsePermalink(fullUrl);
  }

  return null; // not a permalink we can handle
}

function getServerName(userId) {
  return userId.split(":").splice(1).join(":");
}

function getHostnameFromMatrixDomain(domain) {
  if (!domain) return null;
  return new URL("https://".concat(domain)).hostname;
}

function isHostInRegex(hostname, regexps) {
  hostname = getHostnameFromMatrixDomain(hostname);
  if (!hostname) return true; // assumed

  if (regexps.length > 0 && !regexps[0].test) throw new Error(regexps[0]);
  return regexps.filter(h => h.test(hostname)).length > 0;
}

function isHostnameIpAddress(hostname) {
  hostname = getHostnameFromMatrixDomain(hostname);
  if (!hostname) return false; // is-ip doesn't want IPv6 addresses surrounded by brackets, so
  // take them off.

  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.substring(1, hostname.length - 1);
  }

  return (0, _isIp.default)(hostname);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wZXJtYWxpbmtzL1Blcm1hbGlua3MuanMiXSwibmFtZXMiOlsiTUFYX1NFUlZFUl9DQU5ESURBVEVTIiwiUm9vbVBlcm1hbGlua0NyZWF0b3IiLCJjb25zdHJ1Y3RvciIsInJvb20iLCJyb29tSWQiLCJfcm9vbSIsIl9yb29tSWQiLCJfaGlnaGVzdFBsVXNlcklkIiwiX3BvcHVsYXRpb25NYXAiLCJfYmFubmVkSG9zdHNSZWdleHBzIiwiX2FsbG93ZWRIb3N0c1JlZ2V4cHMiLCJfc2VydmVyQ2FuZGlkYXRlcyIsIl9zdGFydGVkIiwiRXJyb3IiLCJvbk1lbWJlcnNoaXAiLCJiaW5kIiwib25Sb29tU3RhdGUiLCJsb2FkIiwiY3VycmVudFN0YXRlIiwiY29uc29sZSIsIndhcm4iLCJfdXBkYXRlQWxsb3dlZFNlcnZlcnMiLCJfdXBkYXRlSGlnaGVzdFBsVXNlciIsIl91cGRhdGVQb3B1bGF0aW9uTWFwIiwiX3VwZGF0ZVNlcnZlckNhbmRpZGF0ZXMiLCJzdGFydCIsIm9uIiwic3RvcCIsInJlbW92ZUxpc3RlbmVyIiwiaXNTdGFydGVkIiwiZm9yRXZlbnQiLCJldmVudElkIiwiZ2V0UGVybWFsaW5rQ29uc3RydWN0b3IiLCJmb3JSb29tIiwiZXZlbnQiLCJnZXRUeXBlIiwiZXZ0IiwibWVtYmVyIiwib2xkTWVtYmVyc2hpcCIsInVzZXJJZCIsIm1lbWJlcnNoaXAiLCJzZXJ2ZXJOYW1lIiwiZ2V0U2VydmVyTmFtZSIsImhhc0pvaW5lZCIsImhhc0xlZnQiLCJwbEV2ZW50IiwiZ2V0U3RhdGVFdmVudHMiLCJjb250ZW50IiwiZ2V0Q29udGVudCIsInVzZXJzIiwiZW50cmllcyIsIk9iamVjdCIsImFsbG93ZWRFbnRyaWVzIiwiZmlsdGVyIiwiZ2V0TWVtYmVyIiwiaXNIb3N0bmFtZUlwQWRkcmVzcyIsImlzSG9zdEluUmVnZXgiLCJtYXhFbnRyeSIsInJlZHVjZSIsIm1heCIsImVudHJ5IiwicG93ZXJMZXZlbCIsImJhbm5lZEhvc3RzUmVnZXhwcyIsImFsbG93ZWRIb3N0c1JlZ2V4cHMiLCJSZWdFeHAiLCJhY2xFdmVudCIsImdldFJlZ2V4IiwiaG9zdG5hbWUiLCJ1dGlscyIsImdsb2JUb1JlZ2V4cCIsImRlbmllZCIsImRlbnkiLCJmb3JFYWNoIiwiaCIsInB1c2giLCJhbGxvd2VkIiwiYWxsb3ciLCJwb3B1bGF0aW9uTWFwIiwiZ2V0Sm9pbmVkTWVtYmVycyIsImNhbmRpZGF0ZXMiLCJzZXJ2ZXJzQnlQb3B1bGF0aW9uIiwia2V5cyIsInNvcnQiLCJhIiwiYiIsImluY2x1ZGVzIiwicmVtYWluaW5nU2VydmVycyIsInNsaWNlIiwibGVuZ3RoIiwiY29uY2F0IiwibWFrZUdlbmVyaWNQZXJtYWxpbmsiLCJlbnRpdHlJZCIsImZvckVudGl0eSIsIm1ha2VVc2VyUGVybWFsaW5rIiwiZm9yVXNlciIsIm1ha2VSb29tUGVybWFsaW5rIiwiY2xpZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0Um9vbSIsInBlcm1hbGlua0NyZWF0b3IiLCJtYWtlR3JvdXBQZXJtYWxpbmsiLCJncm91cElkIiwiZm9yR3JvdXAiLCJpc1Blcm1hbGlua0hvc3QiLCJob3N0IiwiU3BlY1Blcm1hbGlua0NvbnN0cnVjdG9yIiwidHJ5VHJhbnNmb3JtRW50aXR5VG9QZXJtYWxpbmsiLCJlbnRpdHkiLCJ0cnlUcmFuc2Zvcm1QZXJtYWxpbmtUb0xvY2FsSHJlZiIsInBlcm1hbGluayIsInN0YXJ0c1dpdGgiLCJtIiwibWF0Y2giLCJtYXRyaXhMaW5raWZ5IiwiVkVDVE9SX1VSTF9QQVRURVJOIiwicGVybWFsaW5rUGFydHMiLCJwYXJzZVBlcm1hbGluayIsInJvb21JZE9yQWxpYXMiLCJldmVudElkUGFydCIsImUiLCJnZXRQcmltYXJ5UGVybWFsaW5rRW50aXR5IiwiaGFuZGxlciIsIlJpb3RQZXJtYWxpbmtDb25zdHJ1Y3RvciIsImVudGl0eUluZm8iLCJzcGxpdCIsImpvaW4iLCJyaW90UHJlZml4IiwiU2RrQ29uZmlnIiwibWF0cml4dG9CYXNlVXJsIiwiZnVsbFVybCIsInNwbGljZSIsImdldEhvc3RuYW1lRnJvbU1hdHJpeERvbWFpbiIsImRvbWFpbiIsIlVSTCIsInJlZ2V4cHMiLCJ0ZXN0IiwiZW5kc1dpdGgiLCJzdWJzdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBO0FBQ0E7QUFDQSxNQUFNQSxxQkFBcUIsR0FBRyxDQUE5QixDLENBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVPLE1BQU1DLG9CQUFOLENBQTJCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBQyxFQUFBQSxXQUFXLENBQUNDLElBQUQsRUFBT0MsTUFBTSxHQUFHLElBQWhCLEVBQXNCO0FBQzdCLFNBQUtDLEtBQUwsR0FBYUYsSUFBYjtBQUNBLFNBQUtHLE9BQUwsR0FBZUgsSUFBSSxHQUFHQSxJQUFJLENBQUNDLE1BQVIsR0FBaUJBLE1BQXBDO0FBQ0EsU0FBS0csZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsU0FBS0MsbUJBQUwsR0FBMkIsSUFBM0I7QUFDQSxTQUFLQyxvQkFBTCxHQUE0QixJQUE1QjtBQUNBLFNBQUtDLGlCQUFMLEdBQXlCLElBQXpCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixLQUFoQjs7QUFFQSxRQUFJLENBQUMsS0FBS04sT0FBVixFQUFtQjtBQUNmLFlBQU0sSUFBSU8sS0FBSixDQUFVLDZEQUFWLENBQU47QUFDSDs7QUFFRCxTQUFLQyxZ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Qy9DLE1BQVIsR0FBaUIsQ0FBakIsSUFBc0IsQ0FBQytDLE9BQU8sQ0FBQyxDQUFELENBQVAsQ0FBV0MsSUFBdEMsRUFBNEMsTUFBTSxJQUFJM0gsS0FBSixDQUFVMEgsT0FBTyxDQUFDLENBQUQsQ0FBakIsQ0FBTjtBQUU1QyxTQUFPQSxPQUFPLENBQUNsRixNQUFSLENBQWVvQixDQUFDLElBQUlBLENBQUMsQ0FBQytELElBQUYsQ0FBT3JFLFFBQVAsQ0FBcEIsRUFBc0NxQixNQUF0QyxHQUErQyxDQUF0RDtBQUNIOztBQUVELFNBQVNqQyxtQkFBVCxDQUE2QlksUUFBN0IsRUFBdUM7QUFDbkNBLEVBQUFBLFFBQVEsR0FBR2lFLDJCQUEyQixDQUFDakUsUUFBRCxDQUF0QztBQUNBLE1BQUksQ0FBQ0EsUUFBTCxFQUFlLE9BQU8sS0FBUCxDQUZvQixDQUluQztBQUNBOztBQUNBLE1BQUlBLFFBQVEsQ0FBQzRDLFVBQVQsQ0FBb0IsR0FBcEIsS0FBNEI1QyxRQUFRLENBQUNzRSxRQUFULENBQWtCLEdBQWxCLENBQWhDLEVBQXdEO0FBQ3BEdEUsSUFBQUEsUUFBUSxHQUFHQSxRQUFRLENBQUN1RSxTQUFULENBQW1CLENBQW5CLEVBQXNCdkUsUUFBUSxDQUFDcUIsTUFBVCxHQUFrQixDQUF4QyxDQUFYO0FBQ0g7O0FBRUQsU0FBTyxtQkFBS3JCLFFBQUwsQ0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBpc0lwIGZyb20gXCJpcy1pcFwiO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnbWF0cml4LWpzLXNkay9zcmMvdXRpbHMnO1xuaW1wb3J0IFNwZWNQZXJtYWxpbmtDb25zdHJ1Y3Rvciwge2Jhc2VVcmwgYXMgbWF0cml4dG9CYXNlVXJsfSBmcm9tIFwiLi9TcGVjUGVybWFsaW5rQ29uc3RydWN0b3JcIjtcbmltcG9ydCBQZXJtYWxpbmtDb25zdHJ1Y3Rvciwge1Blcm1hbGlua1BhcnRzfSBmcm9tIFwiLi9QZXJtYWxpbmtDb25zdHJ1Y3RvclwiO1xuaW1wb3J0IFJpb3RQZXJtYWxpbmtDb25zdHJ1Y3RvciBmcm9tIFwiLi9SaW90UGVybWFsaW5rQ29uc3RydWN0b3JcIjtcbmltcG9ydCBtYXRyaXhMaW5raWZ5IGZyb20gXCIuLi8uLi9saW5raWZ5LW1hdHJpeFwiO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tIFwiLi4vLi4vU2RrQ29uZmlnXCI7XG5cbi8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBzZXJ2ZXJzIHRvIHBpY2sgd2hlbiB3b3JraW5nIG91dCB3aGljaCBzZXJ2ZXJzXG4vLyB0byBhZGQgdG8gcGVybWFsaW5rcy4gVGhlIHNlcnZlcnMgYXJlIGFwcGVuZGVkIGFzID92aWE9ZXhhbXBsZS5vcmdcbmNvbnN0IE1BWF9TRVJWRVJfQ0FORElEQVRFUyA9IDM7XG5cblxuLy8gUGVybWFsaW5rcyBjYW4gaGF2ZSBzZXJ2ZXJzIGFwcGVuZGVkIHRvIHRoZW0gc28gdGhhdCB0aGUgdXNlclxuLy8gcmVjZWl2aW5nIHRoZW0gY2FuIGhhdmUgYSBmaWdodGluZyBjaGFuY2UgYXQgam9pbmluZyB0aGUgcm9vbS5cbi8vIFRoZXNlIHNlcnZlcnMgYXJlIGNhbGxlZCBcImNhbmRpZGF0ZXNcIiBhdCB0aGlzIHBvaW50IGJlY2F1c2Vcbi8vIGl0IGlzIHVuY2xlYXIgd2hldGhlciB0aGV5IGFyZSBnb2luZyB0byBiZSB1c2VmdWwgdG8gYWN0dWFsbHlcbi8vIGpvaW4gaW4gdGhlIGZ1dHVyZS5cbi8vXG4vLyBXZSBwaWNrIDMgc2VydmVycyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIGNyaXRlcmlhOlxuLy9cbi8vICAgU2VydmVyIDE6IFRoZSBoaWdoZXN0IHBvd2VyIGxldmVsIHVzZXIgaW4gdGhlIHJvb20sIHByb3ZpZGVkXG4vLyAgIHRoZXkgYXJlIGF0IGxlYXN0IFBMIDUwLiBXZSBkb24ndCBjYWxjdWxhdGUgXCJ3aGF0IGlzIGEgbW9kZXJhdG9yXCJcbi8vICAgaGVyZSBiZWNhdXNlIGl0IGlzIGxlc3MgcmVsZXZhbnQgZm9yIHRoZSB2YXN0IG1ham9yaXR5IG9mIHJvb21zLlxuLy8gICBXZSBhbHNvIHdhbnQgdG8gZW5zdXJlIHRoYXQgd2UgZ2V0IGFuIGFkbWluIG9yIGhpZ2gtcmFua2luZyBtb2Rcbi8vICAgYXMgdGhleSBhcmUgbGVzcyBsaWtlbHkgdG8gbGVhdmUgdGhlIHJvb20uIElmIG5vIHVzZXIgaGFwcGVuc1xuLy8gICB0byBtZWV0IHRoaXMgY3JpdGVyaWEsIHdlJ2xsIHBpY2sgdGhlIG1vc3QgcG9wdWxhciBzZXJ2ZXIgaW4gdGhlXG4vLyAgIHJvb20uXG4vL1xuLy8gICBTZXJ2ZXIgMjogVGhlIG5leHQgbW9zdCBwb3B1bGFyIHNlcnZlciBpbiB0aGUgcm9vbSAoaW4gdXNlclxuLy8gICBkaXN0cmlidXRpb24pLiBUaGlzIGNhbm5vdCBiZSB0aGUgc2FtZSBhcyBTZXJ2ZXIgMS4gSWYgbm8gb3RoZXJcbi8vICAgc2VydmVycyBhcmUgYXZhaWxhYmxlIHRoZW4gd2UnbGwgb25seSByZXR1cm4gU2VydmVyIDEuXG4vL1xuLy8gICBTZXJ2ZXIgMzogVGhlIG5leHQgbW9zdCBwb3B1bGFyIHNlcnZlciBieSB1c2VyIGRpc3RyaWJ1dGlvbi4gVGhpc1xuLy8gICBoYXMgdGhlIHNhbWUgcnVsZXMgYXMgU2VydmVyIDIsIHdpdGggdGhlIGFkZGVkIGV4Y2VwdGlvbiB0aGF0IGl0XG4vLyAgIG11c3QgYmUgdW5pcXVlIGZyb20gU2VydmVyIDEgYW5kIDIuXG5cbi8vIFJhdGlvbmFsZSBmb3IgcG9wdWxhciBzZXJ2ZXJzOiBJdCdzIGhhcmQgdG8gZ2V0IHJpZCBvZiBwZW9wbGUgd2hlblxuLy8gdGhleSBrZWVwIGZsb2NraW5nIGluIGZyb20gYSBwYXJ0aWN1bGFyIHNlcnZlci4gU3VyZSwgdGhlIHNlcnZlciBjb3VsZFxuLy8gYmUgQUNMJ2QgaW4gdGhlIGZ1dHVyZSBvciBmb3Igc29tZSByZWFzb24gYmUgZXZpY3RlZCBmcm9tIHRoZSByb29tXG4vLyBob3dldmVyIGFuIGV2ZW50IGxpa2UgdGhhdCBpcyB1bmxpa2VseSB0aGUgbGFyZ2VyIHRoZSByb29tIGdldHMuIElmXG4vLyB0aGUgc2VydmVyIGlzIEFDTCdkIGF0IHRoZSB0aW1lIG9mIGdlbmVyYXRpbmcgdGhlIGxpbmsgaG93ZXZlciwgd2Vcbi8vIHNob3VsZG4ndCBwaWNrIHRoZW0uIFdlIGFsc28gZG9uJ3QgcGljayBJUCBhZGRyZXNzZXMuXG5cbi8vIE5vdGU6IHdlIGRvbid0IHBpY2sgdGhlIHNlcnZlciB0aGUgcm9vbSB3YXMgY3JlYXRlZCBvbiBiZWNhdXNlIHRoZVxuLy8gaG9tZXNlcnZlciBzaG91bGQgYWxyZWFkeSBiZSB1c2luZyB0aGF0IHNlcnZlciBhcyBhIGxhc3QgZGl0Y2ggYXR0ZW1wdFxuLy8gYW5kIHRoZXJlJ3MgbGVzcyBvZiBhIGd1YXJhbnRlZSB0aGF0IHRoZSBzZXJ2ZXIgaXMgYSByZXNpZGVudCBzZXJ2ZXIuXG4vLyBJbnN0ZWFkLCB3ZSBhY3RpdmVseSBmaWd1cmUgb3V0IHdoaWNoIHNlcnZlcnMgYXJlIGxpa2VseSB0byBiZSByZXNpZGVudHNcbi8vIGluIHRoZSBmdXR1cmUgYW5kIHRyeSB0byB1c2UgdGhvc2UuXG5cbi8vIE5vdGU6IFVzZXJzIHJlY2VpdmluZyBwZXJtYWxpbmtzIHRoYXQgaGFwcGVuIHRvIGhhdmUgYWxsIDMgcG90ZW50aWFsXG4vLyBzZXJ2ZXJzIGZhaWwgdGhlbSAoaW4gdGVybXMgb2Ygam9pbmluZykgYXJlIHNvbWV3aGF0IGV4cGVjdGVkIHRvIGh1bnRcbi8vIGRvd24gdGhlIHBlcnNvbiB3aG8gZ2F2ZSB0aGVtIHRoZSBsaW5rIHRvIGFzayBmb3IgYSBwYXJ0aWNpcGF0aW5nIHNlcnZlci5cbi8vIFRoZSByZWNlaXZpbmcgdXNlciBjYW4gdGhlbiBtYW51YWxseSBhcHBlbmQgdGhlIGtub3duLWdvb2Qgc2VydmVyIHRvXG4vLyB0aGUgbGlzdCBhbmQgbWFnaWNhbGx5IGhhdmUgdGhlIGxpbmsgd29yay5cblxuZXhwb3J0IGNsYXNzIFJvb21QZXJtYWxpbmtDcmVhdG9yIHtcbiAgICAvLyBXZSBzdXBwb3J0IGJlaW5nIGdpdmVuIGEgcm9vbUlkIGFzIGEgZmFsbGJhY2sgaW4gdGhlIGV2ZW50IHRoZSBgcm9vbWAgb2JqZWN0XG4gICAgLy8gZG9lc24ndCBleGlzdCBvciBpcyBub3QgaGVhbHRoeSBmb3IgdXMgdG8gcmVseSBvbi4gRm9yIGV4YW1wbGUsIGxvYWRpbmcgYVxuICAgIC8vIHBlcm1hbGluayB0byBhIHJvb20gd2hpY2ggdGhlIE1hdHJpeENsaWVudCBkb2Vzbid0IGtub3cgYWJvdXQuXG4gICAgY29uc3RydWN0b3Iocm9vbSwgcm9vbUlkID0gbnVsbCkge1xuICAgICAgICB0aGlzLl9yb29tID0gcm9vbTtcbiAgICAgICAgdGhpcy5fcm9vbUlkID0gcm9vbSA/IHJvb20ucm9vbUlkIDogcm9vbUlkO1xuICAgICAgICB0aGlzLl9oaWdoZXN0UGxVc2VySWQgPSBudWxsO1xuICAgICAgICB0aGlzLl9wb3B1bGF0aW9uTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYmFubmVkSG9zdHNSZWdleHBzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYWxsb3dlZEhvc3RzUmVnZXhwcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NlcnZlckNhbmRpZGF0ZXMgPSBudWxsO1xuICAgICAgICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9yb29tSWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byByZXNvbHZlIGEgcm9vbUlkIGZvciB0aGUgcGVybWFsaW5rIGNyZWF0b3IgdG8gdXNlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbk1lbWJlcnNoaXAgPSB0aGlzLm9uTWVtYmVyc2hpcC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uUm9vbVN0YXRlID0gdGhpcy5vblJvb21TdGF0ZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGxvYWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5fcm9vbSB8fCAhdGhpcy5fcm9vbS5jdXJyZW50U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIFVuZGVyIHJhcmUgYW5kIHVua25vd24gY2lyY3Vtc3RhbmNlcyBpdCBpcyBwb3NzaWJsZSB0byBoYXZlIGEgcm9vbSB3aXRoIG5vXG4gICAgICAgICAgICAvLyBjdXJyZW50U3RhdGUsIGF0IGxlYXN0IHBvdGVudGlhbGx5IGF0IHRoZSBlYXJseSBzdGFnZXMgb2Ygam9pbmluZyBhIHJvb20uXG4gICAgICAgICAgICAvLyBUbyBhdm9pZCBicmVha2luZyBldmVyeXRoaW5nLCB3ZSdsbCBqdXN0IHdhcm4gcmF0aGVyIHRoYW4gdGhyb3cgYXMgd2VsbCBhc1xuICAgICAgICAgICAgLy8gbm90IGJvdGhlciB1cGRhdGluZyB0aGUgdmFyaW91cyBhc3BlY3RzIG9mIHRoZSBzaGFyZSBsaW5rLlxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiVHJpZWQgdG8gbG9hZCBhIHBlcm1hbGluayBjcmVhdG9yIHdpdGggbm8gcm9vbSBzdGF0ZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVBbGxvd2VkU2VydmVycygpO1xuICAgICAgICB0aGlzLl91cGRhdGVIaWdoZXN0UGxVc2VyKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvcHVsYXRpb25NYXAoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlU2VydmVyQ2FuZGlkYXRlcygpO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLmxvYWQoKTtcbiAgICAgICAgdGhpcy5fcm9vbS5vbihcIlJvb21NZW1iZXIubWVtYmVyc2hpcFwiLCB0aGlzLm9uTWVtYmVyc2hpcCk7XG4gICAgICAgIHRoaXMuX3Jvb20ub24oXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGUpO1xuICAgICAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICB0aGlzLl9yb29tLnJlbW92ZUxpc3RlbmVyKFwiUm9vbU1lbWJlci5tZW1iZXJzaGlwXCIsIHRoaXMub25NZW1iZXJzaGlwKTtcbiAgICAgICAgdGhpcy5fcm9vbS5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5vblJvb21TdGF0ZSk7XG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpc1N0YXJ0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGFydGVkO1xuICAgIH1cblxuICAgIGZvckV2ZW50KGV2ZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1hbGlua0NvbnN0cnVjdG9yKCkuZm9yRXZlbnQodGhpcy5fcm9vbUlkLCBldmVudElkLCB0aGlzLl9zZXJ2ZXJDYW5kaWRhdGVzKTtcbiAgICB9XG5cbiAgICBmb3JSb29tKCkge1xuICAgICAgICByZXR1cm4gZ2V0UGVybWFsaW5rQ29uc3RydWN0b3IoKS5mb3JSb29tKHRoaXMuX3Jvb21JZCwgdGhpcy5fc2VydmVyQ2FuZGlkYXRlcyk7XG4gICAgfVxuXG4gICAgb25Sb29tU3RhdGUoZXZlbnQpIHtcbiAgICAgICAgc3dpdGNoIChldmVudC5nZXRUeXBlKCkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJtLnJvb20uc2VydmVyX2FjbFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUFsbG93ZWRTZXJ2ZXJzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlSGlnaGVzdFBsVXNlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBvcHVsYXRpb25NYXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTZXJ2ZXJDYW5kaWRhdGVzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSBcIm0ucm9vbS5wb3dlcl9sZXZlbHNcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVIaWdoZXN0UGxVc2VyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlU2VydmVyQ2FuZGlkYXRlcygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uTWVtYmVyc2hpcChldnQsIG1lbWJlciwgb2xkTWVtYmVyc2hpcCkge1xuICAgICAgICBjb25zdCB1c2VySWQgPSBtZW1iZXIudXNlcklkO1xuICAgICAgICBjb25zdCBtZW1iZXJzaGlwID0gbWVtYmVyLm1lbWJlcnNoaXA7XG4gICAgICAgIGNvbnN0IHNlcnZlck5hbWUgPSBnZXRTZXJ2ZXJOYW1lKHVzZXJJZCk7XG4gICAgICAgIGNvbnN0IGhhc0pvaW5lZCA9IG9sZE1lbWJlcnNoaXAgIT09IFwiam9pblwiICYmIG1lbWJlcnNoaXAgPT09IFwiam9pblwiO1xuICAgICAgICBjb25zdCBoYXNMZWZ0ID0gb2xkTWVtYmVyc2hpcCA9PT0gXCJqb2luXCIgJiYgbWVtYmVyc2hpcCAhPT0gXCJqb2luXCI7XG5cbiAgICAgICAgaWYgKGhhc0xlZnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvcHVsYXRpb25NYXBbc2VydmVyTmFtZV0tLTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNKb2luZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvcHVsYXRpb25NYXBbc2VydmVyTmFtZV0rKztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZUhpZ2hlc3RQbFVzZXIoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlU2VydmVyQ2FuZGlkYXRlcygpO1xuICAgIH1cblxuICAgIF91cGRhdGVIaWdoZXN0UGxVc2VyKCkge1xuICAgICAgICBjb25zdCBwbEV2ZW50ID0gdGhpcy5fcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpO1xuICAgICAgICBpZiAocGxFdmVudCkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHBsRXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VycyA9IGNvbnRlbnQudXNlcnM7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyh1c2Vycyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbG93ZWRFbnRyaWVzID0gZW50cmllcy5maWx0ZXIoKFt1c2VySWRdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZW1iZXIgPSB0aGlzLl9yb29tLmdldE1lbWJlcih1c2VySWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtZW1iZXIgfHwgbWVtYmVyLm1lbWJlcnNoaXAgIT09IFwiam9pblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyTmFtZSA9IGdldFNlcnZlck5hbWUodXNlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhaXNIb3N0bmFtZUlwQWRkcmVzcyhzZXJ2ZXJOYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFpc0hvc3RJblJlZ2V4KHNlcnZlck5hbWUsIHRoaXMuX2Jhbm5lZEhvc3RzUmVnZXhwcykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0hvc3RJblJlZ2V4KHNlcnZlck5hbWUsIHRoaXMuX2FsbG93ZWRIb3N0c1JlZ2V4cHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4RW50cnkgPSBhbGxvd2VkRW50cmllcy5yZWR1Y2UoKG1heCwgZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoZW50cnlbMV0gPiBtYXhbMV0pID8gZW50cnkgOiBtYXg7XG4gICAgICAgICAgICAgICAgICAgIH0sIFtudWxsLCAwXSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFt1c2VySWQsIHBvd2VyTGV2ZWxdID0gbWF4RW50cnk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdCB3YXNuJ3QgZW1wdHksIGFuZCBtYXggZW50cnkgd2Fzbid0IGEgZGVtb3Rpb24gZnJvbSB0aGUgZGVmYXVsdFxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlcklkICE9PSBudWxsICYmIHBvd2VyTGV2ZWwgPj0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hpZ2hlc3RQbFVzZXJJZCA9IHVzZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9oaWdoZXN0UGxVc2VySWQgPSBudWxsO1xuICAgIH1cblxuICAgIF91cGRhdGVBbGxvd2VkU2VydmVycygpIHtcbiAgICAgICAgY29uc3QgYmFubmVkSG9zdHNSZWdleHBzID0gW107XG4gICAgICAgIGxldCBhbGxvd2VkSG9zdHNSZWdleHBzID0gW25ldyBSZWdFeHAoXCIuKlwiKV07IC8vIGRlZmF1bHQgYWxsb3cgZXZlcnlvbmVcbiAgICAgICAgaWYgKHRoaXMuX3Jvb20uY3VycmVudFN0YXRlKSB7XG4gICAgICAgICAgICBjb25zdCBhY2xFdmVudCA9IHRoaXMuX3Jvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLnNlcnZlcl9hY2xcIiwgXCJcIik7XG4gICAgICAgICAgICBpZiAoYWNsRXZlbnQgJiYgYWNsRXZlbnQuZ2V0Q29udGVudCgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ2V0UmVnZXggPSAoaG9zdG5hbWUpID0+IG5ldyBSZWdFeHAoXCJeXCIgKyB1dGlscy5nbG9iVG9SZWdleHAoaG9zdG5hbWUsIGZhbHNlKSArIFwiJFwiKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbmllZCA9IGFjbEV2ZW50LmdldENvbnRlbnQoKS5kZW55IHx8IFtdO1xuICAgICAgICAgICAgICAgIGRlbmllZC5mb3JFYWNoKGggPT4gYmFubmVkSG9zdHNSZWdleHBzLnB1c2goZ2V0UmVnZXgoaCkpKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbG93ZWQgPSBhY2xFdmVudC5nZXRDb250ZW50KCkuYWxsb3cgfHwgW107XG4gICAgICAgICAgICAgICAgYWxsb3dlZEhvc3RzUmVnZXhwcyA9IFtdOyAvLyB3ZSBkb24ndCB3YW50IHRvIHVzZSB0aGUgZGVmYXVsdCBydWxlIGhlcmVcbiAgICAgICAgICAgICAgICBhbGxvd2VkLmZvckVhY2goaCA9PiBhbGxvd2VkSG9zdHNSZWdleHBzLnB1c2goZ2V0UmVnZXgoaCkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9iYW5uZWRIb3N0c1JlZ2V4cHMgPSBiYW5uZWRIb3N0c1JlZ2V4cHM7XG4gICAgICAgIHRoaXMuX2FsbG93ZWRIb3N0c1JlZ2V4cHMgPSBhbGxvd2VkSG9zdHNSZWdleHBzO1xuICAgIH1cblxuICAgIF91cGRhdGVQb3B1bGF0aW9uTWFwKCkge1xuICAgICAgICBjb25zdCBwb3B1bGF0aW9uTWFwOiB7IFtzZXJ2ZXI6IHN0cmluZ106IG51bWJlciB9ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIHRoaXMuX3Jvb20uZ2V0Sm9pbmVkTWVtYmVycygpKSB7XG4gICAgICAgICAgICBjb25zdCBzZXJ2ZXJOYW1lID0gZ2V0U2VydmVyTmFtZShtZW1iZXIudXNlcklkKTtcbiAgICAgICAgICAgIGlmICghcG9wdWxhdGlvbk1hcFtzZXJ2ZXJOYW1lXSkge1xuICAgICAgICAgICAgICAgIHBvcHVsYXRpb25NYXBbc2VydmVyTmFtZV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9wdWxhdGlvbk1hcFtzZXJ2ZXJOYW1lXSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BvcHVsYXRpb25NYXAgPSBwb3B1bGF0aW9uTWFwO1xuICAgIH1cblxuICAgIF91cGRhdGVTZXJ2ZXJDYW5kaWRhdGVzKCkge1xuICAgICAgICBsZXQgY2FuZGlkYXRlcyA9IFtdO1xuICAgICAgICBpZiAodGhpcy5faGlnaGVzdFBsVXNlcklkKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGVzLnB1c2goZ2V0U2VydmVyTmFtZSh0aGlzLl9oaWdoZXN0UGxVc2VySWQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlcnZlcnNCeVBvcHVsYXRpb24gPSBPYmplY3Qua2V5cyh0aGlzLl9wb3B1bGF0aW9uTWFwKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHRoaXMuX3BvcHVsYXRpb25NYXBbYl0gLSB0aGlzLl9wb3B1bGF0aW9uTWFwW2FdKVxuICAgICAgICAgICAgLmZpbHRlcihhID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWNhbmRpZGF0ZXMuaW5jbHVkZXMoYSkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWlzSG9zdG5hbWVJcEFkZHJlc3MoYSkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWlzSG9zdEluUmVnZXgoYSwgdGhpcy5fYmFubmVkSG9zdHNSZWdleHBzKSAmJlxuICAgICAgICAgICAgICAgICAgICBpc0hvc3RJblJlZ2V4KGEsIHRoaXMuX2FsbG93ZWRIb3N0c1JlZ2V4cHMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVtYWluaW5nU2VydmVycyA9IHNlcnZlcnNCeVBvcHVsYXRpb24uc2xpY2UoMCwgTUFYX1NFUlZFUl9DQU5ESURBVEVTIC0gY2FuZGlkYXRlcy5sZW5ndGgpO1xuICAgICAgICBjYW5kaWRhdGVzID0gY2FuZGlkYXRlcy5jb25jYXQocmVtYWluaW5nU2VydmVycyk7XG5cbiAgICAgICAgdGhpcy5fc2VydmVyQ2FuZGlkYXRlcyA9IGNhbmRpZGF0ZXM7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUdlbmVyaWNQZXJtYWxpbmsoZW50aXR5SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGdldFBlcm1hbGlua0NvbnN0cnVjdG9yKCkuZm9yRW50aXR5KGVudGl0eUlkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VVc2VyUGVybWFsaW5rKHVzZXJJZCkge1xuICAgIHJldHVybiBnZXRQZXJtYWxpbmtDb25zdHJ1Y3RvcigpLmZvclVzZXIodXNlcklkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VSb29tUGVybWFsaW5rKHJvb21JZCkge1xuICAgIGlmICghcm9vbUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbid0IHBlcm1hbGluayBhIGZhbHNleSByb29tSWRcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHJvb21JZCBpc24ndCBhY3R1YWxseSBhIHJvb20gSUQsIGRvbid0IHRyeSB0byBsaXN0IHRoZSBzZXJ2ZXJzLlxuICAgIC8vIEFsaWFzZXMgYXJlIGFscmVhZHkgcm91dGFibGUsIGFuZCBkb24ndCBuZWVkIGV4dHJhIGluZm9ybWF0aW9uLlxuICAgIGlmIChyb29tSWRbMF0gIT09ICchJykgcmV0dXJuIGdldFBlcm1hbGlua0NvbnN0cnVjdG9yKCkuZm9yUm9vbShyb29tSWQsIFtdKTtcblxuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20ocm9vbUlkKTtcbiAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1hbGlua0NvbnN0cnVjdG9yKCkuZm9yUm9vbShyb29tSWQsIFtdKTtcbiAgICB9XG4gICAgY29uc3QgcGVybWFsaW5rQ3JlYXRvciA9IG5ldyBSb29tUGVybWFsaW5rQ3JlYXRvcihyb29tKTtcbiAgICBwZXJtYWxpbmtDcmVhdG9yLmxvYWQoKTtcbiAgICByZXR1cm4gcGVybWFsaW5rQ3JlYXRvci5mb3JSb29tKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlR3JvdXBQZXJtYWxpbmsoZ3JvdXBJZCkge1xuICAgIHJldHVybiBnZXRQZXJtYWxpbmtDb25zdHJ1Y3RvcigpLmZvckdyb3VwKGdyb3VwSWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQZXJtYWxpbmtIb3N0KGhvc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIEFsd2F5cyBjaGVjayBpZiB0aGUgcGVybWFsaW5rIGlzIGEgc3BlYyBwZXJtYWxpbmsgKGNhbGxlcnMgYXJlIGxpa2VseSB0byBjYWxsXG4gICAgLy8gcGFyc2VQZXJtYWxpbmsgYWZ0ZXIgdGhpcyBmdW5jdGlvbikuXG4gICAgaWYgKG5ldyBTcGVjUGVybWFsaW5rQ29uc3RydWN0b3IoKS5pc1Blcm1hbGlua0hvc3QoaG9zdCkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBnZXRQZXJtYWxpbmtDb25zdHJ1Y3RvcigpLmlzUGVybWFsaW5rSG9zdChob3N0KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGFuIGVudGl0eSAocGVybWFsaW5rLCByb29tIGFsaWFzLCB1c2VyIElELCBldGMpIGludG8gYSBsb2NhbCBVUkxcbiAqIGlmIHBvc3NpYmxlLiBJZiB0aGUgZ2l2ZW4gZW50aXR5IGlzIG5vdCBmb3VuZCB0byBiZSB2YWxpZCBlbm91Z2ggdG8gYmUgY29udmVydGVkXG4gKiB0aGVuIGEgbnVsbCB2YWx1ZSB3aWxsIGJlIHJldHVybmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGVudGl0eSBUaGUgZW50aXR5IHRvIHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH0gVGhlIHRyYW5zZm9ybWVkIHBlcm1hbGluayBvciBudWxsIGlmIHVuYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVRyYW5zZm9ybUVudGl0eVRvUGVybWFsaW5rKGVudGl0eTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWVudGl0eSkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgaXQgaXMgYSBiYXJlIGVudGl0eSBmb3Igc3RhcnRlcnNcbiAgICBpZiAoZW50aXR5WzBdID09PSAnIycgfHwgZW50aXR5WzBdID09PSAnIScpIHJldHVybiBtYWtlUm9vbVBlcm1hbGluayhlbnRpdHkpO1xuICAgIGlmIChlbnRpdHlbMF0gPT09ICdAJykgcmV0dXJuIG1ha2VVc2VyUGVybWFsaW5rKGVudGl0eSk7XG4gICAgaWYgKGVudGl0eVswXSA9PT0gJysnKSByZXR1cm4gbWFrZUdyb3VwUGVybWFsaW5rKGVudGl0eSk7XG5cbiAgICAvLyBUaGVuIHRyeSBhbmQgbWVyZ2UgaXQgaW50byBhIHBlcm1hbGlua1xuICAgIHJldHVybiB0cnlUcmFuc2Zvcm1QZXJtYWxpbmtUb0xvY2FsSHJlZihlbnRpdHkpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBwZXJtYWxpbmsgKG9yIHBvc3NpYmxlIHBlcm1hbGluaykgaW50byBhIGxvY2FsIFVSTCBpZiBwb3NzaWJsZS4gSWZcbiAqIHRoZSBnaXZlbiBwZXJtYWxpbmsgaXMgZm91bmQgdG8gbm90IGJlIGEgcGVybWFsaW5rLCBpdCdsbCBiZSByZXR1cm5lZCB1bmFsdGVyZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gcGVybWFsaW5rIFRoZSBwZXJtYWxpbmsgdG8gdHJ5IGFuZCB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgdHJhbnNmb3JtZWQgcGVybWFsaW5rIG9yIG9yaWdpbmFsIFVSTCBpZiB1bmFibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnlUcmFuc2Zvcm1QZXJtYWxpbmtUb0xvY2FsSHJlZihwZXJtYWxpbms6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFwZXJtYWxpbmsuc3RhcnRzV2l0aChcImh0dHA6XCIpICYmICFwZXJtYWxpbmsuc3RhcnRzV2l0aChcImh0dHBzOlwiKSkge1xuICAgICAgICByZXR1cm4gcGVybWFsaW5rO1xuICAgIH1cblxuICAgIGNvbnN0IG0gPSBwZXJtYWxpbmsubWF0Y2gobWF0cml4TGlua2lmeS5WRUNUT1JfVVJMX1BBVFRFUk4pO1xuICAgIGlmIChtKSB7XG4gICAgICAgIHJldHVybiBtWzFdO1xuICAgIH1cblxuICAgIC8vIEEgYml0IG9mIGEgaGFjayB0byBjb252ZXJ0IHBlcm1hbGlua3Mgb2YgdW5rbm93biBvcmlnaW4gdG8gUmlvdCBsaW5rc1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBlcm1hbGlua1BhcnRzID0gcGFyc2VQZXJtYWxpbmsocGVybWFsaW5rKTtcbiAgICAgICAgaWYgKHBlcm1hbGlua1BhcnRzKSB7XG4gICAgICAgICAgICBpZiAocGVybWFsaW5rUGFydHMucm9vbUlkT3JBbGlhcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50SWRQYXJ0ID0gcGVybWFsaW5rUGFydHMuZXZlbnRJZCA/IGAvJHtwZXJtYWxpbmtQYXJ0cy5ldmVudElkfWAgOiAnJztcbiAgICAgICAgICAgICAgICBwZXJtYWxpbmsgPSBgIy9yb29tLyR7cGVybWFsaW5rUGFydHMucm9vbUlkT3JBbGlhc30ke2V2ZW50SWRQYXJ0fWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBlcm1hbGlua1BhcnRzLmdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICBwZXJtYWxpbmsgPSBgIy9ncm91cC8ke3Blcm1hbGlua1BhcnRzLmdyb3VwSWR9YDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGVybWFsaW5rUGFydHMudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgcGVybWFsaW5rID0gYCMvdXNlci8ke3Blcm1hbGlua1BhcnRzLnVzZXJJZH1gO1xuICAgICAgICAgICAgfSAvLyBlbHNlIG5vdCBhIHZhbGlkIHBlcm1hbGluayBmb3Igb3VyIHB1cnBvc2VzIC0gZG8gbm90IGhhbmRsZVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBOb3QgYW4gaHJlZiB3ZSBuZWVkIHRvIGNhcmUgYWJvdXRcbiAgICB9XG5cbiAgICByZXR1cm4gcGVybWFsaW5rO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJpbWFyeVBlcm1hbGlua0VudGl0eShwZXJtYWxpbms6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IHBlcm1hbGlua1BhcnRzID0gcGFyc2VQZXJtYWxpbmsocGVybWFsaW5rKTtcblxuICAgICAgICAvLyBJZiBub3QgYSBwZXJtYWxpbmssIHRyeSB0aGUgdmVjdG9yIHBhdHRlcm5zLlxuICAgICAgICBpZiAoIXBlcm1hbGlua1BhcnRzKSB7XG4gICAgICAgICAgICBjb25zdCBtID0gcGVybWFsaW5rLm1hdGNoKG1hdHJpeExpbmtpZnkuVkVDVE9SX1VSTF9QQVRURVJOKTtcbiAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgLy8gQSBiaXQgb2YgYSBoYWNrLCBidXQgaXQgZ2V0cyB0aGUgam9iIGRvbmVcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gbmV3IFJpb3RQZXJtYWxpbmtDb25zdHJ1Y3RvcihcImh0dHA6Ly9sb2NhbGhvc3RcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50aXR5SW5mbyA9IG1bMV0uc3BsaXQoJyMnKS5zbGljZSgxKS5qb2luKCcjJyk7XG4gICAgICAgICAgICAgICAgcGVybWFsaW5rUGFydHMgPSBoYW5kbGVyLnBhcnNlUGVybWFsaW5rKGBodHRwOi8vbG9jYWxob3N0LyMke2VudGl0eUluZm99YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBlcm1hbGlua1BhcnRzKSByZXR1cm4gbnVsbDsgLy8gbm90IHByb2Nlc3NhYmxlXG4gICAgICAgIGlmIChwZXJtYWxpbmtQYXJ0cy51c2VySWQpIHJldHVybiBwZXJtYWxpbmtQYXJ0cy51c2VySWQ7XG4gICAgICAgIGlmIChwZXJtYWxpbmtQYXJ0cy5ncm91cElkKSByZXR1cm4gcGVybWFsaW5rUGFydHMuZ3JvdXBJZDtcbiAgICAgICAgaWYgKHBlcm1hbGlua1BhcnRzLnJvb21JZE9yQWxpYXMpIHJldHVybiBwZXJtYWxpbmtQYXJ0cy5yb29tSWRPckFsaWFzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gbm8gZW50aXR5IC0gbm90IGEgcGVybWFsaW5rXG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFBlcm1hbGlua0NvbnN0cnVjdG9yKCk6IFBlcm1hbGlua0NvbnN0cnVjdG9yIHtcbiAgICBjb25zdCByaW90UHJlZml4ID0gU2RrQ29uZmlnLmdldCgpWydwZXJtYWxpbmtQcmVmaXgnXTtcbiAgICBpZiAocmlvdFByZWZpeCAmJiByaW90UHJlZml4ICE9PSBtYXRyaXh0b0Jhc2VVcmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSaW90UGVybWFsaW5rQ29uc3RydWN0b3IocmlvdFByZWZpeCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTcGVjUGVybWFsaW5rQ29uc3RydWN0b3IoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGVybWFsaW5rKGZ1bGxVcmw6IHN0cmluZyk6IFBlcm1hbGlua1BhcnRzIHtcbiAgICBjb25zdCByaW90UHJlZml4ID0gU2RrQ29uZmlnLmdldCgpWydwZXJtYWxpbmtQcmVmaXgnXTtcbiAgICBpZiAoZnVsbFVybC5zdGFydHNXaXRoKG1hdHJpeHRvQmFzZVVybCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTcGVjUGVybWFsaW5rQ29uc3RydWN0b3IoKS5wYXJzZVBlcm1hbGluayhmdWxsVXJsKTtcbiAgICB9IGVsc2UgaWYgKHJpb3RQcmVmaXggJiYgZnVsbFVybC5zdGFydHNXaXRoKHJpb3RQcmVmaXgpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmlvdFBlcm1hbGlua0NvbnN0cnVjdG9yKHJpb3RQcmVmaXgpLnBhcnNlUGVybWFsaW5rKGZ1bGxVcmwpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsOyAvLyBub3QgYSBwZXJtYWxpbmsgd2UgY2FuIGhhbmRsZVxufVxuXG5mdW5jdGlvbiBnZXRTZXJ2ZXJOYW1lKHVzZXJJZCkge1xuICAgIHJldHVybiB1c2VySWQuc3BsaXQoXCI6XCIpLnNwbGljZSgxKS5qb2luKFwiOlwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0SG9zdG5hbWVGcm9tTWF0cml4RG9tYWluKGRvbWFpbikge1xuICAgIGlmICghZG9tYWluKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gbmV3IFVSTChgaHR0cHM6Ly8ke2RvbWFpbn1gKS5ob3N0bmFtZTtcbn1cblxuZnVuY3Rpb24gaXNIb3N0SW5SZWdleChob3N0bmFtZSwgcmVnZXhwcykge1xuICAgIGhvc3RuYW1lID0gZ2V0SG9zdG5hbWVGcm9tTWF0cml4RG9tYWluKGhvc3RuYW1lKTtcbiAgICBpZiAoIWhvc3RuYW1lKSByZXR1cm4gdHJ1ZTsgLy8gYXNzdW1lZFxuICAgIGlmIChyZWdleHBzLmxlbmd0aCA+IDAgJiYgIXJlZ2V4cHNbMF0udGVzdCkgdGhyb3cgbmV3IEVycm9yKHJlZ2V4cHNbMF0pO1xuXG4gICAgcmV0dXJuIHJlZ2V4cHMuZmlsdGVyKGggPT4gaC50ZXN0KGhvc3RuYW1lKSkubGVuZ3RoID4gMDtcbn1cblxuZnVuY3Rpb24gaXNIb3N0bmFtZUlwQWRkcmVzcyhob3N0bmFtZSkge1xuICAgIGhvc3RuYW1lID0gZ2V0SG9zdG5hbWVGcm9tTWF0cml4RG9tYWluKGhvc3RuYW1lKTtcbiAgICBpZiAoIWhvc3RuYW1lKSByZXR1cm4gZmFsc2U7XG5cbiAgICAvLyBpcy1pcCBkb2Vzbid0IHdhbnQgSVB2NiBhZGRyZXNzZXMgc3Vycm91bmRlZCBieSBicmFja2V0cywgc29cbiAgICAvLyB0YWtlIHRoZW0gb2ZmLlxuICAgIGlmIChob3N0bmFtZS5zdGFydHNXaXRoKFwiW1wiKSAmJiBob3N0bmFtZS5lbmRzV2l0aChcIl1cIikpIHtcbiAgICAgICAgaG9zdG5hbWUgPSBob3N0bmFtZS5zdWJzdHJpbmcoMSwgaG9zdG5hbWUubGVuZ3RoIC0gMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzSXAoaG9zdG5hbWUpO1xufVxuIl19