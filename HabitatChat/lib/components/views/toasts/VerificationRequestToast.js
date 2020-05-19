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

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _RightPanelStorePhases = require("../../../stores/RightPanelStorePhases");

var _KeyVerificationStateObserver = require("../../../utils/KeyVerificationStateObserver");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _ToastStore = _interopRequireDefault(require("../../../stores/ToastStore"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

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
class VerificationRequestToast extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_checkRequestIsPending", () => {
      const {
        request
      } = this.props;

      if (!request.canAccept) {
        _ToastStore.default.sharedInstance().dismissToast(this.props.toastKey);
      }
    });
    (0, _defineProperty2.default)(this, "cancel", () => {
      _ToastStore.default.sharedInstance().dismissToast(this.props.toastKey);

      try {
        this.props.request.cancel();
      } catch (err) {
        console.error("Error while cancelling verification request", err);
      }
    });
    (0, _defineProperty2.default)(this, "accept", async () => {
      _ToastStore.default.sharedInstance().dismissToast(this.props.toastKey);

      const {
        request
      } = this.props; // no room id for to_device requests

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      try {
        if (request.channel.roomId) {
          _dispatcher.default.dispatch({
            action: 'view_room',
            room_id: request.channel.roomId,
            should_peek: false
          });

          _dispatcher.default.dispatch({
            action: "set_right_panel_phase",
            phase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel,
            refireParams: {
              verificationRequest: request,
              member: cli.getUser(request.otherUserId)
            }
          });
        } else {
          const VerificationRequestDialog = sdk.getComponent("views.dialogs.VerificationRequestDialog");

          _Modal.default.createTrackedDialog('Incoming Verification', '', VerificationRequestDialog, {
            verificationRequest: request
          }, null,
          /* priority = */
          false,
          /* static = */
          true);
        }

        await request.accept();
      } catch (err) {
        console.error(err.message);
      }
    });
    this.state = {
      counter: Math.ceil(props.request.timeout / 1000)
    };
  }

  async componentDidMount() {
    const {
      request
    } = this.props;

    if (request.timeout && request.timeout > 0) {
      this._intervalHandle = setInterval(() => {
        let {
          counter
        } = this.state;
        counter = Math.max(0, counter - 1);
        this.setState({
          counter
        });
      }, 1000);
    }

    request.on("change", this._checkRequestIsPending); // We should probably have a separate class managing the active verification toasts,
    // rather than monitoring this in the toast component itself, since we'll get problems
    // like the toasdt not going away when the verification is cancelled unless it's the
    // one on the top (ie. the one that's mounted).
    // As a quick & dirty fix, check the toast is still relevant when it mounts (this prevents
    // a toast hanging around after logging in if you did a verification as part of login).

    this._checkRequestIsPending();

    if (request.isSelfVerification) {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      this.setState({
        device: cli.getStoredDevice(cli.getUserId(), request.channel.deviceId)
      });
    }
  }

  componentWillUnmount() {
    clearInterval(this._intervalHandle);
    const {
      request
    } = this.props;
    request.off("change", this._checkRequestIsPending);
  }

  render() {
    const FormButton = sdk.getComponent("elements.FormButton");
    const {
      request
    } = this.props;
    let nameLabel;

    if (request.isSelfVerification) {
      if (this.state.device) {
        nameLabel = (0, _languageHandler._t)("From %(deviceName)s (%(deviceId)s)", {
          deviceName: this.state.device.getDisplayName(),
          deviceId: this.state.device.deviceId
        });
      }
    } else {
      const userId = request.otherUserId;
      const roomId = request.channel.roomId;
      nameLabel = roomId ? (0, _KeyVerificationStateObserver.userLabelForEventRoom)(userId, roomId) : userId; // for legacy to_device verification requests

      if (nameLabel === userId) {
        const client = _MatrixClientPeg.MatrixClientPeg.get();

        const user = client.getUser(userId);

        if (user && user.displayName) {
          nameLabel = (0, _languageHandler._t)("%(name)s (%(userId)s)", {
            name: user.displayName,
            userId
          });
        }
      }
    }

    const declineLabel = this.state.counter == 0 ? (0, _languageHandler._t)("Decline") : (0, _languageHandler._t)("Decline (%(counter)s)", {
      counter: this.state.counter
    });
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_description"
    }, nameLabel), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Toast_buttons",
      "aria-live": "off"
    }, /*#__PURE__*/_react.default.createElement(FormButton, {
      label: declineLabel,
      kind: "danger",
      onClick: this.cancel
    }), /*#__PURE__*/_react.default.createElement(FormButton, {
      label: (0, _languageHandler._t)("Accept"),
      onClick: this.accept
    })));
  }

}

