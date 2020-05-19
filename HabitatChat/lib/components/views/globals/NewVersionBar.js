"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _PlatformPeg = _interopRequireDefault(require("../../../PlatformPeg"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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

/**
 * Check a version string is compatible with the Changelog
 * dialog ([vectorversion]-react-[react-sdk-version]-js-[js-sdk-version])
 */
function checkVersion(ver) {
  const parts = ver.split('-');
  return parts.length == 5 && parts[1] == 'react' && parts[3] == 'js';
}

var _default = (0, _createReactClass.default)({
  displayName: "NewVersionBar",
  propTypes: {
    version: _propTypes.default.string.isRequired,
    newVersion: _propTypes.default.string.isRequired,
    releaseNotes: _propTypes.default.string
  },
  displayReleaseNotes: function (releaseNotes) {
    const QuestionDialog = sdk.getComponent('dialogs.QuestionDialog');

    _Modal.default.createTrackedDialog('Display release notes', '', QuestionDialog, {
      title: (0, _languageHandler._t)("What's New"),
      description: /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MatrixToolbar_changelog"
      }, releaseNotes),
      button: (0, _languageHandler._t)("Update"),
      onFinished: update => {
        if (update && _PlatformPeg.default.get()) {
          _PlatformPeg.default.get().installUpdate();
        }
      }
    });
  },
  displayChangelog: function () {
    const ChangelogDialog = sdk.getComponent('dialogs.ChangelogDialog');

    _Modal.default.createTrackedDialog('Display Changelog', '', ChangelogDialog, {
      version: this.props.version,
      newVersion: this.props.newVersion,
      onFinished: update => {
        if (update && _PlatformPeg.default.get()) {
          _PlatformPeg.default.get().installUpdate();
        }
      }
    });
  },
  onUpdateClicked: function () {
    _PlatformPeg.default.get().installUpdate();
  },
  render: function () {
    let action_button; // If we have release notes to display, we display them. Otherwise,
    // we display the Changelog Dialog which takes two versions and
    // automatically tells you what's changed (provided the versions
    // are in the right format)

    if (this.props.releaseNotes) {
      action_button = /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_MatrixToolbar_action",
        onClick: this.displayReleaseNotes
      }, (0, _languageHandler._t)("What's new?"));
    } else if (checkVersion(this.props.version) && checkVersion(this.props.newVersion)) {
      action_button = /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_MatrixToolbar_action",
        onClick: this.displayChangelog
      }, (0, _languageHandler._t)("What's new?"));
    } else if (_PlatformPeg.default.get()) {
      action_button = /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_MatrixToolbar_action",
        onClick: this.onUpdateClicked
      }, (0, _languageHandler._t)("Update"));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar"
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_MatrixToolbar_warning",
      src: require("../../../../res/img/warning.svg"),
      width: "24",
      height: "23",
      alt: ""
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, (0, _languageHandler._t)("A new version of Riot is available.")), action_button);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvTmV3VmVyc2lvbkJhci5qcyJdLCJuYW1lcyI6WyJjaGVja1ZlcnNpb24iLCJ2ZXIiLCJwYXJ0cyIsInNwbGl0IiwibGVuZ3RoIiwicHJvcFR5cGVzIiwidmVyc2lvbiIsIlByb3BUeXBlcyIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJuZXdWZXJzaW9uIiwicmVsZWFzZU5vdGVzIiwiZGlzcGxheVJlbGVhc2VOb3RlcyIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImJ1dHRvbiIsIm9uRmluaXNoZWQiLCJ1cGRhdGUiLCJQbGF0Zm9ybVBlZyIsImdldCIsImluc3RhbGxVcGRhdGUiLCJkaXNwbGF5Q2hhbmdlbG9nIiwiQ2hhbmdlbG9nRGlhbG9nIiwicHJvcHMiLCJvblVwZGF0ZUNsaWNrZWQiLCJyZW5kZXIiLCJhY3Rpb25fYnV0dG9uIiwicmVxdWlyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdkJBOzs7Ozs7Ozs7Ozs7Ozs7OztBQXlCQTs7OztBQUlBLFNBQVNBLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQTJCO0FBQ3ZCLFFBQU1DLEtBQUssR0FBR0QsR0FBRyxDQUFDRSxLQUFKLENBQVUsR0FBVixDQUFkO0FBQ0EsU0FBT0QsS0FBSyxDQUFDRSxNQUFOLElBQWdCLENBQWhCLElBQXFCRixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksT0FBakMsSUFBNENBLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxJQUEvRDtBQUNIOztlQUVjLCtCQUFpQjtBQUFBO0FBQzVCRyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsT0FBTyxFQUFFQyxtQkFBVUMsTUFBVixDQUFpQkMsVUFEbkI7QUFFUEMsSUFBQUEsVUFBVSxFQUFFSCxtQkFBVUMsTUFBVixDQUFpQkMsVUFGdEI7QUFHUEUsSUFBQUEsWUFBWSxFQUFFSixtQkFBVUM7QUFIakIsR0FEaUI7QUFPNUJJLEVBQUFBLG1CQUFtQixFQUFFLFVBQVNELFlBQVQsRUFBdUI7QUFDeEMsVUFBTUUsY0FBYyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXZCOztBQUNBQyxtQkFBTUMsbUJBQU4sQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQW5ELEVBQXVESixjQUF2RCxFQUF1RTtBQUNuRUssTUFBQUEsS0FBSyxFQUFFLHlCQUFHLFlBQUgsQ0FENEQ7QUFFbkVDLE1BQUFBLFdBQVcsZUFBRTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FBNkNSLFlBQTdDLENBRnNEO0FBR25FUyxNQUFBQSxNQUFNLEVBQUUseUJBQUcsUUFBSCxDQUgyRDtBQUluRUMsTUFBQUEsVUFBVSxFQUFHQyxNQUFELElBQVk7QUFDcEIsWUFBSUEsTUFBTSxJQUFJQyxxQkFBWUMsR0FBWixFQUFkLEVBQWlDO0FBQzdCRCwrQkFBWUMsR0FBWixHQUFrQkMsYUFBbEI7QUFDSDtBQUNKO0FBUmtFLEtBQXZFO0FBVUgsR0FuQjJCO0FBcUI1QkMsRUFBQUEsZ0JBQWdCLEVBQUUsWUFBVztBQUN6QixVQUFNQyxlQUFlLEdBQUdiLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix5QkFBakIsQ0FBeEI7O0FBQ0FDLG1CQUFNQyxtQkFBTixDQUEwQixtQkFBMUIsRUFBK0MsRUFBL0MsRUFBbURVLGVBQW5ELEVBQW9FO0FBQ2hFckIsTUFBQUEsT0FBTyxFQUFFLEtBQUtzQixLQUFMLENBQVd0QixPQUQ0QztBQUVoRUksTUFBQUEsVUFBVSxFQUFFLEtBQUtrQixLQUFMLENBQVdsQixVQUZ5QztBQUdoRVcsTUFBQUEsVUFBVSxFQUFHQyxNQUFELElBQVk7QUFDcEIsWUFBSUEsTUFBTSxJQUFJQyxxQkFBWUMsR0FBWixFQUFkLEVBQWlDO0FBQzdCRCwrQkFBWUMsR0FBWixHQUFrQkMsYUFBbEI7QUFDSDtBQUNKO0FBUCtELEtBQXBFO0FBU0gsR0FoQzJCO0FBa0M1QkksRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEJOLHlCQUFZQyxHQUFaLEdBQWtCQyxhQUFsQjtBQUNILEdBcEMyQjtBQXNDNUJLLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsUUFBSUMsYUFBSixDQURlLENBRWY7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsUUFBSSxLQUFLSCxLQUFMLENBQVdqQixZQUFmLEVBQTZCO0FBQ3pCb0IsTUFBQUEsYUFBYSxnQkFDVDtBQUFRLFFBQUEsU0FBUyxFQUFDLHlCQUFsQjtBQUE0QyxRQUFBLE9BQU8sRUFBRSxLQUFLbkI7QUFBMUQsU0FDTSx5QkFBRyxhQUFILENBRE4sQ0FESjtBQUtILEtBTkQsTUFNTyxJQUFJWixZQUFZLENBQUMsS0FBSzRCLEtBQUwsQ0FBV3RCLE9BQVosQ0FBWixJQUFvQ04sWUFBWSxDQUFDLEtBQUs0QixLQUFMLENBQVdsQixVQUFaLENBQXBELEVBQTZFO0FBQ2hGcUIsTUFBQUEsYUFBYSxnQkFDVDtBQUFRLFFBQUEsU0FBUyxFQUFDLHlCQUFsQjtBQUE0QyxRQUFBLE9BQU8sRUFBRSxLQUFLTDtBQUExRCxTQUNNLHlCQUFHLGFBQUgsQ0FETixDQURKO0FBS0gsS0FOTSxNQU1BLElBQUlILHFCQUFZQyxHQUFaLEVBQUosRUFBdUI7QUFDMUJPLE1BQUFBLGFBQWEsZ0JBQ1Q7QUFBUSxRQUFBLFNBQVMsRUFBQyx5QkFBbEI7QUFBNEMsUUFBQSxPQUFPLEVBQUUsS0FBS0Y7QUFBMUQsU0FDTSx5QkFBRyxRQUFILENBRE4sQ0FESjtBQUtIOztBQUNELHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLDBCQUFmO0FBQTBDLE1BQUEsR0FBRyxFQUFFRyxPQUFPLENBQUMsaUNBQUQsQ0FBdEQ7QUFBMkYsTUFBQSxLQUFLLEVBQUMsSUFBakc7QUFBc0csTUFBQSxNQUFNLEVBQUMsSUFBN0c7QUFBa0gsTUFBQSxHQUFHLEVBQUM7QUFBdEgsTUFESixlQUVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLLHlCQUFHLHFDQUFILENBREwsQ0FGSixFQUtLRCxhQUxMLENBREo7QUFTSDtBQXhFMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSAnLi4vLi4vLi4vUGxhdGZvcm1QZWcnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG4vKipcbiAqIENoZWNrIGEgdmVyc2lvbiBzdHJpbmcgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBDaGFuZ2Vsb2dcbiAqIGRpYWxvZyAoW3ZlY3RvcnZlcnNpb25dLXJlYWN0LVtyZWFjdC1zZGstdmVyc2lvbl0tanMtW2pzLXNkay12ZXJzaW9uXSlcbiAqL1xuZnVuY3Rpb24gY2hlY2tWZXJzaW9uKHZlcikge1xuICAgIGNvbnN0IHBhcnRzID0gdmVyLnNwbGl0KCctJyk7XG4gICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA9PSA1ICYmIHBhcnRzWzFdID09ICdyZWFjdCcgJiYgcGFydHNbM10gPT0gJ2pzJztcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHZlcnNpb246IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgbmV3VmVyc2lvbjogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICByZWxlYXNlTm90ZXM6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIGRpc3BsYXlSZWxlYXNlTm90ZXM6IGZ1bmN0aW9uKHJlbGVhc2VOb3Rlcykge1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuUXVlc3Rpb25EaWFsb2cnKTtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRGlzcGxheSByZWxlYXNlIG5vdGVzJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoXCJXaGF0J3MgTmV3XCIpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IDxkaXYgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9jaGFuZ2Vsb2dcIj57cmVsZWFzZU5vdGVzfTwvZGl2PixcbiAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJVcGRhdGVcIiksXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAodXBkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZSAmJiBQbGF0Zm9ybVBlZy5nZXQoKSkge1xuICAgICAgICAgICAgICAgICAgICBQbGF0Zm9ybVBlZy5nZXQoKS5pbnN0YWxsVXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlDaGFuZ2Vsb2c6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBDaGFuZ2Vsb2dEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkNoYW5nZWxvZ0RpYWxvZycpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdEaXNwbGF5IENoYW5nZWxvZycsICcnLCBDaGFuZ2Vsb2dEaWFsb2csIHtcbiAgICAgICAgICAgIHZlcnNpb246IHRoaXMucHJvcHMudmVyc2lvbixcbiAgICAgICAgICAgIG5ld1ZlcnNpb246IHRoaXMucHJvcHMubmV3VmVyc2lvbixcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6ICh1cGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlICYmIFBsYXRmb3JtUGVnLmdldCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLmluc3RhbGxVcGRhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25VcGRhdGVDbGlja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgUGxhdGZvcm1QZWcuZ2V0KCkuaW5zdGFsbFVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgYWN0aW9uX2J1dHRvbjtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSByZWxlYXNlIG5vdGVzIHRvIGRpc3BsYXksIHdlIGRpc3BsYXkgdGhlbS4gT3RoZXJ3aXNlLFxuICAgICAgICAvLyB3ZSBkaXNwbGF5IHRoZSBDaGFuZ2Vsb2cgRGlhbG9nIHdoaWNoIHRha2VzIHR3byB2ZXJzaW9ucyBhbmRcbiAgICAgICAgLy8gYXV0b21hdGljYWxseSB0ZWxscyB5b3Ugd2hhdCdzIGNoYW5nZWQgKHByb3ZpZGVkIHRoZSB2ZXJzaW9uc1xuICAgICAgICAvLyBhcmUgaW4gdGhlIHJpZ2h0IGZvcm1hdClcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucmVsZWFzZU5vdGVzKSB7XG4gICAgICAgICAgICBhY3Rpb25fYnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhcl9hY3Rpb25cIiBvbkNsaWNrPXt0aGlzLmRpc3BsYXlSZWxlYXNlTm90ZXN9PlxuICAgICAgICAgICAgICAgICAgICB7IF90KFwiV2hhdCdzIG5ldz9cIikgfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChjaGVja1ZlcnNpb24odGhpcy5wcm9wcy52ZXJzaW9uKSAmJiBjaGVja1ZlcnNpb24odGhpcy5wcm9wcy5uZXdWZXJzaW9uKSkge1xuICAgICAgICAgICAgYWN0aW9uX2J1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfYWN0aW9uXCIgb25DbGljaz17dGhpcy5kaXNwbGF5Q2hhbmdlbG9nfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIldoYXQncyBuZXc/XCIpIH1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoUGxhdGZvcm1QZWcuZ2V0KCkpIHtcbiAgICAgICAgICAgIGFjdGlvbl9idXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2FjdGlvblwiIG9uQ2xpY2s9e3RoaXMub25VcGRhdGVDbGlja2VkfT5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIlVwZGF0ZVwiKSB9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJcIj5cbiAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfd2FybmluZ1wiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvd2FybmluZy5zdmdcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyM1wiIGFsdD1cIlwiIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiQSBuZXcgdmVyc2lvbiBvZiBSaW90IGlzIGF2YWlsYWJsZS5cIil9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge2FjdGlvbl9idXR0b259XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=