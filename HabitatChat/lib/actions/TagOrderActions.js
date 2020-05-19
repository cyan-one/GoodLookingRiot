"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Analytics = _interopRequireDefault(require("../Analytics"));

var _actionCreators = require("./actionCreators");

var _TagOrderStore = _interopRequireDefault(require("../stores/TagOrderStore"));

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
class TagOrderActions {
  /**
   * Creates an action thunk that will do an asynchronous request to
   * move a tag in TagOrderStore to destinationIx.
   *
   * @param {MatrixClient} matrixClient the matrix client to set the
   * account data on.
   * @param {string} tag the tag to move.
   * @param {number} destinationIx the new position of the tag.
   * @returns {AsyncActionPayload} an async action payload that will
   * dispatch actions indicating the status of the request.
   * @see asyncAction
   */
  static moveTag(matrixClient
  /*: MatrixClient*/
  , tag
  /*: string*/
  , destinationIx
  /*: number*/
  )
  /*: AsyncActionPayload*/
  {
    // Only commit tags if the state is ready, i.e. not null
    let tags = _TagOrderStore.default.getOrderedTags();

    let removedTags = _TagOrderStore.default.getRemovedTagsAccountData() || [];

    if (!tags) {
      return;
    }

    tags = tags.filter(t => t !== tag);
    tags = [...tags.slice(0, destinationIx), tag, ...tags.slice(destinationIx)];
    removedTags = removedTags.filter(t => t !== tag);

    const storeId = _TagOrderStore.default.getStoreId();

    return (0, _actionCreators.asyncAction)('TagOrderActions.moveTag', () => {
      _Analytics.default.trackEvent('TagOrderActions', 'commitTagOrdering');

      return matrixClient.setAccountData('im.vector.web.tag_ordering', {
        tags,
        removedTags,
        _storeId: storeId
      });
    }, () => {
      // For an optimistic update
      return {
        tags,
        removedTags
      };
    });
  }

  /**
   * Creates an action thunk that will do an asynchronous request to
   * label a tag as removed in im.vector.web.tag_ordering account data.
   *
   * The reason this is implemented with new state `removedTags` is that
   * we incrementally and initially populate `tags` with groups that
   * have been joined. If we remove a group from `tags`, it will just
   * get added (as it looks like a group we've recently joined).
   *
   * NB: If we ever support adding of tags (which is planned), we should
   * take special care to remove the tag from `removedTags` when we add
   * it.
   *
   * @param {MatrixClient} matrixClient the matrix client to set the
   * account data on.
   * @param {string} tag the tag to remove.
   * @returns {function} an async action payload that will dispatch
   * actions indicating the status of the request.
   * @see asyncAction
   */
  static removeTag(matrixClient
  /*: MatrixClient*/
  , tag
  /*: string*/
  )
  /*: AsyncActionPayload*/
  {
    // Don't change tags, just removedTags
    const tags = _TagOrderStore.default.getOrderedTags();

    const removedTags = _TagOrderStore.default.getRemovedTagsAccountData() || [];

    if (removedTags.includes(tag)) {
      // Return a thunk that doesn't do anything, we don't even need
      // an asynchronous action here, the tag is already removed.
      return new _payloads.AsyncActionPayload(() => {});
    }

    removedTags.push(tag);

    const storeId = _TagOrderStore.default.getStoreId();

    return (0, _actionCreators.asyncAction)('TagOrderActions.removeTag', () => {
      _Analytics.default.trackEvent('TagOrderActions', 'removeTag');

      return matrixClient.setAccountData('im.vector.web.tag_ordering', {
        tags,
        removedTags,
        _storeId: storeId
      });
    }, () => {
      // For an optimistic update
      return {
        removedTags
      };
    });
  }

}

