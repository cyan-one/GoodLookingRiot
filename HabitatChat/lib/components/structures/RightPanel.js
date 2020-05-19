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

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _ratelimitedfunc = _interopRequireDefault(require("../../ratelimitedfunc"));

var _GroupAddressPicker = require("../../GroupAddressPicker");

var _GroupStore = _interopRequireDefault(require("../../stores/GroupStore"));

var _SettingsStore = _interopRequireDefault(require("../../settings/SettingsStore"));

var _RightPanelStorePhases = require("../../stores/RightPanelStorePhases");

var _RightPanelStore = _interopRequireDefault(require("../../stores/RightPanelStore"));

var _MatrixClientContext = _interopRequireDefault(require("../../contexts/MatrixClientContext"));

var _actions = require("../../dispatcher/actions");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017, 2018 New Vector Ltd
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
class RightPanel extends _react.default.Component {
  static get propTypes() {
    return {
      roomId: _propTypes.default.string,
      // if showing panels for a given room, this is set
      groupId: _propTypes.default.string,
      // if showing panels for a given group, this is set
      user: _propTypes.default.object // used if we know the user ahead of opening the panel

    };
  }

  constructor(props) {
    super(props);
    this.state = {
      phase: this._getPhaseFromProps(),
      isUserPrivilegedInGroup: null,
      member: this._getUserForPanel(),
      verificationRequest: _RightPanelStore.default.getSharedInstance().roomPanelPhaseParams.verificationRequest
    };
    this.onAction = this.onAction.bind(this);
    this.onRoomStateMember = this.onRoomStateMember.bind(this);
    this.onGroupStoreUpdated = this.onGroupStoreUpdated.bind(this);
    this.onInviteToGroupButtonClick = this.onInviteToGroupButtonClick.bind(this);
    this.onAddRoomToGroupButtonClick = this.onAddRoomToGroupButtonClick.bind(this);
    this._delayedUpdate = new _ratelimitedfunc.default(() => {
      this.forceUpdate();
    }, 500);
  } // Helper function to split out the logic for _getPhaseFromProps() and the constructor
  // as both are called at the same time in the constructor.


  _getUserForPanel() {
    if (this.state && this.state.member) return this.state.member;

    const lastParams = _RightPanelStore.default.getSharedInstance().roomPanelPhaseParams;

    return this.props.user || lastParams['member'];
  } // gets the current phase from the props and also maybe the store


  _getPhaseFromProps() {
    const rps = _RightPanelStore.default.getSharedInstance();

    const userForPanel = this._getUserForPanel();

    if (this.props.groupId) {
      if (!_RightPanelStorePhases.RIGHT_PANEL_PHASES_NO_ARGS.includes(rps.groupPanelPhase)) {
        _dispatcher.default.dispatch({
          action: "set_right_panel_phase",
          phase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList
        });

        return _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList;
      }

      return rps.groupPanelPhase;
    } else if (userForPanel) {
      // XXX FIXME AAAAAARGH: What is going on with this class!? It takes some of its state
      // from its props and some from a store, except if the contents of the store changes
      // while it's mounted in which case it replaces all of its state with that of the store,
      // except it uses a dispatch instead of a normal store listener?
      // Unfortunately rewriting this would almost certainly break showing the right panel
      // in some of the many cases, and I don't have time to re-architect it and test all
      // the flows now, so adding yet another special case so if the store thinks there is
      // a verification going on for the member we're displaying, we show that, otherwise
      // we race if a verification is started while the panel isn't displayed because we're
      // not mounted in time to get the dispatch.
      // Until then, let this code serve as a warning from history.
      if (rps.roomPanelPhaseParams.member && userForPanel.userId === rps.roomPanelPhaseParams.member.userId && rps.roomPanelPhaseParams.verificationRequest) {
        return rps.roomPanelPhase;
      }

      return _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo;
    } else {
      if (!_RightPanelStorePhases.RIGHT_PANEL_PHASES_NO_ARGS.includes(rps.roomPanelPhase)) {
        _dispatcher.default.dispatch({
          action: "set_right_panel_phase",
          phase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberList
        });

        return _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberList;
      }

      return rps.roomPanelPhase;
    }
  }

  componentDidMount() {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    const cli = this.context;
    cli.on("RoomState.members", this.onRoomStateMember);

    this._initGroupStore(this.props.groupId);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);

    if (this.context) {
      this.context.removeListener("RoomState.members", this.onRoomStateMember);
    }

    this._unregisterGroupStore(this.props.groupId);
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(newProps) {
    // eslint-disable-line camelcase
    if (newProps.groupId !== this.props.groupId) {
      this._unregisterGroupStore(this.props.groupId);

      this._initGroupStore(newProps.groupId);
    }
  }

  _initGroupStore(groupId) {
    if (!groupId) return;

    _GroupStore.default.registerListener(groupId, this.onGroupStoreUpdated);
  }

  _unregisterGroupStore() {
    _GroupStore.default.unregisterListener(this.onGroupStoreUpdated);
  }

  onGroupStoreUpdated() {
    this.setState({
      isUserPrivilegedInGroup: _GroupStore.default.isUserPrivileged(this.props.groupId)
    });
  }

  onInviteToGroupButtonClick() {
    (0, _GroupAddressPicker.showGroupInviteDialog)(this.props.groupId).then(() => {
      this.setState({
        phase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList
      });
    });
  }

  onAddRoomToGroupButtonClick() {
    (0, _GroupAddressPicker.showGroupAddRoomDialog)(this.props.groupId).then(() => {
      this.forceUpdate();
    });
  }

  onRoomStateMember(ev, state, member) {
    if (member.roomId !== this.props.roomId) {
      return;
    } // redraw the badge on the membership list


    if (this.state.phase === _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberList && member.roomId === this.props.roomId) {
      this._delayedUpdate();
    } else if (this.state.phase === _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo && member.roomId === this.props.roomId && member.userId === this.state.member.userId) {
      // refresh the member info (e.g. new power level)
      this._delayedUpdate();
    }
  }

  onAction(payload) {
    if (payload.action === "after_right_panel_phase_change") {
      this.setState({
        phase: payload.phase,
        groupRoomId: payload.groupRoomId,
        groupId: payload.groupId,
        member: payload.member,
        event: payload.event,
        verificationRequest: payload.verificationRequest,
        verificationRequestPromise: payload.verificationRequestPromise
      });
    }
  }

