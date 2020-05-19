"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _DateUtils = require("../../../DateUtils");

var _matrixJsSdk = require("matrix-js-sdk");

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _escapeHtml = _interopRequireDefault(require("escape-html"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

/*
Copyright 2017 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
// This component does no cycle detection, simply because the only way to make such a cycle would be to
// craft event_id's, using a homeserver that generates predictable event IDs; even then the impact would
// be low as each event being loaded (after the first) is triggered by an explicit user action.
class ReplyThread extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onRoomRedaction", (ev, room) => {
      if (this.unmounted) return; // If one of the events we are rendering gets redacted, force a re-render

      if (this.state.events.some(event => event.getId() === ev.getId())) {
        this.forceUpdate();
      }
    });
    this.state = {
      // The loaded events to be rendered as linear-replies
      events: [],
      // The latest loaded event which has not yet been shown
      loadedEv: null,
      // Whether the component is still loading more events
      loading: true,
      // Whether as error was encountered fetching a replied to event.
      err: false
    };
    this.onQuoteClick = this.onQuoteClick.bind(this);
    this.canCollapse = this.canCollapse.bind(this);
    this.collapse = this.collapse.bind(this);
  }

  static getParentEventId(ev) {
    if (!ev || ev.isRedacted()) return; // XXX: For newer relations (annotations, replacements, etc.), we now
    // have a `getRelation` helper on the event, and you might assume it
    // could be used here for replies as well... However, the helper
    // currently assumes the relation has a `rel_type`, which older replies
    // do not, so this block is left as-is for now.

    const mRelatesTo = ev.getWireContent()['m.relates_to'];

    if (mRelatesTo && mRelatesTo['m.in_reply_to']) {
      const mInReplyTo = mRelatesTo['m.in_reply_to'];
      if (mInReplyTo && mInReplyTo['event_id']) return mInReplyTo['event_id'];
    }
  } // Part of Replies fallback support


  static stripPlainReply(body) {
    // Removes lines beginning with `> ` until you reach one that doesn't.
    const lines = body.split('\n');

    while (lines.length && lines[0].startsWith('> ')) lines.shift(); // Reply fallback has a blank line after it, so remove it to prevent leading newline


    if (lines[0] === '') lines.shift();
    return lines.join('\n');
  } // Part of Replies fallback support


  static stripHTMLReply(html) {
    return html.replace(/^<mx-reply>[\s\S]+?<\/mx-reply>/, '');
  } // Part of Replies fallback support


  static getNestedReplyText(ev, permalinkCreator) {
    if (!ev) return null;
    let {
      body,
      formatted_body: html
    } = ev.getContent();

    if (this.getParentEventId(ev)) {
      if (body) body = this.stripPlainReply(body);
      if (html) html = this.stripHTMLReply(html);
    }

    if (!body) body = ""; // Always ensure we have a body, for reasons.
    // Escape the body to use as HTML below.
    // We also run a nl2br over the result to fix the fallback representation. We do this
    // after converting the text to safe HTML to avoid user-provided BR's from being converted.

    if (!html) html = (0, _escapeHtml.default)(body).replace(/\n/g, '<br/>'); // dev note: do not rely on `body` being safe for HTML usage below.

    const evLink = permalinkCreator.forEvent(ev.getId());
    const userLink = (0, _Permalinks.makeUserPermalink)(ev.getSender());
    const mxid = ev.getSender(); // This fallback contains text that is explicitly EN.

    switch (ev.getContent().msgtype) {
      case 'm.text':
      case 'm.notice':
        {
          html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> <a href=\"").concat(userLink, "\">").concat(mxid, "</a>") + "<br>".concat(html, "</blockquote></mx-reply>");
          const lines = body.trim().split('\n');

          if (lines.length > 0) {
            lines[0] = "<".concat(mxid, "> ").concat(lines[0]);
            body = lines.map(line => "> ".concat(line)).join('\n') + '\n\n';
          }

          break;
        }

      case 'm.image':
        html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> <a href=\"").concat(userLink, "\">").concat(mxid, "</a>") + "<br>sent an image.</blockquote></mx-reply>";
        body = "> <".concat(mxid, "> sent an image.\n\n");
        break;

      case 'm.video':
        html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> <a href=\"").concat(userLink, "\">").concat(mxid, "</a>") + "<br>sent a video.</blockquote></mx-reply>";
        body = "> <".concat(mxid, "> sent a video.\n\n");
        break;

      case 'm.audio':
        html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> <a href=\"").concat(userLink, "\">").concat(mxid, "</a>") + "<br>sent an audio file.</blockquote></mx-reply>";
        body = "> <".concat(mxid, "> sent an audio file.\n\n");
        break;

      case 'm.file':
        html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> <a href=\"").concat(userLink, "\">").concat(mxid, "</a>") + "<br>sent a file.</blockquote></mx-reply>";
        body = "> <".concat(mxid, "> sent a file.\n\n");
        break;

      case 'm.emote':
        {
          html = "<mx-reply><blockquote><a href=\"".concat(evLink, "\">In reply to</a> * ") + "<a href=\"".concat(userLink, "\">").concat(mxid, "</a><br>").concat(html, "</blockquote></mx-reply>");
          const lines = body.trim().split('\n');

          if (lines.length > 0) {
            lines[0] = "* <".concat(mxid, "> ").concat(lines[0]);
            body = lines.map(line => "> ".concat(line)).join('\n') + '\n\n';
          }

          break;
        }

      default:
        return null;
    }

    return {
      body,
      html
    };
  }

  static makeReplyMixIn(ev) {
    if (!ev) return {};
    return {
      'm.relates_to': {
        'm.in_reply_to': {
          'event_id': ev.getId()
        }
      }
    };
  }

  static makeThread(parentEv, onHeightChanged, permalinkCreator, ref) {
    if (!ReplyThread.getParentEventId(parentEv)) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    }

    return /*#__PURE__*/_react.default.createElement(ReplyThread, {
      parentEv: parentEv,
      onHeightChanged: onHeightChanged,
      ref: ref,
      permalinkCreator: permalinkCreator
    });
  }

  componentDidMount() {
    this.unmounted = false;
    this.room = this.context.getRoom(this.props.parentEv.getRoomId());
    this.room.on("Room.redaction", this.onRoomRedaction); // same event handler as Room.redaction as for both we just do forceUpdate

    this.room.on("Room.redactionCancelled", this.onRoomRedaction);
    this.initialize();
  }

  componentDidUpdate() {
    this.props.onHeightChanged();
  }

  componentWillUnmount() {
    this.unmounted = true;

    if (this.room) {
      this.room.removeListener("Room.redaction", this.onRoomRedaction);
      this.room.removeListener("Room.redactionCancelled", this.onRoomRedaction);
    }
  }

  async initialize() {
    const {
      parentEv
    } = this.props; // at time of making this component we checked that props.parentEv has a parentEventId

    const ev = await this.getEvent(ReplyThread.getParentEventId(parentEv));
    if (this.unmounted) return;

    if (ev) {
      this.setState({
        events: [ev]
      }, this.loadNextEvent);
    } else {
      this.setState({
        err: true
      });
    }
  }

  async loadNextEvent() {
    if (this.unmounted) return;
    const ev = this.state.events[0];
    const inReplyToEventId = ReplyThread.getParentEventId(ev);

    if (!inReplyToEventId) {
      this.setState({
        loading: false
      });
      return;
    }

    const loadedEv = await this.getEvent(inReplyToEventId);
    if (this.unmounted) return;

    if (loadedEv) {
      this.setState({
        loadedEv
      });
    } else {
      this.setState({
        err: true
      });
    }
  }

  async getEvent(eventId) {
    const event = this.room.findEventById(eventId);
    if (event) return event;

    try {
      // ask the client to fetch the event we want using the context API, only interface to do so is to ask
      // for a timeline with that event, but once it is loaded we can use findEventById to look up the ev map
      await this.context.getEventTimeline(this.room.getUnfilteredTimelineSet(), eventId);
    } catch (e) {
      // if it fails catch the error and return early, there's no point trying to find the event in this case.
      // Return null as it is falsey and thus should be treated as an error (as the event cannot be resolved).
      return null;
    }

    return this.room.findEventById(eventId);
  }

  canCollapse() {
    return this.state.events.length > 1;
  }

  collapse() {
    this.initialize();
  }

  onQuoteClick() {
    const events = [this.state.loadedEv, ...this.state.events];
    this.setState({
      loadedEv: null,
      events
    }, this.loadNextEvent);

    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });
  }

  render() {
    let header = null;

    if (this.state.err) {
      header = /*#__PURE__*/_react.default.createElement("blockquote", {
        className: "mx_ReplyThread mx_ReplyThread_error"
      }, (0, _languageHandler._t)('Unable to load event that was replied to, ' + 'it either does not exist or you do not have permission to view it.'));
    } else if (this.state.loadedEv) {
      const ev = this.state.loadedEv;
      const Pill = sdk.getComponent('elements.Pill');
      const room = this.context.getRoom(ev.getRoomId());
      header = /*#__PURE__*/_react.default.createElement("blockquote", {
        className: "mx_ReplyThread"
      }, (0, _languageHandler._t)('<a>In reply to</a> <pill>', {}, {
        'a': sub => /*#__PURE__*/_react.default.createElement("a", {
          onClick: this.onQuoteClick,
          className: "mx_ReplyThread_show"
        }, sub),
        'pill': /*#__PURE__*/_react.default.createElement(Pill, {
          type: Pill.TYPE_USER_MENTION,
          room: room,
          url: (0, _Permalinks.makeUserPermalink)(ev.getSender()),
          shouldShowPillAvatar: true
        })
      }));
    } else if (this.state.loading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      header = /*#__PURE__*/_react.default.createElement(Spinner, {
        w: 16,
        h: 16
      });
    }

    const EventTile = sdk.getComponent('views.rooms.EventTile');
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const evTiles = this.state.events.map(ev => {
      let dateSep = null;

      if ((0, _DateUtils.wantsDateSeparator)(this.props.parentEv.getDate(), ev.getDate())) {
        dateSep = /*#__PURE__*/_react.default.createElement("a", {
          href: this.props.url
        }, /*#__PURE__*/_react.default.createElement(DateSeparator, {
          ts: ev.getTs()
        }));
      }

      return /*#__PURE__*/_react.default.createElement("blockquote", {
        className: "mx_ReplyThread",
        key: ev.getId()
      }, dateSep, /*#__PURE__*/_react.default.createElement(EventTile, {
        mxEvent: ev,
        tileShape: "reply",
        onHeightChanged: this.props.onHeightChanged,
        permalinkCreator: this.props.permalinkCreator,
        isRedacted: ev.isRedacted(),
        isTwelveHour: _SettingsStore.default.getValue("showTwelveHourTimestamps")
      }));
    });
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, header), /*#__PURE__*/_react.default.createElement("div", null, evTiles));
  }

}

