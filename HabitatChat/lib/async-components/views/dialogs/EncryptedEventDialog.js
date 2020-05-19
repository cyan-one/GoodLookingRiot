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

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Keyboard = require("../../../Keyboard");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2015, 2016 OpenMarket Ltd

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
// XXX: This component is not cross-signing aware.
// https://github.com/vector-im/riot-web/issues/11752 tracks either updating this
// component or taking it out to pasture.
var _default = (0, _createReactClass.default)({
  displayName: 'EncryptedEventDialog',
  propTypes: {
    event: _propTypes.default.object.isRequired,
    onFinished: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      device: null
    };
  },
  componentDidMount: function () {
    this._unmounted = false;

    const client = _MatrixClientPeg.MatrixClientPeg.get(); // first try to load the device from our store.
    //


    this.refreshDevice().then(dev => {
      if (dev) {
        return dev;
      } // tell the client to try to refresh the device list for this user


      return client.downloadKeys([this.props.event.getSender()], true).then(() => {
        return this.refreshDevice();
      });
    }).then(dev => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        device: dev
      });
      client.on("deviceVerificationChanged", this.onDeviceVerificationChanged);
    }, err => {
      console.log("Error downloading devices", err);
    });
  },
  componentWillUnmount: function () {
    this._unmounted = true;

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    if (client) {
      client.removeListener("deviceVerificationChanged", this.onDeviceVerificationChanged);
    }
  },
  refreshDevice: function () {
    // Promise.resolve to handle transition from static result to promise; can be removed
    // in future
    return Promise.resolve(_MatrixClientPeg.MatrixClientPeg.get().getEventSenderDeviceInfo(this.props.event));
  },
  onDeviceVerificationChanged: function (userId, device) {
    if (userId === this.props.event.getSender()) {
      this.refreshDevice().then(dev => {
        this.setState({
          device: dev
        });
      });
    }
  },
  onKeyDown: function (e) {
    if (e.key === _Keyboard.Key.ESCAPE) {
      e.stopPropagation();
      e.preventDefault();
      this.props.onFinished(false);
    }
  },
  _renderDeviceInfo: function () {
    const device = this.state.device;

    if (!device) {
      return /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('unknown device'));
    }

    let verificationStatus = /*#__PURE__*/_react.default.createElement("b", null, (0, _languageHandler._t)('NOT verified'));

    if (device.isBlocked()) {
      verificationStatus = /*#__PURE__*/_react.default.createElement("b", null, (0, _languageHandler._t)('Blacklisted'));
    } else if (device.isVerified()) {
      verificationStatus = (0, _languageHandler._t)('verified');
    }

    return /*#__PURE__*/_react.default.createElement("table", null, /*#__PURE__*/_react.default.createElement("tbody", null, /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Name')), /*#__PURE__*/_react.default.createElement("td", null, device.getDisplayName())), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Device ID')), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, device.deviceId))), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Verification')), /*#__PURE__*/_react.default.createElement("td", null, verificationStatus)), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Ed25519 fingerprint')), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, device.getFingerprint())))));
  },
  _renderEventInfo: function () {
    const event = this.props.event;
    return /*#__PURE__*/_react.default.createElement("table", null, /*#__PURE__*/_react.default.createElement("tbody", null, /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('User ID')), /*#__PURE__*/_react.default.createElement("td", null, event.getSender())), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Curve25519 identity key')), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, event.getSenderKey() || /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('none'))))), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Claimed Ed25519 fingerprint key')), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, event.getKeysClaimed().ed25519 || /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('none'))))), /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Algorithm')), /*#__PURE__*/_react.default.createElement("td", null, event.getWireContent().algorithm || /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('unencrypted')))), event.getContent().msgtype === 'm.bad.encrypted' ? /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Decryption error')), /*#__PURE__*/_react.default.createElement("td", null, event.getContent().body)) : null, /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, (0, _languageHandler._t)('Session ID')), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("code", null, event.getWireContent().session_id || /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('none')))))));
  },
  render: function () {
    const DeviceVerifyButtons = sdk.getComponent('elements.DeviceVerifyButtons');
    let buttons = null;

    if (this.state.device) {
      buttons = /*#__PURE__*/_react.default.createElement(DeviceVerifyButtons, {
        device: this.state.device,
        userId: this.props.event.getSender()
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EncryptedEventDialog",
      onKeyDown: this.onKeyDown
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_title"
    }, (0, _languageHandler._t)('End-to-end encryption information')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("h4", null, (0, _languageHandler._t)('Event information')), this._renderEventInfo(), /*#__PURE__*/_react.default.createElement("h4", null, (0, _languageHandler._t)('Sender session information')), this._renderDeviceInfo()), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      className: "mx_Dialog_primary",
      onClick: this.props.onFinished,
      autoFocus: true
    }, (0, _languageHandler._t)('OK')), buttons));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRW5jcnlwdGVkRXZlbnREaWFsb2cuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJldmVudCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJvbkZpbmlzaGVkIiwiZnVuYyIsImdldEluaXRpYWxTdGF0ZSIsImRldmljZSIsImNvbXBvbmVudERpZE1vdW50IiwiX3VubW91bnRlZCIsImNsaWVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInJlZnJlc2hEZXZpY2UiLCJ0aGVuIiwiZGV2IiwiZG93bmxvYWRLZXlzIiwicHJvcHMiLCJnZXRTZW5kZXIiLCJzZXRTdGF0ZSIsIm9uIiwib25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkIiwiZXJyIiwiY29uc29sZSIsImxvZyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsImdldEV2ZW50U2VuZGVyRGV2aWNlSW5mbyIsInVzZXJJZCIsIm9uS2V5RG93biIsImUiLCJrZXkiLCJLZXkiLCJFU0NBUEUiLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsIl9yZW5kZXJEZXZpY2VJbmZvIiwic3RhdGUiLCJ2ZXJpZmljYXRpb25TdGF0dXMiLCJpc0Jsb2NrZWQiLCJpc1ZlcmlmaWVkIiwiZ2V0RGlzcGxheU5hbWUiLCJkZXZpY2VJZCIsImdldEZpbmdlcnByaW50IiwiX3JlbmRlckV2ZW50SW5mbyIsImdldFNlbmRlcktleSIsImdldEtleXNDbGFpbWVkIiwiZWQyNTUxOSIsImdldFdpcmVDb250ZW50IiwiYWxnb3JpdGhtIiwiZ2V0Q29udGVudCIsIm1zZ3R5cGUiLCJib2R5Iiwic2Vzc2lvbl9pZCIsInJlbmRlciIsIkRldmljZVZlcmlmeUJ1dHRvbnMiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJidXR0b25z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O0FBRUEsUUFBSUMsT0FBTyxHQUFHLElBQWQ7O0FBQ0EsUUFBSSxLQUFLckIsS0FBTCxDQUFXaEMsTUFBZixFQUF1QjtBQUNuQnFELE1BQUFBLE9BQU8sZ0JBQ0gsNkJBQUMsbUJBQUQ7QUFBcUIsUUFBQSxNQUFNLEVBQUUsS0FBS3JCLEtBQUwsQ0FBV2hDLE1BQXhDO0FBQ0ksUUFBQSxNQUFNLEVBQUUsS0FBS1UsS0FBTCxDQUFXakIsS0FBWCxDQUFpQmtCLFNBQWpCO0FBRFosUUFESjtBQUtIOztBQUVELHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUMseUJBQWY7QUFBeUMsTUFBQSxTQUFTLEVBQUUsS0FBS2E7QUFBekQsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ00seUJBQUcsbUNBQUgsQ0FETixDQURKLGVBSUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJLHlDQUFNLHlCQUFHLG1CQUFILENBQU4sQ0FESixFQUVNLEtBQUtlLGdCQUFMLEVBRk4sZUFJSSx5Q0FBTSx5QkFBRyw0QkFBSCxDQUFOLENBSkosRUFLTSxLQUFLUixpQkFBTCxFQUxOLENBSkosZUFXSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBUSxNQUFBLFNBQVMsRUFBQyxtQkFBbEI7QUFBc0MsTUFBQSxPQUFPLEVBQUUsS0FBS3JCLEtBQUwsQ0FBV2IsVUFBMUQ7QUFBc0UsTUFBQSxTQUFTLEVBQUU7QUFBakYsT0FDTSx5QkFBRyxJQUFILENBRE4sQ0FESixFQUlNd0QsT0FKTixDQVhKLENBREo7QUFvQkg7QUFqTDJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQge0tleX0gZnJvbSBcIi4uLy4uLy4uL0tleWJvYXJkXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5cbi8vIFhYWDogVGhpcyBjb21wb25lbnQgaXMgbm90IGNyb3NzLXNpZ25pbmcgYXdhcmUuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8xMTc1MiB0cmFja3MgZWl0aGVyIHVwZGF0aW5nIHRoaXNcbi8vIGNvbXBvbmVudCBvciB0YWtpbmcgaXQgb3V0IHRvIHBhc3R1cmUuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0VuY3J5cHRlZEV2ZW50RGlhbG9nJyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBldmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4geyBkZXZpY2U6IG51bGwgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuXG4gICAgICAgIC8vIGZpcnN0IHRyeSB0byBsb2FkIHRoZSBkZXZpY2UgZnJvbSBvdXIgc3RvcmUuXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMucmVmcmVzaERldmljZSgpLnRoZW4oKGRldikgPT4ge1xuICAgICAgICAgICAgaWYgKGRldikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXY7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRlbGwgdGhlIGNsaWVudCB0byB0cnkgdG8gcmVmcmVzaCB0aGUgZGV2aWNlIGxpc3QgZm9yIHRoaXMgdXNlclxuICAgICAgICAgICAgcmV0dXJuIGNsaWVudC5kb3dubG9hZEtleXMoW3RoaXMucHJvcHMuZXZlbnQuZ2V0U2VuZGVyKCldLCB0cnVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZyZXNoRGV2aWNlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigoZGV2KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgZGV2aWNlOiBkZXYgfSk7XG4gICAgICAgICAgICBjbGllbnQub24oXCJkZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkXCIsIHRoaXMub25EZXZpY2VWZXJpZmljYXRpb25DaGFuZ2VkKTtcbiAgICAgICAgfSwgKGVycik9PntcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgZG93bmxvYWRpbmcgZGV2aWNlc1wiLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGllbnQpIHtcbiAgICAgICAgICAgIGNsaWVudC5yZW1vdmVMaXN0ZW5lcihcImRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWRcIiwgdGhpcy5vbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlZnJlc2hEZXZpY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBQcm9taXNlLnJlc29sdmUgdG8gaGFuZGxlIHRyYW5zaXRpb24gZnJvbSBzdGF0aWMgcmVzdWx0IHRvIHByb21pc2U7IGNhbiBiZSByZW1vdmVkXG4gICAgICAgIC8vIGluIGZ1dHVyZVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRFdmVudFNlbmRlckRldmljZUluZm8odGhpcy5wcm9wcy5ldmVudCkpO1xuICAgIH0sXG5cbiAgICBvbkRldmljZVZlcmlmaWNhdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKHVzZXJJZCwgZGV2aWNlKSB7XG4gICAgICAgIGlmICh1c2VySWQgPT09IHRoaXMucHJvcHMuZXZlbnQuZ2V0U2VuZGVyKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaERldmljZSgpLnRoZW4oKGRldikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBkZXZpY2U6IGRldiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uS2V5RG93bjogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS5rZXkgPT09IEtleS5FU0NBUEUpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yZW5kZXJEZXZpY2VJbmZvOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgZGV2aWNlID0gdGhpcy5zdGF0ZS5kZXZpY2U7XG4gICAgICAgIGlmICghZGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxpPnsgX3QoJ3Vua25vd24gZGV2aWNlJykgfTwvaT4pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHZlcmlmaWNhdGlvblN0YXR1cyA9ICg8Yj57IF90KCdOT1QgdmVyaWZpZWQnKSB9PC9iPik7XG4gICAgICAgIGlmIChkZXZpY2UuaXNCbG9ja2VkKCkpIHtcbiAgICAgICAgICAgIHZlcmlmaWNhdGlvblN0YXR1cyA9ICg8Yj57IF90KCdCbGFja2xpc3RlZCcpIH08L2I+KTtcbiAgICAgICAgfSBlbHNlIGlmIChkZXZpY2UuaXNWZXJpZmllZCgpKSB7XG4gICAgICAgICAgICB2ZXJpZmljYXRpb25TdGF0dXMgPSBfdCgndmVyaWZpZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+eyBfdCgnTmFtZScpIH08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IF90KCdEZXZpY2UgSUQnKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT57IGRldmljZS5kZXZpY2VJZCB9PC9jb2RlPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IF90KCdWZXJpZmljYXRpb24nKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IHZlcmlmaWNhdGlvblN0YXR1cyB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoJ0VkMjU1MTkgZmluZ2VycHJpbnQnKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT57IGRldmljZS5nZXRGaW5nZXJwcmludCgpIH08L2NvZGU+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX3JlbmRlckV2ZW50SW5mbzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5wcm9wcy5ldmVudDtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoJ1VzZXIgSUQnKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IGV2ZW50LmdldFNlbmRlcigpIH08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+eyBfdCgnQ3VydmUyNTUxOSBpZGVudGl0eSBrZXknKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT57IGV2ZW50LmdldFNlbmRlcktleSgpIHx8IDxpPnsgX3QoJ25vbmUnKSB9PC9pPiB9PC9jb2RlPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IF90KCdDbGFpbWVkIEVkMjU1MTkgZmluZ2VycHJpbnQga2V5JykgfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+eyBldmVudC5nZXRLZXlzQ2xhaW1lZCgpLmVkMjU1MTkgfHwgPGk+eyBfdCgnbm9uZScpIH08L2k+IH08L2NvZGU+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoJ0FsZ29yaXRobScpIH08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgZXZlbnQuZ2V0V2lyZUNvbnRlbnQoKS5hbGdvcml0aG0gfHwgPGk+eyBfdCgndW5lbmNyeXB0ZWQnKSB9PC9pPiB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmdldENvbnRlbnQoKS5tc2d0eXBlID09PSAnbS5iYWQuZW5jcnlwdGVkJyA/IChcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoJ0RlY3J5cHRpb24gZXJyb3InKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57IGV2ZW50LmdldENvbnRlbnQoKS5ib2R5IH08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICApIDogbnVsbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnsgX3QoJ1Nlc3Npb24gSUQnKSB9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT57IGV2ZW50LmdldFdpcmVDb250ZW50KCkuc2Vzc2lvbl9pZCB8fCA8aT57IF90KCdub25lJykgfTwvaT4gfTwvY29kZT48L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBEZXZpY2VWZXJpZnlCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRGV2aWNlVmVyaWZ5QnV0dG9ucycpO1xuXG4gICAgICAgIGxldCBidXR0b25zID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGV2aWNlKSB7XG4gICAgICAgICAgICBidXR0b25zID0gKFxuICAgICAgICAgICAgICAgIDxEZXZpY2VWZXJpZnlCdXR0b25zIGRldmljZT17dGhpcy5zdGF0ZS5kZXZpY2V9XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZD17dGhpcy5wcm9wcy5ldmVudC5nZXRTZW5kZXIoKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0VuY3J5cHRlZEV2ZW50RGlhbG9nXCIgb25LZXlEb3duPXt0aGlzLm9uS2V5RG93bn0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBfdCgnRW5kLXRvLWVuZCBlbmNyeXB0aW9uIGluZm9ybWF0aW9uJykgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg0PnsgX3QoJ0V2ZW50IGluZm9ybWF0aW9uJykgfTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5fcmVuZGVyRXZlbnRJbmZvKCkgfVxuXG4gICAgICAgICAgICAgICAgICAgIDxoND57IF90KCdTZW5kZXIgc2Vzc2lvbiBpbmZvcm1hdGlvbicpIH08L2g0PlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX3JlbmRlckRldmljZUluZm8oKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cIm14X0RpYWxvZ19wcmltYXJ5XCIgb25DbGljaz17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfSBhdXRvRm9jdXM9e3RydWV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnT0snKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICB7IGJ1dHRvbnMgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19