"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actionCreators = require("./actionCreators");

var _RoomListStore = _interopRequireWildcard(require("../stores/RoomListStore"));

var _Modal = _interopRequireDefault(require("../Modal"));

var Rooms = _interopRequireWildcard(require("../Rooms"));

var _languageHandler = require("../languageHandler");

var sdk = _interopRequireWildcard(require("../index"));

/*
Copyright 2018 New Vector Ltd
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
class RoomListActions {
  /**
   * Creates an action thunk that will do an asynchronous request to
   * tag room.
   *
   * @param {MatrixClient} matrixClient the matrix client to set the
   *                                    account data on.
   * @param {Room} room the room to tag.
   * @param {string} oldTag the tag to remove (unless oldTag ==== newTag)
   * @param {string} newTag the tag with which to tag the room.
   * @param {?number} oldIndex the previous position of the room in the
   *                           list of rooms.
   * @param {?number} newIndex the new position of the room in the list
   *                           of rooms.
   * @returns {AsyncActionPayload} an async action payload
   * @see asyncAction
   */
  static tagRoom(matrixClient
  /*: MatrixClient*/
  , room
  /*: Room*/
  , oldTag
  /*: string*/
  , newTag
  /*: string*/
  , oldIndex
  /*: number | null*/
  , newIndex
  /*: number | null*/
  )
  /*: AsyncActionPayload*/
  {
    let metaData = null; // Is the tag ordered manually?

    if (newTag && !newTag.match(/^(m\.lowpriority|im\.vector\.fake\.(invite|recent|direct|archived))$/)) {
      const lists = _RoomListStore.default.getRoomLists();

      const newList = [...lists[newTag]];
      newList.sort((a, b) => a.tags[newTag].order - b.tags[newTag].order); // If the room was moved "down" (increasing index) in the same list we
      // need to use the orders of the tiles with indices shifted by +1

      const offset = newTag === oldTag && oldIndex < newIndex ? 1 : 0;
      const indexBefore = offset + newIndex - 1;
      const indexAfter = offset + newIndex;
      const prevOrder = indexBefore <= 0 ? 0 : newList[indexBefore].tags[newTag].order;
      const nextOrder = indexAfter >= newList.length ? 1 : newList[indexAfter].tags[newTag].order;
      metaData = {
        order: (prevOrder + nextOrder) / 2.0
      };
    }

    return (0, _actionCreators.asyncAction)('RoomListActions.tagRoom', () => {
      const promises = [];
      const roomId = room.roomId; // Evil hack to get DMs behaving

      if (oldTag === undefined && newTag === _RoomListStore.TAG_DM || oldTag === _RoomListStore.TAG_DM && newTag === undefined) {
        return Rooms.guessAndSetDMRoom(room, newTag === _RoomListStore.TAG_DM).catch(err => {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Failed to set direct chat tag " + err);

          _Modal.default.createTrackedDialog('Failed to set direct chat tag', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Failed to set direct chat tag'),
            description: err && err.message ? err.message : (0, _languageHandler._t)('Operation failed')
          });
        });
      }

      const hasChangedSubLists = oldTag !== newTag; // More evilness: We will still be dealing with moving to favourites/low prio,
      // but we avoid ever doing a request with TAG_DM.
      //
      // if we moved lists, remove the old tag

      if (oldTag && oldTag !== _RoomListStore.TAG_DM && hasChangedSubLists) {
        const promiseToDelete = matrixClient.deleteRoomTag(roomId, oldTag).catch(function (err) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Failed to remove tag " + oldTag + " from room: " + err);

          _Modal.default.createTrackedDialog('Failed to remove tag from room', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Failed to remove tag %(tagName)s from room', {
              tagName: oldTag
            }),
            description: err && err.message ? err.message : (0, _languageHandler._t)('Operation failed')
          });
        });
        promises.push(promiseToDelete);
      } // if we moved lists or the ordering changed, add the new tag


      if (newTag && newTag !== _RoomListStore.TAG_DM && (hasChangedSubLists || metaData)) {
        // metaData is the body of the PUT to set the tag, so it must
        // at least be an empty object.
        metaData = metaData || {};
        const promiseToAdd = matrixClient.setRoomTag(roomId, newTag, metaData).catch(function (err) {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
          console.error("Failed to add tag " + newTag + " to room: " + err);

          _Modal.default.createTrackedDialog('Failed to add tag to room', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Failed to add tag %(tagName)s to room', {
              tagName: newTag
            }),
            description: err && err.message ? err.message : (0, _languageHandler._t)('Operation failed')
          });

          throw err;
        });
        promises.push(promiseToAdd);
      }

      return Promise.all(promises);
    }, () => {
      // For an optimistic update
      return {
        room,
        oldTag,
        newTag,
        metaData
      };
    });
  }

}

