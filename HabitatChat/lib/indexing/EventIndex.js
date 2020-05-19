"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _PlatformPeg = _interopRequireDefault(require("../PlatformPeg"));

var _MatrixClientPeg = require("../MatrixClientPeg");

var _matrixJsSdk = require("matrix-js-sdk");

var _promise = require("../utils/promise");

var _SettingsStore = _interopRequireWildcard(require("../settings/SettingsStore"));

var _events = require("events");

/*
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

/*
 * Event indexing class that wraps the platform specific event indexing.
 */
class EventIndex extends _events.EventEmitter {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onSync", async (state, prevState, data) => {
      const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

      if (prevState === "PREPARED" && state === "SYNCING") {
        // If our indexer is empty we're most likely running Riot the
        // first time with indexing support or running it with an
        // initial sync. Add checkpoints to crawl our encrypted rooms.
        const eventIndexWasEmpty = await indexManager.isEventIndexEmpty();
        if (eventIndexWasEmpty) await this.addInitialCheckpoints();
        this.startCrawler();
        return;
      }

      if (prevState === "SYNCING" && state === "SYNCING") {
        // A sync was done, presumably we queued up some live events,
        // commit them now.
        await indexManager.commitLiveEvents();
        return;
      }
    });
    (0, _defineProperty2.default)(this, "onRoomTimeline", async (ev, room, toStartOfTimeline, removed, data) => {
      // We only index encrypted rooms locally.
      if (!_MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(room.roomId)) return; // If it isn't a live event or if it's redacted there's nothing to
      // do.

      if (toStartOfTimeline || !data || !data.liveEvent || ev.isRedacted()) {
        return;
      } // If the event is not yet decrypted mark it for the
      // Event.decrypted callback.


      if (ev.isBeingDecrypted()) {
        const eventId = ev.getId();
        this.liveEventsForIndex.add(eventId);
      } else {
        // If the event is decrypted or is unencrypted add it to the
        // index now.
        await this.addLiveEventToIndex(ev);
      }
    });
    (0, _defineProperty2.default)(this, "onEventDecrypted", async (ev, err) => {
      const eventId = ev.getId(); // If the event isn't in our live event set, ignore it.

      if (!this.liveEventsForIndex.delete(eventId)) return;
      if (err) return;
      await this.addLiveEventToIndex(ev);
    });
    (0, _defineProperty2.default)(this, "onRedaction", async (ev, room) => {
      // We only index encrypted rooms locally.
      if (!_MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(room.roomId)) return;

      const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

      try {
        await indexManager.deleteEvent(ev.getAssociatedId());
      } catch (e) {
        console.log("EventIndex: Error deleting event from index", e);
      }
    });
    (0, _defineProperty2.default)(this, "onTimelineReset", async (room, timelineSet, resetAllTimelines) => {
      if (room === null) return;

      const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

      if (!_MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(room.roomId)) return;
      const timeline = room.getLiveTimeline();
      const token = timeline.getPaginationToken("b");
      const backwardsCheckpoint = {
        roomId: room.roomId,
        token: token,
        fullCrawl: false,
        direction: "b"
      };
      console.log("EventIndex: Added checkpoint because of a limited timeline", backwardsCheckpoint);
      await indexManager.addCrawlerCheckpoint(backwardsCheckpoint);
      this.crawlerCheckpoints.push(backwardsCheckpoint);
    });
    this.crawlerCheckpoints = []; // The time in ms that the crawler will wait loop iterations if there
    // have not been any checkpoints to consume in the last iteration.

    this._crawlerIdleTime = 5000; // The maximum number of events our crawler should fetch in a single
    // crawl.

    this._eventsPerCrawl = 100;
    this._crawler = null;
    this._currentCheckpoint = null;
    this.liveEventsForIndex = new Set();
  }

  async init() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    await indexManager.initEventIndex();
    console.log("EventIndex: Successfully initialized the event index");
    this.crawlerCheckpoints = await indexManager.loadCheckpoints();
    console.log("EventIndex: Loaded checkpoints", this.crawlerCheckpoints);
    this.registerListeners();
  }
  /**
   * Register event listeners that are necessary for the event index to work.
   */


  registerListeners() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    client.on('sync', this.onSync);
    client.on('Room.timeline', this.onRoomTimeline);
    client.on('Event.decrypted', this.onEventDecrypted);
    client.on('Room.timelineReset', this.onTimelineReset);
    client.on('Room.redaction', this.onRedaction);
  }
  /**
   * Remove the event index specific event listeners.
   */


  removeListeners() {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client === null) return;
    client.removeListener('sync', this.onSync);
    client.removeListener('Room.timeline', this.onRoomTimeline);
    client.removeListener('Event.decrypted', this.onEventDecrypted);
    client.removeListener('Room.timelineReset', this.onTimelineReset);
    client.removeListener('Room.redaction', this.onRedaction);
  }
  /**
   * Get crawler checkpoints for the encrypted rooms and store them in the index.
   */


  async addInitialCheckpoints() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const rooms = client.getRooms();

    const isRoomEncrypted = room => {
      return client.isRoomEncrypted(room.roomId);
    }; // We only care to crawl the encrypted rooms, non-encrypted
    // rooms can use the search provided by the homeserver.


    const encryptedRooms = rooms.filter(isRoomEncrypted);
    console.log("EventIndex: Adding initial crawler checkpoints"); // Gather the prev_batch tokens and create checkpoints for
    // our message crawler.

    await Promise.all(encryptedRooms.map(async room => {
      const timeline = room.getLiveTimeline();
      const token = timeline.getPaginationToken("b");
      const backCheckpoint = {
        roomId: room.roomId,
        token: token,
        direction: "b",
        fullCrawl: true
      };
      const forwardCheckpoint = {
        roomId: room.roomId,
        token: token,
        direction: "f"
      };

      try {
        if (backCheckpoint.token) {
          await indexManager.addCrawlerCheckpoint(backCheckpoint);
          this.crawlerCheckpoints.push(backCheckpoint);
        }

        if (forwardCheckpoint.token) {
          await indexManager.addCrawlerCheckpoint(forwardCheckpoint);
          this.crawlerCheckpoints.push(forwardCheckpoint);
        }
      } catch (e) {
        console.log("EventIndex: Error adding initial checkpoints for room", room.roomId, backCheckpoint, forwardCheckpoint, e);
      }
    }));
  }
  /*
   * The sync event listener.
   *
   * The listener has two cases:
   *     - First sync after start up, check if the index is empty, add
   *         initial checkpoints, if so. Start the crawler background task.
   *     - Every other sync, tell the event index to commit all the queued up
   *         live events
   */


  /**
   * Check if an event should be added to the event index.
   *
   * Most notably we filter events for which decryption failed, are redacted
   * or aren't of a type that we know how to index.
   *
   * @param {MatrixEvent} ev The event that should checked.
   * @returns {bool} Returns true if the event can be indexed, false
   * otherwise.
   */
  isValidEvent(ev) {
    const isUsefulType = ["m.room.message", "m.room.name", "m.room.topic"].includes(ev.getType());
    const validEventType = isUsefulType && !ev.isRedacted() && !ev.isDecryptionFailure();
    let validMsgType = true;
    let hasContentValue = true;

    if (ev.getType() === "m.room.message" && !ev.isRedacted()) {
      // Expand this if there are more invalid msgtypes.
      const msgtype = ev.getContent().msgtype;
      if (!msgtype) validMsgType = false;else validMsgType = !msgtype.startsWith("m.key.verification");
      if (!ev.getContent().body) hasContentValue = false;
    } else if (ev.getType() === "m.room.topic" && !ev.isRedacted()) {
      if (!ev.getContent().topic) hasContentValue = false;
    } else if (ev.getType() === "m.room.name" && !ev.isRedacted()) {
      if (!ev.getContent().name) hasContentValue = false;
    }

    return validEventType && validMsgType && hasContentValue;
  }
  /**
   * Queue up live events to be added to the event index.
   *
   * @param {MatrixEvent} ev The event that should be added to the index.
   */


  async addLiveEventToIndex(ev) {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    if (!this.isValidEvent(ev)) return;
    const jsonEvent = ev.toJSON();
    const e = ev.isEncrypted() ? jsonEvent.decrypted : jsonEvent;
    const profile = {
      displayname: ev.sender.rawDisplayName,
      avatar_url: ev.sender.getMxcAvatarUrl()
    };
    indexManager.addEventToIndex(e, profile);
  }
  /**
   * Emmit that the crawler has changed the checkpoint that it's currently
   * handling.
   */


  emitNewCheckpoint() {
    this.emit("changedCheckpoint", this.currentRoom());
  }
  /**
   * The main crawler loop.
   *
   * Goes through crawlerCheckpoints and fetches events from the server to be
   * added to the EventIndex.
   *
   * If a /room/{roomId}/messages request doesn't contain any events, stop the
   * crawl, otherwise create a new checkpoint and push it to the
   * crawlerCheckpoints queue so we go through them in a round-robin way.
   */


  async crawlerFunc() {
    let cancelled = false;

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    this._crawler = {};

    this._crawler.cancel = () => {
      cancelled = true;
    };

    let idle = false;

    while (!cancelled) {
      let sleepTime = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, 'crawlerSleepTime'); // Don't let the user configure a lower sleep time than 100 ms.


      sleepTime = Math.max(sleepTime, 100);

      if (idle) {
        sleepTime = this._crawlerIdleTime;
      }

      if (this._currentCheckpoint !== null) {
        this._currentCheckpoint = null;
        this.emitNewCheckpoint();
      }

      await (0, _promise.sleep)(sleepTime);

      if (cancelled) {
        break;
      }

      const checkpoint = this.crawlerCheckpoints.shift(); /// There is no checkpoint available currently, one may appear if
      // a sync with limited room timelines happens, so go back to sleep.

      if (checkpoint === undefined) {
        idle = true;
        continue;
      }

      this._currentCheckpoint = checkpoint;
      this.emitNewCheckpoint();
      idle = false; // We have a checkpoint, let us fetch some messages, again, very
      // conservatively to not bother our homeserver too much.

      const eventMapper = client.getEventMapper({
        preventReEmit: true
      }); // TODO we need to ensure to use member lazy loading with this
      // request so we get the correct profiles.

      let res;

      try {
        res = await client._createMessagesRequest(checkpoint.roomId, checkpoint.token, this._eventsPerCrawl, checkpoint.direction);
      } catch (e) {
        if (e.httpStatus === 403) {
          console.log("EventIndex: Removing checkpoint as we don't have ", "permissions to fetch messages from this room.", checkpoint);

          try {
            await indexManager.removeCrawlerCheckpoint(checkpoint);
          } catch (e) {
            console.log("EventIndex: Error removing checkpoint", checkpoint, e); // We don't push the checkpoint here back, it will
            // hopefully be removed after a restart. But let us
            // ignore it for now as we don't want to hammer the
            // endpoint.
          }

          continue;
        }

        console.log("EventIndex: Error crawling events:", e);
        this.crawlerCheckpoints.push(checkpoint);
        continue;
      }

      if (cancelled) {
        this.crawlerCheckpoints.push(checkpoint);
        break;
      }

      if (res.chunk.length === 0) {
        console.log("EventIndex: Done with the checkpoint", checkpoint); // We got to the start/end of our timeline, lets just
        // delete our checkpoint and go back to sleep.

        try {
          await indexManager.removeCrawlerCheckpoint(checkpoint);
        } catch (e) {
          console.log("EventIndex: Error removing checkpoint", checkpoint, e);
        }

        continue;
      } // Convert the plain JSON events into Matrix events so they get
      // decrypted if necessary.


      const matrixEvents = res.chunk.map(eventMapper);
      let stateEvents = [];

      if (res.state !== undefined) {
        stateEvents = res.state.map(eventMapper);
      }

      const profiles = {};
      stateEvents.forEach(ev => {
        if (ev.event.content && ev.event.content.membership === "join") {
          profiles[ev.event.sender] = {
            displayname: ev.event.content.displayname,
            avatar_url: ev.event.content.avatar_url
          };
        }
      });
      const decryptionPromises = [];
      matrixEvents.forEach(ev => {
        if (ev.isBeingDecrypted() || ev.isDecryptionFailure()) {
          // TODO the decryption promise is a private property, this
          // should either be made public or we should convert the
          // event that gets fired when decryption is done into a
          // promise using the once event emitter method:
          // https://nodejs.org/api/events.html#events_events_once_emitter_name
          decryptionPromises.push(ev._decryptionPromise);
        }
      }); // Let us wait for all the events to get decrypted.

      await Promise.all(decryptionPromises); // TODO if there are no events at this point we're missing a lot
      // decryption keys, do we want to retry this checkpoint at a later
      // stage?

      const filteredEvents = matrixEvents.filter(this.isValidEvent); // Collect the redaction events so we can delete the redacted events
      // from the index.

      const redactionEvents = matrixEvents.filter(ev => {
        return ev.getType() === "m.room.redaction";
      }); // Let us convert the events back into a format that EventIndex can
      // consume.

      const events = filteredEvents.map(ev => {
        const jsonEvent = ev.toJSON();
        const e = ev.isEncrypted() ? jsonEvent.decrypted : jsonEvent;
        let profile = {};
        if (e.sender in profiles) profile = profiles[e.sender];
        const object = {
          event: e,
          profile: profile
        };
        return object;
      }); // Create a new checkpoint so we can continue crawling the room for
      // messages.

      const newCheckpoint = {
        roomId: checkpoint.roomId,
        token: res.end,
        fullCrawl: checkpoint.fullCrawl,
        direction: checkpoint.direction
      };

      try {
        for (let i = 0; i < redactionEvents.length; i++) {
          const ev = redactionEvents[i];
          await indexManager.deleteEvent(ev.getAssociatedId());
        }

        const eventsAlreadyAdded = await indexManager.addHistoricEvents(events, newCheckpoint, checkpoint); // If all events were already indexed we assume that we catched
        // up with our index and don't need to crawl the room further.
        // Let us delete the checkpoint in that case, otherwise push
        // the new checkpoint to be used by the crawler.

        if (eventsAlreadyAdded === true && newCheckpoint.fullCrawl !== true) {
          console.log("EventIndex: Checkpoint had already all events", "added, stopping the crawl", checkpoint);
          await indexManager.removeCrawlerCheckpoint(newCheckpoint);
        } else {
          if (eventsAlreadyAdded === true) {
            console.log("EventIndex: Checkpoint had already all events", "added, but continuing due to a full crawl", checkpoint);
          }

          this.crawlerCheckpoints.push(newCheckpoint);
        }
      } catch (e) {
        console.log("EventIndex: Error durring a crawl", e); // An error occurred, put the checkpoint back so we
        // can retry.

        this.crawlerCheckpoints.push(checkpoint);
      }
    }

    this._crawler = null;
  }
  /**
   * Start the crawler background task.
   */


  startCrawler() {
    if (this._crawler !== null) return;
    this.crawlerFunc();
  }
  /**
   * Stop the crawler background task.
   */


  stopCrawler() {
    if (this._crawler === null) return;

    this._crawler.cancel();
  }
  /**
   * Close the event index.
   *
   * This removes all the MatrixClient event listeners, stops the crawler
   * task, and closes the index.
   */


  async close() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    this.removeListeners();
    this.stopCrawler();
    await indexManager.closeEventIndex();
    return;
  }
  /**
   * Search the event index using the given term for matching events.
   *
   * @param {SearchArgs} searchArgs The search configuration for the search,
   * sets the search term and determines the search result contents.
   *
   * @return {Promise<[SearchResult]>} A promise that will resolve to an array
   * of search results once the search is done.
   */


  async search(searchArgs) {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    return indexManager.searchEventIndex(searchArgs);
  }
  /**
   * Load events that contain URLs from the event index.
   *
   * @param {Room} room The room for which we should fetch events containing
   * URLs
   *
   * @param {number} limit The maximum number of events to fetch.
   *
   * @param {string} fromEvent From which event should we continue fetching
   * events from the index. This is only needed if we're continuing to fill
   * the timeline, e.g. if we're paginating. This needs to be set to a event
   * id of an event that was previously fetched with this function.
   *
   * @param {string} direction The direction in which we will continue
   * fetching events. EventTimeline.BACKWARDS to continue fetching events that
   * are older than the event given in fromEvent, EventTimeline.FORWARDS to
   * fetch newer events.
   *
   * @returns {Promise<MatrixEvent[]>} Resolves to an array of events that
   * contain URLs.
   */


  async loadFileEvents(room, limit = 10, fromEvent = null, direction = _matrixJsSdk.EventTimeline.BACKWARDS) {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    const loadArgs = {
      roomId: room.roomId,
      limit: limit
    };

    if (fromEvent) {
      loadArgs.fromEvent = fromEvent;
      loadArgs.direction = direction;
    }

    let events; // Get our events from the event index.

    try {
      events = await indexManager.loadFileEvents(loadArgs);
    } catch (e) {
      console.log("EventIndex: Error getting file events", e);
      return [];
    }

    const eventMapper = client.getEventMapper(); // Turn the events into MatrixEvent objects.

    const matrixEvents = events.map(e => {
      const matrixEvent = eventMapper(e.event);
      const member = new _matrixJsSdk.RoomMember(room.roomId, matrixEvent.getSender()); // We can't really reconstruct the whole room state from our
      // EventIndex to calculate the correct display name. Use the
      // disambiguated form always instead.

      member.name = e.profile.displayname + " (" + matrixEvent.getSender() + ")"; // This is sets the avatar URL.

      const memberEvent = eventMapper({
        content: {
          membership: "join",
          avatar_url: e.profile.avatar_url,
          displayname: e.profile.displayname
        },
        type: "m.room.member",
        event_id: matrixEvent.getId() + ":eventIndex",
        room_id: matrixEvent.getRoomId(),
        sender: matrixEvent.getSender(),
        origin_server_ts: matrixEvent.getTs(),
        state_key: matrixEvent.getSender()
      }); // We set this manually to avoid emitting RoomMember.membership and
      // RoomMember.name events.

      member.events.member = memberEvent;
      matrixEvent.sender = member;
      return matrixEvent;
    });
    return matrixEvents;
  }
  /**
   * Fill a timeline with events that contain URLs.
   *
   * @param {TimelineSet} timelineSet The TimelineSet the Timeline belongs to,
   * used to check if we're adding duplicate events.
   *
   * @param {Timeline} timeline The Timeline which should be filed with
   * events.
   *
   * @param {Room} room The room for which we should fetch events containing
   * URLs
   *
   * @param {number} limit The maximum number of events to fetch.
   *
   * @param {string} fromEvent From which event should we continue fetching
   * events from the index. This is only needed if we're continuing to fill
   * the timeline, e.g. if we're paginating. This needs to be set to a event
   * id of an event that was previously fetched with this function.
   *
   * @param {string} direction The direction in which we will continue
   * fetching events. EventTimeline.BACKWARDS to continue fetching events that
   * are older than the event given in fromEvent, EventTimeline.FORWARDS to
   * fetch newer events.
   *
   * @returns {Promise<boolean>} Resolves to true if events were added to the
   * timeline, false otherwise.
   */


  async populateFileTimeline(timelineSet, timeline, room, limit = 10, fromEvent = null, direction = _matrixJsSdk.EventTimeline.BACKWARDS) {
    const matrixEvents = await this.loadFileEvents(room, limit, fromEvent, direction); // If this is a normal fill request, not a pagination request, we need
    // to get our events in the BACKWARDS direction but populate them in the
    // forwards direction.
    // This needs to happen because a fill request might come with an
    // exisitng timeline e.g. if you close and re-open the FilePanel.

    if (fromEvent === null) {
      matrixEvents.reverse();
      direction = direction == _matrixJsSdk.EventTimeline.BACKWARDS ? _matrixJsSdk.EventTimeline.FORWARDS : _matrixJsSdk.EventTimeline.BACKWARDS;
    } // Add the events to the timeline of the file panel.


    matrixEvents.forEach(e => {
      if (!timelineSet.eventIdToTimeline(e.getId())) {
        timelineSet.addEventToTimeline(e, timeline, direction == _matrixJsSdk.EventTimeline.BACKWARDS);
      }
    });
    let ret = false;
    let paginationToken = ""; // Set the pagination token to the oldest event that we retrieved.

    if (matrixEvents.length > 0) {
      paginationToken = matrixEvents[matrixEvents.length - 1].getId();
      ret = true;
    }

    console.log("EventIndex: Populating file panel with", matrixEvents.length, "events and setting the pagination token to", paginationToken);
    timeline.setPaginationToken(paginationToken, _matrixJsSdk.EventTimeline.BACKWARDS);
    return ret;
  }
  /**
   * Emulate a TimelineWindow pagination() request with the event index as the event source
   *
   * Might not fetch events from the index if the timeline already contains
   * events that the window isn't showing.
   *
   * @param {Room} room The room for which we should fetch events containing
   * URLs
   *
   * @param {TimelineWindow} timelineWindow The timeline window that should be
   * populated with new events.
   *
   * @param {string} direction The direction in which we should paginate.
   * EventTimeline.BACKWARDS to paginate back, EventTimeline.FORWARDS to
   * paginate forwards.
   *
   * @param {number} limit The maximum number of events to fetch while
   * paginating.
   *
   * @returns {Promise<boolean>} Resolves to a boolean which is true if more
   * events were successfully retrieved.
   */


  paginateTimelineWindow(room, timelineWindow, direction, limit) {
    const tl = timelineWindow.getTimelineIndex(direction);
    if (!tl) return Promise.resolve(false);
    if (tl.pendingPaginate) return tl.pendingPaginate;

    if (timelineWindow.extend(direction, limit)) {
      return Promise.resolve(true);
    }

    const paginationMethod = async (timelineWindow, timeline, room, direction, limit) => {
      const timelineSet = timelineWindow._timelineSet;
      const token = timeline.timeline.getPaginationToken(direction);
      const ret = await this.populateFileTimeline(timelineSet, timeline.timeline, room, limit, token, direction);
      timeline.pendingPaginate = null;
      timelineWindow.extend(direction, limit);
      return ret;
    };

    const paginationPromise = paginationMethod(timelineWindow, tl, room, direction, limit);
    tl.pendingPaginate = paginationPromise;
    return paginationPromise;
  }
  /**
   * Get statistical information of the index.
   *
   * @return {Promise<IndexStats>} A promise that will resolve to the index
   * statistics.
   */


  async getStats() {
    const indexManager = _PlatformPeg.default.get().getEventIndexingManager();

    return indexManager.getStats();
  }
  /**
   * Get the room that we are currently crawling.
   *
   * @returns {Room} A MatrixRoom that is being currently crawled, null
   * if no room is currently being crawled.
   */


  currentRoom() {
    if (this._currentCheckpoint === null && this.crawlerCheckpoints.length === 0) {
      return null;
    }

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (this._currentCheckpoint !== null) {
      return client.getRoom(this._currentCheckpoint.roomId);
    } else {
      return client.getRoom(this.crawlerCheckpoints[0].roomId);
    }
  }

  crawlingRooms() {
    const totalRooms = new Set();
    const crawlingRooms = new Set();
    this.crawlerCheckpoints.forEach((checkpoint, index) => {
      crawlingRooms.add(checkpoint.roomId);
    });

    if (this._currentCheckpoint !== null) {
      crawlingRooms.add(this._currentCheckpoint.roomId);
    }

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const rooms = client.getRooms();

    const isRoomEncrypted = room => {
      return client.isRoomEncrypted(room.roomId);
    };

    const encryptedRooms = rooms.filter(isRoomEncrypted);
    encryptedRooms.forEach((room, index) => {
      totalRooms.add(room.roomId);
    });
    return {
      crawlingRooms,
      totalRooms
    };
  }

}

