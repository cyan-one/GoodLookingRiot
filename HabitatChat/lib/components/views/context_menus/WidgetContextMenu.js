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

var _ContextMenu = require("../../structures/ContextMenu");

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
class WidgetContextMenu extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onEditClicked", () => {
      this.proxyClick(this.props.onEditClicked);
    });
    (0, _defineProperty2.default)(this, "onReloadClicked", () => {
      this.proxyClick(this.props.onReloadClicked);
    });
    (0, _defineProperty2.default)(this, "onSnapshotClicked", () => {
      this.proxyClick(this.props.onSnapshotClicked);
    });
    (0, _defineProperty2.default)(this, "onDeleteClicked", () => {
      this.proxyClick(this.props.onDeleteClicked);
    });
    (0, _defineProperty2.default)(this, "onRevokeClicked", () => {
      this.proxyClick(this.props.onRevokeClicked);
    });
  }

  proxyClick(fn) {
    fn();
    if (this.props.onFinished) this.props.onFinished();
  } // XXX: It's annoying that our context menus require us to hit onFinished() to close :(


  render() {
    const options = [];

    if (this.props.onEditClicked) {
      options.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_WidgetContextMenu_option",
        onClick: this.onEditClicked,
        key: "edit"
      }, (0, _languageHandler._t)("Edit")));
    }

    if (this.props.onReloadClicked) {
      options.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_WidgetContextMenu_option",
        onClick: this.onReloadClicked,
        key: "reload"
      }, (0, _languageHandler._t)("Reload")));
    }

    if (this.props.onSnapshotClicked) {
      options.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_WidgetContextMenu_option",
        onClick: this.onSnapshotClicked,
        key: "snap"
      }, (0, _languageHandler._t)("Take picture")));
    }

    if (this.props.onDeleteClicked) {
      options.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
        className: "mx_WidgetContextMenu_option",
        onClick: this.onDeleteClicked,
        key: "delete"
      }, (0, _languageHandler._t)("Remove for everyone")));
    } // Push this last so it appears last. It's always present.


    options.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_WidgetContextMenu_option",
      onClick: this.onRevokeClicked,
      key: "revoke"
    }, (0, _languageHandler._t)("Remove for me"))); // Put separators between the options

    if (options.length > 1) {
      const length = options.length;

      for (let i = 0; i < length - 1; i++) {
        const sep = /*#__PURE__*/_react.default.createElement("hr", {
          key: i,
          className: "mx_WidgetContextMenu_separator"
        }); // Insert backwards so the insertions don't affect our math on where to place them.
        // We also use our cached length to avoid worrying about options.length changing


        options.splice(length - 1 - i, 0, sep);
      }
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_WidgetContextMenu"
    }, options);
  }

}

