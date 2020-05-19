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

var _filesize = _interopRequireDefault(require("filesize"));

/*
Copyright 2019 New Vector Ltd
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
class UploadConfirmDialog extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onCancelClick", () => {
      this.props.onFinished(false);
    });
    (0, _defineProperty2.default)(this, "_onUploadClick", () => {
      this.props.onFinished(true);
    });
    (0, _defineProperty2.default)(this, "_onUploadAllClick", () => {
      this.props.onFinished(true, true);
    });
    this._objectUrl = URL.createObjectURL(props.file);
  }

  componentWillUnmount() {
    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
  }

  render() {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    let title;

    if (this.props.totalFiles > 1 && this.props.currentIndex !== undefined) {
      title = (0, _languageHandler._t)("Upload files (%(current)s of %(total)s)", {
        current: this.props.currentIndex + 1,
        total: this.props.totalFiles
      });
    } else {
      title = (0, _languageHandler._t)('Upload files');
    }

    let preview;

    if (this.props.file.type.startsWith('image/')) {
      preview = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UploadConfirmDialog_previewOuter"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UploadConfirmDialog_previewInner"
      }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_UploadConfirmDialog_imagePreview",
        src: this._objectUrl
      })), /*#__PURE__*/_react.default.createElement("div", null, this.props.file.name, " (", (0, _filesize.default)(this.props.file.size), ")")));
    } else {
      preview = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_UploadConfirmDialog_fileIcon",
        src: require("../../../../res/img/files.png")
      }), this.props.file.name, " (", (0, _filesize.default)(this.props.file.size), ")"));
    }

    let uploadAllButton;

    if (this.props.currentIndex + 1 < this.props.totalFiles) {
      uploadAllButton = /*#__PURE__*/_react.default.createElement("button", {
        onClick: this._onUploadAllClick
      }, (0, _languageHandler._t)("Upload all"));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_UploadConfirmDialog",
      fixedWidth: false,
      onFinished: this._onCancelClick,
      title: title,
      contentId: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      id: "mx_Dialog_content"
    }, preview), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: (0, _languageHandler._t)('Upload'),
      hasCancel: false,
      onPrimaryButtonClick: this._onUploadClick,
      focus: true
    }, uploadAllButton));
  }

}

