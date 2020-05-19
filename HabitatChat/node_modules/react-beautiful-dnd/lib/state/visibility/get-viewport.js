'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getArea = require('../get-area');

var _getArea2 = _interopRequireDefault(_getArea);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var top = window.pageYOffset;
  var left = window.pageXOffset;
  var width = window.innerWidth;
  var height = window.innerHeight;

  var right = left + width;
  var bottom = top + height;

  return (0, _getArea2.default)({
    top: top, left: left, right: right, bottom: bottom
  });
};