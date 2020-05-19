"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _KeyVerificationStateObserver = require("../../../utils/KeyVerificationStateObserver");

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
class MKeyVerificationConclusion extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onRequestChanged", () => {
      this.forceUpdate();
    });
    (0, _defineProperty2.default)(this, "_onTrustChanged", (userId, status) => {
      const {
        mxEvent
      } = this.props;
      const request = mxEvent.verificationRequest;

      if (!request || request.otherUserId !== userId) {
        return;
      }

      this.forceUpdate();
    });
  }

  componentDidMount() {
    const request = this.props.mxEvent.verificationRequest;

    if (request) {
      request.on("change", this._onRequestChanged);
    }

    _MatrixClientPeg.MatrixClientPeg.get().on("userTrustStatusChanged", this._onTrustChanged);
  }

  componentWillUnmount() {
    const request = this.props.mxEvent.verificationRequest;

    if (request) {
      request.off("change", this._onRequestChanged);
    }

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli) {
      cli.removeListener("userTrustStatusChanged", this._onTrustChanged);
    }
  }

  _shouldRender(mxEvent, request) {
    // normally should not happen
    if (!request) {
      return false;
    } // .cancel event that was sent after the verification finished, ignore


    if (mxEvent.getType() === "m.key.verification.cancel" && !request.cancelled) {
      return false;
    } // .done event that was sent after the verification cancelled, ignore


    if (mxEvent.getType() === "m.key.verification.done" && !request.done) {
      return false;
    } // request hasn't concluded yet


    if (request.pending) {
      return false;
    } // User isn't actually verified


    if (!_MatrixClientPeg.MatrixClientPeg.get().checkUserTrust(request.otherUserId).isCrossSigningVerified()) {
      return false;
    }

    return true;
  }

  render() {
    const {
      mxEvent
    } = this.props;
    const request = mxEvent.verificationRequest;

    if (!this._shouldRender(mxEvent, request)) {
      return null;
    }

    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const myUserId = client.getUserId();
    let title;

    if (request.done) {
      title = (0, _languageHandler._t)("You verified %(name)s", {
        name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(request.otherUserId, mxEvent)
      });
    } else if (request.cancelled) {
      const userId = request.cancellingUserId;

      if (userId === myUserId) {
        title = (0, _languageHandler._t)("You cancelled verifying %(name)s", {
          name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(request.otherUserId, mxEvent)
        });
      } else {
        title = (0, _languageHandler._t)("%(name)s cancelled verifying", {
          name: (0, _KeyVerificationStateObserver.getNameForEventRoom)(userId, mxEvent)
        });
      }
    }

    if (title) {
      const subtitle = (0, _KeyVerificationStateObserver.userLabelForEventRoom)(request.otherUserId, mxEvent.getRoomId());
      const classes = (0, _classnames.default)("mx_EventTile_bubble", "mx_cryptoEvent", "mx_cryptoEvent_icon", {
        mx_cryptoEvent_icon_verified: request.done
      });
      return /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_title"
      }, title), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_subtitle"
      }, subtitle));
    }

    return null;
  }

}

