"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mdSerialize = mdSerialize;
exports.htmlSerializeIfNeeded = htmlSerializeIfNeeded;
exports.textSerialize = textSerialize;
exports.containsEmote = containsEmote;
exports.startsWith = startsWith;
exports.stripEmoteCommand = stripEmoteCommand;
exports.stripPrefix = stripPrefix;
exports.unescapeMessage = unescapeMessage;

var _Markdown = _interopRequireDefault(require("../Markdown"));

var _Permalinks = require("../utils/permalinks/Permalinks");

/*
Copyright 2019 New Vector Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
function mdSerialize(model
/*: EditorModel*/
) {
  return model.parts.reduce((html, part) => {
    switch (part.type) {
      case "newline":
        return html + "\n";

      case "plain":
      case "command":
      case "pill-candidate":
      case "at-room-pill":
        return html + part.text;

      case "room-pill":
      case "user-pill":
        return html + "[".concat(part.text.replace(/[[\\\]]/g, c => "\\" + c), "](").concat((0, _Permalinks.makeGenericPermalink)(part.resourceId), ")");
    }
  }, "");
}

function htmlSerializeIfNeeded(model
/*: EditorModel*/
, {
  forceHTML = false
} = {}) {
  const md = mdSerialize(model);
  const parser = new _Markdown.default(md);

  if (!parser.isPlainText() || forceHTML) {
    return parser.toHTML();
  }
}

function textSerialize(model
/*: EditorModel*/
) {
  return model.parts.reduce((text, part) => {
    switch (part.type) {
      case "newline":
        return text + "\n";

      case "plain":
      case "command":
      case "pill-candidate":
      case "at-room-pill":
        return text + part.text;

      case "room-pill":
      case "user-pill":
        return text + "".concat(part.text);
    }
  }, "");
}

function containsEmote(model
/*: EditorModel*/
) {
  return startsWith(model, "/me ");
}

function startsWith(model
/*: EditorModel*/
, prefix
/*: string*/
) {
  const firstPart = model.parts[0]; // part type will be "plain" while editing,
  // and "command" while composing a message.

  return firstPart && (firstPart.type === "plain" || firstPart.type === "command") && firstPart.text.startsWith(prefix);
}

function stripEmoteCommand(model
/*: EditorModel*/
) {
  // trim "/me "
  return stripPrefix(model, "/me ");
}

function stripPrefix(model
/*: EditorModel*/
, prefix
/*: string*/
) {
  model = model.clone();
  model.removeText({
    index: 0,
    offset: 0
  }, prefix.length);
  return model;
}

