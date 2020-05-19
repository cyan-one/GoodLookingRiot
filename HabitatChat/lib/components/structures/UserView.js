"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../index"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var _languageHandler = require("../../languageHandler");

var _HomePage = _interopRequireDefault(require("./HomePage"));

/*
Copyright 2019 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
class UserView extends _react.default.Component {
  static get propTypes() {
    return {
      userId: _propTypes.default.string
    };
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.userId) {
      this._loadProfileInfo();
    }
  }

  componentDidUpdate(prevProps) {
    // XXX: We shouldn't need to null check the userId here, but we declare
    // it as optional and MatrixChat sometimes fires in a way which results
    // in an NPE when we try to update the profile info.
    if (prevProps.userId !== this.props.userId && this.props.userId) {
      this._loadProfileInfo();
    }
  }

  async _loadProfileInfo() {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    this.setState({
      loading: true
    });
    let profileInfo;

    try {
      profileInfo = await cli.getProfileInfo(this.props.userId);
    } catch (err) {
      const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

      _Modal.default.createTrackedDialog((0, _languageHandler._t)('Could not load user profile'), '', ErrorDialog, {
        title: (0, _languageHandler._t)('Could not load user profile'),
        description: err && err.message ? err.message : (0, _languageHandler._t)("Operation failed")
      });

      this.setState({
        loading: false
      });
      return;
    }

    const fakeEvent = new _matrixJsSdk.default.MatrixEvent({
      type: "m.room.member",
      content: profileInfo
    });
    const member = new _matrixJsSdk.default.RoomMember(null, this.props.userId);
    member.setMembershipEvent(fakeEvent);
    this.setState({
      member,
      loading: false
    });
  }

  render() {
    if (this.state.loading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else if (this.state.member) {
      const RightPanel = sdk.getComponent('structures.RightPanel');
      const MainSplit = sdk.getComponent('structures.MainSplit');

      const panel = /*#__PURE__*/_react.default.createElement(RightPanel, {
        user: this.state.member
      });

      return /*#__PURE__*/_react.default.createElement(MainSplit, {
        panel: panel
      }, /*#__PURE__*/_react.default.createElement(_HomePage.default, null));
    } else {
      return /*#__PURE__*/_react.default.createElement("div", null);
    }
  }

}

exports.default = UserView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvVXNlclZpZXcuanMiXSwibmFtZXMiOlsiVXNlclZpZXciLCJSZWFjdCIsIkNvbXBvbmVudCIsInByb3BUeXBlcyIsInVzZXJJZCIsIlByb3BUeXBlcyIsInN0cmluZyIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsImNvbXBvbmVudERpZE1vdW50IiwiX2xvYWRQcm9maWxlSW5mbyIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsImNsaSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInNldFN0YXRlIiwibG9hZGluZyIsInByb2ZpbGVJbmZvIiwiZ2V0UHJvZmlsZUluZm8iLCJlcnIiLCJFcnJvckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJtZXNzYWdlIiwiZmFrZUV2ZW50IiwiTWF0cml4IiwiTWF0cml4RXZlbnQiLCJ0eXBlIiwiY29udGVudCIsIm1lbWJlciIsIlJvb21NZW1iZXIiLCJzZXRNZW1iZXJzaGlwRXZlbnQiLCJyZW5kZXIiLCJTcGlubmVyIiwiUmlnaHRQYW5lbCIsIk1haW5TcGxpdCIsInBhbmVsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQmUsTUFBTUEsUUFBTixTQUF1QkMsZUFBTUMsU0FBN0IsQ0FBdUM7QUFDbEQsYUFBV0MsU0FBWCxHQUF1QjtBQUNuQixXQUFPO0FBQ0hDLE1BQUFBLE1BQU0sRUFBRUMsbUJBQVVDO0FBRGYsS0FBUDtBQUdIOztBQUVEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFDQSxTQUFLQyxLQUFMLEdBQWEsRUFBYjtBQUNIOztBQUVEQyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixRQUFJLEtBQUtGLEtBQUwsQ0FBV0osTUFBZixFQUF1QjtBQUNuQixXQUFLTyxnQkFBTDtBQUNIO0FBQ0o7O0FBRURDLEVBQUFBLGtCQUFrQixDQUFDQyxTQUFELEVBQVk7QUFDMUI7QUFDQTtBQUNBO0FBQ0EsUUFBSUEsU0FBUyxDQUFDVCxNQUFWLEtBQXFCLEtBQUtJLEtBQUwsQ0FBV0osTUFBaEMsSUFBMEMsS0FBS0ksS0FBTCxDQUFXSixNQUF6RCxFQUFpRTtBQUM3RCxXQUFLTyxnQkFBTDtBQUNIO0FBQ0o7O0FBRUQsUUFBTUEsZ0JBQU4sR0FBeUI7QUFDckIsVUFBTUcsR0FBRyxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQVo7O0FBQ0EsU0FBS0MsUUFBTCxDQUFjO0FBQUNDLE1BQUFBLE9BQU8sRUFBRTtBQUFWLEtBQWQ7QUFDQSxRQUFJQyxXQUFKOztBQUNBLFFBQUk7QUFDQUEsTUFBQUEsV0FBVyxHQUFHLE1BQU1MLEdBQUcsQ0FBQ00sY0FBSixDQUFtQixLQUFLWixLQUFMLENBQVdKLE1BQTlCLENBQXBCO0FBQ0gsS0FGRCxDQUVFLE9BQU9pQixHQUFQLEVBQVk7QUFDVixZQUFNQyxXQUFXLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBcEI7O0FBQ0FDLHFCQUFNQyxtQkFBTixDQUEwQix5QkFBRyw2QkFBSCxDQUExQixFQUE2RCxFQUE3RCxFQUFpRUosV0FBakUsRUFBOEU7QUFDMUVLLFFBQUFBLEtBQUssRUFBRSx5QkFBRyw2QkFBSCxDQURtRTtBQUUxRUMsUUFBQUEsV0FBVyxFQUFJUCxHQUFHLElBQUlBLEdBQUcsQ0FBQ1EsT0FBWixHQUF1QlIsR0FBRyxDQUFDUSxPQUEzQixHQUFxQyx5QkFBRyxrQkFBSDtBQUZ1QixPQUE5RTs7QUFJQSxXQUFLWixRQUFMLENBQWM7QUFBQ0MsUUFBQUEsT0FBTyxFQUFFO0FBQVYsT0FBZDtBQUNBO0FBQ0g7O0FBQ0QsVUFBTVksU0FBUyxHQUFHLElBQUlDLHFCQUFPQyxXQUFYLENBQXVCO0FBQUNDLE1BQUFBLElBQUksRUFBRSxlQUFQO0FBQXdCQyxNQUFBQSxPQUFPLEVBQUVmO0FBQWpDLEtBQXZCLENBQWxCO0FBQ0EsVUFBTWdCLE1BQU0sR0FBRyxJQUFJSixxQkFBT0ssVUFBWCxDQUFzQixJQUF0QixFQUE0QixLQUFLNUIsS0FBTCxDQUFXSixNQUF2QyxDQUFmO0FBQ0ErQixJQUFBQSxNQUFNLENBQUNFLGtCQUFQLENBQTBCUCxTQUExQjtBQUNBLFNBQUtiLFFBQUwsQ0FBYztBQUFDa0IsTUFBQUEsTUFBRDtBQUFTakIsTUFBQUEsT0FBTyxFQUFFO0FBQWxCLEtBQWQ7QUFDSDs7QUFFRG9CLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUksS0FBSzdCLEtBQUwsQ0FBV1MsT0FBZixFQUF3QjtBQUNwQixZQUFNcUIsT0FBTyxHQUFHaEIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLDBCQUFPLDZCQUFDLE9BQUQsT0FBUDtBQUNILEtBSEQsTUFHTyxJQUFJLEtBQUtmLEtBQUwsQ0FBVzBCLE1BQWYsRUFBdUI7QUFDMUIsWUFBTUssVUFBVSxHQUFHakIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHVCQUFqQixDQUFuQjtBQUNBLFlBQU1pQixTQUFTLEdBQUdsQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsc0JBQWpCLENBQWxCOztBQUNBLFlBQU1rQixLQUFLLGdCQUFHLDZCQUFDLFVBQUQ7QUFBWSxRQUFBLElBQUksRUFBRSxLQUFLakMsS0FBTCxDQUFXMEI7QUFBN0IsUUFBZDs7QUFDQSwwQkFBUSw2QkFBQyxTQUFEO0FBQVcsUUFBQSxLQUFLLEVBQUVPO0FBQWxCLHNCQUF5Qiw2QkFBQyxpQkFBRCxPQUF6QixDQUFSO0FBQ0gsS0FMTSxNQUtBO0FBQ0gsMEJBQVEseUNBQVI7QUFDSDtBQUNKOztBQTVEaUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCBNYXRyaXggZnJvbSBcIm1hdHJpeC1qcy1zZGtcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uL2luZGV4XCI7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vTW9kYWwnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IEhvbWVQYWdlIGZyb20gXCIuL0hvbWVQYWdlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVzZXJWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgZ2V0IHByb3BUeXBlcygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVzZXJJZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMudXNlcklkKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkUHJvZmlsZUluZm8oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMpIHtcbiAgICAgICAgLy8gWFhYOiBXZSBzaG91bGRuJ3QgbmVlZCB0byBudWxsIGNoZWNrIHRoZSB1c2VySWQgaGVyZSwgYnV0IHdlIGRlY2xhcmVcbiAgICAgICAgLy8gaXQgYXMgb3B0aW9uYWwgYW5kIE1hdHJpeENoYXQgc29tZXRpbWVzIGZpcmVzIGluIGEgd2F5IHdoaWNoIHJlc3VsdHNcbiAgICAgICAgLy8gaW4gYW4gTlBFIHdoZW4gd2UgdHJ5IHRvIHVwZGF0ZSB0aGUgcHJvZmlsZSBpbmZvLlxuICAgICAgICBpZiAocHJldlByb3BzLnVzZXJJZCAhPT0gdGhpcy5wcm9wcy51c2VySWQgJiYgdGhpcy5wcm9wcy51c2VySWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvYWRQcm9maWxlSW5mbygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgX2xvYWRQcm9maWxlSW5mbygpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgICAgIGxldCBwcm9maWxlSW5mbztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb2ZpbGVJbmZvID0gYXdhaXQgY2xpLmdldFByb2ZpbGVJbmZvKHRoaXMucHJvcHMudXNlcklkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuRXJyb3JEaWFsb2cnKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coX3QoJ0NvdWxkIG5vdCBsb2FkIHVzZXIgcHJvZmlsZScpLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0NvdWxkIG5vdCBsb2FkIHVzZXIgcHJvZmlsZScpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KFwiT3BlcmF0aW9uIGZhaWxlZFwiKSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IGZhbHNlfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmFrZUV2ZW50ID0gbmV3IE1hdHJpeC5NYXRyaXhFdmVudCh7dHlwZTogXCJtLnJvb20ubWVtYmVyXCIsIGNvbnRlbnQ6IHByb2ZpbGVJbmZvfSk7XG4gICAgICAgIGNvbnN0IG1lbWJlciA9IG5ldyBNYXRyaXguUm9vbU1lbWJlcihudWxsLCB0aGlzLnByb3BzLnVzZXJJZCk7XG4gICAgICAgIG1lbWJlci5zZXRNZW1iZXJzaGlwRXZlbnQoZmFrZUV2ZW50KTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bWVtYmVyLCBsb2FkaW5nOiBmYWxzZX0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubG9hZGluZykge1xuICAgICAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUubWVtYmVyKSB7XG4gICAgICAgICAgICBjb25zdCBSaWdodFBhbmVsID0gc2RrLmdldENvbXBvbmVudCgnc3RydWN0dXJlcy5SaWdodFBhbmVsJyk7XG4gICAgICAgICAgICBjb25zdCBNYWluU3BsaXQgPSBzZGsuZ2V0Q29tcG9uZW50KCdzdHJ1Y3R1cmVzLk1haW5TcGxpdCcpO1xuICAgICAgICAgICAgY29uc3QgcGFuZWwgPSA8UmlnaHRQYW5lbCB1c2VyPXt0aGlzLnN0YXRlLm1lbWJlcn0gLz47XG4gICAgICAgICAgICByZXR1cm4gKDxNYWluU3BsaXQgcGFuZWw9e3BhbmVsfT48SG9tZVBhZ2UgLz48L01haW5TcGxpdD4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IC8+KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==