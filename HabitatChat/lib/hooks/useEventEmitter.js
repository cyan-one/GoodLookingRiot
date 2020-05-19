"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useEventEmitter = void 0;

var _react = require("react");

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
// Hook to wrap event emitter on and removeListener in hook lifecycle
const useEventEmitter = (emitter, eventName, handler) => {
  // Create a ref that stores handler
  const savedHandler = (0, _react.useRef)(); // Update ref.current value if handler changes.

  (0, _react.useEffect)(() => {
    savedHandler.current = handler;
  }, [handler]);
  (0, _react.useEffect)(() => {
    // allow disabling this hook by passing a falsy emitter
    if (!emitter) return; // Create event listener that calls handler function stored in ref

    const eventListener = event => savedHandler.current(event); // Add event listener


    emitter.on(eventName, eventListener); // Remove event listener on cleanup

    return () => {
      emitter.removeListener(eventName, eventListener);
    };
  }, [eventName, emitter] // Re-run if eventName or emitter changes
  );
};

exports.useEventEmitter = useEventEmitter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ob29rcy91c2VFdmVudEVtaXR0ZXIuanMiXSwibmFtZXMiOlsidXNlRXZlbnRFbWl0dGVyIiwiZW1pdHRlciIsImV2ZW50TmFtZSIsImhhbmRsZXIiLCJzYXZlZEhhbmRsZXIiLCJjdXJyZW50IiwiZXZlbnRMaXN0ZW5lciIsImV2ZW50Iiwib24iLCJyZW1vdmVMaXN0ZW5lciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWdCQTs7QUFoQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTtBQUNPLE1BQU1BLGVBQWUsR0FBRyxDQUFDQyxPQUFELEVBQVVDLFNBQVYsRUFBcUJDLE9BQXJCLEtBQWlDO0FBQzVEO0FBQ0EsUUFBTUMsWUFBWSxHQUFHLG9CQUFyQixDQUY0RCxDQUk1RDs7QUFDQSx3QkFBVSxNQUFNO0FBQ1pBLElBQUFBLFlBQVksQ0FBQ0MsT0FBYixHQUF1QkYsT0FBdkI7QUFDSCxHQUZELEVBRUcsQ0FBQ0EsT0FBRCxDQUZIO0FBSUEsd0JBQ0ksTUFBTTtBQUNGO0FBQ0EsUUFBSSxDQUFDRixPQUFMLEVBQWMsT0FGWixDQUlGOztBQUNBLFVBQU1LLGFBQWEsR0FBR0MsS0FBSyxJQUFJSCxZQUFZLENBQUNDLE9BQWIsQ0FBcUJFLEtBQXJCLENBQS9CLENBTEUsQ0FPRjs7O0FBQ0FOLElBQUFBLE9BQU8sQ0FBQ08sRUFBUixDQUFXTixTQUFYLEVBQXNCSSxhQUF0QixFQVJFLENBVUY7O0FBQ0EsV0FBTyxNQUFNO0FBQ1RMLE1BQUFBLE9BQU8sQ0FBQ1EsY0FBUixDQUF1QlAsU0FBdkIsRUFBa0NJLGFBQWxDO0FBQ0gsS0FGRDtBQUdILEdBZkwsRUFnQkksQ0FBQ0osU0FBRCxFQUFZRCxPQUFaLENBaEJKLENBZ0IwQjtBQWhCMUI7QUFrQkgsQ0EzQk0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge3VzZVJlZiwgdXNlRWZmZWN0fSBmcm9tIFwicmVhY3RcIjtcblxuLy8gSG9vayB0byB3cmFwIGV2ZW50IGVtaXR0ZXIgb24gYW5kIHJlbW92ZUxpc3RlbmVyIGluIGhvb2sgbGlmZWN5Y2xlXG5leHBvcnQgY29uc3QgdXNlRXZlbnRFbWl0dGVyID0gKGVtaXR0ZXIsIGV2ZW50TmFtZSwgaGFuZGxlcikgPT4ge1xuICAgIC8vIENyZWF0ZSBhIHJlZiB0aGF0IHN0b3JlcyBoYW5kbGVyXG4gICAgY29uc3Qgc2F2ZWRIYW5kbGVyID0gdXNlUmVmKCk7XG5cbiAgICAvLyBVcGRhdGUgcmVmLmN1cnJlbnQgdmFsdWUgaWYgaGFuZGxlciBjaGFuZ2VzLlxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHNhdmVkSGFuZGxlci5jdXJyZW50ID0gaGFuZGxlcjtcbiAgICB9LCBbaGFuZGxlcl0pO1xuXG4gICAgdXNlRWZmZWN0KFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAvLyBhbGxvdyBkaXNhYmxpbmcgdGhpcyBob29rIGJ5IHBhc3NpbmcgYSBmYWxzeSBlbWl0dGVyXG4gICAgICAgICAgICBpZiAoIWVtaXR0ZXIpIHJldHVybjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2FsbHMgaGFuZGxlciBmdW5jdGlvbiBzdG9yZWQgaW4gcmVmXG4gICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gZXZlbnQgPT4gc2F2ZWRIYW5kbGVyLmN1cnJlbnQoZXZlbnQpO1xuXG4gICAgICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgIGVtaXR0ZXIub24oZXZlbnROYW1lLCBldmVudExpc3RlbmVyKTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGV2ZW50IGxpc3RlbmVyIG9uIGNsZWFudXBcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgW2V2ZW50TmFtZSwgZW1pdHRlcl0sIC8vIFJlLXJ1biBpZiBldmVudE5hbWUgb3IgZW1pdHRlciBjaGFuZ2VzXG4gICAgKTtcbn07XG4iXX0=