exports.default = MKeyVerificationConclusion;
MKeyVerificationConclusion.propTypes = {
  /* the MatrixEvent to show */
  mxEvent: _propTypes.default.object.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01LZXlWZXJpZmljYXRpb25Db25jbHVzaW9uLmpzIl0sIm5hbWVzIjpbIk1LZXlWZXJpZmljYXRpb25Db25jbHVzaW9uIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiZm9yY2VVcGRhdGUiLCJ1c2VySWQiLCJzdGF0dXMiLCJteEV2ZW50IiwicmVxdWVzdCIsInZlcmlmaWNhdGlvblJlcXVlc3QiLCJvdGhlclVzZXJJZCIsImNvbXBvbmVudERpZE1vdW50Iiwib24iLCJfb25SZXF1ZXN0Q2hhbmdlZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIl9vblRydXN0Q2hhbmdlZCIsImNvbXBvbmVudFdpbGxVbm1vdW50Iiwib2ZmIiwiY2xpIiwicmVtb3ZlTGlzdGVuZXIiLCJfc2hvdWxkUmVuZGVyIiwiZ2V0VHlwZSIsImNhbmNlbGxlZCIsImRvbmUiLCJwZW5kaW5nIiwiY2hlY2tVc2VyVHJ1c3QiLCJpc0Nyb3NzU2lnbmluZ1ZlcmlmaWVkIiwicmVuZGVyIiwiY2xpZW50IiwibXlVc2VySWQiLCJnZXRVc2VySWQiLCJ0aXRsZSIsIm5hbWUiLCJjYW5jZWxsaW5nVXNlcklkIiwic3VidGl0bGUiLCJnZXRSb29tSWQiLCJjbGFzc2VzIiwibXhfY3J5cHRvRXZlbnRfaWNvbl92ZXJpZmllZCIsInByb3BUeXBlcyIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JlLE1BQU1BLDBCQUFOLFNBQXlDQyxlQUFNQyxTQUEvQyxDQUF5RDtBQUNwRUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsNkRBdUJDLE1BQU07QUFDdEIsV0FBS0MsV0FBTDtBQUNILEtBekJrQjtBQUFBLDJEQTJCRCxDQUFDQyxNQUFELEVBQVNDLE1BQVQsS0FBb0I7QUFDbEMsWUFBTTtBQUFFQyxRQUFBQTtBQUFGLFVBQWMsS0FBS0osS0FBekI7QUFDQSxZQUFNSyxPQUFPLEdBQUdELE9BQU8sQ0FBQ0UsbUJBQXhCOztBQUNBLFVBQUksQ0FBQ0QsT0FBRCxJQUFZQSxPQUFPLENBQUNFLFdBQVIsS0FBd0JMLE1BQXhDLEVBQWdEO0FBQzVDO0FBQ0g7O0FBQ0QsV0FBS0QsV0FBTDtBQUNILEtBbENrQjtBQUVsQjs7QUFFRE8sRUFBQUEsaUJBQWlCLEdBQUc7QUFDaEIsVUFBTUgsT0FBTyxHQUFHLEtBQUtMLEtBQUwsQ0FBV0ksT0FBWCxDQUFtQkUsbUJBQW5DOztBQUNBLFFBQUlELE9BQUosRUFBYTtBQUNUQSxNQUFBQSxPQUFPLENBQUNJLEVBQVIsQ0FBVyxRQUFYLEVBQXFCLEtBQUtDLGlCQUExQjtBQUNIOztBQUNEQyxxQ0FBZ0JDLEdBQWhCLEdBQXNCSCxFQUF0QixDQUF5Qix3QkFBekIsRUFBbUQsS0FBS0ksZUFBeEQ7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsVUFBTVQsT0FBTyxHQUFHLEtBQUtMLEtBQUwsQ0FBV0ksT0FBWCxDQUFtQkUsbUJBQW5DOztBQUNBLFFBQUlELE9BQUosRUFBYTtBQUNUQSxNQUFBQSxPQUFPLENBQUNVLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQUtMLGlCQUEzQjtBQUNIOztBQUNELFVBQU1NLEdBQUcsR0FBR0wsaUNBQWdCQyxHQUFoQixFQUFaOztBQUNBLFFBQUlJLEdBQUosRUFBUztBQUNMQSxNQUFBQSxHQUFHLENBQUNDLGNBQUosQ0FBbUIsd0JBQW5CLEVBQTZDLEtBQUtKLGVBQWxEO0FBQ0g7QUFDSjs7QUFlREssRUFBQUEsYUFBYSxDQUFDZCxPQUFELEVBQVVDLE9BQVYsRUFBbUI7QUFDNUI7QUFDQSxRQUFJLENBQUNBLE9BQUwsRUFBYztBQUNWLGFBQU8sS0FBUDtBQUNILEtBSjJCLENBSzVCOzs7QUFDQSxRQUFJRCxPQUFPLENBQUNlLE9BQVIsT0FBc0IsMkJBQXRCLElBQXFELENBQUNkLE9BQU8sQ0FBQ2UsU0FBbEUsRUFBNkU7QUFDekUsYUFBTyxLQUFQO0FBQ0gsS0FSMkIsQ0FTNUI7OztBQUNBLFFBQUloQixPQUFPLENBQUNlLE9BQVIsT0FBc0IseUJBQXRCLElBQW1ELENBQUNkLE9BQU8sQ0FBQ2dCLElBQWhFLEVBQXNFO0FBQ2xFLGFBQU8sS0FBUDtBQUNILEtBWjJCLENBYzVCOzs7QUFDQSxRQUFJaEIsT0FBTyxDQUFDaUIsT0FBWixFQUFxQjtBQUNqQixhQUFPLEtBQVA7QUFDSCxLQWpCMkIsQ0FtQjVCOzs7QUFDQSxRQUFJLENBQUNYLGlDQUFnQkMsR0FBaEIsR0FDZ0JXLGNBRGhCLENBQytCbEIsT0FBTyxDQUFDRSxXQUR2QyxFQUVnQmlCLHNCQUZoQixFQUFMLEVBRStDO0FBQzNDLGFBQU8sS0FBUDtBQUNIOztBQUVELFdBQU8sSUFBUDtBQUNIOztBQUVEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNO0FBQUNyQixNQUFBQTtBQUFELFFBQVksS0FBS0osS0FBdkI7QUFDQSxVQUFNSyxPQUFPLEdBQUdELE9BQU8sQ0FBQ0UsbUJBQXhCOztBQUVBLFFBQUksQ0FBQyxLQUFLWSxhQUFMLENBQW1CZCxPQUFuQixFQUE0QkMsT0FBNUIsQ0FBTCxFQUEyQztBQUN2QyxhQUFPLElBQVA7QUFDSDs7QUFFRCxVQUFNcUIsTUFBTSxHQUFHZixpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsVUFBTWUsUUFBUSxHQUFHRCxNQUFNLENBQUNFLFNBQVAsRUFBakI7QUFFQSxRQUFJQyxLQUFKOztBQUVBLFFBQUl4QixPQUFPLENBQUNnQixJQUFaLEVBQWtCO0FBQ2RRLE1BQUFBLEtBQUssR0FBRyx5QkFBRyx1QkFBSCxFQUE0QjtBQUFDQyxRQUFBQSxJQUFJLEVBQUUsdURBQW9CekIsT0FBTyxDQUFDRSxXQUE1QixFQUF5Q0gsT0FBekM7QUFBUCxPQUE1QixDQUFSO0FBQ0gsS0FGRCxNQUVPLElBQUlDLE9BQU8sQ0FBQ2UsU0FBWixFQUF1QjtBQUMxQixZQUFNbEIsTUFBTSxHQUFHRyxPQUFPLENBQUMwQixnQkFBdkI7O0FBQ0EsVUFBSTdCLE1BQU0sS0FBS3lCLFFBQWYsRUFBeUI7QUFDckJFLFFBQUFBLEtBQUssR0FBRyx5QkFBRyxrQ0FBSCxFQUNKO0FBQUNDLFVBQUFBLElBQUksRUFBRSx1REFBb0J6QixPQUFPLENBQUNFLFdBQTVCLEVBQXlDSCxPQUF6QztBQUFQLFNBREksQ0FBUjtBQUVILE9BSEQsTUFHTztBQUNIeUIsUUFBQUEsS0FBSyxHQUFHLHlCQUFHLDhCQUFILEVBQ0o7QUFBQ0MsVUFBQUEsSUFBSSxFQUFFLHVEQUFvQjVCLE1BQXBCLEVBQTRCRSxPQUE1QjtBQUFQLFNBREksQ0FBUjtBQUVIO0FBQ0o7O0FBRUQsUUFBSXlCLEtBQUosRUFBVztBQUNQLFlBQU1HLFFBQVEsR0FBRyx5REFBc0IzQixPQUFPLENBQUNFLFdBQTlCLEVBQTJDSCxPQUFPLENBQUM2QixTQUFSLEVBQTNDLENBQWpCO0FBQ0EsWUFBTUMsT0FBTyxHQUFHLHlCQUFXLHFCQUFYLEVBQWtDLGdCQUFsQyxFQUFvRCxxQkFBcEQsRUFBMkU7QUFDdkZDLFFBQUFBLDRCQUE0QixFQUFFOUIsT0FBTyxDQUFDZ0I7QUFEaUQsT0FBM0UsQ0FBaEI7QUFHQSwwQkFBUTtBQUFLLFFBQUEsU0FBUyxFQUFFYTtBQUFoQixzQkFDSjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FBdUNMLEtBQXZDLENBREksZUFFSjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FBMENHLFFBQTFDLENBRkksQ0FBUjtBQUlIOztBQUVELFdBQU8sSUFBUDtBQUNIOztBQXhHbUU7OztBQTJHeEVwQywwQkFBMEIsQ0FBQ3dDLFNBQTNCLEdBQXVDO0FBQ25DO0FBQ0FoQyxFQUFBQSxPQUFPLEVBQUVpQyxtQkFBVUMsTUFBVixDQUFpQkM7QUFGUyxDQUF2QyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSwgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7Z2V0TmFtZUZvckV2ZW50Um9vbSwgdXNlckxhYmVsRm9yRXZlbnRSb29tfVxuICAgIGZyb20gJy4uLy4uLy4uL3V0aWxzL0tleVZlcmlmaWNhdGlvblN0YXRlT2JzZXJ2ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5wcm9wcy5teEV2ZW50LnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGlmIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uKFwiY2hhbmdlXCIsIHRoaXMuX29uUmVxdWVzdENoYW5nZWQpO1xuICAgICAgICB9XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5vbihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgdGhpcy5fb25UcnVzdENoYW5nZWQpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5wcm9wcy5teEV2ZW50LnZlcmlmaWNhdGlvblJlcXVlc3Q7XG4gICAgICAgIGlmIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXF1ZXN0Lm9mZihcImNoYW5nZVwiLCB0aGlzLl9vblJlcXVlc3RDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGkpIHtcbiAgICAgICAgICAgIGNsaS5yZW1vdmVMaXN0ZW5lcihcInVzZXJUcnVzdFN0YXR1c0NoYW5nZWRcIiwgdGhpcy5fb25UcnVzdENoYW5nZWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uUmVxdWVzdENoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9O1xuXG4gICAgX29uVHJ1c3RDaGFuZ2VkID0gKHVzZXJJZCwgc3RhdHVzKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbXhFdmVudCB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IG14RXZlbnQudmVyaWZpY2F0aW9uUmVxdWVzdDtcbiAgICAgICAgaWYgKCFyZXF1ZXN0IHx8IHJlcXVlc3Qub3RoZXJVc2VySWQgIT09IHVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9O1xuXG4gICAgX3Nob3VsZFJlbmRlcihteEV2ZW50LCByZXF1ZXN0KSB7XG4gICAgICAgIC8vIG5vcm1hbGx5IHNob3VsZCBub3QgaGFwcGVuXG4gICAgICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIC5jYW5jZWwgZXZlbnQgdGhhdCB3YXMgc2VudCBhZnRlciB0aGUgdmVyaWZpY2F0aW9uIGZpbmlzaGVkLCBpZ25vcmVcbiAgICAgICAgaWYgKG14RXZlbnQuZ2V0VHlwZSgpID09PSBcIm0ua2V5LnZlcmlmaWNhdGlvbi5jYW5jZWxcIiAmJiAhcmVxdWVzdC5jYW5jZWxsZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyAuZG9uZSBldmVudCB0aGF0IHdhcyBzZW50IGFmdGVyIHRoZSB2ZXJpZmljYXRpb24gY2FuY2VsbGVkLCBpZ25vcmVcbiAgICAgICAgaWYgKG14RXZlbnQuZ2V0VHlwZSgpID09PSBcIm0ua2V5LnZlcmlmaWNhdGlvbi5kb25lXCIgJiYgIXJlcXVlc3QuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVxdWVzdCBoYXNuJ3QgY29uY2x1ZGVkIHlldFxuICAgICAgICBpZiAocmVxdWVzdC5wZW5kaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VyIGlzbid0IGFjdHVhbGx5IHZlcmlmaWVkXG4gICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNoZWNrVXNlclRydXN0KHJlcXVlc3Qub3RoZXJVc2VySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmlzQ3Jvc3NTaWduaW5nVmVyaWZpZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7bXhFdmVudH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gbXhFdmVudC52ZXJpZmljYXRpb25SZXF1ZXN0O1xuXG4gICAgICAgIGlmICghdGhpcy5fc2hvdWxkUmVuZGVyKG14RXZlbnQsIHJlcXVlc3QpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgbXlVc2VySWQgPSBjbGllbnQuZ2V0VXNlcklkKCk7XG5cbiAgICAgICAgbGV0IHRpdGxlO1xuXG4gICAgICAgIGlmIChyZXF1ZXN0LmRvbmUpIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJZb3UgdmVyaWZpZWQgJShuYW1lKXNcIiwge25hbWU6IGdldE5hbWVGb3JFdmVudFJvb20ocmVxdWVzdC5vdGhlclVzZXJJZCwgbXhFdmVudCl9KTtcbiAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0LmNhbmNlbGxlZCkge1xuICAgICAgICAgICAgY29uc3QgdXNlcklkID0gcmVxdWVzdC5jYW5jZWxsaW5nVXNlcklkO1xuICAgICAgICAgICAgaWYgKHVzZXJJZCA9PT0gbXlVc2VySWQpIHtcbiAgICAgICAgICAgICAgICB0aXRsZSA9IF90KFwiWW91IGNhbmNlbGxlZCB2ZXJpZnlpbmcgJShuYW1lKXNcIixcbiAgICAgICAgICAgICAgICAgICAge25hbWU6IGdldE5hbWVGb3JFdmVudFJvb20ocmVxdWVzdC5vdGhlclVzZXJJZCwgbXhFdmVudCl9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGl0bGUgPSBfdChcIiUobmFtZSlzIGNhbmNlbGxlZCB2ZXJpZnlpbmdcIixcbiAgICAgICAgICAgICAgICAgICAge25hbWU6IGdldE5hbWVGb3JFdmVudFJvb20odXNlcklkLCBteEV2ZW50KX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgICAgICBjb25zdCBzdWJ0aXRsZSA9IHVzZXJMYWJlbEZvckV2ZW50Um9vbShyZXF1ZXN0Lm90aGVyVXNlcklkLCBteEV2ZW50LmdldFJvb21JZCgpKTtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzKFwibXhfRXZlbnRUaWxlX2J1YmJsZVwiLCBcIm14X2NyeXB0b0V2ZW50XCIsIFwibXhfY3J5cHRvRXZlbnRfaWNvblwiLCB7XG4gICAgICAgICAgICAgICAgbXhfY3J5cHRvRXZlbnRfaWNvbl92ZXJpZmllZDogcmVxdWVzdC5kb25lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X2NyeXB0b0V2ZW50X3RpdGxlXCI+e3RpdGxlfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfY3J5cHRvRXZlbnRfc3VidGl0bGVcIj57c3VidGl0bGV9PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5NS2V5VmVyaWZpY2F0aW9uQ29uY2x1c2lvbi5wcm9wVHlwZXMgPSB7XG4gICAgLyogdGhlIE1hdHJpeEV2ZW50IHRvIHNob3cgKi9cbiAgICBteEV2ZW50OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG59O1xuIl19