"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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
class DocumentOffset {
  constructor(offset, atNodeEnd) {
    this.offset = offset;
    this.atNodeEnd = atNodeEnd;
  }

  asPosition(model) {
    return model.positionForOffset(this.offset, this.atNodeEnd);
  }

  add(delta, atNodeEnd = false) {
    return new DocumentOffset(this.offset + delta, atNodeEnd);
  }

}

exports.default = DocumentOffset;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lZGl0b3Ivb2Zmc2V0LmpzIl0sIm5hbWVzIjpbIkRvY3VtZW50T2Zmc2V0IiwiY29uc3RydWN0b3IiLCJvZmZzZXQiLCJhdE5vZGVFbmQiLCJhc1Bvc2l0aW9uIiwibW9kZWwiLCJwb3NpdGlvbkZvck9mZnNldCIsImFkZCIsImRlbHRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQWdCZSxNQUFNQSxjQUFOLENBQXFCO0FBQ2hDQyxFQUFBQSxXQUFXLENBQUNDLE1BQUQsRUFBU0MsU0FBVCxFQUFvQjtBQUMzQixTQUFLRCxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLQyxTQUFMLEdBQWlCQSxTQUFqQjtBQUNIOztBQUVEQyxFQUFBQSxVQUFVLENBQUNDLEtBQUQsRUFBUTtBQUNkLFdBQU9BLEtBQUssQ0FBQ0MsaUJBQU4sQ0FBd0IsS0FBS0osTUFBN0IsRUFBcUMsS0FBS0MsU0FBMUMsQ0FBUDtBQUNIOztBQUVESSxFQUFBQSxHQUFHLENBQUNDLEtBQUQsRUFBUUwsU0FBUyxHQUFHLEtBQXBCLEVBQTJCO0FBQzFCLFdBQU8sSUFBSUgsY0FBSixDQUFtQixLQUFLRSxNQUFMLEdBQWNNLEtBQWpDLEVBQXdDTCxTQUF4QyxDQUFQO0FBQ0g7O0FBWitCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRG9jdW1lbnRPZmZzZXQge1xuICAgIGNvbnN0cnVjdG9yKG9mZnNldCwgYXROb2RlRW5kKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICB0aGlzLmF0Tm9kZUVuZCA9IGF0Tm9kZUVuZDtcbiAgICB9XG5cbiAgICBhc1Bvc2l0aW9uKG1vZGVsKSB7XG4gICAgICAgIHJldHVybiBtb2RlbC5wb3NpdGlvbkZvck9mZnNldCh0aGlzLm9mZnNldCwgdGhpcy5hdE5vZGVFbmQpO1xuICAgIH1cblxuICAgIGFkZChkZWx0YSwgYXROb2RlRW5kID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudE9mZnNldCh0aGlzLm9mZnNldCArIGRlbHRhLCBhdE5vZGVFbmQpO1xuICAgIH1cbn1cbiJdfQ==