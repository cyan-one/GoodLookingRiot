"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

var _languageHandler = require("../../../languageHandler");

var _Keyboard = require("../../../Keyboard");

/*
Copyright 2017 Vector Creations Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
class MenuOption extends _react.default.Component {
  constructor(props) {
    super(props);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  _onMouseEnter() {
    this.props.onMouseEnter(this.props.dropdownKey);
  }

  _onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onClick(this.props.dropdownKey);
  }

  render() {
    const optClasses = (0, _classnames.default)({
      mx_Dropdown_option: true,
      mx_Dropdown_option_highlight: this.props.highlighted
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      id: this.props.id,
      className: optClasses,
      onClick: this._onClick,
      onMouseEnter: this._onMouseEnter,
      role: "option",
      "aria-selected": this.props.highlighted,
      ref: this.props.inputRef
    }, this.props.children);
  }

}

(0, _defineProperty2.default)(MenuOption, "defaultProps", {
  disabled: false
});
MenuOption.propTypes = {
  children: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.node), _propTypes.default.node]),
  highlighted: _propTypes.default.bool,
  dropdownKey: _propTypes.default.string,
  onClick: _propTypes.default.func.isRequired,
  onMouseEnter: _propTypes.default.func.isRequired,
  inputRef: _propTypes.default.any
};
/*
 * Reusable dropdown select control, akin to react-select,
 * but somewhat simpler as react-select is 79KB of minified
 * javascript.
 *
 * TODO: Port NetworkDropdown to use this.
 */

