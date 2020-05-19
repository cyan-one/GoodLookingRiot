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

var sdk = _interopRequireWildcard(require("../../../index"));

var _HtmlUtils = require("../../../HtmlUtils");

var _languageHandler = require("../../../languageHandler");

var _FormattingUtils = require("../../../utils/FormattingUtils");

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
class ReactionsRowButtonTooltip extends _react.default.PureComponent {
  render() {
    const Tooltip = sdk.getComponent('elements.Tooltip');
    const {
      content,
      reactionEvents,
      mxEvent,
      visible
    } = this.props;

    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(mxEvent.getRoomId());

    let tooltipLabel;

    if (room) {
      const senders = [];

      for (const reactionEvent of reactionEvents) {
        const member = room.getMember(reactionEvent.getSender());
        const name = member ? member.name : reactionEvent.getSender();
        senders.push(name);
      }

      const shortName = (0, _HtmlUtils.unicodeToShortcode)(content);
      tooltipLabel = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("<reactors/><reactedWith>reacted with %(shortName)s</reactedWith>", {
        shortName
      }, {
        reactors: () => {
          return /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_ReactionsRowButtonTooltip_senders"
          }, (0, _FormattingUtils.formatCommaSeparatedList)(senders, 6));
        },
        reactedWith: sub => {
          if (!shortName) {
            return null;
          }

          return /*#__PURE__*/_react.default.createElement("div", {
            className: "mx_ReactionsRowButtonTooltip_reactedWith"
          }, sub);
        }
      }));
    }

    let tooltip;

    if (tooltipLabel) {
      tooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        tooltipClassName: "mx_Tooltip_timeline",
        visible: visible,
        label: tooltipLabel
      });
    }

    return tooltip;
  }

}

