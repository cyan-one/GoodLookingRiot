"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

/*
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
class MjolnirBody extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onAllowClick", e => {
      e.preventDefault();
      e.stopPropagation();
      const key = "mx_mjolnir_render_".concat(this.props.mxEvent.getRoomId(), "__").concat(this.props.mxEvent.getId());
      localStorage.setItem(key, "true");
      this.props.onMessageAllowed();
    });
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MjolnirBody"
    }, /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)("You have ignored this user, so their message is hidden. <a>Show anyways.</a>", {}, {
      a: sub => /*#__PURE__*/_react.default.createElement("a", {
        href: "#",
        onClick: this._onAllowClick
      }, sub)
    })));
  }

}

exports.default = MjolnirBody;
(0, _defineProperty2.default)(MjolnirBody, "propTypes", {
  mxEvent: _propTypes.default.object.isRequired,
  onMessageAllowed: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01qb2xuaXJCb2R5LmpzIl0sIm5hbWVzIjpbIk1qb2xuaXJCb2R5IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsImtleSIsInByb3BzIiwibXhFdmVudCIsImdldFJvb21JZCIsImdldElkIiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsIm9uTWVzc2FnZUFsbG93ZWQiLCJyZW5kZXIiLCJhIiwic3ViIiwiX29uQWxsb3dDbGljayIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW9CZSxNQUFNQSxXQUFOLFNBQTBCQyxlQUFNQyxTQUFoQyxDQUEwQztBQU1yREMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSx5REFJR0MsQ0FBRCxJQUFPO0FBQ25CQSxNQUFBQSxDQUFDLENBQUNDLGNBQUY7QUFDQUQsTUFBQUEsQ0FBQyxDQUFDRSxlQUFGO0FBRUEsWUFBTUMsR0FBRywrQkFBd0IsS0FBS0MsS0FBTCxDQUFXQyxPQUFYLENBQW1CQyxTQUFuQixFQUF4QixlQUEyRCxLQUFLRixLQUFMLENBQVdDLE9BQVgsQ0FBbUJFLEtBQW5CLEVBQTNELENBQVQ7QUFDQUMsTUFBQUEsWUFBWSxDQUFDQyxPQUFiLENBQXFCTixHQUFyQixFQUEwQixNQUExQjtBQUNBLFdBQUtDLEtBQUwsQ0FBV00sZ0JBQVg7QUFDSCxLQVhhO0FBRWI7O0FBV0RDLEVBQUFBLE1BQU0sR0FBRztBQUNMLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFBZ0Msd0NBQUkseUJBQ2hDLDhFQURnQyxFQUVoQyxFQUZnQyxFQUU1QjtBQUFDQyxNQUFBQSxDQUFDLEVBQUdDLEdBQUQsaUJBQVM7QUFBRyxRQUFBLElBQUksRUFBQyxHQUFSO0FBQVksUUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFBMUIsU0FBMENELEdBQTFDO0FBQWIsS0FGNEIsQ0FBSixDQUFoQyxDQURKO0FBTUg7O0FBMUJvRDs7OzhCQUFwQ2pCLFcsZUFDRTtBQUNmUyxFQUFBQSxPQUFPLEVBQUVVLG1CQUFVQyxNQUFWLENBQWlCQyxVQURYO0FBRWZQLEVBQUFBLGdCQUFnQixFQUFFSyxtQkFBVUcsSUFBVixDQUFlRDtBQUZsQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge190fSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNam9sbmlyQm9keSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvbk1lc3NhZ2VBbGxvd2VkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBfb25BbGxvd0NsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGNvbnN0IGtleSA9IGBteF9tam9sbmlyX3JlbmRlcl8ke3RoaXMucHJvcHMubXhFdmVudC5nZXRSb29tSWQoKX1fXyR7dGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCl9YDtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBcInRydWVcIik7XG4gICAgICAgIHRoaXMucHJvcHMub25NZXNzYWdlQWxsb3dlZCgpO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfTWpvbG5pckJvZHknPjxpPntfdChcbiAgICAgICAgICAgICAgICBcIllvdSBoYXZlIGlnbm9yZWQgdGhpcyB1c2VyLCBzbyB0aGVpciBtZXNzYWdlIGlzIGhpZGRlbi4gPGE+U2hvdyBhbnl3YXlzLjwvYT5cIixcbiAgICAgICAgICAgICAgICB7fSwge2E6IChzdWIpID0+IDxhIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5fb25BbGxvd0NsaWNrfT57c3VifTwvYT59LFxuICAgICAgICAgICAgKX08L2k+PC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19