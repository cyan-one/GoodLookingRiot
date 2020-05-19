'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keyCodes = require('../../key-codes');

var keyCodes = _interopRequireWildcard(_keyCodes);

var _stopEvent = require('./stop-event');

var _stopEvent2 = _interopRequireDefault(_stopEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var blocked = [keyCodes.enter, keyCodes.tab];

exports.default = function (event) {
  if (blocked.indexOf(event.keyCode) >= 0) {
    (0, _stopEvent2.default)(event);
  }
};