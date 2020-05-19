"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

var sdk = _interopRequireWildcard(require("../../../index"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class AccessibleTooltipButton extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "state", {
      hover: false
    });
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
  }

  render() {
    const Tooltip = sdk.getComponent("elements.Tooltip");
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const _this$props = this.props,
          {
      title,
      children
    } = _this$props,
          props = (0, _objectWithoutProperties2.default)(_this$props, ["title", "children"]);
    const tip = this.state.hover ? /*#__PURE__*/_react.default.createElement(Tooltip, {
      className: "mx_AccessibleTooltipButton_container",
      tooltipClassName: "mx_AccessibleTooltipButton_tooltip",
      label: title
    }) : /*#__PURE__*/_react.default.createElement("div", null);
    return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut,
      "aria-label": title
    }), children, tip);
  }

}

exports.default = AccessibleTooltipButton;
(0, _defineProperty2.default)(AccessibleTooltipButton, "propTypes", _objectSpread({}, _AccessibleButton.default.propTypes, {
  // The tooltip to render on hover
  title: _propTypes.default.string.isRequired
}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0FjY2Vzc2libGVUb29sdGlwQnV0dG9uLmpzIl0sIm5hbWVzIjpbIkFjY2Vzc2libGVUb29sdGlwQnV0dG9uIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiaG92ZXIiLCJzZXRTdGF0ZSIsInJlbmRlciIsIlRvb2x0aXAiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJBY2Nlc3NpYmxlQnV0dG9uIiwicHJvcHMiLCJ0aXRsZSIsImNoaWxkcmVuIiwidGlwIiwic3RhdGUiLCJvbk1vdXNlT3ZlciIsIm9uTW91c2VPdXQiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7O0FBRWUsTUFBTUEsdUJBQU4sU0FBc0NDLGVBQU1DLGFBQTVDLENBQTBEO0FBQUE7QUFBQTtBQUFBLGlEQU83RDtBQUNKQyxNQUFBQSxLQUFLLEVBQUU7QUFESCxLQVA2RDtBQUFBLHVEQVd2RCxNQUFNO0FBQ2hCLFdBQUtDLFFBQUwsQ0FBYztBQUNWRCxRQUFBQSxLQUFLLEVBQUU7QUFERyxPQUFkO0FBR0gsS0Fmb0U7QUFBQSxzREFpQnhELE1BQU07QUFDZixXQUFLQyxRQUFMLENBQWM7QUFDVkQsUUFBQUEsS0FBSyxFQUFFO0FBREcsT0FBZDtBQUdILEtBckJvRTtBQUFBOztBQXVCckVFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE9BQU8sR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLFVBQU1DLGdCQUFnQixHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBRUEsd0JBQW9DLEtBQUtFLEtBQXpDO0FBQUEsVUFBTTtBQUFDQyxNQUFBQSxLQUFEO0FBQVFDLE1BQUFBO0FBQVIsS0FBTjtBQUFBLFVBQTJCRixLQUEzQjtBQUVBLFVBQU1HLEdBQUcsR0FBRyxLQUFLQyxLQUFMLENBQVdYLEtBQVgsZ0JBQW1CLDZCQUFDLE9BQUQ7QUFDM0IsTUFBQSxTQUFTLEVBQUMsc0NBRGlCO0FBRTNCLE1BQUEsZ0JBQWdCLEVBQUMsb0NBRlU7QUFHM0IsTUFBQSxLQUFLLEVBQUVRO0FBSG9CLE1BQW5CLGdCQUlQLHlDQUpMO0FBS0Esd0JBQ0ksNkJBQUMsZ0JBQUQsNkJBQXNCRCxLQUF0QjtBQUE2QixNQUFBLFdBQVcsRUFBRSxLQUFLSyxXQUEvQztBQUE0RCxNQUFBLFVBQVUsRUFBRSxLQUFLQyxVQUE3RTtBQUF5RixvQkFBWUw7QUFBckcsUUFDTUMsUUFETixFQUVNQyxHQUZOLENBREo7QUFNSDs7QUF4Q29FOzs7OEJBQXBEYix1QixpQ0FFVlMsMEJBQWlCUSxTO0FBQ3BCO0FBQ0FOLEVBQUFBLEtBQUssRUFBRU8sbUJBQVVDLE1BQVYsQ0FBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4vQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBY2Nlc3NpYmxlVG9vbHRpcEJ1dHRvbiBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC4uLkFjY2Vzc2libGVCdXR0b24ucHJvcFR5cGVzLFxuICAgICAgICAvLyBUaGUgdG9vbHRpcCB0byByZW5kZXIgb24gaG92ZXJcbiAgICAgICAgdGl0bGU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgc3RhdGUgPSB7XG4gICAgICAgIGhvdmVyOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgb25Nb3VzZU92ZXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaG92ZXI6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBvbk1vdXNlT3V0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGhvdmVyOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgVG9vbHRpcCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5Ub29sdGlwXCIpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b25cIik7XG5cbiAgICAgICAgY29uc3Qge3RpdGxlLCBjaGlsZHJlbiwgLi4ucHJvcHN9ID0gdGhpcy5wcm9wcztcblxuICAgICAgICBjb25zdCB0aXAgPSB0aGlzLnN0YXRlLmhvdmVyID8gPFRvb2x0aXBcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0FjY2Vzc2libGVUb29sdGlwQnV0dG9uX2NvbnRhaW5lclwiXG4gICAgICAgICAgICB0b29sdGlwQ2xhc3NOYW1lPVwibXhfQWNjZXNzaWJsZVRvb2x0aXBCdXR0b25fdG9vbHRpcFwiXG4gICAgICAgICAgICBsYWJlbD17dGl0bGV9XG4gICAgICAgIC8+IDogPGRpdiAvPjtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIHsuLi5wcm9wc30gb25Nb3VzZU92ZXI9e3RoaXMub25Nb3VzZU92ZXJ9IG9uTW91c2VPdXQ9e3RoaXMub25Nb3VzZU91dH0gYXJpYS1sYWJlbD17dGl0bGV9PlxuICAgICAgICAgICAgICAgIHsgY2hpbGRyZW4gfVxuICAgICAgICAgICAgICAgIHsgdGlwIH1cbiAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=