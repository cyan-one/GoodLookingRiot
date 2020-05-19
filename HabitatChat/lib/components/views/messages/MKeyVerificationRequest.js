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

var _KeyVerificationStateObserver = require("../../../utils/KeyVerificationStateObserver");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _RightPanelStorePhases = require("../../../stores/RightPanelStorePhases");

/*
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
class MKeyVerificationRequest extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_openRequest", () => {
      const {
        verificationRequest
      } = this.props.mxEvent;

      const member = _MatrixClientPeg.MatrixClientPeg.get().getUser(verificationRequest.otherUserId);

      _dispatcher.default.dispatch({
        action: "set_right_panel_phase",
        phase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel,
        refireParams: {
          verificationRequest,
          member
        }
      });
    });
    (0, _defineProperty2.default)(this, "_onRequestChanged", () => {
      this.forceUpdate();
    });
    (0, _defineProperty2.default)(this, "_onAcceptClicked", async () => {
      const request = this.props.mxEvent.verificationRequest;

      if (request) {
        try {
          this._openRequest();

          await request.accept();
        } catch (err) {
          console.error(err.message);
        }
      }
    });
    (0, _defineProperty2.default)(this, "_onRejectClicked", async () => {
      const request = this.props.mxEvent.verificationRequest;

      if (request) {
        try {
          await request.cancel();
        } catch (err) {
          console.error(err.message);
        }
      }
    });
    this.state = {};
  }

  componentDidMount() {
    const request = this.props.mxEvent.verificationRequest;

    if (request) {
      request.on("change", this._onRequestChanged);
    }
  }

  componentWillUnmount() {
    const request = this.props.mxEvent.verificationRequest;

    if (request) {
      request.off("change", this._onRequestChanged);
    }
  }

  _acceptedLabel(userId) {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const myUserId = client.getUserId();

    if (userId === myUserId) {
      return (0, _languageHandler._t)("You accepted");
    } else {
      return (0, _languageHandler._t)("%(name)s accepted", {
        name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(userId, this.props.mxEvent.getRoomId())
      });
    }
  }

  _cancelledLabel(userId) {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const myUserId = client.getUserId();
    const {
      cancellationCode
    } = this.props.mxEvent.verificationRequest;
    const declined = cancellationCode === "m.user";

    if (userId === myUserId) {
      if (declined) {
        return (0, _languageHandler._t)("You declined");
      } else {
        return (0, _languageHandler._t)("You cancelled");
      }
    } else {
      if (declined) {
        return (0, _languageHandler._t)("%(name)s declined", {
          name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(userId, this.props.mxEvent.getRoomId())
        });
      } else {
        return (0, _languageHandler._t)("%(name)s cancelled", {
          name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(userId, this.props.mxEvent.getRoomId())
        });
      }
    }
  }

  render() {
    const AccessibleButton = sdk.getComponent("elements.AccessibleButton");
    const FormButton = sdk.getComponent("elements.FormButton");
    const {
      mxEvent
    } = this.props;
    const request = mxEvent.verificationRequest;

    if (!request || request.invalid) {
      return null;
    }

    let title;
    let subtitle;
    let stateNode;

    if (!request.canAccept) {
      let stateLabel;
      const accepted = request.ready || request.started || request.done;

      if (accepted) {
        stateLabel = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          onClick: this._openRequest
        }, this._acceptedLabel(request.receivingUserId));
      } else if (request.cancelled) {
        stateLabel = this._cancelledLabel(request.cancellingUserId);
      } else if (request.accepting) {
        stateLabel = (0, _languageHandler._t)("Accepting …");
      } else if (request.declining) {
        stateLabel = (0, _languageHandler._t)("Declining …");
      }

      stateNode = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_state"
      }, stateLabel);
    }

    if (!request.initiatedByMe) {
      const name = (0, _KeyVerificationStateObserver.getNameForEventRoom)(request.requestingUserId, mxEvent.getRoomId());
      title = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_title"
      }, (0, _languageHandler._t)("%(name)s wants to verify", {
        name
      }));
      subtitle = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_subtitle"
      }, (0, _KeyVerificationStateObserver.userLabelForEventRoom)(request.requestingUserId, mxEvent.getRoomId()));

      if (request.canAccept) {
        stateNode = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_cryptoEvent_buttons"
        }, /*#__PURE__*/_react.default.createElement(FormButton, {
          kind: "danger",
          onClick: this._onRejectClicked,
          label: (0, _languageHandler._t)("Decline")
        }), /*#__PURE__*/_react.default.createElement(FormButton, {
          onClick: this._onAcceptClicked,
          label: (0, _languageHandler._t)("Accept")
        }));
      }
    } else {
      // request sent by us
      title = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_title"
      }, (0, _languageHandler._t)("You sent a verification request"));
      subtitle = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_subtitle"
      }, (0, _KeyVerificationStateObserver.userLabelForEventRoom)(request.receivingUserId, mxEvent.getRoomId()));
    }

    if (title) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EventTile_bubble mx_cryptoEvent mx_cryptoEvent_icon"
      }, title, subtitle, stateNode);
    }

    return null;
  }

}

