"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var React = _interopRequireWildcard(require("react"));

var _languageHandler = require("../../languageHandler");

var _ToastStore = _interopRequireDefault(require("../../stores/ToastStore"));

var _classnames = _interopRequireDefault(require("classnames"));

/*
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
class ToastContainer extends React.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onToastStoreUpdate", () => {
      this.setState({
        toasts: _ToastStore.default.sharedInstance().getToasts()
      });
    });
    this.state = {
      toasts: _ToastStore.default.sharedInstance().getToasts()
    }; // Start listening here rather than in componentDidMount because
    // toasts may dismiss themselves in their didMount if they find
    // they're already irrelevant by the time they're mounted, and
    // our own componentDidMount is too late.

    _ToastStore.default.sharedInstance().on('update', this._onToastStoreUpdate);
  }

  componentWillUnmount() {
    _ToastStore.default.sharedInstance().removeListener('update', this._onToastStoreUpdate);
  }

  render() {
    const totalCount = this.state.toasts.length;
    const isStacked = totalCount > 1;
    let toast;

    if (totalCount !== 0) {
      const topToast = this.state.toasts[0];
      const {
        title,
        icon,
        key,
        component,
        props
      } = topToast;
      const toastClasses = (0, _classnames.default)("mx_Toast_toast", {
        "mx_Toast_hasIcon": icon,
        ["mx_Toast_icon_".concat(icon)]: icon
      });
      const countIndicator = isStacked ? (0, _languageHandler._t)(" (1/%(totalCount)s)", {
        totalCount
      }) : null;
      const toastProps = Object.assign({}, props, {
        key,
        toastKey: key
      });
      toast = /*#__PURE__*/React.createElement("div", {
        className: toastClasses
      }, /*#__PURE__*/React.createElement("h2", null, title, countIndicator), /*#__PURE__*/React.createElement("div", {
        className: "mx_Toast_body"
      }, React.createElement(component, toastProps)));
    }

    const containerClasses = (0, _classnames.default)("mx_ToastContainer", {
      "mx_ToastContainer_stacked": isStacked
    });
    return /*#__PURE__*/React.createElement("div", {
      className: containerClasses,
      role: "alert"
    }, toast);
  }

}

