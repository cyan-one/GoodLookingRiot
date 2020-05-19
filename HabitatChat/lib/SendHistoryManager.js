"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _clamp2 = _interopRequireDefault(require("lodash/clamp"));

/*
Copyright 2017 Aviral Dasgupta

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
class SendHistoryManager {
  // used for indexing the storage
  // used for indexing the loaded validated history Array
  constructor(roomId
  /*: string*/
  , prefix
  /*: string*/
  ) {
    (0, _defineProperty2.default)(this, "history", []);
    (0, _defineProperty2.default)(this, "prefix", void 0);
    (0, _defineProperty2.default)(this, "lastIndex", 0);
    (0, _defineProperty2.default)(this, "currentIndex", 0);
    this.prefix = prefix + roomId; // TODO: Performance issues?

    let index = 0;
    let itemJSON;

    while (itemJSON = sessionStorage.getItem("".concat(this.prefix, "[").concat(index, "]"))) {
      try {
        const serializedParts = JSON.parse(itemJSON);
        this.history.push(serializedParts);
      } catch (e) {
        console.warn("Throwing away unserialisable history", e);
        break;
      }

      ++index;
    }

    this.lastIndex = this.history.length - 1; // reset currentIndex to account for any unserialisable history

    this.currentIndex = this.lastIndex + 1;
  }

  save(editorModel
  /*: Object*/
  ) {
    const serializedParts = editorModel.serializeParts();
    this.history.push(serializedParts);
    this.currentIndex = this.history.length;
    this.lastIndex += 1;
    sessionStorage.setItem("".concat(this.prefix, "[").concat(this.lastIndex, "]"), JSON.stringify(serializedParts));
  }

  getItem(offset
  /*: number*/
  )
  /*: ?HistoryItem*/
  {
    this.currentIndex = (0, _clamp2.default)(this.currentIndex + offset, 0, this.history.length - 1);
    return this.history[this.currentIndex];
  }

}