exports.default = EventIndex;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmRleGluZy9FdmVudEluZGV4LmpzIl0sIm5hbWVzIjpbIkV2ZW50SW5kZXgiLCJFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsInN0YXRlIiwicHJldlN0YXRlIiwiZGF0YSIsImluZGV4TWFuYWdlciIsIlBsYXRmb3JtUGVnIiwiZ2V0IiwiZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIiLCJldmVudEluZGV4V2FzRW1wdHkiLCJpc0V2ZW50SW5kZXhFbXB0eSIsImFkZEluaXRpYWxDaGVja3BvaW50cyIsInN0YXJ0Q3Jhd2xlciIsImNvbW1pdExpdmVFdmVudHMiLCJldiIsInJvb20iLCJ0b1N0YXJ0T2ZUaW1lbGluZSIsInJlbW92ZWQiLCJNYXRyaXhDbGllbnRQZWciLCJpc1Jvb21FbmNyeXB0ZWQiLCJyb29tSWQiLCJsaXZlRXZlbnQiLCJpc1JlZGFjdGVkIiwiaXNCZWluZ0RlY3J5cHRlZCIsImV2ZW50SWQiLCJnZXRJZCIsImxpdmVFdmVudHNGb3JJbmRleCIsImFkZCIsImFkZExpdmVFdmVudFRvSW5kZXgiLCJlcnIiLCJkZWxldGUiLCJkZWxldGVFdmVudCIsImdldEFzc29jaWF0ZWRJZCIsImUiLCJjb25zb2xlIiwibG9nIiwidGltZWxpbmVTZXQiLCJyZXNldEFsbFRpbWVsaW5lcyIsInRpbWVsaW5lIiwiZ2V0TGl2ZVRpbWVsaW5lIiwidG9rZW4iLCJnZXRQYWdpbmF0aW9uVG9rZW4iLCJiYWNrd2FyZHNDaGVja3BvaW50IiwiZnVsbENyYXdsIiwiZGlyZWN0aW9uIiwiYWRkQ3Jhd2xlckNoZWNrcG9pbnQiLCJjcmF3bGVyQ2hlY2twb2ludHMiLCJwdXNoIiwiX2NyYXdsZXJJZGxlVGltZSIsIl9ldmVudHNQZXJDcmF3bCIsIl9jcmF3bGVyIiwiX2N1cnJlbnRDaGVja3BvaW50IiwiU2V0IiwiaW5pdCIsImluaXRFdmVudEluZGV4IiwibG9hZENoZWNrcG9pbnRzIiwicmVnaXN0ZXJMaXN0ZW5lcnMiLCJjbGllbnQiLCJvbiIsIm9uU3luYyIsIm9uUm9vbVRpbWVsaW5lIiwib25FdmVudERlY3J5cHRlZCIsIm9uVGltZWxpbmVSZXNldCIsIm9uUmVkYWN0aW9uIiwicmVtb3ZlTGlzdGVuZXJzIiwicmVtb3ZlTGlzdGVuZXIiLCJyb29tcyIsImdldFJvb21zIiwiZW5jcnlwdGVkUm9vbXMiLCJmaWx0ZXIiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwiYmFja0NoZWNrcG9pbnQiLCJmb3J3YXJkQ2hlY2twb2ludCIsImlzVmFsaWRFdmVudCIsImlzVXNlZnVsVHlwZSIsImluY2x1ZGVzIiwiZ2V0VHlwZSIsInZhbGlkRXZlbnRUeXBlIiwiaXNEZWNyeXB0aW9uRmFpbHVyZSIsInZhbGlkTXNnVHlwZSIsImhhc0NvbnRlbnRWYWx1ZSIsIm1zZ3R5cGUiLCJnZXRDb250ZW50Iiwic3RhcnRzV2l0aCIsImJvZHkiLCJ0b3BpYyIsIm5hbWUiLCJqc29uRXZlbnQiLCJ0b0pTT04iLCJpc0VuY3J5cHRlZCIsImRlY3J5cHRlZCIsInByb2ZpbGUiLCJkaXNwbGF5bmFtZSIsInNlbmRlciIsInJhd0Rpc3BsYXlOYW1lIiwiYXZhdGFyX3VybCIsImdldE14Y0F2YXRhclVybCIsImFkZEV2ZW50VG9JbmRleCIsImVtaXROZXdDaGVja3BvaW50IiwiZW1pdCIsImN1cnJlbnRSb29tIiwiY3Jhd2xlckZ1bmMiLCJjYW5jZWxsZWQiLCJjYW5jZWwiLCJpZGxlIiwic2xlZXBUaW1lIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlQXQiLCJTZXR0aW5nTGV2ZWwiLCJERVZJQ0UiLCJNYXRoIiwibWF4IiwiY2hlY2twb2ludCIsInNoaWZ0IiwidW5kZWZpbmVkIiwiZXZlbnRNYXBwZXIiLCJnZXRFdmVudE1hcHBlciIsInByZXZlbnRSZUVtaXQiLCJyZXMiLCJfY3JlYXRlTWVzc2FnZXNSZXF1ZXN0IiwiaHR0cFN0YXR1cyIsInJlbW92ZUNyYXdsZXJDaGVja3BvaW50IiwiY2h1bmsiLCJsZW5ndGgiLCJtYXRyaXhFdmVudHMiLCJzdGF0ZUV2ZW50cyIsInByb2ZpbGVzIiwiZm9yRWFjaCIsImV2ZW50IiwiY29udGVudCIsIm1lbWJlcnNoaXAiLCJkZWNyeXB0aW9uUHJvbWlzZXMiLCJfZGVjcnlwdGlvblByb21pc2UiLCJmaWx0ZXJlZEV2ZW50cyIsInJlZGFjdGlvbkV2ZW50cyIsImV2ZW50cyIsIm9iamVjdCIsIm5ld0NoZWNrcG9pbnQiLCJlbmQiLCJpIiwiZXZlbnRzQWxyZWFkeUFkZGVkIiwiYWRkSGlzdG9yaWNFdmVudHMiLCJzdG9wQ3Jhd2xlciIsImNsb3NlIiwiY2xvc2VFdmVudEluZGV4Iiwic2VhcmNoIiwic2VhcmNoQXJncyIsInNlYXJjaEV2ZW50SW5kZXgiLCJsb2FkRmlsZUV2ZW50cyIsImxpbWl0IiwiZnJvbUV2ZW50IiwiRXZlbnRUaW1lbGluZSIsIkJBQ0tXQVJEUyIsImxvYWRBcmdzIiwibWF0cml4RXZlbnQiLCJtZW1iZXIiLCJSb29tTWVtYmVyIiwiZ2V0U2VuZGVyIiwibWVtYmVyRXZlbnQiLCJ0eXBlIiwiZXZlbnRfaWQiLCJyb29tX2lkIiwiZ2V0Um9vbUlkIiwib3JpZ2luX3NlcnZlcl90cyIsImdldFRzIiwic3RhdGVfa2V5IiwicG9wdWxhdGVGaWxlVGltZWxpbmUiLCJyZXZlcnNlIiwiRk9SV0FSRFMiLCJldmVudElkVG9UaW1lbGluZSIsImFkZEV2ZW50VG9UaW1lbGluZSIsInJldCIsInBhZ2luYXRpb25Ub2tlbiIsInNldFBhZ2luYXRpb25Ub2tlbiIsInBhZ2luYXRlVGltZWxpbmVXaW5kb3ciLCJ0aW1lbGluZVdpbmRvdyIsInRsIiwiZ2V0VGltZWxpbmVJbmRleCIsInJlc29sdmUiLCJwZW5kaW5nUGFnaW5hdGUiLCJleHRlbmQiLCJwYWdpbmF0aW9uTWV0aG9kIiwiX3RpbWVsaW5lU2V0IiwicGFnaW5hdGlvblByb21pc2UiLCJnZXRTdGF0cyIsImdldFJvb20iLCJjcmF3bGluZ1Jvb21zIiwidG90YWxSb29tcyIsImluZGV4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztB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SDtBQUNKOztBQUVEd0ssRUFBQUEsYUFBYSxHQUFHO0FBQ1osVUFBTUMsVUFBVSxHQUFHLElBQUl6SSxHQUFKLEVBQW5CO0FBQ0EsVUFBTXdJLGFBQWEsR0FBRyxJQUFJeEksR0FBSixFQUF0QjtBQUVBLFNBQUtOLGtCQUFMLENBQXdCbUYsT0FBeEIsQ0FBZ0MsQ0FBQ2YsVUFBRCxFQUFhNEUsS0FBYixLQUF1QjtBQUNuREYsTUFBQUEsYUFBYSxDQUFDakssR0FBZCxDQUFrQnVGLFVBQVUsQ0FBQzlGLE1BQTdCO0FBQ0gsS0FGRDs7QUFJQSxRQUFJLEtBQUsrQixrQkFBTCxLQUE0QixJQUFoQyxFQUFzQztBQUNsQ3lJLE1BQUFBLGFBQWEsQ0FBQ2pLLEdBQWQsQ0FBa0IsS0FBS3dCLGtCQUFMLENBQXdCL0IsTUFBMUM7QUFDSDs7QUFFRCxVQUFNcUMsTUFBTSxHQUFHdkMsaUNBQWdCWCxHQUFoQixFQUFmOztBQUNBLFVBQU0yRCxLQUFLLEdBQUdULE1BQU0sQ0FBQ1UsUUFBUCxFQUFkOztBQUVBLFVBQU1oRCxlQUFlLEdBQUlKLElBQUQsSUFBVTtBQUM5QixhQUFPMEMsTUFBTSxDQUFDdEMsZUFBUCxDQUF1QkosSUFBSSxDQUFDSyxNQUE1QixDQUFQO0FBQ0gsS0FGRDs7QUFJQSxVQUFNZ0QsY0FBYyxHQUFHRixLQUFLLENBQUNHLE1BQU4sQ0FBYWxELGVBQWIsQ0FBdkI7QUFDQWlELElBQUFBLGNBQWMsQ0FBQzZELE9BQWYsQ0FBdUIsQ0FBQ2xILElBQUQsRUFBTytLLEtBQVAsS0FBaUI7QUFDcENELE1BQUFBLFVBQVUsQ0FBQ2xLLEdBQVgsQ0FBZVosSUFBSSxDQUFDSyxNQUFwQjtBQUNILEtBRkQ7QUFJQSxXQUFPO0FBQUN3SyxNQUFBQSxhQUFEO0FBQWdCQyxNQUFBQTtBQUFoQixLQUFQO0FBQ0g7O0FBeHlCZ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSBcIi4uL1BsYXRmb3JtUGVnXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IHtFdmVudFRpbWVsaW5lLCBSb29tTWVtYmVyfSBmcm9tICdtYXRyaXgtanMtc2RrJztcbmltcG9ydCB7c2xlZXB9IGZyb20gXCIuLi91dGlscy9wcm9taXNlXCI7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tIFwiZXZlbnRzXCI7XG5cbi8qXG4gKiBFdmVudCBpbmRleGluZyBjbGFzcyB0aGF0IHdyYXBzIHRoZSBwbGF0Zm9ybSBzcGVjaWZpYyBldmVudCBpbmRleGluZy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRJbmRleCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY3Jhd2xlckNoZWNrcG9pbnRzID0gW107XG4gICAgICAgIC8vIFRoZSB0aW1lIGluIG1zIHRoYXQgdGhlIGNyYXdsZXIgd2lsbCB3YWl0IGxvb3AgaXRlcmF0aW9ucyBpZiB0aGVyZVxuICAgICAgICAvLyBoYXZlIG5vdCBiZWVuIGFueSBjaGVja3BvaW50cyB0byBjb25zdW1lIGluIHRoZSBsYXN0IGl0ZXJhdGlvbi5cbiAgICAgICAgdGhpcy5fY3Jhd2xlcklkbGVUaW1lID0gNTAwMDtcbiAgICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIGV2ZW50cyBvdXIgY3Jhd2xlciBzaG91bGQgZmV0Y2ggaW4gYSBzaW5nbGVcbiAgICAgICAgLy8gY3Jhd2wuXG4gICAgICAgIHRoaXMuX2V2ZW50c1BlckNyYXdsID0gMTAwO1xuICAgICAgICB0aGlzLl9jcmF3bGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY3VycmVudENoZWNrcG9pbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxpdmVFdmVudHNGb3JJbmRleCA9IG5ldyBTZXQoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBpbmRleE1hbmFnZXIgPSBQbGF0Zm9ybVBlZy5nZXQoKS5nZXRFdmVudEluZGV4aW5nTWFuYWdlcigpO1xuXG4gICAgICAgIGF3YWl0IGluZGV4TWFuYWdlci5pbml0RXZlbnRJbmRleCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IFN1Y2Nlc3NmdWxseSBpbml0aWFsaXplZCB0aGUgZXZlbnQgaW5kZXhcIik7XG5cbiAgICAgICAgdGhpcy5jcmF3bGVyQ2hlY2twb2ludHMgPSBhd2FpdCBpbmRleE1hbmFnZXIubG9hZENoZWNrcG9pbnRzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogTG9hZGVkIGNoZWNrcG9pbnRzXCIsIHRoaXMuY3Jhd2xlckNoZWNrcG9pbnRzKTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgbGlzdGVuZXJzIHRoYXQgYXJlIG5lY2Vzc2FyeSBmb3IgdGhlIGV2ZW50IGluZGV4IHRvIHdvcmsuXG4gICAgICovXG4gICAgcmVnaXN0ZXJMaXN0ZW5lcnMoKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcblxuICAgICAgICBjbGllbnQub24oJ3N5bmMnLCB0aGlzLm9uU3luYyk7XG4gICAgICAgIGNsaWVudC5vbignUm9vbS50aW1lbGluZScsIHRoaXMub25Sb29tVGltZWxpbmUpO1xuICAgICAgICBjbGllbnQub24oJ0V2ZW50LmRlY3J5cHRlZCcsIHRoaXMub25FdmVudERlY3J5cHRlZCk7XG4gICAgICAgIGNsaWVudC5vbignUm9vbS50aW1lbGluZVJlc2V0JywgdGhpcy5vblRpbWVsaW5lUmVzZXQpO1xuICAgICAgICBjbGllbnQub24oJ1Jvb20ucmVkYWN0aW9uJywgdGhpcy5vblJlZGFjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBldmVudCBpbmRleCBzcGVjaWZpYyBldmVudCBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGllbnQgPT09IG51bGwpIHJldHVybjtcblxuICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoJ3N5bmMnLCB0aGlzLm9uU3luYyk7XG4gICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcignUm9vbS50aW1lbGluZScsIHRoaXMub25Sb29tVGltZWxpbmUpO1xuICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoJ0V2ZW50LmRlY3J5cHRlZCcsIHRoaXMub25FdmVudERlY3J5cHRlZCk7XG4gICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcignUm9vbS50aW1lbGluZVJlc2V0JywgdGhpcy5vblRpbWVsaW5lUmVzZXQpO1xuICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoJ1Jvb20ucmVkYWN0aW9uJywgdGhpcy5vblJlZGFjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGNyYXdsZXIgY2hlY2twb2ludHMgZm9yIHRoZSBlbmNyeXB0ZWQgcm9vbXMgYW5kIHN0b3JlIHRoZW0gaW4gdGhlIGluZGV4LlxuICAgICAqL1xuICAgIGFzeW5jIGFkZEluaXRpYWxDaGVja3BvaW50cygpIHtcbiAgICAgICAgY29uc3QgaW5kZXhNYW5hZ2VyID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKTtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tcyA9IGNsaWVudC5nZXRSb29tcygpO1xuXG4gICAgICAgIGNvbnN0IGlzUm9vbUVuY3J5cHRlZCA9IChyb29tKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2xpZW50LmlzUm9vbUVuY3J5cHRlZChyb29tLnJvb21JZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gV2Ugb25seSBjYXJlIHRvIGNyYXdsIHRoZSBlbmNyeXB0ZWQgcm9vbXMsIG5vbi1lbmNyeXB0ZWRcbiAgICAgICAgLy8gcm9vbXMgY2FuIHVzZSB0aGUgc2VhcmNoIHByb3ZpZGVkIGJ5IHRoZSBob21lc2VydmVyLlxuICAgICAgICBjb25zdCBlbmNyeXB0ZWRSb29tcyA9IHJvb21zLmZpbHRlcihpc1Jvb21FbmNyeXB0ZWQpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogQWRkaW5nIGluaXRpYWwgY3Jhd2xlciBjaGVja3BvaW50c1wiKTtcblxuICAgICAgICAvLyBHYXRoZXIgdGhlIHByZXZfYmF0Y2ggdG9rZW5zIGFuZCBjcmVhdGUgY2hlY2twb2ludHMgZm9yXG4gICAgICAgIC8vIG91ciBtZXNzYWdlIGNyYXdsZXIuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGVuY3J5cHRlZFJvb21zLm1hcChhc3luYyAocm9vbSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGltZWxpbmUgPSByb29tLmdldExpdmVUaW1lbGluZSgpO1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSB0aW1lbGluZS5nZXRQYWdpbmF0aW9uVG9rZW4oXCJiXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBiYWNrQ2hlY2twb2ludCA9IHtcbiAgICAgICAgICAgICAgICByb29tSWQ6IHJvb20ucm9vbUlkLFxuICAgICAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiYlwiLFxuICAgICAgICAgICAgICAgIGZ1bGxDcmF3bDogdHJ1ZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmRDaGVja3BvaW50ID0ge1xuICAgICAgICAgICAgICAgIHJvb21JZDogcm9vbS5yb29tSWQsXG4gICAgICAgICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJmXCIsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChiYWNrQ2hlY2twb2ludC50b2tlbikge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbmRleE1hbmFnZXIuYWRkQ3Jhd2xlckNoZWNrcG9pbnQoYmFja0NoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyYXdsZXJDaGVja3BvaW50cy5wdXNoKGJhY2tDaGVja3BvaW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZm9yd2FyZENoZWNrcG9pbnQudG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaW5kZXhNYW5hZ2VyLmFkZENyYXdsZXJDaGVja3BvaW50KGZvcndhcmRDaGVja3BvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmF3bGVyQ2hlY2twb2ludHMucHVzaChmb3J3YXJkQ2hlY2twb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogRXJyb3IgYWRkaW5nIGluaXRpYWwgY2hlY2twb2ludHMgZm9yIHJvb21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb29tLnJvb21JZCwgYmFja0NoZWNrcG9pbnQsIGZvcndhcmRDaGVja3BvaW50LCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogVGhlIHN5bmMgZXZlbnQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBUaGUgbGlzdGVuZXIgaGFzIHR3byBjYXNlczpcbiAgICAgKiAgICAgLSBGaXJzdCBzeW5jIGFmdGVyIHN0YXJ0IHVwLCBjaGVjayBpZiB0aGUgaW5kZXggaXMgZW1wdHksIGFkZFxuICAgICAqICAgICAgICAgaW5pdGlhbCBjaGVja3BvaW50cywgaWYgc28uIFN0YXJ0IHRoZSBjcmF3bGVyIGJhY2tncm91bmQgdGFzay5cbiAgICAgKiAgICAgLSBFdmVyeSBvdGhlciBzeW5jLCB0ZWxsIHRoZSBldmVudCBpbmRleCB0byBjb21taXQgYWxsIHRoZSBxdWV1ZWQgdXBcbiAgICAgKiAgICAgICAgIGxpdmUgZXZlbnRzXG4gICAgICovXG4gICAgb25TeW5jID0gYXN5bmMgKHN0YXRlLCBwcmV2U3RhdGUsIGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXhNYW5hZ2VyID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKTtcblxuICAgICAgICBpZiAocHJldlN0YXRlID09PSBcIlBSRVBBUkVEXCIgJiYgc3RhdGUgPT09IFwiU1lOQ0lOR1wiKSB7XG4gICAgICAgICAgICAvLyBJZiBvdXIgaW5kZXhlciBpcyBlbXB0eSB3ZSdyZSBtb3N0IGxpa2VseSBydW5uaW5nIFJpb3QgdGhlXG4gICAgICAgICAgICAvLyBmaXJzdCB0aW1lIHdpdGggaW5kZXhpbmcgc3VwcG9ydCBvciBydW5uaW5nIGl0IHdpdGggYW5cbiAgICAgICAgICAgIC8vIGluaXRpYWwgc3luYy4gQWRkIGNoZWNrcG9pbnRzIHRvIGNyYXdsIG91ciBlbmNyeXB0ZWQgcm9vbXMuXG4gICAgICAgICAgICBjb25zdCBldmVudEluZGV4V2FzRW1wdHkgPSBhd2FpdCBpbmRleE1hbmFnZXIuaXNFdmVudEluZGV4RW1wdHkoKTtcbiAgICAgICAgICAgIGlmIChldmVudEluZGV4V2FzRW1wdHkpIGF3YWl0IHRoaXMuYWRkSW5pdGlhbENoZWNrcG9pbnRzKCk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcnRDcmF3bGVyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJldlN0YXRlID09PSBcIlNZTkNJTkdcIiAmJiBzdGF0ZSA9PT0gXCJTWU5DSU5HXCIpIHtcbiAgICAgICAgICAgIC8vIEEgc3luYyB3YXMgZG9uZSwgcHJlc3VtYWJseSB3ZSBxdWV1ZWQgdXAgc29tZSBsaXZlIGV2ZW50cyxcbiAgICAgICAgICAgIC8vIGNvbW1pdCB0aGVtIG5vdy5cbiAgICAgICAgICAgIGF3YWl0IGluZGV4TWFuYWdlci5jb21taXRMaXZlRXZlbnRzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFRoZSBSb29tLnRpbWVsaW5lIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogVGhpcyBsaXN0ZW5lciB3YWl0cyBmb3IgbGl2ZSBldmVudHMgaW4gZW5jcnlwdGVkIHJvb21zLCBpZiB0aGV5IGFyZVxuICAgICAqIGRlY3J5cHRlZCBvciB1bmVuY3J5cHRlZCB3ZSBxdWV1ZSB0aGVtIHRvIGJlIGFkZGVkIHRvIHRoZSBpbmRleCxcbiAgICAgKiBvdGhlcndpc2Ugd2Ugc2F2ZSB0aGVpciBldmVudCBpZCBhbmQgd2FpdCBmb3IgdGhlbSBpbiB0aGUgRXZlbnQuZGVjcnlwdGVkXG4gICAgICogbGlzdGVuZXIuXG4gICAgICovXG4gICAgb25Sb29tVGltZWxpbmUgPSBhc3luYyAoZXYsIHJvb20sIHRvU3RhcnRPZlRpbWVsaW5lLCByZW1vdmVkLCBkYXRhKSA9PiB7XG4gICAgICAgIC8vIFdlIG9ubHkgaW5kZXggZW5jcnlwdGVkIHJvb21zIGxvY2FsbHkuXG4gICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzUm9vbUVuY3J5cHRlZChyb29tLnJvb21JZCkpIHJldHVybjtcblxuICAgICAgICAvLyBJZiBpdCBpc24ndCBhIGxpdmUgZXZlbnQgb3IgaWYgaXQncyByZWRhY3RlZCB0aGVyZSdzIG5vdGhpbmcgdG9cbiAgICAgICAgLy8gZG8uXG4gICAgICAgIGlmICh0b1N0YXJ0T2ZUaW1lbGluZSB8fCAhZGF0YSB8fCAhZGF0YS5saXZlRXZlbnRcbiAgICAgICAgICAgIHx8IGV2LmlzUmVkYWN0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGV2ZW50IGlzIG5vdCB5ZXQgZGVjcnlwdGVkIG1hcmsgaXQgZm9yIHRoZVxuICAgICAgICAvLyBFdmVudC5kZWNyeXB0ZWQgY2FsbGJhY2suXG4gICAgICAgIGlmIChldi5pc0JlaW5nRGVjcnlwdGVkKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50SWQgPSBldi5nZXRJZCgpO1xuICAgICAgICAgICAgdGhpcy5saXZlRXZlbnRzRm9ySW5kZXguYWRkKGV2ZW50SWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGV2ZW50IGlzIGRlY3J5cHRlZCBvciBpcyB1bmVuY3J5cHRlZCBhZGQgaXQgdG8gdGhlXG4gICAgICAgICAgICAvLyBpbmRleCBub3cuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFkZExpdmVFdmVudFRvSW5kZXgoZXYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBUaGUgRXZlbnQuZGVjcnlwdGVkIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBldmVudCB3YXMgbWFya2VkIGZvciBhZGRpdGlvbiBpbiB0aGUgUm9vbS50aW1lbGluZVxuICAgICAqIGxpc3RlbmVyLCBpZiBzbyBxdWV1ZXMgaXQgdXAgdG8gYmUgYWRkZWQgdG8gdGhlIGluZGV4LlxuICAgICAqL1xuICAgIG9uRXZlbnREZWNyeXB0ZWQgPSBhc3luYyAoZXYsIGVycikgPT4ge1xuICAgICAgICBjb25zdCBldmVudElkID0gZXYuZ2V0SWQoKTtcblxuICAgICAgICAvLyBJZiB0aGUgZXZlbnQgaXNuJ3QgaW4gb3VyIGxpdmUgZXZlbnQgc2V0LCBpZ25vcmUgaXQuXG4gICAgICAgIGlmICghdGhpcy5saXZlRXZlbnRzRm9ySW5kZXguZGVsZXRlKGV2ZW50SWQpKSByZXR1cm47XG4gICAgICAgIGlmIChlcnIpIHJldHVybjtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRMaXZlRXZlbnRUb0luZGV4KGV2KTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFRoZSBSb29tLnJlZGFjdGlvbiBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIFJlbW92ZXMgYSByZWRhY3RlZCBldmVudCBmcm9tIG91ciBldmVudCBpbmRleC5cbiAgICAgKi9cbiAgICBvblJlZGFjdGlvbiA9IGFzeW5jIChldiwgcm9vbSkgPT4ge1xuICAgICAgICAvLyBXZSBvbmx5IGluZGV4IGVuY3J5cHRlZCByb29tcyBsb2NhbGx5LlxuICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5pc1Jvb21FbmNyeXB0ZWQocm9vbS5yb29tSWQpKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGluZGV4TWFuYWdlciA9IFBsYXRmb3JtUGVnLmdldCgpLmdldEV2ZW50SW5kZXhpbmdNYW5hZ2VyKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGluZGV4TWFuYWdlci5kZWxldGVFdmVudChldi5nZXRBc3NvY2lhdGVkSWQoKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogRXJyb3IgZGVsZXRpbmcgZXZlbnQgZnJvbSBpbmRleFwiLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qXG4gICAgICogVGhlIFJvb20udGltZWxpbmVSZXNldCBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIExpc3RlbnMgZm9yIHRpbWVsaW5lIHJlc2V0cyB0aGF0IGFyZSBjYXVzZWQgYnkgYSBsaW1pdGVkIHRpbWVsaW5lIHRvXG4gICAgICogcmUtYWRkIGNoZWNrcG9pbnRzIGZvciByb29tcyB0aGF0IG5lZWQgdG8gYmUgY3Jhd2xlZCBhZ2Fpbi5cbiAgICAgKi9cbiAgICBvblRpbWVsaW5lUmVzZXQgPSBhc3luYyAocm9vbSwgdGltZWxpbmVTZXQsIHJlc2V0QWxsVGltZWxpbmVzKSA9PiB7XG4gICAgICAgIGlmIChyb29tID09PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgaW5kZXhNYW5hZ2VyID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKTtcbiAgICAgICAgaWYgKCFNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNSb29tRW5jcnlwdGVkKHJvb20ucm9vbUlkKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRpbWVsaW5lID0gcm9vbS5nZXRMaXZlVGltZWxpbmUoKTtcbiAgICAgICAgY29uc3QgdG9rZW4gPSB0aW1lbGluZS5nZXRQYWdpbmF0aW9uVG9rZW4oXCJiXCIpO1xuXG4gICAgICAgIGNvbnN0IGJhY2t3YXJkc0NoZWNrcG9pbnQgPSB7XG4gICAgICAgICAgICByb29tSWQ6IHJvb20ucm9vbUlkLFxuICAgICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgZnVsbENyYXdsOiBmYWxzZSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogXCJiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBBZGRlZCBjaGVja3BvaW50IGJlY2F1c2Ugb2YgYSBsaW1pdGVkIHRpbWVsaW5lXCIsXG4gICAgICAgICAgICBiYWNrd2FyZHNDaGVja3BvaW50KTtcblxuICAgICAgICBhd2FpdCBpbmRleE1hbmFnZXIuYWRkQ3Jhd2xlckNoZWNrcG9pbnQoYmFja3dhcmRzQ2hlY2twb2ludCk7XG5cbiAgICAgICAgdGhpcy5jcmF3bGVyQ2hlY2twb2ludHMucHVzaChiYWNrd2FyZHNDaGVja3BvaW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhbiBldmVudCBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIGV2ZW50IGluZGV4LlxuICAgICAqXG4gICAgICogTW9zdCBub3RhYmx5IHdlIGZpbHRlciBldmVudHMgZm9yIHdoaWNoIGRlY3J5cHRpb24gZmFpbGVkLCBhcmUgcmVkYWN0ZWRcbiAgICAgKiBvciBhcmVuJ3Qgb2YgYSB0eXBlIHRoYXQgd2Uga25vdyBob3cgdG8gaW5kZXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01hdHJpeEV2ZW50fSBldiBUaGUgZXZlbnQgdGhhdCBzaG91bGQgY2hlY2tlZC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbH0gUmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBjYW4gYmUgaW5kZXhlZCwgZmFsc2VcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNWYWxpZEV2ZW50KGV2KSB7XG4gICAgICAgIGNvbnN0IGlzVXNlZnVsVHlwZSA9IFtcIm0ucm9vbS5tZXNzYWdlXCIsIFwibS5yb29tLm5hbWVcIiwgXCJtLnJvb20udG9waWNcIl0uaW5jbHVkZXMoZXYuZ2V0VHlwZSgpKTtcbiAgICAgICAgY29uc3QgdmFsaWRFdmVudFR5cGUgPSBpc1VzZWZ1bFR5cGUgJiYgIWV2LmlzUmVkYWN0ZWQoKSAmJiAhZXYuaXNEZWNyeXB0aW9uRmFpbHVyZSgpO1xuXG4gICAgICAgIGxldCB2YWxpZE1zZ1R5cGUgPSB0cnVlO1xuICAgICAgICBsZXQgaGFzQ29udGVudFZhbHVlID0gdHJ1ZTtcblxuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpID09PSBcIm0ucm9vbS5tZXNzYWdlXCIgJiYgIWV2LmlzUmVkYWN0ZWQoKSkge1xuICAgICAgICAgICAgLy8gRXhwYW5kIHRoaXMgaWYgdGhlcmUgYXJlIG1vcmUgaW52YWxpZCBtc2d0eXBlcy5cbiAgICAgICAgICAgIGNvbnN0IG1zZ3R5cGUgPSBldi5nZXRDb250ZW50KCkubXNndHlwZTtcblxuICAgICAgICAgICAgaWYgKCFtc2d0eXBlKSB2YWxpZE1zZ1R5cGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGVsc2UgdmFsaWRNc2dUeXBlID0gIW1zZ3R5cGUuc3RhcnRzV2l0aChcIm0ua2V5LnZlcmlmaWNhdGlvblwiKTtcblxuICAgICAgICAgICAgaWYgKCFldi5nZXRDb250ZW50KCkuYm9keSkgaGFzQ29udGVudFZhbHVlID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoZXYuZ2V0VHlwZSgpID09PSBcIm0ucm9vbS50b3BpY1wiICYmICFldi5pc1JlZGFjdGVkKCkpIHtcbiAgICAgICAgICAgIGlmICghZXYuZ2V0Q29udGVudCgpLnRvcGljKSBoYXNDb250ZW50VmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLm5hbWVcIiAmJiAhZXYuaXNSZWRhY3RlZCgpKSB7XG4gICAgICAgICAgICBpZiAoIWV2LmdldENvbnRlbnQoKS5uYW1lKSBoYXNDb250ZW50VmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWxpZEV2ZW50VHlwZSAmJiB2YWxpZE1zZ1R5cGUgJiYgaGFzQ29udGVudFZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXVlIHVwIGxpdmUgZXZlbnRzIHRvIGJlIGFkZGVkIHRvIHRoZSBldmVudCBpbmRleC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TWF0cml4RXZlbnR9IGV2IFRoZSBldmVudCB0aGF0IHNob3VsZCBiZSBhZGRlZCB0byB0aGUgaW5kZXguXG4gICAgICovXG4gICAgYXN5bmMgYWRkTGl2ZUV2ZW50VG9JbmRleChldikge1xuICAgICAgICBjb25zdCBpbmRleE1hbmFnZXIgPSBQbGF0Zm9ybVBlZy5nZXQoKS5nZXRFdmVudEluZGV4aW5nTWFuYWdlcigpO1xuXG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkRXZlbnQoZXYpKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QganNvbkV2ZW50ID0gZXYudG9KU09OKCk7XG4gICAgICAgIGNvbnN0IGUgPSBldi5pc0VuY3J5cHRlZCgpID8ganNvbkV2ZW50LmRlY3J5cHRlZCA6IGpzb25FdmVudDtcblxuICAgICAgICBjb25zdCBwcm9maWxlID0ge1xuICAgICAgICAgICAgZGlzcGxheW5hbWU6IGV2LnNlbmRlci5yYXdEaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIGF2YXRhcl91cmw6IGV2LnNlbmRlci5nZXRNeGNBdmF0YXJVcmwoKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpbmRleE1hbmFnZXIuYWRkRXZlbnRUb0luZGV4KGUsIHByb2ZpbGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtbWl0IHRoYXQgdGhlIGNyYXdsZXIgaGFzIGNoYW5nZWQgdGhlIGNoZWNrcG9pbnQgdGhhdCBpdCdzIGN1cnJlbnRseVxuICAgICAqIGhhbmRsaW5nLlxuICAgICAqL1xuICAgIGVtaXROZXdDaGVja3BvaW50KCkge1xuICAgICAgICB0aGlzLmVtaXQoXCJjaGFuZ2VkQ2hlY2twb2ludFwiLCB0aGlzLmN1cnJlbnRSb29tKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYWluIGNyYXdsZXIgbG9vcC5cbiAgICAgKlxuICAgICAqIEdvZXMgdGhyb3VnaCBjcmF3bGVyQ2hlY2twb2ludHMgYW5kIGZldGNoZXMgZXZlbnRzIGZyb20gdGhlIHNlcnZlciB0byBiZVxuICAgICAqIGFkZGVkIHRvIHRoZSBFdmVudEluZGV4LlxuICAgICAqXG4gICAgICogSWYgYSAvcm9vbS97cm9vbUlkfS9tZXNzYWdlcyByZXF1ZXN0IGRvZXNuJ3QgY29udGFpbiBhbnkgZXZlbnRzLCBzdG9wIHRoZVxuICAgICAqIGNyYXdsLCBvdGhlcndpc2UgY3JlYXRlIGEgbmV3IGNoZWNrcG9pbnQgYW5kIHB1c2ggaXQgdG8gdGhlXG4gICAgICogY3Jhd2xlckNoZWNrcG9pbnRzIHF1ZXVlIHNvIHdlIGdvIHRocm91Z2ggdGhlbSBpbiBhIHJvdW5kLXJvYmluIHdheS5cbiAgICAgKi9cbiAgICBhc3luYyBjcmF3bGVyRnVuYygpIHtcbiAgICAgICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgaW5kZXhNYW5hZ2VyID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKTtcblxuICAgICAgICB0aGlzLl9jcmF3bGVyID0ge307XG5cbiAgICAgICAgdGhpcy5fY3Jhd2xlci5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBpZGxlID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKCFjYW5jZWxsZWQpIHtcbiAgICAgICAgICAgIGxldCBzbGVlcFRpbWUgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlQXQoU2V0dGluZ0xldmVsLkRFVklDRSwgJ2NyYXdsZXJTbGVlcFRpbWUnKTtcblxuICAgICAgICAgICAgLy8gRG9uJ3QgbGV0IHRoZSB1c2VyIGNvbmZpZ3VyZSBhIGxvd2VyIHNsZWVwIHRpbWUgdGhhbiAxMDAgbXMuXG4gICAgICAgICAgICBzbGVlcFRpbWUgPSBNYXRoLm1heChzbGVlcFRpbWUsIDEwMCk7XG5cbiAgICAgICAgICAgIGlmIChpZGxlKSB7XG4gICAgICAgICAgICAgICAgc2xlZXBUaW1lID0gdGhpcy5fY3Jhd2xlcklkbGVUaW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudENoZWNrcG9pbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50Q2hlY2twb2ludCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0TmV3Q2hlY2twb2ludCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCBzbGVlcChzbGVlcFRpbWUpO1xuXG4gICAgICAgICAgICBpZiAoY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNoZWNrcG9pbnQgPSB0aGlzLmNyYXdsZXJDaGVja3BvaW50cy5zaGlmdCgpO1xuXG4gICAgICAgICAgICAvLy8gVGhlcmUgaXMgbm8gY2hlY2twb2ludCBhdmFpbGFibGUgY3VycmVudGx5LCBvbmUgbWF5IGFwcGVhciBpZlxuICAgICAgICAgICAgLy8gYSBzeW5jIHdpdGggbGltaXRlZCByb29tIHRpbWVsaW5lcyBoYXBwZW5zLCBzbyBnbyBiYWNrIHRvIHNsZWVwLlxuICAgICAgICAgICAgaWYgKGNoZWNrcG9pbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGlkbGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50Q2hlY2twb2ludCA9IGNoZWNrcG9pbnQ7XG4gICAgICAgICAgICB0aGlzLmVtaXROZXdDaGVja3BvaW50KCk7XG5cbiAgICAgICAgICAgIGlkbGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIGNoZWNrcG9pbnQsIGxldCB1cyBmZXRjaCBzb21lIG1lc3NhZ2VzLCBhZ2FpbiwgdmVyeVxuICAgICAgICAgICAgLy8gY29uc2VydmF0aXZlbHkgdG8gbm90IGJvdGhlciBvdXIgaG9tZXNlcnZlciB0b28gbXVjaC5cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50TWFwcGVyID0gY2xpZW50LmdldEV2ZW50TWFwcGVyKHtwcmV2ZW50UmVFbWl0OiB0cnVlfSk7XG4gICAgICAgICAgICAvLyBUT0RPIHdlIG5lZWQgdG8gZW5zdXJlIHRvIHVzZSBtZW1iZXIgbGF6eSBsb2FkaW5nIHdpdGggdGhpc1xuICAgICAgICAgICAgLy8gcmVxdWVzdCBzbyB3ZSBnZXQgdGhlIGNvcnJlY3QgcHJvZmlsZXMuXG4gICAgICAgICAgICBsZXQgcmVzO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlcyA9IGF3YWl0IGNsaWVudC5fY3JlYXRlTWVzc2FnZXNSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICAgICBjaGVja3BvaW50LnJvb21JZCwgY2hlY2twb2ludC50b2tlbiwgdGhpcy5fZXZlbnRzUGVyQ3Jhd2wsXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrcG9pbnQuZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5odHRwU3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFdmVudEluZGV4OiBSZW1vdmluZyBjaGVja3BvaW50IGFzIHdlIGRvbid0IGhhdmUgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGVybWlzc2lvbnMgdG8gZmV0Y2ggbWVzc2FnZXMgZnJvbSB0aGlzIHJvb20uXCIsIGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaW5kZXhNYW5hZ2VyLnJlbW92ZUNyYXdsZXJDaGVja3BvaW50KGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IEVycm9yIHJlbW92aW5nIGNoZWNrcG9pbnRcIiwgY2hlY2twb2ludCwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBwdXNoIHRoZSBjaGVja3BvaW50IGhlcmUgYmFjaywgaXQgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaG9wZWZ1bGx5IGJlIHJlbW92ZWQgYWZ0ZXIgYSByZXN0YXJ0LiBCdXQgbGV0IHVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmUgaXQgZm9yIG5vdyBhcyB3ZSBkb24ndCB3YW50IHRvIGhhbW1lciB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuZHBvaW50LlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogRXJyb3IgY3Jhd2xpbmcgZXZlbnRzOlwiLCBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyYXdsZXJDaGVja3BvaW50cy5wdXNoKGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmF3bGVyQ2hlY2twb2ludHMucHVzaChjaGVja3BvaW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcy5jaHVuay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IERvbmUgd2l0aCB0aGUgY2hlY2twb2ludFwiLCBjaGVja3BvaW50KTtcbiAgICAgICAgICAgICAgICAvLyBXZSBnb3QgdG8gdGhlIHN0YXJ0L2VuZCBvZiBvdXIgdGltZWxpbmUsIGxldHMganVzdFxuICAgICAgICAgICAgICAgIC8vIGRlbGV0ZSBvdXIgY2hlY2twb2ludCBhbmQgZ28gYmFjayB0byBzbGVlcC5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbmRleE1hbmFnZXIucmVtb3ZlQ3Jhd2xlckNoZWNrcG9pbnQoY2hlY2twb2ludCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IEVycm9yIHJlbW92aW5nIGNoZWNrcG9pbnRcIiwgY2hlY2twb2ludCwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwbGFpbiBKU09OIGV2ZW50cyBpbnRvIE1hdHJpeCBldmVudHMgc28gdGhleSBnZXRcbiAgICAgICAgICAgIC8vIGRlY3J5cHRlZCBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAgICBjb25zdCBtYXRyaXhFdmVudHMgPSByZXMuY2h1bmsubWFwKGV2ZW50TWFwcGVyKTtcbiAgICAgICAgICAgIGxldCBzdGF0ZUV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgaWYgKHJlcy5zdGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVFdmVudHMgPSByZXMuc3RhdGUubWFwKGV2ZW50TWFwcGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcHJvZmlsZXMgPSB7fTtcblxuICAgICAgICAgICAgc3RhdGVFdmVudHMuZm9yRWFjaChldiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2LmV2ZW50LmNvbnRlbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgZXYuZXZlbnQuY29udGVudC5tZW1iZXJzaGlwID09PSBcImpvaW5cIikge1xuICAgICAgICAgICAgICAgICAgICBwcm9maWxlc1tldi5ldmVudC5zZW5kZXJdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheW5hbWU6IGV2LmV2ZW50LmNvbnRlbnQuZGlzcGxheW5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJfdXJsOiBldi5ldmVudC5jb250ZW50LmF2YXRhcl91cmwsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlY3J5cHRpb25Qcm9taXNlcyA9IFtdO1xuXG4gICAgICAgICAgICBtYXRyaXhFdmVudHMuZm9yRWFjaChldiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2LmlzQmVpbmdEZWNyeXB0ZWQoKSB8fCBldi5pc0RlY3J5cHRpb25GYWlsdXJlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyB0aGUgZGVjcnlwdGlvbiBwcm9taXNlIGlzIGEgcHJpdmF0ZSBwcm9wZXJ0eSwgdGhpc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgZWl0aGVyIGJlIG1hZGUgcHVibGljIG9yIHdlIHNob3VsZCBjb252ZXJ0IHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBldmVudCB0aGF0IGdldHMgZmlyZWQgd2hlbiBkZWNyeXB0aW9uIGlzIGRvbmUgaW50byBhXG4gICAgICAgICAgICAgICAgICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIG9uY2UgZXZlbnQgZW1pdHRlciBtZXRob2Q6XG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZXZlbnRzX2V2ZW50c19vbmNlX2VtaXR0ZXJfbmFtZVxuICAgICAgICAgICAgICAgICAgICBkZWNyeXB0aW9uUHJvbWlzZXMucHVzaChldi5fZGVjcnlwdGlvblByb21pc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBMZXQgdXMgd2FpdCBmb3IgYWxsIHRoZSBldmVudHMgdG8gZ2V0IGRlY3J5cHRlZC5cbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGRlY3J5cHRpb25Qcm9taXNlcyk7XG5cbiAgICAgICAgICAgIC8vIFRPRE8gaWYgdGhlcmUgYXJlIG5vIGV2ZW50cyBhdCB0aGlzIHBvaW50IHdlJ3JlIG1pc3NpbmcgYSBsb3RcbiAgICAgICAgICAgIC8vIGRlY3J5cHRpb24ga2V5cywgZG8gd2Ugd2FudCB0byByZXRyeSB0aGlzIGNoZWNrcG9pbnQgYXQgYSBsYXRlclxuICAgICAgICAgICAgLy8gc3RhZ2U/XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJlZEV2ZW50cyA9IG1hdHJpeEV2ZW50cy5maWx0ZXIodGhpcy5pc1ZhbGlkRXZlbnQpO1xuXG4gICAgICAgICAgICAvLyBDb2xsZWN0IHRoZSByZWRhY3Rpb24gZXZlbnRzIHNvIHdlIGNhbiBkZWxldGUgdGhlIHJlZGFjdGVkIGV2ZW50c1xuICAgICAgICAgICAgLy8gZnJvbSB0aGUgaW5kZXguXG4gICAgICAgICAgICBjb25zdCByZWRhY3Rpb25FdmVudHMgPSBtYXRyaXhFdmVudHMuZmlsdGVyKChldikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLnJlZGFjdGlvblwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIExldCB1cyBjb252ZXJ0IHRoZSBldmVudHMgYmFjayBpbnRvIGEgZm9ybWF0IHRoYXQgRXZlbnRJbmRleCBjYW5cbiAgICAgICAgICAgIC8vIGNvbnN1bWUuXG4gICAgICAgICAgICBjb25zdCBldmVudHMgPSBmaWx0ZXJlZEV2ZW50cy5tYXAoKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QganNvbkV2ZW50ID0gZXYudG9KU09OKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IGV2LmlzRW5jcnlwdGVkKCkgPyBqc29uRXZlbnQuZGVjcnlwdGVkIDoganNvbkV2ZW50O1xuXG4gICAgICAgICAgICAgICAgbGV0IHByb2ZpbGUgPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAoZS5zZW5kZXIgaW4gcHJvZmlsZXMpIHByb2ZpbGUgPSBwcm9maWxlc1tlLnNlbmRlcl07XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICBldmVudDogZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZTogcHJvZmlsZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGNoZWNrcG9pbnQgc28gd2UgY2FuIGNvbnRpbnVlIGNyYXdsaW5nIHRoZSByb29tIGZvclxuICAgICAgICAgICAgLy8gbWVzc2FnZXMuXG4gICAgICAgICAgICBjb25zdCBuZXdDaGVja3BvaW50ID0ge1xuICAgICAgICAgICAgICAgIHJvb21JZDogY2hlY2twb2ludC5yb29tSWQsXG4gICAgICAgICAgICAgICAgdG9rZW46IHJlcy5lbmQsXG4gICAgICAgICAgICAgICAgZnVsbENyYXdsOiBjaGVja3BvaW50LmZ1bGxDcmF3bCxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGNoZWNrcG9pbnQuZGlyZWN0aW9uLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZGFjdGlvbkV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBldiA9IHJlZGFjdGlvbkV2ZW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaW5kZXhNYW5hZ2VyLmRlbGV0ZUV2ZW50KGV2LmdldEFzc29jaWF0ZWRJZCgpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldmVudHNBbHJlYWR5QWRkZWQgPSBhd2FpdCBpbmRleE1hbmFnZXIuYWRkSGlzdG9yaWNFdmVudHMoXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cywgbmV3Q2hlY2twb2ludCwgY2hlY2twb2ludCk7XG4gICAgICAgICAgICAgICAgLy8gSWYgYWxsIGV2ZW50cyB3ZXJlIGFscmVhZHkgaW5kZXhlZCB3ZSBhc3N1bWUgdGhhdCB3ZSBjYXRjaGVkXG4gICAgICAgICAgICAgICAgLy8gdXAgd2l0aCBvdXIgaW5kZXggYW5kIGRvbid0IG5lZWQgdG8gY3Jhd2wgdGhlIHJvb20gZnVydGhlci5cbiAgICAgICAgICAgICAgICAvLyBMZXQgdXMgZGVsZXRlIHRoZSBjaGVja3BvaW50IGluIHRoYXQgY2FzZSwgb3RoZXJ3aXNlIHB1c2hcbiAgICAgICAgICAgICAgICAvLyB0aGUgbmV3IGNoZWNrcG9pbnQgdG8gYmUgdXNlZCBieSB0aGUgY3Jhd2xlci5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzQWxyZWFkeUFkZGVkID09PSB0cnVlICYmIG5ld0NoZWNrcG9pbnQuZnVsbENyYXdsICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogQ2hlY2twb2ludCBoYWQgYWxyZWFkeSBhbGwgZXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRkZWQsIHN0b3BwaW5nIHRoZSBjcmF3bFwiLCBjaGVja3BvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaW5kZXhNYW5hZ2VyLnJlbW92ZUNyYXdsZXJDaGVja3BvaW50KG5ld0NoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudHNBbHJlYWR5QWRkZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogQ2hlY2twb2ludCBoYWQgYWxyZWFkeSBhbGwgZXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFkZGVkLCBidXQgY29udGludWluZyBkdWUgdG8gYSBmdWxsIGNyYXdsXCIsIGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3Jhd2xlckNoZWNrcG9pbnRzLnB1c2gobmV3Q2hlY2twb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogRXJyb3IgZHVycmluZyBhIGNyYXdsXCIsIGUpO1xuICAgICAgICAgICAgICAgIC8vIEFuIGVycm9yIG9jY3VycmVkLCBwdXQgdGhlIGNoZWNrcG9pbnQgYmFjayBzbyB3ZVxuICAgICAgICAgICAgICAgIC8vIGNhbiByZXRyeS5cbiAgICAgICAgICAgICAgICB0aGlzLmNyYXdsZXJDaGVja3BvaW50cy5wdXNoKGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY3Jhd2xlciA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgdGhlIGNyYXdsZXIgYmFja2dyb3VuZCB0YXNrLlxuICAgICAqL1xuICAgIHN0YXJ0Q3Jhd2xlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NyYXdsZXIgIT09IG51bGwpIHJldHVybjtcbiAgICAgICAgdGhpcy5jcmF3bGVyRnVuYygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3AgdGhlIGNyYXdsZXIgYmFja2dyb3VuZCB0YXNrLlxuICAgICAqL1xuICAgIHN0b3BDcmF3bGVyKCkge1xuICAgICAgICBpZiAodGhpcy5fY3Jhd2xlciA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9jcmF3bGVyLmNhbmNlbCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBldmVudCBpbmRleC5cbiAgICAgKlxuICAgICAqIFRoaXMgcmVtb3ZlcyBhbGwgdGhlIE1hdHJpeENsaWVudCBldmVudCBsaXN0ZW5lcnMsIHN0b3BzIHRoZSBjcmF3bGVyXG4gICAgICogdGFzaywgYW5kIGNsb3NlcyB0aGUgaW5kZXguXG4gICAgICovXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGluZGV4TWFuYWdlciA9IFBsYXRmb3JtUGVnLmdldCgpLmdldEV2ZW50SW5kZXhpbmdNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgIHRoaXMuc3RvcENyYXdsZXIoKTtcbiAgICAgICAgYXdhaXQgaW5kZXhNYW5hZ2VyLmNsb3NlRXZlbnRJbmRleCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoIHRoZSBldmVudCBpbmRleCB1c2luZyB0aGUgZ2l2ZW4gdGVybSBmb3IgbWF0Y2hpbmcgZXZlbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTZWFyY2hBcmdzfSBzZWFyY2hBcmdzIFRoZSBzZWFyY2ggY29uZmlndXJhdGlvbiBmb3IgdGhlIHNlYXJjaCxcbiAgICAgKiBzZXRzIHRoZSBzZWFyY2ggdGVybSBhbmQgZGV0ZXJtaW5lcyB0aGUgc2VhcmNoIHJlc3VsdCBjb250ZW50cy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8W1NlYXJjaFJlc3VsdF0+fSBBIHByb21pc2UgdGhhdCB3aWxsIHJlc29sdmUgdG8gYW4gYXJyYXlcbiAgICAgKiBvZiBzZWFyY2ggcmVzdWx0cyBvbmNlIHRoZSBzZWFyY2ggaXMgZG9uZS5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2goc2VhcmNoQXJncykge1xuICAgICAgICBjb25zdCBpbmRleE1hbmFnZXIgPSBQbGF0Zm9ybVBlZy5nZXQoKS5nZXRFdmVudEluZGV4aW5nTWFuYWdlcigpO1xuICAgICAgICByZXR1cm4gaW5kZXhNYW5hZ2VyLnNlYXJjaEV2ZW50SW5kZXgoc2VhcmNoQXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCBldmVudHMgdGhhdCBjb250YWluIFVSTHMgZnJvbSB0aGUgZXZlbnQgaW5kZXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1Jvb219IHJvb20gVGhlIHJvb20gZm9yIHdoaWNoIHdlIHNob3VsZCBmZXRjaCBldmVudHMgY29udGFpbmluZ1xuICAgICAqIFVSTHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCBUaGUgbWF4aW11bSBudW1iZXIgb2YgZXZlbnRzIHRvIGZldGNoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZyb21FdmVudCBGcm9tIHdoaWNoIGV2ZW50IHNob3VsZCB3ZSBjb250aW51ZSBmZXRjaGluZ1xuICAgICAqIGV2ZW50cyBmcm9tIHRoZSBpbmRleC4gVGhpcyBpcyBvbmx5IG5lZWRlZCBpZiB3ZSdyZSBjb250aW51aW5nIHRvIGZpbGxcbiAgICAgKiB0aGUgdGltZWxpbmUsIGUuZy4gaWYgd2UncmUgcGFnaW5hdGluZy4gVGhpcyBuZWVkcyB0byBiZSBzZXQgdG8gYSBldmVudFxuICAgICAqIGlkIG9mIGFuIGV2ZW50IHRoYXQgd2FzIHByZXZpb3VzbHkgZmV0Y2hlZCB3aXRoIHRoaXMgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uIFRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggd2Ugd2lsbCBjb250aW51ZVxuICAgICAqIGZldGNoaW5nIGV2ZW50cy4gRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMgdG8gY29udGludWUgZmV0Y2hpbmcgZXZlbnRzIHRoYXRcbiAgICAgKiBhcmUgb2xkZXIgdGhhbiB0aGUgZXZlbnQgZ2l2ZW4gaW4gZnJvbUV2ZW50LCBFdmVudFRpbWVsaW5lLkZPUldBUkRTIHRvXG4gICAgICogZmV0Y2ggbmV3ZXIgZXZlbnRzLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8TWF0cml4RXZlbnRbXT59IFJlc29sdmVzIHRvIGFuIGFycmF5IG9mIGV2ZW50cyB0aGF0XG4gICAgICogY29udGFpbiBVUkxzLlxuICAgICAqL1xuICAgIGFzeW5jIGxvYWRGaWxlRXZlbnRzKHJvb20sIGxpbWl0ID0gMTAsIGZyb21FdmVudCA9IG51bGwsIGRpcmVjdGlvbiA9IEV2ZW50VGltZWxpbmUuQkFDS1dBUkRTKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgaW5kZXhNYW5hZ2VyID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0RXZlbnRJbmRleGluZ01hbmFnZXIoKTtcblxuICAgICAgICBjb25zdCBsb2FkQXJncyA9IHtcbiAgICAgICAgICAgIHJvb21JZDogcm9vbS5yb29tSWQsXG4gICAgICAgICAgICBsaW1pdDogbGltaXQsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGZyb21FdmVudCkge1xuICAgICAgICAgICAgbG9hZEFyZ3MuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuICAgICAgICAgICAgbG9hZEFyZ3MuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGV2ZW50cztcblxuICAgICAgICAvLyBHZXQgb3VyIGV2ZW50cyBmcm9tIHRoZSBldmVudCBpbmRleC5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGV2ZW50cyA9IGF3YWl0IGluZGV4TWFuYWdlci5sb2FkRmlsZUV2ZW50cyhsb2FkQXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnRJbmRleDogRXJyb3IgZ2V0dGluZyBmaWxlIGV2ZW50c1wiLCBlKTtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV2ZW50TWFwcGVyID0gY2xpZW50LmdldEV2ZW50TWFwcGVyKCk7XG5cbiAgICAgICAgLy8gVHVybiB0aGUgZXZlbnRzIGludG8gTWF0cml4RXZlbnQgb2JqZWN0cy5cbiAgICAgICAgY29uc3QgbWF0cml4RXZlbnRzID0gZXZlbnRzLm1hcChlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdHJpeEV2ZW50ID0gZXZlbnRNYXBwZXIoZS5ldmVudCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IG5ldyBSb29tTWVtYmVyKHJvb20ucm9vbUlkLCBtYXRyaXhFdmVudC5nZXRTZW5kZXIoKSk7XG5cbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHJlYWxseSByZWNvbnN0cnVjdCB0aGUgd2hvbGUgcm9vbSBzdGF0ZSBmcm9tIG91clxuICAgICAgICAgICAgLy8gRXZlbnRJbmRleCB0byBjYWxjdWxhdGUgdGhlIGNvcnJlY3QgZGlzcGxheSBuYW1lLiBVc2UgdGhlXG4gICAgICAgICAgICAvLyBkaXNhbWJpZ3VhdGVkIGZvcm0gYWx3YXlzIGluc3RlYWQuXG4gICAgICAgICAgICBtZW1iZXIubmFtZSA9IGUucHJvZmlsZS5kaXNwbGF5bmFtZSArIFwiIChcIiArIG1hdHJpeEV2ZW50LmdldFNlbmRlcigpICsgXCIpXCI7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgc2V0cyB0aGUgYXZhdGFyIFVSTC5cbiAgICAgICAgICAgIGNvbnN0IG1lbWJlckV2ZW50ID0gZXZlbnRNYXBwZXIoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1iZXJzaGlwOiBcImpvaW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YXRhcl91cmw6IGUucHJvZmlsZS5hdmF0YXJfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheW5hbWU6IGUucHJvZmlsZS5kaXNwbGF5bmFtZSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJtLnJvb20ubWVtYmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50X2lkOiBtYXRyaXhFdmVudC5nZXRJZCgpICsgXCI6ZXZlbnRJbmRleFwiLFxuICAgICAgICAgICAgICAgICAgICByb29tX2lkOiBtYXRyaXhFdmVudC5nZXRSb29tSWQoKSxcbiAgICAgICAgICAgICAgICAgICAgc2VuZGVyOiBtYXRyaXhFdmVudC5nZXRTZW5kZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luX3NlcnZlcl90czogbWF0cml4RXZlbnQuZ2V0VHMoKSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVfa2V5OiBtYXRyaXhFdmVudC5nZXRTZW5kZXIoKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gV2Ugc2V0IHRoaXMgbWFudWFsbHkgdG8gYXZvaWQgZW1pdHRpbmcgUm9vbU1lbWJlci5tZW1iZXJzaGlwIGFuZFxuICAgICAgICAgICAgLy8gUm9vbU1lbWJlci5uYW1lIGV2ZW50cy5cbiAgICAgICAgICAgIG1lbWJlci5ldmVudHMubWVtYmVyID0gbWVtYmVyRXZlbnQ7XG4gICAgICAgICAgICBtYXRyaXhFdmVudC5zZW5kZXIgPSBtZW1iZXI7XG5cbiAgICAgICAgICAgIHJldHVybiBtYXRyaXhFdmVudDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG1hdHJpeEV2ZW50cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaWxsIGEgdGltZWxpbmUgd2l0aCBldmVudHMgdGhhdCBjb250YWluIFVSTHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RpbWVsaW5lU2V0fSB0aW1lbGluZVNldCBUaGUgVGltZWxpbmVTZXQgdGhlIFRpbWVsaW5lIGJlbG9uZ3MgdG8sXG4gICAgICogdXNlZCB0byBjaGVjayBpZiB3ZSdyZSBhZGRpbmcgZHVwbGljYXRlIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VGltZWxpbmV9IHRpbWVsaW5lIFRoZSBUaW1lbGluZSB3aGljaCBzaG91bGQgYmUgZmlsZWQgd2l0aFxuICAgICAqIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Um9vbX0gcm9vbSBUaGUgcm9vbSBmb3Igd2hpY2ggd2Ugc2hvdWxkIGZldGNoIGV2ZW50cyBjb250YWluaW5nXG4gICAgICogVVJMc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IFRoZSBtYXhpbXVtIG51bWJlciBvZiBldmVudHMgdG8gZmV0Y2guXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZnJvbUV2ZW50IEZyb20gd2hpY2ggZXZlbnQgc2hvdWxkIHdlIGNvbnRpbnVlIGZldGNoaW5nXG4gICAgICogZXZlbnRzIGZyb20gdGhlIGluZGV4LiBUaGlzIGlzIG9ubHkgbmVlZGVkIGlmIHdlJ3JlIGNvbnRpbnVpbmcgdG8gZmlsbFxuICAgICAqIHRoZSB0aW1lbGluZSwgZS5nLiBpZiB3ZSdyZSBwYWdpbmF0aW5nLiBUaGlzIG5lZWRzIHRvIGJlIHNldCB0byBhIGV2ZW50XG4gICAgICogaWQgb2YgYW4gZXZlbnQgdGhhdCB3YXMgcHJldmlvdXNseSBmZXRjaGVkIHdpdGggdGhpcyBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSB3aWxsIGNvbnRpbnVlXG4gICAgICogZmV0Y2hpbmcgZXZlbnRzLiBFdmVudFRpbWVsaW5lLkJBQ0tXQVJEUyB0byBjb250aW51ZSBmZXRjaGluZyBldmVudHMgdGhhdFxuICAgICAqIGFyZSBvbGRlciB0aGFuIHRoZSBldmVudCBnaXZlbiBpbiBmcm9tRXZlbnQsIEV2ZW50VGltZWxpbmUuRk9SV0FSRFMgdG9cbiAgICAgKiBmZXRjaCBuZXdlciBldmVudHMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn0gUmVzb2x2ZXMgdG8gdHJ1ZSBpZiBldmVudHMgd2VyZSBhZGRlZCB0byB0aGVcbiAgICAgKiB0aW1lbGluZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGFzeW5jIHBvcHVsYXRlRmlsZVRpbWVsaW5lKHRpbWVsaW5lU2V0LCB0aW1lbGluZSwgcm9vbSwgbGltaXQgPSAxMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tRXZlbnQgPSBudWxsLCBkaXJlY3Rpb24gPSBFdmVudFRpbWVsaW5lLkJBQ0tXQVJEUykge1xuICAgICAgICBjb25zdCBtYXRyaXhFdmVudHMgPSBhd2FpdCB0aGlzLmxvYWRGaWxlRXZlbnRzKHJvb20sIGxpbWl0LCBmcm9tRXZlbnQsIGRpcmVjdGlvbik7XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhIG5vcm1hbCBmaWxsIHJlcXVlc3QsIG5vdCBhIHBhZ2luYXRpb24gcmVxdWVzdCwgd2UgbmVlZFxuICAgICAgICAvLyB0byBnZXQgb3VyIGV2ZW50cyBpbiB0aGUgQkFDS1dBUkRTIGRpcmVjdGlvbiBidXQgcG9wdWxhdGUgdGhlbSBpbiB0aGVcbiAgICAgICAgLy8gZm9yd2FyZHMgZGlyZWN0aW9uLlxuICAgICAgICAvLyBUaGlzIG5lZWRzIHRvIGhhcHBlbiBiZWNhdXNlIGEgZmlsbCByZXF1ZXN0IG1pZ2h0IGNvbWUgd2l0aCBhblxuICAgICAgICAvLyBleGlzaXRuZyB0aW1lbGluZSBlLmcuIGlmIHlvdSBjbG9zZSBhbmQgcmUtb3BlbiB0aGUgRmlsZVBhbmVsLlxuICAgICAgICBpZiAoZnJvbUV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICBtYXRyaXhFdmVudHMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgZGlyZWN0aW9uID0gZGlyZWN0aW9uID09IEV2ZW50VGltZWxpbmUuQkFDS1dBUkRTID8gRXZlbnRUaW1lbGluZS5GT1JXQVJEUzogRXZlbnRUaW1lbGluZS5CQUNLV0FSRFM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGV2ZW50cyB0byB0aGUgdGltZWxpbmUgb2YgdGhlIGZpbGUgcGFuZWwuXG4gICAgICAgIG1hdHJpeEV2ZW50cy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aW1lbGluZVNldC5ldmVudElkVG9UaW1lbGluZShlLmdldElkKCkpKSB7XG4gICAgICAgICAgICAgICAgdGltZWxpbmVTZXQuYWRkRXZlbnRUb1RpbWVsaW5lKGUsIHRpbWVsaW5lLCBkaXJlY3Rpb24gPT0gRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcmV0ID0gZmFsc2U7XG4gICAgICAgIGxldCBwYWdpbmF0aW9uVG9rZW4gPSBcIlwiO1xuXG4gICAgICAgIC8vIFNldCB0aGUgcGFnaW5hdGlvbiB0b2tlbiB0byB0aGUgb2xkZXN0IGV2ZW50IHRoYXQgd2UgcmV0cmlldmVkLlxuICAgICAgICBpZiAobWF0cml4RXZlbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHBhZ2luYXRpb25Ub2tlbiA9IG1hdHJpeEV2ZW50c1ttYXRyaXhFdmVudHMubGVuZ3RoIC0gMV0uZ2V0SWQoKTtcbiAgICAgICAgICAgIHJldCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhcIkV2ZW50SW5kZXg6IFBvcHVsYXRpbmcgZmlsZSBwYW5lbCB3aXRoXCIsIG1hdHJpeEV2ZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIFwiZXZlbnRzIGFuZCBzZXR0aW5nIHRoZSBwYWdpbmF0aW9uIHRva2VuIHRvXCIsIHBhZ2luYXRpb25Ub2tlbik7XG5cbiAgICAgICAgdGltZWxpbmUuc2V0UGFnaW5hdGlvblRva2VuKHBhZ2luYXRpb25Ub2tlbiwgRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtdWxhdGUgYSBUaW1lbGluZVdpbmRvdyBwYWdpbmF0aW9uKCkgcmVxdWVzdCB3aXRoIHRoZSBldmVudCBpbmRleCBhcyB0aGUgZXZlbnQgc291cmNlXG4gICAgICpcbiAgICAgKiBNaWdodCBub3QgZmV0Y2ggZXZlbnRzIGZyb20gdGhlIGluZGV4IGlmIHRoZSB0aW1lbGluZSBhbHJlYWR5IGNvbnRhaW5zXG4gICAgICogZXZlbnRzIHRoYXQgdGhlIHdpbmRvdyBpc24ndCBzaG93aW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSb29tfSByb29tIFRoZSByb29tIGZvciB3aGljaCB3ZSBzaG91bGQgZmV0Y2ggZXZlbnRzIGNvbnRhaW5pbmdcbiAgICAgKiBVUkxzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1RpbWVsaW5lV2luZG93fSB0aW1lbGluZVdpbmRvdyBUaGUgdGltZWxpbmUgd2luZG93IHRoYXQgc2hvdWxkIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggbmV3IGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBzaG91bGQgcGFnaW5hdGUuXG4gICAgICogRXZlbnRUaW1lbGluZS5CQUNLV0FSRFMgdG8gcGFnaW5hdGUgYmFjaywgRXZlbnRUaW1lbGluZS5GT1JXQVJEUyB0b1xuICAgICAqIHBhZ2luYXRlIGZvcndhcmRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IFRoZSBtYXhpbXVtIG51bWJlciBvZiBldmVudHMgdG8gZmV0Y2ggd2hpbGVcbiAgICAgKiBwYWdpbmF0aW5nLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IFJlc29sdmVzIHRvIGEgYm9vbGVhbiB3aGljaCBpcyB0cnVlIGlmIG1vcmVcbiAgICAgKiBldmVudHMgd2VyZSBzdWNjZXNzZnVsbHkgcmV0cmlldmVkLlxuICAgICAqL1xuICAgIHBhZ2luYXRlVGltZWxpbmVXaW5kb3cocm9vbSwgdGltZWxpbmVXaW5kb3csIGRpcmVjdGlvbiwgbGltaXQpIHtcbiAgICAgICAgY29uc3QgdGwgPSB0aW1lbGluZVdpbmRvdy5nZXRUaW1lbGluZUluZGV4KGRpcmVjdGlvbik7XG5cbiAgICAgICAgaWYgKCF0bCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIGlmICh0bC5wZW5kaW5nUGFnaW5hdGUpIHJldHVybiB0bC5wZW5kaW5nUGFnaW5hdGU7XG5cbiAgICAgICAgaWYgKHRpbWVsaW5lV2luZG93LmV4dGVuZChkaXJlY3Rpb24sIGxpbWl0KSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhZ2luYXRpb25NZXRob2QgPSBhc3luYyAodGltZWxpbmVXaW5kb3csIHRpbWVsaW5lLCByb29tLCBkaXJlY3Rpb24sIGxpbWl0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZVNldCA9IHRpbWVsaW5lV2luZG93Ll90aW1lbGluZVNldDtcbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gdGltZWxpbmUudGltZWxpbmUuZ2V0UGFnaW5hdGlvblRva2VuKGRpcmVjdGlvbik7XG5cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRoaXMucG9wdWxhdGVGaWxlVGltZWxpbmUodGltZWxpbmVTZXQsIHRpbWVsaW5lLnRpbWVsaW5lLCByb29tLCBsaW1pdCwgdG9rZW4sIGRpcmVjdGlvbik7XG5cbiAgICAgICAgICAgIHRpbWVsaW5lLnBlbmRpbmdQYWdpbmF0ZSA9IG51bGw7XG4gICAgICAgICAgICB0aW1lbGluZVdpbmRvdy5leHRlbmQoZGlyZWN0aW9uLCBsaW1pdCk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcGFnaW5hdGlvblByb21pc2UgPSBwYWdpbmF0aW9uTWV0aG9kKHRpbWVsaW5lV2luZG93LCB0bCwgcm9vbSwgZGlyZWN0aW9uLCBsaW1pdCk7XG4gICAgICAgIHRsLnBlbmRpbmdQYWdpbmF0ZSA9IHBhZ2luYXRpb25Qcm9taXNlO1xuXG4gICAgICAgIHJldHVybiBwYWdpbmF0aW9uUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgc3RhdGlzdGljYWwgaW5mb3JtYXRpb24gb2YgdGhlIGluZGV4LlxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxJbmRleFN0YXRzPn0gQSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlIHRvIHRoZSBpbmRleFxuICAgICAqIHN0YXRpc3RpY3MuXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U3RhdHMoKSB7XG4gICAgICAgIGNvbnN0IGluZGV4TWFuYWdlciA9IFBsYXRmb3JtUGVnLmdldCgpLmdldEV2ZW50SW5kZXhpbmdNYW5hZ2VyKCk7XG4gICAgICAgIHJldHVybiBpbmRleE1hbmFnZXIuZ2V0U3RhdHMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHJvb20gdGhhdCB3ZSBhcmUgY3VycmVudGx5IGNyYXdsaW5nLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Jvb219IEEgTWF0cml4Um9vbSB0aGF0IGlzIGJlaW5nIGN1cnJlbnRseSBjcmF3bGVkLCBudWxsXG4gICAgICogaWYgbm8gcm9vbSBpcyBjdXJyZW50bHkgYmVpbmcgY3Jhd2xlZC5cbiAgICAgKi9cbiAgICBjdXJyZW50Um9vbSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRDaGVja3BvaW50ID09PSBudWxsICYmIHRoaXMuY3Jhd2xlckNoZWNrcG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRDaGVja3BvaW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gY2xpZW50LmdldFJvb20odGhpcy5fY3VycmVudENoZWNrcG9pbnQucm9vbUlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjbGllbnQuZ2V0Um9vbSh0aGlzLmNyYXdsZXJDaGVja3BvaW50c1swXS5yb29tSWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3Jhd2xpbmdSb29tcygpIHtcbiAgICAgICAgY29uc3QgdG90YWxSb29tcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgY3Jhd2xpbmdSb29tcyA9IG5ldyBTZXQoKTtcblxuICAgICAgICB0aGlzLmNyYXdsZXJDaGVja3BvaW50cy5mb3JFYWNoKChjaGVja3BvaW50LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY3Jhd2xpbmdSb29tcy5hZGQoY2hlY2twb2ludC5yb29tSWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5fY3VycmVudENoZWNrcG9pbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNyYXdsaW5nUm9vbXMuYWRkKHRoaXMuX2N1cnJlbnRDaGVja3BvaW50LnJvb21JZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHJvb21zID0gY2xpZW50LmdldFJvb21zKCk7XG5cbiAgICAgICAgY29uc3QgaXNSb29tRW5jcnlwdGVkID0gKHJvb20pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjbGllbnQuaXNSb29tRW5jcnlwdGVkKHJvb20ucm9vbUlkKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBlbmNyeXB0ZWRSb29tcyA9IHJvb21zLmZpbHRlcihpc1Jvb21FbmNyeXB0ZWQpO1xuICAgICAgICBlbmNyeXB0ZWRSb29tcy5mb3JFYWNoKChyb29tLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgdG90YWxSb29tcy5hZGQocm9vbS5yb29tSWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge2NyYXdsaW5nUm9vbXMsIHRvdGFsUm9vbXN9O1xuICAgIH1cbn1cbiJdfQ==