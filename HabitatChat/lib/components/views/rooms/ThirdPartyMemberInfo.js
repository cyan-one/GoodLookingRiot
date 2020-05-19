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

var _matrixJsSdk = require("matrix-js-sdk");

var _languageHandler = require("../../../languageHandler");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _RoomInvite = require("../../../RoomInvite");

/*
Copyright 2019 New Vector Ltd.

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
class ThirdPartyMemberInfo extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onRoomStateEvents", ev => {
      if (ev.getType() === "m.room.third_party_invite" && ev.getStateKey() === this.state.stateKey) {
        const newDisplayName = ev.getContent().display_name;
        const isInvited = (0, _RoomInvite.isValid3pidInvite)(ev);
        const newState = {
          invited: isInvited
        };
        if (newDisplayName) newState['displayName'] = newDisplayName;
        this.setState(newState);
      }
    });
    (0, _defineProperty2.default)(this, "onCancel", () => {
      _dispatcher.default.dispatch({
        action: "view_3pid_invite",
        event: null
      });
    });
    (0, _defineProperty2.default)(this, "onKickClick", () => {
      _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(this.state.roomId, "m.room.third_party_invite", {}, this.state.stateKey).catch(err => {
        console.error(err); // Revert echo because of error

        this.setState({
          invited: true
        });
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Revoke 3pid invite failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)("Failed to revoke invite"),
          description: (0, _languageHandler._t)("Could not revoke the invite. The server may be experiencing a temporary problem or " + "you do not have sufficient permissions to revoke the invite.")
        });
      }); // Local echo


      this.setState({
        invited: false
      });
    });

    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(this.props.event.getRoomId());

    const me = room.getMember(_MatrixClientPeg.MatrixClientPeg.get().getUserId());
    const powerLevels = room.currentState.getStateEvents("m.room.power_levels", "");
    let kickLevel = powerLevels ? powerLevels.getContent().kick : 50;
    if (typeof kickLevel !== 'number') kickLevel = 50;
    const sender = room.getMember(this.props.event.getSender());
    this.state = {
      stateKey: this.props.event.getStateKey(),
      roomId: this.props.event.getRoomId(),
      displayName: this.props.event.getContent().display_name,
      invited: true,
      canKick: me ? me.powerLevel > kickLevel : false,
      senderName: sender ? sender.name : this.props.event.getSender()
    };
  }

  componentDidMount()
  /*: void*/
  {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this.onRoomStateEvents);
  }

  componentWillUnmount()
  /*: void*/
  {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("RoomState.events", this.onRoomStateEvents);
    }
  }

  render() {
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    let adminTools = null;

    if (this.state.canKick && this.state.invited) {
      adminTools = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_container"
      }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Admin Tools")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MemberInfo_buttons"
      }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: "mx_MemberInfo_field",
        onClick: this.onKickClick
      }, (0, _languageHandler._t)("Revoke invite"))));
    } // We shamelessly rip off the MemberInfo styles here.


    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo",
      role: "tabpanel"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_name"
    }, /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_MemberInfo_cancel",
      onClick: this.onCancel,
      title: (0, _languageHandler._t)('Close')
    }), /*#__PURE__*/_react.default.createElement("h2", null, this.state.displayName)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_container"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_profile"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MemberInfo_profileField"
    }, (0, _languageHandler._t)("Invited by %(sender)s", {
      sender: this.state.senderName
    })))), adminTools);
  }

}

