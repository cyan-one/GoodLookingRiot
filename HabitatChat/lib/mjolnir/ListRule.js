"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recommendationToStable = recommendationToStable;
exports.ListRule = exports.RECOMMENDATION_BAN_TYPES = exports.RECOMMENDATION_BAN = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _MatrixGlob = require("../utils/MatrixGlob");

/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// Inspiration largely taken from Mjolnir itself
const RECOMMENDATION_BAN = "m.ban";
exports.RECOMMENDATION_BAN = RECOMMENDATION_BAN;
const RECOMMENDATION_BAN_TYPES = [RECOMMENDATION_BAN, "org.matrix.mjolnir.ban"];
exports.RECOMMENDATION_BAN_TYPES = RECOMMENDATION_BAN_TYPES;

function recommendationToStable(recommendation
/*: string*/
, unstable = true)
/*: string*/
{
  if (RECOMMENDATION_BAN_TYPES.includes(recommendation)) {
    return unstable ? RECOMMENDATION_BAN_TYPES[RECOMMENDATION_BAN_TYPES.length - 1] : RECOMMENDATION_BAN;
  }

  return null;
}

class ListRule {
  constructor(entity
  /*: string*/
  , action
  /*: string*/
  , reason
  /*: string*/
  , kind
  /*: string*/
  ) {
    (0, _defineProperty2.default)(this, "_glob", void 0);
    (0, _defineProperty2.default)(this, "_entity", void 0);
    (0, _defineProperty2.default)(this, "_action", void 0);
    (0, _defineProperty2.default)(this, "_reason", void 0);
    (0, _defineProperty2.default)(this, "_kind", void 0);
    this._glob = new _MatrixGlob.MatrixGlob(entity);
    this._entity = entity;
    this._action = recommendationToStable(action, false);
    this._reason = reason;
    this._kind = kind;
  }

  get entity()
  /*: string*/
  {
    return this._entity;
  }

  get reason()
  /*: string*/
  {
    return this._reason;
  }

  get kind()
  /*: string*/
  {
    return this._kind;
  }

  get recommendation()
  /*: string*/
  {
    return this._action;
  }

  isMatch(entity
  /*: string*/
  )
  /*: boolean*/
  {
    return this._glob.test(entity);
  }

}

exports.ListRule = ListRule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tam9sbmlyL0xpc3RSdWxlLmpzIl0sIm5hbWVzIjpbIlJFQ09NTUVOREFUSU9OX0JBTiIsIlJFQ09NTUVOREFUSU9OX0JBTl9UWVBFUyIsInJlY29tbWVuZGF0aW9uVG9TdGFibGUiLCJyZWNvbW1lbmRhdGlvbiIsInVuc3RhYmxlIiwiaW5jbHVkZXMiLCJsZW5ndGgiLCJMaXN0UnVsZSIsImNvbnN0cnVjdG9yIiwiZW50aXR5IiwiYWN0aW9uIiwicmVhc29uIiwia2luZCIsIl9nbG9iIiwiTWF0cml4R2xvYiIsIl9lbnRpdHkiLCJfYWN0aW9uIiwiX3JlYXNvbiIsIl9raW5kIiwiaXNNYXRjaCIsInRlc3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFoQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTtBQUVPLE1BQU1BLGtCQUFrQixHQUFHLE9BQTNCOztBQUNBLE1BQU1DLHdCQUF3QixHQUFHLENBQUNELGtCQUFELEVBQXFCLHdCQUFyQixDQUFqQzs7O0FBRUEsU0FBU0Usc0JBQVQsQ0FBZ0NDO0FBQWhDO0FBQUEsRUFBd0RDLFFBQVEsR0FBRyxJQUFuRTtBQUFBO0FBQWlGO0FBQ3BGLE1BQUlILHdCQUF3QixDQUFDSSxRQUF6QixDQUFrQ0YsY0FBbEMsQ0FBSixFQUF1RDtBQUNuRCxXQUFPQyxRQUFRLEdBQUdILHdCQUF3QixDQUFDQSx3QkFBd0IsQ0FBQ0ssTUFBekIsR0FBa0MsQ0FBbkMsQ0FBM0IsR0FBbUVOLGtCQUFsRjtBQUNIOztBQUNELFNBQU8sSUFBUDtBQUNIOztBQUVNLE1BQU1PLFFBQU4sQ0FBZTtBQU9sQkMsRUFBQUEsV0FBVyxDQUFDQztBQUFEO0FBQUEsSUFBaUJDO0FBQWpCO0FBQUEsSUFBaUNDO0FBQWpDO0FBQUEsSUFBaURDO0FBQWpEO0FBQUEsSUFBK0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RFLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxzQkFBSixDQUFlTCxNQUFmLENBQWI7QUFDQSxTQUFLTSxPQUFMLEdBQWVOLE1BQWY7QUFDQSxTQUFLTyxPQUFMLEdBQWVkLHNCQUFzQixDQUFDUSxNQUFELEVBQVMsS0FBVCxDQUFyQztBQUNBLFNBQUtPLE9BQUwsR0FBZU4sTUFBZjtBQUNBLFNBQUtPLEtBQUwsR0FBYU4sSUFBYjtBQUNIOztBQUVELE1BQUlILE1BQUo7QUFBQTtBQUFxQjtBQUNqQixXQUFPLEtBQUtNLE9BQVo7QUFDSDs7QUFFRCxNQUFJSixNQUFKO0FBQUE7QUFBcUI7QUFDakIsV0FBTyxLQUFLTSxPQUFaO0FBQ0g7O0FBRUQsTUFBSUwsSUFBSjtBQUFBO0FBQW1CO0FBQ2YsV0FBTyxLQUFLTSxLQUFaO0FBQ0g7O0FBRUQsTUFBSWYsY0FBSjtBQUFBO0FBQTZCO0FBQ3pCLFdBQU8sS0FBS2EsT0FBWjtBQUNIOztBQUVERyxFQUFBQSxPQUFPLENBQUNWO0FBQUQ7QUFBQTtBQUFBO0FBQTBCO0FBQzdCLFdBQU8sS0FBS0ksS0FBTCxDQUFXTyxJQUFYLENBQWdCWCxNQUFoQixDQUFQO0FBQ0g7O0FBakNpQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7TWF0cml4R2xvYn0gZnJvbSBcIi4uL3V0aWxzL01hdHJpeEdsb2JcIjtcblxuLy8gSW5zcGlyYXRpb24gbGFyZ2VseSB0YWtlbiBmcm9tIE1qb2xuaXIgaXRzZWxmXG5cbmV4cG9ydCBjb25zdCBSRUNPTU1FTkRBVElPTl9CQU4gPSBcIm0uYmFuXCI7XG5leHBvcnQgY29uc3QgUkVDT01NRU5EQVRJT05fQkFOX1RZUEVTID0gW1JFQ09NTUVOREFUSU9OX0JBTiwgXCJvcmcubWF0cml4Lm1qb2xuaXIuYmFuXCJdO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVjb21tZW5kYXRpb25Ub1N0YWJsZShyZWNvbW1lbmRhdGlvbjogc3RyaW5nLCB1bnN0YWJsZSA9IHRydWUpOiBzdHJpbmcge1xuICAgIGlmIChSRUNPTU1FTkRBVElPTl9CQU5fVFlQRVMuaW5jbHVkZXMocmVjb21tZW5kYXRpb24pKSB7XG4gICAgICAgIHJldHVybiB1bnN0YWJsZSA/IFJFQ09NTUVOREFUSU9OX0JBTl9UWVBFU1tSRUNPTU1FTkRBVElPTl9CQU5fVFlQRVMubGVuZ3RoIC0gMV0gOiBSRUNPTU1FTkRBVElPTl9CQU47XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTGlzdFJ1bGUge1xuICAgIF9nbG9iOiBNYXRyaXhHbG9iO1xuICAgIF9lbnRpdHk6IHN0cmluZztcbiAgICBfYWN0aW9uOiBzdHJpbmc7XG4gICAgX3JlYXNvbjogc3RyaW5nO1xuICAgIF9raW5kOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihlbnRpdHk6IHN0cmluZywgYWN0aW9uOiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nLCBraW5kOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZ2xvYiA9IG5ldyBNYXRyaXhHbG9iKGVudGl0eSk7XG4gICAgICAgIHRoaXMuX2VudGl0eSA9IGVudGl0eTtcbiAgICAgICAgdGhpcy5fYWN0aW9uID0gcmVjb21tZW5kYXRpb25Ub1N0YWJsZShhY3Rpb24sIGZhbHNlKTtcbiAgICAgICAgdGhpcy5fcmVhc29uID0gcmVhc29uO1xuICAgICAgICB0aGlzLl9raW5kID0ga2luZDtcbiAgICB9XG5cbiAgICBnZXQgZW50aXR5KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbnRpdHk7XG4gICAgfVxuXG4gICAgZ2V0IHJlYXNvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhc29uO1xuICAgIH1cblxuICAgIGdldCBraW5kKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9raW5kO1xuICAgIH1cblxuICAgIGdldCByZWNvbW1lbmRhdGlvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aW9uO1xuICAgIH1cblxuICAgIGlzTWF0Y2goZW50aXR5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dsb2IudGVzdChlbnRpdHkpO1xuICAgIH1cbn1cbiJdfQ==