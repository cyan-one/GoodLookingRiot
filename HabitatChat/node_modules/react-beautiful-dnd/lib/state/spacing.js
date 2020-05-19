'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCorners = exports.offset = exports.isEqual = exports.addPosition = exports.add = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var add = exports.add = function add(spacing1, spacing2) {
  return {
    top: spacing1.top + spacing2.top,
    left: spacing1.left + spacing2.left,
    right: spacing1.right + spacing2.right,
    bottom: spacing1.bottom + spacing2.bottom
  };
};

var addPosition = exports.addPosition = function addPosition(spacing, position) {
  return (0, _extends3.default)({}, spacing, {
    right: spacing.right + position.x,
    bottom: spacing.bottom + position.y
  });
};

var isEqual = exports.isEqual = function isEqual(spacing1, spacing2) {
  return spacing1.top === spacing2.top && spacing1.right === spacing2.right && spacing1.bottom === spacing2.bottom && spacing1.left === spacing2.left;
};

var offset = exports.offset = function offset(spacing, point) {
  return {
    top: spacing.top + point.y,
    right: spacing.right + point.x,
    bottom: spacing.bottom + point.y,
    left: spacing.left + point.x
  };
};

var getCorners = exports.getCorners = function getCorners(spacing) {
  return [{ x: spacing.left, y: spacing.top }, { x: spacing.right, y: spacing.top }, { x: spacing.left, y: spacing.bottom }, { x: spacing.right, y: spacing.bottom }];
};