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

var sdk = _interopRequireWildcard(require("../../.."));

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
class InlineTermsAgreement extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_togglePolicy", index => {
      const policies = JSON.parse(JSON.stringify(this.state.policies)); // deep & cheap clone

      policies[index].checked = !policies[index].checked;
      this.setState({
        policies
      });
    });
    (0, _defineProperty2.default)(this, "_onContinue", () => {
      const hasUnchecked = !!this.state.policies.some(p => !p.checked);
      if (hasUnchecked) return;
      this.setState({
        busy: true
      });
      this.props.onFinished(this.state.policies.map(p => p.url));
    });
    this.state = {
      policies: [],
      busy: false
    };
  }

  componentDidMount() {
    // Build all the terms the user needs to accept
    const policies = []; // { checked, url, name }

    for (const servicePolicies of this.props.policiesAndServicePairs) {
      const availablePolicies = Object.values(servicePolicies.policies);

      for (const policy of availablePolicies) {
        const language = (0, _languageHandler.pickBestLanguage)(Object.keys(policy).filter(p => p !== 'version'));
        const renderablePolicy = {
          checked: false,
          url: policy[language].url,
          name: policy[language].name
        };
        policies.push(renderablePolicy);
      }
    }

    this.setState({
      policies
    });
  }

  _renderCheckboxes() {
    const rendered = [];

    for (let i = 0; i < this.state.policies.length; i++) {
      const policy = this.state.policies[i];
      const introText = (0, _languageHandler._t)("Accept <policyLink /> to continue:", {}, {
        policyLink: () => {
          return /*#__PURE__*/_react.default.createElement("a", {
            href: policy.url,
            rel: "noreferrer noopener",
            target: "_blank"
          }, policy.name, /*#__PURE__*/_react.default.createElement("span", {
            className: "mx_InlineTermsAgreement_link"
          }));
        }
      });
      rendered.push( /*#__PURE__*/_react.default.createElement("div", {
        key: i,
        className: "mx_InlineTermsAgreement_cbContainer"
      }, /*#__PURE__*/_react.default.createElement("div", null, introText), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_InlineTermsAgreement_checkbox"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "checkbox",
        onChange: () => this._togglePolicy(i),
        checked: policy.checked
      }), (0, _languageHandler._t)("Accept"))));
    }

    return rendered;
  }

  render() {
    const AccessibleButton = sdk.getComponent("views.elements.AccessibleButton");
    const hasUnchecked = !!this.state.policies.some(p => !p.checked);
    return /*#__PURE__*/_react.default.createElement("div", null, this.props.introElement, this._renderCheckboxes(), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      onClick: this._onContinue,
      disabled: hasUnchecked || this.state.busy,
      kind: "primary_sm"
    }, (0, _languageHandler._t)("Continue")));
  }

}

