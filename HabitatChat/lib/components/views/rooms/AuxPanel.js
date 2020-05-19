"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var ObjectUtils = _interopRequireWildcard(require("../../../ObjectUtils"));

var _AppsDrawer = _interopRequireDefault(require("./AppsDrawer"));

var _languageHandler = require("../../../languageHandler");

var _classnames = _interopRequireDefault(require("classnames"));

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _AutoHideScrollbar = _interopRequireDefault(require("../../structures/AutoHideScrollbar"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd

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
  displayName: 'AuxPanel',
  propTypes: {
    // js-sdk room object
    room: _propTypes.default.object.isRequired,
    userId: _propTypes.default.string.isRequired,
    showApps: _propTypes.default.bool,
    // Render apps
    hideAppsDrawer: _propTypes.default.bool,
    // Do not display apps drawer and content (may still be rendered)
    // Conference Handler implementation
    conferenceHandler: _propTypes.default.object,
    // set to true to show the file drop target
    draggingFile: _propTypes.default.bool,
    // set to true to show the 'active conf call' banner
    displayConfCallNotification: _propTypes.default.bool,
    // maxHeight attribute for the aux panel and the video
    // therein
    maxHeight: _propTypes.default.number,
    // a callback which is called when the content of the aux panel changes
    // content in a way that is likely to make it change size.
    onResize: _propTypes.default.func,
    fullHeight: _propTypes.default.bool
  },
  getDefaultProps: () => ({
    showApps: true,
    hideAppsDrawer: false
  }),
  getInitialState: function () {
    return {
      counters: this._computeCounters()
    };
  },
  componentDidMount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.on("RoomState.events", this._rateLimitedUpdate);
  },
  componentWillUnmount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener("RoomState.events", this._rateLimitedUpdate);
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return !ObjectUtils.shallowEqual(this.props, nextProps) || !ObjectUtils.shallowEqual(this.state, nextState);
  },
  componentDidUpdate: function (prevProps, prevState) {
    // most changes are likely to cause a resize
    if (this.props.onResize) {
      this.props.onResize();
    }
  },
  onConferenceNotificationClick: function (ev, type) {
    _dispatcher.default.dispatch({
      action: 'place_call',
      type: type,
      room_id: this.props.room.roomId
    });

    ev.stopPropagation();
    ev.preventDefault();
  },
  _rateLimitedUpdate: new _ratelimitedfunc.default(function () {
    if (_SettingsStore.default.isFeatureEnabled("feature_state_counters")) {
      this.setState({
        counters: this._computeCounters()
      });
    }
  }, 500),
  _computeCounters: function () {
    let counters = [];

    if (this.props.room && _SettingsStore.default.isFeatureEnabled("feature_state_counters")) {
      const stateEvs = this.props.room.currentState.getStateEvents('re.jki.counter');
      stateEvs.sort((a, b) => {
        return a.getStateKey() < b.getStateKey();
      });
      stateEvs.forEach((ev, idx) => {
        const title = ev.getContent().title;
        const value = ev.getContent().value;
        const link = ev.getContent().link;
        const severity = ev.getContent().severity || "normal";
        const stateKey = ev.getStateKey(); // We want a non-empty title but can accept falsey values (e.g.
        // zero)

        if (title && value !== undefined) {
          counters.push({
            "title": title,
            "value": value,
            "link": link,
            "severity": severity,
            "stateKey": stateKey
          });
        }
      });
    }

    return counters;
  },
  render: function () {
    const CallView = sdk.getComponent("voip.CallView");
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    let fileDropTarget = null;

    if (this.props.draggingFile) {
      fileDropTarget = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_fileDropTarget"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_fileDropTargetLabel",
        title: (0, _languageHandler._t)("Drop File Here")
      }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
        src: require("../../../../res/img/upload-big.svg"),
        width: "45",
        height: "59"
      }), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Drop file here to upload")));
    }

    let conferenceCallNotification = null;

    if (this.props.displayConfCallNotification) {
      let supportedText = '';
      let joinNode;

      if (!_MatrixClientPeg.MatrixClientPeg.get().supportsVoip()) {
        supportedText = (0, _languageHandler._t)(" (unsupported)");
      } else {
        joinNode = /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Join as <voiceText>voice</voiceText> or <videoText>video</videoText>.", {}, {
          'voiceText': sub => /*#__PURE__*/_react.default.createElement("a", {
            onClick: event => {
              this.onConferenceNotificationClick(event, 'voice');
            },
            href: "#"
          }, sub),
          'videoText': sub => /*#__PURE__*/_react.default.createElement("a", {
            onClick: event => {
              this.onConferenceNotificationClick(event, 'video');
            },
            href: "#"
          }, sub)
        }));
      } // XXX: the translation here isn't great: appending ' (unsupported)' is likely to not make sense in many languages,
      // but there are translations for this in the languages we do have so I'm leaving it for now.


      conferenceCallNotification = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomView_ongoingConfCallNotification"
      }, (0, _languageHandler._t)("Ongoing conference call%(supportedText)s.", {
        supportedText: supportedText
      }), "\xA0", joinNode);
    }

    const callView = /*#__PURE__*/_react.default.createElement(CallView, {
      room: this.props.room,
      ConferenceHandler: this.props.conferenceHandler,
      onResize: this.props.onResize,
      maxVideoHeight: this.props.maxHeight
    });

    const appsDrawer = /*#__PURE__*/_react.default.createElement(_AppsDrawer.default, {
      room: this.props.room,
      userId: this.props.userId,
      maxHeight: this.props.maxHeight,
      showApps: this.props.showApps,
      hide: this.props.hideAppsDrawer
    });

    let stateViews = null;

    if (this.state.counters && _SettingsStore.default.isFeatureEnabled("feature_state_counters")) {
      let counters = [];
      this.state.counters.forEach((counter, idx) => {
        const title = counter.title;
        const value = counter.value;
        const link = counter.link;
        const severity = counter.severity;
        const stateKey = counter.stateKey;

        let span = /*#__PURE__*/_react.default.createElement("span", null, title, ": ", value);

        if (link) {
          span = /*#__PURE__*/_react.default.createElement("a", {
            href: link,
            target: "_blank",
            rel: "noreferrer noopener"
          }, span);
        }

        span = /*#__PURE__*/_react.default.createElement("span", {
          className: "m_RoomView_auxPanel_stateViews_span",
          "data-severity": severity,
          key: "x-" + stateKey
        }, span);
        counters.push(span);
        counters.push( /*#__PURE__*/_react.default.createElement("span", {
          className: "m_RoomView_auxPanel_stateViews_delim",
          key: "delim" + idx
        }, " \u2500 "));
      });

      if (counters.length > 0) {
        counters.pop(); // remove last deliminator

        stateViews = /*#__PURE__*/_react.default.createElement("div", {
          className: "m_RoomView_auxPanel_stateViews"
        }, counters);
      }
    }

    const classes = (0, _classnames.default)({
      "mx_RoomView_auxPanel": true,
      "mx_RoomView_auxPanel_fullHeight": this.props.fullHeight
    });
    const style = {};

    if (!this.props.fullHeight) {
      style.maxHeight = this.props.maxHeight;
    }

    return /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
      className: classes,
      style: style
    }, stateViews, appsDrawer, fileDropTarget, callView, conferenceCallNotification, this.props.children);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0F1eFBhbmVsLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJ1c2VySWQiLCJzdHJpbmciLCJzaG93QXBwcyIsImJvb2wiLCJoaWRlQXBwc0RyYXdlciIsImNvbmZlcmVuY2VIYW5kbGVyIiwiZHJhZ2dpbmdGaWxlIiwiZGlzcGxheUNvbmZDYWxsTm90aWZpY2F0aW9uIiwibWF4SGVpZ2h0IiwibnVtYmVyIiwib25SZXNpemUiLCJmdW5jIiwiZnVsbEhlaWdodCIsImdldERlZmF1bHRQcm9wcyIsImdldEluaXRpYWxTdGF0ZSIsImNvdW50ZXJzIiwiX2NvbXB1dGVDb3VudGVycyIsImNvbXBvbmVudERpZE1vdW50IiwiY2xpIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwib24iLCJfcmF0ZUxpbWl0ZWRVcGRhdGUiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwibmV4dFByb3BzIiwibmV4dFN0YXRlIiwiT2JqZWN0VXRpbHMiLCJzaGFsbG93RXF1YWwiLCJwcm9wcyIsInN0YXRlIiwiY29tcG9uZW50RGlkVXBkYXRlIiwicHJldlByb3BzIiwicHJldlN0YXRlIiwib25Db25mZXJlbmNlTm90aWZpY2F0aW9uQ2xpY2siLCJldiIsInR5cGUiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInJvb21faWQiLCJyb29tSWQiLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsIlJhdGVMaW1pdGVkRnVuYyIsIlNldHRpbmdzU3RvcmUiLCJpc0ZlYXR1cmVFbmFibGVkIiwic2V0U3RhdGUiLCJzdGF0ZUV2cyIsImN1cnJlbnRTdGF0ZSIsImdldFN0YXRlRXZlbnRzIiwic29ydCIsImEiLCJiIiwiZ2V0U3RhdGVLZXkiLCJmb3JFYWNoIiwiaWR4IiwidGl0bGUiLCJnZXRDb250ZW50IiwidmFsdWUiLCJsaW5rIiwic2V2ZXJpdHkiLCJzdGF0ZUtleSIsInVuZGVmaW5lZCIsInB1c2giLCJyZW5kZXIiLCJDYWxsVmlldyIsInNkayIsImdldENvbXBvbmVudCIsIlRpbnRhYmxlU3ZnIiwiZmlsZURyb3BUYXJnZXQiLCJyZXF1aXJlIiwiY29uZmVyZW5jZUNhbGxOb3RpZmljYXRpb24iLCJzdXBwb3J0ZWRUZXh0Iiwiam9pbk5vZGUiLCJzdXBwb3J0c1ZvaXAiLCJzdWIiLCJldmVudCIsImNhbGxWaWV3IiwiYXBwc0RyYXdlciIsInN0YXRlVmlld3MiLCJjb3VudGVyIiwic3BhbiIsImxlbmd0aCIsInBvcCIsImNsYXNzZXMiLCJzdHlsZSIsImNoaWxkcmVuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFnQ2UsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsVUFEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1A7QUFDQUMsSUFBQUEsSUFBSSxFQUFFQyxtQkFBVUMsTUFBVixDQUFpQkMsVUFGaEI7QUFHUEMsSUFBQUEsTUFBTSxFQUFFSCxtQkFBVUksTUFBVixDQUFpQkYsVUFIbEI7QUFJUEcsSUFBQUEsUUFBUSxFQUFFTCxtQkFBVU0sSUFKYjtBQUltQjtBQUMxQkMsSUFBQUEsY0FBYyxFQUFFUCxtQkFBVU0sSUFMbkI7QUFLeUI7QUFFaEM7QUFDQUUsSUFBQUEsaUJBQWlCLEVBQUVSLG1CQUFVQyxNQVJ0QjtBQVVQO0FBQ0FRLElBQUFBLFlBQVksRUFBRVQsbUJBQVVNLElBWGpCO0FBYVA7QUFDQUksSUFBQUEsMkJBQTJCLEVBQUVWLG1CQUFVTSxJQWRoQztBQWdCUDtBQUNBO0FBQ0FLLElBQUFBLFNBQVMsRUFBRVgsbUJB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dEIsU0FBN0I7QUFDSDs7QUFFRCx3QkFDSSw2QkFBQywwQkFBRDtBQUFtQixNQUFBLFNBQVMsRUFBRThFLE9BQTlCO0FBQXVDLE1BQUEsS0FBSyxFQUFFQztBQUE5QyxPQUNNTixVQUROLEVBRU1ELFVBRk4sRUFHTVQsY0FITixFQUlNUSxRQUpOLEVBS01OLDBCQUxOLEVBTU0sS0FBSzNDLEtBQUwsQ0FBVzBELFFBTmpCLENBREo7QUFVSDtBQXBQMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0ICogYXMgT2JqZWN0VXRpbHMgZnJvbSAnLi4vLi4vLi4vT2JqZWN0VXRpbHMnO1xuaW1wb3J0IEFwcHNEcmF3ZXIgZnJvbSAnLi9BcHBzRHJhd2VyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IFJhdGVMaW1pdGVkRnVuYyBmcm9tICcuLi8uLi8uLi9yYXRlbGltaXRlZGZ1bmMnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBBdXRvSGlkZVNjcm9sbGJhciBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9BdXRvSGlkZVNjcm9sbGJhclwiO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQXV4UGFuZWwnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIGpzLXNkayByb29tIG9iamVjdFxuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBzaG93QXBwczogUHJvcFR5cGVzLmJvb2wsIC8vIFJlbmRlciBhcHBzXG4gICAgICAgIGhpZGVBcHBzRHJhd2VyOiBQcm9wVHlwZXMuYm9vbCwgLy8gRG8gbm90IGRpc3BsYXkgYXBwcyBkcmF3ZXIgYW5kIGNvbnRlbnQgKG1heSBzdGlsbCBiZSByZW5kZXJlZClcblxuICAgICAgICAvLyBDb25mZXJlbmNlIEhhbmRsZXIgaW1wbGVtZW50YXRpb25cbiAgICAgICAgY29uZmVyZW5jZUhhbmRsZXI6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLy8gc2V0IHRvIHRydWUgdG8gc2hvdyB0aGUgZmlsZSBkcm9wIHRhcmdldFxuICAgICAgICBkcmFnZ2luZ0ZpbGU6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8vIHNldCB0byB0cnVlIHRvIHNob3cgdGhlICdhY3RpdmUgY29uZiBjYWxsJyBiYW5uZXJcbiAgICAgICAgZGlzcGxheUNvbmZDYWxsTm90aWZpY2F0aW9uOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBtYXhIZWlnaHQgYXR0cmlidXRlIGZvciB0aGUgYXV4IHBhbmVsIGFuZCB0aGUgdmlkZW9cbiAgICAgICAgLy8gdGhlcmVpblxuICAgICAgICBtYXhIZWlnaHQ6IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgICAgICAgLy8gYSBjYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBvZiB0aGUgYXV4IHBhbmVsIGNoYW5nZXNcbiAgICAgICAgLy8gY29udGVudCBpbiBhIHdheSB0aGF0IGlzIGxpa2VseSB0byBtYWtlIGl0IGNoYW5nZSBzaXplLlxuICAgICAgICBvblJlc2l6ZTogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIGZ1bGxIZWlnaHQ6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6ICgpID0+ICh7XG4gICAgICAgIHNob3dBcHBzOiB0cnVlLFxuICAgICAgICBoaWRlQXBwc0RyYXdlcjogZmFsc2UsXG4gICAgfSksXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4geyBjb3VudGVyczogdGhpcy5fY29tcHV0ZUNvdW50ZXJzKCkgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNsaS5vbihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5fcmF0ZUxpbWl0ZWRVcGRhdGUpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaSkge1xuICAgICAgICAgICAgY2xpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLl9yYXRlTGltaXRlZFVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gKCFPYmplY3RVdGlscy5zaGFsbG93RXF1YWwodGhpcy5wcm9wcywgbmV4dFByb3BzKSB8fFxuICAgICAgICAgICAgICAgICFPYmplY3RVdGlscy5zaGFsbG93RXF1YWwodGhpcy5zdGF0ZSwgbmV4dFN0YXRlKSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgLy8gbW9zdCBjaGFuZ2VzIGFyZSBsaWtlbHkgdG8gY2F1c2UgYSByZXNpemVcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25SZXNpemUpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25SZXNpemUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkNvbmZlcmVuY2VOb3RpZmljYXRpb25DbGljazogZnVuY3Rpb24oZXYsIHR5cGUpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3BsYWNlX2NhbGwnLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHJvb21faWQ6IHRoaXMucHJvcHMucm9vbS5yb29tSWQsXG4gICAgICAgIH0pO1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICB9LFxuXG4gICAgX3JhdGVMaW1pdGVkVXBkYXRlOiBuZXcgUmF0ZUxpbWl0ZWRGdW5jKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKFwiZmVhdHVyZV9zdGF0ZV9jb3VudGVyc1wiKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y291bnRlcnM6IHRoaXMuX2NvbXB1dGVDb3VudGVycygpfSk7XG4gICAgICAgIH1cbiAgICB9LCA1MDApLFxuXG4gICAgX2NvbXB1dGVDb3VudGVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBjb3VudGVycyA9IFtdO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJvb20gJiYgU2V0dGluZ3NTdG9yZS5pc0ZlYXR1cmVFbmFibGVkKFwiZmVhdHVyZV9zdGF0ZV9jb3VudGVyc1wiKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGVFdnMgPSB0aGlzLnByb3BzLnJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdyZS5qa2kuY291bnRlcicpO1xuICAgICAgICAgICAgc3RhdGVFdnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmdldFN0YXRlS2V5KCkgPCBiLmdldFN0YXRlS2V5KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc3RhdGVFdnMuZm9yRWFjaCgoZXYsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gZXYuZ2V0Q29udGVudCgpLnRpdGxlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXYuZ2V0Q29udGVudCgpLnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBldi5nZXRDb250ZW50KCkubGluaztcbiAgICAgICAgICAgICAgICBjb25zdCBzZXZlcml0eSA9IGV2LmdldENvbnRlbnQoKS5zZXZlcml0eSB8fCBcIm5vcm1hbFwiO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRlS2V5ID0gZXYuZ2V0U3RhdGVLZXkoKTtcblxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgYSBub24tZW1wdHkgdGl0bGUgYnV0IGNhbiBhY2NlcHQgZmFsc2V5IHZhbHVlcyAoZS5nLlxuICAgICAgICAgICAgICAgIC8vIHplcm8pXG4gICAgICAgICAgICAgICAgaWYgKHRpdGxlICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInRpdGxlXCI6IHRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGlua1wiOiBsaW5rLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZXZlcml0eVwiOiBzZXZlcml0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RhdGVLZXlcIjogc3RhdGVLZXlcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb3VudGVycztcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgQ2FsbFZpZXcgPSBzZGsuZ2V0Q29tcG9uZW50KFwidm9pcC5DYWxsVmlld1wiKTtcbiAgICAgICAgY29uc3QgVGludGFibGVTdmcgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVGludGFibGVTdmdcIik7XG5cbiAgICAgICAgbGV0IGZpbGVEcm9wVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZHJhZ2dpbmdGaWxlKSB7XG4gICAgICAgICAgICBmaWxlRHJvcFRhcmdldCA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21WaWV3X2ZpbGVEcm9wVGFyZ2V0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbVZpZXdfZmlsZURyb3BUYXJnZXRMYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KFwiRHJvcCBGaWxlIEhlcmVcIil9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRpbnRhYmxlU3ZnIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvdXBsb2FkLWJpZy5zdmdcIil9IHdpZHRoPVwiNDVcIiBoZWlnaHQ9XCI1OVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJEcm9wIGZpbGUgaGVyZSB0byB1cGxvYWRcIikgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29uZmVyZW5jZUNhbGxOb3RpZmljYXRpb24gPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5kaXNwbGF5Q29uZkNhbGxOb3RpZmljYXRpb24pIHtcbiAgICAgICAgICAgIGxldCBzdXBwb3J0ZWRUZXh0ID0gJyc7XG4gICAgICAgICAgICBsZXQgam9pbk5vZGU7XG4gICAgICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKS5zdXBwb3J0c1ZvaXAoKSkge1xuICAgICAgICAgICAgICAgIHN1cHBvcnRlZFRleHQgPSBfdChcIiAodW5zdXBwb3J0ZWQpXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBqb2luTm9kZSA9ICg8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSm9pbiBhcyA8dm9pY2VUZXh0PnZvaWNlPC92b2ljZVRleHQ+IG9yIDx2aWRlb1RleHQ+dmlkZW88L3ZpZGVvVGV4dD4uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndm9pY2VUZXh0JzogKHN1YikgPT4gPGEgb25DbGljaz17KGV2ZW50KT0+eyB0aGlzLm9uQ29uZmVyZW5jZU5vdGlmaWNhdGlvbkNsaWNrKGV2ZW50LCAndm9pY2UnKTt9fSBocmVmPVwiI1wiPnsgc3ViIH08L2E+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2aWRlb1RleHQnOiAoc3ViKSA9PiA8YSBvbkNsaWNrPXsoZXZlbnQpPT57IHRoaXMub25Db25mZXJlbmNlTm90aWZpY2F0aW9uQ2xpY2soZXZlbnQsICd2aWRlbycpO319IGhyZWY9XCIjXCI+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICApIH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFhYWDogdGhlIHRyYW5zbGF0aW9uIGhlcmUgaXNuJ3QgZ3JlYXQ6IGFwcGVuZGluZyAnICh1bnN1cHBvcnRlZCknIGlzIGxpa2VseSB0byBub3QgbWFrZSBzZW5zZSBpbiBtYW55IGxhbmd1YWdlcyxcbiAgICAgICAgICAgIC8vIGJ1dCB0aGVyZSBhcmUgdHJhbnNsYXRpb25zIGZvciB0aGlzIGluIHRoZSBsYW5ndWFnZXMgd2UgZG8gaGF2ZSBzbyBJJ20gbGVhdmluZyBpdCBmb3Igbm93LlxuICAgICAgICAgICAgY29uZmVyZW5jZUNhbGxOb3RpZmljYXRpb24gPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tVmlld19vbmdvaW5nQ29uZkNhbGxOb3RpZmljYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIk9uZ29pbmcgY29uZmVyZW5jZSBjYWxsJShzdXBwb3J0ZWRUZXh0KXMuXCIsIHtzdXBwb3J0ZWRUZXh0OiBzdXBwb3J0ZWRUZXh0fSkgfVxuICAgICAgICAgICAgICAgICAgICAmbmJzcDtcbiAgICAgICAgICAgICAgICAgICAgeyBqb2luTm9kZSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FsbFZpZXcgPSAoXG4gICAgICAgICAgICA8Q2FsbFZpZXdcbiAgICAgICAgICAgICAgICByb29tPXt0aGlzLnByb3BzLnJvb219XG4gICAgICAgICAgICAgICAgQ29uZmVyZW5jZUhhbmRsZXI9e3RoaXMucHJvcHMuY29uZmVyZW5jZUhhbmRsZXJ9XG4gICAgICAgICAgICAgICAgb25SZXNpemU9e3RoaXMucHJvcHMub25SZXNpemV9XG4gICAgICAgICAgICAgICAgbWF4VmlkZW9IZWlnaHQ9e3RoaXMucHJvcHMubWF4SGVpZ2h0fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBhcHBzRHJhd2VyID0gPEFwcHNEcmF3ZXJcbiAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgIHVzZXJJZD17dGhpcy5wcm9wcy51c2VySWR9XG4gICAgICAgICAgICBtYXhIZWlnaHQ9e3RoaXMucHJvcHMubWF4SGVpZ2h0fVxuICAgICAgICAgICAgc2hvd0FwcHM9e3RoaXMucHJvcHMuc2hvd0FwcHN9XG4gICAgICAgICAgICBoaWRlPXt0aGlzLnByb3BzLmhpZGVBcHBzRHJhd2VyfVxuICAgICAgICAvPjtcblxuICAgICAgICBsZXQgc3RhdGVWaWV3cyA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvdW50ZXJzICYmIFNldHRpbmdzU3RvcmUuaXNGZWF0dXJlRW5hYmxlZChcImZlYXR1cmVfc3RhdGVfY291bnRlcnNcIikpIHtcbiAgICAgICAgICAgIGxldCBjb3VudGVycyA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNvdW50ZXJzLmZvckVhY2goKGNvdW50ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gY291bnRlci50aXRsZTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNvdW50ZXIudmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluayA9IGNvdW50ZXIubGluaztcbiAgICAgICAgICAgICAgICBjb25zdCBzZXZlcml0eSA9IGNvdW50ZXIuc2V2ZXJpdHk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGVLZXkgPSBjb3VudGVyLnN0YXRlS2V5O1xuXG4gICAgICAgICAgICAgICAgbGV0IHNwYW4gPSA8c3Bhbj57IHRpdGxlIH06IHsgdmFsdWUgfTwvc3Bhbj5cblxuICAgICAgICAgICAgICAgIGlmIChsaW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwYW4gPSAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXtsaW5rfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzcGFuIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzcGFuID0gKFxuICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibV9Sb29tVmlld19hdXhQYW5lbF9zdGF0ZVZpZXdzX3NwYW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1zZXZlcml0eT17c2V2ZXJpdHl9XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9eyBcIngtXCIgKyBzdGF0ZUtleSB9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzcGFufVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvdW50ZXJzLnB1c2goc3Bhbik7XG4gICAgICAgICAgICAgICAgY291bnRlcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1fUm9vbVZpZXdfYXV4UGFuZWxfc3RhdGVWaWV3c19kZWxpbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e1wiZGVsaW1cIiArIGlkeH1cbiAgICAgICAgICAgICAgICAgICAgPiDilIAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGNvdW50ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb3VudGVycy5wb3AoKTsgLy8gcmVtb3ZlIGxhc3QgZGVsaW1pbmF0b3JcbiAgICAgICAgICAgICAgICBzdGF0ZVZpZXdzID0gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1fUm9vbVZpZXdfYXV4UGFuZWxfc3RhdGVWaWV3c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBjb3VudGVycyB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBcIm14X1Jvb21WaWV3X2F1eFBhbmVsXCI6IHRydWUsXG4gICAgICAgICAgICBcIm14X1Jvb21WaWV3X2F1eFBhbmVsX2Z1bGxIZWlnaHRcIjogdGhpcy5wcm9wcy5mdWxsSGVpZ2h0LFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB7fTtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLmZ1bGxIZWlnaHQpIHtcbiAgICAgICAgICAgIHN0eWxlLm1heEhlaWdodCA9IHRoaXMucHJvcHMubWF4SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBdXRvSGlkZVNjcm9sbGJhciBjbGFzc05hbWU9e2NsYXNzZXN9IHN0eWxlPXtzdHlsZX0gPlxuICAgICAgICAgICAgICAgIHsgc3RhdGVWaWV3cyB9XG4gICAgICAgICAgICAgICAgeyBhcHBzRHJhd2VyIH1cbiAgICAgICAgICAgICAgICB7IGZpbGVEcm9wVGFyZ2V0IH1cbiAgICAgICAgICAgICAgICB7IGNhbGxWaWV3IH1cbiAgICAgICAgICAgICAgICB7IGNvbmZlcmVuY2VDYWxsTm90aWZpY2F0aW9uIH1cbiAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuY2hpbGRyZW4gfVxuICAgICAgICAgICAgPC9BdXRvSGlkZVNjcm9sbGJhcj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=