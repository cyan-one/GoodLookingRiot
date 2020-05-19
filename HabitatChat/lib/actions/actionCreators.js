"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncAction = asyncAction;

var _payloads = require("../dispatcher/payloads");

/*
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
 * Create an action thunk that will dispatch actions indicating the current
 * status of the Promise returned by fn.
 *
 * @param {string} id the id to give the dispatched actions. This is given a
 *                    suffix determining whether it is pending, successful or
 *                    a failure.
 * @param {function} fn a function that returns a Promise.
 * @param {function?} pendingFn a function that returns an object to assign
 *                              to the `request` key of the ${id}.pending
 *                              payload.
 * @returns {AsyncActionPayload} an async action payload. Includes a function
 *                     that uses its single argument as a dispatch function
 *                     to dispatch the following actions:
 *                         `${id}.pending` and either
 *                         `${id}.success` or
 *                         `${id}.failure`.
 *
 *                     The shape of each are:
 *                     { action: '${id}.pending', request }
 *                     { action: '${id}.success', result }
 *                     { action: '${id}.failure', err }
 *
 *                     where `request` is returned by `pendingFn` and
 *                     result is the result of the promise returned by
 *                     `fn`.
 */
function asyncAction(id
/*: string*/
, fn
/*: () => Promise<any>*/
, pendingFn
/*: () => any | null*/
)
/*: AsyncActionPayload*/
{
  const helper = dispatch => {
    dispatch({
      action: id + '.pending',
      request: typeof pendingFn === 'function' ? pendingFn() : undefined
    });
    fn().then(result => {
      dispatch({
        action: id + '.success',
        result
      });
    }).catch(err => {
      dispatch({
        action: id + '.failure',
        err
      });
    });
  };

  return new _payloads.AsyncActionPayload(helper);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY3Rpb25zL2FjdGlvbkNyZWF0b3JzLnRzIl0sIm5hbWVzIjpbImFzeW5jQWN0aW9uIiwiaWQiLCJmbiIsInBlbmRpbmdGbiIsImhlbHBlciIsImRpc3BhdGNoIiwiYWN0aW9uIiwicmVxdWVzdCIsInVuZGVmaW5lZCIsInRoZW4iLCJyZXN1bHQiLCJjYXRjaCIsImVyciIsIkFzeW5jQWN0aW9uUGF5bG9hZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWlCQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQk8sU0FBU0EsV0FBVCxDQUFxQkM7QUFBckI7QUFBQSxFQUFpQ0M7QUFBakM7QUFBQSxFQUF5REM7QUFBekQ7QUFBQTtBQUFBO0FBQTBHO0FBQzdHLFFBQU1DLE1BQU0sR0FBSUMsUUFBRCxJQUFjO0FBQ3pCQSxJQUFBQSxRQUFRLENBQUM7QUFDTEMsTUFBQUEsTUFBTSxFQUFFTCxFQUFFLEdBQUcsVUFEUjtBQUVMTSxNQUFBQSxPQUFPLEVBQUUsT0FBT0osU0FBUCxLQUFxQixVQUFyQixHQUFrQ0EsU0FBUyxFQUEzQyxHQUFnREs7QUFGcEQsS0FBRCxDQUFSO0FBSUFOLElBQUFBLEVBQUUsR0FBR08sSUFBTCxDQUFXQyxNQUFELElBQVk7QUFDbEJMLE1BQUFBLFFBQVEsQ0FBQztBQUFDQyxRQUFBQSxNQUFNLEVBQUVMLEVBQUUsR0FBRyxVQUFkO0FBQTBCUyxRQUFBQTtBQUExQixPQUFELENBQVI7QUFDSCxLQUZELEVBRUdDLEtBRkgsQ0FFVUMsR0FBRCxJQUFTO0FBQ2RQLE1BQUFBLFFBQVEsQ0FBQztBQUFDQyxRQUFBQSxNQUFNLEVBQUVMLEVBQUUsR0FBRyxVQUFkO0FBQTBCVyxRQUFBQTtBQUExQixPQUFELENBQVI7QUFDSCxLQUpEO0FBS0gsR0FWRDs7QUFXQSxTQUFPLElBQUlDLDRCQUFKLENBQXVCVCxNQUF2QixDQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHsgQXN5bmNBY3Rpb25QYXlsb2FkIH0gZnJvbSBcIi4uL2Rpc3BhdGNoZXIvcGF5bG9hZHNcIjtcblxuLyoqXG4gKiBDcmVhdGUgYW4gYWN0aW9uIHRodW5rIHRoYXQgd2lsbCBkaXNwYXRjaCBhY3Rpb25zIGluZGljYXRpbmcgdGhlIGN1cnJlbnRcbiAqIHN0YXR1cyBvZiB0aGUgUHJvbWlzZSByZXR1cm5lZCBieSBmbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgdGhlIGlkIHRvIGdpdmUgdGhlIGRpc3BhdGNoZWQgYWN0aW9ucy4gVGhpcyBpcyBnaXZlbiBhXG4gKiAgICAgICAgICAgICAgICAgICAgc3VmZml4IGRldGVybWluaW5nIHdoZXRoZXIgaXQgaXMgcGVuZGluZywgc3VjY2Vzc2Z1bCBvclxuICogICAgICAgICAgICAgICAgICAgIGEgZmFpbHVyZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgUHJvbWlzZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24/fSBwZW5kaW5nRm4gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gb2JqZWN0IHRvIGFzc2lnblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB0aGUgYHJlcXVlc3RgIGtleSBvZiB0aGUgJHtpZH0ucGVuZGluZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkLlxuICogQHJldHVybnMge0FzeW5jQWN0aW9uUGF5bG9hZH0gYW4gYXN5bmMgYWN0aW9uIHBheWxvYWQuIEluY2x1ZGVzIGEgZnVuY3Rpb25cbiAqICAgICAgICAgICAgICAgICAgICAgdGhhdCB1c2VzIGl0cyBzaW5nbGUgYXJndW1lbnQgYXMgYSBkaXNwYXRjaCBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICB0byBkaXNwYXRjaCB0aGUgZm9sbG93aW5nIGFjdGlvbnM6XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBgJHtpZH0ucGVuZGluZ2AgYW5kIGVpdGhlclxuICogICAgICAgICAgICAgICAgICAgICAgICAgYCR7aWR9LnN1Y2Nlc3NgIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBgJHtpZH0uZmFpbHVyZWAuXG4gKlxuICogICAgICAgICAgICAgICAgICAgICBUaGUgc2hhcGUgb2YgZWFjaCBhcmU6XG4gKiAgICAgICAgICAgICAgICAgICAgIHsgYWN0aW9uOiAnJHtpZH0ucGVuZGluZycsIHJlcXVlc3QgfVxuICogICAgICAgICAgICAgICAgICAgICB7IGFjdGlvbjogJyR7aWR9LnN1Y2Nlc3MnLCByZXN1bHQgfVxuICogICAgICAgICAgICAgICAgICAgICB7IGFjdGlvbjogJyR7aWR9LmZhaWx1cmUnLCBlcnIgfVxuICpcbiAqICAgICAgICAgICAgICAgICAgICAgd2hlcmUgYHJlcXVlc3RgIGlzIHJldHVybmVkIGJ5IGBwZW5kaW5nRm5gIGFuZFxuICogICAgICAgICAgICAgICAgICAgICByZXN1bHQgaXMgdGhlIHJlc3VsdCBvZiB0aGUgcHJvbWlzZSByZXR1cm5lZCBieVxuICogICAgICAgICAgICAgICAgICAgICBgZm5gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXN5bmNBY3Rpb24oaWQ6IHN0cmluZywgZm46ICgpID0+IFByb21pc2U8YW55PiwgcGVuZGluZ0ZuOiAoKSA9PiBhbnkgfCBudWxsKTogQXN5bmNBY3Rpb25QYXlsb2FkIHtcbiAgICBjb25zdCBoZWxwZXIgPSAoZGlzcGF0Y2gpID0+IHtcbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiBpZCArICcucGVuZGluZycsXG4gICAgICAgICAgICByZXF1ZXN0OiB0eXBlb2YgcGVuZGluZ0ZuID09PSAnZnVuY3Rpb24nID8gcGVuZGluZ0ZuKCkgOiB1bmRlZmluZWQsXG4gICAgICAgIH0pO1xuICAgICAgICBmbigpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgZGlzcGF0Y2goe2FjdGlvbjogaWQgKyAnLnN1Y2Nlc3MnLCByZXN1bHR9KTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgZGlzcGF0Y2goe2FjdGlvbjogaWQgKyAnLmZhaWx1cmUnLCBlcnJ9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IEFzeW5jQWN0aW9uUGF5bG9hZChoZWxwZXIpO1xufVxuIl19