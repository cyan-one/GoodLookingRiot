"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _CustomRoomTagStore = _interopRequireDefault(require("../../stores/CustomRoomTagStore"));

var _AutoHideScrollbar = _interopRequireDefault(require("./AutoHideScrollbar"));

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _classnames = _interopRequireDefault(require("classnames"));

var FormattingUtils = _interopRequireWildcard(require("../../utils/FormattingUtils"));

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
class CustomRoomTagPanel extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {
      tags: _CustomRoomTagStore.default.getSortedTags()
    };
  }

  componentDidMount() {
    this._tagStoreToken = _CustomRoomTagStore.default.addListener(() => {
      this.setState({
        tags: _CustomRoomTagStore.default.getSortedTags()
      });
    });
  }

  componentWillUnmount() {
    if (this._tagStoreToken) {
      this._tagStoreToken.remove();
    }
  }

  render() {
    const tags = this.state.tags.map(tag => {
      return /*#__PURE__*/_react.default.createElement(CustomRoomTagTile, {
        tag: tag,
        key: tag.name
      });
    });
    const classes = (0, _classnames.default)('mx_CustomRoomTagPanel', {
      mx_CustomRoomTagPanel_empty: this.state.tags.length === 0
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CustomRoomTagPanel_divider"
    }), /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
      className: "mx_CustomRoomTagPanel_scroller"
    }, tags));
  }

}

class CustomRoomTagTile extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onClick", () => {
      _dispatcher.default.dispatch({
        action: 'select_custom_room_tag',
        tag: this.props.tag.name
      });
    });
  }

  render() {
    const BaseAvatar = sdk.getComponent('avatars.BaseAvatar');
    const AccessibleTooltipButton = sdk.getComponent('elements.AccessibleTooltipButton');
    const tag = this.props.tag;
    const avatarHeight = 40;
    const className = (0, _classnames.default)({
      CustomRoomTagPanel_tileSelected: tag.selected
    });
    const name = tag.name;
    const badge = tag.badge;
    let badgeElement;

    if (badge) {
      const badgeClasses = (0, _classnames.default)({
        "mx_TagTile_badge": true,
        "mx_TagTile_badgeHighlight": badge.highlight
      });
      badgeElement = /*#__PURE__*/_react.default.createElement("div", {
        className: badgeClasses
      }, FormattingUtils.formatCount(badge.count));
    }

    return /*#__PURE__*/_react.default.createElement(AccessibleTooltipButton, {
      className: className,
      onClick: this.onClick,
      title: name
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TagTile_avatar"
    }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      name: tag.avatarLetter,
      idName: name,
      width: avatarHeight,
      height: avatarHeight
    }), badgeElement));
  }

}

