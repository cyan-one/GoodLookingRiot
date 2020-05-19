"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _InteractiveAuthEntryComponents = require("../auth/InteractiveAuthEntryComponents");

/*
Copyright 2016 OpenMarket Ltd
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
class DevicesPanel extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {
      devices: undefined,
      deviceLoadError: undefined,
      selectedDevices: [],
      deleting: false
    };
    this._unmounted = false;
    this._renderDevice = this._renderDevice.bind(this);
    this._onDeviceSelectionToggled = this._onDeviceSelectionToggled.bind(this);
    this._onDeleteClick = this._onDeleteClick.bind(this);
  }

  componentDidMount() {
    this._loadDevices();
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _loadDevices() {
    _MatrixClientPeg.MatrixClientPeg.get().getDevices().then(resp => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        devices: resp.devices || []
      });
    }, error => {
      if (this._unmounted) {
        return;
      }

      let errtxt;

      if (error.httpStatus == 404) {
        // 404 probably means the HS doesn't yet support the API.
        errtxt = (0, _languageHandler._t)("Your homeserver does not support session management.");
      } else {
        console.error("Error loading sessions:", error);
        errtxt = (0, _languageHandler._t)("Unable to load session list");
      }

      this.setState({
        deviceLoadError: errtxt
      });
    });
  }
  /**
   * compare two devices, sorting from most-recently-seen to least-recently-seen
   * (and then, for stability, by device id)
   */


  _deviceCompare(a, b) {
    // return < 0 if a comes before b, > 0 if a comes after b.
    const lastSeenDelta = (b.last_seen_ts || 0) - (a.last_seen_ts || 0);

    if (lastSeenDelta !== 0) {
      return lastSeenDelta;
    }

    const idA = a.device_id;
    const idB = b.device_id;
    return idA < idB ? -1 : idA > idB ? 1 : 0;
  }

  _onDeviceSelectionToggled(device) {
    if (this._unmounted) {
      return;
    }

    const deviceId = device.device_id;
    this.setState((state, props) => {
      // Make a copy of the selected devices, then add or remove the device
      const selectedDevices = state.selectedDevices.slice();
      const i = selectedDevices.indexOf(deviceId);

      if (i === -1) {
        selectedDevices.push(deviceId);
      } else {
        selectedDevices.splice(i, 1);
      }

      return {
        selectedDevices
      };
    });
  }

  _onDeleteClick() {
    this.setState({
      deleting: true
    });

    this._makeDeleteRequest(null).catch(error => {
      if (this._unmounted) {
        return;
      }

      if (error.httpStatus !== 401 || !error.data || !error.data.flows) {
        // doesn't look like an interactive-auth failure
        throw error;
      } // pop up an interactive auth dialog


      const InteractiveAuthDialog = sdk.getComponent("dialogs.InteractiveAuthDialog");
      const numDevices = this.state.selectedDevices.length;
      const dialogAesthetics = {
        [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
          title: (0, _languageHandler._t)("Use Single Sign On to continue"),
          body: (0, _languageHandler._t)("Confirm deleting these sessions by using Single Sign On to prove your identity.", {
            count: numDevices
          }),
          continueText: (0, _languageHandler._t)("Single Sign On"),
          continueKind: "primary"
        },
        [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
          title: (0, _languageHandler._t)("Confirm deleting these sessions"),
          body: (0, _languageHandler._t)("Click the button below to confirm deleting these sessions.", {
            count: numDevices
          }),
          continueText: (0, _languageHandler._t)("Delete sessions", {
            count: numDevices
          }),
          continueKind: "danger"
        }
      };

      _Modal.default.createTrackedDialog('Delete Device Dialog', '', InteractiveAuthDialog, {
        title: (0, _languageHandler._t)("Authentication"),
        matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
        authData: error.data,
        makeRequest: this._makeDeleteRequest.bind(this),
        aestheticsForStagePhases: {
          [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: dialogAesthetics,
          [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: dialogAesthetics
        }
      });
    }).catch(e => {
      console.error("Error deleting sessions", e);

      if (this._unmounted) {
        return;
      }
    }).finally(() => {
      this.setState({
        deleting: false
      });
    });
  }

  _makeDeleteRequest(auth) {
    return _MatrixClientPeg.MatrixClientPeg.get().deleteMultipleDevices(this.state.selectedDevices, auth).then(() => {
      // Remove the deleted devices from `devices`, reset selection to []
      this.setState({
        devices: this.state.devices.filter(d => !this.state.selectedDevices.includes(d.device_id)),
        selectedDevices: []
      });
    });
  }

  _renderDevice(device) {
    const DevicesPanelEntry = sdk.getComponent('settings.DevicesPanelEntry');
    return /*#__PURE__*/_react.default.createElement(DevicesPanelEntry, {
      key: device.device_id,
      device: device,
      selected: this.state.selectedDevices.includes(device.device_id),
      onDeviceToggled: this._onDeviceSelectionToggled
    });
  }

  render() {
    const Spinner = sdk.getComponent("elements.Spinner");
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");

    if (this.state.deviceLoadError !== undefined) {
      const classes = (0, _classnames.default)(this.props.className, "error");
      return /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, this.state.deviceLoadError);
    }

    const devices = this.state.devices;

    if (devices === undefined) {
      // still loading
      const classes = this.props.className;
      return /*#__PURE__*/_react.default.createElement(Spinner, {
        className: classes
      });
    }

    devices.sort(this._deviceCompare);
    const deleteButton = this.state.deleting ? /*#__PURE__*/_react.default.createElement(Spinner, {
      w: 22,
      h: 22
    }) : /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      onClick: this._onDeleteClick,
      kind: "danger_sm"
    }, (0, _languageHandler._t)("Delete %(count)s sessions", {
      count: this.state.selectedDevices.length
    }));
    const classes = (0, _classnames.default)(this.props.className, "mx_DevicesPanel");
    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevicesPanel_header"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevicesPanel_deviceId"
    }, (0, _languageHandler._t)("ID")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevicesPanel_deviceName"
    }, (0, _languageHandler._t)("Public Name")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevicesPanel_deviceLastSeen"
    }, (0, _languageHandler._t)("Last seen")), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevicesPanel_deviceButtons"
    }, this.state.selectedDevices.length > 0 ? deleteButton : null)), devices.map(this._renderDevice));
  }

}

