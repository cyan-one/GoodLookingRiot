"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTypeFromServerConfig = getTypeFromServerConfig;
exports.default = exports.TYPES = exports.ADVANCED = exports.PREMIUM = exports.FREE = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _classnames = _interopRequireDefault(require("classnames"));

var _AutoDiscoveryUtils = require("../../../utils/AutoDiscoveryUtils");

var _TypeUtils = require("../../../utils/TypeUtils");

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
const MODULAR_URL = 'https://modular.im/?utm_source=riot-web&utm_medium=web&utm_campaign=riot-web-authentication';
const FREE = 'Free';
exports.FREE = FREE;
const PREMIUM = 'Premium';
exports.PREMIUM = PREMIUM;
const ADVANCED = 'Advanced';
exports.ADVANCED = ADVANCED;
const TYPES = {
  FREE: {
    id: FREE,
    label: () => (0, _languageHandler._t)('Free'),
    logo: () => /*#__PURE__*/_react.default.createElement("img", {
      src: require('../../../../res/img/matrix-org-bw-logo.svg')
    }),
    description: () => (0, _languageHandler._t)('Join millions for free on the largest public server'),
    serverConfig: (0, _TypeUtils.makeType)(_AutoDiscoveryUtils.ValidatedServerConfig, {
      hsUrl: "https://matrix-client.matrix.org",
      hsName: "matrix.org",
      hsNameIsDifferent: false,
      isUrl: "https://vector.im"
    })
  },
  PREMIUM: {
    id: PREMIUM,
    label: () => (0, _languageHandler._t)('Premium'),
    logo: () => /*#__PURE__*/_react.default.createElement("img", {
      src: require('../../../../res/img/modular-bw-logo.svg')
    }),
    description: () => (0, _languageHandler._t)('Premium hosting for organisations <a>Learn more</a>', {}, {
      a: sub => /*#__PURE__*/_react.default.createElement("a", {
        href: MODULAR_URL,
        target: "_blank",
        rel: "noreferrer noopener"
      }, sub)
    }),
    identityServerUrl: "https://vector.im"
  },
  ADVANCED: {
    id: ADVANCED,
    label: () => (0, _languageHandler._t)('Advanced'),
    logo: () => /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("img", {
      src: require('../../../../res/img/feather-customised/globe.svg')
    }), (0, _languageHandler._t)('Other')),
    description: () => (0, _languageHandler._t)('Find other public servers or use a custom server')
  }
};
exports.TYPES = TYPES;

function getTypeFromServerConfig(config) {
  const {
    hsUrl
  } = config;

  if (!hsUrl) {
    return null;
  } else if (hsUrl === TYPES.FREE.serverConfig.hsUrl) {
    return FREE;
  } else if (new URL(hsUrl).hostname.endsWith('.modular.im')) {
    // This is an unlikely case to reach, as Modular defaults to hiding the
    // server type selector.
    return PREMIUM;
  } else {
    return ADVANCED;
  }
}

class ServerTypeSelector extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onClick", e => {
      e.stopPropagation();
      const type = e.currentTarget.dataset.id;
      this.updateSelectedType(type);
    });
    const {
      selected
    } = props;
    this.state = {
      selected
    };
  }

  updateSelectedType(type) {
    if (this.state.selected === type) {
      return;
    }

    this.setState({
      selected: type
    });

    if (this.props.onChange) {
      this.props.onChange(type);
    }
  }

  render() {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const serverTypes = [];

    for (const type of Object.values(TYPES)) {
      const {
        id,
        label,
        logo,
        description
      } = type;
      const classes = (0, _classnames.default)("mx_ServerTypeSelector_type", "mx_ServerTypeSelector_type_".concat(id), {
        "mx_ServerTypeSelector_type_selected": id === this.state.selected
      });
      serverTypes.push( /*#__PURE__*/_react.default.createElement("div", {
        className: classes,
        key: id
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ServerTypeSelector_label"
      }, label()), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this.onClick,
        "data-id": id
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ServerTypeSelector_logo"
      }, logo()), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ServerTypeSelector_description"
      }, description()))));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ServerTypeSelector"
    }, serverTypes);
  }

}

