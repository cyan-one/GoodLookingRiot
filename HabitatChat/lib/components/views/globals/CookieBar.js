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

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Analytics = _interopRequireDefault(require("../../../Analytics"));

/*
Copyright 2018 New Vector Ltd.

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
class CookieBar extends _react.default.Component {
  constructor() {
    super();
  }

  onUsageDataClicked(e) {
    e.stopPropagation();
    e.preventDefault();

    _Analytics.default.showDetailsModal();
  }

  onAccept() {
    _dispatcher.default.dispatch({
      action: 'accept_cookies'
    });
  }

  onReject() {
    _dispatcher.default.dispatch({
      action: 'reject_cookies'
    });
  }

  render() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const toolbarClasses = "mx_MatrixToolbar";
    return /*#__PURE__*/_react.default.createElement("div", {
      className: toolbarClasses
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_MatrixToolbar_warning",
      src: require("../../../../res/img/warning.svg"),
      width: "24",
      height: "23",
      alt: ""
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, this.props.policyUrl ? (0, _languageHandler._t)("Please help improve Riot.im by sending <UsageDataLink>anonymous usage data</UsageDataLink>. " + "This will use a cookie " + "(please see our <PolicyLink>Cookie Policy</PolicyLink>).", {}, {
      'UsageDataLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_MatrixToolbar_link",
        onClick: this.onUsageDataClicked
      }, sub),
      // XXX: We need to link to the page that explains our cookies
      'PolicyLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_MatrixToolbar_link",
        target: "_blank",
        href: this.props.policyUrl
      }, sub)
    }) : (0, _languageHandler._t)("Please help improve Riot.im by sending <UsageDataLink>anonymous usage data</UsageDataLink>. " + "This will use a cookie.", {}, {
      'UsageDataLink': sub => /*#__PURE__*/_react.default.createElement("a", {
        className: "mx_MatrixToolbar_link",
        onClick: this.onUsageDataClicked
      }, sub)
    })), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      element: "button",
      className: "mx_MatrixToolbar_action",
      onClick: this.onAccept
    }, (0, _languageHandler._t)("Yes, I want to help!")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_MatrixToolbar_close",
      onClick: this.onReject
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18",
      alt: (0, _languageHandler._t)('Close')
    })));
  }

}