exports.default = RoomListActions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY3Rpb25zL1Jvb21MaXN0QWN0aW9ucy50cyJdLCJuYW1lcyI6WyJSb29tTGlzdEFjdGlvbnMiLCJ0YWdSb29tIiwibWF0cml4Q2xpZW50Iiwicm9vbSIsIm9sZFRhZyIsIm5ld1RhZyIsIm9sZEluZGV4IiwibmV3SW5kZXgiLCJtZXRhRGF0YSIsIm1hdGNoIiwibGlzdHMiLCJSb29tTGlzdFN0b3JlIiwiZ2V0Um9vbUxpc3RzIiwibmV3TGlzdCIsInNvcnQiLCJhIiwiYiIsInRhZ3MiLCJvcmRlciIsIm9mZnNldCIsImluZGV4QmVmb3JlIiwiaW5kZXhBZnRlciIsInByZXZPcmRlciIsIm5leHRPcmRlciIsImxlbmd0aCIsInByb21pc2VzIiwicm9vbUlkIiwidW5kZWZpbmVkIiwiVEFHX0RNIiwiUm9vbXMiLCJndWVzc0FuZFNldERNUm9vbSIsImNhdGNoIiwiZXJyIiwiRXJyb3JEaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjb25zb2xlIiwiZXJyb3IiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsImhhc0NoYW5nZWRTdWJMaXN0cyIsInByb21pc2VUb0RlbGV0ZSIsImRlbGV0ZVJvb21UYWciLCJ0YWdOYW1lIiwicHVzaCIsInByb21pc2VUb0FkZCIsInNldFJvb21UYWciLCJQcm9taXNlIiwiYWxsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQmUsTUFBTUEsZUFBTixDQUFzQjtBQUNqQzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQSxTQUFjQyxPQUFkLENBQ0lDO0FBREo7QUFBQSxJQUNnQ0M7QUFEaEM7QUFBQSxJQUVJQztBQUZKO0FBQUEsSUFFb0JDO0FBRnBCO0FBQUEsSUFHSUM7QUFISjtBQUFBLElBRzZCQztBQUg3QjtBQUFBO0FBQUE7QUFJc0I7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QUFBQ00sY0FBQUEsT0FBTyxFQUFFekM7QUFBVixhQUE1QyxDQUQ2RDtBQUVwRW9DLFlBQUFBLFdBQVcsRUFBSVQsR0FBRyxJQUFJQSxHQUFHLENBQUNVLE9BQVosR0FBdUJWLEdBQUcsQ0FBQ1UsT0FBM0IsR0FBcUMseUJBQUcsa0JBQUg7QUFGaUIsV0FBeEU7O0FBS0EsZ0JBQU1WLEdBQU47QUFDSCxTQVRvQixDQUFyQjtBQVdBUCxRQUFBQSxRQUFRLENBQUNzQixJQUFULENBQWNDLFlBQWQ7QUFDSDs7QUFFRCxhQUFPRSxPQUFPLENBQUNDLEdBQVIsQ0FBWTFCLFFBQVosQ0FBUDtBQUNILEtBbEVNLEVBa0VKLE1BQU07QUFDTDtBQUNBLGFBQU87QUFDSHRCLFFBQUFBLElBREc7QUFDR0MsUUFBQUEsTUFESDtBQUNXQyxRQUFBQSxNQURYO0FBQ21CRyxRQUFBQTtBQURuQixPQUFQO0FBR0gsS0F2RU0sQ0FBUDtBQXdFSDs7QUExSGdDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7IGFzeW5jQWN0aW9uIH0gZnJvbSAnLi9hY3Rpb25DcmVhdG9ycyc7XG5pbXBvcnQgUm9vbUxpc3RTdG9yZSwgeyBUQUdfRE0gfSBmcm9tICcuLi9zdG9yZXMvUm9vbUxpc3RTdG9yZSc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vTW9kYWwnO1xuaW1wb3J0ICogYXMgUm9vbXMgZnJvbSAnLi4vUm9vbXMnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IE1hdHJpeENsaWVudCB9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9jbGllbnRcIjtcbmltcG9ydCB7IFJvb20gfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL3Jvb21cIjtcbmltcG9ydCB7IEFzeW5jQWN0aW9uUGF5bG9hZCB9IGZyb20gXCIuLi9kaXNwYXRjaGVyL3BheWxvYWRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJvb21MaXN0QWN0aW9ucyB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhY3Rpb24gdGh1bmsgdGhhdCB3aWxsIGRvIGFuIGFzeW5jaHJvbm91cyByZXF1ZXN0IHRvXG4gICAgICogdGFnIHJvb20uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01hdHJpeENsaWVudH0gbWF0cml4Q2xpZW50IHRoZSBtYXRyaXggY2xpZW50IHRvIHNldCB0aGVcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnQgZGF0YSBvbi5cbiAgICAgKiBAcGFyYW0ge1Jvb219IHJvb20gdGhlIHJvb20gdG8gdGFnLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRUYWcgdGhlIHRhZyB0byByZW1vdmUgKHVubGVzcyBvbGRUYWcgPT09PSBuZXdUYWcpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1RhZyB0aGUgdGFnIHdpdGggd2hpY2ggdG8gdGFnIHRoZSByb29tLlxuICAgICAqIEBwYXJhbSB7P251bWJlcn0gb2xkSW5kZXggdGhlIHByZXZpb3VzIHBvc2l0aW9uIG9mIHRoZSByb29tIGluIHRoZVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdCBvZiByb29tcy5cbiAgICAgKiBAcGFyYW0gez9udW1iZXJ9IG5ld0luZGV4IHRoZSBuZXcgcG9zaXRpb24gb2YgdGhlIHJvb20gaW4gdGhlIGxpc3RcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIHJvb21zLlxuICAgICAqIEByZXR1cm5zIHtBc3luY0FjdGlvblBheWxvYWR9IGFuIGFzeW5jIGFjdGlvbiBwYXlsb2FkXG4gICAgICogQHNlZSBhc3luY0FjdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgdGFnUm9vbShcbiAgICAgICAgbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnQsIHJvb206IFJvb20sXG4gICAgICAgIG9sZFRhZzogc3RyaW5nLCBuZXdUYWc6IHN0cmluZyxcbiAgICAgICAgb2xkSW5kZXg6IG51bWJlciB8IG51bGwsIG5ld0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICk6IEFzeW5jQWN0aW9uUGF5bG9hZCB7XG4gICAgICAgIGxldCBtZXRhRGF0YSA9IG51bGw7XG5cbiAgICAgICAgLy8gSXMgdGhlIHRhZyBvcmRlcmVkIG1hbnVhbGx5P1xuICAgICAgICBpZiAobmV3VGFnICYmICFuZXdUYWcubWF0Y2goL14obVxcLmxvd3ByaW9yaXR5fGltXFwudmVjdG9yXFwuZmFrZVxcLihpbnZpdGV8cmVjZW50fGRpcmVjdHxhcmNoaXZlZCkpJC8pKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0cyA9IFJvb21MaXN0U3RvcmUuZ2V0Um9vbUxpc3RzKCk7XG4gICAgICAgICAgICBjb25zdCBuZXdMaXN0ID0gWy4uLmxpc3RzW25ld1RhZ11dO1xuXG4gICAgICAgICAgICBuZXdMaXN0LnNvcnQoKGEsIGIpID0+IGEudGFnc1tuZXdUYWddLm9yZGVyIC0gYi50YWdzW25ld1RhZ10ub3JkZXIpO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgcm9vbSB3YXMgbW92ZWQgXCJkb3duXCIgKGluY3JlYXNpbmcgaW5kZXgpIGluIHRoZSBzYW1lIGxpc3Qgd2VcbiAgICAgICAgICAgIC8vIG5lZWQgdG8gdXNlIHRoZSBvcmRlcnMgb2YgdGhlIHRpbGVzIHdpdGggaW5kaWNlcyBzaGlmdGVkIGJ5ICsxXG4gICAgICAgICAgICBjb25zdCBvZmZzZXQgPSAoXG4gICAgICAgICAgICAgICAgbmV3VGFnID09PSBvbGRUYWcgJiYgb2xkSW5kZXggPCBuZXdJbmRleFxuICAgICAgICAgICAgKSA/IDEgOiAwO1xuXG4gICAgICAgICAgICBjb25zdCBpbmRleEJlZm9yZSA9IG9mZnNldCArIG5ld0luZGV4IC0gMTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4QWZ0ZXIgPSBvZmZzZXQgKyBuZXdJbmRleDtcblxuICAgICAgICAgICAgY29uc3QgcHJldk9yZGVyID0gaW5kZXhCZWZvcmUgPD0gMCA/XG4gICAgICAgICAgICAgICAgMCA6IG5ld0xpc3RbaW5kZXhCZWZvcmVdLnRhZ3NbbmV3VGFnXS5vcmRlcjtcbiAgICAgICAgICAgIGNvbnN0IG5leHRPcmRlciA9IGluZGV4QWZ0ZXIgPj0gbmV3TGlzdC5sZW5ndGggP1xuICAgICAgICAgICAgICAgIDEgOiBuZXdMaXN0W2luZGV4QWZ0ZXJdLnRhZ3NbbmV3VGFnXS5vcmRlcjtcblxuICAgICAgICAgICAgbWV0YURhdGEgPSB7XG4gICAgICAgICAgICAgICAgb3JkZXI6IChwcmV2T3JkZXIgKyBuZXh0T3JkZXIpIC8gMi4wLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhc3luY0FjdGlvbignUm9vbUxpc3RBY3Rpb25zLnRhZ1Jvb20nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgcm9vbUlkID0gcm9vbS5yb29tSWQ7XG5cbiAgICAgICAgICAgIC8vIEV2aWwgaGFjayB0byBnZXQgRE1zIGJlaGF2aW5nXG4gICAgICAgICAgICBpZiAoKG9sZFRhZyA9PT0gdW5kZWZpbmVkICYmIG5ld1RhZyA9PT0gVEFHX0RNKSB8fFxuICAgICAgICAgICAgICAgIChvbGRUYWcgPT09IFRBR19ETSAmJiBuZXdUYWcgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBSb29tcy5ndWVzc0FuZFNldERNUm9vbShcbiAgICAgICAgICAgICAgICAgICAgcm9vbSwgbmV3VGFnID09PSBUQUdfRE0sXG4gICAgICAgICAgICAgICAgKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2V0IGRpcmVjdCBjaGF0IHRhZyBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBzZXQgZGlyZWN0IGNoYXQgdGFnJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZhaWxlZCB0byBzZXQgZGlyZWN0IGNoYXQgdGFnJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnIgJiYgZXJyLm1lc3NhZ2UpID8gZXJyLm1lc3NhZ2UgOiBfdCgnT3BlcmF0aW9uIGZhaWxlZCcpKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGhhc0NoYW5nZWRTdWJMaXN0cyA9IG9sZFRhZyAhPT0gbmV3VGFnO1xuXG4gICAgICAgICAgICAvLyBNb3JlIGV2aWxuZXNzOiBXZSB3aWxsIHN0aWxsIGJlIGRlYWxpbmcgd2l0aCBtb3ZpbmcgdG8gZmF2b3VyaXRlcy9sb3cgcHJpbyxcbiAgICAgICAgICAgIC8vIGJ1dCB3ZSBhdm9pZCBldmVyIGRvaW5nIGEgcmVxdWVzdCB3aXRoIFRBR19ETS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBpZiB3ZSBtb3ZlZCBsaXN0cywgcmVtb3ZlIHRoZSBvbGQgdGFnXG4gICAgICAgICAgICBpZiAob2xkVGFnICYmIG9sZFRhZyAhPT0gVEFHX0RNICYmXG4gICAgICAgICAgICAgICAgaGFzQ2hhbmdlZFN1Ykxpc3RzXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlVG9EZWxldGUgPSBtYXRyaXhDbGllbnQuZGVsZXRlUm9vbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgcm9vbUlkLCBvbGRUYWcsXG4gICAgICAgICAgICAgICAgKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcmVtb3ZlIHRhZyBcIiArIG9sZFRhZyArIFwiIGZyb20gcm9vbTogXCIgKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdGYWlsZWQgdG8gcmVtb3ZlIHRhZyBmcm9tIHJvb20nLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRmFpbGVkIHRvIHJlbW92ZSB0YWcgJSh0YWdOYW1lKXMgZnJvbSByb29tJywge3RhZ05hbWU6IG9sZFRhZ30pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICgoZXJyICYmIGVyci5tZXNzYWdlKSA/IGVyci5tZXNzYWdlIDogX3QoJ09wZXJhdGlvbiBmYWlsZWQnKSksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlVG9EZWxldGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB3ZSBtb3ZlZCBsaXN0cyBvciB0aGUgb3JkZXJpbmcgY2hhbmdlZCwgYWRkIHRoZSBuZXcgdGFnXG4gICAgICAgICAgICBpZiAobmV3VGFnICYmIG5ld1RhZyAhPT0gVEFHX0RNICYmXG4gICAgICAgICAgICAgICAgKGhhc0NoYW5nZWRTdWJMaXN0cyB8fCBtZXRhRGF0YSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIG1ldGFEYXRhIGlzIHRoZSBib2R5IG9mIHRoZSBQVVQgdG8gc2V0IHRoZSB0YWcsIHNvIGl0IG11c3RcbiAgICAgICAgICAgICAgICAvLyBhdCBsZWFzdCBiZSBhbiBlbXB0eSBvYmplY3QuXG4gICAgICAgICAgICAgICAgbWV0YURhdGEgPSBtZXRhRGF0YSB8fCB7fTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VUb0FkZCA9IG1hdHJpeENsaWVudC5zZXRSb29tVGFnKHJvb21JZCwgbmV3VGFnLCBtZXRhRGF0YSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGFkZCB0YWcgXCIgKyBuZXdUYWcgKyBcIiB0byByb29tOiBcIiArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBhZGQgdGFnIHRvIHJvb20nLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRmFpbGVkIHRvIGFkZCB0YWcgJSh0YWdOYW1lKXMgdG8gcm9vbScsIHt0YWdOYW1lOiBuZXdUYWd9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KCdPcGVyYXRpb24gZmFpbGVkJykpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2VUb0FkZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIC8vIEZvciBhbiBvcHRpbWlzdGljIHVwZGF0ZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICByb29tLCBvbGRUYWcsIG5ld1RhZywgbWV0YURhdGEsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=