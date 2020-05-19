"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PermalinkParts = exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

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

/**
 * Interface for classes that actually produce permalinks (strings).
 * TODO: Convert this to a real TypeScript interface
 */
class PermalinkConstructor {
  forEvent(roomId
  /*: string*/
  , eventId
  /*: string*/
  , serverCandidates
  /*: string[]*/
  )
  /*: string*/
  {
    throw new Error("Not implemented");
  }

  forRoom(roomIdOrAlias
  /*: string*/
  , serverCandidates
  /*: string[]*/
  )
  /*: string*/
  {
    throw new Error("Not implemented");
  }

  forGroup(groupId
  /*: string*/
  )
  /*: string*/
  {
    throw new Error("Not implemented");
  }

  forUser(userId
  /*: string*/
  )
  /*: string*/
  {
    throw new Error("Not implemented");
  }

  forEntity(entityId
  /*: string*/
  )
  /*: string*/
  {
    throw new Error("Not implemented");
  }

  isPermalinkHost(host
  /*: string*/
  )
  /*: boolean*/
  {
    throw new Error("Not implemented");
  }

  parsePermalink(fullUrl
  /*: string*/
  )
  /*: PermalinkParts*/
  {
    throw new Error("Not implemented");
  }

} // Inspired by/Borrowed with permission from the matrix-bot-sdk:
// https://github.com/turt2live/matrix-js-bot-sdk/blob/7c4665c9a25c2c8e0fe4e509f2616505b5b66a1c/src/Permalinks.ts#L1-L6


exports.default = PermalinkConstructor;

class PermalinkParts {
  constructor(roomIdOrAlias
  /*: string*/
  , eventId
  /*: string*/
  , userId
  /*: string*/
  , groupId
  /*: string*/
  , viaServers
  /*: string[]*/
  ) {
    (0, _defineProperty2.default)(this, "roomIdOrAlias", void 0);
    (0, _defineProperty2.default)(this, "eventId", void 0);
    (0, _defineProperty2.default)(this, "userId", void 0);
    (0, _defineProperty2.default)(this, "groupId", void 0);
    (0, _defineProperty2.default)(this, "viaServers", void 0);
    this.roomIdOrAlias = roomIdOrAlias;
    this.eventId = eventId;
    this.groupId = groupId;
    this.userId = userId;
    this.viaServers = viaServers;
  }

  static forUser(userId
  /*: string*/
  )
  /*: PermalinkParts*/
  {
    return new PermalinkParts(null, null, userId, null, null);
  }

  static forGroup(groupId
  /*: string*/
  )
  /*: PermalinkParts*/
  {
    return new PermalinkParts(null, null, null, groupId, null);
  }

  static forRoom(roomIdOrAlias
  /*: string*/
  , viaServers
  /*: string[]*/
  )
  /*: PermalinkParts*/
  {
    return new PermalinkParts(roomIdOrAlias, null, null, null, viaServers || []);
  }

  static forEvent(roomId
  /*: string*/
  , eventId
  /*: string*/
  , viaServers
  /*: string[]*/
  )
  /*: PermalinkParts*/
  {
    return new PermalinkParts(roomId, eventId, null, null, viaServers || []);
  }

}

