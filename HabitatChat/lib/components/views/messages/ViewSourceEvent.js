"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

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
class ViewSourceEvent extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onToggle", ev => {
      ev.preventDefault();
      const {
        expanded
      } = this.state;
      this.setState({
        expanded: !expanded
      });
    });
    this.state = {
      expanded: false
    };
  }

  componentDidMount() {
    const {
      mxEvent
    } = this.props;

    if (mxEvent.isBeingDecrypted()) {
      mxEvent.once("Event.decrypted", () => this.forceUpdate());
    }
  }

  render() {
    const {
      mxEvent
    } = this.props;
    const {
      expanded
    } = this.state;
    let content;

    if (expanded) {
      content = /*#__PURE__*/_react.default.createElement("pre", null, JSON.stringify(mxEvent, null, 4));
    } else {
      content = /*#__PURE__*/_react.default.createElement("code", null, "{ \"type\": ".concat(mxEvent.getType(), " }"));
    }

    const classes = (0, _classnames.default)("mx_ViewSourceEvent mx_EventTile_content", {
      mx_ViewSourceEvent_expanded: expanded
    });
    return /*#__PURE__*/_react.default.createElement("span", {
      className: classes
    }, content, /*#__PURE__*/_react.default.createElement("a", {
      className: "mx_ViewSourceEvent_toggle",
      href: "#",
      onClick: this.onToggle
    }));
  }

}

