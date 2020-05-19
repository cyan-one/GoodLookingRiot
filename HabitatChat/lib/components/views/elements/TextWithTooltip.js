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

var sdk = _interopRequireWildcard(require("../../../index"));

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
class TextWithTooltip extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onMouseOver", () => {
      this.setState({
        hover: true
      });
    });
    (0, _defineProperty2.default)(this, "onMouseOut", () => {
      this.setState({
        hover: false
      });
    });
    this.state = {
      hover: false
    };
  }

  render() {
    const Tooltip = sdk.getComponent("elements.Tooltip");
    return /*#__PURE__*/_react.default.createElement("span", {
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut,
      className: this.props.class
    }, this.props.children, /*#__PURE__*/_react.default.createElement(Tooltip, {
      label: this.props.tooltip,
      visible: this.state.hover,
      tooltipClassName: this.props.tooltipClass,
      className: "mx_TextWithTooltip_tooltip"
    }));
  }

}

exports.default = TextWithTooltip;
(0, _defineProperty2.default)(TextWithTooltip, "propTypes", {
  class: _propTypes.default.string,
  tooltipClass: _propTypes.default.string,
  tooltip: _propTypes.default.node.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1RleHRXaXRoVG9vbHRpcC5qcyJdLCJuYW1lcyI6WyJUZXh0V2l0aFRvb2x0aXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwic2V0U3RhdGUiLCJob3ZlciIsInN0YXRlIiwicmVuZGVyIiwiVG9vbHRpcCIsInNkayIsImdldENvbXBvbmVudCIsIm9uTW91c2VPdmVyIiwib25Nb3VzZU91dCIsInByb3BzIiwiY2xhc3MiLCJjaGlsZHJlbiIsInRvb2x0aXAiLCJ0b29sdGlwQ2xhc3MiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJub2RlIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW9CZSxNQUFNQSxlQUFOLFNBQThCQyxlQUFNQyxTQUFwQyxDQUE4QztBQU96REMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSx1REFRQSxNQUFNO0FBQ2hCLFdBQUtDLFFBQUwsQ0FBYztBQUFDQyxRQUFBQSxLQUFLLEVBQUU7QUFBUixPQUFkO0FBQ0gsS0FWYTtBQUFBLHNEQVlELE1BQU07QUFDZixXQUFLRCxRQUFMLENBQWM7QUFBQ0MsUUFBQUEsS0FBSyxFQUFFO0FBQVIsT0FBZDtBQUNILEtBZGE7QUFHVixTQUFLQyxLQUFMLEdBQWE7QUFDVEQsTUFBQUEsS0FBSyxFQUFFO0FBREUsS0FBYjtBQUdIOztBQVVERSxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxPQUFPLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixrQkFBakIsQ0FBaEI7QUFFQSx3QkFDSTtBQUFNLE1BQUEsV0FBVyxFQUFFLEtBQUtDLFdBQXhCO0FBQXFDLE1BQUEsVUFBVSxFQUFFLEtBQUtDLFVBQXREO0FBQWtFLE1BQUEsU0FBUyxFQUFFLEtBQUtDLEtBQUwsQ0FBV0M7QUFBeEYsT0FDSyxLQUFLRCxLQUFMLENBQVdFLFFBRGhCLGVBRUksNkJBQUMsT0FBRDtBQUNJLE1BQUEsS0FBSyxFQUFFLEtBQUtGLEtBQUwsQ0FBV0csT0FEdEI7QUFFSSxNQUFBLE9BQU8sRUFBRSxLQUFLVixLQUFMLENBQVdELEtBRnhCO0FBR0ksTUFBQSxnQkFBZ0IsRUFBRSxLQUFLUSxLQUFMLENBQVdJLFlBSGpDO0FBSUksTUFBQSxTQUFTLEVBQUU7QUFKZixNQUZKLENBREo7QUFVSDs7QUFwQ3dEOzs7OEJBQXhDakIsZSxlQUNFO0FBQ2ZjLEVBQUFBLEtBQUssRUFBRUksbUJBQVVDLE1BREY7QUFFZkYsRUFBQUEsWUFBWSxFQUFFQyxtQkFBVUMsTUFGVDtBQUdmSCxFQUFBQSxPQUFPLEVBQUVFLG1CQUFVRSxJQUFWLENBQWVDO0FBSFQsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGQuXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0V2l0aFRvb2x0aXAgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGNsYXNzOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICB0b29sdGlwQ2xhc3M6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIHRvb2x0aXA6IFByb3BUeXBlcy5ub2RlLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25Nb3VzZU92ZXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hvdmVyOiB0cnVlfSk7XG4gICAgfTtcblxuICAgIG9uTW91c2VPdXQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hvdmVyOiBmYWxzZX0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IFRvb2x0aXAgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVG9vbHRpcFwiKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHNwYW4gb25Nb3VzZU92ZXI9e3RoaXMub25Nb3VzZU92ZXJ9IG9uTW91c2VPdXQ9e3RoaXMub25Nb3VzZU91dH0gY2xhc3NOYW1lPXt0aGlzLnByb3BzLmNsYXNzfT5cbiAgICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgICAgICA8VG9vbHRpcFxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17dGhpcy5wcm9wcy50b29sdGlwfVxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlPXt0aGlzLnN0YXRlLmhvdmVyfVxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwQ2xhc3NOYW1lPXt0aGlzLnByb3BzLnRvb2x0aXBDbGFzc31cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcIm14X1RleHRXaXRoVG9vbHRpcF90b29sdGlwXCJ9IC8+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19