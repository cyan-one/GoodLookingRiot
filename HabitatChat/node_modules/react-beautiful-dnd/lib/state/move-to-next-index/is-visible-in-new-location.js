'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _position = require('../position');

var _spacing = require('../spacing');

var _isPartiallyVisible = require('../visibility/is-partially-visible');

var _isPartiallyVisible2 = _interopRequireDefault(_isPartiallyVisible);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
  var draggable = _ref.draggable,
      destination = _ref.destination,
      newCenter = _ref.newCenter,
      viewport = _ref.viewport;

  var diff = (0, _position.subtract)(newCenter, draggable.page.withMargin.center);
  var shifted = (0, _spacing.offset)(draggable.page.withMargin, diff);

  return (0, _isPartiallyVisible2.default)({
    target: shifted,
    destination: destination,
    viewport: viewport
  });
};