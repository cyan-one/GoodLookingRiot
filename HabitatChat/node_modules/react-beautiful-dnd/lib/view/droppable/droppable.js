'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _droppableDimensionPublisher = require('../droppable-dimension-publisher/');

var _droppableDimensionPublisher2 = _interopRequireDefault(_droppableDimensionPublisher);

var _placeholder = require('../placeholder/');

var _placeholder2 = _interopRequireDefault(_placeholder);

var _contextKeys = require('../context-keys');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Droppable = function (_Component) {
  (0, _inherits3.default)(Droppable, _Component);

  function Droppable() {
    var _ref;

    var _temp, _this, _ret;

    (0, _classCallCheck3.default)(this, Droppable);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = (0, _possibleConstructorReturn3.default)(this, (_ref = Droppable.__proto__ || (0, _getPrototypeOf2.default)(Droppable)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      ref: null
    }, _this.setRef = function (ref) {
      if (ref === null) {
        return;
      }

      if (ref === _this.state.ref) {
        return;
      }

      _this.setState({
        ref: ref
      });
    }, _temp), (0, _possibleConstructorReturn3.default)(_this, _ret);
  }

  (0, _createClass3.default)(Droppable, [{
    key: 'getChildContext',
    value: function getChildContext() {
      var value = (0, _defineProperty3.default)({}, _contextKeys.droppableIdKey, this.props.droppableId);
      return value;
    }
  }, {
    key: 'getPlaceholder',
    value: function getPlaceholder() {
      if (!this.props.placeholder) {
        return null;
      }

      return _react2.default.createElement(_placeholder2.default, { placeholder: this.props.placeholder });
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          children = _props.children,
          direction = _props.direction,
          droppableId = _props.droppableId,
          ignoreContainerClipping = _props.ignoreContainerClipping,
          isDraggingOver = _props.isDraggingOver,
          isDropDisabled = _props.isDropDisabled,
          type = _props.type;

      var provided = {
        innerRef: this.setRef,
        placeholder: this.getPlaceholder()
      };
      var snapshot = {
        isDraggingOver: isDraggingOver
      };

      return _react2.default.createElement(
        _droppableDimensionPublisher2.default,
        {
          droppableId: droppableId,
          type: type,
          direction: direction,
          ignoreContainerClipping: ignoreContainerClipping,
          isDropDisabled: isDropDisabled,
          targetRef: this.state.ref
        },
        children(provided, snapshot)
      );
    }
  }]);
  return Droppable;
}(_react.Component);

Droppable.defaultProps = {
  type: 'DEFAULT',
  isDropDisabled: false,
  direction: 'vertical',
  ignoreContainerClipping: false
};
Droppable.childContextTypes = (0, _defineProperty3.default)({}, _contextKeys.droppableIdKey, _propTypes2.default.string.isRequired);
exports.default = Droppable;