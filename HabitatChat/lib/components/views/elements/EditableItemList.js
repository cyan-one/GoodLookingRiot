"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EditableItem = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler.js");

var _Field = _interopRequireDefault(require("./Field"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

/*
Copyright 2017, 2019 New Vector Ltd.

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
class EditableItem extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_onRemove", e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        verifyRemove: true
      });
    });
    (0, _defineProperty2.default)(this, "_onDontRemove", e => {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        verifyRemove: false
      });
    });
    (0, _defineProperty2.default)(this, "_onActuallyRemove", e => {
      e.stopPropagation();
      e.preventDefault();
      if (this.props.onRemove) this.props.onRemove(this.props.index);
      this.setState({
        verifyRemove: false
      });
    });
    this.state = {
      verifyRemove: false
    };
  }

  render() {
    if (this.state.verifyRemove) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_EditableItem"
      }, /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_EditableItem_promptText"
      }, (0, _languageHandler._t)("Are you sure?")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onActuallyRemove,
        kind: "primary_sm",
        className: "mx_EditableItem_confirmBtn"
      }, (0, _languageHandler._t)("Yes")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onDontRemove,
        kind: "danger_sm",
        className: "mx_EditableItem_confirmBtn"
      }, (0, _languageHandler._t)("No")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EditableItem"
    }, /*#__PURE__*/_react.default.createElement("div", {
      onClick: this._onRemove,
      className: "mx_EditableItem_delete",
      title: (0, _languageHandler._t)("Remove"),
      role: "button"
    }), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EditableItem_item"
    }, this.props.value));
  }

}

exports.EditableItem = EditableItem;
(0, _defineProperty2.default)(EditableItem, "propTypes", {
  index: _propTypes.default.number,
  value: _propTypes.default.string,
  onRemove: _propTypes.default.func
});

class EditableItemList extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_onItemAdded", e => {
      e.stopPropagation();
      e.preventDefault();
      if (this.props.onItemAdded) this.props.onItemAdded(this.props.newItem);
    });
    (0, _defineProperty2.default)(this, "_onItemRemoved", index => {
      if (this.props.onItemRemoved) this.props.onItemRemoved(index);
    });
    (0, _defineProperty2.default)(this, "_onNewItemChanged", e => {
      if (this.props.onNewItemChanged) this.props.onNewItemChanged(e.target.value);
    });
  }

  _renderNewItemField() {
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onItemAdded,
      autoComplete: "off",
      noValidate: true,
      className: "mx_EditableItemList_newItem"
    }, /*#__PURE__*/_react.default.createElement(_Field.default, {
      label: this.props.placeholder,
      type: "text",
      autoComplete: "off",
      value: this.props.newItem || "",
      onChange: this._onNewItemChanged,
      list: this.props.suggestionsListId
    }), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onItemAdded,
      kind: "primary",
      type: "submit"
    }, (0, _languageHandler._t)("Add")));
  }

  render() {
    const editableItems = this.props.items.map((item, index) => {
      if (!this.props.canRemove) {
        return /*#__PURE__*/_react.default.createElement("li", {
          key: item
        }, item);
      }

      return /*#__PURE__*/_react.default.createElement(EditableItem, {
        key: item,
        index: index,
        value: item,
        onRemove: this._onItemRemoved
      });
    });
    const editableItemsSection = this.props.canRemove ? editableItems : /*#__PURE__*/_react.default.createElement("ul", null, editableItems);
    const label = this.props.items.length > 0 ? this.props.itemsLabel : this.props.noItemsLabel;
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EditableItemList"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EditableItemList_label"
    }, label), editableItemsSection, this.props.canEdit ? this._renderNewItemField() : /*#__PURE__*/_react.default.createElement("div", null));
  }

}

