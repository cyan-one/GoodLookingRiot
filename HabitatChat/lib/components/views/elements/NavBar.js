"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactstrap = require("reactstrap");

const Example = props => {
  const [isOpen, setIsOpen] = (0, _react.useState)(false);

  const toggle = () => setIsOpen(!isOpen);

  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_reactstrap.Navbar, {
    color: "light",
    light: true,
    expand: "md"
  }, /*#__PURE__*/_react.default.createElement(_reactstrap.NavbarBrand, {
    href: "/"
  }, "reactstrap"), /*#__PURE__*/_react.default.createElement(_reactstrap.NavbarToggler, {
    onClick: toggle
  }), /*#__PURE__*/_react.default.createElement(_reactstrap.Collapse, {
    isOpen: isOpen,
    navbar: true
  }, /*#__PURE__*/_react.default.createElement(_reactstrap.Nav, {
    className: "mr-auto",
    navbar: true
  }, /*#__PURE__*/_react.default.createElement(_reactstrap.NavItem, null, /*#__PURE__*/_react.default.createElement(_reactstrap.NavLink, {
    href: "/components/"
  }, "Components")), /*#__PURE__*/_react.default.createElement(_reactstrap.NavItem, null, /*#__PURE__*/_react.default.createElement(_reactstrap.NavLink, {
    href: "https://github.com/reactstrap/reactstrap"
  }, "GitHub")), /*#__PURE__*/_react.default.createElement(_reactstrap.UncontrolledDropdown, {
    nav: true,
    inNavbar: true
  }, /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownToggle, {
    nav: true,
    caret: true
  }, "Options"), /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownMenu, {
    right: true
  }, /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownItem, null, "Option 1"), /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownItem, null, "Option 2"), /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownItem, {
    divider: true
  }), /*#__PURE__*/_react.default.createElement(_reactstrap.DropdownItem, null, "Reset")))), /*#__PURE__*/_react.default.createElement(_reactstrap.NavbarText, null, "Simple Text"))));
};

