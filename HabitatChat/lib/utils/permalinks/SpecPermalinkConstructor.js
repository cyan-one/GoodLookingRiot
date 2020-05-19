"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.baseUrl = exports.host = void 0;

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
const host = "matrix.to";
exports.host = host;
const baseUrl = "https://".concat(host);
/**
 * Generates matrix.to permalinks
 */

exports.baseUrl = baseUrl;

class SpecPermalinkConstructor extends _PermalinkConstructor.default {
  constructor() {
    super();
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
    return "".concat(baseUrl, "/#/").concat(roomId, "/").concat(eventId).concat(this.encodeServerCandidates(serverCandidates));
  }

  forRoom(roomIdOrAlias
  /*: string*/
  , serverCandidates
  /*: string[]*/
  )
  /*: string*/
  {
    return "".concat(baseUrl, "/#/").concat(roomIdOrAlias).concat(this.encodeServerCandidates(serverCandidates));
  }

  forUser(userId
  /*: string*/
  )
  /*: string*/
  {
    return "".concat(baseUrl, "/#/").concat(userId);
  }

  forGroup(groupId
  /*: string*/
  )
  /*: string*/
  {
    return "".concat(baseUrl, "/#/").concat(groupId);
  }

  forEntity(entityId
  /*: string*/
  )
  /*: string*/
  {
    return "".concat(baseUrl, "/#/").concat(entityId);
  }

  isPermalinkHost(testHost
  /*: string*/
  )
  /*: boolean*/
  {
    return testHost === host;
  }

  encodeServerCandidates(candidates
  /*: string[]*/
  ) {
    if (!candidates || candidates.length === 0) return '';
    return "?via=".concat(candidates.map(c => encodeURIComponent(c)).join("&via="));
  } // Heavily inspired by/borrowed from the matrix-bot-sdk (with permission):
  // https://github.com/turt2live/matrix-js-bot-sdk/blob/7c4665c9a25c2c8e0fe4e509f2616505b5b66a1c/src/Permalinks.ts#L33-L61


  parsePermalink(fullUrl
  /*: string*/
  )
  /*: PermalinkParts*/
  {
    if (!fullUrl || !fullUrl.startsWith(baseUrl)) {
      throw new Error("Does not appear to be a permalink");
    }

    const parts = fullUrl.substring("".concat(baseUrl, "/#/").length).split("/");
    const entity = parts[0];

    if (entity[0] === '@') {
      // Probably a user, no further parsing needed.
      return _PermalinkConstructor.PermalinkParts.forUser(entity);
    } else if (entity[0] === '+') {
      // Probably a group, no further parsing needed.
      return _PermalinkConstructor.PermalinkParts.forGroup(entity);
    } else if (entity[0] === '#' || entity[0] === '!') {
      if (parts.length === 1) {
        // room without event permalink
        const [roomId, query = ""] = entity.split("?");
        const via = query.split(/&?via=/g).filter(p => !!p);
        return _PermalinkConstructor.PermalinkParts.forRoom(roomId, via);
      } // rejoin the rest because v3 events can have slashes (annoyingly)


      const eventIdAndQuery = parts.length > 1 ? parts.slice(1).join('/') : "";
      const [eventId, query = ""] = eventIdAndQuery.split("?");
      const via = query.split(/&?via=/g).filter(p => !!p);
      return _PermalinkConstructor.PermalinkParts.forEvent(entity, eventId, via);
    } else {
      throw new Error("Unknown entity type in permalink");
    }
  }

}

