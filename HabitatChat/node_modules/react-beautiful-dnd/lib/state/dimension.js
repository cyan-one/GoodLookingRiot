'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDroppableDimension = exports.scrollDroppable = exports.clip = exports.getDraggableDimension = exports.noSpacing = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _axis = require('./axis');

var _getArea = require('./get-area');

var _getArea2 = _interopRequireDefault(_getArea);

var _spacing = require('./spacing');

var _position = require('./position');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var origin = { x: 0, y: 0 };

var noSpacing = exports.noSpacing = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

var addPosition = function addPosition(area, point) {
  var top = area.top,
      right = area.right,
      bottom = area.bottom,
      left = area.left;

  return (0, _getArea2.default)({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x
  });
};

var addSpacing = function addSpacing(area, spacing) {
  var top = area.top,
      right = area.right,
      bottom = area.bottom,
      left = area.left;

  return (0, _getArea2.default)({
    top: top - spacing.top,
    left: left - spacing.left,

    bottom: bottom + spacing.bottom,
    right: right + spacing.right
  });
};

var getDraggableDimension = exports.getDraggableDimension = function getDraggableDimension(_ref) {
  var descriptor = _ref.descriptor,
      client = _ref.client,
      _ref$margin = _ref.margin,
      margin = _ref$margin === undefined ? noSpacing : _ref$margin,
      _ref$windowScroll = _ref.windowScroll,
      windowScroll = _ref$windowScroll === undefined ? origin : _ref$windowScroll;

  var withScroll = addPosition(client, windowScroll);

  var dimension = {
    descriptor: descriptor,
    placeholder: {
      margin: margin,
      withoutMargin: {
        width: client.width,
        height: client.height
      }
    },

    client: {
      withoutMargin: (0, _getArea2.default)(client),
      withMargin: (0, _getArea2.default)(addSpacing(client, margin))
    },

    page: {
      withoutMargin: (0, _getArea2.default)(withScroll),
      withMargin: (0, _getArea2.default)(addSpacing(withScroll, margin))
    }
  };

  return dimension;
};

var clip = exports.clip = function clip(frame, subject) {
  var result = (0, _getArea2.default)({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left)
  });

  if (result.width <= 0 || result.height <= 0) {
    return null;
  }

  return result;
};

var scrollDroppable = exports.scrollDroppable = function scrollDroppable(droppable, newScroll) {
  var existing = droppable.viewport;

  var scrollDiff = (0, _position.subtract)(newScroll, existing.frameScroll.initial);

  var scrollDisplacement = (0, _position.negate)(scrollDiff);
  var displacedSubject = (0, _spacing.offset)(existing.subject, scrollDisplacement);

  var viewport = {
    frame: existing.frame,
    subject: existing.subject,

    frameScroll: {
      initial: existing.frameScroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement
      }
    },
    clipped: clip(existing.frame, displacedSubject)
  };

  return (0, _extends3.default)({}, droppable, {
    viewport: viewport
  });
};

var getDroppableDimension = exports.getDroppableDimension = function getDroppableDimension(_ref2) {
  var descriptor = _ref2.descriptor,
      client = _ref2.client,
      frameClient = _ref2.frameClient,
      _ref2$frameScroll = _ref2.frameScroll,
      frameScroll = _ref2$frameScroll === undefined ? origin : _ref2$frameScroll,
      _ref2$direction = _ref2.direction,
      direction = _ref2$direction === undefined ? 'vertical' : _ref2$direction,
      _ref2$margin = _ref2.margin,
      margin = _ref2$margin === undefined ? noSpacing : _ref2$margin,
      _ref2$padding = _ref2.padding,
      padding = _ref2$padding === undefined ? noSpacing : _ref2$padding,
      _ref2$windowScroll = _ref2.windowScroll,
      windowScroll = _ref2$windowScroll === undefined ? origin : _ref2$windowScroll,
      _ref2$isEnabled = _ref2.isEnabled,
      isEnabled = _ref2$isEnabled === undefined ? true : _ref2$isEnabled;

  var withMargin = addSpacing(client, margin);
  var withWindowScroll = addPosition(client, windowScroll);


  var subject = addSpacing(withWindowScroll, margin);

  var frame = function () {
    if (!frameClient) {
      return subject;
    }
    return addPosition(frameClient, windowScroll);
  }();

  var viewport = {
    frame: frame,
    frameScroll: {
      initial: frameScroll,

      current: frameScroll,
      diff: {
        value: origin,
        displacement: origin
      }
    },
    subject: subject,
    clipped: clip(frame, subject)
  };

  var dimension = {
    descriptor: descriptor,
    isEnabled: isEnabled,
    axis: direction === 'vertical' ? _axis.vertical : _axis.horizontal,
    client: {
      withoutMargin: (0, _getArea2.default)(client),
      withMargin: (0, _getArea2.default)(withMargin),
      withMarginAndPadding: (0, _getArea2.default)(addSpacing(withMargin, padding))
    },
    page: {
      withoutMargin: (0, _getArea2.default)(withWindowScroll),
      withMargin: subject,
      withMarginAndPadding: (0, _getArea2.default)(addSpacing(withWindowScroll, (0, _spacing.add)(margin, padding)))
    },
    viewport: viewport
  };

  return dimension;
};