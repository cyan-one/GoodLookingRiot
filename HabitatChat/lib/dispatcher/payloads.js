"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AsyncActionPayload = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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

/**
 * The base dispatch type exposed by our dispatcher.
 */

/*:: export interface ActionPayload {
    [property: string]: any; // effectively makes this 'extends Object'
    action: DispatcherAction;
}*/

/**
 * The function the dispatcher calls when ready for an AsyncActionPayload. The
 * single argument is used to start a dispatch. First the dispatcher calls the
 * outer function, then when the called function is ready it calls the cb
 * function to issue the dispatch. It may call the callback repeatedly if needed.
 */

/*:: export type AsyncActionFn = (cb: (action: ActionPayload) => void) => void;*/

/**
 * An async version of ActionPayload
 */
class AsyncActionPayload
/*:: implements ActionPayload*/
{
  /**
   * The function the dispatcher should call.
   */

  /**
   * @deprecated Not used on AsyncActionPayload.
   */
  get action()
  /*: DispatcherAction*/
  {
    return "NOT_USED";
  }
  /**
   * Create a new AsyncActionPayload with the given ready function.
   * @param {AsyncActionFn} readyFn The function to be called when the
   * dispatcher is ready.
   */


  constructor(readyFn
  /*: AsyncActionFn*/
  ) {
    (0, _defineProperty2.default)(this, "fn", void 0);
    this.fn = readyFn;
  }

}

exports.AsyncActionPayload = AsyncActionPayload;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kaXNwYXRjaGVyL3BheWxvYWRzLnRzIl0sIm5hbWVzIjpbIkFzeW5jQWN0aW9uUGF5bG9hZCIsImFjdGlvbiIsImNvbnN0cnVjdG9yIiwicmVhZHlGbiIsImZuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7O0FBUUE7OztBQUdPLE1BQU1BO0FBQU47QUFBa0Q7QUFDckQ7Ozs7QUFLQTs7O0FBR0EsTUFBV0MsTUFBWDtBQUFBO0FBQXNDO0FBQ2xDLFdBQU8sVUFBUDtBQUNIO0FBRUQ7Ozs7Ozs7QUFLT0MsRUFBQUEsV0FBUCxDQUFtQkM7QUFBbkI7QUFBQSxJQUEyQztBQUFBO0FBQ3ZDLFNBQUtDLEVBQUwsR0FBVUQsT0FBVjtBQUNIOztBQXBCb0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgeyBEaXNwYXRjaGVyQWN0aW9uIH0gZnJvbSBcIi4vYWN0aW9uc1wiO1xuXG4vKipcbiAqIFRoZSBiYXNlIGRpc3BhdGNoIHR5cGUgZXhwb3NlZCBieSBvdXIgZGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25QYXlsb2FkIHtcbiAgICBbcHJvcGVydHk6IHN0cmluZ106IGFueTsgLy8gZWZmZWN0aXZlbHkgbWFrZXMgdGhpcyAnZXh0ZW5kcyBPYmplY3QnXG4gICAgYWN0aW9uOiBEaXNwYXRjaGVyQWN0aW9uO1xufVxuXG4vKipcbiAqIFRoZSBmdW5jdGlvbiB0aGUgZGlzcGF0Y2hlciBjYWxscyB3aGVuIHJlYWR5IGZvciBhbiBBc3luY0FjdGlvblBheWxvYWQuIFRoZVxuICogc2luZ2xlIGFyZ3VtZW50IGlzIHVzZWQgdG8gc3RhcnQgYSBkaXNwYXRjaC4gRmlyc3QgdGhlIGRpc3BhdGNoZXIgY2FsbHMgdGhlXG4gKiBvdXRlciBmdW5jdGlvbiwgdGhlbiB3aGVuIHRoZSBjYWxsZWQgZnVuY3Rpb24gaXMgcmVhZHkgaXQgY2FsbHMgdGhlIGNiXG4gKiBmdW5jdGlvbiB0byBpc3N1ZSB0aGUgZGlzcGF0Y2guIEl0IG1heSBjYWxsIHRoZSBjYWxsYmFjayByZXBlYXRlZGx5IGlmIG5lZWRlZC5cbiAqL1xuZXhwb3J0IHR5cGUgQXN5bmNBY3Rpb25GbiA9IChjYjogKGFjdGlvbjogQWN0aW9uUGF5bG9hZCkgPT4gdm9pZCkgPT4gdm9pZDtcblxuLyoqXG4gKiBBbiBhc3luYyB2ZXJzaW9uIG9mIEFjdGlvblBheWxvYWRcbiAqL1xuZXhwb3J0IGNsYXNzIEFzeW5jQWN0aW9uUGF5bG9hZCBpbXBsZW1lbnRzIEFjdGlvblBheWxvYWQge1xuICAgIC8qKlxuICAgICAqIFRoZSBmdW5jdGlvbiB0aGUgZGlzcGF0Y2hlciBzaG91bGQgY2FsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgZm46IEFzeW5jQWN0aW9uRm47XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBOb3QgdXNlZCBvbiBBc3luY0FjdGlvblBheWxvYWQuXG4gICAgICovXG4gICAgcHVibGljIGdldCBhY3Rpb24oKTogRGlzcGF0Y2hlckFjdGlvbiB7XG4gICAgICAgIHJldHVybiBcIk5PVF9VU0VEXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEFzeW5jQWN0aW9uUGF5bG9hZCB3aXRoIHRoZSBnaXZlbiByZWFkeSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FzeW5jQWN0aW9uRm59IHJlYWR5Rm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZVxuICAgICAqIGRpc3BhdGNoZXIgaXMgcmVhZHkuXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHJlYWR5Rm46IEFzeW5jQWN0aW9uRm4pIHtcbiAgICAgICAgdGhpcy5mbiA9IHJlYWR5Rm47XG4gICAgfVxufVxuIl19