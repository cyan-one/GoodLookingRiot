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

var _classnames = _interopRequireDefault(require("classnames"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _FormattingUtils = require("../../../utils/FormattingUtils");

/*
Copyright 2019 New Vector Ltd

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
class ReactionsRowButton extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onClick", ev => {
      const {
        mxEvent,
        myReactionEvent,
        content
      } = this.props;

      if (myReactionEvent) {
        _MatrixClientPeg.MatrixClientPeg.get().redactEvent(mxEvent.getRoomId(), myReactionEvent.getId());
      } else {
        _MatrixClientPeg.MatrixClientPeg.get().sendEvent(mxEvent.getRoomId(), "m.reaction", {
          "m.relates_to": {
            "rel_type": "m.annotation",
            "event_id": mxEvent.getId(),
            "key": content
          }
        });
      }
    });
    (0, _defineProperty2.default)(this, "onMouseOver", () => {
      this.setState({
        // To avoid littering the DOM with a tooltip for every reaction,
        // only render it on first use.
        tooltipRendered: true,
        tooltipVisible: true
      });
    });
    (0, _defineProperty2.default)(this, "onMouseOut", () => {
      this.setState({
        tooltipVisible: false
      });
    });
    this.state = {
      tooltipVisible: false
    };
  }

  render() {
    const ReactionsRowButtonTooltip = sdk.getComponent('messages.ReactionsRowButtonTooltip');
    const {
      mxEvent,
      content,
      count,
      reactionEvents,
      myReactionEvent
    } = this.props;
    const classes = (0, _classnames.default)({
      mx_ReactionsRowButton: true,
      mx_ReactionsRowButton_selected: !!myReactionEvent
    });
    let tooltip;

    if (this.state.tooltipRendered) {
      tooltip = /*#__PURE__*/_react.default.createElement(ReactionsRowButtonTooltip, {
        mxEvent: this.props.mxEvent,
        content: content,
        reactionEvents: reactionEvents,
        visible: this.state.tooltipVisible
      });
    }

    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(mxEvent.getRoomId());

    let label;

    if (room) {
      const senders = [];

      for (const reactionEvent of reactionEvents) {
        const member = room.getMember(reactionEvent.getSender());
        const name = member ? member.name : reactionEvent.getSender();
        senders.push(name);
      }

      label = (0, _languageHandler._t)("<reactors/><reactedWith> reacted with %(content)s</reactedWith>", {
        content
      }, {
        reactors: () => {
          return (0, _FormattingUtils.formatCommaSeparatedList)(senders, 6);
        },
        reactedWith: sub => {
          if (!content) {
            return null;
          }

          return sub;
        }
      });
    }

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: classes,
      "aria-label": label,
      onClick: this.onClick,
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ReactionsRowButton_content",
      "aria-hidden": "true"
    }, content), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ReactionsRowButton_count",
      "aria-hidden": "true"
    }, count), tooltip);
  }

}