exports.default = ReactionsRowButtonTooltip;
(0, _defineProperty2.default)(ReactionsRowButtonTooltip, "propTypes", {
  // The event we're displaying reactions for
  mxEvent: _propTypes.default.object.isRequired,
  // The reaction content / key / emoji
  content: _propTypes.default.string.isRequired,
  // A Set of Martix reaction events for this key
  reactionEvents: _propTypes.default.object.isRequired,
  visible: _propTypes.default.bool.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL1JlYWN0aW9uc1Jvd0J1dHRvblRvb2x0aXAuanMiXSwibmFtZXMiOlsiUmVhY3Rpb25zUm93QnV0dG9uVG9vbHRpcCIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsInJlbmRlciIsIlRvb2x0aXAiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjb250ZW50IiwicmVhY3Rpb25FdmVudHMiLCJteEV2ZW50IiwidmlzaWJsZSIsInByb3BzIiwicm9vbSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFJvb20iLCJnZXRSb29tSWQiLCJ0b29sdGlwTGFiZWwiLCJzZW5kZXJzIiwicmVhY3Rpb25FdmVudCIsIm1lbWJlciIsImdldE1lbWJlciIsImdldFNlbmRlciIsIm5hbWUiLCJwdXNoIiwic2hvcnROYW1lIiwicmVhY3RvcnMiLCJyZWFjdGVkV2l0aCIsInN1YiIsInRvb2x0aXAiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiYm9vbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF2QkE7Ozs7Ozs7Ozs7Ozs7OztBQXlCZSxNQUFNQSx5QkFBTixTQUF3Q0MsZUFBTUMsYUFBOUMsQ0FBNEQ7QUFXdkVDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE9BQU8sR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLFVBQU07QUFBRUMsTUFBQUEsT0FBRjtBQUFXQyxNQUFBQSxjQUFYO0FBQTJCQyxNQUFBQSxPQUEzQjtBQUFvQ0MsTUFBQUE7QUFBcEMsUUFBZ0QsS0FBS0MsS0FBM0Q7O0FBRUEsVUFBTUMsSUFBSSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxPQUF0QixDQUE4Qk4sT0FBTyxDQUFDTyxTQUFSLEVBQTlCLENBQWI7O0FBQ0EsUUFBSUMsWUFBSjs7QUFDQSxRQUFJTCxJQUFKLEVBQVU7QUFDTixZQUFNTSxPQUFPLEdBQUcsRUFBaEI7O0FBQ0EsV0FBSyxNQUFNQyxhQUFYLElBQTRCWCxjQUE1QixFQUE0QztBQUN4QyxjQUFNWSxNQUFNLEdBQUdSLElBQUksQ0FBQ1MsU0FBTCxDQUFlRixhQUFhLENBQUNHLFNBQWQsRUFBZixDQUFmO0FBQ0EsY0FBTUMsSUFBSSxHQUFHSCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ0csSUFBVixHQUFpQkosYUFBYSxDQUFDRyxTQUFkLEVBQXBDO0FBQ0FKLFFBQUFBLE9BQU8sQ0FBQ00sSUFBUixDQUFhRCxJQUFiO0FBQ0g7O0FBQ0QsWUFBTUUsU0FBUyxHQUFHLG1DQUFtQmxCLE9BQW5CLENBQWxCO0FBQ0FVLE1BQUFBLFlBQVksZ0JBQUcsMENBQU0seUJBQ2pCLGtFQURpQixFQUVqQjtBQUNJUSxRQUFBQTtBQURKLE9BRmlCLEVBS2pCO0FBQ0lDLFFBQUFBLFFBQVEsRUFBRSxNQUFNO0FBQ1osOEJBQU87QUFBSyxZQUFBLFNBQVMsRUFBQztBQUFmLGFBQ0YsK0NBQXlCUixPQUF6QixFQUFrQyxDQUFsQyxDQURFLENBQVA7QUFHSCxTQUxMO0FBTUlTLFFBQUFBLFdBQVcsRUFBR0MsR0FBRCxJQUFTO0FBQ2xCLGNBQUksQ0FBQ0gsU0FBTCxFQUFnQjtBQUNaLG1CQUFPLElBQVA7QUFDSDs7QUFDRCw4QkFBTztBQUFLLFlBQUEsU0FBUyxFQUFDO0FBQWYsYUFDRkcsR0FERSxDQUFQO0FBR0g7QUFiTCxPQUxpQixDQUFOLENBQWY7QUFxQkg7O0FBRUQsUUFBSUMsT0FBSjs7QUFDQSxRQUFJWixZQUFKLEVBQWtCO0FBQ2RZLE1BQUFBLE9BQU8sZ0JBQUcsNkJBQUMsT0FBRDtBQUNOLFFBQUEsZ0JBQWdCLEVBQUMscUJBRFg7QUFFTixRQUFBLE9BQU8sRUFBRW5CLE9BRkg7QUFHTixRQUFBLEtBQUssRUFBRU87QUFIRCxRQUFWO0FBS0g7O0FBRUQsV0FBT1ksT0FBUDtBQUNIOztBQTFEc0U7Ozs4QkFBdEQ3Qix5QixlQUNFO0FBQ2Y7QUFDQVMsRUFBQUEsT0FBTyxFQUFFcUIsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRlg7QUFHZjtBQUNBekIsRUFBQUEsT0FBTyxFQUFFdUIsbUJBQVVHLE1BQVYsQ0FBaUJELFVBSlg7QUFLZjtBQUNBeEIsRUFBQUEsY0FBYyxFQUFFc0IsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBTmxCO0FBT2Z0QixFQUFBQSxPQUFPLEVBQUVvQixtQkFBVUksSUFBVixDQUFlRjtBQVBULEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgdW5pY29kZVRvU2hvcnRjb2RlIH0gZnJvbSAnLi4vLi4vLi4vSHRtbFV0aWxzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7IGZvcm1hdENvbW1hU2VwYXJhdGVkTGlzdCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0Zvcm1hdHRpbmdVdGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlYWN0aW9uc1Jvd0J1dHRvblRvb2x0aXAgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBUaGUgZXZlbnQgd2UncmUgZGlzcGxheWluZyByZWFjdGlvbnMgZm9yXG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgLy8gVGhlIHJlYWN0aW9uIGNvbnRlbnQgLyBrZXkgLyBlbW9qaVxuICAgICAgICBjb250ZW50OiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIC8vIEEgU2V0IG9mIE1hcnRpeCByZWFjdGlvbiBldmVudHMgZm9yIHRoaXMga2V5XG4gICAgICAgIHJlYWN0aW9uRXZlbnRzOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIHZpc2libGU6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBUb29sdGlwID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuVG9vbHRpcCcpO1xuICAgICAgICBjb25zdCB7IGNvbnRlbnQsIHJlYWN0aW9uRXZlbnRzLCBteEV2ZW50LCB2aXNpYmxlIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShteEV2ZW50LmdldFJvb21JZCgpKTtcbiAgICAgICAgbGV0IHRvb2x0aXBMYWJlbDtcbiAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbmRlcnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb25FdmVudCBvZiByZWFjdGlvbkV2ZW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHJvb20uZ2V0TWVtYmVyKHJlYWN0aW9uRXZlbnQuZ2V0U2VuZGVyKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBtZW1iZXIgPyBtZW1iZXIubmFtZSA6IHJlYWN0aW9uRXZlbnQuZ2V0U2VuZGVyKCk7XG4gICAgICAgICAgICAgICAgc2VuZGVycy5wdXNoKG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2hvcnROYW1lID0gdW5pY29kZVRvU2hvcnRjb2RlKGNvbnRlbnQpO1xuICAgICAgICAgICAgdG9vbHRpcExhYmVsID0gPGRpdj57X3QoXG4gICAgICAgICAgICAgICAgXCI8cmVhY3RvcnMvPjxyZWFjdGVkV2l0aD5yZWFjdGVkIHdpdGggJShzaG9ydE5hbWUpczwvcmVhY3RlZFdpdGg+XCIsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzaG9ydE5hbWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0b3JzOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9SZWFjdGlvbnNSb3dCdXR0b25Ub29sdGlwX3NlbmRlcnNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0Q29tbWFTZXBhcmF0ZWRMaXN0KHNlbmRlcnMsIDYpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZWFjdGVkV2l0aDogKHN1YikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzaG9ydE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X1JlYWN0aW9uc1Jvd0J1dHRvblRvb2x0aXBfcmVhY3RlZFdpdGhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3VifVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApfTwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0b29sdGlwO1xuICAgICAgICBpZiAodG9vbHRpcExhYmVsKSB7XG4gICAgICAgICAgICB0b29sdGlwID0gPFRvb2x0aXBcbiAgICAgICAgICAgICAgICB0b29sdGlwQ2xhc3NOYW1lPVwibXhfVG9vbHRpcF90aW1lbGluZVwiXG4gICAgICAgICAgICAgICAgdmlzaWJsZT17dmlzaWJsZX1cbiAgICAgICAgICAgICAgICBsYWJlbD17dG9vbHRpcExhYmVsfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9vbHRpcDtcbiAgICB9XG59XG4iXX0=