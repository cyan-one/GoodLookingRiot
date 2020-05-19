"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.eventTriggersUnreadCount = eventTriggersUnreadCount;
exports.doesRoomHaveUnreadMessages = doesRoomHaveUnreadMessages;

var _MatrixClientPeg = require("./MatrixClientPeg");

var _shouldHideEvent = _interopRequireDefault(require("./shouldHideEvent"));

var sdk = _interopRequireWildcard(require("./index"));

var _EventTile = require("./components/views/rooms/EventTile");

/*
Copyright 2015, 2016 OpenMarket Ltd

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
 * Returns true iff this event arriving in a room should affect the room's
 * count of unread messages
 */
function eventTriggersUnreadCount(ev) {
  if (ev.sender && ev.sender.userId == _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) {
    return false;
  } else if (ev.getType() == 'm.room.member') {
    return false;
  } else if (ev.getType() == 'm.room.third_party_invite') {
    return false;
  } else if (ev.getType() == 'm.call.answer' || ev.getType() == 'm.call.hangup') {
    return false;
  } else if (ev.getType() == 'm.room.message' && ev.getContent().msgtype == 'm.notify') {
    return false;
  } else if (ev.getType() == 'm.room.aliases' || ev.getType() == 'm.room.canonical_alias') {
    return false;
  } else if (ev.getType() == 'm.room.server_acl') {
    return false;
  }

  return (0, _EventTile.haveTileForEvent)(ev);
}