exports.default = ReactionsRowButton;
(0, _defineProperty2.default)(ReactionsRowButton, "propTypes", {
  // The event we're displaying reactions for
  mxEvent: _propTypes.default.object.isRequired,
  // The reaction content / key / emoji
  content: _propTypes.default.string.isRequired,
  // The count of votes for this key
  count: _propTypes.default.number.isRequired,
  // A Set of Martix reaction events for this key
  reactionEvents: _propTypes.default.object.isRequired,
  // A possible Matrix event if the current user has voted for this type
  myReactionEvent: _propTypes.default.object
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL1JlYWN0aW9uc1Jvd0J1dHRvbi5qcyJdLCJuYW1lcyI6WyJSZWFjdGlvbnNSb3dCdXR0b24iLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZXYiLCJteEV2ZW50IiwibXlSZWFjdGlvbkV2ZW50IiwiY29udGVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInJlZGFjdEV2ZW50IiwiZ2V0Um9vbUlkIiwiZ2V0SWQiLCJzZW5kRXZlbnQiLCJzZXRTdGF0ZSIsInRvb2x0aXBSZW5kZXJlZCIsInRvb2x0aXBWaXNpYmxlIiwic3RhdGUiLCJyZW5kZXIiLCJSZWFjdGlvbnNSb3dCdXR0b25Ub29sdGlwIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiY291bnQiLCJyZWFjdGlvbkV2ZW50cyIsImNsYXNzZXMiLCJteF9SZWFjdGlvbnNSb3dCdXR0b24iLCJteF9SZWFjdGlvbnNSb3dCdXR0b25fc2VsZWN0ZWQiLCJ0b29sdGlwIiwicm9vbSIsImdldFJvb20iLCJsYWJlbCIsInNlbmRlcnMiLCJyZWFjdGlvbkV2ZW50IiwibWVtYmVyIiwiZ2V0TWVtYmVyIiwiZ2V0U2VuZGVyIiwibmFtZSIsInB1c2giLCJyZWFjdG9ycyIsInJlYWN0ZWRXaXRoIiwic3ViIiwiQWNjZXNzaWJsZUJ1dHRvbiIsIm9uQ2xpY2siLCJvbk1vdXNlT3ZlciIsIm9uTW91c2VPdXQiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwibnVtYmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUJlLE1BQU1BLGtCQUFOLFNBQWlDQyxlQUFNQyxhQUF2QyxDQUFxRDtBQWNoRUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsbURBUVJDLEVBQUQsSUFBUTtBQUNkLFlBQU07QUFBRUMsUUFBQUEsT0FBRjtBQUFXQyxRQUFBQSxlQUFYO0FBQTRCQyxRQUFBQTtBQUE1QixVQUF3QyxLQUFLSixLQUFuRDs7QUFDQSxVQUFJRyxlQUFKLEVBQXFCO0FBQ2pCRSx5Q0FBZ0JDLEdBQWhCLEdBQXNCQyxXQUF0QixDQUNJTCxPQUFPLENBQUNNLFNBQVIsRUFESixFQUVJTCxlQUFlLENBQUNNLEtBQWhCLEVBRko7QUFJSCxPQUxELE1BS087QUFDSEoseUNBQWdCQyxHQUFoQixHQUFzQkksU0FBdEIsQ0FBZ0NSLE9BQU8sQ0FBQ00sU0FBUixFQUFoQyxFQUFxRCxZQUFyRCxFQUFtRTtBQUMvRCwwQkFBZ0I7QUFDWix3QkFBWSxjQURBO0FBRVosd0JBQVlOLE9BQU8sQ0FBQ08sS0FBUixFQUZBO0FBR1osbUJBQU9MO0FBSEs7QUFEK0MsU0FBbkU7QUFPSDtBQUNKLEtBeEJrQjtBQUFBLHVEQTBCTCxNQUFNO0FBQ2hCLFdBQUtPLFFBQUwsQ0FBYztBQUNWO0FBQ0E7QUFDQUMsUUFBQUEsZUFBZSxFQUFFLElBSFA7QUFJVkMsUUFBQUEsY0FBYyxFQUFFO0FBSk4sT0FBZDtBQU1ILEtBakNrQjtBQUFBLHNEQW1DTixNQUFNO0FBQ2YsV0FBS0YsUUFBTCxDQUFjO0FBQ1ZFLFFBQUFBLGNBQWMsRUFBRTtBQUROLE9BQWQ7QUFHSCxLQXZDa0I7QUFHZixTQUFLQyxLQUFMLEdBQWE7QUFDVEQsTUFBQUEsY0FBYyxFQUFFO0FBRFAsS0FBYjtBQUdIOztBQW1DREUsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMseUJBQXlCLEdBQzNCQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsb0NBQWpCLENBREo7QUFFQSxVQUFNO0FBQUVoQixNQUFBQSxPQUFGO0FBQVdFLE1BQUFBLE9BQVg7QUFBb0JlLE1BQUFBLEtBQXBCO0FBQTJCQyxNQUFBQSxjQUEzQjtBQUEyQ2pCLE1BQUFBO0FBQTNDLFFBQStELEtBQUtILEtBQTFFO0FBRUEsVUFBTXFCLE9BQU8sR0FBRyx5QkFBVztBQUN2QkMsTUFBQUEscUJBQXFCLEVBQUUsSUFEQTtBQUV2QkMsTUFBQUEsOEJBQThCLEVBQUUsQ0FBQyxDQUFDcEI7QUFGWCxLQUFYLENBQWhCO0FBS0EsUUFBSXFCLE9BQUo7O0FBQ0EsUUFBSSxLQUFLVixLQUFMLENBQVdGLGVBQWYsRUFBZ0M7QUFDNUJZLE1BQUFBLE9BQU8sZ0JBQUcsNkJBQUMseUJBQUQ7QUFDTixRQUFBLE9BQU8sRUFBRSxLQUFLeEIsS0FBTCxDQUFXRSxPQURkO0FBRU4sUUFBQSxPQUFPLEVBQUVFLE9BRkg7QUFHTixRQUFBLGNBQWMsRUFBRWdCLGNBSFY7QUFJTixRQUFBLE9BQU8sRUFBRSxLQUFLTixLQUFMLENBQVdEO0FBSmQsUUFBVjtBQU1IOztBQUVELFVBQU1ZLElBQUksR0FBR3BCLGlDQUFnQkMsR0FBaEIsR0FBc0JvQixPQUF0QixDQUE4QnhCLE9BQU8sQ0FBQ00sU0FBUixFQUE5QixDQUFiOztBQUNBLFFBQUltQixLQUFKOztBQUNBLFFBQUlGLElBQUosRUFBVTtBQUNOLFlBQU1HLE9BQU8sR0FBRyxFQUFoQjs7QUFDQSxXQUFLLE1BQU1DLGFBQVgsSUFBNEJULGNBQTVCLEVBQTRDO0FBQ3hDLGNBQU1VLE1BQU0sR0FBR0wsSUFBSSxDQUFDTSxTQUFMLENBQWVGLGFBQWEsQ0FBQ0csU0FBZCxFQUFmLENBQWY7QUFDQSxjQUFNQyxJQUFJLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDRyxJQUFWLEdBQWlCSixhQUFhLENBQUNHLFNBQWQsRUFBcEM7QUFDQUosUUFBQUEsT0FBTyxDQUFDTSxJQUFSLENBQWFELElBQWI7QUFDSDs7QUFDRE4sTUFBQUEsS0FBSyxHQUFHLHlCQUNKLGlFQURJLEVBRUo7QUFDSXZCLFFBQUFBO0FBREosT0FGSSxFQUtKO0FBQ0krQixRQUFBQSxRQUFRLEVBQUUsTUFBTTtBQUNaLGlCQUFPLCtDQUF5QlAsT0FBekIsRUFBa0MsQ0FBbEMsQ0FBUDtBQUNILFNBSEw7QUFJSVEsUUFBQUEsV0FBVyxFQUFHQyxHQUFELElBQVM7QUFDbEIsY0FBSSxDQUFDakMsT0FBTCxFQUFjO0FBQ1YsbUJBQU8sSUFBUDtBQUNIOztBQUNELGlCQUFPaUMsR0FBUDtBQUNIO0FBVEwsT0FMSSxDQUFSO0FBaUJIOztBQUVELFVBQU1DLGdCQUFnQixHQUFHckIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDJCQUFqQixDQUF6QjtBQUNBLHdCQUFPLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsU0FBUyxFQUFFRyxPQUE3QjtBQUNILG9CQUFZTSxLQURUO0FBRUgsTUFBQSxPQUFPLEVBQUUsS0FBS1ksT0FGWDtBQUdILE1BQUEsV0FBVyxFQUFFLEtBQUtDLFdBSGY7QUFJSCxNQUFBLFVBQVUsRUFBRSxLQUFLQztBQUpkLG9CQU1IO0FBQU0sTUFBQSxTQUFTLEVBQUMsK0JBQWhCO0FBQWdELHFCQUFZO0FBQTVELE9BQ0tyQyxPQURMLENBTkcsZUFTSDtBQUFNLE1BQUEsU0FBUyxFQUFDLDZCQUFoQjtBQUE4QyxxQkFBWTtBQUExRCxPQUNLZSxLQURMLENBVEcsRUFZRkssT0FaRSxDQUFQO0FBY0g7O0FBdEgrRDs7OzhCQUEvQzVCLGtCLGVBQ0U7QUFDZjtBQUNBTSxFQUFBQSxPQUFPLEVBQUV3QyxtQkFBVUMsTUFBVixDQUFpQkMsVUFGWDtBQUdmO0FBQ0F4QyxFQUFBQSxPQUFPLEVBQUVzQyxtQkFBVUcsTUFBVixDQUFpQkQsVUFKWDtBQUtmO0FBQ0F6QixFQUFBQSxLQUFLLEVBQUV1QixtQkFBVUksTUFBVixDQUFpQkYsVUFOVDtBQU9mO0FBQ0F4QixFQUFBQSxjQUFjLEVBQUVzQixtQkFBVUMsTUFBVixDQUFpQkMsVUFSbEI7QUFTZjtBQUNBekMsRUFBQUEsZUFBZSxFQUFFdUMsbUJBQVVDO0FBVlosQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7IGZvcm1hdENvbW1hU2VwYXJhdGVkTGlzdCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0Zvcm1hdHRpbmdVdGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlYWN0aW9uc1Jvd0J1dHRvbiBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIFRoZSBldmVudCB3ZSdyZSBkaXNwbGF5aW5nIHJlYWN0aW9ucyBmb3JcbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBUaGUgcmVhY3Rpb24gY29udGVudCAvIGtleSAvIGVtb2ppXG4gICAgICAgIGNvbnRlbnQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgLy8gVGhlIGNvdW50IG9mIHZvdGVzIGZvciB0aGlzIGtleVxuICAgICAgICBjb3VudDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBBIFNldCBvZiBNYXJ0aXggcmVhY3Rpb24gZXZlbnRzIGZvciB0aGlzIGtleVxuICAgICAgICByZWFjdGlvbkV2ZW50czogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBBIHBvc3NpYmxlIE1hdHJpeCBldmVudCBpZiB0aGUgY3VycmVudCB1c2VyIGhhcyB2b3RlZCBmb3IgdGhpcyB0eXBlXG4gICAgICAgIG15UmVhY3Rpb25FdmVudDogUHJvcFR5cGVzLm9iamVjdCxcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHRvb2x0aXBWaXNpYmxlOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvbkNsaWNrID0gKGV2KSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbXhFdmVudCwgbXlSZWFjdGlvbkV2ZW50LCBjb250ZW50IH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAobXlSZWFjdGlvbkV2ZW50KSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVkYWN0RXZlbnQoXG4gICAgICAgICAgICAgICAgbXhFdmVudC5nZXRSb29tSWQoKSxcbiAgICAgICAgICAgICAgICBteVJlYWN0aW9uRXZlbnQuZ2V0SWQoKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VuZEV2ZW50KG14RXZlbnQuZ2V0Um9vbUlkKCksIFwibS5yZWFjdGlvblwiLCB7XG4gICAgICAgICAgICAgICAgXCJtLnJlbGF0ZXNfdG9cIjoge1xuICAgICAgICAgICAgICAgICAgICBcInJlbF90eXBlXCI6IFwibS5hbm5vdGF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXZlbnRfaWRcIjogbXhFdmVudC5nZXRJZCgpLFxuICAgICAgICAgICAgICAgICAgICBcImtleVwiOiBjb250ZW50LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBvbk1vdXNlT3ZlciA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAvLyBUbyBhdm9pZCBsaXR0ZXJpbmcgdGhlIERPTSB3aXRoIGEgdG9vbHRpcCBmb3IgZXZlcnkgcmVhY3Rpb24sXG4gICAgICAgICAgICAvLyBvbmx5IHJlbmRlciBpdCBvbiBmaXJzdCB1c2UuXG4gICAgICAgICAgICB0b29sdGlwUmVuZGVyZWQ6IHRydWUsXG4gICAgICAgICAgICB0b29sdGlwVmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Nb3VzZU91dCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB0b29sdGlwVmlzaWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgUmVhY3Rpb25zUm93QnV0dG9uVG9vbHRpcCA9XG4gICAgICAgICAgICBzZGsuZ2V0Q29tcG9uZW50KCdtZXNzYWdlcy5SZWFjdGlvbnNSb3dCdXR0b25Ub29sdGlwJyk7XG4gICAgICAgIGNvbnN0IHsgbXhFdmVudCwgY29udGVudCwgY291bnQsIHJlYWN0aW9uRXZlbnRzLCBteVJlYWN0aW9uRXZlbnQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgbXhfUmVhY3Rpb25zUm93QnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgbXhfUmVhY3Rpb25zUm93QnV0dG9uX3NlbGVjdGVkOiAhIW15UmVhY3Rpb25FdmVudCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnRvb2x0aXBSZW5kZXJlZCkge1xuICAgICAgICAgICAgdG9vbHRpcCA9IDxSZWFjdGlvbnNSb3dCdXR0b25Ub29sdGlwXG4gICAgICAgICAgICAgICAgbXhFdmVudD17dGhpcy5wcm9wcy5teEV2ZW50fVxuICAgICAgICAgICAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25FdmVudHM9e3JlYWN0aW9uRXZlbnRzfVxuICAgICAgICAgICAgICAgIHZpc2libGU9e3RoaXMuc3RhdGUudG9vbHRpcFZpc2libGV9XG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb20gPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbShteEV2ZW50LmdldFJvb21JZCgpKTtcbiAgICAgICAgbGV0IGxhYmVsO1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgY29uc3Qgc2VuZGVycyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCByZWFjdGlvbkV2ZW50IG9mIHJlYWN0aW9uRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVtYmVyID0gcm9vbS5nZXRNZW1iZXIocmVhY3Rpb25FdmVudC5nZXRTZW5kZXIoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IG1lbWJlciA/IG1lbWJlci5uYW1lIDogcmVhY3Rpb25FdmVudC5nZXRTZW5kZXIoKTtcbiAgICAgICAgICAgICAgICBzZW5kZXJzLnB1c2gobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbCA9IF90KFxuICAgICAgICAgICAgICAgIFwiPHJlYWN0b3JzLz48cmVhY3RlZFdpdGg+IHJlYWN0ZWQgd2l0aCAlKGNvbnRlbnQpczwvcmVhY3RlZFdpdGg+XCIsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZWFjdG9yczogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdENvbW1hU2VwYXJhdGVkTGlzdChzZW5kZXJzLCA2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVhY3RlZFdpdGg6IChzdWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1YjtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIHJldHVybiA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9e2NsYXNzZXN9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXtsYWJlbH1cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja31cbiAgICAgICAgICAgIG9uTW91c2VPdmVyPXt0aGlzLm9uTW91c2VPdmVyfVxuICAgICAgICAgICAgb25Nb3VzZU91dD17dGhpcy5vbk1vdXNlT3V0fVxuICAgICAgICA+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9SZWFjdGlvbnNSb3dCdXR0b25fY29udGVudFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPlxuICAgICAgICAgICAgICAgIHtjb250ZW50fVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfUmVhY3Rpb25zUm93QnV0dG9uX2NvdW50XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+XG4gICAgICAgICAgICAgICAge2NvdW50fVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAge3Rvb2x0aXB9XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj47XG4gICAgfVxufVxuIl19