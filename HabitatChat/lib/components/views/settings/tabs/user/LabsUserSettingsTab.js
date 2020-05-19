"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.LabsSettingToggle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../../../languageHandler");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _SettingsStore = _interopRequireWildcard(require("../../../../../settings/SettingsStore"));

var _LabelledToggleSwitch = _interopRequireDefault(require("../../../elements/LabelledToggleSwitch"));

var sdk = _interopRequireWildcard(require("../../../../../index"));

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
class LabsSettingToggle extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onChange", async checked => {
      await _SettingsStore.default.setFeatureEnabled(this.props.featureId, checked);
      this.forceUpdate();
    });
  }

  render() {
    const label = _SettingsStore.default.getDisplayName(this.props.featureId);

    const value = _SettingsStore.default.isFeatureEnabled(this.props.featureId);

    return /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: value,
      label: label,
      onChange: this._onChange
    });
  }

}

exports.LabsSettingToggle = LabsSettingToggle;
(0, _defineProperty2.default)(LabsSettingToggle, "propTypes", {
  featureId: _propTypes.default.string.isRequired
});

class LabsUserSettingsTab extends _react.default.Component {
  constructor() {
    super();
  }

  render() {
    const SettingsFlag = sdk.getComponent("views.elements.SettingsFlag");

    const flags = _SettingsStore.default.getLabsFeatures().map(f => /*#__PURE__*/_react.default.createElement(LabsSettingToggle, {
      featureId: f,
      key: f
    }));

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Labs")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)('Customise your experience with experimental labs features. ' + '<a>Learn more</a>.', {}, {
      'a': sub => {
        return /*#__PURE__*/_react.default.createElement("a", {
          href: "https://github.com/vector-im/riot-web/blob/develop/docs/labs.md",
          rel: "noreferrer noopener",
          target: "_blank"
        }, sub);
      }
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, flags, /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "enableWidgetScreenshots",
      level: _SettingsStore.SettingLevel.ACCOUNT
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "showHiddenEventsInTimeline",
      level: _SettingsStore.SettingLevel.DEVICE
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "lowBandwidth",
      level: _SettingsStore.SettingLevel.DEVICE
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "sendReadReceipts",
      level: _SettingsStore.SettingLevel.ACCOUNT
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "keepSecretStoragePassphraseForSession",
      level: _SettingsStore.SettingLevel.DEVICE
    })));
  }

}