var _default = CustomRoomTagPanel;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvQ3VzdG9tUm9vbVRhZ1BhbmVsLmpzIl0sIm5hbWVzIjpbIkN1c3RvbVJvb21UYWdQYW5lbCIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInN0YXRlIiwidGFncyIsIkN1c3RvbVJvb21UYWdTdG9yZSIsImdldFNvcnRlZFRhZ3MiLCJjb21wb25lbnREaWRNb3VudCIsIl90YWdTdG9yZVRva2VuIiwiYWRkTGlzdGVuZXIiLCJzZXRTdGF0ZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlIiwicmVuZGVyIiwibWFwIiwidGFnIiwibmFtZSIsImNsYXNzZXMiLCJteF9DdXN0b21Sb29tVGFnUGFuZWxfZW1wdHkiLCJsZW5ndGgiLCJDdXN0b21Sb29tVGFnVGlsZSIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwiQmFzZUF2YXRhciIsInNkayIsImdldENvbXBvbmVudCIsIkFjY2Vzc2libGVUb29sdGlwQnV0dG9uIiwiYXZhdGFySGVpZ2h0IiwiY2xhc3NOYW1lIiwiQ3VzdG9tUm9vbVRhZ1BhbmVsX3RpbGVTZWxlY3RlZCIsInNlbGVjdGVkIiwiYmFkZ2UiLCJiYWRnZUVsZW1lbnQiLCJiYWRnZUNsYXNzZXMiLCJoaWdobGlnaHQiLCJGb3JtYXR0aW5nVXRpbHMiLCJmb3JtYXRDb3VudCIsImNvdW50Iiwib25DbGljayIsImF2YXRhckxldHRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7OztBQXdCQSxNQUFNQSxrQkFBTixTQUFpQ0MsZUFBTUMsU0FBdkMsQ0FBaUQ7QUFDN0NDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQUNBLFNBQUtDLEtBQUwsR0FBYTtBQUNUQyxNQUFBQSxJQUFJLEVBQUVDLDRC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RXhCLElBRlo7QUFHSSxNQUFBLEtBQUssRUFBRVksWUFIWDtBQUlJLE1BQUEsTUFBTSxFQUFFQTtBQUpaLE1BREosRUFPTUssWUFQTixDQURKLENBREo7QUFhSDs7QUF0QzJDOztlQXlDakNuQyxrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZC5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEN1c3RvbVJvb21UYWdTdG9yZSBmcm9tICcuLi8uLi9zdG9yZXMvQ3VzdG9tUm9vbVRhZ1N0b3JlJztcbmltcG9ydCBBdXRvSGlkZVNjcm9sbGJhciBmcm9tICcuL0F1dG9IaWRlU2Nyb2xsYmFyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIEZvcm1hdHRpbmdVdGlscyBmcm9tICcuLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuXG5jbGFzcyBDdXN0b21Sb29tVGFnUGFuZWwgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHRhZ3M6IEN1c3RvbVJvb21UYWdTdG9yZS5nZXRTb3J0ZWRUYWdzKCksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMuX3RhZ1N0b3JlVG9rZW4gPSBDdXN0b21Sb29tVGFnU3RvcmUuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGFnczogQ3VzdG9tUm9vbVRhZ1N0b3JlLmdldFNvcnRlZFRhZ3MoKX0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RhZ1N0b3JlVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3RhZ1N0b3JlVG9rZW4ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSB0aGlzLnN0YXRlLnRhZ3MubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoPEN1c3RvbVJvb21UYWdUaWxlIHRhZz17dGFnfSBrZXk9e3RhZy5uYW1lfSAvPik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzKCdteF9DdXN0b21Sb29tVGFnUGFuZWwnLCB7XG4gICAgICAgICAgICBteF9DdXN0b21Sb29tVGFnUGFuZWxfZW1wdHk6IHRoaXMuc3RhdGUudGFncy5sZW5ndGggPT09IDAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DdXN0b21Sb29tVGFnUGFuZWxfZGl2aWRlclwiIC8+XG4gICAgICAgICAgICA8QXV0b0hpZGVTY3JvbGxiYXIgY2xhc3NOYW1lPVwibXhfQ3VzdG9tUm9vbVRhZ1BhbmVsX3Njcm9sbGVyXCI+XG4gICAgICAgICAgICAgICAge3RhZ3N9XG4gICAgICAgICAgICA8L0F1dG9IaWRlU2Nyb2xsYmFyPlxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cbn1cblxuY2xhc3MgQ3VzdG9tUm9vbVRhZ1RpbGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIG9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnc2VsZWN0X2N1c3RvbV9yb29tX3RhZycsIHRhZzogdGhpcy5wcm9wcy50YWcubmFtZX0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLkJhc2VBdmF0YXInKTtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZVRvb2x0aXBCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbicpO1xuXG4gICAgICAgIGNvbnN0IHRhZyA9IHRoaXMucHJvcHMudGFnO1xuICAgICAgICBjb25zdCBhdmF0YXJIZWlnaHQgPSA0MDtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBDdXN0b21Sb29tVGFnUGFuZWxfdGlsZVNlbGVjdGVkOiB0YWcuc2VsZWN0ZWQsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBuYW1lID0gdGFnLm5hbWU7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdGFnLmJhZGdlO1xuICAgICAgICBsZXQgYmFkZ2VFbGVtZW50O1xuICAgICAgICBpZiAoYmFkZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhZGdlQ2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgIFwibXhfVGFnVGlsZV9iYWRnZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfVGFnVGlsZV9iYWRnZUhpZ2hsaWdodFwiOiBiYWRnZS5oaWdobGlnaHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJhZGdlRWxlbWVudCA9ICg8ZGl2IGNsYXNzTmFtZT17YmFkZ2VDbGFzc2VzfT57Rm9ybWF0dGluZ1V0aWxzLmZvcm1hdENvdW50KGJhZGdlLmNvdW50KX08L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5vbkNsaWNrfSB0aXRsZT17bmFtZX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9UYWdUaWxlX2F2YXRhclwiPlxuICAgICAgICAgICAgICAgICAgICA8QmFzZUF2YXRhclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17dGFnLmF2YXRhckxldHRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkTmFtZT17bmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXthdmF0YXJIZWlnaHR9XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e2F2YXRhckhlaWdodH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgeyBiYWRnZUVsZW1lbnQgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbj5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEN1c3RvbVJvb21UYWdQYW5lbDtcbiJdfQ==