"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _Analytics = _interopRequireDefault(require("../../../Analytics"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd
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
class HeaderButton extends _react.default.Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  onClick(ev) {
    _Analytics.default.trackEvent(...this.props.analytics);

    this.props.onClick();
  }

  render() {
    const classes = (0, _classnames.default)({
      mx_RightPanel_headerButton: true,
      mx_RightPanel_headerButton_highlight: this.props.isHighlighted,
      ["mx_RightPanel_".concat(this.props.name)]: true
    });
    return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      "aria-selected": this.props.isHighlighted,
      role: "tab",
      title: this.props.title,
      className: classes,
      onClick: this.onClick
    });
  }

}

exports.default = HeaderButton;
HeaderButton.propTypes = {
  // Whether this button is highlighted
  isHighlighted: _propTypes.default.bool.isRequired,
  // click handler
  onClick: _propTypes.default.func.isRequired,
  // The badge to display above the icon
  badge: _propTypes.default.node,
  // The parameters to track the click event
  analytics: _propTypes.default.arrayOf(_propTypes.default.string).isRequired,
  // Button name
  name: _propTypes.default.string.isRequired,
  // Button title
  title: _propTypes.default.string.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3JpZ2h0X3BhbmVsL0hlYWRlckJ1dHRvbi5qcyJdLCJuYW1lcyI6WyJIZWFkZXJCdXR0b24iLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwib25DbGljayIsImJpbmQiLCJldiIsIkFuYWx5dGljcyIsInRyYWNrRXZlbnQiLCJwcm9wcyIsImFuYWx5dGljcyIsInJlbmRlciIsImNsYXNzZXMiLCJteF9SaWdodFBhbmVsX2hlYWRlckJ1dHRvbiIsIm14X1JpZ2h0UGFuZWxfaGVhZGVyQnV0dG9uX2hpZ2hsaWdodCIsImlzSGlnaGxpZ2h0ZWQiLCJuYW1lIiwidGl0bGUiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJib29sIiwiaXNSZXF1aXJlZCIsImZ1bmMiLCJiYWRnZSIsIm5vZGUiLCJhcnJheU9mIiwic3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFvQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBeEJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJlLE1BQU1BLFlBQU4sU0FBMkJDLGVBQU1DLFNBQWpDLENBQTJDO0FBQ3REQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxLQUFLQSxPQUFMLENBQWFDLElBQWIsQ0FBa0IsSUFBbEIsQ0FBZjtBQUNIOztBQUVERCxFQUFBQSxPQUFPLENBQUNFLEVBQUQsRUFBSztBQUNSQyx1QkFBVUMsVUFBVixDQUFxQixHQUFHLEtBQUtDLEtBQUwsQ0FBV0MsU0FBbkM7O0FBQ0EsU0FBS0QsS0FBTCxDQUFXTCxPQUFYO0FBQ0g7O0FBRURPLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE9BQU8sR0FBRyx5QkFBVztBQUN2QkMsTUFBQUEsMEJBQTBCLEVBQUUsSUFETDtBQUV2QkMsTUFBQUEsb0NBQW9DLEVBQUUsS0FBS0wsS0FBTCxDQUFXTSxhQUYxQjtBQUd2QiwrQkFBa0IsS0FBS04sS0FBTCxDQUFXTyxJQUE3QixJQUFzQztBQUhmLEtBQVgsQ0FBaEI7QUFNQSx3QkFBTyw2QkFBQyx5QkFBRDtBQUNILHVCQUFlLEtBQUtQLEtBQUwsQ0FBV00sYUFEdkI7QUFFSCxNQUFBLElBQUksRUFBQyxLQUZGO0FBR0gsTUFBQSxLQUFLLEVBQUUsS0FBS04sS0FBTCxDQUFXUSxLQUhmO0FBSUgsTUFBQSxTQUFTLEVBQUVMLE9BSlI7QUFLSCxNQUFBLE9BQU8sRUFBRSxLQUFLUjtBQUxYLE1BQVA7QUFPSDs7QUF6QnFEOzs7QUE0QjFESixZQUFZLENBQUNrQixTQUFiLEdBQXlCO0FBQ3JCO0FBQ0FILEVBQUFBLGFBQWEsRUFBRUksbUJBQVVDLElBQVYsQ0FBZUMsVUFGVDtBQUdyQjtBQUNBakIsRUFBQUEsT0FBTyxFQUFFZSxtQkFBVUcsSUFBVixDQUFlRCxVQUpIO0FBS3JCO0FBQ0FFLEVBQUFBLEtBQUssRUFBRUosbUJBQVVLLElBTkk7QUFPckI7QUFDQWQsRUFBQUEsU0FBUyxFQUFFUyxtQkFBVU0sT0FBVixDQUFrQk4sbUJBQVVPLE1BQTVCLEVBQW9DTCxVQVIxQjtBQVVyQjtBQUNBTCxFQUFBQSxJQUFJLEVBQUVHLG1CQUFVTyxNQUFWLENBQWlCTCxVQVhGO0FBWXJCO0FBQ0FKLEVBQUFBLEtBQUssRUFBRUUsbUJBQVVPLE1BQVYsQ0FBaUJMO0FBYkgsQ0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTggTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBBbmFseXRpY3MgZnJvbSAnLi4vLi4vLi4vQW5hbHl0aWNzJztcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gJy4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b24nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWFkZXJCdXR0b24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9uQ2xpY2sgPSB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkNsaWNrKGV2KSB7XG4gICAgICAgIEFuYWx5dGljcy50cmFja0V2ZW50KC4uLnRoaXMucHJvcHMuYW5hbHl0aWNzKTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBteF9SaWdodFBhbmVsX2hlYWRlckJ1dHRvbjogdHJ1ZSxcbiAgICAgICAgICAgIG14X1JpZ2h0UGFuZWxfaGVhZGVyQnV0dG9uX2hpZ2hsaWdodDogdGhpcy5wcm9wcy5pc0hpZ2hsaWdodGVkLFxuICAgICAgICAgICAgW2BteF9SaWdodFBhbmVsXyR7dGhpcy5wcm9wcy5uYW1lfWBdOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgIGFyaWEtc2VsZWN0ZWQ9e3RoaXMucHJvcHMuaXNIaWdobGlnaHRlZH1cbiAgICAgICAgICAgIHJvbGU9XCJ0YWJcIlxuICAgICAgICAgICAgdGl0bGU9e3RoaXMucHJvcHMudGl0bGV9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXN9XG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uQ2xpY2t9PlxuICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgIH1cbn1cblxuSGVhZGVyQnV0dG9uLnByb3BUeXBlcyA9IHtcbiAgICAvLyBXaGV0aGVyIHRoaXMgYnV0dG9uIGlzIGhpZ2hsaWdodGVkXG4gICAgaXNIaWdobGlnaHRlZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICAvLyBjbGljayBoYW5kbGVyXG4gICAgb25DbGljazogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBUaGUgYmFkZ2UgdG8gZGlzcGxheSBhYm92ZSB0aGUgaWNvblxuICAgIGJhZGdlOiBQcm9wVHlwZXMubm9kZSxcbiAgICAvLyBUaGUgcGFyYW1ldGVycyB0byB0cmFjayB0aGUgY2xpY2sgZXZlbnRcbiAgICBhbmFseXRpY3M6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5zdHJpbmcpLmlzUmVxdWlyZWQsXG5cbiAgICAvLyBCdXR0b24gbmFtZVxuICAgIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAvLyBCdXR0b24gdGl0bGVcbiAgICB0aXRsZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxufTtcbiJdfQ==