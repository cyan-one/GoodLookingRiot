"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../languageHandler");

var _IntegrationManagers = require("../../../integrations/IntegrationManagers");

var sdk = _interopRequireWildcard(require("../../../index"));

var _SettingsStore = _interopRequireWildcard(require("../../../settings/SettingsStore"));

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
class SetIntegrationManager extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "onProvisioningToggled", () => {
      const current = this.state.provisioningEnabled;

      _SettingsStore.default.setValue("integrationProvisioning", null, _SettingsStore.SettingLevel.ACCOUNT, !current).catch(err => {
        console.error("Error changing integration manager provisioning");
        console.error(err);
        this.setState({
          provisioningEnabled: current
        });
      });

      this.setState({
        provisioningEnabled: !current
      });
    });

    const currentManager = _IntegrationManagers.IntegrationManagers.sharedInstance().getPrimaryManager();

    this.state = {
      currentManager,
      provisioningEnabled: _SettingsStore.default.getValue("integrationProvisioning")
    };
  }

  render() {
    const ToggleSwitch = sdk.getComponent("views.elements.ToggleSwitch");
    const currentManager = this.state.currentManager;
    let managerName;
    let bodyText;

    if (currentManager) {
      managerName = "(".concat(currentManager.name, ")");
      bodyText = (0, _languageHandler._t)("Use an Integration Manager <b>(%(serverName)s)</b> to manage bots, widgets, " + "and sticker packs.", {
        serverName: currentManager.name
      }, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      });
    } else {
      bodyText = (0, _languageHandler._t)("Use an Integration Manager to manage bots, widgets, and sticker packs.");
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SetIntegrationManager"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Manage integrations")), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, managerName), /*#__PURE__*/_react.default.createElement(ToggleSwitch, {
      checked: this.state.provisioningEnabled,
      onChange: this.onProvisioningToggled
    })), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subsectionText"
    }, bodyText, /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Integration Managers receive configuration data, and can modify widgets, " + "send room invites, and set power levels on your behalf.")));
  }

}

