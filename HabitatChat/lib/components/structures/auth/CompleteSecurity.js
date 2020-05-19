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

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _SetupEncryptionStore = require("../../../stores/SetupEncryptionStore");

var _SetupEncryptionBody = _interopRequireDefault(require("./SetupEncryptionBody"));

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
class CompleteSecurity extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onStoreUpdate", () => {
      const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

      this.setState({
        phase: store.phase
      });
    });

    const _store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

    _store.on("update", this._onStoreUpdate);

    _store.start();

    this.state = {
      phase: _store.phase
    };
  }

  componentWillUnmount() {
    const store = _SetupEncryptionStore.SetupEncryptionStore.sharedInstance();

    store.off("update", this._onStoreUpdate);
    store.stop();
  }

  render() {
    const AuthPage = sdk.getComponent("auth.AuthPage");
    const CompleteSecurityBody = sdk.getComponent("auth.CompleteSecurityBody");
    const {
      phase
    } = this.state;
    let icon;
    let title;

    if (phase === _SetupEncryptionStore.PHASE_INTRO) {
      icon = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_CompleteSecurity_headerIcon mx_E2EIcon_warning"
      });
      title = (0, _languageHandler._t)("Verify this login");
    } else if (phase === _SetupEncryptionStore.PHASE_DONE) {
      icon = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_CompleteSecurity_headerIcon mx_E2EIcon_verified"
      });
      title = (0, _languageHandler._t)("Session verified");
    } else if (phase === _SetupEncryptionStore.PHASE_CONFIRM_SKIP) {
      icon = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_CompleteSecurity_headerIcon mx_E2EIcon_warning"
      });
      title = (0, _languageHandler._t)("Are you sure?");
    } else if (phase === _SetupEncryptionStore.PHASE_BUSY) {
      icon = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_CompleteSecurity_headerIcon mx_E2EIcon_warning"
      });
      title = (0, _languageHandler._t)("Verify this login");
    } else {
      throw new Error("Unknown phase ".concat(phase));
    }

    return /*#__PURE__*/_react.default.createElement(AuthPage, null, /*#__PURE__*/_react.default.createElement(CompleteSecurityBody, null, /*#__PURE__*/_react.default.createElement("h2", {
      className: "mx_CompleteSecurity_header"
    }, icon, title), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CompleteSecurity_body"
    }, /*#__PURE__*/_react.default.createElement(_SetupEncryptionBody.default, {
      onFinished: this.props.onFinished
    }))));
  }

}

