"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyPlaintext = copyPlaintext;
exports.selectText = selectText;
exports.copyNode = copyNode;

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
 * Copy plaintext to user's clipboard
 * It will overwrite user's selection range
 * In certain browsers it may only work if triggered by a user action or may ask user for permissions
 * Tries to use new async clipboard API if available
 * @param text the plaintext to put in the user's clipboard
 */
async function copyPlaintext(text
/*: string*/
)
/*: Promise<boolean>*/
{
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text; // Avoid scrolling to bottom

      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      const selection = document.getSelection();
      const range = document.createRange(); // range.selectNodeContents(textArea);

      range.selectNode(textArea);
      selection.removeAllRanges();
      selection.addRange(range);
      const successful = document.execCommand("copy");
      selection.removeAllRanges();
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (e) {
    console.error("copyPlaintext failed", e);
  }

  return false;
}

function selectText(target
/*: Element*/
) {
  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
/**
 * Copy rich text to user's clipboard
 * It will overwrite user's selection range
 * In certain browsers it may only work if triggered by a user action or may ask user for permissions
 * @param ref pointer to the node to copy
 */


function copyNode(ref
/*: Element*/
)
/*: boolean*/
{
  selectText(ref);
  return document.execCommand('copy');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zdHJpbmdzLnRzIl0sIm5hbWVzIjpbImNvcHlQbGFpbnRleHQiLCJ0ZXh0IiwibmF2aWdhdG9yIiwiY2xpcGJvYXJkIiwid3JpdGVUZXh0IiwidGV4dEFyZWEiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ2YWx1ZSIsInN0eWxlIiwidG9wIiwibGVmdCIsInBvc2l0aW9uIiwiYm9keSIsImFwcGVuZENoaWxkIiwic2VsZWN0aW9uIiwiZ2V0U2VsZWN0aW9uIiwicmFuZ2UiLCJjcmVhdGVSYW5nZSIsInNlbGVjdE5vZGUiLCJyZW1vdmVBbGxSYW5nZXMiLCJhZGRSYW5nZSIsInN1Y2Nlc3NmdWwiLCJleGVjQ29tbWFuZCIsInJlbW92ZUNoaWxkIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInNlbGVjdFRleHQiLCJ0YXJnZXQiLCJzZWxlY3ROb2RlQ29udGVudHMiLCJ3aW5kb3ciLCJjb3B5Tm9kZSIsInJlZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7QUFPTyxlQUFlQSxhQUFmLENBQTZCQztBQUE3QjtBQUFBO0FBQUE7QUFBNkQ7QUFDaEUsTUFBSTtBQUNBLFFBQUlDLFNBQVMsSUFBSUEsU0FBUyxDQUFDQyxTQUF2QixJQUFvQ0QsU0FBUyxDQUFDQyxTQUFWLENBQW9CQyxTQUE1RCxFQUF1RTtBQUNuRSxZQUFNRixTQUFTLENBQUNDLFNBQVYsQ0FBb0JDLFNBQXBCLENBQThCSCxJQUE5QixDQUFOO0FBQ0EsYUFBTyxJQUFQO0FBQ0gsS0FIRCxNQUdPO0FBQ0gsWUFBTUksUUFBUSxHQUFHQyxRQUFRLENBQUNDLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBakI7QUFDQUYsTUFBQUEsUUFBUSxDQUFDRyxLQUFULEdBQWlCUCxJQUFqQixDQUZHLENBSUg7O0FBQ0FJLE1BQUFBLFFBQVEsQ0FBQ0ksS0FBVCxDQUFlQyxHQUFmLEdBQXFCLEdBQXJCO0FBQ0FMLE1BQUFBLFFBQVEsQ0FBQ0ksS0FBVCxDQUFlRSxJQUFmLEdBQXNCLEdBQXRCO0FBQ0FOLE1BQUFBLFFBQVEsQ0FBQ0ksS0FBVCxDQUFlRyxRQUFmLEdBQTBCLE9BQTFCO0FBRUFOLE1BQUFBLFFBQVEsQ0FBQ08sSUFBVCxDQUFjQyxXQUFkLENBQTBCVCxRQUExQjtBQUNBLFlBQU1VLFNBQVMsR0FBR1QsUUFBUSxDQUFDVSxZQUFULEVBQWxCO0FBQ0EsWUFBTUMsS0FBSyxHQUFHWCxRQUFRLENBQUNZLFdBQVQsRUFBZCxDQVhHLENBWUg7O0FBQ0FELE1BQUFBLEtBQUssQ0FBQ0UsVUFBTixDQUFpQmQsUUFBakI7QUFDQVUsTUFBQUEsU0FBUyxDQUFDSyxlQUFWO0FBQ0FMLE1BQUFBLFNBQVMsQ0FBQ00sUUFBVixDQUFtQkosS0FBbkI7QUFFQSxZQUFNSyxVQUFVLEdBQUdoQixRQUFRLENBQUNpQixXQUFULENBQXFCLE1BQXJCLENBQW5CO0FBQ0FSLE1BQUFBLFNBQVMsQ0FBQ0ssZUFBVjtBQUNBZCxNQUFBQSxRQUFRLENBQUNPLElBQVQsQ0FBY1csV0FBZCxDQUEwQm5CLFFBQTFCO0FBQ0EsYUFBT2lCLFVBQVA7QUFDSDtBQUNKLEdBMUJELENBMEJFLE9BQU9HLENBQVAsRUFBVTtBQUNSQyxJQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxzQkFBZCxFQUFzQ0YsQ0FBdEM7QUFDSDs7QUFDRCxTQUFPLEtBQVA7QUFDSDs7QUFFTSxTQUFTRyxVQUFULENBQW9CQztBQUFwQjtBQUFBLEVBQXFDO0FBQ3hDLFFBQU1aLEtBQUssR0FBR1gsUUFBUSxDQUFDWSxXQUFULEVBQWQ7QUFDQUQsRUFBQUEsS0FBSyxDQUFDYSxrQkFBTixDQUF5QkQsTUFBekI7QUFFQSxRQUFNZCxTQUFTLEdBQUdnQixNQUFNLENBQUNmLFlBQVAsRUFBbEI7QUFDQUQsRUFBQUEsU0FBUyxDQUFDSyxlQUFWO0FBQ0FMLEVBQUFBLFNBQVMsQ0FBQ00sUUFBVixDQUFtQkosS0FBbkI7QUFDSDtBQUVEOzs7Ozs7OztBQU1PLFNBQVNlLFFBQVQsQ0FBa0JDO0FBQWxCO0FBQUE7QUFBQTtBQUF5QztBQUM1Q0wsRUFBQUEsVUFBVSxDQUFDSyxHQUFELENBQVY7QUFDQSxTQUFPM0IsUUFBUSxDQUFDaUIsV0FBVCxDQUFxQixNQUFyQixDQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKipcbiAqIENvcHkgcGxhaW50ZXh0IHRvIHVzZXIncyBjbGlwYm9hcmRcbiAqIEl0IHdpbGwgb3ZlcndyaXRlIHVzZXIncyBzZWxlY3Rpb24gcmFuZ2VcbiAqIEluIGNlcnRhaW4gYnJvd3NlcnMgaXQgbWF5IG9ubHkgd29yayBpZiB0cmlnZ2VyZWQgYnkgYSB1c2VyIGFjdGlvbiBvciBtYXkgYXNrIHVzZXIgZm9yIHBlcm1pc3Npb25zXG4gKiBUcmllcyB0byB1c2UgbmV3IGFzeW5jIGNsaXBib2FyZCBBUEkgaWYgYXZhaWxhYmxlXG4gKiBAcGFyYW0gdGV4dCB0aGUgcGxhaW50ZXh0IHRvIHB1dCBpbiB0aGUgdXNlcidzIGNsaXBib2FyZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weVBsYWludGV4dCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgICBpZiAobmF2aWdhdG9yICYmIG5hdmlnYXRvci5jbGlwYm9hcmQgJiYgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQpIHtcbiAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0QXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbiAgICAgICAgICAgIHRleHRBcmVhLnZhbHVlID0gdGV4dDtcblxuICAgICAgICAgICAgLy8gQXZvaWQgc2Nyb2xsaW5nIHRvIGJvdHRvbVxuICAgICAgICAgICAgdGV4dEFyZWEuc3R5bGUudG9wID0gXCIwXCI7XG4gICAgICAgICAgICB0ZXh0QXJlYS5zdHlsZS5sZWZ0ID0gXCIwXCI7XG4gICAgICAgICAgICB0ZXh0QXJlYS5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIjtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0QXJlYSk7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgIC8vIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyh0ZXh0QXJlYSk7XG4gICAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlKHRleHRBcmVhKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIik7XG4gICAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRBcmVhKTtcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzZnVsO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiY29weVBsYWludGV4dCBmYWlsZWRcIiwgZSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdFRleHQodGFyZ2V0OiBFbGVtZW50KSB7XG4gICAgY29uc3QgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyh0YXJnZXQpO1xuXG4gICAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xufVxuXG4vKipcbiAqIENvcHkgcmljaCB0ZXh0IHRvIHVzZXIncyBjbGlwYm9hcmRcbiAqIEl0IHdpbGwgb3ZlcndyaXRlIHVzZXIncyBzZWxlY3Rpb24gcmFuZ2VcbiAqIEluIGNlcnRhaW4gYnJvd3NlcnMgaXQgbWF5IG9ubHkgd29yayBpZiB0cmlnZ2VyZWQgYnkgYSB1c2VyIGFjdGlvbiBvciBtYXkgYXNrIHVzZXIgZm9yIHBlcm1pc3Npb25zXG4gKiBAcGFyYW0gcmVmIHBvaW50ZXIgdG8gdGhlIG5vZGUgdG8gY29weVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29weU5vZGUocmVmOiBFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgc2VsZWN0VGV4dChyZWYpO1xuICAgIHJldHVybiBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xufVxuIl19