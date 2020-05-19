"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _at2 = _interopRequireDefault(require("lodash/at"));

var _flatMap2 = _interopRequireDefault(require("lodash/flatMap"));

var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));

var _uniq2 = _interopRequireDefault(require("lodash/uniq"));

/*
Copyright 2017 Aviral Dasgupta
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2018 New Vector Ltd

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
function stripDiacritics(str
/*: string*/
)
/*: string*/
{
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Simple search matcher that matches any results with the query string anywhere
 * in the search string. Returns matches in the order the query string appears
 * in the search key, earliest first, then in the order the items appeared in
 * the source array.
 *
 * @param {Object[]} objects Initial list of objects. Equivalent to calling
 *     setObjects() after construction
 * @param {Object} options Options object
 * @param {string[]} options.keys List of keys to use as indexes on the objects
 * @param {function[]} options.funcs List of functions that when called with the
 *     object as an arg will return a string to use as an index
 */
class QueryMatcher
/*:: <T>*/
{
  constructor(objects
  /*: T[]*/
  , options
  /*: IOptions<T>*/
  = {
    keys: []
  }) {
    (0, _defineProperty2.default)(this, "_options", void 0);
    (0, _defineProperty2.default)(this, "_keys", void 0);
    (0, _defineProperty2.default)(this, "_funcs", void 0);
    (0, _defineProperty2.default)(this, "_items", void 0);
    this._options = options;
    this._keys = options.keys;
    this._funcs = options.funcs || [];
    this.setObjects(objects); // By default, we remove any non-alphanumeric characters ([^A-Za-z0-9_]) from the
    // query and the value being queried before matching

    if (this._options.shouldMatchWordsOnly === undefined) {
      this._options.shouldMatchWordsOnly = true;
    } // By default, match anywhere in the string being searched. If enabled, only return
    // matches that are prefixed with the query.


    if (this._options.shouldMatchPrefix === undefined) {
      this._options.shouldMatchPrefix = false;
    }
  }

  setObjects(objects
  /*: T[]*/
  ) {
    this._items = new Map();

    for (const object of objects) {
      const keyValues = (0, _at2.default)(object, this._keys);

      for (const f of this._funcs) {
        keyValues.push(f(object));
      }

      for (const keyValue of keyValues) {
        if (!keyValue) continue; // skip falsy keyValues

        const key = stripDiacritics(keyValue).toLowerCase();

        if (!this._items.has(key)) {
          this._items.set(key, []);
        }

        this._items.get(key).push(object);
      }
    }
  }

  match(query
  /*: string*/
  )
  /*: T[]*/
  {
    query = stripDiacritics(query).toLowerCase();

    if (this._options.shouldMatchWordsOnly) {
      query = query.replace(/[^\w]/g, '');
    }

    if (query.length === 0) {
      return [];
    }

    const results = []; // Iterate through the map & check each key.
    // ES6 Map iteration order is defined to be insertion order, so results
    // here will come out in the order they were put in.

    for (const key of this._items.keys()) {
      let resultKey = key;

      if (this._options.shouldMatchWordsOnly) {
        resultKey = resultKey.replace(/[^\w]/g, '');
      }

      const index = resultKey.indexOf(query);

      if (index !== -1 && (!this._options.shouldMatchPrefix || index === 0)) {
        results.push({
          key,
          index
        });
      }
    } // Sort them by where the query appeared in the search key
    // lodash sortBy is a stable sort, so results where the query
    // appeared in the same place will retain their order with
    // respect to each other.


    const sortedResults = (0, _sortBy2.default)(results, candidate => {
      return candidate.index;
    }); // Now map the keys to the result objects. Each result object is a list, so
    // flatMap will flatten those lists out into a single list. Also remove any
    // duplicates.

    return (0, _uniq2.default)((0, _flatMap2.default)(sortedResults, candidate => this._items.get(candidate.key)));
  }

}

exports.default = QueryMatcher;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvUXVlcnlNYXRjaGVyLnRzIl0sIm5hbWVzIjpbInN0cmlwRGlhY3JpdGljcyIsInN0ciIsIm5vcm1hbGl6ZSIsInJlcGxhY2UiLCJRdWVyeU1hdGNoZXIiLCJjb25zdHJ1Y3RvciIsIm9iamVjdHMiLCJvcHRpb25zIiwia2V5cyIsIl9vcHRpb25zIiwiX2tleXMiLCJfZnVuY3MiLCJmdW5jcyIsInNldE9iamVjdHMiLCJzaG91bGRNYXRjaFdvcmRzT25seSIsInVuZGVmaW5lZCIsInNob3VsZE1hdGNoUHJlZml4IiwiX2l0ZW1zIiwiTWFwIiwib2JqZWN0Iiwia2V5VmFsdWVzIiwiZiIsInB1c2giLCJrZXlWYWx1ZSIsImtleSIsInRvTG93ZXJDYXNlIiwiaGFzIiwic2V0IiwiZ2V0IiwibWF0Y2giLCJxdWVyeSIsImxlbmd0aCIsInJlc3VsdHMiLCJyZXN1bHRLZXkiLCJpbmRleCIsImluZGV4T2YiLCJzb3J0ZWRSZXN1bHRzIiwiY2FuZGlkYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBLFNBQVNBLGVBQVQsQ0FBeUJDO0FBQXpCO0FBQUE7QUFBQTtBQUE4QztBQUMxQyxTQUFPQSxHQUFHLENBQUNDLFNBQUosQ0FBYyxLQUFkLEVBQXFCQyxPQUFyQixDQUE2QixrQkFBN0IsRUFBaUQsRUFBakQsQ0FBUDtBQUNIOztBQVNEOzs7Ozs7Ozs7Ozs7O0FBYWUsTUFBTUM7QUFBTjtBQUFzQjtBQU1qQ0MsRUFBQUEsV0FBVyxDQUFDQztBQUFEO0FBQUEsSUFBZUM7QUFBb0I7QUFBQSxJQUFHO0FBQUVDLElBQUFBLElBQUksRUFBRTtBQUFSLEdBQXRDLEVBQW9EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDM0QsU0FBS0MsUUFBTCxHQUFnQkYsT0FBaEI7QUFDQSxTQUFLRyxLQUFMLEdBQWFILE9BQU8sQ0FBQ0MsSUFBckI7QUFD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UixFQUFrQkssU0FBRCxJQUFlO0FBQ2xELGFBQU9BLFNBQVMsQ0FBQ0gsS0FBakI7QUFDSCxLQUZxQixDQUF0QixDQTNCc0IsQ0ErQnRCO0FBQ0E7QUFDQTs7QUFDQSxXQUFPLG9CQUFNLHVCQUFTRSxhQUFULEVBQXlCQyxTQUFELElBQWUsS0FBS3BCLE1BQUwsQ0FBWVcsR0FBWixDQUFnQlMsU0FBUyxDQUFDYixHQUExQixDQUF2QyxDQUFOLENBQVA7QUFDSDs7QUFsRmdDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IEF2aXJhbCBEYXNndXB0YVxuQ29weXJpZ2h0IDIwMTggTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBfYXQgZnJvbSAnbG9kYXNoL2F0JztcbmltcG9ydCBfZmxhdE1hcCBmcm9tICdsb2Rhc2gvZmxhdE1hcCc7XG5pbXBvcnQgX3NvcnRCeSBmcm9tICdsb2Rhc2gvc29ydEJ5JztcbmltcG9ydCBfdW5pcSBmcm9tICdsb2Rhc2gvdW5pcSc7XG5cbmZ1bmN0aW9uIHN0cmlwRGlhY3JpdGljcyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHN0ci5ub3JtYWxpemUoJ05GRCcpLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csICcnKTtcbn1cblxuaW50ZXJmYWNlIElPcHRpb25zPFQgZXh0ZW5kcyB7fT4ge1xuICAgIGtleXM6IEFycmF5PHN0cmluZyB8IGtleW9mIFQ+O1xuICAgIGZ1bmNzPzogQXJyYXk8KFQpID0+IHN0cmluZz47XG4gICAgc2hvdWxkTWF0Y2hXb3Jkc09ubHk/OiBib29sZWFuO1xuICAgIHNob3VsZE1hdGNoUHJlZml4PzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBTaW1wbGUgc2VhcmNoIG1hdGNoZXIgdGhhdCBtYXRjaGVzIGFueSByZXN1bHRzIHdpdGggdGhlIHF1ZXJ5IHN0cmluZyBhbnl3aGVyZVxuICogaW4gdGhlIHNlYXJjaCBzdHJpbmcuIFJldHVybnMgbWF0Y2hlcyBpbiB0aGUgb3JkZXIgdGhlIHF1ZXJ5IHN0cmluZyBhcHBlYXJzXG4gKiBpbiB0aGUgc2VhcmNoIGtleSwgZWFybGllc3QgZmlyc3QsIHRoZW4gaW4gdGhlIG9yZGVyIHRoZSBpdGVtcyBhcHBlYXJlZCBpblxuICogdGhlIHNvdXJjZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdFtdfSBvYmplY3RzIEluaXRpYWwgbGlzdCBvZiBvYmplY3RzLiBFcXVpdmFsZW50IHRvIGNhbGxpbmdcbiAqICAgICBzZXRPYmplY3RzKCkgYWZ0ZXIgY29uc3RydWN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmdbXX0gb3B0aW9ucy5rZXlzIExpc3Qgb2Yga2V5cyB0byB1c2UgYXMgaW5kZXhlcyBvbiB0aGUgb2JqZWN0c1xuICogQHBhcmFtIHtmdW5jdGlvbltdfSBvcHRpb25zLmZ1bmNzIExpc3Qgb2YgZnVuY3Rpb25zIHRoYXQgd2hlbiBjYWxsZWQgd2l0aCB0aGVcbiAqICAgICBvYmplY3QgYXMgYW4gYXJnIHdpbGwgcmV0dXJuIGEgc3RyaW5nIHRvIHVzZSBhcyBhbiBpbmRleFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRdWVyeU1hdGNoZXI8VD4ge1xuICAgIHByaXZhdGUgX29wdGlvbnM6IElPcHRpb25zPFQ+O1xuICAgIHByaXZhdGUgX2tleXM6IElPcHRpb25zPFQ+W1wia2V5c1wiXTtcbiAgICBwcml2YXRlIF9mdW5jczogUmVxdWlyZWQ8SU9wdGlvbnM8VD5bXCJmdW5jc1wiXT47XG4gICAgcHJpdmF0ZSBfaXRlbXM6IE1hcDxzdHJpbmcsIFRbXT47XG5cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RzOiBUW10sIG9wdGlvbnM6IElPcHRpb25zPFQ+ID0geyBrZXlzOiBbXSB9KSB7XG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLl9rZXlzID0gb3B0aW9ucy5rZXlzO1xuICAgICAgICB0aGlzLl9mdW5jcyA9IG9wdGlvbnMuZnVuY3MgfHwgW107XG5cbiAgICAgICAgdGhpcy5zZXRPYmplY3RzKG9iamVjdHMpO1xuXG4gICAgICAgIC8vIEJ5IGRlZmF1bHQsIHdlIHJlbW92ZSBhbnkgbm9uLWFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIChbXkEtWmEtejAtOV9dKSBmcm9tIHRoZVxuICAgICAgICAvLyBxdWVyeSBhbmQgdGhlIHZhbHVlIGJlaW5nIHF1ZXJpZWQgYmVmb3JlIG1hdGNoaW5nXG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNob3VsZE1hdGNoV29yZHNPbmx5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX29wdGlvbnMuc2hvdWxkTWF0Y2hXb3Jkc09ubHkgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnkgZGVmYXVsdCwgbWF0Y2ggYW55d2hlcmUgaW4gdGhlIHN0cmluZyBiZWluZyBzZWFyY2hlZC4gSWYgZW5hYmxlZCwgb25seSByZXR1cm5cbiAgICAgICAgLy8gbWF0Y2hlcyB0aGF0IGFyZSBwcmVmaXhlZCB3aXRoIHRoZSBxdWVyeS5cbiAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuc2hvdWxkTWF0Y2hQcmVmaXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5zaG91bGRNYXRjaFByZWZpeCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0T2JqZWN0cyhvYmplY3RzOiBUW10pIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBvYmplY3Qgb2Ygb2JqZWN0cykge1xuICAgICAgICAgICAgY29uc3Qga2V5VmFsdWVzID0gX2F0KG9iamVjdCwgdGhpcy5fa2V5cyk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB0aGlzLl9mdW5jcykge1xuICAgICAgICAgICAgICAgIGtleVZhbHVlcy5wdXNoKGYob2JqZWN0KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5VmFsdWUgb2Yga2V5VmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFrZXlWYWx1ZSkgY29udGludWU7IC8vIHNraXAgZmFsc3kga2V5VmFsdWVzXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gc3RyaXBEaWFjcml0aWNzKGtleVZhbHVlKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faXRlbXMuc2V0KGtleSwgW10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9pdGVtcy5nZXQoa2V5KS5wdXNoKG9iamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtYXRjaChxdWVyeTogc3RyaW5nKTogVFtdIHtcbiAgICAgICAgcXVlcnkgPSBzdHJpcERpYWNyaXRpY3MocXVlcnkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNob3VsZE1hdGNoV29yZHNPbmx5KSB7XG4gICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoL1teXFx3XS9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBtYXAgJiBjaGVjayBlYWNoIGtleS5cbiAgICAgICAgLy8gRVM2IE1hcCBpdGVyYXRpb24gb3JkZXIgaXMgZGVmaW5lZCB0byBiZSBpbnNlcnRpb24gb3JkZXIsIHNvIHJlc3VsdHNcbiAgICAgICAgLy8gaGVyZSB3aWxsIGNvbWUgb3V0IGluIHRoZSBvcmRlciB0aGV5IHdlcmUgcHV0IGluLlxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLl9pdGVtcy5rZXlzKCkpIHtcbiAgICAgICAgICAgIGxldCByZXN1bHRLZXkgPSBrZXk7XG4gICAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5zaG91bGRNYXRjaFdvcmRzT25seSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdEtleSA9IHJlc3VsdEtleS5yZXBsYWNlKC9bXlxcd10vZywgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSByZXN1bHRLZXkuaW5kZXhPZihxdWVyeSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xICYmICghdGhpcy5fb3B0aW9ucy5zaG91bGRNYXRjaFByZWZpeCB8fCBpbmRleCA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2tleSwgaW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNvcnQgdGhlbSBieSB3aGVyZSB0aGUgcXVlcnkgYXBwZWFyZWQgaW4gdGhlIHNlYXJjaCBrZXlcbiAgICAgICAgLy8gbG9kYXNoIHNvcnRCeSBpcyBhIHN0YWJsZSBzb3J0LCBzbyByZXN1bHRzIHdoZXJlIHRoZSBxdWVyeVxuICAgICAgICAvLyBhcHBlYXJlZCBpbiB0aGUgc2FtZSBwbGFjZSB3aWxsIHJldGFpbiB0aGVpciBvcmRlciB3aXRoXG4gICAgICAgIC8vIHJlc3BlY3QgdG8gZWFjaCBvdGhlci5cbiAgICAgICAgY29uc3Qgc29ydGVkUmVzdWx0cyA9IF9zb3J0QnkocmVzdWx0cywgKGNhbmRpZGF0ZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5pbmRleDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTm93IG1hcCB0aGUga2V5cyB0byB0aGUgcmVzdWx0IG9iamVjdHMuIEVhY2ggcmVzdWx0IG9iamVjdCBpcyBhIGxpc3QsIHNvXG4gICAgICAgIC8vIGZsYXRNYXAgd2lsbCBmbGF0dGVuIHRob3NlIGxpc3RzIG91dCBpbnRvIGEgc2luZ2xlIGxpc3QuIEFsc28gcmVtb3ZlIGFueVxuICAgICAgICAvLyBkdXBsaWNhdGVzLlxuICAgICAgICByZXR1cm4gX3VuaXEoX2ZsYXRNYXAoc29ydGVkUmVzdWx0cywgKGNhbmRpZGF0ZSkgPT4gdGhpcy5faXRlbXMuZ2V0KGNhbmRpZGF0ZS5rZXkpKSk7XG4gICAgfVxufVxuIl19