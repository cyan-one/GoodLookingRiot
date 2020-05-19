"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _matrixJsSdk = require("matrix-js-sdk");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
class Resend {
  static resendUnsentEvents(room) {
    room.getPendingEvents().filter(function (ev) {
      return ev.status === _matrixJsSdk.EventStatus.NOT_SENT;
    }).forEach(function (event) {
      Resend.resend(event);
    });
  }

  static cancelUnsentEvents(room) {
    room.getPendingEvents().filter(function (ev) {
      return ev.status === _matrixJsSdk.EventStatus.NOT_SENT;
    }).forEach(function (event) {
      Resend.removeFromQueue(event);
    });
  }

  static resend(event) {
    const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(event.getRoomId());

    _MatrixClientPeg.MatrixClientPeg.get().resendEvent(event, room).then(function (res) {
      _dispatcher.default.dispatch({
        action: 'message_sent',
        event: event
      });
    }, function (err) {
      // XXX: temporary logging to try to diagnose
      // https://github.com/vector-im/riot-web/issues/3148
      console.log('Resend got send failure: ' + err.name + '(' + err + ')');

      _dispatcher.default.dispatch({
        action: 'message_send_failed',
        event: event
      });
    });
  }

  static removeFromQueue(event) {
    _MatrixClientPeg.MatrixClientPeg.get().cancelPendingEvent(event);
  }

}

