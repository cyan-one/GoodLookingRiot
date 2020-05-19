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

var WhoIsTyping = _interopRequireWildcard(require("../../../WhoIsTyping"));

var _Timer = _interopRequireDefault(require("../../../utils/Timer"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _MemberAvatar = _interopRequireDefault(require("../avatars/MemberAvatar"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 New Vector Ltd

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
  displayName: 'WhoIsTypingTile',
  propTypes: {
    // the room this statusbar is representing.
    room: _propTypes.default.object.isRequired,
    onShown: _propTypes.default.func,
    onHidden: _propTypes.default.func,
    // Number of names to display in typing indication. E.g. set to 3, will
    // result in "X, Y, Z and 100 others are typing."
    whoIsTypingLimit: _propTypes.default.number
  },
  getDefaultProps: function () {
    return {
      whoIsTypingLimit: 3
    };
  },
  getInitialState: function () {
    return {
      usersTyping: WhoIsTyping.usersTypingApartFromMe(this.props.room),
      // a map with userid => Timer to delay
      // hiding the "x is typing" message for a
      // user so hiding it can coincide
      // with the sent message by the other side
      // resulting in less timeline jumpiness
      delayedStopTypingTimers: {}
    };
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomMember.typing", this.onRoomMemberTyping);

    _MatrixClientPeg.MatrixClientPeg.get().on("Room.timeline", this.onRoomTimeline);
  },
  componentDidUpdate: function (_, prevState) {
    const wasVisible = this._isVisible(prevState);

    const isVisible = this._isVisible(this.state);

    if (this.props.onShown && !wasVisible && isVisible) {
      this.props.onShown();
    } else if (this.props.onHidden && wasVisible && !isVisible) {
      this.props.onHidden();
    }
  },
  componentWillUnmount: function () {
    // we may have entirely lost our client as we're logging out before clicking login on the guest bar...
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("RoomMember.typing", this.onRoomMemberTyping);
      client.removeListener("Room.timeline", this.onRoomTimeline);
    }

    Object.values(this.state.delayedStopTypingTimers).forEach(t => t.abort());
  },
  _isVisible: function (state) {
    return state.usersTyping.length !== 0 || Object.keys(state.delayedStopTypingTimers).length !== 0;
  },
  isVisible: function () {
    return this._isVisible(this.state);
  },
  onRoomTimeline: function (event, room) {
    if (room && room.roomId === this.props.room.roomId) {
      const userId = event.getSender(); // remove user from usersTyping

      const usersTyping = this.state.usersTyping.filter(m => m.userId !== userId);
      this.setState({
        usersTyping
      }); // abort timer if any

      this._abortUserTimer(userId);
    }
  },
  onRoomMemberTyping: function (ev, member) {
    const usersTyping = WhoIsTyping.usersTypingApartFromMeAndIgnored(this.props.room);
    this.setState({
      delayedStopTypingTimers: this._updateDelayedStopTypingTimers(usersTyping),
      usersTyping
    });
  },

  _updateDelayedStopTypingTimers(usersTyping) {
    const usersThatStoppedTyping = this.state.usersTyping.filter(a => {
      return !usersTyping.some(b => a.userId === b.userId);
    });
    const usersThatStartedTyping = usersTyping.filter(a => {
      return !this.state.usersTyping.some(b => a.userId === b.userId);
    }); // abort all the timers for the users that started typing again

    usersThatStartedTyping.forEach(m => {
      const timer = this.state.delayedStopTypingTimers[m.userId];

      if (timer) {
        timer.abort();
      }
    }); // prepare new delayedStopTypingTimers object to update state with

    let delayedStopTypingTimers = Object.assign({}, this.state.delayedStopTypingTimers); // remove members that started typing again

    delayedStopTypingTimers = usersThatStartedTyping.reduce((delayedStopTypingTimers, m) => {
      delete delayedStopTypingTimers[m.userId];
      return delayedStopTypingTimers;
    }, delayedStopTypingTimers); // start timer for members that stopped typing

    delayedStopTypingTimers = usersThatStoppedTyping.reduce((delayedStopTypingTimers, m) => {
      if (!delayedStopTypingTimers[m.userId]) {
        const timer = new _Timer.default(5000);
        delayedStopTypingTimers[m.userId] = timer;
        timer.start();
        timer.finished().then(() => this._removeUserTimer(m.userId), // on elapsed
        () => {
          /* aborted */
        });
      }

      return delayedStopTypingTimers;
    }, delayedStopTypingTimers);
    return delayedStopTypingTimers;
  },

  _abortUserTimer: function (userId) {
    const timer = this.state.delayedStopTypingTimers[userId];

    if (timer) {
      timer.abort();

      this._removeUserTimer(userId);
    }
  },
  _removeUserTimer: function (userId) {
    const timer = this.state.delayedStopTypingTimers[userId];

    if (timer) {
      const delayedStopTypingTimers = Object.assign({}, this.state.delayedStopTypingTimers);
      delete delayedStopTypingTimers[userId];
      this.setState({
        delayedStopTypingTimers
      });
    }
  },
  _renderTypingIndicatorAvatars: function (users, limit) {
    let othersCount = 0;

    if (users.length > limit) {
      othersCount = users.length - limit + 1;
      users = users.slice(0, limit - 1);
    }

    const avatars = users.map(u => {
      return /*#__PURE__*/_react.default.createElement(_MemberAvatar.default, {
        key: u.userId,
        member: u,
        width: 24,
        height: 24,
        resizeMethod: "crop",
        viewUserOnClick: true
      });
    });

    if (othersCount > 0) {
      avatars.push( /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_WhoIsTypingTile_remainingAvatarPlaceholder",
        key: "others"
      }, "+", othersCount));
    }

    return avatars;
  },
  render: function () {
    let usersTyping = this.state.usersTyping;
    const stoppedUsersOnTimer = Object.keys(this.state.delayedStopTypingTimers).map(userId => this.props.room.getMember(userId)); // append the users that have been reported not typing anymore
    // but have a timeout timer running so they can disappear
    // when a message comes in

    usersTyping = usersTyping.concat(stoppedUsersOnTimer); // sort them so the typing members don't change order when
    // moved to delayedStopTypingTimers

    usersTyping.sort((a, b) => a.name.localeCompare(b.name));
    const typingString = WhoIsTyping.whoIsTypingString(usersTyping, this.props.whoIsTypingLimit);

    if (!typingString) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_WhoIsTypingTile_empty"
      });
    }

    return /*#__PURE__*/_react.default.createElement("li", {
      className: "mx_WhoIsTypingTile",
      "aria-atomic": "true"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_WhoIsTypingTile_avatars"
    }, this._renderTypingIndicatorAvatars(usersTyping, this.props.whoIsTypingLimit)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_WhoIsTypingTile_label"
    }, typingString));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1dob0lzVHlwaW5nVGlsZS5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsInJvb20iLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwib25TaG93biIsImZ1bmMiLCJvbkhpZGRlbiIsIndob0lzVHlwaW5nTGltaXQiLCJudW1iZXIiLCJnZXREZWZhdWx0UHJvcHMiLCJnZXRJbml0aWFsU3RhdGUiLCJ1c2Vyc1R5cGluZyIsIldob0lzVHlwaW5nIiwidXNlcnNUeXBpbmdBcGFydEZyb21NZSIsInByb3BzIiwiZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMiLCJjb21wb25lbnREaWRNb3VudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm9uIiwib25Sb29tTWVtYmVyVHlwaW5nIiwib25Sb29tVGltZWxpbmUiLCJjb21wb25lbnREaWRVcGRhdGUiLCJfIiwicHJldlN0YXRlIiwid2FzVmlzaWJsZSIsIl9pc1Zpc2libGUiLCJpc1Zpc2libGUiLCJzdGF0ZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiY2xpZW50IiwicmVtb3ZlTGlzdGVuZXIiLCJPYmplY3QiLCJ2YWx1ZXMiLCJmb3JFYWNoIiwidCIsImFib3J0IiwibGVuZ3RoIiwia2V5cyIsImV2ZW50Iiwicm9vbUlkIiwidXNlcklkIiwiZ2V0U2VuZGVyIiwiZmlsdGVyIiwibSIsInNldFN0YXRlIiwiX2Fib3J0VXNlclRpbWVyIiwiZXYiLCJtZW1iZXIiLCJ1c2Vyc1R5cGluZ0FwYXJ0RnJvbU1lQW5kSWdub3JlZCIsIl91cGRhdGVEZWxheWVkU3RvcFR5cGluZ1RpbWVycyIsInVzZXJzVGhhdFN0b3BwZWRUeXBpbmciLCJhIiwic29tZSIsImIiLCJ1c2Vyc1RoYXRTdGFydGVkVHlwaW5nIiwidGltZXIiLCJhc3NpZ24iLCJyZWR1Y2UiLCJUaW1lciIsInN0YXJ0IiwiZmluaXNoZWQiLCJ0aGVuIiwiX3JlbW92ZVVzZXJUaW1lciIsIl9yZW5kZXJUeXBpbmdJbmRpY2F0b3JBdmF0YXJzIiwidXNlcnMiLCJsaW1pdCIsIm90aGVyc0NvdW50Iiwic2xpY2UiLCJhdmF0YXJzIiwibWFwIiwidSIsInB1c2giLCJyZW5kZXIiLCJzdG9wcGVkVXNlcnNPblRpbWVyIiwiZ2V0TWVtYmVyIiwiY29uY2F0Iiwic29ydCIsIm5hbWUiLCJsb2NhbGVDb21wYXJlIiwidHlwaW5nU3RyaW5nIiwid2hvSXNUeXBpbmdTdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7OztlQXlCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxpQkFEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1A7QUFDQUMsSUFBQUEsSUFBSSxFQUFFQyxtQkFBVUMsTUFBVixDQUFpQkMsVUFGaEI7QUFHUEMsSUFBQUEsT0FBTyxFQUFFSCxtQkFBVUksSUFIWjtBQUlQQyxJQUFBQSxRQUFRLEVBQUVMLG1CQUFVSSxJQUpiO0FBS1A7QUFDQTtBQUNBRSxJQUFBQSxnQkFBZ0IsRUFBRU4sbUJBQVVPO0FBUHJCLEdBSGlCO0FBYTVCQyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hGLE1BQUFBLGdCQUFnQixFQUFFO0FBRGYsS0FBUDtBQUdILEdBakIyQjtBQW1CNUJHLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSEMsTUFBQUEsV0FBVyxFQUFFQyxXQUFXLENBQUNDLHNCQUFaLENBQW1DLEtBQUtDLEtBQUwsQ0FBV2QsSUFBOUMsQ0FEVjtBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQWUsTUFBQUEsdUJBQXVCLEVBQUU7QUFQdEIsS0FBUDtBQVNILEdBN0IyQjtBQStCNUJDLEVBQUFBLGlCQUFpQixFQUFFLFlBQVc7QUFDMUJDLHFDQUFnQkMsR0FBaEIsR0FBc0JDLEVBQXRC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QUFXLEdBQUcsS0FBS2lCLEtBQUwsQ0FBV2pCLFdBQTdCO0FBQ0EsVUFBTStELG1CQUFtQixHQUFHMUMsTUFBTSxDQUFDTSxJQUFQLENBQVksS0FBS1YsS0FBTCxDQUFXYix1QkFBdkIsRUFDdkJ1RCxHQUR1QixDQUNsQjdCLE1BQUQsSUFBWSxLQUFLM0IsS0FBTCxDQUFXZCxJQUFYLENBQWdCMkUsU0FBaEIsQ0FBMEJsQyxNQUExQixDQURPLENBQTVCLENBRmUsQ0FJZjtBQUNBO0FBQ0E7O0FBQ0E5QixJQUFBQSxXQUFXLEdBQUdBLFdBQVcsQ0FBQ2lFLE1BQVosQ0FBbUJGLG1CQUFuQixDQUFkLENBUGUsQ0FRZjtBQUNBOztBQUNBL0QsSUFBQUEsV0FBVyxDQUFDa0UsSUFBWixDQUFpQixDQUFDekIsQ0FBRCxFQUFJRSxDQUFKLEtBQVVGLENBQUMsQ0FBQzBCLElBQUYsQ0FBT0MsYUFBUCxDQUFxQnpCLENBQUMsQ0FBQ3dCLElBQXZCLENBQTNCO0FBRUEsVUFBTUUsWUFBWSxHQUFHcEUsV0FBVyxDQUFDcUUsaUJBQVosQ0FDakJ0RSxXQURpQixFQUVqQixLQUFLRyxLQUFMLENBQVdQLGdCQUZNLENBQXJCOztBQUlBLFFBQUksQ0FBQ3lFLFlBQUwsRUFBbUI7QUFDZiwwQkFBUTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsUUFBUjtBQUNIOztBQUVELHdCQUNJO0FBQUksTUFBQSxTQUFTLEVBQUMsb0JBQWQ7QUFBbUMscUJBQVk7QUFBL0Msb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ00sS0FBS2hCLDZCQUFMLENBQW1DckQsV0FBbkMsRUFBZ0QsS0FBS0csS0FBTCxDQUFXUCxnQkFBM0QsQ0FETixDQURKLGVBSUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ015RSxZQUROLENBSkosQ0FESjtBQVVIO0FBdk0yQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCAqIGFzIFdob0lzVHlwaW5nIGZyb20gJy4uLy4uLy4uL1dob0lzVHlwaW5nJztcbmltcG9ydCBUaW1lciBmcm9tICcuLi8uLi8uLi91dGlscy9UaW1lcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBNZW1iZXJBdmF0YXIgZnJvbSAnLi4vYXZhdGFycy9NZW1iZXJBdmF0YXInO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1dob0lzVHlwaW5nVGlsZScsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLy8gdGhlIHJvb20gdGhpcyBzdGF0dXNiYXIgaXMgcmVwcmVzZW50aW5nLlxuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIG9uU2hvd246IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvbkhpZGRlbjogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIC8vIE51bWJlciBvZiBuYW1lcyB0byBkaXNwbGF5IGluIHR5cGluZyBpbmRpY2F0aW9uLiBFLmcuIHNldCB0byAzLCB3aWxsXG4gICAgICAgIC8vIHJlc3VsdCBpbiBcIlgsIFksIFogYW5kIDEwMCBvdGhlcnMgYXJlIHR5cGluZy5cIlxuICAgICAgICB3aG9Jc1R5cGluZ0xpbWl0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2hvSXNUeXBpbmdMaW1pdDogMyxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVzZXJzVHlwaW5nOiBXaG9Jc1R5cGluZy51c2Vyc1R5cGluZ0FwYXJ0RnJvbU1lKHRoaXMucHJvcHMucm9vbSksXG4gICAgICAgICAgICAvLyBhIG1hcCB3aXRoIHVzZXJpZCA9PiBUaW1lciB0byBkZWxheVxuICAgICAgICAgICAgLy8gaGlkaW5nIHRoZSBcInggaXMgdHlwaW5nXCIgbWVzc2FnZSBmb3IgYVxuICAgICAgICAgICAgLy8gdXNlciBzbyBoaWRpbmcgaXQgY2FuIGNvaW5jaWRlXG4gICAgICAgICAgICAvLyB3aXRoIHRoZSBzZW50IG1lc3NhZ2UgYnkgdGhlIG90aGVyIHNpZGVcbiAgICAgICAgICAgIC8vIHJlc3VsdGluZyBpbiBsZXNzIHRpbWVsaW5lIGp1bXBpbmVzc1xuICAgICAgICAgICAgZGVsYXllZFN0b3BUeXBpbmdUaW1lcnM6IHt9LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcIlJvb21NZW1iZXIudHlwaW5nXCIsIHRoaXMub25Sb29tTWVtYmVyVHlwaW5nKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbihfLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgY29uc3Qgd2FzVmlzaWJsZSA9IHRoaXMuX2lzVmlzaWJsZShwcmV2U3RhdGUpO1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSB0aGlzLl9pc1Zpc2libGUodGhpcy5zdGF0ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU2hvd24gJiYgIXdhc1Zpc2libGUgJiYgaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2hvd24oKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLm9uSGlkZGVuICYmIHdhc1Zpc2libGUgJiYgIWlzVmlzaWJsZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkhpZGRlbigpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gd2UgbWF5IGhhdmUgZW50aXJlbHkgbG9zdCBvdXIgY2xpZW50IGFzIHdlJ3JlIGxvZ2dpbmcgb3V0IGJlZm9yZSBjbGlja2luZyBsb2dpbiBvbiB0aGUgZ3Vlc3QgYmFyLi4uXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgaWYgKGNsaWVudCkge1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbU1lbWJlci50eXBpbmdcIiwgdGhpcy5vblJvb21NZW1iZXJUeXBpbmcpO1xuICAgICAgICAgICAgY2xpZW50LnJlbW92ZUxpc3RlbmVyKFwiUm9vbS50aW1lbGluZVwiLCB0aGlzLm9uUm9vbVRpbWVsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QudmFsdWVzKHRoaXMuc3RhdGUuZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMpLmZvckVhY2goKHQpID0+IHQuYWJvcnQoKSk7XG4gICAgfSxcblxuICAgIF9pc1Zpc2libGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS51c2Vyc1R5cGluZy5sZW5ndGggIT09IDAgfHwgT2JqZWN0LmtleXMoc3RhdGUuZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMpLmxlbmd0aCAhPT0gMDtcbiAgICB9LFxuXG4gICAgaXNWaXNpYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVmlzaWJsZSh0aGlzLnN0YXRlKTtcbiAgICB9LFxuXG4gICAgb25Sb29tVGltZWxpbmU6IGZ1bmN0aW9uKGV2ZW50LCByb29tKSB7XG4gICAgICAgIGlmIChyb29tICYmIHJvb20ucm9vbUlkID09PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSBldmVudC5nZXRTZW5kZXIoKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB1c2VyIGZyb20gdXNlcnNUeXBpbmdcbiAgICAgICAgICAgIGNvbnN0IHVzZXJzVHlwaW5nID0gdGhpcy5zdGF0ZS51c2Vyc1R5cGluZy5maWx0ZXIoKG0pID0+IG0udXNlcklkICE9PSB1c2VySWQpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dXNlcnNUeXBpbmd9KTtcbiAgICAgICAgICAgIC8vIGFib3J0IHRpbWVyIGlmIGFueVxuICAgICAgICAgICAgdGhpcy5fYWJvcnRVc2VyVGltZXIodXNlcklkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb21NZW1iZXJUeXBpbmc6IGZ1bmN0aW9uKGV2LCBtZW1iZXIpIHtcbiAgICAgICAgY29uc3QgdXNlcnNUeXBpbmcgPSBXaG9Jc1R5cGluZy51c2Vyc1R5cGluZ0FwYXJ0RnJvbU1lQW5kSWdub3JlZCh0aGlzLnByb3BzLnJvb20pO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzOiB0aGlzLl91cGRhdGVEZWxheWVkU3RvcFR5cGluZ1RpbWVycyh1c2Vyc1R5cGluZyksXG4gICAgICAgICAgICB1c2Vyc1R5cGluZyxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF91cGRhdGVEZWxheWVkU3RvcFR5cGluZ1RpbWVycyh1c2Vyc1R5cGluZykge1xuICAgICAgICBjb25zdCB1c2Vyc1RoYXRTdG9wcGVkVHlwaW5nID0gdGhpcy5zdGF0ZS51c2Vyc1R5cGluZy5maWx0ZXIoKGEpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhdXNlcnNUeXBpbmcuc29tZSgoYikgPT4gYS51c2VySWQgPT09IGIudXNlcklkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVzZXJzVGhhdFN0YXJ0ZWRUeXBpbmcgPSB1c2Vyc1R5cGluZy5maWx0ZXIoKGEpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5zdGF0ZS51c2Vyc1R5cGluZy5zb21lKChiKSA9PiBhLnVzZXJJZCA9PT0gYi51c2VySWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gYWJvcnQgYWxsIHRoZSB0aW1lcnMgZm9yIHRoZSB1c2VycyB0aGF0IHN0YXJ0ZWQgdHlwaW5nIGFnYWluXG4gICAgICAgIHVzZXJzVGhhdFN0YXJ0ZWRUeXBpbmcuZm9yRWFjaCgobSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnN0YXRlLmRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzW20udXNlcklkXTtcbiAgICAgICAgICAgIGlmICh0aW1lcikge1xuICAgICAgICAgICAgICAgIHRpbWVyLmFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBwcmVwYXJlIG5ldyBkZWxheWVkU3RvcFR5cGluZ1RpbWVycyBvYmplY3QgdG8gdXBkYXRlIHN0YXRlIHdpdGhcbiAgICAgICAgbGV0IGRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZS5kZWxheWVkU3RvcFR5cGluZ1RpbWVycyk7XG4gICAgICAgIC8vIHJlbW92ZSBtZW1iZXJzIHRoYXQgc3RhcnRlZCB0eXBpbmcgYWdhaW5cbiAgICAgICAgZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMgPSB1c2Vyc1RoYXRTdGFydGVkVHlwaW5nLnJlZHVjZSgoZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMsIG0pID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBkZWxheWVkU3RvcFR5cGluZ1RpbWVyc1ttLnVzZXJJZF07XG4gICAgICAgICAgICByZXR1cm4gZGVsYXllZFN0b3BUeXBpbmdUaW1lcnM7XG4gICAgICAgIH0sIGRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzKTtcbiAgICAgICAgLy8gc3RhcnQgdGltZXIgZm9yIG1lbWJlcnMgdGhhdCBzdG9wcGVkIHR5cGluZ1xuICAgICAgICBkZWxheWVkU3RvcFR5cGluZ1RpbWVycyA9IHVzZXJzVGhhdFN0b3BwZWRUeXBpbmcucmVkdWNlKChkZWxheWVkU3RvcFR5cGluZ1RpbWVycywgbSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFkZWxheWVkU3RvcFR5cGluZ1RpbWVyc1ttLnVzZXJJZF0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lciA9IG5ldyBUaW1lcig1MDAwKTtcbiAgICAgICAgICAgICAgICBkZWxheWVkU3RvcFR5cGluZ1RpbWVyc1ttLnVzZXJJZF0gPSB0aW1lcjtcbiAgICAgICAgICAgICAgICB0aW1lci5zdGFydCgpO1xuICAgICAgICAgICAgICAgIHRpbWVyLmZpbmlzaGVkKCkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5fcmVtb3ZlVXNlclRpbWVyKG0udXNlcklkKSwgLy8gb24gZWxhcHNlZFxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB7LyogYWJvcnRlZCAqL30sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZWxheWVkU3RvcFR5cGluZ1RpbWVycztcbiAgICAgICAgfSwgZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMpO1xuXG4gICAgICAgIHJldHVybiBkZWxheWVkU3RvcFR5cGluZ1RpbWVycztcbiAgICB9LFxuXG4gICAgX2Fib3J0VXNlclRpbWVyOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnN0YXRlLmRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzW3VzZXJJZF07XG4gICAgICAgIGlmICh0aW1lcikge1xuICAgICAgICAgICAgdGltZXIuYWJvcnQoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZVVzZXJUaW1lcih1c2VySWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yZW1vdmVVc2VyVGltZXI6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuc3RhdGUuZGVsYXllZFN0b3BUeXBpbmdUaW1lcnNbdXNlcklkXTtcbiAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICBjb25zdCBkZWxheWVkU3RvcFR5cGluZ1RpbWVycyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuc3RhdGUuZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMpO1xuICAgICAgICAgICAgZGVsZXRlIGRlbGF5ZWRTdG9wVHlwaW5nVGltZXJzW3VzZXJJZF07XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtkZWxheWVkU3RvcFR5cGluZ1RpbWVyc30pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yZW5kZXJUeXBpbmdJbmRpY2F0b3JBdmF0YXJzOiBmdW5jdGlvbih1c2VycywgbGltaXQpIHtcbiAgICAgICAgbGV0IG90aGVyc0NvdW50ID0gMDtcbiAgICAgICAgaWYgKHVzZXJzLmxlbmd0aCA+IGxpbWl0KSB7XG4gICAgICAgICAgICBvdGhlcnNDb3VudCA9IHVzZXJzLmxlbmd0aCAtIGxpbWl0ICsgMTtcbiAgICAgICAgICAgIHVzZXJzID0gdXNlcnMuc2xpY2UoMCwgbGltaXQgLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGF2YXRhcnMgPSB1c2Vycy5tYXAoKHUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPE1lbWJlckF2YXRhclxuICAgICAgICAgICAgICAgICAgICBrZXk9e3UudXNlcklkfVxuICAgICAgICAgICAgICAgICAgICBtZW1iZXI9e3V9XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoPXsyNH1cbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PXsyNH1cbiAgICAgICAgICAgICAgICAgICAgcmVzaXplTWV0aG9kPVwiY3JvcFwiXG4gICAgICAgICAgICAgICAgICAgIHZpZXdVc2VyT25DbGljaz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG90aGVyc0NvdW50ID4gMCkge1xuICAgICAgICAgICAgYXZhdGFycy5wdXNoKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1dob0lzVHlwaW5nVGlsZV9yZW1haW5pbmdBdmF0YXJQbGFjZWhvbGRlclwiIGtleT1cIm90aGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAreyBvdGhlcnNDb3VudCB9XG4gICAgICAgICAgICAgICAgPC9zcGFuPixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXZhdGFycztcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHVzZXJzVHlwaW5nID0gdGhpcy5zdGF0ZS51c2Vyc1R5cGluZztcbiAgICAgICAgY29uc3Qgc3RvcHBlZFVzZXJzT25UaW1lciA9IE9iamVjdC5rZXlzKHRoaXMuc3RhdGUuZGVsYXllZFN0b3BUeXBpbmdUaW1lcnMpXG4gICAgICAgICAgICAubWFwKCh1c2VySWQpID0+IHRoaXMucHJvcHMucm9vbS5nZXRNZW1iZXIodXNlcklkKSk7XG4gICAgICAgIC8vIGFwcGVuZCB0aGUgdXNlcnMgdGhhdCBoYXZlIGJlZW4gcmVwb3J0ZWQgbm90IHR5cGluZyBhbnltb3JlXG4gICAgICAgIC8vIGJ1dCBoYXZlIGEgdGltZW91dCB0aW1lciBydW5uaW5nIHNvIHRoZXkgY2FuIGRpc2FwcGVhclxuICAgICAgICAvLyB3aGVuIGEgbWVzc2FnZSBjb21lcyBpblxuICAgICAgICB1c2Vyc1R5cGluZyA9IHVzZXJzVHlwaW5nLmNvbmNhdChzdG9wcGVkVXNlcnNPblRpbWVyKTtcbiAgICAgICAgLy8gc29ydCB0aGVtIHNvIHRoZSB0eXBpbmcgbWVtYmVycyBkb24ndCBjaGFuZ2Ugb3JkZXIgd2hlblxuICAgICAgICAvLyBtb3ZlZCB0byBkZWxheWVkU3RvcFR5cGluZ1RpbWVyc1xuICAgICAgICB1c2Vyc1R5cGluZy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcblxuICAgICAgICBjb25zdCB0eXBpbmdTdHJpbmcgPSBXaG9Jc1R5cGluZy53aG9Jc1R5cGluZ1N0cmluZyhcbiAgICAgICAgICAgIHVzZXJzVHlwaW5nLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy53aG9Jc1R5cGluZ0xpbWl0LFxuICAgICAgICApO1xuICAgICAgICBpZiAoIXR5cGluZ1N0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT1cIm14X1dob0lzVHlwaW5nVGlsZV9lbXB0eVwiIC8+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibXhfV2hvSXNUeXBpbmdUaWxlXCIgYXJpYS1hdG9taWM9XCJ0cnVlXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9XaG9Jc1R5cGluZ1RpbGVfYXZhdGFyc1wiPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX3JlbmRlclR5cGluZ0luZGljYXRvckF2YXRhcnModXNlcnNUeXBpbmcsIHRoaXMucHJvcHMud2hvSXNUeXBpbmdMaW1pdCkgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfV2hvSXNUeXBpbmdUaWxlX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdHlwaW5nU3RyaW5nIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19