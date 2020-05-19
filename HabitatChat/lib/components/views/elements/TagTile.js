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

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _Keyboard = require("../../../Keyboard");

var FormattingUtils = _interopRequireWildcard(require("../../../utils/FormattingUtils"));

var _FlairStore = _interopRequireDefault(require("../../../stores/FlairStore"));

var _GroupStore = _interopRequireDefault(require("../../../stores/GroupStore"));

var _TagOrderStore = _interopRequireDefault(require("../../../stores/TagOrderStore"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

/*
Copyright 2017 New Vector Ltd.
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
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
// A class for a child of TagPanel (possibly wrapped in a DNDTagTile) that represents
// a thing to click on for the user to filter the visible rooms in the RoomList to:
//  - Rooms that are part of the group
//  - Direct messages with members of the group
// with the intention that this could be expanded to arbitrary tags in future.
var _default = (0, _createReactClass.default)({
  displayName: 'TagTile',
  propTypes: {
    // A string tag such as "m.favourite" or a group ID such as "+groupid:domain.bla"
    // For now, only group IDs are handled.
    tag: _propTypes.default.string,
    contextMenuButtonRef: _propTypes.default.object,
    openMenu: _propTypes.default.func,
    menuDisplayed: _propTypes.default.bool
  },
  statics: {
    contextType: _MatrixClientContext.default
  },

  getInitialState() {
    return {
      // Whether the mouse is over the tile
      hover: false,
      // The profile data of the group if this.props.tag is a group ID
      profile: null
    };
  },

  componentDidMount() {
    this.unmounted = false;

    if (this.props.tag[0] === '+') {
      _FlairStore.default.addListener('updateGroupProfile', this._onFlairStoreUpdated);

      this._onFlairStoreUpdated(); // New rooms or members may have been added to the group, fetch async


      this._refreshGroup(this.props.tag);
    }
  },

  componentWillUnmount() {
    this.unmounted = true;

    if (this.props.tag[0] === '+') {
      _FlairStore.default.removeListener('updateGroupProfile', this._onFlairStoreUpdated);
    }
  },

  _onFlairStoreUpdated() {
    if (this.unmounted) return;

    _FlairStore.default.getGroupProfileCached(this.context, this.props.tag).then(profile => {
      if (this.unmounted) return;
      this.setState({
        profile
      });
    }).catch(err => {
      console.warn('Could not fetch group profile for ' + this.props.tag, err);
    });
  },

  _refreshGroup(groupId) {
    _GroupStore.default.refreshGroupRooms(groupId);

    _GroupStore.default.refreshGroupMembers(groupId);
  },

  onClick: function (e) {
    e.preventDefault();
    e.stopPropagation();

    _dispatcher.default.dispatch({
      action: 'select_tag',
      tag: this.props.tag,
      ctrlOrCmdKey: (0, _Keyboard.isOnlyCtrlOrCmdIgnoreShiftKeyEvent)(e),
      shiftKey: e.shiftKey
    });

    if (this.props.tag[0] === '+') {
      // New rooms or members may have been added to the group, fetch async
      this._refreshGroup(this.props.tag);
    }
  },
  onMouseOver: function () {
    this.setState({
      hover: true
    });
  },
  onMouseOut: function () {
    this.setState({
      hover: false
    });
  },
  openMenu: function (e) {
    // Prevent the TagTile onClick event firing as well
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      hover: false
    });
    this.props.openMenu();
  },
  render: function () {
    const BaseAvatar = sdk.getComponent('avatars.BaseAvatar');
    const profile = this.state.profile || {};
    const name = profile.name || this.props.tag;
    const avatarHeight = 40;
    const httpUrl = profile.avatarUrl ? this.context.mxcUrlToHttp(profile.avatarUrl, avatarHeight, avatarHeight, "crop") : null;
    const className = (0, _classnames.default)({
      mx_TagTile: true,
      mx_TagTile_selected: this.props.selected
    });

    const badge = _TagOrderStore.default.getGroupBadge(this.props.tag);

    let badgeElement;

    if (badge && !this.state.hover && !this.props.menuDisplayed) {
      const badgeClasses = (0, _classnames.default)({
        "mx_TagTile_badge": true,
        "mx_TagTile_badgeHighlight": badge.highlight
      });
      badgeElement = /*#__PURE__*/_react.default.createElement("div", {
        className: badgeClasses
      }, FormattingUtils.formatCount(badge.count));
    } // FIXME: this ought to use AccessibleButton for a11y but that causes onMouseOut/onMouseOver to fire too much


    const contextButton = this.state.hover || this.props.menuDisplayed ? /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TagTile_context_button",
      onClick: this.openMenu,
      ref: this.props.contextMenuButtonRef
    }, "\u00B7\u00B7\u00B7") : /*#__PURE__*/_react.default.createElement("div", {
      ref: this.props.contextMenuButtonRef
    });
    const AccessibleTooltipButton = sdk.getComponent("elements.AccessibleTooltipButton");
    return /*#__PURE__*/_react.default.createElement(AccessibleTooltipButton, {
      className: className,
      onClick: this.onClick,
      onContextMenu: this.openMenu,
      title: name
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TagTile_avatar",
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut
    }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      name: name,
      idName: this.props.tag,
      url: httpUrl,
      width: avatarHeight,
      height: avatarHeight
    }), contextButton, badgeElement));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1RhZ1RpbGUuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJ0YWciLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJjb250ZXh0TWVudUJ1dHRvblJlZiIsIm9iamVjdCIsIm9wZW5NZW51IiwiZnVuYyIsIm1lbnVEaXNwbGF5ZWQiLCJib29sIiwic3RhdGljcyIsImNvbnRleHRUeXBlIiwiTWF0cml4Q2xpZW50Q29udGV4dCIsImdldEluaXRpYWxTdGF0ZSIsImhvdmVyIiwicHJvZmlsZSIsImNvbXBvbmVudERpZE1vdW50IiwidW5tb3VudGVkIiwicHJvcHMiLCJGbGFpclN0b3JlIiwiYWRkTGlzdGVuZXIiLCJfb25GbGFpclN0b3JlVXBkYXRlZCIsIl9yZWZyZXNoR3JvdXAiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0R3JvdXBQcm9maWxlQ2FjaGVkIiwiY29udGV4dCIsInRoZW4iLCJzZXRTdGF0ZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIndhcm4iLCJncm91cElkIiwiR3JvdXBTdG9yZSIsInJlZnJlc2hHcm91cFJvb21zIiwicmVmcmVzaEdyb3VwTWVtYmVycyIsIm9uQ2xpY2siLCJlIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImN0cmxPckNtZEtleSIsInNoaWZ0S2V5Iiwib25Nb3VzZU92ZXIiLCJvbk1vdXNlT3V0IiwicmVuZGVyIiwiQmFzZUF2YXRhciIsInNkayIsImdldENvbXBvbmVudCIsInN0YXRlIiwibmFtZSIsImF2YXRhckhlaWdodCIsImh0dHBVcmwiLCJhdmF0YXJVcmwiLCJteGNVcmxUb0h0dHAiLCJjbGFzc05hbWUiLCJteF9UYWdUaWxlIiwibXhfVGFnVGlsZV9zZWxlY3RlZCIsInNlbGVjdGVkIiwiYmFkZ2UiLCJUYWdPcmRlclN0b3JlIiwiZ2V0R3JvdXBCYWRnZSIsImJhZGdlRWxlbWVudCIsImJhZGdlQ2xhc3NlcyIsImhpZ2hsaWdodCIsIkZvcm1hdHRpbmdVdGlscyIsImZvcm1hdENvdW50IiwiY291bnQiLCJjb250ZXh0QnV0dG9uIiwiQWNjZXNzaWJsZVRvb2x0aXBCdXR0b24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQTlCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtlQUNlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLFNBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQO0FBQ0E7QUFDQUMsSUFBQUEsR0FBRyxFQUFFQyxtQkFBVUMsTUFIUjtBQUlQQyxJQUFBQSxvQkFBb0IsRUFBRUYsbUJBQVVHLE1BSnpCO0FBS1BDLElBQUFBLFFBQVEsRUFBRUosbUJBQVVLLElBTGI7QUFNUEMsSUFBQUEsYUFBYSxFQUFFTixtQkFBVU87QUFObEIsR0FIaUI7QUFZNUJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxXQUFXLEVBQUVDO0FBRFIsR0FabUI7O0FBZ0I1QkMsRUFBQUEsZUFBZSxHQUFHO0FBQ2QsV0FBTztBQUNIO0FBQ0FDLE1BQUFBLEtBQUssRUFBRSxLQUZKO0FBR0g7QUFDQUMsTUFBQUEsT0FBTyxFQUFFO0FBSk4sS0FBUDtBQU1ILEdBdkIyQjs7QUF5QjVCQyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixTQUFLQyxTQUFMLEdBQWlCLEtBQWpCOztBQUNBLFFBQUksS0FBS0MsS0FBTCxDQUFXakIsR0FBWCxDQUFlLENBQWYsTUFBc0IsR0FBMUIsRUFBK0I7QUFDM0JrQiwwQkFBV0MsV0FBWCxDQUF1QixvQkFBdkIsRUFBNkMsS0FBS0Msb0JBQWxEOztBQUNBLFdBQUtBLG9CQUFMLEdBRjJCLENBRzNCOzs7QUFDQSxX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QixHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0NBQWpCLENBQWhDO0FBRUEsd0JBQU8sNkJBQUMsdUJBQUQ7QUFDSCxNQUFBLFNBQVMsRUFBRU8sU0FEUjtBQUVILE1BQUEsT0FBTyxFQUFFLEtBQUtyQixPQUZYO0FBR0gsTUFBQSxhQUFhLEVBQUUsS0FBSy9CLFFBSGpCO0FBSUgsTUFBQSxLQUFLLEVBQUUrQztBQUpKLG9CQU1IO0FBQ0ksTUFBQSxTQUFTLEVBQUMsbUJBRGQ7QUFFSSxNQUFBLFdBQVcsRUFBRSxLQUFLUCxXQUZ0QjtBQUdJLE1BQUEsVUFBVSxFQUFFLEtBQUtDO0FBSHJCLG9CQUtJLDZCQUFDLFVBQUQ7QUFDSSxNQUFBLElBQUksRUFBRU0sSUFEVjtBQUVJLE1BQUEsTUFBTSxFQUFFLEtBQUtuQyxLQUFMLENBQVdqQixHQUZ2QjtBQUdJLE1BQUEsR0FBRyxFQUFFc0QsT0FIVDtBQUlJLE1BQUEsS0FBSyxFQUFFRCxZQUpYO0FBS0ksTUFBQSxNQUFNLEVBQUVBO0FBTFosTUFMSixFQVlLaUIsYUFaTCxFQWFLTixZQWJMLENBTkcsQ0FBUDtBQXNCSDtBQWxKMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZC5cbkNvcHlyaWdodCAyMDE4IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBpc09ubHlDdHJsT3JDbWRJZ25vcmVTaGlmdEtleUV2ZW50IH0gZnJvbSAnLi4vLi4vLi4vS2V5Ym9hcmQnO1xuaW1wb3J0ICogYXMgRm9ybWF0dGluZ1V0aWxzIGZyb20gJy4uLy4uLy4uL3V0aWxzL0Zvcm1hdHRpbmdVdGlscyc7XG5cbmltcG9ydCBGbGFpclN0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9GbGFpclN0b3JlJztcbmltcG9ydCBHcm91cFN0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9Hcm91cFN0b3JlJztcbmltcG9ydCBUYWdPcmRlclN0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9UYWdPcmRlclN0b3JlJztcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5cbi8vIEEgY2xhc3MgZm9yIGEgY2hpbGQgb2YgVGFnUGFuZWwgKHBvc3NpYmx5IHdyYXBwZWQgaW4gYSBETkRUYWdUaWxlKSB0aGF0IHJlcHJlc2VudHNcbi8vIGEgdGhpbmcgdG8gY2xpY2sgb24gZm9yIHRoZSB1c2VyIHRvIGZpbHRlciB0aGUgdmlzaWJsZSByb29tcyBpbiB0aGUgUm9vbUxpc3QgdG86XG4vLyAgLSBSb29tcyB0aGF0IGFyZSBwYXJ0IG9mIHRoZSBncm91cFxuLy8gIC0gRGlyZWN0IG1lc3NhZ2VzIHdpdGggbWVtYmVycyBvZiB0aGUgZ3JvdXBcbi8vIHdpdGggdGhlIGludGVudGlvbiB0aGF0IHRoaXMgY291bGQgYmUgZXhwYW5kZWQgdG8gYXJiaXRyYXJ5IHRhZ3MgaW4gZnV0dXJlLlxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdUYWdUaWxlJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBBIHN0cmluZyB0YWcgc3VjaCBhcyBcIm0uZmF2b3VyaXRlXCIgb3IgYSBncm91cCBJRCBzdWNoIGFzIFwiK2dyb3VwaWQ6ZG9tYWluLmJsYVwiXG4gICAgICAgIC8vIEZvciBub3csIG9ubHkgZ3JvdXAgSURzIGFyZSBoYW5kbGVkLlxuICAgICAgICB0YWc6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGNvbnRleHRNZW51QnV0dG9uUmVmOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICBvcGVuTWVudTogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG1lbnVEaXNwbGF5ZWQ6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBzdGF0aWNzOiB7XG4gICAgICAgIGNvbnRleHRUeXBlOiBNYXRyaXhDbGllbnRDb250ZXh0LFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBtb3VzZSBpcyBvdmVyIHRoZSB0aWxlXG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgICAgICAvLyBUaGUgcHJvZmlsZSBkYXRhIG9mIHRoZSBncm91cCBpZiB0aGlzLnByb3BzLnRhZyBpcyBhIGdyb3VwIElEXG4gICAgICAgICAgICBwcm9maWxlOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMudGFnWzBdID09PSAnKycpIHtcbiAgICAgICAgICAgIEZsYWlyU3RvcmUuYWRkTGlzdGVuZXIoJ3VwZGF0ZUdyb3VwUHJvZmlsZScsIHRoaXMuX29uRmxhaXJTdG9yZVVwZGF0ZWQpO1xuICAgICAgICAgICAgdGhpcy5fb25GbGFpclN0b3JlVXBkYXRlZCgpO1xuICAgICAgICAgICAgLy8gTmV3IHJvb21zIG9yIG1lbWJlcnMgbWF5IGhhdmUgYmVlbiBhZGRlZCB0byB0aGUgZ3JvdXAsIGZldGNoIGFzeW5jXG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoR3JvdXAodGhpcy5wcm9wcy50YWcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICB0aGlzLnVubW91bnRlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnRhZ1swXSA9PT0gJysnKSB7XG4gICAgICAgICAgICBGbGFpclN0b3JlLnJlbW92ZUxpc3RlbmVyKCd1cGRhdGVHcm91cFByb2ZpbGUnLCB0aGlzLl9vbkZsYWlyU3RvcmVVcGRhdGVkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25GbGFpclN0b3JlVXBkYXRlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgIEZsYWlyU3RvcmUuZ2V0R3JvdXBQcm9maWxlQ2FjaGVkKFxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LFxuICAgICAgICAgICAgdGhpcy5wcm9wcy50YWcsXG4gICAgICAgICkudGhlbigocHJvZmlsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgcHJvZmlsZSB9KTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb3VsZCBub3QgZmV0Y2ggZ3JvdXAgcHJvZmlsZSBmb3IgJyArIHRoaXMucHJvcHMudGFnLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3JlZnJlc2hHcm91cChncm91cElkKSB7XG4gICAgICAgIEdyb3VwU3RvcmUucmVmcmVzaEdyb3VwUm9vbXMoZ3JvdXBJZCk7XG4gICAgICAgIEdyb3VwU3RvcmUucmVmcmVzaEdyb3VwTWVtYmVycyhncm91cElkKTtcbiAgICB9LFxuXG4gICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdzZWxlY3RfdGFnJyxcbiAgICAgICAgICAgIHRhZzogdGhpcy5wcm9wcy50YWcsXG4gICAgICAgICAgICBjdHJsT3JDbWRLZXk6IGlzT25seUN0cmxPckNtZElnbm9yZVNoaWZ0S2V5RXZlbnQoZSksXG4gICAgICAgICAgICBzaGlmdEtleTogZS5zaGlmdEtleSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnRhZ1swXSA9PT0gJysnKSB7XG4gICAgICAgICAgICAvLyBOZXcgcm9vbXMgb3IgbWVtYmVycyBtYXkgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBncm91cCwgZmV0Y2ggYXN5bmNcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hHcm91cCh0aGlzLnByb3BzLnRhZyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Nb3VzZU92ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXI6IHRydWUgfSk7XG4gICAgfSxcblxuICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXI6IGZhbHNlIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuTWVudTogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBQcmV2ZW50IHRoZSBUYWdUaWxlIG9uQ2xpY2sgZXZlbnQgZmlyaW5nIGFzIHdlbGxcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXI6IGZhbHNlIH0pO1xuICAgICAgICB0aGlzLnByb3BzLm9wZW5NZW51KCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEJhc2VBdmF0YXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdhdmF0YXJzLkJhc2VBdmF0YXInKTtcbiAgICAgICAgY29uc3QgcHJvZmlsZSA9IHRoaXMuc3RhdGUucHJvZmlsZSB8fCB7fTtcbiAgICAgICAgY29uc3QgbmFtZSA9IHByb2ZpbGUubmFtZSB8fCB0aGlzLnByb3BzLnRhZztcbiAgICAgICAgY29uc3QgYXZhdGFySGVpZ2h0ID0gNDA7XG5cbiAgICAgICAgY29uc3QgaHR0cFVybCA9IHByb2ZpbGUuYXZhdGFyVXJsID8gdGhpcy5jb250ZXh0Lm14Y1VybFRvSHR0cChcbiAgICAgICAgICAgIHByb2ZpbGUuYXZhdGFyVXJsLCBhdmF0YXJIZWlnaHQsIGF2YXRhckhlaWdodCwgXCJjcm9wXCIsXG4gICAgICAgICkgOiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgbXhfVGFnVGlsZTogdHJ1ZSxcbiAgICAgICAgICAgIG14X1RhZ1RpbGVfc2VsZWN0ZWQ6IHRoaXMucHJvcHMuc2VsZWN0ZWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGJhZGdlID0gVGFnT3JkZXJTdG9yZS5nZXRHcm91cEJhZGdlKHRoaXMucHJvcHMudGFnKTtcbiAgICAgICAgbGV0IGJhZGdlRWxlbWVudDtcbiAgICAgICAgaWYgKGJhZGdlICYmICF0aGlzLnN0YXRlLmhvdmVyICYmICF0aGlzLnByb3BzLm1lbnVEaXNwbGF5ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhZGdlQ2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgIFwibXhfVGFnVGlsZV9iYWRnZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfVGFnVGlsZV9iYWRnZUhpZ2hsaWdodFwiOiBiYWRnZS5oaWdobGlnaHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJhZGdlRWxlbWVudCA9ICg8ZGl2IGNsYXNzTmFtZT17YmFkZ2VDbGFzc2VzfT57Rm9ybWF0dGluZ1V0aWxzLmZvcm1hdENvdW50KGJhZGdlLmNvdW50KX08L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRklYTUU6IHRoaXMgb3VnaHQgdG8gdXNlIEFjY2Vzc2libGVCdXR0b24gZm9yIGExMXkgYnV0IHRoYXQgY2F1c2VzIG9uTW91c2VPdXQvb25Nb3VzZU92ZXIgdG8gZmlyZSB0b28gbXVjaFxuICAgICAgICBjb25zdCBjb250ZXh0QnV0dG9uID0gdGhpcy5zdGF0ZS5ob3ZlciB8fCB0aGlzLnByb3BzLm1lbnVEaXNwbGF5ZWQgP1xuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9UYWdUaWxlX2NvbnRleHRfYnV0dG9uXCIgb25DbGljaz17dGhpcy5vcGVuTWVudX0gcmVmPXt0aGlzLnByb3BzLmNvbnRleHRNZW51QnV0dG9uUmVmfT5cbiAgICAgICAgICAgICAgICB7XCJcXHUwMEI3XFx1MDBCN1xcdTAwQjdcIn1cbiAgICAgICAgICAgIDwvZGl2PiA6IDxkaXYgcmVmPXt0aGlzLnByb3BzLmNvbnRleHRNZW51QnV0dG9uUmVmfSAvPjtcblxuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5BY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvblwiKTtcblxuICAgICAgICByZXR1cm4gPEFjY2Vzc2libGVUb29sdGlwQnV0dG9uXG4gICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja31cbiAgICAgICAgICAgIG9uQ29udGV4dE1lbnU9e3RoaXMub3Blbk1lbnV9XG4gICAgICAgICAgICB0aXRsZT17bmFtZX1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1RhZ1RpbGVfYXZhdGFyXCJcbiAgICAgICAgICAgICAgICBvbk1vdXNlT3Zlcj17dGhpcy5vbk1vdXNlT3Zlcn1cbiAgICAgICAgICAgICAgICBvbk1vdXNlT3V0PXt0aGlzLm9uTW91c2VPdXR9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPEJhc2VBdmF0YXJcbiAgICAgICAgICAgICAgICAgICAgbmFtZT17bmFtZX1cbiAgICAgICAgICAgICAgICAgICAgaWROYW1lPXt0aGlzLnByb3BzLnRhZ31cbiAgICAgICAgICAgICAgICAgICAgdXJsPXtodHRwVXJsfVxuICAgICAgICAgICAgICAgICAgICB3aWR0aD17YXZhdGFySGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e2F2YXRhckhlaWdodH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIHtjb250ZXh0QnV0dG9ufVxuICAgICAgICAgICAgICAgIHtiYWRnZUVsZW1lbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9BY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbj47XG4gICAgfSxcbn0pO1xuIl19