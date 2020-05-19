"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sleep = sleep;
exports.timeout = timeout;
exports.defer = defer;
exports.allSettled = allSettled;

/*
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
// Returns a promise which resolves with a given value after the given number of ms
function sleep
/*:: <T>*/
(ms
/*: number*/
, value
/*: T*/
)
/*: Promise<T>*/
{
  return new Promise(resolve => {
    setTimeout(resolve, ms, value);
  });
} // Returns a promise which resolves when the input promise resolves with its value
// or when the timeout of ms is reached with the value of given timeoutValue


async function timeout
/*:: <T>*/
(promise
/*: Promise<T>*/
, timeoutValue
/*: T*/
, ms
/*: number*/
)
/*: Promise<T>*/
{
  const timeoutPromise = new Promise(resolve => {
    const timeoutId = setTimeout(resolve, ms, timeoutValue);
    promise.then(() => {
      clearTimeout(timeoutId);
    });
  });
  return Promise.race([promise, timeoutPromise]);
}
/*:: export interface IDeferred<T> {
    resolve: (value: T) => void;
    reject: (any) => void;
    promise: Promise<T>;
}*/


// Returns a Deferred
function defer
/*:: <T>*/
()
/*: IDeferred<T>*/
{
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    resolve,
    reject,
    promise
  };
} // Promise.allSettled polyfill until browser support is stable in Firefox


