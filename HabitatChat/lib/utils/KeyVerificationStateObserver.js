"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNameForEventRoom = getNameForEventRoom;
exports.userLabelForEventRoom = userLabelForEventRoom;

var _MatrixClientPeg = require("../MatrixClientPeg");

var _languageHandler = require("../languageHandler");

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
function getNameForEventRoom(userId, roomId) {
  const client = _MatrixClientPeg.MatrixClientPeg.get();

  const room = client.getRoom(roomId);
  const member = room && room.getMember(userId);
  return member ? member.name : userId;
}

function userLabelForEventRoom(userId, roomId) {
  const name = getNameForEventRoom(userId, roomId);

  if (name !== userId) {
    return (0, _languageHandler._t)("%(name)s (%(userId)s)", {
      name,
      userId
    });
  } else {
    return userId;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9LZXlWZXJpZmljYXRpb25TdGF0ZU9ic2VydmVyLmpzIl0sIm5hbWVzIjpbImdldE5hbWVGb3JFdmVudFJvb20iLCJ1c2VySWQiLCJyb29tSWQiLCJjbGllbnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJyb29tIiwiZ2V0Um9vbSIsIm1lbWJlciIsImdldE1lbWJlciIsIm5hbWUiLCJ1c2VyTGFiZWxGb3JFdmVudFJvb20iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBbUJPLFNBQVNBLG1CQUFULENBQTZCQyxNQUE3QixFQUFxQ0MsTUFBckMsRUFBNkM7QUFDaEQsUUFBTUMsTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsUUFBTUMsSUFBSSxHQUFHSCxNQUFNLENBQUNJLE9BQVAsQ0FBZUwsTUFBZixDQUFiO0FBQ0EsUUFBTU0sTUFBTSxHQUFHRixJQUFJLElBQUlBLElBQUksQ0FBQ0csU0FBTCxDQUFlUixNQUFmLENBQXZCO0FBQ0EsU0FBT08sTUFBTSxHQUFHQSxNQUFNLENBQUNFLElBQVYsR0FBaUJULE1BQTlCO0FBQ0g7O0FBRU0sU0FBU1UscUJBQVQsQ0FBK0JWLE1BQS9CLEVBQXVDQyxNQUF2QyxFQUErQztBQUNsRCxRQUFNUSxJQUFJLEdBQUdWLG1CQUFtQixDQUFDQyxNQUFELEVBQVNDLE1BQVQsQ0FBaEM7O0FBQ0EsTUFBSVEsSUFBSSxLQUFLVCxNQUFiLEVBQXFCO0FBQ2pCLFdBQU8seUJBQUcsdUJBQUgsRUFBNEI7QUFBQ1MsTUFBQUEsSUFBRDtBQUFPVCxNQUFBQTtBQUFQLEtBQTVCLENBQVA7QUFDSCxHQUZELE1BRU87QUFDSCxXQUFPQSxNQUFQO0FBQ0g7QUFDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZUZvckV2ZW50Um9vbSh1c2VySWQsIHJvb21JZCkge1xuICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICBjb25zdCByb29tID0gY2xpZW50LmdldFJvb20ocm9vbUlkKTtcbiAgICBjb25zdCBtZW1iZXIgPSByb29tICYmIHJvb20uZ2V0TWVtYmVyKHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlciA/IG1lbWJlci5uYW1lIDogdXNlcklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlckxhYmVsRm9yRXZlbnRSb29tKHVzZXJJZCwgcm9vbUlkKSB7XG4gICAgY29uc3QgbmFtZSA9IGdldE5hbWVGb3JFdmVudFJvb20odXNlcklkLCByb29tSWQpO1xuICAgIGlmIChuYW1lICE9PSB1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIF90KFwiJShuYW1lKXMgKCUodXNlcklkKXMpXCIsIHtuYW1lLCB1c2VySWR9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXNlcklkO1xuICAgIH1cbn1cbiJdfQ==