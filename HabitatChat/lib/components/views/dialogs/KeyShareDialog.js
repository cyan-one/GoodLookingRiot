"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2017 Vector Creations Ltd

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
// TODO: We can remove this once cross-signing is the only way.
// https://github.com/vector-im/riot-web/issues/11908

/**
 * Dialog which asks the user whether they want to share their keys with
 * an unverified device.
 *
 * onFinished is called with `true` if the key should be shared, `false` if it
 * should not, and `undefined` if the dialog is cancelled. (In other words:
 * truthy: do the key share. falsy: don't share the keys).
 */
var _default = (0, _createReactClass.default)({
  displayName: "KeyShareDialog",
  propTypes: {
    matrixClient: _propTypes.default.object.isRequired,
    userId: _propTypes.default.string.isRequired,
    deviceId: _propTypes.default.string.isRequired,
    onFinished: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      deviceInfo: null,
      wasNewDevice: false
    };
  },
  componentDidMount: function () {
    this._unmounted = false;
    const userId = this.props.userId;
    const deviceId = this.props.deviceId; // give the client a chance to refresh the device list

    this.props.matrixClient.downloadKeys([userId], false).then(r => {
      if (this._unmounted) {
        return;
      }

      const deviceInfo = r[userId][deviceId];

      if (!deviceInfo) {
        console.warn("No details found for session ".concat(userId, ":").concat(deviceId));
        this.props.onFinished(false);
        return;
      }

      const wasNewDevice = !deviceInfo.isKnown();
      this.setState({
        deviceInfo: deviceInfo,
        wasNewDevice: wasNewDevice
      }); // if the device was new before, it's not any more.

      if (wasNewDevice) {
        this.props.matrixClient.setDeviceKnown(userId, deviceId, true);
      }
    });
  },
  componentWillUnmount: function () {
    this._unmounted = true;
  },
  _onVerifyClicked: function () {
    const DeviceVerifyDialog = sdk.getComponent('views.dialogs.DeviceVerifyDialog');
    console.log("KeyShareDialog: Starting verify dialog");

    _Modal.default.createTrackedDialog('Key Share', 'Starting dialog', DeviceVerifyDialog, {
      userId: this.props.userId,
      device: this.state.deviceInfo,
      onFinished: verified => {
        if (verified) {
          // can automatically share the keys now.
          this.props.onFinished(true);
        }
      }
    }, null,
    /* priority = */
    false,
    /* static = */
    true);
  },
  _onShareClicked: function () {
    console.log("KeyShareDialog: User clicked 'share'");
    this.props.onFinished(true);
  },
  _onIgnoreClicked: function () {
    console.log("KeyShareDialog: User clicked 'ignore'");
    this.props.onFinished(false);
  },
  _renderContent: function () {
    const displayName = this.state.deviceInfo.getDisplayName() || this.state.deviceInfo.deviceId;
    let text;

    if (this.state.wasNewDevice) {
      text = (0, _languageHandler._td)("You added a new session '%(displayName)s', which is" + " requesting encryption keys.");
    } else {
      text = (0, _languageHandler._td)("Your unverified session '%(displayName)s' is requesting" + " encryption keys.");
    }

    text = (0, _languageHandler._t)(text, {
      displayName: displayName
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      id: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("p", null, text), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onVerifyClicked,
      autoFocus: "true"
    }, (0, _languageHandler._t)('Start verification')), /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onShareClicked
    }, (0, _languageHandler._t)('Share without verifying')), /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onIgnoreClicked
    }, (0, _languageHandler._t)('Ignore request'))));
  },
  render: function () {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const Spinner = sdk.getComponent('views.elements.Spinner');
    let content;

    if (this.state.deviceInfo) {
      content = this._renderContent();
    } else {
      content = /*#__PURE__*/_react.default.createElement("div", {
        id: "mx_Dialog_content"
      }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('Loading session info...')), /*#__PURE__*/_react.default.createElement(Spinner, null));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_KeyShareRequestDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Encryption key request'),
      contentId: "mx_Dialog_content"
    }, content);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvS2V5U2hhcmVEaWFsb2cuanMiXSwibmFtZXMiOlsicHJvcFR5cGVzIiwibWF0cml4Q2xpZW50IiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsInVzZXJJZCIsInN0cmluZyIsImRldmljZUlkIiwib25GaW5pc2hlZCIsImZ1bmMiLCJnZXRJbml0aWFsU3RhdGUiLCJkZXZpY2VJbmZvIiwid2FzTmV3RGV2aWNlIiwiY29tcG9uZW50RGlkTW91bnQiLCJfdW5tb3VudGVkIiwicHJvcHMiLCJkb3dubG9hZEtleXMiLCJ0aGVuIiwiciIsImNvbnNvbGUiLCJ3YXJuIiwiaXNLbm93biIsInNldFN0YXRlIiwic2V0RGV2aWNlS25vd24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsIl9vblZlcmlmeUNsaWNrZWQiLCJEZXZpY2VWZXJpZnlEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJsb2ciLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJkZXZpY2UiLCJzdGF0ZSIsInZlcmlmaWVkIiwiX29uU2hhcmVDbGlja2VkIiwiX29uSWdub3JlQ2xpY2tlZCIsIl9yZW5kZXJDb250ZW50IiwiZGlzcGxheU5hbWUiLCJnZXREaXNwbGF5TmFtZSIsInRleHQiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiU3Bpbm5lciIsImNvbnRlbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBO0FBQ0E7O0FBRUE7Ozs7Ozs7O2VBUWUsK0JBQWlCO0FBQUE7QUFDNUJBLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxZQUFZLEVBQUVDLG1CQUFVQyxNQUFWLENBQWlCQyxVQUR4QjtBQUVQQyxJQUFBQSxNQUFNLEVBQUVILG1CQUFVSSxNQUFWLENBQWlCRixVQUZsQjtBQUdQ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QUFLUCxjQUFMLEVBQVY7QUFDSCxLQUZELE1BRU87QUFDSE8sTUFBQUEsT0FBTyxnQkFDSDtBQUFLLFFBQUEsRUFBRSxFQUFDO0FBQVIsc0JBQ0ksd0NBQUsseUJBQUcseUJBQUgsQ0FBTCxDQURKLGVBRUksNkJBQUMsT0FBRCxPQUZKLENBREo7QUFNSDs7QUFFRCx3QkFDSSw2QkFBQyxVQUFEO0FBQVksTUFBQSxTQUFTLEVBQUMsMEJBQXRCO0FBQ0ksTUFBQSxVQUFVLEVBQUUsS0FBSzdCLEtBQUwsQ0FBV1AsVUFEM0I7QUFFSSxNQUFBLEtBQUssRUFBRSx5QkFBRyx3QkFBSCxDQUZYO0FBR0ksTUFBQSxTQUFTLEVBQUM7QUFIZCxPQUtNb0MsT0FMTixDQURKO0FBU0g7QUE3STJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcblxuaW1wb3J0IHsgX3QsIF90ZCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbi8vIFRPRE86IFdlIGNhbiByZW1vdmUgdGhpcyBvbmNlIGNyb3NzLXNpZ25pbmcgaXMgdGhlIG9ubHkgd2F5LlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTE5MDhcblxuLyoqXG4gKiBEaWFsb2cgd2hpY2ggYXNrcyB0aGUgdXNlciB3aGV0aGVyIHRoZXkgd2FudCB0byBzaGFyZSB0aGVpciBrZXlzIHdpdGhcbiAqIGFuIHVudmVyaWZpZWQgZGV2aWNlLlxuICpcbiAqIG9uRmluaXNoZWQgaXMgY2FsbGVkIHdpdGggYHRydWVgIGlmIHRoZSBrZXkgc2hvdWxkIGJlIHNoYXJlZCwgYGZhbHNlYCBpZiBpdFxuICogc2hvdWxkIG5vdCwgYW5kIGB1bmRlZmluZWRgIGlmIHRoZSBkaWFsb2cgaXMgY2FuY2VsbGVkLiAoSW4gb3RoZXIgd29yZHM6XG4gKiB0cnV0aHk6IGRvIHRoZSBrZXkgc2hhcmUuIGZhbHN5OiBkb24ndCBzaGFyZSB0aGUga2V5cykuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICBtYXRyaXhDbGllbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgdXNlcklkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIGRldmljZUlkOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZXZpY2VJbmZvOiBudWxsLFxuICAgICAgICAgICAgd2FzTmV3RGV2aWNlOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgdXNlcklkID0gdGhpcy5wcm9wcy51c2VySWQ7XG4gICAgICAgIGNvbnN0IGRldmljZUlkID0gdGhpcy5wcm9wcy5kZXZpY2VJZDtcblxuICAgICAgICAvLyBnaXZlIHRoZSBjbGllbnQgYSBjaGFuY2UgdG8gcmVmcmVzaCB0aGUgZGV2aWNlIGxpc3RcbiAgICAgICAgdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQuZG93bmxvYWRLZXlzKFt1c2VySWRdLCBmYWxzZSkudGhlbigocikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgY29uc3QgZGV2aWNlSW5mbyA9IHJbdXNlcklkXVtkZXZpY2VJZF07XG5cbiAgICAgICAgICAgIGlmICghZGV2aWNlSW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgTm8gZGV0YWlscyBmb3VuZCBmb3Igc2Vzc2lvbiAke3VzZXJJZH06JHtkZXZpY2VJZH1gKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB3YXNOZXdEZXZpY2UgPSAhZGV2aWNlSW5mby5pc0tub3duKCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGRldmljZUluZm86IGRldmljZUluZm8sXG4gICAgICAgICAgICAgICAgd2FzTmV3RGV2aWNlOiB3YXNOZXdEZXZpY2UsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIGRldmljZSB3YXMgbmV3IGJlZm9yZSwgaXQncyBub3QgYW55IG1vcmUuXG4gICAgICAgICAgICBpZiAod2FzTmV3RGV2aWNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5tYXRyaXhDbGllbnQuc2V0RGV2aWNlS25vd24oXG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlSWQsXG4gICAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LFxuXG5cbiAgICBfb25WZXJpZnlDbGlja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgRGV2aWNlVmVyaWZ5RGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5EZXZpY2VWZXJpZnlEaWFsb2cnKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIktleVNoYXJlRGlhbG9nOiBTdGFydGluZyB2ZXJpZnkgZGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdLZXkgU2hhcmUnLCAnU3RhcnRpbmcgZGlhbG9nJywgRGV2aWNlVmVyaWZ5RGlhbG9nLCB7XG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMucHJvcHMudXNlcklkLFxuICAgICAgICAgICAgZGV2aWNlOiB0aGlzLnN0YXRlLmRldmljZUluZm8sXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAodmVyaWZpZWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmVyaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FuIGF1dG9tYXRpY2FsbHkgc2hhcmUgdGhlIGtleXMgbm93LlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgbnVsbCwgLyogcHJpb3JpdHkgPSAqLyBmYWxzZSwgLyogc3RhdGljID0gKi8gdHJ1ZSk7XG4gICAgfSxcblxuICAgIF9vblNoYXJlQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiS2V5U2hhcmVEaWFsb2c6IFVzZXIgY2xpY2tlZCAnc2hhcmUnXCIpO1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgfSxcblxuICAgIF9vbklnbm9yZUNsaWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIktleVNoYXJlRGlhbG9nOiBVc2VyIGNsaWNrZWQgJ2lnbm9yZSdcIik7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfSxcblxuICAgIF9yZW5kZXJDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSB0aGlzLnN0YXRlLmRldmljZUluZm8uZ2V0RGlzcGxheU5hbWUoKSB8fFxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kZXZpY2VJbmZvLmRldmljZUlkO1xuXG4gICAgICAgIGxldCB0ZXh0O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS53YXNOZXdEZXZpY2UpIHtcbiAgICAgICAgICAgIHRleHQgPSBfdGQoXCJZb3UgYWRkZWQgYSBuZXcgc2Vzc2lvbiAnJShkaXNwbGF5TmFtZSlzJywgd2hpY2ggaXNcIlxuICAgICAgICAgICAgICAgICsgXCIgcmVxdWVzdGluZyBlbmNyeXB0aW9uIGtleXMuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dCA9IF90ZChcIllvdXIgdW52ZXJpZmllZCBzZXNzaW9uICclKGRpc3BsYXlOYW1lKXMnIGlzIHJlcXVlc3RpbmdcIlxuICAgICAgICAgICAgICAgICsgXCIgZW5jcnlwdGlvbiBrZXlzLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0ID0gX3QodGV4dCwge2Rpc3BsYXlOYW1lOiBkaXNwbGF5TmFtZX0pO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgPHA+eyB0ZXh0IH08L3A+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5fb25WZXJpZnlDbGlja2VkfSBhdXRvRm9jdXM9XCJ0cnVlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdTdGFydCB2ZXJpZmljYXRpb24nKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uU2hhcmVDbGlja2VkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1NoYXJlIHdpdGhvdXQgdmVyaWZ5aW5nJykgfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbklnbm9yZUNsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnSWdub3JlIHJlcXVlc3QnKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcbiAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLlNwaW5uZXInKTtcblxuICAgICAgICBsZXQgY29udGVudDtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZXZpY2VJbmZvKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gdGhpcy5fcmVuZGVyQ29udGVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIDxwPnsgX3QoJ0xvYWRpbmcgc2Vzc2lvbiBpbmZvLi4uJykgfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2cgY2xhc3NOYW1lPSdteF9LZXlTaGFyZVJlcXVlc3REaWFsb2cnXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnRW5jcnlwdGlvbiBrZXkgcmVxdWVzdCcpfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRJZD0nbXhfRGlhbG9nX2NvbnRlbnQnXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=