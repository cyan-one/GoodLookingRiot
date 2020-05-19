"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard3(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _Validation = _interopRequireDefault(require("../elements/Validation"));

var _languageHandler = require("../../../languageHandler");

var _Field = _interopRequireDefault(require("../elements/Field"));

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
class PassphraseField extends _react.PureComponent
/*:: <IProps, IState>*/
{
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "state", {
      complexity: null
    });
    (0, _defineProperty2.default)(this, "validate", (0, _Validation.default)({
      description: function () {
        const complexity = this.state.complexity;
        const score = complexity ? complexity.score : 0;
        return /*#__PURE__*/_react.default.createElement("progress", {
          className: "mx_PassphraseField_progress",
          max: 4,
          value: score
        });
      },
      rules: [{
        key: "required",
        test: ({
          value,
          allowEmpty
        }) => allowEmpty || !!value,
        invalid: () => (0, _languageHandler._t)(this.props.labelEnterPassword)
      }, {
        key: "complexity",
        test: async function ({
          value
        }) {
          if (!value) {
            return false;
          }

          const {
            scorePassword
          } = await Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../utils/PasswordScorer')));
          const complexity = scorePassword(value);
          this.setState({
            complexity
          });
          const safe = complexity.score >= this.props.minScore;

          const allowUnsafe = _SdkConfig.default.get()["dangerously_allow_unsafe_and_insecure_passwords"];

          return allowUnsafe || safe;
        },
        valid: function () {
          // Unsafe passwords that are valid are only possible through a
          // configuration flag. We'll print some helper text to signal
          // to the user that their password is allowed, but unsafe.
          if (this.state.complexity.score >= this.props.minScore) {
            return (0, _languageHandler._t)(this.props.labelStrongPassword);
          }

          return (0, _languageHandler._t)(this.props.labelAllowedButUnsafe);
        },
        invalid: function () {
          const complexity = this.state.complexity;

          if (!complexity) {
            return null;
          }

          const {
            feedback
          } = complexity;
          return feedback.warning || feedback.suggestions[0] || (0, _languageHandler._t)("Keep going...");
        }
      }]
    }));
    (0, _defineProperty2.default)(this, "onValidate", async (fieldState
    /*: IFieldState*/
    ) => {
      const result = await this.validate(fieldState);
      this.props.onValidate(result);
      return result;
    });
  }

  render() {
    return /*#__PURE__*/_react.default.createElement(_Field.default, {
      id: this.props.id,
      autoFocus: this.props.autoFocus,
      className: (0, _classnames.default)("mx_PassphraseField", this.props.className),
      ref: this.props.fieldRef,
      type: "password",
      autoComplete: "new-password",
      label: (0, _languageHandler._t)(this.props.label),
      value: this.props.value,
      onChange: this.props.onChange,
      onValidate: this.onValidate
    });
  }

}