function doesRoomHaveUnreadMessages(room) {
  const myUserId = _MatrixClientPeg.MatrixClientPeg.get().credentials.userId; // get the most recent read receipt sent by our account.
  // N.B. this is NOT a read marker (RM, aka "read up to marker"),
  // despite the name of the method :((


  const readUpToId = room.getEventReadUpTo(myUserId); // as we don't send RRs for our own messages, make sure we special case that
  // if *we* sent the last message into the room, we consider it not unread!
  // Should fix: https://github.com/vector-im/riot-web/issues/3263
  //             https://github.com/vector-im/riot-web/issues/2427
  // ...and possibly some of the others at
  //             https://github.com/vector-im/riot-web/issues/3363

  if (room.timeline.length && room.timeline[room.timeline.length - 1].sender && room.timeline[room.timeline.length - 1].sender.userId === myUserId) {
    return false;
  } // this just looks at whatever history we have, which if we've only just started
  // up probably won't be very much, so if the last couple of events are ones that
  // don't count, we don't know if there are any events that do count between where
  // we have and the read receipt. We could fetch more history to try & find out,
  // but currently we just guess.
  // Loop through messages, starting with the most recent...


  for (let i = room.timeline.length - 1; i >= 0; --i) {
    const ev = room.timeline[i];

    if (ev.getId() == readUpToId) {
      // If we've read up to this event, there's nothing more recent
      // that counts and we can stop looking because the user's read
      // this and everything before.
      return false;
    } else if (!(0, _shouldHideEvent.default)(ev) && eventTriggersUnreadCount(ev)) {
      // We've found a message that counts before we hit
      // the user's read receipt, so this room is definitely unread.
      return true;
    }
  } // If we got here, we didn't find a message that counted but didn't find
  // the user's read receipt either, so we guess and say that the room is
  // unread on the theory that false positives are better than false
  // negatives here.


  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9VbnJlYWQuanMiXSwibmFtZXMiOlsiZXZlbnRUcmlnZ2Vyc1VucmVhZENvdW50IiwiZXYiLCJzZW5kZXIiLCJ1c2VySWQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJjcmVkZW50aWFscyIsImdldFR5cGUiLCJnZXRDb250ZW50IiwibXNndHlwZSIsImRvZXNSb29tSGF2ZVVucmVhZE1lc3NhZ2VzIiwicm9vbSIsIm15VXNlcklkIiwicmVhZFVwVG9JZCIsImdldEV2ZW50UmVhZFVwVG8iLCJ0aW1lbGluZSIsImxlbmd0aCIsImkiLCJnZXRJZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7OztBQUlPLFNBQVNBLHdCQUFULENBQWtDQyxFQUFsQyxFQUFzQztBQUN6QyxNQUFJQSxFQUFFLENBQUNDLE1BQUgsSUFBYUQsRUFBRSxDQUFDQyxNQUFILENBQVVDLE1BQVYsSUFBb0JDLGlDQUFnQkMsR0FBaEIsR0FBc0JDLFdBQXRCLENBQWtDSCxNQUF2RSxFQUErRTtBQUMzRSxXQUFPLEtBQVA7QUFDSCxHQUZELE1BRU8sSUFBSUYsRUFBRSxDQUFDTSxPQUFILE1BQWdCLGVBQXBCLEVBQXFDO0FBQ3hDLFdBQU8sS0FBUDtBQUNILEdBRk0sTUFFQSxJQUFJTixFQUFFLENBQUNNLE9BQUgsTUFBZ0IsMkJBQXBCLEVBQWlEO0FBQ3BELFdBQU8sS0FBUDtBQUNILEdBRk0sTUFFQSxJQUFJTixFQUFFLENBQUNNLE9BQUgsTUFBZ0IsZUFBaEIsSUFBbUNOLEVBQUUsQ0FBQ00sT0FBSCxNQUFnQixlQUF2RCxFQUF3RTtBQUMzRSxXQUFPLEtBQVA7QUFDSCxHQUZNLE1BRUEsSUFBSU4sRUFBRSxDQUFDTSxPQUFILE1BQWdCLGdCQUFoQixJQUFvQ04sRUFBRSxDQUFDTyxVQUFILEdBQWdCQyxPQUFoQixJQUEyQixVQUFuRSxFQUErRTtBQUNsRixXQUFPLEtBQVA7QUFDSCxHQUZNLE1BRUEsSUFBSVIsRUFBRSxDQUFDTSxPQUFILE1BQWdCLGdCQUFoQixJQUFvQ04sRUFBRSxDQUFDTSxPQUFILE1BQWdCLHdCQUF4RCxFQUFrRjtBQUNyRixXQUFPLEtBQVA7QUFDSCxHQUZNLE1BRUEsSUFBSU4sRUFBRSxDQUFDTSxPQUFILE1BQWdCLG1CQUFwQixFQUF5QztBQUM1QyxXQUFPLEtBQVA7QUFDSDs7QUFDRCxTQUFPLGlDQUFpQk4sRUFBakIsQ0FBUDtBQUNIOztBQUVNLFNBQVNTLDBCQUFULENBQW9DQyxJQUFwQyxFQUEwQztBQUM3QyxRQUFNQyxRQUFRLEdBQUdSLGlDQUFnQkMsR0FBaEIsR0FBc0JDLFdBQXRCLENBQWtDSCxNQUFuRCxDQUQ2QyxDQUc3QztBQUNBO0FBQ0E7OztBQUNBLFFBQU1VLFVBQVUsR0FBR0YsSUFBSSxDQUFDRyxnQkFBTCxDQUFzQkYsUUFBdEIsQ0FBbkIsQ0FONkMsQ0FRN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQUlELElBQUksQ0FBQ0ksUUFBTCxDQUFjQyxNQUFkLElBQ0FMLElBQUksQ0FBQ0ksUUFBTCxDQUFjSixJQUFJLENBQUNJLFFBQUwsQ0FBY0MsTUFBZCxHQUF1QixDQUFyQyxFQUF3Q2QsTUFEeEMsSUFFQVMsSUFBSSxDQUFDSSxRQUFMLENBQWNKLElBQUksQ0FBQ0ksUUFBTCxDQUFjQyxNQUFkLEdBQXVCLENBQXJDLEVBQXdDZCxNQUF4QyxDQUErQ0MsTUFBL0MsS0FBMERTLFFBRjlELEVBRXdFO0FBQ3BFLFdBQU8sS0FBUDtBQUNILEdBbEI0QyxDQW9CN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7QUFDQSxPQUFLLElBQUlLLENBQUMsR0FBR04sSUFBSSxDQUFDSSxRQUFMLENBQWNDLE1BQWQsR0FBdUIsQ0FBcEMsRUFBdUNDLENBQUMsSUFBSSxDQUE1QyxFQUErQyxFQUFFQSxDQUFqRCxFQUFvRDtBQUNoRCxVQUFNaEIsRUFBRSxHQUFHVSxJQUFJLENBQUNJLFFBQUwsQ0FBY0UsQ0FBZCxDQUFYOztBQUVBLFFBQUloQixFQUFFLENBQUNpQixLQUFILE1BQWNMLFVBQWxCLEVBQThCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBLGFBQU8sS0FBUDtBQUNILEtBTEQsTUFLTyxJQUFJLENBQUMsOEJBQWdCWixFQUFoQixDQUFELElBQXdCRCx3QkFBd0IsQ0FBQ0MsRUFBRCxDQUFwRCxFQUEwRDtBQUM3RDtBQUNBO0FBQ0EsYUFBTyxJQUFQO0FBQ0g7QUFDSixHQXhDNEMsQ0F5QzdDO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxTQUFPLElBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBzaG91bGRIaWRlRXZlbnQgZnJvbSAnLi9zaG91bGRIaWRlRXZlbnQnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuL2luZGV4XCI7XG5pbXBvcnQge2hhdmVUaWxlRm9yRXZlbnR9IGZyb20gXCIuL2NvbXBvbmVudHMvdmlld3Mvcm9vbXMvRXZlbnRUaWxlXCI7XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmZiB0aGlzIGV2ZW50IGFycml2aW5nIGluIGEgcm9vbSBzaG91bGQgYWZmZWN0IHRoZSByb29tJ3NcbiAqIGNvdW50IG9mIHVucmVhZCBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRUcmlnZ2Vyc1VucmVhZENvdW50KGV2KSB7XG4gICAgaWYgKGV2LnNlbmRlciAmJiBldi5zZW5kZXIudXNlcklkID09IE1hdHJpeENsaWVudFBlZy5nZXQoKS5jcmVkZW50aWFscy51c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZXYuZ2V0VHlwZSgpID09ICdtLnJvb20ubWVtYmVyJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChldi5nZXRUeXBlKCkgPT0gJ20ucm9vbS50aGlyZF9wYXJ0eV9pbnZpdGUnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGV2LmdldFR5cGUoKSA9PSAnbS5jYWxsLmFuc3dlcicgfHwgZXYuZ2V0VHlwZSgpID09ICdtLmNhbGwuaGFuZ3VwJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChldi5nZXRUeXBlKCkgPT0gJ20ucm9vbS5tZXNzYWdlJyAmJiBldi5nZXRDb250ZW50KCkubXNndHlwZSA9PSAnbS5ub3RpZnknKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGV2LmdldFR5cGUoKSA9PSAnbS5yb29tLmFsaWFzZXMnIHx8IGV2LmdldFR5cGUoKSA9PSAnbS5yb29tLmNhbm9uaWNhbF9hbGlhcycpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZXYuZ2V0VHlwZSgpID09ICdtLnJvb20uc2VydmVyX2FjbCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaGF2ZVRpbGVGb3JFdmVudChldik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb2VzUm9vbUhhdmVVbnJlYWRNZXNzYWdlcyhyb29tKSB7XG4gICAgY29uc3QgbXlVc2VySWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkO1xuXG4gICAgLy8gZ2V0IHRoZSBtb3N0IHJlY2VudCByZWFkIHJlY2VpcHQgc2VudCBieSBvdXIgYWNjb3VudC5cbiAgICAvLyBOLkIuIHRoaXMgaXMgTk9UIGEgcmVhZCBtYXJrZXIgKFJNLCBha2EgXCJyZWFkIHVwIHRvIG1hcmtlclwiKSxcbiAgICAvLyBkZXNwaXRlIHRoZSBuYW1lIG9mIHRoZSBtZXRob2QgOigoXG4gICAgY29uc3QgcmVhZFVwVG9JZCA9IHJvb20uZ2V0RXZlbnRSZWFkVXBUbyhteVVzZXJJZCk7XG5cbiAgICAvLyBhcyB3ZSBkb24ndCBzZW5kIFJScyBmb3Igb3VyIG93biBtZXNzYWdlcywgbWFrZSBzdXJlIHdlIHNwZWNpYWwgY2FzZSB0aGF0XG4gICAgLy8gaWYgKndlKiBzZW50IHRoZSBsYXN0IG1lc3NhZ2UgaW50byB0aGUgcm9vbSwgd2UgY29uc2lkZXIgaXQgbm90IHVucmVhZCFcbiAgICAvLyBTaG91bGQgZml4OiBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8zMjYzXG4gICAgLy8gICAgICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMjQyN1xuICAgIC8vIC4uLmFuZCBwb3NzaWJseSBzb21lIG9mIHRoZSBvdGhlcnMgYXRcbiAgICAvLyAgICAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy8zMzYzXG4gICAgaWYgKHJvb20udGltZWxpbmUubGVuZ3RoICYmXG4gICAgICAgIHJvb20udGltZWxpbmVbcm9vbS50aW1lbGluZS5sZW5ndGggLSAxXS5zZW5kZXIgJiZcbiAgICAgICAgcm9vbS50aW1lbGluZVtyb29tLnRpbWVsaW5lLmxlbmd0aCAtIDFdLnNlbmRlci51c2VySWQgPT09IG15VXNlcklkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyB0aGlzIGp1c3QgbG9va3MgYXQgd2hhdGV2ZXIgaGlzdG9yeSB3ZSBoYXZlLCB3aGljaCBpZiB3ZSd2ZSBvbmx5IGp1c3Qgc3RhcnRlZFxuICAgIC8vIHVwIHByb2JhYmx5IHdvbid0IGJlIHZlcnkgbXVjaCwgc28gaWYgdGhlIGxhc3QgY291cGxlIG9mIGV2ZW50cyBhcmUgb25lcyB0aGF0XG4gICAgLy8gZG9uJ3QgY291bnQsIHdlIGRvbid0IGtub3cgaWYgdGhlcmUgYXJlIGFueSBldmVudHMgdGhhdCBkbyBjb3VudCBiZXR3ZWVuIHdoZXJlXG4gICAgLy8gd2UgaGF2ZSBhbmQgdGhlIHJlYWQgcmVjZWlwdC4gV2UgY291bGQgZmV0Y2ggbW9yZSBoaXN0b3J5IHRvIHRyeSAmIGZpbmQgb3V0LFxuICAgIC8vIGJ1dCBjdXJyZW50bHkgd2UganVzdCBndWVzcy5cblxuICAgIC8vIExvb3AgdGhyb3VnaCBtZXNzYWdlcywgc3RhcnRpbmcgd2l0aCB0aGUgbW9zdCByZWNlbnQuLi5cbiAgICBmb3IgKGxldCBpID0gcm9vbS50aW1lbGluZS5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBjb25zdCBldiA9IHJvb20udGltZWxpbmVbaV07XG5cbiAgICAgICAgaWYgKGV2LmdldElkKCkgPT0gcmVhZFVwVG9JZCkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgcmVhZCB1cCB0byB0aGlzIGV2ZW50LCB0aGVyZSdzIG5vdGhpbmcgbW9yZSByZWNlbnRcbiAgICAgICAgICAgIC8vIHRoYXQgY291bnRzIGFuZCB3ZSBjYW4gc3RvcCBsb29raW5nIGJlY2F1c2UgdGhlIHVzZXIncyByZWFkXG4gICAgICAgICAgICAvLyB0aGlzIGFuZCBldmVyeXRoaW5nIGJlZm9yZS5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICghc2hvdWxkSGlkZUV2ZW50KGV2KSAmJiBldmVudFRyaWdnZXJzVW5yZWFkQ291bnQoZXYpKSB7XG4gICAgICAgICAgICAvLyBXZSd2ZSBmb3VuZCBhIG1lc3NhZ2UgdGhhdCBjb3VudHMgYmVmb3JlIHdlIGhpdFxuICAgICAgICAgICAgLy8gdGhlIHVzZXIncyByZWFkIHJlY2VpcHQsIHNvIHRoaXMgcm9vbSBpcyBkZWZpbml0ZWx5IHVucmVhZC5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIHdlIGdvdCBoZXJlLCB3ZSBkaWRuJ3QgZmluZCBhIG1lc3NhZ2UgdGhhdCBjb3VudGVkIGJ1dCBkaWRuJ3QgZmluZFxuICAgIC8vIHRoZSB1c2VyJ3MgcmVhZCByZWNlaXB0IGVpdGhlciwgc28gd2UgZ3Vlc3MgYW5kIHNheSB0aGF0IHRoZSByb29tIGlzXG4gICAgLy8gdW5yZWFkIG9uIHRoZSB0aGVvcnkgdGhhdCBmYWxzZSBwb3NpdGl2ZXMgYXJlIGJldHRlciB0aGFuIGZhbHNlXG4gICAgLy8gbmVnYXRpdmVzIGhlcmUuXG4gICAgcmV0dXJuIHRydWU7XG59XG4iXX0=