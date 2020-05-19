"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var Unread = _interopRequireWildcard(require("../../Unread"));

var RoomNotifs = _interopRequireWildcard(require("../../RoomNotifs"));

var FormattingUtils = _interopRequireWildcard(require("../../utils/FormattingUtils"));

var _IndicatorScrollbar = _interopRequireDefault(require("./IndicatorScrollbar"));

var _Keyboard = require("../../Keyboard");

var _matrixJsSdk = require("matrix-js-sdk");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _RoomTile = _interopRequireDefault(require("../views/rooms/RoomTile"));

var _LazyRenderList = _interopRequireDefault(require("../views/elements/LazyRenderList"));

var _languageHandler = require("../../languageHandler");

var _RovingTabIndex = require("../../accessibility/RovingTabIndex");

var _rem = _interopRequireDefault(require("../../utils/rem"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2018, 2019 New Vector Ltd
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
// turn this on for drop & drag console debugging galore
const debug = false;

class RoomTileErrorBoundary extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    // Side effects are not permitted here, so we only update the state so
    // that the next render shows an error message.
    return {
      error
    };
  }

  componentDidCatch(error, {
    componentStack
  }) {
    // Browser consoles are better at formatting output when native errors are passed
    // in their own `console.error` invocation.
    console.error(error);
    console.error("The above error occured while React was rendering the following components:", componentStack);
  }

  render() {
    if (this.state.error) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomTile mx_RoomTileError"
      }, this.props.roomId);
    } else {
      return this.props.children;
    }
  }

}

