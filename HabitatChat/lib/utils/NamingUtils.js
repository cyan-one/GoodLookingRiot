"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateHumanReadableId = generateHumanReadableId;

var projectNameGenerator = _interopRequireWildcard(require("project-name-generator"));

/*
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

/**
 * Generates a human readable identifier. This should not be used for anything
 * which needs secure/cryptographic random: just a level uniquness that is offered
 * by something like Date.now().
 * @returns {string} The randomly generated ID
 */
function generateHumanReadableId()
/*: string*/
{
  return projectNameGenerator({
    words: 3
  }).raw.map(w => {
    return w[0].toUpperCase() + w.substring(1).toLowerCase();
  }).join('');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9OYW1pbmdVdGlscy50cyJdLCJuYW1lcyI6WyJnZW5lcmF0ZUh1bWFuUmVhZGFibGVJZCIsInByb2plY3ROYW1lR2VuZXJhdG9yIiwid29yZHMiLCJyYXciLCJtYXAiLCJ3IiwidG9VcHBlckNhc2UiLCJzdWJzdHJpbmciLCJ0b0xvd2VyQ2FzZSIsImpvaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWdCQTs7QUFoQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7OztBQU1PLFNBQVNBLHVCQUFUO0FBQUE7QUFBMkM7QUFDOUMsU0FBT0Msb0JBQW9CLENBQUM7QUFBQ0MsSUFBQUEsS0FBSyxFQUFFO0FBQVIsR0FBRCxDQUFwQixDQUFpQ0MsR0FBakMsQ0FBcUNDLEdBQXJDLENBQXlDQyxDQUFDLElBQUk7QUFDakQsV0FBT0EsQ0FBQyxDQUFDLENBQUQsQ0FBRCxDQUFLQyxXQUFMLEtBQXFCRCxDQUFDLENBQUNFLFNBQUYsQ0FBWSxDQUFaLEVBQWVDLFdBQWYsRUFBNUI7QUFDSCxHQUZNLEVBRUpDLElBRkksQ0FFQyxFQUZELENBQVA7QUFHSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCAqIGFzIHByb2plY3ROYW1lR2VuZXJhdG9yIGZyb20gXCJwcm9qZWN0LW5hbWUtZ2VuZXJhdG9yXCI7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgaHVtYW4gcmVhZGFibGUgaWRlbnRpZmllci4gVGhpcyBzaG91bGQgbm90IGJlIHVzZWQgZm9yIGFueXRoaW5nXG4gKiB3aGljaCBuZWVkcyBzZWN1cmUvY3J5cHRvZ3JhcGhpYyByYW5kb206IGp1c3QgYSBsZXZlbCB1bmlxdW5lc3MgdGhhdCBpcyBvZmZlcmVkXG4gKiBieSBzb21ldGhpbmcgbGlrZSBEYXRlLm5vdygpLlxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHJhbmRvbWx5IGdlbmVyYXRlZCBJRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVIdW1hblJlYWRhYmxlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJvamVjdE5hbWVHZW5lcmF0b3Ioe3dvcmRzOiAzfSkucmF3Lm1hcCh3ID0+IHtcbiAgICAgICAgcmV0dXJuIHdbMF0udG9VcHBlckNhc2UoKSArIHcuc3Vic3RyaW5nKDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgfSkuam9pbignJyk7XG59XG4iXX0=