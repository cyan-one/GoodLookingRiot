"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMenu = createMenu;
exports.default = exports.useContextMenu = exports.aboveLeftOf = exports.toRightOf = exports.MenuItemRadio = exports.MenuItemCheckbox = exports.MenuGroup = exports.MenuItem = exports.ContextMenuButton = exports.ContextMenu = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _Keyboard = require("../../Keyboard");

var sdk = _interopRequireWildcard(require("../../index"));

var _AccessibleButton = _interopRequireDefault(require("../views/elements/AccessibleButton"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Shamelessly ripped off Modal.js.  There's probably a better way
// of doing reusable widgets like dialog boxes & menus where we go and
// pass in a custom control as the actual body.
const ContextualMenuContainerId = "mx_ContextualMenu_Container";

function getOrCreateContainer() {
  let container = document.getElementById(ContextualMenuContainerId);

  if (!container) {
    container = document.createElement("div");
    container.id = ContextualMenuContainerId;
    document.body.appendChild(container);
  }

  return container;
}

const ARIA_MENU_ITEM_ROLES = new Set(["menuitem", "menuitemcheckbox", "menuitemradio"]); // Generic ContextMenu Portal wrapper
// all options inside the menu should be of role=menuitem/menuitemcheckbox/menuitemradiobutton and have tabIndex={-1}
// this will allow the ContextMenu to manage its own focus using arrow keys as per the ARIA guidelines.

class ContextMenu extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "collectContextMenuRect", element => {
      // We don't need to clean up when unmounting, so ignore
      if (!element) return;
      let first = element.querySelector('[role^="menuitem"]');

      if (!first) {
        first = element.querySelector('[tab-index]');
      }

      if (first) {
        first.focus();
      }

      this.setState({
        contextMenuElem: element
      });
    });
    (0, _defineProperty2.default)(this, "onContextMenu", e => {
      if (this.props.onFinished) {
        this.props.onFinished();
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY; // XXX: This isn't pretty but the only way to allow opening a different context menu on right click whilst
        // a context menu and its click-guard are up without completely rewriting how the context menus work.

        setImmediate(() => {
          const clickEvent = document.createEvent('MouseEvents');
          clickEvent.initMouseEvent('contextmenu', true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
          document.elementFromPoint(x, y).dispatchEvent(clickEvent);
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onMoveFocus", (element, up) => {
      let descending = false; // are we currently descending or ascending through the DOM tree?

      do {
        const child = up ? element.lastElementChild : element.firstElementChild;
        const sibling = up ? element.previousElementSibling : element.nextElementSibling;

        if (descending) {
          if (child) {
            element = child;
          } else if (sibling) {
            element = sibling;
          } else {
            descending = false;
            element = element.parentElement;
          }
        } else {
          if (sibling) {
            element = sibling;
            descending = true;
          } else {
            element = element.parentElement;
          }
        }

        if (element) {
          if (element.classList.contains("mx_ContextualMenu")) {
            // we hit the top
            element = up ? element.lastElementChild : element.firstElementChild;
            descending = true;
          }
        }
      } while (element && !ARIA_MENU_ITEM_ROLES.has(element.getAttribute("role")));

      if (element) {
        element.focus();
      }
    });
    (0, _defineProperty2.default)(this, "_onMoveFocusHomeEnd", (element, up) => {
      let results = element.querySelectorAll('[role^="menuitem"]');

      if (!results) {
        results = element.querySelectorAll('[tab-index]');
      }

      if (results && results.length) {
        if (up) {
          results[0].focus();
        } else {
          results[results.length - 1].focus();
        }
      }
    });
    (0, _defineProperty2.default)(this, "_onKeyDown", ev => {
      if (!this.props.managed) {
        if (ev.key === _Keyboard.Key.ESCAPE) {
          this.props.onFinished();
          ev.stopPropagation();
          ev.preventDefault();
        }

        return;
      }

      let handled = true;

      switch (ev.key) {
        case _Keyboard.Key.TAB:
        case _Keyboard.Key.ESCAPE:
          this.props.onFinished();
          break;

        case _Keyboard.Key.ARROW_UP:
          this._onMoveFocus(ev.target, true);

          break;

        case _Keyboard.Key.ARROW_DOWN:
          this._onMoveFocus(ev.target, false);

          break;

        case _Keyboard.Key.HOME:
          this._onMoveFocusHomeEnd(this.state.contextMenuElem, true);

          break;

        case _Keyboard.Key.END:
          this._onMoveFocusHomeEnd(this.state.contextMenuElem, false);

          break;

        default:
          handled = false;
      }

      if (handled) {
        // consume all other keys in context menu
        ev.stopPropagation();
        ev.preventDefault();
      }
    });
    this.state = {
      contextMenuElem: null
    }; // persist what had focus when we got initialized so we can return it after

    this.initialFocus = document.activeElement;
  }

  componentWillUnmount() {
    // return focus to the thing which had it before us
    this.initialFocus.focus();
  }

  renderMenu(hasBackground = this.props.hasBackground) {
    const position = {};
    let chevronFace = null;
    const props = this.props;

    if (props.top) {
      position.top = props.top;
    } else {
      position.bottom = props.bottom;
    }

    if (props.left) {
      position.left = props.left;
      chevronFace = 'left';
    } else {
      position.right = props.right;
      chevronFace = 'right';
    }

    const contextMenuRect = this.state.contextMenuElem ? this.state.contextMenuElem.getBoundingClientRect() : null;
    const chevronOffset = {};

    if (props.chevronFace) {
      chevronFace = props.chevronFace;
    }

    const hasChevron = chevronFace && chevronFace !== "none";

    if (chevronFace === 'top' || chevronFace === 'bottom') {
      chevronOffset.left = props.chevronOffset;
    } else if (position.top !== undefined) {
      const target = position.top; // By default, no adjustment is made

      let adjusted = target; // If we know the dimensions of the context menu, adjust its position
      // such that it does not leave the (padded) window.

      if (contextMenuRect) {
        const padding = 10;
        adjusted = Math.min(position.top, document.body.clientHeight - contextMenuRect.height + padding);
      }

      position.top = adjusted;
      chevronOffset.top = Math.max(props.chevronOffset, props.chevronOffset + target - adjusted);
    }

    let chevron;

    if (hasChevron) {
      chevron = /*#__PURE__*/_react.default.createElement("div", {
        style: chevronOffset,
        className: "mx_ContextualMenu_chevron_" + chevronFace
      });
    }

    const menuClasses = (0, _classnames.default)({
      'mx_ContextualMenu': true,
      'mx_ContextualMenu_left': !hasChevron && position.left,
      'mx_ContextualMenu_right': !hasChevron && position.right,
      'mx_ContextualMenu_top': !hasChevron && position.top,
      'mx_ContextualMenu_bottom': !hasChevron && position.bottom,
      'mx_ContextualMenu_withChevron_left': chevronFace === 'left',
      'mx_ContextualMenu_withChevron_right': chevronFace === 'right',
      'mx_ContextualMenu_withChevron_top': chevronFace === 'top',
      'mx_ContextualMenu_withChevron_bottom': chevronFace === 'bottom'
    });
    const menuStyle = {};

    if (props.menuWidth) {
      menuStyle.width = props.menuWidth;
    }

    if (props.menuHeight) {
      menuStyle.height = props.menuHeight;
    }

    if (!isNaN(Number(props.menuPaddingTop))) {
      menuStyle["paddingTop"] = props.menuPaddingTop;
    }

    if (!isNaN(Number(props.menuPaddingLeft))) {
      menuStyle["paddingLeft"] = props.menuPaddingLeft;
    }

    if (!isNaN(Number(props.menuPaddingBottom))) {
      menuStyle["paddingBottom"] = props.menuPaddingBottom;
    }

    if (!isNaN(Number(props.menuPaddingRight))) {
      menuStyle["paddingRight"] = props.menuPaddingRight;
    }

    const wrapperStyle = {};

    if (!isNaN(Number(props.zIndex))) {
      menuStyle["zIndex"] = props.zIndex + 1;
      wrapperStyle["zIndex"] = props.zIndex;
    }

    let background;

    if (hasBackground) {
      background = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ContextualMenu_background",
        style: wrapperStyle,
        onClick: props.onFinished,
        onContextMenu: this.onContextMenu
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ContextualMenu_wrapper",
      style: _objectSpread({}, position, {}, wrapperStyle),
      onKeyDown: this._onKeyDown
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: menuClasses,
      style: menuStyle,
      ref: this.collectContextMenuRect,
      role: this.props.managed ? "menu" : undefined
    }, chevron, props.children), background);
  }

  render() {
    return _reactDom.default.createPortal(this.renderMenu(), getOrCreateContainer());
  }

} // Semantic component for representing the AccessibleButton which launches a <ContextMenu />


exports.ContextMenu = ContextMenu;
(0, _defineProperty2.default)(ContextMenu, "propTypes", {
  top: _propTypes.default.number,
  bottom: _propTypes.default.number,
  left: _propTypes.default.number,
  right: _propTypes.default.number,
  menuWidth: _propTypes.default.number,
  menuHeight: _propTypes.default.number,
  chevronOffset: _propTypes.default.number,
  chevronFace: _propTypes.default.string,
  // top, bottom, left, right or none
  // Function to be called on menu close
  onFinished: _propTypes.default.func.isRequired,
  menuPaddingTop: _propTypes.default.number,
  menuPaddingRight: _propTypes.default.number,
  menuPaddingBottom: _propTypes.default.number,
  menuPaddingLeft: _propTypes.default.number,
  zIndex: _propTypes.default.number,
  // If true, insert an invisible screen-sized element behind the
  // menu that when clicked will close it.
  hasBackground: _propTypes.default.bool,
  // on resize callback
  windowResize: _propTypes.default.func,
  managed: _propTypes.default.bool // whether this context menu should be focus managed. If false it must handle itself

});
(0, _defineProperty2.default)(ContextMenu, "defaultProps", {
  hasBackground: true,
  managed: true
});

const ContextMenuButton = (_ref) => {
  let {
    label,
    isExpanded,
    children
  } = _ref,
      props = (0, _objectWithoutProperties2.default)(_ref, ["label", "isExpanded", "children"]);
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
  return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
    title: label,
    "aria-label": label,
    "aria-haspopup": true,
    "aria-expanded": isExpanded
  }), children);
};

