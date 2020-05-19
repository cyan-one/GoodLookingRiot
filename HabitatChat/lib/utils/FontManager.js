"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixupColorFonts = fixupColorFonts;

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

/*
 * Based on...
 * ChromaCheck 1.16
 * author Roel Nieskens, https://pixelambacht.nl
 * MIT license
 */
function safariVersionCheck(ua) {
  console.log("Browser is Safari - checking version for COLR support");

  try {
    const safariVersionMatch = ua.match(/Mac OS X ([\d|_]+).*Version\/([\d|.]+).*Safari/);

    if (safariVersionMatch) {
      const macOSVersionStr = safariVersionMatch[1];
      const safariVersionStr = safariVersionMatch[2];
      const macOSVersion = macOSVersionStr.split("_").map(n => parseInt(n, 10));
      const safariVersion = safariVersionStr.split(".").map(n => parseInt(n, 10));
      const colrFontSupported = macOSVersion[0] >= 10 && macOSVersion[1] >= 14 && safariVersion[0] >= 12; // https://www.colorfonts.wtf/ states safari supports COLR fonts from this version on

      console.log("COLR support on Safari requires macOS 10.14 and Safari 12, " + "detected Safari ".concat(safariVersionStr, " on macOS ").concat(macOSVersionStr, ", ") + "COLR supported: ".concat(colrFontSupported));
      return colrFontSupported;
    }
  } catch (err) {
    console.error("Error in Safari COLR version check", err);
  }

  console.warn("Couldn't determine Safari version to check COLR font support, assuming no.");
  return false;
}

async function isColrFontSupported() {
  console.log("Checking for COLR support");
  const {
    userAgent
  } = navigator; // Firefox has supported COLR fonts since version 26
  // but doesn't support the check below without
  // "Extract canvas data" permissions
  // when content blocking is enabled.

  if (userAgent.includes("Firefox")) {
    console.log("Browser is Firefox - assuming COLR is supported");
    return true;
  } // Safari doesn't wait for the font to load (if it doesn't have it in cache)
  // to emit the load event on the image, so there is no way to not make the check
  // reliable. Instead sniff the version.
  // Excluding "Chrome", as it's user agent unhelpfully also contains Safari...


  if (!userAgent.includes("Chrome") && userAgent.includes("Safari")) {
    return safariVersionCheck(userAgent);
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const img = new Image(); // eslint-disable-next-line

    const fontCOLR = 'd09GRgABAAAAAAKAAAwAAAAAAowAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDT0xSAAACVAAAABYAAAAYAAIAJUNQQUwAAAJsAAAAEgAAABLJAAAQT1MvMgAAAYAAAAA6AAAAYBfxJ0pjbWFwAAABxAAAACcAAAAsAAzpM2dseWYAAAH0AAAAGgAAABoNIh0kaGVhZAAAARwAAAAvAAAANgxLumdoaGVhAAABTAAAABUAAAAkCAEEAmhtdHgAAAG8AAAABgAAAAYEAAAAbG9jYQAAAewAAAAGAAAABgANAABtYXhwAAABZAAAABsAAAAgAg4AHW5hbWUAAAIQAAAAOAAAAD4C5wsecG9zdAAAAkgAAAAMAAAAIAADAAB4AWNgZGAAYQ5+qdB4fpuvDNIsDCBwaQGTAIi+VlscBaJZGMDiHAxMIAoAtjIF/QB4AWNgZGBgYQACOAkUQQWMAAGRABAAAAB4AWNgZGBgYGJgAdMMUJILJMQgAWICAAH3AC4AeAFjYGFhYJzAwMrAwDST6QwDA0M/hGZ8zWDMyMmAChgFkDgKQMBw4CXDSwYWEBdIYgAFBgYA/8sIdAAABAAAAAAAAAB4AWNgYGBkYAZiBgYeBhYGBSDNAoRA/kuG//8hpDgjWJ4BAFVMBiYAAAAAAAANAAAAAQAAAAAEAAQAAAMAABEhESEEAPwABAD8AAAAeAEtxgUNgAAAAMHHIQTShTlOAty9/4bf7AARCwlBNhBw4L/43qXjYGUmf19TMuLcj/BJL3XfBg54AWNgZsALAAB9AAR4AWNgYGAEYj4gFgGygGwICQACOwAoAAAAAAABAAEAAQAAAA4AAAAAyP8AAA==';
    const svg = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"100\" style=\"background:#fff;fill:#000;\">\n            <style type=\"text/css\">\n                @font-face {\n                    font-family: \"chromacheck-colr\";\n                    src: url(data:application/x-font-woff;base64,".concat(fontCOLR, ") format(\"woff\");\n                }\n            </style>\n            <text x=\"0\" y=\"0\" font-size=\"20\">\n                <tspan font-family=\"chromacheck-colr\" x=\"0\" dy=\"20\">&#xe900;</tspan>\n            </text>\n        </svg>");
    canvas.width = 20;
    canvas.height = 100;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    console.log("Waiting for COLR SVG to load");
    await new Promise(resolve => img.onload = resolve);
    console.log("Drawing canvas to detect COLR support");
    context.drawImage(img, 0, 0);
    const colrFontSupported = context.getImageData(10, 10, 1, 1).data[0] === 200;
    console.log("Canvas check revealed COLR is supported? " + colrFontSupported);
    return colrFontSupported;
  } catch (e) {
    console.error("Couldn't load COLR font", e);
    return false;
  }
}

