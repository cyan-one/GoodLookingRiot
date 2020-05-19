"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ALGO_RECENT = exports.ALGO_ALPHABETIC = exports.ALGO_MANUAL = exports.TAG_DM = void 0;

var _utils = require("flux/utils");

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var _DMRoomMap = _interopRequireDefault(require("../utils/DMRoomMap"));

var Unread = _interopRequireWildcard(require("../Unread"));

var _SettingsStore = _interopRequireDefault(require("../settings/SettingsStore"));

/*
Copyright 2018, 2019 New Vector Ltd

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

/*
Room sorting algorithm:
* Always prefer to have red > grey > bold > idle
* The room being viewed should be sticky (not jump down to the idle list)
* When switching to a new room, sort the last sticky room to the top of the idle list.

The approach taken by the store is to generate an initial representation of all the
tagged lists (accepting that it'll take a little bit longer to calculate) and make
small changes to that over time. This results in quick changes to the room list while
also having update operations feel more like popping/pushing to a stack.
 */
const CATEGORY_RED = "red"; // Mentions in the room

const CATEGORY_GREY = "grey"; // Unread notified messages (not mentions)

const CATEGORY_BOLD = "bold"; // Unread messages (not notified, 'Mentions Only' rooms)

const CATEGORY_IDLE = "idle"; // Nothing of interest

const TAG_DM = "im.vector.fake.direct";
/**
 * Identifier for manual sorting behaviour: sort by the user defined order.
 * @type {string}
 */

exports.TAG_DM = TAG_DM;
const ALGO_MANUAL = "manual";
/**
 * Identifier for alphabetic sorting behaviour: sort by the room name alphabetically first.
 * @type {string}
 */

exports.ALGO_MANUAL = ALGO_MANUAL;
const ALGO_ALPHABETIC = "alphabetic";
/**
 * Identifier for classic sorting behaviour: sort by the most recent message first.
 * @type {string}
 */

exports.ALGO_ALPHABETIC = ALGO_ALPHABETIC;
const ALGO_RECENT = "recent";
exports.ALGO_RECENT = ALGO_RECENT;
const CATEGORY_ORDER = [CATEGORY_RED, CATEGORY_GREY, CATEGORY_BOLD, CATEGORY_IDLE];

const getListAlgorithm = (listKey, settingAlgorithm) => {
  // apply manual sorting only to m.favourite, otherwise respect the global setting
  // all the known tags are listed explicitly here to simplify future changes
  switch (listKey) {
    case "im.vector.fake.invite":
    case "im.vector.fake.recent":
    case "im.vector.fake.archived":
    case "m.lowpriority":
    case TAG_DM:
      return settingAlgorithm;

    case "m.favourite":
    default:
      // custom-tags
      return ALGO_MANUAL;
  }
};

const knownLists = new Set(["m.favourite", "im.vector.fake.invite", "im.vector.fake.recent", "im.vector.fake.archived", "m.lowpriority", TAG_DM]);
/**
 * A class for storing application state for categorising rooms in
 * the RoomList.
 */

class RoomListStore extends _utils.Store {
  constructor() {
    super(_dispatcher.default);

    this._init();

    this._getManualComparator = this._getManualComparator.bind(this);
    this._recentsComparator = this._recentsComparator.bind(this);
  }
  /**
   * Changes the sorting algorithm used by the RoomListStore.
   * @param {string} algorithm The new algorithm to use. Should be one of the ALGO_* constants.
   * @param {boolean} orderImportantFirst Whether to sort by categories of importance
   */


  updateSortingAlgorithm(algorithm, orderImportantFirst) {
    // Dev note: We only have two algorithms at the moment, but it isn't impossible that we want
    // multiple in the future. Also constants make things slightly clearer.
    console.log("Updating room sorting algorithm: ", {
      algorithm,
      orderImportantFirst
    });

    this._setState({
      algorithm,
      orderImportantFirst
    }); // Trigger a resort of the entire list to reflect the change in algorithm


    this._generateInitialRoomLists();
  }

  _init() {
    // Initialise state
    const defaultLists = {
      "m.server_notice": [
        /* { room: js-sdk room, category: string } */
      ],
      "im.vector.fake.invite": [],
      "m.favourite": [],
      "im.vector.fake.recent": [],
      [TAG_DM]: [],
      "m.lowpriority": [],
      "im.vector.fake.archived": []
    };
    this._state = {
      // The rooms in these arrays are ordered according to either the
      // 'recents' behaviour or 'manual' behaviour.
      lists: defaultLists,
      presentationLists: defaultLists,
      // like `lists`, but with arrays of rooms instead
      ready: false,
      stickyRoomId: null,
      algorithm: ALGO_RECENT,
      orderImportantFirst: false
    };

    _SettingsStore.default.monitorSetting('RoomList.orderAlphabetically', null);

    _SettingsStore.default.monitorSetting('RoomList.orderByImportance', null);

    _SettingsStore.default.monitorSetting('feature_custom_tags', null);
  }

  _setState(newState) {
    // If we're changing the lists, transparently change the presentation lists (which
    // is given to requesting components). This dramatically simplifies our code elsewhere
    // while also ensuring we don't need to update all the calling components to support
    // categories.
    if (newState['lists']) {
      const presentationLists = {};

      for (const key of Object.keys(newState['lists'])) {
        presentationLists[key] = newState['lists'][key].map(e => e.room);
      }

      newState['presentationLists'] = presentationLists;
    }

    this._state = Object.assign(this._state, newState);

    this.__emitChange();
  }

  __onDispatch(payload) {
    const logicallyReady = this._matrixClient && this._state.ready;

    switch (payload.action) {
      case 'setting_updated':
        {
          if (!logicallyReady) break;

          switch (payload.settingName) {
            case "RoomList.orderAlphabetically":
              this.updateSortingAlgorithm(payload.newValue ? ALGO_ALPHABETIC : ALGO_RECENT, this._state.orderImportantFirst);
              break;

            case "RoomList.orderByImportance":
              this.updateSortingAlgorithm(this._state.algorithm, payload.newValue);
              break;

            case "feature_custom_tags":
              this._setState({
                tagsEnabled: payload.newValue
              });

              this._generateInitialRoomLists(); // Tags means we have to start from scratch


              break;
          }
        }
        break;
      // Initialise state after initial sync

      case 'MatrixActions.sync':
        {
          if (!(payload.prevState !== 'PREPARED' && payload.state === 'PREPARED')) {
            break;
          } // Always ensure that we set any state needed for settings here. It is possible that
          // setting updates trigger on startup before we are ready to sync, so we want to make
          // sure that the right state is in place before we actually react to those changes.


          this._setState({
            tagsEnabled: _SettingsStore.default.isFeatureEnabled("feature_custom_tags")
          });

          this._matrixClient = payload.matrixClient;

          const orderByImportance = _SettingsStore.default.getValue("RoomList.orderByImportance");

          const orderAlphabetically = _SettingsStore.default.getValue("RoomList.orderAlphabetically");

          this.updateSortingAlgorithm(orderAlphabetically ? ALGO_ALPHABETIC : ALGO_RECENT, orderByImportance);
        }
        break;

      case 'MatrixActions.Room.receipt':
        {
          if (!logicallyReady) break; // First see if the receipt event is for our own user. If it was, trigger
          // a room update (we probably read the room on a different device).

          const myUserId = this._matrixClient.getUserId();

          for (const eventId of Object.keys(payload.event.getContent())) {
            const receiptUsers = Object.keys(payload.event.getContent()[eventId]['m.read'] || {});

            if (receiptUsers.includes(myUserId)) {
              this._roomUpdateTriggered(payload.room.roomId);

              return;
            }
          }
        }
        break;

      case 'MatrixActions.Room.tags':
        {
          if (!logicallyReady) break; // TODO: Figure out which rooms changed in the tag and only change those.
          // This is very blunt and wipes out the sticky room stuff

          this._generateInitialRoomLists();
        }
        break;

      case 'MatrixActions.Room.timeline':
        {
          if (!logicallyReady || !payload.isLiveEvent || !payload.isLiveUnfilteredRoomTimelineEvent || !this._eventTriggersRecentReorder(payload.event) || this._state.algorithm !== ALGO_RECENT) {
            break;
          }

          this._roomUpdateTriggered(payload.event.getRoomId());
        }
        break;
      // When an event is decrypted, it could mean we need to reorder the room
      // list because we now know the type of the event.

      case 'MatrixActions.Event.decrypted':
        {
          if (!logicallyReady) break;
          const roomId = payload.event.getRoomId(); // We may have decrypted an event without a roomId (e.g to_device)

          if (!roomId) break;

          const room = this._matrixClient.getRoom(roomId); // We somehow decrypted an event for a room our client is unaware of


          if (!room) break;
          const liveTimeline = room.getLiveTimeline();
          const eventTimeline = room.getTimelineForEvent(payload.event.getId()); // Either this event was not added to the live timeline (e.g. pagination)
          // or it doesn't affect the ordering of the room list.

          if (liveTimeline !== eventTimeline || !this._eventTriggersRecentReorder(payload.event)) {
            break;
          }

          this._roomUpdateTriggered(roomId);
        }
        break;

      case 'MatrixActions.accountData':
        {
          if (!logicallyReady) break;
          if (payload.event_type !== 'm.direct') break; // TODO: Figure out which rooms changed in the direct chat and only change those.
          // This is very blunt and wipes out the sticky room stuff

          this._generateInitialRoomLists();
        }
        break;

      case 'MatrixActions.Room.myMembership':
        {
          if (!logicallyReady) break;

          this._roomUpdateTriggered(payload.room.roomId, true);
        }
        break;
      // This could be a new room that we've been invited to, joined or created
      // we won't get a RoomMember.membership for these cases if we're not already
      // a member.

      case 'MatrixActions.Room':
        {
          if (!logicallyReady) break;

          this._roomUpdateTriggered(payload.room.roomId, true);
        }
        break;
      // TODO: Re-enable optimistic updates when we support dragging again
      // case 'RoomListActions.tagRoom.pending': {
      //     if (!logicallyReady) break;
      //     // XXX: we only show one optimistic update at any one time.
      //     // Ideally we should be making a list of in-flight requests
      //     // that are backed by transaction IDs. Until the js-sdk
      //     // supports this, we're stuck with only being able to use
      //     // the most recent optimistic update.
      //     console.log("!! Optimistic tag: ", payload);
      // }
      // break;
      // case 'RoomListActions.tagRoom.failure': {
      //     if (!logicallyReady) break;
      //     // Reset state according to js-sdk
      //     console.log("!! Optimistic tag failure: ", payload);
      // }
      // break;

      case 'on_client_not_viable':
      case 'on_logged_out':
        {
          // Reset state without pushing an update to the view, which generally assumes that
          // the matrix client isn't `null` and so causing a re-render will cause NPEs.
          this._init();

          this._matrixClient = null;
        }
        break;

      case 'view_room':
        {
          if (!logicallyReady) break; // Note: it is important that we set a new stickyRoomId before setting the old room
          // to IDLE. If we don't, the wrong room gets counted as sticky.

          const currentStickyId = this._state.stickyRoomId;

          this._setState({
            stickyRoomId: payload.room_id
          });

          if (currentStickyId) {
            this._setRoomCategory(this._matrixClient.getRoom(currentStickyId), CATEGORY_IDLE);
          }
        }
        break;
    }
  }

  _roomUpdateTriggered(roomId, ignoreSticky) {
    // We don't calculate categories for sticky rooms because we have a moderate
    // interest in trying to maintain the category that they were last in before
    // being artificially flagged as IDLE. Also, this reduces the amount of time
    // we spend in _setRoomCategory ever so slightly.
    if (this._state.stickyRoomId !== roomId || ignoreSticky) {
      // Micro optimization: Only look up the room if we're confident we'll need it.
      const room = this._matrixClient.getRoom(roomId);

      if (!room) return;

      const category = this._calculateCategory(room);

      this._setRoomCategory(room, category);
    }
  }

  _filterTags(tags) {
    tags = tags ? Object.keys(tags) : [];
    if (this._state.tagsEnabled) return tags;
    return tags.filter(t => knownLists.has(t));
  }

  _getRecommendedTagsForRoom(room) {
    const tags = [];
    const myMembership = room.getMyMembership();

    if (myMembership === 'join' || myMembership === 'invite') {
      // Stack the user's tags on top
      tags.push(...this._filterTags(room.tags)); // Order matters here: The DMRoomMap updates before invites
      // are accepted, so we check to see if the room is an invite
      // first, then if it is a direct chat, and finally default
      // to the "recents" list.

      const dmRoomMap = _DMRoomMap.default.shared();

      if (myMembership === 'invite') {
        tags.push("im.vector.fake.invite");
      } else if (dmRoomMap.getUserIdForRoomId(room.roomId) && tags.length === 0) {
        // We intentionally don't duplicate rooms in other tags into the people list
        // as a feature.
        tags.push(TAG_DM);
      } else if (tags.length === 0) {
        tags.push("im.vector.fake.recent");
      }
    } else if (myMembership) {
      // null-guard as null means it was peeked
      tags.push("im.vector.fake.archived");
    }

    return tags;
  }

