"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
class InviteOnlyIcon extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onHoverStart", () => {
      this.setState({
        hover: true
      });
    });
    (0, _defineProperty2.default)(this, "onHoverEnd", () => {
      this.setState({
        hover: false
      });
    });
    this.state = {
      hover: false
    };
  }

  render() {
    const classes = this.props.collapsedPanel ? "mx_InviteOnlyIcon_small" : "mx_InviteOnlyIcon_large";
    const Tooltip = sdk.getComponent("elements.Tooltip");
    let tooltip;

    if (this.state.hover) {
      tooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        className: "mx_InviteOnlyIcon_tooltip",
        label: (0, _languageHandler._t)("Invite only"),
        dir: "auto"
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes,
      onMouseEnter: this.onHoverStart,
      onMouseLeave: this.onHoverEnd
    }, tooltip);
  }

}

exports.default = InviteOnlyIcon;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0ludml0ZU9ubHlJY29uLmpzIl0sIm5hbWVzIjpbIkludml0ZU9ubHlJY29uIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInNldFN0YXRlIiwiaG92ZXIiLCJzdGF0ZSIsInJlbmRlciIsImNsYXNzZXMiLCJwcm9wcyIsImNvbGxhcHNlZFBhbmVsIiwiVG9vbHRpcCIsInNkayIsImdldENvbXBvbmVudCIsInRvb2x0aXAiLCJvbkhvdmVyU3RhcnQiLCJvbkhvdmVyRW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQWxCQTs7Ozs7Ozs7Ozs7Ozs7O0FBb0JlLE1BQU1BLGNBQU4sU0FBNkJDLGVBQU1DLFNBQW5DLENBQTZDO0FBQ3hEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLHdEQVFDLE1BQU07QUFDakIsV0FBS0MsUUFBTCxDQUFjO0FBQUNDLFFBQUFBLEtBQUssRUFBRTtBQUFSLE9BQWQ7QUFDSCxLQVZhO0FBQUEsc0RBWUQsTUFBTTtBQUNmLFdBQUtELFFBQUwsQ0FBYztBQUFDQyxRQUFBQSxLQUFLLEVBQUU7QUFBUixPQUFkO0FBQ0gsS0FkYTtBQUdWLFNBQUtDLEtBQUwsR0FBYTtBQUNURCxNQUFBQSxLQUFLLEVBQUU7QUFERSxLQUFiO0FBR0g7O0FBVURFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE9BQU8sR0FBRyxLQUFLQyxLQUFMLENBQVdDLGNBQVgsR0FBNEIseUJBQTVCLEdBQXVELHlCQUF2RTtBQUVBLFVBQU1DLE9BQU8sR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLFFBQUlDLE9BQUo7O0FBQ0EsUUFBSSxLQUFLUixLQUFMLENBQVdELEtBQWYsRUFBc0I7QUFDbEJTLE1BQUFBLE9BQU8sZ0JBQUcsNkJBQUMsT0FBRDtBQUFTLFFBQUEsU0FBUyxFQUFDLDJCQUFuQjtBQUErQyxRQUFBLEtBQUssRUFBRSx5QkFBRyxhQUFILENBQXREO0FBQXlFLFFBQUEsR0FBRyxFQUFDO0FBQTdFLFFBQVY7QUFDSDs7QUFDRCx3QkFBUTtBQUFLLE1BQUEsU0FBUyxFQUFFTixPQUFoQjtBQUNOLE1BQUEsWUFBWSxFQUFFLEtBQUtPLFlBRGI7QUFFTixNQUFBLFlBQVksRUFBRSxLQUFLQztBQUZiLE9BSUpGLE9BSkksQ0FBUjtBQU1IOztBQS9CdUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW52aXRlT25seUljb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBob3ZlcjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25Ib3ZlclN0YXJ0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogdHJ1ZX0pO1xuICAgIH07XG5cbiAgICBvbkhvdmVyRW5kID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtob3ZlcjogZmFsc2V9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gdGhpcy5wcm9wcy5jb2xsYXBzZWRQYW5lbCA/IFwibXhfSW52aXRlT25seUljb25fc21hbGxcIjogXCJteF9JbnZpdGVPbmx5SWNvbl9sYXJnZVwiO1xuXG4gICAgICAgIGNvbnN0IFRvb2x0aXAgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVG9vbHRpcFwiKTtcbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmhvdmVyKSB7XG4gICAgICAgICAgICB0b29sdGlwID0gPFRvb2x0aXAgY2xhc3NOYW1lPVwibXhfSW52aXRlT25seUljb25fdG9vbHRpcFwiIGxhYmVsPXtfdChcIkludml0ZSBvbmx5XCIpfSBkaXI9XCJhdXRvXCIgLz47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc31cbiAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMub25Ib3ZlclN0YXJ0fVxuICAgICAgICAgIG9uTW91c2VMZWF2ZT17dGhpcy5vbkhvdmVyRW5kfVxuICAgICAgICA+XG4gICAgICAgICAgeyB0b29sdGlwIH1cbiAgICAgICAgPC9kaXY+KTtcbiAgICB9XG59XG4iXX0=