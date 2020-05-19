"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Keyboard = require("../../Keyboard");

var _Timer = _interopRequireDefault(require("../../utils/Timer"));

var _AutoHideScrollbar = _interopRequireDefault(require("./AutoHideScrollbar"));

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
const DEBUG_SCROLL = false; // The amount of extra scroll distance to allow prior to unfilling.
// See _getExcessHeight.

const UNPAGINATION_PADDING = 6000; // The number of milliseconds to debounce calls to onUnfillRequest, to prevent
// many scroll events causing many unfilling requests.

const UNFILL_REQUEST_DEBOUNCE_MS = 200; // _updateHeight makes the height a ceiled multiple of this so we
// don't have to update the height too often. It also allows the user
// to scroll past the pagination spinner a bit so they don't feel blocked so
// much while the content loads.

const PAGE_SIZE = 400;
let debuglog;

if (DEBUG_SCROLL) {
  // using bind means that we get to keep useful line numbers in the console
  debuglog = console.log.bind(console, "ScrollPanel debuglog:");
} else {
  debuglog = function () {};
}
/* This component implements an intelligent scrolling list.
 *
 * It wraps a list of <li> children; when items are added to the start or end
 * of the list, the scroll position is updated so that the user still sees the
 * same position in the list.
 *
 * It also provides a hook which allows parents to provide more list elements
 * when we get close to the start or end of the list.
 *
 * Each child element should have a 'data-scroll-tokens'. This string of
 * comma-separated tokens may contain a single token or many, where many indicates
 * that the element contains elements that have scroll tokens themselves. The first
 * token in 'data-scroll-tokens' is used to serialise the scroll state, and returned
 * as the 'trackedScrollToken' attribute by getScrollState().
 *
 * IMPORTANT: INDIVIDUAL TOKENS WITHIN 'data-scroll-tokens' MUST NOT CONTAIN COMMAS.
 *
 * Some notes about the implementation:
 *
 * The saved 'scrollState' can exist in one of two states:
 *
 *   - stuckAtBottom: (the default, and restored by resetScrollState): the
 *     viewport is scrolled down as far as it can be. When the children are
 *     updated, the scroll position will be updated to ensure it is still at
 *     the bottom.
 *
 *   - fixed, in which the viewport is conceptually tied at a specific scroll
 *     offset.  We don't save the absolute scroll offset, because that would be
 *     affected by window width, zoom level, amount of scrollback, etc. Instead
 *     we save an identifier for the last fully-visible message, and the number
 *     of pixels the window was scrolled below it - which is hopefully near
 *     enough.
 *
 * The 'stickyBottom' property controls the behaviour when we reach the bottom
 * of the window (either through a user-initiated scroll, or by calling
 * scrollToBottom). If stickyBottom is enabled, the scrollState will enter
 * 'stuckAtBottom' state - ensuring that new additions cause the window to
 * scroll down further. If stickyBottom is disabled, we just save the scroll
 * offset as normal.
 */