  _slotRoomIntoList(room, category, tag, existingEntries, newList, lastTimestampFn) {
    const targetCategoryIndex = CATEGORY_ORDER.indexOf(category);

    let categoryComparator = (a, b) => lastTimestampFn(a.room) >= lastTimestampFn(b.room);

    const sortAlgorithm = getListAlgorithm(tag, this._state.algorithm);

    if (sortAlgorithm === ALGO_RECENT) {
      categoryComparator = (a, b) => this._recentsComparator(a, b, lastTimestampFn);
    } else if (sortAlgorithm === ALGO_ALPHABETIC) {
      categoryComparator = (a, b) => this._lexicographicalComparator(a, b);
    } // The slotting algorithm works by trying to position the room in the most relevant
    // category of the list (red > grey > etc). To accomplish this, we need to consider
    // a couple cases: the category existing in the list but having other rooms in it and
    // the case of the category simply not existing and needing to be started. In order to
    // do this efficiently, we only want to iterate over the list once and solve our sorting
    // problem as we go.
    //
    // Firstly, we'll remove any existing entry that references the room we're trying to
    // insert. We don't really want to consider the old entry and want to recreate it. We
    // also exclude the sticky (currently active) room from the categorization logic and
    // let it pass through wherever it resides in the list: it shouldn't be moving around
    // the list too much, so we want to keep it where it is.
    //
    // The case of the category we want existing is easy to handle: once we hit the category,
    // find the room that has a most recent event later than our own and insert just before
    // that (making us the more recent room). If we end up hitting the next category before
    // we can slot the room in, insert the room at the top of the category as a fallback. We
    // do this to ensure that the room doesn't go too far down the list given it was previously
    // considered important (in the case of going down in category) or is now more important
    // (suddenly becoming red, for instance). The boundary tracking is how we end up achieving
    // this, as described in the next paragraphs.
    //
    // The other case of the category not already existing is a bit more complicated. We track
    // the boundaries of each category relative to the list we're currently building so that
    // when we miss the category we can insert the room at the right spot. Most importantly, we
    // can't assume that the end of the list being built is the right spot because of the last
    // paragraph's requirement: the room should be put to the top of a category if the category
    // runs out of places to put it.
    //
    // All told, our tracking looks something like this:
    //
    // ------ A <- Category boundary (start of red)
    //  RED
    //  RED
    //  RED
    // ------ B <- In this example, we have a grey room we want to insert.
    //  BOLD
    //  BOLD
    // ------ C
    //  IDLE
    //  IDLE
    // ------ D <- End of list
    //
    // Given that example, and our desire to insert a GREY room into the list, this iterates
    // over the room list until it realizes that BOLD comes after GREY and we're no longer
    // in the RED section. Because there's no rooms there, we simply insert there which is
    // also a "category boundary". If we change the example to wanting to insert a BOLD room
    // which can't be ordered by timestamp with the existing couple rooms, we would still make
    // use of the boundary flag to insert at B before changing the boundary indicator to C.


    let desiredCategoryBoundaryIndex = 0;
    let foundBoundary = false;
    let pushedEntry = false;

    for (const entry of existingEntries) {
      // We insert our own record as needed, so don't let the old one through.
      if (entry.room.roomId === room.roomId) {
        continue;
      } // if the list is a recent list, and the room appears in this list, and we're
      // not looking at a sticky room (sticky rooms have unreliable categories), try
      // to slot the new room in


      if (entry.room.roomId !== this._state.stickyRoomId && !pushedEntry) {
        const entryCategoryIndex = CATEGORY_ORDER.indexOf(entry.category); // As per above, check if we're meeting that boundary we wanted to locate.

        if (entryCategoryIndex >= targetCategoryIndex && !foundBoundary) {
          desiredCategoryBoundaryIndex = newList.length - 1;
          foundBoundary = true;
        } // If we've hit the top of a boundary beyond our target category, insert at the top of
        // the grouping to ensure the room isn't slotted incorrectly. Otherwise, try to insert
        // based on most recent timestamp.


        const changedBoundary = entryCategoryIndex > targetCategoryIndex;
        const currentCategory = entryCategoryIndex === targetCategoryIndex;

        if (changedBoundary || currentCategory && categoryComparator({
          room
        }, entry) <= 0) {
          if (changedBoundary) {
            // If we changed a boundary, then we've gone too far - go to the top of the last
            // section instead.
            newList.splice(desiredCategoryBoundaryIndex, 0, {
              room,
              category
            });
          } else {
            // If we're ordering by timestamp, just insert normally
            newList.push({
              room,
              category
            });
          }

          pushedEntry = true;
        }
      } // Fall through and clone the list.


      newList.push(entry);
    }

    if (!pushedEntry && desiredCategoryBoundaryIndex >= 0) {
      console.warn("!! Room ".concat(room.roomId, " nearly lost: Ran off the end of ").concat(tag));
      console.warn("!! Inserting at position ".concat(desiredCategoryBoundaryIndex, " with category ").concat(category));
      newList.splice(desiredCategoryBoundaryIndex, 0, {
        room,
        category
      });
      pushedEntry = true;
    }

    return pushedEntry;
  }

  _setRoomCategory(room, category) {
    if (!room) return; // This should only happen in tests

    const listsClone = {}; // Micro optimization: Support lazily loading the last timestamp in a room

    const timestampCache = {}; // {roomId => ts}

    const lastTimestamp = room => {
      if (!timestampCache[room.roomId]) {
        timestampCache[room.roomId] = this._tsOfNewestEvent(room);
      }

      return timestampCache[room.roomId];
    };

    const targetTags = this._getRecommendedTagsForRoom(room);

    const insertedIntoTags = []; // We need to make sure all the tags (lists) are updated with the room's new position. We
    // generally only get called here when there's a new room to insert or a room has potentially
    // changed positions within the list.
    //
    // We do all our checks by iterating over the rooms in the existing lists, trying to insert
    // our room where we can. As a guiding principle, we should be removing the room from all
    // tags, and insert the room into targetTags. We should perform the deletion before the addition
    // where possible to keep a consistent state. By the end of this, targetTags should be the
    // same as insertedIntoTags.

    for (const key of Object.keys(this._state.lists)) {
      const shouldHaveRoom = targetTags.includes(key); // Speed optimization: Don't do complicated math if we don't have to.

      if (!shouldHaveRoom) {
        listsClone[key] = this._state.lists[key].filter(e => e.room.roomId !== room.roomId);
      } else if (getListAlgorithm(key, this._state.algorithm) === ALGO_MANUAL) {
        // Manually ordered tags are sorted later, so for now we'll just clone the tag
        // and add our room if needed
        listsClone[key] = this._state.lists[key].filter(e => e.room.roomId !== room.roomId);
        listsClone[key].push({
          room,
          category
        });
        insertedIntoTags.push(key);
      } else {
        listsClone[key] = [];

        const pushedEntry = this._slotRoomIntoList(room, category, key, this._state.lists[key], listsClone[key], lastTimestamp);

        if (!pushedEntry) {
          // This should rarely happen: _slotRoomIntoList has several checks which attempt
          // to make sure that a room is not lost in the list. If we do lose the room though,
          // we shouldn't throw it on the floor and forget about it. Instead, we should insert
          // it somewhere. We'll insert it at the top for a couple reasons: 1) it is probably
          // an important room for the user and 2) if this does happen, we'd want a bug report.
          console.warn("!! Room ".concat(room.roomId, " nearly lost: Failed to find a position"));
          console.warn("!! Inserting at position 0 in the list and flagging as inserted");
          console.warn("!! Additional info: ", {
            category,
            key,
            upToIndex: listsClone[key].length,
            expectedCount: this._state.lists[key].length
          });
          listsClone[key].splice(0, 0, {
            room,
            category
          });
        }

        insertedIntoTags.push(key);
      }
    } // Double check that we inserted the room in the right places.
    // There should never be a discrepancy.


    for (const targetTag of targetTags) {
      let count = 0;

      for (const insertedTag of insertedIntoTags) {
        if (insertedTag === targetTag) count++;
      }

      if (count !== 1) {
        console.warn("!! Room ".concat(room.roomId, " inserted ").concat(count, " times to ").concat(targetTag));
      } // This is a workaround for https://github.com/vector-im/riot-web/issues/11303
      // The logging is to try and identify what happened exactly.


      if (count === 0) {
        // Something went very badly wrong - try to recover the room.
        // We don't bother checking how the target list is ordered - we're expecting
        // to just insert it.
        console.warn("!! Recovering ".concat(room.roomId, " for tag ").concat(targetTag, " at position 0"));

        if (!listsClone[targetTag]) {
          console.warn("!! List for tag ".concat(targetTag, " does not exist - creating"));
          listsClone[targetTag] = [];
        }

        listsClone[targetTag].splice(0, 0, {
          room,
          category
        });
      }
    } // Sort the favourites before we set the clone


    for (const tag of Object.keys(listsClone)) {
      if (getListAlgorithm(tag, this._state.algorithm) !== ALGO_MANUAL) continue; // skip recents (pre-sorted)

      listsClone[tag].sort(this._getManualComparator(tag));
    }

    this._setState({
      lists: listsClone
    });
  }

  _generateInitialRoomLists() {
    // Log something to show that we're throwing away the old results. This is for the inevitable
    // question of "why is 100% of my CPU going towards Riot?" - a quick look at the logs would reveal
    // that something is wrong with the RoomListStore.
    console.log("Generating initial room lists");
    const lists = {
      "m.server_notice": [],
      "im.vector.fake.invite": [],
      "m.favourite": [],
      "im.vector.fake.recent": [],
      [TAG_DM]: [],
      "m.lowpriority": [],
      "im.vector.fake.archived": []
    };

    const dmRoomMap = _DMRoomMap.default.shared();

    this._matrixClient.getRooms().forEach(room => {
      const myUserId = this._matrixClient.getUserId();

      const membership = room.getMyMembership();
      const me = room.getMember(myUserId);

      if (membership === "invite") {
        lists["im.vector.fake.invite"].push({
          room,
          category: CATEGORY_RED
        });
      } else if (membership === "join" || membership === "ban" || me && me.isKicked()) {
        // Used to split rooms via tags
        let tagNames = Object.keys(room.tags); // ignore any m. tag names we don't know about

        tagNames = tagNames.filter(t => {
          // Speed optimization: Avoid hitting the SettingsStore at all costs by making it the
          // last condition possible.
          return lists[t] !== undefined || !t.startsWith('m.') && this._state.tagsEnabled;
        });

        if (tagNames.length) {
          for (let i = 0; i < tagNames.length; i++) {
            const tagName = tagNames[i];
            lists[tagName] = lists[tagName] || []; // Default to an arbitrary category for tags which aren't ordered by recents

            let category = CATEGORY_IDLE;

            if (getListAlgorithm(tagName, this._state.algorithm) !== ALGO_MANUAL) {
              category = this._calculateCategory(room);
            }

            lists[tagName].push({
              room,
              category
            });
          }
        } else if (dmRoomMap.getUserIdForRoomId(room.roomId)) {
          // "Direct Message" rooms (that we're still in and that aren't otherwise tagged)
          lists[TAG_DM].push({
            room,
            category: this._calculateCategory(room)
          });
        } else {
          lists["im.vector.fake.recent"].push({
            room,
            category: this._calculateCategory(room)
          });
        }
      } else if (membership === "leave") {
        // The category of these rooms is not super important, so deprioritize it to the lowest
        // possible value.
        lists["im.vector.fake.archived"].push({
          room,
          category: CATEGORY_IDLE
        });
      }
    }); // We use this cache in the recents comparator because _tsOfNewestEvent can take a while. This
    // cache only needs to survive the sort operation below and should not be implemented outside
    // of this function, otherwise the room lists will almost certainly be out of date and wrong.


    const latestEventTsCache = {}; // roomId => timestamp

    const tsOfNewestEventFn = room => {
      if (!room) return Number.MAX_SAFE_INTEGER; // Should only happen in tests

      if (latestEventTsCache[room.roomId]) {
        return latestEventTsCache[room.roomId];
      }

      const ts = this._tsOfNewestEvent(room);

      latestEventTsCache[room.roomId] = ts;
      return ts;
    };

    Object.keys(lists).forEach(listKey => {
      let comparator;

      switch (getListAlgorithm(listKey, this._state.algorithm)) {
        case ALGO_RECENT:
          comparator = (entryA, entryB) => this._recentsComparator(entryA, entryB, tsOfNewestEventFn);

          break;

        case ALGO_ALPHABETIC:
          comparator = this._lexicographicalComparator;
          break;

        case ALGO_MANUAL:
        default:
          comparator = this._getManualComparator(listKey);
          break;
      }

      if (this._state.orderImportantFirst) {
        lists[listKey].sort((entryA, entryB) => {
          if (entryA.category !== entryB.category) {
            const idxA = CATEGORY_ORDER.indexOf(entryA.category);
            const idxB = CATEGORY_ORDER.indexOf(entryB.category);
            if (idxA > idxB) return 1;
            if (idxA < idxB) return -1;
            return 0; // Technically not possible
          }

          return comparator(entryA, entryB);
        });
      } else {
        // skip the category comparison even though it should no-op when orderImportantFirst disabled
        lists[listKey].sort(comparator);
      }
    });

    this._setState({
      lists,
      ready: true // Ready to receive updates to ordering

    });
  }

  _eventTriggersRecentReorder(ev) {
    return ev.getTs() && (Unread.eventTriggersUnreadCount(ev) || ev.getSender() === this._matrixClient.credentials.userId);
  }

  _tsOfNewestEvent(room) {
    // Apparently we can have rooms without timelines, at least under testing
    // environments. Just return MAX_INT when this happens.
    if (!room || !room.timeline) return Number.MAX_SAFE_INTEGER;

    for (let i = room.timeline.length - 1; i >= 0; --i) {
      const ev = room.timeline[i];

      if (this._eventTriggersRecentReorder(ev)) {
        return ev.getTs();
      }
    } // we might only have events that don't trigger the unread indicator,
    // in which case use the oldest event even if normally it wouldn't count.
    // This is better than just assuming the last event was forever ago.


    if (room.timeline.length && room.timeline[0].getTs()) {
      return room.timeline[0].getTs();
    } else {
      return Number.MAX_SAFE_INTEGER;
    }
  }

  _calculateCategory(room) {
    if (!this._state.orderImportantFirst) {
      // Effectively disable the categorization of rooms if we're supposed to
      // be sorting by more recent messages first. This triggers the timestamp
      // comparison bit of _setRoomCategory and _recentsComparator instead of
      // the category ordering.
      return CATEGORY_IDLE;
    }

    const mentions = room.getUnreadNotificationCount("highlight") > 0;
    if (mentions) return CATEGORY_RED;
    let unread = room.getUnreadNotificationCount() > 0;
    if (unread) return CATEGORY_GREY;
    unread = Unread.doesRoomHaveUnreadMessages(room);
    if (unread) return CATEGORY_BOLD;
    return CATEGORY_IDLE;
  }

  _recentsComparator(entryA, entryB, tsOfNewestEventFn) {
    const timestampA = tsOfNewestEventFn(entryA.room);
    const timestampB = tsOfNewestEventFn(entryB.room);
    return timestampB - timestampA;
  }

  _lexicographicalComparator(entryA, entryB) {
    return entryA.room.name.localeCompare(entryB.room.name);
  }

  _getManualComparator(tagName, optimisticRequest) {
    return (entryA, entryB) => {
      const roomA = entryA.room;
      const roomB = entryB.room;
      let metaA = roomA.tags[tagName];
      let metaB = roomB.tags[tagName];
      if (optimisticRequest && roomA === optimisticRequest.room) metaA = optimisticRequest.metaData;
      if (optimisticRequest && roomB === optimisticRequest.room) metaB = optimisticRequest.metaData; // Make sure the room tag has an order element, if not set it to be the bottom

      const a = metaA ? Number(metaA.order) : undefined;
      const b = metaB ? Number(metaB.order) : undefined; // Order undefined room tag orders to the bottom

      if (a === undefined && b !== undefined) {
        return 1;
      } else if (a !== undefined && b === undefined) {
        return -1;
      }

      return a === b ? this._lexicographicalComparator(entryA, entryB) : a > b ? 1 : -1;
    };
  }

  getRoomLists() {
    return this._state.presentationLists;
  }

}

if (global.singletonRoomListStore === undefined) {
  global.singletonRoomListStore = new RoomListStore();
}