exports.PermalinkParts = PermalinkParts;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wZXJtYWxpbmtzL1Blcm1hbGlua0NvbnN0cnVjdG9yLmpzIl0sIm5hbWVzIjpbIlBlcm1hbGlua0NvbnN0cnVjdG9yIiwiZm9yRXZlbnQiLCJyb29tSWQiLCJldmVudElkIiwic2VydmVyQ2FuZGlkYXRlcyIsIkVycm9yIiwiZm9yUm9vbSIsInJvb21JZE9yQWxpYXMiLCJmb3JHcm91cCIsImdyb3VwSWQiLCJmb3JVc2VyIiwidXNlcklkIiwiZm9yRW50aXR5IiwiZW50aXR5SWQiLCJpc1Blcm1hbGlua0hvc3QiLCJob3N0IiwicGFyc2VQZXJtYWxpbmsiLCJmdWxsVXJsIiwiUGVybWFsaW5rUGFydHMiLCJjb25zdHJ1Y3RvciIsInZpYVNlcnZlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJZSxNQUFNQSxvQkFBTixDQUEyQjtBQUN0Q0MsRUFBQUEsUUFBUSxDQUFDQztBQUFEO0FBQUEsSUFBaUJDO0FBQWpCO0FBQUEsSUFBa0NDO0FBQWxDO0FBQUE7QUFBQTtBQUFzRTtBQUMxRSxVQUFNLElBQUlDLEtBQUosQ0FBVSxpQkFBVixDQUFOO0FBQ0g7O0FBRURDLEVBQUFBLE9BQU8sQ0FBQ0M7QUFBRDtBQUFBLElBQXdCSDtBQUF4QjtBQUFBO0FBQUE7QUFBNEQ7QUFDL0QsVUFBTSxJQUFJQyxLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNIOztBQUVERyxFQUFBQSxRQUFRLENBQUNDO0FBQUQ7QUFBQTtBQUFBO0FBQTBCO0FBQzlCLFVBQU0sSUFBSUosS0FBSixDQUFVLGlCQUFWLENBQU47QUFDSDs7QUFFREssRUFBQUEsT0FBTyxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUF5QjtBQUM1QixVQUFNLElBQUlOLEtBQUosQ0FBVSxpQkFBVixDQUFOO0FBQ0g7O0FBRURPLEVBQUFBLFNBQVMsQ0FBQ0M7QUFBRDtBQUFBO0FBQUE7QUFBMkI7QUFDaEMsVUFBTSxJQUFJUixLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNIOztBQUVEUyxFQUFBQSxlQUFlLENBQUNDO0FBQUQ7QUFBQTtBQUFBO0FBQXdCO0FBQ25DLFVBQU0sSUFBSVYsS0FBSixDQUFVLGlCQUFWLENBQU47QUFDSDs7QUFFRFcsRUFBQUEsY0FBYyxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUFrQztBQUM1QyxVQUFNLElBQUlaLEtBQUosQ0FBVSxpQkFBVixDQUFOO0FBQ0g7O0FBM0JxQyxDLENBOEIxQztBQUNBOzs7OztBQUNPLE1BQU1hLGNBQU4sQ0FBcUI7QUFPeEJDLEVBQUFBLFdBQVcsQ0FBQ1o7QUFBRDtBQUFBLElBQXdCSjtBQUF4QjtBQUFBLElBQXlDUTtBQUF6QztBQUFBLElBQXlERjtBQUF6RDtBQUFBLElBQTBFVztBQUExRTtBQUFBLElBQWdHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN2RyxTQUFLYixhQUFMLEdBQXFCQSxhQUFyQjtBQUNBLFNBQUtKLE9BQUwsR0FBZUEsT0FBZjtBQUNBLFNBQUtNLE9BQUwsR0FBZUEsT0FBZjtBQUNBLFNBQUtFLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtTLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0g7O0FBRUQsU0FBT1YsT0FBUCxDQUFlQztBQUFmO0FBQUE7QUFBQTtBQUErQztBQUMzQyxXQUFPLElBQUlPLGNBQUosQ0FBbUIsSUFBbkIsRUFBeUIsSUFBekIsRUFBK0JQLE1BQS9CLEVBQXVDLElBQXZDLEVBQTZDLElBQTdDLENBQVA7QUFDSDs7QUFFRCxTQUFPSCxRQUFQLENBQWdCQztBQUFoQjtBQUFBO0FBQUE7QUFBaUQ7QUFDN0MsV0FBTyxJQUFJUyxjQUFKLENBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDVCxPQUFyQyxFQUE4QyxJQUE5QyxDQUFQO0FBQ0g7O0FBRUQsU0FBT0gsT0FBUCxDQUFlQztBQUFmO0FBQUEsSUFBc0NhO0FBQXRDO0FBQUE7QUFBQTtBQUE0RTtBQUN4RSxXQUFPLElBQUlGLGNBQUosQ0FBbUJYLGFBQW5CLEVBQWtDLElBQWxDLEVBQXdDLElBQXhDLEVBQThDLElBQTlDLEVBQW9EYSxVQUFVLElBQUksRUFBbEUsQ0FBUDtBQUNIOztBQUVELFNBQU9uQixRQUFQLENBQWdCQztBQUFoQjtBQUFBLElBQWdDQztBQUFoQztBQUFBLElBQWlEaUI7QUFBakQ7QUFBQTtBQUFBO0FBQXVGO0FBQ25GLFdBQU8sSUFBSUYsY0FBSixDQUFtQmhCLE1BQW5CLEVBQTJCQyxPQUEzQixFQUFvQyxJQUFwQyxFQUEwQyxJQUExQyxFQUFnRGlCLFVBQVUsSUFBSSxFQUE5RCxDQUFQO0FBQ0g7O0FBN0J1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBjbGFzc2VzIHRoYXQgYWN0dWFsbHkgcHJvZHVjZSBwZXJtYWxpbmtzIChzdHJpbmdzKS5cbiAqIFRPRE86IENvbnZlcnQgdGhpcyB0byBhIHJlYWwgVHlwZVNjcmlwdCBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGVybWFsaW5rQ29uc3RydWN0b3Ige1xuICAgIGZvckV2ZW50KHJvb21JZDogc3RyaW5nLCBldmVudElkOiBzdHJpbmcsIHNlcnZlckNhbmRpZGF0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAgIH1cblxuICAgIGZvclJvb20ocm9vbUlkT3JBbGlhczogc3RyaW5nLCBzZXJ2ZXJDYW5kaWRhdGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBmb3JHcm91cChncm91cElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gICAgfVxuXG4gICAgZm9yVXNlcih1c2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBmb3JFbnRpdHkoZW50aXR5SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBpc1Blcm1hbGlua0hvc3QoaG9zdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICBwYXJzZVBlcm1hbGluayhmdWxsVXJsOiBzdHJpbmcpOiBQZXJtYWxpbmtQYXJ0cyB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG59XG5cbi8vIEluc3BpcmVkIGJ5L0JvcnJvd2VkIHdpdGggcGVybWlzc2lvbiBmcm9tIHRoZSBtYXRyaXgtYm90LXNkazpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90dXJ0MmxpdmUvbWF0cml4LWpzLWJvdC1zZGsvYmxvYi83YzQ2NjVjOWEyNWMyYzhlMGZlNGU1MDlmMjYxNjUwNWI1YjY2YTFjL3NyYy9QZXJtYWxpbmtzLnRzI0wxLUw2XG5leHBvcnQgY2xhc3MgUGVybWFsaW5rUGFydHMge1xuICAgIHJvb21JZE9yQWxpYXM6IHN0cmluZztcbiAgICBldmVudElkOiBzdHJpbmc7XG4gICAgdXNlcklkOiBzdHJpbmc7XG4gICAgZ3JvdXBJZDogc3RyaW5nO1xuICAgIHZpYVNlcnZlcnM6IHN0cmluZ1tdO1xuXG4gICAgY29uc3RydWN0b3Iocm9vbUlkT3JBbGlhczogc3RyaW5nLCBldmVudElkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nLCBncm91cElkOiBzdHJpbmcsIHZpYVNlcnZlcnM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHRoaXMucm9vbUlkT3JBbGlhcyA9IHJvb21JZE9yQWxpYXM7XG4gICAgICAgIHRoaXMuZXZlbnRJZCA9IGV2ZW50SWQ7XG4gICAgICAgIHRoaXMuZ3JvdXBJZCA9IGdyb3VwSWQ7XG4gICAgICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICAgICAgICB0aGlzLnZpYVNlcnZlcnMgPSB2aWFTZXJ2ZXJzO1xuICAgIH1cblxuICAgIHN0YXRpYyBmb3JVc2VyKHVzZXJJZDogc3RyaW5nKTogUGVybWFsaW5rUGFydHMge1xuICAgICAgICByZXR1cm4gbmV3IFBlcm1hbGlua1BhcnRzKG51bGwsIG51bGwsIHVzZXJJZCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGZvckdyb3VwKGdyb3VwSWQ6IHN0cmluZyk6IFBlcm1hbGlua1BhcnRzIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQZXJtYWxpbmtQYXJ0cyhudWxsLCBudWxsLCBudWxsLCBncm91cElkLCBudWxsKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZm9yUm9vbShyb29tSWRPckFsaWFzOiBzdHJpbmcsIHZpYVNlcnZlcnM6IHN0cmluZ1tdKTogUGVybWFsaW5rUGFydHMge1xuICAgICAgICByZXR1cm4gbmV3IFBlcm1hbGlua1BhcnRzKHJvb21JZE9yQWxpYXMsIG51bGwsIG51bGwsIG51bGwsIHZpYVNlcnZlcnMgfHwgW10pO1xuICAgIH1cblxuICAgIHN0YXRpYyBmb3JFdmVudChyb29tSWQ6IHN0cmluZywgZXZlbnRJZDogc3RyaW5nLCB2aWFTZXJ2ZXJzOiBzdHJpbmdbXSk6IFBlcm1hbGlua1BhcnRzIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQZXJtYWxpbmtQYXJ0cyhyb29tSWQsIGV2ZW50SWQsIG51bGwsIG51bGwsIHZpYVNlcnZlcnMgfHwgW10pO1xuICAgIH1cbn1cbiJdfQ==