exports.default = ReplyThread;
(0, _defineProperty2.default)(ReplyThread, "propTypes", {
  // the latest event in this chain of replies
  parentEv: _propTypes.default.instanceOf(_matrixJsSdk.MatrixEvent),
  // called when the ReplyThread contents has changed, including EventTiles thereof
  onHeightChanged: _propTypes.default.func.isRequired,
  permalinkCreator: _propTypes.default.instanceOf(_Permalinks.RoomPermalinkCreator).isRequired
});
(0, _defineProperty2.default)(ReplyThread, "contextType", _MatrixClientContext.default);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1JlcGx5VGhyZWFkLmpzIl0sIm5hbWVzIjpbIlJlcGx5VGhyZWFkIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZXYiLCJyb29tIiwidW5tb3VudGVkIiwic3RhdGUiLCJldmVudHMiLCJzb21lIiwiZXZlbnQiLCJnZXRJZCIsImZvcmNlVXBkYXRlIiwibG9hZGVkRXYiLCJsb2FkaW5nIiwiZXJyIiwib25RdW90ZUNsaWNrIiwiYmluZCIsImNhbkNvbGxhcHNlIiwiY29sbGFwc2UiLCJnZXRQYXJlbnRFdmVudElkIiwiaXNSZWRhY3RlZCIsIm1SZWxhdGVzVG8iLCJnZXRXaXJlQ29udGVudCIsIm1JblJlcGx5VG8iLCJzdHJpcFBsYWluUmVwbHkiLCJib2R5IiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsInN0YXJ0c1dpdGgiLCJzaGlmdCIsImpvaW4iLCJzdHJpcEhUTUxSZXBseSIsImh0bWwiLCJyZXBsYWNlIiwiZ2V0TmVzdGVkUmVwbHlUZXh0IiwicGVybWFsaW5rQ3JlYXRvciIsImZvcm1hdHRlZF9ib2R5IiwiZ2V0Q29udGVudCIsImV2TGluayIsImZvckV2ZW50IiwidXNlckxpbmsiLCJnZXRTZW5kZXIiLCJteGlkIiwibXNndHlwZSIsInRyaW0iLCJtYXAiLCJsaW5lIiwibWFrZVJlcGx5TWl4SW4iLCJtYWtlVGhyZWFkIiwicGFyZW50RXYiLCJvbkhlaWdodENoYW5nZWQiLCJyZWYiLCJjb21wb25lbnREaWRNb3VudCIsImNvbnRleHQiLCJnZXRSb29tIiwiZ2V0Um9vbUlkIiwib24iLCJvblJvb21SZWRhY3Rpb24iLCJpbml0aWFsaXplIiwiY29tcG9uZW50RGlkVXBkYXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVMaXN0ZW5lciIsImdldEV2ZW50Iiwic2V0U3RhdGUiLCJsb2FkTmV4dEV2ZW50IiwiaW5SZXBseVRvRXZlbnRJZCIsImV2ZW50SWQiLCJmaW5kRXZlbnRCeUlkIiwiZ2V0RXZlbnRUaW1lbGluZSIsImdldFVuZmlsdGVyZWRUaW1lbGluZVNldCIsImUiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInJlbmRlciIsImhlYWRlciIsIlBpbGwiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJzdWIiLCJUWVBFX1VTRVJfTUVOVElPTiIsIlNwaW5uZXIiLCJFdmVudFRpbGUiLCJEYXRlU2VwYXJhdG9yIiwiZXZUaWxlcyIsImRhdGVTZXAiLCJnZXREYXRlIiwidXJsIiwiZ2V0VHMiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJQcm9wVHlwZXMiLCJpbnN0YW5jZU9mIiwiTWF0cml4RXZlbnQiLCJmdW5jIiwiaXNSZXF1aXJlZCIsIlJvb21QZXJtYWxpbmtDcmVhdG9yIiwiTWF0cml4Q2xpZW50Q29udGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBO0FBQ0E7QUFDQTtBQUNlLE1BQU1BLFdBQU4sU0FBMEJDLGVBQU1DLFNBQWhDLENBQTBDO0FBV3JEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSwyREFvS0QsQ0FBQ0MsRUFBRCxFQUFLQyxJQUFMLEtBQWM7QUFDNUIsVUFBSSxLQUFLQyxTQUFULEVBQW9CLE9BRFEsQ0FHNUI7O0FBQ0EsVUFBSSxLQUFLQyxLQUFMLENBQVdDLE1BQVgsQ0FBa0JDLElBQWxCLENBQXVCQyxLQUFLLElBQUlBLEtBQUssQ0FBQ0MsS0FBTixPQUFrQlAsRUFBRSxDQUFDTyxLQUFILEVBQWxELENBQUosRUFBbUU7QUFDL0QsYUFBS0MsV0FBTDtBQUNIO0FBQ0osS0EzS2tCO0FBR2YsU0FBS0wsS0FBTCxHQUFhO0FBQ1Q7QUFDQUMsTUFBQUEsTUFBTSxFQUFFLEVB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Z0IsRUFBRXdELG1CQUFVQyxVQUFWLENBQXFCSSxnQ0FBckIsRUFBMkNEO0FBTDlDLEM7OEJBREZsRyxXLGlCQVNJb0csNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge190fSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7d2FudHNEYXRlU2VwYXJhdG9yfSBmcm9tICcuLi8uLi8uLi9EYXRlVXRpbHMnO1xuaW1wb3J0IHtNYXRyaXhFdmVudH0gZnJvbSAnbWF0cml4LWpzLXNkayc7XG5pbXBvcnQge21ha2VVc2VyUGVybWFsaW5rLCBSb29tUGVybWFsaW5rQ3JlYXRvcn0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rc1wiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBlc2NhcGVIdG1sIGZyb20gXCJlc2NhcGUtaHRtbFwiO1xuaW1wb3J0IE1hdHJpeENsaWVudENvbnRleHQgZnJvbSBcIi4uLy4uLy4uL2NvbnRleHRzL01hdHJpeENsaWVudENvbnRleHRcIjtcblxuLy8gVGhpcyBjb21wb25lbnQgZG9lcyBubyBjeWNsZSBkZXRlY3Rpb24sIHNpbXBseSBiZWNhdXNlIHRoZSBvbmx5IHdheSB0byBtYWtlIHN1Y2ggYSBjeWNsZSB3b3VsZCBiZSB0b1xuLy8gY3JhZnQgZXZlbnRfaWQncywgdXNpbmcgYSBob21lc2VydmVyIHRoYXQgZ2VuZXJhdGVzIHByZWRpY3RhYmxlIGV2ZW50IElEczsgZXZlbiB0aGVuIHRoZSBpbXBhY3Qgd291bGRcbi8vIGJlIGxvdyBhcyBlYWNoIGV2ZW50IGJlaW5nIGxvYWRlZCAoYWZ0ZXIgdGhlIGZpcnN0KSBpcyB0cmlnZ2VyZWQgYnkgYW4gZXhwbGljaXQgdXNlciBhY3Rpb24uXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBseVRocmVhZCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gdGhlIGxhdGVzdCBldmVudCBpbiB0aGlzIGNoYWluIG9mIHJlcGxpZXNcbiAgICAgICAgcGFyZW50RXY6IFByb3BUeXBlcy5pbnN0YW5jZU9mKE1hdHJpeEV2ZW50KSxcbiAgICAgICAgLy8gY2FsbGVkIHdoZW4gdGhlIFJlcGx5VGhyZWFkIGNvbnRlbnRzIGhhcyBjaGFuZ2VkLCBpbmNsdWRpbmcgRXZlbnRUaWxlcyB0aGVyZW9mXG4gICAgICAgIG9uSGVpZ2h0Q2hhbmdlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgcGVybWFsaW5rQ3JlYXRvcjogUHJvcFR5cGVzLmluc3RhbmNlT2YoUm9vbVBlcm1hbGlua0NyZWF0b3IpLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIC8vIFRoZSBsb2FkZWQgZXZlbnRzIHRvIGJlIHJlbmRlcmVkIGFzIGxpbmVhci1yZXBsaWVzXG4gICAgICAgICAgICBldmVudHM6IFtdLFxuXG4gICAgICAgICAgICAvLyBUaGUgbGF0ZXN0IGxvYWRlZCBldmVudCB3aGljaCBoYXMgbm90IHlldCBiZWVuIHNob3duXG4gICAgICAgICAgICBsb2FkZWRFdjogbnVsbCxcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGNvbXBvbmVudCBpcyBzdGlsbCBsb2FkaW5nIG1vcmUgZXZlbnRzXG4gICAgICAgICAgICBsb2FkaW5nOiB0cnVlLFxuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIGFzIGVycm9yIHdhcyBlbmNvdW50ZXJlZCBmZXRjaGluZyBhIHJlcGxpZWQgdG8gZXZlbnQuXG4gICAgICAgICAgICBlcnI6IGZhbHNlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25RdW90ZUNsaWNrID0gdGhpcy5vblF1b3RlQ2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jYW5Db2xsYXBzZSA9IHRoaXMuY2FuQ29sbGFwc2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jb2xsYXBzZSA9IHRoaXMuY29sbGFwc2UuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGFyZW50RXZlbnRJZChldikge1xuICAgICAgICBpZiAoIWV2IHx8IGV2LmlzUmVkYWN0ZWQoKSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFhYWDogRm9yIG5ld2VyIHJlbGF0aW9ucyAoYW5ub3RhdGlvbnMsIHJlcGxhY2VtZW50cywgZXRjLiksIHdlIG5vd1xuICAgICAgICAvLyBoYXZlIGEgYGdldFJlbGF0aW9uYCBoZWxwZXIgb24gdGhlIGV2ZW50LCBhbmQgeW91IG1pZ2h0IGFzc3VtZSBpdFxuICAgICAgICAvLyBjb3VsZCBiZSB1c2VkIGhlcmUgZm9yIHJlcGxpZXMgYXMgd2VsbC4uLiBIb3dldmVyLCB0aGUgaGVscGVyXG4gICAgICAgIC8vIGN1cnJlbnRseSBhc3N1bWVzIHRoZSByZWxhdGlvbiBoYXMgYSBgcmVsX3R5cGVgLCB3aGljaCBvbGRlciByZXBsaWVzXG4gICAgICAgIC8vIGRvIG5vdCwgc28gdGhpcyBibG9jayBpcyBsZWZ0IGFzLWlzIGZvciBub3cuXG4gICAgICAgIGNvbnN0IG1SZWxhdGVzVG8gPSBldi5nZXRXaXJlQ29udGVudCgpWydtLnJlbGF0ZXNfdG8nXTtcbiAgICAgICAgaWYgKG1SZWxhdGVzVG8gJiYgbVJlbGF0ZXNUb1snbS5pbl9yZXBseV90byddKSB7XG4gICAgICAgICAgICBjb25zdCBtSW5SZXBseVRvID0gbVJlbGF0ZXNUb1snbS5pbl9yZXBseV90byddO1xuICAgICAgICAgICAgaWYgKG1JblJlcGx5VG8gJiYgbUluUmVwbHlUb1snZXZlbnRfaWQnXSkgcmV0dXJuIG1JblJlcGx5VG9bJ2V2ZW50X2lkJ107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQYXJ0IG9mIFJlcGxpZXMgZmFsbGJhY2sgc3VwcG9ydFxuICAgIHN0YXRpYyBzdHJpcFBsYWluUmVwbHkoYm9keSkge1xuICAgICAgICAvLyBSZW1vdmVzIGxpbmVzIGJlZ2lubmluZyB3aXRoIGA+IGAgdW50aWwgeW91IHJlYWNoIG9uZSB0aGF0IGRvZXNuJ3QuXG4gICAgICAgIGNvbnN0IGxpbmVzID0gYm9keS5zcGxpdCgnXFxuJyk7XG4gICAgICAgIHdoaWxlIChsaW5lcy5sZW5ndGggJiYgbGluZXNbMF0uc3RhcnRzV2l0aCgnPiAnKSkgbGluZXMuc2hpZnQoKTtcbiAgICAgICAgLy8gUmVwbHkgZmFsbGJhY2sgaGFzIGEgYmxhbmsgbGluZSBhZnRlciBpdCwgc28gcmVtb3ZlIGl0IHRvIHByZXZlbnQgbGVhZGluZyBuZXdsaW5lXG4gICAgICAgIGlmIChsaW5lc1swXSA9PT0gJycpIGxpbmVzLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICAvLyBQYXJ0IG9mIFJlcGxpZXMgZmFsbGJhY2sgc3VwcG9ydFxuICAgIHN0YXRpYyBzdHJpcEhUTUxSZXBseShodG1sKSB7XG4gICAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoL148bXgtcmVwbHk+W1xcc1xcU10rPzxcXC9teC1yZXBseT4vLCAnJyk7XG4gICAgfVxuXG4gICAgLy8gUGFydCBvZiBSZXBsaWVzIGZhbGxiYWNrIHN1cHBvcnRcbiAgICBzdGF0aWMgZ2V0TmVzdGVkUmVwbHlUZXh0KGV2LCBwZXJtYWxpbmtDcmVhdG9yKSB7XG4gICAgICAgIGlmICghZXYpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGxldCB7Ym9keSwgZm9ybWF0dGVkX2JvZHk6IGh0bWx9ID0gZXYuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAodGhpcy5nZXRQYXJlbnRFdmVudElkKGV2KSkge1xuICAgICAgICAgICAgaWYgKGJvZHkpIGJvZHkgPSB0aGlzLnN0cmlwUGxhaW5SZXBseShib2R5KTtcbiAgICAgICAgICAgIGlmIChodG1sKSBodG1sID0gdGhpcy5zdHJpcEhUTUxSZXBseShodG1sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYm9keSkgYm9keSA9IFwiXCI7IC8vIEFsd2F5cyBlbnN1cmUgd2UgaGF2ZSBhIGJvZHksIGZvciByZWFzb25zLlxuXG4gICAgICAgIC8vIEVzY2FwZSB0aGUgYm9keSB0byB1c2UgYXMgSFRNTCBiZWxvdy5cbiAgICAgICAgLy8gV2UgYWxzbyBydW4gYSBubDJiciBvdmVyIHRoZSByZXN1bHQgdG8gZml4IHRoZSBmYWxsYmFjayByZXByZXNlbnRhdGlvbi4gV2UgZG8gdGhpc1xuICAgICAgICAvLyBhZnRlciBjb252ZXJ0aW5nIHRoZSB0ZXh0IHRvIHNhZmUgSFRNTCB0byBhdm9pZCB1c2VyLXByb3ZpZGVkIEJSJ3MgZnJvbSBiZWluZyBjb252ZXJ0ZWQuXG4gICAgICAgIGlmICghaHRtbCkgaHRtbCA9IGVzY2FwZUh0bWwoYm9keSkucmVwbGFjZSgvXFxuL2csICc8YnIvPicpO1xuXG4gICAgICAgIC8vIGRldiBub3RlOiBkbyBub3QgcmVseSBvbiBgYm9keWAgYmVpbmcgc2FmZSBmb3IgSFRNTCB1c2FnZSBiZWxvdy5cblxuICAgICAgICBjb25zdCBldkxpbmsgPSBwZXJtYWxpbmtDcmVhdG9yLmZvckV2ZW50KGV2LmdldElkKCkpO1xuICAgICAgICBjb25zdCB1c2VyTGluayA9IG1ha2VVc2VyUGVybWFsaW5rKGV2LmdldFNlbmRlcigpKTtcbiAgICAgICAgY29uc3QgbXhpZCA9IGV2LmdldFNlbmRlcigpO1xuXG4gICAgICAgIC8vIFRoaXMgZmFsbGJhY2sgY29udGFpbnMgdGV4dCB0aGF0IGlzIGV4cGxpY2l0bHkgRU4uXG4gICAgICAgIHN3aXRjaCAoZXYuZ2V0Q29udGVudCgpLm1zZ3R5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ20udGV4dCc6XG4gICAgICAgICAgICBjYXNlICdtLm5vdGljZSc6IHtcbiAgICAgICAgICAgICAgICBodG1sID0gYDxteC1yZXBseT48YmxvY2txdW90ZT48YSBocmVmPVwiJHtldkxpbmt9XCI+SW4gcmVwbHkgdG88L2E+IDxhIGhyZWY9XCIke3VzZXJMaW5rfVwiPiR7bXhpZH08L2E+YFxuICAgICAgICAgICAgICAgICAgICArIGA8YnI+JHtodG1sfTwvYmxvY2txdW90ZT48L214LXJlcGx5PmA7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSBib2R5LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZXNbMF0gPSBgPCR7bXhpZH0+ICR7bGluZXNbMF19YDtcbiAgICAgICAgICAgICAgICAgICAgYm9keSA9IGxpbmVzLm1hcCgobGluZSkgPT4gYD4gJHtsaW5lfWApLmpvaW4oJ1xcbicpICsgJ1xcblxcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnbS5pbWFnZSc6XG4gICAgICAgICAgICAgICAgaHRtbCA9IGA8bXgtcmVwbHk+PGJsb2NrcXVvdGU+PGEgaHJlZj1cIiR7ZXZMaW5rfVwiPkluIHJlcGx5IHRvPC9hPiA8YSBocmVmPVwiJHt1c2VyTGlua31cIj4ke214aWR9PC9hPmBcbiAgICAgICAgICAgICAgICAgICAgKyBgPGJyPnNlbnQgYW4gaW1hZ2UuPC9ibG9ja3F1b3RlPjwvbXgtcmVwbHk+YDtcbiAgICAgICAgICAgICAgICBib2R5ID0gYD4gPCR7bXhpZH0+IHNlbnQgYW4gaW1hZ2UuXFxuXFxuYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ20udmlkZW8nOlxuICAgICAgICAgICAgICAgIGh0bWwgPSBgPG14LXJlcGx5PjxibG9ja3F1b3RlPjxhIGhyZWY9XCIke2V2TGlua31cIj5JbiByZXBseSB0bzwvYT4gPGEgaHJlZj1cIiR7dXNlckxpbmt9XCI+JHtteGlkfTwvYT5gXG4gICAgICAgICAgICAgICAgICAgICsgYDxicj5zZW50IGEgdmlkZW8uPC9ibG9ja3F1b3RlPjwvbXgtcmVwbHk+YDtcbiAgICAgICAgICAgICAgICBib2R5ID0gYD4gPCR7bXhpZH0+IHNlbnQgYSB2aWRlby5cXG5cXG5gO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbS5hdWRpbyc6XG4gICAgICAgICAgICAgICAgaHRtbCA9IGA8bXgtcmVwbHk+PGJsb2NrcXVvdGU+PGEgaHJlZj1cIiR7ZXZMaW5rfVwiPkluIHJlcGx5IHRvPC9hPiA8YSBocmVmPVwiJHt1c2VyTGlua31cIj4ke214aWR9PC9hPmBcbiAgICAgICAgICAgICAgICAgICAgKyBgPGJyPnNlbnQgYW4gYXVkaW8gZmlsZS48L2Jsb2NrcXVvdGU+PC9teC1yZXBseT5gO1xuICAgICAgICAgICAgICAgIGJvZHkgPSBgPiA8JHtteGlkfT4gc2VudCBhbiBhdWRpbyBmaWxlLlxcblxcbmA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtLmZpbGUnOlxuICAgICAgICAgICAgICAgIGh0bWwgPSBgPG14LXJlcGx5PjxibG9ja3F1b3RlPjxhIGhyZWY9XCIke2V2TGlua31cIj5JbiByZXBseSB0bzwvYT4gPGEgaHJlZj1cIiR7dXNlckxpbmt9XCI+JHtteGlkfTwvYT5gXG4gICAgICAgICAgICAgICAgICAgICsgYDxicj5zZW50IGEgZmlsZS48L2Jsb2NrcXVvdGU+PC9teC1yZXBseT5gO1xuICAgICAgICAgICAgICAgIGJvZHkgPSBgPiA8JHtteGlkfT4gc2VudCBhIGZpbGUuXFxuXFxuYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ20uZW1vdGUnOiB7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGA8bXgtcmVwbHk+PGJsb2NrcXVvdGU+PGEgaHJlZj1cIiR7ZXZMaW5rfVwiPkluIHJlcGx5IHRvPC9hPiAqIGBcbiAgICAgICAgICAgICAgICAgICAgKyBgPGEgaHJlZj1cIiR7dXNlckxpbmt9XCI+JHtteGlkfTwvYT48YnI+JHtodG1sfTwvYmxvY2txdW90ZT48L214LXJlcGx5PmA7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSBib2R5LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZXNbMF0gPSBgKiA8JHtteGlkfT4gJHtsaW5lc1swXX1gO1xuICAgICAgICAgICAgICAgICAgICBib2R5ID0gbGluZXMubWFwKChsaW5lKSA9PiBgPiAke2xpbmV9YCkuam9pbignXFxuJykgKyAnXFxuXFxuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtib2R5LCBodG1sfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFrZVJlcGx5TWl4SW4oZXYpIHtcbiAgICAgICAgaWYgKCFldikgcmV0dXJuIHt9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ20ucmVsYXRlc190byc6IHtcbiAgICAgICAgICAgICAgICAnbS5pbl9yZXBseV90byc6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2V2ZW50X2lkJzogZXYuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFrZVRocmVhZChwYXJlbnRFdiwgb25IZWlnaHRDaGFuZ2VkLCBwZXJtYWxpbmtDcmVhdG9yLCByZWYpIHtcbiAgICAgICAgaWYgKCFSZXBseVRocmVhZC5nZXRQYXJlbnRFdmVudElkKHBhcmVudEV2KSkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxSZXBseVRocmVhZCBwYXJlbnRFdj17cGFyZW50RXZ9IG9uSGVpZ2h0Q2hhbmdlZD17b25IZWlnaHRDaGFuZ2VkfVxuICAgICAgICAgICAgcmVmPXtyZWZ9IHBlcm1hbGlua0NyZWF0b3I9e3Blcm1hbGlua0NyZWF0b3J9IC8+O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLnVubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJvb20gPSB0aGlzLmNvbnRleHQuZ2V0Um9vbSh0aGlzLnByb3BzLnBhcmVudEV2LmdldFJvb21JZCgpKTtcbiAgICAgICAgdGhpcy5yb29tLm9uKFwiUm9vbS5yZWRhY3Rpb25cIiwgdGhpcy5vblJvb21SZWRhY3Rpb24pO1xuICAgICAgICAvLyBzYW1lIGV2ZW50IGhhbmRsZXIgYXMgUm9vbS5yZWRhY3Rpb24gYXMgZm9yIGJvdGggd2UganVzdCBkbyBmb3JjZVVwZGF0ZVxuICAgICAgICB0aGlzLnJvb20ub24oXCJSb29tLnJlZGFjdGlvbkNhbmNlbGxlZFwiLCB0aGlzLm9uUm9vbVJlZGFjdGlvbik7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWQoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5yb29tKSB7XG4gICAgICAgICAgICB0aGlzLnJvb20ucmVtb3ZlTGlzdGVuZXIoXCJSb29tLnJlZGFjdGlvblwiLCB0aGlzLm9uUm9vbVJlZGFjdGlvbik7XG4gICAgICAgICAgICB0aGlzLnJvb20ucmVtb3ZlTGlzdGVuZXIoXCJSb29tLnJlZGFjdGlvbkNhbmNlbGxlZFwiLCB0aGlzLm9uUm9vbVJlZGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblJvb21SZWRhY3Rpb24gPSAoZXYsIHJvb20pID0+IHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgb25lIG9mIHRoZSBldmVudHMgd2UgYXJlIHJlbmRlcmluZyBnZXRzIHJlZGFjdGVkLCBmb3JjZSBhIHJlLXJlbmRlclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ldmVudHMuc29tZShldmVudCA9PiBldmVudC5nZXRJZCgpID09PSBldi5nZXRJZCgpKSkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGNvbnN0IHtwYXJlbnRFdn0gPSB0aGlzLnByb3BzO1xuICAgICAgICAvLyBhdCB0aW1lIG9mIG1ha2luZyB0aGlzIGNvbXBvbmVudCB3ZSBjaGVja2VkIHRoYXQgcHJvcHMucGFyZW50RXYgaGFzIGEgcGFyZW50RXZlbnRJZFxuICAgICAgICBjb25zdCBldiA9IGF3YWl0IHRoaXMuZ2V0RXZlbnQoUmVwbHlUaHJlYWQuZ2V0UGFyZW50RXZlbnRJZChwYXJlbnRFdikpO1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICBpZiAoZXYpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGV2ZW50czogW2V2XSxcbiAgICAgICAgICAgIH0sIHRoaXMubG9hZE5leHRFdmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtlcnI6IHRydWV9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWROZXh0RXZlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBldiA9IHRoaXMuc3RhdGUuZXZlbnRzWzBdO1xuICAgICAgICBjb25zdCBpblJlcGx5VG9FdmVudElkID0gUmVwbHlUaHJlYWQuZ2V0UGFyZW50RXZlbnRJZChldik7XG5cbiAgICAgICAgaWYgKCFpblJlcGx5VG9FdmVudElkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9hZGVkRXYgPSBhd2FpdCB0aGlzLmdldEV2ZW50KGluUmVwbHlUb0V2ZW50SWQpO1xuICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcblxuICAgICAgICBpZiAobG9hZGVkRXYpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRlZEV2fSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtlcnI6IHRydWV9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGdldEV2ZW50KGV2ZW50SWQpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLnJvb20uZmluZEV2ZW50QnlJZChldmVudElkKTtcbiAgICAgICAgaWYgKGV2ZW50KSByZXR1cm4gZXZlbnQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGFzayB0aGUgY2xpZW50IHRvIGZldGNoIHRoZSBldmVudCB3ZSB3YW50IHVzaW5nIHRoZSBjb250ZXh0IEFQSSwgb25seSBpbnRlcmZhY2UgdG8gZG8gc28gaXMgdG8gYXNrXG4gICAgICAgICAgICAvLyBmb3IgYSB0aW1lbGluZSB3aXRoIHRoYXQgZXZlbnQsIGJ1dCBvbmNlIGl0IGlzIGxvYWRlZCB3ZSBjYW4gdXNlIGZpbmRFdmVudEJ5SWQgdG8gbG9vayB1cCB0aGUgZXYgbWFwXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZ2V0RXZlbnRUaW1lbGluZSh0aGlzLnJvb20uZ2V0VW5maWx0ZXJlZFRpbWVsaW5lU2V0KCksIGV2ZW50SWQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBpZiBpdCBmYWlscyBjYXRjaCB0aGUgZXJyb3IgYW5kIHJldHVybiBlYXJseSwgdGhlcmUncyBubyBwb2ludCB0cnlpbmcgdG8gZmluZCB0aGUgZXZlbnQgaW4gdGhpcyBjYXNlLlxuICAgICAgICAgICAgLy8gUmV0dXJuIG51bGwgYXMgaXQgaXMgZmFsc2V5IGFuZCB0aHVzIHNob3VsZCBiZSB0cmVhdGVkIGFzIGFuIGVycm9yIChhcyB0aGUgZXZlbnQgY2Fubm90IGJlIHJlc29sdmVkKS5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJvb20uZmluZEV2ZW50QnlJZChldmVudElkKTtcbiAgICB9XG5cbiAgICBjYW5Db2xsYXBzZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZXZlbnRzLmxlbmd0aCA+IDE7XG4gICAgfVxuXG4gICAgY29sbGFwc2UoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgIH1cblxuICAgIG9uUXVvdGVDbGljaygpIHtcbiAgICAgICAgY29uc3QgZXZlbnRzID0gW3RoaXMuc3RhdGUubG9hZGVkRXYsIC4uLnRoaXMuc3RhdGUuZXZlbnRzXTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGxvYWRlZEV2OiBudWxsLFxuICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICB9LCB0aGlzLmxvYWROZXh0RXZlbnQpO1xuXG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgaGVhZGVyID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnIpIHtcbiAgICAgICAgICAgIGhlYWRlciA9IDxibG9ja3F1b3RlIGNsYXNzTmFtZT1cIm14X1JlcGx5VGhyZWFkIG14X1JlcGx5VGhyZWFkX2Vycm9yXCI+XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBfdCgnVW5hYmxlIHRvIGxvYWQgZXZlbnQgdGhhdCB3YXMgcmVwbGllZCB0bywgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnaXQgZWl0aGVyIGRvZXMgbm90IGV4aXN0IG9yIHlvdSBkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIHZpZXcgaXQuJylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA8L2Jsb2NrcXVvdGU+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUubG9hZGVkRXYpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ID0gdGhpcy5zdGF0ZS5sb2FkZWRFdjtcbiAgICAgICAgICAgIGNvbnN0IFBpbGwgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5QaWxsJyk7XG4gICAgICAgICAgICBjb25zdCByb29tID0gdGhpcy5jb250ZXh0LmdldFJvb20oZXYuZ2V0Um9vbUlkKCkpO1xuICAgICAgICAgICAgaGVhZGVyID0gPGJsb2NrcXVvdGUgY2xhc3NOYW1lPVwibXhfUmVwbHlUaHJlYWRcIj5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIF90KCc8YT5JbiByZXBseSB0bzwvYT4gPHBpbGw+Jywge30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhJzogKHN1YikgPT4gPGEgb25DbGljaz17dGhpcy5vblF1b3RlQ2xpY2t9IGNsYXNzTmFtZT1cIm14X1JlcGx5VGhyZWFkX3Nob3dcIj57IHN1YiB9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgICdwaWxsJzogPFBpbGwgdHlwZT17UGlsbC5UWVBFX1VTRVJfTUVOVElPTn0gcm9vbT17cm9vbX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsPXttYWtlVXNlclBlcm1hbGluayhldi5nZXRTZW5kZXIoKSl9IHNob3VsZFNob3dQaWxsQXZhdGFyPXt0cnVlfSAvPixcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA8L2Jsb2NrcXVvdGU+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUubG9hZGluZykge1xuICAgICAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgaGVhZGVyID0gPFNwaW5uZXIgdz17MTZ9IGg9ezE2fSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEV2ZW50VGlsZSA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLnJvb21zLkV2ZW50VGlsZScpO1xuICAgICAgICBjb25zdCBEYXRlU2VwYXJhdG9yID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuRGF0ZVNlcGFyYXRvcicpO1xuICAgICAgICBjb25zdCBldlRpbGVzID0gdGhpcy5zdGF0ZS5ldmVudHMubWFwKChldikgPT4ge1xuICAgICAgICAgICAgbGV0IGRhdGVTZXAgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAod2FudHNEYXRlU2VwYXJhdG9yKHRoaXMucHJvcHMucGFyZW50RXYuZ2V0RGF0ZSgpLCBldi5nZXREYXRlKCkpKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVNlcCA9IDxhIGhyZWY9e3RoaXMucHJvcHMudXJsfT48RGF0ZVNlcGFyYXRvciB0cz17ZXYuZ2V0VHMoKX0gLz48L2E+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gPGJsb2NrcXVvdGUgY2xhc3NOYW1lPVwibXhfUmVwbHlUaHJlYWRcIiBrZXk9e2V2LmdldElkKCl9PlxuICAgICAgICAgICAgICAgIHsgZGF0ZVNlcCB9XG4gICAgICAgICAgICAgICAgPEV2ZW50VGlsZVxuICAgICAgICAgICAgICAgICAgICBteEV2ZW50PXtldn1cbiAgICAgICAgICAgICAgICAgICAgdGlsZVNoYXBlPVwicmVwbHlcIlxuICAgICAgICAgICAgICAgICAgICBvbkhlaWdodENoYW5nZWQ9e3RoaXMucHJvcHMub25IZWlnaHRDaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3J9XG4gICAgICAgICAgICAgICAgICAgIGlzUmVkYWN0ZWQ9e2V2LmlzUmVkYWN0ZWQoKX1cbiAgICAgICAgICAgICAgICAgICAgaXNUd2VsdmVIb3VyPXtTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd1R3ZWx2ZUhvdXJUaW1lc3RhbXBzXCIpfSAvPlxuICAgICAgICAgICAgPC9ibG9ja3F1b3RlPjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8ZGl2PnsgaGVhZGVyIH08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+eyBldlRpbGVzIH08L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cbiJdfQ==