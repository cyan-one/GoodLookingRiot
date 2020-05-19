"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

/*
Copyright 2017 New Vector Ltd

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

/*
 * This component can be used to display generic HTML content in a contextual
 * menu.
 */
class GenericElementContextMenu extends _react.default.Component {
  constructor(props) {
    super(props);
    this.resize = this.resize.bind(this);
  }

  componentDidMount() {
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  resize() {
    if (this.props.onResize) {
      this.props.onResize();
    }
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", null, this.props.element);
  }

}

exports.default = GenericElementContextMenu;
(0, _defineProperty2.default)(GenericElementContextMenu, "propTypes", {
  element: _propTypes.default.element.isRequired,
  // Function to be called when the parent window is resized
  // This can be used to reposition or close the menu on resize and
  // ensure that it is not displayed in a stale position.
  onResize: _propTypes.default.func
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvR2VuZXJpY0VsZW1lbnRDb250ZXh0TWVudS5qcyJdLCJuYW1lcyI6WyJHZW5lcmljRWxlbWVudENvbnRleHRNZW51IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwicmVzaXplIiwiYmluZCIsImNvbXBvbmVudERpZE1vdW50Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm9uUmVzaXplIiwicmVuZGVyIiwiZWxlbWVudCIsIlByb3BUeXBlcyIsImlzUmVxdWlyZWQiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7Ozs7QUFNZSxNQUFNQSx5QkFBTixTQUF3Q0MsZUFBTUMsU0FBOUMsQ0FBd0Q7QUFTbkVDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxLQUFLQSxNQUFMLENBQVlDLElBQVosQ0FBaUIsSUFBakIsQ0FBZDtBQUNIOztBQUVEQyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixTQUFLRixNQUFMLEdBQWMsS0FBS0EsTUFBTCxDQUFZQyxJQUFaLENBQWlCLElBQWpCLENBQWQ7QUFDQUUsSUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxLQUFLSixNQUF2QztBQUNIOztBQUVESyxFQUFBQSxvQkFBb0IsR0FBRztBQUNuQkYsSUFBQUEsTUFBTSxDQUFDRyxtQkFBUCxDQUEyQixRQUEzQixFQUFxQyxLQUFLTixNQUExQztBQUNIOztBQUVEQSxFQUFBQSxNQUFNLEdBQUc7QUFDTCxRQUFJLEtBQUtELEtBQUwsQ0FBV1EsUUFBZixFQUF5QjtBQUNyQixXQUFLUixLQUFMLENBQVdRLFFBQVg7QUFDSDtBQUNKOztBQUVEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCx3QkFBTywwQ0FBTyxLQUFLVCxLQUFMLENBQVdVLE9BQWxCLENBQVA7QUFDSDs7QUEvQmtFOzs7OEJBQWxEZCx5QixlQUNFO0FBQ2ZjLEVBQUFBLE9BQU8sRUFBRUMsbUJBQVVELE9BQVYsQ0FBa0JFLFVBRFo7QUFFZjtBQUNBO0FBQ0E7QUFDQUosRUFBQUEsUUFBUSxFQUFFRyxtQkFBVUU7QUFMTCxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5cbi8qXG4gKiBUaGlzIGNvbXBvbmVudCBjYW4gYmUgdXNlZCB0byBkaXNwbGF5IGdlbmVyaWMgSFRNTCBjb250ZW50IGluIGEgY29udGV4dHVhbFxuICogbWVudS5cbiAqL1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlbmVyaWNFbGVtZW50Q29udGV4dE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGVsZW1lbnQ6IFByb3BUeXBlcy5lbGVtZW50LmlzUmVxdWlyZWQsXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwYXJlbnQgd2luZG93IGlzIHJlc2l6ZWRcbiAgICAgICAgLy8gVGhpcyBjYW4gYmUgdXNlZCB0byByZXBvc2l0aW9uIG9yIGNsb3NlIHRoZSBtZW51IG9uIHJlc2l6ZSBhbmRcbiAgICAgICAgLy8gZW5zdXJlIHRoYXQgaXQgaXMgbm90IGRpc3BsYXllZCBpbiBhIHN0YWxlIHBvc2l0aW9uLlxuICAgICAgICBvblJlc2l6ZTogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5yZXNpemUgPSB0aGlzLnJlc2l6ZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLnJlc2l6ZSA9IHRoaXMucmVzaXplLmJpbmQodGhpcyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMucmVzaXplKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5yZXNpemUpO1xuICAgIH1cblxuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25SZXNpemUpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25SZXNpemUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+eyB0aGlzLnByb3BzLmVsZW1lbnQgfTwvZGl2PjtcbiAgICB9XG59XG4iXX0=