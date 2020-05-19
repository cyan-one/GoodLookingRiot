"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2019 New Vector Ltd
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
// Controlled Toggle Switch element, written with Accessibility in mind
const ToggleSwitch = (_ref) => {
  let {
    checked,
    disabled = false,
    onChange
  } = _ref,
      props = (0, _objectWithoutProperties2.default)(_ref, ["checked", "disabled", "onChange"]);

  const _onClick = e => {
    if (disabled) return;
    onChange(!checked);
  };

  const classes = (0, _classnames.default)({
    "mx_ToggleSwitch": true,
    "mx_ToggleSwitch_on": checked,
    "mx_ToggleSwitch_enabled": !disabled
  });
  const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
  return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
    className: classes,
    onClick: _onClick,
    role: "switch",
    "aria-checked": checked,
    "aria-disabled": disabled
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_ToggleSwitch_ball"
  }));
};

ToggleSwitch.propTypes = {
  // Whether or not this toggle is in the 'on' position.
  checked: _propTypes.default.bool.isRequired,
  // Whether or not the user can interact with the switch
  disabled: _propTypes.default.bool,
  // Called when the checked state changes. First argument will be the new state.
  onChange: _propTypes.default.func.isRequired
};
var _default = ToggleSwitch;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1RvZ2dsZVN3aXRjaC5qcyJdLCJuYW1lcyI6WyJUb2dnbGVTd2l0Y2giLCJjaGVja2VkIiwiZGlzYWJsZWQiLCJvbkNoYW5nZSIsInByb3BzIiwiX29uQ2xpY2siLCJlIiwiY2xhc3NlcyIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJib29sIiwiaXNSZXF1aXJlZCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkE7QUFDQSxNQUFNQSxZQUFZLEdBQUcsVUFBbUQ7QUFBQSxNQUFsRDtBQUFDQyxJQUFBQSxPQUFEO0FBQVVDLElBQUFBLFFBQVEsR0FBQyxLQUFuQjtBQUEwQkMsSUFBQUE7QUFBMUIsR0FBa0Q7QUFBQSxNQUFYQyxLQUFXOztBQUNwRSxRQUFNQyxRQUFRLEdBQUlDLENBQUQsSUFBTztBQUNwQixRQUFJSixRQUFKLEVBQWM7QUFDZEMsSUFBQUEsUUFBUSxDQUFDLENBQUNGLE9BQUYsQ0FBUjtBQUNILEdBSEQ7O0FBS0EsUUFBTU0sT0FBTyxHQUFHLHlCQUFXO0FBQ3ZCLHVCQUFtQixJQURJO0FBRXZCLDBCQUFzQk4sT0FGQztBQUd2QiwrQkFBMkIsQ0FBQ0M7QUFITCxHQUFYLENBQWhCO0FBTUEsUUFBTU0sZ0JBQWdCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwyQkFBakIsQ0FBekI7QUFDQSxzQkFDSSw2QkFBQyxnQkFBRCw2QkFBc0JOLEtBQXRCO0FBQ0ksSUFBQSxTQUFTLEVBQUVHLE9BRGY7QUFFSSxJQUFBLE9BQU8sRUFBRUYsUUFGYjtBQUdJLElBQUEsSUFBSSxFQUFDLFFBSFQ7QUFJSSxvQkFBY0osT0FKbEI7QUFLSSxxQkFBZUM7QUFMbkIsbUJBT0k7QUFBSyxJQUFBLFNBQVMsRUFBQztBQUFmLElBUEosQ0FESjtBQVdILENBeEJEOztBQTBCQUYsWUFBWSxDQUFDVyxTQUFiLEdBQXlCO0FBQ3JCO0FBQ0FWLEVBQUFBLE9BQU8sRUFBRVcsbUJBQVVDLElBQVYsQ0FBZUMsVUFGSDtBQUlyQjtBQUNBWixFQUFBQSxRQUFRLEVBQUVVLG1CQUFVQyxJQUxDO0FBT3JCO0FBQ0FWLEVBQUFBLFFBQVEsRUFBRVMsbUJBQVVHLElBQVYsQ0FBZUQ7QUFSSixDQUF6QjtlQVdlZCxZIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5cbi8vIENvbnRyb2xsZWQgVG9nZ2xlIFN3aXRjaCBlbGVtZW50LCB3cml0dGVuIHdpdGggQWNjZXNzaWJpbGl0eSBpbiBtaW5kXG5jb25zdCBUb2dnbGVTd2l0Y2ggPSAoe2NoZWNrZWQsIGRpc2FibGVkPWZhbHNlLCBvbkNoYW5nZSwgLi4ucHJvcHN9KSA9PiB7XG4gICAgY29uc3QgX29uQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZGlzYWJsZWQpIHJldHVybjtcbiAgICAgICAgb25DaGFuZ2UoIWNoZWNrZWQpO1xuICAgIH07XG5cbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgIFwibXhfVG9nZ2xlU3dpdGNoXCI6IHRydWUsXG4gICAgICAgIFwibXhfVG9nZ2xlU3dpdGNoX29uXCI6IGNoZWNrZWQsXG4gICAgICAgIFwibXhfVG9nZ2xlU3dpdGNoX2VuYWJsZWRcIjogIWRpc2FibGVkLFxuICAgIH0pO1xuXG4gICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uXCIpO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIHsuLi5wcm9wc31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlc31cbiAgICAgICAgICAgIG9uQ2xpY2s9e19vbkNsaWNrfVxuICAgICAgICAgICAgcm9sZT1cInN3aXRjaFwiXG4gICAgICAgICAgICBhcmlhLWNoZWNrZWQ9e2NoZWNrZWR9XG4gICAgICAgICAgICBhcmlhLWRpc2FibGVkPXtkaXNhYmxlZH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub2dnbGVTd2l0Y2hfYmFsbFwiIC8+XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICApO1xufTtcblxuVG9nZ2xlU3dpdGNoLnByb3BUeXBlcyA9IHtcbiAgICAvLyBXaGV0aGVyIG9yIG5vdCB0aGlzIHRvZ2dsZSBpcyBpbiB0aGUgJ29uJyBwb3NpdGlvbi5cbiAgICBjaGVja2VkOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuXG4gICAgLy8gV2hldGhlciBvciBub3QgdGhlIHVzZXIgY2FuIGludGVyYWN0IHdpdGggdGhlIHN3aXRjaFxuICAgIGRpc2FibGVkOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgIC8vIENhbGxlZCB3aGVuIHRoZSBjaGVja2VkIHN0YXRlIGNoYW5nZXMuIEZpcnN0IGFyZ3VtZW50IHdpbGwgYmUgdGhlIG5ldyBzdGF0ZS5cbiAgICBvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFRvZ2dsZVN3aXRjaDtcbiJdfQ==