"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _matrixJsSdk = require("matrix-js-sdk");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _Markdown = _interopRequireDefault(require("../../../Markdown"));

/*
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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

/*
 * A dialog for reporting an event.
 */
class ReportEventDialog extends _react.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onReasonChange", ({
      target: {
        value: reason
      }
    }) => {
      this.setState({
        reason
      });
    });
    (0, _defineProperty2.default)(this, "_onCancel", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onSubmit", async () => {
      if (!this.state.reason || !this.state.reason.trim()) {
        this.setState({
          err: (0, _languageHandler._t)("Please fill why you're reporting.")
        });
        return;
      }

      this.setState({
        busy: true,
        err: null
      });

      try {
        const ev = this.props.mxEvent;
        await _MatrixClientPeg.MatrixClientPeg.get().reportEvent(ev.getRoomId(), ev.getId(), -100, this.state.reason.trim());
        this.props.onFinished(true);
      } catch (e) {
        this.setState({
          busy: false,
          err: e.message
        });
      }
    });
    this.state = {
      reason: "",
      busy: false,
      err: null
    };
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    const Loader = sdk.getComponent('elements.Spinner');
    const Field = sdk.getComponent('elements.Field');
    let error = null;

    if (this.state.err) {
      error = /*#__PURE__*/_react.default.createElement("div", {
        className: "error"
      }, this.state.err);
    }

    let progress = null;

    if (this.state.busy) {
      progress = /*#__PURE__*/_react.default.createElement("div", {
        className: "progress"
      }, /*#__PURE__*/_react.default.createElement(Loader, null));
    }

    const adminMessageMD = _SdkConfig.default.get().reportEvent && _SdkConfig.default.get().reportEvent.adminMessageMD;

    let adminMessage;

    if (adminMessageMD) {
      const html = new _Markdown.default(adminMessageMD).toHTML({
        externalLinks: true
      });
      adminMessage = /*#__PURE__*/_react.default.createElement("p", {
        dangerouslySetInnerHTML: {
          __html: html
        }
      });
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_BugReportDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Report Content to Your Homeserver Administrator'),
      contentId: "mx_ReportEventDialog"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ReportEventDialog",
      id: "mx_ReportEventDialog"
    }, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Reporting this message will send its unique 'event ID' to the administrator of " + "your homeserver. If messages in this room are encrypted, your homeserver " + "administrator will not be able to read the message text or view any files or images.")), adminMessage, /*#__PURE__*/_react.default.createElement(Field, {
      className: "mx_ReportEventDialog_reason",
      element: "textarea",
      label: (0, _languageHandler._t)("Reason"),
      rows: 5,
      onChange: this._onReasonChange,
      value: this.state.reason,
      disabled: this.state.busy
    }), progress, error), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)("Send report"),
      onPrimaryButtonClick: this._onSubmit,
      focus: true,
      onCancel: this._onCancel,
      disabled: this.state.busy
    }));
  }

}

