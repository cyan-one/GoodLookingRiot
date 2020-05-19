"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _DateUtils = require("../../../DateUtils");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

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
class MessageEditHistoryDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "loadMoreEdits", async backwards => {
      if (backwards || !this.state.nextBatch && !this.state.isLoading) {
        // bail out on backwards as we only paginate in one direction
        return false;
      }

      const opts = {
        from: this.state.nextBatch
      };
      const roomId = this.props.mxEvent.getRoomId();
      const eventId = this.props.mxEvent.getId();

      const client = _MatrixClientPeg.MatrixClientPeg.get();

      let result;
      let resolve;
      let reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });

      try {
        result = await client.relations(roomId, eventId, "m.replace", "m.room.message", opts);
      } catch (error) {
        // log if the server returned an error
        if (error.errcode) {
          console.error("fetching /relations failed with error", error);
        }

        this.setState({
          error
        }, () => reject(error));
        return promise;
      }

      const newEvents = result.events;

      this._locallyRedactEventsIfNeeded(newEvents);

      this.setState({
        originalEvent: this.state.originalEvent || result.originalEvent,
        events: this.state.events.concat(newEvents),
        nextBatch: result.nextBatch,
        isLoading: false
      }, () => {
        const hasMoreResults = !!this.state.nextBatch;
        resolve(hasMoreResults);
      });
      return promise;
    });
    this.state = {
      originalEvent: null,
      error: null,
      events: [],
      nextBatch: null,
      isLoading: true,
      isTwelveHour: _SettingsStore.default.getValue("showTwelveHourTimestamps")
    };
  }

  _locallyRedactEventsIfNeeded(newEvents) {
    const roomId = this.props.mxEvent.getRoomId();

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const room = client.getRoom(roomId);
    const pendingEvents = room.getPendingEvents();

    for (const e of newEvents) {
      const pendingRedaction = pendingEvents.find(pe => {
        return pe.getType() === "m.room.redaction" && pe.getAssociatedId() === e.getId();
      });

      if (pendingRedaction) {
        e.markLocallyRedacted(pendingRedaction);
      }
    }
  }

  componentDidMount() {
    this.loadMoreEdits();
  }

  _renderEdits() {
    const EditHistoryMessage = sdk.getComponent('messages.EditHistoryMessage');
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const nodes = [];
    let lastEvent;
    let allEvents = this.state.events; // append original event when we've done last pagination

    if (this.state.originalEvent && !this.state.nextBatch) {
      allEvents = allEvents.concat(this.state.originalEvent);
    }

    const baseEventId = this.props.mxEvent.getId();
    allEvents.forEach((e, i) => {
      if (!lastEvent || (0, _DateUtils.wantsDateSeparator)(lastEvent.getDate(), e.getDate())) {
        nodes.push( /*#__PURE__*/_react.default.createElement("li", {
          key: e.getTs() + "~"
        }, /*#__PURE__*/_react.default.createElement(DateSeparator, {
          ts: e.getTs()
        })));
      }

      const isBaseEvent = e.getId() === baseEventId;
      nodes.push( /*#__PURE__*/_react.default.createElement(EditHistoryMessage, {
        key: e.getId(),
        previousEdit: !isBaseEvent ? allEvents[i + 1] : null,
        isBaseEvent: isBaseEvent,
        mxEvent: e,
        isTwelveHour: this.state.isTwelveHour
      }));
      lastEvent = e;
    });
    return nodes;
  }

  render() {
    let content;

    if (this.state.error) {
      const {
        error
      } = this.state;

      if (error.errcode === "M_UNRECOGNIZED") {
        content = /*#__PURE__*/_react.default.createElement("p", {
          className: "mx_MessageEditHistoryDialog_error"
        }, (0, _languageHandler._t)("Your homeserver doesn't seem to support this feature."));
      } else if (error.errcode) {
        // some kind of error from the homeserver
        content = /*#__PURE__*/_react.default.createElement("p", {
          className: "mx_MessageEditHistoryDialog_error"
        }, (0, _languageHandler._t)("Something went wrong!"));
      } else {
        content = /*#__PURE__*/_react.default.createElement("p", {
          className: "mx_MessageEditHistoryDialog_error"
        }, (0, _languageHandler._t)("Cannot reach homeserver"), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Ensure you have a stable internet connection, or get in touch with the server admin"));
      }
    } else if (this.state.isLoading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      content = /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else {
      const ScrollPanel = sdk.getComponent("structures.ScrollPanel");
      content = /*#__PURE__*/_react.default.createElement(ScrollPanel, {
        className: "mx_MessageEditHistoryDialog_scrollPanel",
        onFillRequest: this.loadMoreEdits,
        stickyBottom: false,
        startAtBottom: false
      }, /*#__PURE__*/_react.default.createElement("ul", {
        className: "mx_MessageEditHistoryDialog_edits mx_MessagePanel_alwaysShowTimestamps"
      }, this._renderEdits()));
    }

    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_MessageEditHistoryDialog",
      hasCancel: true,
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Message edits")
    }, content);
  }

}