exports.default = UploadConfirmDialog;
(0, _defineProperty2.default)(UploadConfirmDialog, "propTypes", {
  file: _propTypes.default.object.isRequired,
  currentIndex: _propTypes.default.number,
  totalFiles: _propTypes.default.number,
  onFinished: _propTypes.default.func.isRequired
});
(0, _defineProperty2.default)(UploadConfirmDialog, "defaultProps", {
  totalFiles: 1
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVXBsb2FkQ29uZmlybURpYWxvZy5qcyJdLCJuYW1lcyI6WyJVcGxvYWRDb25maXJtRGlhbG9nIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwib25GaW5pc2hlZCIsIl9vYmplY3RVcmwiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJmaWxlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZXZva2VPYmplY3RVUkwiLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRGlhbG9nQnV0dG9ucyIsInRpdGxlIiwidG90YWxGaWxlcyIsImN1cnJlbnRJbmRleCIsInVuZGVmaW5lZCIsImN1cnJlbnQiLCJ0b3RhbCIsInByZXZpZXciLCJ0eXBlIiwic3RhcnRzV2l0aCIsIm5hbWUiLCJzaXplIiwicmVxdWlyZSIsInVwbG9hZEFsbEJ1dHRvbiIsIl9vblVwbG9hZEFsbENsaWNrIiwiX29uQ2FuY2VsQ2xpY2siLCJfb25VcGxvYWRDbGljayIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJudW1iZXIiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7OztBQXVCZSxNQUFNQSxtQkFBTixTQUFrQ0MsZUFBTUMsU0FBeEMsQ0FBa0Q7QUFZN0RDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLDBEQVVGLE1BQU07QUFDbkIsV0FBS0EsS0FBTCxDQUFXQyxVQUFYLENBQXNCLEtBQXRCO0FBQ0gsS0Faa0I7QUFBQSwwREFjRixNQUFNO0FBQ25CLFdBQUtELEtBQUwsQ0FBV0MsVUFBWCxDQUFzQixJQUF0QjtBQUNILEtBaEJrQjtBQUFBLDZEQWtCQyxNQUFNO0FBQ3RCLFdBQUtELEtB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QUEsS0FBSyxFQUFFO0FBSFgsT0FLS0gsZUFMTCxDQVZKLENBREo7QUFvQkg7O0FBakc0RDs7OzhCQUE1QzdCLG1CLGVBQ0U7QUFDZlMsRUFBQUEsSUFBSSxFQUFFd0IsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFI7QUFFZmhCLEVBQUFBLFlBQVksRUFBRWMsbUJBQVVHLE1BRlQ7QUFHZmxCLEVBQUFBLFVBQVUsRUFBRWUsbUJBQVVHLE1BSFA7QUFJZi9CLEVBQUFBLFVBQVUsRUFBRTRCLG1CQUFVSSxJQUFWLENBQWVGO0FBSlosQzs4QkFERm5DLG1CLGtCQVFLO0FBQ2xCa0IsRUFBQUEsVUFBVSxFQUFFO0FBRE0sQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IGZpbGVzaXplIGZyb20gXCJmaWxlc2l6ZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVcGxvYWRDb25maXJtRGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBmaWxlOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIGN1cnJlbnRJbmRleDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgdG90YWxGaWxlczogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICB0b3RhbEZpbGVzOiAxLFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLl9vYmplY3RVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHByb3BzLmZpbGUpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBpZiAodGhpcy5fb2JqZWN0VXJsKSBVUkwucmV2b2tlT2JqZWN0VVJMKHRoaXMuX29iamVjdFVybCk7XG4gICAgfVxuXG4gICAgX29uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgX29uVXBsb2FkQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICB9XG5cbiAgICBfb25VcGxvYWRBbGxDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKHRydWUsIHRydWUpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuXG4gICAgICAgIGxldCB0aXRsZTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMudG90YWxGaWxlcyA+IDEgJiYgdGhpcy5wcm9wcy5jdXJyZW50SW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGl0bGUgPSBfdChcbiAgICAgICAgICAgICAgICBcIlVwbG9hZCBmaWxlcyAoJShjdXJyZW50KXMgb2YgJSh0b3RhbClzKVwiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudDogdGhpcy5wcm9wcy5jdXJyZW50SW5kZXggKyAxLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5wcm9wcy50b3RhbEZpbGVzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGl0bGUgPSBfdCgnVXBsb2FkIGZpbGVzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJldmlldztcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICBwcmV2aWV3ID0gPGRpdiBjbGFzc05hbWU9XCJteF9VcGxvYWRDb25maXJtRGlhbG9nX3ByZXZpZXdPdXRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXBsb2FkQ29uZmlybURpYWxvZ19wcmV2aWV3SW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj48aW1nIGNsYXNzTmFtZT1cIm14X1VwbG9hZENvbmZpcm1EaWFsb2dfaW1hZ2VQcmV2aWV3XCIgc3JjPXt0aGlzLl9vYmplY3RVcmx9IC8+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+e3RoaXMucHJvcHMuZmlsZS5uYW1lfSAoe2ZpbGVzaXplKHRoaXMucHJvcHMuZmlsZS5zaXplKX0pPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmV2aWV3ID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X1VwbG9hZENvbmZpcm1EaWFsb2dfZmlsZUljb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9maWxlcy5wbmdcIil9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLmZpbGUubmFtZX0gKHtmaWxlc2l6ZSh0aGlzLnByb3BzLmZpbGUuc2l6ZSl9KVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHVwbG9hZEFsbEJ1dHRvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuY3VycmVudEluZGV4ICsgMSA8IHRoaXMucHJvcHMudG90YWxGaWxlcykge1xuICAgICAgICAgICAgdXBsb2FkQWxsQnV0dG9uID0gPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vblVwbG9hZEFsbENsaWNrfT5cbiAgICAgICAgICAgICAgICB7X3QoXCJVcGxvYWQgYWxsXCIpfVxuICAgICAgICAgICAgPC9idXR0b24+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT0nbXhfVXBsb2FkQ29uZmlybURpYWxvZydcbiAgICAgICAgICAgICAgICBmaXhlZFdpZHRoPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLl9vbkNhbmNlbENsaWNrfVxuICAgICAgICAgICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgICAgICAgICBjb250ZW50SWQ9J214X0RpYWxvZ19jb250ZW50J1xuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9J214X0RpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAge3ByZXZpZXd9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtfdCgnVXBsb2FkJyl9XG4gICAgICAgICAgICAgICAgICAgIGhhc0NhbmNlbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vblVwbG9hZENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHt1cGxvYWRBbGxCdXR0b259XG4gICAgICAgICAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==