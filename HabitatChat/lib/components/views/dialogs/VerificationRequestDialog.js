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

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
class VerificationRequestDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    this.onFinished = this.onFinished.bind(this);
    this.state = {};

    if (this.props.verificationRequest) {
      this.state.verificationRequest = this.props.verificationRequest;
    } else if (this.props.verificationRequestPromise) {
      this.props.verificationRequestPromise.then(r => {
        this.setState({
          verificationRequest: r
        });
      });
    }
  }

  render() {
    const BaseDialog = sdk.getComponent("views.dialogs.BaseDialog");
    const EncryptionPanel = sdk.getComponent("views.right_panel.EncryptionPanel");
    const request = this.state.verificationRequest;
    const otherUserId = request && request.otherUserId;

    const member = this.props.member || otherUserId && _MatrixClientPeg.MatrixClientPeg.get().getUser(otherUserId);

    const title = request && request.isSelfVerification ? (0, _languageHandler._t)("Verify other session") : (0, _languageHandler._t)("Verification Request");
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_InfoDialog",
      onFinished: this.onFinished,
      contentId: "mx_Dialog_content",
      title: title,
      hasCancel: true
    }, /*#__PURE__*/_react.default.createElement(EncryptionPanel, {
      layout: "dialog",
      verificationRequest: this.props.verificationRequest,
      verificationRequestPromise: this.props.verificationRequestPromise,
      onClose: this.props.onFinished,
      member: member
    }));
  }

  async onFinished() {
    this.props.onFinished();
    let request = this.props.verificationRequest;

    if (!request && this.props.verificationRequestPromise) {
      request = await this.props.verificationRequestPromise;
    }

    request.cancel();
  }

}

