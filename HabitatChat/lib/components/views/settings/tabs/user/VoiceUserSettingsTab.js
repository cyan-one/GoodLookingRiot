"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _languageHandler = require("../../../../../languageHandler");

var _CallMediaHandler = _interopRequireDefault(require("../../../../../CallMediaHandler"));

var _Field = _interopRequireDefault(require("../../../elements/Field"));

var _AccessibleButton = _interopRequireDefault(require("../../../elements/AccessibleButton"));

var _SettingsStore = require("../../../../../settings/SettingsStore");

var _MatrixClientPeg = require("../../../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../../../index"));

var _Modal = _interopRequireDefault(require("../../../../../Modal"));

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
class VoiceUserSettingsTab extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_refreshMediaDevices", async stream => {
      this.setState({
        mediaDevices: await _CallMediaHandler.default.getDevices(),
        activeAudioOutput: _CallMediaHandler.default.getAudioOutput(),
        activeAudioInput: _CallMediaHandler.default.getAudioInput(),
        activeVideoInput: _CallMediaHandler.default.getVideoInput()
      });

      if (stream) {
        // kill stream (after we've enumerated the devices, otherwise we'd get empty labels again)
        // so that we don't leave it lingering around with webcam enabled etc
        // as here we called gUM to ask user for permission to their device names only
        stream.getTracks().forEach(track => track.stop());
      }
    });
    (0, _defineProperty2.default)(this, "_requestMediaPermissions", async () => {
      let constraints;
      let stream;
      let error;

      try {
        constraints = {
          video: true,
          audio: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // user likely doesn't have a webcam,
        // we should still allow to select a microphone
        if (err.name === "NotFoundError") {
          constraints = {
            audio: true
          };

          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (err) {
            error = err;
          }
        } else {
          error = err;
        }
      }

      if (error) {
        const ErrorDialog = sdk.getComponent('dialogs.ErrorDialog');

        _Modal.default.createTrackedDialog('No media permissions', '', ErrorDialog, {
          title: (0, _languageHandler._t)('No media permissions'),
          description: (0, _languageHandler._t)('You may need to manually permit Riot to access your microphone/webcam')
        });
      } else {
        this._refreshMediaDevices(stream);
      }
    });
    (0, _defineProperty2.default)(this, "_setAudioOutput", e => {
      _CallMediaHandler.default.setAudioOutput(e.target.value);

      this.setState({
        activeAudioOutput: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_setAudioInput", e => {
      _CallMediaHandler.default.setAudioInput(e.target.value);

      this.setState({
        activeAudioInput: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_setVideoInput", e => {
      _CallMediaHandler.default.setVideoInput(e.target.value);

      this.setState({
        activeVideoInput: e.target.value
      });
    });
    (0, _defineProperty2.default)(this, "_changeWebRtcMethod", p2p => {
      _MatrixClientPeg.MatrixClientPeg.get().setForceTURN(!p2p);
    });
    (0, _defineProperty2.default)(this, "_changeFallbackICEServerAllowed", allow => {
      _MatrixClientPeg.MatrixClientPeg.get().setFallbackICEServerAllowed(allow);
    });
    this.state = {
      mediaDevices: false,
      activeAudioOutput: null,
      activeAudioInput: null,
      activeVideoInput: null
    };
  }

  async componentDidMount() {
    const canSeeDeviceLabels = await _CallMediaHandler.default.hasAnyLabeledDevices();

    if (canSeeDeviceLabels) {
      this._refreshMediaDevices();
    }
  }

  _renderDeviceOptions(devices, category) {
    return devices.map(d => {
      return /*#__PURE__*/_react.default.createElement("option", {
        key: "".concat(category, "-").concat(d.deviceId),
        value: d.deviceId
      }, d.label);
    });
  }

  render() {
    const SettingsFlag = sdk.getComponent("views.elements.SettingsFlag");
    let requestButton = null;
    let speakerDropdown = null;
    let microphoneDropdown = null;
    let webcamDropdown = null;

    if (this.state.mediaDevices === false) {
      requestButton = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VoiceUserSettingsTab_missingMediaPermissions"
      }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Missing media permissions, click the button below to request.")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._requestMediaPermissions,
        kind: "primary"
      }, (0, _languageHandler._t)("Request media permissions")));
    } else if (this.state.mediaDevices) {
      speakerDropdown = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('No Audio Outputs detected'));
      microphoneDropdown = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('No Microphones detected'));
      webcamDropdown = /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)('No Webcams detected'));
      const defaultOption = {
        deviceId: '',
        label: (0, _languageHandler._t)('Default Device')
      };

      const getDefaultDevice = devices => {
        if (!devices.some(i => i.deviceId === 'default')) {
          devices.unshift(defaultOption);
          return '';
        } else {
          return 'default';
        }
      };

      const audioOutputs = this.state.mediaDevices.audiooutput.slice(0);

      if (audioOutputs.length > 0) {
        const defaultDevice = getDefaultDevice(audioOutputs);
        speakerDropdown = /*#__PURE__*/_react.default.createElement(_Field.default, {
          element: "select",
          label: (0, _languageHandler._t)("Audio Output"),
          value: this.state.activeAudioOutput || defaultDevice,
          onChange: this._setAudioOutput
        }, this._renderDeviceOptions(audioOutputs, 'audioOutput'));
      }

      const audioInputs = this.state.mediaDevices.audioinput.slice(0);

      if (audioInputs.length > 0) {
        const defaultDevice = getDefaultDevice(audioInputs);
        microphoneDropdown = /*#__PURE__*/_react.default.createElement(_Field.default, {
          element: "select",
          label: (0, _languageHandler._t)("Microphone"),
          value: this.state.activeAudioInput || defaultDevice,
          onChange: this._setAudioInput
        }, this._renderDeviceOptions(audioInputs, 'audioInput'));
      }

      const videoInputs = this.state.mediaDevices.videoinput.slice(0);

      if (videoInputs.length > 0) {
        const defaultDevice = getDefaultDevice(videoInputs);
        webcamDropdown = /*#__PURE__*/_react.default.createElement(_Field.default, {
          element: "select",
          label: (0, _languageHandler._t)("Camera"),
          value: this.state.activeVideoInput || defaultDevice,
          onChange: this._setVideoInput
        }, this._renderDeviceOptions(videoInputs, 'videoInput'));
      }
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab mx_VoiceUserSettingsTab"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_heading"
    }, (0, _languageHandler._t)("Voice & Video")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_section"
    }, requestButton, speakerDropdown, microphoneDropdown, webcamDropdown, /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "VideoView.flipVideoHorizontally",
      level: _SettingsStore.SettingLevel.ACCOUNT
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "webRtcAllowPeerToPeer",
      level: _SettingsStore.SettingLevel.DEVICE,
      onChange: this._changeWebRtcMethod
    }), /*#__PURE__*/_react.default.createElement(SettingsFlag, {
      name: "fallbackICEServerAllowed",
      level: _SettingsStore.SettingLevel.DEVICE,
      onChange: this._changeFallbackICEServerAllowed
    })));
  }

}

exports.default = VoiceUserSettingsTab;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL3RhYnMvdXNlci9Wb2ljZVVzZXJTZXR0aW5nc1RhYi5qcyJdLCJuYW1lcyI6WyJWb2ljZVVzZXJTZXR0aW5nc1RhYiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJzdHJlYW0iLCJzZXRTdGF0ZSIsIm1lZGlhRGV2aWNlcyIsIkNhbGxNZWRpYUhhbmRsZXIiLCJnZXREZXZpY2VzIiwiYWN0aXZlQXVkaW9PdXRwdXQiLCJnZXRBdWRpb091dHB1dCIsImFjdGl2ZUF1ZGlvSW5wdXQiLCJnZXRBdWRpb0lucHV0IiwiYWN0aXZlVmlkZW9JbnB1dCIsImdldFZpZGVvSW5wdXQiLCJnZXRUcmFja3MiLCJmb3JFYWNoIiwidHJhY2siLCJzdG9wIiwiY29uc3RyYWludHMiLCJlcnJvciIsInZpZGVvIiwiYXVkaW8iLCJuYXZpZ2F0b3IiLCJnZXRVc2VyTWVkaWEiLCJlcnIiLCJuYW1lIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiX3JlZnJlc2hNZWRpYURldmljZXMiLCJlIiwic2V0QXVkaW9PdXRwdXQiLCJ0YXJnZXQiLCJ2YWx1ZSIsInNldEF1ZGlvSW5wdXQiLCJzZXRWaWRlb0lucHV0IiwicDJwIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwic2V0Rm9yY2VUVVJOIiwiYWxsb3ciLCJzZXRGYWxsYmFja0lDRVNlcnZlckFsbG93ZWQiLCJzdGF0ZSIsImNvbXBvbmVudERpZE1vdW50IiwiY2FuU2VlRGV2aWNlTGFiZWxzIiwiaGFzQW55TGFiZWxlZERldmljZXMiLCJfcmVuZGVyRGV2aWNlT3B0aW9ucyIsImRldmljZXMiLCJjYXRlZ29yeSIsIm1hcCIsImQiLCJkZXZpY2VJZCIsImxhYmVsIiwicmVuZGVyIiwiU2V0dGluZ3NGbGFnIiwicmVxdWVzdEJ1dHRvbiIsInNwZWFrZXJEcm9wZG93biIsIm1pY3JvcGhvbmVEcm9wZG93biIsIndlYmNhbURyb3Bkb3duIiwiX3JlcXVlc3RNZWRpYVBlcm1pc3Npb25zIiwiZGVmYXVsdE9wdGlvbiIsImdldERlZmF1bHREZXZpY2UiLCJzb21lIiwiaSIsInVuc2hpZnQiLCJhdWRpb091dHB1dHMiLCJhdWRpb291dHB1dCIsInNsaWNlIiwibGVuZ3RoIiwiZGVmYXVsdERldmljZSIsIl9zZXRBdWRpb091dHB1dCIsImF1ZGlvSW5wdXRzIiwiYXVkaW9pbnB1dCIsIl9zZXRBdWRpb0lucHV0IiwidmlkZW9JbnB1dHMiLCJ2aWRlb2lucHV0IiwiX3NldFZpZGVvSW5wdXQiLCJTZXR0aW5nTGV2ZWwiLCJBQ0NPVU5UIiwiREVWSUNFIiwiX2NoYW5nZVdlYlJ0Y01ldGhvZCIsIl9jaGFuZ2VGYWxsYmFja0lDRVNlcnZlckFsbG93ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBeEJBOzs7Ozs7Ozs7Ozs7Ozs7QUEwQmUsTUFBTUEsb0JBQU4sU0FBbUNDLGVBQU1DLFNBQXpDLENBQW1EO0FBQzlEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLGdFQWtCUyxNQUFPQyxNQUFQLElBQWtCO0FBQ3JDLFdBQUtDLFFBQUwsQ0FBYztBQUNWQyxRQUFBQSxZQUFZLEVBQUUsTUFBTUMsMEJBQWlCQyxVQUFqQixFQURWO0FBRVZDLFFBQUFBLGlCQUFpQixFQUFFRiwwQkFBaUJHLGNBQWpCLEVBRlQ7QUFHVkMsUUFBQUEsZ0JBQWdCLEVBQUVKLDBCQUFpQkssYUFBakIsRUFIUjtBQUlWQyxRQUFBQSxnQkFBZ0IsRUFBRU4sMEJBQWlCTyxhQUFqQjtBQUpSLE9BQWQ7O0FBTUEsVUFBSVYsTUFBSixFQUFZO0FBQ1I7QUFDQTtBQUNBO0FBQ0FBLFFBQUFBLE1BQU0sQ0FBQ1csU0FBUCxHQUFtQkMsT0FBbkIsQ0FBNEJD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SCxDQUF6QyxDQURKLGVBRUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0tuQixhQURMLEVBRUtDLGVBRkwsRUFHS0Msa0JBSEwsRUFJS0MsY0FKTCxlQUtJLDZCQUFDLFlBQUQ7QUFBYyxNQUFBLElBQUksRUFBQyxpQ0FBbkI7QUFBcUQsTUFBQSxLQUFLLEVBQUVtQiw0QkFBYUM7QUFBekUsTUFMSixlQU1JLDZCQUFDLFlBQUQ7QUFDSSxNQUFBLElBQUksRUFBQyx1QkFEVDtBQUVJLE1BQUEsS0FBSyxFQUFFRCw0QkFBYUUsTUFGeEI7QUFHSSxNQUFBLFFBQVEsRUFBRSxLQUFLQztBQUhuQixNQU5KLGVBV0ksNkJBQUMsWUFBRDtBQUNJLE1BQUEsSUFBSSxFQUFDLDBCQURUO0FBRUksTUFBQSxLQUFLLEVBQUVILDRCQUFhRSxNQUZ4QjtBQUdJLE1BQUEsUUFBUSxFQUFFLEtBQUtFO0FBSG5CLE1BWEosQ0FGSixDQURKO0FBc0JIOztBQWxNNkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IENhbGxNZWRpYUhhbmRsZXIgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL0NhbGxNZWRpYUhhbmRsZXJcIjtcbmltcG9ydCBGaWVsZCBmcm9tIFwiLi4vLi4vLi4vZWxlbWVudHMvRmllbGRcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi8uLi8uLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5pbXBvcnQge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uLy4uLy4uLy4uL01vZGFsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZvaWNlVXNlclNldHRpbmdzVGFiIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgbWVkaWFEZXZpY2VzOiBmYWxzZSxcbiAgICAgICAgICAgIGFjdGl2ZUF1ZGlvT3V0cHV0OiBudWxsLFxuICAgICAgICAgICAgYWN0aXZlQXVkaW9JbnB1dDogbnVsbCxcbiAgICAgICAgICAgIGFjdGl2ZVZpZGVvSW5wdXQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnN0IGNhblNlZURldmljZUxhYmVscyA9IGF3YWl0IENhbGxNZWRpYUhhbmRsZXIuaGFzQW55TGFiZWxlZERldmljZXMoKTtcbiAgICAgICAgaWYgKGNhblNlZURldmljZUxhYmVscykge1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaE1lZGlhRGV2aWNlcygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlZnJlc2hNZWRpYURldmljZXMgPSBhc3luYyAoc3RyZWFtKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbWVkaWFEZXZpY2VzOiBhd2FpdCBDYWxsTWVkaWFIYW5kbGVyLmdldERldmljZXMoKSxcbiAgICAgICAgICAgIGFjdGl2ZUF1ZGlvT3V0cHV0OiBDYWxsTWVkaWFIYW5kbGVyLmdldEF1ZGlvT3V0cHV0KCksXG4gICAgICAgICAgICBhY3RpdmVBdWRpb0lucHV0OiBDYWxsTWVkaWFIYW5kbGVyLmdldEF1ZGlvSW5wdXQoKSxcbiAgICAgICAgICAgIGFjdGl2ZVZpZGVvSW5wdXQ6IENhbGxNZWRpYUhhbmRsZXIuZ2V0VmlkZW9JbnB1dCgpLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHN0cmVhbSkge1xuICAgICAgICAgICAgLy8ga2lsbCBzdHJlYW0gKGFmdGVyIHdlJ3ZlIGVudW1lcmF0ZWQgdGhlIGRldmljZXMsIG90aGVyd2lzZSB3ZSdkIGdldCBlbXB0eSBsYWJlbHMgYWdhaW4pXG4gICAgICAgICAgICAvLyBzbyB0aGF0IHdlIGRvbid0IGxlYXZlIGl0IGxpbmdlcmluZyBhcm91bmQgd2l0aCB3ZWJjYW0gZW5hYmxlZCBldGNcbiAgICAgICAgICAgIC8vIGFzIGhlcmUgd2UgY2FsbGVkIGdVTSB0byBhc2sgdXNlciBmb3IgcGVybWlzc2lvbiB0byB0aGVpciBkZXZpY2UgbmFtZXMgb25seVxuICAgICAgICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2goKHRyYWNrKSA9PiB0cmFjay5zdG9wKCkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9yZXF1ZXN0TWVkaWFQZXJtaXNzaW9ucyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNvbnN0cmFpbnRzO1xuICAgICAgICBsZXQgc3RyZWFtO1xuICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdHJhaW50cyA9IHt2aWRlbzogdHJ1ZSwgYXVkaW86IHRydWV9O1xuICAgICAgICAgICAgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIHVzZXIgbGlrZWx5IGRvZXNuJ3QgaGF2ZSBhIHdlYmNhbSxcbiAgICAgICAgICAgIC8vIHdlIHNob3VsZCBzdGlsbCBhbGxvdyB0byBzZWxlY3QgYSBtaWNyb3Bob25lXG4gICAgICAgICAgICBpZiAoZXJyLm5hbWUgPT09IFwiTm90Rm91bmRFcnJvclwiKSB7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMgPSB7IGF1ZGlvOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLkVycm9yRGlhbG9nJyk7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdObyBtZWRpYSBwZXJtaXNzaW9ucycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnTm8gbWVkaWEgcGVybWlzc2lvbnMnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1lvdSBtYXkgbmVlZCB0byBtYW51YWxseSBwZXJtaXQgUmlvdCB0byBhY2Nlc3MgeW91ciBtaWNyb3Bob25lL3dlYmNhbScpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoTWVkaWFEZXZpY2VzKHN0cmVhbSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX3NldEF1ZGlvT3V0cHV0ID0gKGUpID0+IHtcbiAgICAgICAgQ2FsbE1lZGlhSGFuZGxlci5zZXRBdWRpb091dHB1dChlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYWN0aXZlQXVkaW9PdXRwdXQ6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX3NldEF1ZGlvSW5wdXQgPSAoZSkgPT4ge1xuICAgICAgICBDYWxsTWVkaWFIYW5kbGVyLnNldEF1ZGlvSW5wdXQoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGFjdGl2ZUF1ZGlvSW5wdXQ6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX3NldFZpZGVvSW5wdXQgPSAoZSkgPT4ge1xuICAgICAgICBDYWxsTWVkaWFIYW5kbGVyLnNldFZpZGVvSW5wdXQoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGFjdGl2ZVZpZGVvSW5wdXQ6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX2NoYW5nZVdlYlJ0Y01ldGhvZCA9IChwMnApID0+IHtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldEZvcmNlVFVSTighcDJwKTtcbiAgICB9O1xuXG4gICAgX2NoYW5nZUZhbGxiYWNrSUNFU2VydmVyQWxsb3dlZCA9IChhbGxvdykgPT4ge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2V0RmFsbGJhY2tJQ0VTZXJ2ZXJBbGxvd2VkKGFsbG93KTtcbiAgICB9O1xuXG4gICAgX3JlbmRlckRldmljZU9wdGlvbnMoZGV2aWNlcywgY2F0ZWdvcnkpIHtcbiAgICAgICAgcmV0dXJuIGRldmljZXMubWFwKChkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKDxvcHRpb24ga2V5PXtgJHtjYXRlZ29yeX0tJHtkLmRldmljZUlkfWB9IHZhbHVlPXtkLmRldmljZUlkfT57ZC5sYWJlbH08L29wdGlvbj4pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IFNldHRpbmdzRmxhZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5lbGVtZW50cy5TZXR0aW5nc0ZsYWdcIik7XG5cbiAgICAgICAgbGV0IHJlcXVlc3RCdXR0b24gPSBudWxsO1xuICAgICAgICBsZXQgc3BlYWtlckRyb3Bkb3duID0gbnVsbDtcbiAgICAgICAgbGV0IG1pY3JvcGhvbmVEcm9wZG93biA9IG51bGw7XG4gICAgICAgIGxldCB3ZWJjYW1Ecm9wZG93biA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLm1lZGlhRGV2aWNlcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJlcXVlc3RCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1ZvaWNlVXNlclNldHRpbmdzVGFiX21pc3NpbmdNZWRpYVBlcm1pc3Npb25zJz5cbiAgICAgICAgICAgICAgICAgICAgPHA+e190KFwiTWlzc2luZyBtZWRpYSBwZXJtaXNzaW9ucywgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byByZXF1ZXN0LlwiKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX3JlcXVlc3RNZWRpYVBlcm1pc3Npb25zfSBraW5kPVwicHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiUmVxdWVzdCBtZWRpYSBwZXJtaXNzaW9uc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLm1lZGlhRGV2aWNlcykge1xuICAgICAgICAgICAgc3BlYWtlckRyb3Bkb3duID0gPHA+eyBfdCgnTm8gQXVkaW8gT3V0cHV0cyBkZXRlY3RlZCcpIH08L3A+O1xuICAgICAgICAgICAgbWljcm9waG9uZURyb3Bkb3duID0gPHA+eyBfdCgnTm8gTWljcm9waG9uZXMgZGV0ZWN0ZWQnKSB9PC9wPjtcbiAgICAgICAgICAgIHdlYmNhbURyb3Bkb3duID0gPHA+eyBfdCgnTm8gV2ViY2FtcyBkZXRlY3RlZCcpIH08L3A+O1xuXG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0T3B0aW9uID0ge1xuICAgICAgICAgICAgICAgIGRldmljZUlkOiAnJyxcbiAgICAgICAgICAgICAgICBsYWJlbDogX3QoJ0RlZmF1bHQgRGV2aWNlJyksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgZ2V0RGVmYXVsdERldmljZSA9IChkZXZpY2VzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFkZXZpY2VzLnNvbWUoKGkpID0+IGkuZGV2aWNlSWQgPT09ICdkZWZhdWx0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlcy51bnNoaWZ0KGRlZmF1bHRPcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBhdWRpb091dHB1dHMgPSB0aGlzLnN0YXRlLm1lZGlhRGV2aWNlcy5hdWRpb291dHB1dC5zbGljZSgwKTtcbiAgICAgICAgICAgIGlmIChhdWRpb091dHB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHREZXZpY2UgPSBnZXREZWZhdWx0RGV2aWNlKGF1ZGlvT3V0cHV0cyk7XG4gICAgICAgICAgICAgICAgc3BlYWtlckRyb3Bkb3duID0gKFxuICAgICAgICAgICAgICAgICAgICA8RmllbGQgZWxlbWVudD1cInNlbGVjdFwiIGxhYmVsPXtfdChcIkF1ZGlvIE91dHB1dFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmFjdGl2ZUF1ZGlvT3V0cHV0IHx8IGRlZmF1bHREZXZpY2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fc2V0QXVkaW9PdXRwdXR9PlxuICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckRldmljZU9wdGlvbnMoYXVkaW9PdXRwdXRzLCAnYXVkaW9PdXRwdXQnKX1cbiAgICAgICAgICAgICAgICAgICAgPC9GaWVsZD5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhdWRpb0lucHV0cyA9IHRoaXMuc3RhdGUubWVkaWFEZXZpY2VzLmF1ZGlvaW5wdXQuc2xpY2UoMCk7XG4gICAgICAgICAgICBpZiAoYXVkaW9JbnB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHREZXZpY2UgPSBnZXREZWZhdWx0RGV2aWNlKGF1ZGlvSW5wdXRzKTtcbiAgICAgICAgICAgICAgICBtaWNyb3Bob25lRHJvcGRvd24gPSAoXG4gICAgICAgICAgICAgICAgICAgIDxGaWVsZCBlbGVtZW50PVwic2VsZWN0XCIgbGFiZWw9e190KFwiTWljcm9waG9uZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmFjdGl2ZUF1ZGlvSW5wdXQgfHwgZGVmYXVsdERldmljZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9zZXRBdWRpb0lucHV0fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJEZXZpY2VPcHRpb25zKGF1ZGlvSW5wdXRzLCAnYXVkaW9JbnB1dCcpfVxuICAgICAgICAgICAgICAgICAgICA8L0ZpZWxkPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHZpZGVvSW5wdXRzID0gdGhpcy5zdGF0ZS5tZWRpYURldmljZXMudmlkZW9pbnB1dC5zbGljZSgwKTtcbiAgICAgICAgICAgIGlmICh2aWRlb0lucHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdERldmljZSA9IGdldERlZmF1bHREZXZpY2UodmlkZW9JbnB1dHMpO1xuICAgICAgICAgICAgICAgIHdlYmNhbURyb3Bkb3duID0gKFxuICAgICAgICAgICAgICAgICAgICA8RmllbGQgZWxlbWVudD1cInNlbGVjdFwiIGxhYmVsPXtfdChcIkNhbWVyYVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmFjdGl2ZVZpZGVvSW5wdXQgfHwgZGVmYXVsdERldmljZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9zZXRWaWRlb0lucHV0fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJEZXZpY2VPcHRpb25zKHZpZGVvSW5wdXRzLCAndmlkZW9JbnB1dCcpfVxuICAgICAgICAgICAgICAgICAgICA8L0ZpZWxkPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYiBteF9Wb2ljZVVzZXJTZXR0aW5nc1RhYlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2V0dGluZ3NUYWJfaGVhZGluZ1wiPntfdChcIlZvaWNlICYgVmlkZW9cIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TZXR0aW5nc1RhYl9zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHtyZXF1ZXN0QnV0dG9ufVxuICAgICAgICAgICAgICAgICAgICB7c3BlYWtlckRyb3Bkb3dufVxuICAgICAgICAgICAgICAgICAgICB7bWljcm9waG9uZURyb3Bkb3dufVxuICAgICAgICAgICAgICAgICAgICB7d2ViY2FtRHJvcGRvd259XG4gICAgICAgICAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWcgbmFtZT0nVmlkZW9WaWV3LmZsaXBWaWRlb0hvcml6b250YWxseScgbGV2ZWw9e1NldHRpbmdMZXZlbC5BQ0NPVU5UfSAvPlxuICAgICAgICAgICAgICAgICAgICA8U2V0dGluZ3NGbGFnXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lPSd3ZWJSdGNBbGxvd1BlZXJUb1BlZXInXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbD17U2V0dGluZ0xldmVsLkRFVklDRX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9jaGFuZ2VXZWJSdGNNZXRob2R9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9J2ZhbGxiYWNrSUNFU2VydmVyQWxsb3dlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsPXtTZXR0aW5nTGV2ZWwuREVWSUNFfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX2NoYW5nZUZhbGxiYWNrSUNFU2VydmVyQWxsb3dlZH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==