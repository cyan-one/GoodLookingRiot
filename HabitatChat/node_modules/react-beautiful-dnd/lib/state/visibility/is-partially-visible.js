'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isVisibleThroughFrame = require('./is-visible-through-frame');

var _isVisibleThroughFrame2 = _interopRequireDefault(_isVisibleThroughFrame);

var _spacing = require('../spacing');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
  var target = _ref.target,
      destination = _ref.destination,
      viewport = _ref.viewport;

  var displacement = destination.viewport.frameScroll.diff.displacement;
  var withScroll = (0, _spacing.offset)(target, displacement);

  if (!destination.viewport.clipped) {
    return false;
  }

  var isVisibleInDroppable = (0, _isVisibleThroughFrame2.default)(destination.viewport.clipped)(withScroll);

  var isVisibleInViewport = (0, _isVisibleThroughFrame2.default)(viewport)(withScroll);

  return isVisibleInDroppable && isVisibleInViewport;
};