exports.default = Resend;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9SZXNlbmQuanMiXSwibmFtZXMiOlsiUmVzZW5kIiwicmVzZW5kVW5zZW50RXZlbnRzIiwicm9vbSIsImdldFBlbmRpbmdFdmVudHMiLCJmaWx0ZXIiLCJldiIsInN0YXR1cyIsIkV2ZW50U3RhdHVzIiwiTk9UX1NFTlQiLCJmb3JFYWNoIiwiZXZlbnQiLCJyZXNlbmQiLCJjYW5jZWxVbnNlbnRFdmVudHMiLCJyZW1vdmVGcm9tUXVldWUiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRSb29tIiwiZ2V0Um9vbUlkIiwicmVzZW5kRXZlbnQiLCJ0aGVuIiwicmVzIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJlcnIiLCJjb25zb2xlIiwibG9nIiwibmFtZSIsImNhbmNlbFBlbmRpbmdFdmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQSxNQUFOLENBQWE7QUFDeEIsU0FBT0Msa0JBQVAsQ0FBMEJDLElBQTFCLEVBQWdDO0FBQzVCQSxJQUFBQSxJQUFJLENBQUNDLGdCQUFMLEdBQXdCQyxNQUF4QixDQUErQixVQUFTQyxFQUFULEVBQWE7QUFDeEMsYUFBT0EsRUFBRSxDQUFDQyxNQUFILEtBQWNDLHlCQUFZQyxRQUFqQztBQUNILEtBRkQsRUFFR0MsT0FGSCxDQUVXLFVBQVNDLEtBQVQsRUFBZ0I7QUFDdkJWLE1BQUFBLE1BQU0sQ0FBQ1csTUFBUCxDQUFjRCxLQUFkO0FBQ0gsS0FKRDtBQUtIOztBQUVELFNBQU9FLGtCQUFQLENBQTBCVixJQUExQixFQUFnQztBQUM1QkEsSUFBQUEsSUFBSSxDQUFDQyxnQkFBTCxHQUF3QkMsTUFBeEIsQ0FBK0IsVUFBU0MsRUFBVCxFQUFhO0FBQ3hDLGFBQU9BLEVBQUUsQ0FBQ0MsTUFBSCxLQUFjQyx5QkFBWUMsUUFBakM7QUFDSCxLQUZELEVBRUdDLE9BRkgsQ0FFVyxVQUFTQyxLQUFULEVBQWdCO0FBQ3ZCVixNQUFBQSxNQUFNLENBQUNhLGVBQVAsQ0FBdUJILEtBQXZCO0FBQ0gsS0FKRDtBQUtIOztBQUVELFNBQU9DLE1BQVAsQ0FBY0QsS0FBZCxFQUFxQjtBQUNqQixVQUFNUixJQUFJLEdBQUdZLGlDQUFnQkMsR0FBaEIsR0FBc0JDLE9BQXRCLENBQThCTixLQUFLLENBQUNPLFNBQU4sRUFBOUIsQ0FBYjs7QUFDQUgscUNBQWdCQyxHQUFoQixHQUFzQkcsV0FBdEIsQ0FBa0NSLEtBQWxDLEVBQXlDUixJQUF6QyxFQUErQ2lCLElBQS9DLENBQW9ELFVBQVNDLEdBQVQsRUFBYztBQUM5REMsMEJBQUlDLFFBQUosQ0FBYTtBQUNUQyxRQUFBQSxNQUFNLEVBQUUsY0FEQztBQUVUYixRQUFBQSxLQUFLLEVBQUVBO0FBRkUsT0FBYjtBQUlILEtBTEQsRUFLRyxVQUFTYyxHQUFULEVBQWM7QUFDYjtBQUNBO0FBQ0FDLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDhCQUE4QkYsR0FBRyxDQUFDRyxJQUFsQyxHQUF5QyxHQUF6QyxHQUErQ0gsR0FBL0MsR0FBcUQsR0FBakU7O0FBRUFILDBCQUFJQyxRQUFKLENBQWE7QUFDVEMsUUFBQUEsTUFBTSxFQUFFLHFCQURDO0FBRVRiLFFBQUFBLEtBQUssRUFBRUE7QUFGRSxPQUFiO0FBSUgsS0FkRDtBQWVIOztBQUVELFNBQU9HLGVBQVAsQ0FBdUJILEtBQXZCLEVBQThCO0FBQzFCSSxxQ0FBZ0JDLEdBQWhCLEdBQXNCYSxrQkFBdEIsQ0FBeUNsQixLQUF6QztBQUNIOztBQXRDdUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBkaXMgZnJvbSAnLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IHsgRXZlbnRTdGF0dXMgfSBmcm9tICdtYXRyaXgtanMtc2RrJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVzZW5kIHtcbiAgICBzdGF0aWMgcmVzZW5kVW5zZW50RXZlbnRzKHJvb20pIHtcbiAgICAgICAgcm9vbS5nZXRQZW5kaW5nRXZlbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgICAgICByZXR1cm4gZXYuc3RhdHVzID09PSBFdmVudFN0YXR1cy5OT1RfU0VOVDtcbiAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgUmVzZW5kLnJlc2VuZChldmVudCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBjYW5jZWxVbnNlbnRFdmVudHMocm9vbSkge1xuICAgICAgICByb29tLmdldFBlbmRpbmdFdmVudHMoKS5maWx0ZXIoZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgICAgIHJldHVybiBldi5zdGF0dXMgPT09IEV2ZW50U3RhdHVzLk5PVF9TRU5UO1xuICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBSZXNlbmQucmVtb3ZlRnJvbVF1ZXVlKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlc2VuZChldmVudCkge1xuICAgICAgICBjb25zdCByb29tID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb20oZXZlbnQuZ2V0Um9vbUlkKCkpO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVzZW5kRXZlbnQoZXZlbnQsIHJvb20pLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ21lc3NhZ2Vfc2VudCcsXG4gICAgICAgICAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgLy8gWFhYOiB0ZW1wb3JhcnkgbG9nZ2luZyB0byB0cnkgdG8gZGlhZ25vc2VcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzMxNDhcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNlbmQgZ290IHNlbmQgZmFpbHVyZTogJyArIGVyci5uYW1lICsgJygnICsgZXJyICsgJyknKTtcblxuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdtZXNzYWdlX3NlbmRfZmFpbGVkJyxcbiAgICAgICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbW92ZUZyb21RdWV1ZShldmVudCkge1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY2FuY2VsUGVuZGluZ0V2ZW50KGV2ZW50KTtcbiAgICB9XG59XG4iXX0=