exports.default = VerificationRequestDialog;
(0, _defineProperty2.default)(VerificationRequestDialog, "propTypes", {
  verificationRequest: _propTypes.default.object,
  verificationRequestPromise: _propTypes.default.object,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVmVyaWZpY2F0aW9uUmVxdWVzdERpYWxvZy5qcyJdLCJuYW1lcyI6WyJWZXJpZmljYXRpb25SZXF1ZXN0RGlhbG9nIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJvbkZpbmlzaGVkIiwiYmluZCIsInN0YXRlIiwicHJvcHMiLCJ2ZXJpZmljYXRpb25SZXF1ZXN0IiwidmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2UiLCJ0aGVuIiwiciIsInNldFN0YXRlIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIkVuY3J5cHRpb25QYW5lbCIsInJlcXVlc3QiLCJvdGhlclVzZXJJZCIsIm1lbWJlciIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFVzZXIiLCJ0aXRsZSIsImlzU2VsZlZlcmlmaWNhdGlvbiIsImNhbmNlbCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O0FBc0JlLE1BQU1BLHlCQUFOLFNBQXdDQyxlQUFNQyxTQUE5QyxDQUF3RDtBQU9uRUMsRUFBQUEsV0FBVyxDQUFDLEdBQUdDLElBQUosRUFBVTtBQUNqQixVQUFNLEdBQUdBLElBQVQ7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLEtBQUtBLFVBQUwsQ0FBZ0JDLElBQWhCLENBQXFCLElBQXJCLENBQWxCO0FBQ0EsU0FBS0MsS0FBTCxHQUFhLEVBQWI7O0FBQ0EsUUFBSSxLQUFLQyxLQUFMLENBQVdDLG1CQUFmLEVBQW9DO0FBQ2hDLFdBQUtGLEtBQUwsQ0FBV0UsbUJBQVgsR0FBaUMsS0FBS0QsS0FBTCxDQUFXQyxtQkFBNUM7QUFDSCxLQUZELE1BRU8sSUFBSSxLQUFLRCxLQUFMLENBQVdFLDBCQUFmLEVBQTJDO0FBQzlDLFdBQUtGLEtBQUwsQ0FBV0UsMEJBQVgsQ0FBc0NDLElBQXRDLENBQTJDQyxDQUFDLElBQUk7QUFDNUMsYUFBS0MsUUFBTCxDQUFjO0FBQUNKLFVBQUFBLG1CQUFtQixFQUFFRztBQUF0QixTQUFkO0FBQ0gsT0FGRDtBQUdIO0FBQ0o7O0FBRURFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLFVBQVUsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLDBCQUFqQixDQUFuQjtBQUNBLFVBQU1DLGVBQWUsR0FBR0YsR0FBRyxDQUFDQyxZQUFKLENBQWlCLG1DQUFqQixDQUF4QjtBQUNBLFVBQU1FLE9BQU8sR0FBRyxLQUFLWixLQUFMLENBQVdFLG1CQUEzQjtBQUNBLFVBQU1XLFdBQVcsR0FBR0QsT0FBTyxJQUFJQSxPQUFPLENBQUNDLFdBQXZDOztBQUNBLFVBQU1DLE1BQU0sR0FBRyxLQUFLYixLQUFMLENBQVdhLE1BQVgsSUFDWEQsV0FBVyxJQUFJRSxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxPQUF0QixDQUE4QkosV0FBOUIsQ0FEbkI7O0FBRUEsVUFBTUssS0FBSyxHQUFHTixPQUFPLElBQUlBLE9BQU8sQ0FBQ08sa0JBQW5CLEdBQ1YseUJBQUcsc0JBQUgsQ0FEVSxHQUNtQix5QkFBRyxzQkFBSCxDQURqQztBQUdBLHdCQUFPLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLFNBQVMsRUFBQyxlQUF0QjtBQUFzQyxNQUFBLFVBQVUsRUFBRSxLQUFLckIsVUFBdkQ7QUFDQyxNQUFBLFNBQVMsRUFBQyxtQkFEWDtBQUVDLE1BQUEsS0FBSyxFQUFFb0IsS0FGUjtBQUdDLE1BQUEsU0FBUyxFQUFFO0FBSFosb0JBS0gsNkJBQUMsZUFBRDtBQUNJLE1BQUEsTUFBTSxFQUFDLFFBRFg7QUFFSSxNQUFBLG1CQUFtQixFQUFFLEtBQUtqQixLQUFMLENBQVdDLG1CQUZwQztBQUdJLE1BQUEsMEJBQTBCLEVBQUUsS0FBS0QsS0FBTCxDQUFXRSwwQkFIM0M7QUFJSSxNQUFBLE9BQU8sRUFBRSxLQUFLRixLQUFMLENBQVdILFVBSnhCO0FBS0ksTUFBQSxNQUFNLEVBQUVnQjtBQUxaLE1BTEcsQ0FBUDtBQWFIOztBQUVELFFBQU1oQixVQUFOLEdBQW1CO0FBQ2YsU0FBS0csS0FBTCxDQUFXSCxVQUFYO0FBQ0EsUUFBSWMsT0FBTyxHQUFHLEtBQUtYLEtBQUwsQ0FBV0MsbUJBQXpCOztBQUNBLFFBQUksQ0FBQ1UsT0FBRCxJQUFZLEtBQUtYLEtBQUwsQ0FBV0UsMEJBQTNCLEVBQXVEO0FBQ25EUyxNQUFBQSxPQUFPLEdBQUcsTUFBTSxLQUFLWCxLQUFMLENBQVdFLDBCQUEzQjtBQUNIOztBQUNEUyxJQUFBQSxPQUFPLENBQUNRLE1BQVI7QUFDSDs7QUFwRGtFOzs7OEJBQWxEM0IseUIsZUFDRTtBQUNmUyxFQUFBQSxtQkFBbUIsRUFBRW1CLG1CQUFVQyxNQURoQjtBQUVmbkIsRUFBQUEsMEJBQTBCLEVBQUVrQixtQkFBVUMsTUFGdkI7QUFHZnhCLEVBQUFBLFVBQVUsRUFBRXVCLG1CQUFVRSxJQUFWLENBQWVDO0FBSFosQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJpZmljYXRpb25SZXF1ZXN0RGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICB2ZXJpZmljYXRpb25SZXF1ZXN0OiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICB2ZXJpZmljYXRpb25SZXF1ZXN0UHJvbWlzZTogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5vbkZpbmlzaGVkID0gdGhpcy5vbkZpbmlzaGVkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMudmVyaWZpY2F0aW9uUmVxdWVzdCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS52ZXJpZmljYXRpb25SZXF1ZXN0ID0gdGhpcy5wcm9wcy52ZXJpZmljYXRpb25SZXF1ZXN0O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMudmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMudmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2UudGhlbihyID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHt2ZXJpZmljYXRpb25SZXF1ZXN0OiByfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IEVuY3J5cHRpb25QYW5lbCA9IHNkay5nZXRDb21wb25lbnQoXCJ2aWV3cy5yaWdodF9wYW5lbC5FbmNyeXB0aW9uUGFuZWxcIik7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLnN0YXRlLnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGNvbnN0IG90aGVyVXNlcklkID0gcmVxdWVzdCAmJiByZXF1ZXN0Lm90aGVyVXNlcklkO1xuICAgICAgICBjb25zdCBtZW1iZXIgPSB0aGlzLnByb3BzLm1lbWJlciB8fFxuICAgICAgICAgICAgb3RoZXJVc2VySWQgJiYgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVzZXIob3RoZXJVc2VySWQpO1xuICAgICAgICBjb25zdCB0aXRsZSA9IHJlcXVlc3QgJiYgcmVxdWVzdC5pc1NlbGZWZXJpZmljYXRpb24gP1xuICAgICAgICAgICAgX3QoXCJWZXJpZnkgb3RoZXIgc2Vzc2lvblwiKSA6IF90KFwiVmVyaWZpY2F0aW9uIFJlcXVlc3RcIik7XG5cbiAgICAgICAgcmV0dXJuIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0luZm9EaWFsb2dcIiBvbkZpbmlzaGVkPXt0aGlzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgY29udGVudElkPVwibXhfRGlhbG9nX2NvbnRlbnRcIlxuICAgICAgICAgICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICA8RW5jcnlwdGlvblBhbmVsXG4gICAgICAgICAgICAgICAgbGF5b3V0PVwiZGlhbG9nXCJcbiAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25SZXF1ZXN0PXt0aGlzLnByb3BzLnZlcmlmaWNhdGlvblJlcXVlc3R9XG4gICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2U9e3RoaXMucHJvcHMudmVyaWZpY2F0aW9uUmVxdWVzdFByb21pc2V9XG4gICAgICAgICAgICAgICAgb25DbG9zZT17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIG1lbWJlcj17bWVtYmVyfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgPC9CYXNlRGlhbG9nPjtcbiAgICB9XG5cbiAgICBhc3luYyBvbkZpbmlzaGVkKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgbGV0IHJlcXVlc3QgPSB0aGlzLnByb3BzLnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGlmICghcmVxdWVzdCAmJiB0aGlzLnByb3BzLnZlcmlmaWNhdGlvblJlcXVlc3RQcm9taXNlKSB7XG4gICAgICAgICAgICByZXF1ZXN0ID0gYXdhaXQgdGhpcy5wcm9wcy52ZXJpZmljYXRpb25SZXF1ZXN0UHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0LmNhbmNlbCgpO1xuICAgIH1cbn1cbiJdfQ==