exports.default = LabsUserSettingsTab;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvdXNlci9MYWJzVXNlclNldHRpbmdzVGFiLmpzIl0sIm5hbWVzIjpbIkxhYnNTZXR0aW5nVG9nZ2xlIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjaGVja2VkIiwiU2V0dGluZ3NTdG9yZSIsInNldEZlYXR1cmVFbmFibGVkIiwicHJvcHMiLCJmZWF0dXJlSWQiLCJmb3JjZVVwZGF0ZSIsInJlbmRlciIsImxhYmVsIiwiZ2V0RGlzcGxheU5hbWUiLCJ2YWx1ZSIsImlzRmVhdHVyZUVuYWJsZWQiLCJfb25DaGFuZ2UiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIiwiTGFic1VzZXJTZXR0aW5nc1RhYiIsImNvbnN0cnVjdG9yIiwiU2V0dGluZ3NGbGFnIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZmxhZ3MiLCJnZXRMYWJzRmVhdHVyZXMiLCJtYXAiLCJmIiwic3ViIiwiU2V0dGluZ0xldmVsIiwiQUNDT1VOVCIsIkRFVklDRSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQXVCTyxNQUFNQSxpQkFBTixTQUFnQ0MsZUFBTUMsU0FBdEMsQ0FBZ0Q7QUFBQTtBQUFBO0FBQUEscURBS3ZDLE1BQU9DLE9BQVAsSUFBbUI7QUFDM0IsWUFBTUMsdUJBQWNDLGlCQUFkLENBQWdDLEtBQUtDLEtBQUwsQ0FBV0MsU0FBM0MsRUFBc0RKLE9BQXRELENBQU47QUFDQSxXQUFLSyxXQUFMO0FBQ0gsS0FSa0Q7QUFBQTs7QUFVbkRDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLEtBQUssR0FBR04sdUJBQWNPLGNBQWQsQ0FBNkIsS0FBS0wsS0FBTCxDQUFXQyxTQUF4QyxDQUFkOztBQUNBLFVBQU1LLEtBQUssR0FBR1IsdUJBQWNTLGdCQUFkLENBQStCLEtBQUtQLEtBQUwsQ0FBV0MsU0FBMUMsQ0FBZDs7QUFDQSx3QkFBTyw2QkFBQyw2QkFBRDtBQUFzQixNQUFBLEtBQUssRUFBRUssS0FBN0I7QUFBb0MsTUFBQSxLQUFLLEVBQUVGLEtBQTNDO0FBQWtELE1BQUEsUUFBUSxFQUFFLEtBQUtJO0FBQWpFLE1BQVA7QUFDSDs7QUFka0Q7Ozs4QkFBMUNkLGlCLGVBQ1U7QUFDZk8sRUFBQUEsU0FBUyxFQUFFUSxtQkFBVUMsTUFBVixDQUFpQkM7QUFEYixDOztBQWdCUixNQUFNQyxtQkFBTixTQUFrQ2pCLGVBQU1DLFNBQXhDLENBQWtEO0FBQzdEaUIsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFDSDs7QUFFRFYsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTVcsWUFBWSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsNkJBQWpCLENBQXJCOztBQUNBLFVBQU1DLEtBQUssR0FBR25CLHVCQUFjb0IsZUFBZCxHQUFnQ0MsR0FBaEMsQ0FBb0NDLENBQUMsaUJBQUksNkJBQUMsaUJBQUQ7QUFBbUIsTUFBQSxTQUFTLEVBQUVBLENBQTlCO0FBQWlDLE1BQUEsR0FBRyxFQUFFQTtBQUF0QyxNQUF6QyxDQUFkOztBQUNBLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBeUMseUJBQUcsTUFBSCxDQUF6QyxDQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BRVEseUJBQUcsZ0VBQ0Msb0JBREosRUFDMEIsRUFEMUIsRUFDOEI7QUFDMUIsV0FBTUMsR0FBRCxJQUFTO0FBQ1YsNEJBQU87QUFBRyxVQUFBLElBQUksRUFBQyxpRUFBUjtBQUNILFVBQUEsR0FBRyxFQUFDLHFCQUREO0FBQ3VCLFVBQUEsTUFBTSxFQUFDO0FBRDlCLFdBQ3dDQSxHQUR4QyxDQUFQO0FBRUg7QUFKeUIsS0FEOUIsQ0FGUixDQUZKLGVBYUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0tKLEtBREwsZUFFSSw2QkFBQyxZQUFEO0FBQWMsTUFBQSxJQUFJLEVBQUUseUJBQXBCO0FBQStDLE1BQUEsS0FBSyxFQUFFSyw0QkFBYUM7QUFBbkUsTUFGSixlQUdJLDZCQUFDLFlBQUQ7QUFBYyxNQUFBLElBQUksRUFBRSw0QkFBcEI7QUFBa0QsTUFBQSxLQUFLLEVBQUVELDRCQUFhRTtBQUF0RSxNQUhKLGVBSUksNkJBQUMsWUFBRDtBQUFjLE1BQUEsSUFBSSxFQUFFLGNBQXBCO0FBQW9DLE1BQUEsS0FBSyxFQUFFRiw0QkFBYUU7QUFBeEQsTUFKSixlQUtJLDZCQUFDLFlBQUQ7QUFBYyxNQUFBLElBQUksRUFBRSxrQkFBcEI7QUFBd0MsTUFBQSxLQUFLLEVBQUVGLDRCQUFhQztBQUE1RCxNQUxKLGVBTUksNkJBQUMsWUFBRDtBQUFjLE1BQUEsSUFBSSxFQUFFLHVDQUFwQjtBQUE2RCxNQUFBLEtBQUssRUFBRUQsNEJBQWFFO0FBQWpGLE1BTkosQ0FiSixDQURKO0FBd0JIOztBQWhDNEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUsIHtTZXR0aW5nTGV2ZWx9IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgTGFiZWxsZWRUb2dnbGVTd2l0Y2ggZnJvbSBcIi4uLy4uLy4uL2VsZW1lbnRzL0xhYmVsbGVkVG9nZ2xlU3dpdGNoXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBMYWJzU2V0dGluZ1RvZ2dsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZmVhdHVyZUlkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIF9vbkNoYW5nZSA9IGFzeW5jIChjaGVja2VkKSA9PiB7XG4gICAgICAgIGF3YWl0IFNldHRpbmdzU3RvcmUuc2V0RmVhdHVyZUVuYWJsZWQodGhpcy5wcm9wcy5mZWF0dXJlSWQsIGNoZWNrZWQpO1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgbGFiZWwgPSBTZXR0aW5nc1N0b3JlLmdldERpc3BsYXlOYW1lKHRoaXMucHJvcHMuZmVhdHVyZUlkKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTZXR0aW5nc1N0b3JlLmlzRmVhdHVyZUVuYWJsZWQodGhpcy5wcm9wcy5mZWF0dXJlSWQpO1xuICAgICAgICByZXR1cm4gPExhYmVsbGVkVG9nZ2xlU3dpdGNoIHZhbHVlPXt2YWx1ZX0gbGFiZWw9e2xhYmVsfSBvbkNoYW5nZT17dGhpcy5fb25DaGFuZ2V9IC8+O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGFic1VzZXJTZXR0aW5nc1RhYiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBTZXR0aW5nc0ZsYWcgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuU2V0dGluZ3NGbGFnXCIpO1xuICAgICAgICBjb25zdCBmbGFncyA9IFNldHRpbmdzU3RvcmUuZ2V0TGFic0ZlYXR1cmVzKCkubWFwKGYgPT4gPExhYnNTZXR0aW5nVG9nZ2xlIGZlYXR1cmVJZD17Zn0ga2V5PXtmfSAvPik7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9oZWFkaW5nXCI+e190KFwiTGFic1wiKX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdCgnQ3VzdG9taXNlIHlvdXIgZXhwZXJpZW5jZSB3aXRoIGV4cGVyaW1lbnRhbCBsYWJzIGZlYXR1cmVzLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGE+TGVhcm4gbW9yZTwvYT4uJywge30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYSc6IChzdWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2Jsb2IvZGV2ZWxvcC9kb2NzL2xhYnMubWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsPSdub3JlZmVycmVyIG5vb3BlbmVyJyB0YXJnZXQ9J19ibGFuayc+e3N1Yn08L2E+O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHtmbGFnc31cbiAgICAgICAgICAgICAgICAgICAgPFNldHRpbmdzRmxhZyBuYW1lPXtcImVuYWJsZVdpZGdldFNjcmVlbnNob3RzXCJ9IGxldmVsPXtTZXR0aW5nTGV2ZWwuQUNDT1VOVH0gLz5cbiAgICAgICAgICAgICAgICAgICAgPFNldHRpbmdzRmxhZyBuYW1lPXtcInNob3dIaWRkZW5FdmVudHNJblRpbWVsaW5lXCJ9IGxldmVsPXtTZXR0aW5nTGV2ZWwuREVWSUNFfSAvPlxuICAgICAgICAgICAgICAgICAgICA8U2V0dGluZ3NGbGFnIG5hbWU9e1wibG93QmFuZHdpZHRoXCJ9IGxldmVsPXtTZXR0aW5nTGV2ZWwuREVWSUNFfSAvPlxuICAgICAgICAgICAgICAgICAgICA8U2V0dGluZ3NGbGFnIG5hbWU9e1wic2VuZFJlYWRSZWNlaXB0c1wifSBsZXZlbD17U2V0dGluZ0xldmVsLkFDQ09VTlR9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWcgbmFtZT17XCJrZWVwU2VjcmV0U3RvcmFnZVBhc3NwaHJhc2VGb3JTZXNzaW9uXCJ9IGxldmVsPXtTZXR0aW5nTGV2ZWwuREVWSUNFfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19