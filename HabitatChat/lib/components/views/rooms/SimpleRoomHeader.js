"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CancelButton = CancelButton;
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2016 OpenMarket Ltd

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
// cancel button which is shared between room header and simple room header
function CancelButton(props) {
  const {
    onClick
  } = props;
  return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
    className: "mx_RoomHeader_cancelButton",
    onClick: onClick
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: require("../../../../res/img/cancel.svg"),
    className: "mx_filterFlipColor",
    width: "18",
    height: "18",
    alt: (0, _languageHandler._t)("Cancel")
  }));
}
/*
 * A stripped-down room header used for things like the user settings
 * and room directory.
 */


var _default = (0, _createReactClass.default)({
  displayName: 'SimpleRoomHeader',
  propTypes: {
    title: _propTypes.default.string,
    onCancelClick: _propTypes.default.func,
    // `src` to a TintableSvg. Optional.
    icon: _propTypes.default.string
  },
  render: function () {
    let cancelButton;
    let icon;

    if (this.props.onCancelClick) {
      cancelButton = /*#__PURE__*/_react.default.createElement(CancelButton, {
        onClick: this.props.onCancelClick
      });
    }

    if (this.props.icon) {
      const TintableSvg = sdk.getComponent('elements.TintableSvg');
      icon = /*#__PURE__*/_react.default.createElement(TintableSvg, {
        className: "mx_RoomHeader_icon",
        src: this.props.icon,
        width: "25",
        height: "25"
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_wrapper"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomHeader_simpleHeader"
    }, icon, this.props.title, cancelButton)));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1NpbXBsZVJvb21IZWFkZXIuanMiXSwibmFtZXMiOlsiQ2FuY2VsQnV0dG9uIiwicHJvcHMiLCJvbkNsaWNrIiwicmVxdWlyZSIsImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwidGl0bGUiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJvbkNhbmNlbENsaWNrIiwiZnVuYyIsImljb24iLCJyZW5kZXIiLCJjYW5jZWxCdXR0b24iLCJUaW50YWJsZVN2ZyIsInNkayIsImdldENvbXBvbmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBO0FBQ08sU0FBU0EsWUFBVCxDQUFzQkMsS0FBdEIsRUFBNkI7QUFDaEMsUUFBTTtBQUFDQyxJQUFBQTtBQUFELE1BQVlELEtBQWxCO0FBRUEsc0JBQ0ksNkJBQUMseUJBQUQ7QUFBa0IsSUFBQSxTQUFTLEVBQUMsNEJBQTVCO0FBQXlELElBQUEsT0FBTyxFQUFFQztBQUFsRSxrQkFDSTtBQUFLLElBQUEsR0FBRyxFQUFFQyxPQUFPLENBQUMsZ0NBQUQsQ0FBakI7QUFBcUQsSUFBQSxTQUFTLEVBQUMsb0JBQS9EO0FBQ0ksSUFBQSxLQUFLLEVBQUMsSUFEVjtBQUNlLElBQUEsTUFBTSxFQUFDLElBRHRCO0FBQzJCLElBQUEsR0FBRyxFQUFFLHlCQUFHLFFBQUg7QUFEaEMsSUFESixDQURKO0FBTUg7QUFFRDs7Ozs7O2VBSWUsK0JBQWlCO0FBQzVCQyxFQUFBQSxXQUFXLEVBQUUsa0JBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxLQUFLLEVBQUVDLG1CQUFVQyxNQURWO0FBRVBDLElBQUFBLGFBQWEsRUFBRUYsbUJBQVVHLElBRmxCO0FBSVA7QUFDQUMsSUFBQUEsSUFBSSxFQUFFSixtQkFBVUM7QUFMVCxHQUhpQjtBQVc1QkksRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixRQUFJQyxZQUFKO0FBQ0EsUUFBSUYsSUFBSjs7QUFDQSxRQUFJLEtBQUtWLEtBQUwsQ0FBV1EsYUFBZixFQUE4QjtBQUMxQkksTUFBQUEsWUFBWSxnQkFBRyw2QkFBQyxZQUFEO0FBQWMsUUFBQSxPQUFPLEVBQUUsS0FBS1osS0FBTCxDQUFXUTtBQUFsQyxRQUFmO0FBQ0g7O0FBQ0QsUUFBSSxLQUFLUixLQUFMLENBQVdVLElBQWYsRUFBcUI7QUFDakIsWUFBTUcsV0FBVyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsc0JBQWpCLENBQXBCO0FBQ0FMLE1BQUFBLElBQUksZ0JBQUcsNkJBQUMsV0FBRDtBQUNILFFBQUEsU0FBUyxFQUFDLG9CQURQO0FBQzRCLFFBQUEsR0FBRyxFQUFFLEtBQUtWLEtBQUwsQ0FBV1UsSUFENUM7QUFFSCxRQUFBLEtBQUssRUFBQyxJQUZIO0FBRVEsUUFBQSxNQUFNLEVBQUM7QUFGZixRQUFQO0FBSUg7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTUEsSUFETixFQUVNLEtBQUtWLEtBQUwsQ0FBV0ssS0FGakIsRUFHTU8sWUFITixDQURKLENBREosQ0FESjtBQVdIO0FBcEMyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG4vLyBjYW5jZWwgYnV0dG9uIHdoaWNoIGlzIHNoYXJlZCBiZXR3ZWVuIHJvb20gaGVhZGVyIGFuZCBzaW1wbGUgcm9vbSBoZWFkZXJcbmV4cG9ydCBmdW5jdGlvbiBDYW5jZWxCdXR0b24ocHJvcHMpIHtcbiAgICBjb25zdCB7b25DbGlja30gPSBwcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT0nbXhfUm9vbUhlYWRlcl9jYW5jZWxCdXR0b24nIG9uQ2xpY2s9e29uQ2xpY2t9PlxuICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2NhbmNlbC5zdmdcIil9IGNsYXNzTmFtZT0nbXhfZmlsdGVyRmxpcENvbG9yJ1xuICAgICAgICAgICAgICAgIHdpZHRoPVwiMThcIiBoZWlnaHQ9XCIxOFwiIGFsdD17X3QoXCJDYW5jZWxcIil9IC8+XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICApO1xufVxuXG4vKlxuICogQSBzdHJpcHBlZC1kb3duIHJvb20gaGVhZGVyIHVzZWQgZm9yIHRoaW5ncyBsaWtlIHRoZSB1c2VyIHNldHRpbmdzXG4gKiBhbmQgcm9vbSBkaXJlY3RvcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnU2ltcGxlUm9vbUhlYWRlcicsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgdGl0bGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIG9uQ2FuY2VsQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIGBzcmNgIHRvIGEgVGludGFibGVTdmcuIE9wdGlvbmFsLlxuICAgICAgICBpY29uOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgY2FuY2VsQnV0dG9uO1xuICAgICAgICBsZXQgaWNvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25DYW5jZWxDbGljaykge1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uID0gPENhbmNlbEJ1dHRvbiBvbkNsaWNrPXt0aGlzLnByb3BzLm9uQ2FuY2VsQ2xpY2t9IC8+O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmljb24pIHtcbiAgICAgICAgICAgIGNvbnN0IFRpbnRhYmxlU3ZnID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuVGludGFibGVTdmcnKTtcbiAgICAgICAgICAgIGljb24gPSA8VGludGFibGVTdmdcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Sb29tSGVhZGVyX2ljb25cIiBzcmM9e3RoaXMucHJvcHMuaWNvbn1cbiAgICAgICAgICAgICAgICB3aWR0aD1cIjI1XCIgaGVpZ2h0PVwiMjVcIlxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tSGVhZGVyXCIgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl93cmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbUhlYWRlcl9zaW1wbGVIZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgaWNvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMudGl0bGUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyBjYW5jZWxCdXR0b24gfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==