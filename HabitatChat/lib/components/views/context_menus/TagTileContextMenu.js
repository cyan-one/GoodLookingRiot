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

var _languageHandler = require("../../../languageHandler");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _TagOrderActions = _interopRequireDefault(require("../../../actions/TagOrderActions"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _ContextMenu = require("../../structures/ContextMenu");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

/*
Copyright 2018 New Vector Ltd
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
class TagTileContextMenu extends _react.default.Component {
  constructor() {
    super();
    this._onViewCommunityClick = this._onViewCommunityClick.bind(this);
    this._onRemoveClick = this._onRemoveClick.bind(this);
  }

  _onViewCommunityClick() {
    _dispatcher.default.dispatch({
      action: 'view_group',
      group_id: this.props.tag
    });

    this.props.onFinished();
  }

  _onRemoveClick() {
    _dispatcher.default.dispatch(_TagOrderActions.default.removeTag(this.context, this.props.tag));

    this.props.onFinished();
  }

  render() {
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_TagTileContextMenu_item",
      onClick: this._onViewCommunityClick
    }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
      className: "mx_TagTileContextMenu_item_icon",
      src: require("../../../../res/img/icons-groups.svg"),
      width: "15",
      height: "15"
    }), (0, _languageHandler._t)('View Community')), /*#__PURE__*/_react.default.createElement("hr", {
      className: "mx_TagTileContextMenu_separator",
      role: "separator"
    }), /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_TagTileContextMenu_item",
      onClick: this._onRemoveClick
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_TagTileContextMenu_item_icon",
      src: require("../../../../res/img/icon_context_delete.svg"),
      width: "15",
      height: "15",
      alt: ""
    }), (0, _languageHandler._t)('Hide')));
  }

}