exports.default = ReportEventDialog;
(0, _defineProperty2.default)(ReportEventDialog, "propTypes", {
  mxEvent: _propTypes.default.instanceOf(_matrixJsSdk.MatrixEvent).isRequired,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvUmVwb3J0RXZlbnREaWFsb2cuanMiXSwibmFtZXMiOlsiUmVwb3J0RXZlbnREaWFsb2ciLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInRhcmdldCIsInZhbHVlIiwicmVhc29uIiwic2V0U3RhdGUiLCJvbkZpbmlzaGVkIiwic3RhdGUiLCJ0cmltIiwiZXJyIiwiYnVzeSIsImV2IiwibXhFdmVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsInJlcG9ydEV2ZW50IiwiZ2V0Um9vbUlkIiwiZ2V0SWQiLCJlIiwibWVzc2FnZSIsInJlbmRlciIsIkJhc2VEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJEaWFsb2dCdXR0b25zIiwiTG9hZGVyIiwiRmllbGQiLCJlcnJvciIsInByb2dyZXNzIiwiYWRtaW5NZXNzYWdlTUQiLCJTZGtDb25maWciLCJhZG1pbk1lc3NhZ2UiLCJodG1sIiwiTWFya2Rvd24iLCJ0b0hUTUwiLCJleHRlcm5hbExpbmtzIiwiX19odG1sIiwiX29uUmVhc29uQ2hhbmdlIiwiX29uU3VibWl0IiwiX29uQ2FuY2VsIiwiUHJvcFR5cGVzIiwiaW5zdGFuY2VPZiIsIk1hdHJpeEV2ZW50IiwiaXNSZXF1aXJlZCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdkJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBOzs7QUFHZSxNQUFNQSxpQkFBTixTQUFnQ0Msb0JBQWhDLENBQThDO0FBTXpEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSwyREFVRCxDQUFDO0FBQUNDLE1BQUFBLE1BQU0sRUFBRTtBQUFDQyxRQUFBQSxLQUFLLEVBQUVDO0FBQVI7QUFBVCxLQUFELEtBQStCO0FBQzdDLFdBQUtDLFFB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Q29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7UHVyZUNvbXBvbmVudH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcbmltcG9ydCB7TWF0cml4RXZlbnR9IGZyb20gXCJtYXRyaXgtanMtc2RrXCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tICcuLi8uLi8uLi9TZGtDb25maWcnO1xuaW1wb3J0IE1hcmtkb3duIGZyb20gJy4uLy4uLy4uL01hcmtkb3duJztcblxuLypcbiAqIEEgZGlhbG9nIGZvciByZXBvcnRpbmcgYW4gZXZlbnQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydEV2ZW50RGlhbG9nIGV4dGVuZHMgUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLmluc3RhbmNlT2YoTWF0cml4RXZlbnQpLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgcmVhc29uOiBcIlwiLFxuICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICBlcnI6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgX29uUmVhc29uQ2hhbmdlID0gKHt0YXJnZXQ6IHt2YWx1ZTogcmVhc29ufX0pID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHJlYXNvbiB9KTtcbiAgICB9O1xuXG4gICAgX29uQ2FuY2VsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH07XG5cbiAgICBfb25TdWJtaXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5yZWFzb24gfHwgIXRoaXMuc3RhdGUucmVhc29uLnRyaW0oKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyOiBfdChcIlBsZWFzZSBmaWxsIHdoeSB5b3UncmUgcmVwb3J0aW5nLlwiKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiB0cnVlLFxuICAgICAgICAgICAgZXJyOiBudWxsLFxuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZXYgPSB0aGlzLnByb3BzLm14RXZlbnQ7XG4gICAgICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVwb3J0RXZlbnQoZXYuZ2V0Um9vbUlkKCksIGV2LmdldElkKCksIC0xMDAsIHRoaXMuc3RhdGUucmVhc29uLnRyaW0oKSk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycjogZS5tZXNzYWdlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IERpYWxvZ0J1dHRvbnMgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5EaWFsb2dCdXR0b25zJyk7XG4gICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLlNwaW5uZXInKTtcbiAgICAgICAgY29uc3QgRmllbGQgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5GaWVsZCcpO1xuXG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmVycikge1xuICAgICAgICAgICAgZXJyb3IgPSA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCI+XG4gICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZXJyfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHByb2dyZXNzID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYnVzeSkge1xuICAgICAgICAgICAgcHJvZ3Jlc3MgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9ncmVzc1wiPlxuICAgICAgICAgICAgICAgICAgICA8TG9hZGVyIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWRtaW5NZXNzYWdlTUQgPVxuICAgICAgICAgICAgU2RrQ29uZmlnLmdldCgpLnJlcG9ydEV2ZW50ICYmXG4gICAgICAgICAgICBTZGtDb25maWcuZ2V0KCkucmVwb3J0RXZlbnQuYWRtaW5NZXNzYWdlTUQ7XG4gICAgICAgIGxldCBhZG1pbk1lc3NhZ2U7XG4gICAgICAgIGlmIChhZG1pbk1lc3NhZ2VNRCkge1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9IG5ldyBNYXJrZG93bihhZG1pbk1lc3NhZ2VNRCkudG9IVE1MKHsgZXh0ZXJuYWxMaW5rczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGFkbWluTWVzc2FnZSA9IDxwIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogaHRtbCB9fSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZ1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0J1Z1JlcG9ydERpYWxvZ1wiXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnUmVwb3J0IENvbnRlbnQgdG8gWW91ciBIb21lc2VydmVyIEFkbWluaXN0cmF0b3InKX1cbiAgICAgICAgICAgICAgICBjb250ZW50SWQ9J214X1JlcG9ydEV2ZW50RGlhbG9nJ1xuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUmVwb3J0RXZlbnREaWFsb2dcIiBpZD1cIm14X1JlcG9ydEV2ZW50RGlhbG9nXCI+XG4gICAgICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90KFwiUmVwb3J0aW5nIHRoaXMgbWVzc2FnZSB3aWxsIHNlbmQgaXRzIHVuaXF1ZSAnZXZlbnQgSUQnIHRvIHRoZSBhZG1pbmlzdHJhdG9yIG9mIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ5b3VyIGhvbWVzZXJ2ZXIuIElmIG1lc3NhZ2VzIGluIHRoaXMgcm9vbSBhcmUgZW5jcnlwdGVkLCB5b3VyIGhvbWVzZXJ2ZXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFkbWluaXN0cmF0b3Igd2lsbCBub3QgYmUgYWJsZSB0byByZWFkIHRoZSBtZXNzYWdlIHRleHQgb3IgdmlldyBhbnkgZmlsZXMgb3IgaW1hZ2VzLlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgIHthZG1pbk1lc3NhZ2V9XG4gICAgICAgICAgICAgICAgICAgIDxGaWVsZFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfUmVwb3J0RXZlbnREaWFsb2dfcmVhc29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ9XCJ0ZXh0YXJlYVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJSZWFzb25cIil9XG4gICAgICAgICAgICAgICAgICAgICAgICByb3dzPXs1fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uUmVhc29uQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGUucmVhc29ufVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuYnVzeX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAge3Byb2dyZXNzfVxuICAgICAgICAgICAgICAgICAgICB7ZXJyb3J9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnNcbiAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUJ1dHRvbj17X3QoXCJTZW5kIHJlcG9ydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uU3VibWl0fVxuICAgICAgICAgICAgICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMuX29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17dGhpcy5zdGF0ZS5idXN5fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19