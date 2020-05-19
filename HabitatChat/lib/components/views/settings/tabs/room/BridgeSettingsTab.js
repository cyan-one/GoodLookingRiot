"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../../../languageHandler");

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var _BridgeTile = _interopRequireDefault(require("../../BridgeTile"));

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
const BRIDGE_EVENT_TYPES = ["uk.half-shot.bridge" // m.bridge
];
const BRIDGES_LINK = "https://matrix.org/bridges/";

class BridgeSettingsTab extends _react.default.Component {
  _renderBridgeCard(event, room) {
    const content = event.getContent();

    if (!content || !content.channel || !content.protocol) {
      return null;
    }

    return /*#__PURE__*/_react.default.createElement(_BridgeTile.default, {
      room: room,
      ev: event
    });
  }

  static getBridgeStateEvents(roomId) {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const roomState = client.getRoom(roomId).currentState;
    const bridgeEvents = [].concat(...BRIDGE_EVENT_TYPES.map(typeName => Object.values(roomState.events[typeName] || {})));
    return bridgeEvents;
  }

  render() {
    // This settings tab will only be invoked if the following function returns more
    // than 0 events, so no validation is needed at this stage.
    const bridgeEvents = BridgeSettingsTab.getBridgeStateEvents(this.props.roomId);

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const room = client.getRoom(this.props.roomId);
    let content = null;

    if (bridgeEvents.length > 0) {
      content = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This room is bridging messages to the following platforms. " + "<a>Learn more.</a>", {}, {
        // TODO: We don't have this link yet: this will prevent the translators
        // having to re-translate the string when we do.
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: BRIDGES_LINK,
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      })), /*#__PURE__*/_react.default.createElement("ul", {
        className: "mx_RoomSettingsDialog_BridgeList"
      }, bridgeEvents.map(event => this._renderBridgeCard(event, room))));
    } else {
      content = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("This room isn’t bridging messages to any platforms. " + "<a>Learn more.</a>", {}, {
        // TODO: We don't have this link yet: this will prevent the translators
        // having to re-translate the string when we do.
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: BRIDGES_LINK,
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      }));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Bridges")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section mx_SettingsTab_subsectionText"
    }, content));
  }

}