(0, _defineProperty2.default)(PassphraseField, "defaultProps", {
  label: (0, _languageHandler._td)("Password"),
  labelEnterPassword: (0, _languageHandler._td)("Enter password"),
  labelStrongPassword: (0, _languageHandler._td)("Nice, strong password!"),
  labelAllowedButUnsafe: (0, _languageHandler._td)("Password is allowed, but unsafe")
});
var _default = PassphraseField;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvUGFzc3BocmFzZUZpZWxkLnRzeCJdLCJuYW1lcyI6WyJQYXNzcGhyYXNlRmllbGQiLCJQdXJlQ29tcG9uZW50IiwiY29tcGxleGl0eSIsImRlc2NyaXB0aW9uIiwic3RhdGUiLCJzY29yZSIsInJ1bGVzIiwia2V5IiwidGVzdCIsInZhbHVlIiwiYWxsb3dFbXB0eSIsImludmFsaWQiLCJwcm9wcyIsImxhYmVsRW50ZXJQYXNzd29yZCIsInNjb3JlUGFzc3dvcmQiLCJzZXRTdGF0ZSIsInNhZmUiLCJtaW5TY29yZSIsImFsbG93VW5zYWZlIiwiU2RrQ29uZmlnIiwiZ2V0IiwidmFsaWQiLCJsYWJlbFN0cm9uZ1Bhc3N3b3JkIiwibGFiZWxBbGxvd2VkQnV0VW5zYWZlIiwiZmVlZGJhY2siLCJ3YXJuaW5nIiwic3VnZ2VzdGlvbnMiLCJmaWVsZFN0YXRlIiwicmVzdWx0IiwidmFsaWRhdGUiLCJvblZhbGlkYXRlIiwicmVuZGVyIiwiaWQiLCJhdXRvRm9jdXMiLCJjbGFzc05hbWUiLCJmaWVsZFJlZiIsImxhYmVsIiwib25DaGFuZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF2QkE7Ozs7Ozs7Ozs7Ozs7OztBQThDQSxNQUFNQSxlQUFOLFNBQThCQztBQUE5QjtBQUE0RDtBQUFBO0FBQUE7QUFBQSxpREFRaEQ7QUFBRUMsTUFBQUEsVUFBVSxFQUFFO0FBQWQsS0FSZ0Q7QUFBQSxvREFVN0IseUJBQXFCO0FBQzVDQyxNQUFBQSxXQUFXLEVBQUUsWUFBVztBQUNwQixjQUFNRCxVQUFVLEdBQUcsS0FBS0UsS0FBTCxDQUFXRixVQUE5QjtBQUNBLGNBQU1HLEtBQUssR0FBR0gsVUFBVSxHQUFHQSxVQUFVLENBQUNHLEtBQWQsR0FBc0IsQ0FBOUM7QUFDQSw0QkFBTztBQUFVLFVBQUEsU0FBUyxFQUFDLDZCQUFwQjtB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S0FBTCxDQUFXSCxLQVJmO0FBU0gsTUFBQSxRQUFRLEVBQUUsS0FBS0csS0FBTCxDQUFXeUIsUUFUbEI7QUFVSCxNQUFBLFVBQVUsRUFBRSxLQUFLUDtBQVZkLE1BQVA7QUFZSDs7QUEzRXVEOzs4QkFBdEQ5QixlLGtCQUNvQjtBQUNsQm9DLEVBQUFBLEtBQUssRUFBRSwwQkFBSSxVQUFKLENBRFc7QUFFbEJ2QixFQUFBQSxrQkFBa0IsRUFBRSwwQkFBSSxnQkFBSixDQUZGO0FBR2xCUyxFQUFBQSxtQkFBbUIsRUFBRSwwQkFBSSx3QkFBSixDQUhIO0FBSWxCQyxFQUFBQSxxQkFBcUIsRUFBRSwwQkFBSSxpQ0FBSjtBQUpMLEM7ZUE2RVh2QixlIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7UHVyZUNvbXBvbmVudCwgUmVmQ2FsbGJhY2ssIFJlZk9iamVjdH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHp4Y3ZibiBmcm9tIFwienhjdmJuXCI7XG5cbmltcG9ydCBTZGtDb25maWcgZnJvbSBcIi4uLy4uLy4uL1Nka0NvbmZpZ1wiO1xuaW1wb3J0IHdpdGhWYWxpZGF0aW9uLCB7SUZpZWxkU3RhdGUsIElWYWxpZGF0aW9uUmVzdWx0fSBmcm9tIFwiLi4vZWxlbWVudHMvVmFsaWRhdGlvblwiO1xuaW1wb3J0IHtfdCwgX3RkfSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQgRmllbGQgZnJvbSBcIi4uL2VsZW1lbnRzL0ZpZWxkXCI7XG5cbmludGVyZmFjZSBJUHJvcHMge1xuICAgIGF1dG9Gb2N1cz86IGJvb2xlYW47XG4gICAgaWQ/OiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICAgIG1pblNjb3JlOiAwIHwgMSB8IDIgfCAzIHwgNDtcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGZpZWxkUmVmPzogUmVmQ2FsbGJhY2s8RmllbGQ+IHwgUmVmT2JqZWN0PEZpZWxkPjtcblxuICAgIGxhYmVsPzogc3RyaW5nO1xuICAgIGxhYmVsRW50ZXJQYXNzd29yZD86IHN0cmluZztcbiAgICBsYWJlbFN0cm9uZ1Bhc3N3b3JkPzogc3RyaW5nO1xuICAgIGxhYmVsQWxsb3dlZEJ1dFVuc2FmZT86IHN0cmluZztcblxuICAgIG9uQ2hhbmdlKGV2OiBLZXlib2FyZEV2ZW50KTtcbiAgICBvblZhbGlkYXRlKHJlc3VsdDogSVZhbGlkYXRpb25SZXN1bHQpO1xufVxuXG5pbnRlcmZhY2UgSVN0YXRlIHtcbiAgICBjb21wbGV4aXR5OiB6eGN2Ym4uWlhDVkJOUmVzdWx0O1xufVxuXG5jbGFzcyBQYXNzcGhyYXNlRmllbGQgZXh0ZW5kcyBQdXJlQ29tcG9uZW50PElQcm9wcywgSVN0YXRlPiB7XG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgbGFiZWw6IF90ZChcIlBhc3N3b3JkXCIpLFxuICAgICAgICBsYWJlbEVudGVyUGFzc3dvcmQ6IF90ZChcIkVudGVyIHBhc3N3b3JkXCIpLFxuICAgICAgICBsYWJlbFN0cm9uZ1Bhc3N3b3JkOiBfdGQoXCJOaWNlLCBzdHJvbmcgcGFzc3dvcmQhXCIpLFxuICAgICAgICBsYWJlbEFsbG93ZWRCdXRVbnNhZmU6IF90ZChcIlBhc3N3b3JkIGlzIGFsbG93ZWQsIGJ1dCB1bnNhZmVcIiksXG4gICAgfTtcblxuICAgIHN0YXRlID0geyBjb21wbGV4aXR5OiBudWxsIH07XG5cbiAgICBwdWJsaWMgcmVhZG9ubHkgdmFsaWRhdGUgPSB3aXRoVmFsaWRhdGlvbjx0aGlzPih7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBsZXhpdHkgPSB0aGlzLnN0YXRlLmNvbXBsZXhpdHk7XG4gICAgICAgICAgICBjb25zdCBzY29yZSA9IGNvbXBsZXhpdHkgPyBjb21wbGV4aXR5LnNjb3JlIDogMDtcbiAgICAgICAgICAgIHJldHVybiA8cHJvZ3Jlc3MgY2xhc3NOYW1lPVwibXhfUGFzc3BocmFzZUZpZWxkX3Byb2dyZXNzXCIgbWF4PXs0fSB2YWx1ZT17c2NvcmV9IC8+O1xuICAgICAgICB9LFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogXCJyZXF1aXJlZFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6ICh7IHZhbHVlLCBhbGxvd0VtcHR5IH0pID0+IGFsbG93RW1wdHkgfHwgISF2YWx1ZSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdCh0aGlzLnByb3BzLmxhYmVsRW50ZXJQYXNzd29yZCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogXCJjb21wbGV4aXR5XCIsXG4gICAgICAgICAgICAgICAgdGVzdDogYXN5bmMgZnVuY3Rpb24oeyB2YWx1ZSB9KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHNjb3JlUGFzc3dvcmQgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vLi4vdXRpbHMvUGFzc3dvcmRTY29yZXInKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcGxleGl0eSA9IHNjb3JlUGFzc3dvcmQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgY29tcGxleGl0eSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2FmZSA9IGNvbXBsZXhpdHkuc2NvcmUgPj0gdGhpcy5wcm9wcy5taW5TY29yZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxsb3dVbnNhZmUgPSBTZGtDb25maWcuZ2V0KClbXCJkYW5nZXJvdXNseV9hbGxvd191bnNhZmVfYW5kX2luc2VjdXJlX3Bhc3N3b3Jkc1wiXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsbG93VW5zYWZlIHx8IHNhZmU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2YWxpZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuc2FmZSBwYXNzd29yZHMgdGhhdCBhcmUgdmFsaWQgYXJlIG9ubHkgcG9zc2libGUgdGhyb3VnaCBhXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbmZpZ3VyYXRpb24gZmxhZy4gV2UnbGwgcHJpbnQgc29tZSBoZWxwZXIgdGV4dCB0byBzaWduYWxcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gdGhlIHVzZXIgdGhhdCB0aGVpciBwYXNzd29yZCBpcyBhbGxvd2VkLCBidXQgdW5zYWZlLlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV4aXR5LnNjb3JlID49IHRoaXMucHJvcHMubWluU2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCh0aGlzLnByb3BzLmxhYmVsU3Ryb25nUGFzc3dvcmQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdCh0aGlzLnByb3BzLmxhYmVsQWxsb3dlZEJ1dFVuc2FmZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcGxleGl0eSA9IHRoaXMuc3RhdGUuY29tcGxleGl0eTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21wbGV4aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGZlZWRiYWNrIH0gPSBjb21wbGV4aXR5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmVlZGJhY2sud2FybmluZyB8fCBmZWVkYmFjay5zdWdnZXN0aW9uc1swXSB8fCBfdChcIktlZXAgZ29pbmcuLi5cIik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBvblZhbGlkYXRlID0gYXN5bmMgKGZpZWxkU3RhdGU6IElGaWVsZFN0YXRlKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudmFsaWRhdGUoZmllbGRTdGF0ZSk7XG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGF0ZShyZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiA8RmllbGRcbiAgICAgICAgICAgIGlkPXt0aGlzLnByb3BzLmlkfVxuICAgICAgICAgICAgYXV0b0ZvY3VzPXt0aGlzLnByb3BzLmF1dG9Gb2N1c31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcIm14X1Bhc3NwaHJhc2VGaWVsZFwiLCB0aGlzLnByb3BzLmNsYXNzTmFtZSl9XG4gICAgICAgICAgICByZWY9e3RoaXMucHJvcHMuZmllbGRSZWZ9XG4gICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwibmV3LXBhc3N3b3JkXCJcbiAgICAgICAgICAgIGxhYmVsPXtfdCh0aGlzLnByb3BzLmxhYmVsKX1cbiAgICAgICAgICAgIHZhbHVlPXt0aGlzLnByb3BzLnZhbHVlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMucHJvcHMub25DaGFuZ2V9XG4gICAgICAgICAgICBvblZhbGlkYXRlPXt0aGlzLm9uVmFsaWRhdGV9XG4gICAgICAgIC8+XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYXNzcGhyYXNlRmllbGQ7XG4iXX0=