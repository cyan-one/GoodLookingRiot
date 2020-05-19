"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withValidation;

var _react = _interopRequireDefault(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

/*
Copyright 2019 New Vector Ltd
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

/* eslint-disable babel/no-invalid-this */

/**
 * Creates a validation function from a set of rules describing what to validate.
 * Generic T is the "this" type passed to the rule methods
 *
 * @param {Function} description
 *     Function that returns a string summary of the kind of value that will
 *     meet the validation rules. Shown at the top of the validation feedback.
 * @param {Object} rules
 *     An array of rules describing how to check to input value. Each rule in an object
 *     and may have the following properties:
 *     - `key`: A unique ID for the rule. Required.
 *     - `skip`: A function used to determine whether the rule should even be evaluated.
 *     - `test`: A function used to determine the rule's current validity. Required.
 *     - `valid`: Function returning text to show when the rule is valid. Only shown if set.
 *     - `invalid`: Function returning text to show when the rule is invalid. Only shown if set.
 *     - `final`: A Boolean if true states that this rule will only be considered if all rules before it returned valid.
 * @returns {Function}
 *     A validation function that takes in the current input value and returns
 *     the overall validity and a feedback UI that can be rendered for more detail.
 */
function withValidation
/*:: <T = undefined>*/
({
  description,
  rules
}
/*: IArgs<T>*/
) {
  return async function onValidate({
    value,
    focused,
    allowEmpty = true
  }
  /*: IFieldState*/
  )
  /*: Promise<IValidationResult>*/
  {
    if (!value && allowEmpty) {
      return {
        valid: null,
        feedback: null
      };
    }

    const results = [];
    let valid = true;

    if (rules && rules.length) {
      for (const rule of rules) {
        if (!rule.key || !rule.test) {
          continue;
        }

        if (!valid && rule.final) {
          continue;
        }

        const data = {
          value,
          allowEmpty
        };

        if (rule.skip && rule.skip.call(this, data)) {
          continue;
        } // We're setting `this` to whichever component holds the validation
        // function. That allows rules to access the state of the component.


        const ruleValid = await rule.test.call(this, data);
        valid = valid && ruleValid;

        if (ruleValid && rule.valid) {
          // If the rule's result is valid and has text to show for
          // the valid state, show it.
          const text = rule.valid.call(this);

          if (!text) {
            continue;
          }

          results.push({
            key: rule.key,
            valid: true,
            text
          });
        } else if (!ruleValid && rule.invalid) {
          // If the rule's result is invalid and has text to show for
          // the invalid state, show it.
          const text = rule.invalid.call(this);

          if (!text) {
            continue;
          }

          results.push({
            key: rule.key,
            valid: false,
            text
          });
        }
      }
    } // Hide feedback when not focused


    if (!focused) {
      return {
        valid,
        feedback: null
      };
    }

    let details;

    if (results && results.length) {
      details = /*#__PURE__*/_react.default.createElement("ul", {
        className: "mx_Validation_details"
      }, results.map(result => {
        const classes = (0, _classnames.default)({
          "mx_Validation_detail": true,
          "mx_Validation_valid": result.valid,
          "mx_Validation_invalid": !result.valid
        });
        return /*#__PURE__*/_react.default.createElement("li", {
          key: result.key,
          className: classes
        }, result.text);
      }));
    }

    let summary;

    if (description) {
      // We're setting `this` to whichever component holds the validation
      // function. That allows rules to access the state of the component.
      const content = description.call(this);
      summary = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Validation_description"
      }, content);
    }

    let feedback;

    if (summary || details) {
      feedback = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Validation"
      }, summary, details);
    }

    return {
      valid,
      feedback
    };
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1ZhbGlkYXRpb24udHN4Il0sIm5hbWVzIjpbIndpdGhWYWxpZGF0aW9uIiwiZGVzY3JpcHRpb24iLCJydWxlcyIsIm9uVmFsaWRhdGUiLCJ2YWx1ZSIsImZvY3VzZWQiLCJhbGxvd0VtcHR5IiwidmFsaWQiLCJmZWVkYmFjayIsInJlc3VsdHMiLCJsZW5ndGgiLCJydWxlIiwia2V5IiwidGVzdCIsImZpbmFsIiwiZGF0YSIsInNraXAiLCJjYWxsIiwicnVsZVZhbGlkIiwidGV4dCIsInB1c2giLCJpbnZhbGlkIiwiZGV0YWlscyIsIm1hcCIsInJlc3VsdCIsImNsYXNzZXMiLCJzdW1tYXJ5IiwiY29udGVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBK0JBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CZSxTQUFTQTtBQUFUO0FBQUEsQ0FBdUM7QUFBRUMsRUFBQUEsV0FBRjtBQUFlQyxFQUFBQTtBQUFmO0FBQXZDO0FBQUEsRUFBeUU7QUFDcEYsU0FBTyxlQUFlQyxVQUFmLENBQTBCO0FBQUVDLElBQUFBLEtBQUY7QUFBU0MsSUFBQUEsT0FBVDtBQUFrQkMsSUFBQUEsVUFBVSxHQUFHO0FBQS9CO0FBQTFCO0FBQUE7QUFBQTtBQUEwRztBQUM3RyxRQUFJLENBQUNGLEtBQUQsSUFBVUUsVUFBZCxFQUEwQjtBQUN0QixhQUFPO0FBQ0hDLFFBQUFBLEtBQUssRUFBRSxJQURKO0FBRUhDLFFBQUFBLFFBQVEsRUFBRTtBQUZQLE9BQVA7QUFJSDs7QUFFRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEI7QUFDQSxRQUFJRixLQUFLLEdBQUcsSUFBWjs7QUFDQSxRQUFJTCxLQUFLLElBQUlBLEtBQUssQ0FBQ1EsTUFBbkIsRUFBMkI7QUFDdkIsV0FBSyxNQUFNQyxJQUFYLElBQW1CVCxLQUFuQixFQUEwQjtBQUN0QixZQUFJ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QUFHO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUNOa0IsT0FETSxFQUVOSixPQUZNLENBQVg7QUFJSDs7QUFFRCxXQUFPO0FBQ0hmLE1BQUFBLEtBREc7QUFFSEMsTUFBQUE7QUFGRyxLQUFQO0FBSUgsR0F0R0Q7QUF1R0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLyogZXNsaW50LWRpc2FibGUgYmFiZWwvbm8taW52YWxpZC10aGlzICovXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG50eXBlIERhdGEgPSBQaWNrPElGaWVsZFN0YXRlLCBcInZhbHVlXCIgfCBcImFsbG93RW1wdHlcIj47XG5cbmludGVyZmFjZSBJUnVsZTxUPiB7XG4gICAga2V5OiBzdHJpbmc7XG4gICAgZmluYWw/OiBib29sZWFuO1xuICAgIHNraXA/KHRoaXM6IFQsIGRhdGE6IERhdGEpOiBib29sZWFuO1xuICAgIHRlc3QodGhpczogVCwgZGF0YTogRGF0YSk6IGJvb2xlYW4gfCBQcm9taXNlPGJvb2xlYW4+O1xuICAgIHZhbGlkPyh0aGlzOiBUKTogc3RyaW5nO1xuICAgIGludmFsaWQ/KHRoaXM6IFQpOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJQXJnczxUPiB7XG4gICAgcnVsZXM6IElSdWxlPFQ+W107XG4gICAgZGVzY3JpcHRpb24odGhpczogVCk6IFJlYWN0LlJlYWN0Q2hpbGQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUZpZWxkU3RhdGUge1xuICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgZm9jdXNlZDogYm9vbGVhbjtcbiAgICBhbGxvd0VtcHR5OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICB2YWxpZD86IGJvb2xlYW47XG4gICAgZmVlZGJhY2s/OiBSZWFjdC5SZWFjdENoaWxkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB2YWxpZGF0aW9uIGZ1bmN0aW9uIGZyb20gYSBzZXQgb2YgcnVsZXMgZGVzY3JpYmluZyB3aGF0IHRvIHZhbGlkYXRlLlxuICogR2VuZXJpYyBUIGlzIHRoZSBcInRoaXNcIiB0eXBlIHBhc3NlZCB0byB0aGUgcnVsZSBtZXRob2RzXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGVzY3JpcHRpb25cbiAqICAgICBGdW5jdGlvbiB0aGF0IHJldHVybnMgYSBzdHJpbmcgc3VtbWFyeSBvZiB0aGUga2luZCBvZiB2YWx1ZSB0aGF0IHdpbGxcbiAqICAgICBtZWV0IHRoZSB2YWxpZGF0aW9uIHJ1bGVzLiBTaG93biBhdCB0aGUgdG9wIG9mIHRoZSB2YWxpZGF0aW9uIGZlZWRiYWNrLlxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGVzXG4gKiAgICAgQW4gYXJyYXkgb2YgcnVsZXMgZGVzY3JpYmluZyBob3cgdG8gY2hlY2sgdG8gaW5wdXQgdmFsdWUuIEVhY2ggcnVsZSBpbiBhbiBvYmplY3RcbiAqICAgICBhbmQgbWF5IGhhdmUgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICogICAgIC0gYGtleWA6IEEgdW5pcXVlIElEIGZvciB0aGUgcnVsZS4gUmVxdWlyZWQuXG4gKiAgICAgLSBgc2tpcGA6IEEgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgcnVsZSBzaG91bGQgZXZlbiBiZSBldmFsdWF0ZWQuXG4gKiAgICAgLSBgdGVzdGA6IEEgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgdGhlIHJ1bGUncyBjdXJyZW50IHZhbGlkaXR5LiBSZXF1aXJlZC5cbiAqICAgICAtIGB2YWxpZGA6IEZ1bmN0aW9uIHJldHVybmluZyB0ZXh0IHRvIHNob3cgd2hlbiB0aGUgcnVsZSBpcyB2YWxpZC4gT25seSBzaG93biBpZiBzZXQuXG4gKiAgICAgLSBgaW52YWxpZGA6IEZ1bmN0aW9uIHJldHVybmluZyB0ZXh0IHRvIHNob3cgd2hlbiB0aGUgcnVsZSBpcyBpbnZhbGlkLiBPbmx5IHNob3duIGlmIHNldC5cbiAqICAgICAtIGBmaW5hbGA6IEEgQm9vbGVhbiBpZiB0cnVlIHN0YXRlcyB0aGF0IHRoaXMgcnVsZSB3aWxsIG9ubHkgYmUgY29uc2lkZXJlZCBpZiBhbGwgcnVsZXMgYmVmb3JlIGl0IHJldHVybmVkIHZhbGlkLlxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICogICAgIEEgdmFsaWRhdGlvbiBmdW5jdGlvbiB0aGF0IHRha2VzIGluIHRoZSBjdXJyZW50IGlucHV0IHZhbHVlIGFuZCByZXR1cm5zXG4gKiAgICAgdGhlIG92ZXJhbGwgdmFsaWRpdHkgYW5kIGEgZmVlZGJhY2sgVUkgdGhhdCBjYW4gYmUgcmVuZGVyZWQgZm9yIG1vcmUgZGV0YWlsLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB3aXRoVmFsaWRhdGlvbjxUID0gdW5kZWZpbmVkPih7IGRlc2NyaXB0aW9uLCBydWxlcyB9OiBJQXJnczxUPikge1xuICAgIHJldHVybiBhc3luYyBmdW5jdGlvbiBvblZhbGlkYXRlKHsgdmFsdWUsIGZvY3VzZWQsIGFsbG93RW1wdHkgPSB0cnVlIH06IElGaWVsZFN0YXRlKTogUHJvbWlzZTxJVmFsaWRhdGlvblJlc3VsdD4ge1xuICAgICAgICBpZiAoIXZhbHVlICYmIGFsbG93RW1wdHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgZmVlZGJhY2s6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICBsZXQgdmFsaWQgPSB0cnVlO1xuICAgICAgICBpZiAocnVsZXMgJiYgcnVsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJ1bGUua2V5IHx8ICFydWxlLnRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZCAmJiBydWxlLmZpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7IHZhbHVlLCBhbGxvd0VtcHR5IH07XG5cbiAgICAgICAgICAgICAgICBpZiAocnVsZS5za2lwICYmIHJ1bGUuc2tpcC5jYWxsKHRoaXMsIGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdlJ3JlIHNldHRpbmcgYHRoaXNgIHRvIHdoaWNoZXZlciBjb21wb25lbnQgaG9sZHMgdGhlIHZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICAvLyBmdW5jdGlvbi4gVGhhdCBhbGxvd3MgcnVsZXMgdG8gYWNjZXNzIHRoZSBzdGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bGVWYWxpZCA9IGF3YWl0IHJ1bGUudGVzdC5jYWxsKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIHZhbGlkID0gdmFsaWQgJiYgcnVsZVZhbGlkO1xuICAgICAgICAgICAgICAgIGlmIChydWxlVmFsaWQgJiYgcnVsZS52YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcnVsZSdzIHJlc3VsdCBpcyB2YWxpZCBhbmQgaGFzIHRleHQgdG8gc2hvdyBmb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHZhbGlkIHN0YXRlLCBzaG93IGl0LlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gcnVsZS52YWxpZC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IHJ1bGUua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFydWxlVmFsaWQgJiYgcnVsZS5pbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBydWxlJ3MgcmVzdWx0IGlzIGludmFsaWQgYW5kIGhhcyB0ZXh0IHRvIHNob3cgZm9yXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBpbnZhbGlkIHN0YXRlLCBzaG93IGl0LlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gcnVsZS5pbnZhbGlkLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogcnVsZS5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIaWRlIGZlZWRiYWNrIHdoZW4gbm90IGZvY3VzZWRcbiAgICAgICAgaWYgKCFmb2N1c2VkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZhbGlkLFxuICAgICAgICAgICAgICAgIGZlZWRiYWNrOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGV0YWlscyA9IDx1bCBjbGFzc05hbWU9XCJteF9WYWxpZGF0aW9uX2RldGFpbHNcIj5cbiAgICAgICAgICAgICAgICB7cmVzdWx0cy5tYXAocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJteF9WYWxpZGF0aW9uX2RldGFpbFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJteF9WYWxpZGF0aW9uX3ZhbGlkXCI6IHJlc3VsdC52YWxpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibXhfVmFsaWRhdGlvbl9pbnZhbGlkXCI6ICFyZXN1bHQudmFsaWQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGxpIGtleT17cmVzdWx0LmtleX0gY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtyZXN1bHQudGV4dH1cbiAgICAgICAgICAgICAgICAgICAgPC9saT47XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8L3VsPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdW1tYXJ5O1xuICAgICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHNldHRpbmcgYHRoaXNgIHRvIHdoaWNoZXZlciBjb21wb25lbnQgaG9sZHMgdGhlIHZhbGlkYXRpb25cbiAgICAgICAgICAgIC8vIGZ1bmN0aW9uLiBUaGF0IGFsbG93cyBydWxlcyB0byBhY2Nlc3MgdGhlIHN0YXRlIG9mIHRoZSBjb21wb25lbnQuXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZGVzY3JpcHRpb24uY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHN1bW1hcnkgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZhbGlkYXRpb25fZGVzY3JpcHRpb25cIj57Y29udGVudH08L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZmVlZGJhY2s7XG4gICAgICAgIGlmIChzdW1tYXJ5IHx8IGRldGFpbHMpIHtcbiAgICAgICAgICAgIGZlZWRiYWNrID0gPGRpdiBjbGFzc05hbWU9XCJteF9WYWxpZGF0aW9uXCI+XG4gICAgICAgICAgICAgICAge3N1bW1hcnl9XG4gICAgICAgICAgICAgICAge2RldGFpbHN9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsaWQsXG4gICAgICAgICAgICBmZWVkYmFjayxcbiAgICAgICAgfTtcbiAgICB9O1xufVxuIl19