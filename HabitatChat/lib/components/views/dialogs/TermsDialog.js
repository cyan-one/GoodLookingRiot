"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _url = _interopRequireDefault(require("url"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _matrixJsSdk = _interopRequireDefault(require("matrix-js-sdk"));

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
class TermsCheckbox extends _react.default.PureComponent {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onChange", ev => {
      this.props.onChange(this.props.url, ev.target.checked);
    });
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("input", {
      type: "checkbox",
      onChange: this.onChange,
      checked: this.props.checked
    });
  }

}

(0, _defineProperty2.default)(TermsCheckbox, "propTypes", {
  onChange: _propTypes.default.func.isRequired,
  url: _propTypes.default.string.isRequired,
  checked: _propTypes.default.bool.isRequired
});

class TermsDialog extends _react.default.PureComponent {
  constructor(props) {
    super();
    (0, _defineProperty2.default)(this, "_onCancelClick", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onNextClick", () => {
      this.props.onFinished(true, Object.keys(this.state.agreedUrls).filter(url => this.state.agreedUrls[url]));
    });
    (0, _defineProperty2.default)(this, "_onTermsCheckboxChange", (url, checked) => {
      this.setState({
        agreedUrls: Object.assign({}, this.state.agreedUrls, {
          [url]: checked
        })
      });
    });
    this.state = {
      // url -> boolean
      agreedUrls: {}
    };

    for (const url of props.agreedUrls) {
      this.state.agreedUrls[url] = true;
    }
  }

  _nameForServiceType(serviceType, host) {
    switch (serviceType) {
      case _matrixJsSdk.default.SERVICE_TYPES.IS:
        return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Identity Server"), /*#__PURE__*/_react.default.createElement("br", null), "(", host, ")");

      case _matrixJsSdk.default.SERVICE_TYPES.IM:
        return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Integration Manager"), /*#__PURE__*/_react.default.createElement("br", null), "(", host, ")");
    }
  }

  _summaryForServiceType(serviceType) {
    switch (serviceType) {
      case _matrixJsSdk.default.SERVICE_TYPES.IS:
        return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Find others by phone or email"), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Be found by phone or email"));

      case _matrixJsSdk.default.SERVICE_TYPES.IM:
        return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Use bots, bridges, widgets and sticker packs"));
    }
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    const rows = [];

    for (const policiesAndService of this.props.policiesAndServicePairs) {
      const parsedBaseUrl = _url.default.parse(policiesAndService.service.baseUrl);

      const policyValues = Object.values(policiesAndService.policies);

      for (let i = 0; i < policyValues.length; ++i) {
        const termDoc = policyValues[i];
        const termsLang = (0, _languageHandler.pickBestLanguage)(Object.keys(termDoc).filter(k => k !== 'version'));
        let serviceName;
        let summary;

        if (i === 0) {
          serviceName = this._nameForServiceType(policiesAndService.service.serviceType, parsedBaseUrl.host);
          summary = this._summaryForServiceType(policiesAndService.service.serviceType);
        }

        rows.push( /*#__PURE__*/_react.default.createElement("tr", {
          key: termDoc[termsLang].url
        }, /*#__PURE__*/_react.default.createElement("td", {
          className: "mx_TermsDialog_service"
        }, serviceName), /*#__PURE__*/_react.default.createElement("td", {
          className: "mx_TermsDialog_summary"
        }, summary), /*#__PURE__*/_react.default.createElement("td", null, termDoc[termsLang].name, " ", /*#__PURE__*/_react.default.createElement("a", {
          rel: "noreferrer noopener",
          target: "_blank",
          href: termDoc[termsLang].url
        }, /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_TermsDialog_link"
        }))), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement(TermsCheckbox, {
          url: termDoc[termsLang].url,
          onChange: this._onTermsCheckboxChange,
          checked: Boolean(this.state.agreedUrls[termDoc[termsLang].url])
        }))));
      }
    } // if all the documents for at least one service have been checked, we can enable
    // the submit button


    let enableSubmit = false;

    for (const policiesAndService of this.props.policiesAndServicePairs) {
      let docsAgreedForService = 0;

      for (const terms of Object.values(policiesAndService.policies)) {
        let docAgreed = false;

        for (const lang of Object.keys(terms)) {
          if (lang === 'version') continue;

          if (this.state.agreedUrls[terms[lang].url]) {
            docAgreed = true;
            break;
          }
        }

        if (docAgreed) {
          ++docsAgreedForService;
        }
      }

      if (docsAgreedForService === Object.keys(policiesAndService.policies).length) {
        enableSubmit = true;
        break;
      }
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      fixedWidth: false,
      onFinished: this._onCancelClick,
      title: (0, _languageHandler._t)("Terms of Service"),
      contentId: "mx_Dialog_content",
      hasCancel: false
    }, /*#__PURE__*/_react.default.createElement("div", {
      id: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("To continue you need to accept the terms of this service.")), /*#__PURE__*/_react.default.createElement("table", {
      className: "mx_TermsDialog_termsTable"
    }, /*#__PURE__*/_react.default.createElement("tbody", null, /*#__PURE__*/_react.default.createElement("tr", {
      className: "mx_TermsDialog_termsTableHeader"
    }, /*#__PURE__*/_react.default.createElement("th", null, (0, _languageHandler._t)("Service")), /*#__PURE__*/_react.default.createElement("th", null, (0, _languageHandler._t)("Summary")), /*#__PURE__*/_react.default.createElement("th", null, (0, _languageHandler._t)("Document")), /*#__PURE__*/_react.default.createElement("th", null, (0, _languageHandler._t)("Accept"))), rows))), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Next'),
      hasCancel: true,
      onCancel: this._onCancelClick,
      onPrimaryButtonClick: this._onNextClick,
      primaryDisabled: !enableSubmit
    }));
  }

}

