"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _lodash = require("lodash");

/*
Copyright 2019 New Vector Ltd

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
// Invoke validation from user input (when typing, etc.) at most once every N ms.
const VALIDATION_THROTTLE_MS = 200;
const BASE_ID = "mx_Field";
let count = 1;

function getId() {
  return "".concat(BASE_ID, "_").concat(count++);
}

class Field extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onFocus", ev => {
      this.setState({
        focused: true
      });
      this.validate({
        focused: true
      }); // Parent component may have supplied its own `onFocus` as well

      if (this.props.onFocus) {
        this.props.onFocus(ev);
      }
    });
    (0, _defineProperty2.default)(this, "onChange", ev => {
      this.validateOnChange(); // Parent component may have supplied its own `onChange` as well

      if (this.props.onChange) {
        this.props.onChange(ev);
      }
    });
    (0, _defineProperty2.default)(this, "onBlur", ev => {
      this.setState({
        focused: false
      });
      this.validate({
        focused: false
      }); // Parent component may have supplied its own `onBlur` as well

      if (this.props.onBlur) {
        this.props.onBlur(ev);
      }
    });
    (0, _defineProperty2.default)(this, "validateOnChange", (0, _lodash.debounce)(() => {
      this.validate({
        focused: true
      });
    }, VALIDATION_THROTTLE_MS));
    this.state = {
      valid: undefined,
      feedback: undefined,
      focused: false
    };
    this.id = this.props.id || getId();
  }

  focus() {
    this.input.focus();
  }

  async validate({
    focused,
    allowEmpty = true
  }) {
    if (!this.props.onValidate) {
      return;
    }

    const value = this.input ? this.input.value : null;
    const {
      valid,
      feedback
    } = await this.props.onValidate({
      value,
      focused,
      allowEmpty
    }); // this method is async and so we may have been blurred since the method was called
    // if we have then hide the feedback as withValidation does

    if (this.state.focused && feedback) {
      this.setState({
        valid,
        feedback,
        feedbackVisible: true
      });
    } else {
      // When we receive null `feedback`, we want to hide the tooltip.
      // We leave the previous `feedback` content in state without updating it,
      // so that we can hide the tooltip containing the most recent feedback
      // via CSS animation.
      this.setState({
        valid,
        feedbackVisible: false
      });
    }
  }
  /*
   * This was changed from throttle to debounce: this is more traditional for
   * form validation since it means that the validation doesn't happen at all
   * until the user stops typing for a bit (debounce defaults to not running on
   * the leading edge). If we're doing an HTTP hit on each validation, we have more
   * incentive to prevent validating input that's very unlikely to be valid.
   * We may find that we actually want different behaviour for registration
   * fields, in which case we can add some options to control it.
   */


  render() {
    const _this$props = this.props,
          {
      element,
      prefix,
      postfix,
      className,
      onValidate,
      children,
      tooltipContent,
      flagInvalid,
      tooltipClassName,
      list
    } = _this$props,
          inputProps = (0, _objectWithoutProperties2.default)(_this$props, ["element", "prefix", "postfix", "className", "onValidate", "children", "tooltipContent", "flagInvalid", "tooltipClassName", "list"]);
    const inputElement = element || "input"; // Set some defaults for the <input> element

    inputProps.type = inputProps.type || "text";

    inputProps.ref = input => this.input = input;

    inputProps.placeholder = inputProps.placeholder || inputProps.label;
    inputProps.id = this.id; // this overwrites the id from props

    inputProps.onFocus = this.onFocus;
    inputProps.onChange = this.onChange;
    inputProps.onBlur = this.onBlur;
    inputProps.list = list;

    const fieldInput = _react.default.createElement(inputElement, inputProps, children);

    let prefixContainer = null;

    if (prefix) {
      prefixContainer = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_Field_prefix"
      }, prefix);
    }

    let postfixContainer = null;

    if (postfix) {
      postfixContainer = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_Field_postfix"
      }, postfix);
    }

    const hasValidationFlag = flagInvalid !== null && flagInvalid !== undefined;
    const fieldClasses = (0, _classnames.default)("mx_Field", "mx_Field_".concat(inputElement), className, {
      // If we have a prefix element, leave the label always at the top left and
      // don't animate it, as it looks a bit clunky and would add complexity to do
      // properly.
      mx_Field_labelAlwaysTopLeft: prefix,
      mx_Field_valid: onValidate && this.state.valid === true,
      mx_Field_invalid: hasValidationFlag ? flagInvalid : onValidate && this.state.valid === false
    }); // Handle displaying feedback on validity

    const Tooltip = sdk.getComponent("elements.Tooltip");
    let fieldTooltip;

    if (tooltipContent || this.state.feedback) {
      const addlClassName = tooltipClassName ? tooltipClassName : '';
      fieldTooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        tooltipClassName: "mx_Field_tooltip ".concat(addlClassName),
        visible: this.state.feedbackVisible,
        label: tooltipContent || this.state.feedback
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: fieldClasses
    }, prefixContainer, fieldInput, /*#__PURE__*/_react.default.createElement("label", {
      htmlFor: this.id
    }, this.props.label), postfixContainer, fieldTooltip);
  }

}