var _default = (0, _createReactClass.default)({
  displayName: 'ScrollPanel',
  propTypes: {
    /* stickyBottom: if set to true, then once the user hits the bottom of
     * the list, any new children added to the list will cause the list to
     * scroll down to show the new element, rather than preserving the
     * existing view.
     */
    stickyBottom: _propTypes.default.bool,

    /* startAtBottom: if set to true, the view is assumed to start
     * scrolled to the bottom.
     * XXX: It's likley this is unecessary and can be derived from
     * stickyBottom, but I'm adding an extra parameter to ensure
     * behaviour stays the same for other uses of ScrollPanel.
     * If so, let's remove this parameter down the line.
     */
    startAtBottom: _propTypes.default.bool,

    /* onFillRequest(backwards): a callback which is called on scroll when
     * the user nears the start (backwards = true) or end (backwards =
     * false) of the list.
     *
     * This should return a promise; no more calls will be made until the
     * promise completes.
     *
     * The promise should resolve to true if there is more data to be
     * retrieved in this direction (in which case onFillRequest may be
     * called again immediately), or false if there is no more data in this
     * directon (at this time) - which will stop the pagination cycle until
     * the user scrolls again.
     */
    onFillRequest: _propTypes.default.func,

    /* onUnfillRequest(backwards): a callback which is called on scroll when
     * there are children elements that are far out of view and could be removed
     * without causing pagination to occur.
     *
     * This function should accept a boolean, which is true to indicate the back/top
     * of the panel and false otherwise, and a scroll token, which refers to the
     * first element to remove if removing from the front/bottom, and last element
     * to remove if removing from the back/top.
     */
    onUnfillRequest: _propTypes.default.func,

    /* onScroll: a callback which is called whenever any scroll happens.
     */
    onScroll: _propTypes.default.func,

    /* className: classnames to add to the top-level div
     */
    className: _propTypes.default.string,

    /* style: styles to add to the top-level div
     */
    style: _propTypes.default.object,

    /* resizeNotifier: ResizeNotifier to know when middle column has changed size
     */
    resizeNotifier: _propTypes.default.object
  },
  getDefaultProps: function () {
    return {
      stickyBottom: true,
      startAtBottom: true,
      onFillRequest: function (backwards) {
        return Promise.resolve(false);
      },
      onUnfillRequest: function (backwards, scrollToken) {},
      onScroll: function () {}
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._pendingFillRequests = {
      b: null,
      f: null
    };

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.on("middlePanelResized", this.onResize);
    }

    this.resetScrollState();
    this._itemlist = (0, _react.createRef)();
  },
  componentDidMount: function () {
    this.checkScroll();
  },
  componentDidUpdate: function () {
    // after adding event tiles, we may need to tweak the scroll (either to
    // keep at the bottom of the timeline, or to maintain the view after
    // adding events to the top).
    //
    // This will also re-check the fill state, in case the paginate was inadequate
    this.checkScroll();
    this.updatePreventShrinking();
  },
  componentWillUnmount: function () {
    // set a boolean to say we've been unmounted, which any pending
    // promises can use to throw away their results.
    //
    // (We could use isMounted(), but facebook have deprecated that.)
    this.unmounted = true;

    if (this.props.resizeNotifier) {
      this.props.resizeNotifier.removeListener("middlePanelResized", this.onResize);
    }
  },
  onScroll: function (ev) {
    debuglog("onScroll", this._getScrollNode().scrollTop);

    this._scrollTimeout.restart();

    this._saveScrollState();

    this.updatePreventShrinking();
    this.props.onScroll(ev);
    this.checkFillState();
  },
  onResize: function () {
    this.checkScroll(); // update preventShrinkingState if present

    if (this.preventShrinkingState) {
      this.preventShrinking();
    }
  },
  // after an update to the contents of the panel, check that the scroll is
  // where it ought to be, and set off pagination requests if necessary.
  checkScroll: function () {
    if (this.unmounted) {
      return;
    }

    this._restoreSavedScrollState();

    this.checkFillState();
  },
  // return true if the content is fully scrolled down right now; else false.
  //
  // note that this is independent of the 'stuckAtBottom' state - it is simply
  // about whether the content is scrolled down right now, irrespective of
  // whether it will stay that way when the children update.
  isAtBottom: function () {
    const sn = this._getScrollNode(); // fractional values (both too big and too small)
    // for scrollTop happen on certain browsers/platforms
    // when scrolled all the way down. E.g. Chrome 72 on debian.
    // so check difference <= 1;


    return Math.abs(sn.scrollHeight - (sn.scrollTop + sn.clientHeight)) <= 1;
  },
  // returns the vertical height in the given direction that can be removed from
  // the content box (which has a height of scrollHeight, see checkFillState) without
  // pagination occuring.
  //
  // padding* = UNPAGINATION_PADDING
  //
  // ### Region determined as excess.
  //
  //   .---------.                        -              -
  //   |#########|                        |              |
  //   |#########|   -                    |  scrollTop   |
  //   |         |   | padding*           |              |
  //   |         |   |                    |              |
  // .-+---------+-. -  -                 |              |
  // : |         | :    |                 |              |
  // : |         | :    |  clientHeight   |              |
  // : |         | :    |                 |              |
  // .-+---------+-.    -                 -              |
  // | |         | |    |                                |
  // | |         | |    |  clientHeight                  | scrollHeight
  // | |         | |    |                                |
  // `-+---------+-'    -                                |
  // : |         | :    |                                |
  // : |         | :    |  clientHeight                  |
  // : |         | :    |                                |
  // `-+---------+-' -  -                                |
  //   |         |   | padding*                          |
  //   |         |   |                                   |
  //   |#########|   -                                   |
  //   |#########|                                       |
  //   `---------'                                       -
  _getExcessHeight: function (backwards) {
    const sn = this._getScrollNode();

    const contentHeight = this._getMessagesHeight();

    const listHeight = this._getListHeight();

    const clippedHeight = contentHeight - listHeight;
    const unclippedScrollTop = sn.scrollTop + clippedHeight;

    if (backwards) {
      return unclippedScrollTop - sn.clientHeight - UNPAGINATION_PADDING;
    } else {
      return contentHeight - (unclippedScrollTop + 2 * sn.clientHeight) - UNPAGINATION_PADDING;
    }
  },
  // check the scroll state and send out backfill requests if necessary.
  checkFillState: async function (depth = 0) {
    if (this.unmounted) {
      return;
    }

    const isFirstCall = depth === 0;

    const sn = this._getScrollNode(); // if there is less than a screenful of messages above or below the
    // viewport, try to get some more messages.
    //
    // scrollTop is the number of pixels between the top of the content and
    //     the top of the viewport.
    //
    // scrollHeight is the total height of the content.
    //
    // clientHeight is the height of the viewport (excluding borders,
    // margins, and scrollbars).
    //
    //
    //   .---------.          -                 -
    //   |         |          |  scrollTop      |
    // .-+---------+-.    -   -                 |
    // | |         | |    |                     |
    // | |         | |    |  clientHeight       | scrollHeight
    // | |         | |    |                     |
    // `-+---------+-'    -                     |
    //   |         |                            |
    //   |         |                            |
    //   `---------'                            -
    //
    // as filling is async and recursive,
    // don't allow more than 1 chain of calls concurrently
    // do make a note when a new request comes in while already running one,
    // so we can trigger a new chain of calls once done.


    if (isFirstCall) {
      if (this._isFilling) {
        debuglog("_isFilling: not entering while request is ongoing, marking for a subsequent request");
        this._fillRequestWhileRunning = true;
        return;
      }

      debuglog("_isFilling: setting");
      this._isFilling = true;
    }

    const itemlist = this._itemlist.current;
    const firstTile = itemlist && itemlist.firstElementChild;
    const contentTop = firstTile && firstTile.offsetTop;
    const fillPromises = []; // if scrollTop gets to 1 screen from the top of the first tile,
    // try backward filling

    if (!firstTile || sn.scrollTop - contentTop < sn.clientHeight) {
      // need to back-fill
      fillPromises.push(this._maybeFill(depth, true));
    } // if scrollTop gets to 2 screens from the end (so 1 screen below viewport),
    // try forward filling


    if (sn.scrollHeight - sn.scrollTop < sn.clientHeight * 2) {
      // need to forward-fill
      fillPromises.push(this._maybeFill(depth, false));
    }

    if (fillPromises.length) {
      try {
        await Promise.all(fillPromises);
      } catch (err) {
        console.error(err);
      }
    }

    if (isFirstCall) {
      debuglog("_isFilling: clearing");
      this._isFilling = false;
    }

    if (this._fillRequestWhileRunning) {
      this._fillRequestWhileRunning = false;
      this.checkFillState();
    }
  },
  // check if unfilling is possible and send an unfill request if necessary
  _checkUnfillState: function (backwards) {
    let excessHeight = this._getExcessHeight(backwards);

    if (excessHeight <= 0) {
      return;
    }

    const origExcessHeight = excessHeight;
    const tiles = this._itemlist.current.children; // The scroll token of the first/last tile to be unpaginated

    let markerScrollToken = null; // Subtract heights of tiles to simulate the tiles being unpaginated until the
    // excess height is less than the height of the next tile to subtract. This
    // prevents excessHeight becoming negative, which could lead to future
    // pagination.
    //
    // If backwards is true, we unpaginate (remove) tiles from the back (top).

    let tile;

    for (let i = 0; i < tiles.length; i++) {
      tile = tiles[backwards ? i : tiles.length - 1 - i]; // Subtract height of tile as if it were unpaginated

      excessHeight -= tile.clientHeight; //If removing the tile would lead to future pagination, break before setting scroll token

      if (tile.clientHeight > excessHeight) {
        break;
      } // The tile may not have a scroll token, so guard it


      if (tile.dataset.scrollTokens) {
        markerScrollToken = tile.dataset.scrollTokens.split(',')[0];
      }
    }

    if (markerScrollToken) {
      // Use a debouncer to prevent multiple unfill calls in quick succession
      // This is to make the unfilling process less aggressive
      if (this._unfillDebouncer) {
        clearTimeout(this._unfillDebouncer);
      }

      this._unfillDebouncer = setTimeout(() => {
        this._unfillDebouncer = null;
        debuglog("unfilling now", backwards, origExcessHeight);
        this.props.onUnfillRequest(backwards, markerScrollToken);
      }, UNFILL_REQUEST_DEBOUNCE_MS);
    }
  },
  // check if there is already a pending fill request. If not, set one off.
  _maybeFill: function (depth, backwards) {
    const dir = backwards ? 'b' : 'f';

    if (this._pendingFillRequests[dir]) {
      debuglog("Already a " + dir + " fill in progress - not starting another");
      return;
    }

    debuglog("starting " + dir + " fill"); // onFillRequest can end up calling us recursively (via onScroll
    // events) so make sure we set this before firing off the call.

    this._pendingFillRequests[dir] = true; // wait 1ms before paginating, because otherwise
    // this will block the scroll event handler for +700ms
    // if messages are already cached in memory,
    // This would cause jumping to happen on Chrome/macOS.

    return new Promise(resolve => setTimeout(resolve, 1)).then(() => {
      return this.props.onFillRequest(backwards);
    }).finally(() => {
      this._pendingFillRequests[dir] = false;
    }).then(hasMoreResults => {
      if (this.unmounted) {
        return;
      } // Unpaginate once filling is complete


      this._checkUnfillState(!backwards);

      debuglog("" + dir + " fill complete; hasMoreResults:" + hasMoreResults);

      if (hasMoreResults) {
        // further pagination requests have been disabled until now, so
        // it's time to check the fill state again in case the pagination
        // was insufficient.
        return this.checkFillState(depth + 1);
      }
    });
  },

  /* get the current scroll state. This returns an object with the following
   * properties:
   *
   * boolean stuckAtBottom: true if we are tracking the bottom of the
   *   scroll. false if we are tracking a particular child.
   *
   * string trackedScrollToken: undefined if stuckAtBottom is true; if it is
   *   false, the first token in data-scroll-tokens of the child which we are
   *   tracking.
   *
   * number bottomOffset: undefined if stuckAtBottom is true; if it is false,
   *   the number of pixels the bottom of the tracked child is above the
   *   bottom of the scroll panel.
   */
  getScrollState: function () {
    return this.scrollState;
  },

  /* reset the saved scroll state.
   *
   * This is useful if the list is being replaced, and you don't want to
   * preserve scroll even if new children happen to have the same scroll
   * tokens as old ones.
   *
   * This will cause the viewport to be scrolled down to the bottom on the
   * next update of the child list. This is different to scrollToBottom(),
   * which would save the current bottom-most child as the active one (so is
   * no use if no children exist yet, or if you are about to replace the
   * child list.)
   */
  resetScrollState: function () {
    this.scrollState = {
      stuckAtBottom: this.props.startAtBottom
    };
    this._bottomGrowth = 0;
    this._pages = 0;
    this._scrollTimeout = new _Timer.default(100);
    this._heightUpdateInProgress = false;
  },

  /**
   * jump to the top of the content.
   */
  scrollToTop: function () {
    this._getScrollNode().scrollTop = 0;

    this._saveScrollState();
  },

  /**
   * jump to the bottom of the content.
   */
  scrollToBottom: function () {
    // the easiest way to make sure that the scroll state is correctly
    // saved is to do the scroll, then save the updated state. (Calculating
    // it ourselves is hard, and we can't rely on an onScroll callback
    // happening, since there may be no user-visible change here).
    const sn = this._getScrollNode();

    sn.scrollTop = sn.scrollHeight;

    this._saveScrollState();
  },

  /**
   * Page up/down.
   *
   * @param {number} mult: -1 to page up, +1 to page down
   */
  scrollRelative: function (mult) {
    const scrollNode = this._getScrollNode();

    const delta = mult * scrollNode.clientHeight * 0.5;
    scrollNode.scrollBy(0, delta);

    this._saveScrollState();
  },

  /**
   * Scroll up/down in response to a scroll key
   * @param {object} ev the keyboard event
   */
  handleScrollKey: function (ev) {
    switch (ev.key) {
      case _Keyboard.Key.PAGE_UP:
        if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
          this.scrollRelative(-1);
        }

        break;

      case _Keyboard.Key.PAGE_DOWN:
        if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
          this.scrollRelative(1);
        }

        break;

      case _Keyboard.Key.HOME:
        if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
          this.scrollToTop();
        }

        break;

      case _Keyboard.Key.END:
        if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
          this.scrollToBottom();
        }

        break;
    }
  },

  /* Scroll the panel to bring the DOM node with the scroll token
   * `scrollToken` into view.
   *
   * offsetBase gives the reference point for the pixelOffset. 0 means the
   * top of the container, 1 means the bottom, and fractional values mean
   * somewhere in the middle. If omitted, it defaults to 0.
   *
   * pixelOffset gives the number of pixels *above* the offsetBase that the
   * node (specifically, the bottom of it) will be positioned. If omitted, it
   * defaults to 0.
   */
  scrollToToken: function (scrollToken, pixelOffset, offsetBase) {
    pixelOffset = pixelOffset || 0;
    offsetBase = offsetBase || 0; // set the trackedScrollToken so we can get the node through _getTrackedNode

    this.scrollState = {
      stuckAtBottom: false,
      trackedScrollToken: scrollToken
    };

    const trackedNode = this._getTrackedNode();

    const scrollNode = this._getScrollNode();

    if (trackedNode) {
      // set the scrollTop to the position we want.
      // note though, that this might not succeed if the combination of offsetBase and pixelOffset
      // would position the trackedNode towards the top of the viewport.
      // This because when setting the scrollTop only 10 or so events might be loaded,
      // not giving enough content below the trackedNode to scroll downwards
      // enough so it ends up in the top of the viewport.
      debuglog("scrollToken: setting scrollTop", {
        offsetBase,
        pixelOffset,
        offsetTop: trackedNode.offsetTop
      });
      scrollNode.scrollTop = trackedNode.offsetTop - scrollNode.clientHeight * offsetBase + pixelOffset;

      this._saveScrollState();
    }
  },
  _saveScrollState: function () {
    if (this.props.stickyBottom && this.isAtBottom()) {
      this.scrollState = {
        stuckAtBottom: true
      };
      debuglog("saved stuckAtBottom state");
      return;
    }

    const scrollNode = this._getScrollNode();

    const viewportBottom = scrollNode.scrollHeight - (scrollNode.scrollTop + scrollNode.clientHeight);
    const itemlist = this._itemlist.current;
    const messages = itemlist.children;
    let node = null; // TODO: do a binary search here, as items are sorted by offsetTop
    // loop backwards, from bottom-most message (as that is the most common case)

    for (let i = messages.length - 1; i >= 0; --i) {
      if (!messages[i].dataset.scrollTokens) {
        continue;
      }

      node = messages[i]; // break at the first message (coming from the bottom)
      // that has it's offsetTop above the bottom of the viewport.

      if (this._topFromBottom(node) > viewportBottom) {
        // Use this node as the scrollToken
        break;
      }
    }

    if (!node) {
      debuglog("unable to save scroll state: found no children in the viewport");
      return;
    }

    const scrollToken = node.dataset.scrollTokens.split(',')[0];
    debuglog("saving anchored scroll state to message", node && node.innerText, scrollToken);

    const bottomOffset = this._topFromBottom(node);

    this.scrollState = {
      stuckAtBottom: false,
      trackedNode: node,
      trackedScrollToken: scrollToken,
      bottomOffset: bottomOffset,
      pixelOffset: bottomOffset - viewportBottom //needed for restoring the scroll position when coming back to the room

    };
  },
  _restoreSavedScrollState: async function () {
    const scrollState = this.scrollState;

    if (scrollState.stuckAtBottom) {
      const sn = this._getScrollNode();

      sn.scrollTop = sn.scrollHeight;
    } else if (scrollState.trackedScrollToken) {
      const itemlist = this._itemlist.current;

      const trackedNode = this._getTrackedNode();

      if (trackedNode) {
        const newBottomOffset = this._topFromBottom(trackedNode);

        const bottomDiff = newBottomOffset - scrollState.bottomOffset;
        this._bottomGrowth += bottomDiff;
        scrollState.bottomOffset = newBottomOffset;
        itemlist.style.height = "".concat(this._getListHeight(), "px");
        debuglog("balancing height because messages below viewport grew by", bottomDiff);
      }
    }

    if (!this._heightUpdateInProgress) {
      this._heightUpdateInProgress = true;

      try {
        await this._updateHeight();
      } finally {
        this._heightUpdateInProgress = false;
      }
    } else {
      debuglog("not updating height because request already in progress");
    }
  },

  // need a better name that also indicates this will change scrollTop? Rebalance height? Reveal content?
  async _updateHeight() {
    // wait until user has stopped scrolling
    if (this._scrollTimeout.isRunning()) {
      debuglog("updateHeight waiting for scrolling to end ... ");
      await this._scrollTimeout.finished();
    } else {
      debuglog("updateHeight getting straight to business, no scrolling going on.");
    } // We might have unmounted since the timer finished, so abort if so.


    if (this.unmounted) {
      return;
    }

    const sn = this._getScrollNode();

    const itemlist = this._itemlist.current;

    const contentHeight = this._getMessagesHeight();

    const minHeight = sn.clientHeight;
    const height = Math.max(minHeight, contentHeight);
    this._pages = Math.ceil(height / PAGE_SIZE);
    this._bottomGrowth = 0;

    const newHeight = this._getListHeight();

    const scrollState = this.scrollState;

    if (scrollState.stuckAtBottom) {
      itemlist.style.height = "".concat(newHeight, "px");
      sn.scrollTop = sn.scrollHeight;
      debuglog("updateHeight to", newHeight);
    } else if (scrollState.trackedScrollToken) {
      const trackedNode = this._getTrackedNode(); // if the timeline has been reloaded
      // this can be called before scrollToBottom or whatever has been called
      // so don't do anything if the node has disappeared from
      // the currently filled piece of the timeline


      if (trackedNode) {
        const oldTop = trackedNode.offsetTop;
        itemlist.style.height = "".concat(newHeight, "px");
        const newTop = trackedNode.offsetTop;
        const topDiff = newTop - oldTop; // important to scroll by a relative amount as
        // reading scrollTop and then setting it might
        // yield out of date values and cause a jump
        // when setting it

        sn.scrollBy(0, topDiff);
        debuglog("updateHeight to", {
          newHeight,
          topDiff
        });
      }
    }
  },

  _getTrackedNode() {
    const scrollState = this.scrollState;
    const trackedNode = scrollState.trackedNode;

    if (!trackedNode || !trackedNode.parentElement) {
      let node;
      const messages = this._itemlist.current.children;
      const scrollToken = scrollState.trackedScrollToken;

      for (let i = messages.length - 1; i >= 0; --i) {
        const m = messages[i]; // 'data-scroll-tokens' is a DOMString of comma-separated scroll tokens
        // There might only be one scroll token

        if (m.dataset.scrollTokens && m.dataset.scrollTokens.split(',').indexOf(scrollToken) !== -1) {
          node = m;
          break;
        }
      }

      if (node) {
        debuglog("had to find tracked node again for " + scrollState.trackedScrollToken);
      }

      scrollState.trackedNode = node;
    }

    if (!scrollState.trackedNode) {
      debuglog("No node with ; '" + scrollState.trackedScrollToken + "'");
      return;
    }

    return scrollState.trackedNode;
  },

  _getListHeight() {
    return this._bottomGrowth + this._pages * PAGE_SIZE;
  },

  _getMessagesHeight() {
    const itemlist = this._itemlist.current;
    const lastNode = itemlist.lastElementChild;
    const lastNodeBottom = lastNode ? lastNode.offsetTop + lastNode.clientHeight : 0;
    const firstNodeTop = itemlist.firstElementChild ? itemlist.firstElementChild.offsetTop : 0; // 18 is itemlist padding

    return lastNodeBottom - firstNodeTop + 18 * 2;
  },

  _topFromBottom(node) {
    // current capped height - distance from top = distance from bottom of container to top of tracked element
    return this._itemlist.current.clientHeight - node.offsetTop;
  },

  /* get the DOM node which has the scrollTop property we care about for our
   * message panel.
   */
  _getScrollNode: function () {
    if (this.unmounted) {
      // this shouldn't happen, but when it does, turn the NPE into
      // something more meaningful.
      throw new Error("ScrollPanel._getScrollNode called when unmounted");
    }

    if (!this._divScroll) {
      // Likewise, we should have the ref by this point, but if not
      // turn the NPE into something meaningful.
      throw new Error("ScrollPanel._getScrollNode called before AutoHideScrollbar ref collected");
    }

    return this._divScroll;
  },
  _collectScroll: function (divScroll) {
    this._divScroll = divScroll;
  },

  /**
  Mark the bottom offset of the last tile so we can balance it out when
  anything below it changes, by calling updatePreventShrinking, to keep
  the same minimum bottom offset, effectively preventing the timeline to shrink.
  */
  preventShrinking: function () {
    const messageList = this._itemlist.current;
    const tiles = messageList && messageList.children;

    if (!messageList) {
      return;
    }

    let lastTileNode;

    for (let i = tiles.length - 1; i >= 0; i--) {
      const node = tiles[i];

      if (node.dataset.scrollTokens) {
        lastTileNode = node;
        break;
      }
    }

    if (!lastTileNode) {
      return;
    }

    this.clearPreventShrinking();
    const offsetFromBottom = messageList.clientHeight - (lastTileNode.offsetTop + lastTileNode.clientHeight);
    this.preventShrinkingState = {
      offsetFromBottom: offsetFromBottom,
      offsetNode: lastTileNode
    };
    debuglog("prevent shrinking, last tile ", offsetFromBottom, "px from bottom");
  },

  /** Clear shrinking prevention. Used internally, and when the timeline is reloaded. */
  clearPreventShrinking: function () {
    const messageList = this._itemlist.current;
    const balanceElement = messageList && messageList.parentElement;
    if (balanceElement) balanceElement.style.paddingBottom = null;
    this.preventShrinkingState = null;
    debuglog("prevent shrinking cleared");
  },

  /**
  update the container padding to balance
  the bottom offset of the last tile since
  preventShrinking was called.
  Clears the prevent-shrinking state ones the offset
  from the bottom of the marked tile grows larger than
  what it was when marking.
  */
  updatePreventShrinking: function () {
    if (this.preventShrinkingState) {
      const sn = this._getScrollNode();

      const scrollState = this.scrollState;
      const messageList = this._itemlist.current;
      const {
        offsetNode,
        offsetFromBottom
      } = this.preventShrinkingState; // element used to set paddingBottom to balance the typing notifs disappearing

      const balanceElement = messageList.parentElement; // if the offsetNode got unmounted, clear

      let shouldClear = !offsetNode.parentElement; // also if 200px from bottom

      if (!shouldClear && !scrollState.stuckAtBottom) {
        const spaceBelowViewport = sn.scrollHeight - (sn.scrollTop + sn.clientHeight);
        shouldClear = spaceBelowViewport >= 200;
      } // try updating if not clearing


      if (!shouldClear) {
        const currentOffset = messageList.clientHeight - (offsetNode.offsetTop + offsetNode.clientHeight);
        const offsetDiff = offsetFromBottom - currentOffset;

        if (offsetDiff > 0) {
          balanceElement.style.paddingBottom = "".concat(offsetDiff, "px");
          debuglog("update prevent shrinking ", offsetDiff, "px from bottom");
        } else if (offsetDiff < 0) {
          shouldClear = true;
        }
      }

      if (shouldClear) {
        this.clearPreventShrinking();
      }
    }
  },
  render: function () {
    // TODO: the classnames on the div and ol could do with being updated to
    // reflect the fact that we don't necessarily contain a list of messages.
    // it's not obvious why we have a separate div and ol anyway.
    // give the <ol> an explicit role=list because Safari+VoiceOver seems to think an ordered-list with
    // list-style-type: none; is no longer a list
    return /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
      wrappedRef: this._collectScroll,
      onScroll: this.onScroll,
      className: "mx_ScrollPanel ".concat(this.props.className),
      style: this.props.style
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomView_messageListWrapper"
    }, /*#__PURE__*/_react.default.createElement("ol", {
      ref: this._itemlist,
      className: "mx_RoomView_MessageList",
      "aria-live": "polite",
      role: "list"
    }, this.props.children)));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvU2Nyb2xsUGFuZWwuanMiXSwibmFtZXMiOlsiREVCVUdfU0NST0xMIiwiVU5QQUdJTkFUSU9OX1BBRERJTkciLCJVTkZJTExfUkVRVUVTVF9ERUJPVU5DRV9NUyIsIlBBR0VfU0laRSIsImRlYnVnbG9nIiwiY29uc29sZSIsImxvZyIsImJpbmQiLCJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsInN0aWNreUJvdHRvbSIsIlByb3BUeXBlcyIsImJvb2wiLCJzdGFydEF0Qm90dG9tIiwib25GaWxsUmVxdWVzdCIsImZ1bmMiLCJvblVuZmlsbFJlcXVlc3QiLCJvblNjcm9sbCIsImNsYXNzTmFtZSIsInN0cmluZyIsInN0eWxlIiwib2JqZWN0IiwicmVzaXplTm90aWZpZXIiLCJnZXREZWZhdWx0UHJvcHMiLCJiYWNrd2FyZHMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNjcm9sbFRva2VuIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl9wZW5kaW5nRmlsbFJlcXVlc3RzIiwiYiIsImYiLCJwcm9wcyIsIm9uIiwib25SZXNpemUiLCJyZXNldFNjcm9sbFN0YXRlIiwiX2l0ZW1saXN0IiwiY29tcG9uZW50RGlkTW91bnQiLCJjaGVja1Njcm9sbCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInVwZGF0ZVByZXZlbnRTaHJpbmtpbmciLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVubW91bnRlZCIsInJlbW92ZUxpc3RlbmVyIiwiZXYiLCJfZ2V0U2Nyb2xsTm9kZSIsInNjcm9sbFRvcCIsIl9zY3JvbGxUaW1lb3V0IiwicmVzdGFydCIsIl9zYXZlU2Nyb2xsU3RhdGUiLCJjaGVja0ZpbGxTdGF0ZSIsInByZXZlbnRTaHJpbmtpbmdTdGF0ZSIsInByZXZlbnRTaHJpbmtpbmciLCJfcmVzdG9yZVNhdmVkU2Nyb2xsU3RhdGUiLCJpc0F0Qm90dG9tIiwic24iLCJNYXRoIiwiYWJzIiwic2Nyb2xsSGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiX2dldEV4Y2Vzc0hlaWdodCIsImNvbnRlbnRIZWlnaHQiLCJfZ2V0TWVzc2FnZXNIZWlnaHQiLCJsaXN0SGVpZ2h0IiwiX2dldExpc3RIZWlnaHQiLCJjbGlwcGVkSGVpZ2h0IiwidW5jbGlwcGVkU2Nyb2xsVG9wIiwiZGVwdGgiLCJpc0ZpcnN0Q2FsbCIsIl9pc0ZpbGxpbmciLCJfZmlsbFJlcXVlc3RXaGlsZVJ1bm5pbmciLCJpdGVtbGlzdCIsImN1cnJlbnQiLCJmaXJzdFRpbGUiLCJmaXJzdEVsZW1lbnRDaGlsZCIsImNvbnRlbnRUb3AiLCJvZmZzZXRUb3AiLCJmaWxsUHJvbWlzZXMiLCJwdXNoIiwiX21heWJlRmlsbCIsImxlbmd0aCIsImFsbCIsImVyciIsImVycm9yIiwiX2NoZWNrVW5maWxsU3RhdGUiLCJleGNlc3NIZWlnaHQiLCJvcmlnRXhjZXNzSGVpZ2h0IiwidGlsZXMiLCJjaGlsZHJlbiIsIm1hcmtlclNjcm9sbFRva2VuIiwidGlsZSIsImkiLCJkYXRhc2V0Iiwic2Nyb2xsVG9rZW5zIiwic3BsaXQiLCJfdW5maWxsRGVib3VuY2VyIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImRpciIsInRoZW4iLCJmaW5hbGx5IiwiaGFzTW9yZVJlc3VsdHMiLCJnZXRTY3JvbGxTdGF0ZSIsInNjcm9sbFN0YXRlIiwic3R1Y2tBdEJvdHRvbSIsIl9ib3R0b21Hcm93dGgiLCJfcGFnZXMiLCJUaW1lciIsIl9oZWlnaHRVcGRhdGVJblByb2dyZXNzIiwic2Nyb2xsVG9Ub3AiLCJzY3JvbGxUb0JvdHRvbSIsInNjcm9sbFJlbGF0aXZlIiwibXVsdCIsInNjcm9sbE5vZGUiLCJkZWx0YSIsInNjcm9sbEJ5IiwiaGFuZGxlU2Nyb2xsS2V5Iiwia2V5IiwiS2V5IiwiUEFHRV9VUCIsImN0cmxLZXkiLCJzaGlmdEtleSIsImFsdEtleSIsIm1ldGFLZXkiLCJQQUdFX0RPV04iLCJIT01FIiwiRU5EIiwic2Nyb2xsVG9Ub2tlbiIsInBpeGVsT2Zmc2V0Iiwib2Zmc2V0QmFzZSIsInRyYWNrZWRTY3JvbGxUb2tlbiIsInRyYWNrZWROb2RlIiwiX2dldFRyYWNrZWROb2RlIiwidmlld3BvcnRCb3R0b20iLCJtZXNzYWdlcyIsIm5vZGUiLCJfdG9wRnJvbUJvdHRvbSIsImlubmVyVGV4dCIsImJvdHRvbU9mZnNldCIsIm5ld0JvdHRvbU9mZnNldCIsImJvdHRvbURpZmYiLCJoZWlnaHQiLCJfdXBkYXRlSGVpZ2h0IiwiaXNSdW5uaW5nIiwiZmluaXNoZWQiLCJtaW5IZWlnaHQiLCJtYXgiLCJjZWlsIiwibmV3SGVpZ2h0Iiwib2xkVG9wIiwibmV3VG9wIiwidG9wRGlmZiIsInBhcmVudEVsZW1lbnQiLCJtIiwiaW5kZXhPZiIsImxhc3ROb2RlIiwibGFzdEVsZW1lbnRDaGlsZCIsImxhc3ROb2RlQm90dG9tIiwiZmlyc3ROb2RlVG9wIiwiRXJyb3IiLCJfZGl2U2Nyb2xsIiwiX2NvbGxlY3RTY3JvbGwiLCJkaXZTY3JvbGwiLCJtZXNzYWdlTGlzdCIsImxhc3RUaWxlTm9kZSIsImNsZWFyUHJldmVudFNocmlua2luZyIsIm9mZnNldEZyb21Cb3R0b20iLCJvZmZzZXROb2RlIiwiYmFsYW5jZUVsZW1lbnQiLCJwYWRkaW5nQm90dG9tIiwic2hvdWxkQ2xlYXIiLCJzcGFjZUJlbG93Vmlld3BvcnQiLCJjdXJyZW50T2Zmc2V0Iiwib2Zmc2V0RGlmZiIsInJlbmRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7QUF1QkEsTUFBTUEsWUFBWSxHQUFHLEtBQXJCLEMsQ0FFQTtBQUNBOztBQUNBLE1BQU1DLG9CQUFvQixHQUFHLElBQTdCLEMsQ0FDQTtBQUNBOztBQUNBLE1BQU1DLDBCQUEwQixHQUFHLEdBQW5DLEMsQ0FDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFNQyxTQUFTLEdBQUcsR0FBbEI7QUFFQSxJQUFJQyxRQUFKOztBQUNBLElBQUlKLFlBQUosRUFBa0I7QUFDZDtBQUNBSSxFQUFBQSxRQUFRLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxJQUFaLENBQWlCRixPQUFqQixFQUEwQix1QkFBMUIsQ0FBWDtBQUNILENBSEQsTUFHTztBQUNIRCxFQUFBQSxRQUFRLEdBQUcsWUFBVyxDQUFFLENBQXhCO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBeUNlLCtCQUFpQjtBQUM1QkksRUFBQUEsV0FBVyxFQUFFLGFBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQOzs7OztBQUtBQyxJQUFBQSxZQUFZLEVBQUVDLG1CQUFVQyxJQU5qQjs7QUFRUDs7Ozs7OztBQU9BQyxJQUFBQSxhQUFhLEVBQUVGLG1CQUFVQyxJQWZsQjs7QUFpQlA7Ozs7Ozs7Ozs7Ozs7QUFhQUUsSUFBQUEsYUFBYSxFQUFFSCxtQkFBVUksSUE5QmxCOztBQWdDUDs7Ozs7Ozs7O0FBU0FDLElBQUFBLGVBQWUsRUFBRUwsbUJBQVVJLElBekNwQjs7QUEyQ1A7O0FBRUFFLElBQUFBLFFBQVEsRUFBRU4sbUJBQVVJLElBN0NiOztBQStDUDs7QUFFQUcsSUFBQUEsU0FBUyxFQUFFUCxtQkFBVVEsTUFqRGQ7O0FBbURQOztBQUVBQyxJQUFBQSxLQUFLLEVBQUVULG1CQUFVVSxNQXJEVjs7QUFzRFA7O0FBRUFDLElBQUFBLGNBQWMsRUFBRVgsbUJBQVVVO0FBeERuQixHQUhpQjtBQThENUJFLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSGIsTUFBQUEsWUFBWSxFQUFFLElBRFg7QUFFSEcsTUFBQUEsYUFBYSxFQUFFLElBRlo7QUFHSEMsTUFBQUEsYUFBYSxFQUFFLFVBQVNVLFNBQVQsRUFBb0I7QUFBRSxlQUFPQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBUDtBQUFnQyxPQUhsRTtBQUlIVixNQUFBQSxlQUFlLEVBQUUsVUFBU1EsU0FBVCxFQUFvQkcsV0FBcEIsRUFBaUMsQ0FBRSxDQUpqRDtBQUtIVixNQUFBQSxRQUFRLEVBQUUsWUFBVyxDQUFFO0FBTHBCLEtBQVA7QUFPSCxHQXRFMkI7QUF3RTVCO0FBQ0FXLEVBQUFBLHlCQUF5QixFQUFFLFlBQVc7QUFDbEMsU0FBS0Msb0JBQUwsR0FBNEI7QUFBQ0MsTUFBQUEsQ0FBQyxFQUFFLElBQUo7QUFBVUMsTUFBQUEsQ0FBQyxFQUFFO0FBQWIsS0FBNUI7O0FBRUEsUUFBSSxLQUFLQyxLQUFMLENBQVdWLGNBQWYsRUFBK0I7QUFDM0IsV0FBS1UsS0FBTCxDQUFXVixjQUFYLENBQTBCVyxFQUExQixDQUE2QixvQkFBN0IsRUFBbUQsS0FBS0MsUUFBeEQ7QUFDSDs7QUFFRCxTQUFLQyxnQkFBTDtBQUVBLFNBQUtDLFNBQUwsR0FBaUIsdUJBQWpCO0FBQ0gsR0FuRjJCO0FBcUY1QkMsRUFBQUEsaUJBQWlCLEVBQUUsWUFBVztBQUMxQixTQUFLQyxXQUFMO0FBQ0gsR0F2RjJCO0FBeUY1QkMsRUFBQUEsa0JBQWtCLEVBQUUsWUFBVztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBS0QsV0FBTDtBQUNBLFNBQUtFLHNCQUFMO0FBQ0gsR0FqRzJCO0FBbUc1QkMsRUFBQUEsb0JBQW9CLEVBQUUsWUFBVztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsSUFBakI7O0FBRUEsUUFBSSxLQUFLVixLQUFMLENBQVdWLGNBQWYsRUFBK0I7QUFDM0IsV0FBS1UsS0FBTCxDQUFXVixjQUFYLENBQTBCcUIsY0FBMUIsQ0FBeUMsb0JBQXpDLEVBQStELEtBQUtULFFBQXBFO0FBQ0g7QUFDSixHQTdHMkI7QUErRzVCakIsRUFBQUEsUUFBUSxFQUFFLFVBQVMyQixFQUFULEVBQWE7QUFDbkJ4QyxJQUFBQSxRQUFRLENBQUMsVUFBRCxFQUFhLEtBQUt5QyxjQUFMLEdBQXNCQyxTQUFuQyxDQUFSOztBQUNBLFNBQUtDLGNBQUwsQ0FBb0JDLE9BQXBCOztBQUNBLFNBQUtDLGdCQUFMOztBQUNBLFNBQUtULHNCQUFMO0FBQ0EsU0FBS1IsS0FBTCxDQUFXZixRQUFYLENBQW9CMkIsRUFBcEI7QUFDQSxTQUFLTSxjQUFMO0FBQ0gsR0F0SDJCO0FBd0g1QmhCLEVBQUFBLFFBQVEsRUFBRSxZQUFXO0FBQ2pCLFNBQUtJLFdBQUwsR0FEaUIsQ0FFakI7O0FBQ0EsUUFBSSxLQUFLYSxxQkFBVCxFQUFnQztBQUM1QixXQUFLQyxnQkFBTDtBQUNIO0FBQ0osR0E5SDJCO0FBZ0k1QjtBQUNBO0FBQ0FkLEVBQUFBLFdBQVcsRUFBRSxZQUFXO0FBQ3BCLFFBQUksS0FBS0ksU0FBVCxFQUFvQjtBQUNoQjtBQUNIOztBQUNELFNBQUtXLHdCQUFMOztBQUNBLFNBQUtILGNBQUw7QUFDSCxHQXhJMkI7QUEwSTVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUksRUFBQUEsVUFBVSxFQUFFLFlBQVc7QUFDbkIsVUFBTUMsRUFBRSxHQUFHLEtBQUtWLGNBQUwsRUFBWCxDQURtQixDQUVuQjtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsV0FBT1csSUFBSSxDQUFDQyxHQUFMLENBQVNGLEVBQUUsQ0FBQ0csWUFBSCxJQUFtQkgsRUFBRSxDQUFDVCxTQUFILEdBQWVTLEVBQUUsQ0FBQ0ksWUFBckMsQ0FBVCxLQUFnRSxDQUF2RTtBQUVILEdBdkoyQjtBQXlKNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsRUFBQUEsZ0JBQWdCLEVBQUUsVUFBU3BDLFNBQVQsRUFBb0I7QUFDbEMsVUFBTStCLEVBQUUsR0FBRyxLQUFLVixjQUFMLEVBQVg7O0FBQ0EsVUFBTWdCLGFBQWEsR0FBRyxLQUFLQyxrQkFBTCxFQUF0Qjs7QUFDQSxVQUFNQyxVQUFVLEdBQUcsS0FBS0MsY0FBTCxFQUFuQjs7QUFDQSxVQUFNQyxhQUFhLEdBQUdKLGFBQWEsR0FBR0UsVUFBdEM7QUFDQSxVQUFNRyxrQkFBa0IsR0FBR1gsRUFBRSxDQUFDVCxTQUFILEdBQWVtQixhQUExQzs7QUFFQSxRQUFJekMsU0FBSixFQUFlO0FBQ1gsYUFBTzBDLGtCQUFrQixHQUFHWCxFQUFFLENBQUNJLFlBQXhCLEdBQXVDMUQsb0JBQTlDO0FBQ0gsS0FGRCxNQUVPO0FBQ0gsYUFBTzRELGFBQWEsSUFBSUssa0JBQWtCLEdBQUcsSUFBRVgsRUFBRSxDQUFDSSxZQUE5QixDQUFiLEdBQTJEMUQsb0JBQWxFO0FBQ0g7QUFDSixHQXBNMkI7QUFzTTVCO0FBQ0FpRCxFQUFBQSxjQUFjLEVBQUUsZ0JBQWVpQixLQUFLLEdBQUMsQ0FBckIsRUFBd0I7QUFDcEMsUUFBSSxLQUFLekIsU0FBVCxFQUFvQjtBQUNoQjtBQUNIOztBQUVELFVBQU0wQixXQUFXLEdBQUdELEtBQUssS0FBSyxDQUE5Qjs7QUFDQSxVQUFNWixFQUFFLEdBQUcsS0FBS1YsY0FBTCxFQUFYLENBTm9DLENBUXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsUUFBSXVCLFdBQUosRUFBaUI7QUFDYixVQUFJLEtBQUtDLFVBQVQsRUFBcUI7QUFDakJqRSxRQUFBQSxRQUFRLENBQUMscUZBQUQsQ0FBUjtBQUNBLGFBQUtrRSx3QkFBTCxHQUFnQyxJQUFoQztBQUNBO0FBQ0g7O0FBQ0RsRSxNQUFBQSxRQUFRLENBQUMscUJBQUQsQ0FBUjtBQUNBLFdBQUtpRSxVQUFMLEdBQWtCLElBQWxCO0FBQ0g7O0FBRUQsVUFBTUUsUUFBUSxHQUFHLEtBQUtuQyxTQUFMLENBQWVvQyxPQUFoQztBQUNBLFVBQU1DLFNBQVMsR0FBR0YsUUFBUSxJQUFJQSxRQUFRLENBQUNHLGlCQUF2QztBQUNBLFVBQU1DLFVBQVUsR0FBR0YsU0FBUyxJQUFJQSxTQUFTLENBQUNHLFNBQTFDO0FBQ0EsVUFBTUMsWUFBWSxHQUFHLEVBQXJCLENBakRvQyxDQW1EcEM7QUFDQTs7QUFDQSxRQUFJLENBQUNKLFNBQUQsSUFBZWxCLEVBQUUsQ0FBQ1QsU0FBSCxHQUFlNkIsVUFBaEIsR0FBOEJwQixFQUFFLENBQUNJLFlBQW5ELEVBQWlFO0FBQzdEO0FBQ0FrQixNQUFBQSxZQUFZLENBQUNDLElBQWIsQ0FBa0IsS0FBS0MsVUFBTCxDQUFnQlosS0FBaEIsRUFBdUIsSUFBdkIsQ0FBbEI7QUFDSCxLQXhEbUMsQ0F5RHBDO0FBQ0E7OztBQUNBLFFBQUtaLEVBQUUsQ0FBQ0csWUFBSCxHQUFrQkgsRUFBRSxDQUFDVCxTQUF0QixHQUFtQ1MsRUFBRSxDQUFDSSxZQUFILEdBQWtCLENBQXpELEVBQTREO0FBQ3hEO0FBQ0FrQixNQUFBQSxZQUFZLENBQUNDLElBQWIsQ0FBa0IsS0FBS0MsVUFBTCxDQUFnQlosS0FBaEIsRUFBdUIsS0FBdkIsQ0FBbEI7QUFDSDs7QUFFRCxRQUFJVSxZQUFZLENBQUNHLE1BQWpCLEVBQXlCO0FBQ3JCLFVBQUk7QUFDQSxjQUFNdkQsT0FBTyxDQUFDd0QsR0FBUixDQUFZSixZQUFaLENBQU47QUFDSCxPQUZELENBRUUsT0FBT0ssR0FBUCxFQUFZO0FBQ1Y3RSxRQUFBQSxPQUFPLENBQUM4RSxLQUFSLENBQWNELEdBQWQ7QUFDSDtBQUNKOztBQUNELFFBQUlkLFdBQUosRUFBaUI7QUFDYmhFLE1BQUFBLFFBQVEsQ0FBQyxzQkFBRCxDQUFSO0FBQ0EsV0FBS2lFLFVBQUwsR0FBa0IsS0FBbEI7QUFDSDs7QUFFRCxRQUFJLEtBQUtDLHdCQUFULEVBQW1DO0FBQy9CLFdBQUtBLHdCQUFMLEdBQWdDLEtBQWhDO0FBQ0EsV0FBS3BCLGNBQUw7QUFDSDtBQUNKLEdBdlIyQjtBQXlSNUI7QUFDQWtDLEVBQUFBLGlCQUFpQixFQUFFLFVBQVM1RCxTQUFULEVBQW9CO0FBQ25DLFFBQUk2RCxZQUFZLEdBQUcsS0FBS3pCLGdCQUFMLENBQXNCcEMsU0FBdEIsQ0FBbkI7O0FBQ0EsUUFBSTZELFlBQVksSUFBSSxDQUFwQixFQUF1QjtBQUNuQjtBQUNIOztBQUVELFVBQU1DLGdCQUFnQixHQUFHRCxZQUF6QjtBQUVBLFVBQU1FLEtBQUssR0FBRyxLQUFLbkQsU0FBTCxDQUFlb0MsT0FBZixDQUF1QmdCLFFBQXJDLENBUm1DLENBVW5DOztBQUNBLFFBQUlDLGlCQUFpQixHQUFHLElBQXhCLENBWG1DLENBYW5DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxRQUFJQyxJQUFKOztBQUNBLFNBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0osS0FBSyxDQUFDUCxNQUExQixFQUFrQ1csQ0FBQyxFQUFuQyxFQUF1QztBQUNuQ0QsTUFBQUEsSUFBSSxHQUFHSCxLQUFLLENBQUMvRCxTQUFTLEdBQUdtRSxDQUFILEdBQU9KLEtBQUssQ0FBQ1AsTUFBTixHQUFlLENBQWYsR0FBbUJXLENBQXBDLENBQVosQ0FEbUMsQ0FFbkM7O0FBQ0FOLE1BQUFBLFlBQVksSUFBSUssSUFBSSxDQUFDL0IsWUFBckIsQ0FIbUMsQ0FJbkM7O0FBQ0EsVUFBSStCLElBQUksQ0FBQy9CLFlBQUwsR0FBb0IwQixZQUF4QixFQUFzQztBQUNsQztBQUNILE9BUGtDLENBUW5DOzs7QUFDQSxVQUFJSyxJQUFJLENBQUNFLE9BQUwsQ0FBYUMsWUFBakIsRUFBK0I7QUFDM0JKLFFBQUFBLGlCQUFpQixHQUFHQyxJQUFJLENBQUNFLE9BQUwsQ0FBYUMsWUFBYixDQUEwQkMsS0FBMUIsQ0FBZ0MsR0FBaEMsRUFBcUMsQ0FBckMsQ0FBcEI7QUFDSDtBQUNKOztBQUVELFFBQUlMLGlCQUFKLEVBQXVCO0FBQ25CO0FBQ0E7QUFDQSxVQUFJLEtBQUtNLGdCQUFULEVBQTJCO0FBQ3ZCQyxRQUFBQSxZQUFZLENBQUMsS0FBS0QsZ0JBQU4sQ0FBWjtBQUNIOztBQUNELFdBQUtBLGdCQUFMLEdBQXdCRSxVQUFVLENBQUMsTUFBTTtBQUNyQyxhQUFLRixnQkFBTCxHQUF3QixJQUF4QjtBQUNBM0YsUUFBQUEsUUFBUSxDQUFDLGVBQUQsRUFBa0JvQixTQUFsQixFQUE2QjhELGdCQUE3QixDQUFSO0FBQ0EsYUFBS3RELEtBQUwsQ0FBV2hCLGVBQVgsQ0FBMkJRLFNBQTNCLEVBQXNDaUUsaUJBQXRDO0FBQ0gsT0FKaUMsRUFJL0J2RiwwQkFKK0IsQ0FBbEM7QUFLSDtBQUNKLEdBeFUyQjtBQTBVNUI7QUFDQTZFLEVBQUFBLFVBQVUsRUFBRSxVQUFTWixLQUFULEVBQWdCM0MsU0FBaEIsRUFBMkI7QUFDbkMsVUFBTTBFLEdBQUcsR0FBRzFFLFNBQVMsR0FBRyxHQUFILEdBQVMsR0FBOUI7O0FBQ0EsUUFBSSxLQUFLSyxvQkFBTCxDQUEwQnFFLEdBQTFCLENBQUosRUFBb0M7QUFDaEM5RixNQUFBQSxRQUFRLENBQUMsZUFBYThGLEdBQWIsR0FBaUIsMENBQWxCLENBQVI7QUFDQTtBQUNIOztBQUVEOUYsSUFBQUEsUUFBUSxDQUFDLGNBQVk4RixHQUFaLEdBQWdCLE9BQWpCLENBQVIsQ0FQbUMsQ0FTbkM7QUFDQTs7QUFDQSxTQUFLckUsb0JBQUwsQ0FBMEJxRSxHQUExQixJQUFpQyxJQUFqQyxDQVhtQyxDQWFuQztBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPLElBQUl6RSxPQUFKLENBQVlDLE9BQU8sSUFBSXVFLFVBQVUsQ0FBQ3ZFLE9BQUQsRUFBVSxDQUFWLENBQWpDLEVBQStDeUUsSUFBL0MsQ0FBb0QsTUFBTTtBQUM3RCxhQUFPLEtBQUtuRSxLQUFMLENBQVdsQixhQUFYLENBQXlCVSxTQUF6QixDQUFQO0FBQ0gsS0FGTSxFQUVKNEUsT0FGSSxDQUVJLE1BQU07QUFDYixXQUFLdkUsb0JBQUwsQ0FBMEJxRSxHQUExQixJQUFpQyxLQUFqQztBQUNILEtBSk0sRUFJSkMsSUFKSSxDQUlFRSxjQUFELElBQW9CO0FBQ3hCLFVBQUksS0FBSzNELFNBQVQsRUFBb0I7QUFDaEI7QUFDSCxPQUh1QixDQUl4Qjs7O0FBQ0EsV0FBSzBDLGlCQUFMLENBQXVCLENBQUM1RCxTQUF4Qjs7QUFFQXBCLE1BQUFBLFFBQVEsQ0FBQyxLQUFHOEYsR0FBSCxHQUFPLGlDQUFQLEdBQXlDRyxjQUExQyxDQUFSOztBQUNBLFVBQUlBLGNBQUosRUFBb0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0EsZUFBTyxLQUFLbkQsY0FBTCxDQUFvQmlCLEtBQUssR0FBRyxDQUE1QixDQUFQO0FBQ0g7QUFDSixLQWxCTSxDQUFQO0FBbUJILEdBL1cyQjs7QUFpWDVCOzs7Ozs7Ozs7Ozs7OztBQWNBbUMsRUFBQUEsY0FBYyxFQUFFLFlBQVc7QUFDdkIsV0FBTyxLQUFLQyxXQUFaO0FBQ0gsR0FqWTJCOztBQW1ZNUI7Ozs7Ozs7Ozs7OztBQVlBcEUsRUFBQUEsZ0JBQWdCLEVBQUUsWUFBVztBQUN6QixTQUFLb0UsV0FBTCxHQUFtQjtBQUNmQyxNQUFBQSxhQUFhLEVBQUUsS0FBS3hFLEtBQUwsQ0FBV25CO0FBRFgsS0FBbkI7QUFHQSxTQUFLNEYsYUFBTCxHQUFxQixDQUFyQjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxDQUFkO0FBQ0EsU0FBSzNELGNBQUwsR0FBc0IsSUFBSTRELGNBQUosQ0FBVSxHQUFWLENBQXRCO0FBQ0EsU0FBS0MsdUJBQUwsR0FBK0IsS0FBL0I7QUFDSCxHQXZaMkI7O0FBeVo1Qjs7O0FBR0FDLEVBQUFBLFdBQVcsRUFBRSxZQUFXO0FBQ3BCLFNBQUtoRSxjQUFMLEdBQXNCQyxTQUF0QixHQUFrQyxDQUFsQzs7QUFDQSxTQUFLRyxnQkFBTDtBQUNILEdBL1oyQjs7QUFpYTVCOzs7QUFHQTZELEVBQUFBLGNBQWMsRUFBRSxZQUFXO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBTXZELEVBQUUsR0FBRyxLQUFLVixjQUFMLEVBQVg7O0FBQ0FVLElBQUFBLEVBQUUsQ0FBQ1QsU0FBSCxHQUFlUyxFQUFFLENBQUNHLFlBQWxCOztBQUNBLFNBQUtULGdCQUFMO0FBQ0gsR0E1YTJCOztBQThhNUI7Ozs7O0FBS0E4RCxFQUFBQSxjQUFjLEVBQUUsVUFBU0MsSUFBVCxFQUFlO0FBQzNCLFVBQU1DLFVBQVUsR0FBRyxLQUFLcEUsY0FBTCxFQUFuQjs7QUFDQSxVQUFNcUUsS0FBSyxHQUFHRixJQUFJLEdBQUdDLFVBQVUsQ0FBQ3RELFlBQWxCLEdBQWlDLEdBQS9DO0FBQ0FzRCxJQUFBQSxVQUFVLENBQUNFLFFBQVgsQ0FBb0IsQ0FBcEIsRUFBdUJELEtBQXZCOztBQUNBLFNBQUtqRSxnQkFBTDtBQUNILEdBeGIyQjs7QUEwYjVCOzs7O0FBSUFtRSxFQUFBQSxlQUFlLEVBQUUsVUFBU3hFLEVBQVQsRUFBYTtBQUMxQixZQUFRQSxFQUFFLENBQUN5RSxHQUFYO0FBQ0ksV0FBS0MsY0FBSUMsT0FBVDtBQUNJLFlBQUksQ0FBQzNFLEVBQUUsQ0FBQzRFLE9BQUosSUFBZSxDQUFDNUUsRUFBRSxDQUFDNkUsUUFBbkIsSUFBK0IsQ0FBQzdFLEVBQUUsQ0FBQzhFLE1BQW5DLElBQTZDLENBQUM5RSxFQUFFLENBQUMrRSxPQUFyRCxFQUE4RDtBQUMxRCxlQUFLWixjQUFMLENBQW9CLENBQUMsQ0FBckI7QUFDSDs7QUFDRDs7QUFFSixXQUFLTyxjQUFJTSxTQUFUO0FBQ0ksWUFBSSxDQUFDaEYsRUFBRSxDQUFDNEUsT0FBSixJQUFlLENBQUM1RSxFQUFFLENBQUM2RSxRQUFuQixJQUErQixDQUFDN0UsRUFBRSxDQUFDOEUsTUFBbkMsSUFBNkMsQ0FBQzlFLEVBQUUsQ0FBQytFLE9BQXJELEVBQThEO0FBQzFELGVBQUtaLGNBQUwsQ0FBb0IsQ0FBcEI7QUFDSDs7QUFDRDs7QUFFSixXQUFLTyxjQUFJTyxJQUFUO0FBQ0ksWUFBSWpGLEVBQUUsQ0FBQzRFLE9BQUgsSUFBYyxDQUFDNUUsRUFBRSxDQUFDNkUsUUFBbEIsSUFBOEIsQ0FBQzdFLEVBQUUsQ0FBQzhFLE1BQWxDLElBQTRDLENBQUM5RSxFQUFFLENBQUMrRSxPQUFwRCxFQUE2RDtBQUN6RCxlQUFLZCxXQUFMO0FBQ0g7O0FBQ0Q7O0FBRUosV0FBS1MsY0FBSVEsR0FBVDtBQUNJLFlBQUlsRixFQUFFLENBQUM0RSxPQUFILElBQWMsQ0FBQzVFLEVBQUUsQ0FBQzZFLFFBQWxCLElBQThCLENBQUM3RSxFQUFFLENBQUM4RSxNQUFsQyxJQUE0QyxDQUFDOUUsRUFBRSxDQUFDK0UsT0FBcEQsRUFBNkQ7QUFDekQsZUFBS2IsY0FBTDtBQUNIOztBQUNEO0FBdkJSO0FBeUJILEdBeGQyQjs7QUEwZDVCOzs7Ozs7Ozs7OztBQVdBaUIsRUFBQUEsYUFBYSxFQUFFLFVBQVNwRyxXQUFULEVBQXNCcUcsV0FBdEIsRUFBbUNDLFVBQW5DLEVBQStDO0FBQzFERCxJQUFBQSxXQUFXLEdBQUdBLFdBQVcsSUFBSSxDQUE3QjtBQUNBQyxJQUFBQSxVQUFVLEdBQUdBLFVBQVUsSUFBSSxDQUEzQixDQUYwRCxDQUkxRDs7QUFDQSxTQUFLMUIsV0FBTCxHQUFtQjtBQUNmQyxNQUFBQSxhQUFhLEVBQUUsS0FEQTtBQUVmMEIsTUFBQUEsa0JBQWtCLEVBQUV2RztBQUZMLEtBQW5COztBQUlBLFVBQU13RyxXQUFXLEdBQUcsS0FBS0MsZUFBTCxFQUFwQjs7QUFDQSxVQUFNbkIsVUFBVSxHQUFHLEtBQUtwRSxjQUFMLEVBQW5COztBQUNBLFFBQUlzRixXQUFKLEVBQWlCO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EvSCxNQUFBQSxRQUFRLENBQUMsZ0NBQUQsRUFBbUM7QUFBQzZILFFBQUFBLFVBQUQ7QUFBYUQsUUFBQUEsV0FBYjtBQUEwQnBELFFBQUFBLFNBQVMsRUFBRXVELFdBQVcsQ0FBQ3ZEO0FBQWpELE9BQW5DLENBQVI7QUFDQXFDLE1BQUFBLFVBQVUsQ0FBQ25FLFNBQVgsR0FBd0JxRixXQUFXLENBQUN2RCxTQUFaLEdBQXlCcUMsVUFBVSxDQUFDdEQsWUFBWCxHQUEwQnNFLFVBQXBELEdBQW1FRCxXQUExRjs7QUFDQSxXQUFLL0UsZ0JBQUw7QUFDSDtBQUNKLEdBM2YyQjtBQTZmNUJBLEVBQUFBLGdCQUFnQixFQUFFLFlBQVc7QUFDekIsUUFBSSxLQUFLakIsS0FBTCxDQUFXdEIsWUFBWCxJQUEyQixLQUFLNEMsVUFBTCxFQUEvQixFQUFrRDtBQUM5QyxXQUFLaUQsV0FBTCxHQUFtQjtBQUFFQyxRQUFBQSxhQUFhLEVBQUU7QUFBakIsT0FBbkI7QUFDQXBHLE1BQUFBLFFBQVEsQ0FBQywyQkFBRCxDQUFSO0FBQ0E7QUFDSDs7QUFFRCxVQUFNNkcsVUFBVSxHQUFHLEtBQUtwRSxjQUFMLEVBQW5COztBQUNBLFVBQU13RixjQUFjLEdBQUdwQixVQUFVLENBQUN2RCxZQUFYLElBQTJCdUQsVUFBVSxDQUFDbkUsU0FBWCxHQUF1Qm1FLFVBQVUsQ0FBQ3RELFlBQTdELENBQXZCO0FBRUEsVUFBTVksUUFBUSxHQUFHLEtBQUtuQyxTQUFMLENBQWVvQyxPQUFoQztBQUNBLFVBQU04RCxRQUFRLEdBQUcvRCxRQUFRLENBQUNpQixRQUExQjtBQUNBLFFBQUkrQyxJQUFJLEdBQUcsSUFBWCxDQVp5QixDQWN6QjtBQUNBOztBQUNBLFNBQUssSUFBSTVDLENBQUMsR0FBRzJDLFFBQVEsQ0FBQ3RELE1BQVQsR0FBZ0IsQ0FBN0IsRUFBZ0NXLENBQUMsSUFBSSxDQUFyQyxFQUF3QyxFQUFFQSxDQUExQyxFQUE2QztBQUN6QyxVQUFJLENBQUMyQyxRQUFRLENBQUMzQyxDQUFELENBQVIsQ0FBWUMsT0FBWixDQUFvQkMsWUFBekIsRUFBdUM7QUFDbkM7QUFDSDs7QUFDRDBDLE1BQUFBLElBQUksR0FBR0QsUUFBUSxDQUFDM0MsQ0FBRCxDQUFmLENBSnlDLENBS3pDO0FBQ0E7O0FBQ0EsVUFBSSxLQUFLNkMsY0FBTCxDQUFvQkQsSUFBcEIsSUFBNEJGLGNBQWhDLEVBQWdEO0FBQzVDO0FBQ0E7QUFDSDtBQUNKOztBQUVELFFBQUksQ0FBQ0UsSUFBTCxFQUFXO0FBQ1BuSSxNQUFBQSxRQUFRLENBQUMsZ0VBQUQsQ0FBUjtBQUNBO0FBQ0g7O0FBQ0QsVUFBTXVCLFdBQVcsR0FBRzRHLElBQUksQ0FBQzNDLE9BQUwsQ0FBYUMsWUFBYixDQUEwQkMsS0FBMUIsQ0FBZ0MsR0FBaEMsRUFBcUMsQ0FBckMsQ0FBcEI7QUFDQTFGLElBQUFBLFFBQVEsQ0FBQyx5Q0FBRCxFQUE0Q21JLElBQUksSUFBSUEsSUFBSSxDQUFDRSxTQUF6RCxFQUFvRTlHLFdBQXBFLENBQVI7O0FBQ0EsVUFBTStHLFlBQVksR0FBRyxLQUFLRixjQUFMLENBQW9CRCxJQUFwQixDQUFyQjs7QUFDQSxTQUFLaEMsV0FBTCxHQUFtQjtBQUNmQyxNQUFBQSxhQUFhLEVBQUUsS0FEQTtBQUVmMkIsTUFBQUEsV0FBVyxFQUFFSSxJQUZFO0FBR2ZMLE1BQUFBLGtCQUFrQixFQUFFdkcsV0FITDtBQUlmK0csTUFBQUEsWUFBWSxFQUFFQSxZQUpDO0FBS2ZWLE1BQUFBLFdBQVcsRUFBRVUsWUFBWSxHQUFHTCxjQUxiLENBSzZCOztBQUw3QixLQUFuQjtBQU9ILEdBeGlCMkI7QUEwaUI1QmhGLEVBQUFBLHdCQUF3QixFQUFFLGtCQUFpQjtBQUN2QyxVQUFNa0QsV0FBVyxHQUFHLEtBQUtBLFdBQXpCOztBQUVBLFFBQUlBLFdBQVcsQ0FBQ0MsYUFBaEIsRUFBK0I7QUFDM0IsWUFBTWpELEVBQUUsR0FBRyxLQUFLVixjQUFMLEVBQVg7O0FBQ0FVLE1BQUFBLEVBQUUsQ0FBQ1QsU0FBSCxHQUFlUyxFQUFFLENBQUNHLFlBQWxCO0FBQ0gsS0FIRCxNQUdPLElBQUk2QyxXQUFXLENBQUMyQixrQkFBaEIsRUFBb0M7QUFDdkMsWUFBTTNELFFBQVEsR0FBRyxLQUFLbkMsU0FBTCxDQUFlb0MsT0FBaEM7O0FBQ0EsWUFBTTJELFdBQVcsR0FBRyxLQUFLQyxlQUFMLEVBQXBCOztBQUNBLFVBQUlELFdBQUosRUFBaUI7QUFDYixjQUFNUSxlQUFlLEdBQUcsS0FBS0gsY0FBTCxDQUFvQkwsV0FBcEIsQ0FBeEI7O0FBQ0EsY0FBTVMsVUFBVSxHQUFHRCxlQUFlLEdBQUdwQyxXQUFXLENBQUNtQyxZQUFqRDtBQUNBLGFBQUtqQyxhQUFMLElBQXNCbUMsVUFBdEI7QUFDQXJDLFFBQUFBLFdBQVcsQ0FBQ21DLFlBQVosR0FBMkJDLGVBQTNCO0FBQ0FwRSxRQUFBQSxRQUFRLENBQUNuRCxLQUFULENBQWV5SCxNQUFmLGFBQTJCLEtBQUs3RSxjQUFMLEVBQTNCO0FBQ0E1RCxRQUFBQSxRQUFRLENBQUMsMERBQUQsRUFBNkR3SSxVQUE3RCxDQUFSO0FBQ0g7QUFDSjs7QUFDRCxRQUFJLENBQUMsS0FBS2hDLHVCQUFWLEVBQW1DO0FBQy9CLFdBQUtBLHVCQUFMLEdBQStCLElBQS9COztBQUNBLFVBQUk7QUFDQSxjQUFNLEtBQUtrQyxhQUFMLEVBQU47QUFDSCxPQUZELFNBRVU7QUFDTixhQUFLbEMsdUJBQUwsR0FBK0IsS0FBL0I7QUFDSDtBQUNKLEtBUEQsTUFPTztBQUNIeEcsTUFBQUEsUUFBUSxDQUFDLHlEQUFELENBQVI7QUFDSDtBQUNKLEdBdGtCMkI7O0FBdWtCNUI7QUFDQSxRQUFNMEksYUFBTixHQUFzQjtBQUNsQjtBQUNBLFFBQUksS0FBSy9GLGNBQUwsQ0FBb0JnRyxTQUFwQixFQUFKLEVBQXFDO0FBQ2pDM0ksTUFBQUEsUUFBUSxDQUFDLGdEQUFELENBQVI7QUFDQSxZQUFNLEtBQUsyQyxjQUFMLENBQW9CaUcsUUFBcEIsRUFBTjtBQUNILEtBSEQsTUFHTztBQUNINUksTUFBQUEsUUFBUSxDQUFDLG1FQUFELENBQVI7QUFDSCxLQVBpQixDQVNsQjs7O0FBQ0EsUUFBSSxLQUFLc0MsU0FBVCxFQUFvQjtBQUNoQjtBQUNIOztBQUVELFVBQU1hLEVBQUUsR0FBRyxLQUFLVixjQUFMLEVBQVg7O0FBQ0EsVUFBTTBCLFFBQVEsR0FBRyxLQUFLbkMsU0FBTCxDQUFlb0MsT0FBaEM7O0FBQ0EsVUFBTVgsYUFBYSxHQUFHLEtBQUtDLGtCQUFMLEVBQXRCOztBQUNBLFVBQU1tRixTQUFTLEdBQUcxRixFQUFFLENBQUNJLFlBQXJCO0FBQ0EsVUFBTWtGLE1BQU0sR0FBR3JGLElBQUksQ0FBQzBGLEdBQUwsQ0FBU0QsU0FBVCxFQUFvQnBGLGFBQXBCLENBQWY7QUFDQSxTQUFLNkMsTUFBTCxHQUFjbEQsSUFBSSxDQUFDMkYsSUFBTCxDQUFVTixNQUFNLEdBQUcxSSxTQUFuQixDQUFkO0FBQ0EsU0FBS3NHLGFBQUwsR0FBcUIsQ0FBckI7O0FBQ0EsVUFBTTJDLFNBQVMsR0FBRyxLQUFLcEYsY0FBTCxFQUFsQjs7QUFFQSxVQUFNdUMsV0FBVyxHQUFHLEtBQUtBLFdBQXpCOztBQUNBLFFBQUlBLFdBQVcsQ0FBQ0MsYUFBaEIsRUFBK0I7QUFDM0JqQyxNQUFBQSxRQUFRLENBQUNuRCxLQUFULENBQWV5SCxNQUFmLGFBQTJCTyxTQUEzQjtBQUNBN0YsTUFBQUEsRUFBRSxDQUFDVCxTQUFILEdBQWVTLEVBQUUsQ0FBQ0csWUFBbEI7QUFDQXRELE1BQUFBLFFBQVEsQ0FBQyxpQkFBRCxFQUFvQmdKLFNBQXBCLENBQVI7QUFDSCxLQUpELE1BSU8sSUFBSTdDLFdBQVcsQ0FBQzJCLGtCQUFoQixFQUFvQztBQUN2QyxZQUFNQyxXQUFXLEdBQUcsS0FBS0MsZUFBTCxFQUFwQixDQUR1QyxDQUV2QztBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsVUFBSUQsV0FBSixFQUFpQjtBQUNiLGNBQU1rQixNQUFNLEdBQUdsQixXQUFXLENBQUN2RCxTQUEzQjtBQUNBTCxRQUFBQSxRQUFRLENBQUNuRCxLQUFULENBQWV5SCxNQUFmLGFBQTJCTyxTQUEzQjtBQUNBLGNBQU1FLE1BQU0sR0FBR25CLFdBQVcsQ0FBQ3ZELFNBQTNCO0FBQ0EsY0FBTTJFLE9BQU8sR0FBR0QsTUFBTSxHQUFHRCxNQUF6QixDQUphLENBS2I7QUFDQTtBQUNBO0FBQ0E7O0FBQ0E5RixRQUFBQSxFQUFFLENBQUM0RCxRQUFILENBQVksQ0FBWixFQUFlb0MsT0FBZjtBQUNBbkosUUFBQUEsUUFBUSxDQUFDLGlCQUFELEVBQW9CO0FBQUNnSixVQUFBQSxTQUFEO0FBQVlHLFVBQUFBO0FBQVosU0FBcEIsQ0FBUjtBQUNIO0FBQ0o7QUFDSixHQXZuQjJCOztBQXluQjVCbkIsRUFBQUEsZUFBZSxHQUFHO0FBQ2QsVUFBTTdCLFdBQVcsR0FBRyxLQUFLQSxXQUF6QjtBQUNBLFVBQU00QixXQUFXLEdBQUc1QixXQUFXLENBQUM0QixXQUFoQzs7QUFFQSxRQUFJLENBQUNBLFdBQUQsSUFBZ0IsQ0FBQ0EsV0FBVyxDQUFDcUIsYUFBakMsRUFBZ0Q7QUFDNUMsVUFBSWpCLElBQUo7QUFDQSxZQUFNRCxRQUFRLEdBQUcsS0FBS2xHLFNBQUwsQ0FBZW9DLE9BQWYsQ0FBdUJnQixRQUF4QztBQUNBLFlBQU03RCxXQUFXLEdBQUc0RSxXQUFXLENBQUMyQixrQkFBaEM7O0FBRUEsV0FBSyxJQUFJdkMsQ0FBQyxHQUFHMkMsUUFBUSxDQUFDdEQsTUFBVCxHQUFnQixDQUE3QixFQUFnQ1csQ0FBQyxJQUFJLENBQXJDLEVBQXdDLEVBQUVBLENBQTFDLEVBQTZDO0FBQ3pDLGNBQU04RCxDQUFDLEdBQUduQixRQUFRLENBQUMzQyxDQUFELENBQWxCLENBRHlDLENBRXpDO0FBQ0E7O0FBQ0EsWUFBSThELENBQUMsQ0FBQzdELE9BQUYsQ0FBVUMsWUFBVixJQUNBNEQsQ0FBQyxDQUFDN0QsT0FBRixDQUFVQyxZQUFWLENBQXVCQyxLQUF2QixDQUE2QixHQUE3QixFQUFrQzRELE9BQWxDLENBQTBDL0gsV0FBMUMsTUFBMkQsQ0FBQyxDQURoRSxFQUNtRTtBQUMvRDRHLFVBQUFBLElBQUksR0FBR2tCLENBQVA7QUFDQTtBQUNIO0FBQ0o7O0FBQ0QsVUFBSWxCLElBQUosRUFBVTtBQUNObkksUUFBQUEsUUFBUSxDQUFDLHdDQUF3Q21HLFdBQVcsQ0FBQzJCLGtCQUFyRCxDQUFSO0FBQ0g7O0FBQ0QzQixNQUFBQSxXQUFXLENBQUM0QixXQUFaLEdBQTBCSSxJQUExQjtBQUNIOztBQUVELFFBQUksQ0FBQ2hDLFdBQVcsQ0FBQzRCLFdBQWpCLEVBQThCO0FBQzFCL0gsTUFBQUEsUUFBUSxDQUFDLHFCQUFtQm1HLFdBQVcsQ0FBQzJCLGtCQUEvQixHQUFrRCxHQUFuRCxDQUFSO0FBQ0E7QUFDSDs7QUFFRCxXQUFPM0IsV0FBVyxDQUFDNEIsV0FBbkI7QUFDSCxHQXhwQjJCOztBQTBwQjVCbkUsRUFBQUEsY0FBYyxHQUFHO0FBQ2IsV0FBTyxLQUFLeUMsYUFBTCxHQUFzQixLQUFLQyxNQUFMLEdBQWN2RyxTQUEzQztBQUNILEdBNXBCMkI7O0FBOHBCNUIyRCxFQUFBQSxrQkFBa0IsR0FBRztBQUNqQixVQUFNUyxRQUFRLEdBQUcsS0FBS25DLFNBQUwsQ0FBZW9DLE9BQWhDO0FBQ0EsVUFBTW1GLFFBQVEsR0FBR3BGLFFBQVEsQ0FBQ3FGLGdCQUExQjtBQUNBLFVBQU1DLGNBQWMsR0FBR0YsUUFBUSxHQUFHQSxRQUFRLENBQUMvRSxTQUFULEdBQXFCK0UsUUFBUSxDQUFDaEcsWUFBakMsR0FBZ0QsQ0FBL0U7QUFDQSxVQUFNbUcsWUFBWSxHQUFHdkYsUUFBUSxDQUFDRyxpQkFBVCxHQUE2QkgsUUFBUSxDQUFDRyxpQkFBVCxDQUEyQkUsU0FBeEQsR0FBb0UsQ0FBekYsQ0FKaUIsQ0FLakI7O0FBQ0EsV0FBT2lGLGNBQWMsR0FBR0MsWUFBakIsR0FBaUMsS0FBSyxDQUE3QztBQUNILEdBcnFCMkI7O0FBdXFCNUJ0QixFQUFBQSxjQUFjLENBQUNELElBQUQsRUFBTztBQUNqQjtBQUNBLFdBQU8sS0FBS25HLFNBQUwsQ0FBZW9DLE9BQWYsQ0FBdUJiLFlBQXZCLEdBQXNDNEUsSUFBSSxDQUFDM0QsU0FBbEQ7QUFDSCxHQTFxQjJCOztBQTRxQjVCOzs7QUFHQS9CLEVBQUFBLGNBQWMsRUFBRSxZQUFXO0FBQ3ZCLFFBQUksS0FBS0gsU0FBVCxFQUFvQjtBQUNoQjtBQUNBO0FBQ0EsWUFBTSxJQUFJcUgsS0FBSixDQUFVLGtEQUFWLENBQU47QUFDSDs7QUFFRCxRQUFJLENBQUMsS0FBS0MsVUFBVixFQUFzQjtBQUNsQjtBQUNBO0FBQ0EsWUFBTSxJQUFJRCxLQUFKLENBQVUsMEVBQVYsQ0FBTjtBQUNIOztBQUVELFdBQU8sS0FBS0MsVUFBWjtBQUNILEdBN3JCMkI7QUErckI1QkMsRUFBQUEsY0FBYyxFQUFFLFVBQVNDLFNBQVQsRUFBb0I7QUFDaEMsU0FBS0YsVUFBTCxHQUFrQkUsU0FBbEI7QUFDSCxHQWpzQjJCOztBQW1zQjVCOzs7OztBQUtBOUcsRUFBQUEsZ0JBQWdCLEVBQUUsWUFBVztBQUN6QixVQUFNK0csV0FBVyxHQUFHLEtBQUsvSCxTQUFMLENBQWVvQyxPQUFuQztBQUNBLFVBQU1lLEtBQUssR0FBRzRFLFdBQVcsSUFBSUEsV0FBVyxDQUFDM0UsUUFBekM7O0FBQ0EsUUFBSSxDQUFDMkUsV0FBTCxFQUFrQjtBQUNkO0FBQ0g7O0FBQ0QsUUFBSUMsWUFBSjs7QUFDQSxTQUFLLElBQUl6RSxDQUFDLEdBQUdKLEtBQUssQ0FBQ1AsTUFBTixHQUFlLENBQTVCLEVBQStCVyxDQUFDLElBQUksQ0FBcEMsRUFBdUNBLENBQUMsRUFBeEMsRUFBNEM7QUFDeEMsWUFBTTRDLElBQUksR0FBR2hELEtBQUssQ0FBQ0ksQ0FBRCxDQUFsQjs7QUFDQSxVQUFJNEMsSUFBSSxDQUFDM0MsT0FBTCxDQUFhQyxZQUFqQixFQUErQjtBQUMzQnVFLFFBQUFBLFlBQVksR0FBRzdCLElBQWY7QUFDQTtBQUNIO0FBQ0o7O0FBQ0QsUUFBSSxDQUFDNkIsWUFBTCxFQUFtQjtBQUNmO0FBQ0g7O0FBQ0QsU0FBS0MscUJBQUw7QUFDQSxVQUFNQyxnQkFBZ0IsR0FBR0gsV0FBVyxDQUFDeEcsWUFBWixJQUE0QnlHLFlBQVksQ0FBQ3hGLFNBQWIsR0FBeUJ3RixZQUFZLENBQUN6RyxZQUFsRSxDQUF6QjtBQUNBLFNBQUtSLHFCQUFMLEdBQTZCO0FBQ3pCbUgsTUFBQUEsZ0JBQWdCLEVBQUVBLGdCQURPO0FBRXpCQyxNQUFBQSxVQUFVLEVBQUVIO0FBRmEsS0FBN0I7QUFJQWhLLElBQUFBLFFBQVEsQ0FBQywrQkFBRCxFQUFrQ2tLLGdCQUFsQyxFQUFvRCxnQkFBcEQsQ0FBUjtBQUNILEdBaHVCMkI7O0FBa3VCNUI7QUFDQUQsRUFBQUEscUJBQXFCLEVBQUUsWUFBVztBQUM5QixVQUFNRixXQUFXLEdBQUcsS0FBSy9ILFNBQUwsQ0FBZW9DLE9BQW5DO0FBQ0EsVUFBTWdHLGNBQWMsR0FBR0wsV0FBVyxJQUFJQSxXQUFXLENBQUNYLGFBQWxEO0FBQ0EsUUFBSWdCLGNBQUosRUFBb0JBLGNBQWMsQ0FBQ3BKLEtBQWYsQ0FBcUJxSixhQUFyQixHQUFxQyxJQUFyQztBQUNwQixTQUFLdEgscUJBQUwsR0FBNkIsSUFBN0I7QUFDQS9DLElBQUFBLFFBQVEsQ0FBQywyQkFBRCxDQUFSO0FBQ0gsR0F6dUIyQjs7QUEydUI1Qjs7Ozs7Ozs7QUFRQW9DLEVBQUFBLHNCQUFzQixFQUFFLFlBQVc7QUFDL0IsUUFBSSxLQUFLVyxxQkFBVCxFQUFnQztBQUM1QixZQUFNSSxFQUFFLEdBQUcsS0FBS1YsY0FBTCxFQUFYOztBQUNBLFlBQU0wRCxXQUFXLEdBQUcsS0FBS0EsV0FBekI7QUFDQSxZQUFNNEQsV0FBVyxHQUFHLEtBQUsvSCxTQUFMLENBQWVvQyxPQUFuQztBQUNBLFlBQU07QUFBQytGLFFBQUFBLFVBQUQ7QUFBYUQsUUFBQUE7QUFBYixVQUFpQyxLQUFLbkgscUJBQTVDLENBSjRCLENBSzVCOztBQUNBLFlBQU1xSCxjQUFjLEdBQUdMLFdBQVcsQ0FBQ1gsYUFBbkMsQ0FONEIsQ0FPNUI7O0FBQ0EsVUFBSWtCLFdBQVcsR0FBRyxDQUFDSCxVQUFVLENBQUNmLGFBQTlCLENBUjRCLENBUzVCOztBQUNBLFVBQUksQ0FBQ2tCLFdBQUQsSUFBZ0IsQ0FBQ25FLFdBQVcsQ0FBQ0MsYUFBakMsRUFBZ0Q7QUFDNUMsY0FBTW1FLGtCQUFrQixHQUFHcEgsRUFBRSxDQUFDRyxZQUFILElBQW1CSCxFQUFFLENBQUNULFNBQUgsR0FBZVMsRUFBRSxDQUFDSSxZQUFyQyxDQUEzQjtBQUNBK0csUUFBQUEsV0FBVyxHQUFHQyxrQkFBa0IsSUFBSSxHQUFwQztBQUNILE9BYjJCLENBYzVCOzs7QUFDQSxVQUFJLENBQUNELFdBQUwsRUFBa0I7QUFDZCxjQUFNRSxhQUFhLEdBQUdULFdBQVcsQ0FBQ3hHLFlBQVosSUFBNEI0RyxVQUFVLENBQUMzRixTQUFYLEdBQXVCMkYsVUFBVSxDQUFDNUcsWUFBOUQsQ0FBdEI7QUFDQSxjQUFNa0gsVUFBVSxHQUFHUCxnQkFBZ0IsR0FBR00sYUFBdEM7O0FBQ0EsWUFBSUMsVUFBVSxHQUFHLENBQWpCLEVBQW9CO0FBQ2hCTCxVQUFBQSxjQUFjLENBQUNwSixLQUFmLENBQXFCcUosYUFBckIsYUFBd0NJLFVBQXhDO0FBQ0F6SyxVQUFBQSxRQUFRLENBQUMsMkJBQUQsRUFBOEJ5SyxVQUE5QixFQUEwQyxnQkFBMUMsQ0FBUjtBQUNILFNBSEQsTUFHTyxJQUFJQSxVQUFVLEdBQUcsQ0FBakIsRUFBb0I7QUFDdkJILFVBQUFBLFdBQVcsR0FBRyxJQUFkO0FBQ0g7QUFDSjs7QUFDRCxVQUFJQSxXQUFKLEVBQWlCO0FBQ2IsYUFBS0wscUJBQUw7QUFDSDtBQUNKO0FBQ0osR0FqeEIyQjtBQW14QjVCUyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQSx3QkFBUSw2QkFBQywwQkFBRDtBQUFtQixNQUFBLFVBQVUsRUFBRSxLQUFLYixjQUFwQztBQUNBLE1BQUEsUUFBUSxFQUFFLEtBQUtoSixRQURmO0FBRUEsTUFBQSxTQUFTLDJCQUFvQixLQUFLZSxLQUFMLENBQVdkLFNBQS9CLENBRlQ7QUFFcUQsTUFBQSxLQUFLLEVBQUUsS0FBS2MsS0FBTCxDQUFXWjtBQUZ2RSxvQkFHSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSSxNQUFBLEdBQUcsRUFBRSxLQUFLZ0IsU0FBZDtBQUF5QixNQUFBLFNBQVMsRUFBQyx5QkFBbkM7QUFBNkQsbUJBQVUsUUFBdkU7QUFBZ0YsTUFBQSxJQUFJLEVBQUM7QUFBckYsT0FDTSxLQUFLSixLQUFMLENBQVd3RCxRQURqQixDQURKLENBSEosQ0FBUjtBQVVIO0FBcHlCMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IEtleSB9IGZyb20gJy4uLy4uL0tleWJvYXJkJztcbmltcG9ydCBUaW1lciBmcm9tICcuLi8uLi91dGlscy9UaW1lcic7XG5pbXBvcnQgQXV0b0hpZGVTY3JvbGxiYXIgZnJvbSBcIi4vQXV0b0hpZGVTY3JvbGxiYXJcIjtcblxuY29uc3QgREVCVUdfU0NST0xMID0gZmFsc2U7XG5cbi8vIFRoZSBhbW91bnQgb2YgZXh0cmEgc2Nyb2xsIGRpc3RhbmNlIHRvIGFsbG93IHByaW9yIHRvIHVuZmlsbGluZy5cbi8vIFNlZSBfZ2V0RXhjZXNzSGVpZ2h0LlxuY29uc3QgVU5QQUdJTkFUSU9OX1BBRERJTkcgPSA2MDAwO1xuLy8gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVib3VuY2UgY2FsbHMgdG8gb25VbmZpbGxSZXF1ZXN0LCB0byBwcmV2ZW50XG4vLyBtYW55IHNjcm9sbCBldmVudHMgY2F1c2luZyBtYW55IHVuZmlsbGluZyByZXF1ZXN0cy5cbmNvbnN0IFVORklMTF9SRVFVRVNUX0RFQk9VTkNFX01TID0gMjAwO1xuLy8gX3VwZGF0ZUhlaWdodCBtYWtlcyB0aGUgaGVpZ2h0IGEgY2VpbGVkIG11bHRpcGxlIG9mIHRoaXMgc28gd2Vcbi8vIGRvbid0IGhhdmUgdG8gdXBkYXRlIHRoZSBoZWlnaHQgdG9vIG9mdGVuLiBJdCBhbHNvIGFsbG93cyB0aGUgdXNlclxuLy8gdG8gc2Nyb2xsIHBhc3QgdGhlIHBhZ2luYXRpb24gc3Bpbm5lciBhIGJpdCBzbyB0aGV5IGRvbid0IGZlZWwgYmxvY2tlZCBzb1xuLy8gbXVjaCB3aGlsZSB0aGUgY29udGVudCBsb2Fkcy5cbmNvbnN0IFBBR0VfU0laRSA9IDQwMDtcblxubGV0IGRlYnVnbG9nO1xuaWYgKERFQlVHX1NDUk9MTCkge1xuICAgIC8vIHVzaW5nIGJpbmQgbWVhbnMgdGhhdCB3ZSBnZXQgdG8ga2VlcCB1c2VmdWwgbGluZSBudW1iZXJzIGluIHRoZSBjb25zb2xlXG4gICAgZGVidWdsb2cgPSBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUsIFwiU2Nyb2xsUGFuZWwgZGVidWdsb2c6XCIpO1xufSBlbHNlIHtcbiAgICBkZWJ1Z2xvZyA9IGZ1bmN0aW9uKCkge307XG59XG5cbi8qIFRoaXMgY29tcG9uZW50IGltcGxlbWVudHMgYW4gaW50ZWxsaWdlbnQgc2Nyb2xsaW5nIGxpc3QuXG4gKlxuICogSXQgd3JhcHMgYSBsaXN0IG9mIDxsaT4gY2hpbGRyZW47IHdoZW4gaXRlbXMgYXJlIGFkZGVkIHRvIHRoZSBzdGFydCBvciBlbmRcbiAqIG9mIHRoZSBsaXN0LCB0aGUgc2Nyb2xsIHBvc2l0aW9uIGlzIHVwZGF0ZWQgc28gdGhhdCB0aGUgdXNlciBzdGlsbCBzZWVzIHRoZVxuICogc2FtZSBwb3NpdGlvbiBpbiB0aGUgbGlzdC5cbiAqXG4gKiBJdCBhbHNvIHByb3ZpZGVzIGEgaG9vayB3aGljaCBhbGxvd3MgcGFyZW50cyB0byBwcm92aWRlIG1vcmUgbGlzdCBlbGVtZW50c1xuICogd2hlbiB3ZSBnZXQgY2xvc2UgdG8gdGhlIHN0YXJ0IG9yIGVuZCBvZiB0aGUgbGlzdC5cbiAqXG4gKiBFYWNoIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGhhdmUgYSAnZGF0YS1zY3JvbGwtdG9rZW5zJy4gVGhpcyBzdHJpbmcgb2ZcbiAqIGNvbW1hLXNlcGFyYXRlZCB0b2tlbnMgbWF5IGNvbnRhaW4gYSBzaW5nbGUgdG9rZW4gb3IgbWFueSwgd2hlcmUgbWFueSBpbmRpY2F0ZXNcbiAqIHRoYXQgdGhlIGVsZW1lbnQgY29udGFpbnMgZWxlbWVudHMgdGhhdCBoYXZlIHNjcm9sbCB0b2tlbnMgdGhlbXNlbHZlcy4gVGhlIGZpcnN0XG4gKiB0b2tlbiBpbiAnZGF0YS1zY3JvbGwtdG9rZW5zJyBpcyB1c2VkIHRvIHNlcmlhbGlzZSB0aGUgc2Nyb2xsIHN0YXRlLCBhbmQgcmV0dXJuZWRcbiAqIGFzIHRoZSAndHJhY2tlZFNjcm9sbFRva2VuJyBhdHRyaWJ1dGUgYnkgZ2V0U2Nyb2xsU3RhdGUoKS5cbiAqXG4gKiBJTVBPUlRBTlQ6IElORElWSURVQUwgVE9LRU5TIFdJVEhJTiAnZGF0YS1zY3JvbGwtdG9rZW5zJyBNVVNUIE5PVCBDT05UQUlOIENPTU1BUy5cbiAqXG4gKiBTb21lIG5vdGVzIGFib3V0IHRoZSBpbXBsZW1lbnRhdGlvbjpcbiAqXG4gKiBUaGUgc2F2ZWQgJ3Njcm9sbFN0YXRlJyBjYW4gZXhpc3QgaW4gb25lIG9mIHR3byBzdGF0ZXM6XG4gKlxuICogICAtIHN0dWNrQXRCb3R0b206ICh0aGUgZGVmYXVsdCwgYW5kIHJlc3RvcmVkIGJ5IHJlc2V0U2Nyb2xsU3RhdGUpOiB0aGVcbiAqICAgICB2aWV3cG9ydCBpcyBzY3JvbGxlZCBkb3duIGFzIGZhciBhcyBpdCBjYW4gYmUuIFdoZW4gdGhlIGNoaWxkcmVuIGFyZVxuICogICAgIHVwZGF0ZWQsIHRoZSBzY3JvbGwgcG9zaXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIGVuc3VyZSBpdCBpcyBzdGlsbCBhdFxuICogICAgIHRoZSBib3R0b20uXG4gKlxuICogICAtIGZpeGVkLCBpbiB3aGljaCB0aGUgdmlld3BvcnQgaXMgY29uY2VwdHVhbGx5IHRpZWQgYXQgYSBzcGVjaWZpYyBzY3JvbGxcbiAqICAgICBvZmZzZXQuICBXZSBkb24ndCBzYXZlIHRoZSBhYnNvbHV0ZSBzY3JvbGwgb2Zmc2V0LCBiZWNhdXNlIHRoYXQgd291bGQgYmVcbiAqICAgICBhZmZlY3RlZCBieSB3aW5kb3cgd2lkdGgsIHpvb20gbGV2ZWwsIGFtb3VudCBvZiBzY3JvbGxiYWNrLCBldGMuIEluc3RlYWRcbiAqICAgICB3ZSBzYXZlIGFuIGlkZW50aWZpZXIgZm9yIHRoZSBsYXN0IGZ1bGx5LXZpc2libGUgbWVzc2FnZSwgYW5kIHRoZSBudW1iZXJcbiAqICAgICBvZiBwaXhlbHMgdGhlIHdpbmRvdyB3YXMgc2Nyb2xsZWQgYmVsb3cgaXQgLSB3aGljaCBpcyBob3BlZnVsbHkgbmVhclxuICogICAgIGVub3VnaC5cbiAqXG4gKiBUaGUgJ3N0aWNreUJvdHRvbScgcHJvcGVydHkgY29udHJvbHMgdGhlIGJlaGF2aW91ciB3aGVuIHdlIHJlYWNoIHRoZSBib3R0b21cbiAqIG9mIHRoZSB3aW5kb3cgKGVpdGhlciB0aHJvdWdoIGEgdXNlci1pbml0aWF0ZWQgc2Nyb2xsLCBvciBieSBjYWxsaW5nXG4gKiBzY3JvbGxUb0JvdHRvbSkuIElmIHN0aWNreUJvdHRvbSBpcyBlbmFibGVkLCB0aGUgc2Nyb2xsU3RhdGUgd2lsbCBlbnRlclxuICogJ3N0dWNrQXRCb3R0b20nIHN0YXRlIC0gZW5zdXJpbmcgdGhhdCBuZXcgYWRkaXRpb25zIGNhdXNlIHRoZSB3aW5kb3cgdG9cbiAqIHNjcm9sbCBkb3duIGZ1cnRoZXIuIElmIHN0aWNreUJvdHRvbSBpcyBkaXNhYmxlZCwgd2UganVzdCBzYXZlIHRoZSBzY3JvbGxcbiAqIG9mZnNldCBhcyBub3JtYWwuXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdTY3JvbGxQYW5lbCcsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLyogc3RpY2t5Qm90dG9tOiBpZiBzZXQgdG8gdHJ1ZSwgdGhlbiBvbmNlIHRoZSB1c2VyIGhpdHMgdGhlIGJvdHRvbSBvZlxuICAgICAgICAgKiB0aGUgbGlzdCwgYW55IG5ldyBjaGlsZHJlbiBhZGRlZCB0byB0aGUgbGlzdCB3aWxsIGNhdXNlIHRoZSBsaXN0IHRvXG4gICAgICAgICAqIHNjcm9sbCBkb3duIHRvIHNob3cgdGhlIG5ldyBlbGVtZW50LCByYXRoZXIgdGhhbiBwcmVzZXJ2aW5nIHRoZVxuICAgICAgICAgKiBleGlzdGluZyB2aWV3LlxuICAgICAgICAgKi9cbiAgICAgICAgc3RpY2t5Qm90dG9tOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvKiBzdGFydEF0Qm90dG9tOiBpZiBzZXQgdG8gdHJ1ZSwgdGhlIHZpZXcgaXMgYXNzdW1lZCB0byBzdGFydFxuICAgICAgICAgKiBzY3JvbGxlZCB0byB0aGUgYm90dG9tLlxuICAgICAgICAgKiBYWFg6IEl0J3MgbGlrbGV5IHRoaXMgaXMgdW5lY2Vzc2FyeSBhbmQgY2FuIGJlIGRlcml2ZWQgZnJvbVxuICAgICAgICAgKiBzdGlja3lCb3R0b20sIGJ1dCBJJ20gYWRkaW5nIGFuIGV4dHJhIHBhcmFtZXRlciB0byBlbnN1cmVcbiAgICAgICAgICogYmVoYXZpb3VyIHN0YXlzIHRoZSBzYW1lIGZvciBvdGhlciB1c2VzIG9mIFNjcm9sbFBhbmVsLlxuICAgICAgICAgKiBJZiBzbywgbGV0J3MgcmVtb3ZlIHRoaXMgcGFyYW1ldGVyIGRvd24gdGhlIGxpbmUuXG4gICAgICAgICAqL1xuICAgICAgICBzdGFydEF0Qm90dG9tOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvKiBvbkZpbGxSZXF1ZXN0KGJhY2t3YXJkcyk6IGEgY2FsbGJhY2sgd2hpY2ggaXMgY2FsbGVkIG9uIHNjcm9sbCB3aGVuXG4gICAgICAgICAqIHRoZSB1c2VyIG5lYXJzIHRoZSBzdGFydCAoYmFja3dhcmRzID0gdHJ1ZSkgb3IgZW5kIChiYWNrd2FyZHMgPVxuICAgICAgICAgKiBmYWxzZSkgb2YgdGhlIGxpc3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgc2hvdWxkIHJldHVybiBhIHByb21pc2U7IG5vIG1vcmUgY2FsbHMgd2lsbCBiZSBtYWRlIHVudGlsIHRoZVxuICAgICAgICAgKiBwcm9taXNlIGNvbXBsZXRlcy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIHByb21pc2Ugc2hvdWxkIHJlc29sdmUgdG8gdHJ1ZSBpZiB0aGVyZSBpcyBtb3JlIGRhdGEgdG8gYmVcbiAgICAgICAgICogcmV0cmlldmVkIGluIHRoaXMgZGlyZWN0aW9uIChpbiB3aGljaCBjYXNlIG9uRmlsbFJlcXVlc3QgbWF5IGJlXG4gICAgICAgICAqIGNhbGxlZCBhZ2FpbiBpbW1lZGlhdGVseSksIG9yIGZhbHNlIGlmIHRoZXJlIGlzIG5vIG1vcmUgZGF0YSBpbiB0aGlzXG4gICAgICAgICAqIGRpcmVjdG9uIChhdCB0aGlzIHRpbWUpIC0gd2hpY2ggd2lsbCBzdG9wIHRoZSBwYWdpbmF0aW9uIGN5Y2xlIHVudGlsXG4gICAgICAgICAqIHRoZSB1c2VyIHNjcm9sbHMgYWdhaW4uXG4gICAgICAgICAqL1xuICAgICAgICBvbkZpbGxSZXF1ZXN0OiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvKiBvblVuZmlsbFJlcXVlc3QoYmFja3dhcmRzKTogYSBjYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgb24gc2Nyb2xsIHdoZW5cbiAgICAgICAgICogdGhlcmUgYXJlIGNoaWxkcmVuIGVsZW1lbnRzIHRoYXQgYXJlIGZhciBvdXQgb2YgdmlldyBhbmQgY291bGQgYmUgcmVtb3ZlZFxuICAgICAgICAgKiB3aXRob3V0IGNhdXNpbmcgcGFnaW5hdGlvbiB0byBvY2N1ci5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWNjZXB0IGEgYm9vbGVhbiwgd2hpY2ggaXMgdHJ1ZSB0byBpbmRpY2F0ZSB0aGUgYmFjay90b3BcbiAgICAgICAgICogb2YgdGhlIHBhbmVsIGFuZCBmYWxzZSBvdGhlcndpc2UsIGFuZCBhIHNjcm9sbCB0b2tlbiwgd2hpY2ggcmVmZXJzIHRvIHRoZVxuICAgICAgICAgKiBmaXJzdCBlbGVtZW50IHRvIHJlbW92ZSBpZiByZW1vdmluZyBmcm9tIHRoZSBmcm9udC9ib3R0b20sIGFuZCBsYXN0IGVsZW1lbnRcbiAgICAgICAgICogdG8gcmVtb3ZlIGlmIHJlbW92aW5nIGZyb20gdGhlIGJhY2svdG9wLlxuICAgICAgICAgKi9cbiAgICAgICAgb25VbmZpbGxSZXF1ZXN0OiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICAvKiBvblNjcm9sbDogYSBjYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgd2hlbmV2ZXIgYW55IHNjcm9sbCBoYXBwZW5zLlxuICAgICAgICAgKi9cbiAgICAgICAgb25TY3JvbGw6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8qIGNsYXNzTmFtZTogY2xhc3NuYW1lcyB0byBhZGQgdG8gdGhlIHRvcC1sZXZlbCBkaXZcbiAgICAgICAgICovXG4gICAgICAgIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvKiBzdHlsZTogc3R5bGVzIHRvIGFkZCB0byB0aGUgdG9wLWxldmVsIGRpdlxuICAgICAgICAgKi9cbiAgICAgICAgc3R5bGU6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgICAgIC8qIHJlc2l6ZU5vdGlmaWVyOiBSZXNpemVOb3RpZmllciB0byBrbm93IHdoZW4gbWlkZGxlIGNvbHVtbiBoYXMgY2hhbmdlZCBzaXplXG4gICAgICAgICAqL1xuICAgICAgICByZXNpemVOb3RpZmllcjogUHJvcFR5cGVzLm9iamVjdCxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0aWNreUJvdHRvbTogdHJ1ZSxcbiAgICAgICAgICAgIHN0YXJ0QXRCb3R0b206IHRydWUsXG4gICAgICAgICAgICBvbkZpbGxSZXF1ZXN0OiBmdW5jdGlvbihiYWNrd2FyZHMpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7IH0sXG4gICAgICAgICAgICBvblVuZmlsbFJlcXVlc3Q6IGZ1bmN0aW9uKGJhY2t3YXJkcywgc2Nyb2xsVG9rZW4pIHt9LFxuICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIGNvbXBvbmVudCB3aXRoIHJlYWwgY2xhc3MsIHVzZSBjb25zdHJ1Y3RvciBmb3IgcmVmc1xuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9wZW5kaW5nRmlsbFJlcXVlc3RzID0ge2I6IG51bGwsIGY6IG51bGx9O1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyLm9uKFwibWlkZGxlUGFuZWxSZXNpemVkXCIsIHRoaXMub25SZXNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFNjcm9sbFN0YXRlKCk7XG5cbiAgICAgICAgdGhpcy5faXRlbWxpc3QgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNoZWNrU2Nyb2xsKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGFmdGVyIGFkZGluZyBldmVudCB0aWxlcywgd2UgbWF5IG5lZWQgdG8gdHdlYWsgdGhlIHNjcm9sbCAoZWl0aGVyIHRvXG4gICAgICAgIC8vIGtlZXAgYXQgdGhlIGJvdHRvbSBvZiB0aGUgdGltZWxpbmUsIG9yIHRvIG1haW50YWluIHRoZSB2aWV3IGFmdGVyXG4gICAgICAgIC8vIGFkZGluZyBldmVudHMgdG8gdGhlIHRvcCkuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoaXMgd2lsbCBhbHNvIHJlLWNoZWNrIHRoZSBmaWxsIHN0YXRlLCBpbiBjYXNlIHRoZSBwYWdpbmF0ZSB3YXMgaW5hZGVxdWF0ZVxuICAgICAgICB0aGlzLmNoZWNrU2Nyb2xsKCk7XG4gICAgICAgIHRoaXMudXBkYXRlUHJldmVudFNocmlua2luZygpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHNldCBhIGJvb2xlYW4gdG8gc2F5IHdlJ3ZlIGJlZW4gdW5tb3VudGVkLCB3aGljaCBhbnkgcGVuZGluZ1xuICAgICAgICAvLyBwcm9taXNlcyBjYW4gdXNlIHRvIHRocm93IGF3YXkgdGhlaXIgcmVzdWx0cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gKFdlIGNvdWxkIHVzZSBpc01vdW50ZWQoKSwgYnV0IGZhY2Vib29rIGhhdmUgZGVwcmVjYXRlZCB0aGF0LilcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyLnJlbW92ZUxpc3RlbmVyKFwibWlkZGxlUGFuZWxSZXNpemVkXCIsIHRoaXMub25SZXNpemUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uU2Nyb2xsOiBmdW5jdGlvbihldikge1xuICAgICAgICBkZWJ1Z2xvZyhcIm9uU2Nyb2xsXCIsIHRoaXMuX2dldFNjcm9sbE5vZGUoKS5zY3JvbGxUb3ApO1xuICAgICAgICB0aGlzLl9zY3JvbGxUaW1lb3V0LnJlc3RhcnQoKTtcbiAgICAgICAgdGhpcy5fc2F2ZVNjcm9sbFN0YXRlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlUHJldmVudFNocmlua2luZygpO1xuICAgICAgICB0aGlzLnByb3BzLm9uU2Nyb2xsKGV2KTtcbiAgICAgICAgdGhpcy5jaGVja0ZpbGxTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICBvblJlc2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2hlY2tTY3JvbGwoKTtcbiAgICAgICAgLy8gdXBkYXRlIHByZXZlbnRTaHJpbmtpbmdTdGF0ZSBpZiBwcmVzZW50XG4gICAgICAgIGlmICh0aGlzLnByZXZlbnRTaHJpbmtpbmdTdGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5wcmV2ZW50U2hyaW5raW5nKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gYWZ0ZXIgYW4gdXBkYXRlIHRvIHRoZSBjb250ZW50cyBvZiB0aGUgcGFuZWwsIGNoZWNrIHRoYXQgdGhlIHNjcm9sbCBpc1xuICAgIC8vIHdoZXJlIGl0IG91Z2h0IHRvIGJlLCBhbmQgc2V0IG9mZiBwYWdpbmF0aW9uIHJlcXVlc3RzIGlmIG5lY2Vzc2FyeS5cbiAgICBjaGVja1Njcm9sbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jlc3RvcmVTYXZlZFNjcm9sbFN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2hlY2tGaWxsU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgdGhlIGNvbnRlbnQgaXMgZnVsbHkgc2Nyb2xsZWQgZG93biByaWdodCBub3c7IGVsc2UgZmFsc2UuXG4gICAgLy9cbiAgICAvLyBub3RlIHRoYXQgdGhpcyBpcyBpbmRlcGVuZGVudCBvZiB0aGUgJ3N0dWNrQXRCb3R0b20nIHN0YXRlIC0gaXQgaXMgc2ltcGx5XG4gICAgLy8gYWJvdXQgd2hldGhlciB0aGUgY29udGVudCBpcyBzY3JvbGxlZCBkb3duIHJpZ2h0IG5vdywgaXJyZXNwZWN0aXZlIG9mXG4gICAgLy8gd2hldGhlciBpdCB3aWxsIHN0YXkgdGhhdCB3YXkgd2hlbiB0aGUgY2hpbGRyZW4gdXBkYXRlLlxuICAgIGlzQXRCb3R0b206IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBzbiA9IHRoaXMuX2dldFNjcm9sbE5vZGUoKTtcbiAgICAgICAgLy8gZnJhY3Rpb25hbCB2YWx1ZXMgKGJvdGggdG9vIGJpZyBhbmQgdG9vIHNtYWxsKVxuICAgICAgICAvLyBmb3Igc2Nyb2xsVG9wIGhhcHBlbiBvbiBjZXJ0YWluIGJyb3dzZXJzL3BsYXRmb3Jtc1xuICAgICAgICAvLyB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGRvd24uIEUuZy4gQ2hyb21lIDcyIG9uIGRlYmlhbi5cbiAgICAgICAgLy8gc28gY2hlY2sgZGlmZmVyZW5jZSA8PSAxO1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoc24uc2Nyb2xsSGVpZ2h0IC0gKHNuLnNjcm9sbFRvcCArIHNuLmNsaWVudEhlaWdodCkpIDw9IDE7XG5cbiAgICB9LFxuXG4gICAgLy8gcmV0dXJucyB0aGUgdmVydGljYWwgaGVpZ2h0IGluIHRoZSBnaXZlbiBkaXJlY3Rpb24gdGhhdCBjYW4gYmUgcmVtb3ZlZCBmcm9tXG4gICAgLy8gdGhlIGNvbnRlbnQgYm94ICh3aGljaCBoYXMgYSBoZWlnaHQgb2Ygc2Nyb2xsSGVpZ2h0LCBzZWUgY2hlY2tGaWxsU3RhdGUpIHdpdGhvdXRcbiAgICAvLyBwYWdpbmF0aW9uIG9jY3VyaW5nLlxuICAgIC8vXG4gICAgLy8gcGFkZGluZyogPSBVTlBBR0lOQVRJT05fUEFERElOR1xuICAgIC8vXG4gICAgLy8gIyMjIFJlZ2lvbiBkZXRlcm1pbmVkIGFzIGV4Y2Vzcy5cbiAgICAvL1xuICAgIC8vICAgLi0tLS0tLS0tLS4gICAgICAgICAgICAgICAgICAgICAgICAtICAgICAgICAgICAgICAtXG4gICAgLy8gICB8IyMjIyMjIyMjfCAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAgICAvLyAgIHwjIyMjIyMjIyN8ICAgLSAgICAgICAgICAgICAgICAgICAgfCAgc2Nyb2xsVG9wICAgfFxuICAgIC8vICAgfCAgICAgICAgIHwgICB8IHBhZGRpbmcqICAgICAgICAgICB8ICAgICAgICAgICAgICB8XG4gICAgLy8gICB8ICAgICAgICAgfCAgIHwgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAgICAvLyAuLSstLS0tLS0tLS0rLS4gLSAgLSAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgfFxuICAgIC8vIDogfCAgICAgICAgIHwgOiAgICB8ICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICB8XG4gICAgLy8gOiB8ICAgICAgICAgfCA6ICAgIHwgIGNsaWVudEhlaWdodCAgIHwgICAgICAgICAgICAgIHxcbiAgICAvLyA6IHwgICAgICAgICB8IDogICAgfCAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgfFxuICAgIC8vIC4tKy0tLS0tLS0tLSstLiAgICAtICAgICAgICAgICAgICAgICAtICAgICAgICAgICAgICB8XG4gICAgLy8gfCB8ICAgICAgICAgfCB8ICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAvLyB8IHwgICAgICAgICB8IHwgICAgfCAgY2xpZW50SGVpZ2h0ICAgICAgICAgICAgICAgICAgfCBzY3JvbGxIZWlnaHRcbiAgICAvLyB8IHwgICAgICAgICB8IHwgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIC8vIGAtKy0tLS0tLS0tLSstJyAgICAtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgLy8gOiB8ICAgICAgICAgfCA6ICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAvLyA6IHwgICAgICAgICB8IDogICAgfCAgY2xpZW50SGVpZ2h0ICAgICAgICAgICAgICAgICAgfFxuICAgIC8vIDogfCAgICAgICAgIHwgOiAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgLy8gYC0rLS0tLS0tLS0tKy0nIC0gIC0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAvLyAgIHwgICAgICAgICB8ICAgfCBwYWRkaW5nKiAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIC8vICAgfCAgICAgICAgIHwgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgLy8gICB8IyMjIyMjIyMjfCAgIC0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAvLyAgIHwjIyMjIyMjIyN8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIC8vICAgYC0tLS0tLS0tLScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtXG4gICAgX2dldEV4Y2Vzc0hlaWdodDogZnVuY3Rpb24oYmFja3dhcmRzKSB7XG4gICAgICAgIGNvbnN0IHNuID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICBjb25zdCBjb250ZW50SGVpZ2h0ID0gdGhpcy5fZ2V0TWVzc2FnZXNIZWlnaHQoKTtcbiAgICAgICAgY29uc3QgbGlzdEhlaWdodCA9IHRoaXMuX2dldExpc3RIZWlnaHQoKTtcbiAgICAgICAgY29uc3QgY2xpcHBlZEhlaWdodCA9IGNvbnRlbnRIZWlnaHQgLSBsaXN0SGVpZ2h0O1xuICAgICAgICBjb25zdCB1bmNsaXBwZWRTY3JvbGxUb3AgPSBzbi5zY3JvbGxUb3AgKyBjbGlwcGVkSGVpZ2h0O1xuXG4gICAgICAgIGlmIChiYWNrd2FyZHMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmNsaXBwZWRTY3JvbGxUb3AgLSBzbi5jbGllbnRIZWlnaHQgLSBVTlBBR0lOQVRJT05fUEFERElORztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50SGVpZ2h0IC0gKHVuY2xpcHBlZFNjcm9sbFRvcCArIDIqc24uY2xpZW50SGVpZ2h0KSAtIFVOUEFHSU5BVElPTl9QQURESU5HO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIGNoZWNrIHRoZSBzY3JvbGwgc3RhdGUgYW5kIHNlbmQgb3V0IGJhY2tmaWxsIHJlcXVlc3RzIGlmIG5lY2Vzc2FyeS5cbiAgICBjaGVja0ZpbGxTdGF0ZTogYXN5bmMgZnVuY3Rpb24oZGVwdGg9MCkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzRmlyc3RDYWxsID0gZGVwdGggPT09IDA7XG4gICAgICAgIGNvbnN0IHNuID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGxlc3MgdGhhbiBhIHNjcmVlbmZ1bCBvZiBtZXNzYWdlcyBhYm92ZSBvciBiZWxvdyB0aGVcbiAgICAgICAgLy8gdmlld3BvcnQsIHRyeSB0byBnZXQgc29tZSBtb3JlIG1lc3NhZ2VzLlxuICAgICAgICAvL1xuICAgICAgICAvLyBzY3JvbGxUb3AgaXMgdGhlIG51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgdG9wIG9mIHRoZSBjb250ZW50IGFuZFxuICAgICAgICAvLyAgICAgdGhlIHRvcCBvZiB0aGUgdmlld3BvcnQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNjcm9sbEhlaWdodCBpcyB0aGUgdG90YWwgaGVpZ2h0IG9mIHRoZSBjb250ZW50LlxuICAgICAgICAvL1xuICAgICAgICAvLyBjbGllbnRIZWlnaHQgaXMgdGhlIGhlaWdodCBvZiB0aGUgdmlld3BvcnQgKGV4Y2x1ZGluZyBib3JkZXJzLFxuICAgICAgICAvLyBtYXJnaW5zLCBhbmQgc2Nyb2xsYmFycykuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgLi0tLS0tLS0tLS4gICAgICAgICAgLSAgICAgICAgICAgICAgICAgLVxuICAgICAgICAvLyAgIHwgICAgICAgICB8ICAgICAgICAgIHwgIHNjcm9sbFRvcCAgICAgIHxcbiAgICAgICAgLy8gLi0rLS0tLS0tLS0tKy0uICAgIC0gICAtICAgICAgICAgICAgICAgICB8XG4gICAgICAgIC8vIHwgfCAgICAgICAgIHwgfCAgICB8ICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAvLyB8IHwgICAgICAgICB8IHwgICAgfCAgY2xpZW50SGVpZ2h0ICAgICAgIHwgc2Nyb2xsSGVpZ2h0XG4gICAgICAgIC8vIHwgfCAgICAgICAgIHwgfCAgICB8ICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAvLyBgLSstLS0tLS0tLS0rLScgICAgLSAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgICAgLy8gICB8ICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICAgIC8vICAgfCAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAvLyAgIGAtLS0tLS0tLS0nICAgICAgICAgICAgICAgICAgICAgICAgICAgIC1cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBhcyBmaWxsaW5nIGlzIGFzeW5jIGFuZCByZWN1cnNpdmUsXG4gICAgICAgIC8vIGRvbid0IGFsbG93IG1vcmUgdGhhbiAxIGNoYWluIG9mIGNhbGxzIGNvbmN1cnJlbnRseVxuICAgICAgICAvLyBkbyBtYWtlIGEgbm90ZSB3aGVuIGEgbmV3IHJlcXVlc3QgY29tZXMgaW4gd2hpbGUgYWxyZWFkeSBydW5uaW5nIG9uZSxcbiAgICAgICAgLy8gc28gd2UgY2FuIHRyaWdnZXIgYSBuZXcgY2hhaW4gb2YgY2FsbHMgb25jZSBkb25lLlxuICAgICAgICBpZiAoaXNGaXJzdENhbGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0ZpbGxpbmcpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcIl9pc0ZpbGxpbmc6IG5vdCBlbnRlcmluZyB3aGlsZSByZXF1ZXN0IGlzIG9uZ29pbmcsIG1hcmtpbmcgZm9yIGEgc3Vic2VxdWVudCByZXF1ZXN0XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGxSZXF1ZXN0V2hpbGVSdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIl9pc0ZpbGxpbmc6IHNldHRpbmdcIik7XG4gICAgICAgICAgICB0aGlzLl9pc0ZpbGxpbmcgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbWxpc3QgPSB0aGlzLl9pdGVtbGlzdC5jdXJyZW50O1xuICAgICAgICBjb25zdCBmaXJzdFRpbGUgPSBpdGVtbGlzdCAmJiBpdGVtbGlzdC5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgY29uc3QgY29udGVudFRvcCA9IGZpcnN0VGlsZSAmJiBmaXJzdFRpbGUub2Zmc2V0VG9wO1xuICAgICAgICBjb25zdCBmaWxsUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAvLyBpZiBzY3JvbGxUb3AgZ2V0cyB0byAxIHNjcmVlbiBmcm9tIHRoZSB0b3Agb2YgdGhlIGZpcnN0IHRpbGUsXG4gICAgICAgIC8vIHRyeSBiYWNrd2FyZCBmaWxsaW5nXG4gICAgICAgIGlmICghZmlyc3RUaWxlIHx8IChzbi5zY3JvbGxUb3AgLSBjb250ZW50VG9wKSA8IHNuLmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgLy8gbmVlZCB0byBiYWNrLWZpbGxcbiAgICAgICAgICAgIGZpbGxQcm9taXNlcy5wdXNoKHRoaXMuX21heWJlRmlsbChkZXB0aCwgdHJ1ZSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHNjcm9sbFRvcCBnZXRzIHRvIDIgc2NyZWVucyBmcm9tIHRoZSBlbmQgKHNvIDEgc2NyZWVuIGJlbG93IHZpZXdwb3J0KSxcbiAgICAgICAgLy8gdHJ5IGZvcndhcmQgZmlsbGluZ1xuICAgICAgICBpZiAoKHNuLnNjcm9sbEhlaWdodCAtIHNuLnNjcm9sbFRvcCkgPCBzbi5jbGllbnRIZWlnaHQgKiAyKSB7XG4gICAgICAgICAgICAvLyBuZWVkIHRvIGZvcndhcmQtZmlsbFxuICAgICAgICAgICAgZmlsbFByb21pc2VzLnB1c2godGhpcy5fbWF5YmVGaWxsKGRlcHRoLCBmYWxzZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGxQcm9taXNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZmlsbFByb21pc2VzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNGaXJzdENhbGwpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiX2lzRmlsbGluZzogY2xlYXJpbmdcIik7XG4gICAgICAgICAgICB0aGlzLl9pc0ZpbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9maWxsUmVxdWVzdFdoaWxlUnVubmluZykge1xuICAgICAgICAgICAgdGhpcy5fZmlsbFJlcXVlc3RXaGlsZVJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tGaWxsU3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBjaGVjayBpZiB1bmZpbGxpbmcgaXMgcG9zc2libGUgYW5kIHNlbmQgYW4gdW5maWxsIHJlcXVlc3QgaWYgbmVjZXNzYXJ5XG4gICAgX2NoZWNrVW5maWxsU3RhdGU6IGZ1bmN0aW9uKGJhY2t3YXJkcykge1xuICAgICAgICBsZXQgZXhjZXNzSGVpZ2h0ID0gdGhpcy5fZ2V0RXhjZXNzSGVpZ2h0KGJhY2t3YXJkcyk7XG4gICAgICAgIGlmIChleGNlc3NIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3JpZ0V4Y2Vzc0hlaWdodCA9IGV4Y2Vzc0hlaWdodDtcblxuICAgICAgICBjb25zdCB0aWxlcyA9IHRoaXMuX2l0ZW1saXN0LmN1cnJlbnQuY2hpbGRyZW47XG5cbiAgICAgICAgLy8gVGhlIHNjcm9sbCB0b2tlbiBvZiB0aGUgZmlyc3QvbGFzdCB0aWxlIHRvIGJlIHVucGFnaW5hdGVkXG4gICAgICAgIGxldCBtYXJrZXJTY3JvbGxUb2tlbiA9IG51bGw7XG5cbiAgICAgICAgLy8gU3VidHJhY3QgaGVpZ2h0cyBvZiB0aWxlcyB0byBzaW11bGF0ZSB0aGUgdGlsZXMgYmVpbmcgdW5wYWdpbmF0ZWQgdW50aWwgdGhlXG4gICAgICAgIC8vIGV4Y2VzcyBoZWlnaHQgaXMgbGVzcyB0aGFuIHRoZSBoZWlnaHQgb2YgdGhlIG5leHQgdGlsZSB0byBzdWJ0cmFjdC4gVGhpc1xuICAgICAgICAvLyBwcmV2ZW50cyBleGNlc3NIZWlnaHQgYmVjb21pbmcgbmVnYXRpdmUsIHdoaWNoIGNvdWxkIGxlYWQgdG8gZnV0dXJlXG4gICAgICAgIC8vIHBhZ2luYXRpb24uXG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIGJhY2t3YXJkcyBpcyB0cnVlLCB3ZSB1bnBhZ2luYXRlIChyZW1vdmUpIHRpbGVzIGZyb20gdGhlIGJhY2sgKHRvcCkuXG4gICAgICAgIGxldCB0aWxlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aWxlID0gdGlsZXNbYmFja3dhcmRzID8gaSA6IHRpbGVzLmxlbmd0aCAtIDEgLSBpXTtcbiAgICAgICAgICAgIC8vIFN1YnRyYWN0IGhlaWdodCBvZiB0aWxlIGFzIGlmIGl0IHdlcmUgdW5wYWdpbmF0ZWRcbiAgICAgICAgICAgIGV4Y2Vzc0hlaWdodCAtPSB0aWxlLmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIC8vSWYgcmVtb3ZpbmcgdGhlIHRpbGUgd291bGQgbGVhZCB0byBmdXR1cmUgcGFnaW5hdGlvbiwgYnJlYWsgYmVmb3JlIHNldHRpbmcgc2Nyb2xsIHRva2VuXG4gICAgICAgICAgICBpZiAodGlsZS5jbGllbnRIZWlnaHQgPiBleGNlc3NIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRoZSB0aWxlIG1heSBub3QgaGF2ZSBhIHNjcm9sbCB0b2tlbiwgc28gZ3VhcmQgaXRcbiAgICAgICAgICAgIGlmICh0aWxlLmRhdGFzZXQuc2Nyb2xsVG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyU2Nyb2xsVG9rZW4gPSB0aWxlLmRhdGFzZXQuc2Nyb2xsVG9rZW5zLnNwbGl0KCcsJylbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWFya2VyU2Nyb2xsVG9rZW4pIHtcbiAgICAgICAgICAgIC8vIFVzZSBhIGRlYm91bmNlciB0byBwcmV2ZW50IG11bHRpcGxlIHVuZmlsbCBjYWxscyBpbiBxdWljayBzdWNjZXNzaW9uXG4gICAgICAgICAgICAvLyBUaGlzIGlzIHRvIG1ha2UgdGhlIHVuZmlsbGluZyBwcm9jZXNzIGxlc3MgYWdncmVzc2l2ZVxuICAgICAgICAgICAgaWYgKHRoaXMuX3VuZmlsbERlYm91bmNlcikge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl91bmZpbGxEZWJvdW5jZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdW5maWxsRGVib3VuY2VyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5maWxsRGVib3VuY2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcInVuZmlsbGluZyBub3dcIiwgYmFja3dhcmRzLCBvcmlnRXhjZXNzSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uVW5maWxsUmVxdWVzdChiYWNrd2FyZHMsIG1hcmtlclNjcm9sbFRva2VuKTtcbiAgICAgICAgICAgIH0sIFVORklMTF9SRVFVRVNUX0RFQk9VTkNFX01TKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBjaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgcGVuZGluZyBmaWxsIHJlcXVlc3QuIElmIG5vdCwgc2V0IG9uZSBvZmYuXG4gICAgX21heWJlRmlsbDogZnVuY3Rpb24oZGVwdGgsIGJhY2t3YXJkcykge1xuICAgICAgICBjb25zdCBkaXIgPSBiYWNrd2FyZHMgPyAnYicgOiAnZic7XG4gICAgICAgIGlmICh0aGlzLl9wZW5kaW5nRmlsbFJlcXVlc3RzW2Rpcl0pIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiQWxyZWFkeSBhIFwiK2RpcitcIiBmaWxsIGluIHByb2dyZXNzIC0gbm90IHN0YXJ0aW5nIGFub3RoZXJcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Z2xvZyhcInN0YXJ0aW5nIFwiK2RpcitcIiBmaWxsXCIpO1xuXG4gICAgICAgIC8vIG9uRmlsbFJlcXVlc3QgY2FuIGVuZCB1cCBjYWxsaW5nIHVzIHJlY3Vyc2l2ZWx5ICh2aWEgb25TY3JvbGxcbiAgICAgICAgLy8gZXZlbnRzKSBzbyBtYWtlIHN1cmUgd2Ugc2V0IHRoaXMgYmVmb3JlIGZpcmluZyBvZmYgdGhlIGNhbGwuXG4gICAgICAgIHRoaXMuX3BlbmRpbmdGaWxsUmVxdWVzdHNbZGlyXSA9IHRydWU7XG5cbiAgICAgICAgLy8gd2FpdCAxbXMgYmVmb3JlIHBhZ2luYXRpbmcsIGJlY2F1c2Ugb3RoZXJ3aXNlXG4gICAgICAgIC8vIHRoaXMgd2lsbCBibG9jayB0aGUgc2Nyb2xsIGV2ZW50IGhhbmRsZXIgZm9yICs3MDBtc1xuICAgICAgICAvLyBpZiBtZXNzYWdlcyBhcmUgYWxyZWFkeSBjYWNoZWQgaW4gbWVtb3J5LFxuICAgICAgICAvLyBUaGlzIHdvdWxkIGNhdXNlIGp1bXBpbmcgdG8gaGFwcGVuIG9uIENocm9tZS9tYWNPUy5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5vbkZpbGxSZXF1ZXN0KGJhY2t3YXJkcyk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ0ZpbGxSZXF1ZXN0c1tkaXJdID0gZmFsc2U7XG4gICAgICAgIH0pLnRoZW4oKGhhc01vcmVSZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBVbnBhZ2luYXRlIG9uY2UgZmlsbGluZyBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgdGhpcy5fY2hlY2tVbmZpbGxTdGF0ZSghYmFja3dhcmRzKTtcblxuICAgICAgICAgICAgZGVidWdsb2coXCJcIitkaXIrXCIgZmlsbCBjb21wbGV0ZTsgaGFzTW9yZVJlc3VsdHM6XCIraGFzTW9yZVJlc3VsdHMpO1xuICAgICAgICAgICAgaWYgKGhhc01vcmVSZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgLy8gZnVydGhlciBwYWdpbmF0aW9uIHJlcXVlc3RzIGhhdmUgYmVlbiBkaXNhYmxlZCB1bnRpbCBub3csIHNvXG4gICAgICAgICAgICAgICAgLy8gaXQncyB0aW1lIHRvIGNoZWNrIHRoZSBmaWxsIHN0YXRlIGFnYWluIGluIGNhc2UgdGhlIHBhZ2luYXRpb25cbiAgICAgICAgICAgICAgICAvLyB3YXMgaW5zdWZmaWNpZW50LlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZWNrRmlsbFN0YXRlKGRlcHRoICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKiBnZXQgdGhlIGN1cnJlbnQgc2Nyb2xsIHN0YXRlLiBUaGlzIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZ1xuICAgICAqIHByb3BlcnRpZXM6XG4gICAgICpcbiAgICAgKiBib29sZWFuIHN0dWNrQXRCb3R0b206IHRydWUgaWYgd2UgYXJlIHRyYWNraW5nIHRoZSBib3R0b20gb2YgdGhlXG4gICAgICogICBzY3JvbGwuIGZhbHNlIGlmIHdlIGFyZSB0cmFja2luZyBhIHBhcnRpY3VsYXIgY2hpbGQuXG4gICAgICpcbiAgICAgKiBzdHJpbmcgdHJhY2tlZFNjcm9sbFRva2VuOiB1bmRlZmluZWQgaWYgc3R1Y2tBdEJvdHRvbSBpcyB0cnVlOyBpZiBpdCBpc1xuICAgICAqICAgZmFsc2UsIHRoZSBmaXJzdCB0b2tlbiBpbiBkYXRhLXNjcm9sbC10b2tlbnMgb2YgdGhlIGNoaWxkIHdoaWNoIHdlIGFyZVxuICAgICAqICAgdHJhY2tpbmcuXG4gICAgICpcbiAgICAgKiBudW1iZXIgYm90dG9tT2Zmc2V0OiB1bmRlZmluZWQgaWYgc3R1Y2tBdEJvdHRvbSBpcyB0cnVlOyBpZiBpdCBpcyBmYWxzZSxcbiAgICAgKiAgIHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoZSBib3R0b20gb2YgdGhlIHRyYWNrZWQgY2hpbGQgaXMgYWJvdmUgdGhlXG4gICAgICogICBib3R0b20gb2YgdGhlIHNjcm9sbCBwYW5lbC5cbiAgICAgKi9cbiAgICBnZXRTY3JvbGxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjcm9sbFN0YXRlO1xuICAgIH0sXG5cbiAgICAvKiByZXNldCB0aGUgc2F2ZWQgc2Nyb2xsIHN0YXRlLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB1c2VmdWwgaWYgdGhlIGxpc3QgaXMgYmVpbmcgcmVwbGFjZWQsIGFuZCB5b3UgZG9uJ3Qgd2FudCB0b1xuICAgICAqIHByZXNlcnZlIHNjcm9sbCBldmVuIGlmIG5ldyBjaGlsZHJlbiBoYXBwZW4gdG8gaGF2ZSB0aGUgc2FtZSBzY3JvbGxcbiAgICAgKiB0b2tlbnMgYXMgb2xkIG9uZXMuXG4gICAgICpcbiAgICAgKiBUaGlzIHdpbGwgY2F1c2UgdGhlIHZpZXdwb3J0IHRvIGJlIHNjcm9sbGVkIGRvd24gdG8gdGhlIGJvdHRvbSBvbiB0aGVcbiAgICAgKiBuZXh0IHVwZGF0ZSBvZiB0aGUgY2hpbGQgbGlzdC4gVGhpcyBpcyBkaWZmZXJlbnQgdG8gc2Nyb2xsVG9Cb3R0b20oKSxcbiAgICAgKiB3aGljaCB3b3VsZCBzYXZlIHRoZSBjdXJyZW50IGJvdHRvbS1tb3N0IGNoaWxkIGFzIHRoZSBhY3RpdmUgb25lIChzbyBpc1xuICAgICAqIG5vIHVzZSBpZiBubyBjaGlsZHJlbiBleGlzdCB5ZXQsIG9yIGlmIHlvdSBhcmUgYWJvdXQgdG8gcmVwbGFjZSB0aGVcbiAgICAgKiBjaGlsZCBsaXN0LilcbiAgICAgKi9cbiAgICByZXNldFNjcm9sbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxTdGF0ZSA9IHtcbiAgICAgICAgICAgIHN0dWNrQXRCb3R0b206IHRoaXMucHJvcHMuc3RhcnRBdEJvdHRvbSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fYm90dG9tR3Jvd3RoID0gMDtcbiAgICAgICAgdGhpcy5fcGFnZXMgPSAwO1xuICAgICAgICB0aGlzLl9zY3JvbGxUaW1lb3V0ID0gbmV3IFRpbWVyKDEwMCk7XG4gICAgICAgIHRoaXMuX2hlaWdodFVwZGF0ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICoganVtcCB0byB0aGUgdG9wIG9mIHRoZSBjb250ZW50LlxuICAgICAqL1xuICAgIHNjcm9sbFRvVG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgIHRoaXMuX3NhdmVTY3JvbGxTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBqdW1wIHRvIHRoZSBib3R0b20gb2YgdGhlIGNvbnRlbnQuXG4gICAgICovXG4gICAgc2Nyb2xsVG9Cb3R0b206IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB0aGUgZWFzaWVzdCB3YXkgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHNjcm9sbCBzdGF0ZSBpcyBjb3JyZWN0bHlcbiAgICAgICAgLy8gc2F2ZWQgaXMgdG8gZG8gdGhlIHNjcm9sbCwgdGhlbiBzYXZlIHRoZSB1cGRhdGVkIHN0YXRlLiAoQ2FsY3VsYXRpbmdcbiAgICAgICAgLy8gaXQgb3Vyc2VsdmVzIGlzIGhhcmQsIGFuZCB3ZSBjYW4ndCByZWx5IG9uIGFuIG9uU2Nyb2xsIGNhbGxiYWNrXG4gICAgICAgIC8vIGhhcHBlbmluZywgc2luY2UgdGhlcmUgbWF5IGJlIG5vIHVzZXItdmlzaWJsZSBjaGFuZ2UgaGVyZSkuXG4gICAgICAgIGNvbnN0IHNuID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICBzbi5zY3JvbGxUb3AgPSBzbi5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIHRoaXMuX3NhdmVTY3JvbGxTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQYWdlIHVwL2Rvd24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbXVsdDogLTEgdG8gcGFnZSB1cCwgKzEgdG8gcGFnZSBkb3duXG4gICAgICovXG4gICAgc2Nyb2xsUmVsYXRpdmU6IGZ1bmN0aW9uKG11bHQpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsTm9kZSA9IHRoaXMuX2dldFNjcm9sbE5vZGUoKTtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBtdWx0ICogc2Nyb2xsTm9kZS5jbGllbnRIZWlnaHQgKiAwLjU7XG4gICAgICAgIHNjcm9sbE5vZGUuc2Nyb2xsQnkoMCwgZGVsdGEpO1xuICAgICAgICB0aGlzLl9zYXZlU2Nyb2xsU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2Nyb2xsIHVwL2Rvd24gaW4gcmVzcG9uc2UgdG8gYSBzY3JvbGwga2V5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAqL1xuICAgIGhhbmRsZVNjcm9sbEtleTogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgc3dpdGNoIChldi5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgS2V5LlBBR0VfVVA6XG4gICAgICAgICAgICAgICAgaWYgKCFldi5jdHJsS2V5ICYmICFldi5zaGlmdEtleSAmJiAhZXYuYWx0S2V5ICYmICFldi5tZXRhS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsUmVsYXRpdmUoLTEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBLZXkuUEFHRV9ET1dOOlxuICAgICAgICAgICAgICAgIGlmICghZXYuY3RybEtleSAmJiAhZXYuc2hpZnRLZXkgJiYgIWV2LmFsdEtleSAmJiAhZXYubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFJlbGF0aXZlKDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBLZXkuSE9NRTpcbiAgICAgICAgICAgICAgICBpZiAoZXYuY3RybEtleSAmJiAhZXYuc2hpZnRLZXkgJiYgIWV2LmFsdEtleSAmJiAhZXYubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvVG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEtleS5FTkQ6XG4gICAgICAgICAgICAgICAgaWYgKGV2LmN0cmxLZXkgJiYgIWV2LnNoaWZ0S2V5ICYmICFldi5hbHRLZXkgJiYgIWV2Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKiBTY3JvbGwgdGhlIHBhbmVsIHRvIGJyaW5nIHRoZSBET00gbm9kZSB3aXRoIHRoZSBzY3JvbGwgdG9rZW5cbiAgICAgKiBgc2Nyb2xsVG9rZW5gIGludG8gdmlldy5cbiAgICAgKlxuICAgICAqIG9mZnNldEJhc2UgZ2l2ZXMgdGhlIHJlZmVyZW5jZSBwb2ludCBmb3IgdGhlIHBpeGVsT2Zmc2V0LiAwIG1lYW5zIHRoZVxuICAgICAqIHRvcCBvZiB0aGUgY29udGFpbmVyLCAxIG1lYW5zIHRoZSBib3R0b20sIGFuZCBmcmFjdGlvbmFsIHZhbHVlcyBtZWFuXG4gICAgICogc29tZXdoZXJlIGluIHRoZSBtaWRkbGUuIElmIG9taXR0ZWQsIGl0IGRlZmF1bHRzIHRvIDAuXG4gICAgICpcbiAgICAgKiBwaXhlbE9mZnNldCBnaXZlcyB0aGUgbnVtYmVyIG9mIHBpeGVscyAqYWJvdmUqIHRoZSBvZmZzZXRCYXNlIHRoYXQgdGhlXG4gICAgICogbm9kZSAoc3BlY2lmaWNhbGx5LCB0aGUgYm90dG9tIG9mIGl0KSB3aWxsIGJlIHBvc2l0aW9uZWQuIElmIG9taXR0ZWQsIGl0XG4gICAgICogZGVmYXVsdHMgdG8gMC5cbiAgICAgKi9cbiAgICBzY3JvbGxUb1Rva2VuOiBmdW5jdGlvbihzY3JvbGxUb2tlbiwgcGl4ZWxPZmZzZXQsIG9mZnNldEJhc2UpIHtcbiAgICAgICAgcGl4ZWxPZmZzZXQgPSBwaXhlbE9mZnNldCB8fCAwO1xuICAgICAgICBvZmZzZXRCYXNlID0gb2Zmc2V0QmFzZSB8fCAwO1xuXG4gICAgICAgIC8vIHNldCB0aGUgdHJhY2tlZFNjcm9sbFRva2VuIHNvIHdlIGNhbiBnZXQgdGhlIG5vZGUgdGhyb3VnaCBfZ2V0VHJhY2tlZE5vZGVcbiAgICAgICAgdGhpcy5zY3JvbGxTdGF0ZSA9IHtcbiAgICAgICAgICAgIHN0dWNrQXRCb3R0b206IGZhbHNlLFxuICAgICAgICAgICAgdHJhY2tlZFNjcm9sbFRva2VuOiBzY3JvbGxUb2tlbixcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhY2tlZE5vZGUgPSB0aGlzLl9nZXRUcmFja2VkTm9kZSgpO1xuICAgICAgICBjb25zdCBzY3JvbGxOb2RlID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICBpZiAodHJhY2tlZE5vZGUpIHtcbiAgICAgICAgICAgIC8vIHNldCB0aGUgc2Nyb2xsVG9wIHRvIHRoZSBwb3NpdGlvbiB3ZSB3YW50LlxuICAgICAgICAgICAgLy8gbm90ZSB0aG91Z2gsIHRoYXQgdGhpcyBtaWdodCBub3Qgc3VjY2VlZCBpZiB0aGUgY29tYmluYXRpb24gb2Ygb2Zmc2V0QmFzZSBhbmQgcGl4ZWxPZmZzZXRcbiAgICAgICAgICAgIC8vIHdvdWxkIHBvc2l0aW9uIHRoZSB0cmFja2VkTm9kZSB0b3dhcmRzIHRoZSB0b3Agb2YgdGhlIHZpZXdwb3J0LlxuICAgICAgICAgICAgLy8gVGhpcyBiZWNhdXNlIHdoZW4gc2V0dGluZyB0aGUgc2Nyb2xsVG9wIG9ubHkgMTAgb3Igc28gZXZlbnRzIG1pZ2h0IGJlIGxvYWRlZCxcbiAgICAgICAgICAgIC8vIG5vdCBnaXZpbmcgZW5vdWdoIGNvbnRlbnQgYmVsb3cgdGhlIHRyYWNrZWROb2RlIHRvIHNjcm9sbCBkb3dud2FyZHNcbiAgICAgICAgICAgIC8vIGVub3VnaCBzbyBpdCBlbmRzIHVwIGluIHRoZSB0b3Agb2YgdGhlIHZpZXdwb3J0LlxuICAgICAgICAgICAgZGVidWdsb2coXCJzY3JvbGxUb2tlbjogc2V0dGluZyBzY3JvbGxUb3BcIiwge29mZnNldEJhc2UsIHBpeGVsT2Zmc2V0LCBvZmZzZXRUb3A6IHRyYWNrZWROb2RlLm9mZnNldFRvcH0pO1xuICAgICAgICAgICAgc2Nyb2xsTm9kZS5zY3JvbGxUb3AgPSAodHJhY2tlZE5vZGUub2Zmc2V0VG9wIC0gKHNjcm9sbE5vZGUuY2xpZW50SGVpZ2h0ICogb2Zmc2V0QmFzZSkpICsgcGl4ZWxPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLl9zYXZlU2Nyb2xsU3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2F2ZVNjcm9sbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc3RpY2t5Qm90dG9tICYmIHRoaXMuaXNBdEJvdHRvbSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFN0YXRlID0geyBzdHVja0F0Qm90dG9tOiB0cnVlIH07XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcInNhdmVkIHN0dWNrQXRCb3R0b20gc3RhdGVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JvbGxOb2RlID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICBjb25zdCB2aWV3cG9ydEJvdHRvbSA9IHNjcm9sbE5vZGUuc2Nyb2xsSGVpZ2h0IC0gKHNjcm9sbE5vZGUuc2Nyb2xsVG9wICsgc2Nyb2xsTm9kZS5jbGllbnRIZWlnaHQpO1xuXG4gICAgICAgIGNvbnN0IGl0ZW1saXN0ID0gdGhpcy5faXRlbWxpc3QuY3VycmVudDtcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBpdGVtbGlzdC5jaGlsZHJlbjtcbiAgICAgICAgbGV0IG5vZGUgPSBudWxsO1xuXG4gICAgICAgIC8vIFRPRE86IGRvIGEgYmluYXJ5IHNlYXJjaCBoZXJlLCBhcyBpdGVtcyBhcmUgc29ydGVkIGJ5IG9mZnNldFRvcFxuICAgICAgICAvLyBsb29wIGJhY2t3YXJkcywgZnJvbSBib3R0b20tbW9zdCBtZXNzYWdlIChhcyB0aGF0IGlzIHRoZSBtb3N0IGNvbW1vbiBjYXNlKVxuICAgICAgICBmb3IgKGxldCBpID0gbWVzc2FnZXMubGVuZ3RoLTE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAoIW1lc3NhZ2VzW2ldLmRhdGFzZXQuc2Nyb2xsVG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbWVzc2FnZXNbaV07XG4gICAgICAgICAgICAvLyBicmVhayBhdCB0aGUgZmlyc3QgbWVzc2FnZSAoY29taW5nIGZyb20gdGhlIGJvdHRvbSlcbiAgICAgICAgICAgIC8vIHRoYXQgaGFzIGl0J3Mgb2Zmc2V0VG9wIGFib3ZlIHRoZSBib3R0b20gb2YgdGhlIHZpZXdwb3J0LlxuICAgICAgICAgICAgaWYgKHRoaXMuX3RvcEZyb21Cb3R0b20obm9kZSkgPiB2aWV3cG9ydEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSB0aGlzIG5vZGUgYXMgdGhlIHNjcm9sbFRva2VuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwidW5hYmxlIHRvIHNhdmUgc2Nyb2xsIHN0YXRlOiBmb3VuZCBubyBjaGlsZHJlbiBpbiB0aGUgdmlld3BvcnRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2Nyb2xsVG9rZW4gPSBub2RlLmRhdGFzZXQuc2Nyb2xsVG9rZW5zLnNwbGl0KCcsJylbMF07XG4gICAgICAgIGRlYnVnbG9nKFwic2F2aW5nIGFuY2hvcmVkIHNjcm9sbCBzdGF0ZSB0byBtZXNzYWdlXCIsIG5vZGUgJiYgbm9kZS5pbm5lclRleHQsIHNjcm9sbFRva2VuKTtcbiAgICAgICAgY29uc3QgYm90dG9tT2Zmc2V0ID0gdGhpcy5fdG9wRnJvbUJvdHRvbShub2RlKTtcbiAgICAgICAgdGhpcy5zY3JvbGxTdGF0ZSA9IHtcbiAgICAgICAgICAgIHN0dWNrQXRCb3R0b206IGZhbHNlLFxuICAgICAgICAgICAgdHJhY2tlZE5vZGU6IG5vZGUsXG4gICAgICAgICAgICB0cmFja2VkU2Nyb2xsVG9rZW46IHNjcm9sbFRva2VuLFxuICAgICAgICAgICAgYm90dG9tT2Zmc2V0OiBib3R0b21PZmZzZXQsXG4gICAgICAgICAgICBwaXhlbE9mZnNldDogYm90dG9tT2Zmc2V0IC0gdmlld3BvcnRCb3R0b20sIC8vbmVlZGVkIGZvciByZXN0b3JpbmcgdGhlIHNjcm9sbCBwb3NpdGlvbiB3aGVuIGNvbWluZyBiYWNrIHRvIHRoZSByb29tXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIF9yZXN0b3JlU2F2ZWRTY3JvbGxTdGF0ZTogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbFN0YXRlID0gdGhpcy5zY3JvbGxTdGF0ZTtcblxuICAgICAgICBpZiAoc2Nyb2xsU3RhdGUuc3R1Y2tBdEJvdHRvbSkge1xuICAgICAgICAgICAgY29uc3Qgc24gPSB0aGlzLl9nZXRTY3JvbGxOb2RlKCk7XG4gICAgICAgICAgICBzbi5zY3JvbGxUb3AgPSBzbi5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsU3RhdGUudHJhY2tlZFNjcm9sbFRva2VuKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtbGlzdCA9IHRoaXMuX2l0ZW1saXN0LmN1cnJlbnQ7XG4gICAgICAgICAgICBjb25zdCB0cmFja2VkTm9kZSA9IHRoaXMuX2dldFRyYWNrZWROb2RlKCk7XG4gICAgICAgICAgICBpZiAodHJhY2tlZE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdCb3R0b21PZmZzZXQgPSB0aGlzLl90b3BGcm9tQm90dG9tKHRyYWNrZWROb2RlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBib3R0b21EaWZmID0gbmV3Qm90dG9tT2Zmc2V0IC0gc2Nyb2xsU3RhdGUuYm90dG9tT2Zmc2V0O1xuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbUdyb3d0aCArPSBib3R0b21EaWZmO1xuICAgICAgICAgICAgICAgIHNjcm9sbFN0YXRlLmJvdHRvbU9mZnNldCA9IG5ld0JvdHRvbU9mZnNldDtcbiAgICAgICAgICAgICAgICBpdGVtbGlzdC5zdHlsZS5oZWlnaHQgPSBgJHt0aGlzLl9nZXRMaXN0SGVpZ2h0KCl9cHhgO1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwiYmFsYW5jaW5nIGhlaWdodCBiZWNhdXNlIG1lc3NhZ2VzIGJlbG93IHZpZXdwb3J0IGdyZXcgYnlcIiwgYm90dG9tRGlmZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9oZWlnaHRVcGRhdGVJblByb2dyZXNzKSB7XG4gICAgICAgICAgICB0aGlzLl9oZWlnaHRVcGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fdXBkYXRlSGVpZ2h0KCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hlaWdodFVwZGF0ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwibm90IHVwZGF0aW5nIGhlaWdodCBiZWNhdXNlIHJlcXVlc3QgYWxyZWFkeSBpbiBwcm9ncmVzc1wiKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gbmVlZCBhIGJldHRlciBuYW1lIHRoYXQgYWxzbyBpbmRpY2F0ZXMgdGhpcyB3aWxsIGNoYW5nZSBzY3JvbGxUb3A/IFJlYmFsYW5jZSBoZWlnaHQ/IFJldmVhbCBjb250ZW50P1xuICAgIGFzeW5jIF91cGRhdGVIZWlnaHQoKSB7XG4gICAgICAgIC8vIHdhaXQgdW50aWwgdXNlciBoYXMgc3RvcHBlZCBzY3JvbGxpbmdcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbFRpbWVvdXQuaXNSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwidXBkYXRlSGVpZ2h0IHdhaXRpbmcgZm9yIHNjcm9sbGluZyB0byBlbmQgLi4uIFwiKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Njcm9sbFRpbWVvdXQuZmluaXNoZWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwidXBkYXRlSGVpZ2h0IGdldHRpbmcgc3RyYWlnaHQgdG8gYnVzaW5lc3MsIG5vIHNjcm9sbGluZyBnb2luZyBvbi5cIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBtaWdodCBoYXZlIHVubW91bnRlZCBzaW5jZSB0aGUgdGltZXIgZmluaXNoZWQsIHNvIGFib3J0IGlmIHNvLlxuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNuID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICBjb25zdCBpdGVtbGlzdCA9IHRoaXMuX2l0ZW1saXN0LmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIZWlnaHQgPSB0aGlzLl9nZXRNZXNzYWdlc0hlaWdodCgpO1xuICAgICAgICBjb25zdCBtaW5IZWlnaHQgPSBzbi5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KG1pbkhlaWdodCwgY29udGVudEhlaWdodCk7XG4gICAgICAgIHRoaXMuX3BhZ2VzID0gTWF0aC5jZWlsKGhlaWdodCAvIFBBR0VfU0laRSk7XG4gICAgICAgIHRoaXMuX2JvdHRvbUdyb3d0aCA9IDA7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IHRoaXMuX2dldExpc3RIZWlnaHQoKTtcblxuICAgICAgICBjb25zdCBzY3JvbGxTdGF0ZSA9IHRoaXMuc2Nyb2xsU3RhdGU7XG4gICAgICAgIGlmIChzY3JvbGxTdGF0ZS5zdHVja0F0Qm90dG9tKSB7XG4gICAgICAgICAgICBpdGVtbGlzdC5zdHlsZS5oZWlnaHQgPSBgJHtuZXdIZWlnaHR9cHhgO1xuICAgICAgICAgICAgc24uc2Nyb2xsVG9wID0gc24uc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgZGVidWdsb2coXCJ1cGRhdGVIZWlnaHQgdG9cIiwgbmV3SGVpZ2h0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzY3JvbGxTdGF0ZS50cmFja2VkU2Nyb2xsVG9rZW4pIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrZWROb2RlID0gdGhpcy5fZ2V0VHJhY2tlZE5vZGUoKTtcbiAgICAgICAgICAgIC8vIGlmIHRoZSB0aW1lbGluZSBoYXMgYmVlbiByZWxvYWRlZFxuICAgICAgICAgICAgLy8gdGhpcyBjYW4gYmUgY2FsbGVkIGJlZm9yZSBzY3JvbGxUb0JvdHRvbSBvciB3aGF0ZXZlciBoYXMgYmVlbiBjYWxsZWRcbiAgICAgICAgICAgIC8vIHNvIGRvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBub2RlIGhhcyBkaXNhcHBlYXJlZCBmcm9tXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudGx5IGZpbGxlZCBwaWVjZSBvZiB0aGUgdGltZWxpbmVcbiAgICAgICAgICAgIGlmICh0cmFja2VkTm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFRvcCA9IHRyYWNrZWROb2RlLm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICBpdGVtbGlzdC5zdHlsZS5oZWlnaHQgPSBgJHtuZXdIZWlnaHR9cHhgO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RvcCA9IHRyYWNrZWROb2RlLm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3BEaWZmID0gbmV3VG9wIC0gb2xkVG9wO1xuICAgICAgICAgICAgICAgIC8vIGltcG9ydGFudCB0byBzY3JvbGwgYnkgYSByZWxhdGl2ZSBhbW91bnQgYXNcbiAgICAgICAgICAgICAgICAvLyByZWFkaW5nIHNjcm9sbFRvcCBhbmQgdGhlbiBzZXR0aW5nIGl0IG1pZ2h0XG4gICAgICAgICAgICAgICAgLy8geWllbGQgb3V0IG9mIGRhdGUgdmFsdWVzIGFuZCBjYXVzZSBhIGp1bXBcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHNldHRpbmcgaXRcbiAgICAgICAgICAgICAgICBzbi5zY3JvbGxCeSgwLCB0b3BEaWZmKTtcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcInVwZGF0ZUhlaWdodCB0b1wiLCB7bmV3SGVpZ2h0LCB0b3BEaWZmfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldFRyYWNrZWROb2RlKCkge1xuICAgICAgICBjb25zdCBzY3JvbGxTdGF0ZSA9IHRoaXMuc2Nyb2xsU3RhdGU7XG4gICAgICAgIGNvbnN0IHRyYWNrZWROb2RlID0gc2Nyb2xsU3RhdGUudHJhY2tlZE5vZGU7XG5cbiAgICAgICAgaWYgKCF0cmFja2VkTm9kZSB8fCAhdHJhY2tlZE5vZGUucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgbGV0IG5vZGU7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMuX2l0ZW1saXN0LmN1cnJlbnQuY2hpbGRyZW47XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxUb2tlbiA9IHNjcm9sbFN0YXRlLnRyYWNrZWRTY3JvbGxUb2tlbjtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IG1lc3NhZ2VzLmxlbmd0aC0xOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG0gPSBtZXNzYWdlc1tpXTtcbiAgICAgICAgICAgICAgICAvLyAnZGF0YS1zY3JvbGwtdG9rZW5zJyBpcyBhIERPTVN0cmluZyBvZiBjb21tYS1zZXBhcmF0ZWQgc2Nyb2xsIHRva2Vuc1xuICAgICAgICAgICAgICAgIC8vIFRoZXJlIG1pZ2h0IG9ubHkgYmUgb25lIHNjcm9sbCB0b2tlblxuICAgICAgICAgICAgICAgIGlmIChtLmRhdGFzZXQuc2Nyb2xsVG9rZW5zICYmXG4gICAgICAgICAgICAgICAgICAgIG0uZGF0YXNldC5zY3JvbGxUb2tlbnMuc3BsaXQoJywnKS5pbmRleE9mKHNjcm9sbFRva2VuKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgZGVidWdsb2coXCJoYWQgdG8gZmluZCB0cmFja2VkIG5vZGUgYWdhaW4gZm9yIFwiICsgc2Nyb2xsU3RhdGUudHJhY2tlZFNjcm9sbFRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjcm9sbFN0YXRlLnRyYWNrZWROb2RlID0gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2Nyb2xsU3RhdGUudHJhY2tlZE5vZGUpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiTm8gbm9kZSB3aXRoIDsgJ1wiK3Njcm9sbFN0YXRlLnRyYWNrZWRTY3JvbGxUb2tlbitcIidcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2Nyb2xsU3RhdGUudHJhY2tlZE5vZGU7XG4gICAgfSxcblxuICAgIF9nZXRMaXN0SGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm90dG9tR3Jvd3RoICsgKHRoaXMuX3BhZ2VzICogUEFHRV9TSVpFKTtcbiAgICB9LFxuXG4gICAgX2dldE1lc3NhZ2VzSGVpZ2h0KCkge1xuICAgICAgICBjb25zdCBpdGVtbGlzdCA9IHRoaXMuX2l0ZW1saXN0LmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGxhc3ROb2RlID0gaXRlbWxpc3QubGFzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgY29uc3QgbGFzdE5vZGVCb3R0b20gPSBsYXN0Tm9kZSA/IGxhc3ROb2RlLm9mZnNldFRvcCArIGxhc3ROb2RlLmNsaWVudEhlaWdodCA6IDA7XG4gICAgICAgIGNvbnN0IGZpcnN0Tm9kZVRvcCA9IGl0ZW1saXN0LmZpcnN0RWxlbWVudENoaWxkID8gaXRlbWxpc3QuZmlyc3RFbGVtZW50Q2hpbGQub2Zmc2V0VG9wIDogMDtcbiAgICAgICAgLy8gMTggaXMgaXRlbWxpc3QgcGFkZGluZ1xuICAgICAgICByZXR1cm4gbGFzdE5vZGVCb3R0b20gLSBmaXJzdE5vZGVUb3AgKyAoMTggKiAyKTtcbiAgICB9LFxuXG4gICAgX3RvcEZyb21Cb3R0b20obm9kZSkge1xuICAgICAgICAvLyBjdXJyZW50IGNhcHBlZCBoZWlnaHQgLSBkaXN0YW5jZSBmcm9tIHRvcCA9IGRpc3RhbmNlIGZyb20gYm90dG9tIG9mIGNvbnRhaW5lciB0byB0b3Agb2YgdHJhY2tlZCBlbGVtZW50XG4gICAgICAgIHJldHVybiB0aGlzLl9pdGVtbGlzdC5jdXJyZW50LmNsaWVudEhlaWdodCAtIG5vZGUub2Zmc2V0VG9wO1xuICAgIH0sXG5cbiAgICAvKiBnZXQgdGhlIERPTSBub2RlIHdoaWNoIGhhcyB0aGUgc2Nyb2xsVG9wIHByb3BlcnR5IHdlIGNhcmUgYWJvdXQgZm9yIG91clxuICAgICAqIG1lc3NhZ2UgcGFuZWwuXG4gICAgICovXG4gICAgX2dldFNjcm9sbE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgc2hvdWxkbid0IGhhcHBlbiwgYnV0IHdoZW4gaXQgZG9lcywgdHVybiB0aGUgTlBFIGludG9cbiAgICAgICAgICAgIC8vIHNvbWV0aGluZyBtb3JlIG1lYW5pbmdmdWwuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTY3JvbGxQYW5lbC5fZ2V0U2Nyb2xsTm9kZSBjYWxsZWQgd2hlbiB1bm1vdW50ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX2RpdlNjcm9sbCkge1xuICAgICAgICAgICAgLy8gTGlrZXdpc2UsIHdlIHNob3VsZCBoYXZlIHRoZSByZWYgYnkgdGhpcyBwb2ludCwgYnV0IGlmIG5vdFxuICAgICAgICAgICAgLy8gdHVybiB0aGUgTlBFIGludG8gc29tZXRoaW5nIG1lYW5pbmdmdWwuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTY3JvbGxQYW5lbC5fZ2V0U2Nyb2xsTm9kZSBjYWxsZWQgYmVmb3JlIEF1dG9IaWRlU2Nyb2xsYmFyIHJlZiBjb2xsZWN0ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fZGl2U2Nyb2xsO1xuICAgIH0sXG5cbiAgICBfY29sbGVjdFNjcm9sbDogZnVuY3Rpb24oZGl2U2Nyb2xsKSB7XG4gICAgICAgIHRoaXMuX2RpdlNjcm9sbCA9IGRpdlNjcm9sbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgTWFyayB0aGUgYm90dG9tIG9mZnNldCBvZiB0aGUgbGFzdCB0aWxlIHNvIHdlIGNhbiBiYWxhbmNlIGl0IG91dCB3aGVuXG4gICAgYW55dGhpbmcgYmVsb3cgaXQgY2hhbmdlcywgYnkgY2FsbGluZyB1cGRhdGVQcmV2ZW50U2hyaW5raW5nLCB0byBrZWVwXG4gICAgdGhlIHNhbWUgbWluaW11bSBib3R0b20gb2Zmc2V0LCBlZmZlY3RpdmVseSBwcmV2ZW50aW5nIHRoZSB0aW1lbGluZSB0byBzaHJpbmsuXG4gICAgKi9cbiAgICBwcmV2ZW50U2hyaW5raW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZUxpc3QgPSB0aGlzLl9pdGVtbGlzdC5jdXJyZW50O1xuICAgICAgICBjb25zdCB0aWxlcyA9IG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0LmNoaWxkcmVuO1xuICAgICAgICBpZiAoIW1lc3NhZ2VMaXN0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxhc3RUaWxlTm9kZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRpbGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGlsZXNbaV07XG4gICAgICAgICAgICBpZiAobm9kZS5kYXRhc2V0LnNjcm9sbFRva2Vucykge1xuICAgICAgICAgICAgICAgIGxhc3RUaWxlTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsYXN0VGlsZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyUHJldmVudFNocmlua2luZygpO1xuICAgICAgICBjb25zdCBvZmZzZXRGcm9tQm90dG9tID0gbWVzc2FnZUxpc3QuY2xpZW50SGVpZ2h0IC0gKGxhc3RUaWxlTm9kZS5vZmZzZXRUb3AgKyBsYXN0VGlsZU5vZGUuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wcmV2ZW50U2hyaW5raW5nU3RhdGUgPSB7XG4gICAgICAgICAgICBvZmZzZXRGcm9tQm90dG9tOiBvZmZzZXRGcm9tQm90dG9tLFxuICAgICAgICAgICAgb2Zmc2V0Tm9kZTogbGFzdFRpbGVOb2RlLFxuICAgICAgICB9O1xuICAgICAgICBkZWJ1Z2xvZyhcInByZXZlbnQgc2hyaW5raW5nLCBsYXN0IHRpbGUgXCIsIG9mZnNldEZyb21Cb3R0b20sIFwicHggZnJvbSBib3R0b21cIik7XG4gICAgfSxcblxuICAgIC8qKiBDbGVhciBzaHJpbmtpbmcgcHJldmVudGlvbi4gVXNlZCBpbnRlcm5hbGx5LCBhbmQgd2hlbiB0aGUgdGltZWxpbmUgaXMgcmVsb2FkZWQuICovXG4gICAgY2xlYXJQcmV2ZW50U2hyaW5raW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZUxpc3QgPSB0aGlzLl9pdGVtbGlzdC5jdXJyZW50O1xuICAgICAgICBjb25zdCBiYWxhbmNlRWxlbWVudCA9IG1lc3NhZ2VMaXN0ICYmIG1lc3NhZ2VMaXN0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmIChiYWxhbmNlRWxlbWVudCkgYmFsYW5jZUVsZW1lbnQuc3R5bGUucGFkZGluZ0JvdHRvbSA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmVudFNocmlua2luZ1N0YXRlID0gbnVsbDtcbiAgICAgICAgZGVidWdsb2coXCJwcmV2ZW50IHNocmlua2luZyBjbGVhcmVkXCIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICB1cGRhdGUgdGhlIGNvbnRhaW5lciBwYWRkaW5nIHRvIGJhbGFuY2VcbiAgICB0aGUgYm90dG9tIG9mZnNldCBvZiB0aGUgbGFzdCB0aWxlIHNpbmNlXG4gICAgcHJldmVudFNocmlua2luZyB3YXMgY2FsbGVkLlxuICAgIENsZWFycyB0aGUgcHJldmVudC1zaHJpbmtpbmcgc3RhdGUgb25lcyB0aGUgb2Zmc2V0XG4gICAgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBtYXJrZWQgdGlsZSBncm93cyBsYXJnZXIgdGhhblxuICAgIHdoYXQgaXQgd2FzIHdoZW4gbWFya2luZy5cbiAgICAqL1xuICAgIHVwZGF0ZVByZXZlbnRTaHJpbmtpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcmV2ZW50U2hyaW5raW5nU3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNuID0gdGhpcy5fZ2V0U2Nyb2xsTm9kZSgpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsU3RhdGUgPSB0aGlzLnNjcm9sbFN0YXRlO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZUxpc3QgPSB0aGlzLl9pdGVtbGlzdC5jdXJyZW50O1xuICAgICAgICAgICAgY29uc3Qge29mZnNldE5vZGUsIG9mZnNldEZyb21Cb3R0b219ID0gdGhpcy5wcmV2ZW50U2hyaW5raW5nU3RhdGU7XG4gICAgICAgICAgICAvLyBlbGVtZW50IHVzZWQgdG8gc2V0IHBhZGRpbmdCb3R0b20gdG8gYmFsYW5jZSB0aGUgdHlwaW5nIG5vdGlmcyBkaXNhcHBlYXJpbmdcbiAgICAgICAgICAgIGNvbnN0IGJhbGFuY2VFbGVtZW50ID0gbWVzc2FnZUxpc3QucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBvZmZzZXROb2RlIGdvdCB1bm1vdW50ZWQsIGNsZWFyXG4gICAgICAgICAgICBsZXQgc2hvdWxkQ2xlYXIgPSAhb2Zmc2V0Tm9kZS5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgLy8gYWxzbyBpZiAyMDBweCBmcm9tIGJvdHRvbVxuICAgICAgICAgICAgaWYgKCFzaG91bGRDbGVhciAmJiAhc2Nyb2xsU3RhdGUuc3R1Y2tBdEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwYWNlQmVsb3dWaWV3cG9ydCA9IHNuLnNjcm9sbEhlaWdodCAtIChzbi5zY3JvbGxUb3AgKyBzbi5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIHNob3VsZENsZWFyID0gc3BhY2VCZWxvd1ZpZXdwb3J0ID49IDIwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRyeSB1cGRhdGluZyBpZiBub3QgY2xlYXJpbmdcbiAgICAgICAgICAgIGlmICghc2hvdWxkQ2xlYXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50T2Zmc2V0ID0gbWVzc2FnZUxpc3QuY2xpZW50SGVpZ2h0IC0gKG9mZnNldE5vZGUub2Zmc2V0VG9wICsgb2Zmc2V0Tm9kZS5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldERpZmYgPSBvZmZzZXRGcm9tQm90dG9tIC0gY3VycmVudE9mZnNldDtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0RGlmZiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYmFsYW5jZUVsZW1lbnQuc3R5bGUucGFkZGluZ0JvdHRvbSA9IGAke29mZnNldERpZmZ9cHhgO1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcInVwZGF0ZSBwcmV2ZW50IHNocmlua2luZyBcIiwgb2Zmc2V0RGlmZiwgXCJweCBmcm9tIGJvdHRvbVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9mZnNldERpZmYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3VsZENsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2hvdWxkQ2xlYXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyUHJldmVudFNocmlua2luZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRPRE86IHRoZSBjbGFzc25hbWVzIG9uIHRoZSBkaXYgYW5kIG9sIGNvdWxkIGRvIHdpdGggYmVpbmcgdXBkYXRlZCB0b1xuICAgICAgICAvLyByZWZsZWN0IHRoZSBmYWN0IHRoYXQgd2UgZG9uJ3QgbmVjZXNzYXJpbHkgY29udGFpbiBhIGxpc3Qgb2YgbWVzc2FnZXMuXG4gICAgICAgIC8vIGl0J3Mgbm90IG9idmlvdXMgd2h5IHdlIGhhdmUgYSBzZXBhcmF0ZSBkaXYgYW5kIG9sIGFueXdheS5cblxuICAgICAgICAvLyBnaXZlIHRoZSA8b2w+IGFuIGV4cGxpY2l0IHJvbGU9bGlzdCBiZWNhdXNlIFNhZmFyaStWb2ljZU92ZXIgc2VlbXMgdG8gdGhpbmsgYW4gb3JkZXJlZC1saXN0IHdpdGhcbiAgICAgICAgLy8gbGlzdC1zdHlsZS10eXBlOiBub25lOyBpcyBubyBsb25nZXIgYSBsaXN0XG4gICAgICAgIHJldHVybiAoPEF1dG9IaWRlU2Nyb2xsYmFyIHdyYXBwZWRSZWY9e3RoaXMuX2NvbGxlY3RTY3JvbGx9XG4gICAgICAgICAgICAgICAgb25TY3JvbGw9e3RoaXMub25TY3JvbGx9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgbXhfU2Nyb2xsUGFuZWwgJHt0aGlzLnByb3BzLmNsYXNzTmFtZX1gfSBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZX0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfbWVzc2FnZUxpc3RXcmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b2wgcmVmPXt0aGlzLl9pdGVtbGlzdH0gY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfTWVzc2FnZUxpc3RcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIiByb2xlPVwibGlzdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5jaGlsZHJlbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L29sPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0F1dG9IaWRlU2Nyb2xsYmFyPlxuICAgICAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=