exports.default = ThirdPartyMemberInfo;
(0, _defineProperty2.default)(ThirdPartyMemberInfo, "propTypes", {
  event: _propTypes.default.instanceOf(_matrixJsSdk.MatrixEvent).isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1RoaXJkUGFydHlNZW1iZXJJbmZvLmpzIl0sIm5hbWVzIjpbIlRoaXJkUGFydHlNZW1iZXJJbmZvIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZXYiLCJnZXRUeXBlIiwiZ2V0U3RhdGVLZXkiLCJzdGF0ZSIsInN0YXRlS2V5IiwibmV3RGlzcGxheU5hbWUiLCJnZXRDb250ZW50IiwiZGlzcGxheV9uYW1lIiwiaXNJbnZpdGVkIiwibmV3U3RhdGUiLCJpbnZpdGVkIiwic2V0U3RhdGUiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImV2ZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwic2VuZFN0YXRlRXZlbnQiLCJyb29tSWQiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInJvb20iLCJnZXRSb29tIiwiZ2V0Um9vbUlkIiwibWUiLCJnZXRNZW1iZXIiLCJnZXRVc2VySWQiLCJwb3dlckxldmVscyIsImN1cnJlbnRTdGF0ZSIsImdldFN0YXRlRXZlbnRzIiwia2lja0xldmVsIiwia2ljayIsInNlbmRlciIsImdldFNlbmRlciIsImRpc3BsYXlOYW1lIiwiY2FuS2ljayIsInBvd2VyTGV2ZWwiLCJzZW5kZXJOYW1lIiwibmFtZSIsImNvbXBvbmVudERpZE1vdW50Iiwib24iLCJvblJvb21TdGF0ZUV2ZW50cyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiY2xpZW50IiwicmVtb3ZlTGlzdGVuZXIiLCJyZW5kZXIiLCJBY2Nlc3NpYmxlQnV0dG9uIiwiYWRtaW5Ub29scyIsIm9uS2lja0NsaWNrIiwib25DYW5jZWwiLCJQcm9wVHlwZXMiLCJpbnN0YW5jZU9mIiwiTWF0cml4RXZlbnQiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBMEJlLE1BQU1BLG9CQUFOLFNBQW1DQyxlQUFNQyxTQUF6QyxDQUFtRDtBQUs5REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsNkRBaUNFQyxFQUFELElBQVE7QUFDeEIsVUFBSUEsRUFBRSxDQUFDQyxPQUFILE9BQWlCLDJCQUFqQixJQUFnREQsRUFBRSxDQUFDRSxXQUFILE9BQXFCLEtBQUtDLEtBQUwsQ0FBV0MsUUFBcEYsRUFBOEY7QUFDMUYsY0FBTUMsY0FBYyxHQUFHTCxFQUFFLENBQUNNLFVBQUgsR0FBZ0JDLFlBQXZDO0FBQ0EsY0FBTUMsU0FBUyxHQUFHLG1DQUFrQlIsRUFBbEIsQ0FBbEI7QUFFQSxjQUFNUyxRQUFRLEdBQUc7QUFBQ0MsVUFBQUEsT0FBTyxFQUFFRjtBQUFWLFNBQWpCO0FBQ0EsWUFBSUgsY0FBSixFQUFvQkksUUFBUSxDQUFDLGFBQUQsQ0FBUixHQUEwQkosY0FBMUI7QUFDcEIsYUFBS00sUUFBTCxDQUFjRixRQUFkO0FBQ0g7QUFDSixLQTFDa0I7QUFBQSxvREE0Q1IsTUFBTTtBQUNiRywwQkFBSUMsUUFBSixDQUFhO0FBQ1RDLFFBQUFBLE1BQU0sRUFBRSxrQkFEQztBQUVUQyxRQUFBQSxLQUFLLEVBQUU7QUFGRSxPQUFiO0FBSUgsS0FqRGtCO0FBQUEsdURBbURMLE1BQU07QUFDaEJDLHVDQUFnQkMsR0FBaEIsR0FBc0JDLGNBQXRCLENBQXFDLEtBQUtmLEtBQUwsQ0FBV2dCLE1BQWhELEVBQXdELDJCQUF4RCxFQUFxRixFQUFyRixFQUF5RixLQUFLaEIsS0FBTCxDQUFXQyxRQUFwRyxFQUNLZ0IsS0FETCxDQUNZQyxHQUFELElBQVM7QUFDWkMsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLEdBQWQsRUFEWSxDQUdaOztBQUNBLGFBQUtWLFFBQUwsQ0FBYztBQUFDRCxVQUFBQSxPQUFPLEVBQUU7QUFBVixTQUFkO0FBRUEsY0FBTWMsV0FBVyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIscUJBQWpCLENBQXBCOztBQUNBQyx1QkFBTUMsbUJBQU4sQ0FBMEIsMkJBQTFCLEVBQXVELEVBQXZELEVBQTJESixXQUEzRCxFQUF3RTtBQUNwRUssVUFBQUEsS0FBSyxFQUFFLHlCQUFHLHlCQUFILENBRDZEO0FBRXBFQyxVQUFBQSxXQUFXLEVBQUUseUJBQ1Qsd0ZBQ0EsOERBRlM7QUFGdUQsU0FBeEU7QUFPSCxPQWZMLEVBRGdCLENBa0JoQjs7O0FBQ0EsV0FBS25CLFFBQUwsQ0FBYztBQUFDRCxRQUFBQSxPQUFPLEVBQUU7QUFBVixPQUFkO0FBQ0gsS0F2RWtCOztBQUdmLFVBQU1xQixJQUFJLEdBQUdmLGlDQUFnQkMsR0FBaEIsR0FBc0JlLE9BQXRCLENBQThCLEtBQUtqQyxLQUFMLENBQVdnQixLQUFYLENBQWlCa0IsU0FBakIsRUFBOUIsQ0FBYjs7QUFDQSxVQUFNQyxFQUFFLEdBQUdILElBQUksQ0FBQ0ksU0FBTCxDQUFlbkIsaUNBQWdCQyxHQUFoQixHQUFzQm1CLFNBQXRCLEVBQWYsQ0FBWDtBQUNBLFVBQU1DLFdBQVcsR0FBR04sSUFBSSxDQUFDTyxZQUFMLENBQWtCQyxjQUFsQixDQUFpQyxxQkFBakMsRUFBd0QsRUFBeEQsQ0FBcEI7QUFFQSxRQUFJQyxTQUFTLEdBQUdILFdBQVcsR0FBR0EsV0FBVyxDQUFDL0IsVUFBWixHQUF5Qm1DLElBQTVCLEdBQW1DLEVBQTlEO0FBQ0EsUUFBSSxPQUFPRCxTQUFQLEtBQXNCLFFBQTFCLEVBQW9DQSxTQUFTLEdBQUcsRUFBWjtBQUVwQyxVQUFNRSxNQUFNLEdBQUdYLElBQUksQ0FBQ0ksU0FBTCxDQUFlLEtBQUtwQyxLQUFMLENBQVdnQixLQUFYLENBQWlCNEIsU0FBakIsRUFBZixDQUFmO0FBRUEsU0FBS3hDLEtBQUwsR0FBYTtBQUNUQyxNQUFBQSxRQUFRLEVBQUUsS0FBS0wsS0FBTCxDQUFXZ0IsS0FBWCxDQUFpQmIsV0FBakIsRUFERDtBQUVUaUIsTUFBQUEsTUFBTSxFQUFFLEtBQUtwQixLQUFMLENBQVdnQixLQUFYLENBQWlCa0IsU0FBakIsRUFGQztBQUdUVyxNQUFBQSxXQUFXLEVBQUUsS0FBSzdDLEtBQUwsQ0FBV2dCLEtBQVgsQ0FBaUJULFVBQWpCLEdBQThCQyxZQUhsQztBQUlURyxNQUFBQSxPQUFPLEVBQUUsSUFKQTtBQUtUbUMsTUFBQUEsT0FBTyxFQUFFWCxFQUFFLEdBQUdBLEVBQUUsQ0FBQ1ksVUFBSCxHQUFnQk4sU0FBbkIsR0FBK0IsS0FMakM7QUFNVE8sTUFBQUEsVUFBVSxFQUFFTCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ00sSUFBVixHQUFpQixLQUFLakQsS0FBTCxDQUFXZ0IsS0FBWCxDQUFpQjRCLFNBQWpCO0FBTjFCLEtBQWI7QUFRSDs7QUFFRE0sRUFBQUEsaUJBQWlCO0FBQUE7QUFBUztBQUN0QmpDLHFDQUFnQkMsR0FBaEIsR0FBc0JpQyxFQUF0QixDQUF5QixrQkFBekIsRUFBNkMsS0FBS0MsaUJBQWxEO0FBQ0g7O0FBRURDLEVBQUFBLG9CQUFvQjtBQUFBO0FBQVM7QUFDekIsVUFBTUMsTUFBTSxHQUFHckMsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFFBQUlvQyxNQUFKLEVBQVk7QUFDUkEsTUFBQUEsTUFBTSxDQUFDQyxjQUFQLENBQXNCLGtCQUF0QixFQUEwQyxLQUFLSCxpQkFBL0M7QUFDSDtBQUNKOztBQTBDREksRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsZ0JBQWdCLEdBQUcvQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBRUEsUUFBSStCLFVBQVUsR0FBRyxJQUFqQjs7QUFDQSxRQUFJLEtBQUt0RCxLQUFMLENBQVcwQyxPQUFYLElBQXNCLEtBQUsxQyxLQUFMLENBQVdPLE9BQXJDLEVBQThDO0FBQzFDK0MsTUFBQUEsVUFBVSxnQkFDTjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0kseUNBQUsseUJBQUcsYUFBSCxDQUFMLENBREosZUFFSTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0ksNkJBQUMsZ0JBQUQ7QUFBa0IsUUFBQSxTQUFTLEVBQUMscUJBQTVCO0FBQWtELFFBQUEsT0FBTyxFQUFFLEtBQUtDO0FBQWhFLFNBQ0sseUJBQUcsZUFBSCxDQURMLENBREosQ0FGSixDQURKO0FBVUgsS0FmSSxDQWlCTDs7O0FBQ0Esd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQyxlQUFmO0FBQStCLE1BQUEsSUFBSSxFQUFDO0FBQXBDLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSw2QkFBQyxnQkFBRDtBQUFrQixNQUFBLFNBQVMsRUFBQyxzQkFBNUI7QUFDSSxNQUFBLE9BQU8sRUFBRSxLQUFLQyxRQURsQjtBQUVJLE1BQUEsS0FBSyxFQUFFLHlCQUFHLE9BQUg7QUFGWCxNQURKLGVBS0kseUNBQUssS0FBS3hELEtBQUwsQ0FBV3lDLFdBQWhCLENBTEosQ0FESixlQVFJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0sseUJBQUcsdUJBQUgsRUFBNEI7QUFBQ0YsTUFBQUEsTUFBTSxFQUFFLEtBQUt2QyxLQUFMLENBQVc0QztBQUFwQixLQUE1QixDQURMLENBREosQ0FESixDQVJKLEVBZUtVLFVBZkwsQ0FESjtBQW1CSDs7QUFuSDZEOzs7OEJBQTdDOUQsb0IsZUFDRTtBQUNmb0IsRUFBQUEsS0FBSyxFQUFFNkMsbUJBQVVDLFVBQVYsQ0FBcUJDLHdCQUFyQixFQUFrQ0M7QUFEMUIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZC5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQge01hdHJpeEV2ZW50fSBmcm9tIFwibWF0cml4LWpzLXNka1wiO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uLy4uL01vZGFsXCI7XG5pbXBvcnQge2lzVmFsaWQzcGlkSW52aXRlfSBmcm9tIFwiLi4vLi4vLi4vUm9vbUludml0ZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaGlyZFBhcnR5TWVtYmVySW5mbyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZXZlbnQ6IFByb3BUeXBlcy5pbnN0YW5jZU9mKE1hdHJpeEV2ZW50KS5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKHRoaXMucHJvcHMuZXZlbnQuZ2V0Um9vbUlkKCkpO1xuICAgICAgICBjb25zdCBtZSA9IHJvb20uZ2V0TWVtYmVyKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSk7XG4gICAgICAgIGNvbnN0IHBvd2VyTGV2ZWxzID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoXCJtLnJvb20ucG93ZXJfbGV2ZWxzXCIsIFwiXCIpO1xuXG4gICAgICAgIGxldCBraWNrTGV2ZWwgPSBwb3dlckxldmVscyA/IHBvd2VyTGV2ZWxzLmdldENvbnRlbnQoKS5raWNrIDogNTA7XG4gICAgICAgIGlmICh0eXBlb2Yoa2lja0xldmVsKSAhPT0gJ251bWJlcicpIGtpY2tMZXZlbCA9IDUwO1xuXG4gICAgICAgIGNvbnN0IHNlbmRlciA9IHJvb20uZ2V0TWVtYmVyKHRoaXMucHJvcHMuZXZlbnQuZ2V0U2VuZGVyKCkpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBzdGF0ZUtleTogdGhpcy5wcm9wcy5ldmVudC5nZXRTdGF0ZUtleSgpLFxuICAgICAgICAgICAgcm9vbUlkOiB0aGlzLnByb3BzLmV2ZW50LmdldFJvb21JZCgpLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IHRoaXMucHJvcHMuZXZlbnQuZ2V0Q29udGVudCgpLmRpc3BsYXlfbmFtZSxcbiAgICAgICAgICAgIGludml0ZWQ6IHRydWUsXG4gICAgICAgICAgICBjYW5LaWNrOiBtZSA/IG1lLnBvd2VyTGV2ZWwgPiBraWNrTGV2ZWwgOiBmYWxzZSxcbiAgICAgICAgICAgIHNlbmRlck5hbWU6IHNlbmRlciA/IHNlbmRlci5uYW1lIDogdGhpcy5wcm9wcy5ldmVudC5nZXRTZW5kZXIoKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpOiB2b2lkIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBpZiAoY2xpZW50KSB7XG4gICAgICAgICAgICBjbGllbnQucmVtb3ZlTGlzdGVuZXIoXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Sb29tU3RhdGVFdmVudHMgPSAoZXYpID0+IHtcbiAgICAgICAgaWYgKGV2LmdldFR5cGUoKSA9PT0gXCJtLnJvb20udGhpcmRfcGFydHlfaW52aXRlXCIgJiYgZXYuZ2V0U3RhdGVLZXkoKSA9PT0gdGhpcy5zdGF0ZS5zdGF0ZUtleSkge1xuICAgICAgICAgICAgY29uc3QgbmV3RGlzcGxheU5hbWUgPSBldi5nZXRDb250ZW50KCkuZGlzcGxheV9uYW1lO1xuICAgICAgICAgICAgY29uc3QgaXNJbnZpdGVkID0gaXNWYWxpZDNwaWRJbnZpdGUoZXYpO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHtpbnZpdGVkOiBpc0ludml0ZWR9O1xuICAgICAgICAgICAgaWYgKG5ld0Rpc3BsYXlOYW1lKSBuZXdTdGF0ZVsnZGlzcGxheU5hbWUnXSA9IG5ld0Rpc3BsYXlOYW1lO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25DYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246IFwidmlld18zcGlkX2ludml0ZVwiLFxuICAgICAgICAgICAgZXZlbnQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBvbktpY2tDbGljayA9ICgpID0+IHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNlbmRTdGF0ZUV2ZW50KHRoaXMuc3RhdGUucm9vbUlkLCBcIm0ucm9vbS50aGlyZF9wYXJ0eV9pbnZpdGVcIiwge30sIHRoaXMuc3RhdGUuc3RhdGVLZXkpXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcblxuICAgICAgICAgICAgICAgIC8vIFJldmVydCBlY2hvIGJlY2F1c2Ugb2YgZXJyb3JcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpbnZpdGVkOiB0cnVlfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1Jldm9rZSAzcGlkIGludml0ZSBmYWlsZWQnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRmFpbGVkIHRvIHJldm9rZSBpbnZpdGVcIiksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQ291bGQgbm90IHJldm9rZSB0aGUgaW52aXRlLiBUaGUgc2VydmVyIG1heSBiZSBleHBlcmllbmNpbmcgYSB0ZW1wb3JhcnkgcHJvYmxlbSBvciBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlvdSBkbyBub3QgaGF2ZSBzdWZmaWNpZW50IHBlcm1pc3Npb25zIHRvIHJldm9rZSB0aGUgaW52aXRlLlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTG9jYWwgZWNob1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtpbnZpdGVkOiBmYWxzZX0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcblxuICAgICAgICBsZXQgYWRtaW5Ub29scyA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNhbktpY2sgJiYgdGhpcy5zdGF0ZS5pbnZpdGVkKSB7XG4gICAgICAgICAgICBhZG1pblRvb2xzID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPntfdChcIkFkbWluIFRvb2xzXCIpfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX2ZpZWxkXCIgb25DbGljaz17dGhpcy5vbktpY2tDbGlja30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiUmV2b2tlIGludml0ZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Ugc2hhbWVsZXNzbHkgcmlwIG9mZiB0aGUgTWVtYmVySW5mbyBzdHlsZXMgaGVyZS5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb1wiIHJvbGU9XCJ0YWJwYW5lbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19uYW1lXCI+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X01lbWJlckluZm9fY2FuY2VsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17X3QoJ0Nsb3NlJyl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxoMj57dGhpcy5zdGF0ZS5kaXNwbGF5TmFtZX08L2gyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NZW1iZXJJbmZvX3Byb2ZpbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWVtYmVySW5mb19wcm9maWxlRmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJJbnZpdGVkIGJ5ICUoc2VuZGVyKXNcIiwge3NlbmRlcjogdGhpcy5zdGF0ZS5zZW5kZXJOYW1lfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge2FkbWluVG9vbHN9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=