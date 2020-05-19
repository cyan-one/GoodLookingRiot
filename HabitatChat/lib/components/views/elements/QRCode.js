"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var React = _interopRequireWildcard(require("react"));

var _qrcode = require("qrcode");

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var _Spinner = _interopRequireDefault(require("./Spinner"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const defaultOptions
/*: QRCodeToDataURLOptions*/
= {
  errorCorrectionLevel: 'L' // we want it as trivial-looking as possible

};

const QRCode
/*: React.FC<IProps>*/
= (_ref) => {
  let {
    data,
    className
  } = _ref,
      options = (0, _objectWithoutProperties2.default)(_ref, ["data", "className"]);
  const [dataUri, setUri] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    (0, _qrcode.toDataURL)(data, _objectSpread({}, defaultOptions, {}, options)).then(uri => {
      if (cancelled) return;
      setUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(data), options]);
  return /*#__PURE__*/React.createElement("div", {
    className: (0, _classnames.default)("mx_QRCode", className)
  }, dataUri ? /*#__PURE__*/React.createElement("img", {
    src: dataUri,
    className: "mx_VerificationQRCode",
    alt: (0, _languageHandler._t)("QR Code")
  }) : /*#__PURE__*/React.createElement(_Spinner.default, null));
};

var _default = QRCode;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1FSQ29kZS50c3giXSwibmFtZXMiOlsiZGVmYXVsdE9wdGlvbnMiLCJlcnJvckNvcnJlY3Rpb25MZXZlbCIsIlFSQ29kZSIsImRhdGEiLCJjbGFzc05hbWUiLCJvcHRpb25zIiwiZGF0YVVyaSIsInNldFVyaSIsIlJlYWN0IiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJjYW5jZWxsZWQiLCJ0aGVuIiwidXJpIiwiSlNPTiIsInN0cmluZ2lmeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7Ozs7QUFPQSxNQUFNQTtBQUFzQztBQUFBLEVBQUc7QUFDM0NDLEVBQUFBLG9CQUFvQixFQUFFLEdBRHFCLENBQ2hCOztBQURnQixDQUEvQzs7QUFJQSxNQUFNQztBQUF3QjtBQUFBLEVBQUcsVUFBbUM7QUFBQSxNQUFsQztBQUFDQyxJQUFBQSxJQUFEO0FBQU9DLElBQUFBO0FBQVAsR0FBa0M7QUFBQSxNQUFiQyxPQUFhO0FBQ2hFLFFBQU0sQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLElBQW9CQyxLQUFLLENBQUNDLFFBQU4sQ0FBdUIsSUFBdkIsQ0FBMUI7QUFDQUQsRUFBQUEsS0FBSyxDQUFDRSxTQUFOLENBQWdCLE1BQU07QUFDbEIsUUFBSUMsU0FBUyxHQUFHLEtBQWhCO0FBQ0EsMkJBQVVSLElBQVYsb0JBQW9CSCxjQUFwQixNQUF1Q0ssT0FBdkMsR0FBaURPLElBQWpELENBQXNEQyxHQUFHLElBQUk7QUFDekQsVUFBSUYsU0FBSixFQUFlO0FBQ2ZKLE1BQUFBLE1BQU0sQ0FBQ00sR0FBRCxDQUFOO0FBQ0gsS0FIRDtBQUlBLFdBQU8sTUFBTTtBQUNURixNQUFBQSxTQUFTLEdBQUcsSUFBWjtBQUNILEtBRkQ7QUFHSCxHQVRELEVBU0csQ0FBQ0csSUFBSSxDQUFDQyxTQUFMLENBQWVaLElBQWYsQ0FBRCxFQUF1QkUsT0FBdkIsQ0FUSDtBQVdBLHNCQUFPO0FBQUssSUFBQSxTQUFTLEVBQUUseUJBQVcsV0FBWCxFQUF3QkQsU0FBeEI7QUFBaEIsS0FDREUsT0FBTyxnQkFBRztBQUFLLElBQUEsR0FBRyxFQUFFQSxPQUFWO0FBQW1CLElBQUEsU0FBUyxFQUFDLHVCQUE3QjtBQUFxRCxJQUFBLEdBQUcsRUFBRSx5QkFBRyxTQUFIO0FBQTFELElBQUgsZ0JBQWlGLG9CQUFDLGdCQUFELE9BRHZGLENBQVA7QUFHSCxDQWhCRDs7ZUFrQmVKLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7dG9EYXRhVVJMLCBRUkNvZGVTZWdtZW50LCBRUkNvZGVUb0RhdGFVUkxPcHRpb25zfSBmcm9tIFwicXJjb2RlXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbXBvcnQge190fSBmcm9tIFwiLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyXCI7XG5pbXBvcnQgU3Bpbm5lciBmcm9tIFwiLi9TcGlubmVyXCI7XG5cbmludGVyZmFjZSBJUHJvcHMgZXh0ZW5kcyBRUkNvZGVUb0RhdGFVUkxPcHRpb25zIHtcbiAgICBkYXRhOiBzdHJpbmcgfCBRUkNvZGVTZWdtZW50W107XG4gICAgY2xhc3NOYW1lPzogc3RyaW5nO1xufVxuXG5jb25zdCBkZWZhdWx0T3B0aW9uczogUVJDb2RlVG9EYXRhVVJMT3B0aW9ucyA9IHtcbiAgICBlcnJvckNvcnJlY3Rpb25MZXZlbDogJ0wnLCAvLyB3ZSB3YW50IGl0IGFzIHRyaXZpYWwtbG9va2luZyBhcyBwb3NzaWJsZVxufTtcblxuY29uc3QgUVJDb2RlOiBSZWFjdC5GQzxJUHJvcHM+ID0gKHtkYXRhLCBjbGFzc05hbWUsIC4uLm9wdGlvbnN9KSA9PiB7XG4gICAgY29uc3QgW2RhdGFVcmksIHNldFVyaV0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KG51bGwpO1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGxldCBjYW5jZWxsZWQgPSBmYWxzZTtcbiAgICAgICAgdG9EYXRhVVJMKGRhdGEsIHsuLi5kZWZhdWx0T3B0aW9ucywgLi4ub3B0aW9uc30pLnRoZW4odXJpID0+IHtcbiAgICAgICAgICAgIGlmIChjYW5jZWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgIHNldFVyaSh1cmkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgfSwgW0pTT04uc3RyaW5naWZ5KGRhdGEpLCBvcHRpb25zXSk7XG5cbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJteF9RUkNvZGVcIiwgY2xhc3NOYW1lKX0+XG4gICAgICAgIHsgZGF0YVVyaSA/IDxpbWcgc3JjPXtkYXRhVXJpfSBjbGFzc05hbWU9XCJteF9WZXJpZmljYXRpb25RUkNvZGVcIiBhbHQ9e190KFwiUVIgQ29kZVwiKX0gLz4gOiA8U3Bpbm5lciAvPiB9XG4gICAgPC9kaXY+O1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUVJDb2RlO1xuIl19