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

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _memoizeOne = require('memoize-one');

var _memoizeOne2 = _interopRequireDefault(_memoizeOne);

var _rafSchd = require('raf-schd');

var _rafSchd2 = _interopRequireDefault(_rafSchd);

var _getWindowScrollPosition = require('../get-window-scroll-position');

var _getWindowScrollPosition2 = _interopRequireDefault(_getWindowScrollPosition);

var _getArea = require('../../state/get-area');

var _getArea2 = _interopRequireDefault(_getArea);

var _dimension = require('../../state/dimension');

var _getClosestScrollable = require('../get-closest-scrollable');

var _getClosestScrollable2 = _interopRequireDefault(_getClosestScrollable);

var _contextKeys = require('../context-keys');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var origin = { x: 0, y: 0 };

var DroppableDimensionPublisher = function (_Component) {
  (0, _inherits3.default)(DroppableDimensionPublisher, _Component);

  function DroppableDimensionPublisher(props, context) {
    (0, _classCallCheck3.default)(this, DroppableDimensionPublisher);

    var _this = (0, _possibleConstructorReturn3.default)(this, (DroppableDimensionPublisher.__proto__ || (0, _getPrototypeOf2.default)(DroppableDimensionPublisher)).call(this, props, context));

    _this.closestScrollable = null;
    _this.isWatchingScroll = false;
    _this.publishedDescriptor = null;

    _this.getScrollOffset = function () {
      if (!_this.closestScrollable) {
        return origin;
      }

      var offset = {
        x: _this.closestScrollable.scrollLeft,
        y: _this.closestScrollable.scrollTop
      };

      return offset;
    };

    _this.memoizedUpdateScroll = (0, _memoizeOne2.default)(function (x, y) {
      if (!_this.publishedDescriptor) {
        console.error('Cannot update scroll on unpublished droppable');
        return;
      }

      var newScroll = { x: x, y: y };
      var marshal = _this.context[_contextKeys.dimensionMarshalKey];
      marshal.updateDroppableScroll(_this.publishedDescriptor.id, newScroll);
    });
    _this.scheduleScrollUpdate = (0, _rafSchd2.default)(function (offset) {
      if (_this.isWatchingScroll) {
        _this.memoizedUpdateScroll(offset.x, offset.y);
      }
    });

    _this.onClosestScroll = function () {
      _this.scheduleScrollUpdate(_this.getScrollOffset());
    };

    _this.watchScroll = function () {
      if (!_this.props.targetRef) {
        console.error('cannot watch droppable scroll if not in the dom');
        return;
      }

      if (_this.closestScrollable == null) {
        return;
      }

      if (_this.isWatchingScroll) {
        return;
      }

      _this.isWatchingScroll = true;
      _this.closestScrollable.addEventListener('scroll', _this.onClosestScroll, { passive: true });
    };

    _this.unwatchScroll = function () {
      if (!_this.isWatchingScroll) {
        return;
      }

      _this.isWatchingScroll = false;

      if (!_this.closestScrollable) {
        console.error('cannot unbind event listener if element is null');
        return;
      }

      _this.closestScrollable.removeEventListener('scroll', _this.onClosestScroll);
    };

    _this.getMemoizedDescriptor = (0, _memoizeOne2.default)(function (id, type) {
      return {
        id: id,
        type: type
      };
    });

    _this.unpublish = function () {
      if (!_this.publishedDescriptor) {
        console.error('cannot unpublish descriptor when none is published');
        return;
      }

      var marshal = _this.context[_contextKeys.dimensionMarshalKey];
      marshal.unregisterDroppable(_this.publishedDescriptor);
      _this.publishedDescriptor = null;
    };

    _this.publish = function (descriptor) {
      if (descriptor === _this.publishedDescriptor) {
        return;
      }

      if (_this.publishedDescriptor) {
        _this.unpublish();
      }

      var marshal = _this.context[_contextKeys.dimensionMarshalKey];
      marshal.registerDroppable(descriptor, _this.callbacks);
      _this.publishedDescriptor = descriptor;
    };

    _this.getDimension = function () {
      var _this$props = _this.props,
          direction = _this$props.direction,
          ignoreContainerClipping = _this$props.ignoreContainerClipping,
          isDropDisabled = _this$props.isDropDisabled,
          targetRef = _this$props.targetRef;


      if (!targetRef) {
        throw new Error('DimensionPublisher cannot calculate a dimension when not attached to the DOM');
      }

      if (_this.isWatchingScroll) {
        throw new Error('Attempting to recapture Droppable dimension while already watching scroll on previous capture');
      }

      var descriptor = _this.publishedDescriptor;

      if (!descriptor) {
        throw new Error('Cannot get dimension for unpublished droppable');
      }

      _this.closestScrollable = (0, _getClosestScrollable2.default)(targetRef);
      var frameScroll = _this.getScrollOffset();
      var style = window.getComputedStyle(targetRef);

      var margin = {
        top: parseInt(style.marginTop, 10),
        right: parseInt(style.marginRight, 10),
        bottom: parseInt(style.marginBottom, 10),
        left: parseInt(style.marginLeft, 10)
      };
      var padding = {
        top: parseInt(style.paddingTop, 10),
        right: parseInt(style.paddingRight, 10),
        bottom: parseInt(style.paddingBottom, 10),
        left: parseInt(style.paddingLeft, 10)
      };

      var client = (0, _getArea2.default)(targetRef.getBoundingClientRect());

      var frameClient = function () {
        if (ignoreContainerClipping) {
          return null;
        }
        if (!_this.closestScrollable) {
          return null;
        }
        if (_this.closestScrollable === targetRef) {
          return null;
        }
        return (0, _getArea2.default)(_this.closestScrollable.getBoundingClientRect());
      }();

      var dimension = (0, _dimension.getDroppableDimension)({
        descriptor: descriptor,
        direction: direction,
        client: client,
        frameClient: frameClient,
        frameScroll: frameScroll,
        margin: margin,
        padding: padding,
        windowScroll: (0, _getWindowScrollPosition2.default)(),
        isEnabled: !isDropDisabled
      });

      return dimension;
    };

    var callbacks = {
      getDimension: _this.getDimension,
      watchScroll: _this.watchScroll,
      unwatchScroll: _this.unwatchScroll
    };
    _this.callbacks = callbacks;
    return _this;
  }

  (0, _createClass3.default)(DroppableDimensionPublisher, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (!nextProps.targetRef) {
        console.error('Cannot update droppable dimension publisher without a target ref');
        return;
      }

      var droppableId = nextProps.droppableId,
          type = nextProps.type;

      var descriptor = this.getMemoizedDescriptor(droppableId, type);

      this.publish(descriptor);

      if (this.props.isDropDisabled === nextProps.isDropDisabled) {
        return;
      }

      var marshal = this.context[_contextKeys.dimensionMarshalKey];
      marshal.updateDroppableIsEnabled(nextProps.droppableId, !nextProps.isDropDisabled);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this.isWatchingScroll) {
        console.warn('unmounting droppable while it was watching scroll');
        this.unwatchScroll();
      }

      this.unpublish();
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.children;
    }
  }]);
  return DroppableDimensionPublisher;
}(_react.Component);

DroppableDimensionPublisher.contextTypes = (0, _defineProperty3.default)({}, _contextKeys.dimensionMarshalKey, _propTypes2.default.object.isRequired);
exports.default = DroppableDimensionPublisher;