function allSettled
/*:: <T>*/
(promises
/*: Promise<T>[]*/
)
/*: Promise<Array<ISettledFulfilled<T> | ISettledRejected>>*/
{
  if (Promise.allSettled) {
    return Promise.allSettled(promises);
  } // @ts-ignore - typescript isn't smart enough to see the disjoint here


  return Promise.all(promises.map(promise => {
    return promise.then(value => ({
      status: "fulfilled",
      value
    })).catch(reason => ({
      status: "rejected",
      reason
    }));
  }));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9wcm9taXNlLnRzIl0sIm5hbWVzIjpbInNsZWVwIiwibXMiLCJ2YWx1ZSIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsInRpbWVvdXQiLCJwcm9taXNlIiwidGltZW91dFZhbHVlIiwidGltZW91dFByb21pc2UiLCJ0aW1lb3V0SWQiLCJ0aGVuIiwiY2xlYXJUaW1lb3V0IiwicmFjZSIsImRlZmVyIiwicmVqZWN0IiwiX3Jlc29sdmUiLCJfcmVqZWN0IiwiYWxsU2V0dGxlZCIsInByb21pc2VzIiwiYWxsIiwibWFwIiwic3RhdHVzIiwiY2F0Y2giLCJyZWFzb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBO0FBQ08sU0FBU0E7QUFBVDtBQUFBLENBQWtCQztBQUFsQjtBQUFBLEVBQThCQztBQUE5QjtBQUFBO0FBQUE7QUFBb0Q7QUFDdkQsU0FBTyxJQUFJQyxPQUFKLENBQWFDLE9BQU8sSUFBSTtBQUFFQyxJQUFBQSxVQUFVLENBQUNELE9BQUQsRUFBVUgsRUFBVixFQUFjQyxLQUFkLENBQVY7QUFBaUMsR0FBM0QsQ0FBUDtBQUNILEMsQ0FFRDtBQUNBOzs7QUFDTyxlQUFlSTtBQUFmO0FBQUEsQ0FBMEJDO0FBQTFCO0FBQUEsRUFBK0NDO0FBQS9DO0FBQUEsRUFBZ0VQO0FBQWhFO0FBQUE7QUFBQTtBQUF3RjtBQUMzRixRQUFNUSxjQUFjLEdBQUcsSUFBSU4sT0FBSixDQUFnQkMsT0FBRCxJQUFhO0FBQy9DLFVBQU1NLFNBQVMsR0FBR0wsVUFBVSxDQUFDRCxPQUFELEVBQVVILEVBQVYsRUFBY08sWUFBZCxDQUE1QjtBQUNBRCxJQUFBQSxPQUFPLENBQUNJLElBQVIsQ0FBYSxNQUFNO0FBQ2ZDLE1BQUFBLFlBQVksQ0FBQ0YsU0FBRCxDQUFaO0FBQ0gsS0FGRDtBQUdILEdBTHNCLENBQXZCO0FBT0EsU0FBT1AsT0FBTyxDQUFDVSxJQUFSLENBQWEsQ0FBQ04sT0FBRCxFQUFVRSxjQUFWLENBQWIsQ0FBUDtBQUNIOzs7Ozs7OztBQVFEO0FBQ08sU0FBU0s7QUFBVDtBQUFBO0FBQUE7QUFBa0M7QUFDckMsTUFBSVYsT0FBSjtBQUNBLE1BQUlXLE1BQUo7QUFFQSxRQUFNUixPQUFPLEdBQUcsSUFBSUosT0FBSixDQUFlLENBQUNhLFFBQUQsRUFBV0MsT0FBWCxLQUF1QjtBQUNsRGIsSUFBQUEsT0FBTyxHQUFHWSxRQUFWO0FBQ0FELElBQUFBLE1BQU0sR0FBR0UsT0FBVDtBQUNILEdBSGUsQ0FBaEI7QUFLQSxTQUFPO0FBQUNiLElBQUFBLE9BQUQ7QUFBVVcsSUFBQUEsTUFBVjtBQUFrQlIsSUFBQUE7QUFBbEIsR0FBUDtBQUNILEMsQ0FFRDs7O0FBQ08sU0FBU1c7QUFBVDtBQUFBLENBQXVCQztBQUF2QjtBQUFBO0FBQUE7QUFBd0c7QUFDM0csTUFBSWhCLE9BQU8sQ0FBQ2UsVUFBWixFQUF3QjtBQUNwQixXQUFPZixPQUFPLENBQUNlLFVBQVIsQ0FBc0JDLFFBQXRCLENBQVA7QUFDSCxHQUgwRyxDQUszRzs7O0FBQ0EsU0FBT2hCLE9BQU8sQ0FBQ2lCLEdBQVIsQ0FBWUQsUUFBUSxDQUFDRSxHQUFULENBQWNkLE9BQUQsSUFBYTtBQUN6QyxXQUFPQSxPQUFPLENBQUNJLElBQVIsQ0FBYVQsS0FBSyxLQUFLO0FBQzFCb0IsTUFBQUEsTUFBTSxFQUFFLFdBRGtCO0FBRTFCcEIsTUFBQUE7QUFGMEIsS0FBTCxDQUFsQixFQUdIcUIsS0FIRyxDQUdHQyxNQUFNLEtBQUs7QUFDakJGLE1BQUFBLE1BQU0sRUFBRSxVQURTO0FBRWpCRSxNQUFBQTtBQUZpQixLQUFMLENBSFQsQ0FBUDtBQU9ILEdBUmtCLENBQVosQ0FBUDtBQVNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5LCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCBhIGdpdmVuIHZhbHVlIGFmdGVyIHRoZSBnaXZlbiBudW1iZXIgb2YgbXNcbmV4cG9ydCBmdW5jdGlvbiBzbGVlcDxUPihtczogbnVtYmVyLCB2YWx1ZTogVCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSA9PiB7IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMsIHZhbHVlKTsgfSkpO1xufVxuXG4vLyBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIHRoZSBpbnB1dCBwcm9taXNlIHJlc29sdmVzIHdpdGggaXRzIHZhbHVlXG4vLyBvciB3aGVuIHRoZSB0aW1lb3V0IG9mIG1zIGlzIHJlYWNoZWQgd2l0aCB0aGUgdmFsdWUgb2YgZ2l2ZW4gdGltZW91dFZhbHVlXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGltZW91dDxUPihwcm9taXNlOiBQcm9taXNlPFQ+LCB0aW1lb3V0VmFsdWU6IFQsIG1zOiBudW1iZXIpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCB0aW1lb3V0UHJvbWlzZSA9IG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMsIHRpbWVvdXRWYWx1ZSk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCB0aW1lb3V0UHJvbWlzZV0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEZWZlcnJlZDxUPiB7XG4gICAgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xuICAgIHJlamVjdDogKGFueSkgPT4gdm9pZDtcbiAgICBwcm9taXNlOiBQcm9taXNlPFQ+O1xufVxuXG4vLyBSZXR1cm5zIGEgRGVmZXJyZWRcbmV4cG9ydCBmdW5jdGlvbiBkZWZlcjxUPigpOiBJRGVmZXJyZWQ8VD4ge1xuICAgIGxldCByZXNvbHZlO1xuICAgIGxldCByZWplY3Q7XG5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8VD4oKF9yZXNvbHZlLCBfcmVqZWN0KSA9PiB7XG4gICAgICAgIHJlc29sdmUgPSBfcmVzb2x2ZTtcbiAgICAgICAgcmVqZWN0ID0gX3JlamVjdDtcbiAgICB9KTtcblxuICAgIHJldHVybiB7cmVzb2x2ZSwgcmVqZWN0LCBwcm9taXNlfTtcbn1cblxuLy8gUHJvbWlzZS5hbGxTZXR0bGVkIHBvbHlmaWxsIHVudGlsIGJyb3dzZXIgc3VwcG9ydCBpcyBzdGFibGUgaW4gRmlyZWZveFxuZXhwb3J0IGZ1bmN0aW9uIGFsbFNldHRsZWQ8VD4ocHJvbWlzZXM6IFByb21pc2U8VD5bXSk6IFByb21pc2U8QXJyYXk8SVNldHRsZWRGdWxmaWxsZWQ8VD4gfCBJU2V0dGxlZFJlamVjdGVkPj4ge1xuICAgIGlmIChQcm9taXNlLmFsbFNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsU2V0dGxlZDxUPihwcm9taXNlcyk7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZSAtIHR5cGVzY3JpcHQgaXNuJ3Qgc21hcnQgZW5vdWdoIHRvIHNlZSB0aGUgZGlzam9pbnQgaGVyZVxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcy5tYXAoKHByb21pc2UpID0+IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbih2YWx1ZSA9PiAoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImZ1bGZpbGxlZFwiLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0pKS5jYXRjaChyZWFzb24gPT4gKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJyZWplY3RlZFwiLFxuICAgICAgICAgICAgcmVhc29uLFxuICAgICAgICB9KSk7XG4gICAgfSkpO1xufVxuIl19