exports.default = VerificationRequestToast;
VerificationRequestToast.propTypes = {
  request: _propTypes.default.object.isRequired,
  toastKey: _propTypes.default.string.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3RvYXN0cy9WZXJpZmljYXRpb25SZXF1ZXN0VG9hc3QuanMiXSwibmFtZXMiOlsiVmVyaWZpY2F0aW9uUmVxdWVzdFRvYXN0IiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInJlcXVlc3QiLCJjYW5BY2NlcHQiLCJUb2FzdFN0b3JlIiwic2hhcmVkSW5zdGFuY2UiLCJkaXNtaXNzVG9hc3QiLCJ0b2FzdEtleSIsImNhbmNlbCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImNsaSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImNoYW5uZWwiLCJyb29tSWQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInJvb21faWQiLCJzaG91bGRfcGVlayIsInBoYXNlIiwiUklHSFRfUEFORUxfUEhBU0VTIiwiRW5jcnlwdGlvblBhbmVsIiwicmVmaXJlUGFyYW1zIiwidmVyaWZpY2F0aW9uUmVxdWVzdCIsIm1lbWJlciIsImdldFVzZXIiLCJvdGhlclVzZXJJZCIsIlZlcmlmaWNhdGlvblJlcXVlc3REaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJhY2NlcHQiLCJtZXNzYWdlIiwic3RhdGUiLCJjb3VudGVyIiwiTWF0aCIsImNlaWwiLCJ0aW1lb3V0IiwiY29tcG9uZW50RGlkTW91bnQiLCJfaW50ZXJ2YWxIYW5kbGUiLCJzZXRJbnRlcnZhbCIsIm1heCIsInNldFN0YXRlIiwib24iLCJfY2hlY2tSZXF1ZXN0SXNQZW5kaW5nIiwiaXNTZWxmVmVyaWZpY2F0aW9uIiwiZGV2aWNlIiwiZ2V0U3RvcmVkRGV2aWNlIiwiZ2V0VXNlcklkIiwiZGV2aWNlSWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsZWFySW50ZXJ2YWwiLCJvZmYiLCJyZW5kZXIiLCJGb3JtQnV0dG9uIiwibmFtZUxhYmVsIiwiZGV2aWNlTmFtZSIsImdldERpc3BsYXlOYW1lIiwidXNlcklkIiwiY2xpZW50IiwidXNlciIsImRpc3BsYXlOYW1lIiwibmFtZSIsImRlY2xpbmVMYWJlbCIsInByb3BUeXBlcyIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJzdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBekJBOzs7Ozs7Ozs7Ozs7Ozs7QUEyQmUsTUFBTUEsd0JBQU4sU0FBdUNDLGVBQU1DLGFBQTdDLENBQTJEO0FBQ3RFQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSxrRUFtQ00sTUFBTTtBQUMzQixZQUFNO0FBQUNDLFFBQUFBO0FBQUQsVUFBWSxLQUFLRCxLQUF2Qjs7QUFDQSxVQUFJLENBQUNDLE9BQU8sQ0FBQ0MsU0FBYixFQUF3QjtBQUNwQkMsNEJBQVdDLGNBQVgsR0FBNEJDLFlBQTVCLENBQXlDLEtBQUtMLEtBQUwsQ0FBV00sUUFBcEQ7QUFDSDtBQUNKLEtBeENrQjtBQUFBLGtEQTBDVixNQUFNO0FBQ1hILDBCQUFXQyxjQUFYLEdBQTRCQyxZQUE1QixDQUF5QyxLQUFLTCxLQUFMLENBQVdNLFFBQXBEOztBQUNBLFVBQUk7QUFDQSxhQUFLTixLQUFMLENBQVdDLE9BQVgsQ0FBbUJNLE1BQW5CO0FBQ0gsT0FGRCxDQUVFLE9BQU9DLEdBQVAsRUFBWTtBQUNWQyxRQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyw2Q0FBZCxFQUE2REYsR0FBN0Q7QUFDSDtBQUNKLEtBakRrQjtBQUFBLGtEQW1EVixZQUFZO0FBQ2pCTCwwQkFBV0MsY0FBWCxHQUE0QkMsWUFBNUIsQ0FBeUMsS0FBS0wsS0FBTCxDQUFXTSxRQUFwRDs7QUFDQSxZQUFNO0FBQUNMLFFBQUFBO0FBQUQsVUFBWSxLQUFLRCxLQUF2QixDQUZpQixDQUdqQjs7QUFDQSxZQUFNVyxHQUFHLEdB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O0FBQXpCLFdBQTVCLENBQVo7QUFDSDtBQUNKO0FBQ0o7O0FBQ0QsVUFBTUssWUFBWSxHQUFHLEtBQUs5QixLQUFMLENBQVdDLE9BQVgsSUFBc0IsQ0FBdEIsR0FDakIseUJBQUcsU0FBSCxDQURpQixHQUVqQix5QkFBRyx1QkFBSCxFQUE0QjtBQUFDQSxNQUFBQSxPQUFPLEVBQUUsS0FBS0QsS0FBTCxDQUFXQztBQUFyQixLQUE1QixDQUZKO0FBR0Esd0JBQVEsdURBQ0o7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQXVDcUIsU0FBdkMsQ0FESSxlQUVKO0FBQUssTUFBQSxTQUFTLEVBQUMsa0JBQWY7QUFBa0MsbUJBQVU7QUFBNUMsb0JBQ0ksNkJBQUMsVUFBRDtBQUFZLE1BQUEsS0FBSyxFQUFFUSxZQUFuQjtBQUFpQyxNQUFBLElBQUksRUFBQyxRQUF0QztBQUErQyxNQUFBLE9BQU8sRUFBRSxLQUFLM0Q7QUFBN0QsTUFESixlQUVJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLEtBQUssRUFBRSx5QkFBRyxRQUFILENBQW5CO0FBQWlDLE1BQUEsT0FBTyxFQUFFLEtBQUsyQjtBQUEvQyxNQUZKLENBRkksQ0FBUjtBQU9IOztBQXRIcUU7OztBQXlIMUV0Qyx3QkFBd0IsQ0FBQ3VFLFNBQXpCLEdBQXFDO0FBQ2pDbEUsRUFBQUEsT0FBTyxFQUFFbUUsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRE87QUFFakNoRSxFQUFBQSxRQUFRLEVBQUU4RCxtQkFBVUcsTUFBVixDQUFpQkQ7QUFGTSxDQUFyQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbmh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCB7UklHSFRfUEFORUxfUEhBU0VTfSBmcm9tIFwiLi4vLi4vLi4vc3RvcmVzL1JpZ2h0UGFuZWxTdG9yZVBoYXNlc1wiO1xuaW1wb3J0IHt1c2VyTGFiZWxGb3JFdmVudFJvb219IGZyb20gXCIuLi8uLi8uLi91dGlscy9LZXlWZXJpZmljYXRpb25TdGF0ZU9ic2VydmVyXCI7XG5pbXBvcnQgZGlzIGZyb20gXCIuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXJcIjtcbmltcG9ydCBUb2FzdFN0b3JlIGZyb20gXCIuLi8uLi8uLi9zdG9yZXMvVG9hc3RTdG9yZVwiO1xuaW1wb3J0IE1vZGFsIGZyb20gXCIuLi8uLi8uLi9Nb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJpZmljYXRpb25SZXF1ZXN0VG9hc3QgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7Y291bnRlcjogTWF0aC5jZWlsKHByb3BzLnJlcXVlc3QudGltZW91dCAvIDEwMDApfTtcbiAgICB9XG5cbiAgICBhc3luYyBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgY29uc3Qge3JlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgaWYgKHJlcXVlc3QudGltZW91dCAmJiByZXF1ZXN0LnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnRlcnZhbEhhbmRsZSA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQge2NvdW50ZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgICAgICBjb3VudGVyID0gTWF0aC5tYXgoMCwgY291bnRlciAtIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvdW50ZXJ9KTtcbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3Qub24oXCJjaGFuZ2VcIiwgdGhpcy5fY2hlY2tSZXF1ZXN0SXNQZW5kaW5nKTtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIHByb2JhYmx5IGhhdmUgYSBzZXBhcmF0ZSBjbGFzcyBtYW5hZ2luZyB0aGUgYWN0aXZlIHZlcmlmaWNhdGlvbiB0b2FzdHMsXG4gICAgICAgIC8vIHJhdGhlciB0aGFuIG1vbml0b3JpbmcgdGhpcyBpbiB0aGUgdG9hc3QgY29tcG9uZW50IGl0c2VsZiwgc2luY2Ugd2UnbGwgZ2V0IHByb2JsZW1zXG4gICAgICAgIC8vIGxpa2UgdGhlIHRvYXNkdCBub3QgZ29pbmcgYXdheSB3aGVuIHRoZSB2ZXJpZmljYXRpb24gaXMgY2FuY2VsbGVkIHVubGVzcyBpdCdzIHRoZVxuICAgICAgICAvLyBvbmUgb24gdGhlIHRvcCAoaWUuIHRoZSBvbmUgdGhhdCdzIG1vdW50ZWQpLlxuICAgICAgICAvLyBBcyBhIHF1aWNrICYgZGlydHkgZml4LCBjaGVjayB0aGUgdG9hc3QgaXMgc3RpbGwgcmVsZXZhbnQgd2hlbiBpdCBtb3VudHMgKHRoaXMgcHJldmVudHNcbiAgICAgICAgLy8gYSB0b2FzdCBoYW5naW5nIGFyb3VuZCBhZnRlciBsb2dnaW5nIGluIGlmIHlvdSBkaWQgYSB2ZXJpZmljYXRpb24gYXMgcGFydCBvZiBsb2dpbikuXG4gICAgICAgIHRoaXMuX2NoZWNrUmVxdWVzdElzUGVuZGluZygpO1xuXG4gICAgICAgIGlmIChyZXF1ZXN0LmlzU2VsZlZlcmlmaWNhdGlvbikge1xuICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZGV2aWNlOiBjbGkuZ2V0U3RvcmVkRGV2aWNlKGNsaS5nZXRVc2VySWQoKSwgcmVxdWVzdC5jaGFubmVsLmRldmljZUlkKX0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5faW50ZXJ2YWxIYW5kbGUpO1xuICAgICAgICBjb25zdCB7cmVxdWVzdH0gPSB0aGlzLnByb3BzO1xuICAgICAgICByZXF1ZXN0Lm9mZihcImNoYW5nZVwiLCB0aGlzLl9jaGVja1JlcXVlc3RJc1BlbmRpbmcpO1xuICAgIH1cblxuICAgIF9jaGVja1JlcXVlc3RJc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHtyZXF1ZXN0fSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGlmICghcmVxdWVzdC5jYW5BY2NlcHQpIHtcbiAgICAgICAgICAgIFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5kaXNtaXNzVG9hc3QodGhpcy5wcm9wcy50b2FzdEtleSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICBUb2FzdFN0b3JlLnNoYXJlZEluc3RhbmNlKCkuZGlzbWlzc1RvYXN0KHRoaXMucHJvcHMudG9hc3RLZXkpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5yZXF1ZXN0LmNhbmNlbCgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB3aGlsZSBjYW5jZWxsaW5nIHZlcmlmaWNhdGlvbiByZXF1ZXN0XCIsIGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhY2NlcHQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIFRvYXN0U3RvcmUuc2hhcmVkSW5zdGFuY2UoKS5kaXNtaXNzVG9hc3QodGhpcy5wcm9wcy50b2FzdEtleSk7XG4gICAgICAgIGNvbnN0IHtyZXF1ZXN0fSA9IHRoaXMucHJvcHM7XG4gICAgICAgIC8vIG5vIHJvb20gaWQgZm9yIHRvX2RldmljZSByZXF1ZXN0c1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAocmVxdWVzdC5jaGFubmVsLnJvb21JZCkge1xuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IHJlcXVlc3QuY2hhbm5lbC5yb29tSWQsXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZF9wZWVrOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwic2V0X3JpZ2h0X3BhbmVsX3BoYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiBSSUdIVF9QQU5FTF9QSEFTRVMuRW5jcnlwdGlvblBhbmVsLFxuICAgICAgICAgICAgICAgICAgICByZWZpcmVQYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvblJlcXVlc3Q6IHJlcXVlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1iZXI6IGNsaS5nZXRVc2VyKHJlcXVlc3Qub3RoZXJVc2VySWQpLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBWZXJpZmljYXRpb25SZXF1ZXN0RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmRpYWxvZ3MuVmVyaWZpY2F0aW9uUmVxdWVzdERpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdJbmNvbWluZyBWZXJpZmljYXRpb24nLCAnJywgVmVyaWZpY2F0aW9uUmVxdWVzdERpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25SZXF1ZXN0OiByZXF1ZXN0LFxuICAgICAgICAgICAgICAgIH0sIG51bGwsIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgcmVxdWVzdC5hY2NlcHQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEZvcm1CdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuRm9ybUJ1dHRvblwiKTtcbiAgICAgICAgY29uc3Qge3JlcXVlc3R9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgbGV0IG5hbWVMYWJlbDtcbiAgICAgICAgaWYgKHJlcXVlc3QuaXNTZWxmVmVyaWZpY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBuYW1lTGFiZWwgPSBfdChcIkZyb20gJShkZXZpY2VOYW1lKXMgKCUoZGV2aWNlSWQpcylcIiwge1xuICAgICAgICAgICAgICAgICAgICBkZXZpY2VOYW1lOiB0aGlzLnN0YXRlLmRldmljZS5nZXREaXNwbGF5TmFtZSgpLFxuICAgICAgICAgICAgICAgICAgICBkZXZpY2VJZDogdGhpcy5zdGF0ZS5kZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSByZXF1ZXN0Lm90aGVyVXNlcklkO1xuICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gcmVxdWVzdC5jaGFubmVsLnJvb21JZDtcbiAgICAgICAgICAgIG5hbWVMYWJlbCA9IHJvb21JZCA/IHVzZXJMYWJlbEZvckV2ZW50Um9vbSh1c2VySWQsIHJvb21JZCkgOiB1c2VySWQ7XG4gICAgICAgICAgICAvLyBmb3IgbGVnYWN5IHRvX2RldmljZSB2ZXJpZmljYXRpb24gcmVxdWVzdHNcbiAgICAgICAgICAgIGlmIChuYW1lTGFiZWwgPT09IHVzZXJJZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VyID0gY2xpZW50LmdldFVzZXIodXNlcklkKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlciAmJiB1c2VyLmRpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbCA9IF90KFwiJShuYW1lKXMgKCUodXNlcklkKXMpXCIsIHtuYW1lOiB1c2VyLmRpc3BsYXlOYW1lLCB1c2VySWR9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVjbGluZUxhYmVsID0gdGhpcy5zdGF0ZS5jb3VudGVyID09IDAgP1xuICAgICAgICAgICAgX3QoXCJEZWNsaW5lXCIpIDpcbiAgICAgICAgICAgIF90KFwiRGVjbGluZSAoJShjb3VudGVyKXMpXCIsIHtjb3VudGVyOiB0aGlzLnN0YXRlLmNvdW50ZXJ9KTtcbiAgICAgICAgcmV0dXJuICg8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Ub2FzdF9kZXNjcmlwdGlvblwiPntuYW1lTGFiZWx9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1RvYXN0X2J1dHRvbnNcIiBhcmlhLWxpdmU9XCJvZmZcIj5cbiAgICAgICAgICAgICAgICA8Rm9ybUJ1dHRvbiBsYWJlbD17ZGVjbGluZUxhYmVsfSBraW5kPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5jYW5jZWx9IC8+XG4gICAgICAgICAgICAgICAgPEZvcm1CdXR0b24gbGFiZWw9e190KFwiQWNjZXB0XCIpfSBvbkNsaWNrPXt0aGlzLmFjY2VwdH0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cbn1cblxuVmVyaWZpY2F0aW9uUmVxdWVzdFRvYXN0LnByb3BUeXBlcyA9IHtcbiAgICByZXF1ZXN0OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgdG9hc3RLZXk6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbn07XG4iXX0=