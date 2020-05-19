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

var _DragDropContext$chil;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _createStore = require('../../state/create-store');

var _createStore2 = _interopRequireDefault(_createStore);

var _fireHooks = require('../../state/fire-hooks');

var _fireHooks2 = _interopRequireDefault(_fireHooks);

var _dimensionMarshal = require('../../state/dimension-marshal/dimension-marshal');

var _dimensionMarshal2 = _interopRequireDefault(_dimensionMarshal);

var _styleMarshal = require('../style-marshal/style-marshal');

var _styleMarshal2 = _interopRequireDefault(_styleMarshal);

var _canStartDrag = require('../../state/can-start-drag');

var _canStartDrag2 = _interopRequireDefault(_canStartDrag);

var _contextKeys = require('../context-keys');

var _actionCreators = require('../../state/action-creators');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DragDropContext = function (_React$Component) {
  (0, _inherits3.default)(DragDropContext, _React$Component);

  function DragDropContext() {
    var _ref;

    var _temp, _this, _ret;

    (0, _classCallCheck3.default)(this, DragDropContext);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = (0, _possibleConstructorReturn3.default)(this, (_ref = DragDropContext.__proto__ || (0, _getPrototypeOf2.default)(DragDropContext)).call.apply(_ref, [this].concat(args))), _this), _this.canLift = function (id) {
      return (0, _canStartDrag2.default)(_this.store.getState(), id);
    }, _temp), (0, _possibleConstructorReturn3.default)(_this, _ret);
  }

  (0, _createClass3.default)(DragDropContext, [{
    key: 'getChildContext',
    value: function getChildContext() {
      var _ref2;

      return _ref2 = {}, (0, _defineProperty3.default)(_ref2, _contextKeys.storeKey, this.store), (0, _defineProperty3.default)(_ref2, _contextKeys.dimensionMarshalKey, this.dimensionMarshal), (0, _defineProperty3.default)(_ref2, _contextKeys.styleContextKey, this.styleMarshal.styleContext), (0, _defineProperty3.default)(_ref2, _contextKeys.canLiftContextKey, this.canLift), _ref2;
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      this.store = (0, _createStore2.default)();

      this.styleMarshal = (0, _styleMarshal2.default)();

      var callbacks = {
        cancel: function cancel() {
          _this2.store.dispatch((0, _actionCreators.clean)());
        },
        publishDraggables: function publishDraggables(dimensions) {
          _this2.store.dispatch((0, _actionCreators.publishDraggableDimensions)(dimensions));
        },
        publishDroppables: function publishDroppables(dimensions) {
          _this2.store.dispatch((0, _actionCreators.publishDroppableDimensions)(dimensions));
        },
        updateDroppableScroll: function updateDroppableScroll(id, newScroll) {
          _this2.store.dispatch((0, _actionCreators.updateDroppableDimensionScroll)(id, newScroll));
        },
        updateDroppableIsEnabled: function updateDroppableIsEnabled(id, isEnabled) {
          _this2.store.dispatch((0, _actionCreators.updateDroppableDimensionIsEnabled)(id, isEnabled));
        }
      };
      this.dimensionMarshal = (0, _dimensionMarshal2.default)(callbacks);

      var previous = this.store.getState();

      this.unsubscribe = this.store.subscribe(function () {
        var previousValue = previous;
        var current = _this2.store.getState();

        previous = current;

        if (current.phase === previousValue.phase) {
          return;
        }

        var hooks = {
          onDragStart: _this2.props.onDragStart,
          onDragEnd: _this2.props.onDragEnd
        };
        (0, _fireHooks2.default)(hooks, previousValue, current);

        _this2.styleMarshal.onPhaseChange(current);

        _this2.dimensionMarshal.onPhaseChange(current);
      });
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.styleMarshal.mount();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unsubscribe();
      this.styleMarshal.unmount();
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.children;
    }
  }]);
  return DragDropContext;
}(_react2.default.Component);

DragDropContext.childContextTypes = (_DragDropContext$chil = {}, (0, _defineProperty3.default)(_DragDropContext$chil, _contextKeys.storeKey, _propTypes2.default.shape({
  dispatch: _propTypes2.default.func.isRequired,
  subscribe: _propTypes2.default.func.isRequired,
  getState: _propTypes2.default.func.isRequired
}).isRequired), (0, _defineProperty3.default)(_DragDropContext$chil, _contextKeys.dimensionMarshalKey, _propTypes2.default.object.isRequired), (0, _defineProperty3.default)(_DragDropContext$chil, _contextKeys.styleContextKey, _propTypes2.default.string.isRequired), (0, _defineProperty3.default)(_DragDropContext$chil, _contextKeys.canLiftContextKey, _propTypes2.default.func.isRequired), _DragDropContext$chil);
exports.default = DragDropContext;