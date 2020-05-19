"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.editBodyDiffToHtml = editBodyDiffToHtml;

var _react = _interopRequireDefault(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var _diffMatchPatch = _interopRequireDefault(require("diff-match-patch"));

var _diffDom = require("diff-dom");

var _HtmlUtils = require("../HtmlUtils");

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
const decodeEntities = function () {
  let textarea = null;
  return function (string) {
    if (!textarea) {
      textarea = document.createElement("textarea");
    }

    textarea.innerHTML = string;
    return textarea.value;
  };
}();

function textToHtml(text) {
  const container = document.createElement("div");
  container.textContent = text;
  return container.innerHTML;
}

function getSanitizedHtmlBody(content) {
  const opts = {
    stripReplyFallback: true,
    returnString: true
  };

  if (content.format === "org.matrix.custom.html") {
    return (0, _HtmlUtils.bodyToHtml)(content, null, opts);
  } else {
    // convert the string to something that can be safely
    // embedded in an html document, e.g. use html entities where needed
    // This is also needed so that DiffDOM wouldn't interpret something
    // as a tag when somebody types e.g. "</sarcasm>"
    // as opposed to bodyToHtml, here we also render
    // text messages with dangerouslySetInnerHTML, to unify
    // the code paths and because we need html to show differences
    return textToHtml((0, _HtmlUtils.bodyToHtml)(content, null, opts));
  }
}

function wrapInsertion(child) {
  const wrapper = document.createElement((0, _HtmlUtils.checkBlockNode)(child) ? "div" : "span");
  wrapper.className = "mx_EditHistoryMessage_insertion";
  wrapper.appendChild(child);
  return wrapper;
}

function wrapDeletion(child) {
  const wrapper = document.createElement((0, _HtmlUtils.checkBlockNode)(child) ? "div" : "span");
  wrapper.className = "mx_EditHistoryMessage_deletion";
  wrapper.appendChild(child);
  return wrapper;
}

function findRefNodes(root, route, isAddition) {
  let refNode = root;
  let refParentNode;
  const end = isAddition ? route.length - 1 : route.length;

  for (let i = 0; i < end; ++i) {
    refParentNode = refNode;
    refNode = refNode.childNodes[route[i]];
  }

  return {
    refNode,
    refParentNode
  };
}

function diffTreeToDOM(desc) {
  if (desc.nodeName === "#text") {
    return stringAsTextNode(desc.data);
  } else {
    const node = document.createElement(desc.nodeName);

    if (desc.attributes) {
      for (const [key, value] of Object.entries(desc.attributes)) {
        node.setAttribute(key, value);
      }
    }

    if (desc.childNodes) {
      for (const childDesc of desc.childNodes) {
        node.appendChild(diffTreeToDOM(childDesc));
      }
    }

    return node;
  }
}

function insertBefore(parent, nextSibling, child) {
  if (nextSibling) {
    parent.insertBefore(child, nextSibling);
  } else {
    parent.appendChild(child);
  }
}

function isRouteOfNextSibling(route1, route2) {
  // routes are arrays with indices,
  // to be interpreted as a path in the dom tree
  // ensure same parent
  for (let i = 0; i < route1.length - 1; ++i) {
    if (route1[i] !== route2[i]) {
      return false;
    }
  } // the route2 is only affected by the diff of route1
  // inserting an element if the index at the level of the
  // last element of route1 being larger
  // (e.g. coming behind route1 at that level)


  const lastD1Idx = route1.length - 1;
  return route2[lastD1Idx] >= route1[lastD1Idx];
}

function adjustRoutes(diff, remainingDiffs) {
  if (diff.action === "removeTextElement" || diff.action === "removeElement") {
    // as removed text is not removed from the html, but marked as deleted,
    // we need to readjust indices that assume the current node has been removed.
    const advance = 1;

    for (const rd of remainingDiffs) {
      if (isRouteOfNextSibling(diff.route, rd.route)) {
        rd.route[diff.route.length - 1] += advance;
      }
    }
  }
}

function stringAsTextNode(string) {
  return document.createTextNode(decodeEntities(string));
}

function renderDifferenceInDOM(originalRootNode, diff, diffMathPatch) {
  const {
    refNode,
    refParentNode
  } = findRefNodes(originalRootNode, diff.route);

  switch (diff.action) {
    case "replaceElement":
      {
        const container = document.createElement("span");
        const delNode = wrapDeletion(diffTreeToDOM(diff.oldValue));
        const insNode = wrapInsertion(diffTreeToDOM(diff.newValue));
        container.appendChild(delNode);
        container.appendChild(insNode);
        refNode.parentNode.replaceChild(container, refNode);
        break;
      }

    case "removeTextElement":
      {
        const delNode = wrapDeletion(stringAsTextNode(diff.value));
        refNode.parentNode.replaceChild(delNode, refNode);
        break;
      }

    case "removeElement":
      {
        const delNode = wrapDeletion(diffTreeToDOM(diff.element));
        refNode.parentNode.replaceChild(delNode, refNode);
        break;
      }

    case "modifyTextElement":
      {
        const textDiffs = diffMathPatch.diff_main(diff.oldValue, diff.newValue);
        diffMathPatch.diff_cleanupSemantic(textDiffs);
        const container = document.createElement("span");

        for (const [modifier, text] of textDiffs) {
          let textDiffNode = stringAsTextNode(text);

          if (modifier < 0) {
            textDiffNode = wrapDeletion(textDiffNode);
          } else if (modifier > 0) {
            textDiffNode = wrapInsertion(textDiffNode);
          }

          container.appendChild(textDiffNode);
        }

        refNode.parentNode.replaceChild(container, refNode);
        break;
      }

    case "addElement":
      {
        const insNode = wrapInsertion(diffTreeToDOM(diff.element));
        insertBefore(refParentNode, refNode, insNode);
        break;
      }

    case "addTextElement":
      {
        // XXX: sometimes diffDOM says insert a newline when there shouldn't be one
        // but we must insert the node anyway so that we don't break the route child IDs.
        // See https://github.com/fiduswriter/diffDOM/issues/100
        const insNode = wrapInsertion(stringAsTextNode(diff.value !== "\n" ? diff.value : ""));
        insertBefore(refParentNode, refNode, insNode);
        break;
      }
    // e.g. when changing a the href of a link,
    // show the link with old href as removed and with the new href as added

    case "removeAttribute":
    case "addAttribute":
    case "modifyAttribute":
      {
        const delNode = wrapDeletion(refNode.cloneNode(true));
        const updatedNode = refNode.cloneNode(true);

        if (diff.action === "addAttribute" || diff.action === "modifyAttribute") {
          updatedNode.setAttribute(diff.name, diff.newValue);
        } else {
          updatedNode.removeAttribute(diff.name);
        }

        const insNode = wrapInsertion(updatedNode);
        const container = document.createElement((0, _HtmlUtils.checkBlockNode)(refNode) ? "div" : "span");
        container.appendChild(delNode);
        container.appendChild(insNode);
        refNode.parentNode.replaceChild(container, refNode);
        break;
      }

    default:
      // Should not happen (modifyComment, ???)
      console.warn("MessageDiffUtils::editBodyDiffToHtml: diff action not supported atm", diff);
  }
}

function routeIsEqual(r1, r2) {
  return r1.length === r2.length && !r1.some((e, i) => e !== r2[i]);
} // workaround for https://github.com/fiduswriter/diffDOM/issues/90


function filterCancelingOutDiffs(originalDiffActions) {
  const diffActions = originalDiffActions.slice();

  for (let i = 0; i < diffActions.length; ++i) {
    const diff = diffActions[i];

    if (diff.action === "removeTextElement") {
      const nextDiff = diffActions[i + 1];
      const cancelsOut = nextDiff && nextDiff.action === "addTextElement" && nextDiff.text === diff.text && routeIsEqual(nextDiff.route, diff.route);

      if (cancelsOut) {
        diffActions.splice(i, 2);
      }
    }
  }

  return diffActions;
}
/**
 * Renders a message with the changes made in an edit shown visually.
 * @param {object} originalContent the content for the base message
 * @param {object} editContent the content for the edit message
 * @return {object} a react element similar to what `bodyToHtml` returns
 */


function editBodyDiffToHtml(originalContent, editContent) {
  // wrap the body in a div, DiffDOM needs a root element
  const originalBody = "<div>".concat(getSanitizedHtmlBody(originalContent), "</div>");
  const editBody = "<div>".concat(getSanitizedHtmlBody(editContent), "</div>");
  const dd = new _diffDom.DiffDOM(); // diffActions is an array of objects with at least a `action` and `route`
  // property. `action` tells us what the diff object changes, and `route` where.
  // `route` is a path on the DOM tree expressed as an array of indices.

  const originaldiffActions = dd.diff(originalBody, editBody); // work around https://github.com/fiduswriter/diffDOM/issues/90

  const diffActions = filterCancelingOutDiffs(originaldiffActions); // for diffing text fragments

  const diffMathPatch = new _diffMatchPatch.default(); // parse the base html message as a DOM tree, to which we'll apply the differences found.
  // fish out the div in which we wrapped the messages above with children[0].

  const originalRootNode = new DOMParser().parseFromString(originalBody, "text/html").body.children[0];

  for (let i = 0; i < diffActions.length; ++i) {
    const diff = diffActions[i];
    renderDifferenceInDOM(originalRootNode, diff, diffMathPatch); // DiffDOM assumes in subsequent diffs route path that
    // the action was applied (e.g. that a removeElement action removed the element).
    // This is not the case for us. We render differences in the DOM tree, and don't apply them.
    // So we need to adjust the routes of the remaining diffs to account for this.

    adjustRoutes(diff, diffActions.slice(i + 1));
  } // take the html out of the modified DOM tree again


  const safeBody = originalRootNode.innerHTML;
  const className = (0, _classnames.default)({
    'mx_EventTile_body': true,
    'markdown-body': true
  });
  return /*#__PURE__*/_react.default.createElement("span", {
    key: "body",
    className: className,
    dangerouslySetInnerHTML: {
      __html: safeBody
    },
    dir: "auto"
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9NZXNzYWdlRGlmZlV0aWxzLmpzIl0sIm5hbWVzIjpbImRlY29kZUVudGl0aWVzIiwidGV4dGFyZWEiLCJzdHJpbmciLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ2YWx1ZSIsInRleHRUb0h0bWwiLCJ0ZXh0IiwiY29udGFpbmVyIiwidGV4dENvbnRlbnQiLCJnZXRTYW5pdGl6ZWRIdG1sQm9keSIsImNvbnRlbnQiLCJvcHRzIiwic3RyaXBSZXBseUZhbGxiYWNrIiwicmV0dXJuU3RyaW5nIiwiZm9ybWF0Iiwid3JhcEluc2VydGlvbiIsImNoaWxkIiwid3JhcHBlciIsImNsYXNzTmFtZSIsImFwcGVuZENoaWxkIiwid3JhcERlbGV0aW9uIiwiZmluZFJlZk5vZGVzIiwicm9vdCIsInJvdXRlIiwiaXNBZGRpdGlvbiIsInJlZk5vZGUiLCJyZWZQYXJlbnROb2RlIiwiZW5kIiwibGVuZ3RoIiwiaSIsImNoaWxkTm9kZXMiLCJkaWZmVHJlZVRvRE9NIiwiZGVzYyIsIm5vZGVOYW1lIiwic3RyaW5nQXNUZXh0Tm9kZSIsImRhdGEiLCJub2RlIiwiYXR0cmlidXRlcyIsImtleSIsIk9iamVjdCIsImVudHJpZXMiLCJzZXRBdHRyaWJ1dGUiLCJjaGlsZERlc2MiLCJpbnNlcnRCZWZvcmUiLCJwYXJlbnQiLCJuZXh0U2libGluZyIsImlzUm91dGVPZk5leHRTaWJsaW5nIiwicm91dGUxIiwicm91dGUyIiwibGFzdEQxSWR4IiwiYWRqdXN0Um91dGVzIiwiZGlmZiIsInJlbWFpbmluZ0RpZmZzIiwiYWN0aW9uIiwiYWR2YW5jZSIsInJkIiwiY3JlYXRlVGV4dE5vZGUiLCJyZW5kZXJEaWZmZXJlbmNlSW5ET00iLCJvcmlnaW5hbFJvb3ROb2RlIiwiZGlmZk1hdGhQYXRjaCIsImRlbE5vZGUiLCJvbGRWYWx1ZSIsImluc05vZGUiLCJuZXdWYWx1ZSIsInBhcmVudE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJlbGVtZW50IiwidGV4dERpZmZzIiwiZGlmZl9tYWluIiwiZGlmZl9jbGVhbnVwU2VtYW50aWMiLCJtb2RpZmllciIsInRleHREaWZmTm9kZSIsImNsb25lTm9kZSIsInVwZGF0ZWROb2RlIiwibmFtZSIsInJlbW92ZUF0dHJpYnV0ZSIsImNvbnNvbGUiLCJ3YXJuIiwicm91dGVJc0VxdWFsIiwicjEiLCJyMiIsInNvbWUiLCJlIiwiZmlsdGVyQ2FuY2VsaW5nT3V0RGlmZnMiLCJvcmlnaW5hbERpZmZBY3Rpb25zIiwiZGlmZkFjdGlvbnMiLCJzbGljZSIsIm5leHREaWZmIiwiY2FuY2Vsc091dCIsInNwbGljZSIsImVkaXRCb2R5RGlmZlRvSHRtbCIsIm9yaWdpbmFsQ29udGVudCIsImVkaXRDb250ZW50Iiwib3JpZ2luYWxCb2R5IiwiZWRpdEJvZHkiLCJkZCIsIkRpZmZET00iLCJvcmlnaW5hbGRpZmZBY3Rpb25zIiwiRGlmZk1hdGNoUGF0Y2giLCJET01QYXJzZXIiLCJwYXJzZUZyb21TdHJpbmciLCJib2R5IiwiY2hpbGRyZW4iLCJzYWZlQm9keSIsIl9faHRtbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLE1BQU1BLGNBQWMsR0FBSSxZQUFXO0FBQy9CLE1BQUlDLFFBQVEsR0FBRyxJQUFmO0FBQ0EsU0FBTyxVQUFTQyxNQUFULEVBQWlCO0FBQ3BCLFFBQUksQ0FBQ0QsUUFBTCxFQUFlO0FBQ1hBLE1BQUFBLFFBQVEsR0FBR0UsUUFBUSxDQUFDQyxhQUFULENBQXVCLFVBQXZCLENBQVg7QUFDSDs7QUFDREgsSUFBQUEsUUFBUSxDQUFDSSxTQUFULEdBQXFCSCxNQUFyQjtBQUNBLFdBQU9ELFFBQVEsQ0FBQ0ssS0FBaEI7QUFDSCxHQU5EO0FBT0gsQ0FUc0IsRUFBdkI7O0FBV0EsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEI7QUFDdEIsUUFBTUMsU0FBUyxHQUFHTixRQUFRLENBQUNDLGFBQVQs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QWdCQyxlQUFoQixDQUFnQ1AsWUFBaEMsRUFBOEMsV0FBOUMsRUFBMkRRLElBQTNELENBQWdFQyxRQUFoRSxDQUF5RSxDQUF6RSxDQUF6Qjs7QUFDQSxPQUFLLElBQUl6RSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHd0QsV0FBVyxDQUFDekQsTUFBaEMsRUFBd0MsRUFBRUMsQ0FBMUMsRUFBNkM7QUFDekMsVUFBTXNCLElBQUksR0FBR2tDLFdBQVcsQ0FBQ3hELENBQUQsQ0FBeEI7QUFDQTRCLElBQUFBLHFCQUFxQixDQUFDQyxnQkFBRCxFQUFtQlAsSUFBbkIsRUFBeUJRLGFBQXpCLENBQXJCLENBRnlDLENBR3pDO0FBQ0E7QUFDQTtBQUNBOztBQUNBVCxJQUFBQSxZQUFZLENBQUNDLElBQUQsRUFBT2tDLFdBQVcsQ0FBQ0MsS0FBWixDQUFrQnpELENBQUMsR0FBRyxDQUF0QixDQUFQLENBQVo7QUFDSCxHQXhCNEQsQ0F5QjdEOzs7QUFDQSxRQUFNMEUsUUFBUSxHQUFHN0MsZ0JBQWdCLENBQUN2RCxTQUFsQztBQUNBLFFBQU1lLFNBQVMsR0FBRyx5QkFBVztBQUN6Qix5QkFBcUIsSUFESTtBQUV6QixxQkFBaUI7QUFGUSxHQUFYLENBQWxCO0FBSUEsc0JBQU87QUFBTSxJQUFBLEdBQUcsRUFBQyxNQUFWO0FBQWlCLElBQUEsU0FBUyxFQUFFQSxTQUE1QjtBQUF1QyxJQUFBLHVCQUF1QixFQUFFO0FBQUVzRixNQUFBQSxNQUFNLEVBQUVEO0FBQVYsS0FBaEU7QUFBc0YsSUFBQSxHQUFHLEVBQUM7QUFBMUYsSUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IERpZmZNYXRjaFBhdGNoIGZyb20gJ2RpZmYtbWF0Y2gtcGF0Y2gnO1xuaW1wb3J0IHtEaWZmRE9NfSBmcm9tIFwiZGlmZi1kb21cIjtcbmltcG9ydCB7IGNoZWNrQmxvY2tOb2RlLCBib2R5VG9IdG1sIH0gZnJvbSBcIi4uL0h0bWxVdGlsc1wiO1xuXG5jb25zdCBkZWNvZGVFbnRpdGllcyA9IChmdW5jdGlvbigpIHtcbiAgICBsZXQgdGV4dGFyZWEgPSBudWxsO1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0ZXh0YXJlYSkge1xuICAgICAgICAgICAgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGV4dGFyZWFcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGV4dGFyZWEuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgICAgICByZXR1cm4gdGV4dGFyZWEudmFsdWU7XG4gICAgfTtcbn0pKCk7XG5cbmZ1bmN0aW9uIHRleHRUb0h0bWwodGV4dCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgY29udGFpbmVyLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICByZXR1cm4gY29udGFpbmVyLmlubmVySFRNTDtcbn1cblxuZnVuY3Rpb24gZ2V0U2FuaXRpemVkSHRtbEJvZHkoY29udGVudCkge1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgIHN0cmlwUmVwbHlGYWxsYmFjazogdHJ1ZSxcbiAgICAgICAgcmV0dXJuU3RyaW5nOiB0cnVlLFxuICAgIH07XG4gICAgaWYgKGNvbnRlbnQuZm9ybWF0ID09PSBcIm9yZy5tYXRyaXguY3VzdG9tLmh0bWxcIikge1xuICAgICAgICByZXR1cm4gYm9keVRvSHRtbChjb250ZW50LCBudWxsLCBvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb252ZXJ0IHRoZSBzdHJpbmcgdG8gc29tZXRoaW5nIHRoYXQgY2FuIGJlIHNhZmVseVxuICAgICAgICAvLyBlbWJlZGRlZCBpbiBhbiBodG1sIGRvY3VtZW50LCBlLmcuIHVzZSBodG1sIGVudGl0aWVzIHdoZXJlIG5lZWRlZFxuICAgICAgICAvLyBUaGlzIGlzIGFsc28gbmVlZGVkIHNvIHRoYXQgRGlmZkRPTSB3b3VsZG4ndCBpbnRlcnByZXQgc29tZXRoaW5nXG4gICAgICAgIC8vIGFzIGEgdGFnIHdoZW4gc29tZWJvZHkgdHlwZXMgZS5nLiBcIjwvc2FyY2FzbT5cIlxuXG4gICAgICAgIC8vIGFzIG9wcG9zZWQgdG8gYm9keVRvSHRtbCwgaGVyZSB3ZSBhbHNvIHJlbmRlclxuICAgICAgICAvLyB0ZXh0IG1lc3NhZ2VzIHdpdGggZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwsIHRvIHVuaWZ5XG4gICAgICAgIC8vIHRoZSBjb2RlIHBhdGhzIGFuZCBiZWNhdXNlIHdlIG5lZWQgaHRtbCB0byBzaG93IGRpZmZlcmVuY2VzXG4gICAgICAgIHJldHVybiB0ZXh0VG9IdG1sKGJvZHlUb0h0bWwoY29udGVudCwgbnVsbCwgb3B0cykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gd3JhcEluc2VydGlvbihjaGlsZCkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGNoZWNrQmxvY2tOb2RlKGNoaWxkKSA/IFwiZGl2XCIgOiBcInNwYW5cIik7XG4gICAgd3JhcHBlci5jbGFzc05hbWUgPSBcIm14X0VkaXRIaXN0b3J5TWVzc2FnZV9pbnNlcnRpb25cIjtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gd3JhcERlbGV0aW9uKGNoaWxkKSB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoY2hlY2tCbG9ja05vZGUoY2hpbGQpID8gXCJkaXZcIiA6IFwic3BhblwiKTtcbiAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwibXhfRWRpdEhpc3RvcnlNZXNzYWdlX2RlbGV0aW9uXCI7XG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIGZpbmRSZWZOb2Rlcyhyb290LCByb3V0ZSwgaXNBZGRpdGlvbikge1xuICAgIGxldCByZWZOb2RlID0gcm9vdDtcbiAgICBsZXQgcmVmUGFyZW50Tm9kZTtcbiAgICBjb25zdCBlbmQgPSBpc0FkZGl0aW9uID8gcm91dGUubGVuZ3RoIC0gMSA6IHJvdXRlLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICAgIHJlZlBhcmVudE5vZGUgPSByZWZOb2RlO1xuICAgICAgICByZWZOb2RlID0gcmVmTm9kZS5jaGlsZE5vZGVzW3JvdXRlW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHtyZWZOb2RlLCByZWZQYXJlbnROb2RlfTtcbn1cblxuZnVuY3Rpb24gZGlmZlRyZWVUb0RPTShkZXNjKSB7XG4gICAgaWYgKGRlc2Mubm9kZU5hbWUgPT09IFwiI3RleHRcIikge1xuICAgICAgICByZXR1cm4gc3RyaW5nQXNUZXh0Tm9kZShkZXNjLmRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRlc2Mubm9kZU5hbWUpO1xuICAgICAgICBpZiAoZGVzYy5hdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkZXNjLmF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlc2MuY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZERlc2Mgb2YgZGVzYy5jaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChkaWZmVHJlZVRvRE9NKGNoaWxkRGVzYykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudCwgbmV4dFNpYmxpbmcsIGNoaWxkKSB7XG4gICAgaWYgKG5leHRTaWJsaW5nKSB7XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIG5leHRTaWJsaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNSb3V0ZU9mTmV4dFNpYmxpbmcocm91dGUxLCByb3V0ZTIpIHtcbiAgICAvLyByb3V0ZXMgYXJlIGFycmF5cyB3aXRoIGluZGljZXMsXG4gICAgLy8gdG8gYmUgaW50ZXJwcmV0ZWQgYXMgYSBwYXRoIGluIHRoZSBkb20gdHJlZVxuXG4gICAgLy8gZW5zdXJlIHNhbWUgcGFyZW50XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3V0ZTEubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgICAgIGlmIChyb3V0ZTFbaV0gIT09IHJvdXRlMltpXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHRoZSByb3V0ZTIgaXMgb25seSBhZmZlY3RlZCBieSB0aGUgZGlmZiBvZiByb3V0ZTFcbiAgICAvLyBpbnNlcnRpbmcgYW4gZWxlbWVudCBpZiB0aGUgaW5kZXggYXQgdGhlIGxldmVsIG9mIHRoZVxuICAgIC8vIGxhc3QgZWxlbWVudCBvZiByb3V0ZTEgYmVpbmcgbGFyZ2VyXG4gICAgLy8gKGUuZy4gY29taW5nIGJlaGluZCByb3V0ZTEgYXQgdGhhdCBsZXZlbClcbiAgICBjb25zdCBsYXN0RDFJZHggPSByb3V0ZTEubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gcm91dGUyW2xhc3REMUlkeF0gPj0gcm91dGUxW2xhc3REMUlkeF07XG59XG5cbmZ1bmN0aW9uIGFkanVzdFJvdXRlcyhkaWZmLCByZW1haW5pbmdEaWZmcykge1xuICAgIGlmIChkaWZmLmFjdGlvbiA9PT0gXCJyZW1vdmVUZXh0RWxlbWVudFwiIHx8IGRpZmYuYWN0aW9uID09PSBcInJlbW92ZUVsZW1lbnRcIikge1xuICAgICAgICAvLyBhcyByZW1vdmVkIHRleHQgaXMgbm90IHJlbW92ZWQgZnJvbSB0aGUgaHRtbCwgYnV0IG1hcmtlZCBhcyBkZWxldGVkLFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHJlYWRqdXN0IGluZGljZXMgdGhhdCBhc3N1bWUgdGhlIGN1cnJlbnQgbm9kZSBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAgICBjb25zdCBhZHZhbmNlID0gMTtcbiAgICAgICAgZm9yIChjb25zdCByZCBvZiByZW1haW5pbmdEaWZmcykge1xuICAgICAgICAgICAgaWYgKGlzUm91dGVPZk5leHRTaWJsaW5nKGRpZmYucm91dGUsIHJkLnJvdXRlKSkge1xuICAgICAgICAgICAgICAgIHJkLnJvdXRlW2RpZmYucm91dGUubGVuZ3RoIC0gMV0gKz0gYWR2YW5jZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RyaW5nQXNUZXh0Tm9kZShzdHJpbmcpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGVjb2RlRW50aXRpZXMoc3RyaW5nKSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckRpZmZlcmVuY2VJbkRPTShvcmlnaW5hbFJvb3ROb2RlLCBkaWZmLCBkaWZmTWF0aFBhdGNoKSB7XG4gICAgY29uc3Qge3JlZk5vZGUsIHJlZlBhcmVudE5vZGV9ID0gZmluZFJlZk5vZGVzKG9yaWdpbmFsUm9vdE5vZGUsIGRpZmYucm91dGUpO1xuICAgIHN3aXRjaCAoZGlmZi5hY3Rpb24pIHtcbiAgICAgICAgY2FzZSBcInJlcGxhY2VFbGVtZW50XCI6IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgY29uc3QgZGVsTm9kZSA9IHdyYXBEZWxldGlvbihkaWZmVHJlZVRvRE9NKGRpZmYub2xkVmFsdWUpKTtcbiAgICAgICAgICAgIGNvbnN0IGluc05vZGUgPSB3cmFwSW5zZXJ0aW9uKGRpZmZUcmVlVG9ET00oZGlmZi5uZXdWYWx1ZSkpO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRlbE5vZGUpO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGluc05vZGUpO1xuICAgICAgICAgICAgcmVmTm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb250YWluZXIsIHJlZk5vZGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInJlbW92ZVRleHRFbGVtZW50XCI6IHtcbiAgICAgICAgICAgIGNvbnN0IGRlbE5vZGUgPSB3cmFwRGVsZXRpb24oc3RyaW5nQXNUZXh0Tm9kZShkaWZmLnZhbHVlKSk7XG4gICAgICAgICAgICByZWZOb2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGRlbE5vZGUsIHJlZk5vZGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInJlbW92ZUVsZW1lbnRcIjoge1xuICAgICAgICAgICAgY29uc3QgZGVsTm9kZSA9IHdyYXBEZWxldGlvbihkaWZmVHJlZVRvRE9NKGRpZmYuZWxlbWVudCkpO1xuICAgICAgICAgICAgcmVmTm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChkZWxOb2RlLCByZWZOb2RlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb2RpZnlUZXh0RWxlbWVudFwiOiB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0RGlmZnMgPSBkaWZmTWF0aFBhdGNoLmRpZmZfbWFpbihkaWZmLm9sZFZhbHVlLCBkaWZmLm5ld1ZhbHVlKTtcbiAgICAgICAgICAgIGRpZmZNYXRoUGF0Y2guZGlmZl9jbGVhbnVwU2VtYW50aWModGV4dERpZmZzKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbbW9kaWZpZXIsIHRleHRdIG9mIHRleHREaWZmcykge1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0RGlmZk5vZGUgPSBzdHJpbmdBc1RleHROb2RlKHRleHQpO1xuICAgICAgICAgICAgICAgIGlmIChtb2RpZmllciA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dERpZmZOb2RlID0gd3JhcERlbGV0aW9uKHRleHREaWZmTm9kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RpZmllciA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dERpZmZOb2RlID0gd3JhcEluc2VydGlvbih0ZXh0RGlmZk5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGV4dERpZmZOb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZk5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29udGFpbmVyLCByZWZOb2RlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhZGRFbGVtZW50XCI6IHtcbiAgICAgICAgICAgIGNvbnN0IGluc05vZGUgPSB3cmFwSW5zZXJ0aW9uKGRpZmZUcmVlVG9ET00oZGlmZi5lbGVtZW50KSk7XG4gICAgICAgICAgICBpbnNlcnRCZWZvcmUocmVmUGFyZW50Tm9kZSwgcmVmTm9kZSwgaW5zTm9kZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYWRkVGV4dEVsZW1lbnRcIjoge1xuICAgICAgICAgICAgLy8gWFhYOiBzb21ldGltZXMgZGlmZkRPTSBzYXlzIGluc2VydCBhIG5ld2xpbmUgd2hlbiB0aGVyZSBzaG91bGRuJ3QgYmUgb25lXG4gICAgICAgICAgICAvLyBidXQgd2UgbXVzdCBpbnNlcnQgdGhlIG5vZGUgYW55d2F5IHNvIHRoYXQgd2UgZG9uJ3QgYnJlYWsgdGhlIHJvdXRlIGNoaWxkIElEcy5cbiAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZmlkdXN3cml0ZXIvZGlmZkRPTS9pc3N1ZXMvMTAwXG4gICAgICAgICAgICBjb25zdCBpbnNOb2RlID0gd3JhcEluc2VydGlvbihzdHJpbmdBc1RleHROb2RlKGRpZmYudmFsdWUgIT09IFwiXFxuXCIgPyBkaWZmLnZhbHVlIDogXCJcIikpO1xuICAgICAgICAgICAgaW5zZXJ0QmVmb3JlKHJlZlBhcmVudE5vZGUsIHJlZk5vZGUsIGluc05vZGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZS5nLiB3aGVuIGNoYW5naW5nIGEgdGhlIGhyZWYgb2YgYSBsaW5rLFxuICAgICAgICAvLyBzaG93IHRoZSBsaW5rIHdpdGggb2xkIGhyZWYgYXMgcmVtb3ZlZCBhbmQgd2l0aCB0aGUgbmV3IGhyZWYgYXMgYWRkZWRcbiAgICAgICAgY2FzZSBcInJlbW92ZUF0dHJpYnV0ZVwiOlxuICAgICAgICBjYXNlIFwiYWRkQXR0cmlidXRlXCI6XG4gICAgICAgIGNhc2UgXCJtb2RpZnlBdHRyaWJ1dGVcIjoge1xuICAgICAgICAgICAgY29uc3QgZGVsTm9kZSA9IHdyYXBEZWxldGlvbihyZWZOb2RlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVkTm9kZSA9IHJlZk5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgaWYgKGRpZmYuYWN0aW9uID09PSBcImFkZEF0dHJpYnV0ZVwiIHx8IGRpZmYuYWN0aW9uID09PSBcIm1vZGlmeUF0dHJpYnV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlZE5vZGUuc2V0QXR0cmlidXRlKGRpZmYubmFtZSwgZGlmZi5uZXdWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVwZGF0ZWROb2RlLnJlbW92ZUF0dHJpYnV0ZShkaWZmLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW5zTm9kZSA9IHdyYXBJbnNlcnRpb24odXBkYXRlZE5vZGUpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChjaGVja0Jsb2NrTm9kZShyZWZOb2RlKSA/IFwiZGl2XCIgOiBcInNwYW5cIik7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZGVsTm9kZSk7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5zTm9kZSk7XG4gICAgICAgICAgICByZWZOb2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNvbnRhaW5lciwgcmVmTm9kZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4gKG1vZGlmeUNvbW1lbnQsID8/PylcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk1lc3NhZ2VEaWZmVXRpbHM6OmVkaXRCb2R5RGlmZlRvSHRtbDogZGlmZiBhY3Rpb24gbm90IHN1cHBvcnRlZCBhdG1cIiwgZGlmZik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByb3V0ZUlzRXF1YWwocjEsIHIyKSB7XG4gICAgcmV0dXJuIHIxLmxlbmd0aCA9PT0gcjIubGVuZ3RoICYmICFyMS5zb21lKChlLCBpKSA9PiBlICE9PSByMltpXSk7XG59XG5cbi8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9maWR1c3dyaXRlci9kaWZmRE9NL2lzc3Vlcy85MFxuZnVuY3Rpb24gZmlsdGVyQ2FuY2VsaW5nT3V0RGlmZnMob3JpZ2luYWxEaWZmQWN0aW9ucykge1xuICAgIGNvbnN0IGRpZmZBY3Rpb25zID0gb3JpZ2luYWxEaWZmQWN0aW9ucy5zbGljZSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmQWN0aW9ucy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBkaWZmID0gZGlmZkFjdGlvbnNbaV07XG4gICAgICAgIGlmIChkaWZmLmFjdGlvbiA9PT0gXCJyZW1vdmVUZXh0RWxlbWVudFwiKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0RGlmZiA9IGRpZmZBY3Rpb25zW2kgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IGNhbmNlbHNPdXQgPSBuZXh0RGlmZiAmJlxuICAgICAgICAgICAgICAgIG5leHREaWZmLmFjdGlvbiA9PT0gXCJhZGRUZXh0RWxlbWVudFwiICYmXG4gICAgICAgICAgICAgICAgbmV4dERpZmYudGV4dCA9PT0gZGlmZi50ZXh0ICYmXG4gICAgICAgICAgICAgICAgcm91dGVJc0VxdWFsKG5leHREaWZmLnJvdXRlLCBkaWZmLnJvdXRlKTtcblxuICAgICAgICAgICAgaWYgKGNhbmNlbHNPdXQpIHtcbiAgICAgICAgICAgICAgICBkaWZmQWN0aW9ucy5zcGxpY2UoaSwgMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGlmZkFjdGlvbnM7XG59XG5cbi8qKlxuICogUmVuZGVycyBhIG1lc3NhZ2Ugd2l0aCB0aGUgY2hhbmdlcyBtYWRlIGluIGFuIGVkaXQgc2hvd24gdmlzdWFsbHkuXG4gKiBAcGFyYW0ge29iamVjdH0gb3JpZ2luYWxDb250ZW50IHRoZSBjb250ZW50IGZvciB0aGUgYmFzZSBtZXNzYWdlXG4gKiBAcGFyYW0ge29iamVjdH0gZWRpdENvbnRlbnQgdGhlIGNvbnRlbnQgZm9yIHRoZSBlZGl0IG1lc3NhZ2VcbiAqIEByZXR1cm4ge29iamVjdH0gYSByZWFjdCBlbGVtZW50IHNpbWlsYXIgdG8gd2hhdCBgYm9keVRvSHRtbGAgcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZWRpdEJvZHlEaWZmVG9IdG1sKG9yaWdpbmFsQ29udGVudCwgZWRpdENvbnRlbnQpIHtcbiAgICAvLyB3cmFwIHRoZSBib2R5IGluIGEgZGl2LCBEaWZmRE9NIG5lZWRzIGEgcm9vdCBlbGVtZW50XG4gICAgY29uc3Qgb3JpZ2luYWxCb2R5ID0gYDxkaXY+JHtnZXRTYW5pdGl6ZWRIdG1sQm9keShvcmlnaW5hbENvbnRlbnQpfTwvZGl2PmA7XG4gICAgY29uc3QgZWRpdEJvZHkgPSBgPGRpdj4ke2dldFNhbml0aXplZEh0bWxCb2R5KGVkaXRDb250ZW50KX08L2Rpdj5gO1xuICAgIGNvbnN0IGRkID0gbmV3IERpZmZET00oKTtcbiAgICAvLyBkaWZmQWN0aW9ucyBpcyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGggYXQgbGVhc3QgYSBgYWN0aW9uYCBhbmQgYHJvdXRlYFxuICAgIC8vIHByb3BlcnR5LiBgYWN0aW9uYCB0ZWxscyB1cyB3aGF0IHRoZSBkaWZmIG9iamVjdCBjaGFuZ2VzLCBhbmQgYHJvdXRlYCB3aGVyZS5cbiAgICAvLyBgcm91dGVgIGlzIGEgcGF0aCBvbiB0aGUgRE9NIHRyZWUgZXhwcmVzc2VkIGFzIGFuIGFycmF5IG9mIGluZGljZXMuXG4gICAgY29uc3Qgb3JpZ2luYWxkaWZmQWN0aW9ucyA9IGRkLmRpZmYob3JpZ2luYWxCb2R5LCBlZGl0Qm9keSk7XG4gICAgLy8gd29yayBhcm91bmQgaHR0cHM6Ly9naXRodWIuY29tL2ZpZHVzd3JpdGVyL2RpZmZET00vaXNzdWVzLzkwXG4gICAgY29uc3QgZGlmZkFjdGlvbnMgPSBmaWx0ZXJDYW5jZWxpbmdPdXREaWZmcyhvcmlnaW5hbGRpZmZBY3Rpb25zKTtcbiAgICAvLyBmb3IgZGlmZmluZyB0ZXh0IGZyYWdtZW50c1xuICAgIGNvbnN0IGRpZmZNYXRoUGF0Y2ggPSBuZXcgRGlmZk1hdGNoUGF0Y2goKTtcbiAgICAvLyBwYXJzZSB0aGUgYmFzZSBodG1sIG1lc3NhZ2UgYXMgYSBET00gdHJlZSwgdG8gd2hpY2ggd2UnbGwgYXBwbHkgdGhlIGRpZmZlcmVuY2VzIGZvdW5kLlxuICAgIC8vIGZpc2ggb3V0IHRoZSBkaXYgaW4gd2hpY2ggd2Ugd3JhcHBlZCB0aGUgbWVzc2FnZXMgYWJvdmUgd2l0aCBjaGlsZHJlblswXS5cbiAgICBjb25zdCBvcmlnaW5hbFJvb3ROb2RlID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhvcmlnaW5hbEJvZHksIFwidGV4dC9odG1sXCIpLmJvZHkuY2hpbGRyZW5bMF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmQWN0aW9ucy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBkaWZmID0gZGlmZkFjdGlvbnNbaV07XG4gICAgICAgIHJlbmRlckRpZmZlcmVuY2VJbkRPTShvcmlnaW5hbFJvb3ROb2RlLCBkaWZmLCBkaWZmTWF0aFBhdGNoKTtcbiAgICAgICAgLy8gRGlmZkRPTSBhc3N1bWVzIGluIHN1YnNlcXVlbnQgZGlmZnMgcm91dGUgcGF0aCB0aGF0XG4gICAgICAgIC8vIHRoZSBhY3Rpb24gd2FzIGFwcGxpZWQgKGUuZy4gdGhhdCBhIHJlbW92ZUVsZW1lbnQgYWN0aW9uIHJlbW92ZWQgdGhlIGVsZW1lbnQpLlxuICAgICAgICAvLyBUaGlzIGlzIG5vdCB0aGUgY2FzZSBmb3IgdXMuIFdlIHJlbmRlciBkaWZmZXJlbmNlcyBpbiB0aGUgRE9NIHRyZWUsIGFuZCBkb24ndCBhcHBseSB0aGVtLlxuICAgICAgICAvLyBTbyB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgcm91dGVzIG9mIHRoZSByZW1haW5pbmcgZGlmZnMgdG8gYWNjb3VudCBmb3IgdGhpcy5cbiAgICAgICAgYWRqdXN0Um91dGVzKGRpZmYsIGRpZmZBY3Rpb25zLnNsaWNlKGkgKyAxKSk7XG4gICAgfVxuICAgIC8vIHRha2UgdGhlIGh0bWwgb3V0IG9mIHRoZSBtb2RpZmllZCBET00gdHJlZSBhZ2FpblxuICAgIGNvbnN0IHNhZmVCb2R5ID0gb3JpZ2luYWxSb290Tm9kZS5pbm5lckhUTUw7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICdteF9FdmVudFRpbGVfYm9keSc6IHRydWUsXG4gICAgICAgICdtYXJrZG93bi1ib2R5JzogdHJ1ZSxcbiAgICB9KTtcbiAgICByZXR1cm4gPHNwYW4ga2V5PVwiYm9keVwiIGNsYXNzTmFtZT17Y2xhc3NOYW1lfSBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHNhZmVCb2R5IH19IGRpcj1cImF1dG9cIiAvPjtcbn1cbiJdfQ==