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

var sdk = _interopRequireWildcard(require("../../../index"));

var _EventTile = require("./EventTile");

/*
Copyright 2015 OpenMarket Ltd
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
  displayName: 'SearchResult',
  propTypes: {
    // a matrix-js-sdk SearchResult containing the details of this result
    searchResult: _propTypes.default.object.isRequired,
    // a list of strings to be highlighted in the results
    searchHighlights: _propTypes.default.array,
    // href for the highlights in this result
    resultLink: _propTypes.default.string,
    onHeightChanged: _propTypes.default.func
  },
  render: function () {
    const DateSeparator = sdk.getComponent('messages.DateSeparator');
    const EventTile = sdk.getComponent('rooms.EventTile');
    const result = this.props.searchResult;
    const mxEv = result.context.getEvent();
    const eventId = mxEv.getId();
    const ts1 = mxEv.getTs();
    const ret = [/*#__PURE__*/_react.default.createElement(DateSeparator, {
      key: ts1 + "-search",
      ts: ts1
    })];
    const timeline = result.context.getTimeline();

    for (var j = 0; j < timeline.length; j++) {
      const ev = timeline[j];
      var highlights;
      const contextual = j != result.context.getOurEventIndex();

      if (!contextual) {
        highlights = this.props.searchHighlights;
      }

      if ((0, _EventTile.haveTileForEvent)(ev)) {
        ret.push( /*#__PURE__*/_react.default.createElement(EventTile, {
          key: eventId + "+" + j,
          mxEvent: ev,
          contextual: contextual,
          highlights: highlights,
          permalinkCreator: this.props.permalinkCreator,
          highlightLink: this.props.resultLink,
          onHeightChanged: this.props.onHeightChanged
        }));
      }
    }

    return /*#__PURE__*/_react.default.createElement("li", {
      "data-scroll-tokens": eventId + "+" + j
    }, ret);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1NlYXJjaFJlc3VsdFRpbGUuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJzZWFyY2hSZXN1bHQiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic2VhcmNoSGlnaGxpZ2h0cyIsImFycmF5IiwicmVzdWx0TGluayIsInN0cmluZyIsIm9uSGVpZ2h0Q2hhbmdlZCIsImZ1bmMiLCJyZW5kZXIiLCJEYXRlU2VwYXJhdG9yIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRXZlbnRUaWxlIiwicmVzdWx0IiwicHJvcHMiLCJteEV2IiwiY29udGV4dCIsImdldEV2ZW50IiwiZXZlbnRJZCIsImdldElkIiwidHMxIiwiZ2V0VHMiLCJyZXQiLCJ0aW1lbGluZSIsImdldFRpbWVsaW5lIiwiaiIsImxlbmd0aCIsImV2IiwiaGlnaGxpZ2h0cyIsImNvbnRleHR1YWwiLCJnZXRPdXJFdmVudEluZGV4IiwicHVzaCIsInBlcm1hbGlua0NyZWF0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7OztlQXVCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxjQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBQyxJQUFBQSxZQUFZLEVBQUVDLG1CQUFVQyxNQUFWLENBQWlCQyxVQUZ4QjtBQUlQO0FBQ0FDLElBQUFBLGdCQUFnQixFQUFFSCxtQkFBVUksS0FMckI7QUFPUDtBQUNBQyxJQUFBQSxVQUFVLEVBQUVMLG1CQUFVTSxNQVJmO0FBVVBDLElBQUFBLGVBQWUsRUFBRVAsbUJBQVVRO0FBVnBCLEdBSGlCO0FBZ0I1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxhQUFhLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBdEI7QUFDQSxVQUFNQyxTQUFTLEdBQUdGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixpQkFBakIsQ0FBbEI7QUFDQSxVQUFNRSxNQUFNLEdBQUcsS0FBS0MsS0FBTCxDQUFXaEIsWUFBMUI7QUFDQSxVQUFNaUIsSUFBSSxHQUFHRixNQUFNLENBQUNHLE9BQVAsQ0FBZUMsUUFBZixFQUFiO0FBQ0EsVUFBTUMsT0FBTyxHQUFHSCxJQUFJLENBQUNJLEtBQUwsRUFBaEI7QUFFQSxVQUFNQyxHQUFHLEdBQUdMLElBQUksQ0FBQ00sS0FBTCxFQUFaO0FBQ0EsVUFBTUMsR0FBRyxHQUFHLGNBQUMsNkJBQUMsYUFBRDtBQUFlLE1BQUEsR0FBRyxFQUFFRixHQUFHLEdBQUcsU0FBMUI7QUFBcUMsTUFBQSxFQUFFLEVBQUVBO0FBQXpDLE1BQUQsQ0FBWjtBQUVBLFVBQU1HLFFBQVEsR0FBR1YsTUFBTSxDQUFDRyxPQUFQLENBQWVRLFdBQWYsRUFBakI7O0FBQ0EsU0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHRixRQUFRLENBQUNHLE1BQTdCLEVBQXFDRCxDQUFDLEVBQXRDLEVBQTBDO0FBQ3RDLFlBQU1FLEVBQUUsR0FBR0osUUFBUSxDQUFDRSxDQUFELENBQW5CO0FBQ0EsVUFBSUcsVUFBSjtBQUNBLFlBQU1DLFVBQVUsR0FBSUosQ0FBQyxJQUFJWixNQUFNLENBQUNHLE9BQVAsQ0FBZWMsZ0JBQWYsRUFBekI7O0FBQ0EsVUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2JELFFBQUFBLFVBQVUsR0FBRyxLQUFLZCxLQUFMLENBQVdaLGdCQUF4QjtBQUNIOztBQUNELFVBQUksaUNBQWlCeUIsRUFBakIsQ0FBSixFQUEwQjtBQUN0QkwsUUFBQUEsR0FBRyxDQUFDUyxJQUFKLGVBQVMsNkJBQUMsU0FBRDtBQUFXLFVBQUEsR0FBRyxFQUFFYixPQUFPLEdBQUMsR0FBUixHQUFZTyxDQUE1QjtBQUErQixVQUFBLE9BQU8sRUFBRUUsRUFBeEM7QUFBNEMsVUFBQSxVQUFVLEVBQUVFLFVBQXhEO0FBQW9FLFVBQUEsVUFBVSxFQUFFRCxVQUFoRjtBQUNDLFVBQUEsZ0JBQWdCLEVBQUUsS0FBS2QsS0FBTCxDQUFXa0IsZ0JBRDlCO0FBRUMsVUFBQSxhQUFhLEVBQUUsS0FBS2xCLEtBQUwsQ0FBV1YsVUFGM0I7QUFHQyxVQUFBLGVBQWUsRUFBRSxLQUFLVSxLQUFMLENBQVdSO0FBSDdCLFVBQVQ7QUFJSDtBQUNKOztBQUNELHdCQUNJO0FBQUksNEJBQW9CWSxPQUFPLEdBQUMsR0FBUixHQUFZTztBQUFwQyxPQUNNSCxHQUROLENBREo7QUFJSDtBQTdDMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtoYXZlVGlsZUZvckV2ZW50fSBmcm9tIFwiLi9FdmVudFRpbGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdTZWFyY2hSZXN1bHQnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIGEgbWF0cml4LWpzLXNkayBTZWFyY2hSZXN1bHQgY29udGFpbmluZyB0aGUgZGV0YWlscyBvZiB0aGlzIHJlc3VsdFxuICAgICAgICBzZWFyY2hSZXN1bHQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgICAgICAvLyBhIGxpc3Qgb2Ygc3RyaW5ncyB0byBiZSBoaWdobGlnaHRlZCBpbiB0aGUgcmVzdWx0c1xuICAgICAgICBzZWFyY2hIaWdobGlnaHRzOiBQcm9wVHlwZXMuYXJyYXksXG5cbiAgICAgICAgLy8gaHJlZiBmb3IgdGhlIGhpZ2hsaWdodHMgaW4gdGhpcyByZXN1bHRcbiAgICAgICAgcmVzdWx0TGluazogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICBvbkhlaWdodENoYW5nZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBEYXRlU2VwYXJhdG9yID0gc2RrLmdldENvbXBvbmVudCgnbWVzc2FnZXMuRGF0ZVNlcGFyYXRvcicpO1xuICAgICAgICBjb25zdCBFdmVudFRpbGUgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5FdmVudFRpbGUnKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5wcm9wcy5zZWFyY2hSZXN1bHQ7XG4gICAgICAgIGNvbnN0IG14RXYgPSByZXN1bHQuY29udGV4dC5nZXRFdmVudCgpO1xuICAgICAgICBjb25zdCBldmVudElkID0gbXhFdi5nZXRJZCgpO1xuXG4gICAgICAgIGNvbnN0IHRzMSA9IG14RXYuZ2V0VHMoKTtcbiAgICAgICAgY29uc3QgcmV0ID0gWzxEYXRlU2VwYXJhdG9yIGtleT17dHMxICsgXCItc2VhcmNoXCJ9IHRzPXt0czF9IC8+XTtcblxuICAgICAgICBjb25zdCB0aW1lbGluZSA9IHJlc3VsdC5jb250ZXh0LmdldFRpbWVsaW5lKCk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGltZWxpbmUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ID0gdGltZWxpbmVbal07XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0cztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHR1YWwgPSAoaiAhPSByZXN1bHQuY29udGV4dC5nZXRPdXJFdmVudEluZGV4KCkpO1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0dWFsKSB7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0cyA9IHRoaXMucHJvcHMuc2VhcmNoSGlnaGxpZ2h0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYXZlVGlsZUZvckV2ZW50KGV2KSkge1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKDxFdmVudFRpbGUga2V5PXtldmVudElkK1wiK1wiK2p9IG14RXZlbnQ9e2V2fSBjb250ZXh0dWFsPXtjb250ZXh0dWFsfSBoaWdobGlnaHRzPXtoaWdobGlnaHRzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3J9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodExpbms9e3RoaXMucHJvcHMucmVzdWx0TGlua31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25IZWlnaHRDaGFuZ2VkPXt0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZH0gLz4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bGkgZGF0YS1zY3JvbGwtdG9rZW5zPXtldmVudElkK1wiK1wiK2p9PlxuICAgICAgICAgICAgICAgIHsgcmV0IH1cbiAgICAgICAgICAgIDwvbGk+KTtcbiAgICB9LFxufSk7XG4iXX0=