function unescapeMessage(model
/*: EditorModel*/
) {
  const {
    parts
  } = model;

  if (parts.length) {
    const firstPart = parts[0]; // only unescape \/ to / at start of editor

    if (firstPart.type === "plain" && firstPart.text.startsWith("\\/")) {
      model = model.clone();
      model.removeText({
        index: 0,
        offset: 0
      }, 1);
    }
  }

  return model;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lZGl0b3Ivc2VyaWFsaXplLnRzIl0sIm5hbWVzIjpbIm1kU2VyaWFsaXplIiwibW9kZWwiLCJwYXJ0cyIsInJlZHVjZSIsImh0bWwiLCJwYXJ0IiwidHlwZSIsInRleHQiLCJyZXBsYWNlIiwiYyIsInJlc291cmNlSWQiLCJodG1sU2VyaWFsaXplSWZOZWVkZWQiLCJmb3JjZUhUTUwiLCJtZCIsInBhcnNlciIsIk1hcmtkb3duIiwiaXNQbGFpblRleHQiLCJ0b0hUTUwiLCJ0ZXh0U2VyaWFsaXplIiwiY29udGFpbnNFbW90ZSIsInN0YXJ0c1dpdGgiLCJwcmVmaXgiLCJmaXJzdFBhcnQiLCJzdHJpcEVtb3RlQ29tbWFuZCIsInN0cmlwUHJlZml4IiwiY2xvbmUiLCJyZW1vdmVUZXh0IiwiaW5kZXgiLCJvZmZzZXQiLCJsZW5ndGgiLCJ1bmVzY2FwZU1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJPLFNBQVNBLFdBQVQsQ0FBcUJDO0FBQXJCO0FBQUEsRUFBeUM7QUFDNUMsU0FBT0EsS0FBSyxDQUFDQyxLQUFOLENBQVlDLE1BQVosQ0FBbUIsQ0FBQ0MsSUFBRCxFQUFPQyxJQUFQLEtBQWdCO0FBQ3RDLFlBQVFBLElBQUksQ0FBQ0MsSUFBYjtBQUNJLFdBQUssU0FBTDtBQUNJLGVBQU9GLElBQUksR0FBRyxJQUFkOztBQUNKLFdBQUssT0FBTDtBQUNBLFdBQUssU0FBTDtBQUNBLFdBQUssZ0JBQUw7QUFDQSxXQUFLLGNBQUw7QUFDSSxlQUFPQSxJQUFJLEdBQUdDLElBQUksQ0FBQ0UsSUFBbkI7O0FBQ0osV0FBSyxXQUFMO0FBQ0EsV0FBSyxXQUFMO0FBQ0ksZUFBT0gsSUFBSSxjQUFPQyxJQUFJLENBQUNFLElBQUwsQ0FBVUMsT0FBVixDQUFrQixVQUFsQixFQUE4QkMsQ0FBQyxJQUFJLE9BQU9BLENBQTFDLENBQVAsZUFBd0Qsc0NBQXFCSixJQUFJ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QUssQ0FBQ3lCLFVBQU4sQ0FBaUI7QUFBQ0MsUUFBQUEsS0FBSyxFQUFFLENBQVI7QUFBV0MsUUFBQUEsTUFBTSxFQUFFO0FBQW5CLE9BQWpCLEVBQXdDLENBQXhDO0FBQ0g7QUFDSjs7QUFDRCxTQUFPM0IsS0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSwgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBNYXJrZG93biBmcm9tICcuLi9NYXJrZG93bic7XG5pbXBvcnQge21ha2VHZW5lcmljUGVybWFsaW5rfSBmcm9tIFwiLi4vdXRpbHMvcGVybWFsaW5rcy9QZXJtYWxpbmtzXCI7XG5pbXBvcnQgRWRpdG9yTW9kZWwgZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG1kU2VyaWFsaXplKG1vZGVsOiBFZGl0b3JNb2RlbCkge1xuICAgIHJldHVybiBtb2RlbC5wYXJ0cy5yZWR1Y2UoKGh0bWwsIHBhcnQpID0+IHtcbiAgICAgICAgc3dpdGNoIChwYXJ0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJuZXdsaW5lXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwgKyBcIlxcblwiO1xuICAgICAgICAgICAgY2FzZSBcInBsYWluXCI6XG4gICAgICAgICAgICBjYXNlIFwiY29tbWFuZFwiOlxuICAgICAgICAgICAgY2FzZSBcInBpbGwtY2FuZGlkYXRlXCI6XG4gICAgICAgICAgICBjYXNlIFwiYXQtcm9vbS1waWxsXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwgKyBwYXJ0LnRleHQ7XG4gICAgICAgICAgICBjYXNlIFwicm9vbS1waWxsXCI6XG4gICAgICAgICAgICBjYXNlIFwidXNlci1waWxsXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwgKyBgWyR7cGFydC50ZXh0LnJlcGxhY2UoL1tbXFxcXFxcXV0vZywgYyA9PiBcIlxcXFxcIiArIGMpfV0oJHttYWtlR2VuZXJpY1Blcm1hbGluayhwYXJ0LnJlc291cmNlSWQpfSlgO1xuICAgICAgICB9XG4gICAgfSwgXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sU2VyaWFsaXplSWZOZWVkZWQobW9kZWw6IEVkaXRvck1vZGVsLCB7Zm9yY2VIVE1MID0gZmFsc2V9ID0ge30pIHtcbiAgICBjb25zdCBtZCA9IG1kU2VyaWFsaXplKG1vZGVsKTtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgTWFya2Rvd24obWQpO1xuICAgIGlmICghcGFyc2VyLmlzUGxhaW5UZXh0KCkgfHwgZm9yY2VIVE1MKSB7XG4gICAgICAgIHJldHVybiBwYXJzZXIudG9IVE1MKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGV4dFNlcmlhbGl6ZShtb2RlbDogRWRpdG9yTW9kZWwpIHtcbiAgICByZXR1cm4gbW9kZWwucGFydHMucmVkdWNlKCh0ZXh0LCBwYXJ0KSA9PiB7XG4gICAgICAgIHN3aXRjaCAocGFydC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwibmV3bGluZVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0ICsgXCJcXG5cIjtcbiAgICAgICAgICAgIGNhc2UgXCJwbGFpblwiOlxuICAgICAgICAgICAgY2FzZSBcImNvbW1hbmRcIjpcbiAgICAgICAgICAgIGNhc2UgXCJwaWxsLWNhbmRpZGF0ZVwiOlxuICAgICAgICAgICAgY2FzZSBcImF0LXJvb20tcGlsbFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0ICsgcGFydC50ZXh0O1xuICAgICAgICAgICAgY2FzZSBcInJvb20tcGlsbFwiOlxuICAgICAgICAgICAgY2FzZSBcInVzZXItcGlsbFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0ICsgYCR7cGFydC50ZXh0fWA7XG4gICAgICAgIH1cbiAgICB9LCBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zRW1vdGUobW9kZWw6IEVkaXRvck1vZGVsKSB7XG4gICAgcmV0dXJuIHN0YXJ0c1dpdGgobW9kZWwsIFwiL21lIFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0c1dpdGgobW9kZWw6IEVkaXRvck1vZGVsLCBwcmVmaXg6IHN0cmluZykge1xuICAgIGNvbnN0IGZpcnN0UGFydCA9IG1vZGVsLnBhcnRzWzBdO1xuICAgIC8vIHBhcnQgdHlwZSB3aWxsIGJlIFwicGxhaW5cIiB3aGlsZSBlZGl0aW5nLFxuICAgIC8vIGFuZCBcImNvbW1hbmRcIiB3aGlsZSBjb21wb3NpbmcgYSBtZXNzYWdlLlxuICAgIHJldHVybiBmaXJzdFBhcnQgJiZcbiAgICAgICAgKGZpcnN0UGFydC50eXBlID09PSBcInBsYWluXCIgfHwgZmlyc3RQYXJ0LnR5cGUgPT09IFwiY29tbWFuZFwiKSAmJlxuICAgICAgICBmaXJzdFBhcnQudGV4dC5zdGFydHNXaXRoKHByZWZpeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEVtb3RlQ29tbWFuZChtb2RlbDogRWRpdG9yTW9kZWwpIHtcbiAgICAvLyB0cmltIFwiL21lIFwiXG4gICAgcmV0dXJuIHN0cmlwUHJlZml4KG1vZGVsLCBcIi9tZSBcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcFByZWZpeChtb2RlbDogRWRpdG9yTW9kZWwsIHByZWZpeDogc3RyaW5nKSB7XG4gICAgbW9kZWwgPSBtb2RlbC5jbG9uZSgpO1xuICAgIG1vZGVsLnJlbW92ZVRleHQoe2luZGV4OiAwLCBvZmZzZXQ6IDB9LCBwcmVmaXgubGVuZ3RoKTtcbiAgICByZXR1cm4gbW9kZWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmVzY2FwZU1lc3NhZ2UobW9kZWw6IEVkaXRvck1vZGVsKSB7XG4gICAgY29uc3Qge3BhcnRzfSA9IG1vZGVsO1xuICAgIGlmIChwYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgZmlyc3RQYXJ0ID0gcGFydHNbMF07XG4gICAgICAgIC8vIG9ubHkgdW5lc2NhcGUgXFwvIHRvIC8gYXQgc3RhcnQgb2YgZWRpdG9yXG4gICAgICAgIGlmIChmaXJzdFBhcnQudHlwZSA9PT0gXCJwbGFpblwiICYmIGZpcnN0UGFydC50ZXh0LnN0YXJ0c1dpdGgoXCJcXFxcL1wiKSkge1xuICAgICAgICAgICAgbW9kZWwgPSBtb2RlbC5jbG9uZSgpO1xuICAgICAgICAgICAgbW9kZWwucmVtb3ZlVGV4dCh7aW5kZXg6IDAsIG9mZnNldDogMH0sIDEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtb2RlbDtcbn1cbiJdfQ==