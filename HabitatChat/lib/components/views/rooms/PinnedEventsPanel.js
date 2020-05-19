"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _PinnedEventTile = _interopRequireDefault(require("./PinnedEventTile"));

var _languageHandler = require("../../../languageHandler");

var _PinningUtils = _interopRequireDefault(require("../../../utils/PinningUtils"));

/*
Copyright 2017 Travis Ralston
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
var _default = (0, _createReactClass.default)({
  displayName: 'PinnedEventsPanel',
  propTypes: {
    // The Room from the js-sdk we're going to show pinned events for
    room: _propTypes.default.object.isRequired,
    onCancelClick: _propTypes.default.func
  },
  getInitialState: function () {
    return {
      loading: true
    };
  },
  componentDidMount: function () {
    this._updatePinnedMessages();

    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this._onStateEvent);
  },
  componentWillUnmount: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.events", this._onStateEvent);
    }
  },
  _onStateEvent: function (ev) {
    if (ev.getRoomId() === this.props.room.roomId && ev.getType() === "m.room.pinned_events") {
      this._updatePinnedMessages();
    }
  },
  _updatePinnedMessages: function () {
    const pinnedEvents = this.props.room.currentState.getStateEvents("m.room.pinned_events", "");

    if (!pinnedEvents || !pinnedEvents.getContent().pinned) {
      this.setState({
        loading: false,
        pinned: []
      });
    } else {
      const promises = [];

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      pinnedEvents.getContent().pinned.map(eventId => {
        promises.push(cli.getEventTimeline(this.props.room.getUnfilteredTimelineSet(), eventId, 0).then(timeline => {
          const event = timeline.getEvents().find(e => e.getId() === eventId);
          return {
            eventId,
            timeline,
            event
          };
        }).catch(err => {
          console.error("Error looking up pinned event " + eventId + " in room " + this.props.room.roomId);
          console.error(err);
          return null; // return lack of context to avoid unhandled errors
        }));
      });
      Promise.all(promises).then(contexts => {
        // Filter out the messages before we try to render them
        const pinned = contexts.filter(context => _PinningUtils.default.isPinnable(context.event));
        this.setState({
          loading: false,
          pinned
        });
      });
    }

    this._updateReadState();
  },
  _updateReadState: function () {
    const pinnedEvents = this.props.room.currentState.getStateEvents("m.room.pinned_events", "");
    if (!pinnedEvents) return; // nothing to read

    let readStateEvents = [];
    const readPinsEvent = this.props.room.getAccountData("im.vector.room.read_pins");

    if (readPinsEvent && readPinsEvent.getContent()) {
      readStateEvents = readPinsEvent.getContent().event_ids || [];
    }

    if (!readStateEvents.includes(pinnedEvents.getId())) {
      readStateEvents.push(pinnedEvents.getId()); // Only keep the last 10 event IDs to avoid infinite growth

      readStateEvents = readStateEvents.reverse().splice(0, 10).reverse();

      _MatrixClientPeg.MatrixClientPeg.get().setRoomAccountData(this.props.room.roomId, "im.vector.room.read_pins", {
        event_ids: readStateEvents
      });
    }
  },
  _getPinnedTiles: function () {
    if (this.state.pinned.length === 0) {
      return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("No pinned messages."));
    }

    return this.state.pinned.map(context => {
      return /*#__PURE__*/_react.default.createElement(_PinnedEventTile.default, {
        key: context.event.getId(),
        mxRoom: this.props.room,
        mxEvent: context.event,
        onUnpinned: this._updatePinnedMessages
      });
    });
  },
  render: function () {
    let tiles = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Loading..."));

    if (this.state && !this.state.loading) {
      tiles = this._getPinnedTiles();
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PinnedEventsPanel"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_PinnedEventsPanel_body"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_PinnedEventsPanel_cancel",
      onClick: this.props.onCancelClick
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_filterFlipColor",
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18"
    })), /*#__PURE__*/_react.default.createElement("h3", {
      className: "mx_PinnedEventsPanel_header"
    }, (0, _languageHandler._t)("Pinned Messages")), tiles));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1Bpbm5lZEV2ZW50c1BhbmVsLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJvbkNhbmNlbENsaWNrIiwiZnVuYyIsImdldEluaXRpYWxTdGF0ZSIsImxvYWRpbmciLCJjb21wb25lbnREaWRNb3VudCIsIl91cGRhdGVQaW5uZWRNZXNzYWdlcyIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm9uIiwiX29uU3RhdGVFdmVudCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJldiIsImdldFJvb21JZCIsInByb3BzIiwicm9vbUlkIiwiZ2V0VHlwZSIsInBpbm5lZEV2ZW50cyIsImN1cnJlbnRTdGF0ZSIsImdldFN0YXRlRXZlbnRzIiwiZ2V0Q29udGVudCIsInBpbm5lZCIsInNldFN0YXRlIiwicHJvbWlzZXMiLCJjbGkiLCJtYXAiLCJldmVudElkIiwicHVzaCIsImdldEV2ZW50VGltZWxpbmUiLCJnZXRVbmZpbHRlcmVkVGltZWxpbmVTZXQiLCJ0aGVuIiwidGltZWxpbmUiLCJldmVudCIsImdldEV2ZW50cyIsImZpbmQiLCJlIiwiZ2V0SWQiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsIlByb21pc2UiLCJhbGwiLCJjb250ZXh0cyIsImZpbHRlciIsImNvbnRleHQiLCJQaW5uaW5nVXRpbHMiLCJpc1Bpbm5hYmxlIiwiX3VwZGF0ZVJlYWRTdGF0ZSIsInJlYWRTdGF0ZUV2ZW50cyIsInJlYWRQaW5zRXZlbnQiLCJnZXRBY2NvdW50RGF0YSIsImV2ZW50X2lkcyIsImluY2x1ZGVzIiwicmV2ZXJzZSIsInNwbGljZSIsInNldFJvb21BY2NvdW50RGF0YSIsIl9nZXRQaW5uZWRUaWxlcyIsInN0YXRlIiwibGVuZ3RoIiwicmVuZGVyIiwidGlsZXMi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QUM7QUFBZixvQkFDSSw2QkFBQyx5QkFBRDtBQUFrQixNQUFBLFNBQVMsRUFBQyw2QkFBNUI7QUFBMEQsTUFBQSxPQUFPLEVBQUUsS0FBSzNDLEtBQUwsQ0FBV2Q7QUFBOUUsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQyxvQkFBZjtBQUFvQyxNQUFBLEdBQUcsRUFBRThELE9BQU8sQ0FBQyxnQ0FBRCxDQUFoRDtBQUFvRixNQUFBLEtBQUssRUFBQyxJQUExRjtBQUErRixNQUFBLE1BQU0sRUFBQztBQUF0RyxNQURKLENBREosZUFJSTtBQUFJLE1BQUEsU0FBUyxFQUFDO0FBQWQsT0FBOEMseUJBQUcsaUJBQUgsQ0FBOUMsQ0FKSixFQUtNRCxLQUxOLENBREosQ0FESjtBQVdIO0FBbkgyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFRyYXZpcyBSYWxzdG9uXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQgUGlubmVkRXZlbnRUaWxlIGZyb20gXCIuL1Bpbm5lZEV2ZW50VGlsZVwiO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IFBpbm5pbmdVdGlscyBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvUGlubmluZ1V0aWxzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUGlubmVkRXZlbnRzUGFuZWwnLFxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBUaGUgUm9vbSBmcm9tIHRoZSBqcy1zZGsgd2UncmUgZ29pbmcgdG8gc2hvdyBwaW5uZWQgZXZlbnRzIGZvclxuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG5cbiAgICAgICAgb25DYW5jZWxDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBpbm5lZE1lc3NhZ2VzKCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5fb25TdGF0ZUV2ZW50KTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpKSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMuX29uU3RhdGVFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uU3RhdGVFdmVudDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGV2LmdldFJvb21JZCgpID09PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkICYmIGV2LmdldFR5cGUoKSA9PT0gXCJtLnJvb20ucGlubmVkX2V2ZW50c1wiKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQaW5uZWRNZXNzYWdlcygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVQaW5uZWRNZXNzYWdlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHBpbm5lZEV2ZW50cyA9IHRoaXMucHJvcHMucm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucGlubmVkX2V2ZW50c1wiLCBcIlwiKTtcbiAgICAgICAgaWYgKCFwaW5uZWRFdmVudHMgfHwgIXBpbm5lZEV2ZW50cy5nZXRDb250ZW50KCkucGlubmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgbG9hZGluZzogZmFsc2UsIHBpbm5lZDogW10gfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgICAgICBwaW5uZWRFdmVudHMuZ2V0Q29udGVudCgpLnBpbm5lZC5tYXAoKGV2ZW50SWQpID0+IHtcbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGNsaS5nZXRFdmVudFRpbWVsaW5lKHRoaXMucHJvcHMucm9vbS5nZXRVbmZpbHRlcmVkVGltZWxpbmVTZXQoKSwgZXZlbnRJZCwgMCkudGhlbihcbiAgICAgICAgICAgICAgICAodGltZWxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aW1lbGluZS5nZXRFdmVudHMoKS5maW5kKChlKSA9PiBlLmdldElkKCkgPT09IGV2ZW50SWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2V2ZW50SWQsIHRpbWVsaW5lLCBldmVudH07XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgbG9va2luZyB1cCBwaW5uZWQgZXZlbnQgXCIgKyBldmVudElkICsgXCIgaW4gcm9vbSBcIiArIHRoaXMucHJvcHMucm9vbS5yb29tSWQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyByZXR1cm4gbGFjayBvZiBjb250ZXh0IHRvIGF2b2lkIHVuaGFuZGxlZCBlcnJvcnNcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKGNvbnRleHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gRmlsdGVyIG91dCB0aGUgbWVzc2FnZXMgYmVmb3JlIHdlIHRyeSB0byByZW5kZXIgdGhlbVxuICAgICAgICAgICAgICAgIGNvbnN0IHBpbm5lZCA9IGNvbnRleHRzLmZpbHRlcigoY29udGV4dCkgPT4gUGlubmluZ1V0aWxzLmlzUGlubmFibGUoY29udGV4dC5ldmVudCkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvYWRpbmc6IGZhbHNlLCBwaW5uZWQgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVJlYWRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlUmVhZFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcGlubmVkRXZlbnRzID0gdGhpcy5wcm9wcy5yb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cyhcIm0ucm9vbS5waW5uZWRfZXZlbnRzXCIsIFwiXCIpO1xuICAgICAgICBpZiAoIXBpbm5lZEV2ZW50cykgcmV0dXJuOyAvLyBub3RoaW5nIHRvIHJlYWRcblxuICAgICAgICBsZXQgcmVhZFN0YXRlRXZlbnRzID0gW107XG4gICAgICAgIGNvbnN0IHJlYWRQaW5zRXZlbnQgPSB0aGlzLnByb3BzLnJvb20uZ2V0QWNjb3VudERhdGEoXCJpbS52ZWN0b3Iucm9vbS5yZWFkX3BpbnNcIik7XG4gICAgICAgIGlmIChyZWFkUGluc0V2ZW50ICYmIHJlYWRQaW5zRXZlbnQuZ2V0Q29udGVudCgpKSB7XG4gICAgICAgICAgICByZWFkU3RhdGVFdmVudHMgPSByZWFkUGluc0V2ZW50LmdldENvbnRlbnQoKS5ldmVudF9pZHMgfHwgW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlYWRTdGF0ZUV2ZW50cy5pbmNsdWRlcyhwaW5uZWRFdmVudHMuZ2V0SWQoKSkpIHtcbiAgICAgICAgICAgIHJlYWRTdGF0ZUV2ZW50cy5wdXNoKHBpbm5lZEV2ZW50cy5nZXRJZCgpKTtcblxuICAgICAgICAgICAgLy8gT25seSBrZWVwIHRoZSBsYXN0IDEwIGV2ZW50IElEcyB0byBhdm9pZCBpbmZpbml0ZSBncm93dGhcbiAgICAgICAgICAgIHJlYWRTdGF0ZUV2ZW50cyA9IHJlYWRTdGF0ZUV2ZW50cy5yZXZlcnNlKCkuc3BsaWNlKDAsIDEwKS5yZXZlcnNlKCk7XG5cbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRSb29tQWNjb3VudERhdGEodGhpcy5wcm9wcy5yb29tLnJvb21JZCwgXCJpbS52ZWN0b3Iucm9vbS5yZWFkX3BpbnNcIiwge1xuICAgICAgICAgICAgICAgIGV2ZW50X2lkczogcmVhZFN0YXRlRXZlbnRzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldFBpbm5lZFRpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGlubmVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2PnsgX3QoXCJObyBwaW5uZWQgbWVzc2FnZXMuXCIpIH08L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUucGlubmVkLm1hcCgoY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICg8UGlubmVkRXZlbnRUaWxlIGtleT17Y29udGV4dC5ldmVudC5nZXRJZCgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14Um9vbT17dGhpcy5wcm9wcy5yb29tfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14RXZlbnQ9e2NvbnRleHQuZXZlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25VbnBpbm5lZD17dGhpcy5fdXBkYXRlUGlubmVkTWVzc2FnZXN9IC8+KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCB0aWxlcyA9IDxkaXY+eyBfdChcIkxvYWRpbmcuLi5cIikgfTwvZGl2PjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiYgIXRoaXMuc3RhdGUubG9hZGluZykge1xuICAgICAgICAgICAgdGlsZXMgPSB0aGlzLl9nZXRQaW5uZWRUaWxlcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUGlubmVkRXZlbnRzUGFuZWxcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Bpbm5lZEV2ZW50c1BhbmVsX2JvZHlcIj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfUGlubmVkRXZlbnRzUGFuZWxfY2FuY2VsXCIgb25DbGljaz17dGhpcy5wcm9wcy5vbkNhbmNlbENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfZmlsdGVyRmxpcENvbG9yXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwuc3ZnXCIpfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJteF9QaW5uZWRFdmVudHNQYW5lbF9oZWFkZXJcIj57IF90KFwiUGlubmVkIE1lc3NhZ2VzXCIpIH08L2gzPlxuICAgICAgICAgICAgICAgICAgICB7IHRpbGVzIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==