exports.default = ToastContainer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvVG9hc3RDb250YWluZXIuanMiXSwibmFtZXMiOlsiVG9hc3RDb250YWluZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwic2V0U3RhdGUiLCJ0b2FzdHMiLCJUb2FzdFN0b3JlIiwic2hhcmVkSW5zdGFuY2UiLCJnZXRUb2FzdHMiLCJzdGF0ZSIsIm9uIiwiX29uVG9hc3RTdG9yZVVwZGF0ZSIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJyZW5kZXIiLCJ0b3RhbENvdW50IiwibGVuZ3RoIiwiaXNTdGFja2VkIiwidG9hc3QiLCJ0b3BUb2FzdCIsInRpdGxlIiwiaWNvbiIsImtleSIsImNvbXBvbmVudCIsInByb3BzIiwidG9hc3RDbGFzc2VzIiwiY291bnRJbmRpY2F0b3IiLCJ0b2FzdFByb3BzIiwiT2JqZWN0IiwiYXNzaWduIiwidG9hc3RLZXkiLCJjcmVhdGVFbGVtZW50IiwiY29udGFpbmVyQ2xhc3NlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQSxjQUFOLFNBQTZCQyxLQUFLLENBQUNDLFNBQW5DLENBQTZDO0FBQ3hEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLCtEQWVRLE1BQU07QUFDeEIsV0FBS0MsUUFBTCxDQUFjO0FBQUNDLFFBQUFBLE1BQU0sRUFBRUMsb0JBQVdDLGNBQVgsR0FBNEJDLFNBQTVCO0FBQVQsT0FBZDtBQUNILEtBakJhO0FBRVYsU0FBS0MsS0FBTCxHQUFhO0FBQUNKLE1BQUFBLE1BQU0sRUFBRUMsb0JBQVdDLGNBQVgsR0FBNEJDLFNBQTVCO0FBQVQsS0FBYixDQUZVLENBSVY7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FGLHdCQUFXQyxjQUFYLEdBQTRCRyxFQUE1QixDQUErQixRQUEvQixFQUF5QyxLQUFLQyxtQkFBOUM7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkJOLHdCQUFXQyxjQUFYLEdBQTRCTSxjQUE1QixDQUEyQyxRQUEzQyxFQUFxRCxLQUFLRixtQkFBMUQ7QUFDSDs7QUFNREcsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHLEtBQUtOLEtBQUwsQ0FBV0osTUFBWCxDQUFrQlcsTUFBckM7QUFDQSxVQUFNQyxTQUFTLEdBQUdGLFVBQVUsR0FBRyxDQUEvQjtBQUNBLFFBQUlHLEtBQUo7O0FBQ0EsUUFBSUgsVUFBVSxLQUFLLENBQW5CLEVBQXNCO0FBQ2xCLFlBQU1JLFFBQVEsR0FBRyxLQUFLVixLQUFMLENBQVdKLE1BQVgsQ0FBa0IsQ0FBbEIsQ0FBakI7QUFDQSxZQUFNO0FBQUNlLFFBQUFBLEtBQUQ7QUFBUUMsUUFBQUEsSUFBUjtBQUFjQyxRQUFBQSxHQUFkO0FBQW1CQyxRQUFBQSxTQUFuQjtBQUE4QkMsUUFBQUE7QUFBOUIsVUFBdUNMLFFBQTdDO0FBQ0EsWUFBTU0sWUFBWSxHQUFHLHlCQUFXLGdCQUFYLEVBQTZCO0FBQzlDLDRCQUFvQkosSUFEMEI7QUFFOUMsaUNBQWtCQSxJQUFsQixJQUEyQkE7QUFGbUIsT0FBN0IsQ0FBckI7QUFJQSxZQUFNSyxjQUFjLEdBQUdULFNBQVMsR0FBRyx5QkFBRyxxQkFBSCxFQUEwQjtBQUFDRixRQUFBQTtBQUFELE9BQTFCLENBQUgsR0FBNkMsSUFBN0U7QUFFQSxZQUFNWSxVQUFVLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JMLEtBQWxCLEVBQXlCO0FBQ3hDRixRQUFBQSxHQUR3QztBQUV4Q1EsUUFBQUEsUUFBUSxFQUFFUjtBQUY4QixPQUF6QixDQUFuQjtBQUlBSixNQUFBQSxLQUFLLGdCQUFJO0FBQUssUUFBQSxTQUFTLEVBQUVPO0FBQWhCLHNCQUNMLGdDQUFLTCxLQUFMLEVBQVlNLGNBQVosQ0FESyxlQUVMO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUFnQ3pCLEtBQUssQ0FBQzhCLGFBQU4sQ0FBb0JSLFNBQXBCLEVBQStCSSxVQUEvQixDQUFoQyxDQUZLLENBQVQ7QUFJSDs7QUFFRCxVQUFNSyxnQkFBZ0IsR0FBRyx5QkFBVyxtQkFBWCxFQUFnQztBQUNyRCxtQ0FBNkJmO0FBRHdCLEtBQWhDLENBQXpCO0FBSUEsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBRWUsZ0JBQWhCO0FBQWtDLE1BQUEsSUFBSSxFQUFDO0FBQXZDLE9BQ0tkLEtBREwsQ0FESjtBQUtIOztBQXBEdUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTksIDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBUb2FzdFN0b3JlIGZyb20gXCIuLi8uLi9zdG9yZXMvVG9hc3RTdG9yZVwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9hc3RDb250YWluZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge3RvYXN0czogVG9hc3RTdG9yZS5zaGFyZWRJbnN0YW5jZSgpLmdldFRvYXN0cygpfTtcblxuICAgICAgICAvLyBTdGFydCBsaXN0ZW5pbmcgaGVyZSByYXRoZXIgdGhhbiBpbiBjb21wb25lbnREaWRNb3VudCBiZWNhdXNlXG4gICAgICAgIC8vIHRvYXN0cyBtYXkgZGlzbWlzcyB0aGVtc2VsdmVzIGluIHRoZWlyIGRpZE1vdW50IGlmIHRoZXkgZmluZFxuICAgICAgICAvLyB0aGV5J3JlIGFscmVhZHkgaXJyZWxldmFudCBieSB0aGUgdGltZSB0aGV5J3JlIG1vdW50ZWQsIGFuZFxuICAgICAgICAvLyBvdXIgb3duIGNvbXBvbmVudERpZE1vdW50IGlzIHRvbyBsYXRlLlxuICAgICAgICBUb2FzdFN0b3JlLnNoYXJlZEluc3RhbmNlKCkub24oJ3VwZGF0ZScsIHRoaXMuX29uVG9hc3RTdG9yZVVwZGF0ZSk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5yZW1vdmVMaXN0ZW5lcigndXBkYXRlJywgdGhpcy5fb25Ub2FzdFN0b3JlVXBkYXRlKTtcbiAgICB9XG5cbiAgICBfb25Ub2FzdFN0b3JlVXBkYXRlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt0b2FzdHM6IFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5nZXRUb2FzdHMoKX0pO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSB0aGlzLnN0YXRlLnRvYXN0cy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGlzU3RhY2tlZCA9IHRvdGFsQ291bnQgPiAxO1xuICAgICAgICBsZXQgdG9hc3Q7XG4gICAgICAgIGlmICh0b3RhbENvdW50ICE9PSAwKSB7XG4gICAgICAgICAgICBjb25zdCB0b3BUb2FzdCA9IHRoaXMuc3RhdGUudG9hc3RzWzBdO1xuICAgICAgICAgICAgY29uc3Qge3RpdGxlLCBpY29uLCBrZXksIGNvbXBvbmVudCwgcHJvcHN9ID0gdG9wVG9hc3Q7XG4gICAgICAgICAgICBjb25zdCB0b2FzdENsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfVG9hc3RfdG9hc3RcIiwge1xuICAgICAgICAgICAgICAgIFwibXhfVG9hc3RfaGFzSWNvblwiOiBpY29uLFxuICAgICAgICAgICAgICAgIFtgbXhfVG9hc3RfaWNvbl8ke2ljb259YF06IGljb24sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50SW5kaWNhdG9yID0gaXNTdGFja2VkID8gX3QoXCIgKDEvJSh0b3RhbENvdW50KXMpXCIsIHt0b3RhbENvdW50fSkgOiBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCB0b2FzdFByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgcHJvcHMsIHtcbiAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgdG9hc3RLZXk6IGtleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdG9hc3QgPSAoPGRpdiBjbGFzc05hbWU9e3RvYXN0Q2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgPGgyPnt0aXRsZX17Y291bnRJbmRpY2F0b3J9PC9oMj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1RvYXN0X2JvZHlcIj57UmVhY3QuY3JlYXRlRWxlbWVudChjb21wb25lbnQsIHRvYXN0UHJvcHMpfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRhaW5lckNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfVG9hc3RDb250YWluZXJcIiwge1xuICAgICAgICAgICAgXCJteF9Ub2FzdENvbnRhaW5lcl9zdGFja2VkXCI6IGlzU3RhY2tlZCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjb250YWluZXJDbGFzc2VzfSByb2xlPVwiYWxlcnRcIj5cbiAgICAgICAgICAgICAgICB7dG9hc3R9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=