class RoomSubList extends _react.default.PureComponent {
  static getDerivedStateFromProps(props, state) {
    return {
      listLength: props.list.length,
      scrollTop: props.list.length === state.listLength ? state.scrollTop : 0
    };
  }

  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onAction", payload => {
      switch (payload.action) {
        case 'on_room_read':
          // XXX: Previously RoomList would forceUpdate whenever on_room_read is dispatched,
          // but this is no longer true, so we must do it here (and can apply the small
          // optimisation of checking that we care about the room being read).
          //
          // Ultimately we need to transition to a state pushing flow where something
          // explicitly notifies the components concerned that the notif count for a room
          // has change (e.g. a Flux store).
          if (this.props.list.some(r => r.roomId === payload.roomId)) {
            this.forceUpdate();
          }

          break;

        case 'view_room':
          if (this.state.hidden && !this.props.forceExpand && payload.show_room_tile && this.props.list.some(r => r.roomId === payload.room_id)) {
            this.toggle();
          }

      }
    });
    (0, _defineProperty2.default)(this, "toggle", () => {
      if (this.isCollapsibleOnClick()) {
        // The header isCollapsible, so the click is to be interpreted as collapse and truncation logic
        const isHidden = !this.state.hidden;
        this.setState({
          hidden: isHidden
        }, () => {
          this.props.onHeaderClick(isHidden);
        });
      } else {
        // The header is stuck, so the click is to be interpreted as a scroll to the header
        this.props.onHeaderClick(this.state.hidden, this._header.current.dataset.originalPosition);
      }
    });
    (0, _defineProperty2.default)(this, "onClick", ev => {
      this.toggle();
    });
    (0, _defineProperty2.default)(this, "onHeaderKeyDown", ev => {
      switch (ev.key) {
        case _Keyboard.Key.ARROW_LEFT:
          // On ARROW_LEFT collapse the room sublist
          if (!this.state.hidden && !this.props.forceExpand) {
            this.onClick();
          }

          ev.stopPropagation();
          break;

        case _Keyboard.Key.ARROW_RIGHT:
          {
            ev.stopPropagation();

            if (this.state.hidden && !this.props.forceExpand) {
              // sublist is collapsed, expand it
              this.onClick();
            } else if (!this.props.forceExpand) {
              // sublist is expanded, go to first room
              const element = this._subList.current && this._subList.current.querySelector(".mx_RoomTile");

              if (element) {
                element.focus();
              }
            }

            break;
          }
      }
    });
    (0, _defineProperty2.default)(this, "onKeyDown", ev => {
      switch (ev.key) {
        // On ARROW_LEFT go to the sublist header
        case _Keyboard.Key.ARROW_LEFT:
          ev.stopPropagation();

          this._headerButton.current.focus();

          break;
        // Consume ARROW_RIGHT so it doesn't cause focus to get sent to composer

        case _Keyboard.Key.ARROW_RIGHT:
          ev.stopPropagation();
      }
    });
    (0, _defineProperty2.default)(this, "onRoomTileClick", (roomId, ev) => {
      _dispatcher.default.dispatch({
        action: 'view_room',
        show_room_tile: true,
        // to make sure the room gets scrolled into view
        room_id: roomId,
        clear_search: ev && (ev.key === _Keyboard.Key.ENTER || ev.key === _Keyboard.Key.SPACE)
      });
    });
    (0, _defineProperty2.default)(this, "_updateSubListCount", () => {
      // Force an update by setting the state to the current state
      // Doing it this way rather than using forceUpdate(), so that the shouldComponentUpdate()
      // method is honoured
      this.setState(this.state);
    });
    (0, _defineProperty2.default)(this, "makeRoomTile", room => {
      return /*#__PURE__*/_react.default.createElement(RoomTileErrorBoundary, {
        roomId: room.roomId
      }, /*#__PURE__*/_react.default.createElement(_RoomTile.default, {
        room: room,
        roomSubList: this,
        tagName: this.props.tagName,
        key: room.roomId,
        collapsed: this.props.collapsed || false,
        unread: Unread.doesRoomHaveUnreadMessages(room),
        highlight: this.props.isInvite || RoomNotifs.getUnreadNotificationCount(room, 'highlight') > 0,
        notificationCount: RoomNotifs.getUnreadNotificationCount(room),
        isInvite: this.props.isInvite,
        refreshSubList: this._updateSubListCount,
        incomingCall: null,
        onClick: this.onRoomTileClick
      }));
    });
    (0, _defineProperty2.default)(this, "_onNotifBadgeClick", e => {
      // prevent the roomsublist collapsing
      e.preventDefault();
      e.stopPropagation();
      const room = this.props.list.find(room => RoomNotifs.getRoomHasBadge(room));

      if (room) {
        _dispatcher.default.dispatch({
          action: 'view_room',
          room_id: room.roomId
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onInviteBadgeClick", e => {
      // prevent the roomsublist collapsing
      e.preventDefault();
      e.stopPropagation(); // switch to first room in sortedList as that'll be the top of the list for the user

      if (this.props.list && this.props.list.length > 0) {
        _dispatcher.default.dispatch({
          action: 'view_room',
          room_id: this.props.list[0].roomId
        });
      } else if (this.props.extraTiles && this.props.extraTiles.length > 0) {
        // Group Invites are different in that they are all extra tiles and not rooms
        // XXX: this is a horrible special case because Group Invite sublist is a hack
        if (this.props.extraTiles[0].props && this.props.extraTiles[0].props.group instanceof _matrixJsSdk.Group) {
          _dispatcher.default.dispatch({
            action: 'view_group',
            group_id: this.props.extraTiles[0].props.group.groupId
          });
        }
      }
    });
    (0, _defineProperty2.default)(this, "onAddRoom", e => {
      e.stopPropagation();
      if (this.props.onAddRoom) this.props.onAddRoom();
    });
    (0, _defineProperty2.default)(this, "checkOverflow", () => {
      if (this._scroller.current) {
        this._scroller.current.checkOverflow();
      }
    });
    (0, _defineProperty2.default)(this, "setHeight", height => {
      if (this._subList.current) {
        this._subList.current.style.height = (0, _rem.default)(height);
      }

      this._updateLazyRenderHeight(height);
    });
    (0, _defineProperty2.default)(this, "_onScroll", () => {
      this.setState({
        scrollTop: this._scroller.current.getScrollTop()
      });
    });
    this.state = {
      hidden: this.props.startAsHidden || false,
      // some values to get LazyRenderList starting
      scrollerHeight: 800,
      scrollTop: 0,
      // React 16's getDerivedStateFromProps(props, state) doesn't give the previous props so
      // we have to store the length of the list here so we can see if it's changed or not...
      listLength: null
    };
    this._header = (0, _react.createRef)();
    this._subList = (0, _react.createRef)();
    this._scroller = (0, _react.createRef)();
    this._headerButton = (0, _react.createRef)();
  }

  componentDidMount() {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);
  } // The header is collapsible if it is hidden or not stuck
  // The dataset elements are added in the RoomList _initAndPositionStickyHeaders method


  isCollapsibleOnClick() {
    const stuck = this._header.current.dataset.stuck;

    if (!this.props.forceExpand && (this.state.hidden || stuck === undefined || stuck === "none")) {
      return true;
    } else {
      return false;
    }
  }

  _getHeaderJsx(isCollapsed) {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const AccessibleTooltipButton = sdk.getComponent('elements.AccessibleTooltipButton');
    const subListNotifications = !this.props.isInvite ? RoomNotifs.aggregateNotificationCount(this.props.list) : {
      count: 0,
      highlight: true
    };
    const subListNotifCount = subListNotifications.count;
    const subListNotifHighlight = subListNotifications.highlight; // When collapsed, allow a long hover on the header to show user
    // the full tag name and room count

    let title;

    if (this.props.collapsed) {
      title = this.props.label;
    }

    let incomingCall;

    if (this.props.incomingCall) {
      // We can assume that if we have an incoming call then it is for this list
      const IncomingCallBox = sdk.getComponent("voip.IncomingCallBox");
      incomingCall = /*#__PURE__*/_react.default.createElement(IncomingCallBox, {
        className: "mx_RoomSubList_incomingCall",
        incomingCall: this.props.incomingCall
      });
    }

    const len = this.props.list.length + this.props.extraTiles.length;
    let chevron;

    if (len) {
      const chevronClasses = (0, _classnames.default)({
        'mx_RoomSubList_chevron': true,
        'mx_RoomSubList_chevronRight': isCollapsed,
        'mx_RoomSubList_chevronDown': !isCollapsed
      });
      chevron = /*#__PURE__*/_react.default.createElement("div", {
        className: chevronClasses
      });
    }

    return /*#__PURE__*/_react.default.createElement(_RovingTabIndex.RovingTabIndexWrapper, {
      inputRef: this._headerButton
    }, ({
      onFocus,
      isActive,
      ref
    }) => {
      const tabIndex = isActive ? 0 : -1;
      let badge;

      if (!this.props.collapsed) {
        const badgeClasses = (0, _classnames.default)({
          'mx_RoomSubList_badge': true,
          'mx_RoomSubList_badgeHighlight': subListNotifHighlight
        }); // Wrap the contents in a div and apply styles to the child div so that the browser default outline works

        if (subListNotifCount > 0) {
          badge = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
            tabIndex: tabIndex,
            className: badgeClasses,
            onClick: this._onNotifBadgeClick,
            "aria-label": (0, _languageHandler._t)("Jump to first unread room.")
          }, /*#__PURE__*/_react.default.createElement("div", null, FormattingUtils.formatCount(subListNotifCount)));
        } else if (this.props.isInvite && this.props.list.length) {
          // no notifications but highlight anyway because this is an invite badge
          badge = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
            tabIndex: tabIndex,
            className: badgeClasses,
            onClick: this._onInviteBadgeClick,
            "aria-label": (0, _languageHandler._t)("Jump to first invite.")
          }, /*#__PURE__*/_react.default.createElement("div", null, this.props.list.length));
        }
      }

      let addRoomButton;

      if (this.props.onAddRoom) {
        addRoomButton = /*#__PURE__*/_react.default.createElement(AccessibleTooltipButton, {
          tabIndex: tabIndex,
          onClick: this.onAddRoom,
          className: "mx_RoomSubList_addRoom",
          title: this.props.addRoomLabel || (0, _languageHandler._t)("Add room")
        });
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomSubList_labelContainer",
        title: title,
        ref: this._header,
        onKeyDown: this.onHeaderKeyDown
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onFocus: onFocus,
        tabIndex: tabIndex,
        inputRef: ref,
        onClick: this.onClick,
        className: "mx_RoomSubList_label",
        "aria-expanded": !isCollapsed,
        role: "treeitem",
        "aria-level": "1"
      }, chevron, /*#__PURE__*/_react.default.createElement("span", null, this.props.label), incomingCall), badge, addRoomButton);
    });
  }

  _updateLazyRenderHeight(height) {
    this.setState({
      scrollerHeight: height
    });
  }

  _canUseLazyListRendering() {
    // for now disable lazy rendering as they are already rendered tiles
    // not rooms like props.list we pass to LazyRenderList
    return !this.props.extraTiles || !this.props.extraTiles.length;
  }

  render() {
    const len = this.props.list.length + this.props.extraTiles.length;
    const isCollapsed = this.state.hidden && !this.props.forceExpand;
    const subListClasses = (0, _classnames.default)({
      "mx_RoomSubList": true,
      "mx_RoomSubList_hidden": len && isCollapsed,
      "mx_RoomSubList_nonEmpty": len && !isCollapsed
    });
    let content;

    if (len) {
      if (isCollapsed) {// no body
      } else if (this._canUseLazyListRendering()) {
        content = /*#__PURE__*/_react.default.createElement(_IndicatorScrollbar.default, {
          ref: this._scroller,
          className: "mx_RoomSubList_scroll",
          onScroll: this._onScroll
        }, /*#__PURE__*/_react.default.createElement(_LazyRenderList.default, {
          scrollTop: this.state.scrollTop,
          height: this.state.scrollerHeight,
          renderItem: this.makeRoomTile,
          itemHeight: 34,
          items: this.props.list
        }));
      } else {
        const roomTiles = this.props.list.map(r => this.makeRoomTile(r));
        const tiles = roomTiles.concat(this.props.extraTiles);
        content = /*#__PURE__*/_react.default.createElement(_IndicatorScrollbar.default, {
          ref: this._scroller,
          className: "mx_RoomSubList_scroll",
          onScroll: this._onScroll
        }, tiles);
      }
    } else {
      if (this.props.showSpinner && !isCollapsed) {
        const Loader = sdk.getComponent("elements.Spinner");
        content = /*#__PURE__*/_react.default.createElement(Loader, null);
      }
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      ref: this._subList,
      className: subListClasses,
      role: "group",
      "aria-label": this.props.label,
      onKeyDown: this.onKeyDown
    }, this._getHeaderJsx(isCollapsed), content);
  }

}

