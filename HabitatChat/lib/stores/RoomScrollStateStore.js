"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
Copyright 2017 New Vector Ltd

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
 * Stores where the user has scrolled to in each room
 */
class RoomScrollStateStore {
  constructor() {
    // A map from room id to scroll state.
    //
    // If there is no special scroll state (ie, we are following the live
    // timeline), the scroll state is null. Otherwise, it is an object with
    // the following properties:
    //
    //    focussedEvent: the ID of the 'focussed' event. Typically this is
    //        the last event fully visible in the viewport, though if we
    //        have done an explicit scroll to an explicit event, it will be
    //        that event.
    //
    //    pixelOffset: the number of pixels the window is scrolled down
    //        from the focussedEvent.
    this._scrollStateMap = {};
  }

  getScrollState(roomId) {
    return this._scrollStateMap[roomId];
  }

  setScrollState(roomId, scrollState) {
    this._scrollStateMap[roomId] = scrollState;
  }

}

if (global.mx_RoomScrollStateStore === undefined) {
  global.mx_RoomScrollStateStore = new RoomScrollStateStore();
}

var _default = global.mx_RoomScrollStateStore;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvUm9vbVNjcm9sbFN0YXRlU3RvcmUuanMiXSwibmFtZXMiOlsiUm9vbVNjcm9sbFN0YXRlU3RvcmUiLCJjb25zdHJ1Y3RvciIsIl9zY3JvbGxTdGF0ZU1hcCIsImdldFNjcm9sbFN0YXRlIiwicm9vbUlkIiwic2V0U2Nyb2xsU3RhdGUiLCJzY3JvbGxTdGF0ZSIsImdsb2JhbCIsIm14X1Jvb21TY3JvbGxTdGF0ZVN0b3JlIiwidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7OztBQUdBLE1BQU1BLG9CQUFOLENBQTJCO0FBQ3ZCQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLGVBQUwsR0FBdUIsRUFBdkI7QUFDSDs7QUFFREMsRUFBQUEsY0FBYyxDQUFDQyxNQUFELEVBQVM7QUFDbkIsV0FBTyxLQUFLRixlQUFMLENBQXFCRSxNQUFyQixDQUFQO0FBQ0g7O0FBRURDLEVBQUFBLGNBQWMsQ0FBQ0QsTUFBRCxFQUFTRSxXQUFULEVBQXNCO0FBQ2hDLFNBQUtKLGVBQUwsQ0FBcUJFLE1BQXJCLElBQStCRSxXQUEvQjtBQUNIOztBQXhCc0I7O0FBMkIzQixJQUFJQyxNQUFNLENBQUNDLHVCQUFQLEtBQW1DQyxTQUF2QyxFQUFrRDtBQUM5Q0YsRUFBQUEsTUFBTSxDQUFDQyx1QkFBUCxHQUFpQyxJQUFJUixvQkFBSixFQUFqQztBQUNIOztlQUNjTyxNQUFNLENBQUNDLHVCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLyoqXG4gKiBTdG9yZXMgd2hlcmUgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHRvIGluIGVhY2ggcm9vbVxuICovXG5jbGFzcyBSb29tU2Nyb2xsU3RhdGVTdG9yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIEEgbWFwIGZyb20gcm9vbSBpZCB0byBzY3JvbGwgc3RhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHNwZWNpYWwgc2Nyb2xsIHN0YXRlIChpZSwgd2UgYXJlIGZvbGxvd2luZyB0aGUgbGl2ZVxuICAgICAgICAvLyB0aW1lbGluZSksIHRoZSBzY3JvbGwgc3RhdGUgaXMgbnVsbC4gT3RoZXJ3aXNlLCBpdCBpcyBhbiBvYmplY3Qgd2l0aFxuICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgIGZvY3Vzc2VkRXZlbnQ6IHRoZSBJRCBvZiB0aGUgJ2ZvY3Vzc2VkJyBldmVudC4gVHlwaWNhbGx5IHRoaXMgaXNcbiAgICAgICAgLy8gICAgICAgIHRoZSBsYXN0IGV2ZW50IGZ1bGx5IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0LCB0aG91Z2ggaWYgd2VcbiAgICAgICAgLy8gICAgICAgIGhhdmUgZG9uZSBhbiBleHBsaWNpdCBzY3JvbGwgdG8gYW4gZXhwbGljaXQgZXZlbnQsIGl0IHdpbGwgYmVcbiAgICAgICAgLy8gICAgICAgIHRoYXQgZXZlbnQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgIHBpeGVsT2Zmc2V0OiB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGUgd2luZG93IGlzIHNjcm9sbGVkIGRvd25cbiAgICAgICAgLy8gICAgICAgIGZyb20gdGhlIGZvY3Vzc2VkRXZlbnQuXG4gICAgICAgIHRoaXMuX3Njcm9sbFN0YXRlTWFwID0ge307XG4gICAgfVxuXG4gICAgZ2V0U2Nyb2xsU3RhdGUocm9vbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY3JvbGxTdGF0ZU1hcFtyb29tSWRdO1xuICAgIH1cblxuICAgIHNldFNjcm9sbFN0YXRlKHJvb21JZCwgc2Nyb2xsU3RhdGUpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsU3RhdGVNYXBbcm9vbUlkXSA9IHNjcm9sbFN0YXRlO1xuICAgIH1cbn1cblxuaWYgKGdsb2JhbC5teF9Sb29tU2Nyb2xsU3RhdGVTdG9yZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZ2xvYmFsLm14X1Jvb21TY3JvbGxTdGF0ZVN0b3JlID0gbmV3IFJvb21TY3JvbGxTdGF0ZVN0b3JlKCk7XG59XG5leHBvcnQgZGVmYXVsdCBnbG9iYWwubXhfUm9vbVNjcm9sbFN0YXRlU3RvcmU7XG4iXX0=