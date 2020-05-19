'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _position = require('../position');

var _getViewport = require('../visibility/get-viewport');

var _getViewport2 = _interopRequireDefault(_getViewport);

var _isPartiallyVisible = require('../visibility/is-partially-visible');

var _isPartiallyVisible2 = _interopRequireDefault(_isPartiallyVisible);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
  var axis = _ref.axis,
      pageCenter = _ref.pageCenter,
      destination = _ref.destination,
      insideDestination = _ref.insideDestination;

  if (!insideDestination.length) {
    return null;
  }

  var viewport = (0, _getViewport2.default)();

  var result = insideDestination.filter(function (draggable) {
    return (0, _isPartiallyVisible2.default)({
      target: draggable.page.withMargin,
      destination: destination,
      viewport: viewport
    });
  }).sort(function (a, b) {
    var distanceToA = (0, _position.distance)(pageCenter, a.page.withMargin.center);
    var distanceToB = (0, _position.distance)(pageCenter, b.page.withMargin.center);

    if (distanceToA < distanceToB) {
      return -1;
    }

    if (distanceToB < distanceToA) {
      return 1;
    }

    return a.page.withMargin[axis.start] - b.page.withMargin[axis.start];
  });

  return result.length ? result[0] : null;
};