var _default = NavBar;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL05hdkJhci5qcyJdLCJuYW1lcyI6WyJFeGFtcGxlIiwicHJvcHMiLCJpc09wZW4iLCJzZXRJc09wZW4iLCJ0b2dnbGUiLCJOYXZCYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOztBQWVBLE1BQU1BLE9BQU8sR0FBSUMsS0FBRCxJQUFXO0FBQ3pCLFFBQU0sQ0FBQ0MsTUFBRCxFQUFTQyxTQUFULElBQXNCLHFCQUFTLEtBQVQsQ0FBNUI7O0FBRUEsUUFBTUMsTUFBTSxHQUFHLE1BQU1ELFNBQVMsQ0FBQyxDQUFDRCxNQUFGLENBQTlCOztBQUVBLHNCQUNFLHVEQUNFLDZCQUFDLGtCQUFEO0FBQVEsSUFBQSxLQUFLLEVBQUMsT0FBZDtBQUFzQixJQUFBLEtBQUssTUFBM0I7QUFBNEIsSUFBQSxNQUFNLEVBQUM7QUFBbkMsa0JBQ0UsNkJBQUMsdUJBQUQ7QUFBYSxJQUFBLElBQUksRUFBQztBQUFsQixrQkFERixlQUVFLDZCQUFDLHlCQUFEO0FBQWUsSUFBQSxPQUFPLEVBQUVFO0FBQXhCLElBRkYsZUFHRSw2QkFBQyxvQkFBRDtBQUFVLElBQUEsTUFBTSxFQUFFRixNQUFsQjtBQUEwQixJQUFBLE1BQU07QUFBaEMsa0JBQ0UsNkJBQUMsZUFBRDtBQUFLLElBQUEsU0FBUyxFQUFDLFNBQWY7QUFBeUIsSUFBQSxNQUFNO0FBQS9CLGtCQUNFLDZCQUFDLG1CQUFELHFCQUNFLDZCQUFDLG1CQUFEO0FBQVMsSUFBQSxJQUFJLEVBQUM7QUFBZCxrQkFERixDQURGLGVBSUUsNkJBQUMsbUJBQUQscUJBQ0UsNkJBQUMsbUJBQUQ7QUFBUyxJQUFBLElBQUksRUFBQztBQUFkLGNBREYsQ0FKRixlQU9FLDZCQUFDLGdDQUFEO0FBQXNCLElBQUEsR0FBRyxNQUF6QjtBQUEwQixJQUFBLFFBQVE7QUFBbEMsa0JBQ0UsNkJBQUMsMEJBQUQ7QUFBZ0IsSUFBQSxHQUFHLE1BQW5CO0FBQW9CLElBQUEsS0FBSztBQUF6QixlQURGLGVBSUUsNkJBQUMsd0JBQUQ7QUFBYyxJQUFBLEtBQUs7QUFBbkIsa0JBQ0UsNkJBQUMsd0JBQUQsbUJBREYsZUFJRSw2QkFBQyx3QkFBRCxtQkFKRixlQU9FLDZCQUFDLHdCQUFEO0FBQWMsSUFBQSxPQUFPO0FBQXJCLElBUEYsZUFRRSw2QkFBQyx3QkFBRCxnQkFSRixDQUpGLENBUEYsQ0FERixlQTBCRSw2QkFBQyxzQkFBRCxzQkExQkYsQ0FIRixDQURGLENBREY7QUFvQ0QsQ0F6Q0Q7O2VBMkNlRyxNIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQge1xuICBDb2xsYXBzZSxcbiAgTmF2YmFyLFxuICBOYXZiYXJUb2dnbGVyLFxuICBOYXZiYXJCcmFuZCxcbiAgTmF2LFxuICBOYXZJdGVtLFxuICBOYXZMaW5rLFxuICBVbmNvbnRyb2xsZWREcm9wZG93bixcbiAgRHJvcGRvd25Ub2dnbGUsXG4gIERyb3Bkb3duTWVudSxcbiAgRHJvcGRvd25JdGVtLFxuICBOYXZiYXJUZXh0XG59IGZyb20gJ3JlYWN0c3RyYXAnO1xuXG5jb25zdCBFeGFtcGxlID0gKHByb3BzKSA9PiB7XG4gIGNvbnN0IFtpc09wZW4sIHNldElzT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3QgdG9nZ2xlID0gKCkgPT4gc2V0SXNPcGVuKCFpc09wZW4pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxOYXZiYXIgY29sb3I9XCJsaWdodFwiIGxpZ2h0IGV4cGFuZD1cIm1kXCI+XG4gICAgICAgIDxOYXZiYXJCcmFuZCBocmVmPVwiL1wiPnJlYWN0c3RyYXA8L05hdmJhckJyYW5kPlxuICAgICAgICA8TmF2YmFyVG9nZ2xlciBvbkNsaWNrPXt0b2dnbGV9IC8+XG4gICAgICAgIDxDb2xsYXBzZSBpc09wZW49e2lzT3Blbn0gbmF2YmFyPlxuICAgICAgICAgIDxOYXYgY2xhc3NOYW1lPVwibXItYXV0b1wiIG5hdmJhcj5cbiAgICAgICAgICAgIDxOYXZJdGVtPlxuICAgICAgICAgICAgICA8TmF2TGluayBocmVmPVwiL2NvbXBvbmVudHMvXCI+Q29tcG9uZW50czwvTmF2TGluaz5cbiAgICAgICAgICAgIDwvTmF2SXRlbT5cbiAgICAgICAgICAgIDxOYXZJdGVtPlxuICAgICAgICAgICAgICA8TmF2TGluayBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3JlYWN0c3RyYXAvcmVhY3RzdHJhcFwiPkdpdEh1YjwvTmF2TGluaz5cbiAgICAgICAgICAgIDwvTmF2SXRlbT5cbiAgICAgICAgICAgIDxVbmNvbnRyb2xsZWREcm9wZG93biBuYXYgaW5OYXZiYXI+XG4gICAgICAgICAgICAgIDxEcm9wZG93blRvZ2dsZSBuYXYgY2FyZXQ+XG4gICAgICAgICAgICAgICAgT3B0aW9uc1xuICAgICAgICAgICAgICA8L0Ryb3Bkb3duVG9nZ2xlPlxuICAgICAgICAgICAgICA8RHJvcGRvd25NZW51IHJpZ2h0PlxuICAgICAgICAgICAgICAgIDxEcm9wZG93bkl0ZW0+XG4gICAgICAgICAgICAgICAgICBPcHRpb24gMVxuICAgICAgICAgICAgICAgIDwvRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgICAgIDxEcm9wZG93bkl0ZW0+XG4gICAgICAgICAgICAgICAgICBPcHRpb24gMlxuICAgICAgICAgICAgICAgIDwvRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgICAgIDxEcm9wZG93bkl0ZW0gZGl2aWRlciAvPlxuICAgICAgICAgICAgICAgIDxEcm9wZG93bkl0ZW0+XG4gICAgICAgICAgICAgICAgICBSZXNldFxuICAgICAgICAgICAgICAgIDwvRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgICA8L0Ryb3Bkb3duTWVudT5cbiAgICAgICAgICAgIDwvVW5jb250cm9sbGVkRHJvcGRvd24+XG4gICAgICAgICAgPC9OYXY+XG4gICAgICAgICAgPE5hdmJhclRleHQ+U2ltcGxlIFRleHQ8L05hdmJhclRleHQ+XG4gICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICA8L05hdmJhcj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgTmF2QmFyOyJdfQ==