exports.default = DevicesPanel;
DevicesPanel.propTypes = {
  className: _propTypes.default.string
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0RldmljZXNQYW5lbC5qcyJdLCJuYW1lcyI6WyJEZXZpY2VzUGFuZWwiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsImRldmljZXMiLCJ1bmRlZmluZWQiLCJkZXZpY2VMb2FkRXJyb3IiLCJzZWxlY3RlZERldmljZXMiLCJkZWxldGluZyIsIl91bm1vdW50ZWQiLCJfcmVuZGVyRGV2aWNlIiwiYmluZCIsIl9vbkRldmljZVNlbGVjdGlvblRvZ2dsZWQiLCJfb25EZWxldGVDbGljayIsImNvbXBvbmVudERpZE1vdW50IiwiX2xvYWREZXZpY2VzIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXREZXZpY2VzIiwidGhlbiIsInJlc3AiLCJzZXRTdGF0ZSIsImVycm9yIiwiZXJydHh0IiwiaHR0cFN0YXR1cyIsImNvbnNvbGUiLCJfZGV2aWNlQ29tcGFyZSIsImEiLCJiIiwibGFzdFNlZW5EZWx0YSIsImxhc3Rfc2Vlbl90cyIsImlkQSIsImRldmljZV9pZCIsImlkQiIsImRldmljZSIsImRldmljZUlkIiwic2xpY2UiLCJpIiwiaW5kZXhPZiIsInB1c2giLCJzcGxpY2UiLCJfbWFrZURlbGV0ZVJlcXVlc3QiLCJjYXRjaCIsImRhdGEiLCJmbG93cyIsIkludGVyYWN0aXZlQXV0aERpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIm51bURldmljZXMiLCJsZW5ndGgiLCJkaWFsb2dBZXN0aGV0aWNzIiwiU1NPQXV0aEVudHJ5IiwiUEhBU0VfUFJFQVVUSCIsInRpdGxlIiwiYm9keSIsImNvdW50IiwiY29udGludWVUZXh0IiwiY29udGludWVLaW5kIiwiUEhBU0VfUE9TVEFVVEgiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJtYXRyaXhDbGllbnQiLCJhdXRoRGF0YSIsIm1ha2VSZXF1ZXN0IiwiYWVzdGhldGljc0ZvclN0YWdlUGhhc2VzIiwiTE9HSU5fVFlQRSIsIlVOU1RBQkxFX0xPR0lOX1RZUEUiLCJlIiwiZmluYWxseSIsImF1dGgiLCJkZWxldGVNdWx0aXBsZURldmljZXMiLCJmaWx0ZXIiLCJkIiwiaW5jbHVkZXMiLCJEZXZpY2VzUGFuZWxFbnRyeSIsInJlbmRlciIsIlNwaW5uZXIiLCJBY2Nlc3NpYmxlQnV0dG9uIiwiY2xhc3NlcyIsImNsYXNzTmFtZSIsInNvcnQiLCJkZWxldGVCdXR0b24iLCJtYXAiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJzdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXpCQTs7Ozs7Ozs7Ozs7Ozs7OztBQTJCZSxNQUFNQSxZQUFOLFNBQTJCQyxlQUFNQyxTQUFqQyxDQUEyQztBQUN0REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRUEsU0FBS0MsS0FBTCxHQUFhO0FBQ1RDLE1BQUFBLE9BQU8sRUFBRUMsU0FEQTtBQUVUQyxNQUFBQSxlQUFlLEVBQUVELFNBRlI7QUFJVEUsTUFBQUEsZUFBZSxFQUFFLEVBSlI7QUFLVEMsTUFBQUEsUUFBUSxFQUFFO0FBTEQsS0FBYjtBQVFBLFNBQUtDLFVBQUwsR0FBa0IsS0FBbEI7QUFFQSxTQUFLQyxhQUFMLEdBQXFCLEtBQUtBLGFBQUwsQ0FBbUJDLElBQW5CLENBQXdCLElBQXhCLENBQXJCO0FBQ0EsU0FBS0MseUJBQUwsR0FBaUMsS0FBS0EseUJBQUwsQ0FBK0JELElBQS9CLENBQW9DLElBQXBDLENBQWpDO0FBQ0EsU0FBS0UsY0FBTCxHQUFzQixLQUFLQSxjQUFMLENBQW9CRixJQUFwQixDQUF5QixJQUF6QixDQUF0QjtBQUNIOztBQUVERyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixTQUFLQyxZQUFMO0FBQ0g7O0FBRURDLEVBQUFBLG9CQUFvQixHQUFH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TUFBQSxPQUFPLEVBQUUsS0FBS0ssY0FBaEM7QUFBZ0QsTUFBQSxJQUFJLEVBQUM7QUFBckQsT0FDSyx5QkFBRywyQkFBSCxFQUFnQztBQUFDMkMsTUFBQUEsS0FBSyxFQUFFLEtBQUtyRCxLQUFMLENBQVdJLGVBQVgsQ0FBMkIyQztBQUFuQyxLQUFoQyxDQURMLENBRko7QUFNQSxVQUFNNkIsT0FBTyxHQUFHLHlCQUFXLEtBQUs3RSxLQUFMLENBQVc4RSxTQUF0QixFQUFpQyxpQkFBakMsQ0FBaEI7QUFDQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFFRDtBQUFoQixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQTRDLHlCQUFHLElBQUgsQ0FBNUMsQ0FESixlQUVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUE4Qyx5QkFBRyxhQUFILENBQTlDLENBRkosZUFHSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBa0QseUJBQUcsV0FBSCxDQUFsRCxDQUhKLGVBSUk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ00sS0FBSzVFLEtBQUwsQ0FBV0ksZUFBWCxDQUEyQjJDLE1BQTNCLEdBQW9DLENBQXBDLEdBQXdDZ0MsWUFBeEMsR0FBdUQsSUFEN0QsQ0FKSixDQURKLEVBU005RSxPQUFPLENBQUMrRSxHQUFSLENBQVksS0FBS3pFLGFBQWpCLENBVE4sQ0FESjtBQWFIOztBQTVNcUQ7OztBQStNMURaLFlBQVksQ0FBQ3NGLFNBQWIsR0FBeUI7QUFDckJKLEVBQUFBLFNBQVMsRUFBRUssbUJBQVVDO0FBREEsQ0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcblxuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7U1NPQXV0aEVudHJ5fSBmcm9tIFwiLi4vYXV0aC9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2aWNlc1BhbmVsIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGRldmljZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRldmljZUxvYWRFcnJvcjogdW5kZWZpbmVkLFxuXG4gICAgICAgICAgICBzZWxlY3RlZERldmljZXM6IFtdLFxuICAgICAgICAgICAgZGVsZXRpbmc6IGZhbHNlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX3JlbmRlckRldmljZSA9IHRoaXMuX3JlbmRlckRldmljZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbkRldmljZVNlbGVjdGlvblRvZ2dsZWQgPSB0aGlzLl9vbkRldmljZVNlbGVjdGlvblRvZ2dsZWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25EZWxldGVDbGljayA9IHRoaXMuX29uRGVsZXRlQ2xpY2suYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5fbG9hZERldmljZXMoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBfbG9hZERldmljZXMoKSB7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXREZXZpY2VzKCkudGhlbihcbiAgICAgICAgICAgIChyZXNwKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtkZXZpY2VzOiByZXNwLmRldmljZXMgfHwgW119KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIGxldCBlcnJ0eHQ7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLmh0dHBTdGF0dXMgPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIDQwNCBwcm9iYWJseSBtZWFucyB0aGUgSFMgZG9lc24ndCB5ZXQgc3VwcG9ydCB0aGUgQVBJLlxuICAgICAgICAgICAgICAgICAgICBlcnJ0eHQgPSBfdChcIllvdXIgaG9tZXNlcnZlciBkb2VzIG5vdCBzdXBwb3J0IHNlc3Npb24gbWFuYWdlbWVudC5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGxvYWRpbmcgc2Vzc2lvbnM6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgZXJydHh0ID0gX3QoXCJVbmFibGUgdG8gbG9hZCBzZXNzaW9uIGxpc3RcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2RldmljZUxvYWRFcnJvcjogZXJydHh0fSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogY29tcGFyZSB0d28gZGV2aWNlcywgc29ydGluZyBmcm9tIG1vc3QtcmVjZW50bHktc2VlbiB0byBsZWFzdC1yZWNlbnRseS1zZWVuXG4gICAgICogKGFuZCB0aGVuLCBmb3Igc3RhYmlsaXR5LCBieSBkZXZpY2UgaWQpXG4gICAgICovXG4gICAgX2RldmljZUNvbXBhcmUoYSwgYikge1xuICAgICAgICAvLyByZXR1cm4gPCAwIGlmIGEgY29tZXMgYmVmb3JlIGIsID4gMCBpZiBhIGNvbWVzIGFmdGVyIGIuXG4gICAgICAgIGNvbnN0IGxhc3RTZWVuRGVsdGEgPVxuICAgICAgICAgICAgICAoYi5sYXN0X3NlZW5fdHMgfHwgMCkgLSAoYS5sYXN0X3NlZW5fdHMgfHwgMCk7XG5cbiAgICAgICAgaWYgKGxhc3RTZWVuRGVsdGEgIT09IDApIHsgcmV0dXJuIGxhc3RTZWVuRGVsdGE7IH1cblxuICAgICAgICBjb25zdCBpZEEgPSBhLmRldmljZV9pZDtcbiAgICAgICAgY29uc3QgaWRCID0gYi5kZXZpY2VfaWQ7XG4gICAgICAgIHJldHVybiAoaWRBIDwgaWRCKSA/IC0xIDogKGlkQSA+IGlkQikgPyAxIDogMDtcbiAgICB9XG5cbiAgICBfb25EZXZpY2VTZWxlY3Rpb25Ub2dnbGVkKGRldmljZSkge1xuICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGNvbnN0IGRldmljZUlkID0gZGV2aWNlLmRldmljZV9pZDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICAvLyBNYWtlIGEgY29weSBvZiB0aGUgc2VsZWN0ZWQgZGV2aWNlcywgdGhlbiBhZGQgb3IgcmVtb3ZlIHRoZSBkZXZpY2VcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRGV2aWNlcyA9IHN0YXRlLnNlbGVjdGVkRGV2aWNlcy5zbGljZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBpID0gc2VsZWN0ZWREZXZpY2VzLmluZGV4T2YoZGV2aWNlSWQpO1xuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWREZXZpY2VzLnB1c2goZGV2aWNlSWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERldmljZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge3NlbGVjdGVkRGV2aWNlc307XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbkRlbGV0ZUNsaWNrKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGRlbGV0aW5nOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9tYWtlRGVsZXRlUmVxdWVzdChudWxsKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICBpZiAoZXJyb3IuaHR0cFN0YXR1cyAhPT0gNDAxIHx8ICFlcnJvci5kYXRhIHx8ICFlcnJvci5kYXRhLmZsb3dzKSB7XG4gICAgICAgICAgICAgICAgLy8gZG9lc24ndCBsb29rIGxpa2UgYW4gaW50ZXJhY3RpdmUtYXV0aCBmYWlsdXJlXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBvcCB1cCBhbiBpbnRlcmFjdGl2ZSBhdXRoIGRpYWxvZ1xuICAgICAgICAgICAgY29uc3QgSW50ZXJhY3RpdmVBdXRoRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuSW50ZXJhY3RpdmVBdXRoRGlhbG9nXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBudW1EZXZpY2VzID0gdGhpcy5zdGF0ZS5zZWxlY3RlZERldmljZXMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZGlhbG9nQWVzdGhldGljcyA9IHtcbiAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVzZSBTaW5nbGUgU2lnbiBPbiB0byBjb250aW51ZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogX3QoXCJDb25maXJtIGRlbGV0aW5nIHRoZXNlIHNlc3Npb25zIGJ5IHVzaW5nIFNpbmdsZSBTaWduIE9uIHRvIHByb3ZlIHlvdXIgaWRlbnRpdHkuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBudW1EZXZpY2VzLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIlNpbmdsZSBTaWduIE9uXCIpLFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZUtpbmQ6IFwicHJpbWFyeVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5QSEFTRV9QT1NUQVVUSF06IHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiQ29uZmlybSBkZWxldGluZyB0aGVzZSBzZXNzaW9uc1wiKSxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogX3QoXCJDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIGNvbmZpcm0gZGVsZXRpbmcgdGhlc2Ugc2Vzc2lvbnMuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBudW1EZXZpY2VzLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIkRlbGV0ZSBzZXNzaW9uc1wiLCB7Y291bnQ6IG51bURldmljZXN9KSxcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcImRhbmdlclwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRGVsZXRlIERldmljZSBEaWFsb2cnLCAnJywgSW50ZXJhY3RpdmVBdXRoRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiQXV0aGVudGljYXRpb25cIiksXG4gICAgICAgICAgICAgICAgbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnRQZWcuZ2V0KCksXG4gICAgICAgICAgICAgICAgYXV0aERhdGE6IGVycm9yLmRhdGEsXG4gICAgICAgICAgICAgICAgbWFrZVJlcXVlc3Q6IHRoaXMuX21ha2VEZWxldGVSZXF1ZXN0LmJpbmQodGhpcyksXG4gICAgICAgICAgICAgICAgYWVzdGhldGljc0ZvclN0YWdlUGhhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgIFtTU09BdXRoRW50cnkuTE9HSU5fVFlQRV06IGRpYWxvZ0Flc3RoZXRpY3MsXG4gICAgICAgICAgICAgICAgICAgIFtTU09BdXRoRW50cnkuVU5TVEFCTEVfTE9HSU5fVFlQRV06IGRpYWxvZ0Flc3RoZXRpY3MsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGRlbGV0aW5nIHNlc3Npb25zXCIsIGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCkgeyByZXR1cm47IH1cbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBkZWxldGluZzogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX21ha2VEZWxldGVSZXF1ZXN0KGF1dGgpIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5kZWxldGVNdWx0aXBsZURldmljZXModGhpcy5zdGF0ZS5zZWxlY3RlZERldmljZXMsIGF1dGgpLnRoZW4oXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBkZWxldGVkIGRldmljZXMgZnJvbSBgZGV2aWNlc2AsIHJlc2V0IHNlbGVjdGlvbiB0byBbXVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiB0aGlzLnN0YXRlLmRldmljZXMuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGQpID0+ICF0aGlzLnN0YXRlLnNlbGVjdGVkRGV2aWNlcy5pbmNsdWRlcyhkLmRldmljZV9pZCksXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgIH1cblxuICAgIF9yZW5kZXJEZXZpY2UoZGV2aWNlKSB7XG4gICAgICAgIGNvbnN0IERldmljZXNQYW5lbEVudHJ5ID0gc2RrLmdldENvbXBvbmVudCgnc2V0dGluZ3MuRGV2aWNlc1BhbmVsRW50cnknKTtcbiAgICAgICAgcmV0dXJuIDxEZXZpY2VzUGFuZWxFbnRyeVxuICAgICAgICAgICAga2V5PXtkZXZpY2UuZGV2aWNlX2lkfVxuICAgICAgICAgICAgZGV2aWNlPXtkZXZpY2V9XG4gICAgICAgICAgICBzZWxlY3RlZD17dGhpcy5zdGF0ZS5zZWxlY3RlZERldmljZXMuaW5jbHVkZXMoZGV2aWNlLmRldmljZV9pZCl9XG4gICAgICAgICAgICBvbkRldmljZVRvZ2dsZWQ9e3RoaXMuX29uRGV2aWNlU2VsZWN0aW9uVG9nZ2xlZH1cbiAgICAgICAgLz47XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZXZpY2VMb2FkRXJyb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIFwiZXJyb3JcIik7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLmRldmljZUxvYWRFcnJvciB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGV2aWNlcyA9IHRoaXMuc3RhdGUuZGV2aWNlcztcbiAgICAgICAgaWYgKGRldmljZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gc3RpbGwgbG9hZGluZ1xuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IHRoaXMucHJvcHMuY2xhc3NOYW1lO1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIGNsYXNzTmFtZT17Y2xhc3Nlc30gLz47XG4gICAgICAgIH1cblxuICAgICAgICBkZXZpY2VzLnNvcnQodGhpcy5fZGV2aWNlQ29tcGFyZSk7XG5cbiAgICAgICAgY29uc3QgZGVsZXRlQnV0dG9uID0gdGhpcy5zdGF0ZS5kZWxldGluZyA/XG4gICAgICAgICAgICA8U3Bpbm5lciB3PXsyMn0gaD17MjJ9IC8+IDpcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uRGVsZXRlQ2xpY2t9IGtpbmQ9XCJkYW5nZXJfc21cIj5cbiAgICAgICAgICAgICAgIHsgX3QoXCJEZWxldGUgJShjb3VudClzIHNlc3Npb25zXCIsIHtjb3VudDogdGhpcy5zdGF0ZS5zZWxlY3RlZERldmljZXMubGVuZ3RofSkgfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcblxuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyh0aGlzLnByb3BzLmNsYXNzTmFtZSwgXCJteF9EZXZpY2VzUGFuZWxcIik7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZpY2VzUGFuZWxfaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2aWNlc1BhbmVsX2RldmljZUlkXCI+eyBfdChcIklEXCIpIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZpY2VzUGFuZWxfZGV2aWNlTmFtZVwiPnsgX3QoXCJQdWJsaWMgTmFtZVwiKSB9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2aWNlc1BhbmVsX2RldmljZUxhc3RTZWVuXCI+eyBfdChcIkxhc3Qgc2VlblwiKSB9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2aWNlc1BhbmVsX2RldmljZUJ1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS5zZWxlY3RlZERldmljZXMubGVuZ3RoID4gMCA/IGRlbGV0ZUJ1dHRvbiA6IG51bGwgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IGRldmljZXMubWFwKHRoaXMuX3JlbmRlckRldmljZSkgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5EZXZpY2VzUGFuZWwucHJvcFR5cGVzID0ge1xuICAgIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbn07XG4iXX0=