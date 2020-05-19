"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeType = makeType;

/*
Copyright 2019 New Vector Ltd

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
 * Creates a class of a given type using the objects defined. This
 * is a stopgap function while we don't have TypeScript interfaces.
 * In future, we'd define the `type` as an interface and just cast
 * it instead of cheating like we are here.
 * @param {Type} Type The type of class to construct.
 * @param {*} opts The options (properties) to set on the object.
 * @returns {*} The created object.
 */
function makeType(Type
/*: any*/
, opts
/*: any*/
) {
  const c = new Type();
  Object.assign(c, opts);
  return c;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9UeXBlVXRpbHMuanMiXSwibmFtZXMiOlsibWFrZVR5cGUiLCJUeXBlIiwib3B0cyIsImMiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7Ozs7Ozs7O0FBU08sU0FBU0EsUUFBVCxDQUFrQkM7QUFBbEI7QUFBQSxFQUE2QkM7QUFBN0I7QUFBQSxFQUF3QztBQUMzQyxRQUFNQyxDQUFDLEdBQUcsSUFBSUYsSUFBSixFQUFWO0FBQ0FHLEVBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjRixDQUFkLEVBQWlCRCxJQUFqQjtBQUNBLFNBQU9DLENBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qKlxuICogQ3JlYXRlcyBhIGNsYXNzIG9mIGEgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgb2JqZWN0cyBkZWZpbmVkLiBUaGlzXG4gKiBpcyBhIHN0b3BnYXAgZnVuY3Rpb24gd2hpbGUgd2UgZG9uJ3QgaGF2ZSBUeXBlU2NyaXB0IGludGVyZmFjZXMuXG4gKiBJbiBmdXR1cmUsIHdlJ2QgZGVmaW5lIHRoZSBgdHlwZWAgYXMgYW4gaW50ZXJmYWNlIGFuZCBqdXN0IGNhc3RcbiAqIGl0IGluc3RlYWQgb2YgY2hlYXRpbmcgbGlrZSB3ZSBhcmUgaGVyZS5cbiAqIEBwYXJhbSB7VHlwZX0gVHlwZSBUaGUgdHlwZSBvZiBjbGFzcyB0byBjb25zdHJ1Y3QuXG4gKiBAcGFyYW0geyp9IG9wdHMgVGhlIG9wdGlvbnMgKHByb3BlcnRpZXMpIHRvIHNldCBvbiB0aGUgb2JqZWN0LlxuICogQHJldHVybnMgeyp9IFRoZSBjcmVhdGVkIG9iamVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VUeXBlKFR5cGU6IGFueSwgb3B0czogYW55KSB7XG4gICAgY29uc3QgYyA9IG5ldyBUeXBlKCk7XG4gICAgT2JqZWN0LmFzc2lnbihjLCBvcHRzKTtcbiAgICByZXR1cm4gYztcbn1cbiJdfQ==