exports.default = TagOrderActions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY3Rpb25zL1RhZ09yZGVyQWN0aW9ucy50cyJdLCJuYW1lcyI6WyJUYWdPcmRlckFjdGlvbnMiLCJtb3ZlVGFnIiwibWF0cml4Q2xpZW50IiwidGFnIiwiZGVzdGluYXRpb25JeCIsInRhZ3MiLCJUYWdPcmRlclN0b3JlIiwiZ2V0T3JkZXJlZFRhZ3MiLCJyZW1vdmVkVGFncyIsImdldFJlbW92ZWRUYWdzQWNjb3VudERhdGEiLCJmaWx0ZXIiLCJ0Iiwic2xpY2UiLCJzdG9yZUlkIiwiZ2V0U3RvcmVJZCIsIkFuYWx5dGljcyIsInRyYWNrRXZlbnQiLCJzZXRBY2NvdW50RGF0YSIsIl9zdG9yZUlkIiwicmVtb3ZlVGFnIiwiaW5jbHVkZXMiLCJBc3luY0FjdGlvblBheWxvYWQiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBdUJlLE1BQU1BLGVBQU4sQ0FBc0I7QUFFakM7Ozs7Ozs7Ozs7OztBQVlBLFNBQWNDLE9BQWQsQ0FBc0JDO0FBQXRCO0FBQUEsSUFBa0RDO0FBQWxEO0FBQUEsSUFBK0RDO0FBQS9EO0FBQUE7QUFBQTtBQUEwRztBQUN0RztBQUNBLFFBQUlDLElBQUksR0FBR0MsdUJBQWNDLGNBQWQsRUFBWDs7QUFDQSxRQUFJQyxXQUFXLEdBQUdGLHVCQUFjRyx5QkFBZCxNQUE2QyxFQUEvRDs7QUFDQSxRQUFJLENBQUNKLElBQUwsRUFBVztBQUNQO0FBQ0g7O0FBRURBLElBQUFBLElBQUksR0FBR0EsSUFBSSxDQUFDSyxNQUFMLENBQWFDLENBQUQsSUFBT0EsQ0FBQyxLQUFLUixHQUF6QixDQUFQO0FBQ0FFLElBQUFBLElBQUksR0FBRyxDQUFDLEdBQUdBLElBQUksQ0FBQ08sS0FBTCxDQUFXLENBQVgsRUFBY1IsYUFBZCxDQUFKLEVBQWtDRCxHQUFsQyxFQUF1QyxHQUFHRSxJQUFJLENBQUNPLEtBQUwsQ0FBV1IsYUFBWCxDQUExQyxDQUFQO0FBRUFJLElBQUFBLFdBQVcsR0FBR0EsV0FBVyxDQUFDRSxNQUFaLENBQW9CQyxDQUFELElBQU9BLENBQUMsS0FBS1IsR0FBaEMsQ0FBZDs7QUFFQSxVQUFNVSxPQUFPLEdBQUdQLHVCQUFjUSxVQUFkLEVBQWhCOztBQUVBLFdBQU8saUNBQVkseUJBQVosRUFBdUMsTUFBTTtBQUNoREMseUJBQVVDLFVBQVYsQ0FBcUIsaUJBQXJCLEVBQXdDLG1CQUF4Qzs7QUFDQSxhQUFPZCxZQUFZLENBQUNlLGNBQWIsQ0FDSCw0QkFERyxFQUVIO0FBQUNaLFFBQUFBLElBQUQ7QUFBT0csUUFBQUEsV0FBUDtBQUFvQlUsUUFBQUEsUUFBUSxFQUFFTDtBQUE5QixPQUZHLENBQVA7QUFJSCxLQU5NLEVBTUosTUFBTTtBQUNMO0FBQ0EsYUFBTztBQUFDUixRQUFBQSxJQUFEO0FBQU9HLFFBQUFBO0FBQVAsT0FBUDtBQUNILEtBVE0sQ0FBUDtBQVVIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxTQUFjVyxTQUFkLENBQXdCakI7QUFBeEI7QUFBQSxJQUFvREM7QUFBcEQ7QUFBQTtBQUFBO0FBQXFGO0FBQ2pGO0FBQ0EsVUFBTUUsSUFBSSxHQUFHQyx1QkFBY0MsY0FBZCxFQUFiOztBQUNBLFVBQU1DLFdBQVcsR0FBR0YsdUJBQWNHLHlCQUFkLE1BQTZDLEVBQWpFOztBQUVBLFFBQUlELFdBQVcsQ0FBQ1ksUUFBWixDQUFxQmpCLEdBQXJCLENBQUosRUFBK0I7QUFDM0I7QUFDQTtBQUNBLGFBQU8sSUFBSWtCLDRCQUFKLENBQXVCLE1BQU0sQ0FBRSxDQUEvQixDQUFQO0FBQ0g7O0FBRURiLElBQUFBLFdBQVcsQ0FBQ2MsSUFBWixDQUFpQm5CLEdBQWpCOztBQUVBLFVBQU1VLE9BQU8sR0FBR1AsdUJBQWNRLFVBQWQsRUFBaEI7O0FBRUEsV0FBTyxpQ0FBWSwyQkFBWixFQUF5QyxNQUFNO0FBQ2xEQyx5QkFBVUMsVUFBVixDQUFxQixpQkFBckIsRUFBd0MsV0FBeEM7O0FBQ0EsYUFBT2QsWUFBWSxDQUFDZSxjQUFiLENBQ0gsNEJBREcsRUFFSDtBQUFDWixRQUFBQSxJQUFEO0FBQU9HLFFBQUFBLFdBQVA7QUFBb0JVLFFBQUFBLFFBQVEsRUFBRUw7QUFBOUIsT0FGRyxDQUFQO0FBSUgsS0FOTSxFQU1KLE1BQU07QUFDTDtBQUNBLGFBQU87QUFBQ0wsUUFBQUE7QUFBRCxPQUFQO0FBQ0gsS0FUTSxDQUFQO0FBVUg7O0FBdEZnQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgQW5hbHl0aWNzIGZyb20gJy4uL0FuYWx5dGljcyc7XG5pbXBvcnQgeyBhc3luY0FjdGlvbiB9IGZyb20gJy4vYWN0aW9uQ3JlYXRvcnMnO1xuaW1wb3J0IFRhZ09yZGVyU3RvcmUgZnJvbSAnLi4vc3RvcmVzL1RhZ09yZGVyU3RvcmUnO1xuaW1wb3J0IHsgQXN5bmNBY3Rpb25QYXlsb2FkIH0gZnJvbSBcIi4uL2Rpc3BhdGNoZXIvcGF5bG9hZHNcIjtcbmltcG9ydCB7IE1hdHJpeENsaWVudCB9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9jbGllbnRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFnT3JkZXJBY3Rpb25zIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYWN0aW9uIHRodW5rIHRoYXQgd2lsbCBkbyBhbiBhc3luY2hyb25vdXMgcmVxdWVzdCB0b1xuICAgICAqIG1vdmUgYSB0YWcgaW4gVGFnT3JkZXJTdG9yZSB0byBkZXN0aW5hdGlvbkl4LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNYXRyaXhDbGllbnR9IG1hdHJpeENsaWVudCB0aGUgbWF0cml4IGNsaWVudCB0byBzZXQgdGhlXG4gICAgICogYWNjb3VudCBkYXRhIG9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgdGhlIHRhZyB0byBtb3ZlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZXN0aW5hdGlvbkl4IHRoZSBuZXcgcG9zaXRpb24gb2YgdGhlIHRhZy5cbiAgICAgKiBAcmV0dXJucyB7QXN5bmNBY3Rpb25QYXlsb2FkfSBhbiBhc3luYyBhY3Rpb24gcGF5bG9hZCB0aGF0IHdpbGxcbiAgICAgKiBkaXNwYXRjaCBhY3Rpb25zIGluZGljYXRpbmcgdGhlIHN0YXR1cyBvZiB0aGUgcmVxdWVzdC5cbiAgICAgKiBAc2VlIGFzeW5jQWN0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBtb3ZlVGFnKG1hdHJpeENsaWVudDogTWF0cml4Q2xpZW50LCB0YWc6IHN0cmluZywgZGVzdGluYXRpb25JeDogbnVtYmVyKTogQXN5bmNBY3Rpb25QYXlsb2FkIHtcbiAgICAgICAgLy8gT25seSBjb21taXQgdGFncyBpZiB0aGUgc3RhdGUgaXMgcmVhZHksIGkuZS4gbm90IG51bGxcbiAgICAgICAgbGV0IHRhZ3MgPSBUYWdPcmRlclN0b3JlLmdldE9yZGVyZWRUYWdzKCk7XG4gICAgICAgIGxldCByZW1vdmVkVGFncyA9IFRhZ09yZGVyU3RvcmUuZ2V0UmVtb3ZlZFRhZ3NBY2NvdW50RGF0YSgpIHx8IFtdO1xuICAgICAgICBpZiAoIXRhZ3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhZ3MgPSB0YWdzLmZpbHRlcigodCkgPT4gdCAhPT0gdGFnKTtcbiAgICAgICAgdGFncyA9IFsuLi50YWdzLnNsaWNlKDAsIGRlc3RpbmF0aW9uSXgpLCB0YWcsIC4uLnRhZ3Muc2xpY2UoZGVzdGluYXRpb25JeCldO1xuXG4gICAgICAgIHJlbW92ZWRUYWdzID0gcmVtb3ZlZFRhZ3MuZmlsdGVyKCh0KSA9PiB0ICE9PSB0YWcpO1xuXG4gICAgICAgIGNvbnN0IHN0b3JlSWQgPSBUYWdPcmRlclN0b3JlLmdldFN0b3JlSWQoKTtcblxuICAgICAgICByZXR1cm4gYXN5bmNBY3Rpb24oJ1RhZ09yZGVyQWN0aW9ucy5tb3ZlVGFnJywgKCkgPT4ge1xuICAgICAgICAgICAgQW5hbHl0aWNzLnRyYWNrRXZlbnQoJ1RhZ09yZGVyQWN0aW9ucycsICdjb21taXRUYWdPcmRlcmluZycpO1xuICAgICAgICAgICAgcmV0dXJuIG1hdHJpeENsaWVudC5zZXRBY2NvdW50RGF0YShcbiAgICAgICAgICAgICAgICAnaW0udmVjdG9yLndlYi50YWdfb3JkZXJpbmcnLFxuICAgICAgICAgICAgICAgIHt0YWdzLCByZW1vdmVkVGFncywgX3N0b3JlSWQ6IHN0b3JlSWR9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gRm9yIGFuIG9wdGltaXN0aWMgdXBkYXRlXG4gICAgICAgICAgICByZXR1cm4ge3RhZ3MsIHJlbW92ZWRUYWdzfTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYWN0aW9uIHRodW5rIHRoYXQgd2lsbCBkbyBhbiBhc3luY2hyb25vdXMgcmVxdWVzdCB0b1xuICAgICAqIGxhYmVsIGEgdGFnIGFzIHJlbW92ZWQgaW4gaW0udmVjdG9yLndlYi50YWdfb3JkZXJpbmcgYWNjb3VudCBkYXRhLlxuICAgICAqXG4gICAgICogVGhlIHJlYXNvbiB0aGlzIGlzIGltcGxlbWVudGVkIHdpdGggbmV3IHN0YXRlIGByZW1vdmVkVGFnc2AgaXMgdGhhdFxuICAgICAqIHdlIGluY3JlbWVudGFsbHkgYW5kIGluaXRpYWxseSBwb3B1bGF0ZSBgdGFnc2Agd2l0aCBncm91cHMgdGhhdFxuICAgICAqIGhhdmUgYmVlbiBqb2luZWQuIElmIHdlIHJlbW92ZSBhIGdyb3VwIGZyb20gYHRhZ3NgLCBpdCB3aWxsIGp1c3RcbiAgICAgKiBnZXQgYWRkZWQgKGFzIGl0IGxvb2tzIGxpa2UgYSBncm91cCB3ZSd2ZSByZWNlbnRseSBqb2luZWQpLlxuICAgICAqXG4gICAgICogTkI6IElmIHdlIGV2ZXIgc3VwcG9ydCBhZGRpbmcgb2YgdGFncyAod2hpY2ggaXMgcGxhbm5lZCksIHdlIHNob3VsZFxuICAgICAqIHRha2Ugc3BlY2lhbCBjYXJlIHRvIHJlbW92ZSB0aGUgdGFnIGZyb20gYHJlbW92ZWRUYWdzYCB3aGVuIHdlIGFkZFxuICAgICAqIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNYXRyaXhDbGllbnR9IG1hdHJpeENsaWVudCB0aGUgbWF0cml4IGNsaWVudCB0byBzZXQgdGhlXG4gICAgICogYWNjb3VudCBkYXRhIG9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgdGhlIHRhZyB0byByZW1vdmUuXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9ufSBhbiBhc3luYyBhY3Rpb24gcGF5bG9hZCB0aGF0IHdpbGwgZGlzcGF0Y2hcbiAgICAgKiBhY3Rpb25zIGluZGljYXRpbmcgdGhlIHN0YXR1cyBvZiB0aGUgcmVxdWVzdC5cbiAgICAgKiBAc2VlIGFzeW5jQWN0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyByZW1vdmVUYWcobWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnQsIHRhZzogc3RyaW5nKTogQXN5bmNBY3Rpb25QYXlsb2FkIHtcbiAgICAgICAgLy8gRG9uJ3QgY2hhbmdlIHRhZ3MsIGp1c3QgcmVtb3ZlZFRhZ3NcbiAgICAgICAgY29uc3QgdGFncyA9IFRhZ09yZGVyU3RvcmUuZ2V0T3JkZXJlZFRhZ3MoKTtcbiAgICAgICAgY29uc3QgcmVtb3ZlZFRhZ3MgPSBUYWdPcmRlclN0b3JlLmdldFJlbW92ZWRUYWdzQWNjb3VudERhdGEoKSB8fCBbXTtcblxuICAgICAgICBpZiAocmVtb3ZlZFRhZ3MuaW5jbHVkZXModGFnKSkge1xuICAgICAgICAgICAgLy8gUmV0dXJuIGEgdGh1bmsgdGhhdCBkb2Vzbid0IGRvIGFueXRoaW5nLCB3ZSBkb24ndCBldmVuIG5lZWRcbiAgICAgICAgICAgIC8vIGFuIGFzeW5jaHJvbm91cyBhY3Rpb24gaGVyZSwgdGhlIHRhZyBpcyBhbHJlYWR5IHJlbW92ZWQuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFzeW5jQWN0aW9uUGF5bG9hZCgoKSA9PiB7fSk7XG4gICAgICAgIH1cblxuICAgICAgICByZW1vdmVkVGFncy5wdXNoKHRhZyk7XG5cbiAgICAgICAgY29uc3Qgc3RvcmVJZCA9IFRhZ09yZGVyU3RvcmUuZ2V0U3RvcmVJZCgpO1xuXG4gICAgICAgIHJldHVybiBhc3luY0FjdGlvbignVGFnT3JkZXJBY3Rpb25zLnJlbW92ZVRhZycsICgpID0+IHtcbiAgICAgICAgICAgIEFuYWx5dGljcy50cmFja0V2ZW50KCdUYWdPcmRlckFjdGlvbnMnLCAncmVtb3ZlVGFnJyk7XG4gICAgICAgICAgICByZXR1cm4gbWF0cml4Q2xpZW50LnNldEFjY291bnREYXRhKFxuICAgICAgICAgICAgICAgICdpbS52ZWN0b3Iud2ViLnRhZ19vcmRlcmluZycsXG4gICAgICAgICAgICAgICAge3RhZ3MsIHJlbW92ZWRUYWdzLCBfc3RvcmVJZDogc3RvcmVJZH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBGb3IgYW4gb3B0aW1pc3RpYyB1cGRhdGVcbiAgICAgICAgICAgIHJldHVybiB7cmVtb3ZlZFRhZ3N9O1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=