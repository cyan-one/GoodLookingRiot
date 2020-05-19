"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _PermalinkConstructor = _interopRequireWildcard(require("./PermalinkConstructor"));

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
 * Generates permalinks that self-reference the running webapp
 */
class RiotPermalinkConstructor extends _PermalinkConstructor.default {
  constructor(riotUrl
  /*: string*/
  ) {
    super();
    (0, _defineProperty2.default)(this, "_riotUrl", void 0);
    this._riotUrl = riotUrl;

    if (!this._riotUrl.startsWith("http:") && !this._riotUrl.startsWith("https:")) {
      throw new Error("Riot prefix URL does not appear to be an HTTP(S) URL");
    }
  }

  forEvent(roomId
  /*: string*/
  , eventId
  /*: string*/
  , serverCandidates
  /*: string[]*/
  )
  /*: string*/
  {
    return "".concat(this._riotUrl, "/#/room/").concat(roomId, "/").concat(eventId).concat(this.encodeServerCandidates(serverCandidates));
  }

  forRoom(roomIdOrAlias
  /*: string*/
  , serverCandidates
  /*: string[]*/
  )
  /*: string*/
  {
    return "".concat(this._riotUrl, "/#/room/").concat(roomIdOrAlias).concat(this.encodeServerCandidates(serverCandidates));
  }

  forUser(userId
  /*: string*/
  )
  /*: string*/
  {
    return "".concat(this._riotUrl, "/#/user/").concat(userId);
  }

  forGroup(groupId
  /*: string*/
  )
  /*: string*/
  {
    return "".concat(this._riotUrl, "/#/group/").concat(groupId);
  }

  forEntity(entityId
  /*: string*/
  )
  /*: string*/
  {
    if (entityId[0] === '!' || entityId[0] === '#') {
      return this.forRoom(entityId);
    } else if (entityId[0] === '@') {
      return this.forUser(entityId);
    } else if (entityId[0] === '+') {
      return this.forGroup(entityId);
    } else throw new Error("Unrecognized entity");
  }

  isPermalinkHost(testHost
  /*: string*/
  )
  /*: boolean*/
  {
    const parsedUrl = new URL(this._riotUrl);
    return testHost === (parsedUrl.host || parsedUrl.hostname); // one of the hosts should match
  }

  encodeServerCandidates(candidates
  /*: string[]*/
  ) {
    if (!candidates || candidates.length === 0) return '';
    return "?via=".concat(candidates.map(c => encodeURIComponent(c)).join("&via="));
  } // Heavily inspired by/borrowed from the matrix-bot-sdk (with permission):
  // https://github.com/turt2live/matrix-js-bot-sdk/blob/7c4665c9a25c2c8e0fe4e509f2616505b5b66a1c/src/Permalinks.ts#L33-L61
  // Adapted for Riot's URL format


  parsePermalink(fullUrl
  /*: string*/
  )
  /*: PermalinkParts*/
  {
    if (!fullUrl || !fullUrl.startsWith(this._riotUrl)) {
      throw new Error("Does not appear to be a permalink");
    }

    const parts = fullUrl.substring("".concat(this._riotUrl, "/#/").length).split("/");

    if (parts.length < 2) {
      // we're expecting an entity and an ID of some kind at least
      throw new Error("URL is missing parts");
    }

    const entityType = parts[0];
    const entity = parts[1];

    if (entityType === 'user') {
      // Probably a user, no further parsing needed.
      return _PermalinkConstructor.PermalinkParts.forUser(entity);
    } else if (entityType === 'group') {
      // Probably a group, no further parsing needed.
      return _PermalinkConstructor.PermalinkParts.forGroup(entity);
    } else if (entityType === 'room') {
      if (parts.length === 2) {
        return _PermalinkConstructor.PermalinkParts.forRoom(entity, []);
      } // rejoin the rest because v3 events can have slashes (annoyingly)


      const eventIdAndQuery = parts.length > 2 ? parts.slice(2).join('/') : "";
      const secondaryParts = eventIdAndQuery.split("?");
      const eventId = secondaryParts[0];
      const query = secondaryParts.length > 1 ? secondaryParts[1] : ""; // TODO: Verify Riot works with via args

      const via = query.split("via=").filter(p => !!p);
      return _PermalinkConstructor.PermalinkParts.forEvent(entity, eventId, via);
    } else {
      throw new Error("Unknown entity type in permalink");
    }
  }

}