exports.default = ServerTypeSelector;
(0, _defineProperty2.default)(ServerTypeSelector, "propTypes", {
  // The default selected type.
  selected: _propTypes.default.string,
  // Handler called when the selected type changes.
  onChange: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F1dGgvU2VydmVyVHlwZVNlbGVjdG9yLmpzIl0sIm5hbWVzIjpbIk1PRFVMQVJfVVJMIiwiRlJFRSIsIlBSRU1JVU0iLCJBRFZBTkNFRCIsIlRZUEVTIiwiaWQiLCJsYWJlbCIsImxvZ28iLCJyZXF1aXJlIiwiZGVzY3JpcHRpb24iLCJzZXJ2ZXJDb25maWciLCJWYWxpZGF0ZWRTZXJ2ZXJDb25maWciLCJoc1VybCIsImhzTmFtZSIsImhzTmFtZUlzRGlmZmVyZW50IiwiaXNVcmwiLCJhIiwic3ViIiwiaWRlbnRpdHlTZXJ2ZXJVcmwiLCJnZXRUeXBlRnJvbVNlcnZlckNvbmZpZyIsImNvbmZpZyIsIlVSTCIsImhvc3RuYW1lIiwiZW5kc1dpdGgiLCJTZXJ2ZXJUeXBlU2VsZWN0b3IiLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsInR5cGUiLCJjdXJyZW50VGFyZ2V0IiwiZGF0YXNldCIsInVwZGF0ZVNlbGVjdGVkVHlwZSIsInNlbGVjdGVkIiwic3RhdGUiLCJzZXRTdGF0ZSIsIm9uQ2hhbmdlIiwicmVuZGVyIiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNkayIsImdldENvbXBvbmVudCIsInNlcnZlclR5cGVzIiwiT2JqZWN0IiwidmFsdWVzIiwiY2xhc3NlcyIsInB1c2giLCJvbkNsaWNrIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiZnVuYyIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBLE1BQU1BLFdBQVcsR0FBRyw2RkFBcEI7QUFFTyxNQUFNQyxJQUFJLEdBQUcsTUFBYjs7QUFDQSxNQUFNQyxPQUFPLEdBQUcsU0FBaEI7O0FBQ0EsTUFBTUMsUUFBUSxHQUFHLFVBQWpCOztBQUVBLE1BQU1DLEtBQUssR0FBRztBQUNqQkgsRUFBQUEsSUFBSSxFQUFFO0FBQ0ZJLElBQUFBLEVBQUUsRUFBRUosSUFERjtBQUVGSyxJQUFBQSxLQUFLLEVBQUUsTUFBTSx5QkFBRyxNQUFILENBRlg7QUFHRkMsSUFBQUEsSUFBSSxFQUFFLG1CQUFNO0FBQUssTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyw0Q0FBRDtBQUFqQixNQUhWO0FBSUZDLElBQUFBLFdBQVcsRUFBRSxNQUFNLHlCQUFHLHFEQUFILENBSmpCO0FBS0ZDLElBQUFBLFlBQVksRUFBRSx5QkFBU0MseUNBQVQsRUFBZ0M7QUFDMUNDLE1BQUFBLEtBQUssRUFBRSxrQ0FEbUM7QUFFMUNDLE1BQUFBLE1BQU0sRUFBRSxZQUZrQztBQUcxQ0MsTUFBQUEsaUJBQWlCLEVBQUUsS0FIdUI7QUFJMUNDLE1BQUFBLEtBQUssRUFBRTtBQUptQyxLQUFoQztBQUxaLEdBRFc7QUFhakJiLEVBQUFBLE9BQU8sRUFBRTtBQUNMRyxJQUFBQSxFQUFFLEVBQUVILE9BREM7QUFFTEksSUFBQUEsS0FBSyxFQUFFLE1BQU0seUJBQUcsU0FBSCxDQUZSO0FBR0xDLElBQUFBLElBQUksRUFBRSxtQkFBTTtBQUFLLE1BQUEsR0FBRyxFQUFFQyxPQUFPLENBQUMseUNBQUQ7QUFBakIsTUFIUDtBQUlMQyxJQUFBQSxXQUFXLEVBQUUsTUFBTSx5QkFBRyxxREFBSCxFQUEwRCxFQUExRCxFQUE4RDtBQUM3RU8sTUFBQUEsQ0FBQyxFQUFFQyxHQUFHLGlCQUFJO0FBQUcsUUFBQSxJQUFJLEVBQUVqQixXQUFUO0FBQXNCLFFBQUEsTUFBTSxFQUFDLFFBQTdCO0FBQXNDLFFBQUEsR0FBRyxFQUFDO0FBQTFDLFNBQ0xpQixHQURLO0FBRG1FLEtBQTlELENBSmQ7QUFTTEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFUZCxHQWJRO0FBd0JqQmYsRUFBQUEsUUFBUSxFQUFFO0FBQ05FLElBQUFBLEVBQUUsRUFBRUYsUUFERTtBQUVORyxJQUFBQSxLQUFLLEVBQUUsTUFBTSx5QkFBRyxVQUFILENBRlA7QUFHTkMsSUFBQUEsSUFBSSxFQUFFLG1CQUFNLHVEQUNSO0FBQUssTUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQyxrREFBRDtBQUFqQixNQURRLEVBRVAseUJBQUcsT0FBSCxDQUZPLENBSE47QUFPTkMsSUFBQUEsV0FBVyxFQUFFLE1BQU0seUJBQUcsa0RBQUg7QUFQYjtBQXhCTyxDQUFkOzs7QUFtQ0EsU0FBU1UsdUJBQVQsQ0FBaUNDLE1BQWpDLEVBQXlDO0FBQzVDLFFBQU07QUFBQ1IsSUFBQUE7QUFBRCxNQUFVUSxNQUFoQjs7QUFDQSxNQUFJLENBQUNSLEtBQUwsRUFBWTtBQUNSLFdBQU8sSUFBUDtBQUNILEdBRkQsTUFFTyxJQUFJQSxLQUFLLEtBQUtSLEtBQUssQ0FBQ0gsSUFBTixDQUFXUyxZQUFYLENBQXdCRSxLQUF0QyxFQUE2QztBQUNoRCxXQUFPWCxJQUFQO0FBQ0gsR0FGTSxNQUVBLElBQUksSUFBSW9CLEdBQUosQ0FBUVQsS0FBUixFQUFlVSxRQUFmLENBQXdCQyxRQUF4QixDQUFpQyxhQUFqQyxDQUFKLEVBQXFEO0FBQ3hEO0FBQ0E7QUFDQSxXQUFPckIsT0FBUDtBQUNILEdBSk0sTUFJQTtBQUNILFdBQU9DLFFBQVA7QUFDSDtBQUNKOztBQUVjLE1BQU1xQixrQkFBTixTQUFpQ0MsZUFBTUMsYUFBdkMsQ0FBcUQ7QUFRaEVDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLG1EQXdCUkMsQ0FBRCxJQUFPO0FBQ2JBLE1BQUFBLENBQUMsQ0FBQ0MsZUFBRjtBQUNBLFlBQU1DLElBQUksR0FBR0YsQ0FBQyxDQUFDRyxhQUFGLENBQWdCQyxPQUFoQixDQUF3QjVCLEVBQXJDO0FBQ0EsV0FBSzZCLGtCQUFMLENBQXdCSCxJQUF4QjtBQUNILEtBNUJrQjtBQUdmLFVBQU07QUFDRkksTUFBQUE7QUFERSxRQUVGUCxLQUZKO0FBSUEsU0FBS1EsS0FBTCxHQUFhO0FBQ1RELE1BQUFBO0FBRFMsS0FBYjtBQUdIOztBQUVERCxFQUFBQSxrQkFBa0IsQ0FBQ0gsSUFBRCxFQUFPO0FBQ3JCLFFBQUksS0FBS0ssS0FBTCxDQUFXRCxRQUFYLEtBQXdCSixJQUE1QixFQUFrQztBQUM5QjtBQUNIOztBQUNELFNBQUtNLFFBQUwsQ0FBYztBQUNWRixNQUFBQSxRQUFRLEVBQUVKO0FBREEsS0FBZDs7QUFHQSxRQUFJLEtBQUtILEtBQUwsQ0FBV1UsUUFBZixFQUF5QjtBQUNyQixXQUFLVixLQUFMLENBQVdVLFFBQVgsQ0FBb0JQLElBQXBCO0FBQ0g7QUFDSjs7QUFRRFEsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsZ0JBQWdCLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwyQkFBakIsQ0FBekI7QUFFQSxVQUFNQyxXQUFXLEdBQUcsRUFBcEI7O0FBQ0EsU0FBSyxNQUFNWixJQUFYLElBQW1CYSxNQUFNLENBQUNDLE1BQVAsQ0FBY3pDLEtBQWQsQ0FBbkIsRUFBeUM7QUFDckMsWUFBTTtBQUFFQyxRQUFBQSxFQUFGO0FBQU1DLFFBQUFBLEtBQU47QUFBYUMsUUFBQUEsSUFBYjtBQUFtQkUsUUFBQUE7QUFBbkIsVUFBbUNzQixJQUF6QztBQUNBLFlBQU1lLE9BQU8sR0FBRyx5QkFDWiw0QkFEWSx1Q0FFa0J6QyxFQUZsQixHQUdaO0FBQ0ksK0NBQXVDQSxFQUFFLEtBQUssS0FBSytCLEtBQUwsQ0FBV0Q7QUFEN0QsT0FIWSxDQUFoQjtBQVFBUSxNQUFBQSxXQUFXLENBQUNJLElBQVosZUFBaUI7QUFBSyxRQUFBLFNBQVMsRUFBRUQsT0FBaEI7QUFBeUIsUUFBQSxHQUFHLEVBQUV6QztBQUE5QixzQkFDYjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FDS0MsS0FBSyxFQURWLENBRGEsZUFJYiw2QkFBQyxnQkFBRDtBQUFrQixRQUFBLE9BQU8sRUFBRSxLQUFLMEMsT0FBaEM7QUFBeUMsbUJBQVMzQztBQUFsRCxzQkFDSTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FDS0UsSUFBSSxFQURULENBREosZUFJSTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FDS0UsV0FBVyxFQURoQixDQUpKLENBSmEsQ0FBakI7QUFhSDs7QUFFRCx3QkFBTztBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDRmtDLFdBREUsQ0FBUDtBQUdIOztBQXRFK0Q7Ozs4QkFBL0NuQixrQixlQUNFO0FBQ2Y7QUFDQVcsRUFBQUEsUUFBUSxFQUFFYyxtQkFBVUMsTUFGTDtBQUdmO0FBQ0FaLEVBQUFBLFFBQVEsRUFBRVcsbUJBQVVFLElBQVYsQ0FBZUM7QUFKVixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQge1ZhbGlkYXRlZFNlcnZlckNvbmZpZ30gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL0F1dG9EaXNjb3ZlcnlVdGlsc1wiO1xuaW1wb3J0IHttYWtlVHlwZX0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL1R5cGVVdGlsc1wiO1xuXG5jb25zdCBNT0RVTEFSX1VSTCA9ICdodHRwczovL21vZHVsYXIuaW0vP3V0bV9zb3VyY2U9cmlvdC13ZWImdXRtX21lZGl1bT13ZWImdXRtX2NhbXBhaWduPXJpb3Qtd2ViLWF1dGhlbnRpY2F0aW9uJztcblxuZXhwb3J0IGNvbnN0IEZSRUUgPSAnRnJlZSc7XG5leHBvcnQgY29uc3QgUFJFTUlVTSA9ICdQcmVtaXVtJztcbmV4cG9ydCBjb25zdCBBRFZBTkNFRCA9ICdBZHZhbmNlZCc7XG5cbmV4cG9ydCBjb25zdCBUWVBFUyA9IHtcbiAgICBGUkVFOiB7XG4gICAgICAgIGlkOiBGUkVFLFxuICAgICAgICBsYWJlbDogKCkgPT4gX3QoJ0ZyZWUnKSxcbiAgICAgICAgbG9nbzogKCkgPT4gPGltZyBzcmM9e3JlcXVpcmUoJy4uLy4uLy4uLy4uL3Jlcy9pbWcvbWF0cml4LW9yZy1idy1sb2dvLnN2ZycpfSAvPixcbiAgICAgICAgZGVzY3JpcHRpb246ICgpID0+IF90KCdKb2luIG1pbGxpb25zIGZvciBmcmVlIG9uIHRoZSBsYXJnZXN0IHB1YmxpYyBzZXJ2ZXInKSxcbiAgICAgICAgc2VydmVyQ29uZmlnOiBtYWtlVHlwZShWYWxpZGF0ZWRTZXJ2ZXJDb25maWcsIHtcbiAgICAgICAgICAgIGhzVXJsOiBcImh0dHBzOi8vbWF0cml4LWNsaWVudC5tYXRyaXgub3JnXCIsXG4gICAgICAgICAgICBoc05hbWU6IFwibWF0cml4Lm9yZ1wiLFxuICAgICAgICAgICAgaHNOYW1lSXNEaWZmZXJlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgaXNVcmw6IFwiaHR0cHM6Ly92ZWN0b3IuaW1cIixcbiAgICAgICAgfSksXG4gICAgfSxcbiAgICBQUkVNSVVNOiB7XG4gICAgICAgIGlkOiBQUkVNSVVNLFxuICAgICAgICBsYWJlbDogKCkgPT4gX3QoJ1ByZW1pdW0nKSxcbiAgICAgICAgbG9nbzogKCkgPT4gPGltZyBzcmM9e3JlcXVpcmUoJy4uLy4uLy4uLy4uL3Jlcy9pbWcvbW9kdWxhci1idy1sb2dvLnN2ZycpfSAvPixcbiAgICAgICAgZGVzY3JpcHRpb246ICgpID0+IF90KCdQcmVtaXVtIGhvc3RpbmcgZm9yIG9yZ2FuaXNhdGlvbnMgPGE+TGVhcm4gbW9yZTwvYT4nLCB7fSwge1xuICAgICAgICAgICAgYTogc3ViID0+IDxhIGhyZWY9e01PRFVMQVJfVVJMfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCI+XG4gICAgICAgICAgICAgICAge3N1Yn1cbiAgICAgICAgICAgIDwvYT4sXG4gICAgICAgIH0pLFxuICAgICAgICBpZGVudGl0eVNlcnZlclVybDogXCJodHRwczovL3ZlY3Rvci5pbVwiLFxuICAgIH0sXG4gICAgQURWQU5DRUQ6IHtcbiAgICAgICAgaWQ6IEFEVkFOQ0VELFxuICAgICAgICBsYWJlbDogKCkgPT4gX3QoJ0FkdmFuY2VkJyksXG4gICAgICAgIGxvZ286ICgpID0+IDxkaXY+XG4gICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZSgnLi4vLi4vLi4vLi4vcmVzL2ltZy9mZWF0aGVyLWN1c3RvbWlzZWQvZ2xvYmUuc3ZnJyl9IC8+XG4gICAgICAgICAgICB7X3QoJ090aGVyJyl9XG4gICAgICAgIDwvZGl2PixcbiAgICAgICAgZGVzY3JpcHRpb246ICgpID0+IF90KCdGaW5kIG90aGVyIHB1YmxpYyBzZXJ2ZXJzIG9yIHVzZSBhIGN1c3RvbSBzZXJ2ZXInKSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGVGcm9tU2VydmVyQ29uZmlnKGNvbmZpZykge1xuICAgIGNvbnN0IHtoc1VybH0gPSBjb25maWc7XG4gICAgaWYgKCFoc1VybCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKGhzVXJsID09PSBUWVBFUy5GUkVFLnNlcnZlckNvbmZpZy5oc1VybCkge1xuICAgICAgICByZXR1cm4gRlJFRTtcbiAgICB9IGVsc2UgaWYgKG5ldyBVUkwoaHNVcmwpLmhvc3RuYW1lLmVuZHNXaXRoKCcubW9kdWxhci5pbScpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYW4gdW5saWtlbHkgY2FzZSB0byByZWFjaCwgYXMgTW9kdWxhciBkZWZhdWx0cyB0byBoaWRpbmcgdGhlXG4gICAgICAgIC8vIHNlcnZlciB0eXBlIHNlbGVjdG9yLlxuICAgICAgICByZXR1cm4gUFJFTUlVTTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQURWQU5DRUQ7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2ZXJUeXBlU2VsZWN0b3IgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBUaGUgZGVmYXVsdCBzZWxlY3RlZCB0eXBlLlxuICAgICAgICBzZWxlY3RlZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gSGFuZGxlciBjYWxsZWQgd2hlbiB0aGUgc2VsZWN0ZWQgdHlwZSBjaGFuZ2VzLlxuICAgICAgICBvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNlbGVjdGVkLFxuICAgICAgICB9ID0gcHJvcHM7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHNlbGVjdGVkLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHVwZGF0ZVNlbGVjdGVkVHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkID09PSB0eXBlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzZWxlY3RlZDogdHlwZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQ2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKHR5cGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25DbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pZDtcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZFR5cGUodHlwZSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcblxuICAgICAgICBjb25zdCBzZXJ2ZXJUeXBlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHR5cGUgb2YgT2JqZWN0LnZhbHVlcyhUWVBFUykpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgaWQsIGxhYmVsLCBsb2dvLCBkZXNjcmlwdGlvbiB9ID0gdHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc25hbWVzKFxuICAgICAgICAgICAgICAgIFwibXhfU2VydmVyVHlwZVNlbGVjdG9yX3R5cGVcIixcbiAgICAgICAgICAgICAgICBgbXhfU2VydmVyVHlwZVNlbGVjdG9yX3R5cGVfJHtpZH1gLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJteF9TZXJ2ZXJUeXBlU2VsZWN0b3JfdHlwZV9zZWxlY3RlZFwiOiBpZCA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgc2VydmVyVHlwZXMucHVzaCg8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30ga2V5PXtpZH0gPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2VydmVyVHlwZVNlbGVjdG9yX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgIHtsYWJlbCgpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMub25DbGlja30gZGF0YS1pZD17aWR9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NlcnZlclR5cGVTZWxlY3Rvcl9sb2dvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bG9nbygpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXJ2ZXJUeXBlU2VsZWN0b3JfZGVzY3JpcHRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtkZXNjcmlwdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfU2VydmVyVHlwZVNlbGVjdG9yXCI+XG4gICAgICAgICAgICB7c2VydmVyVHlwZXN9XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG4iXX0=