"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _cryptodevices = require("../../../cryptodevices");

/*
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd

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
function UserUnknownDeviceList(props) {
  const MemberDeviceInfo = sdk.getComponent('rooms.MemberDeviceInfo');
  const {
    userId,
    userDevices
  } = props;
  const deviceListEntries = Object.keys(userDevices).map(deviceId => /*#__PURE__*/_react.default.createElement("li", {
    key: deviceId
  }, /*#__PURE__*/_react.default.createElement(MemberDeviceInfo, {
    device: userDevices[deviceId],
    userId: userId,
    showDeviceId: true
  })));
  return /*#__PURE__*/_react.default.createElement("ul", {
    className: "mx_UnknownDeviceDialog_deviceList"
  }, deviceListEntries);
}

UserUnknownDeviceList.propTypes = {
  userId: _propTypes.default.string.isRequired,
  // map from deviceid -> deviceinfo
  userDevices: _propTypes.default.object.isRequired
};

function UnknownDeviceList(props) {
  const {
    devices
  } = props;
  const userListEntries = Object.keys(devices).map(userId => /*#__PURE__*/_react.default.createElement("li", {
    key: userId
  }, /*#__PURE__*/_react.default.createElement("p", null, userId, ":"), /*#__PURE__*/_react.default.createElement(UserUnknownDeviceList, {
    userId: userId,
    userDevices: devices[userId]
  })));
  return /*#__PURE__*/_react.default.createElement("ul", null, userListEntries);
}

UnknownDeviceList.propTypes = {
  // map from userid -> deviceid -> deviceinfo
  devices: _propTypes.default.object.isRequired
};

