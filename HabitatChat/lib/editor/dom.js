"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walkDOMDepthFirst = walkDOMDepthFirst;
exports.getCaretOffsetAndText = getCaretOffsetAndText;
exports.getRangeForSelection = getRangeForSelection;

var _render = require("./render");

var _offset = _interopRequireDefault(require("./offset"));

/*
Copyright 2019 New Vector Ltd
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
function walkDOMDepthFirst(rootNode, enterNodeCallback, leaveNodeCallback) {
  let node = rootNode.firstChild;

  while (node && node !== rootNode) {
    const shouldDescend = enterNodeCallback(node);

    if (shouldDescend && node.firstChild) {
      node = node.firstChild;
    } else if (node.nextSibling) {
      node = node.nextSibling;
    } else {
      while (!node.nextSibling && node !== rootNode) {
        node = node.parentElement;

        if (node !== rootNode) {
          leaveNodeCallback(node);
        }
      }

      if (node !== rootNode) {
        node = node.nextSibling;
      }
    }
  }
}

function getCaretOffsetAndText(editor, sel) {
  const {
    offset,
    text
  } = getSelectionOffsetAndText(editor, sel.focusNode, sel.focusOffset);
  return {
    caret: offset,
    text
  };
}

function tryReduceSelectionToTextNode(selectionNode, selectionOffset) {
  // if selectionNode is an element, the selected location comes after the selectionOffset-th child node,
  // which can point past any childNode, in which case, the end of selectionNode is selected.
  // we try to simplify this to point at a text node with the offset being
  // a character offset within the text node
  // Also see https://developer.mozilla.org/en-US/docs/Web/API/Selection
  while (selectionNode && selectionNode.nodeType === Node.ELEMENT_NODE) {
    const childNodeCount = selectionNode.childNodes.length;

    if (childNodeCount) {
      if (selectionOffset >= childNodeCount) {
        selectionNode = selectionNode.lastChild;

        if (selectionNode.nodeType === Node.TEXT_NODE) {
          selectionOffset = selectionNode.textContent.length;
        } else {
          // this will select the last child node in the next iteration
          selectionOffset = Number.MAX_SAFE_INTEGER;
        }
      } else {
        selectionNode = selectionNode.childNodes[selectionOffset]; // this will select the first child node in the next iteration

        selectionOffset = 0;
      }
    } else {
      // here node won't be a text node,
      // but characterOffset should be 0,
      // this happens under some circumstances
      // when the editor is empty.
      // In this case characterOffset=0 is the right thing to do
      break;
    }
  }

  return {
    node: selectionNode,
    characterOffset: selectionOffset
  };
}

function getSelectionOffsetAndText(editor, selectionNode, selectionOffset) {
  const {
    node,
    characterOffset
  } = tryReduceSelectionToTextNode(selectionNode, selectionOffset);
  const {
    text,
    offsetToNode
  } = getTextAndOffsetToNode(editor, node);
  const offset = getCaret(node, offsetToNode, characterOffset);
  return {
    offset,
    text
  };
} // gets the caret position details, ignoring and adjusting to
// the ZWS if you're typing in a caret node


function getCaret(node, offsetToNode, offsetWithinNode) {
  // if no node is selected, return an offset at the start
  if (!node) {
    return new _offset.default(0, false);
  }

  let atNodeEnd = offsetWithinNode === node.textContent.length;

  if (node.nodeType === Node.TEXT_NODE && (0, _render.isCaretNode)(node.parentElement)) {
    const zwsIdx = node.nodeValue.indexOf(_render.CARET_NODE_CHAR);

    if (zwsIdx !== -1 && zwsIdx < offsetWithinNode) {
      offsetWithinNode -= 1;
    } // if typing in a caret node, you're either typing before or after the ZWS.
    // In both cases, you should be considered at node end because the ZWS is
    // not included in the text here, and once the model is updated and rerendered,
    // that caret node will be removed.


    atNodeEnd = true;
  }

  return new _offset.default(offsetToNode + offsetWithinNode, atNodeEnd);
} // gets the text of the editor as a string,
// and the offset in characters where the selectionNode starts in that string
// all ZWS from caret nodes are filtered out


function getTextAndOffsetToNode(editor, selectionNode) {
  let offsetToNode = 0;
  let foundNode = false;
  let text = "";

  function enterNodeCallback(node) {
    if (!foundNode) {
      if (node === selectionNode) {
        foundNode = true;
      }
    } // usually newlines are entered as new DIV elements,
    // but for example while pasting in some browsers, they are still
    // converted to BRs, so also take these into account when they
    // are not the last element in the DIV.


    if (node.tagName === "BR" && node.nextSibling) {
      if (!foundNode) {
        offsetToNode += 1;
      }

      text += "\n";
    }

    const nodeText = node.nodeType === Node.TEXT_NODE && getTextNodeValue(node);

    if (nodeText) {
      if (!foundNode) {
        offsetToNode += nodeText.length;
      }

      text += nodeText;
    }

    return true;
  }

  function leaveNodeCallback(node) {
    // if this is not the last DIV (which are only used as line containers atm)
    // we don't just check if there is a nextSibling because sometimes the caret ends up
    // after the last DIV and it creates a newline if you type then,
    // whereas you just want it to be appended to the current line
    if (node.tagName === "DIV" && node.nextSibling && node.nextSibling.tagName === "DIV") {
      text += "\n";

      if (!foundNode) {
        offsetToNode += 1;
      }
    }
  }

  walkDOMDepthFirst(editor, enterNodeCallback, leaveNodeCallback);
  return {
    text,
    offsetToNode
  };
} // get text value of text node, ignoring ZWS if it's a caret node


function getTextNodeValue(node) {
  const nodeText = node.nodeValue; // filter out ZWS for caret nodes

  if ((0, _render.isCaretNode)(node.parentElement)) {
    // typed in the caret node, so there is now something more in it than the ZWS
    // so filter out the ZWS, and take the typed text into account
    if (nodeText.length !== 1) {
      return nodeText.replace(_render.CARET_NODE_CHAR, "");
    } else {
      // only contains ZWS, which is ignored, so return emtpy string
      return "";
    }
  } else {
    return nodeText;
  }
}

function getRangeForSelection(editor, model, selection) {
  const focusOffset = getSelectionOffsetAndText(editor, selection.focusNode, selection.focusOffset).offset;
  const anchorOffset = getSelectionOffsetAndText(editor, selection.anchorNode, selection.anchorOffset).offset;
  const focusPosition = focusOffset.asPosition(model);
  const anchorPosition = anchorOffset.asPosition(model);
  return model.startRange(focusPosition, anchorPosition);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lZGl0b3IvZG9tLmpzIl0sIm5hbWVzIjpbIndhbGtET01EZXB0aEZpcnN0Iiwicm9vdE5vZGUiLCJlbnRlck5vZGVDYWxsYmFjayIsImxlYXZlTm9kZUNhbGxiYWNrIiwibm9kZSIsImZpcnN0Q2hpbGQiLCJzaG91bGREZXNjZW5kIiwibmV4dFNpYmxpbmciLCJwYXJlbnRFbGVtZW50IiwiZ2V0Q2FyZXRPZmZzZXRBbmRUZXh0IiwiZWRpdG9yIiwic2VsIiwib2Zmc2V0IiwidGV4dCIsImdldFNlbGVjdGlvbk9mZnNldEFuZFRleHQiLCJmb2N1c05vZGUiLCJmb2N1c09mZnNldCIsImNhcmV0IiwidHJ5UmVkdWNlU2VsZWN0aW9uVG9UZXh0Tm9kZSIsInNlbGVjdGlvbk5vZGUiLCJzZWxlY3Rpb25PZmZzZXQiLCJub2RlVHlwZSIsIk5vZGUiLCJFTEVNRU5UX05PREUiLCJjaGlsZE5vZGVDb3VudCIsImNoaWxkTm9kZXMiLCJsZW5ndGgiLCJsYXN0Q2hpbGQiLCJURVhUX05PREUiLCJ0ZXh0Q29udGVudCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJjaGFyYWN0ZXJPZmZzZXQiLCJvZmZzZXRUb05vZGUiLCJnZXRUZXh0QW5kT2Zmc2V0VG9Ob2RlIiwiZ2V0Q2FyZXQiLCJvZmZzZXRXaXRoaW5Ob2RlIiwiRG9jdW1lbnRPZmZzZXQiLCJhdE5vZGVFbmQiLCJ6d3NJZHgiLCJub2RlVmFsdWUiLCJpbmRleE9mIiwiQ0FSRVRfTk9ERV9DSEFSIiwiZm91bmROb2RlIiwidGFnTmFtZSIsIm5vZGVUZXh0IiwiZ2V0VGV4dE5vZGVWYWx1ZSIsInJlcGxhY2UiLCJnZXRSYW5nZUZvclNlbGVjdGlvbiIsIm1vZGVsIiwic2VsZWN0aW9uIiwiYW5jaG9yT2Zmc2V0IiwiYW5jaG9yTm9kZSIsImZvY3VzUG9zaXRpb24iLCJhc1Bvc2l0aW9uIiwiYW5jaG9yUG9zaXRpb24iLCJzdGFydFJhbmdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztB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LGNBQWMsR0FBR0osWUFBWSxDQUFDRyxVQUFiLENBQXdCTCxLQUF4QixDQUF2QjtBQUNBLFNBQU9BLEtBQUssQ0FBQ08sVUFBTixDQUFpQkgsYUFBakIsRUFBZ0NFLGNBQWhDLENBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge0NBUkVUX05PREVfQ0hBUiwgaXNDYXJldE5vZGV9IGZyb20gXCIuL3JlbmRlclwiO1xuaW1wb3J0IERvY3VtZW50T2Zmc2V0IGZyb20gXCIuL29mZnNldFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gd2Fsa0RPTURlcHRoRmlyc3Qocm9vdE5vZGUsIGVudGVyTm9kZUNhbGxiYWNrLCBsZWF2ZU5vZGVDYWxsYmFjaykge1xuICAgIGxldCBub2RlID0gcm9vdE5vZGUuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAobm9kZSAmJiBub2RlICE9PSByb290Tm9kZSkge1xuICAgICAgICBjb25zdCBzaG91bGREZXNjZW5kID0gZW50ZXJOb2RlQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIGlmIChzaG91bGREZXNjZW5kICYmIG5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdoaWxlICghbm9kZS5uZXh0U2libGluZyAmJiBub2RlICE9PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlYXZlTm9kZUNhbGxiYWNrKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlICE9PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FyZXRPZmZzZXRBbmRUZXh0KGVkaXRvciwgc2VsKSB7XG4gICAgY29uc3Qge29mZnNldCwgdGV4dH0gPSBnZXRTZWxlY3Rpb25PZmZzZXRBbmRUZXh0KGVkaXRvciwgc2VsLmZvY3VzTm9kZSwgc2VsLmZvY3VzT2Zmc2V0KTtcbiAgICByZXR1cm4ge2NhcmV0OiBvZmZzZXQsIHRleHR9O1xufVxuXG5mdW5jdGlvbiB0cnlSZWR1Y2VTZWxlY3Rpb25Ub1RleHROb2RlKHNlbGVjdGlvbk5vZGUsIHNlbGVjdGlvbk9mZnNldCkge1xuICAgIC8vIGlmIHNlbGVjdGlvbk5vZGUgaXMgYW4gZWxlbWVudCwgdGhlIHNlbGVjdGVkIGxvY2F0aW9uIGNvbWVzIGFmdGVyIHRoZSBzZWxlY3Rpb25PZmZzZXQtdGggY2hpbGQgbm9kZSxcbiAgICAvLyB3aGljaCBjYW4gcG9pbnQgcGFzdCBhbnkgY2hpbGROb2RlLCBpbiB3aGljaCBjYXNlLCB0aGUgZW5kIG9mIHNlbGVjdGlvbk5vZGUgaXMgc2VsZWN0ZWQuXG4gICAgLy8gd2UgdHJ5IHRvIHNpbXBsaWZ5IHRoaXMgdG8gcG9pbnQgYXQgYSB0ZXh0IG5vZGUgd2l0aCB0aGUgb2Zmc2V0IGJlaW5nXG4gICAgLy8gYSBjaGFyYWN0ZXIgb2Zmc2V0IHdpdGhpbiB0aGUgdGV4dCBub2RlXG4gICAgLy8gQWxzbyBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NlbGVjdGlvblxuICAgIHdoaWxlIChzZWxlY3Rpb25Ob2RlICYmIHNlbGVjdGlvbk5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZUNvdW50ID0gc2VsZWN0aW9uTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgaWYgKGNoaWxkTm9kZUNvdW50KSB7XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uT2Zmc2V0ID49IGNoaWxkTm9kZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uTm9kZSA9IHNlbGVjdGlvbk5vZGUubGFzdENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3Rpb25Ob2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25PZmZzZXQgPSBzZWxlY3Rpb25Ob2RlLnRleHRDb250ZW50Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgc2VsZWN0IHRoZSBsYXN0IGNoaWxkIG5vZGUgaW4gdGhlIG5leHQgaXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbk9mZnNldCA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uTm9kZSA9IHNlbGVjdGlvbk5vZGUuY2hpbGROb2Rlc1tzZWxlY3Rpb25PZmZzZXRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCBzZWxlY3QgdGhlIGZpcnN0IGNoaWxkIG5vZGUgaW4gdGhlIG5leHQgaXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uT2Zmc2V0ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGhlcmUgbm9kZSB3b24ndCBiZSBhIHRleHQgbm9kZSxcbiAgICAgICAgICAgIC8vIGJ1dCBjaGFyYWN0ZXJPZmZzZXQgc2hvdWxkIGJlIDAsXG4gICAgICAgICAgICAvLyB0aGlzIGhhcHBlbnMgdW5kZXIgc29tZSBjaXJjdW1zdGFuY2VzXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBlZGl0b3IgaXMgZW1wdHkuXG4gICAgICAgICAgICAvLyBJbiB0aGlzIGNhc2UgY2hhcmFjdGVyT2Zmc2V0PTAgaXMgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBub2RlOiBzZWxlY3Rpb25Ob2RlLFxuICAgICAgICBjaGFyYWN0ZXJPZmZzZXQ6IHNlbGVjdGlvbk9mZnNldCxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25PZmZzZXRBbmRUZXh0KGVkaXRvciwgc2VsZWN0aW9uTm9kZSwgc2VsZWN0aW9uT2Zmc2V0KSB7XG4gICAgY29uc3Qge25vZGUsIGNoYXJhY3Rlck9mZnNldH0gPSB0cnlSZWR1Y2VTZWxlY3Rpb25Ub1RleHROb2RlKHNlbGVjdGlvbk5vZGUsIHNlbGVjdGlvbk9mZnNldCk7XG4gICAgY29uc3Qge3RleHQsIG9mZnNldFRvTm9kZX0gPSBnZXRUZXh0QW5kT2Zmc2V0VG9Ob2RlKGVkaXRvciwgbm9kZSk7XG4gICAgY29uc3Qgb2Zmc2V0ID0gZ2V0Q2FyZXQobm9kZSwgb2Zmc2V0VG9Ob2RlLCBjaGFyYWN0ZXJPZmZzZXQpO1xuICAgIHJldHVybiB7b2Zmc2V0LCB0ZXh0fTtcbn1cblxuLy8gZ2V0cyB0aGUgY2FyZXQgcG9zaXRpb24gZGV0YWlscywgaWdub3JpbmcgYW5kIGFkanVzdGluZyB0b1xuLy8gdGhlIFpXUyBpZiB5b3UncmUgdHlwaW5nIGluIGEgY2FyZXQgbm9kZVxuZnVuY3Rpb24gZ2V0Q2FyZXQobm9kZSwgb2Zmc2V0VG9Ob2RlLCBvZmZzZXRXaXRoaW5Ob2RlKSB7XG4gICAgLy8gaWYgbm8gbm9kZSBpcyBzZWxlY3RlZCwgcmV0dXJuIGFuIG9mZnNldCBhdCB0aGUgc3RhcnRcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudE9mZnNldCgwLCBmYWxzZSk7XG4gICAgfVxuICAgIGxldCBhdE5vZGVFbmQgPSBvZmZzZXRXaXRoaW5Ob2RlID09PSBub2RlLnRleHRDb250ZW50Lmxlbmd0aDtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUgJiYgaXNDYXJldE5vZGUobm9kZS5wYXJlbnRFbGVtZW50KSkge1xuICAgICAgICBjb25zdCB6d3NJZHggPSBub2RlLm5vZGVWYWx1ZS5pbmRleE9mKENBUkVUX05PREVfQ0hBUik7XG4gICAgICAgIGlmICh6d3NJZHggIT09IC0xICYmIHp3c0lkeCA8IG9mZnNldFdpdGhpbk5vZGUpIHtcbiAgICAgICAgICAgIG9mZnNldFdpdGhpbk5vZGUgLT0gMTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB0eXBpbmcgaW4gYSBjYXJldCBub2RlLCB5b3UncmUgZWl0aGVyIHR5cGluZyBiZWZvcmUgb3IgYWZ0ZXIgdGhlIFpXUy5cbiAgICAgICAgLy8gSW4gYm90aCBjYXNlcywgeW91IHNob3VsZCBiZSBjb25zaWRlcmVkIGF0IG5vZGUgZW5kIGJlY2F1c2UgdGhlIFpXUyBpc1xuICAgICAgICAvLyBub3QgaW5jbHVkZWQgaW4gdGhlIHRleHQgaGVyZSwgYW5kIG9uY2UgdGhlIG1vZGVsIGlzIHVwZGF0ZWQgYW5kIHJlcmVuZGVyZWQsXG4gICAgICAgIC8vIHRoYXQgY2FyZXQgbm9kZSB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICAgIGF0Tm9kZUVuZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRG9jdW1lbnRPZmZzZXQob2Zmc2V0VG9Ob2RlICsgb2Zmc2V0V2l0aGluTm9kZSwgYXROb2RlRW5kKTtcbn1cblxuLy8gZ2V0cyB0aGUgdGV4dCBvZiB0aGUgZWRpdG9yIGFzIGEgc3RyaW5nLFxuLy8gYW5kIHRoZSBvZmZzZXQgaW4gY2hhcmFjdGVycyB3aGVyZSB0aGUgc2VsZWN0aW9uTm9kZSBzdGFydHMgaW4gdGhhdCBzdHJpbmdcbi8vIGFsbCBaV1MgZnJvbSBjYXJldCBub2RlcyBhcmUgZmlsdGVyZWQgb3V0XG5mdW5jdGlvbiBnZXRUZXh0QW5kT2Zmc2V0VG9Ob2RlKGVkaXRvciwgc2VsZWN0aW9uTm9kZSkge1xuICAgIGxldCBvZmZzZXRUb05vZGUgPSAwO1xuICAgIGxldCBmb3VuZE5vZGUgPSBmYWxzZTtcbiAgICBsZXQgdGV4dCA9IFwiXCI7XG5cbiAgICBmdW5jdGlvbiBlbnRlck5vZGVDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PT0gc2VsZWN0aW9uTm9kZSkge1xuICAgICAgICAgICAgICAgIGZvdW5kTm9kZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXN1YWxseSBuZXdsaW5lcyBhcmUgZW50ZXJlZCBhcyBuZXcgRElWIGVsZW1lbnRzLFxuICAgICAgICAvLyBidXQgZm9yIGV4YW1wbGUgd2hpbGUgcGFzdGluZyBpbiBzb21lIGJyb3dzZXJzLCB0aGV5IGFyZSBzdGlsbFxuICAgICAgICAvLyBjb252ZXJ0ZWQgdG8gQlJzLCBzbyBhbHNvIHRha2UgdGhlc2UgaW50byBhY2NvdW50IHdoZW4gdGhleVxuICAgICAgICAvLyBhcmUgbm90IHRoZSBsYXN0IGVsZW1lbnQgaW4gdGhlIERJVi5cbiAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJCUlwiICYmIG5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0VG9Ob2RlICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZVRleHQgPSBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSAmJiBnZXRUZXh0Tm9kZVZhbHVlKG5vZGUpO1xuICAgICAgICBpZiAobm9kZVRleHQpIHtcbiAgICAgICAgICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0VG9Ob2RlICs9IG5vZGVUZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgKz0gbm9kZVRleHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGVhdmVOb2RlQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICAvLyBpZiB0aGlzIGlzIG5vdCB0aGUgbGFzdCBESVYgKHdoaWNoIGFyZSBvbmx5IHVzZWQgYXMgbGluZSBjb250YWluZXJzIGF0bSlcbiAgICAgICAgLy8gd2UgZG9uJ3QganVzdCBjaGVjayBpZiB0aGVyZSBpcyBhIG5leHRTaWJsaW5nIGJlY2F1c2Ugc29tZXRpbWVzIHRoZSBjYXJldCBlbmRzIHVwXG4gICAgICAgIC8vIGFmdGVyIHRoZSBsYXN0IERJViBhbmQgaXQgY3JlYXRlcyBhIG5ld2xpbmUgaWYgeW91IHR5cGUgdGhlbixcbiAgICAgICAgLy8gd2hlcmVhcyB5b3UganVzdCB3YW50IGl0IHRvIGJlIGFwcGVuZGVkIHRvIHRoZSBjdXJyZW50IGxpbmVcbiAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJESVZcIiAmJiBub2RlLm5leHRTaWJsaW5nICYmIG5vZGUubmV4dFNpYmxpbmcudGFnTmFtZSA9PT0gXCJESVZcIikge1xuICAgICAgICAgICAgdGV4dCArPSBcIlxcblwiO1xuICAgICAgICAgICAgaWYgKCFmb3VuZE5vZGUpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRUb05vZGUgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdhbGtET01EZXB0aEZpcnN0KGVkaXRvciwgZW50ZXJOb2RlQ2FsbGJhY2ssIGxlYXZlTm9kZUNhbGxiYWNrKTtcblxuICAgIHJldHVybiB7dGV4dCwgb2Zmc2V0VG9Ob2RlfTtcbn1cblxuLy8gZ2V0IHRleHQgdmFsdWUgb2YgdGV4dCBub2RlLCBpZ25vcmluZyBaV1MgaWYgaXQncyBhIGNhcmV0IG5vZGVcbmZ1bmN0aW9uIGdldFRleHROb2RlVmFsdWUobm9kZSkge1xuICAgIGNvbnN0IG5vZGVUZXh0ID0gbm9kZS5ub2RlVmFsdWU7XG4gICAgLy8gZmlsdGVyIG91dCBaV1MgZm9yIGNhcmV0IG5vZGVzXG4gICAgaWYgKGlzQ2FyZXROb2RlKG5vZGUucGFyZW50RWxlbWVudCkpIHtcbiAgICAgICAgLy8gdHlwZWQgaW4gdGhlIGNhcmV0IG5vZGUsIHNvIHRoZXJlIGlzIG5vdyBzb21ldGhpbmcgbW9yZSBpbiBpdCB0aGFuIHRoZSBaV1NcbiAgICAgICAgLy8gc28gZmlsdGVyIG91dCB0aGUgWldTLCBhbmQgdGFrZSB0aGUgdHlwZWQgdGV4dCBpbnRvIGFjY291bnRcbiAgICAgICAgaWYgKG5vZGVUZXh0Lmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVUZXh0LnJlcGxhY2UoQ0FSRVRfTk9ERV9DSEFSLCBcIlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG9ubHkgY29udGFpbnMgWldTLCB3aGljaCBpcyBpZ25vcmVkLCBzbyByZXR1cm4gZW10cHkgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBub2RlVGV4dDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYW5nZUZvclNlbGVjdGlvbihlZGl0b3IsIG1vZGVsLCBzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBmb2N1c09mZnNldCA9IGdldFNlbGVjdGlvbk9mZnNldEFuZFRleHQoXG4gICAgICAgIGVkaXRvcixcbiAgICAgICAgc2VsZWN0aW9uLmZvY3VzTm9kZSxcbiAgICAgICAgc2VsZWN0aW9uLmZvY3VzT2Zmc2V0LFxuICAgICkub2Zmc2V0O1xuICAgIGNvbnN0IGFuY2hvck9mZnNldCA9IGdldFNlbGVjdGlvbk9mZnNldEFuZFRleHQoXG4gICAgICAgIGVkaXRvcixcbiAgICAgICAgc2VsZWN0aW9uLmFuY2hvck5vZGUsXG4gICAgICAgIHNlbGVjdGlvbi5hbmNob3JPZmZzZXQsXG4gICAgKS5vZmZzZXQ7XG4gICAgY29uc3QgZm9jdXNQb3NpdGlvbiA9IGZvY3VzT2Zmc2V0LmFzUG9zaXRpb24obW9kZWwpO1xuICAgIGNvbnN0IGFuY2hvclBvc2l0aW9uID0gYW5jaG9yT2Zmc2V0LmFzUG9zaXRpb24obW9kZWwpO1xuICAgIHJldHVybiBtb2RlbC5zdGFydFJhbmdlKGZvY3VzUG9zaXRpb24sIGFuY2hvclBvc2l0aW9uKTtcbn1cbiJdfQ==