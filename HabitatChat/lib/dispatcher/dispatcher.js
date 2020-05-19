"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.defaultDispatcher = exports.MatrixDispatcher = void 0;

var _flux = require("flux");

var _payloads = require("./payloads");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
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
 * A dispatcher for ActionPayloads (the default within the SDK).
 */
class MatrixDispatcher extends _flux.Dispatcher
/*:: <ActionPayload>*/
{
  /**
   * Dispatches an event on the dispatcher's event bus.
   * @param {ActionPayload} payload Required. The payload to dispatch.
   * @param {boolean=false} sync Optional. Pass true to dispatch
   *        synchronously. This is useful for anything triggering
   *        an operation that the browser requires user interaction
   *        for. Default false (async).
   */
  dispatch(payload
  /*: T*/
  , sync = false) {
    if (payload instanceof _payloads.AsyncActionPayload) {
      payload.fn((action
      /*: ActionPayload*/
      ) => {
        this.dispatch(action, sync);
      });
      return;
    }

    if (sync) {
      super.dispatch(payload);
    } else {
      // Unless the caller explicitly asked for us to dispatch synchronously,
      // we always set a timeout to do this: The flux dispatcher complains
      // if you dispatch from within a dispatch, so rather than action
      // handlers having to worry about not calling anything that might
      // then dispatch, we just do dispatches asynchronously.
      setTimeout(super.dispatch.bind(this, payload), 0);
    }
  }
  /**
   * Shorthand for dispatch({action: Action.WHATEVER}, sync). No additional
   * properties can be included with this version.
   * @param {Action} action The action to dispatch.
   * @param {boolean=false} sync Whether the dispatch should be sync or not.
   * @see dispatch(action: ActionPayload, sync: boolean)
   */


  fire(action
  /*: Action*/
  , sync = false) {
    this.dispatch({
      action
    }, sync);
  }

}

exports.MatrixDispatcher = MatrixDispatcher;
const defaultDispatcher = new MatrixDispatcher();
exports.defaultDispatcher = defaultDispatcher;
const anyGlobal = global;

if (!anyGlobal.mxDispatcher) {
  anyGlobal.mxDispatcher = defaultDispatcher;
}