exports.default = MKeyVerificationRequest;
MKeyVerificationRequest.propTypes = {
  /* the MatrixEvent to show */
  mxEvent: _propTypes.default.object.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01LZXlWZXJpZmljYXRpb25SZXF1ZXN0LmpzIl0sIm5hbWVzIjpbIk1LZXlWZXJpZmljYXRpb25SZXF1ZXN0IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwidmVyaWZpY2F0aW9uUmVxdWVzdCIsIm14RXZlbnQiLCJtZW1iZXIiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRVc2VyIiwib3RoZXJVc2VySWQiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInBoYXNlIiwiUklHSFRfUEFORUxfUEhBU0VTIiwiRW5jcnlwdGlvblBhbmVsIiwicmVmaXJlUGFyYW1zIiwiZm9yY2VVcGRhdGUiLCJyZXF1ZXN0IiwiX29wZW5SZXF1ZXN0IiwiYWNjZXB0IiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNhbmNlbCIsInN0YXRlIiwiY29tcG9uZW50RGlkTW91bnQiLCJvbiIsIl9vblJlcXVlc3RDaGFuZ2VkIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJvZmYiLCJfYWNjZXB0ZWRMYWJlbCIsInVzZXJJZCIsImNsaWVudCIsIm15VXNlcklkIiwiZ2V0VXNlcklkIiwibmFtZSIsImdldFJvb21JZCIsIl9jYW5jZWxsZWRMYWJlbCIsImNhbmNlbGxhdGlvbkNvZGUiLCJkZWNsaW5lZCIsInJlbmRlciIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJGb3JtQnV0dG9uIiwiaW52YWxpZCIsInRpdGxlIiwic3VidGl0bGUiLCJzdGF0ZU5vZGUiLCJjYW5BY2NlcHQiLCJzdGF0ZUxhYmVsIiwiYWNjZXB0ZWQiLCJyZWFkeSIsInN0YXJ0ZWQiLCJkb25lIiwicmVjZWl2aW5nVXNlcklkIiwiY2FuY2VsbGVkIiwiY2FuY2VsbGluZ1VzZXJJZCIsImFjY2VwdGluZyIsImRlY2xpbmluZyIsImluaXRpYXRlZEJ5TWUiLCJyZXF1ZXN0aW5nVXNlcklkIiwiX29uUmVqZWN0Q2xpY2tlZCIsIl9vbkFjY2VwdENsaWNrZWQiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBMEJlLE1BQU1BLHVCQUFOLFNBQXNDQyxlQUFNQyxTQUE1QyxDQUFzRDtBQUNqRUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsd0RBbUJKLE1BQU07QUFDakIsWUFBTTtBQUFDQyxRQUFBQTtBQUFELFVBQXdCLEtBQUtELEtBQUwsQ0FBV0UsT0FBekM7O0FBQ0EsWUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxPQUF0QixDQUE4QkwsbUJBQW1CLENBQUNNLFdBQWxELENBQWY7O0FBQ0FDLDBCQUFJQyxRQUFKLENBQWE7QUFDVEMsUUFBQUEsTUFBTSxFQUFFLHVCQURDO0FBRVRDLFFBQUFBLEtBQUssRUFBRUMsMENBQW1CQyxlQUZqQjtBQUdUQyxRQUFBQSxZQUFZLEVBQUU7QUFBQ2IsVUFBQUEsbUJBQUQ7QUFBc0JFLFVBQUFBO0FBQXRCO0FBSEwsT0FBYjtBQUtILEtBM0JrQjtBQUFBLDZEQTZCQyxNQUFNO0FBQ3RCLFdBQUtZLFdBQUw7QUFDSCxLQS9Ca0I7QUFBQSw0REFpQ0EsWUFBWTtBQUMzQixZQUFNQyxPQUFPLEdBQUcsS0FBS2hCLEtBQUwsQ0FBV0UsT0FBWCxDQUFtQkQsbUJBQW5DOztBQUNBLFVBQUllLE9BQUosRUFBYTtBQUNULFlBQUk7QUFDQSxlQUFLQyxZQUFMOztBQUNBLGdCQUFNRCxPQUFPLENBQUNFLE1BQVIsRUFBTjtBQUNILFNBSEQsQ0FHRSxPQUFPQyxHQUFQLEVBQVk7QUFDVkMsVUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLEdBQUcsQ0FBQ0csT0FB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QUM7QUFBZixTQUNIQSxLQURHLEVBRUhDLFFBRkcsRUFHSEMsU0FIRyxDQUFSO0FBS0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7O0FBbEpnRTs7O0FBcUpyRXBELHVCQUF1QixDQUFDb0UsU0FBeEIsR0FBb0M7QUFDaEM7QUFDQTlELEVBQUFBLE9BQU8sRUFBRStELG1CQUFVQyxNQUFWLENBQWlCQztBQUZNLENBQXBDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5LCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge2dldE5hbWVGb3JFdmVudFJvb20sIHVzZXJMYWJlbEZvckV2ZW50Um9vbX1cbiAgICBmcm9tICcuLi8uLi8uLi91dGlscy9LZXlWZXJpZmljYXRpb25TdGF0ZU9ic2VydmVyJztcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0IHtSSUdIVF9QQU5FTF9QSEFTRVN9IGZyb20gXCIuLi8uLi8uLi9zdG9yZXMvUmlnaHRQYW5lbFN0b3JlUGhhc2VzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1LZXlWZXJpZmljYXRpb25SZXF1ZXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucHJvcHMubXhFdmVudC52ZXJpZmljYXRpb25SZXF1ZXN0O1xuICAgICAgICBpZiAocmVxdWVzdCkge1xuICAgICAgICAgICAgcmVxdWVzdC5vbihcImNoYW5nZVwiLCB0aGlzLl9vblJlcXVlc3RDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5wcm9wcy5teEV2ZW50LnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGlmIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXF1ZXN0Lm9mZihcImNoYW5nZVwiLCB0aGlzLl9vblJlcXVlc3RDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vcGVuUmVxdWVzdCA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qge3ZlcmlmaWNhdGlvblJlcXVlc3R9ID0gdGhpcy5wcm9wcy5teEV2ZW50O1xuICAgICAgICBjb25zdCBtZW1iZXIgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcih2ZXJpZmljYXRpb25SZXF1ZXN0Lm90aGVyVXNlcklkKTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJzZXRfcmlnaHRfcGFuZWxfcGhhc2VcIixcbiAgICAgICAgICAgIHBoYXNlOiBSSUdIVF9QQU5FTF9QSEFTRVMuRW5jcnlwdGlvblBhbmVsLFxuICAgICAgICAgICAgcmVmaXJlUGFyYW1zOiB7dmVyaWZpY2F0aW9uUmVxdWVzdCwgbWVtYmVyfSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9vblJlcXVlc3RDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfTtcblxuICAgIF9vbkFjY2VwdENsaWNrZWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLnByb3BzLm14RXZlbnQudmVyaWZpY2F0aW9uUmVxdWVzdDtcbiAgICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb3BlblJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXF1ZXN0LmFjY2VwdCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX29uUmVqZWN0Q2xpY2tlZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucHJvcHMubXhFdmVudC52ZXJpZmljYXRpb25SZXF1ZXN0O1xuICAgICAgICBpZiAocmVxdWVzdCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXF1ZXN0LmNhbmNlbCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgX2FjY2VwdGVkTGFiZWwodXNlcklkKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSBjbGllbnQuZ2V0VXNlcklkKCk7XG4gICAgICAgIGlmICh1c2VySWQgPT09IG15VXNlcklkKSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCJZb3UgYWNjZXB0ZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3QoXCIlKG5hbWUpcyBhY2NlcHRlZFwiLCB7bmFtZTogZ2V0TmFtZUZvckV2ZW50Um9vbSh1c2VySWQsIHRoaXMucHJvcHMubXhFdmVudC5nZXRSb29tSWQoKSl9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9jYW5jZWxsZWRMYWJlbCh1c2VySWQpIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBteVVzZXJJZCA9IGNsaWVudC5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3Qge2NhbmNlbGxhdGlvbkNvZGV9ID0gdGhpcy5wcm9wcy5teEV2ZW50LnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGNvbnN0IGRlY2xpbmVkID0gY2FuY2VsbGF0aW9uQ29kZSA9PT0gXCJtLnVzZXJcIjtcbiAgICAgICAgaWYgKHVzZXJJZCA9PT0gbXlVc2VySWQpIHtcbiAgICAgICAgICAgIGlmIChkZWNsaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdChcIllvdSBkZWNsaW5lZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KFwiWW91IGNhbmNlbGxlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkZWNsaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdChcIiUobmFtZSlzIGRlY2xpbmVkXCIsIHtuYW1lOiBnZXROYW1lRm9yRXZlbnRSb29tKHVzZXJJZCwgdGhpcy5wcm9wcy5teEV2ZW50LmdldFJvb21JZCgpKX0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoXCIlKG5hbWUpcyBjYW5jZWxsZWRcIiwge25hbWU6IGdldE5hbWVGb3JFdmVudFJvb20odXNlcklkLCB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Um9vbUlkKCkpfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvblwiKTtcbiAgICAgICAgY29uc3QgRm9ybUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5Gb3JtQnV0dG9uXCIpO1xuXG4gICAgICAgIGNvbnN0IHtteEV2ZW50fSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBteEV2ZW50LnZlcmlmaWNhdGlvblJlcXVlc3Q7XG5cbiAgICAgICAgaWYgKCFyZXF1ZXN0IHx8IHJlcXVlc3QuaW52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGl0bGU7XG4gICAgICAgIGxldCBzdWJ0aXRsZTtcbiAgICAgICAgbGV0IHN0YXRlTm9kZTtcblxuICAgICAgICBpZiAoIXJlcXVlc3QuY2FuQWNjZXB0KSB7XG4gICAgICAgICAgICBsZXQgc3RhdGVMYWJlbDtcbiAgICAgICAgICAgIGNvbnN0IGFjY2VwdGVkID0gcmVxdWVzdC5yZWFkeSB8fCByZXF1ZXN0LnN0YXJ0ZWQgfHwgcmVxdWVzdC5kb25lO1xuICAgICAgICAgICAgaWYgKGFjY2VwdGVkKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVMYWJlbCA9ICg8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vcGVuUmVxdWVzdH0+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLl9hY2NlcHRlZExhYmVsKHJlcXVlc3QucmVjZWl2aW5nVXNlcklkKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5jYW5jZWxsZWQpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZUxhYmVsID0gdGhpcy5fY2FuY2VsbGVkTGFiZWwocmVxdWVzdC5jYW5jZWxsaW5nVXNlcklkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5hY2NlcHRpbmcpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZUxhYmVsID0gX3QoXCJBY2NlcHRpbmcg4oCmXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0LmRlY2xpbmluZykge1xuICAgICAgICAgICAgICAgIHN0YXRlTGFiZWwgPSBfdChcIkRlY2xpbmluZyDigKZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZU5vZGUgPSAoPGRpdiBjbGFzc05hbWU9XCJteF9jcnlwdG9FdmVudF9zdGF0ZVwiPntzdGF0ZUxhYmVsfTwvZGl2Pik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlcXVlc3QuaW5pdGlhdGVkQnlNZSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGdldE5hbWVGb3JFdmVudFJvb20ocmVxdWVzdC5yZXF1ZXN0aW5nVXNlcklkLCBteEV2ZW50LmdldFJvb21JZCgpKTtcbiAgICAgICAgICAgIHRpdGxlID0gKDxkaXYgY2xhc3NOYW1lPVwibXhfY3J5cHRvRXZlbnRfdGl0bGVcIj57XG4gICAgICAgICAgICAgICAgX3QoXCIlKG5hbWUpcyB3YW50cyB0byB2ZXJpZnlcIiwge25hbWV9KX08L2Rpdj4pO1xuICAgICAgICAgICAgc3VidGl0bGUgPSAoPGRpdiBjbGFzc05hbWU9XCJteF9jcnlwdG9FdmVudF9zdWJ0aXRsZVwiPntcbiAgICAgICAgICAgICAgICB1c2VyTGFiZWxGb3JFdmVudFJvb20ocmVxdWVzdC5yZXF1ZXN0aW5nVXNlcklkLCBteEV2ZW50LmdldFJvb21JZCgpKX08L2Rpdj4pO1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QuY2FuQWNjZXB0KSB7XG4gICAgICAgICAgICAgICAgc3RhdGVOb2RlID0gKDxkaXYgY2xhc3NOYW1lPVwibXhfY3J5cHRvRXZlbnRfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8Rm9ybUJ1dHRvbiBraW5kPVwiZGFuZ2VyXCIgb25DbGljaz17dGhpcy5fb25SZWplY3RDbGlja2VkfSBsYWJlbD17X3QoXCJEZWNsaW5lXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICA8Rm9ybUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkFjY2VwdENsaWNrZWR9IGxhYmVsPXtfdChcIkFjY2VwdFwiKX0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyByZXF1ZXN0IHNlbnQgYnkgdXNcbiAgICAgICAgICAgIHRpdGxlID0gKDxkaXYgY2xhc3NOYW1lPVwibXhfY3J5cHRvRXZlbnRfdGl0bGVcIj57XG4gICAgICAgICAgICAgICAgX3QoXCJZb3Ugc2VudCBhIHZlcmlmaWNhdGlvbiByZXF1ZXN0XCIpfTwvZGl2Pik7XG4gICAgICAgICAgICBzdWJ0aXRsZSA9ICg8ZGl2IGNsYXNzTmFtZT1cIm14X2NyeXB0b0V2ZW50X3N1YnRpdGxlXCI+e1xuICAgICAgICAgICAgICAgIHVzZXJMYWJlbEZvckV2ZW50Um9vbShyZXF1ZXN0LnJlY2VpdmluZ1VzZXJJZCwgbXhFdmVudC5nZXRSb29tSWQoKSl9PC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT1cIm14X0V2ZW50VGlsZV9idWJibGUgbXhfY3J5cHRvRXZlbnQgbXhfY3J5cHRvRXZlbnRfaWNvblwiPlxuICAgICAgICAgICAgICAgIHt0aXRsZX1cbiAgICAgICAgICAgICAgICB7c3VidGl0bGV9XG4gICAgICAgICAgICAgICAge3N0YXRlTm9kZX1cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5NS2V5VmVyaWZpY2F0aW9uUmVxdWVzdC5wcm9wVHlwZXMgPSB7XG4gICAgLyogdGhlIE1hdHJpeEV2ZW50IHRvIHNob3cgKi9cbiAgICBteEV2ZW50OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG59O1xuIl19