exports.default = CompleteSecurity;
(0, _defineProperty2.default)(CompleteSecurity, "propTypes", {
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvYXV0aC9Db21wbGV0ZVNlY3VyaXR5LmpzIl0sIm5hbWVzIjpbIkNvbXBsZXRlU2VjdXJpdHkiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwic3RvcmUiLCJTZXR1cEVuY3J5cHRpb25TdG9yZSIsInNoYXJlZEluc3RhbmNlIiwic2V0U3RhdGUiLCJwaGFzZSIsIm9uIiwiX29uU3RvcmVVcGRhdGUiLCJzdGFydCIsInN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJvZmYiLCJzdG9wIiwicmVuZGVyIiwiQXV0aFBhZ2UiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJDb21wbGV0ZVNlY3VyaXR5Qm9keSIsImljb24iLCJ0aXRsZSIsIlBIQVNFX0lOVFJPIiwiUEhBU0VfRE9ORSIsIlBIQVNFX0NPTkZJUk1fU0tJUCIsIlBIQVNFX0JVU1kiLCJFcnJvciIsInByb3BzIiwib25GaW5pc2hlZCIsIlByb3BUeXBlcyIsImZ1bmMiLCJpc1JlcXVpcmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQU9BOztBQTNCQTs7Ozs7Ozs7Ozs7Ozs7O0FBNkJlLE1BQU1BLGdCQUFOLFNBQStCQyxlQUFNQyxTQUFyQyxDQUErQztBQUsxREMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSwwREFRRyxNQUFNO0FBQ25CLFlBQU1DLEtBQUssR0FBR0MsMkNBQXFCQyxjQUFyQixFQUFkOztBQUNBLFdBQUtDLFFBQUwsQ0FBYztBQUFDQyxRQUFBQSxLQUFLLEVBQUVKLEtBQUssQ0FBQ0k7QUFBZCxPQUFkO0FBQ0gsS0FYYTs7QUFFVixVQUFNSixNQUFLLEdBQUdDLDJDQUFxQkMsY0FBckIsRUFBZDs7QUFDQUYsSUFBQUEsTUFBSyxDQUFDSyxFQUFOLENBQVMsUUFBVCxFQUFtQixLQUFLQyxjQUF4Qjs7QUFDQU4sSUFBQUEsTUFBSyxDQUFDTyxLQUFOOztBQUNBLFNBQUtDLEtBQUwsR0FBYTtBQUFDSixNQUFBQSxLQUFLLEVBQUVKLE1BQUssQ0FBQ0k7QUFBZCxLQUFiO0FBQ0g7O0FBT0RLLEVBQUFBLG9CQUFvQixHQUFHO0FBQ25CLFVBQU1ULEtBQUssR0FBR0MsMkNBQXFCQyxjQUFyQixFQUFkOztBQUNBRixJQUFBQSxLQUFLLENBQUNVLEdBQU4sQ0FBVSxRQUFWLEVBQW9CLEtBQUtKLGNBQXpCO0FBQ0FOLElBQUFBLEtBQUssQ0FBQ1csSUFBTjtBQUNIOztBQUVEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNQyxRQUFRLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixlQUFqQixDQUFqQjtBQUNBLFVBQU1DLG9CQUFvQixHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQTdCO0FBQ0EsVUFBTTtBQUFDWCxNQUFBQTtBQUFELFFBQVUsS0FBS0ksS0FBckI7QUFDQSxRQUFJUyxJQUFKO0FBQ0EsUUFBSUMsS0FBSjs7QUFFQSxRQUFJZCxLQUFLLEtBQUtlLGlDQUFkLEVBQTJCO0FBQ3ZCRixNQUFBQSxJQUFJLGdCQUFHO0FBQU0sUUFBQSxTQUFTLEVBQUM7QUFBaEIsUUFBUDtBQUNBQyxNQUFBQSxLQUFLLEdBQUcseUJBQUcsbUJBQUgsQ0FBUjtBQUNILEtBSEQsTUFHTyxJQUFJZCxLQUFLLEtBQUtnQixnQ0FBZCxFQUEwQjtBQUM3QkgsTUFBQUEsSUFBSSxnQkFBRztBQUFNLFFBQUEsU0FBUyxFQUFDO0FBQWhCLFFBQVA7QUFDQUMsTUFBQUEsS0FBSyxHQUFHLHlCQUFHLGtCQUFILENBQVI7QUFDSCxLQUhNLE1BR0EsSUFBSWQsS0FBSyxLQUFLaUIsd0NBQWQsRUFBa0M7QUFDckNKLE1BQUFBLElBQUksZ0JBQUc7QUFBTSxRQUFBLFNBQVMsRUFBQztBQUFoQixRQUFQO0FBQ0FDLE1BQUFBLEtBQUssR0FBRyx5QkFBRyxlQUFILENBQVI7QUFDSCxLQUhNLE1BR0EsSUFBSWQsS0FBSyxLQUFLa0IsZ0NBQWQsRUFBMEI7QUFDN0JMLE1BQUFBLElBQUksZ0JBQUc7QUFBTSxRQUFBLFNBQVMsRUFBQztBQUFoQixRQUFQO0FBQ0FDLE1BQUFBLEtBQUssR0FBRyx5QkFBRyxtQkFBSCxDQUFSO0FBQ0gsS0FITSxNQUdBO0FBQ0gsWUFBTSxJQUFJSyxLQUFKLHlCQUEyQm5CLEtBQTNCLEVBQU47QUFDSDs7QUFFRCx3QkFDSSw2QkFBQyxRQUFELHFCQUNJLDZCQUFDLG9CQUFELHFCQUNJO0FBQUksTUFBQSxTQUFTLEVBQUM7QUFBZCxPQUNLYSxJQURMLEVBRUtDLEtBRkwsQ0FESixlQUtJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSSw2QkFBQyw0QkFBRDtBQUFxQixNQUFBLFVBQVUsRUFBRSxLQUFLTSxLQUFMLENBQVdDO0FBQTVDLE1BREosQ0FMSixDQURKLENBREo7QUFhSDs7QUE1RHlEOzs7OEJBQXpDN0IsZ0IsZUFDRTtBQUNmNkIsRUFBQUEsVUFBVSxFQUFFQyxtQkFBVUMsSUFBVixDQUFlQztBQURaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge1xuICAgIFNldHVwRW5jcnlwdGlvblN0b3JlLFxuICAgIFBIQVNFX0lOVFJPLFxuICAgIFBIQVNFX0JVU1ksXG4gICAgUEhBU0VfRE9ORSxcbiAgICBQSEFTRV9DT05GSVJNX1NLSVAsXG59IGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9TZXR1cEVuY3J5cHRpb25TdG9yZSc7XG5pbXBvcnQgU2V0dXBFbmNyeXB0aW9uQm9keSBmcm9tIFwiLi9TZXR1cEVuY3J5cHRpb25Cb2R5XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBsZXRlU2VjdXJpdHkgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBzdG9yZSA9IFNldHVwRW5jcnlwdGlvblN0b3JlLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICAgIHN0b3JlLm9uKFwidXBkYXRlXCIsIHRoaXMuX29uU3RvcmVVcGRhdGUpO1xuICAgICAgICBzdG9yZS5zdGFydCgpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge3BoYXNlOiBzdG9yZS5waGFzZX07XG4gICAgfVxuXG4gICAgX29uU3RvcmVVcGRhdGUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gU2V0dXBFbmNyeXB0aW9uU3RvcmUuc2hhcmVkSW5zdGFuY2UoKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGhhc2U6IHN0b3JlLnBoYXNlfSk7XG4gICAgfTtcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBjb25zdCBzdG9yZSA9IFNldHVwRW5jcnlwdGlvblN0b3JlLnNoYXJlZEluc3RhbmNlKCk7XG4gICAgICAgIHN0b3JlLm9mZihcInVwZGF0ZVwiLCB0aGlzLl9vblN0b3JlVXBkYXRlKTtcbiAgICAgICAgc3RvcmUuc3RvcCgpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQXV0aFBhZ2UgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXV0aC5BdXRoUGFnZVwiKTtcbiAgICAgICAgY29uc3QgQ29tcGxldGVTZWN1cml0eUJvZHkgPSBzZGsuZ2V0Q29tcG9uZW50KFwiYXV0aC5Db21wbGV0ZVNlY3VyaXR5Qm9keVwiKTtcbiAgICAgICAgY29uc3Qge3BoYXNlfSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIGxldCBpY29uO1xuICAgICAgICBsZXQgdGl0bGU7XG5cbiAgICAgICAgaWYgKHBoYXNlID09PSBQSEFTRV9JTlRSTykge1xuICAgICAgICAgICAgaWNvbiA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfaGVhZGVySWNvbiBteF9FMkVJY29uX3dhcm5pbmdcIiAvPjtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoXCJWZXJpZnkgdGhpcyBsb2dpblwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChwaGFzZSA9PT0gUEhBU0VfRE9ORSkge1xuICAgICAgICAgICAgaWNvbiA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfaGVhZGVySWNvbiBteF9FMkVJY29uX3ZlcmlmaWVkXCIgLz47XG4gICAgICAgICAgICB0aXRsZSA9IF90KFwiU2Vzc2lvbiB2ZXJpZmllZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChwaGFzZSA9PT0gUEhBU0VfQ09ORklSTV9TS0lQKSB7XG4gICAgICAgICAgICBpY29uID0gPHNwYW4gY2xhc3NOYW1lPVwibXhfQ29tcGxldGVTZWN1cml0eV9oZWFkZXJJY29uIG14X0UyRUljb25fd2FybmluZ1wiIC8+O1xuICAgICAgICAgICAgdGl0bGUgPSBfdChcIkFyZSB5b3Ugc3VyZT9cIik7XG4gICAgICAgIH0gZWxzZSBpZiAocGhhc2UgPT09IFBIQVNFX0JVU1kpIHtcbiAgICAgICAgICAgIGljb24gPSA8c3BhbiBjbGFzc05hbWU9XCJteF9Db21wbGV0ZVNlY3VyaXR5X2hlYWRlckljb24gbXhfRTJFSWNvbl93YXJuaW5nXCIgLz47XG4gICAgICAgICAgICB0aXRsZSA9IF90KFwiVmVyaWZ5IHRoaXMgbG9naW5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcGhhc2UgJHtwaGFzZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXV0aFBhZ2U+XG4gICAgICAgICAgICAgICAgPENvbXBsZXRlU2VjdXJpdHlCb2R5PlxuICAgICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwibXhfQ29tcGxldGVTZWN1cml0eV9oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpY29ufVxuICAgICAgICAgICAgICAgICAgICAgICAge3RpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbXBsZXRlU2VjdXJpdHlfYm9keVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNldHVwRW5jcnlwdGlvbkJvZHkgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfSAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L0NvbXBsZXRlU2VjdXJpdHlCb2R5PlxuICAgICAgICAgICAgPC9BdXRoUGFnZT5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=