exports.default = EditableItemList;
(0, _defineProperty2.default)(EditableItemList, "propTypes", {
  id: _propTypes.default.string.isRequired,
  items: _propTypes.default.arrayOf(_propTypes.default.string).isRequired,
  itemsLabel: _propTypes.default.string,
  noItemsLabel: _propTypes.default.string,
  placeholder: _propTypes.default.string,
  newItem: _propTypes.default.string,
  onItemAdded: _propTypes.default.func,
  onItemRemoved: _propTypes.default.func,
  onNewItemChanged: _propTypes.default.func,
  canEdit: _propTypes.default.bool,
  canRemove: _propTypes.default.bool
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0VkaXRhYmxlSXRlbUxpc3QuanMiXSwibmFtZXMiOlsiRWRpdGFibGVJdGVtIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsImUiLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsInNldFN0YXRlIiwidmVyaWZ5UmVtb3ZlIiwicHJvcHMiLCJvblJlbW92ZSIsImluZGV4Iiwic3RhdGUiLCJyZW5kZXIiLCJfb25BY3R1YWxseVJlbW92ZSIsIl9vbkRvbnRSZW1vdmUiLCJfb25SZW1vdmUiLCJ2YWx1ZSIsIlByb3BUeXBlcyIsIm51bWJlciIsInN0cmluZyIsImZ1bmMiLCJFZGl0YWJsZUl0ZW1MaXN0Iiwib25JdGVtQWRkZWQiLCJuZXdJdGVtIiwib25JdGVtUmVtb3ZlZCIsIm9uTmV3SXRlbUNoYW5nZWQiLCJ0YXJnZXQiLCJfcmVuZGVyTmV3SXRlbUZpZWxkIiwiX29uSXRlbUFkZGVkIiwicGxhY2Vob2xkZXIiLCJfb25OZXdJdGVtQ2hhbmdlZCIsInN1Z2dlc3Rpb25zTGlzdElkIiwiZWRpdGFibGVJdGVtcyIsIml0ZW1zIiwibWFwIiwiaXRlbSIsImNhblJlbW92ZSIsIl9vbkl0ZW1SZW1vdmVkIiwiZWRpdGFibGVJdGVtc1NlY3Rpb24iLCJsYWJlbCIsImxlbmd0aCIsIml0ZW1zTGFiZWwiLCJub0l0ZW1zTGFiZWwiLCJjYW5FZGl0IiwiaWQiLCJpc1JlcXVpcmVkIiwiYXJyYXlPZiIsImJvb2wiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O0FBc0JPLE1BQU1BLFlBQU4sU0FBMkJDLGVBQU1DLFNBQWpDLENBQTJDO0FBTzlDQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLHFEQVFEQyxDQUFELElBQU87QUFDZkEsTUFBQUEsQ0FBQyxDQUFDQyxlQUFG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QVMsRUFBRW5CLG1CQUFVOEI7QUFiTixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3LCAyMDE5IE5ldyBWZWN0b3IgTHRkLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtfdH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyLmpzJztcbmltcG9ydCBGaWVsZCBmcm9tIFwiLi9GaWVsZFwiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4vQWNjZXNzaWJsZUJ1dHRvblwiO1xuXG5leHBvcnQgY2xhc3MgRWRpdGFibGVJdGVtIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBpbmRleDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgdmFsdWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIG9uUmVtb3ZlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHZlcmlmeVJlbW92ZTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgX29uUmVtb3ZlID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZlcmlmeVJlbW92ZTogdHJ1ZX0pO1xuICAgIH07XG5cbiAgICBfb25Eb250UmVtb3ZlID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZlcmlmeVJlbW92ZTogZmFsc2V9KTtcbiAgICB9O1xuXG4gICAgX29uQWN0dWFsbHlSZW1vdmUgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25SZW1vdmUpIHRoaXMucHJvcHMub25SZW1vdmUodGhpcy5wcm9wcy5pbmRleCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZlcmlmeVJlbW92ZTogZmFsc2V9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZXJpZnlSZW1vdmUpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FZGl0YWJsZUl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRWRpdGFibGVJdGVtX3Byb21wdFRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkFyZSB5b3Ugc3VyZT9cIil9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25BY3R1YWxseVJlbW92ZX0ga2luZD1cInByaW1hcnlfc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9FZGl0YWJsZUl0ZW1fY29uZmlybUJ0blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KFwiWWVzXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uRG9udFJlbW92ZX0ga2luZD1cImRhbmdlcl9zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0VkaXRhYmxlSXRlbV9jb25maXJtQnRuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJOb1wiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0VkaXRhYmxlSXRlbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgb25DbGljaz17dGhpcy5fb25SZW1vdmV9IGNsYXNzTmFtZT1cIm14X0VkaXRhYmxlSXRlbV9kZWxldGVcIiB0aXRsZT17X3QoXCJSZW1vdmVcIil9IHJvbGU9XCJidXR0b25cIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0VkaXRhYmxlSXRlbV9pdGVtXCI+e3RoaXMucHJvcHMudmFsdWV9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFZGl0YWJsZUl0ZW1MaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBpZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBpdGVtczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZykuaXNSZXF1aXJlZCxcbiAgICAgICAgaXRlbXNMYWJlbDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgbm9JdGVtc0xhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBwbGFjZWhvbGRlcjogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgbmV3SXRlbTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICBvbkl0ZW1BZGRlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG9uSXRlbVJlbW92ZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBvbk5ld0l0ZW1DaGFuZ2VkOiBQcm9wVHlwZXMuZnVuYyxcblxuICAgICAgICBjYW5FZGl0OiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgY2FuUmVtb3ZlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICB9O1xuXG4gICAgX29uSXRlbUFkZGVkID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uSXRlbUFkZGVkKSB0aGlzLnByb3BzLm9uSXRlbUFkZGVkKHRoaXMucHJvcHMubmV3SXRlbSk7XG4gICAgfTtcblxuICAgIF9vbkl0ZW1SZW1vdmVkID0gKGluZGV4KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uSXRlbVJlbW92ZWQpIHRoaXMucHJvcHMub25JdGVtUmVtb3ZlZChpbmRleCk7XG4gICAgfTtcblxuICAgIF9vbk5ld0l0ZW1DaGFuZ2VkID0gKGUpID0+IHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25OZXdJdGVtQ2hhbmdlZCkgdGhpcy5wcm9wcy5vbk5ld0l0ZW1DaGFuZ2VkKGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9O1xuXG4gICAgX3JlbmRlck5ld0l0ZW1GaWVsZCgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9vbkl0ZW1BZGRlZH0gYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgICAgIG5vVmFsaWRhdGU9e3RydWV9IGNsYXNzTmFtZT1cIm14X0VkaXRhYmxlSXRlbUxpc3RfbmV3SXRlbVwiPlxuICAgICAgICAgICAgICAgIDxGaWVsZCBsYWJlbD17dGhpcy5wcm9wcy5wbGFjZWhvbGRlcn0gdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIiB2YWx1ZT17dGhpcy5wcm9wcy5uZXdJdGVtIHx8IFwiXCJ9IG9uQ2hhbmdlPXt0aGlzLl9vbk5ld0l0ZW1DaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICAgICBsaXN0PXt0aGlzLnByb3BzLnN1Z2dlc3Rpb25zTGlzdElkfSAvPlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX29uSXRlbUFkZGVkfSBraW5kPVwicHJpbWFyeVwiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgICAgICAgICAgICAge190KFwiQWRkXCIpfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGVkaXRhYmxlSXRlbXMgPSB0aGlzLnByb3BzLml0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5wcm9wcy5jYW5SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPGxpIGtleT17aXRlbX0+e2l0ZW19PC9saT47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiA8RWRpdGFibGVJdGVtXG4gICAgICAgICAgICAgICAga2V5PXtpdGVtfVxuICAgICAgICAgICAgICAgIGluZGV4PXtpbmRleH1cbiAgICAgICAgICAgICAgICB2YWx1ZT17aXRlbX1cbiAgICAgICAgICAgICAgICBvblJlbW92ZT17dGhpcy5fb25JdGVtUmVtb3ZlZH1cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBlZGl0YWJsZUl0ZW1zU2VjdGlvbiA9IHRoaXMucHJvcHMuY2FuUmVtb3ZlID8gZWRpdGFibGVJdGVtcyA6IDx1bD57ZWRpdGFibGVJdGVtc308L3VsPjtcbiAgICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLnByb3BzLml0ZW1zLmxlbmd0aCA+IDAgPyB0aGlzLnByb3BzLml0ZW1zTGFiZWwgOiB0aGlzLnByb3BzLm5vSXRlbXNMYWJlbDtcblxuICAgICAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lPVwibXhfRWRpdGFibGVJdGVtTGlzdFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9FZGl0YWJsZUl0ZW1MaXN0X2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgeyBsYWJlbCB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHsgZWRpdGFibGVJdGVtc1NlY3Rpb24gfVxuICAgICAgICAgICAgeyB0aGlzLnByb3BzLmNhbkVkaXQgPyB0aGlzLl9yZW5kZXJOZXdJdGVtRmllbGQoKSA6IDxkaXYgLz4gfVxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cbn1cbiJdfQ==