class Dropdown extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onInputKeyDown", e => {
      let handled = true; // These keys don't generate keypress events and so needs to be on keyup

      switch (e.key) {
        case _Keyboard.Key.ENTER:
          this.props.onOptionChange(this.state.highlightedOption);
        // fallthrough

        case _Keyboard.Key.ESCAPE:
          this._close();

          break;

        case _Keyboard.Key.ARROW_DOWN:
          this.setState({
            highlightedOption: this._nextOption(this.state.highlightedOption)
          });
          break;

        case _Keyboard.Key.ARROW_UP:
          this.setState({
            highlightedOption: this._prevOption(this.state.highlightedOption)
          });
          break;

        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    this.dropdownRootElement = null;
    this.ignoreEvent = null;
    this._onInputClick = this._onInputClick.bind(this);
    this._onRootClick = this._onRootClick.bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onMenuOptionClick = this._onMenuOptionClick.bind(this);
    this._onInputChange = this._onInputChange.bind(this);
    this._collectRoot = this._collectRoot.bind(this);
    this._collectInputTextBox = this._collectInputTextBox.bind(this);
    this._setHighlightedOption = this._setHighlightedOption.bind(this);
    this.inputTextBox = null;

    this._reindexChildren(this.props.children);

    const firstChild = _react.default.Children.toArray(props.children)[0];

    this.state = {
      // True if the menu is dropped-down
      expanded: false,
      // The key of the highlighted option
      // (the option that would become selected if you pressed enter)
      highlightedOption: firstChild ? firstChild.key : null,
      // the current search query
      searchQuery: ''
    };
  } // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs


  UNSAFE_componentWillMount() {
    // eslint-disable-line camelcase
    this._button = (0, _react.createRef)(); // Listen for all clicks on the document so we can close the
    // menu when the user clicks somewhere else

    document.addEventListener('click', this._onDocumentClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._onDocumentClick, false);
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(nextProps) {
    // eslint-disable-line camelcase
    if (!nextProps.children || nextProps.children.length === 0) {
      return;
    }

    this._reindexChildren(nextProps.children);

    const firstChild = nextProps.children[0];
    this.setState({
      highlightedOption: firstChild ? firstChild.key : null
    });
  }

  _reindexChildren(children) {
    this.childrenByKey = {};

    _react.default.Children.forEach(children, child => {
      this.childrenByKey[child.key] = child;
    });
  }

  _onDocumentClick(ev) {
    // Close the dropdown if the user clicks anywhere that isn't
    // within our root element
    if (ev !== this.ignoreEvent) {
      this.setState({
        expanded: false
      });
    }
  }

  _onRootClick(ev) {
    // This captures any clicks that happen within our elements,
    // such that we can then ignore them when they're seen by the
    // click listener on the document handler, ie. not close the
    // dropdown immediately after opening it.
    // NB. We can't just stopPropagation() because then the event
    // doesn't reach the React onClick().
    this.ignoreEvent = ev;
  }

  _onInputClick(ev) {
    if (this.props.disabled) return;

    if (!this.state.expanded) {
      this.setState({
        expanded: true
      });
      ev.preventDefault();
    }
  }

  _close() {
    this.setState({
      expanded: false
    }); // their focus was on the input, its getting unmounted, move it to the button

    if (this._button.current) {
      this._button.current.focus();
    }
  }

  _onMenuOptionClick(dropdownKey) {
    this._close();

    this.props.onOptionChange(dropdownKey);
  }

  _onInputChange(e) {
    this.setState({
      searchQuery: e.target.value
    });

    if (this.props.onSearchChange) {
      this.props.onSearchChange(e.target.value);
    }
  }

  _collectRoot(e) {
    if (this.dropdownRootElement) {
      this.dropdownRootElement.removeEventListener('click', this._onRootClick, false);
    }

    if (e) {
      e.addEventListener('click', this._onRootClick, false);
    }

    this.dropdownRootElement = e;
  }

  _collectInputTextBox(e) {
    this.inputTextBox = e;
    if (e) e.focus();
  }

  _setHighlightedOption(optionKey) {
    this.setState({
      highlightedOption: optionKey
    });
  }

  _nextOption(optionKey) {
    const keys = Object.keys(this.childrenByKey);
    const index = keys.indexOf(optionKey);
    return keys[(index + 1) % keys.length];
  }

  _prevOption(optionKey) {
    const keys = Object.keys(this.childrenByKey);
    const index = keys.indexOf(optionKey);
    return keys[(index - 1) % keys.length];
  }

  _scrollIntoView(node) {
    if (node) {
      node.scrollIntoView({
        block: "nearest",
        behavior: "auto"
      });
    }
  }

  _getMenuOptions() {
    const options = _react.default.Children.map(this.props.children, child => {
      const highlighted = this.state.highlightedOption === child.key;
      return /*#__PURE__*/_react.default.createElement(MenuOption, {
        id: "".concat(this.props.id, "__").concat(child.key),
        key: child.key,
        dropdownKey: child.key,
        highlighted: highlighted,
        onMouseEnter: this._setHighlightedOption,
        onClick: this._onMenuOptionClick,
        inputRef: highlighted ? this._scrollIntoView : undefined
      }, child);
    });

    if (options.length === 0) {
      return [/*#__PURE__*/_react.default.createElement("div", {
        key: "0",
        className: "mx_Dropdown_option",
        role: "option"
      }, (0, _languageHandler._t)("No results"))];
    }

    return options;
  }

  render() {
    let currentValue;
    const menuStyle = {};
    if (this.props.menuWidth) menuStyle.width = this.props.menuWidth;
    let menu;

    if (this.state.expanded) {
      if (this.props.searchEnabled) {
        currentValue = /*#__PURE__*/_react.default.createElement("input", {
          type: "text",
          className: "mx_Dropdown_option",
          ref: this._collectInputTextBox,
          onKeyDown: this._onInputKeyDown,
          onChange: this._onInputChange,
          value: this.state.searchQuery,
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-activedescendant": "".concat(this.props.id, "__").concat(this.state.highlightedOption),
          "aria-owns": "".concat(this.props.id, "_listbox"),
          "aria-disabled": this.props.disabled,
          "aria-label": this.props.label
        });
      }

      menu = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dropdown_menu",
        style: menuStyle,
        role: "listbox",
        id: "".concat(this.props.id, "_listbox")
      }, this._getMenuOptions());
    }

    if (!currentValue) {
      const selectedChild = this.props.getShortOption ? this.props.getShortOption(this.props.value) : this.childrenByKey[this.props.value];
      currentValue = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dropdown_option",
        id: "".concat(this.props.id, "_value")
      }, selectedChild);
    }

    const dropdownClasses = {
      mx_Dropdown: true,
      mx_Dropdown_disabled: this.props.disabled
    };

    if (this.props.className) {
      dropdownClasses[this.props.className] = true;
    } // Note the menu sits inside the AccessibleButton div so it's anchored
    // to the input, but overflows below it. The root contains both.


    return /*#__PURE__*/_react.default.createElement("div", {
      className: (0, _classnames.default)(dropdownClasses),
      ref: this._collectRoot
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_Dropdown_input mx_no_textinput",
      onClick: this._onInputClick,
      "aria-haspopup": "listbox",
      "aria-expanded": this.state.expanded,
      disabled: this.props.disabled,
      inputRef: this._button,
      "aria-label": this.props.label,
      "aria-describedby": "".concat(this.props.id, "_value")
    }, currentValue, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Dropdown_arrow"
    }), menu));
  }

}