let colrFontCheckStarted = false;

async function fixupColorFonts() {
  if (colrFontCheckStarted) {
    return;
  }

  colrFontCheckStarted = true;

  if (await isColrFontSupported()) {
    const path = "url('".concat(require("../../res/fonts/Twemoji_Mozilla/TwemojiMozilla-colr.woff2"), "')");
    document.fonts.add(new FontFace("Twemoji", path, {})); // For at least Chrome on Windows 10, we have to explictly add extra
    // weights for the emoji to appear in bold messages, etc.

    document.fonts.add(new FontFace("Twemoji", path, {
      weight: 600
    }));
    document.fonts.add(new FontFace("Twemoji", path, {
      weight: 700
    }));
  } else {
    // fall back to SBIX, generated via https://github.com/matrix-org/twemoji-colr/tree/matthew/sbix
    const path = "url('".concat(require("../../res/fonts/Twemoji_Mozilla/TwemojiMozilla-sbix.woff2"), "')");
    document.fonts.add(new FontFace("Twemoji", path, {}));
    document.fonts.add(new FontFace("Twemoji", path, {
      weight: 600
    }));
    document.fonts.add(new FontFace("Twemoji", path, {
      weight: 700
    }));
  } // ...and if SBIX is not supported, the browser will fall back to one of the native fonts specified.

}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9Gb250TWFuYWdlci5qcyJdLCJuYW1lcyI6WyJzYWZhcmlWZXJzaW9uQ2hlY2siLCJ1YSIsImNvbnNvbGUiLCJsb2ciLCJzYWZhcmlWZXJzaW9uTWF0Y2giLCJtYXRjaCIsIm1hY09TVmVyc2lvblN0ciIsInNhZmFyaVZlcnNpb25TdHIiLCJtYWNPU1ZlcnNpb24iLCJzcGxpdCIsIm1hcCIsIm4iLCJwYXJzZUludCIsInNhZmFyaVZlcnNpb24iLCJjb2xyRm9udFN1cHBvcnRlZCIsImVyciIsImVycm9yIiwid2FybiIsImlzQ29sckZvbnRTdXBwb3J0ZWQiLCJ1c2VyQWdlbnQiLCJuYXZpZ2F0b3IiLCJpbmNsdWRlcyIsImNhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiaW1nIiwiSW1hZ2UiLCJmb250Q09MUiIsInN2ZyIsIndpZHRoIiwiaGVpZ2h0Iiwic3JjIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbmxvYWQiLCJkcmF3SW1hZ2UiLCJnZXRJbWFnZURhdGEiLCJkYXRhIiwiZSIsImNvbHJGb250Q2hlY2tTdGFydGVkIiwiZml4dXBDb2xvckZvbnRzIiwicGF0aCIsInJlcXVpcmUiLCJmb250cyIsImFkZCIsIkZvbnRGYWNlIiwid2VpZ2h0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7OztBQU9BLFNBQVNBLGtCQUFULENBQTRCQyxFQUE1QixFQUFnQztBQUM1QkMsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksdURBQVo7O0FBQ0EsTUFBSTtBQUNBLFVBQU1DLGtCQUFrQixHQUFHSCxFQUFFLENBQUNJLEtBQUgsQ0FBUyxnREFBVCxDQUEzQjs7QUFDQSxRQUFJRCxrQkFBSixFQUF3QjtBQUNwQixZQUFNRSxlQUFlLEdBQUdGLGtCQUFrQixDQUFDLENBQUQsQ0FBMUM7QUFDQSxZQUFN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QWIsRUFBd0JKLElBQXhCLEVBQThCLEVBQTlCLENBQW5CO0FBQ0FyQixJQUFBQSxRQUFRLENBQUN1QixLQUFULENBQWVDLEdBQWYsQ0FBbUIsSUFBSUMsUUFBSixDQUFhLFNBQWIsRUFBd0JKLElBQXhCLEVBQThCO0FBQUVLLE1BQUFBLE1BQU0sRUFBRTtBQUFWLEtBQTlCLENBQW5CO0FBQ0ExQixJQUFBQSxRQUFRLENBQUN1QixLQUFULENBQWVDLEdBQWYsQ0FBbUIsSUFBSUMsUUFBSixDQUFhLFNBQWIsRUFBd0JKLElBQXhCLEVBQThCO0FBQUVLLE1BQUFBLE1BQU0sRUFBRTtBQUFWLEtBQTlCLENBQW5CO0FBQ0gsR0FuQm1DLENBb0JwQzs7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qXG4gKiBCYXNlZCBvbi4uLlxuICogQ2hyb21hQ2hlY2sgMS4xNlxuICogYXV0aG9yIFJvZWwgTmllc2tlbnMsIGh0dHBzOi8vcGl4ZWxhbWJhY2h0Lm5sXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbmZ1bmN0aW9uIHNhZmFyaVZlcnNpb25DaGVjayh1YSkge1xuICAgIGNvbnNvbGUubG9nKFwiQnJvd3NlciBpcyBTYWZhcmkgLSBjaGVja2luZyB2ZXJzaW9uIGZvciBDT0xSIHN1cHBvcnRcIik7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc2FmYXJpVmVyc2lvbk1hdGNoID0gdWEubWF0Y2goL01hYyBPUyBYIChbXFxkfF9dKykuKlZlcnNpb25cXC8oW1xcZHwuXSspLipTYWZhcmkvKTtcbiAgICAgICAgaWYgKHNhZmFyaVZlcnNpb25NYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbWFjT1NWZXJzaW9uU3RyID0gc2FmYXJpVmVyc2lvbk1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3Qgc2FmYXJpVmVyc2lvblN0ciA9IHNhZmFyaVZlcnNpb25NYXRjaFsyXTtcbiAgICAgICAgICAgIGNvbnN0IG1hY09TVmVyc2lvbiA9IG1hY09TVmVyc2lvblN0ci5zcGxpdChcIl9cIikubWFwKG4gPT4gcGFyc2VJbnQobiwgMTApKTtcbiAgICAgICAgICAgIGNvbnN0IHNhZmFyaVZlcnNpb24gPSBzYWZhcmlWZXJzaW9uU3RyLnNwbGl0KFwiLlwiKS5tYXAobiA9PiBwYXJzZUludChuLCAxMCkpO1xuICAgICAgICAgICAgY29uc3QgY29sckZvbnRTdXBwb3J0ZWQgPSBtYWNPU1ZlcnNpb25bMF0gPj0gMTAgJiYgbWFjT1NWZXJzaW9uWzFdID49IDE0ICYmIHNhZmFyaVZlcnNpb25bMF0gPj0gMTI7XG4gICAgICAgICAgICAvLyBodHRwczovL3d3dy5jb2xvcmZvbnRzLnd0Zi8gc3RhdGVzIHNhZmFyaSBzdXBwb3J0cyBDT0xSIGZvbnRzIGZyb20gdGhpcyB2ZXJzaW9uIG9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQ09MUiBzdXBwb3J0IG9uIFNhZmFyaSByZXF1aXJlcyBtYWNPUyAxMC4xNCBhbmQgU2FmYXJpIDEyLCBgICtcbiAgICAgICAgICAgICAgICBgZGV0ZWN0ZWQgU2FmYXJpICR7c2FmYXJpVmVyc2lvblN0cn0gb24gbWFjT1MgJHttYWNPU1ZlcnNpb25TdHJ9LCBgICtcbiAgICAgICAgICAgICAgICBgQ09MUiBzdXBwb3J0ZWQ6ICR7Y29sckZvbnRTdXBwb3J0ZWR9YCk7XG4gICAgICAgICAgICByZXR1cm4gY29sckZvbnRTdXBwb3J0ZWQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIFNhZmFyaSBDT0xSIHZlcnNpb24gY2hlY2tcIiwgZXJyKTtcbiAgICB9XG4gICAgY29uc29sZS53YXJuKFwiQ291bGRuJ3QgZGV0ZXJtaW5lIFNhZmFyaSB2ZXJzaW9uIHRvIGNoZWNrIENPTFIgZm9udCBzdXBwb3J0LCBhc3N1bWluZyBuby5cIik7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0NvbHJGb250U3VwcG9ydGVkKCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ2hlY2tpbmcgZm9yIENPTFIgc3VwcG9ydFwiKTtcblxuICAgIGNvbnN0IHt1c2VyQWdlbnR9ID0gbmF2aWdhdG9yO1xuICAgIC8vIEZpcmVmb3ggaGFzIHN1cHBvcnRlZCBDT0xSIGZvbnRzIHNpbmNlIHZlcnNpb24gMjZcbiAgICAvLyBidXQgZG9lc24ndCBzdXBwb3J0IHRoZSBjaGVjayBiZWxvdyB3aXRob3V0XG4gICAgLy8gXCJFeHRyYWN0IGNhbnZhcyBkYXRhXCIgcGVybWlzc2lvbnNcbiAgICAvLyB3aGVuIGNvbnRlbnQgYmxvY2tpbmcgaXMgZW5hYmxlZC5cbiAgICBpZiAodXNlckFnZW50LmluY2x1ZGVzKFwiRmlyZWZveFwiKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkJyb3dzZXIgaXMgRmlyZWZveCAtIGFzc3VtaW5nIENPTFIgaXMgc3VwcG9ydGVkXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gU2FmYXJpIGRvZXNuJ3Qgd2FpdCBmb3IgdGhlIGZvbnQgdG8gbG9hZCAoaWYgaXQgZG9lc24ndCBoYXZlIGl0IGluIGNhY2hlKVxuICAgIC8vIHRvIGVtaXQgdGhlIGxvYWQgZXZlbnQgb24gdGhlIGltYWdlLCBzbyB0aGVyZSBpcyBubyB3YXkgdG8gbm90IG1ha2UgdGhlIGNoZWNrXG4gICAgLy8gcmVsaWFibGUuIEluc3RlYWQgc25pZmYgdGhlIHZlcnNpb24uXG4gICAgLy8gRXhjbHVkaW5nIFwiQ2hyb21lXCIsIGFzIGl0J3MgdXNlciBhZ2VudCB1bmhlbHBmdWxseSBhbHNvIGNvbnRhaW5zIFNhZmFyaS4uLlxuICAgIGlmICghdXNlckFnZW50LmluY2x1ZGVzKFwiQ2hyb21lXCIpICYmIHVzZXJBZ2VudC5pbmNsdWRlcyhcIlNhZmFyaVwiKSkge1xuICAgICAgICByZXR1cm4gc2FmYXJpVmVyc2lvbkNoZWNrKHVzZXJBZ2VudCk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICBjb25zdCBmb250Q09MUiA9ICdkMDlHUmdBQkFBQUFBQUtBQUF3QUFBQUFBb3dBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQkRUMHhTQUFBQ1ZBQUFBQllBQUFBWUFBSUFKVU5RUVV3QUFBSnNBQUFBRWdBQUFCTEpBQUFRVDFNdk1nQUFBWUFBQUFBNkFBQUFZQmZ4SjBwamJXRndBQUFCeEFBQUFDY0FBQUFzQUF6cE0yZHNlV1lBQUFIMEFBQUFHZ0FBQUJvTkloMGthR1ZoWkFBQUFSd0FBQUF2QUFBQU5neEx1bWRvYUdWaEFBQUJUQUFBQUJVQUFBQWtDQUVFQW1odGRIZ0FBQUc4QUFBQUJnQUFBQVlFQUFBQWJHOWpZUUFBQWV3QUFBQUdBQUFBQmdBTkFBQnRZWGh3QUFBQlpBQUFBQnNBQUFBZ0FnNEFIVzVoYldVQUFBSVFBQUFBT0FBQUFENEM1d3NlY0c5emRBQUFBa2dBQUFBTUFBQUFJQUFEQUFCNEFXTmdaR0FBWVE1K3FkQjRmcHV2RE5Jc0RDQndhUUdUQUlpK1Zsc2NCYUpaR01EaUhBeE1JQW9BdGpJRi9RQjRBV05nWkdCZ1lRQUNPQWtVUVFXTUFBR1JBQkFBQUFCNEFXTmdaR0JnWUdKZ0FkTU1VSklMSk1RZ0FXSUNBQUgzQUM0QWVBRmpZR0ZoWUp6QXdNckF3RFNUNlF3REEwTS9oR1o4eldETXlNbUFDaGdGa0RnS1FNQnc0Q1hEU3dZV0VCZElZZ0FGQmdZQS84c0lkQUFBQkFBQUFBQUFBQUI0QVdOZ1lHQmtZQVppQmdZZUJoWUdCU0ROQW9SQS9rdUcvLzhocERnaldKNEJBRlZNQmlZQUFBQUFBQUFOQUFBQUFRQUFBQUFFQUFRQUFBTUFBQkVoRVNFRUFQd0FCQUQ4QUFBQWVBRXR4Z1VOZ0FBQUFNSEhJUVRTaFRsT0F0eTkvNGJmN0FBUkN3bEJOaEJ3NEwvNDNxWGpZR1VtZjE5VE11TGNqL0JKTDNYZkJnNTRBV05nWnNBTEFBQjlBQVI0QVdOZ1lHQUVZajRnRmdHeWdHd0lDUUFDT3dBb0FBQUFBQUFCQUFFQUFRQUFBQTRBQUFBQXlQOEFBQT09JztcbiAgICAgICAgY29uc3Qgc3ZnID0gYFxuICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMTAwXCIgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmZmY7ZmlsbDojMDAwO1wiPlxuICAgICAgICAgICAgPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPlxuICAgICAgICAgICAgICAgIEBmb250LWZhY2Uge1xuICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogXCJjaHJvbWFjaGVjay1jb2xyXCI7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogdXJsKGRhdGE6YXBwbGljYXRpb24veC1mb250LXdvZmY7YmFzZTY0LCR7Zm9udENPTFJ9KSBmb3JtYXQoXCJ3b2ZmXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgICAgICA8dGV4dCB4PVwiMFwiIHk9XCIwXCIgZm9udC1zaXplPVwiMjBcIj5cbiAgICAgICAgICAgICAgICA8dHNwYW4gZm9udC1mYW1pbHk9XCJjaHJvbWFjaGVjay1jb2xyXCIgeD1cIjBcIiBkeT1cIjIwXCI+JiN4ZTkwMDs8L3RzcGFuPlxuICAgICAgICAgICAgPC90ZXh0PlxuICAgICAgICA8L3N2Zz5gO1xuICAgICAgICBjYW52YXMud2lkdGggPSAyMDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IDEwMDtcblxuICAgICAgICBpbWcuc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3ZnKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIldhaXRpbmcgZm9yIENPTFIgU1ZHIHRvIGxvYWRcIik7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gaW1nLm9ubG9hZCA9IHJlc29sdmUpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkRyYXdpbmcgY2FudmFzIHRvIGRldGVjdCBDT0xSIHN1cHBvcnRcIik7XG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgICAgIGNvbnN0IGNvbHJGb250U3VwcG9ydGVkID0gKGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDEwLCAxMCwgMSwgMSkuZGF0YVswXSA9PT0gMjAwKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJDYW52YXMgY2hlY2sgcmV2ZWFsZWQgQ09MUiBpcyBzdXBwb3J0ZWQ/IFwiICsgY29sckZvbnRTdXBwb3J0ZWQpO1xuICAgICAgICByZXR1cm4gY29sckZvbnRTdXBwb3J0ZWQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGRuJ3QgbG9hZCBDT0xSIGZvbnRcIiwgZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmxldCBjb2xyRm9udENoZWNrU3RhcnRlZCA9IGZhbHNlO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpeHVwQ29sb3JGb250cygpIHtcbiAgICBpZiAoY29sckZvbnRDaGVja1N0YXJ0ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb2xyRm9udENoZWNrU3RhcnRlZCA9IHRydWU7XG5cbiAgICBpZiAoYXdhaXQgaXNDb2xyRm9udFN1cHBvcnRlZCgpKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBgdXJsKCcke3JlcXVpcmUoXCIuLi8uLi9yZXMvZm9udHMvVHdlbW9qaV9Nb3ppbGxhL1R3ZW1vamlNb3ppbGxhLWNvbHIud29mZjJcIil9JylgO1xuICAgICAgICBkb2N1bWVudC5mb250cy5hZGQobmV3IEZvbnRGYWNlKFwiVHdlbW9qaVwiLCBwYXRoLCB7fSkpO1xuICAgICAgICAvLyBGb3IgYXQgbGVhc3QgQ2hyb21lIG9uIFdpbmRvd3MgMTAsIHdlIGhhdmUgdG8gZXhwbGljdGx5IGFkZCBleHRyYVxuICAgICAgICAvLyB3ZWlnaHRzIGZvciB0aGUgZW1vamkgdG8gYXBwZWFyIGluIGJvbGQgbWVzc2FnZXMsIGV0Yy5cbiAgICAgICAgZG9jdW1lbnQuZm9udHMuYWRkKG5ldyBGb250RmFjZShcIlR3ZW1vamlcIiwgcGF0aCwgeyB3ZWlnaHQ6IDYwMCB9KSk7XG4gICAgICAgIGRvY3VtZW50LmZvbnRzLmFkZChuZXcgRm9udEZhY2UoXCJUd2Vtb2ppXCIsIHBhdGgsIHsgd2VpZ2h0OiA3MDAgfSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGZhbGwgYmFjayB0byBTQklYLCBnZW5lcmF0ZWQgdmlhIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL3R3ZW1vamktY29sci90cmVlL21hdHRoZXcvc2JpeFxuICAgICAgICBjb25zdCBwYXRoID0gYHVybCgnJHtyZXF1aXJlKFwiLi4vLi4vcmVzL2ZvbnRzL1R3ZW1vamlfTW96aWxsYS9Ud2Vtb2ppTW96aWxsYS1zYml4LndvZmYyXCIpfScpYDtcbiAgICAgICAgZG9jdW1lbnQuZm9udHMuYWRkKG5ldyBGb250RmFjZShcIlR3ZW1vamlcIiwgcGF0aCwge30pKTtcbiAgICAgICAgZG9jdW1lbnQuZm9udHMuYWRkKG5ldyBGb250RmFjZShcIlR3ZW1vamlcIiwgcGF0aCwgeyB3ZWlnaHQ6IDYwMCB9KSk7XG4gICAgICAgIGRvY3VtZW50LmZvbnRzLmFkZChuZXcgRm9udEZhY2UoXCJUd2Vtb2ppXCIsIHBhdGgsIHsgd2VpZ2h0OiA3MDAgfSkpO1xuICAgIH1cbiAgICAvLyAuLi5hbmQgaWYgU0JJWCBpcyBub3Qgc3VwcG9ydGVkLCB0aGUgYnJvd3NlciB3aWxsIGZhbGwgYmFjayB0byBvbmUgb2YgdGhlIG5hdGl2ZSBmb250cyBzcGVjaWZpZWQuXG59XG5cbiJdfQ==