exports.default = SetIntegrationManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL1NldEludGVncmF0aW9uTWFuYWdlci5qcyJdLCJuYW1lcyI6WyJTZXRJbnRlZ3JhdGlvbk1hbmFnZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiY3VycmVudCIsInN0YXRlIiwicHJvdmlzaW9uaW5nRW5hYmxlZCIsIlNldHRpbmdzU3RvcmUiLCJzZXRWYWx1ZSIsIlNldHRpbmdMZXZlbCIsIkFDQ09VTlQiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsInNldFN0YXRlIiwiY3VycmVudE1hbmFnZXIiLCJJbnRlZ3JhdGlvbk1hbmFnZXJzIiwic2hhcmVkSW5zdGFuY2UiLCJnZXRQcmltYXJ5TWFuYWdlciIsImdldFZhbHVlIiwicmVuZGVyIiwiVG9nZ2xlU3dpdGNoIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwibWFuYWdlck5hbWUiLCJib2R5VGV4dCIsIm5hbWUiLCJzZXJ2ZXJOYW1lIiwiYiIsInN1YiIsIm9uUHJvdmlzaW9uaW5nVG9nZ2xlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7OztBQXNCZSxNQUFNQSxxQkFBTixTQUFvQ0MsZUFBTUMsU0FBMUMsQ0FBb0Q7QUFDL0RDLEVBQUFBLFdBQVcsR0FBRztBQUNWO0FBRFUsaUVBV1UsTUFBTTtBQUMxQixZQUFNQyxPQUFPLEdBQUcsS0FBS0MsS0FBTCxDQUFXQyxtQkFBM0I7O0FBQ0FDLDZCQUFjQyxRQUFkLENBQXVCLHlCQUF2QixFQUFrRCxJQUFsRCxFQUF3REMsNEJBQWFDLE9BQXJFLEVBQThFLENBQUNOLE9BQS9FLEVBQXdGTyxLQUF4RixDQUE4RkMsR0FBRyxJQUFJO0FBQ2pHQyxRQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxpREFBZDtBQUNBRCxRQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY0YsR0FBZDtBQUVBLGFBQUtHLFFBQUwsQ0FBYztBQUFDVCxVQUFBQSxtQkFBbUIsRUFBRUY7QUFBdEIsU0FBZDtBQUNILE9BTEQ7O0FBTUEsV0FBS1csUUFBTCxDQUFjO0FBQUNULFFBQUFBLG1CQUFtQixFQUFFLENBQUNGO0FBQXZCLE9BQWQ7QUFDSCxLQXBCYTs7QUFHVixVQUFNWSxjQUFjLEdBQUdDLHlDQUFvQkMsY0FBcEIsR0FBcUNDLGlCQUFyQyxFQUF2Qjs7QUFFQSxTQUFLZCxLQUFMLEdBQWE7QUFDVFcsTUFBQUEsY0FEUztBQUVUVixNQUFBQSxtQkFBbUIsRUFBRUMsdUJBQWNhLFFBQWQsQ0FBdUIseUJBQXZCO0FBRlosS0FBYjtBQUlIOztBQWFEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxZQUFZLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw2QkFBakIsQ0FBckI7QUFFQSxVQUFNUixjQUFjLEdBQUcsS0FBS1gsS0FBTCxDQUFXVyxjQUFsQztBQUNBLFFBQUlTLFdBQUo7QUFDQSxRQUFJQyxRQUFKOztBQUNBLFFBQUlWLGNBQUosRUFBb0I7QUFDaEJTLE1BQUFBLFdBQVcsY0FBT1QsY0FBYyxDQUFDVyxJQUF0QixNQUFYO0FBQ0FELE1BQUFBLFFBQVEsR0FBRyx5QkFDUCxpRkFDQSxvQkFGTyxFQUdQO0FBQUNFLFFBQUFBLFVBQVUsRUFBRVosY0FBYyxDQUFDVztBQUE1QixPQUhPLEVBSVA7QUFBRUUsUUFBQUEsQ0FBQyxFQUFFQyxHQUFHLGlCQUFJLHdDQUFJQSxHQUFKO0FBQVosT0FKTyxDQUFYO0FBTUgsS0FSRCxNQVFPO0FBQ0hKLE1BQUFBLFFBQVEsR0FBRyx5QkFBRyx3RUFBSCxDQUFYO0FBQ0g7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSwyQ0FBTyx5QkFBRyxxQkFBSCxDQUFQLENBREosZUFFSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQTZDRCxXQUE3QyxDQUZKLGVBR0ksNkJBQUMsWUFBRDtBQUFjLE1BQUEsT0FBTyxFQUFFLEtBQUtwQixLQUFMLENBQVdDLG1CQUFsQztBQUF1RCxNQUFBLFFBQVEsRUFBRSxLQUFLeUI7QUFBdEUsTUFISixDQURKLGVBTUk7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUNLTCxRQURMLGVBRUksd0NBRkosZUFHSSx3Q0FISixFQUlLLHlCQUNHLDhFQUNBLHlEQUZILENBSkwsQ0FOSixDQURKO0FBa0JIOztBQTNEOEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi4vLi4vLi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0SW50ZWdyYXRpb25NYW5hZ2VyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBjb25zdCBjdXJyZW50TWFuYWdlciA9IEludGVncmF0aW9uTWFuYWdlcnMuc2hhcmVkSW5zdGFuY2UoKS5nZXRQcmltYXJ5TWFuYWdlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBjdXJyZW50TWFuYWdlcixcbiAgICAgICAgICAgIHByb3Zpc2lvbmluZ0VuYWJsZWQ6IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJpbnRlZ3JhdGlvblByb3Zpc2lvbmluZ1wiKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvblByb3Zpc2lvbmluZ1RvZ2dsZWQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnN0YXRlLnByb3Zpc2lvbmluZ0VuYWJsZWQ7XG4gICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJpbnRlZ3JhdGlvblByb3Zpc2lvbmluZ1wiLCBudWxsLCBTZXR0aW5nTGV2ZWwuQUNDT1VOVCwgIWN1cnJlbnQpLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2hhbmdpbmcgaW50ZWdyYXRpb24gbWFuYWdlciBwcm92aXNpb25pbmdcIik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb3Zpc2lvbmluZ0VuYWJsZWQ6IGN1cnJlbnR9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb3Zpc2lvbmluZ0VuYWJsZWQ6ICFjdXJyZW50fSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgVG9nZ2xlU3dpdGNoID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmVsZW1lbnRzLlRvZ2dsZVN3aXRjaFwiKTtcblxuICAgICAgICBjb25zdCBjdXJyZW50TWFuYWdlciA9IHRoaXMuc3RhdGUuY3VycmVudE1hbmFnZXI7XG4gICAgICAgIGxldCBtYW5hZ2VyTmFtZTtcbiAgICAgICAgbGV0IGJvZHlUZXh0O1xuICAgICAgICBpZiAoY3VycmVudE1hbmFnZXIpIHtcbiAgICAgICAgICAgIG1hbmFnZXJOYW1lID0gYCgke2N1cnJlbnRNYW5hZ2VyLm5hbWV9KWA7XG4gICAgICAgICAgICBib2R5VGV4dCA9IF90KFxuICAgICAgICAgICAgICAgIFwiVXNlIGFuIEludGVncmF0aW9uIE1hbmFnZXIgPGI+KCUoc2VydmVyTmFtZSlzKTwvYj4gdG8gbWFuYWdlIGJvdHMsIHdpZGdldHMsIFwiICtcbiAgICAgICAgICAgICAgICBcImFuZCBzdGlja2VyIHBhY2tzLlwiLFxuICAgICAgICAgICAgICAgIHtzZXJ2ZXJOYW1lOiBjdXJyZW50TWFuYWdlci5uYW1lfSxcbiAgICAgICAgICAgICAgICB7IGI6IHN1YiA9PiA8Yj57c3VifTwvYj4gfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBib2R5VGV4dCA9IF90KFwiVXNlIGFuIEludGVncmF0aW9uIE1hbmFnZXIgdG8gbWFuYWdlIGJvdHMsIHdpZGdldHMsIGFuZCBzdGlja2VyIHBhY2tzLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0SW50ZWdyYXRpb25NYW5hZ2VyJz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX2hlYWRpbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e190KFwiTWFuYWdlIGludGVncmF0aW9uc1wiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YmhlYWRpbmdcIj57bWFuYWdlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8VG9nZ2xlU3dpdGNoIGNoZWNrZWQ9e3RoaXMuc3RhdGUucHJvdmlzaW9uaW5nRW5hYmxlZH0gb25DaGFuZ2U9e3RoaXMub25Qcm92aXNpb25pbmdUb2dnbGVkfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHtib2R5VGV4dH1cbiAgICAgICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkludGVncmF0aW9uIE1hbmFnZXJzIHJlY2VpdmUgY29uZmlndXJhdGlvbiBkYXRhLCBhbmQgY2FuIG1vZGlmeSB3aWRnZXRzLCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlbmQgcm9vbSBpbnZpdGVzLCBhbmQgc2V0IHBvd2VyIGxldmVscyBvbiB5b3VyIGJlaGFsZi5cIixcbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=