exports.ContextMenuButton = ContextMenuButton;
ContextMenuButton.propTypes = _objectSpread({}, _AccessibleButton.default.propTypes, {
  label: _propTypes.default.string,
  isExpanded: _propTypes.default.bool.isRequired // whether or not the context menu is currently open

}); // Semantic component for representing a role=menuitem

const MenuItem = (_ref2) => {
  let {
    children,
    label
  } = _ref2,
      props = (0, _objectWithoutProperties2.default)(_ref2, ["children", "label"]);
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
  return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
    role: "menuitem",
    tabIndex: -1,
    "aria-label": label
  }), children);
};

exports.MenuItem = MenuItem;
MenuItem.propTypes = _objectSpread({}, _AccessibleButton.default.propTypes, {
  label: _propTypes.default.string,
  // optional
  className: _propTypes.default.string,
  // optional
  onClick: _propTypes.default.func.isRequired
}); // Semantic component for representing a role=group for grouping menu radios/checkboxes

const MenuGroup = (_ref3) => {
  let {
    children,
    label
  } = _ref3,
      props = (0, _objectWithoutProperties2.default)(_ref3, ["children", "label"]);
  return /*#__PURE__*/_react.default.createElement("div", (0, _extends2.default)({}, props, {
    role: "group",
    "aria-label": label
  }), children);
};

exports.MenuGroup = MenuGroup;
MenuGroup.propTypes = {
  label: _propTypes.default.string.isRequired,
  className: _propTypes.default.string // optional

}; // Semantic component for representing a role=menuitemcheckbox

const MenuItemCheckbox = (_ref4) => {
  let {
    children,
    label,
    active = false,
    disabled = false
  } = _ref4,
      props = (0, _objectWithoutProperties2.default)(_ref4, ["children", "label", "active", "disabled"]);
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
  return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
    role: "menuitemcheckbox",
    "aria-checked": active,
    "aria-disabled": disabled,
    tabIndex: -1,
    "aria-label": label
  }), children);
};

exports.MenuItemCheckbox = MenuItemCheckbox;
MenuItemCheckbox.propTypes = _objectSpread({}, _AccessibleButton.default.propTypes, {
  label: _propTypes.default.string,
  // optional
  active: _propTypes.default.bool.isRequired,
  disabled: _propTypes.default.bool,
  // optional
  className: _propTypes.default.string,
  // optional
  onClick: _propTypes.default.func.isRequired
}); // Semantic component for representing a role=menuitemradio

const MenuItemRadio = (_ref5) => {
  let {
    children,
    label,
    active = false,
    disabled = false
  } = _ref5,
      props = (0, _objectWithoutProperties2.default)(_ref5, ["children", "label", "active", "disabled"]);
  const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
  return /*#__PURE__*/_react.default.createElement(AccessibleButton, (0, _extends2.default)({}, props, {
    role: "menuitemradio",
    "aria-checked": active,
    "aria-disabled": disabled,
    tabIndex: -1,
    "aria-label": label
  }), children);
};

exports.MenuItemRadio = MenuItemRadio;
MenuItemRadio.propTypes = _objectSpread({}, _AccessibleButton.default.propTypes, {
  label: _propTypes.default.string,
  // optional
  active: _propTypes.default.bool.isRequired,
  disabled: _propTypes.default.bool,
  // optional
  className: _propTypes.default.string,
  // optional
  onClick: _propTypes.default.func.isRequired
}); // Placement method for <ContextMenu /> to position context menu to right of elementRect with chevronOffset

const toRightOf = (elementRect, chevronOffset = 12) => {
  const left = elementRect.right + window.pageXOffset + 3;
  let top = elementRect.top + elementRect.height / 2 + window.pageYOffset;
  top -= chevronOffset + 8; // where 8 is half the height of the chevron

  return {
    left,
    top,
    chevronOffset
  };
}; // Placement method for <ContextMenu /> to position context menu right-aligned and flowing to the left of elementRect


exports.toRightOf = toRightOf;