exports.default = Dropdown;
Dropdown.propTypes = {
  id: _propTypes.default.string.isRequired,
  // The width that the dropdown should be. If specified,
  // the dropped-down part of the menu will be set to this
  // width.
  menuWidth: _propTypes.default.number,
  // Called when the selected option changes
  onOptionChange: _propTypes.default.func.isRequired,
  // Called when the value of the search field changes
  onSearchChange: _propTypes.default.func,
  searchEnabled: _propTypes.default.bool,
  // Function that, given the key of an option, returns
  // a node representing that option to be displayed in the
  // box itself as the currently-selected option (ie. as
  // opposed to in the actual dropped-down part). If
  // unspecified, the appropriate child element is used as
  // in the dropped-down menu.
  getShortOption: _propTypes.default.func,
  value: _propTypes.default.string,
  // negative for consistency with HTML
  disabled: _propTypes.default.bool,
  // ARIA label
  label: _propTypes.default.string.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0Ryb3Bkb3duLmpzIl0sIm5hbWVzIjpbIk1lbnVPcHRpb24iLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfb25Nb3VzZUVudGVyIiwiYmluZCIsIl9vbkNsaWNrIiwib25Nb3VzZUVudGVyIiwiZHJvcGRvd25LZXkiLCJlIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJvbkNsaWNrIiwicmVuZGVyIiwib3B0Q2xhc3NlcyIsIm14X0Ryb3Bkb3duX29wdGlvbiIsIm14X0Ryb3Bkb3duX29wdGlvbl9oaWdobGlnaHQiLCJoaWdobGlnaHRlZCIsImlkIiwiaW5wdXRSZWYiLCJjaGlsZHJlbiIsImRpc2FibGVkIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib25lT2ZUeXBlIiwiYXJyYXlPZiIsIm5vZGUiLCJib29sIiwic3RyaW5nIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJhbnkiLCJEcm9wZG93biIsImhhbmRsZWQiLCJrZXkiLCJLZXkiLCJFTlRFUiIsIm9uT3B0aW9uQ2hhbmdlIiwic3RhdGUiLCJoaWdobGlnaHRlZE9wdGlvbiIsIkVTQ0FQRSIsIl9jbG9zZSIsIkFSUk9XX0RPV04iLCJzZXRTdGF0ZSIsIl9uZXh0T3B0aW9uIiwiQVJST1dfVVAiLCJfcHJldk9wdGlvbiIsImRyb3Bkb3duUm9vdEVsZW1lbnQiLCJpZ25vcmVFdmVudCIsIl9vbklucHV0Q2xpY2siLCJfb25Sb290Q2xpY2siLCJfb25Eb2N1bWVudENsaWNrIiwiX29uTWVudU9wdGlvbkNsaWNrIiwiX29uSW5wdXRDaGFuZ2UiLCJfY29sbGVjdFJvb3QiLCJfY29sbGVjdElucHV0VGV4dEJveCIsIl9zZXRIaWdobGlnaHRlZE9wdGlvbiIsImlucHV0VGV4dEJveCIsIl9yZWluZGV4Q2hpbGRyZW4iLCJmaXJzdENoaWxkIiwiQ2hpbGRyZW4iLCJ0b0FycmF5IiwiZXhwYW5kZWQiLCJzZWFyY2hRdWVyeSIsIlVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQiLCJfYnV0dG9uIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJuZXh0UHJvcHMiLCJsZW5ndGgiLCJjaGlsZHJlbkJ5S2V5IiwiZm9yRWFjaCIsImNoaWxkIiwiZXYiLCJjdXJyZW50IiwiZm9jdXMiLCJ0YXJnZXQiLCJ2YWx1ZSIsIm9uU2VhcmNoQ2hhbmdlIiwib3B0aW9uS2V5Iiwia2V5cyIsIk9iamVjdCIsImluZGV4IiwiaW5kZXhPZiIsIl9zY3JvbGxJbnRvVmlldyIsInNjcm9sbEludG9WaWV3IiwiYmxvY2siLCJiZWhhdmlvciIsIl9nZXRNZW51T3B0aW9ucyIsIm9wdGlvbnMiLCJtYXAiLCJ1bmRlZmluZWQiLCJjdXJyZW50VmFsdWUiLCJtZW51U3R5bGUiLCJtZW51V2lkdGgiLCJ3aWR0aCIsIm1lbnUiLCJzZWFyY2hFbmFibGVkIiwiX29uSW5wdXRLZXlEb3duIiwibGFiZWwiLCJzZWxlY3RlZENoaWxkIiwiZ2V0U2hvcnRPcHRpb24iLCJkcm9wZG93bkNsYXNzZXMiLCJteF9Ecm9wZG93biIsIm14X0Ryb3Bkb3duX2Rpc2FibGVkIiwiY2xhc3NOYW1lIiwibnVtYmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsTUFBTUEsVUFBTixTQUF5QkMsZUFBTUMsU0FBL0IsQ0FBeUM7QUFDckNDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQUNBLFNBQUtDLGFBQUwsR0FBcUIsS0FBS0EsYUFBTCxDQUFtQkMsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBckI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEtB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ZSxLQUFLWCxLQUFMLENBQVd3QixRQUo5QjtBQUtJLE1BQUEsUUFBUSxFQUFFLEtBQUszRCxLQUFMLENBQVdrQixRQUx6QjtBQU1JLE1BQUEsUUFBUSxFQUFFLEtBQUs0QyxPQU5uQjtBQU9JLG9CQUFZLEtBQUs5RCxLQUFMLENBQVdtRyxLQVAzQjtBQVFJLG9DQUFxQixLQUFLbkcsS0FBTCxDQUFXZSxFQUFoQztBQVJKLE9BVU02RSxZQVZOLGVBV0k7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixNQVhKLEVBWU1JLElBWk4sQ0FERyxDQUFQO0FBZ0JIOztBQS9SaUQ7OztBQWtTdERuRSxRQUFRLENBQUNWLFNBQVQsR0FBcUI7QUFDakJKLEVBQUFBLEVBQUUsRUFBRUssbUJBQVVLLE1BQVYsQ0FBaUJFLFVBREo7QUFFakI7QUFDQTtBQUNBO0FBQ0FtRSxFQUFBQSxTQUFTLEVBQUUxRSxtQkFBVXNGLE1BTEo7QUFNakI7QUFDQXhFLEVBQUFBLGNBQWMsRUFBRWQsbUJBQVVNLElBQVYsQ0FBZUMsVUFQZDtBQVFqQjtBQUNBbUQsRUFBQUEsY0FBYyxFQUFFMUQsbUJBQVVNLElBVFQ7QUFVakJ1RSxFQUFBQSxhQUFhLEVBQUU3RSxtQkFBVUksSUFWUjtBQVdqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTZFLEVBQUFBLGNBQWMsRUFBRWpGLG1CQUFVTSxJQWpCVDtBQWtCakJtRCxFQUFBQSxLQUFLLEVBQUV6RCxtQkFBVUssTUFsQkE7QUFtQmpCO0FBQ0FQLEVBQUFBLFFBQVEsRUFBRUUsbUJBQVVJLElBcEJIO0FBcUJqQjtBQUNBMkUsRUFBQUEsS0FBSyxFQUFFL0UsbUJBQVVLLE1BQVYsQ0FBaUJFO0FBdEJQLENBQXJCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tICcuL0FjY2Vzc2libGVCdXR0b24nO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHtLZXl9IGZyb20gXCIuLi8uLi8uLi9LZXlib2FyZFwiO1xuXG5jbGFzcyBNZW51T3B0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuX29uTW91c2VFbnRlciA9IHRoaXMuX29uTW91c2VFbnRlci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbkNsaWNrID0gdGhpcy5fb25DbGljay5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgX29uTW91c2VFbnRlcigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbk1vdXNlRW50ZXIodGhpcy5wcm9wcy5kcm9wZG93bktleSk7XG4gICAgfVxuXG4gICAgX29uQ2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMucHJvcHMub25DbGljayh0aGlzLnByb3BzLmRyb3Bkb3duS2V5KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IG9wdENsYXNzZXMgPSBjbGFzc25hbWVzKHtcbiAgICAgICAgICAgIG14X0Ryb3Bkb3duX29wdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIG14X0Ryb3Bkb3duX29wdGlvbl9oaWdobGlnaHQ6IHRoaXMucHJvcHMuaGlnaGxpZ2h0ZWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiA8ZGl2XG4gICAgICAgICAgICBpZD17dGhpcy5wcm9wcy5pZH1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17b3B0Q2xhc3Nlc31cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2t9XG4gICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuX29uTW91c2VFbnRlcn1cbiAgICAgICAgICAgIHJvbGU9XCJvcHRpb25cIlxuICAgICAgICAgICAgYXJpYS1zZWxlY3RlZD17dGhpcy5wcm9wcy5oaWdobGlnaHRlZH1cbiAgICAgICAgICAgIHJlZj17dGhpcy5wcm9wcy5pbnB1dFJlZn1cbiAgICAgICAgPlxuICAgICAgICAgICAgeyB0aGlzLnByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cblxuTWVudU9wdGlvbi5wcm9wVHlwZXMgPSB7XG4gICAgY2hpbGRyZW46IFByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLm5vZGUpLFxuICAgICAgUHJvcFR5cGVzLm5vZGUsXG4gICAgXSksXG4gICAgaGlnaGxpZ2h0ZWQ6IFByb3BUeXBlcy5ib29sLFxuICAgIGRyb3Bkb3duS2V5OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uQ2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgb25Nb3VzZUVudGVyOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIGlucHV0UmVmOiBQcm9wVHlwZXMuYW55LFxufTtcblxuLypcbiAqIFJldXNhYmxlIGRyb3Bkb3duIHNlbGVjdCBjb250cm9sLCBha2luIHRvIHJlYWN0LXNlbGVjdCxcbiAqIGJ1dCBzb21ld2hhdCBzaW1wbGVyIGFzIHJlYWN0LXNlbGVjdCBpcyA3OUtCIG9mIG1pbmlmaWVkXG4gKiBqYXZhc2NyaXB0LlxuICpcbiAqIFRPRE86IFBvcnQgTmV0d29ya0Ryb3Bkb3duIHRvIHVzZSB0aGlzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcm9wZG93biBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuZHJvcGRvd25Sb290RWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWdub3JlRXZlbnQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX29uSW5wdXRDbGljayA9IHRoaXMuX29uSW5wdXRDbGljay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vblJvb3RDbGljayA9IHRoaXMuX29uUm9vdENsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uRG9jdW1lbnRDbGljayA9IHRoaXMuX29uRG9jdW1lbnRDbGljay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbk1lbnVPcHRpb25DbGljayA9IHRoaXMuX29uTWVudU9wdGlvbkNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uSW5wdXRDaGFuZ2UgPSB0aGlzLl9vbklucHV0Q2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbGxlY3RSb290ID0gdGhpcy5fY29sbGVjdFJvb3QuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29sbGVjdElucHV0VGV4dEJveCA9IHRoaXMuX2NvbGxlY3RJbnB1dFRleHRCb3guYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fc2V0SGlnaGxpZ2h0ZWRPcHRpb24gPSB0aGlzLl9zZXRIaWdobGlnaHRlZE9wdGlvbi5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuaW5wdXRUZXh0Qm94ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9yZWluZGV4Q2hpbGRyZW4odGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICAgICAgY29uc3QgZmlyc3RDaGlsZCA9IFJlYWN0LkNoaWxkcmVuLnRvQXJyYXkocHJvcHMuY2hpbGRyZW4pWzBdO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICAvLyBUcnVlIGlmIHRoZSBtZW51IGlzIGRyb3BwZWQtZG93blxuICAgICAgICAgICAgZXhwYW5kZWQ6IGZhbHNlLFxuICAgICAgICAgICAgLy8gVGhlIGtleSBvZiB0aGUgaGlnaGxpZ2h0ZWQgb3B0aW9uXG4gICAgICAgICAgICAvLyAodGhlIG9wdGlvbiB0aGF0IHdvdWxkIGJlY29tZSBzZWxlY3RlZCBpZiB5b3UgcHJlc3NlZCBlbnRlcilcbiAgICAgICAgICAgIGhpZ2hsaWdodGVkT3B0aW9uOiBmaXJzdENoaWxkID8gZmlyc3RDaGlsZC5rZXkgOiBudWxsLFxuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgc2VhcmNoIHF1ZXJ5XG4gICAgICAgICAgICBzZWFyY2hRdWVyeTogJycsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2UgY29tcG9uZW50IHdpdGggcmVhbCBjbGFzcywgdXNlIGNvbnN0cnVjdG9yIGZvciByZWZzXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgICAgICAgdGhpcy5fYnV0dG9uID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIC8vIExpc3RlbiBmb3IgYWxsIGNsaWNrcyBvbiB0aGUgZG9jdW1lbnQgc28gd2UgY2FuIGNsb3NlIHRoZVxuICAgICAgICAvLyBtZW51IHdoZW4gdGhlIHVzZXIgY2xpY2tzIHNvbWV3aGVyZSBlbHNlXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25Eb2N1bWVudENsaWNrLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25Eb2N1bWVudENsaWNrLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgICAgICAgaWYgKCFuZXh0UHJvcHMuY2hpbGRyZW4gfHwgbmV4dFByb3BzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlaW5kZXhDaGlsZHJlbihuZXh0UHJvcHMuY2hpbGRyZW4pO1xuICAgICAgICBjb25zdCBmaXJzdENoaWxkID0gbmV4dFByb3BzLmNoaWxkcmVuWzBdO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGhpZ2hsaWdodGVkT3B0aW9uOiBmaXJzdENoaWxkID8gZmlyc3RDaGlsZC5rZXkgOiBudWxsLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfcmVpbmRleENoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW5CeUtleSA9IHt9O1xuICAgICAgICBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCAoY2hpbGQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5CeUtleVtjaGlsZC5rZXldID0gY2hpbGQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbkRvY3VtZW50Q2xpY2soZXYpIHtcbiAgICAgICAgLy8gQ2xvc2UgdGhlIGRyb3Bkb3duIGlmIHRoZSB1c2VyIGNsaWNrcyBhbnl3aGVyZSB0aGF0IGlzbid0XG4gICAgICAgIC8vIHdpdGhpbiBvdXIgcm9vdCBlbGVtZW50XG4gICAgICAgIGlmIChldiAhPT0gdGhpcy5pZ25vcmVFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWQ6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Sb290Q2xpY2soZXYpIHtcbiAgICAgICAgLy8gVGhpcyBjYXB0dXJlcyBhbnkgY2xpY2tzIHRoYXQgaGFwcGVuIHdpdGhpbiBvdXIgZWxlbWVudHMsXG4gICAgICAgIC8vIHN1Y2ggdGhhdCB3ZSBjYW4gdGhlbiBpZ25vcmUgdGhlbSB3aGVuIHRoZXkncmUgc2VlbiBieSB0aGVcbiAgICAgICAgLy8gY2xpY2sgbGlzdGVuZXIgb24gdGhlIGRvY3VtZW50IGhhbmRsZXIsIGllLiBub3QgY2xvc2UgdGhlXG4gICAgICAgIC8vIGRyb3Bkb3duIGltbWVkaWF0ZWx5IGFmdGVyIG9wZW5pbmcgaXQuXG4gICAgICAgIC8vIE5CLiBXZSBjYW4ndCBqdXN0IHN0b3BQcm9wYWdhdGlvbigpIGJlY2F1c2UgdGhlbiB0aGUgZXZlbnRcbiAgICAgICAgLy8gZG9lc24ndCByZWFjaCB0aGUgUmVhY3Qgb25DbGljaygpLlxuICAgICAgICB0aGlzLmlnbm9yZUV2ZW50ID0gZXY7XG4gICAgfVxuXG4gICAgX29uSW5wdXRDbGljayhldikge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWQ6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZXhwYW5kZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhlaXIgZm9jdXMgd2FzIG9uIHRoZSBpbnB1dCwgaXRzIGdldHRpbmcgdW5tb3VudGVkLCBtb3ZlIGl0IHRvIHRoZSBidXR0b25cbiAgICAgICAgaWYgKHRoaXMuX2J1dHRvbi5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9idXR0b24uY3VycmVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uTWVudU9wdGlvbkNsaWNrKGRyb3Bkb3duS2V5KSB7XG4gICAgICAgIHRoaXMuX2Nsb3NlKCk7XG4gICAgICAgIHRoaXMucHJvcHMub25PcHRpb25DaGFuZ2UoZHJvcGRvd25LZXkpO1xuICAgIH1cblxuICAgIF9vbklucHV0S2V5RG93biA9IChlKSA9PiB7XG4gICAgICAgIGxldCBoYW5kbGVkID0gdHJ1ZTtcblxuICAgICAgICAvLyBUaGVzZSBrZXlzIGRvbid0IGdlbmVyYXRlIGtleXByZXNzIGV2ZW50cyBhbmQgc28gbmVlZHMgdG8gYmUgb24ga2V5dXBcbiAgICAgICAgc3dpdGNoIChlLmtleSkge1xuICAgICAgICAgICAgY2FzZSBLZXkuRU5URVI6XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk9wdGlvbkNoYW5nZSh0aGlzLnN0YXRlLmhpZ2hsaWdodGVkT3B0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBmYWxsdGhyb3VnaFxuICAgICAgICAgICAgY2FzZSBLZXkuRVNDQVBFOlxuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEtleS5BUlJPV19ET1dOOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlZE9wdGlvbjogdGhpcy5fbmV4dE9wdGlvbih0aGlzLnN0YXRlLmhpZ2hsaWdodGVkT3B0aW9uKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgS2V5LkFSUk9XX1VQOlxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlZE9wdGlvbjogdGhpcy5fcHJldk9wdGlvbih0aGlzLnN0YXRlLmhpZ2hsaWdodGVkT3B0aW9uKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZWQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25JbnB1dENoYW5nZShlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc2VhcmNoUXVlcnk6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25TZWFyY2hDaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25TZWFyY2hDaGFuZ2UoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2NvbGxlY3RSb290KGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZHJvcGRvd25Sb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5kcm9wZG93blJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgJ2NsaWNrJywgdGhpcy5fb25Sb290Q2xpY2ssIGZhbHNlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uUm9vdENsaWNrLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcm9wZG93blJvb3RFbGVtZW50ID0gZTtcbiAgICB9XG5cbiAgICBfY29sbGVjdElucHV0VGV4dEJveChlKSB7XG4gICAgICAgIHRoaXMuaW5wdXRUZXh0Qm94ID0gZTtcbiAgICAgICAgaWYgKGUpIGUuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBfc2V0SGlnaGxpZ2h0ZWRPcHRpb24ob3B0aW9uS2V5KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaGlnaGxpZ2h0ZWRPcHRpb246IG9wdGlvbktleSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX25leHRPcHRpb24ob3B0aW9uS2V5KSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmNoaWxkcmVuQnlLZXkpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGtleXMuaW5kZXhPZihvcHRpb25LZXkpO1xuICAgICAgICByZXR1cm4ga2V5c1soaW5kZXggKyAxKSAlIGtleXMubGVuZ3RoXTtcbiAgICB9XG5cbiAgICBfcHJldk9wdGlvbihvcHRpb25LZXkpIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuY2hpbGRyZW5CeUtleSk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0ga2V5cy5pbmRleE9mKG9wdGlvbktleSk7XG4gICAgICAgIHJldHVybiBrZXlzWyhpbmRleCAtIDEpICUga2V5cy5sZW5ndGhdO1xuICAgIH1cblxuICAgIF9zY3JvbGxJbnRvVmlldyhub2RlKSB7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBub2RlLnNjcm9sbEludG9WaWV3KHtcbiAgICAgICAgICAgICAgICBibG9jazogXCJuZWFyZXN0XCIsXG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IFwiYXV0b1wiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZ2V0TWVudU9wdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWFjdC5DaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBoaWdobGlnaHRlZCA9IHRoaXMuc3RhdGUuaGlnaGxpZ2h0ZWRPcHRpb24gPT09IGNoaWxkLmtleTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPE1lbnVPcHRpb25cbiAgICAgICAgICAgICAgICAgICAgaWQ9e2Ake3RoaXMucHJvcHMuaWR9X18ke2NoaWxkLmtleX1gfVxuICAgICAgICAgICAgICAgICAgICBrZXk9e2NoaWxkLmtleX1cbiAgICAgICAgICAgICAgICAgICAgZHJvcGRvd25LZXk9e2NoaWxkLmtleX1cbiAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWQ9e2hpZ2hsaWdodGVkfVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuX3NldEhpZ2hsaWdodGVkT3B0aW9ufVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbk1lbnVPcHRpb25DbGlja31cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRSZWY9e2hpZ2hsaWdodGVkID8gdGhpcy5fc2Nyb2xsSW50b1ZpZXcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7IGNoaWxkIH1cbiAgICAgICAgICAgICAgICA8L01lbnVPcHRpb24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG9wdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gWzxkaXYga2V5PVwiMFwiIGNsYXNzTmFtZT1cIm14X0Ryb3Bkb3duX29wdGlvblwiIHJvbGU9XCJvcHRpb25cIj5cbiAgICAgICAgICAgICAgICB7IF90KFwiTm8gcmVzdWx0c1wiKSB9XG4gICAgICAgICAgICA8L2Rpdj5dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZTtcblxuICAgICAgICBjb25zdCBtZW51U3R5bGUgPSB7fTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubWVudVdpZHRoKSBtZW51U3R5bGUud2lkdGggPSB0aGlzLnByb3BzLm1lbnVXaWR0aDtcblxuICAgICAgICBsZXQgbWVudTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnNlYXJjaEVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfRHJvcGRvd25fb3B0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fY29sbGVjdElucHV0VGV4dEJveH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17dGhpcy5fb25JbnB1dEtleURvd259XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25JbnB1dENoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnNlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cImNvbWJvYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtYXV0b2NvbXBsZXRlPVwibGlzdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQ9e2Ake3RoaXMucHJvcHMuaWR9X18ke3RoaXMuc3RhdGUuaGlnaGxpZ2h0ZWRPcHRpb259YH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtb3ducz17YCR7dGhpcy5wcm9wcy5pZH1fbGlzdGJveGB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17dGhpcy5wcm9wcy5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVudSA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0Ryb3Bkb3duX21lbnVcIiBzdHlsZT17bWVudVN0eWxlfSByb2xlPVwibGlzdGJveFwiIGlkPXtgJHt0aGlzLnByb3BzLmlkfV9saXN0Ym94YH0+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5fZ2V0TWVudU9wdGlvbnMoKSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjdXJyZW50VmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkQ2hpbGQgPSB0aGlzLnByb3BzLmdldFNob3J0T3B0aW9uID9cbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmdldFNob3J0T3B0aW9uKHRoaXMucHJvcHMudmFsdWUpIDpcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuQnlLZXlbdGhpcy5wcm9wcy52YWx1ZV07XG4gICAgICAgICAgICBjdXJyZW50VmFsdWUgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0Ryb3Bkb3duX29wdGlvblwiIGlkPXtgJHt0aGlzLnByb3BzLmlkfV92YWx1ZWB9PlxuICAgICAgICAgICAgICAgIHsgc2VsZWN0ZWRDaGlsZCB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkcm9wZG93bkNsYXNzZXMgPSB7XG4gICAgICAgICAgICBteF9Ecm9wZG93bjogdHJ1ZSxcbiAgICAgICAgICAgIG14X0Ryb3Bkb3duX2Rpc2FibGVkOiB0aGlzLnByb3BzLmRpc2FibGVkLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGRyb3Bkb3duQ2xhc3Nlc1t0aGlzLnByb3BzLmNsYXNzTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90ZSB0aGUgbWVudSBzaXRzIGluc2lkZSB0aGUgQWNjZXNzaWJsZUJ1dHRvbiBkaXYgc28gaXQncyBhbmNob3JlZFxuICAgICAgICAvLyB0byB0aGUgaW5wdXQsIGJ1dCBvdmVyZmxvd3MgYmVsb3cgaXQuIFRoZSByb290IGNvbnRhaW5zIGJvdGguXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhkcm9wZG93bkNsYXNzZXMpfSByZWY9e3RoaXMuX2NvbGxlY3RSb290fT5cbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfRHJvcGRvd25faW5wdXQgbXhfbm9fdGV4dGlucHV0XCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbklucHV0Q2xpY2t9XG4gICAgICAgICAgICAgICAgYXJpYS1oYXNwb3B1cD1cImxpc3Rib3hcIlxuICAgICAgICAgICAgICAgIGFyaWEtZXhwYW5kZWQ9e3RoaXMuc3RhdGUuZXhwYW5kZWR9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZWR9XG4gICAgICAgICAgICAgICAgaW5wdXRSZWY9e3RoaXMuX2J1dHRvbn1cbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXt0aGlzLnByb3BzLmxhYmVsfVxuICAgICAgICAgICAgICAgIGFyaWEtZGVzY3JpYmVkYnk9e2Ake3RoaXMucHJvcHMuaWR9X3ZhbHVlYH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IGN1cnJlbnRWYWx1ZSB9XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRHJvcGRvd25fYXJyb3dcIiAvPlxuICAgICAgICAgICAgICAgIHsgbWVudSB9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG5cbkRyb3Bkb3duLnByb3BUeXBlcyA9IHtcbiAgICBpZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIC8vIFRoZSB3aWR0aCB0aGF0IHRoZSBkcm9wZG93biBzaG91bGQgYmUuIElmIHNwZWNpZmllZCxcbiAgICAvLyB0aGUgZHJvcHBlZC1kb3duIHBhcnQgb2YgdGhlIG1lbnUgd2lsbCBiZSBzZXQgdG8gdGhpc1xuICAgIC8vIHdpZHRoLlxuICAgIG1lbnVXaWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAvLyBDYWxsZWQgd2hlbiB0aGUgc2VsZWN0ZWQgb3B0aW9uIGNoYW5nZXNcbiAgICBvbk9wdGlvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBDYWxsZWQgd2hlbiB0aGUgdmFsdWUgb2YgdGhlIHNlYXJjaCBmaWVsZCBjaGFuZ2VzXG4gICAgb25TZWFyY2hDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICAgIHNlYXJjaEVuYWJsZWQ6IFByb3BUeXBlcy5ib29sLFxuICAgIC8vIEZ1bmN0aW9uIHRoYXQsIGdpdmVuIHRoZSBrZXkgb2YgYW4gb3B0aW9uLCByZXR1cm5zXG4gICAgLy8gYSBub2RlIHJlcHJlc2VudGluZyB0aGF0IG9wdGlvbiB0byBiZSBkaXNwbGF5ZWQgaW4gdGhlXG4gICAgLy8gYm94IGl0c2VsZiBhcyB0aGUgY3VycmVudGx5LXNlbGVjdGVkIG9wdGlvbiAoaWUuIGFzXG4gICAgLy8gb3Bwb3NlZCB0byBpbiB0aGUgYWN0dWFsIGRyb3BwZWQtZG93biBwYXJ0KS4gSWZcbiAgICAvLyB1bnNwZWNpZmllZCwgdGhlIGFwcHJvcHJpYXRlIGNoaWxkIGVsZW1lbnQgaXMgdXNlZCBhc1xuICAgIC8vIGluIHRoZSBkcm9wcGVkLWRvd24gbWVudS5cbiAgICBnZXRTaG9ydE9wdGlvbjogUHJvcFR5cGVzLmZ1bmMsXG4gICAgdmFsdWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgLy8gbmVnYXRpdmUgZm9yIGNvbnNpc3RlbmN5IHdpdGggSFRNTFxuICAgIGRpc2FibGVkOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAvLyBBUklBIGxhYmVsXG4gICAgbGFiZWw6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbn07XG4iXX0=