"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

/*
Copyright 2017 Vector Creations Ltd

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
var _default = (0, _createReactClass.default)({
  displayName: 'CreateGroupDialog',
  propTypes: {
    onFinished: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      groupName: '',
      groupId: '',
      groupError: null,
      creating: false,
      createError: null
    };
  },
  _onGroupNameChange: function (e) {
    this.setState({
      groupName: e.target.value
    });
  },
  _onGroupIdChange: function (e) {
    this.setState({
      groupId: e.target.value
    });
  },
  _onGroupIdBlur: function (e) {
    this._checkGroupId();
  },
  _checkGroupId: function (e) {
    let error = null;

    if (!this.state.groupId) {
      error = (0, _languageHandler._t)("Community IDs cannot be empty.");
    } else if (!/^[a-z0-9=_\-./]*$/.test(this.state.groupId)) {
      error = (0, _languageHandler._t)("Community IDs may only contain characters a-z, 0-9, or '=_-./'");
    }

    this.setState({
      groupIdError: error,
      // Reset createError to get rid of now stale error message
      createError: null
    });
    return error;
  },
  _onFormSubmit: function (e) {
    e.preventDefault();
    if (this._checkGroupId()) return;
    const profile = {};

    if (this.state.groupName !== '') {
      profile.name = this.state.groupName;
    }

    this.setState({
      creating: true
    });

    _MatrixClientPeg.MatrixClientPeg.get().createGroup({
      localpart: this.state.groupId,
      profile: profile
    }).then(result => {
      _dispatcher.default.dispatch({
        action: 'view_group',
        group_id: result.group_id,
        group_is_new: true
      });

      this.props.onFinished(true);
    }).catch(e => {
      this.setState({
        createError: e
      });
    }).finally(() => {
      this.setState({
        creating: false
      });
    });
  },
  _onCancel: function () {
    this.props.onFinished(false);
  },
  render: function () {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const Spinner = sdk.getComponent('elements.Spinner');

    if (this.state.creating) {
      return /*#__PURE__*/_react.default.createElement(Spinner, null);
    }

    let createErrorNode;

    if (this.state.createError) {
      // XXX: We should catch errcodes and give sensible i18ned messages for them,
      // rather than displaying what the server gives us, but synapse doesn't give
      // any yet.
      createErrorNode = /*#__PURE__*/_react.default.createElement("div", {
        className: "error",
        role: "alert"
      }, /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('Something went wrong whilst creating your community')), /*#__PURE__*/_react.default.createElement("div", null, this.state.createError.message));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_CreateGroupDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Create Community')
    }, /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onFormSubmit
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateGroupDialog_inputRow"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateGroupDialog_label"
    }, /*#__PURE__*/_react.default.createElement("label", {
      htmlFor: "groupname"
    }, (0, _languageHandler._t)('Community Name'))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("input", {
      id: "groupname",
      className: "mx_CreateGroupDialog_input",
      autoFocus: true,
      size: "64",
      placeholder: (0, _languageHandler._t)('Example'),
      onChange: this._onGroupNameChange,
      value: this.state.groupName
    }))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateGroupDialog_inputRow"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateGroupDialog_label"
    }, /*#__PURE__*/_react.default.createElement("label", {
      htmlFor: "groupid"
    }, (0, _languageHandler._t)('Community ID'))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_CreateGroupDialog_input_group"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_CreateGroupDialog_prefix"
    }, "+"), /*#__PURE__*/_react.default.createElement("input", {
      id: "groupid",
      className: "mx_CreateGroupDialog_input mx_CreateGroupDialog_input_hasPrefixAndSuffix",
      size: "32",
      placeholder: (0, _languageHandler._t)('example'),
      onChange: this._onGroupIdChange,
      onBlur: this._onGroupIdBlur,
      value: this.state.groupId
    }), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_CreateGroupDialog_suffix"
    }, ":", _MatrixClientPeg.MatrixClientPeg.get().getDomain()))), /*#__PURE__*/_react.default.createElement("div", {
      className: "error"
    }, this.state.groupIdError), createErrorNode), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("input", {
      type: "submit",
      value: (0, _languageHandler._t)('Create'),
      className: "mx_Dialog_primary"
    }), /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._onCancel
    }, (0, _languageHandler._t)("Cancel")))));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ3JlYXRlR3JvdXBEaWFsb2cuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkZpbmlzaGVkIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJncm91cE5hbWUiLCJncm91cElkIiwiZ3JvdXBFcnJvciIsImNyZWF0aW5nIiwiY3JlYXRlRXJyb3IiLCJfb25Hcm91cE5hbWVDaGFuZ2UiLCJlIiwic2V0U3RhdGUiLCJ0YXJnZXQiLCJ2YWx1ZSIsIl9vbkdyb3VwSWRDaGFuZ2UiLCJfb25Hcm91cElkQmx1ciIsIl9jaGVja0dyb3VwSWQiLCJlcnJvciIsInN0YXRlIiwidGVzdCIsImdyb3VwSWRFcnJvciIsIl9vbkZvcm1TdWJtaXQiLCJwcmV2ZW50RGVmYXVsdCIsInByb2ZpbGUiLCJuYW1lIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiY3JlYXRlR3JvdXAiLCJsb2NhbHBhcnQiLCJ0aGVuIiwicmVzdWx0IiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJncm91cF9pZCIsImdyb3VwX2lzX25ldyIsInByb3BzIiwiY2F0Y2giLCJmaW5hbGx5IiwiX29uQ2FuY2VsIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIlNwaW5uZXIiLCJjcmVhdGVFcnJvck5vZGUiLCJtZXNzYWdlIiwiZ2V0RG9tYWluIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7OztlQXdCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxtQkFEZTtBQUU1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLFVBQVUsRUFBRUMsbUJBQVVDLElBQVYsQ0FBZUM7QUFEcEIsR0FGaUI7QUFNNUJD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LE9BQ00seUJBQUcsUUFBSCxDQUROLENBRkosQ0F2Q0osQ0FISixDQURKO0FBb0RIO0FBckoyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0NyZWF0ZUdyb3VwRGlhbG9nJyxcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdyb3VwTmFtZTogJycsXG4gICAgICAgICAgICBncm91cElkOiAnJyxcbiAgICAgICAgICAgIGdyb3VwRXJyb3I6IG51bGwsXG4gICAgICAgICAgICBjcmVhdGluZzogZmFsc2UsXG4gICAgICAgICAgICBjcmVhdGVFcnJvcjogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgX29uR3JvdXBOYW1lQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZ3JvdXBOYW1lOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9vbkdyb3VwSWRDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBncm91cElkOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9vbkdyb3VwSWRCbHVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuX2NoZWNrR3JvdXBJZCgpO1xuICAgIH0sXG5cbiAgICBfY2hlY2tHcm91cElkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5ncm91cElkKSB7XG4gICAgICAgICAgICBlcnJvciA9IF90KFwiQ29tbXVuaXR5IElEcyBjYW5ub3QgYmUgZW1wdHkuXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCEvXlthLXowLTk9X1xcLS4vXSokLy50ZXN0KHRoaXMuc3RhdGUuZ3JvdXBJZCkpIHtcbiAgICAgICAgICAgIGVycm9yID0gX3QoXCJDb21tdW5pdHkgSURzIG1heSBvbmx5IGNvbnRhaW4gY2hhcmFjdGVycyBhLXosIDAtOSwgb3IgJz1fLS4vJ1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGdyb3VwSWRFcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAvLyBSZXNldCBjcmVhdGVFcnJvciB0byBnZXQgcmlkIG9mIG5vdyBzdGFsZSBlcnJvciBtZXNzYWdlXG4gICAgICAgICAgICBjcmVhdGVFcnJvcjogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9LFxuXG4gICAgX29uRm9ybVN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrR3JvdXBJZCgpKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcHJvZmlsZSA9IHt9O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncm91cE5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICBwcm9maWxlLm5hbWUgPSB0aGlzLnN0YXRlLmdyb3VwTmFtZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtjcmVhdGluZzogdHJ1ZX0pO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlYXRlR3JvdXAoe1xuICAgICAgICAgICAgbG9jYWxwYXJ0OiB0aGlzLnN0YXRlLmdyb3VwSWQsXG4gICAgICAgICAgICBwcm9maWxlOiBwcm9maWxlLFxuICAgICAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndmlld19ncm91cCcsXG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IHJlc3VsdC5ncm91cF9pZCxcbiAgICAgICAgICAgICAgICBncm91cF9pc19uZXc6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCh0cnVlKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NyZWF0ZUVycm9yOiBlfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3JlYXRpbmc6IGZhbHNlfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25DYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIGNvbnN0IFNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcGlubmVyJyk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY3JlYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiA8U3Bpbm5lciAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjcmVhdGVFcnJvck5vZGU7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNyZWF0ZUVycm9yKSB7XG4gICAgICAgICAgICAvLyBYWFg6IFdlIHNob3VsZCBjYXRjaCBlcnJjb2RlcyBhbmQgZ2l2ZSBzZW5zaWJsZSBpMThuZWQgbWVzc2FnZXMgZm9yIHRoZW0sXG4gICAgICAgICAgICAvLyByYXRoZXIgdGhhbiBkaXNwbGF5aW5nIHdoYXQgdGhlIHNlcnZlciBnaXZlcyB1cywgYnV0IHN5bmFwc2UgZG9lc24ndCBnaXZlXG4gICAgICAgICAgICAvLyBhbnkgeWV0LlxuICAgICAgICAgICAgY3JlYXRlRXJyb3JOb2RlID0gPGRpdiBjbGFzc05hbWU9XCJlcnJvclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+eyBfdCgnU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2hpbHN0IGNyZWF0aW5nIHlvdXIgY29tbXVuaXR5JykgfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+eyB0aGlzLnN0YXRlLmNyZWF0ZUVycm9yLm1lc3NhZ2UgfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0NyZWF0ZUdyb3VwRGlhbG9nXCIgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtfdCgnQ3JlYXRlIENvbW11bml0eScpfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vbkZvcm1TdWJtaXR9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUdyb3VwRGlhbG9nX2lucHV0Um93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DcmVhdGVHcm91cERpYWxvZ19sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImdyb3VwbmFtZVwiPnsgX3QoJ0NvbW11bml0eSBOYW1lJykgfTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGlkPVwiZ3JvdXBuYW1lXCIgY2xhc3NOYW1lPVwibXhfQ3JlYXRlR3JvdXBEaWFsb2dfaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXt0cnVlfSBzaXplPVwiNjRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e190KCdFeGFtcGxlJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25Hcm91cE5hbWVDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5ncm91cE5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlR3JvdXBEaWFsb2dfaW5wdXRSb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NyZWF0ZUdyb3VwRGlhbG9nX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZ3JvdXBpZFwiPnsgX3QoJ0NvbW11bml0eSBJRCcpIH08L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfQ3JlYXRlR3JvdXBEaWFsb2dfaW5wdXRfZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfQ3JlYXRlR3JvdXBEaWFsb2dfcHJlZml4XCI+Kzwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGlkPVwiZ3JvdXBpZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9DcmVhdGVHcm91cERpYWxvZ19pbnB1dCBteF9DcmVhdGVHcm91cERpYWxvZ19pbnB1dF9oYXNQcmVmaXhBbmRTdWZmaXhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT1cIjMyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdCgnZXhhbXBsZScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uR3JvdXBJZENoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5fb25Hcm91cElkQmx1cn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmdyb3VwSWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0NyZWF0ZUdyb3VwRGlhbG9nX3N1ZmZpeFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOnsgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldERvbWFpbigpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImVycm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLmdyb3VwSWRFcnJvciB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgY3JlYXRlRXJyb3JOb2RlIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwic3VibWl0XCIgdmFsdWU9e190KCdDcmVhdGUnKX0gY2xhc3NOYW1lPVwibXhfRGlhbG9nX3ByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkNhbmNlbH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkNhbmNlbFwiKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==