const aboveLeftOf = (elementRect, chevronFace = "none") => {
  const menuOptions = {
    chevronFace
  };
  const buttonRight = elementRect.right + window.pageXOffset;
  const buttonBottom = elementRect.bottom + window.pageYOffset;
  const buttonTop = elementRect.top + window.pageYOffset; // Align the right edge of the menu to the right edge of the button

  menuOptions.right = window.innerWidth - buttonRight; // Align the menu vertically on whichever side of the button has more space available.

  if (buttonBottom < window.innerHeight / 2) {
    menuOptions.top = buttonBottom;
  } else {
    menuOptions.bottom = window.innerHeight - buttonTop;
  }

  return menuOptions;
};

exports.aboveLeftOf = aboveLeftOf;

const useContextMenu = () => {
  const button = (0, _react.useRef)(null);
  const [isOpen, setIsOpen] = (0, _react.useState)(false);

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return [isOpen, button, open, close, setIsOpen];
};

exports.useContextMenu = useContextMenu;

class LegacyContextMenu extends ContextMenu {
  render() {
    return this.renderMenu(false);
  }

} // XXX: Deprecated, used only for dynamic Tooltips. Avoid using at all costs.


exports.default = LegacyContextMenu;

function createMenu(ElementClass, props) {
  const onFinished = function (...args) {
    _reactDom.default.unmountComponentAtNode(getOrCreateContainer());

    if (props && props.onFinished) {
      props.onFinished.apply(null, args);
    }
  };

  const menu = /*#__PURE__*/_react.default.createElement(LegacyContextMenu, (0, _extends2.default)({}, props, {
    onFinished: onFinished // eslint-disable-line react/jsx-no-bind
    ,
    windowResize: onFinished // eslint-disable-line react/jsx-no-bind

  }), /*#__PURE__*/_react.default.createElement(ElementClass, (0, _extends2.default)({}, props, {
    onFinished: onFinished
  })));

  _reactDom.default.render(menu, getOrCreateContainer());

  return {
    close: onFinished
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvQ29udGV4dE1lbnUuanMiXSwibmFtZXMiOlsiQ29udGV4dHVhbE1lbnVDb250YWluZXJJZCIsImdldE9yQ3JlYXRlQ29udGFpbmVyIiwiY29udGFpbmVyIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNyZWF0ZUVsZW1lbnQiLCJpZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsIkFSSUFfTUVOVV9JVEVNX1JPTEVTIiwiU2V0IiwiQ29udGV4dE1lbnUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZWxlbWVudCIsImZpcnN0IiwicXVlcnlTZWxlY3RvciIsImZvY3VzIiwic2V0U3RhdGUiLCJjb250ZXh0TWVudUVsZW0iLCJlIiwicHJvcHMiLCJvbkZpbmlzaGVkIiwicHJldmVudERlZmF1bHQiLCJ4IiwiY2xpZW50WCIsInkiLCJjbGllbnRZIiwic2V0SW1tZWRpYXRlIiwiY2xpY2tFdmVudCIsImNyZWF0ZUV2ZW50IiwiaW5pdE1vdXNlRXZlbnQiLCJ3aW5kb3ciLCJlbGVtZW50RnJvbVBvaW50IiwiZGlzcGF0Y2hFdmVudCIsInVwIiwiZGVzY2VuZGluZyIsImNoaWxkIiwibGFzdEVsZW1lbnRDaGlsZCIsImZpcnN0RWxlbWVudENoaWxkIiwic2libGluZyIsInByZXZpb3VzRWxlbWVudFNpYmxpbmciLCJuZXh0RWxlbWVudFNpYmxpbmciLCJwYXJlbnRFbGVtZW50IiwiY2xhc3NMaXN0IiwiY29udGFpbnMiLCJoYXMiLCJnZXRBdHRyaWJ1dGUiLCJyZXN1bHRzIiwicXVlcnlTZWxlY3RvckFsbCIsImxlbmd0aCIsImV2IiwibWFuYWdlZCIsImtleSIsIktleSIsIkVTQ0FQRSIsInN0b3BQcm9wYWdhdGlvbiIsImhhbmRsZWQiLCJUQUIiLCJBUlJPV19VUCIsIl9vbk1vdmVGb2N1cyIsInRhcmdldCIsIkFSUk9XX0RPV04iLCJIT01FIiwiX29uTW92ZUZvY3VzSG9tZUVuZCIsInN0YXRlIiwiRU5EIiwiaW5pdGlhbEZvY3VzIiwiYWN0aXZlRWxlbWVudCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVuZGVyTWVudSIsImhhc0JhY2tncm91bmQiLCJwb3NpdGlvbiIsImNoZXZyb25GYWNlIiwidG9wIiwiYm90dG9tIiwibGVmdCIsInJpZ2h0IiwiY29udGV4dE1lbnVSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiY2hldnJvbk9mZnNldCIsImhhc0NoZXZyb24iLCJ1bmRlZmluZWQiLCJhZGp1c3RlZCIsInBhZGRpbmciLCJNYXRoIiwibWluIiwiY2xpZW50SGVpZ2h0IiwiaGVpZ2h0IiwibWF4IiwiY2hldnJvbiIsIm1lbnVDbGFzc2VzIiwibWVudVN0eWxlIiwibWVudVdpZHRoIiwid2lkdGgiLCJtZW51SGVpZ2h0IiwiaXNOYU4iLCJOdW1iZXIiLCJtZW51UGFkZGluZ1RvcCIsIm1lbnVQYWRkaW5nTGVmdCIsIm1lbnVQYWRkaW5nQm90dG9tIiwibWVudVBhZGRpbmdSaWdodCIsIndyYXBwZXJTdHlsZSIsInpJbmRleCIsImJhY2tncm91bmQiLCJvbkNvbnRleHRNZW51IiwiX29uS2V5RG93biIsImNvbGxlY3RDb250ZXh0TWVudVJlY3QiLCJjaGlsZHJlbiIsInJlbmRlciIsIlJlYWN0RE9NIiwiY3JlYXRlUG9ydGFsIiwiUHJvcFR5cGVzIiwibnVtYmVyIiwic3RyaW5nIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJib29sIiwid2luZG93UmVzaXplIiwiQ29udGV4dE1lbnVCdXR0b24iLCJsYWJlbCIsImlzRXhwYW5kZWQiLCJBY2Nlc3NpYmxlQnV0dG9uIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicHJvcFR5cGVzIiwiTWVudUl0ZW0iLCJjbGFzc05hbWUiLCJvbkNsaWNrIiwiTWVudUdyb3VwIiwiTWVudUl0ZW1DaGVja2JveCIsImFjdGl2ZSIsImRpc2FibGVkIiwiTWVudUl0ZW1SYWRpbyIsInRvUmlnaHRPZiIsImVsZW1lbnRSZWN0IiwicGFnZVhPZmZzZXQiLCJwYWdlWU9mZnNldCIsImFib3ZlTGVmdE9mIiwibWVudU9wdGlvbnMiLCJidXR0b25SaWdodCIsImJ1dHRvbkJvdHRvbSIsImJ1dHRvblRvcCIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsInVzZUNvbnRleHRNZW51IiwiYnV0dG9uIiwiaXNPcGVuIiwic2V0SXNPcGVuIiwib3BlbiIsImNsb3NlIiwiTGVnYWN5Q29udGV4dE1lbnUiLCJjcmVhdGVNZW51IiwiRWxlbWVudENsYXNzIiwiYXJncyIsInVubW91bnRDb21wb25lbnRBdE5vZGUiLCJhcHBseSIsIm1lbnUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBRUEsTUFBTUEseUJBQXlCLEdBQUcsNkJBQWxDOztBQUVBLFNBQVNDLG9CQUFULEdBQWdDO0FBQzVCLE1BQUlDLFNBQVMsR0FBR0MsUUFBUSxDQUFDQyxjQUFULENBQXdCSix5QkFBeEIsQ0FBaEI7O0FBRUEsTUFBSSxDQUFDRSxTQUFMLEVBQWdCO0FBQ1pBLElBQUFBLFNBQVMsR0FBR0MsUUFBUSxDQUFDRSxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQUgsSUFBQUEsU0FBUyxDQUFDSSxFQUFWLEdBQWVOLHlCQUFmO0FBQ0FHLElBQUFBLFFBQVEsQ0FBQ0ksSUFBVCxDQUFjQyxXQUFkLENBQTBCTixTQUExQjtBQUNIOztBQUVELFNBQU9BLFNBQVA7QUFDSDs7QUFFRCxNQUFNTyxvQkFBb0IsR0FBRyxJQUFJQyxHQUFKLENBQVEsQ0FBQyxVQUFELEVBQWEsa0JBQWIsRUFBaUMsZUFBakMsQ0FBUixDQUE3QixDLENBQ0E7QUFDQTtBQUNBOztBQUNPLE1BQU1DLFdBQU4sU0FBMEJDLGVBQU1DLFNBQWhDLENBQTBDO0FBaUM3Q0MsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSxrRUFlWUMsT0FBRCxJQUFhO0FBQ2xDO0FBQ0EsVUFBSSxDQUFDQSxP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LElBQWpCLEVBQXVCQyxLQUF2QixFQUE4QkYsU0FBOUIsQ0FBUDtBQUNILENBWE07Ozs7QUFhUSxNQUFNRyxpQkFBTixTQUFnQzdJLFdBQWhDLENBQTRDO0FBQ3ZEbUcsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsV0FBTyxLQUFLdkMsVUFBTCxDQUFnQixLQUFoQixDQUFQO0FBQ0g7O0FBSHNELEMsQ0FNM0Q7Ozs7O0FBQ08sU0FBU2tGLFVBQVQsQ0FBb0JDLFlBQXBCLEVBQWtDcEksS0FBbEMsRUFBeUM7QUFDNUMsUUFBTUMsVUFBVSxHQUFHLFVBQVMsR0FBR29JLElBQVosRUFBa0I7QUFDakM1QyxzQkFBUzZDLHNCQUFULENBQWdDM0osb0JBQW9CLEVBQXBEOztBQUVBLFFBQUlxQixLQUFLLElBQUlBLEtBQUssQ0FBQ0MsVUFBbkIsRUFBK0I7QUFDM0JELE1BQUFBLEtBQUssQ0FBQ0MsVUFBTixDQUFpQnNJLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCRixJQUE3QjtBQUNIO0FBQ0osR0FORDs7QUFRQSxRQUFNRyxJQUFJLGdCQUFHLDZCQUFDLGlCQUFELDZCQUNMeEksS0FESztBQUVULElBQUEsVUFBVSxFQUFFQyxVQUZILENBRWU7QUFGZjtBQUdULElBQUEsWUFBWSxFQUFFQSxVQUhMLENBR2lCOztBQUhqQixtQkFLVCw2QkFBQyxZQUFELDZCQUFrQkQsS0FBbEI7QUFBeUIsSUFBQSxVQUFVLEVBQUVDO0FBQXJDLEtBTFMsQ0FBYjs7QUFRQXdGLG9CQUFTRCxNQUFULENBQWdCZ0QsSUFBaEIsRUFBc0I3SixvQkFBb0IsRUFBMUM7O0FBRUEsU0FBTztBQUFDc0osSUFBQUEsS0FBSyxFQUFFaEk7QUFBUixHQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge3VzZVJlZiwgdXNlU3RhdGV9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IHtLZXl9IGZyb20gXCIuLi8uLi9LZXlib2FyZFwiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi9pbmRleFwiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uL3ZpZXdzL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcblxuLy8gU2hhbWVsZXNzbHkgcmlwcGVkIG9mZiBNb2RhbC5qcy4gIFRoZXJlJ3MgcHJvYmFibHkgYSBiZXR0ZXIgd2F5XG4vLyBvZiBkb2luZyByZXVzYWJsZSB3aWRnZXRzIGxpa2UgZGlhbG9nIGJveGVzICYgbWVudXMgd2hlcmUgd2UgZ28gYW5kXG4vLyBwYXNzIGluIGEgY3VzdG9tIGNvbnRyb2wgYXMgdGhlIGFjdHVhbCBib2R5LlxuXG5jb25zdCBDb250ZXh0dWFsTWVudUNvbnRhaW5lcklkID0gXCJteF9Db250ZXh0dWFsTWVudV9Db250YWluZXJcIjtcblxuZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXIoKSB7XG4gICAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKENvbnRleHR1YWxNZW51Q29udGFpbmVySWQpO1xuXG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY29udGFpbmVyLmlkID0gQ29udGV4dHVhbE1lbnVDb250YWluZXJJZDtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250YWluZXI7XG59XG5cbmNvbnN0IEFSSUFfTUVOVV9JVEVNX1JPTEVTID0gbmV3IFNldChbXCJtZW51aXRlbVwiLCBcIm1lbnVpdGVtY2hlY2tib3hcIiwgXCJtZW51aXRlbXJhZGlvXCJdKTtcbi8vIEdlbmVyaWMgQ29udGV4dE1lbnUgUG9ydGFsIHdyYXBwZXJcbi8vIGFsbCBvcHRpb25zIGluc2lkZSB0aGUgbWVudSBzaG91bGQgYmUgb2Ygcm9sZT1tZW51aXRlbS9tZW51aXRlbWNoZWNrYm94L21lbnVpdGVtcmFkaW9idXR0b24gYW5kIGhhdmUgdGFiSW5kZXg9ey0xfVxuLy8gdGhpcyB3aWxsIGFsbG93IHRoZSBDb250ZXh0TWVudSB0byBtYW5hZ2UgaXRzIG93biBmb2N1cyB1c2luZyBhcnJvdyBrZXlzIGFzIHBlciB0aGUgQVJJQSBndWlkZWxpbmVzLlxuZXhwb3J0IGNsYXNzIENvbnRleHRNZW51IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICB0b3A6IFByb3BUeXBlcy5udW1iZXIsXG4gICAgICAgIGJvdHRvbTogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgbGVmdDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgcmlnaHQ6IFByb3BUeXBlcy5udW1iZXIsXG4gICAgICAgIG1lbnVXaWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgbWVudUhlaWdodDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgY2hldnJvbk9mZnNldDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgY2hldnJvbkZhY2U6IFByb3BUeXBlcy5zdHJpbmcsIC8vIHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodCBvciBub25lXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBtZW51IGNsb3NlXG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG1lbnVQYWRkaW5nVG9wOiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICBtZW51UGFkZGluZ1JpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICBtZW51UGFkZGluZ0JvdHRvbTogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgbWVudVBhZGRpbmdMZWZ0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICB6SW5kZXg6IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgICAgICAgLy8gSWYgdHJ1ZSwgaW5zZXJ0IGFuIGludmlzaWJsZSBzY3JlZW4tc2l6ZWQgZWxlbWVudCBiZWhpbmQgdGhlXG4gICAgICAgIC8vIG1lbnUgdGhhdCB3aGVuIGNsaWNrZWQgd2lsbCBjbG9zZSBpdC5cbiAgICAgICAgaGFzQmFja2dyb3VuZDogUHJvcFR5cGVzLmJvb2wsXG5cbiAgICAgICAgLy8gb24gcmVzaXplIGNhbGxiYWNrXG4gICAgICAgIHdpbmRvd1Jlc2l6ZTogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAgICAgbWFuYWdlZDogUHJvcFR5cGVzLmJvb2wsIC8vIHdoZXRoZXIgdGhpcyBjb250ZXh0IG1lbnUgc2hvdWxkIGJlIGZvY3VzIG1hbmFnZWQuIElmIGZhbHNlIGl0IG11c3QgaGFuZGxlIGl0c2VsZlxuICAgIH07XG5cbiAgICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgICAgICBoYXNCYWNrZ3JvdW5kOiB0cnVlLFxuICAgICAgICBtYW5hZ2VkOiB0cnVlLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGNvbnRleHRNZW51RWxlbTogbnVsbCxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBwZXJzaXN0IHdoYXQgaGFkIGZvY3VzIHdoZW4gd2UgZ290IGluaXRpYWxpemVkIHNvIHdlIGNhbiByZXR1cm4gaXQgYWZ0ZXJcbiAgICAgICAgdGhpcy5pbml0aWFsRm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICAvLyByZXR1cm4gZm9jdXMgdG8gdGhlIHRoaW5nIHdoaWNoIGhhZCBpdCBiZWZvcmUgdXNcbiAgICAgICAgdGhpcy5pbml0aWFsRm9jdXMuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBjb2xsZWN0Q29udGV4dE1lbnVSZWN0ID0gKGVsZW1lbnQpID0+IHtcbiAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCB3aGVuIHVubW91bnRpbmcsIHNvIGlnbm9yZVxuICAgICAgICBpZiAoIWVsZW1lbnQpIHJldHVybjtcblxuICAgICAgICBsZXQgZmlyc3QgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tyb2xlXj1cIm1lbnVpdGVtXCJdJyk7XG4gICAgICAgIGlmICghZmlyc3QpIHtcbiAgICAgICAgICAgIGZpcnN0ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbdGFiLWluZGV4XScpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgZmlyc3QuZm9jdXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgY29udGV4dE1lbnVFbGVtOiBlbGVtZW50LFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgb25Db250ZXh0TWVudSA9IChlKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCB4ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgY29uc3QgeSA9IGUuY2xpZW50WTtcblxuICAgICAgICAgICAgLy8gWFhYOiBUaGlzIGlzbid0IHByZXR0eSBidXQgdGhlIG9ubHkgd2F5IHRvIGFsbG93IG9wZW5pbmcgYSBkaWZmZXJlbnQgY29udGV4dCBtZW51IG9uIHJpZ2h0IGNsaWNrIHdoaWxzdFxuICAgICAgICAgICAgLy8gYSBjb250ZXh0IG1lbnUgYW5kIGl0cyBjbGljay1ndWFyZCBhcmUgdXAgd2l0aG91dCBjb21wbGV0ZWx5IHJld3JpdGluZyBob3cgdGhlIGNvbnRleHQgbWVudXMgd29yay5cbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpY2tFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuICAgICAgICAgICAgICAgIGNsaWNrRXZlbnQuaW5pdE1vdXNlRXZlbnQoXG4gICAgICAgICAgICAgICAgICAgICdjb250ZXh0bWVudScsIHRydWUsIHRydWUsIHdpbmRvdywgMCxcbiAgICAgICAgICAgICAgICAgICAgMCwgMCwgeCwgeSwgZmFsc2UsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBmYWxzZSwgZmFsc2UsIDAsIG51bGwsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpLmRpc3BhdGNoRXZlbnQoY2xpY2tFdmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBfb25Nb3ZlRm9jdXMgPSAoZWxlbWVudCwgdXApID0+IHtcbiAgICAgICAgbGV0IGRlc2NlbmRpbmcgPSBmYWxzZTsgLy8gYXJlIHdlIGN1cnJlbnRseSBkZXNjZW5kaW5nIG9yIGFzY2VuZGluZyB0aHJvdWdoIHRoZSBET00gdHJlZT9cblxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IHVwID8gZWxlbWVudC5sYXN0RWxlbWVudENoaWxkIDogZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmcgPSB1cCA/IGVsZW1lbnQucHJldmlvdXNFbGVtZW50U2libGluZyA6IGVsZW1lbnQubmV4dEVsZW1lbnRTaWJsaW5nO1xuXG4gICAgICAgICAgICBpZiAoZGVzY2VuZGluZykge1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaWJsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzaWJsaW5nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc2NlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaWJsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBkZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJteF9Db250ZXh0dWFsTWVudVwiKSkgeyAvLyB3ZSBoaXQgdGhlIHRvcFxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gdXAgPyBlbGVtZW50Lmxhc3RFbGVtZW50Q2hpbGQgOiBlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBkZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKGVsZW1lbnQgJiYgIUFSSUFfTUVOVV9JVEVNX1JPTEVTLmhhcyhlbGVtZW50LmdldEF0dHJpYnV0ZShcInJvbGVcIikpKTtcblxuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vbk1vdmVGb2N1c0hvbWVFbmQgPSAoZWxlbWVudCwgdXApID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tyb2xlXj1cIm1lbnVpdGVtXCJdJyk7XG4gICAgICAgIGlmICghcmVzdWx0cykge1xuICAgICAgICAgICAgcmVzdWx0cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3RhYi1pbmRleF0nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHVwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1swXS5mb2N1cygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoIC0gMV0uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBfb25LZXlEb3duID0gKGV2KSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5tYW5hZ2VkKSB7XG4gICAgICAgICAgICBpZiAoZXYua2V5ID09PSBLZXkuRVNDQVBFKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYW5kbGVkID0gdHJ1ZTtcblxuICAgICAgICBzd2l0Y2ggKGV2LmtleSkge1xuICAgICAgICAgICAgY2FzZSBLZXkuVEFCOlxuICAgICAgICAgICAgY2FzZSBLZXkuRVNDQVBFOlxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBLZXkuQVJST1dfVVA6XG4gICAgICAgICAgICAgICAgdGhpcy5fb25Nb3ZlRm9jdXMoZXYudGFyZ2V0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgS2V5LkFSUk9XX0RPV046XG4gICAgICAgICAgICAgICAgdGhpcy5fb25Nb3ZlRm9jdXMoZXYudGFyZ2V0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEtleS5IT01FOlxuICAgICAgICAgICAgICAgIHRoaXMuX29uTW92ZUZvY3VzSG9tZUVuZCh0aGlzLnN0YXRlLmNvbnRleHRNZW51RWxlbSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEtleS5FTkQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fb25Nb3ZlRm9jdXNIb21lRW5kKHRoaXMuc3RhdGUuY29udGV4dE1lbnVFbGVtLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGhhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICAgICAgICAvLyBjb25zdW1lIGFsbCBvdGhlciBrZXlzIGluIGNvbnRleHQgbWVudVxuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJlbmRlck1lbnUoaGFzQmFja2dyb3VuZD10aGlzLnByb3BzLmhhc0JhY2tncm91bmQpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB7fTtcbiAgICAgICAgbGV0IGNoZXZyb25GYWNlID0gbnVsbDtcbiAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnByb3BzO1xuXG4gICAgICAgIGlmIChwcm9wcy50b3ApIHtcbiAgICAgICAgICAgIHBvc2l0aW9uLnRvcCA9IHByb3BzLnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc2l0aW9uLmJvdHRvbSA9IHByb3BzLmJvdHRvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcy5sZWZ0KSB7XG4gICAgICAgICAgICBwb3NpdGlvbi5sZWZ0ID0gcHJvcHMubGVmdDtcbiAgICAgICAgICAgIGNoZXZyb25GYWNlID0gJ2xlZnQnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9zaXRpb24ucmlnaHQgPSBwcm9wcy5yaWdodDtcbiAgICAgICAgICAgIGNoZXZyb25GYWNlID0gJ3JpZ2h0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRleHRNZW51UmVjdCA9IHRoaXMuc3RhdGUuY29udGV4dE1lbnVFbGVtID8gdGhpcy5zdGF0ZS5jb250ZXh0TWVudUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGNoZXZyb25PZmZzZXQgPSB7fTtcbiAgICAgICAgaWYgKHByb3BzLmNoZXZyb25GYWNlKSB7XG4gICAgICAgICAgICBjaGV2cm9uRmFjZSA9IHByb3BzLmNoZXZyb25GYWNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhhc0NoZXZyb24gPSBjaGV2cm9uRmFjZSAmJiBjaGV2cm9uRmFjZSAhPT0gXCJub25lXCI7XG5cbiAgICAgICAgaWYgKGNoZXZyb25GYWNlID09PSAndG9wJyB8fCBjaGV2cm9uRmFjZSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIGNoZXZyb25PZmZzZXQubGVmdCA9IHByb3BzLmNoZXZyb25PZmZzZXQ7XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24udG9wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHBvc2l0aW9uLnRvcDtcblxuICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCwgbm8gYWRqdXN0bWVudCBpcyBtYWRlXG4gICAgICAgICAgICBsZXQgYWRqdXN0ZWQgPSB0YXJnZXQ7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGtub3cgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGNvbnRleHQgbWVudSwgYWRqdXN0IGl0cyBwb3NpdGlvblxuICAgICAgICAgICAgLy8gc3VjaCB0aGF0IGl0IGRvZXMgbm90IGxlYXZlIHRoZSAocGFkZGVkKSB3aW5kb3cuXG4gICAgICAgICAgICBpZiAoY29udGV4dE1lbnVSZWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFkZGluZyA9IDEwO1xuICAgICAgICAgICAgICAgIGFkanVzdGVkID0gTWF0aC5taW4ocG9zaXRpb24udG9wLCBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAtIGNvbnRleHRNZW51UmVjdC5oZWlnaHQgKyBwYWRkaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zaXRpb24udG9wID0gYWRqdXN0ZWQ7XG4gICAgICAgICAgICBjaGV2cm9uT2Zmc2V0LnRvcCA9IE1hdGgubWF4KHByb3BzLmNoZXZyb25PZmZzZXQsIHByb3BzLmNoZXZyb25PZmZzZXQgKyB0YXJnZXQgLSBhZGp1c3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2hldnJvbjtcbiAgICAgICAgaWYgKGhhc0NoZXZyb24pIHtcbiAgICAgICAgICAgIGNoZXZyb24gPSA8ZGl2IHN0eWxlPXtjaGV2cm9uT2Zmc2V0fSBjbGFzc05hbWU9e1wibXhfQ29udGV4dHVhbE1lbnVfY2hldnJvbl9cIiArIGNoZXZyb25GYWNlfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lbnVDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAnbXhfQ29udGV4dHVhbE1lbnUnOiB0cnVlLFxuICAgICAgICAgICAgJ214X0NvbnRleHR1YWxNZW51X2xlZnQnOiAhaGFzQ2hldnJvbiAmJiBwb3NpdGlvbi5sZWZ0LFxuICAgICAgICAgICAgJ214X0NvbnRleHR1YWxNZW51X3JpZ2h0JzogIWhhc0NoZXZyb24gJiYgcG9zaXRpb24ucmlnaHQsXG4gICAgICAgICAgICAnbXhfQ29udGV4dHVhbE1lbnVfdG9wJzogIWhhc0NoZXZyb24gJiYgcG9zaXRpb24udG9wLFxuICAgICAgICAgICAgJ214X0NvbnRleHR1YWxNZW51X2JvdHRvbSc6ICFoYXNDaGV2cm9uICYmIHBvc2l0aW9uLmJvdHRvbSxcbiAgICAgICAgICAgICdteF9Db250ZXh0dWFsTWVudV93aXRoQ2hldnJvbl9sZWZ0JzogY2hldnJvbkZhY2UgPT09ICdsZWZ0JyxcbiAgICAgICAgICAgICdteF9Db250ZXh0dWFsTWVudV93aXRoQ2hldnJvbl9yaWdodCc6IGNoZXZyb25GYWNlID09PSAncmlnaHQnLFxuICAgICAgICAgICAgJ214X0NvbnRleHR1YWxNZW51X3dpdGhDaGV2cm9uX3RvcCc6IGNoZXZyb25GYWNlID09PSAndG9wJyxcbiAgICAgICAgICAgICdteF9Db250ZXh0dWFsTWVudV93aXRoQ2hldnJvbl9ib3R0b20nOiBjaGV2cm9uRmFjZSA9PT0gJ2JvdHRvbScsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1lbnVTdHlsZSA9IHt9O1xuICAgICAgICBpZiAocHJvcHMubWVudVdpZHRoKSB7XG4gICAgICAgICAgICBtZW51U3R5bGUud2lkdGggPSBwcm9wcy5tZW51V2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcHMubWVudUhlaWdodCkge1xuICAgICAgICAgICAgbWVudVN0eWxlLmhlaWdodCA9IHByb3BzLm1lbnVIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzTmFOKE51bWJlcihwcm9wcy5tZW51UGFkZGluZ1RvcCkpKSB7XG4gICAgICAgICAgICBtZW51U3R5bGVbXCJwYWRkaW5nVG9wXCJdID0gcHJvcHMubWVudVBhZGRpbmdUb3A7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc05hTihOdW1iZXIocHJvcHMubWVudVBhZGRpbmdMZWZ0KSkpIHtcbiAgICAgICAgICAgIG1lbnVTdHlsZVtcInBhZGRpbmdMZWZ0XCJdID0gcHJvcHMubWVudVBhZGRpbmdMZWZ0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNOYU4oTnVtYmVyKHByb3BzLm1lbnVQYWRkaW5nQm90dG9tKSkpIHtcbiAgICAgICAgICAgIG1lbnVTdHlsZVtcInBhZGRpbmdCb3R0b21cIl0gPSBwcm9wcy5tZW51UGFkZGluZ0JvdHRvbTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzTmFOKE51bWJlcihwcm9wcy5tZW51UGFkZGluZ1JpZ2h0KSkpIHtcbiAgICAgICAgICAgIG1lbnVTdHlsZVtcInBhZGRpbmdSaWdodFwiXSA9IHByb3BzLm1lbnVQYWRkaW5nUmlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3cmFwcGVyU3R5bGUgPSB7fTtcbiAgICAgICAgaWYgKCFpc05hTihOdW1iZXIocHJvcHMuekluZGV4KSkpIHtcbiAgICAgICAgICAgIG1lbnVTdHlsZVtcInpJbmRleFwiXSA9IHByb3BzLnpJbmRleCArIDE7XG4gICAgICAgICAgICB3cmFwcGVyU3R5bGVbXCJ6SW5kZXhcIl0gPSBwcm9wcy56SW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYmFja2dyb3VuZDtcbiAgICAgICAgaWYgKGhhc0JhY2tncm91bmQpIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Db250ZXh0dWFsTWVudV9iYWNrZ3JvdW5kXCIgc3R5bGU9e3dyYXBwZXJTdHlsZX0gb25DbGljaz17cHJvcHMub25GaW5pc2hlZH0gb25Db250ZXh0TWVudT17dGhpcy5vbkNvbnRleHRNZW51fSAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0NvbnRleHR1YWxNZW51X3dyYXBwZXJcIiBzdHlsZT17ey4uLnBvc2l0aW9uLCAuLi53cmFwcGVyU3R5bGV9fSBvbktleURvd249e3RoaXMuX29uS2V5RG93bn0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e21lbnVDbGFzc2VzfSBzdHlsZT17bWVudVN0eWxlfSByZWY9e3RoaXMuY29sbGVjdENvbnRleHRNZW51UmVjdH0gcm9sZT17dGhpcy5wcm9wcy5tYW5hZ2VkID8gXCJtZW51XCIgOiB1bmRlZmluZWR9PlxuICAgICAgICAgICAgICAgICAgICB7IGNoZXZyb24gfVxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IGJhY2tncm91bmQgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gUmVhY3RET00uY3JlYXRlUG9ydGFsKHRoaXMucmVuZGVyTWVudSgpLCBnZXRPckNyZWF0ZUNvbnRhaW5lcigpKTtcbiAgICB9XG59XG5cbi8vIFNlbWFudGljIGNvbXBvbmVudCBmb3IgcmVwcmVzZW50aW5nIHRoZSBBY2Nlc3NpYmxlQnV0dG9uIHdoaWNoIGxhdW5jaGVzIGEgPENvbnRleHRNZW51IC8+XG5leHBvcnQgY29uc3QgQ29udGV4dE1lbnVCdXR0b24gPSAoeyBsYWJlbCwgaXNFeHBhbmRlZCwgY2hpbGRyZW4sIC4uLnByb3BzIH0pID0+IHtcbiAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIHsuLi5wcm9wc30gdGl0bGU9e2xhYmVsfSBhcmlhLWxhYmVsPXtsYWJlbH0gYXJpYS1oYXNwb3B1cD17dHJ1ZX0gYXJpYS1leHBhbmRlZD17aXNFeHBhbmRlZH0+XG4gICAgICAgICAgICB7IGNoaWxkcmVuIH1cbiAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICk7XG59O1xuQ29udGV4dE1lbnVCdXR0b24ucHJvcFR5cGVzID0ge1xuICAgIC4uLkFjY2Vzc2libGVCdXR0b24ucHJvcFR5cGVzLFxuICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGlzRXhwYW5kZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsIC8vIHdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IG1lbnUgaXMgY3VycmVudGx5IG9wZW5cbn07XG5cbi8vIFNlbWFudGljIGNvbXBvbmVudCBmb3IgcmVwcmVzZW50aW5nIGEgcm9sZT1tZW51aXRlbVxuZXhwb3J0IGNvbnN0IE1lbnVJdGVtID0gKHtjaGlsZHJlbiwgbGFiZWwsIC4uLnByb3BzfSkgPT4ge1xuICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gey4uLnByb3BzfSByb2xlPVwibWVudWl0ZW1cIiB0YWJJbmRleD17LTF9IGFyaWEtbGFiZWw9e2xhYmVsfT5cbiAgICAgICAgICAgIHsgY2hpbGRyZW4gfVxuICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgKTtcbn07XG5NZW51SXRlbS5wcm9wVHlwZXMgPSB7XG4gICAgLi4uQWNjZXNzaWJsZUJ1dHRvbi5wcm9wVHlwZXMsXG4gICAgbGFiZWw6IFByb3BUeXBlcy5zdHJpbmcsIC8vIG9wdGlvbmFsXG4gICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLCAvLyBvcHRpb25hbFxuICAgIG9uQ2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG59O1xuXG4vLyBTZW1hbnRpYyBjb21wb25lbnQgZm9yIHJlcHJlc2VudGluZyBhIHJvbGU9Z3JvdXAgZm9yIGdyb3VwaW5nIG1lbnUgcmFkaW9zL2NoZWNrYm94ZXNcbmV4cG9ydCBjb25zdCBNZW51R3JvdXAgPSAoe2NoaWxkcmVuLCBsYWJlbCwgLi4ucHJvcHN9KSA9PiB7XG4gICAgcmV0dXJuIDxkaXYgey4uLnByb3BzfSByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPXtsYWJlbH0+XG4gICAgICAgIHsgY2hpbGRyZW4gfVxuICAgIDwvZGl2Pjtcbn07XG5NZW51R3JvdXAucHJvcFR5cGVzID0ge1xuICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLCAvLyBvcHRpb25hbFxufTtcblxuLy8gU2VtYW50aWMgY29tcG9uZW50IGZvciByZXByZXNlbnRpbmcgYSByb2xlPW1lbnVpdGVtY2hlY2tib3hcbmV4cG9ydCBjb25zdCBNZW51SXRlbUNoZWNrYm94ID0gKHtjaGlsZHJlbiwgbGFiZWwsIGFjdGl2ZT1mYWxzZSwgZGlzYWJsZWQ9ZmFsc2UsIC4uLnByb3BzfSkgPT4ge1xuICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gey4uLnByb3BzfSByb2xlPVwibWVudWl0ZW1jaGVja2JveFwiIGFyaWEtY2hlY2tlZD17YWN0aXZlfSBhcmlhLWRpc2FibGVkPXtkaXNhYmxlZH0gdGFiSW5kZXg9ey0xfSBhcmlhLWxhYmVsPXtsYWJlbH0+XG4gICAgICAgICAgICB7IGNoaWxkcmVuIH1cbiAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICk7XG59O1xuTWVudUl0ZW1DaGVja2JveC5wcm9wVHlwZXMgPSB7XG4gICAgLi4uQWNjZXNzaWJsZUJ1dHRvbi5wcm9wVHlwZXMsXG4gICAgbGFiZWw6IFByb3BUeXBlcy5zdHJpbmcsIC8vIG9wdGlvbmFsXG4gICAgYWN0aXZlOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIGRpc2FibGVkOiBQcm9wVHlwZXMuYm9vbCwgLy8gb3B0aW9uYWxcbiAgICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsIC8vIG9wdGlvbmFsXG4gICAgb25DbGljazogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbn07XG5cbi8vIFNlbWFudGljIGNvbXBvbmVudCBmb3IgcmVwcmVzZW50aW5nIGEgcm9sZT1tZW51aXRlbXJhZGlvXG5leHBvcnQgY29uc3QgTWVudUl0ZW1SYWRpbyA9ICh7Y2hpbGRyZW4sIGxhYmVsLCBhY3RpdmU9ZmFsc2UsIGRpc2FibGVkPWZhbHNlLCAuLi5wcm9wc30pID0+IHtcbiAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIHsuLi5wcm9wc30gcm9sZT1cIm1lbnVpdGVtcmFkaW9cIiBhcmlhLWNoZWNrZWQ9e2FjdGl2ZX0gYXJpYS1kaXNhYmxlZD17ZGlzYWJsZWR9IHRhYkluZGV4PXstMX0gYXJpYS1sYWJlbD17bGFiZWx9PlxuICAgICAgICAgICAgeyBjaGlsZHJlbiB9XG4gICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICApO1xufTtcbk1lbnVJdGVtUmFkaW8ucHJvcFR5cGVzID0ge1xuICAgIC4uLkFjY2Vzc2libGVCdXR0b24ucHJvcFR5cGVzLFxuICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLCAvLyBvcHRpb25hbFxuICAgIGFjdGl2ZTogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICBkaXNhYmxlZDogUHJvcFR5cGVzLmJvb2wsIC8vIG9wdGlvbmFsXG4gICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLCAvLyBvcHRpb25hbFxuICAgIG9uQ2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG59O1xuXG4vLyBQbGFjZW1lbnQgbWV0aG9kIGZvciA8Q29udGV4dE1lbnUgLz4gdG8gcG9zaXRpb24gY29udGV4dCBtZW51IHRvIHJpZ2h0IG9mIGVsZW1lbnRSZWN0IHdpdGggY2hldnJvbk9mZnNldFxuZXhwb3J0IGNvbnN0IHRvUmlnaHRPZiA9IChlbGVtZW50UmVjdCwgY2hldnJvbk9mZnNldD0xMikgPT4ge1xuICAgIGNvbnN0IGxlZnQgPSBlbGVtZW50UmVjdC5yaWdodCArIHdpbmRvdy5wYWdlWE9mZnNldCArIDM7XG4gICAgbGV0IHRvcCA9IGVsZW1lbnRSZWN0LnRvcCArIChlbGVtZW50UmVjdC5oZWlnaHQgLyAyKSArIHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICB0b3AgLT0gY2hldnJvbk9mZnNldCArIDg7IC8vIHdoZXJlIDggaXMgaGFsZiB0aGUgaGVpZ2h0IG9mIHRoZSBjaGV2cm9uXG4gICAgcmV0dXJuIHtsZWZ0LCB0b3AsIGNoZXZyb25PZmZzZXR9O1xufTtcblxuLy8gUGxhY2VtZW50IG1ldGhvZCBmb3IgPENvbnRleHRNZW51IC8+IHRvIHBvc2l0aW9uIGNvbnRleHQgbWVudSByaWdodC1hbGlnbmVkIGFuZCBmbG93aW5nIHRvIHRoZSBsZWZ0IG9mIGVsZW1lbnRSZWN0XG5leHBvcnQgY29uc3QgYWJvdmVMZWZ0T2YgPSAoZWxlbWVudFJlY3QsIGNoZXZyb25GYWNlPVwibm9uZVwiKSA9PiB7XG4gICAgY29uc3QgbWVudU9wdGlvbnMgPSB7IGNoZXZyb25GYWNlIH07XG5cbiAgICBjb25zdCBidXR0b25SaWdodCA9IGVsZW1lbnRSZWN0LnJpZ2h0ICsgd2luZG93LnBhZ2VYT2Zmc2V0O1xuICAgIGNvbnN0IGJ1dHRvbkJvdHRvbSA9IGVsZW1lbnRSZWN0LmJvdHRvbSArIHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICBjb25zdCBidXR0b25Ub3AgPSBlbGVtZW50UmVjdC50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgLy8gQWxpZ24gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIG1lbnUgdG8gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIGJ1dHRvblxuICAgIG1lbnVPcHRpb25zLnJpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggLSBidXR0b25SaWdodDtcbiAgICAvLyBBbGlnbiB0aGUgbWVudSB2ZXJ0aWNhbGx5IG9uIHdoaWNoZXZlciBzaWRlIG9mIHRoZSBidXR0b24gaGFzIG1vcmUgc3BhY2UgYXZhaWxhYmxlLlxuICAgIGlmIChidXR0b25Cb3R0b20gPCB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyKSB7XG4gICAgICAgIG1lbnVPcHRpb25zLnRvcCA9IGJ1dHRvbkJvdHRvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtZW51T3B0aW9ucy5ib3R0b20gPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSBidXR0b25Ub3A7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lbnVPcHRpb25zO1xufTtcblxuZXhwb3J0IGNvbnN0IHVzZUNvbnRleHRNZW51ID0gKCkgPT4ge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHVzZVJlZihudWxsKTtcbiAgICBjb25zdCBbaXNPcGVuLCBzZXRJc09wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IG9wZW4gPSAoKSA9PiB7XG4gICAgICAgIHNldElzT3Blbih0cnVlKTtcbiAgICB9O1xuICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICBzZXRJc09wZW4oZmFsc2UpO1xuICAgIH07XG5cbiAgICByZXR1cm4gW2lzT3BlbiwgYnV0dG9uLCBvcGVuLCBjbG9zZSwgc2V0SXNPcGVuXTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExlZ2FjeUNvbnRleHRNZW51IGV4dGVuZHMgQ29udGV4dE1lbnUge1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyTWVudShmYWxzZSk7XG4gICAgfVxufVxuXG4vLyBYWFg6IERlcHJlY2F0ZWQsIHVzZWQgb25seSBmb3IgZHluYW1pYyBUb29sdGlwcy4gQXZvaWQgdXNpbmcgYXQgYWxsIGNvc3RzLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1lbnUoRWxlbWVudENsYXNzLCBwcm9wcykge1xuICAgIGNvbnN0IG9uRmluaXNoZWQgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoZ2V0T3JDcmVhdGVDb250YWluZXIoKSk7XG5cbiAgICAgICAgaWYgKHByb3BzICYmIHByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHByb3BzLm9uRmluaXNoZWQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgbWVudSA9IDxMZWdhY3lDb250ZXh0TWVudVxuICAgICAgICB7Li4ucHJvcHN9XG4gICAgICAgIG9uRmluaXNoZWQ9e29uRmluaXNoZWR9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVhY3QvanN4LW5vLWJpbmRcbiAgICAgICAgd2luZG93UmVzaXplPXtvbkZpbmlzaGVkfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlYWN0L2pzeC1uby1iaW5kXG4gICAgPlxuICAgICAgICA8RWxlbWVudENsYXNzIHsuLi5wcm9wc30gb25GaW5pc2hlZD17b25GaW5pc2hlZH0gLz5cbiAgICA8L0xlZ2FjeUNvbnRleHRNZW51PjtcblxuICAgIFJlYWN0RE9NLnJlbmRlcihtZW51LCBnZXRPckNyZWF0ZUNvbnRhaW5lcigpKTtcblxuICAgIHJldHVybiB7Y2xvc2U6IG9uRmluaXNoZWR9O1xufVxuIl19