exports.default = TermsDialog;
(0, _defineProperty2.default)(TermsDialog, "propTypes", {
  /**
   * Array of [Service, policies] pairs, where policies is the response from the
   * /terms endpoint for that service
   */
  policiesAndServicePairs: _propTypes.default.array.isRequired,

  /**
   * urls that the user has already agreed to
   */
  agreedUrls: _propTypes.default.arrayOf(_propTypes.default.string),

  /**
   * Called with:
   *     * success {bool} True if the user accepted any douments, false if cancelled
   *     * agreedUrls {string[]} List of agreed URLs
   */
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVGVybXNEaWFsb2cuanMiXSwibmFtZXMiOlsiVGVybXNDaGVja2JveCIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImV2IiwicHJvcHMiLCJvbkNoYW5nZSIsInVybCIsInRhcmdldCIsImNoZWNrZWQiLCJyZW5kZXIiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCIsInN0cmluZyIsImJvb2wiLCJUZXJtc0RpYWxvZyIsImNvbnN0cnVjdG9yIiwib25GaW5pc2hlZCIsIk9iamVjdCIsImtleXMiLCJzdGF0ZSIsImFncmVlZFVybHMiLCJmaWx0ZXIiLCJzZXRTdGF0ZSIsImFzc2lnbiIsIl9uYW1lRm9yU2VydmljZVR5cGUiLCJzZXJ2aWNlVHlwZSIsImhvc3QiLCJNYXRyaXgiLCJTRVJWSUNFX1RZUEVTIiwiSVMiLCJJTSIsIl9zdW1tYXJ5Rm9yU2VydmljZVR5cGUiLCJCYXNlRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRGlhbG9nQnV0dG9ucyIsInJvd3MiLCJwb2xpY2llc0FuZFNlcnZpY2UiLCJwb2xpY2llc0FuZFNlcnZpY2VQYWlycyIsInBhcnNlZEJhc2VVcmwiLCJwYXJzZSIsInNlcnZpY2UiLCJiYXNlVXJsIiwicG9saWN5VmFsdWVzIiwidmFsdWVzIiwicG9saWNpZXMiLCJpIiwibGVuZ3RoIiwidGVybURvYyIsInRlcm1zTGFuZyIsImsiLCJzZXJ2aWNlTmFtZSIsInN1bW1hcnkiLCJwdXNoIiwibmFtZSIsIl9vblRlcm1zQ2hlY2tib3hDaGFuZ2UiLCJCb29sZWFuIiwiZW5hYmxlU3VibWl0IiwiZG9jc0FncmVlZEZvclNlcnZpY2UiLCJ0ZXJtcyIsImRvY0FncmVlZCIsImxhbmciLCJfb25DYW5jZWxDbGljayIsIl9vbk5leHRDbGljayIsImFycmF5IiwiYXJyYXlPZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFD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OUI7QUFDSSxNQUFBLFNBQVMsRUFBRSxJQURmO0FBRUksTUFBQSxRQUFRLEVBQUUsS0FBSzBCLGNBRm5CO0FBR0ksTUFBQSxvQkFBb0IsRUFBRSxLQUFLQyxZQUgvQjtBQUlJLE1BQUEsZUFBZSxFQUFFLENBQUNOO0FBSnRCLE1BckJKLENBREo7QUE4Qkg7O0FBaEt3RDs7OzhCQUF4QzNDLFcsZUFDRTtBQUNmOzs7O0FBSUF3QixFQUFBQSx1QkFBdUIsRUFBRTdCLG1CQUFVdUQsS0FBVixDQUFnQnJELFVBTDFCOztBQU9mOzs7QUFHQVMsRUFBQUEsVUFBVSxFQUFFWCxtQkFBVXdELE9BQVYsQ0FBa0J4RCxtQkFBVUcsTUFBNUIsQ0FWRzs7QUFZZjs7Ozs7QUFLQUksRUFBQUEsVUFBVSxFQUFFUCxtQkFBVUMsSUFBVixDQUFlQztBQWpCWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QsIHBpY2tCZXN0TGFuZ3VhZ2UgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5pbXBvcnQgTWF0cml4IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuXG5jbGFzcyBUZXJtc0NoZWNrYm94IGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHVybDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBjaGVja2VkOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIH1cblxuICAgIG9uQ2hhbmdlID0gKGV2KSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5wcm9wcy51cmwsIGV2LnRhcmdldC5jaGVja2VkKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uQ2hhbmdlfVxuICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5wcm9wcy5jaGVja2VkfVxuICAgICAgICAvPjtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlcm1zRGlhbG9nIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFycmF5IG9mIFtTZXJ2aWNlLCBwb2xpY2llc10gcGFpcnMsIHdoZXJlIHBvbGljaWVzIGlzIHRoZSByZXNwb25zZSBmcm9tIHRoZVxuICAgICAgICAgKiAvdGVybXMgZW5kcG9pbnQgZm9yIHRoYXQgc2VydmljZVxuICAgICAgICAgKi9cbiAgICAgICAgcG9saWNpZXNBbmRTZXJ2aWNlUGFpcnM6IFByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB1cmxzIHRoYXQgdGhlIHVzZXIgaGFzIGFscmVhZHkgYWdyZWVkIHRvXG4gICAgICAgICAqL1xuICAgICAgICBhZ3JlZWRVcmxzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuc3RyaW5nKSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdpdGg6XG4gICAgICAgICAqICAgICAqIHN1Y2Nlc3Mge2Jvb2x9IFRydWUgaWYgdGhlIHVzZXIgYWNjZXB0ZWQgYW55IGRvdW1lbnRzLCBmYWxzZSBpZiBjYW5jZWxsZWRcbiAgICAgICAgICogICAgICogYWdyZWVkVXJscyB7c3RyaW5nW119IExpc3Qgb2YgYWdyZWVkIFVSTHNcbiAgICAgICAgICovXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIC8vIHVybCAtPiBib29sZWFuXG4gICAgICAgICAgICBhZ3JlZWRVcmxzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgcHJvcHMuYWdyZWVkVXJscykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5hZ3JlZWRVcmxzW3VybF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgX29uTmV4dENsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSwgT2JqZWN0LmtleXModGhpcy5zdGF0ZS5hZ3JlZWRVcmxzKS5maWx0ZXIoKHVybCkgPT4gdGhpcy5zdGF0ZS5hZ3JlZWRVcmxzW3VybF0pKTtcbiAgICB9XG5cbiAgICBfbmFtZUZvclNlcnZpY2VUeXBlKHNlcnZpY2VUeXBlLCBob3N0KSB7XG4gICAgICAgIHN3aXRjaCAoc2VydmljZVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgTWF0cml4LlNFUlZJQ0VfVFlQRVMuSVM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+e190KFwiSWRlbnRpdHkgU2VydmVyXCIpfTxiciAvPih7aG9zdH0pPC9kaXY+O1xuICAgICAgICAgICAgY2FzZSBNYXRyaXguU0VSVklDRV9UWVBFUy5JTTpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj57X3QoXCJJbnRlZ3JhdGlvbiBNYW5hZ2VyXCIpfTxiciAvPih7aG9zdH0pPC9kaXY+O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3N1bW1hcnlGb3JTZXJ2aWNlVHlwZShzZXJ2aWNlVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHNlcnZpY2VUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIE1hdHJpeC5TRVJWSUNFX1RZUEVTLklTOlxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJGaW5kIG90aGVycyBieSBwaG9uZSBvciBlbWFpbFwiKX1cbiAgICAgICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIkJlIGZvdW5kIGJ5IHBob25lIG9yIGVtYWlsXCIpfVxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgICAgIGNhc2UgTWF0cml4LlNFUlZJQ0VfVFlQRVMuSU06XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHtfdChcIlVzZSBib3RzLCBicmlkZ2VzLCB3aWRnZXRzIGFuZCBzdGlja2VyIHBhY2tzXCIpfVxuICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vblRlcm1zQ2hlY2tib3hDaGFuZ2UgPSAodXJsLCBjaGVja2VkKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYWdyZWVkVXJsczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZS5hZ3JlZWRVcmxzLCB7IFt1cmxdOiBjaGVja2VkIH0pLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcblxuICAgICAgICBjb25zdCByb3dzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcG9saWNpZXNBbmRTZXJ2aWNlIG9mIHRoaXMucHJvcHMucG9saWNpZXNBbmRTZXJ2aWNlUGFpcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZEJhc2VVcmwgPSB1cmwucGFyc2UocG9saWNpZXNBbmRTZXJ2aWNlLnNlcnZpY2UuYmFzZVVybCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvbGljeVZhbHVlcyA9IE9iamVjdC52YWx1ZXMocG9saWNpZXNBbmRTZXJ2aWNlLnBvbGljaWVzKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9saWN5VmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVybURvYyA9IHBvbGljeVZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXJtc0xhbmcgPSBwaWNrQmVzdExhbmd1YWdlKE9iamVjdC5rZXlzKHRlcm1Eb2MpLmZpbHRlcigoaykgPT4gayAhPT0gJ3ZlcnNpb24nKSk7XG4gICAgICAgICAgICAgICAgbGV0IHNlcnZpY2VOYW1lO1xuICAgICAgICAgICAgICAgIGxldCBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2VOYW1lID0gdGhpcy5fbmFtZUZvclNlcnZpY2VUeXBlKHBvbGljaWVzQW5kU2VydmljZS5zZXJ2aWNlLnNlcnZpY2VUeXBlLCBwYXJzZWRCYXNlVXJsLmhvc3QpO1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gdGhpcy5fc3VtbWFyeUZvclNlcnZpY2VUeXBlKFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9saWNpZXNBbmRTZXJ2aWNlLnNlcnZpY2Uuc2VydmljZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKDx0ciBrZXk9e3Rlcm1Eb2NbdGVybXNMYW5nXS51cmx9PlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwibXhfVGVybXNEaWFsb2dfc2VydmljZVwiPntzZXJ2aWNlTmFtZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwibXhfVGVybXNEaWFsb2dfc3VtbWFyeVwiPntzdW1tYXJ5fTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDx0ZD57dGVybURvY1t0ZXJtc0xhbmddLm5hbWV9IDxhIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0ZXJtRG9jW3Rlcm1zTGFuZ10udXJsfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1Rlcm1zRGlhbG9nX2xpbmtcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2E+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkPjxUZXJtc0NoZWNrYm94XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw9e3Rlcm1Eb2NbdGVybXNMYW5nXS51cmx9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25UZXJtc0NoZWNrYm94Q2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17Qm9vbGVhbih0aGlzLnN0YXRlLmFncmVlZFVybHNbdGVybURvY1t0ZXJtc0xhbmddLnVybF0pfVxuICAgICAgICAgICAgICAgICAgICAvPjwvdGQ+XG4gICAgICAgICAgICAgICAgPC90cj4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgYWxsIHRoZSBkb2N1bWVudHMgZm9yIGF0IGxlYXN0IG9uZSBzZXJ2aWNlIGhhdmUgYmVlbiBjaGVja2VkLCB3ZSBjYW4gZW5hYmxlXG4gICAgICAgIC8vIHRoZSBzdWJtaXQgYnV0dG9uXG4gICAgICAgIGxldCBlbmFibGVTdWJtaXQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBwb2xpY2llc0FuZFNlcnZpY2Ugb2YgdGhpcy5wcm9wcy5wb2xpY2llc0FuZFNlcnZpY2VQYWlycykge1xuICAgICAgICAgICAgbGV0IGRvY3NBZ3JlZWRGb3JTZXJ2aWNlID0gMDtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdGVybXMgb2YgT2JqZWN0LnZhbHVlcyhwb2xpY2llc0FuZFNlcnZpY2UucG9saWNpZXMpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY0FncmVlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbGFuZyBvZiBPYmplY3Qua2V5cyh0ZXJtcykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhbmcgPT09ICd2ZXJzaW9uJykgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmFncmVlZFVybHNbdGVybXNbbGFuZ10udXJsXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jQWdyZWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NBZ3JlZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgKytkb2NzQWdyZWVkRm9yU2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZG9jc0FncmVlZEZvclNlcnZpY2UgPT09IE9iamVjdC5rZXlzKHBvbGljaWVzQW5kU2VydmljZS5wb2xpY2llcykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZW5hYmxlU3VibWl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZ1xuICAgICAgICAgICAgICAgIGZpeGVkV2lkdGg9e2ZhbHNlfVxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMuX29uQ2FuY2VsQ2xpY2t9XG4gICAgICAgICAgICAgICAgdGl0bGU9e190KFwiVGVybXMgb2YgU2VydmljZVwiKX1cbiAgICAgICAgICAgICAgICBjb250ZW50SWQ9J214X0RpYWxvZ19jb250ZW50J1xuICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBpZD0nbXhfRGlhbG9nX2NvbnRlbnQnPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXCJUbyBjb250aW51ZSB5b3UgbmVlZCB0byBhY2NlcHQgdGhlIHRlcm1zIG9mIHRoaXMgc2VydmljZS5cIil9PC9wPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJteF9UZXJtc0RpYWxvZ190ZXJtc1RhYmxlXCI+PHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cIm14X1Rlcm1zRGlhbG9nX3Rlcm1zVGFibGVIZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+e190KFwiU2VydmljZVwiKX08L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD57X3QoXCJTdW1tYXJ5XCIpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPntfdChcIkRvY3VtZW50XCIpfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPntfdChcIkFjY2VwdFwiKX08L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PjwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtfdCgnTmV4dCcpfVxuICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLl9vbkNhbmNlbENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25OZXh0Q2xpY2t9XG4gICAgICAgICAgICAgICAgICAgIHByaW1hcnlEaXNhYmxlZD17IWVuYWJsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==