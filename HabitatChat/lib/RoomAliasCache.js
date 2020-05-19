"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storeRoomAliasInCache = storeRoomAliasInCache;
exports.getCachedRoomIDForAlias = getCachedRoomIDForAlias;

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
 * This is meant to be a cache of room alias to room ID so that moving between
 * rooms happens smoothly (for example using browser back / forward buttons).
 *
 * For the moment, it's in memory only and so only applies for the current
 * session for simplicity, but could be extended further in the future.
 *
 * A similar thing could also be achieved via `pushState` with a state object,
 * but keeping it separate like this seems easier in case we do want to extend.
 */
const aliasToIDMap = new Map();

function storeRoomAliasInCache(alias, id) {
  aliasToIDMap.set(alias, id);
}

function getCachedRoomIDForAlias(alias) {
  return aliasToIDMap.get(alias);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Sb29tQWxpYXNDYWNoZS5qcyJdLCJuYW1lcyI6WyJhbGlhc1RvSURNYXAiLCJNYXAiLCJzdG9yZVJvb21BbGlhc0luQ2FjaGUiLCJhbGlhcyIsImlkIiwic2V0IiwiZ2V0Q2FjaGVkUm9vbUlERm9yQWxpYXMiLCJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7Ozs7QUFVQSxNQUFNQSxZQUFZLEdBQUcsSUFBSUMsR0FBSixFQUFyQjs7QUFFTyxTQUFTQyxxQkFBVCxDQUErQkMsS0FBL0IsRUFBc0NDLEVBQXRDLEVBQTBDO0FBQzdDSixFQUFBQSxZQUFZLENBQUNLLEdBQWIsQ0FBaUJGLEtBQWpCLEVBQXdCQyxFQUF4QjtBQUNIOztBQUVNLFNBQVNFLHVCQUFULENBQWlDSCxLQUFqQyxFQUF3QztBQUMzQyxTQUFPSCxZQUFZLENBQUNPLEdBQWIsQ0FBaUJKLEtBQWpCLENBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qKlxuICogVGhpcyBpcyBtZWFudCB0byBiZSBhIGNhY2hlIG9mIHJvb20gYWxpYXMgdG8gcm9vbSBJRCBzbyB0aGF0IG1vdmluZyBiZXR3ZWVuXG4gKiByb29tcyBoYXBwZW5zIHNtb290aGx5IChmb3IgZXhhbXBsZSB1c2luZyBicm93c2VyIGJhY2sgLyBmb3J3YXJkIGJ1dHRvbnMpLlxuICpcbiAqIEZvciB0aGUgbW9tZW50LCBpdCdzIGluIG1lbW9yeSBvbmx5IGFuZCBzbyBvbmx5IGFwcGxpZXMgZm9yIHRoZSBjdXJyZW50XG4gKiBzZXNzaW9uIGZvciBzaW1wbGljaXR5LCBidXQgY291bGQgYmUgZXh0ZW5kZWQgZnVydGhlciBpbiB0aGUgZnV0dXJlLlxuICpcbiAqIEEgc2ltaWxhciB0aGluZyBjb3VsZCBhbHNvIGJlIGFjaGlldmVkIHZpYSBgcHVzaFN0YXRlYCB3aXRoIGEgc3RhdGUgb2JqZWN0LFxuICogYnV0IGtlZXBpbmcgaXQgc2VwYXJhdGUgbGlrZSB0aGlzIHNlZW1zIGVhc2llciBpbiBjYXNlIHdlIGRvIHdhbnQgdG8gZXh0ZW5kLlxuICovXG5jb25zdCBhbGlhc1RvSURNYXAgPSBuZXcgTWFwKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVJvb21BbGlhc0luQ2FjaGUoYWxpYXMsIGlkKSB7XG4gICAgYWxpYXNUb0lETWFwLnNldChhbGlhcywgaWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGVkUm9vbUlERm9yQWxpYXMoYWxpYXMpIHtcbiAgICByZXR1cm4gYWxpYXNUb0lETWFwLmdldChhbGlhcyk7XG59XG4iXX0=