var _default = (0, _createReactClass.default)({
  displayName: 'UnknownDeviceDialog',
  propTypes: {
    room: _propTypes.default.object.isRequired,
    // map from userid -> deviceid -> deviceinfo or null if devices are not yet loaded
    devices: _propTypes.default.object,
    onFinished: _propTypes.default.func.isRequired,
    // Label for the button that marks all devices known and tries the send again
    sendAnywayLabel: _propTypes.default.string.isRequired,
    // Label for the button that to send the event if you've verified all devices
    sendLabel: _propTypes.default.string.isRequired,
    // function to retry the request once all devices are verified / known
    onSend: _propTypes.default.func.isRequired
  },
  componentDidMount: function () {
    _MatrixClientPeg.MatrixClientPeg.get().on("deviceVerificationChanged", this._onDeviceVerificationChanged);
  },
  componentWillUnmount: function () {
    if (_MatrixClientPeg.MatrixClientPeg.get()) {
      _MatrixClientPeg.MatrixClientPeg.get().removeListener("deviceVerificationChanged", this._onDeviceVerificationChanged);
    }
  },
  _onDeviceVerificationChanged: function (userId, deviceId, deviceInfo) {
    if (this.props.devices[userId] && this.props.devices[userId][deviceId]) {
      // XXX: Mutating props :/
      this.props.devices[userId][deviceId] = deviceInfo;
      this.forceUpdate();
    }
  },
  _onDismissClicked: function () {
    this.props.onFinished();
  },
  _onSendAnywayClicked: function () {
    (0, _cryptodevices.markAllDevicesKnown)(_MatrixClientPeg.MatrixClientPeg.get(), this.props.devices);
    this.props.onFinished();
    this.props.onSend();
  },
  _onSendClicked: function () {
    this.props.onFinished();
    this.props.onSend();
  },
  render: function () {
    if (this.props.devices === null) {
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    }

    let warning;

    if (_SettingsStore.default.getValue("blacklistUnverifiedDevices", this.props.room.roomId)) {
      warning = /*#__PURE__*/_react.default.createElement("h4", null, (0, _languageHandler._t)("You are currently blacklisting unverified sessions; to send " + "messages to these sessions you must verify them."));
    } else {
      warning = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("We recommend you go through the verification process " + "for each session to confirm they belong to their legitimate owner, " + "but you can resend the message without verifying if you prefer.")));
    }

    let haveUnknownDevices = false;
    Object.keys(this.props.devices).forEach(userId => {
      Object.keys(this.props.devices[userId]).map(deviceId => {
        const device = this.props.devices[userId][deviceId];

        if (device.isUnverified() && !device.isKnown()) {
          haveUnknownDevices = true;
        }
      });
    });
    const sendButtonOnClick = haveUnknownDevices ? this._onSendAnywayClicked : this._onSendClicked;
    const sendButtonLabel = haveUnknownDevices ? this.props.sendAnywayLabel : this.props.sendAnywayLabel;
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_UnknownDeviceDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Room contains unknown sessions'),
      contentId: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content",
      id: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("h4", null, (0, _languageHandler._t)('"%(RoomName)s" contains sessions that you haven\'t seen before.', {
      RoomName: this.props.room.name
    })), warning, (0, _languageHandler._t)("Unknown sessions"), ":", /*#__PURE__*/_react.default.createElement(UnknownDeviceList, {
      devices: this.props.devices
    })), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: sendButtonLabel,
      onPrimaryButtonClick: sendButtonOnClick,
      onCancel: this._onDismissClicked
    })); // XXX: do we want to give the user the option to enable blacklistUnverifiedDevices for this room (or globally) at this point?
    // It feels like confused users will likely turn it on and then disappear in a cloud of UISIs...
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVW5rbm93bkRldmljZURpYWxvZy5qcyJdLCJuYW1lcyI6WyJVc2VyVW5rbm93bkRldmljZUxpc3QiLCJwcm9wcyIsIk1lbWJlckRldmljZUluZm8iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJ1c2VySWQiLCJ1c2VyRGV2aWNlcyIsImRldmljZUxpc3RFbnRyaWVzIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImRldmljZUlkIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsIm9iamVjdCIsIlVua25vd25EZXZpY2VMaXN0IiwiZGV2aWNlcyIsInVzZXJMaXN0RW50cmllcyIsImRpc3BsYXlOYW1lIiwicm9vbSIsIm9uRmluaXNoZWQiLCJmdW5jIiwic2VuZEFueXdheUxhYmVsIiwic2VuZExhYmVsIiwib25TZW5kIiwiY29tcG9uZW50RGlkTW91bnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJvbiIsIl9vbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiZGV2aWNlSW5mbyIsImZvcmNlVXBkYXRlIiwiX29uRGlzbWlzc0NsaWNrZWQiLCJfb25TZW5kQW55d2F5Q2xpY2tlZCIsIl9vblNlbmRDbGlja2VkIiwicmVuZGVyIiwiU3Bpbm5lciIsIndhcm5pbmciLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJyb29tSWQiLCJoYXZlVW5rbm93bkRldmljZXMiLCJmb3JFYWNoIiwiZGV2aWNlIiwiaXNVbnZlcmlmaWVkIiwiaXNLbm93biIsInNlbmRCdXR0b25PbkNsaWNrIiwic2VuZEJ1dHRvbkxhYmVsIiwiQmFzZURpYWxvZyIsIkRpYWxvZ0J1dHRvbnMiLCJSb29tTmFtZSIsIm5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNB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Z0NBQUgsQ0FGWDtBQUdJLE1BQUEsU0FBUyxFQUFDO0FBSGQsb0JBS0k7QUFBSyxNQUFBLFNBQVMsRUFBQyxtQkFBZjtBQUFtQyxNQUFBLEVBQUUsRUFBQztBQUF0QyxvQkFDSSx5Q0FDTSx5QkFBRyxpRUFBSCxFQUFzRTtBQUFDZ0MsTUFBQUEsUUFBUSxFQUFFLEtBQUtyRCxLQUFMLENBQVdvQixJQUFYLENBQWdCa0M7QUFBM0IsS0FBdEUsQ0FETixDQURKLEVBSU1kLE9BSk4sRUFLTSx5QkFBRyxrQkFBSCxDQUxOLG9CQU9JLDZCQUFDLGlCQUFEO0FBQW1CLE1BQUEsT0FBTyxFQUFFLEtBQUt4QyxLQUFMLENBQVdpQjtBQUF2QyxNQVBKLENBTEosZUFjSSw2QkFBQyxhQUFEO0FBQWUsTUFBQSxhQUFhLEVBQUVpQyxlQUE5QjtBQUNJLE1BQUEsb0JBQW9CLEVBQUVELGlCQUQxQjtBQUVJLE1BQUEsUUFBUSxFQUFFLEtBQUtkO0FBRm5CLE1BZEosQ0FESixDQXhDZSxDQTREZjtBQUNBO0FBQ0g7QUFySDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7IG1hcmtBbGxEZXZpY2VzS25vd24gfSBmcm9tICcuLi8uLi8uLi9jcnlwdG9kZXZpY2VzJztcblxuZnVuY3Rpb24gVXNlclVua25vd25EZXZpY2VMaXN0KHByb3BzKSB7XG4gICAgY29uc3QgTWVtYmVyRGV2aWNlSW5mbyA9IHNkay5nZXRDb21wb25lbnQoJ3Jvb21zLk1lbWJlckRldmljZUluZm8nKTtcbiAgICBjb25zdCB7dXNlcklkLCB1c2VyRGV2aWNlc30gPSBwcm9wcztcblxuICAgIGNvbnN0IGRldmljZUxpc3RFbnRyaWVzID0gT2JqZWN0LmtleXModXNlckRldmljZXMpLm1hcCgoZGV2aWNlSWQpID0+XG4gICAgICAgIDxsaSBrZXk9e2RldmljZUlkfT48TWVtYmVyRGV2aWNlSW5mbyBkZXZpY2U9e3VzZXJEZXZpY2VzW2RldmljZUlkXX0gdXNlcklkPXt1c2VySWR9IHNob3dEZXZpY2VJZD17dHJ1ZX0gLz48L2xpPixcbiAgICApO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm14X1Vua25vd25EZXZpY2VEaWFsb2dfZGV2aWNlTGlzdFwiPlxuICAgICAgICAgICAgeyBkZXZpY2VMaXN0RW50cmllcyB9XG4gICAgICAgIDwvdWw+XG4gICAgKTtcbn1cblxuVXNlclVua25vd25EZXZpY2VMaXN0LnByb3BUeXBlcyA9IHtcbiAgICB1c2VySWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcblxuICAgIC8vIG1hcCBmcm9tIGRldmljZWlkIC0+IGRldmljZWluZm9cbiAgICB1c2VyRGV2aWNlczogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxufTtcblxuXG5mdW5jdGlvbiBVbmtub3duRGV2aWNlTGlzdChwcm9wcykge1xuICAgIGNvbnN0IHtkZXZpY2VzfSA9IHByb3BzO1xuXG4gICAgY29uc3QgdXNlckxpc3RFbnRyaWVzID0gT2JqZWN0LmtleXMoZGV2aWNlcykubWFwKCh1c2VySWQpID0+XG4gICAgICAgIDxsaSBrZXk9e3VzZXJJZH0+XG4gICAgICAgICAgICA8cD57IHVzZXJJZCB9OjwvcD5cbiAgICAgICAgICAgIDxVc2VyVW5rbm93bkRldmljZUxpc3QgdXNlcklkPXt1c2VySWR9IHVzZXJEZXZpY2VzPXtkZXZpY2VzW3VzZXJJZF19IC8+XG4gICAgICAgIDwvbGk+LFxuICAgICk7XG5cbiAgICByZXR1cm4gPHVsPnsgdXNlckxpc3RFbnRyaWVzIH08L3VsPjtcbn1cblxuVW5rbm93bkRldmljZUxpc3QucHJvcFR5cGVzID0ge1xuICAgIC8vIG1hcCBmcm9tIHVzZXJpZCAtPiBkZXZpY2VpZCAtPiBkZXZpY2VpbmZvXG4gICAgZGV2aWNlczogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ1Vua25vd25EZXZpY2VEaWFsb2cnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgICAgICAvLyBtYXAgZnJvbSB1c2VyaWQgLT4gZGV2aWNlaWQgLT4gZGV2aWNlaW5mbyBvciBudWxsIGlmIGRldmljZXMgYXJlIG5vdCB5ZXQgbG9hZGVkXG4gICAgICAgIGRldmljZXM6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcblxuICAgICAgICAvLyBMYWJlbCBmb3IgdGhlIGJ1dHRvbiB0aGF0IG1hcmtzIGFsbCBkZXZpY2VzIGtub3duIGFuZCB0cmllcyB0aGUgc2VuZCBhZ2FpblxuICAgICAgICBzZW5kQW55d2F5TGFiZWw6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcblxuICAgICAgICAvLyBMYWJlbCBmb3IgdGhlIGJ1dHRvbiB0aGF0IHRvIHNlbmQgdGhlIGV2ZW50IGlmIHlvdSd2ZSB2ZXJpZmllZCBhbGwgZGV2aWNlc1xuICAgICAgICBzZW5kTGFiZWw6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcblxuICAgICAgICAvLyBmdW5jdGlvbiB0byByZXRyeSB0aGUgcmVxdWVzdCBvbmNlIGFsbCBkZXZpY2VzIGFyZSB2ZXJpZmllZCAvIGtub3duXG4gICAgICAgIG9uU2VuZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkub24oXCJkZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkXCIsIHRoaXMuX29uRGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKSkge1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlbW92ZUxpc3RlbmVyKFwiZGV2aWNlVmVyaWZpY2F0aW9uQ2hhbmdlZFwiLCB0aGlzLl9vbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJJZCwgZGV2aWNlSWQsIGRldmljZUluZm8pIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZGV2aWNlc1t1c2VySWRdICYmIHRoaXMucHJvcHMuZGV2aWNlc1t1c2VySWRdW2RldmljZUlkXSkge1xuICAgICAgICAgICAgLy8gWFhYOiBNdXRhdGluZyBwcm9wcyA6L1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5kZXZpY2VzW3VzZXJJZF1bZGV2aWNlSWRdID0gZGV2aWNlSW5mbztcbiAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25EaXNtaXNzQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgIH0sXG5cbiAgICBfb25TZW5kQW55d2F5Q2xpY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIG1hcmtBbGxEZXZpY2VzS25vd24oTWF0cml4Q2xpZW50UGVnLmdldCgpLCB0aGlzLnByb3BzLmRldmljZXMpO1xuXG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VuZCgpO1xuICAgIH0sXG5cbiAgICBfb25TZW5kQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VuZCgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5kZXZpY2VzID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICByZXR1cm4gPFNwaW5uZXIgLz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgd2FybmluZztcbiAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJibGFja2xpc3RVbnZlcmlmaWVkRGV2aWNlc1wiLCB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSkge1xuICAgICAgICAgICAgd2FybmluZyA9IChcbiAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJZb3UgYXJlIGN1cnJlbnRseSBibGFja2xpc3RpbmcgdW52ZXJpZmllZCBzZXNzaW9uczsgdG8gc2VuZCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZXMgdG8gdGhlc2Ugc2Vzc2lvbnMgeW91IG11c3QgdmVyaWZ5IHRoZW0uXCIpIH1cbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdhcm5pbmcgPSAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiV2UgcmVjb21tZW5kIHlvdSBnbyB0aHJvdWdoIHRoZSB2ZXJpZmljYXRpb24gcHJvY2VzcyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmb3IgZWFjaCBzZXNzaW9uIHRvIGNvbmZpcm0gdGhleSBiZWxvbmcgdG8gdGhlaXIgbGVnaXRpbWF0ZSBvd25lciwgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYnV0IHlvdSBjYW4gcmVzZW5kIHRoZSBtZXNzYWdlIHdpdGhvdXQgdmVyaWZ5aW5nIGlmIHlvdSBwcmVmZXIuXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYXZlVW5rbm93bkRldmljZXMgPSBmYWxzZTtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5wcm9wcy5kZXZpY2VzKS5mb3JFYWNoKCh1c2VySWQpID0+IHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMucHJvcHMuZGV2aWNlc1t1c2VySWRdKS5tYXAoKGRldmljZUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlID0gdGhpcy5wcm9wcy5kZXZpY2VzW3VzZXJJZF1bZGV2aWNlSWRdO1xuICAgICAgICAgICAgICAgIGlmIChkZXZpY2UuaXNVbnZlcmlmaWVkKCkgJiYgIWRldmljZS5pc0tub3duKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaGF2ZVVua25vd25EZXZpY2VzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNlbmRCdXR0b25PbkNsaWNrID0gaGF2ZVVua25vd25EZXZpY2VzID8gdGhpcy5fb25TZW5kQW55d2F5Q2xpY2tlZCA6IHRoaXMuX29uU2VuZENsaWNrZWQ7XG4gICAgICAgIGNvbnN0IHNlbmRCdXR0b25MYWJlbCA9IGhhdmVVbmtub3duRGV2aWNlcyA/IHRoaXMucHJvcHMuc2VuZEFueXdheUxhYmVsIDogdGhpcy5wcm9wcy5zZW5kQW55d2F5TGFiZWw7XG5cbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJhc2VEaWFsb2cgY2xhc3NOYW1lPSdteF9Vbmtub3duRGV2aWNlRGlhbG9nJ1xuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoJ1Jvb20gY29udGFpbnMgdW5rbm93biBzZXNzaW9ucycpfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRJZD0nbXhfRGlhbG9nX2NvbnRlbnQnXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiIGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIDxoND5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ1wiJShSb29tTmFtZSlzXCIgY29udGFpbnMgc2Vzc2lvbnMgdGhhdCB5b3UgaGF2ZW5cXCd0IHNlZW4gYmVmb3JlLicsIHtSb29tTmFtZTogdGhpcy5wcm9wcy5yb29tLm5hbWV9KSB9XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIHsgd2FybmluZyB9XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJVbmtub3duIHNlc3Npb25zXCIpIH06XG5cbiAgICAgICAgICAgICAgICAgICAgPFVua25vd25EZXZpY2VMaXN0IGRldmljZXM9e3RoaXMucHJvcHMuZGV2aWNlc30gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtzZW5kQnV0dG9uTGFiZWx9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXtzZW5kQnV0dG9uT25DbGlja31cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMuX29uRGlzbWlzc0NsaWNrZWR9IC8+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgICAgIC8vIFhYWDogZG8gd2Ugd2FudCB0byBnaXZlIHRoZSB1c2VyIHRoZSBvcHRpb24gdG8gZW5hYmxlIGJsYWNrbGlzdFVudmVyaWZpZWREZXZpY2VzIGZvciB0aGlzIHJvb20gKG9yIGdsb2JhbGx5KSBhdCB0aGlzIHBvaW50P1xuICAgICAgICAvLyBJdCBmZWVscyBsaWtlIGNvbmZ1c2VkIHVzZXJzIHdpbGwgbGlrZWx5IHR1cm4gaXQgb24gYW5kIHRoZW4gZGlzYXBwZWFyIGluIGEgY2xvdWQgb2YgVUlTSXMuLi5cbiAgICB9LFxufSk7XG4iXX0=