  render() {
    const MemberList = sdk.getComponent('rooms.MemberList');
    const MemberInfo = sdk.getComponent('rooms.MemberInfo');
    const UserInfo = sdk.getComponent('right_panel.UserInfo');
    const ThirdPartyMemberInfo = sdk.getComponent('rooms.ThirdPartyMemberInfo');
    const NotificationPanel = sdk.getComponent('structures.NotificationPanel');
    const FilePanel = sdk.getComponent('structures.FilePanel');
    const GroupMemberList = sdk.getComponent('groups.GroupMemberList');
    const GroupMemberInfo = sdk.getComponent('groups.GroupMemberInfo');
    const GroupRoomList = sdk.getComponent('groups.GroupRoomList');
    const GroupRoomInfo = sdk.getComponent('groups.GroupRoomInfo');

    let panel = /*#__PURE__*/_react.default.createElement("div", null);

    switch (this.state.phase) {
      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberList:
        if (this.props.roomId) {
          panel = /*#__PURE__*/_react.default.createElement(MemberList, {
            roomId: this.props.roomId,
            key: this.props.roomId
          });
        }

        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList:
        if (this.props.groupId) {
          panel = /*#__PURE__*/_react.default.createElement(GroupMemberList, {
            groupId: this.props.groupId,
            key: this.props.groupId
          });
        }

        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupRoomList:
        panel = /*#__PURE__*/_react.default.createElement(GroupRoomList, {
          groupId: this.props.groupId,
          key: this.props.groupId
        });
        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo:
      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel:
        if (_SettingsStore.default.getValue("feature_cross_signing")) {
          const onClose = () => {
            // XXX: There are three different ways of 'closing' this panel depending on what state
            // things are in... this knows far more than it should do about the state of the rest
            // of the app and is generally a bit silly.
            if (this.props.user) {
              // If we have a user prop then we're displaying a user from the 'user' page type
              // in LoggedInView, so need to change the page type to close the panel (we switch
              // to the home page which is not obviously the correct thing to do, but I'm not sure
              // anything else is - we could hide the close button altogether?)
              _dispatcher.default.dispatch({
                action: "view_home_page"
              });
            } else {
              // Otherwise we have got our user from RoomViewStore which means we're being shown
              // within a room, so go back to the member panel if we were in the encryption panel,
              // or the member list if we were in the member panel... phew.
              _dispatcher.default.dispatch({
                action: _actions.Action.ViewUser,
                member: this.state.phase === _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel ? this.state.member : null
              });
            }
          };

          panel = /*#__PURE__*/_react.default.createElement(UserInfo, {
            user: this.state.member,
            roomId: this.props.roomId,
            key: this.props.roomId || this.state.member.userId,
            onClose: onClose,
            phase: this.state.phase,
            verificationRequest: this.state.verificationRequest,
            verificationRequestPromise: this.state.verificationRequestPromise
          });
        } else {
          panel = /*#__PURE__*/_react.default.createElement(MemberInfo, {
            member: this.state.member,
            key: this.props.roomId || this.state.member.userId
          });
        }

        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.Room3pidMemberInfo:
        panel = /*#__PURE__*/_react.default.createElement(ThirdPartyMemberInfo, {
          event: this.state.event,
          key: this.props.roomId
        });
        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberInfo:
        if (_SettingsStore.default.getValue("feature_cross_signing")) {
          const onClose = () => {
            _dispatcher.default.dispatch({
              action: _actions.Action.ViewUser,
              member: null
            });
          };

          panel = /*#__PURE__*/_react.default.createElement(UserInfo, {
            user: this.state.member,
            groupId: this.props.groupId,
            key: this.state.member.userId,
            onClose: onClose
          });
        } else {
          panel = /*#__PURE__*/_react.default.createElement(GroupMemberInfo, {
            groupMember: this.state.member,
            groupId: this.props.groupId,
            key: this.state.member.user_id
          });
        }

        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupRoomInfo:
        panel = /*#__PURE__*/_react.default.createElement(GroupRoomInfo, {
          groupRoomId: this.state.groupRoomId,
          groupId: this.props.groupId,
          key: this.state.groupRoomId
        });
        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.NotificationPanel:
        panel = /*#__PURE__*/_react.default.createElement(NotificationPanel, null);
        break;

      case _RightPanelStorePhases.RIGHT_PANEL_PHASES.FilePanel:
        panel = /*#__PURE__*/_react.default.createElement(FilePanel, {
          roomId: this.props.roomId,
          resizeNotifier: this.props.resizeNotifier
        });
        break;
    }

    const classes = (0, _classnames.default)("mx_RightPanel", "mx_fadable", {
      "collapsed": this.props.collapsed,
      "mx_fadable_faded": this.props.disabled,
      "dark-panel": true
    });
    return /*#__PURE__*/_react.default.createElement("aside", {
      className: classes,
      id: "mx_RightPanel"
    }, panel);
  }

}

