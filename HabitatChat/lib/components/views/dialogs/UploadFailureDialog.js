"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _filesize = _interopRequireDefault(require("filesize"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _ContentMessages = _interopRequireDefault(require("../../../ContentMessages"));

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

/*
 * Tells the user about files we know cannot be uploaded before we even try uploading
 * them. This is named fairly generically but the only thing we check right now is
 * the size of the file.
 */
class UploadFailureDialog extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onCancelClick", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onUploadClick", () => {
      this.props.onFinished(true);
    });
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    let message;
    let preview;
    let buttons;

    if (this.props.totalFiles === 1 && this.props.badFiles.length === 1) {
      message = (0, _languageHandler._t)("This file is <b>too large</b> to upload. " + "The file size limit is %(limit)s but this file is %(sizeOfThisFile)s.", {
        limit: (0, _filesize.default)(this.props.contentMessages.getUploadLimit()),
        sizeOfThisFile: (0, _filesize.default)(this.props.badFiles[0].size)
      }, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      });
      buttons = /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('OK'),
        hasCancel: false,
        onPrimaryButtonClick: this._onCancelClick,
        focus: true
      });
    } else if (this.props.totalFiles === this.props.badFiles.length) {
      message = (0, _languageHandler._t)("These files are <b>too large</b> to upload. " + "The file size limit is %(limit)s.", {
        limit: (0, _filesize.default)(this.props.contentMessages.getUploadLimit())
      }, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      });
      buttons = /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('OK'),
        hasCancel: false,
        onPrimaryButtonClick: this._onCancelClick,
        focus: true
      });
    } else {
      message = (0, _languageHandler._t)("Some files are <b>too large</b> to be uploaded. " + "The file size limit is %(limit)s.", {
        limit: (0, _filesize.default)(this.props.contentMessages.getUploadLimit())
      }, {
        b: sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      });
      const howManyOthers = this.props.totalFiles - this.props.badFiles.length;
      buttons = /*#__PURE__*/_react.default.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)('Upload %(count)s other files', {
          count: howManyOthers
        }),
        onPrimaryButtonClick: this._onUploadClick,
        hasCancel: true,
        cancelButton: (0, _languageHandler._t)("Cancel All"),
        onCancel: this._onCancelClick,
        focus: true
      });
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_UploadFailureDialog",
      onFinished: this._onCancelClick,
      title: (0, _languageHandler._t)("Upload Error"),
      contentId: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      id: "mx_Dialog_content"
    }, message, preview), buttons);
  }

}