exports.default = ViewSourceEvent;
(0, _defineProperty2.default)(ViewSourceEvent, "propTypes", {
  /* the MatrixEvent to show */
  mxEvent: _propTypes.default.object.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL1ZpZXdTb3VyY2VFdmVudC5qcyJdLCJuYW1lcyI6WyJWaWV3U291cmNlRXZlbnQiLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZXYiLCJwcmV2ZW50RGVmYXVsdCIsImV4cGFuZGVkIiwic3RhdGUiLCJzZXRTdGF0ZSIsImNvbXBvbmVudERpZE1vdW50IiwibXhFdmVudCIsImlzQmVpbmdEZWNyeXB0ZWQiLCJvbmNlIiwiZm9yY2VVcGRhdGUiLCJyZW5kZXIiLCJjb250ZW50IiwiSlNPTiIsInN0cmluZ2lmeSIsImdldFR5cGUiLCJjbGFzc2VzIiwibXhfVmlld1NvdXJjZUV2ZW50X2V4cGFuZGVkIiwib25Ub2dnbGUiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW9CZSxNQUFNQSxlQUFOLFNBQThCQyxlQUFNQyxhQUFwQyxDQUFrRDtBQU03REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsb0RBZVBDLEVBQUQsSUFBUTtBQUNmQSxNQUFBQSxFQUFFLENBQUNDLGNBQUg7QUFDQSxZQUFNO0FBQUVDLFFBQUFBO0FBQUYsVUFBZSxLQUFLQyxLQUExQjtBQUNBLFdBQUtDLFFBQUwsQ0FBYztBQUNWRixRQUFBQSxRQUFRLEVBQUUsQ0FBQ0E7QUFERCxPQUFkO0FBR0gsS0FyQmtCO0FBR2YsU0FBS0MsS0FBTCxHQUFhO0FBQ1RELE1BQUFBLFFBQVEsRUFBRTtBQURELEtBQWI7QUFHSDs7QUFFREcsRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEIsVUFBTTtBQUFDQyxNQUFBQTtBQUFELFFBQVksS0FBS1AsS0FBdkI7O0FBQ0EsUUFBSU8sT0FBTyxDQUFDQyxnQkFBUixFQUFKLEVBQWdDO0FBQzVCRCxNQUFBQSxPQUFPLENBQUNFLElBQVIsQ0FBYSxpQkFBYixFQUFnQyxNQUFNLEtBQUtDLFdBQUwsRUFBdEM7QUFDSDtBQUNKOztBQVVEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNO0FBQUVKLE1BQUFBO0FBQUYsUUFBYyxLQUFLUCxLQUF6QjtBQUNBLFVBQU07QUFBRUcsTUFBQUE7QUFBRixRQUFlLEtBQUtDLEtBQTFCO0FBRUEsUUFBSVEsT0FBSjs7QUFDQSxRQUFJVCxRQUFKLEVBQWM7QUFDVlMsTUFBQUEsT0FBTyxnQkFBRywwQ0FBTUMsSUFBSSxDQUFDQyxTQUFMLENBQWVQLE9BQWYsRUFBd0IsSUFBeEIsRUFBOEIsQ0FBOUIsQ0FBTixDQUFWO0FBQ0gsS0FGRCxNQUVPO0FBQ0hLLE1BQUFBLE9BQU8sZ0JBQUcsaUVBQW9CTCxPQUFPLENBQUNRLE9BQVIsRUFBcEIsUUFBVjtBQUNIOztBQUVELFVBQU1DLE9BQU8sR0FBRyx5QkFBVyx5Q0FBWCxFQUFzRDtBQUNsRUMsTUFBQUEsMkJBQTJCLEVBQUVkO0FBRHFDLEtBQXRELENBQWhCO0FBSUEsd0JBQU87QUFBTSxNQUFBLFNBQVMsRUFBRWE7QUFBakIsT0FDRkosT0FERSxlQUVIO0FBQ0ksTUFBQSxTQUFTLEVBQUMsMkJBRGQ7QUFFSSxNQUFBLElBQUksRUFBQyxHQUZUO0FBR0ksTUFBQSxPQUFPLEVBQUUsS0FBS007QUFIbEIsTUFGRyxDQUFQO0FBUUg7O0FBcEQ0RDs7OzhCQUE1Q3RCLGUsZUFDRTtBQUNmO0FBQ0FXLEVBQUFBLE9BQU8sRUFBRVksbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRlgsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZpZXdTb3VyY2VFdmVudCBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8qIHRoZSBNYXRyaXhFdmVudCB0byBzaG93ICovXG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBleHBhbmRlZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnN0IHtteEV2ZW50fSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGlmIChteEV2ZW50LmlzQmVpbmdEZWNyeXB0ZWQoKSkge1xuICAgICAgICAgICAgbXhFdmVudC5vbmNlKFwiRXZlbnQuZGVjcnlwdGVkXCIsICgpID0+IHRoaXMuZm9yY2VVcGRhdGUoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblRvZ2dsZSA9IChldikgPT4ge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB7IGV4cGFuZGVkIH0gPSB0aGlzLnN0YXRlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGV4cGFuZGVkOiAhZXhwYW5kZWQsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgeyBteEV2ZW50IH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCB7IGV4cGFuZGVkIH0gPSB0aGlzLnN0YXRlO1xuXG4gICAgICAgIGxldCBjb250ZW50O1xuICAgICAgICBpZiAoZXhwYW5kZWQpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8cHJlPntKU09OLnN0cmluZ2lmeShteEV2ZW50LCBudWxsLCA0KX08L3ByZT47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50ID0gPGNvZGU+e2B7IFwidHlwZVwiOiAke214RXZlbnQuZ2V0VHlwZSgpfSB9YH08L2NvZGU+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoXCJteF9WaWV3U291cmNlRXZlbnQgbXhfRXZlbnRUaWxlX2NvbnRlbnRcIiwge1xuICAgICAgICAgICAgbXhfVmlld1NvdXJjZUV2ZW50X2V4cGFuZGVkOiBleHBhbmRlZCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICB7Y29udGVudH1cbiAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfVmlld1NvdXJjZUV2ZW50X3RvZ2dsZVwiXG4gICAgICAgICAgICAgICAgaHJlZj1cIiNcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25Ub2dnbGV9XG4gICAgICAgICAgICAvPlxuICAgICAgICA8L3NwYW4+O1xuICAgIH1cbn1cbiJdfQ==