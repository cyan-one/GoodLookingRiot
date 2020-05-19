"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _Timer = _interopRequireDefault(require("../../../utils/Timer"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var utils = _interopRequireWildcard(require("matrix-js-sdk/src/utils"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

var Rooms = _interopRequireWildcard(require("../../../Rooms"));

var _DMRoomMap = _interopRequireDefault(require("../../../utils/DMRoomMap"));

var _TagOrderStore = _interopRequireDefault(require("../../../stores/TagOrderStore"));

var _RoomListStore = _interopRequireWildcard(require("../../../stores/RoomListStore"));

var _CustomRoomTagStore = _interopRequireDefault(require("../../../stores/CustomRoomTagStore"));

var _GroupStore = _interopRequireDefault(require("../../../stores/GroupStore"));

var _RoomSubList = _interopRequireDefault(require("../../structures/RoomSubList"));

var _ResizeHandle = _interopRequireDefault(require("../elements/ResizeHandle"));

var _CallHandler = _interopRequireDefault(require("../../../CallHandler"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("../../../index"));

var Receipt = _interopRequireWildcard(require("../../../utils/Receipt"));

var _resizer = require("../../../resizer");

var _roomsublist = require("../../../resizer/distributors/roomsublist2");

var _RovingTabIndex = require("../../../accessibility/RovingTabIndex");

var Unread = _interopRequireWildcard(require("../../../Unread"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

const HIDE_CONFERENCE_CHANS = true;
const STANDARD_TAGS_REGEX = /^(m\.(favourite|lowpriority|server_notice)|im\.vector\.fake\.(invite|recent|direct|archived))$/;
const HOVER_MOVE_TIMEOUT = 1000;

function labelForTagName(tagName) {
  if (tagName.startsWith('u.')) return tagName.slice(2);
  return tagName;
}

var _default = (0, _createReactClass.default)({
  displayName: 'RoomList',
  propTypes: {
    ConferenceHandler: _propTypes.default.any,
    collapsed: _propTypes.default.bool.isRequired,
    searchFilter: _propTypes.default.string
  },
  getInitialState: function () {
    this._hoverClearTimer = null;
    this._subListRefs = {// key => RoomSubList ref
    };
    const sizesJson = window.localStorage.getItem("mx_roomlist_sizes");
    const collapsedJson = window.localStorage.getItem("mx_roomlist_collapsed");
    this.subListSizes = sizesJson ? JSON.parse(sizesJson) : {};
    this.collapsedState = collapsedJson ? JSON.parse(collapsedJson) : {};
    this._layoutSections = [];
    const unfilteredOptions = {
      allowWhitespace: false,
      handleHeight: 1
    };
    this._unfilteredlayout = new _roomsublist.Layout((key, size) => {
      const subList = this._subListRefs[key];

      if (subList) {
        subList.setHeight(size);
      } // update overflow indicators


      this._checkSubListsOverflow(); // don't store height for collapsed sublists


      if (!this.collapsedState[key]) {
        this.subListSizes[key] = size;
        window.localStorage.setItem("mx_roomlist_sizes", JSON.stringify(this.subListSizes));
      }
    }, this.subListSizes, this.collapsedState, unfilteredOptions);
    this._filteredLayout = new _roomsublist.Layout((key, size) => {
      const subList = this._subListRefs[key];

      if (subList) {
        subList.setHeight(size);
      }
    }, null, null, {
      allowWhitespace: false,
      handleHeight: 0
    });
    this._layout = this._unfilteredlayout;
    return {
      isLoadingLeftRooms: false,
      totalRoomCount: null,
      lists: {},
      incomingCallTag: null,
      incomingCall: null,
      selectedTags: [],
      hover: false,
      customTags: _CustomRoomTagStore.default.getTags()
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, put this in the constructor.
  UNSAFE_componentWillMount: function () {
    this.mounted = false;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("Room", this.onRoom);
    cli.on("deleteRoom", this.onDeleteRoom);
    cli.on("Room.receipt", this.onRoomReceipt);
    cli.on("RoomMember.name", this.onRoomMemberName);
    cli.on("Event.decrypted", this.onEventDecrypted);
    cli.on("accountData", this.onAccountData);
    cli.on("Group.myMembership", this._onGroupMyMembership);
    cli.on("RoomState.events", this.onRoomStateEvents);

    const dmRoomMap = _DMRoomMap.default.shared(); // A map between tags which are group IDs and the room IDs of rooms that should be kept
    // in the room list when filtering by that tag.


    this._visibleRoomsForGroup = {// $groupId: [$roomId1, $roomId2, ...],
    }; // All rooms that should be kept in the room list when filtering.
    // By default, show all rooms.

    this._visibleRooms = _MatrixClientPeg.MatrixClientPeg.get().getVisibleRooms(); // Listen to updates to group data. RoomList cares about members and rooms in order
    // to filter the room list when group tags are selected.

    this._groupStoreToken = _GroupStore.default.registerListener(null, () => {
      (_TagOrderStore.default.getOrderedTags() || []).forEach(tag => {
        if (tag[0] !== '+') {
          return;
        } // This group's rooms or members may have updated, update rooms for its tag


        this.updateVisibleRoomsForTag(dmRoomMap, tag);
        this.updateVisibleRooms();
      });
    });
    this._tagStoreToken = _TagOrderStore.default.addListener(() => {
      // Filters themselves have changed
      this.updateVisibleRooms();
    });
    this._roomListStoreToken = _RoomListStore.default.addListener(() => {
      this._delayedRefreshRoomList();
    });

    if (_SettingsStore.default.isFeatureEnabled("feature_custom_tags")) {
      this._customTagStoreToken = _CustomRoomTagStore.default.addListener(() => {
        this.setState({
          customTags: _CustomRoomTagStore.default.getTags()
        });
      });
    }

    this.refreshRoomList(); // order of the sublists
    //this.listOrder = [];
    // loop count to stop a stack overflow if the user keeps waggling the
    // mouse for >30s in a row, or if running under mocha

    this._delayedRefreshRoomListLoopCount = 0;
  },
  componentDidMount: function () {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    const cfg = {
      getLayout: () => this._layout
    };
    this.resizer = new _resizer.Resizer(this.resizeContainer, _roomsublist.Distributor, cfg);
    this.resizer.setClassNames({
      handle: "mx_ResizeHandle",
      vertical: "mx_ResizeHandle_vertical",
      reverse: "mx_ResizeHandle_reverse"
    });

    this._layout.update(this._layoutSections, this.resizeContainer && this.resizeContainer.offsetHeight);

    this._checkSubListsOverflow();

    this.resizer.attach();

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.on("leftPanelResized", this.onResize);
    }

    this.mounted = true;
  },
  componentDidUpdate: function (prevProps) {
    let forceLayoutUpdate = false;

    this._repositionIncomingCallBox(undefined, false);

    if (!this.props.searchFilter && prevProps.searchFilter) {
      this._layout = this._unfilteredlayout;
      forceLayoutUpdate = true;
    } else if (this.props.searchFilter && !prevProps.searchFilter) {
      this._layout = this._filteredLayout;
      forceLayoutUpdate = true;
    }

    this._layout.update(this._layoutSections, this.resizeContainer && this.resizeContainer.clientHeight, forceLayoutUpdate);

    this._checkSubListsOverflow();
  },
  onAction: function (payload) {
    switch (payload.action) {
      case 'view_tooltip':
        this.tooltip = payload.tooltip;
        break;

      case 'call_state':
        var call = _CallHandler.default.getCall(payload.room_id);

        if (call && call.call_state === 'ringing') {
          this.setState({
            incomingCall: call,
            incomingCallTag: this.getTagNameForRoomId(payload.room_id)
          });

          this._repositionIncomingCallBox(undefined, true);
        } else {
          this.setState({
            incomingCall: null,
            incomingCallTag: null
          });
        }

        break;

      case 'view_room_delta':
        {
          const currentRoomId = _RoomViewStore.default.getRoomId();

          const _this$state$lists = this.state.lists,
                {
            "im.vector.fake.invite": inviteRooms,
            "m.favourite": favouriteRooms,
            [_RoomListStore.TAG_DM]: dmRooms,
            "im.vector.fake.recent": recentRooms,
            "m.lowpriority": lowPriorityRooms,
            "im.vector.fake.archived": historicalRooms,
            "m.server_notice": serverNoticeRooms
          } = _this$state$lists,
                tags = (0, _objectWithoutProperties2.default)(_this$state$lists, ["im.vector.fake.invite", "m.favourite", _RoomListStore.TAG_DM, "im.vector.fake.recent", "m.lowpriority", "im.vector.fake.archived", "m.server_notice"].map(_toPropertyKey));
          const shownCustomTagRooms = Object.keys(tags).filter(tagName => {
            return (!this.state.customTags || this.state.customTags[tagName]) && !tagName.match(STANDARD_TAGS_REGEX);
          }).map(tagName => tags[tagName]); // this order matches the one when generating the room sublists below.

          let rooms = this._applySearchFilter([...inviteRooms, ...favouriteRooms, ...dmRooms, ...recentRooms, ...[].concat.apply([], shownCustomTagRooms), // eslint-disable-line prefer-spread
          ...lowPriorityRooms, ...historicalRooms, ...serverNoticeRooms], this.props.searchFilter);

          if (payload.unread) {
            // filter to only notification rooms (and our current active room so we can index properly)
            rooms = rooms.filter(room => {
              return room.roomId === currentRoomId || Unread.doesRoomHaveUnreadMessages(room);
            });
          }

          const currentIndex = rooms.findIndex(room => room.roomId === currentRoomId); // use slice to account for looping around the start

          const [room] = rooms.slice((currentIndex + payload.delta) % rooms.length);

          if (room) {
            _dispatcher.default.dispatch({
              action: 'view_room',
              room_id: room.roomId,
              show_room_tile: true // to make sure the room gets scrolled into view

            });
          }

          break;
        }
    }
  },
  componentWillUnmount: function () {
    this.mounted = false;

    _dispatcher.default.unregister(this.dispatcherRef);

    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Room", this.onRoom);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("deleteRoom", this.onDeleteRoom);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Room.receipt", this.onRoomReceipt);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomMember.name", this.onRoomMemberName);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Event.decrypted", this.onEventDecrypted);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("accountData", this.onAccountData);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("Group.myMembership", this._onGroupMyMembership);

      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.events", this.onRoomStateEvents);
    }

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.removeListener("leftPanelResized", this.onResize);
    }

    if (this._tagStoreToken) {
      this._tagStoreToken.remove();
    }

    if (this._roomListStoreToken) {
      this._roomListStoreToken.remove();
    }

    if (this._customTagStoreToken) {
      this._customTagStoreToken.remove();
    } // NB: GroupStore is not a Flux.Store


    if (this._groupStoreToken) {
      this._groupStoreToken.unregister();
    } // cancel any pending calls to the rate_limited_funcs


    this._delayedRefreshRoomList.cancelPendingCall();
  },
  onResize: function () {
    if (this.mounted && this._layout && this.resizeContainer && Array.isArray(this._layoutSections)) {
      this._layout.update(this._layoutSections, this.resizeContainer.offsetHeight);
    }
  },
  onRoom: function (room) {
    this.updateVisibleRooms();
  },
  onRoomStateEvents: function (ev, state) {
    if (ev.getType() === "m.room.create" || ev.getType() === "m.room.tombstone") {
      this.updateVisibleRooms();
    }
  },
  onDeleteRoom: function (roomId) {
    this.updateVisibleRooms();
  },
  onArchivedHeaderClick: function (isHidden, scrollToPosition) {
    if (!isHidden) {
      const self = this;
      this.setState({
        isLoadingLeftRooms: true
      }); // we don't care about the response since it comes down via "Room"
      // events.

      _MatrixClientPeg.MatrixClientPeg.get().syncLeftRooms().catch(function (err) {
        console.error("Failed to sync left rooms: %s", err);
        console.error(err);
      }).finally(function () {
        self.setState({
          isLoadingLeftRooms: false
        });
      });
    }
  },
  onRoomReceipt: function (receiptEvent, room) {
    // because if we read a notification, it will affect notification count
    // only bother updating if there's a receipt from us
    if (Receipt.findReadReceiptFromUserId(receiptEvent, _MatrixClientPeg.MatrixClientPeg.get().credentials.userId)) {
      this._delayedRefreshRoomList();
    }
  },
  onRoomMemberName: function (ev, member) {
    this._delayedRefreshRoomList();
  },
  onEventDecrypted: function (ev) {
    // An event being decrypted may mean we need to re-order the room list
    this._delayedRefreshRoomList();
  },
  onAccountData: function (ev) {
    if (ev.getType() == 'm.direct') {
      this._delayedRefreshRoomList();
    }
  },
  _onGroupMyMembership: function (group) {
    this.forceUpdate();
  },
  onMouseMove: async function (ev) {
    if (!this._hoverClearTimer) {
      this.setState({
        hover: true
      });
      this._hoverClearTimer = new _Timer.default(HOVER_MOVE_TIMEOUT);

      this._hoverClearTimer.start();

      let finished = true;

      try {
        await this._hoverClearTimer.finished();
      } catch (err) {
        finished = false;
      }

      this._hoverClearTimer = null;

      if (finished) {
        this.setState({
          hover: false
        });

        this._delayedRefreshRoomList();
      }
    } else {
      this._hoverClearTimer.restart();
    }
  },
  onMouseLeave: function (ev) {
    if (this._hoverClearTimer) {
      this._hoverClearTimer.abort();

      this._hoverClearTimer = null;
    }

    this.setState({
      hover: false
    }); // Refresh the room list just in case the user missed something.

    this._delayedRefreshRoomList();
  },
  _delayedRefreshRoomList: (0, _ratelimitedfunc.default)(function () {
    this.refreshRoomList();
  }, 500),
  // Update which rooms and users should appear in RoomList for a given group tag
  updateVisibleRoomsForTag: function (dmRoomMap, tag) {
    if (!this.mounted) return; // For now, only handle group tags

    if (tag[0] !== '+') return;
    this._visibleRoomsForGroup[tag] = [];

    _GroupStore.default.getGroupRooms(tag).forEach(room => this._visibleRoomsForGroup[tag].push(room.roomId));

    _GroupStore.default.getGroupMembers(tag).forEach(member => {
      if (member.userId === _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) return;
      dmRoomMap.getDMRoomsForUserId(member.userId).forEach(roomId => this._visibleRoomsForGroup[tag].push(roomId));
    }); // TODO: Check if room has been tagged to the group by the user

  },
  // Update which rooms and users should appear according to which tags are selected
  updateVisibleRooms: function () {
    const selectedTags = _TagOrderStore.default.getSelectedTags();

    const visibleGroupRooms = [];
    selectedTags.forEach(tag => {
      (this._visibleRoomsForGroup[tag] || []).forEach(roomId => visibleGroupRooms.push(roomId));
    }); // If there are any tags selected, constrain the rooms listed to the
    // visible rooms as determined by visibleGroupRooms. Here, we
    // de-duplicate and filter out rooms that the client doesn't know
    // about (hence the Set and the null-guard on `room`).

    if (selectedTags.length > 0) {
      const roomSet = new Set();
      visibleGroupRooms.forEach(roomId => {
        const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(roomId);

        if (room) {
          roomSet.add(room);
        }
      });
      this._visibleRooms = Array.from(roomSet);
    } else {
      // Show all rooms
      this._visibleRooms = _MatrixClientPeg.MatrixClientPeg.get().getVisibleRooms();
    }

    this._delayedRefreshRoomList();
  },
  refreshRoomList: function () {
    if (this.state.hover) {
      // Don't re-sort the list if we're hovering over the list
      return;
    } // TODO: ideally we'd calculate this once at start, and then maintain
    // any changes to it incrementally, updating the appropriate sublists
    // as needed.
    // Alternatively we'd do something magical with Immutable.js or similar.


    const lists = this.getRoomLists();
    let totalRooms = 0;

    for (const l of Object.values(lists)) {
      totalRooms += l.length;
    }

    this.setState({
      lists,
      totalRoomCount: totalRooms,
      // Do this here so as to not render every time the selected tags
      // themselves change.
      selectedTags: _TagOrderStore.default.getSelectedTags()
    }, () => {
      // we don't need to restore any size here, do we?
      // i guess we could have triggered a new group to appear
      // that already an explicit size the last time it appeared ...
      this._checkSubListsOverflow();
    }); // this._lastRefreshRoomListTs = Date.now();
  },
  getTagNameForRoomId: function (roomId) {
    const lists = _RoomListStore.default.getRoomLists();

    for (const tagName of Object.keys(lists)) {
      for (const room of lists[tagName]) {
        // Should be impossible, but guard anyways.
        if (!room) {
          continue;
        }

        const myUserId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

        if (HIDE_CONFERENCE_CHANS && Rooms.isConfCallRoom(room, myUserId, this.props.ConferenceHandler)) {
          continue;
        }

        if (room.roomId === roomId) return tagName;
      }
    }

    return null;
  },
  getRoomLists: function () {
    const lists = _RoomListStore.default.getRoomLists();

    const filteredLists = {};
    const isRoomVisible = {// $roomId: true,
    };

    this._visibleRooms.forEach(r => {
      isRoomVisible[r.roomId] = true;
    });

    Object.keys(lists).forEach(tagName => {
      const filteredRooms = lists[tagName].filter(taggedRoom => {
        // Somewhat impossible, but guard against it anyway
        if (!taggedRoom) {
          return;
        }

        const myUserId = _MatrixClientPeg.MatrixClientPeg.get().getUserId();

        if (HIDE_CONFERENCE_CHANS && Rooms.isConfCallRoom(taggedRoom, myUserId, this.props.ConferenceHandler)) {
          return;
        }

        return Boolean(isRoomVisible[taggedRoom.roomId]);
      });

      if (filteredRooms.length > 0 || tagName.match(STANDARD_TAGS_REGEX)) {
        filteredLists[tagName] = filteredRooms;
      }
    });
    return filteredLists;
  },
  _getScrollNode: function () {
    if (!this.mounted) return null;

    const panel = _reactDom.default.findDOMNode(this);

    if (!panel) return null;

    if (panel.classList.contains('gm-prevented')) {
      return panel;
    } else {
      return panel.children[2]; // XXX: Fragile!
    }
  },
  _whenScrolling: function (e) {
    this._hideTooltip(e);

    this._repositionIncomingCallBox(e, false);
  },
  _hideTooltip: function (e) {
    // Hide tooltip when scrolling, as we'll no longer be over the one we were on
    if (this.tooltip && this.tooltip.style.display !== "none") {
      this.tooltip.style.display = "none";
    }
  },
  _repositionIncomingCallBox: function (e, firstTime) {
    const incomingCallBox = document.getElementById("incomingCallBox");

    if (incomingCallBox && incomingCallBox.parentElement) {
      const scrollArea = this._getScrollNode();

      if (!scrollArea) return; // Use the offset of the top of the scroll area from the window
      // as this is used to calculate the CSS fixed top position for the stickies

      const scrollAreaOffset = scrollArea.getBoundingClientRect().top + window.pageYOffset; // Use the offset of the top of the component from the window
      // as this is used to calculate the CSS fixed top position for the stickies

      const scrollAreaHeight = _reactDom.default.findDOMNode(this).getBoundingClientRect().height;

      let top = incomingCallBox.parentElement.getBoundingClientRect().top + window.pageYOffset; // Make sure we don't go too far up, if the headers aren't sticky

      top = top < scrollAreaOffset ? scrollAreaOffset : top; // make sure we don't go too far down, if the headers aren't sticky

      const bottomMargin = scrollAreaOffset + (scrollAreaHeight - 45);
      top = top > bottomMargin ? bottomMargin : top;
      incomingCallBox.style.top = top + "px";
      incomingCallBox.style.left = scrollArea.offsetLeft + scrollArea.offsetWidth + 12 + "px";
    }
  },

  _makeGroupInviteTiles(filter) {
    const ret = [];
    const lcFilter = filter && filter.toLowerCase();
    const GroupInviteTile = sdk.getComponent('groups.GroupInviteTile');

    for (const group of _MatrixClientPeg.MatrixClientPeg.get().getGroups()) {
      const {
        groupId,
        name,
        myMembership
      } = group; // filter to only groups in invite state and group_id starts with filter or group name includes it

      if (myMembership !== 'invite') continue;
      if (lcFilter && !groupId.toLowerCase().startsWith(lcFilter) && !(name && name.toLowerCase().includes(lcFilter))) continue;
      ret.push( /*#__PURE__*/_react.default.createElement(GroupInviteTile, {
        key: groupId,
        group: group,
        collapsed: this.props.collapsed
      }));
    }

    return ret;
  },

  _applySearchFilter: function (list, filter) {
    if (filter === "") return list;
    const lcFilter = filter.toLowerCase(); // apply toLowerCase before and after removeHiddenChars because different rules get applied
    // e.g M -> M but m -> n, yet some unicode homoglyphs come out as uppercase, e.g 𝚮 -> H

    const fuzzyFilter = utils.removeHiddenChars(lcFilter).toLowerCase(); // case insensitive if room name includes filter,
    // or if starts with `#` and one of room's aliases starts with filter

    return list.filter(room => {
      if (filter[0] === "#") {
        if (room.getCanonicalAlias() && room.getCanonicalAlias().toLowerCase().startsWith(lcFilter)) {
          return true;
        }

        if (room.getAltAliases().some(alias => alias.toLowerCase().startsWith(lcFilter))) {
          return true;
        }
      }

      return room.name && utils.removeHiddenChars(room.name.toLowerCase()).toLowerCase().includes(fuzzyFilter);
    });
  },
  _handleCollapsedState: function (key, collapsed) {
    // persist collapsed state
    this.collapsedState[key] = collapsed;
    window.localStorage.setItem("mx_roomlist_collapsed", JSON.stringify(this.collapsedState)); // load the persisted size configuration of the expanded sub list

    if (collapsed) {
      this._layout.collapseSection(key);
    } else {
      this._layout.expandSection(key, this.subListSizes[key]);
    } // check overflow, as sub lists sizes have changed
    // important this happens after calling resize above


    this._checkSubListsOverflow();
  },

  // check overflow for scroll indicator gradient
  _checkSubListsOverflow() {
    Object.values(this._subListRefs).forEach(l => l.checkOverflow());
  },

  _subListRef: function (key, ref) {
    if (!ref) {
      delete this._subListRefs[key];
    } else {
      this._subListRefs[key] = ref;
    }
  },
  _mapSubListProps: function (subListsProps) {
    this._layoutSections = [];
    const defaultProps = {
      collapsed: this.props.collapsed,
      isFiltered: !!this.props.searchFilter
    };
    subListsProps.forEach(p => {
      p.list = this._applySearchFilter(p.list, this.props.searchFilter);
    });
    subListsProps = subListsProps.filter(props => {
      const len = props.list.length + (props.extraTiles ? props.extraTiles.length : 0);
      return len !== 0 || props.onAddRoom;
    });
    return subListsProps.reduce((components, props, i) => {
      props = _objectSpread({}, defaultProps, {}, props);
      const isLast = i === subListsProps.length - 1;
      const len = props.list.length + (props.extraTiles ? props.extraTiles.length : 0);
      const {
        key,
        label,
        onHeaderClick
      } = props,
            otherProps = (0, _objectWithoutProperties2.default)(props, ["key", "label", "onHeaderClick"]);
      const chosenKey = key || label;

      const onSubListHeaderClick = collapsed => {
        this._handleCollapsedState(chosenKey, collapsed);

        if (onHeaderClick) {
          onHeaderClick(collapsed);
        }
      };

      const startAsHidden = props.startAsHidden || this.collapsedState[chosenKey];

      this._layoutSections.push({
        id: chosenKey,
        count: len
      });

      const subList = /*#__PURE__*/_react.default.createElement(_RoomSubList.default, (0, _extends2.default)({
        ref: this._subListRef.bind(this, chosenKey),
        startAsHidden: startAsHidden,
        forceExpand: !!this.props.searchFilter,
        onHeaderClick: onSubListHeaderClick,
        key: chosenKey,
        label: label
      }, otherProps));

      if (!isLast) {
        return components.concat(subList, /*#__PURE__*/_react.default.createElement(_ResizeHandle.default, {
          key: chosenKey + "-resizer",
          vertical: true,
          id: chosenKey
        }));
      } else {
        return components.concat(subList);
      }
    }, []);
  },
  _collectResizeContainer: function (el) {
    this.resizeContainer = el;
  },
  render: function () {
    const incomingCallIfTaggedAs = tagName => {
      if (!this.state.incomingCall) return null;
      if (this.state.incomingCallTag !== tagName) return null;
      return this.state.incomingCall;
    };

    let subLists = [{
      list: [],
      extraTiles: this._makeGroupInviteTiles(this.props.searchFilter),
      label: (0, _languageHandler._t)('Community Invites'),
      isInvite: true
    }, {
      list: this.state.lists['im.vector.fake.invite'],
      label: (0, _languageHandler._t)('Invites'),
      incomingCall: incomingCallIfTaggedAs('im.vector.fake.invite'),
      isInvite: true
    }, {
      list: this.state.lists['m.favourite'],
      label: (0, _languageHandler._t)('Favourites'),
      tagName: "m.favourite",
      incomingCall: incomingCallIfTaggedAs('m.favourite')
    }, {
      list: this.state.lists[_RoomListStore.TAG_DM],
      label: (0, _languageHandler._t)('Direct Messages'),
      tagName: _RoomListStore.TAG_DM,
      incomingCall: incomingCallIfTaggedAs(_RoomListStore.TAG_DM),
      onAddRoom: () => {
        _dispatcher.default.dispatch({
          action: 'view_create_chat'
        });
      },
      addRoomLabel: (0, _languageHandler._t)("Start chat")
    }, {
      list: this.state.lists['im.vector.fake.recent'],
      label: (0, _languageHandler._t)('Rooms'),
      incomingCall: incomingCallIfTaggedAs('im.vector.fake.recent'),
      onAddRoom: () => {
        _dispatcher.default.dispatch({
          action: 'view_create_room'
        });
      }
    }];
    const tagSubLists = Object.keys(this.state.lists).filter(tagName => {
      return (!this.state.customTags || this.state.customTags[tagName]) && !tagName.match(STANDARD_TAGS_REGEX);
    }).map(tagName => {
      return {
        list: this.state.lists[tagName],
        key: tagName,
        label: labelForTagName(tagName),
        tagName: tagName,
        incomingCall: incomingCallIfTaggedAs(tagName)
      };
    });
    subLists = subLists.concat(tagSubLists);
    subLists = subLists.concat([{
      list: this.state.lists['m.lowpriority'],
      label: (0, _languageHandler._t)('Low priority'),
      tagName: "m.lowpriority",
      incomingCall: incomingCallIfTaggedAs('m.lowpriority')
    }, {
      list: this.state.lists['im.vector.fake.archived'],
      label: (0, _languageHandler._t)('Historical'),
      incomingCall: incomingCallIfTaggedAs('im.vector.fake.archived'),
      startAsHidden: true,
      showSpinner: this.state.isLoadingLeftRooms,
      onHeaderClick: this.onArchivedHeaderClick
    }, {
      list: this.state.lists['m.server_notice'],
      label: (0, _languageHandler._t)('System Alerts'),
      tagName: "m.lowpriority",
      incomingCall: incomingCallIfTaggedAs('m.server_notice')
    }]);

    const subListComponents = this._mapSubListProps(subLists);

    const _this$props = this.props,
          {
      resizeNotifier,
      collapsed,
      searchFilter,
      ConferenceHandler,
      onKeyDown
    } = _this$props,
          props = (0, _objectWithoutProperties2.default)(_this$props, ["resizeNotifier", "collapsed", "searchFilter", "ConferenceHandler", "onKeyDown"]); // eslint-disable-line

    return /*#__PURE__*/_react.default.createElement(_RovingTabIndex.RovingTabIndexProvider, {
      handleHomeEnd: true,
      onKeyDown: onKeyDown
    }, ({
      onKeyDownHandler
    }) => /*#__PURE__*/_react.default.createElement("div", (0, _extends2.default)({}, props, {
      onKeyDown: onKeyDownHandler,
      ref: this._collectResizeContainer,
      className: "mx_RoomList",
      role: "tree",
      "aria-label": (0, _languageHandler._t)("Rooms") // Firefox sometimes makes this element focusable due to
      // overflow:scroll;, so force it out of tab order.
      ,
      tabIndex: "-1",
      onMouseMove: this.onMouseMove,
      onMouseLeave: this.onMouseLeave
    }), subListComponents));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Jvb21MaXN0LmpzIl0sIm5hbWVzIjpbIkhJREVfQ09ORkVSRU5DRV9DSEFOUyIsIlNUQU5EQVJEX1RBR1NfUkVHRVgiLCJIT1ZFUl9NT1ZFX1RJTUVPVVQiLCJsYWJlbEZvclRhZ05hbWUiLCJ0YWdOYW1lIiwic3RhcnRzV2l0aCIsInNsaWNlIiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJDb25mZXJlbmNlSGFuZGxlciIsIlByb3BUeXBlcyIsImFueSIsImNvbGxhcHNlZCIsImJvb2wiLCJpc1JlcXVpcmVkIiwic2VhcmNoRmlsdGVyIiwic3RyaW5nIiwiZ2V0SW5pdGlhbFN0YXRlIiwiX2hvdmVyQ2xlYXJUaW1lciIsIl9zdWJMaXN0UmVmcyIsInNpemVzSnNvbiIsIndpbmRvdyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJjb2xsYXBzZWRKc29uIiwic3ViTGlzdFNpemVzIiwiSlNPTiIsInBhcnNlIiwiY29sbGFwc2VkU3RhdGUiLCJfbGF5b3V0U2VjdGlvbnMiLCJ1bmZpbHRlcmVkT3B0aW9ucyIsImFsbG93V2hpdGVzcGFjZSIsImhhbmRsZUhlaWdodCIsIl91bmZpbHRlcmVkbGF5b3V0IiwiTGF5b3V0Iiwia2V5Iiwic2l6ZSIsInN1Ykxpc3QiLCJzZXRIZWlnaHQiLCJfY2hlY2tTdWJMaXN0c092ZXJmbG93Iiwic2V0SXRlbSIsInN0cmluZ2lmeSIsIl9maWx0ZXJlZExheW91dCIsIl9sYXlvdXQiLCJpc0xvYWRpbmdMZWZ0Um9vbXMiLCJ0b3RhbFJvb21Db3VudCIsImxpc3RzIiwiaW5jb21pbmdDYWxsVGFnIiwiaW5jb21pbmdDYWxsIiwic2VsZWN0ZWRUYWdzIiwiaG92ZXIiLCJjdXN0b21UYWdzIiwiQ3VzdG9tUm9vbVRhZ1N0b3JlIiwiZ2V0VGFncyIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJtb3VudGVkIiwiY2xpIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwib24iLCJvblJvb20iLCJvbkRlbGV0ZVJvb20iLCJvblJvb21SZWNlaXB0Iiwib25Sb29tTWVtYmVyTmFtZSIsIm9uRXZlbnREZWNyeXB0ZWQiLCJvbkFjY291bnREYXRhIiwiX29uR3JvdXBNeU1lbWJlcnNoaXAiLCJvblJvb21TdGF0ZUV2ZW50cyIsImRtUm9vbU1hcCIsIkRNUm9vbU1hcCIsInNoYXJlZCIsIl92aXNpYmxlUm9vbXNGb3JHcm91cCIsIl92aXNpYmxlUm9vbXMiLCJnZXRWaXNpYmxlUm9vbXMiLCJfZ3JvdXBTdG9yZVRva2VuIiwiR3JvdXBTdG9yZSIsInJlZ2lzdGVyTGlzdGVuZXIiLCJUYWdPcmRlclN0b3JlIiwiZ2V0T3JkZXJlZFRhZ3MiLCJmb3JFYWNoIiwidGFnIiwidXBkYXRlVmlzaWJsZVJvb21zRm9yVGFnIiwidXBkYXRlVmlzaWJsZVJvb21zIiwiX3RhZ1N0b3JlVG9rZW4iLCJhZGRMaXN0ZW5lciIsIl9yb29tTGlzdFN0b3JlVG9rZW4iLCJSb29tTGlzdFN0b3JlIiwiX2RlbGF5ZWRSZWZyZXNoUm9vbUxpc3QiLCJTZXR0aW5nc1N0b3JlIiwiaXNGZWF0dXJlRW5hYmxlZCIsIl9jdXN0b21UYWdTdG9yZVRva2VuIiwic2V0U3RhdGUiLCJyZWZyZXNoUm9vbUxpc3QiLCJfZGVsYXllZFJlZnJlc2hSb29tTGlzdExvb3BDb3VudCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJjZmciLCJnZXRMYXlvdXQiLCJyZXNpemVyIiwiUmVzaXplciIsInJlc2l6ZUNvbnRhaW5lciIsIkRpc3RyaWJ1dG9yIiwic2V0Q2xhc3NOYW1lcyIsImhhbmRsZSIsInZlcnRpY2FsIiwicmV2ZXJzZSIsInVwZGF0ZSIsIm9mZnNldEhlaWdodCIsImF0dGFjaCIsInByb3BzIiwicmVzaXplTm90aWZpZXIiLCJvblJlc2l6ZSIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsImZvcmNlTGF5b3V0VXBkYXRlIiwiX3JlcG9zaXRpb25JbmNvbWluZ0NhbGxCb3giLCJ1bmRlZmluZWQiLCJjbGllbnRIZWlnaHQiLCJwYXlsb2FkIiwiYWN0aW9uIiwidG9vbHRpcCIsImNhbGwiLCJDYWxsSGFuZGxlciIsImdldENhbGwiLCJyb29tX2lkIiwiY2FsbF9zdGF0ZSIsImdldFRhZ05hbWVGb3JSb29tSWQiLCJjdXJyZW50Um9vbUlkIiwiUm9vbVZpZXdTdG9yZSIsImdldFJvb21JZCIsInN0YXRlIiwiaW52aXRlUm9vbXMiLCJmYXZvdXJpdGVSb29tcyIsIlRBR19ETSIsImRtUm9vbXMiLCJyZWNlbnRSb29tcyIsImxvd1ByaW9yaXR5Um9vbXMiLCJoaXN0b3JpY2FsUm9vbXMiLCJzZXJ2ZXJOb3RpY2VSb29tcyIsInRhZ3MiLCJzaG93bkN1c3RvbVRhZ1Jvb21zIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlciIsIm1hdGNoIiwibWFwIiwicm9vbXMiLCJfYXBwbHlTZWFyY2hGaWx0ZXIiLCJjb25jYXQiLCJhcHBseSIsInVucmVhZCIsInJvb20iLCJyb29tSWQiLCJVbnJlYWQiLCJkb2VzUm9vbUhhdmVVbnJlYWRNZXNzYWdlcyIsImN1cnJlbnRJbmRleCIsImZpbmRJbmRleCIsImRlbHRhIiwibGVuZ3RoIiwiZGlzcGF0Y2giLCJzaG93X3Jvb21fdGlsZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwidW5yZWdpc3RlciIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlIiwiY2FuY2VsUGVuZGluZ0NhbGwiLCJBcnJheSIsImlzQXJyYXkiLCJldiIsImdldFR5cGUiLCJvbkFyY2hpdmVkSGVhZGVyQ2xpY2siLCJpc0hpZGRlbiIsInNjcm9sbFRvUG9zaXRpb24iLCJzZWxmIiwic3luY0xlZnRSb29tcyIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwiZmluYWxseSIsInJlY2VpcHRFdmVudCIsIlJlY2VpcHQiLCJmaW5kUmVhZFJlY2VpcHRGcm9tVXNlcklkIiwiY3JlZGVudGlhbHMiLCJ1c2VySWQiLCJtZW1iZXIiLCJncm91cCIsImZvcmNlVXBkYXRlIiwib25Nb3VzZU1vdmUiLCJUaW1lciIsInN0YXJ0IiwiZmluaXNoZWQiLCJyZXN0YXJ0Iiwib25Nb3VzZUxlYXZlIiwiYWJvcnQiLCJnZXRHcm91cFJvb21zIiwicHVzaCIsImdldEdyb3VwTWVtYmVycyIsImdldERNUm9vbXNGb3JVc2VySWQiLCJnZXRTZWxlY3RlZFRhZ3MiLCJ2aXNpYmxlR3JvdXBSb29tcyIsInJvb21TZXQiLCJTZXQiLCJnZXRSb29tIiwiYWRkIiwiZnJvbSIsImdldFJvb21MaXN0cyIsInRvdGFsUm9vbXMiLCJsIiwidmFsdWVzIiwibXlVc2VySWQiLCJnZXRVc2VySWQiLCJSb29tcyIsImlzQ29uZkNhbGxSb29tIiwiZmlsdGVyZWRMaXN0cyIsImlzUm9vbVZpc2libGUiLCJyIiwiZmlsdGVyZWRSb29tcyIsInRhZ2dlZFJvb20iLCJCb29sZWFuIiwiX2dldFNjcm9sbE5vZGUiLCJwYW5lbCIsIlJlYWN0RE9NIiwiZmluZERPTU5vZGUiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsImNoaWxkcmVuIiwiX3doZW5TY3JvbGxpbmciLCJlIiwiX2hpZGVUb29sdGlwIiwic3R5bGUiLCJkaXNwbGF5IiwiZmlyc3RUaW1lIiwiaW5jb21pbmdDYWxsQm94IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInBhcmVudEVsZW1lbnQiLCJzY3JvbGxBcmVhIiwic2Nyb2xsQXJlYU9mZnNldCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsInBhZ2VZT2Zmc2V0Iiwic2Nyb2xsQXJlYUhlaWdodCIsImhlaWdodCIsImJvdHRvbU1hcmdpbiIsImxlZnQiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0V2lkdGgiLCJfbWFrZUdyb3VwSW52aXRlVGlsZXMiLCJyZXQiLCJsY0ZpbHRlciIsInRvTG93ZXJDYXNlIiwiR3JvdXBJbnZpdGVUaWxlIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZ2V0R3JvdXBzIiwiZ3JvdXBJZCIsIm5hbWUiLCJteU1lbWJlcnNoaXAiLCJpbmNsdWRlcyIsImxpc3QiLCJmdXp6eUZpbHRlciIsInV0aWxzIiwicmVtb3ZlSGlkZGVuQ2hhcnMiLCJnZXRDYW5vbmljYWxBbGlhcyIsImdldEFsdEFsaWFzZXMiLCJzb21lIiwiYWxpYXMiLCJfaGFuZGxlQ29sbGFwc2VkU3RhdGUiLCJjb2xsYXBzZVNlY3Rpb24iLCJleHBhbmRTZWN0aW9uIiwiY2hlY2tPdmVyZmxvdyIsIl9zdWJMaXN0UmVmIiwicmVmIiwiX21hcFN1Ykxpc3RQcm9wcyIsInN1Ykxpc3RzUHJvcHMiLCJkZWZhdWx0UHJvcHMiLCJpc0ZpbHRlcmVkIiwicCIsImxlbiIsImV4dHJhVGlsZXMiLCJvbkFkZFJvb20iLCJyZWR1Y2UiLCJjb21wb25lbnRzIiwiaSIsImlzTGFzdCIsImxhYmVsIiwib25IZWFkZXJDbGljayIsIm90aGVyUHJvcHMiLCJjaG9zZW5LZXkiLCJvblN1Ykxpc3RIZWFkZXJDbGljayIsInN0YXJ0QXNIaWRkZW4iLCJpZCIsImNvdW50IiwiYmluZCIsIl9jb2xsZWN0UmVzaXplQ29udGFpbmVyIiwiZWwiLCJyZW5kZXIiLCJpbmNvbWluZ0NhbGxJZlRhZ2dlZEFzIiwic3ViTGlzdHMiLCJpc0ludml0ZSIsImFkZFJvb21MYWJlbCIsInRhZ1N1Ykxpc3RzIiwic2hvd1NwaW5uZXIiLCJzdWJMaXN0Q29tcG9uZW50cyIsIm9uS2V5RG93biIsIm9uS2V5RG93bkhhbmRsZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRUEsTUFBTUEscUJBQXFCLEdBQUcsSUFBOUI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRyxnR0FBNUI7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RyxLQUFLOUIsZ0JBQUwsQ0FBc0J5QixRQUF0QixDQUExQjs7QUFFQSx3QkFBMEYsS0FBSzlMLEtBQS9GO0FBQUEsVUFBTTtBQUFDQyxNQUFBQSxjQUFEO0FBQWlCckcsTUFBQUEsU0FBakI7QUFBNEJHLE1BQUFBLFlBQTVCO0FBQTBDTixNQUFBQSxpQkFBMUM7QUFBNkQyUyxNQUFBQTtBQUE3RCxLQUFOO0FBQUEsVUFBaUZwTSxLQUFqRiwwSUFoRmUsQ0FnRnVGOztBQUN0Ryx3QkFDSSw2QkFBQyxzQ0FBRDtBQUF3QixNQUFBLGFBQWEsRUFBRSxJQUF2QztBQUE2QyxNQUFBLFNBQVMsRUFBRW9NO0FBQXhELE9BQ0ssQ0FBQztBQUFDQyxNQUFBQTtBQUFELEtBQUQsa0JBQXdCLCtEQUNqQnJNLEtBRGlCO0FBRXJCLE1BQUEsU0FBUyxFQUFFcU0sZ0JBRlU7QUFHckIsTUFBQSxHQUFHLEVBQUUsS0FBS1gsdUJBSFc7QUFJckIsTUFBQSxTQUFTLEVBQUMsYUFKVztBQUtyQixNQUFBLElBQUksRUFBQyxNQUxnQjtBQU1yQixvQkFBWSx5QkFBRyxPQUFILENBTlMsQ0FPckI7QUFDQTtBQVJxQjtBQVNyQixNQUFBLFFBQVEsRUFBQyxJQVRZO0FBVXJCLE1BQUEsV0FBVyxFQUFFLEtBQUszRyxXQVZHO0FBV3JCLE1BQUEsWUFBWSxFQUFFLEtBQUtLO0FBWEUsUUFhbkIrRyxpQkFibUIsQ0FEN0IsQ0FESjtBQW1CSDtBQXp4QjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgVGltZXIgZnJvbSBcIi4uLy4uLy4uL3V0aWxzL1RpbWVyXCI7XG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUmVhY3RET00gZnJvbSBcInJlYWN0LWRvbVwiO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvdXRpbHNcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgcmF0ZV9saW1pdGVkX2Z1bmMgZnJvbSBcIi4uLy4uLy4uL3JhdGVsaW1pdGVkZnVuY1wiO1xuaW1wb3J0ICogYXMgUm9vbXMgZnJvbSAnLi4vLi4vLi4vUm9vbXMnO1xuaW1wb3J0IERNUm9vbU1hcCBmcm9tICcuLi8uLi8uLi91dGlscy9ETVJvb21NYXAnO1xuaW1wb3J0IFRhZ09yZGVyU3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL1RhZ09yZGVyU3RvcmUnO1xuaW1wb3J0IFJvb21MaXN0U3RvcmUsIHtUQUdfRE19IGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9Sb29tTGlzdFN0b3JlJztcbmltcG9ydCBDdXN0b21Sb29tVGFnU3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL0N1c3RvbVJvb21UYWdTdG9yZSc7XG5pbXBvcnQgR3JvdXBTdG9yZSBmcm9tICcuLi8uLi8uLi9zdG9yZXMvR3JvdXBTdG9yZSc7XG5pbXBvcnQgUm9vbVN1Ykxpc3QgZnJvbSAnLi4vLi4vc3RydWN0dXJlcy9Sb29tU3ViTGlzdCc7XG5pbXBvcnQgUmVzaXplSGFuZGxlIGZyb20gJy4uL2VsZW1lbnRzL1Jlc2l6ZUhhbmRsZSc7XG5pbXBvcnQgQ2FsbEhhbmRsZXIgZnJvbSBcIi4uLy4uLy4uL0NhbGxIYW5kbGVyXCI7XG5pbXBvcnQgZGlzIGZyb20gXCIuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXJcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCAqIGFzIFJlY2VpcHQgZnJvbSBcIi4uLy4uLy4uL3V0aWxzL1JlY2VpcHRcIjtcbmltcG9ydCB7UmVzaXplcn0gZnJvbSAnLi4vLi4vLi4vcmVzaXplcic7XG5pbXBvcnQge0xheW91dCwgRGlzdHJpYnV0b3J9IGZyb20gJy4uLy4uLy4uL3Jlc2l6ZXIvZGlzdHJpYnV0b3JzL3Jvb21zdWJsaXN0Mic7XG5pbXBvcnQge1JvdmluZ1RhYkluZGV4UHJvdmlkZXJ9IGZyb20gXCIuLi8uLi8uLi9hY2Nlc3NpYmlsaXR5L1JvdmluZ1RhYkluZGV4XCI7XG5pbXBvcnQgKiBhcyBVbnJlYWQgZnJvbSBcIi4uLy4uLy4uL1VucmVhZFwiO1xuaW1wb3J0IFJvb21WaWV3U3RvcmUgZnJvbSBcIi4uLy4uLy4uL3N0b3Jlcy9Sb29tVmlld1N0b3JlXCI7XG5cbmNvbnN0IEhJREVfQ09ORkVSRU5DRV9DSEFOUyA9IHRydWU7XG5jb25zdCBTVEFOREFSRF9UQUdTX1JFR0VYID0gL14obVxcLihmYXZvdXJpdGV8bG93cHJpb3JpdHl8c2VydmVyX25vdGljZSl8aW1cXC52ZWN0b3JcXC5mYWtlXFwuKGludml0ZXxyZWNlbnR8ZGlyZWN0fGFyY2hpdmVkKSkkLztcbmNvbnN0IEhPVkVSX01PVkVfVElNRU9VVCA9IDEwMDA7XG5cbmZ1bmN0aW9uIGxhYmVsRm9yVGFnTmFtZSh0YWdOYW1lKSB7XG4gICAgaWYgKHRhZ05hbWUuc3RhcnRzV2l0aCgndS4nKSkgcmV0dXJuIHRhZ05hbWUuc2xpY2UoMik7XG4gICAgcmV0dXJuIHRhZ05hbWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUm9vbUxpc3QnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIENvbmZlcmVuY2VIYW5kbGVyOiBQcm9wVHlwZXMuYW55LFxuICAgICAgICBjb2xsYXBzZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgICAgIHNlYXJjaEZpbHRlcjogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB0aGlzLl9ob3ZlckNsZWFyVGltZXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9zdWJMaXN0UmVmcyA9IHtcbiAgICAgICAgICAgIC8vIGtleSA9PiBSb29tU3ViTGlzdCByZWZcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBzaXplc0pzb24gPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9yb29tbGlzdF9zaXplc1wiKTtcbiAgICAgICAgY29uc3QgY29sbGFwc2VkSnNvbiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm14X3Jvb21saXN0X2NvbGxhcHNlZFwiKTtcbiAgICAgICAgdGhpcy5zdWJMaXN0U2l6ZXMgPSBzaXplc0pzb24gPyBKU09OLnBhcnNlKHNpemVzSnNvbikgOiB7fTtcbiAgICAgICAgdGhpcy5jb2xsYXBzZWRTdGF0ZSA9IGNvbGxhcHNlZEpzb24gPyBKU09OLnBhcnNlKGNvbGxhcHNlZEpzb24pIDoge307XG4gICAgICAgIHRoaXMuX2xheW91dFNlY3Rpb25zID0gW107XG5cbiAgICAgICAgY29uc3QgdW5maWx0ZXJlZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBhbGxvd1doaXRlc3BhY2U6IGZhbHNlLFxuICAgICAgICAgICAgaGFuZGxlSGVpZ2h0OiAxLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl91bmZpbHRlcmVkbGF5b3V0ID0gbmV3IExheW91dCgoa2V5LCBzaXplKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWJMaXN0ID0gdGhpcy5fc3ViTGlzdFJlZnNba2V5XTtcbiAgICAgICAgICAgIGlmIChzdWJMaXN0KSB7XG4gICAgICAgICAgICAgICAgc3ViTGlzdC5zZXRIZWlnaHQoc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB1cGRhdGUgb3ZlcmZsb3cgaW5kaWNhdG9yc1xuICAgICAgICAgICAgdGhpcy5fY2hlY2tTdWJMaXN0c092ZXJmbG93KCk7XG4gICAgICAgICAgICAvLyBkb24ndCBzdG9yZSBoZWlnaHQgZm9yIGNvbGxhcHNlZCBzdWJsaXN0c1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbGxhcHNlZFN0YXRlW2tleV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1Ykxpc3RTaXplc1trZXldID0gc2l6ZTtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJteF9yb29tbGlzdF9zaXplc1wiLFxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLnN1Ykxpc3RTaXplcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzLnN1Ykxpc3RTaXplcywgdGhpcy5jb2xsYXBzZWRTdGF0ZSwgdW5maWx0ZXJlZE9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2ZpbHRlcmVkTGF5b3V0ID0gbmV3IExheW91dCgoa2V5LCBzaXplKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWJMaXN0ID0gdGhpcy5fc3ViTGlzdFJlZnNba2V5XTtcbiAgICAgICAgICAgIGlmIChzdWJMaXN0KSB7XG4gICAgICAgICAgICAgICAgc3ViTGlzdC5zZXRIZWlnaHQoc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG51bGwsIG51bGwsIHtcbiAgICAgICAgICAgIGFsbG93V2hpdGVzcGFjZTogZmFsc2UsXG4gICAgICAgICAgICBoYW5kbGVIZWlnaHQ6IDAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX2xheW91dCA9IHRoaXMuX3VuZmlsdGVyZWRsYXlvdXQ7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzTG9hZGluZ0xlZnRSb29tczogZmFsc2UsXG4gICAgICAgICAgICB0b3RhbFJvb21Db3VudDogbnVsbCxcbiAgICAgICAgICAgIGxpc3RzOiB7fSxcbiAgICAgICAgICAgIGluY29taW5nQ2FsbFRhZzogbnVsbCxcbiAgICAgICAgICAgIGluY29taW5nQ2FsbDogbnVsbCxcbiAgICAgICAgICAgIHNlbGVjdGVkVGFnczogW10sXG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgICAgICBjdXN0b21UYWdzOiBDdXN0b21Sb29tVGFnU3RvcmUuZ2V0VGFncygpLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCBwdXQgdGhpcyBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcblxuICAgICAgICBjbGkub24oXCJSb29tXCIsIHRoaXMub25Sb29tKTtcbiAgICAgICAgY2xpLm9uKFwiZGVsZXRlUm9vbVwiLCB0aGlzLm9uRGVsZXRlUm9vbSk7XG4gICAgICAgIGNsaS5vbihcIlJvb20ucmVjZWlwdFwiLCB0aGlzLm9uUm9vbVJlY2VpcHQpO1xuICAgICAgICBjbGkub24oXCJSb29tTWVtYmVyLm5hbWVcIiwgdGhpcy5vblJvb21NZW1iZXJOYW1lKTtcbiAgICAgICAgY2xpLm9uKFwiRXZlbnQuZGVjcnlwdGVkXCIsIHRoaXMub25FdmVudERlY3J5cHRlZCk7XG4gICAgICAgIGNsaS5vbihcImFjY291bnREYXRhXCIsIHRoaXMub25BY2NvdW50RGF0YSk7XG4gICAgICAgIGNsaS5vbihcIkdyb3VwLm15TWVtYmVyc2hpcFwiLCB0aGlzLl9vbkdyb3VwTXlNZW1iZXJzaGlwKTtcbiAgICAgICAgY2xpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcblxuICAgICAgICBjb25zdCBkbVJvb21NYXAgPSBETVJvb21NYXAuc2hhcmVkKCk7XG4gICAgICAgIC8vIEEgbWFwIGJldHdlZW4gdGFncyB3aGljaCBhcmUgZ3JvdXAgSURzIGFuZCB0aGUgcm9vbSBJRHMgb2Ygcm9vbXMgdGhhdCBzaG91bGQgYmUga2VwdFxuICAgICAgICAvLyBpbiB0aGUgcm9vbSBsaXN0IHdoZW4gZmlsdGVyaW5nIGJ5IHRoYXQgdGFnLlxuICAgICAgICB0aGlzLl92aXNpYmxlUm9vbXNGb3JHcm91cCA9IHtcbiAgICAgICAgICAgIC8vICRncm91cElkOiBbJHJvb21JZDEsICRyb29tSWQyLCAuLi5dLFxuICAgICAgICB9O1xuICAgICAgICAvLyBBbGwgcm9vbXMgdGhhdCBzaG91bGQgYmUga2VwdCBpbiB0aGUgcm9vbSBsaXN0IHdoZW4gZmlsdGVyaW5nLlxuICAgICAgICAvLyBCeSBkZWZhdWx0LCBzaG93IGFsbCByb29tcy5cbiAgICAgICAgdGhpcy5fdmlzaWJsZVJvb21zID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFZpc2libGVSb29tcygpO1xuXG4gICAgICAgIC8vIExpc3RlbiB0byB1cGRhdGVzIHRvIGdyb3VwIGRhdGEuIFJvb21MaXN0IGNhcmVzIGFib3V0IG1lbWJlcnMgYW5kIHJvb21zIGluIG9yZGVyXG4gICAgICAgIC8vIHRvIGZpbHRlciB0aGUgcm9vbSBsaXN0IHdoZW4gZ3JvdXAgdGFncyBhcmUgc2VsZWN0ZWQuXG4gICAgICAgIHRoaXMuX2dyb3VwU3RvcmVUb2tlbiA9IEdyb3VwU3RvcmUucmVnaXN0ZXJMaXN0ZW5lcihudWxsLCAoKSA9PiB7XG4gICAgICAgICAgICAoVGFnT3JkZXJTdG9yZS5nZXRPcmRlcmVkVGFncygpIHx8IFtdKS5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGFnWzBdICE9PSAnKycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGdyb3VwJ3Mgcm9vbXMgb3IgbWVtYmVycyBtYXkgaGF2ZSB1cGRhdGVkLCB1cGRhdGUgcm9vbXMgZm9yIGl0cyB0YWdcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVZpc2libGVSb29tc0ZvclRhZyhkbVJvb21NYXAsIHRhZyk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVWaXNpYmxlUm9vbXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl90YWdTdG9yZVRva2VuID0gVGFnT3JkZXJTdG9yZS5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgICAgICAvLyBGaWx0ZXJzIHRoZW1zZWx2ZXMgaGF2ZSBjaGFuZ2VkXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZpc2libGVSb29tcygpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9yb29tTGlzdFN0b3JlVG9rZW4gPSBSb29tTGlzdFN0b3JlLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2RlbGF5ZWRSZWZyZXNoUm9vbUxpc3QoKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKFwiZmVhdHVyZV9jdXN0b21fdGFnc1wiKSkge1xuICAgICAgICAgICAgdGhpcy5fY3VzdG9tVGFnU3RvcmVUb2tlbiA9IEN1c3RvbVJvb21UYWdTdG9yZS5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVRhZ3M6IEN1c3RvbVJvb21UYWdTdG9yZS5nZXRUYWdzKCksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmcmVzaFJvb21MaXN0KCk7XG5cbiAgICAgICAgLy8gb3JkZXIgb2YgdGhlIHN1Ymxpc3RzXG4gICAgICAgIC8vdGhpcy5saXN0T3JkZXIgPSBbXTtcblxuICAgICAgICAvLyBsb29wIGNvdW50IHRvIHN0b3AgYSBzdGFjayBvdmVyZmxvdyBpZiB0aGUgdXNlciBrZWVwcyB3YWdnbGluZyB0aGVcbiAgICAgICAgLy8gbW91c2UgZm9yID4zMHMgaW4gYSByb3csIG9yIGlmIHJ1bm5pbmcgdW5kZXIgbW9jaGFcbiAgICAgICAgdGhpcy5fZGVsYXllZFJlZnJlc2hSb29tTGlzdExvb3BDb3VudCA9IDA7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyUmVmID0gZGlzLnJlZ2lzdGVyKHRoaXMub25BY3Rpb24pO1xuICAgICAgICBjb25zdCBjZmcgPSB7XG4gICAgICAgICAgICBnZXRMYXlvdXQ6ICgpID0+IHRoaXMuX2xheW91dCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZXNpemVyID0gbmV3IFJlc2l6ZXIodGhpcy5yZXNpemVDb250YWluZXIsIERpc3RyaWJ1dG9yLCBjZmcpO1xuICAgICAgICB0aGlzLnJlc2l6ZXIuc2V0Q2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBoYW5kbGU6IFwibXhfUmVzaXplSGFuZGxlXCIsXG4gICAgICAgICAgICB2ZXJ0aWNhbDogXCJteF9SZXNpemVIYW5kbGVfdmVydGljYWxcIixcbiAgICAgICAgICAgIHJldmVyc2U6IFwibXhfUmVzaXplSGFuZGxlX3JldmVyc2VcIixcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xheW91dC51cGRhdGUoXG4gICAgICAgICAgICB0aGlzLl9sYXlvdXRTZWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ29udGFpbmVyICYmIHRoaXMucmVzaXplQ29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fY2hlY2tTdWJMaXN0c092ZXJmbG93KCk7XG5cbiAgICAgICAgdGhpcy5yZXNpemVyLmF0dGFjaCgpO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5yZXNpemVOb3RpZmllcikge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5yZXNpemVOb3RpZmllci5vbihcImxlZnRQYW5lbFJlc2l6ZWRcIiwgdGhpcy5vblJlc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbihwcmV2UHJvcHMpIHtcbiAgICAgICAgbGV0IGZvcmNlTGF5b3V0VXBkYXRlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3JlcG9zaXRpb25JbmNvbWluZ0NhbGxCb3godW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5zZWFyY2hGaWx0ZXIgJiYgcHJldlByb3BzLnNlYXJjaEZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0ID0gdGhpcy5fdW5maWx0ZXJlZGxheW91dDtcbiAgICAgICAgICAgIGZvcmNlTGF5b3V0VXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnNlYXJjaEZpbHRlciAmJiAhcHJldlByb3BzLnNlYXJjaEZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0ID0gdGhpcy5fZmlsdGVyZWRMYXlvdXQ7XG4gICAgICAgICAgICBmb3JjZUxheW91dFVwZGF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGF5b3V0LnVwZGF0ZShcbiAgICAgICAgICAgIHRoaXMuX2xheW91dFNlY3Rpb25zLFxuICAgICAgICAgICAgdGhpcy5yZXNpemVDb250YWluZXIgJiYgdGhpcy5yZXNpemVDb250YWluZXIuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgZm9yY2VMYXlvdXRVcGRhdGUsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX2NoZWNrU3ViTGlzdHNPdmVyZmxvdygpO1xuICAgIH0sXG5cbiAgICBvbkFjdGlvbjogZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICd2aWV3X3Rvb2x0aXAnOlxuICAgICAgICAgICAgICAgIHRoaXMudG9vbHRpcCA9IHBheWxvYWQudG9vbHRpcDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NhbGxfc3RhdGUnOlxuICAgICAgICAgICAgICAgIHZhciBjYWxsID0gQ2FsbEhhbmRsZXIuZ2V0Q2FsbChwYXlsb2FkLnJvb21faWQpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsICYmIGNhbGwuY2FsbF9zdGF0ZSA9PT0gJ3JpbmdpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jb21pbmdDYWxsOiBjYWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jb21pbmdDYWxsVGFnOiB0aGlzLmdldFRhZ05hbWVGb3JSb29tSWQocGF5bG9hZC5yb29tX2lkKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlcG9zaXRpb25JbmNvbWluZ0NhbGxCb3godW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbFRhZzogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlld19yb29tX2RlbHRhJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRSb29tSWQgPSBSb29tVmlld1N0b3JlLmdldFJvb21JZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgICAgICAgXCJpbS52ZWN0b3IuZmFrZS5pbnZpdGVcIjogaW52aXRlUm9vbXMsXG4gICAgICAgICAgICAgICAgICAgIFwibS5mYXZvdXJpdGVcIjogZmF2b3VyaXRlUm9vbXMsXG4gICAgICAgICAgICAgICAgICAgIFtUQUdfRE1dOiBkbVJvb21zLFxuICAgICAgICAgICAgICAgICAgICBcImltLnZlY3Rvci5mYWtlLnJlY2VudFwiOiByZWNlbnRSb29tcyxcbiAgICAgICAgICAgICAgICAgICAgXCJtLmxvd3ByaW9yaXR5XCI6IGxvd1ByaW9yaXR5Um9vbXMsXG4gICAgICAgICAgICAgICAgICAgIFwiaW0udmVjdG9yLmZha2UuYXJjaGl2ZWRcIjogaGlzdG9yaWNhbFJvb21zLFxuICAgICAgICAgICAgICAgICAgICBcIm0uc2VydmVyX25vdGljZVwiOiBzZXJ2ZXJOb3RpY2VSb29tcyxcbiAgICAgICAgICAgICAgICAgICAgLi4udGFnc1xuICAgICAgICAgICAgICAgIH0gPSB0aGlzLnN0YXRlLmxpc3RzO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2hvd25DdXN0b21UYWdSb29tcyA9IE9iamVjdC5rZXlzKHRhZ3MpLmZpbHRlcih0YWdOYW1lID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICghdGhpcy5zdGF0ZS5jdXN0b21UYWdzIHx8IHRoaXMuc3RhdGUuY3VzdG9tVGFnc1t0YWdOYW1lXSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICF0YWdOYW1lLm1hdGNoKFNUQU5EQVJEX1RBR1NfUkVHRVgpO1xuICAgICAgICAgICAgICAgIH0pLm1hcCh0YWdOYW1lID0+IHRhZ3NbdGFnTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBvcmRlciBtYXRjaGVzIHRoZSBvbmUgd2hlbiBnZW5lcmF0aW5nIHRoZSByb29tIHN1Ymxpc3RzIGJlbG93LlxuICAgICAgICAgICAgICAgIGxldCByb29tcyA9IHRoaXMuX2FwcGx5U2VhcmNoRmlsdGVyKFtcbiAgICAgICAgICAgICAgICAgICAgLi4uaW52aXRlUm9vbXMsXG4gICAgICAgICAgICAgICAgICAgIC4uLmZhdm91cml0ZVJvb21zLFxuICAgICAgICAgICAgICAgICAgICAuLi5kbVJvb21zLFxuICAgICAgICAgICAgICAgICAgICAuLi5yZWNlbnRSb29tcyxcbiAgICAgICAgICAgICAgICAgICAgLi4uW10uY29uY2F0LmFwcGx5KFtdLCBzaG93bkN1c3RvbVRhZ1Jvb21zKSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwcmVmZXItc3ByZWFkXG4gICAgICAgICAgICAgICAgICAgIC4uLmxvd1ByaW9yaXR5Um9vbXMsXG4gICAgICAgICAgICAgICAgICAgIC4uLmhpc3RvcmljYWxSb29tcyxcbiAgICAgICAgICAgICAgICAgICAgLi4uc2VydmVyTm90aWNlUm9vbXMsXG4gICAgICAgICAgICAgICAgXSwgdGhpcy5wcm9wcy5zZWFyY2hGaWx0ZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQudW5yZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlciB0byBvbmx5IG5vdGlmaWNhdGlvbiByb29tcyAoYW5kIG91ciBjdXJyZW50IGFjdGl2ZSByb29tIHNvIHdlIGNhbiBpbmRleCBwcm9wZXJseSlcbiAgICAgICAgICAgICAgICAgICAgcm9vbXMgPSByb29tcy5maWx0ZXIocm9vbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vbS5yb29tSWQgPT09IGN1cnJlbnRSb29tSWQgfHwgVW5yZWFkLmRvZXNSb29tSGF2ZVVucmVhZE1lc3NhZ2VzKHJvb20pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSByb29tcy5maW5kSW5kZXgocm9vbSA9PiByb29tLnJvb21JZCA9PT0gY3VycmVudFJvb21JZCk7XG4gICAgICAgICAgICAgICAgLy8gdXNlIHNsaWNlIHRvIGFjY291bnQgZm9yIGxvb3BpbmcgYXJvdW5kIHRoZSBzdGFydFxuICAgICAgICAgICAgICAgIGNvbnN0IFtyb29tXSA9IHJvb21zLnNsaWNlKChjdXJyZW50SW5kZXggKyBwYXlsb2FkLmRlbHRhKSAlIHJvb21zLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tX2lkOiByb29tLnJvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3dfcm9vbV90aWxlOiB0cnVlLCAvLyB0byBtYWtlIHN1cmUgdGhlIHJvb20gZ2V0cyBzY3JvbGxlZCBpbnRvIHZpZXdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKSkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVwiLCB0aGlzLm9uUm9vbSk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJkZWxldGVSb29tXCIsIHRoaXMub25EZWxldGVSb29tKTtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcIlJvb20ucmVjZWlwdFwiLCB0aGlzLm9uUm9vbVJlY2VpcHQpO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbU1lbWJlci5uYW1lXCIsIHRoaXMub25Sb29tTWVtYmVyTmFtZSk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJFdmVudC5kZWNyeXB0ZWRcIiwgdGhpcy5vbkV2ZW50RGVjcnlwdGVkKTtcbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZW1vdmVMaXN0ZW5lcihcImFjY291bnREYXRhXCIsIHRoaXMub25BY2NvdW50RGF0YSk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJHcm91cC5teU1lbWJlcnNoaXBcIiwgdGhpcy5fb25Hcm91cE15TWVtYmVyc2hpcCk7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMucmVzaXplTm90aWZpZXIucmVtb3ZlTGlzdGVuZXIoXCJsZWZ0UGFuZWxSZXNpemVkXCIsIHRoaXMub25SZXNpemUpO1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAodGhpcy5fdGFnU3RvcmVUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5fdGFnU3RvcmVUb2tlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9yb29tTGlzdFN0b3JlVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb21MaXN0U3RvcmVUb2tlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fY3VzdG9tVGFnU3RvcmVUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5fY3VzdG9tVGFnU3RvcmVUb2tlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5COiBHcm91cFN0b3JlIGlzIG5vdCBhIEZsdXguU3RvcmVcbiAgICAgICAgaWYgKHRoaXMuX2dyb3VwU3RvcmVUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5fZ3JvdXBTdG9yZVRva2VuLnVucmVnaXN0ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNhbmNlbCBhbnkgcGVuZGluZyBjYWxscyB0byB0aGUgcmF0ZV9saW1pdGVkX2Z1bmNzXG4gICAgICAgIHRoaXMuX2RlbGF5ZWRSZWZyZXNoUm9vbUxpc3QuY2FuY2VsUGVuZGluZ0NhbGwoKTtcbiAgICB9LFxuXG5cbiAgICBvblJlc2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm1vdW50ZWQgJiYgdGhpcy5fbGF5b3V0ICYmIHRoaXMucmVzaXplQ29udGFpbmVyICYmXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRoaXMuX2xheW91dFNlY3Rpb25zKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2xheW91dC51cGRhdGUoXG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5b3V0U2VjdGlvbnMsXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVDb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb206IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgdGhpcy51cGRhdGVWaXNpYmxlUm9vbXMoKTtcbiAgICB9LFxuXG4gICAgb25Sb29tU3RhdGVFdmVudHM6IGZ1bmN0aW9uKGV2LCBzdGF0ZSkge1xuICAgICAgICBpZiAoZXYuZ2V0VHlwZSgpID09PSBcIm0ucm9vbS5jcmVhdGVcIiB8fCBldi5nZXRUeXBlKCkgPT09IFwibS5yb29tLnRvbWJzdG9uZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZpc2libGVSb29tcygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uRGVsZXRlUm9vbTogZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIHRoaXMudXBkYXRlVmlzaWJsZVJvb21zKCk7XG4gICAgfSxcblxuICAgIG9uQXJjaGl2ZWRIZWFkZXJDbGljazogZnVuY3Rpb24oaXNIaWRkZW4sIHNjcm9sbFRvUG9zaXRpb24pIHtcbiAgICAgICAgaWYgKCFpc0hpZGRlbikge1xuICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgaXNMb2FkaW5nTGVmdFJvb21zOiB0cnVlIH0pO1xuICAgICAgICAgICAgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCB0aGUgcmVzcG9uc2Ugc2luY2UgaXQgY29tZXMgZG93biB2aWEgXCJSb29tXCJcbiAgICAgICAgICAgIC8vIGV2ZW50cy5cbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zeW5jTGVmdFJvb21zKCkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzeW5jIGxlZnQgcm9vbXM6ICVzXCIsIGVycik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNldFN0YXRlKHsgaXNMb2FkaW5nTGVmdFJvb21zOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUm9vbVJlY2VpcHQ6IGZ1bmN0aW9uKHJlY2VpcHRFdmVudCwgcm9vbSkge1xuICAgICAgICAvLyBiZWNhdXNlIGlmIHdlIHJlYWQgYSBub3RpZmljYXRpb24sIGl0IHdpbGwgYWZmZWN0IG5vdGlmaWNhdGlvbiBjb3VudFxuICAgICAgICAvLyBvbmx5IGJvdGhlciB1cGRhdGluZyBpZiB0aGVyZSdzIGEgcmVjZWlwdCBmcm9tIHVzXG4gICAgICAgIGlmIChSZWNlaXB0LmZpbmRSZWFkUmVjZWlwdEZyb21Vc2VySWQocmVjZWlwdEV2ZW50LCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkKSkge1xuICAgICAgICAgICAgdGhpcy5fZGVsYXllZFJlZnJlc2hSb29tTGlzdCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUm9vbU1lbWJlck5hbWU6IGZ1bmN0aW9uKGV2LCBtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fZGVsYXllZFJlZnJlc2hSb29tTGlzdCgpO1xuICAgIH0sXG5cbiAgICBvbkV2ZW50RGVjcnlwdGVkOiBmdW5jdGlvbihldikge1xuICAgICAgICAvLyBBbiBldmVudCBiZWluZyBkZWNyeXB0ZWQgbWF5IG1lYW4gd2UgbmVlZCB0byByZS1vcmRlciB0aGUgcm9vbSBsaXN0XG4gICAgICAgIHRoaXMuX2RlbGF5ZWRSZWZyZXNoUm9vbUxpc3QoKTtcbiAgICB9LFxuXG4gICAgb25BY2NvdW50RGF0YTogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGV2LmdldFR5cGUoKSA9PSAnbS5kaXJlY3QnKSB7XG4gICAgICAgICAgICB0aGlzLl9kZWxheWVkUmVmcmVzaFJvb21MaXN0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uR3JvdXBNeU1lbWJlcnNoaXA6IGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25Nb3VzZU1vdmU6IGFzeW5jIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICghdGhpcy5faG92ZXJDbGVhclRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogdHJ1ZX0pO1xuICAgICAgICAgICAgdGhpcy5faG92ZXJDbGVhclRpbWVyID0gbmV3IFRpbWVyKEhPVkVSX01PVkVfVElNRU9VVCk7XG4gICAgICAgICAgICB0aGlzLl9ob3ZlckNsZWFyVGltZXIuc3RhcnQoKTtcbiAgICAgICAgICAgIGxldCBmaW5pc2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2hvdmVyQ2xlYXJUaW1lci5maW5pc2hlZCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZmluaXNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2hvdmVyQ2xlYXJUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogZmFsc2V9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWxheWVkUmVmcmVzaFJvb21MaXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ob3ZlckNsZWFyVGltZXIucmVzdGFydCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uTW91c2VMZWF2ZTogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuX2hvdmVyQ2xlYXJUaW1lcikge1xuICAgICAgICAgICAgdGhpcy5faG92ZXJDbGVhclRpbWVyLmFib3J0KCk7XG4gICAgICAgICAgICB0aGlzLl9ob3ZlckNsZWFyVGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hvdmVyOiBmYWxzZX0pO1xuXG4gICAgICAgIC8vIFJlZnJlc2ggdGhlIHJvb20gbGlzdCBqdXN0IGluIGNhc2UgdGhlIHVzZXIgbWlzc2VkIHNvbWV0aGluZy5cbiAgICAgICAgdGhpcy5fZGVsYXllZFJlZnJlc2hSb29tTGlzdCgpO1xuICAgIH0sXG5cbiAgICBfZGVsYXllZFJlZnJlc2hSb29tTGlzdDogcmF0ZV9saW1pdGVkX2Z1bmMoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVmcmVzaFJvb21MaXN0KCk7XG4gICAgfSwgNTAwKSxcblxuICAgIC8vIFVwZGF0ZSB3aGljaCByb29tcyBhbmQgdXNlcnMgc2hvdWxkIGFwcGVhciBpbiBSb29tTGlzdCBmb3IgYSBnaXZlbiBncm91cCB0YWdcbiAgICB1cGRhdGVWaXNpYmxlUm9vbXNGb3JUYWc6IGZ1bmN0aW9uKGRtUm9vbU1hcCwgdGFnKSB7XG4gICAgICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgICAgIC8vIEZvciBub3csIG9ubHkgaGFuZGxlIGdyb3VwIHRhZ3NcbiAgICAgICAgaWYgKHRhZ1swXSAhPT0gJysnKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fdmlzaWJsZVJvb21zRm9yR3JvdXBbdGFnXSA9IFtdO1xuICAgICAgICBHcm91cFN0b3JlLmdldEdyb3VwUm9vbXModGFnKS5mb3JFYWNoKChyb29tKSA9PiB0aGlzLl92aXNpYmxlUm9vbXNGb3JHcm91cFt0YWddLnB1c2gocm9vbS5yb29tSWQpKTtcbiAgICAgICAgR3JvdXBTdG9yZS5nZXRHcm91cE1lbWJlcnModGFnKS5mb3JFYWNoKChtZW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChtZW1iZXIudXNlcklkID09PSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkKSByZXR1cm47XG4gICAgICAgICAgICBkbVJvb21NYXAuZ2V0RE1Sb29tc0ZvclVzZXJJZChtZW1iZXIudXNlcklkKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIChyb29tSWQpID0+IHRoaXMuX3Zpc2libGVSb29tc0Zvckdyb3VwW3RhZ10ucHVzaChyb29tSWQpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFRPRE86IENoZWNrIGlmIHJvb20gaGFzIGJlZW4gdGFnZ2VkIHRvIHRoZSBncm91cCBieSB0aGUgdXNlclxuICAgIH0sXG5cbiAgICAvLyBVcGRhdGUgd2hpY2ggcm9vbXMgYW5kIHVzZXJzIHNob3VsZCBhcHBlYXIgYWNjb3JkaW5nIHRvIHdoaWNoIHRhZ3MgYXJlIHNlbGVjdGVkXG4gICAgdXBkYXRlVmlzaWJsZVJvb21zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRUYWdzID0gVGFnT3JkZXJTdG9yZS5nZXRTZWxlY3RlZFRhZ3MoKTtcbiAgICAgICAgY29uc3QgdmlzaWJsZUdyb3VwUm9vbXMgPSBbXTtcbiAgICAgICAgc2VsZWN0ZWRUYWdzLmZvckVhY2goKHRhZykgPT4ge1xuICAgICAgICAgICAgKHRoaXMuX3Zpc2libGVSb29tc0Zvckdyb3VwW3RhZ10gfHwgW10pLmZvckVhY2goXG4gICAgICAgICAgICAgICAgKHJvb21JZCkgPT4gdmlzaWJsZUdyb3VwUm9vbXMucHVzaChyb29tSWQpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGFueSB0YWdzIHNlbGVjdGVkLCBjb25zdHJhaW4gdGhlIHJvb21zIGxpc3RlZCB0byB0aGVcbiAgICAgICAgLy8gdmlzaWJsZSByb29tcyBhcyBkZXRlcm1pbmVkIGJ5IHZpc2libGVHcm91cFJvb21zLiBIZXJlLCB3ZVxuICAgICAgICAvLyBkZS1kdXBsaWNhdGUgYW5kIGZpbHRlciBvdXQgcm9vbXMgdGhhdCB0aGUgY2xpZW50IGRvZXNuJ3Qga25vd1xuICAgICAgICAvLyBhYm91dCAoaGVuY2UgdGhlIFNldCBhbmQgdGhlIG51bGwtZ3VhcmQgb24gYHJvb21gKS5cbiAgICAgICAgaWYgKHNlbGVjdGVkVGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCByb29tU2V0ID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgdmlzaWJsZUdyb3VwUm9vbXMuZm9yRWFjaCgocm9vbUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHJvb21JZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbVNldC5hZGQocm9vbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl92aXNpYmxlUm9vbXMgPSBBcnJheS5mcm9tKHJvb21TZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU2hvdyBhbGwgcm9vbXNcbiAgICAgICAgICAgIHRoaXMuX3Zpc2libGVSb29tcyA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRWaXNpYmxlUm9vbXMoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZWxheWVkUmVmcmVzaFJvb21MaXN0KCk7XG4gICAgfSxcblxuICAgIHJlZnJlc2hSb29tTGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmhvdmVyKSB7XG4gICAgICAgICAgICAvLyBEb24ndCByZS1zb3J0IHRoZSBsaXN0IGlmIHdlJ3JlIGhvdmVyaW5nIG92ZXIgdGhlIGxpc3RcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IGlkZWFsbHkgd2UnZCBjYWxjdWxhdGUgdGhpcyBvbmNlIGF0IHN0YXJ0LCBhbmQgdGhlbiBtYWludGFpblxuICAgICAgICAvLyBhbnkgY2hhbmdlcyB0byBpdCBpbmNyZW1lbnRhbGx5LCB1cGRhdGluZyB0aGUgYXBwcm9wcmlhdGUgc3VibGlzdHNcbiAgICAgICAgLy8gYXMgbmVlZGVkLlxuICAgICAgICAvLyBBbHRlcm5hdGl2ZWx5IHdlJ2QgZG8gc29tZXRoaW5nIG1hZ2ljYWwgd2l0aCBJbW11dGFibGUuanMgb3Igc2ltaWxhci5cbiAgICAgICAgY29uc3QgbGlzdHMgPSB0aGlzLmdldFJvb21MaXN0cygpO1xuICAgICAgICBsZXQgdG90YWxSb29tcyA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgbCBvZiBPYmplY3QudmFsdWVzKGxpc3RzKSkge1xuICAgICAgICAgICAgdG90YWxSb29tcyArPSBsLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGxpc3RzLFxuICAgICAgICAgICAgdG90YWxSb29tQ291bnQ6IHRvdGFsUm9vbXMsXG4gICAgICAgICAgICAvLyBEbyB0aGlzIGhlcmUgc28gYXMgdG8gbm90IHJlbmRlciBldmVyeSB0aW1lIHRoZSBzZWxlY3RlZCB0YWdzXG4gICAgICAgICAgICAvLyB0aGVtc2VsdmVzIGNoYW5nZS5cbiAgICAgICAgICAgIHNlbGVjdGVkVGFnczogVGFnT3JkZXJTdG9yZS5nZXRTZWxlY3RlZFRhZ3MoKSxcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gd2UgZG9uJ3QgbmVlZCB0byByZXN0b3JlIGFueSBzaXplIGhlcmUsIGRvIHdlP1xuICAgICAgICAgICAgLy8gaSBndWVzcyB3ZSBjb3VsZCBoYXZlIHRyaWdnZXJlZCBhIG5ldyBncm91cCB0byBhcHBlYXJcbiAgICAgICAgICAgIC8vIHRoYXQgYWxyZWFkeSBhbiBleHBsaWNpdCBzaXplIHRoZSBsYXN0IHRpbWUgaXQgYXBwZWFyZWQgLi4uXG4gICAgICAgICAgICB0aGlzLl9jaGVja1N1Ykxpc3RzT3ZlcmZsb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhpcy5fbGFzdFJlZnJlc2hSb29tTGlzdFRzID0gRGF0ZS5ub3coKTtcbiAgICB9LFxuXG4gICAgZ2V0VGFnTmFtZUZvclJvb21JZDogZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIGNvbnN0IGxpc3RzID0gUm9vbUxpc3RTdG9yZS5nZXRSb29tTGlzdHMoKTtcbiAgICAgICAgZm9yIChjb25zdCB0YWdOYW1lIG9mIE9iamVjdC5rZXlzKGxpc3RzKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCByb29tIG9mIGxpc3RzW3RhZ05hbWVdKSB7XG4gICAgICAgICAgICAgICAgLy8gU2hvdWxkIGJlIGltcG9zc2libGUsIGJ1dCBndWFyZCBhbnl3YXlzLlxuICAgICAgICAgICAgICAgIGlmICghcm9vbSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICAgICAgaWYgKEhJREVfQ09ORkVSRU5DRV9DSEFOUyAmJiBSb29tcy5pc0NvbmZDYWxsUm9vbShyb29tLCBteVVzZXJJZCwgdGhpcy5wcm9wcy5Db25mZXJlbmNlSGFuZGxlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJvb20ucm9vbUlkID09PSByb29tSWQpIHJldHVybiB0YWdOYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIGdldFJvb21MaXN0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGxpc3RzID0gUm9vbUxpc3RTdG9yZS5nZXRSb29tTGlzdHMoKTtcblxuICAgICAgICBjb25zdCBmaWx0ZXJlZExpc3RzID0ge307XG5cbiAgICAgICAgY29uc3QgaXNSb29tVmlzaWJsZSA9IHtcbiAgICAgICAgICAgIC8vICRyb29tSWQ6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fdmlzaWJsZVJvb21zLmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgICAgIGlzUm9vbVZpc2libGVbci5yb29tSWRdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmtleXMobGlzdHMpLmZvckVhY2goKHRhZ05hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkUm9vbXMgPSBsaXN0c1t0YWdOYW1lXS5maWx0ZXIoKHRhZ2dlZFJvb20pID0+IHtcbiAgICAgICAgICAgICAgICAvLyBTb21ld2hhdCBpbXBvc3NpYmxlLCBidXQgZ3VhcmQgYWdhaW5zdCBpdCBhbnl3YXlcbiAgICAgICAgICAgICAgICBpZiAoIXRhZ2dlZFJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBteVVzZXJJZCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgICAgICBpZiAoSElERV9DT05GRVJFTkNFX0NIQU5TICYmIFJvb21zLmlzQ29uZkNhbGxSb29tKHRhZ2dlZFJvb20sIG15VXNlcklkLCB0aGlzLnByb3BzLkNvbmZlcmVuY2VIYW5kbGVyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oaXNSb29tVmlzaWJsZVt0YWdnZWRSb29tLnJvb21JZF0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXJlZFJvb21zLmxlbmd0aCA+IDAgfHwgdGFnTmFtZS5tYXRjaChTVEFOREFSRF9UQUdTX1JFR0VYKSkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdHNbdGFnTmFtZV0gPSBmaWx0ZXJlZFJvb21zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyZWRMaXN0cztcbiAgICB9LFxuXG4gICAgX2dldFNjcm9sbE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHBhbmVsID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcyk7XG4gICAgICAgIGlmICghcGFuZWwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChwYW5lbC5jbGFzc0xpc3QuY29udGFpbnMoJ2dtLXByZXZlbnRlZCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFuZWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcGFuZWwuY2hpbGRyZW5bMl07IC8vIFhYWDogRnJhZ2lsZSFcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfd2hlblNjcm9sbGluZzogZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLl9oaWRlVG9vbHRpcChlKTtcbiAgICAgICAgdGhpcy5fcmVwb3NpdGlvbkluY29taW5nQ2FsbEJveChlLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIF9oaWRlVG9vbHRpcDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBIaWRlIHRvb2x0aXAgd2hlbiBzY3JvbGxpbmcsIGFzIHdlJ2xsIG5vIGxvbmdlciBiZSBvdmVyIHRoZSBvbmUgd2Ugd2VyZSBvblxuICAgICAgICBpZiAodGhpcy50b29sdGlwICYmIHRoaXMudG9vbHRpcC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgdGhpcy50b29sdGlwLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfcmVwb3NpdGlvbkluY29taW5nQ2FsbEJveDogZnVuY3Rpb24oZSwgZmlyc3RUaW1lKSB7XG4gICAgICAgIGNvbnN0IGluY29taW5nQ2FsbEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5jb21pbmdDYWxsQm94XCIpO1xuICAgICAgICBpZiAoaW5jb21pbmdDYWxsQm94ICYmIGluY29taW5nQ2FsbEJveC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxBcmVhID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICAgICAgaWYgKCFzY3JvbGxBcmVhKSByZXR1cm47XG4gICAgICAgICAgICAvLyBVc2UgdGhlIG9mZnNldCBvZiB0aGUgdG9wIG9mIHRoZSBzY3JvbGwgYXJlYSBmcm9tIHRoZSB3aW5kb3dcbiAgICAgICAgICAgIC8vIGFzIHRoaXMgaXMgdXNlZCB0byBjYWxjdWxhdGUgdGhlIENTUyBmaXhlZCB0b3AgcG9zaXRpb24gZm9yIHRoZSBzdGlja2llc1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsQXJlYU9mZnNldCA9IHNjcm9sbEFyZWEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICAgICAgLy8gVXNlIHRoZSBvZmZzZXQgb2YgdGhlIHRvcCBvZiB0aGUgY29tcG9uZW50IGZyb20gdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gYXMgdGhpcyBpcyB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgQ1NTIGZpeGVkIHRvcCBwb3NpdGlvbiBmb3IgdGhlIHN0aWNraWVzXG4gICAgICAgICAgICBjb25zdCBzY3JvbGxBcmVhSGVpZ2h0ID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcykuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gKGluY29taW5nQ2FsbEJveC5wYXJlbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArIHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgZG9uJ3QgZ28gdG9vIGZhciB1cCwgaWYgdGhlIGhlYWRlcnMgYXJlbid0IHN0aWNreVxuICAgICAgICAgICAgdG9wID0gKHRvcCA8IHNjcm9sbEFyZWFPZmZzZXQpID8gc2Nyb2xsQXJlYU9mZnNldCA6IHRvcDtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBnbyB0b28gZmFyIGRvd24sIGlmIHRoZSBoZWFkZXJzIGFyZW4ndCBzdGlja3lcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbU1hcmdpbiA9IHNjcm9sbEFyZWFPZmZzZXQgKyAoc2Nyb2xsQXJlYUhlaWdodCAtIDQ1KTtcbiAgICAgICAgICAgIHRvcCA9ICh0b3AgPiBib3R0b21NYXJnaW4pID8gYm90dG9tTWFyZ2luIDogdG9wO1xuXG4gICAgICAgICAgICBpbmNvbWluZ0NhbGxCb3guc3R5bGUudG9wID0gdG9wICsgXCJweFwiO1xuICAgICAgICAgICAgaW5jb21pbmdDYWxsQm94LnN0eWxlLmxlZnQgPSBzY3JvbGxBcmVhLm9mZnNldExlZnQgKyBzY3JvbGxBcmVhLm9mZnNldFdpZHRoICsgMTIgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX21ha2VHcm91cEludml0ZVRpbGVzKGZpbHRlcikge1xuICAgICAgICBjb25zdCByZXQgPSBbXTtcbiAgICAgICAgY29uc3QgbGNGaWx0ZXIgPSBmaWx0ZXIgJiYgZmlsdGVyLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgY29uc3QgR3JvdXBJbnZpdGVUaWxlID0gc2RrLmdldENvbXBvbmVudCgnZ3JvdXBzLkdyb3VwSW52aXRlVGlsZScpO1xuICAgICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRHcm91cHMoKSkge1xuICAgICAgICAgICAgY29uc3Qge2dyb3VwSWQsIG5hbWUsIG15TWVtYmVyc2hpcH0gPSBncm91cDtcbiAgICAgICAgICAgIC8vIGZpbHRlciB0byBvbmx5IGdyb3VwcyBpbiBpbnZpdGUgc3RhdGUgYW5kIGdyb3VwX2lkIHN0YXJ0cyB3aXRoIGZpbHRlciBvciBncm91cCBuYW1lIGluY2x1ZGVzIGl0XG4gICAgICAgICAgICBpZiAobXlNZW1iZXJzaGlwICE9PSAnaW52aXRlJykgY29udGludWU7XG4gICAgICAgICAgICBpZiAobGNGaWx0ZXIgJiYgIWdyb3VwSWQudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGxjRmlsdGVyKSAmJlxuICAgICAgICAgICAgICAgICEobmFtZSAmJiBuYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobGNGaWx0ZXIpKSkgY29udGludWU7XG4gICAgICAgICAgICByZXQucHVzaCg8R3JvdXBJbnZpdGVUaWxlIGtleT17Z3JvdXBJZH0gZ3JvdXA9e2dyb3VwfSBjb2xsYXBzZWQ9e3RoaXMucHJvcHMuY29sbGFwc2VkfSAvPik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICBfYXBwbHlTZWFyY2hGaWx0ZXI6IGZ1bmN0aW9uKGxpc3QsIGZpbHRlcikge1xuICAgICAgICBpZiAoZmlsdGVyID09PSBcIlwiKSByZXR1cm4gbGlzdDtcbiAgICAgICAgY29uc3QgbGNGaWx0ZXIgPSBmaWx0ZXIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgLy8gYXBwbHkgdG9Mb3dlckNhc2UgYmVmb3JlIGFuZCBhZnRlciByZW1vdmVIaWRkZW5DaGFycyBiZWNhdXNlIGRpZmZlcmVudCBydWxlcyBnZXQgYXBwbGllZFxuICAgICAgICAvLyBlLmcgTSAtPiBNIGJ1dCBtIC0+IG4sIHlldCBzb21lIHVuaWNvZGUgaG9tb2dseXBocyBjb21lIG91dCBhcyB1cHBlcmNhc2UsIGUuZyDwnZquIC0+IEhcbiAgICAgICAgY29uc3QgZnV6enlGaWx0ZXIgPSB1dGlscy5yZW1vdmVIaWRkZW5DaGFycyhsY0ZpbHRlcikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgLy8gY2FzZSBpbnNlbnNpdGl2ZSBpZiByb29tIG5hbWUgaW5jbHVkZXMgZmlsdGVyLFxuICAgICAgICAvLyBvciBpZiBzdGFydHMgd2l0aCBgI2AgYW5kIG9uZSBvZiByb29tJ3MgYWxpYXNlcyBzdGFydHMgd2l0aCBmaWx0ZXJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKChyb29tKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyWzBdID09PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIGlmIChyb29tLmdldENhbm9uaWNhbEFsaWFzKCkgJiYgcm9vbS5nZXRDYW5vbmljYWxBbGlhcygpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChsY0ZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyb29tLmdldEFsdEFsaWFzZXMoKS5zb21lKChhbGlhcykgPT4gYWxpYXMudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGxjRmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJvb20ubmFtZSAmJiB1dGlscy5yZW1vdmVIaWRkZW5DaGFycyhyb29tLm5hbWUudG9Mb3dlckNhc2UoKSkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhmdXp6eUZpbHRlcik7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ29sbGFwc2VkU3RhdGU6IGZ1bmN0aW9uKGtleSwgY29sbGFwc2VkKSB7XG4gICAgICAgIC8vIHBlcnNpc3QgY29sbGFwc2VkIHN0YXRlXG4gICAgICAgIHRoaXMuY29sbGFwc2VkU3RhdGVba2V5XSA9IGNvbGxhcHNlZDtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfcm9vbWxpc3RfY29sbGFwc2VkXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMuY29sbGFwc2VkU3RhdGUpKTtcbiAgICAgICAgLy8gbG9hZCB0aGUgcGVyc2lzdGVkIHNpemUgY29uZmlndXJhdGlvbiBvZiB0aGUgZXhwYW5kZWQgc3ViIGxpc3RcbiAgICAgICAgaWYgKGNvbGxhcHNlZCkge1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0LmNvbGxhcHNlU2VjdGlvbihrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0LmV4cGFuZFNlY3Rpb24oa2V5LCB0aGlzLnN1Ykxpc3RTaXplc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayBvdmVyZmxvdywgYXMgc3ViIGxpc3RzIHNpemVzIGhhdmUgY2hhbmdlZFxuICAgICAgICAvLyBpbXBvcnRhbnQgdGhpcyBoYXBwZW5zIGFmdGVyIGNhbGxpbmcgcmVzaXplIGFib3ZlXG4gICAgICAgIHRoaXMuX2NoZWNrU3ViTGlzdHNPdmVyZmxvdygpO1xuICAgIH0sXG5cbiAgICAvLyBjaGVjayBvdmVyZmxvdyBmb3Igc2Nyb2xsIGluZGljYXRvciBncmFkaWVudFxuICAgIF9jaGVja1N1Ykxpc3RzT3ZlcmZsb3coKSB7XG4gICAgICAgIE9iamVjdC52YWx1ZXModGhpcy5fc3ViTGlzdFJlZnMpLmZvckVhY2gobCA9PiBsLmNoZWNrT3ZlcmZsb3coKSk7XG4gICAgfSxcblxuICAgIF9zdWJMaXN0UmVmOiBmdW5jdGlvbihrZXksIHJlZikge1xuICAgICAgICBpZiAoIXJlZikge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1Ykxpc3RSZWZzW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdWJMaXN0UmVmc1trZXldID0gcmVmO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9tYXBTdWJMaXN0UHJvcHM6IGZ1bmN0aW9uKHN1Ykxpc3RzUHJvcHMpIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0U2VjdGlvbnMgPSBbXTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICAgICAgY29sbGFwc2VkOiB0aGlzLnByb3BzLmNvbGxhcHNlZCxcbiAgICAgICAgICAgIGlzRmlsdGVyZWQ6ICEhdGhpcy5wcm9wcy5zZWFyY2hGaWx0ZXIsXG4gICAgICAgIH07XG5cbiAgICAgICAgc3ViTGlzdHNQcm9wcy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICBwLmxpc3QgPSB0aGlzLl9hcHBseVNlYXJjaEZpbHRlcihwLmxpc3QsIHRoaXMucHJvcHMuc2VhcmNoRmlsdGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3ViTGlzdHNQcm9wcyA9IHN1Ykxpc3RzUHJvcHMuZmlsdGVyKChwcm9wcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBwcm9wcy5saXN0Lmxlbmd0aCArIChwcm9wcy5leHRyYVRpbGVzID8gcHJvcHMuZXh0cmFUaWxlcy5sZW5ndGggOiAwKTtcbiAgICAgICAgICAgIHJldHVybiBsZW4gIT09IDAgfHwgcHJvcHMub25BZGRSb29tO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgcmV0dXJuIHN1Ykxpc3RzUHJvcHMucmVkdWNlKChjb21wb25lbnRzLCBwcm9wcywgaSkgPT4ge1xuICAgICAgICAgICAgcHJvcHMgPSB7Li4uZGVmYXVsdFByb3BzLCAuLi5wcm9wc307XG4gICAgICAgICAgICBjb25zdCBpc0xhc3QgPSBpID09PSBzdWJMaXN0c1Byb3BzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBwcm9wcy5saXN0Lmxlbmd0aCArIChwcm9wcy5leHRyYVRpbGVzID8gcHJvcHMuZXh0cmFUaWxlcy5sZW5ndGggOiAwKTtcbiAgICAgICAgICAgIGNvbnN0IHtrZXksIGxhYmVsLCBvbkhlYWRlckNsaWNrLCAuLi5vdGhlclByb3BzfSA9IHByb3BzO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuS2V5ID0ga2V5IHx8IGxhYmVsO1xuICAgICAgICAgICAgY29uc3Qgb25TdWJMaXN0SGVhZGVyQ2xpY2sgPSAoY29sbGFwc2VkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlQ29sbGFwc2VkU3RhdGUoY2hvc2VuS2V5LCBjb2xsYXBzZWQpO1xuICAgICAgICAgICAgICAgIGlmIChvbkhlYWRlckNsaWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uSGVhZGVyQ2xpY2soY29sbGFwc2VkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRBc0hpZGRlbiA9IHByb3BzLnN0YXJ0QXNIaWRkZW4gfHwgdGhpcy5jb2xsYXBzZWRTdGF0ZVtjaG9zZW5LZXldO1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0U2VjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGNob3NlbktleSxcbiAgICAgICAgICAgICAgICBjb3VudDogbGVuLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBzdWJMaXN0ID0gKDxSb29tU3ViTGlzdFxuICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fc3ViTGlzdFJlZi5iaW5kKHRoaXMsIGNob3NlbktleSl9XG4gICAgICAgICAgICAgICAgc3RhcnRBc0hpZGRlbj17c3RhcnRBc0hpZGRlbn1cbiAgICAgICAgICAgICAgICBmb3JjZUV4cGFuZD17ISF0aGlzLnByb3BzLnNlYXJjaEZpbHRlcn1cbiAgICAgICAgICAgICAgICBvbkhlYWRlckNsaWNrPXtvblN1Ykxpc3RIZWFkZXJDbGlja31cbiAgICAgICAgICAgICAgICBrZXk9e2Nob3NlbktleX1cbiAgICAgICAgICAgICAgICBsYWJlbD17bGFiZWx9XG4gICAgICAgICAgICAgICAgey4uLm90aGVyUHJvcHN9IC8+KTtcblxuICAgICAgICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50cy5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAgIHN1Ykxpc3QsXG4gICAgICAgICAgICAgICAgICAgIDxSZXNpemVIYW5kbGUga2V5PXtjaG9zZW5LZXkrXCItcmVzaXplclwifSB2ZXJ0aWNhbD17dHJ1ZX0gaWQ9e2Nob3NlbktleX0gLz5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50cy5jb25jYXQoc3ViTGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIFtdKTtcbiAgICB9LFxuXG4gICAgX2NvbGxlY3RSZXNpemVDb250YWluZXI6IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHRoaXMucmVzaXplQ29udGFpbmVyID0gZWw7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGluY29taW5nQ2FsbElmVGFnZ2VkQXMgPSAodGFnTmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmluY29taW5nQ2FsbCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5pbmNvbWluZ0NhbGxUYWcgIT09IHRhZ05hbWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuaW5jb21pbmdDYWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBzdWJMaXN0cyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaXN0OiBbXSxcbiAgICAgICAgICAgICAgICBleHRyYVRpbGVzOiB0aGlzLl9tYWtlR3JvdXBJbnZpdGVUaWxlcyh0aGlzLnByb3BzLnNlYXJjaEZpbHRlciksXG4gICAgICAgICAgICAgICAgbGFiZWw6IF90KCdDb21tdW5pdHkgSW52aXRlcycpLFxuICAgICAgICAgICAgICAgIGlzSW52aXRlOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaXN0OiB0aGlzLnN0YXRlLmxpc3RzWydpbS52ZWN0b3IuZmFrZS5pbnZpdGUnXSxcbiAgICAgICAgICAgICAgICBsYWJlbDogX3QoJ0ludml0ZXMnKSxcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGw6IGluY29taW5nQ2FsbElmVGFnZ2VkQXMoJ2ltLnZlY3Rvci5mYWtlLmludml0ZScpLFxuICAgICAgICAgICAgICAgIGlzSW52aXRlOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaXN0OiB0aGlzLnN0YXRlLmxpc3RzWydtLmZhdm91cml0ZSddLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBfdCgnRmF2b3VyaXRlcycpLFxuICAgICAgICAgICAgICAgIHRhZ05hbWU6IFwibS5mYXZvdXJpdGVcIixcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGw6IGluY29taW5nQ2FsbElmVGFnZ2VkQXMoJ20uZmF2b3VyaXRlJyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpc3Q6IHRoaXMuc3RhdGUubGlzdHNbVEFHX0RNXSxcbiAgICAgICAgICAgICAgICBsYWJlbDogX3QoJ0RpcmVjdCBNZXNzYWdlcycpLFxuICAgICAgICAgICAgICAgIHRhZ05hbWU6IFRBR19ETSxcbiAgICAgICAgICAgICAgICBpbmNvbWluZ0NhbGw6IGluY29taW5nQ2FsbElmVGFnZ2VkQXMoVEFHX0RNKSxcbiAgICAgICAgICAgICAgICBvbkFkZFJvb206ICgpID0+IHtkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfY3JlYXRlX2NoYXQnfSk7fSxcbiAgICAgICAgICAgICAgICBhZGRSb29tTGFiZWw6IF90KFwiU3RhcnQgY2hhdFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGlzdDogdGhpcy5zdGF0ZS5saXN0c1snaW0udmVjdG9yLmZha2UucmVjZW50J10sXG4gICAgICAgICAgICAgICAgbGFiZWw6IF90KCdSb29tcycpLFxuICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbDogaW5jb21pbmdDYWxsSWZUYWdnZWRBcygnaW0udmVjdG9yLmZha2UucmVjZW50JyksXG4gICAgICAgICAgICAgICAgb25BZGRSb29tOiAoKSA9PiB7ZGlzLmRpc3BhdGNoKHthY3Rpb246ICd2aWV3X2NyZWF0ZV9yb29tJ30pO30sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgICAgICBjb25zdCB0YWdTdWJMaXN0cyA9IE9iamVjdC5rZXlzKHRoaXMuc3RhdGUubGlzdHMpXG4gICAgICAgICAgICAuZmlsdGVyKCh0YWdOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICghdGhpcy5zdGF0ZS5jdXN0b21UYWdzIHx8IHRoaXMuc3RhdGUuY3VzdG9tVGFnc1t0YWdOYW1lXSkgJiZcbiAgICAgICAgICAgICAgICAgICAgIXRhZ05hbWUubWF0Y2goU1RBTkRBUkRfVEFHU19SRUdFWCk7XG4gICAgICAgICAgICB9KS5tYXAoKHRhZ05hbWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsaXN0OiB0aGlzLnN0YXRlLmxpc3RzW3RhZ05hbWVdLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbEZvclRhZ05hbWUodGFnTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbDogaW5jb21pbmdDYWxsSWZUYWdnZWRBcyh0YWdOYW1lKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHN1Ykxpc3RzID0gc3ViTGlzdHMuY29uY2F0KHRhZ1N1Ykxpc3RzKTtcbiAgICAgICAgc3ViTGlzdHMgPSBzdWJMaXN0cy5jb25jYXQoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpc3Q6IHRoaXMuc3RhdGUubGlzdHNbJ20ubG93cHJpb3JpdHknXSxcbiAgICAgICAgICAgICAgICBsYWJlbDogX3QoJ0xvdyBwcmlvcml0eScpLFxuICAgICAgICAgICAgICAgIHRhZ05hbWU6IFwibS5sb3dwcmlvcml0eVwiLFxuICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbDogaW5jb21pbmdDYWxsSWZUYWdnZWRBcygnbS5sb3dwcmlvcml0eScpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaXN0OiB0aGlzLnN0YXRlLmxpc3RzWydpbS52ZWN0b3IuZmFrZS5hcmNoaXZlZCddLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBfdCgnSGlzdG9yaWNhbCcpLFxuICAgICAgICAgICAgICAgIGluY29taW5nQ2FsbDogaW5jb21pbmdDYWxsSWZUYWdnZWRBcygnaW0udmVjdG9yLmZha2UuYXJjaGl2ZWQnKSxcbiAgICAgICAgICAgICAgICBzdGFydEFzSGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNob3dTcGlubmVyOiB0aGlzLnN0YXRlLmlzTG9hZGluZ0xlZnRSb29tcyxcbiAgICAgICAgICAgICAgICBvbkhlYWRlckNsaWNrOiB0aGlzLm9uQXJjaGl2ZWRIZWFkZXJDbGljayxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGlzdDogdGhpcy5zdGF0ZS5saXN0c1snbS5zZXJ2ZXJfbm90aWNlJ10sXG4gICAgICAgICAgICAgICAgbGFiZWw6IF90KCdTeXN0ZW0gQWxlcnRzJyksXG4gICAgICAgICAgICAgICAgdGFnTmFtZTogXCJtLmxvd3ByaW9yaXR5XCIsXG4gICAgICAgICAgICAgICAgaW5jb21pbmdDYWxsOiBpbmNvbWluZ0NhbGxJZlRhZ2dlZEFzKCdtLnNlcnZlcl9ub3RpY2UnKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNvbnN0IHN1Ykxpc3RDb21wb25lbnRzID0gdGhpcy5fbWFwU3ViTGlzdFByb3BzKHN1Ykxpc3RzKTtcblxuICAgICAgICBjb25zdCB7cmVzaXplTm90aWZpZXIsIGNvbGxhcHNlZCwgc2VhcmNoRmlsdGVyLCBDb25mZXJlbmNlSGFuZGxlciwgb25LZXlEb3duLCAuLi5wcm9wc30gPSB0aGlzLnByb3BzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8Um92aW5nVGFiSW5kZXhQcm92aWRlciBoYW5kbGVIb21lRW5kPXt0cnVlfSBvbktleURvd249e29uS2V5RG93bn0+XG4gICAgICAgICAgICAgICAgeyh7b25LZXlEb3duSGFuZGxlcn0pID0+IDxkaXZcbiAgICAgICAgICAgICAgICAgICAgey4uLnByb3BzfVxuICAgICAgICAgICAgICAgICAgICBvbktleURvd249e29uS2V5RG93bkhhbmRsZXJ9XG4gICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fY29sbGVjdFJlc2l6ZUNvbnRhaW5lcn1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUm9vbUxpc3RcIlxuICAgICAgICAgICAgICAgICAgICByb2xlPVwidHJlZVwiXG4gICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e190KFwiUm9vbXNcIil9XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggc29tZXRpbWVzIG1ha2VzIHRoaXMgZWxlbWVudCBmb2N1c2FibGUgZHVlIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIG92ZXJmbG93OnNjcm9sbDssIHNvIGZvcmNlIGl0IG91dCBvZiB0YWIgb3JkZXIuXG4gICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PVwiLTFcIlxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTW92ZT17dGhpcy5vbk1vdXNlTW92ZX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLm9uTW91c2VMZWF2ZX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHsgc3ViTGlzdENvbXBvbmVudHMgfVxuICAgICAgICAgICAgICAgIDwvZGl2PiB9XG4gICAgICAgICAgICA8L1JvdmluZ1RhYkluZGV4UHJvdmlkZXI+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19