exports.default = RightPanel;
(0, _defineProperty2.default)(RightPanel, "contextType", _MatrixClientContext.default);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvUmlnaHRQYW5lbC5qcyJdLCJuYW1lcyI6WyJSaWdodFBhbmVsIiwiUmVhY3QiLCJDb21wb25lbnQiLCJwcm9wVHlwZXMiLCJyb29tSWQiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJncm91cElkIiwidXNlciIsIm9iamVjdCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsInBoYXNlIiwiX2dldFBoYXNlRnJvbVByb3BzIiwiaXNVc2VyUHJpdmlsZWdlZEluR3JvdXAiLCJtZW1iZXIiLCJfZ2V0VXNlckZvclBhbmVsIiwidmVyaWZpY2F0aW9uUmVxdWVzdCIsIlJpZ2h0UGFuZWxTdG9yZSIsImdldFNoYXJlZEluc3RhbmNlIiwicm9vbVBhbmVsUGhhc2VQYXJhbXMiLCJvbkFjdGlvbiIsImJpbmQiLCJvblJvb21TdGF0ZU1lbWJlciIsIm9uR3JvdXBTdG9yZVVwZGF0ZWQiLCJvbkludml0ZVRvR3JvdXBCdXR0b25DbGljayIsIm9uQWRkUm9vbVRvR3JvdXBCdXR0b25DbGljayIsIl9kZWxheWVkVXBkYXRlIiwiUmF0ZUxpbWl0ZWRGdW5jIiwiZm9yY2VVcGRhdGUiLCJsYXN0UGFyYW1zIiwicnBzIiwidXNlckZvclBhbmVsIiwiUklHSFRfUEFORUxfUEhBU0VTX05PX0FSR1MiLCJpbmNsdWRlcyIsImdyb3VwUGFuZWxQaGFzZSIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwiUklHSFRfUEFORUxfUEhBU0VTIiwiR3JvdXBNZW1iZXJMaXN0IiwidXNlcklkIiwicm9vbVBhbmVsUGhhc2UiLCJSb29tTWVtYmVySW5mbyIsIlJvb21NZW1iZXJMaXN0IiwiY29tcG9uZW50RGlkTW91bnQiLCJkaXNwYXRjaGVyUmVmIiwicmVnaXN0ZXIiLCJjbGkiLCJjb250ZXh0Iiwib24iLCJfaW5pdEdyb3VwU3RvcmUiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInVucmVnaXN0ZXIiLCJyZW1vdmVMaXN0ZW5lciIsIl91bnJlZ2lzdGVyR3JvdXBTdG9yZSIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV3UHJvcHMiLCJHcm91cFN0b3JlIiwicmVnaXN0ZXJMaXN0ZW5lciIsInVucmVnaXN0ZXJMaXN0ZW5lciIsInNldFN0YXRlIiwiaXNVc2VyUHJpdmlsZWdlZCIsInRoZW4iLCJldiIsInBheWxvYWQiLCJncm91cFJvb21JZCIsImV2ZW50IiwidmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2UiLCJyZW5kZXIiLCJNZW1iZXJMaXN0Iiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTWVtYmVySW5mbyIsIlVzZXJJbmZvIiwiVGhpcmRQYXJ0eU1lbWJlckluZm8iLCJOb3RpZmljYXRpb25QYW5lbCIsIkZpbGVQYW5lbCIsIkdyb3VwTWVtYmVySW5mbyIsIkdyb3VwUm9vbUxpc3QiLCJHcm91cFJvb21JbmZvIiwicGFuZWwiLCJFbmNyeXB0aW9uUGFuZWwiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJvbkNsb3NlIiwiQWN0aW9uIiwiVmlld1VzZXIiLCJSb29tM3BpZE1lbWJlckluZm8iLCJ1c2VyX2lkIiwicmVzaXplTm90aWZpZXIiLCJjbGFzc2VzIiwiY29sbGFwc2VkIiwiZGlzYWJsZWQiLCJNYXRyaXhDbGllbnRDb250ZXh0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWhDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtDZSxNQUFNQSxVQUFOLFNBQXlCQyxlQUFNQyxTQUEvQixDQUF5QztBQUNwRCxhQUFXQyxTQUFYLEdBQXVCO0FBQ25CLFdBQU87QUFDSEMsTUFBQUEsTUFBTSxFQUFFQyxtQkFBVUMsTUFEZjtBQUN1QjtBQUMxQkMsTUFBQUEsT0FBTyxFQUFFRixtQkFBVUMsTUFGaEI7QUFFd0I7QUFDM0JFLE1BQUFBLElBQUksRUFBRUgsbUJBQVVJLE1BSGIsQ0FHcUI7O0FBSHJCLEtBQVA7QUFLSDs7QUFJREMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBQ0EsU0FBS0MsS0FBTCxHQUFhO0FBQ1RDLE1BQUFBLEtBQUssRUFBRSxLQUFLQyxrQkFBTCxFQURFO0FBRVRDLE1BQUFBLHVCQUF1QixFQUFFLElBRmhCO0FBR1RDLE1BQUFBLE1BQU0sRUFBRSxLQUFLQyxnQkFBTCxFQUhDO0FBSVRDLE1BQUFBLG1CQUFtQixFQUFFQyx5QkFBZ0JDLGlCQUFoQixHQUFvQ0Msb0JBQXBDLENBQXlESDtBQUpyRSxLQUFiO0FBTUEsU0FBS0ksUUFBTCxHQUFnQixLQUFLQSxRQUFMLENBQWNDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBaEI7QUFDQSxTQUFLQyxpQkFBTCxHQUF5QixLQUFLQSxpQkFBTCxDQUF1QkQsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBekI7QUFDQSxTQUFLRSxtQkFBTCxHQUEyQixLQUFLQSxtQkFBTCxDQUF5QkYsSUFBekIsQ0FBOEIsSUFBOUIsQ0FBM0I7QUFDQSxTQUFLRywwQkFBTCxHQUFrQyxLQUFLQSwwQkFBTCxDQUFnQ0gsSUFBaEMsQ0FBcUMsSUFBckMsQ0FBbEM7QUFDQSxTQUFLSSwyQkFBTCxHQUFtQyxLQUFLQSwyQkFBTCxDQUFpQ0osSUFBakMsQ0FBc0MsSUFBdEMsQ0FBbkM7QUFFQSxTQUFLSyxjQUFMLEdBQXNCLElBQUlDLHdCQUFKLENBQW9CLE1BQU07QUFDNUMsV0FBS0MsV0FBTDtBQUNILEtBRnFCLEVBRW5CLEdBRm1CLENBQXRCO0FBR0gsR0E1Qm1ELENBOEJwRDtBQUNBOzs7QUFDQWIsRUFBQUEsZ0JBQWdCLEdBQUc7QUFDZixRQUFJLEtBQUtMLEtBQUwsSUFBYyxLQUFLQSxLQUFMLENBQVdJLE1BQTdCLEVBQXFDLE9BQU8sS0FBS0osS0FBTCxDQUFXSSxNQUFsQjs7QUFDckMsVUFBTWUsVUFBVSxHQUFHWix5QkFBZ0JDLGlCQUFoQixHQUFvQ0Msb0JBQXZEOztBQUNBLFdBQU8sS0FBS1YsS0FBTCxDQUFXSCxJQUFYLElBQW1CdUIsVUFBVSxDQUFDLFFBQUQsQ0FBcEM7QUFDSCxHQXBDbUQsQ0FzQ3BEOzs7QUFDQWpCLEVBQUFBLGtCQUFrQixHQUFHO0FBQ2pCLFVBQU1rQixHQUFHLEdBQUdiLHlCQUFnQkMsaUJBQWhCLEVBQVo7O0FBQ0EsVUFBTWEsWUFBWSxHQUFHLEtBQUtoQixnQkFBTCxFQUFyQjs7QUFDQSxRQUFJLEtBQUtOLEtBQUwsQ0FBV0osT0FBZixFQUF3QjtBQUNwQixVQUFJLENBQUMyQixrREFBMkJDLFFBQTNCLENBQW9DSCxHQUFHLENBQUNJLGVBQXhDLENBQUwsRUFBK0Q7QUFDM0RDLDRCQUFJQyxRQUFKLENBQWE7QUFBQ0MsVUFBQUEsTUFBTSxFQUFFLHVCQUFUO0FBQWtDMUIsVUFBQUEsS0FBSyxFQUFFMkIsMENBQW1CQztBQUE1RCxTQUFiOztBQUNBLGVBQU9ELDBDQUFtQkMsZUFBMUI7QUFDSDs7QUFDRCxhQUFPVCxHQUFHLENBQUNJLGVBQVg7QUFDSCxLQU5ELE1BTU8sSUFBSUgsWUFBSixFQUFrQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFDSUQsR0FBRyxDQUFDWCxvQkFBSixDQUF5QkwsTUFBekIsSUFDQWlCLFlBQVksQ0FBQ1MsTUFBYixLQUF3QlYsR0FBRyxDQUFDWCxvQkFBSixDQUF5QkwsTUFBekIsQ0FBZ0MwQixNQUR4RCxJQUVBVixHQUFHLENBQUNYLG9CQUFKLENBQXlCSCxtQkFIN0IsRUFJRTtBQUNFLGVBQU9jLEdBQUcsQ0FBQ1csY0FBWDtBQUNIOztBQUNELGFBQU9ILDBDQUFtQkksY0FBMUI7QUFDSCxLQXBCTSxNQW9CQTtBQUNILFVBQUksQ0FBQ1Ysa0RBQTJCQyxRQUEzQixDQUFvQ0gsR0FBRyxDQUFDVyxjQUF4QyxDQUFMLEVBQThEO0FBQzFETiw0QkFBSUMsUUFBSixDQUFhO0FBQUNDLFVBQUFBLE1BQU0sRUFBRSx1QkFBVDtBQUFrQzFCLFVBQUFBLEtBQUssRUFBRTJCLDBDQUFtQks7QUFBNUQsU0FBYjs7QUFDQSxlQUFPTCwwQ0FBbUJLLGNBQTFCO0FBQ0g7O0FBQ0QsYUFBT2IsR0FBRyxDQUFDVyxjQUFYO0FBQ0g7QUFDSjs7QUFFREcsRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEIsU0FBS0MsYUFBTCxHQUFxQlYsb0JBQUlXLFFBQUosQ0FBYSxLQUFLMUIsUUFBbEIsQ0FBckI7QUFDQSxVQUFNMkIsR0FBRyxHQUFHLEtBQUtDLE9BQWpCO0FBQ0FELElBQUFBLEdBQUcsQ0FBQ0UsRUFBSixDQUFPLG1CQUFQLEVBQTRCLEtBQUszQixpQkFBakM7O0FBQ0EsU0FBSzRCLGVBQUwsQ0FBcUIsS0FBS3pDLEtBQUwsQ0FBV0osT0FBaEM7QUFDSDs7QUFFRDhDLEVBQUFBLG9CQUFvQixHQUFHO0FBQ25CaEIsd0JBQUlpQixVQUFKLENBQWUsS0FBS1AsYUFBcEI7O0FBQ0EsUUFBSSxLQUFLRyxPQUFULEVBQWtCO0FBQ2QsV0FBS0EsT0FBTCxDQUFhSyxjQUFiLENBQTRCLG1CQUE1QixFQUFpRCxLQUFLL0IsaUJBQXREO0FBQ0g7O0FBQ0QsU0FBS2dDLHFCQUFMLENBQTJCLEtBQUs3QyxLQUFMLENBQVdKLE9BQXRDO0FBQ0gsR0ExRm1ELENBNEZwRDs7O0FBQ0FrRCxFQUFBQSxnQ0FBZ0MsQ0FBQ0MsUUFBRCxFQUFXO0FBQUU7QUFDekMsUUFBSUEsUUFBUSxDQUFDbkQsT0FBVCxLQUFxQixLQUFLSSxLQUFMLENBQVdKLE9BQXBDLEVBQTZDO0FBQ3pDLFdBQUtpRCxxQkFBTCxDQUEyQixLQUFLN0MsS0FBTCxDQUFXSixPQUF0Qzs7QUFDQSxXQUFLNkMsZUFBTCxDQUFxQk0sUUFBUSxDQUFDbkQsT0FBOUI7QUFDSDtBQUNKOztBQUVENkMsRUFBQUEsZUFBZSxDQUFDN0MsT0FBRCxFQUFVO0FBQ3JCLFFBQUksQ0FBQ0EsT0FBTCxFQUFjOztBQUNkb0Qsd0JBQVdDLGdCQUFYLENBQTRCckQsT0FBNUIsRUFBcUMsS0FBS2tCLG1CQUExQztBQUNIOztBQUVEK0IsRUFBQUEscUJBQXFCLEdBQUc7QUFDcEJHLHdCQUFXRSxrQkFBWCxDQUE4QixLQUFLcEMsbUJBQW5DO0FBQ0g7O0FBRURBLEVBQUFBLG1CQUFtQixHQUFHO0FBQ2xCLFNBQUtxQyxRQUFMLENBQWM7QUFDVi9DLE1BQUFBLHVCQUF1QixFQUFFNEMsb0JBQVdJLGdCQUFYLENBQTRCLEtBQUtwRCxLQUFMLENBQVdKLE9BQXZDO0FBRGYsS0FBZDtBQUdIOztBQUVEbUIsRUFBQUEsMEJBQTBCLEdBQUc7QUFDekIsbURBQXNCLEtBQUtmLEtBQUwsQ0FBV0osT0FBakMsRUFBMEN5RCxJQUExQyxDQUErQyxNQUFNO0FBQ2pELFdBQUtGLFFBQUwsQ0FBYztBQUNWakQsUUFBQUEsS0FBSyxFQUFFMkIsMENBQW1CQztBQURoQixPQUFkO0FBR0gsS0FKRDtBQUtIOztBQUVEZCxFQUFBQSwyQkFBMkIsR0FBRztBQUMxQixvREFBdUIsS0FBS2hCLEtBQUwsQ0FBV0osT0FBbEMsRUFBMkN5RCxJQUEzQyxDQUFnRCxNQUFNO0FBQ2xELFdBQUtsQyxXQUFMO0FBQ0gsS0FGRDtBQUdIOztBQUVETixFQUFBQSxpQkFBaUIsQ0FBQ3lDLEVBQUQsRUFBS3JELEtBQUwsRUFBWUksTUFBWixFQUFvQjtBQUNqQyxRQUFJQSxNQUFNLENBQUNaLE1BQVAsS0FBa0IsS0FBS08sS0FBTCxDQUFXUCxNQUFqQyxFQUF5QztBQUNyQztBQUNILEtBSGdDLENBSWpDOzs7QUFDQSxRQUFJLEtBQUtRLEtBQUwsQ0FBV0MsS0FBWCxLQUFxQjJCLDBDQUFtQkssY0FBeEMsSUFBMEQ3QixNQUFNLENBQUNaLE1BQVAsS0FBa0IsS0FBS08sS0FBTCxDQUFXUCxNQUEzRixFQUFtRztBQUMvRixXQUFLd0IsY0FBTDtBQUNILEtBRkQsTUFFTyxJQUFJLEtBQUtoQixLQUFMLENBQVdDLEtBQVgsS0FBcUIyQiwwQ0FBbUJJLGNBQXhDLElBQTBENUIsTUFBTSxDQUFDWixNQUFQLEtBQWtCLEtBQUtPLEtBQUwsQ0FBV1AsTUFBdkYsSUFDSFksTUFBTSxDQUFDMEIsTUFBUCxLQUFrQixLQUFLOUIsS0FBTCxDQUFXSSxNQUFYLENBQWtCMEIsTUFEckMsRUFDNkM7QUFDaEQ7QUFDQSxXQUFLZCxjQUFMO0FBQ0g7QUFDSjs7QUFFRE4sRUFBQUEsUUFBUSxDQUFDNEMsT0FBRCxFQUFVO0FBQ2QsUUFBSUEsT0FBTyxDQUFDM0IsTUFBUixLQUFtQixnQ0FBdkIsRUFBeUQ7QUFDckQsV0FBS3VCLFFBQUwsQ0FBYztBQUNWakQsUUFBQUEsS0FBSyxFQUFFcUQsT0FBTyxDQUFDckQsS0FETDtBQUVWc0QsUUFBQUEsV0FBVyxFQUFFRCxPQUFPLENBQUNDLFdBRlg7QUFHVjVELFFBQUFBLE9BQU8sRUFBRTJELE9BQU8sQ0FBQzNELE9BSFA7QUFJVlMsUUFBQUEsTUFBTSxFQUFFa0QsT0FBTyxDQUFDbEQsTUFKTjtBQUtWb0QsUUFBQUEsS0FBSyxFQUFFRixPQUFPLENBQUNFLEtBTEw7QUFNVmxELFFBQUFBLG1CQUFtQixFQUFFZ0QsT0FBTyxDQUFDaEQsbUJBTm5CO0FBT1ZtRCxRQUFBQSwwQkFBMEIsRUFBRUgsT0FBTyxDQUFDRztBQVAxQixPQUFkO0FBU0g7QUFDSjs7QUFFREMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQW5CO0FBQ0EsVUFBTUMsVUFBVSxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQW5CO0FBQ0EsVUFBTUUsUUFBUSxHQUFHSCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsc0JBQWpCLENBQWpCO0FBQ0EsVUFBTUcsb0JBQW9CLEdBQUdKLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw0QkFBakIsQ0FBN0I7QUFDQSxVQUFNSSxpQkFBaUIsR0FBR0wsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDhCQUFqQixDQUExQjtBQUNBLFVBQU1LLFNBQVMsR0FBR04sR0FBRyxDQUFDQyxZQUFKLENBQWlCLHNCQUFqQixDQUFsQjtBQUVBLFVBQU1oQyxlQUFlLEdBQUcrQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXhCO0FBQ0EsVUFBTU0sZUFBZSxHQUFHUCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXhCO0FBQ0EsVUFBTU8sYUFBYSxHQUFHUixHQUFHLENBQUNDLFlBQUosQ0FBaUIsc0JBQWpCLENBQXRCO0FBQ0EsVUFBTVEsYUFBYSxHQUFHVCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsc0JBQWpCLENBQXRCOztBQUVBLFFBQUlTLEtBQUssZ0JBQUcseUNBQVo7O0FBRUEsWUFBUSxLQUFLdEUsS0FBTCxDQUFXQyxLQUFuQjtBQUNJLFdBQUsyQiwwQ0FBbUJLLGNBQXhCO0FBQ0ksWUFBSSxLQUFLbEMsS0FBTCxDQUFXUCxNQUFmLEVBQXVCO0FBQ25COEUsVUFBQUEsS0FBSyxnQkFBRyw2QkFBQyxVQUFEO0FBQVksWUFBQSxNQUFNLEVBQUUsS0FBS3ZFLEtBQUwsQ0FBV1AsTUFBL0I7QUFBdUMsWUFBQSxHQUFHLEVBQUUsS0FBS08sS0FBTCxDQUFXUDtBQUF2RCxZQUFSO0FBQ0g7O0FBQ0Q7O0FBQ0osV0FBS29DLDBDQUFtQkMsZUFBeEI7QUFDSSxZQUFJLEtBQUs5QixLQUFMLENBQVdKLE9BQWYsRUFBd0I7QUFDcEIyRSxVQUFBQSxLQUFLLGdCQUFHLDZCQUFDLGVBQUQ7QUFBaUIsWUFBQSxPQUFPLEVBQUUsS0FBS3ZFLEtBQUwsQ0FBV0osT0FBckM7QUFBOEMsWUFBQSxHQUFHLEVBQUUsS0FBS0ksS0FBTCxDQUFXSjtBQUE5RCxZQUFSO0FBQ0g7O0FBQ0Q7O0FBQ0osV0FBS2lDLDBDQUFtQndDLGFBQXhCO0FBQ0lFLFFBQUFBLEtBQUssZ0JBQUcsNkJBQUMsYUFBRDtBQUFlLFVBQUEsT0FBTyxFQUFFLEtBQUt2RSxLQUFMLENBQVdKLE9BQW5DO0FBQTRDLFVBQUEsR0FBRyxFQUFFLEtBQUtJLEtBQUwsQ0FBV0o7QUFBNUQsVUFBUjtBQUNBOztBQUNKLFdBQUtpQywwQ0FBbUJJLGNBQXhCO0FBQ0EsV0FBS0osMENBQW1CMkMsZUFBeEI7QUFDSSxZQUFJQyx1QkFBY0MsUUFBZCxDQUF1Qix1QkFBdkIsQ0FBSixFQUFxRDtBQUNqRCxnQkFBTUMsT0FBTyxHQUFHLE1BQU07QUFDbEI7QUFDQTtBQUNBO0FBQ0EsZ0JBQUksS0FBSzNFLEtBQUwsQ0FBV0gsSUFBZixFQUFxQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBNkIsa0NBQUlDLFFBQUosQ0FBYTtBQUNUQyxnQkFBQUEsTUFBTSxFQUFFO0FBREMsZUFBYjtBQUdILGFBUkQsTUFRTztBQUNIO0FBQ0E7QUFDQTtBQUNBRixrQ0FBSUMsUUFBSixDQUFhO0FBQ1RDLGdCQUFBQSxNQUFNLEVBQUVnRCxnQkFBT0MsUUFETjtBQUVUeEUsZ0JBQUFBLE1BQU0sRUFBRSxLQUFLSixLQUFMLENBQVdDLEtBQVgsS0FBcUIyQiwwQ0FBbUIyQyxlQUF4QyxHQUNKLEtBQUt2RSxLQUFMLENBQVdJLE1BRFAsR0FDZ0I7QUFIZixlQUFiO0FBS0g7QUFDSixXQXRCRDs7QUF1QkFrRSxVQUFBQSxLQUFLLGdCQUFHLDZCQUFDLFFBQUQ7QUFDSixZQUFBLElBQUksRUFBRSxLQUFLdEUsS0FBTCxDQUFXSSxNQURiO0FBRUosWUFBQSxNQUFNLEVBQUUsS0FBS0wsS0FBTCxDQUFXUCxNQUZmO0FBR0osWUFBQSxHQUFHLEVBQUUsS0FBS08sS0FBTCxDQUFXUCxNQUFYLElBQXFCLEtBQUtRLEtBQUwsQ0FBV0ksTUFBWCxDQUFrQjBCLE1BSHhDO0FBSUosWUFBQSxPQUFPLEVBQUU0QyxPQUpMO0FBS0osWUFBQSxLQUFLLEVBQUUsS0FBSzFFLEtBQUwsQ0FBV0MsS0FMZDtBQU1KLFlBQUEsbUJBQW1CLEVBQUUsS0FBS0QsS0FBTCxDQUFXTSxtQkFONUI7QUFPSixZQUFBLDBCQUEwQixFQUFFLEtBQUtOLEtBQUwsQ0FBV3lEO0FBUG5DLFlBQVI7QUFTSCxTQWpDRCxNQWlDTztBQUNIYSxVQUFBQSxLQUFLLGdCQUFHLDZCQUFDLFVBQUQ7QUFDSixZQUFBLE1BQU0sRUFBRSxLQUFLdEUsS0FBTCxDQUFXSSxNQURmO0FBRUosWUFBQSxHQUFHLEVBQUUsS0FBS0wsS0FBTCxDQUFXUCxNQUFYLElBQXFCLEtBQUtRLEtBQUwsQ0FBV0ksTUFBWCxDQUFrQjBCO0FBRnhDLFlBQVI7QUFJSDs7QUFDRDs7QUFDSixXQUFLRiwwQ0FBbUJpRCxrQkFBeEI7QUFDSVAsUUFBQUEsS0FBSyxnQkFBRyw2QkFBQyxvQkFBRDtBQUFzQixVQUFBLEtBQUssRUFBRSxLQUFLdEUsS0FBTCxDQUFXd0QsS0FBeEM7QUFBK0MsVUFBQSxHQUFHLEVBQUUsS0FBS3pELEtBQUwsQ0FBV1A7QUFBL0QsVUFBUjtBQUNBOztBQUNKLFdBQUtvQywwQ0FBbUJ1QyxlQUF4QjtBQUNJLFlBQUlLLHVCQUFjQyxRQUFkLENBQXVCLHVCQUF2QixDQUFKLEVBQXFEO0FBQ2pELGdCQUFNQyxPQUFPLEdBQUcsTUFBTTtBQUNsQmpELGdDQUFJQyxRQUFKLENBQWE7QUFDVEMsY0FBQUEsTUFBTSxFQUFFZ0QsZ0JBQU9DLFFBRE47QUFFVHhFLGNBQUFBLE1BQU0sRUFBRTtBQUZDLGFBQWI7QUFJSCxXQUxEOztBQU1Ba0UsVUFBQUEsS0FBSyxnQkFBRyw2QkFBQyxRQUFEO0FBQ0osWUFBQSxJQUFJLEVBQUUsS0FBS3RFLEtBQUwsQ0FBV0ksTUFEYjtBQUVKLFlBQUEsT0FBTyxFQUFFLEtBQUtMLEtBQUwsQ0FBV0osT0FGaEI7QUFHSixZQUFBLEdBQUcsRUFBRSxLQUFLSyxLQUFMLENBQVdJLE1BQVgsQ0FBa0IwQixNQUhuQjtBQUlKLFlBQUEsT0FBTyxFQUFFNEM7QUFKTCxZQUFSO0FBS0gsU0FaRCxNQVlPO0FBQ0hKLFVBQUFBLEtBQUssZ0JBQ0QsNkJBQUMsZUFBRDtBQUNJLFlBQUEsV0FBVyxFQUFFLEtBQUt0RSxLQUFMLENBQVdJLE1BRDVCO0FBRUksWUFBQSxPQUFPLEVBQUUsS0FBS0wsS0FBTCxDQUFXSixPQUZ4QjtBQUdJLFlBQUEsR0FBRyxFQUFFLEtBQUtLLEtBQUwsQ0FBV0ksTUFBWCxDQUFrQjBFO0FBSDNCLFlBREo7QUFPSDs7QUFDRDs7QUFDSixXQUFLbEQsMENBQW1CeUMsYUFBeEI7QUFDSUMsUUFBQUEsS0FBSyxnQkFBRyw2QkFBQyxhQUFEO0FBQ0osVUFBQSxXQUFXLEVBQUUsS0FBS3RFLEtBQUwsQ0FBV3VELFdBRHBCO0FBRUosVUFBQSxPQUFPLEVBQUUsS0FBS3hELEtBQUwsQ0FBV0osT0FGaEI7QUFHSixVQUFBLEdBQUcsRUFBRSxLQUFLSyxLQUFMLENBQVd1RDtBQUhaLFVBQVI7QUFJQTs7QUFDSixXQUFLM0IsMENBQW1CcUMsaUJBQXhCO0FBQ0lLLFFBQUFBLEtBQUssZ0JBQUcsNkJBQUMsaUJBQUQsT0FBUjtBQUNBOztBQUNKLFdBQUsxQywwQ0FBbUJzQyxTQUF4QjtBQUNJSSxRQUFBQSxLQUFLLGdCQUFHLDZCQUFDLFNBQUQ7QUFBVyxVQUFBLE1BQU0sRUFBRSxLQUFLdkUsS0FBTCxDQUFXUCxNQUE5QjtBQUFzQyxVQUFBLGNBQWMsRUFBRSxLQUFLTyxLQUFMLENBQVdnRjtBQUFqRSxVQUFSO0FBQ0E7QUE3RlI7O0FBZ0dBLFVBQU1DLE9BQU8sR0FBRyx5QkFBVyxlQUFYLEVBQTRCLFlBQTVCLEVBQTBDO0FBQ3RELG1CQUFhLEtBQUtqRixLQUFMLENBQVdrRixTQUQ4QjtBQUV0RCwwQkFBb0IsS0FBS2xGLEtBQUwsQ0FBV21GLFFBRnVCO0FBR3RELG9CQUFjO0FBSHdDLEtBQTFDLENBQWhCO0FBTUEsd0JBQ0k7QUFBTyxNQUFBLFNBQVMsRUFBRUYsT0FBbEI7QUFBMkIsTUFBQSxFQUFFLEVBQUM7QUFBOUIsT0FDTVYsS0FETixDQURKO0FBS0g7O0FBdlJtRDs7OzhCQUFuQ2xGLFUsaUJBU0krRiw0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgUmF0ZUxpbWl0ZWRGdW5jIGZyb20gJy4uLy4uL3JhdGVsaW1pdGVkZnVuYyc7XG5pbXBvcnQgeyBzaG93R3JvdXBJbnZpdGVEaWFsb2csIHNob3dHcm91cEFkZFJvb21EaWFsb2cgfSBmcm9tICcuLi8uLi9Hcm91cEFkZHJlc3NQaWNrZXInO1xuaW1wb3J0IEdyb3VwU3RvcmUgZnJvbSAnLi4vLi4vc3RvcmVzL0dyb3VwU3RvcmUnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7UklHSFRfUEFORUxfUEhBU0VTLCBSSUdIVF9QQU5FTF9QSEFTRVNfTk9fQVJHU30gZnJvbSBcIi4uLy4uL3N0b3Jlcy9SaWdodFBhbmVsU3RvcmVQaGFzZXNcIjtcbmltcG9ydCBSaWdodFBhbmVsU3RvcmUgZnJvbSBcIi4uLy4uL3N0b3Jlcy9SaWdodFBhbmVsU3RvcmVcIjtcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5pbXBvcnQge0FjdGlvbn0gZnJvbSBcIi4uLy4uL2Rpc3BhdGNoZXIvYWN0aW9uc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSaWdodFBhbmVsIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgZ2V0IHByb3BUeXBlcygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZywgLy8gaWYgc2hvd2luZyBwYW5lbHMgZm9yIGEgZ2l2ZW4gcm9vbSwgdGhpcyBpcyBzZXRcbiAgICAgICAgICAgIGdyb3VwSWQ6IFByb3BUeXBlcy5zdHJpbmcsIC8vIGlmIHNob3dpbmcgcGFuZWxzIGZvciBhIGdpdmVuIGdyb3VwLCB0aGlzIGlzIHNldFxuICAgICAgICAgICAgdXNlcjogUHJvcFR5cGVzLm9iamVjdCwgLy8gdXNlZCBpZiB3ZSBrbm93IHRoZSB1c2VyIGFoZWFkIG9mIG9wZW5pbmcgdGhlIHBhbmVsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhdGljIGNvbnRleHRUeXBlID0gTWF0cml4Q2xpZW50Q29udGV4dDtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLl9nZXRQaGFzZUZyb21Qcm9wcygpLFxuICAgICAgICAgICAgaXNVc2VyUHJpdmlsZWdlZEluR3JvdXA6IG51bGwsXG4gICAgICAgICAgICBtZW1iZXI6IHRoaXMuX2dldFVzZXJGb3JQYW5lbCgpLFxuICAgICAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWVzdDogUmlnaHRQYW5lbFN0b3JlLmdldFNoYXJlZEluc3RhbmNlKCkucm9vbVBhbmVsUGhhc2VQYXJhbXMudmVyaWZpY2F0aW9uUmVxdWVzdCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbkFjdGlvbiA9IHRoaXMub25BY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vblJvb21TdGF0ZU1lbWJlciA9IHRoaXMub25Sb29tU3RhdGVNZW1iZXIuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkdyb3VwU3RvcmVVcGRhdGVkID0gdGhpcy5vbkdyb3VwU3RvcmVVcGRhdGVkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25JbnZpdGVUb0dyb3VwQnV0dG9uQ2xpY2sgPSB0aGlzLm9uSW52aXRlVG9Hcm91cEJ1dHRvbkNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25BZGRSb29tVG9Hcm91cEJ1dHRvbkNsaWNrID0gdGhpcy5vbkFkZFJvb21Ub0dyb3VwQnV0dG9uQ2xpY2suYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLl9kZWxheWVkVXBkYXRlID0gbmV3IFJhdGVMaW1pdGVkRnVuYygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxuXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHNwbGl0IG91dCB0aGUgbG9naWMgZm9yIF9nZXRQaGFzZUZyb21Qcm9wcygpIGFuZCB0aGUgY29uc3RydWN0b3JcbiAgICAvLyBhcyBib3RoIGFyZSBjYWxsZWQgYXQgdGhlIHNhbWUgdGltZSBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgX2dldFVzZXJGb3JQYW5lbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiYgdGhpcy5zdGF0ZS5tZW1iZXIpIHJldHVybiB0aGlzLnN0YXRlLm1lbWJlcjtcbiAgICAgICAgY29uc3QgbGFzdFBhcmFtcyA9IFJpZ2h0UGFuZWxTdG9yZS5nZXRTaGFyZWRJbnN0YW5jZSgpLnJvb21QYW5lbFBoYXNlUGFyYW1zO1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy51c2VyIHx8IGxhc3RQYXJhbXNbJ21lbWJlciddO1xuICAgIH1cblxuICAgIC8vIGdldHMgdGhlIGN1cnJlbnQgcGhhc2UgZnJvbSB0aGUgcHJvcHMgYW5kIGFsc28gbWF5YmUgdGhlIHN0b3JlXG4gICAgX2dldFBoYXNlRnJvbVByb3BzKCkge1xuICAgICAgICBjb25zdCBycHMgPSBSaWdodFBhbmVsU3RvcmUuZ2V0U2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgY29uc3QgdXNlckZvclBhbmVsID0gdGhpcy5fZ2V0VXNlckZvclBhbmVsKCk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmdyb3VwSWQpIHtcbiAgICAgICAgICAgIGlmICghUklHSFRfUEFORUxfUEhBU0VTX05PX0FSR1MuaW5jbHVkZXMocnBzLmdyb3VwUGFuZWxQaGFzZSkpIHtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogXCJzZXRfcmlnaHRfcGFuZWxfcGhhc2VcIiwgcGhhc2U6IFJJR0hUX1BBTkVMX1BIQVNFUy5Hcm91cE1lbWJlckxpc3R9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwTWVtYmVyTGlzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBycHMuZ3JvdXBQYW5lbFBoYXNlO1xuICAgICAgICB9IGVsc2UgaWYgKHVzZXJGb3JQYW5lbCkge1xuICAgICAgICAgICAgLy8gWFhYIEZJWE1FIEFBQUFBQVJHSDogV2hhdCBpcyBnb2luZyBvbiB3aXRoIHRoaXMgY2xhc3MhPyBJdCB0YWtlcyBzb21lIG9mIGl0cyBzdGF0ZVxuICAgICAgICAgICAgLy8gZnJvbSBpdHMgcHJvcHMgYW5kIHNvbWUgZnJvbSBhIHN0b3JlLCBleGNlcHQgaWYgdGhlIGNvbnRlbnRzIG9mIHRoZSBzdG9yZSBjaGFuZ2VzXG4gICAgICAgICAgICAvLyB3aGlsZSBpdCdzIG1vdW50ZWQgaW4gd2hpY2ggY2FzZSBpdCByZXBsYWNlcyBhbGwgb2YgaXRzIHN0YXRlIHdpdGggdGhhdCBvZiB0aGUgc3RvcmUsXG4gICAgICAgICAgICAvLyBleGNlcHQgaXQgdXNlcyBhIGRpc3BhdGNoIGluc3RlYWQgb2YgYSBub3JtYWwgc3RvcmUgbGlzdGVuZXI/XG4gICAgICAgICAgICAvLyBVbmZvcnR1bmF0ZWx5IHJld3JpdGluZyB0aGlzIHdvdWxkIGFsbW9zdCBjZXJ0YWlubHkgYnJlYWsgc2hvd2luZyB0aGUgcmlnaHQgcGFuZWxcbiAgICAgICAgICAgIC8vIGluIHNvbWUgb2YgdGhlIG1hbnkgY2FzZXMsIGFuZCBJIGRvbid0IGhhdmUgdGltZSB0byByZS1hcmNoaXRlY3QgaXQgYW5kIHRlc3QgYWxsXG4gICAgICAgICAgICAvLyB0aGUgZmxvd3Mgbm93LCBzbyBhZGRpbmcgeWV0IGFub3RoZXIgc3BlY2lhbCBjYXNlIHNvIGlmIHRoZSBzdG9yZSB0aGlua3MgdGhlcmUgaXNcbiAgICAgICAgICAgIC8vIGEgdmVyaWZpY2F0aW9uIGdvaW5nIG9uIGZvciB0aGUgbWVtYmVyIHdlJ3JlIGRpc3BsYXlpbmcsIHdlIHNob3cgdGhhdCwgb3RoZXJ3aXNlXG4gICAgICAgICAgICAvLyB3ZSByYWNlIGlmIGEgdmVyaWZpY2F0aW9uIGlzIHN0YXJ0ZWQgd2hpbGUgdGhlIHBhbmVsIGlzbid0IGRpc3BsYXllZCBiZWNhdXNlIHdlJ3JlXG4gICAgICAgICAgICAvLyBub3QgbW91bnRlZCBpbiB0aW1lIHRvIGdldCB0aGUgZGlzcGF0Y2guXG4gICAgICAgICAgICAvLyBVbnRpbCB0aGVuLCBsZXQgdGhpcyBjb2RlIHNlcnZlIGFzIGEgd2FybmluZyBmcm9tIGhpc3RvcnkuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcnBzLnJvb21QYW5lbFBoYXNlUGFyYW1zLm1lbWJlciAmJlxuICAgICAgICAgICAgICAgIHVzZXJGb3JQYW5lbC51c2VySWQgPT09IHJwcy5yb29tUGFuZWxQaGFzZVBhcmFtcy5tZW1iZXIudXNlcklkICYmXG4gICAgICAgICAgICAgICAgcnBzLnJvb21QYW5lbFBoYXNlUGFyYW1zLnZlcmlmaWNhdGlvblJlcXVlc3RcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBycHMucm9vbVBhbmVsUGhhc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUklHSFRfUEFORUxfUEhBU0VTLlJvb21NZW1iZXJJbmZvO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFSSUdIVF9QQU5FTF9QSEFTRVNfTk9fQVJHUy5pbmNsdWRlcyhycHMucm9vbVBhbmVsUGhhc2UpKSB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246IFwic2V0X3JpZ2h0X3BhbmVsX3BoYXNlXCIsIHBoYXNlOiBSSUdIVF9QQU5FTF9QSEFTRVMuUm9vbU1lbWJlckxpc3R9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUklHSFRfUEFORUxfUEhBU0VTLlJvb21NZW1iZXJMaXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJwcy5yb29tUGFuZWxQaGFzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgICAgIGNvbnN0IGNsaSA9IHRoaXMuY29udGV4dDtcbiAgICAgICAgY2xpLm9uKFwiUm9vbVN0YXRlLm1lbWJlcnNcIiwgdGhpcy5vblJvb21TdGF0ZU1lbWJlcik7XG4gICAgICAgIHRoaXMuX2luaXRHcm91cFN0b3JlKHRoaXMucHJvcHMuZ3JvdXBJZCk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGRpcy51bnJlZ2lzdGVyKHRoaXMuZGlzcGF0Y2hlclJlZik7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5tZW1iZXJzXCIsIHRoaXMub25Sb29tU3RhdGVNZW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VucmVnaXN0ZXJHcm91cFN0b3JlKHRoaXMucHJvcHMuZ3JvdXBJZCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXdQcm9wcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbWVsY2FzZVxuICAgICAgICBpZiAobmV3UHJvcHMuZ3JvdXBJZCAhPT0gdGhpcy5wcm9wcy5ncm91cElkKSB7XG4gICAgICAgICAgICB0aGlzLl91bnJlZ2lzdGVyR3JvdXBTdG9yZSh0aGlzLnByb3BzLmdyb3VwSWQpO1xuICAgICAgICAgICAgdGhpcy5faW5pdEdyb3VwU3RvcmUobmV3UHJvcHMuZ3JvdXBJZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfaW5pdEdyb3VwU3RvcmUoZ3JvdXBJZCkge1xuICAgICAgICBpZiAoIWdyb3VwSWQpIHJldHVybjtcbiAgICAgICAgR3JvdXBTdG9yZS5yZWdpc3Rlckxpc3RlbmVyKGdyb3VwSWQsIHRoaXMub25Hcm91cFN0b3JlVXBkYXRlZCk7XG4gICAgfVxuXG4gICAgX3VucmVnaXN0ZXJHcm91cFN0b3JlKCkge1xuICAgICAgICBHcm91cFN0b3JlLnVucmVnaXN0ZXJMaXN0ZW5lcih0aGlzLm9uR3JvdXBTdG9yZVVwZGF0ZWQpO1xuICAgIH1cblxuICAgIG9uR3JvdXBTdG9yZVVwZGF0ZWQoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaXNVc2VyUHJpdmlsZWdlZEluR3JvdXA6IEdyb3VwU3RvcmUuaXNVc2VyUHJpdmlsZWdlZCh0aGlzLnByb3BzLmdyb3VwSWQpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkludml0ZVRvR3JvdXBCdXR0b25DbGljaygpIHtcbiAgICAgICAgc2hvd0dyb3VwSW52aXRlRGlhbG9nKHRoaXMucHJvcHMuZ3JvdXBJZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBwaGFzZTogUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwTWVtYmVyTGlzdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkFkZFJvb21Ub0dyb3VwQnV0dG9uQ2xpY2soKSB7XG4gICAgICAgIHNob3dHcm91cEFkZFJvb21EaWFsb2codGhpcy5wcm9wcy5ncm91cElkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Sb29tU3RhdGVNZW1iZXIoZXYsIHN0YXRlLCBtZW1iZXIpIHtcbiAgICAgICAgaWYgKG1lbWJlci5yb29tSWQgIT09IHRoaXMucHJvcHMucm9vbUlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkcmF3IHRoZSBiYWRnZSBvbiB0aGUgbWVtYmVyc2hpcCBsaXN0XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnBoYXNlID09PSBSSUdIVF9QQU5FTF9QSEFTRVMuUm9vbU1lbWJlckxpc3QgJiYgbWVtYmVyLnJvb21JZCA9PT0gdGhpcy5wcm9wcy5yb29tSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlbGF5ZWRVcGRhdGUoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnBoYXNlID09PSBSSUdIVF9QQU5FTF9QSEFTRVMuUm9vbU1lbWJlckluZm8gJiYgbWVtYmVyLnJvb21JZCA9PT0gdGhpcy5wcm9wcy5yb29tSWQgJiZcbiAgICAgICAgICAgICAgICBtZW1iZXIudXNlcklkID09PSB0aGlzLnN0YXRlLm1lbWJlci51c2VySWQpIHtcbiAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIG1lbWJlciBpbmZvIChlLmcuIG5ldyBwb3dlciBsZXZlbClcbiAgICAgICAgICAgIHRoaXMuX2RlbGF5ZWRVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQWN0aW9uKHBheWxvYWQpIHtcbiAgICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSBcImFmdGVyX3JpZ2h0X3BhbmVsX3BoYXNlX2NoYW5nZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBwaGFzZTogcGF5bG9hZC5waGFzZSxcbiAgICAgICAgICAgICAgICBncm91cFJvb21JZDogcGF5bG9hZC5ncm91cFJvb21JZCxcbiAgICAgICAgICAgICAgICBncm91cElkOiBwYXlsb2FkLmdyb3VwSWQsXG4gICAgICAgICAgICAgICAgbWVtYmVyOiBwYXlsb2FkLm1lbWJlcixcbiAgICAgICAgICAgICAgICBldmVudDogcGF5bG9hZC5ldmVudCxcbiAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25SZXF1ZXN0OiBwYXlsb2FkLnZlcmlmaWNhdGlvblJlcXVlc3QsXG4gICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2U6IHBheWxvYWQudmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgTWVtYmVyTGlzdCA9IHNkay5nZXRDb21wb25lbnQoJ3Jvb21zLk1lbWJlckxpc3QnKTtcbiAgICAgICAgY29uc3QgTWVtYmVySW5mbyA9IHNkay5nZXRDb21wb25lbnQoJ3Jvb21zLk1lbWJlckluZm8nKTtcbiAgICAgICAgY29uc3QgVXNlckluZm8gPSBzZGsuZ2V0Q29tcG9uZW50KCdyaWdodF9wYW5lbC5Vc2VySW5mbycpO1xuICAgICAgICBjb25zdCBUaGlyZFBhcnR5TWVtYmVySW5mbyA9IHNkay5nZXRDb21wb25lbnQoJ3Jvb21zLlRoaXJkUGFydHlNZW1iZXJJbmZvJyk7XG4gICAgICAgIGNvbnN0IE5vdGlmaWNhdGlvblBhbmVsID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5Ob3RpZmljYXRpb25QYW5lbCcpO1xuICAgICAgICBjb25zdCBGaWxlUGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLkZpbGVQYW5lbCcpO1xuXG4gICAgICAgIGNvbnN0IEdyb3VwTWVtYmVyTGlzdCA9IHNkay5nZXRDb21wb25lbnQoJ2dyb3Vwcy5Hcm91cE1lbWJlckxpc3QnKTtcbiAgICAgICAgY29uc3QgR3JvdXBNZW1iZXJJbmZvID0gc2RrLmdldENvbXBvbmVudCgnZ3JvdXBzLkdyb3VwTWVtYmVySW5mbycpO1xuICAgICAgICBjb25zdCBHcm91cFJvb21MaXN0ID0gc2RrLmdldENvbXBvbmVudCgnZ3JvdXBzLkdyb3VwUm9vbUxpc3QnKTtcbiAgICAgICAgY29uc3QgR3JvdXBSb29tSW5mbyA9IHNkay5nZXRDb21wb25lbnQoJ2dyb3Vwcy5Hcm91cFJvb21JbmZvJyk7XG5cbiAgICAgICAgbGV0IHBhbmVsID0gPGRpdiAvPjtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUucGhhc2UpIHtcbiAgICAgICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLlJvb21NZW1iZXJMaXN0OlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnJvb21JZCkge1xuICAgICAgICAgICAgICAgICAgICBwYW5lbCA9IDxNZW1iZXJMaXN0IHJvb21JZD17dGhpcy5wcm9wcy5yb29tSWR9IGtleT17dGhpcy5wcm9wcy5yb29tSWR9IC8+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwTWVtYmVyTGlzdDpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5ncm91cElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsID0gPEdyb3VwTWVtYmVyTGlzdCBncm91cElkPXt0aGlzLnByb3BzLmdyb3VwSWR9IGtleT17dGhpcy5wcm9wcy5ncm91cElkfSAvPjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFJJR0hUX1BBTkVMX1BIQVNFUy5Hcm91cFJvb21MaXN0OlxuICAgICAgICAgICAgICAgIHBhbmVsID0gPEdyb3VwUm9vbUxpc3QgZ3JvdXBJZD17dGhpcy5wcm9wcy5ncm91cElkfSBrZXk9e3RoaXMucHJvcHMuZ3JvdXBJZH0gLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFJJR0hUX1BBTkVMX1BIQVNFUy5Sb29tTWVtYmVySW5mbzpcbiAgICAgICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLkVuY3J5cHRpb25QYW5lbDpcbiAgICAgICAgICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImZlYXR1cmVfY3Jvc3Nfc2lnbmluZ1wiKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gWFhYOiBUaGVyZSBhcmUgdGhyZWUgZGlmZmVyZW50IHdheXMgb2YgJ2Nsb3NpbmcnIHRoaXMgcGFuZWwgZGVwZW5kaW5nIG9uIHdoYXQgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaW5ncyBhcmUgaW4uLi4gdGhpcyBrbm93cyBmYXIgbW9yZSB0aGFuIGl0IHNob3VsZCBkbyBhYm91dCB0aGUgc3RhdGUgb2YgdGhlIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBhcHAgYW5kIGlzIGdlbmVyYWxseSBhIGJpdCBzaWxseS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgdXNlciBwcm9wIHRoZW4gd2UncmUgZGlzcGxheWluZyBhIHVzZXIgZnJvbSB0aGUgJ3VzZXInIHBhZ2UgdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIExvZ2dlZEluVmlldywgc28gbmVlZCB0byBjaGFuZ2UgdGhlIHBhZ2UgdHlwZSB0byBjbG9zZSB0aGUgcGFuZWwgKHdlIHN3aXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBob21lIHBhZ2Ugd2hpY2ggaXMgbm90IG9idmlvdXNseSB0aGUgY29ycmVjdCB0aGluZyB0byBkbywgYnV0IEknbSBub3Qgc3VyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgLSB3ZSBjb3VsZCBoaWRlIHRoZSBjbG9zZSBidXR0b24gYWx0b2dldGhlcj8pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcInZpZXdfaG9tZV9wYWdlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSB3ZSBoYXZlIGdvdCBvdXIgdXNlciBmcm9tIFJvb21WaWV3U3RvcmUgd2hpY2ggbWVhbnMgd2UncmUgYmVpbmcgc2hvd25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aXRoaW4gYSByb29tLCBzbyBnbyBiYWNrIHRvIHRoZSBtZW1iZXIgcGFuZWwgaWYgd2Ugd2VyZSBpbiB0aGUgZW5jcnlwdGlvbiBwYW5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvciB0aGUgbWVtYmVyIGxpc3QgaWYgd2Ugd2VyZSBpbiB0aGUgbWVtYmVyIHBhbmVsLi4uIHBoZXcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbWJlcjogdGhpcy5zdGF0ZS5waGFzZSA9PT0gUklHSFRfUEFORUxfUEhBU0VTLkVuY3J5cHRpb25QYW5lbCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLm1lbWJlciA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsID0gPFVzZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyPXt0aGlzLnN0YXRlLm1lbWJlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21JZD17dGhpcy5wcm9wcy5yb29tSWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3RoaXMucHJvcHMucm9vbUlkIHx8IHRoaXMuc3RhdGUubWVtYmVyLnVzZXJJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xvc2U9e29uQ2xvc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFzZT17dGhpcy5zdGF0ZS5waGFzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvblJlcXVlc3Q9e3RoaXMuc3RhdGUudmVyaWZpY2F0aW9uUmVxdWVzdH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvblJlcXVlc3RQcm9taXNlPXt0aGlzLnN0YXRlLnZlcmlmaWNhdGlvblJlcXVlc3RQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAvPjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYW5lbCA9IDxNZW1iZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1iZXI9e3RoaXMuc3RhdGUubWVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PXt0aGlzLnByb3BzLnJvb21JZCB8fCB0aGlzLnN0YXRlLm1lbWJlci51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgIC8+O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLlJvb20zcGlkTWVtYmVySW5mbzpcbiAgICAgICAgICAgICAgICBwYW5lbCA9IDxUaGlyZFBhcnR5TWVtYmVySW5mbyBldmVudD17dGhpcy5zdGF0ZS5ldmVudH0ga2V5PXt0aGlzLnByb3BzLnJvb21JZH0gLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFJJR0hUX1BBTkVMX1BIQVNFUy5Hcm91cE1lbWJlckluZm86XG4gICAgICAgICAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJmZWF0dXJlX2Nyb3NzX3NpZ25pbmdcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb24uVmlld1VzZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtYmVyOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsID0gPFVzZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyPXt0aGlzLnN0YXRlLm1lbWJlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ9e3RoaXMucHJvcHMuZ3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17dGhpcy5zdGF0ZS5tZW1iZXIudXNlcklkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbG9zZT17b25DbG9zZX0gLz47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwgPSAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8R3JvdXBNZW1iZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBNZW1iZXI9e3RoaXMuc3RhdGUubWVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ9e3RoaXMucHJvcHMuZ3JvdXBJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3RoaXMuc3RhdGUubWVtYmVyLnVzZXJfaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwUm9vbUluZm86XG4gICAgICAgICAgICAgICAgcGFuZWwgPSA8R3JvdXBSb29tSW5mb1xuICAgICAgICAgICAgICAgICAgICBncm91cFJvb21JZD17dGhpcy5zdGF0ZS5ncm91cFJvb21JZH1cbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZD17dGhpcy5wcm9wcy5ncm91cElkfVxuICAgICAgICAgICAgICAgICAgICBrZXk9e3RoaXMuc3RhdGUuZ3JvdXBSb29tSWR9IC8+O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBSSUdIVF9QQU5FTF9QSEFTRVMuTm90aWZpY2F0aW9uUGFuZWw6XG4gICAgICAgICAgICAgICAgcGFuZWwgPSA8Tm90aWZpY2F0aW9uUGFuZWwgLz47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFJJR0hUX1BBTkVMX1BIQVNFUy5GaWxlUGFuZWw6XG4gICAgICAgICAgICAgICAgcGFuZWwgPSA8RmlsZVBhbmVsIHJvb21JZD17dGhpcy5wcm9wcy5yb29tSWR9IHJlc2l6ZU5vdGlmaWVyPXt0aGlzLnByb3BzLnJlc2l6ZU5vdGlmaWVyfSAvPjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfUmlnaHRQYW5lbFwiLCBcIm14X2ZhZGFibGVcIiwge1xuICAgICAgICAgICAgXCJjb2xsYXBzZWRcIjogdGhpcy5wcm9wcy5jb2xsYXBzZWQsXG4gICAgICAgICAgICBcIm14X2ZhZGFibGVfZmFkZWRcIjogdGhpcy5wcm9wcy5kaXNhYmxlZCxcbiAgICAgICAgICAgIFwiZGFyay1wYW5lbFwiOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGFzaWRlIGNsYXNzTmFtZT17Y2xhc3Nlc30gaWQ9XCJteF9SaWdodFBhbmVsXCI+XG4gICAgICAgICAgICAgICAgeyBwYW5lbCB9XG4gICAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==