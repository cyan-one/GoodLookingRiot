"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var Avatar = _interopRequireWildcard(require("../../../Avatar"));

var _contentRepo = require("matrix-js-sdk/src/content-repo");

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
  displayName: 'RoomAvatar',
  // Room may be left unset here, but if it is,
  // oobData.avatarUrl should be set (else there
  // would be nowhere to get the avatar from)
  propTypes: {
    room: _propTypes.default.object,
    oobData: _propTypes.default.object,
    width: _propTypes.default.number,
    height: _propTypes.default.number,
    resizeMethod: _propTypes.default.string,
    viewAvatarOnClick: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      width: 36,
      height: 36,
      resizeMethod: 'crop',
      oobData: {}
    };
  },
  getInitialState: function () {
    return {
      urls: this.getImageUrls(this.props)
    };
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on("RoomState.events", this.onRoomStateEvents);
  },
  componentWillUnmount: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener("RoomState.events", this.onRoomStateEvents);
    }
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (newProps) {
    this.setState({
      urls: this.getImageUrls(newProps)
    });
  },
  onRoomStateEvents: function (ev) {
    if (!this.props.room || ev.getRoomId() !== this.props.room.roomId || ev.getType() !== 'm.room.avatar') return;
    this.setState({
      urls: this.getImageUrls(this.props)
    });
  },
  getImageUrls: function (props) {
    return [(0, _contentRepo.getHttpUriForMxc)(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), props.oobData.avatarUrl, Math.floor(props.width * window.devicePixelRatio), Math.floor(props.height * window.devicePixelRatio), props.resizeMethod), // highest priority
    this.getRoomAvatarUrl(props)].filter(function (url) {
      return url != null && url != "";
    });
  },
  getRoomAvatarUrl: function (props) {
    if (!props.room) return null;
    return Avatar.avatarUrlForRoom(props.room, Math.floor(props.width * window.devicePixelRatio), Math.floor(props.height * window.devicePixelRatio), props.resizeMethod);
  },
  onRoomAvatarClick: function () {
    const avatarUrl = this.props.room.getAvatarUrl(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), null, null, null, false);
    const ImageView = sdk.getComponent("elements.ImageView");
    const params = {
      src: avatarUrl,
      name: this.props.room.name
    };

    _Modal.default.createDialog(ImageView, params, "mx_Dialog_lightbox");
  },
  render: function () {
    const BaseAvatar = sdk.getComponent("avatars.BaseAvatar");
    /*eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }]*/

    const _this$props = this.props,
          {
      room,
      oobData,
      viewAvatarOnClick
    } = _this$props,
          otherProps = (0, _objectWithoutProperties2.default)(_this$props, ["room", "oobData", "viewAvatarOnClick"]);
    const roomName = room ? room.name : oobData.name;
    return /*#__PURE__*/_react.default.createElement(BaseAvatar, (0, _extends2.default)({}, otherProps, {
      name: roomName,
      idName: room ? room.roomId : null,
      urls: this.state.urls,
      onClick: this.props.viewAvatarOnClick ? this.onRoomAvatarClick : null,
      disabled: !this.state.urls[0]
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F2YXRhcnMvUm9vbUF2YXRhci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsInJvb20iLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJvb2JEYXRhIiwid2lkdGgiLCJudW1iZXIiLCJoZWlnaHQiLCJyZXNpemVNZXRob2QiLCJzdHJpbmciLCJ2aWV3QXZhdGFyT25DbGljayIsImJvb2wiLCJnZXREZWZhdWx0UHJvcHMiLCJnZXRJbml0aWFsU3RhdGUiLCJ1cmxzIiwiZ2V0SW1hZ2VVcmxzIiwicHJvcHMiLCJjb21wb25lbnREaWRNb3VudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm9uIiwib25Sb29tU3RhdGVFdmVudHMiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsaSIsInJlbW92ZUxpc3RlbmVyIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXdQcm9wcyIsInNldFN0YXRlIiwiZXYiLCJnZXRSb29tSWQiLCJyb29tSWQiLCJnZXRUeXBlIiwiZ2V0SG9tZXNlcnZlclVybCIsImF2YXRhclVybCIsIk1hdGgiLCJmbG9vciIsIndpbmRvdyIsImRldmljZVBpeGVsUmF0aW8iLCJnZXRSb29tQXZhdGFyVXJsIiwiZmlsdGVyIiwidXJsIiwiQXZhdGFyIiwiYXZhdGFyVXJsRm9yUm9vbSIsIm9uUm9vbUF2YXRhckNsaWNrIiwiZ2V0QXZhdGFyVXJsIiwiSW1hZ2VWaWV3Iiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicGFyYW1zIiwic3JjIiwibmFtZSIsIk1vZGFsIiwiY3JlYXRlRGlhbG9nIiwicmVuZGVyIiwiQmFzZUF2YXRhciIsIm90aGVyUHJvcHMiLCJyb29tTmFtZSIsInN0YXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFlQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7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QUVBLFVBQU1DLFFBQVEsR0FBR3ZELElBQUksR0FBR0EsSUFBSSxDQUFDaUQsSUFBUixHQUFlOUMsT0FBTyxDQUFDOEMsSUFBNUM7QUFFQSx3QkFDSSw2QkFBQyxVQUFELDZCQUFnQkssVUFBaEI7QUFBNEIsTUFBQSxJQUFJLEVBQUVDLFFBQWxDO0FBQ0ksTUFBQSxNQUFNLEVBQUV2RCxJQUFJLEdBQUdBLElBQUksQ0FBQzZCLE1BQVIsR0FBaUIsSUFEakM7QUFFSSxNQUFBLElBQUksRUFBRSxLQUFLMkIsS0FBTCxDQUFXM0MsSUFGckI7QUFHSSxNQUFBLE9BQU8sRUFBRSxLQUFLRSxLQUFMLENBQVdOLGlCQUFYLEdBQStCLEtBQUtpQyxpQkFBcEMsR0FBd0QsSUFIckU7QUFJSSxNQUFBLFFBQVEsRUFBRSxDQUFDLEtBQUtjLEtBQUwsQ0FBVzNDLElBQVgsQ0FBZ0IsQ0FBaEI7QUFKZixPQURKO0FBT0g7QUFqSDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCAqIGFzIEF2YXRhciBmcm9tICcuLi8uLi8uLi9BdmF0YXInO1xuaW1wb3J0IHtnZXRIdHRwVXJpRm9yTXhjfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvY29udGVudC1yZXBvXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnUm9vbUF2YXRhcicsXG5cbiAgICAvLyBSb29tIG1heSBiZSBsZWZ0IHVuc2V0IGhlcmUsIGJ1dCBpZiBpdCBpcyxcbiAgICAvLyBvb2JEYXRhLmF2YXRhclVybCBzaG91bGQgYmUgc2V0IChlbHNlIHRoZXJlXG4gICAgLy8gd291bGQgYmUgbm93aGVyZSB0byBnZXQgdGhlIGF2YXRhciBmcm9tKVxuICAgIHByb3BUeXBlczoge1xuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICBvb2JEYXRhOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICB3aWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICByZXNpemVNZXRob2Q6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIHZpZXdBdmF0YXJPbkNsaWNrOiBQcm9wVHlwZXMuYm9vbCxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiAzNixcbiAgICAgICAgICAgIGhlaWdodDogMzYsXG4gICAgICAgICAgICByZXNpemVNZXRob2Q6ICdjcm9wJyxcbiAgICAgICAgICAgIG9vYkRhdGE6IHt9LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXJsczogdGhpcy5nZXRJbWFnZVVybHModGhpcy5wcm9wcyksXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLm9uKFwiUm9vbVN0YXRlLmV2ZW50c1wiLCB0aGlzLm9uUm9vbVN0YXRlRXZlbnRzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGkpIHtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcIlJvb21TdGF0ZS5ldmVudHNcIiwgdGhpcy5vblJvb21TdGF0ZUV2ZW50cyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICB1cmxzOiB0aGlzLmdldEltYWdlVXJscyhuZXdQcm9wcyksXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJvb21TdGF0ZUV2ZW50czogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLnJvb20gfHxcbiAgICAgICAgICAgIGV2LmdldFJvb21JZCgpICE9PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkIHx8XG4gICAgICAgICAgICBldi5nZXRUeXBlKCkgIT09ICdtLnJvb20uYXZhdGFyJ1xuICAgICAgICApIHJldHVybjtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHVybHM6IHRoaXMuZ2V0SW1hZ2VVcmxzKHRoaXMucHJvcHMpLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0SW1hZ2VVcmxzOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZ2V0SHR0cFVyaUZvck14YyhcbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0SG9tZXNlcnZlclVybCgpLFxuICAgICAgICAgICAgICAgIHByb3BzLm9vYkRhdGEuYXZhdGFyVXJsLFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IocHJvcHMud2lkdGggKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyksXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vcihwcm9wcy5oZWlnaHQgKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyksXG4gICAgICAgICAgICAgICAgcHJvcHMucmVzaXplTWV0aG9kLFxuICAgICAgICAgICAgKSwgLy8gaGlnaGVzdCBwcmlvcml0eVxuICAgICAgICAgICAgdGhpcy5nZXRSb29tQXZhdGFyVXJsKHByb3BzKSxcbiAgICAgICAgXS5maWx0ZXIoZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gKHVybCAhPSBudWxsICYmIHVybCAhPSBcIlwiKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJvb21BdmF0YXJVcmw6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIGlmICghcHJvcHMucm9vbSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIEF2YXRhci5hdmF0YXJVcmxGb3JSb29tKFxuICAgICAgICAgICAgcHJvcHMucm9vbSxcbiAgICAgICAgICAgIE1hdGguZmxvb3IocHJvcHMud2lkdGggKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyksXG4gICAgICAgICAgICBNYXRoLmZsb29yKHByb3BzLmhlaWdodCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSxcbiAgICAgICAgICAgIHByb3BzLnJlc2l6ZU1ldGhvZCxcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgb25Sb29tQXZhdGFyQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBhdmF0YXJVcmwgPSB0aGlzLnByb3BzLnJvb20uZ2V0QXZhdGFyVXJsKFxuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldEhvbWVzZXJ2ZXJVcmwoKSxcbiAgICAgICAgICAgIG51bGwsIG51bGwsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgY29uc3QgSW1hZ2VWaWV3ID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkltYWdlVmlld1wiKTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICAgICAgc3JjOiBhdmF0YXJVcmwsXG4gICAgICAgICAgICBuYW1lOiB0aGlzLnByb3BzLnJvb20ubmFtZSxcbiAgICAgICAgfTtcblxuICAgICAgICBNb2RhbC5jcmVhdGVEaWFsb2coSW1hZ2VWaWV3LCBwYXJhbXMsIFwibXhfRGlhbG9nX2xpZ2h0Ym94XCIpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBCYXNlQXZhdGFyID0gc2RrLmdldENvbXBvbmVudChcImF2YXRhcnMuQmFzZUF2YXRhclwiKTtcblxuICAgICAgICAvKmVzbGludCBuby11bnVzZWQtdmFyczogW1wiZXJyb3JcIiwgeyBcImlnbm9yZVJlc3RTaWJsaW5nc1wiOiB0cnVlIH1dKi9cbiAgICAgICAgY29uc3Qge3Jvb20sIG9vYkRhdGEsIHZpZXdBdmF0YXJPbkNsaWNrLCAuLi5vdGhlclByb3BzfSA9IHRoaXMucHJvcHM7XG5cbiAgICAgICAgY29uc3Qgcm9vbU5hbWUgPSByb29tID8gcm9vbS5uYW1lIDogb29iRGF0YS5uYW1lO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZUF2YXRhciB7Li4ub3RoZXJQcm9wc30gbmFtZT17cm9vbU5hbWV9XG4gICAgICAgICAgICAgICAgaWROYW1lPXtyb29tID8gcm9vbS5yb29tSWQgOiBudWxsfVxuICAgICAgICAgICAgICAgIHVybHM9e3RoaXMuc3RhdGUudXJsc31cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnZpZXdBdmF0YXJPbkNsaWNrID8gdGhpcy5vblJvb21BdmF0YXJDbGljayA6IG51bGx9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF0aGlzLnN0YXRlLnVybHNbMF19IC8+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19