var _default = defaultDispatcher;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kaXNwYXRjaGVyL2Rpc3BhdGNoZXIudHMiXSwibmFtZXMiOlsiTWF0cml4RGlzcGF0Y2hlciIsIkRpc3BhdGNoZXIiLCJkaXNwYXRjaCIsInBheWxvYWQiLCJzeW5jIiwiQXN5bmNBY3Rpb25QYXlsb2FkIiwiZm4iLCJhY3Rpb24iLCJzZXRUaW1lb3V0IiwiYmluZCIsImZpcmUiLCJkZWZhdWx0RGlzcGF0Y2hlciIsImFueUdsb2JhbCIsImdsb2JhbCIsIm14RGlzcGF0Y2hlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFFQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQTs7O0FBR08sTUFBTUEsZ0JBQU4sU0FBK0JDO0FBQS9CO0FBQXlEO0FBQzVEOzs7Ozs7OztBQVFBQyxFQUFBQSxRQUFRLENBQTBCQztBQUExQjtBQUFBLElBQXNDQyxJQUFJLEdBQUcsS0FBN0MsRUFBb0Q7QUFDeEQsUUFBSUQsT0FBTyxZQUFZRSw0QkFBdkIsRUFBMkM7QUFDdkNGLE1BQUFBLE9BQU8sQ0FBQ0csRUFBUixDQUFXLENBQUNDO0FBQUQ7QUFBQSxXQUEyQjtBQUNsQyxhQUFLTCxRQUFMLENBQWNLLE1BQWQsRUFBc0JILElBQXRCO0FBQ0gsT0FGRDtBQUdBO0FBQ0g7O0FBRUQsUUFBSUEsSUFBSixFQUFVO0FBQ04sWUFBTUYsUUFBTixDQUFlQyxPQUFmO0FBQ0gsS0FGRCxNQUVPO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSyxNQUFBQSxVQUFVLENBQUMsTUFBTU4sUUFBTixDQUFlTyxJQUFmLENBQW9CLElBQXBCLEVBQTBCTixPQUExQixDQUFELEVBQXFDLENBQXJDLENBQVY7QUFDSDtBQUNKO0FBRUQ7Ozs7Ozs7OztBQU9BTyxFQUFBQSxJQUFJLENBQUNIO0FBQUQ7QUFBQSxJQUFpQkgsSUFBSSxHQUFHLEtBQXhCLEVBQStCO0FBQy9CLFNBQUtGLFFBQUwsQ0FBYztBQUFDSyxNQUFBQTtBQUFELEtBQWQsRUFBd0JILElBQXhCO0FBQ0g7O0FBdEMyRDs7O0FBeUN6RCxNQUFNTyxpQkFBaUIsR0FBRyxJQUFJWCxnQkFBSixFQUExQjs7QUFFUCxNQUFNWSxTQUFTLEdBQVFDLE1BQXZCOztBQUNBLElBQUksQ0FBQ0QsU0FBUyxDQUFDRSxZQUFmLEVBQTZCO0FBQ3pCRixFQUFBQSxTQUFTLENBQUNFLFlBQVYsR0FBeUJILGlCQUF6QjtBQUNIOztlQUVjQSxpQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHsgRGlzcGF0Y2hlciB9IGZyb20gXCJmbHV4XCI7XG5pbXBvcnQgeyBBY3Rpb24gfSBmcm9tIFwiLi9hY3Rpb25zXCI7XG5pbXBvcnQgeyBBY3Rpb25QYXlsb2FkLCBBc3luY0FjdGlvblBheWxvYWQgfSBmcm9tIFwiLi9wYXlsb2Fkc1wiO1xuXG4vKipcbiAqIEEgZGlzcGF0Y2hlciBmb3IgQWN0aW9uUGF5bG9hZHMgKHRoZSBkZWZhdWx0IHdpdGhpbiB0aGUgU0RLKS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeERpc3BhdGNoZXIgZXh0ZW5kcyBEaXNwYXRjaGVyPEFjdGlvblBheWxvYWQ+IHtcbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaGVzIGFuIGV2ZW50IG9uIHRoZSBkaXNwYXRjaGVyJ3MgZXZlbnQgYnVzLlxuICAgICAqIEBwYXJhbSB7QWN0aW9uUGF5bG9hZH0gcGF5bG9hZCBSZXF1aXJlZC4gVGhlIHBheWxvYWQgdG8gZGlzcGF0Y2guXG4gICAgICogQHBhcmFtIHtib29sZWFuPWZhbHNlfSBzeW5jIE9wdGlvbmFsLiBQYXNzIHRydWUgdG8gZGlzcGF0Y2hcbiAgICAgKiAgICAgICAgc3luY2hyb25vdXNseS4gVGhpcyBpcyB1c2VmdWwgZm9yIGFueXRoaW5nIHRyaWdnZXJpbmdcbiAgICAgKiAgICAgICAgYW4gb3BlcmF0aW9uIHRoYXQgdGhlIGJyb3dzZXIgcmVxdWlyZXMgdXNlciBpbnRlcmFjdGlvblxuICAgICAqICAgICAgICBmb3IuIERlZmF1bHQgZmFsc2UgKGFzeW5jKS5cbiAgICAgKi9cbiAgICBkaXNwYXRjaDxUIGV4dGVuZHMgQWN0aW9uUGF5bG9hZD4ocGF5bG9hZDogVCwgc3luYyA9IGZhbHNlKSB7XG4gICAgICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQXN5bmNBY3Rpb25QYXlsb2FkKSB7XG4gICAgICAgICAgICBwYXlsb2FkLmZuKChhY3Rpb246IEFjdGlvblBheWxvYWQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoKGFjdGlvbiwgc3luYyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzeW5jKSB7XG4gICAgICAgICAgICBzdXBlci5kaXNwYXRjaChwYXlsb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFVubGVzcyB0aGUgY2FsbGVyIGV4cGxpY2l0bHkgYXNrZWQgZm9yIHVzIHRvIGRpc3BhdGNoIHN5bmNocm9ub3VzbHksXG4gICAgICAgICAgICAvLyB3ZSBhbHdheXMgc2V0IGEgdGltZW91dCB0byBkbyB0aGlzOiBUaGUgZmx1eCBkaXNwYXRjaGVyIGNvbXBsYWluc1xuICAgICAgICAgICAgLy8gaWYgeW91IGRpc3BhdGNoIGZyb20gd2l0aGluIGEgZGlzcGF0Y2gsIHNvIHJhdGhlciB0aGFuIGFjdGlvblxuICAgICAgICAgICAgLy8gaGFuZGxlcnMgaGF2aW5nIHRvIHdvcnJ5IGFib3V0IG5vdCBjYWxsaW5nIGFueXRoaW5nIHRoYXQgbWlnaHRcbiAgICAgICAgICAgIC8vIHRoZW4gZGlzcGF0Y2gsIHdlIGp1c3QgZG8gZGlzcGF0Y2hlcyBhc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoc3VwZXIuZGlzcGF0Y2guYmluZCh0aGlzLCBwYXlsb2FkKSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG9ydGhhbmQgZm9yIGRpc3BhdGNoKHthY3Rpb246IEFjdGlvbi5XSEFURVZFUn0sIHN5bmMpLiBObyBhZGRpdGlvbmFsXG4gICAgICogcHJvcGVydGllcyBjYW4gYmUgaW5jbHVkZWQgd2l0aCB0aGlzIHZlcnNpb24uXG4gICAgICogQHBhcmFtIHtBY3Rpb259IGFjdGlvbiBUaGUgYWN0aW9uIHRvIGRpc3BhdGNoLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbj1mYWxzZX0gc3luYyBXaGV0aGVyIHRoZSBkaXNwYXRjaCBzaG91bGQgYmUgc3luYyBvciBub3QuXG4gICAgICogQHNlZSBkaXNwYXRjaChhY3Rpb246IEFjdGlvblBheWxvYWQsIHN5bmM6IGJvb2xlYW4pXG4gICAgICovXG4gICAgZmlyZShhY3Rpb246IEFjdGlvbiwgc3luYyA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goe2FjdGlvbn0sIHN5bmMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHREaXNwYXRjaGVyID0gbmV3IE1hdHJpeERpc3BhdGNoZXIoKTtcblxuY29uc3QgYW55R2xvYmFsID0gPGFueT5nbG9iYWw7XG5pZiAoIWFueUdsb2JhbC5teERpc3BhdGNoZXIpIHtcbiAgICBhbnlHbG9iYWwubXhEaXNwYXRjaGVyID0gZGVmYXVsdERpc3BhdGNoZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmF1bHREaXNwYXRjaGVyO1xuIl19