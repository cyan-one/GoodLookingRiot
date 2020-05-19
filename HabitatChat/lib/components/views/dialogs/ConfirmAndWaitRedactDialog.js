"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

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

/*
 * A dialog for confirming a redaction.
 * Also shows a spinner (and possible error) while the redaction is ongoing,
 * and only closes the dialog when the redaction is done or failed.
 *
 * This is done to prevent the edit history dialog racing with the redaction:
 * if this dialog closes and the MessageEditHistoryDialog is shown again,
 * it will fetch the relations again, which will race with the ongoing /redact request.
 * which will cause the edit to appear unredacted.
 *
 * To avoid this, we keep the dialog open as long as /redact is in progress.
 */
class ConfirmAndWaitRedactDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onParentFinished", async proceed => {
      if (proceed) {
        this.setState({
          isRedacting: true
        });

        try {
          await this.props.redact();
          this.props.onFinished(true);
        } catch (error) {
          const code = error.errcode || error.statusCode;

          if (typeof code !== "undefined") {
            this.setState({
              redactionErrorCode: code
            });
          } else {
            this.props.onFinished(true);
          }
        }
      } else {
        this.props.onFinished(false);
      }
    });
    this.state = {
      isRedacting: false,
      redactionErrorCode: null
    };
  }

  render() {
    if (this.state.isRedacting) {
      if (this.state.redactionErrorCode) {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
        const code = this.state.redactionErrorCode;
        return /*#__PURE__*/_react.default.createElement(ErrorDialog, {
          onFinished: this.props.onFinished,
          title: (0, _languageHandler._t)('Error'),
          description: (0, _languageHandler._t)('You cannot delete this message. (%(code)s)', {
            code
          })
        });
      } else {
        const BaseDialog = sdk.getComponent("dialogs.BaseDialog");
        const Spinner = sdk.getComponent('elements.Spinner');
        return /*#__PURE__*/_react.default.createElement(BaseDialog, {
          onFinished: this.props.onFinished,
          hasCancel: false,
          title: (0, _languageHandler._t)("Removing…")
        }, /*#__PURE__*/_react.default.createElement(Spinner, null));
      }
    } else {
      const ConfirmRedactDialog = sdk.getComponent("dialogs.ConfirmRedactDialog");
      return /*#__PURE__*/_react.default.createElement(ConfirmRedactDialog, {
        onFinished: this.onParentFinished
      });
    }
  }

}

exports.default = ConfirmAndWaitRedactDialog;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ29uZmlybUFuZFdhaXRSZWRhY3REaWFsb2cuanMiXSwibmFtZXMiOlsiQ29uZmlybUFuZFdhaXRSZWRhY3REaWFsb2ciLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwicHJvY2VlZCIsInNldFN0YXRlIiwiaXNSZWRhY3RpbmciLCJyZWRhY3QiLCJvbkZpbmlzaGVkIiwiZXJyb3IiLCJjb2RlIiwiZXJyY29kZSIsInN0YXR1c0NvZGUiLCJyZWRhY3Rpb25FcnJvckNvZGUiLCJzdGF0ZSIsInJlbmRlciIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiQmFzZURpYWxvZyIsIlNwaW5uZXIiLCJDb25maXJtUmVkYWN0RGlhbG9nIiwib25QYXJlbnRGaW5pc2hlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkE7Ozs7Ozs7Ozs7OztBQVllLE1BQU1BLDBCQUFOLFNBQXlDQyxlQUFNQyxhQUEvQyxDQUE2RDtBQUN4RUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUsNERBUUEsTUFBT0MsT0FBUCxJQUFtQjtBQUNsQyxVQUFJQSxPQUFKLEVBQWE7QUFDVCxhQUFLQyxRQUFMLENBQWM7QUFBQ0MsVUFBQUEsV0FBVyxFQUFFO0FBQWQsU0FBZDs7QUFDQSxZQUFJO0FBQ0EsZ0JBQU0sS0FBS0gsS0FBTCxDQUFXSSxNQUFYLEVBQU47QUFDQSxlQUFLSixLQUFMLENBQVdLLFVBQVgsQ0FBc0IsSUFBdEI7QUFDSCxTQUhELENBR0UsT0FBT0MsS0FBUCxFQUFjO0FBQ1osZ0JBQU1DLElBQUksR0FBR0QsS0FBSyxDQUFDRSxPQUFOLElBQWlCRixLQUFLLENBQUNHLFVBQXBDOztBQUNBLGNBQUksT0FBT0YsSUFBUCxLQUFnQixXQUFwQixFQUFpQztBQUM3QixpQkFBS0wsUUFBTCxDQUFjO0FBQUNRLGNBQUFBLGtCQUFrQixFQUFFSDtBQUFyQixhQUFkO0FBQ0gsV0FGRCxNQUVPO0FBQ0gsaUJBQUtQLEtBQUwsQ0FBV0ssVUFBWCxDQUFzQixJQUF0QjtBQUNIO0FBQ0o7QUFDSixPQWJELE1BYU87QUFDSCxhQUFLTCxLQUFMLENBQVdLLFVBQVgsQ0FBc0IsS0FBdEI7QUFDSDtBQUNKLEtBekJrQjtBQUVmLFNBQUtNLEtBQUwsR0FBYTtBQUNUUixNQUFBQSxXQUFXLEVBQUUsS0FESjtBQUVUTyxNQUFBQSxrQkFBa0IsRUFBRTtBQUZYLEtBQWI7QUFJSDs7QUFxQkRFLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUksS0FBS0QsS0FBTCxDQUFXUixXQUFmLEVBQTRCO0FBQ3hCLFVBQUksS0FBS1EsS0FBTCxDQUFXRCxrQkFBZixFQUFtQztBQUMvQixjQUFNRyxXQUFXLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBcEI7QUFDQSxjQUFNUixJQUFJLEdBQUcsS0FBS0ksS0FBTCxDQUFXRCxrQkFBeEI7QUFDQSw0QkFDSSw2QkFBQyxXQUFEO0FBQ0ksVUFBQSxVQUFVLEVBQUUsS0FBS1YsS0FBTCxDQUFXSyxVQUQzQjtBQUVJLFVBQUEsS0FBSyxFQUFFLHlCQUFHLE9BQUgsQ0FGWDtBQUdJLFVBQUEsV0FBVyxFQUFFLHlCQUFHLDRDQUFILEVBQWlEO0FBQUNFLFlBQUFBO0FBQUQsV0FBakQ7QUFIakIsVUFESjtBQU9ILE9BVkQsTUFVTztBQUNILGNBQU1TLFVBQVUsR0FBR0YsR0FBRyxDQUFDQyxZQUFKLENBQWlCLG9CQUFqQixDQUFuQjtBQUNBLGNBQU1FLE9BQU8sR0FBR0gsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLDRCQUNJLDZCQUFDLFVBQUQ7QUFDSSxVQUFBLFVBQVUsRUFBRSxLQUFLZixLQUFMLENBQVdLLFVBRDNCO0FBRUksVUFBQSxTQUFTLEVBQUUsS0FGZjtBQUdJLFVBQUEsS0FBSyxFQUFFLHlCQUFHLFdBQUg7QUFIWCx3QkFJSSw2QkFBQyxPQUFELE9BSkosQ0FESjtBQVFIO0FBQ0osS0F2QkQsTUF1Qk87QUFDSCxZQUFNYSxtQkFBbUIsR0FBR0osR0FBRyxDQUFDQyxZQUFKLENBQWlCLDZCQUFqQixDQUE1QjtBQUNBLDBCQUFPLDZCQUFDLG1CQUFEO0FBQXFCLFFBQUEsVUFBVSxFQUFFLEtBQUtJO0FBQXRDLFFBQVA7QUFDSDtBQUNKOztBQXhEdUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuLypcbiAqIEEgZGlhbG9nIGZvciBjb25maXJtaW5nIGEgcmVkYWN0aW9uLlxuICogQWxzbyBzaG93cyBhIHNwaW5uZXIgKGFuZCBwb3NzaWJsZSBlcnJvcikgd2hpbGUgdGhlIHJlZGFjdGlvbiBpcyBvbmdvaW5nLFxuICogYW5kIG9ubHkgY2xvc2VzIHRoZSBkaWFsb2cgd2hlbiB0aGUgcmVkYWN0aW9uIGlzIGRvbmUgb3IgZmFpbGVkLlxuICpcbiAqIFRoaXMgaXMgZG9uZSB0byBwcmV2ZW50IHRoZSBlZGl0IGhpc3RvcnkgZGlhbG9nIHJhY2luZyB3aXRoIHRoZSByZWRhY3Rpb246XG4gKiBpZiB0aGlzIGRpYWxvZyBjbG9zZXMgYW5kIHRoZSBNZXNzYWdlRWRpdEhpc3RvcnlEaWFsb2cgaXMgc2hvd24gYWdhaW4sXG4gKiBpdCB3aWxsIGZldGNoIHRoZSByZWxhdGlvbnMgYWdhaW4sIHdoaWNoIHdpbGwgcmFjZSB3aXRoIHRoZSBvbmdvaW5nIC9yZWRhY3QgcmVxdWVzdC5cbiAqIHdoaWNoIHdpbGwgY2F1c2UgdGhlIGVkaXQgdG8gYXBwZWFyIHVucmVkYWN0ZWQuXG4gKlxuICogVG8gYXZvaWQgdGhpcywgd2Uga2VlcCB0aGUgZGlhbG9nIG9wZW4gYXMgbG9uZyBhcyAvcmVkYWN0IGlzIGluIHByb2dyZXNzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25maXJtQW5kV2FpdFJlZGFjdERpYWxvZyBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGlzUmVkYWN0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIHJlZGFjdGlvbkVycm9yQ29kZTogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvblBhcmVudEZpbmlzaGVkID0gYXN5bmMgKHByb2NlZWQpID0+IHtcbiAgICAgICAgaWYgKHByb2NlZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2lzUmVkYWN0aW5nOiB0cnVlfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvcHMucmVkYWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKHRydWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gZXJyb3IuZXJyY29kZSB8fCBlcnJvci5zdGF0dXNDb2RlO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtyZWRhY3Rpb25FcnJvckNvZGU6IGNvZGV9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmlzUmVkYWN0aW5nKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5yZWRhY3Rpb25FcnJvckNvZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSB0aGlzLnN0YXRlLnJlZGFjdGlvbkVycm9yQ29kZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8RXJyb3JEaWFsb2dcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnRXJyb3InKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uPXtfdCgnWW91IGNhbm5vdCBkZWxldGUgdGhpcyBtZXNzYWdlLiAoJShjb2RlKXMpJywge2NvZGV9KX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQmFzZURpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxCYXNlRGlhbG9nXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e190KFwiUmVtb3ZpbmfigKZcIil9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBDb25maXJtUmVkYWN0RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuQ29uZmlybVJlZGFjdERpYWxvZ1wiKTtcbiAgICAgICAgICAgIHJldHVybiA8Q29uZmlybVJlZGFjdERpYWxvZyBvbkZpbmlzaGVkPXt0aGlzLm9uUGFyZW50RmluaXNoZWR9IC8+O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19