exports.default = CookieBar;
(0, _defineProperty2.default)(CookieBar, "propTypes", {
  policyUrl: _propTypes.default.string
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvQ29va2llQmFyLmpzIl0sIm5hbWVzIjpbIkNvb2tpZUJhciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJvblVzYWdlRGF0YUNsaWNrZWQiLCJlIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJBbmFseXRpY3MiLCJzaG93RGV0YWlsc01vZGFsIiwib25BY2NlcHQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsIm9uUmVqZWN0IiwicmVuZGVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNkayIsImdldENvbXBvbmVudCIsInRvb2xiYXJDbGFzc2VzIiwicmVxdWlyZSIsInByb3BzIiwicG9saWN5VXJsIiwic3ViIiwiUHJvcFR5cGVzIiwic3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUJlLE1BQU1BLFNBQU4sU0FBd0JDLGVBQU1DLFNBQTlCLENBQXdDO0FBS25EQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQUNIOztBQUVEQyxFQUFBQSxrQkFBa0IsQ0FBQ0MsQ0FBRCxFQUFJO0FBQ2xCQSxJQUFBQSxDQUFDLENBQUNDLGVBQUY7QUFDQUQsSUFBQUEsQ0FBQyxDQUFDRSxjQUFGOztBQUNBQyx1QkFBVUMsZ0JBQVY7QUFDSDs7QUFFREMsRUFBQUEsUUFBUSxHQUFHO0FBQ1BDLHdCQUFJQyxRQUFKLENBQWE7QUFDVEMsTUFBQUEsTUFBTSxFQUFFO0FBREMsS0FBYjtBQUdIOztBQUVEQyxFQUFBQSxRQUFRLEdBQUc7QUFDUEgsd0JBQUlDLFFBQUosQ0FBYTtBQUNUQyxNQUFBQSxNQUFNLEVBQUU7QUFEQyxLQUFiO0FBR0g7O0FBRURFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLGdCQUFnQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBQ0EsVUFBTUMsY0FBYyxHQUFHLGtCQUF2QjtBQUNBLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUVBO0FBQWhCLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUMsMEJBQWY7QUFBMEMsTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyxpQ0FBRCxDQUF0RDtBQUEyRixNQUFBLEtBQUssRUFBQyxJQUFqRztBQUFzRyxNQUFBLE1BQU0sRUFBQyxJQUE3RztBQUFrSCxNQUFBLEdBQUcsRUFBQztBQUF0SCxNQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ00sS0FBS0MsS0FBTCxDQUFXQyxTQUFYLEdBQXVCLHlCQUNyQixpR0FDQSx5QkFEQSxHQUVBLDBEQUhxQixFQUlyQixFQUpxQixFQUtyQjtBQUNJLHVCQUFrQkMsR0FBRCxpQkFBUztBQUN0QixRQUFBLFNBQVMsRUFBQyx1QkFEWTtBQUV0QixRQUFBLE9BQU8sRUFBRSxLQUFLbkI7QUFGUSxTQUlwQm1CLEdBSm9CLENBRDlCO0FBT0k7QUFDQSxvQkFBZUEsR0FBRCxpQkFBUztBQUNmLFFBQUEsU0FBUyxFQUFDLHVCQURLO0FBRWYsUUFBQSxNQUFNLEVBQUMsUUFGUTtBQUdmLFFBQUEsSUFBSSxFQUFFLEtBQUtGLEtBQUwsQ0FBV0M7QUFIRixTQUtiQyxHQUxhO0FBUjNCLEtBTHFCLENBQXZCLEdBc0JFLHlCQUNBLGlHQUNBLHlCQUZBLEVBR0EsRUFIQSxFQUlBO0FBQ0ksdUJBQWtCQSxHQUFELGlCQUFTO0FBQ3RCLFFBQUEsU0FBUyxFQUFDLHVCQURZO0FBRXRCLFFBQUEsT0FBTyxFQUFFLEtBQUtuQjtBQUZRLFNBSXBCbUIsR0FKb0I7QUFEOUIsS0FKQSxDQXZCUixDQUZKLGVBdUNJLDZCQUFDLGdCQUFEO0FBQWtCLE1BQUEsT0FBTyxFQUFDLFFBQTFCO0FBQW1DLE1BQUEsU0FBUyxFQUFDLHlCQUE3QztBQUF1RSxNQUFBLE9BQU8sRUFBRSxLQUFLYjtBQUFyRixPQUNNLHlCQUFHLHNCQUFILENBRE4sQ0F2Q0osZUEwQ0ksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxTQUFTLEVBQUMsd0JBQTVCO0FBQXFELE1BQUEsT0FBTyxFQUFFLEtBQUtJO0FBQW5FLG9CQUNJO0FBQUssTUFBQSxHQUFHLEVBQUVNLE9BQU8sQ0FBQyxnQ0FBRCxDQUFqQjtBQUFxRCxNQUFBLEtBQUssRUFBQyxJQUEzRDtBQUFnRSxNQUFBLE1BQU0sRUFBQyxJQUF2RTtBQUE0RSxNQUFBLEdBQUcsRUFBRSx5QkFBRyxPQUFIO0FBQWpGLE1BREosQ0ExQ0osQ0FESjtBQWdESDs7QUE5RWtEOzs7OEJBQWxDcEIsUyxlQUNFO0FBQ2ZzQixFQUFBQSxTQUFTLEVBQUVFLG1CQUFVQztBQUROLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IEFuYWx5dGljcyBmcm9tICcuLi8uLi8uLi9BbmFseXRpY3MnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb29raWVCYXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHBvbGljeVVybDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBvblVzYWdlRGF0YUNsaWNrZWQoZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIEFuYWx5dGljcy5zaG93RGV0YWlsc01vZGFsKCk7XG4gICAgfVxuXG4gICAgb25BY2NlcHQoKSB7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdhY2NlcHRfY29va2llcycsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uUmVqZWN0KCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAncmVqZWN0X2Nvb2tpZXMnLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IHRvb2xiYXJDbGFzc2VzID0gXCJteF9NYXRyaXhUb29sYmFyXCI7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17dG9vbGJhckNsYXNzZXN9PlxuICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl93YXJuaW5nXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy93YXJuaW5nLnN2Z1wiKX0gd2lkdGg9XCIyNFwiIGhlaWdodD1cIjIzXCIgYWx0PVwiXCIgLz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMucG9saWN5VXJsID8gX3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlBsZWFzZSBoZWxwIGltcHJvdmUgUmlvdC5pbSBieSBzZW5kaW5nIDxVc2FnZURhdGFMaW5rPmFub255bW91cyB1c2FnZSBkYXRhPC9Vc2FnZURhdGFMaW5rPi4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIHdpbGwgdXNlIGEgY29va2llIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKHBsZWFzZSBzZWUgb3VyIDxQb2xpY3lMaW5rPkNvb2tpZSBQb2xpY3k8L1BvbGljeUxpbms+KS5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdVc2FnZURhdGFMaW5rJzogKHN1YikgPT4gPGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblVzYWdlRGF0YUNsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHN1YiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBYWFg6IFdlIG5lZWQgdG8gbGluayB0byB0aGUgcGFnZSB0aGF0IGV4cGxhaW5zIG91ciBjb29raWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1BvbGljeUxpbmsnOiAoc3ViKSA9PiA8YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBocmVmPXt0aGlzLnByb3BzLnBvbGljeVVybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzdWIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKSA6IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJQbGVhc2UgaGVscCBpbXByb3ZlIFJpb3QuaW0gYnkgc2VuZGluZyA8VXNhZ2VEYXRhTGluaz5hbm9ueW1vdXMgdXNhZ2UgZGF0YTwvVXNhZ2VEYXRhTGluaz4uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyB3aWxsIHVzZSBhIGNvb2tpZS5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdVc2FnZURhdGFMaW5rJzogKHN1YikgPT4gPGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblVzYWdlRGF0YUNsaWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHN1YiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICkgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGVsZW1lbnQ9J2J1dHRvbicgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9hY3Rpb25cIiBvbkNsaWNrPXt0aGlzLm9uQWNjZXB0fT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIlllcywgSSB3YW50IHRvIGhlbHAhXCIpIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9jbG9zZVwiIG9uQ2xpY2s9e3RoaXMub25SZWplY3R9PlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvY2FuY2VsLnN2Z1wiKX0gd2lkdGg9XCIxOFwiIGhlaWdodD1cIjE4XCIgYWx0PXtfdCgnQ2xvc2UnKX0gLz5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=