exports.default = UploadFailureDialog;
(0, _defineProperty2.default)(UploadFailureDialog, "propTypes", {
  badFiles: _propTypes.default.arrayOf(_propTypes.default.object).isRequired,
  totalFiles: _propTypes.default.number.isRequired,
  contentMessages: _propTypes.default.instanceOf(_ContentMessages.default).isRequired,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVXBsb2FkRmFpbHVyZURpYWxvZy5qcyJdLCJuYW1lcyI6WyJVcGxvYWRGYWlsdXJlRGlhbG9nIiwiUmVhY3QiLCJDb21wb25lbnQiLCJwcm9wcyIsIm9uRmluaXNoZWQiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRGlhbG9nQnV0dG9ucyIsIm1lc3NhZ2UiLCJwcmV2aWV3IiwiYnV0dG9ucyIsInRvdGFsRmlsZXMiLCJiYWRGaWxlcyIsImxlbmd0aCIsImxpbWl0IiwiY29udGVudE1lc3NhZ2VzIiwiZ2V0VXBsb2FkTGltaXQiLCJzaXplT2ZUaGlzRmlsZSIsInNpemUiLCJiIiwic3ViIiwiX29uQ2FuY2VsQ2xpY2siLCJob3dNYW55T3RoZXJzIiwiY291bnQiLCJfb25VcGxvYWRDbGljayIsIlByb3BUeXBlcyIsImFycmF5T2YiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwibnVtYmVyIiwiaW5zdGFuY2VPZiIsIkNvbnRlbnRNZXNzYWdlcyIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7OztBQUtlLE1BQU1BLG1CQUFOLFNBQWtDQyxlQUFNQyxTQUF4QyxDQUFrRDtBQUFBO0FBQUE7QUFBQSwwREFRNUMsTUFBTTtBQUNuQixXQUFLQyxLQUFMLENBQVdDLFVBQVgsQ0FBc0IsS0FBdEI7QUFDSCxLQVY0RDtBQUFBLDBEQVk1QyxNQUFNO0FBQ25CLFdBQUtELEtBQUwsQ0FBV0MsVUFBWCxDQUFzQixJQUF0QjtBQUNILEtBZDREO0FBQUE7O0FBZ0I3REMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsVUFBVSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsVUFBTUMsYUFBYSxHQUFH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Q0tiLE9BREwsRUFFS0MsT0FGTCxDQUxKLEVBVUtDLE9BVkwsQ0FESjtBQWNIOztBQXpGNEQ7Ozs4QkFBNUNaLG1CLGVBQ0U7QUFDZmMsRUFBQUEsUUFBUSxFQUFFYSxtQkFBVUMsT0FBVixDQUFrQkQsbUJBQVVFLE1BQTVCLEVBQW9DQyxVQUQvQjtBQUVmakIsRUFBQUEsVUFBVSxFQUFFYyxtQkFBVUksTUFBVixDQUFpQkQsVUFGZDtBQUdmYixFQUFBQSxlQUFlLEVBQUVVLG1CQUFVSyxVQUFWLENBQXFCQyx3QkFBckIsRUFBc0NILFVBSHhDO0FBSWYxQixFQUFBQSxVQUFVLEVBQUV1QixtQkFBVU8sSUFBVixDQUFlSjtBQUpaLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQ29udGVudE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uL0NvbnRlbnRNZXNzYWdlcyc7XG5cbi8qXG4gKiBUZWxscyB0aGUgdXNlciBhYm91dCBmaWxlcyB3ZSBrbm93IGNhbm5vdCBiZSB1cGxvYWRlZCBiZWZvcmUgd2UgZXZlbiB0cnkgdXBsb2FkaW5nXG4gKiB0aGVtLiBUaGlzIGlzIG5hbWVkIGZhaXJseSBnZW5lcmljYWxseSBidXQgdGhlIG9ubHkgdGhpbmcgd2UgY2hlY2sgcmlnaHQgbm93IGlzXG4gKiB0aGUgc2l6ZSBvZiB0aGUgZmlsZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBsb2FkRmFpbHVyZURpYWxvZyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgYmFkRmlsZXM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5vYmplY3QpLmlzUmVxdWlyZWQsXG4gICAgICAgIHRvdGFsRmlsZXM6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgICAgICAgY29udGVudE1lc3NhZ2VzOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihDb250ZW50TWVzc2FnZXMpLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfVxuXG4gICAgX29uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgX29uVXBsb2FkQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcblxuICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgbGV0IHByZXZpZXc7XG4gICAgICAgIGxldCBidXR0b25zO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy50b3RhbEZpbGVzID09PSAxICYmIHRoaXMucHJvcHMuYmFkRmlsZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gX3QoXG4gICAgICAgICAgICAgICAgXCJUaGlzIGZpbGUgaXMgPGI+dG9vIGxhcmdlPC9iPiB0byB1cGxvYWQuIFwiICtcbiAgICAgICAgICAgICAgICBcIlRoZSBmaWxlIHNpemUgbGltaXQgaXMgJShsaW1pdClzIGJ1dCB0aGlzIGZpbGUgaXMgJShzaXplT2ZUaGlzRmlsZSlzLlwiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGltaXQ6IGZpbGVzaXplKHRoaXMucHJvcHMuY29udGVudE1lc3NhZ2VzLmdldFVwbG9hZExpbWl0KCkpLFxuICAgICAgICAgICAgICAgICAgICBzaXplT2ZUaGlzRmlsZTogZmlsZXNpemUodGhpcy5wcm9wcy5iYWRGaWxlc1swXS5zaXplKSxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGI6IHN1YiA9PiA8Yj57c3VifTwvYj4sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBidXR0b25zID0gPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17X3QoJ09LJyl9XG4gICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25DYW5jZWxDbGlja31cbiAgICAgICAgICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMudG90YWxGaWxlcyA9PT0gdGhpcy5wcm9wcy5iYWRGaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBfdChcbiAgICAgICAgICAgICAgICBcIlRoZXNlIGZpbGVzIGFyZSA8Yj50b28gbGFyZ2U8L2I+IHRvIHVwbG9hZC4gXCIgK1xuICAgICAgICAgICAgICAgIFwiVGhlIGZpbGUgc2l6ZSBsaW1pdCBpcyAlKGxpbWl0KXMuXCIsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsaW1pdDogZmlsZXNpemUodGhpcy5wcm9wcy5jb250ZW50TWVzc2FnZXMuZ2V0VXBsb2FkTGltaXQoKSksXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBiOiBzdWIgPT4gPGI+e3N1Yn08L2I+LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnV0dG9ucyA9IDxEaWFsb2dCdXR0b25zIHByaW1hcnlCdXR0b249e190KCdPSycpfVxuICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMuX29uQ2FuY2VsQ2xpY2t9XG4gICAgICAgICAgICAgICAgZm9jdXM9e3RydWV9XG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBfdChcbiAgICAgICAgICAgICAgICBcIlNvbWUgZmlsZXMgYXJlIDxiPnRvbyBsYXJnZTwvYj4gdG8gYmUgdXBsb2FkZWQuIFwiICtcbiAgICAgICAgICAgICAgICBcIlRoZSBmaWxlIHNpemUgbGltaXQgaXMgJShsaW1pdClzLlwiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGltaXQ6IGZpbGVzaXplKHRoaXMucHJvcHMuY29udGVudE1lc3NhZ2VzLmdldFVwbG9hZExpbWl0KCkpLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgYjogc3ViID0+IDxiPntzdWJ9PC9iPixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IGhvd01hbnlPdGhlcnMgPSB0aGlzLnByb3BzLnRvdGFsRmlsZXMgLSB0aGlzLnByb3BzLmJhZEZpbGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGJ1dHRvbnMgPSA8RGlhbG9nQnV0dG9uc1xuICAgICAgICAgICAgICAgIHByaW1hcnlCdXR0b249e190KCdVcGxvYWQgJShjb3VudClzIG90aGVyIGZpbGVzJywgeyBjb3VudDogaG93TWFueU90aGVycyB9KX1cbiAgICAgICAgICAgICAgICBvblByaW1hcnlCdXR0b25DbGljaz17dGhpcy5fb25VcGxvYWRDbGlja31cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgY2FuY2VsQnV0dG9uPXtfdChcIkNhbmNlbCBBbGxcIil9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMuX29uQ2FuY2VsQ2xpY2t9XG4gICAgICAgICAgICAgICAgZm9jdXM9e3RydWV9XG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9J214X1VwbG9hZEZhaWx1cmVEaWFsb2cnXG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5fb25DYW5jZWxDbGlja31cbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJVcGxvYWQgRXJyb3JcIil9XG4gICAgICAgICAgICAgICAgY29udGVudElkPSdteF9EaWFsb2dfY29udGVudCdcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIHttZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgICB7cHJldmlld31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHtidXR0b25zfVxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==