exports.default = BridgeSettingsTab;
(0, _defineProperty2.default)(BridgeSettingsTab, "propTypes", {
  roomId: _propTypes.default.string.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvcm9vbS9CcmlkZ2VTZXR0aW5nc1RhYi5qcyJdLCJuYW1lcyI6WyJCUklER0VfRVZFTlRfVFlQRVMiLCJCUklER0VTX0xJTksiLCJCcmlkZ2VTZXR0aW5nc1RhYiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX3JlbmRlckJyaWRnZUNhcmQiLCJldmVudCIsInJvb20iLCJjb250ZW50IiwiZ2V0Q29udGVudCIsImNoYW5uZWwiLCJwcm90b2NvbCIsImdldEJyaWRnZVN0YXRlRXZlbnRzIiwicm9vbUlkIiwiY2xpZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwicm9vbVN0YXRlIiwiZ2V0Um9vbSIsImN1cnJlbnRTdGF0ZSIsImJyaWRnZUV2ZW50cyIsImNvbmNhdCIsIm1hcCIsInR5cGVOYW1lIiwiT2JqZWN0IiwidmFsdWVzIiwiZXZlbnRzIiwicmVuZGVyIiwicHJvcHMiLCJsZW5ndGgiLCJhIiwic3ViIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsTUFBTUEsa0JBQWtCLEdBQUcsQ0FDdkIscUJBRHVCLENBRXZCO0FBRnVCLENBQTNCO0FBS0EsTUFBTUMsWUFBWSxHQUFHLDZCQUFyQjs7QUFFZSxNQUFNQyxpQkFBTixTQUFnQ0MsZUFBTUMsU0FBdEMsQ0FBZ0Q7QUFLM0RDLEVBQUFBLGlCQUFpQixDQUFDQyxLQUFELEVBQVFDLElBQVIsRUFBYztBQUMzQixVQUFNQyxPQUFPLEdBQUdGLEtBQUssQ0FBQ0csVUFBTixFQUFoQjs7QUFDQSxRQUFJLENBQUNELE9BQUQsSUFBWSxDQUFDQSxPQUFPLENBQUNFLE9BQXJCLElBQWdDLENBQUNGLE9BQU8sQ0FBQ0csUUFBN0MsRUFBdUQ7QUFDbkQsYUFBTyxJQUFQO0FBQ0g7O0FBQ0Qsd0JBQU8sNkJBQUMsbUJBQUQ7QUFBWSxNQUFBLElBQUksRUFBRUosSUFBbEI7QUFBd0IsTUFBQSxFQUFFLEVBQUVEO0FBQTVCLE1BQVA7QUFDSDs7QUFFRCxTQUFPTSxvQkFBUCxDQUE0QkMsTUFBNUIsRUFBb0M7QUFDaEMsVUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsVUFBTUMsU0FBUyxHQUFJSCxNQUFNLENBQUNJLE9BQVAsQ0FBZUwsTUFBZixDQUFELENBQXlCTSxZQUEzQztBQUVBLFVBQU1DLFlBQVksR0FBRyxHQUFHQyxNQUFILENBQVUsR0FBR3JCLGtCQUFrQixDQUFDc0IsR0FBbkIsQ0FBd0JDLFFBQUQsSUFDckRDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjUixTQUFTLENBQUNTLE1BQVYsQ0FBaUJILFFBQWpCLEtBQThCLEVBQTVDLENBRDhCLENBQWIsQ0FBckI7QUFJQSxXQUFPSCxZQUFQO0FBQ0g7O0FBRURPLEVBQUFBLE1BQU0sR0FBRztBQUNMO0FBQ0E7QUFDQSxVQUFNUCxZQUFZLEdBQUdsQixpQkFBaUIsQ0FBQ1Usb0JBQWxCLENBQXVDLEtBQUtnQixLQUFMLENBQVdmLE1BQWxELENBQXJCOztBQUNBLFVBQU1DLE1BQU0sR0FBR0MsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFVBQU1ULElBQUksR0FBR08sTUFBTSxDQUFDSSxPQUFQLENBQWUsS0FBS1UsS0FBTCxDQUFXZixNQUExQixDQUFiO0FBRUEsUUFBSUwsT0FBTyxHQUFHLElBQWQ7O0FBRUEsUUFBSVksWUFBWSxDQUFDUyxNQUFiLEdBQXNCLENBQTFCLEVBQTZCO0FBQ3pCckIsTUFBQUEsT0FBTyxnQkFBRyx1REFDTix3Q0FBSSx5QkFDQSxnRUFDQSxvQkFGQSxFQUVzQixFQUZ0QixFQUdBO0FBQ0k7QUFDQTtBQUNBc0IsUUFBQUEsQ0FBQyxFQUFFQyxHQUFHLGlCQUFJO0FBQUcsVUFBQSxJQUFJLEVBQUU5QixZQUFUO0FBQXVCLFVBQUEsTUFBTSxFQUFDLFFBQTlCO0FBQXVDLFVBQUEsR0FBRyxFQUFDO0FBQTNDLFdBQWtFOEIsR0FBbEU7QUFIZCxPQUhBLENBQUosQ0FETSxlQVVOO0FBQUksUUFBQSxTQUFTLEVBQUM7QUFBZCxTQUNNWCxZQUFZLENBQUNFLEdBQWIsQ0FBa0JoQixLQUFELElBQVcsS0FBS0QsaUJBQUwsQ0FBdUJDLEtBQXZCLEVBQThCQyxJQUE5QixDQUE1QixDQUROLENBVk0sQ0FBVjtBQWNILEtBZkQsTUFlTztBQUNIQyxNQUFBQSxPQUFPLGdCQUFHLHdDQUFJLHlCQUNWLHlEQUNBLG9CQUZVLEVBRVksRUFGWixFQUdWO0FBQ0k7QUFDQTtBQUNBc0IsUUFBQUEsQ0FBQyxFQUFFQyxHQUFHLGlCQUFJO0FBQUcsVUFBQSxJQUFJLEVBQUU5QixZQUFUO0FBQXVCLFVBQUEsTUFBTSxFQUFDLFFBQTlCO0FBQXVDLFVBQUEsR0FBRyxFQUFDO0FBQTNDLFdBQWtFOEIsR0FBbEU7QUFIZCxPQUhVLENBQUosQ0FBVjtBQVNIOztBQUVELHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBeUMseUJBQUcsU0FBSCxDQUF6QyxDQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0t2QixPQURMLENBRkosQ0FESjtBQVFIOztBQXBFMEQ7Ozs4QkFBMUNOLGlCLGVBQ0U7QUFDZlcsRUFBQUEsTUFBTSxFQUFFbUIsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRFYsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBCcmlkZ2VUaWxlIGZyb20gXCIuLi8uLi9CcmlkZ2VUaWxlXCI7XG5cbmNvbnN0IEJSSURHRV9FVkVOVF9UWVBFUyA9IFtcbiAgICBcInVrLmhhbGYtc2hvdC5icmlkZ2VcIixcbiAgICAvLyBtLmJyaWRnZVxuXTtcblxuY29uc3QgQlJJREdFU19MSU5LID0gXCJodHRwczovL21hdHJpeC5vcmcvYnJpZGdlcy9cIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJpZGdlU2V0dGluZ3NUYWIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBfcmVuZGVyQnJpZGdlQ2FyZChldmVudCwgcm9vbSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoIWNvbnRlbnQgfHwgIWNvbnRlbnQuY2hhbm5lbCB8fCAhY29udGVudC5wcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxCcmlkZ2VUaWxlIHJvb209e3Jvb219IGV2PXtldmVudH0+PC9CcmlkZ2VUaWxlPjtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0QnJpZGdlU3RhdGVFdmVudHMocm9vbUlkKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3Qgcm9vbVN0YXRlID0gKGNsaWVudC5nZXRSb29tKHJvb21JZCkpLmN1cnJlbnRTdGF0ZTtcblxuICAgICAgICBjb25zdCBicmlkZ2VFdmVudHMgPSBbXS5jb25jYXQoLi4uQlJJREdFX0VWRU5UX1RZUEVTLm1hcCgodHlwZU5hbWUpID0+XG4gICAgICAgICAgICBPYmplY3QudmFsdWVzKHJvb21TdGF0ZS5ldmVudHNbdHlwZU5hbWVdIHx8IHt9KSxcbiAgICAgICAgKSk7XG5cbiAgICAgICAgcmV0dXJuIGJyaWRnZUV2ZW50cztcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIFRoaXMgc2V0dGluZ3MgdGFiIHdpbGwgb25seSBiZSBpbnZva2VkIGlmIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gcmV0dXJucyBtb3JlXG4gICAgICAgIC8vIHRoYW4gMCBldmVudHMsIHNvIG5vIHZhbGlkYXRpb24gaXMgbmVlZGVkIGF0IHRoaXMgc3RhZ2UuXG4gICAgICAgIGNvbnN0IGJyaWRnZUV2ZW50cyA9IEJyaWRnZVNldHRpbmdzVGFiLmdldEJyaWRnZVN0YXRlRXZlbnRzKHRoaXMucHJvcHMucm9vbUlkKTtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20odGhpcy5wcm9wcy5yb29tSWQpO1xuXG4gICAgICAgIGxldCBjb250ZW50ID0gbnVsbDtcblxuICAgICAgICBpZiAoYnJpZGdlRXZlbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJUaGlzIHJvb20gaXMgYnJpZGdpbmcgbWVzc2FnZXMgdG8gdGhlIGZvbGxvd2luZyBwbGF0Zm9ybXMuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8YT5MZWFybiBtb3JlLjwvYT5cIiwge30sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFdlIGRvbid0IGhhdmUgdGhpcyBsaW5rIHlldDogdGhpcyB3aWxsIHByZXZlbnQgdGhlIHRyYW5zbGF0b3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYXZpbmcgdG8gcmUtdHJhbnNsYXRlIHRoZSBzdHJpbmcgd2hlbiB3ZSBkby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGE6IHN1YiA9PiA8YSBocmVmPXtCUklER0VTX0xJTkt9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm14X1Jvb21TZXR0aW5nc0RpYWxvZ19CcmlkZ2VMaXN0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgYnJpZGdlRXZlbnRzLm1hcCgoZXZlbnQpID0+IHRoaXMuX3JlbmRlckJyaWRnZUNhcmQoZXZlbnQsIHJvb20pKSB9XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8cD57X3QoXG4gICAgICAgICAgICAgICAgXCJUaGlzIHJvb20gaXNu4oCZdCBicmlkZ2luZyBtZXNzYWdlcyB0byBhbnkgcGxhdGZvcm1zLiBcIiArXG4gICAgICAgICAgICAgICAgXCI8YT5MZWFybiBtb3JlLjwvYT5cIiwge30sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBkb24ndCBoYXZlIHRoaXMgbGluayB5ZXQ6IHRoaXMgd2lsbCBwcmV2ZW50IHRoZSB0cmFuc2xhdG9yc1xuICAgICAgICAgICAgICAgICAgICAvLyBoYXZpbmcgdG8gcmUtdHJhbnNsYXRlIHRoZSBzdHJpbmcgd2hlbiB3ZSBkby5cbiAgICAgICAgICAgICAgICAgICAgYTogc3ViID0+IDxhIGhyZWY9e0JSSURHRVNfTElOS30gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiPntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKX08L3A+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX2hlYWRpbmdcIj57X3QoXCJCcmlkZ2VzXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zZWN0aW9uIG14X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=