var _default = global.singletonRoomListStore;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvUm9vbUxpc3RTdG9yZS5qcyJdLCJuYW1lcyI6WyJDQVRFR09SWV9SRUQiLCJDQVRFR09SWV9HUkVZIiwiQ0FURUdPUllfQk9MRCIsIkNBVEVHT1JZX0lETEUiLCJUQUdfRE0iLCJBTEdPX01BTlVBTCIsIkFMR09fQUxQSEFCRVRJQyIsIkFMR09fUkVDRU5UIiwiQ0FURUdPUllfT1JERVIiLCJnZXRMaXN0QWxnb3JpdGhtIiwibGlzdEtleSIsInNldHRpbmdBbGdvcml0aG0iLCJrbm93bkxpc3RzIiwiU2V0IiwiUm9vbUxpc3RTdG9yZSIsIlN0b3JlIiwiY29uc3RydWN0b3IiLCJkaXMiLCJfaW5pdCIsIl9nZXRNYW51YWxDb21wYXJhdG9yIiwiYmluZCIsIl9yZWNlbnRzQ29tcGFyYXRvciIsInVwZGF0ZVNvcnRpbmdBbGdvcml0aG0iLCJhbGdvcml0aG0iLCJvcmRlckltcG9ydGFudEZpcnN0IiwiY29uc29sZSIsImxvZyIsIl9zZXRTdGF0ZSIsIl9nZW5lcmF0ZUluaXRpYWxSb29tTGlzdHMiLCJkZWZhdWx0TGlzdHMiLCJfc3RhdGUiLCJsaXN0cyIsInByZXNlbnRhdGlvbkxpc3RzIiwicmVhZHkiLCJzdGlja3lSb29tSWQiLCJTZXR0aW5nc1N0b3JlIiwibW9uaXRvclNldHRpbmciLCJuZXdTdGF0ZSIsImtleSIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJlIiwicm9vbSIsImFzc2lnbiIsIl9fZW1pdENoYW5nZSIsIl9fb25EaXNwYXRjaCIsInBheWxvYWQiLCJsb2dpY2FsbHlSZWFkeSIsIl9tYXRyaXhDbGllbnQiLCJhY3Rpb24iLCJzZXR0aW5nTmFtZSIsIm5ld1ZhbHVlIiwidGFnc0VuYWJsZWQiLCJwcmV2U3RhdGUiLCJzdGF0ZSIsImlzRmVhdHVyZUVuYWJsZWQiLCJtYXRyaXhDbGllbnQiLCJvcmRlckJ5SW1wb3J0YW5jZSIsImdldFZhbHVlIiwib3JkZXJBbHBoYWJldGljYWxseSIsIm15VXNlcklkIiwiZ2V0VXNlcklkIiwiZXZlbnRJZCIsImV2ZW50IiwiZ2V0Q29udGVudCIsInJlY2VpcHRVc2VycyIsImluY2x1ZGVzIiwiX3Jvb21VcGRhdGVUcmlnZ2VyZWQiLCJyb29tSWQiLCJpc0xpdmVFdmVudCIsImlzTGl2ZVVuZmlsdGVyZWRSb29tVGltZWxpbmVFdmVudCIsIl9ldmVudFRyaWdnZXJzUmVjZW50UmVvcmRlciIsImdldFJvb21JZCIsImdldFJvb20iLCJsaXZlVGltZWxpbmUiLCJnZXRMaXZlVGltZWxpbmUiLCJldmVudFRpbWVsaW5lIiwiZ2V0VGltZWxpbmVGb3JFdmVudCIsImdldElkIiwiZXZlbnRfdHlwZSIsImN1cnJlbnRTdGlja3lJZCIsInJvb21faWQiLCJfc2V0Um9vbUNhdGVnb3J5IiwiaWdub3JlU3RpY2t5IiwiY2F0ZWdvcnkiLCJfY2FsY3VsYXRlQ2F0ZWdvcnkiLCJfZmlsdGVyVGFncyIsInRhZ3MiLCJmaWx0ZXIiLCJ0IiwiaGFzIiwiX2dldFJlY29tbWVuZGVkVGFnc0ZvclJvb20iLCJteU1lbWJlcnNoaXAiLCJnZXRNeU1lbWJlcnNoaXAiLCJwdXNoIiwiZG1Sb29tTWFwIiwiRE1Sb29tTWFwIiwic2hhcmVkIiwiZ2V0VXNlcklkRm9yUm9vbUlkIiwibGVuZ3RoIiwiX3Nsb3RSb29tSW50b0xpc3QiLCJ0YWciLCJleGlzdGluZ0VudHJpZXMiLCJuZXdMaXN0IiwibGFzdFRpbWVzdGFtcEZuIiwidGFyZ2V0Q2F0ZWdvcnlJbmRleCIsImluZGV4T2YiLCJjYXRlZ29yeUNvbXBhcmF0b3IiLCJhIiwiYiIsInNvcnRBbGdvcml0aG0iLCJfbGV4aWNvZ3JhcGhpY2FsQ29tcGFyYXRvciIsImRlc2lyZWRDYXRlZ29yeUJvdW5kYXJ5SW5kZXgiLCJmb3VuZEJvdW5kYXJ5IiwicHVzaGVkRW50cnkiLCJlbnRyeSIsImVudHJ5Q2F0ZWdvcnlJbmRleCIsImNoYW5nZWRCb3VuZGFyeSIsImN1cnJlbnRDYXRlZ29yeSIsInNwbGljZSIsIndhcm4iLCJsaXN0c0Nsb25lIiwidGltZXN0YW1wQ2FjaGUiLCJsYXN0VGltZXN0YW1wIiwiX3RzT2ZOZXdlc3RFdmVudCIsInRhcmdldFRhZ3MiLCJpbnNlcnRlZEludG9UYWdzIiwic2hvdWxkSGF2ZVJvb20iLCJ1cFRvSW5kZXgiLCJleHBlY3RlZENvdW50IiwidGFyZ2V0VGFnIiwiY291bnQiLCJpbnNlcnRlZFRhZyIsInNvcnQiLCJnZXRSb29tcyIsImZvckVhY2giLCJtZW1iZXJzaGlwIiwibWUiLCJnZXRNZW1iZXIiLCJpc0tpY2tlZCIsInRhZ05hbWVzIiwidW5kZWZpbmVkIiwic3RhcnRzV2l0aCIsImkiLCJ0YWdOYW1lIiwibGF0ZXN0RXZlbnRUc0NhY2hlIiwidHNPZk5ld2VzdEV2ZW50Rm4iLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwidHMiLCJjb21wYXJhdG9yIiwiZW50cnlBIiwiZW50cnlCIiwiaWR4QSIsImlkeEIiLCJldiIsImdldFRzIiwiVW5yZWFkIiwiZXZlbnRUcmlnZ2Vyc1VucmVhZENvdW50IiwiZ2V0U2VuZGVyIiwiY3JlZGVudGlhbHMiLCJ1c2VySWQiLCJ0aW1lbGluZSIsIm1lbnRpb25zIiwiZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQiLCJ1bnJlYWQiLCJkb2VzUm9vbUhhdmVVbnJlYWRNZXNzYWdlcyIsInRpbWVzdGFtcEEiLCJ0aW1lc3RhbXBCIiwibmFtZSIsImxvY2FsZUNvbXBhcmUiLCJvcHRpbWlzdGljUmVxdWVzdCIsInJvb21BIiwicm9vbUIiLCJtZXRhQSIsIm1ldGFCIiwibWV0YURhdGEiLCJvcmRlciIsImdldFJvb21MaXN0cyIsImdsb2JhbCIsInNpbmdsZXRvblJvb21MaXN0U3RvcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOzs7Ozs7Ozs7OztBQVlBLE1BQU1BLFlBQVksR0FBRyxLQUFyQixDLENBQWdDOztBQUNoQyxNQUFNQyxhQUFhLEdBQUcsTUFBdEIsQyxDQUFnQzs7QUFD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aUQ7QUFDN0NzQyxFQUFBQSxNQUFNLENBQUNDLHNCQUFQLEdBQWdDLElBQUl2SyxhQUFKLEVBQWhDO0FBQ0g7O2VBQ2NzSyxNQUFNLENBQUNDLHNCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCB7U3RvcmV9IGZyb20gJ2ZsdXgvdXRpbHMnO1xuaW1wb3J0IGRpcyBmcm9tICcuLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0ICogYXMgVW5yZWFkIGZyb20gJy4uL1VucmVhZCc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuXG4vKlxuUm9vbSBzb3J0aW5nIGFsZ29yaXRobTpcbiogQWx3YXlzIHByZWZlciB0byBoYXZlIHJlZCA+IGdyZXkgPiBib2xkID4gaWRsZVxuKiBUaGUgcm9vbSBiZWluZyB2aWV3ZWQgc2hvdWxkIGJlIHN0aWNreSAobm90IGp1bXAgZG93biB0byB0aGUgaWRsZSBsaXN0KVxuKiBXaGVuIHN3aXRjaGluZyB0byBhIG5ldyByb29tLCBzb3J0IHRoZSBsYXN0IHN0aWNreSByb29tIHRvIHRoZSB0b3Agb2YgdGhlIGlkbGUgbGlzdC5cblxuVGhlIGFwcHJvYWNoIHRha2VuIGJ5IHRoZSBzdG9yZSBpcyB0byBnZW5lcmF0ZSBhbiBpbml0aWFsIHJlcHJlc2VudGF0aW9uIG9mIGFsbCB0aGVcbnRhZ2dlZCBsaXN0cyAoYWNjZXB0aW5nIHRoYXQgaXQnbGwgdGFrZSBhIGxpdHRsZSBiaXQgbG9uZ2VyIHRvIGNhbGN1bGF0ZSkgYW5kIG1ha2VcbnNtYWxsIGNoYW5nZXMgdG8gdGhhdCBvdmVyIHRpbWUuIFRoaXMgcmVzdWx0cyBpbiBxdWljayBjaGFuZ2VzIHRvIHRoZSByb29tIGxpc3Qgd2hpbGVcbmFsc28gaGF2aW5nIHVwZGF0ZSBvcGVyYXRpb25zIGZlZWwgbW9yZSBsaWtlIHBvcHBpbmcvcHVzaGluZyB0byBhIHN0YWNrLlxuICovXG5cbmNvbnN0IENBVEVHT1JZX1JFRCA9IFwicmVkXCI7ICAgICAvLyBNZW50aW9ucyBpbiB0aGUgcm9vbVxuY29uc3QgQ0FURUdPUllfR1JFWSA9IFwiZ3JleVwiOyAgIC8vIFVucmVhZCBub3RpZmllZCBtZXNzYWdlcyAobm90IG1lbnRpb25zKVxuY29uc3QgQ0FURUdPUllfQk9MRCA9IFwiYm9sZFwiOyAgIC8vIFVucmVhZCBtZXNzYWdlcyAobm90IG5vdGlmaWVkLCAnTWVudGlvbnMgT25seScgcm9vbXMpXG5jb25zdCBDQVRFR09SWV9JRExFID0gXCJpZGxlXCI7ICAgLy8gTm90aGluZyBvZiBpbnRlcmVzdFxuXG5leHBvcnQgY29uc3QgVEFHX0RNID0gXCJpbS52ZWN0b3IuZmFrZS5kaXJlY3RcIjtcblxuLyoqXG4gKiBJZGVudGlmaWVyIGZvciBtYW51YWwgc29ydGluZyBiZWhhdmlvdXI6IHNvcnQgYnkgdGhlIHVzZXIgZGVmaW5lZCBvcmRlci5cbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBBTEdPX01BTlVBTCA9IFwibWFudWFsXCI7XG5cbi8qKlxuICogSWRlbnRpZmllciBmb3IgYWxwaGFiZXRpYyBzb3J0aW5nIGJlaGF2aW91cjogc29ydCBieSB0aGUgcm9vbSBuYW1lIGFscGhhYmV0aWNhbGx5IGZpcnN0LlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFMR09fQUxQSEFCRVRJQyA9IFwiYWxwaGFiZXRpY1wiO1xuXG4vKipcbiAqIElkZW50aWZpZXIgZm9yIGNsYXNzaWMgc29ydGluZyBiZWhhdmlvdXI6IHNvcnQgYnkgdGhlIG1vc3QgcmVjZW50IG1lc3NhZ2UgZmlyc3QuXG4gKiBAdHlwZSB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgQUxHT19SRUNFTlQgPSBcInJlY2VudFwiO1xuXG5jb25zdCBDQVRFR09SWV9PUkRFUiA9IFtDQVRFR09SWV9SRUQsIENBVEVHT1JZX0dSRVksIENBVEVHT1JZX0JPTEQsIENBVEVHT1JZX0lETEVdO1xuXG5jb25zdCBnZXRMaXN0QWxnb3JpdGhtID0gKGxpc3RLZXksIHNldHRpbmdBbGdvcml0aG0pID0+IHtcbiAgICAvLyBhcHBseSBtYW51YWwgc29ydGluZyBvbmx5IHRvIG0uZmF2b3VyaXRlLCBvdGhlcndpc2UgcmVzcGVjdCB0aGUgZ2xvYmFsIHNldHRpbmdcbiAgICAvLyBhbGwgdGhlIGtub3duIHRhZ3MgYXJlIGxpc3RlZCBleHBsaWNpdGx5IGhlcmUgdG8gc2ltcGxpZnkgZnV0dXJlIGNoYW5nZXNcbiAgICBzd2l0Y2ggKGxpc3RLZXkpIHtcbiAgICAgICAgY2FzZSBcImltLnZlY3Rvci5mYWtlLmludml0ZVwiOlxuICAgICAgICBjYXNlIFwiaW0udmVjdG9yLmZha2UucmVjZW50XCI6XG4gICAgICAgIGNhc2UgXCJpbS52ZWN0b3IuZmFrZS5hcmNoaXZlZFwiOlxuICAgICAgICBjYXNlIFwibS5sb3dwcmlvcml0eVwiOlxuICAgICAgICBjYXNlIFRBR19ETTpcbiAgICAgICAgICAgIHJldHVybiBzZXR0aW5nQWxnb3JpdGhtO1xuXG4gICAgICAgIGNhc2UgXCJtLmZhdm91cml0ZVwiOlxuICAgICAgICBkZWZhdWx0OiAvLyBjdXN0b20tdGFnc1xuICAgICAgICAgICAgcmV0dXJuIEFMR09fTUFOVUFMO1xuICAgIH1cbn07XG5cbmNvbnN0IGtub3duTGlzdHMgPSBuZXcgU2V0KFtcbiAgICBcIm0uZmF2b3VyaXRlXCIsXG4gICAgXCJpbS52ZWN0b3IuZmFrZS5pbnZpdGVcIixcbiAgICBcImltLnZlY3Rvci5mYWtlLnJlY2VudFwiLFxuICAgIFwiaW0udmVjdG9yLmZha2UuYXJjaGl2ZWRcIixcbiAgICBcIm0ubG93cHJpb3JpdHlcIixcbiAgICBUQUdfRE0sXG5dKTtcblxuLyoqXG4gKiBBIGNsYXNzIGZvciBzdG9yaW5nIGFwcGxpY2F0aW9uIHN0YXRlIGZvciBjYXRlZ29yaXNpbmcgcm9vbXMgaW5cbiAqIHRoZSBSb29tTGlzdC5cbiAqL1xuY2xhc3MgUm9vbUxpc3RTdG9yZSBleHRlbmRzIFN0b3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoZGlzKTtcblxuICAgICAgICB0aGlzLl9pbml0KCk7XG4gICAgICAgIHRoaXMuX2dldE1hbnVhbENvbXBhcmF0b3IgPSB0aGlzLl9nZXRNYW51YWxDb21wYXJhdG9yLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3JlY2VudHNDb21wYXJhdG9yID0gdGhpcy5fcmVjZW50c0NvbXBhcmF0b3IuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBzb3J0aW5nIGFsZ29yaXRobSB1c2VkIGJ5IHRoZSBSb29tTGlzdFN0b3JlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhbGdvcml0aG0gVGhlIG5ldyBhbGdvcml0aG0gdG8gdXNlLiBTaG91bGQgYmUgb25lIG9mIHRoZSBBTEdPXyogY29uc3RhbnRzLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3JkZXJJbXBvcnRhbnRGaXJzdCBXaGV0aGVyIHRvIHNvcnQgYnkgY2F0ZWdvcmllcyBvZiBpbXBvcnRhbmNlXG4gICAgICovXG4gICAgdXBkYXRlU29ydGluZ0FsZ29yaXRobShhbGdvcml0aG0sIG9yZGVySW1wb3J0YW50Rmlyc3QpIHtcbiAgICAgICAgLy8gRGV2IG5vdGU6IFdlIG9ubHkgaGF2ZSB0d28gYWxnb3JpdGhtcyBhdCB0aGUgbW9tZW50LCBidXQgaXQgaXNuJ3QgaW1wb3NzaWJsZSB0aGF0IHdlIHdhbnRcbiAgICAgICAgLy8gbXVsdGlwbGUgaW4gdGhlIGZ1dHVyZS4gQWxzbyBjb25zdGFudHMgbWFrZSB0aGluZ3Mgc2xpZ2h0bHkgY2xlYXJlci5cbiAgICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZyByb29tIHNvcnRpbmcgYWxnb3JpdGhtOiBcIiwge2FsZ29yaXRobSwgb3JkZXJJbXBvcnRhbnRGaXJzdH0pO1xuICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7YWxnb3JpdGhtLCBvcmRlckltcG9ydGFudEZpcnN0fSk7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBhIHJlc29ydCBvZiB0aGUgZW50aXJlIGxpc3QgdG8gcmVmbGVjdCB0aGUgY2hhbmdlIGluIGFsZ29yaXRobVxuICAgICAgICB0aGlzLl9nZW5lcmF0ZUluaXRpYWxSb29tTGlzdHMoKTtcbiAgICB9XG5cbiAgICBfaW5pdCgpIHtcbiAgICAgICAgLy8gSW5pdGlhbGlzZSBzdGF0ZVxuICAgICAgICBjb25zdCBkZWZhdWx0TGlzdHMgPSB7XG4gICAgICAgICAgICBcIm0uc2VydmVyX25vdGljZVwiOiBbLyogeyByb29tOiBqcy1zZGsgcm9vbSwgY2F0ZWdvcnk6IHN0cmluZyB9ICovXSxcbiAgICAgICAgICAgIFwiaW0udmVjdG9yLmZha2UuaW52aXRlXCI6IFtdLFxuICAgICAgICAgICAgXCJtLmZhdm91cml0ZVwiOiBbXSxcbiAgICAgICAgICAgIFwiaW0udmVjdG9yLmZha2UucmVjZW50XCI6IFtdLFxuICAgICAgICAgICAgW1RBR19ETV06IFtdLFxuICAgICAgICAgICAgXCJtLmxvd3ByaW9yaXR5XCI6IFtdLFxuICAgICAgICAgICAgXCJpbS52ZWN0b3IuZmFrZS5hcmNoaXZlZFwiOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7XG4gICAgICAgICAgICAvLyBUaGUgcm9vbXMgaW4gdGhlc2UgYXJyYXlzIGFyZSBvcmRlcmVkIGFjY29yZGluZyB0byBlaXRoZXIgdGhlXG4gICAgICAgICAgICAvLyAncmVjZW50cycgYmVoYXZpb3VyIG9yICdtYW51YWwnIGJlaGF2aW91ci5cbiAgICAgICAgICAgIGxpc3RzOiBkZWZhdWx0TGlzdHMsXG4gICAgICAgICAgICBwcmVzZW50YXRpb25MaXN0czogZGVmYXVsdExpc3RzLCAvLyBsaWtlIGBsaXN0c2AsIGJ1dCB3aXRoIGFycmF5cyBvZiByb29tcyBpbnN0ZWFkXG4gICAgICAgICAgICByZWFkeTogZmFsc2UsXG4gICAgICAgICAgICBzdGlja3lSb29tSWQ6IG51bGwsXG4gICAgICAgICAgICBhbGdvcml0aG06IEFMR09fUkVDRU5ULFxuICAgICAgICAgICAgb3JkZXJJbXBvcnRhbnRGaXJzdDogZmFsc2UsXG4gICAgICAgIH07XG5cbiAgICAgICAgU2V0dGluZ3NTdG9yZS5tb25pdG9yU2V0dGluZygnUm9vbUxpc3Qub3JkZXJBbHBoYWJldGljYWxseScsIG51bGwpO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLm1vbml0b3JTZXR0aW5nKCdSb29tTGlzdC5vcmRlckJ5SW1wb3J0YW5jZScsIG51bGwpO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLm1vbml0b3JTZXR0aW5nKCdmZWF0dXJlX2N1c3RvbV90YWdzJywgbnVsbCk7XG4gICAgfVxuXG4gICAgX3NldFN0YXRlKG5ld1N0YXRlKSB7XG4gICAgICAgIC8vIElmIHdlJ3JlIGNoYW5naW5nIHRoZSBsaXN0cywgdHJhbnNwYXJlbnRseSBjaGFuZ2UgdGhlIHByZXNlbnRhdGlvbiBsaXN0cyAod2hpY2hcbiAgICAgICAgLy8gaXMgZ2l2ZW4gdG8gcmVxdWVzdGluZyBjb21wb25lbnRzKS4gVGhpcyBkcmFtYXRpY2FsbHkgc2ltcGxpZmllcyBvdXIgY29kZSBlbHNld2hlcmVcbiAgICAgICAgLy8gd2hpbGUgYWxzbyBlbnN1cmluZyB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIGNhbGxpbmcgY29tcG9uZW50cyB0byBzdXBwb3J0XG4gICAgICAgIC8vIGNhdGVnb3JpZXMuXG4gICAgICAgIGlmIChuZXdTdGF0ZVsnbGlzdHMnXSkge1xuICAgICAgICAgICAgY29uc3QgcHJlc2VudGF0aW9uTGlzdHMgPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG5ld1N0YXRlWydsaXN0cyddKSkge1xuICAgICAgICAgICAgICAgIHByZXNlbnRhdGlvbkxpc3RzW2tleV0gPSBuZXdTdGF0ZVsnbGlzdHMnXVtrZXldLm1hcCgoZSkgPT4gZS5yb29tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld1N0YXRlWydwcmVzZW50YXRpb25MaXN0cyddID0gcHJlc2VudGF0aW9uTGlzdHM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RhdGUgPSBPYmplY3QuYXNzaWduKHRoaXMuX3N0YXRlLCBuZXdTdGF0ZSk7XG4gICAgICAgIHRoaXMuX19lbWl0Q2hhbmdlKCk7XG4gICAgfVxuXG4gICAgX19vbkRpc3BhdGNoKHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgbG9naWNhbGx5UmVhZHkgPSB0aGlzLl9tYXRyaXhDbGllbnQgJiYgdGhpcy5fc3RhdGUucmVhZHk7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ3NldHRpbmdfdXBkYXRlZCc6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWxvZ2ljYWxseVJlYWR5KSBicmVhaztcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGF5bG9hZC5zZXR0aW5nTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUm9vbUxpc3Qub3JkZXJBbHBoYWJldGljYWxseVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTb3J0aW5nQWxnb3JpdGhtKHBheWxvYWQubmV3VmFsdWUgPyBBTEdPX0FMUEhBQkVUSUMgOiBBTEdPX1JFQ0VOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0ZS5vcmRlckltcG9ydGFudEZpcnN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUm9vbUxpc3Qub3JkZXJCeUltcG9ydGFuY2VcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU29ydGluZ0FsZ29yaXRobSh0aGlzLl9zdGF0ZS5hbGdvcml0aG0sIHBheWxvYWQubmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmZWF0dXJlX2N1c3RvbV90YWdzXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7dGFnc0VuYWJsZWQ6IHBheWxvYWQubmV3VmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dlbmVyYXRlSW5pdGlhbFJvb21MaXN0cygpOyAvLyBUYWdzIG1lYW5zIHdlIGhhdmUgdG8gc3RhcnQgZnJvbSBzY3JhdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIEluaXRpYWxpc2Ugc3RhdGUgYWZ0ZXIgaW5pdGlhbCBzeW5jXG4gICAgICAgICAgICBjYXNlICdNYXRyaXhBY3Rpb25zLnN5bmMnOiB7XG4gICAgICAgICAgICAgICAgaWYgKCEocGF5bG9hZC5wcmV2U3RhdGUgIT09ICdQUkVQQVJFRCcgJiYgcGF5bG9hZC5zdGF0ZSA9PT0gJ1BSRVBBUkVEJykpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQWx3YXlzIGVuc3VyZSB0aGF0IHdlIHNldCBhbnkgc3RhdGUgbmVlZGVkIGZvciBzZXR0aW5ncyBoZXJlLiBJdCBpcyBwb3NzaWJsZSB0aGF0XG4gICAgICAgICAgICAgICAgLy8gc2V0dGluZyB1cGRhdGVzIHRyaWdnZXIgb24gc3RhcnR1cCBiZWZvcmUgd2UgYXJlIHJlYWR5IHRvIHN5bmMsIHNvIHdlIHdhbnQgdG8gbWFrZVxuICAgICAgICAgICAgICAgIC8vIHN1cmUgdGhhdCB0aGUgcmlnaHQgc3RhdGUgaXMgaW4gcGxhY2UgYmVmb3JlIHdlIGFjdHVhbGx5IHJlYWN0IHRvIHRob3NlIGNoYW5nZXMuXG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7dGFnc0VuYWJsZWQ6IFNldHRpbmdzU3RvcmUuaXNGZWF0dXJlRW5hYmxlZChcImZlYXR1cmVfY3VzdG9tX3RhZ3NcIil9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX21hdHJpeENsaWVudCA9IHBheWxvYWQubWF0cml4Q2xpZW50O1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JkZXJCeUltcG9ydGFuY2UgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiUm9vbUxpc3Qub3JkZXJCeUltcG9ydGFuY2VcIik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JkZXJBbHBoYWJldGljYWxseSA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJSb29tTGlzdC5vcmRlckFscGhhYmV0aWNhbGx5XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU29ydGluZ0FsZ29yaXRobShvcmRlckFscGhhYmV0aWNhbGx5ID8gQUxHT19BTFBIQUJFVElDIDogQUxHT19SRUNFTlQsIG9yZGVyQnlJbXBvcnRhbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTWF0cml4QWN0aW9ucy5Sb29tLnJlY2VpcHQnOiB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2dpY2FsbHlSZWFkeSkgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBzZWUgaWYgdGhlIHJlY2VpcHQgZXZlbnQgaXMgZm9yIG91ciBvd24gdXNlci4gSWYgaXQgd2FzLCB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgLy8gYSByb29tIHVwZGF0ZSAod2UgcHJvYmFibHkgcmVhZCB0aGUgcm9vbSBvbiBhIGRpZmZlcmVudCBkZXZpY2UpLlxuICAgICAgICAgICAgICAgIGNvbnN0IG15VXNlcklkID0gdGhpcy5fbWF0cml4Q2xpZW50LmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXZlbnRJZCBvZiBPYmplY3Qua2V5cyhwYXlsb2FkLmV2ZW50LmdldENvbnRlbnQoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjZWlwdFVzZXJzID0gT2JqZWN0LmtleXMocGF5bG9hZC5ldmVudC5nZXRDb250ZW50KClbZXZlbnRJZF1bJ20ucmVhZCddIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY2VpcHRVc2Vycy5pbmNsdWRlcyhteVVzZXJJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jvb21VcGRhdGVUcmlnZ2VyZWQocGF5bG9hZC5yb29tLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ01hdHJpeEFjdGlvbnMuUm9vbS50YWdzJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEZpZ3VyZSBvdXQgd2hpY2ggcm9vbXMgY2hhbmdlZCBpbiB0aGUgdGFnIGFuZCBvbmx5IGNoYW5nZSB0aG9zZS5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHZlcnkgYmx1bnQgYW5kIHdpcGVzIG91dCB0aGUgc3RpY2t5IHJvb20gc3R1ZmZcbiAgICAgICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZUluaXRpYWxSb29tTGlzdHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTWF0cml4QWN0aW9ucy5Sb29tLnRpbWVsaW5lJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkgfHxcbiAgICAgICAgICAgICAgICAgICAgIXBheWxvYWQuaXNMaXZlRXZlbnQgfHxcbiAgICAgICAgICAgICAgICAgICAgIXBheWxvYWQuaXNMaXZlVW5maWx0ZXJlZFJvb21UaW1lbGluZUV2ZW50IHx8XG4gICAgICAgICAgICAgICAgICAgICF0aGlzLl9ldmVudFRyaWdnZXJzUmVjZW50UmVvcmRlcihwYXlsb2FkLmV2ZW50KSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0ZS5hbGdvcml0aG0gIT09IEFMR09fUkVDRU5UXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3Jvb21VcGRhdGVUcmlnZ2VyZWQocGF5bG9hZC5ldmVudC5nZXRSb29tSWQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFdoZW4gYW4gZXZlbnQgaXMgZGVjcnlwdGVkLCBpdCBjb3VsZCBtZWFuIHdlIG5lZWQgdG8gcmVvcmRlciB0aGUgcm9vbVxuICAgICAgICAgICAgLy8gbGlzdCBiZWNhdXNlIHdlIG5vdyBrbm93IHRoZSB0eXBlIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgIGNhc2UgJ01hdHJpeEFjdGlvbnMuRXZlbnQuZGVjcnlwdGVkJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gcGF5bG9hZC5ldmVudC5nZXRSb29tSWQoKTtcblxuICAgICAgICAgICAgICAgIC8vIFdlIG1heSBoYXZlIGRlY3J5cHRlZCBhbiBldmVudCB3aXRob3V0IGEgcm9vbUlkIChlLmcgdG9fZGV2aWNlKVxuICAgICAgICAgICAgICAgIGlmICghcm9vbUlkKSBicmVhaztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLl9tYXRyaXhDbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gV2Ugc29tZWhvdyBkZWNyeXB0ZWQgYW4gZXZlbnQgZm9yIGEgcm9vbSBvdXIgY2xpZW50IGlzIHVuYXdhcmUgb2ZcbiAgICAgICAgICAgICAgICBpZiAoIXJvb20pIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbGl2ZVRpbWVsaW5lID0gcm9vbS5nZXRMaXZlVGltZWxpbmUoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudFRpbWVsaW5lID0gcm9vbS5nZXRUaW1lbGluZUZvckV2ZW50KHBheWxvYWQuZXZlbnQuZ2V0SWQoKSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFaXRoZXIgdGhpcyBldmVudCB3YXMgbm90IGFkZGVkIHRvIHRoZSBsaXZlIHRpbWVsaW5lIChlLmcuIHBhZ2luYXRpb24pXG4gICAgICAgICAgICAgICAgLy8gb3IgaXQgZG9lc24ndCBhZmZlY3QgdGhlIG9yZGVyaW5nIG9mIHRoZSByb29tIGxpc3QuXG4gICAgICAgICAgICAgICAgaWYgKGxpdmVUaW1lbGluZSAhPT0gZXZlbnRUaW1lbGluZSB8fCAhdGhpcy5fZXZlbnRUcmlnZ2Vyc1JlY2VudFJlb3JkZXIocGF5bG9hZC5ldmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fcm9vbVVwZGF0ZVRyaWdnZXJlZChyb29tSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdNYXRyaXhBY3Rpb25zLmFjY291bnREYXRhJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmV2ZW50X3R5cGUgIT09ICdtLmRpcmVjdCcpIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEZpZ3VyZSBvdXQgd2hpY2ggcm9vbXMgY2hhbmdlZCBpbiB0aGUgZGlyZWN0IGNoYXQgYW5kIG9ubHkgY2hhbmdlIHRob3NlLlxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdmVyeSBibHVudCBhbmQgd2lwZXMgb3V0IHRoZSBzdGlja3kgcm9vbSBzdHVmZlxuICAgICAgICAgICAgICAgIHRoaXMuX2dlbmVyYXRlSW5pdGlhbFJvb21MaXN0cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdNYXRyaXhBY3Rpb25zLlJvb20ubXlNZW1iZXJzaGlwJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jvb21VcGRhdGVUcmlnZ2VyZWQocGF5bG9hZC5yb29tLnJvb21JZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFRoaXMgY291bGQgYmUgYSBuZXcgcm9vbSB0aGF0IHdlJ3ZlIGJlZW4gaW52aXRlZCB0bywgam9pbmVkIG9yIGNyZWF0ZWRcbiAgICAgICAgICAgIC8vIHdlIHdvbid0IGdldCBhIFJvb21NZW1iZXIubWVtYmVyc2hpcCBmb3IgdGhlc2UgY2FzZXMgaWYgd2UncmUgbm90IGFscmVhZHlcbiAgICAgICAgICAgIC8vIGEgbWVtYmVyLlxuICAgICAgICAgICAgY2FzZSAnTWF0cml4QWN0aW9ucy5Sb29tJzoge1xuICAgICAgICAgICAgICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jvb21VcGRhdGVUcmlnZ2VyZWQocGF5bG9hZC5yb29tLnJvb21JZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFRPRE86IFJlLWVuYWJsZSBvcHRpbWlzdGljIHVwZGF0ZXMgd2hlbiB3ZSBzdXBwb3J0IGRyYWdnaW5nIGFnYWluXG4gICAgICAgICAgICAvLyBjYXNlICdSb29tTGlzdEFjdGlvbnMudGFnUm9vbS5wZW5kaW5nJzoge1xuICAgICAgICAgICAgLy8gICAgIGlmICghbG9naWNhbGx5UmVhZHkpIGJyZWFrO1xuICAgICAgICAgICAgLy8gICAgIC8vIFhYWDogd2Ugb25seSBzaG93IG9uZSBvcHRpbWlzdGljIHVwZGF0ZSBhdCBhbnkgb25lIHRpbWUuXG4gICAgICAgICAgICAvLyAgICAgLy8gSWRlYWxseSB3ZSBzaG91bGQgYmUgbWFraW5nIGEgbGlzdCBvZiBpbi1mbGlnaHQgcmVxdWVzdHNcbiAgICAgICAgICAgIC8vICAgICAvLyB0aGF0IGFyZSBiYWNrZWQgYnkgdHJhbnNhY3Rpb24gSURzLiBVbnRpbCB0aGUganMtc2RrXG4gICAgICAgICAgICAvLyAgICAgLy8gc3VwcG9ydHMgdGhpcywgd2UncmUgc3R1Y2sgd2l0aCBvbmx5IGJlaW5nIGFibGUgdG8gdXNlXG4gICAgICAgICAgICAvLyAgICAgLy8gdGhlIG1vc3QgcmVjZW50IG9wdGltaXN0aWMgdXBkYXRlLlxuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwiISEgT3B0aW1pc3RpYyB0YWc6IFwiLCBwYXlsb2FkKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIGJyZWFrO1xuICAgICAgICAgICAgLy8gY2FzZSAnUm9vbUxpc3RBY3Rpb25zLnRhZ1Jvb20uZmFpbHVyZSc6IHtcbiAgICAgICAgICAgIC8vICAgICBpZiAoIWxvZ2ljYWxseVJlYWR5KSBicmVhaztcbiAgICAgICAgICAgIC8vICAgICAvLyBSZXNldCBzdGF0ZSBhY2NvcmRpbmcgdG8ganMtc2RrXG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coXCIhISBPcHRpbWlzdGljIHRhZyBmYWlsdXJlOiBcIiwgcGF5bG9hZCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uX2NsaWVudF9ub3RfdmlhYmxlJzpcbiAgICAgICAgICAgIGNhc2UgJ29uX2xvZ2dlZF9vdXQnOiB7XG4gICAgICAgICAgICAgICAgLy8gUmVzZXQgc3RhdGUgd2l0aG91dCBwdXNoaW5nIGFuIHVwZGF0ZSB0byB0aGUgdmlldywgd2hpY2ggZ2VuZXJhbGx5IGFzc3VtZXMgdGhhdFxuICAgICAgICAgICAgICAgIC8vIHRoZSBtYXRyaXggY2xpZW50IGlzbid0IGBudWxsYCBhbmQgc28gY2F1c2luZyBhIHJlLXJlbmRlciB3aWxsIGNhdXNlIE5QRXMuXG4gICAgICAgICAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21hdHJpeENsaWVudCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfcm9vbSc6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWxvZ2ljYWxseVJlYWR5KSBicmVhaztcblxuICAgICAgICAgICAgICAgIC8vIE5vdGU6IGl0IGlzIGltcG9ydGFudCB0aGF0IHdlIHNldCBhIG5ldyBzdGlja3lSb29tSWQgYmVmb3JlIHNldHRpbmcgdGhlIG9sZCByb29tXG4gICAgICAgICAgICAgICAgLy8gdG8gSURMRS4gSWYgd2UgZG9uJ3QsIHRoZSB3cm9uZyByb29tIGdldHMgY291bnRlZCBhcyBzdGlja3kuXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFN0aWNreUlkID0gdGhpcy5fc3RhdGUuc3RpY2t5Um9vbUlkO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtzdGlja3lSb29tSWQ6IHBheWxvYWQucm9vbV9pZH0pO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U3RpY2t5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0Um9vbUNhdGVnb3J5KHRoaXMuX21hdHJpeENsaWVudC5nZXRSb29tKGN1cnJlbnRTdGlja3lJZCksIENBVEVHT1JZX0lETEUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3Jvb21VcGRhdGVUcmlnZ2VyZWQocm9vbUlkLCBpZ25vcmVTdGlja3kpIHtcbiAgICAgICAgLy8gV2UgZG9uJ3QgY2FsY3VsYXRlIGNhdGVnb3JpZXMgZm9yIHN0aWNreSByb29tcyBiZWNhdXNlIHdlIGhhdmUgYSBtb2RlcmF0ZVxuICAgICAgICAvLyBpbnRlcmVzdCBpbiB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIGNhdGVnb3J5IHRoYXQgdGhleSB3ZXJlIGxhc3QgaW4gYmVmb3JlXG4gICAgICAgIC8vIGJlaW5nIGFydGlmaWNpYWxseSBmbGFnZ2VkIGFzIElETEUuIEFsc28sIHRoaXMgcmVkdWNlcyB0aGUgYW1vdW50IG9mIHRpbWVcbiAgICAgICAgLy8gd2Ugc3BlbmQgaW4gX3NldFJvb21DYXRlZ29yeSBldmVyIHNvIHNsaWdodGx5LlxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuc3RpY2t5Um9vbUlkICE9PSByb29tSWQgfHwgaWdub3JlU3RpY2t5KSB7XG4gICAgICAgICAgICAvLyBNaWNybyBvcHRpbWl6YXRpb246IE9ubHkgbG9vayB1cCB0aGUgcm9vbSBpZiB3ZSdyZSBjb25maWRlbnQgd2UnbGwgbmVlZCBpdC5cbiAgICAgICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLl9tYXRyaXhDbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICAgICAgaWYgKCFyb29tKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy5fY2FsY3VsYXRlQ2F0ZWdvcnkocm9vbSk7XG4gICAgICAgICAgICB0aGlzLl9zZXRSb29tQ2F0ZWdvcnkocm9vbSwgY2F0ZWdvcnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpbHRlclRhZ3ModGFncykge1xuICAgICAgICB0YWdzID0gdGFncyA/IE9iamVjdC5rZXlzKHRhZ3MpIDogW107XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS50YWdzRW5hYmxlZCkgcmV0dXJuIHRhZ3M7XG4gICAgICAgIHJldHVybiB0YWdzLmZpbHRlcigodCkgPT4ga25vd25MaXN0cy5oYXModCkpO1xuICAgIH1cblxuICAgIF9nZXRSZWNvbW1lbmRlZFRhZ3NGb3JSb29tKHJvb20pIHtcbiAgICAgICAgY29uc3QgdGFncyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IG15TWVtYmVyc2hpcCA9IHJvb20uZ2V0TXlNZW1iZXJzaGlwKCk7XG4gICAgICAgIGlmIChteU1lbWJlcnNoaXAgPT09ICdqb2luJyB8fCBteU1lbWJlcnNoaXAgPT09ICdpbnZpdGUnKSB7XG4gICAgICAgICAgICAvLyBTdGFjayB0aGUgdXNlcidzIHRhZ3Mgb24gdG9wXG4gICAgICAgICAgICB0YWdzLnB1c2goLi4udGhpcy5fZmlsdGVyVGFncyhyb29tLnRhZ3MpKTtcblxuICAgICAgICAgICAgLy8gT3JkZXIgbWF0dGVycyBoZXJlOiBUaGUgRE1Sb29tTWFwIHVwZGF0ZXMgYmVmb3JlIGludml0ZXNcbiAgICAgICAgICAgIC8vIGFyZSBhY2NlcHRlZCwgc28gd2UgY2hlY2sgdG8gc2VlIGlmIHRoZSByb29tIGlzIGFuIGludml0ZVxuICAgICAgICAgICAgLy8gZmlyc3QsIHRoZW4gaWYgaXQgaXMgYSBkaXJlY3QgY2hhdCwgYW5kIGZpbmFsbHkgZGVmYXVsdFxuICAgICAgICAgICAgLy8gdG8gdGhlIFwicmVjZW50c1wiIGxpc3QuXG4gICAgICAgICAgICBjb25zdCBkbVJvb21NYXAgPSBETVJvb21NYXAuc2hhcmVkKCk7XG4gICAgICAgICAgICBpZiAobXlNZW1iZXJzaGlwID09PSAnaW52aXRlJykge1xuICAgICAgICAgICAgICAgIHRhZ3MucHVzaChcImltLnZlY3Rvci5mYWtlLmludml0ZVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG1Sb29tTWFwLmdldFVzZXJJZEZvclJvb21JZChyb29tLnJvb21JZCkgJiYgdGFncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBpbnRlbnRpb25hbGx5IGRvbid0IGR1cGxpY2F0ZSByb29tcyBpbiBvdGhlciB0YWdzIGludG8gdGhlIHBlb3BsZSBsaXN0XG4gICAgICAgICAgICAgICAgLy8gYXMgYSBmZWF0dXJlLlxuICAgICAgICAgICAgICAgIHRhZ3MucHVzaChUQUdfRE0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRhZ3MucHVzaChcImltLnZlY3Rvci5mYWtlLnJlY2VudFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChteU1lbWJlcnNoaXApIHsgLy8gbnVsbC1ndWFyZCBhcyBudWxsIG1lYW5zIGl0IHdhcyBwZWVrZWRcbiAgICAgICAgICAgIHRhZ3MucHVzaChcImltLnZlY3Rvci5mYWtlLmFyY2hpdmVkXCIpO1xuICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gdGFncztcbiAgICB9XG5cbiAgICBfc2xvdFJvb21JbnRvTGlzdChyb29tLCBjYXRlZ29yeSwgdGFnLCBleGlzdGluZ0VudHJpZXMsIG5ld0xpc3QsIGxhc3RUaW1lc3RhbXBGbikge1xuICAgICAgICBjb25zdCB0YXJnZXRDYXRlZ29yeUluZGV4ID0gQ0FURUdPUllfT1JERVIuaW5kZXhPZihjYXRlZ29yeSk7XG5cbiAgICAgICAgbGV0IGNhdGVnb3J5Q29tcGFyYXRvciA9IChhLCBiKSA9PiBsYXN0VGltZXN0YW1wRm4oYS5yb29tKSA+PSBsYXN0VGltZXN0YW1wRm4oYi5yb29tKTtcbiAgICAgICAgY29uc3Qgc29ydEFsZ29yaXRobSA9IGdldExpc3RBbGdvcml0aG0odGFnLCB0aGlzLl9zdGF0ZS5hbGdvcml0aG0pO1xuICAgICAgICBpZiAoc29ydEFsZ29yaXRobSA9PT0gQUxHT19SRUNFTlQpIHtcbiAgICAgICAgICAgIGNhdGVnb3J5Q29tcGFyYXRvciA9IChhLCBiKSA9PiB0aGlzLl9yZWNlbnRzQ29tcGFyYXRvcihhLCBiLCBsYXN0VGltZXN0YW1wRm4pO1xuICAgICAgICB9IGVsc2UgaWYgKHNvcnRBbGdvcml0aG0gPT09IEFMR09fQUxQSEFCRVRJQykge1xuICAgICAgICAgICAgY2F0ZWdvcnlDb21wYXJhdG9yID0gKGEsIGIpID0+IHRoaXMuX2xleGljb2dyYXBoaWNhbENvbXBhcmF0b3IoYSwgYik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgc2xvdHRpbmcgYWxnb3JpdGhtIHdvcmtzIGJ5IHRyeWluZyB0byBwb3NpdGlvbiB0aGUgcm9vbSBpbiB0aGUgbW9zdCByZWxldmFudFxuICAgICAgICAvLyBjYXRlZ29yeSBvZiB0aGUgbGlzdCAocmVkID4gZ3JleSA+IGV0YykuIFRvIGFjY29tcGxpc2ggdGhpcywgd2UgbmVlZCB0byBjb25zaWRlclxuICAgICAgICAvLyBhIGNvdXBsZSBjYXNlczogdGhlIGNhdGVnb3J5IGV4aXN0aW5nIGluIHRoZSBsaXN0IGJ1dCBoYXZpbmcgb3RoZXIgcm9vbXMgaW4gaXQgYW5kXG4gICAgICAgIC8vIHRoZSBjYXNlIG9mIHRoZSBjYXRlZ29yeSBzaW1wbHkgbm90IGV4aXN0aW5nIGFuZCBuZWVkaW5nIHRvIGJlIHN0YXJ0ZWQuIEluIG9yZGVyIHRvXG4gICAgICAgIC8vIGRvIHRoaXMgZWZmaWNpZW50bHksIHdlIG9ubHkgd2FudCB0byBpdGVyYXRlIG92ZXIgdGhlIGxpc3Qgb25jZSBhbmQgc29sdmUgb3VyIHNvcnRpbmdcbiAgICAgICAgLy8gcHJvYmxlbSBhcyB3ZSBnby5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRmlyc3RseSwgd2UnbGwgcmVtb3ZlIGFueSBleGlzdGluZyBlbnRyeSB0aGF0IHJlZmVyZW5jZXMgdGhlIHJvb20gd2UncmUgdHJ5aW5nIHRvXG4gICAgICAgIC8vIGluc2VydC4gV2UgZG9uJ3QgcmVhbGx5IHdhbnQgdG8gY29uc2lkZXIgdGhlIG9sZCBlbnRyeSBhbmQgd2FudCB0byByZWNyZWF0ZSBpdC4gV2VcbiAgICAgICAgLy8gYWxzbyBleGNsdWRlIHRoZSBzdGlja3kgKGN1cnJlbnRseSBhY3RpdmUpIHJvb20gZnJvbSB0aGUgY2F0ZWdvcml6YXRpb24gbG9naWMgYW5kXG4gICAgICAgIC8vIGxldCBpdCBwYXNzIHRocm91Z2ggd2hlcmV2ZXIgaXQgcmVzaWRlcyBpbiB0aGUgbGlzdDogaXQgc2hvdWxkbid0IGJlIG1vdmluZyBhcm91bmRcbiAgICAgICAgLy8gdGhlIGxpc3QgdG9vIG11Y2gsIHNvIHdlIHdhbnQgdG8ga2VlcCBpdCB3aGVyZSBpdCBpcy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGNhc2Ugb2YgdGhlIGNhdGVnb3J5IHdlIHdhbnQgZXhpc3RpbmcgaXMgZWFzeSB0byBoYW5kbGU6IG9uY2Ugd2UgaGl0IHRoZSBjYXRlZ29yeSxcbiAgICAgICAgLy8gZmluZCB0aGUgcm9vbSB0aGF0IGhhcyBhIG1vc3QgcmVjZW50IGV2ZW50IGxhdGVyIHRoYW4gb3VyIG93biBhbmQgaW5zZXJ0IGp1c3QgYmVmb3JlXG4gICAgICAgIC8vIHRoYXQgKG1ha2luZyB1cyB0aGUgbW9yZSByZWNlbnQgcm9vbSkuIElmIHdlIGVuZCB1cCBoaXR0aW5nIHRoZSBuZXh0IGNhdGVnb3J5IGJlZm9yZVxuICAgICAgICAvLyB3ZSBjYW4gc2xvdCB0aGUgcm9vbSBpbiwgaW5zZXJ0IHRoZSByb29tIGF0IHRoZSB0b3Agb2YgdGhlIGNhdGVnb3J5IGFzIGEgZmFsbGJhY2suIFdlXG4gICAgICAgIC8vIGRvIHRoaXMgdG8gZW5zdXJlIHRoYXQgdGhlIHJvb20gZG9lc24ndCBnbyB0b28gZmFyIGRvd24gdGhlIGxpc3QgZ2l2ZW4gaXQgd2FzIHByZXZpb3VzbHlcbiAgICAgICAgLy8gY29uc2lkZXJlZCBpbXBvcnRhbnQgKGluIHRoZSBjYXNlIG9mIGdvaW5nIGRvd24gaW4gY2F0ZWdvcnkpIG9yIGlzIG5vdyBtb3JlIGltcG9ydGFudFxuICAgICAgICAvLyAoc3VkZGVubHkgYmVjb21pbmcgcmVkLCBmb3IgaW5zdGFuY2UpLiBUaGUgYm91bmRhcnkgdHJhY2tpbmcgaXMgaG93IHdlIGVuZCB1cCBhY2hpZXZpbmdcbiAgICAgICAgLy8gdGhpcywgYXMgZGVzY3JpYmVkIGluIHRoZSBuZXh0IHBhcmFncmFwaHMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBvdGhlciBjYXNlIG9mIHRoZSBjYXRlZ29yeSBub3QgYWxyZWFkeSBleGlzdGluZyBpcyBhIGJpdCBtb3JlIGNvbXBsaWNhdGVkLiBXZSB0cmFja1xuICAgICAgICAvLyB0aGUgYm91bmRhcmllcyBvZiBlYWNoIGNhdGVnb3J5IHJlbGF0aXZlIHRvIHRoZSBsaXN0IHdlJ3JlIGN1cnJlbnRseSBidWlsZGluZyBzbyB0aGF0XG4gICAgICAgIC8vIHdoZW4gd2UgbWlzcyB0aGUgY2F0ZWdvcnkgd2UgY2FuIGluc2VydCB0aGUgcm9vbSBhdCB0aGUgcmlnaHQgc3BvdC4gTW9zdCBpbXBvcnRhbnRseSwgd2VcbiAgICAgICAgLy8gY2FuJ3QgYXNzdW1lIHRoYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCBiZWluZyBidWlsdCBpcyB0aGUgcmlnaHQgc3BvdCBiZWNhdXNlIG9mIHRoZSBsYXN0XG4gICAgICAgIC8vIHBhcmFncmFwaCdzIHJlcXVpcmVtZW50OiB0aGUgcm9vbSBzaG91bGQgYmUgcHV0IHRvIHRoZSB0b3Agb2YgYSBjYXRlZ29yeSBpZiB0aGUgY2F0ZWdvcnlcbiAgICAgICAgLy8gcnVucyBvdXQgb2YgcGxhY2VzIHRvIHB1dCBpdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQWxsIHRvbGQsIG91ciB0cmFja2luZyBsb29rcyBzb21ldGhpbmcgbGlrZSB0aGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAtLS0tLS0gQSA8LSBDYXRlZ29yeSBib3VuZGFyeSAoc3RhcnQgb2YgcmVkKVxuICAgICAgICAvLyAgUkVEXG4gICAgICAgIC8vICBSRURcbiAgICAgICAgLy8gIFJFRFxuICAgICAgICAvLyAtLS0tLS0gQiA8LSBJbiB0aGlzIGV4YW1wbGUsIHdlIGhhdmUgYSBncmV5IHJvb20gd2Ugd2FudCB0byBpbnNlcnQuXG4gICAgICAgIC8vICBCT0xEXG4gICAgICAgIC8vICBCT0xEXG4gICAgICAgIC8vIC0tLS0tLSBDXG4gICAgICAgIC8vICBJRExFXG4gICAgICAgIC8vICBJRExFXG4gICAgICAgIC8vIC0tLS0tLSBEIDwtIEVuZCBvZiBsaXN0XG4gICAgICAgIC8vXG4gICAgICAgIC8vIEdpdmVuIHRoYXQgZXhhbXBsZSwgYW5kIG91ciBkZXNpcmUgdG8gaW5zZXJ0IGEgR1JFWSByb29tIGludG8gdGhlIGxpc3QsIHRoaXMgaXRlcmF0ZXNcbiAgICAgICAgLy8gb3ZlciB0aGUgcm9vbSBsaXN0IHVudGlsIGl0IHJlYWxpemVzIHRoYXQgQk9MRCBjb21lcyBhZnRlciBHUkVZIGFuZCB3ZSdyZSBubyBsb25nZXJcbiAgICAgICAgLy8gaW4gdGhlIFJFRCBzZWN0aW9uLiBCZWNhdXNlIHRoZXJlJ3Mgbm8gcm9vbXMgdGhlcmUsIHdlIHNpbXBseSBpbnNlcnQgdGhlcmUgd2hpY2ggaXNcbiAgICAgICAgLy8gYWxzbyBhIFwiY2F0ZWdvcnkgYm91bmRhcnlcIi4gSWYgd2UgY2hhbmdlIHRoZSBleGFtcGxlIHRvIHdhbnRpbmcgdG8gaW5zZXJ0IGEgQk9MRCByb29tXG4gICAgICAgIC8vIHdoaWNoIGNhbid0IGJlIG9yZGVyZWQgYnkgdGltZXN0YW1wIHdpdGggdGhlIGV4aXN0aW5nIGNvdXBsZSByb29tcywgd2Ugd291bGQgc3RpbGwgbWFrZVxuICAgICAgICAvLyB1c2Ugb2YgdGhlIGJvdW5kYXJ5IGZsYWcgdG8gaW5zZXJ0IGF0IEIgYmVmb3JlIGNoYW5naW5nIHRoZSBib3VuZGFyeSBpbmRpY2F0b3IgdG8gQy5cblxuICAgICAgICBsZXQgZGVzaXJlZENhdGVnb3J5Qm91bmRhcnlJbmRleCA9IDA7XG4gICAgICAgIGxldCBmb3VuZEJvdW5kYXJ5ID0gZmFsc2U7XG4gICAgICAgIGxldCBwdXNoZWRFbnRyeSA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZXhpc3RpbmdFbnRyaWVzKSB7XG4gICAgICAgICAgICAvLyBXZSBpbnNlcnQgb3VyIG93biByZWNvcmQgYXMgbmVlZGVkLCBzbyBkb24ndCBsZXQgdGhlIG9sZCBvbmUgdGhyb3VnaC5cbiAgICAgICAgICAgIGlmIChlbnRyeS5yb29tLnJvb21JZCA9PT0gcm9vbS5yb29tSWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIGxpc3QgaXMgYSByZWNlbnQgbGlzdCwgYW5kIHRoZSByb29tIGFwcGVhcnMgaW4gdGhpcyBsaXN0LCBhbmQgd2UncmVcbiAgICAgICAgICAgIC8vIG5vdCBsb29raW5nIGF0IGEgc3RpY2t5IHJvb20gKHN0aWNreSByb29tcyBoYXZlIHVucmVsaWFibGUgY2F0ZWdvcmllcyksIHRyeVxuICAgICAgICAgICAgLy8gdG8gc2xvdCB0aGUgbmV3IHJvb20gaW5cbiAgICAgICAgICAgIGlmIChlbnRyeS5yb29tLnJvb21JZCAhPT0gdGhpcy5fc3RhdGUuc3RpY2t5Um9vbUlkICYmICFwdXNoZWRFbnRyeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5Q2F0ZWdvcnlJbmRleCA9IENBVEVHT1JZX09SREVSLmluZGV4T2YoZW50cnkuY2F0ZWdvcnkpO1xuXG4gICAgICAgICAgICAgICAgLy8gQXMgcGVyIGFib3ZlLCBjaGVjayBpZiB3ZSdyZSBtZWV0aW5nIHRoYXQgYm91bmRhcnkgd2Ugd2FudGVkIHRvIGxvY2F0ZS5cbiAgICAgICAgICAgICAgICBpZiAoZW50cnlDYXRlZ29yeUluZGV4ID49IHRhcmdldENhdGVnb3J5SW5kZXggJiYgIWZvdW5kQm91bmRhcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzaXJlZENhdGVnb3J5Qm91bmRhcnlJbmRleCA9IG5ld0xpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRCb3VuZGFyeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UndmUgaGl0IHRoZSB0b3Agb2YgYSBib3VuZGFyeSBiZXlvbmQgb3VyIHRhcmdldCBjYXRlZ29yeSwgaW5zZXJ0IGF0IHRoZSB0b3Agb2ZcbiAgICAgICAgICAgICAgICAvLyB0aGUgZ3JvdXBpbmcgdG8gZW5zdXJlIHRoZSByb29tIGlzbid0IHNsb3R0ZWQgaW5jb3JyZWN0bHkuIE90aGVyd2lzZSwgdHJ5IHRvIGluc2VydFxuICAgICAgICAgICAgICAgIC8vIGJhc2VkIG9uIG1vc3QgcmVjZW50IHRpbWVzdGFtcC5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VkQm91bmRhcnkgPSBlbnRyeUNhdGVnb3J5SW5kZXggPiB0YXJnZXRDYXRlZ29yeUluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDYXRlZ29yeSA9IGVudHJ5Q2F0ZWdvcnlJbmRleCA9PT0gdGFyZ2V0Q2F0ZWdvcnlJbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdlZEJvdW5kYXJ5IHx8IChjdXJyZW50Q2F0ZWdvcnkgJiYgY2F0ZWdvcnlDb21wYXJhdG9yKHtyb29tfSwgZW50cnkpIDw9IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkQm91bmRhcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGNoYW5nZWQgYSBib3VuZGFyeSwgdGhlbiB3ZSd2ZSBnb25lIHRvbyBmYXIgLSBnbyB0byB0aGUgdG9wIG9mIHRoZSBsYXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWN0aW9uIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdMaXN0LnNwbGljZShkZXNpcmVkQ2F0ZWdvcnlCb3VuZGFyeUluZGV4LCAwLCB7cm9vbSwgY2F0ZWdvcnl9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlJ3JlIG9yZGVyaW5nIGJ5IHRpbWVzdGFtcCwganVzdCBpbnNlcnQgbm9ybWFsbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0xpc3QucHVzaCh7cm9vbSwgY2F0ZWdvcnl9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwdXNoZWRFbnRyeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGYWxsIHRocm91Z2ggYW5kIGNsb25lIHRoZSBsaXN0LlxuICAgICAgICAgICAgbmV3TGlzdC5wdXNoKGVudHJ5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcHVzaGVkRW50cnkgJiYgZGVzaXJlZENhdGVnb3J5Qm91bmRhcnlJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYCEhIFJvb20gJHtyb29tLnJvb21JZH0gbmVhcmx5IGxvc3Q6IFJhbiBvZmYgdGhlIGVuZCBvZiAke3RhZ31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgISEgSW5zZXJ0aW5nIGF0IHBvc2l0aW9uICR7ZGVzaXJlZENhdGVnb3J5Qm91bmRhcnlJbmRleH0gd2l0aCBjYXRlZ29yeSAke2NhdGVnb3J5fWApO1xuICAgICAgICAgICAgbmV3TGlzdC5zcGxpY2UoZGVzaXJlZENhdGVnb3J5Qm91bmRhcnlJbmRleCwgMCwge3Jvb20sIGNhdGVnb3J5fSk7XG4gICAgICAgICAgICBwdXNoZWRFbnRyeSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHVzaGVkRW50cnk7XG4gICAgfVxuXG4gICAgX3NldFJvb21DYXRlZ29yeShyb29tLCBjYXRlZ29yeSkge1xuICAgICAgICBpZiAoIXJvb20pIHJldHVybjsgLy8gVGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGVzdHNcblxuICAgICAgICBjb25zdCBsaXN0c0Nsb25lID0ge307XG5cbiAgICAgICAgLy8gTWljcm8gb3B0aW1pemF0aW9uOiBTdXBwb3J0IGxhemlseSBsb2FkaW5nIHRoZSBsYXN0IHRpbWVzdGFtcCBpbiBhIHJvb21cbiAgICAgICAgY29uc3QgdGltZXN0YW1wQ2FjaGUgPSB7fTsgLy8ge3Jvb21JZCA9PiB0c31cbiAgICAgICAgY29uc3QgbGFzdFRpbWVzdGFtcCA9IChyb29tKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRpbWVzdGFtcENhY2hlW3Jvb20ucm9vbUlkXSkge1xuICAgICAgICAgICAgICAgIHRpbWVzdGFtcENhY2hlW3Jvb20ucm9vbUlkXSA9IHRoaXMuX3RzT2ZOZXdlc3RFdmVudChyb29tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aW1lc3RhbXBDYWNoZVtyb29tLnJvb21JZF07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRhcmdldFRhZ3MgPSB0aGlzLl9nZXRSZWNvbW1lbmRlZFRhZ3NGb3JSb29tKHJvb20pO1xuICAgICAgICBjb25zdCBpbnNlcnRlZEludG9UYWdzID0gW107XG5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgYWxsIHRoZSB0YWdzIChsaXN0cykgYXJlIHVwZGF0ZWQgd2l0aCB0aGUgcm9vbSdzIG5ldyBwb3NpdGlvbi4gV2VcbiAgICAgICAgLy8gZ2VuZXJhbGx5IG9ubHkgZ2V0IGNhbGxlZCBoZXJlIHdoZW4gdGhlcmUncyBhIG5ldyByb29tIHRvIGluc2VydCBvciBhIHJvb20gaGFzIHBvdGVudGlhbGx5XG4gICAgICAgIC8vIGNoYW5nZWQgcG9zaXRpb25zIHdpdGhpbiB0aGUgbGlzdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2UgZG8gYWxsIG91ciBjaGVja3MgYnkgaXRlcmF0aW5nIG92ZXIgdGhlIHJvb21zIGluIHRoZSBleGlzdGluZyBsaXN0cywgdHJ5aW5nIHRvIGluc2VydFxuICAgICAgICAvLyBvdXIgcm9vbSB3aGVyZSB3ZSBjYW4uIEFzIGEgZ3VpZGluZyBwcmluY2lwbGUsIHdlIHNob3VsZCBiZSByZW1vdmluZyB0aGUgcm9vbSBmcm9tIGFsbFxuICAgICAgICAvLyB0YWdzLCBhbmQgaW5zZXJ0IHRoZSByb29tIGludG8gdGFyZ2V0VGFncy4gV2Ugc2hvdWxkIHBlcmZvcm0gdGhlIGRlbGV0aW9uIGJlZm9yZSB0aGUgYWRkaXRpb25cbiAgICAgICAgLy8gd2hlcmUgcG9zc2libGUgdG8ga2VlcCBhIGNvbnNpc3RlbnQgc3RhdGUuIEJ5IHRoZSBlbmQgb2YgdGhpcywgdGFyZ2V0VGFncyBzaG91bGQgYmUgdGhlXG4gICAgICAgIC8vIHNhbWUgYXMgaW5zZXJ0ZWRJbnRvVGFncy5cblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLl9zdGF0ZS5saXN0cykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZEhhdmVSb29tID0gdGFyZ2V0VGFncy5pbmNsdWRlcyhrZXkpO1xuXG4gICAgICAgICAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb246IERvbid0IGRvIGNvbXBsaWNhdGVkIG1hdGggaWYgd2UgZG9uJ3QgaGF2ZSB0by5cbiAgICAgICAgICAgIGlmICghc2hvdWxkSGF2ZVJvb20pIHtcbiAgICAgICAgICAgICAgICBsaXN0c0Nsb25lW2tleV0gPSB0aGlzLl9zdGF0ZS5saXN0c1trZXldLmZpbHRlcigoZSkgPT4gZS5yb29tLnJvb21JZCAhPT0gcm9vbS5yb29tSWQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChnZXRMaXN0QWxnb3JpdGhtKGtleSwgdGhpcy5fc3RhdGUuYWxnb3JpdGhtKSA9PT0gQUxHT19NQU5VQUwpIHtcbiAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBvcmRlcmVkIHRhZ3MgYXJlIHNvcnRlZCBsYXRlciwgc28gZm9yIG5vdyB3ZSdsbCBqdXN0IGNsb25lIHRoZSB0YWdcbiAgICAgICAgICAgICAgICAvLyBhbmQgYWRkIG91ciByb29tIGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgIGxpc3RzQ2xvbmVba2V5XSA9IHRoaXMuX3N0YXRlLmxpc3RzW2tleV0uZmlsdGVyKChlKSA9PiBlLnJvb20ucm9vbUlkICE9PSByb29tLnJvb21JZCk7XG4gICAgICAgICAgICAgICAgbGlzdHNDbG9uZVtrZXldLnB1c2goe3Jvb20sIGNhdGVnb3J5fSk7XG4gICAgICAgICAgICAgICAgaW5zZXJ0ZWRJbnRvVGFncy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RzQ2xvbmVba2V5XSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcHVzaGVkRW50cnkgPSB0aGlzLl9zbG90Um9vbUludG9MaXN0KFxuICAgICAgICAgICAgICAgICAgICByb29tLCBjYXRlZ29yeSwga2V5LCB0aGlzLl9zdGF0ZS5saXN0c1trZXldLCBsaXN0c0Nsb25lW2tleV0sIGxhc3RUaW1lc3RhbXApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFwdXNoZWRFbnRyeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHNob3VsZCByYXJlbHkgaGFwcGVuOiBfc2xvdFJvb21JbnRvTGlzdCBoYXMgc2V2ZXJhbCBjaGVja3Mgd2hpY2ggYXR0ZW1wdFxuICAgICAgICAgICAgICAgICAgICAvLyB0byBtYWtlIHN1cmUgdGhhdCBhIHJvb20gaXMgbm90IGxvc3QgaW4gdGhlIGxpc3QuIElmIHdlIGRvIGxvc2UgdGhlIHJvb20gdGhvdWdoLFxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBzaG91bGRuJ3QgdGhyb3cgaXQgb24gdGhlIGZsb29yIGFuZCBmb3JnZXQgYWJvdXQgaXQuIEluc3RlYWQsIHdlIHNob3VsZCBpbnNlcnRcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgc29tZXdoZXJlLiBXZSdsbCBpbnNlcnQgaXQgYXQgdGhlIHRvcCBmb3IgYSBjb3VwbGUgcmVhc29uczogMSkgaXQgaXMgcHJvYmFibHlcbiAgICAgICAgICAgICAgICAgICAgLy8gYW4gaW1wb3J0YW50IHJvb20gZm9yIHRoZSB1c2VyIGFuZCAyKSBpZiB0aGlzIGRvZXMgaGFwcGVuLCB3ZSdkIHdhbnQgYSBidWcgcmVwb3J0LlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYCEhIFJvb20gJHtyb29tLnJvb21JZH0gbmVhcmx5IGxvc3Q6IEZhaWxlZCB0byBmaW5kIGEgcG9zaXRpb25gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAhISBJbnNlcnRpbmcgYXQgcG9zaXRpb24gMCBpbiB0aGUgbGlzdCBhbmQgZmxhZ2dpbmcgYXMgaW5zZXJ0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiISEgQWRkaXRpb25hbCBpbmZvOiBcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICB1cFRvSW5kZXg6IGxpc3RzQ2xvbmVba2V5XS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkQ291bnQ6IHRoaXMuX3N0YXRlLmxpc3RzW2tleV0ubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdHNDbG9uZVtrZXldLnNwbGljZSgwLCAwLCB7cm9vbSwgY2F0ZWdvcnl9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5zZXJ0ZWRJbnRvVGFncy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEb3VibGUgY2hlY2sgdGhhdCB3ZSBpbnNlcnRlZCB0aGUgcm9vbSBpbiB0aGUgcmlnaHQgcGxhY2VzLlxuICAgICAgICAvLyBUaGVyZSBzaG91bGQgbmV2ZXIgYmUgYSBkaXNjcmVwYW5jeS5cbiAgICAgICAgZm9yIChjb25zdCB0YXJnZXRUYWcgb2YgdGFyZ2V0VGFncykge1xuICAgICAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5zZXJ0ZWRUYWcgb2YgaW5zZXJ0ZWRJbnRvVGFncykge1xuICAgICAgICAgICAgICAgIGlmIChpbnNlcnRlZFRhZyA9PT0gdGFyZ2V0VGFnKSBjb3VudCsrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY291bnQgIT09IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYCEhIFJvb20gJHtyb29tLnJvb21JZH0gaW5zZXJ0ZWQgJHtjb3VudH0gdGltZXMgdG8gJHt0YXJnZXRUYWd9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMTMwM1xuICAgICAgICAgICAgLy8gVGhlIGxvZ2dpbmcgaXMgdG8gdHJ5IGFuZCBpZGVudGlmeSB3aGF0IGhhcHBlbmVkIGV4YWN0bHkuXG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBTb21ldGhpbmcgd2VudCB2ZXJ5IGJhZGx5IHdyb25nIC0gdHJ5IHRvIHJlY292ZXIgdGhlIHJvb20uXG4gICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgYm90aGVyIGNoZWNraW5nIGhvdyB0aGUgdGFyZ2V0IGxpc3QgaXMgb3JkZXJlZCAtIHdlJ3JlIGV4cGVjdGluZ1xuICAgICAgICAgICAgICAgIC8vIHRvIGp1c3QgaW5zZXJ0IGl0LlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgISEgUmVjb3ZlcmluZyAke3Jvb20ucm9vbUlkfSBmb3IgdGFnICR7dGFyZ2V0VGFnfSBhdCBwb3NpdGlvbiAwYCk7XG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0c0Nsb25lW3RhcmdldFRhZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAhISBMaXN0IGZvciB0YWcgJHt0YXJnZXRUYWd9IGRvZXMgbm90IGV4aXN0IC0gY3JlYXRpbmdgKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdHNDbG9uZVt0YXJnZXRUYWddID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxpc3RzQ2xvbmVbdGFyZ2V0VGFnXS5zcGxpY2UoMCwgMCwge3Jvb20sIGNhdGVnb3J5fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTb3J0IHRoZSBmYXZvdXJpdGVzIGJlZm9yZSB3ZSBzZXQgdGhlIGNsb25lXG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIE9iamVjdC5rZXlzKGxpc3RzQ2xvbmUpKSB7XG4gICAgICAgICAgICBpZiAoZ2V0TGlzdEFsZ29yaXRobSh0YWcsIHRoaXMuX3N0YXRlLmFsZ29yaXRobSkgIT09IEFMR09fTUFOVUFMKSBjb250aW51ZTsgLy8gc2tpcCByZWNlbnRzIChwcmUtc29ydGVkKVxuICAgICAgICAgICAgbGlzdHNDbG9uZVt0YWddLnNvcnQodGhpcy5fZ2V0TWFudWFsQ29tcGFyYXRvcih0YWcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NldFN0YXRlKHtsaXN0czogbGlzdHNDbG9uZX0pO1xuICAgIH1cblxuICAgIF9nZW5lcmF0ZUluaXRpYWxSb29tTGlzdHMoKSB7XG4gICAgICAgIC8vIExvZyBzb21ldGhpbmcgdG8gc2hvdyB0aGF0IHdlJ3JlIHRocm93aW5nIGF3YXkgdGhlIG9sZCByZXN1bHRzLiBUaGlzIGlzIGZvciB0aGUgaW5ldml0YWJsZVxuICAgICAgICAvLyBxdWVzdGlvbiBvZiBcIndoeSBpcyAxMDAlIG9mIG15IENQVSBnb2luZyB0b3dhcmRzIFJpb3Q/XCIgLSBhIHF1aWNrIGxvb2sgYXQgdGhlIGxvZ3Mgd291bGQgcmV2ZWFsXG4gICAgICAgIC8vIHRoYXQgc29tZXRoaW5nIGlzIHdyb25nIHdpdGggdGhlIFJvb21MaXN0U3RvcmUuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGluZyBpbml0aWFsIHJvb20gbGlzdHNcIik7XG5cbiAgICAgICAgY29uc3QgbGlzdHMgPSB7XG4gICAgICAgICAgICBcIm0uc2VydmVyX25vdGljZVwiOiBbXSxcbiAgICAgICAgICAgIFwiaW0udmVjdG9yLmZha2UuaW52aXRlXCI6IFtdLFxuICAgICAgICAgICAgXCJtLmZhdm91cml0ZVwiOiBbXSxcbiAgICAgICAgICAgIFwiaW0udmVjdG9yLmZha2UucmVjZW50XCI6IFtdLFxuICAgICAgICAgICAgW1RBR19ETV06IFtdLFxuICAgICAgICAgICAgXCJtLmxvd3ByaW9yaXR5XCI6IFtdLFxuICAgICAgICAgICAgXCJpbS52ZWN0b3IuZmFrZS5hcmNoaXZlZFwiOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBkbVJvb21NYXAgPSBETVJvb21NYXAuc2hhcmVkKCk7XG5cbiAgICAgICAgdGhpcy5fbWF0cml4Q2xpZW50LmdldFJvb21zKCkuZm9yRWFjaCgocm9vbSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbXlVc2VySWQgPSB0aGlzLl9tYXRyaXhDbGllbnQuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICBjb25zdCBtZW1iZXJzaGlwID0gcm9vbS5nZXRNeU1lbWJlcnNoaXAoKTtcbiAgICAgICAgICAgIGNvbnN0IG1lID0gcm9vbS5nZXRNZW1iZXIobXlVc2VySWQpO1xuXG4gICAgICAgICAgICBpZiAobWVtYmVyc2hpcCA9PT0gXCJpbnZpdGVcIikge1xuICAgICAgICAgICAgICAgIGxpc3RzW1wiaW0udmVjdG9yLmZha2UuaW52aXRlXCJdLnB1c2goe3Jvb20sIGNhdGVnb3J5OiBDQVRFR09SWV9SRUR9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVtYmVyc2hpcCA9PT0gXCJqb2luXCIgfHwgbWVtYmVyc2hpcCA9PT0gXCJiYW5cIiB8fCAobWUgJiYgbWUuaXNLaWNrZWQoKSkpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2VkIHRvIHNwbGl0IHJvb21zIHZpYSB0YWdzXG4gICAgICAgICAgICAgICAgbGV0IHRhZ05hbWVzID0gT2JqZWN0LmtleXMocm9vbS50YWdzKTtcblxuICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBhbnkgbS4gdGFnIG5hbWVzIHdlIGRvbid0IGtub3cgYWJvdXRcbiAgICAgICAgICAgICAgICB0YWdOYW1lcyA9IHRhZ05hbWVzLmZpbHRlcigodCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb246IEF2b2lkIGhpdHRpbmcgdGhlIFNldHRpbmdzU3RvcmUgYXQgYWxsIGNvc3RzIGJ5IG1ha2luZyBpdCB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gbGFzdCBjb25kaXRpb24gcG9zc2libGUuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsaXN0c1t0XSAhPT0gdW5kZWZpbmVkIHx8ICghdC5zdGFydHNXaXRoKCdtLicpICYmIHRoaXMuX3N0YXRlLnRhZ3NFbmFibGVkKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICh0YWdOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFnTmFtZSA9IHRhZ05hbWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdHNbdGFnTmFtZV0gPSBsaXN0c1t0YWdOYW1lXSB8fCBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVmYXVsdCB0byBhbiBhcmJpdHJhcnkgY2F0ZWdvcnkgZm9yIHRhZ3Mgd2hpY2ggYXJlbid0IG9yZGVyZWQgYnkgcmVjZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNhdGVnb3J5ID0gQ0FURUdPUllfSURMRTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRMaXN0QWxnb3JpdGhtKHRhZ05hbWUsIHRoaXMuX3N0YXRlLmFsZ29yaXRobSkgIT09IEFMR09fTUFOVUFMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnkgPSB0aGlzLl9jYWxjdWxhdGVDYXRlZ29yeShyb29tKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RzW3RhZ05hbWVdLnB1c2goe3Jvb20sIGNhdGVnb3J5fSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRtUm9vbU1hcC5nZXRVc2VySWRGb3JSb29tSWQocm9vbS5yb29tSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFwiRGlyZWN0IE1lc3NhZ2VcIiByb29tcyAodGhhdCB3ZSdyZSBzdGlsbCBpbiBhbmQgdGhhdCBhcmVuJ3Qgb3RoZXJ3aXNlIHRhZ2dlZClcbiAgICAgICAgICAgICAgICAgICAgbGlzdHNbVEFHX0RNXS5wdXNoKHtyb29tLCBjYXRlZ29yeTogdGhpcy5fY2FsY3VsYXRlQ2F0ZWdvcnkocm9vbSl9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaXN0c1tcImltLnZlY3Rvci5mYWtlLnJlY2VudFwiXS5wdXNoKHtyb29tLCBjYXRlZ29yeTogdGhpcy5fY2FsY3VsYXRlQ2F0ZWdvcnkocm9vbSl9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lbWJlcnNoaXAgPT09IFwibGVhdmVcIikge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjYXRlZ29yeSBvZiB0aGVzZSByb29tcyBpcyBub3Qgc3VwZXIgaW1wb3J0YW50LCBzbyBkZXByaW9yaXRpemUgaXQgdG8gdGhlIGxvd2VzdFxuICAgICAgICAgICAgICAgIC8vIHBvc3NpYmxlIHZhbHVlLlxuICAgICAgICAgICAgICAgIGxpc3RzW1wiaW0udmVjdG9yLmZha2UuYXJjaGl2ZWRcIl0ucHVzaCh7cm9vbSwgY2F0ZWdvcnk6IENBVEVHT1JZX0lETEV9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2UgdXNlIHRoaXMgY2FjaGUgaW4gdGhlIHJlY2VudHMgY29tcGFyYXRvciBiZWNhdXNlIF90c09mTmV3ZXN0RXZlbnQgY2FuIHRha2UgYSB3aGlsZS4gVGhpc1xuICAgICAgICAvLyBjYWNoZSBvbmx5IG5lZWRzIHRvIHN1cnZpdmUgdGhlIHNvcnQgb3BlcmF0aW9uIGJlbG93IGFuZCBzaG91bGQgbm90IGJlIGltcGxlbWVudGVkIG91dHNpZGVcbiAgICAgICAgLy8gb2YgdGhpcyBmdW5jdGlvbiwgb3RoZXJ3aXNlIHRoZSByb29tIGxpc3RzIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBiZSBvdXQgb2YgZGF0ZSBhbmQgd3JvbmcuXG4gICAgICAgIGNvbnN0IGxhdGVzdEV2ZW50VHNDYWNoZSA9IHt9OyAvLyByb29tSWQgPT4gdGltZXN0YW1wXG4gICAgICAgIGNvbnN0IHRzT2ZOZXdlc3RFdmVudEZuID0gKHJvb20pID0+IHtcbiAgICAgICAgICAgIGlmICghcm9vbSkgcmV0dXJuIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSOyAvLyBTaG91bGQgb25seSBoYXBwZW4gaW4gdGVzdHNcblxuICAgICAgICAgICAgaWYgKGxhdGVzdEV2ZW50VHNDYWNoZVtyb29tLnJvb21JZF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGF0ZXN0RXZlbnRUc0NhY2hlW3Jvb20ucm9vbUlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdHMgPSB0aGlzLl90c09mTmV3ZXN0RXZlbnQocm9vbSk7XG4gICAgICAgICAgICBsYXRlc3RFdmVudFRzQ2FjaGVbcm9vbS5yb29tSWRdID0gdHM7XG4gICAgICAgICAgICByZXR1cm4gdHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmtleXMobGlzdHMpLmZvckVhY2goKGxpc3RLZXkpID0+IHtcbiAgICAgICAgICAgIGxldCBjb21wYXJhdG9yO1xuICAgICAgICAgICAgc3dpdGNoIChnZXRMaXN0QWxnb3JpdGhtKGxpc3RLZXksIHRoaXMuX3N0YXRlLmFsZ29yaXRobSkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEFMR09fUkVDRU5UOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9yID0gKGVudHJ5QSwgZW50cnlCKSA9PiB0aGlzLl9yZWNlbnRzQ29tcGFyYXRvcihlbnRyeUEsIGVudHJ5QiwgdHNPZk5ld2VzdEV2ZW50Rm4pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFMR09fQUxQSEFCRVRJQzpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMuX2xleGljb2dyYXBoaWNhbENvbXBhcmF0b3I7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQUxHT19NQU5VQUw6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMuX2dldE1hbnVhbENvbXBhcmF0b3IobGlzdEtleSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUub3JkZXJJbXBvcnRhbnRGaXJzdCkge1xuICAgICAgICAgICAgICAgIGxpc3RzW2xpc3RLZXldLnNvcnQoKGVudHJ5QSwgZW50cnlCKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeUEuY2F0ZWdvcnkgIT09IGVudHJ5Qi5jYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4QSA9IENBVEVHT1JZX09SREVSLmluZGV4T2YoZW50cnlBLmNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeEIgPSBDQVRFR09SWV9PUkRFUi5pbmRleE9mKGVudHJ5Qi5jYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWR4QSA+IGlkeEIpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeEEgPCBpZHhCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy8gVGVjaG5pY2FsbHkgbm90IHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IoZW50cnlBLCBlbnRyeUIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBza2lwIHRoZSBjYXRlZ29yeSBjb21wYXJpc29uIGV2ZW4gdGhvdWdoIGl0IHNob3VsZCBuby1vcCB3aGVuIG9yZGVySW1wb3J0YW50Rmlyc3QgZGlzYWJsZWRcbiAgICAgICAgICAgICAgICBsaXN0c1tsaXN0S2V5XS5zb3J0KGNvbXBhcmF0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICBsaXN0cyxcbiAgICAgICAgICAgIHJlYWR5OiB0cnVlLCAvLyBSZWFkeSB0byByZWNlaXZlIHVwZGF0ZXMgdG8gb3JkZXJpbmdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2V2ZW50VHJpZ2dlcnNSZWNlbnRSZW9yZGVyKGV2KSB7XG4gICAgICAgIHJldHVybiBldi5nZXRUcygpICYmIChcbiAgICAgICAgICAgIFVucmVhZC5ldmVudFRyaWdnZXJzVW5yZWFkQ291bnQoZXYpIHx8XG4gICAgICAgICAgICBldi5nZXRTZW5kZXIoKSA9PT0gdGhpcy5fbWF0cml4Q2xpZW50LmNyZWRlbnRpYWxzLnVzZXJJZFxuICAgICAgICApO1xuICAgIH1cblxuICAgIF90c09mTmV3ZXN0RXZlbnQocm9vbSkge1xuICAgICAgICAvLyBBcHBhcmVudGx5IHdlIGNhbiBoYXZlIHJvb21zIHdpdGhvdXQgdGltZWxpbmVzLCBhdCBsZWFzdCB1bmRlciB0ZXN0aW5nXG4gICAgICAgIC8vIGVudmlyb25tZW50cy4gSnVzdCByZXR1cm4gTUFYX0lOVCB3aGVuIHRoaXMgaGFwcGVucy5cbiAgICAgICAgaWYgKCFyb29tIHx8ICFyb29tLnRpbWVsaW5lKSByZXR1cm4gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHJvb20udGltZWxpbmUubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ID0gcm9vbS50aW1lbGluZVtpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ldmVudFRyaWdnZXJzUmVjZW50UmVvcmRlcihldikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXYuZ2V0VHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG1pZ2h0IG9ubHkgaGF2ZSBldmVudHMgdGhhdCBkb24ndCB0cmlnZ2VyIHRoZSB1bnJlYWQgaW5kaWNhdG9yLFxuICAgICAgICAvLyBpbiB3aGljaCBjYXNlIHVzZSB0aGUgb2xkZXN0IGV2ZW50IGV2ZW4gaWYgbm9ybWFsbHkgaXQgd291bGRuJ3QgY291bnQuXG4gICAgICAgIC8vIFRoaXMgaXMgYmV0dGVyIHRoYW4ganVzdCBhc3N1bWluZyB0aGUgbGFzdCBldmVudCB3YXMgZm9yZXZlciBhZ28uXG4gICAgICAgIGlmIChyb29tLnRpbWVsaW5lLmxlbmd0aCAmJiByb29tLnRpbWVsaW5lWzBdLmdldFRzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByb29tLnRpbWVsaW5lWzBdLmdldFRzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2FsY3VsYXRlQ2F0ZWdvcnkocm9vbSkge1xuICAgICAgICBpZiAoIXRoaXMuX3N0YXRlLm9yZGVySW1wb3J0YW50Rmlyc3QpIHtcbiAgICAgICAgICAgIC8vIEVmZmVjdGl2ZWx5IGRpc2FibGUgdGhlIGNhdGVnb3JpemF0aW9uIG9mIHJvb21zIGlmIHdlJ3JlIHN1cHBvc2VkIHRvXG4gICAgICAgICAgICAvLyBiZSBzb3J0aW5nIGJ5IG1vcmUgcmVjZW50IG1lc3NhZ2VzIGZpcnN0LiBUaGlzIHRyaWdnZXJzIHRoZSB0aW1lc3RhbXBcbiAgICAgICAgICAgIC8vIGNvbXBhcmlzb24gYml0IG9mIF9zZXRSb29tQ2F0ZWdvcnkgYW5kIF9yZWNlbnRzQ29tcGFyYXRvciBpbnN0ZWFkIG9mXG4gICAgICAgICAgICAvLyB0aGUgY2F0ZWdvcnkgb3JkZXJpbmcuXG4gICAgICAgICAgICByZXR1cm4gQ0FURUdPUllfSURMRTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lbnRpb25zID0gcm9vbS5nZXRVbnJlYWROb3RpZmljYXRpb25Db3VudChcImhpZ2hsaWdodFwiKSA+IDA7XG4gICAgICAgIGlmIChtZW50aW9ucykgcmV0dXJuIENBVEVHT1JZX1JFRDtcblxuICAgICAgICBsZXQgdW5yZWFkID0gcm9vbS5nZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCgpID4gMDtcbiAgICAgICAgaWYgKHVucmVhZCkgcmV0dXJuIENBVEVHT1JZX0dSRVk7XG5cbiAgICAgICAgdW5yZWFkID0gVW5yZWFkLmRvZXNSb29tSGF2ZVVucmVhZE1lc3NhZ2VzKHJvb20pO1xuICAgICAgICBpZiAodW5yZWFkKSByZXR1cm4gQ0FURUdPUllfQk9MRDtcblxuICAgICAgICByZXR1cm4gQ0FURUdPUllfSURMRTtcbiAgICB9XG5cbiAgICBfcmVjZW50c0NvbXBhcmF0b3IoZW50cnlBLCBlbnRyeUIsIHRzT2ZOZXdlc3RFdmVudEZuKSB7XG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcEEgPSB0c09mTmV3ZXN0RXZlbnRGbihlbnRyeUEucm9vbSk7XG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcEIgPSB0c09mTmV3ZXN0RXZlbnRGbihlbnRyeUIucm9vbSk7XG4gICAgICAgIHJldHVybiB0aW1lc3RhbXBCIC0gdGltZXN0YW1wQTtcbiAgICB9XG5cbiAgICBfbGV4aWNvZ3JhcGhpY2FsQ29tcGFyYXRvcihlbnRyeUEsIGVudHJ5Qikge1xuICAgICAgICByZXR1cm4gZW50cnlBLnJvb20ubmFtZS5sb2NhbGVDb21wYXJlKGVudHJ5Qi5yb29tLm5hbWUpO1xuICAgIH1cblxuICAgIF9nZXRNYW51YWxDb21wYXJhdG9yKHRhZ05hbWUsIG9wdGltaXN0aWNSZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiAoZW50cnlBLCBlbnRyeUIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJvb21BID0gZW50cnlBLnJvb207XG4gICAgICAgICAgICBjb25zdCByb29tQiA9IGVudHJ5Qi5yb29tO1xuXG4gICAgICAgICAgICBsZXQgbWV0YUEgPSByb29tQS50YWdzW3RhZ05hbWVdO1xuICAgICAgICAgICAgbGV0IG1ldGFCID0gcm9vbUIudGFnc1t0YWdOYW1lXTtcblxuICAgICAgICAgICAgaWYgKG9wdGltaXN0aWNSZXF1ZXN0ICYmIHJvb21BID09PSBvcHRpbWlzdGljUmVxdWVzdC5yb29tKSBtZXRhQSA9IG9wdGltaXN0aWNSZXF1ZXN0Lm1ldGFEYXRhO1xuICAgICAgICAgICAgaWYgKG9wdGltaXN0aWNSZXF1ZXN0ICYmIHJvb21CID09PSBvcHRpbWlzdGljUmVxdWVzdC5yb29tKSBtZXRhQiA9IG9wdGltaXN0aWNSZXF1ZXN0Lm1ldGFEYXRhO1xuXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHJvb20gdGFnIGhhcyBhbiBvcmRlciBlbGVtZW50LCBpZiBub3Qgc2V0IGl0IHRvIGJlIHRoZSBib3R0b21cbiAgICAgICAgICAgIGNvbnN0IGEgPSBtZXRhQSA/IE51bWJlcihtZXRhQS5vcmRlcikgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjb25zdCBiID0gbWV0YUIgPyBOdW1iZXIobWV0YUIub3JkZXIpIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAvLyBPcmRlciB1bmRlZmluZWQgcm9vbSB0YWcgb3JkZXJzIHRvIHRoZSBib3R0b21cbiAgICAgICAgICAgIGlmIChhID09PSB1bmRlZmluZWQgJiYgYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhID09PSBiID8gdGhpcy5fbGV4aWNvZ3JhcGhpY2FsQ29tcGFyYXRvcihlbnRyeUEsIGVudHJ5QikgOiAoYSA+IGIgPyAxIDogLTEpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldFJvb21MaXN0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLnByZXNlbnRhdGlvbkxpc3RzO1xuICAgIH1cbn1cblxuaWYgKGdsb2JhbC5zaW5nbGV0b25Sb29tTGlzdFN0b3JlID09PSB1bmRlZmluZWQpIHtcbiAgICBnbG9iYWwuc2luZ2xldG9uUm9vbUxpc3RTdG9yZSA9IG5ldyBSb29tTGlzdFN0b3JlKCk7XG59XG5leHBvcnQgZGVmYXVsdCBnbG9iYWwuc2luZ2xldG9uUm9vbUxpc3RTdG9yZTtcbiJdfQ==