exports.default = MessageEditHistoryDialog;
(0, _defineProperty2.default)(MessageEditHistoryDialog, "propTypes", {
  mxEvent: _propTypes.default.object.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvTWVzc2FnZUVkaXRIaXN0b3J5RGlhbG9nLmpzIl0sIm5hbWVzIjpbIk1lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZyIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJiYWNrd2FyZHMiLCJzdGF0ZSIsIm5leHRCYXRjaCIsImlzTG9hZGluZyIsIm9wdHMiLCJmcm9tIiwicm9vbUlkIiwibXhFdmVudCIsImdldFJvb21JZCIsImV2ZW50SWQiLCJnZXRJZCIsImNsaWVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInJlc3VsdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiUHJvbWlzZSIsIl9yZXNvbHZlIiwiX3JlamVjdCIsInJlbGF0aW9ucyIsImVycm9yIiwiZXJyY29kZSIsImNvbnNvbGUiLCJzZXRTdGF0ZSIsIm5ld0V2ZW50cyIsImV2ZW50cyIsIl9sb2NhbGx5UmVkYWN0RXZlbnRzSWZOZWVkZWQiLCJvcmlnaW5hbEV2ZW50IiwiY29uY2F0IiwiaGFzTW9yZVJlc3VsdHMiLCJpc1R3ZWx2ZUhvdXIiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJyb29tIiwiZ2V0Um9vbSIsInBlbmRpbmdFdmVudHMiLCJnZXRQZW5kaW5nRXZlbnRzIiwiZSIsInBlbmRpbmdSZWRhY3Rpb24iLCJmaW5kIiwicGUiLCJnZXRUeXBlIiwiZ2V0QXNzb2NpYXRlZElkIiwibWFya0xvY2FsbHlSZWRhY3RlZCIsImNvbXBvbmVudERpZE1vdW50IiwibG9hZE1vcmVFZGl0cyIsIl9yZW5kZXJFZGl0cyIsIkVkaXRIaXN0b3J5TWVzc2FnZSIsInNkayIsImdldENvbXBvbmVudCIsIkRhdGVTZXBhcmF0b3IiLCJub2RlcyIsImxhc3RFdmVudCIsImFsbEV2ZW50cyIsImJhc2VFdmVudElkIiwiZm9yRWFjaCIsImkiLCJnZXREYXRlIiwicHVzaCIsImdldFRzIiwiaXNCYXNlRXZlbnQiLCJyZW5kZXIiLCJjb250ZW50IiwiU3Bpbm5lciIsIlNjcm9sbFBhbmVsIiwiQmFzZURpYWxvZyIsIm9uRmluaXNoZWQiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JlLE1BQU1BLHdCQUFOLFNBQXVDQyxlQUFNQyxhQUE3QyxDQUEyRDtBQUt0RUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUseURBWUgsTUFBT0MsU0FBUCxJQUFxQjtBQUNqQyxVQUFJQSxTQUFTLElBQUssQ0FBQyxLQUFLQyxLQUFMLENBQVdDLFNBQVosSUFBeUIsQ0FBQyxLQUFLRCxLQUFMLENBQVdFLFNBQXZELEVBQW1FO0FBQy9EO0FBQ0EsZUFBTyxLQUFQO0FBQ0g7O0FBQ0QsWUFBTUMsSUFBSSxHQUFHO0FBQUNDLFFBQUFBLElBQUksRUFBRSxLQUFLSixLQUFMLENBQVdDO0FBQWxCLE9BQWI7QUFDQSxZQUFNSSxNQUFNLEdBQUcsS0FBS1AsS0FBTCxDQUFXUSxPQUFYLENBQW1CQyxTQUFuQixFQUFmO0FBQ0EsWUFBTUMsT0FBTyxHQUFHLEtBQUtWLEtBQUwsQ0FBV1EsT0FBWCxDQUFtQkcsS0FBbkIsRUFBaEI7O0FBQ0EsWUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsVUFBSUMsTUFBSjtBQUNBLFVBQUlDLE9BQUo7QUFDQSxVQUFJQyxNQUFKO0FBQ0EsWUFBTUMsT0FBTyxHQUFHLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxRQUFELEVBQVdDLE9BQVgsS0FBdUI7QUFBQ0wsUUFBQUEsT0FBTyxHQUFHSSxRQUFWO0FBQW9CSCxRQUFBQSxNQUFNLEdBQUdJLE9BQVQ7QUFBa0IsT0FBMUUsQ0FBaEI7O0FBQ0EsVUFBSTtBQUNBTixRQUFBQSxNQUFN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QUlQLFFBQUEsYUFBYSxFQUFFO0FBSlIsc0JBTVA7QUFBSSxRQUFBLFNBQVMsRUFBQztBQUFkLFNBQXdGLEtBQUtDLFlBQUwsRUFBeEYsQ0FOTyxDQUFYO0FBUUg7O0FBQ0QsVUFBTW1CLFVBQVUsR0FBR2pCLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7QUFDQSx3QkFDSSw2QkFBQyxVQUFEO0FBQVksTUFBQSxTQUFTLEVBQUMsNkJBQXRCO0FBQW9ELE1BQUEsU0FBUyxFQUFFLElBQS9EO0FBQ1ksTUFBQSxVQUFVLEVBQUUsS0FBS3BELEtBQUwsQ0FBV3FFLFVBRG5DO0FBQytDLE1BQUEsS0FBSyxFQUFFLHlCQUFHLGVBQUg7QUFEdEQsT0FFS0osT0FGTCxDQURKO0FBTUg7O0FBakpxRTs7OzhCQUFyRHJFLHdCLGVBQ0U7QUFDZlksRUFBQUEsT0FBTyxFQUFFOEQsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRFgsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7d2FudHNEYXRlU2VwYXJhdG9yfSBmcm9tICcuLi8uLi8uLi9EYXRlVXRpbHMnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSAnLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgZXZlbnRzOiBbXSxcbiAgICAgICAgICAgIG5leHRCYXRjaDogbnVsbCxcbiAgICAgICAgICAgIGlzTG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIGlzVHdlbHZlSG91cjogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dUd2VsdmVIb3VyVGltZXN0YW1wc1wiKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBsb2FkTW9yZUVkaXRzID0gYXN5bmMgKGJhY2t3YXJkcykgPT4ge1xuICAgICAgICBpZiAoYmFja3dhcmRzIHx8ICghdGhpcy5zdGF0ZS5uZXh0QmF0Y2ggJiYgIXRoaXMuc3RhdGUuaXNMb2FkaW5nKSkge1xuICAgICAgICAgICAgLy8gYmFpbCBvdXQgb24gYmFja3dhcmRzIGFzIHdlIG9ubHkgcGFnaW5hdGUgaW4gb25lIGRpcmVjdGlvblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7ZnJvbTogdGhpcy5zdGF0ZS5uZXh0QmF0Y2h9O1xuICAgICAgICBjb25zdCByb29tSWQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Um9vbUlkKCk7XG4gICAgICAgIGNvbnN0IGV2ZW50SWQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKTtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBsZXQgcmVzb2x2ZTtcbiAgICAgICAgbGV0IHJlamVjdDtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSwgX3JlamVjdCkgPT4ge3Jlc29sdmUgPSBfcmVzb2x2ZTsgcmVqZWN0ID0gX3JlamVjdDt9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGNsaWVudC5yZWxhdGlvbnMoXG4gICAgICAgICAgICAgICAgcm9vbUlkLCBldmVudElkLCBcIm0ucmVwbGFjZVwiLCBcIm0ucm9vbS5tZXNzYWdlXCIsIG9wdHMpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gbG9nIGlmIHRoZSBzZXJ2ZXIgcmV0dXJuZWQgYW4gZXJyb3JcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJjb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImZldGNoaW5nIC9yZWxhdGlvbnMgZmFpbGVkIHdpdGggZXJyb3JcIiwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZXJyb3J9LCAoKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3RXZlbnRzID0gcmVzdWx0LmV2ZW50cztcbiAgICAgICAgdGhpcy5fbG9jYWxseVJlZGFjdEV2ZW50c0lmTmVlZGVkKG5ld0V2ZW50cyk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogdGhpcy5zdGF0ZS5vcmlnaW5hbEV2ZW50IHx8IHJlc3VsdC5vcmlnaW5hbEV2ZW50LFxuICAgICAgICAgICAgZXZlbnRzOiB0aGlzLnN0YXRlLmV2ZW50cy5jb25jYXQobmV3RXZlbnRzKSxcbiAgICAgICAgICAgIG5leHRCYXRjaDogcmVzdWx0Lm5leHRCYXRjaCxcbiAgICAgICAgICAgIGlzTG9hZGluZzogZmFsc2UsXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc01vcmVSZXN1bHRzID0gISF0aGlzLnN0YXRlLm5leHRCYXRjaDtcbiAgICAgICAgICAgIHJlc29sdmUoaGFzTW9yZVJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgX2xvY2FsbHlSZWRhY3RFdmVudHNJZk5lZWRlZChuZXdFdmVudHMpIHtcbiAgICAgICAgY29uc3Qgcm9vbUlkID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpO1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyb29tSWQpO1xuICAgICAgICBjb25zdCBwZW5kaW5nRXZlbnRzID0gcm9vbS5nZXRQZW5kaW5nRXZlbnRzKCk7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiBuZXdFdmVudHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBlbmRpbmdSZWRhY3Rpb24gPSBwZW5kaW5nRXZlbnRzLmZpbmQocGUgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwZS5nZXRUeXBlKCkgPT09IFwibS5yb29tLnJlZGFjdGlvblwiICYmIHBlLmdldEFzc29jaWF0ZWRJZCgpID09PSBlLmdldElkKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nUmVkYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgZS5tYXJrTG9jYWxseVJlZGFjdGVkKHBlbmRpbmdSZWRhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMubG9hZE1vcmVFZGl0cygpO1xuICAgIH1cblxuICAgIF9yZW5kZXJFZGl0cygpIHtcbiAgICAgICAgY29uc3QgRWRpdEhpc3RvcnlNZXNzYWdlID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuRWRpdEhpc3RvcnlNZXNzYWdlJyk7XG4gICAgICAgIGNvbnN0IERhdGVTZXBhcmF0b3IgPSBzZGsuZ2V0Q29tcG9uZW50KCdtZXNzYWdlcy5EYXRlU2VwYXJhdG9yJyk7XG4gICAgICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgICAgIGxldCBsYXN0RXZlbnQ7XG4gICAgICAgIGxldCBhbGxFdmVudHMgPSB0aGlzLnN0YXRlLmV2ZW50cztcbiAgICAgICAgLy8gYXBwZW5kIG9yaWdpbmFsIGV2ZW50IHdoZW4gd2UndmUgZG9uZSBsYXN0IHBhZ2luYXRpb25cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUub3JpZ2luYWxFdmVudCAmJiAhdGhpcy5zdGF0ZS5uZXh0QmF0Y2gpIHtcbiAgICAgICAgICAgIGFsbEV2ZW50cyA9IGFsbEV2ZW50cy5jb25jYXQodGhpcy5zdGF0ZS5vcmlnaW5hbEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiYXNlRXZlbnRJZCA9IHRoaXMucHJvcHMubXhFdmVudC5nZXRJZCgpO1xuICAgICAgICBhbGxFdmVudHMuZm9yRWFjaCgoZSwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFsYXN0RXZlbnQgfHwgd2FudHNEYXRlU2VwYXJhdG9yKGxhc3RFdmVudC5nZXREYXRlKCksIGUuZ2V0RGF0ZSgpKSkge1xuICAgICAgICAgICAgICAgIG5vZGVzLnB1c2goPGxpIGtleT17ZS5nZXRUcygpICsgXCJ+XCJ9PjxEYXRlU2VwYXJhdG9yIHRzPXtlLmdldFRzKCl9IC8+PC9saT4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXNCYXNlRXZlbnQgPSBlLmdldElkKCkgPT09IGJhc2VFdmVudElkO1xuICAgICAgICAgICAgbm9kZXMucHVzaCgoXG4gICAgICAgICAgICAgICAgPEVkaXRIaXN0b3J5TWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICBrZXk9e2UuZ2V0SWQoKX1cbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNFZGl0PXshaXNCYXNlRXZlbnQgPyBhbGxFdmVudHNbaSArIDFdIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgaXNCYXNlRXZlbnQ9e2lzQmFzZUV2ZW50fVxuICAgICAgICAgICAgICAgICAgICBteEV2ZW50PXtlfVxuICAgICAgICAgICAgICAgICAgICBpc1R3ZWx2ZUhvdXI9e3RoaXMuc3RhdGUuaXNUd2VsdmVIb3VyfVxuICAgICAgICAgICAgICAgIC8+KSk7XG4gICAgICAgICAgICBsYXN0RXZlbnQgPSBlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGNvbnRlbnQ7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCB7ZXJyb3J9ID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJjb2RlID09PSBcIk1fVU5SRUNPR05JWkVEXCIpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gKDxwIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZ19lcnJvclwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJZb3VyIGhvbWVzZXJ2ZXIgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhpcyBmZWF0dXJlLlwiKX1cbiAgICAgICAgICAgICAgICA8L3A+KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IuZXJyY29kZSkge1xuICAgICAgICAgICAgICAgIC8vIHNvbWUga2luZCBvZiBlcnJvciBmcm9tIHRoZSBob21lc2VydmVyXG4gICAgICAgICAgICAgICAgY29udGVudCA9ICg8cCBjbGFzc05hbWU9XCJteF9NZXNzYWdlRWRpdEhpc3RvcnlEaWFsb2dfZXJyb3JcIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiU29tZXRoaW5nIHdlbnQgd3JvbmchXCIpfVxuICAgICAgICAgICAgICAgIDwvcD4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gKDxwIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZ19lcnJvclwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJDYW5ub3QgcmVhY2ggaG9tZXNlcnZlclwiKX1cbiAgICAgICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkVuc3VyZSB5b3UgaGF2ZSBhIHN0YWJsZSBpbnRlcm5ldCBjb25uZWN0aW9uLCBvciBnZXQgaW4gdG91Y2ggd2l0aCB0aGUgc2VydmVyIGFkbWluXCIpfVxuICAgICAgICAgICAgICAgIDwvcD4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICBjb250ZW50ID0gPFNwaW5uZXIgLz47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBTY3JvbGxQYW5lbCA9IHNkay5nZXRDb21wb25lbnQoXCJzdHJ1Y3R1cmVzLlNjcm9sbFBhbmVsXCIpO1xuICAgICAgICAgICAgY29udGVudCA9ICg8U2Nyb2xsUGFuZWxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9NZXNzYWdlRWRpdEhpc3RvcnlEaWFsb2dfc2Nyb2xsUGFuZWxcIlxuICAgICAgICAgICAgICAgIG9uRmlsbFJlcXVlc3Q9eyB0aGlzLmxvYWRNb3JlRWRpdHMgfVxuICAgICAgICAgICAgICAgIHN0aWNreUJvdHRvbT17ZmFsc2V9XG4gICAgICAgICAgICAgICAgc3RhcnRBdEJvdHRvbT17ZmFsc2V9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm14X01lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZ19lZGl0cyBteF9NZXNzYWdlUGFuZWxfYWx3YXlzU2hvd1RpbWVzdGFtcHNcIj57dGhpcy5fcmVuZGVyRWRpdHMoKX08L3VsPlxuICAgICAgICAgICAgPC9TY3JvbGxQYW5lbD4pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT0nbXhfTWVzc2FnZUVkaXRIaXN0b3J5RGlhbG9nJyBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9IHRpdGxlPXtfdChcIk1lc3NhZ2UgZWRpdHNcIil9PlxuICAgICAgICAgICAgICAgIHtjb250ZW50fVxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==