exports.default = RoomSubList;
(0, _defineProperty2.default)(RoomSubList, "displayName", 'RoomSubList');
(0, _defineProperty2.default)(RoomSubList, "debug", debug);
(0, _defineProperty2.default)(RoomSubList, "propTypes", {
  list: _propTypes.default.arrayOf(_propTypes.default.object).isRequired,
  label: _propTypes.default.string.isRequired,
  tagName: _propTypes.default.string,
  addRoomLabel: _propTypes.default.string,
  // passed through to RoomTile and used to highlight room with `!` regardless of notifications count
  isInvite: _propTypes.default.bool,
  startAsHidden: _propTypes.default.bool,
  showSpinner: _propTypes.default.bool,
  // true to show a spinner if 0 elements when expanded
  collapsed: _propTypes.default.bool.isRequired,
  // is LeftPanel collapsed?
  onHeaderClick: _propTypes.default.func,
  incomingCall: _propTypes.default.object,
  extraTiles: _propTypes.default.arrayOf(_propTypes.default.node),
  // extra elements added beneath tiles
  forceExpand: _propTypes.default.bool
});
(0, _defineProperty2.default)(RoomSubList, "defaultProps", {
  onHeaderClick: function () {},
  // NOP
  extraTiles: [],
  isInvite: false
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvUm9vbVN1Ykxpc3QuanMiXSwibmFtZXMiOlsiZGVidWciLCJSb29tVGlsZUVycm9yQm91bmRhcnkiLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwic3RhdGUiLCJlcnJvciIsImdldERlcml2ZWRTdGF0ZUZyb21FcnJvciIsImNvbXBvbmVudERpZENhdGNoIiwiY29tcG9uZW50U3RhY2siLCJjb25zb2xlIiwicmVuZGVyIiwicm9vbUlkIiwiY2hpbGRyZW4iLCJSb29tU3ViTGlzdCIsImdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyIsImxpc3RMZW5ndGgiLCJsaXN0IiwibGVuZ3RoIiwic2Nyb2xsVG9wIiwicGF5bG9hZCIsImFjdGlvbiIsInNvbWUiLCJyIiwiZm9yY2VVcGRhdGUiLCJoaWRkZW4iLCJmb3JjZUV4cGFuZCIsInNob3dfcm9vbV90aWxlIiwicm9vbV9pZCIsInRvZ2dsZSIsImlzQ29sbGFwc2libGVPbkNsaWNrIiwiaXNIaWRkZW4iLCJzZXRTdGF0ZSIsIm9uSGVhZGVyQ2xpY2siLCJfaGVhZGVyIiwiY3VycmVudCIsImRhdGFzZXQiLCJvcmlnaW5hbFBvc2l0aW9uIiwiZXYiLCJrZXkiLCJLZXkiLCJBUlJPV19MRUZUIiwib25DbGljayIsInN0b3BQcm9wYWdhdGlvbiIsIkFSUk9XX1JJR0hUIiwiZWxlbWVudCIsIl9zdWJMaXN0IiwicXVlcnlTZWxlY3RvciIsImZvY3VzIiwiX2hlYWRlckJ1dHRvbiIsImRpcyIsImRpc3BhdGNoIiwiY2xlYXJfc2VhcmNoIiwiRU5URVIiLCJTUEFDRSIsInJvb20iLCJ0YWdOYW1lIiwiY29sbGFwc2VkIiwiVW5yZWFkIiwiZG9lc1Jvb21IYXZlVW5yZWFkTWVzc2FnZXMiLCJpc0ludml0ZSIsIlJvb21Ob3RpZnMiLCJnZXRVbnJlYWROb3RpZmljYXRpb25Db3VudCIsIl91cGRhdGVTdWJMaXN0Q291bnQiLCJvblJvb21UaWxlQ2xpY2siLCJlIiwicHJldmVudERlZmF1bHQiLCJmaW5kIiwiZ2V0Um9vbUhhc0JhZGdlIiwiZXh0cmFUaWxlcyIsImdyb3VwIiwiR3JvdXAiLCJncm91cF9pZCIsImdyb3VwSWQiLCJvbkFkZFJvb20iLCJfc2Nyb2xsZXIiLCJjaGVja092ZXJmbG93IiwiaGVpZ2h0Iiwic3R5bGUiLCJfdXBkYXRlTGF6eVJlbmRlckhlaWdodCIsImdldFNjcm9sbFRvcCIsInN0YXJ0QXNIaWRkZW4iLCJzY3JvbGxlckhlaWdodCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJzdHVjayIsInVuZGVmaW5lZCIsIl9nZXRIZWFkZXJKc3giLCJpc0NvbGxhcHNlZCIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJBY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbiIsInN1Ykxpc3ROb3RpZmljYXRpb25zIiwiYWdncmVnYXRlTm90aWZpY2F0aW9uQ291bnQiLCJjb3VudCIsImhpZ2hsaWdodCIsInN1Ykxpc3ROb3RpZkNvdW50Iiwic3ViTGlzdE5vdGlmSGlnaGxpZ2h0IiwidGl0bGUiLCJsYWJlbCIsImluY29taW5nQ2FsbCIsIkluY29taW5nQ2FsbEJveCIsImxlbiIsImNoZXZyb24iLCJjaGV2cm9uQ2xhc3NlcyIsIm9uRm9jdXMiLCJpc0FjdGl2ZSIsInJlZiIsInRhYkluZGV4IiwiYmFkZ2UiLCJiYWRnZUNsYXNzZXMiLCJfb25Ob3RpZkJhZGdlQ2xpY2siLCJGb3JtYXR0aW5nVXRpbHMiLCJmb3JtYXRDb3VudCIsIl9vbkludml0ZUJhZGdlQ2xpY2siLCJhZGRSb29tQnV0dG9uIiwiYWRkUm9vbUxhYmVsIiwib25IZWFkZXJLZXlEb3duIiwiX2NhblVzZUxhenlMaXN0UmVuZGVyaW5nIiwic3ViTGlzdENsYXNzZXMiLCJjb250ZW50IiwiX29uU2Nyb2xsIiwibWFrZVJvb21UaWxlIiwicm9vbVRpbGVzIiwibWFwIiwidGlsZXMiLCJjb25jYXQiLCJzaG93U3Bpbm5lciIsIkxvYWRlciIsIm9uS2V5RG93biIsIlByb3BUeXBlcyIsImFycmF5T2YiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiYm9vbCIsImZ1bmMiLCJub2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWxDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0NBO0FBQ0EsTUFBTUEsS0FBSyxHQUFHLEtBQWQ7O0FBRUEsTUFBTUMscUJBQU4sU0FBb0NDLGVBQU1DLGFBQTFDLENBQXdEO0FBQ3BEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFFQSxTQUFLQyxLQUFMLEdBQWE7QUFDVEMsTUFBQUEsS0FBSyxFQUFFO0FBREUsS0FBYjtBQUdIOztBQUVELFNBQU9DLHdCQUFQLENBQWdDRCxLQUFoQyxFQUF1QztBQUNuQztBQUNBO0FBQ0EsV0FBTztBQUFFQSxNQUFBQTtBQUFGLEtBQVA7QUFDSDs7QUFFREUsRUFBQUEsaUJBQWlCLENBQUNGLEtBQUQsRUFBUTtBQUFFRyxJQUFBQTtBQUFGLEdBQVIsRUFBNEI7QUFDekM7QUFDQTtBQUNBQyxJQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FBY0EsS0FBZDtBQUNBSSxJQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FDSSw2RUFESixFQUVJRyxjQUZKO0FBSUg7O0FBRURFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUksS0FBS04sS0FBTCxDQUFXQyxLQUFmLEVBQXNCO0FBQ2xCLDBCQUFRO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUNILEtBQUtGLEtBQUwsQ0FBV1EsTUFEUixDQUFSO0FBR0gsS0FKRCxNQUlPO0FBQ0gsYUFB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RUFBQUEsYUFBYSxFQUFFLFlBQVcsQ0FDekIsQ0FGaUI7QUFFZjtBQUNIb0MsRUFBQUEsVUFBVSxFQUFFLEVBSE07QUFJbEJULEVBQUFBLFFBQVEsRUFBRTtBQUpRLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uL2luZGV4JztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCAqIGFzIFVucmVhZCBmcm9tICcuLi8uLi9VbnJlYWQnO1xuaW1wb3J0ICogYXMgUm9vbU5vdGlmcyBmcm9tICcuLi8uLi9Sb29tTm90aWZzJztcbmltcG9ydCAqIGFzIEZvcm1hdHRpbmdVdGlscyBmcm9tICcuLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuaW1wb3J0IEluZGljYXRvclNjcm9sbGJhciBmcm9tICcuL0luZGljYXRvclNjcm9sbGJhcic7XG5pbXBvcnQge0tleX0gZnJvbSAnLi4vLi4vS2V5Ym9hcmQnO1xuaW1wb3J0IHsgR3JvdXAgfSBmcm9tICdtYXRyaXgtanMtc2RrJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgUm9vbVRpbGUgZnJvbSBcIi4uL3ZpZXdzL3Jvb21zL1Jvb21UaWxlXCI7XG5pbXBvcnQgTGF6eVJlbmRlckxpc3QgZnJvbSBcIi4uL3ZpZXdzL2VsZW1lbnRzL0xhenlSZW5kZXJMaXN0XCI7XG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQge1JvdmluZ1RhYkluZGV4V3JhcHBlcn0gZnJvbSBcIi4uLy4uL2FjY2Vzc2liaWxpdHkvUm92aW5nVGFiSW5kZXhcIjtcbmltcG9ydCB0b1JlbSBmcm9tIFwiLi4vLi4vdXRpbHMvcmVtXCI7XG5cbi8vIHR1cm4gdGhpcyBvbiBmb3IgZHJvcCAmIGRyYWcgY29uc29sZSBkZWJ1Z2dpbmcgZ2Fsb3JlXG5jb25zdCBkZWJ1ZyA9IGZhbHNlO1xuXG5jbGFzcyBSb29tVGlsZUVycm9yQm91bmRhcnkgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgLy8gU2lkZSBlZmZlY3RzIGFyZSBub3QgcGVybWl0dGVkIGhlcmUsIHNvIHdlIG9ubHkgdXBkYXRlIHRoZSBzdGF0ZSBzb1xuICAgICAgICAvLyB0aGF0IHRoZSBuZXh0IHJlbmRlciBzaG93cyBhbiBlcnJvciBtZXNzYWdlLlxuICAgICAgICByZXR1cm4geyBlcnJvciB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZENhdGNoKGVycm9yLCB7IGNvbXBvbmVudFN0YWNrIH0pIHtcbiAgICAgICAgLy8gQnJvd3NlciBjb25zb2xlcyBhcmUgYmV0dGVyIGF0IGZvcm1hdHRpbmcgb3V0cHV0IHdoZW4gbmF0aXZlIGVycm9ycyBhcmUgcGFzc2VkXG4gICAgICAgIC8vIGluIHRoZWlyIG93biBgY29uc29sZS5lcnJvcmAgaW52b2NhdGlvbi5cbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBcIlRoZSBhYm92ZSBlcnJvciBvY2N1cmVkIHdoaWxlIFJlYWN0IHdhcyByZW5kZXJpbmcgdGhlIGZvbGxvd2luZyBjb21wb25lbnRzOlwiLFxuICAgICAgICAgICAgY29tcG9uZW50U3RhY2ssXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21UaWxlIG14X1Jvb21UaWxlRXJyb3JcIj5cbiAgICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5yb29tSWR9XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuY2hpbGRyZW47XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJvb21TdWJMaXN0IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIGRpc3BsYXlOYW1lID0gJ1Jvb21TdWJMaXN0JztcbiAgICBzdGF0aWMgZGVidWcgPSBkZWJ1ZztcblxuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGxpc3Q6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5vYmplY3QpLmlzUmVxdWlyZWQsXG4gICAgICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHRhZ05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGFkZFJvb21MYWJlbDogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvLyBwYXNzZWQgdGhyb3VnaCB0byBSb29tVGlsZSBhbmQgdXNlZCB0byBoaWdobGlnaHQgcm9vbSB3aXRoIGAhYCByZWdhcmRsZXNzIG9mIG5vdGlmaWNhdGlvbnMgY291bnRcbiAgICAgICAgaXNJbnZpdGU6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIHN0YXJ0QXNIaWRkZW46IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBzaG93U3Bpbm5lcjogUHJvcFR5cGVzLmJvb2wsIC8vIHRydWUgdG8gc2hvdyBhIHNwaW5uZXIgaWYgMCBlbGVtZW50cyB3aGVuIGV4cGFuZGVkXG4gICAgICAgIGNvbGxhcHNlZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCwgLy8gaXMgTGVmdFBhbmVsIGNvbGxhcHNlZD9cbiAgICAgICAgb25IZWFkZXJDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIGluY29taW5nQ2FsbDogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgZXh0cmFUaWxlczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLm5vZGUpLCAvLyBleHRyYSBlbGVtZW50cyBhZGRlZCBiZW5lYXRoIHRpbGVzXG4gICAgICAgIGZvcmNlRXhwYW5kOiBQcm9wVHlwZXMuYm9vbCxcbiAgICB9O1xuXG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgb25IZWFkZXJDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIH0sIC8vIE5PUFxuICAgICAgICBleHRyYVRpbGVzOiBbXSxcbiAgICAgICAgaXNJbnZpdGU6IGZhbHNlLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKHByb3BzLCBzdGF0ZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbGlzdExlbmd0aDogcHJvcHMubGlzdC5sZW5ndGgsXG4gICAgICAgICAgICBzY3JvbGxUb3A6IHByb3BzLmxpc3QubGVuZ3RoID09PSBzdGF0ZS5saXN0TGVuZ3RoID8gc3RhdGUuc2Nyb2xsVG9wIDogMCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGhpZGRlbjogdGhpcy5wcm9wcy5zdGFydEFzSGlkZGVuIHx8IGZhbHNlLFxuICAgICAgICAgICAgLy8gc29tZSB2YWx1ZXMgdG8gZ2V0IExhenlSZW5kZXJMaXN0IHN0YXJ0aW5nXG4gICAgICAgICAgICBzY3JvbGxlckhlaWdodDogODAwLFxuICAgICAgICAgICAgc2Nyb2xsVG9wOiAwLFxuICAgICAgICAgICAgLy8gUmVhY3QgMTYncyBnZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMocHJvcHMsIHN0YXRlKSBkb2Vzbid0IGdpdmUgdGhlIHByZXZpb3VzIHByb3BzIHNvXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBsZW5ndGggb2YgdGhlIGxpc3QgaGVyZSBzbyB3ZSBjYW4gc2VlIGlmIGl0J3MgY2hhbmdlZCBvciBub3QuLi5cbiAgICAgICAgICAgIGxpc3RMZW5ndGg6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5faGVhZGVyID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIHRoaXMuX3N1Ykxpc3QgPSBjcmVhdGVSZWYoKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsZXIgPSBjcmVhdGVSZWYoKTtcbiAgICAgICAgdGhpcy5faGVhZGVyQnV0dG9uID0gY3JlYXRlUmVmKCk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgaGVhZGVyIGlzIGNvbGxhcHNpYmxlIGlmIGl0IGlzIGhpZGRlbiBvciBub3Qgc3R1Y2tcbiAgICAvLyBUaGUgZGF0YXNldCBlbGVtZW50cyBhcmUgYWRkZWQgaW4gdGhlIFJvb21MaXN0IF9pbml0QW5kUG9zaXRpb25TdGlja3lIZWFkZXJzIG1ldGhvZFxuICAgIGlzQ29sbGFwc2libGVPbkNsaWNrKCkge1xuICAgICAgICBjb25zdCBzdHVjayA9IHRoaXMuX2hlYWRlci5jdXJyZW50LmRhdGFzZXQuc3R1Y2s7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5mb3JjZUV4cGFuZCAmJiAodGhpcy5zdGF0ZS5oaWRkZW4gfHwgc3R1Y2sgPT09IHVuZGVmaW5lZCB8fCBzdHVjayA9PT0gXCJub25lXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQWN0aW9uID0gKHBheWxvYWQpID0+IHtcbiAgICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnb25fcm9vbV9yZWFkJzpcbiAgICAgICAgICAgICAgICAvLyBYWFg6IFByZXZpb3VzbHkgUm9vbUxpc3Qgd291bGQgZm9yY2VVcGRhdGUgd2hlbmV2ZXIgb25fcm9vbV9yZWFkIGlzIGRpc3BhdGNoZWQsXG4gICAgICAgICAgICAgICAgLy8gYnV0IHRoaXMgaXMgbm8gbG9uZ2VyIHRydWUsIHNvIHdlIG11c3QgZG8gaXQgaGVyZSAoYW5kIGNhbiBhcHBseSB0aGUgc21hbGxcbiAgICAgICAgICAgICAgICAvLyBvcHRpbWlzYXRpb24gb2YgY2hlY2tpbmcgdGhhdCB3ZSBjYXJlIGFib3V0IHRoZSByb29tIGJlaW5nIHJlYWQpLlxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gVWx0aW1hdGVseSB3ZSBuZWVkIHRvIHRyYW5zaXRpb24gdG8gYSBzdGF0ZSBwdXNoaW5nIGZsb3cgd2hlcmUgc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgLy8gZXhwbGljaXRseSBub3RpZmllcyB0aGUgY29tcG9uZW50cyBjb25jZXJuZWQgdGhhdCB0aGUgbm90aWYgY291bnQgZm9yIGEgcm9vbVxuICAgICAgICAgICAgICAgIC8vIGhhcyBjaGFuZ2UgKGUuZy4gYSBGbHV4IHN0b3JlKS5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5saXN0LnNvbWUoKHIpID0+IHIucm9vbUlkID09PSBwYXlsb2FkLnJvb21JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAndmlld19yb29tJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5oaWRkZW4gJiYgIXRoaXMucHJvcHMuZm9yY2VFeHBhbmQgJiYgcGF5bG9hZC5zaG93X3Jvb21fdGlsZSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmxpc3Quc29tZSgocikgPT4gci5yb29tSWQgPT09IHBheWxvYWQucm9vbV9pZClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdG9nZ2xlID0gKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc0NvbGxhcHNpYmxlT25DbGljaygpKSB7XG4gICAgICAgICAgICAvLyBUaGUgaGVhZGVyIGlzQ29sbGFwc2libGUsIHNvIHRoZSBjbGljayBpcyB0byBiZSBpbnRlcnByZXRlZCBhcyBjb2xsYXBzZSBhbmQgdHJ1bmNhdGlvbiBsb2dpY1xuICAgICAgICAgICAgY29uc3QgaXNIaWRkZW4gPSAhdGhpcy5zdGF0ZS5oaWRkZW47XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtoaWRkZW46IGlzSGlkZGVufSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25IZWFkZXJDbGljayhpc0hpZGRlbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoZSBoZWFkZXIgaXMgc3R1Y2ssIHNvIHRoZSBjbGljayBpcyB0byBiZSBpbnRlcnByZXRlZCBhcyBhIHNjcm9sbCB0byB0aGUgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uSGVhZGVyQ2xpY2sodGhpcy5zdGF0ZS5oaWRkZW4sIHRoaXMuX2hlYWRlci5jdXJyZW50LmRhdGFzZXQub3JpZ2luYWxQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25DbGljayA9IChldikgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgIH07XG5cbiAgICBvbkhlYWRlcktleURvd24gPSAoZXYpID0+IHtcbiAgICAgICAgc3dpdGNoIChldi5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgS2V5LkFSUk9XX0xFRlQ6XG4gICAgICAgICAgICAgICAgLy8gT24gQVJST1dfTEVGVCBjb2xsYXBzZSB0aGUgcm9vbSBzdWJsaXN0XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmhpZGRlbiAmJiAhdGhpcy5wcm9wcy5mb3JjZUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2xpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEtleS5BUlJPV19SSUdIVDoge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmhpZGRlbiAmJiAhdGhpcy5wcm9wcy5mb3JjZUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzdWJsaXN0IGlzIGNvbGxhcHNlZCwgZXhwYW5kIGl0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbGljaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucHJvcHMuZm9yY2VFeHBhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3VibGlzdCBpcyBleHBhbmRlZCwgZ28gdG8gZmlyc3Qgcm9vbVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fc3ViTGlzdC5jdXJyZW50ICYmIHRoaXMuX3N1Ykxpc3QuY3VycmVudC5xdWVyeVNlbGVjdG9yKFwiLm14X1Jvb21UaWxlXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uS2V5RG93biA9IChldikgPT4ge1xuICAgICAgICBzd2l0Y2ggKGV2LmtleSkge1xuICAgICAgICAgICAgLy8gT24gQVJST1dfTEVGVCBnbyB0byB0aGUgc3VibGlzdCBoZWFkZXJcbiAgICAgICAgICAgIGNhc2UgS2V5LkFSUk9XX0xFRlQ6XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faGVhZGVyQnV0dG9uLmN1cnJlbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIENvbnN1bWUgQVJST1dfUklHSFQgc28gaXQgZG9lc24ndCBjYXVzZSBmb2N1cyB0byBnZXQgc2VudCB0byBjb21wb3NlclxuICAgICAgICAgICAgY2FzZSBLZXkuQVJST1dfUklHSFQ6XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Sb29tVGlsZUNsaWNrID0gKHJvb21JZCwgZXYpID0+IHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICBzaG93X3Jvb21fdGlsZTogdHJ1ZSwgLy8gdG8gbWFrZSBzdXJlIHRoZSByb29tIGdldHMgc2Nyb2xsZWQgaW50byB2aWV3XG4gICAgICAgICAgICByb29tX2lkOiByb29tSWQsXG4gICAgICAgICAgICBjbGVhcl9zZWFyY2g6IChldiAmJiAoZXYua2V5ID09PSBLZXkuRU5URVIgfHwgZXYua2V5ID09PSBLZXkuU1BBQ0UpKSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF91cGRhdGVTdWJMaXN0Q291bnQgPSAoKSA9PiB7XG4gICAgICAgIC8vIEZvcmNlIGFuIHVwZGF0ZSBieSBzZXR0aW5nIHRoZSBzdGF0ZSB0byB0aGUgY3VycmVudCBzdGF0ZVxuICAgICAgICAvLyBEb2luZyBpdCB0aGlzIHdheSByYXRoZXIgdGhhbiB1c2luZyBmb3JjZVVwZGF0ZSgpLCBzbyB0aGF0IHRoZSBzaG91bGRDb21wb25lbnRVcGRhdGUoKVxuICAgICAgICAvLyBtZXRob2QgaXMgaG9ub3VyZWRcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLnN0YXRlKTtcbiAgICB9O1xuXG4gICAgbWFrZVJvb21UaWxlID0gKHJvb20pID0+IHtcbiAgICAgICAgcmV0dXJuIDxSb29tVGlsZUVycm9yQm91bmRhcnkgcm9vbUlkPXtyb29tLnJvb21JZH0+PFJvb21UaWxlXG4gICAgICAgICAgICByb29tPXtyb29tfVxuICAgICAgICAgICAgcm9vbVN1Ykxpc3Q9e3RoaXN9XG4gICAgICAgICAgICB0YWdOYW1lPXt0aGlzLnByb3BzLnRhZ05hbWV9XG4gICAgICAgICAgICBrZXk9e3Jvb20ucm9vbUlkfVxuICAgICAgICAgICAgY29sbGFwc2VkPXt0aGlzLnByb3BzLmNvbGxhcHNlZCB8fCBmYWxzZX1cbiAgICAgICAgICAgIHVucmVhZD17VW5yZWFkLmRvZXNSb29tSGF2ZVVucmVhZE1lc3NhZ2VzKHJvb20pfVxuICAgICAgICAgICAgaGlnaGxpZ2h0PXt0aGlzLnByb3BzLmlzSW52aXRlIHx8IFJvb21Ob3RpZnMuZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQocm9vbSwgJ2hpZ2hsaWdodCcpID4gMH1cbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbkNvdW50PXtSb29tTm90aWZzLmdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50KHJvb20pfVxuICAgICAgICAgICAgaXNJbnZpdGU9e3RoaXMucHJvcHMuaXNJbnZpdGV9XG4gICAgICAgICAgICByZWZyZXNoU3ViTGlzdD17dGhpcy5fdXBkYXRlU3ViTGlzdENvdW50fVxuICAgICAgICAgICAgaW5jb21pbmdDYWxsPXtudWxsfVxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblJvb21UaWxlQ2xpY2t9XG4gICAgICAgIC8+PC9Sb29tVGlsZUVycm9yQm91bmRhcnk+O1xuICAgIH07XG5cbiAgICBfb25Ob3RpZkJhZGdlQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICAvLyBwcmV2ZW50IHRoZSByb29tc3VibGlzdCBjb2xsYXBzaW5nXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3Qgcm9vbSA9IHRoaXMucHJvcHMubGlzdC5maW5kKHJvb20gPT4gUm9vbU5vdGlmcy5nZXRSb29tSGFzQmFkZ2Uocm9vbSkpO1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IHJvb20ucm9vbUlkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uSW52aXRlQmFkZ2VDbGljayA9IChlKSA9PiB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhlIHJvb21zdWJsaXN0IGNvbGxhcHNpbmdcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBzd2l0Y2ggdG8gZmlyc3Qgcm9vbSBpbiBzb3J0ZWRMaXN0IGFzIHRoYXQnbGwgYmUgdGhlIHRvcCBvZiB0aGUgbGlzdCBmb3IgdGhlIHVzZXJcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubGlzdCAmJiB0aGlzLnByb3BzLmxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IHRoaXMucHJvcHMubGlzdFswXS5yb29tSWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmV4dHJhVGlsZXMgJiYgdGhpcy5wcm9wcy5leHRyYVRpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIEdyb3VwIEludml0ZXMgYXJlIGRpZmZlcmVudCBpbiB0aGF0IHRoZXkgYXJlIGFsbCBleHRyYSB0aWxlcyBhbmQgbm90IHJvb21zXG4gICAgICAgICAgICAvLyBYWFg6IHRoaXMgaXMgYSBob3JyaWJsZSBzcGVjaWFsIGNhc2UgYmVjYXVzZSBHcm91cCBJbnZpdGUgc3VibGlzdCBpcyBhIGhhY2tcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmV4dHJhVGlsZXNbMF0ucHJvcHMgJiYgdGhpcy5wcm9wcy5leHRyYVRpbGVzWzBdLnByb3BzLmdyb3VwIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd2aWV3X2dyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IHRoaXMucHJvcHMuZXh0cmFUaWxlc1swXS5wcm9wcy5ncm91cC5ncm91cElkLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uQWRkUm9vbSA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQWRkUm9vbSkgdGhpcy5wcm9wcy5vbkFkZFJvb20oKTtcbiAgICB9O1xuXG4gICAgX2dldEhlYWRlckpzeChpc0NvbGxhcHNlZCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVUb29sdGlwQnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IHN1Ykxpc3ROb3RpZmljYXRpb25zID0gIXRoaXMucHJvcHMuaXNJbnZpdGUgP1xuICAgICAgICAgICAgUm9vbU5vdGlmcy5hZ2dyZWdhdGVOb3RpZmljYXRpb25Db3VudCh0aGlzLnByb3BzLmxpc3QpIDpcbiAgICAgICAgICAgIHtjb3VudDogMCwgaGlnaGxpZ2h0OiB0cnVlfTtcbiAgICAgICAgY29uc3Qgc3ViTGlzdE5vdGlmQ291bnQgPSBzdWJMaXN0Tm90aWZpY2F0aW9ucy5jb3VudDtcbiAgICAgICAgY29uc3Qgc3ViTGlzdE5vdGlmSGlnaGxpZ2h0ID0gc3ViTGlzdE5vdGlmaWNhdGlvbnMuaGlnaGxpZ2h0O1xuXG4gICAgICAgIC8vIFdoZW4gY29sbGFwc2VkLCBhbGxvdyBhIGxvbmcgaG92ZXIgb24gdGhlIGhlYWRlciB0byBzaG93IHVzZXJcbiAgICAgICAgLy8gdGhlIGZ1bGwgdGFnIG5hbWUgYW5kIHJvb20gY291bnRcbiAgICAgICAgbGV0IHRpdGxlO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5jb2xsYXBzZWQpIHtcbiAgICAgICAgICAgIHRpdGxlID0gdGhpcy5wcm9wcy5sYWJlbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmNvbWluZ0NhbGw7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmluY29taW5nQ2FsbCkge1xuICAgICAgICAgICAgLy8gV2UgY2FuIGFzc3VtZSB0aGF0IGlmIHdlIGhhdmUgYW4gaW5jb21pbmcgY2FsbCB0aGVuIGl0IGlzIGZvciB0aGlzIGxpc3RcbiAgICAgICAgICAgIGNvbnN0IEluY29taW5nQ2FsbEJveCA9IHNkay5nZXRDb21wb25lbnQoXCJ2b2lwLkluY29taW5nQ2FsbEJveFwiKTtcbiAgICAgICAgICAgIGluY29taW5nQ2FsbCA9XG4gICAgICAgICAgICAgICAgPEluY29taW5nQ2FsbEJveCBjbGFzc05hbWU9XCJteF9Sb29tU3ViTGlzdF9pbmNvbWluZ0NhbGxcIiBpbmNvbWluZ0NhbGw9e3RoaXMucHJvcHMuaW5jb21pbmdDYWxsfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlbiA9IHRoaXMucHJvcHMubGlzdC5sZW5ndGggKyB0aGlzLnByb3BzLmV4dHJhVGlsZXMubGVuZ3RoO1xuICAgICAgICBsZXQgY2hldnJvbjtcbiAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgY29uc3QgY2hldnJvbkNsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICAnbXhfUm9vbVN1Ykxpc3RfY2hldnJvbic6IHRydWUsXG4gICAgICAgICAgICAgICAgJ214X1Jvb21TdWJMaXN0X2NoZXZyb25SaWdodCc6IGlzQ29sbGFwc2VkLFxuICAgICAgICAgICAgICAgICdteF9Sb29tU3ViTGlzdF9jaGV2cm9uRG93bic6ICFpc0NvbGxhcHNlZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2hldnJvbiA9ICg8ZGl2IGNsYXNzTmFtZT17Y2hldnJvbkNsYXNzZXN9IC8+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8Um92aW5nVGFiSW5kZXhXcmFwcGVyIGlucHV0UmVmPXt0aGlzLl9oZWFkZXJCdXR0b259PlxuICAgICAgICAgICAgeyh7b25Gb2N1cywgaXNBY3RpdmUsIHJlZn0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YWJJbmRleCA9IGlzQWN0aXZlID8gMCA6IC0xO1xuXG4gICAgICAgICAgICAgICAgbGV0IGJhZGdlO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5wcm9wcy5jb2xsYXBzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFkZ2VDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbXhfUm9vbVN1Ykxpc3RfYmFkZ2UnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ214X1Jvb21TdWJMaXN0X2JhZGdlSGlnaGxpZ2h0Jzogc3ViTGlzdE5vdGlmSGlnaGxpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gV3JhcCB0aGUgY29udGVudHMgaW4gYSBkaXYgYW5kIGFwcGx5IHN0eWxlcyB0byB0aGUgY2hpbGQgZGl2IHNvIHRoYXQgdGhlIGJyb3dzZXIgZGVmYXVsdCBvdXRsaW5lIHdvcmtzXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWJMaXN0Tm90aWZDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhZGdlID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PXt0YWJJbmRleH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtiYWRnZUNsYXNzZXN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uTm90aWZCYWRnZUNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtfdChcIkp1bXAgdG8gZmlyc3QgdW5yZWFkIHJvb20uXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgRm9ybWF0dGluZ1V0aWxzLmZvcm1hdENvdW50KHN1Ykxpc3ROb3RpZkNvdW50KSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5pc0ludml0ZSAmJiB0aGlzLnByb3BzLmxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBub3RpZmljYXRpb25zIGJ1dCBoaWdobGlnaHQgYW55d2F5IGJlY2F1c2UgdGhpcyBpcyBhbiBpbnZpdGUgYmFkZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhZGdlID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PXt0YWJJbmRleH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtiYWRnZUNsYXNzZXN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uSW52aXRlQmFkZ2VDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17X3QoXCJKdW1wIHRvIGZpcnN0IGludml0ZS5cIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLmxpc3QubGVuZ3RoIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBhZGRSb29tQnV0dG9uO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm9uQWRkUm9vbSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRSb29tQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVUb29sdGlwQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9e3RhYkluZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25BZGRSb29tfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21TdWJMaXN0X2FkZFJvb21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXt0aGlzLnByb3BzLmFkZFJvb21MYWJlbCB8fCBfdChcIkFkZCByb29tXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21TdWJMaXN0X2xhYmVsQ29udGFpbmVyXCIgdGl0bGU9e3RpdGxlfSByZWY9e3RoaXMuX2hlYWRlcn0gb25LZXlEb3duPXt0aGlzLm9uSGVhZGVyS2V5RG93bn0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9e29uRm9jdXN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9e3RhYkluZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UmVmPXtyZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21TdWJMaXN0X2xhYmVsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXshaXNDb2xsYXBzZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cInRyZWVpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWxldmVsPVwiMVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBjaGV2cm9uIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57dGhpcy5wcm9wcy5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpbmNvbWluZ0NhbGwgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBiYWRnZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGFkZFJvb21CdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSB9XG4gICAgICAgIDwvUm92aW5nVGFiSW5kZXhXcmFwcGVyPjtcbiAgICB9XG5cbiAgICBjaGVja092ZXJmbG93ID0gKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsZXIuY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsZXIuY3VycmVudC5jaGVja092ZXJmbG93KCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2V0SGVpZ2h0ID0gKGhlaWdodCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fc3ViTGlzdC5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9zdWJMaXN0LmN1cnJlbnQuc3R5bGUuaGVpZ2h0ID0gdG9SZW0oaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVMYXp5UmVuZGVySGVpZ2h0KGhlaWdodCk7XG4gICAgfTtcblxuICAgIF91cGRhdGVMYXp5UmVuZGVySGVpZ2h0KGhlaWdodCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzY3JvbGxlckhlaWdodDogaGVpZ2h0fSk7XG4gICAgfVxuXG4gICAgX29uU2Nyb2xsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzY3JvbGxUb3A6IHRoaXMuX3Njcm9sbGVyLmN1cnJlbnQuZ2V0U2Nyb2xsVG9wKCl9KTtcbiAgICB9O1xuXG4gICAgX2NhblVzZUxhenlMaXN0UmVuZGVyaW5nKCkge1xuICAgICAgICAvLyBmb3Igbm93IGRpc2FibGUgbGF6eSByZW5kZXJpbmcgYXMgdGhleSBhcmUgYWxyZWFkeSByZW5kZXJlZCB0aWxlc1xuICAgICAgICAvLyBub3Qgcm9vbXMgbGlrZSBwcm9wcy5saXN0IHdlIHBhc3MgdG8gTGF6eVJlbmRlckxpc3RcbiAgICAgICAgcmV0dXJuICF0aGlzLnByb3BzLmV4dHJhVGlsZXMgfHwgIXRoaXMucHJvcHMuZXh0cmFUaWxlcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBsZW4gPSB0aGlzLnByb3BzLmxpc3QubGVuZ3RoICsgdGhpcy5wcm9wcy5leHRyYVRpbGVzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgaXNDb2xsYXBzZWQgPSB0aGlzLnN0YXRlLmhpZGRlbiAmJiAhdGhpcy5wcm9wcy5mb3JjZUV4cGFuZDtcblxuICAgICAgICBjb25zdCBzdWJMaXN0Q2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgXCJteF9Sb29tU3ViTGlzdFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJteF9Sb29tU3ViTGlzdF9oaWRkZW5cIjogbGVuICYmIGlzQ29sbGFwc2VkLFxuICAgICAgICAgICAgXCJteF9Sb29tU3ViTGlzdF9ub25FbXB0eVwiOiBsZW4gJiYgIWlzQ29sbGFwc2VkLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgY29udGVudDtcbiAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgaWYgKGlzQ29sbGFwc2VkKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gYm9keVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jYW5Vc2VMYXp5TGlzdFJlbmRlcmluZygpKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICAgICAgPEluZGljYXRvclNjcm9sbGJhciByZWY9e3RoaXMuX3Njcm9sbGVyfSBjbGFzc05hbWU9XCJteF9Sb29tU3ViTGlzdF9zY3JvbGxcIiBvblNjcm9sbD17dGhpcy5fb25TY3JvbGx9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPExhenlSZW5kZXJMaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVG9wPXt0aGlzLnN0YXRlLnNjcm9sbFRvcCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PXsgdGhpcy5zdGF0ZS5zY3JvbGxlckhlaWdodCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVySXRlbT17IHRoaXMubWFrZVJvb21UaWxlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtSGVpZ2h0PXszNH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcz17IHRoaXMucHJvcHMubGlzdCB9IC8+XG4gICAgICAgICAgICAgICAgICAgIDwvSW5kaWNhdG9yU2Nyb2xsYmFyPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb21UaWxlcyA9IHRoaXMucHJvcHMubGlzdC5tYXAociA9PiB0aGlzLm1ha2VSb29tVGlsZShyKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlsZXMgPSByb29tVGlsZXMuY29uY2F0KHRoaXMucHJvcHMuZXh0cmFUaWxlcyk7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICAgICAgPEluZGljYXRvclNjcm9sbGJhciByZWY9e3RoaXMuX3Njcm9sbGVyfSBjbGFzc05hbWU9XCJteF9Sb29tU3ViTGlzdF9zY3JvbGxcIiBvblNjcm9sbD17dGhpcy5fb25TY3JvbGx9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aWxlcyB9XG4gICAgICAgICAgICAgICAgICAgIDwvSW5kaWNhdG9yU2Nyb2xsYmFyPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5zaG93U3Bpbm5lciAmJiAhaXNDb2xsYXBzZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gPExvYWRlciAvPjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9zdWJMaXN0fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17c3ViTGlzdENsYXNzZXN9XG4gICAgICAgICAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXt0aGlzLnByb3BzLmxhYmVsfVxuICAgICAgICAgICAgICAgIG9uS2V5RG93bj17dGhpcy5vbktleURvd259XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgeyB0aGlzLl9nZXRIZWFkZXJKc3goaXNDb2xsYXBzZWQpIH1cbiAgICAgICAgICAgICAgICB7IGNvbnRlbnQgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19