exports.default = RiotPermalinkConstructor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wZXJtYWxpbmtzL1Jpb3RQZXJtYWxpbmtDb25zdHJ1Y3Rvci5qcyJdLCJuYW1lcyI6WyJSaW90UGVybWFsaW5rQ29uc3RydWN0b3IiLCJQZXJtYWxpbmtDb25zdHJ1Y3RvciIsImNvbnN0cnVjdG9yIiwicmlvdFVybCIsIl9yaW90VXJsIiwic3RhcnRzV2l0aCIsIkVycm9yIiwiZm9yRXZlbnQiLCJyb29tSWQiLCJldmVudElkIiwic2VydmVyQ2FuZGlkYXRlcyIsImVuY29kZVNlcnZlckNhbmRpZGF0ZXMiLCJmb3JSb29tIiwicm9vbUlkT3JBbGlhcyIsImZvclVzZXIiLCJ1c2VySWQiLCJmb3JHcm91cCIsImdyb3VwSWQiLCJmb3JFbnRpdHkiLCJlbnRpdHlJZCIsImlzUGVybWFsaW5rSG9zdCIsInRlc3RIb3N0IiwicGFyc2VkVXJsIiwiVVJMIiwiaG9zdCIsImhvc3RuYW1lIiwiY2FuZGlkYXRlcyIsImxlbmd0aCIsIm1hcCIsImMiLCJlbmNvZGVVUklDb21wb25lbnQiLCJqb2luIiwicGFyc2VQZXJtYWxpbmsiLCJmdWxsVXJsIiwicGFydHMiLCJzdWJzdHJpbmciLCJzcGxpdCIsImVudGl0eVR5cGUiLCJlbnRpdHkiLCJQZXJtYWxpbmtQYXJ0cyIsImV2ZW50SWRBbmRRdWVyeSIsInNsaWNlIiwic2Vjb25kYXJ5UGFydHMiLCJxdWVyeSIsInZpYSIsImZpbHRlciIsInAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBaEJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7QUFHZSxNQUFNQSx3QkFBTixTQUF1Q0MsNkJBQXZDLENBQTREO0FBR3ZFQyxFQUFBQSxXQUFXLENBQUNDO0FBQUQ7QUFBQSxJQUFrQjtBQUN6QjtBQUR5QjtBQUV6QixTQUFLQyxRQUFMLEdBQWdCRCxPQUFoQjs7QUFFQSxRQUFJLENBQUMsS0FBS0MsUUFBTCxDQUFjQyxVQUFkLENBQXlCLE9BQXpCLENBQUQsSUFBc0MsQ0FBQyxLQUFLRCxRQUFMLENBQWNDLFVBQWQsQ0FBeUIsUUFBekIsQ0FBM0MsRUFBK0U7QUFDM0UsWUFBTSxJQUFJQyxLQUFKLENBQVUsc0RBQVYsQ0FBTjtBQUNIO0FBQ0o7O0FBRURDLEVBQUFBLFFBQVEsQ0FBQ0M7QUFBRDtBQUFBLElBQWlCQztBQUFqQjtBQUFBLElBQWtDQztBQUFsQztBQUFBO0FBQUE7QUFBc0U7QUFDMUUscUJBQVUsS0FBS04sUUFBZixxQkFBa0NJLE1BQWxDLGNBQTRDQyxPQUE1QyxTQUFzRCxLQUFLRSxzQkFBTCxDQUE0QkQsZ0JBQTVCLENBQXREO0FBQ0g7O0FBRURFLEVBQUFBLE9BQU8sQ0FBQ0M7QUFBRDtBQUFBLElBQXdCSDtBQUF4QjtBQUFBO0FBQUE7QUFBNEQ7QUFDL0QscUJBQVUsS0FBS04sUUFBZixxQkFBa0NTLGFBQWxDLFNBQWtELEtBQUtGLHNCQUFMLENBQTRCRCxnQkFBNUIsQ0FBbEQ7QUFDSDs7QUFFREksRUFBQUEsT0FBTyxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUF5QjtBQUM1QixxQkFBVSxLQUFLWCxRQUFmLHFCQUFrQ1csTUFBbEM7QUFDSDs7QUFFREMsRUFBQUEsUUFBUSxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUEwQjtBQUM5QixxQkFBVSxLQUFLYixRQUFmLHNCQUFtQ2EsT0FBbkM7QUFDSDs7QUFFREMsRUFBQUEsU0FBUyxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUEyQjtBQUNoQyxRQUFJQSxRQUFRLENBQUMsQ0FBRCxDQUFSLEtBQWdCLEdBQWhCLElBQXVCQSxRQUFRLENBQUMsQ0FBRCxDQUFSLEtBQWdCLEdBQTNDLEVBQWdEO0FBQzVDLGFBQU8sS0FBS1AsT0FBTCxDQUFhTyxRQUFiLENBQVA7QUFDSCxLQUZELE1BRU8sSUFBSUEsUUFBUSxDQUFDLENBQUQsQ0FBUixLQUFnQixHQUFwQixFQUF5QjtBQUM1QixhQUFPLEtBQUtMLE9BQUwsQ0FBYUssUUFBYixDQUFQO0FBQ0gsS0FGTSxNQUVBLElBQUlBLFFBQVEsQ0FBQyxDQUFELENBQVIsS0FBZ0IsR0FBcEIsRUFBeUI7QUFDNUIsYUFBTyxLQUFLSCxRQUFMLENBQWNHLFFBQWQsQ0FBUDtBQUNILEtBRk0sTUFFQSxNQUFNLElBQUliLEtBQUosQ0FBVSxxQkFBVixDQUFOO0FBQ1Y7O0FBRURjLEVBQUFBLGVBQWUsQ0FBQ0M7QUFBRDtBQUFBO0FBQUE7QUFBNEI7QUFDdkMsVUFBTUMsU0FBUyxHQUFHLElBQUlDLEdBQUosQ0FBUSxLQUFLbkIsUUFBYixDQUFsQjtBQUNBLFdBQU9pQixRQUFRLE1BQU1DLFNBQVMsQ0FBQ0UsSUFBVixJQUFrQkYsU0FBUyxDQUFDRyxRQUFsQyxDQUFmLENBRnVDLENBRXFCO0FBQy9EOztBQUVEZCxFQUFBQSxzQkFBc0IsQ0FBQ2U7QUFBRDtBQUFBLElBQXVCO0FBQ3pDLFFBQUksQ0FBQ0EsVUFBRCxJQUFlQSxVQUFVLENBQUNDLE1BQVgsS0FBc0IsQ0FBekMsRUFBNEMsT0FBTyxFQUFQO0FBQzVDLDBCQUFlRCxVQUFVLENBQUNFLEdBQVgsQ0FBZUMsQ0FBQyxJQUFJQyxrQkFBa0IsQ0FBQ0QsQ0FBRCxDQUF0QyxFQUEyQ0UsSUFBM0MsQ0FBZ0QsT0FBaEQsQ0FBZjtBQUNILEdBOUNzRSxDQWdEdkU7QUFDQTtBQUNBOzs7QUFDQUMsRUFBQUEsY0FBYyxDQUFDQztBQUFEO0FBQUE7QUFBQTtBQUFrQztBQUM1QyxRQUFJLENBQUNBLE9BQUQsSUFBWSxDQUFDQSxPQUFPLENBQUM1QixVQUFSLENBQW1CLEtBQUtELFFBQXhCLENBQWpCLEVBQW9EO0FBQ2hELFlBQU0sSUFBSUUsS0FBSixDQUFVLG1DQUFWLENBQU47QUFDSDs7QUFFRCxVQUFNNEIsS0FBSyxHQUFHRCxPQUFPLENBQUNFLFNBQVIsQ0FBa0IsVUFBRyxLQUFLL0IsUUFBUixTQUFzQnVCLE1BQXhDLEVBQWdEUyxLQUFoRCxDQUFzRCxHQUF0RCxDQUFkOztBQUNBLFFBQUlGLEtBQUssQ0FBQ1AsTUFBTixHQUFlLENBQW5CLEVBQXNCO0FBQUU7QUFDcEIsWUFBTSxJQUFJckIsS0FBSixDQUFVLHNCQUFWLENBQU47QUFDSDs7QUFFRCxVQUFNK0IsVUFBVSxHQUFHSCxLQUFLLENBQUMsQ0FBRCxDQUF4QjtBQUNBLFVBQU1JLE1BQU0sR0FBR0osS0FBSyxDQUFDLENBQUQsQ0FBcEI7O0FBQ0EsUUFBSUcsVUFBVSxLQUFLLE1BQW5CLEVBQTJCO0FBQ3ZCO0FBQ0EsYUFBT0UscUNBQWV6QixPQUFmLENBQXVCd0IsTUFBdkIsQ0FBUDtBQUNILEtBSEQsTUFHTyxJQUFJRCxVQUFVLEtBQUssT0FBbkIsRUFBNEI7QUFDL0I7QUFDQSxhQUFPRSxxQ0FBZXZCLFFBQWYsQ0FBd0JzQixNQUF4QixDQUFQO0FBQ0gsS0FITSxNQUdBLElBQUlELFVBQVUsS0FBSyxNQUFuQixFQUEyQjtBQUM5QixVQUFJSCxLQUFLLENBQUNQLE1BQU4sS0FBaUIsQ0FBckIsRUFBd0I7QUFDcEIsZUFBT1kscUNBQWUzQixPQUFmLENBQXVCMEIsTUFBdkIsRUFBK0IsRUFBL0IsQ0FBUDtBQUNILE9BSDZCLENBSzlCOzs7QUFDQSxZQUFNRSxlQUFlLEdBQUdOLEtBQUssQ0FBQ1AsTUFBTixHQUFlLENBQWYsR0FBbUJPLEtBQUssQ0FBQ08sS0FBTixDQUFZLENBQVosRUFBZVYsSUFBZixDQUFvQixHQUFwQixDQUFuQixHQUE4QyxFQUF0RTtBQUNBLFlBQU1XLGNBQWMsR0FBR0YsZUFBZSxDQUFDSixLQUFoQixDQUFzQixHQUF0QixDQUF2QjtBQUVBLFlBQU0zQixPQUFPLEdBQUdpQyxjQUFjLENBQUMsQ0FBRCxDQUE5QjtBQUNBLFlBQU1DLEtBQUssR0FBR0QsY0FBYyxDQUFDZixNQUFmLEdBQXdCLENBQXhCLEdBQTRCZSxjQUFjLENBQUMsQ0FBRCxDQUExQyxHQUFnRCxFQUE5RCxDQVY4QixDQVk5Qjs7QUFDQSxZQUFNRSxHQUFHLEdBQUdELEtBQUssQ0FBQ1AsS0FBTixDQUFZLE1BQVosRUFBb0JTLE1BQXBCLENBQTJCQyxDQUFDLElBQUksQ0FBQyxDQUFDQSxDQUFsQyxDQUFaO0FBRUEsYUFBT1AscUNBQWVoQyxRQUFmLENBQXdCK0IsTUFBeEIsRUFBZ0M3QixPQUFoQyxFQUF5Q21DLEdBQXpDLENBQVA7QUFDSCxLQWhCTSxNQWdCQTtBQUNILFlBQU0sSUFBSXRDLEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBQ0g7QUFDSjs7QUF4RnNFIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFBlcm1hbGlua0NvbnN0cnVjdG9yLCB7UGVybWFsaW5rUGFydHN9IGZyb20gXCIuL1Blcm1hbGlua0NvbnN0cnVjdG9yXCI7XG5cbi8qKlxuICogR2VuZXJhdGVzIHBlcm1hbGlua3MgdGhhdCBzZWxmLXJlZmVyZW5jZSB0aGUgcnVubmluZyB3ZWJhcHBcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmlvdFBlcm1hbGlua0NvbnN0cnVjdG9yIGV4dGVuZHMgUGVybWFsaW5rQ29uc3RydWN0b3Ige1xuICAgIF9yaW90VXJsOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihyaW90VXJsOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fcmlvdFVybCA9IHJpb3RVcmw7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9yaW90VXJsLnN0YXJ0c1dpdGgoXCJodHRwOlwiKSAmJiAhdGhpcy5fcmlvdFVybC5zdGFydHNXaXRoKFwiaHR0cHM6XCIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSaW90IHByZWZpeCBVUkwgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGFuIEhUVFAoUykgVVJMXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yRXZlbnQocm9vbUlkOiBzdHJpbmcsIGV2ZW50SWQ6IHN0cmluZywgc2VydmVyQ2FuZGlkYXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fcmlvdFVybH0vIy9yb29tLyR7cm9vbUlkfS8ke2V2ZW50SWR9JHt0aGlzLmVuY29kZVNlcnZlckNhbmRpZGF0ZXMoc2VydmVyQ2FuZGlkYXRlcyl9YDtcbiAgICB9XG5cbiAgICBmb3JSb29tKHJvb21JZE9yQWxpYXM6IHN0cmluZywgc2VydmVyQ2FuZGlkYXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fcmlvdFVybH0vIy9yb29tLyR7cm9vbUlkT3JBbGlhc30ke3RoaXMuZW5jb2RlU2VydmVyQ2FuZGlkYXRlcyhzZXJ2ZXJDYW5kaWRhdGVzKX1gO1xuICAgIH1cblxuICAgIGZvclVzZXIodXNlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fcmlvdFVybH0vIy91c2VyLyR7dXNlcklkfWA7XG4gICAgfVxuXG4gICAgZm9yR3JvdXAoZ3JvdXBJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuX3Jpb3RVcmx9LyMvZ3JvdXAvJHtncm91cElkfWA7XG4gICAgfVxuXG4gICAgZm9yRW50aXR5KGVudGl0eUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZW50aXR5SWRbMF0gPT09ICchJyB8fCBlbnRpdHlJZFswXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JSb29tKGVudGl0eUlkKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlJZFswXSA9PT0gJ0AnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JVc2VyKGVudGl0eUlkKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlJZFswXSA9PT0gJysnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JHcm91cChlbnRpdHlJZCk7XG4gICAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgZW50aXR5XCIpO1xuICAgIH1cblxuICAgIGlzUGVybWFsaW5rSG9zdCh0ZXN0SG9zdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFVybCA9IG5ldyBVUkwodGhpcy5fcmlvdFVybCk7XG4gICAgICAgIHJldHVybiB0ZXN0SG9zdCA9PT0gKHBhcnNlZFVybC5ob3N0IHx8IHBhcnNlZFVybC5ob3N0bmFtZSk7IC8vIG9uZSBvZiB0aGUgaG9zdHMgc2hvdWxkIG1hdGNoXG4gICAgfVxuXG4gICAgZW5jb2RlU2VydmVyQ2FuZGlkYXRlcyhjYW5kaWRhdGVzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIWNhbmRpZGF0ZXMgfHwgY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgICAgICAgcmV0dXJuIGA/dmlhPSR7Y2FuZGlkYXRlcy5tYXAoYyA9PiBlbmNvZGVVUklDb21wb25lbnQoYykpLmpvaW4oXCImdmlhPVwiKX1gO1xuICAgIH1cblxuICAgIC8vIEhlYXZpbHkgaW5zcGlyZWQgYnkvYm9ycm93ZWQgZnJvbSB0aGUgbWF0cml4LWJvdC1zZGsgKHdpdGggcGVybWlzc2lvbik6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3R1cnQybGl2ZS9tYXRyaXgtanMtYm90LXNkay9ibG9iLzdjNDY2NWM5YTI1YzJjOGUwZmU0ZTUwOWYyNjE2NTA1YjViNjZhMWMvc3JjL1Blcm1hbGlua3MudHMjTDMzLUw2MVxuICAgIC8vIEFkYXB0ZWQgZm9yIFJpb3QncyBVUkwgZm9ybWF0XG4gICAgcGFyc2VQZXJtYWxpbmsoZnVsbFVybDogc3RyaW5nKTogUGVybWFsaW5rUGFydHMge1xuICAgICAgICBpZiAoIWZ1bGxVcmwgfHwgIWZ1bGxVcmwuc3RhcnRzV2l0aCh0aGlzLl9yaW90VXJsKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9lcyBub3QgYXBwZWFyIHRvIGJlIGEgcGVybWFsaW5rXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFydHMgPSBmdWxsVXJsLnN1YnN0cmluZyhgJHt0aGlzLl9yaW90VXJsfS8jL2AubGVuZ3RoKS5zcGxpdChcIi9cIik7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB7IC8vIHdlJ3JlIGV4cGVjdGluZyBhbiBlbnRpdHkgYW5kIGFuIElEIG9mIHNvbWUga2luZCBhdCBsZWFzdFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVVJMIGlzIG1pc3NpbmcgcGFydHNcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbnRpdHlUeXBlID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IHBhcnRzWzFdO1xuICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gJ3VzZXInKSB7XG4gICAgICAgICAgICAvLyBQcm9iYWJseSBhIHVzZXIsIG5vIGZ1cnRoZXIgcGFyc2luZyBuZWVkZWQuXG4gICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yVXNlcihlbnRpdHkpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudGl0eVR5cGUgPT09ICdncm91cCcpIHtcbiAgICAgICAgICAgIC8vIFByb2JhYmx5IGEgZ3JvdXAsIG5vIGZ1cnRoZXIgcGFyc2luZyBuZWVkZWQuXG4gICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yR3JvdXAoZW50aXR5KTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSAncm9vbScpIHtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yUm9vbShlbnRpdHksIFtdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVqb2luIHRoZSByZXN0IGJlY2F1c2UgdjMgZXZlbnRzIGNhbiBoYXZlIHNsYXNoZXMgKGFubm95aW5nbHkpXG4gICAgICAgICAgICBjb25zdCBldmVudElkQW5kUXVlcnkgPSBwYXJ0cy5sZW5ndGggPiAyID8gcGFydHMuc2xpY2UoMikuam9pbignLycpIDogXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IHNlY29uZGFyeVBhcnRzID0gZXZlbnRJZEFuZFF1ZXJ5LnNwbGl0KFwiP1wiKTtcblxuICAgICAgICAgICAgY29uc3QgZXZlbnRJZCA9IHNlY29uZGFyeVBhcnRzWzBdO1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBzZWNvbmRhcnlQYXJ0cy5sZW5ndGggPiAxID8gc2Vjb25kYXJ5UGFydHNbMV0gOiBcIlwiO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBWZXJpZnkgUmlvdCB3b3JrcyB3aXRoIHZpYSBhcmdzXG4gICAgICAgICAgICBjb25zdCB2aWEgPSBxdWVyeS5zcGxpdChcInZpYT1cIikuZmlsdGVyKHAgPT4gISFwKTtcblxuICAgICAgICAgICAgcmV0dXJuIFBlcm1hbGlua1BhcnRzLmZvckV2ZW50KGVudGl0eSwgZXZlbnRJZCwgdmlhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gZW50aXR5IHR5cGUgaW4gcGVybWFsaW5rXCIpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19