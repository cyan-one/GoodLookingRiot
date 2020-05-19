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

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd

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
  displayName: 'ChangeAvatar',
  propTypes: {
    initialAvatarUrl: _propTypes.default.string,
    room: _propTypes.default.object,
    // if false, you need to call changeAvatar.onFileSelected yourself.
    showUploadSection: _propTypes.default.bool,
    width: _propTypes.default.number,
    height: _propTypes.default.number,
    className: _propTypes.default.string
  },
  Phases: {
    Display: "display",
    Uploading: "uploading",
    Error: "error"
  },
  getDefaultProps: function () {
    return {
      showUploadSection: true,
      className: "",
      width: 80,
      height: 80
    };
  },
  getInitialState: function () {
    return {
      avatarUrl: this.props.initialAvatarUrl,
      phase: this.Phases.Display
    };
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this.onRoomStateEvents);
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    if (this.avatarSet) {
      // don't clobber what the user has just set
      return;
    }

    this.setState({
      avatarUrl: newProps.initialAvatarUrl
    });
  },
  componentWillUnmount: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("RoomState.events", this.onRoomStateEvents);
    }
  },
  onRoomStateEvents: function (ev) {
    if (!this.props.room) {
      return;
    }

    if (ev.getRoomId() !== this.props.room.roomId || ev.getType() !== 'm.room.avatar' || ev.getSender() !== _MatrixClientPeg.MatrixClientPeg.get().getUserId()) {
      return;
    }

    if (!ev.getContent().url) {
      this.avatarSet = false;
      this.setState({}); // force update
    }
  },
  setAvatarFromFile: function (file) {
    let newUrl = null;
    this.setState({
      phase: this.Phases.Uploading
    });
    const self = this;

    const httpPromise = _MatrixClientPeg.MatrixClientPeg.get().uploadContent(file).then(function (url) {
      newUrl = url;

      if (self.props.room) {
        return _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(self.props.room.roomId, 'm.room.avatar', {
          url: url
        }, '');
      } else {
        return _MatrixClientPeg.MatrixClientPeg.get().setAvatarUrl(url);
      }
    });

    httpPromise.then(function () {
      self.setState({
        phase: self.Phases.Display,
        avatarUrl: _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(newUrl)
      });
    }, function (error) {
      self.setState({
        phase: self.Phases.Error
      });
      self.onError(error);
    });
    return httpPromise;
  },
  onFileSelected: function (ev) {
    this.avatarSet = true;
    return this.setAvatarFromFile(ev.target.files[0]);
  },
  onError: function (error) {
    this.setState({
      errorText: (0, _languageHandler._t)("Failed to upload profile picture!")
    });
  },
  render: function () {
    let avatarImg; // Having just set an avatar we just display that since it will take a little
    // time to propagate through to the RoomAvatar.

    if (this.props.room && !this.avatarSet) {
      const RoomAvatar = sdk.getComponent('avatars.RoomAvatar');
      avatarImg = /*#__PURE__*/_react.default.createElement(RoomAvatar, {
        room: this.props.room,
        width: this.props.width,
        height: this.props.height,
        resizeMethod: "crop"
      });
    } else {
      const BaseAvatar = sdk.getComponent("avatars.BaseAvatar"); // XXX: FIXME: once we track in the JS what our own displayname is(!) then use it here rather than ?

      avatarImg = /*#__PURE__*/_react.default.createElement(BaseAvatar, {
        width: this.props.width,
        height: this.props.height,
        resizeMethod: "crop",
        name: "?",
        idName: _MatrixClientPeg.MatrixClientPeg.get().getUserIdLocalpart(),
        url: this.state.avatarUrl
      });
    }

    let uploadSection;

    if (this.props.showUploadSection) {
      uploadSection = /*#__PURE__*/_react.default.createElement("div", {
        className: this.props.className
      }, (0, _languageHandler._t)("Upload new:"), /*#__PURE__*/_react.default.createElement("input", {
        type: "file",
        accept: "image/*",
        onChange: this.onFileSelected
      }), this.state.errorText);
    }

    switch (this.state.phase) {
      case this.Phases.Display:
      case this.Phases.Error:
        return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
          className: this.props.className
        }, avatarImg), uploadSection);

      case this.Phases.Uploading:
        var Loader = sdk.getComponent("elements.Spinner");
        return /*#__PURE__*/_react.default.createElement(Loader, null);
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0NoYW5nZUF2YXRhci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsImluaXRpYWxBdmF0YXJVcmwiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJyb29tIiwib2JqZWN0Iiwic2hvd1VwbG9hZFNlY3Rpb24iLCJib29sIiwid2lkdGgiLCJudW1iZXIiLCJoZWlnaHQiLCJjbGFzc05hbWUiLCJQaGFzZXMiLCJEaXNwbGF5IiwiVXBsb2FkaW5nIiwiRXJyb3IiLCJnZXREZWZhdWx0UHJvcHMiLCJnZXRJbml0aWFsU3RhdGUiLCJhdmF0YXJVcmwiLCJwcm9wcyIsInBoYXNlIiwiY29tcG9uZW50RGlkTW91bnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJvbiIsIm9uUm9vbVN0YXRlRXZlbnRzIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXdQcm9wcyIsImF2YXRhclNldCIsInNldFN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVMaXN0ZW5lciIsImV2IiwiZ2V0Um9vbUlkIiwicm9vbUlkIiwiZ2V0VHlwZSIsImdldFNlbmRlciIsImdldFVzZXJJZCIsImdldENvbnRlbnQiLCJ1cmwiLCJzZXRBdmF0YXJGcm9tRmlsZSIsImZpbGUiLCJuZXdVcmwiLCJzZWxmIiwiaHR0cFByb21pc2UiLCJ1cGxvYWRDb250ZW50IiwidGhlbiIsInNlbmRTdGF0ZUV2ZW50Iiwic2V0QXZhdGFyVXJsIiwibXhjVXJsVG9IdHRwIiwiZXJyb3IiLCJvbkVycm9yIiwib25GaWxlU2VsZWN0ZWQiLCJ0YXJnZXQiLCJmaWxlcyIsImVycm9yVGV4dCIsInJlbmRlciIsImF2YXRhckltZyIsIlJvb21BdmF0YXIiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJCYXNlQXZhdGFyIiwiZ2V0VXNlcklkTG9jYWxwYXJ0Iiwic3RhdGUiLCJ1cGxvYWRTZWN0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QkMsR0FBaEIsR0FBc0J1QyxrQkFBdEIsRUFEakI7QUFDNkQsUUFBQSxHQUFHLEVBQUUsS0FBS0MsS0FBTCxDQUFXN0M7QUFEN0UsUUFBWjtBQUVIOztBQUVELFFBQUk4QyxhQUFKOztBQUNBLFFBQUksS0FBSzdDLEtBQUwsQ0FBV2IsaUJBQWYsRUFBa0M7QUFDOUIwRCxNQUFBQSxhQUFhLGdCQUNUO0FBQUssUUFBQSxTQUFTLEVBQUUsS0FBSzdDLEtBQUwsQ0FBV1I7QUFBM0IsU0FDTSx5QkFBRyxhQUFILENBRE4sZUFFSTtBQUFPLFFBQUEsSUFBSSxFQUFDLE1BQVo7QUFBbUIsUUFBQSxNQUFNLEVBQUMsU0FBMUI7QUFBb0MsUUFBQSxRQUFRLEVBQUUsS0FBS3lDO0FBQW5ELFFBRkosRUFHTSxLQUFLVyxLQUFMLENBQVdSLFNBSGpCLENBREo7QUFPSDs7QUFFRCxZQUFRLEtBQUtRLEtBQUwsQ0FBVzNDLEtBQW5CO0FBQ0ksV0FBSyxLQUFLUixNQUFMLENBQVlDLE9BQWpCO0FBQ0EsV0FBSyxLQUFLRCxNQUFMLENBQVlHLEtBQWpCO0FBQ0ksNEJBQ0ksdURBQ0k7QUFBSyxVQUFBLFNBQVMsRUFBRSxLQUFLSSxLQUFMLENBQVdSO0FBQTNCLFdBQ004QyxTQUROLENBREosRUFJTU8sYUFKTixDQURKOztBQVFKLFdBQUssS0FBS3BELE1BQUwsQ0FBWUUsU0FBakI7QUFDSSxZQUFJbUQsTUFBTSxHQUFHTixHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQWI7QUFDQSw0QkFDSSw2QkFBQyxNQUFELE9BREo7QUFiUjtBQWlCSDtBQWhLMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0NoYW5nZUF2YXRhcicsXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIGluaXRpYWxBdmF0YXJVcmw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QsXG4gICAgICAgIC8vIGlmIGZhbHNlLCB5b3UgbmVlZCB0byBjYWxsIGNoYW5nZUF2YXRhci5vbkZpbGVTZWxlY3RlZCB5b3Vyc2VsZi5cbiAgICAgICAgc2hvd1VwbG9hZFNlY3Rpb246IFByb3BUeXBlcy5ib29sLFxuICAgICAgICB3aWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIFBoYXNlczoge1xuICAgICAgICBEaXNwbGF5OiBcImRpc3BsYXlcIixcbiAgICAgICAgVXBsb2FkaW5nOiBcInVwbG9hZGluZ1wiLFxuICAgICAgICBFcnJvcjogXCJlcnJvclwiLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvd1VwbG9hZFNlY3Rpb246IHRydWUsXG4gICAgICAgICAgICBjbGFzc05hbWU6IFwiXCIsXG4gICAgICAgICAgICB3aWR0aDogODAsXG4gICAgICAgICAgICBoZWlnaHQ6IDgwLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYXZhdGFyVXJsOiB0aGlzLnByb3BzLmluaXRpYWxBdmF0YXJVcmwsXG4gICAgICAgICAgICBwaGFzZTogdGhpcy5QaGFzZXMuRGlzcGxheSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oXCJSb29tU3RhdGUuZXZlbnRzXCIsIHRoaXMub25Sb29tU3RhdGVFdmVudHMpO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xuICAgICAgICBpZiAodGhpcy5hdmF0YXJTZXQpIHtcbiAgICAgICAgICAgIC8vIGRvbid0IGNsb2JiZXIgd2hhdCB0aGUgdXNlciBoYXMganVzdCBzZXRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGF2YXRhclVybDogbmV3UHJvcHMuaW5pdGlhbEF2YXRhclVybCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKSkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblJvb21TdGF0ZUV2ZW50czogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLnJvb20pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldi5nZXRSb29tSWQoKSAhPT0gdGhpcy5wcm9wcy5yb29tLnJvb21JZCB8fCBldi5nZXRUeXBlKCkgIT09ICdtLnJvb20uYXZhdGFyJ1xuICAgICAgICAgICAgfHwgZXYuZ2V0U2VuZGVyKCkgIT09IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VySWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFldi5nZXRDb250ZW50KCkudXJsKSB7XG4gICAgICAgICAgICB0aGlzLmF2YXRhclNldCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7fSk7IC8vIGZvcmNlIHVwZGF0ZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldEF2YXRhckZyb21GaWxlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIGxldCBuZXdVcmwgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IHRoaXMuUGhhc2VzLlVwbG9hZGluZyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBodHRwUHJvbWlzZSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS51cGxvYWRDb250ZW50KGZpbGUpLnRoZW4oZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICBuZXdVcmwgPSB1cmw7XG4gICAgICAgICAgICBpZiAoc2VsZi5wcm9wcy5yb29tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kU3RhdGVFdmVudChcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wcm9wcy5yb29tLnJvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgJ20ucm9vbS5hdmF0YXInLFxuICAgICAgICAgICAgICAgICAgICB7dXJsOiB1cmx9LFxuICAgICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldEF2YXRhclVybCh1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBodHRwUHJvbWlzZS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgcGhhc2U6IHNlbGYuUGhhc2VzLkRpc3BsYXksXG4gICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKG5ld1VybCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHBoYXNlOiBzZWxmLlBoYXNlcy5FcnJvcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZi5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHBQcm9taXNlO1xuICAgIH0sXG5cbiAgICBvbkZpbGVTZWxlY3RlZDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdGhpcy5hdmF0YXJTZXQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBdmF0YXJGcm9tRmlsZShldi50YXJnZXQuZmlsZXNbMF0pO1xuICAgIH0sXG5cbiAgICBvbkVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yVGV4dDogX3QoXCJGYWlsZWQgdG8gdXBsb2FkIHByb2ZpbGUgcGljdHVyZSFcIiksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgYXZhdGFySW1nO1xuICAgICAgICAvLyBIYXZpbmcganVzdCBzZXQgYW4gYXZhdGFyIHdlIGp1c3QgZGlzcGxheSB0aGF0IHNpbmNlIGl0IHdpbGwgdGFrZSBhIGxpdHRsZVxuICAgICAgICAvLyB0aW1lIHRvIHByb3BhZ2F0ZSB0aHJvdWdoIHRvIHRoZSBSb29tQXZhdGFyLlxuICAgICAgICBpZiAodGhpcy5wcm9wcy5yb29tICYmICF0aGlzLmF2YXRhclNldCkge1xuICAgICAgICAgICAgY29uc3QgUm9vbUF2YXRhciA9IHNkay5nZXRDb21wb25lbnQoJ2F2YXRhcnMuUm9vbUF2YXRhcicpO1xuICAgICAgICAgICAgYXZhdGFySW1nID0gPFJvb21BdmF0YXIgcm9vbT17dGhpcy5wcm9wcy5yb29tfSB3aWR0aD17dGhpcy5wcm9wcy53aWR0aH0gaGVpZ2h0PXt0aGlzLnByb3BzLmhlaWdodH0gcmVzaXplTWV0aG9kPSdjcm9wJyAvPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXZhdGFycy5CYXNlQXZhdGFyXCIpO1xuICAgICAgICAgICAgLy8gWFhYOiBGSVhNRTogb25jZSB3ZSB0cmFjayBpbiB0aGUgSlMgd2hhdCBvdXIgb3duIGRpc3BsYXluYW1lIGlzKCEpIHRoZW4gdXNlIGl0IGhlcmUgcmF0aGVyIHRoYW4gP1xuICAgICAgICAgICAgYXZhdGFySW1nID0gPEJhc2VBdmF0YXIgd2lkdGg9e3RoaXMucHJvcHMud2lkdGh9IGhlaWdodD17dGhpcy5wcm9wcy5oZWlnaHR9IHJlc2l6ZU1ldGhvZD0nY3JvcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9Jz8nIGlkTmFtZT17TWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXJJZExvY2FscGFydCgpfSB1cmw9e3RoaXMuc3RhdGUuYXZhdGFyVXJsfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB1cGxvYWRTZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zaG93VXBsb2FkU2VjdGlvbikge1xuICAgICAgICAgICAgdXBsb2FkU2VjdGlvbiA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17dGhpcy5wcm9wcy5jbGFzc05hbWV9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KFwiVXBsb2FkIG5ldzpcIikgfVxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImZpbGVcIiBhY2NlcHQ9XCJpbWFnZS8qXCIgb25DaGFuZ2U9e3RoaXMub25GaWxlU2VsZWN0ZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS5lcnJvclRleHQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5waGFzZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLlBoYXNlcy5EaXNwbGF5OlxuICAgICAgICAgICAgY2FzZSB0aGlzLlBoYXNlcy5FcnJvcjpcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGF2YXRhckltZyB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdXBsb2FkU2VjdGlvbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIHRoaXMuUGhhc2VzLlVwbG9hZGluZzpcbiAgICAgICAgICAgICAgICB2YXIgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPExvYWRlciAvPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=