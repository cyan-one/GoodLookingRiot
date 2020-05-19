"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _reactFocusLock = _interopRequireDefault(require("react-focus-lock"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _Keyboard = require("../../../Keyboard");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

/*
Copyright 2017 Vector Creations Ltd
Copyright 2018, 2019 New Vector Ltd
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

/**
 * Basic container for modal dialogs.
 *
 * Includes a div for the title, and a keypress handler which cancels the
 * dialog on escape.
 */
var _default = (0, _createReactClass.default)({
  displayName: 'BaseDialog',
  propTypes: {
    // onFinished callback to call when Escape is pressed
    // Take a boolean which is true if the dialog was dismissed
    // with a positive / confirm action or false if it was
    // cancelled (BaseDialog itself only calls this with false).
    onFinished: _propTypes.default.func.isRequired,
    // Whether the dialog should have a 'close' button that will
    // cause the dialog to be cancelled. This should only be set
    // to false if there is nothing the app can sensibly do if the
    // dialog is cancelled, eg. "We can't restore your session and
    // the app cannot work". Default: true.
    hasCancel: _propTypes.default.bool,
    // called when a key is pressed
    onKeyDown: _propTypes.default.func,
    // CSS class to apply to dialog div
    className: _propTypes.default.string,
    // if true, dialog container is 60% of the viewport width. Otherwise,
    // the container will have no fixed size, allowing its contents to
    // determine its size. Default: true.
    fixedWidth: _propTypes.default.bool,
    // Title for the dialog.
    title: _propTypes.default.node.isRequired,
    // Path to an icon to put in the header
    headerImage: _propTypes.default.string,
    // children should be the content of the dialog
    children: _propTypes.default.node,
    // Id of content element
    // If provided, this is used to add a aria-describedby attribute
    contentId: _propTypes.default.string,
    // optional additional class for the title element
    titleClass: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      hasCancel: true,
      fixedWidth: true
    };
  },

  // TODO: [REACT-WARNING] Move this to constructor
  UNSAFE_componentWillMount() {
    this._matrixClient = _MatrixClientPeg.MatrixClientPeg.get();
  },

  _onKeyDown: function (e) {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }

    if (this.props.hasCancel && e.key === _Keyboard.Key.ESCAPE) {
      e.stopPropagation();
      e.preventDefault();
      this.props.onFinished(false);
    }
  },
  _onCancelClick: function (e) {
    this.props.onFinished(false);
  },
  render: function () {
    let cancelButton;

    if (this.props.hasCancel) {
      cancelButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onCancelClick,
        className: "mx_Dialog_cancelButton",
        "aria-label": (0, _languageHandler._t)("Close dialog")
      });
    }

    let headerImage;

    if (this.props.headerImage) {
      headerImage = /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_Dialog_titleImage",
        src: this.props.headerImage,
        alt: ""
      });
    }

    return /*#__PURE__*/_react.default.createElement(_MatrixClientContext.default.Provider, {
      value: this._matrixClient
    }, /*#__PURE__*/_react.default.createElement(_reactFocusLock.default, {
      returnFocus: true,
      lockProps: {
        onKeyDown: this._onKeyDown,
        role: "dialog",
        ["aria-labelledby"]: "mx_BaseDialog_title",
        // This should point to a node describing the dialog.
        // If we were about to completely follow this recommendation we'd need to
        // make all the components relying on BaseDialog to be aware of it.
        // So instead we will use the whole content as the description.
        // Description comes first and if the content contains more text,
        // AT users can skip its presentation.
        ["aria-describedby"]: this.props.contentId
      },
      className: (0, _classnames.default)({
        [this.props.className]: true,
        'mx_Dialog_fixedWidth': this.props.fixedWidth
      })
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: (0, _classnames.default)('mx_Dialog_header', {
        'mx_Dialog_headerWithButton': !!this.props.headerButton
      })
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: (0, _classnames.default)('mx_Dialog_title', this.props.titleClass),
      id: "mx_BaseDialog_title"
    }, headerImage, this.props.title), this.props.headerButton, cancelButton), this.props.children));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQmFzZURpYWxvZy5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsIm9uRmluaXNoZWQiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCIsImhhc0NhbmNlbCIsImJvb2wiLCJvbktleURvd24iLCJjbGFzc05hbWUiLCJzdHJpbmciLCJmaXhlZFdpZHRoIiwidGl0bGUiLCJub2RlIiwiaGVhZGVySW1hZ2UiLCJjaGlsZHJlbiIsImNvbnRlbnRJZCIsInRpdGxlQ2xhc3MiLCJnZXREZWZhdWx0UHJvcHMiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwiX21hdHJpeENsaWVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIl9vbktleURvd24iLCJlIiwicHJvcHMiLCJrZXkiLCJLZXkiLCJFU0NBUEUiLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsIl9vbkNhbmNlbENsaWNrIiwicmVuZGVyIiwiY2FuY2VsQnV0dG9uIiwicm9sZSIsImhlYWRlckJ1dHRvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQTVCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBOzs7Ozs7ZUFNZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxZQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxJQUFBQSxVQUFVLEVBQUVDLG1CQUFVQyxJQUFWLENBQWVDLFVBTHBCO0FBT1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxJQUFBQSxTQUFTLEVBQUVILG1CQUFVSSxJQVpkO0FBY1A7QUFDQUMsSUFBQUEsU0FBUyxFQUFFTCxtQkFBVUMsSUFmZDtBQWlCUDtBQUNBSyxJQUFBQSxTQUFTLEVBQUVOLG1C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LENBQUMsQ0FBQyxLQUFLYyxLQUFMLENBQVdVO0FBREEsT0FBL0I7QUFBaEIsb0JBR0k7QUFBSyxNQUFBLFNBQVMsRUFBRSx5QkFBVyxpQkFBWCxFQUE4QixLQUFLVixLQUFMLENBQVdSLFVBQXpDLENBQWhCO0FBQXNFLE1BQUEsRUFBRSxFQUFDO0FBQXpFLE9BQ0tILFdBREwsRUFFTSxLQUFLVyxLQUFMLENBQVdiLEtBRmpCLENBSEosRUFPTSxLQUFLYSxLQUFMLENBQVdVLFlBUGpCLEVBUU1GLFlBUk4sQ0FuQkosRUE2Qk0sS0FBS1IsS0FBTCxDQUFXVixRQTdCakIsQ0FESixDQURKO0FBbUNIO0FBMUgyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCwgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBGb2N1c0xvY2sgZnJvbSAncmVhY3QtZm9jdXMtbG9jayc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmltcG9ydCB7IEtleSB9IGZyb20gJy4uLy4uLy4uL0tleWJvYXJkJztcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gJy4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b24nO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5cbi8qKlxuICogQmFzaWMgY29udGFpbmVyIGZvciBtb2RhbCBkaWFsb2dzLlxuICpcbiAqIEluY2x1ZGVzIGEgZGl2IGZvciB0aGUgdGl0bGUsIGFuZCBhIGtleXByZXNzIGhhbmRsZXIgd2hpY2ggY2FuY2VscyB0aGVcbiAqIGRpYWxvZyBvbiBlc2NhcGUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQmFzZURpYWxvZycsXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLy8gb25GaW5pc2hlZCBjYWxsYmFjayB0byBjYWxsIHdoZW4gRXNjYXBlIGlzIHByZXNzZWRcbiAgICAgICAgLy8gVGFrZSBhIGJvb2xlYW4gd2hpY2ggaXMgdHJ1ZSBpZiB0aGUgZGlhbG9nIHdhcyBkaXNtaXNzZWRcbiAgICAgICAgLy8gd2l0aCBhIHBvc2l0aXZlIC8gY29uZmlybSBhY3Rpb24gb3IgZmFsc2UgaWYgaXQgd2FzXG4gICAgICAgIC8vIGNhbmNlbGxlZCAoQmFzZURpYWxvZyBpdHNlbGYgb25seSBjYWxscyB0aGlzIHdpdGggZmFsc2UpLlxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIFdoZXRoZXIgdGhlIGRpYWxvZyBzaG91bGQgaGF2ZSBhICdjbG9zZScgYnV0dG9uIHRoYXQgd2lsbFxuICAgICAgICAvLyBjYXVzZSB0aGUgZGlhbG9nIHRvIGJlIGNhbmNlbGxlZC4gVGhpcyBzaG91bGQgb25seSBiZSBzZXRcbiAgICAgICAgLy8gdG8gZmFsc2UgaWYgdGhlcmUgaXMgbm90aGluZyB0aGUgYXBwIGNhbiBzZW5zaWJseSBkbyBpZiB0aGVcbiAgICAgICAgLy8gZGlhbG9nIGlzIGNhbmNlbGxlZCwgZWcuIFwiV2UgY2FuJ3QgcmVzdG9yZSB5b3VyIHNlc3Npb24gYW5kXG4gICAgICAgIC8vIHRoZSBhcHAgY2Fubm90IHdvcmtcIi4gRGVmYXVsdDogdHJ1ZS5cbiAgICAgICAgaGFzQ2FuY2VsOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBjYWxsZWQgd2hlbiBhIGtleSBpcyBwcmVzc2VkXG4gICAgICAgIG9uS2V5RG93bjogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgLy8gQ1NTIGNsYXNzIHRvIGFwcGx5IHRvIGRpYWxvZyBkaXZcbiAgICAgICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIGlmIHRydWUsIGRpYWxvZyBjb250YWluZXIgaXMgNjAlIG9mIHRoZSB2aWV3cG9ydCB3aWR0aC4gT3RoZXJ3aXNlLFxuICAgICAgICAvLyB0aGUgY29udGFpbmVyIHdpbGwgaGF2ZSBubyBmaXhlZCBzaXplLCBhbGxvd2luZyBpdHMgY29udGVudHMgdG9cbiAgICAgICAgLy8gZGV0ZXJtaW5lIGl0cyBzaXplLiBEZWZhdWx0OiB0cnVlLlxuICAgICAgICBmaXhlZFdpZHRoOiBQcm9wVHlwZXMuYm9vbCxcblxuICAgICAgICAvLyBUaXRsZSBmb3IgdGhlIGRpYWxvZy5cbiAgICAgICAgdGl0bGU6IFByb3BUeXBlcy5ub2RlLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gUGF0aCB0byBhbiBpY29uIHRvIHB1dCBpbiB0aGUgaGVhZGVyXG4gICAgICAgIGhlYWRlckltYWdlOiBQcm9wVHlwZXMuc3RyaW5nLFxuXG4gICAgICAgIC8vIGNoaWxkcmVuIHNob3VsZCBiZSB0aGUgY29udGVudCBvZiB0aGUgZGlhbG9nXG4gICAgICAgIGNoaWxkcmVuOiBQcm9wVHlwZXMubm9kZSxcblxuICAgICAgICAvLyBJZCBvZiBjb250ZW50IGVsZW1lbnRcbiAgICAgICAgLy8gSWYgcHJvdmlkZWQsIHRoaXMgaXMgdXNlZCB0byBhZGQgYSBhcmlhLWRlc2NyaWJlZGJ5IGF0dHJpYnV0ZVxuICAgICAgICBjb250ZW50SWQ6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gb3B0aW9uYWwgYWRkaXRpb25hbCBjbGFzcyBmb3IgdGhlIHRpdGxlIGVsZW1lbnRcbiAgICAgICAgdGl0bGVDbGFzczogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGhhc0NhbmNlbDogdHJ1ZSxcbiAgICAgICAgICAgIGZpeGVkV2lkdGg6IHRydWUsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBNb3ZlIHRoaXMgdG8gY29uc3RydWN0b3JcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICB0aGlzLl9tYXRyaXhDbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgfSxcblxuICAgIF9vbktleURvd246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25LZXlEb3duKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uS2V5RG93bihlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9wcy5oYXNDYW5jZWwgJiYgZS5rZXkgPT09IEtleS5FU0NBUEUpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkNhbmNlbENsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBjYW5jZWxCdXR0b247XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmhhc0NhbmNlbCkge1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uID0gKFxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uQ2FuY2VsQ2xpY2t9IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jYW5jZWxCdXR0b25cIiBhcmlhLWxhYmVsPXtfdChcIkNsb3NlIGRpYWxvZ1wiKX0gLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaGVhZGVySW1hZ2U7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmhlYWRlckltYWdlKSB7XG4gICAgICAgICAgICBoZWFkZXJJbWFnZSA9IDxpbWcgY2xhc3NOYW1lPVwibXhfRGlhbG9nX3RpdGxlSW1hZ2VcIiBzcmM9e3RoaXMucHJvcHMuaGVhZGVySW1hZ2V9XG4gICAgICAgICAgICAgICAgYWx0PVwiXCJcbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxNYXRyaXhDbGllbnRDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt0aGlzLl9tYXRyaXhDbGllbnR9PlxuICAgICAgICAgICAgICAgIDxGb2N1c0xvY2tcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuRm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIGxvY2tQcm9wcz17e1xuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duOiB0aGlzLl9vbktleURvd24sXG4gICAgICAgICAgICAgICAgICAgICAgICByb2xlOiBcImRpYWxvZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiYXJpYS1sYWJlbGxlZGJ5XCJdOiBcIm14X0Jhc2VEaWFsb2dfdGl0bGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIHBvaW50IHRvIGEgbm9kZSBkZXNjcmliaW5nIHRoZSBkaWFsb2cuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSB3ZXJlIGFib3V0IHRvIGNvbXBsZXRlbHkgZm9sbG93IHRoaXMgcmVjb21tZW5kYXRpb24gd2UnZCBuZWVkIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIGFsbCB0aGUgY29tcG9uZW50cyByZWx5aW5nIG9uIEJhc2VEaWFsb2cgdG8gYmUgYXdhcmUgb2YgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyBpbnN0ZWFkIHdlIHdpbGwgdXNlIHRoZSB3aG9sZSBjb250ZW50IGFzIHRoZSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlc2NyaXB0aW9uIGNvbWVzIGZpcnN0IGFuZCBpZiB0aGUgY29udGVudCBjb250YWlucyBtb3JlIHRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBVCB1c2VycyBjYW4gc2tpcCBpdHMgcHJlc2VudGF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiYXJpYS1kZXNjcmliZWRieVwiXTogdGhpcy5wcm9wcy5jb250ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBbdGhpcy5wcm9wcy5jbGFzc05hbWVdOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ214X0RpYWxvZ19maXhlZFdpZHRoJzogdGhpcy5wcm9wcy5maXhlZFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWVzKCdteF9EaWFsb2dfaGVhZGVyJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ214X0RpYWxvZ19oZWFkZXJXaXRoQnV0dG9uJzogISF0aGlzLnByb3BzLmhlYWRlckJ1dHRvbixcbiAgICAgICAgICAgICAgICAgICAgfSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZXMoJ214X0RpYWxvZ190aXRsZScsIHRoaXMucHJvcHMudGl0bGVDbGFzcyl9IGlkPSdteF9CYXNlRGlhbG9nX3RpdGxlJz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aGVhZGVySW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLnRpdGxlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLmhlYWRlckJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGNhbmNlbEJ1dHRvbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMucHJvcHMuY2hpbGRyZW4gfVxuICAgICAgICAgICAgICAgIDwvRm9jdXNMb2NrPlxuICAgICAgICAgICAgPC9NYXRyaXhDbGllbnRDb250ZXh0LlByb3ZpZGVyPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==