exports.default = WidgetContextMenu;
(0, _defineProperty2.default)(WidgetContextMenu, "propTypes", {
  onFinished: _propTypes.default.func,
  // Callback for when the revoke button is clicked. Required.
  onRevokeClicked: _propTypes.default.func.isRequired,
  // Callback for when the snapshot button is clicked. Button not shown
  // without a callback.
  onSnapshotClicked: _propTypes.default.func,
  // Callback for when the reload button is clicked. Button not shown
  // without a callback.
  onReloadClicked: _propTypes.default.func,
  // Callback for when the edit button is clicked. Button not shown
  // without a callback.
  onEditClicked: _propTypes.default.func,
  // Callback for when the delete button is clicked. Button not shown
  // without a callback.
  onDeleteClicked: _propTypes.default.func
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvV2lkZ2V0Q29udGV4dE1lbnUuanMiXSwibmFtZXMiOlsiV2lkZ2V0Q29udGV4dE1lbnUiLCJSZWFjdCIsIkNvbXBvbmVudCIsInByb3h5Q2xpY2siLCJwcm9wcyIsIm9uRWRpdENsaWNrZWQiLCJvblJlbG9hZENsaWNrZWQiLCJvblNuYXBzaG90Q2xpY2tlZCIsIm9uRGVsZXRlQ2xpY2tlZCIsIm9uUmV2b2tlQ2xpY2tlZCIsImZuIiwib25GaW5pc2hlZCIsInJlbmRlciIsIm9wdGlvbnMiLCJwdXNoIiwibGVuZ3RoIiwiaSIsInNlcCIsInNwbGljZSIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQSxpQkFBTixTQUFnQ0MsZUFBTUMsU0FBdEMsQ0FBZ0Q7QUFBQTtBQUFBO0FBQUEseURBK0IzQyxNQUFNO0FBQ2xCLFdBQUtDLFVBQUwsQ0FBZ0IsS0FBS0MsS0FBTCxDQUFXQyxhQUEzQjtBQUNILEtBakMwRDtBQUFBLDJEQW1DekMsTUFBTTtBQUNwQixXQUFLRixVQUFMLENBQWdCLEtBQUtDLEtBQUwsQ0FBV0UsZUFBM0I7QUFDSCxLQXJDMEQ7QUFBQSw2REF1Q3ZDLE1BQU07QUFDdEIsV0FBS0gsVUFBTCxDQUFnQixLQUFLQyxLQUFMLENBQVdHLGlCQUEzQjtBQUNILEtBekMwRDtBQUFBLDJEQTJDekMsTUFBTTtBQUNwQixXQUFLSixVQUFMLENBQWdCLEtBQUtDLEtBQUwsQ0FBV0ksZUFBM0I7QUFDSCxLQTdDMEQ7QUFBQSwyREErQ3pDLE1BQU07QUFDcEIsV0FBS0wsVUFBTCxDQUFnQixLQUFLQyxLQUFMLENBQVdLLGVBQTNCO0FBQ0gsS0FqRDBEO0FBQUE7O0FBd0IzRE4sRUFBQUEsVUFBVSxDQUFDTyxFQUFELEVB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QWYsRUFBQUEsYUFBYSxFQUFFYyxtQkFBVUMsSUFoQlY7QUFrQmY7QUFDQTtBQUNBWixFQUFBQSxlQUFlLEVBQUVXLG1CQUFVQztBQXBCWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge190fSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtNZW51SXRlbX0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvQ29udGV4dE1lbnVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2lkZ2V0Q29udGV4dE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIENhbGxiYWNrIGZvciB3aGVuIHRoZSByZXZva2UgYnV0dG9uIGlzIGNsaWNrZWQuIFJlcXVpcmVkLlxuICAgICAgICBvblJldm9rZUNsaWNrZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gQ2FsbGJhY2sgZm9yIHdoZW4gdGhlIHNuYXBzaG90IGJ1dHRvbiBpcyBjbGlja2VkLiBCdXR0b24gbm90IHNob3duXG4gICAgICAgIC8vIHdpdGhvdXQgYSBjYWxsYmFjay5cbiAgICAgICAgb25TbmFwc2hvdENsaWNrZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIENhbGxiYWNrIGZvciB3aGVuIHRoZSByZWxvYWQgYnV0dG9uIGlzIGNsaWNrZWQuIEJ1dHRvbiBub3Qgc2hvd25cbiAgICAgICAgLy8gd2l0aG91dCBhIGNhbGxiYWNrLlxuICAgICAgICBvblJlbG9hZENsaWNrZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8vIENhbGxiYWNrIGZvciB3aGVuIHRoZSBlZGl0IGJ1dHRvbiBpcyBjbGlja2VkLiBCdXR0b24gbm90IHNob3duXG4gICAgICAgIC8vIHdpdGhvdXQgYSBjYWxsYmFjay5cbiAgICAgICAgb25FZGl0Q2xpY2tlZDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gQ2FsbGJhY2sgZm9yIHdoZW4gdGhlIGRlbGV0ZSBidXR0b24gaXMgY2xpY2tlZC4gQnV0dG9uIG5vdCBzaG93blxuICAgICAgICAvLyB3aXRob3V0IGEgY2FsbGJhY2suXG4gICAgICAgIG9uRGVsZXRlQ2xpY2tlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfTtcblxuICAgIHByb3h5Q2xpY2soZm4pIHtcbiAgICAgICAgZm4oKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25GaW5pc2hlZCkgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgfVxuXG4gICAgLy8gWFhYOiBJdCdzIGFubm95aW5nIHRoYXQgb3VyIGNvbnRleHQgbWVudXMgcmVxdWlyZSB1cyB0byBoaXQgb25GaW5pc2hlZCgpIHRvIGNsb3NlIDooXG5cbiAgICBvbkVkaXRDbGlja2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3h5Q2xpY2sodGhpcy5wcm9wcy5vbkVkaXRDbGlja2VkKTtcbiAgICB9O1xuXG4gICAgb25SZWxvYWRDbGlja2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3h5Q2xpY2sodGhpcy5wcm9wcy5vblJlbG9hZENsaWNrZWQpO1xuICAgIH07XG5cbiAgICBvblNuYXBzaG90Q2xpY2tlZCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm94eUNsaWNrKHRoaXMucHJvcHMub25TbmFwc2hvdENsaWNrZWQpO1xuICAgIH07XG5cbiAgICBvbkRlbGV0ZUNsaWNrZWQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJveHlDbGljayh0aGlzLnByb3BzLm9uRGVsZXRlQ2xpY2tlZCk7XG4gICAgfTtcblxuICAgIG9uUmV2b2tlQ2xpY2tlZCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm94eUNsaWNrKHRoaXMucHJvcHMub25SZXZva2VDbGlja2VkKTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25FZGl0Q2xpY2tlZCkge1xuICAgICAgICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9J214X1dpZGdldENvbnRleHRNZW51X29wdGlvbicgb25DbGljaz17dGhpcy5vbkVkaXRDbGlja2VkfSBrZXk9J2VkaXQnPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJFZGl0XCIpfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uUmVsb2FkQ2xpY2tlZCkge1xuICAgICAgICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9J214X1dpZGdldENvbnRleHRNZW51X29wdGlvbicgb25DbGljaz17dGhpcy5vblJlbG9hZENsaWNrZWR9IGtleT0ncmVsb2FkJz5cbiAgICAgICAgICAgICAgICAgICAge190KFwiUmVsb2FkXCIpfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU25hcHNob3RDbGlja2VkKSB7XG4gICAgICAgICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT0nbXhfV2lkZ2V0Q29udGV4dE1lbnVfb3B0aW9uJyBvbkNsaWNrPXt0aGlzLm9uU25hcHNob3RDbGlja2VkfSBrZXk9J3NuYXAnPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJUYWtlIHBpY3R1cmVcIil9XG4gICAgICAgICAgICAgICAgPC9NZW51SXRlbT4sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25EZWxldGVDbGlja2VkKSB7XG4gICAgICAgICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT0nbXhfV2lkZ2V0Q29udGV4dE1lbnVfb3B0aW9uJyBvbkNsaWNrPXt0aGlzLm9uRGVsZXRlQ2xpY2tlZH0ga2V5PSdkZWxldGUnPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJSZW1vdmUgZm9yIGV2ZXJ5b25lXCIpfVxuICAgICAgICAgICAgICAgIDwvTWVudUl0ZW0+LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFB1c2ggdGhpcyBsYXN0IHNvIGl0IGFwcGVhcnMgbGFzdC4gSXQncyBhbHdheXMgcHJlc2VudC5cbiAgICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICAgICAgPE1lbnVJdGVtIGNsYXNzTmFtZT0nbXhfV2lkZ2V0Q29udGV4dE1lbnVfb3B0aW9uJyBvbkNsaWNrPXt0aGlzLm9uUmV2b2tlQ2xpY2tlZH0ga2V5PSdyZXZva2UnPlxuICAgICAgICAgICAgICAgIHtfdChcIlJlbW92ZSBmb3IgbWVcIil9XG4gICAgICAgICAgICA8L01lbnVJdGVtPixcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBQdXQgc2VwYXJhdG9ycyBiZXR3ZWVuIHRoZSBvcHRpb25zXG4gICAgICAgIGlmIChvcHRpb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IG9wdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZXAgPSA8aHIga2V5PXtpfSBjbGFzc05hbWU9XCJteF9XaWRnZXRDb250ZXh0TWVudV9zZXBhcmF0b3JcIiAvPjtcblxuICAgICAgICAgICAgICAgIC8vIEluc2VydCBiYWNrd2FyZHMgc28gdGhlIGluc2VydGlvbnMgZG9uJ3QgYWZmZWN0IG91ciBtYXRoIG9uIHdoZXJlIHRvIHBsYWNlIHRoZW0uXG4gICAgICAgICAgICAgICAgLy8gV2UgYWxzbyB1c2Ugb3VyIGNhY2hlZCBsZW5ndGggdG8gYXZvaWQgd29ycnlpbmcgYWJvdXQgb3B0aW9ucy5sZW5ndGggY2hhbmdpbmdcbiAgICAgICAgICAgICAgICBvcHRpb25zLnNwbGljZShsZW5ndGggLSAxIC0gaSwgMCwgc2VwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X1dpZGdldENvbnRleHRNZW51XCI+e29wdGlvbnN9PC9kaXY+O1xuICAgIH1cbn1cbiJdfQ==