"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

// eslint-disable-line no-unused-vars
const AppWarning = props => {
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_AppPermissionWarning"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_AppPermissionWarningImage"
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: require("../../../../res/img/warning.svg"),
    alt: ""
  })), /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_AppPermissionWarningText"
  }, /*#__PURE__*/_react.default.createElement("span", {
    className: "mx_AppPermissionWarningTextLabel"
  }, props.errorMsg)));
};

AppWarning.propTypes = {
  errorMsg: _propTypes.default.string
};
AppWarning.defaultProps = {
  errorMsg: 'Error'
};
var _default = AppWarning;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0FwcFdhcm5pbmcuanMiXSwibmFtZXMiOlsiQXBwV2FybmluZyIsInByb3BzIiwicmVxdWlyZSIsImVycm9yTXNnIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiZGVmYXVsdFByb3BzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFEMkI7QUFHM0IsTUFBTUEsVUFBVSxHQUFJQyxLQUFELElBQVc7QUFDMUIsc0JBQ0k7QUFBSyxJQUFBLFNBQVMsRUFBQztBQUFmLGtCQUNJO0FBQUssSUFBQSxTQUFTLEVBQUM7QUFBZixrQkFDSTtBQUFLLElBQUEsR0FBRyxFQUFFQyxPQUFPLENBQUMsaUNBQUQsQ0FBakI7QUFBc0QsSUFBQSxHQUFHLEVBQUM7QUFBMUQsSUFESixDQURKLGVBSUk7QUFBSyxJQUFBLFNBQVMsRUFBQztBQUFmLGtCQUNJO0FBQU0sSUFBQSxTQUFTLEVBQUM7QUFBaEIsS0FBcURELEtBQUssQ0FBQ0UsUUFBM0QsQ0FESixDQUpKLENBREo7QUFVSCxDQVhEOztBQWFBSCxVQUFVLENBQUNJLFNBQVgsR0FBdUI7QUFDbkJELEVBQUFBLFFBQVEsRUFBRUUsbUJBQVVDO0FBREQsQ0FBdkI7QUFHQU4sVUFBVSxDQUFDTyxZQUFYLEdBQTBCO0FBQ3RCSixFQUFBQSxRQUFRLEVBQUU7QUFEWSxDQUExQjtlQUllSCxVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuY29uc3QgQXBwV2FybmluZyA9IChwcm9wcykgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9BcHBQZXJtaXNzaW9uV2FybmluZyc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfQXBwUGVybWlzc2lvbldhcm5pbmdJbWFnZSc+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3dhcm5pbmcuc3ZnXCIpfSBhbHQ9JycgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0FwcFBlcm1pc3Npb25XYXJuaW5nVGV4dCc+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9BcHBQZXJtaXNzaW9uV2FybmluZ1RleHRMYWJlbCc+eyBwcm9wcy5lcnJvck1zZyB9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59O1xuXG5BcHBXYXJuaW5nLnByb3BUeXBlcyA9IHtcbiAgICBlcnJvck1zZzogUHJvcFR5cGVzLnN0cmluZyxcbn07XG5BcHBXYXJuaW5nLmRlZmF1bHRQcm9wcyA9IHtcbiAgICBlcnJvck1zZzogJ0Vycm9yJyxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFwcFdhcm5pbmc7XG4iXX0=