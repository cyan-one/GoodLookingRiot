"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
Copyright 2016 OpenMarket Ltd

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

/*
 * Holds the current Platform object used by the code to do anything
 * specific to the platform we're running on (eg. web, electron)
 * Platforms are provided by the app layer.
 * This allows the app layer to set a Platform without necessarily
 * having to have a MatrixChat object
 */
class PlatformPeg {
  constructor() {
    this.platform = null;
  }
  /**
   * Returns the current Platform object for the application.
   * This should be an instance of a class extending BasePlatform.
   */


  get() {
    return this.platform;
  }
  /**
   * Sets the current platform handler object to use for the
   * application.
   * This should be an instance of a class extending BasePlatform.
   */


  set(plaf) {
    this.platform = plaf;
  }

}

if (!global.mxPlatformPeg) {
  global.mxPlatformPeg = new PlatformPeg();
}

var _default = global.mxPlatformPeg;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9QbGF0Zm9ybVBlZy5qcyJdLCJuYW1lcyI6WyJQbGF0Zm9ybVBlZyIsImNvbnN0cnVjdG9yIiwicGxhdGZvcm0iLCJnZXQiLCJzZXQiLCJwbGFmIiwiZ2xvYmFsIiwibXhQbGF0Zm9ybVBlZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOzs7Ozs7O0FBT0EsTUFBTUEsV0FBTixDQUFrQjtBQUNkQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixTQUFLQyxRQUFMLEdBQWdCLElBQWhCO0FBQ0g7QUFFRDs7Ozs7O0FBSUFDLEVBQUFBLEdBQUcsR0FBRztBQUNGLFdBQU8sS0FBS0QsUUFBWjtBQUNIO0FBRUQ7Ozs7Ozs7QUFLQUUsRUFBQUEsR0FBRyxDQUFDQyxJQUFELEVBQU87QUFDTixTQUFLSCxRQUFMLEdBQWdCRyxJQUFoQjtBQUNIOztBQXBCYTs7QUF1QmxCLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxhQUFaLEVBQTJCO0FBQ3ZCRCxFQUFBQSxNQUFNLENBQUNDLGFBQVAsR0FBdUIsSUFBSVAsV0FBSixFQUF2QjtBQUNIOztlQUNjTSxNQUFNLENBQUNDLGEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKlxuICogSG9sZHMgdGhlIGN1cnJlbnQgUGxhdGZvcm0gb2JqZWN0IHVzZWQgYnkgdGhlIGNvZGUgdG8gZG8gYW55dGhpbmdcbiAqIHNwZWNpZmljIHRvIHRoZSBwbGF0Zm9ybSB3ZSdyZSBydW5uaW5nIG9uIChlZy4gd2ViLCBlbGVjdHJvbilcbiAqIFBsYXRmb3JtcyBhcmUgcHJvdmlkZWQgYnkgdGhlIGFwcCBsYXllci5cbiAqIFRoaXMgYWxsb3dzIHRoZSBhcHAgbGF5ZXIgdG8gc2V0IGEgUGxhdGZvcm0gd2l0aG91dCBuZWNlc3NhcmlseVxuICogaGF2aW5nIHRvIGhhdmUgYSBNYXRyaXhDaGF0IG9iamVjdFxuICovXG5jbGFzcyBQbGF0Zm9ybVBlZyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGxhdGZvcm0gPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgUGxhdGZvcm0gb2JqZWN0IGZvciB0aGUgYXBwbGljYXRpb24uXG4gICAgICogVGhpcyBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYSBjbGFzcyBleHRlbmRpbmcgQmFzZVBsYXRmb3JtLlxuICAgICAqL1xuICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxhdGZvcm07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCBwbGF0Zm9ybSBoYW5kbGVyIG9iamVjdCB0byB1c2UgZm9yIHRoZVxuICAgICAqIGFwcGxpY2F0aW9uLlxuICAgICAqIFRoaXMgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIGEgY2xhc3MgZXh0ZW5kaW5nIEJhc2VQbGF0Zm9ybS5cbiAgICAgKi9cbiAgICBzZXQocGxhZikge1xuICAgICAgICB0aGlzLnBsYXRmb3JtID0gcGxhZjtcbiAgICB9XG59XG5cbmlmICghZ2xvYmFsLm14UGxhdGZvcm1QZWcpIHtcbiAgICBnbG9iYWwubXhQbGF0Zm9ybVBlZyA9IG5ldyBQbGF0Zm9ybVBlZygpO1xufVxuZXhwb3J0IGRlZmF1bHQgZ2xvYmFsLm14UGxhdGZvcm1QZWc7XG4iXX0=