exports.default = SpecPermalinkConstructor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wZXJtYWxpbmtzL1NwZWNQZXJtYWxpbmtDb25zdHJ1Y3Rvci5qcyJdLCJuYW1lcyI6WyJob3N0IiwiYmFzZVVybCIsIlNwZWNQZXJtYWxpbmtDb25zdHJ1Y3RvciIsIlBlcm1hbGlua0NvbnN0cnVjdG9yIiwiY29uc3RydWN0b3IiLCJmb3JFdmVudCIsInJvb21JZCIsImV2ZW50SWQiLCJzZXJ2ZXJDYW5kaWRhdGVzIiwiZW5jb2RlU2VydmVyQ2FuZGlkYXRlcyIsImZvclJvb20iLCJyb29tSWRPckFsaWFzIiwiZm9yVXNlciIsInVzZXJJZCIsImZvckdyb3VwIiwiZ3JvdXBJZCIsImZvckVudGl0eSIsImVudGl0eUlkIiwiaXNQZXJtYWxpbmtIb3N0IiwidGVzdEhvc3QiLCJjYW5kaWRhdGVzIiwibGVuZ3RoIiwibWFwIiwiYyIsImVuY29kZVVSSUNvbXBvbmVudCIsImpvaW4iLCJwYXJzZVBlcm1hbGluayIsImZ1bGxVcmwiLCJzdGFydHNXaXRoIiwiRXJyb3IiLCJwYXJ0cyIsInN1YnN0cmluZyIsInNwbGl0IiwiZW50aXR5IiwiUGVybWFsaW5rUGFydHMiLCJxdWVyeSIsInZpYSIsImZpbHRlciIsInAiLCJldmVudElkQW5kUXVlcnkiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQWhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JPLE1BQU1BLElBQUksR0FBRyxXQUFiOztBQUNBLE1BQU1DLE9BQU8scUJBQWNELElBQWQsQ0FBYjtBQUVQOzs7Ozs7QUFHZSxNQUFNRSx3QkFBTixTQUF1Q0MsNkJBQXZDLENBQTREO0FBQ3ZFQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQUNIOztBQUVEQyxFQUFBQSxRQUFRLENBQUNDO0FBQUQ7QUFBQSxJQUFpQkM7QUFBakI7QUFBQSxJQUFrQ0M7QUFBbEM7QUFBQTtBQUFBO0FBQXNFO0FBQzFFLHFCQUFVUCxPQUFWLGdCQUF1QkssTUFBdkIsY0FBaUNDLE9BQWpDLFNB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QixPQUFELEVBQVU0QixLQUFLLEdBQUMsRUFBaEIsSUFBc0JJLGVBQWUsQ0FBQ1AsS0FBaEIsQ0FBc0IsR0FBdEIsQ0FBNUI7QUFDQSxZQUFNSSxHQUFHLEdBQUdELEtBQUssQ0FBQ0gsS0FBTixDQUFZLFNBQVosRUFBdUJLLE1BQXZCLENBQThCQyxDQUFDLElBQUksQ0FBQyxDQUFDQSxDQUFyQyxDQUFaO0FBRUEsYUFBT0oscUNBQWU3QixRQUFmLENBQXdCNEIsTUFBeEIsRUFBZ0MxQixPQUFoQyxFQUF5QzZCLEdBQXpDLENBQVA7QUFDSCxLQWJNLE1BYUE7QUFDSCxZQUFNLElBQUlQLEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBQ0g7QUFDSjs7QUFsRXNFIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFBlcm1hbGlua0NvbnN0cnVjdG9yLCB7UGVybWFsaW5rUGFydHN9IGZyb20gXCIuL1Blcm1hbGlua0NvbnN0cnVjdG9yXCI7XG5cbmV4cG9ydCBjb25zdCBob3N0ID0gXCJtYXRyaXgudG9cIjtcbmV4cG9ydCBjb25zdCBiYXNlVXJsID0gYGh0dHBzOi8vJHtob3N0fWA7XG5cbi8qKlxuICogR2VuZXJhdGVzIG1hdHJpeC50byBwZXJtYWxpbmtzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNwZWNQZXJtYWxpbmtDb25zdHJ1Y3RvciBleHRlbmRzIFBlcm1hbGlua0NvbnN0cnVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBmb3JFdmVudChyb29tSWQ6IHN0cmluZywgZXZlbnRJZDogc3RyaW5nLCBzZXJ2ZXJDYW5kaWRhdGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHtiYXNlVXJsfS8jLyR7cm9vbUlkfS8ke2V2ZW50SWR9JHt0aGlzLmVuY29kZVNlcnZlckNhbmRpZGF0ZXMoc2VydmVyQ2FuZGlkYXRlcyl9YDtcbiAgICB9XG5cbiAgICBmb3JSb29tKHJvb21JZE9yQWxpYXM6IHN0cmluZywgc2VydmVyQ2FuZGlkYXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7YmFzZVVybH0vIy8ke3Jvb21JZE9yQWxpYXN9JHt0aGlzLmVuY29kZVNlcnZlckNhbmRpZGF0ZXMoc2VydmVyQ2FuZGlkYXRlcyl9YDtcbiAgICB9XG5cbiAgICBmb3JVc2VyKHVzZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke2Jhc2VVcmx9LyMvJHt1c2VySWR9YDtcbiAgICB9XG5cbiAgICBmb3JHcm91cChncm91cElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7YmFzZVVybH0vIy8ke2dyb3VwSWR9YDtcbiAgICB9XG5cbiAgICBmb3JFbnRpdHkoZW50aXR5SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHtiYXNlVXJsfS8jLyR7ZW50aXR5SWR9YDtcbiAgICB9XG5cbiAgICBpc1Blcm1hbGlua0hvc3QodGVzdEhvc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGVzdEhvc3QgPT09IGhvc3Q7XG4gICAgfVxuXG4gICAgZW5jb2RlU2VydmVyQ2FuZGlkYXRlcyhjYW5kaWRhdGVzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIWNhbmRpZGF0ZXMgfHwgY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgICAgICAgcmV0dXJuIGA/dmlhPSR7Y2FuZGlkYXRlcy5tYXAoYyA9PiBlbmNvZGVVUklDb21wb25lbnQoYykpLmpvaW4oXCImdmlhPVwiKX1gO1xuICAgIH1cblxuICAgIC8vIEhlYXZpbHkgaW5zcGlyZWQgYnkvYm9ycm93ZWQgZnJvbSB0aGUgbWF0cml4LWJvdC1zZGsgKHdpdGggcGVybWlzc2lvbik6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3R1cnQybGl2ZS9tYXRyaXgtanMtYm90LXNkay9ibG9iLzdjNDY2NWM5YTI1YzJjOGUwZmU0ZTUwOWYyNjE2NTA1YjViNjZhMWMvc3JjL1Blcm1hbGlua3MudHMjTDMzLUw2MVxuICAgIHBhcnNlUGVybWFsaW5rKGZ1bGxVcmw6IHN0cmluZyk6IFBlcm1hbGlua1BhcnRzIHtcbiAgICAgICAgaWYgKCFmdWxsVXJsIHx8ICFmdWxsVXJsLnN0YXJ0c1dpdGgoYmFzZVVybCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvZXMgbm90IGFwcGVhciB0byBiZSBhIHBlcm1hbGlua1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnRzID0gZnVsbFVybC5zdWJzdHJpbmcoYCR7YmFzZVVybH0vIy9gLmxlbmd0aCkuc3BsaXQoXCIvXCIpO1xuXG4gICAgICAgIGNvbnN0IGVudGl0eSA9IHBhcnRzWzBdO1xuICAgICAgICBpZiAoZW50aXR5WzBdID09PSAnQCcpIHtcbiAgICAgICAgICAgIC8vIFByb2JhYmx5IGEgdXNlciwgbm8gZnVydGhlciBwYXJzaW5nIG5lZWRlZC5cbiAgICAgICAgICAgIHJldHVybiBQZXJtYWxpbmtQYXJ0cy5mb3JVc2VyKGVudGl0eSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50aXR5WzBdID09PSAnKycpIHtcbiAgICAgICAgICAgIC8vIFByb2JhYmx5IGEgZ3JvdXAsIG5vIGZ1cnRoZXIgcGFyc2luZyBuZWVkZWQuXG4gICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yR3JvdXAoZW50aXR5KTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlbMF0gPT09ICcjJyB8fCBlbnRpdHlbMF0gPT09ICchJykge1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkgeyAvLyByb29tIHdpdGhvdXQgZXZlbnQgcGVybWFsaW5rXG4gICAgICAgICAgICAgICAgY29uc3QgW3Jvb21JZCwgcXVlcnk9XCJcIl0gPSBlbnRpdHkuc3BsaXQoXCI/XCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpYSA9IHF1ZXJ5LnNwbGl0KC8mP3ZpYT0vZykuZmlsdGVyKHAgPT4gISFwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yUm9vbShyb29tSWQsIHZpYSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlam9pbiB0aGUgcmVzdCBiZWNhdXNlIHYzIGV2ZW50cyBjYW4gaGF2ZSBzbGFzaGVzIChhbm5veWluZ2x5KVxuICAgICAgICAgICAgY29uc3QgZXZlbnRJZEFuZFF1ZXJ5ID0gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzLnNsaWNlKDEpLmpvaW4oJy8nKSA6IFwiXCI7XG4gICAgICAgICAgICBjb25zdCBbZXZlbnRJZCwgcXVlcnk9XCJcIl0gPSBldmVudElkQW5kUXVlcnkuc3BsaXQoXCI/XCIpO1xuICAgICAgICAgICAgY29uc3QgdmlhID0gcXVlcnkuc3BsaXQoLyY/dmlhPS9nKS5maWx0ZXIocCA9PiAhIXApO1xuXG4gICAgICAgICAgICByZXR1cm4gUGVybWFsaW5rUGFydHMuZm9yRXZlbnQoZW50aXR5LCBldmVudElkLCB2aWEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBlbnRpdHkgdHlwZSBpbiBwZXJtYWxpbmtcIik7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=