exports.default = InlineTermsAgreement;
(0, _defineProperty2.default)(InlineTermsAgreement, "propTypes", {
  policiesAndServicePairs: _propTypes.default.array.isRequired,
  // array of service/policy pairs
  agreedUrls: _propTypes.default.array.isRequired,
  // array of URLs the user has accepted
  onFinished: _propTypes.default.func.isRequired,
  // takes an argument of accepted URLs
  introElement: _propTypes.default.node
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Rlcm1zL0lubGluZVRlcm1zQWdyZWVtZW50LmpzIl0sIm5hbWVzIjpbIklubGluZVRlcm1zQWdyZWVtZW50IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsImluZGV4IiwicG9saWNpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJzdGF0ZSIsImNoZWNrZWQiLCJzZXRTdGF0ZSIsImhhc1VuY2hlY2tlZCIsInNvbWUiLCJwIiwiYnVzeSIsInByb3BzIiwib25GaW5pc2hlZCIsIm1hcCIsInVybCIsImNvbXBvbmVudERpZE1vdW50Iiwic2VydmljZVBvbGljaWVzIiwicG9saWNpZXNBbmRTZXJ2aWNlUGFpcnMiLCJhdmFpbGFibGVQb2xpY2llcyIsIk9iamVjdCIsInZhbHVlcyIsInBvbGljeSIsImxhbmd1YWdlIiwia2V5cyIsImZpbHRlciIsInJlbmRlcmFibGVQb2xpY3kiLCJuYW1lIiwicHVzaCIsIl9yZW5kZXJDaGVja2JveGVzIiwicmVuZGVyZWQiLCJpIiwibGVuZ3RoIiwiaW50cm9UZXh0IiwicG9saWN5TGluayIsIl90b2dnbGVQb2xpY3kiLCJyZW5kZXIiLCJBY2Nlc3NpYmxlQnV0dG9uIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiaW50cm9FbGVtZW50IiwiX29uQ29udGludWUiLCJQcm9wVHlwZXMiLCJhcnJheSIsImlzUmVxdWlyZWQiLCJhZ3JlZWRVcmxzIiwiZnVuYyIsIm5vZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7QUFxQmUsTUFBTUEsb0JBQU4sU0FBbUNDLGVBQU1DLFNBQXpDLENBQW1EO0FBUTlEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLHlEQTRCR0MsS0FBRCxJQUFXO0FBQ3ZCLFlBQU1DLFFBQVEsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdE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R3dCO0FBQ3ZDSixFQUFBQSxZQUFZLEVBQUVFLG1CQUFVSztBQUpULEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCI7XG5pbXBvcnQge190LCBwaWNrQmVzdExhbmd1YWdlfSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElubGluZVRlcm1zQWdyZWVtZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBwb2xpY2llc0FuZFNlcnZpY2VQYWlyczogUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsIC8vIGFycmF5IG9mIHNlcnZpY2UvcG9saWN5IHBhaXJzXG4gICAgICAgIGFncmVlZFVybHM6IFByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLCAvLyBhcnJheSBvZiBVUkxzIHRoZSB1c2VyIGhhcyBhY2NlcHRlZFxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLCAvLyB0YWtlcyBhbiBhcmd1bWVudCBvZiBhY2NlcHRlZCBVUkxzXG4gICAgICAgIGludHJvRWxlbWVudDogUHJvcFR5cGVzLm5vZGUsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBwb2xpY2llczogW10sXG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgLy8gQnVpbGQgYWxsIHRoZSB0ZXJtcyB0aGUgdXNlciBuZWVkcyB0byBhY2NlcHRcbiAgICAgICAgY29uc3QgcG9saWNpZXMgPSBbXTsgLy8geyBjaGVja2VkLCB1cmwsIG5hbWUgfVxuICAgICAgICBmb3IgKGNvbnN0IHNlcnZpY2VQb2xpY2llcyBvZiB0aGlzLnByb3BzLnBvbGljaWVzQW5kU2VydmljZVBhaXJzKSB7XG4gICAgICAgICAgICBjb25zdCBhdmFpbGFibGVQb2xpY2llcyA9IE9iamVjdC52YWx1ZXMoc2VydmljZVBvbGljaWVzLnBvbGljaWVzKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcG9saWN5IG9mIGF2YWlsYWJsZVBvbGljaWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBwaWNrQmVzdExhbmd1YWdlKE9iamVjdC5rZXlzKHBvbGljeSkuZmlsdGVyKHAgPT4gcCAhPT0gJ3ZlcnNpb24nKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVuZGVyYWJsZVBvbGljeSA9IHtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHVybDogcG9saWN5W2xhbmd1YWdlXS51cmwsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHBvbGljeVtsYW5ndWFnZV0ubmFtZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHBvbGljaWVzLnB1c2gocmVuZGVyYWJsZVBvbGljeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtwb2xpY2llc30pO1xuICAgIH1cblxuICAgIF90b2dnbGVQb2xpY3kgPSAoaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgcG9saWNpZXMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUucG9saWNpZXMpKTsgLy8gZGVlcCAmIGNoZWFwIGNsb25lXG4gICAgICAgIHBvbGljaWVzW2luZGV4XS5jaGVja2VkID0gIXBvbGljaWVzW2luZGV4XS5jaGVja2VkO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtwb2xpY2llc30pO1xuICAgIH07XG5cbiAgICBfb25Db250aW51ZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgaGFzVW5jaGVja2VkID0gISF0aGlzLnN0YXRlLnBvbGljaWVzLnNvbWUocCA9PiAhcC5jaGVja2VkKTtcbiAgICAgICAgaWYgKGhhc1VuY2hlY2tlZCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2J1c3k6IHRydWV9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKHRoaXMuc3RhdGUucG9saWNpZXMubWFwKHAgPT4gcC51cmwpKTtcbiAgICB9O1xuXG4gICAgX3JlbmRlckNoZWNrYm94ZXMoKSB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdGF0ZS5wb2xpY2llcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcG9saWN5ID0gdGhpcy5zdGF0ZS5wb2xpY2llc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGludHJvVGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiQWNjZXB0IDxwb2xpY3lMaW5rIC8+IHRvIGNvbnRpbnVlOlwiLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICBwb2xpY3lMaW5rOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9e3BvbGljeS51cmx9IHJlbD0nbm9yZWZlcnJlciBub29wZW5lcicgdGFyZ2V0PSdfYmxhbmsnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cG9saWN5Lm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbXhfSW5saW5lVGVybXNBZ3JlZW1lbnRfbGluaycgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmVuZGVyZWQucHVzaChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPSdteF9JbmxpbmVUZXJtc0FncmVlbWVudF9jYkNvbnRhaW5lcic+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+e2ludHJvVGV4dH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0lubGluZVRlcm1zQWdyZWVtZW50X2NoZWNrYm94Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdjaGVja2JveCcgb25DaGFuZ2U9eygpID0+IHRoaXMuX3RvZ2dsZVBvbGljeShpKX0gY2hlY2tlZD17cG9saWN5LmNoZWNrZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJBY2NlcHRcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlbmRlcmVkO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5lbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uXCIpO1xuICAgICAgICBjb25zdCBoYXNVbmNoZWNrZWQgPSAhIXRoaXMuc3RhdGUucG9saWNpZXMuc29tZShwID0+ICFwLmNoZWNrZWQpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLmludHJvRWxlbWVudH1cbiAgICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVyQ2hlY2tib3hlcygpfVxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ29udGludWV9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtoYXNVbmNoZWNrZWQgfHwgdGhpcy5zdGF0ZS5idXN5fVxuICAgICAgICAgICAgICAgICAgICBraW5kPVwicHJpbWFyeV9zbVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXCJDb250aW51ZVwiKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=