exports.default = Field;
(0, _defineProperty2.default)(Field, "propTypes", {
  // The field's ID, which binds the input and label together. Immutable.
  id: _propTypes.default.string,
  // The element to create. Defaults to "input".
  // To define options for a select, use <Field><option ... /></Field>
  element: _propTypes.default.oneOf(["input", "select", "textarea"]),
  // The field's type (when used as an <input>). Defaults to "text".
  type: _propTypes.default.string,
  // id of a <datalist> element for suggestions
  list: _propTypes.default.string,
  // The field's label string.
  label: _propTypes.default.string,
  // The field's placeholder string. Defaults to the label.
  placeholder: _propTypes.default.string,
  // The field's value.
  // This is a controlled component, so the value is required.
  value: _propTypes.default.string.isRequired,
  // Optional component to include inside the field before the input.
  prefix: _propTypes.default.node,
  // Optional component to include inside the field after the input.
  postfix: _propTypes.default.node,
  // The callback called whenever the contents of the field
  // changes.  Returns an object with `valid` boolean field
  // and a `feedback` react component field to provide feedback
  // to the user.
  onValidate: _propTypes.default.func,
  // If specified, overrides the value returned by onValidate.
  flagInvalid: _propTypes.default.bool,
  // If specified, contents will appear as a tooltip on the element and
  // validation feedback tooltips will be suppressed.
  tooltipContent: _propTypes.default.node,
  // If specified alongside tooltipContent, the class name to apply to the
  // tooltip itself.
  tooltipClassName: _propTypes.default.string,
  // If specified, an additional class name to apply to the field container
  className: _propTypes.default.string // All other props pass through to the <input>.

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0ZpZWxkLmpzIl0sIm5hbWVzIjpbIlZBTElEQVRJT05fVEhST1RUTEVfTVMiLCJCQVNFX0lEIiwiY291bnQiLCJnZXRJZCIsIkZpZWxkIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsImV2Iiwic2V0U3RhdGUiLCJmb2N1c2VkIiwidmFsaWRhdGUiLCJvbkZvY3VzIiwidmFsaWRhdGVPbkNoYW5nZSIsIm9uQ2hhbmdlIiwib25CbHVyIiwic3RhdGUiLCJ2YWxpZCIsInVuZGVmaW5lZCIsImZlZWRiYWNrIiwiaWQiLCJmb2N1cyIsImlucHV0IiwiYWxsb3dFbXB0eSIsIm9uVmFsaWRhdGUiLCJ2YWx1ZSIsImZlZWRiYWNrVmlzaWJsZSIsInJlbmRlciIsImVsZW1lbnQiLCJwcmVmaXgiLCJwb3N0Zml4IiwiY2xhc3NOYW1lIiwiY2hpbGRyZW4iLCJ0b29sdGlwQ29udGVudCIsImZsYWdJbnZhbGlkIiwidG9vbHRpcENsYXNzTmFtZSIsImxpc3QiLCJpbnB1dFByb3BzIiwiaW5wdXRFbGVtZW50IiwidHlwZSIsInJlZiIsInBsYWNlaG9sZGVyIiwibGFiZWwiLCJmaWVsZElucHV0IiwiY3JlYXRlRWxlbWVudCIsInByZWZpeENvbnRhaW5lciIsInBvc3RmaXhDb250YWluZXIiLCJoYXNWYWxpZGF0aW9uRmxhZyIsImZpZWxkQ2xhc3NlcyIsIm14X0ZpZWxkX2xhYmVsQWx3YXlzVG9wTGVmdCIsIm14X0ZpZWxkX3ZhbGlkIiwibXhfRmllbGRfaW52YWxpZCIsIlRvb2x0aXAiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJmaWVsZFRvb2x0aXAiLCJhZGRsQ2xhc3NOYW1lIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwib25lT2YiLCJpc1JlcXVpcmVkIiwibm9kZSIsImZ1bmMiLCJib29sIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FB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Q0E5QixFQUFBQSxjQUFjLEVBQUV3QixtQkFBVUksSUE5Qlg7QUErQmY7QUFDQTtBQUNBMUIsRUFBQUEsZ0JBQWdCLEVBQUVzQixtQkFBVUMsTUFqQ2I7QUFrQ2Y7QUFDQTNCLEVBQUFBLFNBQVMsRUFBRTBCLG1CQUFVQyxNQW5DTixDQW9DZjs7QUFwQ2UsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgZGVib3VuY2UgfSBmcm9tICdsb2Rhc2gnO1xuXG4vLyBJbnZva2UgdmFsaWRhdGlvbiBmcm9tIHVzZXIgaW5wdXQgKHdoZW4gdHlwaW5nLCBldGMuKSBhdCBtb3N0IG9uY2UgZXZlcnkgTiBtcy5cbmNvbnN0IFZBTElEQVRJT05fVEhST1RUTEVfTVMgPSAyMDA7XG5cbmNvbnN0IEJBU0VfSUQgPSBcIm14X0ZpZWxkXCI7XG5sZXQgY291bnQgPSAxO1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gICAgcmV0dXJuIGAke0JBU0VfSUR9XyR7Y291bnQrK31gO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWVsZCBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIFRoZSBmaWVsZCdzIElELCB3aGljaCBiaW5kcyB0aGUgaW5wdXQgYW5kIGxhYmVsIHRvZ2V0aGVyLiBJbW11dGFibGUuXG4gICAgICAgIGlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAvLyBUaGUgZWxlbWVudCB0byBjcmVhdGUuIERlZmF1bHRzIHRvIFwiaW5wdXRcIi5cbiAgICAgICAgLy8gVG8gZGVmaW5lIG9wdGlvbnMgZm9yIGEgc2VsZWN0LCB1c2UgPEZpZWxkPjxvcHRpb24gLi4uIC8+PC9GaWVsZD5cbiAgICAgICAgZWxlbWVudDogUHJvcFR5cGVzLm9uZU9mKFtcImlucHV0XCIsIFwic2VsZWN0XCIsIFwidGV4dGFyZWFcIl0pLFxuICAgICAgICAvLyBUaGUgZmllbGQncyB0eXBlICh3aGVuIHVzZWQgYXMgYW4gPGlucHV0PikuIERlZmF1bHRzIHRvIFwidGV4dFwiLlxuICAgICAgICB0eXBlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAvLyBpZCBvZiBhIDxkYXRhbGlzdD4gZWxlbWVudCBmb3Igc3VnZ2VzdGlvbnNcbiAgICAgICAgbGlzdDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gVGhlIGZpZWxkJ3MgbGFiZWwgc3RyaW5nLlxuICAgICAgICBsYWJlbDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gVGhlIGZpZWxkJ3MgcGxhY2Vob2xkZXIgc3RyaW5nLiBEZWZhdWx0cyB0byB0aGUgbGFiZWwuXG4gICAgICAgIHBsYWNlaG9sZGVyOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAvLyBUaGUgZmllbGQncyB2YWx1ZS5cbiAgICAgICAgLy8gVGhpcyBpcyBhIGNvbnRyb2xsZWQgY29tcG9uZW50LCBzbyB0aGUgdmFsdWUgaXMgcmVxdWlyZWQuXG4gICAgICAgIHZhbHVlOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIC8vIE9wdGlvbmFsIGNvbXBvbmVudCB0byBpbmNsdWRlIGluc2lkZSB0aGUgZmllbGQgYmVmb3JlIHRoZSBpbnB1dC5cbiAgICAgICAgcHJlZml4OiBQcm9wVHlwZXMubm9kZSxcbiAgICAgICAgLy8gT3B0aW9uYWwgY29tcG9uZW50IHRvIGluY2x1ZGUgaW5zaWRlIHRoZSBmaWVsZCBhZnRlciB0aGUgaW5wdXQuXG4gICAgICAgIHBvc3RmaXg6IFByb3BUeXBlcy5ub2RlLFxuICAgICAgICAvLyBUaGUgY2FsbGJhY2sgY2FsbGVkIHdoZW5ldmVyIHRoZSBjb250ZW50cyBvZiB0aGUgZmllbGRcbiAgICAgICAgLy8gY2hhbmdlcy4gIFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHZhbGlkYCBib29sZWFuIGZpZWxkXG4gICAgICAgIC8vIGFuZCBhIGBmZWVkYmFja2AgcmVhY3QgY29tcG9uZW50IGZpZWxkIHRvIHByb3ZpZGUgZmVlZGJhY2tcbiAgICAgICAgLy8gdG8gdGhlIHVzZXIuXG4gICAgICAgIG9uVmFsaWRhdGU6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICAvLyBJZiBzcGVjaWZpZWQsIG92ZXJyaWRlcyB0aGUgdmFsdWUgcmV0dXJuZWQgYnkgb25WYWxpZGF0ZS5cbiAgICAgICAgZmxhZ0ludmFsaWQ6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICAvLyBJZiBzcGVjaWZpZWQsIGNvbnRlbnRzIHdpbGwgYXBwZWFyIGFzIGEgdG9vbHRpcCBvbiB0aGUgZWxlbWVudCBhbmRcbiAgICAgICAgLy8gdmFsaWRhdGlvbiBmZWVkYmFjayB0b29sdGlwcyB3aWxsIGJlIHN1cHByZXNzZWQuXG4gICAgICAgIHRvb2x0aXBDb250ZW50OiBQcm9wVHlwZXMubm9kZSxcbiAgICAgICAgLy8gSWYgc3BlY2lmaWVkIGFsb25nc2lkZSB0b29sdGlwQ29udGVudCwgdGhlIGNsYXNzIG5hbWUgdG8gYXBwbHkgdG8gdGhlXG4gICAgICAgIC8vIHRvb2x0aXAgaXRzZWxmLlxuICAgICAgICB0b29sdGlwQ2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAvLyBJZiBzcGVjaWZpZWQsIGFuIGFkZGl0aW9uYWwgY2xhc3MgbmFtZSB0byBhcHBseSB0byB0aGUgZmllbGQgY29udGFpbmVyXG4gICAgICAgIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gQWxsIG90aGVyIHByb3BzIHBhc3MgdGhyb3VnaCB0byB0aGUgPGlucHV0Pi5cbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdmFsaWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZlZWRiYWNrOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlkID0gdGhpcy5wcm9wcy5pZCB8fCBnZXRJZCgpO1xuICAgIH1cblxuICAgIG9uRm9jdXMgPSAoZXYpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmb2N1c2VkOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZSh7XG4gICAgICAgICAgICBmb2N1c2VkOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gUGFyZW50IGNvbXBvbmVudCBtYXkgaGF2ZSBzdXBwbGllZCBpdHMgb3duIGBvbkZvY3VzYCBhcyB3ZWxsXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRm9jdXMpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25Gb2N1cyhldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25DaGFuZ2UgPSAoZXYpID0+IHtcbiAgICAgICAgdGhpcy52YWxpZGF0ZU9uQ2hhbmdlKCk7XG4gICAgICAgIC8vIFBhcmVudCBjb21wb25lbnQgbWF5IGhhdmUgc3VwcGxpZWQgaXRzIG93biBgb25DaGFuZ2VgIGFzIHdlbGxcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoZXYpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uQmx1ciA9IChldikgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZSh7XG4gICAgICAgICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFBhcmVudCBjb21wb25lbnQgbWF5IGhhdmUgc3VwcGxpZWQgaXRzIG93biBgb25CbHVyYCBhcyB3ZWxsXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQmx1cikge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkJsdXIoZXYpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmlucHV0LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdmFsaWRhdGUoeyBmb2N1c2VkLCBhbGxvd0VtcHR5ID0gdHJ1ZSB9KSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5vblZhbGlkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmlucHV0ID8gdGhpcy5pbnB1dC52YWx1ZSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHsgdmFsaWQsIGZlZWRiYWNrIH0gPSBhd2FpdCB0aGlzLnByb3BzLm9uVmFsaWRhdGUoe1xuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBmb2N1c2VkLFxuICAgICAgICAgICAgYWxsb3dFbXB0eSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhpcyBtZXRob2QgaXMgYXN5bmMgYW5kIHNvIHdlIG1heSBoYXZlIGJlZW4gYmx1cnJlZCBzaW5jZSB0aGUgbWV0aG9kIHdhcyBjYWxsZWRcbiAgICAgICAgLy8gaWYgd2UgaGF2ZSB0aGVuIGhpZGUgdGhlIGZlZWRiYWNrIGFzIHdpdGhWYWxpZGF0aW9uIGRvZXNcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZm9jdXNlZCAmJiBmZWVkYmFjaykge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgdmFsaWQsXG4gICAgICAgICAgICAgICAgZmVlZGJhY2ssXG4gICAgICAgICAgICAgICAgZmVlZGJhY2tWaXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIHJlY2VpdmUgbnVsbCBgZmVlZGJhY2tgLCB3ZSB3YW50IHRvIGhpZGUgdGhlIHRvb2x0aXAuXG4gICAgICAgICAgICAvLyBXZSBsZWF2ZSB0aGUgcHJldmlvdXMgYGZlZWRiYWNrYCBjb250ZW50IGluIHN0YXRlIHdpdGhvdXQgdXBkYXRpbmcgaXQsXG4gICAgICAgICAgICAvLyBzbyB0aGF0IHdlIGNhbiBoaWRlIHRoZSB0b29sdGlwIGNvbnRhaW5pbmcgdGhlIG1vc3QgcmVjZW50IGZlZWRiYWNrXG4gICAgICAgICAgICAvLyB2aWEgQ1NTIGFuaW1hdGlvbi5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHZhbGlkLFxuICAgICAgICAgICAgICAgIGZlZWRiYWNrVmlzaWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qXG4gICAgICogVGhpcyB3YXMgY2hhbmdlZCBmcm9tIHRocm90dGxlIHRvIGRlYm91bmNlOiB0aGlzIGlzIG1vcmUgdHJhZGl0aW9uYWwgZm9yXG4gICAgICogZm9ybSB2YWxpZGF0aW9uIHNpbmNlIGl0IG1lYW5zIHRoYXQgdGhlIHZhbGlkYXRpb24gZG9lc24ndCBoYXBwZW4gYXQgYWxsXG4gICAgICogdW50aWwgdGhlIHVzZXIgc3RvcHMgdHlwaW5nIGZvciBhIGJpdCAoZGVib3VuY2UgZGVmYXVsdHMgdG8gbm90IHJ1bm5pbmcgb25cbiAgICAgKiB0aGUgbGVhZGluZyBlZGdlKS4gSWYgd2UncmUgZG9pbmcgYW4gSFRUUCBoaXQgb24gZWFjaCB2YWxpZGF0aW9uLCB3ZSBoYXZlIG1vcmVcbiAgICAgKiBpbmNlbnRpdmUgdG8gcHJldmVudCB2YWxpZGF0aW5nIGlucHV0IHRoYXQncyB2ZXJ5IHVubGlrZWx5IHRvIGJlIHZhbGlkLlxuICAgICAqIFdlIG1heSBmaW5kIHRoYXQgd2UgYWN0dWFsbHkgd2FudCBkaWZmZXJlbnQgYmVoYXZpb3VyIGZvciByZWdpc3RyYXRpb25cbiAgICAgKiBmaWVsZHMsIGluIHdoaWNoIGNhc2Ugd2UgY2FuIGFkZCBzb21lIG9wdGlvbnMgdG8gY29udHJvbCBpdC5cbiAgICAgKi9cbiAgICB2YWxpZGF0ZU9uQ2hhbmdlID0gZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICB0aGlzLnZhbGlkYXRlKHtcbiAgICAgICAgICAgIGZvY3VzZWQ6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH0sIFZBTElEQVRJT05fVEhST1RUTEVfTVMpO1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBlbGVtZW50LCBwcmVmaXgsIHBvc3RmaXgsIGNsYXNzTmFtZSwgb25WYWxpZGF0ZSwgY2hpbGRyZW4sXG4gICAgICAgICAgICB0b29sdGlwQ29udGVudCwgZmxhZ0ludmFsaWQsIHRvb2x0aXBDbGFzc05hbWUsIGxpc3QsIC4uLmlucHV0UHJvcHN9ID0gdGhpcy5wcm9wcztcblxuICAgICAgICBjb25zdCBpbnB1dEVsZW1lbnQgPSBlbGVtZW50IHx8IFwiaW5wdXRcIjtcblxuICAgICAgICAvLyBTZXQgc29tZSBkZWZhdWx0cyBmb3IgdGhlIDxpbnB1dD4gZWxlbWVudFxuICAgICAgICBpbnB1dFByb3BzLnR5cGUgPSBpbnB1dFByb3BzLnR5cGUgfHwgXCJ0ZXh0XCI7XG4gICAgICAgIGlucHV0UHJvcHMucmVmID0gaW5wdXQgPT4gdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgICAgICBpbnB1dFByb3BzLnBsYWNlaG9sZGVyID0gaW5wdXRQcm9wcy5wbGFjZWhvbGRlciB8fCBpbnB1dFByb3BzLmxhYmVsO1xuICAgICAgICBpbnB1dFByb3BzLmlkID0gdGhpcy5pZDsgLy8gdGhpcyBvdmVyd3JpdGVzIHRoZSBpZCBmcm9tIHByb3BzXG5cbiAgICAgICAgaW5wdXRQcm9wcy5vbkZvY3VzID0gdGhpcy5vbkZvY3VzO1xuICAgICAgICBpbnB1dFByb3BzLm9uQ2hhbmdlID0gdGhpcy5vbkNoYW5nZTtcbiAgICAgICAgaW5wdXRQcm9wcy5vbkJsdXIgPSB0aGlzLm9uQmx1cjtcbiAgICAgICAgaW5wdXRQcm9wcy5saXN0ID0gbGlzdDtcblxuICAgICAgICBjb25zdCBmaWVsZElucHV0ID0gUmVhY3QuY3JlYXRlRWxlbWVudChpbnB1dEVsZW1lbnQsIGlucHV0UHJvcHMsIGNoaWxkcmVuKTtcblxuICAgICAgICBsZXQgcHJlZml4Q29udGFpbmVyID0gbnVsbDtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgICAgcHJlZml4Q29udGFpbmVyID0gPHNwYW4gY2xhc3NOYW1lPVwibXhfRmllbGRfcHJlZml4XCI+e3ByZWZpeH08L3NwYW4+O1xuICAgICAgICB9XG4gICAgICAgIGxldCBwb3N0Zml4Q29udGFpbmVyID0gbnVsbDtcbiAgICAgICAgaWYgKHBvc3RmaXgpIHtcbiAgICAgICAgICAgIHBvc3RmaXhDb250YWluZXIgPSA8c3BhbiBjbGFzc05hbWU9XCJteF9GaWVsZF9wb3N0Zml4XCI+e3Bvc3RmaXh9PC9zcGFuPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc1ZhbGlkYXRpb25GbGFnID0gZmxhZ0ludmFsaWQgIT09IG51bGwgJiYgZmxhZ0ludmFsaWQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgZmllbGRDbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X0ZpZWxkXCIsIGBteF9GaWVsZF8ke2lucHV0RWxlbWVudH1gLCBjbGFzc05hbWUsIHtcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBwcmVmaXggZWxlbWVudCwgbGVhdmUgdGhlIGxhYmVsIGFsd2F5cyBhdCB0aGUgdG9wIGxlZnQgYW5kXG4gICAgICAgICAgICAvLyBkb24ndCBhbmltYXRlIGl0LCBhcyBpdCBsb29rcyBhIGJpdCBjbHVua3kgYW5kIHdvdWxkIGFkZCBjb21wbGV4aXR5IHRvIGRvXG4gICAgICAgICAgICAvLyBwcm9wZXJseS5cbiAgICAgICAgICAgIG14X0ZpZWxkX2xhYmVsQWx3YXlzVG9wTGVmdDogcHJlZml4LFxuICAgICAgICAgICAgbXhfRmllbGRfdmFsaWQ6IG9uVmFsaWRhdGUgJiYgdGhpcy5zdGF0ZS52YWxpZCA9PT0gdHJ1ZSxcbiAgICAgICAgICAgIG14X0ZpZWxkX2ludmFsaWQ6IGhhc1ZhbGlkYXRpb25GbGFnXG4gICAgICAgICAgICAgICAgPyBmbGFnSW52YWxpZFxuICAgICAgICAgICAgICAgIDogb25WYWxpZGF0ZSAmJiB0aGlzLnN0YXRlLnZhbGlkID09PSBmYWxzZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGRpc3BsYXlpbmcgZmVlZGJhY2sgb24gdmFsaWRpdHlcbiAgICAgICAgY29uc3QgVG9vbHRpcCA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5Ub29sdGlwXCIpO1xuICAgICAgICBsZXQgZmllbGRUb29sdGlwO1xuICAgICAgICBpZiAodG9vbHRpcENvbnRlbnQgfHwgdGhpcy5zdGF0ZS5mZWVkYmFjaykge1xuICAgICAgICAgICAgY29uc3QgYWRkbENsYXNzTmFtZSA9IHRvb2x0aXBDbGFzc05hbWUgPyB0b29sdGlwQ2xhc3NOYW1lIDogJyc7XG4gICAgICAgICAgICBmaWVsZFRvb2x0aXAgPSA8VG9vbHRpcFxuICAgICAgICAgICAgICAgIHRvb2x0aXBDbGFzc05hbWU9e2BteF9GaWVsZF90b29sdGlwICR7YWRkbENsYXNzTmFtZX1gfVxuICAgICAgICAgICAgICAgIHZpc2libGU9e3RoaXMuc3RhdGUuZmVlZGJhY2tWaXNpYmxlfVxuICAgICAgICAgICAgICAgIGxhYmVsPXt0b29sdGlwQ29udGVudCB8fCB0aGlzLnN0YXRlLmZlZWRiYWNrfVxuICAgICAgICAgICAgLz47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e2ZpZWxkQ2xhc3Nlc30+XG4gICAgICAgICAgICB7cHJlZml4Q29udGFpbmVyfVxuICAgICAgICAgICAge2ZpZWxkSW5wdXR9XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17dGhpcy5pZH0+e3RoaXMucHJvcHMubGFiZWx9PC9sYWJlbD5cbiAgICAgICAgICAgIHtwb3N0Zml4Q29udGFpbmVyfVxuICAgICAgICAgICAge2ZpZWxkVG9vbHRpcH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cbiJdfQ==