exports.default = TagTileContextMenu;
(0, _defineProperty2.default)(TagTileContextMenu, "propTypes", {
  tag: _propTypes.default.string.isRequired,

  /* callback called when the menu is dismissed */
  onFinished: _propTypes.default.func.isRequired
});
(0, _defineProperty2.default)(TagTileContextMenu, "contextType", _MatrixClientContext.default);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvVGFnVGlsZUNvbnRleHRNZW51LmpzIl0sIm5hbWVzIjpbIlRhZ1RpbGVDb250ZXh0TWVudSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJfb25WaWV3Q29tbXVuaXR5Q2xpY2siLCJiaW5kIiwiX29uUmVtb3ZlQ2xpY2siLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsImdyb3VwX2lkIiwicHJvcHMiLCJ0YWciLCJvbkZpbmlzaGVkIiwiVGFnT3JkZXJBY3Rpb25zIiwicmVtb3ZlVGFnIiwiY29udGV4dCIsInJlbmRlciIsIlRpbnRhYmxlU3ZnIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicmVxdWlyZSIsIlByb3BUeXBlcyIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJmdW5jIiwiTWF0cml4Q2xpZW50Q29udGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQmUsTUFBTUEsa0JBQU4sU0FBaUNDLGVBQU1DLFNBQXZDLENBQWlEO0FBUzVEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQUVBLFNBQUtDLHFCQUFMLEdBQTZCLEtBQUtBLHFCQUFMLENBQTJCQyxJQUEzQixDQUFnQyxJQUFoQyxDQUE3QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsS0FBS0EsY0FBTCxDQUFvQkQsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBdEI7QUFDSDs7QUFFREQsRUFBQUEscUJBQXFCLEdBQUc7QUFDcEJHLHdCQUFJQyxRQUFKLENBQWE7QUFDVEMsTUFBQUEsTUFBTSxFQUFFLFlBREM7QUFFVEMsTUFBQUEsUUFBUSxFQUFFLEtBQUtDLEtBQUwsQ0FBV0M7QUFGWixLQUFiOztBQUlBLFNBQUtELEtBQUwsQ0FBV0UsVUFBWDtBQUNIOztBQUVEUCxFQUFBQSxjQUFjLEdBQUc7QUFDYkMsd0JBQUlDLFFBQUosQ0FBYU0seUJBQWdCQyxTQUFoQixDQUEwQixLQUFLQyxPQUEvQixFQUF3QyxLQUFLTCxLQUFMLENBQVdDLEdBQW5ELENBQWI7O0FBQ0EsU0FBS0QsS0FBTCxDQUFXRSxVQUFYO0FBQ0g7O0FBRURJLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLFdBQVcsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHNCQUFqQixDQUFwQjtBQUVBLHdCQUFPLHVEQUNILDZCQUFDLHFCQUFEO0FBQVUsTUFBQSxTQUFTLEVBQUMsNEJBQXBCO0FBQWlELE1BQUEsT0FBTyxFQUFFLEtBQUtoQjtBQUEvRCxvQkFDSSw2QkFBQyxXQUFEO0FBQ0ksTUFBQSxTQUFTLEVBQUMsaUNBRGQ7QUFFSSxNQUFBLEdBQUcsRUFBRWlCLE9BQU8sQ0FBQyxzQ0FBRCxDQUZoQjtBQUdJLE1BQUEsS0FBSyxFQUFDLElBSFY7QUFJSSxNQUFBLE1BQU0sRUFBQztBQUpYLE1BREosRUFPTSx5QkFBRyxnQkFBSCxDQVBOLENBREcsZUFVSDtBQUFJLE1BQUEsU0FBUyxFQUFDLGlDQUFkO0FBQWdELE1BQUEsSUFBSSxFQUFDO0FBQXJELE1BVkcsZUFXSCw2QkFBQyxxQkFBRDtBQUFVLE1BQUEsU0FBUyxFQUFDLDRCQUFwQjtBQUFpRCxNQUFBLE9BQU8sRUFBRSxLQUFLZjtBQUEvRCxvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLGlDQUFmO0FBQWlELE1BQUEsR0FBRyxFQUFFZSxPQUFPLENBQUMsNkNBQUQsQ0FBN0Q7QUFBOEcsTUFBQSxLQUFLLEVBQUMsSUFBcEg7QUFBeUgsTUFBQSxNQUFNLEVBQUMsSUFBaEk7QUFBcUksTUFBQSxHQUFHLEVBQUM7QUFBekksTUFESixFQUVNLHlCQUFHLE1BQUgsQ0FGTixDQVhHLENBQVA7QUFnQkg7O0FBaEQyRDs7OzhCQUEzQ3JCLGtCLGVBQ0U7QUFDZlksRUFBQUEsR0FBRyxFQUFFVSxtQkFBVUMsTUFBVixDQUFpQkMsVUFEUDs7QUFFZjtBQUNBWCxFQUFBQSxVQUFVLEVBQUVTLG1CQUFVRyxJQUFWLENBQWVEO0FBSFosQzs4QkFERnhCLGtCLGlCQU9JMEIsNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgVGFnT3JkZXJBY3Rpb25zIGZyb20gJy4uLy4uLy4uL2FjdGlvbnMvVGFnT3JkZXJBY3Rpb25zJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge01lbnVJdGVtfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuaW1wb3J0IE1hdHJpeENsaWVudENvbnRleHQgZnJvbSBcIi4uLy4uLy4uL2NvbnRleHRzL01hdHJpeENsaWVudENvbnRleHRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFnVGlsZUNvbnRleHRNZW51IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICB0YWc6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgLyogY2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIG1lbnUgaXMgZGlzbWlzc2VkICovXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9vblZpZXdDb21tdW5pdHlDbGljayA9IHRoaXMuX29uVmlld0NvbW11bml0eUNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uUmVtb3ZlQ2xpY2sgPSB0aGlzLl9vblJlbW92ZUNsaWNrLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgX29uVmlld0NvbW11bml0eUNsaWNrKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAndmlld19ncm91cCcsXG4gICAgICAgICAgICBncm91cF9pZDogdGhpcy5wcm9wcy50YWcsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9XG5cbiAgICBfb25SZW1vdmVDbGljaygpIHtcbiAgICAgICAgZGlzLmRpc3BhdGNoKFRhZ09yZGVyQWN0aW9ucy5yZW1vdmVUYWcodGhpcy5jb250ZXh0LCB0aGlzLnByb3BzLnRhZykpO1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IFRpbnRhYmxlU3ZnID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlRpbnRhYmxlU3ZnXCIpO1xuXG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT1cIm14X1RhZ1RpbGVDb250ZXh0TWVudV9pdGVtXCIgb25DbGljaz17dGhpcy5fb25WaWV3Q29tbXVuaXR5Q2xpY2t9PlxuICAgICAgICAgICAgICAgIDxUaW50YWJsZVN2Z1xuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9UYWdUaWxlQ29udGV4dE1lbnVfaXRlbV9pY29uXCJcbiAgICAgICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29ucy1ncm91cHMuc3ZnXCIpfVxuICAgICAgICAgICAgICAgICAgICB3aWR0aD1cIjE1XCJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PVwiMTVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgeyBfdCgnVmlldyBDb21tdW5pdHknKSB9XG4gICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgPGhyIGNsYXNzTmFtZT1cIm14X1RhZ1RpbGVDb250ZXh0TWVudV9zZXBhcmF0b3JcIiByb2xlPVwic2VwYXJhdG9yXCIgLz5cbiAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9UYWdUaWxlQ29udGV4dE1lbnVfaXRlbVwiIG9uQ2xpY2s9e3RoaXMuX29uUmVtb3ZlQ2xpY2t9PlxuICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfVGFnVGlsZUNvbnRleHRNZW51X2l0ZW1faWNvblwiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvaWNvbl9jb250ZXh0X2RlbGV0ZS5zdmdcIil9IHdpZHRoPVwiMTVcIiBoZWlnaHQ9XCIxNVwiIGFsdD1cIlwiIC8+XG4gICAgICAgICAgICAgICAgeyBfdCgnSGlkZScpIH1cbiAgICAgICAgICAgIDwvTWVudUl0ZW0+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG4iXX0=