exports.default = SendHistoryManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TZW5kSGlzdG9yeU1hbmFnZXIuanMiXSwibmFtZXMiOlsiU2VuZEhpc3RvcnlNYW5hZ2VyIiwiY29uc3RydWN0b3IiLCJyb29tSWQiLCJwcmVmaXgiLCJpbmRleCIsIml0ZW1KU09OIiwic2Vzc2lvblN0b3JhZ2UiLCJnZXRJdGVtIiwic2VyaWFsaXplZFBhcnRzIiwiSlNPTiIsInBhcnNlIiwiaGlzdG9yeSIsInB1c2giLCJlIiwiY29uc29sZSIsIndhcm4iLCJsYXN0SW5kZXgiLCJsZW5ndGgiLCJjdXJyZW50SW5kZXgiLCJzYXZlIiwiZWRpdG9yTW9kZWwiLCJzZXJpYWxpemVQYXJ0cyIsInNldEl0ZW0iLCJzdHJpbmdpZnkiLCJvZmZzZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQWhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JlLE1BQU1BLGtCQUFOLENBQXlCO0FBR2I7QUFDRztBQUUxQkMsRUFBQUEsV0FBVyxDQUFDQztBQUFEO0FBQUEsSUFBaUJDO0FBQWpCO0FBQUEsSUFBaUM7QUFBQSxtREFMZCxFQUtjO0FBQUE7QUFBQSxxREFIeEIsQ0FHd0I7QUFBQSx3REFGckIsQ0FFcUI7QUFDeEMsU0FBS0EsTUFBTCxHQUFjQSxNQUFNLEdBQUdELE1BQXZCLENBRHdDLENBR3hDOztBQUNBLFFBQUlFLEtBQUssR0FBRyxDQUFaO0FBQ0EsUUFBSUMsUUFBSjs7QUFFQSxXQUFPQSxRQUFRLEdBQUdDLGNBQWMsQ0FBQ0MsT0FBZixXQUEwQixLQUFLSixNQUEvQixjQUF5Q0MsS0FBekMsT0FBbEIsRUFBc0U7QUFDbEUsVUFBSTtBQUNBLGNBQU1JLGVBQWUsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdMLFFBQVgsQ0FBeEI7QUFDQSxhQUFLTSxPQUFMLENBQWFDLElBQWIsQ0FBa0JKLGVBQWxCO0FBQ0gsT0FIRCxDQUdFLE9BQU9LLENBQVAsRUFBVTtBQUNSQyxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxzQ0FBYixFQUFxREYsQ0FBckQ7QUFDQTtBQUNIOztBQUNELFFBQUVULEtBQUY7QUFDSDs7QUFDRCxTQUFLWSxTQUFMLEdBQWlCLEtBQUtMLE9BQUwsQ0FBYU0sTUFBYixHQUFzQixDQUF2QyxDQWpCd0MsQ0FrQnhDOztBQUNBLFNBQUtDLFlBQUwsR0FBb0IsS0FBS0YsU0FBTCxHQUFpQixDQUFyQztBQUNIOztBQUVERyxFQUFBQSxJQUFJLENBQUNDO0FBQUQ7QUFBQSxJQUFzQjtBQUN0QixVQUFNWixlQUFlLEdBQUdZLFdBQVcsQ0FBQ0MsY0FBWixFQUF4QjtBQUNBLFNBQUtWLE9BQUwsQ0FBYUMsSUFBYixDQUFrQkosZUFBbEI7QUFDQSxTQUFLVSxZQUFMLEdBQW9CLEtBQUtQLE9BQUwsQ0FBYU0sTUFBakM7QUFDQSxTQUFLRCxTQUFMLElBQWtCLENBQWxCO0FBQ0FWLElBQUFBLGNBQWMsQ0FBQ2dCLE9BQWYsV0FBMEIsS0FBS25CLE1BQS9CLGNBQXlDLEtBQUthLFNBQTlDLFFBQTREUCxJQUFJLENBQUNjLFNBQUwsQ0FBZWYsZUFBZixDQUE1RDtBQUNIOztBQUVERCxFQUFBQSxPQUFPLENBQUNpQjtBQUFEO0FBQUE7QUFBQTtBQUErQjtBQUNsQyxTQUFLTixZQUFMLEdBQW9CLHFCQUFPLEtBQUtBLFlBQUwsR0FBb0JNLE1BQTNCLEVBQW1DLENBQW5DLEVBQXNDLEtBQUtiLE9BQUwsQ0FBYU0sTUFBYixHQUFzQixDQUE1RCxDQUFwQjtBQUNBLFdBQU8sS0FBS04sT0FBTCxDQUFhLEtBQUtPLFlBQWxCLENBQVA7QUFDSDs7QUF2Q21DIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuLypcbkNvcHlyaWdodCAyMDE3IEF2aXJhbCBEYXNndXB0YVxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBfY2xhbXAgZnJvbSAnbG9kYXNoL2NsYW1wJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VuZEhpc3RvcnlNYW5hZ2VyIHtcbiAgICBoaXN0b3J5OiBBcnJheTxIaXN0b3J5SXRlbT4gPSBbXTtcbiAgICBwcmVmaXg6IHN0cmluZztcbiAgICBsYXN0SW5kZXg6IG51bWJlciA9IDA7IC8vIHVzZWQgZm9yIGluZGV4aW5nIHRoZSBzdG9yYWdlXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIgPSAwOyAvLyB1c2VkIGZvciBpbmRleGluZyB0aGUgbG9hZGVkIHZhbGlkYXRlZCBoaXN0b3J5IEFycmF5XG5cbiAgICBjb25zdHJ1Y3Rvcihyb29tSWQ6IHN0cmluZywgcHJlZml4OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5wcmVmaXggPSBwcmVmaXggKyByb29tSWQ7XG5cbiAgICAgICAgLy8gVE9ETzogUGVyZm9ybWFuY2UgaXNzdWVzP1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgaXRlbUpTT047XG5cbiAgICAgICAgd2hpbGUgKGl0ZW1KU09OID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShgJHt0aGlzLnByZWZpeH1bJHtpbmRleH1dYCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplZFBhcnRzID0gSlNPTi5wYXJzZShpdGVtSlNPTik7XG4gICAgICAgICAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goc2VyaWFsaXplZFBhcnRzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJUaHJvd2luZyBhd2F5IHVuc2VyaWFsaXNhYmxlIGhpc3RvcnlcIiwgZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdEluZGV4ID0gdGhpcy5oaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgICAgIC8vIHJlc2V0IGN1cnJlbnRJbmRleCB0byBhY2NvdW50IGZvciBhbnkgdW5zZXJpYWxpc2FibGUgaGlzdG9yeVxuICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IHRoaXMubGFzdEluZGV4ICsgMTtcbiAgICB9XG5cbiAgICBzYXZlKGVkaXRvck1vZGVsOiBPYmplY3QpIHtcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFBhcnRzID0gZWRpdG9yTW9kZWwuc2VyaWFsaXplUGFydHMoKTtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goc2VyaWFsaXplZFBhcnRzKTtcbiAgICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSB0aGlzLmhpc3RvcnkubGVuZ3RoO1xuICAgICAgICB0aGlzLmxhc3RJbmRleCArPSAxO1xuICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGAke3RoaXMucHJlZml4fVske3RoaXMubGFzdEluZGV4fV1gLCBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkUGFydHMpKTtcbiAgICB9XG5cbiAgICBnZXRJdGVtKG9mZnNldDogbnVtYmVyKTogP0hpc3RvcnlJdGVtIHtcbiAgICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSBfY2xhbXAodGhpcy5jdXJyZW50SW5kZXggKyBvZmZzZXQsIDAsIHRoaXMuaGlzdG9yeS5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeVt0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgfVxufVxuIl19