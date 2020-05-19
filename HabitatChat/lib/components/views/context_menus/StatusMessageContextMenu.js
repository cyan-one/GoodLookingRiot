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

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2018 New Vector Ltd

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
class StatusMessageContextMenu extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onStatusMessageCommitted", () => {
      // The `User` object has observed a status message change.
      this.setState({
        message: this.comittedStatusMessage,
        waiting: false
      });
    });
    (0, _defineProperty2.default)(this, "_onClearClick", e => {
      _MatrixClientPeg.MatrixClientPeg.get()._unstable_setStatusMessage("");

      this.setState({
        waiting: true
      });
    });
    (0, _defineProperty2.default)(this, "_onSubmit", e => {
      e.preventDefault();

      _MatrixClientPeg.MatrixClientPeg.get()._unstable_setStatusMessage(this.state.message);

      this.setState({
        waiting: true
      });
    });
    (0, _defineProperty2.default)(this, "_onStatusChange", e => {
      // The input field's value was changed.
      this.setState({
        message: e.target.value
      });
    });
    this.state = {
      message: this.comittedStatusMessage
    };
  }

  componentDidMount() {
    const {
      user
    } = this.props;

    if (!user) {
      return;
    }

    user.on("User._unstable_statusMessage", this._onStatusMessageCommitted);
  }

  componentWillUnmount() {
    const {
      user
    } = this.props;

    if (!user) {
      return;
    }

    user.removeListener("User._unstable_statusMessage", this._onStatusMessageCommitted);
  }

  get comittedStatusMessage() {
    return this.props.user ? this.props.user._unstable_statusMessage : "";
  }

  render() {
    const Spinner = sdk.getComponent('views.elements.Spinner');
    let actionButton;

    if (this.comittedStatusMessage) {
      if (this.state.message === this.comittedStatusMessage) {
        actionButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_StatusMessageContextMenu_clear",
          onClick: this._onClearClick
        }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Clear status")));
      } else {
        actionButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          className: "mx_StatusMessageContextMenu_submit",
          onClick: this._onSubmit
        }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Update status")));
      }
    } else {
      actionButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        className: "mx_StatusMessageContextMenu_submit",
        disabled: !this.state.message,
        onClick: this._onSubmit
      }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Set status")));
    }

    let spinner = null;

    if (this.state.waiting) {
      spinner = /*#__PURE__*/_react.default.createElement(Spinner, {
        w: "24",
        h: "24"
      });
    }

    const form = /*#__PURE__*/_react.default.createElement("form", {
      className: "mx_StatusMessageContextMenu_form",
      autoComplete: "off",
      onSubmit: this._onSubmit
    }, /*#__PURE__*/_react.default.createElement("input", {
      type: "text",
      className: "mx_StatusMessageContextMenu_message",
      key: "message",
      placeholder: (0, _languageHandler._t)("Set a new status..."),
      autoFocus: true,
      maxLength: "60",
      value: this.state.message,
      onChange: this._onStatusChange
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_StatusMessageContextMenu_actionContainer"
    }, actionButton, spinner));

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_StatusMessageContextMenu"
    }, form);
  }

}

exports.default = StatusMessageContextMenu;
(0, _defineProperty2.default)(StatusMessageContextMenu, "propTypes", {
  // js-sdk User object. Not required because it might not exist.
  user: _propTypes.default.object
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvU3RhdHVzTWVzc2FnZUNvbnRleHRNZW51LmpzIl0sIm5hbWVzIjpbIlN0YXR1c01lc3NhZ2VDb250ZXh0TWVudSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInNldFN0YXRlIiwibWVzc2FnZSIsImNvbWl0dGVkU3RhdHVzTWVzc2FnZSIsIndhaXRpbmciLCJlIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiX3Vuc3RhYmxlX3NldFN0YXR1c01lc3NhZ2UiLCJwcmV2ZW50RGVmYXVsdCIsInN0YXRlIiwidGFyZ2V0IiwidmFsdWUiLCJjb21wb25lbnREaWRNb3VudCIsInVzZXIiLCJvbiIsIl9vblN0YXR1c01lc3NhZ2VDb21taXR0ZWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiX3Vuc3RhYmxlX3N0YXR1c01lc3NhZ2UiLCJyZW5kZXIiLCJTcGlubmVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiYWN0aW9uQnV0dG9uIiwiX29uQ2xlYXJDbGljayIsIl9vblN1Ym1pdCIsInNwaW5uZXIiLCJmb3JtIiwiX29uU3RhdHVzQ2hhbmdlIiwiUHJvcFR5cGVzIiwib2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUJlLE1BQU1BLHdCQUFOLFNBQXVDQyxlQUFNQyxTQUE3QyxDQUF1RDtBQU1sRUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUscUVBK0JTLE1BQU07QUFDOUI7QUFDQSxXQUFLQyxRQUFMLENBQWM7QUFDVkMsUUFBQUEsT0FBTyxFQUFFLEtBQUtDLHFCQURKO0FBRVZDLFFBQUFBLE9BQU8sRUFBRTtBQUZDLE9BQWQ7QUFJSCxLQXJDa0I7QUFB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LElBQUksZ0JBQUc7QUFBTSxNQUFBLFNBQVMsRUFBQyxrQ0FBaEI7QUFDVCxNQUFBLFlBQVksRUFBQyxLQURKO0FBQ1UsTUFBQSxRQUFRLEVBQUUsS0FBS0Y7QUFEekIsb0JBR1Q7QUFBTyxNQUFBLElBQUksRUFBQyxNQUFaO0FBQW1CLE1BQUEsU0FBUyxFQUFDLHFDQUE3QjtBQUNJLE1BQUEsR0FBRyxFQUFDLFNBRFI7QUFDa0IsTUFBQSxXQUFXLEVBQUUseUJBQUcscUJBQUgsQ0FEL0I7QUFFSSxNQUFBLFNBQVMsRUFBRSxJQUZmO0FBRXFCLE1BQUEsU0FBUyxFQUFDLElBRi9CO0FBRW9DLE1BQUEsS0FBSyxFQUFFLEtBQUtoQixLQUFMLENBQVdSLE9BRnREO0FBR0ksTUFBQSxRQUFRLEVBQUUsS0FBSzJCO0FBSG5CLE1BSFMsZUFRVDtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDS0wsWUFETCxFQUVLRyxPQUZMLENBUlMsQ0FBYjs7QUFjQSx3QkFBTztBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDREMsSUFEQyxDQUFQO0FBR0g7O0FBbkhpRTs7OzhCQUFqRGhDLHdCLGVBQ0U7QUFDZjtBQUNBa0IsRUFBQUEsSUFBSSxFQUFFZ0IsbUJBQVVDO0FBRkQsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YXR1c01lc3NhZ2VDb250ZXh0TWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8ganMtc2RrIFVzZXIgb2JqZWN0LiBOb3QgcmVxdWlyZWQgYmVjYXVzZSBpdCBtaWdodCBub3QgZXhpc3QuXG4gICAgICAgIHVzZXI6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbWVzc2FnZTogdGhpcy5jb21pdHRlZFN0YXR1c01lc3NhZ2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnN0IHsgdXNlciB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdXNlci5vbihcIlVzZXIuX3Vuc3RhYmxlX3N0YXR1c01lc3NhZ2VcIiwgdGhpcy5fb25TdGF0dXNNZXNzYWdlQ29tbWl0dGVkKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY29uc3QgeyB1c2VyIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1c2VyLnJlbW92ZUxpc3RlbmVyKFxuICAgICAgICAgICAgXCJVc2VyLl91bnN0YWJsZV9zdGF0dXNNZXNzYWdlXCIsXG4gICAgICAgICAgICB0aGlzLl9vblN0YXR1c01lc3NhZ2VDb21taXR0ZWQsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbWl0dGVkU3RhdHVzTWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMudXNlciA/IHRoaXMucHJvcHMudXNlci5fdW5zdGFibGVfc3RhdHVzTWVzc2FnZSA6IFwiXCI7XG4gICAgfVxuXG4gICAgX29uU3RhdHVzTWVzc2FnZUNvbW1pdHRlZCA9ICgpID0+IHtcbiAgICAgICAgLy8gVGhlIGBVc2VyYCBvYmplY3QgaGFzIG9ic2VydmVkIGEgc3RhdHVzIG1lc3NhZ2UgY2hhbmdlLlxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuY29taXR0ZWRTdGF0dXNNZXNzYWdlLFxuICAgICAgICAgICAgd2FpdGluZzogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25DbGVhckNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLl91bnN0YWJsZV9zZXRTdGF0dXNNZXNzYWdlKFwiXCIpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHdhaXRpbmc6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25TdWJtaXQgPSAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5fdW5zdGFibGVfc2V0U3RhdHVzTWVzc2FnZSh0aGlzLnN0YXRlLm1lc3NhZ2UpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHdhaXRpbmc6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25TdGF0dXNDaGFuZ2UgPSAoZSkgPT4ge1xuICAgICAgICAvLyBUaGUgaW5wdXQgZmllbGQncyB2YWx1ZSB3YXMgY2hhbmdlZC5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBtZXNzYWdlOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLlNwaW5uZXInKTtcblxuICAgICAgICBsZXQgYWN0aW9uQnV0dG9uO1xuICAgICAgICBpZiAodGhpcy5jb21pdHRlZFN0YXR1c01lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLm1lc3NhZ2UgPT09IHRoaXMuY29taXR0ZWRTdGF0dXNNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uQnV0dG9uID0gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfU3RhdHVzTWVzc2FnZUNvbnRleHRNZW51X2NsZWFyXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25DbGVhckNsaWNrfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e190KFwiQ2xlYXIgc3RhdHVzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhY3Rpb25CdXR0b24gPSA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9TdGF0dXNNZXNzYWdlQ29udGV4dE1lbnVfc3VibWl0XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25TdWJtaXR9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57X3QoXCJVcGRhdGUgc3RhdHVzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN0aW9uQnV0dG9uID0gPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPVwibXhfU3RhdHVzTWVzc2FnZUNvbnRleHRNZW51X3N1Ym1pdFwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF0aGlzLnN0YXRlLm1lc3NhZ2V9IG9uQ2xpY2s9e3RoaXMuX29uU3VibWl0fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuPntfdChcIlNldCBzdGF0dXNcIil9PC9zcGFuPlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzcGlubmVyID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUud2FpdGluZykge1xuICAgICAgICAgICAgc3Bpbm5lciA9IDxTcGlubmVyIHc9XCIyNFwiIGg9XCIyNFwiIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9ybSA9IDxmb3JtIGNsYXNzTmFtZT1cIm14X1N0YXR1c01lc3NhZ2VDb250ZXh0TWVudV9mb3JtXCJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiIG9uU3VibWl0PXt0aGlzLl9vblN1Ym1pdH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwibXhfU3RhdHVzTWVzc2FnZUNvbnRleHRNZW51X21lc3NhZ2VcIlxuICAgICAgICAgICAgICAgIGtleT1cIm1lc3NhZ2VcIiBwbGFjZWhvbGRlcj17X3QoXCJTZXQgYSBuZXcgc3RhdHVzLi4uXCIpfVxuICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz17dHJ1ZX0gbWF4TGVuZ3RoPVwiNjBcIiB2YWx1ZT17dGhpcy5zdGF0ZS5tZXNzYWdlfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9vblN0YXR1c0NoYW5nZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1N0YXR1c01lc3NhZ2VDb250ZXh0TWVudV9hY3Rpb25Db250YWluZXJcIj5cbiAgICAgICAgICAgICAgICB7YWN0aW9uQnV0dG9ufVxuICAgICAgICAgICAgICAgIHtzcGlubmVyfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZm9ybT47XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfU3RhdHVzTWVzc2FnZUNvbnRleHRNZW51XCI+XG4gICAgICAgICAgICB7IGZvcm0gfVxuICAgICAgICA8L2Rpdj47XG4gICAgfVxufVxuIl19